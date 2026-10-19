// Register (actions, issues, risks, exceptions, decisions) and the evidence browser.
import { h, icon, toast, modal, confirmDialog, field, saveBlob } from '../dom.js';
import { state, mutate, getEvidenceBlob } from '../../app/store.js';
import { route, render } from '../shell.js';
import { REGISTER_TYPES, SEVERITY_IDS, REGISTER_STATUS_IDS, MAX_REGISTER_ITEMS, addRegisterItem, updateRegisterItem, acceptException, removeRegisterItem } from '../../core/model.js';
import { pageHead, btn, emptyState, callout, linkBtn } from '../components.js';
import { toCsv } from '../../core/files.js';
import { formatDate, bytesLabel, slugify } from '../../core/util.js';
import { BRAND } from '../../brand.js';
import { revokeObjectUrls, trackUrl } from './work.js';
import { importInventoryFlow } from '../inventory.js';

const regFilter = { type: 'all', status: 'open' };

export async function editRegisterItem(existing, preset = {}) {
  if (!existing && state.project.register.length >= MAX_REGISTER_ITEMS) { toast(`The register already has ${MAX_REGISTER_ITEMS} items, the maximum a package can carry.`, 'bad', 9000); return; }
  const r = existing ? { ...existing } : { type: 'action', title: '', description: '', owner: '', due: '', severity: 'medium', status: 'open', checkId: '', ...preset };
  const typeSel = h('select', { onchange: (e) => { r.type = e.target.value; drawAccept(); } }, REGISTER_TYPES.map((t) => h('option', { value: t.id, selected: r.type === t.id }, t.label)));
  const title = h('input', { type: 'text', value: r.title, maxlength: '300', oninput: (e) => { r.title = e.target.value; } });
  const desc = h('textarea', { rows: '4', maxlength: '20000', oninput: (e) => { r.description = e.target.value; } });
  desc.value = r.description || '';
  const owner = h('input', { type: 'text', value: r.owner, maxlength: '200', oninput: (e) => { r.owner = e.target.value; } });
  const due = h('input', { type: 'date', value: r.due, oninput: (e) => { r.due = e.target.value; } });
  const sev = h('select', { onchange: (e) => { r.severity = e.target.value; } }, SEVERITY_IDS.map((s) => h('option', { value: s, selected: r.severity === s }, s)));
  // "accepted" can only be set by recording a risk acceptance below; it is shown, not selectable.
  const stat = h('select', { onchange: (e) => { r.status = e.target.value; } },
    r.status === 'accepted' ? h('option', { value: 'accepted', selected: true }, 'accepted (risk acceptance recorded)') : null,
    REGISTER_STATUS_IDS.filter((s) => s !== 'accepted').map((s) => h('option', { value: s, selected: r.status === s }, s.replace('_', ' '))));
  const checkSel = h('select', { onchange: (e) => { r.checkId = e.target.value; } }, h('option', { value: '' }, '— not linked —'), state.kb.checks.map((c) => h('option', { value: c.id, selected: r.checkId === c.id }, `${c.id} — ${c.title.slice(0, 70)}`)));
  const acc = { acceptedBy: '', acceptedRole: '', rationale: '' };
  const acceptBox = h('div');
  function drawAccept() {
    acceptBox.replaceChildren();
    if (r.type !== 'exception') return;
    if (existing && existing.status === 'accepted') {
      acceptBox.append(callout('info', `Accepted by ${existing.acceptedBy}${existing.acceptedRole ? ` (${existing.acceptedRole})` : ''} on ${formatDate(existing.acceptedAt, true)}.`, h('p', { class: 'small' }, existing.rationale)));
      return;
    }
    acceptBox.append(h('div', { class: 'card card-muted stack' }, h('h3', null, 'Risk acceptance (optional now)'), h('p', { class: 'small muted' }, 'An exception counts as accepted only when the accepting person, their role and a rationale are recorded. Type the name of the person who actually accepted the risk.'),
      field('Accepted by', h('input', { type: 'text', maxlength: '200', oninput: (e) => { acc.acceptedBy = e.target.value; } })),
      field('Their role', h('input', { type: 'text', maxlength: '200', oninput: (e) => { acc.acceptedRole = e.target.value; } })),
      field('Rationale and compensating controls', h('textarea', { rows: '3', maxlength: '20000', oninput: (e) => { acc.rationale = e.target.value; } }))));
  }
  drawAccept();
  const result = await modal({
    title: existing ? 'Edit register item' : 'New register item', wide: true,
    body: h('div', { class: 'stack' },
      h('div', { class: 'grid-3' }, field('Type', typeSel), field('Severity', sev), field('Status', stat)),
      field('Title', title, { required: true }), field('Description', desc),
      h('div', { class: 'grid-3' }, field('Owner', owner), field('Due date', due), field('Linked item', checkSel)),
      acceptBox),
    actions: [
      ...(existing ? [{ label: 'Delete', kind: 'danger', value: 'delete' }] : []),
      { label: 'Cancel', value: null },
      { label: existing ? 'Save' : 'Add', kind: 'primary', value: () => (r.title.trim() ? 'save' : (toast('Please enter a title.', 'bad'), null)) },
    ],
  });
  if (result === 'delete') {
    if (await confirmDialog({ title: 'Delete this register item?', message: 'The deletion is recorded in the audit log.', confirmLabel: 'Delete', danger: true })) mutate((p) => removeRegisterItem(p, existing.id));
    return;
  }
  if (result !== 'save') return;
  mutate((p) => {
    let id = existing ? existing.id : null;
    if (existing) updateRegisterItem(p, id, r); else id = addRegisterItem(p, r).id;
    if (r.type === 'exception' && acc.acceptedBy.trim()) {
      const res = acceptException(p, id, acc);
      if (!res.ok) toast(res.error, 'bad');
    }
  });
  toast(existing ? 'Saved.' : 'Added to the register.', 'good');
}

route('register', () => {
  const p = state.project;
  const items = p.register.filter((r) => (regFilter.type === 'all' || r.type === regFilter.type) && (regFilter.status === 'all' || (regFilter.status === 'open' ? !['done', 'closed', 'accepted'].includes(r.status) : r.status === regFilter.status)));
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => rank[a.severity] - rank[b.severity] || String(a.due || '9999').localeCompare(String(b.due || '9999')));
  const exportCsv = () => {
    const csv = toCsv([
      { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' }, { key: 'due', label: 'Due' }, { key: 'checkId', label: 'Linked item' }, { key: 'acceptedBy', label: 'Accepted by' }, { key: 'acceptedRole', label: 'Accepted role' },
      { key: 'acceptedAt', label: 'Accepted at' }, { key: 'rationale', label: 'Rationale' }, { key: 'createdAt', label: 'Created' }, { key: 'createdBy', label: 'Created by' },
    ], p.register);
    saveBlob(new Blob([csv], { type: 'text/csv' }), `${BRAND.fileStem}-${slugify(p.meta.name)}-register.csv`, { description: 'CSV', accept: { 'text/csv': ['.csv'] } });
  };
  const sel = (key, options) => h('select', { onchange: (e) => { regFilter[key] = e.target.value; render(); }, 'aria-label': `Filter by ${key}` }, options.map(([v, l]) => h('option', { value: v, selected: regFilter[key] === v }, l)));
  return h('div', { class: 'page' },
    pageHead('Actions, risks & decisions', 'One register for follow-up actions, issues, risks, accepted exceptions and decisions. Exceptions count as accepted only with a named person and rationale.',
      btn('New item', () => editRegisterItem(null), { kind: 'primary', iconName: 'plus', small: true }), btn('Export CSV', exportCsv, { iconName: 'download', small: true })),
    h('div', { class: 'toolbar' }, sel('type', [['all', 'All types'], ...REGISTER_TYPES.map((t) => [t.id, t.label])]), sel('status', [['open', 'Open'], ['all', 'All statuses'], ...REGISTER_STATUS_IDS.map((s) => [s, s.replace('_', ' ')])])),
    items.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, ...['Type', 'Severity', 'Title', 'Owner', 'Due', 'Status', 'Linked item'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', null, items.map((r) => h('tr', null,
        h('td', null, (REGISTER_TYPES.find((t) => t.id === r.type) || {}).label),
        h('td', null, h('span', { class: ['badge', `badge-${r.severity}`] }, r.severity)),
        h('td', null, h('button', { type: 'button', class: 'linklike', onclick: () => editRegisterItem(r) }, r.title), r.status === 'accepted' ? h('div', { class: 'small muted' }, `Accepted by ${r.acceptedBy}${r.acceptedRole ? ` (${r.acceptedRole})` : ''}`) : null),
        h('td', null, r.owner || '—'), h('td', null, r.due || '—'), h('td', null, r.status.replace('_', ' ')),
        h('td', null, r.checkId ? h('a', { href: `#/item/${r.checkId}`, class: 'mono small' }, r.checkId) : '—'))))))
      : emptyState('Nothing here yet.', 'Add actions, risks and decisions from any item page, or create one here.'));
});

const evFilter = { kind: 'all', stage: 'all' };

route('evidence', () => {
  revokeObjectUrls();
  const p = state.project;
  const kb = state.kb;
  const list = Object.values(p.evidence).filter((e) => (evFilter.kind === 'all' || e.kind === evFilter.kind) && (evFilter.stage === 'all' || (kb.checks.find((c) => c.id === e.checkId) || {}).stage === evFilter.stage)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const totalBytes = Object.values(p.evidence).reduce((n, e) => n + (e.size || 0), 0);
  const sel = (key, options) => h('select', { onchange: (e) => { evFilter[key] = e.target.value; render(); }, 'aria-label': `Filter by ${key}` }, options.map(([v, l]) => h('option', { value: v, selected: evFilter[key] === v }, l)));
  const exportIndex = () => {
    const rows = Object.values(p.evidence).map((e) => ({ ...e, title_: e.title }));
    const csv = toCsv([{ key: 'id', label: 'Evidence ID' }, { key: 'checkId', label: 'Item' }, { key: 'kind', label: 'Kind' }, { key: 'origin', label: 'Origin' }, { key: 'title', label: 'Title' }, { key: 'fileName', label: 'File name' }, { key: 'mime', label: 'Type' }, { key: 'size', label: 'Bytes' }, { key: 'sha256', label: 'SHA-256' }, { key: 'url', label: 'Link' }, { key: 'createdAt', label: 'Created' }, { key: 'createdBy', label: 'Created by' }, { key: 'redactionConfirmed', label: 'Redaction confirmed' }], rows);
    saveBlob(new Blob([csv], { type: 'text/csv' }), `${BRAND.fileStem}-${slugify(p.meta.name)}-evidence-index.csv`, { description: 'CSV', accept: { 'text/csv': ['.csv'] } });
  };
  return h('div', { class: 'page' },
    pageHead('Evidence', `${Object.keys(p.evidence).length} evidence items · ${bytesLabel(totalBytes)} of attachments. Everything stays on this computer and in project packages you save.`, btn('Import inventory results', importInventoryFlow, { iconName: 'upload', small: true }), btn('Export evidence index (CSV)', exportIndex, { iconName: 'download', small: true })),
    h('details', { class: 'card' }, h('summary', null, 'Handling and redaction guidance'),
      h('ul', null,
        h('li', null, 'Prefer a small, cropped screenshot or a short summary over raw log exports.'),
        h('li', null, 'Remove or blur what the check does not need: tenant and subscription IDs, user names, e-mail addresses, IP addresses, incident details.'),
        h('li', null, 'Do not attach credentials, tokens, connection strings or keys — ever.'),
        h('li', null, 'Project packages are not encrypted. Store and share them under your organisation\'s data-handling policy.'),
        h('li', null, 'Evidence records the operator name and time automatically; imported evidence is labelled "imported".'))),
    h('div', { class: 'toolbar' }, sel('kind', [['all', 'All kinds'], ['image', 'Screenshots'], ['note', 'Observations'], ['link', 'Links'], ['file', 'Files']]), sel('stage', [['all', 'All stages'], ...kb.stages.map((s) => [s.id, `Stage ${s.number} ${s.short}`])])),
    list.length ? h('ul', { class: 'evidence-grid' }, list.map((e) => {
      const c = kb.checks.find((x) => x.id === e.checkId);
      let thumb = null;
      if (e.kind === 'image') {
        const img = h('img', { alt: e.title || 'Screenshot', class: 'thumb' });
        getEvidenceBlob(e.id).then((b) => { if (b) img.src = trackUrl(b); else img.replaceWith(h('span', { class: 'chip chip-bad' }, 'File content missing')); });
        thumb = img;
      }
      return h('li', { class: 'card evidence-card' },
        h('div', { class: 'evidence-head' }, icon({ image: 'image', note: 'note', link: 'link', file: 'file' }[e.kind], 'icon-sm'), h('strong', null, e.title || e.fileName)),
        thumb, e.kind === 'note' ? h('p', { class: 'evidence-text small' }, e.text.slice(0, 400)) : null,
        h('div', { class: 'small muted' }, `${formatDate(e.createdAt, true)} · ${e.createdBy}${e.origin === 'import' ? ' · imported' : ''}`),
        c ? h('a', { href: `#/item/${c.id}`, class: 'small' }, `${c.id} — ${c.title}`) : h('span', { class: 'small muted' }, e.checkId));
    })) : emptyState('No evidence yet.', 'Add screenshots, observations, links and files from item pages.'));
});
