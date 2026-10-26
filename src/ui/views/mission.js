// A mission: one workstream as a short checklist. Same records as the step pages; Details opens the full step.
import { h, icon } from '../dom.js';
import { state, mutate } from '../../app/store.js';
import { route, render } from '../shell.js';
import { applicabilityMap } from '../../core/applicability.js';
import { effectiveStatus } from '../../core/readiness.js';
import { missionOf, nextMission, firstOpenRow, DONE_STATUSES } from '../../core/missions.js';
import { setWorkstreamOwners, setShowExtras, workstreamKey } from '../../core/model.js';
import { btn, linkBtn, emptyState, infoTip } from '../components.js';
import { actionsFor } from '../step-actions.js';
import { changeAnswer } from './questionnaire.js';
import { checkRow } from '../checkrow.js';
import { peopleList } from '../tools.js';

const openByMission = new Map(); // mission key -> open check id, remembered while you move around

route('mission', ({ params }) => {
  const kb = state.kb;
  const p = state.project;
  const appMap = applicabilityMap(kb, p);
  const m = missionOf(kb, p, params[0], params[1], appMap);
  if (!m) return h('div', { class: 'page' }, emptyState('This mission was not found.', '', linkBtn('Back to the overview', '#/overview')));
  const stage = kb.stages.find((s) => s.id === m.stage);
  const first = firstOpenRow(m);
  if (!openByMission.has(m.key) && first) openByMission.set(m.key, first.check.id);
  const openId = openByMission.get(m.key);
  const toggle = (id) => { openByMission.set(m.key, openId === id ? '' : id); render(); };
  const onDone = (id) => {
    const idx = m.needed.findIndex((r) => r.check.id === id);
    const nxt = m.needed.slice(idx + 1).find((r) => !DONE_STATUSES.has(effectiveStatus(state.project, r.check.id)));
    openByMission.set(m.key, nxt ? nxt.check.id : '');
    render();
  };
  const rowFor = (r) => checkRow(r, { open: r.check.id === openId, onToggle: toggle, onDone, ctx: { kb, actions: actionsFor(r.check) } });
  const key = workstreamKey(m.stage, m.workstream);
  const owner = (p.meta.workstreamOwners || {})[key] || '';
  const ownerInput = h('input', { type: 'text', list: 'people-list', maxlength: '200', class: 'owner-chip-input', placeholder: 'Owner: add', 'aria-label': `Owner of ${m.title}`, value: owner, 'data-focus-key': `mowner-${m.key}`,
    onchange: (e) => mutate((pr) => setWorkstreamOwners(pr, { ...(pr.meta.workstreamOwners || {}), [key]: e.target.value })) });
  const next = nextMission(kb, p, appMap);
  const showExtras = p.meta.showExtras !== false;
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 100;

  return h('div', { class: 'page mission-page' },
    peopleList(),
    h('nav', { class: 'breadcrumb', 'aria-label': 'Where this mission belongs' }, h('a', { href: '#/overview' }, 'Overview'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', null, stage.short)),
    h('div', { class: 'mission-head' },
      h('div', null,
        h('h1', { id: 'page-title', tabindex: '-1' }, m.title),
        h('p', { class: 'lede' }, m.purpose)),
      h('div', { class: 'mission-meta' },
        h('div', { class: 'mission-count tnum' }, h('strong', null, String(m.done)), ` of ${m.total} done`),
        h('div', { class: 'mission-bar', role: 'presentation' }, h('span', { style: { width: `${pct}%` } })),
        ownerInput)),
    m.questions.length ? h('section', { class: 'mission-questions', 'aria-label': 'Questions for this mission' },
      m.questions.map((q) => h('div', { class: 'mq' },
        h('p', { class: 'mq-text' }, q.text),
        h('div', { class: 'row-actions' },
          btn('Yes', () => changeAnswer(q, 'yes'), { small: true }),
          btn('No', () => changeAnswer(q, 'no'), { small: true }),
          btn('Not sure', () => changeAnswer(q, 'unknown'), { small: true, kind: 'ghost' })),
        q.why ? h('details', { class: 'disclose small' }, h('summary', null, icon('chevron', 'icon-xs'), 'Why we ask'), h('p', null, q.why)) : null))) : null,
    m.total ? h('ul', { class: 'crow-list' }, m.needed.map(rowFor)) : h('p', { class: 'mission-empty' }, 'Nothing to do here: your answers set these checks aside.'),
    m.complete && m.total ? h('div', { class: 'mission-done', role: 'status' }, icon('check', 'icon-sm'), h('span', null, 'Mission done.'),
      next ? linkBtn(`Next: ${next.title}`, `#/mission/${next.stage}/${next.workstream}`, { kind: 'primary', iconName: 'arrow', small: true }) : linkBtn('Back to the overview', '#/overview', { small: true })) : null,
    m.extras.length ? h('section', { class: 'mission-extras' },
      h('div', { class: 'row' }, h('h2', null, 'Recommended extras'), infoTip({ key: 'extras', title: 'Recommended extras' }, h('p', null, 'Good practice that Microsoft does not require for the move. They never count against your progress or readiness. Do them when they help you, or hide them with the switch.')), h('span', { class: 'small muted' }, 'Good practice, not needed for the move.'),
        h('label', { class: 'toggle small' }, h('input', { type: 'checkbox', checked: showExtras, 'data-focus-key': 'show-extras', onchange: (e) => mutate((pr) => setShowExtras(pr, e.target.checked)) }), 'Show')),
      showExtras ? h('ul', { class: 'crow-list' }, m.extras.map(rowFor)) : null) : null,
    m.setAside.length ? h('details', { class: 'disclose mission-aside' }, h('summary', null, icon('chevron', 'icon-sm'), `Set aside because of your answers (${m.setAside.length})`),
      h('ul', { class: 'bullets small' }, m.setAside.map((r) => h('li', null, r.check.short.title, h('span', { class: 'muted' }, r.app.reasons[0] ? `: ${r.app.reasons[0]}` : ''))))) : null);
});
