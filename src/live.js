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
const ftAt = new Map(); // code -> when we first saw full time, and how many re-reads since (to pick up the organiser's corrections or a page that was incomplete)
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

// The two team names in the header of an official match page. The real header repeats the line:
// "... Guardialinee2 C.o. K. Branik 2 - 8 Corbeil K. Branik 2 - 8 Corbeil Game (...)". The organiser's spelling can differ from ours.
function parseTeams(html) {
  const t = textOf(html);
  const m = /Guardialinee\s*2\s+\S+\s+(.+?)\s+\d*\*?\s*[-\u2013]\s*\d*\*?\s+(.+?)\s+\1\s+\d*\*?\s*[-\u2013]/i.exec(t);
  if (!m) return null;
  const h = m[1].trim(), a = m[2].trim();
  return h && a && h !== a ? [h, a] : null;
}
const tokens = (n) => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
// Our clubs the organiser's spelling could mean. The organiser shortens names ("MKC Duisb." for Duisburg, "Zürich W"), so a word of 4 or more
// letters in one name starting the same as a word in the other counts. This is only used on clubs from the right group, and only when exactly one fits.
function sameClub(org, ours) {
  const o = tokens(org).filter((x) => x.length >= 4), u = tokens(ours).filter((x) => x.length >= 4);
  return o.some((x) => u.some((y) => y.startsWith(x) || x.startsWith(y)));
}
// The placeholder wording our timetable has for a game, and whether a club is a sensible fit for it
function originalOf(sch, code) {
  let r = null;
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => { if (m.code === code) r = [m.homeOrig || m.home, m.awayOrig || m.away]; })));
  return r;
}
function teamsOf(sch, code) {
  if (teamsFor[code] && teamsFor[code][0] && teamsFor[code][1]) return teamsFor[code];
  const o = originalOf(sch, code);
  return o && !/\b(Group|Winner|Loser)\b|\d(st|nd|rd|th) in /.test(o.join(' ')) ? o : null; // a group game has real names
}
function fits(sch, division, placeholder, team) {
  let g = /\d(?:st|nd|rd|th) in Group ([A-Z])/.exec(placeholder);
  if (g) { const list = ((sch.groupsTable || {})[division] || {})[g[1]]; return !!list && list.includes(team); }
  g = /(Winner|Loser) of (\w+)/.exec(placeholder);
  if (g) {
    const pair = teamsOf(sch, g[2]);
    if (!pair || !pair.includes(team)) return false;
    const v = state.get(g[2]);
    if (v && v.status === 'FT' && v.score[0] !== v.score[1]) {
      const winner = v.score[0] > v.score[1] ? pair[0] : pair[1];
      return g[1] === 'Winner' ? team === winner : team !== winner;
    }
    return true;
  }
  return false; // not a placeholder we understand: leave it alone
}
const teamsFor = {};

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
    out.push({ code: m.code, url: m.live, ph: !!m.ph, time: sl.start, pitch: m.pitch, day: d.date, start: Date.parse(`${d.date}T${sl.start}:00${TZ_OFFSET}`) });
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
  meta.set(m.code, { time: tm ? tm[1].padStart(5, '0') : '', field: fm ? fm[1] : '', detail: parseDetail(html), org: parseTeams(html), at: Date.now() });
  schedules.setOverrides(changes());
  if (m.ph) {
    // Teams are only filled in when the organiser's page names two clubs AND each club fits the placeholder in our timetable
    // (a club from the right group, or the real winner or loser of the earlier game). Otherwise the placeholder stays.
    const sch = schedules.forSlug(SLUG, { raw: true });
    const division = m.code[0] === 'F' ? 'Women' : 'Men';
    const names = (sch.teams || []).filter((x) => x.division === division).map((x) => x.name);
    const org = parseTeams(html);
    const orig = originalOf(sch, m.code);
    if (org && orig) {
      // each side must match exactly one of our clubs that also fits the placeholder (right group, or the real winner or loser)
      const pick = (o, ph) => { const c = names.filter((n) => sameClub(o, n) && fits(sch, division, ph, n)); return c.length === 1 ? c[0] : null; };
      const tt = [pick(org[0], orig[0]), pick(org[1], orig[1])];
      if (tt[0] && tt[1] && tt[0] === tt[1]) tt[0] = tt[1] = null;
      if (tt[0] || tt[1]) { teamsFor[m.code] = tt; schedules.setTeamOverrides(teamsFor); } // either side can be known before the other
    }
  }
  if (p.result) {
    state.set(m.code, { ...p.result, at: Date.now() });
    if (p.result.status === 'FT') { finished.add(m.code); if (!ftAt.has(m.code)) ftAt.set(m.code, { t: Date.now(), n: 0 }); }
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
      // Finished games are read again twice (30 minutes and 3 hours after we first saw full time): the organisers sometimes correct a report, or the page was incomplete
      const rec = ftAt.get(m.code);
      if (rec && rec.n < 2 && now - rec.t > (rec.n === 0 ? 30 : 180) * 60 * 1000) {
        rec.n++;
        try { ingest(m, await fetchPage(m.url)); } catch (e) { /* try again next time */ }
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      if (finished.has(m.code) || (m.start > now + 3 * 60 * 60 * 1000 && !(m.ph && m.start < now + 9 * 60 * 60 * 1000))) continue; // only games that are due within 3 hours or already past: kind to the organiser's site
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

// Top scorers and most cards per division, from finished and live games. Goals from a side whose list does not match its score (u:1) are left out.
function playerStats() {
  const sch = schedules.forSlug(SLUG, { raw: true });
  const out = {};
  if (!sch || sch.hidden) return out;
  const bucket = (div) => (out[div] = out[div] || { scorers: new Map(), cards: new Map() });
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    const v = state.get(m.code);
    if (!v || !m.division) return;
    const b = bucket(m.division);
    const add = (map, item, team, key) => {
      const name = String(item.player || '').trim();
      if (!name) return null;
      const club = team === 1 ? m.home : m.away;
      const k = name.toLowerCase() + '|' + club;
      if (!map.has(k)) map.set(k, { player: name, team: club, cc: (sch.countries || {})[club] || '', goals: 0, green: 0, yellow: 0, red: 0, games: new Set() });
      const r = map.get(k); r.games.add(m.code); if (key) r[key]++;
      return r;
    };
    (v.goals || []).forEach((g) => { if (!g.u) add(b.scorers, g, g.team, 'goals'); });
    (v.cards || []).forEach((c) => add(b.cards, c, c.team, c.card));
  })));
  const top = (map, score, n) => {
    const rows = [...map.values()].map((r) => ({ ...r, games: r.games.size, total: r.green + r.yellow + r.red }));
    rows.sort((a, b) => score(b) - score(a) || a.player.localeCompare(b.player));
    if (!rows.length) return [];
    const cut = rows.length > n ? score(rows[n - 1]) : -1;
    return rows.filter((r, i) => i < n || score(r) === cut).filter((r) => score(r) > 0).slice(0, n + 5);
  };
  const res = {};
  Object.entries(out).forEach(([div, b]) => {
    res[div] = {
      scorers: top(b.scorers, (r) => r.goals, 5),
      cards: top(b.cards, (r) => r.total * 1000 + r.red * 100 + r.yellow, 5),
    };
  });
  return res;
}

// Admin: read every game that has an organiser link once, gently (about 0.7 s apart), so the whole timetable can be compared in one go
let verifying = null;
function readAll() {
  if (verifying && !verifying.done) return verifying;
  const list = matchList().filter((m) => !meta.has(m.code) || Date.now() - meta.get(m.code).at > 5 * 60 * 1000);
  verifying = { total: list.length, n: 0, failed: 0, done: false, startedAt: Date.now() };
  (async () => {
    for (const m of list) {
      try { ingest(m, await fetchPage(m.url)); } catch (e) { verifying.failed++; }
      verifying.n++;
      await new Promise((r) => setTimeout(r, 700));
    }
    verifying.done = true;
  })();
  return verifying;
}
const readAllStatus = () => verifying;

// Compares everything the server has read from the organiser's pages with our timetable: time, pitch, home and away team, and whether a score is shown
function verify() {
  const sch = schedules.forSlug(SLUG, { raw: true });
  const lines = [], stats = { listed: 0, read: 0, ok: 0, bad: 0, notRead: 0 };
  if (!sch || sch.hidden) return { lines: ['No ECC timetable loaded.'], stats };
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    if (!m.live) return;
    stats.listed++;
    const v = meta.get(m.code);
    if (!v) { stats.notRead++; return; }
    stats.read++;
    const bad = [];
    if (v.time && v.time !== sl.start.padStart(5, '0')) bad.push(`time: organiser ${v.time}, ours ${sl.start}`);
    if (v.field && Number(v.field) && Number(v.field) !== m.pitch) bad.push(`pitch: organiser ${v.field}, ours ${m.pitch}`);
    const ph = /\b(Group|Winner|Loser)\b|\d(st|nd|rd|th) in /;
    if (v.org && !ph.test(m.home) && !ph.test(m.away)) {
      if (!sameClub(v.org[0], m.home)) bad.push(`home team: organiser "${v.org[0]}", ours "${m.home}"`);
      if (!sameClub(v.org[1], m.away)) bad.push(`away team: organiser "${v.org[1]}", ours "${m.away}"`);
    } else if (!v.org) bad.push('could not read the team names from the organiser page');
    if (bad.length) { stats.bad++; lines.push(`${m.code} (organiser N° ${m.liveId}, ${d.date} ${sl.start} pitch ${m.pitch}): ${bad.join('; ')}`); } else stats.ok++;
  })));
  // Play-off games: what the organiser's page names for each side, and what we show
  const po = [], unmatched = [], seen = new Map();
  const orgPh = /\bRound\b|\b(Winner|Loser)\b|^\W*-?\W*$/i;
  const ours = (div) => (sch.teams || []).filter((x) => x.division === div).map((x) => x.name);
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    if (!m.live) return;
    const v = meta.get(m.code);
    const div = m.division;
    if (v && v.org) v.org.forEach((o) => {
      if (orgPh.test(o)) return;
      if (!seen.has(o + '|' + div)) seen.set(o + '|' + div, { o, div, c: ours(div).filter((n) => sameClub(o, n)) });
    });
    if (m.group.length === 1) return;
    const side = (i) => (i ? m.away : m.home);
    const orig = (i) => (i ? m.awayOrig : m.homeOrig);
    const org = v && v.org;
    const bits = [0, 1].map((i) => {
      const o = org ? org[i] : null;
      if (!org) return `side ${i ? 'B' : 'A'}: page not read yet`;
      if (orgPh.test(o)) return `${o} (organiser has not named the club yet)${side(i) !== orig(i) ? ' BUT we show ' + side(i) : ''}`;
      if (side(i) !== orig(i)) return `${o} = ${side(i)}`;
      unmatched.push(`${m.code} (N° ${m.liveId}): organiser names "${o}" for "${orig(i)}" but we could not match it to a club that fits`);
      return `${o} = NOT MATCHED`;
    });
    po.push(`${m.code} (N° ${m.liveId}, ${d.date.slice(8)}/10 ${sl.start}, pitch ${m.pitch}, ${m.group}): ${bits.join(' | ')}`);
  })));
  const names = [...seen.values()].sort((a, b) => a.o.localeCompare(b.o));
  const map = names.map((x) => `"${x.o}" (${x.div}) -> ${x.c.length === 1 ? x.c[0] : x.c.length ? 'AMBIGUOUS: ' + x.c.join(' / ') : 'NO MATCH IN OUR LIST'}`);
  return { lines, stats, po, unmatched, map };
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

module.exports = { readAll, readAllStatus, verify, parseTeams, ingest, start, snapshot, detail, changes, standings, playerStats, meta, parse, parseEvents, parseDetail, fetchPage, textOf, _state: state };
