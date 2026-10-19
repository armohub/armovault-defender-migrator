# Product scope and user flows

## Purpose

Help SOC teams, security architects, project leads and consultants move their Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal, before Microsoft ends Azure portal support (after 31 March 2027). The product guides people from readiness to post-transition sign-off, and keeps an evidence-based record of what was done.

**Terminology.**
- Microsoft Sentinel is *not* being discontinued; its Azure portal experience is.
- "Connecting" (onboarding) a workspace to the Defender portal keeps log data in Log Analytics, but changes several behaviours. The tool helps teams find and handle those changes.
- Microsoft Defender XDR is optional for Sentinel in the Defender portal.

## Release 1 scope (0.9.0-rc.1)

**In scope**
- Welcome screen, first-run set-up, and the choice between the tailored questionnaire (35 questions) and the full checklist.
- Four stages with 109 guided knowledge objects:
  - Stage 1 Prepare: 62
  - Stage 1.5 Test (optional): 11
  - Stage 2 Transition runbook: 17
  - Stage 3 Validate: 19
- For each item:
  - objective, why it matters, applicability with reasons, roles, location, steps;
  - read-only snippets with permissions, cost and caveats;
  - expected results and interpretation, what to record, evidence;
  - remediation and rollback;
  - sources with dates, provenance, confidence, and the uncertainty where sources conflict.
- Statuses that keep "done" separate from "verified":
  - "Passed" requires evidence;
  - failed, blocked and not applicable require a rationale;
  - removing the last evidence downgrades a pass.
- Applicability overrides with a reason, an audit log, and per-item history.
- Evidence: screenshots, observation notes, links and files. Types are checked from file content; size limits apply; a redaction prompt is shown; imported evidence is labelled.
- Register: actions, issues, risks, exceptions and decisions. An exception counts as accepted only with a named person, role and rationale.
- Gate decisions with a typed decision maker (never pre-filled).
- Readiness conclusions computed from explicit criteria, with "why" lists.
- Reports: preparation, test, execution, validation and final. Printable to PDF offline; snapshots carry SHA-256 fingerprints and an integrity check.
- Data:
  - project package (.zip with manifest, hashes and evidence);
  - JSON data export;
  - CSV exports of the checklist, register and evidence index;
  - preferences file export and import.
- Persistence: opt-in browser autosave (IndexedDB), manual packages, unsaved-work warning, and "delete all app data".
- Import-based assistance: a read-only inventory script whose output becomes imported evidence and suggested answers that the user confirms.
- Knowledge views: feature changes, portal map, key dates, terminology, catalogue, coverage and sources.
- A synthetic demo project.

**Out of scope for release 1** (roadmap)
- Connected mode: live read-only checks through Microsoft Graph or ARM (see the ADR for why).
- Localisation: English only. Content and UI strings are separated so translation is possible later.
- macOS/Linux packaging, Firefox and Safari support.
- Encryption of local data or packages (not claimed).
- Multi-user collaboration, or merging projects.
- SIEM migration from other products to Sentinel; Sentinel greenfield deployment.

## Primary flows

```
Welcome ──► New project (4 steps) ──► Tailored? ──yes──► Questionnaire ──► Overview
   │            project, environments,      │no
   │            saving choice, approach     └────────────────────────────► Overview
   ├──► Open project package (.zip/.json) ──► integrity summary ──► Overview
   └──► Explore demo (fictional) ──────────────────────────────────────► Overview

Overview ─► Stage page (filter: in scope / needs attention / not applicable / all)
             └─► Item page: guidance + record (status, rationale, owner, due, notes, evidence, gate, history)
Overview ─► Register ─► Evidence ─► Reports (preview / print to PDF / snapshot / exports)
```

### Flow details

1. **First run.** Project label and operator name are required; no secrets are asked for. Environments use aliases only. Saving choice: autosave **off by default**, with an explained "autosave in this browser" option. Approach: tailored or full. The responsibility statement must be acknowledged.
2. **Tailoring.**
   - Each answer is Yes, No, "I don't know" or Not applicable. "I don't know" keeps dependent items in scope as **applicability uncertain**.
   - Not-applicable items are greyed out and listed under the "Not applicable" filter, with the reason derived from the answer. A reviewer can reconsider them, with a reason.
   - Changing an answer that brings back hidden items, or affects items with records, shows a dialog listing the effects. Records are preserved. If earlier gate decisions or snapshots exist, the dialog warns that conclusions may be outdated.
3. **Stage 1 Prepare.**
   - Work through workstreams; attach evidence; record failures with rationale; record exceptions in the register.
   - Optionally import the inventory script output.
   - Review the computed conclusion: Not ready / Unable to determine / Ready with exceptions / Ready to proceed.
   - Record the PREP-PLN-05 gate decision, then save a readiness report snapshot.
4. **Stage 1.5 Test (optional).**
   - Mark availability. If unavailable, record a reason: the report states it and lists compensating controls.
   - If available, scope tests from the list of testable Stage 1 items, then run them.
5. **Stage 2 Transition.** A sequenced runbook in phases (pre-change, change, post-change), with step numbers.
   - Dependency chips show Stage 1 prerequisites that failed or are still open.
   - Configuration-changing steps are flagged.
   - The go/no-go gate (TRN-01) and the outcome gate (TRN-17) need typed decision makers.
6. **Stage 3 Validate.** Compare against the Stage 1 baselines and acceptance criteria. Document known limitations, with durable workarounds that do not depend on the Azure portal. Final sign-off gate, final report snapshot, and a package export for retention.

## Acceptance criteria status

Each criterion links to evidence in [test-results.md](test-results.md). ✔ = verified by an automated test or a recorded check; ◐ = partially verified, with a manual step listed in the release checklist.

| Criterion | Status |
|---|---|
| First-time user understands the product on the welcome screen | ✔ Welcome content reviewed; a11y checks pass. Usability with real users still to be done (release checklist). |
| Create a project and attribute to a named operator | ✔ E2E "Create a tailored project…" |
| Choose tailored or full checklist | ✔ E2E tailored and full flows |
| Tailoring explainable and reversible; unknown never creates false confidence | ✔ Unit test across all 109 items; E2E answer-change flow |
| Four stages visible and connected; Stage 2 consumes Stage 1 and test results | ✔ Dependency chips, test-stage gate; unit test `dependencyStatus` |
| Remaining work, blockers, exceptions and actions visible | ✔ Overview "Needs attention", stage conclusions, register |
| Every item has practical instructions and source/provenance metadata | ✔ `validate-kb` fails the build otherwise |
| Works with network disabled; makes no external requests | ✔ CSP `connect-src 'none'`; E2E records zero http(s) requests in Edge and Chrome |
| No account, backend, telemetry or third-party runtime asset | ✔ Single file; no dependencies at runtime |
| Autosave opt-in, disclosed, configurable | ✔ E2E; Settings page |
| Package export/import preserves metadata, statuses, notes, evidence, sources and history | ✔ E2E round trip after deleting browser data; unit round-trip test |
| Settings persistence behaves exactly as documented | ✔ localStorage + export/import; no silent-file claim |
| Readiness, test, execution and final reports generate offline as PDF | ✔ E2E PDF generation (preparation, final demo) |
| Reports distinguish verified, assertion, failed, blocked, N/A; never invent approvals | ✔ Unit test on the report model; gates blank unless recorded |
| Reports show KB version, date, scope, sources and limitations | ✔ Report sections |
| No unsanitised content executed | ✔ E2E injection attempts; unit tests for prototype pollution and `javascript:` links; CSP blocks injected scripts |
| Snippets labelled for permissions and side effects | ✔ Every snippet declares read-only, permissions and cost (build check) |
| Critical recommendations sourced or marked for review | ✔ Unit test |
| Demo uses fictional data only | ✔ Demo generator; watermark on reports |
