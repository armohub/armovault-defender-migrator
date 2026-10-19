# Test results — release candidate 0.9.0-rc.1

Run date: **2026-10-19**. Environment: Windows 11 Enterprise 10.0.26200, Node.js 24.14.1, Microsoft Edge 155 and Google Chrome 155 (installed versions, driven by playwright-core 1.64.1, headless), Windows PowerShell 5.1.

Only tests that were actually executed are reported here. Re-run them with `npm test` (unit + build + Edge E2E) and `npm run test:e2e:chrome`.

## Summary

| Suite | Command | Result |
|---|---|---|
| Knowledge-base integrity | `npm run validate-kb` (also runs in every build) | ✔ 0 errors, 0 warnings — 109 items, 35 questions, 101 sources, 32 snippets |
| Unit tests | `npm run test:unit` | ✔ **59 / 59 passed** |
| End-to-end, Edge 155 | `npm run test:e2e` | ✔ **24 / 24 passed** |
| End-to-end, Chrome 155 | `npm run test:e2e:chrome` | ✔ **24 / 24 passed** |
| Network requests during E2E (both browsers) | recorded by the E2E runner | ✔ **0** |
| Console errors during E2E (both browsers) | recorded by the E2E runner | ✔ **0** |
| Inventory script parse (Windows PowerShell 5.1) | PowerShell language parser | ✔ No parse errors |
| Inventory script logic against a mocked REST API | `powershell -File tests/tools/mock-inventory-run.ps1` (plus `-Fail automationRules`) | ✔ GET-only calls, paging followed, expected flags in output; a failed collection is reported as `GET automationRules returned HTTP 403` with no subscription or workspace path |
| Theme colour contrast (WCAG AA 4.5:1) | unit test `contrast.test.mjs` | ✔ 14 text/background token pairs pass in light and dark themes |
| Independent code and security review | separate reviewer agent, read-only | 22 confirmed defects reported; **all fixed** and covered by regression tests (`review-fixes.test.mjs`) — see below |
| Platform prototypes P1–P3 | `node prototypes/run-p1-platform.mjs` etc. | ✔ See [prototypes/README.md](../prototypes/README.md) |

Machine-readable results: `test-results/e2e-results-msedge.json` and `test-results/e2e-results-chrome.json`. The generated PDFs are in `test-results/` too (git-ignored; regenerated on each run).

## Unit tests (59)

- **Applicability:**
  - three-valued logic (unknown never hides);
  - `any`/`not` combinators;
  - full-checklist mode;
  - overrides require a reason;
  - answer-change diff;
  - with the real knowledge base, answering "unknown" to every question leaves **no** item out of scope.
- **Records:**
  - "passed" requires evidence;
  - removing the last evidence downgrades the status;
  - rationale is required for failed, blocked and N/A;
  - gates and test availability require names and reasons;
  - the audit trail records the actor.
- **Readiness:** undetermined → ready → not ready → ready with exceptions; an assertion-only critical item stays undetermined; a critical open issue blocks; dependency status; next action.
- **Files:**
  - CRC-32 vector;
  - ZIP round trip (store and deflate);
  - unsafe paths, garbage and truncation rejected;
  - zip-bomb size lie detected;
  - MIME sniffing refuses SVG and HTML;
  - CSV quoting and formula neutralisation.
- **Import validation:**
  - foreign or newer-schema files refused;
  - prototype pollution blocked;
  - string caps;
  - passes without evidence downgraded;
  - unnamed acceptances reopened;
  - `javascript:` links dropped;
  - settings whitelist.
- **Packages:** round trip preserves evidence bytes; a tampered `project.json` is rejected by its hash; a JSON export warns about missing attachments; disguised evidence is refused.
- **Content and reports:**
  - KB integrity;
  - every snippet is read-only;
  - state-changing items are tasks;
  - critical items are high-confidence or needs-review with caveats;
  - all sources are Microsoft Learn with verification dates;
  - inventory parsing and analysis;
  - malformed inventory refused;
  - the report model reflects records and never invents approvals;
  - snapshot fingerprint verification and tamper detection;
  - CSV covers every item.
- **Review regressions (16):** each finding of the independent review has a test. Examples:
  - the final report headline is the weakest stage;
  - markup-like "text" files are refused;
  - orphan register issues still block;
  - acceptance cannot be set, transferred or kept after edits;
  - an acceptance covers only the status it was given for;
  - passes without evidence content are downgraded on import;
  - import enforces rationale, test-stage reason, evidence ownership, unique register IDs and gate rationale;
  - a status change needs a fresh rationale;
  - hidden follow-up questions do not leave items uncertain;
  - a failed inventory collection never claims "nothing found";
  - hostile `toString` values do not crash import;
  - blocking wins over an empty scope;
  - `not()` explanations;
  - a preferences import cannot switch on storage.
- **Contrast (2):** WCAG AA for theme tokens, in light and dark.
- **Static safety:**
  - no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` or string timers;
  - no network APIs;
  - no remote resources in the template or CSS;
  - the built file's CSP has no `unsafe-*` and no hosts, and contains exactly one closing script tag.

## End-to-end journey (24 steps, identical in Edge and Chrome)

1. The app loads from `file://` with the welcome screen and a strict CSP.
2. The CSP blocks a deliberate `fetch` from the page.
3. Welcome screen accessibility checks pass (labels, names, alt, lang, h1, main); the skip link works by keyboard.
4. Create a tailored project with browser autosave; the responsibility statement is required; user text renders literally.
5. Questionnaire: "unknown" → uncertain item stays in scope; "no" → item greyed out and listed under Not applicable.
6. Passed without evidence → dialog → recorded as "Not verified".
7. Add an observation note (containing a `<script>` string) and a screenshot; the thumbnail renders; status set to Passed (verified); no script executed.
8. A disguised SVG ".png" and a 16 MB file are both rejected.
9. Failed requires a rationale; an exception with named acceptance is recorded.
10. Changing an answer shows the plan-change dialog; the status of the affected item is preserved.
11. A gate decision is refused without a decision maker, then recorded; typed input survives the validation error.
12. The test stage is skipped with a reason; the overview shows "Test stage not available".
13. Inventory import: findings become "imported" evidence; a ticked suggestion changes applicability.
14. All 12 main views render without errors and pass the accessibility checks.
15. The readiness report shows the recorded decision maker and the exception acceptor; the A4 PDF is multi-page.
16. A snapshot is saved, listed and integrity-verified.
17. The project package (.zip) is saved (download path).
18. Exports: JSON (schema checked), checklist CSV (header checked), register CSV, evidence index CSV.
19. Full browser restart: the autosaved project and screenshot are restored.
20. Garbage ZIP, foreign JSON and tampered package are refused; the current project is unchanged.
21. "Delete all app data", then reopen from the package: statuses, screenshot, exception and snapshot are intact.
22. Full-checklist project with autosave off: everything in scope; an unsaved-work warning appears on close (`beforeunload`).
23. The demo loads with a fictional-data banner; the final report renders and prints to PDF.
24. Zero network requests and zero console errors across the run.

## Defects found and fixed during testing

| Defect | Found by | Fix |
|---|---|---|
| Report "Not assessed" counted out-of-scope items | Visual review of the report | Status counts now cover in-scope items only |
| "Your plan changed" dialog appeared on ordinary first-time answers | E2E step 5 | Dialog only when hidden items reappear, records are affected, or earlier decisions exist |
| A rejected gate-decision attempt wiped the typed form | E2E step 11 | Gate drafts persist across re-renders; validation runs before any change is recorded |
| CSP hash mismatch for the stylesheet (CRLF normalisation by the HTML parser) | Smoke test (console) | Build normalises line endings before hashing |
| An inline `style` attribute in `<noscript>` violated the CSP | Smoke test (console) | Replaced with a class |
| Final report headline used only the validation stage | Independent review #1 | Headline = weakest stage (skipped test stage neutral) |
| Evidence download could keep an attacker-chosen extension; markup-like text was accepted as text/plain | Review #2 | Extension derived from the detected type; any text starting with markup refused |
| Register items linked to unknown item IDs were ignored by conclusions | Review #3 | Treated as unlinked (they block and appear in reports); import warns |
| Acceptance could be set, transferred or kept after edits; it did not record the status it covered | Review #4 | Only "Record risk acceptance" sets it; edits withdraw it (audited); covered status stored and checked |
| Switching or closing projects could lose pending work; save races | Review #5 | A leave-project guard flushes autosave or asks; saves are serialised and checked against the open project |
| Passes stayed "verified" when attachment content was missing; import accepted states the app forbids | Review #6, #7 | Downgrade on import; record rules enforced during import |
| Old rationale reused for a new status | Review #8 | Fresh rationale required; stale rationale cleared |
| Close-tab warning skipped while autosave was pending or failed; open project deletable from storage | Review #9, #10 | Warns whenever anything is unprotected; the open project cannot be deleted |
| Autosave redrew the page while typing | Review #11 | The save indicator updates in place; no redraw on text change |
| An item stayed "uncertain" because its follow-up question was hidden | Review #12 | Rule fixed; hidden follow-ups count as "No" |
| Inventory: "nothing found" after a failed collection; `constructor` kind treated as standalone; resource paths in error text | Review #13, PowerShell | Collection failures flagged; own-property lookup; errors carry only the resource type; invariant date format; StrictMode-safe access |
| Thumbnail of a newly attached screenshot could show "content missing" | E2E after fix #11 | File content is stored before the page re-renders |
| Low-severity items: object-URL leaks, integrity wording, manifest edge cases, odd `toString`, export/import limit mismatch, empty-scope blocking, settings import, radio-group keys, focus after dialogs, live region, `not()` reasons | Review #14–22 | All fixed; wording now says hashes detect corruption and accidental changes, not deliberate tampering |
| Inventory script broke under Windows PowerShell 5.1 (non-ASCII character in a BOM-less file) | Parser check | Script made ASCII-only; the build enforces it |

## Not tested / manual verification still required

| Area | Why not automated | Manual check before public release |
|---|---|---|
| File System Access "Save as…" dialog (Edge/Chrome) | Native dialog cannot be automated (prototype P2) | In headed Edge and Chrome: Save project package → dialog → choose a folder → file written → reopen it |
| Interactive print dialog (Ctrl+P → Save as PDF) | Native dialog | Print the final demo report in Edge; check headers/footers and page numbers |
| Firefox, Safari, macOS, Linux | Not installed / out of scope | — (not supported in release 1) |
| Inventory script against a real tenant | No customer tenant available to the authors | Run in a lab tenant with Microsoft Sentinel Reader; compare counts with the portal |
| KQL, REST and PowerShell snippets against a real tenant | Same | Run each read-only snippet in a lab workspace; record any correction |
| Screen-reader walkthrough (Narrator/NVDA) | Only automated structural checks, keyboard support and token contrast were tested | Walk the core journey with Narrator |
| Usability with first-time users | Not performed | Short sessions with 2–3 SOC analysts and a manager |
| Very large projects (thousands of evidence items, packages of hundreds of MB) | Time | Generate a large synthetic project and measure export/import time and memory |
