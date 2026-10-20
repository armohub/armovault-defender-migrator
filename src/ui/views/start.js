// Welcome page and the new-project wizard.
import { h, icon, field, toast, confirmDialog, externalLink } from '../dom.js';
import { state, setProject, updateSettings, openBrowserProject, deleteBrowserProject, setStorageMode } from '../../app/store.js';
import { go, route } from '../shell.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { createProject, addAudit } from '../../core/model.js';
import { applicabilityMap } from '../../core/applicability.js';
import { summariseStage } from '../../core/readiness.js';
import { openProjectFileFlow, startDemo, confirmLeaveProject } from '../actions.js';
import { btn, callout, daysUntil } from '../components.js';
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
    ['Set up your project', 'A name, your planned window and the workspaces in scope.'],
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
const draft = {
  name: '', organisation: '', operatorName: '', operatorRole: '', startDate: '', windowStart: '', windowEnd: '', environments: [{ alias: '', kind: 'production', notes: '' }],
  storageMode: null, mode: 'tailored', disclaimer: false,
};

function resetDraft() {
  Object.assign(draft, { name: '', organisation: '', operatorName: state.settings.operatorName || '', operatorRole: state.settings.operatorRole || '', startDate: new Date().toISOString().slice(0, 10), windowStart: '', windowEnd: '', environments: [{ alias: '', kind: 'production', notes: '' }], storageMode: state.settings.storageMode, mode: 'tailored', disclaimer: false });
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
  ['Timing and scope', 'When you plan to switch, and which workspaces are in scope.'],
  ['Where to keep your work', 'Choose how this assistant saves your project.'],
  ['How to start', 'Tailor the plan to your environment, or see everything.'],
];

route('setup', ({ params }) => {
  const step = Math.min(4, Math.max(1, Number(params[0]) || 1));
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
    const rows = draft.environments.map((env, i) => h('div', { class: 'env-row' },
      field('Workspace alias', h('input', { type: 'text', value: env.alias, maxlength: '120', placeholder: 'For example: SOC-PROD-WEU', 'data-focus-key': `env-alias-${i}`, oninput: (e) => { env.alias = e.target.value; } })),
      field('Type', h('select', { onchange: (e) => { env.kind = e.target.value; } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: env.kind === k }, k)))),
      field('Notes (optional)', h('input', { type: 'text', value: env.notes, maxlength: '2000', 'data-focus-key': `env-notes-${i}`, oninput: (e) => { env.notes = e.target.value; } })),
      draft.environments.length > 1 ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove workspace ${i + 1}`, onclick: () => { draft.environments.splice(i, 1); go('#/setup/2'); } }, icon('trash')) : h('span')));
    body = h('div', { class: 'stack' },
      h('div', { class: 'grid-3' },
        field('Project start date', bound('startDate', { type: 'date' })),
        field('Planned window: from', bound('windowStart', { type: 'date', id: 'wiz-window-start', oninput: (e) => { draft.windowStart = e.target.value; checkWindow(); } }), { hint: 'When you plan to connect production.' }),
        field('Planned window: to', bound('windowEnd', { type: 'date', id: 'wiz-window-end', 'data-picker-min': draft.windowStart || null, oninput: (e) => { draft.windowEnd = e.target.value; checkWindow(); } }))),
      h('p', { class: 'field-error', id: 'wiz-window-error', role: 'alert', hidden: true }),
      h('h3', null, 'Workspaces in scope'),
      h('p', { class: 'small muted' }, 'Use aliases, not tenant or subscription IDs. Reports print what you enter here, and you can add more later.'),
      ...rows,
      btn('Add a workspace', () => { draft.environments.push({ alias: '', kind: 'production', notes: '' }); go('#/setup/2'); }, { iconName: 'plus', small: true }));
    next = () => {
      if (draft.windowStart && draft.windowEnd && draft.windowEnd < draft.windowStart) { checkWindow(); toast('The window must end on or after the day it starts.', 'bad'); return false; }
      if (draft.windowEnd && draft.windowEnd > '2027-03-31') toast('Your window ends after 31 March 2027, when Sentinel leaves the Azure portal. Consider an earlier date.', 'info', 8000);
      return true;
    };
  } else if (step === 3) {
    const choice = (value, title, desc, extra) => h('label', { class: ['choice', draft.storageMode === value && 'selected'] },
      h('input', { type: 'radio', name: 'storage', value, checked: draft.storageMode === value, onchange: () => { draft.storageMode = value; go('#/setup/3'); } }),
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
    const pathChoice = (value, title, desc) => h('label', { class: ['choice', draft.mode === value && 'selected'] },
      h('input', { type: 'radio', name: 'mode', value, checked: draft.mode === value, onchange: () => { draft.mode = value; go('#/setup/4'); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
    body = h('div', { class: 'stack' },
      h('fieldset', { class: 'choices' }, h('legend', { class: 'sr-only' }, 'How to start'),
        pathChoice('tailored', 'Tailor the plan to my environment (recommended)', `Answer up to ${state.kb.questions.length} short questions, one per screen. Steps that do not apply are set aside with a reason, never deleted, and "I don't know" keeps them in your plan.`),
        pathChoice('full', 'Show me the full checklist', `See all ${state.kb.checks.length} steps without tailoring. You decide what applies as you go.`)),
      h('div', { class: 'card card-muted' }, h('h2', { class: 'card-title' }, 'Before you start'), h('p', null, DISCLAIMER_SHORT),
        h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: draft.disclaimer, onchange: (e) => { draft.disclaimer = e.target.checked; } }), ' I understand this assistant gives guidance only, and my organisation stays responsible for checking instructions, approvals and change decisions.')));
    next = () => { if (!draft.disclaimer) { toast('Please confirm the responsibility statement to continue.', 'bad'); return false; } return true; };
  }

  const finish = async () => {
    if (!(await confirmLeaveProject())) return;
    const p = createProject({ mode: draft.mode, appVersion: APP_VERSION, kbVersion: state.kb.meta.version });
    Object.assign(p.meta, {
      name: draft.name.trim(), organisation: draft.organisation.trim(), operatorName: draft.operatorName.trim(), operatorRole: draft.operatorRole.trim(),
      startDate: draft.startDate, windowStart: draft.windowStart, windowEnd: draft.windowEnd,
      environments: draft.environments.filter((e) => e.alias.trim()).map((e) => ({ alias: e.alias.trim(), kind: e.kind, notes: e.notes.trim() })),
    });
    p.audit[0].by = p.meta.operatorName;
    addAudit(p, 'disclaimer.acknowledged', 'Operator acknowledged the responsibility statement');
    updateSettings({ operatorName: p.meta.operatorName, operatorRole: p.meta.operatorRole, welcomeSeen: true, disclaimerAcknowledgedAt: nowIso() }, { silent: true });
    setProject(p, new Map(), { fromFile: false });
    draft.__started = false;
    go(draft.mode === 'tailored' ? '#/questionnaire' : '#/overview');
    await setStorageMode(draft.storageMode);
  };

  const [title, sub] = STEPS[step - 1];
  return h('div', { class: 'page wizard' },
    h('h1', { id: 'page-title', tabindex: '-1' }, title),
    h('p', { class: 'lede' }, sub),
    nav,
    h('p', { class: 'sr-only' }, `Step ${step} of 4`),
    h('div', { class: 'card' }, body),
    h('div', { class: 'wizard-foot' },
      step > 1 ? btn('Back', () => go(`#/setup/${step - 1}`), { iconName: 'back' }) : btn('Cancel', () => { draft.__started = false; go(state.project ? '#/overview' : '#/welcome'); }, { kind: 'ghost' }),
      step < 4 ? btn('Continue', () => { if (next()) go(`#/setup/${step + 1}`); }, { kind: 'primary', iconName: 'arrow' }) : btn('Create my project', () => { if (next()) finish(); }, { kind: 'primary', iconName: 'check' })));
});
