// DOM helpers. All user and imported content is inserted as text nodes (textContent), never via innerHTML.
// The CSP additionally blocks inline event handlers, injected scripts and eval.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  applyProps(el, props);
  append(el, children);
  return el;
}

function applyProps(el, props) {
  if (!props) return;
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : v;
    else if (k === 'style') setStyle(el, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k === 'selected') el.selected = !!v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'href') el.setAttribute('href', safeHref(v));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
}

// Styles are applied through the CSSOM. The Content-Security-Policy blocks style attributes,
// but allows setting properties from script, including custom properties.
export function setStyle(el, v) {
  const pairs = typeof v === 'string'
    ? v.split(';').map((x) => x.split(':')).filter((x) => x.length >= 2).map(([p, ...rest]) => [p.trim(), rest.join(':').trim()])
    : Object.entries(v);
  for (const [p, val] of pairs) {
    if (val == null) continue;
    const prop = p.startsWith('--') ? p : p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    el.style.setProperty(prop, String(val));
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// Only internal hash routes, http(s) links and blob: object URLs are allowed as link targets.
export function safeHref(v) {
  const s = String(v || '');
  if (s.startsWith('#') || s.startsWith('blob:')) return s;
  if (/^https?:\/\//i.test(s) || /^mailto:/i.test(s)) return s;
  return '#';
}

export function externalLink(url, text, props = {}) {
  return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'ext', title: `${url} (opens in a new tab, needs internet)`, ...props }, text || url, icon('external', 'icon-xs'));
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

// Icons: simple stroke paths drawn for this project (24×24 viewBox).
const ICONS = {
  overview: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  prepare: 'M9 4h6l1 3h3v13H5V7h3zM9 12l2 2 4-4',
  test: 'M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 15h9',
  transition: 'M4 12h12M12 6l6 6-6 6M20 4v16',
  validate: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4',
  register: 'M5 21V4M5 4h11l-2 4 2 4H5',
  evidence: 'M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7',
  reports: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  knowledge: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5M8 7h7',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-5M12 8h.01',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  alert: 'M12 3l10 18H2zM12 10v4M12 17h.01',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 7v5l3 2',
  block: 'M12 22a10 10 0 100-20 10 10 0 000 20zM5 5l14 14',
  minus: 'M5 12h14',
  question: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01',
  circle: 'M12 21a9 9 0 100-18 9 9 0 000 18z',
  half: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v18',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  upload: 'M12 21V9M7 14l5-5 5 5M5 3h14',
  save: 'M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  note: 'M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  wifioff: 'M2 2l20 20M8.5 16.5a5 5 0 017 0M5 12.9a10 10 0 015.2-2.8M19 12.9a10 10 0 00-2.1-1.5M2 8.8a15 15 0 014.2-2.7M22 8.8A15 15 0 0010.7 5M12 20h.01',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  history: 'M3 12a9 9 0 103-6.7L3 8M3 3v5h5M12 7v5l3 2',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  gate: 'M4 21V5l8-3 8 3v16M9 21v-6h6v6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  exit: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  cpu: 'M7 7h10v10H7zM10 10h4v4h-4zM4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.3a3.5 3.5 0 010 6.4M18 14a6.5 6.5 0 013.5 6',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  linkedin: 'M4 4h16v16H4zM8 11v5M8 8v.01M12 16v-5M12 13.5a2.5 2.5 0 015 0V16',
  play: 'M8 5l11 7-11 7z',
  route: 'M5 19a2 2 0 100-4 2 2 0 000 4zM19 9a2 2 0 100-4 2 2 0 000 4zM7 17c5 0 3-6 6-6s3-4 4-4',
  mark: 'M3 18l5-11 4 8 4-8 5 11',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
};

export function icon(name, cls = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICONS[name] || ICONS.circle);
  svg.appendChild(path);
  return svg;
}

// Save a Blob: prefer the File System Access "Save as…" dialog when available, otherwise a normal download.
// Returns 'saved' | 'downloaded' | 'cancelled'.
export async function saveBlob(blob, suggestedName, { description = 'File', accept } = {}) {
  if (typeof window.showSaveFilePicker === 'function' && accept) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: [{ description, accept }] });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return 'saved';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      // Fall through to a regular download if the picker is unavailable or refused.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: suggestedName, style: { display: 'none' } });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'downloaded';
}

export function pickFile({ accept = '', multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, multiple, style: { display: 'none' } });
    input.addEventListener('change', () => { resolve(Array.from(input.files || [])); input.remove(); });
    input.addEventListener('cancel', () => { resolve([]); input.remove(); });
    document.body.appendChild(input);
    input.click();
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

// Accessible modal using the native <dialog> element. Resolves with the value passed to close().
export function modal({ title, body, actions = [], wide = false, onOpen }) {
  return new Promise((resolve) => {
    const titleId = `dlg-${Math.random().toString(36).slice(2, 9)}`;
    const dlg = h('dialog', { class: ['modal', wide && 'modal-wide'], 'aria-labelledby': titleId });
    const opener = document.activeElement;
    const openerKey = opener && opener.dataset ? opener.dataset.focusKey : null;
    const close = (v) => {
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve(v);
      // Return focus to the control that opened the dialog (or its re-rendered replacement), else to the page title.
      setTimeout(() => {
        const target = (opener && opener.isConnected && opener) || (openerKey && document.querySelector(`[data-focus-key="${CSS.escape(openerKey)}"]`)) || document.getElementById('page-title');
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      }, 0);
    };
    const header = h('div', { class: 'modal-head' }, h('h2', { id: titleId }, title), h('button', { class: 'btn-icon', type: 'button', 'aria-label': 'Close dialog', onclick: () => close(undefined) }, icon('x')));
    const content = h('div', { class: 'modal-body' }, typeof body === 'function' ? body(close) : body);
    // A function value is a validator: returning null keeps the dialog open. A plain value, null included (Cancel), closes it.
    const footer = h('div', { class: 'modal-foot' }, actions.map((a) => h('button', { type: 'button', class: ['btn', a.kind && `btn-${a.kind}`], onclick: () => {
      if (typeof a.value !== 'function') { close(a.value === undefined ? true : a.value); return; }
      const v = a.value();
      if (v !== null) close(v);
    } }, a.label)));
    dlg.append(header, content, actions.length ? footer : null);
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(undefined); });
    document.body.appendChild(dlg);
    dlg.showModal();
    if (onOpen) onOpen(dlg);
  });
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, cancelLabel = 'Cancel' }) {
  return modal({
    title,
    body: h('div', null, ...(Array.isArray(message) ? message : [message]).map((m) => (m instanceof Node ? m : h('p', null, m)))),
    actions: [{ label: cancelLabel, value: false }, { label: confirmLabel, kind: danger ? 'danger' : 'primary', value: true }],
  }).then((v) => v === true);
}

let toastRegion;
// Created at start-up so that screen readers already track the live region when the first message arrives.
export function initToasts() {
  if (!toastRegion) {
    toastRegion = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(toastRegion);
  }
}
// A reminder that stays until you act on it. actions: [{ label, kind, onClick }]. Returns a function that closes it.
export function stickyToast(message, actions = [], tone = 'caution') {
  initToasts();
  const t = h('div', { class: ['toast', 'toast-sticky', `toast-${tone}`], role: 'alert' });
  const close = () => t.remove();
  t.append(icon('alert'), h('span', null, message), h('span', { class: 'toast-actions' }, actions.map((a) => h('button', { type: 'button', class: ['btn', 'btn-sm', a.kind && `btn-${a.kind}`], onclick: () => { close(); if (a.onClick) a.onClick(); } }, a.label))));
  toastRegion.appendChild(t);
  return close;
}

export function toast(message, tone = 'info', timeout = 5000) {
  initToasts();
  const t = h('div', { class: ['toast', `toast-${tone}`] }, icon(tone === 'good' ? 'check' : tone === 'bad' ? 'alert' : 'info'), h('span', null, message));
  toastRegion.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

export function field(label, control, { hint, id, required } = {}) {
  const fid = id || control.id || `f-${Math.random().toString(36).slice(2, 9)}`;
  control.id = fid;
  if (required) control.setAttribute('aria-required', 'true');
  return h('div', { class: 'field' },
    h('label', { for: fid }, label, required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
    control,
    hint ? h('div', { class: 'hint', id: `${fid}-hint` }, hint) : null);
}

export function readBlobBytes(blob) {
  return blob.arrayBuffer().then((b) => new Uint8Array(b));
}

// ───────── Motion and loading ─────────
// Motion follows the operating system unless the user chose "Reduce motion" in Settings.
export function reducedMotion() {
  const pref = document.body && document.body.dataset.motion === 'reduced';
  return pref || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function loaderEl(title, steps) {
  const items = steps.map((s) => h('li', null, h('span', { class: 'mark' }, icon('check', 'icon-xs')), h('span', null, s)));
  const skip = h('button', { type: 'button', class: 'btn btn-ghost btn-sm loader-skip' }, 'Skip');
  const el = h('div', { class: 'loader', role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'loader-card' },
      h('div', { class: 'loader-line', 'aria-hidden': 'true' }),
      h('h2', null, title),
      steps.length ? h('ul', { class: 'loader-steps' }, items) : null,
      skip));
  return { el, items, skip };
}

// Runs real work behind an overlay. The overlay appears only if the work takes longer than
// `delayMs`, and once shown stays at least `minMs`, so it never flickers.
export async function withLoader(title, task, { delayMs = 150, minMs = 400 } = {}) {
  let shown = null;
  let shownAt = 0;
  const timer = setTimeout(() => {
    shown = loaderEl(title, []);
    shown.skip.remove();
    document.body.appendChild(shown.el);
    shownAt = performance.now();
  }, delayMs);
  try {
    return await task();
  } finally {
    clearTimeout(timer);
    if (shown) {
      const left = minMs - (performance.now() - shownAt);
      if (left > 0) await wait(left);
      shown.el.remove();
    }
  }
}

// A short, honest sequence: each line names work that really happened. Skippable at any time
// (button, Escape, Enter); with reduced motion it is not shown at all.
export function showSequence(title, steps, { totalMs = 1600 } = {}) {
  if (reducedMotion() || !steps.length) return Promise.resolve();
  return new Promise((resolve) => {
    const { el, items, skip } = loaderEl(title, steps);
    let done = false;
    const timers = [];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey, true);
      el.remove();
      resolve();
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); finish(); } };
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(el);
    skip.focus({ preventScroll: true });
    const per = Math.max(180, Math.floor((totalMs - 300) / steps.length));
    items.forEach((li, i) => timers.push(setTimeout(() => li.classList.add('done'), 200 + per * i)));
    timers.push(setTimeout(finish, 200 + per * steps.length + 260));
  });
}

// A calm "saved" notice, bottom right: fades in, stays a moment, fades out. One element, reused,
// so it survives the page moving on underneath it.
let pulseEl = null;
let pulseTimer = null;
export function savedPulse(text = 'Saved') {
  if (!pulseEl) {
    pulseEl = h('div', { class: 'saved-pulse', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(pulseEl);
  }
  pulseEl.replaceChildren(icon('check', 'icon-sm'), h('span', null, text));
  pulseEl.classList.add('show');
  clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => pulseEl.classList.remove('show'), 1300);
}

export const celebrating = () => !!document.querySelector('dialog.celebrate[open]');

// A short celebration when a mission or a whole stage is finished: a check that pops, a burst of confetti and
// the way on. With reduced motion only the card appears. Resolves with the chosen action's value.
export function celebrate({ title, text, milestone = false, actions = [], grand = false, extra = null }) {
  // Never a second celebration on top of one that is open.
  if (celebrating()) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const calm = reducedMotion();
    const titleId = `cel-${Math.random().toString(36).slice(2, 9)}`;
    const dlg = h('dialog', { class: ['celebrate', milestone && 'milestone', grand && 'grand', calm && 'calm'], 'aria-labelledby': titleId });
    const close = (v) => { if (dlg.open) dlg.close(); dlg.remove(); resolve(v); };
    // A grand celebration bursts in three waves, wider.
    const bits = grand ? 72 : milestone ? 36 : 22;
    const burst = calm ? null : h('div', { class: 'confetti', 'aria-hidden': 'true' }, Array.from({ length: bits }, (_, i) => {
      const angle = (i / bits) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * (grand ? 230 : milestone ? 150 : 100);
      return h('span', { class: `bit b${i % 4}`, style: { '--x': `${Math.round(Math.cos(angle) * dist)}px`, '--y': `${Math.round(Math.sin(angle) * dist - 30)}px`, '--r': `${Math.round(Math.random() * 540 - 270)}deg`, '--d': `${Math.round(Math.random() * 120) + (grand ? (i % 3) * 420 : 0)}ms` } });
    }));
    dlg.append(
      h('div', { class: 'celebrate-card' },
        burst,
        h('div', { class: 'celebrate-mark', 'aria-hidden': 'true' }, icon(milestone ? 'flag' : 'check')),
        h('h2', { id: titleId }, title),
        text ? h('p', null, text) : null,
        extra,
        h('div', { class: 'celebrate-actions' }, actions.map((a) => h('button', { type: 'button', class: ['btn', a.kind && `btn-${a.kind}`], onclick: () => close(a.value) }, a.label)))));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(undefined); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(undefined); });
    document.body.appendChild(dlg);
    dlg.showModal();
    const primary = dlg.querySelector('.btn-primary');
    if (primary) primary.focus();
  });
}
