// Carousels run only while visible. Each has independent, accessible controls.
document.querySelectorAll('[data-carousel]').forEach(root => {
  const slides = [...root.querySelectorAll('.carousel-slide')];
  if (!slides.length) return;
  const dots = [...root.querySelectorAll('[data-slide]')];
  const pause = root.querySelector('[data-pause]');
  const stage = root.querySelector('.carousel-stage');
  const mobile = matchMedia('(max-width: 620px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, inView = false, hovered = false, focused = false;
  let userPaused = reduced.matches, pointerStart, suppressClickUntil = 0;
  const enabled = () => !root.hasAttribute('data-only-mobile') || mobile.matches;
  const label = root.dataset.carousel;
  const canPlay = () => enabled() && slides.length > 1 && inView && !document.hidden && !userPaused && !hovered && !focused;

  function schedule() {
    clearTimeout(timer);
    const playing = canPlay();
    root.dataset.playing = String(playing);
    if (playing) timer = setTimeout(() => show(index + 1), Number(root.dataset.interval) || 7000);
  }
  function show(next, manual = false) {
    index = (next + slides.length) % slides.length;
    const active = enabled();
    slides.forEach((slide, i) => {
      const visible = !active || i === index;
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(!visible));
      slide.inert = !visible;
    });
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-pressed', String(i === index));
      dot.classList.toggle('is-active', i === index);
    });
    const count = root.querySelector('.carousel-count');
    if (count) count.textContent = `${index + 1} / ${slides.length}`;
    root.dataset.activeSlide = String(index + 1);
    const caption = root.querySelector('[data-photo-caption]');
    if (caption) caption.textContent = slides[index].querySelector('figcaption').textContent.trim();
    if (manual) {
      const title = slides[index].querySelector('h3, figcaption')?.textContent.trim() || '';
      root.querySelector('.carousel-status').textContent = `${index + 1} de ${slides.length}. ${title}`;
    }
    schedule();
  }
  function updatePause() {
    pause?.setAttribute('aria-pressed', String(userPaused));
    pause?.setAttribute('aria-label', `${userPaused ? 'Reanudar' : 'Pausar'} ${label}`);
    pause?.classList.toggle('is-paused', userPaused);
    schedule();
  }
  root.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1, true));
  root.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1, true));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slide), true)));
  pause?.addEventListener('click', () => { userPaused = !userPaused; updatePause(); });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; schedule(); } });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); schedule(); });
  root.addEventListener('keydown', event => {
    if (!enabled() || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
  });
  stage?.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' && enabled()) pointerStart = {x:event.clientX,y:event.clientY};
  });
  stage?.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClickUntil = Date.now() + 400;
      show(index + (dx < 0 ? 1 : -1), true);
    }
  });
  stage?.addEventListener('pointercancel', () => { pointerStart = null; });
  stage?.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  root.querySelectorAll('img').forEach(img => { img.draggable = false; });
  mobile.addEventListener('change', () => show(index));
  reduced.addEventListener('change', event => { if (event.matches) userPaused = true; updatePause(); });
  document.addEventListener('visibilitychange', schedule);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, {threshold:.2}).observe(root);
  root.classList.add('carousel-ready');
  show(0);
  updatePause();
});
