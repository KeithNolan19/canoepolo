// Text message (SMS) updates for the ECC: "<team> are next up ..." and "<team> win 7-1 ...".
// Sent through Twilio's web API. Everything stays OFF until the keys are in the server's .env file:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and either TWILIO_FROM (number or sender name) or TWILIO_MESSAGING_SERVICE_SID
// Optional: SMS_DRY_RUN=1 (write the texts to the log instead of sending), SMS_DAILY_CAP (default 400 texts a day).
const crypto = require('crypto');
const db = require('./db');
const live = require('./live');
const schedules = require('./schedules');

const SLUG = 'paddle-europe-canoe-polo-club-championships-2026';
const TZ_OFFSET = '+02:00';
const END = Date.parse('2026-10-06T00:00:00+02:00'); // sign-ups close and numbers are deleted after the tournament
const BASE = () => (process.env.BASE_URL || 'https://canoepolo.eu').replace(/\/$/, '');

db.exec(`
CREATE TABLE IF NOT EXISTS sms_phones (phone TEXT PRIMARY KEY, token TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, stopped INTEGER NOT NULL DEFAULT 0,
  code_hash TEXT, code_expires INTEGER, attempts INTEGER NOT NULL DEFAULT 0, codes_today INTEGER NOT NULL DEFAULT 0, codes_day TEXT, last_code INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sms_follows (phone TEXT NOT NULL, team TEXT NOT NULL, division TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (phone, team, division));
CREATE TABLE IF NOT EXISTS sms_sent (phone TEXT NOT NULL, key TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (phone, key));
CREATE TABLE IF NOT EXISTS sms_pending (phone TEXT PRIMARY KEY, teams TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sms_count (day TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
`);

const env = (k) => String(process.env[k] || '').trim();
const configured = () => !!(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && (env('TWILIO_FROM') || env('TWILIO_MESSAGING_SERVICE_SID')));
const dryRun = () => env('SMS_DRY_RUN') === '1';
const available = () => (configured() || dryRun()) && Date.now() < END;
const today = () => new Date().toISOString().slice(0, 10);
const cap = () => Math.max(1, Number(env('SMS_DAILY_CAP')) || 400);

// Numbers must be international (+353 ...) and from Europe. Keeps bots from running up the bill with far-away premium numbers.
function normalisePhone(raw) {
  let p = String(raw || '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!/^\+[0-9]{8,14}$/.test(p)) return null;
  if (!/^\+(3[0-9]|4[0-9])/.test(p)) return null; // +30..+49 covers Europe
  return p;
}
const mask = (p) => p.slice(0, 4) + '*'.repeat(Math.max(0, p.length - 7)) + p.slice(-3);

function spent() { const r = db.prepare('SELECT n FROM sms_count WHERE day = ?').get(today()); return r ? r.n : 0; }
function count() { db.prepare('INSERT INTO sms_count (day, n) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1').run(today()); }

const plain = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '');
async function send(to, body) {
  body = plain(body);
  if (spent() >= cap()) throw new Error('daily cap reached');
  if (dryRun()) { console.log(`[sms dry run] ${mask(to)}: ${body}`); count(); return 'dry'; }
  if (!configured()) throw new Error('not configured');
  const sid = env('TWILIO_ACCOUNT_SID');
  const form = new URLSearchParams({ To: to, Body: body });
  if (env('TWILIO_MESSAGING_SERVICE_SID')) form.set('MessagingServiceSid', env('TWILIO_MESSAGING_SERVICE_SID')); else form.set('From', env('TWILIO_FROM'));
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${env('TWILIO_AUTH_TOKEN')}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(10000),
  });
  count();
  if (!r.ok) {
    let j = {}; try { j = await r.json(); } catch (e) { /* ignore */ }
    if (j.code === 21610) { db.prepare('UPDATE sms_phones SET stopped = 1 WHERE phone = ?').run(to); } // the person replied STOP to Twilio
    const err = new Error('twilio ' + r.status + ' ' + (j.code || ''));
    err.twilio = j.code;
    throw err;
  }
  return 'sent';
}

const hash = (code) => crypto.createHash('sha256').update(String(code) + (process.env.SESSION_SECRET || '')).digest('hex');
const newToken = () => crypto.randomBytes(5).toString('hex');
const tail = (p) => `Stop: ${BASE().replace(/^https?:\/\//, '')}/s/${db.prepare('SELECT token FROM sms_phones WHERE phone = ?').get(p).token}`;

// Step 1: person gives a number and the teams. We text a 6 digit code.
async function start(rawPhone, teams) {
  if (!available()) return { error: 'Text updates are not open right now.' };
  const phone = normalisePhone(rawPhone);
  if (!phone) return { error: 'Please enter your mobile number with the country code, for example +353 85 123 4567. Numbers outside Europe are not supported.' };
  const valid = teams.filter((t) => t && t.team && t.division).slice(0, 6);
  if (!valid.length) return { error: 'Please pick at least one team.' };
  const now = Date.now();
  let row = db.prepare('SELECT * FROM sms_phones WHERE phone = ?').get(phone);
  if (!row) { db.prepare('INSERT INTO sms_phones (phone, token, created) VALUES (?, ?, ?)').run(phone, newToken(), now); row = db.prepare('SELECT * FROM sms_phones WHERE phone = ?').get(phone); }
  if (row.stopped) return { error: 'This number has asked us to stop texting it. Please contact us if that was a mistake.' };
  const stash = JSON.stringify(valid);
  db.prepare('INSERT INTO sms_pending (phone, teams) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET teams = excluded.teams').run(phone, stash);
  const day = today();
  const codesToday = row.codes_day === day ? row.codes_today : 0;
  if (now - row.last_code < 60 * 1000) return { error: 'A code was just sent. Please wait a minute before asking for another.', phone, step: 'code' };
  if (codesToday >= 4) return { error: 'Too many codes for this number today. Please try again tomorrow.' };
  const code = String(crypto.randomInt(100000, 1000000));
  db.prepare('UPDATE sms_phones SET code_hash = ?, code_expires = ?, attempts = 0, codes_today = ?, codes_day = ?, last_code = ? WHERE phone = ?').run(hash(code), now + 15 * 60 * 1000, codesToday + 1, day, now, phone);
  try { await send(phone, `canoepolo.eu code: ${code}. By entering it you agree to texts about your chosen teams at the ECC 2026.`); } catch (e) {
    console.error('sms code failed', e.message);
    return { error: 'We could not send the text. Please check the number and try again later.' };
  }
  return { step: 'code', phone };
}

function addFollows(phone, teams) {
  const ins = db.prepare('INSERT OR IGNORE INTO sms_follows (phone, team, division, created) VALUES (?, ?, ?, ?)');
  teams.forEach((t) => ins.run(phone, t.team, t.division, Date.now()));
}

// Step 2: they type the code
async function verify(rawPhone, code) {
  const phone = normalisePhone(rawPhone);
  const row = phone && db.prepare('SELECT * FROM sms_phones WHERE phone = ?').get(phone);
  if (!row || !row.code_hash) return { error: 'Please start again.' };
  if (row.attempts >= 5 || Date.now() > row.code_expires) return { error: 'That code has expired. Please start again.' };
  db.prepare('UPDATE sms_phones SET attempts = attempts + 1 WHERE phone = ?').run(phone);
  const ok = hash(String(code || '').trim()) === row.code_hash;
  if (!ok) return { error: 'That code is not right.', phone, step: 'code' };
  db.prepare('UPDATE sms_phones SET verified = 1, code_hash = NULL WHERE phone = ?').run(phone);
  const p = db.prepare('SELECT teams FROM sms_pending WHERE phone = ?').get(phone);
  if (p) { try { addFollows(phone, JSON.parse(p.teams)); } catch (e) { /* ignore */ } db.prepare('DELETE FROM sms_pending WHERE phone = ?').run(phone); }
  const follows = db.prepare('SELECT team, division FROM sms_follows WHERE phone = ?').all(phone);
  try { await send(phone, `You are signed up for ${follows.map((f) => f.team).join(', ')} at the ECC 2026. ${tail(phone)}`); } catch (e) { /* the sign up still stands */ }
  return { done: true, phone };
}

const byToken = (t) => db.prepare('SELECT * FROM sms_phones WHERE token = ?').get(String(t || '').replace(/[^a-f0-9]/g, '').slice(0, 20));
function stopByToken(t) {
  const r = byToken(t);
  if (!r) return false;
  db.prepare('UPDATE sms_phones SET stopped = 1 WHERE phone = ?').run(r.phone);
  db.prepare('DELETE FROM sms_follows WHERE phone = ?').run(r.phone);
  return true;
}

// ---- Sending the updates -------------------------------------------------------------------------------
// Uses the timetable as moved by the organisers' own pages, so a new time or pitch gives a corrected text.
function games() {
  const sch = schedules.forSlug(SLUG);
  if (!sch || sch.hidden) return [];
  const out = [];
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    if (m.group.length !== 1) return;
    out.push({ code: m.code, home: m.home, away: m.away, division: m.division, pitch: m.pitch, time: sl.start, startMs: Date.parse(`${d.date}T${sl.start}:00${TZ_OFFSET}`) });
  })));
  return out;
}

const sane = (v) => v && v.score && v.score.every((n) => Number.isInteger(n) && n >= 0 && n <= 40);

async function run() {
  if (!available()) return;
  const now = Date.now();
  const follows = db.prepare('SELECT f.phone, f.team, f.division, f.created FROM sms_follows f JOIN sms_phones p ON p.phone = f.phone WHERE p.verified = 1 AND p.stopped = 0').all();
  if (!follows.length) return;
  const byTeam = new Map();
  follows.forEach((f) => { const k = `${f.team}|${f.division}`; (byTeam.get(k) || byTeam.set(k, []).get(k)).push(f); });
  const sentBefore = db.prepare('SELECT 1 FROM sms_sent WHERE phone = ? AND key = ?');
  const markSent = db.prepare('INSERT OR IGNORE INTO sms_sent (phone, key, at) VALUES (?, ?, ?)');
  const nextCount = db.prepare("SELECT COUNT(*) AS n FROM sms_sent WHERE phone = ? AND key LIKE ?");
  for (const g of games()) {
    const state = live._state.get(g.code);
    const finished = state && state.status === 'FT';
    const started = state && state.status === 'LIVE';
    for (const side of [g.home, g.away]) {
      const subs = byTeam.get(`${side}|${g.division}`);
      if (!subs) continue;
      const other = side === g.home ? g.away : g.home;
      for (const f of subs) {
        let key = null, body = null;
        if (finished && sane(state)) {
          // only people who signed up before the game was over; never old results
          if (f.created > g.startMs + 45 * 60 * 1000) continue;
          const mine = side === g.home ? state.score[0] : state.score[1], theirs = side === g.home ? state.score[1] : state.score[0];
          key = `res:${g.code}`;
          body = mine > theirs ? `${side} win ${mine}-${theirs} v ${other}` : mine < theirs ? `${side} lose ${mine}-${theirs} v ${other}` : `${side} draw ${mine}-${theirs} v ${other}`;
        } else if (!finished && !started && now >= g.startMs - 15 * 60 * 1000 && now <= g.startMs + 40 * 60 * 1000 && f.created < g.startMs) {
          key = `next:${g.code}:${g.time}:${g.pitch}`;
          const prior = nextCount.get(f.phone, `next:${g.code}:%`).n;
          if (prior >= 3) continue;
          body = prior ? `UPDATE: ${side} v ${other} is now at ${g.time} on pitch ${g.pitch}` : `${side} are next up: v ${other} at ${g.time} on pitch ${g.pitch}`;
        }
        if (!key || sentBefore.get(f.phone, key)) continue;
        markSent.run(f.phone, key, now); // mark first: a failed text is not retried, so nobody gets duplicates
        try { await send(f.phone, `${body}. ${tail(f.phone)}`); } catch (e) { console.error('sms failed', e.message); if (/cap/.test(e.message)) return; }
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }
}

let timer = null, running = false;
function startTimer() {
  if (timer || process.env.LIVE_SCORES === 'off') return;
  timer = setInterval(() => { if (running) return; running = true; run().catch((e) => console.error('sms run', e.message)).finally(() => { running = false; }); }, 60 * 1000);
  timer.unref();
}

// After the tournament the numbers are deleted
function cleanup() {
  if (Date.now() < END + 24 * 3600 * 1000) return;
  db.exec('DELETE FROM sms_follows; DELETE FROM sms_sent; DELETE FROM sms_pending; DELETE FROM sms_phones;');
}

function summary() {
  const n = (q) => db.prepare(q).get().n;
  return {
    configured: configured(), dryRun: dryRun(), open: available(), cap: cap(), sentToday: spent(),
    numbers: n('SELECT COUNT(*) AS n FROM sms_phones WHERE verified = 1 AND stopped = 0'),
    stopped: n('SELECT COUNT(*) AS n FROM sms_phones WHERE stopped = 1'),
    follows: n('SELECT COUNT(*) AS n FROM sms_follows'),
    perTeam: db.prepare('SELECT team, division, COUNT(*) AS n FROM sms_follows GROUP BY team, division ORDER BY n DESC LIMIT 20').all(),
  };
}

module.exports = { available, start, verify, stopByToken, byToken, startTimer, cleanup, summary, send, normalisePhone, run };
