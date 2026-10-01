// canoepolo.eu - main web server
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const T = require('./tournaments');
const { COUNTRIES, LEVELS, DIVISIONS, STATUSES, flag } = require('./constants');
const { buildCalendar } = require('./ical');
const V = require('./videos');
require('./imports').run(); // one-time tournament imports (skips anything already listed)
const C = require('./community');

// ---------- Settings (come from the .env file on the server) ----------
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (IS_PROD && (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || !SESSION_SECRET || SESSION_SECRET.length < 32)) {
  console.error('ERROR: set ADMIN_PASSWORD (12+ chars) and SESSION_SECRET (32+ chars) in your .env file.');
  process.exit(1);
}
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD || 'change-me-please', 10);
if (!ADMIN_PASSWORD) console.warn('WARNING: no ADMIN_PASSWORD set - using "change-me-please" (development only).');

// Changes on every deploy, so browsers fetch fresh CSS/JS (they are cached for a day otherwise)
const ASSET_V = Date.now().toString(36);

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1); // we sit behind Caddy
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      frameSrc: ['https://www.youtube-nocookie.com'],
      scriptSrc: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  },
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: IS_PROD ? '1d' : 0 }));
const stats = require('./stats');
app.use(stats.middleware);
app.post('/_c', rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: false, legacyHeaders: false }), stats.clickHandler);
app.use(cookieSession({
  name: 'cp_session',
  secret: SESSION_SECRET || 'dev-only-secret-do-not-use-in-production',
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  maxAge: 12 * 60 * 60 * 1000, // 12 hours
}));

// Helpers available in every page template
app.use((req, res, next) => {
  // Only the admin area uses a cookie. Public visitors get no cookies at all.
  if (req.path.startsWith('/admin') && !req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  Object.assign(res.locals, {
    COUNTRIES, LEVELS, DIVISIONS, STATUSES, flag, BASE_URL,
    csrf: req.session.csrf || '',
    assetV: ASSET_V,
    isAdmin: !!req.session.admin,
    path: req.path,
    fmtRange,
    fmtDate,
    today: T.today(),
  });
  next();
});

function fmtDate(ymd, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!ymd) return '';
  return new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}
function fmtRange(a, b) {
  if (!b || a === b) return fmtDate(a);
  const [ya, ma] = a.split('-');
  const [yb, mb] = b.split('-');
  if (ya === yb && ma === mb) return `${Number(a.slice(8))}-${fmtDate(b)}`;
  if (ya === yb) return `${fmtDate(a, { day: 'numeric', month: 'short' })} - ${fmtDate(b)}`;
  return `${fmtDate(a)} - ${fmtDate(b)}`;
}

// Photos: put files in public/images/ (e.g. hero.jpg). Returns the web path if the file exists.
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
function findImage(name) {
  for (const ext of ['jpg', 'jpeg', 'webp', 'png']) {
    if (require('fs').existsSync(path.join(IMAGES_DIR, `${name}.${ext}`))) return `/images/${name}.${ext}`;
  }
  return null;
}
// Optional photo credit: a text file next to the photo, e.g. public/images/hero.txt
function findCredit(name) {
  const f = path.join(IMAGES_DIR, `${name}.txt`);
  try { return require('fs').readFileSync(f, 'utf8').trim().slice(0, 200); } catch { return ''; }
}

function pickFilters(q) {
  const str = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');
  return {
    country: str(q.country).toUpperCase(),
    level: str(q.level),
    division: str(q.division),
    month: str(q.month),
    q: str(q.q),
  };
}

// ---------- Public pages ----------
// Landing page: the home of international canoe polo
app.get('/', (req, res) => {
  const upcoming = T.listPublic({ when: 'upcoming', limit: 500 });
  const next = [...upcoming].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = T.listPublic({ when: 'past', limit: 500 });
  const byCountry = {};
  upcoming.forEach((t) => { byCountry[t.country] = (byCountry[t.country] || 0) + 1; });
  const allVideos = V.all();
  res.render('home', {
    title: 'The home of international canoe polo',
    nextUp: next.slice(0, 6),
    recent: past.slice(0, 4),
    videos: allVideos.slice(0, 3),
    countryCounts: Object.entries(byCountry).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    stats: { upcoming: upcoming.length, past: past.length, countries: Object.keys(byCountry).length, videos: allVideos.length },
    heroImage: findImage('hero'),
    heroCredit: findCredit('hero'),
    FAMILY: C.FAMILY,
  });
});

// Future tournaments
app.get('/tournaments', (req, res) => {
  const filters = pickFilters(req.query);
  const tournaments = T.listPublic({ ...filters, when: 'upcoming' });
  res.render('index', { title: 'Upcoming tournaments', tournaments, filters, countries: T.countriesInUse(), when: 'upcoming' });
});

app.get('/support', (req, res) => res.render('support', { title: 'Support and funding', ...require('./support') }));

app.get('/shop', (req, res) => res.render('shop', { title: 'Shop', shopImage: findImage('shop') }));

app.get('/past', (req, res) => {
  const filters = pickFilters(req.query);
  const tournaments = T.listPublic({ ...filters, when: 'past' });
  res.render('index', { title: 'Past tournaments', tournaments, filters, countries: T.countriesInUse(), when: 'past' });
});

// Month calendar view
const MONTHS_BAR = { 'World Championships': 'major', 'Continental Championships': 'major', 'World Games': 'major', 'International': 'intl', 'National Championships': 'nat', 'National League': 'nat', 'Club / Friendly': 'club' };
function buildMonthGrid(monthStr, rows) {
  const [y, m] = monthStr.split('-').map(Number);
  const iso = (d) => d.toISOString().slice(0, 10);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const start = new Date(first); start.setUTCDate(start.getUTCDate() - ((first.getUTCDay() + 6) % 7)); // Monday
  const end = new Date(last); end.setUTCDate(end.getUTCDate() + (7 - ((last.getUTCDay() + 6) % 7 + 1)));
  const todayStr = new Date().toISOString().slice(0, 10);
  const weeks = [];
  for (let ws = new Date(start); ws <= end; ws.setUTCDate(ws.getUTCDate() + 7)) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setUTCDate(d.getUTCDate() + i);
      days.push({ date: iso(d), n: d.getUTCDate(), inMonth: d.getUTCMonth() === m - 1, today: iso(d) === todayStr });
    }
    const wStart = days[0].date, wEnd = days[6].date;
    const segs = rows.filter((t) => t.start_date <= wEnd && t.end_date >= wStart).map((t) => {
      const c1 = days.findIndex((d) => d.date >= t.start_date);
      const s0 = t.start_date < wStart ? 0 : days.findIndex((d) => d.date === t.start_date);
      let e0 = t.end_date > wEnd ? 6 : days.findIndex((d) => d.date === t.end_date);
      void c1;
      return { t, col: s0, span: e0 - s0 + 1, cutL: t.start_date < wStart, cutR: t.end_date > wEnd, kind: MONTHS_BAR[t.level] || 'intl' };
    }).sort((a, b) => a.col - b.col || b.span - a.span);
    const laneEnds = [];
    segs.forEach((sg) => {
      let lane = laneEnds.findIndex((e) => e < sg.col);
      if (lane < 0) { lane = laneEnds.length; laneEnds.push(0); }
      laneEnds[lane] = sg.col + sg.span - 1;
      sg.lane = lane;
    });
    weeks.push({ days, segs, lanes: Math.max(laneEnds.length, 1) });
  }
  const prev = new Date(Date.UTC(y, m - 2, 1)), next = new Date(Date.UTC(y, m, 1));
  return { weeks, label: first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }), prev: iso(prev).slice(0, 7), next: iso(next).slice(0, 7), month: monthStr };
}

app.get('/tournaments/calendar', (req, res) => {
  const filters = pickFilters(req.query);
  const nowM = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(req.query.m || '')) ? String(req.query.m) : nowM;
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const rows = T.listBetween(from, to, filters);
  // the grid also shows the days of neighbouring months, so fetch the whole visible range
  const gridFrom = new Date(Date.UTC(y, m - 1, 1 - 6)).toISOString().slice(0, 10);
  const gridTo = new Date(Date.UTC(y, m, 6)).toISOString().slice(0, 10);
  const cal = buildMonthGrid(month, T.listBetween(gridFrom, gridTo, filters));
  res.render('calendar', { title: `Tournament calendar: ${cal.label}`, cal, rows, filters, countries: T.countriesInUse(), nowM });
});

app.get('/tournaments/:slug', (req, res) => {
  const t = T.getBySlug(req.params.slug, { includeDrafts: !!req.session.admin });
  if (!t) return res.status(404).render('404', { title: 'Not found' });
  res.render('tournament', { title: t.name, t, schedule: require('./schedules').forSlug(t.slug) });
});

app.get('/tournaments/:slug/calendar.ics', (req, res) => {
  const t = T.getBySlug(req.params.slug);
  if (!t) return res.status(404).send('Not found');
  res.type('text/calendar').attachment(`${t.slug}.ics`).send(buildCalendar([t], BASE_URL));
});

// Subscribe-able calendar with all upcoming tournaments
app.get('/calendar.ics', (req, res) => {
  res.type('text/calendar').send(buildCalendar(T.listPublic({ when: 'upcoming', limit: 500 }), BASE_URL));
});

app.get('/about', (req, res) => res.render('about', { title: 'About' }));

// Video thumbnails are fetched from YouTube by our server and cached, so visitors' browsers
// don't contact Google until they press play.
const THUMB_DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'thumbs');
require('fs').mkdirSync(THUMB_DIR, { recursive: true });
app.get('/thumb/:id/:q.jpg', async (req, res) => {
  const { id, q } = req.params;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !['default', 'mqdefault', 'hqdefault'].includes(q)) return res.status(404).end();
  const file = path.join(THUMB_DIR, `${id}-${q}.jpg`);
  res.set('Cache-Control', 'public, max-age=604800');
  if (require('fs').existsSync(file)) return res.type('jpg').sendFile(file);
  try {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(404).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 2_000_000) return res.status(404).end();
    require('fs').writeFileSync(file, buf);
    res.type('jpg').send(buf);
  } catch {
    res.status(404).end();
  }
});

// Watch: highlights and full games (videos are managed in the admin panel)
app.get('/watch', (req, res) => res.render('watch', { title: 'Watch canoe polo', ...V.byCategory(), CATEGORIES: V.CATEGORIES, CHANNELS: V.CHANNELS }));

// Tactics board (all the work happens in the browser: public/tactics.js)
app.get('/tactics', (req, res) => res.render('tactics', { title: 'Tactics board' }));

// Learning hub, referee section and quiz, get involved
app.get('/learn', (req, res) => res.render('learn', { title: 'Learn canoe polo', LEARN: C.LEARN }));
app.get('/referee', (req, res) => res.render('referee', { title: 'Learn to referee', ...require('./referee'), SIGNALS: require('../public/signals.js').SIGNALS }));
app.get('/referee/quiz', (req, res) => res.render('referee-quiz', { title: 'Referee quiz' }));
app.get('/get-involved', (req, res) => res.render('get-involved', { title: 'Get involved', INVOLVED: C.INVOLVED, ORGANISATIONS: require('./support').ORGANISATIONS, NATIONAL: require('./support').NATIONAL }));

app.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy policy' }));
app.get('/terms', (req, res) => res.render('terms', { title: 'Terms of use' }));

// Rules in plain English
app.get('/rules', (req, res) => res.render('rules', { title: 'Canoe polo rules', ...require('./rules') }));

// ---------- Public JSON API (for apps, club sites, etc.) ----------
app.get('/api/tournaments', (req, res) => {
  const when = req.query.when === 'past' ? 'past' : 'upcoming';
  const rows = T.listPublic({ ...pickFilters(req.query), when, limit: req.query.limit });
  res.set('Access-Control-Allow-Origin', '*');
  res.json({
    count: rows.length,
    tournaments: rows.map(({ id, contact_email, created_at, ...pub }) => ({ ...pub, url: `${BASE_URL}/tournaments/${pub.slug}` })),
  });
});

app.get('/api/tournaments/:slug', (req, res) => {
  const t = T.getBySlug(req.params.slug);
  res.set('Access-Control-Allow-Origin', '*');
  if (!t) return res.status(404).json({ error: 'Not found' });
  const { id, created_at, ...pub } = t;
  res.json({ ...pub, url: `${BASE_URL}/tournaments/${t.slug}` });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nSitemap: ${BASE_URL}/sitemap.xml\n`));

app.get('/sitemap.xml', (req, res) => {
  const all = [...T.listPublic({ when: 'upcoming', limit: 500 }), ...T.listPublic({ when: 'past', limit: 500 })];
  const urls = [`${BASE_URL}/`, `${BASE_URL}/tournaments`, `${BASE_URL}/tournaments/calendar`, `${BASE_URL}/past`, `${BASE_URL}/watch`, `${BASE_URL}/learn`, `${BASE_URL}/referee`, `${BASE_URL}/referee/quiz`, `${BASE_URL}/get-involved`, `${BASE_URL}/tactics`, `${BASE_URL}/rules`, `${BASE_URL}/shop`, `${BASE_URL}/support`, `${BASE_URL}/about`, `${BASE_URL}/privacy`, `${BASE_URL}/terms`, ...all.map((t) => `${BASE_URL}/tournaments/${t.slug}`)];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
  );
});

// ---------- Admin ----------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/admin/login');
}
function checkCsrf(req, res, next) {
  const sent = String(req.body._csrf || '');
  const want = String(req.session.csrf || '');
  if (sent.length === want.length && want && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(want))) return next();
  res.status(403).send('Form expired - please go back, refresh the page and try again.');
}

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin login', error: null });
});

app.post('/admin/login', loginLimiter, checkCsrf, (req, res) => {
  const { username = '', password = '' } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(String(password), adminHash)) {
    req.session.admin = true;
    req.session.csrf = crypto.randomBytes(24).toString('hex');
    return res.redirect('/admin');
  }
  res.status(401).render('admin/login', { title: 'Admin login', error: 'Wrong username or password.' });
});

app.post('/admin/logout', checkCsrf, (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard', { title: 'Admin', tournaments: T.listAll(), msg: req.query.msg || '' });
});

app.get('/admin/stats', requireAdmin, (req, res) => {
  const days = [7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const r = stats.report(days);
  res.render('admin/stats', { title: 'Statistics', days, r, max: Math.max(1, ...r.series.map((d) => d.views)) });
});

app.get('/admin/new', requireAdmin, (req, res) => {
  res.render('admin/form', { title: 'Add tournament', t: { status: 'published', level: 'International', divisions: [] }, errors: [], action: '/admin/new' });
});

app.post('/admin/new', requireAdmin, checkCsrf, (req, res) => {
  const { data, errors } = T.validate(req.body);
  if (errors.length) {
    return res.status(400).render('admin/form', { title: 'Add tournament', t: { ...data, divisions: data.divisions.split(',') }, errors, action: '/admin/new' });
  }
  const t = T.create(data);
  res.redirect(`/admin?msg=${encodeURIComponent(`Added “${t.name}”`)}`);
});

app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const t = T.getById(Number(req.params.id));
  if (!t) return res.status(404).render('404', { title: 'Not found' });
  res.render('admin/form', { title: `Edit: ${t.name}`, t, errors: [], action: `/admin/edit/${t.id}` });
});

app.post('/admin/edit/:id', requireAdmin, checkCsrf, (req, res) => {
  const id = Number(req.params.id);
  const existing = T.getById(id);
  if (!existing) return res.status(404).render('404', { title: 'Not found' });
  const { data, errors } = T.validate(req.body);
  if (errors.length) {
    return res.status(400).render('admin/form', { title: `Edit: ${existing.name}`, t: { ...existing, ...data, divisions: data.divisions.split(',') }, errors, action: `/admin/edit/${id}` });
  }
  const t = T.update(id, data);
  res.redirect(`/admin?msg=${encodeURIComponent(`Saved “${t.name}”`)}`);
});

app.post('/admin/delete/:id', requireAdmin, checkCsrf, (req, res) => {
  const t = T.getById(Number(req.params.id));
  if (t) T.remove(t.id);
  res.redirect(`/admin?msg=${encodeURIComponent(t ? `Deleted “${t.name}”` : 'Nothing to delete')}`);
});

// ---------- Admin: videos for the Watch page ----------
app.get('/admin/videos', requireAdmin, (req, res) => {
  res.render('admin/videos', { title: 'Videos', videos: V.all(), CATEGORIES: V.CATEGORIES, msg: req.query.msg || '' });
});

app.get('/admin/videos/new', requireAdmin, (req, res) => {
  res.render('admin/video-form', { title: 'Add video', v: { category: 'highlights' }, errors: [], action: '/admin/videos/new', CATEGORIES: V.CATEGORIES });
});

app.get('/admin/videos/edit/:id', requireAdmin, (req, res) => {
  const v = V.getById(Number(req.params.id));
  if (!v) return res.status(404).render('404', { title: 'Not found' });
  res.render('admin/video-form', { title: `Edit: ${v.title}`, v, errors: [], action: `/admin/videos/edit/${v.id}`, CATEGORIES: V.CATEGORIES });
});

app.post(['/admin/videos/new', '/admin/videos/edit/:id'], requireAdmin, checkCsrf, (req, res) => {
  const id = req.params.id ? Number(req.params.id) : 0;
  if (id && !V.getById(id)) return res.status(404).render('404', { title: 'Not found' });
  const { data, errors } = V.validate(req.body);
  if (errors.length) {
    return res.status(400).render('admin/video-form', { title: id ? 'Edit video' : 'Add video', v: data, errors, action: req.originalUrl, CATEGORIES: V.CATEGORIES });
  }
  const v = V.save(id, data);
  res.redirect(`/admin/videos?msg=${encodeURIComponent(`Saved “${v.title}”`)}`);
});

app.post('/admin/videos/delete/:id', requireAdmin, checkCsrf, (req, res) => {
  const v = V.getById(Number(req.params.id));
  if (v) V.remove(v.id);
  res.redirect(`/admin/videos?msg=${encodeURIComponent(v ? `Removed “${v.title}”` : 'Nothing to remove')}`);
});

// ---------- Errors ----------
app.use((req, res) => res.status(404).render('404', { title: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Please try again.');
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`canoepolo.eu running on ${BASE_URL} (port ${PORT})`));
}
module.exports = app;
