// Several people per workstream: one lead, the others with what they cover, and owners per step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { KB } from '../../content/kb.mjs';
import { createProject, setWorkstreamOwners, setWorkstreamPeople, workstreamTeam, effectiveOwner, knownPeople, setCheckField, MAX_WORKSTREAM_PEOPLE } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';
import { buildReportModel } from '../../src/core/report.js';

const scope03 = KB.checks.find((x) => x.id === 'PREP-SCOPE-03');
const scope01 = KB.checks.find((x) => x.id === 'PREP-SCOPE-01');

test('a workstream has a lead and other people, each with what they cover', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setWorkstreamOwners(p, { 'prepare:scope': 'Robin' });
  setWorkstreamPeople(p, { 'prepare:scope': [{ name: ' Alex ', covers: ' timeline ' }, { name: '', covers: 'nobody' }, { name: 'Compliance team', covers: '' }], 'bad key': [{ name: 'x' }], 'prepare:access': 'not a list' });
  assert.deepEqual(p.meta.workstreamPeople, { 'prepare:scope': [{ name: 'Alex', covers: 'timeline' }, { name: 'Compliance team', covers: '' }] });
  assert.deepEqual(workstreamTeam(p, scope01), { lead: 'Robin', people: p.meta.workstreamPeople['prepare:scope'] });
  assert.ok(knownPeople(p).includes('Alex') && knownPeople(p).includes('Compliance team'), 'their names are suggested in name fields');
  setWorkstreamPeople(p, { 'prepare:scope': Array.from({ length: 40 }, (_, i) => ({ name: `P${i}` })) });
  assert.equal(p.meta.workstreamPeople['prepare:scope'].length, MAX_WORKSTREAM_PEOPLE);
});

test('a step can go to someone other than the lead, and the others keep the lead', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setWorkstreamOwners(p, { 'prepare:scope': 'Robin' });
  setCheckField(p, scope03.id, 'owner', 'Alex');
  assert.deepEqual(effectiveOwner(p, scope03), { name: 'Alex', source: 'step' });
  assert.deepEqual(effectiveOwner(p, scope01), { name: 'Robin', source: 'workstream' });
});

test('reports list the lead and everyone else involved per workstream', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setWorkstreamPeople(p, { 'prepare:scope': [{ name: 'Alex', covers: 'timeline' }, { name: 'Kim', covers: '' }] });
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  const row = m.project.owners.find((o) => o.area.endsWith('Scope, governance and timeline'));
  assert.equal(row.name, '', 'no lead named yet');
  assert.equal(row.others, 'Alex (timeline), Kim');
});

test('workstream people survive import, and unsafe keys or shapes are dropped', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setWorkstreamPeople(p, { 'prepare:scope': [{ name: 'Alex', covers: 'timeline' }] });
  const raw = JSON.parse(JSON.stringify(p));
  raw.meta.workstreamPeople['prepare:<script>'] = [{ name: 'x' }];
  raw.meta.workstreamPeople['prepare:access'] = [{ name: 'IAM', covers: 'roles', extra: 'dropped' }, 'not an object', { covers: 'no name' }];
  raw.meta.workstreamPeople['prepare:automation'] = { name: 'not a list' };
  const res = validateProject(raw, { kb });
  assert.equal(res.ok, true);
  assert.deepEqual(res.project.meta.workstreamPeople, { 'prepare:scope': [{ name: 'Alex', covers: 'timeline' }], 'prepare:access': [{ name: 'IAM', covers: 'roles' }] });
  const old = JSON.parse(JSON.stringify(p));
  delete old.meta.workstreamPeople;
  assert.deepEqual(validateProject(old, { kb }).project.meta.workstreamPeople, {}, 'projects saved before this field load with none');
});
