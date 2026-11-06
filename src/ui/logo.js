// The ArMo mark: two puzzle pieces locked inside a safe's dial. The dial, its ticks and the open piece are drawn in
// currentColor (champagne on Obsidian, deep champagne on Ivory); the closed piece is filled with a champagne gradient.
// Geometry only, no text, so it reads at 16px and at 96px alike.
const NS = 'http://www.w3.org/2000/svg';
let seq = 0;

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) if (c) node.appendChild(c);
  return node;
};

export function armoMark({ title = '' } = {}) {
  const id = `armo-g-${(seq += 1)}`;
  const ticks = [];
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    const r1 = long ? 24.2 : 25.6;
    const r2 = 27.6;
    ticks.push(el('line', {
      x1: (32 + Math.sin(a) * r1).toFixed(2), y1: (32 - Math.cos(a) * r1).toFixed(2),
      x2: (32 + Math.sin(a) * r2).toFixed(2), y2: (32 - Math.cos(a) * r2).toFixed(2),
      'stroke-width': long ? 1.1 : 0.6, opacity: long ? 0.95 : 0.55,
    }));
  }
  const svg = el('svg', { viewBox: '0 0 64 64', class: 'armo-mark', role: title ? 'img' : 'presentation', 'aria-hidden': title ? 'false' : 'true', focusable: 'false' },
    title ? el('title', {}, document.createTextNode(title)) : null,
    el('defs', {}, el('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '1' },
      el('stop', { offset: '0', 'stop-color': '#f6e7bf' }),
      el('stop', { offset: '.55', 'stop-color': '#d4b26a' }),
      el('stop', { offset: '1', 'stop-color': '#a9843f' }))),
    // The dial: outer ring, the minute ticks, and the inner ring.
    el('g', { fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round' },
      el('circle', { cx: 32, cy: 32, r: 30.4, 'stroke-width': 1.3 }),
      el('g', {}, ...ticks),
      el('circle', { cx: 32, cy: 32, r: 21.6, 'stroke-width': 0.7, opacity: 0.5 })),
    // The pieces: the closed one, with its knob locked into the open one.
    el('path', { d: 'M16.5 21.5h14.5v6.3a4.2 4.2 0 1 1 0 8.4v6.3H16.5z', fill: `url(#${id})` }),
    el('path', { d: 'M31 21.5h16.5v21H31', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, 'stroke-linejoin': 'round' }));
  return svg;
}
