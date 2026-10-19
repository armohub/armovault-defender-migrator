// Shared helpers for the P4 prototype tests. Windows only (spawns Windows PowerShell 5.1).
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const P4_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_DIR = path.resolve(P4_DIR, '..', '..');
export const LAUNCHER = path.join(P4_DIR, 'Start-ArMoConnected.ps1');

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Starts the launcher and resolves once it reports the port (or exits). Returns { port, proc, lines, exited }.
export function startLauncher(args = [], { script = LAUNCHER, timeoutMs = 20000, env } = {}) {
  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-NoBrowser', ...args], { windowsHide: true, env: env || process.env });
    const lines = [];
    const state = { proc, lines, port: 0, exited: null };
    let buf = '';
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(state); } };
    const onData = (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, '');
        buf = buf.slice(i + 1);
        lines.push(line);
        const m = /ARMO_P4_LISTENING port=(\d+)/.exec(line);
        if (m) { state.port = Number(m[1]); finish(); }
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => { state.exited = code; finish(); });
    setTimeout(finish, timeoutMs);
  });
}

export function stopLauncher(state) {
  if (state && state.exited === null) { try { execFileSync('taskkill', ['/PID', String(state.proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* already gone */ } }
}

export function waitForExit(state, timeoutMs) {
  return new Promise((resolve) => {
    if (state.exited !== null) return resolve(state.exited);
    const t = setTimeout(() => resolve('timeout'), timeoutMs);
    state.proc.on('exit', (code) => { clearTimeout(t); state.exited = code; resolve(code); });
  });
}

// Sends raw bytes and returns the parsed response. Lets tests send headers that browsers and fetch() would refuse.
export function rawRequest(port, request, { host = '127.0.0.1', timeoutMs = 15000, keepOpenMs = 0 } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = net.connect({ host, port });
    const chunks = [];
    let settled = false;
    const finish = (extra) => {
      if (settled) return; settled = true;
      clearTimeout(timer);
      sock.destroy();
      const all = Buffer.concat(chunks).toString('latin1');
      const headEnd = all.indexOf('\r\n\r\n');
      const head = headEnd >= 0 ? all.slice(0, headEnd) : all;
      const [statusLine, ...hl] = head.split('\r\n');
      const headers = {};
      for (const l of hl) { const c = l.indexOf(':'); if (c > 0) headers[l.slice(0, c).toLowerCase()] = l.slice(c + 1).trim(); }
      const m = /^HTTP\/1\.1 (\d{3})/.exec(statusLine || '');
      resolve({ status: m ? Number(m[1]) : 0, headers, body: headEnd >= 0 ? all.slice(headEnd + 4) : '', ms: Date.now() - started, ...extra });
    };
    const timer = setTimeout(() => finish({ timedOut: true }), timeoutMs);
    sock.on('connect', () => { if (request !== null) setTimeout(() => sock.write(typeof request === 'string' ? Buffer.from(request, 'latin1') : request), keepOpenMs); });
    sock.on('data', (d) => chunks.push(d));
    sock.on('end', () => finish({}));
    sock.on('close', () => finish({}));
    sock.on('error', (e) => finish({ error: e.code || e.message }));
  });
}

export const get = (port, pathname, headers = {}, opts = {}) => {
  const h = { Host: `localhost:${port}`, ...headers };
  const lines = [`${opts.method || 'GET'} ${pathname} HTTP/1.1`, ...Object.entries(h).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`)];
  return rawRequest(port, lines.join('\r\n') + '\r\n\r\n', opts);
};

export function freePort() {
  return new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
}

export function listen(host, port, body = 'SQUATTER') {
  return new Promise((resolve) => {
    const s = net.createServer((c) => { c.on('data', () => { c.end(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n${body}`); }); c.on('error', () => {}); });
    s.on('error', (e) => resolve({ ok: false, error: e.code }));
    s.listen({ host, port, exclusive: true }, () => resolve({ ok: true, server: s }));
  });
}

export function ps(command) {
  try { return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', windowsHide: true, timeout: 60000 }).trim(); } catch (e) { return `ERROR exit=${e.status} ${String(e.stdout || '').trim()} ${String(e.stderr || '').trim()}`.trim(); }
}

export function redact(value) {
  let s = JSON.stringify(value, null, 2);
  const swaps = [[REPO_DIR, '<repo>'], [os.tmpdir(), '<temp>'], [os.homedir(), '<home>']];
  for (const [from, to] of swaps) {
    for (const v of [from, from.replace(/\\/g, '\\\\'), from.replace(/\\/g, '/')]) s = s.split(v).join(to);
  }
  s = s.split(os.userInfo().username).join('<user>');
  return JSON.parse(s);
}

export function writeResults(name, data) {
  const file = path.join(P4_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(redact(data), null, 2) + '\n');
  return file;
}

export function makeChecker(results) {
  results.checks = results.checks || [];
  return (id, description, pass, observed) => {
    results.checks.push({ id, description, pass: !!pass, observed });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${description}${observed === undefined ? '' : ' -> ' + (typeof observed === 'string' ? observed : JSON.stringify(observed))}`);
  };
}
