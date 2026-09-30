// Videos for the Watch page (/watch). Managed in the admin panel under "Videos".
// Videos are YouTube videos (mostly from Planet Canoe, the ICF's channel). Only the video ID is stored.
const db = require('./db');

const CATEGORIES = {
  highlights: 'Highlights',
  games: 'Full games and finals',
  learn: 'Learn the game',
};

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_id   TEXT NOT NULL,
    title        TEXT NOT NULL,
    event        TEXT,
    category     TEXT NOT NULL DEFAULT 'highlights',
    video_date   TEXT,                       -- YYYY-MM-DD, used for sorting
    featured     INTEGER NOT NULL DEFAULT 0, -- shown large at the top of /watch
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Starter videos, added once when the table is empty. All from the Planet Canoe / ICF YouTube channels.
const STARTERS = [
  { youtube_id: 'W3UzcJLjoxE', title: 'Day 1 highlights', event: '2026 Canoe Polo World Championships, Duisburg', category: 'highlights', video_date: '2026-09-15', featured: 1 },
  { youtube_id: 'YX8_yWbLpEQ', title: 'Day 2 highlights', event: '2026 Canoe Polo World Championships, Duisburg', category: 'highlights', video_date: '2026-09-16', featured: 0 },
  { youtube_id: '74pm8nqf_qI', title: 'Day 5, Pitch 1 (full stream)', event: '2026 Canoe Polo World Championships, Duisburg', category: 'games', video_date: '2026-09-19', featured: 0 },
  { youtube_id: 'udGYtwKndFA', title: 'Men\'s final: Germany v France', event: '2024 ICF Canoe Polo World Championships, Deqing', category: 'games', video_date: '2024-10-20', featured: 0 },
  { youtube_id: 'lGsUoXpiof4', title: 'Women\'s final: New Zealand v Italy', event: '2024 ICF Canoe Polo World Championships, Deqing', category: 'games', video_date: '2024-10-20', featured: 0 },
  { youtube_id: 'GPRiNzGr50Y', title: 'How to: Canoe Polo', event: 'ICF educational series', category: 'learn', video_date: '2026-01-15', featured: 0 },
];
if (db.prepare('SELECT COUNT(*) AS n FROM videos').get().n === 0) {
  const ins = db.prepare('INSERT INTO videos (youtube_id, title, event, category, video_date, featured) VALUES (@youtube_id, @title, @event, @category, @video_date, @featured)');
  db.transaction(() => STARTERS.forEach((v) => ins.run(v)))();
}

// Accepts a full YouTube link (watch, youtu.be, shorts, live, embed) or a bare 11-character ID.
function parseYouTubeId(input) {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function all() {
  return db.prepare('SELECT * FROM videos ORDER BY featured DESC, video_date DESC, id DESC').all();
}
function byCategory() {
  const rows = all();
  const featured = rows.find((v) => v.featured) || rows[0] || null;
  const groups = Object.entries(CATEGORIES).map(([key, label]) => ({
    key, label, videos: rows.filter((v) => v.category === key && v !== featured),
  }));
  return { featured, groups };
}
function getById(id) { return db.prepare('SELECT * FROM videos WHERE id = ?').get(id); }

function validate(body) {
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const data = {
    youtube_url: str(body.youtube_url, 300),
    youtube_id: parseYouTubeId(body.youtube_url),
    title: str(body.title, 140),
    event: str(body.event, 140),
    category: CATEGORIES[body.category] ? body.category : 'highlights',
    video_date: /^\d{4}-\d{2}-\d{2}$/.test(body.video_date || '') ? body.video_date : new Date().toISOString().slice(0, 10),
    featured: body.featured ? 1 : 0,
  };
  const errors = [];
  if (!data.youtube_id) errors.push('Paste a YouTube link (for example https://www.youtube.com/watch?v=…).');
  if (!data.title) errors.push('Give the video a title.');
  return { data, errors };
}

function save(id, data) {
  const run = db.transaction(() => {
    if (data.featured) db.prepare('UPDATE videos SET featured = 0').run();
    const fields = { youtube_id: data.youtube_id, title: data.title, event: data.event, category: data.category, video_date: data.video_date, featured: data.featured };
    if (id) db.prepare('UPDATE videos SET youtube_id=@youtube_id, title=@title, event=@event, category=@category, video_date=@video_date, featured=@featured WHERE id=@id').run({ ...fields, id });
    else id = db.prepare('INSERT INTO videos (youtube_id, title, event, category, video_date, featured) VALUES (@youtube_id, @title, @event, @category, @video_date, @featured)').run(fields).lastInsertRowid;
  });
  run();
  return getById(id);
}
function remove(id) { db.prepare('DELETE FROM videos WHERE id = ?').run(id); }

// Places to watch more. Edit freely.
const CHANNELS = [
  { name: 'Planet Canoe on YouTube', url: 'https://www.youtube.com/@PlanetCanoe', text: 'The ICF\'s own channel. Live streams of World Championships and World Games, full-pitch replays and finals.' },
  { name: 'Live and upcoming streams', url: 'https://www.youtube.com/@PlanetCanoe/streams', text: 'Every pitch at major championships is usually streamed live here, and stays up as a replay afterwards.' },
  { name: '2024 World Championships playlist', url: 'https://www.youtube.com/playlist?list=PLWpi79GxUJdaTiUOokp4S8RqInIBYN31D', text: 'Every stream and final from Deqing, China: a good place to binge top-level canoe polo.' },
  { name: 'Canoe polo World Championships', url: 'https://paddleworldwide.com/competitions/2026-canoe-polo-world-championships-2438/media', text: 'Official results, news and media from the ICF (now Paddle Worldwide).' },
];

module.exports = { CATEGORIES, CHANNELS, parseYouTubeId, all, byCategory, getById, validate, save, remove };
