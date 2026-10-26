// Outlook draft (.eml): an RFC 5322 message with "X-Unsent: 1", so Outlook for Windows opens it as a new
// message ready to send. Header values never carry line breaks from input. Bodies are UTF-8 in base64,
// which keeps every line short and cannot contain the MIME boundary.
const CRLF = '\r\n';
const BOUNDARY = 'armo-dma-draft';
const oneLine = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const b64 = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); };
const wrap76 = (s) => (s.match(/.{1,76}/g) || ['']).join(CRLF);

// RFC 2047 encoded words of at most 11 characters each (44 bytes at most), folded onto separate lines.
function encodeSubject(subject) {
  const chars = [...oneLine(subject)];
  const words = [];
  for (let i = 0; i < chars.length; i += 11) words.push(`=?UTF-8?B?${b64(chars.slice(i, i + 11).join(''))}?=`);
  return words.length ? words.join(`${CRLF} `) : '=?UTF-8?B??=';
}

export function buildEml({ subject, text, html }) {
  return [
    'X-Unsent: 1',
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${BOUNDARY}"`,
    '',
    `--${BOUNDARY}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(String(text || ''))),
    `--${BOUNDARY}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html || ''}</body></html>`)),
    `--${BOUNDARY}--`,
    '',
  ].join(CRLF);
}

export function emlFileName(subject) {
  const base = oneLine(subject).replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
  return `${base || 'email'}.eml`;
}
