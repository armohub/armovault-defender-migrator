// Additions from the comparison with public migration guides (October 2026): a Defender table cost
// review that first says nothing is lost, fewer-incidents guidance, a default-access review, practical
// tips labelled as practice, explainers checked by the validator, and a small-team planning profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { kb } from './fixtures.mjs';
import { validateKb } from '../../scripts/validate-kb.mjs';
import { createProject, setPlanProfile } from '../../src/core/model.js';
import { planProfile, suggestedProfile } from '../../src/core/planning.js';
import { validateProject } from '../../src/core/schema.js';

const byId = (id) => KB.checks.find((c) => c.id === id);

test('a good-practice check reviews the Defender tables streamed into Sentinel, and says first that nothing is lost', () => {
  const c = byId('PREP-CON-08');
  assert.ok(c, 'the check exists');
  assert.equal(c.scope, 'extra');
  assert.deepEqual(c.applicability, { q: 'defender_xdr' });
  assert.match(c.short.info.lead, /Nothing is deleted/);
  assert.ok(c.short.info.points.some((x) => /30 days/.test(x)), 'Defender keeps its own copy for 30 days');
  assert.ok(c.short.info.points.some((x) => /retention/.test(x)), 'data already in Sentinel stays until its retention ends');
  assert.ok(c.short.info.points.some((x) => /rules, workbooks or hunting/.test(x)), 'keep tables that Sentinel still uses');
  for (const id of ['retention', 'ah', 'defportal']) assert.ok(c.sources.some((s) => s.id === id), id);
  assert.ok(c.snippets.includes('K_DEFENDER_TABLE_INGESTION'));
});

test('validation explains that fewer incidents after the move is expected', () => {
  for (const id of ['VAL-04', 'TRN-13']) {
    const c = byId(id);
    assert.match(c.short.info.lead, /fewer incidents/i, id);
    assert.ok(c.sources.some((s) => s.id === 'correlation'), id);
  }
  assert.match(byId('PREP-PLN-02').short.do.join(' '), /alerts per rule/);
});

test('access mapping reviews the Entra roles with default Defender portal access', () => {
  const c = byId('PREP-ACC-02');
  const text = JSON.stringify(c.steps);
  for (const role of ['Global Administrator', 'Security Administrator', 'Security Operator', 'Global Reader', 'Security Reader']) assert.ok(text.includes(role), role);
  assert.ok(c.sources.some((s) => s.id === 'xdrroles'));
  assert.ok(c.short.info && c.short.info.points.length);
});

test('practical tips are labelled as practice: a mid-week cutover and the training window', () => {
  const t = byId('TRN-10').short.info;
  assert.equal(t.practice, true);
  assert.match(t.points.join(' '), /Friday/);
  assert.ok(byId('TRN-10').practiceNotes.some((x) => /Friday/.test(x)));
  assert.match(byId('PREP-OPS-03').short.info.points.join(' '), /31 March 2027/);
});

test('the validator checks info explainers', () => {
  const k2 = structuredClone(KB);
  k2.checks[0].short.info = { title: '', points: [] };
  const r = validateKb(k2);
  assert.ok(r.errors.some((e) => e.includes('info')), r.errors.join('\n'));
  assert.deepEqual(validateKb(KB).errors, []);
});

test('the planner suggests a small-team profile for one simple workspace, and you can override it', () => {
  const p = createProject({ meta: { operatorName: 'Sam', environments: [{ alias: 'A', kind: 'production' }] } });
  for (const id of ['multi_workspace', 'multi_tenant', 'playbooks', 'itsm']) p.answers[id] = { value: 'no' };
  assert.equal(suggestedProfile(p), 'lean');
  p.answers.playbooks = { value: 'yes' };
  assert.equal(suggestedProfile(p), 'smaller', 'one sign of a bigger environment is not enough for the longer ranges');
  p.answers.itsm = { value: 'yes' };
  assert.equal(suggestedProfile(p), 'larger', 'two signs together are');
  delete p.answers.playbooks;
  delete p.answers.itsm;
  delete p.answers.multi_workspace;
  assert.equal(suggestedProfile(p), 'smaller', 'not answered yet: the middle ranges');
  assert.equal(planProfile(p), 'smaller', 'automatic by default');
  assert.equal(setPlanProfile(p, 'lean').ok, true);
  assert.equal(planProfile(p), 'lean');
  assert.equal(setPlanProfile(p, 'huge').ok, false);
  const plan = KB.reference.planning;
  for (const ph of plan.phases) { assert.ok(ph.lean[0] <= ph.lean[1], ph.id); assert.ok(ph.lean[1] <= ph.smaller[1], ph.id); }
  assert.ok(plan.lean && plan.profiles);
});

test('the plan profile survives import, and bad values fall back to automatic', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(p.meta.planProfile, 'auto');
  setPlanProfile(p, 'larger');
  const raw = JSON.parse(JSON.stringify(p));
  assert.equal(validateProject(raw, { kb }).project.meta.planProfile, 'larger');
  raw.meta.planProfile = 'x';
  assert.equal(validateProject(raw, { kb }).project.meta.planProfile, 'auto');
});
