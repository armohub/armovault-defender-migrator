// One check in a mission: closed, it shows status, action and proof mark; open, it shows what to do,
// the step's own form, what counts as proof, and Add proof / Done / Doesn't apply.
import { h, icon } from './dom.js';
import { state } from '../app/store.js';
import { statusById } from '../core/model.js';
import { generatedProof } from '../core/generated-proof.js';
import { rich } from './rich.js';
import { btn } from './components.js';
import { TOOLS } from './tools.js';
import { attachFiles, addNoteEvidence, addLinkEvidence, addGeneratedProof } from './actions.js';
import { setStatusFlow } from './step-actions.js';
import { bindProofTarget } from './proof.js';
import { gateForm } from './views/item.js';
import { editRegisterItem } from './views/records.js';

const ICON = { not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' };

export function checkRow(row, { open, onToggle, onDone, ctx }) {
  const c = row.check;
  const p = state.project;
  const st = p.checks[c.id] || { evidenceIds: [] };
  const proofs = st.evidenceIds.filter((id) => p.evidence[id]).length;
  const proven = proofs > 0 || !!st.evidenceWaiver;
  const s = statusById(row.status);
  const head = h('button', { type: 'button', class: 'crow-head', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': `crow-${c.id}`, 'data-focus-key': `crow-${c.id}`, onclick: () => onToggle(c.id) },
    h('span', { class: ['status-ic', `pill-${s.tone}`], title: s.label }, icon(ICON[row.status] || 'circle', 'icon-xs')),
    h('span', { class: 'crow-title' }, c.short.title),
    c.scope === 'extra' ? h('span', { class: 'chip chip-muted' }, 'Good practice') : null,
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
    h('h4', null, 'Do this'),
    h('ul', { class: 'bullets' }, c.short.do.map((d) => h('li', null, rich(d, ctx)))),
    c.tool && TOOLS[c.tool] ? h('div', { class: 'crow-tool' }, TOOLS[c.tool](c, ctx)) : null,
    c.kind === 'gate' ? h('div', { class: 'crow-tool' }, gateForm(c)) : null,
    h('p', { class: 'crow-proofline' }, h('strong', null, 'Proof: '), c.short.proof, h('span', { class: 'muted' }, ' Paste a screenshot here with Ctrl+V, or drop a file.')),
    h('div', { class: 'row-actions' },
      btn('Screenshot or file', () => attachFiles(c), { small: true, iconName: 'image' }),
      btn('Note', () => addNoteEvidence(c), { small: true, iconName: 'note' }),
      btn('Link', () => addLinkEvidence(c), { small: true, iconName: 'link' }),
      canGenerate && !proofs ? btn('Use my entries as proof', () => addGeneratedProof(c), { small: true, iconName: 'check' }) : null,
      c.kind === 'decision' ? btn('Record decision', () => editRegisterItem(null, { type: 'decision', checkId: c.id, title: c.short.title }), { small: true, iconName: 'gate' }) : null,
      h('span', { class: 'grow' }),
      btn("Doesn't apply", () => setStatusFlow(c, 'not_applicable'), { small: true, kind: 'ghost' }),
      btn('Done', done, { small: true, kind: 'primary', iconName: 'check' }),
      h('a', { href: `#/item/${c.id}`, class: 'small' }, 'Details')));
  const li = h('li', { class: ['crow', 'open', `st-${row.status}`] }, head, body);
  bindProofTarget(li, c);
  return li;
}
