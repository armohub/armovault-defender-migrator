// Feedback of 5 November: workspace list import, connector names, the last-record query, gate decisions and
// warnings, the preparation summary that shows only what was asked, and the community link.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { BRAND } from '../../src/brand.js';
import { parseInventory, analyseInventory, parseWorkspaceList } from '../../src/core/inventory.js';
import { createProject, recordGate, decisionsFor, decisionLabel, gateWarnings, setPlanDepth } from '../../src/core/model.js';
import { topicPreset } from '../../src/core/depth.js';
import { validateProject } from '../../src/core/schema.js';
import { buildReportModel } from '../../src/core/report.js';

const fresh = (o = {}) => { const p = createProject({ mode: 'tailored', guidance: 'detailed', appVersion: 't', kbVersion: 't', ...o }); p.meta.operatorName = 'Sam'; return p; };
const byId = (id) => KB.checks.find((c) => c.id === id);

test('workspaces.json from the script fills subscription and resource group, and anything else is not a list', () => {
  const list = parseWorkspaceList(JSON.stringify([
    { subscriptionId: '00000000-1111-2222-3333-444444444444', resourceGroupName: 'rg-soc', workspaceName: 'law-soc', alias: 'law-soc', region: 'westeurope' },
    { subscriptionId: 's2', resourceGroupName: 'rg-b', workspaceName: 'law-b', alias: 'law-b-2' },
    { subscriptionId: 's3', workspaceName: 'missing-rg', alias: 'x' },
  ]));
  assert.deepEqual(list.map((w) => [w.alias, w.subscription, w.resourceGroup]), [['law-soc', '00000000-1111-2222-3333-444444444444', 'rg-soc'], ['law-b-2', 's2', 'rg-b']]);
  assert.equal(parseWorkspaceList(JSON.stringify({ subscriptionId: 's', resourceGroupName: 'g', workspaceName: 'w' })).length, 1, 'a single object is a list of one');
  assert.equal(parseWorkspaceList('{"schema":"armohub.dma.inventory","schemaVersion":2}'), null, 'an inventory file is not a workspace list');
  assert.equal(parseWorkspaceList('not json'), null);
  assert.equal(parseWorkspaceList(JSON.stringify([{ subscriptionId: 'x'.repeat(5000), resourceGroupName: 'g', workspaceName: 'w' }]))[0].subscription.length, 200, 'values are capped');
});

test('connectors are listed by the name the portal shows, with their kind', () => {
  const inv = parseInventory(JSON.stringify({ schema: 'armohub.dma.inventory', schemaVersion: 2, workspace: { alias: 'SOC' }, collected: { dataConnectors: true },
    dataConnectors: [{ kind: 'GenericUI', name: '316ec55e', title: 'Microsoft Entra ID Protection (Preview)' }, { kind: 'StaticUI', name: 'AzureActivity' }, { kind: 'MicrosoftThreatProtection', name: 'xdr' }] }));
  const text = analyseInventory(inv).findings.find((f) => f.checkId === 'PREP-CON-01').text;
  assert.match(text, /Microsoft Entra ID Protection \(Preview\) \(GenericUI\)/);
  assert.match(text, /AzureActivity \(StaticUI\)/, 'without a title, the connector name');
});

test('the exact last-record query does not reuse a column name that tables can already have', () => {
  const sn = KB.snippets.K_UNION_LASTRECORD;
  assert.doesNotMatch(sn.code, /withsource\s*=\s*TableName\b/);
  assert.match(sn.code, /withsource\s*=\s*SourceTable_/);
});

test('the change outcome has its own choices, with a reason for exceptions and rollbacks', () => {
  assert.deepEqual(decisionsFor(byId('TRN-17')).map((d) => d.id), ['complete', 'complete_with_exceptions', 'rolled_back']);
  assert.deepEqual(decisionsFor(byId('PREP-PLN-05')).map((d) => d.id), ['go', 'go_with_exceptions', 'no_go', 'deferred']);
  const p = fresh();
  assert.equal(recordGate(p, 'TRN-17', { decision: 'rolled_back', decidedBy: 'Kim' }).ok, false, 'a rollback needs a reason');
  assert.equal(recordGate(p, 'TRN-17', { decision: 'go', decidedBy: 'Kim' }, { allowed: decisionsFor(byId('TRN-17')) }).ok, false, 'a go/no-go answer is not an outcome');
  assert.equal(recordGate(p, 'TRN-17', { decision: 'complete', decidedBy: 'Kim' }, { allowed: decisionsFor(byId('TRN-17')) }).ok, true);
  assert.equal(decisionLabel('complete'), 'Complete');
  const back = validateProject(JSON.parse(JSON.stringify(p)), { kb: KB }).project;
  assert.equal(back.gates['TRN-17'].decision, 'complete', 'an outcome survives a project package');
});

test('a gate that did not say go warns the stages after it, and still lets you look ahead', () => {
  const p = fresh();
  assert.equal(gateWarnings(KB, p, { stage: 'prepare' }).length, 0);
  assert.equal(gateWarnings(KB, p, { stage: 'transition' })[0].level, 'info', 'no decision yet: a gentle note');
  recordGate(p, 'PREP-PLN-05', { decision: 'no_go', decidedBy: 'Kim', rationale: 'Automation not ready' });
  const w = gateWarnings(KB, p, { stage: 'transition', workstream: 'pre-change' });
  assert.equal(w[0].level, 'bad');
  assert.match(w[0].title, /No-go/);
  assert.match(w[0].text, /Kim/);
  assert.equal(gateWarnings(KB, p, { stage: 'test' })[0].level, 'bad');
  recordGate(p, 'PREP-PLN-05', { decision: 'go', decidedBy: 'Kim' });
  assert.equal(gateWarnings(KB, p, { stage: 'transition', workstream: 'pre-change' }).length, 0);
  recordGate(p, 'TRN-01', { decision: 'no_go', decidedBy: 'Ali', rationale: 'Window moved' });
  assert.equal(gateWarnings(KB, p, { stage: 'transition', workstream: 'pre-change' }).length, 0, 'the change gate warns the change and after it');
  assert.equal(gateWarnings(KB, p, { stage: 'transition', workstream: 'change' })[0].level, 'bad');
  recordGate(p, 'TRN-17', { decision: 'rolled_back', decidedBy: 'Ali', rationale: 'Incidents stopped flowing' });
  assert.match(gateWarnings(KB, p, { stage: 'validate' })[0].title, /rolled back/);
});

test('the preparation summary lists answers apart from questions not answered yet, and those the plan never asked', () => {
  const p = fresh();
  setPlanDepth(p, 'essentials', topicPreset('essentials'));
  p.answers.multi_workspace = { value: 'no', reason: '', by: 'Sam', at: '2026-11-05T09:00:00Z' };
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  assert.deepEqual(m.answers.map((a) => a.id), ['multi_workspace'], 'only answered questions in the answers table');
  assert.ok(m.openQuestions.length > 0 && m.openQuestions.every((q) => q.id !== 'multi_workspace'));
  assert.ok(m.notAsked.some((q) => q.id === 'watchlists'), 'a question the plan left out');
  assert.ok(!m.openQuestions.some((q) => q.id === 'watchlists'), 'never listed as unanswered');
  assert.match(m.notAskedReason, /Essentials/);
  assert.ok(!m.notAsked.some((q) => q.id === 'all_connected'), 'the derived answer is never listed');
});

test('the makers and the community are linked from their own LinkedIn pages', () => {
  assert.equal(BRAND.community.url, 'https://www.linkedin.com/company/armohub');
  assert.equal(BRAND.community.name, 'ArMoHub');
});
