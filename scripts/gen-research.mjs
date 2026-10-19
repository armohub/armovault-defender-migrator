// Generates research/source-register.md and research/coverage-matrix.md from the knowledge base,
// so the published research artefacts always match what the app shows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KB } from '../content/kb.mjs';
import { questionsUsed } from '../src/core/applicability.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const stageName = (id) => (KB.stages.find((s) => s.id === id) || {}).short || id;
const wsName = (stage, id) => (KB.workstreams.find((w) => w.stage === stage && w.id === id) || {}).title || id;

// Source register
const citing = new Map(KB.sources.map((s) => [s.id, []]));
for (const c of KB.checks) for (const s of c.sources) citing.get(s.id).push({ id: c.id, supports: s.supports });
const snippetCiting = new Map(KB.sources.map((s) => [s.id, []]));
for (const [id, sn] of Object.entries(KB.snippets)) for (const s of sn.sources) snippetCiting.get(s).push(id);

let reg = `# Source register\n\nGenerated from the knowledge base by \`scripts/gen-research.mjs\`. Do not edit by hand.\n\n`;
reg += `Knowledge base **${KB.meta.version}**, reviewed **${KB.meta.lastReviewed}**. ${KB.sources.length} sources, all Microsoft Learn. "Page date" is the ms.date shown in the page metadata; "Updated" is the page's last-publish timestamp; "Verified" is when this project last fetched and read the page.\n\n`;
reg += `Detailed research notes with verbatim quotes, confidence levels and gaps: [notes/](notes/).\n\n`;
reg += `| ID | Title | Page date | Updated | Verified | Cited by items | Cited by snippets |\n|---|---|---|---|---|---|---|\n`;
for (const s of KB.sources) {
  reg += `| \`${s.id}\` | [${md(s.title)}](${s.url}) | ${s.pageDate} | ${s.updated || ''} | ${s.verified} | ${citing.get(s.id).map((x) => x.id).join(', ')} | ${snippetCiting.get(s.id).join(', ')} |\n`;
}
reg += `\n## Claims supported by each source\n\n`;
for (const s of KB.sources) {
  const list = citing.get(s.id);
  if (!list.length) continue;
  reg += `### ${s.title}\n\n${s.url}\n\n`;
  for (const x of list) reg += `- **${x.id}**: ${x.supports}\n`;
  reg += '\n';
}
fs.writeFileSync(path.join(root, 'research/source-register.md'), reg);

// Coverage matrix
let cov = `# Coverage matrix\n\nGenerated from the knowledge base by \`scripts/gen-research.mjs\`. Do not edit by hand.\n\n`;
cov += `Maps each knowledge object to its stage, workstream, applicability questions, provenance, validation status, sources and open gaps. Knowledge base **${KB.meta.version}** (reviewed ${KB.meta.lastReviewed}).\n\n`;
cov += `Legend. Provenance: **official** = derived from current Microsoft Learn documentation; **practice** = practical guidance from the makers, not a Microsoft requirement. Validation: **docs-verified** = consistent with the cited current pages; **needs-review** = Microsoft sources conflict or are ambiguous (the gap is shown in the app).\n\n`;
const totals = { items: KB.checks.length, official: 0, practice: 0, review: 0 };
for (const c of KB.checks) { totals[c.provenance] += 1; if (c.validation === 'needs-review') totals.review += 1; }
cov += `**Totals:** ${totals.items} items · ${totals.official} official · ${totals.practice} practice · ${totals.review} needs-review · ${Object.keys(KB.snippets).length} snippets · ${KB.questions.length} questions.\n\n`;
cov += `## By workstream\n\n| Stage | Workstream | Items | Official | Practice | Needs review |\n|---|---|---|---|---|---|\n`;
for (const w of KB.workstreams) {
  const items = KB.checks.filter((c) => c.stage === w.stage && c.workstream === w.id);
  cov += `| ${stageName(w.stage)} | ${w.title} | ${items.length} | ${items.filter((c) => c.provenance === 'official').length} | ${items.filter((c) => c.provenance === 'practice').length} | ${items.filter((c) => c.validation === 'needs-review').length} |\n`;
}
cov += `\n## Item matrix\n\n| Item | Stage / workstream | Criticality | Applies when (questions) | Provenance | Validation | Sources | Open gap |\n|---|---|---|---|---|---|---|---|\n`;
for (const c of KB.checks) {
  const qs = [...questionsUsed(c.applicability)].join(', ') || 'always';
  const gap = c.validation === 'needs-review' ? md(c.caveats[0]) : '';
  cov += `| **${c.id}** ${md(c.title)} | ${stageName(c.stage)} / ${md(wsName(c.stage, c.workstream))} | ${c.criticality} | ${qs} | ${c.provenance} | ${c.validation} | ${c.sources.map((s) => `\`${s.id}\``).join(' ')} | ${gap} |\n`;
}
cov += `\n## Questions → items\n\n| Question | Items whose applicability depends on it |\n|---|---|\n`;
for (const q of KB.questions) {
  const items = KB.checks.filter((c) => questionsUsed(c.applicability).has(q.id)).map((c) => c.id);
  cov += `| \`${q.id}\` ${md(q.text)} | ${items.join(', ') || 'none (context only)'} |\n`;
}
fs.writeFileSync(path.join(root, 'research/coverage-matrix.md'), cov);
console.log('Generated research/source-register.md and research/coverage-matrix.md');
