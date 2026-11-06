// The finale: the big celebration comes after the sign-off, the last step of the move, and nowhere earlier.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, recordGate, celebrationFor, moveSignedOff } from '../../src/core/model.js';
import { applicabilityMap } from '../../src/core/applicability.js';
import { missionOf, holdsSignOff } from '../../src/core/missions.js';

const fresh = () => createProject({ meta: { operatorName: 'Sam' } });
const check = (id) => KB.checks.find((c) => c.id === id);

test('the sign-off gets the finale; the change outcome gets a milestone; other decisions get none', () => {
  assert.equal(celebrationFor(check('VAL-18'), 'signed_off'), 'finale');
  assert.equal(celebrationFor(check('VAL-18'), 'signed_off_with_risks'), 'finale');
  assert.equal(celebrationFor(check('VAL-18'), 'not_signed_off'), null);
  assert.equal(celebrationFor(check('VAL-18'), 'deferred'), null);
  assert.equal(celebrationFor(check('TRN-17'), 'complete'), 'milestone');
  assert.equal(celebrationFor(check('TRN-17'), 'complete_with_exceptions'), 'milestone');
  assert.equal(celebrationFor(check('TRN-17'), 'rolled_back'), null);
  assert.equal(celebrationFor(check('PREP-PLN-05'), 'go'), null);
  assert.equal(celebrationFor(null, 'signed_off'), null);
});

test('the move counts as signed off only while the last sign-off says so', () => {
  const p = fresh();
  assert.equal(moveSignedOff(p), false);
  recordGate(p, 'TRN-17', { decision: 'complete', decidedBy: 'Jordan' });
  assert.equal(moveSignedOff(p), false, 'the change being complete is not the sign-off');
  recordGate(p, 'VAL-18', { decision: 'signed_off', decidedBy: 'Morgan' });
  assert.equal(moveSignedOff(p), true);
  recordGate(p, 'VAL-18', { decision: 'not_signed_off', decidedBy: 'Morgan', rationale: 'Two detections still fail.' });
  assert.equal(moveSignedOff(p), false, 'a later "not signed off" takes it back');
  recordGate(p, 'VAL-18', { decision: 'signed_off_with_risks', decidedBy: 'Morgan', rationale: 'Accepted by the CISO.' });
  assert.equal(moveSignedOff(p), true);
  assert.equal(moveSignedOff(null), false);
});

test('only the mission that holds the sign-off ends with the finale', () => {
  const p = fresh();
  const map = applicabilityMap(KB, p);
  const closure = missionOf(KB, p, 'validate', 'closure', map);
  assert.ok(closure.needed.some((r) => r.check.id === 'VAL-18'), 'the sign-off is a step of the closure mission');
  assert.equal(holdsSignOff(closure), true);
  assert.equal(holdsSignOff(missionOf(KB, p, 'transition', 'post-change', map)), false, 'the change outcome mission is not the end');
  assert.equal(holdsSignOff(null), false);
});
