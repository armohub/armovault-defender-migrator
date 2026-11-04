# Test harness: runs the inventory script for SEVERAL workspaces from a list file, against a MOCKED
# Invoke-AzRestMethod (no Azure access, no network). Expect one inventory file per workspace, a failing
# workspace that does not stop the others, and a clear error for duplicate aliases.
param([string] $OutFolder = '.\.tmp\mock-inventory-multi')
$ErrorActionPreference = 'Stop'
$script = "$PSScriptRoot\..\..\tools\Get-ArMoSentinelInventory.ps1"
$global:ArMoMockCalls = New-Object System.Collections.Generic.List[string]
function global:Invoke-AzRestMethod {
  param([string] $Path, [string] $Method)
  $global:ArMoMockCalls.Add("$Method $Path")
  if ($Method -ne 'GET') { throw "Mock refuses non-GET method $Method" }
  # The subscription (for the tenant fingerprint) answers first; it has no workspace in its path.
  if ($Path -match '^/subscriptions/[^/?]+\?api-version=') { return [pscustomobject]@{ StatusCode = 200; Content = '{"subscriptionId":"s","tenantId":"aaaaaaaa-0000-0000-0000-000000000001"}' } }
  $ws = $Path.Split('/')[8]
  $label = if ($ws) { @{ 'ws-one' = 'Rule A'; 'ws-two' = 'Rule B'; 'one' = 'Rule C' }[$ws] } else { '' }
  if ($ws -eq 'ws-down') { throw [System.Net.WebException]::new('mock network failure') }
  # The newer parts answer with nothing to report.
  if ($Path -match '/(settings|workspaceManagerConfigurations|workspaceManagerMembers|sourcecontrols|bookmarks|hunts|metadata|roleAssignments)\?|Microsoft\.Logic/workflows\?' -or $Path -like '*onboardingStates*') { return [pscustomobject]@{ StatusCode = 200; Content = '{"value":[]}' } }
  $content = switch -Wildcard ($Path) {
    '*alertRules*' { '{"value":[{"name":"r1","kind":"Scheduled","properties":{"displayName":"' + $label + '","enabled":true,"query":"SigninLogs","incidentConfiguration":{"createIncident":true}}}]}' }
    '*automationRules*' { '{"value":[]}' }
    '*dataConnectors*' { '{"value":[]}' }
    '*watchlists*' { '{"value":[]}' }
    default { throw "Unexpected path $Path" }
  }
  [pscustomobject]@{ StatusCode = 200; Content = $content }
}
if (Test-Path $OutFolder) { Remove-Item -Recurse -Force $OutFolder }
New-Item -ItemType Directory -Force $OutFolder | Out-Null
$list = Join-Path $OutFolder 'workspaces.json'
'[{"subscriptionId":"s1","resourceGroupName":"g1","workspaceName":"ws-one","alias":"SOC-PROD-1"},{"subscriptionId":"s3","resourceGroupName":"g3","workspaceName":"ws-down","alias":"SOC-DOWN"},{"subscriptionId":"s2","resourceGroupName":"g2","workspaceName":"ws-two","alias":"SOC PROD 2"}]' | Out-File -FilePath $list -Encoding utf8
& $script -WorkspacesFile $list -OutFolder $OutFolder 3>&1 | ForEach-Object { "  $_" }
$files = @(Get-ChildItem $OutFolder -Filter 'inventory-*.json' | Sort-Object Name)
"FILES: $($files.Name -join ', ')"
foreach ($f in $files) { $j = Get-Content $f.FullName -Raw | ConvertFrom-Json; "$($f.Name): alias=$($j.workspace.alias) rules=$($j.analyticsRules.Count) first=$($j.analyticsRules[0].name)" }
if ($files.Count -ne 2) { throw "Expected 2 inventory files, got $($files.Count)" }
if (($files.Name -join ',') -ne 'inventory-SOC-PROD-1.json,inventory-SOC-PROD-2.json') { throw 'Unexpected file names' }
foreach ($f in $files) { if ((Get-Content $f.FullName -Raw) -match 'ws-one|ws-two|subscriptions|resourceGroups') { throw "$($f.Name) contains a resource path" } }
"CALLS: $($global:ArMoMockCalls.Count)"

# Duplicate aliases (after making them safe for a file name) stop the run before any request.
$global:ArMoMockCalls.Clear()
'[{"subscriptionId":"s1","resourceGroupName":"g1","workspaceName":"a","alias":"SOC PROD"},{"subscriptionId":"s1","resourceGroupName":"g1","workspaceName":"b","alias":"SOC-PROD"}]' | Out-File -FilePath $list -Encoding utf8
try { & $script -WorkspacesFile $list -OutFolder $OutFolder; throw 'Duplicate aliases were accepted' } catch { if ($_.Exception.Message -notmatch 'same file name') { throw } ; "DUPLICATE: $($_.Exception.Message)" }
if ($global:ArMoMockCalls.Count) { throw 'Requests were sent before the list was checked' }
'[{"subscriptionId":"s1","resourceGroupName":"g1","workspaceName":"a"}]' | Out-File -FilePath $list -Encoding utf8
try { & $script -WorkspacesFile $list -OutFolder $OutFolder; throw 'A missing alias was accepted' } catch { if ($_.Exception.Message -notmatch 'has no alias') { throw } ; "MISSING: $($_.Exception.Message)" }
'{"subscriptionId":"s1","resourceGroupName":"g1","workspaceName":"one","alias":"ONLY"}' | Out-File -FilePath $list -Encoding utf8
& $script -WorkspacesFile $list -OutFolder $OutFolder | Out-Null
if (-not (Test-Path (Join-Path $OutFolder 'inventory-ONLY.json'))) { throw 'A single object in the list file was not collected' }
'SINGLE OBJECT: ok'
'ALL CHECKS PASSED'
