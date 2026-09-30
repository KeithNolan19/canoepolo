// canoepolo.eu tactics board. Everything runs in the browser; nothing is sent to the server.
// Units are metres: the pitch is 35 x 23 with goal lines at x = 0 and x = 35.
(function () {
  'use strict';
  const svg = document.getElementById('tb-pitch');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const W = 35, H = 23, CY = H / 2;
  const BOAT_L = 3, BOAT_W = 0.62;
  const COLORS = {
    water: '#2c7fb8', waterDeep: '#236b9c', line: '#ffffff',
    r: '#e23b32', rText: '#ffffff', w: '#ffffff', wText: '#0b2545',
    ball: '#f2b61f', run: '#ffffff', pass: '#f2b61f', shot: '#ffd84d', sel: '#f2b61f',
  };
  const TEAMS = { r: 'Red', w: 'White' };
  const IDS = ['r1', 'r2', 'r3', 'r4', 'r5', 'w1', 'w2', 'w3', 'w4', 'w5'];

  // ---------- Presets (Red attacks the right-hand goal) ----------
  const P = (list) => { const o = {}; IDS.forEach((id, i) => { o[id] = list[i]; }); return o; };
  const step = (pos, ball, arrows = [], note = '') => ({ pos: P(pos), ball, arrows, note });
  const A = (k, x1, y1, x2, y2) => ({ k, x1, y1, x2, y2 });

  const PRESETS = {
    kickoff: {
      name: 'Kick-off sprint',
      steps: [
        step([[0.8, 3.5, 0], [0.8, 7.5, 0], [0.8, 11.5, 0], [0.8, 15.5, 0], [0.8, 19.5, 0],
              [34.2, 3.5, 180], [34.2, 7.5, 180], [34.2, 11.5, 180], [34.2, 15.5, 180], [34.2, 19.5, 180]],
          [17.5, 11.5], [A('run', 2.5, 11.5, 15, 11.5), A('run', 32.5, 11.5, 20, 11.5)],
          'Both teams line up on their own goal line. The referee throws the ball into the middle and one sprinter from each team races for it.'),
        step([[6, 4.5, 10], [7, 8, 5], [15.8, 11.5, 0], [6, 15, -5], [4, 19, -10],
              [29, 4.5, 170], [28, 8, 175], [19.2, 11.5, 180], [29, 15, 185], [31, 19, 190]],
          [17.5, 11.5], [], 'The sprinters arrive together; everyone else moves up to support or drops back to defend.'),
      ],
    },
    zone: {
      name: 'Zone defence',
      steps: [
        step([[24.5, 11.5, 0], [25.2, 4.2, 20], [26, 19, -20], [21, 7.5, 10], [21, 15.5, -10],
              [34, 11.5, 180], [31, 8.5, 200], [31, 14.5, 160], [28.3, 6.3, 205], [28.3, 16.7, 155]],
          [25.6, 11.1], [A('pass', 25.6, 10.7, 25.6, 5.1), A('pass', 25.6, 11.9, 26.1, 18.1)],
          'White keeps a compact shape. The goalkeeper sits under the goal with the paddle up; two players guard the posts and two press anyone who gets close.'),
        step([[24.5, 11.5, 0], [26, 4.5, 20], [26, 19, -20], [21, 7.5, 10], [21, 15.5, -10],
              [34, 11.1, 185], [31, 8.5, 205], [31, 14.5, 160], [27.9, 6.4, 235], [28.3, 16.7, 155]],
          [26.9, 5.1], [A('run', 28.2, 6.9, 27.5, 5.9)],
          'The ball goes wide. The nearest outside defender closes down the shooter and the goalkeeper shifts across.'),
      ],
    },
    screen: {
      name: 'Screen for a shot',
      steps: [
        step([[23.5, 12, 0], [25, 4.8, 20], [25, 18.8, -20], [21, 8, 0], [22, 16, 0],
              [34, 11.5, 180], [31, 9, 200], [31, 14.5, 160], [28.5, 6.5, 200], [28.5, 16.5, 160]],
          [24.6, 12], [A('run', 22, 16, 29.5, 13.2), A('run', 23.5, 12, 26.5, 11.3)],
          'Number 5 paddles in to set a screen next to the defender on the post, while the ball carrier moves into the space.'),
        step([[26.5, 11.3, 10], [25, 4.8, 20], [25, 18.8, -20], [21, 8, 0], [29, 13.1, 15],
              [34, 11.6, 180], [31.3, 9.3, 200], [30.8, 15.1, 150], [28.5, 6.5, 200], [28.5, 16.5, 160]],
          [27.6, 11.1], [A('shot', 27.9, 11.1, 35, 11.2)],
          'With the defender blocked, the shooter has a clear line past the goalkeeper\'s paddle.'),
      ],
    },
    fastbreak: {
      name: 'Fast break',
      steps: [
        step([[12, 11.5, 0], [8, 5, 0], [8, 18, 0], [5, 9, 0], [5, 14, 0],
              [22, 11.5, 180], [18, 5, 180], [18, 18, 180], [26, 9, 180], [27, 14, 180]],
          [13, 11.5], [A('pass', 13, 11.5, 17.5, 4.3), A('run', 8, 5, 19, 4.5), A('run', 8, 18, 22, 17.5)],
          'Red wins the ball in their own half. Two paddlers sprint wide and the first pass goes long down the side.'),
        step([[17, 10, 0], [20, 4.5, 0], [23, 17.5, 0], [11, 9, 0], [11, 14, 0],
              [23, 10.5, 180], [24, 6.5, 160], [26, 14.5, 190], [31, 10.5, 180], [33.8, 11.5, 180]],
          [21, 4.6], [A('pass', 21, 4.6, 24, 16.8), A('run', 23, 17.5, 28.5, 14.5)],
          'Pass across before the defence settles. Three attackers against two defenders.'),
        step([[21, 10, 0], [25, 7.5, 10], [28.5, 14.5, -20], [15, 9, 0], [15, 14, 0],
              [26, 10.2, 200], [27.6, 5.6, 160], [30.8, 10.6, 200], [31.8, 16.2, 160], [34, 11.5, 180]],
          [29.3, 14.2], [A('shot', 29.3, 14.2, 35, 11.4)],
          'The receiver shoots early, before the goalkeeper is set.'),
      ],
    },
    press: {
      name: 'Press (one-on-one marking)',
      steps: [
        step([[14, 11.5, 0], [12, 5, 0], [12, 18, 0], [9, 8.5, 0], [9, 15, 0],
              [16.3, 12.8, 190], [13.6, 6.3, 185], [13.6, 16.8, 175], [10.6, 9.8, 180], [10.6, 13.7, 180]],
          [15, 11.5], [],
          'White marks one-on-one high up the pitch to force a mistake. Risky: one missed tackle leaves space behind.'),
      ],
    },
    blank: {
      name: 'Blank pitch',
      steps: [
        step([[4, 3.5, 0], [4, 7.5, 0], [4, 11.5, 0], [4, 15.5, 0], [4, 19.5, 0],
              [31, 3.5, 180], [31, 7.5, 180], [31, 11.5, 180], [31, 15.5, 180], [31, 19.5, 180]],
          [17.5, 11.5]),
      ],
    },
  };

  // ---------- State ----------
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let state = { steps: clone(PRESETS.zone.steps), cur: 0 };
  let tool = 'move';
  let selected = null; // player id or 'ball'
  let undoStack = [];
  let playing = false;

  const $ = (id) => document.getElementById(id);
  const statusEl = $('tb-status');
  const say = (msg) => { statusEl.textContent = msg; clearTimeout(say.t); say.t = setTimeout(() => { statusEl.textContent = ''; }, 3500); };
  const S = () => state.steps[state.cur];

  function snapshot() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 60) undoStack.shift();
  }
  function commit() { save(); render(); }

  // ---------- Save / load (browser storage + share links) ----------
  const r1 = (n) => Math.round(n * 10) / 10;
  function pack() {
    return {
      v: 1,
      s: state.steps.map((st) => ({
        p: IDS.map((id) => st.pos[id].map(r1)),
        b: st.ball.map(r1),
        a: st.arrows.map((a) => [a.k[0], r1(a.x1), r1(a.y1), r1(a.x2), r1(a.y2)]),
        n: st.note || '',
      })),
    };
  }
  const KINDS = { r: 'run', p: 'pass', s: 'shot' };
  function unpack(o) {
    if (!o || o.v !== 1 || !Array.isArray(o.s) || !o.s.length || o.s.length > 30) throw new Error('bad');
    const num = (n, lo, hi) => { n = Number(n); if (!Number.isFinite(n)) throw new Error('bad'); return Math.min(hi, Math.max(lo, n)); };
    return {
      cur: 0,
      steps: o.s.map((st) => {
        const pos = {};
        IDS.forEach((id, i) => { const q = st.p[i]; pos[id] = [num(q[0], -2, W + 2), num(q[1], -2, H + 2), num(q[2], -720, 720)]; });
        return {
          pos,
          ball: [num(st.b[0], -2, W + 2), num(st.b[1], -2, H + 2)],
          arrows: (st.a || []).slice(0, 40).map((a) => ({ k: KINDS[a[0]] || 'run', x1: num(a[1], -3, 38), y1: num(a[2], -3, 26), x2: num(a[3], -3, 38), y2: num(a[4], -3, 26) })),
          note: String(st.n || '').slice(0, 400),
        };
      }),
    };
  }
  const b64 = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

  function save() {
    try { localStorage.setItem('cp-tactics', JSON.stringify(pack())); } catch (e) { /* storage unavailable: fine */ }
  }
  function load() {
    const m = location.hash.match(/^#play=([A-Za-z0-9_-]+)$/);
    if (m) {
      try { state = unpack(JSON.parse(unb64(m[1]))); say('Loaded a shared play.'); return; } catch (e) { say('That share link looks broken, so a preset was loaded instead.'); }
    }
    try {
      const raw = localStorage.getItem('cp-tactics');
      if (raw) state = unpack(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }

  // ---------- Drawing ----------
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  let layer; // everything that changes lives in here
  function drawPitch() {
    svg.textContent = '';
    el('title', {}, svg).textContent = 'Canoe polo pitch';
    const defs = el('defs', {}, svg);
    ['run', 'pass', 'shot'].forEach((k) => {
      const mk = el('marker', { id: `ah-${k}`, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '4', markerHeight: '4', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: COLORS[k] }, mk);
    });
    el('rect', { x: -2.5, y: -2.5, width: 40, height: 28, fill: COLORS.waterDeep }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: COLORS.water, stroke: COLORS.line, 'stroke-width': 0.12 }, svg);
    const lines = el('g', { stroke: COLORS.line, 'stroke-width': 0.08, fill: 'none', opacity: 0.75 }, svg);
    el('line', { x1: W / 2, y1: 0, x2: W / 2, y2: H }, lines);
    [6, W - 6].forEach((x) => el('line', { x1: x, y1: 0, x2: x, y2: H, 'stroke-dasharray': '0.5 0.35' }, lines));
    el('circle', { cx: W / 2, cy: CY, r: 0.25, fill: COLORS.line, stroke: 'none' }, lines);
    const labels = el('g', { fill: COLORS.line, 'font-size': 0.7, 'font-family': 'Barlow, sans-serif', opacity: 0.8 }, svg);
    el('text', { x: 6, y: H + 1.1, 'text-anchor': 'middle' }, labels).textContent = '6 m';
    el('text', { x: W - 6, y: H + 1.1, 'text-anchor': 'middle' }, labels).textContent = '6 m';
    el('text', { x: W / 2, y: H + 1.1, 'text-anchor': 'middle' }, labels).textContent = '35 × 23 m';
    // Goals: 1.5 m wide frames hanging 2 m above the water on each goal line
    [[0, -1], [W, 1]].forEach(([x, d]) => {
      el('rect', { x: d < 0 ? x - 0.45 : x - 0.05, y: CY - 0.75, width: 0.5, height: 1.5, fill: 'rgba(255,255,255,.25)', stroke: COLORS.line, 'stroke-width': 0.1 }, svg);
    });
    layer = el('g', {}, svg);
  }

  function boatPath() {
    const L = BOAT_L / 2, w = BOAT_W / 2;
    return `M ${-L} 0 C ${-L + 0.2} ${-w} ${-L + 0.6} ${-w} ${-L + 1} ${-w} L ${L - 1} ${-w} C ${L - 0.6} ${-w} ${L - 0.2} ${-w} ${L} 0 C ${L - 0.2} ${w} ${L - 0.6} ${w} ${L - 1} ${w} L ${-L + 1} ${w} C ${-L + 0.6} ${w} ${-L + 0.2} ${w} ${-L} 0 Z`;
  }
  const BOAT = boatPath();

  function render(frame) {
    const st = frame || S();
    const hadFocus = svg.contains(document.activeElement);
    layer.textContent = '';
    if (hadFocus && selected && !frame) queueMicrotask(focusSelected);
    // arrows first so boats sit on top
    if (!frame) st.arrows.forEach((a, i) => drawArrow(a, i));
    IDS.forEach((id) => drawBoat(id, st.pos[id]));
    drawBall(st.ball);
    if (!frame) renderSteps();
  }

  function drawArrow(a, i) {
    const g = el('g', { class: 'tb-arrow', 'data-arrow': i }, layer);
    const d = `M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`;
    el('path', { d, stroke: 'transparent', 'stroke-width': 1, fill: 'none' }, g); // wide hit area for erasing
    el('path', {
      d, fill: 'none', stroke: COLORS[a.k], 'stroke-width': a.k === 'shot' ? 0.2 : 0.14,
      'stroke-dasharray': a.k === 'pass' ? '0.45 0.3' : 'none', 'stroke-linecap': 'round',
      'marker-end': `url(#ah-${a.k})`,
    }, g);
  }

  function drawBoat(id, p) {
    const [x, y, ang] = p;
    const team = id[0], n = id.slice(1);
    const g = el('g', {
      class: 'tb-boat' + (selected === id ? ' is-sel' : ''), 'data-id': id, tabindex: 0, role: 'button',
      'aria-label': `${TEAMS[team]} ${n}`, transform: `translate(${x} ${y}) rotate(${ang})`,
    }, layer);
    el('rect', { x: -1.8, y: -0.8, width: 3.6, height: 1.6, fill: 'transparent' }, g); // bigger touch target
    if (selected === id) el('path', { d: BOAT, fill: 'none', stroke: COLORS.sel, 'stroke-width': 0.28 }, g);
    el('path', { d: BOAT, fill: COLORS[team], stroke: team === 'w' ? '#0b2545' : '#7a1510', 'stroke-width': 0.06 }, g);
    el('circle', { cx: 0, cy: 0, r: 0.42, fill: team === 'w' ? '#0b2545' : '#ffffff', opacity: 0.18 }, g);
    const t = el('text', {
      x: 0, y: 0.02, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 0.62, 'font-weight': 700,
      'font-family': 'Barlow, sans-serif', fill: COLORS[team + 'Text'], transform: `rotate(${-ang})`,
    }, g);
    t.textContent = n;
    // turning handle at the bow
    el('circle', { class: 'tb-handle', 'data-rot': id, cx: BOAT_L / 2 + 0.25, cy: 0, r: selected === id ? 0.3 : 0.2, fill: COLORS.sel, stroke: '#0b2545', 'stroke-width': 0.05, opacity: selected === id ? 1 : 0.55 }, g);
  }

  function drawBall(b) {
    const g = el('g', { class: 'tb-ball' + (selected === 'ball' ? ' is-sel' : ''), 'data-id': 'ball', tabindex: 0, role: 'button', 'aria-label': 'Ball', transform: `translate(${b[0]} ${b[1]})` }, layer);
    el('circle', { r: 0.9, fill: 'transparent' }, g); // bigger touch target
    if (selected === 'ball') el('circle', { r: 0.55, fill: 'none', stroke: '#ffffff', 'stroke-width': 0.1 }, g);
    el('circle', { r: 0.34, fill: COLORS.ball, stroke: '#7a5a00', 'stroke-width': 0.06 }, g);
    el('path', { d: 'M -0.34 0 Q 0 -0.15 0.34 0 M 0 -0.34 Q 0.12 0 0 0.34', fill: 'none', stroke: '#7a5a00', 'stroke-width': 0.04 }, g);
  }

  // ---------- Steps UI ----------
  function renderSteps() {
    const list = $('tb-steplist');
    list.textContent = '';
    state.steps.forEach((_, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tb-stepbtn' + (i === state.cur ? ' on' : '');
      b.textContent = i + 1;
      b.setAttribute('aria-label', `Step ${i + 1}`);
      if (i === state.cur) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', () => { if (playing) return; state.cur = i; selected = null; commit(); });
      li.appendChild(b);
      list.appendChild(li);
    });
    $('tb-delstep').disabled = state.steps.length < 2;
    const note = $('tb-note');
    if (document.activeElement !== note) note.value = S().note || '';
  }

  // ---------- Pointer handling ----------
  function toPitch(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }
  const clampX = (x) => Math.min(W + 1.5, Math.max(-1.5, x));
  const clampY = (y) => Math.min(H + 1.5, Math.max(-1.5, y));

  let drag = null;
  svg.addEventListener('pointerdown', (evt) => {
    if (playing || evt.button > 0) return;
    const [x, y] = toPitch(evt);
    const t = evt.target;
    if (tool === 'erase') {
      const a = t.closest('[data-arrow]');
      if (a) { snapshot(); S().arrows.splice(Number(a.dataset.arrow), 1); commit(); }
      return;
    }
    if (tool !== 'move') {
      // start a line: from a boat's centre if the press started on one
      const b = t.closest('[data-id]');
      let sx = x, sy = y;
      if (b) { const p = b.dataset.id === 'ball' ? S().ball : S().pos[b.dataset.id]; sx = p[0]; sy = p[1]; }
      drag = { kind: 'line', x1: sx, y1: sy, x2: x, y2: y };
      svg.setPointerCapture(evt.pointerId);
      evt.preventDefault();
      return;
    }
    const rot = t.closest('[data-rot]');
    const obj = t.closest('[data-id]');
    if (rot) {
      selected = rot.dataset.rot;
      snapshot();
      drag = { kind: 'rotate', id: selected };
    } else if (obj) {
      selected = obj.dataset.id;
      const p = selected === 'ball' ? S().ball : S().pos[selected];
      snapshot();
      drag = { kind: 'move', id: selected, dx: p[0] - x, dy: p[1] - y, moved: false };
    } else {
      selected = null; render(); return;
    }
    svg.setPointerCapture(evt.pointerId);
    evt.preventDefault();
    render();
    focusSelected();
  });

  svg.addEventListener('pointermove', (evt) => {
    if (!drag) return;
    const [x, y] = toPitch(evt);
    if (drag.kind === 'move') {
      drag.moved = true;
      const nx = clampX(x + drag.dx), ny = clampY(y + drag.dy);
      if (drag.id === 'ball') S().ball = [nx, ny];
      else { const p = S().pos[drag.id]; p[0] = nx; p[1] = ny; }
      render();
    } else if (drag.kind === 'rotate') {
      const p = S().pos[drag.id];
      p[2] = Math.round(Math.atan2(y - p[1], x - p[0]) * 180 / Math.PI);
      render();
    } else if (drag.kind === 'line') {
      drag.x2 = x; drag.y2 = y;
      render();
      drawArrow({ k: tool, x1: drag.x1, y1: drag.y1, x2: x, y2: y }, -1);
    }
  });

  function endDrag() {
    if (!drag) return;
    if (drag.kind === 'line') {
      const len = Math.hypot(drag.x2 - drag.x1, drag.y2 - drag.y1);
      if (len > 0.8) { snapshot(); S().arrows.push({ k: tool, x1: drag.x1, y1: drag.y1, x2: clampX(drag.x2), y2: clampY(drag.y2) }); }
    } else if (drag.kind === 'move' && !drag.moved) {
      undoStack.pop(); // a click, not a move
    }
    drag = null;
    commit();
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  // Keyboard: select with Tab/Enter, move with arrows, turn with Q/E
  svg.addEventListener('focusin', (evt) => {
    const obj = evt.target.closest && evt.target.closest('[data-id]');
    if (obj && selected !== obj.dataset.id) { selected = obj.dataset.id; render(); focusSelected(); }
  });
  function focusSelected() {
    const e = svg.querySelector(`[data-id="${selected}"]`);
    if (e) e.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', (evt) => {
    if (playing) return;
    const tag = (evt.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
    if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'z') { evt.preventDefault(); undo(); return; }
    const keyTool = { m: 'move', r: 'run', p: 'pass', s: 'shot', e: 'erase' }[evt.key.toLowerCase()];
    if (!selected || !svg.contains(document.activeElement)) {
      if (keyTool && !evt.ctrlKey && !evt.metaKey && !evt.altKey) setTool(keyTool);
      return;
    }
    const stepM = evt.shiftKey ? 2 : 0.5;
    const d = { ArrowLeft: [-stepM, 0], ArrowRight: [stepM, 0], ArrowUp: [0, -stepM], ArrowDown: [0, stepM] }[evt.key];
    const p = selected === 'ball' ? S().ball : S().pos[selected];
    if (d) {
      evt.preventDefault(); snapshot();
      p[0] = clampX(p[0] + d[0]); p[1] = clampY(p[1] + d[1]);
      commit(); focusSelected();
    } else if ((evt.key === 'q' || evt.key === 'e') && selected !== 'ball') {
      evt.preventDefault(); snapshot();
      p[2] += evt.key === 'q' ? -15 : 15;
      commit(); focusSelected();
    } else if (evt.key === 'Escape') {
      selected = null; render();
    }
  });

  // ---------- Toolbar ----------
  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tb-tool').forEach((b) => {
      const on = b.dataset.tool === t;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
    svg.dataset.tool = t;
  }
  document.querySelectorAll('.tb-tool').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

  function undo() {
    if (!undoStack.length) { say('Nothing to undo.'); return; }
    state = JSON.parse(undoStack.pop());
    selected = null;
    commit();
  }
  $('tb-undo').addEventListener('click', undo);

  $('tb-clear').addEventListener('click', () => {
    if (!S().arrows.length) return;
    snapshot(); S().arrows = []; commit();
  });

  $('tb-flip').addEventListener('click', () => {
    snapshot();
    state.steps.forEach((st) => {
      IDS.forEach((id) => { const p = st.pos[id]; p[0] = W - p[0]; p[1] = H - p[1]; p[2] += 180; });
      st.ball = [W - st.ball[0], H - st.ball[1]];
      st.arrows.forEach((a) => { a.x1 = W - a.x1; a.y1 = H - a.y1; a.x2 = W - a.x2; a.y2 = H - a.y2; });
    });
    commit();
  });

  const presetSel = $('tb-preset');
  const ph = document.createElement('option');
  ph.value = ''; ph.textContent = 'Choose a preset…';
  presetSel.appendChild(ph);
  Object.entries(PRESETS).forEach(([k, p]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = p.name;
    presetSel.appendChild(o);
  });
  presetSel.addEventListener('change', () => {
    const p = PRESETS[presetSel.value];
    presetSel.value = '';
    if (!p) return;
    snapshot();
    state = { steps: clone(p.steps), cur: 0 };
    selected = null;
    if (location.hash) window.history.replaceState(null, '', location.pathname);
    commit();
    say(`Loaded “${p.name}”. Undo brings back your previous board.`);
  });

  // ---------- Steps ----------
  $('tb-addstep').addEventListener('click', () => {
    if (state.steps.length >= 30) { say('That\'s the maximum of 30 steps.'); return; }
    snapshot();
    const next = clone(S());
    next.arrows = []; next.note = '';
    state.steps.splice(state.cur + 1, 0, next);
    state.cur += 1;
    commit();
    say(`Step ${state.cur + 1} added. Move the boats to where they go next.`);
  });
  $('tb-delstep').addEventListener('click', () => {
    if (state.steps.length < 2) return;
    snapshot();
    state.steps.splice(state.cur, 1);
    state.cur = Math.max(0, state.cur - 1);
    commit();
  });
  $('tb-note').addEventListener('input', (evt) => { S().note = evt.target.value.slice(0, 400); save(); });
  $('tb-note').addEventListener('focus', () => snapshot());

  // ---------- Play animation ----------
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpAng = (a, b, t) => { let d = ((b - a) % 360 + 540) % 360 - 180; return a + d * t; };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play() {
    if (playing) { playing = false; return; }
    if (state.steps.length < 2) { say('Add a second step first, then press Play.'); return; }
    playing = true; selected = null;
    $('tb-play').textContent = '■ Stop';
    let i = 0;
    state.cur = 0; render();
    const HOLD = 1100, MOVE = reduceMotion ? 1 : 1300;
    const next = () => {
      if (!playing || i >= state.steps.length - 1) { playing = false; $('tb-play').textContent = '▶ Play'; render(); return; }
      const a = state.steps[i], b = state.steps[i + 1];
      const t0 = performance.now();
      const frame = (now) => {
        if (!playing) { next(); return; }
        const t = ease(Math.min(1, (now - t0) / MOVE));
        const f = { pos: {}, ball: [lerp(a.ball[0], b.ball[0], t), lerp(a.ball[1], b.ball[1], t)] };
        IDS.forEach((id) => { const p = a.pos[id], q = b.pos[id]; f.pos[id] = [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerpAng(p[2], q[2], t)]; });
        render(f);
        if (t < 1) requestAnimationFrame(frame);
        else { i += 1; state.cur = i; render(); setTimeout(next, HOLD); }
      };
      requestAnimationFrame(frame);
    };
    setTimeout(next, HOLD);
  }
  $('tb-play').addEventListener('click', play);

  // ---------- Share + image ----------
  $('tb-copy').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#play=${b64(JSON.stringify(pack()))}`;
    window.history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); say('Link copied. Paste it into a message to your team.'); }
    catch (e) { say('Copy the link from your address bar.'); }
  });

  $('tb-png').addEventListener('click', () => {
    const keepSel = selected; selected = null; render();
    const clone2 = svg.cloneNode(true);
    selected = keepSel; render();
    clone2.querySelectorAll('.tb-handle').forEach((h) => h.remove());
    clone2.setAttribute('xmlns', NS);
    clone2.setAttribute('width', 1600); clone2.setAttribute('height', 1120);
    const data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone2));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1600; c.height = 1120;
      c.getContext('2d').drawImage(img, 0, 0, 1600, 1120);
      c.toBlob((blob) => {
        if (!blob) { say('Sorry, your browser could not make the image.'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `canoepolo-tactics-step-${state.cur + 1}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    };
    img.onerror = () => say('Sorry, your browser could not make the image.');
    img.src = data;
  });

  // ---------- Start ----------
  load();
  drawPitch();
  setTool('move');
  render();
})();
