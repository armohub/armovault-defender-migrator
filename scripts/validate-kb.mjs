// Validates the knowledge base: referential integrity and minimum guidance quality for every item.
// Used by the build (fails on errors) and by unit tests.
import { questionsUsed } from '../src/core/applicability.js';

const CRIT = ['critical', 'high', 'medium', 'low'];
const KINDS = ['check', 'task', 'decision', 'gate'];

export function validateKb(kb) {
  const errors = [];
  const warnings = [];
  const sourceIds = new Set(kb.sources.map((s) => s.id));
  const questionIds = new Set(kb.questions.map((q) => q.id));
  const checkIds = new Set();
  const snippetIds = new Set(Object.keys(kb.snippets));
  const stageIds = new Set(kb.stages.map((s) => s.id));
  const ws = new Set(kb.workstreams.map((w) => `${w.stage}:${w.id}`));
  const usedSources = new Set();
  const usedSnippets = new Set();

  for (const s of kb.sources) {
    if (!/^https:\/\/learn\.microsoft\.com\//.test(s.url)) warnings.push(`Source ${s.id} is not a Microsoft Learn URL.`);
    for (const f of ['title', 'url', 'publisher', 'pageDate', 'verified']) if (!s[f]) errors.push(`Source ${s.id} missing ${f}.`);
  }
  for (const [id, sn] of Object.entries(kb.snippets)) {
    for (const f of ['title', 'language', 'status', 'runIn', 'permissions', 'code', 'purpose', 'expected', 'cost']) if (!sn[f]) errors.push(`Snippet ${id} missing ${f}.`);
    if (!['verbatim', 'composed'].includes(sn.status)) errors.push(`Snippet ${id} has invalid status.`);
    if (typeof sn.readOnly !== 'boolean') errors.push(`Snippet ${id} must declare readOnly.`);
    if (!sn.sources || !sn.sources.length) errors.push(`Snippet ${id} has no sources.`);
    for (const sid of sn.sources || []) { if (!sourceIds.has(sid)) errors.push(`Snippet ${id} cites unknown source ${sid}.`); usedSources.add(sid); }
  }
  for (const q of kb.questions) {
    if (!q.text || !q.section) errors.push(`Question ${q.id} incomplete.`);
    for (const sid of q.sources || []) if (!sourceIds.has(sid)) errors.push(`Question ${q.id} cites unknown source ${sid}.`);
    if (q.showIf) for (const r of questionsUsed(q.showIf)) if (!questionIds.has(r)) errors.push(`Question ${q.id} showIf references unknown question ${r}.`);
  }
  for (const c of kb.checks) {
    if (checkIds.has(c.id)) errors.push(`Duplicate check id ${c.id}.`);
    checkIds.add(c.id);
  }
  for (const c of kb.checks) {
    const label = c.id;
    if (!/^[A-Z]+(-[A-Z0-9]+)+$/.test(c.id)) errors.push(`${label}: id format.`);
    if (!stageIds.has(c.stage)) errors.push(`${label}: unknown stage ${c.stage}.`);
    if (!ws.has(`${c.stage}:${c.workstream}`)) errors.push(`${label}: unknown workstream ${c.workstream} for stage ${c.stage}.`);
    if (!CRIT.includes(c.criticality)) errors.push(`${label}: criticality.`);
    if (!KINDS.includes(c.kind)) errors.push(`${label}: kind.`);
    for (const f of ['title', 'objective', 'why', 'expected']) if (!c[f] || String(c[f]).length < 10) errors.push(`${label}: missing or too short ${f}.`);
    if (!c.steps || c.steps.length < 1) errors.push(`${label}: no steps.`);
    if (!c.where || !c.where.length) errors.push(`${label}: no location.`);
    for (const w of c.where || []) if (!w.portal || !w.path) errors.push(`${label}: incomplete location entry.`);
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
  }
  for (const id of snippetIds) if (!usedSnippets.has(id)) warnings.push(`Snippet ${id} is not used by any check.`);
  for (const id of sourceIds) if (!usedSources.has(id)) warnings.push(`Source ${id} is not cited by any check or snippet.`);
  return { errors, warnings, stats: { checks: kb.checks.length, questions: kb.questions.length, sources: kb.sources.length, snippets: snippetIds.size } };
}

if (process.argv[1] && process.argv[1].endsWith('validate-kb.mjs')) {
  const { KB } = await import('../content/kb.mjs');
  const r = validateKb(KB);
  console.log(`KB ${KB.meta.version}: ${r.stats.checks} items, ${r.stats.questions} questions, ${r.stats.sources} sources, ${r.stats.snippets} snippets`);
  for (const w of r.warnings) console.log('warning:', w);
  for (const e of r.errors) console.log('ERROR:', e);
  if (r.errors.length) process.exit(1);
}
