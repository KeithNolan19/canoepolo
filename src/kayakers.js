// Other tournaments happening today, read from Kayakers.nl (cpt.kayakers.nl) with the maintainer's permission.
// Polite by design: one request at a time with a pause between them, only events that are on today (or yesterday) are read,
// a circuit breaker backs off if their site struggles, and the admin can switch it all off. Visitors only ever read our own copy.
// We keep only the games (teams, times, pitches, scores). Organiser contact details on their pages are never read or stored.
const db = require('./db');
const live = require('./live');

const BASE = process.env.KAYAKERS_BASE || 'https://cpt.kayakers.nl';
const UA = 'canoepolo.eu (volunteer site; reads Kayakers.nl with the maintainer\'s permission; https://canoepolo.eu)';
const TODAY_MS = 3 * 60 * 1000;       // events on today: every 3 minutes
const YESTERDAY_MS = 30 * 60 * 1000;  // events that were on yesterday: every 30 minutes (late corrections)
const LIST_MS = 6 * 60 * 60 * 1000;   // the list of tournaments: every 6 hours
const GAP_MS = 1500;                  // pause between any two requests to their site

db.exec(`CREATE TABLE IF NOT EXISTS kayakers_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
db.exec(`CREATE TABLE IF NOT EXISTS kayakers_games (
  match_id TEXT PRIMARY KEY, slug TEXT NOT NULL, event TEXT NOT NULL, day TEXT, time TEXT, pitch TEXT, division TEXT, grp TEXT,
  team_a TEXT, team_b TEXT, score_a INTEGER, score_b INTEGER, status INTEGER, status_text TEXT, seen_at INTEGER NOT NULL)`);
const getSet = db.prepare('SELECT value FROM kayakers_settings WHERE key = ?');
const putSet = db.prepare('INSERT INTO kayakers_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
const enabled = () => process.env.KAYAKERS !== 'off' && ((getSet.get('on') || {}).value !== '0');
const setEnabled = (on) => putSet.run('on', on ? '1' : '0');

const st = { events: new Map(), lastList: 0, lastRead: new Map(), links: new Map(), fail: 0, pausedUntil: 0, lastOk: 0, lastError: '', reads: 0 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dublinToday = (off = 0) => new Date(Date.now() + off * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

function decode(s) {
  return String(s).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
}
const text = (h) => decode(String(h || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

async function get(path, json) {
  const now = Date.now();
  if (now < st.pausedUntil) throw new Error('paused after an error');
  await sleep(GAP_MS);
  try {
    const r = await fetch(BASE + path, { headers: { 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const body = json ? await r.json() : await r.text();
    if (st.fail > 0) live.logChange('', 'Kayakers.nl', 'Kayakers.nl is answering again', { comp: 'Other tournaments', source: 'Kayakers.nl website' });
    st.fail = 0; st.lastOk = Date.now(); st.lastError = '';
    return body;
  } catch (e) {
    st.fail++; st.lastError = String(e.message).slice(0, 100);
    st.pausedUntil = Date.now() + Math.min(st.fail, 2) * 10 * 60 * 1000;
    if (st.fail <= 2) live.logChange('', 'Kayakers.nl', `Kayakers.nl did not answer properly (${st.lastError}). Waiting ${Math.min(st.fail, 2) * 10} minutes`, { comp: 'Other tournaments', source: 'Kayakers.nl website' });
    throw e;
  }
}

// Read the match table of one Kayakers.nl match-list page. Returns [{ id, time, dateText, pitch, division, group, a, b, sa, sb, status, statusText }]
function parseMatchList(html) {
  const out = []; let time = '', dateText = '';
  for (const m of String(html).matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)) {
    const attrs = m[1], inner = m[2];
    if (/timeSlotHeader/.test(attrs)) {
      time = (inner.match(/<strong class="pull-left">\s*([0-9:]+)/) || [])[1] || '';
      dateText = text((inner.match(/<span>([\s\S]*?)<\/span>/) || [])[1]);
      continue;
    }
    const id = (attrs.match(/data-matchid="([^"]+)"/) || [])[1];
    if (!id) continue;
    const cells = [...inner.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    if (cells.length < 8) continue;
    const name = (c) => text((String(c).match(/class="teamNameContainer">([\s\S]*?)<\/a>/) || [])[1] || '');
    const goal = (c, k) => { const v = text((String(c).match(new RegExp('data-goals' + k + '>([\\s\\S]*?)<')) || [])[1]); return /^\d+$/.test(v) ? Number(v) : null; };
    out.push({
      id, time, dateText,
      pitch: text(cells[2]),
      division: text((cells[3].match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || cells[3]),
      group: text(cells[4]),
      a: name(cells[5]), b: name(cells[7]), sa: goal(cells[5], 'a'), sb: goal(cells[7], 'b'),
      status: Number((attrs.match(/data-status="(\d+)"/) || [])[1]),
      statusText: text((cells[0].match(/title="([^"]*)"/) || [])[1] || ''),
    });
  }
  return out;
}
// The match-list links on an event page: [{ day, vid }]
function parseLinks(html, slug) {
  const seen = new Set(), out = [];
  for (const m of String(html).matchAll(/href="\/MatchList\/([^"?]+)\?([^"]+)"/g)) {
    if (m[1] !== slug) continue;
    const q = new URLSearchParams(decode(m[2])); const day = q.get('day'), vid = q.get('vid');
    if (!/^\d{1,2}$/.test(day || '') || !/^[0-9a-f-]{36}$/i.test(vid || '')) continue;
    const k = day + vid; if (!seen.has(k)) { seen.add(k); out.push({ day, vid }); }
  }
  return out;
}
function isoDate(dateText, dates) { // "October 3rd" -> the event date that matches
  const mm = String(dateText).toLowerCase().match(/([a-z]+)\s+(\d{1,2})/); if (!mm) return null;
  const mo = MONTHS.indexOf(mm[1]); if (mo < 0) return null;
  const tail = `-${String(mo + 1).padStart(2, '0')}-${String(mm[2]).padStart(2, '0')}`;
  return (dates || []).find((d) => d.endsWith(tail)) || null;
}

const sel = db.prepare('SELECT * FROM kayakers_games WHERE match_id = ?');
const upsert = db.prepare(`INSERT INTO kayakers_games (match_id, slug, event, day, time, pitch, division, grp, team_a, team_b, score_a, score_b, status, status_text, seen_at)
  VALUES (@match_id, @slug, @event, @day, @time, @pitch, @division, @grp, @team_a, @team_b, @score_a, @score_b, @status, @status_text, @seen_at)
  ON CONFLICT(match_id) DO UPDATE SET slug=@slug, event=@event, day=@day, time=@time, pitch=@pitch, division=@division, grp=@grp, team_a=@team_a, team_b=@team_b, score_a=@score_a, score_b=@score_b, status=@status, status_text=@status_text, seen_at=@seen_at`);
const sc = (a, b) => (a == null || b == null ? 'not played' : `${a}-${b}`);

function store(ev, g, firstRead) {
  const row = { match_id: g.id, slug: ev.slug, event: ev.name, day: isoDate(g.dateText, ev.dates), time: g.time, pitch: g.pitch, division: g.division, grp: g.group, team_a: g.a, team_b: g.b, score_a: g.sa, score_b: g.sb, status: g.status, status_text: g.statusText, seen_at: Date.now() };
  const was = sel.get(g.id);
  upsert.run(row);
  if (!was || firstRead) return;
  const extra = { comp: `${ev.name} (${g.division || 'division not shown'})`, source: `Kayakers.nl match list (cpt.kayakers.nl/MatchList/${ev.slug})` };
  const lab = `${g.time} pitch ${g.pitch}: ${g.a} v ${g.b}`;
  const code = 'KY:' + g.id;
  if (was.status !== g.status && g.status !== 100) live.logChange(code, 'Kayakers.nl status', `${lab}: status now "${g.statusText}"`, extra);
  if (sc(was.score_a, was.score_b) !== sc(g.sa, g.sb)) live.logChange(code, was.status === 100 ? 'Kayakers.nl result corrected' : 'Kayakers.nl score', `${lab}: ${sc(was.score_a, was.score_b)} to ${sc(g.sa, g.sb)}`, extra);
  if (was.status !== 100 && g.status === 100) live.logChange(code, 'Kayakers.nl full time', `${lab}: ${sc(g.sa, g.sb)} full time`, extra);
  if (was.time !== g.time || was.pitch !== g.pitch) live.logChange(code, 'Kayakers.nl time or pitch', `${g.a} v ${g.b}: was ${was.time} pitch ${was.pitch}, now ${g.time} pitch ${g.pitch}`, extra);
  if (was.team_a !== g.a || was.team_b !== g.b) live.logChange(code, 'Kayakers.nl teams', `${lab}: teams were ${was.team_a} v ${was.team_b}`, extra);
}

async function refreshList() {
  const list = await get('/api/tournamentsv1/list', true);
  st.lastList = Date.now();
  try { const r = require('./kayakers-import').importList(list); if (r.added || r.updated) live.logChange('KY:list', 'Kayakers.nl tournaments', `Tournament list: ${r.added} added, ${r.updated} updated`, { comp: 'Tournament list', source: 'Kayakers.nl list (cpt.kayakers.nl/api/tournamentsv1/list)' }); } catch (e) { /* the list still works without the import */ }
  const today = dublinToday(), yday = dublinToday(-1);
  st.events.clear();
  for (const t of list) {
    const dates = [].concat(...(t.Venues || []).map((v) => v.Dates || [])).sort();
    const when = dates.includes(today) ? 'today' : dates.includes(yday) ? 'yesterday' : '';
    if (!when || !/\/View\/([\w-]+)$/.test(t.EventPage || '')) continue;
    st.events.set(t.EventPage.split('/').pop(), { slug: t.EventPage.split('/').pop(), name: String(t.Name).slice(0, 120), dates, when });
  }
}
async function readEvent(ev) {
  let links = st.links.get(ev.slug);
  if (!links || Date.now() - links.at > 60 * 60 * 1000) {
    const html = await get('/View/' + encodeURIComponent(ev.slug));
    links = { at: Date.now(), list: parseLinks(html, ev.slug) };
    st.links.set(ev.slug, links);
  }
  const firstRead = !db.prepare('SELECT 1 FROM kayakers_games WHERE slug = ? LIMIT 1').get(ev.slug);
  let n = 0;
  for (const l of links.list) {
    const html = await get(`/MatchList/${encodeURIComponent(ev.slug)}?day=${l.day}&vid=${l.vid}`);
    const games = parseMatchList(html);
    db.transaction(() => games.forEach((g) => { store(ev, g, firstRead); n++; }))();
  }
  st.lastRead.set(ev.slug, Date.now()); st.reads++;
  if (firstRead && n) live.logChange('KY:' + ev.slug, 'Kayakers.nl event found', `${ev.name}: ${n} games read`, { comp: ev.name, source: `Kayakers.nl event page (cpt.kayakers.nl/View/${ev.slug})` });
}
let busy = false;
async function tick() {
  if (busy || !enabled()) return;
  busy = true;
  try {
    if (Date.now() - st.lastList > LIST_MS && Date.now() >= st.pausedUntil) await refreshList();
    for (const ev of st.events.values()) {
      const every = ev.when === 'today' ? TODAY_MS : YESTERDAY_MS;
      if (Date.now() - (st.lastRead.get(ev.slug) || 0) < every || Date.now() < st.pausedUntil) continue;
      try { await readEvent(ev); } catch (e) { st.lastRead.set(ev.slug, Date.now()); }
    }
    db.prepare('DELETE FROM kayakers_games WHERE seen_at < ?').run(Date.now() - 30 * 864e5);
  } catch (e) { /* logged in get() */ } finally { busy = false; }
}
function start() { if (process.env.LIVE_SCORES === 'off') return; setTimeout(tick, 20000); setInterval(tick, 60 * 1000).unref(); }

// What the public page shows: events with games seen in the last 2 days, newest first
function view() {
  const rows = db.prepare('SELECT * FROM kayakers_games WHERE seen_at > ? ORDER BY day, time, pitch, division').all(Date.now() - 2 * 864e5);
  const events = new Map();
  rows.forEach((r) => { if (!events.has(r.slug)) events.set(r.slug, { slug: r.slug, name: r.event, days: new Map() }); const e = events.get(r.slug); if (!e.days.has(r.day || '')) e.days.set(r.day || '', []); e.days.get(r.day || '').push(r); });
  return [...events.values()].map((e) => ({ ...e, days: [...e.days.entries()] }));
}
function health() { return { on: enabled(), events: [...st.events.values()], fail: st.fail, pausedUntil: st.pausedUntil, lastOk: st.lastOk, lastError: st.lastError, reads: st.reads, games: db.prepare('SELECT COUNT(*) n FROM kayakers_games').get().n }; }

module.exports = { start, tick, view, health, enabled, setEnabled, parseMatchList, parseLinks, isoDate, decode };
