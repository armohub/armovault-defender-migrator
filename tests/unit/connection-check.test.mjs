// The connection check: a secondary needs a primary in its tenant, the "already connected" answer follows the
// check, and when every production workspace is connected the plan can focus on checking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, setEnvironments, setAnswer, connectionState, syncConnectionAnswer, tenantConnected } from '../../src/core/model.js';
import { applicabilityMap, visibleQuestions, upfrontQuestions } from '../../src/core/applicability.js';
import { missionsForStage } from '../../src/core/missions.js';

const fresh = (guidance = 'simple') => { const p = createProject({ mode: 'tailored', guidance, appVersion: 't', kbVersion: 't' }); p.meta.operatorName = 'Sam'; return p; };
const CONNECT_STEPS = ['PREP-ACC-01', 'PREP-SCOPE-03', 'TRN-01', 'TRN-02', 'TRN-03', 'TRN-04', 'TRN-05', 'TRN-06', 'TRN-07', 'TRN-08', 'TRN-09', 'TRN-10', 'TRN-11'];

test('a connected secondary needs a primary in the same tenant', () => {
  const p = fresh();
  const lone = setEnvironments(p, [{ alias: 'SOC-A', defender: 'secondary' }, { alias: 'SOC-B', defender: 'not_connected' }]);
  assert.equal(lone.ok, false);
  assert.match(lone.error, /SOC-A .*needs a primary/);
  assert.equal((p.meta.environments || []).length, 0, 'nothing was saved');
  assert.equal(setEnvironments(p, [{ alias: 'SOC-A', defender: 'secondary' }, { alias: 'SOC-B', defender: 'primary' }]).ok, true);
  const perTenant = setEnvironments(p, [{ alias: 'EU-1', tenant: 'EU', defender: 'primary' }, { alias: 'US-1', tenant: 'US', defender: 'secondary' }]);
  assert.equal(perTenant.ok, false, 'a primary in another tenant does not count');
  assert.match(perTenant.error, /in US/);
});

test('the connection state counts production workspaces for "all connected"', () => {
  const p = fresh();
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'primary' }, { alias: 'PROD-2', defender: 'secondary' }, { alias: 'LAB', kind: 'test', defender: 'not_connected' }]);
  assert.deepEqual(connectionState(p), { any: true, all: true, checked: true });
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'primary' }, { alias: 'PROD-2', defender: 'not_connected' }]);
  assert.equal(connectionState(p).all, false);
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'unknown' }]);
  assert.deepEqual(connectionState(p), { any: false, all: false, checked: false });
});

test('"Is any workspace already connected?" follows the connection check', () => {
  const p = fresh();
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'unknown' }]);
  syncConnectionAnswer(p);
  assert.equal(p.answers.onboarded_any, undefined, 'nothing checked yet, nothing answered');
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'not_connected' }]);
  syncConnectionAnswer(p);
  assert.equal(p.answers.onboarded_any.value, 'no');
  setEnvironments(p, [{ alias: 'PROD-1', defender: 'primary' }]);
  syncConnectionAnswer(p);
  assert.equal(p.answers.onboarded_any.value, 'yes');
  assert.match(p.answers.onboarded_any.reason, /connection check/);
});

test('focusing on checking sets aside the steps for connecting, and keeps the checks after the change', () => {
  const p = fresh();
  const before = applicabilityMap(KB, p);
  // Steps that also depend on other answers are uncertain until those are answered; none is set aside.
  for (const id of CONNECT_STEPS) assert.notEqual(before.get(id).value, 'not_applicable', `${id} stays while nothing says all are connected`);
  for (const id of ['PREP-ACC-01', 'TRN-10', 'TRN-11']) assert.equal(before.get(id).value, 'applies', `${id} applies, not uncertain`);
  setAnswer(p, 'all_connected', 'yes', 'From the connection check');
  const after = applicabilityMap(KB, p);
  for (const id of CONNECT_STEPS) {
    assert.equal(after.get(id).value, 'not_applicable', `${id} is set aside`);
    assert.match(after.get(id).reasons.join(' '), /already connected/i);
  }
  for (const id of ['TRN-12', 'TRN-13', 'TRN-14', 'TRN-16', 'PREP-SCOPE-04', 'PREP-ACC-05', 'VAL-01', 'VAL-18']) assert.equal(after.get(id).value, 'applies', `${id} stays`);
  setAnswer(p, 'all_connected', 'no', 'Not every workspace is connected');
  assert.equal(applicabilityMap(KB, p).get('TRN-10').value, 'applies');
});

test('the derived answer is never asked, in the questions or in a mission', () => {
  const p = fresh('detailed');
  assert.ok(KB.questions.find((q) => q.id === 'all_connected'), 'the knowledge base defines it');
  assert.ok(!visibleQuestions(KB, p).some((q) => q.id === 'all_connected'));
  assert.ok(!upfrontQuestions(KB, p).some((q) => q.id === 'all_connected'));
  const s = fresh('simple');
  for (const stage of ['prepare', 'transition']) {
    for (const m of missionsForStage(KB, s, stage, applicabilityMap(KB, s))) assert.ok(!m.questions.some((q) => q.id === 'all_connected'), `${m.title} does not ask it`);
  }
});

test('"who connects" is not needed for a tenant whose workspaces are all connected', () => {
  const p = fresh();
  setEnvironments(p, [{ alias: 'EU-1', tenant: 'EU', defender: 'primary' }, { alias: 'US-1', tenant: 'US', defender: 'not_connected' }]);
  assert.equal(tenantConnected(p, 'EU'), true);
  assert.equal(tenantConnected(p, 'US'), false);
  assert.equal(tenantConnected(p, 'Unknown'), false, 'a tenant without workspaces is not connected');
});
