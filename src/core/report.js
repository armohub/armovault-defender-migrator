// Report model builder (pure data). The same model drives the printable report, snapshots and CSV exports.
// It only reflects what is recorded in the project. It never invents evidence, dates, approvals or sign-offs.

import { applicabilityMap } from './applicability.js';
import { assessStage, summariseStage, CONCLUSION_CRITERIA, exceptionsByCheck, overallAssessment } from './readiness.js';
import { statusById, answerLabel, actor, effectiveOwner, plannedRole } from './model.js';
import { sha256Hex } from './files.js';
import { nowIso } from './util.js';

export const REPORT_KINDS = {
  prepare: { title: 'Preparation and readiness report', stages: ['prepare'] },
  test: { title: 'Test validation report', stages: ['test'] },
  transition: { title: 'Transition execution report', stages: ['transition'] },
  validate: { title: 'Post-transition validation report', stages: ['validate'] },
  final: { title: 'Final transition report (all stages)', stages: ['prepare', 'test', 'transition', 'validate'] },
};

export const DISCLAIMER_SHORT = 'This report was produced with an independent guidance tool. It records the answers, statuses and evidence entered by the people named in it. It is not Microsoft software, a certification, a warranty or a professional sign-off. Verify current Microsoft guidance and obtain your own approvals before making changes.';

export const DISCLAIMER_FULL = [
  'The application provides guidance and documentation support based on researched public Microsoft documentation and clearly labelled practical experience.',
  'You and your organisation remain responsible for verifying current Microsoft guidance, checking that instructions apply to your environment, validating query and output results, obtaining approvals, and making change decisions.',
  'The tool is not official Microsoft software and is not affiliated with, sponsored or endorsed by Microsoft. It is not a certification, warranty or professional sign-off.',
  'Results depend on the data, evidence, answers, knowledge-base version and scope provided. Statuses marked "not verified" are user assertions without attached evidence.',
  'The offline application cannot verify a live tenant. It only reflects evidence and exports that users attach.',
];

const VERIFICATION = {
  passed: 'Verified, evidence attached',
  not_verified: 'Your word only, no evidence',
  failed: 'Failed',
  blocked: 'Blocked',
  not_applicable: 'Not applicable',
  needs_review: 'Needs review',
  in_progress: 'Not yet assessed',
  not_started: 'Not yet assessed',
};

function itemRow(kb, project, item, excMap) {
  const c = item.check;
  const st = project.checks[c.id] || {};
  const evidence = (st.evidenceIds || []).map((id) => project.evidence[id]).filter(Boolean).map((e) => ({
    id: e.id, kind: e.kind, origin: e.origin || 'user', generated: !!e.generated, title: e.title, fileName: e.fileName, createdAt: e.createdAt, createdBy: e.createdBy, sha256: e.sha256, url: e.url, text: e.kind === 'note' ? e.text : '',
  }));
  return {
    id: c.id,
    title: c.title,
    kind: c.kind,
    criticality: c.criticality,
    workstream: c.workstream,
    provenance: c.provenance,
    validation: c.validation,
    applicability: item.app.value,
    applicabilitySource: item.app.source,
    applicabilityReasons: item.app.reasons,
    status: item.status,
    statusLabel: statusById(item.status).label,
    verification: item.status === 'passed' && st.evidenceWaiver && !(st.evidenceIds || []).some((id) => project.evidence[id]) ? 'Passed, evidence not needed' : VERIFICATION[item.status],
    evidenceWaiver: st.evidenceWaiver ? { reason: st.evidenceWaiver.reason, by: st.evidenceWaiver.by, at: st.evidenceWaiver.at } : null,
    statusReason: st.statusReason || '',
    owner: effectiveOwner(project, c).name,
    due: st.due || '',
    notes: st.notes || '',
    updatedAt: st.updatedAt || '',
    updatedBy: st.updatedBy || '',
    evidence,
    exceptions: (excMap.get(c.id) || []).map((r) => ({ title: r.title, acceptedBy: r.acceptedBy, acceptedRole: r.acceptedRole, acceptedAt: r.acceptedAt, rationale: r.rationale })),
    sources: c.sources.map((s) => s.id),
    caveats: c.caveats || [],
  };
}

export function buildReportModel(kind, kb, project, { appVersion }) {
  const def = REPORT_KINDS[kind];
  if (!def) throw new Error('Unknown report kind');
  const appMap = applicabilityMap(kb, project);
  const excMap = exceptionsByCheck(project);
  const stageTitle = (id) => (kb.stages.find((s) => s.id === id) || {}).title || id;
  const wsTitle = (stage, id) => (kb.workstreams.find((w) => w.stage === stage && w.id === id) || {}).title || id;

  const stages = def.stages.map((stageId) => {
    const assessment = assessStage(kb, project, stageId, appMap);
    const summary = summariseStage(kb, project, stageId, appMap);
    const groups = [];
    const extras = { workstream: 'extras', title: 'Good practice (optional)', items: [] };
    for (const item of summary.items) {
      if (!item.inScope) continue;
      if (item.check.scope === 'extra') { extras.items.push(itemRow(kb, project, item, excMap)); continue; }
      let g = groups.find((x) => x.workstream === item.check.workstream);
      if (!g) { g = { workstream: item.check.workstream, title: wsTitle(stageId, item.check.workstream), items: [] }; groups.push(g); }
      g.items.push(itemRow(kb, project, item, excMap));
    }
    if (extras.items.length) groups.push(extras);
    const outOfScope = summary.items.filter((i) => !i.inScope).map((i) => ({
      id: i.check.id, title: i.check.title, criticality: i.check.criticality,
      reason: i.status === 'not_applicable' ? `Marked not applicable: ${(project.checks[i.check.id] || {}).statusReason || 'no rationale recorded'}` : i.app.reasons.join(' '),
    }));
    return {
      id: stageId,
      title: stageTitle(stageId),
      level: assessment.level,
      label: assessment.label,
      note: assessment.note || '',
      reasons: assessment.reasons,
      counts: summary.counts,
      groups,
      outOfScope,
    };
  });

  const stageIds = new Set(def.stages);
  const checkStage = new Map(kb.checks.map((c) => [c.id, c.stage]));
  // Unlinked items, and items linked to something no longer in the knowledge base, appear in every report.
  const inReport = (r) => !r.checkId || !checkStage.has(r.checkId) || stageIds.has(checkStage.get(r.checkId)) || kind === 'final';
  const register = project.register.filter(inReport).map((r) => ({ ...r }));
  const gates = kb.checks.filter((c) => c.kind === 'gate' && stageIds.has(c.stage) && appMap.get(c.id).value !== 'not_applicable').map((c) => {
    const g = project.gates[c.id];
    return { id: c.id, title: c.title, decision: g ? g.decision : '', decidedBy: g ? g.decidedBy : '', decidedRole: g ? g.decidedRole : '', at: g ? g.at : '', rationale: g ? g.rationale : '' };
  });

  const usedSourceIds = new Set();
  for (const s of stages) for (const g of s.groups) for (const i of g.items) i.sources.forEach((id) => usedSourceIds.add(id));
  const sources = kb.sources.filter((s) => usedSourceIds.has(s.id)).map((s) => ({ id: s.id, title: s.title, url: s.url, publisher: s.publisher, pageDate: s.pageDate, updated: s.updated, verified: s.verified }));

  const evidenceIndex = [];
  for (const s of stages) for (const g of s.groups) for (const i of g.items) for (const e of i.evidence) evidenceIndex.push({ ...e, checkId: i.id });

  const answers = kb.questions.filter((q) => !q.derived || project.answers[q.id]).map((q) => {
    const a = project.answers[q.id];
    return { id: q.id, question: q.text, answer: a ? answerLabel(a.value) : 'Not answered', reason: a ? a.reason : '', by: a ? a.by : '', at: a ? a.at : '' };
  });

  const overallFinal = kind === 'final' ? overallAssessment(kb, project, def.stages, appMap) : null;
  const overall = kind === 'final' ? { label: overallFinal.label, level: overallFinal.level, title: 'All stages' } : stages[0];

  return {
    format: 'armohub.dma.report',
    formatVersion: 1,
    kind,
    title: def.title,
    generatedAt: nowIso(),
    generatedBy: actor(project),
    appVersion,
    kbVersion: kb.meta.version,
    kbReviewed: kb.meta.lastReviewed,
    project: {
      id: project.id, name: project.meta.name, organisation: project.meta.organisation, operatorName: project.meta.operatorName, operatorRole: project.meta.operatorRole,
      startDate: project.meta.startDate, windowStart: project.meta.windowStart, windowEnd: project.meta.windowEnd, environments: (project.meta.environments || []).map((e) => ({ ...e, plannedRole: plannedRole(project, e) })), plannedPrimary: project.meta.plannedPrimary || '', mode: project.mode, isDemo: !!project.isDemo,
      owners: [
        ...kb.workstreams.map((w) => {
          const key = `${w.stage}:${w.id}`;
          const others = ((project.meta.workstreamPeople || {})[key] || []).map((x) => (x.covers ? `${x.name} (${x.covers})` : x.name)).join(', ');
          return { area: `${(kb.stages.find((s) => s.id === w.stage) || {}).short}: ${w.title}`, name: (project.meta.workstreamOwners || {})[key] || '', others };
        }).filter((o) => o.name || o.others),
        ...(project.meta.approvers || []).map((a) => ({ area: `Approver: ${a.role}`, name: a.name, others: '' })),
      ],
    },
    scope: kb.meta.scope,
    method: kb.meta.method,
    limitations: kb.meta.limitations,
    criteria: CONCLUSION_CRITERIA,
    conclusion: overall ? { label: overall.label, level: overall.level, stage: overall.title } : null,
    testStage: { availability: project.stages.test.availability, reason: project.stages.test.reason, decidedBy: project.stages.test.decidedBy, decidedAt: project.stages.test.decidedAt },
    stages,
    answers: project.mode === 'tailored' ? answers : [],
    register,
    gates,
    evidenceIndex,
    sources,
    disclaimer: DISCLAIMER_FULL,
  };
}

export async function createSnapshot(kind, kb, project, { appVersion, note }) {
  const model = buildReportModel(kind, kb, project, { appVersion });
  const json = JSON.stringify(model);
  const sha256 = await sha256Hex(json);
  const snap = {
    id: `snap_${sha256.slice(0, 16)}_${Date.now().toString(36)}`,
    kind,
    title: model.title,
    createdAt: model.generatedAt,
    createdBy: model.generatedBy,
    appVersion,
    kbVersion: kb.meta.version,
    sha256,
    note: String(note || '').slice(0, 2000),
    model,
  };
  return snap;
}

export async function verifySnapshot(snap) {
  if (!snap || !snap.model) return false;
  return (await sha256Hex(JSON.stringify(snap.model))) === snap.sha256;
}

// Flat rows for CSV export.
export function itemsCsvRows(kb, project) {
  const appMap = applicabilityMap(kb, project);
  return kb.checks.map((c) => {
    const st = project.checks[c.id] || {};
    const app = appMap.get(c.id);
    return {
      stage: c.stage, workstream: c.workstream, id: c.id, title: c.title, kind: c.kind, criticality: c.criticality,
      applicability: app.value, applicability_reason: app.reasons.join(' | '), status: st.status || 'not_started', status_reason: st.statusReason || '',
      owner: effectiveOwner(project, c).name, due: st.due || '', evidence_count: (st.evidenceIds || []).filter((id) => project.evidence[id]).length, evidence_not_needed: st.evidenceWaiver ? st.evidenceWaiver.reason : '', notes: st.notes || '',
      updated_at: st.updatedAt || '', updated_by: st.updatedBy || '', provenance: c.provenance, validation: c.validation,
    };
  });
}
