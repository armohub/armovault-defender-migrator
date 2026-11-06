// Project overview (the next step, the route and the "Start here" guide) and the stage pages.
import { h, icon, toast, modal, field } from '../dom.js';
import { state, mutate } from '../../app/store.js';
import { route, render, freshRoute, savePackageFlow } from '../shell.js';
import { applicabilityMap, evaluateApplicability, questionIndex, upfrontQuestions } from '../../core/applicability.js';
import { assessStage, summariseStage, dependencyStatus, CONCLUSION_CRITERIA, effectiveStatus } from '../../core/readiness.js';
import { setTestAvailability, effectiveOwner, setGuidance, gateWarnings, APPROVED_DECISIONS, decisionLabel } from '../../core/model.js';
import { missionsForStage, nextMission } from '../../core/missions.js';
import { statusPill, tierBadge, gateWarningCallouts, kindChip, applicabilityChip, progressBar, conclusionBadge, callout, emptyState, btn, linkBtn, daysUntil, infoTip } from '../components.js';
import { formatDate } from '../../core/util.js';
import { importInventoryFlow } from '../inventory.js';
import { routeView, routeModel } from '../route.js';
import { rich, plain } from '../rich.js';
import { autosaveEnabled } from '../../app/store.js';

const objectUrls = new Set();
// Released a moment later, not at once: an image of the page being replaced may still be loading its URL.
export function revokeObjectUrls() { const old = [...objectUrls]; objectUrls.clear(); if (old.length) setTimeout(() => old.forEach((u) => URL.revokeObjectURL(u)), 3000); }
// Object URLs created for thumbnails are released on the next page render.
export function trackUrl(blob) { const u = URL.createObjectURL(blob); objectUrls.add(u); return u; }

export const OPEN_STATUSES = new Set(['not_started', 'in_progress', 'needs_review']);
const stageById = (id) => state.kb.stages.find((s) => s.id === id);

// Steps of a stage in reading order: workstream order, then the step's own order.
export function orderedStageItems(kb, stageId) {
  const wsIndex = (c) => kb.workstreams.findIndex((w) => w.stage === c.stage && w.id === c.workstream);
  return kb.checks.filter((x) => x.stage === stageId).sort((x, y) => (wsIndex(x) - wsIndex(y)) || x.order - y.order);
}

const testActive = (p) => p.stages.test.availability === 'available';

// The guided next step: the first untouched in-scope step, in reading order, of the first unfinished stage.
// Steps never block each other: a step parked as "in progress" (for example waiting for a meeting) is
// skipped in favour of the next untouched one, and suggested again once nothing else is left.
export function guidedNext(kb, p, appMap, { skip = null } = {}) {
  const pass = (wanted) => {
    for (const s of kb.stages) {
      if (s.id === 'test' && !testActive(p)) continue;
      for (const c of orderedStageItems(kb, s.id)) {
        if (c.id === skip) continue;
        const app = appMap.get(c.id);
        if (app.value === 'not_applicable') continue;
        if (c.scope === 'extra') continue; // good practice: listed, never suggested as the next step
        if (wanted.has(effectiveStatus(p, c.id))) return { stage: s, check: c, app };
      }
    }
    return null;
  };
  return pass(new Set(['not_started'])) || pass(OPEN_STATUSES);
}

// Questions shown in this project (follow-ups appear only when their parent answer asks for them).
export { visibleQuestions } from '../../core/applicability.js';

// The first stop of the route: setting up the project and answering the questions.
function planFact(kb, p) {
  const setupDone = !!(p.meta.name && p.meta.operatorName);
  const qs = p.mode === 'tailored' ? upfrontQuestions(kb, p) : [];
  const answered = qs.filter((q) => p.answers[q.id]).length;
  const done = setupDone && answered >= qs.length;
  return { id: 'plan', name: 'Plan', assessed: (setupDone ? 1 : 0) + answered, inScope: 1 + qs.length, skipped: false, gateDone: true, href: p.mode === 'tailored' ? '#/answers' : '#/project', meta: done ? 'done' : (qs.length ? `${answered} of ${qs.length} questions` : 'project setup') };
}

// How far along the route you are. Each part weighs what it usually takes; the optional test stage counts only when used.
const ROUTE_WEIGHT = { plan: 10, prepare: 40, test: 10, transition: 20, validate: 20 };
function routePercent(parts) {
  let w = 0; let got = 0;
  for (const f of parts) {
    const weight = ROUTE_WEIGHT[f.id] || 0;
    w += weight;
    got += weight * (f.inScope ? Math.min(1, f.assessed / f.inScope) : 1);
  }
  return w ? Math.round((got / w) * 100) : 0;
}

function stageFacts(kb, p, appMap) {
  return kb.stages.map((s) => {
    const sum = summariseStage(kb, p, s.id, appMap);
    const gates = kb.checks.filter((c) => c.stage === s.id && c.kind === 'gate' && appMap.get(c.id).value !== 'not_applicable');
    const gateDone = gates.every((g) => p.gates[g.id] && APPROVED_DECISIONS.has(p.gates[g.id].decision));
    const open = gates.find((g) => !(p.gates[g.id] && APPROVED_DECISIONS.has(p.gates[g.id].decision)));
    const gateNote = open ? (p.gates[open.id] ? `Gate: ${decisionLabel(p.gates[open.id].decision)}` : 'Gate decision to record') : '';
    const skipped = s.id === 'test' && p.stages.test.availability === 'unavailable';
    return { id: s.id, name: s.short, assessed: sum.counts.assessed, inScope: sum.counts.inScope, skipped, gateDone, gateNote, href: `#/stage/${s.id}`, sum };
  });
}

let whyOpen = false;

// One mission in a list: status, title, attention, count and progress. "next" is highlighted.
function missionRowView(m, next) {
  return h('li', { class: ['mission-row', m.complete && 'done', next && m.key === next.key && 'current'] },
    h('a', { href: `#/mission/${m.stage}/${m.workstream}` },
      h('span', { class: 'status-ic' }, icon(m.complete ? 'check' : m.done ? 'half' : 'circle', 'icon-xs')),
      h('span', { class: 'mission-row-title' }, m.title),
      m.attention ? h('span', { class: 'chip chip-bad' }, `${m.attention} need${m.attention === 1 ? 's' : ''} attention`) : h('span'),
      h('span', { class: 'mission-row-count tnum' }, m.total ? `${m.done} of ${m.total}` : 'nothing to do'),
      h('span', { class: 'mission-bar', role: 'presentation' }, h('span', { style: { width: `${m.total ? Math.round((m.done / m.total) * 100) : 100}%` } }))));
}

// Simplified or Detailed: a view only, switchable any time. Records stay as they are.
export function guidanceSwitch() {
  const p = state.project;
  const opt = (id, label) => h('button', { type: 'button', class: ['seg-btn', p.guidance === id && 'active'], 'aria-pressed': p.guidance === id ? 'true' : 'false', 'data-focus-key': `guidance-${id}`, onclick: () => { mutate((pr) => setGuidance(pr, id)); } }, label);
  return h('div', { class: 'guidance-wrap' },
    h('div', { class: 'seg-group guidance-switch', role: 'group', 'aria-label': 'How the plan is shown' }, opt('simple', 'Simplified'), opt('detailed', 'Detailed')),
    infoTip({ key: 'guidance', title: 'Simplified or Detailed' }, h('p', null, 'Simplified shows missions with short checklists. Detailed shows every step in full, with background and sources. Your records, proofs and decisions are the same in both, and you can switch at any time.')));
}

// The questions asked at the start, while some are still open: a clear way back, so none get lost.
function openQuestionsCallout(kb, p) {
  if (p.mode !== 'tailored') return null;
  const qs = upfrontQuestions(kb, p);
  const open = qs.filter((q) => !p.answers[q.id]);
  if (!open.length) return null;
  return h('div', { class: 'callout callout-info open-questions' }, icon('question', 'icon-sm'),
    h('div', null, h('strong', null, `${open.length} of ${qs.length} setup question${qs.length === 1 ? '' : 's'} still open.`), ' Their steps stay in your plan until you answer. Answering takes a minute and keeps only what applies to you.'),
    linkBtn('Continue the questions', `#/questionnaire/q/${open[0].id}`, { kind: 'primary', small: true, iconName: 'arrow' }));
}

// ───────────────────────────── Overview ─────────────────────────────
route('overview', () => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const appMap = applicabilityMap(kb, p);
  const facts = stageFacts(kb, p, appMap);
  const plan = planFact(kb, p);
  const model = routeModel(kb, [plan, ...facts]);
  const counted = facts.filter((f) => !f.skipped && (f.id !== 'test' || testActive(p)));
  const inScope = counted.reduce((a, f) => a + f.inScope, 0);
  const assessed = counted.reduce((a, f) => a + f.assessed, 0);
  const pct = routePercent([plan, ...counted]);
  if (p.guidance === 'simple') {
    const nm = nextMission(kb, p, appMap);
    const activeStage = nm ? nm.stage : 'validate';
    const stages = kb.stages.filter((s) => s.id !== 'test' || testActive(p));
    const missionRow = (m) => missionRowView(m, nm);
    const justPlannedSimple = state.ui.justPlanned;
    state.ui.justPlanned = false;
    return h('div', { class: 'page' },
      justPlannedSimple ? callout('good', 'Your plan is ready.', ' Start with the mission below. More questions come up in the missions they affect.') : openQuestionsCallout(kb, p),
      h('section', { class: 'next-panel', 'aria-label': 'Your next mission' },
        h('div', { class: 'next-head' },
          h('div', null,
            h('h1', { id: 'page-title', tabindex: '-1' }, nm ? nm.title : 'Every mission is done'),
            h('div', { class: 'next-context' }, h('span', null, 'Your next mission'), nm ? [h('span', { class: 'sep' }, '·'), h('span', null, kb.stages.find((s) => s.id === nm.stage).short), h('span', { class: 'sep' }, '·'), h('span', { class: 'tnum' }, `${nm.done} of ${nm.total} done`)] : null),
            h('p', { class: 'objective-lead' }, nm ? nm.purpose : 'Review the conclusions and share the final report.'),
            h('div', { class: 'next-actions' },
              nm ? linkBtn(`Continue: ${nm.title}`, `#/mission/${nm.stage}/${nm.workstream}`, { kind: 'primary', iconName: 'arrow' }) : linkBtn('Open the final report', '#/report/final', { kind: 'primary', iconName: 'reports' }))),
          h('div', { class: 'journey-figure' }, h('div', { class: 'big', 'aria-label': `${pct} percent of your route done` }, String(pct), h('small', null, '%')), h('div', { class: 'cap' }, 'of your route done'))),
        h('div', { class: 'next-route' }, routeView({ ...model, animate: freshRoute, key: 'overview', label: 'Your route from the Azure portal to the Defender portal' }))),
      ...stages.map((s) => {
        const ms = missionsForStage(kb, p, s.id, appMap);
        const doneCount = ms.filter((m) => m.complete).length;
        return h('details', { class: 'card disclose stage-missions', open: s.id === activeStage || null },
          h('summary', null, icon('chevron', 'icon-sm'), h('strong', null, s.short), h('span', { class: 'small muted tnum' }, `${doneCount} of ${ms.length} missions done`)),
          h('ul', { class: 'mission-list' }, ms.map(missionRow)));
      }));
  }
  const planDone = plan.meta === 'done';
  const next = guidedNext(kb, p, appMap);
  if (freshRoute) whyOpen = false;

  const justPlanned = state.ui.justPlanned;
  state.ui.justPlanned = false;

  let hero;
  if (next) {
    const c = next.check;
    const ws = kb.workstreams.find((w) => w.stage === c.stage && w.id === c.workstream);
    const deps = (c.dependsOn || []).length ? dependencyStatus(kb, p, c, appMap) : null;
    const reasons = [
      `It is the next open step in ${next.stage.short}, in the order this work is usually done.`,
      c.criticality === 'critical' || c.criticality === 'high' ? `It is marked ${c.criticality}: it can block your readiness if it is left open.` : null,
      deps ? (deps.problems.length || deps.pending.length ? `It builds on earlier steps that are still open, so you may want to check those first.` : 'Everything it builds on already has an outcome.') : null,
      next.app.value === 'unknown' ? 'Your answers left it uncertain, so doing it also confirms whether it applies to you.' : null,
    ].filter(Boolean);
    hero = h('div', { class: 'next-head' },
      h('div', null,
        h('h1', { id: 'page-title', tabindex: '-1' }, c.title),
        h('div', { class: 'next-context' }, h('span', null, 'Your next step'), h('span', { class: 'sep' }, '·'), h('span', null, next.stage.short), ws ? [h('span', { class: 'sep' }, '·'), h('span', null, ws.title)] : null, h('span', { class: 'sep' }, '·'), tierBadge(c)),
        h('p', { class: 'objective-lead' }, plain(c.objective, kb)),
        whyOpen ? h('div', { class: 'next-why', id: 'why-next' }, h('ul', { class: 'bullets', style: { margin: 0 } }, reasons.map((r) => h('li', null, r)))) : null,
        h('div', { class: 'next-actions' },
          h('a', { href: `#/item/${c.id}`, class: 'btn btn-primary btn-lg', 'data-focus-key': 'start-step' }, 'Start this step', icon('arrow', 'icon-sm')),
          h('button', { type: 'button', class: 'btn btn-lg btn-quiet', 'aria-expanded': whyOpen ? 'true' : 'false', 'aria-controls': 'why-next', 'data-focus-key': 'why-next', onclick: () => { whyOpen = !whyOpen; render(); } }, whyOpen ? 'Hide the reason' : 'Why this one?'))),
      h('div', { class: 'journey-figure' }, h('div', { class: 'big', 'aria-label': `${pct} percent of your route done` }, String(pct), h('small', null, '%')), h('div', { class: 'cap' }, 'of your route done'), h('div', { class: 'cap' }, planDone ? 'Plan done' : 'Plan in progress', ', ', h('span', { class: 'tnum' }, `${assessed} of ${inScope} steps`))));
  } else {
    hero = h('div', { class: 'next-head' },
      h('div', null,
        h('h1', { id: 'page-title', tabindex: '-1' }, 'Every step on your route has an outcome'),
        h('p', { class: 'objective-lead' }, 'Review the conclusions, record the last decisions, and share the final report.'),
        h('div', { class: 'next-actions' }, linkBtn('Open the final report', '#/report/final', { kind: 'primary', iconName: 'reports' }), linkBtn('Review decisions and risks', '#/register'))),
      h('div', { class: 'journey-figure' }, h('div', { class: 'big' }, '100', h('small', null, '%')), h('div', { class: 'cap' }, 'of your route done')));
  }

  return h('div', { class: 'page' },
    justPlanned ? callout('good', 'Your plan is ready.', ' Start with the step below. The "Start here" list shows what comes after it, and the route shows where you are.') : openQuestionsCallout(kb, p),
    h('section', { class: 'next-panel', 'aria-label': 'Your next step' }, hero,
      h('div', { class: 'next-route' }, routeView({ ...model, animate: freshRoute, key: 'overview', label: 'Your route from the Azure portal to the Defender portal' }))),
    h('div', { class: 'overview-grid' },
      h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Start here'), guideList(kb, p, appMap, facts, next)),
      h('div', { class: 'stack' },
        h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Needs your attention'), attentionList(kb, p, appMap)),
        parkedList(kb, p, appMap),
        h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Good to know'), keyFacts(p)))),
    h('details', { class: 'card disclose' }, h('summary', null, icon('chevron', 'icon-sm'), `Recent activity (${Math.min(12, p.audit.length)})`),
      h('ul', { class: 'activity', style: { marginTop: '10px' } }, p.audit.slice(-12).reverse().map((a) => h('li', null, h('time', null, formatDate(a.at, true)), h('span', null, a.detail, h('span', { class: 'muted' }, `, ${a.by}`)))))));
});

function guideList(kb, p, appMap, facts, next) {
  const qs = upfrontQuestions(kb, p);
  const answered = qs.filter((q) => p.answers[q.id]).length;
  const f = Object.fromEntries(facts.map((x) => [x.id, x]));
  const stageDone = (id) => f[id].inScope > 0 && f[id].assessed >= f[id].inScope;
  const gateOf = (stageId) => kb.checks.find((c) => c.stage === stageId && c.kind === 'gate' && appMap.get(c.id).value !== 'not_applicable');
  const prepGate = gateOf('prepare');
  const finalGate = gateOf('validate');
  const gateRecorded = (g) => g && p.gates[g.id] && APPROVED_DECISIONS.has(p.gates[g.id].decision);
  const firstOpenIn = (stageId) => { const list = orderedStageItems(kb, stageId).filter((x) => appMap.get(x.id).value !== 'not_applicable'); const c = list.find((x) => effectiveStatus(p, x.id) === 'not_started') || list.find((x) => OPEN_STATUSES.has(effectiveStatus(p, x.id))); return c ? `#/item/${c.id}` : `#/stage/${stageId}`; };
  const rows = [
    { t: 'Set up your project', d: p.meta.windowStart ? `Planned window ${p.meta.windowStart}${p.meta.windowEnd ? ` to ${p.meta.windowEnd}` : ''}` : 'Add your planned transition window', done: !!(p.meta.name && p.meta.operatorName && p.meta.windowStart), href: p.meta.windowStart ? '#/project' : '#/project/window', go: p.meta.windowStart ? 'Edit' : 'Add it' },
    p.mode === 'tailored'
      ? { t: 'Answer the questions', d: `${answered} of ${qs.length} answered`, done: answered >= qs.length, href: answered ? '#/answers' : '#/questionnaire', go: answered >= qs.length ? 'Review' : 'Continue' }
      : { t: 'Using the full checklist', d: 'No questions needed. You decide what applies as you go.', done: true, href: '#/questionnaire', go: 'Tailor instead' },
    { t: 'Work through Prepare', d: `${f.prepare.assessed} of ${f.prepare.inScope} steps checked`, done: stageDone('prepare'), href: firstOpenIn('prepare'), go: 'Continue' },
    { t: 'Record the readiness decision', d: gateRecorded(prepGate) ? 'Recorded' : 'Who decided to go ahead, and on what basis', done: gateRecorded(prepGate), href: prepGate ? `#/item/${prepGate.id}` : '#/stage/prepare', go: 'Open' },
    { t: 'Decide on a test run (optional)', d: { undecided: 'Is a suitable test environment available?', available: `${f.test.assessed} of ${f.test.inScope} test steps checked`, unavailable: 'Skipped, with a reason' }[p.stages.test.availability], done: p.stages.test.availability === 'unavailable' || (testActive(p) && stageDone('test')), href: '#/stage/test', go: 'Open' },
    { t: 'Make the change', d: `${f.transition.assessed} of ${f.transition.inScope} runbook steps done`, done: stageDone('transition'), href: firstOpenIn('transition'), go: 'Open' },
    { t: 'Validate and sign off', d: gateRecorded(finalGate) ? 'Signed off' : `${f.validate.assessed} of ${f.validate.inScope} checks done`, done: stageDone('validate') && gateRecorded(finalGate), href: firstOpenIn('validate'), go: 'Open' },
    { t: 'Share the final report', d: 'Built from your records, ready to print or save as PDF', done: false, href: '#/report/final', go: 'Open' },
  ];
  let nowSet = false;
  return h('ol', { class: 'guide' }, rows.map((r, i) => {
    let cls = 'later';
    if (r.done) cls = 'done'; else if (!nowSet) { cls = 'now'; nowSet = true; }
    return h('li', { class: cls },
      h('span', { class: 'guide-dot', 'aria-hidden': 'true' }, cls === 'done' ? icon('check', 'icon-xs') : String(i + 1)),
      h('div', { class: 'guide-text' }, h('b', null, r.t), h('span', null, r.d), h('span', { class: 'sr-only' }, cls === 'done' ? ' (done)' : cls === 'now' ? ' (do this now)' : '')),
      cls === 'later' ? null : h('a', { href: r.href, class: 'guide-go' }, cls === 'now' ? [r.go, icon('chevron', 'icon-xs')] : r.go));
  }));
}

function attentionList(kb, p, appMap) {
  const rows = [];
  for (const s of kb.stages) {
    const sum = summariseStage(kb, p, s.id, appMap);
    for (const i of sum.inScope) {
      const crit = i.check.criticality === 'critical' || i.check.criticality === 'high';
      if ((i.status === 'failed' || i.status === 'blocked') && crit) rows.push({ href: `#/item/${i.check.id}`, t: i.check.title, pill: i.status === 'failed' ? 'Failed' : 'Blocked', tone: i.status === 'failed' ? 'bad' : 'caution' });
      else if (i.status === 'needs_review') rows.push({ href: `#/item/${i.check.id}`, t: i.check.title, pill: 'Needs review', tone: 'caution' });
    }
  }
  for (const r of p.register.filter((x) => ['critical', 'high'].includes(x.severity) && !['done', 'closed', 'accepted'].includes(x.status))) {
    rows.push({ href: '#/register', t: r.title, pill: `${r.type[0].toUpperCase()}${r.type.slice(1)}, ${r.severity}`, tone: 'accent' });
  }
  if (!rows.length) return h('p', { class: 'quiet-empty' }, icon('check'), 'Nothing is failed, blocked or waiting for review right now.');
  return h('div', null,
    rows.slice(0, 7).map((r) => h('div', { class: 'attention-row' }, h('a', { href: r.href }, r.t), h('span', { class: ['state-pill', `tone-${r.tone}`] }, r.pill))),
    rows.length > 7 ? h('p', { class: 'small muted', style: { marginTop: '10px' } }, `And ${rows.length - 7} more. Use the "Needs attention" filter on each stage.`) : null);
}

// Steps left for later with "Leave for now" (or set to in progress): nothing blocks, but nothing is forgotten either.
function parkedList(kb, p, appMap) {
  const rows = [];
  for (const s of kb.stages) for (const c of orderedStageItems(kb, s.id)) {
    if (appMap.get(c.id).value === 'not_applicable' || effectiveStatus(p, c.id) !== 'in_progress') continue;
    const owner = effectiveOwner(p, c).name;
    rows.push(h('div', { class: 'attention-row' }, h('a', { href: `#/item/${c.id}` }, c.title), h('span', { class: 'small muted' }, owner || s.short)));
  }
  if (!rows.length) return null;
  return h('section', { class: 'card' }, h('h2', { class: 'card-title' }, `Parked for later (${rows.length})`), h('p', { class: 'small muted', style: { marginTop: '-4px' } }, 'In progress, waiting on someone or something. Pick them up any time.'), ...rows.slice(0, 8), rows.length > 8 ? h('p', { class: 'small muted' }, `And ${rows.length - 8} more.`) : null);
}

function keyFacts(p) {
  const days = daysUntil('2027-03-31');
  const saved = p.isDemo ? 'This is the demo: nothing is saved.' : autosaveEnabled() ? 'Autosave is on, in this browser.' : state.ui.unexported ? 'Not saved yet. Save a project package to keep your work.' : 'No unsaved changes.';
  return h('ul', { class: 'list' },
    h('li', { class: 'list-row' }, h('span', null, 'Azure portal support for Sentinel ends'), h('b', { class: 'tnum' }, days > 0 ? `31 March 2027, in ${days} days` : '31 March 2027 (passed)')),
    h('li', { class: 'list-row' }, h('span', null, 'Your planned window'), p.meta.windowStart ? h('b', { class: 'tnum' }, `${p.meta.windowStart}${p.meta.windowEnd ? ` to ${p.meta.windowEnd}` : ''}`) : h('a', { href: '#/project/window' }, 'Add it')),
    h('li', { class: 'list-row' }, h('span', null, saved), !p.isDemo && !autosaveEnabled() ? h('button', { type: 'button', class: 'btn btn-sm', onclick: savePackageFlow }, icon('save', 'icon-sm'), 'Save package') : h('a', { href: '#/settings' }, 'Settings')));
}

// ───────────────────────────── Stage page ─────────────────────────────
const stageFilters = new Map(); // stageId -> { filter, query }
const needsAttention = (i) => i.inScope && (['failed', 'blocked', 'needs_review', 'not_verified'].includes(i.status) || (i.app.value === 'unknown' && i.status === 'not_started'));

route('stage', ({ params }) => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const stage = stageById(params[0]) || kb.stages[0];
  const appMap = applicabilityMap(kb, p);
  const a = assessStage(kb, p, stage.id, appMap);
  const f = stageFilters.get(stage.id) || { filter: 'inscope', query: '' };
  stageFilters.set(stage.id, f);

  const matches = (i) => {
    if (f.query) {
      const q = f.query.toLowerCase();
      if (!(`${i.check.title} ${plain(i.check.objective, kb)}`.toLowerCase().includes(q))) return false;
    }
    if (f.filter === 'inscope') return i.inScope;
    if (f.filter === 'attention') return needsAttention(i);
    if (f.filter === 'na') return !i.inScope;
    return true;
  };
  const order = orderedStageItems(kb, stage.id).map((c) => c.id);
  const groups = kb.workstreams.filter((w) => w.stage === stage.id).map((w) => ({ w, items: a.summary.items.filter((i) => i.check.workstream === w.id && matches(i)).sort((x, y) => order.indexOf(x.check.id) - order.indexOf(y.check.id)) })).filter((g) => g.items.length);

  const filterBtn = (id, label, count) => h('button', { type: 'button', class: ['seg-btn', f.filter === id && 'active'], 'aria-pressed': f.filter === id ? 'true' : 'false', onclick: () => { f.filter = id; render(); } }, label, h('span', { class: 'seg-count' }, String(count)));
  const counts = {
    inscope: a.summary.items.filter((i) => i.inScope).length,
    attention: a.summary.items.filter(needsAttention).length,
    na: a.summary.items.filter((i) => !i.inScope).length,
    all: a.summary.items.length,
  };
  const c = a.summary.counts;
  let seq = 0;
  if (p.guidance === 'simple') {
    const nm = nextMission(kb, p, appMap);
    const ms = missionsForStage(kb, p, stage.id, appMap);
    return h('div', { class: 'page' },
      gateWarningCallouts(gateWarnings(kb, p, { stage: stage.id })),
      h('div', { class: 'stage-head' },
        h('div', null,
          h('h1', { id: 'page-title', tabindex: '-1' }, stage.title),
          h('p', { class: 'lede' }, stage.purpose),
          h('p', { class: 'small muted tnum', style: { marginTop: '8px' } }, `${ms.filter((m) => m.complete).length} of ${ms.length} missions done. ${c.assessed} of ${c.inScope} checks done.`)),
        h('div', { class: 'page-actions' },
          linkBtn(`Open the ${stage.deliverable.toLowerCase()}`, `#/report/${stage.reportKind}`, { iconName: 'reports', small: true }))),
      stage.id === 'test' ? testAvailabilityPanel(appMap) : null,
      conclusionPanel(a),
      h('section', { class: 'card stage-missions' }, h('ul', { class: 'mission-list' }, ms.map((m) => missionRowView(m, nm)))));
  }
  return h('div', { class: 'page' },
    gateWarningCallouts(gateWarnings(kb, p, { stage: stage.id })),
    h('div', { class: 'stage-head' },
      h('div', null,
        h('h1', { id: 'page-title', tabindex: '-1' }, stage.title),
        h('p', { class: 'lede' }, stage.purpose),
        h('p', { class: 'small muted tnum', style: { marginTop: '8px' } }, `Stage ${stage.number}${stage.optional ? ', optional' : ''}. ${c.assessed} of ${c.inScope} steps checked.`)),
      h('div', { class: 'page-actions' },
        stage.id === 'prepare' ? btn('Import inventory results', importInventoryFlow, { iconName: 'upload', small: true, title: 'Choose every file the read-only inventory script wrote, workspaces.json included, and review them on one screen' }) : null,
        linkBtn(`Open the ${stage.deliverable.toLowerCase()}`, `#/report/${stage.reportKind}`, { iconName: 'reports', small: true }))),
    stage.id === 'test' ? testAvailabilityPanel(appMap) : null,
    conclusionPanel(a),
    h('div', { class: 'toolbar' },
      h('div', { class: 'seg-group', role: 'group', 'aria-label': 'Filter steps' }, filterBtn('inscope', 'Your steps', counts.inscope), filterBtn('attention', 'Needs attention', counts.attention), filterBtn('na', 'Set aside', counts.na), filterBtn('all', 'All', counts.all)),
      h('label', { class: 'search' }, icon('search', 'icon-sm'), h('span', { class: 'sr-only' }, 'Search steps'), h('input', { type: 'search', placeholder: 'Search this stage', value: f.query, 'data-focus-key': `search-${stage.id}`, oninput: (e) => { f.query = e.target.value; render(); } }))),
    groups.length ? groups.map(({ w, items }) => h('section', { class: 'ws-group' },
      h('h2', { class: 'ws-title' }, w.title,
        h('span', { class: 'ws-count tnum' }, `${items.filter((i) => ['passed', 'not_verified', 'failed', 'not_applicable'].includes(i.status)).length} of ${items.length}`),
        h('span', { class: 'mission-bar ws-bar', role: 'presentation' }, h('span', { style: { width: `${items.length ? Math.round((items.filter((i) => ['passed', 'not_verified', 'not_applicable'].includes(i.status)).length / items.length) * 100) : 0}%` } }))),
      h('ul', { class: 'item-list' }, items.map((i) => { seq += 1; return itemRow(i, appMap, stage.id === 'transition' ? seq : null); }))))
      : emptyState('No steps match this filter.', f.filter === 'na' ? 'Every step applies to your environment.' : 'Try another filter or clear the search.'));
});

function itemRow(i, appMap, seq) {
  const c = i.check;
  const deps = (c.dependsOn || []).length ? dependencyStatus(state.kb, state.project, c, appMap) : null;
  const st = state.project.checks[c.id];
  const depTitle = (list) => list.map((d) => (state.kb.checks.find((x) => x.id === d.id) || {}).title).filter(Boolean).join('\n');
  return h('li', { class: ['item-row', !i.inScope && 'muted-row'] },
    h('a', { href: `#/item/${c.id}`, class: 'item-link' },
      seq ? h('span', { class: 'seq', 'aria-label': `Runbook step ${seq}` }, String(seq)) : null,
      h('span', { class: 'status-cell' }, statusPill(i.status)),
      h('span', { class: 'item-main' },
        h('span', { class: 'item-title' }, c.title),
        h('span', { class: 'item-meta' },
          tierBadge(c),
          c.scope === 'extra' ? h('span', { class: 'chip chip-muted', title: 'Useful, but not needed for the move. It never affects readiness.' }, 'Good practice') : null,
          c.kind !== 'check' ? kindChip(c.kind) : null,
          applicabilityChip(i.app),
          c.validation === 'needs-review' ? h('span', { class: 'chip chip-caution', title: 'Microsoft sources conflict or are unclear here' }, icon('alert', 'icon-xs'), 'Sources differ') : null,
          c.changesState ? h('span', { class: 'chip chip-warn', title: 'Changes configuration in your environment' }, icon('edit', 'icon-xs'), 'Changes configuration') : null,
          deps && deps.problems.length ? h('span', { class: 'chip chip-bad', title: depTitle(deps.problems) }, icon('block', 'icon-xs'), `An earlier step is ${deps.problems[0].status === 'failed' ? 'failed' : 'blocked'}`) : null,
          deps && !deps.problems.length && deps.pending.length ? h('span', { class: 'chip chip-muted', title: depTitle(deps.pending) }, `${deps.pending.length} earlier step${deps.pending.length === 1 ? '' : 's'} open`) : null,
          i.evidence ? h('span', { class: 'chip chip-muted' }, icon('evidence', 'icon-xs'), String(i.evidence)) : null,
          st && st.owner ? h('span', { class: 'small muted' }, icon('user', 'icon-xs'), ' ', st.owner) : null)),
      icon('chevron', 'icon-sm chevron')));
}

function conclusionPanel(a) {
  if (a.level === 'skipped') return null;
  const r = a.reasons;
  const kb = state.kb;
  const linkFor = (x) => (kb.checks.find((c) => c.id === x.id) ? h('a', { href: `#/item/${x.id}` }, x.text) : x.text);
  const list = (title, items) => (items.length ? h('div', null, h('h3', null, `${title} (${items.length})`), h('ul', { class: 'reason-list' }, items.slice(0, 15).map((x) => h('li', null, linkFor(x)))), items.length > 15 ? h('p', { class: 'small muted' }, `And ${items.length - 15} more.`) : null) : null);
  return h('section', { class: 'card conclusion-card' },
    h('div', { class: 'conclusion-row' }, h('div', null, h('div', { class: 'small muted' }, 'Where this stage stands, from your records'), conclusionBadge(a)), progressBar(a.summary.counts)),
    h('details', { class: 'disclose' }, h('summary', null, icon('chevron', 'icon-sm'), 'Why, and how this is decided'),
      list('Blocking', r.blocking), list('Not yet decided', r.undetermined), list('Exceptions and your-word-only steps', r.exceptions), list('Other open steps', r.open),
      h('h3', null, 'How it is decided'), h('ul', { class: 'small' }, CONCLUSION_CRITERIA.map((c) => h('li', null, c))),
      h('p', { class: 'small muted' }, 'A stage is never "ready" just because fields are filled in: critical steps need evidence or a named, accepted exception. The gate decision is always yours.')));
}

function testAvailabilityPanel(appMap) {
  const p = state.project;
  const t = p.stages.test;
  const kb = state.kb;
  const setAvail = async (v) => {
    let reason = '';
    if (v === 'unavailable') {
      const ta = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'For example: no non-production tenant with Sentinel exists' });
      reason = await modal({ title: 'No suitable test environment', body: h('div', { class: 'stack' }, h('p', null, 'Record why. Reports state this and list the extra precautions for the change. You are not penalised for having no test environment, but the production change carries more risk.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('Please enter a reason.', 'bad'), null)) }] });
      if (!reason) return;
    }
    const res = mutate((pr) => setTestAvailability(pr, v, reason));
    if (res && !res.ok) toast(res.error, 'bad');
  };
  const testable = kb.checks.filter((c) => c.stage === 'prepare' && c.testable && appMap.get(c.id).value !== 'not_applicable');
  const controls = ['PREP-CON-04', 'PREP-CON-05', 'TRN-04', 'TRN-01', 'TRN-16', 'PREP-PLN-03'].map((id) => kb.checks.find((c) => c.id === id)).filter(Boolean);
  return h('section', { class: 'card' },
    h('h2', { class: 'card-title' }, 'Is a suitable test environment available?'),
    h('div', { class: 'seg-group', role: 'group', 'aria-label': 'Test environment availability' },
      ['undecided', 'available', 'unavailable'].map((v) => h('button', { type: 'button', class: ['seg-btn', t.availability === v && 'active'], 'aria-pressed': t.availability === v ? 'true' : 'false', onclick: () => setAvail(v) }, { undecided: 'Not decided', available: 'Yes, use the test stage', unavailable: 'No, skip with a reason' }[v]))),
    t.availability === 'unavailable' ? h('div', { style: { marginTop: '14px' } }, callout('caution', 'Test stage skipped.', ` Reason: ${t.reason} (recorded by ${t.decidedBy}, ${formatDate(t.decidedAt)}). Take these precautions in the change instead:`,
      h('ul', null, controls.map((c) => h('li', null, h('a', { href: `#/item/${c.id}` }, c.title)))))) : null,
    t.availability === 'available' ? h('details', { class: 'disclose', open: true, style: { marginTop: '14px' } }, h('summary', null, icon('chevron', 'icon-sm'), `Prepare steps worth testing in your environment (${testable.length})`),
      h('p', { class: 'small muted' }, 'Use these to scope the test plan. Failed or uncertain steps are the best candidates.'),
      h('ul', { class: 'item-list compact' }, testable.map((c) => h('li', { class: 'item-row' }, h('a', { href: `#/item/${c.id}`, class: 'item-link' }, statusPill(effectiveStatus(p, c.id)), h('span', { class: 'item-main' }, h('span', { class: 'item-title' }, c.title)), tierBadge(c)))))) : null);
}

export { rich };
