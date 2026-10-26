// Project setup as a page, so guidance can link straight to a section (#/project/window, #/project/environments,
// #/project/owners). The window, workspace and owner sections are the same tools the steps use, so information
// is entered once and appears everywhere it is needed.
import { h, icon, toast, field, reducedMotion, savedPulse } from '../dom.js';
import { state, mutate } from '../../app/store.js';
import { route, render, freshRoute } from '../shell.js';
import { addAudit, setShowExtras } from '../../core/model.js';
import { guidanceSwitch } from './work.js';
import { btn, linkBtn, callout } from '../components.js';
import { windowTool, workspaceTool, ownersTool, peopleList } from '../tools.js';

let form = null; // the draft being edited; survives re-renders until saved or discarded
let formFor = '';

const FIELDS = ['name', 'organisation', 'operatorName', 'operatorRole', 'notes'];
const fresh = (p) => Object.fromEntries(FIELDS.map((k) => [k, p.meta[k] || '']));
const dirty = (p) => form && FIELDS.some((k) => (p.meta[k] || '') !== (form[k] || ''));

route('project', ({ params }) => {
  const p = state.project;
  if (!form || formFor !== p.id || (freshRoute && !dirty(p))) { form = fresh(p); formFor = p.id; }
  const m = form;
  const anchor = params[0] || '';
  const inp = (key, attrs = {}) => h('input', { type: 'text', value: m[key] || '', 'data-focus-key': `proj-${key}`, oninput: (e) => { m[key] = e.target.value; refreshBar(); }, ...attrs });

  const save = () => {
    if (!m.name.trim() || !m.operatorName.trim()) { toast('A project label and your name are required.', 'bad'); return; }
    mutate((pr) => {
      const changed = FIELDS.filter((k) => (pr.meta[k] || '') !== (m[k] || ''));
      Object.assign(pr.meta, { name: m.name.trim(), organisation: (m.organisation || '').trim(), operatorName: m.operatorName.trim(), operatorRole: (m.operatorRole || '').trim(), notes: m.notes || '' });
      addAudit(pr, 'project.details', `Project details updated${changed.length ? ` (${changed.join(', ')})` : ''}`);
    });
    form = fresh(state.project);
    savedPulse('Project details saved');
    render();
  };
  const bar = h('div', { class: 'tool-bar' });
  function refreshBar() {
    const isDirty = dirty(state.project);
    bar.replaceChildren(...[
      h('span', { class: 'small muted' }, isDirty ? 'Changes not saved yet.' : 'Saved.'),
      isDirty ? btn('Discard', () => { form = fresh(state.project); render(); }, { kind: 'ghost', small: true }) : null,
      h('button', { type: 'button', class: 'btn btn-primary btn-sm', disabled: !isDirty, 'data-focus-key': 'proj-save', onclick: save }, icon('check', 'icon-sm'), 'Save')].filter(Boolean));
  }
  refreshBar();

  const nav = [['project', 'Project'], ['window', 'Window'], ['environments', 'Workspaces'], ['owners', 'Owners and approvers']];
  const page = h('div', { class: 'page narrow' },
    peopleList(),
    h('div', { class: 'page-head' }, h('div', null, h('h1', { id: 'page-title', tabindex: '-1' }, 'Project setup'), h('p', { class: 'lede' }, 'Everything the plan and your reports reuse: enter it once here or in the steps, and it shows up wherever it is needed.')),
      h('div', { class: 'page-actions' }, linkBtn('Back to the overview', '#/overview', { kind: 'ghost', iconName: 'back' }))),
    h('nav', { class: 'tabs', 'aria-label': 'Project setup sections' }, nav.map(([id, label]) => h('a', { href: `#/project/${id}`, class: ['tab', (anchor || 'project') === id && 'active'] }, label))),
    p.isDemo ? callout('info', 'This is the demo project.', ' You can try editing here, but nothing is saved.') : null,
    h('section', { class: 'card form-section stack', id: 'sec-project' }, h('h2', { class: 'card-title' }, 'Project and you'),
      field('Project or customer label', inp('name', { maxlength: '200' }), { required: true, hint: 'Printed on your reports.' }),
      field('Organisation', inp('organisation', { maxlength: '200' })),
      h('div', { class: 'grid-2' }, field('Your name', inp('operatorName', { maxlength: '200' }), { required: true, hint: 'Used for new records from now on. Earlier records keep the name they were recorded with.' }), field('Your role', inp('operatorRole', { maxlength: '200' }))),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'How the plan is shown'), guidanceSwitch(), h('p', { class: 'hint' }, 'Simplified: missions with short checklists. Detailed: every step in full. Your records stay the same.')),
      h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: state.project.meta.showExtras !== false, onchange: (e) => mutate((pr) => setShowExtras(pr, e.target.checked)) }), ' Show recommended extras (good practice, not needed for the move)'),
      field('Project notes', (() => { const t = h('textarea', { rows: '3', maxlength: '20000', 'data-focus-key': 'proj-notes', oninput: (e) => { m.notes = e.target.value; refreshBar(); } }); t.value = m.notes || ''; return t; })()),
      bar),
    h('section', { class: 'card form-section stack', id: 'sec-window' }, h('h2', { class: 'card-title' }, icon('calendar', 'icon-sm'), 'Planned transition window'), windowTool()),
    h('section', { class: 'card form-section stack', id: 'sec-environments' }, h('h2', { class: 'card-title' }, 'Workspaces in scope'), workspaceTool()),
    h('section', { class: 'card form-section stack', id: 'sec-owners' }, h('h2', { class: 'card-title' }, icon('users', 'icon-sm'), 'Owners and approvers'), ownersTool({ simple: false, setupPage: true })));

  if (freshRoute && anchor && anchor !== 'project') {
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
