// Step flows shared by the step page and the mission rows: the "do it here" actions, setting a status
// (with the evidence rules) and recording that no evidence is needed.
import { h, toast, modal, field, reducedMotion, savedPulse } from './dom.js';
import { state, mutate } from '../app/store.js';
import { statusById, setCheckStatus, setEvidenceWaiver } from '../core/model.js';
import { attachFiles, addNoteEvidence, addLinkEvidence } from './actions.js';
import { editRegisterItem, CONTROL_FORM } from './views/records.js';
import { importInventoryFlow, downloadInventoryScript } from './inventory.js';
import { saveSnapshotFlow } from './views/reports.js';

export { downloadInventoryScript };

// Moves focus to a field of "Your record" and briefly highlights it.
export function focusRecord(key) {
  const el = document.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
  if (!el) return;
  const box = el.closest('.field') || el.closest('.gate-form') || el;
  box.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
  setTimeout(() => box.classList.remove('flash'), 1700);
}

export function actionsFor(c) {
  const reg = (type) => () => editRegisterItem(null, { type, checkId: c.id, title: '' });
  return {
    'add-decision': reg('decision'), 'add-control': () => editRegisterItem(null, { type: 'decision', checkId: c.id, title: '', form: CONTROL_FORM }), 'add-risk': reg('risk'), 'add-issue': reg('issue'), 'add-action': reg('action'), 'add-exception': reg('exception'),
    'add-note': () => addNoteEvidence(c), 'add-screenshot': () => attachFiles(c, 'image'), 'add-file': () => attachFiles(c, 'file'), 'add-link': () => addLinkEvidence(c),
    'set-owner': () => focusRecord(`owner-${c.id}`), 'set-due': () => focusRecord(`due-${c.id}`), 'write-notes': () => focusRecord(`notes-${c.id}`),
    'record-gate': () => focusRecord(`gate-dec-${c.id}`),
    'open-tool': () => { const t = document.getElementById('do-it-here'); if (t) { t.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }); const f0 = t.querySelector('input, select, textarea, button'); if (f0) f0.focus({ preventScroll: true }); } },
    'waive-evidence': () => waiveEvidenceFlow(c),
    'save-snapshot': () => saveSnapshotFlow({ prepare: 'prepare', test: 'test', transition: 'transition', validate: 'validate' }[c.stage] || 'final'),
    'import-inventory': () => importInventoryFlow(), 'download-inventory-script': () => downloadInventoryScript(),
  };
}

export async function setStatusFlow(c, status) {
  const p = state.project;
  const st = p.checks[c.id] || { status: 'not_started', evidenceIds: [] };
  const evidence = st.evidenceIds.map((id) => p.evidence[id]).filter(Boolean);
  let reason = '';
  if (['failed', 'blocked', 'not_applicable'].includes(status) && status !== st.status) {
    const ta = h('textarea', { rows: '3', maxlength: '20000' });
    reason = await modal({ title: `${statusById(status).short}: what happened?`, body: h('div', { class: 'stack' }, h('p', null, 'A short explanation. It is shown in reports.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A reason is required.', 'bad'), null)) }] });
    if (!reason) return;
  }
  if (status === 'passed' && evidence.length === 0 && !st.evidenceWaiver) {
    const choice = await modal({ title: 'Passed needs evidence, or a reason why not', body: h('div', null, h('p', null, 'A pass is verified with evidence: a screenshot, an observation note, a link or a file.'), h('p', null, 'If your team decided this step needs no evidence, say why. Reports then show "evidence not needed", not missing evidence.')), actions: [{ label: 'Cancel', value: null }, { label: 'Done, not verified', value: 'nv' }, { label: 'No evidence needed', value: 'waive' }, { label: 'Add an observation note', kind: 'primary', value: 'note' }] });
    if (choice === 'note') { await addNoteEvidence(c); if ((state.project.checks[c.id] || { evidenceIds: [] }).evidenceIds.length) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
    else if (choice === 'waive') { if (await waiveEvidenceFlow(c)) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
    else if (choice === 'nv') mutate((pr) => setCheckStatus(pr, c, 'not_verified', { kbVersion: state.kb.meta.version }));
    return;
  }
  const res = mutate((pr) => setCheckStatus(pr, c, status, { reason, kbVersion: state.kb.meta.version }));
  if (res && !res.ok) { toast(res.error, 'bad', 7000); return; }
  if (['passed', 'not_verified', 'not_applicable'].includes(status)) savedPulse(location.hash.startsWith('#/mission/') ? `${statusById(status).short} recorded.` : `${statusById(status).short} recorded. Next step: top right or bottom of the page.`);
}

// "Not needed for us": the team decides this step needs no evidence, and says why.
export async function waiveEvidenceFlow(c) {
  const ta = h('textarea', { rows: '3', maxlength: '2000', placeholder: 'For example: agreed in the kick-off; the result is recorded in the change record' });
  const reason = await modal({ title: 'No evidence needed for this step', body: h('div', { class: 'stack' }, h('p', null, 'Record why. Reports show "evidence not needed" with your reason, your name and the date, so a reviewer can see it was a decision, not something forgotten.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Record the decision', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('Please give a reason.', 'bad'), null)) }] });
  if (!reason) return false;
  const res = mutate((pr) => setEvidenceWaiver(pr, c.id, reason, state.kb.meta.version));
  if (res && !res.ok) { toast(res.error, 'bad'); return false; }
  savedPulse('Recorded: no evidence needed');
  return true;
}
