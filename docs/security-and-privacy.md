# Security and privacy

This page says exactly what the ArMo MS Defender Migration Assistant does with your data and with network access, what it protects against, and what it does not. It avoids absolute claims the design cannot back up.

## Network behaviour

**Claim:** the downloaded assistant makes **no network requests** while you use it.

**How it is enforced.** A meta Content-Security-Policy is built into the file:

```
default-src 'none'; script-src 'sha256-<build hash>'; style-src 'sha256-<build hash>'; img-src blob: data:;
font-src data:; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none';
manifest-src 'none'; base-uri 'none'; form-action 'none'
```

- The browser blocks fetch, XHR, WebSocket, beacons, remote images, remote fonts, frames and workers.
- `font-src data:` allows only fonts embedded in the file itself. The assistant embeds three typefaces, Instrument Serif, Inter Tight and JetBrains Mono, as `data:` URLs. No font is downloaded.
- Only the exact script and style in the file can run. Injected scripts and `eval` are blocked.

**How it is verified:**
- Prototype P3 showed blocked requests with the network enabled.
- A static test checks the CSP in each build: `default-src 'none'`, `connect-src 'none'`, no `unsafe-*` and no hosts.
- A unit test checks that the embedded typefaces are the only font sources in the styles.
- The end-to-end suite records every http(s) and ws request across the full journey. The latest recorded Edge run saw **none** (see [test-results.md](test-results.md)).
- The source has no network APIs (static test).

**What is not covered:**
- **Links.** Documentation links (Microsoft Learn), evidence links and the links to the makers' LinkedIn profiles open a new tab **only when you click them**. That navigation needs internet and is visible to you.
- **Getting the file.** Downloading the file, or loading a hosted copy of the demo from a website, is a network transfer of the file itself. Once it has loaded, the same CSP applies. Check a downloaded file against the published `SHA256SUMS.txt` (see the README).
- **The browser.** Its own background traffic (updates, sync, SmartScreen) is outside the assistant's control.

There is no telemetry, analytics, automatic update, account or backend.

## Where data is stored

| Data | Location | Default | Encrypted by the assistant? |
|---|---|---|---|
| Project in progress | Memory of the open tab | Always | No |
| Autosaved project and attachments | IndexedDB of this browser profile on this computer | **Off** (opt-in) | No |
| Preferences (theme, density, saving choice, your name and role, motion, whether the introduction was seen) | localStorage of this browser profile | On | No |
| Project package (.zip), JSON, CSV, PDF | Files you save | Only when you save | **No** |

Important facts, measured on Edge and Chrome 155 (see the ADR):
- **Shared storage across local files.** All HTML files opened from disk (`file://`) share one storage area. Another local HTML file opened in the same browser profile could read autosaved data. The assistant says so during setup and in Settings. Only open local HTML files you trust, and prefer package files for sensitive projects.
- **Browser storage is best effort.** Clearing browsing data deletes it. The browser may also remove it when disk space runs low; `navigator.storage.persist()` was not granted in testing. Keep saving packages.
- **Not encrypted.** The assistant does not encrypt projects or packages. Use your organisation's encrypted storage and sharing controls.
- **Deleting data.** Settings and data > "Delete all data in this browser" removes every project, attachment and preference the assistant stored in this browser profile. Packages you saved as files are not affected.

## Sensitive data guidance (shown in the assistant)

- Never enter credentials, client secrets, tokens, connection strings or keys. The assistant never asks for them.
- Use aliases for workspaces and environments. Tenant or subscription IDs are not needed. If you import workspaces.json with the inventory files, the assistant fills in each workspace's subscription ID and resource group name in your project. They are not secrets, but they identify your environment, so keep the project and its reports under your data policy. The inventory files themselves never contain them.
- Crop or redact screenshots. A redaction confirmation is recorded for each screenshot.
- Prefer short summaries over raw log exports.
- Packages are not encrypted. Handle them under your data policy.
- The inventory script writes names, flags and counts only, never rule queries, Logic App definitions, incident data, or principal, tenant, subscription or resource group IDs. The tenant appears only as a short fingerprint, so tenants can be told apart. Review its output before you import or share it.

## Threat model and controls

| Threat | Control | Tested |
|---|---|---|
| Script injection through imported projects, evidence titles or notes | All content is inserted with `textContent` through a DOM helper; there is no `innerHTML` (static test). Guidance markup (links and buttons) is turned into DOM nodes, never parsed as HTML. The CSP blocks inline and injected scripts and `eval`. | Unit (static), E2E (injection strings render as text, `window.__xss` stays undefined) |
| Malicious links (`javascript:`) | `safeHref` allows only `#`, `blob:` and `http(s)`. Evidence links must be `http(s)`. Import drops other schemes. | Unit |
| Prototype pollution through JSON | Projects are rebuilt from known keys. `__proto__`, `constructor` and `prototype` keys are refused, and map keys must match `^[A-Za-z0-9_.:-]{1,80}$`. | Unit |
| Zip bombs and malformed archives | Limits on entry count, size and compression ratio. Decompression is capped at the declared size, the CRC is verified, truncation and unsafe paths are detected, and encrypted entries are refused. | Unit, E2E |
| Corrupted or modified packages | `project.json` must match the manifest SHA-256, and each evidence file must match its recorded hash. Mismatches are rejected or reported, and a missing hash is reported. **Limit:** hashes are not signatures. Someone who edits a package on purpose can recompute them, so keep packages in access-controlled storage. | Unit, E2E |
| Disguised file types (for example an SVG named .png) | The type is sniffed from content. Only PNG, JPEG, GIF, WebP, PDF and plain text, CSV or JSON are accepted. SVG, HTML and XML are refused. | Unit, E2E |
| Oversized inputs | 15 MB per attachment, 600 MB per package, 40 MB for `project.json`, 5 MB for an inventory file, and length caps on every field. | E2E (a 16 MB file is rejected) |
| CSV formula injection in exported spreadsheets | Cells starting with `= + - @`, Tab or CR are prefixed with `'`, with RFC 4180 quoting. | Unit |
| False assurance (a report says "verified" or "approved" when it is not) | "Passed" requires evidence. Import downgrades passes without evidence and "accepted" exceptions without a named person. Gates are never pre-filled. Conclusions follow published criteria. | Unit, E2E |
| Accidental data loss | Opt-in autosave, an unsaved-work warning on close, confirmation for deletions, and typed confirmation for "Delete all data in this browser". | E2E (beforeunload) |
| Destructive Azure or Defender actions | The assistant runs nothing. Snippets are read-only. Steps that change configuration are flagged "Changes configuration: follow your change process". | Content check (build) |

## Connected mode (not in 1.0)

Live tenant access needs Microsoft Entra sign-in. That cannot work from a `file://` page: redirect URIs must be https or localhost, and MSAL.js needs a same-origin redirect bridge. A safe future design would need:
- a local loopback launcher;
- an app registration in **your** tenant (no shared client ID);
- admin consent for read-only scopes;
- tokens kept in memory only;
- tenant data treated as hostile input.

It would be a separately labelled mode that the offline workflow never needs. A spike explored this ([prototypes/p4-connected](../prototypes/p4-connected/README.md)); it is not shipped. See [architecture-decision-record.md](architecture-decision-record.md).

## Reporting a vulnerability

See [SECURITY.md](../SECURITY.md). The contact channel stays a placeholder until the makers publish one.
