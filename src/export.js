// Downloads of a match schedule as a PDF (laid out for phone screens) or an Excel file.
// Uses the same filters as the schedule on the tournament page: team, search, division, group, pitch.
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const FONT = (n) => path.join(__dirname, 'fonts', `Poppins-${n}.ttf`);
const C = { deep: '#0a3b36', pool: '#5cc8ff', ball: '#ffc629', ink: '#0d1f1c', muted: '#5b6b66', line: '#d9d3c4', tile: '#f1ede3', paper: '#fbf9f4', women: '#0b7bb5' };

const cap = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

function readFilters(q) {
  return { team: cap(q.team, 120), q: cap(q.q, 60).toLowerCase(), div: cap(q.div, 10), grp: cap(q.grp, 60), pitch: cap(q.pitch, 4) };
}

// Returns days with only the matches that fit the filters (same rules as public/schedule.js).
function select(schedule, f) {
  const days = [];
  schedule.days.forEach((d) => {
    const matches = [];
    d.slots.forEach((sl) => sl.matches.forEach((m) => {
      const ok = (!f.team || [`${m.home}|${m.division}`, `${m.away}|${m.division}`].includes(f.team))
        && (!f.q || `${m.home} ${m.away}`.toLowerCase().includes(f.q))
        && (!f.div || m.division === f.div)
        && (!f.grp || m.group === f.grp)
        && (!f.pitch || String(m.pitch) === f.pitch);
      if (ok) matches.push({ ...m, start: sl.start, end: sl.end });
    }));
    if (matches.length) days.push({ date: d.date, label: d.label, matches });
  });
  return days;
}

function describe(f) {
  const [team, division] = f.team ? f.team.split('|') : ['', ''];
  const parts = [];
  if (!team) {
    if (f.q) parts.push(`Search: ${f.q}`);
    if (f.div) parts.push(f.div);
    if (f.grp) parts.push(f.grp.length === 1 ? `Group ${f.grp}` : f.grp);
    if (f.pitch) parts.push(`Pitch ${f.pitch}`);
  }
  return { team, division, title: team || (parts.join(', ') || 'All matches'), sub: team ? `${division} team` : (parts.length ? 'Filtered schedule' : 'Full schedule') };
}

const stageLabel = (g) => (g.length === 1 ? `Group ${g}` : g);
const fileName = (t, d, ext) => `${[t.slug, d.team || 'schedule'].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)}.${ext}`;

// ---------- PDF ----------
function pdf(t, schedule, f, res) {
  const days = select(schedule, f);
  const d = describe(f);
  const total = days.reduce((n, x) => n + x.matches.length, 0);
  const W = 360, H = 640, M = 18;
  const doc = new PDFDocument({ size: [W, H], margins: { top: M, bottom: 34, left: M, right: M }, bufferPages: true, info: { Title: `${d.title}, ${t.name}`, Author: 'canoepolo.eu', Subject: 'Canoe polo match schedule' } });
  doc.registerFont('R', FONT('Regular')); doc.registerFont('M', FONT('Medium')); doc.registerFont('B', FONT('Bold'));
  res.type('application/pdf').set('Content-Disposition', `inline; filename="${fileName(t, d, 'pdf')}"`);
  doc.pipe(res);
  const cw = W - 2 * M;
  const bottom = () => H - 40;
  const page = () => doc.rect(0, 0, W, H).fill(C.paper);

  page();
  // cover band
  doc.rect(0, 0, W, 162).fill(C.deep);
  doc.rect(0, 162, W, 5).fill(C.pool);
  doc.fillColor(C.pool).font('B').fontSize(8.5).text('CANOE POLO SCHEDULE', M, 20, { characterSpacing: 1.2 });
  doc.fillColor('#ffffff').font('B').fontSize(d.title.length > 22 ? 21 : 26).text(d.title, M, 36, { width: cw, lineGap: 1 });
  let y = doc.y + 2;
  doc.fillColor(C.pool).font('M').fontSize(11).text(d.sub, M, y, { width: cw });
  doc.fillColor('#ffffff').font('M').fontSize(9.5).text(t.name, M, 110, { width: cw, height: 14, ellipsis: true, lineBreak: false });
  doc.fillColor('#b9d4cf').font('R').fontSize(8).text(rangeText(t), M, 127, { width: cw, lineBreak: false });
  doc.text([t.venue, t.city].filter(Boolean).join(', '), M, 140, { width: cw, height: 10, ellipsis: true, lineBreak: false });
  y = 184;

  doc.fillColor(C.ink).font('B').fontSize(13).text(`${total} match${total === 1 ? '' : 'es'}`, M, y, { continued: true }).font('R').fontSize(9).fillColor(C.muted).text(`   ${days.length} day${days.length === 1 ? '' : 's'}`);
  y = doc.y + 10;

  const newPage = () => {
    doc.addPage(); page();
    doc.rect(0, 0, W, 26).fill(C.deep);
    doc.fillColor('#ffffff').font('M').fontSize(8.5).text(`${d.title}  |  ${t.name}`, M, 9, { width: cw, height: 11, ellipsis: true });
    y = 40;
  };

  days.forEach((day) => {
    if (y + 32 + 110 > bottom()) newPage();
    doc.roundedRect(M, y, cw, 24, 12).fill(C.deep);
    doc.fillColor('#ffffff').font('B').fontSize(11).text(day.label, M + 14, y + 6.5, { width: cw - 28, lineBreak: false });
    y += 32;
    day.matches.forEach((m) => {
      const label = (name) => ({ name, me: f.team && f.team === `${name}|${m.division}` });
      const a = label(m.home), b = label(m.away);
      doc.font('B').fontSize(11.5);
      const th = Math.max(doc.heightOfString(`${m.home}  v  ${m.away}`, { width: cw - 30 }), 18);
      const h = 36 + th + 4 + 12 + 10;
      if (y + h > bottom()) newPage();
      const accent = m.division === 'Women' ? C.women : C.deep;
      doc.roundedRect(M, y, cw, h, 8).fill('#ffffff');
      doc.roundedRect(M, y, cw, h, 8).lineWidth(0.8).stroke(C.line);
      doc.save().roundedRect(M, y, 5, h, 2.5).fill(accent).restore();
      // time and pitch
      doc.fillColor(C.ink).font('B').fontSize(17).text(m.start, M + 16, y + 9, { continued: true, lineBreak: false }).font('R').fontSize(9).fillColor(C.muted).text(`  to ${m.end}`, { lineBreak: false });
      const pw = 54;
      doc.roundedRect(M + cw - pw - 10, y + 10, pw, 19, 9.5).fill(C.pool);
      doc.fillColor(C.deep).font('B').fontSize(9).text(`Pitch ${m.pitch}`, M + cw - pw - 10, y + 15, { width: pw, align: 'center', lineBreak: false });
      // teams
      let ty = y + 36;
      doc.fontSize(11.5);
      doc.font(a.me ? 'B' : (f.team ? 'M' : 'B')).fillColor(a.me ? C.deep : C.ink).text(m.home, M + 16, ty, { width: cw - 30, continued: true });
      doc.font('R').fillColor(C.muted).text('  v  ', { continued: true });
      doc.font(b.me ? 'B' : (f.team ? 'M' : 'B')).fillColor(b.me ? C.deep : C.ink).text(m.away, { width: cw - 30 });
      doc.fillColor(C.muted).font('R').fontSize(8).text(`${m.division}  |  ${stageLabel(m.group)}  |  ${m.code}`, M + 16, y + 36 + th + 6, { width: cw - 30, lineBreak: false });
      y += h + 8;
    });
    y += 6;
  });

  if (!total) {
    doc.fillColor(C.muted).font('R').fontSize(11).text('No matches fit these filters.', M, y, { width: cw });
    y = doc.y + 10;
  }
  if (y + 70 > bottom()) newPage();
  doc.roundedRect(M, y, cw, 62, 8).fill(C.tile);
  doc.fillColor(C.ink).font('M').fontSize(8).text('Based on the published timetable. Times are local. Check with the organisers for any changes, and for ties and carry-over rules.', M + 12, y + 9, { width: cw - 24 });
  doc.fillColor(C.muted).font('R').fontSize(7.5).text(`Updated ${new Date().toISOString().slice(0, 10)}  |  canoepolo.eu`, M + 12, y + 44, { width: cw - 24, lineBreak: false });

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.fillColor(C.muted).font('R').fontSize(8).text('canoepolo.eu', M, H - 22, { width: cw / 2, lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, M + cw / 2, H - 22, { width: cw / 2, align: 'right', lineBreak: false });
  }
  doc.end();
}

function rangeText(t) {
  const f = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return t.end_date && t.end_date !== t.start_date ? `${f(t.start_date)} to ${f(t.end_date)}` : f(t.start_date);
}

// ---------- Excel ----------
async function xlsx(t, schedule, f, res) {
  const days = select(schedule, f);
  const d = describe(f);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'canoepolo.eu';
  const ws = wb.addWorksheet('Matches', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  ws.columns = [{ width: 12 }, { width: 18 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 28 }, { width: 28 }, { width: 10 }, { width: 24 }, { width: 8 }];
  ws.mergeCells('A1:J1'); ws.getCell('A1').value = `${d.title} (${d.sub})`;
  ws.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A3B36' } };
  ws.getRow(1).height = 28;
  ws.mergeCells('A2:J2'); ws.getCell('A2').value = `${t.name}  |  ${rangeText(t)}  |  ${[t.venue, t.city, t.country_name].filter(Boolean).join(', ')}`;
  ws.mergeCells('A3:J3'); ws.getCell('A3').value = 'Based on the published timetable. Times are local. Check with the organisers for any changes.';
  ws.getCell('A3').font = { italic: true, size: 9, color: { argb: 'FF5B6B66' } };
  const head = ws.getRow(5);
  head.values = ['Date', 'Day', 'Start', 'End', 'Pitch', 'Home', 'Away', 'Division', 'Group or stage', 'Match'];
  head.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A3B36' } }; c.alignment = { vertical: 'middle' }; });
  head.height = 22;
  days.forEach((day) => {
    const dt = new Date(`${day.date}T00:00:00Z`);
    const weekday = dt.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
    day.matches.forEach((m) => {
      const r = ws.addRow([dt, weekday, m.start, m.end, m.pitch, m.home, m.away, m.division, stageLabel(m.group), m.code]);
      r.getCell(1).numFmt = 'dd mmm yyyy';
      r.eachCell((c) => { c.border = { bottom: { style: 'thin', color: { argb: 'FFD9D3C4' } } }; c.alignment = { vertical: 'middle' }; });
      [f.team && f.team === `${m.home}|${m.division}` ? 6 : (f.team && f.team === `${m.away}|${m.division}` ? 7 : 0)].forEach((i) => { if (i) r.getCell(i).font = { bold: true, color: { argb: 'FF0A3B36' } }; });
    });
  });
  if (days.length) ws.autoFilter = { from: 'A5', to: `J${5 + days.reduce((n, x) => n + x.matches.length, 0)}` };
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').set('Content-Disposition', `attachment; filename="${fileName(t, d, 'xlsx')}"`);
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { pdf, xlsx, readFilters };
