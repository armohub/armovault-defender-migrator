<#
.SYNOPSIS
  Read-only inventory of your Microsoft Sentinel workspaces for the ArMo MS Defender Migration Assistant.

.DESCRIPTION
  Run it with no parameters: it finds every workspace with Microsoft Sentinel that you can read, and writes one
  inventory file per workspace. The assistant uses the files to fill in your workspace list and to suggest answers
  to its questions. You confirm every suggestion.

  WHAT IT COLLECTS, PER WORKSPACE
    - Analytics rules and data connectors (both API versions), automation rules and watchlists.
    - The Sentinel onboarding state (customer-managed keys), the Sentinel settings (UEBA, entity analytics,
      anomalies), workspace manager, repositories, bookmarks, hunts, and the workbooks and playbooks installed from
      the content hub.
    - Logic Apps in the workspace's subscription that use the Microsoft Sentinel connector, and whether they also use
      a ticketing connector. This part needs Reader on the Logic Apps: Microsoft Sentinel Reader does not include it.
    - Role assignments at or above the workspace, as counts only.
    - The tenant as a short fingerprint (never its ID), whether the subscription is delegated through Azure
      Lighthouse, and the Azure cloud you signed in to.

  WHAT IT DOES
    - Sends GET requests only, through Invoke-AzRestMethod. It never creates, changes or deletes anything.
    - Computes flags locally and writes ONLY names, kinds, flags and counts. It does not write rule queries, Logic App
      definitions, incident data, entities, principal IDs, tenant, subscription or resource group IDs, or credentials.
    - If one part fails (for example HTTP 403), the file says which part, and the other parts are still collected.
  WHAT IT DOES NOT DO
    - It does not sign you in, store tokens, or send data anywhere other than Azure Resource Manager.
    - It does not read Defender portal settings (no documented API was found for those).

  REQUIREMENTS
    - PowerShell 7+ or Windows PowerShell 5.1 with the Az.Accounts module, and an existing session: Connect-AzAccount
    - Microsoft Sentinel Reader (or higher) on the workspaces' resource groups. Reader also covers the Logic Apps.

  STATUS
    - Composed for this project from the documented REST APIs (Microsoft Sentinel 2025-09-01 and 2025-07-01-preview).
      Not yet validated against a live customer tenant by the authors. Review it before running.
    - Review the output files before importing or sharing them: rule, watchlist and playbook names can be sensitive.

  FIND YOUR WORKSPACES (THE DEFAULT)
    - Lists the subscriptions you can read, the Log Analytics workspaces in each, and keeps those where Microsoft
      Sentinel is enabled (it has an onboarding state).
    - Writes workspaces.json (the list it found) and one inventory-<name>.json per workspace to -OutFolder.
    - The alias of each workspace is its workspace name. Change aliases later in the assistant if you prefer.
    - Workspaces in different resource groups can share a name. The second one is saved as <name>-2, the third as
      <name>-3, and so on; workspaces.json shows which is which.
    - A workspace whose check fails (for example HTTP 403, no access) is named in a warning, not skipped silently.
    - Limit the search with -Subscriptions '<id>','<id>'. -Discover is still accepted.

  ONE WORKSPACE
    - Pass -SubscriptionId, -ResourceGroupName and -WorkspaceName. The alias is the workspace name unless you pass
      -WorkspaceAlias, and the file is inventory-<alias>.json unless you pass -OutFile.

  SEVERAL WORKSPACES FROM A LIST
    - Pass -WorkspacesFile with a JSON list of workspaces, and optionally -OutFolder. The script writes one file per
      workspace, named inventory-<alias>.json, which you can import into the app together.
    - Each entry needs subscriptionId, resourceGroupName, workspaceName and alias. Aliases must be unique.
    - The list holds resource names only. Do not put secrets, tokens or passwords in it.
    - If one workspace fails, the others are still collected, and the run ends with a summary.

.EXAMPLE
  # Find every Sentinel workspace you can read, and collect each one:
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -OutFolder .\inventory

.EXAMPLE
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -SubscriptionId '<id>' -ResourceGroupName '<rg>' -WorkspaceName '<ws>'

.EXAMPLE
  # workspaces.json:
  # [
  #   { "subscriptionId": "<id>", "resourceGroupName": "<rg>", "workspaceName": "<ws1>", "alias": "SOC-PROD-EU" },
  #   { "subscriptionId": "<id>", "resourceGroupName": "<rg>", "workspaceName": "<ws2>", "alias": "SOC-PROD-US" }
  # ]
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -WorkspacesFile .\workspaces.json -OutFolder .\inventory
#>
[CmdletBinding(DefaultParameterSetName = 'Discover')]
param(
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $SubscriptionId,
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $ResourceGroupName,
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $WorkspaceName,
  [Parameter(ParameterSetName = 'One')][string] $WorkspaceAlias = '',
  [Parameter(ParameterSetName = 'One')][string] $OutFile = '',
  [Parameter(Mandatory = $true, ParameterSetName = 'List')][string] $WorkspacesFile,
  [Parameter(ParameterSetName = 'List')][Parameter(ParameterSetName = 'Discover')][string] $OutFolder = '.',
  [Parameter(ParameterSetName = 'Discover')][switch] $Discover,
  [Parameter(ParameterSetName = 'Discover')][string[]] $Subscriptions = @()
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue)) {
  throw 'Invoke-AzRestMethod was not found. Install the Az.Accounts module and run Connect-AzAccount first.'
}

$script:errors = New-Object System.Collections.Generic.List[string]
# Managed API names of ticketing connectors, as in their Logic Apps connector reference pages.
$script:ticketingApis = @('service-now', 'jira')

# -NotFoundIsEmpty: for features that may not be set up (workspace manager, hunts), HTTP 404 means "none", not a failure.
function Get-AllPages([string] $Path, [switch] $NotFoundIsEmpty) {
  $items = @()
  $next = $Path
  while ($next) {
    $resp = Invoke-AzRestMethod -Path $next -Method GET
    if ($NotFoundIsEmpty -and $resp.StatusCode -eq 404) { break }
    if ($resp.StatusCode -ne 200) {
      # Record only the resource type and status code - never the subscription, resource group or workspace path.
      $resourceType = ($Path.Split('?')[0]).Split('/')[-1]
      $script:errors.Add("GET $resourceType returned HTTP $($resp.StatusCode)")
      break
    }
    $body = $resp.Content | ConvertFrom-Json
    $values = Get-Prop $body @('value')
    if ($values) { $items += $values }
    $next = $null
    $nextLink = Get-Prop $body @('nextLink')
    if ($nextLink) { $next = ([uri]$nextLink).PathAndQuery }
  }
  return ,$items
}

# One resource. Failures are recorded under the label given, never under the path.
function Get-One([string] $Path, [string] $Label) {
  $resp = Invoke-AzRestMethod -Path $Path -Method GET
  if ($resp.StatusCode -ne 200) { $script:errors.Add("GET $Label returned HTTP $($resp.StatusCode)"); return $null }
  return ($resp.Content | ConvertFrom-Json)
}

function Get-Prop($Object, [string[]] $Path) {
  $cur = $Object
  foreach ($p in $Path) {
    if ($null -eq $cur) { return $null }
    # Properties[name] is safe on an object with no properties (for example "parameters": {}), where reading
    # .Properties.Name throws under StrictMode in Windows PowerShell 5.1.
    $prop = $cur.PSObject.Properties[$p]
    if ($null -eq $prop) { return $null }
    $cur = $prop.Value
  }
  return $cur
}

# The file-name part for an alias: letters, digits, dots, underscores and hyphens. Anything else becomes a hyphen.
function ConvertTo-SafeName([string] $Alias) {
  return ($Alias -replace '[^A-Za-z0-9._-]+', '-').Trim('-')
}

# The tenant as a short fingerprint: the first 8 hex characters of the SHA-256 of its ID. It tells tenants apart
# without writing the ID.
function Get-TenantRef([string] $TenantId) {
  if (-not $TenantId) { return '' }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { $bytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($TenantId.ToLowerInvariant())) } finally { $sha.Dispose() }
  return 't-' + (($bytes[0..3] | ForEach-Object { $_.ToString('x2') }) -join '')
}

$script:subscriptionInfo = @{}
function Get-SubscriptionInfo([string] $Id) {
  if (-not $script:subscriptionInfo.ContainsKey($Id)) {
    $sub = Get-One "/subscriptions/${Id}?api-version=2022-12-01" 'subscription'
    $managed = Get-Prop $sub @('managedByTenants')
    $info = @{ tenantRef = (Get-TenantRef ([string](Get-Prop $sub @('tenantId')))); delegated = [bool]($managed -and @($managed).Count) }
    # A failed lookup is not remembered: the next workspace in this subscription tries again.
    if ($null -eq $sub) { return $info }
    $script:subscriptionInfo[$Id] = $info
  }
  return $script:subscriptionInfo[$Id]
}

# The Azure cloud of your Az sign-in (AzureCloud, AzureUSGovernment, AzureChinaCloud). Read locally, no request.
function Get-CloudName {
  $ctx = $null
  if (Get-Command Get-AzContext -ErrorAction SilentlyContinue) { try { $ctx = Get-AzContext } catch { $ctx = $null } }
  return [string](Get-Prop (Get-Prop $ctx @('Environment')) @('Name'))
}
$script:cloud = Get-CloudName

# Collects one workspace and writes its file. Returns the number of failed requests.
function Invoke-WorkspaceInventory([string] $SubscriptionId, [string] $ResourceGroupName, [string] $WorkspaceName, [string] $WorkspaceAlias, [string] $OutFile, [string] $Region = '') {
  $script:errors = New-Object System.Collections.Generic.List[string]
  if (-not $WorkspaceAlias) { $WorkspaceAlias = $WorkspaceName }
  $wsPath = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$WorkspaceName"
  $base = "$wsPath/providers/Microsoft.SecurityInsights"
  $sub = Get-SubscriptionInfo $SubscriptionId
  # The alias defaults to the workspace name. An alias you give keeps the real name out of the file.
  # Each part records whether all its requests succeeded, so the assistant knows what a missing finding means.
  $collected = [ordered]@{}

  # Analytics rules: query both API versions because the stable version enumerates fewer rule kinds.
  $n = $script:errors.Count
  $rules = @{}
  foreach ($api in @('2025-09-01', '2025-07-01-preview')) {
    foreach ($r in (Get-AllPages "$base/alertRules?api-version=$api")) {
      $ruleId = [string](Get-Prop $r @('name'))
      if (-not $ruleId -or $rules.ContainsKey($ruleId)) { continue }
      $p = Get-Prop $r @('properties')
      $query = [string](Get-Prop $p @('query'))
      $description = [string](Get-Prop $p @('description'))
      $tag = ''
      if ($description -match '^\s*#(INC|DONT)_CORR#') { $tag = $Matches[0].Trim() }
      $rules[$ruleId] = [ordered]@{
        name             = [string](Get-Prop $p @('displayName'))
        kind             = [string](Get-Prop $r @('kind'))
        enabled          = [bool](Get-Prop $p @('enabled'))
        createIncident   = Get-Prop $p @('incidentConfiguration', 'createIncident')
        groupingEnabled  = Get-Prop $p @('incidentConfiguration', 'groupingConfiguration', 'enabled')
        reopenClosed     = Get-Prop $p @('incidentConfiguration', 'groupingConfiguration', 'reopenClosedIncident')
        correlationTag   = $tag
        usesIdentityInfo = [bool]($query -match 'IdentityInfo')
        usesLegacyTI     = [bool]($query -match 'ThreatIntelligenceIndicator')
        usesTI           = [bool]($query -match 'ThreatIntelligenceIndicator|ThreatIntelIndicators|ThreatIntelObjects')
        productFilter    = [string](Get-Prop $p @('productFilter'))
        apiVersion       = $api
      }
    }
  }
  $collected.analyticsRules = ($script:errors.Count -eq $n)

  # Automation rules
  $n = $script:errors.Count
  $risky = @('IncidentProviderName', 'IncidentTitle', 'IncidentDescription', 'IncidentUpdatedBySource')
  $automation = foreach ($a in (Get-AllPages "$base/automationRules?api-version=2025-09-01")) {
    $logic = Get-Prop $a @('properties', 'triggeringLogic')
    $json = $logic | ConvertTo-Json -Depth 30
    $actions = @(Get-Prop $a @('properties', 'actions'))
    [ordered]@{
      name            = [string](Get-Prop $a @('properties', 'displayName'))
      enabled         = [bool](Get-Prop $logic @('isEnabled'))
      triggersOn      = [string](Get-Prop $logic @('triggersOn'))
      triggersWhen    = [string](Get-Prop $logic @('triggersWhen'))
      riskyConditions = @($risky | Where-Object { $json -match [regex]::Escape($_) })
      playbookActions = @($actions | Where-Object { (Get-Prop $_ @('actionType')) -eq 'RunPlaybook' }).Count
      taskActions     = @($actions | Where-Object { (Get-Prop $_ @('actionType')) -eq 'AddIncidentTask' }).Count
    }
  }
  $collected.automationRules = ($script:errors.Count -eq $n)

  # Data connectors: both API versions, because the stable version lists fewer kinds (for example not OfficeIRM).
  $n = $script:errors.Count
  $byName = [ordered]@{}
  foreach ($api in @('2025-09-01', '2025-07-01-preview')) {
    foreach ($c in (Get-AllPages "$base/dataConnectors?api-version=$api")) {
      $cn = [string](Get-Prop $c @('name'))
      if (-not $cn -or $byName.Contains($cn)) { continue }
      # The title is the name the portal shows on the Data connectors page, when the connector has one.
      $byName[$cn] = [ordered]@{ kind = [string](Get-Prop $c @('kind')); name = $cn; title = [string](Get-Prop $c @('properties', 'connectorUiConfig', 'title')) }
    }
  }
  $connectors = @($byName.Values)
  $collected.dataConnectors = ($script:errors.Count -eq $n)

  $n = $script:errors.Count
  $watchlists = foreach ($w in (Get-AllPages "$base/watchlists?api-version=2025-09-01")) { [ordered]@{ alias = [string](Get-Prop $w @('properties', 'watchlistAlias')); name = [string](Get-Prop $w @('properties', 'displayName')) } }
  $collected.watchlists = ($script:errors.Count -eq $n)

  # Onboarding state: whether the workspace uses customer-managed keys.
  $n = $script:errors.Count
  $cmk = $false
  foreach ($st in (Get-AllPages "$base/onboardingStates?api-version=2025-09-01")) { if ((Get-Prop $st @('properties', 'customerManagedKey')) -eq $true) { $cmk = $true } }
  $collected.onboarding = ($script:errors.Count -eq $n)

  # Sentinel settings (preview API). UEBA counts as on when it has data sources, entity analytics when it has providers.
  $n = $script:errors.Count
  $settings = [ordered]@{ ueba = $false; entityAnalytics = $false; anomalies = $false }
  foreach ($st in (Get-AllPages "$base/settings?api-version=2025-07-01-preview")) {
    $kind = [string](Get-Prop $st @('kind'))
    if ($kind -eq 'Ueba' -and @(Get-Prop $st @('properties', 'dataSources') | Where-Object { $_ }).Count) { $settings.ueba = $true }
    if ($kind -eq 'EntityAnalytics' -and @(Get-Prop $st @('properties', 'entityProviders') | Where-Object { $_ }).Count) { $settings.entityAnalytics = $true }
    if ($kind -eq 'Anomalies' -and (Get-Prop $st @('properties', 'isEnabled')) -eq $true) { $settings.anomalies = $true }
  }
  $collected.settings = ($script:errors.Count -eq $n)

  # Workspace manager (preview API). Not set up (HTTP 404) means not used; members are read only when it is on.
  $n = $script:errors.Count
  $manager = [ordered]@{ enabled = $false; members = 0 }
  foreach ($cfg in (Get-AllPages "$base/workspaceManagerConfigurations?api-version=2025-07-01-preview" -NotFoundIsEmpty)) { if ([string](Get-Prop $cfg @('properties', 'mode')) -eq 'Enabled') { $manager.enabled = $true } }
  if ($manager.enabled) {
    $members = Get-AllPages "$base/workspaceManagerMembers?api-version=2025-07-01-preview" -NotFoundIsEmpty
    $manager.members = @($members).Count
  }
  $collected.workspaceManager = ($script:errors.Count -eq $n)

  # Repositories (content as code).
  $n = $script:errors.Count
  $repos = Get-AllPages "$base/sourcecontrols?api-version=2025-09-01"
  $repositories = [ordered]@{ count = @($repos).Count; huntingQueries = [bool](@($repos | Where-Object { @(Get-Prop $_ @('properties', 'contentTypes')) -contains 'HuntingQuery' }).Count) }
  $collected.repositories = ($script:errors.Count -eq $n)

  $n = $script:errors.Count
  $bookmarks = Get-AllPages "$base/bookmarks?api-version=2025-09-01"
  $collected.bookmarks = ($script:errors.Count -eq $n)
  $n = $script:errors.Count
  $hunts = Get-AllPages "$base/hunts?api-version=2025-07-01-preview" -NotFoundIsEmpty
  $collected.hunts = ($script:errors.Count -eq $n)

  # Content installed from the content hub or a repository, from the Sentinel metadata.
  $n = $script:errors.Count
  $meta = Get-AllPages "$base/metadata?api-version=2025-09-01"
  $installed = [ordered]@{
    workbooks = @($meta | Where-Object { [string](Get-Prop $_ @('properties', 'kind')) -eq 'Workbook' }).Count
    playbooks = @($meta | Where-Object { [string](Get-Prop $_ @('properties', 'kind')) -eq 'Playbook' }).Count
  }
  $collected.installedContent = ($script:errors.Count -eq $n)

  # Logic Apps in the subscription that use the Microsoft Sentinel connector. Only names and connector names are read.
  $n = $script:errors.Count
  $playbooks = New-Object System.Collections.Generic.List[object]
  foreach ($la in (Get-AllPages "/subscriptions/$SubscriptionId/providers/Microsoft.Logic/workflows?api-version=2019-05-01")) {
    $conns = Get-Prop $la @('properties', 'parameters', '$connections', 'value')
    if ($null -eq $conns) { continue }
    $apis = @($conns.PSObject.Properties | ForEach-Object { ([string](Get-Prop $_.Value @('id'))).Split('/')[-1].ToLowerInvariant() })
    if ($apis -notcontains 'azuresentinel') { continue }
    $playbooks.Add([ordered]@{ name = [string](Get-Prop $la @('name')); ticketing = [bool](@($apis | Where-Object { $script:ticketingApis -contains $_ }).Count) })
  }
  $collected.logicApps = ($script:errors.Count -eq $n)

  # Role assignments at or above the workspace, as counts. Principal IDs and role names are never written.
  $n = $script:errors.Count
  $roles = @{}
  $access = [ordered]@{ spWithSentinelRoles = 0; spWithReadOnlyRoles = 0; tableLevelRestrictions = 0 }
  foreach ($ra in (Get-AllPages "$wsPath/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&`$filter=atScope()")) {
    $p = Get-Prop $ra @('properties')
    $defId = [string](Get-Prop $p @('roleDefinitionId'))
    $role = $null
    if ($defId) {
      if (-not $roles.ContainsKey($defId)) {
        $def = Get-One "${defId}?api-version=2022-04-01" 'roleDefinitions'
        $actions = @(@(Get-Prop $def @('properties', 'permissions')) | ForEach-Object { @(Get-Prop $_ @('actions')) } | Where-Object { $_ })
        $roles[$defId] = @{ name = [string](Get-Prop $def @('properties', 'roleName')); actions = $actions; tableActions = [bool](@($actions | Where-Object { $_ -match '^Microsoft\.OperationalInsights/workspaces/query/[^*/]+/read$' }).Count) }
      }
      $role = $roles[$defId]
    }
    # A role gives Sentinel access when it is a Sentinel or Log Analytics role, or allows everything (Owner,
    # Contributor, Reader) or Sentinel or Log Analytics actions (custom roles). Read-only: every action is a read.
    $grants = $role -and (($role.name -match 'Sentinel|Log Analytics') -or @($role.actions | Where-Object { $_ -eq '*' -or $_ -eq '*/read' -or $_ -match '^Microsoft\.(SecurityInsights|OperationalInsights)/' }).Count)
    if ([string](Get-Prop $p @('principalType')) -eq 'ServicePrincipal' -and $grants) {
      $access.spWithSentinelRoles += 1
      if (@($role.actions).Count -and -not @($role.actions | Where-Object { $_ -notmatch '/read$' }).Count) { $access.spWithReadOnlyRoles += 1 }
    }
    if (([string](Get-Prop $p @('condition')) -match 'Microsoft\.OperationalInsights/workspaces/tables') -or ($role -and $role.tableActions)) { $access.tableLevelRestrictions += 1 }
  }
  $collected.access = ($script:errors.Count -eq $n)

  $result = [ordered]@{
    schema           = 'armohub.dma.inventory'
    schemaVersion    = 2
    tool             = [ordered]@{ name = 'Get-ArMoSentinelInventory.ps1'; version = '1.0.0' }
    collectedAt      = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ', [System.Globalization.CultureInfo]::InvariantCulture)
    workspace        = [ordered]@{ alias = $WorkspaceAlias; region = $Region; tenantRef = $sub.tenantRef; delegated = $sub.delegated; cloud = $script:cloud; customerManagedKey = $cmk }
    analyticsRules   = @($rules.Values)
    automationRules  = @($automation)
    dataConnectors   = @($connectors)
    watchlists       = @($watchlists)
    settings         = $settings
    workspaceManager = $manager
    repositories     = $repositories
    bookmarks        = @($bookmarks).Count
    hunts            = @($hunts).Count
    installedContent = $installed
    logicApps        = [ordered]@{ sentinelPlaybooks = $playbooks.ToArray() }
    access           = $access
    collected        = $collected
    errors           = @($script:errors)
  }

  $result | ConvertTo-Json -Depth 8 | Out-File -FilePath $OutFile -Encoding utf8
  Write-Host "Inventory written to $OutFile - $($rules.Count) analytics rules, $(@($automation).Count) automation rules, $(@($connectors).Count) connectors, $(@($watchlists).Count) watchlists, $($playbooks.Count) Sentinel playbooks."
  $missing = @($collected.Keys | Where-Object { -not $collected[$_] })
  if ($script:errors.Count) { Write-Warning ("Some requests failed: " + ($script:errors -join '; ') + '.' + $(if ($missing.Count) { ' Not collected: ' + ($missing -join ', ') + '.' } else { '' })) }
  return $script:errors.Count
}

if ($PSCmdlet.ParameterSetName -eq 'One') {
  $alias = if ($WorkspaceAlias) { $WorkspaceAlias } else { $WorkspaceName }
  if (-not $OutFile) { $OutFile = ".\inventory-$(ConvertTo-SafeName $alias).json" }
  [void](Invoke-WorkspaceInventory $SubscriptionId $ResourceGroupName $WorkspaceName $alias $OutFile)
  Write-Host 'Review the file before importing it into the app or sharing it.'
  return
}

$unchecked = New-Object System.Collections.Generic.List[string]
if ($PSCmdlet.ParameterSetName -eq 'Discover') {
  # Find the Sentinel-enabled workspaces: subscriptions you can read, their workspaces, and an onboarding state each.
  $script:errors = New-Object System.Collections.Generic.List[string]
  $subs = @($Subscriptions | Where-Object { $_ })
  if (-not $subs.Count) {
    $subs = @(foreach ($sb in (Get-AllPages '/subscriptions?api-version=2022-12-01')) { if ([string](Get-Prop $sb @('state')) -eq 'Enabled') { [string](Get-Prop $sb @('subscriptionId')) } })
  }
  if (-not $subs.Count) { throw 'No subscription found. Check that Connect-AzAccount signed in to the right tenant.' }
  Write-Host "Looking for Microsoft Sentinel workspaces in $($subs.Count) subscription(s) ..."
  $found = New-Object System.Collections.Generic.List[object]
  $taken = @{}
  $renamed = New-Object System.Collections.Generic.List[string]
  foreach ($sub in $subs) {
    foreach ($ws in (Get-AllPages "/subscriptions/$sub/providers/Microsoft.OperationalInsights/workspaces?api-version=2025-07-01")) {
      $wsName = [string](Get-Prop $ws @('name'))
      $parts = ([string](Get-Prop $ws @('id'))).Split('/')
      if (-not $wsName -or $parts.Count -lt 5) { continue }
      $rg = $parts[4]
      $state = Invoke-AzRestMethod -Path "/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.OperationalInsights/workspaces/$wsName/providers/Microsoft.SecurityInsights/onboardingStates?api-version=2025-09-01" -Method GET
      # 404 means the workspace has no Microsoft Sentinel. Any other failure (for example 403, no access) is reported.
      if ($state.StatusCode -eq 404) { continue }
      if ($state.StatusCode -ne 200) { $unchecked.Add("$wsName (HTTP $($state.StatusCode))"); continue }
      $states = Get-Prop ($state.Content | ConvertFrom-Json) @('value')
      if (-not @($states).Count) { continue }
      # Workspace names are unique only within a resource group, so give each workspace its own alias and file.
      $alias = $wsName
      $k = 1
      while ($taken.ContainsKey((ConvertTo-SafeName $alias).ToLowerInvariant())) { $k += 1; $alias = "$wsName-$k" }
      $taken[(ConvertTo-SafeName $alias).ToLowerInvariant()] = $true
      if ($k -gt 1) { $renamed.Add($alias) }
      $found.Add([pscustomobject]@{ subscriptionId = $sub; resourceGroupName = $rg; workspaceName = $wsName; alias = $alias; region = [string](Get-Prop $ws @('location')) })
    }
  }
  if ($script:errors.Count) { Write-Warning ('Some requests failed while searching: ' + ($script:errors -join '; ')) }
  if ($unchecked.Count) { Write-Warning ('These workspaces could not be checked for Microsoft Sentinel, so they are not in the list: ' + ($unchecked -join '; ') + '. If one of them runs Sentinel, check that you can read it (Microsoft Sentinel Reader), or list it in a workspaces file and run again with -WorkspacesFile.') }
  if (-not $found.Count) {
    if ($unchecked.Count) { throw "No Microsoft Sentinel workspace found, and $($unchecked.Count) workspace(s) could not be checked. See the warning above." }
    throw 'No Microsoft Sentinel workspace found in the subscriptions you can read.'
  }
  if (-not (Test-Path -LiteralPath $OutFolder)) { New-Item -ItemType Directory -Path $OutFolder | Out-Null }
  ConvertTo-Json -InputObject $found.ToArray() -Depth 4 | Out-File -FilePath (Join-Path $OutFolder 'workspaces.json') -Encoding utf8
  if ($renamed.Count) { Write-Warning ('Some workspaces share a name, so they are saved as ' + ($renamed -join ', ') + '. workspaces.json shows which is which. To use other aliases, edit them there and run again with -WorkspacesFile.') }
  Write-Host "Found $($found.Count) Sentinel workspace(s). The list is in workspaces.json. Collecting each one now."
  $list = $found.ToArray()
} else {
  # Several workspaces from a list file: one inventory file per workspace.
  if (-not (Test-Path -LiteralPath $WorkspacesFile)) { throw "The workspaces file was not found: $WorkspacesFile" }
  # Windows PowerShell 5.1 passes a JSON array down the pipeline as one object, so enumerate it explicitly.
  $parsed = ConvertFrom-Json -InputObject (Get-Content -LiteralPath $WorkspacesFile -Raw)
  $list = @($parsed | ForEach-Object { $_ })
  if (-not $list.Count) { throw 'The workspaces file is empty. Add one entry per workspace.' }
}
$names = @{}
$n = 0
foreach ($w in $list) {
  $n += 1
  foreach ($field in @('subscriptionId', 'resourceGroupName', 'workspaceName', 'alias')) {
    if (-not [string](Get-Prop $w @($field))) { throw "Entry $n in the workspaces file has no $field." }
  }
  $safe = ConvertTo-SafeName ([string]$w.alias)
  if (-not $safe) { $safe = "workspace-$n" }
  $key = $safe.ToLowerInvariant()
  if ($names.ContainsKey($key)) { throw "Entry $n gives the same file name as an earlier entry (inventory-$safe.json). Make the aliases unique." }
  $names[$key] = $true
  $w | Add-Member -NotePropertyName fileName -NotePropertyValue "inventory-$safe.json" -Force
}
if (-not (Test-Path -LiteralPath $OutFolder)) { New-Item -ItemType Directory -Path $OutFolder | Out-Null }
$done = New-Object System.Collections.Generic.List[string]
$failed = New-Object System.Collections.Generic.List[string]
foreach ($w in $list) {
  $alias = [string]$w.alias
  $file = Join-Path $OutFolder $w.fileName
  Write-Host "Collecting $alias ..."
  try {
    $failedRequests = Invoke-WorkspaceInventory ([string]$w.subscriptionId) ([string]$w.resourceGroupName) ([string]$w.workspaceName) $alias $file ([string](Get-Prop $w @('region')))
    if ($failedRequests) { $failed.Add("$alias ($failedRequests request(s) failed, file written)") } else { $done.Add($alias) }
  } catch {
    # Record only the alias and the message type - never the subscription, resource group or workspace path.
    $failed.Add("$alias (not collected: $($_.Exception.GetType().Name))")
    Write-Warning "Could not collect $alias. The other workspaces continue."
  }
}
Write-Host "Done: $($done.Count) of $($list.Count) workspace(s) collected without errors."
foreach ($u in $unchecked) { $failed.Add("$u not checked for Microsoft Sentinel") }
if ($failed.Count) { Write-Warning ('Check these: ' + ($failed -join '; ')) }
Write-Host 'Review the file before importing it into the app or sharing it.'
