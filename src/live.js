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
  const ok = evs.goals.filter((g) => g.team === 1).length === score[0] && evs.goals.filter((g) => g.team === 2).length === score[1];
  return { debug: t.slice(0, 400), events: evs, result: { score, status: done ? 'FT' : 'LIVE', goals: ok ? evs.goals : null, cards: ok ? evs.cards : null } };
}

async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

function matchList() {
  const s = schedules.forSlug(SLUG);
  if (!s || s.hidden) return [];
  const out = [];
  s.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    if (!m.live) return;
    out.push({ code: m.code, url: m.live, start: Date.parse(`${d.date}T${sl.start}:00${TZ_OFFSET}`) });
  })));
  return out;
}

// A match is worth asking about from 5 minutes before the start until it has finished (or 2.5 hours after the start)
function due(m, now) {
  return !finished.has(m.code) && now >= m.start - 5 * 60 * 1000 && now <= m.start + 150 * 60 * 1000;
}

async function tick() {
  const now = Date.now();
  const todo = matchList().filter((m) => due(m, now));
  for (const m of todo) {
    try {
      const { result } = parse(await fetchPage(m.url));
      if (result) {
        state.set(m.code, { ...result, at: Date.now() });
        if (result.status === 'FT') finished.add(m.code);
      }
    } catch (e) { /* keep the last known score; try again next time */ }
    await new Promise((r) => setTimeout(r, 400));
  }
}

function start() {
  if (timer || process.env.LIVE_SCORES === 'off') return;
  timer = setInterval(() => { tick().catch(() => {}); }, POLL_MS);
  timer.unref();
  tick().catch(() => {});
}

function snapshot() {
  const o = {};
  state.forEach((v, k) => { o[k] = { s: `${v.score[0]} - ${v.score[1]}`, st: v.status, g: v.goals || undefined, c: v.cards || undefined }; });
  return o;
}

module.exports = { start, snapshot, parse, parseEvents, fetchPage, textOf, _state: state };
