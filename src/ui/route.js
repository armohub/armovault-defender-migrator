// The route: the journey from the Azure portal to the Defender portal drawn as one line with a stop
// per stage and a "You are here" marker. Pure geometry (no layout reads), so it renders anywhere.
import { h, setStyle } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style') setStyle(el, v); else el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) if (c != null && c !== false) el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

// Catmull-Rom through the points, as cubic Bezier segments: [[p0, c1, c2, p1], ...].
export function smooth(points, tension = 0.5) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const k = tension / 3;
    segs.push([p1, [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k], [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k], p2]);
  }
  return segs;
}

const bez = ([a, b, c, d], t) => {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]);
};
// Splits a segment at t and returns the first part (de Casteljau).
function head([a, b, c, d], t) {
  const lerp = (p, q) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const ab = lerp(a, b); const bc = lerp(b, c); const cd = lerp(c, d);
  const abc = lerp(ab, bc); const bcd = lerp(bc, cd);
  return [a, ab, abc, lerp(abc, bcd)];
}
const f = (n) => Math.round(n * 10) / 10;
export const pathD = (segs) => segs.map((g, i) => `${i ? '' : `M${f(g[0][0])} ${f(g[0][1])} `}C${f(g[1][0])} ${f(g[1][1])} ${f(g[2][0])} ${f(g[2][1])} ${f(g[3][0])} ${f(g[3][1])}`).join(' ');
export function segLength(g) {
  let len = 0; let prev = g[0];
  for (let i = 1; i <= 24; i += 1) { const p = bez(g, i / 24); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
  return len;
}
export const totalLength = (segs) => segs.reduce((a, g) => a + segLength(g), 0);

// Path up to segment index `i` at fraction `t` of that segment.
function partial(segs, i, t) {
  const out = segs.slice(0, i);
  if (t > 0 && segs[i]) out.push(head(segs[i], Math.min(1, t)));
  return out;
}

const VIEW = { w: 1000, h: 250 };
// Start, one stop per stage, end. Gently climbs left to right. One point set per number of stops.
const POINT_SETS = {
  4: [[22, 214], [236, 182], [470, 148], [712, 110], [930, 62], [984, 48]],
  5: [[22, 216], [178, 198], [366, 174], [560, 144], [750, 106], [930, 62], [984, 48]],
};

function contours() {
  return Array.from({ length: 8 }, (_, i) => s('path', { class: 'route-contour', d: `M-20 ${262 - i * 27} C 220 ${236 - i * 30}, 430 ${270 - i * 34}, 650 ${206 - i * 28} S 900 ${178 - i * 24}, 1030 ${150 - i * 26}` }));
}

// stages: [{ name, meta, href, state: 'done' | 'current' | 'todo' | 'skipped' }] (four or five entries)
// marker: { index, fraction } where index is the stage being worked on, or stages.length when everything is done.
// Last marker position per route, so the marker glides to its new place when progress changes.
const lastMarker = new Map();

export function routeView({ stages, marker, animate = true, label = 'Your route', key = 'overview' }) {
  const N = stages.length;
  const POINTS = POINT_SETS[N] || POINT_SETS[4];
  const segs = smooth(POINTS);
  const idx = Math.max(0, Math.min(N, marker.index));
  const frac = idx >= N ? 1 : Math.max(0.04, Math.min(0.96, marker.fraction));
  const done = idx >= N ? segs.slice(0, N + 1) : partial(segs, idx, frac);
  const doneLen = totalLength(done);
  const pos = idx >= N ? POINTS[N + 1] : bez(segs[idx], frac);
  const tagW = 104;
  const tagX = Math.min(VIEW.w - tagW - 4, Math.max(4, pos[0] - tagW / 2));
  const tagAbove = pos[1] > 70;

  const stops = stages.map((st, i) => {
    const [x, y] = POINTS[i + 1];
    const name = st.name;
    const g = s('a', { class: ['route-stop', st.state].join(' '), href: st.href, 'aria-label': `${name}: ${st.meta}` },
      s('circle', { class: 'ring', cx: x, cy: y, r: 11 }),
      st.state === 'done' ? s('path', { class: 'tick', d: `M${x - 4.5} ${y} l3 3 6-6.5` }) : null,
      s('text', { class: 'stop-name', x, y: y + 34, 'text-anchor': 'middle' }, name),
      s('text', { class: /\d/.test(st.meta) ? 'stop-meta num' : 'stop-meta', x, y: y + 52, 'text-anchor': 'middle' }, st.meta));
    return g;
  });

  const svg = s('svg', { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, 'aria-hidden': 'false', role: 'group', 'aria-label': label },
    ...contours(),
    s('path', { class: 'route-todo', d: pathD(segs) }),
    done.length ? s('path', { class: ['route-halo', animate && 'route-draw'].filter(Boolean).join(' '), d: pathD(done), style: `--len:${Math.ceil(doneLen) + 2}` }) : null,
    done.length ? s('path', { class: ['route-done', animate && 'route-draw'].filter(Boolean).join(' '), d: pathD(done), style: `--len:${Math.ceil(doneLen) + 2}` }) : null,
    s('text', { class: 'route-end', x: POINTS[0][0], y: POINTS[0][1] + 26 }, s('tspan', { x: POINTS[0][0] }, 'SENTINEL IN THE'), s('tspan', { x: POINTS[0][0], dy: 14 }, 'AZURE PORTAL')),
    s('text', { class: 'route-end', x: POINTS[N + 1][0], y: POINTS[N + 1][1] - 32, 'text-anchor': 'end' }, s('tspan', { x: POINTS[N + 1][0] }, 'SENTINEL IN THE'), s('tspan', { x: POINTS[N + 1][0], dy: 14 }, 'DEFENDER PORTAL')),
    ...stops,
    s('g', { class: 'route-marker', 'aria-hidden': 'true' },
      s('circle', { class: 'pulse', cx: pos[0], cy: pos[1], r: 15 }),
      s('circle', { class: 'core', cx: pos[0], cy: pos[1], r: 7 }),
      s('g', { class: 'tag', transform: `translate(${f(tagX)} ${f(tagAbove ? pos[1] - 46 : pos[1] + 20)})` },
        s('rect', { width: tagW, height: 26, rx: 7 }),
        s('text', { x: tagW / 2, y: 17.5, 'text-anchor': 'middle' }, idx >= N ? 'You made it' : 'You are here'))));
  const m = svg.querySelector('.route-marker');
  const prev = lastMarker.get(key);
  lastMarker.set(key, pos);
  if (prev && (Math.abs(prev[0] - pos[0]) > 0.5 || Math.abs(prev[1] - pos[1]) > 0.5)) {
    // Start where the marker was and let the CSS transition carry it to the new position.
    m.style.transform = `translate(${f(prev[0] - pos[0])}px, ${f(prev[1] - pos[1])}px)`;
    m.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { m.style.transition = ''; m.style.transform = 'none'; }));
  }
  return h('div', { class: 'route' }, svg, verticalRoute(stages, idx, frac));
}

// Below 900px the same route runs top to bottom, so every stop stays readable on a phone.
function verticalRoute(stages, idx, frac) {
  const items = [h('li', { class: 'rv-end done' }, 'Sentinel in the Azure portal')];
  stages.forEach((st, i) => {
    if (i === idx) items.push(h('li', { class: 'rv-here' }, h('span', { class: 'rv-dot', 'aria-hidden': 'true' }), h('span', { class: 'rv-tag' }, 'You are here'), h('span', { class: 'rv-meta num' }, `${Math.round(frac * 100)}% of ${st.name}`)));
    items.push(h('li', { class: ['rv-stop', st.state, i < idx && 'done'] }, h('a', { href: st.href }, h('span', { class: 'rv-ring', 'aria-hidden': 'true' }), h('b', null, st.name), h('span', { class: /\d/.test(st.meta) ? 'rv-meta num' : 'rv-meta' }, st.meta))));
  });
  if (idx >= stages.length) items.push(h('li', { class: 'rv-here' }, h('span', { class: 'rv-dot', 'aria-hidden': 'true' }), h('span', { class: 'rv-tag' }, 'You made it')));
  items.push(h('li', { class: ['rv-end', idx >= stages.length && 'done'] }, 'Sentinel in the Defender portal'));
  return h('ol', { class: 'route-v', 'aria-label': 'Your route, top to bottom' }, items);
}

// The questionnaire's progress, drawn on the same line: a ring per section and the marker at the current question.
export function questionStrip({ sections, position }) {
  // sections: [{ title, done: boolean, current: boolean }]; position: 0..1 along the strip
  const W = 1000; const Y = 14; const x0 = 8; const x1 = W - 8;
  const xs = sections.map((_, i) => x0 + ((i + 1) / sections.length) * (x1 - x0));
  const px = x0 + Math.max(0, Math.min(1, position)) * (x1 - x0);
  return h('div', { class: 'q-strip', 'aria-hidden': 'true' },
    s('svg', { viewBox: `0 0 ${W} 28` },
      s('line', { class: 'route-todo', x1: x0, y1: Y, x2: x1, y2: Y }),
      ...xs.map((x, i) => (sections[i].done ? s('line', { class: 'route-done', x1: f(i ? xs[i - 1] : x0), y1: Y, x2: f(x), y2: Y }) : null)),
      ...xs.map((x, i) => s('circle', { class: ['q-ring', sections[i].done && 'done', sections[i].current && 'current'].filter(Boolean).join(' '), cx: f(x), cy: Y, r: 7 })),
      s('circle', { class: 'q-marker', cx: f(px), cy: Y, r: 6 })));
}

// Builds the route model from stage summaries (see the overview).
export function routeModel(kb, stageInfo) {
  // stageInfo: [{ id, name, assessed, inScope, skipped, gateDone, href }]
  let index = stageInfo.length;
  let fraction = 1;
  for (let i = 0; i < stageInfo.length; i += 1) {
    const st = stageInfo[i];
    if (st.skipped) continue;
    const complete = st.inScope > 0 ? st.assessed >= st.inScope : true;
    if (!complete || !st.gateDone) { index = i; fraction = st.inScope ? st.assessed / st.inScope : 0; break; }
  }
  const stages = stageInfo.map((st, i) => {
    let state = 'todo';
    if (st.skipped) state = 'skipped';
    else if (i < index) state = 'done';
    else if (i === index) state = 'current';
    const meta = st.skipped ? 'skipped' : state === 'done' ? 'done' : st.meta || `${st.assessed} of ${st.inScope}`;
    return { name: st.name, meta, href: st.href, state };
  });
  return { stages, marker: { index, fraction } };
}
