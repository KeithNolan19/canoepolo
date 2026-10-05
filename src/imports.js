// One-time tournament imports. Each batch runs once on the server (recorded in the `imports` table),
// skips tournaments already on the calendar (same name and start date), and is never re-applied,
// so deleting an imported tournament in the admin panel is permanent.
const db = require('./db');
const T = require('./tournaments');

const BATCHES = [
  {
    id: 'ireland-2027-tbc-2026-10-05',
    tournaments: [
      { name: 'Irish Open 2027', start_date: '2027-08-21', end_date: '2027-08-22', city: 'To be confirmed', country: 'IE', level: 'International', divisions: ['Men', 'Women'], date_tbc: 1,
        description: 'Dates and venue to be confirmed. Shown on the same weekend as the 2026 Irish Open (22 and 23 August 2026).' },
      { name: 'Galway Open 2027', start_date: '2027-06-12', end_date: '2027-06-13', city: 'Galway', country: 'IE', level: 'Club / Friendly', divisions: ['Men', 'Women'], date_tbc: 1,
        description: 'Dates to be confirmed. Shown on the same weekend as the 2026 Galway Open (13 and 14 June 2026).' },
      { name: 'Cork Open 2027', start_date: '2027-09-11', end_date: '2027-09-12', city: 'Cork', country: 'IE', level: 'Club / Friendly', divisions: ['Men', 'Women'], date_tbc: 1,
        description: 'Dates to be confirmed. Shown on the same weekend as the 2026 Cork Open (12 and 13 September 2026).' },
      { name: 'Irish Club Championships 2027', start_date: '2027-07-10', end_date: '2027-07-11', city: 'To be confirmed', country: 'IE', level: 'National Championships', divisions: ['Men', 'Women'], date_tbc: 1,
        description: 'Dates and venue to be confirmed. Shown on the same weekend as the 2026 Irish Club Championships (11 and 12 July 2026).' },
    ],
  },
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
      description: 'Opening weekend of the 2026/27 North West and Central regional league: Divisions 1 to 4 and a women\'s division. The second weekend is on 20-21 March 2027. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/deb94838-aa30-4c5b-83d4-075571cba873',
    },
    {
      name: 'NorthWest & Central Regional League 2026/2027, weekend 2',
      start_date: '2027-03-20', end_date: '2027-03-21',
      city: 'North West and Central England', country: 'GB',
      venue: 'Shiers Drive',
      level: 'National League',
      divisions: ['Open', 'Women'],
      description: 'Final weekend of the 2026/27 North West and Central regional league. The opening weekend is on 3-4 October 2026. Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/deb94838-aa30-4c5b-83d4-075571cba873',
    },
    {
      name: 'Yorkshire Division 2, round 1 of 6',
      start_date: '2026-10-17', end_date: '2026-10-17',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 1 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 2 of 6',
      start_date: '2026-11-14', end_date: '2026-11-14',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 2 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 3 of 6',
      start_date: '2026-12-05', end_date: '2026-12-05',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 3 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 4 of 6',
      start_date: '2027-01-23', end_date: '2027-01-23',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 4 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 5 of 6',
      start_date: '2027-02-06', end_date: '2027-02-06',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 5 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 2, round 6 of 6',
      start_date: '2027-03-20', end_date: '2027-03-20',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 6 of 6 in the Yorkshire Division 2 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire2',
    },
    {
      name: 'Yorkshire Division 3, round 1 of 4',
      start_date: '2026-11-21', end_date: '2026-11-21',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 1 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 2 of 4',
      start_date: '2026-12-12', end_date: '2026-12-12',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 2 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 3 of 4',
      start_date: '2027-02-13', end_date: '2027-02-13',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 3 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Division 3, round 4 of 4',
      start_date: '2027-03-13', end_date: '2027-03-13',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Open'],
      description: 'Round 4 of 4 in the Yorkshire Division 3 regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshire3',
    },
    {
      name: 'Yorkshire Women, round 1 of 2',
      start_date: '2026-10-31', end_date: '2026-10-31',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Women'],
      description: 'Round 1 of 2 in the Yorkshire Women regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshirew',
    },
    {
      name: 'Yorkshire Women, round 2 of 2',
      start_date: '2027-02-27', end_date: '2027-02-27',
      city: 'Yorkshire', country: 'GB',
      venue: 'Haley\'s Terrace',
      level: 'National League',
      divisions: ['Women'],
      description: 'Round 2 of 2 in the Yorkshire Women regional league (Yorkshire and Humber). Registration and contact details are on the source page.',
      source_url: 'https://cpt.kayakers.nl/View/2026yorkshirew',
    },
  ],
});

// Updates to tournaments that are already listed. Each runs once and merges its fields into the matching
// tournament (same name and start date), so later edits in the admin panel are never overwritten again.
// Past events (Oct 2025 - Sep 2026) from the Kayakers.nl canoe polo tournament calendar, used with the site owner's permission.
// Each entry links back to its Kayakers.nl page. No organiser contact details are copied.
BATCHES.push({
  id: 'kayakers-past-2025-26-2026-10-01',
  tournaments: [
  {
    "name": "16. Hannoverscher Schüler- und Jugendcup 2026",
    "start_date": "2026-09-26",
    "end_date": "2026-09-27",
    "city": "Hannover",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "RSV-Freibad Leinhausen, Elbestraße 39",
    "divisions": [
      "U16"
    ],
    "description": "The 16th Hannoverscher Schüler- und Jugendcup, a youth tournament for U12, U14 and U16 organised by the Lower Saxony canoe association. Camping and caravan parking on site.",
    "entry_fee": "EUR 100 per team (camping extra)",
    "source_url": "https://cpt.kayakers.nl/View/Leinhausen2026"
  },
  {
    "name": "39. Harkort-Cup 2026",
    "start_date": "2026-09-26",
    "end_date": "2026-09-27",
    "city": "Wetter (Ruhr)",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Gustav-Vorsteher-Straße",
    "divisions": [
      "Men",
      "Mixed",
      "U16"
    ],
    "description": "The 39th Harkort-Cup on three pitches. Divisions: Men, Mixed, U16, U14, U12 and a free category.",
    "source_url": "https://cpt.kayakers.nl/View/Harkortcup2026"
  },
  {
    "name": "Scottish Open 2026",
    "start_date": "2026-09-26",
    "end_date": "2026-09-27",
    "city": "Scotland",
    "country": "GB",
    "level": "International",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "Scotland's international tournament, which also serves as the Scottish Championships, on 4 pitches. Divisions: Open 1, 2 and 3 plus Women. Players must belong to a national governing body or buy day membership. Camping, food and a Saturday ceilidh.",
    "entry_fee": "GBP 140 per team, GBP 120 per international team",
    "source_url": "https://cpt.kayakers.nl/View/ScottishOpen26"
  },
  {
    "name": "Toernooi van het Oosten 2026",
    "start_date": "2026-09-26",
    "end_date": "2026-09-26",
    "city": "Leiderdorp",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Kanovereniging Rijnland, Boomgaardlaan 22",
    "description": "Toernooi van het Oosten for youth and beginners, 8 teams registered. Moved from Deventer because of low water levels, with simplified facilities (bar only, bring your own food).",
    "entry_fee": "No fee; voluntary contributions",
    "source_url": "https://cpt.kayakers.nl/View/tvho26"
  },
  {
    "name": "2026 Canoe Polo World Championships",
    "start_date": "2026-09-15",
    "end_date": "2026-09-20",
    "city": "Duisburg",
    "country": "DE",
    "level": "World Championships",
    "venue": "Kruppstraße 30B",
    "divisions": [
      "Men",
      "Women",
      "U21 Men",
      "U21 Women"
    ],
    "description": "2026 Canoe Polo World Championships on 4 pitches in the Ruhr region, organised by the NRW canoe polo commission. About 76 teams registered across Men, Women, U21 Men and U21 Women.",
    "source_url": "https://cpt.kayakers.nl/View/Worlds2026"
  },
  {
    "name": "Kanupolo Turnier Darmstadt",
    "start_date": "2026-09-12",
    "end_date": "2026-09-13",
    "city": "Darmstadt",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Lichtwiesenweg",
    "divisions": [
      "Mixed"
    ],
    "description": "Two-day Mixed division canoe polo tournament in Darmstadt on a single pitch.",
    "source_url": "https://cpt.kayakers.nl/View/afe14f29-0386-450e-80bd-d1d81f3e1313"
  },
  {
    "name": "Österreichische Staatsmeisterschaft ÖStM 2026",
    "start_date": "2026-09-12",
    "end_date": "2026-09-13",
    "city": "Natters",
    "country": "AT",
    "level": "National Championships",
    "venue": "Natterer See 1",
    "divisions": [
      "Mixed"
    ],
    "description": "Austrian Championship (ÖStM) at the Natterer See, with Mixed and Youth categories.",
    "source_url": "https://cpt.kayakers.nl/View/oestm2026"
  },
  {
    "name": "4. Wasserstadt-Cup & U12 Pokalmeisterschaft",
    "start_date": "2026-09-05",
    "end_date": "2026-09-06",
    "city": "Hannover",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "KC Limmer, Stockhardtweg 3",
    "divisions": [
      "Mixed"
    ],
    "description": "Two-day tournament on 2 pitches hosted by KC Limmer, with a Mixed division and a U12 division. The U12 competition replaces the German U12 championship at KC Limmer.",
    "source_url": "https://cpt.kayakers.nl/View/Wasserstadt2026"
  },
  {
    "name": "Nederlands kampioenschap 2026",
    "start_date": "2026-09-05",
    "end_date": "2026-09-06",
    "city": "Helmond / Deventer / Den Haag",
    "country": "NL",
    "level": "National Championships",
    "venue": "Helmond: Kanaaldijk Z.O. 50; Deventer: Gashavenstraat 9; Den Haag: Nieuweweg 75",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "The 2026 Dutch Championships in senior and youth canoe polo, played over three weekends at three venues (Helmond, Deventer and Den Haag). Divisions: Kampioensklasse, Men 1st to 4th, youth and playoff divisions.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/NK2026"
  },
  {
    "name": "Spreecup X",
    "start_date": "2026-09-05",
    "end_date": "2026-09-06",
    "city": "Berlin",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "TiB Wassersportzentrum, Bruno-Bürgel-Weg 127",
    "divisions": [
      "Mixed"
    ],
    "description": "10th Spreecup, played on two fields in a Mixed division.",
    "source_url": "https://cpt.kayakers.nl/View/spreecup-X"
  },
  {
    "name": "XXIX Mistrzostwa Polski Seniorów i VII Mistrzostwa Polski Młodzików",
    "start_date": "2026-09-05",
    "end_date": "2026-09-06",
    "city": "Kaniów",
    "country": "PL",
    "level": "National Championships",
    "venue": "Water Sports and Recreation Center, ul. Malinowa 6",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "The 29th Polish Senior Championships and 7th Polish Junior Championships on three full-size pitches. Senior Men and Women and junior boys and girls. Players need a Polish Kayak Association licence and medical clearance. Free camping.",
    "entry_fee": "400 PLN per team (senior), 300 PLN per team (junior)",
    "source_url": "https://cpt.kayakers.nl/View/MP2026"
  },
  {
    "name": "Gekko International Tournament",
    "start_date": "2026-08-29",
    "end_date": "2026-08-30",
    "city": "Gent",
    "country": "BE",
    "level": "International",
    "venue": "Yachtdreef 1a",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "Gekko International Tournament on five pitches with Women, Men 1st and Men 2nd divisions.",
    "source_url": "https://cpt.kayakers.nl/View/GIT_2026"
  },
  {
    "name": "Würzburger Poloturnier",
    "start_date": "2026-08-29",
    "end_date": "2026-08-30",
    "city": "Würzburg",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Mergentheimer Straße 13B",
    "divisions": [
      "Mixed"
    ],
    "description": "Würzburger Poloturnier, played on a single pitch in a Mixed division.",
    "source_url": "https://cpt.kayakers.nl/View/kcwue-2026"
  },
  {
    "name": "19. Vienna International Tournament",
    "start_date": "2026-08-22",
    "end_date": "2026-08-23",
    "city": "Vienna",
    "country": "AT",
    "level": "International",
    "venue": "WRV boathouse property, Florian-Berndl-Gasse 3",
    "divisions": [
      "Open"
    ],
    "description": "19th Vienna International Tournament on two pitches, with Open and Kids categories under ICF 2026 rules. Each team provides 2 referees, a timekeeper and a protocol writer. Tent camping on the boathouse grounds is available.",
    "source_url": "https://cpt.kayakers.nl/View/19vit26"
  },
  {
    "name": "NM Kristiansand 2026",
    "start_date": "2026-08-22",
    "end_date": "2026-08-23",
    "city": "Kristiansand",
    "country": "NO",
    "level": "National Championships",
    "venue": "Gillsvannet, Gillsveien 10",
    "divisions": [
      "Mixed"
    ],
    "description": "Norwegian championship event over two days on a single pitch, with a mixed club tournament and a mixed team tournament. Individual players could register and be assembled into teams by the organisers.",
    "source_url": "https://cpt.kayakers.nl/View/NM2026"
  },
  {
    "name": "Deutsche Meisterschaft 2026",
    "start_date": "2026-08-13",
    "end_date": "2026-08-16",
    "city": "Essen",
    "country": "DE",
    "level": "National Championships",
    "venue": "Freiherr-vom-Stein-Straße 206",
    "divisions": [
      "Men",
      "Women",
      "U21 Men",
      "U16"
    ],
    "description": "The 2026 German Championship on five pitches. U14, U16, U21 Men, Women's league, Men's 1st and 2nd Bundesliga and a free category, with relegation divisions. About 98 teams registered.",
    "source_url": "https://cpt.kayakers.nl/View/DM2026"
  },
  {
    "name": "The Cut 2026",
    "start_date": "2026-08-09",
    "end_date": "2026-08-09",
    "city": "London",
    "country": "GB",
    "level": "Club / Friendly",
    "venue": "Shadwell Basin",
    "divisions": [
      "Open"
    ],
    "description": "The Cut 2026, a one-day open tournament at Shadwell Basin on a single pitch. Interested teams contact the organiser.",
    "source_url": "https://cpt.kayakers.nl/View/283ca631-b15b-4ebf-969f-f68b6931bbed"
  },
  {
    "name": "Puchar Polski w Kajak Polo - finałowa edycja",
    "start_date": "2026-08-08",
    "end_date": "2026-08-09",
    "city": "Kalisz",
    "country": "PL",
    "level": "National League",
    "venue": "KTW Szale Sports Marina, Kaliska 84, Szale",
    "divisions": [
      "U18"
    ],
    "description": "Final round of the 2026 Polish Cup on three pitches at Szale Reservoir. Division I seniors, Division II U18 women and men, Division III born 2012 or younger (mixed) and a Panda Cup for born 2014 or younger. Squads of 5-8 players.",
    "entry_fee": "PLN 400 Division I; PLN 300 Division II; PLN 100 Division III; Panda Cup free",
    "source_url": "https://cpt.kayakers.nl/View/puchar-polski-final-2026"
  },
  {
    "name": "Deutsche Kanu-Polo-Ligen 2026",
    "start_date": "2026-08-07",
    "end_date": "2026-08-09",
    "city": "Essen",
    "country": "DE",
    "level": "National League",
    "venue": "Freiherr-vom-Stein-Straße 206",
    "divisions": [
      "Women"
    ],
    "description": "The German Canoe Polo Leagues 2026 on five pitches: the 2nd Women's league and the 3rd, 4th and 5th leagues, plus a free division.",
    "source_url": "https://cpt.kayakers.nl/View/Ligen2026"
  },
  {
    "name": "Pesta Sukan National Canoe Polo Championships 2026",
    "start_date": "2026-08-01",
    "end_date": "2026-08-02",
    "city": "Singapore",
    "country": "SG",
    "level": "National Championships",
    "venue": "Bedok Reservoir, Bedok Reservoir Road",
    "divisions": [
      "Men",
      "Women",
      "Open"
    ],
    "description": "Pesta Sukan National Canoe Polo Championships 2026, a round-robin event over four match days on two pitches. Men's Open (Div 1 and 2), Women's Open, Men's and Women's Inter-Tertiary, and Novice. CP1 certification required except in Novice; 47 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/NCPC26"
  },
  {
    "name": "Junior International Championship Kaniow 2026",
    "start_date": "2026-07-31",
    "end_date": "2026-08-02",
    "city": "Czechowice-Dziedzice (Kaniów)",
    "country": "PL",
    "level": "International",
    "venue": "UKS SET Kaniów, Malinowa 6",
    "divisions": [
      "U16",
      "U18",
      "U21 Men",
      "U21 Women"
    ],
    "description": "Junior International Championship at Kaniów, with age categories from U12 to U23. Held on a lake with five permanent pitches and capacity for about 75 teams. Continues the junior championships previously held in Belfast since 2017. Free camping at the venue.",
    "entry_fee": "EUR 150 per team",
    "source_url": "https://cpt.kayakers.nl/View/junior-int-2026"
  },
  {
    "name": "Pesta Sukan National Canoe Polo Championships 2026",
    "start_date": "2026-07-25",
    "end_date": "2026-07-26",
    "city": "Singapore",
    "country": "SG",
    "level": "National Championships",
    "venue": "Bedok Reservoir, Bedok Reservoir Road",
    "divisions": [
      "Men",
      "Women",
      "Open"
    ],
    "description": "Pesta Sukan National Canoe Polo Championships 2026, a round-robin event over four match days on two pitches. Men's Open (Div 1 and 2), Women's Open, Men's and Women's Inter-Tertiary, and Novice. CP1 certification required except in Novice; 47 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/NCPC26"
  },
  {
    "name": "16e Keistad Kanopolotoernooi",
    "start_date": "2026-07-04",
    "end_date": "2026-07-05",
    "city": "Amersfoort",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "De Stuw 1",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "16th Keistad canoe polo tournament on a single pitch, with Women, Men 2nd/3rd/4th division and Youth categories. Individual players may register and be formed into teams by the organisers.",
    "entry_fee": "EUR 50 per team",
    "source_url": "https://cpt.kayakers.nl/View/bd0b160c-25ea-4bbe-ab58-625d00ca20f4"
  },
  {
    "name": "8. Liblarer Kanupolo Cup",
    "start_date": "2026-07-04",
    "end_date": "2026-07-05",
    "city": "Erftstadt",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Wassersportallee 2",
    "divisions": [
      "Mixed",
      "U16"
    ],
    "description": "The 8th Liblarer Kanupolo Cup on two pitches. The Mixed category is open to adults and U21 players, with U16/U14 and U12 youth categories. Limited on-site accommodation and a Saturday evening party.",
    "entry_fee": "Mixed EUR 120, U16/U14 EUR 80, U12 EUR 60 per team",
    "source_url": "https://cpt.kayakers.nl/View/7082ab25-fb65-43ec-bf80-9aea12377690"
  },
  {
    "name": "III Edycja Pucharu Polski w Kajak Polo",
    "start_date": "2026-07-04",
    "end_date": "2026-07-05",
    "city": "Katowice",
    "country": "PL",
    "level": "National League",
    "venue": "Staw Maroko, Piastów 17",
    "divisions": [
      "Men",
      "Women",
      "U18"
    ],
    "description": "Third edition of the Polish Cup on 3 pitches. Men Division I, a Men U18 / Women B category and youth categories (U14 mixed, U12 Panda Cup), teams of 5 to 8 players. Free campsite on site.",
    "entry_fee": "Division I 400 PLN, Division II 300 PLN, Division III 100 PLN, Panda Cup free",
    "source_url": "https://cpt.kayakers.nl/View/PPKAT2026"
  },
  {
    "name": "Nederlands Dames NK/Dutch Open Ladies",
    "start_date": "2026-07-04",
    "end_date": "2026-07-04",
    "city": "Amersfoort",
    "country": "NL",
    "level": "National Championships",
    "venue": "Kanovereniging Keistad, De Stuw 1",
    "divisions": [
      "Women"
    ],
    "description": "Dutch women's championship / Dutch Open Ladies with two divisions (1st and 2nd). The 1st division competes for the national title and is open to international teams. Individual players may register to be grouped into teams.",
    "source_url": "https://cpt.kayakers.nl/View/4ceafa52-9d17-4ad1-bbcc-04de0f1b1dee"
  },
  {
    "name": "55. Internationales Kieler Woche Turnier",
    "start_date": "2026-06-27",
    "end_date": "2026-06-28",
    "city": "Kiel",
    "country": "DE",
    "level": "International",
    "venue": "Düsternbrooker Weg 44",
    "divisions": [
      "Mixed"
    ],
    "description": "The 55th international Kieler Woche canoe polo tournament on one pitch in a mixed division.",
    "source_url": "https://cpt.kayakers.nl/View/6a7c0922-105c-4884-b37e-7c59734d0a92"
  },
  {
    "name": "Deventer International 2026",
    "start_date": "2026-06-27",
    "end_date": "2026-06-28",
    "city": "Deventer",
    "country": "NL",
    "level": "International",
    "venue": "Gashavenstraat",
    "description": "12th Deventer International tournament with a First Division (max 12 teams) and a Second Division (max 18 teams). A barbecue is held during the event.",
    "entry_fee": "EUR 125 per team",
    "source_url": "https://cpt.kayakers.nl/View/deventer2026"
  },
  {
    "name": "Pfyn Cup",
    "start_date": "2026-06-27",
    "end_date": "2026-06-28",
    "city": "Pfyn",
    "country": "CH",
    "level": "International",
    "venue": "Badistrasse 10",
    "divisions": [
      "Men",
      "Women",
      "U18"
    ],
    "description": "Pfyn Cup, played under ICF rules including the shot clock. Categories: Men/Women, Mixed, U18 Swiss Championship, U14 Swiss Championship and U12. Camping at the clubhouse. Teams supply referees, timekeepers and a scorekeeper.",
    "entry_fee": "CHF 100 per team (Men/Women, U18); CHF 75 Mixed; CHF 50 U14; CHF 25 U12",
    "source_url": "https://cpt.kayakers.nl/View/c8c73917-463a-43ed-b2db-000c754cbec6"
  },
  {
    "name": "NC-2 Oslo Mikset lag",
    "start_date": "2026-06-21",
    "end_date": "2026-06-21",
    "city": "Oslo",
    "country": "NO",
    "level": "National League",
    "venue": "Drammensveien 210",
    "divisions": [
      "Mixed"
    ],
    "description": "NC-2 round for mixed teams on a single pitch.",
    "source_url": "https://cpt.kayakers.nl/View/60697ac4-d0be-435f-8271-4a7c58a34b06"
  },
  {
    "name": "Canoepolo Alps Trophy 2026 Salzburg",
    "start_date": "2026-06-20",
    "end_date": "2026-06-21",
    "city": "Salzburg",
    "country": "AT",
    "level": "International",
    "venue": "Salzach Badesee, Schmiedingerstraße 185",
    "divisions": [
      "Mixed",
      "Open"
    ],
    "description": "Canoepolo Alps Trophy 2026 (formerly the International Salzburg Kanupolo Tournament), 6th edition, played on a single pitch at a lake venue north of Salzburg. Teams from various countries are welcome; registration is via the organiser.",
    "source_url": "https://cpt.kayakers.nl/View/0457a102-15dd-4d09-ab97-3c15202e240d"
  },
  {
    "name": "Jeugd toernooi Deventer",
    "start_date": "2026-06-20",
    "end_date": "2026-06-20",
    "city": "Deventer",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Gashavenstraat 9",
    "description": "Youth tournament (jeugd toernooi) in Deventer on a single pitch, run as a combination tournament; 5 teams registered.",
    "source_url": "https://cpt.kayakers.nl/View/10f1801e-e2ba-4a61-b7a0-ebc8b72d65aa"
  },
  {
    "name": "NC-2 Oslo",
    "start_date": "2026-06-20",
    "end_date": "2026-06-21",
    "city": "Oslo",
    "country": "NO",
    "level": "National League",
    "venue": "Oslo Kajakklubb, Drammensveien 210",
    "divisions": [
      "Men",
      "Mixed"
    ],
    "description": "NC-2 Oslo with a 1st division (men) and a mixed division. Individual players could register and be placed into teams.",
    "entry_fee": "NOK 500 per team or NOK 100 per individual player",
    "source_url": "https://cpt.kayakers.nl/View/nc2oslo2026"
  },
  {
    "name": "Nederlands kampioenschap 2026",
    "start_date": "2026-06-20",
    "end_date": "2026-06-20",
    "city": "Helmond / Deventer / Den Haag",
    "country": "NL",
    "level": "National Championships",
    "venue": "Helmond: Kanaaldijk Z.O. 50; Deventer: Gashavenstraat 9; Den Haag: Nieuweweg 75",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "The 2026 Dutch Championships in senior and youth canoe polo, played over three weekends at three venues (Helmond, Deventer and Den Haag). Divisions: Kampioensklasse, Men 1st to 4th, youth and playoff divisions.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/NK2026"
  },
  {
    "name": "Ostdeutsche Meisterschaften Kanu-Polo 2026",
    "start_date": "2026-06-20",
    "end_date": "2026-06-21",
    "city": "Glauchau",
    "country": "DE",
    "level": "National Championships",
    "venue": "Naundorfer Wiesenweg",
    "divisions": [
      "Men",
      "Women",
      "U16",
      "Open"
    ],
    "description": "East German regional championships on 2 pitches, with age-group categories from U12 up to senior. Open to teams from the Berlin, Brandenburg and Saxony canoe associations, with about 25 teams entered.",
    "source_url": "https://cpt.kayakers.nl/View/ODM2026"
  },
  {
    "name": "Nederlands kampioenschap 2026",
    "start_date": "2026-06-13",
    "end_date": "2026-06-14",
    "city": "Helmond / Deventer / Den Haag",
    "country": "NL",
    "level": "National Championships",
    "venue": "Helmond: Kanaaldijk Z.O. 50; Deventer: Gashavenstraat 9; Den Haag: Nieuweweg 75",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "The 2026 Dutch Championships in senior and youth canoe polo, played over three weekends at three venues (Helmond, Deventer and Den Haag). Divisions: Kampioensklasse, Men 1st to 4th, youth and playoff divisions.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/NK2026"
  },
  {
    "name": "Norddeutsche Kanupolo Meisterschaft (NDM) 2026",
    "start_date": "2026-06-13",
    "end_date": "2026-06-14",
    "city": "Bremen",
    "country": "DE",
    "level": "National Championships",
    "venue": "Werdersee",
    "divisions": [
      "Men",
      "Women",
      "U16"
    ],
    "description": "Norddeutsche Kanupolo Meisterschaft (NDM) 2026, organised by Landes-Kanu-Verband Bremen. Categories: Women, Men, U21, U16, U14 and free. Clubs provide qualified referees.",
    "entry_fee": "EUR 180 senior, EUR 165 U21/U16/U14 (includes camping and showers for 10 athletes and 2 staff)",
    "source_url": "https://cpt.kayakers.nl/View/NDM2026"
  },
  {
    "name": "21th International Canoe Polo Tournament & 4th Mayor of Bestwina Cup",
    "start_date": "2026-06-06",
    "end_date": "2026-06-07",
    "city": "Kaniów",
    "country": "PL",
    "level": "International",
    "venue": "Municipal Recreation and Water Sports Centre, 2 Malinowa Street",
    "divisions": [
      "Open",
      "Women",
      "U18"
    ],
    "description": "The 21st International Canoe Polo Tournament and 4th Mayor of Bestwina Cup on three pitches. Divisions: Open (1st), Women and U18 (2nd), U14 (3rd) and U12 (4th). Valid medical clearance and swimming ability required. Free campsite accommodation.",
    "entry_fee": "EUR 120 / 450 PLN (Div 1-2), EUR 90 / 350 PLN (Div 3), U12 free",
    "source_url": "https://cpt.kayakers.nl/View/KaniowInt21"
  },
  {
    "name": "NorgesCup 1 2026 i Larvik (mixed teams)",
    "start_date": "2026-05-31",
    "end_date": "2026-05-31",
    "city": "Larvik",
    "country": "NO",
    "level": "National League",
    "venue": "Farriskilen, beneath the E-18 motorway bridge",
    "divisions": [
      "Mixed"
    ],
    "description": "NorgesCup 1 2026, a one-day mixed club tournament on one pitch. Individual players could register and be formed into teams.",
    "source_url": "https://cpt.kayakers.nl/View/7c128d08-18fa-4704-aed5-bce0043ef729"
  },
  {
    "name": "1. KCNW Nachwuchs-Cup",
    "start_date": "2026-05-30",
    "end_date": "2026-05-31",
    "city": "Berlin",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Kajak-Club Nord-West, Halligweg 3",
    "description": "The 1st KCNW Nachwuchs-Cup, a youth tournament for U12 and U14 with matches of 2x10 minutes. Catering provided.",
    "entry_fee": "EUR 100 per team",
    "source_url": "https://cpt.kayakers.nl/View/KCNW-CUP-2026"
  },
  {
    "name": "NorgesCup 1 2026 i Larvik",
    "start_date": "2026-05-30",
    "end_date": "2026-05-31",
    "city": "Larvik",
    "country": "NO",
    "level": "National League",
    "venue": "Farriskilen (under the E-18 motorway bridge)",
    "description": "NorgesCup 1 2026 on a single pitch, with a club division limited to 3 teams.",
    "entry_fee": "NOK 500",
    "source_url": "https://cpt.kayakers.nl/View/ebf369ce-9907-442d-a90e-1021ed4a3dcc"
  },
  {
    "name": "Pronkjewail",
    "start_date": "2026-05-30",
    "end_date": "2026-05-31",
    "city": "Haren",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Hoornsedijk 4",
    "divisions": [
      "Men"
    ],
    "description": "Pronkjewail for a Men 4th division on one pitch, max 8 teams. Cancelled due to a lack of registrations.",
    "entry_fee": "EUR 80",
    "status": "cancelled",
    "source_url": "https://cpt.kayakers.nl/View/pronkjewail2026"
  },
  {
    "name": "Pinkstertoernooi 2026",
    "start_date": "2026-05-25",
    "end_date": "2026-05-25",
    "city": "Leiderdorp",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Boomgaardlaan 22",
    "divisions": [
      "Men"
    ],
    "description": "Whit Monday tournament hosted by LKV Rijnland for youth and men's 4th division teams on 2 pitches. Cancelled due to insufficient registrations.",
    "entry_fee": "EUR 30 per team",
    "status": "cancelled",
    "source_url": "https://cpt.kayakers.nl/View/Pinkstertoernooi2026"
  },
  {
    "name": "Deutschland Cup 2026",
    "start_date": "2026-05-23",
    "end_date": "2026-05-25",
    "city": "Essen",
    "country": "DE",
    "level": "International",
    "venue": "Regattahaus Stadt Essen, Freiherr-vom-Stein-Str. 206c",
    "divisions": [
      "Men",
      "Women",
      "U21 Men",
      "U16"
    ],
    "description": "The 54th International Deutschland-Cup on seven pitches under ICF rules. Men 1st and 2nd League, Women 1st League, U21 Men, U16 and U14 categories, plus a free category. Matches are livestreamed.",
    "entry_fee": "EUR 280 (senior and U21 divisions), EUR 190 (U14 and U16)",
    "source_url": "https://cpt.kayakers.nl/View/DC2026"
  },
  {
    "name": "Scottish Division 1",
    "start_date": "2026-05-23",
    "end_date": "2026-05-24",
    "city": "Scotland",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 1, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv1"
  },
  {
    "name": "Scottish Division 2",
    "start_date": "2026-05-23",
    "end_date": "2026-05-24",
    "city": "Scotland",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 2, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv2"
  },
  {
    "name": "Scottish Division 3",
    "start_date": "2026-05-23",
    "end_date": "2026-05-24",
    "city": "Edinburgh",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 3, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv3"
  },
  {
    "name": "Penrith May Tournament",
    "start_date": "2026-05-18",
    "end_date": "2026-05-18",
    "city": "Penrith",
    "country": "GB",
    "level": "Club / Friendly",
    "venue": "Old London Road",
    "divisions": [
      "Open"
    ],
    "description": "One-day Penrith May Tournament on a single pitch, with Club and Open divisions.",
    "source_url": "https://cpt.kayakers.nl/View/aad0141f-13ae-416d-a0b5-24ae0597436b"
  },
  {
    "name": "24th Obersee Kanupolo Tournament Rapperswil",
    "start_date": "2026-05-16",
    "end_date": "2026-05-17",
    "city": "Rapperswil-Jona",
    "country": "CH",
    "level": "International",
    "venue": "Lidoplatz 20",
    "divisions": [
      "Men",
      "Women",
      "U16"
    ],
    "description": "24th Obersee Kanupolo Tournament on the upper Lake Zurich with two pitches. Men's 1st division, Women and U16 divisions, about 28 teams expected, with a Saturday evening social programme.",
    "source_url": "https://cpt.kayakers.nl/View/obersee2026"
  },
  {
    "name": "Amsterdam Open 2026",
    "start_date": "2026-05-16",
    "end_date": "2026-05-17",
    "city": "Amstelveen",
    "country": "NL",
    "level": "International",
    "venue": "Amsteldijk Zuid 253",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "Amsterdam Open 2026 on six pitches with four Open divisions (the fourth for youth) and a Women's division. Places are first-to-pay-first-served.",
    "entry_fee": "EUR 180 per team (Open Div 1-2), EUR 160 per team (Open Div 3-4 and Women)",
    "source_url": "https://cpt.kayakers.nl/View/AO26"
  },
  {
    "name": "Waterwolf Hemelvaart Toernooi",
    "start_date": "2026-05-14",
    "end_date": "2026-05-14",
    "city": "Hoofddorp",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "KV Waterwolf, Hoofdweg 567A",
    "description": "Waterwolf Hemelvaart youth tournament planned on one pitch. Cancelled because the organisers felt too many other tournaments competed for youth teams in that period.",
    "status": "cancelled",
    "source_url": "https://cpt.kayakers.nl/View/f4caebae-dd8e-465e-9b9d-cd2846154d39"
  },
  {
    "name": "Batavierencup",
    "start_date": "2026-05-10",
    "end_date": "2026-05-10",
    "city": "Nijmegen",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Oudedijk 3",
    "divisions": [
      "Men"
    ],
    "description": "Batavierencup on a single pitch with a Men 4th division only.",
    "source_url": "https://cpt.kayakers.nl/View/fce7c089-741a-4385-bc38-d8715f5938ce"
  },
  {
    "name": "Colonia-Cup / Gruppenmeisterschaft West 2026",
    "start_date": "2026-05-09",
    "end_date": "2026-05-10",
    "city": "Cologne",
    "country": "DE",
    "level": "International",
    "venue": "Regattabahn Köln Fühlingen, Oranjehofstraße 103-105",
    "divisions": [
      "Men",
      "Women",
      "U21 Men",
      "U16"
    ],
    "description": "The 3rd International ColoniaCup, which also serves as the integrated Gruppenmeisterschaft West 2026. Four pitches under DKV rules, with senior, U21 Men and youth categories (U16, U14, U12). Organised by the Kanu-Verband Nordrhein-Westfalen.",
    "entry_fee": "EUR 135 (Men, Women, U21 Men), EUR 100 (U16, U14), EUR 90 (U12) per team",
    "source_url": "https://cpt.kayakers.nl/View/ColoniaCup2026"
  },
  {
    "name": "Turnhout International Tournament",
    "start_date": "2026-05-02",
    "end_date": "2026-05-03",
    "city": "Turnhout",
    "country": "BE",
    "level": "International",
    "venue": "Oude Kaai",
    "divisions": [
      "Open",
      "Women",
      "U18"
    ],
    "description": "International tournament on four new pitches with floating goals, planned as an annual event. First Division and Second Division (up to 14 teams each) plus a Women + U18 mix division (up to 8 teams). Camping and catering on site.",
    "entry_fee": "EUR 125 per team",
    "source_url": "https://cpt.kayakers.nl/View/TurnhoutInternational"
  },
  {
    "name": "35. Philippsburger Kanupoloturnier",
    "start_date": "2026-04-25",
    "end_date": "2026-04-26",
    "city": "Philippsburg",
    "country": "DE",
    "level": "International",
    "venue": "Rheinschatzinsel",
    "divisions": [
      "Men",
      "Women",
      "Mixed"
    ],
    "description": "35th Philippsburger Kanupoloturnier on three pitches at the Rheinschatzinsel, organised by SKC Philippsburg. Categories: Men, Women, Mixed, U14 and free play.",
    "source_url": "https://cpt.kayakers.nl/View/philippsburg_2026"
  },
  {
    "name": "Allbau Frühjahrscup 2026",
    "start_date": "2026-04-25",
    "end_date": "2026-04-26",
    "city": "Essen",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Bad und Sport Oststadt, Schultenweg 44",
    "divisions": [
      "U16"
    ],
    "description": "Allbau Frühjahrscup 2026, a youth tournament for U14 and U16 (plus a free category) on two pitches.",
    "source_url": "https://cpt.kayakers.nl/View/FJCUP2026"
  },
  {
    "name": "HOKA Spring Challenge 2026",
    "start_date": "2026-04-25",
    "end_date": "2026-04-26",
    "city": "Berlin",
    "country": "DE",
    "level": "International",
    "venue": "Verein für Kanusport Berlin boathouse, Halligweg 1",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "20th HOKA Spring Challenge, played on three fields on the Hohenzollernkanal with a shot clock. Divisions: Women, Men League I and Men League II, open to club teams. Each team provides 3 referees; accommodation in the boathouse.",
    "entry_fee": "EUR 150 per team/division",
    "source_url": "https://cpt.kayakers.nl/View/hoka2026"
  },
  {
    "name": "Scottish Division 1",
    "start_date": "2026-04-25",
    "end_date": "2026-04-25",
    "city": "Scotland",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 1, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv1"
  },
  {
    "name": "UK SE Regional 2025-26 Division 2",
    "start_date": "2026-04-25",
    "end_date": "2026-04-25",
    "city": "South East England",
    "country": "GB",
    "level": "National League",
    "venue": "Frogmoor Lane",
    "divisions": [
      "Open"
    ],
    "description": "South East regional league Division 2 for 2025-26 on a single pitch, max 10 teams.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/UK_SE_D2_2025"
  },
  {
    "name": "Scottish Division 2",
    "start_date": "2026-04-11",
    "end_date": "2026-04-11",
    "city": "Scotland",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 2, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv2"
  },
  {
    "name": "HIT 2026 (Helmond International Tournament)",
    "start_date": "2026-04-04",
    "end_date": "2026-04-06",
    "city": "Helmond",
    "country": "NL",
    "level": "International",
    "venue": "Kanaaldijk Z.O. 50",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "30th Helmond International Tournament (HIT) on 9 pitches, with a women's division and Men 1st to 4th divisions. Pools of 12-32 teams play 8-9 matches.",
    "entry_fee": "EUR 285",
    "source_url": "https://cpt.kayakers.nl/View/24991135-e0e4-4ecc-9104-df77a5c612ad"
  },
  {
    "name": "Rhein-Ruhr Trophy 2026",
    "start_date": "2026-03-28",
    "end_date": "2026-03-29",
    "city": "Duisburg",
    "country": "DE",
    "level": "International",
    "venue": "Schwimmstadion Duisburg, Margaretenstraße 11",
    "divisions": [
      "Men",
      "U16"
    ],
    "description": "Rhein-Ruhr Trophy in the Duisburg swimming stadium, organised by Kanu-Verband Nordrhein-Westfalen. Men 1st class (16 teams), U16 (6 spots) and a free division. Invited clubs from Germany, the Netherlands, Belgium and the UK.",
    "entry_fee": "EUR 135 per team (Men and U16)",
    "source_url": "https://cpt.kayakers.nl/View/rheinruhrtrophy2026"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2026-03-28",
    "end_date": "2026-03-28",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "Penrith Canoe Club Easter Tournament",
    "start_date": "2026-03-23",
    "end_date": "2026-03-23",
    "city": "Penrith",
    "country": "GB",
    "level": "Club / Friendly",
    "divisions": [
      "Open"
    ],
    "description": "Penrith Canoe Club Easter Tournament, a one-day event on a single pitch with Club and Open divisions.",
    "source_url": "https://cpt.kayakers.nl/View/6b433c55-804a-4f1f-9b14-b232e78a2784"
  },
  {
    "name": "South West University Canoe Polo Finals 2026",
    "start_date": "2026-03-22",
    "end_date": "2026-03-23",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "Finals event of the South West University Canoe Polo league on a single pitch, with Open, Ladies and B team brackets.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6_FINALS"
  },
  {
    "name": "UK NWC 2025-2026 Division 2",
    "start_date": "2026-03-22",
    "end_date": "2026-03-22",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 2 of the UK National Water Canoe Polo League 2025-2026, played in pool format over four match days (15 Nov, 13 Dec, 7 Feb, 22 Mar). The final day is at Sale Water Park, Manchester; 9 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/21b66281-49e3-4349-8661-27228ca98397"
  },
  {
    "name": "UK NWC 2025-2026 Division 3",
    "start_date": "2026-03-22",
    "end_date": "2026-03-22",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 3 of the UK National Water Canoe Polo League 2025-2026, played over four match days (25 Oct, 17 Jan, 14 Feb, 22 Mar) on a single pitch. The final round is at Collingwood Dock, Liverpool; 8 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/0dcbbab7-cecc-405b-9762-862534b97af6"
  },
  {
    "name": "UK NWC 2025-2026 Division 1",
    "start_date": "2026-03-21",
    "end_date": "2026-03-21",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "divisions": [
      "Open"
    ],
    "description": "North West regional league Division 1 for 2025-26 with 10 teams, mostly at Life Leisure Cheadle on 3 pitches with the final event at Collingwood Docks. Pool play with timed games.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c40da6d1-5f81-4615-bb46-41d5fcfa6d6a"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2026-03-21",
    "end_date": "2026-03-21",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "NWC Youth Tournament",
    "start_date": "2026-03-14",
    "end_date": "2026-03-14",
    "city": "United Kingdom",
    "country": "GB",
    "level": "Club / Friendly",
    "venue": "Scotland Road",
    "description": "Youth canoe polo tournament in three groups (A, B and C), 8 teams registered.",
    "source_url": "https://cpt.kayakers.nl/View/dadaf6a8-ba5d-416f-8de3-4efaa0ee7147"
  },
  {
    "name": "Scottish Division 2",
    "start_date": "2026-03-14",
    "end_date": "2026-03-14",
    "city": "Scotland",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 2, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv2"
  },
  {
    "name": "Yorkshire & Humber Regional Division 1",
    "start_date": "2026-03-14",
    "end_date": "2026-03-14",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire & Humber regional league Division 1, played on Saturdays between October 2025 and March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c1fe7a7f-be97-47d4-be7d-4f296a1bb8ac"
  },
  {
    "name": "10. WSD Junior-Cup 2026",
    "start_date": "2026-03-07",
    "end_date": "2026-03-07",
    "city": "Pirna",
    "country": "DE",
    "level": "Club / Friendly",
    "description": "10th WSD Junior Cup, a one-day junior tournament on a single pitch in Pirna-Copitz, with U14 and U12 categories.",
    "source_url": "https://cpt.kayakers.nl/View/b6561954-ec82-44f3-90e5-d48b38404a11"
  },
  {
    "name": "25. Hallenkanupolo Turnier KSC Mannheim Neckarau",
    "start_date": "2026-03-07",
    "end_date": "2026-03-08",
    "city": "Mannheim",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Freiburger Straße",
    "divisions": [
      "Mixed"
    ],
    "description": "The 25th Hallenkanupolo Turnier of KSC Mannheim Neckarau, an indoor mixed tournament on one pitch.",
    "source_url": "https://cpt.kayakers.nl/View/KSC2026"
  },
  {
    "name": "De 24uur van Stadskanaal",
    "start_date": "2026-03-07",
    "end_date": "2026-03-08",
    "city": "Stadskanaal",
    "country": "NL",
    "level": "Club / Friendly",
    "venue": "Hoveniersweg 1",
    "description": "De 24uur van Stadskanaal, a 24-hour 4x4 swimming-pool canoe polo tournament for the 2nd and 3rd classes (2e and 3e klasse), maximum 8 teams per division.",
    "entry_fee": "EUR 150 per team per division",
    "source_url": "https://cpt.kayakers.nl/View/de24uur2026"
  },
  {
    "name": "Yorkshire Women",
    "start_date": "2026-03-07",
    "end_date": "2026-03-07",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Women"
    ],
    "description": "Yorkshire women's regional event on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshirew"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2026-03-01",
    "end_date": "2026-03-01",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "Scottish Division 3",
    "start_date": "2026-02-28",
    "end_date": "2026-02-28",
    "city": "Edinburgh",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 3, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv3"
  },
  {
    "name": "UK NWC 2025-2026 Division 1",
    "start_date": "2026-02-28",
    "end_date": "2026-02-28",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "divisions": [
      "Open"
    ],
    "description": "North West regional league Division 1 for 2025-26 with 10 teams, mostly at Life Leisure Cheadle on 3 pitches with the final event at Collingwood Docks. Pool play with timed games.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c40da6d1-5f81-4615-bb46-41d5fcfa6d6a"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2026-02-28",
    "end_date": "2026-02-28",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "23. Braunschweiger Kanupolo Turnier",
    "start_date": "2026-02-21",
    "end_date": "2026-02-22",
    "city": "Braunschweig",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Sachsendamm",
    "divisions": [
      "Men",
      "U16"
    ],
    "description": "The 23rd Braunschweiger Kanupolo Turnier, with U14, U16 and Men's divisions on one pitch.",
    "source_url": "https://cpt.kayakers.nl/View/BKCTurnier2026"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2026-02-21",
    "end_date": "2026-02-21",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "UK NWC 2025-2026 Women's Division",
    "start_date": "2026-02-21",
    "end_date": "2026-02-21",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Shiers Drive",
    "divisions": [
      "Women"
    ],
    "description": "Women's division of the UK National Water Canoe Polo League 2025-2026, for up to 7 teams on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/2fcf6551-0909-4419-8053-dc8b02c06bc8"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2026-02-21",
    "end_date": "2026-02-21",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "UK NWC 2025-2026 Division 3",
    "start_date": "2026-02-14",
    "end_date": "2026-02-14",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 3 of the UK National Water Canoe Polo League 2025-2026, played over four match days (25 Oct, 17 Jan, 14 Feb, 22 Mar) on a single pitch. The final round is at Collingwood Dock, Liverpool; 8 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/0dcbbab7-cecc-405b-9762-862534b97af6"
  },
  {
    "name": "UK SE Regional 2025-26 Division 2",
    "start_date": "2026-02-14",
    "end_date": "2026-02-14",
    "city": "South East England",
    "country": "GB",
    "level": "National League",
    "venue": "Frogmoor Lane",
    "divisions": [
      "Open"
    ],
    "description": "South East regional league Division 2 for 2025-26 on a single pitch, max 10 teams.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/UK_SE_D2_2025"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2026-02-07",
    "end_date": "2026-02-07",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "UK NWC 2025-2026 Division 2",
    "start_date": "2026-02-07",
    "end_date": "2026-02-07",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 2 of the UK National Water Canoe Polo League 2025-2026, played in pool format over four match days (15 Nov, 13 Dec, 7 Feb, 22 Mar). The final day is at Sale Water Park, Manchester; 9 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/21b66281-49e3-4349-8661-27228ca98397"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2026-02-07",
    "end_date": "2026-02-07",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "Hamburger Mixed-Hallenturnier 2026",
    "start_date": "2026-01-31",
    "end_date": "2026-02-01",
    "city": "Hamburg",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Budapester Straße 29",
    "divisions": [
      "Mixed"
    ],
    "description": "Hamburger Mixed-Hallenturnier, an indoor tournament for mixed teams with 4 players per team on the field, each squad including a player of the opposite gender or a youth player at all times.",
    "entry_fee": "EUR 220",
    "source_url": "https://cpt.kayakers.nl/View/HH-Hallenturnier_2026"
  },
  {
    "name": "Scottish Division 3",
    "start_date": "2026-01-31",
    "end_date": "2026-01-31",
    "city": "Edinburgh",
    "country": "GB",
    "level": "National League",
    "venue": "North Canal Bank Street 75",
    "divisions": [
      "Open"
    ],
    "description": "Scottish league Division 3, organised by Paddle Scotland, on 2 pitches with 6 teams. Registration and payment via JustGo.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SCDiv3"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2026-01-31",
    "end_date": "2026-01-31",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "UK NWC 2025-2026 Division 1",
    "start_date": "2026-01-31",
    "end_date": "2026-01-31",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "divisions": [
      "Open"
    ],
    "description": "North West regional league Division 1 for 2025-26 with 10 teams, mostly at Life Leisure Cheadle on 3 pitches with the final event at Collingwood Docks. Pool play with timed games.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c40da6d1-5f81-4615-bb46-41d5fcfa6d6a"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2026-01-31",
    "end_date": "2026-01-31",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "NWC Youth Tournament",
    "start_date": "2026-01-24",
    "end_date": "2026-01-24",
    "city": "United Kingdom",
    "country": "GB",
    "level": "Club / Friendly",
    "description": "NWC Youth Tournament, a one-day youth event on a single pitch, organised in three groups (A, B and C).",
    "source_url": "https://cpt.kayakers.nl/View/7e55f942-d79d-4b11-adb4-f2f4b73fdb03"
  },
  {
    "name": "UK SE Regional 2025-26 Division 2",
    "start_date": "2026-01-24",
    "end_date": "2026-01-24",
    "city": "South East England",
    "country": "GB",
    "level": "National League",
    "venue": "Frogmoor Lane",
    "divisions": [
      "Open"
    ],
    "description": "South East regional league Division 2 for 2025-26 on a single pitch, max 10 teams.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/UK_SE_D2_2025"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2026-01-24",
    "end_date": "2026-01-24",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "UK NWC 2025-2026 Division 3",
    "start_date": "2026-01-17",
    "end_date": "2026-01-17",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 3 of the UK National Water Canoe Polo League 2025-2026, played over four match days (25 Oct, 17 Jan, 14 Feb, 22 Mar) on a single pitch. The final round is at Collingwood Dock, Liverpool; 8 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/0dcbbab7-cecc-405b-9762-862534b97af6"
  },
  {
    "name": "Yorkshire & Humber Regional Division 1",
    "start_date": "2026-01-17",
    "end_date": "2026-01-17",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire & Humber regional league Division 1, played on Saturdays between October 2025 and March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c1fe7a7f-be97-47d4-be7d-4f296a1bb8ac"
  },
  {
    "name": "UK NWC 2025-2026 Division 1",
    "start_date": "2026-01-10",
    "end_date": "2026-01-10",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "divisions": [
      "Open"
    ],
    "description": "North West regional league Division 1 for 2025-26 with 10 teams, mostly at Life Leisure Cheadle on 3 pitches with the final event at Collingwood Docks. Pool play with timed games.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c40da6d1-5f81-4615-bb46-41d5fcfa6d6a"
  },
  {
    "name": "Penrith Christmas Tournament",
    "start_date": "2025-12-15",
    "end_date": "2025-12-15",
    "city": "Penrith",
    "country": "GB",
    "level": "Club / Friendly",
    "venue": "Southend Road",
    "divisions": [
      "Open"
    ],
    "description": "Penrith Christmas Tournament on a single pitch, with an Open division (max 2 teams) and a Club division (max 6 teams).",
    "source_url": "https://cpt.kayakers.nl/View/a62ba64a-e5a1-4239-86db-48dececdf5f6"
  },
  {
    "name": "UK NWC 2025-2026 Division 2",
    "start_date": "2025-12-13",
    "end_date": "2025-12-13",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 2 of the UK National Water Canoe Polo League 2025-2026, played in pool format over four match days (15 Nov, 13 Dec, 7 Feb, 22 Mar). The final day is at Sale Water Park, Manchester; 9 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/21b66281-49e3-4349-8661-27228ca98397"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2025-12-13",
    "end_date": "2025-12-13",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2025-12-06",
    "end_date": "2025-12-06",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2025-11-29",
    "end_date": "2025-11-29",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "UK NWC 2025-2026 Women's Division",
    "start_date": "2025-11-29",
    "end_date": "2025-11-29",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Shiers Drive",
    "divisions": [
      "Women"
    ],
    "description": "Women's division of the UK National Water Canoe Polo League 2025-2026, for up to 7 teams on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/2fcf6551-0909-4419-8053-dc8b02c06bc8"
  },
  {
    "name": "Yorkshire & Humber Regional Division 1",
    "start_date": "2025-11-29",
    "end_date": "2025-11-29",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire & Humber regional league Division 1, played on Saturdays between October 2025 and March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c1fe7a7f-be97-47d4-be7d-4f296a1bb8ac"
  },
  {
    "name": "South West University Canoe Polo",
    "start_date": "2025-11-23",
    "end_date": "2025-11-23",
    "city": "South West England",
    "country": "GB",
    "level": "National League",
    "venue": "Brunel Lock Road",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "South West University Canoe Polo league season on a single pitch, with Open, Ladies and B team categories.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/SWUPL_2025_6"
  },
  {
    "name": "Kieler Indoor Cup",
    "start_date": "2025-11-22",
    "end_date": "2025-11-23",
    "city": "Kiel",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Sportforum der Universität Kiel, Olshausenstraße 72",
    "divisions": [
      "Men",
      "Women"
    ],
    "description": "The 5th Kieler Indoor Cup on two pitches. Men and Women play 5v5 with a maximum of 8 teams per division; youth teams play 4v4 on a smaller field in PE boats.",
    "source_url": "https://cpt.kayakers.nl/View/Kiel_Indoor_Cup2025"
  },
  {
    "name": "UK NWC Youth Tournament",
    "start_date": "2025-11-22",
    "end_date": "2025-11-22",
    "city": "United Kingdom",
    "country": "GB",
    "level": "National League",
    "venue": "Burton Road",
    "divisions": [
      "Women"
    ],
    "description": "UK National Water Canoe Polo League youth tournament with a Division 4 and a Women's division on a single pitch. Each team supplies a junior referee.",
    "source_url": "https://cpt.kayakers.nl/View/61151826-a8ca-4583-b014-b04aaf27b79b"
  },
  {
    "name": "Yorkshire Women",
    "start_date": "2025-11-22",
    "end_date": "2025-11-22",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Women"
    ],
    "description": "Yorkshire women's regional event on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshirew"
  },
  {
    "name": "UK NWC 2025-2026 Division 2",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 2 of the UK National Water Canoe Polo League 2025-2026, played in pool format over four match days (15 Nov, 13 Dec, 7 Feb, 22 Mar). The final day is at Sale Water Park, Manchester; 9 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/21b66281-49e3-4349-8661-27228ca98397"
  },
  {
    "name": "UK SE Regional 2025-26 Division 2",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "city": "South East England",
    "country": "GB",
    "level": "National League",
    "venue": "Frogmoor Lane",
    "divisions": [
      "Open"
    ],
    "description": "South East regional league Division 2 for 2025-26 on a single pitch, max 10 teams.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/UK_SE_D2_2025"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "UK NWC 2025-2026 Division 1",
    "start_date": "2025-11-08",
    "end_date": "2025-11-08",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "divisions": [
      "Open"
    ],
    "description": "North West regional league Division 1 for 2025-26 with 10 teams, mostly at Life Leisure Cheadle on 3 pitches with the final event at Collingwood Docks. Pool play with timed games.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c40da6d1-5f81-4615-bb46-41d5fcfa6d6a"
  },
  {
    "name": "Yorkshire Regional Division 2",
    "start_date": "2025-11-08",
    "end_date": "2025-11-08",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 2 league, a series of Saturday match days from November 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire2"
  },
  {
    "name": "Nottingham freshers tournament",
    "start_date": "2025-11-01",
    "end_date": "2025-11-02",
    "city": "Long Eaton",
    "country": "GB",
    "level": "Club / Friendly",
    "venue": "Pasture Lane",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "Freshers tournament in the Nottingham area on four pitches, with freshers, women's and open leagues. Registration through the organiser.",
    "source_url": "https://cpt.kayakers.nl/View/0f6358e1-3c1d-4215-a1c3-6c9f6ca10e83"
  },
  {
    "name": "UK NWC 2025-2026 Division 3",
    "start_date": "2025-10-25",
    "end_date": "2025-10-25",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Life Leisure Cheadle, Shiers Drive",
    "description": "Division 3 of the UK National Water Canoe Polo League 2025-2026, played over four match days (25 Oct, 17 Jan, 14 Feb, 22 Mar) on a single pitch. The final round is at Collingwood Dock, Liverpool; 8 teams registered.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/0dcbbab7-cecc-405b-9762-862534b97af6"
  },
  {
    "name": "UK SE Regional 2025-26 Division 2",
    "start_date": "2025-10-19",
    "end_date": "2025-10-19",
    "city": "South East England",
    "country": "GB",
    "level": "National League",
    "venue": "Frogmoor Lane",
    "divisions": [
      "Open"
    ],
    "description": "South East regional league Division 2 for 2025-26 on a single pitch, max 10 teams.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/UK_SE_D2_2025"
  },
  {
    "name": "UK NWC 2025-2026 Women's Division",
    "start_date": "2025-10-18",
    "end_date": "2025-10-18",
    "city": "Cheadle",
    "country": "GB",
    "level": "National League",
    "venue": "Shiers Drive",
    "divisions": [
      "Women"
    ],
    "description": "Women's division of the UK National Water Canoe Polo League 2025-2026, for up to 7 teams on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/2fcf6551-0909-4419-8053-dc8b02c06bc8"
  },
  {
    "name": "Yorkshire Regional Division 3",
    "start_date": "2025-10-18",
    "end_date": "2025-10-18",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire Regional Division 3 league, a series of Saturday match days from October 2025 to March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/yorkshire3"
  },
  {
    "name": "KKP Saisonabschluss 2025",
    "start_date": "2025-10-12",
    "end_date": "2025-10-12",
    "city": "Troisdorf",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Im Kleinen Feldchen",
    "description": "KKP Saisonabschluss 2025, a canoe polo tournament on 2 pitches.",
    "source_url": "https://cpt.kayakers.nl/View/KKP2025"
  },
  {
    "name": "Yorkshire & Humber Regional Division 1",
    "start_date": "2025-10-11",
    "end_date": "2025-10-11",
    "city": "Yorkshire",
    "country": "GB",
    "level": "National League",
    "venue": "Haley's Terrace",
    "divisions": [
      "Open"
    ],
    "description": "Yorkshire & Humber regional league Division 1, played on Saturdays between October 2025 and March 2026 on a single pitch.\n\nThis is one match day or round of a league season or multi-weekend event. See the source page for the full fixture list.",
    "source_url": "https://cpt.kayakers.nl/View/c1fe7a7f-be97-47d4-be7d-4f296a1bb8ac"
  },
  {
    "name": "Oktoberfestturnier 2025",
    "start_date": "2025-10-04",
    "end_date": "2025-10-05",
    "city": "Oberschleißheim",
    "country": "DE",
    "level": "Club / Friendly",
    "venue": "Dachauer Straße 35",
    "divisions": [
      "Open",
      "Women"
    ],
    "description": "Oktoberfestturnier on two pitches with Open/Men, Women and U14 categories. The tournament was abandoned because of strong gusts, with only friendly matches on Sunday morning.",
    "source_url": "https://cpt.kayakers.nl/View/oktoberfestturnier2025"
  },
  {
    "name": "Pylkwier 2025",
    "start_date": "2025-10-04",
    "end_date": "2025-10-05",
    "city": "Leeuwarden",
    "country": "NL",
    "level": "International",
    "venue": "Avondsterweg 15",
    "divisions": [
      "Men"
    ],
    "description": "Pylkwier 2025 with Men 2nd and Men 4th divisions. On-site camping is available and individual players could register and be placed in teams by the organisers.",
    "entry_fee": "EUR 70 per team",
    "source_url": "https://cpt.kayakers.nl/View/20pylkwier25"
  }
],
});

BATCHES.push({
  id: 'setubal-cup-2026-2026-10-01',
  tournaments: [
    {
      name: '2026 Setúbal Cup International Canoe Polo Tournament',
      start_date: '2026-10-24', end_date: '2026-10-25',
      city: 'Setúbal', country: 'PT',
      level: 'International',
      description: 'International canoe polo tournament in Setúbal, Portugal.',
    },
  ],
});

const PATCHES = [
  {
    id: 'setubal-cup-2026-teams',
    match: { name: '2026 Setúbal Cup International Canoe Polo Tournament', start_date: '2026-10-24' },
    set: {
      venue: 'Outdoor swimming pool',
      description: 'Invite only. The tournament is played in an outdoor swimming pool.\n\nSixteen teams: fourteen have entered so far and two places are still to be confirmed.',
      teams_text: ['Setúbal | PT', 'Barra | PT', 'Coimbra | PT', 'Deventer | NL', 'Trekvoggles | NL', 'Legends | EU', 'Oxio | ES', 'Piragua Madrid | ES', 'Espanha U21 F | ES', 'Ciências | ES', 'Malaga | ES', 'Kilcok | IE', 'Portugal U21 M | PT', 'Rodeira | ES', 'To be confirmed', 'To be confirmed'].join('\n'),
    },
  },
  {
    id: 'nwc-2026-registration-w1',
    match: { name: 'NorthWest & Central Regional League 2026/2027, weekend 1', start_date: '2026-10-03' },
    set: {
      registration_url: 'https://cpt.kayakers.nl/Registration/deb94838-aa30-4c5b-83d4-075571cba873',
      registration_deadline: '2026-10-02',
      description: 'Opening weekend of the 2026/27 North West and Central regional league: Divisions 1 to 4 and a women\'s division. The second weekend is on 20-21 March 2027.\n\nDivisions (max teams, fee per team): Division 1 (8 teams, GBP 320), Division 2 (8, GBP 320), Division 3 (8, GBP 320), Division 4 (6, GBP 160), women\'s (8, GBP 160). One pitch. Online registration opens 2 June and closes 2 October.',
    },
  },
  {
    id: 'nwc-2026-registration-w2',
    match: { name: 'NorthWest & Central Regional League 2026/2027, weekend 2', start_date: '2027-03-20' },
    set: {
      registration_url: 'https://cpt.kayakers.nl/Registration/deb94838-aa30-4c5b-83d4-075571cba873',
      registration_deadline: '2026-10-02',
      description: 'Final weekend of the 2026/27 North West and Central regional league. The opening weekend is on 3-4 October 2026.\n\nDivisions (max teams, fee per team): Division 1 (8 teams, GBP 320), Division 2 (8, GBP 320), Division 3 (8, GBP 320), Division 4 (6, GBP 160), women\'s (8, GBP 160). One pitch. Online registration opens 2 June and closes 2 October.',
    },
  },

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
    id: 'milan-ecc-2026-timetable-hidden',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf' },
  },
  {
    id: 'milan-ecc-2026-full-timetable',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nTimetable (Friday, Saturday, Sunday) | /docs/milan-ecc-2026-schedule.pdf' },
  },
  {
    id: 'milan-ecc-2026-gazebos',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nTimetable (Friday, Saturday, Sunday) | /docs/milan-ecc-2026-schedule.pdf\nCompetition area map and gazebo placement | /tournaments/paddle-europe-canoe-polo-club-championships-2026/gazebos' },
  },
  {
    id: 'milan-ecc-2026-schedule-update-1-oct',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nTimetable (Friday, Saturday, Sunday), updated 1 Oct | /docs/milan-ecc-2026-schedule-update-1-oct.pdf\nCompetition area map and gazebo placement | /tournaments/paddle-europe-canoe-polo-club-championships-2026/gazebos' },
  },
  {
    id: 'milan-ecc-2026-friday-officials',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nTimetable (Friday, Saturday, Sunday), updated 1 Oct | /docs/milan-ecc-2026-schedule-update-1-oct.pdf\nFriday referees and table officials (provisional) | /docs/milan-ecc-2026-friday-officials.pdf\nCompetition area map and gazebo placement | /tournaments/paddle-europe-canoe-polo-club-championships-2026/gazebos' },
  },
  {
    id: 'milan-ecc-2026-saturday-officials',
    match: { name: 'Paddle Europe Canoe Polo Club Championships 2026', start_date: '2026-10-02' },
    set: { documents_text: 'Bulletin 1 | /docs/milan-ecc-2026-bulletin-1.pdf\nGroups | /docs/milan-ecc-2026-groups.pdf\nTimetable (Friday, Saturday, Sunday), updated 1 Oct | /docs/milan-ecc-2026-schedule-update-1-oct.pdf\nFriday referees and table officials (provisional) | /docs/milan-ecc-2026-friday-officials.pdf\nSaturday referees and table officials, up to 13:00 (provisional) | /docs/milan-ecc-2026-saturday-officials.pdf\nCompetition area map and gazebo placement | /tournaments/paddle-europe-canoe-polo-club-championships-2026/gazebos' },
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

// One-time clean-ups of data that was imported earlier (each runs once, recorded in the imports table)
const SCRUBS = [
  {
    id: 'remove-organiser-names-2026-10-01',
    sql: [
      ["UPDATE tournaments SET description = replace(description, ' Organiser: Paul Elliott.', '') WHERE description LIKE '%Organiser: Paul Elliott.%'"],
      ["UPDATE tournaments SET description = replace(description, ' Organiser: Mike Fletcher.', '') WHERE description LIKE '%Organiser: Mike Fletcher.%'"],
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
  for (const sc of SCRUBS) {
    if (done.has(sc.id)) continue;
    db.transaction(() => {
      sc.sql.forEach(([q]) => db.prepare(q).run());
      db.prepare('INSERT INTO imports (id) VALUES (?)').run(sc.id);
    })();
    console.log(`Clean-up ${sc.id} done.`);
  }
  const find = db.prepare('SELECT * FROM tournaments WHERE lower(name) = lower(?) AND start_date = ?');
  for (const patch of PATCHES) {
    if (done.has(patch.id)) continue;
    const row = find.get(patch.match.name, patch.match.start_date);
    if (!row) continue; // not listed (e.g. deleted), nothing to update
    const cur = T.getById(row.id);
    const { data, errors } = T.validate({ ...cur, documents_text: (cur.documents || []).map((d) => `${d.label} | ${d.url}`).join('\n'), teams_text: (cur.teams || []).map((x) => (x.country ? `${x.name} | ${x.country}` : x.name)).join('\n'), ...patch.set });
    if (errors.length) { console.warn(`Patch ${patch.id}: ${errors.join(' ')}`); continue; }
    T.update(row.id, data);
    db.prepare('INSERT INTO imports (id) VALUES (?)').run(patch.id);
    console.log(`Patch ${patch.id}: updated "${cur.name}".`);
  }
}

module.exports = { run };
