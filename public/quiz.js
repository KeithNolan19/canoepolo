// Referee quiz: 10 random multiple-choice questions (rules + hand signals), score at the end.
// Everything runs in the browser. Needs signals.js loaded first.
(function () {
  'use strict';
  const root = document.getElementById('quiz');
  if (!root || !window.CP_SIGNALS) return;
  const SIG = window.CP_SIGNALS;

  // ---------- Question bank (rules) ----------
  // a = correct answer, w = wrong answers, why = explanation shown after answering
  const BANK = [
    { q: 'How many players from each team are on the water at once?', a: '5', w: ['4', '6', '7'], why: 'Five a side, with the rest of the squad as substitutes.' },
    { q: 'What is the most players a team can have in its squad?', a: '10', w: ['8', '12', '15'], why: 'Up to ten players: five on the water and up to five substitutes.' },
    { q: 'How big is a full-size canoe polo pitch?', a: '35 m × 23 m', w: ['25 m × 15 m', '40 m × 20 m', '50 m × 25 m'], why: 'The playing area is 35 metres long and 23 metres wide.' },
    { q: 'How high above the water is the bottom of the goal?', a: '2 m', w: ['1 m', '1.5 m', '2.5 m'], why: 'The lower edge of the frame hangs 2 metres above the surface.' },
    { q: 'What size is the goal frame (inside measurement)?', a: '1.5 m wide × 1 m high', w: ['2 m wide × 1 m high', '1 m wide × 1 m high', '3 m wide × 2 m high'], why: 'Goals are 1.5 m wide and 1 m high.' },
    { q: 'How long may a player keep the ball before passing, shooting or dribbling?', a: '5 seconds', w: ['3 seconds', '10 seconds', '15 seconds'], why: 'Five seconds, then it is illegal possession.' },
    { q: 'How long is the shot clock at major events?', a: '60 seconds', w: ['30 seconds', '45 seconds', '90 seconds'], why: 'The attacking team must shoot within 60 seconds.' },
    { q: 'How many referees control a game?', a: '2', w: ['1', '3', '4'], why: 'Two referees, one on each side of the pitch.' },
    { q: 'How does each half start?', a: 'Teams line up on their goal lines; the ball is thrown into the middle and one player from each team sprints for it', w: ['The home team takes a throw from the centre line', 'The referee drops the ball between the two captains', 'The goalkeeper of the team that lost the toss throws the ball in'], why: 'It is the sprint: one player from each team races for the ball.' },
    { q: 'Which player can be hand-tackled?', a: 'Only the player in possession of the ball', w: ['Any player within 3 m of the ball', 'Any player in the 6 m area', 'Any opponent at any time'], why: 'Only the player who has the ball may be hand-tackled.' },
    { q: 'What is a legal hand tackle?', a: 'A push with one open hand on the back, side or upper arm', w: ['A two-handed push on the shoulders', 'A push on the helmet to tip the player over', 'Grabbing the ball-carrying arm'], why: 'One open hand, on the back, side or upper arm only.' },
    { q: 'An attacker has raised the ball behind their head to throw. What may the defender do?', a: 'Not touch the throwing arm or the ball', w: ['Grab the ball', 'Push the throwing arm', 'Knock the ball out with the paddle'], why: 'Once the ball is raised behind the head, no contact with the throwing arm or ball.' },
    { q: 'A kayak tackle is illegal if the opponent is more than how far from the ball?', a: '3 m', w: ['1 m', '6 m', '10 m'], why: 'Kayak tackles are only allowed on players within 3 m of the ball and competing for it.' },
    { q: 'Which kayak tackle is illegal and dangerous?', a: 'Ramming the side of a kayak at close to a right angle', w: ['Pushing kayak against kayak while both players go for the ball', 'Sliding alongside an opponent near the ball', 'Blocking a shot with your kayak'], why: 'Side-on impacts near 90 degrees, or hitting the body or head, are illegal kayak tackles.' },
    { q: 'When is playing the ball with your paddle illegal?', a: 'When an opponent is within reach and trying to play it with their hand', w: ['Always', 'Only inside the 6 m area', 'Only in the second half'], why: 'You may play the ball with the paddle, but not when an opponent is within reach trying to use a hand.' },
    { q: 'Who is the goalkeeper?', a: 'The defender under the goal, facing out, defending with the paddle', w: ['The player wearing number 1', 'The player named as goalkeeper before the game', 'Any defender inside the 6 m area'], why: 'The goalkeeper is whoever is in that defending position under the goal.' },
    { q: 'Can the attacking team have a goalkeeper?', a: 'No, only the defending team has a goalkeeper', w: ['Yes, always', 'Yes, but only in the last minute', 'Only if they have a player under their own goal'], why: 'Goalkeeper status only exists while your team is defending.' },
    { q: 'What happens after a yellow card?', a: 'The player is sent off for two minutes', w: ['A warning only, the player stays on', 'The player is sent off for the rest of the game', 'The other team gets a penalty shot'], why: 'Yellow: two minutes off. A second yellow becomes a red.' },
    { q: 'A player gets a second yellow card in the same game. What happens?', a: 'It becomes a red card', w: ['Another two minutes off', 'A green card instead', 'Nothing, yellows reset at half time'], why: 'Two yellows in a game make a red.' },
    { q: 'What does a red card mean?', a: 'Sent off for the rest of the game', w: ['Sent off for two minutes', 'Sent off for five minutes', 'A final warning'], why: 'Red: off for the rest of the game.' },
    { q: 'Which is the lowest card?', a: 'Green', w: ['Yellow', 'Red', 'White'], why: 'Cards go green, yellow, red.' },
    { q: 'What can an ejection red card for violence lead to?', a: 'Further bans from later games', w: ['A two-minute penalty only', 'A penalty shot and nothing else', 'The game being replayed'], why: 'Ejection is for the rest of the game, and further suspensions can follow.' },
    { q: 'The ball goes over the goal line, last touched by a defender. What is the restart?', a: 'Corner throw to the attackers', w: ['Goal line throw to the defenders', 'Referee\'s ball', 'Free shot to the attackers'], why: 'Defender last: corner throw.' },
    { q: 'The ball goes over the goal line, last touched by an attacker. What is the restart?', a: 'Goal line throw to the defenders', w: ['Corner throw to the attackers', 'Side line throw', 'Referee\'s ball'], why: 'Attacker last: goal line throw.' },
    { q: 'The ball goes over the side line. What is the restart?', a: 'Side line throw to the team that did not touch it last', w: ['Referee\'s ball', 'Goal line throw', 'Free shot'], why: 'It is a side line throw (throw-in).' },
    { q: 'When has a goal been scored?', a: 'When the whole ball has passed through the goal frame', w: ['When half the ball is through the frame', 'When the ball hits the frame', 'When the ball crosses the goal line on the water'], why: 'The whole ball must pass through the frame.' },
    { q: 'What can a foul that stops a likely goal be punished with?', a: 'A goal penalty shot', w: ['A corner throw', 'A referee\'s ball', 'A side line throw'], why: 'A goal penalty shot: one attacker against the goalkeeper.' },
    { q: 'Where do substitutes come on?', a: 'From their own substitutes\' area behind their own goal line', w: ['Anywhere along the side line', 'From the centre line', 'Only at half time'], why: 'Substitutions happen at any time, through the team\'s own area behind its goal line.' },
    { q: 'What is the minimum water depth for the playing area?', a: '90 cm', w: ['50 cm', '1.5 m', '2 m'], why: 'Still water at least 90 cm deep.' },
    { q: 'How much clear height must there be above the pitch?', a: '3 m', w: ['2 m', '5 m', '10 m'], why: 'At least 3 m clear of obstacles above the playing area.' },
    { q: 'What does a canoe polo ball weigh?', a: '400 to 450 g', w: ['200 to 250 g', '600 to 650 g', '800 to 900 g'], why: 'Between 400 and 450 grams.' },
    { q: 'Which ball is used in women\'s games?', a: 'A slightly smaller ball (65 to 67 cm round)', w: ['The same ball as men\'s games', 'A heavier ball', 'A soft foam ball'], why: 'Women\'s balls are 65 to 67 cm around; men\'s are 68 to 71 cm.' },
    { q: 'Which protective kit must every player wear?', a: 'A helmet with face guard and body protection', w: ['A helmet only', 'Body protection only', 'Nothing is compulsory at club level'], why: 'Helmet with face guard and body protection, approved by the scrutineer.' },
    { q: 'Who checks kayaks, paddles and helmets before an official event?', a: 'The scrutineer', w: ['The team captain', 'The timekeeper', 'The goal judge'], why: 'Only equipment approved by the scrutineer may be used.' },
    { q: 'Holding a capsized player under the water is…', a: 'A serious foul', w: ['Legal if they had the ball', 'Legal inside the 6 m area', 'Only a free throw, never a card'], why: 'It is one of the most serious offences in the game.' },
    { q: 'What is obstruction?', a: 'Deliberately blocking an opponent\'s path when neither of you is near the ball', w: ['Any contact between two kayaks', 'Sitting under your own goal', 'Holding the ball for more than 5 seconds'], why: 'Blocking a player away from the ball (outside 3 m) is obstruction.' },
    { q: 'What is a dribble?', a: 'Throwing the ball a short way ahead and paddling after it', w: ['Bouncing the ball on the deck', 'Carrying the ball on the paddle blade', 'Passing to yourself off the goal frame'], why: 'Dribbling lets you move with the ball without breaking the five-second rule.' },
    { q: 'A knockout game is level at full time. What happens?', a: 'Overtime is played to get a result', w: ['It is a draw', 'The team with fewer cards wins', 'The referees toss a coin'], why: 'When a result is needed, overtime is played.' },
    { q: 'Which foul is punished with a free shot rather than a free throw?', a: 'An illegal hand tackle', w: ['Holding the ball for 6 seconds', 'The ball going over the side line', 'A goal line throw taken from the wrong place'], why: 'Fouls on players (tackles, obstruction, illegal paddle) give a free shot.' },
    { q: 'What is the difference between a free throw and a free shot?', a: 'A free shot may go straight at goal; a free throw may not', w: ['There is no difference', 'A free throw is taken by the goalkeeper', 'A free shot is always taken from 6 m'], why: 'Free throws are indirect; free shots are direct.' },
    { q: 'An attacker pushes the goalkeeper out of position. What is the call?', a: 'Foul against the attacker: free shot to the defenders', w: ['Play on', 'Goal line throw', 'Penalty shot to the attackers'], why: 'Attackers may not move or unsettle the goalkeeper.' },
    { q: 'When should a referee play advantage?', a: 'When stopping play would help the team that committed the foul', w: ['Whenever the home team is attacking', 'Only in the last minute', 'Never in canoe polo'], why: 'Play on if the fouled team is better off continuing.' },
  ];

  // ---------- Helpers ----------
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // Similar-looking signals that shouldn't be tested against each other in picture questions
  const TOO_SIMILAR = [['freeshot', 'goalline'], ['start', 'fivesec']];
  const clash = (a, b) => TOO_SIMILAR.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

  function signalQuestion() {
    const pool = SIG.list.filter((s) => !s.noQuizImage);
    const target = pool[Math.floor(Math.random() * pool.length)];
    const others = shuffle(SIG.list.filter((s) => s.id !== target.id && !clash(s.id, target.id)));
    if (Math.random() < 0.55) {
      // Show one drawing, choose the meaning
      return { kind: 'sig-what', q: 'What does this signal mean?', sig: target, options: shuffle([target.name, ...others.slice(0, 3).map((s) => s.name)]), a: target.name, why: target.how };
    }
    // Show a meaning, choose the drawing
    const imgOthers = others.filter((s) => !s.noQuizImage).slice(0, 3);
    return { kind: 'sig-which', q: `Which signal means “${target.name}”?`, options: shuffle([target, ...imgOthers]), a: target.id, why: target.how };
  }

  function newQuiz() {
    const rules = pick(BANK, 6).map((b) => ({ kind: 'text', q: b.q, options: shuffle([b.a, ...b.w]), a: b.a, why: b.why }));
    const sigs = [];
    const seen = new Set();
    while (sigs.length < 4) {
      const s = signalQuestion();
      const key = s.kind + (s.sig ? s.sig.id : s.a);
      if (seen.has(key)) continue;
      seen.add(key); sigs.push(s);
    }
    return shuffle([...rules, ...sigs]);
  }

  // ---------- Rendering ----------
  let qs = [], i = 0, score = 0, answers = [];

  function start() {
    qs = newQuiz(); i = 0; score = 0; answers = [];
    show();
  }

  function show() {
    const item = qs[i];
    root.textContent = '';
    const head = h('div', 'quiz-head');
    head.appendChild(h('span', 'quiz-count', `Question ${i + 1} of ${qs.length}`));
    head.appendChild(h('span', 'quiz-score', `Score: ${score}`));
    root.appendChild(head);
    const bar = h('div', 'quiz-bar'); const fill = h('span'); fill.style.width = `${(i / qs.length) * 100}%`; bar.appendChild(fill); root.appendChild(bar);

    const qEl = h('h2', 'quiz-q', item.q);
    qEl.tabIndex = -1;
    root.appendChild(qEl);
    if (item.kind === 'sig-what') {
      const fig = h('div', 'quiz-fig');
      fig.appendChild(SIG.draw(item.sig, { label: 'Referee signal to identify' }));
      root.appendChild(fig);
    }
    const list = h('div', 'quiz-options' + (item.kind === 'sig-which' ? ' pics' : ''));
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Answers');
    item.options.forEach((opt, n) => {
      const b = h('button', 'quiz-opt');
      b.type = 'button';
      const letter = h('span', 'quiz-letter', 'ABCD'[n]);
      b.appendChild(letter);
      if (item.kind === 'sig-which') {
        b.appendChild(SIG.draw(opt, { label: `Signal option ${'ABCD'[n]}` }));
        b.dataset.value = opt.id;
      } else {
        b.appendChild(h('span', 'quiz-opt-text', opt));
        b.dataset.value = opt;
      }
      b.addEventListener('click', () => answer(b, list));
      list.appendChild(b);
    });
    root.appendChild(list);
    qEl.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'nearest' });
  }

  function answer(btn, list) {
    const item = qs[i];
    const right = btn.dataset.value === item.a;
    if (right) score += 1;
    answers.push({ item, chosen: btn.dataset.value, right });
    list.querySelectorAll('button').forEach((b) => {
      b.disabled = true;
      if (b.dataset.value === item.a) b.classList.add('is-right');
      else if (b === btn) b.classList.add('is-wrong');
    });
    root.querySelector('.quiz-score').textContent = `Score: ${score}`;
    const fb = h('div', 'quiz-feedback ' + (right ? 'ok' : 'no'));
    fb.setAttribute('role', 'status');
    fb.appendChild(h('strong', null, right ? 'Correct! ' : 'Not quite. '));
    const correctName = item.kind === 'sig-which' ? SIG.byId[item.a].name : item.a;
    fb.appendChild(document.createTextNode(right ? item.why : `The answer is: ${correctName}. ${item.why}`));
    root.appendChild(fb);
    const next = h('button', 'btn primary quiz-next', i + 1 < qs.length ? 'Next question →' : 'See my score');
    next.type = 'button';
    next.addEventListener('click', () => { i += 1; if (i < qs.length) show(); else finish(); });
    root.appendChild(next);
    next.focus({ preventScroll: true });
  }

  function finish() {
    root.textContent = '';
    let best = 0;
    try { best = Number(localStorage.getItem('cp-ref-best') || 0); if (score > best) localStorage.setItem('cp-ref-best', String(score)); } catch (e) { /* ignore */ }
    const res = h('div', 'quiz-result');
    const big = h('p', 'quiz-big'); big.appendChild(h('strong', null, String(score))); big.appendChild(document.createTextNode(` / ${qs.length}`));
    res.appendChild(big);
    const verdict = score === 10 ? 'Perfect! You know your rules. Time to book a referee course.'
      : score >= 8 ? 'Great score. A little more practice and you\'re ready to pick up a whistle.'
      : score >= 5 ? 'Good start. Have another look at the rules and signals, then try again.'
      : 'Keep going: read through the rules list and signals below, then have another go.';
    res.appendChild(h('p', 'quiz-verdict', verdict));
    if (best > 0 && score <= best) res.appendChild(h('p', 'small-note', `Your best score on this device: ${Math.max(best, score)} / 10`));
    else if (score > best && best > 0) res.appendChild(h('p', 'small-note', 'New personal best!'));
    const again = h('button', 'btn primary', 'New quiz: 10 new questions');
    again.type = 'button';
    again.addEventListener('click', start);
    const actions = h('p', 'lead-actions'); actions.appendChild(again);
    const back = h('a', 'btn', 'Study the rules'); back.href = '/referee#rules'; actions.appendChild(back);
    res.appendChild(actions);
    const missed = answers.filter((x) => !x.right);
    if (missed.length) {
      res.appendChild(h('h3', 'quiz-review-head', 'Questions to review'));
      const ul = h('ul', 'quiz-review');
      missed.forEach(({ item }) => {
        const li = h('li');
        li.appendChild(h('strong', null, item.kind === 'sig-what' ? `What does this signal mean? (${item.sig.name})` : item.q));
        const correctName = item.kind === 'sig-which' ? SIG.byId[item.a].name : item.a;
        li.appendChild(h('span', null, `Answer: ${correctName}. ${item.why}`));
        ul.appendChild(li);
      });
      res.appendChild(ul);
    }
    root.appendChild(res);
    big.tabIndex = -1; big.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'nearest' });
  }

  document.getElementById('quiz-start').addEventListener('click', start);
})();
