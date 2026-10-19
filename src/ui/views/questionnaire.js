// The tailoring questionnaire: one question per screen, with section progress, keyboard answers and an
// optional auto-advance. "Your answers" shows every question on one page for review.
import { h, icon, modal, confirmDialog, toast, showSequence, savedPulse } from '../dom.js';
import { state, mutate, updateSettings } from '../../app/store.js';
import { go, route, render, freshRoute } from '../shell.js';
import { setAnswer, ANSWERS, addAudit, addRegisterItem, setTestAvailability } from '../../core/model.js';
import { applicabilityMap, diffApplicability, evaluateApplicability, questionIndex } from '../../core/applicability.js';
import { btn, linkBtn, callout } from '../components.js';
import { formatDate } from '../../core/util.js';
import { rich } from '../rich.js';
import { questionStrip } from '../route.js';

// Questions the read-only inventory script can suggest answers for (see src/core/inventory.js).
const INVENTORY_QS = new Set(['fusion', 'ms_incident_rules', 'alert_only_rules', 'mdc', 'standalone_connectors', 'automation_rules', 'playbooks', 'watchlists', 'ti']);

// What the project already knows that hints at an answer.
function knownHint(q, p) {
  const envs = (p.meta.environments || []).filter((e) => e.alias);
  if (q.id === 'multi_workspace' && envs.length) return envs.length > 1 ? `Your workspace list has ${envs.length} workspaces, which suggests Yes.` : `Your workspace list has 1 workspace. If it is the only one in scope in this tenant, the answer is No.`;
  if (q.id === 'onboarded_any') { const c = envs.filter((e) => e.defender === 'primary' || e.defender === 'secondary').length; if (c) return `Your workspace list shows ${c} connected workspace${c === 1 ? '' : 's'}, which suggests Yes.`; }
  return '';
}

const ANSWER_TEXT = {
  yes: ['Yes', ''],
  no: ['No', ''],
  unknown: ['I don\'t know yet', 'The related steps stay in your plan'],
  na: ['Not applicable', 'Doesn\'t fit us. Counts as No'],
};

function visibleQuestions(kb, p) {
  const qIdx = questionIndex(kb);
  const shown = (q) => !q.showIf || evaluateApplicability({ id: '_', applicability: q.showIf }, { ...p, mode: 'tailored', checks: {} }, kb, qIdx).value !== 'not_applicable';
  return kb.questions.filter(shown);
}

let direction = 'forward';
let advanceTimer = null;
// Whether the question already had an answer when its screen opened (so we only show "Answered by" then,
// and the screen does not change shape the moment you answer).
let openedQ = '';
let openedWithAnswer = false;

// ───────────────────────────── One question per screen ─────────────────────────────
route('questionnaire', ({ params }) => {
  const p = state.project;
  const kb = state.kb;
  if (p.mode === 'full') {
    return h('div', { class: 'page narrow' },
      h('h1', { id: 'page-title', tabindex: '-1' }, 'This project uses the full checklist'),
      h('p', { class: 'lede' }, 'You chose to see every step without tailoring. You can switch to tailoring at any time; your statuses and evidence stay as they are.'),
      h('div', { class: 'row', style: { marginTop: '18px' } }, btn('Tailor my plan instead', async () => {
        if (await confirmDialog({ title: 'Tailor your plan?', message: 'Steps will be marked as applying, not applying or uncertain based on your answers. Nothing you recorded is deleted.', confirmLabel: 'Tailor my plan' })) {
          mutate((pr) => { pr.mode = 'tailored'; addAudit(pr, 'project.mode', 'Switched to tailored mode'); });
          go('#/questionnaire');
        }
      }, { kind: 'primary' }), linkBtn('Back to the overview', '#/overview', { kind: 'ghost' })));
  }
  const qs = visibleQuestions(kb, p);
  const sections = kb.questionSections;
  if (params[0] === 'done') return doneScreen(qs);
  let q = params[0] === 'q' ? qs.find((x) => x.id === params[1]) : null;
  if (!q) {
    const answeredAny = qs.some((x) => p.answers[x.id]);
    const firstOpen = qs.find((x) => !p.answers[x.id]);
    if (!answeredAny) return introScreen(qs);
    if (!firstOpen) return doneScreen(qs);
    setTimeout(() => go(`#/questionnaire/q/${firstOpen.id}`), 0);
    q = firstOpen;
  }
  const i = qs.indexOf(q);
  const prev = qs[i - 1];
  const next = qs[i + 1];
  const sIdx = sections.findIndex((s) => s.id === q.section);
  const section = sections[sIdx];
  const a = p.answers[q.id];
  const firstPaint = freshRoute || openedQ !== q.id;
  if (firstPaint) { openedQ = q.id; openedWithAnswer = !!a; }
  const left = qs.filter((x) => !p.answers[x.id]).length;
  const goNext = () => { direction = 'forward'; go(next ? `#/questionnaire/q/${next.id}` : '#/questionnaire/done'); };
  const goPrev = () => { direction = 'back'; if (prev) go(`#/questionnaire/q/${prev.id}`); };

  const pick = async (value) => {
    clearTimeout(advanceTimer);
    const changed = await changeAnswer(q, value);
    if (changed === false) return;
    savedPulse('Answer recorded');
    if (state.settings.autoAdvance && (value === 'yes' || value === 'no')) {
      advanceTimer = setTimeout(() => { if (location.hash === `#/questionnaire/q/${q.id}`) goNext(); }, 650);
    }
  };

  const onTileKey = (e) => {
    // Arrow keys move between answers; they never answer or move on by themselves.
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const tiles = Array.from(e.currentTarget.querySelectorAll('[role="radio"]'));
    const n = (tiles.indexOf(document.activeElement) + keys[e.key] + tiles.length) % tiles.length;
    tiles.forEach((t, j) => t.setAttribute('tabindex', j === n ? '0' : '-1'));
    tiles[n].focus();
  };
  const tiles = h('div', { class: 'answer-grid', role: 'radiogroup', 'aria-labelledby': 'page-title', onkeydown: onTileKey },
    ANSWERS.map((opt, k) => {
      const checked = a && a.value === opt.id;
      const [label, sub] = ANSWER_TEXT[opt.id];
      return h('button', { type: 'button', role: 'radio', class: 'answer-tile', 'aria-checked': checked ? 'true' : 'false', tabindex: checked || (!a && k === 0) ? '0' : '-1', 'data-answer': opt.id, 'data-focus-key': `ans-${q.id}-${opt.id}`, onclick: () => pick(opt.id) },
        h('span', { class: 'tile-mark', 'aria-hidden': 'true' }, icon('check', 'icon-xs')),
        h('span', null, label, sub ? h('small', null, sub) : null),
        h('span', { class: 'kbd', 'aria-hidden': 'true' }, String(k + 1)));
    }));

  let followUp = null;
  if (a && (a.value === 'unknown' || a.value === 'na')) {
    const input = h('input', { type: 'text', class: 'input-sm', maxlength: '2000', placeholder: a.value === 'na' ? 'Why does this not apply? (recommended)' : 'What needs finding out, and who could answer? (optional)', value: a.reason || '', 'data-focus-key': `reason-${q.id}`, 'aria-label': a.value === 'na' ? 'Reason it does not apply' : 'What needs finding out', oninput: (e) => mutate((pr) => { if (pr.answers[q.id]) pr.answers[q.id].reason = e.target.value.slice(0, 2000); }, { silent: true }) });
    const already = p.register.some((r) => r.questionRef === q.id || r.title === findOutTitle(q));
    followUp = h('div', { class: 'q-followup stack' }, input,
      a.value === 'unknown' ? (already
        ? h('p', { class: 'small muted' }, icon('check', 'icon-xs'), ' A "find out" action for this question is in the ', h('a', { href: '#/register' }, 'register'), '.')
        : h('div', { class: 'row' }, btn('Add a "find out" action to the register', () => {
          mutate((pr) => addRegisterItem(pr, { type: 'action', title: findOutTitle(q), description: [`Question: ${q.text}`, a.reason ? `Notes: ${a.reason}` : '', q.help ? `Where to look: ${q.help}` : ''].filter(Boolean).join('\n'), severity: 'medium', questionRef: q.id }));
          toast('Added to the register. Answer the question here once you know.', 'good');
        }, { small: true, iconName: 'plus' }))) : null);
  }

  const progress = questionStrip({
    sections: sections.map((s) => { const inSec = qs.filter((x) => x.section === s.id); return { title: s.title, done: inSec.length > 0 && inSec.every((x) => p.answers[x.id]), current: s.id === q.section }; }),
    position: qs.length ? (i + 0.5) / qs.length : 0,
  });

  return h('div', { class: 'q-screen' },
    progress,
    h('div', { class: 'q-meta' },
      h('span', null, h('strong', null, section ? section.title : ''), ` · section ${sIdx + 1} of ${sections.length}`),
      left ? h('span', { class: 'tnum' }, `${left} question${left === 1 ? '' : 's'} left`) : h('span', null, 'All answered')),
    h('div', { class: ['q-card', firstPaint && (direction === 'back' ? 'q-back' : 'q-forward')] },
      h('h1', { id: 'page-title', tabindex: '-1' }, q.text),
      q.detail ? h('p', { class: 'q-detail' }, q.detail) : null,
      tiles,
      followUp,
      a && openedWithAnswer ? h('p', { class: 'small muted answer-meta' }, `Answered by ${a.by} on ${formatDate(a.at)}. `, h('button', { type: 'button', class: 'linklike', onclick: () => changeAnswer(q, null) }, 'Clear answer')) : null,
      h('div', { class: 'q-aside' },
        knownHint(q, p) ? h('div', { class: 'q-note q-hint' }, icon('check', 'icon-sm'), h('div', null, h('b', null, 'From what you entered'), knownHint(q, p))) : null,
        INVENTORY_QS.has(q.id) ? h('div', { class: 'q-note q-hint' }, icon('upload', 'icon-sm'), h('div', null, h('b', null, 'The inventory script can answer this'), 'Run the read-only ', h('a', { href: '#/item/PREP-DET-01' }, 'inventory script'), ' and import its results: the assistant suggests answers for this and eight other questions, and you confirm them.')) : null,
        q.why ? h('div', { class: 'q-note' }, icon('sparkle', 'icon-sm'), h('div', null, h('b', null, 'Why we ask'), rich(q.why, { kb }))) : null,
        q.help ? h('div', { class: 'q-note' }, icon('search', 'icon-sm'), h('div', null, h('b', null, 'Where to find the answer'), rich(q.help, { kb }))) : null)),
    h('div', { class: 'q-foot' },
      prev ? btn('Back', goPrev, { iconName: 'back' }) : linkBtn('Back to the overview', '#/overview', { iconName: 'back', kind: 'ghost' }),
      h('button', { type: 'button', class: ['btn', a ? 'btn-primary' : null], onclick: goNext, 'data-focus-key': 'q-next' }, a ? (next ? 'Next question' : 'Finish') : 'Skip for now', icon('arrow', 'icon-sm')),
      h('span', { class: 'spacer' }),
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: state.settings.autoAdvance, onchange: (e) => updateSettings({ autoAdvance: e.target.checked }, { silent: true }) }), 'Move on after Yes or No'),
      h('a', { href: '#/answers', class: 'small' }, 'See all answers')),
    h('p', { class: 'q-keys', style: { marginTop: '12px' } }, icon('keyboard', 'icon-sm'), 'Keys 1 to 4 answer, Enter goes to the next question.'));
});

const findOutTitle = (q) => `Find out: ${q.text}`;

function introScreen(qs) {
  const kb = state.kb;
  return h('div', { class: 'q-screen' },
    h('div', { class: 'q-section-intro' },
      h('h1', { id: 'page-title', tabindex: '-1' }, 'A few questions to tailor your plan'),
      h('p', { class: 'q-detail' }, `About ${qs.length} questions, one per screen, in ${kb.questionSections.length} short sections. Answer what you know: "I don't know yet" is a good answer, and it keeps the related steps in your plan.`),
      h('ol', { class: 'steps', style: { marginTop: '26px' } }, kb.questionSections.map((s) => h('li', null, h('div', { class: 'step-text' }, h('strong', null, s.title)), h('div', { class: 'small muted' }, s.intro)))),
      callout('info', 'Nothing is hidden for good.', ' Steps that do not apply are set aside with the reason, and you can change any answer later in "Your answers".'),
      h('p', { class: 'q-keys', style: { marginTop: '12px' } }, icon('upload', 'icon-sm'), 'Want fewer questions to answer by hand? Run the read-only ', h('a', { href: '#/item/PREP-DET-01' }, 'inventory script'), ' first: it suggests answers for nine questions.'),
      h('div', { class: 'hero-actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', 'data-focus-key': 'q-start', onclick: () => { direction = 'forward'; go(`#/questionnaire/q/${qs[0].id}`); } }, 'Start the questions', icon('arrow', 'icon-sm')),
        linkBtn('Skip, show the full plan', '#/overview', { kind: 'ghost' })),
      h('p', { class: 'q-keys', style: { marginTop: '14px' } }, icon('keyboard', 'icon-sm'), 'Tip: keys 1 to 4 answer. After Yes or No you move on by yourself; you can turn that off.')));
}

function planCounts() {
  const kb = state.kb;
  const appMap = applicabilityMap(kb, state.project);
  let applies = 0; let uncertain = 0; let na = 0;
  for (const c of kb.checks) {
    const v = appMap.get(c.id).value;
    if (v === 'applies') applies += 1; else if (v === 'unknown') uncertain += 1; else na += 1;
  }
  return { applies, uncertain, na, total: kb.checks.length };
}

function doneScreen(qs) {
  const p = state.project;
  const answered = qs.filter((q) => p.answers[q.id]);
  const unknown = answered.filter((q) => p.answers[q.id].value === 'unknown').length;
  const open = qs.length - answered.length;
  const c = planCounts();
  const build = async () => {
    await showSequence('Building your plan', [
      `Checking ${c.total} steps against your ${answered.length} answers`,
      `${c.applies} steps apply to your environment`,
      `${c.uncertain} to look into, kept in your plan`,
      `${c.na} set aside, each with its reason`,
      'Laying out your route from Prepare to Validate',
    ], { totalMs: 1800 });
    state.ui.justPlanned = true;
    go('#/overview');
  };
  return h('div', { class: 'q-screen' },
    h('div', { class: 'q-done q-section-intro' },
      h('div', { class: 'q-done-mark', 'aria-hidden': 'true' }, icon('check')),
      h('h1', { id: 'page-title', tabindex: '-1' }, open ? 'Nearly there' : 'That\'s everything. Your plan is ready.'),
      h('p', { class: 'q-detail', style: { margin: '12px auto 0' } }, open ? `You skipped ${open} question${open === 1 ? '' : 's'}. Their steps stay in your plan until you answer.` : 'Here is what your answers mean for the plan.'),
      h('div', { class: 'facts' },
        h('span', null, h('b', null, String(c.applies)), ' steps apply'),
        h('span', null, h('b', null, String(c.uncertain)), ' to look into'),
        h('span', null, h('b', null, String(c.na)), ' set aside'),
        unknown ? h('span', null, h('b', null, String(unknown)), ' answered "I don\'t know yet"') : null),
      h('div', { class: 'hero-actions', style: { justifyContent: 'center' } },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', 'data-focus-key': 'q-build', onclick: build }, 'Build my plan', icon('arrow', 'icon-sm')),
        open ? linkBtn('Answer the skipped questions', `#/questionnaire/q/${qs.find((q) => !p.answers[q.id]).id}`) : null,
        linkBtn('Review my answers', '#/answers', { kind: 'ghost' }))));
}

// Keys 1 to 4 and Enter, active only while focus is inside the question screen and not in a text field.
document.addEventListener('keydown', (e) => {
  if (!location.hash.startsWith('#/questionnaire/q/')) return;
  const screen = document.querySelector('.q-screen');
  if (!screen || !screen.contains(document.activeElement)) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (/^[1-4]$/.test(e.key)) {
    const tile = screen.querySelectorAll('.answer-tile')[Number(e.key) - 1];
    if (tile) { e.preventDefault(); tile.click(); }
  } else if (e.key === 'Enter' && !(t && (t.tagName === 'BUTTON' || t.tagName === 'A'))) {
    const nextBtn = screen.querySelector('[data-focus-key="q-next"]');
    if (nextBtn) { e.preventDefault(); nextBtn.click(); }
  }
});

// Records an answer and explains the effect when it changes work already recorded.
// Returns false when nothing was changed.
export async function changeAnswer(q, value) {
  const kb = state.kb;
  const p = state.project;
  const prevValue = p.answers[q.id] ? p.answers[q.id].value : null;
  if (prevValue === value) return false;
  const before = applicabilityMap(kb, p);
  mutate((pr) => setAnswer(pr, q.id, value), { silent: true });
  if (q.id === 'test_env' && (value === 'yes' || value === 'no')) {
    const want = value === 'yes' ? 'available' : 'unavailable';
    if (p.stages.test.availability !== want) {
      mutate((pr) => setTestAvailability(pr, want, value === 'no' ? 'No non-production Sentinel environment to test with (answer in the questions).' : ''), { silent: true });
      toast(value === 'yes' ? 'The optional test stage is now on.' : 'The optional test stage is skipped. The change gets compensating controls instead.', 'info', 4500);
    }
  }
  const after = applicabilityMap(kb, p);
  const diff = diffApplicability(before, after);
  const hadDecisions = Object.keys(p.gates).length > 0 || p.snapshots.length > 0;
  const affected = [...diff.appeared, ...diff.removed, ...diff.uncertain];
  const withRecords = affected.filter((id) => p.checks[id] && (p.checks[id].status !== 'not_started' || p.checks[id].evidenceIds.length));
  // Steps that were set aside and now come back are new work, worth telling the user about.
  const reappeared = [...diff.appeared, ...diff.uncertain].filter((id) => before.get(id) && before.get(id).value === 'not_applicable');
  render();
  if (affected.length && (withRecords.length || reappeared.length || hadDecisions)) {
    const title = (id) => { const c = kb.checks.find((x) => x.id === id); return c ? h('a', { href: `#/item/${id}` }, c.title) : id; };
    await modal({
      title: 'This answer changes your plan',
      body: h('div', { class: 'stack' },
        diff.appeared.length ? h('div', null, h('strong', null, `${diff.appeared.length} step(s) now apply:`), h('ul', null, diff.appeared.map((id) => h('li', null, title(id))))) : null,
        diff.uncertain.length ? h('div', null, h('strong', null, `${diff.uncertain.length} step(s) are now uncertain and stay in your plan:`), h('ul', null, diff.uncertain.map((id) => h('li', null, title(id))))) : null,
        diff.removed.length ? h('div', null, h('strong', null, `${diff.removed.length} step(s) no longer apply. They are set aside, never deleted:`), h('ul', null, diff.removed.map((id) => h('li', null, title(id))))) : null,
        withRecords.length ? callout('info', 'Your records are kept.', ` Statuses and evidence on ${withRecords.length} affected step(s) stay as they are.`) : null,
        hadDecisions ? callout('caution', 'Earlier conclusions may be out of date.', ' A gate decision or report snapshot was recorded before this change. Review the stage conclusions and consider a new snapshot.') : null),
      actions: [{ label: 'Got it', kind: 'primary', value: true }],
    });
  }
  return true;
}

// ───────────────────────────── Your answers (all on one page) ─────────────────────────────
route('answers', () => {
  const p = state.project;
  const kb = state.kb;
  if (p.mode === 'full') { setTimeout(() => go('#/questionnaire'), 0); return h('div', { class: 'page' }); }
  const qs = visibleQuestions(kb, p);
  const answered = qs.filter((q) => p.answers[q.id]).length;
  const row = (q) => {
    const a = p.answers[q.id];
    return h('li', null,
      h('div', { class: 'answers-q' }, h('div', null, h('p', null, q.text), q.detail ? h('div', { class: 'small muted' }, q.detail) : null),
        h('a', { href: `#/questionnaire/q/${q.id}`, class: 'small', style: { whiteSpace: 'nowrap' } }, 'Open')),
      h('div', { class: 'answer-row', role: 'radiogroup', 'aria-label': q.text }, ANSWERS.map((opt) => h('button', { type: 'button', role: 'radio', class: 'answer', 'aria-checked': a && a.value === opt.id ? 'true' : 'false', 'data-focus-key': `all-${q.id}-${opt.id}`, onclick: () => changeAnswer(q, opt.id) }, ANSWER_TEXT[opt.id][0]))),
      a ? h('div', { class: 'small muted answer-meta' }, `Answered by ${a.by} on ${formatDate(a.at)}${a.reason ? `. Note: ${a.reason}` : ''}. `, h('button', { type: 'button', class: 'linklike', onclick: () => changeAnswer(q, null) }, 'Clear')) : h('div', { class: 'small muted answer-meta' }, 'Not answered yet. The related steps stay in your plan.'));
  };
  return h('div', { class: 'page narrow' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', { id: 'page-title', tabindex: '-1' }, 'Your answers'), h('p', { class: 'lede' }, `${answered} of ${qs.length} answered. Change any answer here and the plan updates straight away.`)),
      h('div', { class: 'page-actions' }, linkBtn('Answer one by one', '#/questionnaire', { iconName: 'play' }), linkBtn('Back to the overview', '#/overview', { kind: 'ghost' }))),
    ...kb.questionSections.map((s) => {
      const inSec = qs.filter((q) => q.section === s.id);
      if (!inSec.length) return null;
      return h('section', { class: 'card' }, h('h2', { class: 'card-title' }, s.title), h('p', { class: 'small muted' }, s.intro), h('ul', { class: 'answers-list' }, inSec.map(row)));
    }));
});
