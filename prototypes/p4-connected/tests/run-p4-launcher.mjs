// P4 launcher tests: loopback-only binding, Host header (DNS rebinding), methods, paths, fetch metadata, malformed
// requests, slow clients, exclusive binding and port squatting, idle shutdown, integrity pinning, Constrained Language
// Mode, and log hygiene. Uses raw sockets so it can send requests a browser would never send.
// Run: node prototypes/p4-connected/tests/run-p4-launcher.mjs   (Windows, Windows PowerShell 5.1, Edge for L10)
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { P4_DIR, LAUNCHER, startLauncher, stopLauncher, waitForExit, rawRequest, get, freePort, listen, ps, sleep, writeResults, makeChecker } from './lib.mjs';

const results = { probe: 'P4 launcher', ranAt: new Date().toISOString(), os: `${os.type()} ${os.release()}`, powershell: ps('$PSVersionTable.PSVersion.ToString()') };
const check = makeChecker(results);
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'armo-p4-'));

const L = await startLauncher(['-IdleSeconds', '300']);
const P = L.port;
check('L0', 'launcher starts and reports a port in 49152-65535', P >= 49152 && P <= 65535, { port: P, firstLines: L.lines.slice(0, 2) });

// L1 listening sockets
const listening = ps(`Get-NetTCPConnection -State Listen -LocalPort ${P} | Sort-Object LocalAddress | ForEach-Object { $_.LocalAddress }`).split(/\r?\n/).filter(Boolean);
check('L1a', 'listens on 127.0.0.1 and ::1 only', listening.length === 2 && listening.includes('127.0.0.1') && listening.includes('::1'), listening);
const lanAddrs = Object.values(os.networkInterfaces()).flat().filter((a) => !a.internal && a.family === 'IPv4').map((a) => a.address);
const lan = [];
for (const a of lanAddrs) lan.push({ address: '<lan-ip>', result: (await rawRequest(P, `GET / HTTP/1.1\r\nHost: localhost:${P}\r\n\r\n`, { host: a, timeoutMs: 3000 })).error || 'CONNECTED' });
check('L1b', 'connection to the machine\'s non-loopback IPv4 addresses is refused', lan.length > 0 && lan.every((x) => x.result === 'ECONNREFUSED'), lan);

// L2 Host header
const hostCases = [
  [`localhost:${P}`, 200], [`LOCALHOST:${P}`, 200], [`127.0.0.1:${P}`, 200], [`[::1]:${P}`, 200],
  ['localhost', 421], [`localhost:${P + 1}`, 421], [`evil.example:${P}`, 421], [`localhost.evil.example:${P}`, 421],
  [`127.0.0.2:${P}`, 421], [`0.0.0.0:${P}`, 421], [`localhost:${P}.evil.example`, 421], [`localhost:0${P}`, 421],
];
const hostObs = [];
for (const [h, want] of hostCases) { const r = await get(P, '/', { Host: h }); hostObs.push({ host: h.replace(String(P), '<port>'), status: r.status, want }); }
check('L2a', 'only localhost/127.0.0.1/[::1] with our port are accepted (DNS rebinding)', hostObs.every((x) => x.status === x.want), hostObs);
const noHost = await get(P, '/', { Host: null });
const twoHosts = await rawRequest(P, `GET / HTTP/1.1\r\nHost: localhost:${P}\r\nHost: evil.example\r\n\r\n`);
check('L2b', 'missing or repeated Host header is rejected', noHost.status === 400 && twoHosts.status === 400, { missing: noHost.status, repeated: twoHosts.status });

// L3 methods and CORS
const methodObs = {};
for (const m of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'TRACE', 'CONNECT']) {
  const r = await get(P, '/', { Origin: 'http://evil.example', 'Access-Control-Request-Method': 'POST', 'Content-Length': '0' }, { method: m });
  methodObs[m] = { status: r.status, acao: r.headers['access-control-allow-origin'] || null };
}
check('L3a', 'every method except GET/HEAD gets 405, with no CORS headers', Object.values(methodObs).every((x) => x.status === 405 && x.acao === null), methodObs);
const headR = await get(P, '/', {}, { method: 'HEAD' });
check('L3b', 'HEAD returns headers only', headR.status === 200 && headR.body === '', { status: headR.status, bodyBytes: headR.body.length });
const corsGet = await get(P, '/connected.js', { Origin: 'http://evil.example' });
check('L3c', 'GET with a foreign Origin header still gets no Access-Control-Allow-Origin', !('access-control-allow-origin' in corsGet.headers), Object.keys(corsGet.headers));

// L4 paths
const paths = ['/../Start-ArMoConnected.ps1', '/..%2fStart-ArMoConnected.ps1', '/%2e%2e/Start-ArMoConnected.ps1', '/vendor/../connected.js', '/vendor/..\\..\\README.md',
  '/Start-ArMoConnected.ps1', '/README.md', '/web/connected.html', '/connected.html', '/Redirect.html', '/vendor/', '/vendor/LICENSE-msal-browser.txt', '//etc/passwd',
  '/C:/Windows/win.ini', '/redirect.html/', '/connected.js%00.txt', '/favicon.ico'];
const pathObs = [];
for (const p of paths) pathObs.push({ path: p, status: (await get(P, p)).status });
check('L4a', 'anything outside the fixed route table is 404 (no traversal, no case folding)', pathObs.every((x) => x.status === 404), pathObs);
const absForm = await rawRequest(P, `GET http://localhost:${P}/ HTTP/1.1\r\nHost: localhost:${P}\r\n\r\n`);
const okPaths = [];
for (const p of ['/', '/redirect.html', '/redirect.html?code=abc&state=xyz', '/connected.js', '/connected.css', '/redirect.js', '/vendor/msal-browser.min.js', '/vendor/msal-redirect-bridge.min.js']) okPaths.push({ path: p, status: (await get(P, p)).status });
check('L4b', 'the 7 routes are served (query string ignored); absolute-form target is refused', okPaths.every((x) => x.status === 200) && absForm.status === 400, { okPaths, absoluteForm: absForm.status });

// L5 fetch metadata
const fm = (site, mode, dest) => ({ 'Sec-Fetch-Site': site, 'Sec-Fetch-Mode': mode, 'Sec-Fetch-Dest': dest });
const fmCases = [
  ['/', fm('none', 'navigate', 'document'), 200, 'user opens the URL'],
  ['/', fm('same-origin', 'navigate', 'document'), 200, 'reload / own navigation'],
  ['/', fm('cross-site', 'navigate', 'document'), 403, 'another website navigates to the app'],
  ['/', fm('same-site', 'navigate', 'document'), 403, 'another localhost port navigates to the app'],
  ['/', fm('cross-site', 'navigate', 'iframe'), 403, 'framed by another site'],
  ['/redirect.html', fm('cross-site', 'navigate', 'document'), 200, 'return from login.microsoftonline.com'],
  ['/redirect.html', fm('cross-site', 'navigate', 'iframe'), 403, 'redirect page in a cross-site frame'],
  ['/redirect.html', fm('cross-site', 'no-cors', 'script'), 403, 'redirect page as a cross-site subresource'],
  ['/connected.js', fm('same-origin', 'no-cors', 'script'), 200, 'our page loads its script'],
  ['/connected.js', fm('same-site', 'no-cors', 'script'), 403, 'another localhost port includes our script'],
  ['/connected.js', fm('cross-site', 'cors', 'empty'), 403, 'fetch() from a website'],
  ['/vendor/msal-browser.min.js', fm('cross-site', 'no-cors', 'script'), 403, 'website includes MSAL from us'],
];
const fmObs = [];
for (const [p, h, want, why] of fmCases) fmObs.push({ path: p, ...h, why, status: (await get(P, p, h)).status, want });
check('L5', 'Sec-Fetch-Site policy: only same-origin/none, plus a top-level navigation to /redirect.html', fmObs.every((x) => x.status === x.want), fmObs);

// L6 malformed requests
const big = 'X-Pad: ' + 'a'.repeat(20000) + '\r\n';
const malformed = {
  hugeHeaders: (await rawRequest(P, `GET / HTTP/1.1\r\nHost: localhost:${P}\r\n${big}\r\n`)).status,
  nonAsciiByte: (await rawRequest(P, Buffer.concat([Buffer.from(`GET / HTTP/1.1\r\nHost: localhost:${P}\r\nX-A: `), Buffer.from([0xe9]), Buffer.from('\r\n\r\n')]))).status,
  lowercaseMethod: (await rawRequest(P, `get / HTTP/1.1\r\nHost: localhost:${P}\r\n\r\n`)).status,
  http2Preface: (await rawRequest(P, 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n')).status,
  transferEncoding: (await rawRequest(P, `GET / HTTP/1.1\r\nHost: localhost:${P}\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n`)).status,
  obsFoldHeader: (await rawRequest(P, `GET / HTTP/1.1\r\nHost: localhost:${P}\r\nX-A: 1\r\n continued\r\n\r\n`)).status,
  spaceBeforeColon: (await rawRequest(P, `GET / HTTP/1.1\r\nHost : evil.example\r\nHost: localhost:${P}\r\n\r\n`)).status,
};
check('L6a', 'malformed requests are rejected (431 / 400)', malformed.hugeHeaders === 431 && ['nonAsciiByte', 'lowercaseMethod', 'http2Preface', 'transferEncoding', 'obsFoldHeader', 'spaceBeforeColon'].every((k) => malformed[k] === 400), malformed);
const bareLf = await rawRequest(P, `GET / HTTP/1.1\nHost: localhost:${P}\n\n`, { timeoutMs: 20000 });
check('L6b', 'a request that never completes its head (bare LF) is dropped by the 5 s read timeout', bareLf.status === 0 && !bareLf.timedOut && bareLf.ms < 12000, { ms: bareLf.ms, status: bareLf.status });

// L7 slow / idle client: the launcher is single-threaded, so one silent connection delays others until it times out.
const idleConn = rawRequest(P, null, { timeoutMs: 20000 });
await sleep(300);
const t0 = Date.now();
const afterIdle = await get(P, '/');
const delay = Date.now() - t0;
const idleRes = await idleConn;
check('L7', 'a silent connection blocks the single-threaded server only until its 5 s read timeout', afterIdle.status === 200 && delay < 8000, { secondRequestDelayMs: delay, silentConnectionClosedAfterMs: idleRes.ms });

// L8 exclusive binding: nobody else can bind our port on either loopback address or the wildcard addresses.
const nodeBinds = {};
for (const h of ['127.0.0.1', '0.0.0.0', '::1', '::']) { const r = await listen(h, P); nodeBinds[h] = r.ok ? 'BOUND' : r.error; if (r.ok) r.server.close(); }
const reuseBind = (addr) => ps(`$s = New-Object System.Net.Sockets.Socket([System.Net.IPAddress]::Parse('${addr}').AddressFamily, 'Stream', 'Tcp'); $s.SetSocketOption('Socket', 'ReuseAddress', $true); try { $s.Bind((New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Parse('${addr}'), ${P}))); $s.Listen(1); 'BOUND' } catch { $e = $_.Exception; while ($e -and -not ($e -is [System.Net.Sockets.SocketException])) { $e = $e.InnerException }; if ($e) { [string]$e.SocketErrorCode } else { 'error' } } finally { $s.Close() }`);
const reuse = { '127.0.0.1': reuseBind('127.0.0.1'), '0.0.0.0': reuseBind('0.0.0.0'), '::1': reuseBind('::1'), '::': reuseBind('::') };
check('L8a', 'while running, no other socket can bind 127.0.0.1 or ::1 on the port (plain or SO_REUSEADDR)', ['127.0.0.1', '::1'].every((h) => nodeBinds[h] !== 'BOUND' && reuse[h] !== 'BOUND'), { nodeBinds, soReuseAddr: reuse });
// Wildcard binds are still possible on Windows. Do they steal loopback traffic? Hold them open and look.
const wild4 = await listen('0.0.0.0', P);
const wild6 = await listen('::', P);
const via4 = await get(P, '/', {}, { host: '127.0.0.1' });
const via6 = await get(P, '/', { Host: `[::1]:${P}` }, { host: '::1' });
const wildObs = { squatter0000: wild4.ok ? 'bound' : wild4.error, squatterIn6Any: wild6.ok ? 'bound' : wild6.error, '127.0.0.1': via4.body.startsWith('<!doctype html>') ? 'launcher' : via4.body.slice(0, 20), '::1': via6.body.startsWith('<!doctype html>') ? 'launcher' : via6.body.slice(0, 20) };
if (wild4.ok) wild4.server.close();
if (wild6.ok) wild6.server.close();
check('L8b', 'wildcard squatters bound after start do not receive loopback connections (specific bind wins)', wildObs['127.0.0.1'] === 'launcher' && wildObs['::1'] === 'launcher', wildObs);

// L11 log hygiene (query strings and hostile header values are not logged verbatim)
await get(P, '/redirect.html?code=SECRET-CODE-123&state=xyz');
await get(P, '/', { Host: 'evil.example\u001b[31m' });
await sleep(400);
const logText = L.lines.join('\n');
check('L11', 'launcher log never contains query strings or raw hostile header values', !logText.includes('SECRET-CODE-123') && !logText.includes('\u001b'), L.lines.filter((l) => /redirect|host-rejected/.test(l)).slice(-3));
stopLauncher(L);

// L9 pre-squatted port: the launcher must refuse a port where either loopback address (or a wildcard) is taken.
const squat = [];
for (const h of ['::1', '127.0.0.1', '0.0.0.0', '::']) {
  const q = await freePort();
  const s = await listen(h, q);
  const l2 = await startLauncher(['-Port', String(q), '-IdleSeconds', '30']);
  const code = l2.exited !== null ? l2.exited : await waitForExit(l2, 3000);
  const entry = { squatterOn: h, launcher: l2.port ? 'started' : `refused, exit ${code}`, lines: l2.lines.filter((x) => x.startsWith('ARMO_P4')) };
  if (l2.port) {
    const a = await get(q, '/', {}, { host: '127.0.0.1' });
    const b = await get(q, '/', { Host: `[::1]:${q}` }, { host: '::1' });
    entry.loopbackReaches = { '127.0.0.1': a.body.startsWith('<!doctype html>') ? 'launcher' : 'SQUATTER', '::1': b.body.startsWith('<!doctype html>') ? 'launcher' : 'SQUATTER' };
  }
  squat.push(entry);
  stopLauncher(l2);
  if (s.ok) s.server.close();
}
results.squatting = squat;
const squatOk = (x) => x.launcher.startsWith('refused') || (x.loopbackReaches && x.loopbackReaches['127.0.0.1'] === 'launcher' && x.loopbackReaches['::1'] === 'launcher');
check('L9', 'with a pre-squatted port the launcher either refuses it, or (wildcard squatter) still owns all loopback traffic', squat.every(squatOk), squat.map((x) => `${x.squatterOn}: ${x.launcher}${x.loopbackReaches ? ' ' + JSON.stringify(x.loopbackReaches) : ''}`));
const randomAfterSquat = await (async () => { const l3 = await startLauncher(['-IdleSeconds', '10']); const ok = !!l3.port; stopLauncher(l3); return ok; })();
check('L9b', 'in normal (random-port) mode the launcher simply picks another free port', randomAfterSquat);

// L10 why both address families are bound: a "naive" server on 127.0.0.1 only vs a squatter on [::1], same port.
const R = await freePort();
const ours = await listen('127.0.0.1', R, 'OURS');
const theirs = await listen('::1', R, 'SQUATTER');
const naive = {};
for (const channel of ['msedge', 'chrome']) {
  const b = await chromium.launch({ channel, headless: true });
  const pg = await b.newPage();
  try { await pg.goto(`http://localhost:${R}/`, { timeout: 10000 }); naive[channel] = (await pg.textContent('body')).trim(); } catch (e) { naive[channel] = 'error ' + e.message.split('\n')[0]; }
  await b.close();
}
theirs.server.close();
const naiveNoSquatter = {};
{
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const pg = await b.newPage();
  await pg.goto(`http://localhost:${R}/`, { timeout: 10000 }); naiveNoSquatter.msedge = (await pg.textContent('body')).trim();
  await b.close();
}
ours.server.close();
results.naiveLocalhostResolution = { withIpv6Squatter: naive, withoutSquatter: naiveNoSquatter };
check('L10', 'demonstration: with only 127.0.0.1 bound, a squatter on [::1] receives http://localhost:<port>/', Object.values(naive).some((v) => v === 'SQUATTER'), results.naiveLocalhostResolution);

// L12 idle shutdown
const li = await startLauncher(['-IdleSeconds', '4']);
const t1 = Date.now();
const idleExit = await waitForExit(li, 15000);
const portClosed = (await rawRequest(li.port, `GET / HTTP/1.1\r\nHost: localhost:${li.port}\r\n\r\n`, { timeoutMs: 2000 })).error;
check('L12', 'launcher exits by itself after the idle period and the port closes', idleExit === 0 && portClosed === 'ECONNREFUSED', { exitCode: idleExit, afterMs: Date.now() - t1, lastLine: li.lines[li.lines.length - 1], connectAfterExit: portClosed });

// L13 integrity pinning (on a copy; the real files are not touched)
const copy = path.join(SCRATCH, 'p4-tamper');
fs.cpSync(path.join(P4_DIR, 'web'), path.join(copy, 'web'), { recursive: true });
fs.copyFileSync(LAUNCHER, path.join(copy, 'Start-ArMoConnected.ps1'));
fs.appendFileSync(path.join(copy, 'web', 'vendor', 'msal-browser.min.js'), '\n;window.__tampered=1;');
const lt = await startLauncher(['-IdleSeconds', '10'], { script: path.join(copy, 'Start-ArMoConnected.ps1') });
const ltCode = lt.exited !== null ? lt.exited : await waitForExit(lt, 5000);
check('L13', 'launcher refuses to start when a vendored MSAL file does not match its pinned SHA-256', !lt.port && ltCode === 4, { exitCode: ltCode, line: lt.lines.find((x) => x.includes('integrity')) && 'ARMO_P4_ERROR integrity ... Refusing to start.' });
stopLauncher(lt);

// L14 Constrained Language Mode (as AppLocker/WDAC would impose). Two simulations.
const clm1 = ps(`$ExecutionContext.SessionState.LanguageMode = 'ConstrainedLanguage'; & '${LAUNCHER.replace(/'/g, "''")}' -NoBrowser -IdleSeconds 5; "exit=$LASTEXITCODE"`);
const envLock = { ...process.env, __PSLockdownPolicy: '4' };
const clm2 = await startLauncher(['-IdleSeconds', '5'], { env: envLock });
const clm2Code = clm2.exited !== null ? clm2.exited : await waitForExit(clm2, 8000);
stopLauncher(clm2);
results.constrainedLanguage = {
  sessionLanguageModeSet: clm1.split(/\r?\n/).slice(0, 3),
  lockdownPolicyEnv4: { exitCode: clm2Code, startedInFullLanguage: !!clm2.port, note: 'the __PSLockdownPolicy=4 test hook was not honoured by this Windows PowerShell build, so it cannot simulate WDAC here' },
};
check('L14', 'in a Constrained Language session the launcher stops with a clear message and exit code 3', /language-mode=ConstrainedLanguage/.test(clm1) && /exit=3/.test(clm1), results.constrainedLanguage.sessionLanguageModeSet);

// L15 execution policy: a downloaded copy (Mark of the Web, ZoneId=3) under RemoteSigned, this machine's policy.
const motw = path.join(SCRATCH, 'p4-motw');
fs.cpSync(path.join(P4_DIR, 'web'), path.join(motw, 'web'), { recursive: true });
const motwScript = path.join(motw, 'Start-ArMoConnected.ps1');
fs.copyFileSync(LAUNCHER, motwScript);
fs.writeFileSync(motwScript + ':Zone.Identifier', '[ZoneTransfer]\r\nZoneId=3\r\n');
const motwRun = ps(`try { & powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File '${motwScript.replace(/'/g, "''")}' -NoBrowser -IdleSeconds 3 2>&1 | Select-Object -First 2 | ForEach-Object { "$_" } } catch { $_.Exception.Message }; "exit=$LASTEXITCODE"`);
results.executionPolicy = { machinePolicy: ps('Get-ExecutionPolicy'), downloadedCopyUnderRemoteSigned: motwRun.split(/\r?\n/).map((l) => l.slice(0, 160)).slice(0, 3) };
check('L15', 'a downloaded (Mark-of-the-Web) unsigned copy is refused under RemoteSigned: release needs code signing or Unblock-File guidance', !/ARMO_P4_LISTENING/.test(motwRun) && /not digitally signed|cannot be loaded|UnauthorizedAccess/i.test(motwRun), results.executionPolicy);

fs.rmSync(SCRATCH, { recursive: true, force: true });
results.summary = { passed: results.checks.filter((c) => c.pass).length, failed: results.checks.filter((c) => !c.pass).map((c) => c.id) };
console.log(JSON.stringify(results.summary));
console.log('written', writeResults('p4-launcher-results', results));
process.exit(0);
