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

BATCHES.push({
  id: 'late-2026-worldwide-2026-10-01',
  tournaments: [
    {
      name: 'Paddle Europe Canoe Polo Club Championships 2026',
      start_date: '2026-10-02', end_date: '2026-10-04',
      city: 'Milan', country: 'IT',
      level: 'Continental Championships',
      description: 'The European Club Championships: the top clubs from each European country\'s national championships play for the continental club title.',
      source_url: 'https://paddleworldwide.com/competitions/2026-paddle-europe-canoe-polo-club-championships-2856',
      website_url: 'https://paddleworldwide.com/competitions/2026-paddle-europe-canoe-polo-club-championships-2856',
    },
    {
      name: 'Pylkwier 2026',
      start_date: '2026-10-03', end_date: '2026-10-04',
      city: 'Leeuwarden', country: 'NL',
      level: 'Club / Friendly',
      divisions: ['Open', 'U18'],
      description: 'Club tournament in Friesland with first, second and third division classes and a youth class.',
      source_url: 'https://www.kanopolo.nl/breedtesport/toernooien/',
    },
  ],
});


BATCHES.push({
  id: 'germany-autumn-2026-10-01',
  tournaments: [
    {
      name: 'Bundesländervergleichskampf 2026',
      start_date: '2026-10-03', end_date: '2026-10-04',
      city: 'Ennepetal', country: 'DE',
      venue: 'Wupper, Ackersiepen 98B',
      level: 'National Championships',
      description: 'Annual German inter-state canoe polo competition, where teams from the German regional canoe associations play each other.',
      source_url: 'https://vkb-ev.de/calendar/kanupolo/',
    },
  ],
});

// Updates to tournaments that are already listed. Each runs once and merges its fields into the matching
// tournament (same name and start date), so later edits in the admin panel are never overwritten again.
const PATCHES = [

  {
    id: 'milan-ecc-2026-bulletin-1',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: {
      venue: 'Idroscalo Club, Circonvallazione Idroscalo 29, 20054 Segrate (MI)',
      entry_fee: 'EUR 300 per team',
      registration_deadline: '2026-09-21',
      contact_name: 'Idroscalo Club (organising committee)',
      contact_email: 'idroscalogare@gmail.com',
      website_url: 'https://www.idroscaloclubasd.it',
      documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf',
      description: [
        'The 2026 Paddle Europe Canoe Polo Club Championships are hosted by the Italian Canoe Kayak Federation (FICK), the City of Milan and Idroscalo Club at Idroscalo, the "Sea of Milan", next to Linate Airport. They are played under the Paddle Europe and ICF canoe polo competition rules.',
        'Programme (provisional)\nThu 1 Oct: accreditation, equipment control, team leaders\' meeting and ITO meeting\nFri 2 Oct: accreditation, equipment control, team meetings and competition day 1\nSat 3 Oct: competition day 2\nSun 4 Oct: competition day 3 and medal ceremony',
        'Key dates\n21 Sep: final nominal entries (player lists confirmed by National Federations)\n22 Sep: entries confirmed by the Organising Committee\n25 Sep: payment, catering and camping booking deadline\n29 Sep: provisional timetable issued to teams',
        'Entry fee: EUR 300 per team, non-refundable once paid. Payment details are in Bulletin 1.',
        'Getting there\nMilan Linate Airport: 3 km, about 10 minutes. Bergamo Orio al Serio: 50 km. Milan Malpensa: 66 km.\nOrganised transfers can be booked by email (space for boats must be requested): Linate EUR 5, Bergamo EUR 20 (minimum 6 people), Malpensa EUR 25 (minimum 6 people), per person one way.',
        'Staying there\nTeams book their own hotels. Nearby options include Hotel Riviera (1.6 km), Belstay Milano Linate, Moxy Milan Linate, Fasthotel Linate, Best Western Air Hotel Linate and Hotel Montini Linate Airport.\nLunch and dinner can be booked at EUR 15 per meal per person (tell the organisers about allergies when booking). Camping is available at the venue with toilets and showers, EUR 20 per person per day.',
        'The organisers may update the timetable and arrangements and will tell teams directly. Contact: idroscalogare@gmail.com. Official information: paddle-europe.eu',
      ].join('\n\n'),
    },
  },
  {
    id: 'milan-ecc-2026-friday-timetable',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nFriday timetable | /docs/milan-ecc-2026-friday-timetable.pdf' },
  },  {
    id: 'milan-ecc-2026-groups',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nFriday timetable | /docs/milan-ecc-2026-friday-timetable.pdf' },
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
  const find = db.prepare('SELECT * FROM tournaments WHERE lower(name) = lower(?) AND start_date = ?');
  for (const patch of PATCHES) {
    if (done.has(patch.id)) continue;
    const row = find.get(patch.match.name, patch.match.start_date);
    if (!row) continue; // not listed (e.g. deleted), nothing to update
    const cur = T.getById(row.id);
    const { data, errors } = T.validate({ ...cur, documents_text: (cur.documents || []).map((d) => `${d.label} | ${d.url}`).join('\n'), ...patch.set });
    if (errors.length) { console.warn(`Patch ${patch.id}: ${errors.join(' ')}`); continue; }
    T.update(row.id, data);
    db.prepare('INSERT INTO imports (id) VALUES (?)').run(patch.id);
    console.log(`Patch ${patch.id}: updated "${cur.name}".`);
  }
}

module.exports = { run };
