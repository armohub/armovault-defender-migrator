// Reusable presentational components.
import { h, icon, externalLink } from './dom.js';
import { statusById } from '../core/model.js';

export const STAGE_ICONS = { prepare: 'prepare', test: 'test', transition: 'transition', validate: 'validate' };

const STATUS_ICON = { not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' };

export function statusPill(status, { short = true } = {}) {
  const s = statusById(status);
  return h('span', { class: ['pill', `pill-${s.tone}`], title: s.label }, icon(STATUS_ICON[status] || 'circle', 'icon-xs'), short ? s.short : s.label);
}

export function critBadge(c) {
  return h('span', { class: ['badge', `badge-${c}`], title: `Criticality: ${c}` }, c);
}

export function kindChip(kind) {
  const label = { check: 'Check', task: 'Task', decision: 'Decision', gate: 'Gate' }[kind] || kind;
  return h('span', { class: 'chip chip-kind' }, label);
}

export function applicabilityChip(app) {
  if (!app) return null;
  if (app.value === 'unknown') return h('span', { class: 'chip chip-caution', title: app.reasons.join('\n') }, icon('question', 'icon-xs'), 'Applicability uncertain');
  if (app.value === 'not_applicable') return h('span', { class: 'chip chip-muted', title: app.reasons.join('\n') }, 'Not applicable to your answers');
  if (app.source === 'override') return h('span', { class: 'chip chip-info', title: app.reasons.join('\n') }, 'Applies (reviewer decision)');
  return null;
}

export function provenanceChip(c) {
  return c.provenance === 'official'
    ? h('span', { class: 'chip chip-accent', title: 'Derived from current Microsoft Learn documentation (see sources).' }, icon('shield', 'icon-xs'), 'Microsoft documentation')
    : h('span', { class: 'chip chip-info', title: 'Practical guidance from the makers of this tool — not a Microsoft requirement.' }, icon('user', 'icon-xs'), 'Practical guidance');
}

export function validationChip(c) {
  if (c.validation === 'needs-review') return h('span', { class: 'chip chip-caution', title: 'Microsoft sources conflict or are ambiguous for part of this item. See "Uncertainty".' }, icon('alert', 'icon-xs'), 'Needs review');
  return null;
}

export function progressBar(counts, { label } = {}) {
  const total = counts.inScope || 0;
  const segs = [
    ['passed', 'good'], ['not_verified', 'caution'], ['failed', 'bad'], ['blocked', 'bad-2'], ['needs_review', 'caution-2'], ['in_progress', 'info'],
  ];
  const bar = h('div', { class: 'progress', role: 'img', 'aria-label': label || `${counts.assessed || 0} of ${total} in-scope items assessed` });
  if (total > 0) {
    for (const [k, tone] of segs) {
      const n = counts[k] || 0;
      if (n) bar.appendChild(h('span', { class: ['seg', `seg-${tone}`], style: { width: `${(n / total) * 100}%` }, title: `${statusById(k).short}: ${n}` }));
    }
  }
  return bar;
}

export function conclusionBadge(assessment) {
  const tone = { ready: 'good', ready_with_exceptions: 'caution', undetermined: 'neutral', not_ready: 'bad', skipped: 'muted' }[assessment.level] || 'neutral';
  const ic = { ready: 'check', ready_with_exceptions: 'alert', undetermined: 'question', not_ready: 'x', skipped: 'minus' }[assessment.level] || 'question';
  return h('span', { class: ['conclusion', `conclusion-${tone}`] }, icon(ic, 'icon-sm'), assessment.label);
}

export function pageHead(title, lede, ...actions) {
  return h('div', { class: 'page-head' },
    h('div', { class: 'page-head-text' }, h('h1', { tabindex: '-1', id: 'page-title' }, title), lede ? h('p', { class: 'lede' }, lede) : null),
    actions.length ? h('div', { class: 'page-actions' }, ...actions) : null);
}

export function callout(tone, title, ...body) {
  const ic = { info: 'info', caution: 'alert', bad: 'alert', good: 'check' }[tone] || 'info';
  return h('div', { class: ['callout', `callout-${tone}`], role: tone === 'bad' ? 'alert' : null }, icon(ic, 'icon-sm'), h('div', null, title ? h('strong', null, title) : null, ...body));
}

export function emptyState(title, text, action) {
  return h('div', { class: 'empty' }, h('p', { class: 'empty-title' }, title), text ? h('p', { class: 'muted' }, text) : null, action || null);
}

export function sourceLine(kb, ref) {
  const s = kb.sources.find((x) => x.id === ref.id);
  if (!s) return h('li', null, ref.id);
  return h('li', { class: 'source' },
    externalLink(s.url, s.title),
    h('div', { class: 'small muted' }, `${s.publisher} · page date ${s.pageDate}${s.updated ? ` · updated ${s.updated}` : ''} · verified ${s.verified}`),
    ref.supports ? h('div', { class: 'small' }, 'Supports: ', ref.supports) : null);
}

export function btn(label, onclick, { kind, iconName, small, title, disabled, type = 'button', id } = {}) {
  return h('button', { type, id, class: ['btn', kind && `btn-${kind}`, small && 'btn-sm'], onclick, title, disabled, 'data-focus-key': `btn:${label}` }, iconName ? icon(iconName, 'icon-sm') : null, label);
}

export function linkBtn(label, href, { kind, iconName, small } = {}) {
  return h('a', { href, class: ['btn', kind && `btn-${kind}`, small && 'btn-sm'] }, iconName ? icon(iconName, 'icon-sm') : null, label);
}

export function kv(pairs) {
  return h('dl', { class: 'kv' }, ...pairs.filter(Boolean).flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v == null || v === '' ? '—' : v)]));
}

export function daysUntil(dateIso) {
  const ms = new Date(`${dateIso}T00:00:00Z`).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
