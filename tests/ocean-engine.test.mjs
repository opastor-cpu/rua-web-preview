import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, resetGame, startGame, updateGame, jump, setDucking, isColliding,
  GROUND_Y, GOAL_SCORE, INITIAL_SPEED, MAX_SPEED, MIN_CLEAR_SECONDS
} from '../ocean-engine.mjs';

function seeded(seed = 18) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function safeRun(fps, seconds) {
  const state = createGame(seeded());
  startGame(state);
  // Isolate the clock/physics from obstacle collisions without changing gameplay code.
  state.player.x = -1000;
  for (let i = 0; i < fps * seconds; i++) updateGame(state, 1 / fps);
  return state;
}

test('simulation and scores agree at 30, 60 and 120 fps', () => {
  const states = [30, 60, 120].map(fps => safeRun(fps, 25));
  for (const state of states) {
    assert.equal(state.status, 'running');
    assert.equal(state.score, 250);
    assert.ok(Math.abs(state.distance - states[0].distance) < 1e-7);
    assert.deepEqual(state.obstacles, states[0].obstacles);
  }
});

test('jump clears a barrel, lands, and cannot be retriggered in midair', () => {
  const state = createGame(() => .5);
  startGame(state);
  state.spawnCountdown = 100;
  state.obstacles = [{type: 'barrel', x: 145, y: 256, width: 30, height: 34}];
  assert.equal(jump(state), true);
  assert.equal(jump(state), false, 'a second input in the same animation frame cannot retrigger a jump');
  updateGame(state, 1 / 60);
  assert.equal(jump(state), false);
  for (let i = 0; i < 60; i++) updateGame(state, 1 / 60);
  assert.equal(state.status, 'running');
  assert.equal(state.player.y, GROUND_Y);
  assert.equal(state.player.vy, 0);
  assert.equal(jump(state), true);
});

test('standing runner hits a low plane, ducking runner safely passes it', () => {
  const plane = {type: 'plane', x: 80, y: 232, width: 50, height: 25};
  const standing = createGame();
  assert.equal(isColliding(standing.player, plane), true);
  setDucking(standing, true);
  assert.equal(isColliding(standing.player, plane), false);
  setDucking(standing, false);
  assert.equal(standing.player.height, 56);
  assert.equal(standing.player.width, 36);
  assert.equal(isColliding(standing.player, {...plane, y: 204}), false);

  const ducking = createGame();
  startGame(ducking);
  ducking.spawnCountdown = 100;
  ducking.obstacles = [{...plane, x: 170}];
  setDucking(ducking, true);
  for (let i = 0; i < 90; i++) updateGame(ducking, 1 / 60);
  assert.equal(ducking.status, 'running');
  assert.equal(jump(ducking), false);
});

test('collision stops a run and pause or invalid time never advances it', () => {
  const state = createGame();
  startGame(state);
  state.obstacles = [{type: 'trash', x: 80, y: 272, width: 34, height: 18}];
  updateGame(state, 1 / 30);
  assert.equal(state.status, 'gameover');
  assert.equal(state.collision.type, 'trash');
  const time = state.time;
  updateGame(state, 1);
  assert.equal(state.time, time);
  resetGame(state);
  startGame(state);
  for (const dt of [-1, NaN, Infinity]) updateGame(state, dt);
  assert.equal(state.time, 0);
  state.status = 'paused';
  updateGame(state, 1 / 30);
  assert.equal(state.time, 0);
});

test('1000-point reward unlocks during the gentle ramp without ending the endless game', () => {
  const state = safeRun(60, 102);
  assert.equal(GOAL_SCORE, 1000);
  assert.equal(state.score, 1020);
  assert.equal(state.rewardEarned, true);
  assert.equal(state.status, 'running');
  assert.ok(state.speed < MAX_SPEED);
  assert.ok(state.speed > INITIAL_SPEED);
});

test('spawn gaps remain playable on mobile and through a viewport reduction', () => {
  const state = createGame(seeded(933));
  startGame(state);
  state.player.x = -1000;
  let observedPlanes = 0;
  let observedGround = 0;
  for (let i = 0; i < 120 * 120; i++) {
    if (i === 400) state.worldWidth = 480;
    updateGame(state, 1 / 120);
    const sorted = [...state.obstacles].sort((a, b) => a.x - b.x);
    for (let j = 1; j < sorted.length; j++) {
      const gap = sorted[j].x - (sorted[j - 1].x + sorted[j - 1].width);
      // A hard distance floor remains safe even after acceleration and viewport changes.
      assert.ok(gap >= MAX_SPEED * MIN_CLEAR_SECONDS - .01, `gap ${gap}`);
    }
    observedPlanes += sorted.filter(o => o.type === 'plane').length;
    observedGround += sorted.filter(o => o.type !== 'plane').length;
    assert.ok(sorted.length < 8, 'offscreen obstacles must be retired');
  }
  assert.ok(observedPlanes > 0);
  assert.ok(observedGround > 0);
});

test('reset preserves best, random source and responsive world width', () => {
  const state = safeRun(60, 12);
  state.worldWidth = 480;
  state.player.ducking = true;
  resetGame(state);
  assert.equal(state.status, 'ready');
  assert.equal(state.score, 0);
  assert.equal(state.best, 120);
  assert.equal(state.worldWidth, 480);
  assert.equal(state.player.y, GROUND_Y);
  assert.equal(state.player.ducking, false);
  assert.deepEqual(state.obstacles, []);
  assert.equal(state.rewardEarned, false);
  assert.equal(startGame(state), true);
  assert.equal(startGame(state), false);
});

test('difficulty starts flat for eight seconds, rises smoothly and stops increasing', () => {
  const state = createGame(seeded());
  startGame(state);
  state.player.x = -1000;
  let previousSpeed = state.speed;
  const samples = [];
  for (let i = 0; i < 220 * 120; i++) {
    updateGame(state, 1 / 120);
    assert.ok(state.speed >= previousSpeed);
    assert.ok(state.speed >= INITIAL_SPEED && state.speed <= MAX_SPEED);
    assert.ok(state.speed - previousSpeed < .008, 'speed must never jump suddenly');
    if (state.time <= 8) assert.equal(state.speed, INITIAL_SPEED);
    if (i % 120 === 0) samples.push({time: state.time, speed: state.speed});
    previousSpeed = state.speed;
  }
  assert.equal(INITIAL_SPEED, 140);
  assert.equal(MAX_SPEED, 250);
  assert.ok(samples.find(x => x.time >= 100).speed < 205, 'the reward still arrives at moderate speed');
  assert.equal(state.speed, MAX_SPEED);
  assert.ok(Math.abs(samples[8].speed - INITIAL_SPEED) < .001, 'warmup joins the ramp without a step');
  assert.ok(MAX_SPEED - samples[187].speed < .02, 'the ramp flattens before reaching its cap');
});

test('obstacles have an easy introduction, five distinct trash variants and bounded spacing', () => {
  const state = createGame(seeded(118));
  startGame(state); state.player.x = -1000;
  const seen = new WeakSet(), variants = new Set(), entries = [];
  for (let i = 0; i < 300 * 120; i++) {
    updateGame(state, 1 / 120);
    for (const obstacle of state.obstacles) {
      if (seen.has(obstacle)) continue;
      seen.add(obstacle);
      entries.push({time: state.time, obstacle});
      if (state.time < 14) assert.equal(obstacle.type, 'barrel');
      if (obstacle.type === 'plane') assert.ok(state.time >= 45);
      if (obstacle.type === 'trash') {
        variants.add(obstacle.variant);
        assert.ok(obstacle.width >= 32 && obstacle.width <= 42);
        assert.ok(obstacle.height >= 16 && obstacle.height <= 24);
        assert.equal(obstacle.y + obstacle.height, GROUND_Y);
      }
      assert.ok(state.spawnCountdown >= 1.7 - 1e-8 && state.spawnCountdown <= 3.4 + 1e-8);
      if (state.time < 8) assert.ok(state.spawnCountdown >= 2.6 && state.spawnCountdown <= 3.4);
      if (state.time >= 188) assert.ok(state.spawnCountdown >= 1.7 - 1e-8 && state.spawnCountdown <= 2.2 + 1e-8);
    }
  }
  assert.ok(Math.abs(entries[0].time - 2.2) <= 1 / 120 + 1e-7);
  assert.deepEqual([...variants].sort(), [0, 1, 2, 3, 4]);
  assert.ok(entries.some(x => x.obstacle.type === 'plane'));
});

test('every ground obstacle is jumpable at both speed limits with a useful timing window', () => {
  const shapes = [[30,34], [32,20], [38,22], [40,24], [42,18], [36,16]];
  for (const speed of [INITIAL_SPEED, MAX_SPEED]) {
    for (const [width,height] of shapes) {
      for (const lead of [.12, .18, .24]) {
        const state = createGame(); startGame(state);
        // Hold the two difficulty endpoints while exercising the real trajectory/collision loop.
        if (speed === MAX_SPEED) state.time = 200;
        state.spawnCountdown = 100;
        state.obstacles = [{type:'trash', x:78 + 36 + speed * lead, y:GROUND_Y - height, width, height}];
        assert.equal(jump(state), true);
        for (let i = 0; i < 120; i++) updateGame(state, 1 / 120);
        assert.equal(state.status, 'running', `${width}x${height}, speed ${speed}, lead ${lead}`);
        assert.equal(state.player.y, GROUND_Y);
      }
    }
  }
});

test('a simple delayed-input policy survives mixed obstacles through and beyond the ramp', () => {
  // A player observes at 10Hz and reacts 180ms later; no future RNG or trajectory lookup.
  // Inputs use only the nearest visible obstacle and an ordinary near-obstacle cue.
  for (const worldWidth of [320, 480, 800]) {
    for (const seed of [4, 61, 205]) {
      const state = createGame(seeded(seed)); state.worldWidth = worldWidth; startGame(state);
      const acted = new WeakSet(); let pending = null;
      for (let i = 0; i < 300 * 60; i++) {
        const nearest = state.obstacles.filter(o => o.x + o.width > state.player.x + 4)
          .sort((a,b) => a.x - b.x)[0];
        if (state.player.ducking && (!nearest || nearest.type !== 'plane' || nearest.y !== 232)) setDucking(state, false);
        if (pending && state.time >= pending.at) {
          if (pending.type === 'jump') jump(state);
          else setDucking(state, true);
          pending = null;
        }
        if (i % 6 === 0 && nearest && nearest.x < worldWidth && !acted.has(nearest)) {
          const timeToFront = (nearest.x - (state.player.x + 36)) / state.speed;
          if (nearest.type !== 'plane' && timeToFront <= .4) {
            acted.add(nearest); pending = {type:'jump', at:state.time + .18};
          } else if (nearest.type === 'plane' && nearest.y === 232 && timeToFront <= .6) {
            acted.add(nearest); pending = {type:'duck', at:state.time + .18};
          }
        }
        updateGame(state, 1 / 60);
        assert.equal(state.status, 'running', `width ${worldWidth}, seed ${seed}, time ${state.time}, hit ${state.collision?.type}`);
      }
      assert.equal(state.score, 3000);
      assert.equal(state.rewardEarned, true);
    }
  }
});
