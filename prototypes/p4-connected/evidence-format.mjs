// PROTOTYPE P4: parser for the evidence note exported by the connected-mode page
// (schema "armohub.dma.connected-evidence", version 1). Proposed as src/core/connected-evidence.js for release 2.
// Same rules as src/core/inventory.js: the file is untrusted input. Values are coerced and capped, only known fields
// are kept, and findings only ever become evidence notes labelled "imported". Nothing here changes a check status.

export const CONNECTED_EVIDENCE_SCHEMA = 'armohub.dma.connected-evidence';
export const MAX_CONNECTED_EVIDENCE_BYTES = 1024 * 1024;
// The checks the connected page reports on. A note that names any other check is not trusted for that finding.
export const CONNECTED_CHECK_IDS = Object.freeze(['TRN-13', 'VAL-12']);
const ALLOWED_REQUESTS = Object.freeze([
  'GET https://graph.microsoft.com/v1.0/security/incidents?$top=10&$expand=alerts',
  'POST https://graph.microsoft.com/v1.0/security/runHuntingQuery',
]);
const MAX_FINDINGS = 20;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const str = (v, max = 300) => (typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '').slice(0, max);
const arr = (v) => (Array.isArray(v) ? v : []);
const iso = (v) => { const s = str(v, 40); return /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(s) ? s : ''; };

export function parseConnectedEvidence(text, { knownCheckIds } = {}) {
  if (typeof text !== 'string') throw new Error('The file could not be read as text.');
  if (text.length > MAX_CONNECTED_EVIDENCE_BYTES) throw new Error('The file is larger than 1 MB and was not imported.');
  let obj;
  try { obj = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('The file is not valid JSON.'); }
  if (!isPlainObject(obj) || obj.schema !== CONNECTED_EVIDENCE_SCHEMA) throw new Error('This is not an evidence note from the connected-mode page (schema identifier missing).');
  if (Number(obj.schemaVersion) !== 1) throw new Error(`Unsupported connected-evidence schema version ${str(obj.schemaVersion, 10)}.`);
  if (obj.readOnly !== true) throw new Error('The note does not declare read-only collection, so it was not imported.');

  const warnings = [];
  const requests = arr(obj.requests).slice(0, 10).filter(isPlainObject).map((r) => {
    const line = `${str(r.method, 10)} ${str(r.url, 300)}`;
    if (!ALLOWED_REQUESTS.includes(line)) warnings.push(`The note lists an unexpected request (${line.slice(0, 120)}). Review it before relying on the findings.`);
    return { line, httpStatus: Number.isInteger(r.httpStatus) && r.httpStatus >= 0 && r.httpStatus < 600 ? r.httpStatus : 0, at: iso(r.at) };
  });

  const rawFindings = arr(obj.findings);
  if (rawFindings.length > MAX_FINDINGS) warnings.push(`Only the first ${MAX_FINDINGS} findings were read.`);
  const findings = [];
  const seen = new Set();
  for (const f of rawFindings.slice(0, MAX_FINDINGS)) {
    if (!isPlainObject(f)) { warnings.push('A finding was ignored (not an object).'); continue; }
    const checkId = str(f.checkId, 80);
    if (!CONNECTED_CHECK_IDS.includes(checkId) || (knownCheckIds && !knownCheckIds.includes(checkId))) { warnings.push(`A finding for "${checkId.slice(0, 40)}" was ignored (not a check the connected page reports on).`); continue; }
    if (seen.has(checkId)) { warnings.push(`A second finding for ${checkId} was ignored.`); continue; }
    seen.add(checkId);
    const title = str(f.title, 300);
    const body = str(f.text, 19000);
    if (!title || !body) { warnings.push(`The finding for ${checkId} was ignored (empty).`); continue; }
    findings.push({ checkId, title, text: body });
  }

  return {
    collectedAt: iso(obj.collectedAt),
    alias: str(isPlainObject(obj.tenant) ? obj.tenant.alias : '', 60),
    operator: str(obj.operator, 80),
    tool: isPlainObject(obj.tool) ? `${str(obj.tool.name, 80)} ${str(obj.tool.version, 20)}`.trim() : '',
    requests,
    findings,
    warnings,
  };
}
