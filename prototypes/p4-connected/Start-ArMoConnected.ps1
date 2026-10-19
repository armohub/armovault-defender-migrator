<#
.SYNOPSIS
  PROTOTYPE ONLY (release-2 spike P4). Serves the ArMoHub DMA connected-mode page on a loopback-only HTTP listener.

.DESCRIPTION
  This is a throwaway prototype for prototypes/p4-connected. It is not part of release 1 and is not shipped.
  The offline single-file app is unchanged and never talks to this launcher.

  WHAT IT DOES
    - Binds 127.0.0.1 AND ::1 on the same random high port (49152-65535) with exclusive address use, then connects to
      itself on both addresses to prove that loopback connections reach it (not a squatter on 0.0.0.0 or ::). If any
      of this fails, it tries another port. It never listens on any other interface.
    - Serves a fixed list of files from .\web. There is no directory mapping, so path traversal is impossible.
    - Accepts GET and HEAD only. There is no endpoint that accepts data, changes state or runs anything.
    - Rejects every Host header except localhost:<port>, 127.0.0.1:<port> and [::1]:<port> (DNS rebinding defence).
    - Rejects browser requests whose Sec-Fetch-Site is not same-origin or none. The only exception is a top-level
      navigation to /redirect.html, which is how the browser returns from login.microsoftonline.com.
    - Sends no CORS headers. Sends a strict Content-Security-Policy, frame-ancestors 'none', COOP and CORP.
    - Refuses to start if the vendored MSAL files do not match their pinned SHA-256 hashes.
    - Stops after -IdleMinutes without a request, or on Ctrl+C.
  WHAT IT DOES NOT DO
    - It never sees tokens or authorization codes: MSAL asks Entra to return the code in the URL fragment, and
      browsers do not send fragments to the server.
    - It does not log query strings, header values or request bodies.

  SECURITY SURFACE (summary; see README.md)
    - Any local process or local user can connect to the port and download the same public static files.
    - It does not protect against malware already running as you.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Start-ArMoConnected.ps1
  powershell -File .\Start-ArMoConnected.ps1 -TenantId '<tenant GUID>' -ClientId '<app GUID>'
#>
[CmdletBinding()]
param(
  [ValidateRange(1, 240)][int] $IdleMinutes = 20,
  [ValidatePattern('^$|^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$')][string] $TenantId = '',
  [ValidatePattern('^$|^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$')][string] $ClientId = '',
  [switch] $NoBrowser,
  # Test hooks for the prototype test suite.
  [ValidateRange(0, 65535)][int] $Port = 0,
  [ValidateRange(0, 86400)][int] $IdleSeconds = 0
)

if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
  Write-Host "ARMO_P4_ERROR language-mode=$($ExecutionContext.SessionState.LanguageMode) The launcher needs FullLanguage mode (it uses .NET sockets). It cannot run under Constrained Language Mode (AppLocker/WDAC) unless it is signed and allowed by your policy."
  exit 3
}

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------------------------------------------
# Fixed routes. Keys are compared case-sensitively. Nothing outside this table is ever read from disk.
# ---------------------------------------------------------------------------------------------------------------
$PinnedSha256 = @{
  'vendor/msal-browser.min.js'         = '56a548eae945c2479adf61d969140999e9f602ff627694cc0692346890556f52' # @azure/msal-browser 5.25.1
  'vendor/msal-redirect-bridge.min.js' = 'bd15092349b2e93ef363cdf60eaf881c62d0ad5557f98853e61231a8dc0f8269' # @azure/msal-browser 5.25.1
}

# Same policy as the meta tag in web/connected.html, plus frame-ancestors (only effective as a header).
$Csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; " +
       "connect-src https://login.microsoftonline.com https://graph.microsoft.com; " +
       "frame-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; " +
       "worker-src 'none'; manifest-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'"

$webRoot = Join-Path $PSScriptRoot 'web'
$routeSpec = @(
  @('/',                                   'connected.html',                     'text/html; charset=utf-8',       $true,  $false),
  @('/redirect.html',                      'redirect.html',                      'text/html; charset=utf-8',       $true,  $true),
  @('/connected.css',                      'connected.css',                      'text/css; charset=utf-8',        $false, $false),
  @('/connected.js',                       'connected.js',                       'text/javascript; charset=utf-8', $false, $false),
  @('/redirect.js',                        'redirect.js',                        'text/javascript; charset=utf-8', $false, $false),
  @('/vendor/msal-browser.min.js',         'vendor/msal-browser.min.js',         'text/javascript; charset=utf-8', $false, $false),
  @('/vendor/msal-redirect-bridge.min.js', 'vendor/msal-redirect-bridge.min.js', 'text/javascript; charset=utf-8', $false, $false)
)
$routes = New-Object 'System.Collections.Generic.Dictionary[string,object]' ([System.StringComparer]::Ordinal)
$sha = [System.Security.Cryptography.SHA256]::Create()
foreach ($r in $routeSpec) {
  $full = Join-Path $webRoot $r[1]
  $bytes = [System.IO.File]::ReadAllBytes($full)
  $hex = -join ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') })
  if ($PinnedSha256.ContainsKey($r[1]) -and $PinnedSha256[$r[1]] -ne $hex) {
    Write-Host "ARMO_P4_ERROR integrity $($r[1]) has SHA-256 $hex, expected $($PinnedSha256[$r[1]]). Refusing to start."
    exit 4
  }
  $routes[$r[0]] = @{ Bytes = $bytes; Type = $r[2]; IsDocument = $r[3]; AllowCrossSiteNavigation = $r[4] }
}

# ---------------------------------------------------------------------------------------------------------------
# Bind 127.0.0.1 and ::1 on the same port, exclusively. Binding both stops another process from squatting the
# other address family on our port (browsers may try ::1 first for "localhost").
# ---------------------------------------------------------------------------------------------------------------
function New-LoopbackListener([System.Net.IPAddress] $address, [int] $p) {
  $l = New-Object System.Net.Sockets.TcpListener($address, $p)
  $l.ExclusiveAddressUse = $true
  $l.Start(16)
  return $l
}

# Windows still lets another process bind the wildcard address (0.0.0.0 / ::) on the same port. A more specific bind
# normally wins for loopback traffic, but rather than rely on that, prove it: connect to ourselves and check that OUR
# listener received the connection.
function Test-OwnsLoopback($listener, [System.Net.IPAddress] $address, [int] $p) {
  $probe = New-Object System.Net.Sockets.TcpClient($address.AddressFamily)
  try {
    $probe.Connect($address, $p)
    $deadline = [DateTime]::UtcNow.AddMilliseconds(1000)
    while (-not $listener.Pending() -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 10 }
    if (-not $listener.Pending()) { return $false }
    $listener.AcceptTcpClient().Close()
    return $true
  } catch { return $false } finally { $probe.Close() }
}

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$ipv6 = [System.Net.Sockets.Socket]::OSSupportsIPv6
$v4 = $null; $v6 = $null; $bound = 0
for ($attempt = 1; $attempt -le 25 -and $bound -eq 0; $attempt++) {
  if ($Port -gt 0) { $candidate = $Port } else {
    $b = New-Object byte[] 2; $rng.GetBytes($b)
    $candidate = 49152 + ((([int]$b[0] -shl 8) -bor [int]$b[1]) % 16384)
  }
  $reason = ''
  try {
    $v4 = New-LoopbackListener ([System.Net.IPAddress]::Loopback) $candidate
    if ($ipv6) { $v6 = New-LoopbackListener ([System.Net.IPAddress]::IPv6Loopback) $candidate }
    if (-not (Test-OwnsLoopback $v4 ([System.Net.IPAddress]::Loopback) $candidate)) { $reason = 'another-socket-receives-127.0.0.1' }
    elseif ($null -ne $v6 -and -not (Test-OwnsLoopback $v6 ([System.Net.IPAddress]::IPv6Loopback) $candidate)) { $reason = 'another-socket-receives-::1' }
  } catch {
    $ex = $_.Exception; $reason = 'unknown'
    while ($null -ne $ex) { if ($ex -is [System.Net.Sockets.SocketException]) { $reason = [string]$ex.SocketErrorCode; break }; $ex = $ex.InnerException }
  }
  if ($reason -eq '') { $bound = $candidate } else {
    if ($v4) { $v4.Stop(); $v4 = $null }
    if ($v6) { $v6.Stop(); $v6 = $null }
    Write-Host "ARMO_P4_BIND_FAILED port=$candidate reason=$reason"
    if ($Port -gt 0) { Write-Host 'ARMO_P4_ERROR the requested port is not exclusively ours on both loopback addresses.'; exit 5 }
  }
}
if ($bound -eq 0) { Write-Host 'ARMO_P4_ERROR no free port found.'; exit 5 }

$allowedHosts = @("localhost:$bound", "127.0.0.1:$bound", "[::1]:$bound")
$idleLimit = if ($IdleSeconds -gt 0) { $IdleSeconds } else { $IdleMinutes * 60 }
$latin1 = [System.Text.Encoding]::GetEncoding(28591)

function Get-SafeLogText([string] $s) {
  if ($null -eq $s) { return '' }
  $t = $s -replace '[^A-Za-z0-9/._\-]', '?'
  if ($t.Length -gt 80) { $t = $t.Substring(0, 80) + '...' }
  return $t
}

function Send-Response($stream, [int] $status, [string] $reason, $route, [bool] $headOnly) {
  $body = $null
  $type = 'text/plain; charset=utf-8'
  if ($null -ne $route) { $body = $route.Bytes; $type = $route.Type } else { $body = [System.Text.Encoding]::ASCII.GetBytes("$status $reason`n") }
  $h = New-Object System.Text.StringBuilder
  [void]$h.Append("HTTP/1.1 $status $reason`r`n")
  [void]$h.Append("Content-Type: $type`r`n")
  [void]$h.Append("Content-Length: $($body.Length)`r`n")
  [void]$h.Append("Cache-Control: no-store`r`n")
  [void]$h.Append("X-Content-Type-Options: nosniff`r`n")
  [void]$h.Append("Referrer-Policy: no-referrer`r`n")
  [void]$h.Append("Cross-Origin-Resource-Policy: same-origin`r`n")
  if ($status -eq 405) { [void]$h.Append("Allow: GET, HEAD`r`n") }
  if ($null -eq $route -or $route.IsDocument) {
    [void]$h.Append("Content-Security-Policy: $Csp`r`n")
    [void]$h.Append("Cross-Origin-Opener-Policy: same-origin`r`n")
    [void]$h.Append("X-Frame-Options: DENY`r`n")
    [void]$h.Append("Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=()`r`n")
  }
  [void]$h.Append("Connection: close`r`n`r`n")
  $hb = [System.Text.Encoding]::ASCII.GetBytes($h.ToString())
  $stream.Write($hb, 0, $hb.Length)
  if (-not $headOnly) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

function Invoke-Request([System.Net.Sockets.TcpClient] $client) {
  $client.ReceiveTimeout = 5000
  $client.SendTimeout = 5000
  $remote = $client.Client.RemoteEndPoint
  if (-not [System.Net.IPAddress]::IsLoopback($remote.Address)) { return 'drop non-loopback peer' }
  $stream = $client.GetStream()

  # Read the request head (up to 16 KB, at most 10 seconds in total).
  $buf = New-Object byte[] 4096
  $ms = New-Object System.IO.MemoryStream
  $started = [DateTime]::UtcNow
  $end = -1
  while ($end -lt 0) {
    try { $n = $stream.Read($buf, 0, $buf.Length) } catch { return 'drop read-timeout' }
    if ($n -le 0) { return 'drop closed' }
    $ms.Write($buf, 0, $n)
    $end = $latin1.GetString($ms.ToArray()).IndexOf("`r`n`r`n")
    if ($end -lt 0 -and $ms.Length -gt 16384) { Send-Response $stream 431 'Request Header Fields Too Large' $null $false; return '431 header-too-large' }
    if ($end -lt 0 -and ([DateTime]::UtcNow - $started).TotalSeconds -gt 10) { return 'drop slow-request' }
  }
  if ($end -gt 16384) { Send-Response $stream 431 'Request Header Fields Too Large' $null $false; return '431 header-too-large' }
  $head = $latin1.GetString($ms.ToArray()).Substring(0, $end)
  if ($head -match '[^\x20-\x7E\r\n\t]') { Send-Response $stream 400 'Bad Request' $null $false; return '400 non-ascii-head' }
  $lines = $head -split "`r`n"

  if ($lines[0] -cnotmatch '^([A-Z]{1,10}) (\S{1,2048}) HTTP/1\.[01]$') { Send-Response $stream 400 'Bad Request' $null $false; return '400 bad-request-line' }
  $method = $Matches[1]; $target = $Matches[2]

  $hdr = New-Object 'System.Collections.Generic.Dictionary[string,System.Collections.Generic.List[string]]' ([System.StringComparer]::OrdinalIgnoreCase)
  for ($i = 1; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -cnotmatch '^([!#$%&''*+.^_`|~0-9A-Za-z-]+):[ \t]*(.*?)[ \t]*$') { Send-Response $stream 400 'Bad Request' $null $false; return '400 bad-header' }
    if (-not $hdr.ContainsKey($Matches[1])) { $hdr[$Matches[1]] = New-Object 'System.Collections.Generic.List[string]' }
    $hdr[$Matches[1]].Add($Matches[2])
  }
  $one = { param($name) if ($hdr.ContainsKey($name) -and $hdr[$name].Count -eq 1) { $hdr[$name][0] } elseif ($hdr.ContainsKey($name)) { '<multiple>' } else { $null } }

  # 1. Host header: exactly one, and one of our three loopback authorities (defeats DNS rebinding).
  $hostValue = & $one 'Host'
  if ($null -eq $hostValue -or $hostValue -eq '<multiple>') { Send-Response $stream 400 'Bad Request' $null $false; return '400 host-missing-or-repeated' }
  if ($allowedHosts -notcontains $hostValue.ToLowerInvariant()) { Send-Response $stream 421 'Misdirected Request' $null $false; return "421 host-rejected $(Get-SafeLogText $hostValue)" }
  if ($hdr.ContainsKey('Transfer-Encoding')) { Send-Response $stream 400 'Bad Request' $null $false; return '400 transfer-encoding' }

  # 2. Method: read-only.
  if ($method -ne 'GET' -and $method -ne 'HEAD') { Send-Response $stream 405 'Method Not Allowed' $null $false; return "405 $method" }

  # 3. Path: exact match against the fixed table (query string ignored, never logged).
  if (-not $target.StartsWith('/')) { Send-Response $stream 400 'Bad Request' $null $false; return '400 not-origin-form' }
  $path = $target.Split('?')[0]
  if (-not $routes.ContainsKey($path)) { Send-Response $stream 404 'Not Found' $null ($method -eq 'HEAD'); return "404 $(Get-SafeLogText $path)" }
  $route = $routes[$path]

  # 4. Fetch metadata: only our own pages may load our files; only the redirect page accepts a cross-site navigation.
  $site = & $one 'Sec-Fetch-Site'
  if ($null -ne $site) {
    $mode = & $one 'Sec-Fetch-Mode'; $dest = & $one 'Sec-Fetch-Dest'
    $ok = ($site -eq 'same-origin' -or $site -eq 'none')
    if (-not $ok -and $route.AllowCrossSiteNavigation -and $mode -eq 'navigate' -and $dest -eq 'document') { $ok = $true }
    if (-not $ok) { Send-Response $stream 403 'Forbidden' $null $false; return "403 fetch-metadata site=$(Get-SafeLogText $site) dest=$(Get-SafeLogText $dest) $path" }
  }

  Send-Response $stream 200 'OK' $route ($method -eq 'HEAD')
  return "200 $method $path"
}

$url = "http://localhost:$bound/"
if ($TenantId -or $ClientId) { $url += "#tenant=$TenantId&client=$ClientId" }
Write-Host "ARMO_P4_LISTENING port=$bound ipv4=127.0.0.1 ipv6=$(if ($v6) { '::1' } else { 'none' }) idleSeconds=$idleLimit"
Write-Host "PROTOTYPE connected-mode page: http://localhost:$bound/  (Ctrl+C to stop; stops by itself after $idleLimit s idle)"
if (-not $NoBrowser) { Start-Process $url }

$lastActivity = [DateTime]::UtcNow
try {
  while ($true) {
    if (([DateTime]::UtcNow - $lastActivity).TotalSeconds -gt $idleLimit) { Write-Host 'ARMO_P4_STOPPED reason=idle'; break }
    $client = $null
    if ($v4.Pending()) { $client = $v4.AcceptTcpClient() }
    elseif ($null -ne $v6 -and $v6.Pending()) { $client = $v6.AcceptTcpClient() }
    else { Start-Sleep -Milliseconds 20; continue }
    $lastActivity = [DateTime]::UtcNow
    try { $result = Invoke-Request $client } catch { $result = "error $($_.Exception.GetType().Name)" } finally { $client.Close() }
    Write-Host ("{0:HH:mm:ss} {1}" -f (Get-Date), $result)
  }
} finally {
  $v4.Stop()
  if ($null -ne $v6) { $v6.Stop() }
}
