<#
.SYNOPSIS
  Read-only inventory of a Microsoft Sentinel workspace for the ArMo MS Defender Migration Assistant.

.DESCRIPTION
  Collects the names and transition-relevant flags of analytics rules, automation rules, data connectors and
  watchlists using HTTP GET requests to the Microsoft Sentinel (SecurityInsights) REST API through Invoke-AzRestMethod.

  WHAT IT DOES
    - Sends GET requests only. It never creates, changes or deletes anything.
    - Computes flags locally (for example "uses the Incident provider condition") and writes ONLY names, kinds and flags
      to a JSON file. It does not write rule queries, incident data, entities or credentials.
  WHAT IT DOES NOT DO
    - It does not sign you in, store tokens, or send data anywhere other than Azure Resource Manager.
    - It does not check Defender portal settings (no documented API was verified for those).

  REQUIREMENTS
    - PowerShell 7+ or Windows PowerShell 5.1 with the Az.Accounts module, and an existing session: Connect-AzAccount
    - Microsoft Sentinel Reader (or higher) on the workspace's resource group.

  STATUS
    - Composed for this project from the documented REST API (api-version 2025-09-01 and 2025-07-01-preview).
      Not yet validated against a live customer tenant by the authors. Review it before running.
    - Review the output file before importing or sharing it: rule and watchlist names can be sensitive.

  FIND YOUR WORKSPACES FOR YOU (-Discover)
    - Lists the subscriptions you can read, the Log Analytics workspaces in each, and keeps those where Microsoft
      Sentinel is enabled (it has an onboarding state). GET requests only.
    - Writes workspaces.json (the list it found) and one inventory-<name>.json per workspace to -OutFolder.
    - The alias of each workspace is its workspace name. Change aliases later in the assistant if you prefer.
    - Limit the search with -Subscriptions '<id>','<id>'.

  SEVERAL WORKSPACES IN ONE RUN
    - Pass -WorkspacesFile with a JSON list of workspaces, and optionally -OutFolder. The script writes one file per
      workspace, named inventory-<alias>.json, which you can import into the app together.
    - Each entry needs subscriptionId, resourceGroupName, workspaceName and alias. Aliases must be unique.
    - The list holds resource names only. Do not put secrets, tokens or passwords in it.
    - If one workspace fails, the others are still collected, and the run ends with a summary.

.EXAMPLE
  # Find every Sentinel workspace you can read, and collect each one:
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -Discover -OutFolder .\inventory

.EXAMPLE
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -SubscriptionId '<id>' -ResourceGroupName '<rg>' -WorkspaceName '<ws>' -WorkspaceAlias 'SOC-PROD' -OutFile .\inventory-soc-prod.json

.EXAMPLE
  # workspaces.json:
  # [
  #   { "subscriptionId": "<id>", "resourceGroupName": "<rg>", "workspaceName": "<ws1>", "alias": "SOC-PROD-EU" },
  #   { "subscriptionId": "<id>", "resourceGroupName": "<rg>", "workspaceName": "<ws2>", "alias": "SOC-PROD-US" }
  # ]
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -WorkspacesFile .\workspaces.json -OutFolder .\inventory
#>
[CmdletBinding(DefaultParameterSetName = 'One')]
param(
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $SubscriptionId,
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $ResourceGroupName,
  [Parameter(Mandatory = $true, ParameterSetName = 'One')][string] $WorkspaceName,
  [Parameter(ParameterSetName = 'One')][string] $WorkspaceAlias = '',
  [Parameter(ParameterSetName = 'One')][string] $OutFile = '.\armohub-inventory.json',
  [Parameter(Mandatory = $true, ParameterSetName = 'List')][string] $WorkspacesFile,
  [Parameter(ParameterSetName = 'List')][Parameter(ParameterSetName = 'Discover')][string] $OutFolder = '.',
  [Parameter(Mandatory = $true, ParameterSetName = 'Discover')][switch] $Discover,
  [Parameter(ParameterSetName = 'Discover')][string[]] $Subscriptions = @()
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue)) {
  throw 'Invoke-AzRestMethod was not found. Install the Az.Accounts module and run Connect-AzAccount first.'
}

$script:errors = New-Object System.Collections.Generic.List[string]

function Get-AllPages([string] $Path) {
  $items = @()
  $next = $Path
  while ($next) {
    $resp = Invoke-AzRestMethod -Path $next -Method GET
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

function Get-Prop($Object, [string[]] $Path) {
  $cur = $Object
  foreach ($p in $Path) {
    if ($null -eq $cur) { return $null }
    if ($cur.PSObject.Properties.Name -contains $p) { $cur = $cur.$p } else { return $null }
  }
  return $cur
}

# Collects one workspace and writes its file. Returns the number of failed requests.
function Invoke-WorkspaceInventory([string] $SubscriptionId, [string] $ResourceGroupName, [string] $WorkspaceName, [string] $WorkspaceAlias, [string] $OutFile, [string] $Region = '') {
  $script:errors = New-Object System.Collections.Generic.List[string]
  $base = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$WorkspaceName/providers/Microsoft.SecurityInsights"

  # Analytics rules: query both API versions because the stable version enumerates fewer rule kinds.
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
        productFilter    = [string](Get-Prop $p @('productFilter'))
        apiVersion       = $api
      }
    }
  }

  # Automation rules
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

  $connectors = foreach ($c in (Get-AllPages "$base/dataConnectors?api-version=2025-09-01")) { [ordered]@{ kind = [string](Get-Prop $c @('kind')); name = [string](Get-Prop $c @('name')) } }
  $watchlists = foreach ($w in (Get-AllPages "$base/watchlists?api-version=2025-09-01")) { [ordered]@{ alias = [string](Get-Prop $w @('properties', 'watchlistAlias')); name = [string](Get-Prop $w @('properties', 'displayName')) } }

  $result = [ordered]@{
    schema          = 'armohub.dma.inventory'
    schemaVersion   = 1
    tool            = [ordered]@{ name = 'Get-ArMoSentinelInventory.ps1'; version = '1.0.0' }
    collectedAt     = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ', [System.Globalization.CultureInfo]::InvariantCulture)
    workspace       = [ordered]@{ alias = $WorkspaceAlias; region = $Region }
    analyticsRules  = @($rules.Values)
    automationRules = @($automation)
    dataConnectors  = @($connectors)
    watchlists      = @($watchlists)
    errors          = @($script:errors)
  }

  $result | ConvertTo-Json -Depth 8 | Out-File -FilePath $OutFile -Encoding utf8
  Write-Host "Inventory written to $OutFile - $($rules.Count) analytics rules, $(@($automation).Count) automation rules, $(@($connectors).Count) connectors, $(@($watchlists).Count) watchlists."
  if ($script:errors.Count) { Write-Warning ("Some requests failed: " + ($script:errors -join '; ')) }
  return $script:errors.Count
}

if ($PSCmdlet.ParameterSetName -eq 'One') {
  [void](Invoke-WorkspaceInventory $SubscriptionId $ResourceGroupName $WorkspaceName $WorkspaceAlias $OutFile)
  Write-Host 'Review the file before importing it into the app or sharing it.'
  return
}

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
  foreach ($sub in $subs) {
    foreach ($ws in (Get-AllPages "/subscriptions/$sub/providers/Microsoft.OperationalInsights/workspaces?api-version=2025-07-01")) {
      $wsName = [string](Get-Prop $ws @('name'))
      $parts = ([string](Get-Prop $ws @('id'))).Split('/')
      if (-not $wsName -or $parts.Count -lt 5) { continue }
      $rg = $parts[4]
      $state = Invoke-AzRestMethod -Path "/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.OperationalInsights/workspaces/$wsName/providers/Microsoft.SecurityInsights/onboardingStates?api-version=2025-09-01" -Method GET
      if ($state.StatusCode -ne 200) { continue }
      $states = Get-Prop ($state.Content | ConvertFrom-Json) @('value')
      if (-not @($states).Count) { continue }
      $found.Add([pscustomobject]@{ subscriptionId = $sub; resourceGroupName = $rg; workspaceName = $wsName; alias = $wsName; region = [string](Get-Prop $ws @('location')) })
    }
  }
  if ($script:errors.Count) { Write-Warning ('Some requests failed while searching: ' + ($script:errors -join '; ')) }
  if (-not $found.Count) { throw 'No Microsoft Sentinel workspace found in the subscriptions you can read.' }
  if (-not (Test-Path -LiteralPath $OutFolder)) { New-Item -ItemType Directory -Path $OutFolder | Out-Null }
  ConvertTo-Json -InputObject $found.ToArray() -Depth 4 | Out-File -FilePath (Join-Path $OutFolder 'workspaces.json') -Encoding utf8
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
  $safe = ([string]$w.alias -replace '[^A-Za-z0-9._-]+', '-').Trim('-')
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
if ($failed.Count) { Write-Warning ('Check these: ' + ($failed -join '; ')) }
Write-Host 'Review the file before importing it into the app or sharing it.'
