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
  state.obstacles = [{type: 'barrel', x: 145, y: 260, width: 22, height: 30}];
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
  assert.equal(standing.player.height, 48);
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

test('1000-point reward unlocks without ending the endless game; speed is capped', () => {
  const state = safeRun(60, 102);
  assert.equal(GOAL_SCORE, 1000);
  assert.equal(state.score, 1020);
  assert.equal(state.rewardEarned, true);
  assert.equal(state.status, 'running');
  assert.equal(state.speed, MAX_SPEED);
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
      // Separation was assigned at spawn speed; acceleration is common to both obstacles.
      assert.ok(gap >= INITIAL_SPEED * MIN_CLEAR_SECONDS - .01, `gap ${gap}`);
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
