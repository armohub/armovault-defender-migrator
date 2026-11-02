# Test harness: runs the inventory script with -Discover against a MOCKED Invoke-AzRestMethod (no Azure access,
# no network). Expect it to find only the Sentinel-enabled workspaces, write workspaces.json and one inventory
# file per workspace, with the region recorded and no resource path in the inventory files.
param([string] $OutFolder = '.\.tmp\mock-inventory-discover')
$ErrorActionPreference = 'Stop'
$script = "$PSScriptRoot\..\..\tools\Get-ArMoSentinelInventory.ps1"
$global:ArMoMockCalls = New-Object System.Collections.Generic.List[string]
function global:Invoke-AzRestMethod {
  param([string] $Path, [string] $Method)
  $global:ArMoMockCalls.Add("$Method $Path")
  if ($Method -ne 'GET') { throw "Mock refuses non-GET method $Method" }
  $content = switch -Wildcard ($Path) {
    '/subscriptions?api-version=*' { '{"value":[{"subscriptionId":"s1","state":"Enabled"},{"subscriptionId":"s2","state":"Disabled"}]}' }
    '/subscriptions/s1/providers/Microsoft.OperationalInsights/workspaces?*' { '{"value":[{"name":"law-soc","location":"westeurope","id":"/subscriptions/s1/resourceGroups/rg-soc/providers/Microsoft.OperationalInsights/workspaces/law-soc"},{"name":"law-apps","location":"westeurope","id":"/subscriptions/s1/resourceGroups/rg-apps/providers/Microsoft.OperationalInsights/workspaces/law-apps"}]}' }
    '*law-apps/providers/Microsoft.SecurityInsights/onboardingStates*' { return [pscustomobject]@{ StatusCode = 404; Content = '{"error":{"code":"NotFound"}}' } }
    '*onboardingStates*' { '{"value":[{"name":"default","properties":{"customerManagedKey":false}}]}' }
    '*alertRules*' { '{"value":[{"name":"r1","kind":"Scheduled","properties":{"displayName":"Rule A","enabled":true,"query":"SigninLogs","incidentConfiguration":{"createIncident":true}}}]}' }
    '*automationRules*' { '{"value":[]}' }
    '*dataConnectors*' { '{"value":[]}' }
    '*watchlists*' { '{"value":[]}' }
    default { throw "Unexpected path $Path" }
  }
  [pscustomobject]@{ StatusCode = 200; Content = $content }
}
if (Test-Path $OutFolder) { Remove-Item -Recurse -Force $OutFolder }
& $script -Discover -OutFolder $OutFolder 3>&1 | ForEach-Object { "  $_" }
$files = @(Get-ChildItem $OutFolder -Filter 'inventory-*.json' | Sort-Object Name)
"FILES: $($files.Name -join ', ')"
if (($files.Name -join ',') -ne 'inventory-law-soc.json') { throw 'Expected only the Sentinel-enabled workspace' }
$j = Get-Content $files[0].FullName -Raw | ConvertFrom-Json
if ($j.workspace.alias -ne 'law-soc' -or $j.workspace.region -ne 'westeurope') { throw 'Alias or region missing' }
if ((Get-Content $files[0].FullName -Raw) -match 'subscriptions|resourceGroups|rg-soc') { throw 'The inventory file contains a resource path' }
$list = @(Get-Content (Join-Path $OutFolder 'workspaces.json') -Raw | ConvertFrom-Json | ForEach-Object { $_ })
if ($list.Count -ne 1 -or $list[0].resourceGroupName -ne 'rg-soc') { throw 'workspaces.json is wrong' }
if ($global:ArMoMockCalls | Where-Object { $_ -match '/subscriptions/s2/' }) { throw 'A disabled subscription was searched' }
"CALLS: $($global:ArMoMockCalls.Count)"
'ALL CHECKS PASSED'
