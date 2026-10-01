// Privacy-friendly site statistics: only counts are stored (per day, per page / referrer / clicked link).
// No cookies, no IP addresses and no user agents are saved. "Visitors" is approximate: it is worked out
// from a hash of IP + browser that is held in memory only, with a salt that changes every day.
const crypto = require('crypto');
const db = require('./db');
const geo = require('./geo');

db.exec(`
CREATE TABLE IF NOT EXISTS stats_days (day TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, visitors INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS stats_pages (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS stats_refs (day TEXT NOT NULL, ref TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, ref));
CREATE TABLE IF NOT EXISTS stats_countries (day TEXT NOT NULL, country TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, country));
CREATE TABLE IF NOT EXISTS stats_entries (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS stats_exits (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS stats_visits (day TEXT NOT NULL, bucket TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, pages INTEGER NOT NULL DEFAULT 0, secs INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, bucket));
CREATE TABLE IF NOT EXISTS stats_downloads (day TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, name));
CREATE TABLE IF NOT EXISTS stats_events (day TEXT NOT NULL, event TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, event));
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
  if (d !== curDay) { flushVisits(true); curDay = d; salt = crypto.randomBytes(16).toString('hex'); seen = new Set(); }
  return d;
}

// A "visit" is a run of page views by the same (scrambled, in-memory) visitor code with no gap longer than 30 minutes.
// While a visit is open we remember only its first page, latest page, page count and times, in memory.
// When it ends we save plain totals (entry page, exit page, how many pages, how long) and forget it.
const VISIT_GAP = 30 * 60 * 1000;
const MAX_OPEN = 50000;
const visits = new Map();
const upEntry = db.prepare(`INSERT INTO stats_entries (day, path, n) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET n = n + 1`);
const upExit = db.prepare(`INSERT INTO stats_exits (day, path, n) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET n = n + 1`);
const upVisit = db.prepare(`INSERT INTO stats_visits (day, bucket, n, pages, secs) VALUES (?, ?, 1, ?, ?) ON CONFLICT(day, bucket) DO UPDATE SET n = n + 1, pages = pages + excluded.pages, secs = secs + excluded.secs`);
const cntEntries = db.prepare('SELECT COUNT(*) c FROM stats_entries WHERE day = ?');
const bucketOf = (n) => (n <= 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : n <= 9 ? '5-9' : '10+');
function closeVisit(v) {
  try {
    db.transaction(() => {
      if (cntEntries.get(v.day).c < MAX_PER_DAY) { upEntry.run(v.day, v.first); upExit.run(v.day, v.last); }
      upVisit.run(v.day, bucketOf(v.pages), v.pages, Math.round((v.t - v.t0) / 1000));
    })();
  } catch (e) { /* ignore */ }
}
function flushVisits(all) {
  const now = Date.now();
  for (const [id, v] of visits) if (all || now - v.t > VISIT_GAP) { visits.delete(id); closeVisit(v); }
}
function touchVisit(id, day, p) {
  const now = Date.now();
  const v = visits.get(id);
  if (v && now - v.t <= VISIT_GAP) {
    if (v.last !== p) { v.pages += 1; v.last = p; } // a reload of the same page is not a new page
    v.t = now;
    return;
  }
  if (v) closeVisit(v);
  if (visits.size >= MAX_OPEN) flushVisits(false);
  visits.set(id, { day, first: p, last: p, pages: 1, t0: now, t: now });
}
setInterval(() => flushVisits(false), 2 * 60 * 1000).unref();
// save what is open if the server is stopped for an update
const closeAll = () => { try { flushVisits(true); } catch (e) { /* ignore */ } };
process.on('SIGTERM', () => { closeAll(); process.exit(0); });
process.on('SIGINT', () => { closeAll(); process.exit(0); });

// Downloads are counted on the server when the file is sent.
function downloadOf(req) {
  const p = req.path;
  let m;
  if ((m = p.match(/^\/docs\/([^/]+\.pdf)$/i))) return { kind: 'PDF document', name: m[1] };
  if ((m = p.match(/^\/tournaments\/([^/]+)\/schedule\.(pdf|xlsx)$/))) {
    const team = String(req.query.team || '').split('|')[0].slice(0, 40);
    return { kind: m[2] === 'pdf' ? 'Schedule PDF' : 'Schedule Excel', name: m[1] + (team ? ' / ' + team : '') };
  }
  if (p === '/calendar.ics') return { kind: 'Calendar (.ics)', name: 'All tournaments' };
  if ((m = p.match(/^\/tournaments\/([^/]+)\/calendar\.ics$/))) return { kind: 'Calendar (.ics)', name: m[1] };
  return null;
}
const upDownload = db.prepare(`INSERT INTO stats_downloads (day, kind, name, n) VALUES (?, ?, ?, 1) ON CONFLICT(day, kind, name) DO UPDATE SET n = n + 1`);
const cntDownloads = db.prepare('SELECT COUNT(*) c FROM stats_downloads WHERE day = ?');
const upEvent = db.prepare(`INSERT INTO stats_events (day, event, n) VALUES (?, ?, 1) ON CONFLICT(day, event) DO UPDATE SET n = n + 1`);
const EVENTS = /^(quiz-q([1-9]|10)|quiz-done|sched-team)$/;

const upDay = db.prepare(`INSERT INTO stats_days (day, views, visitors) VALUES (?, 1, ?) ON CONFLICT(day) DO UPDATE SET views = views + 1, visitors = visitors + excluded.visitors`);
const upPage = db.prepare(`INSERT INTO stats_pages (day, path, n) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET n = n + 1`);
const upRef = db.prepare(`INSERT INTO stats_refs (day, ref, n) VALUES (?, ?, 1) ON CONFLICT(day, ref) DO UPDATE SET n = n + 1`);
const upClick = db.prepare(`INSERT INTO stats_clicks (day, target, n) VALUES (?, ?, 1) ON CONFLICT(day, target) DO UPDATE SET n = n + 1`);
const upCountry = db.prepare(`INSERT INTO stats_countries (day, country, n) VALUES (?, ?, 1) ON CONFLICT(day, country) DO UPDATE SET n = n + 1`);
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
      const dl = downloadOf(req);
      const ok = res.statusCode === 200 || (res.statusCode === 206 && /^bytes=0-/.test(req.get('range') || ''));
      if (dl) {
        if (!ok || optedOut(req)) return;
        const ua0 = req.get('user-agent') || '';
        if (!ua0 || BOT.test(ua0)) return;
        const d0 = roll();
        if (cntDownloads.get(d0).c < MAX_PER_DAY) upDownload.run(d0, dl.kind, dl.name);
        return;
      }
      // a page the browser already had and re-checked comes back as 304; it is still a page view
      const again = res.statusCode === 304 && /text\/html/.test(req.get('accept') || '') && req.get('sec-fetch-dest') !== 'iframe';
      if (res.statusCode !== 200 && !again) return;
      if (!again && !String(res.get('content-type') || '').includes('text/html')) return;
      if (optedOut(req)) return;
      const ua = req.get('user-agent') || '';
      if (!ua || BOT.test(ua)) return;
      const day = roll();
      const p = (req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path).slice(0, 120);
      const id = crypto.createHash('sha256').update(salt + '|' + req.ip + '|' + ua).digest('hex');
      const fresh = seen.has(id) ? 0 : 1;
      if (fresh) seen.add(id);
      touchVisit(id, day, p);
      db.transaction(() => {
        upDay.run(day, fresh);
        if (fresh) upCountry.run(day, geo.country(req.ip) || '??');
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
    if (t.startsWith('event:')) {
      const ev = t.slice(6);
      if (EVENTS.test(ev)) upEvent.run(roll(), ev);
      return;
    }
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

function flow(one) {
  // pages with how many people entered there, left from there, and the share of views that were the last page of a visit
  const views = new Map(one('SELECT path, SUM(n) n FROM stats_pages WHERE day >= ? GROUP BY path').map((r) => [r.path, r.n]));
  const entries = new Map(one('SELECT path, SUM(n) n FROM stats_entries WHERE day >= ? GROUP BY path').map((r) => [r.path, r.n]));
  const exits = new Map(one('SELECT path, SUM(n) n FROM stats_exits WHERE day >= ? GROUP BY path').map((r) => [r.path, r.n]));
  const pageFlow = [...views.entries()].map(([path, n]) => ({ path, views: n, entries: entries.get(path) || 0, exits: exits.get(path) || 0, exitRate: Math.min(100, Math.round(((exits.get(path) || 0) / n) * 100)) })).sort((a, b) => b.views - a.views).slice(0, 40);
  const b = one('SELECT bucket, SUM(n) n, SUM(pages) pages, SUM(secs) secs FROM stats_visits WHERE day >= ? GROUP BY bucket');
  const order = ['1', '2', '3-4', '5-9', '10+'];
  const buckets = order.map((k) => b.find((x) => x.bucket === k) || { bucket: k, n: 0, pages: 0, secs: 0 });
  const total = buckets.reduce((a, x) => a + x.n, 0);
  const multi = buckets.filter((x) => x.bucket !== '1');
  const multiN = multi.reduce((a, x) => a + x.n, 0);
  const visitStats = {
    total, bounceRate: total ? Math.round((buckets[0].n / total) * 100) : 0,
    avgPages: total ? Math.round((buckets.reduce((a, x) => a + x.pages, 0) / total) * 10) / 10 : 0,
    avgSecs: multiN ? Math.round(multi.reduce((a, x) => a + x.secs, 0) / multiN) : 0,
    buckets,
  };
  const downloads = one('SELECT kind, name, SUM(n) n FROM stats_downloads WHERE day >= ? GROUP BY kind, name ORDER BY n DESC LIMIT 40');
  const downloadKinds = one('SELECT kind, SUM(n) n FROM stats_downloads WHERE day >= ? GROUP BY kind ORDER BY n DESC');
  const ev = new Map(one('SELECT event, SUM(n) n FROM stats_events WHERE day >= ? GROUP BY event').map((r) => [r.event, r.n]));
  const funnel = [];
  for (let i = 1; i <= 10; i += 1) funnel.push({ label: `Question ${i}`, n: ev.get('quiz-q' + i) || 0 });
  funnel.push({ label: 'Finished', n: ev.get('quiz-done') || 0 });
  return { pageFlow, visitStats, downloads, downloadKinds, downloadTotal: downloadKinds.reduce((a, x) => a + x.n, 0), funnel, schedTeam: ev.get('sched-team') || 0 };
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
    countries: one('SELECT country, SUM(n) n FROM stats_countries WHERE day >= ? GROUP BY country ORDER BY n DESC LIMIT 40'),
    clicks: one('SELECT target, SUM(n) n FROM stats_clicks WHERE day >= ? GROUP BY target ORDER BY n DESC LIMIT 25'),
    ...flow(one),
  };
}

function purge() {
  const cutoff = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  for (const t of ['stats_days', 'stats_countries', 'stats_pages', 'stats_refs', 'stats_clicks', 'stats_entries', 'stats_exits', 'stats_visits', 'stats_downloads', 'stats_events']) db.prepare(`DELETE FROM ${t} WHERE day < ?`).run(cutoff);
}
purge();
setInterval(purge, 24 * 3600 * 1000).unref();

module.exports = { middleware, clickHandler, report };
