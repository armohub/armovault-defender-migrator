// Decision helpers on the three longest decision steps: content shape, verdict rules, storage and import.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { validateKb } from '../../scripts/validate-kb.mjs';
import { evaluateHelper, decisionDraft, plainText } from '../../src/core/decision-helper.js';
import { createProject, setHelper, knownPeople, HELPER_KEYS, MAX_HELPER_SUBJECTS } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';
import { buildPackage, readProjectFile } from '../../src/core/package.js';

const step = (id) => KB.checks.find((c) => c.id === id);
const MDC = step('PREP-CON-02');
const URBAC = step('PREP-ACC-03');
const TENANTS = step('PREP-TOP-05');
const blobBytes = async (b) => new Uint8Array(await b.arrayBuffer());

test('the three long decisions carry a helper, and their text points to it', () => {
  const withHelper = KB.checks.filter((c) => c.helper).map((c) => [c.id, c.tool]);
  assert.deepEqual(withHelper.sort(), [['PREP-ACC-03', 'urbac'], ['PREP-CON-02', 'mdc'], ['PREP-TOP-05', 'tenants']]);
  for (const [, tool] of withHelper) assert.ok(HELPER_KEYS.includes(tool), `${tool} is stored by the model`);
  for (const c of [MDC, URBAC, TENANTS]) {
    const text = JSON.stringify([c.steps, c.record]);
    assert.match(text, /in \*\*Do it here\*\*/, `${c.id} refers to the helper`);
    assert.match(text, /\[\[do:add-decision\|/, `${c.id} keeps the manual decision action`);
  }
  assert.equal(TENANTS.helper.per, 'tenant');
});

test('the validator catches broken helper rules', () => {
  const kb = structuredClone(KB);
  const c = kb.checks.find((x) => x.id === 'PREP-ACC-03');
  c.helper.rules.push(
    { when: { nope: ['yes'] }, kind: 'pro', on: 'keep', say: 'x' },
    { when: { rowlevel: ['maybe'] }, kind: 'pro', on: 'keep', say: 'x' },
    { when: { rowlevel: ['yes'] }, kind: 'con', on: 'activate', point: 9, say: 'x' },
    { when: { rowlevel: ['yes'] }, kind: 'note', on: 'keep', say: 'x' },
    { when: { rowlevel: ['yes'] }, kind: 'verdict', on: 'keep', say: 'x' },
    { when: { rowlevel: ['yes'] }, kind: 'pro', on: 'elsewhere', say: 'x' },
  );
  c.helper.choices[0].title = '**Bold** title';
  const m = kb.checks.find((x) => x.id === 'PREP-CON-02');
  m.tool = 'briefing';
  const text = validateKb(kb).errors.join('\n');
  assert.match(text, /PREP-ACC-03: helper rule \d+ uses unknown question "nope"/);
  assert.match(text, /PREP-ACC-03: helper rule \d+ uses an unknown answer for "rowlevel"/);
  assert.match(text, /PREP-ACC-03: helper rule \d+: "point" must be the index/);
  assert.match(text, /PREP-ACC-03: helper rule \d+: "on" must name a choice/);
  assert.match(text, /PREP-ACC-03: helper rule \d+ has an unknown kind/);
  assert.match(text, /PREP-ACC-03: helper choice keep needs a plain title/);
  assert.match(text, /PREP-CON-02: a helper needs a decision helper tool/);
  const k2 = structuredClone(KB);
  delete k2.checks.find((x) => x.id === 'PREP-TOP-05').helper;
  assert.match(validateKb(k2).errors.join('\n'), /PREP-TOP-05: helper is missing/);
});

test('unified RBAC: a verdict only where the step states a requirement', () => {
  const h = URBAC.helper;
  const none = evaluateHelper(h, {});
  assert.equal(none.verdict, null);
  assert.equal(none.answered, 0);
  const noBasis = evaluateHelper(h, { state: 'no', rowlevel: 'no', nonhuman: 'yes', azureroles: 'yes', azureportal: 'yes' });
  assert.equal(noBasis.verdict, null, 'limitations alone are trade-offs, not a verdict');
  assert.deepEqual(noBasis.byChoice.activate.cons.marked.sort(), [0, 1, 2]);
  assert.equal(noBasis.byChoice.activate.cons.mine.length, 0, 'confirmed points are marked, not repeated');
  const rl = evaluateHelper(h, { rowlevel: 'yes' });
  assert.equal(rl.verdict, 'activate');
  assert.equal(rl.strength, 'requires');
  assert.match(rl.reasons[0], /requires unified RBAC/);
  assert.deepEqual(rl.byChoice.keep.cons.marked, [0], 'the other side shows what it lacks');
  assert.ok(evaluateHelper(h, { nonhuman: 'unknown' }).notes.some((n) => /non-human identities/.test(n)));
});

test('Defender for Cloud: Microsoft\'s recommendation follows the correlated-data answer', () => {
  const h = MDC.helper;
  assert.equal(evaluateHelper(h, { correlated: 'yes' }).verdict, 'tenant');
  assert.equal(evaluateHelper(h, { correlated: 'yes' }).strength, 'recommends');
  assert.equal(evaluateHelper(h, { correlated: 'no' }).verdict, 'legacy');
  assert.equal(evaluateHelper(h, { correlated: 'unknown', today: 'both' }).verdict, null, 'a pro is not a verdict');
  const both = evaluateHelper(h, { today: 'both', correlated: 'no', incidents: 'alerts' });
  assert.equal(both.verdict, 'legacy');
  assert.deepEqual(both.byChoice.tenant.pros.marked, [0]);
  assert.ok(both.notes.some((n) => /close those incidents/.test(n)));
});

test('multi-tenant: the step gives no basis to prefer B2B or governance relationships', () => {
  const h = TENANTS.helper;
  for (const today of [['b2b'], ['govrel'], ['gdap', 'lighthouse'], ['none']]) {
    for (const queries of ['yes', 'no', 'unknown']) assert.equal(evaluateHelper(h, { today, queries }).verdict, null);
  }
  const ev = evaluateHelper(h, { today: ['gdap', 'lighthouse', 'b2b'], queries: 'yes' });
  assert.equal(ev.notes.length, 3);
  assert.deepEqual(ev.byChoice.b2b.pros.mine, ['Entra B2B is already in place for this tenant.']);
});

test('two recommendations for different approaches give no verdict', () => {
  const h = {
    questions: [{ id: 'a', options: [{ id: 'x' }, { id: 'y' }] }, { id: 'b', options: [{ id: 'x' }, { id: 'y' }] }],
    choices: [{ id: 'one' }, { id: 'two' }],
    rules: [{ when: { a: ['x'] }, kind: 'recommends', on: 'one', say: '1' }, { when: { b: ['x'] }, kind: 'recommends', on: 'two', say: '2' }, { when: { b: ['y'] }, kind: 'requires', on: 'two', say: '3' }],
  };
  const split = evaluateHelper(h, { a: 'x', b: 'x' });
  assert.equal(split.verdict, null);
  assert.equal(split.split, true);
  assert.equal(evaluateHelper(h, { a: 'x', b: 'y' }).verdict, 'two', 'a requirement outweighs a recommendation');
});

test('the decision draft restates the choice, reasons, trade-offs and answers in plain text', () => {
  assert.equal(decisionDraft(URBAC, { label: '', answers: {}, choice: '', person: '' }, KB), null, 'nothing to record without a choice');
  const d = decisionDraft(URBAC, { label: '', answers: { rowlevel: 'yes', nonhuman: 'yes' }, choice: 'activate', person: '' }, KB);
  assert.equal(d.title, 'Unified RBAC for Sentinel: Activate unified RBAC per workspace, after the transition');
  assert.match(d.description, /^Chosen: Activate unified RBAC/);
  assert.match(d.description, /Why:\n- You need row-level access/);
  assert.match(d.description, /Trade-offs you accept:\n- Your service principals/);
  assert.match(d.description, /Do service principals or managed identities have Sentinel roles\? Yes/);
  assert.doesNotMatch(d.description, /\[\[|\*\*|[\u2013\u2014]/, 'no markup or long dashes in the register');
  const other = decisionDraft(URBAC, { label: '', answers: { rowlevel: 'yes' }, choice: 'keep', person: '' }, KB);
  assert.match(other.description, /The helper pointed to "Activate unified RBAC per workspace, after the transition"/);
  const legacy = decisionDraft(MDC, { label: '', answers: { correlated: 'no' }, choice: 'legacy', person: '' }, KB);
  assert.match(legacy.description, /Record the empty-alert risk and who accepts it: add a risk\./);
  const t = decisionDraft(TENANTS, { label: 'Contoso EU', answers: { today: ['gdap'], queries: 'yes' }, choice: 'govrel', person: 'Kim' }, KB);
  assert.equal(t.title, 'Access model for Contoso EU: Governance relationships');
  assert.match(t.description, /Who connects its workspaces, inside this tenant: Kim/);
  assert.match(t.description, /Keep Azure Lighthouse for this tenant/);
  assert.equal(plainText('See [[PREP-ACC-06]] and [[go:register|the register]].', KB), `See ${step('PREP-ACC-06').title} and the register.`);
});

test('saving a helper keeps known ids only, trims names and writes an audit entry', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(setHelper(p, 'elsewhere', []).ok, false);
  assert.equal(setHelper(p, 'tenants', [
    { label: '  Contoso EU ', answers: { today: ['b2b', 'b2b', 'gdap', 'Bad Id', 7], queries: 'yes', 'no good': 'x', empty: [] }, choice: 'b2b', person: ' Kim ' },
    { label: 'Fabrikam', answers: { queries: '<script>' }, choice: 'not valid!', person: '' },
  ], { detail: 'Access model: Contoso EU: Entra B2B', ref: 'PREP-TOP-05' }).ok, true);
  const s = p.meta.helpers.tenants;
  assert.deepEqual(s.subjects[0], { label: 'Contoso EU', answers: { today: ['b2b', 'gdap'], queries: 'yes' }, choice: 'b2b', person: 'Kim' });
  assert.deepEqual(s.subjects[1], { label: 'Fabrikam', answers: {}, choice: '', person: '' });
  assert.equal(s.by, 'Sam');
  assert.ok(s.at);
  const a = p.audit.at(-1);
  assert.equal(a.action, 'project.helper');
  assert.equal(a.ref, 'PREP-TOP-05');
  assert.match(a.detail, /Contoso EU: Entra B2B/);
  assert.ok(knownPeople(p).includes('Kim'), 'the person who connects is suggested in name fields');
  setHelper(p, 'urbac', Array.from({ length: MAX_HELPER_SUBJECTS + 20 }, () => ({ choice: 'keep' })));
  assert.equal(p.meta.helpers.urbac.subjects.length, MAX_HELPER_SUBJECTS);
});

test('import keeps saved helpers and rejects anything else', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setHelper(p, 'mdc', [{ answers: { today: 'both', correlated: 'yes' }, choice: 'tenant' }]);
  setHelper(p, 'tenants', [{ label: 'Contoso EU', answers: { today: ['lighthouse', 'b2b'] }, choice: 'govrel', person: 'Kim' }]);
  const raw = JSON.parse(JSON.stringify(p));
  raw.meta.helpers.unknown = { subjects: [{ choice: 'x' }] };
  raw.meta.helpers.urbac = { subjects: 'not a list' };
  raw.meta.helpers.mdc.subjects.push({ label: { toString: 'x' }, answers: JSON.parse('{"__proto__": "yes", "constructor": ["x"], "ok": {"a": 1}}'), choice: '[[do:add-risk|x]]', person: 42 });
  raw.meta.helpers.tenants.subjects[0].answers.today.push('<img src=x>', 'a'.repeat(300));
  const res = validateProject(raw, { kb: KB });
  assert.equal(res.ok, true);
  const h = res.project.meta.helpers;
  assert.deepEqual(Object.keys(h).sort(), ['mdc', 'tenants'], 'unknown and malformed helpers are dropped');
  assert.deepEqual(h.mdc.subjects[0], { label: '', answers: { today: 'both', correlated: 'yes' }, choice: 'tenant', person: '' });
  assert.deepEqual(h.mdc.subjects[1], { label: '', answers: {}, choice: '', person: '42' });
  assert.equal(Object.getPrototypeOf(h.mdc.subjects[1].answers), Object.prototype, 'no prototype pollution');
  assert.deepEqual(h.tenants.subjects[0].answers.today, ['lighthouse', 'b2b']);
  assert.equal(h.tenants.by, 'Sam');
  assert.ok(h.tenants.at);
  // An older file without helpers still opens, with an empty set.
  delete raw.meta.helpers;
  assert.deepEqual(validateProject(raw, { kb: KB }).project.meta.helpers, {});
  raw.meta.helpers = ['not', 'an', 'object'];
  assert.deepEqual(validateProject(raw, { kb: KB }).project.meta.helpers, {});
});

test('helper choices survive a project package round trip', async () => {
  const p = createProject({ meta: { name: 'Helpers', operatorName: 'Sam' } });
  setHelper(p, 'urbac', [{ answers: { rowlevel: 'yes', nonhuman: 'unknown' }, choice: 'activate' }]);
  setHelper(p, 'tenants', [{ label: 'Contoso EU', answers: { today: ['gdap'], queries: 'no' }, choice: 'b2b', person: 'Kim' }, { label: 'Fabrikam US', answers: {}, choice: '', person: '' }]);
  const { blob } = await buildPackage(p, async () => null, { appVersion: 't', kbVersion: 't', productName: 'Test' });
  const back = await readProjectFile(await blobBytes(blob), { kb: KB });
  assert.deepEqual(back.project.meta.helpers.urbac.subjects, p.meta.helpers.urbac.subjects);
  assert.deepEqual(back.project.meta.helpers.tenants.subjects, p.meta.helpers.tenants.subjects);
  assert.equal(back.project.meta.helpers.tenants.at, p.meta.helpers.tenants.at);
});
