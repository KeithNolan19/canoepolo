// Referee hand signals: descriptions (from the ICF canoe polo referee signals) and simple drawings.
// Drawings are diagrams of the referee seen from the front. Used by /referee and the quiz.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  // Each arm: [elbowX, elbowY, handX, handY, hand] in a 120 x 160 box, seen from the front.
  // Left shoulder (viewer's left) is at 44,52; right shoulder at 76,52.
  // hand: 'open' | 'fist' | 'point:<deg>' | 'spread' | 'thumb' | 'card:<colour>'
  const DOWN_L = [40, 80, 38, 104, 'open'];
  const DOWN_R = [80, 80, 82, 104, 'open'];
  const SIGNALS = [
    { id: 'start', name: 'Start of play / infringement', how: 'One arm forward and bent upwards, open palm facing sideways at head level. Blow the whistle.',
      L: DOWN_L, R: [92, 50, 92, 24, 'open'] },
    { id: 'time', name: 'End of half / full time', how: 'Both arms crossed in front of the chest, palms out.',
      L: [38, 78, 74, 62, 'open'], R: [82, 78, 46, 62, 'open'] },
    { id: 'goal', name: 'Goal', how: 'Both arms extended with palms together, pointing to the centre of the pitch.',
      L: [78, 66, 106, 66, 'open'], R: [92, 50, 106, 50, 'open'], extra: 'arrowR' },
    { id: 'disallowed', name: 'Goal disallowed', how: 'Arms crossed and uncrossed repeatedly at thigh level, palms open.',
      L: [44, 86, 74, 112, 'open'], R: [76, 86, 46, 112, 'open'], extra: 'wave' },
    { id: 'sideline', name: 'Side line throw / corner throw', how: 'Point at the side line with one arm; the other arm shows the direction of play.',
      L: [26, 52, 8, 52, 'open'], R: [90, 68, 102, 84, 'point:50'] },
    { id: 'goalline', name: 'Goal line throw', how: 'Open hand with the arm extended along the goal line; the other arm shows the direction of play.',
      L: [44, 30, 40, 8, 'open'], R: [94, 52, 114, 52, 'open'] },
    { id: 'timeout', name: 'Time out', how: 'Form a "T" with the hands above the head.',
      L: [28, 30, 49, 2, 'none'], R: [92, 30, 71, 2, 'none'], extra: 'T' },
    { id: 'refball', name: 'Referee\'s ball', how: 'Both arms forward at shoulder level, fists clenched, thumbs up.',
      L: [28, 72, 38, 54, 'thumb'], R: [92, 72, 82, 54, 'thumb'] },
    { id: 'obstruction', name: 'Obstruction / illegal holding', how: 'One arm straight up with the fist clenched for two seconds, then point to where the free shot is taken.',
      L: DOWN_L, R: [84, 32, 86, 10, 'fist'] },
    { id: 'tackle', name: 'Illegal tackle', how: 'Clenched fist held against the hip for two seconds, then point to where the free shot is taken.',
      L: DOWN_L, R: [92, 80, 76, 104, 'fist'] },
    { id: 'fivesec', name: 'Five seconds / illegal possession', how: 'Hand up at the side at head level, palm forward, all fingers spread for two seconds.',
      L: DOWN_L, R: [96, 62, 98, 34, 'spread'] },
    { id: 'paddle', name: 'Illegal use of paddle', how: 'Chop the upper arm repeatedly with the other hand for two seconds, then point to where the free shot is taken.',
      L: [50, 78, 94, 54, 'open'], R: [98, 52, 116, 52, 'open'], extra: 'chop' },
    { id: 'advantage', name: 'Play on / advantage', how: 'Elbow bent, hand pushed back and forth across the body at hip level at least three times; the other arm shows the direction of play.',
      L: [26, 52, 8, 52, 'open'], R: [88, 92, 66, 100, 'open'], extra: 'sweep' },
    { id: 'freethrow', name: 'Free throw', how: 'Arm extended in the direction of play, parallel to the side line, palm open. The other arm shows the offence.',
      L: DOWN_L, R: [96, 48, 116, 44, 'open'], noQuizImage: true },
    { id: 'freeshot', name: 'Free shot', how: 'Arm extended, index finger pointing at the goal in the direction of attack. The other arm shows the offence.',
      L: DOWN_L, R: [96, 52, 116, 52, 'point:0'] },
    { id: 'penalty', name: 'Goal penalty shot', how: 'Both arms extended, index fingers together, pointing at the goal.',
      L: [76, 66, 100, 66, 'point:0'], R: [92, 48, 102, 48, 'point:0'] },
    { id: 'card', name: 'Showing a card', how: 'Hold the card above the head and point at the player with the other arm.',
      L: [26, 54, 8, 58, 'point:190'], R: [86, 32, 84, 8, 'card:#f2b61f'] },
  ];

  // On the server (Node) only the data is needed.
  if (typeof module !== 'undefined' && module.exports) { module.exports = { SIGNALS }; return; }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function hand(g, x, y, kind, ink) {
    const [k, arg] = String(kind).split(':');
    if (k === 'none') return;
    if (k === 'fist') { el('circle', { cx: x, cy: y, r: 5.2, fill: ink }, g); return; }
    if (k === 'thumb') { el('circle', { cx: x, cy: y, r: 5, fill: ink }, g); el('line', { x1: x, y1: y - 3, x2: x, y2: y - 11, stroke: ink, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g); return; }
    if (k === 'point') {
      const a = Number(arg) * Math.PI / 180;
      el('circle', { cx: x, cy: y, r: 4.4, fill: ink }, g);
      el('line', { x1: x, y1: y, x2: x + Math.cos(a) * 11, y2: y + Math.sin(a) * 11, stroke: ink, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g);
      return;
    }
    if (k === 'card') {
      el('circle', { cx: x, cy: y + 4, r: 4.4, fill: ink }, g);
      el('rect', { x: x - 6, y: y - 14, width: 12, height: 16, rx: 1.5, fill: arg, stroke: ink, 'stroke-width': 1.2 }, g);
      return;
    }
    if (k === 'spread') {
      el('circle', { cx: x, cy: y, r: 5, fill: 'none', stroke: ink, 'stroke-width': 2.6 }, g);
      [-60, -30, 0, 30, 60].forEach((d) => {
        const a = (d - 90) * Math.PI / 180;
        el('line', { x1: x + Math.cos(a) * 5, y1: y + Math.sin(a) * 5, x2: x + Math.cos(a) * 11, y2: y + Math.sin(a) * 11, stroke: ink, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
      });
      return;
    }
    el('circle', { cx: x, cy: y, r: 5.5, fill: 'var(--sig-bg, #fff)', stroke: ink, 'stroke-width': 2.6 }, g);
  }

  function arm(g, sx, sy, a, ink) {
    const [ex, ey, hx, hy, h] = a;
    el('polyline', { points: `${sx},${sy} ${ex},${ey} ${hx},${hy}`, fill: 'none', stroke: 'var(--sig-bg, #fff)', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('polyline', { points: `${sx},${sy} ${ex},${ey} ${hx},${hy}`, fill: 'none', stroke: ink, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    hand(g, hx, hy, h, ink);
  }

  function draw(sig, opts = {}) {
    const ink = opts.ink || 'currentColor';
    const svg = el('svg', { viewBox: '-6 -12 132 172', class: 'sig-svg', role: 'img', 'aria-label': opts.label || 'Referee signal' });
    const g = el('g', {}, svg);
    // body: legs, shirt, head, whistle cord
    el('path', { d: 'M52 104 L50 152 M68 104 L70 152', stroke: ink, 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55 }, g);
    el('path', { d: 'M44 50 Q60 44 76 50 L72 106 L48 106 Z', fill: ink, opacity: 0.9 }, g);
    el('circle', { cx: 60, cy: 32, r: 11, fill: ink }, g);
    el('path', { d: 'M54 44 Q60 60 66 44', fill: 'none', stroke: 'var(--sig-bg, #fff)', 'stroke-width': 1.4, opacity: 0.7 }, g);
    // extras (movement marks)
    const mark = { fill: 'none', stroke: 'var(--sig-accent, #c48f00)', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (sig.extra === 'arrowR') el('path', { d: 'M100 76 H122 M116 70 L122 76 L116 82', ...mark }, g);
    if (sig.extra === 'wave') el('path', { d: 'M40 124 Q60 116 80 124 M40 130 Q60 122 80 130', ...mark }, g);
    if (sig.extra === 'chop') el('path', { d: 'M88 34 L94 44 M96 32 L102 42', ...mark }, g);
    if (sig.extra === 'sweep') el('path', { d: 'M58 116 H96 M62 112 L58 116 L62 120 M92 112 L96 116 L92 120', ...mark }, g);
    arm(g, 44, 52, sig.L, ink);
    arm(g, 76, 52, sig.R, ink);
    if (sig.extra === 'T') {
      el('path', { d: 'M46 0 H74 M60 0 V14', fill: 'none', stroke: ink, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
    }
    return svg;
  }

  window.CP_SIGNALS = { list: SIGNALS, byId: Object.fromEntries(SIGNALS.map((s) => [s.id, s])), draw };

  // Fill any <div data-signal="id"> on the page with its drawing.
  document.querySelectorAll('[data-signal]').forEach((box) => {
    const s = window.CP_SIGNALS.byId[box.dataset.signal];
    if (s) box.prepend(draw(s, { label: s.name }));
  });
})();
