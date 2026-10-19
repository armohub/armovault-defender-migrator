// Applicability engine with three-valued (Kleene) logic.
//
// Rule grammar (declarative data, never evaluated as code):
//   null / undefined        → applies to every environment
//   { q: 'question-id' }    → true when the answer is "yes"; false for "no" or "na"; unknown when unanswered or "I don't know"
//   { not: rule }           → negation (unknown stays unknown)
//   { all: [rule, ...] }    → AND
//   { any: [rule, ...] }    → OR
//
// Outcome: 'applies' | 'not_applicable' | 'unknown'. Unknown answers never hide a check: an unknown outcome
// is shown as "applicability uncertain — needs investigation" and stays in scope.

import { answerLabel } from './model.js';

const T = 'T';
const F = 'F';
const U = 'U';

const invert = (r) => (r === T ? F : r === F ? T : U);

// `neg` tracks whether we are under an odd number of `not`s, so each trace entry records the answer's
// contribution to the final result (used to explain decisions without citing answers that argued the other way).
function evalNode(rule, answers, questions, trace, neg = false, depth = 0) {
  if (rule == null) return T;
  if (typeof rule !== 'object' || depth > 20) return U;
  if (typeof rule.q === 'string') {
    const q = questions.get(rule.q);
    const qText = q ? q.text : rule.q;
    // A follow-up question whose parent rules it out (for example "manual playbooks" when playbooks = No)
    // is hidden in the questionnaire; any stale answer to it is ignored and it counts as "No".
    if (q && q.showIf && evalNode(q.showIf, answers, questions, [], false, depth + 1) === F) {
      trace.push({ q: rule.q, text: qText, value: null, label: 'Not asked (ruled out by an earlier answer)', result: neg ? T : F });
      return F;
    }
    const a = answers[rule.q];
    const value = a && a.value;
    let r;
    if (value === 'yes') r = T;
    else if (value === 'no' || value === 'na') r = F;
    else r = U;
    trace.push({ q: rule.q, text: qText, value: value || null, label: value ? answerLabel(value) : 'Not answered yet', result: neg ? invert(r) : r });
    return r;
  }
  if (rule.not !== undefined) {
    return invert(evalNode(rule.not, answers, questions, trace, !neg, depth + 1));
  }
  if (Array.isArray(rule.all)) {
    let out = T;
    for (const sub of rule.all) {
      const r = evalNode(sub, answers, questions, trace, neg, depth + 1);
      if (r === F) out = F;
      else if (r === U && out !== F) out = U;
    }
    return out;
  }
  if (Array.isArray(rule.any)) {
    let out = F;
    for (const sub of rule.any) {
      const r = evalNode(sub, answers, questions, trace, neg, depth + 1);
      if (r === T) out = T;
      else if (r === U && out !== T) out = U;
    }
    return out;
  }
  return U;
}

export function questionIndex(kb) {
  return new Map(kb.questions.map((q) => [q.id, q]));
}

// Returns { value, source, reasons[], trace[] }.
//   source: 'always' | 'full-mode' | 'answers' | 'override'
export function evaluateApplicability(check, project, kb, qIndex = questionIndex(kb)) {
  const st = project.checks[check.id];
  if (st && st.override) {
    return {
      value: st.override.value,
      source: 'override',
      reasons: [`Reviewer decision by ${st.override.by} on ${st.override.at.slice(0, 10)}: ${st.override.reason}`],
      trace: [],
    };
  }
  if (!check.applicability) {
    return { value: 'applies', source: 'always', reasons: ['Applies to every Sentinel environment that is transitioning.'], trace: [] };
  }
  if (project.mode === 'full') {
    return { value: 'applies', source: 'full-mode', reasons: ['Shown because the full checklist was selected (no tailoring). Review whether it applies to you.'], trace: [] };
  }
  const trace = [];
  const r = evalNode(check.applicability, project.answers, qIndex, trace);
  const value = r === T ? 'applies' : r === F ? 'not_applicable' : 'unknown';
  const reasons = [];
  const relevant = trace.filter((t) => (value === 'unknown' ? t.result === U : value === 'applies' ? t.result === T : t.result === F));
  for (const t of (relevant.length ? relevant : trace)) {
    reasons.push(`"${t.text}" — ${t.label}`);
  }
  if (value === 'unknown') reasons.unshift('Applicability is uncertain because at least one relevant answer is unknown or not answered. The check stays in scope until it is investigated.');
  if (check.applicabilityNote) reasons.push(check.applicabilityNote);
  return { value, source: 'answers', reasons, trace };
}

// Convenience: map of checkId → applicability result for the whole KB.
export function applicabilityMap(kb, project) {
  const qIndex = questionIndex(kb);
  const out = new Map();
  for (const c of kb.checks) out.set(c.id, evaluateApplicability(c, project, kb, qIndex));
  return out;
}

// Which questions influence any check (used to warn when an answer change alters the plan).
export function questionsUsed(rule, acc = new Set()) {
  if (!rule || typeof rule !== 'object') return acc;
  if (typeof rule.q === 'string') acc.add(rule.q);
  if (rule.not) questionsUsed(rule.not, acc);
  for (const k of ['all', 'any']) if (Array.isArray(rule[k])) rule[k].forEach((r) => questionsUsed(r, acc));
  return acc;
}

// Compare applicability before/after an answer change → lists of checks that appeared, disappeared or became uncertain.
export function diffApplicability(before, after) {
  const appeared = [];
  const removed = [];
  const uncertain = [];
  for (const [id, a] of after) {
    const b = before.get(id);
    if (!b || b.value === a.value) continue;
    if (a.value === 'applies' && b.value !== 'applies') appeared.push(id);
    else if (a.value === 'not_applicable') removed.push(id);
    else if (a.value === 'unknown') uncertain.push(id);
  }
  return { appeared, removed, uncertain };
}
