import test from 'node:test';
import assert from 'node:assert/strict';
import {createOceanMusic} from '../ocean-music.mjs';

function harness() {
  const timers = new Map();
  const oscillators = [];
  const sources = [];
  const filters = [];
  const gains = [];
  let nextTimer = 1;
  const param = () => ({
    events: [],
    setValueAtTime(value, time) { this.events.push(['set', value, time]); },
    linearRampToValueAtTime(value, time) { this.events.push(['linear', value, time]); },
    exponentialRampToValueAtTime(value, time) { this.events.push(['exponential', value, time]); },
    setTargetAtTime(value, time, constant) { this.events.push(['target', value, time, constant]); },
    cancelScheduledValues(time) { this.events.push(['cancel', time]); }
  });
  const context = {
    currentTime: 0, state: 'running', destination: {}, sampleRate: 44100,
    createOscillator() {
      const oscillator = {
        frequency: param(), starts: [], stops: [], disconnected: false,
        connect() {}, disconnect() { this.disconnected = true; },
        start(time) { this.starts.push(time); },
        stop(time) { this.stops.push(time); }
      };
      oscillators.push(oscillator);
      sources.push(oscillator);
      return oscillator;
    },
    createBuffer(channels, length, sampleRate) {
      assert.equal(channels, 1);
      assert.equal(sampleRate, 44100);
      const data = new Float32Array(length);
      return {getChannelData(channel) { assert.equal(channel, 0); return data; }};
    },
    createBufferSource() {
      const source = {
        starts: [], stops: [], disconnected: false,
        connect() {}, disconnect() { this.disconnected = true; },
        start(time) { this.starts.push(time); }, stop(time) { this.stops.push(time); }
      };
      sources.push(source);
      return source;
    },
    createBiquadFilter() {
      const filter = {frequency: param(), Q: param(), disconnected: false, connect() {}, disconnect() { this.disconnected = true; }};
      filters.push(filter);
      return filter;
    },
    createGain() {
      const gain = {gain: param(), disconnected: false, connect() {}, disconnect() { this.disconnected = true; }};
      gains.push(gain);
      return gain;
    }
  };
  const music = createOceanMusic(context, {
    setIntervalFn(callback, milliseconds) {
      assert.equal(milliseconds, 60);
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
    clearIntervalFn(id) { timers.delete(id); }
  });
  const tick = seconds => {
    context.currentTime += seconds;
    for (const callback of [...timers.values()]) callback();
    for (const source of sources) {
      if (!source.disconnected && source.stops.at(-1) <= context.currentTime) source.onended?.();
    }
  };
  return {music, context, timers, oscillators, sources, filters, gains, tick};
}

test('starts once, uses quiet pitched notes, and repeats the eight-bar tune', () => {
  const h = harness();
  h.music.start();
  h.music.start();
  assert.equal(h.timers.size, 1);
  assert.equal(h.oscillators.length, 3, 'first melody note, bass, and kick');
  const duration = 60 / 136 * 32;
  for (let time = 0; time < duration + .1; time += .06) h.tick(.06);
  const melody = h.oscillators.filter(oscillator => oscillator.type === 'triangle');
  const firstPitch = melody[0].frequency.events[0][1];
  const repeated = melody.find(oscillator => oscillator.starts[0] >= duration);
  assert.ok(Math.abs(repeated.starts[0] - melody[0].starts[0] - duration) < 1e-8);
  assert.equal(repeated.frequency.events[0][1], firstPitch);
  for (const oscillator of h.oscillators.filter(oscillator => oscillator.frequency.events.length === 1)) {
    const frequency = oscillator.frequency.events[0][1];
    const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
    assert.ok([0, 2, 4, 7, 9].includes(midi % 12), 'pentatonic notes only');
    assert.ok(oscillator.stops[0] > oscillator.starts[0]);
  }
  for (const gain of h.gains) {
    const attack = gain.gain.events.find(event => event[0] === 'linear');
    assert.ok(attack[1] > 0 && attack[1] <= .010);
  }
  h.music.dispose();
  h.tick(.04);
  assert.ok(h.sources.every(source => source.disconnected));
  assert.ok(h.filters.every(filter => filter.disconnected));
  assert.ok(h.gains.every(gain => gain.disconnected));
});

test('136 bpm kick and offbeat hats form a steady pulse with an alternating bass', () => {
  const h = harness();
  h.music.start();
  for (let time = 0; time < 3.6; time += .06) h.tick(.06);
  const kicks = h.oscillators.filter(source => source.frequency.events.length === 2);
  const hats = h.sources.filter(source => source.buffer);
  const bass = h.oscillators.filter(source => source.type === 'sine' && source.frequency.events.length === 1);
  const beatSeconds = 60 / 136;
  assert.ok(kicks.length >= 8 && hats.length >= 8);
  for (let i = 1; i < kicks.length; i++) {
    assert.ok(Math.abs(kicks[i].starts[0] - kicks[i - 1].starts[0] - beatSeconds) < 1e-8);
  }
  for (let i = 0; i < hats.length; i++) {
    assert.ok(Math.abs(hats[i].starts[0] - kicks[i].starts[0] - beatSeconds / 2) < 1e-8);
  }
  assert.notEqual(bass[0].frequency.events[0][1], bass[1].frequency.events[0][1]);
  assert.equal(bass[0].frequency.events[0][1], bass[2].frequency.events[0][1]);
  assert.ok(h.filters.every(filter => filter.type === 'highpass' && filter.frequency.events[0][1] === 6500));
  h.music.dispose();
});

test('stopping clears the scheduler and fades active notes without leaving voices connected', () => {
  const h = harness();
  h.music.start();
  h.tick(.06);
  h.music.stop();
  h.music.stop();
  assert.equal(h.timers.size, 0);
  for (const oscillator of h.oscillators) assert.ok(oscillator.stops.at(-1) <= .09);
  assert.ok(h.gains.every(gain => gain.gain.events.some(event => event[0] === 'target')));
  h.tick(.04);
  assert.ok(h.oscillators.every(oscillator => oscillator.disconnected));
  assert.ok(h.gains.every(gain => gain.disconnected));
  const previousCount = h.oscillators.length;
  h.tick(2);
  assert.equal(h.oscillators.length, previousCount);
  h.music.start();
  assert.equal(h.timers.size, 1, 'pausing is reversible');
  assert.equal(h.oscillators.length, previousCount + 3);
  h.music.dispose();
});

test('muting before the first note starts cancels future voices immediately', () => {
  const h = harness();
  h.context.state = 'suspended';
  h.music.start();
  h.music.stop();
  assert.equal(h.timers.size, 0);
  for (const oscillator of h.oscillators) assert.equal(oscillator.stops.at(-1), 0);
  for (const gain of h.gains) assert.deepEqual(gain.gain.events.at(-1), ['set', 0, 0]);
  h.tick(0);
  assert.ok(h.oscillators.every(oscillator => oscillator.disconnected));
});

test('a delayed timer skips missed notes instead of playing a burst', () => {
  const h = harness();
  h.music.start();
  const before = h.sources.length;
  h.tick(30);
  const newNotes = h.sources.slice(before);
  assert.ok(newNotes.length <= 3);
  for (const oscillator of newNotes) assert.ok(oscillator.starts[0] >= 30);
  h.music.dispose();
});

test('dispose is final and a closed AudioContext never starts a timer', () => {
  const h = harness();
  h.music.start();
  h.music.dispose();
  const count = h.oscillators.length;
  h.music.dispose();
  h.music.start();
  assert.equal(h.timers.size, 0);
  assert.equal(h.oscillators.length, count);
  const closed = harness();
  closed.context.state = 'closed';
  closed.music.start();
  assert.equal(closed.timers.size, 0);
  assert.equal(closed.oscillators.length, 0);
});
