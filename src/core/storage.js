// Browser persistence.
//  - Settings: localStorage (small, remembered in this browser profile).
//  - Projects + evidence binaries: IndexedDB, only when the user opts into browser autosave.
// Measured on file:// in Edge/Chrome 155: all local HTML files share one storage partition, so any other
// local HTML page opened in the same browser profile could read this data. This is disclosed in the UI.

import { validateSettings } from './schema.js';

const SETTINGS_KEY = 'armohub.dma.settings.v1';
const DB_NAME = 'armohub-dma';
const DB_VERSION = 1;

export function probeLocalStorage() {
  try {
    const k = '__armohub_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return validateSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return validateSettings(null);
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function clearSettings() {
  try { localStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
}

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is not available in this browser.')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('evidence')) {
        const s = db.createObjectStore('evidence', { keyPath: 'id' });
        s.createIndex('projectId', 'projectId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open browser storage.'));
    req.onblocked = () => reject(new Error('Browser storage is blocked by another open tab of this app.'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error || new Error('Storage transaction failed.'));
    t.onabort = () => reject(t.error || new Error('Storage transaction aborted (the browser may be out of storage space).'));
  }));
}

const reqP = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

export async function idbAvailable() {
  try { await openDb(); return true; } catch { return false; }
}

export function putProject(project) {
  const record = { id: project.id, name: project.meta.name, updatedAt: project.updatedAt, json: JSON.stringify(project) };
  return tx('projects', 'readwrite', (s) => { s.put(record); });
}

export async function getProject(id) {
  const rec = await tx('projects', 'readonly', (s) => reqP(s.get(id)));
  return rec ? JSON.parse(rec.json) : null;
}

export function listProjects() {
  return tx('projects', 'readonly', (s) => reqP(s.getAll())).then((all) => (all || []).map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt, bytes: r.json.length })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))));
}

export function putEvidence(projectId, id, blob) {
  return tx('evidence', 'readwrite', (s) => { s.put({ id, projectId, blob }); });
}

export async function getEvidence(id) {
  const rec = await tx('evidence', 'readonly', (s) => reqP(s.get(id)));
  return rec ? rec.blob : null;
}

export function deleteEvidence(id) {
  return tx('evidence', 'readwrite', (s) => { s.delete(id); });
}

export async function evidenceIdsForProject(projectId) {
  return tx('evidence', 'readonly', (s) => reqP(s.index('projectId').getAllKeys(projectId)));
}

export async function deleteProject(projectId) {
  const ids = await evidenceIdsForProject(projectId).catch(() => []);
  await tx('evidence', 'readwrite', (s) => { for (const id of ids) s.delete(id); });
  await tx('projects', 'readwrite', (s) => { s.delete(projectId); });
}

export async function clearAllBrowserData() {
  clearSettings();
  try {
    const db = await openDb();
    db.close();
  } catch { /* ignore */ }
  dbPromise = null;
  await new Promise((resolve, reject) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(new Error('The browser refused to delete the app storage.'));
    r.onblocked = () => reject(new Error('Deletion is waiting because another tab of this app is open. Close the other tabs and try again.'));
  });
}

export async function storageEstimate() {
  try {
    const est = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    return { usage: est.usage || 0, quota: est.quota || 0, persisted };
  } catch {
    return null;
  }
}

export async function requestPersistence() {
  try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch { return false; }
}
