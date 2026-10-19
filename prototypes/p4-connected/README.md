# P4: connected mode prototype (release-2 spike). Not shipped.

> **Status with version 1.0.0:** this spike was run against the internal release candidate (0.9.0-rc.1), before the product was renamed ArMo MS Defender Migration Assistant. Version 1.0.0 ships none of it: the offline file keeps `connect-src 'none'` and never contacts a tenant. "Release 2" below means a later release after 1.0.

**Question:** can a minimal, safe local launcher enable optional, read-only tenant checks without weakening the offline single-file app?

**Answer: yes, technically, with conditions.** Everything that can be tested without a tenant works and holds up under attack. The unproven part is the real Microsoft Entra sign-in and the real Graph responses, because no app registration exists yet. The recommendation is a **conditional go** (see [Go / no-go](#go--no-go-for-release-2)).

| | |
|---|---|
| Date | 2026-10-19 |
| Machine | Windows 11 Enterprise 10.0.26200, Windows PowerShell 5.1.26100, standard user, execution policy RemoteSigned |
| Browsers | Microsoft Edge 155 and Google Chrome 155, headless, driven by playwright-core 1.64 |
| Library | `@azure/msal-browser` **5.25.1** (MIT). Downloaded from the npm registry; the tarball sha512 matched the registry `dist.integrity`. |
| Tenant | **None.** Entra and Graph were **mocked** for the sign-in flow. The live probes were unauthenticated. |
| Scope rule | Only this folder was added. `src/`, `content/`, the build and `dist/` are unchanged. No secrets, tenant IDs or tokens are in the repository. All IDs in the tests are clearly fake (`0000aaaa-1111-...`). |

## What was built

| File | What it is |
|---|---|
| [`Start-ArMoConnected.ps1`](Start-ArMoConnected.ps1) | Loopback launcher for Windows PowerShell 5.1. It needs no install, no admin rights and no modules. It is ASCII-only with CRLF line endings. |
| [`web/connected.html`](web/connected.html), [`web/connected.js`](web/connected.js), [`web/connected.css`](web/connected.css) | The separate connected-mode page: consent screen, sign-in, two checks and evidence export. It is a classic script with no build step. |
| [`web/redirect.html`](web/redirect.html), [`web/redirect.js`](web/redirect.js) | The MSAL v5 redirect bridge page. It is the registered redirect URI. |
| [`web/vendor/`](web/vendor/) | `msal-browser.min.js` (290,775 bytes) and `msal-redirect-bridge.min.js` (6,656 bytes), unmodified, plus the MIT licence. Their SHA-256 hashes are pinned in the launcher. |
| [`evidence-format.mjs`](evidence-format.mjs) | Proposed parser for the exported evidence note (schema `armohub.dma.connected-evidence` v1), written in the style of `src/core/inventory.js`. |
| [`tests/`](tests/) | Three re-runnable test suites: launcher, browser and import. |
| `p4-*-results.json` | Observed results. Local paths and the user name are redacted. |
| [`p4-sample-evidence-note.json`](p4-sample-evidence-note.json) | An evidence note exported in the browser test from the **mocked** tenant. All values are fake, and some are deliberately hostile. |

### How it fits together

```
offline app (file://, unchanged, CSP connect-src 'none')        <- imports the evidence note (proposed new import action)
                                                                     ^
Start-ArMoConnected.ps1 --serves--> http://localhost:<random>/      | user previews, then exports the note
   127.0.0.1 + ::1 only               connected.html + MSAL --------+
   GET/HEAD, 7 fixed files            |  popup: login.microsoftonline.com (auth code + PKCE)
   never sees tokens                  |  -> /redirect.html -> BroadcastChannel -> tokens in memory
                                      +--> graph.microsoft.com: GET incidents, POST runHuntingQuery (nothing else)
```

The offline app and the connected page never share an origin. They have no channel between them except a file the user saves and then imports. The offline file keeps `connect-src 'none'`, so connected mode does not weaken it.

### The launcher

- **Binding.** It binds `127.0.0.1` **and** `::1` on one random port between 49152 and 65535, with `ExclusiveAddressUse`. It then **connects to itself on both addresses** to prove it really receives loopback traffic. If any step fails, it picks another port. With `-Port` it refuses instead.
- **Routes.** It has a fixed, case-sensitive table of 7 routes and never maps a path to the file system. It accepts `GET` and `HEAD` only.
- **Host header.** Exactly one `Host` header is allowed: `localhost:<port>`, `127.0.0.1:<port>` or `[::1]:<port>`. Anything else gets 421.
- **Fetch metadata.** A request must carry `Sec-Fetch-Site: same-origin` or `none`. The only exception is a top-level document navigation to `/redirect.html`, which is how the browser comes back from Entra.
- **Response headers.** It sends no CORS headers. Every response gets `Cache-Control: no-store`, `nosniff`, `Referrer-Policy: no-referrer` and `Cross-Origin-Resource-Policy: same-origin`. Documents also get a strict CSP with `frame-ancestors 'none'`, `COOP: same-origin`, `X-Frame-Options: DENY` and a Permissions-Policy.
- **Request limits.** The request head is capped at 16 KB and must be printable ASCII. The server rejects `Transfer-Encoding`, obs-fold and absolute-form targets. Each read times out after 5 s, and a whole request after 10 s.
- **Integrity.** It refuses to start if either vendored MSAL file does not match its pinned SHA-256.
- **Language mode.** It refuses to run outside FullLanguage mode, with a clear message (exit code 3).
- **Logging.** It logs the method, path and decision only. It never logs query strings or header values; any rejected value is reduced to `[A-Za-z0-9/._-]`.
- **Shutdown.** It stops after `-IdleMinutes` (default 20) without a request, or on Ctrl+C.
- **Why `TcpListener` and not `HttpListener`.** `HttpListener` goes through http.sys. That is a shared kernel listener which routes by Host header and may need URL ACLs. A `TcpListener` bound to the loopback addresses is a bind we can prove (test L1), and it needs no admin rights.

### The connected page

- **Configuration.** The user types the tenant ID and client ID, or the launcher pre-fills them through the URL fragment, which is removed from the address bar at once. There is **no built-in client ID**. A user-chosen tenant alias is used in exports instead of the tenant ID.
- **Consent screen.** Before sign-in, the page lists:
  - each permission and what it is used for;
  - the two exact requests, including the full KQL text, rendered from the same constant that is sent;
  - the data that is read, kept and exported, and what is never done.
  The sign-in button stays disabled until the user ticks "I have read this".
- **MSAL.** `createStandardPublicClientApplication` is configured as follows:
  - `authority` is `https://login.microsoftonline.com/<tenant>`, which makes it single-tenant;
  - `redirectUri` is `http://localhost:<port>/redirect.html`;
  - `cacheLocation` is `memoryStorage`;
  - the broker is off, and PII logging is off.
  Sign-in uses `loginPopup` with `prompt: select_account`. "Forget tokens" calls `clearCache()` and then reloads the page.
- **Delegated scopes.** `SecurityIncident.Read.All`, `SecurityAlert.Read.All` and `ThreatHunting.Read.All`. MSAL adds `openid`, `profile` and `offline_access` itself.
- **Read-only, enforced three ways:**
  1. Only read scopes are requested.
  2. `graphRequest()` refuses every (method, URL) pair except the two documented ones.
  3. The CSP allows connections to `login.microsoftonline.com` and `graph.microsoft.com` only.
- **Check 1** sends `GET /v1.0/security/incidents?$top=10&$expand=alerts`.
  - It keeps only these fields: title, severity, status, creation time, the host of the portal link, and the `serviceSource`, `detectionSource` and `productName` of each alert.
  - Alert titles, descriptions, entity evidence (devices, IP addresses, accounts) and comments are dropped as soon as the response is parsed.
  - It maps to **TRN-13** "Verify incidents flow into the Defender portal".
- **Check 2** sends `POST /v1.0/security/runHuntingQuery` with `Timespan: P7D` and a fixed query. The query returns only counts per table and provider: distinct `SecurityIncident` numbers by `ProviderName`, and distinct `AlertInfo` alerts by `ServiceSource`. It maps to **VAL-12** "Hunting queries and bookmarks work".
- **Hostile input.** Tenant data is handled as hostile:
  - it is copied field by field into new objects;
  - strings are capped;
  - control, zero-width and bidi characters are replaced by U+FFFD;
  - unknown enumeration values become `other`;
  - URLs are reduced to their host, and only for https;
  - only text nodes are rendered. There is no `innerHTML`, and Trusted Types (`require-trusted-types-for 'script'; trusted-types 'none'`) would block it anyway.
- **Evidence export.**
  - Export is enabled only after a preview of the exact JSON. Changing any option forces a new preview.
  - Incident titles are excluded unless the user ticks the option.
  - Tenant ID, client ID, object IDs, account names and tokens are never exported.

## Observed results

Re-run the suites with the commands below. They need Windows, Edge and Chrome installed, and `npm install` at the repository root.

```bash
node prototypes/p4-connected/tests/run-p4-launcher.mjs
```

```bash
node prototypes/p4-connected/tests/run-p4-browser.mjs
```

```bash
node prototypes/p4-connected/tests/run-p4-import.mjs
```

**Latest run: launcher 24/24, browser 57/57 (Edge and Chrome), import 5/5.** Details are in `p4-launcher-results.json`, `p4-browser-results.json` and `p4-import-results.json`. The first runs found three real defects, which were then fixed:
1. A 20 KB header that arrived in a single read slipped past the 16 KB cap.
2. Wildcard binds by other processes are possible on Windows. This led to the loopback self-test.
3. The export file name had a trailing dash.

### Launcher (`run-p4-launcher.mjs`, raw sockets plus PowerShell)

| ID | Check | Observed |
|---|---|---|
| L1 | Listening sockets | Only `127.0.0.1` and `::1` (`Get-NetTCPConnection`). Connecting to the machine's LAN IPv4 address on the port gives ECONNREFUSED. |
| L2 | Host header (DNS rebinding) | 200 for `localhost`, `LOCALHOST`, `127.0.0.1` and `[::1]` with our port. 421 for a missing port, a wrong port, `evil.example`, `localhost.evil.example`, `127.0.0.2`, `0.0.0.0`, `localhost:<port>.evil.example` and a leading-zero port. 400 for a missing or repeated `Host`. |
| L3 | Methods and CORS | POST, PUT, DELETE, PATCH, OPTIONS (preflight), TRACE and CONNECT all get 405. No response ever contains `Access-Control-Allow-Origin`, even when the request has a foreign `Origin` header. |
| L4 | Paths | 17 traversal, encoding, case, backslash, NUL and unknown-file variants all get 404. The 7 routes are served, with any query string ignored. An absolute-form target gets 400. |
| L5 | Fetch metadata | `none` and `same-origin`: 200. `cross-site` or `same-site` navigation to `/`: 403. A frame: 403. A cross-site or same-site script: 403. `fetch()` from a website: 403. A cross-site top-level navigation to `/redirect.html`: 200, but 403 in a frame or as a script. |
| L6 | Malformed requests | 20 KB of headers: 431. Non-ASCII byte, lowercase method, HTTP/2 preface, `Transfer-Encoding`, obs-fold and space before a colon: 400. A head with bare LF line endings is dropped after 5 s. |
| L7 | Slow client | The server is single-threaded. One silent connection delayed the next request by **4.7 s**, until its read timeout. This is a local denial of service only. |
| L8 | Binding while running | Other sockets cannot bind `127.0.0.1` or `::1` on the port (EADDRINUSE, or AccessDenied with SO_REUSEADDR). **Wildcard binds (`0.0.0.0`, `::`) by another process do succeed on Windows**, but they did **not** receive loopback connections: the specific bind wins. |
| L9 | Pre-squatted port | With a squatter on `::1` or `127.0.0.1`, the launcher refuses (exit 5). With a squatter on `0.0.0.0` or `::`, the launcher starts, and the self-test confirms that loopback traffic reaches the launcher. In normal mode it picks another port. |
| L10 | Why bind both address families | Demonstration: with only `127.0.0.1` bound and a squatter on `[::1]`, **both Edge and Chrome sent `http://localhost:<port>/` to the squatter**. Without the squatter they fell back to `127.0.0.1`. A launcher that binds only IPv4 can therefore be impersonated. |
| L11 | Log hygiene | `?code=SECRET...` and an ESC sequence in `Host` never appear in the log. |
| L12 | Idle shutdown | With `-IdleSeconds 4`, the launcher exited with code 0 after about 4 s, and the port was closed. |
| L13 | Integrity pin | With a tampered copy of `msal-browser.min.js`, the launcher refused to start (exit 4). |
| L14 | Constrained Language Mode | In a ConstrainedLanguage session, the launcher prints a clear message and exits 3. The `__PSLockdownPolicy=4` test hook is **ignored** by this PowerShell build, so real WDAC/AppLocker enforcement was **not** simulated. |
| L15 | Execution policy | A copy with Mark-of-the-Web (`ZoneId=3`) under RemoteSigned gives "cannot be loaded ... not digitally signed". A real release must be Authenticode-signed, or users must be told to run `Unblock-File`. |
| - | Latency | Loopback responses take 7-130 ms, including the 290 KB MSAL bundle. |

### Sign-in and checks (`run-p4-browser.mjs`, part A; mocked Entra and Graph; each check runs in Edge and Chrome)

| ID | Check | Observed (identical in both browsers) |
|---|---|---|
| A1-A2 | Load and pre-fill | Secure context. CSP, COOP `same-origin` and `frame-ancestors 'none'` are present. The fragment pre-fill is applied and removed. Sign-in stays disabled until consent is ticked. |
| A3 | Popup flow | The full flow completes: popup, mocked `/authorize`, 302 to the launcher's `/redirect.html` (cross-site navigation allowed), BroadcastChannel to the main page, popup closes by itself. **COOP `same-origin` does not break the MSAL v5 bridge flow.** |
| A4 | Authorization request | `response_type=code`, `code_challenge_method=S256`, **`response_mode=fragment`**, `redirect_uri=http://localhost:<port>/redirect.html`, `prompt=select_account`, and exactly 6 scopes (3 Graph scopes plus `openid profile offline_access`). There is no secret. |
| A5 | Token redemption | The PKCE verifier hashes (S256) to the challenge. The request carries `Origin: http://localhost:<port>` and no secret. |
| - | Metadata requests | MSAL made **no** OpenID metadata or instance-discovery requests for `login.microsoftonline.com`; it has the metadata built in. The only Entra calls were `/authorize` (popup navigation) and `/token`. |
| A6 | Storage after sign-in | localStorage: 0 keys. sessionStorage: 0 keys. No token, refresh token, ID token or code anywhere in web storage. No cookies, IndexedDB or Cache Storage. **While the popup was open, sessionStorage held only `msal.interaction.status`, and the PKCE verifier was not in it.** |
| A7-A11 | Hostile tenant data | The test data contained an `<img onerror>` account name and incident title, `<script>` in a description, `<svg onload>` as a severity, `javascript:` as the incident URL, RLO bidi characters, a CSV formula, 5,000-character strings, a `__proto__` key and non-object array items. Result:<br>- everything rendered as inert text;<br>- 0 elements were created and no script ran;<br>- there was no prototype pollution;<br>- bidi characters became U+FFFD and long strings were capped;<br>- unknown values became `other` and the bad URL became `(not https)`;<br>- `SECRET-*` alert titles, entities and comments never reached the DOM. |
| A12 | Sentinel provenance | "Incidents with Microsoft Sentinel alerts (serviceSource microsoftSentinel): 1 of 2". The portal link host is `security.microsoft.com`. |
| A13-A14 | Hunting check | Exactly one POST is sent, whose `Query` equals the text on the consent screen, with `Timespan: P7D` and no other fields. Result keys in both PascalCase and camelCase map to columns (Microsoft's docs show both forms). |
| A15-A16 | Enforcement | `DELETE` or `PATCH` on incidents, `GET /me` and incidents with another query are **refused in code, and never reach the network**. `fetch` to example.com or management.azure.com is blocked by CSP. `innerHTML` and injected `<script>` are blocked by Trusted Types. |
| A17-A19 | Export | Export works only after a preview, and the downloaded file is identical to the preview. The note contains TRN-13 and VAL-12 findings and **none** of: access or refresh token, code, tenant ID, client ID, object ID, UPN, display name, `tid=`, entity data or incident titles. Titles appear only when ticked, and stay sanitised. |
| A20 | Network | The browser contacted only `localhost:<port>`, `login.microsoftonline.com` and `graph.microsoft.com`. |
| A21 | Forget tokens | MSAL is cleared and the page reloads. Every browser storage area is empty afterwards. |
| A22-A23 | Errors and log | No unexpected console errors. The launcher log never contains the authorization code, which travels in the URL fragment. |

### Attacks and live probes (`run-p4-browser.mjs`, part B; each check runs in Edge and Chrome)

| ID | Scenario | Observed |
|---|---|---|
| B1 | A page on another localhost port | It cannot do any of the following:<br>- read our files (CORS) or fetch them with `no-cors` (the launcher answers 403 because of `same-site`, plus CORP);<br>- load our script (403);<br>- frame us (403 and `frame-ancestors`);<br>- read a window it opened (cross-origin);<br>- see our localStorage (it is port-isolated). |
| B2 | Cookies across ports | **Cookies are shared across localhost ports**: a cookie set on the other port was visible on ours. The page and MSAL (with `memoryStorage`) use no cookies, so this does no harm. It is a rule for release 2: never use cookies. |
| B3 | A local `file://` HTML file | Same result as B1. The launcher logged `cross-site` and answered 403. |
| B4 | DNS rebinding | Simulated with `--host-resolver-rules=MAP rebind.p4.test 127.0.0.1`. The result is **421**, and the app is never served. |
| B5 | Public website (`https://example.com`) | Requests to `http://localhost:<port>` failed in the browser and **never reached the launcher**. That is consistent with Local Network Access blocking them in headless Edge and Chrome 155. Even if they did reach it, the response would be 403 with no CORS headers. Headed prompt behaviour was not tested. |
| B6 | Live, unauthenticated CORS from `http://localhost:<port>` under the page CSP | `GET` incidents: readable 401 `InvalidAuthenticationToken`, and `request-id` is readable. `POST runHuntingQuery`: readable 401. Entra metadata: readable 200. Entra `/token`: readable 400 `invalid_grant`. |

### Import into the offline app (`run-p4-import.mjs`, using the real `src/core` model and validator, read-only)

| ID | Check | Observed |
|---|---|---|
| I1 | Target checks | TRN-13 and VAL-12 exist in the release-1 knowledge base. |
| I2 | Parsing the sample note | The exported note parses into 2 findings and 2 allowed requests, with no warnings. |
| I3 | Applying it | `addEvidence(..., { kind: 'note', origin: 'import' })` creates 2 imported notes, exactly as the inventory import does. Check statuses stay `not_started`. |
| I4 | Round trip | `validateProject()` keeps both notes with their text and `origin: 'import'` intact. There are no warnings. |
| I5 | Hostile notes | Refused: not JSON, wrong schema, schema version 2, `readOnly` missing, over 1 MB. Dropped with a warning:<br>- a `__proto__` check ID;<br>- a finding claiming `TRN-01` "Gate passed";<br>- duplicates and non-object findings;<br>- findings beyond the 20 cap.<br>Titles are capped at 300 characters. An unexpected `PATCH` in `requests` raises a warning. |

## Security surface of the launcher

1. **Other local pages** (other localhost ports, local `file://` HTML, compromised local dev servers). Our origin is `http://localhost:<port>`, so web storage, BroadcastChannel and DOM access are isolated from other ports (B1, B3). These pages cannot load our files because of Sec-Fetch-Site, CORP and the absence of CORS headers (L5, B1, B3). **Cookies are not port-isolated** (B2), so the design must never use cookies. A local page *can* navigate the user to Entra with our client ID; see residual risk 1.
2. **DNS rebinding.** The exact Host allow-list returns 421 to any other name (L2, B4). In any case, a rebinding origin is never the same origin as `http://localhost:<port>`, so it could not reach tokens held in memory.
3. **Port squatting.**
   - Both loopback address families are bound exclusively (L8a). This matters: browsers prefer `[::1]` for `localhost`, and an IPv4-only server was impersonated in both browsers (L10).
   - A start-up self-test proves the launcher owns loopback traffic even when another process holds the wildcard address (L8b, L9).
   - The launcher opens the browser on the port it actually bound.
   - A squatter cannot take the port while the launcher runs. Before start, a random high port makes collisions unlikely, and a fixed `-Port` that is taken is refused.
4. **Public websites.** In headless Edge and Chrome 155, Local Network Access blocked the request before it reached us (B5). The design does not rely on this: such requests would get 403 with no CORS headers.
5. **Local users and processes.** Anyone on the machine can connect to the port and download the same public static files. The launcher holds no secrets: it never sees tokens or codes (A23), it has no write or exec endpoints (L3), and it never maps paths to the file system (L4). **Malware already running as the user is out of scope**: it could read browser memory or the user's other sessions anyway.
6. **Denial of service.** The server is single-threaded, so one slow local client stalls it for up to 5-10 s per connection (L7). This affects the local machine only. A release version could use asynchronous accepts.
7. **Execution controls.**
   - An unsigned, downloaded script is refused under RemoteSigned (L15).
   - Constrained Language Mode stops the launcher (L14).
   - AppLocker/WDAC, EDR (Defender for Endpoint) alerting on a PowerShell listener, and a Windows Firewall prompt were **not observable here**. No prompt appeared, because the bind is loopback-only and the session was headless, but this is not proven.
8. **Supply chain.** MSAL is vendored, not loaded from a CDN. Its npm sha512 was verified at download, and its SHA-256 is pinned in the launcher (L13). The bundle is about 291 KB and is executed by the page. Updating it means a manual review and new pins.

### Residual risks a release must accept or mitigate

1. **A localhost redirect URI is a standing phishing surface.** Entra ignores the port when matching localhost redirect URIs, which is exactly what makes a random port possible. The flip side: any process that can listen on the victim's loopback interface can receive an authorization code for this admin-consented app if it gets the user's browser to the authorize URL, possibly silently through SSO. It then redeems the code with its own PKCE verifier.
   - On a single-user laptop this needs local code execution, which is game over anyway.
   - On **shared multi-user hosts (RDS/Citrix jump boxes)**, `127.0.0.1` is shared between users, so another user could phish a colleague.
   - The risk exists whenever the redirect URI is registered, whether the launcher runs or not.
   - Mitigations:
     - "Assignment required" plus Conditional Access (compliant device, phishing-resistant MFA) on the app;
     - disable sign-in for the enterprise app between assessments;
     - **do not use connected mode on shared hosts**.
2. **Microsoft frames `http://localhost` redirect URIs as a development-time exception** (research S1). Customer security reviews may object, even though RFC 8252 makes loopback the standard pattern for native apps.
3. **There is no backend-for-frontend.** Tokens with tenant-wide security read scopes live in page memory. An XSS would expose them. The mitigations are those tested in A7-A16 (text-only rendering, Trusted Types, strict CSP), but there is no stronger isolation.
4. **No "popup closed" detection in the v5 bridge flow** (from reading the MSAL code: `waitForBridgeResponse` only has a timeout). If the user closes the popup, the page waits until `popupBridgeTimeout` (set to 180 s so that MFA has time).

## What could not be tested (no tenant, no app registration)

- **Real Entra sign-in.** Not tested:
  - whether an SPA redirect registered as `http://localhost/redirect.html` matches `http://localhost:<random>/redirect.html` (research item P1);
  - the admin-consent and user-assignment errors;
  - MFA inside the popup;
  - Conditional Access (P4);
  - how sign-in logs show the app;
  - real token responses and the 24 h SPA refresh-token cap.
- **Real Graph behaviour:**
  - authenticated 200, 403 and 429 responses, and whether `Retry-After` is readable on a real 429 (P6);
  - whether `$expand=alerts` needs `SecurityAlert.Read.All` or works with `SecurityIncident.Read.All` alone (drop the alert scope if so);
  - whether nested `$expand=alerts($select=serviceSource,detectionSource,productName)` is supported, which would avoid receiving entity evidence at all;
  - whether Sentinel alerts really carry `serviceSource: microsoftSentinel` in unified tenants.
- **Advanced hunting:**
  - whether the KQL is valid there, including `union isfuzzy=true` and `SecurityIncident` availability;
  - the roles needed for delegated `runHuntingQuery` (P7);
  - which workspace answers: the API silently falls back to the primary workspace when `workspaceId` is missing or inaccessible.
- **Locked-down Windows:** real WDAC/AppLocker policies, Authenticode signing, and Defender for Endpoint or other EDR reactions (P8).
- **Headed browsers:** popup blockers, Local Network Access prompts (P9) and enterprise browser policies.
- **Other browsers and shells:** Firefox (not installed) and PowerShell 7 (not installed). The launcher should work on PowerShell 7, but that is untested.
- **Not in scope for this spike:** ARM and Log Analytics resources (P3, P5). Only Graph was used.

## Go / no-go for release 2

**Conditional go.** The architecture is sound and keeps the offline single-file app exactly as strong as it is today: same file, same CSP, no new channel. The launcher's attack surface is small, testable and was tested. MSAL v5 with `memoryStorage`, a popup, COOP and Trusted Types works from the loopback origin without writing secrets to any storage.

Proceed to release 2 only after **all** of the following:
1. **A real-tenant validation run passes.** Use a customer-style single-tenant SPA registration in a test tenant with Defender XDR and Sentinel onboarded. Close every item under "could not be tested", especially port-agnostic matching, the scopes `$expand` needs, the KQL, and 403/429 handling. If port-agnostic matching fails for SPA redirect URIs, the random-port design fails and this becomes a **no-go** for the loopback approach. The fallback would be a customer-hosted HTTPS page (research option D).
2. **The launcher is Authenticode-signed**, with documented AppLocker/WDAC allow-listing. It must be checked once on a WDAC-enforced machine and one with EDR.
3. **Owner and security sign-off on the residual risks above**, in particular the shared-host restriction and the operational controls on the app registration. Customers must be told plainly that connected mode is optional and that the offline workflow is complete without it.

If any condition fails, keep release 2 on the import-based route: the inventory script plus imported evidence. The import format and parser from this spike can be reused, for example by a PowerShell script that writes the same `armohub.dma.connected-evidence` note.

## Design changes the main app would need

1. **Packaging.**
   - Ship connected mode as a **separate, optional companion folder** containing the signed launcher, the connected page and vendored MSAL. Do not put it inside `ArMo-MS-Defender-Migration-Assistant.html`.
   - The offline file keeps `connect-src 'none'`. Never let the offline page talk to the launcher.
2. **New import action in the offline app.**
   - Add `src/core/connected-evidence.js`, based on [`evidence-format.mjs`](evidence-format.mjs), with unit tests.
   - Add an "Import connected-mode evidence note" action next to the inventory import, using the same preview-and-tick dialog.
   - The dialog shows the requests, `collectedAt`, the alias and any warnings, and attaches the original JSON as a file evidence item.
   - It never changes a status, and findings are labelled "imported".
3. **A stable check-ID contract.** TRN-13 and VAL-12 become part of the note schema, through the allow-list in the parser. Renaming or splitting these knowledge-base items needs a schema version bump. Consider TRN-11 "Confirm the connection" as a third target.
4. **A second build target** for the connected page:
   - one CSP string feeding both the meta tag and the launcher header (it is duplicated in this prototype);
   - generated SHA-256 pins for every served file, not only MSAL;
   - the ASCII and CRLF check for the `.ps1`;
   - a version stamp shared with the offline app.
5. **Dependency process for MSAL**, which releases often:
   - pin the version and record its integrity hash;
   - review the diff before updating;
   - add MSAL to `docs/dependency-and-licence-review.md`, with the MIT notice shipped beside the bundle.
6. **Customer app-registration guide** (docs, plus optionally a separate admin script):
   - single-tenant;
   - platform "Single-page application", redirect `http://localhost/redirect.html`;
   - the three delegated scopes with admin consent;
   - no secrets, and "Allow public client flows" off;
   - assignment required;
   - Conditional Access;
   - sign-in disabled between assessments;
   - not for shared hosts.
7. **Hardening carried over from this spike:**
   - only text-node rendering, plus Trusted Types;
   - a request allow-list in code, plus the CSP `connect-src`;
   - `memoryStorage` and no cookies, ever;
   - export only after a preview, with titles opt-in and identifiers never exported;
   - a dual-stack exclusive bind, the loopback self-test, the Host allow-list and the Sec-Fetch-Site policy;
   - an idle shutdown.
8. **Resilience.**
   - Use asynchronous accepts in the launcher (L7).
   - Add a "Cancel sign-in" control, because the v5 bridge has no popup-closed signal.
   - Honour `Retry-After` on 429.
   - Make the hunting check pass `workspaceId` and say which workspace was meant, because the API falls back to the primary workspace silently.
9. **Docs and tests.**
   - Write an ADR-002 for release 2.
   - Add a connected-mode section and threat-model rows to `docs/security-and-privacy.md`.
   - Move these three suites into `tests/` (Windows CI with Edge and Chrome).
   - Add the real-tenant run to `docs/release-checklist.md` as a manual gate.

## Mapping to research note 04, "Things we must verify by prototype"

| Item | Status after P4 |
|---|---|
| P1 MSAL v5 popup/silent with the bridge on a random localhost port, `memoryStorage` | **Mechanics proven** against mocked Entra: popup, bridge, PKCE, `memoryStorage`, no cookie or storage errors, COOP. **Not proven:** real registration and port-agnostic matching. |
| P2 `127.0.0.1` variant | Not tested. The design picks `localhost` with a dual-stack bind (L10 shows why both families matter). |
| P3 Tokens across three resources | Reduced to Graph only for this spike. Consent prompts and the refresh cap are untested. |
| P4 Conditional Access | Not tested. |
| P5 ARM and Log Analytics consent type | Not applicable (not used). |
| P6 CORS on authenticated responses | Unauthenticated 401s and `request-id` are readable from the launcher origin (B6). 200, 403 and 429 are untested. |
| P7 Roles for `runHuntingQuery` | Not tested. |
| P8 Launcher on locked-down Windows | Standard user, no URL ACL (TcpListener), loopback-only, Host validation, idle shutdown, CLM-session refusal and MOTW under RemoteSigned are tested. WDAC/AppLocker, signing, EDR and the firewall prompt are not. |
| P9 Local Network Access | Headless Edge and Chrome 155 blocked a public site from reaching the loopback port (B5). Headed prompts are untested. |
| P10-P16 | Offline-app items, out of scope here. |
