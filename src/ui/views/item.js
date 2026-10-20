// The step page: what to do and why on the left, "Your record" on the right, and the way on at the bottom.
// Guidance text is rendered with rich(): links to other steps and pages, and buttons that act right here.
import { h, icon, toast, modal, field, copyText, saveBlob, externalLink, reducedMotion, savedPulse } from '../dom.js';
import { state, mutate, getEvidenceBlob } from '../../app/store.js';
import { route, go } from '../shell.js';
import { applicabilityMap } from '../../core/applicability.js';
import { effectiveStatus } from '../../core/readiness.js';
import { STATUSES, statusById, setCheckStatus, setCheckField, setApplicabilityOverride, recordGate, GATE_DECISIONS, setEvidenceWaiver, clearEvidenceWaiver, workstreamTeam } from '../../core/model.js';
import { statusPill, critBadge, kindChip, applicabilityChip, provenanceChip, validationChip, callout, emptyState, sourceLine, btn, linkBtn, kv } from '../components.js';
import { attachFiles, addNoteEvidence, addLinkEvidence, removeEvidenceFlow } from '../actions.js';
import { formatDate, bytesLabel } from '../../core/util.js';
import { extensionFor } from '../../core/files.js';
import { editRegisterItem } from './records.js';
import { importInventoryFlow } from '../inventory.js';
import { revokeObjectUrls, trackUrl, orderedStageItems } from './work.js';
import { rich, plain as plainText, renderSteps, renderList, renderPath } from '../rich.js';
import { TOOLS, TOOL_TITLES, peopleList } from '../tools.js';
import { saveSnapshotFlow } from './reports.js';

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
    'open-tool': () => { const t = document.getElementById('do-it-here'); if (t) { t.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }); const f0 = t.querySelector('input, select, textarea, button'); if (f0) f0.focus({ preventScroll: true }); } },
    'waive-evidence': () => waiveEvidenceFlow(c),
    'save-snapshot': () => saveSnapshotFlow({ prepare: 'prepare', test: 'test', transition: 'transition', validate: 'validate' }[c.stage] || 'final'),
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
    peopleList(),
    h('div', { class: 'item-topbar' },
      h('nav', { class: 'breadcrumb', 'aria-label': 'Where this step belongs' }, h('a', { href: `#/stage/${stage.id}` }, stage.short), h('span', { 'aria-hidden': 'true' }, '›'), h('span', null, ws ? ws.title : c.workstream)),
      h('div', { class: 'row-actions' },
        effectiveStatus(p, c.id) === 'not_started' ? h('button', { type: 'button', class: 'btn btn-sm btn-quiet', title: 'Marks this step as in progress so you can come back to it, and takes you to the next step. Nothing is blocked.', onclick: () => { mutate((pr) => setCheckStatus(pr, c, 'in_progress', { kbVersion: kb.meta.version })); savedPulse('Left for later. It stays in progress.'); go(next ? `#/item/${next.id}` : '#/overview'); } }, icon('clock', 'icon-sm'), 'Leave for now') : null,
        next ? h('a', { href: `#/item/${next.id}`, class: 'btn btn-sm', 'data-focus-key': 'next-step-top' }, 'Next step', icon('arrow', 'icon-sm')) : h('a', { href: '#/overview', class: 'btn btn-sm' }, 'Back to the overview', icon('arrow', 'icon-sm')))),
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

// Background a reader may want, folded so the page shows what to do first. The summary line previews it.
function fold(title, iconName, preview, open, ...content) {
  const body = content.flat().filter(Boolean);
  if (!body.length) return null;
  return h('details', { class: 'g-fold disclose', open: open || null },
    h('summary', null, icon('chevron', 'icon-sm'), h('span', { class: 'g-fold-title' }, iconName ? icon(iconName, 'icon-sm') : null, title), preview ? h('span', { class: 'g-fold-preview' }, preview) : null),
    h('div', { class: 'g-fold-body' }, ...body));
}
const firstSentence = (t, kb) => { const x = plainText(Array.isArray(t) ? t[0] : t, kb); const m = x.match(/^(.{0,110}?[.!?])(\s|$)/); return m ? m[1] : x.length > 110 ? `${x.slice(0, 107)}...` : x; };

function guidance(c, app, ctx) {
  const kb = state.kb;
  const why = Array.isArray(c.why) ? renderList(c.why, ctx) : h('p', null, rich(c.why, ctx));
  const needs = [...c.roles, ...c.prerequisites];
  return h('div', null,
    c.tool && TOOLS[c.tool] ? h('section', { class: 'g-section' }, h('h2', null, icon('edit', 'icon-sm'), `Do it here: ${TOOL_TITLES[c.tool]}`), h('div', { class: 'g-panel do-here', id: 'do-it-here' }, TOOLS[c.tool](c, ctx))) : null,
    c.kind === 'gate' ? h('section', { class: 'g-section' }, h('h2', null, icon('gate', 'icon-sm'), 'Do it here: record the decision'), h('div', { class: 'g-panel do-here', id: 'do-it-here' }, gateForm(c))) : null,
    applicabilitySection(c, app),
    section('Where', 'route',
      h('ul', { class: 'where' }, c.where.map((w) => h('li', null, h('span', { class: 'portal' }, w.portal), renderPath(w.path)))),
      c.when ? h('p', { style: { marginTop: '10px' } }, h('strong', null, 'When: '), rich(c.when, ctx)) : null),
    section('Steps', 'check', h('div', { class: 'g-panel' }, renderSteps(c.steps, ctx))),
    c.portalWay && c.portalWay.length ? section('No query access? Use the portal', 'route', renderList(c.portalWay, ctx)) : null,
    c.snippets.length ? section('Queries and commands', 'code', h('p', { class: 'small muted' }, 'Read each one before you run it, in the place and with the permissions shown. The assistant never runs anything itself.'), ...c.snippets.map((id) => snippetCard(id))) : null,
    section('You\'re done when', 'validate', h('p', null, rich(c.expected, ctx)),
      c.interpret.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'If you see'), h('th', { scope: 'col' }, 'What it means, and what to do'))), h('tbody', null, c.interpret.map((o) => h('tr', null, h('td', null, rich(o.outcome, ctx)), h('td', null, rich(o.meaning, ctx))))))) : null),
    section('What to record', 'edit', renderList(c.record, ctx), h('h3', null, 'Evidence that proves it'), renderList(c.evidence, ctx)),
    h('div', { class: 'g-folds' },
      fold('Why it matters', 'info', firstSentence(c.why, kb), false, why),
      needs.length || c.dependsOn.length ? fold('Before you start', 'user', needs.length ? firstSentence(needs[0], kb) : 'Earlier steps this builds on', false,
        c.roles.length ? h('div', null, h('h3', null, 'Roles and permissions'), renderList(c.roles, ctx)) : null,
        c.prerequisites.length ? h('div', null, h('h3', null, 'Prerequisites'), renderList(c.prerequisites, ctx)) : null,
        dependenciesBlock(c)) : null,
      c.caveats.length || c.validation === 'needs-review' ? fold(`Watch out (${c.caveats.length})`, 'alert', c.validation === 'needs-review' ? 'Microsoft sources differ or are unclear here.' : firstSentence(c.caveats[0], kb), c.validation === 'needs-review', callout('caution', c.validation === 'needs-review' ? 'Microsoft sources differ or are unclear here.' : null, renderList(c.caveats, ctx))) : null,
      c.remediation.length ? fold('If it fails', 'x', firstSentence(c.remediation[0], kb), false, renderList(c.remediation, ctx)) : null,
      c.rollback.length ? fold('Rollback', 'history', firstSentence(c.rollback[0], kb), false, renderList(c.rollback, ctx)) : null,
      c.practiceNotes.length ? fold('From the field', 'users', 'Practical guidance from the makers, not official Microsoft guidance.', false, renderList(c.practiceNotes, ctx)) : null,
      fold(`Sources (${c.sources.length})`, 'knowledge', 'Microsoft Learn pages this step is based on.', false, h('ul', { class: 'sources' }, c.sources.map((src) => sourceLine(kb, src))))),
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
    h('p', { class: 'snippet-purpose' }, rich(sn.purpose, ctx)),
    lines <= 12 ? pre : null,
    h('details', { class: 'code-details disclose' }, h('summary', null, icon('chevron', 'icon-sm'), lines <= 12 ? 'Where to run it, permissions and what to expect' : `Show the code (${lines} lines), where to run it and what to expect`),
      kv([['Run in', rich(sn.runIn, ctx)], ['Permissions', rich(sn.permissions, ctx)], ['Cost and performance', rich(sn.cost, ctx)]]),
      lines > 12 ? pre : null,
      sn.notDo ? h('p', null, h('strong', null, 'What it does not do: '), rich(sn.notDo, ctx)) : null,
      h('p', null, h('strong', null, 'What you should see: '), rich(sn.expected, ctx)),
      sn.caveats && sn.caveats.length ? h('div', null, h('strong', null, 'Watch out'), renderList(sn.caveats, ctx)) : null,
      h('p', { class: 'small muted' }, 'Sources: ', ...sn.sources.flatMap((sid, i) => { const src = state.kb.sources.find((x) => x.id === sid); return [i ? ', ' : '', src ? externalLink(src.url, src.title) : sid]; }))));
}

const STATUS_HELP = {
  not_started: '',
  in_progress: 'You are working on it.',
  passed: 'Done and proven: with evidence, or with a recorded reason why none is needed.',
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
  const lastStatus = [...(st.history || [])].reverse().find((x) => x.field === 'status');
  const team = workstreamTeam(p, c);
  const wsOwner = team.lead;
  const alsoInvolved = team.people.length ? ` Also in this workstream: ${team.people.map((x) => (x.covers ? `${x.name} (${x.covers})` : x.name)).join(', ')}.` : '';

  const setStatus = async (status) => {
    let reason = '';
    if (['failed', 'blocked', 'not_applicable'].includes(status) && status !== st.status) {
      const ta = h('textarea', { rows: '3', maxlength: '20000' });
      reason = await modal({ title: `${statusById(status).short}: what happened?`, body: h('div', { class: 'stack' }, h('p', null, 'A short explanation. It is shown in reports.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A reason is required.', 'bad'), null)) }] });
      if (!reason) return;
    }
    if (status === 'passed' && evidence.length === 0 && !st.evidenceWaiver) {
      const choice = await modal({ title: 'Passed needs evidence, or a reason why not', body: h('div', null, h('p', null, 'A pass is verified with evidence: a screenshot, an observation note, a link or a file.'), h('p', null, 'If your team decided this step needs no evidence, say why. Reports then show "evidence not needed", not missing evidence.')), actions: [{ label: 'Cancel', value: null }, { label: 'Done, not verified', value: 'nv' }, { label: 'No evidence needed', value: 'waive' }, { label: 'Add an observation note', kind: 'primary', value: 'note' }] });
      if (choice === 'note') { await addNoteEvidence(c); if ((state.project.checks[c.id] || { evidenceIds: [] }).evidenceIds.length) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
      else if (choice === 'waive') { if (await waiveEvidenceFlow(c)) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
      else if (choice === 'nv') mutate((pr) => setCheckStatus(pr, c, 'not_verified', { kbVersion: state.kb.meta.version }));
      return;
    }
    const res = mutate((pr) => setCheckStatus(pr, c, status, { reason, kbVersion: state.kb.meta.version }));
    if (res && !res.ok) { toast(res.error, 'bad', 7000); return; }
    if (['passed', 'not_verified', 'not_applicable'].includes(status)) savedPulse(`${statusById(status).short} recorded. Next step: top right or bottom of the page.`);
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
    h('div', null, h('h3', null, 'Status'), statusGroup, h('p', { class: 'status-explain', style: { marginTop: '8px' } }, STATUS_HELP[st.status] || ''),
      lastStatus ? h('p', { class: 'checked-by' }, icon('user', 'icon-xs'), ` Set to ${statusById(lastStatus.to).short} by ${lastStatus.by}, `, h('span', { class: 'tnum' }, formatDate(lastStatus.at, true)), '. Who checked and when is recorded for you.') : h('p', { class: 'checked-by muted' }, 'When you set a status, the assistant records who did it and when.')),
    (['failed', 'blocked', 'not_applicable', 'needs_review'].includes(st.status) || st.statusReason) ? field('Reason for this status', textInput('statusReason', { rows: '2', maxlength: '20000' }, true)) : null,
    h('div', { class: 'grid-2' }, field('Owner', textInput('owner', { type: 'text', maxlength: '200', list: 'people-list', placeholder: wsOwner || 'Name or team' }), { hint: wsOwner && !st.owner ? `From the workstream lead. Type a name to change it for this step.${alsoInvolved}` : h('span', null, `Responsible for getting it done.${alsoInvolved} `, h('a', { href: '#/item/PREP-SCOPE-02' }, 'Set owners per workstream')) }), field('Due date', textInput('due', { type: 'date' }), { hint: 'When it should be done.' })),
    field('Notes', textInput('notes', { rows: '4', maxlength: '20000', placeholder: 'What you saw, what you decided, ticket numbers' }, true), { hint: 'Your own words. Use evidence for results that prove a status.' }),
    h('div', { class: 'evidence-block' },
      h('h3', null, `Evidence (${evidence.length})`),
      evidence.length ? h('ul', { class: 'evidence-list' }, evidence.map(evidenceItem)) : st.evidenceWaiver ? null : h('p', { class: 'small muted' }, 'No evidence yet. A pass counts as verified with evidence, or when you record that none is needed.'),
      st.evidenceWaiver ? h('div', { class: 'waiver' }, icon('minus', 'icon-sm'), h('div', null, h('strong', null, 'No evidence needed for us'), h('div', { class: 'small' }, st.evidenceWaiver.reason), h('div', { class: 'small muted' }, `Decided by ${st.evidenceWaiver.by}, ${formatDate(st.evidenceWaiver.at, true)}. Reports show this as a decision, not as missing evidence.`), h('button', { type: 'button', class: 'linklike small', onclick: () => mutate((pr) => clearEvidenceWaiver(pr, c.id)) }, 'Evidence is needed after all'))) : null,
      h('div', { class: 'evidence-actions' },
        btn('Screenshot', () => attachFiles(c, 'image'), { small: true, iconName: 'image' }),
        btn('Observation', () => addNoteEvidence(c), { small: true, iconName: 'note' }),
        btn('Link', () => addLinkEvidence(c), { small: true, iconName: 'link' }),
        btn('File', () => attachFiles(c, 'file'), { small: true, iconName: 'file' }),
        !st.evidenceWaiver && !evidence.length ? btn('Not needed for us', () => waiveEvidenceFlow(c), { small: true, kind: 'ghost', iconName: 'minus' }) : null)),
    c.kind === 'gate' ? h('p', { class: 'small' }, icon('gate', 'icon-xs'), ' The decision form is at the top of this page, under ', h('a', { href: '#do-it-here', onclick: (e) => { e.preventDefault(); actionsFor(c)['open-tool'](); } }, 'Do it here'), '.') : null,
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
  const by = h('input', { type: 'text', maxlength: '200', list: 'people-list', value: draft.decidedBy, placeholder: 'Name of the person who decided', 'data-focus-key': `gate-by-${c.id}`, oninput: (e) => { draft.decidedBy = e.target.value; } });
  const role = h('input', { type: 'text', maxlength: '200', value: draft.decidedRole, placeholder: 'Their role', 'data-focus-key': `gate-role-${c.id}`, oninput: (e) => { draft.decidedRole = e.target.value; } });
  const rat = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'Why, under which conditions, and which exceptions apply', 'data-focus-key': `gate-rat-${c.id}`, oninput: (e) => { draft.rationale = e.target.value; } });
  rat.value = draft.rationale;
  return h('div', { class: 'gate-form', id: `gate-${c.id}` },
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

// "Not needed for us": the team decides this step needs no evidence, and says why.
async function waiveEvidenceFlow(c) {
  const ta = h('textarea', { rows: '3', maxlength: '2000', placeholder: 'For example: agreed in the kick-off; the result is recorded in the change record' });
  const reason = await modal({ title: 'No evidence needed for this step', body: h('div', { class: 'stack' }, h('p', null, 'Record why. Reports show "evidence not needed" with your reason, your name and the date, so a reviewer can see it was a decision, not something forgotten.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Record the decision', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('Please give a reason.', 'bad'), null)) }] });
  if (!reason) return false;
  const res = mutate((pr) => setEvidenceWaiver(pr, c.id, reason, state.kb.meta.version));
  if (res && !res.ok) { toast(res.error, 'bad'); return false; }
  savedPulse('Recorded: no evidence needed');
  return true;
}
