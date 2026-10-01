// Referee quiz leaderboard. Entries are only saved when the player ticks the consent box.
// Stored: display name, club, country, score and date. No email, no IP address.
const crypto = require('crypto');
const db = require('./db');
const { COUNTRIES } = require('./constants');

db.exec(`CREATE TABLE IF NOT EXISTS quiz_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, club TEXT, country TEXT NOT NULL,
  score INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-do-not-use-in-production';
const MIN_SECONDS = 20;       // ten questions can't honestly be answered faster
const MAX_SECONDS = 2 * 3600;
const used = new Set();

const sign = (s) => crypto.createHmac('sha256', SECRET).update('quiz|' + s).digest('hex').slice(0, 24);
function newToken() {
  const s = Date.now() + '.' + crypto.randomBytes(8).toString('hex');
  return s + '.' + sign(s);
}
function checkToken(t) {
  const parts = String(t || '').split('.');
  if (parts.length !== 3) return false;
  const s = parts[0] + '.' + parts[1];
  const ok = parts[2].length === 24 && crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(sign(s)));
  const age = (Date.now() - Number(parts[0])) / 1000;
  if (!ok || !(age >= MIN_SECONDS && age <= MAX_SECONDS) || used.has(t)) return false;
  used.add(t);
  if (used.size > 5000) used.clear();
  return true;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
const looksLikeLink = (s) => /https?:|www\.|@|\.(com|net|org|eu|uk|ie|de|nl)\b/i.test(s);

function submit(body) {
  if (!body || body.consent !== true) return { error: 'Please tick the box to be shown on the leaderboard.' };
  const name = clean(body.name, 40), club = clean(body.club, 50), country = clean(body.country, 2).toUpperCase();
  const score = Number(body.score);
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!COUNTRIES[country]) return { error: 'Please choose your country.' };
  if (looksLikeLink(name) || looksLikeLink(club)) return { error: 'Please use a plain name and club, without links or email addresses.' };
  if (!Number.isInteger(score) || score < 0 || score > 10) return { error: 'Invalid score.' };
  if (!checkToken(body.token)) return { error: 'This score could not be saved (the quiz was too quick, or already submitted).' };
  db.prepare('INSERT INTO quiz_scores (name, club, country, score) VALUES (?, ?, ?, ?)').run(name, club || null, country, score);
  const better = db.prepare(`SELECT COUNT(*) c FROM (SELECT MAX(score) s FROM quiz_scores GROUP BY lower(name), lower(coalesce(club,'')), country) WHERE s > ?`).get(score).c;
  return { ok: true, rank: better + 1 };
}

// One row per player (same name + club + country): their best score, earliest first.
function top(limit = 50) {
  return db.prepare(`SELECT name, club, country, MAX(score) score, MIN(created_at) first_at, COUNT(*) plays
    FROM quiz_scores GROUP BY lower(name), lower(coalesce(club,'')), country
    ORDER BY score DESC, first_at ASC LIMIT ?`).all(limit);
}
const recent = (limit = 200) => db.prepare('SELECT * FROM quiz_scores ORDER BY id DESC LIMIT ?').all(limit);
const remove = (id) => db.prepare('DELETE FROM quiz_scores WHERE id = ?').run(id);

module.exports = { newToken, submit, top, recent, remove };
