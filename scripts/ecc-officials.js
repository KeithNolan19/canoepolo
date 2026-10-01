// Builds public/docs/milan-ecc-2026-friday-officials.pdf from the organisers' officials sheet.
// Usage: node scripts/ecc-officials.js   (edit OFFICIALS below when the updated sheet arrives)
// Each entry is [Referee 1, Referee 2 / Table]. A team name in a slot means that team supplies the official.
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { forSlug } = require('../src/schedules');

const OFFICIALS = {
  M1: ['WINTERS Thom', 'Avranches'], M2: ['BRACKEZ Virginie', 'Castellón'], F2: ['KOERBER Swantje', 'Avranches'],
  M3: ['WINTERS Thom', 'Chiavari'], M4: ['BRACKEZ Virginie', 'Coimbra'], M5: ['WATTS Steve', 'Gent'], M6: ['Kilkenny', 'Kilkenny'],
  F3: ['ANDZIAK Marzena', 'Burriana'], F4: ['KOERBER Swantje', 'Duisburg'], M7: ['WATTS Steve', 'Branik'], M8: ['Corbeil-Essenos', 'Corbeil-Essenos'],
  F5: ['ANDZIAK Marzena', 'Alaquas'], F6: ['BRACKEZ Virginie', 'Kingston'], F7: ['WINTERS Thom', 'Rovigo'],
  M39: ['WATTS Steve', 'Deventer'], M10: ['Iper', 'Iper'], M11: ['ANASTASI Martina', 'KGV Essen'], M12: ['Praha', 'Praha'],
  M13: ['WINTERS Thom', 'Branik'], M14: ['BRACKEZ Virginie', 'Castellón'], M63: ['Deventer', 'Deventer'], M16: ['ANDZIAK Marzena', 'KGV Essen'],
  F9: ['KOERBER Swantje', 'Ichnusa'], F10: ['ANDZIAK Marzena', 'Deventer'], M17: ['DOWNES Sean', 'Malaga'], M18: ['WATTS Steve', 'Skovshoveld'],
  M36: ['BRACKEZ Virginie', 'Dispersus'], M20: ['Linkopig', 'Linkopig'], M21: ['ANASTASI Martina', 'Odysseus'], M22: ['WINTERS Thom', 'Poznan'],
  M31: ['DOWNES Sean', 'Setubal'], F11: ['WATTS Steve', 'Praha'], F12: ['KOERBER Swantje', 'Zurich'],
  F13: ['ANASTASI Martina', 'Deventer'], F14: ['WINTERS Thom', 'Praha'], F15: ['Zurich', 'Zurich'], M64: ['BRACKEZ Virginie', 'KSVH Berlin'],
  M25: ['DOWNES Sean', 'Napoli'], M27: ['WATTS Steve', 'Ulster'], M30: ['ANDZIAK Marzena', 'Gent'],
  F8: ['BRACKEZ Virginie', 'KRM Essen'], M48: ['ANASTASI Martina', 'Chiavari'], M29: ['WINTERS Thom', 'Corbeil-Essenos'], F1: ['ANDZIAK Marzena', ''],
  M32: ['DOWNES Sean', 'Corbeil-Essenos'], M28: ['WATTS Steve', 'Independent official'], M33: ['KSVH Berlin', 'KSVH Berlin'], M34: ['Warszawa', 'Warszawa'],
  M52: ['DOWNES Sean', 'Avranches'], M19: ['ANASTASI Martina', 'Dispersus'], M56: ['ANDZIAK Marzena', 'Malaga'], M38: ['ANDERSON Brian', 'Thurgauer'],
};

// Entries flagged "being checked" in the PDF: [match code, slot index 0 or 1]
const CHECK = new Set(['M1:1', 'F2:1', 'F10:1', 'F11:1']);
const sched = forSlug('paddle-europe-canoe-polo-club-championships-2026');
const slots = sched.days[0].slots; // Friday
const rows = [];
slots.forEach((sl) => sl.matches.forEach((m) => rows.push({ ...m, start: sl.start, end: sl.end })));
rows.forEach((r) => { if (!OFFICIALS[r.code]) throw new Error('No officials for ' + r.code); });

// Sanity checks: a person or team doing two jobs in one slot, or a team on duty while playing
const problems = [];
slots.forEach((sl) => {
  const seen = new Map(); const playing = new Set();
  sl.matches.forEach((m) => { playing.add(m.home); playing.add(m.away); });
  sl.matches.forEach((m) => {
    const [a, b] = OFFICIALS[m.code];
    [a, b].filter(Boolean).forEach((o) => {
      const own = a === b; // a team doing both jobs on one match is intended
      if (seen.has(o) && !(own && seen.get(o) === m.code)) problems.push(`${sl.start}: ${o} is used twice (${seen.get(o)} and ${m.code})`);
      seen.set(o, m.code);
      if (playing.has(o)) problems.push(`${sl.start}: ${o} has duty on ${m.code} while playing`);
    });
  });
});
if (problems.length) console.log('Check these:\n' + problems.join('\n'));

const FONT = path.join(__dirname, '..', 'src', 'fonts');
const doc = new PDFDocument({ size: 'A4', margin: 36, info: { Title: 'ECC 2026 Friday referees and table officials', Author: 'canoepolo.eu' } });
doc.registerFont('R', path.join(FONT, 'Poppins-Regular.ttf'));
doc.registerFont('M', path.join(FONT, 'Poppins-Medium.ttf'));
doc.registerFont('B', path.join(FONT, 'Poppins-Bold.ttf'));
doc.pipe(fs.createWriteStream(path.join(__dirname, '..', 'public', 'docs', 'milan-ecc-2026-friday-officials.pdf')));

const INK = '#0d1b1a', MUTED = '#55655f', LINE = '#d9d4c6', BALL = '#5bc8ff', SOFT = '#f3efe4', TEAM = '#e6f4fb';
const X = 36, W = doc.page.width - 72;
const cols = [ // x offset, width
  [0, 40], [40, 28], [68, 36], [104, 170], [274, 120], [394, W - 394],
];
function head(first) {
  if (first) {
    doc.font('B').fontSize(17).fillColor(INK).text('ECC 2026, Friday 2 October', X, 36);
    doc.font('M').fontSize(11).fillColor(MUTED).text('Referees and table officials', X, doc.y);
    doc.moveDown(0.4);
    doc.font('R').fontSize(8.5).fillColor(INK).text('Provisional list, directly from the organiser. There may be a discrepancy, which the organiser will check and clear up soon. An updated list will follow, so check canoepolo.eu for the latest. A team name means that team supplies the official. Where the same team is shown twice, that team supplies both referees, because there are not enough ICF referees.', X, doc.y, { width: W });
    doc.moveDown(0.6);
  }
  const y = doc.y;
  doc.rect(X, y, W, 18).fill(BALL);
  doc.font('B').fontSize(8).fillColor(INK);
  ['Time', 'Pitch', 'Match', 'Teams', 'Referee 1', 'Referee 2 / Table'].forEach((t, i) => doc.text(t, X + cols[i][0] + 4, y + 5, { width: cols[i][1] - 6, lineBreak: false }));
  doc.y = y + 20;
}
head(true);
const RH = 18; let n = 0;
rows.forEach((r, idx) => {
  if (doc.y + RH > doc.page.height - 50) { doc.addPage(); head(false); }
  const y = doc.y; const [a, b] = OFFICIALS[r.code];
  const firstOfSlot = idx === 0 || rows[idx - 1].start !== r.start;
  if (firstOfSlot) n++;
  if (n % 2) doc.rect(X, y, W, RH).fill(SOFT);
  doc.fillColor(INK).font('B').fontSize(8);
  if (firstOfSlot) doc.text(r.start, X + 4, y + 5, { width: 36, lineBreak: false });
  doc.font('M').text(String(r.pitch), X + cols[1][0] + 4, y + 5, { width: 22, lineBreak: false });
  doc.text(r.code, X + cols[2][0] + 4, y + 5, { width: 30, lineBreak: false });
  doc.font('R').text(`${r.home} v ${r.away}`, X + cols[3][0] + 4, y + 5, { width: cols[3][1] - 6, lineBreak: false, ellipsis: true });
  const isTeam = (o) => o && !/[A-Z]{3,} /.test(o) && o !== 'Independent official';
  [[a, 4], [b, 5]].forEach(([o, i]) => {
    if (!o) { doc.fillColor(MUTED).font('R').text('To be confirmed', X + cols[i][0] + 4, y + 5, { width: cols[i][1] - 6, lineBreak: false }); return; }
    doc.fillColor(INK).font(isTeam(o) ? 'M' : 'R').text(o + (CHECK.has(r.code + ':' + (i - 4)) ? ' *' : ''), X + cols[i][0] + 4, y + 5, { width: cols[i][1] - 6, lineBreak: false, ellipsis: true });
  });
  doc.moveTo(X, y + RH).lineTo(X + W, y + RH).lineWidth(0.4).strokeColor(LINE).stroke();
  doc.y = y + RH;
});

// Team duty summary
const duty = {};
rows.forEach((r) => { const [a, b] = OFFICIALS[r.code]; [a, b].forEach((o) => { if (o && isTeamName(o)) duty[o] = (duty[o] || 0) + 1; }); });
function isTeamName(o) { return !/[A-Z]{3,} /.test(o) && o !== 'Independent official'; }
if (doc.y + 120 > doc.page.height - 50) doc.addPage();
doc.moveDown(1);
doc.font('B').fontSize(11).fillColor(INK).text('Team duty slots on Friday', X, doc.y);
doc.font('R').fontSize(8).fillColor(MUTED).text('Each referee or table slot a team supplies counts as one. A team supplying both referees for a match counts as two.', X, doc.y + 2, { width: W });
doc.moveDown(0.5);
const list = Object.entries(duty).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const per = Math.ceil(list.length / 3), cw = W / 3, y0 = doc.y;
list.forEach(([t, c], i) => {
  const col = Math.floor(i / per), row = i % per;
  doc.font('R').fontSize(8.5).fillColor(INK).text(t, X + col * cw, y0 + row * 13, { width: cw - 30, lineBreak: false });
  doc.font('B').text(String(c), X + col * cw + cw - 28, y0 + row * 13, { width: 20, align: 'right', lineBreak: false });
});
doc.y = y0 + per * 13 + 6;
doc.font('R').fontSize(7.5).fillColor(MUTED).text('Teams not listed have no duty slot on Friday in this list. Match times and pitches follow the updated timetable of 1 October.\n* Being checked with the organisers: the team shown is on duty at the same time as another duty or its own match.', X, doc.y, { width: W });
doc.end();
console.log('rows', rows.length, 'teams with duty', list.length);
