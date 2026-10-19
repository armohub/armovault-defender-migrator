# Changelog

## 1.0.0 (2026-10-19)

The first public version, released as one final version. There are no release candidates or pilot stages. It replaces the internal release candidate 0.9.0-rc.1, which was never published.

### Name and build

- New name: **ArMo MS Defender Migration Assistant** (brand ArMo). It was called "ArMoHub Defender Migration Assistant".
- Knowledge base version `2026.10.19`.
- The build writes `dist/ArMo-MS-Defender-Migration-Assistant.html`, `dist/kb.json`, `dist/tools/Get-ArMoSentinelInventory.ps1`, `dist/licenses/MonaSans-OFL.txt` and `dist/SHA256SUMS.txt`.
- Project packages are named `armo-dma-<project>-<date>.zip`. Exports and the preferences file use the same `armo-dma` prefix.
- Internal schema identifiers (`armohub.dma.project`, `armohub.dma.settings`) are unchanged on purpose, for compatibility.

### New look

- A graphite "console" design. Dark by default, with a light theme in Settings. Reports always print on white.
- The route: one line from "Azure portal" to "Defender portal", with a stop for each of the four stages and a "You are here" marker.
- The Mona Sans typeface (SIL Open Font License 1.1, by The Mona Sans Project Authors), embedded as `data:` URLs. The Content-Security-Policy now allows `font-src data:` and still blocks every network request (`default-src 'none'`, `connect-src 'none'`). The licence text ships in `dist/licenses/`.
- Loading overlays while a project opens, a package is packed or the demo is prepared.
- Motion respects the system's reduced-motion setting, and a new **Reduce motion** setting turns it down inside the assistant.

### A guided start

- A first-run introduction of about four seconds. It shows six promises (no internet needed, processed on this device, your data stays with you, grounded in Microsoft Learn with 101 pages, built by practitioners, open for review) and closes with "Your data is yours." and the makers' quote, "Built to make your migration journey easy." It can be skipped, focus starts on **Skip intro**, and reduced motion shows everything at once. Replay it from About or Settings. Later starts show a short splash.
- A welcome page, then a four-step new-project wizard.
- The questionnaire now shows one question per screen:
  - six sections with section progress;
  - answers by click or keys 1 to 4, and Enter for the next question;
  - an optional move to the next question after Yes or No (a setting);
  - "Why we ask" and "Where to find the answer" on every question;
  - "I don't know yet" keeps steps in the plan and can add a "find out" action to the register;
  - an end screen with real counts, then a short "Building your plan" sequence.
- A **Your answers** page shows every answer on one page for review.

### Guided overview and step pages

- The overview leads with your next step, with **Start this step** and **Why this one?**. It also shows the route, a **Start here** checklist from setup to the final report, **Needs your attention** and key dates.
- Step pages:
  - item codes are hidden from the reading text (a small reference line stays at the bottom);
  - steps are structured, with bullets and tips;
  - references to other steps and pages are links;
  - inline buttons act on the step: add a decision, risk, issue, action or exception to the register, linked to the step; add evidence; jump to the owner, due date, notes or gate form; import inventory results or download the inventory script;
  - **Previous step** and **Next step** cards at the bottom.
- Project setup is now a page (`#/project`). Links can open it at the planned transition window or the workspaces section.

### Demo and thanks

- The demo shows a banner and an **Exit demo** button. Leaving it returns you to the start page, ready for your own project.
- A thanks note with links to the makers' LinkedIn profiles appears on the welcome page, on About, and when the final report is complete.

### Guidance text

- All guidance was rewritten in a human voice under [docs/content-style-guide.md](docs/content-style-guide.md).
- `scripts/validate-kb.mjs` enforces the rules: no long dashes, no bare item codes, valid links and actions, and valid step shapes. The build fails on any violation.
- The knowledge base has 109 steps, 35 questions, 101 Microsoft Learn sources verified on 2026-10-19, 32 read-only snippets, and 13 steps marked "Needs review".

### Tests

- New unit test file `tests/unit/copy-and-ux.test.mjs`. It checks that:
  - there are no long dashes in the app source, styles or knowledge base;
  - the knowledge base passes every writing rule, and the validator catches the mistakes it should;
  - guidance that sends you somewhere is a link or an action;
  - new settings have safe defaults and are validated;
  - the brand name and version match the 1.0 release;
  - the embedded typeface ships with its licence and is the only font source.
- The end-to-end suite now has 31 steps. New steps cover the introduction, leaving the demo, the questionnaire's keys and auto-advance, building the plan, links and actions on step pages, hidden item codes, replaying the introduction and reduced motion. See [docs/test-results.md](docs/test-results.md) for the recorded runs.

### Unchanged

- Offline only, enforced by the browser. No account, backend or telemetry.
- No connected mode. The assistant never contacts your tenant.
- Evidence rules, register, gates, reports, snapshots, project packages and the read-only inventory script work as before.

## 0.9.0-rc.1 (2026-10-19, internal release candidate, never published)

- First complete guided workflow: Prepare (62 items), optional Test (11), the Transition runbook (17) and Validate (19), with a 35-question tailoring questionnaire and three-valued applicability.
- Knowledge base `2026.10.19-rc1`: 101 Microsoft Learn sources verified on 2026-10-19 and 32 read-only snippets.
- Evidence (screenshots, notes, links, files) with type sniffing and limits; register; gate decisions; audit log.
- Reports (preparation, test, execution, validation, final) with print to PDF and SHA-256 snapshots.
- Project packages (.zip) with an integrity manifest; JSON and CSV exports; preferences export and import.
- Opt-in browser autosave (IndexedDB), an unsaved-work warning and "delete all".
- Read-only inventory script and import-based assistance.
- Single-file build with a strict CSP (no network) and a synthetic demo project.
- An independent code and security review. Its 22 findings were fixed and covered by regression tests.
