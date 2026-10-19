// Project package (.zip) export/import. The package is the durable record of a project:
//   manifest.json      format id, versions, created timestamp, file list with SHA-256 hashes
//   project.json       full project data (statuses, notes, answers, register, gates, snapshots, audit)
//   evidence/<id>.<ext> evidence binaries (screenshots, files) referenced by project.json
//   README.txt         plain-language description and a sensitivity warning
// Import verifies hashes, sniffs evidence types from content, and validates project.json defensively.

import { createZip, readZip } from './zip.js';
import { sha256Hex, sniffMime, extensionFor } from './files.js';
import { validateProject, MAX_PROJECT_JSON_BYTES } from './schema.js';
import { ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES } from './model.js';

export const PACKAGE_FORMAT = 'armohub.dma.package';
export const PACKAGE_VERSION = 1;
export const MAX_IMPORT_BYTES = 600 * 1024 * 1024;

const enc = new TextEncoder();
const dec = new TextDecoder();

// getEvidenceBytes(id) → Promise<Uint8Array|null>
export async function buildPackage(project, getEvidenceBytes, { appVersion, kbVersion, productName }) {
  const created = new Date();
  const files = [];
  const entries = [];
  const missing = [];
  for (const ev of Object.values(project.evidence)) {
    if (ev.kind !== 'image' && ev.kind !== 'file') continue;
    const bytes = await getEvidenceBytes(ev.id);
    if (!bytes) { missing.push(ev); continue; }
    const path = `evidence/${ev.id}.${extensionFor(ev.mime)}`;
    const sha256 = await sha256Hex(bytes);
    entries.push({ name: path, data: bytes, date: created, store: ev.kind === 'image' });
    files.push({ path, evidenceId: ev.id, sha256, size: bytes.length, mime: ev.mime });
  }
  const projectJson = JSON.stringify(project, null, 2);
  const projectBytes = enc.encode(projectJson);
  const manifest = {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_VERSION,
    projectSchemaVersion: project.schemaVersion,
    projectId: project.id,
    projectName: project.meta.name,
    createdAt: created.toISOString(),
    createdBy: project.meta.operatorName || '',
    appVersion,
    kbVersion,
    projectSha256: await sha256Hex(projectBytes),
    evidenceFiles: files,
    evidenceMissing: missing.map((e) => ({ evidenceId: e.id, fileName: e.fileName })),
  };
  const readme = [
    `${productName}: project package`,
    '',
    `Project: ${project.meta.name || '(unnamed)'}`,
    `Created: ${manifest.createdAt}`,
    `App version: ${appVersion}   Knowledge base: ${kbVersion}`,
    '',
    'Contents:',
    '  project.json  : all project data (answers, statuses, notes, register, decisions, snapshots, audit log)',
    '  evidence/     : attached screenshots and files',
    '  manifest.json : file list with SHA-256 hashes used to detect tampering or corruption on import',
    '',
    'SENSITIVITY: this package may contain customer security information and screenshots.',
    'Store and share it only according to your organisation\'s data-handling policy.',
    'The package is NOT encrypted. Protect it like any other confidential document.',
    '',
    'To continue working: open the app and choose "Open project package", then select this file.',
  ].join('\r\n');
  entries.unshift(
    { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)), date: created },
    { name: 'project.json', data: projectBytes, date: created },
    { name: 'README.txt', data: enc.encode(readme), date: created },
  );
  const blob = await createZip(entries);
  return { blob, manifest, missing };
}

const isZip = (u8) => u8.length >= 4 && u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04;

// Returns { project, evidence: Map<id, {bytes, mime}>, warnings[], source: 'package'|'json' }; throws Error for fatal problems.
export async function readProjectFile(bytes, { kb } = {}) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8.length > MAX_IMPORT_BYTES) throw new Error(`The file is larger than the ${Math.round(MAX_IMPORT_BYTES / 1048576)} MB import limit.`);
  const warnings = [];
  if (isZip(u8)) {
    // First pass: only the manifest and project file are decompressed.
    const head = await readZip(u8, undefined, (n) => n === 'manifest.json' || n === 'project.json');
    const manifestBytes = head.get('manifest.json');
    const projectBytes = head.get('project.json');
    if (!manifestBytes || !projectBytes) throw new Error('The package is missing manifest.json or project.json.');
    let manifest;
    try { manifest = JSON.parse(dec.decode(manifestBytes)); } catch { throw new Error('manifest.json is not valid JSON.'); }
    if (!manifest || manifest.format !== PACKAGE_FORMAT) throw new Error('This ZIP file is not a project package from the ArMo MS Defender Migration Assistant.');
    if (Number(manifest.formatVersion) > PACKAGE_VERSION) throw new Error('This package was created by a newer version of the app. Please use a newer release.');
    if (projectBytes.length > MAX_PROJECT_JSON_BYTES) throw new Error('project.json is too large.');
    // Hashes detect corruption and accidental modification. They are not a signature: someone who edits the
    // package deliberately can recompute them.
    if (typeof manifest.projectSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.projectSha256)) {
      warnings.push('The package has no integrity hash for project.json, so corruption cannot be detected.');
    } else if (manifest.projectSha256 !== (await sha256Hex(projectBytes))) {
      throw new Error('project.json does not match the hash recorded in the manifest. The package may be corrupt or modified.');
    }
    const parsed = parseJson(projectBytes);
    const res = validateProject(parsed, { kb });
    if (!res.ok) throw new Error(res.errors.join(' '));
    warnings.push(...res.warnings);
    const project = res.project;
    // Only evidence files that belong to image/file records of this project, listed once, are read.
    const listed = new Map();
    for (const f of Array.isArray(manifest.evidenceFiles) ? manifest.evidenceFiles.slice(0, 10000) : []) {
      if (!f || typeof f.path !== 'string' || typeof f.evidenceId !== 'string') continue;
      const ev = Object.prototype.hasOwnProperty.call(project.evidence, f.evidenceId) ? project.evidence[f.evidenceId] : null;
      if (!f.path.startsWith('evidence/')) { warnings.push(`Ignored manifest entry "${f.path.slice(0, 80)}" (not an evidence path).`); continue; }
      if (!ev || (ev.kind !== 'image' && ev.kind !== 'file')) { warnings.push(`Ignored ${f.path.slice(0, 80)}: not an attachment record of this project.`); continue; }
      if (listed.has(f.evidenceId)) { warnings.push(`Ignored duplicate manifest entry for ${f.evidenceId}.`); continue; }
      listed.set(f.evidenceId, f);
    }
    const wantedPaths = new Set([...listed.values()].map((f) => f.path));
    const entries = await readZip(u8, undefined, (n) => wantedPaths.has(n));
    const extra = [...entries.keys()].filter((n) => !['manifest.json', 'project.json', 'README.txt'].includes(n) && !wantedPaths.has(n));
    if (extra.length) warnings.push(`${extra.length} file(s) in the package are not referenced by the manifest and were ignored.`);
    const evidence = new Map();
    for (const [evidenceId, f] of listed) {
      const ev = project.evidence[evidenceId];
      const data = entries.get(f.path);
      if (!data) { warnings.push(`Evidence file missing from package: ${ev.fileName || f.path}.`); continue; }
      const h = await sha256Hex(data);
      if (h !== f.sha256 || (ev.sha256 && ev.sha256 !== h)) { warnings.push(`Evidence "${ev.fileName || f.path}" failed its integrity check and was not imported.`); continue; }
      const mime = sniffMime(data);
      const allowed = ev.kind === 'image' ? ALLOWED_IMAGE_TYPES : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_FILE_TYPES];
      if (!mime || !allowed.includes(mime)) { warnings.push(`Evidence "${ev.fileName || f.path}" has an unsupported or unsafe content type and was not imported.`); continue; }
      ev.mime = mime;
      ev.size = data.length;
      ev.sha256 = h;
      evidence.set(ev.id, { bytes: data, mime });
    }
    for (const ev of Object.values(project.evidence)) {
      if ((ev.kind === 'image' || ev.kind === 'file') && !evidence.has(ev.id)) {
        warnings.push(`No file content for evidence "${ev.fileName || ev.title || ev.id}". The record is kept, the attachment is missing.`);
      }
    }
    if (Array.isArray(manifest.evidenceMissing) && manifest.evidenceMissing.length) {
      warnings.push(`${manifest.evidenceMissing.length} evidence attachment(s) were already missing when this package was created.`);
    }
    downgradeUnsupportedPasses(project, evidence, warnings);
    return { project, evidence, warnings, source: 'package' };
  }
  // Plain JSON export (no binaries).
  if (u8.length > MAX_PROJECT_JSON_BYTES) throw new Error('The JSON file is too large.');
  const parsed = parseJson(u8);
  const res = validateProject(parsed, { kb });
  if (!res.ok) throw new Error(res.errors.join(' '));
  const binaryEvidence = Object.values(res.project.evidence).filter((e) => e.kind === 'image' || e.kind === 'file').length;
  if (binaryEvidence) warnings.unshift(`This is a JSON data export: ${binaryEvidence} screenshot/file attachment(s) are referenced but not included. Use a project package (.zip) to move evidence files.`);
  warnings.push(...res.warnings);
  downgradeUnsupportedPasses(res.project, new Map(), warnings);
  return { project: res.project, evidence: new Map(), warnings, source: 'json' };
}

// A pass stays "verified" only if at least one supporting evidence item is actually present:
// a note or link, or an attachment whose file content was imported.
function downgradeUnsupportedPasses(project, evidence, warnings) {
  for (const [checkId, st] of Object.entries(project.checks)) {
    if (st.status !== 'passed' || st.evidenceWaiver) continue;
    const supported = st.evidenceIds.some((id) => {
      const ev = project.evidence[id];
      return ev && (ev.kind === 'note' || ev.kind === 'link' || evidence.has(id));
    });
    if (!supported) {
      st.status = 'not_verified';
      warnings.push(`${checkId}: was "Passed" but none of its evidence content is available, so it was imported as "Done, not verified".`);
    }
  }
}

function parseJson(u8) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch { throw new Error('The file is not valid UTF-8 text.'); }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try { return JSON.parse(text); } catch { throw new Error('The file is not valid JSON.'); }
}

// JSON data export for continuity/data exchange. Evidence binaries are referenced, not embedded.
export function buildJsonExport(project) {
  return new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
}
