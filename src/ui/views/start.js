// Welcome page and the new-project wizard.
import { h, icon, field, toast, confirmDialog, externalLink, pickFile, copyText, withLoader } from '../dom.js';
import { state, setProject, updateSettings, openBrowserProject, deleteBrowserProject, setStorageMode, mutate } from '../../app/store.js';
import { go, route } from '../shell.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { createProject, addAudit, setAnswer, setInventoryChoice } from '../../core/model.js';
import { applicabilityMap } from '../../core/applicability.js';
import { summariseStage } from '../../core/readiness.js';
import { openProjectFileFlow, startDemo, confirmLeaveProject } from '../actions.js';
import { btn, callout, daysUntil, infoTip } from '../components.js';
import { readInventoryFiles, applyInventory } from '../inventory.js';
import { downloadInventoryScript } from '../step-actions.js';
import { formatDate, bytesLabel, nowIso } from '../../core/util.js';
import { DISCLAIMER_SHORT } from '../../core/report.js';
import { routeView } from '../route.js';
import { freshRoute } from '../shell.js';

export function thanksLine(prefix = 'Found it useful? Say thanks to') {
  const links = BRAND.makers.filter((m) => m.profileUrl).map((m) => externalLink(m.profileUrl, m.name, { class: 'ext', title: `${m.name} on LinkedIn (opens in a new tab, needs internet)` }));
  return h('p', { class: 'thanks' }, icon('heart', 'icon-sm'), `${prefix} `, ...links.flatMap((l, i) => [i ? ' and ' : '', l]), ' on LinkedIn.');
}

export function makersStrip() {
  return h('section', { class: 'makers-strip', 'aria-label': 'The makers' },
    h('div', { class: 'makers-avatars', 'aria-hidden': 'true' }, BRAND.makers.map((m) => h('span', { class: 'avatar' }, m.initials))),
    h('blockquote', null, h('p', null, `“${BRAND.quote}”`), h('footer', null, `${BRAND.makers.map((m) => m.name).join(' and ')}, makers of ${BRAND.brandName}`)),
    thanksLine());
}

// ───────────────────────────── Welcome ─────────────────────────────
route('welcome', () => {
  const recent = state.ui.browserProjects;
  const p = state.project;
  const days = daysUntil('2027-03-31');
  let continueCard = null;
  if (p && !p.isDemo) {
    const appMap = applicabilityMap(state.kb, p);
    const sums = state.kb.stages.map((s) => summariseStage(state.kb, p, s.id, appMap).counts);
    const inScope = sums.reduce((a, c) => a + c.inScope, 0);
    const assessed = sums.reduce((a, c) => a + c.assessed, 0);
    continueCard = h('a', { href: '#/overview', class: 'hero-continue' }, icon('play'), h('span', null, h('strong', null, `Continue "${p.meta.name || 'your project'}"`), h('br'), h('span', { class: 'small muted' }, `${assessed} of ${inScope} steps checked`)), icon('arrow', 'icon-sm'));
  }
  const sample = {
    stages: [
      { name: 'Plan', meta: 'setup and questions', href: '#/welcome', state: 'current' },
      { name: 'Prepare', meta: 'know and fix', href: '#/welcome', state: 'todo' },
      { name: 'Test', meta: 'optional', href: '#/welcome', state: 'todo' },
      { name: 'Transition', meta: 'the change', href: '#/welcome', state: 'todo' },
      { name: 'Validate', meta: 'prove it works', href: '#/welcome', state: 'todo' },
    ],
    marker: { index: 0, fraction: 0.6 },
  };
  const promises = [
    ['wifioff', 'Works offline', 'The browser blocks every network request from this file.'],
    ['cpu', 'Processed on this device', 'Nothing is uploaded. There is no account and no cloud.'],
    ['lock', 'Saved only where you choose', 'In this browser, or in project files you keep.'],
    ['knowledge', 'Grounded in Microsoft Learn', `${state.kb.sources.length} official pages, cited on every step.`],
    ['evidence', 'Evidence, not checkboxes', 'A step counts as verified only with proof attached.'],
    ['code', 'Open for review', 'Every line is readable. Any doubts? Review the code.'],
  ];
  const howItWorks = [
    ['Set up your project', 'A name, your planned window and your workspaces, typed in or imported.'],
    ['Answer a few questions', 'One per screen. The plan keeps only what applies to you.'],
    ['Follow the route', 'Each step says what to do, where to click and what to record.'],
    ['Share the reports', 'Readiness, transition and sign-off reports, built from your records.'],
  ];
  return h('div', { class: 'page welcome' },
    h('section', { class: 'welcome-hero' },
      h('div', null,
        h('h1', { id: 'page-title', tabindex: '-1' }, 'Move Microsoft Sentinel to the Defender portal, one clear step at a time.'),
        h('p', { class: 'hero-lede' }, `The ${BRAND.productName} guides you from readiness to sign-off: what to check, where to click, and what to record. It runs offline, in this one file.`),
        continueCard,
        h('div', { class: 'hero-actions' },
          h('button', { type: 'button', class: ['btn', 'btn-lg', continueCard ? null : 'btn-primary'], 'data-focus-key': 'start-own', onclick: () => go('#/setup/1') }, icon('plus', 'icon-sm'), 'Start my project'),
          btn('Open a saved project', openProjectFileFlow, { iconName: 'upload' }),
          btn('Try the demo', startDemo, { kind: 'ghost', iconName: 'sparkle' }))),
      h('div', { class: 'hero-route' }, routeView({ ...sample, animate: freshRoute, key: 'welcome', label: 'The four stages of the route' }))),
    h('div', { class: 'deadline-strip' }, icon('clock'), h('span', null, 'Microsoft states that after ', h('strong', null, '31 March 2027'), ', Microsoft Sentinel is available only in the Defender portal', days > 0 ? `. That is ${days} days from today.` : '.', ' Sentinel itself continues.')),
    h('section', { class: 'grid-2' },
      h('div', { class: 'card' }, h('h2', { class: 'card-title' }, 'How it works'),
        h('ol', { class: 'steps' }, howItWorks.map(([t, d]) => h('li', null, h('div', { class: 'step-text' }, h('strong', null, t)), h('div', { class: 'small muted' }, d))))),
      h('div', { class: 'card' }, h('h2', { class: 'card-title' }, 'Your data is yours'),
        h('ul', { class: 'list promise-list' }, promises.map(([ic, t, d]) => h('li', { class: 'list-row' }, icon(ic, 'icon'), h('div', null, h('strong', null, t), h('div', { class: 'small muted' }, d))))))),
    recent.length ? h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Projects saved in this browser'),
      h('p', { class: 'small muted' }, 'Kept in this browser\'s storage because autosave was on. This is not a file: save a project package as your backup.'),
      h('ul', { class: 'list' }, recent.map((r) => h('li', { class: 'list-row' },
        h('div', null, h('strong', null, r.name || 'Untitled project'), h('div', { class: 'small muted' }, `Updated ${formatDate(r.updatedAt, true)}, ${bytesLabel(r.bytes)} of data`)),
        h('div', { class: 'row-actions' },
          btn('Open', async () => { if (state.project && state.project.id === r.id) { go('#/overview'); return; } if (!(await confirmLeaveProject())) return; try { const w = await openBrowserProject(r.id); if (w && w.length) toast(`Opened with ${w.length} data note(s), for example steps that are no longer in the knowledge base.`, 'info'); go('#/overview'); } catch (e) { toast(e.message, 'bad'); } }, { small: true }),
          state.project && state.project.id === r.id ? h('span', { class: 'small muted' }, 'Open now') : btn('Delete', async () => { if (await confirmDialog({ title: 'Delete from this browser?', message: [`"${r.name}" and its attachments will be deleted from this browser's storage.`, 'Project packages you saved as files are not affected. This cannot be undone.'], confirmLabel: 'Delete', danger: true })) { try { await deleteBrowserProject(r.id); toast('Deleted from browser storage.', 'info'); } catch (e) { toast(e.message, 'bad'); } } }, { small: true, kind: 'ghost' })))))) : null,
    makersStrip(),
    h('p', { class: 'small muted' }, DISCLAIMER_SHORT, ' ', h('a', { href: '#/about' }, 'Read the full disclaimer'), `. ${BRAND.brandName} is independent and not affiliated with, sponsored or endorsed by Microsoft. Version ${APP_VERSION}.`));
});

// ───────────────────────────── New-project wizard ─────────────────────────────
const DEADLINE = '2027-03-31';
const blankRow = () => ({ alias: '', kind: 'production', notes: '' });
const draft = {};

function resetDraft() {
  Object.assign(draft, {
    guidance: 'simple', name: '', organisation: '', operatorName: state.settings.operatorName || '', operatorRole: state.settings.operatorRole || '',
    startDate: new Date().toISOString().slice(0, 10), windowStart: '', windowEnd: '', environments: [blankRow()],
    wsMode: '', imports: [], importErrors: [], suggest: [], storageMode: state.settings.storageMode, mode: 'tailored', disclaimer: false,
  });
}
resetDraft();

// Keeps the window's end on or after its start while typing, without redrawing the page.
function checkWindow() {
  const e = document.getElementById('wiz-window-end');
  const m = document.getElementById('wiz-window-error');
  const bad = !!(draft.windowStart && draft.windowEnd && draft.windowEnd < draft.windowStart);
  if (e) { e.dataset.pickerMin = draft.windowStart || ''; e.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
  if (m) { m.hidden = !bad; m.textContent = bad ? 'The window must end on or after the day it starts.' : ''; }
}

function bound(key, attrs = {}) {
  return h('input', { type: 'text', value: draft[key] || '', 'data-focus-key': `draft-${key}`, oninput: (e) => { draft[key] = e.target.value; }, ...attrs });
}

const STEPS = [
  ['About the project', 'A label for your reports and who is doing the work.'],
  ['Timing', 'When you plan to switch, with the date Microsoft set in mind.'],
  ['Your workspaces', 'Import them from the read-only inventory script, or type them in.'],
  ['Where to keep your work', 'Choose how this assistant saves your project.'],
  ['How to start', 'Tailor the plan to your environment, or see everything.'],
];
const LAST = STEPS.length;
const DISCOVER_CMD = '.\\Get-ArMoSentinelInventory.ps1 -Discover -OutFolder .\\inventory';

// Suggested answers from every imported workspace that is in scope, merged per question (Yes only).
function mergeSuggestions() {
  const kept = new Map(draft.suggest.map((x) => [x.questionId, x.on]));
  const by = new Map();
  for (const it of draft.imports.filter((x) => x.inScope)) {
    for (const sg of it.res.suggestions) {
      const cur = by.get(sg.questionId) || { questionId: sg.questionId, value: sg.value, reasons: [] };
      cur.reasons.push(sg.reason);
      by.set(sg.questionId, cur);
    }
  }
  const inScope = draft.imports.filter((x) => x.inScope).length;
  if (inScope > 1) by.set('multi_workspace', { questionId: 'multi_workspace', value: 'yes', reasons: [`${inScope} workspaces in scope`] });
  draft.suggest = [...by.values()].map((x) => ({ ...x, on: kept.has(x.questionId) ? kept.get(x.questionId) : true }));
}

async function pickInventories() {
  const files = await pickFile({ accept: '.json,application/json', multiple: true });
  if (!files.length) return;
  const read = await withLoader('Reading your inventory files', () => readInventoryFiles(files));
  for (const r of read) {
    if (r.error) { draft.importErrors.push(`${r.file.name}: ${r.error}`); continue; }
    const alias = r.inv.alias || r.file.name.replace(/^inventory-/, '').replace(/\.json$/i, '');
    if (draft.imports.some((x) => x.alias === alias)) { draft.importErrors.push(`${r.file.name}: a workspace called ${alias} is already in the list.`); continue; }
    draft.imports.push({ ...r, alias, kind: /test|dev|lab/i.test(alias) ? 'test' : 'production', inScope: true });
  }
  mergeSuggestions();
  go('#/setup/3');
}

function workspaceStep() {
  const kb = state.kb;
  const choice = (value, title, desc) => h('label', { class: ['choice', draft.wsMode === value && 'selected'] },
    h('input', { type: 'radio', name: 'ws-mode', value, checked: draft.wsMode === value, 'data-focus-key': `ws-mode-${value}`, onchange: () => { draft.wsMode = value; go('#/setup/3'); } }),
    h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
  const modes = h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, 'How do you want to add your workspaces?'),
    choice('import', 'Run the inventory script and import its results (recommended)', 'A read-only PowerShell script finds your Sentinel workspaces and what is in them. The assistant then fills in the workspace list and answers several questions for you. You confirm everything.'),
    choice('manual', 'Type them in myself', 'Enter the workspace names now, and answer the questions by hand. You can still import the script results later.'));
  const where = infoTip({ key: 'where-workspaces', title: 'Where to find your workspace names' },
    h('ul', { class: 'bullets' },
      h('li', null, 'In the Azure portal, search for Microsoft Sentinel and open it. The list shows every workspace where Sentinel is enabled, with its resource group and subscription.'),
      h('li', null, 'Use the workspace name, or a short alias your team uses, for example SOC-PROD-WEU. Reports print what you enter here.'),
      h('li', null, 'Not sure which are in scope? Ask your SOC lead or cloud platform team which workspaces your analysts work in.')));
  const manualRows = () => [
    h('div', { class: 'row' }, h('h3', null, 'Workspaces in scope'), where),
    h('p', { class: 'small muted' }, 'Use names or aliases, not tenant or subscription IDs. You can add more later in Project setup.'),
    ...draft.environments.map((env, i) => h('div', { class: 'env-row' },
      field('Workspace name or alias', h('input', { type: 'text', value: env.alias, maxlength: '120', placeholder: 'For example: SOC-PROD-WEU', 'data-focus-key': `env-alias-${i}`, oninput: (e) => { env.alias = e.target.value; } })),
      field('Type', h('select', { onchange: (e) => { env.kind = e.target.value; } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: env.kind === k }, k)))),
      field('Notes (optional)', h('input', { type: 'text', value: env.notes, maxlength: '2000', 'data-focus-key': `env-notes-${i}`, oninput: (e) => { env.notes = e.target.value; } })),
      draft.environments.length > 1 ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove workspace ${i + 1}`, onclick: () => { draft.environments.splice(i, 1); go('#/setup/3'); } }, icon('trash')) : h('span'))),
    btn('Add a workspace', () => { draft.environments.push(blankRow()); go('#/setup/3'); }, { iconName: 'plus', small: true }),
  ];
  if (draft.wsMode === 'manual') return h('div', { class: 'stack' }, modes, ...manualRows());
  if (draft.wsMode !== 'import') return h('div', { class: 'stack' }, modes);

  const qText = (id) => (kb.questions.find((q) => q.id === id) || { text: id }).text;
  const found = draft.imports;
  const rows = found.map((it, i) => h('div', { class: ['import-ws', !it.inScope && 'off'] },
    h('label', { class: 'check-line import-scope' }, h('input', { type: 'checkbox', checked: it.inScope, 'data-focus-key': `imp-scope-${i}`, onchange: (e) => { it.inScope = e.target.checked; mergeSuggestions(); go('#/setup/3'); } }), h('span', null, 'In scope')),
    field('Workspace', h('input', { type: 'text', value: it.alias, maxlength: '120', 'data-focus-key': `imp-alias-${i}`, oninput: (e) => { it.alias = e.target.value; } })),
    field('Type', h('select', { onchange: (e) => { it.kind = e.target.value; } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: it.kind === k }, k)))),
    h('div', { class: 'small muted import-counts' }, [it.inv.region, `${it.res.counts.analyticsRules} analytics rules`, `${it.res.counts.automationRules} automation rules`, `${it.res.counts.dataConnectors} connectors`, `${it.res.counts.watchlists} watchlists`].filter(Boolean).join(' · '),
      it.res.errors.length ? h('div', { class: 'field-error' }, `${it.res.errors.length} request(s) failed while collecting. Some results may be missing.`) : null)));
  return h('div', { class: 'stack' }, modes,
    h('ol', { class: 'steps' },
      h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Download the read-only script. '), 'It only reads (GET requests). It never changes anything, never signs you in and sends nothing anywhere except Azure Resource Manager.'),
        h('div', { class: 'row-actions' }, btn('Download Get-ArMoSentinelInventory.ps1', downloadInventoryScript, { small: true, iconName: 'download' }))),
      h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Run it in PowerShell. '), 'Sign in with ', h('code', null, 'Connect-AzAccount'), ' first. Your account needs Microsoft Sentinel Reader on the workspaces\' resource groups.'),
        h('pre', { class: 'code' }, DISCOVER_CMD),
        h('div', { class: 'row-actions' }, btn('Copy the command', async () => { await copyText(DISCOVER_CMD); toast('Command copied.', 'good'); }, { small: true, iconName: 'copy' })),
        h('p', { class: 'small muted' }, 'It finds every Sentinel workspace you can read and writes one inventory file per workspace into the inventory folder. Look the files over before you import them: rule and watchlist names can be sensitive.')),
      h('li', null, h('div', { class: 'step-text' }, h('strong', null, 'Import the files here. '), 'Select all the inventory-*.json files at once.'),
        h('div', { class: 'row-actions' }, btn(found.length ? 'Add more files' : 'Choose the inventory files', pickInventories, { small: true, iconName: 'upload', kind: found.length ? null : 'primary' })))),
    draft.importErrors.length ? callout('caution', 'Some files were not imported.', h('ul', null, draft.importErrors.map((e) => h('li', null, e)))) : null,
    found.length ? h('div', { class: 'stack' },
      h('h3', null, `Found ${found.length} workspace${found.length === 1 ? '' : 's'}. Which are in scope?`),
      h('p', { class: 'small muted' }, 'Untick the ones you are not moving. You can rename them to the aliases your team uses.'),
      ...rows) : null,
    draft.suggest.length ? h('div', { class: 'stack' },
      h('h3', null, 'Answers the import fills in for you'),
      h('p', { class: 'small muted' }, 'Based on what the script found in the workspaces in scope. Only Yes answers are suggested. Untick any that are wrong; you can change every answer later.'),
      h('ul', { class: 'list' }, draft.suggest.map((sg) => h('li', { class: 'list-row' }, h('label', { class: 'check-line' },
        h('input', { type: 'checkbox', checked: sg.on, onchange: (e) => { sg.on = e.target.checked; } }),
        h('span', null, qText(sg.questionId), h('strong', null, ' Yes'), h('span', { class: 'small muted' }, ` (${sg.reasons.slice(0, 2).join('; ')}${sg.reasons.length > 2 ? '; and more' : ''})`))))))) : null,
    h('p', { class: 'small' }, 'Cannot run the script now? ', h('button', { type: 'button', class: 'linklike', onclick: () => { draft.wsMode = 'manual'; go('#/setup/3'); } }, 'Type the workspaces in instead'), '.'));
}

route('setup', ({ params }) => {
  const step = Math.min(LAST, Math.max(1, Number(params[0]) || 1));
  if (step === 1 && !draft.__started) { resetDraft(); draft.__started = true; }
  const nav = h('ol', { class: 'wizard-steps', 'aria-label': 'Progress' }, STEPS.map(([s], i) => h('li', { class: [i + 1 === step && 'current', i + 1 < step && 'done'], 'aria-current': i + 1 === step ? 'step' : null }, s)));
  let body;
  let next;
  if (step === 1) {
    body = h('div', { class: 'stack' },
      field('Project or customer label', bound('name', { maxlength: '200', placeholder: 'For example: Sentinel transition 2026' }), { required: true, hint: 'Printed on your reports. Use a label your organisation is comfortable sharing.' }),
      field('Organisation (optional)', bound('organisation', { maxlength: '200' })),
      h('div', { class: 'grid-2' },
        field('Your name', bound('operatorName', { maxlength: '200' }), { required: true, hint: 'Recorded on the statuses, evidence and decisions you enter. You can change it later.' }),
        field('Your role (optional)', bound('operatorRole', { maxlength: '200', placeholder: 'For example: Security architect' }))),
      callout('info', 'No secrets, ever.', ' Never enter passwords, client secrets, tokens or keys. The assistant does not need them and will never ask.'));
    next = () => {
      if (!draft.name.trim() || !draft.operatorName.trim()) { toast('Please enter a project label and your name.', 'bad'); return false; }
      return true;
    };
  } else if (step === 2) {
    const days = daysUntil(DEADLINE);
    body = h('div', { class: 'stack' },
      h('div', { class: 'deadline-strip deadline-inline' }, icon('clock'), h('span', null, 'Microsoft states that after ', h('strong', null, '31 March 2027'), ', Microsoft Sentinel is available only in the Defender portal', days > 0 ? h('span', null, '. That is ', h('strong', { class: 'tnum' }, `${days} days`), ' from today.') : '.', ' Plan your window well before that date, so there is time to fix what you find.')),
      h('div', { class: 'grid-3' },
        field('Project start date', bound('startDate', { type: 'date' })),
        field('Planned window: from', bound('windowStart', { type: 'date', id: 'wiz-window-start', oninput: (e) => { draft.windowStart = e.target.value; checkWindow(); } }), { hint: 'When you plan to connect production. A guess is fine; you can change it later.' }),
        field('Planned window: to', bound('windowEnd', { type: 'date', id: 'wiz-window-end', 'data-picker-min': draft.windowStart || null, oninput: (e) => { draft.windowEnd = e.target.value; checkWindow(); } }))),
      h('p', { class: 'field-error', id: 'wiz-window-error', role: 'alert', hidden: true }));
    next = () => {
      if (draft.windowStart && draft.windowEnd && draft.windowEnd < draft.windowStart) { checkWindow(); toast('The window must end on or after the day it starts.', 'bad'); return false; }
      if ((draft.windowEnd || draft.windowStart) && (draft.windowEnd || draft.windowStart) > DEADLINE) toast('Your window ends after 31 March 2027, when Sentinel leaves the Azure portal. Consider an earlier date.', 'info', 8000);
      return true;
    };
  } else if (step === 3) {
    body = workspaceStep();
    next = () => {
      if (!draft.wsMode) { toast('Choose how to add your workspaces.', 'bad'); return false; }
      if (draft.wsMode === 'import' && draft.imports.length && !draft.imports.some((x) => x.inScope)) { toast('Tick at least one workspace, or type them in instead.', 'bad'); return false; }
      if (draft.wsMode === 'import' && !draft.imports.length) toast('No inventory imported yet. You can import it later from the analytics rules step.', 'info', 7000);
      return true;
    };
  } else if (step === 4) {
    const choice = (value, title, desc, extra) => h('label', { class: ['choice', draft.storageMode === value && 'selected'] },
      h('input', { type: 'radio', name: 'storage', value, checked: draft.storageMode === value, onchange: () => { draft.storageMode = value; go('#/setup/4'); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc), extra || null));
    body = h('div', { class: 'stack' },
      h('fieldset', { class: 'choices' }, h('legend', { class: 'sr-only' }, 'Saving'),
        choice('none', 'I save project packages myself (default)', 'Your work stays in this tab until you choose "Save package", which writes one .zip file with all data and evidence. If you close the tab without saving, the assistant warns you first.'),
        choice('browser', 'Autosave in this browser', 'Every change is saved automatically in this browser on this computer. Nothing leaves the computer. Keep saving packages for backups and hand-over.',
          draft.storageMode === 'browser' ? h('ul', null,
            h('li', null, 'The data is not encrypted. Anyone with access to your Windows account and browser can read it.'),
            h('li', null, 'In Edge and Chrome, all local HTML files share one storage area, so only open local HTML files you trust.'),
            h('li', null, 'Clearing browsing data, or low disk space, can delete it.')) : null)),
      h('p', { class: 'small muted' }, 'Your preferences (theme, saving choice, your name) are remembered in this browser\'s local storage. They contain no project data, and you can reset them in Settings.'));
    next = () => { if (!draft.storageMode) { toast('Choose how to save your work.', 'bad'); return false; } return true; };
  } else {
    const qs = state.kb.questions;
    const core = qs.filter((q) => q.core).length;
    const filled = draft.wsMode === 'import' ? draft.suggest.filter((x) => x.on).length : 0;
    const guideChoice = (value, title, desc) => h('label', { class: ['choice', draft.guidance === value && 'selected'] },
      h('input', { type: 'radio', name: 'guidance', value, checked: draft.guidance === value, onchange: () => { draft.guidance = value; go(`#/setup/${LAST}`); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
    const pathChoice = (value, title, desc) => h('label', { class: ['choice', draft.mode === value && 'selected'] },
      h('input', { type: 'radio', name: 'mode', value, checked: draft.mode === value, onchange: () => { draft.mode = value; go(`#/setup/${LAST}`); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
    body = h('div', { class: 'stack' },
      h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, 'How do you want to work?'),
        guideChoice('simple', 'Simplified (recommended)', `Missions with short checklists. You answer ${core} questions now, and the others come up inside the missions they affect. Each check says what to do and what counts as proof.`),
        guideChoice('detailed', 'Detailed', `Every step in full, with background and sources. You answer all ${qs.length} questions up front, grouped in ${state.kb.questionSections.length} short sections. For consultants and audit-heavy projects.`)),
      h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, 'How to start'),
        pathChoice('tailored', 'Tailor the plan to my environment (recommended)', `${draft.guidance === 'simple' ? `Answer ${core} short questions now, one per screen.` : `Answer up to ${qs.length} short questions, one per screen.`}${filled ? ` ${filled} answer${filled === 1 ? ' is' : 's are'} already filled in from your inventory.` : ''} Steps that do not apply are set aside with a reason, never deleted, and "I don't know yet" keeps them in your plan.`),
        pathChoice('full', 'Show me the full checklist', `See all ${state.kb.checks.length} steps without tailoring. You decide what applies as you go.`)),
      h('div', { class: 'card card-muted' }, h('h2', { class: 'card-title' }, 'Before you start'), h('p', null, DISCLAIMER_SHORT),
        h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: draft.disclaimer, onchange: (e) => { draft.disclaimer = e.target.checked; } }), ' I understand this assistant gives guidance only, and my organisation stays responsible for checking instructions, approvals and change decisions.')));
    next = () => { if (!draft.disclaimer) { toast('Please confirm the responsibility statement to continue.', 'bad'); return false; } return true; };
  }

  const finish = async () => {
    if (!(await confirmLeaveProject())) return;
    const p = createProject({ mode: draft.mode, guidance: draft.guidance, appVersion: APP_VERSION, kbVersion: state.kb.meta.version });
    const imported = draft.wsMode === 'import' ? draft.imports.filter((x) => x.inScope && x.alias.trim()) : [];
    const envs = draft.wsMode === 'import'
      ? imported.map((x) => ({ alias: x.alias.trim(), kind: x.kind, region: x.inv.region || '', notes: '' }))
      : draft.environments.filter((e) => e.alias.trim()).map((e) => ({ alias: e.alias.trim(), kind: e.kind, notes: e.notes.trim() }));
    Object.assign(p.meta, {
      name: draft.name.trim(), organisation: draft.organisation.trim(), operatorName: draft.operatorName.trim(), operatorRole: draft.operatorRole.trim(),
      startDate: draft.startDate, windowStart: draft.windowStart, windowEnd: draft.windowEnd, environments: envs,
    });
    setInventoryChoice(p, draft.wsMode);
    p.audit[0].by = p.meta.operatorName;
    addAudit(p, 'disclaimer.acknowledged', 'Operator acknowledged the responsibility statement');
    updateSettings({ operatorName: p.meta.operatorName, operatorRole: p.meta.operatorRole, welcomeSeen: true, disclaimerAcknowledgedAt: nowIso() }, { silent: true });
    setProject(p, new Map(), { fromFile: false });
    if (imported.length) {
      mutate((pr) => {
        for (const it of imported) applyInventory(pr, { res: it.res, fileName: it.file.name, bytes: it.bytes, sha: it.sha }, { findings: true, suggestions: false, attachFile: true });
        for (const sg of draft.suggest.filter((x) => x.on)) setAnswer(pr, sg.questionId, sg.value, `From imported inventory (${sg.reasons.join('; ')}); confirmed by ${pr.meta.operatorName || 'operator'}`);
      }, { silent: true });
    }
    draft.__started = false;
    go(draft.mode === 'tailored' ? '#/questionnaire' : '#/overview');
    await setStorageMode(draft.storageMode);
  };

  const [title, sub] = STEPS[step - 1];
  return h('div', { class: 'page wizard' },
    h('h1', { id: 'page-title', tabindex: '-1' }, title),
    h('p', { class: 'lede' }, sub),
    nav,
    h('p', { class: 'sr-only' }, `Step ${step} of ${LAST}`),
    h('div', { class: 'card' }, body),
    h('div', { class: 'wizard-foot' },
      step > 1 ? btn('Back', () => go(`#/setup/${step - 1}`), { iconName: 'back' }) : btn('Cancel', () => { draft.__started = false; go(state.project ? '#/overview' : '#/welcome'); }, { kind: 'ghost' }),
      step < LAST ? btn('Continue', () => { if (next()) go(`#/setup/${step + 1}`); }, { kind: 'primary', iconName: 'arrow' }) : btn('Create my project', () => { if (next()) finish(); }, { kind: 'primary', iconName: 'check' })));
});
