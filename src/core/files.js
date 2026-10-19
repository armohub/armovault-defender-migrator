// Hashing, MIME sniffing and CSV helpers. Imported files are untrusted: types are decided from
// the file's leading bytes, not from its name or the browser-reported type.

export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const startsWith = (u8, sig, at = 0) => sig.every((b, i) => u8[at + i] === b);

// Returns a safe MIME type or null when the content is not an accepted type.
export function sniffMime(u8) {
  if (!u8 || u8.length < 4) return null;
  if (startsWith(u8, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(u8, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(u8, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (u8.length >= 12 && startsWith(u8, [0x52, 0x49, 0x46, 0x46]) && startsWith(u8, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (startsWith(u8, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf';
  // Plain text: valid UTF-8 without NUL bytes, and not HTML/SVG markup (never rendered as markup anyway).
  const sample = u8.subarray(0, Math.min(u8.length, 8192));
  if (sample.includes(0)) return null;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(sample.length < u8.length ? sample.subarray(0, lastCompleteUtf8(sample)) : sample);
    const head = text.trimStart().slice(0, 200).toLowerCase();
    // Anything that starts like markup (HTML, SVG, XML, <script>…) is refused, so it can never be saved or opened as a page.
    if (head.startsWith('<')) return null;
    if (/<\s*(script|html|svg|iframe|object|embed)\b/i.test(text.slice(0, 8192))) return null;
    if (head.startsWith('{') || head.startsWith('[')) return 'application/json';
    return 'text/plain';
  } catch {
    return null;
  }
}

function lastCompleteUtf8(u8) {
  let i = u8.length;
  let back = 0;
  while (i > 0 && back < 4 && (u8[i - 1] & 0xc0) === 0x80) { i--; back++; }
  if (i > 0 && u8[i - 1] >= 0xc0) i--;
  return i;
}

export function extensionFor(mime) {
  return ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'application/pdf': 'pdf', 'application/json': 'json', 'text/plain': 'txt', 'text/csv': 'csv' })[mime] || 'bin';
}

// CSV per RFC 4180, with spreadsheet formula-injection neutralised (cells starting with = + - @ tab CR).
export function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvCell(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n'; // BOM so Excel opens UTF-8 correctly
}
