// Country from IP address, using the free DB-IP "IP to Country Lite" data (CC BY 4.0, db-ip.com).
// The IP is only looked up in memory to find a country code; it is never stored.
const fs = require('fs');
const path = require('path');

let v4 = null, v6 = null, loading = false;
const dir = path.dirname(require.resolve('@ip-location-db/dbip-country/package.json'));

function loadV4() {
  const lines = fs.readFileSync(path.join(dir, 'dbip-country-ipv4-num.csv'), 'utf8').split('\n');
  const n = lines.length;
  const s = new Uint32Array(n), e = new Uint32Array(n), c = new Uint16Array(n);
  let k = 0;
  for (const l of lines) {
    const p = l.split(',');
    if (p.length < 3) continue;
    s[k] = Number(p[0]); e[k] = Number(p[1]); c[k] = p[2].charCodeAt(0) * 256 + p[2].charCodeAt(1); k++;
  }
  return { s: s.subarray(0, k), e: e.subarray(0, k), c: c.subarray(0, k) };
}
function loadV6() {
  const lines = fs.readFileSync(path.join(dir, 'dbip-country-ipv6-num.csv'), 'utf8').split('\n');
  const n = lines.length;
  const s = new BigUint64Array(n), e = new BigUint64Array(n), c = new Uint16Array(n);
  let k = 0;
  for (const l of lines) {
    const p = l.split(',');
    if (p.length < 3) continue;
    s[k] = BigInt(p[0]) >> 64n; e[k] = BigInt(p[1]) >> 64n; c[k] = p[2].charCodeAt(0) * 256 + p[2].charCodeAt(1); k++;
  }
  return { s: s.subarray(0, k), e: e.subarray(0, k), c: c.subarray(0, k) };
}
function load() {
  if (loading || v4) return;
  loading = true;
  setTimeout(() => {
    try { v4 = loadV4(); v6 = loadV6(); } catch (err) { console.warn('Country lookup unavailable:', err.message); v4 = { s: [], e: [], c: [] }; v6 = v4; }
  }, 2000).unref();
}
load();

function find(db, x) {
  let lo = 0, hi = db.s.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (x < db.s[mid]) hi = mid - 1; else if (x > db.e[mid]) lo = mid + 1;
    else { const v = db.c[mid]; return String.fromCharCode(v >> 8, v & 255); }
  }
  return null;
}

function expandV6(ip) {
  let [head, tail] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail ? tail.split(':') : [];
  if (ip.includes('::')) while (h.length + t.length < 8) h.push('0');
  const parts = [...h, ...t].slice(0, 4); // only the top 64 bits are needed
  if (parts.length < 4) return null;
  return parts.reduce((a, p) => (a << 16n) | BigInt(parseInt(p || '0', 16)), 0n);
}

function country(ip) {
  if (!v4 || !ip) return null;
  try {
    ip = String(ip).replace(/^::ffff:/i, '').split('%')[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      const o = ip.split('.').map(Number);
      if (o.some((x) => x > 255)) return null;
      return find(v4, ((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3]);
    }
    if (ip.includes(':')) {
      const x = expandV6(ip);
      return x == null ? null : find(v6, x);
    }
  } catch { /* ignore */ }
  return null;
}

module.exports = { country };
