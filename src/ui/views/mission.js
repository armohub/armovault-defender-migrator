// A mission: one workstream as a short checklist. Same records as the step pages; Details opens the full step.
// Beside it, the journey rail shows how far you are across every mission, with a milestone per stage.
import { h, icon, celebrate, celebrating } from '../dom.js';
import { state, mutate } from '../../app/store.js';
import { route, render, go, nudgeSave } from '../shell.js';
import { applicabilityMap } from '../../core/applicability.js';
import { effectiveStatus } from '../../core/readiness.js';
import { missionOf, nextMission, firstOpenRow, journey, holdsSignOff, DONE_STATUSES } from '../../core/missions.js';
import { setWorkstreamOwners, setShowExtras, workstreamKey, gateWarnings, moveSignedOff } from '../../core/model.js';
import { btn, linkBtn, emptyState, infoTip, gateWarningCallouts } from '../components.js';
import { actionsFor } from '../step-actions.js';
import { changeAnswer } from './questionnaire.js';
import { checkRow } from '../checkrow.js';
import { celebrateMigration } from '../finale.js';
import { questionImportance, IMPORTANCE } from '../../core/depth.js';
import { peopleList, personPicker } from '../tools.js';
import { rich } from '../rich.js';
import { revokeObjectUrls } from './work.js';

const openByMission = new Map(); // mission key -> open check id, remembered while you move around
const seenComplete = new Map(); // mission key -> complete when last shown, so finishing one is celebrated once

function journeyRail(j, currentKey) {
  return h('aside', { class: 'journey-rail', 'aria-label': 'Your progress across all missions' },
    h('div', { class: 'rail-head' },
      h('div', { class: 'rail-pct tnum' }, String(j.pct), h('small', null, '%')),
      h('div', { class: 'small muted' }, `of all checks done`, h('br'), h('span', { class: 'tnum' }, `${j.missionsDone} of ${j.missions} missions complete`))),
    h('div', { class: 'rail-bar', role: 'presentation' }, h('span', { style: { width: `${j.pct}%` } })),
    h('ol', { class: 'rail-stages' }, j.stages.map((st) => h('li', { class: ['rail-stage', st.complete && 'done'] },
      h('div', { class: 'rail-milestone' }, h('span', { class: 'rail-flag', 'aria-hidden': 'true' }, icon(st.complete ? 'check' : 'flag', 'icon-xs')), h('strong', null, st.stage.short), h('span', { class: 'small muted tnum' }, `${st.missions.filter((m) => m.complete).length} of ${st.missions.length}`)),
      h('ol', { class: 'rail-missions' }, st.missions.map((m) => h('li', { class: ['rail-mission', m.complete && 'done', m.key === currentKey && 'current'] },
        h('a', { href: `#/mission/${m.stage}/${m.workstream}`, 'aria-current': m.key === currentKey ? 'step' : null, 'aria-label': `${m.title}: ${m.total ? `${m.done} of ${m.total} done` : 'nothing to do'}${m.questions.length ? `, ${m.questions.length} question${m.questions.length === 1 ? '' : 's'} open` : ''}` },
          h('span', { class: 'rail-dot', 'aria-hidden': 'true' }, m.complete ? icon('check', 'icon-xs') : null),
          h('span', { class: 'rail-label', 'aria-hidden': 'true' }, m.title, m.questions.length ? h('small', { class: 'rail-q' }, `${m.questions.length} question${m.questions.length === 1 ? '' : 's'} open`) : null),
          m.total ? h('span', { class: 'rail-count tnum', 'aria-hidden': 'true' }, `${m.done}/${m.total}`) : null))))))));
}

// One question that decides which checks apply here, with help to answer it.
function missionQuestion(q, kb) {
  const help = q.why || q.help ? infoTip({ key: `mq-${q.id}`, title: 'Help me answer this', label: `Help with: ${q.text}` },
    q.detail ? h('p', null, q.detail) : null,
    q.help ? h('div', null, h('strong', null, 'Where to find the answer'), h('p', null, rich(q.help, { kb }))) : null,
    q.why ? h('div', null, h('strong', null, 'Why we ask'), h('p', null, rich(q.why, { kb }))) : null) : null;
  return h('div', { class: 'mq' },
    h('div', { class: 'mq-head' }, h('span', { class: ['chip', 'q-imp', `imp-${questionImportance(kb, state.project, q)}`] }, IMPORTANCE[questionImportance(kb, state.project, q)] || 'Optional'), h('p', { class: 'mq-text' }, q.text), help),
    q.detail ? h('p', { class: 'small muted mq-detail' }, q.detail) : null,
    h('div', { class: 'row-actions' },
      btn('Yes', () => changeAnswer(q, 'yes'), { small: true }),
      btn('No', () => changeAnswer(q, 'no'), { small: true }),
      btn('Not sure yet', () => changeAnswer(q, 'unknown'), { small: true, kind: 'ghost' })));
}

async function celebrateMission(kb, m, j, next) {
  // The step that finished the mission already celebrates (the sign-off, the change outcome): one card, not two.
  if (celebrating()) return;
  // The last mission done, with the move signed off: that is the end of the route.
  if (holdsSignOff(m) && moveSignedOff(state.project)) { celebrateMigration(); return; }
  const stage = j.stages.find((x) => x.stage.id === m.stage);
  const stageDone = stage && stage.complete;
  const nextHref = next ? `#/mission/${next.stage}/${next.workstream}` : '#/report/final';
  const choice = await celebrate({
    title: stageDone ? `${stage.stage.short} is complete` : 'Mission complete',
    text: stageDone ? `You finished every mission in ${stage.stage.short}, ending with "${m.title}". That is a real milestone.` : `"${m.title}" is done. ${j.missionsDone} of ${j.missions} missions complete, ${j.pct}% of all checks.`,
    milestone: stageDone,
    actions: [
      { label: 'Stay here', value: 'stay' },
      { label: next ? `Next: ${next.title}` : 'Open the final report', kind: 'primary', value: 'next' },
    ],
  });
  if (choice === 'next') go(nextHref);
  nudgeSave(`"${m.title}" is done.`);
}

route('mission', ({ params }) => {
  revokeObjectUrls();
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
  const ownerInput = h('label', { class: 'owner-chip' }, h('span', { class: 'small muted' }, 'Owner'), personPicker({ value: owner, cls: 'owner-chip-input', placeholder: 'Not set', label: `Owner of ${m.title}`, focusKey: `mowner-${m.key}`,
    onChange: (v) => mutate((pr) => setWorkstreamOwners(pr, { ...(pr.meta.workstreamOwners || {}), [key]: v })) }));
  const next = nextMission(kb, p, appMap);
  const j = journey(kb, p, appMap);
  const showExtras = p.meta.showExtras !== false;
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 100;

  // Finishing the last check of a mission is worth a moment. Only when it happens here, not on arrival.
  const complete = m.complete && m.total > 0;
  if (seenComplete.get(m.key) === false && complete) setTimeout(() => celebrateMission(kb, m, j, next), 60);
  seenComplete.set(m.key, complete);

  return h('div', { class: 'page mission-page' },
    peopleList(),
    h('div', { class: 'mission-layout' },
      h('div', { class: 'mission-main' },
        h('nav', { class: 'breadcrumb', 'aria-label': 'Where this mission belongs' }, h('a', { href: '#/overview' }, 'Overview'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', null, stage.short)),
        gateWarningCallouts(gateWarnings(kb, p, { stage: m.stage, workstream: m.workstream })),
        h('div', { class: 'mission-head' },
          h('div', null,
            h('h1', { id: 'page-title', tabindex: '-1' }, m.title),
            h('p', { class: 'lede' }, m.purpose)),
          h('div', { class: 'mission-meta' },
            h('div', { class: 'mission-count tnum' }, h('strong', null, String(m.done)), ` of ${m.total} done`),
            h('div', { class: 'mission-bar', role: 'presentation' }, h('span', { style: { width: `${pct}%` } })),
            ownerInput)),
        m.questions.length ? h('section', { class: 'mission-questions', 'aria-label': 'Questions for this mission' },
          h('p', { class: 'small muted' }, `Answer ${m.questions.length === 1 ? 'this question' : `these ${m.questions.length} questions`} first: ${m.questions.length === 1 ? 'it decides' : 'they decide'} which checks below apply to you. Not sure? Open the ⓘ for where to look.`),
          m.questions.map((q) => missionQuestion(q, kb))) : null,
        m.total ? h('ul', { class: 'crow-list' }, m.needed.map(rowFor)) : h('p', { class: 'mission-empty' }, 'Nothing to do here: your answers set these checks aside.'),
        m.complete && m.total ? h('div', { class: 'mission-done', role: 'status' }, icon('check', 'icon-sm'), h('span', null, 'Mission done.'),
          next ? linkBtn(`Next: ${next.title}`, `#/mission/${next.stage}/${next.workstream}`, { kind: 'primary', iconName: 'arrow', small: true }) : linkBtn('Back to the overview', '#/overview', { small: true })) : null,
        m.extras.length ? h('section', { class: 'mission-extras' },
          h('div', { class: 'row' }, h('h2', null, 'Good-practice extras'), infoTip({ key: 'extras', title: 'Good-practice extras' }, h('p', null, 'Good practice that Microsoft does not require for the move. They never count against your progress or readiness. Do them when they help you, or hide them with the switch.')), h('span', { class: 'small muted' }, 'Good practice, not needed for the move.'),
            h('label', { class: 'toggle small' }, h('input', { type: 'checkbox', checked: showExtras, 'data-focus-key': 'show-extras', onchange: (e) => mutate((pr) => setShowExtras(pr, e.target.checked)) }), 'Show')),
          showExtras ? h('ul', { class: 'crow-list' }, m.extras.map(rowFor)) : null) : null,
        m.setAside.length ? h('details', { class: 'disclose mission-aside' }, h('summary', null, icon('chevron', 'icon-sm'), `Set aside by your answers or your plan (${m.setAside.length})`),
          h('ul', { class: 'bullets small' }, m.setAside.map((r) => h('li', null, r.check.short.title, h('span', { class: 'muted' }, r.app.reasons[0] ? `: ${r.app.reasons[0]}` : ''))))) : null),
      journeyRail(j, m.key)));
});
