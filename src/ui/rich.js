// Rich text for knowledge-base content. Content is trusted (it ships with the app) but is still rendered
// through DOM nodes only. Supported markup inside any content string:
//   **bold**
//   [[ITEM-ID]]               link to another guided step, shown with that step's title
//   [[ITEM-ID|custom label]]  link to a step with a custom label
//   [[go:TARGET|label]]       link to a page of the app (targets below)
//   [[do:ACTION|label]]       a button that does something right here (actions below)
import { h, icon } from './dom.js';

import { GO_TARGETS, DO_ACTIONS, MARKUP_TOKEN } from '../../content/markup.mjs';
export { GO_TARGETS, DO_ACTIONS };

const TOKEN = MARKUP_TOKEN;

// ctx: { kb, actions: { [name]: () => void } }
export function rich(text, ctx = {}) {
  const frag = document.createDocumentFragment();
  const s = String(text == null ? '' : text);
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
    last = m.index + m[0].length;
    if (m[1] !== undefined) { frag.appendChild(h('strong', null, m[1])); continue; }
    const target = m[2].trim();
    const label = m[3] ? m[3].trim() : '';
    if (target.startsWith('go:')) {
      const key = target.slice(3);
      frag.appendChild(h('a', { href: GO_TARGETS[key] || '#/overview', class: 'xref xref-page' }, label || key, icon('chevron', 'icon-xs')));
    } else if (target.startsWith('do:')) {
      const action = target.slice(3);
      const fn = ctx.actions && ctx.actions[action];
      frag.appendChild(fn
        ? h('button', { type: 'button', class: 'inline-action', onclick: fn, 'data-focus-key': `do:${action}:${label}` }, actionIcon(action), label || action)
        : h('strong', null, label || action));
    } else {
      const item = ctx.kb && ctx.kb.checks.find((c) => c.id === target);
      frag.appendChild(item
        ? h('a', { href: `#/item/${item.id}`, class: 'xref', title: 'Open this step' }, label || item.title)
        : document.createTextNode(label || ''));
    }
  }
  if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
  return frag;
}

function actionIcon(action) {
  const map = { 'add-decision': 'gate', 'add-risk': 'flag', 'add-issue': 'alert', 'add-action': 'plus', 'add-exception': 'shield', 'add-control': 'shield', 'add-note': 'note', 'add-screenshot': 'image', 'add-file': 'file', 'add-link': 'link', 'set-owner': 'user', 'set-due': 'calendar', 'write-notes': 'edit', 'record-gate': 'gate', 'open-tool': 'edit', 'waive-evidence': 'minus', 'save-snapshot': 'history', 'import-inventory': 'upload', 'download-inventory-script': 'download' };
  return icon(map[action] || 'plus', 'icon-xs');
}

// Plain text version (for reports, CSV and accessible names): links become their labels.
export function plain(text, kb) {
  return String(text == null ? '' : text).replace(TOKEN, (all, bold, target, label) => {
    if (bold !== undefined) return bold;
    const t = target.trim();
    if (label) return label.trim();
    if (t.startsWith('go:') || t.startsWith('do:')) return t.slice(3);
    const item = kb && kb.checks.find((c) => c.id === t);
    return item ? item.title : '';
  });
}

// A step is a string, or { text, bullets?: [], tip? }.
export function renderSteps(steps, ctx) {
  return h('ol', { class: 'steps' }, steps.map((st) => {
    if (typeof st === 'string') return h('li', null, h('div', { class: 'step-text' }, rich(st, ctx)));
    return h('li', null,
      h('div', { class: 'step-text' }, rich(st.text, ctx)),
      st.bullets && st.bullets.length ? h('ul', { class: 'step-bullets' }, st.bullets.map((b) => h('li', null, rich(b, ctx)))) : null,
      st.tip ? h('p', { class: 'step-tip' }, icon('sparkle', 'icon-xs'), rich(st.tip, ctx)) : null);
  }));
}

export function renderList(items, ctx, cls = 'bullets') {
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (!arr.length) return null;
  return h('ul', { class: cls }, arr.map((x) => h('li', null, rich(x, ctx))));
}

// "Defender portal > System > Settings" rendered as a path of chips.
export function renderPath(path) {
  const parts = String(path).split(/\s+>\s+/);
  return h('span', { class: 'path' }, parts.flatMap((p, i) => [i ? h('span', { class: 'path-sep', 'aria-hidden': 'true' }, '›') : null, h('span', { class: 'path-seg' }, p)]));
}
