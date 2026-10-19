import test from 'node:test';
import assert from 'node:assert/strict';
import { createZip, readZip, crc32, isSafeZipPath } from '../../src/core/zip.js';
import { sniffMime, toCsv, csvCell, sha256Hex } from '../../src/core/files.js';
import { validateProject, validateSettings } from '../../src/core/schema.js';
import { buildPackage, readProjectFile } from '../../src/core/package.js';
import { createProject, addEvidence, setCheckStatus } from '../../src/core/model.js';

const PNG = Uint8Array.from(Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6360000002000154A24F5D0000000049454E44AE426082', 'hex'));
const blobBytes = async (b) => new Uint8Array(await b.arrayBuffer());

test('crc32 known vector', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')).toString(16), 'cbf43926');
});

test('zip round trip with deflate and store entries', async () => {
  const big = 'x'.repeat(10000);
  const z = await createZip([{ name: 'a.txt', data: big }, { name: 'dir/b.png', data: PNG, store: true }]);
  const m = await readZip(await blobBytes(z));
  assert.equal(new TextDecoder().decode(m.get('a.txt')), big);
  assert.deepEqual(Array.from(m.get('dir/b.png')), Array.from(PNG));
});

test('zip reader rejects unsafe paths, garbage and truncation', async () => {
  assert.equal(isSafeZipPath('../evil'), false);
  assert.equal(isSafeZipPath('C:/x'), false);
  assert.equal(isSafeZipPath('a\\b'), false);
  assert.equal(isSafeZipPath('evidence/ev_1.png'), true);
  const z = await createZip([{ name: '../evil.txt', data: 'x' }]);
  await assert.rejects(readZip(await blobBytes(z)), /Unsafe path/);
  await assert.rejects(readZip(new Uint8Array(100)), /Not a valid ZIP/);
  const ok = await blobBytes(await createZip([{ name: 'a.txt', data: 'y'.repeat(5000) }]));
  await assert.rejects(readZip(ok.slice(0, ok.length - 30)), /./);
});

test('zip bomb guard: declared size lies are caught', async () => {
  const z = await blobBytes(await createZip([{ name: 'a.txt', data: 'z'.repeat(200000) }]));
  const dv = new DataView(z.buffer);
  let p = -1;
  for (let i = z.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { p = dv.getUint32(i + 16, true); break; }
  dv.setUint32(p + 24, 1000, true); // lie about the uncompressed size in the central directory
  await assert.rejects(readZip(z), /declared size|unexpected size|ratio/);
});

test('MIME sniffing ignores names and refuses markup', () => {
  assert.equal(sniffMime(PNG), 'image/png');
  assert.equal(sniffMime(new TextEncoder().encode('<svg onload=alert(1)>')), null);
  assert.equal(sniffMime(new TextEncoder().encode('<!DOCTYPE html><script>')), null);
  assert.equal(sniffMime(new TextEncoder().encode('hello')), 'text/plain');
  assert.equal(sniffMime(new Uint8Array([0, 1, 2, 3, 4])), null);
});

test('CSV escapes quotes/newlines and neutralises formulas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+1'), "'+1");
  assert.equal(csvCell('a,b'), '"a,b"');
  const csv = toCsv([{ key: 'a', label: 'A' }], [{ a: 'line1\nline2' }]);
  assert.ok(csv.startsWith('\uFEFFA\r\n"line1\nline2"'));
});

test('project validation rejects foreign files, newer schema and unsafe keys', () => {
  assert.equal(validateProject({}).ok, false);
  assert.equal(validateProject({ schema: 'armohub.dma.project', schemaVersion: 99, id: 'prj_x' }).ok, false);
  const p = createProject({});
  const raw = JSON.parse(JSON.stringify(p));
  raw.checks = JSON.parse('{"__proto__": {"polluted": true}, "P-1": {"status": "hacked", "notes": "<img src=x onerror=alert(1)>"}}');
  raw.meta.name = 'x'.repeat(10000);
  const r = validateProject(raw);
  assert.equal(r.ok, true);
  assert.equal({}.polluted, undefined);
  assert.equal(r.project.checks['P-1'].status, 'not_started');
  assert.equal(r.project.checks['P-1'].notes, '<img src=x onerror=alert(1)>', 'kept as inert text (rendered with textContent)');
  assert.equal(r.project.meta.name.length, 200);
  assert.ok(r.warnings.some((w) => /invalid key/.test(w)));
});

test('validation downgrades "passed" without evidence and unnamed acceptances', () => {
  const p = createProject({});
  const raw = JSON.parse(JSON.stringify(p));
  raw.checks = { 'P-1': { status: 'passed', evidenceIds: [] } };
  raw.register = [{ id: 'reg_1', type: 'exception', status: 'accepted', title: 'x', acceptedBy: '', rationale: '' }];
  const r = validateProject(raw);
  assert.equal(r.project.checks['P-1'].status, 'not_verified');
  assert.equal(r.project.register[0].status, 'open');
});

test('javascript: links in evidence are not kept as links', () => {
  const p = createProject({});
  const raw = JSON.parse(JSON.stringify(p));
  raw.evidence = { ev_1: { kind: 'link', url: 'javascript:alert(1)', checkId: 'P-1' } };
  const r = validateProject(raw);
  assert.equal(r.project.evidence.ev_1.url, '');
});

test('settings validation keeps only known values', () => {
  const s = validateSettings({ storageMode: 'cloud', theme: 'dark', evil: 1 });
  assert.equal(s.storageMode, 'none');
  assert.equal(s.theme, 'dark');
  assert.equal('evil' in s, false);
});

test('package round trip preserves evidence and detects tampering', async () => {
  const p = createProject({});
  p.meta.name = 'Round trip';
  p.meta.operatorName = 'Tester';
  const ev = addEvidence(p, 'P-1', { kind: 'image', title: 'Shot', fileName: 'shot.png', mime: 'image/png', size: PNG.length, sha256: await sha256Hex(PNG) });
  addEvidence(p, 'P-1', { kind: 'note', title: 'Obs', text: 'Seen it' });
  setCheckStatus(p, { id: 'P-1' }, 'passed');
  const { blob, missing } = await buildPackage(p, async (id) => (id === ev.id ? PNG : null), { appVersion: 't', kbVersion: 't', productName: 'Test' });
  assert.equal(missing.length, 0);
  const bytes = await blobBytes(blob);
  const back = await readProjectFile(bytes);
  assert.equal(back.source, 'package');
  assert.equal(back.project.meta.name, 'Round trip');
  assert.equal(back.project.checks['P-1'].status, 'passed');
  assert.deepEqual(Array.from(back.evidence.get(ev.id).bytes), Array.from(PNG));
  assert.equal(back.warnings.length, 0, back.warnings.join('; '));
  // Tamper with project.json inside the archive → rejected by the manifest hash.
  const entries = await readZip(bytes);
  const pj = JSON.parse(new TextDecoder().decode(entries.get('project.json')));
  pj.meta.name = 'Tampered';
  const rebuilt = await createZip([...entries].map(([name, data]) => ({ name, data: name === 'project.json' ? JSON.stringify(pj) : data })));
  await assert.rejects(readProjectFile(await blobBytes(rebuilt)), /hash/);
});

test('JSON export import warns that attachments are not included', async () => {
  const p = createProject({});
  addEvidence(p, 'P-1', { kind: 'image', title: 'Shot', fileName: 'shot.png', mime: 'image/png' });
  const back = await readProjectFile(new TextEncoder().encode(JSON.stringify(p)));
  assert.equal(back.source, 'json');
  assert.match(back.warnings[0], /not included/);
});

test('package with disguised evidence type is not imported', async () => {
  const p = createProject({});
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
  const ev = addEvidence(p, 'P-1', { kind: 'image', title: 'x', fileName: 'x.png', mime: 'image/png', sha256: await sha256Hex(svg) });
  const { blob } = await buildPackage(p, async () => svg, { appVersion: 't', kbVersion: 't', productName: 'Test' });
  const back = await readProjectFile(await blobBytes(blob));
  assert.equal(back.evidence.has(ev.id), false);
  assert.ok(back.warnings.some((w) => /unsupported or unsafe/.test(w)));
});
