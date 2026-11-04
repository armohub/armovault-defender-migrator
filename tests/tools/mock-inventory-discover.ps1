# Test harness: runs the inventory script with -Discover against a MOCKED Invoke-AzRestMethod (no Azure access,
# no network). Expect it to find only the Sentinel-enabled workspaces, write workspaces.json and one inventory
# file per workspace, with the region recorded and no resource path in the inventory files. Two more runs check
# workspaces that share a name (each gets its own alias and file) and workspaces whose check fails (reported,
# never skipped silently).
param([string] $OutFolder = '.\.tmp\mock-inventory-discover')
$ErrorActionPreference = 'Stop'
$script = "$PSScriptRoot\..\..\tools\Get-ArMoSentinelInventory.ps1"

# The mock answers from these globals, set per run: the subscription list, the workspaces per subscription, and
# the HTTP status of the onboarding-state check per workspace name (200 when not listed).
function global:Invoke-AzRestMethod {
  param([string] $Path, [string] $Method)
  $global:ArMoMockCalls.Add("$Method $Path")
  if ($Method -ne 'GET') { throw "Mock refuses non-GET method $Method" }
  $status = 200
  if ($Path -like '/subscriptions?api-version=*') { $content = $global:ArMoMockSubs }
  elseif ($Path -match '^/subscriptions/([^/?]+)\?api-version=') { $content = '{"subscriptionId":"' + $Matches[1] + '","tenantId":"' + [string]$global:ArMoMockTenants[$Matches[1]] + '"}' }
  elseif ($Path -match '^/subscriptions/([^/]+)/providers/Microsoft\.OperationalInsights/workspaces\?') { $content = $global:ArMoMockWorkspaces[$Matches[1]] }
  elseif ($Path -match '/workspaces/([^/]+)/providers/Microsoft\.SecurityInsights/onboardingStates') {
    if ($global:ArMoMockStateStatus.ContainsKey($Matches[1])) { $status = $global:ArMoMockStateStatus[$Matches[1]] }
    $content = if ($status -eq 200) { '{"value":[{"name":"default","properties":{"customerManagedKey":false}}]}' } else { '{"error":{"code":"Failed"}}' }
  }
  elseif ($Path -like '*alertRules*') { $content = '{"value":[{"name":"r1","kind":"Scheduled","properties":{"displayName":"Rule A","enabled":true,"query":"SigninLogs","incidentConfiguration":{"createIncident":true}}}]}' }
  elseif ($Path -like '*automationRules*' -or $Path -like '*dataConnectors*' -or $Path -like '*watchlists*') { $content = '{"value":[]}' }
  elseif ($Path -match '/(settings|workspaceManagerConfigurations|workspaceManagerMembers|sourcecontrols|bookmarks|hunts|metadata|roleAssignments)\?|Microsoft\.Logic/workflows\?') { $content = '{"value":[]}' }
  else { throw "Unexpected path $Path" }
  if (-not $content) { throw "Unexpected path $Path" }
  [pscustomobject]@{ StatusCode = $status; Content = $content }
}
function New-MockWorkspace([string] $Sub, [string] $Rg, [string] $Name) {
  "{`"name`":`"$Name`",`"location`":`"westeurope`",`"id`":`"/subscriptions/$Sub/resourceGroups/$Rg/providers/Microsoft.OperationalInsights/workspaces/$Name`"}"
}
function Invoke-Discover([string] $Folder, [switch] $Explicit) {
  $global:ArMoMockCalls = New-Object System.Collections.Generic.List[string]
  if (Test-Path $Folder) { Remove-Item -Recurse -Force $Folder }
  # Keep everything the script printed (output, warnings, host messages) for the checks, and show it indented.
  # With no parameters other than the folder, the script finds every workspace; -Discover still works.
  $global:ArMoMockOut = if ($Explicit) { & $script -Discover -OutFolder $Folder *>&1 | Out-String } else { & $script -OutFolder $Folder *>&1 | Out-String }
  $global:ArMoMockOut -split "`r?`n" | Where-Object { $_ } | ForEach-Object { "  $_" }
}

# Run 1, with no -Discover: one Sentinel workspace, one plain Log Analytics workspace (404: not Sentinel), one
# disabled subscription.
$global:ArMoMockTenants = @{ s1 = 'aaaaaaaa-0000-0000-0000-000000000001'; s3 = 'bbbbbbbb-0000-0000-0000-000000000002' }
$global:ArMoMockSubs = '{"value":[{"subscriptionId":"s1","state":"Enabled"},{"subscriptionId":"s2","state":"Disabled"}]}'
$global:ArMoMockWorkspaces = @{ s1 = '{"value":[' + (New-MockWorkspace s1 rg-soc law-soc) + ',' + (New-MockWorkspace s1 rg-apps law-apps) + ']}' }
$global:ArMoMockStateStatus = @{ 'law-apps' = 404 }
Invoke-Discover "$OutFolder\one"
$out = $global:ArMoMockOut
$files = @(Get-ChildItem "$OutFolder\one" -Filter 'inventory-*.json' | Sort-Object Name)
"FILES: $($files.Name -join ', ')"
if (($files.Name -join ',') -ne 'inventory-law-soc.json') { throw 'Expected only the Sentinel-enabled workspace' }
$j = Get-Content $files[0].FullName -Raw | ConvertFrom-Json
if ($j.workspace.alias -ne 'law-soc' -or $j.workspace.region -ne 'westeurope') { throw 'Alias or region missing' }
if ((Get-Content $files[0].FullName -Raw) -match 'subscriptions|resourceGroups|rg-soc') { throw 'The inventory file contains a resource path' }
$list = @(Get-Content "$OutFolder\one\workspaces.json" -Raw | ConvertFrom-Json | ForEach-Object { $_ })
if ($list.Count -ne 1 -or $list[0].resourceGroupName -ne 'rg-soc') { throw 'workspaces.json is wrong' }
if ($global:ArMoMockCalls | Where-Object { $_ -match '/subscriptions/s2/' }) { throw 'A disabled subscription was searched' }
if ($out -match 'law-apps') { throw 'A workspace without Sentinel (404) was reported as a problem' }
"CALLS: $($global:ArMoMockCalls.Count)"

# Run 2: three workspaces called law-soc (in two subscriptions, one in capitals), and one whose check is refused (403).
$global:ArMoMockSubs = '{"value":[{"subscriptionId":"s1","state":"Enabled"},{"subscriptionId":"s3","state":"Enabled"}]}'
$global:ArMoMockWorkspaces = @{
  s1 = '{"value":[' + (New-MockWorkspace s1 rg-a law-soc) + ',' + (New-MockWorkspace s1 rg-a law-blocked) + ']}'
  s3 = '{"value":[' + (New-MockWorkspace s3 rg-b law-soc) + ',' + (New-MockWorkspace s3 rg-c LAW-SOC) + ']}'
}
$global:ArMoMockStateStatus = @{ 'law-blocked' = 403 }
Invoke-Discover "$OutFolder\shared" -Explicit
$out = $global:ArMoMockOut
$names = @(Get-ChildItem "$OutFolder\shared" -Filter 'inventory-*.json' | ForEach-Object { $_.Name })
"FILES: $($names -join ', ')"
foreach ($want in @('inventory-law-soc.json', 'inventory-law-soc-2.json', 'inventory-LAW-SOC-3.json')) {
  if ($names -notcontains $want) { throw "Expected ${want}: workspaces that share a name each need their own file" }
}
if ($names.Count -ne 3) { throw 'Expected three inventory files' }
$list = @(Get-Content "$OutFolder\shared\workspaces.json" -Raw | ConvertFrom-Json | ForEach-Object { $_ })
if ((($list | ForEach-Object { $_.alias }) -join ',') -cne 'law-soc,law-soc-2,LAW-SOC-3') { throw 'workspaces.json does not hold the unique aliases' }
foreach ($f in (Get-ChildItem "$OutFolder\shared" -Filter 'inventory-*.json')) {
  $raw = Get-Content $f.FullName -Raw
  if ($raw -match 'subscriptions|resourceGroups|rg-a|rg-b|rg-c') { throw "$($f.Name) contains a resource path" }
  if ("inventory-$((ConvertFrom-Json $raw).workspace.alias).json" -ne $f.Name) { throw "$($f.Name) holds another alias" }
  if ($raw -match 'aaaaaaaa|bbbbbbbb') { throw "$($f.Name) contains a tenant ID" }
}
$ref = @{}; foreach ($n in $names) { $ref[$n] = (Get-Content "$OutFolder\shared\$n" -Raw | ConvertFrom-Json).workspace.tenantRef }
if (-not $ref['inventory-law-soc.json'] -or $ref['inventory-law-soc.json'] -eq $ref['inventory-law-soc-2.json'] -or $ref['inventory-law-soc-2.json'] -ne $ref['inventory-LAW-SOC-3.json']) { throw 'Tenant fingerprints do not tell the two tenants apart' }
"TENANTS: $($ref['inventory-law-soc.json']) and $($ref['inventory-law-soc-2.json'])"
if ($out -notmatch 'law-soc-2' -or $out -notmatch 'share a name') { throw 'The renamed workspaces were not explained' }
if ($out -notmatch 'law-blocked' -or $out -notmatch 'HTTP 403') { throw 'The workspace whose check failed was skipped silently' }

# Run 3: every check is refused, so nothing is found; the message must say why instead of "no workspace".
$global:ArMoMockSubs = '{"value":[{"subscriptionId":"s1","state":"Enabled"}]}'
$global:ArMoMockWorkspaces = @{ s1 = '{"value":[' + (New-MockWorkspace s1 rg-a law-blocked) + ']}' }
$global:ArMoMockStateStatus = @{ 'law-blocked' = 403 }
$message = ''
try { Invoke-Discover "$OutFolder\refused" -Explicit } catch { $message = $_.Exception.Message }
"MESSAGE: $message"
if ($message -notmatch 'could not be checked') { throw 'A refused check was reported as "no Sentinel workspace"' }
'ALL CHECKS PASSED'
