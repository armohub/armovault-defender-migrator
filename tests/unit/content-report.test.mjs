import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KB } from '../../content/kb.mjs';
import { validateKb } from '../../scripts/validate-kb.mjs';
import { parseInventory, analyseInventory } from '../../src/core/inventory.js';
import { buildReportModel, createSnapshot, verifySnapshot, itemsCsvRows } from '../../src/core/report.js';
import { createProject, setAnswer, addEvidence, setCheckStatus, addRegisterItem, acceptException, recordGate } from '../../src/core/model.js';
import { applicabilityMap } from '../../src/core/applicability.js';

test('knowledge base has no integrity errors and every item is guided and sourced', () => {
  const r = validateKb(KB);
  assert.deepEqual(r.errors, []);
  assert.ok(KB.checks.length >= 100);
  for (const c of KB.checks) {
    assert.ok(c.steps.length >= 1, `${c.id} steps`);
    assert.ok(c.sources.length >= 1, `${c.id} sources`);
  }
});

test('every snippet declares read-only status and every non-read-only change is flagged on its item', () => {
  for (const [id, s] of Object.entries(KB.snippets)) assert.equal(s.readOnly, true, `${id} should be read-only in release 1`);
  const writers = KB.checks.filter((c) => c.changesState);
  assert.ok(writers.length >= 5);
  assert.ok(writers.every((c) => c.kind === 'task'));
});

test('critical official items use high-confidence sources or are marked needs-review with caveats', () => {
  for (const c of KB.checks.filter((x) => x.criticality === 'critical')) {
    if (c.validation === 'needs-review') assert.ok(c.caveats.length > 0, c.id);
    else if (c.provenance === 'official') assert.equal(c.confidence, 'high', c.id);
  }
});

test('all source URLs are Microsoft Learn and carry verification dates', () => {
  for (const s of KB.sources) {
    assert.match(s.url, /^https:\/\/learn\.microsoft\.com\/en-us\//);
    assert.match(s.verified, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('questionnaire answers never remove critical items when unknown', () => {
  const p = createProject({ mode: 'tailored' });
  for (const q of KB.questions) setAnswer(p, q.id, 'unknown');
  const map = applicabilityMap(KB, p);
  for (const c of KB.checks) assert.notEqual(map.get(c.id).value, 'not_applicable', `${c.id} must not be hidden by unknown answers`);
});

test('inventory parsing and analysis maps findings to knowledge-base items and only suggests Yes', () => {
  const inv = parseInventory(fs.readFileSync('tests/fixtures-inventory.json', 'utf8'));
  const a = analyseInventory(inv);
  const ids = new Set(KB.checks.map((c) => c.id));
  for (const f of a.findings) assert.ok(ids.has(f.checkId), `${f.checkId} exists`);
  const by = (id) => a.findings.find((f) => f.checkId === id);
  assert.match(by('PREP-DET-02').text, /Advanced Multistage Attack Detection/);
  assert.match(by('PREP-DET-03').text, /Create incidents from MDC/);
  assert.match(by('PREP-DET-04').text, /Alert only rule/);
  assert.match(by('PREP-AUT-01').text, /Assign Defender incidents: IncidentProviderName/);
  assert.match(by('PREP-CON-02').text, /legacy/);
  assert.ok(a.suggestions.every((s) => s.value === 'yes'));
  const qids = new Set(KB.questions.map((q) => q.id));
  for (const s of a.suggestions) assert.ok(qids.has(s.questionId), s.questionId);
});

test('inventory parser rejects foreign or malformed files and caps strings', () => {
  assert.throws(() => parseInventory('not json'), /valid JSON/);
  assert.throws(() => parseInventory('{"schema":"something"}'), /not an inventory/);
  const inv = parseInventory(JSON.stringify({ schema: 'armohub.dma.inventory', schemaVersion: 1, analyticsRules: { name: 'x'.repeat(5000), kind: 'Fusion', enabled: true }, automationRules: [{ name: '<img src=x onerror=1>', riskyConditions: ['IncidentTitle', 'evil'] }] }));
  assert.equal(inv.analyticsRules.length, 1, 'single object accepted as one-element list');
  assert.equal(inv.analyticsRules[0].name.length, 300);
  assert.deepEqual(inv.automationRules[0].riskyConditions, ['IncidentTitle']);
});

test('report model reflects records faithfully and never invents approvals', async () => {
  const p = createProject({ mode: 'tailored' });
  p.meta.name = 'Report test';
  p.meta.operatorName = 'Tester';
  setAnswer(p, 'automation_rules', 'yes');
  const c = KB.checks.find((x) => x.id === 'PREP-SCOPE-01');
  addEvidence(p, c.id, { kind: 'note', title: 'Briefing', text: 'Done' });
  setCheckStatus(p, c, 'passed');
  setCheckStatus(p, KB.checks.find((x) => x.id === 'PREP-AUT-01'), 'failed', { reason: 'Provider conditions found' });
  const r = addRegisterItem(p, { type: 'exception', title: 'Accept', checkId: 'PREP-AUT-01', severity: 'high' });
  acceptException(p, r.id, { acceptedBy: 'CISO Example', acceptedRole: 'CISO', rationale: 'Temporary' });
  const m = buildReportModel('prepare', KB, p, { appVersion: 'test' });
  const items = m.stages[0].groups.flatMap((g) => g.items);
  assert.equal(items.find((i) => i.id === 'PREP-SCOPE-01').verification, 'Verified, evidence attached');
  const aut = items.find((i) => i.id === 'PREP-AUT-01');
  assert.equal(aut.status, 'failed');
  assert.equal(aut.exceptions[0].acceptedBy, 'CISO Example');
  const gate = m.gates.find((g) => g.id === 'PREP-PLN-05');
  assert.equal(gate.decision, '', 'no decision recorded → none reported');
  assert.equal(gate.decidedBy, '');
  recordGate(p, 'PREP-PLN-05', { decision: 'go', decidedBy: 'SOC Lead Example' });
  const m2 = buildReportModel('prepare', KB, p, { appVersion: 'test' });
  assert.equal(m2.gates.find((g) => g.id === 'PREP-PLN-05').decidedBy, 'SOC Lead Example');
  assert.ok(m.sources.length > 0);
  assert.ok(m.stages[0].outOfScope.every((o) => o.reason.length > 0));
});

test('snapshots are fingerprinted and tampering is detected', async () => {
  const p = createProject({ mode: 'full' });
  p.meta.name = 'Snap';
  const s = await createSnapshot('final', KB, p, { appVersion: 'test', note: 'milestone' });
  assert.equal(await verifySnapshot(s), true);
  s.model.project.name = 'Changed';
  assert.equal(await verifySnapshot(s), false);
});

test('CSV rows cover every item', () => {
  const p = createProject({ mode: 'full' });
  const rows = itemsCsvRows(KB, p);
  assert.equal(rows.length, KB.checks.length);
});
