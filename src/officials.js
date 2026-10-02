// ECC 2026 Friday officials from the organisers' sheet (provisional). [Referee 1, Referee 2 / Table]; a team name means that team supplies the official.
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
// ECC 2026 Saturday officials from the spreadsheet supplied on 2 Oct (provisional): games from 07:30 to 13:00 only, later games are not allocated yet.
// Checked against the organiser's own game list for Saturday (printed 2 Oct, 21:50): F18 and F19 had the two referees swapped in the spreadsheet, and the organiser spells ABBATE Giulio and PILAR Lukasz.
// [Referee 1, Referee / Table 2]. A team name means that team supplies the official; "(Men)" after a club means its men's team covers a women's game.
const OFFICIALS_SAT = {
  F16: ['ANDERSON Brian', 'Kingston'], F17: ['ANASTASI Martina', 'Praha'], F18: ['ANDZIAK Marzena', 'Duisburg'],
  F19: ['ABBATE Giulio', 'Kilkenny (Men)'], F20: ['BRACKEZ Virginie', 'Setubal (Men)'], F21: ['DOWNES Sean', 'Skovshoveld (Men)'],
  M9: ['DIEDRICH Henning', 'Chiavari'], M44: ['KOERBER Swantje', 'Coimbra'], M40: ['ABBATE Giulio', 'Dispersus'],
  M41: ['BRACKEZ Virginie', 'Corbeil-Essenos'], M42: ['WATTS Steve', 'Deventer'], M43: ['WINTERS Thom', 'Iper'],
  F22: ['ANDZIAK Marzena', 'Avranches'], F23: ['ANDERSON Brian', 'Burriana'], F24: ['ANASTASI Martina', 'Mullingar'],
  M45: ['DIEDRICH Henning', 'Avranches'], M26: ['PILAR Lukasz', 'Branik'], M46: ['DOWNES Sean', 'Castellón'], F25: ['WATTS Steve', 'Neptun'],
  M23: ['WINTERS Thom', 'Kilkenny'], M47: ['PELLI Maurizio', 'KGV Essen'], M49: ['PILAR Lukasz', 'Linkopig'], M50: ['WINTERS Thom', 'Gent'],
  M51: ['ANASTASI Martina', 'KSVH Berlin'], F26: ['ABBATE Giulio', 'Alaquas'], F27: ['WATTS Steve', 'Deventer'], M35: ['ANDERSON Brian', 'Poznan'],
  M66: ['ANDZIAK Marzena', 'Praha'], F28: ['BRACKEZ Virginie', 'Ichnusa'], F29: ['DIEDRICH Henning', 'KRM Essen'], M54: ['DOWNES Sean', 'Warszawa'],
  M55: ['ANASTASI Martina', 'Setubal'], M37: ['PELLI Maurizio', 'Avranches'], M57: ['ABBATE Giulio', 'Chiavari'], M58: ['WINTERS Thom', 'Coimbra'],
  M59: ['WATTS Steve', 'Corbeil-Essenos'], F30: ['KOERBER Swantje', "Pont D'ouilly"], M60: ['ANASTASI Martina', 'Odysseus'],
  M61: ['ANDERSON Brian', 'Skovshoveld'], M62: ['DIEDRICH Henning', 'Zurich'], M15: ['BRACKEZ Virginie', 'Thurgauer'],
  M24: ['ANDZIAK Marzena', 'Castellón'], M65: ['PILAR Lukasz', 'Branik'], M53: ['PELLI Maurizio', 'Ulster'],
};
module.exports = { OFFICIALS, OFFICIALS_SAT };
