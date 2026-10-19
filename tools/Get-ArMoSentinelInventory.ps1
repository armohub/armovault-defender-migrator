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

.EXAMPLE
  Connect-AzAccount
  .\Get-ArMoSentinelInventory.ps1 -SubscriptionId '<id>' -ResourceGroupName '<rg>' -WorkspaceName '<ws>' -WorkspaceAlias 'SOC-PROD' -OutFile .\inventory-soc-prod.json
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string] $SubscriptionId,
  [Parameter(Mandatory = $true)][string] $ResourceGroupName,
  [Parameter(Mandatory = $true)][string] $WorkspaceName,
  [string] $WorkspaceAlias = '',
  [string] $OutFile = '.\armohub-inventory.json'
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue)) {
  throw 'Invoke-AzRestMethod was not found. Install the Az.Accounts module and run Connect-AzAccount first.'
}

$base = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.OperationalInsights/workspaces/$WorkspaceName/providers/Microsoft.SecurityInsights"
$errors = New-Object System.Collections.Generic.List[string]

function Get-AllPages([string] $Path) {
  $items = @()
  $next = $Path
  while ($next) {
    $resp = Invoke-AzRestMethod -Path $next -Method GET
    if ($resp.StatusCode -ne 200) {
      # Record only the resource type and status code - never the subscription, resource group or workspace path.
      $resourceType = ($Path.Split('?')[0]).Split('/')[-1]
      $errors.Add("GET $resourceType returned HTTP $($resp.StatusCode)")
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
  tool            = [ordered]@{ name = 'Get-ArMoSentinelInventory.ps1'; version = '0.9.0' }
  collectedAt     = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ', [System.Globalization.CultureInfo]::InvariantCulture)
  workspace       = [ordered]@{ alias = $WorkspaceAlias }
  analyticsRules  = @($rules.Values)
  automationRules = @($automation)
  dataConnectors  = @($connectors)
  watchlists      = @($watchlists)
  errors          = @($errors)
}

$result | ConvertTo-Json -Depth 8 | Out-File -FilePath $OutFile -Encoding utf8
Write-Host "Inventory written to $OutFile - $($rules.Count) analytics rules, $(@($automation).Count) automation rules, $(@($connectors).Count) connectors, $(@($watchlists).Count) watchlists."
if ($errors.Count) { Write-Warning ("Some requests failed: " + ($errors -join '; ')) }
Write-Host 'Review the file before importing it into the app or sharing it.'
