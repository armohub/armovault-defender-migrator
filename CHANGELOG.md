# Changelog

## 0.9.0-rc.1 — 2026-10-19 (private release candidate)

- First complete guided workflow:
  - Stage 1 Prepare (62 items);
  - Stage 1.5 Test (11);
  - Stage 2 Transition runbook (17);
  - Stage 3 Validate (19);
  - 35-question tailoring questionnaire with three-valued applicability.
- Knowledge base `2026.10.19-rc1`: 101 Microsoft Learn sources verified 2026-10-19; 32 read-only snippets; 15 items marked "Needs review" where Microsoft sources conflict.
- Evidence (screenshots, notes, links, files) with type sniffing and limits; register; gate decisions; audit log.
- Reports (preparation, test, execution, validation, final) with print-to-PDF and SHA-256 snapshots.
- Project packages (.zip) with integrity manifest; JSON and CSV exports; preferences export/import.
- Opt-in browser autosave (IndexedDB); unsaved-work warning; delete-all.
- Read-only inventory script and import-based assistance.
- Single-file build with strict CSP (no network); synthetic demo project.
- Independent code and security review: 22 findings fixed with regression tests.
- Tests: 59 unit tests and 24-step end-to-end suites in Edge 155 and Chrome 155, with zero network requests recorded.
