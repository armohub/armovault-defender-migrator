// Builds the single self-contained HTML file. No runtime dependencies; esbuild is a build-time tool only.
//   node scripts/build.mjs  ->  dist/<BRAND.distFile>, dist/kb.json, dist/SHA256SUMS.txt
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateKb } from './validate-kb.mjs';
import { BRAND, APP_VERSION } from '../src/brand.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [path.join(root, 'scripts/gen-content.mjs')], { stdio: 'inherit' });
const { KB } = await import('../content/kb.mjs');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

const kbCheck = validateKb(KB);
if (kbCheck.errors.length) {
  for (const e of kbCheck.errors) console.error('KB ERROR:', e);
  process.exit(1);
}
for (const w of kbCheck.warnings) console.warn('KB warning:', w);

const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  target: ['chrome115', 'edge115'],
  charset: 'utf8',
  legalComments: 'none',
  minify: false,
  write: false,
  logLevel: 'warning',
});

// The HTML parser normalises CRLF to LF inside <style> and <script>, so we hash exactly what the browser will see.
const toLf = (s) => s.replace(/\r\n?/g, '\n');
let js = toLf(result.outputFiles[0].text);
// Neutralise sequences that would end the inline <script> element early ("<\/script" is equivalent inside JS strings).
js = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
// The ArMoHub typefaces (Instrument Serif, Inter Tight, JetBrains Mono; SIL Open Font License 1.1) are embedded as
// data: URLs so the file stays offline and self-contained.
const fontUrl = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'src/fonts', file)).toString('base64')}`;
const FONT_FILES = {
  __FONT_SERIF_LATIN__: 'InstrumentSerif-latin.woff2', __FONT_SERIF_LATIN_EXT__: 'InstrumentSerif-latin-ext.woff2',
  __FONT_SERIF_ITALIC_LATIN__: 'InstrumentSerif-italic-latin.woff2', __FONT_SERIF_ITALIC_LATIN_EXT__: 'InstrumentSerif-italic-latin-ext.woff2',
  __FONT_SANS_LATIN__: 'InterTight-latin.woff2', __FONT_SANS_LATIN_EXT__: 'InterTight-latin-ext.woff2',
  __FONT_MONO_LATIN__: 'JetBrainsMono-latin.woff2', __FONT_MONO_LATIN_EXT__: 'JetBrainsMono-latin-ext.woff2',
};
const FONT_FAMILIES = [['Instrument Serif', 'InstrumentSerif'], ['Inter Tight', 'InterTight'], ['JetBrains Mono', 'JetBrainsMono']];
const fonts = Object.fromEntries(Object.entries(FONT_FILES).map(([k, f]) => [k, fontUrl(f)]));
let css = toLf(['app.css', 'print.css'].map((f) => fs.readFileSync(path.join(root, 'src/styles', f), 'utf8')).join('\n'));
for (const [k, v] of Object.entries(fonts)) css = css.split(k).join(v);
if (/__FONT_[A-Z_]+__/.test(css)) throw new Error('Unresolved font placeholder in CSS');
// The OFL requires its text to travel with every copy of the font, so the single HTML file carries the three licences.
const ofl = FONT_FAMILIES.map(([name, file]) => `${name}\n\n${toLf(fs.readFileSync(path.join(root, `src/fonts/OFL-${file}.txt`), 'utf8')).replace(/\*\//g, '* /')}`).join('\n\n');
css = `/* Embedded typeface licences (Instrument Serif, Inter Tight, JetBrains Mono)\n\n${ofl}\n*/\n${css}`;
if (/<\/style/i.test(css)) throw new Error('CSS must not contain </style');

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('base64');
const csp = [
  "default-src 'none'",
  `script-src 'sha256-${sha(js)}'`,
  `style-src 'sha256-${sha(css)}'`,
  'img-src blob: data:',
  'font-src data:',
  "connect-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let html = toLf(fs.readFileSync(path.join(root, 'src/index.html'), 'utf8'));
const replacements = {
  __CSP__: csp,
  __DESCRIPTION__: esc(BRAND.tagline),
  __PRODUCT__: esc(BRAND.productName),
  __VERSION__: esc(APP_VERSION),
  __KB__: esc(KB.meta.version),
};
for (const [k, v] of Object.entries(replacements)) html = html.split(k).join(v);
// CSS and JS are inserted last and verbatim (the CSP hashes cover their exact bytes).
html = html.replace('<style>__CSS__</style>', () => `<style>${css}</style>`).replace('<script>__JS__</script>', () => `<script>${js}</script>`);

const outName = BRAND.distFile;
for (const old of ['ArMoHub-Defender-Migration-Assistant.html']) fs.rmSync(path.join(dist, old), { force: true });
fs.writeFileSync(path.join(dist, outName), html, 'utf8');
fs.writeFileSync(path.join(dist, 'kb.json'), JSON.stringify(KB, null, 2), 'utf8');
fs.mkdirSync(path.join(dist, 'tools'), { recursive: true });
fs.copyFileSync(path.join(root, 'tools/Get-ArMoSentinelInventory.ps1'), path.join(dist, 'tools/Get-ArMoSentinelInventory.ps1'));
fs.mkdirSync(path.join(dist, 'licenses'), { recursive: true });
for (const [, file] of FONT_FAMILIES) fs.copyFileSync(path.join(root, `src/fonts/OFL-${file}.txt`), path.join(dist, `licenses/${file}-OFL.txt`));
for (const f of fs.readdirSync(path.join(dist, 'licenses'))) if (/^MonaSans/.test(f)) fs.rmSync(path.join(dist, 'licenses', f));
const hashFile = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(dist, f))).digest('hex');
const files = [outName, 'kb.json', 'tools/Get-ArMoSentinelInventory.ps1', ...FONT_FAMILIES.map(([, file]) => `licenses/${file}-OFL.txt`)];
fs.writeFileSync(path.join(dist, 'SHA256SUMS.txt'), files.map((f) => `${hashFile(f)}  ${f}`).join('\n') + '\n', 'utf8');
console.log(`Built dist/${outName} (${(html.length / 1024).toFixed(0)} KB), app ${APP_VERSION}, KB ${KB.meta.version}, ${kbCheck.stats.checks} items`);
console.log(`SHA-256 ${hashFile(outName)}`);
