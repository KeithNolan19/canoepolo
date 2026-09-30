// Content for the Learn to referee page (/referee). A plain-English guide, not the official rules.
// Check against the current ICF rules (links on /rules) whenever they change.

const PATHWAY = [
  { step: 'Learn the rules', text: 'Read the rules list below and the official ICF rules, then test yourself with the quiz until you score 10 out of 10.' },
  { step: 'Take a referee course', text: 'National federations run short theory courses, often online or at tournaments. Ask your club or federation when the next one is.' },
  { step: 'Pass the written exam', text: 'Usually multiple choice on the ICF rules. In Ireland, for example, it is 50 questions with a 75% pass mark.' },
  { step: 'Referee real games', text: 'Start at club and league tournaments, shadowed by an experienced referee. Tournaments are always short of referees, so you will get plenty of games.' },
  { step: 'Get assessed and graded', text: 'A higher-grade referee watches you in competitive games. Grades are usually reassessed every two years so standards stay high.' },
  { step: 'Go international', text: 'Top national referees can be nominated by their federation for ICF assessment, and referee at European and World Championships.' },
];

const CONTACTS = [
  { name: 'Irish Canoe Polo Committee: become a referee', url: 'https://canoepolo.ie/become-a-referee/' },
  { name: 'Canoeing Ireland: how to become a referee', url: 'https://www.canoe.ie/disciplines/how-to-become-a-referee/' },
  { name: 'Paddle UK Canoe Polo: referee grades and assessment', url: 'https://canoepolo.org.uk/refereeing/grades-assessment/' },
  { name: 'Paddle UK Canoe Polo: referee theory courses', url: 'https://canoepolo.org.uk/referee-theory-courses/' },
  { name: 'ICF / Paddle Worldwide referee information', url: 'https://paddleworldwide.com/icf-referee-information' },
];

// The full list of rules, grouped. `call` is what the referee gives.
const RULES = [
  {
    id: 'teams', title: 'Teams, kit and pitch',
    items: [
      { rule: 'Five players per team on the water; a squad has at most ten players.' },
      { rule: 'Playing area: 35 m long and 23 m wide, on still water at least 90 cm deep, with at least 3 m of clear height above it.' },
      { rule: 'Goals: 1.5 m wide and 1 m high inside the frame, hung with the bottom edge 2 m above the water, in the middle of each goal line.' },
      { rule: 'Ball: 400 to 450 g. Men\'s games use a 68 to 71 cm ball; women\'s games a 65 to 67 cm ball.' },
      { rule: 'Kayaks, paddles, helmets with face guards and body protection must all be approved by the scrutineer before play.' },
      { rule: 'Team shirts are the same colour, with sleeves covering at least the middle of the upper arm, and every player has a number.' },
    ],
  },
  {
    id: 'time', title: 'Time, starts and scoring',
    items: [
      { rule: 'Two halves with a break, teams change ends at half time.' },
      { rule: 'Each half starts with both teams lined up on their own goal line. The referee throws the ball into the middle and one player from each team sprints for it; the others stay back until the ball is won.' },
      { rule: 'A goal is scored when the whole ball passes through the goal frame from the front.' },
      { rule: 'When a result is needed and the score is level at full time, overtime is played.' },
      { rule: 'At major events a 60-second shot clock runs: if the attacking team does not shoot in time, the ball goes to the other team.' },
      { rule: 'Substitutions can happen at any time through the team\'s own substitutes\' area behind their goal line. The player leaving must be out before the new player comes on.' },
    ],
  },
  {
    id: 'ball', title: 'Playing the ball',
    items: [
      { rule: 'A player may hold the ball for five seconds. Within that time they must pass, shoot, or dribble (throw it ahead and paddle after it).', call: 'Five seconds / illegal possession: free throw to the other team.' },
      { rule: 'The ball may be played with the hand or the paddle, but not with the paddle when an opponent is within reach and trying to play the ball with a hand.', call: 'Illegal use of paddle: free shot.' },
      { rule: 'A paddle must never be used to touch another player, their paddle when they are playing the ball, or their body.', call: 'Illegal use of paddle: free shot and a card if deliberate or dangerous.' },
      { rule: 'Players must not hold on to the goal frame, another kayak or a player to keep possession or position.', call: 'Illegal holding: free shot.' },
    ],
  },
  {
    id: 'contact', title: 'Tackles, jostling and obstruction',
    items: [
      { rule: 'Only the player in possession of the ball can be hand-tackled.', call: 'Illegal hand tackle: free shot.' },
      { rule: 'A hand tackle is a push with one open hand on the back, side or upper arm. No pushing on the head or neck, no grabbing, no two-handed shoves.' },
      { rule: 'Once the ball is raised behind the thrower\'s head, defenders may not touch the throwing arm or the ball.' },
      { rule: 'Kayak tackles are only allowed on a player who is within 3 m of the ball and competing for it.', call: 'Illegal kayak tackle: free shot.' },
      { rule: 'Hitting the side of a kayak at close to a right angle, or making contact with the player\'s body or head with your kayak, is dangerous and illegal.', call: 'Illegal kayak tackle: free shot, and usually a card.' },
      { rule: 'Arriving late at the sprint and hitting an opponent with the kayak is treated as deliberate or dangerous.' },
      { rule: 'Jostling (pushing side by side for position) is only allowed near the ball.', call: 'Illegal jostle: free shot.' },
      { rule: 'Deliberately blocking an opponent\'s path when neither player is within 3 m of the ball is obstruction.', call: 'Obstruction: free shot.' },
    ],
  },
  {
    id: 'keeper', title: 'The goalkeeper',
    items: [
      { rule: 'The goalkeeper is the defending player sitting under the goal, facing out, and defending it with the paddle held up.' },
      { rule: 'Only the defending team has a goalkeeper; it stops the moment their team wins the ball.' },
      { rule: 'Attackers may not tackle, jostle or unsettle the goalkeeper, or stop a defender from taking up the goalkeeper position.', call: 'Foul on the goalkeeper: free shot to the defending team.' },
      { rule: 'The goalkeeper\'s paddle may be raised to block shots, but must not be swung at or brought down on attackers.' },
    ],
  },
  {
    id: 'restarts', title: 'Restarts',
    items: [
      { rule: 'Ball over the side line: side line throw to the team that did not touch it last.' },
      { rule: 'Ball over the goal line, last touched by an attacker: goal line throw to the defenders.' },
      { rule: 'Ball over the goal line, last touched by a defender: corner throw to the attackers.' },
      { rule: 'Free throw: for most minor offences. It cannot be thrown straight into goal, and opponents must move away before it is taken.' },
      { rule: 'Free shot: for fouls such as illegal tackles, obstruction and illegal use of paddle. The player may shoot directly at goal.' },
      { rule: 'Goal penalty shot: for a foul that stopped a likely goal. One attacker shoots against the goalkeeper alone.' },
      { rule: 'Referee\'s ball: when the referees cannot say who should have the ball, they restart with a referee\'s ball instead of giving it to either team.' },
      { rule: 'Advantage: referees can let play continue if stopping it would help the team that committed the foul.' },
    ],
  },
  {
    id: 'cards', title: 'Cards and behaviour',
    items: [
      { rule: 'Cards are for deliberate, dangerous or repeated fouls and unsporting behaviour. They can be given on top of the free throw, free shot or penalty.' },
      { rule: 'Green card: the lowest card, for deliberate or repeated fouls. The player is sent off for a short time.' },
      { rule: 'Yellow card: for more serious or dangerous fouls. The player is sent off for two minutes. A second yellow in the same game becomes a red.' },
      { rule: 'Red card: sent off for the rest of the game.' },
      { rule: 'Ejection red card: for violence or abuse. Sent off for the rest of the game, and further bans can follow.' },
      { rule: 'Holding a capsized player under the water, deliberately hitting a player, or abusing officials are among the most serious offences.' },
      { rule: 'A team that causes a game to be abandoned can be disqualified from the competition.' },
    ],
  },
  {
    id: 'officials', title: 'Officials',
    items: [
      { rule: 'Every game has two referees, one on each side of the pitch, usually wearing matching black or white shirts.' },
      { rule: 'Table officials run the game clock, the shot clock, the score sheet and the timing of players sent off.' },
      { rule: 'Referees follow the ICF Referee Code of Conduct: neutral, consistent and never refereeing their own club.' },
    ],
  },
];

const TIPS = [
  'Blow the whistle loudly and signal clearly: players, the table and the crowd all need to see the call.',
  'Watch the players, not just the ball. Most fouls happen away from it.',
  'Agree with your co-referee before the game who watches what, and make eye contact before big decisions.',
  'Hold a signal for two seconds, then point to where the free throw or free shot is taken.',
  'Use advantage wisely: only play on if the fouled team really is better off.',
  'Stay calm and consistent. Explain decisions to captains briefly if asked; never argue.',
];

module.exports = { PATHWAY, CONTACTS, RULES, TIPS };
