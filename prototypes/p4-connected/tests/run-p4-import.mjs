// P4 import test: can the offline app take the evidence note the connected page exports?
// Uses the REAL offline-app model and project validator (src/core, read-only use) and the real knowledge base, with the
// proposed parser in ../evidence-format.mjs. The sample note is produced by run-p4-browser.mjs (mocked tenant).
// Run: node prototypes/p4-connected/tests/run-p4-import.mjs
import fs from 'node:fs';
import path from 'node:path';
import { KB } from '../../../content/kb.mjs';
import { createProject, addEvidence } from '../../../src/core/model.js';
import { validateProject } from '../../../src/core/schema.js';
import { parseConnectedEvidence, CONNECTED_CHECK_IDS } from '../evidence-format.mjs';
import { P4_DIR, writeResults, makeChecker } from './lib.mjs';

const results = { probe: 'P4 evidence import into the offline model', ranAt: new Date().toISOString() };
const check = makeChecker(results);
const sampleText = fs.readFileSync(path.join(P4_DIR, 'p4-sample-evidence-note.json'), 'utf8');
const knownCheckIds = KB.checks.map((c) => c.id);

// I1 the targets exist in the knowledge base
const targets = CONNECTED_CHECK_IDS.map((id) => KB.checks.find((c) => c.id === id));
check('I1', 'TRN-13 and VAL-12 exist in the release-1 knowledge base', targets.every(Boolean), targets.map((c) => c && `${c.id} ${c.title}`));

// I2 parse the exported note
const parsed = parseConnectedEvidence(sampleText, { knownCheckIds });
check('I2', 'the exported note parses: 2 findings, 2 allowed requests, no warnings', parsed.findings.length === 2 && parsed.requests.length === 2 && parsed.warnings.length === 0, { findings: parsed.findings.map((f) => `${f.checkId}: ${f.title}`), requests: parsed.requests.map((r) => `${r.line} -> ${r.httpStatus}`), warnings: parsed.warnings });

// I3 apply to a project exactly as the inventory import does (src/ui/inventory.js): evidence notes, origin "import"
const p = createProject({ appVersion: '0.9.0-rc.1', kbVersion: KB.meta ? KB.meta.version : 'kb' });
p.meta.operatorName = 'P4 test';
for (const f of parsed.findings) {
  const stage = KB.checks.find((c) => c.id === f.checkId).stage;
  addEvidence(p, f.checkId, { kind: 'note', title: f.title, text: f.text, origin: 'import', stage }, 'kb');
}
const evs = Object.values(p.evidence);
check('I3', 'findings become imported evidence notes; check statuses are not changed', evs.length === 2 && evs.every((e) => e.kind === 'note' && e.origin === 'import') && CONNECTED_CHECK_IDS.every((id) => p.checks[id].status === 'not_started'), evs.map((e) => ({ checkId: e.checkId, kind: e.kind, origin: e.origin, stage: e.stage, status: p.checks[e.checkId].status })));

// I4 the project survives the app's own import validator (as when a saved package is reopened)
const v = validateProject(JSON.parse(JSON.stringify(p)), { kb: KB });
const kept = Object.values(v.project.evidence);
check('I4', 'validateProject keeps both notes (origin "import", text intact, statuses unchanged)', v.ok && kept.length === 2 && kept.every((e) => e.origin === 'import' && parsed.findings.some((f) => f.text === e.text)) && CONNECTED_CHECK_IDS.every((id) => v.project.checks[id].status === 'not_started'), { ok: v.ok, errors: v.errors, warnings: v.warnings });

// I5 hostile or malformed notes
const sample = JSON.parse(sampleText);
const variant = (mutate) => { const o = JSON.parse(sampleText); mutate(o); return JSON.stringify(o); };
const tryParse = (text) => { try { const r = parseConnectedEvidence(text, { knownCheckIds }); return { findings: r.findings.map((f) => f.checkId), warnings: r.warnings.length, titleLen: r.findings[0] && r.findings[0].title.length }; } catch (e) { return { error: e.message }; } };
const hostile = {
  notJson: tryParse('<html>'),
  wrongSchema: tryParse(variant((o) => { o.schema = 'armohub.dma.inventory'; })),
  futureVersion: tryParse(variant((o) => { o.schemaVersion = 2; })),
  notReadOnly: tryParse(variant((o) => { delete o.readOnly; })),
  tooLarge: tryParse(variant((o) => { o.pad = 'x'.repeat(1100000); })),
  withBom: tryParse('\uFEFF' + sampleText),
  protoCheckId: tryParse(variant((o) => { o.findings.push({ checkId: '__proto__', title: 't', text: 'x' }); })),
  otherCheckId: tryParse(variant((o) => { o.findings.push({ checkId: 'TRN-01', title: 'Gate passed', text: 'Approved by connected mode' }); })),
  duplicateCheck: tryParse(variant((o) => { o.findings.push({ ...sample.findings[0] }); })),
  hugeTitle: tryParse(variant((o) => { o.findings[0].title = 'T'.repeat(10000); })),
  manyFindings: tryParse(variant((o) => { for (let i = 0; i < 60; i++) o.findings.push({ checkId: 'VAL-12', title: 't', text: 'x' }); })),
  unexpectedRequest: tryParse(variant((o) => { o.requests.push({ method: 'PATCH', url: 'https://graph.microsoft.com/v1.0/security/incidents/1', httpStatus: 200 }); })),
  nonObjectFinding: tryParse(variant((o) => { o.findings.unshift('text', null, 5); })),
  protoPollutionKey: tryParse(sampleText.replace('"readOnly": true', '"__proto__": {"polluted": 1}, "readOnly": true')),
};
const polluted = ({}).polluted;
results.hostile = hostile;
check('I5', 'malformed, oversized, wrong-schema, non-read-only and status-claiming notes are refused or trimmed', !!hostile.notJson.error && !!hostile.wrongSchema.error && !!hostile.futureVersion.error && !!hostile.notReadOnly.error && !!hostile.tooLarge.error
  && hostile.withBom.findings.length === 2 && hostile.protoCheckId.findings.length === 2 && hostile.protoCheckId.warnings === 1 && hostile.otherCheckId.findings.join() === 'TRN-13,VAL-12' && hostile.otherCheckId.warnings === 1
  && hostile.duplicateCheck.findings.length === 2 && hostile.hugeTitle.titleLen === 300 && hostile.manyFindings.findings.length === 2 && hostile.manyFindings.warnings >= 1
  && hostile.unexpectedRequest.warnings === 1 && hostile.nonObjectFinding.findings.length === 2 && hostile.protoPollutionKey.findings.length === 2 && polluted === undefined, hostile);

// I6 what the offline app would still need (not built here, src/ is unchanged)
results.requiredAppChanges = [
  'src/core/connected-evidence.js (this parser) + unit tests',
  'src/ui: an "Import connected-mode evidence note" action next to the inventory import, with the same preview-and-tick dialog',
  'show requests, collectedAt, tenant alias and warnings in the import dialog; attach the original JSON as a file evidence item on TRN-13',
  'no change to the CSP, storage or network behaviour of the offline file',
];

results.summary = { passed: results.checks.filter((c) => c.pass).length, failed: results.checks.filter((c) => !c.pass).map((c) => c.id) };
console.log(JSON.stringify(results.summary));
console.log('written', writeResults('p4-import-results', results));
