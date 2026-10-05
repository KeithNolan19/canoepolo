// All database queries and validation for tournaments live here.
const db = require('./db');
const { COUNTRIES, LEVELS, DIVISIONS, STATUSES } = require('./constants');

const today = () => new Date().toISOString().slice(0, 10);

function slugify(text) {
  return String(text)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'tournament';
}

function uniqueSlug(base, excludeId = 0) {
  let slug = base;
  let n = 2;
  const stmt = db.prepare('SELECT id FROM tournaments WHERE slug = ? AND id != ?');
  while (stmt.get(slug, excludeId)) slug = `${base}-${n++}`;
  return slug;
}

function parseDocs(json) {
  try { const a = JSON.parse(json || '[]'); return Array.isArray(a) ? a.filter((d) => d && d.label && d.url) : []; } catch { return []; }
}

function parseTeams(json) {
  try { const a = JSON.parse(json || '[]'); return Array.isArray(a) ? a.filter((x) => x && x.name) : []; } catch { return []; }
}
// One team per line: "Name | CC" (CC is the two letter country code and is optional). "To be confirmed" marks an open place.
function parseTeamsText(text) {
  const teams = []; const errors = [];
  String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const i = line.lastIndexOf('|');
    const name = (i < 0 ? line : line.slice(0, i)).trim().slice(0, 60);
    const cc = i < 0 ? '' : line.slice(i + 1).trim().toUpperCase();
    if (!name) return;
    if (cc && !/^[A-Z]{2}$/.test(cc)) errors.push(`Team line "${line.slice(0, 40)}": use a two letter country code after the | (for example PT).`);
    else teams.push(cc ? { name, country: cc } : { name });
  });
  if (teams.length > 80) errors.push('Too many teams (max 80).');
  return { teams, errors };
}

function decorate(t) {
  if (!t) return t;
  return {
    ...t,
    documents: parseDocs(t.documents),
    teams: parseTeams(t.teams),
    featured: !!t.featured,
    date_tbc: !!t.date_tbc,
    divisions: t.divisions ? t.divisions.split(',').filter(Boolean) : [],
    country_name: COUNTRIES[t.country] || t.country,
  };
}

// ---------- Public queries ----------

function listPublic({ country, level, division, q, month, when = 'upcoming', limit = 200 } = {}) {
  const where = ["status IN ('published','cancelled')"];
  const params = {};
  if (when === 'past') {
    where.push('end_date < @today');
  } else {
    where.push('end_date >= @today');
  }
  params.today = today();
  if (country) { where.push('country = @country'); params.country = country; }
  if (level) { where.push('level = @level'); params.level = level; }
  if (division) { where.push("(',' || divisions || ',') LIKE @division"); params.division = `%,${division},%`; }
  if (month && /^\d{4}-\d{2}$/.test(month)) { where.push("substr(start_date,1,7) <= @month AND substr(end_date,1,7) >= @month"); params.month = month; }
  if (q) {
    where.push('(name LIKE @q OR city LIKE @q OR venue LIKE @q OR description LIKE @q)');
    params.q = `%${q}%`;
  }
  const order = when === 'past' ? 'start_date DESC' : 'featured DESC, start_date ASC';
  params.limit = Math.min(Number(limit) || 200, 500);
  const rows = db.prepare(`SELECT * FROM tournaments WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT @limit`).all(params);
  return rows.map(decorate);
}

// Everything (past or future) that overlaps a date range, for the calendar view
function listBetween(from, to, { country, level, division, q } = {}) {
  const where = ["status IN ('published','cancelled')", 'start_date <= @to', 'end_date >= @from'];
  const params = { from, to };
  if (country) { where.push('country = @country'); params.country = country; }
  if (level) { where.push('level = @level'); params.level = level; }
  if (division) { where.push("(',' || divisions || ',') LIKE @division"); params.division = `%,${division},%`; }
  if (q) { where.push('(name LIKE @q OR city LIKE @q OR venue LIKE @q OR description LIKE @q)'); params.q = `%${q}%`; }
  return db.prepare(`SELECT * FROM tournaments WHERE ${where.join(' AND ')} ORDER BY start_date ASC, end_date DESC`).all(params).map(decorate);
}

function countriesInUse() {
  return db.prepare(`SELECT DISTINCT country FROM tournaments WHERE status != 'draft' ORDER BY country`).all().map((r) => r.country);
}

function getBySlug(slug, { includeDrafts = false } = {}) {
  const t = db.prepare('SELECT * FROM tournaments WHERE slug = ?').get(slug);
  if (!t || (!includeDrafts && t.status === 'draft')) return null;
  return decorate(t);
}

// ---------- Admin queries ----------

function listAll() {
  return db.prepare('SELECT * FROM tournaments ORDER BY start_date DESC').all().map(decorate);
}

function getById(id) {
  return decorate(db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id));
}

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const isUrl = (s) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
// One document per line: "Label | https://link" (links on this site may start with /)
function parseDocsText(text) {
  const docs = []; const errors = [];
  String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const i = line.indexOf('|');
    const label = i < 0 ? '' : line.slice(0, i).trim();
    const url = i < 0 ? '' : line.slice(i + 1).trim();
    if (!label || !(isUrl(url) || /^\/[A-Za-z0-9._\/-]+$/.test(url))) errors.push(`Document line "${line.slice(0, 40)}" should look like: Timetable | https://...`);
    else docs.push({ label: label.slice(0, 60), url });
  });
  return { docs, errors };
}
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Takes raw form input, returns { data, errors }
function validate(input) {
  const s = (k) => (typeof input[k] === 'string' ? input[k].trim() : '');
  let divisions = input.divisions || [];
  if (!Array.isArray(divisions)) divisions = [divisions];
  divisions = divisions.filter((d) => DIVISIONS.includes(d));

  const data = {
    name: s('name'),
    start_date: s('start_date'),
    end_date: s('end_date') || s('start_date'),
    city: s('city'),
    country: s('country').toUpperCase(),
    venue: s('venue') || null,
    level: s('level') || 'International',
    divisions: divisions.join(','),
    description: s('description') || null,
    website_url: s('website_url') || null,
    registration_url: s('registration_url') || null,
    source_url: s('source_url') || null,
    registration_deadline: s('registration_deadline') || null,
    entry_fee: s('entry_fee') || null,
    contact_name: s('contact_name') || null,
    contact_email: s('contact_email') || null,
    status: s('status') || 'published',
    featured: input.featured ? 1 : 0,
    date_tbc: input.date_tbc ? 1 : 0,
    lat: num(input.lat),
    lng: num(input.lng),
  };

  const errors = [];
  const dd = parseDocsText(input.documents_text);
  errors.push(...dd.errors);
  data.documents = dd.docs.length ? JSON.stringify(dd.docs) : null;
  const tt = parseTeamsText(input.teams_text);
  errors.push(...tt.errors);
  data.teams = tt.teams.length ? JSON.stringify(tt.teams) : null;
  if (!data.name) errors.push('Name is required.');
  if (data.name.length > 150) errors.push('Name is too long (max 150 characters).');
  if (!isDate(data.start_date)) errors.push('Start date is required (YYYY-MM-DD).');
  if (!isDate(data.end_date)) errors.push('End date must be a valid date.');
  if (isDate(data.start_date) && isDate(data.end_date) && data.end_date < data.start_date) errors.push('End date cannot be before start date.');
  if (!data.city) errors.push('City is required.');
  if (!COUNTRIES[data.country]) errors.push('Please choose a country.');
  if (!LEVELS.includes(data.level)) errors.push('Please choose a valid level.');
  if (!STATUSES.includes(data.status)) errors.push('Invalid status.');
  if ((data.lat === null) !== (data.lng === null)) errors.push('Enter both latitude and longitude for the map pin, or leave both empty.');
  if (data.lat !== null && (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180)) errors.push('Map position is out of range (latitude -90 to 90, longitude -180 to 180).');
  if (data.website_url && !isUrl(data.website_url)) errors.push('Website must be a full link starting with https://');
  if (data.registration_url && !isUrl(data.registration_url)) errors.push('Registration link must start with https://');
  if (data.source_url && !isUrl(data.source_url)) errors.push('Source must be a full link starting with https://');
  if (data.registration_deadline && !isDate(data.registration_deadline)) errors.push('Registration deadline must be a valid date.');
  if (data.contact_email && !isEmail(data.contact_email)) errors.push('Contact email looks wrong.');
  if (data.description && data.description.length > 10000) errors.push('Description is too long.');
  return { data, errors };
}

function num(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function create(data) {
  const year = data.start_date.slice(0, 4);
  const slug = uniqueSlug(slugify(data.name.includes(year) ? data.name : `${data.name}-${year}`));
  const info = db.prepare(`
    INSERT INTO tournaments (slug, name, start_date, end_date, city, country, venue, level, divisions, description,
      website_url, registration_url, source_url, documents, teams, registration_deadline, entry_fee, contact_name, contact_email, status, featured, lat, lng, date_tbc)
    VALUES (@slug, @name, @start_date, @end_date, @city, @country, @venue, @level, @divisions, @description,
      @website_url, @registration_url, @source_url, @documents, @teams, @registration_deadline, @entry_fee, @contact_name, @contact_email, @status, @featured, @lat, @lng, @date_tbc)
  `).run({ lat: null, lng: null, teams: null, date_tbc: 0, ...data, slug });
  return getById(info.lastInsertRowid);
}

function update(id, data) {
  db.prepare(`
    UPDATE tournaments SET name=@name, start_date=@start_date, end_date=@end_date, city=@city, country=@country,
      venue=@venue, level=@level, divisions=@divisions, description=@description, website_url=@website_url,
      registration_url=@registration_url, source_url=@source_url, documents=@documents, teams=@teams, registration_deadline=@registration_deadline, entry_fee=@entry_fee,
      contact_name=@contact_name, contact_email=@contact_email, status=@status, featured=@featured, lat=@lat, lng=@lng, date_tbc=@date_tbc,
      updated_at=datetime('now')
    WHERE id=@id
  `).run({ lat: null, lng: null, teams: null, date_tbc: 0, ...data, id });
  return getById(id);
}

function remove(id) {
  return db.prepare('DELETE FROM tournaments WHERE id = ?').run(id).changes > 0;
}

module.exports = { listPublic, listBetween, countriesInUse, getBySlug, listAll, getById, validate, create, update, remove, today };
