# ArMoHub Defender Migration Assistant

> **Status: release candidate 0.9.0-rc.1 — private.** Public release is gated on the owners' IP, licence and sanitisation approvals ([docs/release-checklist.md](docs/release-checklist.md)). There is no licence file yet, so all rights are reserved until a licence is chosen.

A guided, evidence-based companion for moving a SOC's **Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal**, from readiness to post-transition sign-off. It runs **offline**, from **one HTML file**, with **no account, backend or telemetry**.

Microsoft states that *"After March 31, 2027, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Microsoft Defender portal."* Sentinel itself continues. Connecting a workspace to the Defender portal keeps log data in Log Analytics, but changes incident handling, automation, connectors, access and several analyst workflows. This tool helps you find out which of those changes affect you, prepare, execute, validate, and keep evidence of what you did.

## What it does

- **Four stages:**
  - **Prepare** — 62 guided items in 11 workstreams;
  - **Test** — optional, 11 items;
  - **Transition** — a 17-step sequenced runbook with go/no-go gates;
  - **Validate** — 19 items, including residual risk and sign-off.
- **Tailored or full checklist.** 35 questions with Yes / No / I don't know / Not applicable. "I don't know" never hides work. Every decision about what applies is explained, and reviewers can override it with a reason.
- **Every item is genuinely guided:**
  - objective, why it matters, roles, exact portal locations and numbered steps;
  - read-only KQL, REST and PowerShell snippets with permissions, cost and caveats;
  - expected results, what to record, evidence, remediation and rollback;
  - **Microsoft Learn sources with page and verification dates.**
  - Where Microsoft's own pages conflict, the item says so (**Needs review**).
- **Evidence and honesty:**
  - screenshots, observation notes, links and files;
  - "Passed" requires evidence, otherwise it is recorded as "Done — not verified";
  - exceptions need a named person and a rationale;
  - gate decisions are typed by people, never pre-filled.
- **Reports** for each stage and a final report: printable to PDF offline, with frozen **snapshots** fingerprinted by SHA-256.
- **Project packages (.zip)** with SHA-256 integrity hashes (corruption detection, not signatures), for backup, resuming and hand-over; JSON and CSV exports.
- **Import-based assistance.** A read-only PowerShell inventory script (GET requests only) that you run yourself. Its output becomes labelled "imported" evidence and suggested answers, which you confirm.

## Quick start (Windows)

1. Download `ArMoHub-Defender-Migration-Assistant.html` (and optionally `tools/Get-ArMoSentinelInventory.ps1`). Check the SHA-256 against `SHA256SUMS.txt`.
2. Double-click the HTML file. It opens in your default browser. **Microsoft Edge or Google Chrome** (current versions) are supported.
3. Choose **Start a new project**, **Open a project package**, or **Explore the demo** (fictional data).

The demo can also be opened directly with `ArMoHub-Defender-Migration-Assistant.html?demo=1`.

## Offline and privacy — exactly what is promised

**No network requests.**
- The file carries a Content-Security-Policy with `connect-src 'none'` and `default-src 'none'`, so the browser itself blocks every network request.
- The end-to-end tests record **zero** requests across the whole journey in Edge and Chrome.
- Links to Microsoft documentation open only when you click them, and need internet.

**Where your data is:**

| | Location | Default |
|---|---|---|
| Work in progress | The open browser tab | — |
| Autosave | This browser profile's storage (IndexedDB) | **Off** — you choose at set-up |
| Preferences | This browser's local storage | On (no project data) |
| Project packages, exports, PDFs | Files you save | When you save |

**Know the limits:**
- Nothing is encrypted by the app.
- Browser storage can be cleared, and in Edge and Chrome it is shared by all local HTML files opened in the same profile.
- Treat project packages as confidential documents.

Details: [docs/security-and-privacy.md](docs/security-and-privacy.md).

**Connected mode** (live tenant checks) is **not** part of this release. Microsoft Entra sign-in cannot work from a local file, and a safe design needs a local launcher and an app registration in your own tenant. See the [ADR](docs/architecture-decision-record.md).

## Saving, backup and hand-over

- **Save project package** (top bar) writes one `.zip` file: data, evidence files, snapshots and the audit log, plus a manifest with SHA-256 hashes. Open it later with **Open a project package**. The app checks the SHA-256 hashes and refuses corrupted, modified or unsafe content. The hashes detect corruption and accidental changes; they are not a digital signature.
- **Autosave in this browser** is a convenience, not a backup.
- **Reports & history → Data exports** offers project JSON (no attachments) and checklist CSV. The Register and Evidence pages export CSV too.
- **Settings → Export preferences file** moves preferences between browsers. A plain HTML page cannot silently read or write a settings file on disk.

## Knowledge base and provenance

- The content lives in [`content/`](content/), separate from the UI. It is validated at build time and published as `dist/kb.json`.
- Every item cites Microsoft Learn pages (101 sources, verified 2026-10-19) and states its provenance:
  - **Microsoft documentation** — derived from current pages;
  - **Practical guidance** — the makers' good practice, *not* a Microsoft requirement.
- Conflicts and gaps in Microsoft's documentation: [research/open-questions-and-conflicts.md](research/open-questions-and-conflicts.md).
- Full source register: [research/source-register.md](research/source-register.md). Coverage matrix: [research/coverage-matrix.md](research/coverage-matrix.md). Research notes: [research/notes/](research/notes/).

## Disclaimer

This is an independent guidance tool. It is **not Microsoft software** and is not affiliated with, sponsored or endorsed by Microsoft. It is not a certification, warranty or professional sign-off. You remain responsible for:
- verifying current Microsoft guidance;
- checking that instructions apply to your environment;
- validating results;
- obtaining approvals and making change decisions.

Output depends on the answers, evidence, knowledge-base version and scope provided.

## Known limitations

- Offline guided and import mode only. Snippets and the inventory script are documented and mock-tested, but not yet validated against a live tenant by the authors.
- Tested on Edge 155 and Chrome 155 on Windows 11; other browsers are not supported in this release.
- English only. The knowledge base reflects Microsoft documentation as of 2026-10-19 (Microsoft updates these pages often).

## For developers

```bash
npm ci
```

```bash
npm test
```

`npm test` runs the unit tests, builds the app into `dist/`, and runs the Edge end-to-end suite (the installed Edge is used; no browser download).

```bash
npm run test:e2e:chrome
```

Layout:
- `src/core` — pure logic: model, applicability, readiness, ZIP, package, schema, report;
- `src/ui` — DOM views; no `innerHTML`;
- `content/` — the knowledge base;
- `tools/` — the inventory script;
- `tests/`, `prototypes/`, `docs/`, `research/`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing content.

## Makers

Built by **Arno & Moise** ([ArMoHub](https://armohub.ch)). Profiles and contact details will be added with the public release.
