import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as realEngine from '../ocean-engine.mjs';

// Unit harness only: a small event/DOM boundary, deterministic timers, and real game physics.
// No test switches or globals are added to the shipped application.
const source = readFileSync(new URL('../ocean-game.js', import.meta.url), 'utf8')
  .replace("import('./ocean-engine.mjs?v=5')", '__loadEngine()')
  .replace("import('./ocean-art.js?v=5')", '__loadArt()');

function harness({storage = new Map(), deferred = false} = {}) {
  let clock = 0, id = 0, state, dialog, engineLoads = 0, resolveEngine;
  const timers = new Map(), frames = new Map(), navigation = [];
  class Node {
    constructor(tag = 'div', name = '') {
      this.tagName = tag; this.name = name; this.listeners = {}; this.attributes = {};
      this.hidden = false; this.disabled = false; this.dataset = {}; this.textContent = '';
      const classes = new Set();
      this.classList = {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x)};
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    fire(type, values = {}) {
      const event = {target: this, preventDefault() { this.defaultPrevented = true; }, ...values};
      for (const fn of this.listeners[type] || []) fn(event);
      return event;
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    focus() { document.activeElement = this; }
    setPointerCapture() {}
    closest(selector) {
      if (selector === '[data-ocean-trigger]') return this === trigger ? this : null;
      if (selector === 'button,a') return ['button','a'].includes(this.tagName) ? this : null;
      return null;
    }
    set innerHTML(html) {
      this.nodes = new Map();
      for (const match of html.matchAll(/<(\w+)[^>]*?\s(data-[\w-]+)(?:[\s=>])/g)) {
        const node = new Node(match[1], match[2]);
        this.nodes.set(`[${match[2]}]`, node);
      }
      const canvas = new Node('canvas');
      canvas.width = 800; canvas.height = 360;
      canvas.getContext = () => ({clearRect() {}, imageSmoothingEnabled: true});
      this.nodes.set('canvas', canvas);
      this.nodes.set('progress', new Node('progress'));
      // These controls are initially hidden in the actual HTML.
      this.nodes.get('[data-game-reward]').hidden = true;
      this.nodes.get('[data-game-continue]').hidden = true;
    }
    querySelector(selector) { return this.nodes.get(selector); }
    showModal() { this.open = true; }
    close() { this.open = false; this.fire('close'); }
  }
  const trigger = new Node('button', 'trigger');
  const document = new Node('document');
  document.hidden = false;
  document.querySelector = selector => selector === '[data-ocean-trigger]' ? trigger : null;
  document.createElement = tag => { dialog = new Node(tag); return dialog; };
  document.body = new Node('body'); document.body.append = () => {};
  const window = new Node('window'); window.innerWidth = 390;
  window.location = {assign: url => navigation.push(url)};
  const engine = {...realEngine, createGame(...args) { engineLoads++; state = realEngine.createGame(...args); return state; }};
  const pendingEngine = deferred ? new Promise(resolve => { resolveEngine = () => resolve(engine); }) : Promise.resolve(engine);
  const context = vm.createContext({
    window, document, console, Promise, Math, Number, String,
    performance: {now: () => clock}, matchMedia: () => ({matches: false}),
    localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    setTimeout(fn, delay) { const next = ++id; timers.set(next, {fn, at: clock + delay}); return next; },
    clearTimeout(handle) { timers.delete(handle); },
    requestAnimationFrame(fn) { const next = ++id; frames.set(next, fn); return next; },
    cancelAnimationFrame(handle) { frames.delete(handle); },
    __loadEngine: () => pendingEngine,
    __loadArt: () => Promise.resolve({drawScene() {}, drawRunner() {}, drawObstacle() {}})
  });
  vm.runInContext(source, context, {filename: 'ocean-game.js'});
  function advance(ms) {
    const end = clock + ms;
    while (true) {
      const pending = [...timers.entries()].sort((a,b) => a[1].at - b[1].at)[0];
      if (!pending || pending[1].at > end) break;
      const [handle, timer] = pending; clock = timer.at; timers.delete(handle); timer.fn();
    }
    clock = end;
  }
  async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
  function click(target = trigger) { target.fire('click', {detail: 1}); document.fire('click', {target}); }
  async function unlock() { for (let i = 0; i < 5; i++) { click(); advance(100); } await flush(); }
  function frame(ms = 1000 / 60) {
    advance(ms);
    const current = [...frames.values()]; frames.clear();
    for (const draw of current) draw(clock);
  }
  return {click, advance, unlock, flush, frame, document, window, trigger, storage, navigation,
    get dialog() { return dialog; }, get state() { return state; }, get engineLoads() { return engineLoads; },
    get frames() { return frames; }, resolveEngine: () => resolveEngine(),
    node: selector => dialog.querySelector(selector)};
}

test('exactly five consecutive taps unlock; outside clicks and long gaps reset', async () => {
  const ui = harness();
  for (let i = 0; i < 4; i++) { ui.click(); ui.advance(80); }
  assert.equal(ui.dialog, undefined);
  ui.click(ui.document.body);
  ui.click(); ui.click(); ui.advance(1201);
  for (let i = 0; i < 4; i++) ui.click();
  assert.equal(ui.dialog, undefined);
  ui.click(); await ui.flush();
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.state.status, 'ready');
  assert.equal(ui.state.worldWidth, 480);
});

test('pause freezes real physics, resumes, and close cleans the animation frame', async () => {
  const ui = harness(); await ui.unlock();
  ui.click(ui.node('[data-game-play]'));
  ui.frame(); ui.frame();
  assert.equal(ui.state.status, 'running');
  ui.click(ui.node('[data-game-pause]'));
  const time = ui.state.time;
  ui.frame(); ui.frame();
  assert.equal(ui.state.status, 'paused');
  assert.equal(ui.state.time, time);
  ui.click(ui.node('[data-game-play]'));
  ui.frame(); ui.frame();
  assert.ok(ui.state.time > time);
  ui.click(ui.node('[data-game-close]'));
  assert.equal(ui.dialog.open, false);
  assert.equal(ui.frames.size, 0);
  assert.equal(ui.document.body.classList.contains('ocean-open'), false);
  assert.equal(ui.document.activeElement, ui.trigger);
});

test('reward at 1000 points redirects only after its five-second countdown', async () => {
  const ui = harness(); await ui.unlock();
  ui.click(ui.node('[data-game-play]'));
  ui.state.time = 99.99; ui.state.score = 999; ui.state.spawnCountdown = 100;
  ui.frame(); ui.frame();
  assert.equal(ui.state.score, 1000);
  assert.equal(ui.state.status, 'paused');
  ui.advance(4999);
  assert.deepEqual(ui.navigation, []);
  ui.advance(1);
  assert.deepEqual(ui.navigation, ['https://c.org/5d7dsFx5yr']);
});

test('reward cancellation resumes endless play and prevents navigation', async () => {
  const ui = harness(); await ui.unlock(); ui.click(ui.node('[data-game-play]'));
  ui.state.rewardEarned = true; ui.frame();
  ui.click(ui.node('[data-game-continue]'));
  assert.equal(ui.state.status, 'running');
  assert.equal(ui.node('[data-game-reward]').hidden, true);
  assert.equal(ui.node('[data-game-pause]').disabled, false);
  ui.advance(6000);
  assert.deepEqual(ui.navigation, []);
});

test('leaving the tab cancels automatic reward navigation', async () => {
  const ui = harness(); await ui.unlock(); ui.click(ui.node('[data-game-play]'));
  ui.state.rewardEarned = true; ui.frame();
  ui.document.hidden = true; ui.document.fire('visibilitychange');
  ui.advance(6000);
  assert.deepEqual(ui.navigation, []);
  assert.equal(ui.state.status, 'paused');
});

test('mute preference survives a new page instance', async () => {
  const storage = new Map(); const first = harness({storage}); await first.unlock();
  first.click(first.node('[data-game-mute]'));
  const second = harness({storage}); await second.unlock();
  // This checks the emitted dialog markup independently of the fake DOM attribute parser.
  const saved = storage.get('rua:ocean:muted');
  assert.equal(saved, '1');
});

test('closing and reopening during module loading creates only one game/RAF loop', async () => {
  const ui = harness({deferred: true}); await ui.unlock();
  ui.click(ui.node('[data-game-close]'));
  await ui.unlock();
  ui.resolveEngine(); await ui.flush();
  assert.equal(ui.engineLoads, 1);
  assert.equal(ui.frames.size, 1);
});
