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

function whale(ctx, x, surfaceY, progress, reducedMotion, talking = false) {
  const rise = reducedMotion ? 1 : Math.sin(progress * Math.PI);
  if (rise <= 0) return;
  const y = Math.round(surfaceY + 20 - 46 * rise);
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
  if (!talking && progress > .24 && progress < .68) {
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

function whaleDialogue(ctx, {whaleX, surfaceY, progress, appearance, width, reducedMotion}) {
  const isTreaty = appearance % 2 === 1;
  const message = isTreaty ? 'TRATADO DE ALTAMAR' : '¡SALVEMOS EL OCÉANO!';
  ctx.font = 'bold 16px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const padding = 26;
  const availableWidth = Math.max(124, Math.min(242, width - 28));
  const split = width <= 360 || ctx.measureText(message).width + padding > availableWidth;
  const lines = split
    ? isTreaty ? ['TRATADO DE', 'ALTAMAR'] : ['¡SALVEMOS EL', 'OCÉANO!']
    : [message];
  const bubbleWidth = Math.ceil(Math.max(...lines.map(line => ctx.measureText(line).width))) + padding;
  const bubbleHeight = lines.length === 2 ? 54 : 36;
  const rise = reducedMotion ? 1 : Math.sin(progress * Math.PI);
  const headY = Math.round(surfaceY + 20 - 46 * rise);
  // The tail finishes beside the whale's forehead, never in the runner's lane.
  const bubbleBottom = Math.min(surfaceY - 30, headY - 18);
  const bubbleY = bubbleBottom - bubbleHeight;
  const bubbleX = Math.round(Math.max(12, Math.min(width - bubbleWidth - 12, whaleX + 30 - bubbleWidth / 2)));
  const tailX = Math.round(Math.max(bubbleX + 16, Math.min(bubbleX + bubbleWidth - 16, whaleX + 22)));
  const cream = '#fff8df';
  const outline = C.navy;
  // Stepped corners and a little offset shadow keep the speech balloon pixel art.
  pixel(ctx, bubbleX + 5, bubbleY + 3, bubbleWidth - 6, bubbleHeight + 2, '#4297a5');
  pixel(ctx, bubbleX + 4, bubbleY, bubbleWidth - 8, bubbleHeight, outline);
  pixel(ctx, bubbleX, bubbleY + 4, bubbleWidth, bubbleHeight - 8, outline);
  pixel(ctx, bubbleX + 5, bubbleY + 3, bubbleWidth - 10, bubbleHeight - 6, cream);
  pixel(ctx, bubbleX + 3, bubbleY + 6, bubbleWidth - 6, bubbleHeight - 12, cream);
  // The stair-step tail bends left toward the head, away from the right-hand tail fin.
  pixel(ctx, tailX - 3, bubbleBottom - 3, 10, 7, outline);
  pixel(ctx, tailX - 5, bubbleBottom + 4, 8, 4, outline);
  pixel(ctx, tailX - 7, bubbleBottom + 8, 6, 4, outline);
  pixel(ctx, tailX - 9, bubbleBottom + 12, 4, 4, outline);
  pixel(ctx, tailX - 1, bubbleBottom - 3, 5, 7, cream);
  pixel(ctx, tailX - 3, bubbleBottom + 4, 4, 4, cream);
  pixel(ctx, tailX - 5, bubbleBottom + 8, 2, 3, cream);
  ctx.fillStyle = outline;
  const centerX = Math.round(bubbleX + bubbleWidth / 2);
  const firstLineY = bubbleY + bubbleHeight / 2 - (lines.length - 1) * 10;
  lines.forEach((line, index) => ctx.fillText(line, centerX, Math.round(firstLineY + index * 20)));
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

  // Every 23s a whale surfaces for 7s; each appearance keeps one consistent line.
  // Speech waits until the head is visible and disappears before it submerges.
  const cycle = (visualTime + 7) % 23;
  if (reducedMotion || cycle >= 5 && cycle <= 12) {
    const progress = reducedMotion ? .5 : (cycle - 5) / 7;
    const talking = reducedMotion || progress >= .22 && progress <= .78;
    const whaleX = Math.round(Math.max(8, Math.min(width * .63, width - 122)));
    const surfaceY = shoreline - 38;
    whale(ctx, whaleX, surfaceY, progress, reducedMotion, talking);
    if (talking) {
      whaleDialogue(ctx, {
        whaleX, surfaceY, progress,
        appearance: reducedMotion ? 0 : Math.floor((visualTime + 7) / 23),
        width, reducedMotion,
      });
    }
  }

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
  H: '#302626', h: '#594038', l: '#88604a', S: '#d49c7b', s: '#f1bc96',
  E: '#233447', I: '#fff9e8', B: '#e9898d', M: '#b65f62',
  T: '#27343b', t: '#415151', G: '#a4d78a', g: '#5b9d76',
  D: '#6699bd', d: '#416c96', W: '#fff0da', P: '#efaaa0', w: '#34516b',
};

// Lucianita: an original chibi sprite, 18 × 28 pixels at a 2px scale.
// The large bright eyes, rosy cheeks and leaf hair clip remain legible on mobile.
const standing = [
  '......HHHHHH......',
  '....HHHhhhhHHH....',
  '...HHhhhllhhhHH...',
  '...HHhhHHHHhHHH...',
  '..HHHhHHssssHHGg..',
  '..HHHHssssssssHg..',
  '..HHHHssEEssEEsH..',
  '..HHHHssEIssEIsH..',
  '..HHHHssEEssEEsH..',
  '..HHHHsBBssssBBH..',
  '..HHHHssssMsssHH..',
  '...HHHHssssssHH...',
  '...HHHHHssssHH....',
  '...HHHHTTssTT.....',
  '..HHHHTTTTTTTT....',
  '..HHHtTTTTTTTTt...',
  '..HHHtTTTGTTTTs...',
  '...HHTTTGgTTTTs...',
  '...HHtTTTTTTTTs...',
  '....HtTTTTTTTT....',
];

const legs = [
  ['......DDDDddd.....','......DDD.ddd.....','.....DDD...ddd....','....DDD.....ddd...',
   '....DD.......dd...','...WWW......WWW...','...WPW......WPW...','...www......www...'],
  ['......DDDDddd.....','.......DDDdd......','.......DDddd......','.......DD.ddd.....',
   '.......DD..dd.....','.......WW..WW.....','.......PW..PW.....','.......ww..ww.....'],
  ['......dddDDDD.....','......ddd.DDD.....','.....ddd...DDD....','....ddd.....DDD...',
   '....dd.......DD...','...WWW......WWW...','...WPW......WPW...','...www......www...'],
  ['......dddDDDD.....','.......dddDD......','.......dddDD......','......ddd.DD......',
   '......dd..DD......','......WW..WW......','......WP..WP......','......ww..ww......'],
];
const jumpingLegs = [
  '......DDDDddd.....','.....DDDDD.ddd....','.....DD....ddd....','.....WW.....ddd...',
  '.....PW......dd...','.....ww......WW...','.............PW...','.............ww...',
];
const crouched = [
  '..........HHHHHH......',
  '........HHHhhhhHHH....',
  '.......HHHsssssssHg...',
  '......HHHssEEssEEsH...',
  '.....HHHHssEIssEIsH...',
  '....HHHHHsBBsssBBsH...',
  '...HHHHHHssssMsssHH...',
  '..HHHHTTTTssssssHH....',
  '..HHHTTTTTTTTTTTss....',
  '...TTTTTTGgTTTTTsss...',
  '....DDDDTTTTTTTT.ss...',
  '...DDdddDDTTTT........',
  '..DDD...dddDD.........',
  '.WWPW....dddWWPW......',
  '.wwww.......wwww......',
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
  const airborne = y < 288;
  const frame = running && !airborne ? Math.floor(time * 10) % 4 : 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (!airborne) pixel(ctx, x + 4, 290, ducking ? 35 : 29, 3, '#b79f72');
  if (ducking && !airborne) {
    sprite(ctx, crouched, x, y - 30);
    if (running && frame % 2) {
      pixel(ctx, x + 28, y - 4, 7, 2, palette.W);
      pixel(ctx, x + 31, y - 4, 2, 2, palette.P);
    }
  } else {
    const bob = running && !airborne && frame % 2 ? 1 : 0;
    const top = y - 56 + bob;
    // Loose hair sways behind her as the two pairs of running frames alternate.
    const sway = airborne ? -2 : frame % 2 ? 0 : -2;
    pixel(ctx, x + 4 + sway, top + 19, 6, 12, palette.H);
    pixel(ctx, x + 2 + sway, top + 27, 6, 8, palette.H);
    pixel(ctx, x + 4 + sway, top + 25, 2, 8, palette.h);
    sprite(ctx, [...standing, ...(airborne ? jumpingLegs : legs[frame])], x, top);
    // Small curved hands and contrasting sleeves preserve the friendly silhouette.
    if (airborne) {
      pixel(ctx, x + 27, top + 30, 4, 6, palette.S);
      pixel(ctx, x + 30, top + 27, 4, 6, palette.s);
      pixel(ctx, x + 6, top + 32, 4, 6, palette.S);
      pixel(ctx, x + 3, top + 30, 5, 4, palette.s);
    } else if (running && frame % 2 === 0) {
      pixel(ctx, x + 27, top + 31, 4, 6, palette.S);
      pixel(ctx, x + 29, top + 29, 5, 5, palette.s);
      pixel(ctx, x + 9, top + 33, 3, 6, palette.S);
    } else {
      pixel(ctx, x + 9, top + 31, 4, 7, palette.S);
      pixel(ctx, x + 5, top + 35, 6, 4, palette.s);
      pixel(ctx, x + 28, top + 34, 3, 6, palette.S);
    }
    // A one-pixel smile and a cream neckline add detail without a facial texture.
    pixel(ctx, x + 20, top + 22, 4, 1, palette.M);
    pixel(ctx, x + 18, top + 28, 6, 1, '#b2b8a7');
  }
  ctx.restore();
}

function barrel(ctx, x, y, w, h, time) {
  const center = Math.round(x + w / 2);
  const bodyX = x + 3, bodyW = w - 6, bodyH = h - 4;
  // Oil remains within the barrel's footprint: its visible puddle has no hidden reach.
  pixel(ctx, x + 2, y + h - 5, w - 4, 5, '#26383e');
  pixel(ctx, x, y + h - 3, w, 3, '#26383e');
  pixel(ctx, x + 5, y + h - 3, 8, 1, '#4f807b');
  pixel(ctx, x + w - 11, y + h - 2, 6, 1, '#766781');
  pixel(ctx, bodyX + 2, y, bodyW - 4, 2, '#30434a');
  pixel(ctx, bodyX, y + 2, bodyW, bodyH - 3, '#314c58');
  pixel(ctx, bodyX + 2, y + 4, bodyW - 4, bodyH - 6, '#54727a');
  pixel(ctx, bodyX + 4, y + 5, 3, bodyH - 8, '#77908b');
  pixel(ctx, bodyX + bodyW - 5, y + 5, 3, bodyH - 8, '#36535d');
  pixel(ctx, bodyX + 2, y + 2, bodyW - 4, 3, '#91a29a');
  pixel(ctx, center + 2, y + 1, 5, 3, '#263c47');
  pixel(ctx, bodyX - 1, y + 7, bodyW + 2, 3, '#a7694f');
  pixel(ctx, bodyX, y + bodyH - 8, bodyW, 3, '#a7694f');
  pixel(ctx, bodyX + 1, y + 8, bodyW - 2, 1, '#d19a65');
  // A yellow oil label and an irregular leak make the hazard instantly readable.
  pixel(ctx, center - 5, y + 12, 11, 10, '#edc45e');
  pixel(ctx, center - 1, y + 13, 2, 3, '#26383e');
  pixel(ctx, center - 3, y + 16, 6, 4, '#26383e');
  pixel(ctx, center - 2, y + 20, 4, 1, '#26383e');
  pixel(ctx, bodyX + bodyW - 5, y + 8, 5, 8, '#182e37');
  pixel(ctx, bodyX + bodyW - 7, y + 13, 5, 9, '#182e37');
  pixel(ctx, bodyX + bodyW - 5, y + 20, 3, Math.max(3, h - 23), '#182e37');
  const dripY = y + 20 + Math.floor((time * 9) % Math.max(3, h - 22));
  pixel(ctx, bodyX + bodyW - 2, Math.min(y + h - 4, dripY), 2, 3, '#26383e');
  pixel(ctx, bodyX + 2, y + 14, 2, 4, '#ab7659');
}

function trash(ctx, x, y, w, h, variant) {
  // The five waste silhouettes share an exact 36 × 22 design space.
  const r = (a, b, c, d, color) => pixel(ctx, x + a * w / 36, y + b * h / 22, c * w / 36, d * h / 22, color);
  const kind = ((Math.floor(variant) % 5) + 5) % 5;
  r(1, 19, 34, 3, '#76816b');
  if (kind === 0) {
    // Plastic water bottle and a crushed, rusty drinks can.
    r(6, 0, 4, 3, '#e59063'); r(5, 3, 6, 3, '#9edbd9');
    r(3, 6, 10, 14, '#62a5b3'); r(5, 7, 2, 10, '#bce0da');
    r(3, 12, 10, 4, '#e5dcc1'); r(6, 13, 5, 2, '#6c9f92');
    r(20, 7, 11, 13, '#818c8a'); r(18, 6, 13, 3, '#bdc7bd');
    r(20, 10, 10, 5, '#d67b5b'); r(24, 10, 2, 4, '#ebbb81');
    r(20, 18, 11, 2, '#4f686c');
  } else if (kind === 1) {
    // A knotted rubbish sack, with a little escaped wrapper beside it.
    r(15, 1, 5, 3, '#718172'); r(12, 4, 10, 3, '#344b4b');
    r(10, 7, 16, 3, '#405859'); r(7, 10, 22, 9, '#344b4b');
    r(10, 19, 17, 2, '#263d42'); r(11, 10, 3, 8, '#5b7470');
    r(23, 12, 3, 6, '#20363c'); r(14, 5, 7, 2, '#b6ae75');
    r(29, 16, 6, 4, '#eee0b4'); r(29, 17, 4, 2, '#db9672');
    r(2, 18, 4, 2, '#b9c4b0');
  } else if (kind === 2) {
    // Discarded tire with a clearly open centre and a piece of blue plastic.
    r(5, 1, 13, 3, '#354149'); r(2, 4, 19, 13, '#354149');
    r(5, 17, 13, 3, '#354149'); r(0, 8, 23, 6, '#354149');
    r(7, 6, 9, 9, '#bca979'); r(9, 5, 5, 2, '#bca979');
    r(3, 5, 3, 10, '#59646a'); r(17, 7, 2, 8, '#1e303a');
    r(23, 12, 10, 7, '#73b6c0'); r(27, 9, 5, 4, '#9bd6d6');
    r(24, 16, 11, 4, '#4f8d9f'); r(25, 13, 2, 5, '#c0e4d9');
  } else if (kind === 3) {
    // Takeaway carton and a drink cup, all edged so they stand out from sand.
    r(1, 10, 21, 11, '#92a29a'); r(2, 10, 19, 8, '#ecedcf');
    r(2, 18, 19, 2, '#bdc9b7'); r(5, 8, 14, 3, '#fff1cf');
    r(2, 12, 19, 2, '#718e87'); r(23, 5, 11, 3, '#a8b3a5');
    r(24, 8, 9, 12, '#e6deb5'); r(26, 11, 6, 5, '#d38169');
    r(28, 0, 2, 6, '#cb775c'); r(28, 0, 5, 2, '#cb775c');
    r(24, 18, 9, 2, '#879f97');
  } else {
    // Abandoned fishing net, buoy and bottle; holes reveal the beach below.
    r(2, 7, 25, 2, '#597269'); r(0, 16, 31, 2, '#597269');
    r(3, 20, 26, 2, '#597269');
    for (let i = 3; i < 29; i += 6) {
      r(i, 8, 2, 12, '#4e746d'); r(i + 2, 11, 4, 2, '#78978a');
    }
    r(7, 2, 6, 6, '#e89169'); r(5, 4, 10, 2, '#e89169');
    r(8, 3, 3, 2, '#ffd29a'); r(28, 4, 4, 3, '#ce8563');
    r(27, 7, 6, 3, '#aac9bd'); r(25, 10, 10, 10, '#8db4ae');
    r(27, 12, 2, 7, '#c5ded0');
  }
}

function plane(ctx, x, y, w, h, time) {
  // Exhaust follows the plane to the right. It is purely visual, never a hitbox.
  for (let i = 0; i < 4; i++) {
    const drift = (time * 17 + i * 13) % 17;
    const puffX = x + w + i * 18 + drift;
    const puffY = y + 12 + Math.round(Math.sin(time * 2.6 + i) * 3);
    const size = 6 + i * 3;
    const shade = ['#42535a', '#68736b', '#8a9080', '#a5a78d'][i];
    pixel(ctx, puffX + 2, puffY - 2, size - 3, 2, shade);
    pixel(ctx, puffX, puffY, size + 1, size - 2, shade);
    pixel(ctx, puffX + 3, puffY + size - 2, size - 3, 2, shade);
    if (i < 3) pixel(ctx, puffX + size + 3, puffY + size + 3, 2, 2, '#60706c');
  }
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
  // Rear engine opening and two small dark oil particles distinguish polluting planes.
  pixel(ctx, x + w - 7, y + 13, 7, 5, '#30444d');
  pixel(ctx, x + w - 3, y + 14, 3, 3, '#182e37');
}

export function drawObstacle(ctx, obstacle, time = 0) {
  const {type, x, y, width, height, variant = 0} = obstacle;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (type === 'plane') plane(ctx, x, y, width, height, time);
  else if (type === 'trash') trash(ctx, x, y, width, height, variant);
  else barrel(ctx, x, y, width, height, time);
  ctx.restore();
}
