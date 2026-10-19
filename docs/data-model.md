# Data model

Three kinds of data, kept strictly apart:

| Data | Where it lives | Format | Versioning |
|---|---|---|---|
| **Knowledge base** (guidance) | Bundled into the app at build time; also published as `dist/kb.json` | `content/*.mjs` → JS objects | `KB_META.version` (for example `2026.10.19-rc1`); each item has `version` and `lastVerified` |
| **Project** (your records) | In memory; in IndexedDB only with browser autosave; in project packages you save | JSON (`armohub.dma.project`) | `schemaVersion` (currently 1) with a migration hook |
| **Settings** (preferences) | `localStorage` key `armohub.dma.settings.v1`; optional export file | JSON (`armohub.dma.settings`) | `schemaVersion` 1 |

## Knowledge object (`content/stage-*.mjs`)

```js
{
  id: 'PREP-AUT-01', version: 1, stage: 'prepare', workstream: 'automation', order: 10,
  kind: 'check' | 'task' | 'decision' | 'gate',
  title, objective, why,                          // plain language
  criticality: 'critical' | 'high' | 'medium' | 'low',
  applicability: null | { q } | { all: [...] } | { any: [...] } | { not: rule },   // declarative, never evaluated as code
  applicabilityNote, dependsOn: ['PREP-…'],
  roles: [], prerequisites: [], where: [{ portal, path }], when,
  steps: [],                                       // numbered instructions
  snippets: ['SNIPPET_ID'],                        // see content/snippets.mjs
  expected, interpret: [{ outcome, meaning }],
  record: [], evidence: [], remediation: [], rollback: [],
  sources: [{ id: 'move', supports: 'claim this source supports' }],
  provenance: 'official' | 'practice', confidence: 'high' | 'medium' | 'low',
  validation: 'docs-verified' | 'needs-review', caveats: [],   // needs-review requires caveats
  practiceNotes: [], testable: bool, changesState: bool, lastVerified: 'YYYY-MM-DD',
}
```

Snippets (`content/snippets.mjs`): `title, language, status ('verbatim'|'composed'), runIn, permissions, readOnly, cost, purpose, notDo, code, expected, caveats, sources`.

Questions (`content/questions.mjs`): `id, section, text, help, sources, showIf?`. `showIf` only controls whether a follow-up question is shown; it never hides items.

`scripts/validate-kb.mjs` checks referential integrity and minimum guidance quality. The build fails on any error.

## Applicability (three-valued logic)

`yes` → true; `no` or `na` → false; unanswered or `unknown` → **unknown**. `all`, `any` and `not` follow Kleene logic.

| Result | Meaning |
|---|---|
| `applies` | Item in scope |
| `not_applicable` | Shown greyed out, with the derived reason |
| `unknown` | In scope, labelled "applicability uncertain" |

In full-checklist mode every item is `applies`. A reviewer override (`applies` or `not_applicable`) requires a reason and wins over answers.

## Project (`armohub.dma.project`, schemaVersion 1)

```js
{
  schema, schemaVersion, id, createdAt, updatedAt, createdWith: { appVersion, kbVersion }, isDemo,
  meta: { name, organisation, operatorName, operatorRole, startDate, windowStart, windowEnd, environments: [{ alias, kind, notes }], notes },
  mode: 'tailored' | 'full',
  answers: { [questionId]: { value, reason, by, at } },
  checks: { [itemId]: { status, statusReason, owner, due, notes, evidenceIds, updatedAt, updatedBy, kbVersion, override, history: [...] } },
  evidence: { [evidenceId]: { id, checkId, kind: 'image'|'note'|'link'|'file', origin: 'user'|'import', title, text, url, fileName, mime, size, sha256, redactionConfirmed, createdAt, createdBy, stage } },
  register: [{ id, type: 'action'|'issue'|'risk'|'exception'|'decision', title, description, owner, due, severity, status, checkId, acceptedBy, acceptedRole, acceptedAt, rationale, createdAt, createdBy, updatedAt }],
  stages: { test: { availability: 'undecided'|'available'|'unavailable', reason, decidedBy, decidedAt } },
  gates: { [gateItemId]: { decision, decidedBy, decidedRole, rationale, at, history } },
  snapshots: [{ id, kind, title, createdAt, createdBy, appVersion, kbVersion, sha256, note, model }],
  audit: [{ at, by, action, detail, ref }],                 // capped at 5,000 entries
}
```

**Statuses:**

| Status | Meaning | Rule |
|---|---|---|
| `not_started` | | |
| `in_progress` | | |
| `passed` | Verified | **Requires at least one evidence item** |
| `not_verified` | Done, user assertion only | |
| `failed` | | Rationale required |
| `blocked` | | Rationale required |
| `needs_review` | | |
| `not_applicable` | | Rationale required |

**Integrity rules** enforced in `src/core/model.js` and again on import (`src/core/schema.js`):
- A pass without evidence becomes `not_verified`.
- An exception counts as accepted only with a named person and a rationale.
- Gate decisions need a decision maker; `go_with_exceptions` and `no_go` also need a rationale.
- Timestamps are always "now" at the moment of the user's action. Nothing is back-dated or pre-filled.

## Conclusion algorithm (`src/core/readiness.js`)

Computed per stage over in-scope items:
1. **Not ready:** any in-scope critical or high item failed or blocked without an accepted exception, or an open critical issue or risk.
2. **Unable to determine:** otherwise, any critical or high item not yet assessed, applicability still uncertain, or a critical item recorded only as an assertion.
3. **Ready with exceptions:** otherwise, if there are exceptions, high items with assertion only, or open medium/low items.
4. **Ready:** everything is passed with evidence or not applicable with a rationale.

The test stage reports **Not available** when it is marked unavailable. Gate decisions are always human.

## Project package (`.zip`, `armohub.dma.package` v1)

```
manifest.json      format, versions, createdAt/By, projectSha256, evidenceFiles[{ path, evidenceId, sha256, size, mime }], evidenceMissing[]
project.json       the project object above
evidence/<id>.<ext> screenshot and file bytes
README.txt         contents + sensitivity notice (the package is NOT encrypted)
```

Import is defensive (`src/core/package.js`, `src/core/zip.js`):
- ZIP safety: entry count, size and compression-ratio limits; unsafe paths, encrypted entries and CRC mismatches are refused.
- The manifest hash must match `project.json`.
- Each evidence file must match its recorded SHA-256, and its type is sniffed from content. SVG, HTML and scripts are refused.
- `project.json` is rebuilt field by field from known keys. Forbidden keys (`__proto__`, `constructor`, `prototype`) are refused; strings are capped; enums are validated.
- Projects created by a newer schema version are refused, with a clear message.

## Inventory file (`armohub.dma.inventory` v1)

Produced by `tools/Get-ArMoSentinelInventory.ps1`, which sends GET requests only. It contains names and flags only (no queries, incidents or credentials):
- `analyticsRules[]`: name, kind, enabled, createIncident, groupingEnabled, reopenClosed, correlationTag, usesIdentityInfo, usesLegacyTI, productFilter, apiVersion
- `automationRules[]`: name, enabled, triggersOn, triggersWhen, riskyConditions, playbookActions, taskActions
- `dataConnectors[]`, `watchlists[]`, `errors[]`

The app maps the file to imported evidence notes on specific items, and to "Yes" answer suggestions. Absence of a finding in one workspace is never turned into "No".

## Schema evolution

- `migrateProject()` in `src/core/schema.js` is where version upgrades go: for example, add `if (raw.schemaVersion === 1) raw = upgrade1to2(raw)`, then bump `PROJECT_SCHEMA_VERSION`.
- Older projects stay readable. Newer projects are refused by older apps with an explicit message.
- Items that disappear from a later knowledge base are kept in the project as historical data, and the import reports them.
