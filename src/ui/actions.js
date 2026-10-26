// Cross-view user actions: opening project files, starting the demo, attaching evidence.
import { h, pickFile, modal, toast, confirmDialog, readBlobBytes, withLoader, showSequence } from './dom.js';
import { state, importProjectBytes, setProject, putEvidenceBlob, mutate, dropEvidenceBlob, prepareToLeaveProject, notify, closeProject } from '../app/store.js';
import { go, setExitDemo } from './shell.js';
import { generatedProof } from '../core/generated-proof.js';
import { addEvidence, removeEvidence, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_ITEMS } from '../core/model.js';
import { sniffMime, sha256Hex } from '../core/files.js';
import { bytesLabel, formatDate } from '../core/util.js';
import { buildDemoProject } from '../app/demo.js';
import { field } from './dom.js';

// Before another project replaces the open one: flush autosave, or ask before discarding unsaved work.
export async function confirmLeaveProject() {
  const r = await prepareToLeaveProject();
  if (r === 'ok') return true;
  if (r === 'failed') {
    return confirmDialog({ title: 'The open project could not be saved', message: [`Saving to browser storage failed: ${state.ui.saveError || 'unknown error'}.`, 'Save a project package first if you need the latest changes.'], confirmLabel: 'Continue without saving', danger: true });
  }
  return confirmDialog({ title: 'Discard unsaved changes?', message: [`"${state.project.meta.name || 'The open project'}" has changes that are not saved anywhere (autosave is off).`, 'Save a project package first if you need them.'], confirmLabel: 'Discard changes and continue', danger: true });
}

function evidenceRoom() {
  if (Object.keys(state.project.evidence).length >= MAX_EVIDENCE_ITEMS) {
    toast(`This project already has ${MAX_EVIDENCE_ITEMS} evidence items, the maximum a package can carry. Remove unneeded items first.`, 'bad', 9000);
    return false;
  }
  return true;
}

export async function openProjectFileFlow() {
  const [file] = await pickFile({ accept: '.zip,.json,application/zip,application/json' });
  if (!file) return;
  let res;
  try {
    const bytes = await readBlobBytes(file);
    res = await withLoader('Opening your project', () => importProjectBytes(bytes));
  } catch (e) {
    await modal({ title: 'This file could not be opened', body: h('div', null, h('p', null, e.message), h('p', { class: 'muted small' }, 'Nothing was changed. Project packages are .zip files created by this app; JSON data exports can also be opened (without attachments).')), actions: [{ label: 'OK', kind: 'primary', value: true }] });
    return;
  }
  const p = res.project;
  const existing = state.ui.browserProjects.find((x) => x.id === p.id);
  const body = h('div', null,
    h('dl', { class: 'kv' },
      h('dt', null, 'Project'), h('dd', null, p.meta.name || '(unnamed)'),
      h('dt', null, 'Organisation'), h('dd', null, p.meta.organisation || 'Not set'),
      h('dt', null, 'Last updated'), h('dd', null, formatDate(p.updatedAt, true) || 'Unknown'),
      h('dt', null, 'Checks with a recorded status'), h('dd', null, String(Object.values(p.checks).filter((c) => c.status !== 'not_started').length)),
      h('dt', null, 'Evidence records'), h('dd', null, `${Object.keys(p.evidence).length} (${res.evidence.size} attachment file(s) imported)`),
      h('dt', null, 'Source'), h('dd', null, res.source === 'package' ? 'Project package (.zip)' : 'JSON data export (no attachments)')),
    res.warnings.length ? h('div', { class: 'callout callout-caution' }, h('div', null, h('strong', null, `${res.warnings.length} note(s) from the import check`), h('ul', null, res.warnings.slice(0, 30).map((w) => h('li', null, w))), res.warnings.length > 30 ? h('p', { class: 'small' }, `…and ${res.warnings.length - 30} more.`) : null)) : h('p', { class: 'muted' }, 'Integrity checks passed.'),
    state.project && state.ui.unexported && !state.project.isDemo ? h('div', { class: 'callout callout-bad' }, h('div', null, h('strong', null, 'The project currently open has unsaved changes. '), 'Opening this file replaces it in this tab. Save a project package first if you need those changes.')) : null,
    existing && state.settings.storageMode === 'browser' ? h('p', { class: 'small' }, `A copy of this project is already stored in this browser (updated ${formatDate(existing.updatedAt, true)}). Opening the file will replace that copy.`) : null);
  const ok = await modal({ title: 'Open project', body, actions: [{ label: 'Cancel', value: false }, { label: 'Open project', kind: 'primary', value: true }] });
  if (!ok) return;
  if (!(await confirmLeaveProject())) return;
  setProject(p, res.evidence, { fromFile: true });
  toast('Project opened.', 'good');
  go('#/overview');
}

export async function startDemo() {
  if (!(await confirmLeaveProject())) return;
  const { project, evidence } = await withLoader('Preparing the demo project', async () => buildDemoProject(state.kb), { delayMs: 0, minMs: 500 });
  setProject(project, evidence, { fromFile: true });
  go('#/overview');
}

// Leaving the demo: it is fictional and never saved, so one confirmation is enough.
export async function exitDemo() {
  if (!state.project || !state.project.isDemo) { go('#/welcome'); return; }
  const ok = await confirmDialog({ title: 'Leave the demo?', message: ['The demo project is fictional and nothing in it is saved.', 'You will be back on the start page, ready to start your own project.'], confirmLabel: 'Leave the demo', cancelLabel: 'Stay in the demo' });
  if (!ok) return;
  closeProject();
  go('#/welcome');
  setTimeout(() => { const b = document.querySelector('[data-focus-key="start-own"]'); if (b) b.focus(); }, 60);
}
setExitDemo(exitDemo);

// Evidence attachment ---------------------------------------------------------

export async function attachFiles(check, kindHint) {
  const accept = kindHint === 'image' ? ALLOWED_IMAGE_TYPES.join(',') : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_FILE_TYPES, '.txt', '.csv', '.json', '.pdf', '.log'].join(',');
  if (!evidenceRoom()) return;
  const files = await pickFile({ accept, multiple: true });
  if (files.length) await ingestFiles(check, files);
}

// Every file a user adds (picked, pasted or dropped) goes through the same checks: size, real type and details.
export async function ingestFiles(check, files) {
  if (!evidenceRoom()) return 0;
  let added = 0;
  for (const f of files) {
    const name = f.name || 'pasted-screenshot.png';
    if (f.size > MAX_EVIDENCE_BYTES) { toast(`${name} is larger than ${bytesLabel(MAX_EVIDENCE_BYTES)} and was not attached. Crop or compress it, or attach a summary instead.`, 'bad', 9000); continue; }
    const bytes = await readBlobBytes(f);
    const mime = sniffMime(bytes);
    const isImage = mime && ALLOWED_IMAGE_TYPES.includes(mime);
    if (!mime || (!isImage && !ALLOWED_FILE_TYPES.includes(mime) && mime !== 'text/plain')) { toast(`${name}: unsupported or unsafe file type (allowed: PNG, JPEG, GIF, WebP, PDF, text, CSV, JSON).`, 'bad', 9000); continue; }
    const meta = await askEvidenceDetails({ fileName: name, isImage, size: f.size });
    if (!meta) continue;
    const sha256 = await sha256Hex(bytes);
    // Store the file content before the page re-renders, so the new thumbnail can find it.
    const ev = mutate((p) => addEvidence(p, check.id, { kind: isImage ? 'image' : 'file', title: meta.title || name, text: meta.text, fileName: name.slice(0, 260), mime, size: bytes.length, sha256, redactionConfirmed: meta.redaction, stage: check.stage }, state.kb.meta.version), { silent: true });
    putEvidenceBlob(ev.id, new Blob([bytes], { type: mime }));
    notify();
    added += 1;
  }
  if (added) toast(`${added} attachment(s) added.`, 'good');
  return added;
}

// Proof built from the user's own entries in this step's form. Returns false when the form is still empty.
export function addGeneratedProof(check) {
  const g = generatedProof(state.kb, state.project, check);
  if (!g) return false;
  mutate((p) => addEvidence(p, check.id, { kind: 'note', title: g.title, text: `Generated from your entries.\n${g.text}`, stage: check.stage, generated: true }, state.kb.meta.version));
  return true;
}

function askEvidenceDetails({ fileName, isImage, size }) {
  const title = h('input', { type: 'text', value: fileName.replace(/\.[a-z0-9]+$/i, ''), maxlength: '300' });
  const text = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'What does this show? Include the time, workspace alias and how it supports the result.' });
  const red = h('input', { type: 'checkbox' });
  return modal({
    title: isImage ? 'Add screenshot' : 'Add file',
    body: h('div', { class: 'stack' },
      h('p', { class: 'small muted' }, `${fileName} · ${bytesLabel(size)}`),
      field('Title', title, { required: true }),
      field('Description (optional)', text),
      h('div', { class: 'callout callout-info' }, h('div', null, h('strong', null, 'Sensitive data check. '), 'Screenshots and exports can contain tenant IDs, user names, IP addresses and incident details. Crop or redact what is not needed, and follow your organisation\'s data-handling policy. Files stay in this assistant and in the packages you save. Nothing is uploaded.')),
      h('label', { class: 'check-line' }, red, ' I have checked this attachment for data that should be redacted')),
    actions: [{ label: 'Cancel', value: null }, { label: 'Add evidence', kind: 'primary', value: () => (title.value.trim() ? { title: title.value.trim(), text: text.value, redaction: red.checked } : (toast('Please enter a title.', 'bad'), null)) }],
  }).then((v) => v || null);
}

export async function addNoteEvidence(check) {
  if (!evidenceRoom()) return;
  const title = h('input', { type: 'text', maxlength: '300', placeholder: 'For example: Workspaces page reviewed' });
  const text = h('textarea', { rows: '6', maxlength: '20000', placeholder: 'Describe what you observed, when, where, and the result. Paste query output summaries if helpful (avoid unnecessary personal data).' });
  const v = await modal({
    title: 'Add observation note',
    body: h('div', { class: 'stack' }, field('Title', title, { required: true }), field('Observation', text, { required: true })),
    actions: [{ label: 'Cancel', value: null }, { label: 'Add note', kind: 'primary', value: () => (title.value.trim() && text.value.trim() ? { title: title.value.trim(), text: text.value } : (toast('Title and observation are required.', 'bad'), null)) }],
  });
  if (!v) return;
  mutate((p) => addEvidence(p, check.id, { kind: 'note', title: v.title, text: v.text, stage: check.stage }, state.kb.meta.version));
  toast('Observation added.', 'good');
}

export async function addLinkEvidence(check) {
  if (!evidenceRoom()) return;
  const title = h('input', { type: 'text', maxlength: '300', placeholder: 'For example: Change record' });
  const url = h('input', { type: 'url', maxlength: '2000', placeholder: 'https://…' });
  const text = h('textarea', { rows: '3', maxlength: '20000' });
  const v = await modal({
    title: 'Add link',
    body: h('div', { class: 'stack' }, field('Title', title, { required: true }), field('Link (http or https)', url, { required: true, hint: 'Links point to systems outside this app (for example a change record). The app never opens them automatically.' }), field('Description (optional)', text)),
    actions: [{ label: 'Cancel', value: null }, { label: 'Add link', kind: 'primary', value: () => {
      if (!title.value.trim()) { toast('Please enter a title.', 'bad'); return null; }
      if (!/^https?:\/\/[^\s]+$/i.test(url.value.trim())) { toast('Enter a valid http:// or https:// link.', 'bad'); return null; }
      return { title: title.value.trim(), url: url.value.trim(), text: text.value };
    } }],
  });
  if (!v) return;
  mutate((p) => addEvidence(p, check.id, { kind: 'link', title: v.title, url: v.url, text: v.text, stage: check.stage }, state.kb.meta.version));
  toast('Link added.', 'good');
}

export async function removeEvidenceFlow(ev) {
  const ok = await confirmDialog({ title: 'Remove evidence?', message: [`"${ev.title || ev.fileName}" will be removed from this project. If it is the last evidence on a check marked "Passed, verified", the step becomes "Done, not verified".`, 'This is recorded in the audit log. Copies in project packages you saved earlier are not affected.'], confirmLabel: 'Remove', danger: true });
  if (!ok) return;
  mutate((p) => removeEvidence(p, ev.id));
  await dropEvidenceBlob(ev.id);
  toast('Evidence removed.', 'info');
}
