# ArMo MS Defender Migration Assistant

> **Version 1.0.0.** The licence is still to be decided by the makers. Until a `LICENSE` file is added, all rights are reserved.

A guided, evidence-based companion for moving your **Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal**, from readiness to sign-off. It runs **offline**, from **one HTML file**, with **no account, no backend and no telemetry**.

Microsoft states that *"After March 31, 2027, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Microsoft Defender portal."* Sentinel itself continues. Connecting a workspace to the Defender portal keeps your log data in Log Analytics, but it changes incident handling, automation, connectors, access and several analyst workflows. The assistant helps you find out which of those changes affect you, prepare for them, make the change, validate it and keep evidence of what you did.

## What it does

- **Four stages, 109 guided steps:**
  - **Prepare:** 62 steps in 11 workstreams.
  - **Test:** optional, 11 steps.
  - **Transition:** a 17-step runbook in order, with go or no-go gates.
  - **Validate:** 19 steps, including residual risk and sign-off.
- **Two ways to work.** **Simplified** (the default) shows the plan as missions with short checklists: each check says what to do and what counts as proof, a pasted screenshot is enough, and only six questions come first. **Detailed** shows every step in full. Both keep the same records, proofs and decisions, and you can switch at any time.
- **A plan that fits your environment.** Answer 35 questions in six short sections (Detailed can skip them and show the full checklist). You move on with Next: choosing an answer never jumps ahead. Each answer is Yes, No, "I don't know yet" or Not applicable. "I don't know yet" never hides work. Every decision about what applies is explained, and a reviewer can override it with a reason.
- **As thorough as you need.** Essentials (must-do steps only), Recommended or Thorough, plus switches for backups and baselines, a test rehearsal and extra verification. Every step is tagged Must do, Recommended, Useful or Good practice, questions are asked most important first, and the optional ones can be skipped. Left-out steps are set aside with the reason, never deleted.
- **Guidance you can act on.** Each step has:
  - what you do and why it matters, the roles you need and the exact portal locations;
  - numbered steps with bullets and tips, and links to related steps;
  - read-only KQL, REST and PowerShell snippets with permissions, cost and caveats;
  - what you should see, what to record, the evidence that proves it, and what to do if it fails;
  - **Microsoft Learn sources with page and verification dates.** Where Microsoft's own pages conflict, the step says so (**Sources differ**).
- **Evidence, not checkboxes:**
  - attach screenshots, observation notes, links and files;
  - "Passed" needs evidence, otherwise the step is recorded as "Done, not verified";
  - exceptions need a named person and a rationale;
  - gate decisions are typed by people, never pre-filled.
- **A register** of decisions, risks, issues, actions and exceptions, linked to the steps they belong to.
- **Reports** for each stage and a final report. Print them or save them as PDF offline. Frozen **snapshots** carry a SHA-256 fingerprint.
- **Project packages (.zip)** with SHA-256 integrity hashes (they detect corruption, they are not signatures), for backup, resuming and hand-over. JSON and CSV exports too.
- **Import-based assistance.** A read-only PowerShell inventory script (GET requests only) that you run yourself. Run with no parameters, it finds the Sentinel workspaces you can read, and its files can suggest answers to 28 of the 35 questions (Yes when found, No only when every workspace in scope was read for it). The assistant turns its output into the workspace list, labelled "imported" evidence and suggested answers, which you confirm.

## What you'll see

- **A short introduction on first start.** About four seconds, with six promises: no internet needed, processed on this device, your data stays with you, grounded in Microsoft Learn (145 pages), built by practitioners, open for review. It closes with "Your data is yours." and the makers' words, "Built to make your migration journey easy." Focus starts on **Skip intro**, and Escape closes it too. With reduced motion, everything appears at once. Replay it from **About** or **Settings and data**. Later starts show a short splash.
- **A welcome page** with three ways in: **Start my project**, **Open a saved project** and **Try the demo**.
- **A new project in five steps:** about the project, timing (with the 31 March 2027 date restated), your workspaces, where to keep your work, and how to work (Simplified or Detailed, and how thorough; Detailed can skip the questions and show the full checklist).
- **Workspaces imported or typed in.** Run the read-only inventory script and import its files: the assistant lists the Sentinel workspaces it found, you tick the ones in scope, and the answers it can fill in are shown for you to confirm. Or type the names in, with help on where to find them.
- **Questions in focus.** While you answer the setup questions, the left pane shows only your setup progress, so nothing pulls you away by mistake. If you leave, the overview shows how many are still open and takes you back.
- **One question per screen.** Section progress across six sections, answers by click or keys 1 to 4, and Enter for the next question. After Yes or No you can move on by yourself (a setting you can turn off). Every question has "Why we ask" and "Where to find the answer". "I don't know yet" keeps the steps in your plan and can add a "find out" action to the register. The end screen shows real counts, then a short "Building your plan" sequence takes you to the overview. **Your answers** shows every answer on one page for review.
- **A guided overview.** Your next step is the headline, with **Start this step** and **Why this one?**. Below it: the route, a **Start here** checklist from setup to the final report, **Needs your attention**, and key dates.
- **The route.** One line from "Azure portal" to "Defender portal" with a stop for each of the four stages and a **You are here** marker.
- **Step pages** that read like instructions, not a database. Item codes stay out of the reading text (a small reference line sits at the bottom). Links to other steps are clickable, and inline buttons let you act right there: add a decision, risk, issue, action or exception to the register, linked to the step; add evidence; jump to the owner, due date, notes or gate form; import results or download the inventory script. **Previous step** and **Next step** cards sit at the bottom.
- **Project setup** as its own page, so guidance can link straight to the planned transition window or the workspaces in scope.
- **The demo** uses a fictional company. A banner says so, and **Exit demo** takes you back to the start page, ready for your own project.
- **The ArMoHub look** ("Noir Champagne"): near-black with one champagne accent, Instrument Serif headings, Inter Tight text and JetBrains Mono labels, and thin gold rules instead of boxes. The reports carry the same masthead and a footer with armohub.ch and the ArMoHub LinkedIn page. Dark by default, with an Ivory light theme in Settings. Reports always print on white. Short loading overlays appear while a project opens, a package is packed or the demo is prepared. Motion follows your system's reduced-motion setting, and **Reduce motion** in Settings turns it down inside the assistant.

## Quick start (Windows)

1. Download `ArMo-MS-Defender-Migration-Assistant.html` and `SHA256SUMS.txt`. Optionally download `tools/Get-ArMoSentinelInventory.ps1` too.
2. Check the file before you open it. In PowerShell, run the command below and compare the result with the line for the HTML file in `SHA256SUMS.txt` (upper or lower case does not matter):

   ```powershell
   Get-FileHash .\ArMo-MS-Defender-Migration-Assistant.html -Algorithm SHA256
   ```

3. Double-click the HTML file. It opens in your default browser. Current versions of **Microsoft Edge** and **Google Chrome** are supported.
4. Choose **Start my project**, **Open a saved project** or **Try the demo** (fictional data).

To open the demo straight away, add `?demo=1` to the file's address.

## Offline and privacy: exactly what is promised

**No network requests.**
- The file carries a Content-Security-Policy with `connect-src 'none'` and `default-src 'none'`, so the browser itself blocks every network request. The only other allowance is `font-src data:`, for the typefaces built into the file.
- The end-to-end tests record every request across the whole journey. The latest recorded run in Edge saw none ([docs/test-results.md](docs/test-results.md)).
- Links to Microsoft documentation and to the makers' LinkedIn profiles open only when you click them, and they need internet.

**Where your data is:**

| | Location | Default |
|---|---|---|
| Work in progress | The open browser tab | Always |
| Autosave | This browser profile's storage (IndexedDB) | **Off**: you choose during setup |
| Preferences | This browser's local storage | On (no project data) |
| Project packages, exports, PDFs | Files you save | When you save |

**Know the limits:**
- The assistant does not encrypt anything.
- Browser storage can be cleared. In Edge and Chrome it is shared by all local HTML files opened in the same browser profile.
- Treat project packages as confidential documents.

Details: [docs/security-and-privacy.md](docs/security-and-privacy.md).

**Connected mode** (live tenant checks) is **not** part of 1.0. Microsoft Entra sign-in cannot work from a local file, and a safe design needs a local launcher and an app registration in your own tenant. See the [architecture decision record](docs/architecture-decision-record.md).

## Saving, backup and hand-over

- **Save package** (top bar) writes one `.zip` file named `armo-dma-<project>-<date>.zip`. It holds your data, evidence files, snapshots and the audit log, plus a manifest with SHA-256 hashes. Open it later with **Open a saved project**. The assistant checks the hashes and refuses corrupted, modified or unsafe content. The hashes detect corruption and accidental changes. They are not a digital signature.
- **Autosave in this browser** is a convenience, not a backup.
- **Reports > Data exports** offers the project as JSON (without attachments) and the checklist as CSV. The **Decisions and risks** (register) and **Evidence** pages export CSV too.
- **Settings and data > Export preferences file** moves your preferences between browsers. A plain HTML page cannot read or write a settings file on disk by itself.

## Knowledge base and provenance

- The content lives in [`content/`](content/), separate from the UI. It is checked at build time and published as `dist/kb.json`.
- Knowledge base version **2026.11.06**: 145 Microsoft Learn sources (114 verified on 2026-10-19, 3 on 2026-10-20, 2 on 2026-10-26, 8 on 2026-10-29, 18 on 2026-11-04), 33 read-only snippets, and 13 steps marked "Sources differ" where Microsoft sources conflict or are unclear.
- Every step states its provenance:
  - **Microsoft documentation:** derived from current pages.
  - **Practical guidance:** the makers' good practice, *not* a Microsoft requirement.
- All guidance is written to [docs/content-style-guide.md](docs/content-style-guide.md). `scripts/validate-kb.mjs` enforces its rules (no long dashes, no bare item codes, valid links and actions, valid step shapes), and the build fails on any violation.
- Conflicts and gaps in Microsoft's documentation: [research/open-questions-and-conflicts.md](research/open-questions-and-conflicts.md).
- Full source register: [research/source-register.md](research/source-register.md). Coverage matrix: [research/coverage-matrix.md](research/coverage-matrix.md). Research notes: [research/notes/](research/notes/).

## What the build produces

`npm run build` writes these files to `dist/`:

| File | What it is |
|---|---|
| `ArMo-MS-Defender-Migration-Assistant.html` | The whole assistant in one file |
| `kb.json` | The knowledge base, for review or reuse |
| `tools/Get-ArMoSentinelInventory.ps1` | The read-only inventory script |
| `licenses/InstrumentSerif-OFL.txt`, `licenses/InterTight-OFL.txt`, `licenses/JetBrainsMono-OFL.txt` | The licences of the three embedded typefaces (SIL Open Font License 1.1) |
| `SHA256SUMS.txt` | SHA-256 checksums of the six files above |

## Disclaimer

The assistant is an independent guidance tool. It is **not Microsoft software** and is not affiliated with, sponsored or endorsed by Microsoft. It is not a certification, warranty or professional sign-off. You remain responsible for:
- verifying current Microsoft guidance;
- checking that instructions apply to your environment;
- validating results;
- obtaining approvals and making change decisions.

What it shows depends on the answers, evidence, knowledge base version and scope you provide.

**Trademarks.** Microsoft, Microsoft Sentinel, Microsoft Defender and Azure are trademarks of the Microsoft group of companies. They are used here only to describe what the assistant helps with. The assistant is independent and is not affiliated with or endorsed by Microsoft. No Microsoft logos are used.

## Known limitations

- Offline guidance and import only. The snippets and the inventory script are checked against documentation and tested against a mock, but the makers have not yet run them against a live tenant.
- Supported on current Edge and Chrome on Windows. Other browsers are not tested.
- English only. The knowledge base reflects Microsoft documentation as read on 2026-10-19 and 2026-10-20, and Microsoft updates these pages often.

## For developers

```bash
npm ci
```

```bash
npm test
```

`npm test` runs the unit tests, builds the assistant into `dist/` and runs the end-to-end suite in Edge. It uses the Edge installed on your machine, with no browser download. To run the same suite in Chrome:

```bash
npm run test:e2e:chrome
```

Layout:
- `src/core`: pure logic (model, applicability, readiness, ZIP, package, schema, report);
- `src/ui`: DOM views, with no `innerHTML`;
- `src/fonts`: the Instrument Serif, Inter Tight and JetBrains Mono font files and their licences;
- `content/`: the knowledge base;
- `tools/`: the inventory script;
- `tests/`, `prototypes/`, `docs/`, `research/`.

Internal identifiers such as `armohub.dma.project` and `armohub.dma.settings` keep their earlier names on purpose, so packages and preferences saved by the earlier internal build still open.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before you change content.

## Makers

Built by **Arno and Moise** ([ArMo](https://armohub.ch)): "Built to make your migration journey easy."

Found it useful? Say thanks to [Arno](https://www.linkedin.com/in/arnoyan) and [Moise](https://www.linkedin.com/in/m-aub/) on LinkedIn. A contact channel for security reports will be published with the public release ([SECURITY.md](SECURITY.md)).
