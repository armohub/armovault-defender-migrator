// Plan depth: four tags per step, three levels of thoroughness and three topics, applied after tailoring.
// Questions are tagged by the most important step they decide, asked most important first, and not asked
// when nothing they decide is in the plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, setAnswer, setApplicabilityOverride, setPlanDepth, setTestAvailability } from '../../src/core/model.js';
import { applicabilityMap, upfrontQuestions, visibleQuestions } from '../../src/core/applicability.js';
import { tierOf, topicsOf, planOf, topicPreset, questionImportance } from '../../src/core/depth.js';
import { missionsForStage } from '../../src/core/missions.js';
import { validateProject } from '../../src/core/schema.js';
import { buildReportModel } from '../../src/core/report.js';

const fresh = (o = {}) => { const p = createProject({ mode: 'tailored', guidance: 'detailed', appVersion: 't', kbVersion: 't', ...o }); p.meta.operatorName = 'Sam'; return p; };
const leftOut = (p) => [...applicabilityMap(KB, p)].filter(([, a]) => a.source === 'plan').map(([id]) => id);
const byId = (id) => KB.checks.find((c) => c.id === id);
const q = (id) => KB.questions.find((x) => x.id === id);
const RANK = { must: 0, important: 1, optional: 2 };
const ALL_ON = { backups: true, rehearsal: true, verification: true };

test('every step has one of four tags, straight from the knowledge base', () => {
  const n = {};
  for (const c of KB.checks) n[tierOf(c)] = (n[tierOf(c)] || 0) + 1;
  assert.deepEqual(n, { must: 34, recommended: 45, useful: 22, extra: 9 });
  assert.deepEqual(topicsOf(byId('TRN-09')), ['backups']);
  assert.deepEqual(topicsOf(byId('VAL-03')).sort(), ['backups', 'verification']);
  assert.deepEqual(topicsOf(byId('TEST-04')), ['rehearsal']);
  assert.deepEqual(topicsOf(byId('PREP-SCOPE-02')), []);
});

test('projects without a plan keep every step: Thorough with every topic on', () => {
  const p = fresh();
  assert.deepEqual(planOf(p), { depth: 'thorough', topics: ALL_ON });
  assert.deepEqual(leftOut(p), []);
  assert.deepEqual(topicPreset('essentials'), { backups: false, rehearsal: false, verification: false });
  assert.deepEqual(topicPreset('recommended'), ALL_ON);
});

test('Essentials keeps the must-do steps and leaves the rest out with a reason', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  const app = applicabilityMap(KB, p);
  for (const c of KB.checks.filter((x) => tierOf(x) === 'must' && x.stage !== 'test')) assert.notEqual(app.get(c.id).source, 'plan', `${c.id} is must-do`);
  const out = app.get('PREP-CON-05');
  assert.equal(out.value, 'not_applicable');
  assert.match(out.reasons[0], /Left out by your plan/);
  assert.match(out.reasons[0], /Project setup/);
  assert.ok(KB.checks.filter((c) => c.stage === 'test').every((c) => app.get(c.id).value === 'not_applicable'), 'no test rehearsal: the Test stage is left out');
  assert.equal(p.stages.test.availability, 'unavailable');
  assert.ok(KB.checks.filter((c) => tierOf(c) === 'extra' && !topicsOf(c).length).every((c) => app.get(c.id).source === 'plan'), 'no good-practice extras in Essentials');
});

test('Recommended keeps must-do, recommended and the extras, and leaves useful steps out unless a topic keeps them', () => {
  const p = fresh();
  setPlanDepth(p, 'recommended', topicPreset('recommended'));
  const app = applicabilityMap(KB, p);
  for (const c of KB.checks) {
    const plan = app.get(c.id).source === 'plan';
    if (tierOf(c) === 'useful' && !topicsOf(c).length) assert.ok(plan, `${c.id} is useful and left out`);
    else assert.ok(!plan, `${c.id} stays`);
  }
});

test('a topic switched on keeps its steps whatever their tag; switched off, it leaves its non-must steps out', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', { backups: true, rehearsal: false, verification: false });
  let app = applicabilityMap(KB, p);
  assert.notEqual(app.get('PREP-CON-05').source, 'plan', 'a recommended baseline kept by the backups topic');
  assert.notEqual(app.get('PREP-DET-07').source, 'plan', 'a useful baseline kept too');
  assert.equal(app.get('VAL-05').source, 'plan', 'extra verification is off');
  assert.notEqual(app.get('VAL-01').source, 'plan', 'must-do verification stays');
  setPlanDepth(p, 'thorough', { backups: false, rehearsal: true, verification: false });
  app = applicabilityMap(KB, p);
  assert.equal(app.get('TRN-09').source, 'plan', 'the pre-change snapshot is left out with backups off');
  assert.match(app.get('TRN-09').reasons[0], /backups and baselines/);
  assert.notEqual(app.get('TRN-03').source, 'plan', 'the configuration backup is must-do and stays');
  assert.notEqual(app.get('VAL-03').source, 'plan', 'must-do, in two topics that are off');
  assert.equal(app.get('VAL-11').source, 'plan');
  assert.notEqual(app.get('PREP-CNT-04').source, 'plan', 'Thorough keeps steps outside the topics');
});

test('answers, reviewer decisions and the full checklist come before the plan', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  setAnswer(p, 'mdc', 'no');
  assert.equal(applicabilityMap(KB, p).get('PREP-CON-02').source, 'answers', 'the more specific reason wins');
  setApplicabilityOverride(p, 'PREP-CON-05', 'applies', 'We want the baseline', 't');
  assert.equal(applicabilityMap(KB, p).get('PREP-CON-05').value, 'applies');
  const f = fresh({ mode: 'full' });
  setPlanDepth(f, 'essentials', topicPreset('essentials'));
  assert.deepEqual(leftOut(f), []);
});

test('switching the test rehearsal back on lets the test question decide again; a stage skipped for another reason stays skipped', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  setPlanDepth(p, 'essentials', { ...topicPreset('essentials'), rehearsal: true });
  assert.equal(p.stages.test.availability, 'undecided');
  const s = fresh();
  setTestAvailability(s, 'unavailable', 'No lab tenant');
  setPlanDepth(s, 'thorough', ALL_ON);
  assert.equal(s.stages.test.availability, 'unavailable');
  assert.equal(s.stages.test.reason, 'No lab tenant');
});

test('questions are tagged by the most important step they decide, asked most important first, and not asked when nothing they decide is in the plan', () => {
  const p = fresh();
  assert.equal(questionImportance(KB, p, q('multi_workspace')), 'must');
  assert.equal(questionImportance(KB, p, q('multi_tenant')), 'important');
  assert.equal(questionImportance(KB, p, q('watchlists')), 'optional');
  assert.equal(questionImportance(KB, p, q('onboarded_any')), 'must', 'it informs the connection check');
  const order = upfrontQuestions(KB, p).map((x) => RANK[questionImportance(KB, p, x)]);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'must, then important, then optional');
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  assert.equal(questionImportance(KB, p, q('multi_tenant')), 'hidden');
  const ids = visibleQuestions(KB, p).map((x) => x.id);
  for (const id of ['multi_tenant', 'watchlists', 'test_env', 'test_separate_tenant']) assert.ok(!ids.includes(id), `${id} is not asked`);
  for (const id of ['multi_workspace', 'defender_xdr', 'automation_rules']) assert.ok(ids.includes(id), `${id} is asked`);
  const s = fresh({ guidance: 'simple' });
  setPlanDepth(s, 'essentials', topicPreset('essentials'));
  for (const stage of ['prepare', 'transition', 'validate']) {
    for (const m of missionsForStage(KB, s, stage, applicabilityMap(KB, s))) assert.ok(m.questions.every((x) => questionImportance(KB, s, x) !== 'hidden'), `${m.title} asks only what matters`);
  }
  assert.ok(upfrontQuestions(KB, s).length < 6, 'Simplified asks fewer of its core questions in Essentials');
});

test('the plan survives a project package, and odd values fall back to keeping every step', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', { backups: true, rehearsal: false, verification: false });
  const raw = JSON.parse(JSON.stringify(p));
  const res = validateProject(raw, { kb: KB });
  assert.equal(res.ok, true);
  assert.deepEqual(planOf(res.project), { depth: 'essentials', topics: { backups: true, rehearsal: false, verification: false } });
  raw.meta.planDepth = 'everything';
  raw.meta.planTopics = { backups: 'yes', evil: true };
  assert.deepEqual(planOf(validateProject(raw, { kb: KB }).project), { depth: 'thorough', topics: ALL_ON });
});

test('reports state the plan and how many steps it left out', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  const m = buildReportModel('final', KB, p, { appVersion: 't' });
  assert.ok(m.plan.leftOut > 0);
  assert.match(m.plan.text, /Essentials/);
  assert.match(m.plan.text, new RegExp(`${m.plan.leftOut} step`));
  assert.equal(buildReportModel('final', KB, fresh(), { appVersion: 't' }).plan.leftOut, 0);
});
