// Regression tests for defects found by the independent code review (numbers refer to the review findings).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KB } from '../../content/kb.mjs';
import { kb as smallKb } from './fixtures.mjs';
import { createProject, setAnswer, setCheckStatus, addEvidence, addRegisterItem, updateRegisterItem, acceptException, recordGate } from '../../src/core/model.js';
import { assessStage, overallAssessment, exceptionsByCheck } from '../../src/core/readiness.js';
import { evaluateApplicability, applicabilityMap } from '../../src/core/applicability.js';
import { buildReportModel } from '../../src/core/report.js';
import { validateProject } from '../../src/core/schema.js';
import { readProjectFile, buildPackage } from '../../src/core/package.js';
import { sniffMime, extensionFor, sha256Hex } from '../../src/core/files.js';
import { parseInventory, analyseInventory } from '../../src/core/inventory.js';

const PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
const check = (id) => KB.checks.find((c) => c.id === id);
const fresh = (mode = 'tailored') => { const p = createProject({ mode }); p.meta.operatorName = 'Reviewer'; return p; };
const raw = (p) => JSON.parse(JSON.stringify(p));

test('#1 final report headline is the weakest stage, not just validation', () => {
  const p = fresh('full');
  // make validate "ready": every validate item passed with evidence or N/A
  for (const c of KB.checks.filter((x) => x.stage === 'validate')) { addEvidence(p, c.id, { kind: 'note', title: 't', text: 't' }); setCheckStatus(p, c, 'passed'); }
  assert.equal(assessStage(KB, p, 'validate').level, 'ready');
  setCheckStatus(p, check('PREP-AUT-01'), 'failed', { reason: 'broken' });
  const m = buildReportModel('final', KB, p, { appVersion: 't' });
  assert.equal(m.conclusion.level, 'not_ready');
  assert.equal(overallAssessment(KB, p).level, 'not_ready');
});

test('#2 markup-like text is never accepted as a plain-text file; download extension comes from the type', () => {
  assert.equal(sniffMime(new TextEncoder().encode('  <script>alert(1)</script>')), null);
  assert.equal(sniffMime(new TextEncoder().encode('report\n<iframe src=x>')), null);
  assert.equal(sniffMime(new TextEncoder().encode('col1,col2\n1,2')), 'text/plain');
  assert.equal(extensionFor('text/plain'), 'txt');
});

test('#3 a critical issue linked to an item that is not in the knowledge base still blocks', () => {
  const p = fresh();
  addRegisterItem(p, { type: 'issue', title: 'Orphan', severity: 'critical', checkId: 'NOT-IN-KB' });
  assert.equal(assessStage(KB, p, 'prepare').level, 'not_ready');
  assert.ok(buildReportModel('prepare', KB, p, { appVersion: 't' }).register.some((r) => r.title === 'Orphan'));
});

test('#4a "accepted" cannot be set through a normal register update', () => {
  const p = fresh();
  const r = addRegisterItem(p, { type: 'issue', title: 'Critical', severity: 'critical' });
  updateRegisterItem(p, r.id, { status: 'accepted' });
  assert.equal(p.register[0].status, 'open');
  assert.equal(addRegisterItem(p, { type: 'exception', title: 'x', status: 'accepted' }).status, 'open');
});

test('#4b/#4c changing type, item or status of an accepted exception withdraws the acceptance', () => {
  for (const patch of [{ type: 'issue' }, { checkId: 'PREP-ACC-01' }, { title: 'Different' }, { status: 'open' }]) {
    const p = fresh();
    setCheckStatus(p, check('PREP-AUT-01'), 'failed', { reason: 'x' });
    const r = addRegisterItem(p, { type: 'exception', title: 'Accept', checkId: 'PREP-AUT-01', severity: 'high' });
    acceptException(p, r.id, { acceptedBy: 'CISO', rationale: 'ok' });
    updateRegisterItem(p, r.id, patch);
    assert.notEqual(p.register[0].status, 'accepted', JSON.stringify(patch));
    assert.equal(p.register[0].acceptedBy, '', JSON.stringify(patch));
  }
});

test('#4d an acceptance covers only the status it was given for', () => {
  const p = fresh();
  setCheckStatus(p, check('PREP-AUT-01'), 'blocked', { reason: 'waiting' });
  const r = addRegisterItem(p, { type: 'exception', title: 'Accept', checkId: 'PREP-AUT-01', severity: 'high' });
  acceptException(p, r.id, { acceptedBy: 'CISO', rationale: 'ok' });
  assert.equal(exceptionsByCheck(p).has('PREP-AUT-01'), true);
  setCheckStatus(p, check('PREP-AUT-01'), 'failed', { reason: 'now actually broken' });
  assert.equal(exceptionsByCheck(p).has('PREP-AUT-01'), false);
});

test('#6 a pass backed only by an attachment without content is downgraded on import', async () => {
  const p = fresh();
  addEvidence(p, 'PREP-SCOPE-01', { kind: 'image', title: 'shot', fileName: 's.png', mime: 'image/png' });
  setCheckStatus(p, check('PREP-SCOPE-01'), 'passed');
  const back = await readProjectFile(new TextEncoder().encode(JSON.stringify(p)), { kb: KB });
  assert.equal(back.project.checks['PREP-SCOPE-01'].status, 'not_verified');
  // package whose evidence fails its hash check
  const ev = Object.values(p.evidence)[0];
  ev.sha256 = await sha256Hex(PNG);
  const { blob } = await buildPackage(p, async () => new Uint8Array([...PNG, 1]), { appVersion: 't', kbVersion: 't', productName: 'T' });
  const back2 = await readProjectFile(new Uint8Array(await blob.arrayBuffer()), { kb: KB });
  assert.equal(back2.project.checks['PREP-SCOPE-01'].status, 'not_verified');
});

test('#7 import enforces the same record rules as the app', () => {
  const p = fresh();
  const r = raw(p);
  r.checks = {
    'PREP-SCOPE-01': { status: 'failed', statusReason: '' },
    'PREP-SCOPE-02': { status: 'passed', evidenceIds: ['ev_other'] },
  };
  r.evidence = { ev_other: { kind: 'note', title: 'n', text: 't', checkId: 'PREP-SCOPE-03' } };
  r.stages = { test: { availability: 'unavailable', reason: '' } };
  r.register = [{ id: 'reg_1', type: 'issue', title: 'a' }, { id: 'reg_1', type: 'issue', title: 'dup' }, { id: 'reg_2', type: 'issue', title: 'b', status: 'accepted', acceptedBy: 'X', rationale: 'y' }];
  r.gates = { 'PREP-PLN-05': { decision: 'no_go', decidedBy: 'Lead', rationale: '' } };
  const v = validateProject(r, { kb: KB });
  assert.equal(v.project.checks['PREP-SCOPE-01'].status, 'needs_review');
  assert.equal(v.project.checks['PREP-SCOPE-02'].status, 'not_verified', 'evidence from another item does not support a pass');
  assert.equal(v.project.stages.test.availability, 'undecided');
  assert.equal(v.project.register.length, 2);
  assert.equal(v.project.register[1].status, 'open', 'only exceptions can be accepted');
  assert.equal(v.project.gates['PREP-PLN-05'], undefined);
});

test('#8 every change into a status that needs a rationale requires a new one', () => {
  const p = fresh();
  setCheckStatus(p, check('PREP-SCOPE-01'), 'blocked', { reason: 'waiting on vendor' });
  assert.equal(setCheckStatus(p, check('PREP-SCOPE-01'), 'not_applicable').ok, false);
  assert.equal(setCheckStatus(p, check('PREP-SCOPE-01'), 'not_applicable', { reason: 'out of scope' }).ok, true);
  assert.equal(p.checks['PREP-SCOPE-01'].statusReason, 'out of scope');
  setCheckStatus(p, check('PREP-SCOPE-01'), 'in_progress');
  assert.equal(p.checks['PREP-SCOPE-01'].statusReason, '', 'stale rationale cleared');
});

test('#12 a follow-up question ruled out by its parent does not keep an item uncertain', () => {
  const p = fresh();
  setAnswer(p, 'manual_playbooks', 'yes');
  setAnswer(p, 'playbooks', 'no');
  assert.equal(evaluateApplicability(check('PREP-AUT-04'), p, KB).value, 'not_applicable');
  setAnswer(p, 'playbooks', 'yes');
  assert.equal(evaluateApplicability(check('PREP-AUT-04'), p, KB).value, 'applies');
});

test('#13 a failed automation-rule collection never produces a "nothing risky" note; odd kinds are not standalone', () => {
  const inv = parseInventory(fs.readFileSync('tests/fixtures-inventory-failed.json', 'utf8'));
  const a = analyseInventory(inv);
  assert.equal(a.findings.some((f) => f.checkId === 'PREP-AUT-01'), false);
  const odd = analyseInventory(parseInventory(JSON.stringify({ schema: 'armohub.dma.inventory', schemaVersion: 1, dataConnectors: [{ kind: 'constructor' }, { kind: '__proto__' }] })));
  assert.equal(odd.suggestions.some((s) => s.questionId === 'standalone_connectors'), false);
});

test('#17 hostile values with odd toString do not crash import', () => {
  const r = raw(fresh());
  r.meta.name = { toString: 1 };
  r.checks = { 'PREP-SCOPE-01': { status: 'not_started', notes: { toString: 1 } } };
  const v = validateProject(r, { kb: KB });
  assert.equal(v.ok, true);
  assert.equal(v.project.meta.name, '');
});

test('#19 a blocking issue wins even when nothing is in scope', () => {
  const p = createProject({ mode: 'tailored' });
  const k = { ...smallKb, checks: smallKb.checks.filter((c) => c.stage !== 'validate') };
  addRegisterItem(p, { type: 'issue', title: 'Blocking', severity: 'critical' });
  assert.equal(assessStage(k, p, 'validate').level, 'not_ready');
});

test('#22 "why" reasons under not() cite only answers that support the outcome', () => {
  const p = fresh();
  setAnswer(p, 'q_multi', 'no');
  const r = evaluateApplicability(smallKb.checks.find((c) => c.id === 'P-4'), p, smallKb);
  assert.equal(r.value, 'applies');
  assert.ok(r.reasons.some((x) => /No/.test(x)));
});

test('gate decisions keep validation strict after the fixes', () => {
  const p = fresh();
  assert.equal(recordGate(p, 'X', { decision: 'go_with_exceptions', decidedBy: 'Lead' }).ok, false);
  assert.ok(applicabilityMap(KB, p).size === KB.checks.length);
});

test('#20 importing a preferences file cannot switch on browser storage or acknowledge the disclaimer', async () => {
  const store = await import('../../src/app/store.js');
  store.state.settings.storageMode = 'none';
  store.state.settings.disclaimerAcknowledgedAt = '';
  store.importSettings({ schema: 'armohub.dma.settings', storageMode: 'browser', disclaimerAcknowledgedAt: '2026-01-01', welcomeSeen: true, theme: 'dark', operatorName: 'Imported Name' });
  assert.equal(store.state.settings.storageMode, 'none');
  assert.equal(store.state.settings.disclaimerAcknowledgedAt, '');
  assert.equal(store.state.settings.theme, 'dark');
  assert.equal(store.state.settings.operatorName, 'Imported Name');
});
