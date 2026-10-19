// "Evidence not needed", workstream owners, approvers and the workspace inventory (1.0 feedback round).
import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { KB } from '../../content/kb.mjs';
import { createProject, setCheckStatus, setEvidenceWaiver, clearEvidenceWaiver, addEvidence, removeEvidence, setEnvironments, setWorkstreamOwners, setApprovers, effectiveOwner, knownPeople, setCheckField } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';
import { buildReportModel, itemsCsvRows } from '../../src/core/report.js';

const P1 = kb.checks[0];

test('"Passed" is allowed without evidence only when the team recorded that none is needed', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(setCheckStatus(p, P1, 'passed').ok, false);
  assert.equal(setEvidenceWaiver(p, P1.id, '  ').ok, false, 'a reason is required');
  assert.equal(setEvidenceWaiver(p, P1.id, 'Agreed in the kick-off').ok, true);
  const w = p.checks[P1.id].evidenceWaiver;
  assert.equal(w.reason, 'Agreed in the kick-off');
  assert.equal(w.by, 'Sam');
  assert.ok(w.at);
  assert.equal(setCheckStatus(p, P1, 'passed').ok, true);
  assert.ok(p.audit.some((a) => a.action === 'check.evidence_waived'));
});

test('withdrawing "evidence not needed" downgrades an unsupported pass', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEvidenceWaiver(p, P1.id, 'Not needed');
  setCheckStatus(p, P1, 'passed');
  clearEvidenceWaiver(p, P1.id);
  assert.equal(p.checks[P1.id].status, 'not_verified');
  assert.equal(p.checks[P1.id].evidenceWaiver, null);
});

test('removing the last evidence keeps a pass when no evidence was needed', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const ev = addEvidence(p, P1.id, { kind: 'note', title: 'n', text: 't' });
  setCheckStatus(p, P1, 'passed');
  setEvidenceWaiver(p, P1.id, 'Covered elsewhere');
  removeEvidence(p, ev.id);
  assert.equal(p.checks[P1.id].status, 'passed');
});

test('reports and CSV state "evidence not needed" as a decision, with the reason', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const c = KB.checks.find((x) => x.id === 'PREP-SCOPE-01');
  setEvidenceWaiver(p, c.id, 'Briefing done by email');
  setCheckStatus(p, c, 'passed');
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  const item = m.stages[0].groups.flatMap((g) => g.items).find((i) => i.id === c.id);
  assert.equal(item.verification, 'Passed, evidence not needed');
  assert.equal(item.evidenceWaiver.reason, 'Briefing done by email');
  const row = itemsCsvRows(KB, p).find((r) => r.id === c.id);
  assert.equal(row.evidence_not_needed, 'Briefing done by email');
});

test('a step shows its workstream owner unless it has its own', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const c = KB.checks.find((x) => x.id === 'PREP-ACC-01');
  setWorkstreamOwners(p, { 'prepare:access': 'IAM team', 'bad key': 'x', 'prepare:scope': '  ' });
  assert.deepEqual(p.meta.workstreamOwners, { 'prepare:access': 'IAM team' });
  assert.deepEqual(effectiveOwner(p, c), { name: 'IAM team', source: 'workstream' });
  setCheckField(p, c.id, 'owner', 'Robin');
  assert.deepEqual(effectiveOwner(p, c), { name: 'Robin', source: 'step' });
  const row = itemsCsvRows(KB, p).find((r) => r.id === 'PREP-ACC-02');
  assert.equal(row.owner, 'IAM team', 'CSV shows the inherited owner');
});

test('approvers and owners are offered as known people', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setApprovers(p, [{ role: 'SOC lead', name: 'Kim' }, { role: '', name: 'No role' }, { role: 'CAB', name: '' }]);
  assert.deepEqual(p.meta.approvers, [{ role: 'SOC lead', name: 'Kim' }]);
  setWorkstreamOwners(p, { 'prepare:access': 'IAM team' });
  assert.deepEqual(knownPeople(p), ['IAM team', 'Kim', 'Sam']);
});

test('the workspace inventory keeps its fields and allows one primary only', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(setEnvironments(p, [{ alias: 'A', defender: 'primary' }, { alias: 'B', defender: 'primary' }]).ok, false);
  assert.equal(setEnvironments(p, [{ alias: ' A ', kind: 'production', subscription: 'Sub-1', resourceGroup: 'rg', region: 'West Europe', owner: 'SOC', defender: 'primary' }, { alias: '', kind: 'test' }, { alias: 'B', kind: 'weird', defender: 'nope' }]).ok, true);
  assert.equal(p.meta.environments.length, 2, 'rows without an alias are dropped');
  assert.equal(p.meta.environments[0].alias, 'A');
  assert.equal(p.meta.environments[0].region, 'West Europe');
  assert.equal(p.meta.environments[1].kind, 'other');
  assert.equal(p.meta.environments[1].defender, 'unknown');
});

test('saved projects keep the new fields through import, and import rules still hold', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEnvironments(p, [{ alias: 'A', subscription: 'Sub-1', defender: 'secondary' }]);
  setWorkstreamOwners(p, { 'prepare:access': 'IAM team' });
  setApprovers(p, [{ role: 'SOC lead', name: 'Kim' }]);
  p.meta.plannedPrimary = 'A';
  setEvidenceWaiver(p, P1.id, 'Not needed');
  setCheckStatus(p, P1, 'passed');
  const raw = JSON.parse(JSON.stringify(p));
  raw.meta.workstreamOwners.__proto__ = 'x';
  raw.meta.workstreamOwners['prepare:<script>'] = 'x';
  const res = validateProject(raw, { kb });
  assert.equal(res.ok, true);
  const q = res.project;
  assert.deepEqual(q.meta.workstreamOwners, { 'prepare:access': 'IAM team' });
  assert.deepEqual(q.meta.approvers, [{ role: 'SOC lead', name: 'Kim' }]);
  assert.equal(q.meta.environments[0].subscription, 'Sub-1');
  assert.equal(q.meta.environments[0].defender, 'secondary');
  assert.equal(q.meta.plannedPrimary, 'A');
  assert.equal(q.checks[P1.id].status, 'passed', 'a pass with a recorded reason survives import');
  assert.equal(q.checks[P1.id].evidenceWaiver.reason, 'Not needed');
  // Without the reason, the same pass is downgraded as before.
  raw.checks[P1.id].evidenceWaiver = { reason: '   ' };
  assert.equal(validateProject(raw, { kb }).project.checks[P1.id].status, 'not_verified');
});

test('every step tool named in the knowledge base exists, and briefing and planning data are complete', () => {
  const tools = new Set(['workspaces', 'connection', 'primary', 'owners', 'briefing', 'window']);
  for (const c of KB.checks) if (c.tool) assert.ok(tools.has(c.tool), `${c.id}: ${c.tool}`);
  assert.ok(KB.checks.filter((c) => c.tool).length >= 6);
  const b = KB.reference.briefing;
  assert.ok(b.subject && b.changes.length >= 3 && b.same.length >= 2 && b.deadline);
  for (const id of b.sources) assert.ok(KB.sources.some((s) => s.id === id), id);
  const plan = KB.reference.planning;
  for (const ph of plan.phases) { assert.ok(ph.smaller[0] <= ph.smaller[1]); assert.ok(ph.larger[0] <= ph.larger[1]); }
  assert.match(plan.note, /not Microsoft guidance/);
});

test('one primary per tenant: two primaries are fine in different tenants', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(setEnvironments(p, [{ alias: 'A', tenant: 'EU', defender: 'primary' }, { alias: 'B', tenant: 'US', defender: 'primary' }]).ok, true);
  assert.equal(setEnvironments(p, [{ alias: 'A', tenant: 'EU', defender: 'primary' }, { alias: 'B', tenant: 'EU', defender: 'primary' }]).ok, false);
  assert.equal(p.meta.environments[1].tenant, 'US', 'a rejected change leaves the list as it was');
});
