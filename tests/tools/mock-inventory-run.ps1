# Test harness: runs the inventory script against a MOCKED Invoke-AzRestMethod (no Azure access, no network).
param([string] $OutFile = '.\.tmp\mock-inventory.json', [string] $Fail = '')
$ErrorActionPreference = 'Stop'
$global:ArMoMockCalls = New-Object System.Collections.Generic.List[string]
function global:Invoke-AzRestMethod {
  param([string] $Path, [string] $Method)
  $global:ArMoMockCalls.Add("$Method $Path")
  if ($Method -ne 'GET') { throw "Mock refuses non-GET method $Method" }
  if ($Fail -and $Path -like "*$Fail*") { return [pscustomobject]@{ StatusCode = 403; Content = '{"error":{"code":"AuthorizationFailed"}}' } }
  $page2 = $Path -like '*skipToken=2*'
  $content = switch -Wildcard ($Path) {
    '*alertRules?api-version=2025-09-01&skipToken=2' { '{"value":[{"name":"r3","kind":"Scheduled","properties":{"displayName":"Alert only rule","enabled":true,"query":"SigninLogs","description":"#DONT_CORR# keep separate","incidentConfiguration":{"createIncident":false,"groupingConfiguration":{"enabled":false,"reopenClosedIncident":false}}}}]}' }
    '*alertRules?api-version=2025-09-01' { '{"value":[{"name":"r1","kind":"Fusion","properties":{"displayName":"Advanced Multistage Attack Detection","enabled":true}},{"name":"r2","kind":"MicrosoftSecurityIncidentCreation","properties":{"displayName":"Create incidents from MDC","enabled":true,"productFilter":"Azure Security Center"}}],"nextLink":"https://management.azure.com/subscriptions/s/resourceGroups/g/providers/Microsoft.OperationalInsights/workspaces/w/providers/Microsoft.SecurityInsights/alertRules?api-version=2025-09-01&skipToken=2"}' }
    '*alertRules?api-version=2025-07-01-preview' { '{"value":[{"name":"r1","kind":"Fusion","properties":{"displayName":"Advanced Multistage Attack Detection","enabled":true}},{"name":"r4","kind":"NRT","properties":{"displayName":"NRT identity rule","enabled":true,"query":"IdentityInfo | join ThreatIntelligenceIndicator","incidentConfiguration":{"createIncident":true,"groupingConfiguration":{"enabled":true,"reopenClosedIncident":true}}}}]}' }
    '*automationRules*' { '{"value":[{"name":"a1","properties":{"displayName":"Assign Defender incidents","triggeringLogic":{"isEnabled":true,"triggersOn":"Incidents","triggersWhen":"Created","conditions":[{"conditionType":"Property","conditionProperties":{"propertyName":"IncidentProviderName","operator":"Equals","propertyValues":["Microsoft 365 Defender"]}}]},"actions":[{"order":1,"actionType":"RunPlaybook","actionConfiguration":{"logicAppResourceId":"/x"}}]}},{"name":"a2","properties":{"displayName":"Alert enrichment","triggeringLogic":{"isEnabled":true,"triggersOn":"Alerts","triggersWhen":"Created"},"actions":[]}}]}' }
    '*dataConnectors*' { '{"value":[{"name":"c1","kind":"MicrosoftDefenderAdvancedThreatProtection"},{"name":"c2","kind":"AzureSecurityCenter"},{"name":"c3","kind":"Office365"}]}' }
    '*watchlists*' { '{"value":[{"name":"w1","properties":{"watchlistAlias":"vip-users","displayName":"VIP users"}}]}' }
    default { throw "Unexpected path $Path" }
  }
  [pscustomobject]@{ StatusCode = 200; Content = $content }
}
& "$PSScriptRoot\..\..\tools\Get-ArMoSentinelInventory.ps1" -SubscriptionId 's' -ResourceGroupName 'g' -WorkspaceName 'w' -WorkspaceAlias 'MOCK-WS' -OutFile $OutFile
"CALLS:"; $global:ArMoMockCalls
