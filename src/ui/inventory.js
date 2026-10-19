// UI flow for importing a read-only inventory file and turning it into evidence and suggestions.
import { h, pickFile, modal, toast, readBlobBytes } from './dom.js';
import { state, mutate, putEvidenceBlob } from '../app/store.js';
import { parseInventory, analyseInventory, MAX_INVENTORY_BYTES } from '../core/inventory.js';
import { addEvidence, setAnswer, answerLabel, addAudit, setEnvironments } from '../core/model.js';
import { sha256Hex } from '../core/files.js';
import { callout } from './components.js';

export async function importInventoryFlow() {
  const [file] = await pickFile({ accept: '.json,application/json' });
  if (!file) return;
  if (file.size > MAX_INVENTORY_BYTES) { toast('The file is larger than 5 MB and was not imported.', 'bad'); return; }
  let inv;
  let bytes;
  try {
    bytes = await readBlobBytes(file);
    inv = parseInventory(new TextDecoder('utf-8').decode(bytes));
  } catch (e) {
    await modal({ title: 'Inventory not imported', body: h('p', null, e.message), actions: [{ label: 'OK', kind: 'primary', value: true }] });
    return;
  }
  const kb = state.kb;
  const p = state.project;
  const res = analyseInventory(inv);
  const fSel = res.findings.map(() => true);
  const sSel = res.suggestions.map(() => false);
  let attachFile = true;
  const newAlias = res.label && inv.alias && !(p.meta.environments || []).some((e) => e.alias === inv.alias) ? inv.alias : '';
  let addAlias = !!newAlias;
  const qText = (id) => (kb.questions.find((q) => q.id === id) || { text: id }).text;
  const cTitle = (id) => (kb.checks.find((c) => c.id === id) || { title: id }).title;
  const body = h('div', { class: 'stack' },
    h('p', null, `Workspace ${res.label}: ${res.counts.analyticsRules} analytics rules, ${res.counts.automationRules} automation rules, ${res.counts.dataConnectors} connectors, ${res.counts.watchlists} watchlists.`),
    res.errors.length ? callout('caution', 'Some requests failed during collection.', h('ul', null, res.errors.map((e) => h('li', null, e)))) : null,
    h('h3', null, 'Add as imported evidence'),
    h('p', { class: 'small muted' }, 'Each finding you keep becomes an evidence note labelled "imported" on its step. Statuses are not changed: you decide them.'),
    h('ul', { class: 'list' }, res.findings.map((f, i) => h('li', { class: 'list-row' }, h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: true, onchange: (e) => { fSel[i] = e.target.checked; } }), h('span', null, h('strong', null, cTitle(f.checkId)), `: ${f.title.replace('Imported inventory: ', '')}`))))),
    h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: true, onchange: (e) => { attachFile = e.target.checked; } }), ` Also attach the original inventory file to "${cTitle('PREP-DET-01')}" (kept in project packages)`),
    newAlias ? h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: true, onchange: (e) => { addAlias = e.target.checked; } }), ` Add "${newAlias}" to your workspace list (Project setup)`) : null,
    res.suggestions.length ? h('div', null, h('h3', null, 'Suggested questionnaire answers'),
      h('p', { class: 'small muted' }, 'Only "Yes" answers are suggested, based on what was found in this one workspace. Tick the ones you confirm.'),
      h('ul', { class: 'list' }, res.suggestions.map((s, i) => {
        const cur = p.answers[s.questionId];
        return h('li', { class: 'list-row' }, h('label', { class: 'check-line' }, h('input', { type: 'checkbox', onchange: (e) => { sSel[i] = e.target.checked; } }), h('span', null, `${qText(s.questionId)} → ${answerLabel(s.value)}`, h('span', { class: 'small muted' }, ` (${s.reason}; currently: ${cur ? answerLabel(cur.value) : 'not answered'})`))));
      }))) : null);
  const ok = await modal({ title: 'Import inventory results', wide: true, body, actions: [{ label: 'Cancel', value: false }, { label: 'Import selected', kind: 'primary', value: true }] });
  if (!ok) return;
  let nEv = 0;
  let nAns = 0;
  const v = kb.meta.version;
  const sha = await sha256Hex(bytes);
  mutate((pr) => {
    res.findings.forEach((f, i) => {
      if (!fSel[i] || !kb.checks.some((c) => c.id === f.checkId)) return;
      addEvidence(pr, f.checkId, { kind: 'note', title: f.title, text: f.text, origin: 'import', stage: 'prepare' }, v);
      nEv += 1;
    });
    if (attachFile) {
      const ev = addEvidence(pr, 'PREP-DET-01', { kind: 'file', title: `Inventory file ${res.label}`, fileName: file.name.slice(0, 260), mime: 'application/json', size: bytes.length, sha256: sha, origin: 'import', stage: 'prepare', text: 'Original output of Get-ArMoSentinelInventory.ps1' }, v);
      putEvidenceBlob(ev.id, new Blob([bytes], { type: 'application/json' }));
    }
    res.suggestions.forEach((s, i) => {
      if (!sSel[i]) return;
      setAnswer(pr, s.questionId, s.value, `From imported inventory (${s.reason}); confirmed by ${pr.meta.operatorName || 'operator'}`);
      nAns += 1;
    });
    if (addAlias) setEnvironments(pr, [...(pr.meta.environments || []), { alias: newAlias, kind: 'production', defender: 'unknown' }]);
    addAudit(pr, 'inventory.imported', `Inventory imported for ${res.label}: ${nEv} evidence note(s), ${nAns} answer(s) applied`);
  });
  toast(`Imported ${nEv} evidence note(s)${attachFile ? ' and the inventory file' : ''}; ${nAns} answer(s) applied.`, 'good', 7000);
}
