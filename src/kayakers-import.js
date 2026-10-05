// Adds upcoming and current tournaments from the Kayakers.nl list (read with the maintainer's permission) to our own tournament list.
// Only public event facts are used (name, dates, venue town and country, divisions, registration window, link to their page). No contact details.
// A tournament we already list, or one an admin has edited, is never overwritten.
const db = require('./db');
const T = require('./tournaments');
const { COUNTRIES, DIVISIONS } = require('./constants');

db.exec(`CREATE TABLE IF NOT EXISTS kayakers_imported (event_id TEXT PRIMARY KEY, tournament_id INTEGER NOT NULL, synced_at TEXT NOT NULL)`);

const words = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !/^(canoe|polo|tournament|cup|open|championship|championships|league)$/.test(w));
const dayDiff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 864e5;

function levelFor(name) {
  if (/championship/i.test(name)) return 'National Championships';
  if (/league/i.test(name)) return 'National League';
  return 'Club / Friendly';
}
function divisionsFor(divs) {
  const out = new Set();
  (divs || []).forEach((d) => {
    const n = String(d.Name || '');
    if (/women|ladies|dames|damen|female/i.test(n)) out.add('Women');
    else if (/u ?21/i.test(n)) out.add('U21 Men');
    else if (/u ?18|junior/i.test(n)) out.add('U18');
    else if (/u ?16/i.test(n)) out.add('U16');
    else if (/mixed/i.test(n)) out.add('Mixed');
    else if (/master|vet/i.test(n)) out.add('Masters');
    else if (/men|herren|heren|division|league|a team|b team/i.test(n)) out.add('Men');
    else out.add('Open');
  });
  return [...out].filter((x) => DIVISIONS.includes(x)).join(',') || 'Open';
}

function importList(list) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id, name, start_date, end_date, country, source_url, website_url FROM tournaments').all();
  let added = 0, updated = 0;
  for (const t of list || []) {
    try {
      const page = String(t.EventPage || '');
      const slug = (page.match(/\/View\/([\w-]+)$/) || [])[1];
      const v = (t.Venues || [])[0];
      const dates = [].concat(...(t.Venues || []).map((x) => x.Dates || [])).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
      if (!slug || !v || !dates.length || dates[dates.length - 1] < today) continue; // upcoming and current only
      const country = v.CountryShort;
      if (!COUNTRIES[country]) continue;
      const name = String(t.Name || '').trim().slice(0, 120);
      if (!name) continue;
      const start = dates[0], end = dates[dates.length - 1];
      const city = String(v.City || '').trim().slice(0, 60) || 'To be confirmed';
      const data = {
        name, start_date: start, end_date: end, city, country, venue: String(v.Address || '').trim().slice(0, 120) || null,
        level: levelFor(name), divisions: divisionsFor(t.Divisions),
        description: 'Listed from Kayakers.nl. Entries, teams, schedule and results are on the tournament page there.',
        website_url: page, registration_url: t.RegistrationOpen ? page : null, source_url: page,
        registration_deadline: t.RegistrationUntil && /^\d{4}-\d{2}-\d{2}$/.test(t.RegistrationUntil) ? t.RegistrationUntil : null,
        entry_fee: null, contact_name: null, contact_email: null, status: 'published', featured: 0, documents: null,
      };
      const imp = db.prepare('SELECT * FROM kayakers_imported WHERE event_id = ?').get(t.Id);
      if (imp) {
        const row = db.prepare('SELECT updated_at FROM tournaments WHERE id = ?').get(imp.tournament_id);
        if (!row || row.updated_at !== imp.synced_at) continue; // removed, or edited by an admin: leave it alone
        const cur = T.getById(imp.tournament_id);
        if (cur.start_date === start && cur.end_date === end && cur.name === name && cur.city === city) continue;
        const u = T.update(imp.tournament_id, { ...data, teams: null, lat: cur.lat, lng: cur.lng });
        db.prepare('UPDATE kayakers_imported SET synced_at = ? WHERE event_id = ?').run(u.updated_at, t.Id);
        updated++; continue;
      }
      // already listed by us?
      const w = words(name);
      const dup = existing.some((e) => (e.source_url || '').includes('/View/' + slug) || (e.website_url || '').includes('/View/' + slug)
        || (e.country === country && dayDiff(e.start_date, start) <= 1 && words(e.name).some((x) => w.some((y) => x.startsWith(y) || y.startsWith(x)))));
      if (dup) continue;
      const c = T.create(data);
      db.prepare('INSERT INTO kayakers_imported (event_id, tournament_id, synced_at) VALUES (?, ?, ?)').run(t.Id, c.id, c.updated_at);
      existing.push({ id: c.id, name, start_date: start, end_date: end, country, source_url: page, website_url: page });
      added++;
    } catch (e) { /* skip this one event */ }
  }
  return { added, updated };
}
module.exports = { importList };
