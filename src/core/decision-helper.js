// Decision helpers: a few targeted questions on a step, the trade-offs of each approach side by side, and a
// verdict only where the step's own content gives a basis for one. The words come from the knowledge base
// (`helper` on the step); this module only matches answers against the step's rules.
//   kind 'requires'   the step states that an answer needs this approach (a hard fact)
//   kind 'recommends' the step or Microsoft recommends this approach for that answer
//   kind 'pro'/'con'  a point for or against an approach, shown in its column
//   kind 'note'       applies whatever you choose
// A rule with `point` (an index into the choice's pros, or cons for 'con') confirms that listed point
// instead of adding its own line to the column. Its `say` is still used in the verdict and the register.
import { MARKUP_TOKEN } from '../../content/markup.mjs';

const valuesOf = (a) => (Array.isArray(a) ? a : a ? [a] : []);

export function ruleMatches(rule, answers = {}) {
  return Object.entries(rule.when || {}).every(([q, allowed]) => valuesOf(answers[q]).some((v) => allowed.includes(v)));
}

export function evaluateHelper(helper, answers = {}) {
  const hits = helper.rules.filter((r) => ruleMatches(r, answers));
  const required = [...new Set(hits.filter((r) => r.kind === 'requires').map((r) => r.on))];
  const favoured = [...new Set(hits.filter((r) => r.kind === 'recommends').map((r) => r.on))];
  // A requirement outweighs a recommendation; two different requirements, or two recommendations, are no verdict.
  let verdict = null;
  if (required.length === 1) verdict = required[0];
  else if (!required.length && favoured.length === 1) verdict = favoured[0];
  const strength = verdict && required.includes(verdict) ? 'requires' : verdict ? 'recommends' : null;
  const reasons = verdict ? hits.filter((r) => r.on === verdict && r.kind === strength) : [];
  // Per approach and side: `mine` are new lines from your answers, `marked` the listed points your answers
  // confirm, `says` every answer-driven line (for the register).
  const side = (id, kinds) => {
    const here = hits.filter((r) => r.on === id && kinds.includes(r.kind));
    return {
      mine: here.filter((r) => !Number.isInteger(r.point)).map((r) => r.say),
      marked: [...new Set(here.filter((r) => Number.isInteger(r.point)).map((r) => r.point))],
      says: here.map((r) => r.say),
    };
  };
  const byChoice = {};
  for (const c of helper.choices) byChoice[c.id] = { pros: side(c.id, ['requires', 'recommends', 'pro']), cons: side(c.id, ['con']) };
  const answered = helper.questions.filter((q) => valuesOf(answers[q.id]).length).length;
  return {
    verdict, strength, reasons: reasons.map((r) => r.say), byChoice,
    notes: hits.filter((r) => r.kind === 'note').map((r) => r.say),
    split: required.length > 1 || (!required.length && favoured.length > 1),
    answered, total: helper.questions.length,
  };
}

// Plain text of content markup, for the register (links become their labels).
export function plainText(s, kb) {
  return String(s == null ? '' : s).replace(MARKUP_TOKEN, (all, bold, target, label) => {
    if (bold !== undefined) return bold;
    if (label) return label.trim();
    const t = target.trim();
    if (t.startsWith('go:') || t.startsWith('do:')) return t.slice(3);
    const item = kb && kb.checks.find((c) => c.id === t);
    return item ? item.title : '';
  });
}

export function answerLabels(question, value) {
  const vals = valuesOf(value);
  return question.options.filter((o) => vals.includes(o.id)).map((o) => o.label);
}

// The title and description that prefill the register decision. Returns null until an approach is chosen.
export function decisionDraft(check, subject, kb) {
  const helper = check.helper;
  const choice = helper.choices.find((c) => c.id === subject.choice);
  if (!choice) return null;
  const ev = evaluateHelper(helper, subject.answers);
  const p = (s) => plainText(s, kb);
  const list = (title, items) => (items.length ? ['', title, ...items.map((x) => `- ${p(x)}`)] : []);
  const head = subject.label ? `${helper.decision} for ${subject.label}` : helper.decision;
  const col = ev.byChoice[choice.id];
  const unmarked = (list, s) => (list || []).filter((x, i) => !s.marked.includes(i));
  const why = [...(ev.verdict === choice.id ? ev.reasons : []), ...col.pros.says, ...unmarked(choice.pros, col.pros)];
  const other = ev.verdict && ev.verdict !== choice.id ? helper.choices.find((c) => c.id === ev.verdict) : null;
  const answers = helper.questions.map((q) => [q, answerLabels(q, subject.answers[q.id])]).filter(([, l]) => l.length).map(([q, l]) => `${p(q.text)} ${l.join(', ')}`);
  const lines = [
    `Chosen: ${p(choice.title)}. ${p(choice.summary)}`,
    ...(helper.person && subject.person ? [`${p(helper.person.label)}: ${subject.person}`] : []),
    ...(other ? ['', `The helper pointed to "${p(other.title)}" for these answers. Add here why you chose differently.`] : []),
    ...list('Why:', [...new Set(why)]),
    ...list('Trade-offs you accept:', [...new Set([...col.cons.says, ...unmarked(choice.cons, col.cons)])]),
    ...list('Also from your answers:', ev.notes),
    ...list('To do:', choice.todo || []),
    ...list('Your answers:', answers),
    '',
    `Prepared with the decision helper of the step "${check.title}". It restates that step and its Microsoft Learn sources.`,
  ];
  return { title: `${head}: ${p(choice.title)}`.slice(0, 300), description: lines.join('\n').slice(0, 20000) };
}
