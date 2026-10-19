// Project setup as a page, so guidance can link straight to a field (#/project/window, #/project/environments).
import { h, icon, toast, field, reducedMotion } from '../dom.js';
import { state, mutate } from '../../app/store.js';
import { route, render, freshRoute } from '../shell.js';
import { addAudit } from '../../core/model.js';
import { btn, linkBtn, callout } from '../components.js';

let form = null; // the draft being edited; survives re-renders until saved or discarded
let formFor = '';

function fresh(p) {
  return { ...p.meta, environments: p.meta.environments.map((e) => ({ ...e })) };
}
const FIELDS = ['name', 'organisation', 'operatorName', 'operatorRole', 'startDate', 'windowStart', 'windowEnd', 'notes'];
const dirty = (p) => form && (FIELDS.some((k) => (p.meta[k] || '') !== (form[k] || '')) || JSON.stringify(p.meta.environments) !== JSON.stringify(form.environments.filter((e) => e.alias.trim()).map((e) => ({ alias: e.alias.trim(), kind: e.kind, notes: (e.notes || '').trim() }))));

route('project', ({ params }) => {
  const p = state.project;
  if (!form || formFor !== p.id || freshRoute) { form = fresh(p); formFor = p.id; }
  const m = form;
  const anchor = params[0] || '';
  const inp = (key, attrs = {}) => h('input', { type: 'text', value: m[key] || '', 'data-focus-key': `proj-${key}`, oninput: (e) => { m[key] = e.target.value; refreshBar(); }, ...attrs });
  const envRows = m.environments.map((env, i) => h('div', { class: 'env-row' },
    field('Workspace alias', h('input', { type: 'text', value: env.alias, maxlength: '120', placeholder: 'For example: SOC-PROD-WEU', 'data-focus-key': `proj-env-${i}`, oninput: (e) => { env.alias = e.target.value; refreshBar(); } })),
    field('Type', h('select', { onchange: (e) => { env.kind = e.target.value; refreshBar(); } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: env.kind === k }, k)))),
    field('Notes', h('input', { type: 'text', value: env.notes || '', maxlength: '2000', oninput: (e) => { env.notes = e.target.value; refreshBar(); } })),
    h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove workspace ${env.alias || i + 1}`, onclick: () => { m.environments.splice(i, 1); render(); } }, icon('trash'))));

  const save = () => {
    if (!m.name.trim() || !m.operatorName.trim()) { toast('A project label and your name are required.', 'bad'); return; }
    if (m.windowStart && m.windowEnd && m.windowEnd < m.windowStart) { toast('The window ends before it starts. Check the dates.', 'bad'); return; }
    mutate((pr) => {
      const changed = FIELDS.filter((k) => (pr.meta[k] || '') !== (m[k] || ''));
      Object.assign(pr.meta, { name: m.name.trim(), organisation: (m.organisation || '').trim(), operatorName: m.operatorName.trim(), operatorRole: (m.operatorRole || '').trim(), startDate: m.startDate || '', windowStart: m.windowStart || '', windowEnd: m.windowEnd || '', notes: m.notes || '', environments: m.environments.filter((e) => e.alias.trim()).map((e) => ({ alias: e.alias.trim(), kind: e.kind, notes: (e.notes || '').trim() })) });
      addAudit(pr, 'project.details', `Project details updated${changed.length ? ` (${changed.join(', ')})` : ''}`);
    });
    form = fresh(state.project);
    toast('Project setup saved.', 'good');
    render();
  };
  const bar = h('div', { class: 'form-foot', id: 'project-bar' });
  function refreshBar() {
    const isDirty = dirty(state.project);
    bar.replaceChildren(...[
      h('span', { class: 'small muted' }, isDirty ? 'You have changes that are not saved yet.' : 'Everything here is saved.'),
      isDirty ? btn('Discard', () => { form = fresh(state.project); render(); }, { kind: 'ghost' }) : null,
      h('button', { type: 'button', class: 'btn btn-primary', disabled: !isDirty, 'data-focus-key': 'proj-save', onclick: save }, icon('check', 'icon-sm'), 'Save changes')].filter(Boolean));
  }
  refreshBar();

  const windowWarn = m.windowEnd && m.windowEnd > '2027-03-31';
  const page = h('div', { class: 'page narrow' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', { id: 'page-title', tabindex: '-1' }, 'Project setup'), h('p', { class: 'lede' }, 'The basics that label your reports and shape the plan. Change them whenever you need.')),
      h('div', { class: 'page-actions' }, linkBtn('Back to the overview', '#/overview', { kind: 'ghost', iconName: 'back' }))),
    p.isDemo ? callout('info', 'This is the demo project.', ' You can try editing here, but nothing is saved.') : null,
    h('section', { class: 'card form-section stack', id: 'sec-project' }, h('h2', { class: 'card-title' }, 'Project'),
      field('Project or customer label', inp('name', { maxlength: '200' }), { required: true, hint: 'Printed on your reports.' }),
      field('Organisation', inp('organisation', { maxlength: '200' }))),
    h('section', { class: 'card form-section stack', id: 'sec-you' }, h('h2', { class: 'card-title' }, 'You'),
      h('div', { class: 'grid-2' }, field('Your name', inp('operatorName', { maxlength: '200' }), { required: true, hint: 'Used for new records from now on. Earlier records keep the name they were recorded with.' }), field('Your role', inp('operatorRole', { maxlength: '200' })))),
    h('section', { class: 'card form-section stack', id: 'sec-window' }, h('h2', { class: 'card-title' }, icon('calendar', 'icon-sm'), 'Planned transition window'),
      h('p', { class: 'small muted' }, 'When you plan to connect your production workspaces. Leave time for testing, fixes and a quiet period afterwards, and finish well before 31 March 2027.'),
      h('div', { class: 'grid-3' }, field('Project start date', inp('startDate', { type: 'date' })), field('Window from', inp('windowStart', { type: 'date' })), field('Window to', inp('windowEnd', { type: 'date' }))),
      windowWarn ? callout('caution', 'This window ends after 31 March 2027.', ' After that date Sentinel is no longer supported in the Azure portal. Consider an earlier window.') : null),
    h('section', { class: 'card form-section stack', id: 'sec-environments' }, h('h2', { class: 'card-title' }, 'Workspaces in scope'),
      h('p', { class: 'small muted' }, 'Aliases only, never tenant or subscription IDs. Reports print what you enter here.'),
      ...envRows,
      btn('Add a workspace', () => { m.environments.push({ alias: '', kind: 'production', notes: '' }); render(); }, { small: true, iconName: 'plus' })),
    h('section', { class: 'card form-section stack', id: 'sec-notes' }, h('h2', { class: 'card-title' }, 'Project notes'),
      field('Notes', (() => { const t = h('textarea', { rows: '4', maxlength: '20000', 'data-focus-key': 'proj-notes', oninput: (e) => { m.notes = e.target.value; refreshBar(); } }); t.value = m.notes || ''; return t; })())),
    bar);

  if (freshRoute && anchor) {
    // Arriving from a link such as "Project setup > Planned transition window": go to that section.
    setTimeout(() => {
      const sec = document.getElementById(`sec-${anchor}`);
      if (!sec) return;
      sec.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      sec.classList.add('flash');
      const first = sec.querySelector('input, select, textarea');
      if (first) first.focus({ preventScroll: true });
    }, 80);
  }
  return page;
});
