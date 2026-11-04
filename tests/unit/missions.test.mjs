// Missions: Simplified mode's view of the plan, derived from the same checks and records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, setAnswer, setCheckStatus, addEvidence, setTestAvailability } from '../../src/core/model.js';
import { applicabilityMap, upfrontQuestions, visibleQuestions } from '../../src/core/applicability.js';
import { missionOf, missionsForStage, nextMission, firstOpenRow, missionContext, journey } from '../../src/core/missions.js';

const fresh = (opts = {}) => createProject({ meta: { operatorName: 'Sam' }, ...opts });

test('a mission holds its workstream\'s checks: needed first, extras apart, set-aside apart', () => {
  const p = fresh();
  const m = missionOf(KB, p, 'prepare', 'automation', applicabilityMap(KB, p));
  assert.equal(m.title, 'Get automation ready');
  assert.ok(m.needed.every((r) => r.check.scope === 'needed'));
  assert.deepEqual(m.extras.map((r) => r.check.id), ['PREP-AUT-06']);
  assert.equal(m.total, m.needed.length);
  assert.equal(m.done, 0);
});

test('done counts passed, not verified and does-not-apply; failed needs attention', () => {
  const p = fresh();
  const m0 = missionOf(KB, p, 'prepare', 'automation', applicabilityMap(KB, p));
  const [a, b, c] = m0.needed.map((r) => r.check);
  addEvidence(p, a.id, { kind: 'note', title: 'n', text: 't' }); setCheckStatus(p, a, 'passed');
  setCheckStatus(p, b, 'not_verified');
  setCheckStatus(p, c, 'failed', { reason: 'x' });
  const m = missionOf(KB, p, 'prepare', 'automation', applicabilityMap(KB, p));
  assert.equal(m.done, 2);
  assert.equal(m.attention, 1);
  assert.equal(firstOpenRow(m).check.id, c.id, 'a failed check is the next open row');
});

test('a mission asks the unanswered questions its checks depend on, once each, in any mission they affect', () => {
  const p = fresh();
  const appMap = applicabilityMap(KB, p);
  const ids = missionOf(KB, p, 'prepare', 'automation', appMap).questions.map((q) => q.id);
  assert.ok(ids.includes('playbooks'));
  assert.equal(new Set(ids).size, ids.length);
  const validateIds = missionOf(KB, p, 'validate', 'automation', appMap).questions.map((q) => q.id);
  assert.ok(validateIds.includes('playbooks'), 'the same question shows in every mission it affects');
  setAnswer(p, 'playbooks', 'no');
  const after = applicabilityMap(KB, p);
  assert.ok(!missionOf(KB, p, 'prepare', 'automation', after).questions.some((q) => q.id === 'playbooks'));
  assert.ok(!missionOf(KB, p, 'validate', 'automation', after).questions.some((q) => q.id === 'playbooks'), 'answered once, gone everywhere');
});

test('full-checklist projects get no mission questions', () => {
  const p = fresh({ mode: 'full' });
  assert.deepEqual(missionOf(KB, p, 'prepare', 'automation', applicabilityMap(KB, p)).questions, []);
});

test('a mission whose checks are all set aside is complete and skipped by Continue', () => {
  const p = fresh();
  for (const q of ['itsm', 'api_consumers', 'manual_incidents']) setAnswer(p, q, 'no');
  const appMap = applicabilityMap(KB, p);
  const m = missionOf(KB, p, 'prepare', 'integrations', appMap);
  assert.equal(m.total, 0);
  assert.equal(m.complete, true);
  assert.ok(m.setAside.length >= 1);
  const prep = missionsForStage(KB, p, 'prepare', appMap);
  for (const x of prep.slice(0, prep.findIndex((y) => y.workstream === 'integrations'))) {
    for (const r of x.needed) { addEvidence(p, r.check.id, { kind: 'note', title: 'n', text: 't' }); setCheckStatus(p, r.check, 'passed'); }
  }
  assert.notEqual(nextMission(KB, p, applicabilityMap(KB, p)).workstream, 'integrations');
});

test('an unused Test stage is never the next mission', () => {
  const p = fresh({ mode: 'full' });
  for (const c of KB.checks.filter((x) => x.stage === 'prepare')) { addEvidence(p, c.id, { kind: 'note', title: 'n', text: 't' }); setCheckStatus(p, c, 'passed'); }
  assert.equal(nextMission(KB, p, applicabilityMap(KB, p)).stage, 'transition', 'undecided counts as not used');
  setTestAvailability(p, 'unavailable', 'No test tenant');
  assert.equal(nextMission(KB, p, applicabilityMap(KB, p)).stage, 'transition');
});

test('Simplified asks only the six core questions up front; Detailed asks them all', () => {
  const p = fresh();
  assert.deepEqual(upfrontQuestions(KB, p).map((q) => q.id).sort(), ['data_residency', 'defender_xdr', 'multi_tenant', 'multi_workspace', 'sovereign_cloud', 'test_env']);
  p.guidance = 'detailed';
  assert.equal(upfrontQuestions(KB, p).length, visibleQuestions(KB, p).length);
});

test('a step opened from a mission knows its mission, its neighbours in it, and the mission after it', () => {
  const p = fresh({ guidance: 'simple' });
  const app = applicabilityMap(KB, p);
  const m = missionOf(KB, p, 'prepare', 'scope', app);
  const ids = [...m.needed, ...m.extras].map((r) => r.check.id);
  const first = missionContext(KB, p, ids[0], app);
  assert.equal(first.mission.key, 'prepare:scope');
  assert.equal(first.prev, null);
  assert.equal(first.next.id, ids[1]);
  const last = missionContext(KB, p, ids[ids.length - 1], app);
  assert.equal(last.next, null);
  const order = journey(KB, p, app).stages.flatMap((x) => x.missions).map((x) => x.key);
  assert.equal(last.after.key, order[order.indexOf('prepare:scope') + 1], 'the next mission in route order');
  assert.equal(missionContext(KB, { ...p, guidance: 'detailed' }, ids[0], app), null, 'Detailed keeps the step page as it is');
  setAnswer(p, 'all_connected', 'yes', 'test');
  const app2 = applicabilityMap(KB, p);
  assert.equal(missionContext(KB, p, 'PREP-SCOPE-03', app2), null, 'a set-aside step has no place in its mission');
});

test('the journey counts what is done in each mission and how many questions are still open', () => {
  const p = fresh({ guidance: 'simple' });
  const j = journey(KB, p, applicabilityMap(KB, p));
  const all = j.stages.flatMap((x) => x.missions);
  assert.ok(all.every((m) => Number.isInteger(m.done) && Number.isInteger(m.total) && Array.isArray(m.questions)));
  assert.ok(all.some((m) => m.questions.length > 0), 'some missions still have questions to answer');
});
