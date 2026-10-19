// Small, dependency-free helpers shared by core and UI. No DOM access here (core must run in Node tests).

export function uid(prefix = 'id') {
  const raw = (globalThis.crypto && globalThis.crypto.randomUUID) ? globalThis.crypto.randomUUID() : fallbackUuid();
  return `${prefix}_${raw.replace(/-/g, '').slice(0, 20)}`;
}

function fallbackUuid() {
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export const nowIso = () => new Date().toISOString();

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

// Keys that must never be accepted from imported data (prototype pollution guard).
export const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function formatDate(iso, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const date = d.toISOString().slice(0, 10);
  if (!withTime) return date;
  return `${date} ${d.toISOString().slice(11, 16)} UTC`;
}

export function bytesLabel(n) {
  if (!Number.isFinite(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'project';
}

export function groupBy(list, keyFn) {
  const m = new Map();
  for (const item of list) {
    const k = keyFn(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}
