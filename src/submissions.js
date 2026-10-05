// Organiser submissions: anyone with the link can propose a tournament; nothing is public until the admin approves it.
const db = require('./db');
const T = require('./tournaments');

db.exec(`CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  data TEXT NOT NULL,                        -- JSON of the validated tournament fields
  submitter_name TEXT, submitter_email TEXT,
  email_public INTEGER NOT NULL DEFAULT 0,
  tournament_id INTEGER
)`);

const MAX_PENDING = 100;
const pendingCount = () => db.prepare("SELECT COUNT(*) n FROM submissions WHERE status = 'pending'").get().n;

// raw = form body. Returns { ok, errors, values }.
function submit(raw) {
  const s = (k, n) => (typeof raw[k] === 'string' ? raw[k].trim().slice(0, n) : '');
  const { data, errors } = T.validate({ ...raw, status: 'published', featured: '', lat: '', lng: '', source_url: '', documents_text: '', teams_text: '', contact_name: '', contact_email: '' });
  const name = s('submitter_name', 100), email = s('submitter_email', 150);
  if (!name) errors.push('Your name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required so we can reach you about this listing.');
  if (!raw.consent) errors.push('Please tick the box to confirm you are allowed to submit this and that it will be published.');
  if (data.end_date < new Date().toISOString().slice(0, 10)) errors.push('The tournament must be today or later.');
  if (pendingCount() >= MAX_PENDING) errors.push('We have a lot of submissions waiting. Please try again in a few days.');
  data.description = s('description', 3000) || null;
  data.entry_fee = s('entry_fee', 60) || null;
  if (errors.length) return { ok: false, errors, values: raw };
  db.prepare('INSERT INTO submissions (data, submitter_name, submitter_email, email_public) VALUES (?, ?, ?, ?)')
    .run(JSON.stringify(data), name, email, raw.email_public ? 1 : 0);
  return { ok: true, errors: [] };
}

const parse = (r) => ({ ...r, d: JSON.parse(r.data) });
const list = (status) => db.prepare('SELECT * FROM submissions WHERE status = ? ORDER BY id DESC LIMIT 200').all(status).map(parse);
const get = (id) => { const r = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id); return r ? parse(r) : null; };

function approve(id) {
  const r = get(id);
  if (!r || r.status !== 'pending') return null;
  const d = { ...r.d, status: 'published', featured: 0, documents: null, teams: null, source_url: r.d.website_url || null };
  if (r.email_public) { d.contact_name = r.submitter_name; d.contact_email = r.submitter_email; } else { d.contact_name = null; d.contact_email = null; }
  const t = T.create(d);
  db.prepare("UPDATE submissions SET status = 'approved', decided_at = datetime('now'), tournament_id = ? WHERE id = ?").run(t.id, id);
  return t;
}
function reject(id) {
  return db.prepare("UPDATE submissions SET status = 'rejected', decided_at = datetime('now') WHERE id = ? AND status = 'pending'").run(id).changes > 0;
}
// Decided submissions keep the submitter's contact details for 30 days (to reply), then they are removed
function purge() {
  db.prepare("UPDATE submissions SET submitter_email = NULL, submitter_name = NULL WHERE status != 'pending' AND decided_at < datetime('now', '-30 days')").run();
}
purge();
setInterval(purge, 24 * 60 * 60 * 1000).unref();

module.exports = { submit, list, get, approve, reject, pendingCount };
