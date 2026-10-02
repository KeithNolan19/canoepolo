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
const B = require('./blog');
const stats = require('./stats');
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

// Google's translated copy of a page (translate.goog) can load our CSS, images and scripts from this site's own
// address, so allow our own origin explicitly and let our static files be used cross-origin. They are public files.
const OWN = (() => { try { const u = new URL(BASE_URL); return u.protocol === 'https:' ? [u.origin] : []; } catch { return []; } })();
app.use('/fonts', (req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", ...OWN],
      fontSrc: ["'self'", ...OWN],
      imgSrc: ["'self'", 'data:', ...OWN],
      frameSrc: ['https://www.youtube-nocookie.com'],
      scriptSrc: ["'self'", ...OWN],
      formAction: ["'self'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  },
}));
const FLAGS = new Set(require('fs').readdirSync(path.join(__dirname, '..', 'public', 'flags')).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, 2)));
// Flag as a small picture (emoji flags do not show on every computer)
const flagImg = (c) => { c = String(c || '').toLowerCase(); return FLAGS.has(c) ? `<img class="fl" src="/flags/${c}.svg" alt="" width="20" height="15" loading="lazy">` : ''; };
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(stats.middleware); // before the static files so downloads of documents are counted
// Caching: CSS and JS are linked with ?v=<start time>, so they can be kept for a year (a new deploy changes the link).
// Fonts never change. Pictures are kept a month. Documents are checked hourly because they can be replaced.
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, file) {
    if (!IS_PROD) return res.set('Cache-Control', 'no-cache');
    const year = 'public, max-age=31536000, immutable';
    if (/[\\/]fonts[\\/]/.test(file) || /\.(css|js)$/.test(file)) res.set('Cache-Control', year);
    else if (/[\\/]docs[\\/]/.test(file)) res.set('Cache-Control', 'public, max-age=3600');
    else res.set('Cache-Control', 'public, max-age=2592000');
  },
}));
// Overall brake on abusive traffic (generous for real visitors)
// Every limiter answers 429 with a Retry-After header, so well behaved tools and crawlers slow down by themselves.
const tooMany = (req, res) => res.status(429).type('text/plain').send('Too many requests. Please slow down and try again in a minute.\n');
const limiter = (limit, windowMin = 1) => rateLimit({ windowMs: windowMin * 60 * 1000, limit, standardHeaders: 'draft-7', legacyHeaders: false, handler: tooMany });
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, handler: tooMany, skip: (req) => req.path === '/health' }));
// Heavier pages and the open API get a tighter limit of their own (on top of the overall one).
app.use(['/tournaments/map', '/sitemap.xml', '/blog/feed.xml', '/calendar.ics'], limiter(60));
app.use('/api', limiter(120));
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  if (req.path.startsWith('/admin')) res.set('Cache-Control', 'no-store');
  else if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=0, must-revalidate'); // always checked, answered with a tiny "not modified" when nothing changed
  next();
});
app.get('/.well-known/security.txt', (req, res) => res.type('text/plain').send(`Contact: https://wa.me/353876789927\nPreferred-Languages: en\nCanonical: ${BASE_URL}/.well-known/security.txt\nExpires: 2027-10-01T00:00:00.000Z\n`));
app.post('/_c', rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: false, legacyHeaders: false }), stats.clickHandler);
app.use(cookieSession({
  name: 'cp_session',
  secret: SESSION_SECRET || 'dev-only-secret-do-not-use-in-production',
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  maxAge: 12 * 60 * 60 * 1000, // 12 hours
}));

// "Read this site in" links. Each one is a plain link to Google's translated copy of the page, so nothing is sent
// to Google unless a visitor clicks. Only shown on the real https site, not on the admin pages.
const LANGS = [['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano'], ['nl', 'Nederlands'], ['da', 'Dansk'], ['cs', 'Čeština'], ['pl', 'Polski']];
function translateLinks(req) {
  let u;
  try { u = new URL(BASE_URL); } catch { return []; }
  if (u.protocol !== 'https:' || /^(localhost|127\.|\[)/.test(u.hostname) || req.path.startsWith('/admin')) return [];
  const host = u.hostname.replace(/-/g, '--').replace(/\./g, '-') + '.translate.goog';
  return LANGS.map(([code, name]) => ({ code, name, url: `https://${host}${req.originalUrl.split('?')[0]}?_x_tr_sl=en&_x_tr_tl=${code}&_x_tr_hl=${code}&_x_tr_pto=wapp` }));
}

// Helpers available in every page template
app.use((req, res, next) => {
  // Only the admin area uses a cookie. Public visitors get no cookies at all.
  if (req.path.startsWith('/admin') && !req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  Object.assign(res.locals, {
    COUNTRIES, LEVELS, DIVISIONS, STATUSES, flag, flagImg, BASE_URL,
    csrf: req.session.csrf || '',
    assetV: ASSET_V,
    isAdmin: !!req.session.admin,
    path: req.path,
    fmtRange,
    fmtDate,
    today: T.today(),
    canonical: BASE_URL + req.path,
    langs: translateLinks(req),
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
  const today = new Date().toISOString().slice(0, 10);
  const popupT = T.getBySlug('paddle-europe-canoe-polo-club-championships-2026');
  const popup = popupT && popupT.end_date >= today ? popupT : null;
  const liveUrl = popup ? require('./schedules').forSlug(popup.slug).liveUrl : '';
  res.render('home', {
    popup, liveUrl,
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

app.get('/tournaments/map', (req, res) => {
  const MAP = require('./map');
  const when = req.query.when === 'past' ? 'past' : 'upcoming';
  const view = MAP.VIEWS[req.query.region] ? req.query.region : 'europe';
  const rows = T.listPublic({ when, limit: 500 });
  const m = MAP.places(rows, view);
  res.render('map', { title: `Tournament map: ${MAP.VIEWS[view].label}`, metaDescription: 'Map of canoe polo tournaments around the world: see where the next events are.', when, view, VIEWS: MAP.VIEWS, m, total: rows.length, shown: m.pins.reduce((n, p) => n + p.items.length, 0) });
});

app.get('/tournaments/:slug', (req, res) => {
  const t = T.getBySlug(req.params.slug, { includeDrafts: !!req.session.admin });
  if (!t) return res.status(404).render('404', { title: 'Not found' });
  res.render('tournament', { title: t.name, t, schedule: require('./schedules').forSlug(t.slug) });
});

const exportLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: false, legacyHeaders: false });
function scheduleExport(kind) {
  return async (req, res, next) => {
    try {
      const t = T.getBySlug(req.params.slug);
      const schedule = t && require('./schedules').forSlug(t.slug);
      if (!schedule || schedule.hidden) return res.status(404).render('404', { title: 'Not found' });
      const X = require('./export');
      await X[kind](t, schedule, X.readFilters(req.query), res);
    } catch (e) { next(e); }
  };
}
app.get('/tournaments/:slug/schedule.pdf', exportLimiter, scheduleExport('pdf'));
app.get('/tournaments/:slug/schedule.xlsx', exportLimiter, scheduleExport('xlsx'));

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
const LB = require('./leaderboard');
const scoreLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 8, standardHeaders: false, legacyHeaders: false });
app.get('/referee/quiz/token', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ t: LB.newToken() }); });
app.post('/referee/quiz/score', scoreLimiter, express.json({ limit: '2kb' }), (req, res) => {
  const r = LB.submit(req.body || {});
  res.status(r.ok ? 200 : 400).json(r);
});
app.get('/referee/leaderboard', (req, res) => res.render('leaderboard', { title: 'Referee quiz leaderboard', rows: LB.top(50) }));
app.get('/referee/quiz', (req, res) => res.render('referee-quiz', { title: 'Referee quiz', board: LB.top(10) }));
app.get('/get-involved', (req, res) => res.render('get-involved', { title: 'Get involved', INVOLVED: C.INVOLVED, ORGANISATIONS: require('./support').ORGANISATIONS, NATIONAL: require('./support').NATIONAL }));

app.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy policy' }));
app.get('/terms', (req, res) => res.render('terms', { title: 'Terms of use' }));

// Rules in plain English
app.get('/rules', (req, res) => res.render('rules', { title: 'Canoe polo rules', ...require('./rules') }));

// ---------- Public JSON API (for apps, club sites, etc.) ----------
const live = require('./live');
app.use((req, res, next) => { const m = require('./sms'); res.locals.smsOpen = m.available() && !m.full(); next(); }); // shows the text-updates buttons only when switched on
// "Support your club" for the ECC: pick a country, then see its teams, games, live scores, scorers and duties
const ECC_SLUG = 'paddle-europe-canoe-polo-club-championships-2026';
// Gazebo / boat storage numbers from the organisers' list, only where the club on the list is clearly the same team
const GAZEBO = {
  'Corbeil-Essenos|Men': 1, 'KGV Essen|Men': 2, 'Zurich|Men': 3, 'Ulster|Men': 4, 'Neptun|Women': 5, 'Skovshoveld|Men': 6, 'Odysseus|Men': 7,
  'Avranches|Men': 8, 'KSVH Berlin|Men': 9, 'Coimbra|Men': 10, 'Napoli|Men': 11, 'KRM Essen|Women': 13, 'Duisburg|Women': 14, "Pont D'ouilly|Women": 15,
  'Linkopig|Men': 16, 'Burriana|Women': 17, 'Alaquas|Women': 18, 'Kingston|Women': 19, 'Poznan|Men': 20, 'Malaga|Men': 21, 'Gent|Men': 22, 'Setubal|Men': 23,
  'Iper|Men': 24, 'Avranches|Women': 25, 'Dispersus|Men': 26, 'Thurgauer|Men': 27, 'Mullingar|Women': 28, 'Castellón|Men': 30,
};
function eccCountries() {
  const sch = require('./schedules').forSlug(ECC_SLUG);
  const byCc = {};
  sch.teams.forEach((t) => { const cc = sch.countries[t.name]; if (cc) (byCc[cc] = byCc[cc] || []).push(t); });
  return { sch, list: Object.entries(byCc).map(([cc, teams]) => ({ cc, name: COUNTRIES[cc] || cc, teams })).sort((a, b) => a.name.localeCompare(b.name)) };
}
app.get(`/tournaments/${ECC_SLUG}/support`, (req, res) => {
  const { list } = eccCountries();
  res.render('support', { title: 'Support your club at the ECC 2026', countries: list, slug: ECC_SLUG, metaDescription: 'Pick your country to see every club, game, live score and scorer at the 2026 European Club Championships in Milan.' });
});
app.get('/ecc/ireland', (req, res) => res.redirect(301, `/tournaments/${ECC_SLUG}/support/IE`));
app.get(`/tournaments/${ECC_SLUG}/support/:cc`, (req, res, next) => {
  const cc = String(req.params.cc || '').toUpperCase();
  const { sch, list } = eccCountries();
  const country = list.find((c) => c.cc === cc);
  if (!country) return next();
  const { OFFICIALS } = require('./officials');
  const scores = live.snapshot();
  const names = new Set(country.teams.map((t) => t.name));
  const teams = {}; const duties = {};
  sch.days.forEach((d) => d.slots.forEach((sl) => sl.matches.forEach((m) => {
    [m.home, m.away].forEach((name) => {
      if (!names.has(name) || m.group.length !== 1) return;
      const key = `${name}|${m.division}`;
      const t = teams[key] = teams[key] || { name, division: m.division, group: m.group, games: [], p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gazebo: GAZEBO[key] || null };
      const home = m.home === name;
      const sc = scores[m.code];
      if (sc) {
        const [a, b] = sc.s.split(' - ').map(Number);
        const mine = home ? a : b, theirs = home ? b : a;
        if (sc.st === 'FT') { t.p++; t.gf += mine; t.ga += theirs; if (mine > theirs) t.w++; else if (mine < theirs) t.l++; else t.d++; }
      }
      t.games.push({ day: d.label, start: sl.start, pitch: m.pitch, code: m.code, opp: home ? m.away : m.home, oppFlag: sch.countries[home ? m.away : m.home] || '', group: m.group, live: m.live || '', away: !home });
    });
    // Duties follow the organisers' own match page; the Friday sheet is only the fallback before a page has been read
    const pg = live.meta.get(m.code);
    const po = pg && pg.detail && pg.detail.officials;
    let off = null;
    if (po && (po.referee1 || po.referee2)) off = [[po.referee1, 'Referee 1'], [po.referee2, 'Referee 2'], [po.scorer, 'Scorer'], [po.timekeeper, 'Timekeeper']];
    else if (d.date === '2026-10-02' && OFFICIALS[m.code]) off = [[OFFICIALS[m.code][0], 'Referee 1'], [OFFICIALS[m.code][1], 'Referee 2 / table']];
    if (off) off.forEach(([o, role]) => {
      const club = o && [...names].find((n) => n.toLowerCase() === o.trim().toLowerCase());
      if (!club) return;
      (duties[club] = duties[club] || []).push({ start: sl.start, pitch: m.pitch, code: m.code, match: `${m.home} v ${m.away}`, role });
    });
  })));
  const rows = Object.values(teams).sort((a, b) => a.name.localeCompare(b.name) || a.division.localeCompare(b.division));
  res.render('support-country', { title: `${country.name} at the ECC 2026`, country, teams: rows, duties, sch, slug: ECC_SLUG, metaDescription: `Every ${country.name} club at the 2026 European Club Championships: games, live scores, scorers and duties.` });
});
// Text (SMS) updates: sign up with a phone number, confirm with a code, get "next up" and result texts
const sms = require('./sms');
const smsPage = (req, res, extra = {}) => {
  const { sch } = eccCountries();
  const teams = sch.teams.filter((t) => sch.countries[t.name]);
  const q = [].concat(req.query.team || []).map(String);
  res.render('text-updates', { title: 'Text updates for the ECC 2026', slug: ECC_SLUG, open: sms.available(), full: sms.full(), teams, picked: q, step: 'form', error: '', done: false, phone: '', metaDescription: 'Get a text when your team is next up and with the result at the ECC 2026.', ...extra });
};
const smsStartLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 6, standardHeaders: false, legacyHeaders: false, handler: tooMany });
const smsVerifyLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: false, legacyHeaders: false, handler: tooMany });
app.get(`/tournaments/${ECC_SLUG}/text-updates`, (req, res) => smsPage(req, res));
app.post(`/tournaments/${ECC_SLUG}/text-updates`, smsStartLimit, async (req, res) => {
  if (req.body.website) return smsPage(req, res, { error: 'Something went wrong.' }); // hidden field filled in: a bot
  const { sch } = eccCountries();
  const ok = new Set(sch.teams.filter((t) => sch.countries[t.name]).map((t) => `${t.name}|${t.division}`));
  const picked = [].concat(req.body.teams || []).map(String).filter((k) => ok.has(k));
  const teams = picked.map((k) => { const [team, division] = k.split('|'); return { team, division }; });
  if (!req.body.agree) return smsPage(req, res, { error: 'Please tick the box to agree.', phone: String(req.body.phone || '').slice(0, 20), picked });
  const r = await sms.start(req.body.phone, teams);
  smsPage(req, res, { step: r.step || 'form', error: r.error || '', done: !!r.done, phone: r.phone || String(req.body.phone || '').slice(0, 20), picked });
});
app.post(`/tournaments/${ECC_SLUG}/text-updates/verify`, smsVerifyLimit, async (req, res) => {
  const r = await sms.verify(req.body.phone, req.body.code);
  smsPage(req, res, { step: r.step || 'form', error: r.error || '', done: !!r.done, phone: r.phone || '' });
});
app.get('/s/:token', (req, res) => {
  const r = sms.byToken(req.params.token);
  res.render('text-stop', { title: 'Stop text updates', slug: ECC_SLUG, valid: !!r && !r.stopped, stopped: false, token: r ? r.token : '', masked: r ? r.phone.slice(0, 4) + '***' + r.phone.slice(-2) : '' });
});
app.post('/s/:token', smsVerifyLimit, (req, res) => {
  const ok = sms.stopByToken(req.params.token);
  res.render('text-stop', { title: 'Stop text updates', slug: ECC_SLUG, valid: ok, stopped: ok, token: '', masked: '' });
});
app.get('/admin/sms', requireAdmin, (req, res) => {
  const { sch } = eccCountries();
  res.render('admin/sms', { fmt: (ms) => new Date(ms).toLocaleString('en-IE', { timeZone: 'Europe/Dublin', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), title: 'Text updates', s: sms.summary(), teams: sch.teams.filter((t) => sch.countries[t.name]), msg: String(req.query.msg || '').slice(0, 200), counts: Object.fromEntries(sms.summary().perTeam.map((r) => [`${r.team}|${r.division}`, r.n])) });
});
app.post('/admin/sms/send', requireAdmin, checkCsrf, async (req, res) => {
  const team = String(req.body.team || '');
  const text = String(req.body.text || '').trim();
  if (!text || text.length > 120) return res.redirect('/admin/sms?msg=' + encodeURIComponent('Write a message of up to 120 characters.'));
  if (!req.body.confirm) return res.redirect('/admin/sms?msg=' + encodeURIComponent('Tick the box to confirm.'));
  const r = await sms.broadcast(team, text);
  res.redirect('/admin/sms?msg=' + encodeURIComponent(`Sent to ${r.ok} of ${r.total} numbers${r.failed ? ` (${r.failed} failed)` : ''}.`));
});
app.get('/api/live-game/:code', (req, res) => { res.set('Cache-Control', 'public, max-age=15'); res.json(live.detail(String(req.params.code).toUpperCase().slice(0, 6)) || {}); });
app.get('/api/live-changes', (req, res) => { res.set('Cache-Control', 'public, max-age=30'); res.json(live.changes()); });
app.get('/api/standings', (req, res) => { res.set('Cache-Control', 'public, max-age=20'); res.json(live.standings()); });
app.get('/api/live-scores', (req, res) => { res.set('Cache-Control', 'public, max-age=20'); res.json(live.snapshot()); });
app.get('/api/tournaments', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
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

// ---------- Blog ----------
const GAZEBOS = require('./gazebos');
app.get(`/tournaments/${GAZEBOS.slug}/gazebos`, (req, res) => res.render('gazebos', { g: GAZEBOS, title: 'ECC 2026 competition area and gazebo placement', metaDescription: 'Gazebo and boat storage placement and site map for the 2026 European Club Championships in Milan.' }));
app.get('/blog', (req, res) => res.render('blog', { title: 'Blog', posts: B.listPublic(), readMins: B.readMins, metaDescription: 'Canoe polo (kayak polo) guides, news and how-tos from canoepolo.eu: how the game works, where to play, and how to get involved.' }));
app.get('/blog/feed.xml', (req, res) => {
  const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = B.listPublic().slice(0, 30).map((p) => `<item><title>${x(p.title)}</title><link>${BASE_URL}/blog/${p.slug}</link><guid>${BASE_URL}/blog/${p.slug}</guid><pubDate>${new Date(p.published_at + 'T09:00:00Z').toUTCString()}</pubDate><description>${x(p.summary)}</description></item>`).join('');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>canoepolo.eu blog</title><link>${BASE_URL}/blog</link><description>Canoe polo guides and news</description>${items}</channel></rss>`);
});
app.get('/blog/:slug', (req, res) => {
  const post = B.bySlug(req.params.slug);
  if (!post) return res.status(404).render('404', { title: 'Not found' });
  res.render('post', { title: post.title, metaDescription: post.summary, ogType: 'article', post, html: B.render(post.body), readMins: B.readMins(post.body), more: B.listPublic().filter((p) => p.id !== post.id).slice(0, 3) });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const textFile = (body) => (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(body);
// Search engines and AI assistants are welcome to read the public pages. Kept out: the admin area, the quiz leaderboard
// (people's names), files made on request, internal endpoints and filtered or searched copies of pages.
app.get('/robots.txt', textFile(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /_c
Disallow: /thumb/
Disallow: /referee/leaderboard
Disallow: /referee/quiz/
Disallow: /tournaments/*/schedule.pdf
Disallow: /tournaments/*/schedule.xlsx
Disallow: /*?

Sitemap: ${BASE_URL}/sitemap.xml
`));
app.get(['/llms.txt', '/llm.txt'], textFile(`# canoepolo.eu

> The home of international canoe polo (kayak polo): tournaments, schedules, rules, referee resources, videos and a tactics board. Run by volunteers (not a legal entity).

## Main pages
- [Upcoming tournaments](${BASE_URL}/tournaments): calendar of canoe polo tournaments worldwide
- [Tournament map](${BASE_URL}/tournaments/map): where tournaments are
- [Past tournaments](${BASE_URL}/past)
- [Rules in plain English](${BASE_URL}/rules)
- [Referee guide and quiz](${BASE_URL}/referee)
- [Blog](${BASE_URL}/blog): guides for clubs, grants, safeguarding and more
- [Watch](${BASE_URL}/watch): highlights and finals
- [Get involved](${BASE_URL}/get-involved)

## Data
- [Tournaments as JSON](${BASE_URL}/api/tournaments): open API, add ?when=past, ?country=XX, ?limit=N
- [Calendar feed (iCal)](${BASE_URL}/calendar.ics)
- [Blog RSS](${BASE_URL}/blog/feed.xml)
- [Sitemap](${BASE_URL}/sitemap.xml)

## Notes
- Information is gathered from organisers' announcements and from Kayakers.nl (used with permission). Always check the organiser's own page for final details.
- Please link back to canoepolo.eu when you use this information. See ${BASE_URL}/agents.txt for rules for automated agents.
`));
app.get('/agents.txt', textFile(`# agents.txt for canoepolo.eu: how automated agents and AI assistants may use this site

Site: ${BASE_URL}
Summary: ${BASE_URL}/llms.txt

Allowed
- Read and summarise public pages, the sitemap, the JSON API (/api/tournaments) and the RSS and iCal feeds.
- Quote short extracts with a link back to the page.

Not allowed
- The admin area (/admin), logging in or trying to guess passwords.
- Submitting forms or the referee quiz, or posting to the leaderboard.
- Collecting personal data, for example names on the quiz leaderboard.
- Buying, booking or registering for tournaments on someone's behalf without the person confirming each step with the organiser.

Rate limits
- Be gentle: no more than about 1 request per second. Over the limit the site answers 429 with a Retry-After header, so back off when you see it.
- Use the JSON API or the sitemap rather than crawling every page.
- Cache what you fetch. Pages send ETag headers, so use conditional requests.

Accuracy
- Tournament details can change. Tell people to confirm dates and entry with the organiser (link on each tournament page).

Contact
- WhatsApp +353 87 678 9927 (see ${BASE_URL}/about)
`));

app.get('/sitemap.xml', (req, res) => {
  const all = [...T.listPublic({ when: 'upcoming', limit: 500 }), ...T.listPublic({ when: 'past', limit: 500 })];
  const urls = [`${BASE_URL}/`, `${BASE_URL}/tournaments`, `${BASE_URL}/tournaments/calendar`, `${BASE_URL}/tournaments/map`, `${BASE_URL}/past`, `${BASE_URL}/blog`, `${BASE_URL}/watch`, `${BASE_URL}/learn`, `${BASE_URL}/referee`, `${BASE_URL}/referee/quiz`, `${BASE_URL}/referee/leaderboard`, `${BASE_URL}/get-involved`, `${BASE_URL}/tactics`, `${BASE_URL}/rules`, `${BASE_URL}/shop`, `${BASE_URL}/support`, `${BASE_URL}/about`, `${BASE_URL}/privacy`, `${BASE_URL}/terms`, ...all.map((t) => `${BASE_URL}/tournaments/${t.slug}`), ...B.listPublic().map((p) => `${BASE_URL}/blog/${p.slug}`)];
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

// Admin check of the live-score reader: /admin/live-check?id=1 shows what the server reads from the official match page
app.get('/admin/live-check', requireAdmin, async (req, res) => {
  const id = Number(req.query.id) || 1;
  try {
    const html = await live.fetchPage(`https://ecc2026milano.it/en/partite/view?id=${id}`);
    const p = live.parse(html);
    res.type('text/plain').send(`id ${id}\nparsed: ${JSON.stringify(p.result)}\ngoals/cards found: ${JSON.stringify(p.events)}\nstart of page text:\n${p.debug}`);
  } catch (e) { res.type('text/plain').send(`id ${id}\nCould not read the page: ${e.message}`); }
});
// Admin: which games the official site has moved or changed compared with our timetable
app.get('/admin/live-changes', requireAdmin, (req, res) => {
  const c = live.changes();
  const lines = Object.entries(c).map(([k, v]) => `${k}: official site says ${v.time ? 'time ' + v.time : ''} ${v.pitch ? 'pitch ' + v.pitch : ''}`.replace(/\s+/g, ' ').trim());
  res.type('text/plain').send(`Games checked: ${live.meta.size}\n` + (lines.length ? lines.join('\n') : 'No differences from our timetable.'));
});
app.get('/admin/stats', requireAdmin, (req, res) => {
  const days = [7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const r = stats.report(days);
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  res.render('admin/stats', { title: 'Statistics', days, r, regionName: (c) => { try { return names.of(c) || c; } catch (e) { return c; } }, max: Math.max(1, ...r.series.map((d) => d.views)) });
});

app.get('/admin/leaderboard', requireAdmin, (req, res) => {
  res.render('admin/leaderboard', { title: 'Quiz leaderboard', rows: LB.recent(300), msg: req.query.msg || '' });
});
app.post('/admin/leaderboard/delete/:id', requireAdmin, checkCsrf, (req, res) => {
  LB.remove(Number(req.params.id));
  res.redirect('/admin/leaderboard?msg=Entry+removed');
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

// ---------- Admin: blog ----------
app.get('/admin/blog', requireAdmin, (req, res) => res.render('admin/blog', { title: 'Blog', posts: B.all(), today: new Date().toISOString().slice(0, 10), msg: req.query.msg || '' }));
app.get('/admin/blog/new', requireAdmin, (req, res) => res.render('admin/blog-form', { title: 'New post', p: { published: 0, published_at: new Date().toISOString().slice(0, 10) }, errors: [], action: '/admin/blog/new' }));
app.get('/admin/blog/edit/:id', requireAdmin, (req, res) => {
  const p = B.getById(Number(req.params.id));
  if (!p) return res.status(404).render('404', { title: 'Not found' });
  res.render('admin/blog-form', { title: `Edit: ${p.title}`, p, errors: [], action: `/admin/blog/edit/${p.id}` });
});
app.post(['/admin/blog/new', '/admin/blog/edit/:id'], requireAdmin, checkCsrf, (req, res) => {
  const id = req.params.id ? Number(req.params.id) : 0;
  if (id && !B.getById(id)) return res.status(404).render('404', { title: 'Not found' });
  const { data, errors } = B.validate(req.body, id);
  if (errors.length) return res.status(400).render('admin/blog-form', { title: id ? 'Edit post' : 'New post', p: data, errors, action: req.originalUrl });
  const p = B.save(id, data);
  res.redirect(`/admin/blog?msg=${encodeURIComponent(`Saved “${p.title}”`)}`);
});
app.post('/admin/blog/delete/:id', requireAdmin, checkCsrf, (req, res) => {
  const p = B.getById(Number(req.params.id));
  if (p) B.remove(p.id);
  res.redirect(`/admin/blog?msg=${encodeURIComponent(p ? `Deleted “${p.title}”` : 'Nothing to delete')}`);
});

// ---------- Errors ----------
app.use((req, res) => res.status(404).render('404', { title: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Please try again.');
});

if (require.main === module) {
  app.listen(PORT, () => { console.log(`canoepolo.eu running on ${BASE_URL} (port ${PORT})`); live.start(); sms.startTimer(); sms.cleanup(); });
}
module.exports = app;
