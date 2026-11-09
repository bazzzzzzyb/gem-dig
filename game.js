'use strict';
/* Maple's Gem Dig — a match-3 for one special player. No ads, no paywalls, no lives. */

const COLS = 8, ROWS = 8;
const GEMS = ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'rose'];
const GEM_COL = ['#ff4060', '#3d7bff', '#35e6a8', '#ffd040', '#b45cff', '#ff86d6'];
let SPD = 1;              // animation speed multiplier (0 = instant, used by the test bot)
const $ = s => document.querySelector(s);

/* ================= save ================= */
const SAVE_KEY = 'maple-gem-dig-v1';
const save = Object.assign(
  { unlocked: 1, stars: {}, best: {}, boost: { hammer: 3, shuffle: 2, paw: 2 }, sound: true, chests: 0, seenHowto: false },
  JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
const persist = () => localStorage.setItem(SAVE_KEY, JSON.stringify(save));

/* ================= levels ================= */
const P = {
  center:  ['........','........','..1111..','..1111..','..1111..','..1111..','........','........'],
  corners: ['11....11','11....11','........','...22...','...22...','........','11....11','11....11'],
  frame:   ['11111111','1......1','1.2222.1','1.2..2.1','1.2..2.1','1.2222.1','1......1','11111111'],
  bottom:  ['........','........','........','........','11111111','11111111','22222222','22222222'],
  x:       ['2......2','.2....2.','..1..1..','...11...','...11...','..1..1..','.2....2.','2......2'],
  heart:   ['........','.11..11.','12211221','12222221','.122221.','..1221..','...11...','........'],
  stripes: ['1.1.1.1.','1.1.1.1.','2.2.2.2.','2.2.2.2.','1.1.1.1.','1.1.1.1.','2.2.2.2.','2.2.2.2.'],
  diamond: ['...11...','..1221..','.122221.','12222221','12222221','.122221.','..1221..','...11...'],
  full1:   Array(8).fill('11111111'),
  full2:   Array(8).fill('22222222'),
  ring2:   ['22222222','2......2','2.1111.2','2.1..1.2','2.1..1.2','2.1111.2','2......2','22222222'],
};
const S = n => ({ t: 'score', n }), C = (c, n) => ({ t: 'color', c, n }), B = n => ({ t: 'bone', n }), I = { t: 'ice' };
const LEVELS = [
  { m: 20, k: 5, g: [S(2000)] },
  { m: 20, k: 5, g: [C(0, 18), C(1, 18)] },
  { m: 22, k: 5, g: [I], ice: 'center' },
  { m: 22, k: 5, g: [B(2)] },
  { m: 20, k: 5, g: [S(5000)] },
  { m: 22, k: 5, g: [I], ice: 'corners' },
  { m: 22, k: 6, g: [C(2, 16), C(4, 16)] },
  { m: 28, k: 5, g: [B(3)] },
  { m: 26, k: 5, g: [I], ice: 'frame' },
  { m: 24, k: 6, g: [C(0, 15), C(3, 15), C(5, 15)] },
  { m: 28, k: 5, g: [I], ice: 'heart', name: 'For You ♥' },
  { m: 24, k: 5, g: [B(2), S(4000)] },
  { m: 28, k: 5, g: [I], ice: 'bottom' },
  { m: 22, k: 6, g: [S(5000)] },
  { m: 26, k: 5, g: [I, C(1, 20)], ice: 'x' },
  { m: 26, k: 5, g: [B(3)] },
  { m: 28, k: 5, g: [I], ice: 'diamond' },
  { m: 25, k: 6, g: [C(0, 18), C(2, 18), C(4, 18)] },
  { m: 28, k: 5, g: [I], ice: 'stripes' },
  { m: 26, k: 5, g: [B(2), I], ice: 'center' },
  { m: 32, k: 5, g: [I], ice: 'full1' },
  { m: 26, k: 6, g: [C(1, 16), C(3, 16), C(4, 16), C(5, 16)] },
  { m: 28, k: 5, g: [B(3), C(2, 22)] },
  { m: 32, k: 5, g: [I], ice: 'ring2' },
  { m: 26, k: 6, g: [S(6000)] },
  { m: 30, k: 5, g: [I, B(2)], ice: 'heart', name: 'Still You ♥' },
  { m: 28, k: 6, g: [C(4, 30), C(5, 30)] },
  { m: 36, k: 5, g: [I], ice: 'full2' },
  { m: 32, k: 5, g: [B(4)] },
  { m: 34, k: 5, g: [I, B(2), C(0, 25)], ice: 'diamond', name: 'The Big Dig' },
];
function levelDef(i) {
  const L = LEVELS[i];
  const sg = L.g.find(g => g.t === 'score');
  const s2 = Math.round(Math.max(sg ? sg.n * 1.3 : 0, L.m * (L.k === 5 ? 330 : 190)) / 100) * 100;
  return { idx: i, moves: L.m, colors: L.k, goals: L.g, ice: L.ice ? P[L.ice] : null, name: L.name, s2, s3: Math.round(s2 * 1.7 / 100) * 100 };
}

/* ================= images ================= */
const IMG = {};
const MAPLE = { idle: [], jump: [], wag: [], pant: [] };
function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function loadAll() {
  const names = [...GEMS, 'prism', 'bone', 'ice'];
  await Promise.all(names.map(async n => { IMG[n] = await loadImg('art/' + n + '.png'); }));
  await Promise.all(Object.keys(MAPLE).map(async k => {
    for (let i = 0; i < 8; i++) MAPLE[k][i] = await loadImg(`art/maple/${k}_${i}.png`);
    MAPLE[k] = MAPLE[k].filter(Boolean);
  }));
}

/* ================= audio (synthesised, no files) ================= */
let actx = null;
function ac() {
  if (!actx) {
    // iOS 17+: play like a media app, so the silent switch doesn't mute the game (the in-game toggle still does).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
    if (actx) { // iOS unlock: play one silent sample inside the first touch
      try { const s = actx.createBufferSource(); s.buffer = actx.createBuffer(1, 1, 22050); s.connect(actx.destination); s.start(0); } catch (e) { }
    }
  }
  // iOS leaves the context 'interrupted' (not 'suspended') after the app is backgrounded or a call comes in.
  if (actx && actx.state !== 'running') actx.resume().catch(() => { });
  return actx;
}
// Any touch anywhere wakes the sound up again (iOS only allows that inside a user gesture).
['touchend', 'pointerup', 'click'].forEach(ev => document.addEventListener(ev, () => ac(), { passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && actx && actx.state !== 'running') actx.resume().catch(() => { }); });
function tone(f, d = .12, type = 'sine', v = .12, when = 0, slide = 0) {
  if (!save.sound || SPD < 1) return; const a = ac(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .03);
}
function noise(d = .35, v = .25) {
  if (!save.sound || SPD < 1) return; const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = 'lowpass'; f.frequency.setValueAtTime(3000, a.currentTime); f.frequency.exponentialRampToValueAtTime(200, a.currentTime + d);
  g.gain.value = v; s.connect(f).connect(g).connect(a.destination); s.start();
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
const note = (base, n) => base * Math.pow(2, n / 12);
const sfx = {
  swap() { tone(520, .07, 'triangle', .07); tone(780, .07, 'triangle', .05, .04); },
  bad() { tone(240, .1, 'square', .04); tone(190, .14, 'square', .04, .08); },
  match(k) { const i = Math.min(k - 1, 8); tone(note(523, PENTA[i]), .2, 'sine', .14); tone(note(523, PENTA[i + 2]), .25, 'triangle', .07, .05); },
  special() { tone(660, .3, 'sawtooth', .04, 0, 2); tone(990, .25, 'sine', .08, .06); },
  blast() { noise(.4, .22); tone(120, .35, 'sine', .22, 0, .35); },
  prism() { for (let i = 0; i < 8; i++) tone(note(523, PENTA[i]), .3, 'sine', .07, i * .045); },
  win() { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(note(523, n), .35, 'triangle', .1, i * .09)); },
  lose() { [7, 4, 0, -5].forEach((n, i) => tone(note(392, n), .4, 'sine', .1, i * .16)); },
  tap() { tone(880, .05, 'sine', .05); },
  bone() { tone(700, .1, 'square', .05); tone(1050, .18, 'square', .05, .08); tone(1400, .2, 'triangle', .05, .16); },
  star(i) { tone(note(784, i * 4), .45, 'triangle', .12); tone(note(1568, i * 4), .3, 'sine', .05, .03); },
  ice() { tone(1800, .08, 'triangle', .05, 0, .5); },
};

/* ================= tweens ================= */
const tweens = [];
const E = {
  lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t,
  back: t => { const c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  fall: t => { if (t < .8) { const u = t / .8; return u * u; } const u = (t - .8) / .2; return 1 + Math.sin(u * Math.PI) * .06; },
};
function tween(o, to, dur, ease = E.out, delay = 0) {
  dur *= SPD; delay *= SPD;
  return new Promise(res => {
    if (dur <= 0 && delay <= 0) { Object.assign(o, to); res(); return; }
    tweens.push({ o, to, from: null, t0: performance.now() + delay, dur: Math.max(1, dur), ease, res });
  });
}
function stepTweens(t) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; if (t < w.t0) continue;
    if (!w.from) { w.from = {}; for (const k in w.to) w.from[k] = w.o[k]; }
    const p = Math.min(1, (t - w.t0) / w.dur), e = w.ease(p);
    for (const k in w.to) w.o[k] = w.from[k] + (w.to[k] - w.from[k]) * e;
    if (p >= 1) { for (const k in w.to) w.o[k] = w.to[k]; tweens.splice(i, 1); w.res(); }
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms * SPD));

/* ================= game state ================= */
let LV, grid, ice, moves, score, goals, cascade = 1, busy = false, ended = true, selected = null;
let boosterMode = null, extraUsed = false, lastInput = 0, hint = null, cellId = 0;
let dying = [], fx = [], shake = 0;

const mkCell = (c, kind = 'gem', sp = null) => ({ id: ++cellId, c, kind, sp, x: 0, y: 0, s: 1, a: 1, fired: false });
const randColor = () => Math.floor(Math.random() * LV.colors);
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const colorOf = cell => (cell && cell.kind === 'gem' && cell.sp !== 'prism') ? cell.c : -1;
const goalOf = t => goals.find(g => g.t === t);

function startLevel(i) {
  LV = levelDef(i);
  moves = LV.moves; score = 0; cascade = 1; extraUsed = false; ended = false; busy = false;
  selected = null; boosterMode = null; hint = null; dying = []; fx = []; tweens.length = 0;
  goals = LV.goals.map(g => ({ ...g, have: 0 }));
  ice = [...Array(ROWS)].map((_, r) => [...Array(COLS)].map((_, c) => LV.ice ? (+LV.ice[r][c] || 0) : 0));
  const ig = goalOf('ice'); if (ig) ig.n = ice.flat().filter(v => v > 0).length;
  newBoard();
  // gems drop in from above on start
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = grid[r][c]; cell.y = r - ROWS - 1;
    tween(cell, { y: r }, 520 + r * 25, E.fall, (ROWS - r) * 30 + c * 12);
  }
  show('game'); buildGoals(); resize(); updateHUD();
  lastInput = performance.now();
  maple.game.play('pant');
}

function newBoard() {
  for (let tries = 0; tries < 300; tries++) {
    grid = [...Array(ROWS)].map(() => Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let col;
      do { col = randColor(); } while (
        (c >= 2 && grid[r][c - 1].c === col && grid[r][c - 2].c === col) ||
        (r >= 2 && grid[r - 1][c].c === col && grid[r - 2][c].c === col));
      const cell = mkCell(col); cell.x = c; cell.y = r; grid[r][c] = cell;
    }
    const bg = goalOf('bone');
    if (bg) {
      const cols = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).slice(0, Math.min(2, bg.n));
      cols.forEach(c => { const b = mkCell(-1, 'bone'); b.x = c; b.y = 3; grid[3][c] = b; });
    }
    if (!findMatches().length && findMoves().length) break;
  }
}

/* ---------- matching ---------- */
function findMatches() {
  const runs = [];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const col = colorOf(grid[r][c]); let e = c + 1;
      if (col >= 0) while (e < COLS && colorOf(grid[r][e]) === col) e++;
      if (col >= 0 && e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push([r, k]); runs.push({ dir: 'h', cells }); }
      c = e;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const col = colorOf(grid[r][c]); let e = r + 1;
      if (col >= 0) while (e < ROWS && colorOf(grid[e][c]) === col) e++;
      if (col >= 0 && e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push([k, c]); runs.push({ dir: 'v', cells }); }
      r = e;
    }
  }
  // merge runs that share cells (L / T shapes)
  const groups = [];
  for (const run of runs) {
    const keys = run.cells.map(([r, c]) => r * COLS + c);
    const hit = groups.filter(g => keys.some(k => g.cells.has(k)));
    let g;
    if (!hit.length) { g = { cells: new Set(), runs: [] }; groups.push(g); }
    else {
      g = hit[0];
      for (const o of hit.slice(1)) { o.cells.forEach(k => g.cells.add(k)); g.runs.push(...o.runs); groups.splice(groups.indexOf(o), 1); }
    }
    keys.forEach(k => g.cells.add(k)); g.runs.push(run);
  }
  return groups;
}
const isCombo = (a, b) => a.kind !== 'bone' && b.kind !== 'bone' && (a.sp === 'prism' || b.sp === 'prism' || (!!a.sp && !!b.sp));
function findMoves() {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
    const r2 = r + dr, c2 = c + dc; if (!inB(r2, c2)) continue;
    const a = grid[r][c], b = grid[r2][c2]; if (!a || !b) continue;
    if (isCombo(a, b)) { out.push([r, c, r2, c2, 3]); continue; }
    grid[r][c] = b; grid[r2][c2] = a;
    const m = findMatches();
    grid[r][c] = a; grid[r2][c2] = b;
    if (m.length) out.push([r, c, r2, c2, m.reduce((s, g) => s + g.cells.size, 0) - 2]);
  }
  return out;
}

/* ---------- a move ---------- */
async function trySwap(r1, c1, r2, c2) {
  const a = grid[r1][c1], b = grid[r2][c2];
  if (!a || !b || busy || ended) return;
  busy = true; selected = null; hint = null; sfx.swap();
  grid[r1][c1] = b; grid[r2][c2] = a;
  await Promise.all([tween(a, { x: c2, y: r2 }, 160), tween(b, { x: c1, y: r1 }, 160)]);
  cascade = 1;
  if (isCombo(a, b)) {
    moves--; updateHUD();
    await comboSwap(a, r2, c2, b, r1, c1);
  } else {
    const g = findMatches();
    if (!g.length) {
      sfx.bad(); grid[r1][c1] = a; grid[r2][c2] = b;
      await Promise.all([tween(a, { x: c1, y: r1 }, 160), tween(b, { x: c2, y: r2 }, 160)]);
      busy = false; lastInput = performance.now(); return;
    }
    moves--; updateHUD();
    await resolve(g, [[r2, c2], [r1, c1]]);
  }
  await settle();
  busy = false; lastInput = performance.now();
  afterMove();
}

async function resolve(groups, pref = []) {
  const seeds = [], creates = [];
  for (const g of groups) {
    const cells = [...g.cells].map(k => [Math.floor(k / COLS), k % COLS]);
    const color = grid[cells[0][0]][cells[0][1]].c;
    let maxH = 0, maxV = 0;
    for (const run of g.runs) { if (run.dir === 'h') maxH = Math.max(maxH, run.cells.length); else maxV = Math.max(maxV, run.cells.length); }
    let sp = null;
    if (maxH >= 5 || maxV >= 5) sp = 'prism';
    else if (maxH >= 3 && maxV >= 3) sp = 'bomb';
    else if (maxH === 4) sp = 'v';
    else if (maxV === 4) sp = 'h';
    seeds.push(...cells);
    if (sp) {
      let pos = pref.find(([r, c]) => g.cells.has(r * COLS + c));
      if (!pos) { const lr = [...g.runs].sort((x, y) => y.cells.length - x.cells.length)[0]; pos = lr.cells[Math.floor(lr.cells.length / 2)]; }
      creates.push({ r: pos[0], c: pos[1], sp, color });
    }
  }
  sfx.match(cascade);
  if (cascade >= 2) comboText(cascade);
  await clearSet(seeds, creates);
}

function area(sp, r, c) {
  const out = [];
  const row = rr => { for (let i = 0; i < COLS; i++) out.push([rr, i]); };
  const col = cc => { for (let i = 0; i < ROWS; i++) out.push([i, cc]); };
  const box = rad => { for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) out.push([r + dr, c + dc]); };
  switch (sp) {
    case 'h': row(r); break;
    case 'v': col(c); break;
    case 'bomb': box(1); break;
    case 'bomb2': box(2); break;
    case 'cross': row(r); col(c); break;
    case 'cross3': for (let d = -1; d <= 1; d++) { if (inB(r + d, 0)) row(r + d); if (inB(0, c + d)) col(c + d); } break;
    case 'prism': { const k = commonColor(); for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (colorOf(grid[rr][cc]) === k) out.push([rr, cc]); break; }
    case 'nova': for (let rr = 0; rr < ROWS; rr++) row(rr); break;
  }
  return out;
}
function commonColor() {
  const n = Array(6).fill(0);
  for (const row of grid) for (const cell of row) { const k = colorOf(cell); if (k >= 0) n[k]++; }
  return n.indexOf(Math.max(...n));
}

async function clearSet(seeds, creates = []) {
  const set = new Set(), q = seeds.slice(), fired = [];
  while (q.length) {
    const [r, c] = q.pop(); if (!inB(r, c)) continue;
    const k = r * COLS + c; if (set.has(k)) continue;
    const cell = grid[r][c]; if (!cell || cell.kind === 'bone') continue;
    set.add(k);
    if (cell.sp && !cell.fired) { cell.fired = true; fired.push([cell, r, c]); q.push(...area(cell.sp, r, c)); }
  }
  for (const [cell, r, c] of fired) fireFx(cell.sp, r, c, GEM_COL[cell.c] || '#fff');
  if (fired.length) { shake = Math.min(18, 7 + fired.length * 3); sfx.blast(); if (fired.length >= 2 || fired.some(f => f[0].sp === 'prism')) maple.game.play('jump'); }
  const anims = [];
  let cx = 0, cy = 0;
  const origin = fired.length ? [fired[0][1], fired[0][2]] : null;
  for (const k of set) {
    const r = Math.floor(k / COLS), c = k % COLS, cell = grid[r][c];
    grid[r][c] = null; cx += c; cy += r;
    onCleared(cell, r, c);
    const delay = origin ? Math.hypot(r - origin[0], c - origin[1]) * 28 : 0;
    dying.push(cell);
    anims.push(tween(cell, { s: 1.35 }, 70, E.out, delay).then(() => { burst(cell); return tween(cell, { s: 0, a: 0 }, 150, E.in); }));
  }
  const pts = Math.round(set.size * 20 * cascade + fired.length * 120 * cascade);
  score += pts;
  if (set.size) floatText('+' + pts, cx / set.size, cy / set.size, cascade > 2 ? '#ffe14d' : '#fff');
  for (const cr of creates) {
    if (grid[cr.r][cr.c]) continue;
    const nc = mkCell(cr.color, 'gem', cr.sp); nc.x = cr.c; nc.y = cr.r; nc.s = 0;
    grid[cr.r][cr.c] = nc;
    anims.push(tween(nc, { s: 1 }, 320, E.back, 60));
    ring(cr.c, cr.r, 1.2, '#fff', 380);
    sfx.special();
  }
  await Promise.all(anims);
  dying = dying.filter(d => d.a > 0.01);
  updateHUD();
}

function onCleared(cell, r, c) {
  const k = cell.sp === 'prism' ? -1 : cell.c;
  for (const g of goals) if (g.t === 'color' && g.c === k && g.have < g.n) { g.have++; bumpGoal(g); }
  if (ice[r][c] > 0) {
    ice[r][c]--; sfx.ice(); shards(c, r);
    if (ice[r][c] === 0) { const g = goalOf('ice'); if (g) { g.have++; bumpGoal(g); } }
  }
}

async function comboSwap(a, ra, ca, b, rb, cb) {
  const pr = a.sp === 'prism' ? a : b.sp === 'prism' ? b : null;
  if (pr) {
    const other = pr === a ? b : a;
    const [pr_r, pr_c] = pr === a ? [ra, ca] : [rb, cb];
    const [or, oc] = other === a ? [ra, ca] : [rb, cb];
    pr.fired = true; sfx.prism(); maple.game.play('jump');
    if (other.sp === 'prism') {
      other.fired = true; shake = 22; flash();
      bigText('SUPERNOVA!', true);
      await wait(250);
      await clearSet(area('nova', 0, 0));
      return;
    }
    const col = other.c;
    const targets = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (colorOf(grid[r][c]) === col) targets.push([r, c]);
    targets.forEach(([r, c]) => rays(pr_c, pr_r, c, r, GEM_COL[col]));
    if (other.sp) {
      bigText(other.sp === 'bomb' ? 'Bomb Party!' : 'Blaster Storm!', true);
      for (const [r, c] of targets) { const t = grid[r][c]; if (t !== other) { t.sp = other.sp === 'bomb' ? 'bomb' : (Math.random() < .5 ? 'h' : 'v'); t.s = 1.4; tween(t, { s: 1 }, 250, E.back); } }
      await wait(450);
      await clearSet([[pr_r, pr_c], [or, oc], ...targets]);
    } else {
      await wait(260);
      await clearSet([[pr_r, pr_c], ...targets]);
    }
    return;
  }
  const line = s => s === 'h' || s === 'v';
  a.fired = b.fired = true;
  const kind = line(a.sp) && line(b.sp) ? 'cross' : (a.sp === 'bomb' && b.sp === 'bomb' ? 'bomb2' : 'cross3');
  bigText(kind === 'bomb2' ? 'KABOOM!' : kind === 'cross' ? 'Crossfire!' : 'Mega Blast!', true);
  fireFx(kind, ra, ca, GEM_COL[a.c]);
  await clearSet([[ra, ca], [rb, cb], ...area(kind, ra, ca)]);
}

/* ---------- gravity / cascades ---------- */
function bonesOnBoard() { let n = 0; for (const row of grid) for (const c of row) if (c && c.kind === 'bone') n++; return n; }
function spawnCell() {
  const bg = goalOf('bone');
  if (bg && !ended) {
    const on = bonesOnBoard();
    if (on + bg.have < bg.n && on < 2 && Math.random() < .3) return mkCell(-1, 'bone');
  }
  return mkCell(randColor());
}
async function gravity() {
  const anims = [];
  for (let c = 0; c < COLS; c++) {
    let w = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const cell = grid[r][c];
      if (cell) {
        if (r !== w) { grid[w][c] = cell; grid[r][c] = null; anims.push(tween(cell, { y: w }, 110 + (w - r) * 45, E.fall)); }
        w--;
      }
    }
    const n = w + 1;
    for (let r = w; r >= 0; r--) {
      const cell = spawnCell(); cell.x = c; cell.y = r - n - 0.3; grid[r][c] = cell;
      anims.push(tween(cell, { y: r }, 110 + (n + 0.3) * 45, E.fall));
    }
  }
  await Promise.all(anims);
}
async function collectBones() {
  const bg = goalOf('bone'); if (!bg) return false;
  let any = false;
  for (let c = 0; c < COLS; c++) {
    const cell = grid[ROWS - 1][c];
    if (cell && cell.kind === 'bone') {
      any = true; grid[ROWS - 1][c] = null; bg.have++; sfx.bone();
      score += 500; floatText('+500', c, ROWS - 1, '#ffe14d');
      ring(c, ROWS - 1, 1.5, '#ffd34d', 500);
      flyToGoal(cell, c, ROWS - 1, bg);
      bigText(bg.have >= bg.n ? 'All bones found!' : `Golden bone! ${bg.have} of ${bg.n}`, true);
      maple.game.play('jump');
    }
  }
  if (any) { updateHUD(); await wait(320); }
  return any;
}
// The collected bone leaves the board and visibly flies into its goal box.
function flyToGoal(cell, c, r, g) {
  const el = document.getElementById('goal' + goals.indexOf(g));
  const b = bc.getBoundingClientRect();
  if (!el || SPD < 1) { bumpGoal(g); return; }
  const t = el.querySelector('img').getBoundingClientRect();
  const img = document.createElement('img');
  img.src = 'art/bone.png'; img.className = 'flyer';
  const size = cs * 1.2;
  Object.assign(img.style, { left: (b.left + (c + .5) * cs - size / 2) + 'px', top: (b.top + (r + .5) * cs - size / 2) + 'px', width: size + 'px', height: size + 'px' });
  document.body.appendChild(img);
  img.animate([
    { transform: 'translate(0,0) scale(1)', offset: 0 },
    { transform: 'translate(0,-' + cs * 1.2 + 'px) scale(1.6) rotate(-15deg)', offset: .3 },
    { transform: `translate(${t.left + t.width / 2 - (b.left + (c + .5) * cs)}px,${t.top + t.height / 2 - (b.top + (r + .5) * cs)}px) scale(.6) rotate(20deg)`, offset: 1 },
  ], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).onfinish = () => { img.remove(); bumpGoal(g); updateHUD(); };
}
async function settle(allowShuffle = true) {
  for (let guard = 0; guard < 60; guard++) {
    await gravity();
    if (await collectBones()) continue;
    const g = findMatches();
    if (!g.length) break;
    cascade++;
    await resolve(g);
  }
  dying = [];
  if (allowShuffle && !ended && !findMoves().length) await shuffleBoard(true);
}
async function shuffleBoard(auto) {
  if (auto) bigText('Shuffle!');
  const pos = [], cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.kind !== 'bone') { pos.push([r, c]); cells.push(k); } }
  for (let t = 0; t < 200; t++) {
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    cells.forEach((k, i) => grid[pos[i][0]][pos[i][1]] = k);
    if (!findMatches().length && findMoves().length) break;
    if (t === 199) { // give up on the arrangement: recolour normal gems
      cells.forEach(k => { if (!k.sp) k.c = randColor(); });
      t = 0;
      if (!findMatches().length && findMoves().length) break;
    }
  }
  await Promise.all(cells.map((k, i) => tween(k, { x: pos[i][1], y: pos[i][0] }, 450, E.out, i * 4)));
}

/* ---------- end of move ---------- */
const goalDone = g => g.t === 'score' ? score >= g.n : g.have >= g.n;
const allDone = () => goals.every(goalDone);
function afterMove() {
  if (ended) return;
  if (allDone()) return win();
  if (moves <= 0) return lose();
  if (moves === 3) bigText('3 moves left!');
}

async function win() {
  ended = true; busy = true;
  sfx.win(); maple.game.play('wag');
  bigText('Goal reached!', true);
  await wait(1100);
  if (moves > 0) {
    bigText("Maple's Bonus Dig!", true);
    await wait(500);
    while (moves > 0) {
      const pool = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.kind === 'gem' && !k.sp) pool.push(k); }
      if (!pool.length) break;
      const k = pool[Math.floor(Math.random() * pool.length)];
      k.sp = Math.random() < .5 ? 'h' : 'v'; k.s = 1.6; tween(k, { s: 1 }, 260, E.back);
      ring(k.x, k.y, 1, '#fff', 300);
      moves--; score += 150; updateHUD(); sfx.special();
      await wait(110);
    }
    await wait(350);
    for (let guard = 0; guard < 20; guard++) {
      const sps = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.sp) sps.push([r, c]); }
      if (!sps.length) break;
      cascade = 2;
      await clearSet(sps);
      await settle(false);
    }
  }
  updateHUD();
  await wait(500);
  const stars = score >= LV.s3 ? 3 : score >= LV.s2 ? 2 : 1;
  const prev = save.stars[LV.idx] || 0;
  const gained = Math.max(0, stars - prev);
  const reward = [];
  for (let i = 0; i < gained; i++) { const k = ['hammer', 'shuffle', 'paw'][Math.floor(Math.random() * 3)]; save.boost[k]++; reward.push(k); }
  save.stars[LV.idx] = Math.max(prev, stars);
  save.best[LV.idx] = Math.max(save.best[LV.idx] || 0, score);
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, LV.idx + 2));
  persist();
  const icons = { hammer: '🔨', shuffle: '🔀', paw: '💥' };
  const last = LV.idx === LEVELS.length - 1;
  modal(`
    <h2>${last ? 'You did it!' : 'Level clear!'}</h2>
    <div class="big-stars"><span>★</span><span>★</span><span>★</span></div>
    <p style="font-size:26px;font-weight:900">${score.toLocaleString()}</p>
    ${reward.length ? `<p>New stars earned you: <b style="font-size:22px">${reward.map(k => icons[k]).join(' ')}</b></p>` : ''}
    ${last ? '<p>All 30 digs done. Maple is very proud of you. ♥</p>' : ''}
    <div class="btns">
      ${last ? '' : '<button class="btn" data-a="next">Next level ›</button>'}
      <button class="btn alt" data-a="retry">Play again</button>
      <button class="btn alt" data-a="map">Level map</button>
    </div>`, {
    next: () => intro(LV.idx + 1), retry: () => intro(LV.idx), map: () => showMap(),
  });
  const st = [...document.querySelectorAll('#card .big-stars span')];
  for (let i = 0; i < stars; i++) setTimeout(() => { st[i].classList.add('on'); sfx.star(i); }, 350 + i * 380);
}

function lose() {
  ended = true;
  if (!extraUsed) {
    sfx.lose();
    modal(`<h2>Out of moves!</h2>
      <div class="goals-list">${goalChips()}</div>
      <p>Maple sniffed out <b>5 extra moves</b> for you. Free, of course.</p>
      <div class="btns"><button class="btn" data-a="more">+5 moves 🦴</button><button class="btn alt" data-a="quit">Give up</button></div>`,
      { more: () => { extraUsed = true; ended = false; moves += 5; updateHUD(); maple.game.play('wag'); }, quit: () => failed() });
  } else failed();
}
function failed() {
  sfx.lose();
  modal(`<h2>So close!</h2><div class="goals-list">${goalChips()}</div><p>Every dig gets you closer.</p>
    <div class="btns"><button class="btn" data-a="retry">Try again</button><button class="btn alt" data-a="map">Level map</button></div>`,
    { retry: () => intro(LV.idx), map: () => showMap() });
}

/* ---------- boosters ---------- */
async function useBoosterAt(r, c) {
  const kind = boosterMode; boosterMode = null; updateBoosters();
  if (!grid[r][c] || busy || ended || grid[r][c].kind === 'bone') return;
  busy = true; save.boost[kind]--; persist(); updateBoosters();
  cascade = 1;
  if (kind === 'hammer') {
    shake = 10; sfx.blast(); ring(c, r, 1, '#fff', 300);
    await clearSet([[r, c]]);
  } else if (kind === 'paw') {
    shake = 14; sfx.blast(); maple.game.play('jump');
    fireFx('bomb2', r, c, '#ff86d6');
    await clearSet(area('bomb2', r, c));
  }
  await settle();
  busy = false; lastInput = performance.now();
  afterMove();
}
async function boosterShuffle() {
  if (busy || ended || save.boost.shuffle <= 0) return;
  busy = true; save.boost.shuffle--; persist(); updateBoosters();
  await shuffleBoard(false);
  busy = false; lastInput = performance.now();
}

/* ================= effects ================= */
function burst(cell) {
  const col = cell.kind === 'bone' ? '#ffd34d' : cell.sp === 'prism' ? '#fff' : GEM_COL[cell.c];
  const n = SPD < 1 ? 0 : 7;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4;
    fx.push({ t: 'p', x: cell.x + .5, y: cell.y + .5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 0, max: .5 + Math.random() * .4, col: i < 2 ? '#fff' : col, size: .08 + Math.random() * .08 });
  }
}
function shards(c, r) {
  if (SPD < 1) return;
  for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3; fx.push({ t: 'p', x: c + .5, y: r + .5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 0, max: .7, col: '#cdefff', size: .1 }); }
}
function fireFx(sp, r, c, col) {
  if (SPD < 1) return;
  if (sp === 'h' || sp === 'cross') fx.push({ t: 'beam', d: 'h', r, c, life: 0, max: .45, col });
  if (sp === 'v' || sp === 'cross') fx.push({ t: 'beam', d: 'v', r, c, life: 0, max: .45, col });
  if (sp === 'cross3') for (let d = -1; d <= 1; d++) { fx.push({ t: 'beam', d: 'h', r: r + d, c, life: 0, max: .5, col }); fx.push({ t: 'beam', d: 'v', r, c: c + d, life: 0, max: .5, col }); }
  if (sp === 'bomb') ring(c, r, 2, col, 450);
  if (sp === 'bomb2') { ring(c, r, 3.2, col, 600); ring(c, r, 2, '#fff', 400); }
  if (sp === 'prism') { ring(c, r, 4, '#fff', 600); flash(); }
}
function ring(c, r, rad, col, ms) { if (SPD < 1) return; fx.push({ t: 'ring', x: c + .5, y: r + .5, rad, col, life: 0, max: ms / 1000 }); }
function rays(c1, r1, c2, r2, col) { if (SPD < 1) return; fx.push({ t: 'ray', x1: c1 + .5, y1: r1 + .5, x2: c2 + .5, y2: r2 + .5, col, life: 0, max: .6 }); }
function floatText(txt, c, r, col) { if (SPD < 1) return; fx.push({ t: 'txt', txt, x: c + .5, y: r + .5, col, life: 0, max: .9 }); }
let flashA = 0;
function flash() { flashA = .7; }
const COMBO_WORDS = ['', '', 'Nice!', 'Sparkly!', 'Dazzling!', 'Radiant!', 'Legendary!', 'MAPLE MODE!'];
function comboText(k) {
  bigText(COMBO_WORDS[Math.min(k, 7)], k >= 5);
  if (k >= 3) maple.game.play('jump');
}
let bannerT = 0;
function bigText(txt, big) {
  if (SPD < 1) return;
  const b = $('#banner'); b.innerHTML = `<span class="${big ? 'big' : ''}">${txt}</span>`;
  clearTimeout(bannerT); bannerT = setTimeout(() => b.innerHTML = '', 1150);
}

/* ================= rendering ================= */
const bc = $('#board'); const ctx = bc.getContext('2d');
let cs = 40, dpr = 1;
function resize() {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  const vw = window.innerWidth, vh = window.innerHeight;
  const top = $('#top').offsetHeight + $('#goals').offsetHeight + 120 + 34;
  const size = Math.max(240, Math.min(vw - 28, vh - top, 560));
  cs = Math.floor(size / COLS);
  const px = cs * COLS;
  bc.style.width = bc.style.height = px + 'px';
  bc.width = bc.height = Math.round(px * dpr);
}
window.addEventListener('resize', () => { if ($('#game').classList.contains('on')) resize(); });

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

let lastT = 0;
function frame(t) {
  const dt = Math.min(.05, (t - lastT) / 1000 || 0); lastT = t;
  stepTweens(t);
  if ($('#game').classList.contains('on')) { draw(t, dt); hintTick(t); }
  maple.game.tick(t); maple.map.tick(t);
  requestAnimationFrame(frame);
}

function draw(t, dt) {
  const S = cs * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bc.width, bc.height);
  let sx = 0, sy = 0;
  if (shake > 0) { sx = (Math.random() - .5) * shake * dpr; sy = (Math.random() - .5) * shake * dpr; shake *= .86; if (shake < .4) shake = 0; }
  ctx.translate(sx, sy);
  // tiles
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.13)';
    rr(c * S + 1.5 * dpr, r * S + 1.5 * dpr, S - 3 * dpr, S - 3 * dpr, S * .18); ctx.fill();
  }
  // ice under-glow (tile tint)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (ice[r][c]) {
    ctx.fillStyle = ice[r][c] === 2 ? 'rgba(140,210,255,.38)' : 'rgba(140,210,255,.22)';
    rr(c * S + 1.5 * dpr, r * S + 1.5 * dpr, S - 3 * dpr, S - 3 * dpr, S * .18); ctx.fill();
  }
  // selection
  if (selected) {
    ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3 * dpr; ctx.shadowColor = '#ffd34d'; ctx.shadowBlur = 12 * dpr;
    rr(selected.c * S + 2 * dpr, selected.r * S + 2 * dpr, S - 4 * dpr, S - 4 * dpr, S * .2); ctx.stroke(); ctx.shadowBlur = 0;
  }
  ctx.imageSmoothingEnabled = false;
  const hintIds = hint ? [grid[hint[0]][hint[1]], grid[hint[2]][hint[3]]].filter(Boolean).map(k => k.id) : [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k) drawCell(k, t, S, hintIds.includes(k.id)); }
  for (const k of dying) drawCell(k, t, S, false);
  // ice over gems
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (ice[r][c]) {
    const x = c * S + 2 * dpr, y = r * S + 2 * dpr, w = S - 4 * dpr, thick = ice[r][c] === 2;
    // frosted pane
    const gr = ctx.createLinearGradient(x, y, x + w, y + w);
    gr.addColorStop(0, thick ? 'rgba(225,245,255,.62)' : 'rgba(210,240,255,.38)');
    gr.addColorStop(1, thick ? 'rgba(150,205,250,.55)' : 'rgba(150,205,250,.28)');
    ctx.fillStyle = gr; rr(x, y, w, w, S * .16); ctx.fill();
    ctx.strokeStyle = 'rgba(240,252,255,.95)'; ctx.lineWidth = (thick ? 3 : 2) * dpr; ctx.stroke();
    // glints
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.save(); ctx.translate(x + w * .22, y + w * .22); ctx.rotate(-Math.PI / 4);
    ctx.fillRect(-w * .14, -dpr * 1.5, w * .28, dpr * 3); ctx.restore();
    ctx.fillRect(x + w * .72, y + w * .7, dpr * 3, dpr * 3);
    if (thick) { // cracks pattern for the 2-layer ice
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath();
      ctx.moveTo(x + w * .55, y + w * .08); ctx.lineTo(x + w * .62, y + w * .35); ctx.lineTo(x + w * .9, y + w * .45);
      ctx.moveTo(x + w * .62, y + w * .35); ctx.lineTo(x + w * .45, y + w * .6); ctx.stroke();
    }
  }
  drawFx(dt, S);
  if (flashA > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,255,255,${flashA})`; ctx.fillRect(0, 0, bc.width, bc.height); flashA = Math.max(0, flashA - dt * 2.2); }
}

function drawCell(k, t, S, isHint) {
  const cx = (k.x + .5) * S, cy = (k.y + .5) * S;
  if (cy < -S) return;
  let sc = k.s;
  if (isHint) sc *= 1 + Math.sin(t / 110) * .1;
  if (selected && grid[selected.r][selected.c] === k) sc *= 1.08 + Math.sin(t / 90) * .04;
  const size = S * 1.0 * sc;
  ctx.globalAlpha = Math.max(0, k.a);
  // special glows
  if (k.sp === 'bomb') {
    const g = ctx.createRadialGradient(cx, cy, S * .1, cx, cy, S * .62);
    const p = .55 + Math.sin(t / 160 + k.id) * .25;
    g.addColorStop(0, GEM_COL[k.c]); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = Math.max(0, k.a) * p; ctx.fillStyle = g; ctx.fillRect(cx - S * .7, cy - S * .7, S * 1.4, S * 1.4); ctx.globalAlpha = Math.max(0, k.a);
  }
  if (k.sp === 'prism') {
    const hue = (t / 8) % 360;
    const g = ctx.createRadialGradient(cx, cy, S * .1, cx, cy, S * .65);
    g.addColorStop(0, `hsla(${hue},100%,75%,.9)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - S * .7, cy - S * .7, S * 1.4, S * 1.4);
  }
  const img = k.kind === 'bone' ? IMG.bone : k.sp === 'prism' ? IMG.prism : IMG[GEMS[k.c]];
  if (k.sp === 'prism') {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t / 300) * .25);
    if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  } else if (k.kind === 'bone') {
    const bob = Math.sin(t / 250 + k.id) * S * .04;
    if (img) ctx.drawImage(img, cx - size / 2, cy - size / 2 + bob, size, size);
  } else if (img) ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  else { ctx.fillStyle = GEM_COL[k.c] || '#fff'; ctx.beginPath(); ctx.arc(cx, cy, size * .35, 0, 7); ctx.fill(); }
  // line blaster stripes
  if (k.sp === 'h' || k.sp === 'v') {
    const pulse = .7 + Math.sin(t / 120 + k.id) * .3;
    ctx.save(); ctx.translate(cx, cy); if (k.sp === 'v') ctx.rotate(Math.PI / 2); ctx.scale(sc, sc);
    ctx.globalAlpha = Math.max(0, k.a) * .9; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8 * dpr * pulse;
    const u = S / 16;
    ctx.fillRect(-S * .32, -u * 2.2, S * .64, u * 1.3);
    ctx.fillRect(-S * .32, u * .9, S * .64, u * 1.3);
    // arrow tips
    const off = S * .4 + Math.sin(t / 150) * u;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * off, 0); ctx.lineTo(s * (off - u * 3), -u * 2.4); ctx.lineTo(s * (off - u * 3), u * 2.4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  if (k.sp === 'bomb') {
    ctx.save(); ctx.globalAlpha = Math.max(0, k.a);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * dpr; ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.lineDashOffset = -t / 40;
    ctx.beginPath(); ctx.arc(cx, cy, S * .44 * sc, 0, 7); ctx.stroke(); ctx.restore();
  }
  // twinkle
  if (k.kind === 'gem' && !k.sp && SPD >= 1) {
    const ph = ((t / 1000 + k.id * 1.37) % 6);
    if (ph < .35) {
      const a = Math.sin(ph / .35 * Math.PI), u = S * .12 * a;
      const x = cx + S * .18, y = cy - S * .2;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = a;
      ctx.fillRect(x - u, y - dpr, u * 2, 2 * dpr); ctx.fillRect(x - dpr, y - u, 2 * dpr, u * 2);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFx(dt, S) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.life += dt; const p = f.life / f.max;
    if (p >= 1) { fx.splice(i, 1); continue; }
    if (f.t === 'p') {
      f.vy += 14 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      ctx.globalAlpha = 1 - p; ctx.fillStyle = f.col; const z = f.size * S;
      ctx.fillRect(f.x * S - z / 2, f.y * S - z / 2, z, z);
    } else if (f.t === 'beam') {
      const w = S * (.9 * (1 - p)) + 1;
      ctx.globalAlpha = 1 - p * .6; ctx.shadowColor = f.col; ctx.shadowBlur = 20 * dpr;
      ctx.fillStyle = f.col;
      if (f.d === 'h') ctx.fillRect(0, (f.r + .5) * S - w / 2, S * COLS, w); else ctx.fillRect((f.c + .5) * S - w / 2, 0, w, S * ROWS);
      ctx.fillStyle = '#fff';
      if (f.d === 'h') ctx.fillRect(0, (f.r + .5) * S - w / 5, S * COLS, w / 2.5); else ctx.fillRect((f.c + .5) * S - w / 5, 0, w / 2.5, S * ROWS);
      ctx.shadowBlur = 0;
    } else if (f.t === 'ring') {
      ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = S * .25 * (1 - p) + dpr;
      ctx.shadowColor = f.col; ctx.shadowBlur = 16 * dpr;
      ctx.beginPath(); ctx.arc(f.x * S, f.y * S, f.rad * S * E.out(p), 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    } else if (f.t === 'ray') {
      ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * dpr; ctx.shadowColor = f.col; ctx.shadowBlur = 14 * dpr;
      ctx.beginPath(); ctx.moveTo(f.x1 * S, f.y1 * S);
      const n = 6;
      for (let j = 1; j <= n; j++) { const q = j / n; const jx = j < n ? (Math.random() - .5) * S * .3 : 0, jy = j < n ? (Math.random() - .5) * S * .3 : 0; ctx.lineTo((f.x1 + (f.x2 - f.x1) * q) * S + jx, (f.y1 + (f.y2 - f.y1) * q) * S + jy); }
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (f.t === 'txt') {
      ctx.globalAlpha = p < .7 ? 1 : 1 - (p - .7) / .3;
      ctx.font = `900 ${Math.round(S * .42)}px "Avenir Next",system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = (f.y - p * .8) * S;
      ctx.lineWidth = 4 * dpr; ctx.strokeStyle = '#3a0f4a'; ctx.strokeText(f.txt, f.x * S, y);
      ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x * S, y);
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- hints ---------- */
function hintTick(t) {
  if (busy || ended || hint || t - lastInput < 5000) return;
  const m = findMoves(); if (m.length) hint = m[Math.floor(Math.random() * m.length)];
}

/* ================= Maple sprite ================= */
class MapleView {
  constructor(canvas) { this.cv = canvas; this.cx = canvas.getContext('2d'); this.anim = 'idle'; this.f = 0; this.nt = 0; this.once = false; }
  play(name) { if (!MAPLE[name] || !MAPLE[name].length) return; this.anim = name; this.f = 0; this.once = name !== 'idle'; this.loops = name === 'wag' || name === 'pant' ? 2 : 1; }
  tick(t) {
    if (!this.cv.offsetParent) return;
    const fr = MAPLE[this.anim]; if (!fr || !fr.length) return;
    if (t > this.nt) {
      this.nt = t + (this.anim === 'jump' ? 85 : 120);
      this.f++;
      if (this.f >= fr.length) { this.f = 0; if (this.once && --this.loops <= 0) { this.anim = this.home || 'idle'; this.once = false; } }
      const img = MAPLE[this.anim][this.f % MAPLE[this.anim].length];
      this.cx.imageSmoothingEnabled = false; this.cx.clearRect(0, 0, 64, 64); if (img) this.cx.drawImage(img, 0, 0, 64, 64);
    }
  }
}
const maple = { game: new MapleView($('#game-maple')), map: new MapleView($('#map-maple')) };
maple.map.home = 'wag'; maple.map.anim = 'wag';

/* ================= input ================= */
let drag = null;
function cellAt(e) {
  const b = bc.getBoundingClientRect();
  const c = Math.floor((e.clientX - b.left) / cs), r = Math.floor((e.clientY - b.top) / cs);
  return inB(r, c) ? { r, c } : null;
}
bc.addEventListener('pointerdown', e => {
  e.preventDefault(); ac(); lastInput = performance.now(); hint = null;
  if (busy || ended) return;
  const p = cellAt(e); if (!p) return;
  if (boosterMode) { useBoosterAt(p.r, p.c); return; }
  drag = { ...p, x: e.clientX, y: e.clientY };
  try { bc.setPointerCapture(e.pointerId); } catch (_) { }
});
bc.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > cs * .3) {
    const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    const r2 = drag.r + dr, c2 = drag.c + dc, d = drag; drag = null; selected = null;
    if (inB(r2, c2)) trySwap(d.r, d.c, r2, c2);
  }
});
bc.addEventListener('pointerup', () => {
  if (!drag) return;
  const p = drag; drag = null;
  if (selected && Math.abs(selected.r - p.r) + Math.abs(selected.c - p.c) === 1) { const s = selected; selected = null; trySwap(s.r, s.c, p.r, p.c); }
  else if (selected && selected.r === p.r && selected.c === p.c) selected = null;
  else { selected = p; sfx.tap(); }
});
bc.addEventListener('pointercancel', () => drag = null);
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

$('#b-hammer').onclick = () => toggleBooster('hammer');
$('#b-paw').onclick = () => toggleBooster('paw');
$('#b-shuffle').onclick = () => { ac(); boosterShuffle(); };
function toggleBooster(k) {
  ac(); if (busy || ended || save.boost[k] <= 0) return;
  boosterMode = boosterMode === k ? null : k; selected = null; sfx.tap(); updateBoosters();
}
$('#back').onclick = () => {
  ac();
  if (ended) return showMap();
  modal(`<h2>Leave level?</h2><p>Progress on this level will be lost.</p><div class="btns"><button class="btn" data-a="stay">Keep playing</button><button class="btn alt" data-a="map">Level map</button></div>`,
    { stay: () => { }, map: () => { ended = true; showMap(); } });
};

/* ================= HUD ================= */
function goalIcon(g) {
  if (g.t === 'color') return `art/${GEMS[g.c]}.png`;
  if (g.t === 'bone') return 'art/bone.png';
  if (g.t === 'ice') return 'art/ice.png';
  return 'art/prism.png';
}
function goalLabel(g) {
  if (g.t === 'score') return Math.max(0, g.n - score).toLocaleString();
  if (g.t === 'bone') return `${g.have}/${g.n}`;
  return Math.max(0, g.n - g.have);
}
function buildGoals() {
  $('#goals').innerHTML = goals.map((g, i) => `<div class="goal box" id="goal${i}"><img src="${goalIcon(g)}"><span></span></div>`).join('');
}
function goalChips() {
  return goals.map(g => `<div class="goal box ${goalDone(g) ? 'done' : ''}"><img src="${goalIcon(g)}"><span>${goalDone(g) ? '✓' : (g.t === 'score' ? g.n.toLocaleString() : g.t === 'bone' ? g.have + '/' + g.n : g.n)}</span></div>`).join('');
}
function bumpGoal(g) {
  const el = document.getElementById('goal' + goals.indexOf(g)); if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function updateHUD() {
  $('#moves').textContent = moves;
  $('#moves').classList.toggle('low', moves <= 3 && !ended);
  $('#score').textContent = score.toLocaleString();
  $('#lvlname').textContent = `Level ${LV.idx + 1}${LV.name ? ' · ' + LV.name : ''}`;
  $('#fill').style.width = Math.min(100, score / LV.s3 * 100) + '%';
  $('#bs2').style.left = (LV.s2 / LV.s3 * 100) + '%';
  $('#bs1').classList.toggle('on', allDone());
  $('#bs2').classList.toggle('on', score >= LV.s2);
  $('#bs3').classList.toggle('on', score >= LV.s3);
  goals.forEach((g, i) => {
    const el = document.getElementById('goal' + i); if (!el) return;
    el.classList.toggle('done', goalDone(g));
    el.querySelector('span').textContent = goalDone(g) ? '✓' : goalLabel(g);
  });
  updateBoosters();
}
function updateBoosters() {
  for (const k of ['hammer', 'shuffle', 'paw']) {
    const b = $('#b-' + k); b.querySelector('.n').textContent = save.boost[k];
    b.classList.toggle('on', boosterMode === k); b.disabled = save.boost[k] <= 0;
  }
  $('#tip').textContent = boosterMode === 'hammer' ? 'Tap a gem to smash it' : boosterMode === 'paw' ? 'Tap a spot to blast a 5×5 area' : '';
}

/* ================= screens / modal ================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
function modal(html, actions = {}) {
  const m = $('#modal'); $('#card').innerHTML = html; m.classList.add('on');
  $('#card').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { ac(); sfx.tap(); m.classList.remove('on'); (actions[b.dataset.a] || (() => { }))(); });
}
function totalStars() { return Object.values(save.stars).reduce((a, b) => a + b, 0); }
const CHEST_EVERY = 9;
function showMap() {
  show('map'); ended = true;
  const ts = totalStars();
  $('#total-stars').textContent = `${ts} / ${LEVELS.length * 3}`;
  $('#bp-h').textContent = save.boost.hammer; $('#bp-s').textContent = save.boost.shuffle; $('#bp-p').textContent = save.boost.paw;
  const avail = Math.floor(ts / CHEST_EVERY) - save.chests;
  $('#chest-btn').hidden = avail <= 0;
  $('#chest-prog').textContent = `🎁 ${ts % CHEST_EVERY}/${CHEST_EVERY}★ to next treasure`;
  $('#sound-btn').textContent = save.sound ? '🔊 Sound on' : '🔇 Sound off';
  const lv = $('#levels'); lv.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    const st = save.stars[i] || 0, locked = i + 1 > save.unlocked, cur = i + 1 === save.unlocked && !st;
    b.className = 'lv' + (locked ? ' lock' : st ? ' done' : '') + (cur ? ' cur' : '');
    b.innerHTML = locked ? '🔒' : `${L.name ? '♥' : i + 1}<span class="stars">${[0, 1, 2].map(j => `<span class="${j < st ? '' : 'off'}">★</span>`).join('')}</span>`;
    if (!locked) b.onclick = () => { ac(); sfx.tap(); intro(i); };
    lv.appendChild(b);
  });
  const cur = lv.querySelector('.cur'); if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
}
$('#chest-btn').onclick = () => {
  ac(); save.chests++; save.boost.hammer++; save.boost.shuffle++; save.boost.paw++; persist(); sfx.win();
  modal(`<h2>Treasure!</h2><p style="font-size:44px;margin:8px 0">🔨 🔀 💥</p><p>Maple dug up one of each booster.</p><div class="btns"><button class="btn" data-a="ok">Yay!</button></div>`, { ok: showMap });
};
$('#sound-btn').onclick = () => { save.sound = !save.sound; persist(); ac(); sfx.tap(); showMap(); };
$('#howto-btn').onclick = () => { ac(); howto(); };
function howto(after) {
  modal(`<h2>How to play</h2><div class="howto">
    <div><span class="ic">👆</span>Swipe a gem into its neighbour to line up 3 or more of the same.</div>
    <div><span class="ic"><img src="art/ruby.png"></span><b>4 in a row</b> makes a <b>Blaster</b>: clears a whole row or column.</div>
    <div><span class="ic">💥</span><b>L or T shape</b> makes a <b>Bomb</b>: blows up everything around it.</div>
    <div><span class="ic"><img src="art/prism.png"></span><b>5 in a row</b> makes a <b>Prism</b>: swap it with a gem to clear every gem of that colour.</div>
    <div><span class="ic">✨</span>Swap two power gems together for something big.</div>
    <div><span class="ic"><img src="art/bone.png"></span>Drop Maple's golden bones to the bottom row. Break the ice by matching on top of it.</div>
    <div><span class="ic">🎁</span>Boosters are free. Earn more with stars.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Let's dig!</button></div>`, { ok: after || (() => { }) });
}
function intro(i) {
  const L = levelDef(i);
  const chips = L.goals.map(g => `<div class="goal box"><img src="${g.t === 'color' ? 'art/' + GEMS[g.c] + '.png' : g.t === 'bone' ? 'art/bone.png' : g.t === 'ice' ? 'art/ice.png' : 'art/prism.png'}"><span>${g.t === 'score' ? g.n.toLocaleString() : g.t === 'ice' ? 'all' : g.n}</span></div>`).join('');
  const words = L.goals.map(g => g.t === 'score' ? `Score ${g.n.toLocaleString()}` : g.t === 'color' ? `Collect ${g.n} ${GEMS[g.c]}` : g.t === 'bone' ? `Bring ${g.n} golden bone${g.n > 1 ? 's' : ''} down to the bottom row` : 'Break all the ice').join(' · ');
  const go = () => modal(`<h2>Level ${i + 1}</h2>${L.name ? `<p style="color:#ff9ad8;font-weight:900;font-size:20px">${L.name}</p>` : ''}
    <div class="goals-list">${chips}</div><p>${words}</p><p style="opacity:.7">${L.moves} moves</p>
    <div class="btns"><button class="btn" data-a="go">Play</button><button class="btn alt" data-a="back">Back</button></div>`,
    { go: () => startLevel(i), back: () => { } });
  if (!save.seenHowto) { save.seenHowto = true; persist(); howto(go); } else go();
}

/* ================= boot ================= */
(async function boot() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  await loadAll();
  $('#loading').remove();
  showMap();
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();

/* ================= test hooks (used for balancing) ================= */
window.__gem = {
  get state() { return { moves, score, goals, ended, busy, LV }; },
  startLevel, findMoves, findMatches, trySwap, setSpeed: v => SPD = v, save, get grid() { return grid; }, get ice() { return ice; },
};
