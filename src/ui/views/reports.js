// Reports, report history (snapshots), printable report documents and data exports.
import { h, icon, toast, modal, confirmDialog, field, saveBlob, externalLink } from '../dom.js';
import { state, mutate, getEvidenceBlob, jsonExport } from '../../app/store.js';
import { route, render, go, savePackageFlow } from '../shell.js';
import { buildReportModel, createSnapshot, verifySnapshot, REPORT_KINDS, itemsCsvRows, DISCLAIMER_SHORT } from '../../core/report.js';
import { assessStage, overallAssessment } from '../../core/readiness.js';
import { applicabilityMap } from '../../core/applicability.js';
import { GATE_DECISIONS, addAudit, statusById, MAX_SNAPSHOTS } from '../../core/model.js';
import { pageHead, btn, linkBtn, conclusionBadge, emptyState, callout } from '../components.js';
import { toCsv } from '../../core/files.js';
import { formatDate, slugify } from '../../core/util.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { revokeObjectUrls, trackUrl } from './work.js';

const reportOpts = { includeImages: false };

route('reports', () => {
  const p = state.project;
  const kb = state.kb;
  const appMap = applicabilityMap(kb, p);
  const cards = Object.entries(REPORT_KINDS).map(([kind, def]) => {
    const a = kind === 'final' ? overallAssessment(kb, p, def.stages, appMap) : assessStage(kb, p, kind, appMap);
    return h('div', { class: 'card report-card' },
      h('h2', null, def.title),
      kind === 'final' ? h('p', { class: 'small muted' }, 'All stages in one document. The headline is the weakest stage conclusion (a skipped test stage is not counted).') : null,
      conclusionBadge(a),
      h('div', { class: 'card-actions' }, linkBtn('Preview, print or save as PDF', `#/report/${kind}`, { kind: 'primary', small: true, iconName: 'print' }), btn('Save snapshot', () => saveSnapshotFlow(kind), { small: true, iconName: 'history' })));
  });
  const snaps = p.snapshots.slice().reverse();
  return h('div', { class: 'page' },
    pageHead('Reports & history', 'Reports are generated offline from your records. Use your browser\'s print dialog and choose "Save as PDF". Snapshots preserve a report exactly as it was at a milestone.'),
    h('div', { class: 'grid-3' }, ...cards),
    h('section', { class: 'card' }, h('h2', null, 'Report history (snapshots)'),
      h('p', { class: 'small muted' }, 'A snapshot is a frozen copy of a report\'s content with a SHA-256 fingerprint. The app does not let you edit a snapshot; later reports are new documents. The fingerprint detects accidental changes and corruption; it is not a digital signature. Snapshots are stored in the project and in project packages.'),
      snaps.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, ...['Report', 'Created', 'By', 'App / KB version', 'Conclusion', 'Fingerprint', ''].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', null, snaps.map((s) => h('tr', null,
          h('td', null, h('a', { href: `#/snapshot/${s.id}` }, s.title), s.note ? h('div', { class: 'small muted' }, s.note) : null),
          h('td', null, formatDate(s.createdAt, true)), h('td', null, s.createdBy), h('td', { class: 'small' }, `${s.appVersion} / ${s.kbVersion}`),
          h('td', null, s.model && s.model.conclusion ? s.model.conclusion.label : '—'), h('td', { class: 'mono small' }, s.sha256.slice(0, 16), '…'),
          h('td', null, h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Delete snapshot ${s.title}`, onclick: () => deleteSnapshot(s) }, icon('trash', 'icon-sm')))))))) : h('p', { class: 'muted' }, 'No snapshots yet. Save one after each important milestone (for example the Stage 1 gate decision).')),
    h('section', { class: 'card' }, h('h2', null, 'Data exports'),
      h('ul', { class: 'list' },
        h('li', { class: 'list-row' }, h('div', null, h('strong', null, 'Project package (.zip)'), h('div', { class: 'small muted' }, 'Everything: data, evidence files, snapshots and audit log, with integrity hashes. Use this to back up, resume or hand over.')), btn('Save package', savePackageFlow, { kind: 'primary', small: true, iconName: 'save' })),
        h('li', { class: 'list-row' }, h('div', null, h('strong', null, 'Project data (.json)'), h('div', { class: 'small muted' }, 'Structured data for exchange or tooling. Screenshots and files are referenced, not included.')), btn('Export JSON', () => saveBlob(jsonExport(), `${BRAND.fileStem}-${slugify(p.meta.name)}.json`, { description: 'JSON', accept: { 'application/json': ['.json'] } }), { small: true, iconName: 'download' })),
        h('li', { class: 'list-row' }, h('div', null, h('strong', null, 'Checklist status (.csv)'), h('div', { class: 'small muted' }, 'One row per item with applicability, status, owner, due date and notes — for action tracking in a spreadsheet.')), btn('Export CSV', () => exportItemsCsv(), { small: true, iconName: 'download' })),
        h('li', { class: 'list-row' }, h('div', null, h('strong', null, 'Register (.csv) and evidence index (.csv)'), h('div', { class: 'small muted' }, 'Available on the Register and Evidence pages.')), h('div', { class: 'row-actions' }, linkBtn('Register', '#/register', { small: true, kind: 'ghost' }), linkBtn('Evidence', '#/evidence', { small: true, kind: 'ghost' }))))));
});

function exportItemsCsv() {
  const p = state.project;
  const rows = itemsCsvRows(state.kb, p);
  const cols = Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  saveBlob(new Blob([toCsv(cols, rows)], { type: 'text/csv' }), `${BRAND.fileStem}-${slugify(p.meta.name)}-checklist.csv`, { description: 'CSV', accept: { 'text/csv': ['.csv'] } });
}

async function saveSnapshotFlow(kind) {
  if (state.project.snapshots.length >= MAX_SNAPSHOTS) { toast(`This project already has ${MAX_SNAPSHOTS} snapshots, the maximum a package can carry. Delete older snapshots first.`, 'bad', 9000); return; }
  const note = h('input', { type: 'text', maxlength: '2000', placeholder: 'For example: Stage 1 gate review' });
  const ok = await modal({ title: `Save snapshot: ${REPORT_KINDS[kind].title}`, body: h('div', { class: 'stack' }, h('p', null, 'The snapshot freezes the report content as of now, including statuses, evidence index, register and decisions. It does not copy attachment files (they stay in the project).'), field('Note (optional)', note)), actions: [{ label: 'Cancel', value: false }, { label: 'Save snapshot', kind: 'primary', value: true }] });
  if (!ok) return;
  const snap = await createSnapshot(kind, state.kb, state.project, { appVersion: APP_VERSION, note: note.value });
  mutate((p) => { p.snapshots.push(snap); addAudit(p, 'snapshot.created', `Snapshot saved: ${snap.title} (${snap.sha256.slice(0, 12)}…)`); });
  toast('Snapshot saved. Remember to save the project package.', 'good', 6000);
}

async function deleteSnapshot(s) {
  if (!(await confirmDialog({ title: 'Delete snapshot?', message: [`"${s.title}" from ${formatDate(s.createdAt, true)} will be removed from this project.`, 'Copies in project packages you saved earlier are not affected. The deletion is recorded in the audit log.'], confirmLabel: 'Delete', danger: true }))) return;
  mutate((p) => { p.snapshots = p.snapshots.filter((x) => x.id !== s.id); addAudit(p, 'snapshot.deleted', `Snapshot deleted: ${s.title} (${s.sha256.slice(0, 12)}…)`); });
}

route('report', ({ params }) => {
  revokeObjectUrls();
  const kind = REPORT_KINDS[params[0]] ? params[0] : 'prepare';
  const model = buildReportModel(kind, state.kb, state.project, { appVersion: APP_VERSION });
  return reportPage(model, { live: true, kind });
});

route('snapshot', ({ params }) => {
  const s = state.project.snapshots.find((x) => x.id === params[0]);
  if (!s) return h('div', { class: 'page' }, emptyState('Snapshot not found.', null, linkBtn('Back to reports', '#/reports')));
  const integrity = h('span', { class: 'chip chip-muted' }, 'Checking integrity…');
  verifySnapshot(s).then((ok) => { integrity.replaceWith(ok ? h('span', { class: 'chip chip-good', title: 'The content matches the SHA-256 fingerprint taken when the snapshot was saved. This detects accidental changes and corruption; it is not a digital signature.' }, icon('check', 'icon-xs'), 'Fingerprint matches') : h('span', { class: 'chip chip-bad' }, icon('alert', 'icon-xs'), 'Content does not match its fingerprint')); });
  return reportPage(s.model, { live: false, snapshot: s, integrity });
});

function reportPage(model, { live, kind, snapshot, integrity }) {
  const toolbar = h('div', { class: 'report-toolbar no-print' },
    linkBtn('Back to reports', '#/reports', { iconName: 'back', small: true }),
    btn('Print / save as PDF', () => window.print(), { kind: 'primary', iconName: 'print', small: true }),
    live ? h('label', { class: 'check-line small' }, h('input', { type: 'checkbox', checked: reportOpts.includeImages, onchange: (e) => { reportOpts.includeImages = e.target.checked; render(); } }), ' Include screenshots in an appendix') : null,
    live ? btn('Save snapshot', () => saveSnapshotFlow(kind), { small: true, iconName: 'history' }) : integrity,
    h('span', { class: 'small muted' }, 'In the print dialog choose "Save as PDF" (or "Microsoft Print to PDF"). Enable "Background graphics" for coloured status labels.'));
  return h('div', { class: 'report-page' }, toolbar, renderReport(model, { live, snapshot, includeImages: live && reportOpts.includeImages }));
}

const decisionLabel = (id) => (GATE_DECISIONS.find((d) => d.id === id) || { label: id || '—' }).label;

export function renderReport(m, { live, snapshot, includeImages }) {
  const kb = state.kb;
  const sec = (n, title, ...body) => h('section', { class: 'r-section' }, h('h2', null, `${n}. ${title}`), ...body);
  const table = (head, rows, cls) => h('table', { class: ['r-table', cls] }, h('thead', null, h('tr', null, head.map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, rows));
  const tone = { ready: 'good', ready_with_exceptions: 'caution', undetermined: 'neutral', not_ready: 'bad', skipped: 'muted' };

  const cover = h('header', { class: 'r-cover' },
    h('div', { class: 'r-brand' }, BRAND.productName),
    h('h1', null, m.title),
    h('p', { class: 'r-project' }, m.project.name || 'Untitled project', m.project.organisation ? ` — ${m.project.organisation}` : ''),
    m.project.isDemo ? h('p', { class: 'r-demo' }, 'DEMO — FICTIONAL DATA. Not a record of any real organisation.') : null,
    h('dl', { class: 'r-meta' },
      h('dt', null, 'Generated'), h('dd', null, formatDate(m.generatedAt, true)),
      h('dt', null, 'Generated by'), h('dd', null, m.generatedBy),
      h('dt', null, 'Operator'), h('dd', null, `${m.project.operatorName || '—'}${m.project.operatorRole ? ` (${m.project.operatorRole})` : ''}`),
      h('dt', null, 'App / knowledge base'), h('dd', null, `${m.appVersion} / ${m.kbVersion} (reviewed ${m.kbReviewed})`),
      h('dt', null, 'Record type'), h('dd', null, snapshot ? `Snapshot ${snapshot.id} · SHA-256 ${snapshot.sha256}` : 'Live report (not a frozen snapshot)')),
    h('p', { class: 'r-disclaimer' }, DISCLAIMER_SHORT));

  const stageRows = m.stages.map((s) => h('tr', null, h('td', null, s.title), h('td', null, h('span', { class: ['r-badge', `r-${tone[s.level]}`] }, s.label)), ...['inScope', 'passed', 'not_verified', 'failed', 'blocked', 'needs_review'].map((k) => h('td', { class: 'num' }, String(s.counts[k] || 0))), h('td', { class: 'num' }, String((s.counts.not_started || 0) + (s.counts.in_progress || 0))), h('td', { class: 'num' }, String(s.counts.outOfScope || 0))));
  const exec = sec(1, 'Executive summary',
    m.conclusion ? h('p', { class: 'r-conclusion' }, 'Conclusion: ', h('span', { class: ['r-badge', `r-${tone[m.conclusion.level]}`] }, m.conclusion.label), ` (${m.conclusion.stage})`) : null,
    h('p', { class: 'small' }, 'The conclusion is computed from recorded statuses, evidence and accepted exceptions using the criteria below. It is not a statement of fact about the environment beyond what the recorded evidence shows.'),
    table(['Stage', 'Conclusion', 'In scope', 'Passed (verified)', 'Not verified', 'Failed', 'Blocked', 'Needs review', 'Not assessed', 'Out of scope'], stageRows, 'r-compact'),
    ...m.stages.filter((s) => s.note).map((s) => h('p', { class: 'small' }, `${s.title}: ${s.note}`)),
    ...m.stages.map((s) => (s.reasons.blocking.length || s.reasons.undetermined.length) ? h('div', null, h('h3', null, `${s.title}: what prevents a better conclusion`), h('ul', { class: 'small' }, [...s.reasons.blocking.map((r) => h('li', null, 'Blocking — ', r.text)), ...s.reasons.undetermined.slice(0, 25).map((r) => h('li', null, 'Not yet determined — ', r.text))]), s.reasons.undetermined.length > 25 ? h('p', { class: 'small' }, `…and ${s.reasons.undetermined.length - 25} more not yet determined.`) : null) : null),
    h('details', { open: true, class: 'r-criteria' }, h('summary', null, 'Conclusion criteria'), h('ul', { class: 'small' }, m.criteria.map((c) => h('li', null, c)))));

  const scope = sec(2, 'Scope, assumptions and method',
    h('p', null, m.scope), h('p', { class: 'small' }, m.method),
    h('h3', null, 'Environments in scope (aliases)'),
    m.project.environments.length ? table(['Alias', 'Type', 'Notes'], m.project.environments.map((e) => h('tr', null, h('td', null, e.alias), h('td', null, e.kind), h('td', null, e.notes || '')))) : h('p', { class: 'small' }, 'No environments recorded.'),
    h('p', null, `Checklist mode: ${m.project.mode === 'full' ? 'full checklist (no tailoring)' : 'tailored to the answers below'}. Planned window: ${m.project.windowStart || '—'}${m.project.windowEnd ? ` to ${m.project.windowEnd}` : ''}.`),
    h('p', null, `Test stage: ${m.testStage.availability === 'unavailable' ? `not available — ${m.testStage.reason} (recorded by ${m.testStage.decidedBy})` : m.testStage.availability === 'available' ? 'available' : 'not decided'}.`),
    m.answers.length ? h('div', null, h('h3', null, 'Environment answers (assumptions)'), table(['Question', 'Answer', 'Note', 'Answered by'], m.answers.map((a) => h('tr', null, h('td', null, a.question), h('td', null, a.answer), h('td', null, a.reason || ''), h('td', { class: 'small' }, a.by ? `${a.by}, ${formatDate(a.at)}` : ''))), 'r-compact')) : null);

  let n = 2;
  const findings = m.stages.map((s) => {
    n += 1;
    return sec(n, `Findings — ${s.title}`,
      s.groups.length ? s.groups.map((g) => h('div', { class: 'r-group' }, h('h3', null, g.title),
        table(['Item', 'Criticality', 'Result', 'Owner', 'Evidence', 'Rationale / notes'], g.items.map((i) => h('tr', { class: 'r-row' },
          h('td', null, h('span', { class: 'mono' }, i.id), ' ', i.title, i.applicability === 'unknown' ? h('div', { class: 'small' }, 'Applicability uncertain') : null, i.applicabilitySource === 'override' ? h('div', { class: 'small' }, 'Applicability set by reviewer') : null, i.validation === 'needs-review' ? h('div', { class: 'small' }, 'Sources conflict — needs review') : null),
          h('td', null, i.criticality),
          h('td', null, h('span', { class: ['r-status', `r-st-${i.status}`] }, statusById(i.status).short), h('div', { class: 'small' }, i.verification), i.exceptions.map((e) => h('div', { class: 'small' }, `Exception accepted by ${e.acceptedBy}${e.acceptedRole ? ` (${e.acceptedRole})` : ''}`))),
          h('td', null, i.owner || '—', i.due ? h('div', { class: 'small' }, `due ${i.due}`) : null),
          h('td', { class: 'small' }, i.evidence.length ? i.evidence.map((e) => h('div', null, `${e.kind}${e.origin === 'import' ? ' (imported)' : ''}: ${e.title || e.fileName}`)) : '—'),
          h('td', { class: 'small r-notes' }, i.statusReason ? h('div', null, i.statusReason) : null, i.notes ? h('div', null, i.notes) : null, !i.statusReason && !i.notes ? '—' : null)))))) : h('p', null, 'No in-scope items.'),
      s.outOfScope.length ? h('details', { open: true }, h('summary', null, `Out of scope (${s.outOfScope.length})`), table(['Item', 'Why it is out of scope'], s.outOfScope.map((o) => h('tr', null, h('td', null, h('span', { class: 'mono' }, o.id), ' ', o.title), h('td', { class: 'small' }, o.reason))), 'r-compact')) : null);
  });

  n += 1;
  const reg = (type, title) => {
    const items = m.register.filter((r) => r.type === type);
    if (!items.length) return null;
    return h('div', null, h('h3', null, title), table(['Title', 'Severity', 'Status', 'Owner', 'Due', 'Details'], items.map((r) => h('tr', null, h('td', null, r.title, r.checkId ? h('div', { class: 'small mono' }, r.checkId) : null), h('td', null, r.severity), h('td', null, r.status), h('td', null, r.owner || '—'), h('td', null, r.due || '—'),
      h('td', { class: 'small' }, r.type === 'exception' && r.status === 'accepted' ? `Accepted by ${r.acceptedBy}${r.acceptedRole ? ` (${r.acceptedRole})` : ''} on ${formatDate(r.acceptedAt)}: ${r.rationale}` : r.description || ''))), 'r-compact'));
  };
  const register = sec(n, 'Risks, issues, exceptions, actions and decisions',
    m.register.length ? [reg('issue', 'Issues'), reg('risk', 'Risks'), reg('exception', 'Exceptions and risk acceptances'), reg('action', 'Actions'), reg('decision', 'Decisions')] : h('p', null, 'No register entries.'));
  n += 1;
  const gates = sec(n, 'Gate decisions',
    m.gates.length ? table(['Gate', 'Decision', 'Decided by', 'Date', 'Rationale'], m.gates.map((g) => h('tr', null, h('td', null, h('span', { class: 'mono' }, g.id), ' ', g.title), h('td', null, g.decision ? decisionLabel(g.decision) : 'Not recorded'), h('td', null, g.decidedBy ? `${g.decidedBy}${g.decidedRole ? ` (${g.decidedRole})` : ''}` : '—'), h('td', null, g.at ? formatDate(g.at, true) : '—'), h('td', { class: 'small' }, g.rationale || '')))) : h('p', null, 'No gates in this report.'));
  n += 1;
  const evidence = sec(n, 'Evidence index',
    m.evidenceIndex.length ? table(['Item', 'Kind', 'Title / file', 'Recorded', 'SHA-256 (files)'], m.evidenceIndex.map((e) => h('tr', null, h('td', { class: 'mono' }, e.checkId), h('td', null, `${e.kind}${e.origin === 'import' ? ' (imported)' : ''}`), h('td', null, e.title || '', e.fileName ? h('div', { class: 'small' }, e.fileName) : null, e.url ? h('div', { class: 'small' }, e.url) : null), h('td', { class: 'small' }, `${formatDate(e.createdAt, true)}, ${e.createdBy}`), h('td', { class: 'mono small' }, e.sha256 ? `${e.sha256.slice(0, 20)}…` : '—'))), 'r-compact') : h('p', null, 'No evidence recorded.'),
    h('p', { class: 'small' }, 'Evidence files are held in the project package, not in this document. Observation notes are user-recorded text.'));

  let appendix = null;
  if (includeImages) {
    const imgs = m.evidenceIndex.filter((e) => e.kind === 'image');
    const grid = h('div', { class: 'r-images' });
    for (const e of imgs) {
      const img = h('img', { alt: e.title || 'Screenshot evidence' });
      getEvidenceBlob(e.id).then((b) => { if (b) img.src = trackUrl(b); else img.replaceWith(h('p', { class: 'small' }, 'File content missing')); });
      grid.appendChild(h('figure', null, img, h('figcaption', { class: 'small' }, `${e.checkId} — ${e.title} (${formatDate(e.createdAt, true)}, ${e.createdBy})`)));
    }
    n += 1;
    appendix = sec(n, 'Appendix — screenshots', imgs.length ? grid : h('p', null, 'No screenshots.'));
  }
  n += 1;
  const sources = sec(n, 'Sources', h('p', { class: 'small' }, 'Microsoft documentation cited by the items in this report, with the page date shown on the page and the date this project last verified it.'),
    table(['Title', 'URL', 'Page date', 'Verified'], m.sources.map((s) => h('tr', null, h('td', null, s.title), h('td', { class: 'small r-url' }, s.url), h('td', null, s.pageDate), h('td', null, s.verified))), 'r-compact'));
  n += 1;
  const limits = sec(n, 'Limitations and disclaimer', h('ul', null, m.limitations.map((l) => h('li', null, l))), h('ul', null, m.disclaimer.map((d) => h('li', null, d))));
  n += 1;
  const signoff = sec(n, 'Sign-off',
    h('p', { class: 'small' }, 'To be completed by hand or by your approval process. The app never fills in approvals or signatures.'),
    table(['', 'Name', 'Role', 'Date', 'Signature'], ['Prepared by', 'Reviewed by', 'Approved by'].map((r) => h('tr', { class: 'r-sign' }, h('th', { scope: 'row' }, r), h('td'), h('td'), h('td'), h('td')))));

  return h('article', { class: ['report', m.project.isDemo && 'report-demo'] }, cover, exec, scope, ...findings, register, gates, evidence, appendix, sources, limits, signoff,
    h('footer', { class: 'r-footer' }, `${BRAND.productName} ${m.appVersion} · knowledge base ${m.kbVersion} · generated ${formatDate(m.generatedAt, true)}${snapshot ? ` · snapshot ${snapshot.sha256.slice(0, 16)}…` : ''} · Not affiliated with Microsoft.`));
}
