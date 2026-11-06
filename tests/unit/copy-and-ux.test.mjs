// Writing rules and UX settings introduced with the 1.0 redesign.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { KB } from '../../content/kb.mjs';
import { validateKb } from '../../scripts/validate-kb.mjs';
import { validateSettings, DEFAULT_SETTINGS } from '../../src/core/schema.js';
import { BRAND, APP_VERSION } from '../../src/brand.js';

function files(dir, re) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(path.join(dir, d.name), re) : [path.join(dir, d.name)])).filter((f) => re.test(f));
}

test('no long dashes anywhere in the app source, styles or knowledge base', () => {
  const offenders = [];
  for (const f of [...files('src', /\.(m?js|css|html)$/), ...files('content', /\.mjs$/)]) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((l, i) => { if (/[\u2013\u2014]/.test(l)) offenders.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(offenders, []);
});

test('the knowledge base passes every writing rule', () => {
  const r = validateKb(KB);
  assert.deepEqual(r.errors, []);
});

test('the validator catches long dashes, bare item codes, unknown links and misplaced actions', () => {
  const kb = structuredClone(KB);
  const c = kb.checks.find((x) => x.id === 'PREP-SCOPE-03');
  c.steps = ['Do this \u2014 then that.', 'See PREP-TOP-01 for details.', 'Open [[go:nowhere|a page]].', 'Link to [[PREP-NOPE-99]].', { text: 'Bad', extra: 1 }];
  kb.questions[0].help = 'Use [[do:add-note|a note]] here.';
  const r = validateKb(kb);
  const text = r.errors.join('\n');
  assert.match(text, /PREP-SCOPE-03.*long dash/);
  assert.match(text, /PREP-SCOPE-03.*item code PREP-TOP-01/);
  assert.match(text, /unknown page link "go:nowhere"/);
  assert.match(text, /link to unknown step "PREP-NOPE-99"/);
  assert.match(text, /unknown key "extra"/);
  assert.match(text, /only allowed in step content/);
});

test('guidance that sends people somewhere is clickable', () => {
  // Every "in the register" or "project setup" instruction in step text uses a link or an action.
  const loose = [];
  for (const c of KB.checks) {
    const texts = [...c.steps.flatMap((s) => (typeof s === 'string' ? [s] : [s.text, ...(s.bullets || []), s.tip || ''])), ...c.record, ...c.evidence];
    for (const t of texts) {
      const bare = t.replace(/\[\[[^\]]+\]\]/g, '');
      if (/\b(in|to) the register\b/i.test(bare) && !/\[\[(do|go):/.test(t)) loose.push(`${c.id}: ${t.slice(0, 80)}`);
      if (/\bproject setup\b/i.test(bare) && !/\[\[go:(project|window|environments|owners)/.test(t)) loose.push(`${c.id}: ${t.slice(0, 80)}`);
    }
  }
  assert.deepEqual(loose, []);
});

test('new settings have safe defaults and are validated', () => {
  assert.equal(DEFAULT_SETTINGS.theme, 'dark');
  const s = validateSettings({ introSeen: 'yes', autoAdvance: true, motion: 'wild' });
  assert.equal(s.introSeen, false, 'only a real boolean true marks the intro as seen');
  assert.equal(s.motion, 'system');
  // The questionnaire never moves on by itself any more, so an old auto-advance preference is dropped.
  assert.equal('autoAdvance' in s, false);
  assert.equal('autoAdvance' in DEFAULT_SETTINGS, false);
});

test('brand and version for the 1.0 release', () => {
  assert.equal(BRAND.productName, 'ArMo MS Defender Migration Assistant');
  assert.equal(APP_VERSION, '1.0.0');
  assert.deepEqual(BRAND.makers.map((m) => m.profileUrl), ['https://www.linkedin.com/in/arnoyan', 'https://www.linkedin.com/in/m-aub/']);
  assert.ok(!/rc|beta|pilot/i.test(KB.meta.version));
});

test('the brand typefaces ship with their licences and are the only font sources', () => {
  // ArMoHub brand: Instrument Serif (display), Inter Tight (text), JetBrains Mono (labels), all SIL OFL 1.1.
  for (const family of ['InstrumentSerif', 'InterTight', 'JetBrainsMono']) {
    assert.match(fs.readFileSync(`src/fonts/OFL-${family}.txt`, 'utf8'), /SIL OPEN FONT LICENSE/i, `${family} licence`);
    assert.ok(fs.readdirSync('src/fonts').some((f) => f.startsWith(`${family}-`) && f.endsWith('.woff2')), `${family} font file`);
  }
  assert.ok(!fs.readdirSync('src/fonts').some((f) => /^MonaSans/.test(f)), 'the previous typeface is gone');
  const css = fs.readFileSync('src/styles/app.css', 'utf8');
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)/g)].map((m) => m[1]);
  assert.deepEqual(urls.filter((u) => !/^__FONT_[A-Z_]+__$/.test(u) && !/^#[\w-]+$/.test(u)), []);
  for (const family of ['Instrument Serif', 'Inter Tight', 'JetBrains Mono']) assert.match(css, new RegExp(`font-family: "${family}"`), `${family} is declared`);
});
