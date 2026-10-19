// App shell: router, sidebar, top bar, banners and the render loop.
import { h, icon, clear, toast, saveBlob, modal, initToasts } from './dom.js';
import { state, subscribe, subscribeStatus, exportPackage, markExported, autosaveEnabled, flushAutosave, hasUnprotectedChanges } from '../app/store.js';
import { BRAND, APP_VERSION } from '../brand.js';
import { applicabilityMap } from '../core/applicability.js';
import { summariseStage } from '../core/readiness.js';
import { slugify, formatDate } from '../core/util.js';
import { STAGE_ICONS } from './components.js';

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

const scrollMemory = new Map();
let lastRouteKey = '';

export function render() {
  const app = document.getElementById('app');
  const { name, params } = parseHash();
  let routeName = name;
  if (!state.project && !['welcome', 'setup', 'knowledge', 'settings', 'about', 'demo'].includes(routeName)) routeName = 'welcome';
  if (state.project && (routeName === '' || routeName === 'welcome')) routeName = state.project ? (routeName === 'welcome' ? 'welcome' : 'overview') : 'welcome';
  if (!routes.has(routeName)) routeName = state.project ? 'overview' : 'welcome';
  const routeKey = `${routeName}/${params.join('/')}`;
  const main = document.getElementById('main');
  if (main && lastRouteKey) scrollMemory.set(lastRouteKey, main.scrollTop);

  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.focusKey : null;

  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.density = state.settings.density;

  clear(app);
  const view = routes.get(routeName);
  let content;
  try {
    content = view({ params });
  } catch (e) {
    content = h('div', { class: 'page' }, h('h1', null, 'Something went wrong'), h('p', null, 'This view could not be displayed. Your data has not been changed.'), h('pre', { class: 'code' }, String(e && e.stack ? e.stack : e)));
  }
  const isReport = routeName === 'report' || routeName === 'snapshot';
  app.appendChild(h('div', { class: ['shell', isReport && 'shell-report'] },
    h('a', { class: 'skip', href: '#main', onclick: (e) => { e.preventDefault(); document.getElementById('main').focus(); } }, 'Skip to content'),
    sidebar(routeName, params),
    h('div', { class: 'workspace' }, topbar(routeName), banners(), h('main', { id: 'main', tabindex: '-1', class: 'main' }, content))));

  const newMain = document.getElementById('main');
  if (routeKey !== lastRouteKey) {
    newMain.scrollTop = scrollMemory.get(routeKey) || 0;
    const title = document.getElementById('page-title');
    if (title && lastRouteKey) title.focus({ preventScroll: true });
  } else {
    newMain.scrollTop = scrollMemory.get(routeKey) || 0;
  }
  if (focusKey) {
    const el = document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
    if (el) el.focus({ preventScroll: true });
  }
  lastRouteKey = routeKey;
  document.title = `${BRAND.shortName}${state.project ? ` — ${state.project.meta.name || 'Untitled project'}` : ''}`;
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
    nav.appendChild(navLink('#/overview', 'Project overview', 'overview', routeName === 'overview'));
    nav.appendChild(h('div', { class: 'nav-section' }, 'Stages'));
    for (const s of kb.stages) {
      const sum = summariseStage(kb, p, s.id, appMap);
      const skipped = s.id === 'test' && p.stages.test.availability === 'unavailable';
      const pct = skipped ? 'skipped' : `${sum.counts.progress}%`;
      const active = (routeName === 'stage' && params[0] === s.id) || (routeName === 'item' && (kb.checks.find((c) => c.id === params[0]) || {}).stage === s.id);
      nav.appendChild(navLink(`#/stage/${s.id}`, `${s.number} ${s.short}${s.optional ? ' (optional)' : ''}`, STAGE_ICONS[s.id], active, h('span', { class: 'nav-meta', 'aria-label': `progress ${pct}` }, pct)));
    }
    nav.appendChild(h('div', { class: 'nav-section' }, 'Records'));
    const openReg = p.register.filter((r) => !['done', 'closed', 'accepted'].includes(r.status)).length;
    nav.appendChild(navLink('#/register', 'Actions, risks & decisions', 'register', routeName === 'register', openReg ? h('span', { class: 'nav-meta' }, String(openReg)) : null));
    nav.appendChild(navLink('#/evidence', 'Evidence', 'evidence', routeName === 'evidence', h('span', { class: 'nav-meta' }, String(Object.keys(p.evidence).length))));
    nav.appendChild(navLink('#/reports', 'Reports & history', 'reports', routeName === 'reports' || routeName === 'report' || routeName === 'snapshot'));
    if (p.mode === 'tailored') nav.appendChild(navLink('#/questionnaire', 'Environment questionnaire', 'question', routeName === 'questionnaire'));
  } else {
    nav.appendChild(navLink('#/welcome', 'Welcome', 'overview', routeName === 'welcome'));
  }
  nav.appendChild(h('div', { class: 'nav-section' }, 'Help'));
  nav.appendChild(navLink('#/knowledge', 'Knowledge & sources', 'knowledge', routeName === 'knowledge'));
  nav.appendChild(navLink('#/settings', 'Settings & data', 'settings', routeName === 'settings'));
  nav.appendChild(navLink('#/about', 'About & disclaimer', 'info', routeName === 'about'));

  return h('aside', { class: 'sidebar' },
    h('a', { href: p ? '#/overview' : '#/welcome', class: 'brand', 'aria-label': `${BRAND.productName} home` },
      h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'A'),
      h('span', { class: 'brand-text' }, h('span', { class: 'brand-name' }, BRAND.brandName), h('span', { class: 'brand-product' }, BRAND.shortName))),
    p ? h('div', { class: 'sidebar-project' }, h('div', { class: 'small muted' }, p.isDemo ? 'Demo project (fictional)' : 'Project'), h('div', { class: 'sidebar-project-name' }, p.meta.name || 'Untitled project')) : null,
    nav,
    h('div', { class: 'sidebar-foot' },
      h('div', { class: 'offline-badge', title: 'This build blocks all network requests (Content-Security-Policy connect-src none). External links open only when you click them.' }, icon('wifioff', 'icon-xs'), 'Offline · no network requests'),
      h('div', { class: 'small muted' }, `v${APP_VERSION} · KB ${state.kb.meta.version}`),
      h('div', { class: 'small muted' }, 'Built by ', BRAND.makers.map((m) => m.name).join(' & '))));
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
  if (p.isDemo) return h('span', { class: 'save-status save-demo' }, icon('info', 'icon-xs'), 'Demo — not saved');
  if (autosaveEnabled()) {
    if (state.ui.saveState === 'saving') return h('span', { class: 'save-status' }, icon('clock', 'icon-xs'), 'Saving in this browser…');
    if (state.ui.saveState === 'error') return h('span', { class: 'save-status save-bad', title: state.ui.saveError }, icon('alert', 'icon-xs'), 'Browser save failed');
    return h('span', { class: 'save-status save-good', title: 'Autosaved in this browser\'s storage (IndexedDB). Not a file — export a project package for backup.' }, icon('check', 'icon-xs'), `Saved in this browser ${state.ui.lastBrowserSave ? formatDate(state.ui.lastBrowserSave, true).slice(11) : ''}`);
  }
  if (state.ui.unexported) return h('span', { class: 'save-status save-warn', title: 'Autosave is off. Changes exist only in this tab until you save a project package.' }, icon('alert', 'icon-xs'), 'Unsaved changes — not stored anywhere yet');
  return h('span', { class: 'save-status save-good' }, icon('check', 'icon-xs'), state.ui.lastExport ? `Package saved ${formatDate(state.ui.lastExport, true).slice(11)}` : 'No unsaved changes');
}

export async function savePackageFlow() {
  const p = state.project;
  if (!p) return;
  try {
    const { blob, missing } = await exportPackage();
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

function topbar(routeName) {
  const p = state.project;
  return h('header', { class: 'topbar' },
    h('div', { class: 'topbar-left' }, p ? h('span', { class: 'topbar-project' }, p.meta.organisation ? `${p.meta.organisation} · ` : '', p.meta.name || 'Untitled project') : h('span', { class: 'topbar-project' }, BRAND.productName)),
    h('div', { class: 'topbar-right' }, saveStatus(),
      p ? h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: savePackageFlow, title: 'Save everything (data and evidence files) as a .zip project package' }, icon('save', 'icon-sm'), 'Save project package') : null));
}

function banners() {
  const out = [];
  if (state.project && state.project.isDemo) out.push(h('div', { class: 'banner banner-demo' }, icon('info', 'icon-sm'), h('span', null, h('strong', null, 'Demo project — fictional data. '), 'Organisation, people, workspaces and evidence are invented for demonstration. Changes are not saved unless you export them.')));
  if (!state.ui.localStorageOk) out.push(h('div', { class: 'banner banner-warn' }, icon('alert', 'icon-sm'), 'This browser blocks local storage: settings will not be remembered. Your project can still be saved as a package file.'));
  if (state.ui.saveState === 'error') out.push(h('div', { class: 'banner banner-bad' }, icon('alert', 'icon-sm'), `Saving to browser storage failed: ${state.ui.saveError} Save a project package now to avoid losing work.`));
  return out.length ? h('div', { class: 'banners' }, ...out) : null;
}

export function startShell() {
  initToasts();
  subscribe(render);
  subscribeStatus(refreshSaveStatus);
  window.addEventListener('hashchange', render);
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
