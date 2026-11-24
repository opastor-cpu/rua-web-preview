// Short, quiet cues reflect the visual hierarchy, after a trusted user click only.
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

    // Frequency, ending frequency, delay, duration, gain. All cues stay below 140 ms.
    const cues = {
      primary: [[660, 660, 0, .078, .007], [880, 880, .045, .085, .006]],
      navigation: [[740, 660, 0, .085, .008]],
      content: [[600, 520, 0, .065, .007]],
      external: [[900, 1050, 0, .09, .007]],
      control: [[360, 280, 0, .04, .006]]
    };

    function cueFor(target) {
      // A prominent call to action keeps its cue even inside the main navigation.
      if (target.matches('.button')) return 'primary';
      if (target.matches('button, summary')) return 'control';
      if (target.closest('.site-header, .breadcrumb, .footer-column')) return 'navigation';
      if (target.matches('a[target="_blank"]')) return 'external';
      return 'content';
    }

    async function playClick(kind) {
      const now = performance.now();
      if (muted || now - lastPlayed < 90) return;
      lastPlayed = now;
      try {
        context ||= new AudioEngine();
        if (context.state === 'suspended') await context.resume();
        if (muted || context.state !== 'running') return;
        const nowAudio = context.currentTime;
        for (const [frequency, ending, delay, duration, volume] of cues[kind]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = nowAudio + delay;
          const end = start + duration;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(ending, end - .006);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + .006);
          gain.gain.exponentialRampToValueAtTime(.0001, end - .006);
          gain.gain.setValueAtTime(0, end);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(start);
          oscillator.stop(end);
        }
      } catch { /* Audio support must never interrupt navigation. */ }
    }

    document.addEventListener('click', event => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return;
      const target = event.target?.closest?.('button, a[href], summary');
      if (target?.closest('#ocean-game, [data-ocean-trigger]')) return;
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
      if (target.matches('[data-sound-toggle]')) {
        muted = !muted;
        try { localStorage.setItem(preferenceKey, muted ? '1' : '0'); } catch { /* Keep the preference for this page. */ }
        renderPreference();
      }
      // Do not prevent, delay or replace navigation to finish a cue.
      void playClick(cueFor(target));
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
