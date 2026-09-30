// Content for the Support & funding page (/support), also used on /get-involved.
// Written for clubs anywhere in the world. Edit this file to add, remove or update organisations and grants.
// Amounts and deadlines change often: update LAST_CHECKED whenever you review the list.

const LAST_CHECKED = 'September 2026';

// Who to contact for help: the world and continental governing bodies.
const ORGANISATIONS = [
  { name: 'Paddle Worldwide (International Canoe Federation)', area: 'Worldwide', url: 'https://paddleworldwide.com/national-federations', help: 'The world governing body for canoe polo, with 175 member federations. Its directory lists the official canoe federation for every country.' },
  { name: 'Paddle Europe', area: 'Europe', url: 'https://www.canoe-europe.org/', help: 'Runs the European Championships for national teams and the European Club Championships.' },
  { name: 'Pan American Canoe Federation', area: 'The Americas', url: 'https://copaconline.com/', help: 'Continental body for North, Central and South America and the Caribbean, including the Pan American canoe polo championships.' },
  { name: 'Asian Canoe Confederation', area: 'Asia', url: 'https://asiacanoe.wixsite.com/asian-canoe', help: 'Continental body for Asia, organising the Asian Canoe Polo Championships.' },
  { name: 'Confederation of African Canoe', area: 'Africa', url: 'https://paddlinginafrica.com/', help: 'Continental body for Africa, supporting development of paddlesport across the continent.' },
  { name: 'Oceania Canoe Association', area: 'Oceania', url: 'https://paddleworldwide.com/continental', help: 'Continental body for Australia, New Zealand and the Pacific, including the Oceania canoe polo championships.' },
  { name: 'Kayakers.nl', area: 'Tournament software, worldwide', url: 'https://www.kayakers.nl/', help: 'Free online tool to run tournaments anywhere: registration, schedules and live results.' },
];

// National canoe polo pages: examples from some of the biggest canoe polo countries.
// Every other country's federation is in the Paddle Worldwide directory (first link above).
const NATIONAL = [
  { country: 'Australia', name: 'Paddle Australia: canoe polo', url: 'https://paddle.org.au/paddlesports/canoe-polo/' },
  { country: 'Canada', name: 'Canoe Kayak Canada: canoe polo', url: 'https://canoekayak.ca/go-paddling-sports/canoe-polo/' },
  { country: 'France', name: 'FFCK: kayak-polo', url: 'https://www.ffck.org/kayak-polo/' },
  { country: 'Germany', name: 'Deutscher Kanu-Verband: Kanupolo', url: 'https://www.kanu.de/Kanupolo-90631.html' },
  { country: 'Great Britain', name: 'Paddle UK canoe polo', url: 'https://canoepolo.org.uk/' },
  { country: 'Ireland', name: 'Irish Canoe Polo', url: 'https://canoepolo.ie/' },
  { country: 'Italy', name: 'Federazione Italiana Canoa Kayak: canoa polo', url: 'https://www.federcanoa.it/tags/canoa_polo.html' },
  { country: 'New Zealand', name: 'New Zealand Canoe Polo Association', url: 'https://www.nzcanoepolo.org.nz/' },
  { country: 'United States', name: 'American Canoe Association: canoe polo', url: 'https://americancanoe.org/competition/teams/icf-sports/canoe-polo/' },
];

// Practical ways for clubs and teams to raise money. These work in any country.
const FUNDRAISING = [
  { title: 'Host a tournament', text: 'Entry fees, food stalls and a raffle at a well-run weekend tournament can fund a club for a season. Kayakers.nl handles the admin for free.' },
  { title: 'Local sponsorship', text: 'Offer local businesses their logo on shirts, boats, goal frames or your website in return for a yearly amount. A one-page sponsor pack with prices makes it easy to say yes.' },
  { title: 'Crowdfunding for travel', text: 'Raising money for a team trip to a continental or World Championships works well on crowdfunding sites. Share photos, the squad list and exactly what the money pays for.' },
  { title: 'Club draw or raffle', text: 'A regular club draw or 50/50 raffle gives steady income. Check local law first: most countries need a permit or licence for lotteries and raffles.' },
  { title: 'Taster sessions and "have a go" days', text: 'Paid try-canoe-polo sessions for schools, scouts, universities and companies bring in money and new members at the same time.' },
  { title: 'Kit and merchandise', text: 'Club hoodies, rash vests and helmet stickers sell well at tournaments. Order in small batches to avoid stock left over.' },
  { title: 'Sell or rent spare equipment', text: 'Older boats, paddles and helmets can be sold to newer clubs or rented to visiting teams at tournaments.' },
  { title: 'Employer matched giving', text: 'Many employers match money raised or time volunteered by staff for local clubs. Ask your members to check with their employer.' },
  { title: 'Tax-efficient donations', text: 'Many countries give tax relief on donations to registered clubs, associations or charities. Registering your club properly can make donations worth more.' },
];

// Grant routes. The first three groups apply everywhere; the last shows real examples of the kind of fund to look for.
const GRANTS = [
  {
    region: 'Worldwide', id: 'world',
    note: 'International money reaches clubs through national federations and National Olympic Committees, so ask your federation first.',
    items: [
      { name: 'Paddle Worldwide development programmes', who: 'National federations: development camps, coaching and officials\' education, and talent programmes. Clubs benefit through their federation.', amount: 'Places on courses and camps; some costs covered', when: 'Throughout the year', url: 'https://paddleworldwide.com/development-programme' },
      { name: 'Boats for developing federations', who: 'Paddle Worldwide works with manufacturers to get boats to federations in countries where paddlesport is still growing.', amount: 'Equipment', when: 'Ask your federation', url: 'https://www.canoeicf.com/news/icf-embarks-plan-get-boats-developing-canoe-federations' },
      { name: 'Olympic Solidarity', who: 'The IOC\'s programme for athletes, coaches and sports development, run through each National Olympic Committee. Mainly for Olympic sports: ask whether canoe polo coaches can join canoe courses and scholarships.', amount: 'Scholarships, courses and project funding', when: 'Four-year plan, 2025 to 2028', url: 'https://www.olympics.com/ioc/olympic-agenda-reforms/solidarity' },
    ],
  },
  {
    region: 'Continental', id: 'continental',
    items: [
      { name: 'Erasmus+ Sport: Small-scale Partnerships (Europe)', who: 'Grassroots clubs working with at least one partner club in another country, for example an exchange, inclusion or coaching project.', amount: 'Lump sum of €30,000 or €60,000', when: 'Yearly round, usually closing in March', url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-organisations/sport-actions/small-scale-partnerships' },
      { name: 'Erasmus+ Sport: staff mobility (Europe)', who: 'Coaches, referees, volunteers and staff of sport organisations training or job-shadowing in another country.', amount: 'Travel and living costs', when: 'Yearly round, usually closing in February', url: 'https://erasmus-plus.ec.europa.eu/programme-guide/sport' },
      { name: 'Your continental association', who: 'Africa, the Americas, Asia, Europe and Oceania each have a continental body that runs development camps, coaching courses and championships.', amount: 'Varies', when: 'Varies', url: 'https://paddleworldwide.com/continental' },
    ],
  },
  {
    region: 'In your country', id: 'national',
    note: 'Almost every country has these kinds of funding. Search for them by name with your country, state or city.',
    items: [
      { name: 'Your national canoe federation', who: 'Many federations have club grants, equipment schemes, coaching bursaries and development officers who know every fund in the country. Start here.', amount: 'Varies', when: 'Ask your federation', url: 'https://paddleworldwide.com/national-federations' },
      { name: 'National sports agency or ministry', who: 'Government sport bodies usually fund clubs to get more people active, buy equipment or train coaches.', amount: 'From small equipment grants to large facility grants', when: 'Usually yearly rounds', url: '' },
      { name: 'National lottery and gaming funds', who: 'In many countries, lottery or gaming profits are shared out to community groups and sports clubs.', amount: 'Small to medium grants', when: 'Often open all year', url: '' },
      { name: 'State, regional and city councils', who: 'Local government often has sport and community grants for equipment, events, pool time and youth sport.', amount: 'Usually small to medium grants', when: 'Varies by council', url: '' },
      { name: 'Community foundations and service clubs', who: 'Local foundations, Rotary, Lions and similar groups support youth and community projects.', amount: 'Usually small grants', when: 'Varies', url: '' },
      { name: 'Company community funds', who: 'Banks, supermarkets, utilities and local employers often run community or sports funds.', amount: 'Small grants or equipment', when: 'Varies', url: '' },
    ],
  },
  {
    region: 'Examples from different countries', id: 'examples',
    note: 'Real schemes that show the kind of fund to look for where you live.',
    items: [
      { name: 'Australia: community sport funding', who: 'Federal and state programmes for community clubs, such as the New South Wales Local Sport Grant Program.', amount: 'Varies by programme', when: 'Yearly rounds', url: 'https://www.infrastructure.gov.au/sport/community-sport' },
      { name: 'Ireland: Local Sports Partnership club grants', who: 'County-level grants for equipment, coaching courses and new participants.', amount: 'A few hundred to a few thousand euro', when: 'Usually once a year', url: 'https://www.sportireland.ie/participation/lsp-contact-finder' },
      { name: 'United Kingdom: National Lottery Awards for All', who: 'Community groups and clubs; each UK nation has its own version.', amount: '£300 to £20,000', when: 'Open all year', url: 'https://www.tnlcommunityfund.org.uk/funding/funding-programmes/national-lottery-awards-for-all-scotland' },
      { name: 'Paddle UK: Stronger Together Fund', who: 'An example of a national canoe federation funding its own clubs: on-water sessions for new paddlers and training for volunteers.', amount: 'Several thousand pounds per project', when: 'Check for current rounds', url: 'https://paddleuk.org.uk/funding-for-paddling-projects/' },
    ],
  },
];

// Tips for grant applications (anywhere)
const TIPS = [
  'Be a properly set-up club: written rules or a constitution, a committee, and a club bank account. Most funders require this.',
  'Affiliate to your national canoe federation. Many funds only accept clubs that are members of a recognised federation.',
  'Have a safeguarding (child protection) policy and a trained contact person if you have junior members.',
  'Ask your federation\'s development officer to read your application before you send it.',
  'Show numbers: how many new players, sessions, women, juniors or disabled paddlers the money will reach.',
  'Get written quotes for equipment and keep photos of your club in action.',
  'Plan your own contribution. Many funds ask you to pay part of the cost yourself.',
  'Report back after you receive a grant. Funders are much more likely to support you again.',
];

module.exports = { LAST_CHECKED, ORGANISATIONS, NATIONAL, FUNDRAISING, GRANTS, TIPS };
