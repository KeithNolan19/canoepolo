// Content for the homepage "family" cards, /learn and /get-involved. Edit freely.

// Homepage: one card per part of the canoe polo family. links: [label, url]
const FAMILY = [
  { title: 'Players', text: 'Find your next tournament at home or abroad, learn the rules and watch the best in the world.', links: [['Tournaments', '/tournaments'], ['Rules', '/rules']] },
  { title: 'Coaches', text: 'Plan sessions and plays on the tactics board, share them with your squad, and find coaching courses.', links: [['Tactics board', '/tactics'], ['Coaching', '/get-involved#coaches']] },
  { title: 'Referees', text: 'Learn every rule and hand signal, test yourself with the quiz, and find a referee course near you.', links: [['Learn to referee', '/referee'], ['Take the quiz', '/referee/quiz']] },
  { title: 'Volunteers', text: 'Tournaments run on volunteers: table officials, set-up crews, streaming, photography and more.', links: [['Volunteer', '/get-involved#volunteers']] },
  { title: 'Clubs', text: 'Grants and fundraising ideas, and a place to list your events for the whole canoe polo world.', links: [['Support and funding', '/support'], ['List a tournament', '/about#listing']] },
  { title: 'Fans', text: 'Highlights, finals and live streams from the World Championships and more.', links: [['Watch', '/watch']] },
];

// /learn hub
const LEARN = [
  { title: 'Rules in plain English', url: '/rules', text: 'The pitch, the five-second rule, tackles, the goalkeeper, cards and kit.' },
  { title: 'Learn to referee', url: '/referee', text: 'Every rule a referee needs, the 17 hand signals, and how to get qualified.' },
  { title: 'Referee quiz', url: '/referee/quiz', text: 'Ten random questions on rules and signals, with your score at the end.' },
  { title: 'Tactics board', url: '/tactics', text: 'Drag kayaks around a to-scale pitch, draw runs and passes, and animate plays.' },
  { title: 'How-to videos', url: '/watch#learn', text: 'The ICF\'s educational series on equipment, paddling, ball handling and goalkeeping.' },
  { title: 'Watch the best', url: '/watch', text: 'Finals and highlights from the World Championships: the fastest way to learn.' },
];

// /get-involved sections
const INVOLVED = [
  {
    id: 'players', title: 'Start playing',
    text: 'Most clubs welcome beginners and lend boats and kit to start with. Your national federation can point you to the nearest club, and many run taster sessions.',
    points: ['Ask a local canoe or kayak club if they have a polo section.', 'Universities often have canoe polo teams, many of them training in indoor pools all year round.', 'Once you can roll and handle the ball, try a club tournament: most have beginner or development divisions.'],
    links: [['Find a tournament', '/tournaments'], ['Learn the rules', '/rules']],
  },
  {
    id: 'coaches', title: 'Coach',
    text: 'Clubs are always looking for coaches, from running beginner sessions to preparing teams for international competition. National federations run coaching awards that include canoe polo.',
    points: ['Help out at your club\'s sessions first, then take a coaching award.', 'Use the tactics board to plan and share plays with your squad.', 'The ICF\'s how-to videos are a good basis for beginner sessions.'],
    links: [['Tactics board', '/tactics'], ['How-to videos', '/watch#learn']],
  },
  {
    id: 'referees', title: 'Referee',
    text: 'There are never enough referees. Learning to referee makes you a better player, and good referees go on to officiate at European and World Championships.',
    points: ['Learn the rules and signals, and practise with the quiz.', 'Take your national federation\'s referee course and written exam.', 'Referee at club tournaments, then get assessed for your grade.'],
    links: [['Learn to referee', '/referee'], ['Referee quiz', '/referee/quiz']],
  },
  {
    id: 'volunteers', title: 'Volunteer at tournaments',
    text: 'Every tournament depends on volunteers, and you don\'t need to play to help. It is a great way to be part of the sport, meet people and see top-level games up close.',
    points: [
      'Table officials: run the game clock and shot clock, keep the score sheet and time players who are sent off.',
      'Set-up and pack-down: putting up goals and pitch lines, and taking them down again.',
      'Scrutineering: checking boats, paddles and helmets are safe before play.',
      'Safety cover and first aid.',
      'Streaming, commentary, photography and social media.',
      'Registration, catering and looking after visiting teams.',
    ],
    links: [['Tell us you can help', 'mailto:info@canoepolo.eu?subject=Volunteering']],
  },
  {
    id: 'clubs', title: 'Clubs and organisers',
    text: 'Run a tournament, find funding, or just let the canoe polo world know your club exists.',
    points: ['Send us your tournament and we\'ll list it on the calendar, so teams from other countries can find it.', 'See grant routes and fundraising ideas on the support page.'],
    links: [['Support and funding', '/support'], ['List a tournament', '/about#listing']],
  },
];

module.exports = { FAMILY, LEARN, INVOLVED };
