// Original, code-drawn pixel art. All coordinates are in the 800 × 360 game world.
// Scene/runner time is in seconds; runner y is its feet, obstacle y is its top.
const C = {
  sky: '#c9eff3', skyLight: '#e7f7ec', cloud: '#fffdf2', cloudShade: '#b0dfe9',
  seaFar: '#4ab7c9', sea: '#239bb5', seaNear: '#168aa5', foam: '#d7f6ec',
  navy: '#123b53', teal: '#106b7e', sand: '#f1d49c', sandLight: '#ffe8b8',
  sandShade: '#dfb979', coral: '#e77e65', ink: '#1a2934', hair: '#342724',
  hairLight: '#624138', skin: '#c58f70', skinLight: '#e8b28b', shirt: '#252f34',
  shirtLight: '#3c4949', leaf: '#8cc79a', denim: '#497fa4', denimDark: '#305d7e',
  shoe: '#e8e8d3', sole: '#243f50', oil: '#263e3d', oilLight: '#556b50',
};

function pixel(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
}

function cloud(ctx, x, y, scale = 1) {
  pixel(ctx, x + 9 * scale, y, 27 * scale, 5 * scale, C.cloud);
  pixel(ctx, x, y + 5 * scale, 54 * scale, 10 * scale, C.cloud);
  pixel(ctx, x - 10 * scale, y + 10 * scale, 79 * scale, 7 * scale, C.cloud);
  pixel(ctx, x + 8 * scale, y + 17 * scale, 53 * scale, 3 * scale, C.cloudShade);
}

function gull(ctx, x, y, flap) {
  const lift = flap ? 0 : 2;
  pixel(ctx, x, y + lift, 7, 2, C.teal);
  pixel(ctx, x + 7, y + 2, 4, 2, C.teal);
  pixel(ctx, x + 11, y + lift, 7, 2, C.teal);
}

function whale(ctx, x, surfaceY, progress, reducedMotion) {
  const rise = reducedMotion ? 1 : Math.sin(progress * Math.PI);
  if (rise <= 0) return;
  const y = Math.round(surfaceY + 20 - 32 * rise);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 15, surfaceY - 60, 150, 65);
  ctx.clip();
  // Rounded silhouette assembled entirely from small rectangular steps.
  pixel(ctx, x + 14, y, 55, 6, C.navy);
  pixel(ctx, x + 6, y + 6, 75, 18, C.navy);
  pixel(ctx, x + 1, y + 13, 86, 12, C.navy);
  pixel(ctx, x + 17, y + 25, 59, 6, C.navy);
  pixel(ctx, x + 15, y + 22, 57, 5, '#b9e9df');
  pixel(ctx, x + 25, y + 27, 39, 3, '#b9e9df');
  pixel(ctx, x + 39, y + 21, 11, 14, C.navy);
  pixel(ctx, x + 47, y + 27, 8, 12, C.navy);
  pixel(ctx, x + 82, y + 13, 16, 8, C.navy);
  pixel(ctx, x + 94, y + 7, 8, 11, C.navy);
  pixel(ctx, x + 91, y - 3, 8, 12, C.navy);
  pixel(ctx, x + 80, y - 7, 14, 6, C.navy);
  pixel(ctx, x + 100, y - 3, 11, 6, C.navy);
  pixel(ctx, x + 107, y - 8, 8, 6, C.navy);
  pixel(ctx, x + 12, y + 12, 3, 3, C.cloud);
  pixel(ctx, x + 13, y + 13, 2, 2, C.ink);
  // Short spray when the whale surfaces; it never reaches the playing lane.
  if (progress > .24 && progress < .68) {
    pixel(ctx, x + 23, y - 19, 3, 15, C.foam);
    pixel(ctx, x + 15, y - 24, 9, 3, C.foam);
    pixel(ctx, x + 27, y - 23, 8, 3, C.foam);
    pixel(ctx, x + 12, y - 20, 3, 5, C.foam);
    pixel(ctx, x + 35, y - 19, 3, 4, C.foam);
  }
  ctx.restore();
  pixel(ctx, x - 6, surfaceY + 3, 30, 3, C.foam);
  pixel(ctx, x + 58, surfaceY + 5, 40, 3, C.foam);
}

export function drawScene(ctx, {time = 0, distance = 0, score = 0, width = 800, height = 360, reducedMotion = false} = {}) {
  const ground = height - 70;
  const horizon = Math.round(height * .43);
  const shoreline = ground - 41;
  const visualTime = reducedMotion ? 0 : time;
  const travel = reducedMotion ? 0 : distance;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  pixel(ctx, 0, 0, width, height, C.sky);
  pixel(ctx, 0, horizon - 27, width, 27, C.skyLight);

  const sunX = width - 136;
  pixel(ctx, sunX + 8, 27, 30, 8, '#fff0b9');
  pixel(ctx, sunX, 35, 46, 30, '#fff0b9');
  pixel(ctx, sunX + 8, 65, 30, 8, '#fff0b9');
  pixel(ctx, sunX + 7, 36, 32, 27, '#ffdb8d');
  cloud(ctx, ((52 - travel * .023) % (width + 160) + width + 160) % (width + 160) - 80, 38, 1.2);
  cloud(ctx, ((width * .49 - travel * .015) % (width + 160) + width + 160) % (width + 160) - 80, 22, .7);
  cloud(ctx, ((width * .87 - travel * .03) % (width + 180) + width + 180) % (width + 180) - 80, 109, .6);
  gull(ctx, width * .74 - 20, 89 + Math.round(Math.sin(visualTime) * 2), Math.floor(visualTime * 2) % 2);
  gull(ctx, width * .74 + 8, 82 + Math.round(Math.sin(visualTime + 1) * 2), Math.floor(visualTime * 2 + 1) % 2);

  pixel(ctx, 0, horizon, width, shoreline - horizon, C.seaFar);
  pixel(ctx, 0, horizon + 24, width, shoreline - horizon - 24, C.sea);
  pixel(ctx, 0, shoreline - 29, width, 29, C.seaNear);
  pixel(ctx, 0, horizon + 2, width, 3, '#86d5da');
  // Scrolling rows of short, hard-edged highlights rather than noisy particles.
  for (let row = 0; row < 4; row++) {
    const y = horizon + 12 + row * 21;
    const stride = 118 + row * 15;
    const offset = (visualTime * (9 + row * 2) + travel * .035 + row * 47) % stride;
    for (let x = -stride + offset; x < width; x += stride) {
      pixel(ctx, x, y, 33 + row * 5, 2, row % 2 ? '#7acbd0' : '#96dbd9');
      pixel(ctx, x + 38 + row * 4, y + 4, 12, 2, '#65c1cb');
    }
  }

  const cycle = (visualTime + 7) % 23;
  if (reducedMotion || cycle >= 5 && cycle <= 12) {
    whale(ctx, width * .63, shoreline - 38, reducedMotion ? .5 : (cycle - 5) / 7, reducedMotion);
  }

  // Two alternating messages in the sky, kept away from the obstacles and score.
  const message = Math.floor(time / 15) % 2 ? 'HIGH SEAS TREATY' : 'SALVEMOS EL OCÉANO';
  ctx.font = 'bold 14px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const messageWidth = Math.ceil(ctx.measureText(message).width) + 40;
  const messageX = Math.round(width * .43 - messageWidth / 2);
  pixel(ctx, messageX + 5, 85, messageWidth - 10, 29, '#f7f8e6');
  pixel(ctx, messageX, 90, messageWidth, 19, '#f7f8e6');
  pixel(ctx, messageX + 8, 114, messageWidth - 16, 3, '#abd8d8');
  ctx.fillStyle = C.navy;
  ctx.fillText(message, Math.round(width * .43), 101);
  pixel(ctx, messageX + 9, 98, 4, 4, C.coral);
  pixel(ctx, messageX + messageWidth - 13, 98, 4, 4, C.coral);

  pixel(ctx, 0, shoreline, width, height - shoreline, C.sand);
  const foamOffset = Math.round(Math.sin(visualTime * 1.2) * 3);
  pixel(ctx, 0, shoreline - 3 + foamOffset, width, 5, C.foam);
  for (let x = -30 + (travel * .06) % 76; x < width; x += 76) {
    pixel(ctx, x, shoreline + 2 + foamOffset, 39, 4, C.foam);
    pixel(ctx, x + 38, shoreline + 6 + foamOffset, 23, 3, '#e8edcf');
  }
  pixel(ctx, 0, ground - 1, width, 3, '#c8a66a');
  pixel(ctx, 0, ground + 2, width, height - ground - 2, C.sandLight);
  for (let i = 0; i < 18; i++) {
    const x = ((i * 71 - travel * .9) % (width + 60) + width + 60) % (width + 60) - 20;
    const y = ground + 13 + (i * 19) % 49;
    pixel(ctx, x, y, i % 3 === 0 ? 8 : 3, 2, C.sandShade);
    if (i % 6 === 0) {
      pixel(ctx, x + 20, y + 6, 7, 3, '#edb895');
      pixel(ctx, x + 22, y + 3, 3, 3, '#f8d4af');
    }
  }
  // Tiny shoreline grasses are below the collision lane, clearly scenery.
  for (let i = 0; i < 3; i++) {
    const x = ((i * 313 + 220 - travel * .48) % (width + 100) + width + 100) % (width + 100) - 40;
    pixel(ctx, x, height - 7, 3, 7, '#80a77c');
    pixel(ctx, x - 4, height - 11, 3, 8, '#80a77c');
    pixel(ctx, x + 5, height - 14, 3, 12, '#6b9674');
  }
  ctx.restore();
}

const palette = {
  H: C.hair, h: C.hairLight, S: C.skin, s: C.skinLight, E: C.ink,
  T: C.shirt, t: C.shirtLight, G: C.leaf, g: '#529478',
  D: C.denim, d: C.denimDark, W: C.shoe, w: C.sole,
};

const standing = [
  '.....HHHH......',
  '....HHhhHH.....',
  '...HHHHhHHH....',
  '...HHsssssH....',
  '...HHsssEs.....',
  '...HHsssss.....',
  '...HHHsss......',
  '...HHHTss......',
  '..HHHHTTTTT....',
  '..HHHTTTTTTT...',
  '..HHHTTTGTTT...',
  '..HHtTTGgTTT...',
  '...HtTTTTTTs...',
  '....TTTTTTTs...',
  '....TTTTTTTs...',
  '....DDDDDDD....',
];

const legs = [
  ['....DDDDddd....','....DDD.ddd....','...DDD...ddd...','...DD.....dd...','...DD.....dd...','..WWW.....WWW..','..www.....www..','...............'],
  ['....DDDDddd....','.....DDDdd.....','.....DDddd.....','.....DD.ddd....','.....DD..dd....','.....WW..WW....','.....ww..ww....','...............'],
  ['....dddDDDD....','....ddd.DDD....','...ddd...DDD...','...dd.....DD...','...dd.....DD...','..WWW.....WWW..','..www.....www..','...............'],
  ['....dddDDDD....','.....dddDD.....','.....dddDD.....','....ddd.DD.....','....dd..DD.....','....WW..WW.....','....ww..ww.....','...............'],
];

const crouched = [
  '.........HHHHH.......',
  '.......HHHhhHHH......',
  '......HHHHssssH......',
  '.....HHHHssssEs......',
  '....HHHHHsssss.......',
  '...HHHHTTTTss........',
  '..HHHTTTTTTTTT.......',
  '..HHTTTTTGTTTTs......',
  '...TTTTTTgTTTTsss....',
  '....DDDDDDTTT...ss...',
  '....DDdddDD..........',
  '...DDD..dddDD........',
  '..WWW....dddWWW......',
  '..www.......www......',
];

function sprite(ctx, rows, x, y, unit = 2) {
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const color = palette[rows[row][col]];
      if (color) pixel(ctx, x + col * unit, y + row * unit, unit, unit, color);
    }
  }
}

export function drawRunner(ctx, {x = 78, y = 290, ducking = false, running = false, time = 0} = {}) {
  const frame = running ? Math.floor(time * 11) % 4 : 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // A small shadow anchors the character without changing the collision bounds.
  if (y >= 288) pixel(ctx, x + 3, 290, ducking ? 33 : 25, 3, '#b79f72');
  if (ducking) {
    sprite(ctx, crouched, x, y - 28);
    if (running && frame % 2) pixel(ctx, x + 28, y - 4, 8, 2, C.shoe);
  } else {
    const bob = running && y >= 288 && frame % 2 ? 1 : 0;
    sprite(ctx, [...standing, ...legs[frame]], x, y - 48 + bob);
    // The near arm alternates with the legs; the green sprout remains readable.
    if (running && frame % 2 === 0) {
      pixel(ctx, x + 20, y - 24 + bob, 4, 8, C.skin);
      pixel(ctx, x + 23, y - 25 + bob, 7, 4, C.skinLight);
    } else {
      pixel(ctx, x + 8, y - 23 + bob, 4, 8, C.skin);
      pixel(ctx, x + 4, y - 18 + bob, 6, 4, C.skinLight);
    }
  }
  ctx.restore();
}

function barrel(ctx, x, y, w, h) {
  pixel(ctx, x + 2, y, w - 4, 3, '#9f7252');
  pixel(ctx, x, y + 3, w, h - 6, '#695a45');
  pixel(ctx, x + 3, y + 4, w - 6, h - 8, '#8b7453');
  pixel(ctx, x + 4, y + 5, 3, h - 10, '#aa8a5a');
  pixel(ctx, x, y + 5, w, 3, '#263e3d');
  pixel(ctx, x, y + h - 9, w, 3, '#263e3d');
  pixel(ctx, x + 2, y + h - 3, w - 4, 3, '#394a3c');
  const center = x + Math.floor(w / 2);
  pixel(ctx, center - 5, y + 11, 10, 10, '#f0c75d');
  pixel(ctx, center - 1, y + 12, 2, 3, C.oil);
  pixel(ctx, center - 3, y + 15, 6, 4, C.oil);
  pixel(ctx, center - 2, y + 19, 4, 1, C.oil);
}

function trash(ctx, x, y, w, h) {
  pixel(ctx, x, y + h - 6, w, 6, C.oil);
  pixel(ctx, x + 3, y + h - 9, w - 8, 5, C.oilLight);
  // A discarded cyan bottle and a crushed can identify beach pollution.
  pixel(ctx, x + 6, y, 4, 3, '#e59063');
  pixel(ctx, x + 5, y + 3, 6, 3, '#81c7cd');
  pixel(ctx, x + 3, y + 6, 10, Math.max(5, h - 8), '#62a5b3');
  pixel(ctx, x + 5, y + 7, 2, 6, '#bce0da');
  pixel(ctx, x + 18, y + 5, Math.max(5, w - 23), 11, '#718589');
  pixel(ctx, x + 17, y + 4, Math.max(7, w - 21), 3, '#b6c2bb');
  pixel(ctx, x + 19, y + 8, 5, 3, '#e89d7b');
}

function plane(ctx, x, y, w, h) {
  // The nose points left. Exhaust trails behind and is scenery, not a hitbox.
  pixel(ctx, x + w + 3, y + 11, 8, 5, '#87948a');
  pixel(ctx, x + w + 15, y + 8, 12, 8, '#a1aaa0');
  pixel(ctx, x + w + 32, y + 11, 14, 9, '#b3b9a8');
  pixel(ctx, x + 8, y + 10, w - 12, 9, '#faf0ca');
  pixel(ctx, x + 3, y + 12, w - 9, 5, '#faf0ca');
  pixel(ctx, x, y + 14, 5, 3, '#e7c092');
  pixel(ctx, x + 9, y + 18, w - 15, 3, C.coral);
  pixel(ctx, x + 12, y + 11, 5, 3, '#327e95');
  pixel(ctx, x + 21, y + 11, 4, 3, '#327e95');
  pixel(ctx, x + 29, y + 11, 4, 3, '#327e95');
  pixel(ctx, x + 24, y + 3, 5, 10, C.navy);
  pixel(ctx, x + 28, y, 9, 4, C.navy);
  pixel(ctx, x + 21, y + 18, 7, Math.max(3, h - 18), C.navy);
  pixel(ctx, x + 27, y + h - 3, 8, 3, C.navy);
  pixel(ctx, x + w - 9, y + 4, 6, 10, C.coral);
  pixel(ctx, x + w - 6, y + 1, 6, 6, C.coral);
}

export function drawObstacle(ctx, obstacle) {
  const {type, x, y, width, height} = obstacle;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (type === 'plane') plane(ctx, x, y, width, height);
  else if (type === 'trash') trash(ctx, x, y, width, height);
  else barrel(ctx, x, y, width, height);
  ctx.restore();
}
