// A quiet interaction cue, created only after a trusted user click.
(() => {
  function initializeSound() {
    const toggles = [...document.querySelectorAll('[data-sound-toggle]')];
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) {
      toggles.forEach(toggle => { toggle.hidden = true; });
      return;
    }
    const preferenceKey = 'rua:interaction-sound-muted';
    let muted = false, context, lastPlayed = -Infinity;
    try { muted = localStorage.getItem(preferenceKey) === '1'; } catch { /* Storage is optional. */ }

    function renderPreference() {
      toggles.forEach(toggle => {
        toggle.setAttribute('aria-pressed', String(!muted));
        const label = toggle.querySelector('[data-sound-label]');
        if (label) label.textContent = muted ? 'Sonido: no' : 'Sonido: sí';
      });
    }

    async function playClick() {
      const now = performance.now();
      if (muted || now - lastPlayed < 90) return;
      lastPlayed = now;
      try {
        context ||= new AudioEngine();
        if (context.state === 'suspended') await context.resume();
        if (muted || context.state !== 'running') return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, start);
        oscillator.frequency.exponentialRampToValueAtTime(640, start + .045);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.01, start + .004);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .045);
        gain.gain.setValueAtTime(0, start + .05);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + .05);
      } catch { /* Audio support must never interrupt navigation. */ }
    }

    document.addEventListener('click', event => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return;
      const target = event.target?.closest?.('button, a[href], summary');
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
      if (target.matches('[data-sound-toggle]')) {
        muted = !muted;
        try { localStorage.setItem(preferenceKey, muted ? '1' : '0'); } catch { /* Keep the preference for this page. */ }
        renderPreference();
      }
      void playClick();
    });

    window.addEventListener('storage', event => {
      if (event.key !== preferenceKey && event.key !== null) return;
      muted = event.newValue === '1';
      renderPreference();
    });
    renderPreference();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSound, {once:true});
  else initializeSound();
})();
