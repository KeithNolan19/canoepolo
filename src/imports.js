// One-time tournament imports. Each batch runs once on the server (recorded in the `imports` table),
// skips tournaments already on the calendar (same name and start date), and is never re-applied,
// so deleting an imported tournament in the admin panel is permanent.
const db = require('./db');
const T = require('./tournaments');

const BATCHES = [
  {
    id: '2027-worldwide-2026-10-01',
    tournaments: [
      {
        name: 'European Canoe Polo Championships 2027',
        start_date: '2027-09-22', end_date: '2027-09-26',
        city: 'Thury-Harcourt', country: 'FR',
        level: 'Continental Championships',
        description: 'The Paddle Europe championships for national teams, returning to Thury-Harcourt in Normandy.\n\nDates as announced by the Dutch canoe polo federation after the 2026 Paddle Europe Cup in Thury-Harcourt; France Bleu / ICI Normandie also reported the town will host the 2027 championships. Check with Paddle Europe for the final programme.',
        source_url: 'https://www.kanopolo.nl/verslag-peu-european-cup-i/',
        website_url: 'https://www.canoe-europe.org/',
      },
      {
        name: 'World Masters Games 2027: Canoe Polo',
        start_date: '2027-05-21', end_date: '2027-05-23',
        city: 'Awara', country: 'JP',
        venue: 'Kitakata Lake canoe polo venue, Fukui Prefecture',
        level: 'International',
        divisions: ['Masters', 'Men', 'Women', 'Mixed'],
        description: 'Canoe polo at the World Masters Games 2027 Kansai. Open to players aged 30 and over (age on 31 December 2027).\n\nCategories: men 30+ and 45+, women 30+, mixed 30+ and 45+. Accreditation at the venue on 20 May and the morning of 21 May.',
        source_url: 'https://wmg2027.jp/competition/canoe-polo/',
        website_url: 'https://wmg2027.jp/competition/canoe-polo/',
      },
      {
        name: 'Australian Canoe Polo Championships 2027',
        start_date: '2027-03-26', end_date: '2027-03-29',
        city: 'Oxenford', country: 'AU',
        level: 'National Championships',
        description: 'Paddle Australia\'s national canoe polo championships, on the 2026/27 national events calendar.',
        source_url: 'https://paddle.org.au/2026/07/16/paddle-australia-unveils-2026-27-national-events-calendar/',
        website_url: 'https://paddle.org.au/paddlesports/canoe-polo/',
      },
      {
        name: 'Queensland State Canoe Polo Championships 2027 (PQ Paddlefest)',
        start_date: '2027-05-01', end_date: '2027-05-09',
        city: 'Oxenford', country: 'AU',
        venue: 'SYC Oxenford Watersports Centre',
        level: 'National League',
        description: 'The Queensland state canoe polo championships are part of PQ Paddlefest, a nine-day festival that also includes marathon, ocean racing and SUP state championships. The dates shown are for the whole festival; the canoe polo days will be confirmed by Paddle Queensland.',
        source_url: 'https://paddleqld.asn.au/events-polo/',
      },
      {
        name: 'Atahua Cup 2027',
        start_date: '2027-01-30', end_date: '2027-01-31',
        city: 'Palmerston North', country: 'NZ',
        venue: 'Hokowhitu Lagoon',
        level: 'Club / Friendly',
        source_url: 'https://www.nzcanoepolo.org.nz/events-1',
      },
      {
        name: 'Art Deco Championship 2027',
        start_date: '2027-02-13', end_date: '2027-02-14',
        city: 'Hastings', country: 'NZ',
        venue: 'Mitre 10 Sports Park',
        level: 'Club / Friendly',
        source_url: 'https://www.nzcanoepolo.org.nz/events-1',
      },
      {
        name: 'New Zealand Senior School Canoe Polo Nationals 2027',
        start_date: '2027-03-12', end_date: '2027-03-14',
        city: 'Hastings', country: 'NZ',
        venue: 'Mitre 10 Sports Park, Hawke\'s Bay',
        level: 'National Championships',
        divisions: ['U18'],
        source_url: 'https://www.nzcanoepolo.org.nz/events-1',
      },
    ],
  },
];

function run() {
  const done = new Set(db.prepare('SELECT id FROM imports').all().map((r) => r.id));
  const exists = db.prepare('SELECT id FROM tournaments WHERE lower(name) = lower(?) AND start_date = ?');
  for (const batch of BATCHES) {
    if (done.has(batch.id)) continue;
    let added = 0;
    db.transaction(() => {
      for (const t of batch.tournaments) {
        if (exists.get(t.name, t.start_date)) continue;
        const { data, errors } = T.validate({ status: 'published', ...t });
        if (errors.length) { console.warn(`Import ${batch.id}: skipped "${t.name}": ${errors.join(' ')}`); continue; }
        T.create(data);
        added += 1;
      }
      db.prepare('INSERT INTO imports (id) VALUES (?)').run(batch.id);
    })();
    console.log(`Import ${batch.id}: added ${added} tournament(s).`);
  }
}

module.exports = { run };
