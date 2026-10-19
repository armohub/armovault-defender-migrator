// Prototype P3: single self-contained HTML file + meta CSP that forbids all network access.
// Verifies that (a) hashed inline script runs on file://, (b) fetch/XHR/img/font/beacon to the network are blocked by the
// browser itself, (c) blob:/data: images still render (needed for evidence thumbnails), (d) print-to-PDF still works.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto'; import path from 'node:path'; import fs from 'node:fs';
const script = `
window.cspViolations = [];
document.addEventListener('securitypolicyviolation', (e) => window.cspViolations.push(e.violatedDirective + ' ' + e.blockedURI));
window.run = async () => {
  const r = {};
  try { await fetch('https://example.com/'); r.fetch = 'NOT BLOCKED'; } catch (e) { r.fetch = 'blocked'; }
  try { const x = new XMLHttpRequest(); x.open('GET', 'https://example.com/'); x.send(); r.xhr = 'sent?'; } catch (e) { r.xhr = 'blocked'; }
  r.beacon = navigator.sendBeacon ? String(navigator.sendBeacon('https://example.com/b', 'x')) : 'n/a';
  const img = new Image(); img.src = 'https://example.com/i.png'; document.body.appendChild(img);
  const blob = new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), c => c.charCodeAt(0))], { type: 'image/png' });
  const bimg = new Image(); bimg.src = URL.createObjectURL(blob); document.body.appendChild(bimg);
  await new Promise((res) => { bimg.onload = () => { r.blobImage = 'rendered ' + bimg.naturalWidth + 'x' + bimg.naturalHeight; res(); }; bimg.onerror = () => { r.blobImage = 'FAILED'; res(); }; });
  const s = document.createElement('script'); s.textContent = 'window.__injected = true'; document.body.appendChild(s);
  r.injectedInlineScriptRan = !!window.__injected;
  try { r.evalAllowed = eval('1+1') === 2; } catch (e) { r.evalAllowed = false; }
  await new Promise((res) => setTimeout(res, 500));
  r.violations = window.cspViolations;
  return r;
};`;
const hash = crypto.createHash('sha256').update(script).digest('base64');
const csp = `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src blob: data:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'`;
const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>P3</title><style>body{font-family:Segoe UI,system-ui,sans-serif}</style></head><body><h1>CSP single file</h1><script>${script}</script></body></html>`;
const file = path.resolve('prototypes/p3-csp-singlefile/single.html'); fs.writeFileSync(file, html);
const out = {};
for (const channel of ['msedge', 'chrome']) {
  const browser = await chromium.launch({ channel, headless: true });
  const ctx = await browser.newContext(); // NOTE: network NOT disabled here on purpose: CSP must block by itself
  const requests = []; ctx.on('requestfailed', (r) => { if (/^https?:/.test(r.url())) requests.push('FAILED ' + r.url() + ' ' + (r.failure() && r.failure().errorText)); }); ctx.on('response', (r) => { if (/^https?:/.test(r.url())) requests.push('RESPONSE ' + r.status() + ' ' + r.url()); });
  const page = await ctx.newPage(); await page.goto(pathToFileURL(file).href);
  out[channel] = await page.evaluate(() => window.run());
  out[channel].networkRequestsObserved = requests;
  const pdf = await page.pdf({ format: 'A4' }); out[channel].pdfBytes = pdf.length;
  await browser.close();
}
console.log(JSON.stringify(out, null, 2));
fs.writeFileSync('prototypes/p3-csp-results.json', JSON.stringify(out, null, 2));
