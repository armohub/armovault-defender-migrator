// Project overview, stage pages and the item (check/task) detail view.
import { h, icon, toast, modal, confirmDialog, field, copyText, saveBlob, externalLink } from '../dom.js';
import { state, mutate, getEvidenceBlob } from '../../app/store.js';
import { go, route, render } from '../shell.js';
import { applicabilityMap } from '../../core/applicability.js';
import { assessStage, summariseStage, nextAction, dependencyStatus, CONCLUSION_CRITERIA, effectiveStatus } from '../../core/readiness.js';
import { STATUSES, statusById, setCheckStatus, setCheckField, setApplicabilityOverride, recordGate, GATE_DECISIONS, setTestAvailability, addRegisterItem, addAudit } from '../../core/model.js';
import { statusPill, critBadge, kindChip, applicabilityChip, provenanceChip, validationChip, progressBar, conclusionBadge, pageHead, callout, emptyState, sourceLine, btn, linkBtn, kv, daysUntil, STAGE_ICONS } from '../components.js';
import { attachFiles, addNoteEvidence, addLinkEvidence, removeEvidenceFlow } from '../actions.js';
import { formatDate, bytesLabel } from '../../core/util.js';
import { extensionFor } from '../../core/files.js';
import { editRegisterItem } from './records.js';
import { importInventoryFlow } from '../inventory.js';

const objectUrls = new Set();
export function revokeObjectUrls() { for (const u of objectUrls) URL.revokeObjectURL(u); objectUrls.clear(); }
// Object URLs created for thumbnails are released on the next page render.
export function trackUrl(blob) { const u = URL.createObjectURL(blob); objectUrls.add(u); return u; }

function checkById(id) { return state.kb.checks.find((c) => c.id === id); }
function stageById(id) { return state.kb.stages.find((s) => s.id === id); }

// ───────────────────────────── Overview ─────────────────────────────
route('overview', () => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const appMap = applicabilityMap(kb, p);
  const days = daysUntil('2027-03-31');
  const next = nextAction(kb, p, appMap);

  const stageCards = kb.stages.map((s) => {
    const a = assessStage(kb, p, s.id, appMap);
    const c = a.summary.counts;
    return h('div', { class: 'card stage-card' },
      h('div', { class: 'stage-card-head' }, h('span', { class: 'stage-icon' }, icon(STAGE_ICONS[s.id])), h('div', null, h('div', { class: 'small muted' }, `Stage ${s.number}${s.optional ? ' · optional' : ''}`), h('h2', null, s.title))),
      conclusionBadge(a),
      a.level === 'skipped' ? h('p', { class: 'small muted' }, a.note) : h('div', null,
        progressBar(c),
        h('p', { class: 'small' }, `${c.assessed} of ${c.inScope} in-scope items assessed`),
        h('ul', { class: 'mini-stats' },
          h('li', null, h('span', { class: 'dot dot-good' }), `${c.passed} passed`),
          h('li', null, h('span', { class: 'dot dot-bad' }), `${c.failed + c.blocked} failed or blocked`),
          h('li', null, h('span', { class: 'dot dot-caution' }), `${c.not_verified} not verified`),
          h('li', null, h('span', { class: 'dot dot-neutral' }), `${c.uncertain} uncertain`))),
      h('div', { class: 'card-actions' }, linkBtn('Open stage', `#/stage/${s.id}`, { small: true, kind: 'primary' }), linkBtn('Report', `#/report/${s.reportKind}`, { small: true, kind: 'ghost', iconName: 'reports' })));
  });

  const attention = [];
  for (const s of kb.stages) {
    const sum = summariseStage(kb, p, s.id, appMap);
    for (const i of sum.inScope) {
      const crit = i.check.criticality === 'critical' || i.check.criticality === 'high';
      if ((i.status === 'failed' || i.status === 'blocked') && crit) attention.push({ i, why: i.status === 'failed' ? 'Failed' : 'Blocked', tone: 'bad' });
      else if (i.app.value === 'unknown' && i.status === 'not_started' && crit) attention.push({ i, why: 'Applicability uncertain', tone: 'caution' });
      else if (i.status === 'needs_review') attention.push({ i, why: 'Needs review', tone: 'caution' });
    }
  }
  const openRegister = p.register.filter((r) => ['critical', 'high'].includes(r.severity) && !['done', 'closed', 'accepted'].includes(r.status));

  return h('div', { class: 'page' },
    pageHead(p.meta.name || 'Untitled project', [p.meta.organisation, p.meta.operatorName && `Operator: ${p.meta.operatorName}${p.meta.operatorRole ? ` (${p.meta.operatorRole})` : ''}`, p.mode === 'full' ? 'Full checklist' : 'Tailored checklist'].filter(Boolean).join(' · '),
      btn('Edit project details', editProjectDetails, { iconName: 'edit', small: true }),
      p.mode === 'tailored' ? linkBtn('Questionnaire', '#/questionnaire', { small: true, iconName: 'question' }) : null),
    h('div', { class: 'grid-3' },
      h('div', { class: 'card' }, h('h2', null, 'Next recommended action'),
        next ? h('div', null, h('a', { href: `#/item/${next.item.check.id}`, class: 'next-link' }, h('span', { class: 'mono small' }, next.item.check.id), ' ', next.item.check.title), h('p', { class: 'small muted' }, `Stage ${stageById(next.stageId).number} · ${next.item.check.criticality} · ${statusById(next.item.status).short}`))
          : h('p', null, 'All in-scope items have an outcome. Review reports and sign-off.')),
      h('div', { class: 'card' }, h('h2', null, 'Deadline'),
        h('p', { class: 'big-number' }, days > 0 ? `${days} days` : 'Passed'),
        h('p', { class: 'small' }, 'until 31 March 2027 — Microsoft Sentinel is supported in the Azure portal until then.'),
        h('p', { class: 'small muted' }, p.meta.windowStart ? `Your planned window: ${p.meta.windowStart}${p.meta.windowEnd ? ` → ${p.meta.windowEnd}` : ''}` : 'No transition window set yet (Edit project details).')),
      dataSafetyCard()),
    h('h2', { class: 'section-title' }, 'Stages'),
    h('div', { class: 'grid-4' }, ...stageCards),
    h('div', { class: 'grid-2' },
      h('section', { class: 'card' }, h('h2', null, 'Needs attention'),
        attention.length ? h('ul', { class: 'list' }, attention.slice(0, 12).map(({ i, why, tone }) => h('li', { class: 'list-row' },
          h('a', { href: `#/item/${i.check.id}` }, h('span', { class: 'mono small' }, i.check.id), ' ', i.check.title),
          h('span', { class: ['chip', `chip-${tone === 'bad' ? 'bad' : 'caution'}`] }, why)))) : h('p', { class: 'muted' }, 'Nothing blocking or uncertain among critical and high items right now.'),
        attention.length > 12 ? h('p', { class: 'small muted' }, `…and ${attention.length - 12} more. Use the stage filters "Needs attention".`) : null,
        openRegister.length ? h('div', null, h('h3', null, 'Open high-severity register items'), h('ul', { class: 'list' }, openRegister.slice(0, 8).map((r) => h('li', { class: 'list-row' }, h('a', { href: '#/register' }, r.title), h('span', { class: 'chip chip-caution' }, `${r.type} · ${r.severity}`))))) : null),
      h('section', { class: 'card' }, h('h2', null, 'Recent activity'),
        h('ul', { class: 'activity' }, p.audit.slice(-10).reverse().map((a) => h('li', null, h('span', { class: 'small muted' }, formatDate(a.at, true)), ' ', h('span', null, a.detail), h('span', { class: 'small muted' }, ` — ${a.by}`)))))));
});

function dataSafetyCard() {
  const p = state.project;
  const mode = state.settings.storageMode;
  const lines = [];
  if (p.isDemo) lines.push(h('p', null, 'Demo project: nothing is saved automatically.'));
  else if (mode === 'browser') lines.push(h('p', null, icon('check', 'icon-xs'), ' Autosave on — stored in this browser profile (IndexedDB).'));
  else lines.push(h('p', null, icon('alert', 'icon-xs'), ' Autosave off — your work exists only in this tab until you save a project package.'));
  lines.push(h('p', { class: 'small muted' }, state.ui.lastExport ? `Last package saved ${formatDate(state.ui.lastExport, true)}.` : 'No project package saved in this session.'));
  return h('div', { class: 'card' }, h('h2', null, 'Your data'), ...lines, linkBtn('Settings & data', '#/settings', { small: true, kind: 'ghost' }));
}

async function editProjectDetails() {
  const p = state.project;
  const m = { ...p.meta, environments: p.meta.environments.map((e) => ({ ...e })) };
  const inp = (key, attrs = {}) => h('input', { type: 'text', value: m[key] || '', oninput: (e) => { m[key] = e.target.value; }, ...attrs });
  const envBox = h('div', { class: 'stack' });
  const drawEnvs = () => {
    envBox.replaceChildren(...m.environments.map((env, i) => h('div', { class: 'env-row' },
      field('Alias', h('input', { type: 'text', value: env.alias, maxlength: '120', oninput: (e) => { env.alias = e.target.value; } })),
      field('Type', h('select', { onchange: (e) => { env.kind = e.target.value; } }, ['production', 'test', 'other'].map((k) => h('option', { value: k, selected: env.kind === k }, k)))),
      field('Notes', h('input', { type: 'text', value: env.notes, maxlength: '2000', oninput: (e) => { env.notes = e.target.value; } })),
      h('button', { type: 'button', class: 'btn-icon', 'aria-label': 'Remove environment', onclick: () => { m.environments.splice(i, 1); drawEnvs(); } }, icon('trash')))),
    btn('Add environment', () => { m.environments.push({ alias: '', kind: 'production', notes: '' }); drawEnvs(); }, { small: true, iconName: 'plus' }));
  };
  drawEnvs();
  const ok = await modal({
    title: 'Project details', wide: true,
    body: h('div', { class: 'stack' },
      field('Project label', inp('name', { maxlength: '200' }), { required: true }),
      field('Organisation', inp('organisation', { maxlength: '200' })),
      h('div', { class: 'grid-2' }, field('Operator name', inp('operatorName', { maxlength: '200' }), { required: true, hint: 'Used for new records from now on. Existing records keep the name they were recorded with.' }), field('Operator role', inp('operatorRole', { maxlength: '200' }))),
      h('div', { class: 'grid-3' }, field('Start date', inp('startDate', { type: 'date' })), field('Window from', inp('windowStart', { type: 'date' })), field('Window to', inp('windowEnd', { type: 'date' }))),
      h('h3', null, 'Environments (aliases only)'), envBox,
      field('Project notes', h('textarea', { rows: '3', maxlength: '20000', oninput: (e) => { m.notes = e.target.value; } }, m.notes || ''))),
    actions: [{ label: 'Cancel', value: false }, { label: 'Save details', kind: 'primary', value: () => (m.name.trim() && m.operatorName.trim() ? true : (toast('Project label and operator name are required.', 'bad'), null)) }],
  });
  if (!ok) return;
  mutate((pr) => {
    const changed = ['name', 'organisation', 'operatorName', 'operatorRole', 'startDate', 'windowStart', 'windowEnd'].filter((k) => (pr.meta[k] || '') !== (m[k] || ''));
    Object.assign(pr.meta, { name: m.name.trim(), organisation: m.organisation.trim(), operatorName: m.operatorName.trim(), operatorRole: m.operatorRole.trim(), startDate: m.startDate, windowStart: m.windowStart, windowEnd: m.windowEnd, notes: m.notes || '', environments: m.environments.filter((e) => e.alias.trim()).map((e) => ({ alias: e.alias.trim(), kind: e.kind, notes: (e.notes || '').trim() })) });
    addAudit(pr, 'project.details', `Project details updated${changed.length ? ` (${changed.join(', ')})` : ''}`);
  });
  toast('Project details saved.', 'good');
}

// ───────────────────────────── Stage page ─────────────────────────────
const stageFilters = new Map(); // stageId -> { filter, query }

route('stage', ({ params }) => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const stage = stageById(params[0]) || kb.stages[0];
  const appMap = applicabilityMap(kb, p);
  const a = assessStage(kb, p, stage.id, appMap);
  const f = stageFilters.get(stage.id) || { filter: 'inscope', query: '' };
  stageFilters.set(stage.id, f);

  const matches = (i) => {
    if (f.query) {
      const q = f.query.toLowerCase();
      if (!(`${i.check.id} ${i.check.title} ${i.check.objective}`.toLowerCase().includes(q))) return false;
    }
    if (f.filter === 'inscope') return i.inScope;
    if (f.filter === 'attention') return i.inScope && (['failed', 'blocked', 'needs_review', 'not_verified'].includes(i.status) || (i.app.value === 'unknown' && i.status === 'not_started'));
    if (f.filter === 'na') return !i.inScope;
    return true;
  };

  const groups = kb.workstreams.filter((w) => w.stage === stage.id).map((w) => ({ w, items: a.summary.items.filter((i) => i.check.workstream === w.id && matches(i)).sort((x, y) => x.check.order - y.check.order) })).filter((g) => g.items.length);

  const filterBtn = (id, label, count) => h('button', { type: 'button', class: ['seg-btn', f.filter === id && 'active'], 'aria-pressed': f.filter === id ? 'true' : 'false', onclick: () => { f.filter = id; render(); } }, label, h('span', { class: 'seg-count' }, String(count)));
  const counts = {
    inscope: a.summary.items.filter((i) => i.inScope).length,
    attention: a.summary.items.filter((i) => i.inScope && (['failed', 'blocked', 'needs_review', 'not_verified'].includes(i.status) || (i.app.value === 'unknown' && i.status === 'not_started'))).length,
    na: a.summary.items.filter((i) => !i.inScope).length,
    all: a.summary.items.length,
  };

  let seq = 0;
  return h('div', { class: 'page' },
    pageHead(`Stage ${stage.number} · ${stage.title}`, stage.purpose,
      stage.id === 'prepare' ? btn('Import inventory results', importInventoryFlow, { iconName: 'upload', small: true, title: 'Import the JSON produced by the read-only inventory script (see PREP-DET-01)' }) : null,
      linkBtn(`Open ${stage.deliverable.toLowerCase()}`, `#/report/${stage.reportKind}`, { iconName: 'reports', small: true })),
    stage.id === 'test' ? testAvailabilityPanel(appMap) : null,
    conclusionPanel(a),
    h('div', { class: 'toolbar' },
      h('div', { class: 'seg-group', role: 'group', 'aria-label': 'Filter items' }, filterBtn('inscope', 'In scope', counts.inscope), filterBtn('attention', 'Needs attention', counts.attention), filterBtn('na', 'Not applicable', counts.na), filterBtn('all', 'All', counts.all)),
      h('label', { class: 'search' }, icon('search', 'icon-sm'), h('span', { class: 'sr-only' }, 'Search items'), h('input', { type: 'search', placeholder: 'Search this stage', value: f.query, 'data-focus-key': `search-${stage.id}`, oninput: (e) => { f.query = e.target.value; render(); } }))),
    groups.length ? groups.map(({ w, items }) => h('section', { class: 'ws-group' },
      h('h2', { class: 'ws-title' }, w.title, h('span', { class: 'ws-count' }, `${items.filter((i) => ['passed', 'not_verified', 'failed', 'not_applicable'].includes(i.status)).length}/${items.length}`)),
      h('ul', { class: 'item-list' }, items.map((i) => { seq += 1; return itemRow(i, appMap, stage.id === 'transition' ? seq : null); }))))
      : emptyState('No items match this filter.', f.filter === 'na' ? 'Every item applies to your environment.' : 'Try another filter or clear the search.'));
});

function itemRow(i, appMap, seq) {
  const c = i.check;
  const deps = (c.dependsOn || []).length ? dependencyStatus(state.kb, state.project, c, appMap) : null;
  const st = state.project.checks[c.id];
  return h('li', { class: ['item-row', !i.inScope && 'muted-row'] },
    h('a', { href: `#/item/${c.id}`, class: 'item-link' },
      seq ? h('span', { class: 'seq', 'aria-label': `Step ${seq}` }, String(seq)) : null,
      statusPill(i.status),
      h('span', { class: 'item-main' },
        h('span', { class: 'item-title' }, h('span', { class: 'mono small muted' }, c.id), ' ', c.title),
        h('span', { class: 'item-meta' },
          critBadge(c.criticality),
          c.kind !== 'check' ? kindChip(c.kind) : null,
          applicabilityChip(i.app),
          c.validation === 'needs-review' ? h('span', { class: 'chip chip-caution', title: 'Microsoft sources conflict or are ambiguous' }, icon('alert', 'icon-xs'), 'Review') : null,
          c.changesState ? h('span', { class: 'chip chip-warn', title: 'Changes configuration in your environment' }, icon('edit', 'icon-xs'), 'Changes config') : null,
          deps && deps.problems.length ? h('span', { class: 'chip chip-bad', title: deps.problems.map((d) => `${d.id}: ${d.status}`).join('\n') }, icon('block', 'icon-xs'), `Prerequisite ${deps.problems[0].status}`) : null,
          deps && !deps.problems.length && deps.pending.length ? h('span', { class: 'chip chip-muted', title: deps.pending.map((d) => d.id).join(', ') }, `${deps.pending.length} prerequisite(s) open`) : null,
          i.evidence ? h('span', { class: 'chip chip-muted' }, icon('evidence', 'icon-xs'), String(i.evidence)) : null,
          st && st.owner ? h('span', { class: 'small muted' }, icon('user', 'icon-xs'), st.owner) : null)),
      icon('chevron', 'icon-sm chevron')));
}

function conclusionPanel(a) {
  if (a.level === 'skipped') return null;
  const r = a.reasons;
  const list = (title, items, tone) => items.length ? h('div', null, h('h3', null, title, ` (${items.length})`), h('ul', { class: 'reason-list' }, items.slice(0, 15).map((x) => h('li', null, checkById(x.id) ? h('a', { href: `#/item/${x.id}` }, x.text) : x.text))), items.length > 15 ? h('p', { class: 'small muted' }, `…and ${items.length - 15} more`) : null) : null;
  return h('section', { class: 'card conclusion-card' },
    h('div', { class: 'conclusion-row' }, h('div', null, h('div', { class: 'small muted' }, 'Current conclusion (computed from your records)'), conclusionBadge(a)), progressBar(a.summary.counts)),
    h('details', null, h('summary', null, 'Why this conclusion, and how it is decided'),
      list('Blocking', r.blocking), list('Not yet determined', r.undetermined), list('Exceptions and assertions', r.exceptions), list('Other open items', r.open),
      h('h3', null, 'Criteria'), h('ul', { class: 'small' }, CONCLUSION_CRITERIA.map((c) => h('li', null, c))),
      h('p', { class: 'small muted' }, 'A conclusion is never "ready" just because fields are filled in: critical items need evidence or a named, accepted exception. The gate decision is always yours.')));
}

function testAvailabilityPanel(appMap) {
  const p = state.project;
  const t = p.stages.test;
  const kb = state.kb;
  const setAvail = async (v) => {
    let reason = '';
    if (v === 'unavailable') {
      const ta = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'For example: no non-production tenant with Sentinel exists' });
      reason = await modal({ title: 'No suitable test environment', body: h('div', { class: 'stack' }, h('p', null, 'Record why. The reports state this and list compensating controls; you are not penalised for lacking a test environment, but production carries more risk.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('Please enter a reason.', 'bad'), null)) }] });
      if (!reason) return;
    }
    const res = mutate((pr) => setTestAvailability(pr, v, reason));
    if (res && !res.ok) toast(res.error, 'bad');
  };
  const testable = kb.checks.filter((c) => c.stage === 'prepare' && c.testable && appMap.get(c.id).value !== 'not_applicable');
  return h('section', { class: 'card' },
    h('h2', null, 'Is a suitable test environment available?'),
    h('div', { class: 'seg-group', role: 'group', 'aria-label': 'Test environment availability' },
      ['undecided', 'available', 'unavailable'].map((v) => h('button', { type: 'button', class: ['seg-btn', t.availability === v && 'active'], 'aria-pressed': t.availability === v ? 'true' : 'false', onclick: () => setAvail(v) }, { undecided: 'Not decided', available: 'Yes — use the test stage', unavailable: 'No — skip with reason' }[v]))),
    t.availability === 'unavailable' ? callout('caution', 'Test stage marked unavailable.', ` Reason: ${t.reason} (recorded by ${t.decidedBy}, ${formatDate(t.decidedAt)}). Compensating controls to apply in Stage 2: complete baselines (PREP-CON-04/05), staged pre-change automation updates (TRN-04), an attended change window with an incident-queue monitor (TRN-01), hypercare monitoring (TRN-16) and a prepared rollback (PREP-PLN-03).`) : null,
    t.availability === 'available' ? h('details', { open: true }, h('summary', null, `Testable Stage 1 items for your environment (${testable.length})`),
      h('p', { class: 'small muted' }, 'Use these to scope the test plan (TEST-02). Failed or uncertain items are the best candidates.'),
      h('ul', { class: 'item-list compact' }, testable.map((c) => h('li', { class: 'item-row' }, h('a', { href: `#/item/${c.id}`, class: 'item-link' }, statusPill(effectiveStatus(p, c.id)), h('span', { class: 'item-main' }, h('span', { class: 'item-title' }, h('span', { class: 'mono small muted' }, c.id), ' ', c.title)), critBadge(c.criticality)))))) : null);
}

// ───────────────────────────── Item detail ─────────────────────────────
route('item', ({ params }) => {
  revokeObjectUrls();
  const kb = state.kb;
  const p = state.project;
  const c = checkById(params[0]);
  if (!c) return h('div', { class: 'page' }, emptyState('Item not found.', 'It may have been removed from the knowledge base.', linkBtn('Back to overview', '#/overview')));
  const stage = stageById(c.stage);
  const appMap = applicabilityMap(kb, p);
  const app = appMap.get(c.id);
  const ws = kb.workstreams.find((w) => w.stage === c.stage && w.id === c.workstream);
  const stageItems = kb.checks.filter((x) => x.stage === c.stage).sort((x, y) => (kb.workstreams.findIndex((w) => w.stage === x.stage && w.id === x.workstream) - kb.workstreams.findIndex((w) => w.stage === y.stage && w.id === y.workstream)) || x.order - y.order);
  const idx = stageItems.findIndex((x) => x.id === c.id);
  const prev = stageItems[idx - 1];
  const next = stageItems[idx + 1];

  return h('div', { class: 'page item-page' },
    h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' }, h('a', { href: `#/stage/${stage.id}` }, `Stage ${stage.number} · ${stage.short}`), h('span', { 'aria-hidden': 'true' }, ' / '), h('span', null, ws ? ws.title : c.workstream)),
    h('div', { class: 'item-head' },
      h('h1', { id: 'page-title', tabindex: '-1' }, c.title),
      h('div', { class: 'item-chips' }, h('span', { class: 'mono chip chip-muted' }, c.id), critBadge(c.criticality), kindChip(c.kind), provenanceChip(c), validationChip(c), applicabilityChip(app),
        c.changesState ? h('span', { class: 'chip chip-warn' }, icon('edit', 'icon-xs'), 'Changes configuration — follow your change process') : null)),
    h('div', { class: 'item-layout' },
      h('div', { class: 'item-guidance' }, guidance(c, app)),
      h('aside', { class: 'item-record', 'aria-label': 'Your record for this item' }, recordPanel(c, app, appMap))),
    h('div', { class: 'item-nav' },
      prev ? linkBtn(`${prev.id}`, `#/item/${prev.id}`, { iconName: 'back', small: true }) : h('span'),
      next ? h('a', { href: `#/item/${next.id}`, class: 'btn btn-sm' }, `${next.id}`, icon('chevron', 'icon-sm')) : h('span')));
});

function section(title, ...content) {
  const body = content.flat().filter(Boolean);
  if (!body.length) return null;
  return h('section', { class: 'g-section' }, h('h2', null, title), ...body);
}
const listOf = (items, ordered = false) => (items && items.length ? h(ordered ? 'ol' : 'ul', { class: ordered ? 'steps' : 'bullets' }, items.map((x) => h('li', null, x))) : null);

function guidance(c, app) {
  const kb = state.kb;
  return h('div', null,
    h('p', { class: 'objective' }, c.objective),
    section('Why it matters', h('p', null, c.why)),
    applicabilitySection(c, app),
    c.caveats.length || c.validation === 'needs-review' ? h('section', { class: 'g-section' }, callout('caution', c.validation === 'needs-review' ? 'Uncertainty — Microsoft sources conflict or are ambiguous' : 'Caveats', listOf(c.caveats))) : null,
    section('Before you start', c.roles.length ? h('div', null, h('h3', null, 'Roles and permissions'), listOf(c.roles)) : null, c.prerequisites.length ? h('div', null, h('h3', null, 'Prerequisites'), listOf(c.prerequisites)) : null, dependenciesBlock(c)),
    section('Where and when', h('ul', { class: 'where' }, c.where.map((w) => h('li', null, h('strong', null, `${w.portal}: `), w.path))), c.when ? h('p', null, h('strong', null, 'When: '), c.when) : null),
    section('Steps', listOf(c.steps, true)),
    c.snippets.length ? section('Queries and commands', h('p', { class: 'small muted' }, 'Review every snippet before running it, in the location shown, with the permissions shown. Snippets are never run by this app.'), ...c.snippets.map((id) => snippetCard(id))) : null,
    section('Expected result', h('p', null, c.expected), c.interpret.length ? h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'If you see'), h('th', { scope: 'col' }, 'It means / do this'))), h('tbody', null, c.interpret.map((o) => h('tr', null, h('td', null, o.outcome), h('td', null, o.meaning))))) : null),
    section('What to record', listOf(c.record), c.evidence.length ? h('div', null, h('h3', null, 'Suggested evidence'), listOf(c.evidence)) : null),
    c.remediation.length ? section('If it fails', listOf(c.remediation)) : null,
    c.rollback.length ? section('Rollback / contingency', listOf(c.rollback)) : null,
    c.practiceNotes.length ? section('Practical notes', h('p', { class: 'small muted' }, 'Practical guidance from the makers of this tool — not official Microsoft guidance.'), listOf(c.practiceNotes)) : null,
    section('Sources', h('ul', { class: 'sources' }, c.sources.map((s) => sourceLine(kb, s)))),
    h('p', { class: 'small muted item-foot' }, `Knowledge object ${c.id} v${c.version} · last verified ${c.lastVerified} · ${c.provenance === 'official' ? 'derived from Microsoft documentation' : 'practical guidance'} · confidence ${c.confidence} · knowledge base ${kb.meta.version}`));
}

function applicabilitySection(c, app) {
  const p = state.project;
  const st = p.checks[c.id];
  const override = st && st.override;
  const setOverride = async (value) => {
    const ta = h('textarea', { rows: '3', maxlength: '2000' });
    const reason = await modal({ title: value === 'applies' ? 'Mark as applicable' : 'Mark as not applicable for this project', body: h('div', { class: 'stack' }, h('p', null, 'Record the reason so reviewers can understand the decision. It appears in reports and the audit log.'), field('Reason', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save decision', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A reason is required.', 'bad'), null)) }] });
    if (!reason) return;
    const res = mutate((pr) => setApplicabilityOverride(pr, c.id, value, reason, state.kb.meta.version));
    if (res && !res.ok) toast(res.error, 'bad');
  };
  return h('section', { class: 'g-section' }, h('h2', null, 'Does this apply to you?'),
    h('div', { class: ['applicability', `app-${app.value}`] },
      h('p', null, h('strong', null, { applies: 'Applies.', not_applicable: 'Does not apply based on your answers.', unknown: 'Uncertain — needs investigation.' }[app.value]), ' '),
      listOf(app.reasons),
      h('div', { class: 'row-actions' },
        override ? btn('Remove reviewer decision', () => mutate((pr) => setApplicabilityOverride(pr, c.id, null, '', state.kb.meta.version)), { small: true, kind: 'ghost' }) : null,
        !override && app.value !== 'applies' ? btn('Reconsider: mark as applicable', () => setOverride('applies'), { small: true }) : null,
        !override && app.value !== 'not_applicable' && c.applicability ? btn('Mark not applicable for this project', () => setOverride('not_applicable'), { small: true, kind: 'ghost' }) : null,
        p.mode === 'tailored' && c.applicability ? linkBtn('Review answers', '#/questionnaire', { small: true, kind: 'ghost' }) : null)));
}

function dependenciesBlock(c) {
  if (!c.dependsOn.length) return null;
  const appMap = applicabilityMap(state.kb, state.project);
  return h('div', null, h('h3', null, 'Depends on'), h('ul', { class: 'deps' }, c.dependsOn.map((id) => {
    const d = checkById(id);
    const app = appMap.get(id);
    return h('li', null, statusPill(effectiveStatus(state.project, id)), ' ', h('a', { href: `#/item/${id}` }, `${id} — ${d ? d.title : ''}`), app && app.value === 'not_applicable' ? h('span', { class: 'small muted' }, ' (not applicable)') : null);
  })));
}

function snippetCard(id) {
  const s = state.kb.snippets[id];
  if (!s) return null;
  const copyBtn = h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => { const ok = await copyText(s.code); toast(ok ? 'Copied to clipboard.' : 'Copy failed — select the text manually.', ok ? 'good' : 'bad', 2500); } }, icon('copy', 'icon-sm'), 'Copy');
  return h('div', { class: 'snippet' },
    h('div', { class: 'snippet-head' },
      h('div', null, h('h3', null, s.title),
        h('div', { class: 'item-chips' },
          h('span', { class: 'chip chip-muted mono' }, s.language.toUpperCase()),
          s.status === 'verbatim' ? h('span', { class: 'chip chip-accent', title: 'Copied exactly from the cited Microsoft Learn page' }, 'Verbatim Microsoft sample') : h('span', { class: 'chip chip-info', title: 'Written for this project from documented syntax, tables and columns' }, 'Composed — not run in a live tenant by the authors'),
          s.readOnly ? h('span', { class: 'chip chip-good' }, icon('eye', 'icon-xs'), 'Read-only') : h('span', { class: 'chip chip-warn' }, 'Changes state'))),
      h('div', { class: 'row-actions' }, id === 'PS_INVENTORY_SCRIPT' ? h('button', { type: 'button', class: 'btn btn-sm', onclick: () => saveBlob(new Blob([s.code.split('\n').join('\r\n')], { type: 'text/plain' }), 'Get-ArMoSentinelInventory.ps1', { description: 'PowerShell script', accept: { 'text/plain': ['.ps1'] } }) }, icon('download', 'icon-sm'), 'Download .ps1') : null, copyBtn)),
    kv([['Run in', s.runIn], ['Permissions', s.permissions], ['Cost / performance', s.cost]]),
    s.code.split('\n').length > 40
      ? h('details', { class: 'code-details' }, h('summary', null, `Show code (${s.code.split('\n').length} lines)`), h('pre', { class: 'code', tabindex: '0', 'aria-label': `${s.title} code` }, h('code', null, s.code)))
      : h('pre', { class: 'code', tabindex: '0', 'aria-label': `${s.title} code` }, h('code', null, s.code)),
    h('p', null, h('strong', null, 'What it does: '), s.purpose),
    s.notDo ? h('p', null, h('strong', null, 'What it does not do: '), s.notDo) : null,
    h('p', null, h('strong', null, 'Expected output: '), s.expected),
    s.caveats && s.caveats.length ? h('div', null, h('strong', null, 'Caveats'), listOf(s.caveats)) : null,
    h('p', { class: 'small muted' }, 'Sources: ', ...s.sources.flatMap((sid, i) => { const src = state.kb.sources.find((x) => x.id === sid); return [i ? ', ' : '', src ? externalLink(src.url, src.title) : sid]; })));
}

function recordPanel(c, app, appMap) {
  const p = state.project;
  const st = p.checks[c.id] || { status: 'not_started', notes: '', owner: '', due: '', statusReason: '', evidenceIds: [], history: [] };
  const evidence = st.evidenceIds.map((id) => p.evidence[id]).filter(Boolean);

  const setStatus = async (status) => {
    let reason = '';
    if (['failed', 'blocked', 'not_applicable'].includes(status) && status !== st.status) {
      const ta = h('textarea', { rows: '3', maxlength: '20000' });
      reason = await modal({ title: `${statusById(status).label}: rationale`, body: h('div', { class: 'stack' }, h('p', null, 'Briefly explain this status. It is shown in reports.'), field('Rationale', ta, { required: true })), actions: [{ label: 'Cancel', value: null }, { label: 'Save', kind: 'primary', value: () => (ta.value.trim() ? ta.value.trim() : (toast('A rationale is required.', 'bad'), null)) }] });
      if (!reason) return;
    }
    if (status === 'passed' && evidence.length === 0) {
      const choice = await modal({ title: 'Evidence required for "Passed — verified"', body: h('div', null, h('p', null, 'A pass counts as verified only with evidence: a screenshot, an observation note, a link or a file.'), h('p', null, 'Add evidence now, or record the item as "Done — not verified (user assertion only)". Reports show the difference.')), actions: [{ label: 'Cancel', value: null }, { label: 'Record as not verified', value: 'nv' }, { label: 'Add an observation note', kind: 'primary', value: 'note' }] });
      if (choice === 'note') { await addNoteEvidence(c); if ((state.project.checks[c.id] || { evidenceIds: [] }).evidenceIds.length) mutate((pr) => setCheckStatus(pr, c, 'passed', { kbVersion: state.kb.meta.version })); }
      else if (choice === 'nv') mutate((pr) => setCheckStatus(pr, c, 'not_verified', { kbVersion: state.kb.meta.version }));
      return;
    }
    const res = mutate((pr) => setCheckStatus(pr, c, status, { reason, kbVersion: state.kb.meta.version }));
    if (res && !res.ok) toast(res.error, 'bad', 7000);
  };

  // Radio group pattern: one tab stop, arrow keys move focus, Enter/Space select.
  const onStatusKey = (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const btns = Array.from(e.currentTarget.querySelectorAll('[role="radio"]'));
    const i = btns.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : (i + keys[e.key] + btns.length) % btns.length;
    btns.forEach((b, j) => b.setAttribute('tabindex', j === next ? '0' : '-1'));
    btns[next].focus();
  };
  const statusGroup = h('div', { class: 'status-grid', role: 'radiogroup', 'aria-label': 'Status', onkeydown: onStatusKey }, STATUSES.map((s) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': st.status === s.id ? 'true' : 'false', tabindex: st.status === s.id ? '0' : '-1', class: ['status-opt', `tone-${s.tone}`, st.status === s.id && 'active'], 'data-focus-key': `status-${c.id}-${s.id}`, title: s.label,
    onclick: () => setStatus(s.id),
  }, h('span', { class: ['status-ic', `pill-${s.tone}`] }, icon({ not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' }[s.id], 'icon-xs')), h('span', { class: 'status-opt-label' }, s.label))));

  const textInput = (fieldName, attrs, multiline) => {
    const el = h(multiline ? 'textarea' : 'input', { ...attrs, 'data-focus-key': `${fieldName}-${c.id}`, oninput: (e) => mutate((pr) => setCheckField(pr, c.id, fieldName, e.target.value, state.kb.meta.version), { silent: true }) });
    if (multiline) el.value = st[fieldName] || ''; else el.value = st[fieldName] || '';
    return el;
  };

  return h('div', { class: 'record' },
    h('h2', null, 'Your record'),
    h('div', { class: 'small muted' }, st.updatedAt ? `Last updated ${formatDate(st.updatedAt, true)} by ${st.updatedBy}` : 'Not started yet'),
    statusGroup,
    (['failed', 'blocked', 'not_applicable', 'needs_review'].includes(st.status) || st.statusReason) ? field('Status rationale', textInput('statusReason', { rows: '2', maxlength: '20000' }, true)) : null,
    h('div', { class: 'grid-2' }, field('Owner', textInput('owner', { type: 'text', maxlength: '200', placeholder: 'Name or team' })), field('Due date', textInput('due', { type: 'date' }))),
    field('Notes', textInput('notes', { rows: '4', maxlength: '20000', placeholder: 'Observations, decisions, links to tickets…' }, true), { hint: 'Notes are your own text. Use evidence items for results that support a status.' }),
    h('div', { class: 'evidence-block' },
      h('h3', null, `Evidence (${evidence.length})`),
      evidence.length ? h('ul', { class: 'evidence-list' }, evidence.map(evidenceItem)) : h('p', { class: 'small muted' }, 'No evidence yet. A pass is "verified" only with evidence.'),
      h('div', { class: 'evidence-actions' },
        btn('Screenshot', () => attachFiles(c, 'image'), { small: true, iconName: 'image' }),
        btn('Observation', () => addNoteEvidence(c), { small: true, iconName: 'note' }),
        btn('Link', () => addLinkEvidence(c), { small: true, iconName: 'link' }),
        btn('File', () => attachFiles(c, 'file'), { small: true, iconName: 'file' }))),
    c.kind === 'gate' ? gateForm(c) : null,
    h('div', { class: 'register-actions' }, h('h3', null, 'Track follow-up'),
      h('div', { class: 'row-actions' },
        btn('Add action', () => editRegisterItem(null, { type: 'action', checkId: c.id, title: `${c.id}: ` }), { small: true, iconName: 'plus' }),
        btn('Record risk / issue', () => editRegisterItem(null, { type: 'risk', checkId: c.id, title: `${c.id}: ` }), { small: true, iconName: 'flag' }),
        btn('Record exception', () => editRegisterItem(null, { type: 'exception', checkId: c.id, title: `${c.id}: ` }), { small: true, iconName: 'shield' })),
      linkedRegister(c)),
    st.history.length ? h('details', { class: 'history' }, h('summary', null, `History (${st.history.length})`), h('ul', { class: 'small' }, st.history.slice().reverse().slice(0, 50).map((x) => h('li', null, `${formatDate(x.at, true)} · ${x.by} · ${x.field}: ${x.from || '—'} → ${x.to || '—'}`)))) : null);
}

function linkedRegister(c) {
  const items = state.project.register.filter((r) => r.checkId === c.id);
  if (!items.length) return null;
  return h('ul', { class: 'list small' }, items.map((r) => h('li', { class: 'list-row' }, h('button', { type: 'button', class: 'linklike', onclick: () => editRegisterItem(r) }, `${r.type}: ${r.title}`), h('span', { class: 'chip chip-muted' }, r.status === 'accepted' ? `accepted by ${r.acceptedBy}` : r.status))));
}

function evidenceItem(ev) {
  const ic = { image: 'image', note: 'note', link: 'link', file: 'file' }[ev.kind];
  const meta = h('div', { class: 'small muted' }, `${formatDate(ev.createdAt, true)} · ${ev.createdBy}${ev.size ? ` · ${bytesLabel(ev.size)}` : ''}${ev.origin === 'import' ? ' · imported' : ''}${ev.kind === 'image' && !ev.redactionConfirmed ? ' · redaction not confirmed' : ''}`);
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
  const sel = h('select', { 'data-focus-key': `gate-dec-${c.id}`, onchange: (e) => { draft.decision = e.target.value; } }, h('option', { value: '' }, 'Choose…'), GATE_DECISIONS.map((d) => h('option', { value: d.id, selected: draft.decision === d.id }, d.label)));
  const by = h('input', { type: 'text', maxlength: '200', value: draft.decidedBy, placeholder: 'Name of the decision maker', 'data-focus-key': `gate-by-${c.id}`, oninput: (e) => { draft.decidedBy = e.target.value; } });
  const role = h('input', { type: 'text', maxlength: '200', value: draft.decidedRole, placeholder: 'Role', 'data-focus-key': `gate-role-${c.id}`, oninput: (e) => { draft.decidedRole = e.target.value; } });
  const rat = h('textarea', { rows: '3', maxlength: '20000', placeholder: 'Rationale, conditions, exceptions referenced', 'data-focus-key': `gate-rat-${c.id}`, oninput: (e) => { draft.rationale = e.target.value; } });
  rat.value = draft.rationale;
  return h('div', { class: 'gate-form' },
    h('h3', null, icon('gate', 'icon-sm'), ' Gate decision'),
    g ? h('div', { class: 'callout callout-info' }, h('div', null, h('strong', null, `Recorded: ${(GATE_DECISIONS.find((d) => d.id === g.decision) || {}).label}`), h('div', { class: 'small' }, `by ${g.decidedBy}${g.decidedRole ? ` (${g.decidedRole})` : ''} on ${formatDate(g.at, true)}`), g.rationale ? h('p', { class: 'small' }, g.rationale) : null)) : h('p', { class: 'small muted' }, 'No decision recorded. The decision maker\'s name is typed by you — the app never fills it in.'),
    field('Decision', sel), field('Decided by', by, { required: true }), field('Role', role), field('Rationale', rat),
    btn(g ? 'Record a new decision' : 'Record decision', () => {
      // Validate on a scratch copy first so a rejected attempt does not mark the project as changed.
      const probe = recordGate({ gates: {}, audit: [], meta: {} }, c.id, draft);
      if (!probe.ok) { toast(probe.error, 'bad'); return; }
      mutate((pr) => recordGate(pr, c.id, draft));
      gateDrafts.delete(c.id);
      toast('Decision recorded.', 'good');
    }, { kind: 'primary', small: true }));
}

