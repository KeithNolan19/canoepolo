// Search box for the team list on the text updates page. Without JavaScript the full list is shown.
(function () {
  var box = document.getElementById('sms-search');
  if (!box) return;
  var none = document.getElementById('sms-none');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.sms-team'));
  box.hidden = false;
  function filter() {
    var q = box.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (r) {
      var text = r.getAttribute('data-search') || '';
      var checked = r.querySelector('input').checked;
      var ok = checked || q.every(function (w) { return text.indexOf(w) !== -1; });
      r.hidden = !ok;
      if (ok) shown++;
    });
    if (none) none.hidden = shown > 0;
  }
  var searched = false;
  box.addEventListener('input', function () { if (!searched && window.cpEvent) { searched = true; window.cpEvent('sms-search'); } filter(); });
  var started = false;
  document.addEventListener('change', function (e) { if (!started && window.cpEvent && e.target && e.target.closest && e.target.closest('.sms-form')) { started = true; window.cpEvent('sms-form-start'); } });
  filter();
})();
