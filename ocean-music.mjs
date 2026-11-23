// An original eight-bar beach-run tune, synthesized entirely on the device.
// Eighth-note offbeats and a soft rhythm section add momentum without loudness.
const BPM = 136;
const STEP_SECONDS = 60 / BPM / 2;
const LOOKAHEAD_SECONDS = .12;
const MELODY = [
  72, null, 76, 79, null, 81, 79, 76,
  null, 74, 76, null, 79, 76, 74, null,
  76, 79, null, 81, null, 84, 81, 79,
  76, null, 74, 76, null, 79, null, 74,
  79, 81, null, 84, null, 81, 79, 76,
  null, 74, 72, 76, null, 79, 76, 74,
  76, null, 79, 81, null, 79, 76, 74,
  72, 76, null, 79, 76, null, 72, null
];
const BASS = [48, 45, 50, 43, 48, 45, 50, 43];
const BASS_REPLY = [55, 52, 57, 50, 55, 52, 57, 50];
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
  let hatBuffer;

  function voice(source, time, duration, peak, effects = []) {
    const gain = audioContext.createGain();
    const active = {source, gain, startTime: time};
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + .005);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    let previous = source;
    for (const effect of effects) { previous.connect(effect); previous = effect; }
    previous.connect(gain);
    gain.connect(audioContext.destination);
    source.onended = () => {
      source.disconnect();
      for (const effect of effects) effect.disconnect();
      gain.disconnect();
      voices.delete(active);
    };
    voices.add(active);
    source.start(time);
    source.stop(time + duration + .015);
  }

  function note(midi, time, bass = false) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = bass ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequencyFor(midi), time);
    // Short plucks leave room for both the percussion and gameplay effects.
    voice(oscillator, time, bass ? .16 : .18, bass ? .006 : .010);
  }

  function kick(time) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + .09);
    voice(oscillator, time, .12, .009);
  }

  function hat(time, accent) {
    if (!hatBuffer) {
      const sampleRate = audioContext.sampleRate;
      hatBuffer = audioContext.createBuffer(1, Math.ceil(sampleRate * .05), sampleRate);
      const samples = hatBuffer.getChannelData(0);
      let seed = 8361;
      for (let i = 0; i < samples.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        samples[i] = seed / 2147483648 - 1;
      }
    }
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    source.buffer = hatBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);
    filter.Q.setValueAtTime(.4, time);
    voice(source, time, .035, accent ? .004 : .003, [filter]);
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
      const beat = step % 8, bar = Math.floor(step / 8);
      if (beat % 2 === 0) {
        note(beat % 4 === 0 ? BASS[bar] : BASS_REPLY[bar], nextTime, true);
        kick(nextTime);
      } else hat(nextTime, beat === 3 || beat === 7);
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
      const {source, gain, startTime} = voice;
      // Unplayed notes are silent immediately; audible notes get a short fade.
      gain.gain.cancelScheduledValues(now);
      if (startTime > now) gain.gain.setValueAtTime(0, now);
      else gain.gain.setTargetAtTime(0, now, .006);
      try { source.stop(startTime > now ? now : now + .03); } catch { /* Already ended. */ }
    }
  }

  function dispose() {
    if (disposed) return;
    stop();
    disposed = true;
    hatBuffer = null;
  }

  return {start, stop, dispose};
}
