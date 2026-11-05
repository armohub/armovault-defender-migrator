// One check in a mission: closed, it shows status, action and proof mark; open, it shows what to do,
// the step's own form, what counts as proof, and Add proof / Done / Doesn't apply.
import { h, icon } from './dom.js';
import { getEvidenceBlob } from '../app/store.js';
import { formatDate } from '../core/util.js';
import { state } from '../app/store.js';
import { statusById } from '../core/model.js';
import { generatedProof } from '../core/generated-proof.js';
import { rich, renderSteps, renderPath } from './rich.js';
import { btn, infoTip, stepExplainer, tierBadge } from './components.js';
import { TOOLS } from './tools.js';
import { attachFiles, addNoteEvidence, addLinkEvidence, addGeneratedProof, removeEvidenceFlow } from './actions.js';
import { setStatusFlow } from './step-actions.js';
import { bindProofTarget } from './proof.js';
import { gateForm } from './views/item.js';
import { editRegisterItem } from './views/records.js';
import { trackUrl } from './views/work.js';

const KIND_ICON = { image: 'image', note: 'note', link: 'link', file: 'file' };

// The proofs already on this check, so you can see that a screenshot or note arrived without leaving the mission.
function proofList(c, evidence) {
  if (!evidence.length) return null;
  return h('div', { class: 'crow-proofs', role: 'status' },
    h('p', { class: 'crow-proofs-head' }, icon('check', 'icon-sm'), h('strong', null, `${evidence.length} proof${evidence.length === 1 ? '' : 's'} attached`), h('span', { class: 'small muted' }, ' Add more if it helps, or choose Done.')),
    h('ul', null, evidence.map((e) => {
      let thumb = h('span', { class: 'crow-proof-ic' }, icon(KIND_ICON[e.kind] || 'file', 'icon-sm'));
      if (e.kind === 'image') {
        const img = h('img', { class: 'crow-thumb', alt: '' });
        getEvidenceBlob(e.id).then((b) => { if (b && img.isConnected) img.src = trackUrl(b); });
        thumb = img;
      }
      // A finding from the inventory script: the list itself, folded under its title.
      const found = e.origin === 'import' && e.kind === 'note' && e.text ? h('details', { class: 'disclose crow-found' }, h('summary', null, icon('chevron', 'icon-xs'), 'Show what the script found'), h('pre', { class: 'crow-found-text' }, e.text.split('\n\n').slice(1).join('\n\n') || e.text)) : null;
      return h('li', { class: found ? 'with-found' : null }, thumb,
        h('span', { class: 'crow-proof-text' }, h('span', null, e.title || e.fileName || 'Proof'), h('span', { class: 'small muted' }, `${e.origin === 'import' ? 'Imported' : 'Added'} ${formatDate(e.createdAt, true)}${e.createdBy ? `, ${e.createdBy}` : ''}`)),
        h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove ${e.title || e.fileName || 'this proof'}`, onclick: () => removeEvidenceFlow(e) }, icon('trash', 'icon-sm')),
        found);
    })));
}

// "Show me how": the full step's own guidance (where to go, the numbered steps, what you should see), folded.
function howTo(c, ctx) {
  const where = (c.where || []).filter((w) => w && w.path);
  const steps = c.steps || [];
  if (!where.length && !steps.length && !c.expected) return null;
  return h('details', { class: 'disclose crow-how' },
    h('summary', null, icon('chevron', 'icon-xs'), 'Show me how, step by step'),
    h('div', { class: 'crow-how-body' },
      where.length ? h('div', null, h('h5', null, 'Where'), h('ul', { class: 'where' }, where.map((w) => h('li', null, h('span', { class: 'portal' }, w.portal), renderPath(w.path))))) : null,
      steps.length ? h('div', null, h('h5', null, 'Steps'), renderSteps(steps, ctx)) : null,
      c.expected ? h('div', null, h('h5', null, 'What you should see'), h('p', null, rich(c.expected, ctx))) : null));
}

// A check with ready-to-run queries says so, and where they are: the full step (Details) shows them with their
// purpose, cost and caveats.
function queriesHint(c) {
  const names = (c.snippets || []).map((id) => state.kb.snippets[id]).filter(Boolean).map((sn) => sn.title);
  if (!names.length) return null;
  return h('p', { class: 'small crow-queries' }, icon('search', 'icon-xs'), ` ${names.length === 1 ? 'A ready query is' : `${names.length} ready queries are`} in the full step: ${names.join('; ')}. `, h('a', { href: `#/item/${c.id}` }, 'Open them in Details'), '.');
}

const ICON = { not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' };

export function checkRow(row, { open, onToggle, onDone, ctx }) {
  const c = row.check;
  const p = state.project;
  const st = p.checks[c.id] || { evidenceIds: [] };
  const evidence = st.evidenceIds.map((id) => p.evidence[id]).filter(Boolean);
  const proofs = evidence.length;
  const proven = proofs > 0 || !!st.evidenceWaiver;
  const s = statusById(row.status);
  const head = h('button', { type: 'button', class: 'crow-head', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': `crow-${c.id}`, 'data-focus-key': `crow-${c.id}`, onclick: () => onToggle(c.id) },
    h('span', { class: ['status-ic', `pill-${s.tone}`], title: s.label }, icon(ICON[row.status] || 'circle', 'icon-xs')),
    h('span', { class: 'crow-title' }, c.short.title),
    tierBadge(c),
    h('span', { class: ['crow-proof', proven && 'yes'] }, proofs ? `${proofs} proof${proofs === 1 ? '' : 's'}` : st.evidenceWaiver ? 'No proof needed' : ''),
    icon('chevron', 'icon-sm'));
  if (!open) return h('li', { class: ['crow', `st-${row.status}`] }, head);

  const canGenerate = !!(c.tool && generatedProof(state.kb, p, c));
  const done = async () => {
    await setStatusFlow(c, 'passed');
    const after = state.project.checks[c.id];
    if (after && ['passed', 'not_verified'].includes(after.status) && onDone) onDone(c.id);
  };
  const body = h('div', { class: 'crow-body', id: `crow-${c.id}` },
    stepExplainer(c.short.info, `row-${c.id}`),
    h('h4', null, 'Do this'),
    h('ul', { class: 'bullets' }, c.short.do.map((d) => h('li', null, rich(d, ctx)))),
    howTo(c, ctx),
    queriesHint(c),
    c.tool && TOOLS[c.tool] ? h('div', { class: 'crow-tool' }, TOOLS[c.tool](c, ctx)) : null,
    c.kind === 'gate' ? h('div', { class: 'crow-tool' }, gateForm(c)) : null,
    h('p', { class: 'crow-proofline' }, h('strong', null, 'Proof: '), c.short.proof, h('span', { class: 'muted' }, ' Paste a screenshot here with Ctrl+V, or drop a file.'),
      infoTip({ key: `proof-${c.id}` , title: 'What counts as proof' }, h('p', null, 'Anything that shows the check was done: a screenshot, a short note, a link or a file. Paste a screenshot with Ctrl+V anywhere on this page, or drop a file on this check. If no proof is needed, choose Done and say why.'))),
    proofList(c, evidence),
    h('div', { class: 'row-actions' },
      btn(proofs ? 'Add another screenshot or file' : 'Screenshot or file', () => attachFiles(c), { small: true, iconName: 'image' }),
      btn(proofs ? 'Add a note' : 'Note', () => addNoteEvidence(c), { small: true, iconName: 'note' }),
      btn(proofs ? 'Add a link' : 'Link', () => addLinkEvidence(c), { small: true, iconName: 'link' }),
      canGenerate && !proofs ? btn('Use my entries as proof', () => addGeneratedProof(c), { small: true, iconName: 'check' }) : null,
      c.kind === 'decision' ? btn('Record decision', () => editRegisterItem(null, { type: 'decision', checkId: c.id, title: c.short.title }), { small: true, iconName: 'gate' }) : null,
      h('span', { class: 'grow' }),
      btn("Doesn't apply", () => setStatusFlow(c, 'not_applicable'), { small: true, kind: 'ghost' }),
      btn(proofs ? 'Done, with proof' : 'Done', done, { small: true, kind: 'primary', iconName: 'check' }),
      h('a', { href: `#/item/${c.id}`, class: 'small' }, 'Details')));
  const li = h('li', { class: ['crow', 'open', `st-${row.status}`] }, head, body);
  bindProofTarget(li, c);
  return li;
}
