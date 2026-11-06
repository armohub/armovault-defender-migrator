# Product scope and user flows

## Purpose

Help SOC teams, security architects, project leads and consultants move their Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal, before Microsoft ends Azure portal support (after 31 March 2027). The ArMo MS Defender Migration Assistant guides people from readiness to post-transition sign-off, and keeps an evidence-based record of what was done.

**Terminology.**
- Microsoft Sentinel is *not* being discontinued. Its Azure portal experience is.
- "Connecting" (onboarding) a workspace to the Defender portal keeps log data in Log Analytics, but changes several behaviours. The assistant helps teams find and handle those changes.
- Microsoft Defender XDR is optional for Sentinel in the Defender portal.

## Scope of version 1.0.0

Version 1.0.0 is the first public version, released as one final version (no release candidates or pilot stages).

**In scope**
- A first-run introduction (about four seconds, skippable), a short splash on later starts, a welcome page and a four-step new-project wizard.
- The choice between Simplified and Detailed. Both tailor the plan with questions; Detailed can skip them and show the full checklist.
- How thorough the plan is: Essentials, Recommended or Thorough, with switches for backups and baselines, a test rehearsal and extra verification. Questions are asked most important first; the optional ones can be skipped.
- Four stages with 109 guided steps:
  - Prepare: 62
  - Test (optional): 11
  - Transition runbook: 17
  - Validate: 19
- For each step:
  - what you do, why it matters, whether it applies (with reasons), roles, location and structured steps with bullets and tips;
  - read-only snippets with permissions, cost and caveats;
  - expected results and how to read them, what to record, and the evidence that proves it;
  - what to do if it fails, and rollback;
  - sources with dates, provenance, confidence, and the uncertainty where sources conflict;
  - links to related steps and pages, and inline buttons that act on the step.
- Statuses that keep "done" separate from "verified":
  - "Passed" requires evidence;
  - failed, blocked and not applicable require a rationale;
  - removing the last evidence downgrades a pass.
- Applicability overrides with a reason, an audit log, and history per step.
- Evidence: screenshots, observation notes, links and files. Types are checked from file content, size limits apply, a redaction prompt is shown, and imported evidence is labelled.
- The register (shown as **Decisions and risks**): actions, issues, risks, exceptions and decisions. An exception counts as accepted only with a named person, role and rationale.
- Gate decisions with a typed decision maker (never pre-filled).
- Readiness conclusions computed from explicit criteria, with "why" lists.
- Reports: preparation, test, execution, validation and final. Printable to PDF offline, always on white. Snapshots carry SHA-256 fingerprints and an integrity check.
- Data:
  - project package (`armo-dma-<project>-<date>.zip`, with manifest, hashes and evidence);
  - JSON data export;
  - CSV exports of the checklist, register and evidence index;
  - preferences file export and import.
- Persistence: opt-in browser autosave (IndexedDB), manual packages, an unsaved-work warning, and "Delete all data in this browser".
- Import-based assistance: a read-only inventory script whose output becomes imported evidence and suggested answers that the user confirms.
- Knowledge views: feature changes, portal map, key dates, terminology, all steps, coverage and sources.
- A synthetic demo project with a banner and an **Exit demo** button.
- The ArMoHub "Noir Champagne" design (near-black, one champagne accent, gold rules), dark by default with an Ivory light theme, the embedded Instrument Serif, Inter Tight and JetBrains Mono typefaces, and motion that respects reduced motion (plus an in-app **Reduce motion** setting).
- A thanks note with links to the makers' LinkedIn profiles on the welcome page, on About, and when the final report is complete.

**Out of scope for 1.0** (roadmap)
- Connected mode: live read-only checks through Microsoft Graph or ARM. See the [ADR](architecture-decision-record.md) for why. A separate spike ([prototypes/p4-connected](../prototypes/p4-connected/README.md)) explores it, and it is not shipped.
- Localisation: English only. Content and UI strings are kept apart, so translation is possible later.
- macOS and Linux packaging, Firefox and Safari support.
- Encryption of local data or packages (not claimed).
- Several people working on one project at once, or merging projects.
- SIEM migration from other products to Sentinel, and Sentinel greenfield deployment.

## Primary flows

```
First start   -> Introduction (about 4 s, skippable) -> Welcome
Later starts  -> Short splash -> Welcome, or the open project's overview

Welcome -> Start my project -> New project (5 steps) -> Tailored? -> yes -> Questions, one per screen
        |                     about the project,                          -> End screen with counts
        |                     timing and scope,                           -> "Building your plan" -> Overview
        |                     where to keep your work,     no -> Overview
        |                     how to start
        |-> Open a saved project (.zip or .json) -> integrity check -> Overview
        |-> Try the demo (fictional) -> Overview with a demo banner -> Exit demo -> Welcome

Overview -> "Start this step" -> Step page -> "Next step" card -> Step page ...
Overview -> Stage page (filters: in scope / needs attention / not applicable / all) -> Step page
Step page: guidance + your record (status, reason, owner, due date, notes, evidence,
           follow-ups for the register, gate form on gate steps, history)
Sidebar: Overview, the four stages, Decisions and risks, Evidence, Reports, Project setup,
         Your answers, Knowledge and sources, Settings and data, About
```

### Flow details

1. **First start.**
   - The introduction plays once, for about four seconds. It shows six promises: no internet needed, processed on this device, your data stays with you, grounded in Microsoft Learn (145 pages), built by practitioners, and open for review. It ends with "Your data is yours." and the makers' quote, "Built to make your migration journey easy."
   - Focus starts on **Skip intro**. Escape also closes it. With reduced motion, everything is shown at once.
   - You can replay it from **About** or **Settings and data**. Later starts show a short splash instead.
2. **Welcome and new project.**
   - The welcome page offers **Start my project**, **Open a saved project** and **Try the demo**, explains how it works and what happens to your data, and shows the thanks note.
   - The wizard has five steps: about the project, timing (with the 31 March 2027 date restated), your workspaces (import the inventory script results and tick the ones in scope, or type them in), where to keep your work, and how to start.
   - A project label and your name are required. No secrets are asked for, and workspaces use aliases only.
   - Saving: autosave is **off by default**, and the "Autosave in this browser" option explains its limits.
   - The responsibility statement must be acknowledged before the project is created.
3. **Tailoring.**
   - One question per screen, in six sections, with progress for each section.
   - Answer by clicking or with keys 1 to 4. Enter goes to the next question. Arrow keys move between answers without choosing one.
   - After Yes or No, the assistant can move on by itself. This is a setting ("Move on after Yes or No") that you can turn off.
   - Every question shows "Why we ask" and "Where to find the answer".
   - Each answer is Yes, No, "I don't know yet" or Not applicable. "I don't know yet" keeps the related steps in scope as **applicability uncertain**, and it can add a "find out" action to the register.
   - The end screen shows real counts: steps that apply, steps to look into, and steps set aside. "Build my plan" plays a short "Building your plan" sequence, then opens the overview.
   - **Your answers** shows every answer on one page, to review or change.
   - Steps that do not apply are greyed out and listed under the "Not applicable" filter, with the reason taken from the answer. A reviewer can reconsider them, with a reason.
   - Changing an answer that brings back set-aside steps, or affects steps with records, shows a dialog listing the effects. Records are kept. If earlier gate decisions or snapshots exist, the dialog warns that conclusions may be out of date.
4. **Overview.**
   - Your next step is the headline, with **Start this step** and **Why this one?** (the reasons it comes next).
   - The route shows the four stages from "Azure portal" to "Defender portal", with a **You are here** marker.
   - **Start here** lists the path from setup to the final report and marks what to do now.
   - **Needs your attention** lists failed or blocked critical and high steps, steps needing review, and open critical or high register items. **Good to know** shows key dates and the saving state.
5. **Step pages.**
   - Item codes stay out of the reading text. A small reference line at the bottom names the step's code, version and verification date.
   - References to other steps and pages are links. Inline buttons add a decision, risk, issue, action or exception to the register (linked to the step), add evidence, move focus to the owner, due date, notes or gate form, import inventory results or download the inventory script.
   - **Previous step** and **Next step** cards lead through the stage and on to the next one.
6. **Project setup.** A page of its own (`#/project`). Links in the guidance open it at the planned transition window or the workspaces section.
7. **Prepare.**
   - Work through the workstreams, attach evidence, record failures with a rationale, and record exceptions in the register.
   - Optionally import the inventory script output.
   - Review the computed conclusion: Not ready, Unable to determine, Ready with exceptions, or Ready to proceed.
   - Record the readiness gate decision (the last step of Prepare), then save a readiness report snapshot.
8. **Test (optional).**
   - Say whether a test environment is available. If it is not, record a reason: the report states it and lists the compensating controls.
   - If it is, scope the tests from the list of testable Prepare steps, then run them.
9. **Transition.** A runbook in order, in phases (before, during and after the change).
   - Dependency chips show Prepare steps that failed or are still open.
   - Steps that change configuration are flagged.
   - The go or no-go gate (the first step) and the outcome gate (the last step) need typed decision makers.
10. **Validate.** Compare against the Prepare baselines and acceptance criteria. Document known limitations, with lasting workarounds that do not depend on the Azure portal. Then record the final sign-off, save a final report snapshot and save a package for retention. When the final report is complete, it shows a thanks note.
11. **Demo.** The demo opens with fictional data and a banner. **Exit demo** asks once, then returns to the start page, ready for your own project. Nothing in the demo is saved.

## Acceptance criteria status

Each criterion links to evidence in [test-results.md](test-results.md).

- ✔ = covered by an end-to-end step that passed in the recorded Edge run for 1.0 (step numbers refer to that run).
- Unit = covered by a unit test or build check. No stored result exists for the unit tests; run `npm run test:unit`.
- ◐ = partly verified, with a manual step listed in the release checklist.

| Criterion | Status |
|---|---|
| First-time users understand the product on the welcome page | ◐ Welcome content reviewed; accessibility checks pass (✔ step 4). Usability sessions with real users are still to be done (release checklist). |
| The introduction is short, skippable and respects reduced motion | ✔ Steps 1, 2, 27 and 30 |
| Create a project and attribute it to a named operator | ✔ Step 6 |
| Choose the tailored plan or the full checklist | ✔ Steps 6 and 28 |
| One question per screen, keyboard answers, and only Next or Enter moves on | ✔ Step 7 |
| Tailoring is explainable and reversible; "I don't know yet" never creates false confidence | ✔ Steps 9 and 15; Unit (every step stays in scope when every answer is unknown) |
| The overview says where to start | ✔ Step 8 |
| Step pages: links to other steps, inline actions, item codes hidden from reading text | ✔ Steps 10 and 19 |
| Four stages visible and connected; Transition uses Prepare and Test results | ✔ Step 17 (a skipped test stage shows on the route); Unit (dependency status, test-stage prerequisites) |
| Remaining work, blockers, exceptions and actions are visible | ✔ Overview "Needs your attention", stage conclusions, register (steps 14 and 19) |
| Every step has practical instructions and source and provenance metadata | Unit; `validate-kb` fails the build otherwise |
| Guidance follows the writing rules (no long dashes, no bare item codes, valid links and actions) | Unit (`copy-and-ux.test.mjs`); `validate-kb` fails the build otherwise |
| Works with the network disabled and makes no external requests | ✔ Steps 3 and 31; CSP `connect-src 'none'` |
| No account, backend, telemetry or third-party runtime asset other than the embedded typeface | ✔ Single file; Unit (the typeface is the only font source) |
| Autosave is opt-in, disclosed and configurable | ✔ Step 6; Settings page |
| Package export and import keep metadata, statuses, notes, evidence, sources and history | ✔ Steps 22 and 26 |
| Settings persistence behaves exactly as documented | Unit (settings validation); local storage plus export and import, with no claim of a silent settings file |
| Readiness, test, execution and final reports generate offline as PDF | ✔ Steps 20 and 29 (preparation and final demo reports) |
| Reports separate verified, assertion only, failed, blocked and N/A, and never invent approvals | ✔ Step 11; Unit (report model); gates stay blank unless recorded |
| Reports show the knowledge base version, date, scope, sources and limitations | Report sections |
| No unsanitised content is executed | ✔ Steps 6 and 12 (injection strings render as text); Unit (prototype pollution, `javascript:` links); the CSP blocks injected scripts |
| Snippets are labelled for permissions and side effects | Unit; every snippet declares read-only, permissions and cost (build check) |
| Critical recommendations are sourced or marked for review | Unit |
| The demo uses fictional data only and can be left cleanly | ✔ Steps 5 and 29; demo watermark on reports |
