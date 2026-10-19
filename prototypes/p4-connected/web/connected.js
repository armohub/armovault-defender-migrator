// PROTOTYPE P4 (release-2 spike) - optional, read-only connected checks for the ArMoHub Defender Migration Assistant.
// Classic script. Rules this file follows:
// - Tenant data is hostile input: it is copied field by field into plain objects, capped, stripped of control and
//   bidi characters, and only ever reaches the page as text nodes. There is no innerHTML (Trusted Types would block it).
// - Tokens stay inside MSAL's in-memory cache. Nothing is written to localStorage, IndexedDB, cookies or files, except
//   the evidence note the user explicitly previews and exports.
// - Only two requests are possible (see ALLOWED). The CSP additionally limits connections to Entra and Graph.
(function () {
  'use strict';

  const GRAPH_SCOPES = Object.freeze([
    'https://graph.microsoft.com/SecurityIncident.Read.All',
    'https://graph.microsoft.com/SecurityAlert.Read.All',
    'https://graph.microsoft.com/ThreatHunting.Read.All',
  ]);
  const INCIDENTS_URL = 'https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts';
  const HUNTING_URL = 'https://graph.microsoft.com/v1.0/security/runHuntingQuery';
  const HUNTING_QUERY = [
    'let since = ago(7d);',
    'union isfuzzy=true',
    '    (SecurityIncident',
    '    | where TimeGenerated > since',
    '    | extend Table = "SecurityIncident", Provider = tostring(ProviderName)',
    '    | summarize Items = dcount(IncidentNumber) by Table, Provider),',
    '    (AlertInfo',
    '    | where Timestamp > since',
    '    | extend Table = "AlertInfo", Provider = tostring(ServiceSource)',
    '    | summarize Items = dcount(AlertId) by Table, Provider)',
    '| order by Table asc, Items desc',
    '| take 50',
  ].join('\n');
  const HUNTING_TIMESPAN = 'P7D';
  const ALLOWED = Object.freeze([
    Object.freeze({ method: 'GET', url: INCIDENTS_URL }),
    Object.freeze({ method: 'POST', url: HUNTING_URL }),
  ]);
  const MAX_RESPONSE_CHARS = 8 * 1024 * 1024;
  const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const TOOL = Object.freeze({ name: 'ArMoHub DMA connected-mode prototype (P4)', version: '0.0.0-p4' });
  const SEVERITIES = ['unknown', 'informational', 'low', 'medium', 'high'];
  const INCIDENT_STATUSES = ['active', 'resolved', 'inProgress', 'redirected', 'awaitingAction'];

  // ----- hostile-input helpers -------------------------------------------------------------------------------
  // C0/C1 controls (except tab/newline), zero-width characters, bidi embeddings/overrides/isolates and BOM.
  const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
  const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const arr = (v) => (Array.isArray(v) ? v : []);
  function clean(v, max) {
    let s = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
    s = s.replace(UNSAFE_CHARS, '\uFFFD');
    return s.length > max ? s.slice(0, max) + '\u2026' : s;
  }
  const token = (v) => (typeof v === 'string' && /^[A-Za-z0-9]{1,60}$/.test(v) ? v : v == null || v === '' ? '' : 'other');
  const oneOf = (v, list) => (list.includes(v) ? v : v == null || v === '' ? '' : 'other');
  const iso = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(v) ? v.slice(0, 40) : '');
  function hostOf(v) {
    if (typeof v !== 'string' || v === '') return '';
    try { const u = new URL(v); return u.protocol === 'https:' ? clean(u.hostname, 100) : '(not https)'; } catch (e) { return '(invalid)'; }
  }
  function tally(values) {
    const m = new Map();
    for (const v of values) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([name, count]) => ({ name, count }));
  }
  const tallyText = (t) => t.map((x) => `${x.name || '(none)'} ${x.count}`).join(', ') || 'none';

  // ----- DOM helpers (text only) --------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    for (const k of Object.keys(attrs || {})) {
      if (!/^(class|scope|colspan)$/.test(k)) throw new Error('attribute not allowed: ' + k);
      n.setAttribute(k, String(attrs[k]));
    }
    for (const c of [].concat(children == null ? [] : children)) n.append(c instanceof Node ? c : String(c));
    return n;
  }
  function table(headers, rows) {
    return el('table', null, [
      el('thead', null, el('tr', null, headers.map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', null, rows.map((r) => el('tr', null, r.map((c) => el('td', null, c))))),
    ]);
  }
  function setStatus(text, kind) { const s = $('signin-status'); s.textContent = text; s.className = 'small ' + (kind || ''); }

  // ----- state (memory only) ----------------------------------------------------------------------------
  let pca = null;
  let account = null;
  const results = { incidents: null, hunting: null };
  let previewed = '';

  // ----- environment ---------------------------------------------------------------------------------
  function environmentProblem() {
    if (location.protocol !== 'http:' || location.hostname !== 'localhost' || !/^\d{2,5}$/.test(location.port)) {
      return 'Open this page through Start-ArMoConnected.ps1, which serves it on http://localhost:<port>/. It does not work from a file or from 127.0.0.1, because the sign-in redirect returns to localhost.';
    }
    if (!window.msal || typeof window.msal.createStandardPublicClientApplication !== 'function') return 'The sign-in library (vendor/msal-browser.min.js) did not load.';
    if (!window.isSecureContext || typeof BroadcastChannel === 'undefined' || !window.crypto || !window.crypto.subtle) return 'This browser lacks a feature the sign-in library needs (secure context, BroadcastChannel or WebCrypto).';
    return '';
  }

  // ----- sign-in ---------------------------------------------------------------------------------------
  const ids = () => ({ tenant: $('tenant').value.trim().toLowerCase(), client: $('client').value.trim().toLowerCase() });
  function refreshSignInButton() {
    const { tenant, client } = ids();
    $('signin').disabled = !($('consent').checked && GUID_RE.test(tenant) && GUID_RE.test(client) && !environmentProblem());
  }

  const AADSTS_HINTS = {
    AADSTS50011: 'The redirect URI is not registered. Add http://localhost/redirect.html under "Single-page application" on the app registration.',
    AADSTS65001: 'Consent is missing. A tenant administrator must grant admin consent for the three Graph permissions.',
    AADSTS700016: 'The application (client) ID was not found in this tenant.',
    AADSTS90002: 'The tenant ID was not found.',
    AADSTS50105: 'Your account is not assigned to this app registration (assignment required).',
    AADSTS53003: 'A Conditional Access policy blocked the sign-in.',
    AADSTS50020: 'Your account is not from this tenant. The app is single-tenant.',
    AADSTS9002326: 'The redirect URI is registered under the wrong platform. It must be "Single-page application".',
  };
  function describeError(e) {
    const code = clean((e && (e.errorCode || e.name)) || 'error', 80);
    const m = /AADSTS\d{5,7}/.exec(String((e && (e.errorMessage || e.message)) || ''));
    const parts = [code];
    if (m) parts.push(m[0] + (AADSTS_HINTS[m[0]] ? ' - ' + AADSTS_HINTS[m[0]] : ''));
    else if (code === 'user_cancelled') parts.push('The pop-up was closed.');
    else if (code === 'popup_window_error') parts.push('The browser blocked the pop-up. Allow pop-ups for this page and try again.');
    else if (code === 'timed_out') parts.push('No sign-in response arrived in time.');
    if (e && e.correlationId) parts.push('correlation ID ' + clean(e.correlationId, 40));
    return parts.join('. ');
  }

  async function signIn() {
    const { tenant, client } = ids();
    if (!GUID_RE.test(tenant) || !GUID_RE.test(client)) return;
    $('signin').disabled = true;
    setStatus('Waiting for the Microsoft sign-in pop-up...');
    try {
      pca = await window.msal.createStandardPublicClientApplication({
        auth: {
          clientId: client,
          authority: 'https://login.microsoftonline.com/' + tenant,
          redirectUri: location.origin + '/redirect.html',
          postLogoutRedirectUri: null,
        },
        cache: { cacheLocation: 'memoryStorage' },
        system: {
          popupBridgeTimeout: 180000, // MFA can take a while; there is no "pop-up closed" detection in the v5 bridge flow
          allowPlatformBroker: false,
          loggerOptions: { piiLoggingEnabled: false, logLevel: window.msal.LogLevel.Warning, loggerCallback: () => {} },
        },
      });
      const res = await pca.loginPopup({ scopes: [...GRAPH_SCOPES], prompt: 'select_account' });
      account = res.account;
      pca.setActiveAccount(account);
      $('tenant').disabled = true; $('client').disabled = true;
      $('who').textContent = clean(account.name || account.username || 'unknown account', 120);
      $('s-session').hidden = false;
      setStatus('Signed in. Tokens are held in this tab\u2019s memory only.', 'good');
    } catch (e) {
      setStatus('Sign-in did not complete: ' + describeError(e), 'bad');
      refreshSignInButton();
    }
  }

  async function getToken() {
    const request = { scopes: [...GRAPH_SCOPES], account };
    try {
      return (await pca.acquireTokenSilent(request)).accessToken;
    } catch (e) {
      if (e instanceof window.msal.InteractionRequiredAuthError) return (await pca.acquireTokenPopup(request)).accessToken;
      throw e;
    }
  }

  async function forget() {
    try { if (pca) await pca.clearCache(); } catch (e) { /* the reload below drops memory anyway */ }
    pca = null; account = null;
    location.replace(location.origin + '/');
  }

  // ----- the only network access to the tenant ---------------------------------------------------------
  async function graphRequest(method, url, body) {
    if (!ALLOWED.some((a) => a.method === method && a.url === url)) throw new Error('Refused: this page only sends its two documented read-only requests.');
    const at = new Date().toISOString();
    let accessToken;
    try { accessToken = await getToken(); } catch (e) { return { at, status: 0, ok: false, error: 'token: ' + describeError(e) }; }
    const headers = { Authorization: 'Bearer ' + accessToken };
    if (body) headers['Content-Type'] = 'application/json; charset=utf-8';
    let res;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    } catch (e) {
      return { at, status: 0, ok: false, error: 'network: the request did not complete (offline, blocked, or not allowed by CORS).' };
    }
    const out = { at, status: res.status, ok: res.ok, error: '', retryAfter: clean(res.headers.get('Retry-After'), 20), requestId: clean(res.headers.get('request-id'), 40), json: null };
    const text = await res.text();
    if (text.length > MAX_RESPONSE_CHARS) return Object.assign(out, { ok: false, error: 'response too large; ignored' });
    try { out.json = JSON.parse(text); } catch (e) { out.json = null; }
    if (!res.ok) {
      const err = isPlainObject(out.json) && isPlainObject(out.json.error) ? out.json.error : {};
      out.error = `HTTP ${res.status}${err.code ? ' ' + clean(err.code, 80) : ''}${err.message ? ': ' + clean(err.message, 300) : ''}`;
      out.json = null;
    }
    return out;
  }

  function failureAdvice(r) {
    if (r.status === 401) return 'The token was not accepted. Sign in again.';
    if (r.status === 403) return 'Access denied. Check that an administrator granted consent for the permission, and that your account has a supported Entra role (Security Reader, Global Reader, Security Operator or Security Administrator).';
    if (r.status === 429) return 'Throttled by Microsoft Graph' + (r.retryAfter ? `; retry after ${r.retryAfter} s.` : '. Retry-After was not readable; wait a minute.');
    if (r.status === 400) return 'Graph rejected the request (for example the query syntax or an unavailable table).';
    return '';
  }

  // ----- check 1: incidents ------------------------------------------------------------------------------
  function pickIncident(x) {
    return {
      id: clean(x.id, 40),
      title: clean(x.displayName, 300),
      severity: oneOf(x.severity, SEVERITIES),
      status: oneOf(x.status, INCIDENT_STATUSES),
      created: iso(x.createdDateTime),
      portalHost: hostOf(x.incidentWebUrl),
      // Alerts: keep only the product fields. Titles, descriptions and entity evidence are dropped here.
      alerts: arr(x.alerts).slice(0, 150).filter(isPlainObject).map((a) => ({ serviceSource: token(a.serviceSource), detectionSource: token(a.detectionSource), productName: clean(a.productName, 80) })),
    };
  }
  function summariseIncidents(list) {
    const allAlerts = list.flatMap((i) => i.alerts);
    const created = list.map((i) => i.created).filter(Boolean).sort();
    return {
      incidents: list.length,
      alerts: allAlerts.length,
      alertServiceSources: tally(allAlerts.map((a) => a.serviceSource || 'unknown')),
      portalHosts: tally(list.map((i) => i.portalHost || '(none)')),
      severities: tally(list.map((i) => i.severity || 'unknown')),
      oldestCreated: created[0] || '',
      newestCreated: created[created.length - 1] || '',
      incidentsWithSentinelAlerts: list.filter((i) => i.alerts.some((a) => a.serviceSource === 'microsoftSentinel')).length,
    };
  }
  function interpretIncidents(r) {
    if (!r.ok) return { headline: `incident API request failed (${r.error.split(':')[0]})`, text: `${r.error}\n${failureAdvice(r)}`.trim() };
    const s = r.summary;
    if (s.incidents === 0) return { headline: 'incident API readable, no incidents returned', text: 'Microsoft Graph returned no incidents. The account can read the incident API, but there was nothing to confirm. Repeat after a known detection fires.' };
    const lines = [
      `Microsoft Graph returned the ${s.incidents} most recent incident(s)${r.more ? ' (more exist)' : ''}, created between ${s.oldestCreated || '?'} and ${s.newestCreated || '?'}.`,
      `Alerts by service source: ${tallyText(s.alertServiceSources)}.`,
      `Incident links point to: ${tallyText(s.portalHosts)}.`,
      `Severities: ${tallyText(s.severities)}.`,
    ];
    if (s.incidentsWithSentinelAlerts > 0) {
      lines.push(`Incidents with Microsoft Sentinel alerts (serviceSource microsoftSentinel): ${s.incidentsWithSentinelAlerts} of ${s.incidents}. Sentinel incidents are therefore visible in the Defender XDR incident queue.`);
      return { headline: `Microsoft Sentinel alerts in ${s.incidentsWithSentinelAlerts} of ${s.incidents} recent incidents`, text: lines.join('\n') };
    }
    lines.push(`None of these ${s.incidents} incidents contains a Microsoft Sentinel alert. This alone does not show that Sentinel is disconnected: there may have been no recent Sentinel incidents. Compare with the workspace and the Defender portal.`);
    return { headline: `no Microsoft Sentinel alerts among ${s.incidents} recent incidents`, text: lines.join('\n') };
  }
  function renderIncidents(r) {
    const out = $('out-incidents');
    const i = interpretIncidents(r);
    const nodes = [el('p', { class: r.ok ? '' : 'bad' }, i.text)];
    if (r.ok && r.incidents.length) {
      nodes.push(table(['Created', 'Severity', 'Status', 'Title (from tenant)', 'Alert sources', 'Portal host'], r.incidents.map((x) => [
        x.created, x.severity, x.status, x.title, tallyText(tally(x.alerts.map((a) => a.serviceSource || 'unknown'))), x.portalHost,
      ])));
    }
    out.replaceChildren(...nodes);
  }
  async function runIncidents() {
    $('run-incidents').disabled = true;
    $('out-incidents').replaceChildren(el('p', null, 'Running...'));
    const r = await graphRequest('GET', INCIDENTS_URL, null);
    const incidents = r.ok && isPlainObject(r.json) ? arr(r.json.value).slice(0, 10).filter(isPlainObject).map(pickIncident) : [];
    const more = r.ok && isPlainObject(r.json) && typeof r.json['@odata.nextLink'] === 'string';
    // The raw response (r.json) is dropped here; only the picked fields survive.
    results.incidents = { method: 'GET', url: INCIDENTS_URL, at: r.at, status: r.status, ok: r.ok, error: r.error, incidents, more, summary: summariseIncidents(incidents) };
    renderIncidents(results.incidents);
    $('run-incidents').disabled = false;
    onResultsChanged();
  }

  // ----- check 2: advanced hunting -----------------------------------------------------------------------
  function cell(v) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return clean(v, 200);
    try { return clean(JSON.stringify(v), 200); } catch (e) { return ''; }
  }
  function pickHunting(j) {
    const columns = arr(j.schema).slice(0, 20).filter(isPlainObject).map((c) => ({ name: clean(c.Name || c.name, 60), type: clean(c.Type || c.type, 30) }));
    const rows = arr(j.results || j.Results).slice(0, 50).filter(isPlainObject).map((row) => {
      const byLower = new Map(Object.keys(row).slice(0, 50).map((k) => [k.toLowerCase(), row[k]])); // the docs show both PascalCase and camelCase keys
      return columns.map((c) => cell(byLower.get(c.name.toLowerCase())));
    });
    return { columns, rows };
  }
  function interpretHunting(r) {
    if (!r.ok) return { headline: `hunting query failed (${r.error.split(':')[0]})`, text: `${r.error}\n${failureAdvice(r)}`.trim() };
    const idx = (n) => r.columns.findIndex((c) => c.name.toLowerCase() === n);
    const [t, p, n] = [idx('table'), idx('provider'), idx('items')];
    if (t < 0 || p < 0 || n < 0) return { headline: 'hunting query returned an unexpected shape', text: `Columns returned: ${r.columns.map((c) => c.name).join(', ') || 'none'}.` };
    const rowsOf = (name) => r.rows.filter((row) => row[t] === name).map((row) => `${row[p] || '(no provider)'} ${row[n]}`);
    const si = rowsOf('SecurityIncident');
    const ai = rowsOf('AlertInfo');
    const lines = [
      `Advanced hunting (Microsoft Graph runHuntingQuery, last 7 days, primary workspace) returned ${r.rows.length} row(s).`,
      `SecurityIncident (Microsoft Sentinel table) distinct incidents by provider: ${si.join(', ') || 'none'}.`,
      `AlertInfo (Defender XDR table) distinct alerts by service source: ${ai.join(', ') || 'none'}.`,
    ];
    if (si.length) {
      lines.push('The Microsoft Sentinel SecurityIncident table is queryable from Defender advanced hunting, so the workspace is connected and hunting queries run.');
      return { headline: 'Sentinel SecurityIncident table queryable in advanced hunting', text: lines.join('\n') };
    }
    lines.push('No SecurityIncident rows were returned. Either there were no Sentinel incidents in 7 days, or the workspace is not connected or not the primary workspace. The hunting API also falls back to the primary workspace silently. Check in the Defender portal.');
    return { headline: 'no Sentinel SecurityIncident rows in advanced hunting', text: lines.join('\n') };
  }
  function renderHunting(r) {
    const i = interpretHunting(r);
    const nodes = [el('p', { class: r.ok ? '' : 'bad' }, i.text)];
    if (r.ok && r.columns.length) nodes.push(table(r.columns.map((c) => c.name), r.rows));
    $('out-hunting').replaceChildren(...nodes);
  }
  async function runHunting() {
    $('run-hunting').disabled = true;
    $('out-hunting').replaceChildren(el('p', null, 'Running...'));
    const r = await graphRequest('POST', HUNTING_URL, { Query: HUNTING_QUERY, Timespan: HUNTING_TIMESPAN });
    const picked = r.ok && isPlainObject(r.json) ? pickHunting(r.json) : { columns: [], rows: [] };
    results.hunting = { method: 'POST', url: HUNTING_URL, at: r.at, status: r.status, ok: r.ok, error: r.error, query: HUNTING_QUERY, timespan: HUNTING_TIMESPAN, columns: picked.columns, rows: picked.rows };
    renderHunting(results.hunting);
    $('run-hunting').disabled = false;
    onResultsChanged();
  }

  // ----- evidence note -----------------------------------------------------------------------------------
  // Schema "armohub.dma.connected-evidence" v1 (proposed). The offline app would turn each finding into an evidence
  // note labelled "imported" on the named check; it never changes a status by itself.
  function buildEvidence() {
    const alias = clean($('alias').value.trim(), 60) || 'tenant';
    const operator = clean($('operator').value.trim(), 80);
    const includeTitles = $('include-titles').checked;
    const collectedAt = new Date().toISOString();
    const header = `Collected by ${TOOL.name} ${TOOL.version} for tenant alias "${alias}" at ${collectedAt} with delegated, read-only Microsoft Graph permissions${operator ? `, checked by ${operator}` : ''}. Values are as returned by Microsoft Graph; review them before relying on them.`;
    const requests = [];
    const findings = [];
    const summary = {};
    const inc = results.incidents;
    if (inc) {
      requests.push({ method: inc.method, url: inc.url, at: inc.at, httpStatus: inc.status });
      const i = interpretIncidents(inc);
      let text = `${header}\n\nRequest: ${inc.method} ${inc.url} -> HTTP ${inc.status || 'no response'}\n\n${i.text}`;
      if (includeTitles && inc.ok && inc.incidents.length) text += '\n\nIncidents (titles come from the tenant):\n' + inc.incidents.map((x) => `\u2022 ${x.id} | ${x.created} | ${x.severity} | ${x.title}`).join('\n');
      findings.push({ checkId: 'TRN-13', title: clean(`Connected check: ${i.headline}`, 300), text: clean(text, 19000) });
      summary.incidents = Object.assign({ httpStatus: inc.status }, inc.summary);
      if (includeTitles) summary.incidents.items = inc.incidents.map((x) => ({ id: x.id, created: x.created, severity: x.severity, status: x.status, title: x.title }));
    }
    const hun = results.hunting;
    if (hun) {
      requests.push({ method: hun.method, url: hun.url, at: hun.at, httpStatus: hun.status, query: hun.query, timespan: hun.timespan });
      const i = interpretHunting(hun);
      findings.push({ checkId: 'VAL-12', title: clean(`Connected check: ${i.headline}`, 300), text: clean(`${header}\n\nRequest: ${hun.method} ${hun.url} -> HTTP ${hun.status || 'no response'}\nQuery (Timespan ${hun.timespan}):\n${hun.query}\n\n${i.text}`, 19000) });
      summary.hunting = { httpStatus: hun.status, columns: hun.columns.map((c) => c.name), rows: hun.rows };
    }
    return { schema: 'armohub.dma.connected-evidence', schemaVersion: 1, tool: TOOL, collectedAt, tenant: { alias }, operator, readOnly: true, requests, findings, summary };
  }
  function onResultsChanged() {
    $('s-export').hidden = !(results.incidents || results.hunting);
    previewed = '';
    $('export').disabled = true;
    $('export-preview').hidden = true;
  }
  function preview() {
    previewed = JSON.stringify(buildEvidence(), null, 2);
    $('export-preview').textContent = previewed;
    $('export-preview').hidden = false;
    $('export').disabled = false;
  }
  function exportNote() {
    if (!previewed) return;
    const alias = (clean($('alias').value.trim(), 60).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'tenant').slice(0, 40);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([previewed], { type: 'application/json' }));
    a.download = `armohub-connected-evidence-${alias}-${stamp}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  // ----- wiring --------------------------------------------------------------------------------------------
  function start() {
    $('kql').textContent = HUNTING_QUERY;
    const problem = environmentProblem();
    if (problem) { $('env-error').textContent = problem; $('env-error').hidden = false; }
    // Optional prefill from the launcher (#tenant=...&client=...). The fragment is never sent to any server; it is
    // removed from the address bar immediately.
    if (location.hash.length > 1) {
      const p = new URLSearchParams(location.hash.slice(1));
      if (GUID_RE.test(p.get('tenant') || '')) $('tenant').value = p.get('tenant');
      if (GUID_RE.test(p.get('client') || '')) $('client').value = p.get('client');
      history.replaceState(null, '', location.pathname);
    }
    for (const id of ['tenant', 'client', 'consent']) $(id).addEventListener('input', refreshSignInButton);
    $('consent').addEventListener('change', refreshSignInButton);
    $('signin').addEventListener('click', signIn);
    $('signout').addEventListener('click', forget);
    $('run-incidents').addEventListener('click', runIncidents);
    $('run-hunting').addEventListener('click', runHunting);
    $('preview').addEventListener('click', preview);
    $('export').addEventListener('click', exportNote);
    for (const id of ['include-titles', 'operator', 'alias']) $(id).addEventListener('input', onResultsChanged);
    refreshSignInButton();
  }
  // Exposed for the prototype test only: proves the request allow-list refuses anything else.
  window.__p4 = Object.freeze({ tryRequest: (method, url) => graphRequest(method, url, null).then(() => 'sent', (e) => 'refused: ' + e.message) });
  start();
})();
