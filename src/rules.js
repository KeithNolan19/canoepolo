// Content for the Rules page (/rules). A plain-English summary, not the official text.
// When the ICF (Paddle Worldwide) publishes new rules, update RULES_EDITION, LAST_CHECKED and the links.

const RULES_EDITION = 'ICF Canoe Polo Competition Rules 2025 (in force for 2026, with the 2026 appendices)';
const LAST_CHECKED = 'September 2026';

const FACTS = [
  { big: '5', label: 'players per team on the water, up to 10 in a squad' },
  { big: '35 × 23 m', label: 'playing area, on still water at least 90 cm deep' },
  { big: '2 m', label: 'from the water to the bottom of each 1.5 × 1 m goal' },
  { big: '60 s', label: 'shot clock: shoot within a minute or lose the ball' },
  { big: '5 s', label: 'to pass, shoot or dribble once you pick up the ball' },
  { big: '2', label: 'referees, one on each side of the pitch' },
];

const SECTIONS = [
  {
    id: 'game', title: 'How a game works',
    items: [
      { h: 'The start', t: 'Both teams line up on their own goal line. A referee throws the ball into the middle of the pitch and one player from each team sprints for it. The same happens at the start of the second half.' },
      { h: 'Length', t: 'Games are played in two halves with a short break and teams swap ends. International championships play up to 10 minutes each half; club tournaments often play shorter halves to fit the schedule.' },
      { h: 'Scoring', t: 'A goal counts when the whole ball passes through the goal frame. The goal hangs above the water, so shots have to be lifted over the goalkeeper\'s paddle.' },
      { h: 'Draws', t: 'In knockout games that need a winner, a tied game goes to overtime. Group games can end level.' },
      { h: 'Substitutes', t: 'Players can be swapped at any time. The player coming off must be back in the substitutes\' area, behind their own goal line and away from the goal, before the replacement enters.' },
    ],
  },
  {
    id: 'ball', title: 'Playing the ball',
    items: [
      { h: 'Five seconds', t: 'Once you have the ball you have five seconds to pass, shoot or dribble it. Dribbling means throwing it ahead and paddling after it.' },
      { h: 'Shot clock', t: 'At top-level events, the attacking team has 60 seconds to shoot. The clock restarts when the other team wins the ball or after a shot on goal.' },
      { h: 'Using the paddle', t: 'You may flick or scoop the ball with your paddle, but not when an opponent is within reach of the ball and trying to play it with their hand. Paddles must never touch another player.' },
      { h: 'Out of play', t: 'If the ball goes over the side line it\'s a throw-in. Over the goal line it\'s either a goal line throw for the defenders or a corner throw for the attackers, depending on who touched it last.' },
    ],
  },
  {
    id: 'contact', title: 'Tackles and contact',
    items: [
      { h: 'Hand tackle', t: 'You can only tackle the player who has the ball. Push with one open hand on their back, side or upper arm. Pushing on the head or neck, grabbing or holding is a foul. Once the ball is raised behind the thrower\'s head, you may not touch the throwing arm or the ball.' },
      { h: 'Kayak tackle', t: 'You may push an opponent\'s kayak with yours when you are both going for the ball. Ramming the side of a boat at close to a right angle, hitting the body or head, or tackling a player who is more than 3 m from the ball are fouls.' },
      { h: 'Jostling and obstruction', t: 'Pushing for position is allowed near the ball. Blocking an opponent\'s path on purpose when neither of you is near the ball is obstruction.' },
      { h: 'Goalkeeper', t: 'The goalkeeper is the defender sitting under the goal and facing out, defending with the paddle held up. Attackers may not push or unsettle the goalkeeper. A team only has a goalkeeper while it is defending.' },
      { h: 'Capsizing', t: 'Players roll back up without getting out of the boat. Holding a capsized player under the water is a serious foul.' },
    ],
  },
  {
    id: 'fouls', title: 'Fouls and cards',
    items: [
      { h: 'Free throws', t: 'Most fouls give the other team a free throw from where the foul happened. Defenders must move back before it is taken.' },
      { h: 'Penalty shot', t: 'A foul that stops a likely goal can be punished with a penalty shot: one attacker against the goalkeeper alone.' },
      { h: 'Green card', t: 'A warning for a deliberate or repeated foul. The player sits out for two minutes and the team plays one short.' },
      { h: 'Yellow card', t: 'For more serious or dangerous fouls. The player sits out for two minutes. A second yellow in the same game becomes a red.' },
      { h: 'Red card', t: 'The player is sent off for the rest of the game. An ejection red card for violent or abusive behaviour can also bring a ban from later games.' },
    ],
  },
  {
    id: 'kit', title: 'Kit',
    items: [
      { h: 'Kayak', t: 'A short, manoeuvrable polo kayak with soft, rounded bumpers at both ends. At official events every boat is checked by a scrutineer before play.' },
      { h: 'Paddle', t: 'A double-bladed kayak paddle with no sharp edges, checked like the boats.' },
      { h: 'Helmet and face guard', t: 'Every player wears an approved helmet with a face guard.' },
      { h: 'Body protection', t: 'A buoyancy aid that also protects the body from knocks, carrying the player\'s number. Team shirts must have sleeves and match.' },
      { h: 'Ball', t: 'A water polo ball, 400 to 450 g. Men\'s and men\'s U21 games use the bigger size (68 to 71 cm round); women\'s games use a slightly smaller ball (65 to 67 cm).' },
    ],
  },
];

const DOCUMENTS = [
  { name: 'ICF Canoe Polo Competition Rules 2025', note: 'The full official rules (PDF).', url: 'https://cdn.paddleworldwide.com/media/2025_icf_competition_rules_canoe_polo_-_final.pdf' },
  { name: 'Canoe Polo Rules Appendices, applying from 2026', note: 'Equipment details, shot clock and competition procedures (PDF).', url: 'https://cdn.paddleworldwide.com/media/cap_2026_rules_appendices.pdf' },
  { name: '2025 Canoe Polo Rule Clarifications', note: 'How referees should call sprint starts, paddles near the ball and hand tackles (PDF).', url: 'https://cdn.paddleworldwide.com/media/2025_icf_canoe_polo_rule_clarifications.pdf' },
  { name: 'All ICF / Paddle Worldwide rules', note: 'Every discipline, plus the rules archive.', url: 'https://paddleworldwide.com/rules' },
];

const GLOSSARY = [
  ['Sprint', 'The race for the ball at the start of each half.'],
  ['Screen', 'Placing your kayak to block a defender so a teammate gets a clear shot.'],
  ['Dribble', 'Throwing the ball a short way ahead and paddling onto it, which resets the five seconds.'],
  ['Jostle', 'Pushing boat against boat to win position near the ball.'],
  ['Roll', 'Righting a capsized kayak without getting out, an essential skill for every player.'],
];

module.exports = { RULES_EDITION, LAST_CHECKED, FACTS, SECTIONS, DOCUMENTS, GLOSSARY };
