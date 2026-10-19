// Static safety checks over the source tree.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(path.join(dir, d.name)) : [path.join(dir, d.name)])).filter((f) => /\.(m?js)$/.test(f));
}
const src = [...files('src'), ...files('content')];

test('no unsafe DOM sinks or dynamic code execution in app source', () => {
  const banned = [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML/, /document\.write/, /\beval\s*\(/, /new\s+Function\s*\(/, /setTimeout\s*\(\s*['"`]/];
  for (const f of src) {
    const text = fs.readFileSync(f, 'utf8');
    for (const re of banned) assert.equal(re.test(text), false, `${f} matches ${re}`);
  }
});

test('no network APIs in app source (the CSP also blocks them)', () => {
  const banned = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /new\s+WebSocket/, /EventSource/, /importScripts/];
  for (const f of files('src')) {
    const text = fs.readFileSync(f, 'utf8');
    for (const re of banned) assert.equal(re.test(text), false, `${f} matches ${re}`);
  }
});

test('no remote URLs are loaded as resources by the template or styles', () => {
  const html = fs.readFileSync('src/index.html', 'utf8');
  assert.equal(/<(script|link|img|iframe)[^>]+(src|href)=["']https?:/i.test(html), false);
  for (const f of fs.readdirSync('src/styles')) assert.equal(/url\(\s*['"]?https?:/i.test(fs.readFileSync(path.join('src/styles', f), 'utf8')), false, f);
});

test('the built file carries a strict CSP without unsafe-inline or unsafe-eval', () => {
  const built = 'dist/ArMoHub-Defender-Migration-Assistant.html';
  if (!fs.existsSync(built)) return; // built in the e2e step
  const html = fs.readFileSync(built, 'utf8');
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /connect-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
  assert.equal((html.match(/<\/script>/g) || []).length, 1, 'exactly one closing script tag');
});
