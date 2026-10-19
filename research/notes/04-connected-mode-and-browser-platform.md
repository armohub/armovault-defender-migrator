# 04 - Optional "connected mode" and browser platform constraints (file://, MSAL.js, CORS, storage, libraries)

Research date: 2026-10-19. Scope: whether an optional, read-only "connected mode" (browser calls to the customer's tenant) is feasible and safe for release 1 of an offline-first static web app opened from disk (`file://`) in Edge/Chrome on Windows, plus the browser-platform facts the offline app itself depends on, and licences of libraries we might bundle.

Method:
- Documentation: pages fetched live on 2026-10-19 from learn.microsoft.com, the MSAL.js GitHub docs, MDN (incl. the browser-compat-data repo), developer.chrome.com, IETF datatracker, Mozilla and Chromium trackers, and the npm registry. Dates are the page's `ms.date` with `updated_at` in brackets for Learn, or "last modified" for MDN/Chrome. Quotes are verbatim and 25 words or fewer.
- Empirical tests (E1-E5 below) were run on this Windows 11 machine on 2026-10-19 to fill gaps where no official statement exists. They are labelled "observed" and are not documentation: vendors can change server headers or browser behaviour without notice.

Confidence scale:
- **High**: stated explicitly in a current official source, or observed directly and consistent with official sources.
- **Medium**: official source is old, indirect, ambiguous, or only empirical evidence exists.
- **Low**: inferred, or the only source is third-party.

---

## 0. Source register

| ID | Title | URL | Date |
|---|---|---|---|
| S1 | Redirect URI (reply URL) best practices and limitations | https://learn.microsoft.com/en-us/entra/identity-platform/reply-url | 2025-05-14 [2026-06-15] |
| S2 | How to add a redirect URI to your application | https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri | 2026-05-14 [2026-06-15] |
| S3 | Microsoft identity platform and OAuth 2.0 authorization code flow | https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow | 2026-01-09 [2026-06-15] |
| S4 | Issues on Internet Explorer & Microsoft Edge (MSAL.js) | https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-known-issues-ie-edge-browsers | 2020-05-18 [2026-06-15] |
| S5 | OAuth 2.0 device authorization grant | https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code | 2025-01-04 [2026-06-15] |
| S6 | Authentication flows as a condition in Conditional Access policy | https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-authentication-flows | 2026-03-24 [2026-03-25] |
| S7 | Overview of the Microsoft Authentication Libraries for JavaScript | https://learn.microsoft.com/en-us/entra/msal/javascript/ | 2026-03-15 [2026-03-15] |
| S8 | Migrate from MSAL Browser v4 to v5 | https://learn.microsoft.com/en-us/entra/msal/javascript/browser/v4-migration | 2026-03-15 [2026-03-15] |
| S9 | msal-browser docs: configuration.md | https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md | no date (dev branch, fetched 2026-10-19) |
| S10 | msal-browser docs: caching.md | https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/caching.md | no date (refers to v4 behaviour) |
| S11 | msal-browser docs: v4-migration.md (GitHub copy of S8) | https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md | no date |
| S12 | msal-browser docs: cdn-usage.md | https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/cdn-usage.md | no date |
| S13 | Acquire device bound tokens using WAM on Windows (MSAL.js) | https://learn.microsoft.com/en-us/entra/msal/javascript/browser/device-bound-tokens | 2026-03-15 [2026-03-15] |
| S14 | msal-browser FAQ | https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md | no date (content refers to MSAL 1.x/2.x; treat as dated) |
| S15 | npm registry: @azure/msal-browser | https://registry.npmjs.org/@azure/msal-browser | v5.25.1 published 2026-10-13 |
| S16 | security: runHuntingQuery (Graph v1.0) | https://learn.microsoft.com/en-us/graph/api/security-security-runhuntingquery | 2026-07-02 [2026-08-18] |
| S17 | List incidents (Graph v1.0) | https://learn.microsoft.com/en-us/graph/api/security-list-incidents?view=graph-rest-1.0 | 2026-03-03 [2026-03-19] |
| S18 | List alerts_v2 (Graph v1.0) | https://learn.microsoft.com/en-us/graph/api/security-list-alerts_v2?view=graph-rest-1.0 | 2024-09-23 [2026-05-19] |
| S19 | Microsoft Graph permissions reference | https://learn.microsoft.com/en-us/graph/permissions-reference | 2026-09-14 [2026-09-15] |
| S20 | CORS support - OneDrive API | https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/working-with-cors?view=odsp-graph-online | 2017-09-10 [2026-05-14] |
| S21 | API access and authentication - Azure Monitor (Log Analytics API) | https://learn.microsoft.com/en-us/azure/azure-monitor/logs/api/access-api | 2025-08-29 [2026-10-13] |
| S22 | What is Azure Resource Manager? | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview | 2026-08-04 [2026-08-06] |
| S23 | Historic ARM overview (third-party fork of the retired azure-content repo) | https://github.com/Huachao/azure-content/blob/master/articles/resource-group-overview.md | undated, historic |
| S24 | Overview of Microsoft Defender XDR APIs | https://learn.microsoft.com/en-us/defender-xdr/api-overview | 2025-04-18 [2026-06-24] |
| S25 | Roles and permissions in the Microsoft Sentinel platform | https://learn.microsoft.com/en-us/azure/sentinel/roles | 2026-01-07 [2026-09-10] |
| S26 | Azure built-in roles for Security | https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/security | 2026-07-01 [2026-07-01] |
| S27 | Configure how users consent to applications | https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent | 2025-06-15 [2026-08-04] |
| S28 | Publisher verification overview | https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview | 2024-08-13 [2026-06-15] |
| S29 | Single and multitenant apps in Microsoft Entra ID | https://learn.microsoft.com/en-us/entra/identity-platform/single-and-multi-tenant-apps | 2025-03-13 [2026-06-15] |
| S30 | Plan for mandatory Microsoft Entra MFA | https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mandatory-multifactor-authentication | 2026-04-03 [2026-10-06] |
| S31 | Use Microsoft Graph PowerShell authentication commands | https://learn.microsoft.com/en-us/powershell/microsoftgraph/authentication-commands | 2025-07-10 [2026-05-06] |
| S32 | Invoke-AzRestMethod (Az.Accounts) | https://learn.microsoft.com/en-us/powershell/module/az.accounts/invoke-azrestmethod | 2026-10-01 [2026-10-06] |
| S33 | RFC 8252 OAuth 2.0 for Native Apps | https://datatracker.ietf.org/doc/html/rfc8252 | October 2017 |
| S34 | RFC 10017 OAuth 2.0 for Browser-Based Applications (BCP 212) | https://datatracker.ietf.org/doc/rfc10017/ (draft history: https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/) | August 2026 |
| S35 | MDN: Secure contexts | https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts | last modified 2026-09-14 |
| S36 | MDN: Window.localStorage | https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage | last modified 2026-10-12 |
| S37 | MDN: Same-origin policy | https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy | last modified 2026-09-17 |
| S38 | MDN: JavaScript modules guide | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules | last modified 2026-08-21 |
| S39 | MDN: BroadcastChannel | https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel | last modified 2024-06-03 |
| S40 | MDN: Window.showOpenFilePicker() | https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker | last modified 2026-09-11 |
| S41 | MDN browser-compat-data (Window.json, CompressionStream.json) | https://github.com/mdn/browser-compat-data (raw `api/Window.json`, `api/CompressionStream.json`, main branch) | fetched 2026-10-19 |
| S42 | Persistent permissions for the File System Access API (Chrome blog) | https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api | last updated 2024-01-09 |
| S43 | New permission prompt for Local Network Access (Chrome blog) | https://developer.chrome.com/blog/local-network-access | published 2025-06-09, update note 2025-09-29 |
| S44 | Chromium code review 1140203002 "make file: an effectively unique origin" | https://codereview.chromium.org/1140203002/ | May 2015 (committed 2015-05-18) |
| S45 | Mozilla Foundation Security Advisory 2019-21 (CVE-2019-11730) | https://www.mozilla.org/en-US/security/advisories/mfsa2019-21/ | 2019-07-09 |
| S46 | Bugzilla 1558299 (file: URI SOP bypass fix) | https://bugzilla.mozilla.org/show_bug.cgi?id=1558299 | fixed 2019 (Firefox 68 uplift) |
| S47 | npm registry entries (jspdf, pdfmake, pdf-lib, fflate, jszip and dependencies) | https://registry.npmjs.org/{package} | fetched 2026-10-19 |
| S48 | googlefonts/roboto-classic README (licence) | https://github.com/googlefonts/roboto-classic | fetched 2026-10-19 |

### Empirical tests (observed, 2026-10-19)

| ID | What | Environment |
|---|---|---|
| E1 | `curl` CORS preflight (`OPTIONS` with `Origin: http://localhost:8080` and `Origin: null`, requesting `authorization,content-type`) plus real unauthenticated requests to Graph, ARM, Log Analytics (both hosts), Defender XDR API, Entra `/token` and `/devicecode` | This machine, ~08:28 UTC. The device-code probe used a well-known Microsoft first-party public client ID. No sign-in was completed and the code expired unused. A dummy client ID was used everywhere else. |
| E2 | Probe page opened from `file:///...` in headless browsers, driven over the DevTools protocol. Tests: origin, `isSecureContext`, File System Access presence, Compression Streams, localStorage/IndexedDB/cookies, BroadcastChannel, WebCrypto, StorageManager, `fetch`/XHR of local files, module scripts, Workers, cross-origin `fetch` to the Microsoft APIs. A second page in a **different folder** then read the storage back. | Microsoft Edge 155.0.4283.62 and Google Chrome 155.0.8059.80, `--headless=new`, fresh profiles |
| E3 | Same probe served from a minimal Node static server bound to `127.0.0.1:8765` | Edge 155 headless |
| E4 | A page on `http://127.0.0.1:8765` tries to navigate to a `file:///` URL | Edge 155 headless |
| E5 | Downloaded minified browser bundles from jsDelivr and measured raw and `gzip -9` sizes (not executed) | jsDelivr, versions as listed in section 8 |

Test caveats: headless mode can differ from headed mode, especially for `navigator.storage.persist()` and permission prompts. Firefox was not installed, so Firefox was not tested. The test profiles lived under a very long temp path. One IndexedDB failure in E3 (`UnknownError: Internal error opening backing store`) is probably a Windows MAX_PATH artefact of that path, not a platform limit. That is unverified.

---

## 1. Entra redirect URI rules (SPA platform, schemes, file://, nativeclient, custom schemes)

| # | Claim | Source | Confidence | Caveats |
|---|---|---|---|---|
| 1.1 | Redirect URIs must be `https`, with only localhost exceptions. Quote: "Redirect URIs must begin with the scheme `https`, with exceptions for some localhost redirect URIs." | S1 | High | |
| 1.2 | `http` is allowed only for localhost, and Microsoft frames it as a development-time exception. Quote: "The HTTP scheme (`http://`) is supported *only* for *localhost* URIs and should be used only during active local application development and testing." | S1 | High | This matters for a production "loopback launcher" design (section 6). It is guidance, not a technical block. |
| 1.3 | `file://` is not a valid redirect URI, for SPA or otherwise. No Microsoft page lists `file` as a supported scheme. The MSAL.js known-issues page says: "The only supported schemes for redirect URIs are `https:` for production apps and `http://localhost` for local development." | S1, S4 | High | S4 is old (2020) but republished 2026-06-15, and it agrees with S1. A `file://` page also has no registrable origin (section 7). |
| 1.4 | The SPA platform accepts `http://localhost[:port]/path`. Microsoft's own example is `http://localhost:3000/auth-response` "if you run your app locally". | S2 | High | |
| 1.5 | The localhost port is ignored when matching. Quote: "the port component (for example, `:5001` or `:443`) is ignored for the purposes of matching a localhost redirect URI." Don't register several localhost URIs that differ only by port. Distinguish them by path. | S1 | High | This lets a launcher pick a free port at runtime. Browser storage is still keyed by origin including port (section 6). |
| 1.6 | Prefer `127.0.0.1` over `localhost`. However: "You can't, however, use the Redirect URIs text box in the Azure portal to add a loopback-based redirect URI that uses the http scheme". It needs a manifest edit (`replyUrlsWithType`). IPv6 `[::1]` "isn't currently supported." | S1 | High | Customer setup instructions would need a manifest or Graph step if we choose `127.0.0.1`. |
| 1.7 | SPA-type redirect URIs are what enable CORS on the token endpoint. Using them requires an `Origin` header: "the Microsoft identity platform returns an error if you attempt to use a `spa` redirect URI without an `Origin` header." | S3 | High | |
| 1.8 | The "Mobile and desktop applications" platform offers `https://login.microsoftonline.com/common/oauth2/nativeclient` and custom redirect URIs (custom schemes), intended "for desktop apps or mobile apps not using MSAL or a broker." | S2 | High | |
| 1.9 | A browser page cannot use native or custom-scheme redirects. Cross-origin token redemption is refused for non-SPA client types: "Cross-origin token redemption is permitted only for the 'Single-Page Application' client-type or 'Native' client-type with origin registered in AllowedOriginForNativeAppCorsRequestInOAuthToken allow list." (AADSTS90023, seen with `tauri://localhost`). | S4 | High | The allow list is Microsoft-controlled. No customer-facing way to add an origin was found. Also, the `nativeclient` page is on login.microsoftonline.com, which is cross-origin to our page, so our page could not read the code from it anyway. |
| 1.10 | PKCE is mandatory for SPA auth code flow. `code_challenge` is "required by the Microsoft identity platform for single page apps using the authorization code flow". Public clients "must not use secrets or certificates". | S3 | High | |
| 1.11 | SPA refresh tokens are capped at 24 h: "For refresh tokens sent to a redirect URI registered as `spa`, the refresh token expires after 24 hours." Re-authentication must happen in a top-level frame or popup. | S3 | High | Acceptable for short, read-only check sessions. |
| 1.12 | Query parameters and wildcards are allowed only for work/school-only apps. Limits: 256 URIs and 256 characters per URI. | S1 | High | Not a blocker. |

**Answer to Q1:** Only `https://...` and `http://localhost` / `http://127.0.0.1` are possible. `file://` and null origins cannot be registered or used. `nativeclient` and custom schemes exist only on the Mobile and desktop platform, and Entra refuses browser cross-origin token redemption for that client type (1.9). So no Entra configuration lets a `file://` page complete an interactive sign-in.

---

## 2. MSAL.js (msal-browser v5) from file://, device code from a browser, PKCE

| # | Claim | Source | Confidence | Caveats |
|---|---|---|---|---|
| 2.1 | The current major version is v5. npm latest is 5.25.1 (published 2026-10-13, MIT licence). Learn lists msal-browser "Active version v5.x". v3.x and v4.x "have transitioned out of active support". | S7, S15 | High | |
| 2.2 | msal-browser implements only the auth code flow with PKCE. The device code grant appears only under msal-node. | S7 | High | msal-browser has no device code API. |
| 2.3 | In v5 every interactive and silent flow goes through a **redirect bridge page**: "**All authentication flows** (`acquireTokenSilent()`, `ssoSilent()`, `loginPopup()`, and `loginRedirect()`) now use the redirect bridge." | S8 | High | |
| 2.4 | The bridge returns results to the app via BroadcastChannel: "Popup and silent flows: The redirect bridge broadcasts the authentication response to the main application window using the BroadcastChannel API". The bridge must be served "from the same origin as your application" and not from a CDN. | S8, S11 | High | |
| 2.5 | BroadcastChannel is same-origin only: "It allows communication between different documents (in different windows, tabs, frames or iframes) of the same origin." | S39 | High | |
| 2.6 | **Consequence:** a `file://` page cannot receive MSAL v5 popup or silent results. The bridge must live at a registrable redirect URI (`https` or `http://localhost`), which is a different origin from the `file://` page, so BroadcastChannel messages never arrive (2.4, 2.5). | S8, S39, S1 | High (by construction) | Not tested end to end with a real app registration. |
| 2.7 | **Consequence:** the redirect flow cannot return to a `file://` page either. The bridge "navigates back to your application's page that initiated the redirect". **Observed (E4):** Edge blocks navigation from an `http://127.0.0.1` page to `file:///` with "Not allowed to load local resource". | S8, E4 | High | |
| 2.8 | The default `redirectUri` is the page itself: "Login request page (`window.location.href` of page which made auth request)". On `file://` that would be a `file:///` URI, which Entra will not accept (1.3). | S9 | High | |
| 2.9 | MSAL's optional popup relay feature explicitly rejects local schemes: "Active and local schemes (`javascript:`, `data:`, `blob:`, `file:`) are rejected". | S9 | Medium | This applies to relay navigation targets, not the app's own origin. It shows design intent, not a blanket file:// ban. |
| 2.10 | The Windows broker (WAM) path in msal-browser is unavailable: "App must be hosted on `https`", and it needs the Windows Accounts extension in Chrome/Edge. | S13 | High | This rules out WAM for both `file://` and `http://localhost`. |
| 2.11 | MSAL is no longer on a CDN: "Starting from MSAL.js v3 `msal-browser` is no longer hosted on the CDN." The supported options are the ESM build or self-hosting `lib/msal-browser.min.js` from the npm package. | S12 | High | Fine for us, since we would vendor the file. But on `file://` we cannot use the ESM build (section 7: module scripts are blocked), so we would need the UMD `lib/msal-browser.min.js`. |
| 2.12 | **Device code from a browser page is not viable.** **Observed (E1, E2):** `/oauth2/v2.0/devicecode` returns no `Access-Control-Allow-Origin` header on preflight or on the real POST, from both `null` and `http://localhost` origins. Edge and Chrome block it: "No 'Access-Control-Allow-Origin' header is present on the requested resource." `/oauth2/v2.0/token` does return `Access-Control-Allow-Origin: *`. | E1, E2 | High (observed) | No Microsoft page documents CORS for `/devicecode` either way. The flow is designed for "input-constrained devices such as a smart TV, IoT device, or a printer." (S5) |
| 2.13 | Device code flow is also a governance red flag: "Device code flow is a high-risk authentication method that can be part of a phishing attack". "Microsoft recommends blocking device code flow wherever possible." | S6 | High | Many SOC customers block it with Conditional Access. Do not build on it. |
| 2.14 | v5 uses cookies (for example, the localStorage encryption key, S10) and "All cookies are now only ever securely sent over HTTPS." | S8, S10 | Medium | **Observed (E2):** `document.cookie` does not persist on `file://` (it reads back empty after a write) in Edge/Chrome 155. With `localStorage` caching on `file://`, MSAL's encryption key could not be stored. Moot, because sign-in cannot complete on `file://` anyway. |

**Answer to Q2:** MSAL.js v5 cannot sign a user in from a `file://` page. No registrable redirect URI shares an origin with `file://`, the v5 bridge depends on same-origin BroadcastChannel or navigation back to the page, and both are blocked (2.6, 2.7). Device code is unsupported in msal-browser and its endpoint is not CORS-enabled (2.12). Microsoft also advises customers to block it (2.13). A hand-rolled "copy the code from the failed localhost redirect into the app" workaround is technically conceivable, because `/token` returns `Access-Control-Allow-Origin: *` even for `Origin: null` (E1). It is unsupported by Microsoft, fragile, phishable and contrary to S1's intent. **Rejected.**

---

## 3. CORS support of the APIs we would call

Observed headers (E1, both from `Origin: null` and `Origin: http://localhost:8080`). E2 and E3 confirmed that real browser `fetch()` from `file://` and from `http://127.0.0.1` gets a readable 401 response from the first three APIs and a CORS failure from Defender XDR.

| API | Preflight result | Real response | Exposed headers (selected) | Official statement | Confidence |
|---|---|---|---|---|---|
| Microsoft Graph `graph.microsoft.com` (tested `/v1.0/security/incidents`) | 200, `Access-Control-Allow-Origin: *`, methods DELETE/GET/OPTIONS/POST/PUT/PATCH, echoes `authorization,content-type` | 401 with `Access-Control-Allow-Origin: *` | `Retry-After`, `request-id`, `client-request-id`, `WWW-Authenticate` | Indirect only. The OneDrive API CORS page (S20, dated 2017, republished 2026) says it "supports HTTP access control (CORS) to allow single page JavaScript applications" and its sample calls `https://graph.microsoft.com/v1.0/me/drive/root/children`. No Graph-wide CORS statement was found. | High (observed); Medium (docs) |
| Azure Resource Manager `management.azure.com` | 200, `Access-Control-Allow-Origin: *`, all methods, echoes requested headers | 401 with `Access-Control-Allow-Origin: *` | `WWW-Authenticate`, `x-ms-request-id`, `x-ms-correlation-request-id`, `x-ms-failure-cause`. **Not** `Retry-After` or `x-ms-ratelimit-*` (on the 401) | Historic only. "Azure Resource Manager supports cross-origin resource sharing (CORS)." and "Resource Manager enables CORS for all requests with valid authentication credentials." (S23, an archived copy). The current overview (S22) no longer mentions CORS. | High (observed); Medium (docs) |
| Log Analytics query API `api.loganalytics.azure.com` and `api.loganalytics.io` | 204, `Access-Control-Allow-Origin: *`, all methods, `Access-Control-Allow-Credentials: true` | 401 with `Access-Control-Allow-Origin: *` | `Retry-After`, `WWW-Authenticate`, `x-ms-request-id` | None found. S21 lists auth code, implicit and client credentials flows, and says "The `api.loganalytics.io` endpoint is being replaced by `api.loganalytics.azure.com`." | High (observed); Low (docs) |
| Defender XDR API `api.security.microsoft.com` | **401, no `Access-Control-Allow-Origin`** | 401, no `Access-Control-Allow-Origin` | n/a | None. The Defender XDR API overview (S24) points to the Graph security API first: "The Microsoft Graph security API is a unified schema and interface that integrates with various Microsoft security solutions". | High (observed): **not usable from a browser** |
| Entra `/oauth2/v2.0/token` | 200, `Access-Control-Allow-Origin: *`, POST/OPTIONS | 400 with `Access-Control-Allow-Origin: *` | `x-ms-request-id` | S3 describes CORS for `spa` redirect URIs | High |
| Entra `/oauth2/v2.0/devicecode` | 200 but **no `Access-Control-Allow-Origin`** | No `Access-Control-Allow-Origin` | n/a | None | High (observed) |

Implications:
- Graph covers incidents, alerts_v2 and runHuntingQuery from the browser. runHuntingQuery now takes an optional `workspaceId` (S16). Avoid the Defender XDR API entirely.
- On ARM, browser JavaScript may not be able to read throttling headers. They were not exposed on the 401, and 429 was not tested. Backoff logic must cope without `Retry-After` (prototype item P6).
- The Access-Control-Allow-Origin behaviour of ARM and Log Analytics is **observed, not contractually documented**. Treat it as a dependency that could change.

---

## 4. Least-privilege permissions, consent, and app registration ownership

### 4.1 Delegated scopes and roles for read-only checks

| Resource / call | Delegated scope (least privileged) | Admin consent required? | User role also required | Source | Confidence |
|---|---|---|---|---|---|
| Graph `GET /security/incidents` | `SecurityIncident.Read.All` | **Yes** | One of: Security Reader, Global Reader, Security Operator, Security Administrator. "the signed-in user must be assigned a supported Microsoft Entra role or a custom role that grants the permissions required" | S17, S19 | High |
| Graph `GET /security/alerts_v2` (supports `$filter=serviceSource eq 'microsoftSentinel'`) | `SecurityAlert.Read.All` | **Yes** | Same four roles | S18, S19 | High |
| Graph `POST /security/runHuntingQuery` | `ThreatHunting.Read.All` (the only one, no higher option) | **Yes** | Role list not shown on the fetched page | S16, S19 | High (scope); Low (roles: verify) |
| ARM `Microsoft.SecurityInsights/*` and workspace reads | Azure Service Management `user_impersonation` (request `https://management.azure.com/.default`) | **Not confirmed** from a Microsoft source. Third-party docs say "No". | Azure RBAC: **Microsoft Sentinel Reader** at the resource group ("View data, incidents, workbooks, recommendations and other resources") | S25, S26 | High (role); Low (consent) |
| Log Analytics query API | Log Analytics API `Data.Read` (resource `https://api.loganalytics.io`) | **Not confirmed** | Sentinel Reader already includes `Microsoft.OperationalInsights/workspaces/query/read` and `workspaces/query/*/read`, so Log Analytics Reader looks unnecessary in addition | S21, S26 | High (scope); Low (consent); Medium (role inference) |

Notes:
- **Microsoft Sentinel Reader is not purely read-only.** Its definition also includes `Microsoft.Resources/deployments/*`, `Microsoft.Insights/alertRules/*` (classic metric alerts) and `Microsoft.Support/*`. It excludes confidential watchlists. A strictly read-only custom role (`Microsoft.SecurityInsights/*/read` plus workspace query read) would be tighter (S26). Confidence High.
- Mandatory MFA Phase 2 does not affect read-only ARM checks: "Read operations won't require MFA." Also: "Generally, Microsoft Graph APIs aren't in scope for Azure MFA enforcement." (S30). Confidence High.
- Context: "After March 31, 2027, Microsoft Sentinel will no longer be supported in the Azure portal" (S25). Connected-mode value peaks before that date.
- A browser session touches three resources (Graph, ARM, Log Analytics), so it needs three tokens and three consent sets. MSAL can request consent for extra resources up front, but each still needs a separate silent token call. Confidence Medium (MSAL design knowledge; not re-verified).
- Scope "type" (User or Admin consent) can be confirmed in any tenant via `GET /servicePrincipals(appId='...')?$select=oauth2PermissionScopes` for the ARM (`797f4846-ba00-4fd7-ba43-dac1f8f63013`, from third-party docs) and Log Analytics service principals (prototype item P5).

### 4.2 Shared multi-tenant public client owned by the project vs customer-registered app

What the docs say:
- All three Graph security scopes need **admin consent** (S19), so a tenant administrator must approve whichever app is used.
- "By default, all users are allowed to consent to applications for permissions that don't require administrator consent." Microsoft recommends: "we recommend that you allow user consent only for applications that have been published by a verified publisher." (S27). Confidence High.
- Publisher verification requires "a Partner One ID for a valid Microsoft AI Cloud Partner Program account", among other conditions (S28). Where risk-based step-up consent is enabled, "users can't consent to most newly registered multitenant apps that aren't publisher verified" (S28). An open-source project without a Partner Center organisation cannot easily meet this. Confidence High.
- Single-tenant guidance fits our case: "Use if building an app registration for a third party that instructs you to build your own app registration for their app." (S29). Confidence High.
- Microsoft itself recommends a dedicated customer-owned app for Graph PowerShell to "isolate and limit the consent permissions" and to require user assignment (S31). This is analogous best practice. Confidence High.

Security considerations of a shared public client ID (analysis, Low to Medium confidence, not vendor-stated):
1. **Control-plane risk across tenants.** Whoever controls the project's app object (maintainers, or an attacker who compromises their account or tenant) can add redirect URIs. Changes on the application object propagate to every consenting tenant without re-consent. An attacker-controlled HTTPS redirect URI plus a phishing link would then harvest codes for an app that already holds admin-consented security read scopes, with no new consent prompt.
2. **A public client is not authentication.** Anyone can present the client ID, so tenant admins cannot tell our tool from someone else's code that uses the same ID. Sign-in logs would show the project's app name for both.
3. **Availability and trust.** If the registration is disabled or deleted, every customer breaks. Unverified publisher warnings and app-governance policies will block or flag it in many SOC tenants.
4. **Admin effort is not lower.** Admin consent is needed either way (S19). A customer-owned registration costs only a few extra minutes and gives them ownership, user assignment, Conditional Access targeting and audit.

**Recommendation:** each customer registers their own **single-tenant** SPA app ("Accounts in this organizational directory only"), with:
- assignment required;
- redirect URI `http://localhost/<path>`, SPA platform (only if we ship a loopback launcher);
- delegated scopes: `SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `ThreatHunting.Read.All`, ARM `user_impersonation`, Log Analytics `Data.Read`;
- no secrets;
- "Allow public client flows" left **off**, since device code is not needed.

The app accepts a tenant ID and client ID as configuration and ships no default client ID. Do not reuse Microsoft first-party client IDs: they have no SPA redirect for our origin, and doing so is against their intended use (Low confidence, opinion).

---

## 5. Token handling in msal-browser

| # | Claim | Source | Confidence | Caveats |
|---|---|---|---|---|
| 5.1 | `cacheLocation` is one of `"sessionStorage"`, `"localStorage"` or `"memoryStorage"`. The default is `sessionStorage`. | S9 | High | |
| 5.2 | `memoryStorage` "allows you to opt-out of storing the cache in browser storage". It is cleared on page refresh or navigation, and the doc table marks it as not supporting the redirect flow. "Temporary cache entries will always be stored in session storage or in memory." | S10 | High | Use the popup flow with memoryStorage. Sign-in is repeated after each reload, which is acceptable for a short check session. |
| 5.3 | localStorage tokens are encrypted (AES-GCM via HKDF) since v4, with the base key "in a session cookie titled `msal.cache.encryption`". The encryption is "**not** to provide additional security". | S10, S7 | High | The cookie is removed when the browser instance closes. Cookies do not work on `file://` (E2). |
| 5.4 | Responsibility for XSS stays with the app: "It is your responsibility to ensure your application is not vulnerable to XSS attacks". "If you are still concerned, we recommend using the `memoryStorage` option instead." | S10 | High | |
| 5.5 | The older FAQ: "Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users." | S14 | Medium | The FAQ content predates v3. |
| 5.6 | IETF BCP: "localStorage does not protect against unauthorized access from malicious JavaScript". In-memory storage "limits the exposure of the tokens to the current execution context only". Overall, "none of these options can fully mitigate token exfiltration when the attacker can execute malicious code". A BFF is "strongly recommended for business applications, sensitive applications". | S34 | High | We cannot have a BFF in an offline static app. That is a structural reason to keep connected mode minimal or off. |
| 5.7 | **Observed (E2), and it contradicts MDN:** in Edge and Chrome 155, localStorage **and** IndexedDB are shared by **all** `file://` pages in the profile. A page in a different folder read the value and saw the database. `location.origin` reported `"file://"`. MDN says "In all current browsers, localStorage seems to return a different object for each file: URL" (S36). Chromium noted in 2015: "localStorage is currently global for file:, and this patch doesn't change that." (S44). | E2, S36, S44 | High (observed for Chromium) | **Any HTML file the analyst opens from disk (for example, a malicious email attachment) can read everything our app stores in web storage.** This is a design constraint for the offline app too, not just tokens. |

Recommended practice for us:
- `cacheLocation: "memoryStorage"`, popup flow, request only the read scopes listed above, and call `logoutPopup` or clear on exit.
- Never write tokens, account objects or raw API responses containing secrets into localStorage, IndexedDB, exported JSON/ZIP/PDF evidence, or URLs.
- Treat every string from the tenant as hostile input: incident titles, alert descriptions, entity names and KQL results can contain attacker-controlled text. Render them with `textContent` or a sanitiser, and never with `innerHTML`.
- Ship a strict CSP (`script-src 'self'`, no `unsafe-inline`/`unsafe-eval`, `connect-src` limited to `login.microsoftonline.com`, `graph.microsoft.com`, `management.azure.com`, `api.loganalytics.azure.com`) and no third-party or remote scripts. Subresource Integrity does not apply to vendored local files.
- Because `file://` storage is shared (5.7), the offline app should keep project state in user-chosen files, or encrypt at rest with a user passphrase. At minimum it should not store sensitive tenant data in IndexedDB or localStorage.

---

## 6. Minimal local loopback server (PowerShell or Node on http://localhost:port)

What it solves (High confidence, from S1/S8 plus E3):
- The app gets a real origin (`http://127.0.0.1:8765` in E3). The same origin hosts the app and the MSAL v5 redirect bridge, so BroadcastChannel and navigation-back both work (2.3-2.7). The SPA redirect URI `http://localhost/...` can be registered (1.4), and the port is ignored for matching (1.5).
- **Observed (E3):** on loopback, module scripts, Workers, `fetch`/XHR of local files and cookies all work, and the page is a secure context. On `file://`, all of these except secure context fail (section 7).

What it does not solve:
- An app registration is still needed (section 4). The WAM broker still needs HTTPS (2.10). The Defender XDR API still has no CORS (section 3).
- Microsoft's wording that http localhost "should be used only during active local application development and testing" (S1) may draw security-review objections, even though RFC 8252 makes loopback the standard pattern for native apps.

New security surface (analysis, Medium confidence unless a source is cited):
1. **Any local process or user can connect.** RFC 8252: "Clients should listen on the loopback network interface only, in order to avoid interference by other network actors." and "Loopback IP-based redirect URIs may be susceptible to interception by other apps". On multi-user hosts (RDS/Citrix jump boxes common in SOCs), other users share 127.0.0.1. Mitigations:
   - bind to 127.0.0.1 only;
   - serve static files only, from the app folder, with path-traversal checks;
   - provide no write or exec endpoints;
   - pick a random high port per session;
   - add a per-session random URL token if feasible.
2. **Port squatting and phishing.** A pre-bound malicious listener on the same port could serve a look-alike app. The launcher must open the browser to the port it actually bound. PKCE protects code redemption, but not a fully impersonated page (S33, S3).
3. **DNS rebinding and cross-site requests from web pages.** Validate the `Host` header (accept only `127.0.0.1:<port>` / `localhost:<port>`), send no CORS headers, and expose nothing state-changing. Chrome's Local Network Access prompt gates "any request from the public network to a local network or loopback destination", and "The Local Network Access permission prompt is launching in Chrome 142." (S43). Edge parity was not verified. Do not rely on this.
4. **Execution controls.** PowerShell execution policy, AppLocker/WDAC, Constrained Language Mode and EDR rules may block or flag an unsigned script that opens a listener. Node is not standard on SOC laptops. We would need a signed script, and possibly HttpListener URL ACL handling (not verified; prototype item P8).
5. **Origin-keyed storage changes with the port.** localStorage and IndexedDB are per origin including port, so a random port loses saved state between runs, while a fixed port risks collisions. This is better isolated than `file://`'s single shared origin (5.7).
6. Use RFC 8252's advice to listen only while needed: "Clients should open the network port only when starting the authorization request". For a full app server, that means shutting down when the browser tab closes or after an idle timeout.

Resulting assessment: the loopback approach **does** resolve the redirect URI and origin problems. It also turns a zero-install static page into "run a local script that opens a listener", and that adds review friction plus the six risks above.

---

## 7. Browser storage and file APIs on file:// (Chromium and Firefox)

| # | Topic | Documented | Observed (E2 Edge/Chrome 155 `file://`; E3 Edge `http://127.0.0.1`) | Confidence |
|---|---|---|---|---|
| 7.1 | Is `file://` a secure context? | MDN lists "A scheme of `https`, `wss`, or `file`" as potentially trustworthy, and the table shows `file:///path/to/resource.html` as "✅ Secure (`file` URL)" (S35) | `isSecureContext === true` in both browsers. `crypto.subtle.digest` works. | High |
| 7.2 | Origin of `file://` pages | "Modern browsers usually treat the origin of files loaded using the `file:///` scheme as opaque origins"; the URL spec leaves it implementation-dependent (S37) | `self.origin === "null"`, `location.origin === "file://"`, and requests carry `Origin: null` | High |
| 7.3 | localStorage / IndexedDB on `file://` (Chromium) | MDN: "the requirements for `localStorage` behavior are undefined and may vary among different browsers" and claims each file URL has its own area (S36). Chromium 2015: localStorage "is currently global for file:" (S44) | Both work, and are **shared across all `file://` pages and folders** in the profile (see 5.7) | High (observed) |
| 7.4 | Firefox `file://` origin | Firefox 68 fixed "Same-origin policy treats all files in a directory as having the same-origin" (S45). The fix added a pref so file: URLs are unique origins by default. The bug thread names it `privacy.file_unique_origin` (and also mentions `security.fileuri.strict_origin_policy`) (S46) | Not tested (Firefox not installed). Firefox's localStorage/IndexedDB keying for `file://` is **unconfirmed**. | Medium (pref name); Low (storage behaviour) |
| 7.5 | Cookies on `file://` | Not found in official docs | `document.cookie` write is ignored (reads back `""`). Works on loopback (E3). | Medium (observed only) |
| 7.6 | File System Access API (`showOpenFilePicker`/`showSaveFilePicker`/`showDirectoryPicker`) | Secure contexts only; "Transient user activation is required."; Experimental, "Limited availability" (S40). BCD: Chrome/Edge 86+, Firefox and Safari **not supported** (S41) | All three are `typeof === "function"` on `file://` in Edge and Chrome. A picker was not invoked (needs a user gesture). | High (availability); Medium (actually works on `file://`: verify, P10) |
| 7.7 | Persisting handles in IndexedDB and re-use | Chrome 122+ offers "Allow this time" / "Allow on every visit" / "Don't allow" when a restored handle calls `requestPermission()`. "Installed apps will automatically persist permissions once the user grants access". Access can be auto-revoked after the tab is backgrounded (S42) | Not tested. **Risk (inferred):** because `file://` storage is shared (7.3), another local HTML file could read our stored handles. If Chrome granted "every visit" to the `file://` origin, that file might use them. | Medium (docs); Low (risk: verify, P10) |
| 7.8 | ES module scripts from `file://` | "if you try to load the HTML file locally (i.e., with a `file://` URL), you'll run into CORS errors due to JavaScript module security requirements." (S38) | `<script type="module" src>` is blocked; inline `<script type="module">` runs. The console says: "Cross origin requests are only supported for protocol schemes: chrome-experimental-site-token-provider, chrome-extension, chrome-untrusted, data, edge, http, https, isolated-app." | High |
| 7.9 | `fetch()` / XHR of local files from `file://` | Same rule as 7.8 | Both fail with a CORS error (`TypeError: Failed to fetch`; XHR `onerror`). They work on loopback (E3). | High (observed) |
| 7.10 | Web Workers from `file://` | Not checked in docs | `new Worker('./w.js')` throws `SecurityError ... cannot be accessed from origin 'null'`. It works on loopback (E3). | High (observed) |
| 7.11 | Cross-origin `fetch()` from `file://` to CORS-enabled APIs | n/a | Works: Graph, ARM and Log Analytics return readable 401s, sent with `Origin: null` | High (observed) |
| 7.12 | `CompressionStream` / `DecompressionStream` | BCD: Chrome/Edge 80, Firefox 113, Safari 16.4. `deflate-raw`: Chrome/Edge 103, Firefox 113, Safari 16.4 (S41) | Present on `file://`; a gzip round trip and `deflate-raw` work | High |
| 7.13 | `navigator.storage.persist()` on `file://` | StorageManager details for `file://` not documented | `persisted()` and `persist()` return `false` on both `file://` and loopback (headless), with quota ~10 GB | Medium (headless may differ: verify headed, P11) |
| 7.14 | BroadcastChannel within `file://` | Same-origin only (S39) | Works between two channels in the same `file://` page | High |

Build implications for the offline app, regardless of connected mode:
- Ship **classic scripts** only: a single IIFE/UMD bundle with data embedded as JS. No ES modules, no `fetch()` of local JSON, and no Workers on `file://`.
- Use `<input type="file">` and download links as the universal fallback, with File System Access as a Chromium enhancement. It does not exist in Firefox.
- Do not keep sensitive data in web storage on `file://` (5.7).

---

## 8. Licences and sizes of candidate libraries

Sizes are E5 measurements of the published minified browser bundle (bytes, raw / `gzip -9`). Licences come from the npm registry `license` field (S47) and file headers. Dependency licences were checked at their *latest* versions, which may differ from the versions a given bundle pins.

| Library (latest) | Licence | Bundle measured | Raw / gzip | Notes |
|---|---|---|---|---|
| @azure/msal-browser 5.25.1 (2026-10-13) | MIT (dependency @azure/msal-common: MIT) | `lib/msal-browser.min.js` (UMD); `lib/redirect-bridge/msal-redirect-bridge.min.js` | 290,775 / 72,387; bridge 6,656 / 2,752 | The npm `unpackedSize` (~13.8 MB) is not the shipped size. Vendor the UMD file (2.11). |
| jsPDF 4.2.1 (2026-03-17) | MIT | `dist/jspdf.umd.min.js` | 420,165 / 132,215 | Dependencies: fflate (MIT), fast-png (MIT), @babel/runtime (MIT). Optional: html2canvas (MIT), canvg (MIT), core-js (MIT), **dompurify (MPL-2.0 OR Apache-2.0)**. |
| pdfmake 0.3.12 (2026-10-17) | MIT | `build/pdfmake.min.js` + `build/vfs_fonts.js` | 831,687 / 292,345 + 854,725 / 468,991 | Dependencies: pdfkit, xmldoc, linebreak (all MIT). The default fonts are Roboto, which googlefonts/roboto-classic says is OFL-1.1 (S48). The exact Roboto build embedded in vfs_fonts was not checked. |
| pdf-lib 1.17.1 | MIT | `dist/pdf-lib.min.js` | 525,099 / 206,660 | **Last release 2021-11-06** (maintenance risk). Dependencies: pako (MIT AND Zlib), tslib (0BSD), @pdf-lib/standard-fonts and @pdf-lib/upng (MIT). |
| fflate 0.8.3 (2026-05-16) | MIT | `umd/index.js` | 33,044 / 12,618 | No dependencies. Also used inside jsPDF. |
| JSZip 3.10.2 (2026-09-08) | **(MIT OR GPL-3.0-or-later)** dual licence: choose MIT | `dist/jszip.min.js` | 97,781 / 28,367 | Dependencies: pako (MIT AND Zlib), lie, setimmediate, readable-stream (MIT) |

Observations: for zip output, fflate is about 1/3 the size of JSZip with a simpler licence, and native `CompressionStream('deflate-raw')` (7.12) can replace the deflate step entirely. For PDF, print-to-PDF has zero payload. If a library is needed, jsPDF is the smallest maintained option. pdfmake is roughly 760 KB gzip including fonts.

---

## Feasibility assessment for release 1

| Option | Feasible? | What it takes | Main risks |
|---|---|---|---|
| **A. None in the browser** (pure offline). Optionally add an **evidence import**: a documented read-only PowerShell or KQL script the customer runs with their own tooling (for example `Connect-MgGraph -Scopes SecurityIncident.Read.All,...` and `Invoke-AzRestMethod`, S31/S32), producing a JSON file that the app imports through a file picker | **Yes** | No auth code in our app. The customer's existing Microsoft tooling handles sign-in, consent, MFA and Conditional Access. The app only parses a file. | The script needs the Az/Graph modules. The JSON may hold sensitive tenant data, so handle it as hostile input and keep it out of shared `file://` storage. |
| **B. Loopback-launcher connected mode** (PowerShell/Node server on `127.0.0.1`, MSAL v5 popup + bridge, `memoryStorage`, Graph + ARM + Log Analytics) | **Technically yes** (sections 1, 2, 3, 6), but **not proven**: no end-to-end test with a real tenant yet | Signed launcher script, app registration (C), MSAL bundle (~72 KB gzip), strict CSP, XSS-safe rendering of tenant data, backoff without `Retry-After` on ARM | The six loopback risks in section 6. Microsoft calls http localhost a dev-time exception (S1). Undocumented CORS on ARM/LA. Script blocking by AppLocker/WDAC/EDR. Security-review friction at SOC customers. |
| **C. Customer-registered app** (needed by B, or by a hosted HTTPS variant) | **Yes**, and preferred over a shared project-owned multi-tenant client (section 4.2) | Registration guide (single-tenant, SPA, assignment required, delegated read scopes, admin consent) plus tenant ID / client ID configuration | Admin effort per customer. Wrong configuration leads to confusing AADSTS errors. Admin consent is needed in any case. |
| *(D. Hosted HTTPS page, for example customer-hosted static site)* | Yes. This is the pattern Microsoft fully supports, and the only one that enables WAM (2.10) | Hosting plus a customer app registration | Breaks the offline/`file://` promise. Creates hosting supply-chain trust. Out of scope for R1. |

Risks that apply to any connected mode: tokens with tenant-wide security read scopes in a page that has no BFF (5.6); attacker-controlled strings in incident and alert data (XSS); undocumented CORS on ARM/Log Analytics; three resources and consents; the 24 h SPA refresh-token cap; and storage leakage if anything is persisted on `file://` (5.7).

**Recommendation:**
- **Release 1:** ship **without** in-browser connected mode (option A). Optionally include a read-only, documented export script plus JSON import, so customers can feed real tenant facts into the guide without the app ever holding a token.
- **Roadmap:** put "connected mode" there as **B + C**: a loopback launcher with a customer-registered single-tenant SPA app, MSAL v5 popup flow, `memoryStorage`, Graph/ARM/Log Analytics only, read-only scopes, strict CSP. It stays behind a feature flag and is gated on the prototype checks below.
- **Rejected:** do not pursue `file://` sign-in hacks, device code, a shared project-owned client ID, or the Defender XDR API.

---

## Things we must verify by prototype

- **P1:** End-to-end MSAL v5.25+ `loginPopup` / `acquireTokenSilent` with the redirect bridge served from the launcher on `http://localhost:<random port>/redirect.html`, in headed Edge and Chrome stable. Use a customer-style single-tenant SPA registration with `http://localhost/redirect.html`. Confirm port-agnostic matching for the SPA type, and that `memoryStorage` + popup works with no cookies or localStorage errors.
- **P2:** The same with `http://127.0.0.1` (manifest-added redirect URI). Confirm that MSAL and the bridge behave identically, then pick one host form.
- **P3:** Token behaviour across three resources (Graph, ARM `.default`, Log Analytics `.default`). Check consent prompts (admin consent workflow), silent renewal in a popup or top-level window without third-party cookies, and the 24 h refresh cap.
- **P4:** Conditional Access interactions in a hardened test tenant: compliant device, phishing-resistant MFA, token protection, sign-in frequency. Also how sign-in logs show the app.
- **P5:** Whether Azure Service Management `user_impersonation` and Log Analytics `Data.Read` are User- or Admin-consent scopes. Read `oauth2PermissionScopes[].type` on their service principals.
- **P6:** CORS on **authenticated** responses: 200, 403 and 429 from Graph (incidents, alerts_v2, runHuntingQuery POST), ARM `Microsoft.SecurityInsights` GETs, and Log Analytics query POST. Specifically, check whether ARM exposes `Retry-After` / `x-ms-ratelimit-remaining-*` to JavaScript.
- **P7:** The Entra/Defender roles needed for delegated `runHuntingQuery` against Sentinel tables, with and without `workspaceId`, and with Defender unified RBAC enabled.
- **P8:** The launcher on locked-down Windows: PowerShell 5.1 `HttpListener` on `http://localhost:<port>/` as a standard user (URL ACL?), versus a `TcpListener` fallback; behaviour under AppLocker/WDAC/Constrained Language Mode, execution policy and code signing; whether Defender for Endpoint alerts on it; Windows Firewall prompts for a loopback-only bind; `Host` header validation; clean shutdown.
- **P9:** Local Network Access in Chrome 142+ and current Edge. Confirm it does not interfere with a localhost-served page calling public APIs, and check what a hostile public page can still reach on our port.
- **P10:** File System Access on `file://` in headed Edge/Chrome: picker works with a user gesture; handle persisted in IndexedDB and re-used after a browser restart; whether "Allow on every visit" is offered for the `file://` origin; and whether a **different** local HTML file can read the stored handle and use it (security impact of shared `file://` storage).
- **P11:** `navigator.storage.persist()` and eviction behaviour for `file://` in headed browsers, which may differ from headless (`false`).
- **P12:** Firefox (current release and ESR): `file://` localStorage/IndexedDB keying with `privacy.file_unique_origin`, CompressionStream, and absence of File System Access. Make sure the fallback UX works.
- **P13:** Enterprise browser policies at target customers. For example, `URLBlocklist`/`URLAllowlist` blocking `file://*`, JavaScript blocked on local files, or downloads restrictions, any of which could defeat the `file://` delivery model itself.
- **P14:** Build pipeline output: a single classic-script bundle (no ES modules, Workers or local `fetch`) loads from `file://` in Edge, Chrome and Firefox. Embedded data size and parse time stay acceptable.
- **P15:** Zip export using `CompressionStream('deflate-raw')` plus a hand-written ZIP container, versus fflate, for correctness (Windows Explorer extraction) and size.
- **P16:** For the option A export script: that it is truly read-only (GET-only, plus the hunting POST), what output it produces, how it redacts or minimises data, and how the app safely ingests it as hostile input.
