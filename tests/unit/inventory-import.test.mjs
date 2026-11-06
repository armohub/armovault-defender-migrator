// One import for every file in the inventory folder, the same in setup and in a project: workspaces.json in any
// order, each workspace with its subscription and resource group, answers you typed yourself kept, and no
// duplicates when you import the same files again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { parseInventory, analyseInventory, parseWorkspaceList } from '../../src/core/inventory.js';
import { newImportSession, addReadFiles, listedFor, missingFiles, applyImport } from '../../src/core/inventory-import.js';
import { createProject, setAnswer, setEnvironments } from '../../src/core/model.js';

const ALL = { analyticsRules: true, automationRules: true, dataConnectors: true, watchlists: true, onboarding: true, settings: true, workspaceManager: true, repositories: true, bookmarks: true, hunts: true, installedContent: true, logicApps: true, access: true };
const raw = (alias, extra = {}) => ({
  schema: 'armohub.dma.inventory', schemaVersion: 2, tool: { name: 'Get-ArMoSentinelInventory.ps1', version: '1.0.0' }, collectedAt: '2026-11-06T09:00:00Z',
  workspace: { alias, region: 'westeurope', tenantRef: 't-0000000a', delegated: false, cloud: 'AzureCloud', customerManagedKey: false },
  analyticsRules: [{ name: 'Fusion', kind: 'Fusion', enabled: true }], automationRules: [], dataConnectors: [{ kind: 'Office365', name: 'c1' }], watchlists: [],
  settings: { ueba: true, entityAnalytics: false, anomalies: false }, workspaceManager: { enabled: false, members: 0 }, repositories: { count: 0, huntingQueries: false },
  bookmarks: 0, hunts: 0, installedContent: { workbooks: 0, playbooks: 0 }, logicApps: { sentinelPlaybooks: [] },
  access: { spWithSentinelRoles: 0, spWithReadOnlyRoles: 0, tableLevelRestrictions: 0 }, collected: { ...ALL }, errors: [], ...extra,
});
// What readInventoryFiles hands over for one file.
const invFile = (alias, extra) => {
  const text = JSON.stringify(raw(alias, extra));
  const inv = parseInventory(text);
  return { file: { name: `inventory-${alias}.json` }, bytes: new TextEncoder().encode(text), sha: `sha-${alias}-${text.length}`, inv, res: analyseInventory(inv) };
};
const LIST = [
  { subscriptionId: 'sub-1', resourceGroupName: 'rg-weu', workspaceName: 'law-weu', alias: 'law-weu', region: 'westeurope' },
  { subscriptionId: 'sub-2', resourceGroupName: 'rg-neu', workspaceName: 'law-neu', alias: 'law-neu', region: 'northeurope' },
  { subscriptionId: 'sub-3', resourceGroupName: 'rg-lab', workspaceName: 'law-lab', alias: 'law-lab', region: 'westeurope' },
];
const listFile = (entries = LIST) => ({ file: { name: 'workspaces.json' }, list: parseWorkspaceList(JSON.stringify(entries)) });
const fresh = () => { const p = createProject({ mode: 'tailored', guidance: 'simple', appVersion: 't', kbVersion: KB.meta.version }); p.meta.operatorName = 'Ines'; return p; };
const envOf = (p, alias) => p.meta.environments.find((e) => e.alias === alias);

test('workspaces.json can come first, last or alone: each workspace still gets its subscription and resource group', () => {
  const first = addReadFiles(newImportSession(), [listFile(), invFile('law-weu'), invFile('law-neu')]);
  const last = addReadFiles(newImportSession(), [invFile('law-weu'), invFile('law-neu'), listFile()]);
  for (const s of [first, last]) {
    assert.deepEqual(s.items.map((it) => it.alias), ['law-weu', 'law-neu']);
    assert.deepEqual(s.items.map((it) => listedFor(s, it).resourceGroup), ['rg-weu', 'rg-neu']);
    assert.deepEqual(missingFiles(s).map((w) => w.alias), ['law-lab'], 'the list names a workspace whose file was not chosen');
    assert.equal(s.errors.length, 0, 'workspaces.json is never refused');
  }
  const twice = addReadFiles(addReadFiles(newImportSession(), [listFile()]), [listFile()]);
  assert.equal(twice.list.length, 3, 'choosing the list twice does not double it');
  assert.equal(twice.items.length, 0);
  assert.equal(missingFiles(twice).length, 3, 'alone, it lists the workspaces and waits for their files');
  const dup = addReadFiles(newImportSession(), [invFile('law-weu'), invFile('law-weu')]);
  assert.equal(dup.items.length, 1);
  assert.match(dup.errors[0], /inventory-law-weu\.json: law-weu is already in this import/);
  const bad = addReadFiles(newImportSession(), [{ file: { name: 'notes.json' }, error: 'This is not an inventory file.' }]);
  assert.deepEqual(bad.errors, ['notes.json: This is not an inventory file.']);
});

test('importing into a project adds the new workspaces and fills in the ones you typed, keeping what you entered', () => {
  const p = fresh();
  setEnvironments(p, [{ alias: 'law-weu', kind: 'production', defender: 'primary', owner: 'Cloud team' }, { alias: 'law-neu', kind: 'production', resourceGroup: 'rg-typed' }]);
  const s = addReadFiles(newImportSession(), [listFile(), invFile('law-weu'), invFile('law-neu'), invFile('law-lab')]);
  assert.equal(s.items.find((it) => it.alias === 'law-lab').kind, 'test', 'a lab workspace is proposed as test');
  const r = applyImport(p, s, { kb: KB });
  assert.equal(r.ok, true);
  assert.deepEqual(r.added, ['law-lab']);
  assert.equal(r.updated, 2);
  assert.deepEqual(p.meta.environments.map((e) => e.alias), ['law-weu', 'law-neu', 'law-lab'], 'no second copy of a workspace you had');
  assert.deepEqual([envOf(p, 'law-weu').subscription, envOf(p, 'law-weu').resourceGroup, envOf(p, 'law-weu').defender, envOf(p, 'law-weu').owner], ['sub-1', 'rg-weu', 'primary', 'Cloud team'], 'filled in, connection state and owner kept');
  assert.equal(envOf(p, 'law-neu').resourceGroup, 'rg-typed', 'a value you typed is kept');
  assert.equal(envOf(p, 'law-neu').subscription, 'sub-2');
  assert.deepEqual([envOf(p, 'law-lab').kind, envOf(p, 'law-lab').subscription, envOf(p, 'law-lab').region], ['test', 'sub-3', 'westeurope']);
  assert.equal(p.meta.inventoryChoice, 'import');
  assert.ok(r.evidence > 0 && r.steps > 0 && r.files === 3);
  assert.ok(p.audit.some((a) => a.action === 'inventory.imported'));
});

test('workspaces.json alone fills in the workspaces already in your project', () => {
  const p = fresh();
  setEnvironments(p, [{ alias: 'LAW-WEU', kind: 'production' }, { alias: 'other', kind: 'production' }]);
  const r = applyImport(p, addReadFiles(newImportSession(), [listFile()]), { kb: KB });
  assert.equal(r.ok, true);
  assert.equal(r.updated, 1);
  assert.deepEqual(r.added, [], 'a list without inventory files adds no workspace');
  assert.equal(envOf(p, 'LAW-WEU').resourceGroup, 'rg-weu', 'matched without regard to case');
  assert.equal(envOf(p, 'other').subscription, '');
});

test('importing the same files again adds no duplicate notes or files; a newer run adds its notes', () => {
  const p = fresh();
  const blobs = [];
  const once = applyImport(p, addReadFiles(newImportSession(), [invFile('law-weu')]), { kb: KB, putBlob: (id) => blobs.push(id) });
  const count = Object.keys(p.evidence).length;
  assert.equal(blobs.length, 1, 'the original file is stored once');
  const again = applyImport(p, addReadFiles(newImportSession(), [invFile('law-weu')]), { kb: KB, putBlob: (id) => blobs.push(id) });
  assert.equal(Object.keys(p.evidence).length, count, 'nothing doubled');
  assert.deepEqual([again.evidence, again.files, again.added.length, blobs.length], [0, 0, 0, 1]);
  assert.ok(once.evidence > 0);
  applyImport(p, addReadFiles(newImportSession(), [invFile('law-weu', { collectedAt: '2026-11-07T09:00:00Z' })]), { kb: KB });
  assert.ok(Object.keys(p.evidence).length > count, 'a later run is new evidence');
});

test('suggested answers respect what you answered yourself', () => {
  const p = fresh();
  setAnswer(p, 'ueba', 'no', 'Typed by Ines');
  setAnswer(p, 'fusion', 'yes', 'Typed by Ines');
  const s = addReadFiles(newImportSession(), [invFile('law-weu')], { answers: p.answers });
  const by = Object.fromEntries(s.suggest.map((x) => [x.questionId, x]));
  assert.equal(by.ueba.value, 'yes');
  assert.equal(by.ueba.on, false, 'a different answer you typed is not ticked by default');
  assert.equal(by.ueba.current, 'no');
  assert.equal(by.fusion.same, true, 'an answer that already matches is not offered again');
  assert.ok(s.suggest.some((x) => !x.same && x.on && !p.answers[x.questionId]), 'unanswered questions are ticked');
  const r = applyImport(p, s, { kb: KB });
  assert.equal(p.answers.ueba.value, 'no', 'unticked: your answer stays');
  assert.equal(p.answers.fusion.reason, 'Typed by Ines', 'a matching answer is not rewritten');
  assert.equal(r.answers, s.suggest.filter((x) => x.on && !x.same).length);
  const filled = Object.values(p.answers).filter((a) => /^From imported inventory \(.+\); confirmed by Ines$/.test(a.reason));
  assert.equal(filled.length, r.answers, 'filled answers say where they came from and who confirmed them');
  // Ticks survive a change to the workspaces in scope.
  by.ueba.on = true;
  const more = addReadFiles(s, [invFile('law-neu')], { answers: p.answers });
  assert.equal(more.suggest.find((x) => x.questionId === 'ueba').on, true);
});

test('workspaces you leave out of scope are not imported', () => {
  const p = fresh();
  const s = addReadFiles(newImportSession(), [listFile(), invFile('law-weu'), invFile('law-neu')]);
  s.items[1].inScope = false;
  const r = applyImport(p, s, { kb: KB });
  assert.deepEqual(p.meta.environments.map((e) => e.alias), ['law-weu']);
  assert.deepEqual(r.added, ['law-weu']);
  assert.equal(r.files, 1);
  const none = applyImport(fresh(), newImportSession(), { kb: KB });
  assert.equal(none.ok, false, 'an empty import says so');
});
