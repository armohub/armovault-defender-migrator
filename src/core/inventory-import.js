// One import for every file the inventory script writes, used by setup and inside a project: the inventory files
// and workspaces.json are chosen together, in any order, and reviewed on one screen before anything changes.
// A session holds what was read: { items, list, errors, suggest }. Nothing here touches the page or the store.
import { suggestAnswers } from './inventory.js';
import { addEvidence, setAnswer, addAudit, setEnvironments, applyWorkspaceList, setInventoryChoice } from './model.js';

const lc = (x) => String(x || '').trim().toLowerCase();
const FROM_INVENTORY = /^From imported inventory/;

export const newImportSession = () => ({ items: [], list: [], errors: [], suggest: [] });

// The workspaces.json entry for an inventory file: by the alias in the file, or the name you gave it here.
export function listedFor(session, it) {
  const names = [it.fileAlias, it.alias].map(lc).filter(Boolean);
  return session.list.find((w) => [w.alias, w.workspaceName].some((x) => x && names.includes(lc(x)))) || null;
}

// Workspaces that workspaces.json names, but whose inventory file was not chosen.
export const missingFiles = (session) => session.list.filter((w) => !session.items.some((it) => [w.alias, w.workspaceName].some((x) => x && [it.fileAlias, it.alias].map(lc).includes(lc(x)))));

// Adds what readInventoryFiles read: [{ file, inv, res, bytes, sha } | { file, list } | { file, error }].
// answers: the project's answers, so a suggestion knows what you answered already (empty in setup).
export function addReadFiles(session, read, { answers = {} } = {}) {
  for (const r of read) {
    const name = (r.file && r.file.name) || 'file';
    if (r.error) { session.errors.push(`${name}: ${r.error}`); continue; }
    if (r.list) {
      for (const w of r.list) if (!session.list.some((x) => lc(x.workspaceName) === lc(w.workspaceName) && lc(x.resourceGroup) === lc(w.resourceGroup) && lc(x.subscription) === lc(w.subscription))) session.list.push(w);
      continue;
    }
    // Files from older single-workspace runs carry no alias: ask for the name rather than use the file name.
    const fromFile = name.replace(/^inventory-/, '').replace(/\.json$/i, '');
    const alias = r.inv.alias || (/^armohub-inventory/i.test(fromFile) ? '' : fromFile);
    if (alias && session.items.some((x) => lc(x.alias) === lc(alias))) { session.errors.push(`${name}: ${alias} is already in this import.`); continue; }
    session.items.push({ ...r, fileName: name, alias, fileAlias: r.inv.alias || fromFile, kind: /test|dev|lab/i.test(alias) ? 'test' : 'production', inScope: true });
  }
  refreshSuggestions(session, answers);
  return session;
}

// Suggested answers for the workspaces in scope (Yes when any shows it, No only when every one was read for it).
// A tick you changed is kept. An answer you typed that differs starts unticked; one that already matches is
// marked `same` and is not offered again.
export function refreshSuggestions(session, answers = {}) {
  const kept = new Map(session.suggest.map((x) => [`${x.questionId}:${x.value}`, x.on]));
  session.suggest = suggestAnswers(session.items.filter((x) => x.inScope)).map((x) => {
    const cur = answers[x.questionId];
    const same = !!cur && cur.value === x.value;
    const typed = !!cur && !same && cur.value !== 'unknown' && !FROM_INVENTORY.test(cur.reason || '');
    const key = `${x.questionId}:${x.value}`;
    return { ...x, current: cur ? cur.value : '', same, on: same ? false : kept.has(key) ? kept.get(key) : !typed };
  });
  return session;
}

// The same note on the same step, from the same run of the script, is not added twice.
const hasNote = (project, checkId, f) => ((project.checks[checkId] || {}).evidenceIds || []).some((id) => {
  const ev = project.evidence[id];
  return ev && ev.origin === 'import' && ev.kind === 'note' && ev.title === String(f.title).slice(0, 300) && ev.text && String(f.text).startsWith(ev.text);
});
const hasFile = (project, checkId, sha) => ((project.checks[checkId] || {}).evidenceIds || []).some((id) => project.evidence[id] && project.evidence[id].sha256 === sha);

// Applies a reviewed session to a project. New workspaces are added with their subscription, resource group and
// region; workspaces you already have are filled in where empty, and nothing you entered is overwritten. Every
// finding becomes an evidence note labelled "imported"; statuses are not changed. putBlob(evidenceId, bytes)
// stores each original file. Returns { ok, added, updated, evidence, steps, files, answers } or { ok: false, error }.
export function applyImport(project, session, { kb, putBlob = () => {} } = {}) {
  const items = session.items.filter((x) => x.inScope && String(x.alias || '').trim());
  if (!items.length && !session.list.length) return { ok: false, error: 'Nothing to import yet. Choose the files the script wrote.' };
  const v = kb.meta.version;
  const tenantRefs = [...new Set(items.map((x) => x.inv.tenantRef).filter(Boolean))];
  const tenantLabel = (x) => (tenantRefs.length > 1 && x.inv.tenantRef ? `Tenant ${tenantRefs.indexOf(x.inv.tenantRef) + 1}` : '');
  const envs = (project.meta.environments || []).map((e) => ({ ...e }));
  const added = [];
  let updated = 0;
  for (const it of items) {
    const alias = it.alias.trim();
    const w = listedFor(session, it) || {};
    const known = envs.find((e) => lc(e.alias) === lc(alias));
    const fill = { subscription: w.subscription || '', resourceGroup: w.resourceGroup || '', region: it.inv.region || w.region || '', tenant: tenantLabel(it) };
    if (!known) { envs.push({ alias, kind: it.kind, ...fill, defender: 'unknown', notes: '' }); added.push(alias); continue; }
    let changed = false;
    for (const [k, val] of Object.entries(fill)) if (val && !String(known[k] || '').trim()) { known[k] = val; changed = true; }
    if (changed) updated += 1;
  }
  if (items.length) {
    const res = setEnvironments(project, envs);
    if (!res.ok) return res;
  }
  // workspaces.json also fills in workspaces you typed yourself, with no inventory file.
  updated += applyWorkspaceList(project, session.list);

  let evidence = 0;
  let files = 0;
  const steps = new Set();
  for (const it of items) {
    for (const f of it.res.findings) {
      if (!kb.checks.some((c) => c.id === f.checkId) || hasNote(project, f.checkId, f)) continue;
      addEvidence(project, f.checkId, { kind: 'note', title: f.title, text: f.text, origin: 'import', stage: 'prepare' }, v);
      evidence += 1;
      steps.add(f.checkId);
    }
    if (it.bytes && it.sha && !hasFile(project, 'PREP-DET-01', it.sha)) {
      const ev = addEvidence(project, 'PREP-DET-01', { kind: 'file', title: `Inventory file ${it.res.label}`, fileName: String(it.fileName || 'inventory.json').slice(0, 260), mime: 'application/json', size: it.bytes.length, sha256: it.sha, origin: 'import', stage: 'prepare', text: 'Original output of Get-ArMoSentinelInventory.ps1' }, v);
      putBlob(ev.id, it.bytes);
      files += 1;
      steps.add('PREP-DET-01');
    }
  }
  let answers = 0;
  const by = project.meta.operatorName || 'operator';
  for (const sg of session.suggest.filter((x) => x.on && !x.same)) {
    const r = setAnswer(project, sg.questionId, sg.value, `From imported inventory (${sg.reasons.join('; ')}); confirmed by ${by}`);
    if (r.ok) answers += 1;
  }
  if (items.length) setInventoryChoice(project, 'import');
  addAudit(project, 'inventory.imported', `Inventory imported: ${items.length} workspace${items.length === 1 ? '' : 's'} (${added.length} added, ${updated} filled in), ${evidence} evidence note(s), ${files} file(s), ${answers} answer(s)`);
  return { ok: true, added, updated, evidence, steps: steps.size, files, answers };
}
