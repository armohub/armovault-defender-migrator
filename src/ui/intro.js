// First-run introduction (about four seconds, skippable at any moment) and the short boot splash.
// Both respect reduced motion: everything is shown at once, without movement.
import { h, icon } from './dom.js';
import { s, smooth, pathD, totalLength } from './route.js';
import { BRAND } from '../brand.js';
import { armoMark } from './logo.js';

// The ArMo mark (the puzzle pieces locked inside a safe's dial), in a span that sets its size and colour.
export function brandMark(cls = 'brand-mark') {
  return h('span', { class: cls, 'aria-hidden': 'true' }, armoMark());
}

let splashEl = null;
let splashAt = 0;
export function showSplash() {
  splashEl = h('div', { class: 'splash', role: 'status', 'aria-label': `Starting ${BRAND.productName}` },
    h('div', { class: 'splash-inner' }, brandMark('splash-mark'), h('div', { class: 'splash-name' }, BRAND.productName), h('div', { class: 'splash-line', 'aria-hidden': 'true' })));
  document.body.appendChild(splashEl);
  splashAt = performance.now();
}
export async function hideSplash({ minMs = 650 } = {}) {
  if (!splashEl) return;
  const el = splashEl;
  splashEl = null;
  const reduced = document.body.dataset.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const left = reduced ? 0 : minMs - (performance.now() - splashAt);
  if (left > 0) await new Promise((r) => setTimeout(r, left));
  el.classList.add('gone');
  setTimeout(() => el.remove(), 400);
}

// The same climb as the overview route: Azure portal bottom left, Defender portal top right.
const POINTS = [[14, 262], [130, 236], [320, 212], [520, 176], [720, 146], [910, 108], [1090, 80], [1186, 58]];

export function playIntro({ sourceCount = 0 } = {}) {
  return new Promise((resolve) => {
    const stations = [
      ['wifioff', 'No internet needed', 'The browser blocks every network request.'],
      ['cpu', 'Processed on this device', 'Every calculation runs here, in one file.'],
      ['lock', 'Your data stays with you', 'Saved only where you choose: this browser or your own files.'],
      ['knowledge', 'Grounded in Microsoft Learn', `${sourceCount || 'Official'} documentation pages, cited on every step.`],
      ['users', 'Built by practitioners', 'Made by people who run these migrations in the field.'],
      ['code', 'Open for review', 'Every line is readable. Any doubts? Review the code.'],
    ];
    const segs = smooth(POINTS);
    const len = Math.ceil(totalLength(segs)) + 4;
    const station = ([ic, title, text], i, positioned) => {
      const [x, y] = POINTS[i + 1];
      const attrs = { class: ['station', positioned && i % 2 === 0 ? 'up' : null].filter(Boolean).join(' '), style: `--d:${700 + i * 400}ms;${positioned ? `left:${(x / 1200) * 100}%;top:${(y / 300) * 100}%` : ''}` };
      return h('div', attrs, h('div', { class: 'station-ic' }, icon(ic, 'icon')), h('div', { class: 'station-label' }, h('b', null, title), h('span', null, text)));
    };
    const finishDelay = 700 + stations.length * 400 + 300;
    const begin = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Let\'s begin', icon('arrow', 'icon-sm'));
    const skip = h('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Skip intro');
    const el = h('div', { class: 'intro', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'intro-title' },
      h('div', { class: 'intro-top' }, h('div', { class: 'intro-brand' }, brandMark(), BRAND.brandName), skip),
      h('div', { class: 'intro-stage' },
        h('div', { class: 'intro-headline' },
          h('h1', { id: 'intro-title' }, 'Welcome to the ', BRAND.productName),
          h('p', null, 'Your move from the Azure portal to the Defender portal, one clear step at a time.')),
        h('div', { class: 'intro-route' },
          s('svg', { viewBox: '0 0 1200 300', 'aria-hidden': 'true' },
            s('path', { class: 'intro-path-shadow', d: pathD(segs) }),
            s('path', { class: 'intro-path', d: pathD(segs), style: `--len:${len}` }),
            s('text', { class: 'route-end', x: POINTS[0][0], y: POINTS[0][1] + 26 }, s('tspan', { x: POINTS[0][0] }, 'SENTINEL IN THE'), s('tspan', { x: POINTS[0][0], dy: 14 }, 'AZURE PORTAL')),
            s('text', { class: 'route-end', x: POINTS[7][0], y: POINTS[7][1] - 32, 'text-anchor': 'end' }, s('tspan', { x: POINTS[7][0] }, 'SENTINEL IN THE'), s('tspan', { x: POINTS[7][0], dy: 14 }, 'DEFENDER PORTAL'))),
          h('div', { class: 'intro-stations' }, stations.map((st, i) => station(st, i, true)))),
        h('div', { class: 'intro-list' }, stations.map((st, i) => station(st, i, false))),
        h('div', { class: 'intro-end', style: `--d:${finishDelay}ms` },
          h('div', { class: 'intro-claim' }, 'Your data is yours.'),
          h('blockquote', { class: 'intro-quote' }, h('p', null, `“${BRAND.quote}”`), h('cite', null, BRAND.makers.map((m) => m.name).join(' and '))),
          begin)));
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      el.classList.add('leaving');
      setTimeout(() => { el.remove(); resolve(); }, 380);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        // Keep focus inside the introduction while it is open.
        const f = [skip, begin];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    };
    skip.addEventListener('click', close);
    begin.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(el);
    skip.focus({ preventScroll: true });
    // Move focus to the main button once it has appeared, unless the user already moved it.
    setTimeout(() => { if (!done && document.activeElement === skip) begin.focus({ preventScroll: true }); }, finishDelay + 500);
  });
}
