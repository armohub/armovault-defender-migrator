# Phase 2 prototypes: evidence for the architecture decision

These are small, throwaway probes. They are kept only as reproducible evidence for
`docs/architecture-decision-record.md`. They are not part of the product, and the
1.0.0 release ships none of them. The connected-mode spike has its own write-up in
[`p4-connected/README.md`](p4-connected/README.md).

Environment: Windows 11 Enterprise 10.0.26200, Microsoft Edge 155 and Google Chrome 155
(installed, driven headless by playwright-core 1.64), run 2026-10-19.

| Probe | Script | Result file |
|---|---|---|
| P1 file:// platform capabilities, storage persistence, shared origin, download, file input, print-to-PDF, offline | `run-p1-platform.mjs` | `p1-platform-results.json` |
| P2 File System Access API on file:// (Playwright-intercepted picker) | `run-p2-fsaccess.mjs` | `p2-fsaccess-results.json` |
| P3 single self-contained HTML + strict meta CSP blocks all network access | `run-p3-csp.mjs` | `p3-csp-results.json` |

Run: `node prototypes/run-p1-platform.mjs` (requires Edge and Chrome installed and `npm install`).

## Observed results (both Edge 155 and Chrome 155 unless stated)

P1: opened via `file://`, network disabled:
- `location.protocol` = `file:`, `self.origin` = `"null"`, `isSecureContext` = **true**.
- Classic `<script src>` loads. **ES module scripts are blocked** (CORS: "Cross origin requests are only supported for protocol schemes … http, https …").
- **`fetch()` and XHR of a sibling `data.json` are blocked.** Content must therefore be bundled into the script, not loaded at runtime.
- `localStorage` works. **IndexedDB works, including storing/reading a 3 MB `Blob`.**
- **Data written by one local file is readable by any other local HTML file** opened in the same browser profile (a file in a sub-folder and a copied/moved file both read the same localStorage and IndexedDB values). All `file://` pages share one storage partition.
- Data persists across a full browser restart with the same profile.
- `navigator.storage.persist()` returned `false` (best-effort storage; browser may evict under storage pressure). Quota reported ≈10 GB.
- `showOpenFilePicker` / `showSaveFilePicker` / `showDirectoryPicker` exist.
- `CompressionStream('deflate-raw')` + `DecompressionStream` round-trip works; `crypto.subtle` SHA-256 and `crypto.randomUUID` available.
- `<input type=file>` reading works; `<a download>` of a Blob produces the expected file.
- Print engine PDF (`page.pdf`, same engine as Ctrl+P → Save as PDF) produced a valid 2-page A4 PDF offline.
- Zero http(s) requests were observed (only browser-internal `edge://` UI resources for the downloads hub).

P2: File System Access API:
- The picker could not be automated: Playwright intercepts it and aborts with `AbortError`. An attempt to drive the native Windows dialog with UI Automation was abandoned as unreliable (and unsafe to run on a user desktop).
- **Conclusion:** the API is present, but persistent file handles and permission re-prompts could not be verified automatically. It is used only as an optional "Save as…" enhancement with a tested download fallback; nothing in the core depends on it. Manual verification steps are in `docs/test-results.md`.

P3: single HTML file with meta CSP `default-src 'none'; script-src 'sha256-…'; connect-src 'none'; img-src blob: data: …` with the network deliberately **enabled**:
- Hashed inline script runs on `file://`.
- `fetch`, XHR, `sendBeacon` and a remote `<img>` were all blocked by CSP; Playwright reports the requests as failed with reason `csp` and no response was received.
- `blob:` images render (needed for evidence thumbnails).
- Dynamically injected inline `<script>` and `eval` are blocked (defence-in-depth against injection).
- Print-to-PDF still works.
- Result JSON files in this folder have local file paths redacted to `<repo>`.
