// Prototype P1: what actually works when the app is opened from disk via file://
// Runs against the locally installed Microsoft Edge and Google Chrome (headless),
// with network access disabled and every non-file request logged.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const root = path.resolve('prototypes/p1-platform');
const url = (p) => pathToFileURL(path.join(root, p)).href;
const results = {};
const png = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6360000002000154A24F5D0000000049454E44AE426082', 'hex');
const pngPath = path.join(os.tmpdir(), 'p1-probe.png');
fs.writeFileSync(pngPath, png);

for (const channel of ['msedge', 'chrome']) {
  const r = (results[channel] = {});
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `p1-${channel}-`));
  const external = [];
  const launch = () => chromium.launchPersistentContext(userDataDir, { channel, headless: true, offline: true, acceptDownloads: true });
  let ctx = await launch();
  ctx.on('request', (req) => { if (!req.url().startsWith('file:') && !req.url().startsWith('blob:') && !req.url().startsWith('data:')) external.push(req.url()); });
  let page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(url('index.html'));
  await page.waitForTimeout(300);
  r.probe = await page.evaluate(() => window.probe());
  await page.evaluate(() => { window.writeMarker(); return window.idbMarker('write'); });
  r.consoleErrors = consoleErrors.slice(0, 5);
  // file input
  await page.setInputFiles('#f', pngPath);
  r.fileInput = await page.evaluate(() => window.readInputFile());
  // download
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => window.downloadTest())]);
  const dlPath = path.join(userDataDir, 'dl.json'); await dl.saveAs(dlPath);
  r.download = { suggestedFilename: dl.suggestedFilename(), content: fs.readFileSync(dlPath, 'utf8') };
  // shared-origin check: different file in a sub-directory and a "moved" copy
  const p2 = await ctx.newPage();
  await p2.goto(url('sub/other.html'));
  r.otherFileSameProfile = { localStorageMarker: await p2.evaluate(() => window.readMarker()), idbMarker: await p2.evaluate(() => window.idbMarker()) };
  await p2.goto(url('moved/index.html'));
  r.movedFileSameProfile = { localStorageMarker: await p2.evaluate(() => window.readMarker()), idbMarker: await p2.evaluate(() => window.idbMarker()) };
  // PDF via the browser print engine (same engine used by Ctrl+P > Save as PDF)
  await page.setContent('<html><head><style>@page{size:A4;margin:18mm} h1{color:#123} .pb{break-before:page}</style></head><body><h1>Report title</h1><p>Body text</p><div class="pb"><h2>Page 2</h2></div></body></html>');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  r.pdf = { bytes: pdf.length, header: pdf.subarray(0, 5).toString(), pages: (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length };
  await ctx.close();
  // relaunch same profile: does browser storage survive a browser restart?
  ctx = await launch();
  page = await ctx.newPage();
  await page.goto(url('index.html'));
  r.afterRestart = { localStorageMarker: await page.evaluate(() => window.readMarker()), idbMarker: await page.evaluate(() => window.idbMarker('read')) };
  await ctx.close();
  r.externalRequests = external;
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
fs.writeFileSync('prototypes/p1-platform-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
