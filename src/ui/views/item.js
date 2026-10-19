// The step page: what to do and why on the left, "Your record" on the right, and the way on at the bottom.
// Guidance text is rendered with rich(): links to other steps and pages, and buttons that act right here.
import { h, icon, toast, modal, field, copyText, saveBlob, externalLink, reducedMotion } from '../dom.js';
import { state, mutate, getEvidenceBlob } from '../../app/store.js';
import { route } from '../shell.js';
import { applicabilityMap } from '../../core/applicability.js';
import { effectiveStatus } from '../../core/readiness.js';
import { STATUSES, statusById, setCheckStatus, setCheckField, setApplicabilityOverride, recordGate, GATE_DECISIONS } from '../../core/model.js';
import { statusPill, critBadge, kindChip, applicabilityChip, provenanceChip, validationChip, callout, emptyState, sourceLine, btn, linkBtn, kv } from '../components.js';
import { attachFiles, addNoteEvidence, addLinkEvidence, removeEvidenceFlow } from '../actions.js';
import { formatDate, bytesLabel } from '../../core/util.js';
import { extensionFor } from '../../core/files.js';
import { editRegisterItem } from './records.js';
import { importInventoryFlow } from '../inventory.js';
import { revokeObjectUrls, trackUrl, orderedStageItems } from './work.js';
import { rich, renderSteps, renderList, renderPath } from '../rich.js';

const checkById = (id) => state.kb.checks.find((c) => c.id === id);
const stageById = (id) => state.kb.stages.find((s) => s.id === id);

// Moves focus to a field of "Your record" and briefly highlights it.
function focusRecord(key) {
  const el = document.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
  if (!el) return;
  const box = el.closest('.field') || el.closest('.gate-form') || el;
  box.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
  setTimeout(() => box.classList.remove('flash'), 1700);
}

export function downloadInventoryScript() {
  const sn = state.kb.snippets.PS_INVENTORY_SCRIPT;
  if (!sn) return;
  saveBlob(new Blob([sn.code.split('\n').join('\r\n')], { type: 'text/plain' }), 'Get-ArMoSentinelInventory.ps1', { description: 'PowerShell script', accept: { 'text/plain': ['.ps1'] } });
}

function actionsFor(c) {
  const reg = (type) => () => editRegisterItem(null, { type, checkId: c.id, title: '' });
  return {
    'add-decision': reg('decision'), 'add-risk': reg('risk'), 'add-issue': reg('issue'), 'add-action': reg('action'), 'add-exception': reg('exception'),
    'add-note': () => addNoteEvidence(c), 'add-screenshot': () => attachFiles(c, 'image'), 'add-file': () => attachFiles(c, 'file'), 'add-link': () => addLinkEvidence(c),
    'set-owner': () => focusRecord(`owner-${c.id}`), 'set-due': () => focusRecord(`due-${c.id}`), 'write-notes': () => focusRecord(`notes-${c.id}`),
    'record-gate': () => focusRecord(`gate-dec-${c.id}`),
    'import-inventory': () => importInventoryFlow(), 'download-inventory-script': () => downloadInventoryScript(),
  };
}

route('item', ({ params }) => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const c = checkById(params[0]);
  if (!c) return h('div', { class: 'page' }, emptyState('This step was not found.', 'It may have been removed from the knowledge base.', linkBtn('Back to the overview', '#/overview')));
  const stage = stageById(c.stage);
  const appMap = applicabilityMap(kb, p);
  const app = appMap.get(c.id);
  const ws = kb.workstreams.find((w) => w.stage === c.stage && w.id === c.workstream);
  const ctx = { kb, actions: actionsFor(c) };

  // The way on: the next step of this stage that applies, then the next stage.
  const list = orderedStageItems(kb, c.stage);
  const idx = list.findIndex((x) => x.id === c.id);
  const applies = (x) => appMap.get(x.id).value !== 'not_applicable';
  const prev = [...list.slice(0, idx)].reverse().find(applies) || null;
  let next = list.slice(idx + 1).find(applies) || null;
  let nextLabel = 'Next step';
  if (!next) {
    const sIdx = kb.stages.findIndex((s) => s.id === c.stage);
    const nextStage = kb.stages.slice(sIdx + 1).find((s) => !(s.id === 'test' && p.stages.test.availability === 'unavailable'));
    if (nextStage) { next = orderedStageItems(kb, nextStage.id).find(applies) || null; nextLabel = `First step of ${nextStage.short}`; }
  }

  return h('div', { class: 'page item-page' },
    h('nav', { class: 'breadcrumb', 'aria-label': 'Where this step belongs' }, h('a', { href: `#/stage/${stage.id}` }, stage.short), h('span', { 'aria-hidden': 'true' }, '›'), h('span', null, ws ? ws.title : c.workstream)),
    h('div', { class: 'item-head' },
      h('h1', { id: 'page-title', tabindex: '-1' }, c.title),
      h('div', { class: 'item-chips' }, statusPill(effectiveStatus(p, c.id)), critBadge(c.criticality), c.kind !== 'check' ? kindChip(c.kind) : null, provenanceChip(c), validationChip(c), applicabilityChip(app),
        c.changesState ? h('span', { class: 'chip chip-warn' }, icon('edit', 'icon-xs'), 'Changes configuration: follow your change process') : null),
      h('p', { class: 'item-lead' }, rich(c.objective, ctx))),
    h('div', { class: 'item-layout' },
      h('div', { class: 'item-guidance' }, guidance(c, app, ctx)),
      h('aside', { class: 'item-record', 'aria-label': 'Your record for this step' }, recordPanel(c, app))),
    h('nav', { class: 'item-nav', 'aria-label': 'Previous and next step' },
      prev ? h('a', { href: `#/item/${prev.id}`, class: 'nav-card' }, h('span', { class: 'dir' }, icon('back', 'icon-xs'), 'Previous step'), h('span', { class: 't' }, prev.title)) : h('a', { href: `#/stage/${stage.id}`, class: 'nav-card' }, h('span', { class: 'dir' }, icon('back', 'icon-xs'), 'Back to'), h('span', { class: 't' }, `All ${stage.short} steps`)),
      next ? h('a', { href: `#/item/${next.id}`, class: 'nav-card next', 'data-focus-key': 'next-step' }, h('span', { class: 'dir' }, nextLabel, icon('arrow', 'icon-xs')), h('span', { class: 't' }, next.title)) : h('a', { href: '#/overview', class: 'nav-card next' }, h('span', { class: 'dir' }, 'You reached the end', icon('arrow', 'icon-xs')), h('span', { class: 't' }, 'Back to the overview'))));
});

function section(title, iconName, ...content) {
  const body = content.flat().filter(Boolean);
  if (!body.length) return null;
  return h('section', { class: 'g-section' }, h('h2', null, iconName ? icon(iconName, 'icon-sm') : null, title), ...body);
}

function guidance(c, app, ctx) {
  const kb = state.kb;
  const why = Array.isArray(c.why) ? renderList(c.why, ctx) : h('p', null, rich(c.why, ctx));
  return h('div', null,
    applicabilitySection(c, app),
    section('Why it matters', 'info', why),
    c.caveats.length || c.validation === 'needs-review' ? section('Watch out', 'alert', callout('caution', c.validation === 'needs-review' ? 'Microsoft sources differ or are unclear here.' : null, renderList(c.caveats, ctx))) : null,
    section('Before you start', 'user',
      c.roles.length ? h('div', null, h('h3', null, 'Roles and permissions'), renderList(c.roles, ctx)) : null,
      c.prerequisites.length ? h('div', null, h('h3', null, 'Prerequisites'), renderList(c.prerequisites, ctx)) : null,
      dependenciesBlock(c)),
    section('Where', 'route',
      h('ul', { class: 'where' }, c.where.map((w) => h('li', null, h('span', { class: 'portal' }, w.portal), renderPath(w.path)))),
      c.when ? h('p', { style: { marginTop: '10px' } }, h('strong', null, 'When: '), rich(c.when, ctx)) : null),
    section('Steps', 'check', h('div', { class: 'g-panel' }, renderSteps(c.steps, ctx))),
    c.snippets.length ? section('Queries and commands', 'code', h('p', { class: 'small muted' }, 'Read each one before you run it, in the place and with the permissions shown. The assistant never runs anything itself.'), ...c.snippets.map((id) => snippetCard(id))) : null,
    section('You\'re done when', 'validate', h('p', null, rich(c.expected, ctx)),
      c.interpret.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'If you see'), h('th', { scope: 'col' }, 'What it means, and what to do'))), h('tbody', null, c.interpret.map((o) => h('tr', null, h('td', null, rich(o.outcome, ctx)), h('td', null, rich(o.meaning, ctx))))))) : null),
    section('What to record', 'edit', renderList(c.record, ctx)),
    section('Evidence that proves it', 'evidence', renderList(c.evidence, ctx)),
    c.remediation.length ? section('If it fails', 'x', renderList(c.remediation, ctx)) : null,
    c.rollback.length ? section('Rollback', 'history', renderList(c.rollback, ctx)) : null,
    c.practiceNotes.length ? section('From the field', 'users', h('p', { class: 'small muted' }, 'Practical guidance from the makers of this assistant, not official Microsoft guidance.'), renderList(c.practiceNotes, ctx)) : null,
    section('Sources', 'knowledge', h('ul', { class: 'sources' }, c.sources.map((src) => sourceLine(kb, src)))),
    h('p', { class: 'item-foot' }, `Reference ${c.id}, version ${c.version}. Last checked against Microsoft documentation on ${c.lastVerified}. ${c.provenance === 'official' ? 'Based on Microsoft documentation' : 'Practical guidance'}, confidence ${c.confidence}. Knowledge base ${kb.meta.version}.`));
}

function applicabilitySection(c, app) {
  const p = state.project;
  const st = p.checks[c.id];
  const override = st && st.override;
  if (!c.applicability && !override && app.value === 'applies') return null;
  const setOverride = async (value) => {
    const ta = h('textarea', { rows: '3', maxlength: '2000' });
    const reason = await modal({ title: value === 'applies' ? 'Keep this step in your plan' : 'Set this step aside for this project', body: h('div', { class: 'stack' }, h('p', null, 'Record the reason so reviewers understand the decision. It appears in reports and the audit log.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A reason is required.', 'bad'), null)) }] });
    if (!reason) return;
    const res = mutate((pr) => setApplicabilityOverride(pr, c.id, value, reason, state.kb.meta.version));
    if (res && !res.ok) toast(res.error, 'bad');
  };
  const head = { applies: ['check', 'This step applies to you.'], not_applicable: ['minus', 'Set aside: your answers say this does not apply.'], unknown: ['question', 'Not sure yet: your answers leave this open, so it stays in your plan.'] }[app.value];
  return section('Does this apply to you?', null,
    h('div', { class: ['applicability', `app-${app.value}`] },
      h('div', { class: 'app-row' }, icon(head[0], 'icon-sm'), h('div', null, h('strong', null, head[1]), app.reasons.length ? h('ul', { class: 'bullets small', style: { marginTop: '6px' } }, app.reasons.map((r) => h('li', null, r))) : null)),
      h('div', { class: 'row-actions', style: { marginTop: '10px' } },
        override ? btn('Remove the reviewer decision', () => mutate((pr) => setApplicabilityOverride(pr, c.id, null, '', state.kb.meta.version)), { small: true, kind: 'ghost' }) : null,
        !override && app.value !== 'applies' ? btn('Keep it in my plan', () => setOverride('applies'), { small: true }) : null,
        !override && app.value !== 'not_applicable' && c.applicability ? btn('Set it aside, with a reason', () => setOverride('not_applicable'), { small: true, kind: 'ghost' }) : null,
        p.mode === 'tailored' && c.applicability ? linkBtn('Review my answers', '#/answers', { small: true, kind: 'ghost' }) : null)));
}

function dependenciesBlock(c) {
  if (!c.dependsOn.length) return null;
  const appMap = applicabilityMap(state.kb, state.project);
  return h('div', null, h('h3', null, 'Builds on'), h('ul', { class: 'deps' }, c.dependsOn.map((id) => {
    const d = checkById(id);
    const app = appMap.get(id);
    return h('li', null, statusPill(effectiveStatus(state.project, id)), h('a', { href: `#/item/${id}` }, d ? d.title : 'Unknown step'), app && app.value === 'not_applicable' ? h('span', { class: 'small muted' }, '(set aside)') : null);
  })));
}

function snippetCard(id) {
  const sn = state.kb.snippets[id];
  if (!sn) return null;
  const ctx = { kb: state.kb };
  const copyBtn = h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => { const ok = await copyText(sn.code); toast(ok ? 'Copied to the clipboard.' : 'Copy failed. Select the text and copy it by hand.', ok ? 'good' : 'bad', 2500); } }, icon('copy', 'icon-sm'), 'Copy');
  const lines = sn.code.split('\n').length;
  const pre = h('pre', { class: 'code', tabindex: '0', 'aria-label': `${sn.title}, code` }, h('code', null, sn.code));
  return h('div', { class: 'snippet' },
    h('div', { class: 'snippet-head' },
      h('div', null, h('h3', null, sn.title),
        h('div', { class: 'item-chips' },
          h('span', { class: 'chip chip-muted mono' }, sn.language.toUpperCase()),
          sn.status === 'verbatim' ? h('span', { class: 'chip chip-accent', title: 'Copied exactly from the cited Microsoft Learn page' }, 'Microsoft sample, unchanged') : h('span', { class: 'chip chip-info', title: 'Written for this assistant from documented syntax, tables and columns' }, 'Written for this assistant, not run in a live tenant'),
          sn.readOnly ? h('span', { class: 'chip chip-good' }, icon('eye', 'icon-xs'), 'Read-only') : h('span', { class: 'chip chip-warn' }, 'Changes things'))),
      h('div', { class: 'row-actions' }, id === 'PS_INVENTORY_SCRIPT' ? h('button', { type: 'button', class: 'btn btn-sm', onclick: downloadInventoryScript }, icon('download', 'icon-sm'), 'Download .ps1') : null, copyBtn)),
    kv([['Run in', rich(sn.runIn, ctx)], ['Permissions', rich(sn.permissions, ctx)], ['Cost and performance', rich(sn.cost, ctx)]]),
    lines > 40 ? h('details', { class: 'code-details disclose' }, h('summary', null, icon('chevron', 'icon-sm'), `Show the code (${lines} lines)`), pre) : pre,
    h('p', null, h('strong', null, 'What it does: '), rich(sn.purpose, ctx)),
    sn.notDo ? h('p', null, h('strong', null, 'What it does not do: '), rich(sn.notDo, ctx)) : null,
    h('p', null, h('strong', null, 'What you should see: '), rich(sn.expected, ctx)),
    sn.caveats && sn.caveats.length ? h('div', null, h('strong', null, 'Watch out'), renderList(sn.caveats, ctx)) : null,
    h('p', { class: 'small muted' }, 'Sources: ', ...sn.sources.flatMap((sid, i) => { const src = state.kb.sources.find((x) => x.id === sid); return [i ? ', ' : '', src ? externalLink(src.url, src.title) : sid]; })));
}

const STATUS_HELP = {
  not_started: 'Nothing recorded yet.',
  in_progress: 'You are working on it.',
  passed: 'Done and proven: needs at least one piece of evidence.',
  not_verified: 'Done, but only your word for it. Reports show the difference.',
  failed: 'Checked and not OK. Say why.',
  blocked: 'You cannot continue yet. Say what blocks it.',
  needs_review: 'Someone else should look at it.',
  not_applicable: 'Does not apply here. Say why.',
};

function recordPanel(c) {
  const p = state.project;
  const st = p.checks[c.id] || { status: 'not_started', notes: '', owner: '', due: '', statusReason: '', evidenceIds: [], history: [] };
  const evidence = st.evidenceIds.map((id) => p.evidence[id]).filter(Boolean);

  const setStatus = async (status) => {
    let reason = '';
    if (['failed', 'blocked', 'not_applicable'].includes(status) && status !== st.status) {
      const ta = h('textarea', { rows: '3', maxlength: '20000' });
      reason = await modal({ title: `${statusById(status).short}: what happened?`, body: h('div', { class: 'stack' }, h('p', null, 'A short explanation. It is shown in reports.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A reason is required.', 'bad'), null)) }] });
      if (!reason) return;
    }
    if (status === 'passed' && evidence.length === 0) {
      const choice = await modal({ title: 'Passed needs evidence', body: h('div', null, h('p', null, 'A step counts as verified only with evidence: a screenshot, an observation note, a link or a file.'), h('p', null, 'Add evidence now, or record it as "Done, not verified". Reports show the difference.')), actions: [{ label: 'Cancel', value: null }, { label: 'Record as not verified', value: 'nv' }, { label: 'Add an observation note', kind: 'primary', value: 'note' }] });
      if (choice === 'note') { await addNoteEvidence(c); if ((state.project.checks[c.id] || { evidenceIds: [] }).evidenceIds.length) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
      else if (choice === 'nv') mutate((pr) => setCheckStatus(pr, c, 'not_verified', { kbVersion: state.kb.meta.version }));
      return;
    }
    const res = mutate((pr) => setCheckStatus(pr, c, status, { reason, kbVersion: state.kb.meta.version }));
    if (res && !res.ok) { toast(res.error, 'bad', 7000); return; }
    if (['passed', 'not_verified', 'not_applicable'].includes(status)) toast('Recorded. The next step is waiting at the bottom of the page.', 'good', 3500);
  };

  // Radio group pattern: one tab stop, arrow keys move focus, Enter or Space select.
  const onStatusKey = (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const btns = Array.from(e.currentTarget.querySelectorAll('[role="radio"]'));
    const i = btns.indexOf(document.activeElement);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : (i + keys[e.key] + btns.length) % btns.length;
    btns.forEach((b, j) => b.setAttribute('tabindex', j === n ? '0' : '-1'));
    btns[n].focus();
  };
  const statusGroup = h('div', { class: 'status-grid', role: 'radiogroup', 'aria-label': 'Status', onkeydown: onStatusKey }, STATUSES.map((s) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': st.status === s.id ? 'true' : 'false', tabindex: st.status === s.id ? '0' : '-1', class: ['status-opt', `tone-${s.tone}`, st.status === s.id && 'active'], 'data-focus-key': `status-${c.id}-${s.id}`, title: `${s.label}. ${STATUS_HELP[s.id]}`,
    onclick: () => setStatus(s.id),
  }, h('span', { class: ['status-ic', `pill-${s.tone}`] }, icon({ not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' }[s.id], 'icon-xs')), h('span', { class: 'status-opt-label' }, s.short))));

  const textInput = (fieldName, attrs, multiline) => {
    const el = h(multiline ? 'textarea' : 'input', { ...attrs, 'data-focus-key': `${fieldName}-${c.id}`, oninput: (e) => mutate((pr) => setCheckField(pr, c.id, fieldName, e.target.value, state.kb.meta.version), { silent: true }) });
    el.value = st[fieldName] || '';
    return el;
  };

  return h('div', { class: 'record' },
    h('div', null, h('h2', null, 'Your record'), h('div', { class: 'small muted' }, st.updatedAt ? `Last updated ${formatDate(st.updatedAt, true)} by ${st.updatedBy}` : 'Nothing recorded yet')),
    h('div', null, h('h3', null, 'Status'), statusGroup, h('p', { class: 'status-explain', style: { marginTop: '8px' } }, STATUS_HELP[st.status] || '')),
    (['failed', 'blocked', 'not_applicable', 'needs_review'].includes(st.status) || st.statusReason) ? field('Reason for this status', textInput('statusReason', { rows: '2', maxlength: '20000' }, true)) : null,
    h('div', { class: 'grid-2' }, field('Owner', textInput('owner', { type: 'text', maxlength: '200', placeholder: 'Name or team' })), field('Due date', textInput('due', { type: 'date' }))),
    field('Notes', textInput('notes', { rows: '4', maxlength: '20000', placeholder: 'What you saw, what you decided, ticket numbers' }, true), { hint: 'Your own words. Use evidence for results that prove a status.' }),
    h('div', { class: 'evidence-block' },
      h('h3', null, `Evidence (${evidence.length})`),
      evidence.length ? h('ul', { class: 'evidence-list' }, evidence.map(evidenceItem)) : h('p', { class: 'small muted' }, 'No evidence yet. A pass counts as verified only with evidence.'),
      h('div', { class: 'evidence-actions' },
        btn('Screenshot', () => attachFiles(c, 'image'), { small: true, iconName: 'image' }),
        btn('Observation', () => addNoteEvidence(c), { small: true, iconName: 'note' }),
        btn('Link', () => addLinkEvidence(c), { small: true, iconName: 'link' }),
        btn('File', () => attachFiles(c, 'file'), { small: true, iconName: 'file' }))),
    c.kind === 'gate' ? gateForm(c) : null,
    h('div', { class: 'register-actions' }, h('h3', null, 'Follow-ups for this step'),
      h('div', { class: 'row-actions' },
        btn('Decision', () => editRegisterItem(null, { type: 'decision', checkId: c.id, title: '' }), { small: true, iconName: 'gate' }),
        btn('Action', () => editRegisterItem(null, { type: 'action', checkId: c.id, title: '' }), { small: true, iconName: 'plus' }),
        btn('Risk or issue', () => editRegisterItem(null, { type: 'risk', checkId: c.id, title: '' }), { small: true, iconName: 'flag' }),
        btn('Exception', () => editRegisterItem(null, { type: 'exception', checkId: c.id, title: '' }), { small: true, iconName: 'shield' })),
      linkedRegister(c)),
    st.history.length ? h('details', { class: 'history disclose' }, h('summary', null, icon('chevron', 'icon-sm'), `History (${st.history.length})`), h('ul', { class: 'small' }, st.history.slice().reverse().slice(0, 50).map((x) => h('li', null, `${formatDate(x.at, true)}, ${x.by}, ${x.field}: ${x.from || 'empty'} → ${x.to || 'empty'}`)))) : null);
}

function linkedRegister(c) {
  const items = state.project.register.filter((r) => r.checkId === c.id);
  if (!items.length) return null;
  return h('ul', { class: 'list small', style: { marginTop: '8px' } }, items.map((r) => h('li', { class: 'list-row' }, h('button', { type: 'button', class: 'linklike', onclick: () => editRegisterItem(r) }, `${r.type[0].toUpperCase()}${r.type.slice(1)}: ${r.title}`), h('span', { class: 'chip chip-muted' }, r.status === 'accepted' ? `accepted by ${r.acceptedBy}` : r.status.replace('_', ' ')))));
}

function evidenceItem(ev) {
  const ic = { image: 'image', note: 'note', link: 'link', file: 'file' }[ev.kind];
  const meta = h('div', { class: 'small muted' }, `${formatDate(ev.createdAt, true)}, ${ev.createdBy}${ev.size ? `, ${bytesLabel(ev.size)}` : ''}${ev.origin === 'import' ? ', imported' : ''}${ev.kind === 'image' && !ev.redactionConfirmed ? ', redaction not confirmed' : ''}`);
  let preview = null;
  if (ev.kind === 'image') {
    const img = h('img', { alt: ev.title || 'Screenshot evidence', class: 'thumb' });
    getEvidenceBlob(ev.id).then((b) => { if (b) img.src = trackUrl(b); else img.replaceWith(h('span', { class: 'chip chip-bad' }, 'File content missing')); });
    preview = h('button', { type: 'button', class: 'thumb-btn', 'aria-label': `View ${ev.title}`, onclick: () => viewImage(ev) }, img);
  }
  return h('li', { class: 'evidence-item' },
    h('div', { class: 'evidence-head' }, icon(ic, 'icon-sm'), h('strong', null, ev.title || ev.fileName || 'Untitled'),
      h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove evidence ${ev.title}`, onclick: () => removeEvidenceFlow(ev) }, icon('trash', 'icon-sm'))),
    meta, preview,
    ev.kind === 'note' && ev.text ? h('p', { class: 'evidence-text' }, ev.text) : ev.text ? h('p', { class: 'small' }, ev.text) : null,
    ev.kind === 'link' && ev.url ? externalLink(ev.url, ev.url) : null,
    ev.kind === 'file' ? btn('Download', async () => {
      const b = await getEvidenceBlob(ev.id);
      if (!b) { toast('File content missing.', 'bad'); return; }
      // The extension always comes from the detected content type, never from the (untrusted) original name.
      const base = (ev.fileName || ev.id).replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9 _.-]/g, '_').slice(0, 100) || 'evidence';
      saveBlob(b, `${base}.${extensionFor(ev.mime)}`);
    }, { small: true, iconName: 'download' }) : null);
}

async function viewImage(ev) {
  const b = await getEvidenceBlob(ev.id);
  if (!b) { toast('File content missing.', 'bad'); return; }
  const u = URL.createObjectURL(b);
  await modal({ title: ev.title || 'Screenshot', wide: true, body: h('div', null, h('img', { src: u, alt: ev.title || 'Screenshot evidence', class: 'full-image' }), ev.text ? h('p', null, ev.text) : null), actions: [{ label: 'Close', value: true }] });
  URL.revokeObjectURL(u);
}

const gateDrafts = new Map(); // keeps what the user typed across re-renders (for example after a validation error)

function gateForm(c) {
  const g = state.project.gates[c.id];
  if (!gateDrafts.has(c.id)) gateDrafts.set(c.id, { decision: g ? g.decision : '', decidedBy: '', decidedRole: '', rationale: '' });
  const draft = gateDrafts.get(c.id);
  const sel = h('select', { 'data-focus-key': `gate-dec-${c.id}`, onchange: (e) => { draft.decision = e.target.value; } }, h('option', { value: '' }, 'Choose a decision'), GATE_DECISIONS.map((d) => h('option', { value: d.id, selected: draft.decision === d.id }, d.label)));
  const by = h('input', { type: 'text', maxlength: '200', value: draft.decidedBy, placeholder: 'Name of the person who decided', 'data-focus-key': `gate-by-${c.id}`, oninput: (e) => { draft.decidedBy = e.target.value; } });
  const role = h('input', { type: 'text', maxlength: '200', value: draft.decidedRole, placeholder: 'Their role', 'data-focus-key': `gate-role-${c.id}`, oninput: (e) => { draft.decidedRole = e.target.value; } });
  const rat = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'Why, under which conditions, and which exceptions apply', 'data-focus-key': `gate-rat-${c.id}`, oninput: (e) => { draft.rationale = e.target.value; } });
  rat.value = draft.rationale;
  return h('div', { class: 'gate-form', id: `gate-${c.id}` },
    h('h3', null, icon('gate', 'icon-sm'), ' Gate decision'),
    g ? callout('info', `Recorded: ${(GATE_DECISIONS.find((d) => d.id === g.decision) || {}).label}`, h('div', { class: 'small' }, `by ${g.decidedBy}${g.decidedRole ? ` (${g.decidedRole})` : ''} on ${formatDate(g.at, true)}`), g.rationale ? h('p', { class: 'small' }, g.rationale) : null) : h('p', { class: 'small muted' }, 'No decision recorded yet. You type the decision maker\'s name: the assistant never fills it in.'),
    field('Decision', sel), field('Decided by', by, { required: true }), field('Role', role), field('Why', rat),
    btn(g ? 'Record a new decision' : 'Record the decision', () => {
      // Validate on a scratch copy first so a rejected attempt does not mark the project as changed.
      const probe = recordGate({ gates: {}, audit: [], meta: {} }, c.id, draft);
      if (!probe.ok) { toast(probe.error, 'bad'); return; }
      mutate((pr) => recordGate(pr, c.id, draft));
      gateDrafts.delete(c.id);
      toast('Decision recorded.', 'good');
    }, { kind: 'primary', small: true }));
}
