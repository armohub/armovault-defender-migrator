// App shell: router, sidebar, top bar, banners and the render loop.
import { h, icon, clear, toast, saveBlob, modal, initToasts, withLoader, stickyToast } from './dom.js';
import { saveReminderDue, unsavedMinutes, FIRST_REMINDER_MIN } from '../core/reminders.js';
import { state, subscribe, subscribeStatus, exportPackage, markExported, autosaveEnabled, flushAutosave, hasUnprotectedChanges } from '../app/store.js';
import { BRAND, APP_VERSION } from '../brand.js';
import { applicabilityMap, upfrontQuestions } from '../core/applicability.js';
import { summariseStage } from '../core/readiness.js';
import { slugify, formatDate, nowIso } from '../core/util.js';
import { STAGE_ICONS } from './components.js';
import { brandMark } from './intro.js';

const routes = new Map();
export function route(name, view) { routes.set(name, view); }

export function parseHash() {
  const raw = (location.hash || '#/').slice(1);
  const parts = raw.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
  return { name: parts[0] || '', params: parts.slice(1) };
}

export function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

// True while rendering a page the user has just navigated to (used for entrance motion).
export let freshRoute = false;

const scrollMemory = new Map();
let lastRouteKey = '';
let navOpen = false;
const OPEN_ROUTES = ['welcome', 'setup', 'knowledge', 'settings', 'about', 'demo'];
const TITLES = { overview: 'Overview', stage: 'Stage', item: 'Step', register: 'Decisions and risks', evidence: 'Evidence', reports: 'Reports', report: 'Report', snapshot: 'Snapshot', questionnaire: 'Questions', answers: 'Your answers', project: 'Project setup', knowledge: 'Knowledge', settings: 'Settings', about: 'About', welcome: 'Welcome', setup: 'New project' };

export function render() {
  const app = document.getElementById('app');
  const { name, params } = parseHash();
  let routeName = name;
  if (!state.project && !OPEN_ROUTES.includes(routeName)) routeName = 'welcome';
  if (state.project && routeName === '') routeName = 'overview';
  if (!routes.has(routeName)) routeName = state.project ? 'overview' : 'welcome';
  const routeKey = `${routeName}/${params.join('/')}`;
  const main = document.getElementById('main');
  if (main && lastRouteKey) scrollMemory.set(lastRouteKey, main.scrollTop);
  freshRoute = routeKey !== lastRouteKey;
  if (freshRoute) navOpen = false;

  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.focusKey : null;

  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.density = state.settings.density;
  document.body.dataset.motion = state.settings.motion;

  clear(app);
  const view = routes.get(routeName);
  let content;
  try {
    content = view({ params });
  } catch (e) {
    content = h('div', { class: 'page' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'Something went wrong'), h('p', null, 'This page could not be shown. Your data has not been changed.'), h('pre', { class: 'code' }, String(e && e.stack ? e.stack : e)));
  }
  if (freshRoute && content && content.classList && content.classList.contains('page')) content.classList.add('page-enter');
  const isReport = routeName === 'report' || routeName === 'snapshot';
  const focusMode = !!(routeName === 'questionnaire' && state.project && state.project.mode === 'tailored');
  app.appendChild(h('div', { class: ['shell', isReport && 'shell-report', navOpen && 'nav-open', focusMode && 'shell-focus'] },
    h('a', { class: 'skip', href: '#main', onclick: (e) => { e.preventDefault(); document.getElementById('main').focus(); } }, 'Skip to content'),
    focusMode ? focusSidebar() : sidebar(routeName, params),
    h('div', { class: 'workspace' }, topbar(routeName, params, focusMode), banners(routeName), h('main', { id: 'main', tabindex: '-1', class: 'main' }, content))));

  const newMain = document.getElementById('main');
  newMain.scrollTop = scrollMemory.get(routeKey) || 0;
  if (freshRoute) {
    const title = document.getElementById('page-title');
    if (title && lastRouteKey) title.focus({ preventScroll: true });
  }
  if (focusKey) {
    const el = document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
    if (el) el.focus({ preventScroll: true });
  }
  lastRouteKey = routeKey;
  document.title = `${state.project ? `${state.project.meta.name || 'Untitled project'} · ` : ''}${BRAND.brandName} ${BRAND.shortName}`;
  if (freshRoute) window.dispatchEvent(new CustomEvent('armo:routed', { detail: { routeName, params } }));
}

function navLink(href, label, iconName, active, extra) {
  return h('a', { href, class: ['nav-link', active && 'active'], 'aria-current': active ? 'page' : null }, icon(iconName), h('span', { class: 'nav-label' }, label), extra || null);
}

function sidebar(routeName, params) {
  const p = state.project;
  const kb = state.kb;
  const nav = h('nav', { class: 'nav', 'aria-label': 'Main' });
  if (p) {
    const appMap = applicabilityMap(kb, p);
    nav.appendChild(navLink('#/overview', 'Overview', 'overview', routeName === 'overview'));
    nav.appendChild(h('div', { class: 'nav-section' }, 'Your route'));
    for (const st of kb.stages) {
      const sum = summariseStage(kb, p, st.id, appMap);
      const skipped = st.id === 'test' && p.stages.test.availability === 'unavailable';
      const complete = !skipped && sum.counts.inScope > 0 && sum.counts.assessed >= sum.counts.inScope;
      const meta = skipped ? h('span', { class: 'nav-meta' }, 'skipped') : complete ? h('span', { class: 'nav-meta nav-meta-done', 'aria-label': 'complete' }, icon('check', 'icon-xs')) : h('span', { class: 'nav-meta', 'aria-label': `${sum.counts.progress} percent` }, `${sum.counts.progress}%`);
      const active = (routeName === 'stage' && params[0] === st.id) || (routeName === 'item' && (kb.checks.find((c) => c.id === params[0]) || {}).stage === st.id);
      nav.appendChild(navLink(`#/stage/${st.id}`, `${st.short}${st.optional ? ' (optional)' : ''}`, STAGE_ICONS[st.id], active, meta));
    }
    nav.appendChild(h('div', { class: 'nav-section' }, 'Your records'));
    const openReg = p.register.filter((r) => !['done', 'closed', 'accepted'].includes(r.status)).length;
    nav.appendChild(navLink('#/register', 'Decisions and risks', 'register', routeName === 'register', openReg ? h('span', { class: 'nav-meta', 'aria-label': `${openReg} open` }, String(openReg)) : null));
    nav.appendChild(navLink('#/evidence', 'Evidence', 'evidence', routeName === 'evidence', h('span', { class: 'nav-meta' }, String(Object.keys(p.evidence).length))));
    nav.appendChild(navLink('#/reports', 'Reports', 'reports', ['reports', 'report', 'snapshot'].includes(routeName)));
    nav.appendChild(h('div', { class: 'nav-section' }, 'Setup'));
    nav.appendChild(navLink('#/project', 'Project setup', 'edit', routeName === 'project'));
    if (p.mode === 'tailored') nav.appendChild(navLink('#/answers', 'Your answers', 'question', routeName === 'answers' || routeName === 'questionnaire'));
  } else {
    nav.appendChild(navLink('#/welcome', 'Start', 'overview', routeName === 'welcome' || routeName === 'setup'));
  }

  const helpLink = (href, label, ic, active) => h('a', { href, class: ['help-link', active && 'active'], 'aria-current': active ? 'page' : null }, icon(ic, 'icon-sm'), label);
  return h('aside', { class: 'sidebar', id: 'sidebar', inert: !navOpen && window.matchMedia('(max-width: 900px)').matches ? true : null },
    h('a', { href: p ? '#/overview' : '#/welcome', class: 'brand', 'aria-label': `${BRAND.productName}, home` },
      brandMark(),
      h('span', { class: 'brand-text' }, h('span', { class: 'brand-name' }, BRAND.brandName), h('span', { class: 'brand-product' }, `MS ${BRAND.shortName}`))),
    h('div', { class: 'brand-meta' }, h('span', { class: 'mono' }, `v${APP_VERSION}`), h('span', { 'aria-hidden': 'true' }, '·'), h('a', { href: '#/about' }, `Made by ${BRAND.makers.map((m) => m.name).join(' & ')}`)),
    p ? h('a', { href: '#/project', class: 'project-chip', title: 'Open project setup' }, h('span', { class: 'project-chip-label' }, p.isDemo ? 'Demo project (fictional)' : 'Your project'), h('span', { class: 'project-chip-name' }, p.meta.name || 'Untitled project')) : null,
    nav,
    h('div', { class: 'sidebar-foot' },
      h('nav', { class: 'help-row', 'aria-label': 'Help' }, helpLink('#/knowledge', 'Knowledge', 'knowledge', routeName === 'knowledge'), helpLink('#/settings', 'Settings', 'settings', routeName === 'settings'), helpLink('#/about', 'About', 'info', routeName === 'about')),
      h('div', { class: 'offline-note', title: 'This file blocks all network requests (Content-Security-Policy connect-src none). Links to Microsoft Learn open only when you click them.' }, h('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Offline. Nothing leaves this device.')));
}

// While the questions are open, the left pane shows only where you are in setting up the plan, so nothing
// pulls you out of the questions by mistake. "Leave the questions for later" is the one way out.
function focusSidebar() {
  const p = state.project;
  const qs = upfrontQuestions(state.kb, p);
  const answered = qs.filter((q) => p.answers[q.id]).length;
  const step = (st, label, meta) => h('li', { class: ['focus-step', st] }, h('span', { class: 'focus-dot', 'aria-hidden': 'true' }, st === 'done' ? icon('check', 'icon-xs') : null), h('span', null, h('strong', null, label), meta ? h('span', { class: 'small muted' }, meta) : null));
  const allDone = answered >= qs.length;
  return h('aside', { class: 'sidebar sidebar-focus', id: 'sidebar' },
    h('div', { class: 'brand' }, brandMark(), h('span', { class: 'brand-text' }, h('span', { class: 'brand-name' }, BRAND.brandName), h('span', { class: 'brand-product' }, `MS ${BRAND.shortName}`))),
    h('div', { class: 'project-chip' }, h('span', { class: 'project-chip-label' }, p.isDemo ? 'Demo project (fictional)' : 'Your project'), h('span', { class: 'project-chip-name' }, p.meta.name || 'Untitled project')),
    h('div', { class: 'nav-section' }, 'Setting up your plan'),
    h('ol', { class: 'focus-steps' },
      step('done', 'Project set up', `${(p.meta.environments || []).length} workspace${(p.meta.environments || []).length === 1 ? '' : 's'}`),
      step(allDone ? 'done' : 'current', 'Answer the questions', `${answered} of ${qs.length} answered`),
      step(allDone ? 'current' : 'todo', 'Build your plan', '')),
    h('div', { class: 'sidebar-foot' },
      h('a', { href: '#/overview', class: 'help-link' }, icon('back', 'icon-sm'), 'Leave the questions for later'),
      h('div', { class: 'offline-note' }, h('span', { class: 'live-dot', 'aria-hidden': 'true' }), 'Offline. Nothing leaves this device.')));
}

function saveStatus() {
  const p = state.project;
  if (!p) return h('span', { class: 'save-status', id: 'save-status' });
  const el = saveStatusInner();
  el.id = 'save-status';
  return el;
}

// Updates only the indicator, so typing is never interrupted by a redraw.
function refreshSaveStatus() {
  const cur = document.getElementById('save-status');
  if (cur) cur.replaceWith(saveStatus());
}

function saveStatusInner() {
  const p = state.project;
  if (p.isDemo) return h('span', { class: 'save-status save-demo sr-only' }, 'Demo project: nothing is saved');
  if (autosaveEnabled()) {
    if (state.ui.saveState === 'saving') return h('span', { class: 'save-status' }, icon('clock', 'icon-xs'), h('span', { class: 'long' }, 'Saving in this browser'));
    if (state.ui.saveState === 'error') return h('span', { class: 'save-status save-bad', title: state.ui.saveError }, icon('alert', 'icon-xs'), 'Browser save failed');
    return h('span', { class: 'save-status save-good', title: 'Autosaved in this browser\'s storage (IndexedDB). Not a file: save a project package for backup.' }, icon('check', 'icon-xs'), h('span', { class: 'long' }, `Saved in this browser${state.ui.lastBrowserSave ? ` at ${formatDate(state.ui.lastBrowserSave, true).slice(11)}` : ''}`));
  }
  if (state.ui.unexported) {
    const min = unsavedMinutes(state.ui.unsavedSince, nowIso());
    return h('span', { class: ['save-status', min >= FIRST_REMINDER_MIN ? 'save-bad' : 'save-warn'], title: 'Autosave is off. Changes exist only in this tab until you save a project package.' }, icon('alert', 'icon-xs'), h('span', null, min >= 1 ? `Not saved for ${min} min` : 'Not saved yet'));
  }
  return h('span', { class: 'save-status save-good' }, icon('check', 'icon-xs'), h('span', { class: 'long' }, state.ui.lastExport ? `Package saved at ${formatDate(state.ui.lastExport, true).slice(11)}` : 'No unsaved changes'));
}

// Autosave off: remind people to save. Checked every 30 seconds without redrawing the page, so typing is never
// interrupted. The reminder stays until it is acted on; "later" snoozes it for fifteen minutes.
let closeReminder = null;
function checkSaveReminder() {
  refreshSaveStatus();
  const p = state.project;
  if (closeReminder && !(p && state.ui.unexported)) { closeReminder(); closeReminder = null; }
  if (closeReminder || !p) return;
  const now = nowIso();
  if (!saveReminderDue({ manual: !autosaveEnabled(), unexported: state.ui.unexported, demo: p.isDemo, unsavedSince: state.ui.unsavedSince, lastReminderAt: state.ui.lastReminderAt, now })) return;
  state.ui.lastReminderAt = now;
  const min = unsavedMinutes(state.ui.unsavedSince, now);
  const done = () => { closeReminder = null; };
  closeReminder = stickyToast(`Your work is not saved: ${min} minutes of changes exist only in this tab. Save a project package so nothing is lost.`, [
    { label: 'Remind me in 15 minutes', kind: 'ghost', onClick: () => { state.ui.lastReminderAt = nowIso(); done(); } },
    { label: 'Save package', kind: 'primary', onClick: () => { done(); savePackageFlow(); } },
  ]);
}
export function startSaveReminders() { setInterval(checkSaveReminder, 30000); }

// At a milestone (a decision, a finished mission), a good moment to save when autosave is off.
export function nudgeSave(what) {
  const p = state.project;
  if (!p || p.isDemo || autosaveEnabled() || !state.ui.unexported) return;
  toast(`${what} A good moment to save your project package.`, 'info', 9000);
}

export async function savePackageFlow() {
  const p = state.project;
  if (!p) return;
  try {
    const { blob, missing } = await withLoader('Packing your project', () => exportPackage());
    const name = `${BRAND.fileStem}-${slugify(p.meta.name)}-${new Date().toISOString().slice(0, 10)}.zip`;
    const result = await saveBlob(blob, name, { description: 'Project package', accept: { 'application/zip': ['.zip'] } });
    if (result === 'cancelled') return;
    markExported();
    if (autosaveEnabled()) await flushAutosave();
    toast(result === 'saved' ? 'Project package saved.' : `Project package downloaded (${name}). Store it according to your data-handling policy.`, 'good', 7000);
    if (missing.length) toast(`${missing.length} attachment(s) could not be included because their file content is missing.`, 'bad', 9000);
  } catch (e) {
    toast(`Saving failed: ${e.message}`, 'bad', 9000);
  }
}

function crumbs(routeName, params) {
  const p = state.project;
  const parts = [];
  if (p) parts.push(h('a', { href: '#/overview' }, p.meta.name || 'Untitled project'));
  else parts.push(h('a', { href: '#/welcome' }, BRAND.productName));
  let here = TITLES[routeName] || '';
  if (routeName === 'stage' || routeName === 'item') {
    const kb = state.kb;
    const st = routeName === 'stage' ? kb.stages.find((x) => x.id === params[0]) : kb.stages.find((x) => x.id === (kb.checks.find((c) => c.id === params[0]) || {}).stage);
    if (st && routeName === 'item') { parts.push(h('a', { href: `#/stage/${st.id}` }, st.short)); here = 'Step'; } else if (st) here = st.short;
  }
  if (here && !(routeName === 'overview' && p) && !(routeName === 'welcome' && !p)) parts.push(h('span', { class: 'here' }, here));
  return h('nav', { class: 'crumbs', 'aria-label': 'You are here' }, parts.flatMap((x, i) => [i ? h('span', { class: 'sep', 'aria-hidden': 'true' }, '/') : null, x]));
}

function topbar(routeName, params, focusMode) {
  const p = state.project;
  return h('header', { class: 'topbar' },
    h('div', { class: 'topbar-left' },
      focusMode ? null : h('button', { type: 'button', class: 'btn-icon menu-btn', 'aria-label': navOpen ? 'Close menu' : 'Open menu', 'aria-expanded': navOpen ? 'true' : 'false', 'aria-controls': 'sidebar', onclick: () => { navOpen = !navOpen; render(); } }, icon(navOpen ? 'x' : 'menu')),
      crumbs(routeName, params)),
    h('div', { class: 'topbar-right' },
      p && p.isDemo ? h('span', { class: 'demo-pill' }, icon('sparkle', 'icon-xs'), 'Demo') : null,
      saveStatus(),
      p && !p.isDemo ? h('button', { type: 'button', class: 'btn btn-sm', onclick: savePackageFlow, title: 'Save everything (data and evidence files) as one .zip project package' }, icon('save', 'icon-sm'), 'Save package') : null,
      p && p.isDemo ? h('button', { type: 'button', class: 'btn btn-sm', onclick: () => exitDemoFlow(), 'data-focus-key': 'exit-demo' }, icon('exit', 'icon-sm'), 'Exit demo') : null));
}

// The demo is fictional and never saved, so leaving it needs one confirmation only.
let exitDemoImpl = null;
export function setExitDemo(fn) { exitDemoImpl = fn; }
function exitDemoFlow() { if (exitDemoImpl) exitDemoImpl(); }

function banners(routeName) {
  const out = [];
  if (state.project && state.project.isDemo && routeName !== 'questionnaire') {
    out.push(h('div', { class: 'banner banner-demo' }, icon('info', 'icon-sm'),
      h('span', null, h('strong', null, 'You are exploring a demo. '), 'Lakeview Logistics and everything in it is invented. Nothing you change here is saved.'),
      h('button', { type: 'button', class: 'btn btn-sm', onclick: () => exitDemoFlow() }, 'Start my own project', icon('arrow', 'icon-sm'))));
  }
  if (!state.ui.localStorageOk) out.push(h('div', { class: 'banner banner-warn' }, icon('alert', 'icon-sm'), h('span', null, 'This browser blocks local storage, so settings will not be remembered. You can still save your project as a package file.')));
  if (state.ui.saveState === 'error') out.push(h('div', { class: 'banner banner-bad' }, icon('alert', 'icon-sm'), h('span', null, `Saving to browser storage failed: ${state.ui.saveError} Save a project package now so you do not lose work.`)));
  return out.length ? h('div', { class: 'banners' }, ...out) : null;
}

export function startShell() {
  initToasts();
  subscribe(render);
  subscribeStatus(refreshSaveStatus);
  window.addEventListener('hashchange', render);
  // Date fields: a click opens the browser's calendar picker; typing still works.
  // A field can name its earliest day in data-picker-min. The calendar then greys out earlier days,
  // but the limit is lifted as soon as you type: with a min set, browsers reject digits mid-entry.
  const isDate = (t) => t instanceof HTMLInputElement && t.type === 'date';
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (isDate(t) && !t.disabled && !t.readOnly && typeof t.showPicker === 'function') {
      if (t.dataset.pickerMin) t.min = t.dataset.pickerMin;
      try { t.showPicker(); } catch { /* not allowed here; typing still works */ }
    }
  });
  const liftMin = (e) => { if (isDate(e.target) && e.target.hasAttribute('min') && 'pickerMin' in e.target.dataset) e.target.removeAttribute('min'); };
  for (const type of ['keydown', 'change', 'focusout']) document.addEventListener(type, liftMin, true);
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => render());
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navOpen) { navOpen = false; render(); } });
  window.addEventListener('beforeunload', (e) => {
    // Warn if anything would be lost: unsaved changes without autosave, or an autosave that is pending or failed.
    if (hasUnprotectedChanges()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  render();
}

export function showError(title, err) {
  return modal({ title, body: h('p', null, err && err.message ? err.message : String(err)), actions: [{ label: 'OK', kind: 'primary', value: true }] });
}
