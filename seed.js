// Adds a few EXAMPLE tournaments so you can see how the site looks.
// Run with:  npm run seed      (delete them afterwards in the admin panel)
const T = require('./tournaments');

function inDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const examples = [
  { name: 'Example Open Cup', start_date: inDays(30), end_date: inDays(31), city: 'Dublin', country: 'IE', venue: 'Example Lake', level: 'International', divisions: ['Men', 'Women', 'U21 Men'], featured: 1, description: 'This is an example listing. Edit or delete it in the admin panel.' },
  { name: 'Example Masters Tournament', start_date: inDays(60), end_date: inDays(62), city: 'Essen', country: 'DE', level: 'International', divisions: ['Masters', 'Mixed'], description: 'Example listing.' },
  { name: 'Example National Championships', start_date: inDays(90), end_date: inDays(91), city: 'Nottingham', country: 'GB', level: 'National Championships', divisions: ['Men', 'Women', 'U18'], description: 'Example listing.' },
  { name: 'Example Past Tournament', start_date: inDays(-40), end_date: inDays(-39), city: 'Amsterdam', country: 'NL', level: 'Club / Friendly', divisions: ['Open'], description: 'Example listing in the past.' },
];

for (const ex of examples) {
  const { data, errors } = T.validate({ ...ex, status: 'published' });
  if (errors.length) { console.error(ex.name, errors); continue; }
  const t = T.create(data);
  console.log('Added', t.name, '→', `/tournaments/${t.slug}`);
}
