// Simplified mode content: short forms, good-practice tags, missions and the six up-front questions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { EXTRAS } from '../../content/short-forms.mjs';
import { validateKb } from '../../scripts/validate-kb.mjs';

const CORE = ['multi_workspace', 'multi_tenant', 'defender_xdr', 'test_env', 'data_residency', 'sovereign_cloud'];

test('exactly the nine good-practice checks are extras, every other check is needed', () => {
  // Health monitoring and the rule health baseline are needed: Validate checks query SentinelHealth.
  // The Defender table review (PREP-CON-08) is an optional cost review, so it is an extra.
  assert.deepEqual([...EXTRAS].sort(), ['PREP-AUT-06', 'PREP-CNT-04', 'PREP-CNT-06', 'PREP-CON-08', 'PREP-DET-08', 'PREP-GOV-04', 'PREP-GOV-05', 'TEST-10', 'VAL-19']);
  for (const c of KB.checks) assert.equal(c.scope, EXTRAS.includes(c.id) ? 'extra' : 'needed', c.id);
});

test('a needed check never depends on a good-practice check', () => {
  for (const c of KB.checks.filter((x) => x.scope === 'needed')) {
    for (const d of c.dependsOn || []) {
      const id = typeof d === 'string' ? d : d.id;
      assert.notEqual(KB.checks.find((x) => x.id === id).scope, 'extra', `${c.id} depends on ${id}`);
    }
  }
});

test('every workstream is a mission with a short title and purpose', () => {
  for (const w of KB.workstreams) {
    assert.ok(w.mission && w.mission.title && w.mission.title.length <= 60, `${w.stage}:${w.id} title`);
    assert.ok(w.mission.purpose && w.mission.purpose.length <= 120, `${w.stage}:${w.id} purpose`);
  }
});

test('the six core questions are marked, and the data residency question names company policies', () => {
  assert.deepEqual(KB.questions.filter((q) => q.core).map((q) => q.id).sort(), [...CORE].sort());
  const q = KB.questions.find((x) => x.id === 'data_residency');
  assert.equal(q.text, 'Do any internal or company policies, or regulations, limit where security data may be stored or processed?');
  assert.equal(q.detail, 'For example data protection rules, client contracts or your company\'s security policy.');
});

test('the validator rejects short forms that break the limits', () => {
  const kb = structuredClone(KB);
  kb.checks[0].short = { title: 'x'.repeat(71), do: [], proof: '' };
  const r = validateKb(kb);
  assert.ok(r.errors.some((e) => e.includes('short title')), r.errors.join('\n'));
  assert.ok(r.errors.some((e) => e.includes('one to three')));
  assert.ok(r.errors.some((e) => e.includes('proof')));
});

test('the knowledge base passes the validator with the new fields', () => {
  assert.deepEqual(validateKb(KB).errors, []);
});

const missingShort = (stagePrefixes) => KB.checks.filter((c) => stagePrefixes.some((p) => c.id.startsWith(p)) && !c.short).map((c) => c.id);

test('Prepare part 1 checks all have short forms', () => {
  assert.deepEqual(missingShort(['PREP-SCOPE-', 'PREP-TOP-', 'PREP-ACC-', 'PREP-GOV-', 'PREP-CON-']), []);
});

test('Prepare part 2 checks all have short forms', () => {
  assert.deepEqual(missingShort(['PREP-DET-', 'PREP-AUT-', 'PREP-INT-', 'PREP-CNT-', 'PREP-OPS-', 'PREP-PLN-']), []);
});

test('every check has a short form', () => {
  assert.deepEqual(KB.checks.filter((c) => !c.short).map((c) => c.id), []);
});

test('ready texts are complete, sourced and written to the rules', () => {
  const r = KB.reference.readyTexts;
  for (const key of ['analystNotice', 'liveNote', 'changeSummary']) {
    const t = r[key];
    assert.ok(t.subject && t.label && Array.isArray(t.sections) && t.sections.length >= 2, key);
    for (const s of t.sections) assert.ok(s.title && (s.points || s.text), `${key}: ${s.title}`);
    for (const id of t.sources) assert.ok(KB.sources.some((x) => x.id === id), `${key}: ${id}`);
  }
  assert.equal(KB.checks.find((c) => c.id === 'PREP-OPS-04').tool, 'comms');
  assert.equal(KB.checks.find((c) => c.id === 'TRN-01').tool, 'change');
});

test('Validate checks that query health data depend on turning health monitoring on', () => {
  const deps = (id) => (KB.checks.find((x) => x.id === id).dependsOn || []).map((d) => (typeof d === 'string' ? d : d.id));
  for (const id of ['VAL-04', 'VAL-06', 'VAL-07']) assert.ok(deps(id).includes('PREP-CON-06'), id);
  assert.ok(deps('VAL-04').includes('PREP-DET-07'), 'VAL-04 compares with the rule health baseline');
});

test('short forms only point to what a mission row offers', () => {
  const s = (id) => KB.checks.find((x) => x.id === id).short;
  assert.ok(!/notes/i.test(s('PREP-SCOPE-02').do.join(' ')), 'rows have no notes field');
  assert.match(s('PREP-DET-03').do.join(' '), /Retain Sentinel incident creation behavior/, 'TEST-04 and TRN-10 apply this choice as planned');
});
