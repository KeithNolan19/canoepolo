// Map view of tournaments. No map tiles and no third parties: the country shapes (Natural Earth, public domain,
// via the world-atlas package) are drawn by this server as plain SVG, so visitors send nothing anywhere.
const { geoPath, geoConicConformal, geoNaturalEarth1 } = require('d3-geo');
const { feature } = require('topojson-client');

// Approximate [latitude, longitude] of towns. Anything not listed falls back to the middle of its country.
const CITIES = {
  'natters': [47.2, 11.38], 'salzburg': [47.8, 13.04], 'vienna': [48.21, 16.37], 'oxenford': [-27.89, 153.31],
  'gent': [51.05, 3.72], 'turnhout': [51.32, 4.95], 'pfyn': [47.6, 8.97], 'rapperswil-jona': [47.23, 8.82],
  'berlin': [52.52, 13.4], 'braunschweig': [52.27, 10.52], 'bremen': [53.08, 8.8], 'cologne': [50.94, 6.96],
  'darmstadt': [49.87, 8.65], 'duisburg': [51.43, 6.76], 'ennepetal': [51.3, 7.35], 'erftstadt': [50.82, 6.8],
  'essen': [51.46, 7.01], 'glauchau': [50.82, 12.54], 'hamburg': [53.55, 9.99], 'hannover': [52.37, 9.74],
  'kiel': [54.32, 10.14], 'mannheim': [49.49, 8.47], 'oberschleißheim': [48.25, 11.56], 'philippsburg': [49.24, 8.46],
  'pirna': [50.96, 13.94], 'troisdorf': [50.82, 7.16], 'wetter': [51.39, 7.39], 'würzburg': [49.79, 9.95],
  'thury-harcourt': [48.98, -0.47], 'cheadle': [53.39, -2.19], 'edinburgh': [55.95, -3.19], 'london': [51.51, -0.13],
  'long eaton': [52.9, -1.27], 'north west and central england': [53.0, -2.5], 'penrith': [54.66, -2.75],
  'scotland': [56.5, -4.2], 'south east england': [51.1, 0.3], 'south west england': [50.9, -3.5],
  'united kingdom': [52.5, -1.8], 'yorkshire': [53.95, -1.3], 'milan': [45.46, 9.19], 'awara': [36.21, 136.23],
  'amersfoort': [52.16, 5.39], 'amstelveen': [52.3, 4.86], 'deventer': [52.25, 6.16], 'haren': [53.17, 6.6],
  'helmond': [51.48, 5.66], 'hoofddorp': [52.3, 4.69], 'leeuwarden': [53.2, 5.8], 'leiderdorp': [52.16, 4.54],
  'nijmegen': [51.84, 5.86], 'stadskanaal': [52.99, 6.96], 'kristiansand': [58.15, 8.02], 'larvik': [59.05, 10.03],
  'oslo': [59.91, 10.75], 'hastings': [-39.64, 176.84], 'palmerston north': [-40.36, 175.61],
  'czechowice-dziedzice': [49.91, 18.99], 'kalisz': [51.76, 18.09], 'kaniów': [49.93, 19.0], 'katowice': [50.26, 19.02],
  'setúbal': [38.52, -8.89], 'singapore': [1.35, 103.82],
  'zurich': [47.38, 8.54], 'warsaw': [52.23, 21.01], 'prague': [50.08, 14.44], 'copenhagen': [55.68, 12.57],
  'brussels': [50.85, 4.35], 'paris': [48.86, 2.35], 'madrid': [40.42, -3.7], 'rome': [41.9, 12.5], 'lisbon': [38.72, -9.14],
  'dublin': [53.35, -6.26], 'belfast': [54.6, -5.93], 'amsterdam': [52.37, 4.9], 'rotterdam': [51.92, 4.48],
  'stockholm': [59.33, 18.07], 'helsinki': [60.17, 24.94], 'budapest': [47.5, 19.04], 'bratislava': [48.15, 17.11],
  'sydney': [-33.87, 151.21], 'melbourne': [-37.81, 144.96], 'brisbane': [-27.47, 153.03], 'auckland': [-36.85, 174.76],
  'munich': [48.14, 11.58], 'frankfurt': [50.11, 8.68], 'stuttgart': [48.78, 9.18], 'dresden': [51.05, 13.74],
  'leipzig': [51.34, 12.37], 'nuremberg': [49.45, 11.08], 'duesseldorf': [51.23, 6.78], 'düsseldorf': [51.23, 6.78],
};

// Middle of each country, used when the town is not known (pins show as approximate).
const COUNTRIES_LL = {
  AR: [-34, -64], AU: [-25, 134], AT: [47.5, 14.5], BE: [50.6, 4.6], BR: [-10, -52], CA: [56, -96], CN: [35, 103],
  HR: [45.1, 15.2], CZ: [49.8, 15.5], DK: [56, 10], EG: [26.5, 30], FI: [64, 26], FR: [46.6, 2.5], GR: [39, 22],
  DE: [51.2, 10.4], GB: [53.5, -2], HK: [22.3, 114.17], HU: [47.2, 19.5], IN: [22, 79], IR: [32, 53], IE: [53.2, -8],
  IT: [42.8, 12.5], JP: [36, 138], LU: [49.8, 6.1], MY: [4.2, 102], NL: [52.2, 5.5], NZ: [-41, 174], NO: [61, 9],
  PL: [52, 19.4], PT: [39.6, -8], RU: [60, 90], SG: [1.35, 103.82], SK: [48.7, 19.5], SI: [46.1, 14.8],
  ZA: [-29, 24], KR: [36.5, 127.9], ES: [40.2, -3.7], SE: [62, 15], CH: [46.8, 8.2], TW: [23.7, 121],
  TR: [39, 35], UA: [49, 32], US: [39, -98],
};

function locate(city, country) {
  const c = String(city || '').toLowerCase().trim();
  const keys = [c, c.split(/\s*[\/(]/)[0].trim()];
  for (const k of keys) if (CITIES[k]) return { ll: CITIES[k], exact: true };
  return COUNTRIES_LL[country] ? { ll: COUNTRIES_LL[country], exact: false } : null;
}

const W = 800;
const VIEWS = {
  europe: { label: 'Europe', h: 640, make: () => geoConicConformal().parallels([40, 62]).rotate([-9, 0]).center([0, 50]).scale(1080).translate([W / 2, 345]) },
  world: { label: 'World', h: 420, make: () => geoNaturalEarth1().scale(150).translate([W / 2, 215]) },
};

let built = null;
function build() {
  if (built) return built;
  const topo50 = require('world-atlas/countries-50m.json');
  const topo110 = require('world-atlas/countries-110m.json');
  built = {};
  for (const [key, v] of Object.entries(VIEWS)) {
    const proj = v.make();
    const fc = feature(key === 'europe' ? topo50 : topo110, (key === 'europe' ? topo50 : topo110).objects.countries);
    const features = fc.features.filter((f) => f.id !== '010'); // no Antarctica
    proj.clipExtent([[0, 0], [W, v.h]]);
    const path = geoPath(proj).digits(1);
    built[key] = { proj, h: v.h, land: features.map((f) => path(f)).filter(Boolean).join('') };
  }
  return built;
}

// Groups tournaments by place and returns SVG pin positions for the chosen view.
function places(tournaments, view) {
  const b = build()[view];
  const byPlace = new Map();
  tournaments.forEach((t) => {
    const loc = locate(t.city, t.country);
    if (!loc) return;
    const key = `${loc.ll[0].toFixed(2)},${loc.ll[1].toFixed(2)}`;
    if (!byPlace.has(key)) byPlace.set(key, { ll: loc.ll, exact: loc.exact, label: loc.exact ? t.city : t.country_name, country: t.country, items: [] });
    byPlace.get(key).items.push(t);
  });
  const out = [];
  [...byPlace.values()].forEach((p) => {
    const xy = b.proj([p.ll[1], p.ll[0]]);
    if (!xy || xy[0] < 4 || xy[0] > W - 4 || xy[1] < 4 || xy[1] > b.h - 4) return;
    out.push({ ...p, x: Math.round(xy[0] * 10) / 10, y: Math.round(xy[1] * 10) / 10, r: Math.round(Math.min(8 + Math.sqrt(p.items.length) * 3, 22) * (view === 'world' ? 0.55 : 1) * 10) / 10 });
  });
  return { pins: out, outside: [...byPlace.values()].filter((p) => !out.find((o) => o.ll === p.ll)), land: b.land, h: b.h, w: W };
}

module.exports = { places, VIEWS, locate };
