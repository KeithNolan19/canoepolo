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

// Mobile menu
(() => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;
  document.documentElement.classList.add('js');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
    btn.lastChild.textContent = open ? 'Close' : 'Menu';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('nav-open'); btn.lastChild.textContent = 'Menu'; btn.focus();
    }
  });
})();

// Homepage pitch: boats paddle from their goal lines into position, then the pass is drawn
(() => {
  const svg = document.querySelector('.hero-pitch svg');
  if (!svg || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const boats = [...svg.querySelectorAll('.hp-boat')].map((g) => ({
    g, text: g.querySelector('text'),
    a: g.dataset.from.split(',').map(Number), b: g.dataset.to.split(',').map(Number),
  }));
  const ball = svg.querySelector('.hp-ball');
  const pass = svg.querySelector('.hp-pass');
  const [bx0, by0] = ball.dataset.from.split(',').map(Number);
  const bx1 = Number(ball.getAttribute('cx')), by1 = Number(ball.getAttribute('cy'));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const place = (bt, t) => {
    const x = lerp(bt.a[0], bt.b[0], t), y = lerp(bt.a[1], bt.b[1], t);
    const d = ((bt.b[2] - bt.a[2]) % 360 + 540) % 360 - 180;
    const ang = bt.a[2] + d * t;
    bt.g.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`);
    bt.text.setAttribute('transform', `rotate(${-ang})`);
  };
  boats.forEach((bt) => place(bt, 0));
  ball.setAttribute('cx', bx0); ball.setAttribute('cy', by0);
  pass.classList.add('hidden');
  const DUR = 1800, t0 = performance.now() + 300;
  const frame = (now) => {
    let done = true;
    boats.forEach((bt, i) => {
      const t = Math.min(1, Math.max(0, (now - t0 - (i % 5) * 70) / DUR));
      if (t < 1) done = false;
      place(bt, ease(t));
    });
    const tb = ease(Math.min(1, Math.max(0, (now - t0 - 500) / DUR)));
    ball.setAttribute('cx', lerp(bx0, bx1, tb)); ball.setAttribute('cy', lerp(by0, by1, tb));
    if (!done || tb < 1) requestAnimationFrame(frame);
    else pass.classList.remove('hidden');
  };
  requestAnimationFrame(frame);
})();

// Anonymous click counts for links that leave the site and for downloads (see /admin/stats). Nothing about the person is sent.
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || !navigator.sendBeacon || navigator.doNotTrack === '1' || location.pathname.startsWith('/admin')) return;
  const href = a.getAttribute('href') || '';
  const external = /^https?:\/\//i.test(href) && a.host !== location.host;
  const download = /^\/docs\//.test(href);
  if (!external && !download) return;
  try { navigator.sendBeacon('/_c', new Blob(['t=' + encodeURIComponent(href)], { type: 'application/x-www-form-urlencoded' })); } catch (err) { /* ignore */ }
});
