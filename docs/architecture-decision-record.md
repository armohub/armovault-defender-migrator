# ADR-001 — Single-file offline web app; no connected mode in release 1

- **Status:** Accepted for release 1 (0.9.0-rc.1). Revisit for release 2.
- **Date:** 2026-10-19
- **Evidence:** [`prototypes/`](../prototypes/README.md) (P1–P3, re-runnable), [`research/notes/04-connected-mode-and-browser-platform.md`](../research/notes/04-connected-mode-and-browser-platform.md), and the end-to-end suite in [`docs/test-results.md`](test-results.md).

## Context

The product must run locally and offline after download, need no account or backend, start with minimal effort on Windows, persist work safely, handle screenshot evidence, export and import projects, and produce PDF reports. A static `index.html` opened directly from disk was the preferred option, but several requirements were risky under `file://`: storage, file access, settings files, module loading, PDF output, and optional Microsoft sign-in for a connected mode.

## What was tested (Windows 11, Edge 155 and Chrome 155, headless, 2026-10-19)

| # | Test | Result |
|---|---|---|
| P1 | Capabilities on `file://` with network disabled | Secure context **yes**. Classic scripts **load**. **ES modules blocked** (CORS). **`fetch`/XHR of a local JSON file blocked.** `localStorage` works. **IndexedDB works, including a 3 MB Blob.** Data **persists across a full browser restart**. `navigator.storage.persist()` returned **false** (best-effort storage). File input, Blob download, `CompressionStream('deflate-raw')`, `crypto.subtle` and `randomUUID` work. Print-engine PDF works offline. Zero http(s) requests. |
| P1 | Storage isolation on `file://` | **All local HTML files share one storage partition.** A file in another folder and a copied/moved file read the same localStorage and IndexedDB values. |
| P2 | File System Access API on `file://` | Pickers exist, but persistent handles and permission re-prompts **could not be verified automatically**. A native-dialog automation attempt was abandoned as unreliable and unsafe on a user desktop. |
| P3 | Single HTML file + meta CSP (`default-src 'none'; connect-src 'none'; script-src 'sha256-…'`) with the network **enabled** | Hashed inline script runs. `fetch`, XHR, `sendBeacon` and remote images are **blocked by the browser**; no response was received. `blob:` images render. Injected inline scripts and `eval` are blocked. PDF still works. |
| R4 | Connected mode (research + live probes) | Entra SPA redirect URIs allow only `https` or `http://localhost`; `file://` cannot be registered. MSAL.js (v5) needs a same-origin redirect bridge and BroadcastChannel, which do not work from `file://`; it has no device-code flow, and the `/devicecode` endpoint returns no CORS header. Graph, ARM and Log Analytics returned permissive CORS in probes, but the Defender XDR API did not. Least-privilege scopes (`SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `ThreatHunting.Read.All`) all need admin consent. |

## Decision

1. **Ship one self-contained HTML file** (`ArMoHub-Defender-Migration-Assistant.html`, about 550 KB). esbuild bundles the app and the knowledge base into one inline classic script at build time. There are no runtime dependencies, no CDN, no fonts and no remote assets.
2. **Enforce "no network" with a strict meta Content-Security-Policy:** `connect-src 'none'`, `default-src 'none'`, and hash-pinned script and style. The browser itself blocks all requests, and the end-to-end tests check this. External documentation links open only when the user clicks them.
3. **Persistence:**
   - Settings go in `localStorage`.
   - Projects and evidence go in **IndexedDB, only with opt-in browser autosave** (off by default).
   - The **project package (.zip)** is the durable record. It holds a manifest with SHA-256 hashes, `project.json` and the evidence files. The ZIP writer and reader are custom-built on `CompressionStream` and need no library.
4. **Settings file:** the app does **not** claim to read a settings file silently at start-up. Browsers forbid that for a plain HTML page; the File System Access API needs a user gesture and permission. Users can export and import a preferences file instead.
5. **PDF:** a print-optimised report view plus the browser's own "Save as PDF". There is no PDF library. The output is selectable text with page counters through CSS `@page` margin boxes.
6. **Save as:** the File System Access "Save as…" dialog is used when available, falling back to a standard download. The fallback is the path covered by automated tests.
7. **Connected mode is not in release 1.** It goes on the roadmap as a separately labelled option needing all of the following:
   - a small local loopback launcher (`http://localhost`);
   - an app registration created by each customer in their own tenant (no shared multi-tenant client ID);
   - admin consent for read-only scopes;
   - tokens held in memory only;
   - tenant data rendered as hostile input.
8. **Import-based assistance instead:** a read-only PowerShell script (`tools/Get-ArMoSentinelInventory.ps1`, GET requests only) that customers run with their own Azure session. The app imports its output as labelled "imported" evidence plus suggested answers, which are applied only after the user ticks them.

## Consequences

**What users gain:**
- Double-click one file and start; it also works from a USB stick or a locked-down laptop.
- An offline guarantee enforced by the browser, not just promised.
- No installer, no admin rights, no backend or account.
- A small, auditable code base (vanilla JS, about 7,000 lines including the knowledge base and styles).

**What users give up, and how it is mitigated:**
- **Shared `file://` storage partition.**
  - Risk: another local HTML file opened in the same browser could read autosaved projects.
  - Mitigation: autosave is opt-in, with an explicit disclosure at set-up and in Settings; there is a one-click "delete all app data"; the package file is the source of truth.
- **Best-effort browser storage.** It can be cleared by the user or under disk pressure. Users are told to keep saving packages, and the app warns before closing with unsaved, non-autosaved work.
- **No silent settings file.** Preferences live in the browser; export/import covers moving between machines.
- **PDF needs one extra click** ("Save as PDF" in the print dialog). Instructions are on the report page.
- **No live tenant checks.** The inventory script and evidence attachments cover this; connected mode goes to the roadmap.

**Browser support:** current Microsoft Edge and Google Chrome on Windows (tested on version 155). Firefox and Safari are **not tested** (not installed in the build environment) and are not supported in release 1.

## Alternatives considered

| Option | Startup friction | Offline | Storage / files | PDF | Connected-mode feasibility | Security surface | Maintenance | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Single self-contained HTML (chosen)** | Lowest: one file | Yes, CSP-enforced | IndexedDB + package files | Print to PDF | None (by design) | Smallest | Low | **Chosen** |
| Folder of static files + `index.html` | Low (unzip) | Yes | Same | Same | None | Small | Low; needs classic scripts only (no ES modules on `file://`), content must still be bundled | Equivalent but more friction; no benefit |
| Minimal local launcher / server (PowerShell or Node on `localhost`) | Medium: run a script, firewall prompts, port conflicts | Yes | Same, plus possible real file I/O | Same | Possible (localhost redirect URI) | Larger: listening socket, origin attacks from other local pages | Medium | Deferred to the connected-mode roadmap |
| Desktop wrapper (Electron/Tauri/WebView2) | Medium: installer, signing, SmartScreen | Yes | Full file system | Native | Possible | Largest (native code, auto-update chain) | High | Not justified for release 1 |

## Follow-ups

- Manually verify the File System Access "Save as…" path in headed Edge and Chrome before each release (see the release checklist).
- Re-run the prototypes on each new major browser version.
- Release 2 spike: loopback launcher + customer-registered app, read-only Graph checks, with the 16 prototype checks listed in research note 04.
