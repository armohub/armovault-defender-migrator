# Test harness: runs the inventory script for one workspace against a MOCKED Invoke-AzRestMethod (no Azure
# access, no network). Checks every part the script collects, the workspace name, what a failing part does,
# and that no resource path, principal or tenant ID reaches the file.
# -Fail <text> makes every request whose path contains <text> return HTTP 403, for a manual run.
param([string] $OutFile = '.\.tmp\mock-inventory.json', [string] $Fail = '')
$ErrorActionPreference = 'Stop'
$script = "$PSScriptRoot\..\..\tools\Get-ArMoSentinelInventory.ps1"
$global:ArMoMockFail = $Fail
function global:Get-AzContext { [pscustomobject]@{ Environment = [pscustomobject]@{ Name = 'AzureUSGovernment' } } }
function global:Invoke-AzRestMethod {
  param([string] $Path, [string] $Method)
  $global:ArMoMockCalls.Add("$Method $Path")
  if ($Method -ne 'GET') { throw "Mock refuses non-GET method $Method" }
  if ($global:ArMoMockFail -and $Path -like "*$($global:ArMoMockFail)*") { return [pscustomobject]@{ StatusCode = 403; Content = '{"error":{"code":"AuthorizationFailed"}}' } }
  $content = switch -Wildcard ($Path) {
    '/subscriptions/s?api-version=*' { '{"subscriptionId":"s","tenantId":"11111111-2222-3333-4444-555555555555","managedByTenants":[{"tenantId":"99999999-8888-7777-6666-555555555555"}],"state":"Enabled"}' }
    '*alertRules?api-version=2025-09-01&skipToken=2' { '{"value":[{"name":"r3","kind":"Scheduled","properties":{"displayName":"Alert only rule","enabled":true,"query":"SigninLogs","description":"#DONT_CORR# keep separate","incidentConfiguration":{"createIncident":false,"groupingConfiguration":{"enabled":false,"reopenClosedIncident":false}}}}]}' }
    '*alertRules?api-version=2025-09-01' { '{"value":[{"name":"r1","kind":"Fusion","properties":{"displayName":"Advanced Multistage Attack Detection","enabled":true}},{"name":"r2","kind":"MicrosoftSecurityIncidentCreation","properties":{"displayName":"Create incidents from MDC","enabled":true,"productFilter":"Azure Security Center"}}],"nextLink":"https://management.azure.com/subscriptions/s/resourceGroups/g/providers/Microsoft.OperationalInsights/workspaces/w/providers/Microsoft.SecurityInsights/alertRules?api-version=2025-09-01&skipToken=2"}' }
    '*alertRules?api-version=2025-07-01-preview' { '{"value":[{"name":"r1","kind":"Fusion","properties":{"displayName":"Advanced Multistage Attack Detection","enabled":true}},{"name":"r4","kind":"NRT","properties":{"displayName":"NRT identity rule","enabled":true,"query":"IdentityInfo | join ThreatIntelligenceIndicator","incidentConfiguration":{"createIncident":true,"groupingConfiguration":{"enabled":true,"reopenClosedIncident":true}}}},{"name":"r5","kind":"Scheduled","properties":{"displayName":"TI map","enabled":true,"query":"ThreatIntelIndicators | take 1","incidentConfiguration":{"createIncident":true}}}]}' }
    '*automationRules*' { '{"value":[{"name":"a1","properties":{"displayName":"Assign Defender incidents","triggeringLogic":{"isEnabled":true,"triggersOn":"Incidents","triggersWhen":"Created","conditions":[{"conditionType":"Property","conditionProperties":{"propertyName":"IncidentProviderName","operator":"Equals","propertyValues":["Microsoft 365 Defender"]}}]},"actions":[{"order":1,"actionType":"RunPlaybook","actionConfiguration":{"logicAppResourceId":"/x"}},{"order":2,"actionType":"AddIncidentTask","actionConfiguration":{"title":"Check"}}]}},{"name":"a2","properties":{"displayName":"Alert enrichment","triggeringLogic":{"isEnabled":true,"triggersOn":"Alerts","triggersWhen":"Created"},"actions":[]}}]}' }
    '*dataConnectors?api-version=2025-09-01' { '{"value":[{"name":"c1","kind":"MicrosoftDefenderAdvancedThreatProtection"},{"name":"c2","kind":"AzureSecurityCenter"},{"name":"c3","kind":"Office365"}]}' }
    '*dataConnectors?api-version=2025-07-01-preview' { '{"value":[{"name":"c1","kind":"MicrosoftDefenderAdvancedThreatProtection"},{"name":"c4","kind":"OfficeIRM"},{"name":"c5","kind":"MicrosoftThreatProtection"}]}' }
    '*watchlists*' { '{"value":[{"name":"w1","properties":{"watchlistAlias":"vip-users","displayName":"VIP users"}}]}' }
    '*onboardingStates*' { '{"value":[{"name":"default","properties":{"customerManagedKey":true}}]}' }
    '*/settings?api-version=2025-07-01-preview' { '{"value":[{"name":"Ueba","kind":"Ueba","properties":{"dataSources":["SigninLogs","AuditLogs"]}},{"name":"EntityAnalytics","kind":"EntityAnalytics","properties":{"entityProviders":["AzureActiveDirectory"]}},{"name":"Anomalies","kind":"Anomalies","properties":{"isEnabled":true}}]}' }
    '*workspaceManagerConfigurations*' { '{"value":[{"name":"default","properties":{"mode":"Enabled"}}]}' }
    '*workspaceManagerMembers*' { '{"value":[{"name":"m1","properties":{}},{"name":"m2","properties":{}}]}' }
    '*sourcecontrols*' { '{"value":[{"name":"sc1","properties":{"displayName":"Detections repo","repoType":"Github","contentTypes":["AnalyticsRule","HuntingQuery"]}}]}' }
    '*bookmarks*' { '{"value":[{"name":"b1","properties":{"displayName":"Odd sign-in"}}]}' }
    '*hunts?api-version=*' { '{"value":[{"name":"h1","properties":{"displayName":"Hunt 1","status":"Active"}}]}' }
    '*/metadata?api-version=*' { '{"value":[{"name":"m1","properties":{"kind":"Workbook"}},{"name":"m2","properties":{"kind":"Playbook"}},{"name":"m3","properties":{"kind":"AnalyticsRule"}}]}' }
    '*Microsoft.Logic/workflows?api-version=*' { '{"value":[{"name":"pb-servicenow","properties":{"parameters":{"$connections":{"value":{"azuresentinel":{"id":"/subscriptions/s/providers/Microsoft.Web/locations/westeurope/managedApis/azuresentinel"},"servicenow":{"id":"/subscriptions/s/providers/Microsoft.Web/locations/westeurope/managedApis/service-now"}}}}}},{"name":"pb-enrich","properties":{"parameters":{"$connections":{"value":{"azuresentinel_1":{"id":"/subscriptions/s/providers/Microsoft.Web/locations/westeurope/managedApis/azuresentinel"}}}}}},{"name":"mailer","properties":{"parameters":{"$connections":{"value":{"office365":{"id":"/subscriptions/s/providers/Microsoft.Web/locations/westeurope/managedApis/office365"}}}}}}]}' }
    '*roleAssignments?api-version=*' { '{"value":[{"name":"ra1","properties":{"principalType":"ServicePrincipal","principalId":"pid-reader","roleDefinitionId":"/subscriptions/s/providers/Microsoft.Authorization/roleDefinitions/8d289c81-5878-46d4-8554-54e1e3d8b5cb","scope":"/subscriptions/s/resourceGroups/g"}},{"name":"ra2","properties":{"principalType":"ServicePrincipal","principalId":"pid-responder","roleDefinitionId":"/subscriptions/s/providers/Microsoft.Authorization/roleDefinitions/3e150937-b8fe-4cfb-8069-0eaf05ecd056","scope":"/subscriptions/s/resourceGroups/g"}},{"name":"ra3","properties":{"principalType":"User","principalId":"pid-user","roleDefinitionId":"/subscriptions/s/providers/Microsoft.Authorization/roleDefinitions/custom-table","scope":"/subscriptions/s/resourceGroups/g","condition":"@Resource[Microsoft.OperationalInsights/workspaces/tables:name] StringEquals ''SigninLogs''"}},{"name":"ra4","properties":{"principalType":"ServicePrincipal","principalId":"pid-owner","roleDefinitionId":"/subscriptions/s/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635","scope":"/subscriptions/s"}}]}' }
    '*roleDefinitions/8d289c81-5878-46d4-8554-54e1e3d8b5cb?*' { '{"name":"8d289c81-5878-46d4-8554-54e1e3d8b5cb","properties":{"roleName":"Microsoft Sentinel Reader","type":"BuiltInRole","permissions":[{"actions":["Microsoft.SecurityInsights/*/read"]}]}}' }
    '*roleDefinitions/3e150937-b8fe-4cfb-8069-0eaf05ecd056?*' { '{"name":"3e150937-b8fe-4cfb-8069-0eaf05ecd056","properties":{"roleName":"Microsoft Sentinel Responder","type":"BuiltInRole","permissions":[{"actions":["Microsoft.SecurityInsights/*/read"]}]}}' }
    '*roleDefinitions/custom-table?*' { '{"name":"custom-table","properties":{"roleName":"SOC table reader","type":"CustomRole","permissions":[{"actions":["Microsoft.OperationalInsights/workspaces/query/SigninLogs/read"]}]}}' }
    '*roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635?*' { '{"name":"8e3af657-a8ff-443c-a75c-2fe8c4bcb635","properties":{"roleName":"Owner","type":"BuiltInRole","permissions":[{"actions":["*"]}]}}' }
    default { throw "Unexpected path $Path" }
  }
  [pscustomobject]@{ StatusCode = 200; Content = $content }
}
function Invoke-Run([string] $File, [string] $Alias = '') {
  $global:ArMoMockCalls = New-Object System.Collections.Generic.List[string]
  if (Test-Path $File) { Remove-Item -Force $File }
  $runArgs = @{ SubscriptionId = 's'; ResourceGroupName = 'g'; WorkspaceName = 'w'; OutFile = $File }
  if ($Alias) { $runArgs.WorkspaceAlias = $Alias }
  & $script @runArgs 3>&1 | ForEach-Object { Write-Host "  $_" }
  return (Get-Content $File -Raw)
}
New-Item -ItemType Directory -Force (Split-Path $OutFile) | Out-Null

if ($Fail) { $raw = Invoke-Run $OutFile 'MOCK-WS'; $raw; return }

# Run 1: everything answers.
$raw = Invoke-Run $OutFile 'MOCK-WS'
$j = ConvertFrom-Json $raw
function Expect([bool] $Ok, [string] $What) { if (-not $Ok) { throw "Check failed: $What" } else { "  ok: $What" } }
Expect ($j.schemaVersion -eq 2) 'schema version 2'
Expect ($j.workspace.alias -eq 'MOCK-WS' -and $raw -notmatch '"w"') 'the alias given, and the real name kept out of the file'
Expect ($j.workspace.tenantRef -match '^t-[0-9a-f]{8}$') 'tenant written as a short fingerprint'
Expect ($j.workspace.delegated -eq $true) 'Lighthouse delegation flagged'
Expect ($j.workspace.cloud -eq 'AzureUSGovernment') 'cloud from the Az sign-in'
Expect ($j.workspace.customerManagedKey -eq $true) 'customer-managed key flag'
Expect ($j.settings.ueba -eq $true -and $j.settings.entityAnalytics -eq $true -and $j.settings.anomalies -eq $true) 'UEBA, entity analytics and anomalies'
Expect ($j.workspaceManager.enabled -eq $true -and $j.workspaceManager.members -eq 2) 'workspace manager'
Expect ($j.repositories.count -eq 1 -and $j.repositories.huntingQueries -eq $true) 'repositories'
Expect ($j.bookmarks -eq 1 -and $j.hunts -eq 1) 'bookmarks and hunts'
Expect ($j.installedContent.workbooks -eq 1 -and $j.installedContent.playbooks -eq 1) 'installed workbooks and playbooks'
Expect (@($j.logicApps.sentinelPlaybooks).Count -eq 2 -and @($j.logicApps.sentinelPlaybooks | Where-Object { $_.ticketing }).Count -eq 1) 'Sentinel playbooks, one with a ticketing connector'
Expect ($j.access.spWithSentinelRoles -eq 2 -and $j.access.spWithReadOnlyRoles -eq 1 -and $j.access.tableLevelRestrictions -eq 1) 'role assignment counts'
Expect (@($j.dataConnectors).Count -eq 5 -and (@($j.dataConnectors.kind) -contains 'OfficeIRM') -and (@($j.dataConnectors.kind) -contains 'MicrosoftThreatProtection')) 'connectors from both API versions'
Expect (@($j.analyticsRules | Where-Object { $_.usesTI }).Count -eq 2) 'rules that query threat intelligence tables'
$parts = @('analyticsRules', 'automationRules', 'dataConnectors', 'watchlists', 'onboarding', 'settings', 'workspaceManager', 'repositories', 'bookmarks', 'hunts', 'installedContent', 'logicApps', 'access')
Expect (@($parts | Where-Object { $j.collected.$_ -ne $true }).Count -eq 0) 'every part marked as collected'
Expect ($raw -notmatch 'subscriptions/|resourceGroups|pid-|11111111|99999999|SigninLogs''') 'no resource path, principal or tenant ID in the file'
Expect (@($global:ArMoMockCalls | Where-Object { $_ -notmatch '^GET ' }).Count -eq 0) 'GET requests only'

# Run 2: no alias given, so the alias is the workspace name, never the file name.
$j = ConvertFrom-Json (Invoke-Run $OutFile)
Expect ($j.workspace.alias -eq 'w') 'alias defaults to the workspace name'

# Run 3: Logic Apps refused (Microsoft Sentinel Reader cannot read them). Only that part is missing.
$global:ArMoMockFail = 'Microsoft.Logic'
$j = ConvertFrom-Json (Invoke-Run $OutFile 'MOCK-WS')
Expect ($j.collected.logicApps -eq $false -and $j.collected.analyticsRules -eq $true -and $j.collected.access -eq $true) 'a refused part is marked as not collected, the others are'
Expect (@($j.errors | Where-Object { $_ -match 'workflows returned HTTP 403' }).Count -eq 1) 'the refused request is named'

# Run 4: automation rules refused.
$global:ArMoMockFail = 'automationRules'
$j = ConvertFrom-Json (Invoke-Run $OutFile 'MOCK-WS')
Expect ($j.collected.automationRules -eq $false -and $j.collected.watchlists -eq $true) 'automation rules marked as not collected'
'ALL CHECKS PASSED'
