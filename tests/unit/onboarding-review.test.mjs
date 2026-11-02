// Changes from the onboarding review (29 October): people with roles, how the workspaces were added,
// the planner's reasons, the inventory region, and the guidance corrections.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { KB } from '../../content/kb.mjs';
import { createProject, addPerson, peopleWithRoles, knownPeople, setInventoryChoice, setApprovers } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';
import { profileReasons } from '../../src/core/planning.js';
import { parseInventory, analyseInventory } from '../../src/core/inventory.js';
import { validateKb } from '../../scripts/validate-kb.mjs';

test('a new person is added with a role and offered in every person list', () => {
  const p = createProject({ meta: { operatorName: 'Sam', operatorRole: 'Security architect' } });
  assert.equal(addPerson(p, { name: '  Robin ', role: ' SOC lead ' }).ok, true);
  assert.equal(addPerson(p, { name: '' }).ok, false, 'a name is needed');
  assert.equal(addPerson(p, { name: 'robin', role: 'SOC manager' }).name, 'Robin', 'the same name in another case is the same person');
  assert.deepEqual(p.meta.people, [{ name: 'Robin', role: 'SOC manager' }]);
  setApprovers(p, [{ role: 'Change advisory board', name: 'CAB' }]);
  assert.deepEqual(peopleWithRoles(p), [{ name: 'CAB', role: 'Change advisory board' }, { name: 'Robin', role: 'SOC manager' }, { name: 'Sam', role: 'Security architect' }]);
  assert.ok(knownPeople(p).includes('Robin'));
  assert.ok(p.audit.some((a) => a.action === 'project.people'), 'adding a person is in the audit log');
});

test('people and the way workspaces were added travel in project packages', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  addPerson(p, { name: 'Robin', role: 'SOC lead' });
  setInventoryChoice(p, 'import');
  const raw = JSON.parse(JSON.stringify(p));
  raw.meta.people.push({ name: 'Robin', role: 'duplicate' }, { name: '', role: 'nobody' }, 'not an object');
  const res = validateProject(raw, { kb });
  assert.equal(res.ok, true);
  assert.deepEqual(res.project.meta.people, [{ name: 'Robin', role: 'SOC lead' }]);
  assert.equal(res.project.meta.inventoryChoice, 'import');
  raw.meta.inventoryChoice = 'something else';
  assert.equal(validateProject(raw, { kb }).project.meta.inventoryChoice, '');
  const old = JSON.parse(JSON.stringify(p));
  delete old.meta.people;
  delete old.meta.inventoryChoice;
  const res2 = validateProject(old, { kb });
  assert.deepEqual([res2.project.meta.people, res2.project.meta.inventoryChoice], [[], ''], 'projects saved before these fields load without them');
});

test('the planner says when it has nothing to go on, and why it suggests longer ranges', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.deepEqual(profileReasons(p), { profile: 'smaller', reasons: [], known: false }, 'no answers and no workspaces: standard ranges, and it says so');
  p.answers.multi_workspace = { value: 'yes' };
  assert.equal(profileReasons(p).profile, 'smaller', 'one sign alone does not jump to the longer ranges');
  p.answers.playbooks = { value: 'yes' };
  const r = profileReasons(p);
  assert.equal(r.profile, 'larger');
  assert.deepEqual(r.reasons, ['more than one workspace in scope', 'playbooks run from automation']);
  const q = createProject({ meta: { operatorName: 'Sam' } });
  q.answers.multi_tenant = { value: 'yes' };
  assert.equal(profileReasons(q).profile, 'larger', 'several tenants are enough on their own');
});

test('an inventory file can carry the workspace region, and older files still import', () => {
  const base = { schema: 'armohub.dma.inventory', schemaVersion: 1, workspace: { alias: 'law-soc', region: 'westeurope' }, analyticsRules: [], automationRules: [], dataConnectors: [], watchlists: [], errors: [] };
  assert.equal(parseInventory(JSON.stringify(base)).region, 'westeurope');
  const older = { ...base, workspace: { alias: 'law-soc' } };
  const inv = parseInventory(JSON.stringify(older));
  assert.equal(inv.region, '');
  assert.equal(analyseInventory(inv).counts.analyticsRules, 0);
});

test('the guidance corrections from the portal path review are in the knowledge base', () => {
  assert.deepEqual(validateKb(KB).errors, []);
  const short = (id) => KB.checks.find((c) => c.id === id).short;
  assert.match(short('PREP-ACC-01').info.points.join(' '), /Condition column/, 'the Owner condition is explained with where to look');
  assert.doesNotMatch(short('PREP-ACC-01').do.join(' '), /Owner must have no conditions/);
  assert.match(short('PREP-ACC-03').info.points.join(' '), /security\.microsoft\.com\/mtp_roles/, 'unified RBAC has the direct link');
  assert.ok(short('PREP-SCOPE-05').info && short('PREP-TOP-03').info, 'the cloud and standalone connector checks have explainers');
  assert.match(short('PREP-ACC-04').do.join(' '), /\[\[do:add-control\|/, 'compensating controls have their own form');
  const scope05 = KB.checks.find((c) => c.id === 'PREP-SCOPE-05');
  assert.ok(scope05.sources.some((x) => x.id === 'featureavail'), 'the 21Vianet retirement cites the feature support page');
  assert.ok(!scope05.sources.some((x) => x.id === 'residency'));
  const q = KB.questions.find((x) => x.id === 'urbac');
  assert.ok(q.sources.includes('urbacactivate'));
});
