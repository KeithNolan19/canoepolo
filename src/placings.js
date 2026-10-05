// Final placings of the ECC 2026, worked out from the organiser's own games list (ecc2026milano.it, Sunday 4 October, all 40 games TERMINATA).
// Every place is decided by a game number (N°) on that list. Where the result depends on a tie-break rule the organiser has not published, we say so and do not pick.
// Club names are ours; "Lokomotiv" and "KS Powiśle" are written exactly as the organiser writes them because we have not matched them to a club in our list.
const ECC = 'paddle-europe-canoe-polo-club-championships-2026';
const g = (n, text) => `N° ${n}: ${text}`;
const DATA = {
  Men: [
    ['1', 'Odysseus', g(168, 'final, Málaga 3-4 Odysseus')],
    ['2', 'Malaga', g(168, 'final, Málaga 3-4 Odysseus')],
    ['3', 'Avranches', g(166, 'Pro Scogli 2-8 Avranches')],
    ['4', 'Chiavari', g(166, 'Pro Scogli 2-8 Avranches')],
    ['5', 'Napoli', g(157, 'KSVH Berlin 3-4 CC Napoli')],
    ['6', 'KSVH Berlin', g(157, 'KSVH Berlin 3-4 CC Napoli')],
    ['7', 'Corbeil-Essenos', g(158, 'Corbeil 6-3 Ulster')],
    ['8', 'Ulster', g(158, 'Corbeil 6-3 Ulster')],
    ['9', 'Coimbra', g(155, 'Coimbra 7-2 Castellón')],
    ['10', 'Castellón', g(155, 'Coimbra 7-2 Castellón')],
    ['11', 'Thurgauer', g(156, 'Lokomotiv 2-4 Thurgau')],
    ['12', 'Lokomotiv', g(156, 'Lokomotiv 2-4 Thurgau'), 'Club name as the organiser writes it'],
    ['13', 'Iper', g(159, 'IRWV Ieper 5-4 Zürich')],
    ['14', 'Zurich', g(159, 'IRWV Ieper 5-4 Zürich')],
    ['15', 'KGV Essen', g(160, 'KGW Essen 5-4 Poznan')],
    ['16', 'Poznan', g(160, 'KGW Essen 5-4 Poznan')],
    ['17', 'Deventer', g(161, 'Deventer 11-1 Kilkenny')],
    ['18', 'Kilkenny', g(161, 'Deventer 11-1 Kilkenny')],
    ['19', 'KS Powiśle', g(162, 'KS Powiśle 5-4 Dispersus'), 'Club name as the organiser writes it'],
    ['20', 'Dispersus', g(162, 'KS Powiśle 5-4 Dispersus')],
    ['21', 'Gent', 'Group E, all 4 games: 3 wins, 1 draw, 10 points, goal difference +17'],
    ['22', 'Praha', 'Group E, all 4 games: 3 wins, 1 loss, 9 points, goal difference +5'],
    ['23', 'Linkopig', 'Group E, all 4 games: 2 wins, 1 draw, 1 loss, 7 points, goal difference +10'],
    ['24', 'Branik', 'Group E, all 4 games: 1 point, goal difference -15; ahead of Setúbal on goal difference'],
    ['25', 'Setubal', 'Group E, all 4 games: 1 point, goal difference -17'],
  ],
  Women: [
    ['1', 'Duisburg', g(167, 'final, Burriana 0-4 MKC Duisb.')],
    ['2', 'Burriana', g(167, 'final, Burriana 0-4 MKC Duisb.')],
    ['3', 'KRM Essen', g(165, 'RM Essen 5-2 Alaquàs')],
    ['4', 'Alaquas', g(165, 'RM Essen 5-2 Alaquàs')],
    ['5', 'Rovigo', 'Two games, Rovigo won both: N° 129 (3-1) and N° 152 (4-1)'],
    ['6', 'Zurich', 'Two games, Rovigo won both: N° 129 (3-1) and N° 152 (4-1)'],
    ['7', 'Avranches', g(143, 'Pt Ouilly 1-4 Avranches W')],
    ['8', "Pont D'ouilly", g(143, 'Pt Ouilly 1-4 Avranches W')],
    ['9', 'Kingston', g(153, 'Kingston 4-2 Ichnusa')],
    ['10', 'Ichnusa', g(153, 'Kingston 4-2 Ichnusa')],
    ['11', 'Thurgauer', 'Two games, Thurgau W won both: N° 150 (4-1) and N° 164 (6-3)'],
    ['12', 'Mullingar', 'Two games, Thurgau W won both: N° 150 (4-1) and N° 164 (6-3)'],
    ['13', 'Neptun', 'Group F (double round robin, Saturday and Sunday games): Neptun 9 points, Praha 6, Deventer 3, from the organiser\'s Round FF table'],
    ['14', 'Praha', 'Group F: 6 points from 4 games, from the organiser\'s Round FF table'],
    ['15', 'Deventer', 'Group F: 3 points from 4 games, from the organiser\'s Round FF table'],
  ],
};
const NOTE = '';
// How a club is written on this page (the lookup key above stays our own name, for the flag)
const DISPLAY = { Iper: 'Ieper', Gent: 'Gekko', Chiavari: 'Chiavari Pro Scogli' };
// Flags for the two clubs the organiser names differently from our list: Lokomotiv = Lokomotiv Skovshoved (Denmark, in our gazebo list), KS Powiśle = Warsaw (Poland)
const FLAGS = { Lokomotiv: 'DK', 'KS Powiśle': 'PL' };
function forSlug(slug) { return slug === ECC ? { data: DATA, note: NOTE, display: DISPLAY, flags: FLAGS } : null; }
module.exports = { forSlug, DATA };
