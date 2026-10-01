// Match schedules shown on tournament pages, keyed by tournament slug.
// Each match is [start, end, pitch, match code, home, away, group]. M = men, F = women.
// To add a day, copy the PDF into public/docs/, add a day below and list the matches.
const SCHEDULES = {
  'paddle-europe-canoe-polo-club-championships-2026': {
    headline: 'Friday timetable is here. Saturday and Sunday will be released soon.',
    pending: ['Saturday 3 October', 'Sunday 4 October'],
    note: 'Provisional timetable from the organisers. Times and matches can change. For any questions or problems, contact the organisers directly.',
    days: [
      {
        date: '2026-10-02',
        label: 'Friday 2 October',
        pdf: '/docs/milan-ecc-2026-friday-timetable.pdf',
        matches: [
          ["12:00", "12:30", 1, "M1", "Branik", "Corbeil-Essenos", "A"],
          ["12:00", "12:30", 2, "M2", "KGV Essen", "Poznan", "C"],
          ["12:00", "12:30", 3, "F1", "Zurich", "Duisburg", "A"],
          ["12:00", "12:30", 4, "F2", "Burriana", "Praha", "B"],
          ["12:30", "13:00", 1, "M3", "Praha", "Malaga", "C"],
          ["12:30", "13:00", 2, "M4", "Iper", "Dispersus", "B"],
          ["12:30", "13:00", 3, "M5", "KSVH Berlin", "Deventer", "A"],
          ["12:30", "13:00", 4, "M6", "Warszawa", "Ulster", "D"],
          ["13:00", "13:30", 1, "F3", "KRM Essen", "Thurgauer", "B"],
          ["13:00", "13:30", 2, "F4", "Deventer", "Mullinger", "C"],
          ["13:00", "13:30", 3, "M7", "Avranches", "Thurgauer", "B"],
          ["13:00", "13:30", 4, "M8", "Odysseus", "Setubal", "B"],
          ["13:30", "14:00", 1, "F5", "Pont D'ouilly", "Neptun", "A"],
          ["13:30", "14:00", 2, "F6", "Ichnusa", "Zurich", "A"],
          ["13:30", "14:00", 3, "F7", "Praha", "Avranches", "B"],
          ["14:00", "14:30", 1, "M39", "Napoli", "Ulster", "D"],
          ["14:00", "14:30", 2, "M10", "Skovshoveld", "Malaga", "C"],
          ["14:00", "14:30", 3, "M11", "KSVH Berlin", "Corbeil-Essenos", "A"],
          ["14:00", "14:30", 4, "M12", "Coimbra", "Kilkenny", "A"],
          ["14:30", "15:00", 1, "M13", "Chiavari", "Poznan", "C"],
          ["14:30", "15:00", 2, "M14", "Odysseus", "Dispersus", "B"],
          ["14:30", "15:00", 3, "M63", "Warszawa", "Gent", "D"],
          ["14:30", "15:00", 4, "M16", "Zurich", "Linkopig", "D"],
          ["15:00", "15:30", 1, "F9", "Rovigo", "Deventer", "C"],
          ["15:00", "15:30", 3, "M17", "Avranches", "Iper", "B"],
          ["15:00", "15:30", 4, "M18", "Thurgauer", "Setubal", "B"],
          ["15:30", "16:00", 1, "M36", "Castellón", "Napoli", "D"],
          ["15:30", "16:00", 2, "M20", "KSVH Berlin", "Branik", "A"],
          ["15:30", "16:00", 3, "M21", "Deventer", "Coimbra", "A"],
          ["15:30", "16:00", 4, "M22", "Corbeil-Essenos", "Kilkenny", "A"],
          ["16:00", "16:30", 1, "M31", "Praha", "KGV Essen", "C"],
          ["16:00", "16:30", 2, "F10", "Duisburg", "Pont D'ouilly", "A"],
          ["16:00", "16:30", 3, "F11", "Avranches", "KRM Essen", "B"],
          ["16:00", "16:30", 4, "F12", "Thurgauer", "Burriana", "B"],
          ["16:30", "17:00", 1, "F13", "Neptun", "Ichnusa", "A"],
          ["16:30", "17:00", 2, "F14", "Kingston", "Rovigo", "C"],
          ["16:30", "17:00", 3, "F15", "Mullinger", "Alaquas", "C"],
          ["16:30", "17:00", 4, "M64", "Chiavari", "Skovshoveld", "C"],
          ["17:00", "17:30", 1, "M25", "Castellón", "Linkopig", "D"],
          ["17:00", "17:30", 3, "M27", "Warszawa", "Zurich", "D"],
          ["17:30", "18:00", 1, "F8", "Alaquas", "Kingston", "C"],
          ["17:30", "18:00", 2, "M48", "Malaga", "KGV Essen", "C"],
          ["17:30", "18:00", 3, "M29", "Avranches", "Setubal", "B"],
          ["17:30", "18:00", 4, "M30", "Dispersus", "Thurgauer", "B"],
          ["18:00", "18:30", 1, "M32", "Odysseus", "Iper", "B"],
          ["18:00", "18:30", 2, "M28", "Skovshoveld", "Poznan", "C"],
          ["18:00", "18:30", 3, "M33", "Branik", "Coimbra", "A"],
          ["18:00", "18:30", 4, "M34", "Deventer", "Kilkenny", "A"],
          ["18:30", "19:00", 1, "M52", "Chiavari", "Praha", "C"],
          ["18:30", "19:00", 2, "M19", "Castellón", "Gent", "D"],
          ["18:30", "19:00", 3, "M56", "Napoli", "Zurich", "D"],
          ["18:30", "19:00", 4, "M38", "Ulster", "Linkopig", "D"],
        ],
      },
    ],
  },
};

// Turn the compact lists into objects, grouped by time slot
function forSlug(slug) {
  const s = SCHEDULES[slug];
  if (!s) return null;
  const teamSet = new Map();
  s.days.forEach((d) => d.matches.forEach(([, , , code, home, away]) => {
    const division = code[0] === 'F' ? 'Women' : 'Men';
    [home, away].forEach((name) => teamSet.set(`${name}|${division}`, { name, division }));
  }));
  const teams = [...teamSet.values()].sort((a, b) => a.name.localeCompare(b.name) || a.division.localeCompare(b.division));
  return {
    note: s.note,
    headline: s.headline || '',
    pending: s.pending || [],
    teams,
    groups: [...new Set(s.days.flatMap((d) => d.matches.map((m) => m[6])))].sort(),
    pitches: [...new Set(s.days.flatMap((d) => d.matches.map((m) => m[2])))].sort((a, b) => a - b),
    days: s.days.map((d) => {
      const slots = [];
      d.matches.forEach(([start, end, pitch, code, home, away, group]) => {
        let slot = slots.find((x) => x.start === start);
        if (!slot) { slot = { start, end, matches: [] }; slots.push(slot); }
        slot.matches.push({ pitch, code, home, away, group, division: code[0] === 'F' ? 'Women' : 'Men' });
      });
      slots.sort((a, b) => a.start.localeCompare(b.start));
      slots.forEach((x) => x.matches.sort((a, b) => a.pitch - b.pitch));
      const all = slots.flatMap((x) => x.matches);
      return {
        date: d.date, label: d.label, pdf: d.pdf, slots,
        groups: [...new Set(all.map((m) => m.group))].sort(),
        pitches: [...new Set(all.map((m) => m.pitch))].sort((a, b) => a - b),
      };
    }),
  };
}

module.exports = { forSlug };
