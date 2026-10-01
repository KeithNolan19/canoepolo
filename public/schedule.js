// Filters for match schedules on tournament pages (the full list shows if this script does not run).
(function () {
  'use strict';
  document.querySelectorAll('[data-sched]').forEach((box) => {
    const bar = box.querySelector('.sched-filters');
    const empty = box.querySelector('.sched-empty');
    const get = (k) => (box.querySelector('[data-f="' + k + '"]') || {}).value || '';
    bar.hidden = false;
    function apply() {
      const q = get('q').trim().toLowerCase(), div = get('div'), grp = get('grp'), pitch = get('pitch');
      let shown = 0;
      box.querySelectorAll('[data-slot]').forEach((slot) => {
        let n = 0;
        slot.querySelectorAll('.sched-match').forEach((m) => {
          const ok = (!q || m.dataset.teams.includes(q)) && (!div || m.dataset.div === div) && (!grp || m.dataset.grp === grp) && (!pitch || m.dataset.pitch === pitch);
          m.hidden = !ok;
          if (ok) n += 1;
        });
        slot.hidden = n === 0;
        shown += n;
      });
      empty.hidden = shown !== 0;
    }
    bar.addEventListener('input', apply);
    bar.addEventListener('change', apply);
  });
})();
