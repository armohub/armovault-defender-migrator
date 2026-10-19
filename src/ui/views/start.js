// Welcome, project setup wizard and the tailoring questionnaire.
import { h, icon, field, toast, modal, confirmDialog } from '../dom.js';
import { state, setProject, mutate, updateSettings, openBrowserProject, deleteBrowserProject, setStorageMode } from '../../app/store.js';
import { go, route, render } from '../shell.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { createProject, setAnswer, ANSWERS, addAudit } from '../../core/model.js';
import { applicabilityMap, diffApplicability, evaluateApplicability, questionIndex } from '../../core/applicability.js';
import { openProjectFileFlow, startDemo, confirmLeaveProject } from '../actions.js';
import { btn, linkBtn, callout, pageHead } from '../components.js';
import { formatDate, bytesLabel, nowIso } from '../../core/util.js';
import { DISCLAIMER_SHORT } from '../../core/report.js';

// ───────────────────────────── Welcome ─────────────────────────────
route('welcome', () => {
  const recent = state.ui.browserProjects;
  const journey = [
    ['1', 'Prepare', 'Discover what applies to your environment, gather evidence and decide readiness.', 'prepare'],
    ['1.5', 'Test (optional)', 'Validate high-risk assumptions in a non-production environment.', 'test'],
    ['2', 'Transition', 'Follow a sequenced runbook with human checkpoints and an execution log.', 'transition'],
    ['3', 'Validate', 'Prove monitoring and response still work, record residual risk and sign off.', 'validate'],
  ];
  return h('div', { class: 'page welcome' },
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, BRAND.brandName),
      h('h1', { id: 'page-title', tabindex: '-1' }, BRAND.productName),
      h('p', { class: 'hero-lede' }, 'A guided, evidence-based companion for moving your SOC\'s Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal — from readiness to post-transition sign-off.'),
      h('p', { class: 'hero-fact' }, icon('clock', 'icon-sm'), 'Microsoft states that after 31 March 2027, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Defender portal. Sentinel itself continues.'),
      state.project ? h('div', { class: 'hero-actions' }, linkBtn(`Continue "${state.project.meta.name || 'current project'}"`, '#/overview', { kind: 'primary', iconName: 'chevron' })) : null,
      h('div', { class: 'hero-actions' },
        btn('Start a new project', () => go('#/setup/1'), { kind: state.project ? null : 'primary', iconName: 'plus' }),
        btn('Open a project package', openProjectFileFlow, { iconName: 'upload' }),
        btn('Explore the demo (fictional data)', startDemo, { kind: 'ghost', iconName: 'sparkle' }))),
    h('section', { class: 'journey', 'aria-label': 'The four stages' }, journey.map(([n, t, d, ic]) => h('div', { class: 'journey-step' }, h('div', { class: 'journey-icon' }, icon(ic)), h('div', null, h('div', { class: 'journey-n' }, `Stage ${n}`), h('div', { class: 'journey-t' }, t), h('p', { class: 'small' }, d))))),
    h('section', { class: 'grid-3 values' },
      h('div', { class: 'card' }, h('h2', null, icon('wifioff', 'icon-sm'), ' Local and offline'), h('p', null, 'This downloaded app runs from a single file in your browser. It makes no network requests — the browser itself enforces this. No account, telemetry or cloud backend.'), h('p', { class: 'small muted' }, 'Links to Microsoft documentation open only when you click them and need internet.')),
      h('div', { class: 'card' }, h('h2', null, icon('evidence', 'icon-sm'), ' Evidence, not checkboxes'), h('p', null, 'Every item explains what to do, where, and how to interpret results. A check counts as verified only with evidence; unknown answers never hide work.')),
      h('div', { class: 'card' }, h('h2', null, icon('knowledge', 'icon-sm'), ' Sourced and transparent'), h('p', null, `Guidance cites current Microsoft Learn pages (knowledge base reviewed ${state.kb.meta.lastReviewed}). Conflicting sources are flagged "Needs review" instead of hidden.`))),
    h('section', { class: 'grid-2' },
      h('div', { class: 'card' }, h('h2', null, 'Working modes'),
        h('div', { class: 'mode' }, h('span', { class: 'chip chip-accent' }, 'Available'), h('div', null, h('strong', null, 'Offline guided / import mode. '), 'All guides, checklists, queries, evidence, reports and project files work without an internet connection.')),
        h('div', { class: 'mode' }, h('span', { class: 'chip chip-muted' }, 'Not in this release'), h('div', null, h('strong', null, 'Connected mode. '), 'Live, read-only checks against your tenant are on the roadmap. They need network access, an app registration in your tenant and explicit consent, so they are not part of this offline build. See About for why.'))),
      h('div', { class: 'card' }, h('h2', null, 'Your responsibility'), h('p', null, DISCLAIMER_SHORT), linkBtn('Read the full disclaimer', '#/about', { small: true, kind: 'ghost' }))),
    recent.length ? h('section', { class: 'card' }, h('h2', null, 'Projects saved in this browser'),
      h('p', { class: 'small muted' }, 'Stored in this browser profile\'s storage (IndexedDB) because browser autosave was on. Not a file — save a project package for backup.'),
      h('ul', { class: 'list' }, recent.map((r) => h('li', { class: 'list-row' },
        h('div', null, h('strong', null, r.name || 'Untitled project'), h('div', { class: 'small muted' }, `Updated ${formatDate(r.updatedAt, true)} · ${bytesLabel(r.bytes)} data`)),
        h('div', { class: 'row-actions' },
          btn('Open', async () => { if (state.project && state.project.id === r.id) { go('#/overview'); return; } if (!(await confirmLeaveProject())) return; try { const w = await openBrowserProject(r.id); if (w && w.length) toast(`Opened with ${w.length} data note(s) (for example items no longer in the knowledge base).`, 'info'); go('#/overview'); } catch (e) { toast(e.message, 'bad'); } }, { small: true }),
          state.project && state.project.id === r.id ? h('span', { class: 'small muted' }, 'Open now') : btn('Delete', async () => { if (await confirmDialog({ title: 'Delete from this browser?', message: [`"${r.name}" and its attachments will be deleted from this browser's storage.`, 'Project packages you saved as files are not affected. This cannot be undone.'], confirmLabel: 'Delete', danger: true })) { try { await deleteBrowserProject(r.id); toast('Deleted from browser storage.', 'info'); } catch (e) { toast(e.message, 'bad'); } } }, { small: true, kind: 'ghost' })))))) : null,
    h('section', { class: 'makers card' },
      h('div', { class: 'makers-avatars', 'aria-hidden': 'true' }, BRAND.makers.map((m) => h('span', { class: 'avatar' }, m.initials))),
      h('div', null, h('strong', null, `Built by ${BRAND.makers.map((m) => m.name).join(' & ')}`), h('p', { class: 'small muted' }, `${BRAND.brandName} is an independent project. It is not affiliated with, sponsored or endorsed by Microsoft. Version ${APP_VERSION}.`),
        BRAND.contactUrl ? h('a', { href: BRAND.contactUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Get in touch with the makers') : h('p', { class: 'small muted' }, 'Get in touch with the makers: contact details will be published with the public release.'))));
});

// ───────────────────────────── Setup wizard ─────────────────────────────
const draft = {
  name: '', organisation: '', operatorName: '', operatorRole: '', startDate: '', windowStart: '', windowEnd: '', environments: [{ alias: '', kind: 'production', notes: '' }],
  storageMode: null, mode: 'tailored', disclaimer: false,
};

function resetDraft() {
  Object.assign(draft, { name: '', organisation: '', operatorName: state.settings.operatorName || '', operatorRole: state.settings.operatorRole || '', startDate: new Date().toISOString().slice(0, 10), windowStart: '', windowEnd: '', environments: [{ alias: '', kind: 'production', notes: '' }], storageMode: state.settings.storageMode, mode: 'tailored', disclaimer: false });
}
resetDraft();

function bound(key, attrs = {}) {
  return h('input', { type: 'text', value: draft[key] || '', 'data-focus-key': `draft-${key}`, oninput: (e) => { draft[key] = e.target.value; }, ...attrs });
}

route('setup', ({ params }) => {
  const step = Math.min(4, Math.max(1, Number(params[0]) || 1));
  if (step === 1 && !draft.__started) { resetDraft(); draft.__started = true; }
  const steps = ['Project', 'Environments', 'Saving', 'Approach'];
  const nav = h('ol', { class: 'wizard-steps' }, steps.map((s, i) => h('li', { class: [i + 1 === step && 'current', i + 1 < step && 'done'], 'aria-current': i + 1 === step ? 'step' : null }, h('span', { class: 'n' }, String(i + 1)), s)));
  let body;
  let next;
  if (step === 1) {
    body = h('div', { class: 'stack' },
      field('Project or customer label', bound('name', { maxlength: '200', placeholder: 'For example: Sentinel transition 2026' }), { required: true, hint: 'Shown on reports. Use a label your organisation is comfortable printing.' }),
      field('Organisation (optional)', bound('organisation', { maxlength: '200' })),
      h('div', { class: 'grid-2' },
        field('Your name (operator)', bound('operatorName', { maxlength: '200' }), { required: true, hint: 'Recorded on statuses, evidence and decisions you make. You can change it later.' }),
        field('Your role (optional)', bound('operatorRole', { maxlength: '200', placeholder: 'For example: Security architect' }))),
      h('div', { class: 'grid-3' },
        field('Project start date', bound('startDate', { type: 'date' })),
        field('Planned transition window — from', bound('windowStart', { type: 'date' })),
        field('Planned transition window — to', bound('windowEnd', { type: 'date' }))),
      callout('info', 'No secrets here.', ' Never enter passwords, client secrets, tokens or keys. This app does not need them and will not ask for them.'));
    next = () => {
      if (!draft.name.trim() || !draft.operatorName.trim()) { toast('Please enter a project label and your name.', 'bad'); return false; }
      if (draft.windowStart && draft.windowEnd && draft.windowEnd < draft.windowStart) { toast('The window end date is before its start date.', 'bad'); return false; }
      return true;
    };
  } else if (step === 2) {
    const rows = draft.environments.map((env, i) => h('div', { class: 'env-row' },
      field('Alias', h('input', { type: 'text', value: env.alias, maxlength: '120', placeholder: 'For example: SOC-PROD-WEU', 'data-focus-key': `env-alias-${i}`, oninput: (e) => { env.alias = e.target.value; } })),
      field('Type', h('select', { onchange: (e) => { env.kind = e.target.value; } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: env.kind === k }, k)))),
      field('Notes (optional)', h('input', { type: 'text', value: env.notes, maxlength: '2000', 'data-focus-key': `env-notes-${i}`, oninput: (e) => { env.notes = e.target.value; } })),
      draft.environments.length > 1 ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove environment ${i + 1}`, onclick: () => { draft.environments.splice(i, 1); go(`#/setup/2`); } }, icon('trash')) : h('span')));
    body = h('div', { class: 'stack' },
      h('p', null, 'List the Sentinel workspaces or environments in scope using aliases. You can add more later.'),
      callout('info', 'Use aliases, not identifiers.', ' Tenant and subscription IDs are not required. Reports print what you enter here.'),
      ...rows,
      btn('Add environment', () => { draft.environments.push({ alias: '', kind: 'production', notes: '' }); go('#/setup/2'); }, { iconName: 'plus', small: true }));
    next = () => true;
  } else if (step === 3) {
    const choice = (value, title, desc) => h('label', { class: ['choice', draft.storageMode === value && 'selected'] },
      h('input', { type: 'radio', name: 'storage', value, checked: draft.storageMode === value, onchange: () => { draft.storageMode = value; go('#/setup/3'); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
    body = h('div', { class: 'stack' },
      h('p', null, 'Choose where this app keeps your project while you work. You can change this at any time in Settings.'),
      h('fieldset', { class: 'choices' }, h('legend', { class: 'sr-only' }, 'Project saving'),
        choice('none', 'Autosave off (default) — save project packages yourself', 'Your work stays in this browser tab until you select "Save project package", which writes a .zip file with all data and evidence. If you close the tab without saving, unsaved work is lost (the app warns you).'),
        choice('browser', 'Autosave in this browser', 'Every change is saved automatically in this browser profile\'s storage (IndexedDB) on this computer. Nothing leaves the computer. You still need project packages for backups and hand-over.')),
      draft.storageMode === 'browser' ? callout('caution', 'Know what browser storage means.', h('ul', null,
        h('li', null, 'Data is stored unencrypted in your browser profile. Anyone with access to your Windows account and browser can read it.'),
        h('li', null, 'In Edge and Chrome, all locally opened HTML files share one storage area — another local HTML file opened in the same browser could read it. Only open local HTML files you trust.'),
        h('li', null, 'Clearing browsing data, or the browser running low on disk space, can delete it. Keep saving project packages.'))) : null,
      h('p', { class: 'small muted' }, 'Separately, your preferences (theme, saving choice, your name) are remembered in this browser\'s local storage. They contain no project data. You can export or reset them in Settings.'));
    next = () => { if (!draft.storageMode) { toast('Choose a saving option.', 'bad'); return false; } return true; };
  } else {
    const pathChoice = (value, title, desc) => h('label', { class: ['choice', draft.mode === value && 'selected'] },
      h('input', { type: 'radio', name: 'mode', value, checked: draft.mode === value, onchange: () => { draft.mode = value; go('#/setup/4'); } }),
      h('div', null, h('strong', null, title), h('p', { class: 'small' }, desc)));
    body = h('div', { class: 'stack' },
      h('fieldset', { class: 'choices' }, h('legend', null, 'How do you want to start?'),
        pathChoice('tailored', 'Tailor the checklist to my environment', `Answer ${state.kb.questions.length} short questions (Yes / No / I don't know / Not applicable). The plan shows why each item applies, does not apply, or is uncertain. Nothing is permanently hidden.`),
        pathChoice('full', 'Show me the full checklist', `See all ${state.kb.checks.length} items without tailoring. You decide what applies as you go.`)),
      h('div', { class: 'card card-muted' }, h('h2', null, 'Before you start'), h('p', null, DISCLAIMER_SHORT),
        h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: draft.disclaimer, onchange: (e) => { draft.disclaimer = e.target.checked; } }), ' I understand that this tool is guidance only and that my organisation remains responsible for verifying instructions, approvals and change decisions.')));
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
    updateSettings({ operatorName: p.meta.operatorName, operatorRole: p.meta.operatorRole, welcomeSeen: true, disclaimerAcknowledgedAt: nowIso() });
    setProject(p, new Map(), { fromFile: false });
    draft.__started = false;
    go(draft.mode === 'tailored' ? '#/questionnaire' : '#/overview');
    await setStorageMode(draft.storageMode);
  };

  return h('div', { class: 'page narrow' },
    pageHead('New project', 'A few details to tailor guidance and label your reports.'),
    nav,
    h('div', { class: 'card' }, body),
    h('div', { class: 'wizard-foot' },
      step > 1 ? btn('Back', () => go(`#/setup/${step - 1}`), { iconName: 'back' }) : btn('Cancel', () => { draft.__started = false; go(state.project ? '#/overview' : '#/welcome'); }, { kind: 'ghost' }),
      step < 4 ? btn('Continue', () => { if (next()) go(`#/setup/${step + 1}`); }, { kind: 'primary', iconName: 'chevron' }) : btn('Create project', () => { if (next()) finish(); }, { kind: 'primary', iconName: 'check' })));
});

// ───────────────────────────── Questionnaire ─────────────────────────────
route('questionnaire', ({ params }) => {
  const p = state.project;
  const kb = state.kb;
  if (p.mode === 'full') {
    return h('div', { class: 'page narrow' }, pageHead('Environment questionnaire', 'This project uses the full checklist.'),
      h('p', null, 'You chose to see every item without tailoring. You can switch to tailoring at any time; statuses and evidence are kept.'),
      btn('Switch to tailored mode', async () => {
        if (await confirmDialog({ title: 'Switch to tailored mode?', message: 'Items will be shown as applicable, not applicable or uncertain based on your answers. Nothing you recorded is deleted.', confirmLabel: 'Switch' })) {
          mutate((pr) => { pr.mode = 'tailored'; addAudit(pr, 'project.mode', 'Switched to tailored mode'); });
        }
      }, { kind: 'primary' }));
  }
  const sectionId = params[0] || kb.questionSections[0].id;
  const sIdx = Math.max(0, kb.questionSections.findIndex((s) => s.id === sectionId));
  const section = kb.questionSections[sIdx];
  const qIdx = questionIndex(kb);
  const answered = kb.questions.filter((q) => p.answers[q.id]).length;

  const visible = (q) => !q.showIf || evaluateApplicability({ id: '_', applicability: q.showIf }, { ...p, mode: 'tailored', checks: {} }, kb, qIdx).value !== 'not_applicable';

  const questionEl = (q) => {
    const a = p.answers[q.id];
    const name = `q-${q.id}`;
    return h('fieldset', { class: 'question' },
      h('legend', null, q.text),
      q.help ? h('p', { class: 'small muted' }, q.help) : null,
      h('div', { class: 'answer-row' }, ANSWERS.map((opt) => h('label', { class: ['answer', a && a.value === opt.id && 'selected'] },
        h('input', { type: 'radio', name, value: opt.id, checked: a && a.value === opt.id, 'data-focus-key': `${name}-${opt.id}`, onchange: () => changeAnswer(q, opt.id) }),
        opt.id === 'unknown' ? "I don't know" : opt.label))),
      a ? h('div', { class: 'answer-meta small muted' }, `Answered by ${a.by} on ${formatDate(a.at)}`, ' · ',
        h('button', { type: 'button', class: 'linklike', onclick: () => changeAnswer(q, null) }, 'Clear answer'),
        (a.value === 'na' || a.value === 'unknown') ? h('div', null, h('input', { type: 'text', class: 'input-sm', maxlength: '2000', placeholder: a.value === 'na' ? 'Why is this not applicable? (recommended)' : 'What needs investigating? (optional)', value: a.reason || '', 'data-focus-key': `${name}-reason`, oninput: (e) => mutate((pr) => { if (pr.answers[q.id]) pr.answers[q.id].reason = e.target.value.slice(0, 2000); }, { silent: true }) })) : null) : null);
  };

  return h('div', { class: 'page narrow' },
    pageHead('Environment questionnaire', `Answer what you know. "I don't know" keeps related items in scope as "applicability uncertain". ${answered} of ${kb.questions.length} answered.`),
    h('nav', { class: 'tabs', 'aria-label': 'Questionnaire sections' }, kb.questionSections.map((s) => {
      const qs = kb.questions.filter((q) => q.section === s.id);
      const done = qs.filter((q) => p.answers[q.id]).length;
      return h('a', { href: `#/questionnaire/${s.id}`, class: ['tab', s.id === section.id && 'active'], 'aria-current': s.id === section.id ? 'page' : null }, s.title, h('span', { class: 'tab-meta' }, `${done}/${qs.length}`));
    })),
    h('section', { class: 'card' }, h('h2', null, section.title), h('p', { class: 'muted' }, section.intro),
      ...kb.questions.filter((q) => q.section === section.id && visible(q)).map(questionEl)),
    h('div', { class: 'wizard-foot' },
      sIdx > 0 ? linkBtn('Previous section', `#/questionnaire/${kb.questionSections[sIdx - 1].id}`, { iconName: 'back' }) : h('span'),
      sIdx < kb.questionSections.length - 1 ? linkBtn('Next section', `#/questionnaire/${kb.questionSections[sIdx + 1].id}`, { kind: 'primary', iconName: 'chevron' }) : linkBtn('Go to the project overview', '#/overview', { kind: 'primary', iconName: 'chevron' })));
});

async function changeAnswer(q, value) {
  const kb = state.kb;
  const p = state.project;
  const before = applicabilityMap(kb, p);
  mutate((pr) => setAnswer(pr, q.id, value), { silent: true });
  const after = applicabilityMap(kb, p);
  const diff = diffApplicability(before, after);
  const hadDecisions = Object.keys(p.gates).length > 0 || p.snapshots.length > 0;
  const affected = [...diff.appeared, ...diff.removed, ...diff.uncertain];
  const withRecords = affected.filter((id) => p.checks[id] && (p.checks[id].status !== 'not_started' || p.checks[id].evidenceIds.length));
  // Items that were out of scope and now come back are "new work" — worth telling the user about.
  // Items moving from "uncertain" to "applies" during normal answering are not (they were already in scope).
  const reappeared = [...diff.appeared, ...diff.uncertain].filter((id) => before.get(id) && before.get(id).value === 'not_applicable');
  if (affected.length && (withRecords.length || reappeared.length || hadDecisions)) {
    const title = (id) => { const c = kb.checks.find((x) => x.id === id); return `${id} — ${c ? c.title : ''}`; };
    await modal({
      title: 'This answer changes your plan',
      body: h('div', { class: 'stack' },
        diff.appeared.length ? h('div', null, h('strong', null, `${diff.appeared.length} item(s) now apply:`), h('ul', null, diff.appeared.map((id) => h('li', null, title(id))))) : null,
        diff.uncertain.length ? h('div', null, h('strong', null, `${diff.uncertain.length} item(s) are now uncertain (still in scope):`), h('ul', null, diff.uncertain.map((id) => h('li', null, title(id))))) : null,
        diff.removed.length ? h('div', null, h('strong', null, `${diff.removed.length} item(s) no longer apply (shown greyed out, never deleted):`), h('ul', null, diff.removed.map((id) => h('li', null, title(id))))) : null,
        withRecords.length ? callout('info', 'Your records are kept.', ` Statuses and evidence on ${withRecords.length} affected item(s) are preserved.`) : null,
        hadDecisions ? callout('caution', 'Earlier conclusions may be outdated.', ' A gate decision or report snapshot was recorded before this change. Review the stage conclusions and consider a new snapshot.') : null),
      actions: [{ label: 'OK', kind: 'primary', value: true }],
    });
  }
  render();
}
