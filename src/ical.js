// Builds .ics calendar files so players can add tournaments to Google/Apple/Outlook calendars.
function esc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function fold(line) {
  // iCal lines should be max 75 octets; fold longer lines.
  const out = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ' ' + rest.slice(cut);
  }
  out.push(rest);
  return out.join('\r\n');
}

function nextDay(ymd) {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildCalendar(tournaments, baseUrl) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//canoepolo.eu//Tournaments//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Canoe Polo Tournaments',
  ];
  for (const t of tournaments) {
    const url = `${baseUrl}/tournaments/${t.slug}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:tournament-${t.id}@canoepolo.eu`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${t.start_date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${nextDay(t.end_date).replace(/-/g, '')}`,
      `SUMMARY:${esc((t.status === 'cancelled' ? 'CANCELLED: ' : '') + t.name)}`,
      `LOCATION:${esc([t.venue, t.city, t.country_name].filter(Boolean).join(', '))}`,
      `DESCRIPTION:${esc(`${t.level}${t.divisions.length ? ' — ' + t.divisions.join(', ') : ''}\n${url}`)}`,
      `URL:${url}`,
      `STATUS:${t.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

module.exports = { buildCalendar };
