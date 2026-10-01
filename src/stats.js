// Privacy-friendly site statistics: only counts are stored (per day, per page / referrer / clicked link).
// No cookies, no IP addresses and no user agents are saved. "Visitors" is approximate: it is worked out
// from a hash of IP + browser that is held in memory only, with a salt that changes every day.
const crypto = require('crypto');
const db = require('./db');

db.exec(`
CREATE TABLE IF NOT EXISTS stats_days (day TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, visitors INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS stats_pages (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS stats_refs (day TEXT NOT NULL, ref TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, ref));
CREATE TABLE IF NOT EXISTS stats_clicks (day TEXT NOT NULL, target TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, target));
`);

const BOT = /bot|crawl|spider|slurp|curl|wget|python|java|go-http|headless|preview|monitor|uptime|facebookexternalhit|lighthouse/i;
const MAX_PER_DAY = 1500; // safety cap on distinct paths / targets per day

let curDay = '';
let salt = '';
let seen = new Set();
function today() { return new Date().toISOString().slice(0, 10); }
function roll() {
  const d = today();
  if (d !== curDay) { curDay = d; salt = crypto.randomBytes(16).toString('hex'); seen = new Set(); }
  return d;
}

const upDay = db.prepare(`INSERT INTO stats_days (day, views, visitors) VALUES (?, 1, ?) ON CONFLICT(day) DO UPDATE SET views = views + 1, visitors = visitors + excluded.visitors`);
const upPage = db.prepare(`INSERT INTO stats_pages (day, path, n) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET n = n + 1`);
const upRef = db.prepare(`INSERT INTO stats_refs (day, ref, n) VALUES (?, ?, 1) ON CONFLICT(day, ref) DO UPDATE SET n = n + 1`);
const upClick = db.prepare(`INSERT INTO stats_clicks (day, target, n) VALUES (?, ?, 1) ON CONFLICT(day, target) DO UPDATE SET n = n + 1`);
const cntPages = db.prepare('SELECT COUNT(*) c FROM stats_pages WHERE day = ?');
const cntClicks = db.prepare('SELECT COUNT(*) c FROM stats_clicks WHERE day = ?');

function optedOut(req) {
  return req.get('dnt') === '1' || req.get('sec-gpc') === '1';
}

function refHost(req) {
  const r = req.get('referer');
  if (!r) return 'Direct / unknown';
  try {
    const h = new URL(r).hostname.replace(/^www\./, '');
    if (h === req.hostname.replace(/^www\./, '')) return null; // internal navigation
    return h.slice(0, 80) || 'Direct / unknown';
  } catch { return 'Direct / unknown'; }
}

function middleware(req, res, next) {
  if (req.method !== 'GET' || req.path.startsWith('/admin') || req.path.startsWith('/_')) return next();
  res.on('finish', () => {
    try {
      if (res.statusCode !== 200) return;
      if (!String(res.get('content-type') || '').includes('text/html')) return;
      if (optedOut(req)) return;
      const ua = req.get('user-agent') || '';
      if (!ua || BOT.test(ua)) return;
      const day = roll();
      const p = (req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path).slice(0, 120);
      const id = crypto.createHash('sha256').update(salt + '|' + req.ip + '|' + ua).digest('hex');
      const fresh = seen.has(id) ? 0 : 1;
      if (fresh) seen.add(id);
      db.transaction(() => {
        upDay.run(day, fresh);
        if (cntPages.get(day).c < MAX_PER_DAY) upPage.run(day, p);
        const ref = refHost(req);
        if (ref) upRef.run(day, ref);
      })();
    } catch (e) { /* statistics must never break the site */ }
  });
  next();
}

// Clicks on links that leave the site (and downloads), reported by a tiny script in the page.
function clickHandler(req, res) {
  res.status(204).end();
  try {
    if (optedOut(req)) return;
    const ua = req.get('user-agent') || '';
    if (!ua || BOT.test(ua)) return;
    let t = String(req.body.t || '').slice(0, 300);
    let target;
    if (t.startsWith('/')) target = t.split(/[?#]/)[0];
    else {
      const u = new URL(t);
      if (!/^https?:$/.test(u.protocol)) return;
      target = u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '');
    }
    target = target.slice(0, 150);
    const day = roll();
    if (cntClicks.get(day).c >= MAX_PER_DAY) return;
    upClick.run(day, target);
  } catch { /* ignore bad input */ }
}

function report(days) {
  const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const one = (sql) => db.prepare(sql).all(from);
  const daily = one('SELECT day, views, visitors FROM stats_days WHERE day >= ? ORDER BY day');
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    series.push(byDay.get(day) || { day, views: 0, visitors: 0 });
  }
  return {
    from, series,
    views: series.reduce((a, d) => a + d.views, 0),
    visitors: series.reduce((a, d) => a + d.visitors, 0),
    pages: one('SELECT path, SUM(n) n FROM stats_pages WHERE day >= ? GROUP BY path ORDER BY n DESC LIMIT 25'),
    refs: one('SELECT ref, SUM(n) n FROM stats_refs WHERE day >= ? GROUP BY ref ORDER BY n DESC LIMIT 15'),
    clicks: one('SELECT target, SUM(n) n FROM stats_clicks WHERE day >= ? GROUP BY target ORDER BY n DESC LIMIT 25'),
  };
}

function purge() {
  const cutoff = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  for (const t of ['stats_days', 'stats_pages', 'stats_refs', 'stats_clicks']) db.prepare(`DELETE FROM ${t} WHERE day < ?`).run(cutoff);
}
purge();
setInterval(purge, 24 * 3600 * 1000).unref();

module.exports = { middleware, clickHandler, report };
