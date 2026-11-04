// Plan depth: how thorough the plan is, and which topics it includes. It works on top of tailoring: a step is in the
// plan only when the answers say it applies and the plan keeps it. Must-do steps are never left out by the level;
// a step left out is set aside with the reason, never deleted. The full checklist ignores the plan.

// Four tags, straight from the knowledge base: criticality, and the good-practice extras.
export const TIERS = { must: 'Must do', recommended: 'Recommended', useful: 'Useful', extra: 'Good practice' };
const TIER_ORDER = ['must', 'recommended', 'useful', 'extra'];
export function tierOf(check) {
  if (check.scope === 'extra') return 'extra';
  if (check.criticality === 'critical') return 'must';
  if (check.criticality === 'high') return 'recommended';
  return 'useful';
}

export const DEPTHS = [
  { id: 'essentials', label: 'Essentials', short: 'must-do steps only', keeps: ['must'] },
  { id: 'recommended', label: 'Recommended', short: 'must-do and recommended steps, and the good-practice extras', keeps: ['must', 'recommended', 'extra'] },
  { id: 'thorough', label: 'Thorough', short: 'every step', keeps: TIER_ORDER },
];

// Topics people choose to include. On keeps the topic's steps whatever their tag; off leaves its non-must steps out.
// The test rehearsal is the Test stage: switched off, the whole stage is skipped.
export const TOPICS = [
  { id: 'backups', label: 'Backups and baselines', phrase: 'backups and baselines', has: (c) => (c.topics || []).includes('backups') },
  { id: 'rehearsal', label: 'A test rehearsal', phrase: 'a test rehearsal', has: (c) => c.stage === 'test' },
  { id: 'verification', label: 'Extra verification after the move', phrase: 'extra verification after the move', has: (c) => c.stage === 'validate' || (c.stage === 'transition' && c.workstream === 'post-change') },
];
export const topicsOf = (check) => TOPICS.filter((t) => t.has(check)).map((t) => t.id);
export const REHEARSAL_OFF = 'You chose not to include a test rehearsal in your plan.';

export function topicPreset(depth) {
  const on = depth !== 'essentials';
  return Object.fromEntries(TOPICS.map((t) => [t.id, on]));
}

// The plan of a project. Projects without one keep every step: Thorough, with every topic on.
export function planOf(project) {
  const m = (project && project.meta) || {};
  const depth = DEPTHS.some((d) => d.id === m.planDepth) ? m.planDepth : 'thorough';
  const t = m.planTopics && typeof m.planTopics === 'object' ? m.planTopics : {};
  return { depth, topics: Object.fromEntries(TOPICS.map((x) => [x.id, t[x.id] !== false])) };
}

const change = 'Change it in Project setup to include it.';

// Why the plan leaves this step out, or '' when it keeps it.
export function leftOutByPlan(check, project) {
  if (project.mode === 'full') return '';
  const { depth, topics } = planOf(project);
  if (check.stage === 'test' && !topics.rehearsal) return `Left out by your plan: you chose not to include a test rehearsal. ${change}`;
  const tier = tierOf(check);
  if (tier === 'must') return '';
  const mine = topicsOf(check);
  if (mine.some((x) => topics[x])) return '';
  const off = TOPICS.find((t) => mine.includes(t.id) && !topics[t.id]);
  if (off) return `Left out by your plan: you chose not to include ${off.phrase}. ${change}`;
  const d = DEPTHS.find((x) => x.id === depth);
  return d.keeps.includes(tier) ? '' : `Left out by your plan: ${d.label} (${d.short}). ${change}`;
}

// ── Questions: tagged by the most important step they decide (or inform), and hidden when the plan keeps none ──
export const IMPORTANCE = { must: 'Must answer', important: 'Important', optional: 'Optional' };
export const IMPORTANCE_ORDER = ['must', 'important', 'optional'];
const TIER_IMPORTANCE = { must: 'must', recommended: 'important', useful: 'optional', extra: 'optional' };

function rulesQuestions(rule, acc) {
  if (!rule || typeof rule !== 'object') return acc;
  if (typeof rule.q === 'string') acc.add(rule.q);
  if (rule.not) rulesQuestions(rule.not, acc);
  for (const k of ['all', 'any']) if (Array.isArray(rule[k])) rule[k].forEach((r) => rulesQuestions(r, acc));
  return acc;
}

const stepsCache = new WeakMap();
// The steps a question decides (through applicability) or informs (a question's `informs` list).
export function stepsOfQuestion(kb, questionId) {
  let map = stepsCache.get(kb);
  if (!map) {
    map = new Map();
    for (const c of kb.checks) for (const id of rulesQuestions(c.applicability, new Set())) map.set(id, [...(map.get(id) || []), c]);
    for (const q of kb.questions) for (const id of q.informs || []) { const c = kb.checks.find((x) => x.id === id); if (c) map.set(q.id, [...(map.get(q.id) || []), c]); }
    stepsCache.set(kb, map);
  }
  return map.get(questionId) || [];
}

export function questionImportance(kb, project, q) {
  const steps = stepsOfQuestion(kb, q.id);
  if (!steps.length) return 'optional';
  const kept = steps.filter((c) => !leftOutByPlan(c, project));
  if (!kept.length) return 'hidden';
  const best = Math.min(...kept.map((c) => TIER_ORDER.indexOf(tierOf(c))));
  return TIER_IMPORTANCE[TIER_ORDER[best]];
}

// Most important first; within a group, the knowledge base order (by section).
export function sortByImportance(kb, project, questions) {
  const rank = (q) => IMPORTANCE_ORDER.indexOf(questionImportance(kb, project, q));
  return questions.map((q, i) => ({ q, i, r: rank(q) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.q);
}

// One line for reports and Project setup.
export function planSummary(project, leftOutCount) {
  if (project.mode === 'full') return 'Full checklist: every step is shown, and the plan depth does not apply.';
  const { depth, topics } = planOf(project);
  const d = DEPTHS.find((x) => x.id === depth);
  const on = TOPICS.filter((t) => topics[t.id]).map((t) => t.phrase);
  const off = TOPICS.filter((t) => !topics[t.id]).map((t) => t.phrase);
  return `${d.label}: ${d.short}${on.length ? `, with ${on.join(', ')}` : ''}${off.length ? `, without ${off.join(', ')}` : ''}. ${leftOutCount} step${leftOutCount === 1 ? '' : 's'} left out by the plan.`;
}
