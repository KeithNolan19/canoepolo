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

// Reads one Game Report page. Returns { score, status } or null when there is nothing to show yet.
function parse(html) {
  const t = textOf(html);
  const done = /Ora termine/i.test(t);
  const ev = /Total\s+(\d+)\s+items/i.exec(t);
  const started = done || (ev && Number(ev[1]) > 0);
  // 2 - 8 when finished, 4* - 2* while the game is on (asterisks); spaces around the dash keep the date 02-10 out
  const m = /\b(\d{1,3})\*?\s+[-\u2013]\s+(\d{1,3})\*?/.exec(t);
  if (!started || !m) return { debug: t.slice(0, 400), result: null };
  return { debug: t.slice(0, 400), result: { score: [Number(m[1]), Number(m[2])], status: done ? 'FT' : 'LIVE' } };
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
  state.forEach((v, k) => { o[k] = { s: `${v.score[0]} - ${v.score[1]}`, st: v.status }; });
  return o;
}

module.exports = { start, snapshot, parse, fetchPage, textOf, _state: state };
