// Validates the knowledge base: referential integrity, minimum guidance quality for every item,
// and the writing rules from docs/content-style-guide.md (no long dashes, no bare item codes,
// valid links and actions, step shape). Used by the build (fails on errors) and by unit tests.
//   node scripts/validate-kb.mjs                 all findings
//   node scripts/validate-kb.mjs --only PREP-ACC findings whose text matches the pattern
import { questionsUsed } from '../src/core/applicability.js';
import { GO_TARGETS, DO_ACTIONS, MARKUP_TOKEN, ITEM_ID } from '../content/markup.mjs';

const CRIT = ['critical', 'high', 'medium', 'low'];
const KINDS = ['check', 'task', 'decision', 'gate'];
const DASHES = /[\u2013\u2014]/;
// Keys whose values are identifiers or code, not reading text.
const NOT_TEXT = new Set(['tool', 'id', 'dependsOn', 'snippets', 'code', 'url', 'stage', 'workstream', 'kind', 'criticality', 'provenance', 'confidence', 'validation', 'lastVerified', 'version', 'applicability', 'showIf', 'section', 'sources', 'language', 'status', 'readOnly', 'reportKind', 'number', 'pageDate', 'verified', 'publisher', 'date']);
// Words that make guidance sound machine-written. Plain alternatives are in the style guide.
const BANNED_WORDS = /\b(seamless(?:ly)?|leverag(?:e|es|ed|ing)|utili[sz](?:e|es|ed|ing|ation)|delve|robust|streamlin(?:e|ed|es|ing)|cutting-edge|game-?changer|empower(?:s|ed|ing)?|holistic|synerg(?:y|ies)|paradigm|in order to)\b/i;
const STEP_KEYS = new Set(['text', 'bullets', 'tip']);
// Interactive tools a step can show under "Do it here" (src/ui/tools.js).
const TOOLS = ['workspaces', 'connection', 'primary', 'owners', 'briefing', 'window', 'mdc', 'urbac', 'tenants', 'comms', 'change'];
// Tools that are decision helpers: they render the step's `helper` (src/core/decision-helper.js).
const HELPER_TOOLS = ['mdc', 'urbac', 'tenants'];
const HELPER_ID = /^[a-z][a-z0-9_-]{0,39}$/;
const RULE_KINDS = ['requires', 'recommends', 'pro', 'con', 'note'];

// The shape of a decision helper. Its words are linted with the rest of the step.
function checkHelper(c, errors) {
  const x = c.helper;
  const bad = (m) => errors.push(`${c.id}: helper ${m}`);
  const strs = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && s);
  if (!x || typeof x !== 'object') { bad('is missing.'); return; }
  if (typeof x.decision !== 'string' || !x.decision) bad('needs a decision name.');
  if (x.per !== undefined && x.per !== 'tenant') bad('"per" can only be "tenant".');
  if (!Array.isArray(x.questions) || !x.questions.length) { bad('needs questions.'); return; }
  const qs = new Map();
  for (const q of x.questions) {
    if (!q || !HELPER_ID.test(q.id || '') || qs.has(q.id)) { bad(`question id "${q && q.id}" is invalid or repeated.`); continue; }
    if (typeof q.text !== 'string' || !q.text) bad(`question ${q.id} needs text.`);
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every((o) => o && HELPER_ID.test(o.id || '') && typeof o.label === 'string' && o.label)) bad(`question ${q.id} needs at least two options with an id and a label.`);
    else if (new Set(q.options.map((o) => o.id)).size !== q.options.length) bad(`question ${q.id} repeats an option id.`);
    qs.set(q.id, new Set((q.options || []).map((o) => o && o.id)));
  }
  const choices = new Set();
  if (!Array.isArray(x.choices) || x.choices.length < 2) bad('needs at least two choices.');
  for (const ch of x.choices || []) {
    if (!ch || !HELPER_ID.test(ch.id || '') || choices.has(ch.id)) { bad(`choice id "${ch && ch.id}" is invalid or repeated.`); continue; }
    choices.add(ch.id);
    if (typeof ch.title !== 'string' || !ch.title || /\[\[|\*\*/.test(ch.title)) bad(`choice ${ch.id} needs a plain title.`);
    if (typeof ch.summary !== 'string' || !ch.summary) bad(`choice ${ch.id} needs a summary.`);
    for (const f of ['pros', 'cons', 'todo']) if (ch[f] !== undefined && !(Array.isArray(ch[f]) && (ch[f].length === 0 || strs(ch[f])))) bad(`choice ${ch.id} ${f} must be a list of strings.`);
  }
  for (const [i, r] of (x.rules || []).entries()) {
    const at = `rule ${i + 1}`;
    if (!r || !RULE_KINDS.includes(r.kind)) { bad(`${at} has an unknown kind.`); continue; }
    if (typeof r.say !== 'string' || !r.say) bad(`${at} needs "say".`);
    if (r.kind === 'note' ? r.on !== undefined : !choices.has(r.on)) bad(`${at}: "on" must name a choice (and notes have none).`);
    if (r.point !== undefined) {
      const ch = (x.choices || []).find((y) => y && y.id === r.on);
      const listed = ch ? (r.kind === 'con' ? ch.cons : ch.pros) || [] : [];
      if (r.kind === 'note' || !Number.isInteger(r.point) || r.point < 0 || r.point >= listed.length) bad(`${at}: "point" must be the index of one of the choice's ${r.kind === 'con' ? 'cons' : 'pros'}.`);
    }
    if (!r.when || typeof r.when !== 'object' || !Object.keys(r.when).length) bad(`${at} needs "when".`);
    for (const [q, vals] of Object.entries(r.when || {})) {
      if (!qs.has(q)) bad(`${at} uses unknown question "${q}".`);
      else if (!Array.isArray(vals) || !vals.length || !vals.every((v) => qs.get(q).has(v))) bad(`${at} uses an unknown answer for "${q}".`);
    }
  }
  if (x.notes !== undefined && !strs(x.notes)) bad('notes must be a list of strings.');
  if (x.person !== undefined && (!x.person || typeof x.person.label !== 'string' || !x.person.label)) bad('person needs a label.');
}

// Checks one reading-text string. `allowDo` is true only inside a check (step page).
function lintText(s, where, allowDo, ctx, out) {
  if (DASHES.test(s)) out.errors.push(`${where}: contains a long dash (use a comma, colon, full stop or brackets).`);
  const banned = ctx.skipWords ? null : s.match(BANNED_WORDS);
  if (banned) out.errors.push(`${where}: uses "${banned[0]}" (see the plain-words list in the style guide).`);
  let rest = s;
  for (const m of s.matchAll(MARKUP_TOKEN)) {
    if (m[1] !== undefined) continue;
    const target = m[2].trim();
    const label = m[3] ? m[3].trim() : '';
    if (target.startsWith('go:')) {
      if (!(target.slice(3) in GO_TARGETS)) out.errors.push(`${where}: unknown page link "${target}".`);
      if (!label) out.errors.push(`${where}: page link "${target}" needs a label ([[${target}|label]]).`);
    } else if (target.startsWith('do:')) {
      if (!allowDo) out.errors.push(`${where}: action "${target}" is only allowed in step content.`);
      else if (!(target.slice(3) in DO_ACTIONS)) out.errors.push(`${where}: unknown action "${target}".`);
      else if (target === 'do:record-gate' && ctx.kind !== 'gate') out.errors.push(`${where}: "do:record-gate" is only valid on gate steps.`);
      else if (target === 'do:open-tool' && !ctx.tool) out.errors.push(`${where}: "do:open-tool" is only valid on steps that have a tool.`);
      if (!label) out.errors.push(`${where}: action "${target}" needs a label ([[${target}|label]]).`);
    } else if (!ctx.checkIds.has(target)) {
      out.errors.push(`${where}: link to unknown step "${target}".`);
    } else if (target === ctx.selfId) {
      out.warnings.push(`${where}: links to itself.`);
    }
    if (label && ITEM_ID.test(label)) out.errors.push(`${where}: link label shows an item code ("${label}").`);
  }
  rest = rest.replace(MARKUP_TOKEN, ' ');
  if (/\[\[|\]\]|\*\*/.test(rest)) out.errors.push(`${where}: unbalanced markup ([[ ]] or **).`);
  const bare = rest.match(ITEM_ID);
  if (bare) out.errors.push(`${where}: shows the item code ${bare[0]} as text (link it as [[${bare[0]}]]).`);
  if (/\(1\)[^]*\(2\)/.test(rest)) out.warnings.push(`${where}: inline numbered list; use bullets.`);
  for (const sentence of rest.split(/(?<=[.!?])\s+/)) {
    if (sentence.split(/\s+/).filter(Boolean).length > 40) { out.warnings.push(`${where}: a sentence has more than 40 words.`); break; }
  }
}

// Walks any content value and lints every reading-text string in it.
function walk(value, where, allowDo, ctx, out, key) {
  if (key && NOT_TEXT.has(key)) return;
  if (typeof value === 'string') { lintText(value, where, allowDo, ctx, out); return; }
  if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${where}[${i}]`, allowDo, ctx, out)); return; }
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${where}.${k}`, allowDo, ctx, out, k);
}

// Dashes are banned even inside identifiers and code (the inventory script must stay ASCII).
function dashAnywhere(value, where, out) {
  if (typeof value === 'string') { if (DASHES.test(value)) out.errors.push(`${where}: contains a long dash.`); return; }
  if (Array.isArray(value)) { value.forEach((v, i) => dashAnywhere(v, `${where}[${i}]`, out)); return; }
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (NOT_TEXT.has(k)) dashAnywhere(v, `${where}.${k}`, out);
}

export function validateKb(kb) {
  const errors = [];
  const warnings = [];
  const out = { errors, warnings };
  const sourceIds = new Set(kb.sources.map((s) => s.id));
  const questionIds = new Set(kb.questions.map((q) => q.id));
  const checkIds = new Set();
  const snippetIds = new Set(Object.keys(kb.snippets));
  const stageIds = new Set(kb.stages.map((s) => s.id));
  const ws = new Set(kb.workstreams.map((w) => `${w.stage}:${w.id}`));
  const usedSources = new Set();
  const usedSnippets = new Set();

  for (const c of kb.checks) {
    if (checkIds.has(c.id)) errors.push(`Duplicate check id ${c.id}.`);
    checkIds.add(c.id);
  }
  const ctx = { checkIds, selfId: null, kind: null };

  for (const s of kb.sources) {
    if (!/^https:\/\/learn\.microsoft\.com\//.test(s.url)) warnings.push(`Source ${s.id} is not a Microsoft Learn URL.`);
    for (const f of ['title', 'url', 'publisher', 'pageDate', 'verified']) if (!s[f]) errors.push(`Source ${s.id} missing ${f}.`);
  }
  // Source titles are Microsoft's own page titles: dashes are still replaced, but their wording stays.
  ctx.skipWords = true;
  walk(kb.sources, 'sources', false, ctx, out);
  ctx.skipWords = false;
  for (const [id, sn] of Object.entries(kb.snippets)) {
    for (const f of ['title', 'language', 'status', 'runIn', 'permissions', 'code', 'purpose', 'expected', 'cost']) if (!sn[f]) errors.push(`Snippet ${id} missing ${f}.`);
    if (!['verbatim', 'composed'].includes(sn.status)) errors.push(`Snippet ${id} has invalid status.`);
    if (typeof sn.readOnly !== 'boolean') errors.push(`Snippet ${id} must declare readOnly.`);
    if (!sn.sources || !sn.sources.length) errors.push(`Snippet ${id} has no sources.`);
    for (const sid of sn.sources || []) { if (!sourceIds.has(sid)) errors.push(`Snippet ${id} cites unknown source ${sid}.`); usedSources.add(sid); }
    walk(sn, `Snippet ${id}`, false, ctx, out);
    dashAnywhere(sn, `Snippet ${id}`, out);
  }
  for (const q of kb.questions) {
    if (!q.text || !q.section) errors.push(`Question ${q.id} incomplete.`);
    for (const sid of q.sources || []) if (!sourceIds.has(sid)) errors.push(`Question ${q.id} cites unknown source ${sid}.`);
    if (q.showIf) for (const r of questionsUsed(q.showIf)) if (!questionIds.has(r)) errors.push(`Question ${q.id} showIf references unknown question ${r}.`);
    walk(q, `Question ${q.id}`, false, ctx, out);
  }
  walk(kb.questionSections, 'questionSections', false, ctx, out);
  walk(kb.stages, 'stages', false, ctx, out);
  walk(kb.workstreams, 'workstreams', false, ctx, out);
  walk(kb.reference, 'reference', false, ctx, out);
  walk(kb.meta, 'meta', false, ctx, out);

  for (const c of kb.checks) {
    const label = c.id;
    if (!/^[A-Z]+(-[A-Z0-9]+)+$/.test(c.id)) errors.push(`${label}: id format.`);
    if (!stageIds.has(c.stage)) errors.push(`${label}: unknown stage ${c.stage}.`);
    if (!ws.has(`${c.stage}:${c.workstream}`)) errors.push(`${label}: unknown workstream ${c.workstream} for stage ${c.stage}.`);
    if (!CRIT.includes(c.criticality)) errors.push(`${label}: criticality.`);
    if (!KINDS.includes(c.kind)) errors.push(`${label}: kind.`);
    for (const f of ['title', 'objective', 'expected']) if (!c[f] || String(c[f]).length < 10) errors.push(`${label}: missing or too short ${f}.`);
    const whyText = Array.isArray(c.why) ? c.why.join(' ') : c.why;
    if (!whyText || String(whyText).length < 10) errors.push(`${label}: missing or too short why.`);
    if (Array.isArray(c.why) && !c.why.every((x) => typeof x === 'string')) errors.push(`${label}: why must be a string or a list of strings.`);
    if (typeof c.title === 'string') {
      if (/\[\[|\*\*/.test(c.title)) errors.push(`${label}: title must be plain text (no links or bold).`);
      if (c.title.length > 90) warnings.push(`${label}: title is longer than 90 characters.`);
    }
    if (!c.steps || c.steps.length < 1) errors.push(`${label}: no steps.`);
    (c.steps || []).forEach((st, i) => {
      if (typeof st === 'string') return;
      if (!st || typeof st !== 'object' || typeof st.text !== 'string' || !st.text) { errors.push(`${label}: step ${i + 1} must be a string or { text, bullets?, tip? }.`); return; }
      for (const k of Object.keys(st)) if (!STEP_KEYS.has(k)) errors.push(`${label}: step ${i + 1} has unknown key "${k}".`);
      if (st.bullets !== undefined && (!Array.isArray(st.bullets) || !st.bullets.every((b) => typeof b === 'string' && b))) errors.push(`${label}: step ${i + 1} bullets must be a list of strings.`);
      if (st.tip !== undefined && typeof st.tip !== 'string') errors.push(`${label}: step ${i + 1} tip must be a string.`);
    });
    if (c.portalWay !== undefined && (!Array.isArray(c.portalWay) || !c.portalWay.every((x) => typeof x === 'string' && x))) errors.push(`${label}: portalWay must be a list of strings.`);
    if (!c.where || !c.where.length) errors.push(`${label}: no location.`);
    for (const w of c.where || []) {
      if (!w.portal || !w.path) errors.push(`${label}: incomplete location entry.`);
      else if (/\[\[|\*\*/.test(w.path)) errors.push(`${label}: location paths must be plain text separated by " > ".`);
    }
    if (!c.record || !c.record.length) errors.push(`${label}: nothing to record.`);
    if (!c.evidence || !c.evidence.length) errors.push(`${label}: no evidence guidance.`);
    if (!c.sources || !c.sources.length) errors.push(`${label}: no sources.`);
    for (const s of c.sources || []) { if (!sourceIds.has(s.id)) errors.push(`${label}: unknown source ${s.id}.`); if (!s.supports) errors.push(`${label}: source ${s.id} lacks a "supports" statement.`); usedSources.add(s.id); }
    for (const sn of c.snippets || []) { if (!snippetIds.has(sn)) errors.push(`${label}: unknown snippet ${sn}.`); usedSnippets.add(sn); }
    for (const d of c.dependsOn || []) if (!checkIds.has(d)) errors.push(`${label}: dependsOn unknown ${d}.`);
    for (const qid of questionsUsed(c.applicability)) if (!questionIds.has(qid)) errors.push(`${label}: applicability uses unknown question ${qid}.`);
    if (!['official', 'practice'].includes(c.provenance)) errors.push(`${label}: provenance.`);
    if (!['docs-verified', 'needs-review'].includes(c.validation)) errors.push(`${label}: validation.`);
    if (c.validation === 'needs-review' && (!c.caveats || !c.caveats.length)) errors.push(`${label}: needs-review items must explain the uncertainty in caveats.`);
    if (c.criticality === 'critical' && c.provenance === 'official' && c.validation === 'docs-verified' && c.confidence !== 'high') warnings.push(`${label}: critical docs-verified item with confidence ${c.confidence}.`);
    if (c.changesState && !c.steps.some(Boolean)) errors.push(`${label}: state-changing task without steps.`);
    if (c.tool !== undefined && !TOOLS.includes(c.tool)) errors.push(`${label}: unknown tool "${c.tool}".`);
    if (HELPER_TOOLS.includes(c.tool) || c.helper !== undefined) {
      if (!HELPER_TOOLS.includes(c.tool)) errors.push(`${label}: a helper needs a decision helper tool (${HELPER_TOOLS.join(', ')}).`);
      checkHelper(c, errors);
    }
    ctx.selfId = c.id; ctx.kind = c.kind; ctx.tool = c.tool;
    walk(c, label, true, ctx, out);
    for (const s of c.sources || []) if (s.supports && DASHES.test(s.supports)) errors.push(`${label}: source ${s.id} "supports" contains a long dash.`);
    ctx.selfId = null; ctx.kind = null; ctx.tool = null;
  }
  for (const id of snippetIds) if (!usedSnippets.has(id)) warnings.push(`Snippet ${id} is not used by any check.`);
  for (const id of sourceIds) if (!usedSources.has(id)) warnings.push(`Source ${id} is not cited by any check or snippet.`);
  // Simplified mode: short forms, good-practice tags, missions and core questions.
  const SHORT_LIMITS = { title: 70, do: 160, proof: 140 };
  for (const c of kb.checks) {
    if (!['needed', 'extra'].includes(c.scope)) errors.push(`${c.id}: scope must be "needed" or "extra".`);
    const s = c.short;
    if (!s) { errors.push(`${c.id}: short form missing (Simplified mode).`); continue; }
    if (!s.title || s.title.length > SHORT_LIMITS.title) errors.push(`${c.id}: short title missing or longer than ${SHORT_LIMITS.title} characters.`);
    if (!Array.isArray(s.do) || s.do.length < 1 || s.do.length > 3) errors.push(`${c.id}: the short form needs one to three "do" points.`);
    else s.do.forEach((d, i) => { if (typeof d !== 'string' || !d.trim() || d.length > SHORT_LIMITS.do) errors.push(`${c.id}: do point ${i + 1} is empty or longer than ${SHORT_LIMITS.do} characters.`); });
    if (!s.proof || s.proof.length > SHORT_LIMITS.proof) errors.push(`${c.id}: short proof missing or longer than ${SHORT_LIMITS.proof} characters.`);
  }
  for (const c of kb.checks.filter((x) => x.scope === 'needed')) {
    for (const d of c.dependsOn || []) {
      const id = typeof d === 'string' ? d : d.id;
      const dep = kb.checks.find((x) => x.id === id);
      if (dep && dep.scope === 'extra') errors.push(`${c.id} is needed but depends on good-practice check ${id}.`);
    }
  }
  for (const w of kb.workstreams) {
    const m = w.mission;
    if (!m || !m.title || m.title.length > 60 || !m.purpose || m.purpose.length > 120) errors.push(`Workstream ${w.stage}:${w.id}: mission title (at most 60) and purpose (at most 120) are required.`);
  }
  if (kb.questions.filter((q) => q.core).length !== 6) errors.push('Exactly six questions must be marked core (asked up front in Simplified mode).');

  return { errors, warnings, stats: { checks: kb.checks.length, questions: kb.questions.length, sources: kb.sources.length, snippets: snippetIds.size } };
}

if (process.argv[1] && process.argv[1].endsWith('validate-kb.mjs')) {
  const { KB } = await import('../content/kb.mjs');
  const r = validateKb(KB);
  const i = process.argv.indexOf('--only');
  const only = i > 0 && process.argv[i + 1] ? new RegExp(process.argv[i + 1]) : null;
  const keep = (x) => !only || only.test(x);
  const errs = r.errors.filter(keep);
  const warns = r.warnings.filter(keep);
  console.log(`KB ${KB.meta.version}: ${r.stats.checks} items, ${r.stats.questions} questions, ${r.stats.sources} sources, ${r.stats.snippets} snippets`);
  for (const w of warns) console.log('warning:', w);
  for (const e of errs) console.log('ERROR:', e);
  console.log(`${errs.length} error(s), ${warns.length} warning(s)${only ? ` matching ${only}` : ''}.`);
  if (errs.length) process.exit(1);
}
