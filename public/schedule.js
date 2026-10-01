// Filters for match schedules on tournament pages (the full list shows if this script does not run).
(function () {
  'use strict';
  document.querySelectorAll('[data-sched]').forEach((box) => {
    const bar = box.querySelector('.sched-filters');
    const empty = box.querySelector('.sched-empty');
    const summary = box.querySelector('[data-summary]');
    const field = (k) => box.querySelector('[data-f="' + k + '"]');
    const get = (k) => (field(k) || {}).value || '';
    bar.hidden = false;

    function apply() {
      const team = get('team'), q = get('q').trim().toLowerCase(), div = get('div'), grp = get('grp'), pitch = get('pitch');
      let shown = 0;
      box.querySelectorAll('[data-day]').forEach((day) => {
        let dayCount = 0;
        day.querySelectorAll('[data-slot]').forEach((slot) => {
          let n = 0;
          slot.querySelectorAll('.sched-match').forEach((m) => {
            const ok = (!team || m.dataset.keys.split('||').includes(team))
              && (!q || m.dataset.teams.includes(q))
              && (!div || m.dataset.div === div)
              && (!grp || m.dataset.grp === grp)
              && (!pitch || m.dataset.pitch === pitch);
            m.hidden = !ok;
            if (ok) n += 1;
          });
          slot.hidden = n === 0;
          dayCount += n;
        });
        day.hidden = dayCount === 0;
        shown += dayCount;
      });
      empty.hidden = shown !== 0;
      const filtered = team || q || div || grp || pitch;
      if (filtered && shown) {
        const label = team ? team.split('|')[0] + ' (' + team.split('|')[1] + ')' : 'these filters';
        summary.textContent = shown + ' match' + (shown === 1 ? '' : 'es') + ' for ' + label;
        summary.hidden = false;
      } else {
        summary.hidden = true;
      }
    }

    // choosing a team clears the free-text search, and the other way round
    field('team').addEventListener('change', () => { if (get('team')) field('q').value = ''; });
    field('q').addEventListener('input', () => { if (get('q')) field('team').value = ''; });
    bar.addEventListener('input', apply);
    bar.addEventListener('change', apply);
  });
})();
