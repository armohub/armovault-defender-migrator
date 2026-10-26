// Simplified mode in the project model: guidance is a view only; new fields survive import safely.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { createProject, setGuidance, setShowExtras, setOwnersWanted, addEvidence, setCheckStatus } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';

const P1 = kb.checks[0];

test('new projects start in Simplified, with extras shown and no owners choice yet', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(p.guidance, 'simple');
  assert.equal(p.meta.showExtras, true);
  assert.equal(p.meta.ownersWanted, '');
});

test('switching guidance changes no record and is audited', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  addEvidence(p, P1.id, { kind: 'note', title: 'n', text: 't' });
  setCheckStatus(p, P1, 'passed');
  const before = JSON.stringify([p.checks, p.evidence, p.answers, p.register, p.gates]);
  assert.deepEqual(setGuidance(p, 'detailed'), { ok: true, changed: true });
  assert.equal(JSON.stringify([p.checks, p.evidence, p.answers, p.register, p.gates]), before);
  assert.ok(p.audit.some((a) => a.action === 'project.guidance' && a.detail === 'Switched to Detailed mode'));
  assert.deepEqual(setGuidance(p, 'detailed'), { ok: true, changed: false });
  assert.equal(setGuidance(p, 'expert').ok, false);
});

test('extras switch and owners choice are validated', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setShowExtras(p, false);
  assert.equal(p.meta.showExtras, false);
  assert.equal(setOwnersWanted(p, 'later').ok, true);
  assert.equal(p.meta.ownersWanted, 'later');
  assert.equal(setOwnersWanted(p, 'maybe').ok, false);
});

test('only notes can be marked as generated from your entries', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const note = addEvidence(p, P1.id, { kind: 'note', title: 'n', text: 't', generated: true });
  const link = addEvidence(p, P1.id, { kind: 'link', title: 'l', url: 'https://learn.microsoft.com/', generated: true });
  assert.equal(note.generated, true);
  assert.equal(link.generated, false);
});

test('a project saved before Simplified mode opens in Detailed; bad values fall back', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const raw = JSON.parse(JSON.stringify(p));
  delete raw.guidance; delete raw.meta.showExtras; delete raw.meta.ownersWanted;
  const old = validateProject(raw, { kb }).project;
  assert.equal(old.guidance, 'detailed');
  assert.equal(old.meta.showExtras, true);
  assert.equal(old.meta.ownersWanted, '');
  raw.guidance = 'expert'; raw.meta.showExtras = 'no'; raw.meta.ownersWanted = '<b>';
  const bad = validateProject(raw, { kb }).project;
  assert.equal(bad.guidance, 'detailed');
  assert.equal(bad.meta.showExtras, true, 'only a real false hides extras');
  assert.equal(bad.meta.ownersWanted, '');
  raw.guidance = 'simple'; raw.meta.showExtras = false;
  const good = validateProject(raw, { kb }).project;
  assert.equal(good.guidance, 'simple');
  assert.equal(good.meta.showExtras, false);
});

test('the generated flag survives import only on notes', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  const n = addEvidence(p, P1.id, { kind: 'note', title: 'n', text: 't', generated: true });
  const raw = JSON.parse(JSON.stringify(p));
  const l = addEvidence(p, P1.id, { kind: 'link', title: 'l', url: 'https://learn.microsoft.com/' });
  const raw2 = JSON.parse(JSON.stringify(p));
  raw2.evidence[l.id].generated = true;
  assert.equal(validateProject(raw, { kb }).project.evidence[n.id].generated, true);
  assert.equal(validateProject(raw2, { kb }).project.evidence[l.id].generated, false);
});

import { KB } from '../../content/kb.mjs';
import { assessStage, summariseStage } from '../../src/core/readiness.js';
import { buildReportModel } from '../../src/core/report.js';
import { applicabilityMap } from '../../src/core/applicability.js';

test('good-practice checks never block, never leave a stage undetermined and never count in progress', () => {
  const p = createProject({ meta: { operatorName: 'Sam' }, mode: 'full' });
  const appMap = applicabilityMap(KB, p);
  for (const c of KB.checks.filter((x) => x.stage === 'prepare' && x.scope === 'needed')) {
    addEvidence(p, c.id, { kind: 'note', title: 'n', text: 't' });
    setCheckStatus(p, c, 'passed');
  }
  const extra = KB.checks.find((x) => x.id === 'PREP-AUT-06');
  setCheckStatus(p, extra, 'failed', { reason: 'no baseline' });
  const a = assessStage(KB, p, 'prepare', appMap);
  assert.equal(a.level, 'ready', JSON.stringify(a.reasons));
  const s = summariseStage(KB, p, 'prepare', appMap);
  assert.equal(s.counts.progress, 100);
  assert.ok(s.extras.some((i) => i.check.id === 'PREP-AUT-06'));
  assert.equal(s.counts.outOfScope, s.items.filter((i) => !i.inScope).length, 'good-practice checks in scope are not out of scope');
});

test('reports list good-practice checks in their own group', () => {
  const p = createProject({ meta: { operatorName: 'Sam' }, mode: 'full' });
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  const groups = m.stages[0].groups;
  const last = groups[groups.length - 1];
  assert.equal(last.title, 'Good practice (optional)');
  assert.ok(last.items.some((i) => i.id === 'PREP-AUT-06'));
  assert.ok(groups.slice(0, -1).every((g) => g.items.every((i) => KB.checks.find((c) => c.id === i.id).scope === 'needed')));
});
