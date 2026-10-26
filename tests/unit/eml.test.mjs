// Outlook drafts: opened as a new message, UTF-8 safe, and headers that input cannot extend.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEml, emlFileName } from '../../src/core/eml.js';

const headerBlock = (eml) => eml.split('\r\n\r\n')[0];
const decodeSubject = (eml) => [...headerBlock(eml).matchAll(/=\?UTF-8\?B\?([A-Za-z0-9+/=]*)\?=/g)].map((m) => Buffer.from(m[1], 'base64').toString('utf8')).join('');
const parts = (eml) => [...eml.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map((m) => Buffer.from(m[1].replace(/\r\n/g, ''), 'base64').toString('utf8'));

test('a draft opens unsent in Outlook, with a plain and an HTML part', () => {
  const eml = buildEml({ subject: 'Sentinel moves', text: 'Hello', html: '<p>Hello</p>' });
  assert.match(eml, /^X-Unsent: 1\r\n/);
  assert.match(eml, /\r\nMIME-Version: 1\.0\r\n/);
  assert.match(eml, /Content-Type: multipart\/alternative; boundary="armo-dma-draft"/);
  const [plainPart, htmlPart] = parts(eml);
  assert.equal(plainPart, 'Hello');
  assert.match(htmlPart, /<p>Hello<\/p>/);
  assert.ok(eml.endsWith('--armo-dma-draft--\r\n'));
});

test('non-ASCII subject and body survive intact', () => {
  const eml = buildEml({ subject: 'Änderung für das SOC: Übergang ins Defender-Portal', text: 'Grüße, Zoë', html: '<p>Grüße</p>' });
  assert.equal(decodeSubject(eml), 'Änderung für das SOC: Übergang ins Defender-Portal');
  assert.equal(parts(eml)[0], 'Grüße, Zoë');
  for (const line of headerBlock(eml).split('\r\n')) assert.ok(line.length <= 78, `header line too long: ${line.length}`);
});

test('a line break in the subject cannot add a header', () => {
  const eml = buildEml({ subject: 'Hi\r\nBcc: someone@example.com', text: 'x', html: 'x' });
  assert.ok(!/^Bcc:/m.test(headerBlock(eml)));
  assert.equal(decodeSubject(eml), 'Hi Bcc: someone@example.com');
});

test('file names are safe and fall back', () => {
  assert.equal(emlFileName('Microsoft Sentinel moves: what it means for us'), 'Microsoft-Sentinel-moves-what-it-means-for-us.eml');
  assert.equal(emlFileName('../../evil\r\n'), 'evil.eml');
  assert.equal(emlFileName(''), 'email.eml');
});
