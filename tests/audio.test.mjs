import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../audio.js', import.meta.url), 'utf8');

function setup({savedMute = '0', noAudio = false} = {}) {
  const documentEvents = new Map(), windowEvents = new Map();
  const oscillators = [], gains = [];
  let contexts = 0, time = 0, stored = savedMute;
  const param = () => ({
    calls: [],
    setValueAtTime(value, at) { this.calls.push([value, at]); },
    linearRampToValueAtTime(value, at) { this.calls.push([value, at]); },
    exponentialRampToValueAtTime(value, at) { this.calls.push([value, at]); }
  });
  class AudioContext {
    constructor() { contexts++; this.state = 'running'; this.currentTime = 1; this.destination = {}; }
    createOscillator() {
      const node = {frequency: param(), connect() {}, disconnect() {}, start(at) {this.startAt = at;}, stop(at) {this.stopAt = at;}};
      oscillators.push(node);
      return node;
    }
    createGain() {
      const node = {gain: param(), connect() {}, disconnect() {}};
      gains.push(node);
      return node;
    }
  }
  const toggle = element({tag:'button', toggle:true});
  toggle.label = {};
  toggle.querySelector = () => toggle.label;
  toggle.setAttribute = (key, value) => {toggle[key] = value;};
  vm.runInNewContext(source, {
    document: {
      readyState:'complete', querySelectorAll:() => [toggle],
      addEventListener:(type, callback) => documentEvents.set(type, callback)
    },
    window: {AudioContext:noAudio ? undefined : AudioContext, addEventListener:(type, callback) => windowEvents.set(type, callback)},
    localStorage: {getItem:() => stored, setItem:(_key, value) => {stored = value;}},
    performance: {now:() => time}
  });
  return {
    oscillators, gains, toggle,
    get contexts() {return contexts;}, get stored() {return stored;},
    click(target, overrides = {}) {
      time += 200;
      documentEvents.get('click')?.({target, isTrusted:true, defaultPrevented:false, button:0, detail:1, ...overrides});
    },
    storage(event) {windowEvents.get('storage')?.(event);}
  };
}

function element({tag = 'a', primary = false, navigation = false, external = false, game = false, trigger = false, disabled = false, toggle = false} = {}) {
  return {
    matches(selector) {
      return selector.split(',').some(part => {
        const value = part.trim();
        return value === '.button' ? primary
          : value === 'button' ? tag === 'button'
          : value === 'summary' ? tag === 'summary'
          : value === 'a[target="_blank"]' ? external
          : value === ':disabled' || value === '[aria-disabled="true"]' ? disabled
          : value === '[data-sound-toggle]' ? toggle : false;
      });
    },
    closest(selector) {
      if (selector === 'button, a[href], summary') return this;
      if (selector === '#ocean-game, [data-ocean-trigger]') return game || trigger ? this : null;
      if (selector === '.site-header, .breadcrumb, .footer-column') return navigation ? this : null;
      return null;
    }
  };
}

test('audio is dormant until a real enabled interaction; the secret and game stay silent', () => {
  const app = setup();
  assert.equal(app.contexts, 0);
  app.click(element(), {isTrusted:false});
  app.click(element(), {defaultPrevented:true});
  app.click(element(), {button:1});
  app.click(element({disabled:true}));
  app.click(element({game:true}));
  app.click(element({trigger:true}));
  assert.equal(app.contexts, 0);
  app.click(element(), {detail:0}); // Keyboard activation is a trusted click too.
  assert.equal(app.contexts, 1);
  assert.equal(app.oscillators.length, 1);
});

test('hierarchies have distinct short quiet cues, with a two-note primary action', () => {
  const variants = [
    {primary:true,navigation:true}, {navigation:true}, {}, {external:true}, {tag:'summary'}, {tag:'button'}
  ].map(options => {
    const app = setup();
    app.click(element(options));
    for (const note of app.oscillators) {
      assert.ok(note.stopAt > note.startAt);
      assert.ok(note.stopAt - 1 <= .14);
    }
    for (const gain of app.gains) assert.ok(gain.gain.calls.every(([value]) => value <= .015));
    return app.oscillators.map(note => note.frequency.calls[0][0]);
  });
  assert.equal(variants[0].length, 2);
  assert.ok(variants[0][1] > variants[0][0]);
  assert.equal(new Set(variants.slice(0,5).map(notes => notes.join(','))).size, 5);
  assert.deepEqual(variants[4], variants[5]);
});

test('saved and cross-tab mute preferences silence every hierarchy', () => {
  const app = setup({savedMute:'1'});
  assert.equal(app.toggle['aria-pressed'], 'false');
  app.click(element({primary:true}));
  assert.equal(app.contexts, 0);
  app.click(app.toggle);
  assert.equal(app.stored, '0');
  assert.equal(app.toggle['aria-pressed'], 'true');
  const count = app.oscillators.length;
  app.storage({key:'rua:interaction-sound-muted',newValue:'1'});
  app.click(element({navigation:true}));
  app.click(element({external:true}));
  assert.equal(app.oscillators.length, count);
  assert.equal(app.toggle.label.textContent, 'Sonido: no');
});

test('missing Web Audio hides its control without breaking the page', () => {
  const app = setup({noAudio:true});
  assert.equal(app.toggle.hidden, true);
  app.click(element());
  assert.equal(app.contexts, 0);
});
