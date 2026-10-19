import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { createProject, setAnswer, setCheckStatus, addEvidence, removeEvidence, addRegisterItem, acceptException, recordGate, setApplicabilityOverride, setTestAvailability } from '../../src/core/model.js';
import { evaluateApplicability, applicabilityMap, diffApplicability } from '../../src/core/applicability.js';
import { assessStage, dependencyStatus, nextAction } from '../../src/core/readiness.js';

const byId = (id) => kb.checks.find((c) => c.id === id);
const fresh = (mode = 'tailored') => { const p = createProject({ mode, appVersion: 't', kbVersion: 't' }); p.meta.operatorName = 'Test Operator'; return p; };

test('unknown or unanswered never hides a check (three-valued logic)', () => {
  const p = fresh();
  assert.equal(evaluateApplicability(byId('P-2'), p, kb).value, 'unknown');
  setAnswer(p, 'q_auto', 'unknown');
  const r = evaluateApplicability(byId('P-2'), p, kb);
  assert.equal(r.value, 'unknown');
  assert.match(r.reasons.join(' '), /uncertain/i);
  setAnswer(p, 'q_auto', 'no');
  assert.equal(evaluateApplicability(byId('P-2'), p, kb).value, 'not_applicable');
  setAnswer(p, 'q_auto', 'yes');
  assert.equal(evaluateApplicability(byId('P-2'), p, kb).value, 'applies');
});

test('any/not combinators follow Kleene logic', () => {
  const p = fresh();
  setAnswer(p, 'q_multi', 'no');
  assert.equal(evaluateApplicability(byId('P-3'), p, kb).value, 'unknown'); // no OR unknown = unknown
  setAnswer(p, 'q_itsm', 'yes');
  assert.equal(evaluateApplicability(byId('P-3'), p, kb).value, 'applies');
  assert.equal(evaluateApplicability(byId('P-4'), p, kb).value, 'applies'); // not(no)
  setAnswer(p, 'q_multi', 'na');
  assert.equal(evaluateApplicability(byId('P-4'), p, kb).value, 'applies'); // N/A behaves like "no"
});

test('full checklist mode shows everything, overrides need a reason and win', () => {
  const p = fresh('full');
  for (const c of kb.checks) assert.equal(evaluateApplicability(c, p, kb).value, 'applies');
  assert.equal(setApplicabilityOverride(p, 'P-2', 'not_applicable', '').ok, false);
  assert.equal(setApplicabilityOverride(p, 'P-2', 'not_applicable', 'No automation in this tenant').ok, true);
  const r = evaluateApplicability(byId('P-2'), p, kb);
  assert.equal(r.value, 'not_applicable');
  assert.equal(r.source, 'override');
});

test('answer change diff reports newly applicable and uncertain checks', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'no');
  const before = applicabilityMap(kb, p);
  setAnswer(p, 'q_auto', 'yes');
  const after = applicabilityMap(kb, p);
  assert.deepEqual(diffApplicability(before, after).appeared, ['P-2']);
  setAnswer(p, 'q_auto', 'unknown');
  assert.deepEqual(diffApplicability(after, applicabilityMap(kb, p)).uncertain, ['P-2']);
});

test('"passed" requires evidence; removing the last evidence downgrades to not verified', () => {
  const p = fresh();
  const c = byId('P-1');
  assert.equal(setCheckStatus(p, c, 'passed').ok, false);
  const ev = addEvidence(p, 'P-1', { kind: 'note', title: 'Observed', text: 'Workspace list shows 2 workspaces' });
  assert.equal(setCheckStatus(p, c, 'passed').ok, true);
  removeEvidence(p, ev.id);
  assert.equal(p.checks['P-1'].status, 'not_verified');
});

test('failed/blocked/not applicable need a rationale', () => {
  const p = fresh();
  assert.equal(setCheckStatus(p, byId('P-1'), 'failed').ok, false);
  assert.equal(setCheckStatus(p, byId('P-1'), 'failed', { reason: 'Operator lacks Security Administrator' }).ok, true);
});

test('readiness: unassessed critical → undetermined; failure → not ready; accepted exception → ready with exceptions', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'yes'); setAnswer(p, 'q_multi', 'no'); setAnswer(p, 'q_itsm', 'no');
  let a = assessStage(kb, p, 'prepare');
  assert.equal(a.level, 'undetermined');
  for (const id of ['P-1', 'P-2', 'P-4']) { addEvidence(p, id, { kind: 'note', title: 'ok', text: 'ok' }); setCheckStatus(p, byId(id), 'passed'); }
  a = assessStage(kb, p, 'prepare');
  assert.equal(a.level, 'ready', JSON.stringify(a.reasons));
  setCheckStatus(p, byId('P-2'), 'failed', { reason: 'Rules use the Incident provider condition' });
  a = assessStage(kb, p, 'prepare');
  assert.equal(a.level, 'not_ready');
  const reg = addRegisterItem(p, { type: 'exception', title: 'Accept provider-condition risk', checkId: 'P-2', severity: 'high' });
  assert.equal(acceptException(p, reg.id, { acceptedBy: '', rationale: 'x' }).ok, false, 'needs a named person');
  assert.equal(acceptException(p, reg.id, { acceptedBy: 'CISO Example', acceptedRole: 'CISO', rationale: 'Fixed post-transition, compensating monitoring' }).ok, true);
  a = assessStage(kb, p, 'prepare');
  assert.equal(a.level, 'ready_with_exceptions');
});

test('critical assertion-only item keeps readiness undetermined', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'no'); setAnswer(p, 'q_multi', 'no'); setAnswer(p, 'q_itsm', 'no');
  setCheckStatus(p, byId('P-1'), 'not_verified');
  addEvidence(p, 'P-4', { kind: 'note', title: 'ok', text: 'ok' }); setCheckStatus(p, byId('P-4'), 'passed');
  assert.equal(assessStage(kb, p, 'prepare').level, 'undetermined');
});

test('critical open issue in register blocks readiness', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'no'); setAnswer(p, 'q_multi', 'no'); setAnswer(p, 'q_itsm', 'no');
  for (const id of ['P-1', 'P-4']) { addEvidence(p, id, { kind: 'note', title: 'ok', text: 'ok' }); setCheckStatus(p, byId(id), 'passed'); }
  addRegisterItem(p, { type: 'issue', title: 'Data residency sign-off refused', severity: 'critical' });
  assert.equal(assessStage(kb, p, 'prepare').level, 'not_ready');
});

test('dependencies surface Stage 1 problems on Stage 2 tasks', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'yes');
  setCheckStatus(p, byId('P-2'), 'blocked', { reason: 'Waiting for export' });
  const d = dependencyStatus(kb, p, byId('T-1'), applicabilityMap(kb, p));
  assert.deepEqual(d.problems.map((x) => x.id), ['P-2']);
  assert.deepEqual(d.pending.map((x) => x.id), ['P-1']);
});

test('test-stage prerequisites count only when the test environment is available', () => {
  const k2 = { ...kb, checks: [...kb.checks, { id: 'X-T', stage: 'test', criticality: 'critical', title: 'Test outcome', applicability: null }, { id: 'X-G', stage: 'transition', criticality: 'critical', title: 'Go/no-go', applicability: null, dependsOn: ['X-T'] }] };
  const p = fresh();
  const gate = k2.checks.find((c) => c.id === 'X-G');
  assert.deepEqual(dependencyStatus(k2, p, gate, applicabilityMap(k2, p)).pending.map((d) => d.id), [], 'undecided test stage: not a prerequisite');
  setTestAvailability(p, 'available', '');
  assert.deepEqual(dependencyStatus(k2, p, gate, applicabilityMap(k2, p)).pending.map((d) => d.id), ['X-T']);
  setTestAvailability(p, 'unavailable', 'none');
  assert.deepEqual(dependencyStatus(k2, p, gate, applicabilityMap(k2, p)).pending.map((d) => d.id), []);
});

test('gates and test availability require names and reasons', () => {
  const p = fresh();
  assert.equal(recordGate(p, 'g1', { decision: 'go', decidedBy: '' }).ok, false);
  assert.equal(recordGate(p, 'g1', { decision: 'no_go', decidedBy: 'SOC Lead' }).ok, false);
  assert.equal(recordGate(p, 'g1', { decision: 'go', decidedBy: 'SOC Lead' }).ok, true);
  assert.equal(setTestAvailability(p, 'unavailable', '').ok, false);
  assert.equal(setTestAvailability(p, 'unavailable', 'No non-production tenant').ok, true);
  assert.equal(assessStage(kb, p, 'test').level, 'skipped');
});

test('next action picks the most critical open item of the earliest stage', () => {
  const p = fresh();
  const n = nextAction(kb, p);
  assert.equal(n.stageId, 'prepare');
  assert.equal(n.item.check.id, 'P-1');
});

test('audit log records who did what', () => {
  const p = fresh();
  setAnswer(p, 'q_auto', 'yes');
  const last = p.audit[p.audit.length - 1];
  assert.equal(last.by, 'Test Operator');
  assert.equal(last.action, 'answer.changed');
});
