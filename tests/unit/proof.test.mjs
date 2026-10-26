// Proof: pastes that carry files become evidence; text pastes are left alone. Generated notes say what they are.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KB } from '../../content/kb.mjs';
import { createProject, setEnvironments, setPlannedPrimary, setApprovers, addAudit, addEvidence } from '../../src/core/model.js';
import { generatedProof } from '../../src/core/generated-proof.js';
import { filesFromTransfer, shouldTakePaste } from '../../src/core/paste.js';
import { buildReportModel } from '../../src/core/report.js';

const byId = (id) => KB.checks.find((c) => c.id === id);

test('a paste with files is taken as proof, unless it also carries text into a text field', () => {
  const file = { name: 'shot.png', size: 10, type: 'image/png' };
  assert.equal(shouldTakePaste({ clipboardData: { files: [file], types: ['Files'] }, target: { tagName: 'TEXTAREA' } }), true, 'an image alone, even into a note');
  assert.equal(shouldTakePaste({ clipboardData: { files: [file], types: ['text/plain', 'Files'] }, target: { tagName: 'H1' } }), true, 'focus outside any text field');
  assert.equal(shouldTakePaste({ clipboardData: { files: [file], types: ['text/plain', 'Files'] }, target: { tagName: 'INPUT' } }), false, 'an Excel or OneNote copy into a field keeps its text');
  assert.equal(shouldTakePaste({ clipboardData: { files: [file], types: ['text/plain', 'Files'] }, target: { tagName: 'DIV', isContentEditable: true } }), false);
  assert.deepEqual(filesFromTransfer({ files: [file] }), [file]);
});

test('a text paste into a note field is left to the browser', () => {
  assert.equal(shouldTakePaste({ clipboardData: { files: [] }, target: { tagName: 'TEXTAREA' } }), false);
  assert.equal(shouldTakePaste({ clipboardData: null, target: { tagName: 'INPUT' } }), false);
});

test('generated proof comes only from what the forms hold', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  assert.equal(generatedProof(KB, p, byId('PREP-TOP-01')), null, 'nothing entered yet');
  setEnvironments(p, [{ alias: 'SOC-PROD', kind: 'production', region: 'West Europe' }, { alias: 'SOC-PROD-2', kind: 'production' }]);
  assert.match(generatedProof(KB, p, byId('PREP-TOP-01')).text, /SOC-PROD: production, West Europe/);
  assert.equal(generatedProof(KB, p, byId('PREP-TOP-02')), null, 'no primary chosen yet');
  setPlannedPrimary(p, '', 'SOC-PROD');
  assert.match(generatedProof(KB, p, byId('PREP-TOP-02')).text, /SOC-PROD-2: planned secondary/);
  setApprovers(p, [{ role: 'SOC lead', name: 'Kim' }]);
  assert.equal(generatedProof(KB, p, byId('PREP-SCOPE-02')).text, 'SOC lead: Kim');
  addAudit(p, 'briefing.copied', 'Briefing for Security leadership copied');
  assert.match(generatedProof(KB, p, byId('PREP-SCOPE-01')).text, /Briefing for Security leadership copied/);
  assert.equal(generatedProof(KB, p, byId('PREP-DET-01')), null, 'steps without a form get no generated proof');
});

test('reports say when a note was generated from your entries', () => {
  const p = createProject({ meta: { operatorName: 'Sam' }, mode: 'full' });
  addEvidence(p, 'PREP-TOP-01', { kind: 'note', title: 'Workspace inventory (from your entries)', text: 'x', generated: true });
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  assert.equal(m.evidenceIndex.find((e) => e.checkId === 'PREP-TOP-01').generated, true);
});
