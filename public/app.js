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

// Watch page: load the YouTube player only when someone presses play (privacy-friendly, faster page)
document.querySelectorAll('.video-frame[data-video]').forEach((box) => {
  const link = box.querySelector('.video-facade');
  if (!link) return;
  link.addEventListener('click', (e) => {
    const id = box.dataset.video;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    e.preventDefault();
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    f.title = box.dataset.title || 'Canoe polo video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(f);
    f.focus();
  });
});
