// Blog posts (/blog). Managed in the admin panel under "Blog".
// Post text is plain text with a tiny, safe format: blank line = new paragraph,
// "## " = heading, "- " = bullet list. Nothing else is interpreted, and all text is escaped.
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    summary      TEXT NOT NULL,
    body         TEXT NOT NULL,
    published    INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL,
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Starter posts, added once when the table is empty. Edit or delete them in the admin panel.
const STARTERS = [
  {
    slug: 'what-is-canoe-polo', title: 'What is canoe polo? A beginner\'s guide',
    summary: 'Canoe polo (also called kayak polo) is a fast team ball sport played in kayaks. Here is how it works and how to try it.',
    body: `Canoe polo, also called kayak polo, is a team ball sport played on water. Each team sits in kayaks and tries to throw a ball into the other team's goal, which hangs above the water.

## How the game works

- Two teams of five players play at a time, each paddling a small, agile kayak.
- Players pass and carry the ball, and shoot at a goal suspended above the water.
- The sport mixes paddling, ball skills and tactics, a little like water polo, handball and basketball combined.
- Referees control the game using whistles and hand signals.

## Why people love it

Canoe polo is fast, friendly and very social. It is played by clubs in many countries, from local leagues to the World Championships.

## How to try it

The best way to start is to find a local club. Most clubs lend you a boat, helmet and paddle for your first sessions. You do not need to be an expert paddler to begin.

See our list of upcoming tournaments to find events near you, watch videos on the Watch page to see the game in action, and visit Get involved to find ways to take part as a player, referee or volunteer.`,
  },
  {
    slug: 'how-to-find-a-canoe-polo-tournament', title: 'How to find a canoe polo tournament',
    summary: 'Looking for a canoe polo tournament to enter or watch? Here is where to look, and what to check before you travel.',
    body: `Canoe polo tournaments run all year round, from friendly club events to international championships. Here is how to find one.

## Where to look

- Start with the tournament calendar on canoepolo.eu. It lists upcoming events with dates, venues, divisions and links to the organisers.
- You can also subscribe to the calendar in your phone or computer calendar app.
- Ask your national federation and local clubs about events in your area.

## What to check before you enter

- The dates and the venue, including travel and accommodation.
- Which divisions are open (for example men, women, youth and masters).
- The registration deadline and the entry fee.
- The tournament rules and any equipment requirements. Always confirm these with the organiser.

## Running a tournament?

If you organise an event, you can create it on Kayakers.nl. The calendar there feeds canoepolo.eu, so your tournament can appear on this site too.`,
  },
];
if (db.prepare('SELECT COUNT(*) AS n FROM posts').get().n === 0) {
  const ins = db.prepare('INSERT INTO posts (slug, title, summary, body, published, published_at) VALUES (@slug, @title, @summary, @body, 1, @d)');
  db.transaction(() => STARTERS.forEach((p) => ins.run({ ...p, d: new Date().toISOString().slice(0, 10) })))();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// Turns the plain text body into safe HTML.
function render(body) {
  const blocks = String(body || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    if (b.startsWith('## ')) return `<h2>${esc(b.slice(3).trim())}</h2>`;
    const lines = b.split('\n');
    if (lines.every((l) => /^- /.test(l.trim()))) return `<ul>${lines.map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join('')}</ul>`;
    return `<p>${esc(lines.join(' '))}</p>`;
  }).join('\n');
}

const today = () => new Date().toISOString().slice(0, 10);
const readMins = (body) => Math.max(1, Math.round(String(body).split(/\s+/).length / 220));

function listPublic() {
  return db.prepare('SELECT * FROM posts WHERE published = 1 AND published_at <= ? ORDER BY published_at DESC, id DESC').all(today());
}
function bySlug(slug) {
  return db.prepare('SELECT * FROM posts WHERE slug = ? AND published = 1 AND published_at <= ?').get(slug, today());
}
function all() { return db.prepare('SELECT * FROM posts ORDER BY published_at DESC, id DESC').all(); }
function getById(id) { return db.prepare('SELECT * FROM posts WHERE id = ?').get(id); }

function validate(body, id) {
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const data = {
    title: str(body.title, 100),
    slug: slugify(body.slug) || slugify(body.title),
    summary: str(body.summary, 160),
    body: typeof body.body === 'string' ? body.body.replace(/\r\n?/g, '\n').trim().slice(0, 30000) : '',
    published: body.published ? 1 : 0,
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(body.published_at || '') ? body.published_at : today(),
  };
  const errors = [];
  if (!data.title) errors.push('Give the post a title.');
  if (!data.slug) errors.push('The web address (slug) needs letters or numbers.');
  if (!data.summary) errors.push('Add a short summary (shown in search results, up to 160 characters).');
  if (!data.body) errors.push('Write the post.');
  const clash = data.slug && db.prepare('SELECT id FROM posts WHERE slug = ?').get(data.slug);
  if (clash && clash.id !== id) errors.push('Another post already uses that web address. Change the slug.');
  return { data, errors };
}

function save(id, d) {
  if (id) {
    db.prepare(`UPDATE posts SET slug=@slug, title=@title, summary=@summary, body=@body, published=@published, published_at=@published_at, updated_at=datetime('now') WHERE id=@id`).run({ ...d, id });
    return getById(id);
  }
  const r = db.prepare('INSERT INTO posts (slug, title, summary, body, published, published_at) VALUES (@slug, @title, @summary, @body, @published, @published_at)').run(d);
  return getById(r.lastInsertRowid);
}
function remove(id) { db.prepare('DELETE FROM posts WHERE id = ?').run(id); }

module.exports = { render, readMins, listPublic, bySlug, all, getById, validate, save, remove, slugify };
