// Pure runner simulation. Positions are CSS-independent logical pixels; time is seconds.
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 360;
export const GROUND_Y = 290;
export const GOAL_SCORE = 1000;
export const INITIAL_SPEED = 190;
export const MAX_SPEED = 280;
export const MIN_CLEAR_SECONDS = .95;

const STEP = 1 / 120;
const GRAVITY = 1450;
const JUMP_VELOCITY = -510;
const POINTS_PER_SECOND = 10;
const EPSILON = 1e-8;

export function createGame(random = Math.random) {
  return {
    status: 'ready', score: 0, best: 0, distance: 0, time: 0,
    speed: INITIAL_SPEED, worldWidth: WORLD_WIDTH,
    player: {x: 78, y: GROUND_Y, vy: 0, width: 30, height: 48, ducking: false},
    obstacles: [], rewardEarned: false, collision: null,
    spawnCountdown: 1.2, _accumulator: 0,
    _random: typeof random === 'function' ? random : Math.random
  };
}

export function resetGame(state) {
  const best = Math.max(Number(state.best) || 0, Number(state.score) || 0);
  const worldWidth = state.worldWidth;
  Object.assign(state, createGame(state._random));
  state.best = best;
  state.worldWidth = worldWidth;
  return state;
}

export function startGame(state) {
  if (state.status !== 'ready') return false;
  state.status = 'running';
  return true;
}

export function jump(state) {
  const player = state.player;
  if (state.status !== 'running' || player.ducking || player.vy !== 0 || player.y < GROUND_Y - EPSILON) return false;
  player.vy = JUMP_VELOCITY;
  return true;
}

export function setDucking(state, ducking) {
  const player = state.player;
  player.ducking = Boolean(ducking);
  player.width = player.ducking ? 42 : 30;
  player.height = player.ducking ? 28 : 48;
  if (state.status === 'running' && player.ducking && player.y < GROUND_Y) {
    // Down in the air is a deliberate fast landing, as in the classic runner.
    player.vy = Math.max(player.vy, 260);
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

export function isColliding(player, obstacle) {
  // Inset hitboxes leave hair, shoe tips, wings and smoke visually forgiving.
  const runner = {
    x: player.x + 4, y: player.y - player.height + 4,
    width: player.width - 8, height: player.height - 6
  };
  const inset = obstacle.type === 'plane' ? {x: 5, y: 4} : {x: 2, y: 2};
  return overlaps(runner, {
    x: obstacle.x + inset.x, y: obstacle.y + inset.y,
    width: obstacle.width - inset.x * 2,
    height: obstacle.height - inset.y * 2
  });
}

function randomUnit(state) {
  const value = Number(state._random());
  return Number.isFinite(value) ? Math.max(0, Math.min(.999999, value)) : .5;
}

function spawnObstacle(state) {
  const roll = randomUnit(state);
  let obstacle;
  if (state.score >= 120 && roll > .64) {
    obstacle = {type: 'plane', y: randomUnit(state) < .7 ? 232 : 204, width: 50, height: 25};
  } else if (roll < .33) {
    obstacle = {type: 'trash', y: GROUND_Y - 18, width: 34, height: 18};
  } else {
    obstacle = {type: 'barrel', y: GROUND_Y - 30, width: 22, height: 30};
  }
  const requestedWidth = Number(state.worldWidth);
  const width = Number.isFinite(requestedWidth) ? Math.max(320, requestedWidth) : WORLD_WIDTH;
  const lastRight = state.obstacles.reduce((right, item) => Math.max(right, item.x + item.width), -Infinity);
  obstacle.x = Math.max(width + 24, lastRight + state.speed * MIN_CLEAR_SECONDS);
  state.obstacles.push(obstacle);
  // There is enough clear ground for a complete jump even at maximum speed.
  const minimumInterval = 1.22 - Math.min(.16, state.time / 600);
  state.spawnCountdown = minimumInterval + randomUnit(state) * .6;
}

function simulateStep(state, dt) {
  state.time += dt;
  state.speed = Math.min(MAX_SPEED, INITIAL_SPEED + state.time * 1.2);
  const movement = state.speed * dt;
  state.distance += movement;
  state.score = Math.floor(state.time * POINTS_PER_SECOND + 1e-6);
  state.best = Math.max(state.best, state.score);
  if (state.score >= GOAL_SCORE) state.rewardEarned = true;

  const player = state.player;
  if (player.y < GROUND_Y || player.vy < 0) {
    player.y += player.vy * dt + .5 * GRAVITY * dt * dt;
    player.vy += GRAVITY * dt;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
    }
  }

  for (const obstacle of state.obstacles) obstacle.x -= movement;
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -30);
  state.spawnCountdown -= dt;
  if (state.spawnCountdown <= 0) spawnObstacle(state);

  for (const obstacle of state.obstacles) {
    if (isColliding(player, obstacle)) {
      state.status = 'gameover';
      state.collision = {type: obstacle.type, score: state.score};
      state._accumulator = 0;
      break;
    }
  }
}

export function updateGame(state, elapsedSeconds) {
  if (state.status !== 'running' || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;
  // A hidden or stalled tab never teleports obstacles across the player.
  state._accumulator += Math.min(elapsedSeconds, 1 / 30);
  while (state._accumulator + EPSILON >= STEP && state.status === 'running') {
    state._accumulator = Math.max(0, state._accumulator - STEP);
    simulateStep(state, STEP);
  }
}
