// Minimal, dependency-free ZIP writer/reader built on the platform CompressionStream ('deflate-raw').
// Supports the STORE and DEFLATE methods, UTF-8 names, no encryption, no ZIP64.
// The reader treats input as untrusted: it enforces entry/size limits, rejects unsafe paths,
// encrypted entries and suspicious compression ratios, and verifies CRC-32 after decompression.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function pipeBytes(bytes, stream) {
  const out = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(out);
}

export const deflateRaw = (bytes) => pipeBytes(bytes, new CompressionStream('deflate-raw'));

// Inflate with a hard output cap (zip-bomb guard): aborts as soon as more than `maxBytes` are produced.
export async function inflateRawLimited(bytes, maxBytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('Entry expands beyond its declared size.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function dosDateTime(date) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = Math.max(1980, d.getUTCFullYear());
  return {
    time: ((d.getUTCHours() & 31) << 11) | ((d.getUTCMinutes() & 63) << 5) | ((Math.floor(d.getUTCSeconds() / 2)) & 31),
    date: (((year - 1980) & 127) << 9) | (((d.getUTCMonth() + 1) & 15) << 5) | (d.getUTCDate() & 31),
  };
}

const enc = new TextEncoder();

// entries: [{ name: 'a/b.json', data: Uint8Array|string, date?: Date, store?: boolean }]
export async function createZip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name);
    const raw = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
    const crc = crc32(raw);
    let method = 0;
    let body = raw;
    if (!e.store && raw.length > 64) {
      const compressed = await deflateRaw(raw);
      if (compressed.length < raw.length) { method = 8; body = compressed; }
    }
    const { time, date } = dosDateTime(e.date);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, method, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, body);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, method, true);
    cd.setUint16(12, time, true);
    cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, body.length, true);
    cd.setUint32(24, raw.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);
  return new Blob([...parts, ...central, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
}

export const ZIP_LIMITS = Object.freeze({
  maxEntries: 5000,
  maxEntryBytes: 64 * 1024 * 1024,
  maxTotalBytes: 600 * 1024 * 1024,
  maxRatio: 200,
});

export function isSafeZipPath(name) {
  if (!name || name.length > 300) return false;
  if (name.includes('\\') || name.includes('\0')) return false;
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return false;
  return !name.split('/').some((seg) => seg === '..' || seg === '.');
}

// Returns Map<name, Uint8Array>. Throws Error with a user-readable message on malformed or unsafe archives.
// `wanted(name)` (optional) limits decompression to the entries the caller needs; all entries are still safety-checked.
export async function readZip(bytes, limits = ZIP_LIMITS, wanted = null) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.length < 22) throw new Error('File is too small to be a project package.');
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid ZIP archive (end of central directory not found).');
  const count = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (count > limits.maxEntries) throw new Error(`Archive has too many entries (${count}).`);
  if (cdOffset + cdSize > u8.length) throw new Error('Archive directory is out of bounds (truncated or corrupt file).');
  const out = new Map();
  let p = cdOffset;
  let total = 0;
  const dec = new TextDecoder('utf-8', { fatal: false });
  for (let n = 0; n < count; n++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) throw new Error('Corrupt central directory entry.');
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const crc = dv.getUint32(p + 16, true);
    const csize = dv.getUint32(p + 20, true);
    const usize = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue; // directory entry
    if (!isSafeZipPath(name)) throw new Error(`Unsafe path in archive: "${name.slice(0, 80)}".`);
    if (flags & 0x1) throw new Error('Encrypted archives are not supported.');
    if (method !== 0 && method !== 8) throw new Error(`Unsupported compression method in "${name}".`);
    if (usize > limits.maxEntryBytes) throw new Error(`Entry "${name}" is larger than the ${Math.round(limits.maxEntryBytes / 1048576)} MB limit.`);
    total += usize;
    if (total > limits.maxTotalBytes) throw new Error('Archive expands beyond the total size limit.');
    if (method === 8 && csize > 0 && usize / csize > limits.maxRatio && usize > 1024 * 1024) throw new Error(`Suspicious compression ratio for "${name}".`);
    if (localOff + 30 > u8.length || dv.getUint32(localOff, true) !== 0x04034b50) throw new Error(`Corrupt local header for "${name}".`);
    const lName = dv.getUint16(localOff + 26, true);
    const lExtra = dv.getUint16(localOff + 28, true);
    const start = localOff + 30 + lName + lExtra;
    if (start + csize > u8.length) throw new Error(`Entry "${name}" is truncated.`);
    if (out.has(name)) throw new Error(`Duplicate entry "${name}".`);
    if (wanted && !wanted(name)) { out.set(name, null); continue; }
    const body = u8.subarray(start, start + csize);
    const data = method === 0 ? body.slice() : await inflateRawLimited(body, usize);
    if (data.length !== usize) throw new Error(`Entry "${name}" has an unexpected size.`);
    if (crc32(data) !== crc) throw new Error(`Entry "${name}" failed its integrity check (CRC mismatch).`);
    out.set(name, data);
  }
  return out;
}
