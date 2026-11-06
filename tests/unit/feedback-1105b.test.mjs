// Feedback of 5 November, second round: the sign-off choices, conclusions that credit a gate's review, the route
// marker at the end of the journey, and reminders to save when autosave is off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, setCheckStatus, recordGate, decisionsFor, APPROVED_DECISIONS, setPlanDepth } from '../../src/core/model.js';
import { topicPreset } from '../../src/core/depth.js';
import { applicabilityMap } from '../../src/core/applicability.js';
import { assessStage, routePosition } from '../../src/core/readiness.js';
import { saveReminderDue } from '../../src/core/reminders.js';

const fresh = () => { const p = createProject({ mode: 'tailored', guidance: 'simple', appVersion: 't', kbVersion: 't' }); p.meta.operatorName = 'Sam'; return p; };
const byId = (id) => KB.checks.find((c) => c.id === id);
// Marks every in-scope step of a stage done without proof (Done in Simplified), except its gate.
const doneWithoutProof = (p, stage) => {
  const app = applicabilityMap(KB, p);
  for (const c of KB.checks.filter((x) => x.stage === stage && x.kind !== 'gate' && app.get(x.id).value !== 'not_applicable')) setCheckStatus(p, c, 'not_verified');
};

test('the final sign-off has its own choices', () => {
  assert.deepEqual(decisionsFor(byId('VAL-18')).map((d) => d.id), ['signed_off', 'signed_off_with_risks', 'not_signed_off', 'deferred']);
  const p = fresh();
  assert.equal(recordGate(p, 'VAL-18', { decision: 'not_signed_off', decidedBy: 'Kim' }, { allowed: decisionsFor(byId('VAL-18')) }).ok, false, 'not signing off needs a reason');
  assert.equal(recordGate(p, 'VAL-18', { decision: 'signed_off_with_risks', decidedBy: 'Kim', rationale: 'Two workbooks pending' }, { allowed: decisionsFor(byId('VAL-18')) }).ok, true);
  assert.ok(APPROVED_DECISIONS.has('signed_off') && APPROVED_DECISIONS.has('signed_off_with_risks') && !APPROVED_DECISIONS.has('not_signed_off'));
});

test('steps done without proof keep a stage undetermined, until a named person accepts them at the stage gate', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  doneWithoutProof(p, 'prepare');
  const before = assessStage(KB, p, 'prepare');
  assert.equal(before.level, 'undetermined');
  recordGate(p, 'PREP-PLN-05', { decision: 'go', decidedBy: 'Kim', decidedRole: 'CISO' });
  const after = assessStage(KB, p, 'prepare');
  assert.equal(after.level, 'ready_with_exceptions', 'reviewed and accepted: a warning, not a reason to stay undetermined');
  assert.ok(after.reasons.exceptions.some((e) => /done without proof.*accepted at the stage gate by Kim/.test(e.text)));
  assert.ok(!after.reasons.undetermined.some((e) => e.id === 'PREP-PLN-05'), 'the gate decision itself counts as done');
  recordGate(p, 'PREP-PLN-05', { decision: 'no_go', decidedBy: 'Kim', rationale: 'Not ready' });
  assert.equal(assessStage(KB, p, 'prepare').level, 'undetermined', 'a No-go accepts nothing');
});

test('a Test stage left out by the plan reads as not part of the plan, not as missing', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  const t = assessStage(KB, p, 'test');
  assert.equal(t.level, 'skipped');
  assert.equal(t.label, 'Not part of your plan');
  assert.match(t.note, /chose not to include a test rehearsal/);
});

test('the route marker reaches the end when the journey is done, and says which gate holds it otherwise', () => {
  const stage = (id, gate) => ({ id, name: id, assessed: 5, inScope: 5, skipped: false, gateDone: gate === 'ok', gateNote: gate === 'ok' ? '' : gate });
  const done = routePosition([stage('prepare', 'Gate: No-go'), stage('test', 'ok'), stage('transition', 'ok'), stage('validate', 'ok')]);
  assert.equal(done.index, 4, 'a later approved gate puts the earlier ones behind you');
  const held = routePosition([stage('prepare', 'Gate: No-go'), { ...stage('test', 'ok'), skipped: true }, { ...stage('transition', 'ok'), assessed: 2 }, stage('validate', 'Gate decision to record')]);
  assert.equal(held.index, 0);
  assert.equal(held.note, 'Gate: No-go');
  const working = routePosition([stage('prepare', 'ok'), { ...stage('test', 'ok'), skipped: true }, { ...stage('transition', 'ok'), assessed: 1 }, stage('validate', '')]);
  assert.equal(working.index, 2);
  assert.ok(working.fraction > 0 && working.fraction < 1);
});

test('reminders to save come after ten minutes of unsaved work, and not again for fifteen', () => {
  const at = (min) => new Date(Date.UTC(2026, 10, 5, 9, min)).toISOString();
  const base = { manual: true, unexported: true, demo: false, unsavedSince: at(0), lastReminderAt: '', now: at(9) };
  assert.equal(saveReminderDue(base), false, 'not yet');
  assert.equal(saveReminderDue({ ...base, now: at(10) }), true);
  assert.equal(saveReminderDue({ ...base, now: at(20), lastReminderAt: at(10) }), false, 'snoozed');
  assert.equal(saveReminderDue({ ...base, now: at(26), lastReminderAt: at(10) }), true);
  assert.equal(saveReminderDue({ ...base, now: at(30), manual: false }), false, 'autosave keeps the work');
  assert.equal(saveReminderDue({ ...base, now: at(30), unexported: false }), false, 'nothing unsaved');
  assert.equal(saveReminderDue({ ...base, now: at(30), demo: true }), false, 'the demo is never saved');
});
