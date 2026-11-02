# Data model

This is a technical reference, so it names item codes and internal identifiers where they matter.

Three kinds of data, kept strictly apart:

| Data | Where it lives | Format | Versioning |
|---|---|---|---|
| **Knowledge base** (guidance) | Bundled into the assistant at build time; also published as `dist/kb.json` | `content/*.mjs` to JS objects | `KB_META.version` (1.0 ships `2026.10.26`); each item has `version` and `lastVerified` |
| **Project** (your records) | In memory; in IndexedDB only with browser autosave; in project packages you save | JSON (`armohub.dma.project`) | `schemaVersion` (currently 1) with a migration hook |
| **Settings** (preferences) | `localStorage` key `armohub.dma.settings.v1`; optional export file | JSON (`armohub.dma.settings`) | `schemaVersion` 1 |

**Why the identifiers still say `armohub`.** The product is now called ArMo MS Defender Migration Assistant, but the internal identifiers (`armohub.dma.project`, `armohub.dma.settings`, `armohub.dma.package`, `armohub.dma.inventory`, `armohub.dma.kb`, the IndexedDB database `armohub-dma` and the settings key above) are unchanged on purpose. Changing them would stop the assistant from reading packages, preferences and browser data saved by the earlier internal build. File names use the new `armo-dma` prefix (see below).

## Knowledge object (`content/stage-*.mjs`)

```js
{
  id: 'PREP-AUT-01', version: 1, stage: 'prepare', workstream: 'automation', order: 10,
  phase: 'pre' | 'change' | 'post',               // transition steps only
  kind: 'check' | 'task' | 'decision' | 'gate',
  title, objective, why,                          // plain language; why is a string or a list of strings
  criticality: 'critical' | 'high' | 'medium' | 'low',
  applicability: null | { q } | { all: [...] } | { any: [...] } | { not: rule },   // declarative, never evaluated as code
  applicabilityNote, dependsOn: ['PREP-...'],
  roles: [], prerequisites: [], where: [{ portal, path }], when,
  steps: [],                                       // each a string or { text, bullets?: [], tip? }
  snippets: ['SNIPPET_ID'],                        // see content/snippets.mjs
  expected, interpret: [{ outcome, meaning }],
  record: [], evidence: [], remediation: [], rollback: [],
  sources: [{ id: 'move', supports: 'claim this source supports' }],
  provenance: 'official' | 'practice', confidence: 'high' | 'medium' | 'low',
  validation: 'docs-verified' | 'needs-review', caveats: [],   // needs-review requires caveats
  practiceNotes: [], testable: bool, changesState: bool, lastVerified: 'YYYY-MM-DD',
}
```

**Markup in reading text.** Text fields (not `title` and not `where` paths) may contain `**bold**`, links to other steps (`[[ITEM-ID]]` or `[[ITEM-ID|label]]`), links to pages of the assistant (`[[go:TARGET|label]]`) and buttons that act on the step (`[[do:ACTION|label]]`). The vocabulary lives in `content/markup.mjs`, the renderer in `src/ui/rich.js`, and the writing rules in [content-style-guide.md](content-style-guide.md). The renderer builds DOM nodes; it never parses HTML.

**Snippets** (`content/snippets.mjs`): `title, language, status ('verbatim'|'composed'), runIn, permissions, readOnly, cost, purpose, notDo, code, expected, caveats, sources`.

**Questions** (`content/questions.mjs`): `id, section, text, detail?, why, help, sources, showIf?`. `why` is shown as "Why we ask" and `help` as "Where to find the answer". `showIf` only controls whether a follow-up question is shown; it never hides items.

**Question sections**: `{ id, title, intro }`. 1.0 has six: your environment, data and connectors, detections and incidents, automation and integrations, access and permissions, and content and analyst workflows.

`scripts/validate-kb.mjs` checks referential integrity, minimum guidance quality and the writing rules: no long dashes, no bare item codes, no words from the plain-words list, known link targets and actions, labels on every page link and action, actions only in step content, `do:record-gate` only on gate steps, and valid step shapes. The build fails on any error.

## Applicability (three-valued logic)

`yes` gives true; `no` or `na` give false; unanswered or `unknown` give **unknown**. `all`, `any` and `not` follow Kleene logic.

| Result | Meaning |
|---|---|
| `applies` | Step in scope |
| `not_applicable` | Shown greyed out, with the derived reason |
| `unknown` | In scope, labelled "applicability uncertain" |

In full-checklist mode every step is `applies`. A reviewer override (`applies` or `not_applicable`) requires a reason and wins over answers.

Simplified mode adds to the knowledge base: `check.scope` (`needed` or `extra`, the 9 good-practice checks), `check.short` (`{ title, do[], proof, info? }`, where `info` is an optional explainer `{ title, lead?, points[], practice? }` opened from the ⓘ button; `practice: true` labels it as the makers' guidance, not Microsoft's), `workstream.mission` (`{ title, purpose }`), `question.core` (the six up-front questions) and `reference.readyTexts`. The window planner reads `reference.planning`: per phase, week ranges for `lean`, `smaller` and `larger` environments, the profile names and their explainer.

## Project (`armohub.dma.project`, schemaVersion 1)

```js
{
  schema, schemaVersion, id, createdAt, updatedAt, createdWith: { appVersion, kbVersion }, isDemo,
  meta: { name, organisation, operatorName, operatorRole, startDate, windowStart, windowEnd, notes,
          environments: [{ alias, kind, tenant, subscription, resourceGroup, region, owner, defender, notes }],  // defender: unknown | not_connected | primary | secondary; one primary per tenant
          workstreamOwners: { "<stage>:<workstream>": lead name }, workstreamPeople: { "<stage>:<workstream>": [{ name, covers }] },
          approvers: [{ role, name }], plannedPrimary (no tenants), plannedPrimaries: { "<tenant>": alias },
          showExtras: boolean (default true), ownersWanted: 'yes' | 'later' | '',
          planProfile: 'auto' | 'lean' | 'smaller' | 'larger' (default 'auto': suggested from the answers and the workspace list; an unknown value on import becomes 'auto'),
          people: [{ name, role }] (people added with "Add a new person" in a person list; up to 200, names unique regardless of case),
          inventoryChoice: 'import' | 'manual' | '' (how the workspaces were added during setup; '' for older projects),
          helpers: { mdc | urbac | tenants: { subjects: [{ label, answers: { [questionId]: optionId | [optionId] }, choice, person }], by, at } } },  // decision helpers; ids only, one subject per tenant for "tenants"
  mode: 'tailored' | 'full',
  guidance: 'simple' | 'detailed',   // how the plan is shown; a view only. Missing on import means 'detailed'.
  answers: { [questionId]: { value, reason, by, at } },
  checks: { [itemId]: { status, statusReason, owner, due, notes, evidenceIds, evidenceWaiver: { reason, by, at } | null, updatedAt, updatedBy, kbVersion, override, history: [...] } },  // "passed" needs evidence or an evidenceWaiver
  evidence: { [evidenceId]: { id, checkId, kind: 'image'|'note'|'link'|'file', origin: 'user'|'import', generated: boolean (notes built from your entries), title, text, url, fileName, mime, size, sha256, redactionConfirmed, createdAt, createdBy, stage } },
  register: [{ id, type: 'action'|'issue'|'risk'|'exception'|'decision', title, description, owner, due, severity, status, checkId, acceptedBy, acceptedRole, acceptedAt, rationale, createdAt, createdBy, updatedAt }],
  stages: { test: { availability: 'undecided'|'available'|'unavailable', reason, decidedBy, decidedAt } },
  gates: { [gateItemId]: { decision, decidedBy, decidedRole, rationale, at, history } },
  snapshots: [{ id, kind, title, createdAt, createdBy, appVersion, kbVersion, sha256, note, model }],
  audit: [{ at, by, action, detail, ref }],                 // capped at 5,000 entries
}
```

A "find out" action added from the questionnaire is an ordinary register item of type `action`, titled "Find out: " followed by the question.

**Statuses:**

| Status | Shown as | Rule |
|---|---|---|
| `not_started` | Not started | |
| `in_progress` | In progress | |
| `passed` | Passed, verified with evidence | **Requires at least one evidence item** |
| `not_verified` | Done, not verified (your word only) | |
| `failed` | Failed | Rationale required |
| `blocked` | Blocked | Rationale required |
| `needs_review` | Needs review | |
| `not_applicable` | Not applicable (with rationale) | Rationale required |

**Integrity rules** enforced in `src/core/model.js` and again on import (`src/core/schema.js`):
- A pass without evidence becomes `not_verified`.
- An exception counts as accepted only with a named person and a rationale.
- Gate decisions need a decision maker; `go_with_exceptions` and `no_go` also need a rationale.
- Timestamps are always "now" at the moment of the user's action. Nothing is back-dated or pre-filled.

## Settings (`armohub.dma.settings`, schemaVersion 1)

```js
{
  schema, schemaVersion,
  storageMode: 'none' | 'browser',          // default 'none': you save packages yourself
  theme: 'dark' | 'light' | 'system',       // default 'dark'
  density: 'comfortable' | 'compact',
  operatorName, operatorRole,
  welcomeSeen, introSeen,                   // introSeen becomes true once the introduction has been shown or skipped
  autoAdvance: bool,                        // default true: move on after Yes or No
  motion: 'system' | 'reduced',             // default 'system': follow the operating system
  disclaimerAcknowledgedAt, lastProjectId,
}
```

Unknown values fall back to the defaults. Importing a preferences file cannot switch on browser storage or acknowledge the disclaimer.

## Conclusion algorithm (`src/core/readiness.js`)

Computed for each stage over in-scope steps:
1. **Not ready:** any in-scope critical or high step failed or blocked without an accepted exception, or an open critical issue or risk.
2. **Unable to determine:** otherwise, any critical or high step not yet assessed, applicability still uncertain, or a critical step recorded only as an assertion.
3. **Ready with exceptions:** otherwise, if there are exceptions, high steps with an assertion only, or open medium or low steps.
4. **Ready:** everything is passed with evidence, or not applicable with a rationale.

The test stage reports **Not available** when it is marked unavailable. Gate decisions are always made by people.

## Project package (`.zip`, `armohub.dma.package` v1)

Saved as `armo-dma-<project>-<date>.zip`.

```
manifest.json        format, versions, createdAt/By, projectSha256, evidenceFiles[{ path, evidenceId, sha256, size, mime }], evidenceMissing[]
project.json         the project object above
evidence/<id>.<ext>  screenshot and file bytes
README.txt           contents and a sensitivity notice (the package is NOT encrypted)
```

Import is defensive (`src/core/package.js`, `src/core/zip.js`):
- ZIP safety: limits on entry count, size and compression ratio. Unsafe paths, encrypted entries and CRC mismatches are refused.
- The manifest hash must match `project.json`.
- Each evidence file must match its recorded SHA-256, and its type is sniffed from content. SVG, HTML and scripts are refused.
- `project.json` is rebuilt field by field from known keys. Forbidden keys (`__proto__`, `constructor`, `prototype`) are refused, strings are capped and enums are validated.
- Projects created by a newer schema version are refused, with a clear message.

## Other files the assistant writes

| File | Content |
|---|---|
| `armo-dma-<project>.json` | Project data export (attachments referenced, not included) |
| `armo-dma-<project>-checklist.csv` | One row per step |
| `armo-dma-<project>-register.csv` | The register |
| `armo-dma-<project>-evidence-index.csv` | The evidence index |
| `armo-dma-preferences.json` | Preferences (`armohub.dma.settings`), no project data |

## Inventory file (`armohub.dma.inventory` v1)

Produced by `tools/Get-ArMoSentinelInventory.ps1`, which sends GET requests only. It contains names and flags only (no queries, incidents or credentials):
- `analyticsRules[]`: name, kind, enabled, createIncident, groupingEnabled, reopenClosed, correlationTag, usesIdentityInfo, usesLegacyTI, productFilter, apiVersion
- `automationRules[]`: name, enabled, triggersOn, triggersWhen, riskyConditions, playbookActions, taskActions
- `dataConnectors[]`, `watchlists[]`, `errors[]`

The assistant maps the file to imported evidence notes on specific steps, and to "Yes" answer suggestions. A finding that is absent in one workspace never becomes "No".

## Schema evolution

- `migrateProject()` in `src/core/schema.js` is where version upgrades go. For example, add `if (raw.schemaVersion === 1) raw = upgrade1to2(raw)`, then bump `PROJECT_SCHEMA_VERSION`.
- Older projects stay readable. Older versions of the assistant refuse newer projects with a clear message.
- Steps that disappear from a later knowledge base stay in the project as historical data, and the import reports them.
