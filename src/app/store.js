// Application state, persistence orchestration and evidence storage.
import * as storage from '../core/storage.js';
import { buildPackage, readProjectFile, buildJsonExport } from '../core/package.js';
import { validateProject, validateSettings } from '../core/schema.js';
import { APP_VERSION, BRAND } from '../brand.js';
import { clone, nowIso } from '../core/util.js';

const listeners = new Set();
const statusListeners = new Set(); // lightweight updates (save indicator) that must not redraw the page

export const state = {
  kb: null,
  settings: storage.loadSettings(),
  project: null,
  ui: {
    route: '',
    localStorageOk: storage.probeLocalStorage(),
    idbOk: null,
    saveState: 'off', // off | saved | saving | error
    saveError: '',
    lastBrowserSave: '',
    lastExport: '',
    unexported: false, // changes since the last package export / open
    browserProjects: [],
    storageInfo: null,
  },
};

// In-memory evidence binaries. With browser autosave they are also written to IndexedDB.
const evidenceMem = new Map(); // id -> Blob
const pendingEvidence = new Set();

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function notify() { for (const fn of listeners) fn(); }
export function subscribeStatus(fn) { statusListeners.add(fn); return () => statusListeners.delete(fn); }
function notifyStatus() { for (const fn of statusListeners) fn(); }

export async function initStore(kb) {
  state.kb = kb;
  state.ui.idbOk = await storage.idbAvailable();
  if (state.ui.idbOk) state.ui.browserProjects = await storage.listProjects().catch(() => []);
  state.ui.storageInfo = await storage.storageEstimate();
  // Reopen the last project only if the user opted into browser autosave.
  if (state.settings.storageMode === 'browser' && state.settings.lastProjectId && state.ui.idbOk) {
    try {
      const raw = await storage.getProject(state.settings.lastProjectId);
      if (raw) {
        const res = validateProject(raw, { kb });
        if (res.ok) { state.project = res.project; state.ui.saveState = 'saved'; state.ui.lastBrowserSave = res.project.updatedAt; }
      }
    } catch { /* ignore; user can reopen from the list */ }
  }
}

export function updateSettings(patch, { silent = false } = {}) {
  state.settings = validateSettings({ ...state.settings, ...patch });
  const ok = storage.saveSettings(state.settings);
  if (!ok) state.ui.localStorageOk = false;
  if (!silent) notify();
  return ok;
}

export function autosaveEnabled() {
  return state.settings.storageMode === 'browser' && state.ui.idbOk && state.project && !state.project.isDemo;
}

let saveTimer = null;
function scheduleAutosave() {
  if (!autosaveEnabled()) { state.ui.saveState = state.project && state.project.isDemo ? 'off' : state.ui.saveState === 'error' ? 'error' : 'off'; return; }
  state.ui.saveState = 'saving';
  notifyStatus();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushAutosave, 600);
}

let saving = null; // the save currently running, so callers can wait for it

export async function flushAutosave() {
  clearTimeout(saveTimer);
  if (saving) await saving.catch(() => {});
  if (!autosaveEnabled()) return false;
  const p = state.project;
  const run = (async () => {
    for (const id of Array.from(pendingEvidence)) {
      const blob = evidenceMem.get(id);
      if (blob) await storage.putEvidence(p.id, id, blob);
      pendingEvidence.delete(id);
    }
    await storage.putProject(p);
  })();
  saving = run;
  let ok = false;
  let err = '';
  try { await run; ok = true; } catch (e) { err = e && e.message ? e.message : 'Saving to browser storage failed.'; }
  saving = null;
  const hadError = state.ui.saveState === 'error';
  if (state.project === p) {
    state.ui.saveState = ok ? 'saved' : 'error';
    state.ui.saveError = err;
    if (ok) {
      state.ui.lastBrowserSave = nowIso();
      if (state.settings.lastProjectId !== p.id) updateSettings({ lastProjectId: p.id }, { silent: true });
    }
  }
  state.ui.browserProjects = await storage.listProjects().catch(() => state.ui.browserProjects);
  // A new or cleared error changes the banner, which needs a redraw; otherwise only the indicator updates.
  if ((state.ui.saveState === 'error') !== hadError) notify(); else notifyStatus();
  return ok;
}

// Called before switching or closing a project: makes sure nothing pending is lost.
// Returns 'ok' | 'unsaved' (autosave off with unexported changes) | 'failed' (browser save failed).
export async function prepareToLeaveProject() {
  const p = state.project;
  if (!p || p.isDemo) return 'ok';
  if (autosaveEnabled()) return (await flushAutosave()) ? 'ok' : 'failed';
  return state.ui.unexported ? 'unsaved' : 'ok';
}

export function hasUnprotectedChanges() {
  const p = state.project;
  if (!p || p.isDemo) return false;
  if (autosaveEnabled()) return state.ui.saveState !== 'saved';
  return state.ui.unexported;
}

// Apply a change to the project. `silent` skips re-rendering (used while typing in text fields).
export function mutate(fn, { silent = false } = {}) {
  if (!state.project) return undefined;
  const result = fn(state.project);
  state.ui.unexported = true;
  scheduleAutosave();
  if (!silent) notify();
  return result;
}

export function setProject(project, evidence = new Map(), { fromFile = false } = {}) {
  clearTimeout(saveTimer);
  evidenceMem.clear();
  pendingEvidence.clear();
  for (const [id, v] of evidence) {
    const blob = v instanceof Blob ? v : new Blob([v.bytes], { type: v.mime });
    evidenceMem.set(id, blob);
    pendingEvidence.add(id);
  }
  state.project = project;
  state.ui.unexported = !fromFile;
  state.ui.lastExport = '';
  state.ui.saveState = 'off';
  if (project && !project.isDemo && state.settings.storageMode === 'browser') {
    updateSettings({ lastProjectId: project.id });
    scheduleAutosave();
  }
  notify();
}

export function closeProject() {
  clearTimeout(saveTimer);
  evidenceMem.clear();
  pendingEvidence.clear();
  state.project = null;
  state.ui.unexported = false;
  state.ui.saveState = 'off';
  notify();
}

export async function openBrowserProject(id) {
  clearTimeout(saveTimer);
  const raw = await storage.getProject(id);
  if (!raw) throw new Error('Project not found in browser storage.');
  const res = validateProject(raw, { kb: state.kb });
  if (!res.ok) throw new Error(res.errors.join(' '));
  evidenceMem.clear();
  pendingEvidence.clear();
  state.project = res.project;
  state.ui.unexported = false;
  state.ui.saveState = 'saved';
  state.ui.lastBrowserSave = res.project.updatedAt;
  updateSettings({ lastProjectId: id });
  notify();
  return res.warnings;
}

export async function deleteBrowserProject(id) {
  if (state.project && state.project.id === id) throw new Error('This project is open. Close it first (Settings > Close project), then delete it.');
  await storage.deleteProject(id);
  if (state.settings.lastProjectId === id) updateSettings({ lastProjectId: '' });
  state.ui.browserProjects = await storage.listProjects().catch(() => []);
  notify();
}

export async function setStorageMode(mode) {
  updateSettings({ storageMode: mode });
  if (mode === 'browser' && state.project && !state.project.isDemo) {
    await storage.requestPersistence();
    for (const id of evidenceMem.keys()) pendingEvidence.add(id);
    await flushAutosave();
  } else {
    state.ui.saveState = 'off';
  }
  state.ui.storageInfo = await storage.storageEstimate();
  notify();
}

export async function clearEverything() {
  clearTimeout(saveTimer);
  if (saving) await saving.catch(() => {});
  await storage.clearAllBrowserData();
  evidenceMem.clear();
  pendingEvidence.clear();
  state.project = null;
  state.settings = validateSettings(null);
  state.ui.browserProjects = [];
  state.ui.saveState = 'off';
  state.ui.unexported = false;
  state.ui.storageInfo = await storage.storageEstimate();
  notify();
}

// Evidence binaries
export function putEvidenceBlob(id, blob) {
  evidenceMem.set(id, blob);
  pendingEvidence.add(id);
  scheduleAutosave();
}

export async function getEvidenceBlob(id) {
  if (evidenceMem.has(id)) return evidenceMem.get(id);
  if (state.ui.idbOk && state.project && !state.project.isDemo) {
    try {
      const b = await storage.getEvidence(id);
      if (b) { evidenceMem.set(id, b); return b; }
    } catch { /* fall through */ }
  }
  return null;
}

export async function dropEvidenceBlob(id) {
  evidenceMem.delete(id);
  pendingEvidence.delete(id);
  if (state.ui.idbOk) { try { await storage.deleteEvidence(id); } catch { /* ignore */ } }
}

export async function exportPackage() {
  const p = state.project;
  const res = await buildPackage(p, async (id) => {
    const b = await getEvidenceBlob(id);
    return b ? new Uint8Array(await b.arrayBuffer()) : null;
  }, { appVersion: APP_VERSION, kbVersion: state.kb.meta.version, productName: BRAND.productName });
  return res;
}

export function markExported() {
  state.ui.unexported = false;
  state.ui.lastExport = nowIso();
  notify();
}

export function jsonExport() { return buildJsonExport(state.project); }

export async function importProjectBytes(bytes) {
  const res = await readProjectFile(bytes, { kb: state.kb });
  return res; // caller confirms replacement, then calls setProject
}

export function settingsExportBlob() {
  const s = clone(state.settings);
  s.exportedAt = nowIso();
  return new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
}

export function importSettings(obj) {
  const imported = validateSettings(obj);
  // Only presentation preferences and the operator name are taken from a file. Saving mode, the responsibility
  // acknowledgement and the last-project pointer stay as chosen in this browser.
  const s = { ...state.settings, theme: imported.theme, density: imported.density, operatorName: imported.operatorName, operatorRole: imported.operatorRole };
  state.settings = s;
  storage.saveSettings(s);
  notify();
}
