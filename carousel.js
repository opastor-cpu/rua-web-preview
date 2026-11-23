// Independent galleries: stagger the first visible cycle, then advance every 5s.
document.querySelectorAll('[data-carousel]').forEach(root => {
  const stage = root.querySelector(':scope > .carousel-stage') || root.querySelector('.carousel-stage');
  const slides = stage ? [...stage.children].filter(slide => slide.classList.contains('carousel-slide')) : [];
  if (!slides.length) return;
  const status = root.querySelector('.carousel-status');
  const caption = root.querySelector('[data-photo-caption]');
  const mobile = matchMedia('(max-width: 620px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const requestedInterval = Number(root.dataset.interval);
  const interval = Number.isFinite(requestedInterval) && requestedInterval >= 1000 ? requestedInterval : 5000;
  const requestedDelay = Number(root.dataset.startDelay);
  const startDelay = Number.isFinite(requestedDelay) ? Math.max(0, requestedDelay) : 0;
  let index = 0, timer, inView = false, hovered = false, focused = false;
  let userPaused = reduced.matches, firstCycle = true, pointerStart, suppressClickUntil = 0;
  const enabled = () => !root.hasAttribute('data-only-mobile') || mobile.matches;
  const canPlay = () => enabled() && slides.length > 1 && inView && !document.hidden && !userPaused && !hovered && !focused;

  function schedule() {
    clearTimeout(timer);
    timer = undefined;
    const playing = canPlay();
    root.dataset.playing = String(playing);
    root.dataset.paused = String(userPaused);
    if (!playing) return;
    const delay = interval + (firstCycle ? startDelay : 0);
    firstCycle = false;
    timer = setTimeout(() => {
      timer = undefined;
      if (canPlay()) show(index + 1);
      else schedule();
    }, delay);
  }
  function show(next, manual = false) {
    index = ((next % slides.length) + slides.length) % slides.length;
    const active = enabled();
    slides.forEach((slide, i) => {
      const visible = !active || i === index;
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(!visible));
      slide.inert = !visible;
    });
    root.dataset.activeSlide = String(index + 1);
    if (caption) caption.textContent = slides[index].querySelector('figcaption')?.textContent.trim() || '';
    if (manual) {
      // User navigation starts a fresh, ordinary cycle; never reapply staggering.
      firstCycle = false;
      const title = slides[index].querySelector('h3, figcaption')?.textContent.trim() || '';
      if (status) status.textContent = `${index + 1} de ${slides.length}. ${title}`;
    }
    schedule();
  }
  function togglePause() {
    userPaused = !userPaused;
    if (status) status.textContent = userPaused
      ? 'Reproducción automática en pausa.'
      : 'Reproducción automática activada. Continuará al salir del carrusel.';
    schedule();
  }
  root.querySelector('[data-prev]')?.addEventListener('click', () => { if (enabled()) show(index - 1, true); });
  root.querySelector('[data-next]')?.addEventListener('click', () => { if (enabled()) show(index + 1, true); });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; schedule(); } });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); schedule(); });
  root.addEventListener('keydown', event => {
    if (!enabled() || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    if (event.target.closest('[data-carousel]') !== root) return;
    if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      // Space on a button/link keeps its native action; Space on the region pauses.
      if (event.target.closest('button, a, [role="button"]')) return;
      event.preventDefault();
      if (!event.repeat) togglePause();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
  });
  stage?.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' && event.isPrimary !== false && enabled()) {
      pointerStart = {x:event.clientX,y:event.clientY,id:event.pointerId};
    }
  });
  stage?.addEventListener('pointerup', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (enabled() && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
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
  reduced.addEventListener('change', event => {
    if (event.matches) userPaused = true;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2;
      // Repeated intersection reports must not reset the gallery's own timer.
      if (visible !== inView) { inView = visible; schedule(); }
    }, {threshold:[0,.2]}).observe(root);
  } else {
    // Manual navigation remains available if visibility cannot be observed.
    inView = false;
  }
  root.classList.add('carousel-ready');
  show(0);
});
