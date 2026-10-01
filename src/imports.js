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

// Listings from the Kayakers.nl canoe polo tournament calendar (used with the site owner's permission).
BATCHES.push({
  id: 'kayakers-oct-2026-10-01',
  tournaments: [
    {
      name: '60 Jahre KVK Jubi-Cup',
      start_date: '2026-10-03', end_date: '2026-10-03',
      city: 'Kiel', country: 'DE',
      venue: 'Düsternbrooker Weg 44',
      level: 'Club / Friendly',
      divisions: ['Mixed'],
      description: 'One-day mixed club tournament in Kiel for the 60th anniversary of the club (KVK).',
      contact_name: 'KVK Kiel (organiser)',
      contact_email: 'sportwart@kv-kiel.de',
      source_url: 'https://cpt.kayakers.nl/View/kvkjubicup60',
    },
    {
      name: 'Oktoberfestturnier 2026',
      start_date: '2026-10-03', end_date: '2026-10-04',
      city: 'Oberschleißheim', country: 'DE',
      venue: 'Olympia-Regattastrecke, Dachauer Straße 35',
      level: 'Club / Friendly',
      divisions: ['Mixed'],
      entry_fee: 'EUR 130 per team',
      registration_deadline: '2026-09-26',
      description: 'Mixed canoe polo tournament near Munich, played to the current DKV rules on a pitch without timeouts after goals. Organised by Schleißheimer Paddelclub e.V. in cooperation with Kanu-Regattaverein München; a dragon boat championship takes place at the same venue.\n\nCamping is available at the regatta course for EUR 15 per person. The organisers may cancel if too few teams register or the weather is unfavourable.',
      contact_name: 'Schleißheimer Paddelclub e.V.',
      contact_email: 'kanupolo@schleissheimer-paddelclub.de',
      source_url: 'https://cpt.kayakers.nl/View/oktoberfestturnier2026',
    },
    {
      name: 'NorthWest & Central Regional League 2026/2027, weekend 1',
      start_date: '2026-10-03', end_date: '2026-10-04',
      city: 'North West and Central England', country: 'GB',
      venue: 'Shiers Drive',
      level: 'National League',
      divisions: ['Open', 'Women'],
      entry_fee: 'GBP 160 to 320 per team, depending on division',
      registration_deadline: '2026-10-02',
      description: 'Opening weekend of the 2026/27 North West and Central regional league: Divisions 1 to 4 and a women\'s division. The second weekend is on 20-21 March 2027. Organiser: Mike Fletcher. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/deb94838-aa30-4c5b-83d4-075571cba873',
    },
    {
      name: 'NorthWest & Central Regional League 2026/2027, weekend 2',
      start_date: '2027-03-20', end_date: '2027-03-21',
      city: 'North West and Central England', country: 'GB',
      venue: 'Shiers Drive',
      level: 'National League',
      divisions: ['Open', 'Women'],
      description: 'Final weekend of the 2026/27 North West and Central regional league. The opening weekend is on 3-4 October 2026. Organiser: Mike Fletcher. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/deb94838-aa30-4c5b-83d4-075571cba873',
    },
    {
      name: 'Yorkshire Division 2, round 1 of 6',
      start_date: '2026-10-17', end_date: '2026-10-17',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 1 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 2 of 6',
      start_date: '2026-11-14', end_date: '2026-11-14',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 2 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 3 of 6',
      start_date: '2026-12-05', end_date: '2026-12-05',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 3 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 4 of 6',
      start_date: '2027-01-23', end_date: '2027-01-23',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 4 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 5 of 6',
      start_date: '2027-02-06', end_date: '2027-02-06',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 5 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 6 of 6',
      start_date: '2027-03-20', end_date: '2027-03-20',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 6 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 3, round 1 of 4',
      start_date: '2026-11-21', end_date: '2026-11-21',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 1 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 2 of 4',
      start_date: '2026-12-12', end_date: '2026-12-12',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 2 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 3 of 4',
      start_date: '2027-02-13', end_date: '2027-02-13',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 3 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 4 of 4',
      start_date: '2027-03-13', end_date: '2027-03-13',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 4 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Women, round 1 of 2',
      start_date: '2026-10-31', end_date: '2026-10-31',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Women'],
      description: 'Round 1 of 2 in the Yorkshire Women regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshirew',
    },
    {
      name: 'Yorkshire Women, round 2 of 2',
      start_date: '2027-02-27', end_date: '2027-02-27',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Women'],
      description: 'Round 2 of 2 in the Yorkshire Women regional league (Yorkshire and Humber). Organiser: Paul Elliott. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshirew',
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
  {
    id: 'pylkwier-2026-details',
    match: { name: 'Pylkwier 2026', start_date: '2026-10-03' },
    set: {
      start_date: '2026-10-03', end_date: '2026-10-03',
      venue: 'Avondsterweg 15',
      entry_fee: 'EUR 75 (1st, 2nd and 3rd class), EUR 65 (youth)',
      registration_deadline: '2026-09-20',
      contact_name: 'Kanovereniging De Hydronauten',
      contact_email: 'pylkwier@kvhydronauten.nl',
      source_url: 'https://cpt.kayakers.nl/View/20pylkwier26',
      description: 'The season finale in Leeuwarden, known as "the legendary season finale". Teams from all classes are welcome (men\'s 4th, 3rd and 2nd class, and youth), and individual players can register too.\n\nCamping on site from Friday 2 October. Payment is by bank transfer to the organising club with the reference "Pylkwier 2026" and your team name.',
    },
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
