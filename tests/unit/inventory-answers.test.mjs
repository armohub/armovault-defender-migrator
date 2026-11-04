// Inventory schema 2 and the answers it suggests: Yes when any in-scope workspace shows it, No only when every
// in-scope workspace was read for that part and none has it, and nothing for questions only people can answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { parseInventory, analyseInventory, suggestAnswers, INVENTORY_QUESTIONS, YES_OR_NO_QUESTIONS } from '../../src/core/inventory.js';

const ALL_PARTS = { analyticsRules: true, automationRules: true, dataConnectors: true, watchlists: true, onboarding: true, settings: true, workspaceManager: true, repositories: true, bookmarks: true, hunts: true, installedContent: true, logicApps: true, access: true };
const quiet = () => ({
  schema: 'armohub.dma.inventory', schemaVersion: 2, tool: { name: 'Get-ArMoSentinelInventory.ps1', version: '1.0.0' }, collectedAt: '2026-11-04T10:00:00Z',
  workspace: { alias: 'SOC-A', region: 'westeurope', tenantRef: 't-0000000a', delegated: false, cloud: 'AzureCloud', customerManagedKey: false },
  analyticsRules: [{ name: 'Rule', kind: 'Scheduled', enabled: true, createIncident: true, groupingEnabled: false, reopenClosed: false, correlationTag: '', usesIdentityInfo: false, usesLegacyTI: false, usesTI: false, productFilter: '', apiVersion: '2025-09-01' }],
  automationRules: [], dataConnectors: [{ kind: 'Office365', name: 'c1' }], watchlists: [],
  settings: { ueba: false, entityAnalytics: false, anomalies: false }, workspaceManager: { enabled: false, members: 0 }, repositories: { count: 0, huntingQueries: false },
  bookmarks: 0, hunts: 0, installedContent: { workbooks: 0, playbooks: 0 }, logicApps: { sentinelPlaybooks: [] },
  access: { spWithSentinelRoles: 0, spWithReadOnlyRoles: 0, tableLevelRestrictions: 0 }, collected: { ...ALL_PARTS }, errors: [],
});
const busy = () => ({
  ...quiet(),
  workspace: { alias: 'SOC-B', region: 'northeurope', tenantRef: 't-0000000b', delegated: true, cloud: 'AzureUSGovernment', customerManagedKey: true },
  analyticsRules: [
    { name: 'Fusion', kind: 'Fusion', enabled: true },
    { name: 'MDC incidents', kind: 'MicrosoftSecurityIncidentCreation', enabled: true, productFilter: 'Azure Security Center' },
    { name: 'Alert only', kind: 'Scheduled', enabled: true, createIncident: false },
    { name: 'Reopens', kind: 'Scheduled', enabled: true, createIncident: true, reopenClosed: true },
    { name: 'TI map', kind: 'Scheduled', enabled: true, createIncident: true, usesTI: true },
  ],
  automationRules: [{ name: 'Tasks', enabled: true, triggersOn: 'Incidents', triggersWhen: 'Created', riskyConditions: ['IncidentTitle'], playbookActions: 1, taskActions: 2 }],
  dataConnectors: [{ kind: 'MicrosoftDefenderAdvancedThreatProtection', name: 'mde' }, { kind: 'OfficeIRM', name: 'irm' }, { kind: 'MicrosoftThreatProtection', name: 'xdr' }],
  watchlists: [{ alias: 'vip', name: 'VIP' }],
  settings: { ueba: true, entityAnalytics: true, anomalies: true }, workspaceManager: { enabled: true, members: 3 }, repositories: { count: 1, huntingQueries: true },
  bookmarks: 4, hunts: 1, installedContent: { workbooks: 2, playbooks: 1 }, logicApps: { sentinelPlaybooks: [{ name: 'pb-snow', ticketing: true }] },
  access: { spWithSentinelRoles: 2, spWithReadOnlyRoles: 1, tableLevelRestrictions: 1 },
});
const item = (raw, kind = 'production') => { const inv = parseInventory(JSON.stringify(raw)); return { alias: inv.alias, kind, inv, res: analyseInventory(inv) }; };
const byQ = (list) => Object.fromEntries(list.map((s) => [s.questionId, s]));

test('schema 2 parses every new part, and unsafe values are dropped or capped', () => {
  const raw = busy();
  raw.workspace.tenantRef = '11111111-2222-3333-4444-555555555555';
  raw.workspace.cloud = '<script>';
  raw.bookmarks = 1e12;
  const inv = parseInventory(JSON.stringify(raw));
  assert.equal(inv.schemaVersion, 2);
  assert.equal(inv.tenantRef, '', 'only a fingerprint is accepted, never a raw tenant ID');
  assert.equal(inv.cloud, '');
  assert.equal(inv.customerManagedKey, true);
  assert.equal(inv.settings.ueba, true);
  assert.equal(inv.workspaceManager.members, 3);
  assert.ok(inv.bookmarks <= 1000000);
  assert.deepEqual(inv.sentinelPlaybooks, [{ name: 'pb-snow', ticketing: true }]);
  assert.equal(inv.collected.logicApps, true);
  assert.throws(() => parseInventory(JSON.stringify({ ...raw, schemaVersion: 3 })), /Unsupported inventory schema version 3/);
});

test('a version 1 file still imports, and only its four original parts count as collected', () => {
  const inv = parseInventory(JSON.stringify({ schema: 'armohub.dma.inventory', schemaVersion: 1, workspace: { alias: 'OLD' }, analyticsRules: [], automationRules: [], dataConnectors: [], watchlists: [], errors: ['GET automationRules returned HTTP 403'] }));
  assert.equal(inv.collected.analyticsRules, true);
  assert.equal(inv.collected.automationRules, false);
  assert.equal(inv.collected.settings, false);
  const s = byQ(suggestAnswers([{ alias: 'OLD', kind: 'production', inv, res: analyseInventory(inv) }]));
  assert.equal(s.fusion.value, 'no');
  assert.equal(s.automation_rules, undefined, 'a part that failed gives no answer');
  assert.equal(s.ueba, undefined, 'a part a version 1 file never had gives no answer');
});

test('one busy workspace suggests Yes for every question the import can answer', () => {
  const s = byQ(suggestAnswers([item(busy())]));
  for (const q of INVENTORY_QUESTIONS.filter((x) => !['multi_workspace', 'multi_tenant', 'test_env', 'test_separate_tenant'].includes(x))) {
    assert.equal(s[q] && s[q].value, 'yes', `${q} should be Yes`);
    assert.ok(s[q].reasons.length && s[q].reasons.every((r) => r.includes('SOC-B')), `${q} names the workspace`);
  }
  assert.equal(s.multi_tenant.value, 'yes', 'a delegated subscription means more than one tenant');
  assert.equal(s.multi_workspace.value, 'no');
  const ids = new Set(KB.checks.map((c) => c.id));
  const findings = item(busy()).res.findings;
  for (const f of findings) assert.ok(ids.has(f.checkId), `${f.checkId} exists`);
  for (const id of ['PREP-GOV-03', 'PREP-CNT-06', 'PREP-TOP-06', 'PREP-CNT-07', 'PREP-CNT-03', 'PREP-CNT-01', 'PREP-ACC-06', 'PREP-ACC-04', 'PREP-SCOPE-05', 'PREP-TOP-05', 'PREP-CON-03', 'PREP-INT-01']) assert.ok(findings.some((f) => f.checkId === id), `a finding for ${id}`);
  assert.ok(!JSON.stringify(findings).includes('t-0000000b'), 'the tenant fingerprint is not shown as evidence');
});

test('Logic Apps that could not be read are said so, instead of looking like no playbooks', () => {
  const raw = quiet();
  raw.collected.logicApps = false;
  raw.errors = ['GET workflows returned HTTP 403'];
  const f = item(raw).res.findings.find((x) => x.checkId === 'PREP-AUT-03');
  assert.match(f.text, /could not list the Logic Apps/);
});

test('No is suggested only when every in-scope workspace was read for that part and none has it', () => {
  const s = byQ(suggestAnswers([item(quiet()), item({ ...quiet(), workspace: { ...quiet().workspace, alias: 'SOC-C' } })]));
  for (const q of YES_OR_NO_QUESTIONS.filter((x) => !['multi_workspace', 'test_separate_tenant'].includes(x))) {
    assert.equal(s[q] && s[q].value, 'no', `${q} should be No`);
    assert.match(s[q].reasons.join(' '), /none found in the 2 workspaces checked/);
  }
  for (const q of INVENTORY_QUESTIONS.filter((x) => !YES_OR_NO_QUESTIONS.includes(x))) assert.equal(s[q], undefined, `${q} can only ever be Yes`);
  const partly = quiet();
  partly.collected.settings = false;
  partly.errors = ['GET settings returned HTTP 403'];
  const t = byQ(suggestAnswers([item(quiet()), item(partly)]));
  assert.equal(t.ueba, undefined, 'one workspace not read means no No');
  assert.equal(t.fusion.value, 'no');
});

test('Yes in one workspace wins over No in the others', () => {
  const s = byQ(suggestAnswers([item(quiet()), item(busy())]));
  assert.equal(s.cmk.value, 'yes');
  assert.deepEqual(s.cmk.reasons.length, 1);
});

test('the workspace list answers the workspace and tenant questions', () => {
  const sameTenant = { ...quiet(), workspace: { ...quiet().workspace, alias: 'SOC-A2' } };
  assert.equal(byQ(suggestAnswers([item(quiet()), item(sameTenant)])).multi_workspace.value, 'yes');
  const other = { ...quiet(), workspace: { ...quiet().workspace, alias: 'SOC-X', tenantRef: 't-0000000c' } };
  const two = byQ(suggestAnswers([item(quiet()), item(other)]));
  assert.equal(two.multi_workspace.value, 'no', 'one workspace per tenant');
  assert.equal(two.multi_tenant.value, 'yes');
  const test1 = byQ(suggestAnswers([item(quiet()), item({ ...quiet(), workspace: { ...quiet().workspace, alias: 'SOC-TEST' } }, 'test')]));
  assert.equal(test1.test_env.value, 'yes');
  assert.equal(test1.test_separate_tenant.value, 'no');
  const test2 = byQ(suggestAnswers([item(quiet()), item(other, 'test')]));
  assert.equal(test2.test_separate_tenant.value, 'yes');
  assert.equal(byQ(suggestAnswers([item(quiet())])).test_env, undefined, 'no test workspace does not prove there is none');
});

test('every suggested question exists, and the questions only people can answer are never suggested', () => {
  const ids = new Set(KB.questions.map((q) => q.id));
  for (const q of INVENTORY_QUESTIONS) assert.ok(ids.has(q), q);
  assert.equal(INVENTORY_QUESTIONS.length, 28);
  assert.equal(YES_OR_NO_QUESTIONS.length, 13);
  for (const q of ['onboarded_any', 'data_residency', 'data_lake', 'manual_incidents', 'manual_playbooks', 'urbac', 'identityinfo']) assert.ok(!INVENTORY_QUESTIONS.includes(q), q);
  const all = suggestAnswers([item(busy()), item(quiet(), 'test')]);
  for (const s of all) assert.ok(INVENTORY_QUESTIONS.includes(s.questionId), s.questionId);
});
