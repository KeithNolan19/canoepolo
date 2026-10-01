// Blog posts (/blog). Managed in the admin panel under "Blog".
// Post text is plain text with a tiny, safe format: blank line = new paragraph,
// "## " = heading, "- " = bullet list. Nothing else is interpreted, and all text is escaped.
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    summary      TEXT NOT NULL,
    body         TEXT NOT NULL,
    published    INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL,
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Starter posts, added once when the table is empty. Edit or delete them in the admin panel.
const STARTERS = [
  {
    slug: 'what-is-canoe-polo', title: 'What is canoe polo? A beginner\'s guide',
    summary: 'Canoe polo (also called kayak polo) is a fast team ball sport played in kayaks. Here is how it works and how to try it.',
    body: `Canoe polo, also called kayak polo, is a team ball sport played on water. Each team sits in kayaks and tries to throw a ball into the other team's goal, which hangs above the water.

## How the game works

- Two teams of five players play at a time, each paddling a small, agile kayak.
- Players pass and carry the ball, and shoot at a goal suspended above the water.
- The sport mixes paddling, ball skills and tactics, a little like water polo, handball and basketball combined.
- Referees control the game using whistles and hand signals.

## Why people love it

Canoe polo is fast, friendly and very social. It is played by clubs in many countries, from local leagues to the World Championships.

## How to try it

The best way to start is to find a local club. Most clubs lend you a boat, helmet and paddle for your first sessions. You do not need to be an expert paddler to begin.

See our list of upcoming tournaments to find events near you, watch videos on the Watch page to see the game in action, and visit Get involved to find ways to take part as a player, referee or volunteer.`,
  },
  {
    slug: 'how-to-find-a-canoe-polo-tournament', title: 'How to find a canoe polo tournament',
    summary: 'Looking for a canoe polo tournament to enter or watch? Here is where to look, and what to check before you travel.',
    body: `Canoe polo tournaments run all year round, from friendly club events to international championships. Here is how to find one.

## Where to look

- Start with the tournament calendar on canoepolo.eu. It lists upcoming events with dates, venues, divisions and links to the organisers.
- You can also subscribe to the calendar in your phone or computer calendar app.
- Ask your national federation and local clubs about events in your area.

## What to check before you enter

- The dates and the venue, including travel and accommodation.
- Which divisions are open (for example men, women, youth and masters).
- The registration deadline and the entry fee.
- The tournament rules and any equipment requirements. Always confirm these with the organiser.

## Running a tournament?

If you organise an event, you can create it on Kayakers.nl. The calendar there feeds canoepolo.eu, so your tournament can appear on this site too.`,
  },
];
if (db.prepare('SELECT COUNT(*) AS n FROM posts').get().n === 0) {
  const ins = db.prepare('INSERT INTO posts (slug, title, summary, body, published, published_at) VALUES (@slug, @title, @summary, @body, 1, @d)');
  db.transaction(() => STARTERS.forEach((p) => ins.run({ ...p, d: new Date().toISOString().slice(0, 10) })))();
}

// Further starter posts, each added once (recorded in the imports table so deleting one in admin keeps it deleted).
const SEED_POSTS = [
 {
  "slug": "how-to-start-and-grow-a-canoe-polo-club",
  "title": "How to start and grow a canoe polo club",
  "summary": "A practical guide to starting a canoe polo club, finding members and keeping them: people, pitch, kit, safety and money.",
  "body": "Canoe polo (kayak polo) clubs start small: a few paddlers, a pool or a stretch of calm water, and some people who want to try something new. This guide covers the basics of starting a club and helping it grow. Rules and requirements differ between countries, so always check with your national canoe federation.\n\n## Start with people\n\n- Find two or three people who will share the work. A club run by one person rarely lasts.\n- Agree who looks after coaching, safety, money and communication.\n- Talk to your national canoe federation and nearby clubs. They can often advise, lend kit and help you find players.\n\n## Find a place to play\n\n- Swimming pools are popular for training. Ask about off-peak hours, which are cheaper, and about hall hire for a regular weekly slot.\n- Calm lakes, canals and sheltered water also work for outdoor sessions in the warmer months.\n- Check what insurance and permissions the venue requires before you book.\n\n## Get the right kit\n\n- Kayaks designed for canoe polo, paddles, helmets with face guards, and buoyancy aids for every player.\n- Goals and balls. Second-hand kit from other clubs is a good way to start.\n- Keep a small first aid kit and a written list of emergency contacts at every session.\n\n## Keep it safe\n\nSafety comes first. Make sure sessions have a qualified coach or experienced leader, that new players can swim and are shown how to exit a capsized kayak, and that you have a clear plan for emergencies. If you work with young people, read our guide to child protection and safeguarding.\n\n## Make it welcoming\n\n- Run regular \"come and try\" sessions and tell local schools, universities, paddling clubs and sports groups.\n- Lend equipment so that beginners do not need to buy anything at first.\n- Welcome all ages and abilities, and mix beginners with experienced players so that nobody feels left out.\n- Keep a simple social media page and share photos only with the permission of the people in them.\n\n## Organise your club\n\n- Decide whether to become a formal club with a committee, a bank account and written rules. Many funders and venues expect this.\n- Keep a simple record of members, fees and spending, and share it openly with members.\n- Set sensible membership fees that cover pitch hire, insurance and equipment replacement.\n\n## Grow through competition\n\nPlaying matches keeps members motivated. Join your national league if there is one, enter friendly tournaments, and see the tournament calendar on canoepolo.eu for events near you. Even one tournament a year gives a club something to aim for. You can also host your own: create it on Kayakers.nl and it can appear on this site too.\n\n## Keep going\n\nGrowth takes patience. Thank your volunteers, train new coaches and referees, and share the jobs around so that no single person burns out. See our guides on applying for grants and on child protection for the next steps.\n\nWant help or have a story from your own club? Message us on WhatsApp through the Get involved page."
 },
 {
  "slug": "how-to-apply-for-grants-for-your-canoe-polo-club",
  "title": "How to apply for grants for your canoe polo club",
  "summary": "A step by step guide to finding and winning grant funding for a canoe polo club: where to look, what to prepare and how to write a strong application.",
  "body": "Grants can help a canoe polo club buy kayaks, hire pitches, train coaches and travel to tournaments. Funding schemes differ a lot between countries and change from year to year, so use this guide as a checklist and always read the current rules of each fund.\n\n## Where to look\n\n- Your national canoe federation. It may run its own funds or know which ones suit clubs.\n- Your national or regional sports council or agency, which usually funds clubs and community sport.\n- Your local council, county or municipality, which often has small community grants.\n- Charities, foundations and local businesses that support sport, youth or health.\n- European programmes such as Erasmus+ Sport, which usually suit organisations working together across several countries. These are more complex, so start with smaller local funds first.\n\n## Get your club ready first\n\nMost funders expect a club to show that it is well run. Before you apply, make sure you have:\n\n- A club name, a committee and a named contact person.\n- A bank account in the club's name (not a personal account).\n- A short written constitution or set of rules.\n- Simple accounts showing what comes in and what goes out.\n- Insurance and, if you work with young people, a safeguarding policy. See our child protection guide.\n\n## Plan a clear project\n\nFunders pay for projects with clear results, not for general wishes. Decide:\n\n- What you want to do (for example, buy six beginner kayaks and run a ten week \"come and try\" programme).\n- Who will benefit and how many people (new members, young people, women and girls, people who are new to sport).\n- What it will cost, with real quotes where you can.\n- How you will know it worked (number of new members, sessions delivered, feedback).\n\n## Write a strong application\n\n- Answer the exact questions asked and respect word limits.\n- Use plain language. Explain what canoe polo is, as the reader may not know the sport.\n- Show the need, the plan, the cost and the benefit in that order.\n- Include your own contribution, such as volunteer time or fundraising. Funders like to see that you are investing too.\n- Ask for a realistic amount, matched to the budget.\n- Have someone outside the club read it before you submit.\n\n## After you apply\n\n- Keep to the deadline, and do not spend money you plan to claim before you are told you can.\n- If you are successful, keep every receipt and report on time. Thank the funder publicly where they ask you to.\n- If you are not successful, ask for feedback and try again. Many clubs win funding on their second or third attempt.\n\n## Other ways to raise money\n\nGrants are not the only route. Membership fees, local sponsors, tournament entry fees, small fundraising events and second hand kit sales can all help. A mix of sources makes a club more stable.\n\nInformation about funding changes often, so check the funder's website for the latest rules, dates and amounts before you apply. This guide is general advice only."
 },
 {
  "slug": "child-protection-and-safeguarding-in-canoe-polo-clubs",
  "title": "Child protection and safeguarding in canoe polo clubs",
  "summary": "Why every canoe polo club needs a child protection policy, and the practical steps to keep young players safe: policy, safeguarding officer, checks, conduct and reporting.",
  "body": "Canoe polo is a great sport for young people, and every club has a duty to keep children and young people safe. This guide sets out the basic steps. Laws and requirements differ between countries, so always follow your national law and your national canoe federation's guidance. This is general information, not legal advice.\n\n## Why it matters\n\nChildren and young people can be harmed by adults, by other young people, and sometimes by the way a sport is run. A clear policy and good habits protect young players, and they also protect coaches, volunteers and the club.\n\n## The basics every club should have\n\n- A written child protection (safeguarding) policy that everyone in the club can read.\n- A named safeguarding officer (sometimes called a welfare officer or designated person) who members can speak to. Make sure everyone knows who it is.\n- A code of conduct for coaches, volunteers, players and parents.\n- A clear procedure for reporting concerns, and a record of any concerns raised.\n\n## Choosing and checking adults\n\n- Recruit coaches and volunteers carefully. Ask for references and hold a short interview.\n- Carry out the background or criminal record checks that the law and your federation require in your country, before the person works with children.\n- Make sure coaches have suitable training, including safeguarding training and first aid.\n- Never leave a new volunteer alone with children.\n\n## Good practice at sessions\n\n- Avoid one to one situations out of sight of others. Where one to one coaching is needed, keep it in an open, visible place.\n- Keep more than one adult present where possible.\n- Plan changing rooms and toilets so that children are supervised appropriately and respected, and so that adults and children are not changing together.\n- Respect personal space. Explain and ask before any physical contact, for example when helping with a capsize drill or lifting a boat.\n- Be careful with online contact. Communicate with young people through parents or in group messages that include more than one adult, and avoid private messages.\n- Take and share photos or video only with permission from parents or guardians. Never share personal details such as addresses.\n\n## Travel and tournaments\n\n- Get written consent from parents or guardians for travel and for emergency medical treatment, and keep their contact details with you.\n- Tell parents the plan, the supervision arrangements and who to contact.\n- Arrange rooms and transport so that children are not alone with one adult.\n\n## Spotting and responding to concerns\n\nSigns that a child may be at risk include unexplained injuries, sudden changes in behaviour, fear of a particular person, or something the child tells you. If a child tells you something worrying:\n\n- Listen calmly and take it seriously.\n- Do not promise to keep it secret, and do not investigate or confront anyone yourself.\n- Write down what was said, using the child's own words, as soon as you can.\n- Tell your club safeguarding officer straight away. They will follow the club's procedure and pass the concern to the right authority, such as the child protection services or the police.\n- If a child is in immediate danger, contact the emergency services at once.\n\n## Keep it alive\n\n- Review the policy every year and after any incident.\n- Train new coaches and volunteers, and refresh training regularly.\n- Talk openly with players and parents about how to raise a concern, and make clear that it will always be taken seriously.\n\nYour national canoe federation and national sports council can provide policy templates, training and local contacts. This page is general guidance only, so check what applies in your country."
 }
];
const SEED_ID = 'blog-seed-2026-10-01-club-grants-safeguarding';
if (!db.prepare('SELECT 1 FROM imports WHERE id = ?').get(SEED_ID)) {
  const ins2 = db.prepare('INSERT OR IGNORE INTO posts (slug, title, summary, body, published, published_at) VALUES (@slug, @title, @summary, @body, 1, @d)');
  db.transaction(() => {
    SEED_POSTS.forEach((p) => ins2.run({ ...p, d: new Date().toISOString().slice(0, 10) }));
    db.prepare('INSERT INTO imports (id) VALUES (?)').run(SEED_ID);
  })();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// Turns the plain text body into safe HTML.
function render(body) {
  const blocks = String(body || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    if (b.startsWith('## ')) return `<h2>${esc(b.slice(3).trim())}</h2>`;
    const lines = b.split('\n');
    if (lines.every((l) => /^- /.test(l.trim()))) return `<ul>${lines.map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join('')}</ul>`;
    return `<p>${esc(lines.join(' '))}</p>`;
  }).join('\n');
}

const today = () => new Date().toISOString().slice(0, 10);
const readMins = (body) => Math.max(1, Math.round(String(body).split(/\s+/).length / 220));

function listPublic() {
  return db.prepare('SELECT * FROM posts WHERE published = 1 AND published_at <= ? ORDER BY published_at DESC, id DESC').all(today());
}
function bySlug(slug) {
  return db.prepare('SELECT * FROM posts WHERE slug = ? AND published = 1 AND published_at <= ?').get(slug, today());
}
function all() { return db.prepare('SELECT * FROM posts ORDER BY published_at DESC, id DESC').all(); }
function getById(id) { return db.prepare('SELECT * FROM posts WHERE id = ?').get(id); }

function validate(body, id) {
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const data = {
    title: str(body.title, 100),
    slug: slugify(body.slug) || slugify(body.title),
    summary: str(body.summary, 160),
    body: typeof body.body === 'string' ? body.body.replace(/\r\n?/g, '\n').trim().slice(0, 30000) : '',
    published: body.published ? 1 : 0,
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(body.published_at || '') ? body.published_at : today(),
  };
  const errors = [];
  if (!data.title) errors.push('Give the post a title.');
  if (!data.slug) errors.push('The web address (slug) needs letters or numbers.');
  if (!data.summary) errors.push('Add a short summary (shown in search results, up to 160 characters).');
  if (!data.body) errors.push('Write the post.');
  const clash = data.slug && db.prepare('SELECT id FROM posts WHERE slug = ?').get(data.slug);
  if (clash && clash.id !== id) errors.push('Another post already uses that web address. Change the slug.');
  return { data, errors };
}

function save(id, d) {
  if (id) {
    db.prepare(`UPDATE posts SET slug=@slug, title=@title, summary=@summary, body=@body, published=@published, published_at=@published_at, updated_at=datetime('now') WHERE id=@id`).run({ ...d, id });
    return getById(id);
  }
  const r = db.prepare('INSERT INTO posts (slug, title, summary, body, published, published_at) VALUES (@slug, @title, @summary, @body, @published, @published_at)').run(d);
  return getById(r.lastInsertRowid);
}
function remove(id) { db.prepare('DELETE FROM posts WHERE id = ?').run(id); }

module.exports = { render, readMins, listPublic, bySlug, all, getById, validate, save, remove, slugify };
