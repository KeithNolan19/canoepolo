// Live scores for the ECC 2026 matches, read from the organisers' official match pages (with their permission).
// Polite by design: nothing is fetched before a match is due, finished matches are never fetched again,
// and visitors only ever read our in-memory copy, so traffic to their site does not grow with our visitors.
const schedules = require('./schedules');

const SLUG = 'paddle-europe-canoe-polo-club-championships-2026';
const UA = 'canoepolo.eu live scores (volunteer site, used with the ECC organisers permission)';
const TZ_OFFSET = '+02:00'; // Milan in October (CEST)
const POLL_MS = 45 * 1000;
const state = new Map(); // code -> { score:[a,b], status:'LIVE'|'FT', at:ms }
const finished = new Set();
const meta = new Map(); // code -> what the official page says about the game itself (time, field, officials), even before it starts
let timer = null;

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

// Goals and cards from the Events table. Columns: N, period, clock (counts down), team 1 player, team 1 event, team 2 event, team 2 player.
function parseEvents(html) {
  const goals = [], cards = [];
  const cellText = (c) => textOf(c);
  (html.match(/<tr[\s\S]*?<\/tr>/gi) || []).forEach((row) => {
    const c = (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(cellText);
    if (c.length < 7 || !/^\d+$/.test(c[0]) || !/^\d$/.test(c[1]) || !/^\d{1,2}:\d{2}$/.test(c[2])) return;
    const [mm, ss] = c[2].split(':').map(Number);
    const elapsed = (Number(c[1]) - 1) * 600 + (600 - (mm * 60 + ss));
    const minute = Math.max(1, Math.floor(elapsed / 60) + 1);
    [[1, c[3], c[4]], [2, c[6], c[5]]].forEach(([team, player, ev]) => {
      if (/^goal$/i.test(ev)) goals.push({ team, player, minute });
      else if (/verde/i.test(ev)) cards.push({ team, player, minute, card: 'green' });
      else if (/gialla|giallo/i.test(ev)) cards.push({ team, player, minute, card: 'yellow' });
      else if (/ross[ao]/i.test(ev)) cards.push({ team, player, minute, card: 'red' });
    });
  });
  return { goals, cards };
}

// Everything on the Game Report that we show in the game pop-up: full event list, line-ups, officials, field and round.
function parseDetail(html) {
  const t = textOf(html);
  const events = [], lineups = [];
  (html.match(/<table[\s\S]*?<\/table>/gi) || []).forEach((tb) => {
    const rows = (tb.match(/<tr[\s\S]*?<\/tr>/gi) || []).map((r) => (r.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(textOf));
    if (rows.some((c) => c.length >= 7 && /^\d+$/.test(c[0]) && /^\d$/.test(c[1]) && /^\d{1,2}:\d{2}$/.test(c[2]))) {
      rows.forEach((c) => {
        if (c.length < 7 || !/^\d+$/.test(c[0]) || !/^\d$/.test(c[1]) || !/^\d{1,2}:\d{2}$/.test(c[2])) return;
        const [mm, ss] = c[2].split(':').map(Number);
        const elapsed = (Number(c[1]) - 1) * 600 + (600 - (mm * 60 + ss));
        events.push({ period: Number(c[1]), clock: c[2], minute: Math.max(0, Math.floor(elapsed / 60) + 1), p1: c[3], e1: c[4], e2: c[5], p2: c[6] });
      });
    } else if (rows[0] && /name/i.test(rows[0][1] || '')) {
      lineups.push(rows.slice(1).filter((c) => /^\d+$/.test(c[0])).map((c) => ({ n: c[0], name: c[1] })));
    }
  });
  const pick = (re) => { const m = re.exec(t); return m ? m[1].trim() : ''; };
  const officials = {
    referee1: pick(/Primo Arbitro\s+(.+?)\s+Secondo Arbitro/i), referee2: pick(/Secondo Arbitro\s+(.+?)\s+Segnapunti/i),
    scorer: pick(/Segnapunti\s+(.+?)\s+Cronometrista/i), timekeeper: pick(/Cronometrista\s+(.+?)\s+Guardialinee/i),
  };
  return { events, lineups, officials, field: pick(/FIELD\s+(\S+)/i), round: pick(/ROUND\s+(\S+)/i) };
}

// Reads one Game Report page. Returns { score, status } or null when there is nothing to show yet.
function parse(html) {
  const t = textOf(html);
  const done = /Ora termine/i.test(t);
  const ev = /Total\s+(\d+)\s+items/i.exec(t);
  const started = done || (ev && Number(ev[1]) > 0);
  // 2 - 8 when finished, 4* - 2* while the game is on (asterisks); spaces around the dash keep the date 02-10 out
  const m = /\b(\d{1,3})\*?\s+[-\u2013]\s+(\d{1,3})\*?/.exec(t);
  if (!started || !m) return { debug: t.slice(0, 400), result: null };
  const score = [Number(m[1]), Number(m[2])];
  const evs = parseEvents(html);
  // Only trust the scorers when they add up to the score on the page
  // Each side is checked on its own: if the goals listed for a side do not add up to its score (for example a goal that was cancelled but is still in the list), that side is marked unconfirmed (u:1), and the other side is still trusted
  const sideOk = { 1: evs.goals.filter((g) => g.team === 1).length === score[0], 2: evs.goals.filter((g) => g.team === 2).length === score[1] };
  const goals = evs.goals.map((g) => (sideOk[g.team] ? g : { ...g, u: 1 }));
  const ts = /TIME\s+(\d{1,2}:\d{2})\s+\((\d{1,2}:\d{2})\)/i.exec(t); // scheduled time and the time the game really started
  return { debug: t.slice(0, 400), events: evs, result: { detail: parseDetail(html), ks: ts ? ts[2].padStart(5, '0') : undefined, score, status: done ? 'FT' : 'LIVE', goals: goals.length ? goals : null, cards: evs.cards.length ? evs.cards : null } };
}

async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

function matchList() {
  const s = schedules.forSlug(SLUG, { raw: true });
  if (!s || s.hidden) return [];
  const out = [];
  s.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    if (!m.live) return;
    out.push({ code: m.code, url: m.live, time: sl.start, pitch: m.pitch, day: d.date, start: Date.parse(`${d.date}T${sl.start}:00${TZ_OFFSET}`) });
  })));
  return out;
}

// A match is worth asking about from 10 minutes before the scheduled start until it has finished (or 4 hours after it, because games run late)
function due(m, now) {
  return !finished.has(m.code) && now >= m.start - 10 * 60 * 1000 && now <= m.start + 4 * 60 * 60 * 1000;
}

// Reads a page and remembers both the live score (if any) and the game details
function ingest(m, html) {
  const p = parse(html);
  const t = textOf(html);
  const tm = /TIME\s+(\d{1,2}:\d{2})/i.exec(t), fm = /FIELD\s+(\S+)/i.exec(t);
  meta.set(m.code, { time: tm ? tm[1].padStart(5, '0') : '', field: fm ? fm[1] : '', detail: parseDetail(html), at: Date.now() });
  schedules.setOverrides(changes());
  if (p.result) {
    state.set(m.code, { ...p.result, at: Date.now() });
    if (p.result.status === 'FT') finished.add(m.code);
  }
}

async function tick() {
  const now = Date.now();
  const todo = matchList().filter((m) => due(m, now));
  for (const m of todo) {
    try { ingest(m, await fetchPage(m.url)); } catch (e) { /* keep the last known score; try again next time */ }
    await new Promise((r) => setTimeout(r, 400));
  }
}

// Every 10 minutes during the tournament: look at games not played yet, so a change of time, pitch or referee shows up
let sweeping = false;
async function sweep() {
  const now = Date.now();
  if (sweeping || now < Date.parse('2026-10-02T05:00:00+02:00') || now > Date.parse('2026-10-05T00:00:00+02:00')) return;
  sweeping = true;
  try {
    for (const m of matchList()) {
      if (finished.has(m.code)) continue;
      try { ingest(m, await fetchPage(m.url)); } catch (e) { /* try again next time */ }
      await new Promise((r) => setTimeout(r, 700));
    }
  } finally { sweeping = false; }
}

// Group tables from finished games: 3 points for a win, 1 for a draw. Order: points, goal difference, goals scored (provisional: the organiser's ranking is the official one).
function standings() {
  const sch = schedules.forSlug(SLUG, { raw: true });
  if (!sch || sch.hidden || !sch.groupsTable) return {};
  const out = {};
  Object.entries(sch.groupsTable).forEach(([division, groups]) => {
    out[division] = {};
    Object.entries(groups).forEach(([g, names]) => {
      const rows = new Map(names.map((n) => [n, { name: n, cc: (sch.countries || {})[n] || '', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }]));
      sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
        if (m.group !== g || m.division !== division) return;
        const v = state.get(m.code);
        if (!v || v.status !== 'FT') return;
        const h = rows.get(m.home), a = rows.get(m.away);
        if (!h || !a) return;
        const [x, y] = v.score;
        h.p++; a.p++; h.gf += x; h.ga += y; a.gf += y; a.ga += x;
        if (x > y) { h.w++; a.l++; } else if (x < y) { a.w++; h.l++; } else { h.d++; a.d++; }
      })));
      const list = [...rows.values()].map((r) => ({ ...r, gd: r.gf - r.ga, pts: r.w * 3 + r.d }));
      list.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
      list.forEach((r, i) => { r.pos = i + 1; });
      out[division][g] = list;
    });
  });
  return out;
}

// Games where the official page disagrees with our timetable
function changes() {
  const out = {};
  matchList().forEach((m) => {
    const v = meta.get(m.code);
    if (!v) return;
    const c = {};
    if (v.time && v.time !== m.time.padStart(5, '0')) c.time = v.time;
    if (v.field && Number(v.field) && Number(v.field) !== m.pitch) c.pitch = Number(v.field);
    if (Object.keys(c).length) out[m.code] = { ...c, was: { time: m.time, pitch: m.pitch } };
  });
  return out;
}

function start() {
  if (timer || process.env.LIVE_SCORES === 'off') return;
  timer = setInterval(() => { tick().catch(() => {}); }, POLL_MS);
  timer.unref();
  const sw = setInterval(() => { sweep().catch(() => {}); }, 10 * 60 * 1000);
  sw.unref();
  setTimeout(() => { sweep().catch(() => {}); }, 20000).unref();
  tick().catch(() => {});
}

function snapshot() {
  const o = {};
  state.forEach((v, k) => { o[k] = { s: `${v.score[0]} - ${v.score[1]}`, st: v.status, ks: v.ks, g: v.goals || undefined, c: v.cards || undefined }; });
  return o;
}

function detail(code) {
  const v = state.get(code), m = meta.get(code);
  if (v) return { s: `${v.score[0]} - ${v.score[1]}`, st: v.status, ks: v.ks, ...(m ? m.detail : v.detail || {}), time: m && m.time, field: m && m.field };
  return m ? { ...m.detail, time: m.time, field: m.field } : null;
}

module.exports = { start, snapshot, detail, changes, standings, meta, parse, parseEvents, parseDetail, fetchPage, textOf, _state: state };
