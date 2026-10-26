# Test results for version 1.0.0

Only results that were recorded in files are reported as results here. Where no stored result exists, this page says what the suite covers and how to run it, not a number. Re-run everything with `npm test` (unit tests, build and the Edge end-to-end suite) and `npm run test:e2e:chrome`.

**Environment:** Windows 11 Enterprise 10.0.26200, Node.js 24.14.1, Microsoft Edge 155.0.4283.62 and Google Chrome 155.0.8059.80 (the versions installed on the test machine), driven headless by playwright-core 1.64.1. Windows PowerShell 5.1.

## Summary

| Suite | Command | Recorded result |
|---|---|---|
| End-to-end, Edge | `npm run test:e2e` | ✔ **42 of 42 steps passed** on 2026-10-26 at 21:26 UTC, against the 1.0.0 build with knowledge base 2026.10.26 (`test-results/e2e-results-msedge.json`) |
| Network requests and console errors during those runs | recorded by the end-to-end runner (step 42) | ✔ **none**, in Edge and in Chrome |
| End-to-end, Chrome | `npm run test:e2e:chrome` | ✔ **42 of 42 steps passed** on 2026-10-26 at 21:27 UTC, against the same build (`test-results/e2e-results-chrome.json`) |
| Unit tests | `npm run test:unit` | ✔ **136 of 136 passed** on 2026-10-26 against the same source |
| Knowledge base integrity and writing rules | `npm run validate-kb` (also runs in every build) | No stored result. Every build runs it and stops on any error. The knowledge base has 110 steps, 35 questions, 120 sources and 33 snippets. |
| Inventory script parse and mock run | `powershell -File tests/tools/mock-inventory-run.ps1` (plus `-Fail automationRules`), and `tests/tools/mock-inventory-multi.ps1` for several workspaces | ✔ **all three passed** on 2026-10-26 at 21:29 UTC in Windows PowerShell 5.1, against a mocked API (`test-results/mock-inventory-*.txt`). The multi-workspace run checks one file per workspace, a failing workspace that does not stop the others, no resource paths in the output, and refusal of duplicate or missing aliases before any request. |
| Platform prototypes P1 to P3 | `node prototypes/run-p1-platform.mjs` and the others | Stored results in `prototypes/*.json`. See [prototypes/README.md](../prototypes/README.md). |

The Edge run also generated `test-results/report-prepare-msedge.pdf` and `test-results/report-final-demo-msedge.pdf`. The `test-results/` folder is git-ignored and is rewritten on each run.

## End-to-end journey (42 steps, Edge and Chrome runs of 2026-10-26)

1. First launch plays the introduction with its six promises, and it can be skipped.
2. The welcome page has a strict CSP, and the introduction does not return on the next start.
3. The CSP blocks a deliberate network request from the page.
4. The welcome page passes basic accessibility checks, and the skip link works by keyboard.
5. The demo is clearly labelled, and "Exit demo" returns to the start page, ready for your own project.
6. Create a tailored project with browser autosave.
7. Questionnaire: one question per screen, keys 1 to 4, and auto-advance after Yes or No only.
8. Building the plan shows real counts and progress on the route, then the guided overview says where to start.
9. Applicability: "I don't know yet" keeps steps in scope, and "No" sets steps aside with a reason.
10. Step page: references are links, "do it here" buttons act on the step, and the window planner saves to Project setup.
11. Cancel closes a dialog without saving, and a check on the input keeps it open.
12. Do it here: owners flow into other steps, workspaces into Project setup, the briefing email is ready to copy, and "Leave for now" moves on.
13. Dates: typing never redraws the page, and the window cannot end before it starts (message shown, Save disabled).
14. Owners: a lead per workstream, more people with what they cover, and a step with its own owner. The other steps name everyone in the workstream.
15. Briefing: one email per reader (leadership, SOC team, a client), each change says what it means, and the email-app link stays under 2,000 characters.
16. Several workspaces: one primary per tenant, the others shown as secondary with what that means.
17. Decision helper: a verdict only where the step gives one, and the saved choice is recorded as a decision.
18. "Not needed for us" lets a step pass, and the report says why.
19. "Passed" requires evidence; your word alone is recorded as "Not verified".
20. Add an observation note (containing an injection string) and a screenshot, then mark Passed, verified. No script runs.
21. Unsafe and oversized evidence files are rejected.
22. A failed status requires a reason, and an exception with a named acceptance is recorded.
23. Changing an answer explains the plan change and keeps records.
24. A gate decision needs a typed decision maker.
25. The optional test stage can be skipped with a reason, and the route shows it as skipped.
26. Import read-only inventory results as labelled evidence and confirmed suggestions.
27. Every main view renders without errors, passes basic accessibility checks and hides item codes.
28. The readiness report renders and produces a multi-page A4 PDF offline.
29. A snapshot is saved, listed and verified by its fingerprint.
30. Save the project package (.zip) with evidence.
31. Exports: JSON data, checklist CSV, register CSV and evidence index CSV.
32. Browser autosave survives a full browser restart (project and screenshot restored).
33. Malformed, foreign and tampered files are refused without changing anything.
34. Delete browser data, then reopen from the package: statuses, evidence, snapshot and audit log are intact.
35. About replays the introduction on request.
36. A full-checklist project without autosave warns about unsaved work.
37. The demo opens by link with fictional data, and the final report renders.
38. Reduced motion: the introduction shows everything at once, and the assistant stays usable.
39. Simplified: six questions, missions with progress, a real Ctrl+V screenshot as proof right after arriving, Done opening the next row with no Detailed-only hint, a text-and-image paste staying text in a field, recording a decision from its row, proof from a copied ready text, a mission question that sets checks aside, hiding extras, the gate inside its mission, the Simplified and Detailed stage pages, reopening a mission question from "Your answers", and good practice reported apart.
40. Several inventory files import together, one dialog per workspace, and **Skip this file** leaves a file out.
41. Explainers: the Defender table review says first that nothing is lost, the ⓘ opens and closes with Escape or a click elsewhere, practical tips say they are practice, and the planner offers a small-team profile.
42. No network request was made during the whole run, and no console errors occurred.

## What the unit tests cover

There is no stored result for the unit tests, so this lists what they check, by file.

- **`core.test.mjs`: applicability, records and readiness.**
  - three-valued logic (unknown or unanswered never hides a step), and `any` and `not` follow Kleene logic;
  - full-checklist mode shows everything; overrides need a reason and win;
  - the answer-change diff reports newly applicable and uncertain steps;
  - "passed" requires evidence, and removing the last evidence downgrades to not verified;
  - failed, blocked and not applicable need a rationale;
  - readiness moves between undetermined, not ready, ready with exceptions and ready as records change; an assertion-only critical step keeps readiness undetermined; a critical open issue blocks;
  - dependencies surface Prepare problems on Transition tasks; test-stage prerequisites count only when a test environment is available;
  - gates and test availability need names and reasons; the next action and the audit trail.
- **`io.test.mjs`: files and import.**
  - CRC-32 vector; ZIP round trip (store and deflate); unsafe paths, garbage and truncation rejected; zip-bomb size lies caught;
  - MIME sniffing ignores names and refuses markup; CSV quoting and formula neutralisation;
  - foreign files, newer schemas and unsafe keys refused; passes without evidence and unnamed acceptances downgraded; `javascript:` links dropped; settings keep known values only;
  - package round trip keeps evidence and detects tampering; JSON export warns that attachments are not included; disguised evidence is refused.
- **`content-report.test.mjs`: content and reports.**
  - knowledge base integrity, every step guided and sourced;
  - every snippet declares read-only status, and steps that change things are flagged;
  - critical official steps use high-confidence sources or are marked "Needs review" with caveats;
  - every source is Microsoft Learn with verification dates;
  - "unknown" answers never remove critical steps;
  - inventory parsing maps findings to steps and only suggests Yes; malformed inventory files are refused;
  - the report model reflects records and never invents approvals; snapshots are fingerprinted and tampering is detected; the CSV covers every step.
- **`copy-and-ux.test.mjs`: writing rules and 1.0 settings (new in 1.0).**
  - no long dashes anywhere in the app source, styles or knowledge base;
  - the knowledge base passes every writing rule, and the validator catches long dashes, bare item codes, unknown links and misplaced actions;
  - guidance that sends you to the register or project setup is a link or an action;
  - new settings have safe defaults (dark theme, auto-advance on, motion following the system) and are validated;
  - the brand name, version 1.0.0, the makers' profile links and a knowledge base version without "rc", "beta" or "pilot";
  - the embedded typeface ships with its licence and is the only font source.
- **`tools-and-waiver.test.mjs`: "do it here" tools and evidence waivers.**
  - "evidence not needed" needs a reason, lets a step pass, and withdrawing it downgrades an unsupported pass; reports and CSV show the reason;
  - steps show their workstream owner unless they have their own; approvers and owners are suggested as known people;
  - the workspace inventory keeps its fields, allows one primary per tenant, and survives import;
  - every step tool exists, and the briefing has three readers, and each point says what it means, with a source.
- **`decision-helpers.test.mjs`:** the three decision helpers, their verdict rules, per-tenant subjects and the decision record they fill in.
- **`workstream-people.test.mjs`:** a lead and other people per workstream with what they cover, step owners that differ from the lead, the report rows, and import safety.
- **`primary-per-tenant.test.mjs`:** several production workspaces in one tenant (one primary, the rest secondary), one primary per tenant, a primary chosen before tenants were entered, report roles and import safety.
- **`simple-content.test.mjs`:** the 9 good-practice checks, Validate checks depending on health monitoring, short forms on all 110 checks within their limits and pointing only to what a mission row offers, mission titles, the six core questions, the data residency wording, and the ready texts.
- **`simple-model.test.mjs`:** Simplified is the default for new projects and Detailed for older ones; switching changes no record; the new fields survive import; good-practice checks never block readiness or count in progress; reports list them apart.
- **`missions.test.mjs`:** missions hold their checks in order, count done and attention, ask the questions their checks depend on (once each), skip missions with nothing to do and an unused Test stage, and Simplified asks six questions up front.
- **`eml.test.mjs`:** Outlook drafts open unsent, keep non-ASCII text intact, cannot gain headers from a line break, and get safe file names.
- **`proof.test.mjs`:** only pastes with files become proof, and a copy with text into a field stays text; proof generated from your entries comes only from what the forms hold, and reports label it.
- **`review-additions.test.mjs`:** the additions from the comparison with public migration guides: the Defender table review (a recommended extra that says first that nothing is deleted, with the retention, advanced hunting and portal sources), fewer-incidents guidance on validation, the default Entra roles review, practical tips labelled as practice, the validator's rules for explainers, and the planner profiles (suggested, chosen, and safe on import).
- **`review-fixes.test.mjs`: regression tests for the findings of the independent review** (see the history below).
- **`contrast.test.mjs`:** WCAG AA (4.5:1) for 14 text and background token pairs, in the light and the dark theme.
- **`static.test.mjs`: static safety.**
  - no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` or string timers;
  - no network APIs;
  - no remote resources in the template or styles;
  - the built file's CSP has `default-src 'none'` and `connect-src 'none'`, no `unsafe-*` and no hosts, and the file has exactly one closing script tag.

## Not tested: manual checks still required

| Area | Why it is not automated | Manual check before public release |
|---|---|---|
| File System Access "Save as" dialog (Edge and Chrome) | The native dialog cannot be automated (prototype P2) | In headed Edge and Chrome: Save package, choose a folder, check the file is written, reopen it |
| Interactive print dialog (Ctrl+P, then Save as PDF) | Native dialog | Print the final demo report in Edge. Check that it prints on white, with headers, footers and page numbers |
| Firefox, Safari, macOS, Linux | Not installed, and out of scope | Not supported in 1.0 |
| Inventory script against a real tenant | No customer tenant is available to the makers | Run it in a lab tenant with Microsoft Sentinel Reader and compare counts with the portal |
| KQL, REST and PowerShell snippets against a real tenant | Same reason | Run each read-only snippet in a lab workspace and record any correction |
| Screen reader walkthrough (Narrator or NVDA) | Only structural checks, keyboard support and token contrast are automated | Walk through the introduction, the questionnaire, the overview and one step page with Narrator |
| Reduced motion from the operating system | The end-to-end run emulates the reduced-motion media query in the browser; the Windows setting itself was not tested | Turn off Windows animation effects and open the assistant; then try **Reduce motion** in Settings |
| Light theme | Contrast is unit-tested; the look is not | Switch to the light theme and review the main pages |
| Usability with first-time users | Not performed | Short sessions with two or three SOC analysts and a manager |
| Very large projects (thousands of evidence items, packages of hundreds of MB) | Time | Generate a large synthetic project and measure export and import time and memory |

## History: the internal release candidate (0.9.0-rc.1)

The internal build (never published) passed its earlier 24-step suite in Edge and Chrome on 2026-10-19 at 11:04 UTC; that Chrome result file has since been replaced by the 1.0 run. An independent code and security review of that build reported 22 confirmed defects. All were fixed, and the fixes are covered by regression tests in `review-fixes.test.mjs`.

| Defect | Found by | Fix |
|---|---|---|
| The report's "Not assessed" counted out-of-scope items | Visual review of the report | Status counts cover in-scope items only |
| The "Your plan changed" dialog appeared on ordinary first-time answers | End-to-end test | The dialog appears only when set-aside items come back, records are affected, or earlier decisions exist |
| A rejected gate-decision attempt wiped the typed form | End-to-end test | Gate drafts survive re-renders; validation runs before any change is recorded |
| CSP hash mismatch for the stylesheet (the HTML parser normalises CRLF) | Smoke test (console) | The build normalises line endings before hashing |
| An inline `style` attribute in `<noscript>` broke the CSP | Smoke test (console) | Replaced with a class |
| The final report headline used only the validation stage | Independent review #1 | Headline is the weakest stage (a skipped test stage is neutral) |
| Evidence download could keep an attacker-chosen extension; markup-like text was accepted as text/plain | Review #2 | The extension comes from the detected type; any text starting with markup is refused |
| Register items linked to unknown item IDs were ignored by conclusions | Review #3 | Treated as unlinked (they block and appear in reports); import warns |
| An acceptance could be set, transferred or kept after edits, and did not record the status it covered | Review #4 | Only "Record risk acceptance" sets it; edits withdraw it (audited); the covered status is stored and checked |
| Switching or closing projects could lose pending work; save races | Review #5 | A leave-project guard flushes autosave or asks; saves run one at a time and are checked against the open project |
| Passes stayed "verified" when attachment content was missing; import accepted states the app forbids | Reviews #6 and #7 | Downgrade on import; record rules enforced during import |
| An old rationale was reused for a new status | Review #8 | A fresh rationale is required; a stale one is cleared |
| The close-tab warning was skipped while autosave was pending or failed; the open project could be deleted from storage | Reviews #9 and #10 | Warns whenever anything is unprotected; the open project cannot be deleted |
| Autosave redrew the page while typing | Review #11 | The save indicator updates in place; no redraw on text change |
| A step stayed "uncertain" because its follow-up question was hidden | Review #12 | Rule fixed; hidden follow-ups count as "No" |
| Inventory: "nothing found" after a failed collection; a `constructor` kind treated as standalone; resource paths in error text | Review #13, PowerShell | Collection failures flagged; own-property lookup; errors carry only the resource type; invariant date format; StrictMode-safe access |
| The thumbnail of a newly attached screenshot could show "content missing" | End-to-end test after fix #11 | File content is stored before the page re-renders |
| Low-severity items: object-URL leaks, integrity wording, manifest edge cases, odd `toString`, export and import limit mismatch, empty-scope blocking, settings import, radio-group keys, focus after dialogs, live region, `not()` reasons | Reviews #14 to #22 | All fixed. The wording now says hashes detect corruption and accidental changes, not deliberate tampering |
| The inventory script broke under Windows PowerShell 5.1 (a non-ASCII character in a file without a BOM) | Parser check | The script is ASCII-only, and the build enforces it |
