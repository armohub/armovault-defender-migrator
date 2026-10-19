# Security and privacy

This page states exactly what the app does with data and network access, what it protects against, and what it does not. It avoids absolute claims the architecture cannot back up.

## Network behaviour

**Claim:** the downloaded app makes **no network requests** while you use it.

**How it is enforced.** A meta Content-Security-Policy is built into the file:

```
default-src 'none'; script-src 'sha256-<build hash>'; style-src 'sha256-<build hash>'; img-src blob: data:;
font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none';
manifest-src 'none'; base-uri 'none'; form-action 'none'
```

- The browser blocks fetch, XHR, WebSocket, beacons, remote images, fonts, frames and workers.
- Only the exact script and style in the file can run. Injected scripts and `eval` are blocked.

**How it is verified:**
- Prototype P3 showed blocked requests with the network enabled.
- The static test checks the CSP in each build.
- The end-to-end suite records every http(s) and ws request across the full user journey in Edge and Chrome. The current result is **zero** (see [test-results.md](test-results.md)).
- The source has no network APIs (static test).

**What is not covered:**
- **Links.** Documentation links (Microsoft Learn) and evidence links open a new tab **only when you click them**. That navigation needs internet and is visible to you.
- **The hosted demo.** Loading the demo from a website is a network transfer of the file itself. Once loaded, the same CSP applies.
- **The browser.** Its own background traffic (updates, sync, SmartScreen) is outside the app's control.

There is no telemetry, analytics, auto-update, account or backend.

## Where data is stored

| Data | Location | Default | Encrypted by the app? |
|---|---|---|---|
| Project in progress | Memory of the open tab | Always | No |
| Autosaved project + attachments | IndexedDB of this browser profile on this computer | **Off** (opt-in) | No |
| Preferences (theme, saving choice, operator name) | localStorage of this browser profile | On | No |
| Project package (.zip) / JSON / CSV / PDF | Files you save | Only when you save | **No** |

Important facts, measured on Edge and Chrome 155 (see the ADR):
- **Shared storage across local files.** All HTML files opened from disk (`file://`) share one storage area. Another local HTML file opened in the same browser profile could read autosaved data. This is disclosed during set-up and in Settings. Only open local HTML files you trust, and prefer package files for sensitive projects.
- **Browser storage is best effort.** Clearing browsing data deletes it. The browser may also evict it under disk pressure; `navigator.storage.persist()` was not granted in testing. Keep saving packages.
- **Not encrypted.** The app does not encrypt projects or packages. Use your organisation's encrypted storage and sharing controls.
- **Deleting data.** Settings > "Delete all app data in this browser" removes all projects, attachments and preferences the app stored in this browser profile. Packages you saved as files are not affected.

## Sensitive data guidance (shown in the app)

- Never enter credentials, client secrets, tokens, connection strings or keys. The app never asks for them.
- Use aliases for workspaces and environments. Tenant or subscription IDs are not required.
- Crop or redact screenshots. A redaction confirmation is recorded per screenshot.
- Prefer short summaries over raw log exports.
- Packages are not encrypted. Handle them under your data policy.
- The inventory script writes names and flags only, never rule queries or incident data. Review its output before importing or sharing.

## Threat model and controls

| Threat | Control | Tested |
|---|---|---|
| Script injection through imported projects, evidence titles or notes | All content is inserted with `textContent` through a DOM helper; there is no `innerHTML` (static test). The CSP blocks inline and injected scripts and `eval`. | Unit (static), E2E (injection strings render as text, `window.__xss` stays undefined) |
| Malicious links (`javascript:`) | `safeHref` allows only `#`, `blob:` and `http(s)`; evidence links must be `http(s)`; import drops other schemes. | Unit |
| Prototype pollution through JSON | Projects are rebuilt from known keys; `__proto__`, `constructor` and `prototype` keys are refused; map keys must match `^[A-Za-z0-9_.:-]{1,80}$`. | Unit |
| Zip bombs and malformed archives | Entry count, size and ratio limits; decompression is capped at the declared size; CRC is verified; truncation and unsafe paths are detected; encrypted entries are refused. | Unit, E2E |
| Corrupted or modified packages | `project.json` must match the manifest SHA-256; each evidence file must match its recorded hash; mismatches are rejected or reported; a missing hash is reported. **Limit:** hashes are not signatures — someone who deliberately edits a package can recompute them. Keep packages in access-controlled storage. | Unit, E2E |
| Disguised file types (for example SVG named .png) | Type is sniffed from content; only PNG, JPEG, GIF, WebP, PDF and plain text/CSV/JSON are accepted. SVG, HTML and XML are refused. | Unit, E2E |
| Oversized inputs | 15 MB per attachment; 600 MB per package; 40 MB `project.json`; 5 MB inventory file; string caps on every field. | E2E (16 MB rejected) |
| CSV formula injection in exported spreadsheets | Cells starting with `= + - @ Tab CR` are prefixed with `'`; RFC 4180 quoting. | Unit |
| False assurance (a report says "verified" or "approved" when it is not) | "Passed" requires evidence. Import downgrades passes without evidence and "accepted" exceptions without a named person. Gates are never pre-filled. Conclusions follow published criteria. | Unit, E2E |
| Accidental data loss | Opt-in autosave; unsaved-work warning on close; confirmation for deletions; typed confirmation for "delete all". | E2E (beforeunload) |
| Destructive Azure or Defender actions | The app executes nothing. Snippets are read-only. Steps that change configuration are flagged "Changes configuration — follow your change process". | Content check (build) |

## Connected mode (not in release 1)

Live tenant access needs Microsoft Entra sign-in. That cannot work from a `file://` page: redirect URIs must be https or localhost, and MSAL.js needs a same-origin redirect bridge. A safe future design would need:
- a local loopback launcher;
- an app registration in **your** tenant (no shared client ID);
- admin consent for read-only scopes;
- tokens kept in memory only;
- tenant data treated as hostile input.

It will be a separately labelled mode that is never needed for the offline workflow. See [architecture-decision-record.md](architecture-decision-record.md).

## Reporting a vulnerability

See [SECURITY.md](../SECURITY.md). The contact channel is a placeholder until the makers publish one.
