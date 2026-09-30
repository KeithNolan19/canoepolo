// Small bits of browser behaviour (kept in a file because the security policy blocks inline scripts).
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Filters: apply automatically when a dropdown/month changes
document.querySelectorAll('form[data-autosubmit]').forEach((form) => {
  form.querySelectorAll('select, input[type="month"]').forEach((el) => {
    el.addEventListener('change', () => form.submit());
  });
});
