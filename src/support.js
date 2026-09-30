// Content for the Support & funding page (/support).
// Edit this file to add, remove or update organisations, fundraising ideas and grants.
// Amounts and deadlines change often: update LAST_CHECKED whenever you review the list.

const LAST_CHECKED = 'September 2026';

// Who to contact for help: governing bodies and sport organisations
const ORGANISATIONS = [
  { name: 'International Canoe Federation (ICF)', area: 'Worldwide', url: 'https://www.canoeicf.com/development', help: 'World governing body. Runs development programmes and coach education for national federations.' },
  { name: 'European Canoe Association (ECA)', area: 'Europe', url: 'https://www.canoe-europe.org/', help: 'Organises European Championships, including canoe polo for national teams and clubs.' },
  { name: 'Canoeing Ireland', area: 'Ireland', url: 'https://www.canoe.ie/', help: 'Club affiliation, coaching and referee courses, and grants such as PaddleAble.' },
  { name: 'Paddle UK (British Canoeing)', area: 'United Kingdom / England', url: 'https://paddleuk.org.uk/', help: 'Club affiliation, national canoe polo events, coaching bursaries and project funding.' },
  { name: 'Paddle Scotland', area: 'Scotland', url: 'https://www.paddlescotland.org.uk/canoe-polo', help: 'Scottish canoe polo, club support and access to sportscotland programmes.' },
  { name: 'Canoe Wales', area: 'Wales', url: 'https://www.canoewales.com/', help: 'Welsh governing body. Can help clubs with Sport Wales funding applications.' },
  { name: 'Kayakers.nl', area: 'Tournament software', url: 'https://www.kayakers.nl/', help: 'Free online tool to run tournaments: registration, schedules and live results.' },
];

// Practical ways for clubs and teams to raise money
const FUNDRAISING = [
  { title: 'Host a tournament', text: 'Entry fees, food stalls and a raffle at a well-run weekend tournament can fund a club for a season. Kayakers.nl handles the admin for free.' },
  { title: 'Local sponsorship', text: 'Offer local businesses their logo on shirts, boats, goal frames or your website in return for a yearly amount. A one-page sponsor pack with prices makes it easy to say yes.' },
  { title: 'Crowdfunding for travel', text: 'Raising money for a team trip to a European or World Championships works well on crowdfunding sites. Share photos, the squad list and exactly what the money pays for.' },
  { title: 'Club draw or lotto', text: 'A weekly club lotto or 50/50 draw gives steady income. Check the local rules first: most countries require a permit or licence for lotteries and raffles.' },
  { title: 'Taster sessions and "have a go" days', text: 'Paid try-canoe-polo sessions for schools, scouts, universities and companies bring in money and new members at the same time.' },
  { title: 'Kit and merchandise', text: 'Club hoodies, rash vests and helmet stickers sell well at tournaments. Order in small batches to avoid stock left over.' },
  { title: 'Sell or rent spare equipment', text: 'Older boats, paddles and helmets can be sold to newer clubs or rented to visiting teams at tournaments.' },
  { title: 'Employer matched giving', text: 'Many employers match money raised by staff for clubs they volunteer with. Ask your members to check with their HR department.' },
  { title: 'Tax-efficient donations', text: 'In the UK, clubs registered as a CASC or charity can claim Gift Aid on donations. Check what is available in your country.' },
];

// Grant routes, grouped by region. amount/when are short summaries, not guarantees.
const GRANTS = [
  {
    region: 'Europe-wide', id: 'europe',
    note: 'Open to organisations in EU member states and countries associated with Erasmus+. Check whether your country is eligible.',
    items: [
      { name: 'Erasmus+ Sport: Small-scale Partnerships', who: 'Grassroots clubs working with at least one partner club in another country (e.g. an exchange, inclusion or coaching project).', amount: 'Lump sum of €30,000 or €60,000', when: 'Yearly round. The 2026 deadline was 5 March 2026.', url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-organisations/sport-actions/small-scale-partnerships' },
      { name: 'Erasmus+ Sport: staff mobility', who: 'Coaches, referees, volunteers and staff of sport organisations training or job-shadowing abroad.', amount: 'Travel and subsistence', when: 'Applied for through your national Erasmus+ agency. The 2026 deadline was 12 February 2026.', url: 'https://erasmus-plus.ec.europa.eu/programme-guide/sport' },
      { name: 'Erasmus+ Sport: not-for-profit European sport events', who: 'Organisers of larger European grassroots sport events.', amount: 'Varies', when: 'Yearly round, usually closes in March.', url: 'https://erasmus-plus.ec.europa.eu/programme-guide/sport' },
    ],
  },
  {
    region: 'Ireland', id: 'ireland',
    items: [
      { name: 'Community Sport Facilities Fund (formerly Sports Capital and Equipment Programme)', who: 'Not-for-profit clubs. Covers facilities and sports equipment such as boats and goals. You need to contribute part of the cost yourself.', amount: 'Equipment-only grants; larger sums for facilities', when: 'Rounds announced by the Department of Culture, Communications and Sport.', url: 'https://www.gov.ie/en/department-of-culture-communications-and-sport/services/sports-capital/' },
      { name: 'Local Sports Partnership club grants', who: 'Clubs in each county. Small grants for equipment, coaching courses and new participants.', amount: 'Typically a few hundred to a few thousand euro', when: 'Each county runs its own scheme, often once a year.', url: 'https://www.sportireland.ie/participation/lsp-contact-finder' },
      { name: 'Canoeing Ireland: PaddleAble', who: 'Canoeing Ireland clubs supporting new members with disabilities (coaching, adapted equipment, transport, fees).', amount: 'Up to €400 per member supported', when: 'Current round closes 11 October 2026.', url: 'https://www.canoe.ie/2026/09/25/paddleable-funding-application-for-canoeing-ireland-clubs/' },
    ],
  },
  {
    region: 'United Kingdom', id: 'uk',
    items: [
      { name: 'National Lottery Awards for All', who: 'Community groups and clubs in England, Scotland, Wales and Northern Ireland (each nation has its own version on the Community Fund site).', amount: '£300 to £20,000', when: 'Open all year. Decisions in about 12 weeks.', url: 'https://www.tnlcommunityfund.org.uk/funding/funding-programmes/national-lottery-awards-for-all-scotland' },
      { name: 'Sport England: Movement Fund', who: 'Clubs in England getting more people active, especially groups who face barriers to sport.', amount: 'Up to £15,000', when: 'Open all year.', url: 'https://www.sportengland.org/funding-and-campaigns/our-funding/movement-fund' },
      { name: 'Sport Wales: Be Active Wales Fund', who: 'Not-for-profit clubs in Wales. Covers equipment, coaching courses and venue hire for new teams.', amount: '£300 to £50,000 (you contribute 10 to 20%)', when: 'Application windows through the year.', url: 'https://www.sport.wales/grants-and-funding/beactivewalesfund/' },
      { name: 'sportscotland: Club Support Programme', who: 'Clubs in Scotland, applying through their governing body or local authority, for paid roles such as coaches or development officers.', amount: 'Varies', when: 'Ask Paddle Scotland or your local authority.', url: 'https://sportscotland.org.uk/funding/additional-government-investment-2026/club-support-programme' },
      { name: 'Northern Ireland sports funding list (NISF)', who: 'Clubs in Northern Ireland. Up-to-date list of Sport NI, council and business funds.', amount: 'Varies', when: 'Many funds open at different times of year.', url: 'https://nisf.net/funding/' },
      { name: 'Paddle UK: Stronger Together Fund and coaching bursaries', who: 'Paddle UK affiliated clubs: on-water sessions for new paddlers and training for volunteer coaches and leaders.', amount: 'Several thousand pounds per project', when: 'Check Paddle UK for current rounds.', url: 'https://paddleuk.org.uk/funding-for-paddling-projects/' },
      { name: 'Paddle Trust (formerly Canoe Foundation)', who: 'Clubs and groups improving access to water: pontoons, launch sites, portage paths. Does not fund equipment or coaching.', amount: '£500 to £10,000', when: 'Funding windows announced by the Trust.', url: 'https://www.paddletrust.org.uk/' },
    ],
  },
  {
    region: 'Other European countries', id: 'other',
    items: [
      { name: 'Your national canoe federation', who: 'Most federations have club development staff and know the grants in your country. Start here.', amount: '', when: '', url: 'https://www.canoe-europe.org/' },
      { name: 'National sports council or Olympic committee', who: 'Usually runs or distributes national lottery and government sport funding.', amount: '', when: '', url: '' },
      { name: 'Your city or regional council', who: 'Many councils have small sport or community grants for equipment, events and youth sport.', amount: '', when: '', url: '' },
    ],
  },
];

// Tips for grant applications
const TIPS = [
  'Be a properly set-up club: a written constitution, a committee, and a club bank account. Most funders require this.',
  'Have a safeguarding (child protection) policy and trained officer if you have junior members.',
  'Ask your national federation\'s development officer to read your application before you send it.',
  'Show numbers: how many new players, sessions, women, juniors or disabled paddlers the money will reach.',
  'Get written quotes for equipment and keep photos of your club in action.',
  'Plan your own contribution. Many funds ask you to pay 5 to 20% of the cost.',
  'Report back after you receive a grant. Funders are much more likely to support you again.',
];

module.exports = { LAST_CHECKED, ORGANISATIONS, FUNDRAISING, GRANTS, TIPS };
