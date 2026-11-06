# ADR-001: single-file offline web app, no connected mode in 1.0

- **Status:** Accepted for version 1.0.0 (first taken for the internal release candidate 0.9.0-rc.1). Revisit for the next major release.
- **Date:** 2026-10-19
- **Evidence:** [`prototypes/`](../prototypes/README.md) (P1 to P3, re-runnable), [`research/notes/04-connected-mode-and-browser-platform.md`](../research/notes/04-connected-mode-and-browser-platform.md), the end-to-end suite in [`docs/test-results.md`](test-results.md), and the connected-mode spike in [`prototypes/p4-connected/`](../prototypes/p4-connected/README.md) (not shipped).

## Context

The product must run locally and offline after download, need no account or backend, start with minimal effort on Windows, keep work safe, handle screenshot evidence, export and import projects, and produce PDF reports. A static HTML file opened straight from disk was the preferred option, but several requirements were risky under `file://`: storage, file access, settings files, module loading, PDF output, and optional Microsoft sign-in for a connected mode.

## What was tested (Windows 11, Edge 155 and Chrome 155, headless, 2026-10-19)

| # | Test | Result |
|---|---|---|
| P1 | Capabilities on `file://` with the network disabled | Secure context **yes**. Classic scripts **load**. **ES modules are blocked** (CORS). **`fetch` and XHR of a local JSON file are blocked.** `localStorage` works. **IndexedDB works, including a 3 MB Blob.** Data **survives a full browser restart**. `navigator.storage.persist()` returned **false** (best-effort storage). File input, Blob download, `CompressionStream('deflate-raw')`, `crypto.subtle` and `randomUUID` work. Print-engine PDF works offline. Zero http(s) requests. |
| P1 | Storage isolation on `file://` | **All local HTML files share one storage partition.** A file in another folder and a copied or moved file read the same localStorage and IndexedDB values. |
| P2 | File System Access API on `file://` | The pickers exist, but persistent handles and permission re-prompts **could not be verified automatically**. An attempt to automate the native dialog was abandoned as unreliable and unsafe on a user desktop. |
| P3 | Single HTML file with a meta CSP (`default-src 'none'; connect-src 'none'; script-src 'sha256-…'`) and the network **enabled** | The hashed inline script runs. `fetch`, XHR, `sendBeacon` and remote images are **blocked by the browser**, and no response was received. `blob:` images render. Injected inline scripts and `eval` are blocked. PDF still works. |
| R4 | Connected mode (research and live probes) | Entra SPA redirect URIs allow only `https` or `http://localhost`, so `file://` cannot be registered. MSAL.js (v5) needs a same-origin redirect bridge and BroadcastChannel, which do not work from `file://`. It has no device-code flow, and the `/devicecode` endpoint returns no CORS header. Graph, ARM and Log Analytics returned permissive CORS in probes, but the Defender XDR API did not. The least-privilege scopes (`SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `ThreatHunting.Read.All`) all need admin consent. |

## Decision

1. **Ship one self-contained HTML file** (`ArMo-MS-Defender-Migration-Assistant.html`, about 870 KB in 1.0). esbuild bundles the app and the knowledge base into one inline classic script at build time. There are no runtime dependencies, no CDN and no remote assets.
2. **Embed the typefaces.** The ArMoHub brand faces, Instrument Serif, Inter Tight and JetBrains Mono (all SIL Open Font License 1.1), are built into the stylesheet as `data:` URLs, so nothing is downloaded. Their licence texts are embedded in the file and ship beside it in `dist/licenses/`. Fallbacks are system fonts.
3. **Enforce "no network" with a strict meta Content-Security-Policy:** `connect-src 'none'`, `default-src 'none'`, hash-pinned script and style, and `font-src data:` for the embedded typefaces only. The browser itself blocks all requests, and the end-to-end tests check this. External documentation links open only when the user clicks them.
4. **Persistence:**
   - Settings go in `localStorage`.
   - Projects and evidence go in **IndexedDB, only with opt-in browser autosave** (off by default).
   - The **project package (.zip)** is the lasting record. It holds a manifest with SHA-256 hashes, `project.json` and the evidence files. The ZIP writer and reader are this project's own code, built on `CompressionStream`, with no library.
5. **Settings file:** the assistant does **not** claim to read a settings file silently at start-up. Browsers forbid that for a plain HTML page, and the File System Access API needs a user gesture and permission. Users can export and import a preferences file instead.
6. **PDF:** a print-ready report view plus the browser's own "Save as PDF". There is no PDF library. The output is selectable text, with page counters through CSS `@page` margin boxes, and always prints on white.
7. **Save as:** the File System Access "Save as" dialog is used when available, with a standard download as the fallback. The fallback is the path covered by automated tests.
8. **Connected mode is not in 1.0.** It stays on the roadmap as a separately labelled option that needs all of the following:
   - a small local loopback launcher (`http://localhost`);
   - an app registration created by each customer in their own tenant (no shared multi-tenant client ID);
   - admin consent for read-only scopes;
   - tokens held in memory only;
   - tenant data treated as hostile input.
9. **Import-based assistance instead:** a read-only PowerShell script (`tools/Get-ArMoSentinelInventory.ps1`, GET requests only) that customers run with their own Azure session. The assistant imports its output as labelled "imported" evidence plus suggested answers, which apply only after the user ticks them.

## Consequences

**What users gain:**
- Double-click one file and start. It also works from a USB stick or a locked-down laptop.
- An offline promise enforced by the browser, not only stated.
- No installer, no admin rights, no backend and no account.
- A small code base you can review: vanilla JavaScript, about 10,000 lines including the knowledge base and styles.

**What users give up, and how it is handled:**
- **Shared `file://` storage partition.**
  - Risk: another local HTML file opened in the same browser could read autosaved projects.
  - Mitigation: autosave is opt-in, with a clear disclosure during setup and in Settings; "Delete all data in this browser" removes everything; the package file is the source of truth.
- **Best-effort browser storage.** The user, or the browser under disk pressure, can clear it. Users are told to keep saving packages, and the assistant warns before closing with unsaved work that is not autosaved.
- **No silent settings file.** Preferences live in the browser, and export and import cover moving between machines.
- **PDF needs one extra click** ("Save as PDF" in the print dialog). The instructions are on the report page.
- **No live tenant checks.** The inventory script and evidence attachments cover this, and connected mode stays on the roadmap.
- **A larger file.** The embedded typefaces add about 257 KB of font data (more once encoded in the file). In return there is no font download and no change to the network promise.

**Browser support:** current Microsoft Edge and Google Chrome on Windows (tested on version 155). Firefox and Safari are **not tested** (they are not installed in the build environment) and are not supported in 1.0.

## Alternatives considered

| Option | Startup friction | Offline | Storage and files | PDF | Connected-mode feasibility | Security surface | Maintenance | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Single self-contained HTML (chosen)** | Lowest: one file | Yes, enforced by the CSP | IndexedDB plus package files | Print to PDF | None (by design) | Smallest | Low | **Chosen** |
| Folder of static files plus `index.html` | Low (unzip) | Yes | Same | Same | None | Small | Low; needs classic scripts only (no ES modules on `file://`), and content must still be bundled | Equivalent, with more friction and no benefit |
| Minimal local launcher or server (PowerShell or Node on `localhost`) | Medium: run a script, firewall prompts, port conflicts | Yes | Same, plus possible real file access | Same | Possible (localhost redirect URI) | Larger: a listening socket, origin attacks from other local pages | Medium | Deferred to the connected-mode roadmap |
| Desktop wrapper (Electron, Tauri or WebView2) | Medium: installer, signing, SmartScreen | Yes | Full file system | Native | Possible | Largest (native code, auto-update chain) | High | Not justified for 1.0 |

## Follow-ups

- Check the File System Access "Save as" path by hand in headed Edge and Chrome before each release (see the release checklist).
- Re-run the prototypes on each new major browser version.
- Connected mode: the P4 spike ([prototypes/p4-connected/README.md](../prototypes/p4-connected/README.md)) built a loopback launcher and a customer-registered app flow against mocks, with no real tenant. Its recommendation is a conditional go, and its conditions (a real-tenant validation run, a signed launcher, and owner and security sign-off) are listed there. None of it ships in 1.0.
