// Lists used in forms and filters. Edit these freely to add countries, levels or divisions.
const COUNTRIES = {
  AR: 'Argentina', AU: 'Australia', AT: 'Austria', BE: 'Belgium', BR: 'Brazil', CA: 'Canada',
  CN: 'China', HR: 'Croatia', CZ: 'Czechia', DK: 'Denmark', EG: 'Egypt', FI: 'Finland',
  FR: 'France', DE: 'Germany', GB: 'Great Britain', HK: 'Hong Kong', HU: 'Hungary', IN: 'India',
  IR: 'Iran', IE: 'Ireland', IT: 'Italy', JP: 'Japan', LU: 'Luxembourg', MY: 'Malaysia',
  NL: 'Netherlands', NZ: 'New Zealand', NO: 'Norway', PL: 'Poland', PT: 'Portugal',
  RU: 'Russia', SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia', ZA: 'South Africa',
  KR: 'South Korea', ES: 'Spain', SE: 'Sweden', CH: 'Switzerland', TW: 'Chinese Taipei',
  TR: 'Türkiye', UA: 'Ukraine', US: 'United States',
};

const LEVELS = [
  'World Championships',
  'Continental Championships',
  'World Games',
  'International',
  'National Championships',
  'National League',
  'Club / Friendly',
];

const DIVISIONS = ['Men', 'Women', 'Mixed', 'U21 Men', 'U21 Women', 'U18', 'U16', 'Masters', 'Open'];

const STATUSES = ['published', 'draft', 'cancelled'];

function flag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}


module.exports = { COUNTRIES, LEVELS, DIVISIONS, STATUSES, flag };
