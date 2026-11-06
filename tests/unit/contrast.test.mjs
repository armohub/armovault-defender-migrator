// WCAG 2.x contrast check for the colour tokens used for text on their backgrounds (light and dark themes).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/app.css', 'utf8');
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2];
  return out;
}
const light = tokens(css.slice(css.indexOf(':root'), css.indexOf('body[data-theme="dark"]')));
const dark = { ...light, ...tokens(css.slice(css.indexOf('body[data-theme="dark"]'), css.indexOf('@media (prefers-color-scheme: dark)'))) };
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const pairs = [
  ['text', 'bg'], ['text', 'surface'], ['text-2', 'surface'], ['muted', 'surface'], ['muted', 'bg'], ['accent-strong', 'surface'], ['accent-text', 'accent'],
  ['good', 'good-soft'], ['bad', 'bad-soft'], ['caution', 'caution-soft'], ['info', 'info-soft'], ['neutral', 'neutral-soft'], ['accent-strong', 'accent-soft'], ['muted', 'surface-2'],
  // The brand: Signal figures (some are small, in the facts line), and the Ivory-on-Obsidian primary button.
  ['signal', 'surface'], ['signal', 'bg'], ['signal', 'surface-2'], ['primary-text', 'primary'], ['primary-text', 'primary-hover'],
];
// Champagne as text appears only in large display type (the italic accent word in a heading): WCAG AA large text, 3:1.
const largePairs = [['accent', 'bg'], ['accent', 'surface']];
for (const [name, t] of [['light', light], ['dark', dark]]) {
  test(`${name} theme: text/background pairs meet WCAG AA (4.5:1)`, () => {
    const fails = [];
    for (const [fg, bg] of pairs) {
      const r = ratio(t[fg], t[bg]);
      if (r < 4.5) fails.push(`${fg} on ${bg}: ${r.toFixed(2)}`);
    }
    for (const [fg, bg] of largePairs) {
      const r = ratio(t[fg], t[bg]);
      if (r < 3) fails.push(`${fg} on ${bg} (large text): ${r.toFixed(2)}`);
    }
    assert.deepEqual(fails, []);
  });
}
