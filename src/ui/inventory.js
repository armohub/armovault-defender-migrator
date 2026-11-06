// The inventory import, the same in setup and inside a project: download the read-only script, run it, and drop
// every file it wrote (the inventory files and workspaces.json) right there, in any order. One review lists the
// workspaces and the answers the import fills in; nothing changes until you import. The logic is in
// src/core/inventory-import.js.
import { h, icon, field, pickFile, toast, copyText, withLoader, readBlobBytes, savedPulse, reducedMotion, saveBlob } from './dom.js';
import { state, mutate, putEvidenceBlob } from '../app/store.js';
import { go, render, nudgeSave } from './shell.js';
import { parseInventory, analyseInventory, MAX_INVENTORY_BYTES, parseWorkspaceList } from '../core/inventory.js';
import { newImportSession, addReadFiles, listedFor, missingFiles, refreshSuggestions, applyImport } from '../core/inventory-import.js';
import { applicabilityMap } from '../core/applicability.js';
import { filesFromTransfer } from '../core/paste.js';
import { sha256Hex } from '../core/files.js';
import { answerLabel } from '../core/model.js';
import { btn, callout } from './components.js';

export const INVENTORY_CMD = '.\\Get-ArMoSentinelInventory.ps1 -OutFolder .\\inventory';
const STEP_ID = 'PREP-DET-01';

// Reads the chosen files without changing the project: [{ file, bytes, sha, inv, res }], { file, list } or { file, error }.
export async function readInventoryFiles(files) {
  const out = [];
  for (const file of files) {
    if (file.size > MAX_INVENTORY_BYTES) { out.push({ file, error: 'The file is larger than 5 MB.' }); continue; }
    try {
      const bytes = await readBlobBytes(file);
      const text = new TextDecoder('utf-8').decode(bytes);
      // workspaces.json is not an inventory: it carries the subscription and resource group of each workspace.
      const list = parseWorkspaceList(text);
      if (list) { out.push({ file, list }); continue; }
      const inv = parseInventory(text);
      out.push({ file, bytes, sha: await sha256Hex(bytes), inv, res: analyseInventory(inv) });
    } catch (e) { out.push({ file, error: e.message }); }
  }
  return out;
}

export function downloadInventoryScript() {
  const sn = state.kb.snippets.PS_INVENTORY_SCRIPT;
  if (!sn) return;
  saveBlob(new Blob([sn.code.split('\n').join('\r\n')], { type: 'text/plain' }), 'Get-ArMoSentinelInventory.ps1', { description: 'PowerShell script', accept: { 'text/plain': ['.ps1'] } });
}

// A drop area for every file of the inventory folder, with a button for those who prefer the file dialog.
function dropZone(onFiles, { label }) {
  const zone = h('div', { class: 'inv-drop' },
    icon('upload', 'icon-sm'),
    h('div', null, h('strong', null, 'Drop the inventory files here'), h('span', { class: 'small muted' }, 'Every file in the inventory folder at once, workspaces.json included, in any order.')),
    btn(label, async () => { const files = await pickFile({ accept: '.json,application/json', multiple: true }); if (files.length) onFiles(files); }, { small: true, iconName: 'upload', kind: 'primary' }));
  zone.addEventListener('dragover', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); zone.classList.add('drop-ready'); } });
  zone.addEventListener('dragleave', () => zone.classList.remove('drop-ready'));
  zone.addEventListener('drop', (e) => {
    zone.classList.remove('drop-ready');
    const files = filesFromTransfer(e.dataTransfer);
    if (!files.length) return;
    e.preventDefault();
    onFiles(files);
  });
  return zone;
}

// Download, run, drop: the three parts, on the page that asks you to run the script.
export function inventorySteps({ onFiles, hasFiles }) {
  return h('ol', { class: 'steps inv-steps' },
    h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Download the read-only script. '), 'It only reads (GET requests). It never changes anything, never signs you in and sends nothing anywhere except Azure Resource Manager.'),
      h('div', { class: 'row-actions' }, btn('Download Get-ArMoSentinelInventory.ps1', downloadInventoryScript, { small: true, iconName: 'download' }))),
    h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Run it in PowerShell. '), 'Sign in with ', h('code', null, 'Connect-AzAccount'), ' first. Your account needs Microsoft Sentinel Reader on the workspaces\' resource groups. No parameters are needed: it finds every Sentinel workspace you can read.'),
      h('pre', { class: 'code' }, INVENTORY_CMD),
      h('div', { class: 'row-actions' }, btn('Copy the command', async () => { await copyText(INVENTORY_CMD); toast('Command copied.', 'good'); }, { small: true, iconName: 'copy' })),
      h('p', { class: 'small muted' }, 'It writes one inventory file per workspace and a list of the workspaces (workspaces.json) into the inventory folder. Look the files over before you import them: rule and watchlist names can be sensitive.')),
    h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Import the files here. '), 'You see what was found before anything changes.'),
      dropZone(onFiles, { label: hasFiles ? 'Add more files' : 'Choose the inventory files' })));
}

// What was read: the workspaces (in scope or not, with their subscription and resource group), the files that are
// missing, and the answers the import fills in. inProject: compare with the workspaces and answers you have.
export function inventoryReview(session, { refresh, inProject = false }) {
  const kb = state.kb;
  const p = inProject ? state.project : null;
  const answers = p ? p.answers : {};
  const known = (it) => !!p && (p.meta.environments || []).some((e) => e.alias.toLowerCase() === String(it.alias || '').trim().toLowerCase());
  const resuggest = () => { refreshSuggestions(session, answers); refresh(); };
  const found = session.items;
  const missing = missingFiles(session);
  const qText = (id) => (kb.questions.find((q) => q.id === id) || { text: id }).text;
  const offered = session.suggest.filter((x) => !x.same);
  const matching = session.suggest.length - offered.length;
  const rows = found.map((it, i) => {
    const w = listedFor(session, it);
    return h('div', { class: ['import-ws', !it.inScope && 'off'] },
      h('label', { class: 'check-line import-scope' }, h('input', { type: 'checkbox', checked: it.inScope, 'data-focus-key': `imp-scope-${i}`, onchange: (e) => { it.inScope = e.target.checked; resuggest(); } }), h('span', null, 'In scope')),
      field('Workspace', h('input', { type: 'text', value: it.alias, maxlength: '120', placeholder: 'Type the workspace name', 'aria-invalid': it.inScope && !it.alias.trim() ? 'true' : 'false', 'data-focus-key': `imp-alias-${i}`, oninput: (e) => { it.alias = e.target.value; } }),
        it.inScope && !it.alias.trim() ? { hint: 'This file does not say which workspace it is. Type the workspace name.' } : {}),
      field('Type', h('select', { 'data-focus-key': `imp-kind-${i}`, onchange: (e) => { it.kind = e.target.value; resuggest(); } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: it.kind === k }, k)))),
      h('div', { class: 'small muted import-counts' },
        [inProject ? (known(it) ? 'Already in your project' : 'New workspace') : '', it.inv.region, w ? `${w.resourceGroup} in ${w.subscription}` : '', `${it.res.counts.analyticsRules} analytics rules`, `${it.res.counts.automationRules} automation rules`, `${it.res.counts.dataConnectors} connectors`, `${it.res.counts.watchlists} watchlists`].filter(Boolean).join(' · '),
        it.res.errors.length ? h('div', { class: 'field-error' }, `${it.res.errors.length} request(s) failed while collecting. Some results may be missing.`) : null));
  });
  const fileHint = () => {
    if (session.list.length && !found.length) {
      const typed = p ? (p.meta.environments || []).filter((e) => session.list.some((w) => [w.alias, w.workspaceName].some((x) => x && x.toLowerCase() === e.alias.toLowerCase()))).length : 0;
      return callout('info', `workspaces.json lists ${session.list.length} workspace${session.list.length === 1 ? '' : 's'}: ${session.list.map((w) => w.alias || w.workspaceName).join(', ')}.`,
        ' Now add the inventory files from the same folder (inventory-<name>.json): they hold what is in each workspace.',
        typed ? ` ${typed} of them ${typed === 1 ? 'is' : 'are'} already in your project, and import fills in ${typed === 1 ? 'its' : 'their'} subscription and resource group.` : '');
    }
    if (session.list.length && missing.length) return h('p', { class: 'small muted' }, `workspaces.json also lists ${missing.map((w) => w.alias || w.workspaceName).join(', ')}, with no inventory file chosen. Add ${missing.length === 1 ? 'its file' : 'their files'} if ${missing.length === 1 ? 'it is' : 'they are'} in scope.`);
    if (found.length && !session.list.length) return h('p', { class: 'small muted' }, 'Add workspaces.json from the same folder to fill in each workspace\'s subscription and resource group. You can also type them later.');
    return null;
  };
  return h('div', { class: 'stack' },
    session.errors.length ? callout('caution', 'Some files were not imported.', h('ul', null, session.errors.map((e) => h('li', null, e)))) : null,
    found.length ? h('div', { class: 'stack' },
      h('h3', null, `Found ${found.length} workspace${found.length === 1 ? '' : 's'}. Which are in scope?`),
      h('p', { class: 'small muted' }, 'Untick the ones you are not moving. You can rename them to the aliases your team uses.'),
      ...rows) : null,
    fileHint(),
    offered.length ? h('div', { class: 'stack' },
      h('h3', null, 'Answers the import fills in for you'),
      h('p', { class: 'small muted' }, `Based on what the script found in the workspaces in scope: ${offered.length} of ${kb.questions.filter((q) => !q.derived).length} questions. No is suggested only when the script could read that part in every workspace in scope. Untick any that are wrong; you can change every answer later.${matching ? ` ${matching} more already match${matching === 1 ? 'es' : ''} what you answered.` : ''}`),
      h('ul', { class: 'list' }, offered.map((sg) => h('li', { class: 'list-row' }, h('label', { class: 'check-line' },
        h('input', { type: 'checkbox', checked: sg.on, 'data-focus-key': `imp-q-${sg.questionId}`, onchange: (e) => { sg.on = e.target.checked; } }),
        h('span', null, qText(sg.questionId), h('strong', null, sg.value === 'no' ? ' No' : ' Yes'),
          h('span', { class: 'small muted' }, ` (${sg.reasons.slice(0, 2).join('; ')}${sg.reasons.length > 2 ? '; and more' : ''})`),
          sg.current && !sg.same ? h('span', { class: 'small imp-current' }, ` You answered ${answerLabel(sg.current)}.`) : null)))))) : null);
}

// ───────── Inside a project: "Do it here" on the step that asks you to run the script ─────────
const proj = { id: '', session: newImportSession(), result: null };
function projectSession() {
  const p = state.project;
  if (proj.id !== p.id) Object.assign(proj, { id: p.id, session: newImportSession(), result: null });
  return proj;
}
const countApplicable = () => [...applicabilityMap(state.kb, state.project).values()].filter((a) => a.value !== 'not_applicable').length;

async function addFiles(files) {
  const s = projectSession();
  const read = await withLoader('Reading your inventory files', () => readInventoryFiles(files));
  addReadFiles(s.session, read, { answers: state.project.answers });
  s.result = null;
}

function showPanel() {
  const el = document.getElementById('inventory-import');
  if (el) el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

// The Stage 1 and Evidence buttons and the "import the inventory results" links: choose the files, then review
// them on the step that holds the import.
export async function importInventoryFlow() {
  const files = await pickFile({ accept: '.json,application/json', multiple: true });
  if (!files.length) return;
  await addFiles(files);
  go(`#/item/${STEP_ID}`);
  requestAnimationFrame(showPanel);
}

function doImport() {
  const s = projectSession();
  const { session } = s;
  if (session.items.some((x) => x.inScope && !x.alias.trim())) { toast('Type a name for each workspace in scope.', 'bad'); return; }
  const before = countApplicable();
  const res = mutate((pr) => applyImport(pr, session, { kb: state.kb, putBlob: (id, bytes) => putEvidenceBlob(id, new Blob([bytes], { type: 'application/json' })) }));
  if (!res || !res.ok) { toast((res && res.error) || 'Nothing was imported.', 'bad', 8000); return; }
  s.result = { ...res, before, after: countApplicable(), workspaces: session.items.filter((x) => x.inScope).length };
  s.session = newImportSession();
  render();
  savedPulse('Inventory imported');
  nudgeSave('Inventory imported.');
  requestAnimationFrame(showPanel);
}

function resultCard(r) {
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  if (!r.added.length && !r.updated && !r.evidence && !r.files && !r.answers) return callout('info', 'Nothing new.', ' These files were imported before: no workspace, note, file or answer was added twice.');
  const lines = [
    r.workspaces ? h('li', null, `${plural(r.workspaces, 'workspace')} imported: ${[r.added.length ? `${r.added.length} added to your list` : '', r.updated ? `${r.updated} filled in` : ''].filter(Boolean).join(', ') || 'already in your list, nothing to fill in'}. `, h('a', { href: '#/project/environments' }, 'See them in Project setup')) : r.updated ?h('li', null, `Subscription and resource group filled in for ${plural(r.updated, 'workspace')}. `, h('a', { href: '#/project/environments' }, 'See them in Project setup')) : null,
    r.answers ? h('li', null, `${plural(r.answers, 'answer')} filled in. `, h('a', { href: '#/answers' }, 'Review your answers')) : null,
    r.evidence || r.files ? h('li', null, `Evidence added to ${plural(r.steps, 'step')}, labelled "imported". Statuses are not changed: you decide them.`) : null,
    r.after !== r.before ? h('li', null, `Your plan now has ${r.after} steps (it had ${r.before}).`) : h('li', null, `Your plan still has ${r.after} steps.`),
  ].filter(Boolean);
  return callout('good', 'Imported.', h('ul', { class: 'bullets' }, lines));
}

export function inventoryTool() {
  const s = projectSession();
  const { session } = s;
  const p = state.project;
  const kept = ((p.checks[STEP_ID] || {}).evidenceIds || []).filter((id) => p.evidence[id] && p.evidence[id].origin === 'import' && p.evidence[id].kind === 'file').length;
  const pending = session.items.length || session.list.length;
  const inScope = session.items.filter((x) => x.inScope).length;
  const onFiles = async (files) => { await addFiles(files); render(); };
  return h('div', { class: 'tool stack', id: 'inventory-import' },
    s.result ? resultCard(s.result) : null,
    kept && !pending && !s.result ? h('p', { class: 'small muted' }, `${kept} inventory file${kept === 1 ? ' is' : 's are'} already imported and kept as evidence on this step. After a new run, import the new files: nothing is added twice.`) : null,
    inventorySteps({ onFiles, hasFiles: !!pending }),
    pending ? inventoryReview(session, { refresh: render, inProject: true }) : null,
    pending ? h('div', { class: 'row-actions' },
      btn(inScope ? `Import ${inScope} workspace${inScope === 1 ? '' : 's'}` : 'Fill in subscriptions and resource groups', doImport, { kind: 'primary', iconName: 'check' }),
      btn('Start over', () => { s.session = newImportSession(); render(); }, { kind: 'ghost', small: true })) : null);
}
