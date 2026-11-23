// An original, quiet eight-bar tune. All sound is synthesized locally.
// One step is an eighth note; rests keep the loop light while playing.
const BPM = 104;
const STEP_SECONDS = 60 / BPM / 2;
const LOOKAHEAD_SECONDS = .12;
const MELODY = [
  72, 76, 79, null, 81, 79, 76, null,
  74, 76, 79, 76, 74, null, 72, null,
  76, 79, 81, null, 79, 76, 74, null,
  72, null, 74, 76, 79, null, null, null,
  79, 81, 84, null, 81, 79, 76, null,
  76, 74, 72, null, 74, 76, 79, null,
  81, 79, 76, 74, 72, null, 74, null,
  76, 79, 76, null, 72, null, null, null
];
const BASS = [48, 45, 50, 43, 48, 45, 50, 43];
const frequencyFor = midi => 440 * 2 ** ((midi - 69) / 12);

/** A reusable soundtrack sharing the game's AudioContext and sound preference. */
export function createOceanMusic(audioContext, {
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval
} = {}) {
  const voices = new Set();
  let interval = null;
  let running = false;
  let disposed = false;
  let step = 0;
  let nextTime = 0;

  function note(midi, time, bass = false) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const duration = bass ? .62 : .24;
    const voice = {oscillator, gain, startTime: time};
    oscillator.type = bass ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequencyFor(midi), time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(bass ? .009 : .012, time + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      voices.delete(voice);
    };
    voices.add(voice);
    oscillator.start(time);
    oscillator.stop(time + duration + .015);
  }

  function schedule() {
    if (!running) return;
    const now = audioContext.currentTime;
    // If a background tab stalls timers, skip missed notes instead of playing a burst.
    if (nextTime < now - .05) {
      const missed = Math.ceil((now - nextTime) / STEP_SECONDS);
      step = (step + missed) % MELODY.length;
      nextTime += missed * STEP_SECONDS;
    }
    while (nextTime < now + LOOKAHEAD_SECONDS) {
      if (MELODY[step] !== null) note(MELODY[step], nextTime);
      if (step % 8 === 0) note(BASS[Math.floor(step / 8)], nextTime, true);
      step = (step + 1) % MELODY.length;
      nextTime += STEP_SECONDS;
    }
  }

  function start() {
    if (disposed || running || audioContext.state === 'closed') return;
    running = true;
    step = 0;
    nextTime = audioContext.currentTime + .025;
    schedule();
    interval = setIntervalFn(schedule, 60);
  }

  function stop() {
    running = false;
    if (interval !== null) {
      clearIntervalFn(interval);
      interval = null;
    }
    const now = audioContext.currentTime;
    for (const voice of voices) {
      const {oscillator, gain, startTime} = voice;
      // Unplayed notes are silent immediately; audible notes get a short fade.
      gain.gain.cancelScheduledValues(now);
      if (startTime > now) gain.gain.setValueAtTime(0, now);
      else gain.gain.setTargetAtTime(0, now, .006);
      try { oscillator.stop(startTime > now ? now : now + .03); } catch { /* Already ended. */ }
    }
  }

  function dispose() {
    if (disposed) return;
    stop();
    disposed = true;
  }

  return {start, stop, dispose};
}
