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
  { unlocked: 1, stars: {}, best: {}, boost: { hammer: 3, shuffle: 2, paw: 2 }, sound: true, chests: 0, seenHowto: false, stage: 0, seenVegas: false,
    seenDino: false, buddy: '', eggDay: '', seenGolf: false, seenPark: false, seenHome: false },
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

/* ---- Stage 2: Vegas Nights, starring Whiskey & Tiki ----
   Saved stars are keyed by level index, so new levels are only ever APPENDED to LEVELS. Never insert or reorder.
   Vegas rules: neon bulbs instead of ice (light them all), Tiki hiding in boxes (match next to a box),
   a jackpot meter that spins a slot machine, and timed "Happy Hour" levels with no move limit. */
Object.assign(P, {
  dice5:   ['11....11','11....11','........','...11...','...11...','........','11....11','11....11'],
  seven:   ['........','.111111.','.111111.','....11..','...11...','..11....','..11....','........'],
  marquee: ['11111111','1......1','1......1','1......1','1......1','1......1','1......1','11111111'],
  spade:   ['...11...','..1111..','.111111.','11111111','11111111','.1.11.1.','...11...','..1111..'],
  star:    ['...11...','...11...','11111111','.111111.','..1111..','.111111.','.11..11.','11....11'],
  checker: ['11..11..','11..11..','..11..11','..11..11','11..11..','11..11..','..11..11','..11..11'],
});
const X = (n, hp = 1) => ({ t: 'box', n, hp });
const VEGAS = [
  { m: 16, k: 5, g: [S(7000)], name: 'Welcome to Vegas' },
  { m: 15, k: 5, g: [I], ice: 'dice5' },
  { m: 11, k: 5, g: [X(2)], name: 'Find Tiki' },
  { m: 14, k: 5, g: [C(0, 26), C(3, 26)] },
  { time: 60, k: 5, g: [S(10000)], name: 'Happy Hour' },
  { m: 14, k: 5, g: [I], ice: 'seven', name: 'Lucky Seven' },
  { m: 12, k: 6, g: [X(3)] },
  { m: 22, k: 6, g: [S(8000)] },
  { m: 17, k: 5, g: [I], ice: 'marquee' },
  { m: 13, k: 5, g: [X(3, 2)], name: 'Taped Shut' },
  { m: 17, k: 5, g: [I], ice: 'heart', name: 'Neon Heart ♥' },
  { time: 75, k: 5, g: [S(14000)], name: 'Happy Hour' },
  { m: 20, k: 6, g: [C(1, 25), C(4, 25), C(5, 25)] },
  { m: 17, k: 5, g: [I, X(2)], ice: 'spade' },
  { m: 15, k: 5, g: [X(4, 2)] },
  { m: 16, k: 5, g: [I], ice: 'checker' },
  { time: 60, k: 6, g: [S(8000)], name: 'Last Call' },
  { m: 21, k: 5, g: [I, C(3, 25)], ice: 'star' },
  { m: 17, k: 5, g: [X(5, 2)], name: 'Cat Burglar' },
  { m: 24, k: 6, g: [S(13000)], name: 'High Roller' },
  { m: 24, k: 5, g: [I], ice: 'full1', name: 'Light the Strip' },
  { m: 19, k: 5, g: [X(4, 2), I], ice: 'dice5' },
  { time: 90, k: 5, g: [S(19000)], name: 'All Night Long' },
  { m: 21, k: 5, g: [I, X(3, 2), C(0, 25)], ice: 'diamond', name: 'Viva Whiskey & Tiki' },
];
LEVELS.push(...VEGAS.map(l => ({ ...l, vegas: true })));

/* ---- Stage 3: Kailey's Dino Dig, starring Sprout the baby Triceratops (and Maple, who digs) ----
   A walk through time: Triassic, Jurassic, Cretaceous. Every level unearths one real dinosaur for the Field Journal.
   Dino rules: fossils are hidden under dirt (dig by matching on top, find every bone), eggs hatch when you match
   beside them twice and the hatchling stampedes along its row, amber holds pieces still until they are matched,
   and the Roar meter lets her call in a dinosaur from the journal whenever she likes.
   Still append-only: these go on the END of LEVELS. */
Object.assign(P, {
  bed:    ['........','........','........','........','11111111','11111111','11111111','11111111'],
  plates: ['1..11..1','11.11.11','11111111','11111111','........','........','........','........'],
  strata: ['........','........','11111111','11111111','11111111','11111111','22222222','22222222'],
  wing:   ['1.......','11......','111.....','1111....','11111...','111111..','1111111.','11111111'],
  dunes:  ['........','11....11','111..111','11111111','11111111','111..111','11....11','........'],
  dome:   ['..1111..','.122221.','12222221','12222221','11111111','........','........','........'],
  deep:   ['11111111','11111111','11222211','11222211','11222211','11222211','11111111','11111111'],
  frill:  ['.111111.','11111111','11.11.11','11111111','.111111.','..1111..','...11...','........'],
});
// Fossil shapes: how many tiles wide and tall each buried piece is.
const FOS = {
  tooth: { w: 1, h: 1, name: 'Tooth' }, claw: { w: 1, h: 1, name: 'Claw' }, bone: { w: 2, h: 1, name: 'Leg bone' },
  skull: { w: 2, h: 2, name: 'Skull' }, ribs: { w: 2, h: 2, name: 'Ribs' }, tail: { w: 3, h: 1, name: 'Tail bones' },
  print: { w: 1, h: 1, name: 'Footprint' }, rex: { w: 4, h: 2, name: 'Skeleton' },
};
const F = { t: 'fossil' }, G = (n, hp = 2) => ({ t: 'egg', n, hp }), A = n => ({ t: 'amber', n });
const DIG = [
  // Triassic
  { d: 'eoraptor', m: 10, k: 5, g: [F], ice: 'center', fos: ['skull', 'bone', 'tooth'], name: 'First Dig' },
  { d: 'plateosaurus', m: 20, k: 5, g: [S(8000)] },
  { d: 'coelophysis', per: 750, m: 12, k: 5, g: [F], ice: 'bed', fos: ['skull', 'ribs', 'bone', 'bone', 'tooth', 'claw', 'print'], name: 'Ghost Ranch' },
  // Jurassic
  { d: 'dilophosaurus', m: 10, k: 5, g: [G(3)], name: 'The First Nest' },
  { d: 'yi', m: 16, k: 5, g: [C(1, 30), C(4, 30)], name: 'Strange Wings' },
  { d: 'stegosaurus', m: 14, k: 5, g: [F], ice: 'plates', fos: ['tail', 'ribs', 'claw', 'tooth', 'tooth'], name: 'Thagomizer' },
  { d: 'allosaurus', m: 15, k: 5, g: [A(8)], name: 'Stuck in Amber' },
  { d: 'diplodocus', m: 20, k: 5, g: [F], ice: 'strata', fos: ['tail', 'tail', 'bone', 'skull', 'tooth'], name: 'Whiplash' },
  { d: 'brachiosaurus', m: 28, k: 6, g: [S(7000)], name: 'Tall Order' },
  { d: 'brontosaurus', time: 60, per: 450, k: 5, g: [S(10000)], name: 'Thunder Run' },
  { d: 'compsognathus', per: 850, m: 11, k: 5, g: [G(4), C(2, 28)] },
  { d: 'archaeopteryx', m: 21, k: 5, g: [F, A(6)], ice: 'wing', fos: ['ribs', 'bone', 'claw', 'claw', 'tooth'], name: 'Ancient Wing' },
  // Cretaceous
  { d: 'iguanodon', m: 18, k: 5, g: [G(4), S(9000)], name: 'Thumbs Up' },
  { d: 'sinosauropteryx', m: 14, k: 5, g: [A(10)], name: 'Ginger Fuzz' },
  { d: 'psittacosaurus', m: 18, k: 5, g: [F, C(3, 26)], ice: 'dunes', fos: ['skull', 'ribs', 'bone', 'claw', 'tooth', 'print'], name: 'Hide and Seek' },
  { d: 'microraptor', m: 20, k: 5, g: [F], ice: 'heart', fos: ['ribs', 'skull', 'bone', 'claw', 'claw', 'tooth'], name: 'I Dig You ♥' },
  { d: 'deinonychus', time: 75, per: 450, k: 5, g: [S(14000)], name: 'Pack Hunt' },
  { d: 'spinosaurus', per: 750, m: 18, k: 5, g: [F], ice: 'deep', fos: ['skull', 'ribs', 'tail', 'tail', 'bone', 'claw', 'tooth'], name: 'Lost and Found' },
  { d: 'argentinosaurus', m: 30, k: 6, g: [S(8000)], name: 'Titan' },
  { d: 'maiasaura', per: 800, m: 11, k: 5, g: [G(7)], name: 'Good Mother' },
  { d: 'parasaurolophus', m: 24, k: 6, g: [C(0, 22), C(2, 22), C(5, 22)], name: 'Trumpet Call' },
  { d: 'protoceratops', m: 18, k: 5, g: [F, A(7)], ice: 'bed', fos: ['skull', 'ribs', 'bone', 'claw', 'tooth'], name: 'Sandstorm' },
  { d: 'velociraptor', time: 75, per: 450, k: 5, g: [G(5), S(12000)], name: 'Swift Thief' },
  { d: 'oviraptor', per: 800, m: 14, k: 5, g: [G(8), C(3, 30)], name: 'Not an Egg Thief' },
  { d: 'therizinosaurus', m: 15, k: 5, g: [F], ice: 'checker', fos: ['claw', 'claw', 'claw', 'claw', 'ribs', 'ribs', 'bone', 'bone'], name: 'Scythe Claws' },
  { d: 'carnotaurus', m: 28, k: 6, g: [A(6), S(6500)], name: 'Bull Run' },
  { d: 'pachycephalosaurus', per: 560, m: 17, k: 5, g: [I], ice: 'dome', name: 'Hard Headed' },
  { d: 'ankylosaurus', per: 750, m: 14, k: 5, g: [A(12), G(6)], name: 'Armour Plated' },
  { d: 'triceratops', per: 850, m: 13, k: 5, g: [F, G(4)], ice: 'frill', fos: ['skull', 'ribs', 'tail', 'tail', 'bone', 'claw', 'tooth', 'print'], name: 'Three Horns' },
  { d: 'trex', per: 950, m: 16, k: 5, g: [F, G(5), A(8)], ice: 'deep', fos: ['rex', 'skull', 'ribs', 'tail', 'tooth', 'tooth', 'claw', 'print'], name: 'King of the Dig' },
];
LEVELS.push(...DIG);

/* ---- Stages 4-6: Maple's Golf Classic, Maple's Pet Park, Maple Grove ----
   No new rules, only new clothes: each stage re-skins the tile layer, a blocker or two and the tap-to-fire meter
   (see skin / txt / goal / under / call / runner in STAGES). Still append-only. */
Object.assign(P, {
  // golf
  dogleg:  ['.11.....','.11.....','.11.....','.111....','..11111.','...1111.','........','........'],
  rough:   ['11111111','11....11','1......1','1......1','1......1','1......1','11....11','11111111'],
  bunkers: ['........','.22..22.','.22..22.','...11...','...11...','.22..22.','.22..22.','........'],
  green:   ['..2222..','.2....2.','2..11..2','2.1111.2','2.1111.2','2..11..2','.2....2.','..2222..'],
  // pets
  paw:     ['.11..11.','.11..11.','1......1','1.1111.1','..1111..','.111111.','.111111.','..1..1..'],
  dogbone: ['........','.1....1.','11....11','11111111','11111111','11....11','.1....1.','........'],
  fish:    ['........','..111...','.11111.1','11211111','11111111','.11111.1','..111...','........'],
  puddles: ['.11.....','.11...1.','.....121','......1.','.1......','121..22.','.1...22.','........'],
  // home
  glasses: ['........','........','111..111','1.1111.1','111..111','........','........','........'],
  teacup:  ['........','.11111..','.1111111','.11111.1','.1111111','..111...','1111111.','........'],
  bingo:   ['........','.211111.','.121111.','.112111.','.111211.','.111121.','.111112.','........'],
});
const GOLF = [
  { m: 18, k: 5, g: [S(6000)], name: 'Tee Off' },
  { m: 14, k: 5, g: [I], ice: 'dogleg', name: 'The Dogleg' },
  { m: 20, k: 5, g: [B(2)], name: 'Sink It' },
  { m: 16, k: 5, g: [C(0, 26), C(2, 26)], name: 'Flags & Bags' },
  { m: 11, k: 5, g: [G(3)], name: 'Gopher Trouble' },
  { time: 60, per: 450, k: 5, g: [S(10000)], name: 'Speed Golf' },
  { m: 19, k: 5, g: [I], ice: 'rough', name: 'In the Rough' },
  { m: 27, k: 5, g: [B(3), C(3, 24)], name: 'Birdie' },
  { m: 18, k: 5, g: [I], ice: 'heart', name: 'Fore You ♥' },
  { m: 30, k: 6, g: [S(7000)], name: 'Windy Day' },
  { m: 18, k: 5, g: [G(4), I], ice: 'bunkers', name: 'Sand Trap' },
  { m: 25, k: 5, g: [I, B(2)], ice: 'stripes', name: 'Fresh Cut' },
  { time: 75, per: 450, k: 5, g: [G(4), S(12000)], name: 'Beat the Rain' },
  { m: 25, k: 6, g: [C(1, 22), C(4, 22), C(5, 22)], name: 'The Back Nine' },
  { m: 26, k: 5, g: [I, B(2), G(3)], ice: 'green', name: 'Hole in One' },
];
const PARK = [
  { m: 18, k: 5, g: [S(6000)], name: 'Walkies' },
  { m: 12, k: 5, g: [X(2)], name: "Where's Tiki?" },
  { m: 17, k: 5, g: [I], ice: 'paw', name: 'Muddy Paws' },
  { m: 20, k: 5, g: [B(2)], name: 'Fetch' },
  { m: 15, k: 5, g: [A(8)], name: 'Bath Time' },
  { m: 16, k: 5, g: [C(1, 26), C(4, 26)], name: "Cat's Choice" },
  { time: 60, per: 450, k: 5, g: [S(10000)], name: 'Zoomies' },
  { m: 18, k: 5, g: [I, X(2)], ice: 'dogbone', name: 'Buried Treasure' },
  { m: 13, k: 5, g: [X(3, 2)], name: 'Gift Wrapped' },
  { m: 18, k: 5, g: [I], ice: 'heart', name: 'Puppy Love ♥' },
  { m: 25, k: 6, g: [C(0, 22), C(2, 22), C(5, 22)], name: "Dog's Dinner" },
  { m: 25, k: 5, g: [A(8), B(2)], name: 'Bubble Trouble' },
  { m: 20, k: 5, g: [I, A(6)], ice: 'fish', name: 'Splash!' },
  { time: 75, per: 450, k: 5, g: [X(4), S(12000)], name: 'Hide & Seek' },
  { m: 27, k: 5, g: [I, X(3, 2), B(2)], ice: 'puddles', name: 'Best in Show' },
];
const HOME = [
  { m: 18, k: 5, g: [S(6000)], name: 'Welcome Tea' },
  { m: 14, k: 5, g: [I], ice: 'glasses', name: 'Lost My Glasses' },
  { m: 12, k: 5, g: [X(2)], name: 'Biscuit Tin' },
  { m: 16, k: 5, g: [C(0, 26), C(2, 26)], name: 'Garden Club' },
  { m: 15, k: 5, g: [A(8)], name: 'Whiskey Did It' },
  { m: 20, k: 5, g: [I], ice: 'checker', name: 'Patchwork' },
  { time: 60, per: 450, k: 5, g: [S(10000)], name: 'Dance Night' },
  { m: 14, k: 5, g: [X(3, 2)], name: 'Secret Stash' },
  { m: 18, k: 5, g: [I, C(1, 24)], ice: 'teacup', name: 'Tea at Three' },
  { m: 18, k: 5, g: [I], ice: 'heart', name: 'Young at Heart ♥' },
  { m: 30, k: 6, g: [S(7000)], name: 'Card Sharks' },
  { m: 19, k: 5, g: [A(10), X(2)], name: 'Knit One, Purl One' },
  { m: 26, k: 5, g: [I, A(6)], ice: 'frame', name: 'Family Photos' },
  { time: 75, per: 450, k: 5, g: [X(4), S(12000)], name: 'Visiting Hours' },
  { m: 22, k: 5, g: [I, X(3, 2), A(6)], ice: 'bingo', name: 'Full House' },
];
LEVELS.push(...GOLF, ...PARK, ...HOME);

/* ---- stages ----
   Everything that differs between stages lives here, so a new stage is one more entry (plus its levels above).
   pc: the six piece images · per: points per move behind the star maths [5 colours, 6 colours] · tiles: what the
   level pattern means (ice over pieces, bulbs or dirt under them) · meter: the bar above the board.
   Optional dress-up, so one engine wears many stages: skin: the engine's picture name → this stage's picture ·
   under: how the dirt tiles look and sound · txt: banners and sounds · goal: intro-card sentences · runner: what
   runs along a row when an egg opens · call: a tap-to-fire meter's label, icon and the shots it takes in turn. */
const STAGES = [
  {
    id: 'cave', start: 0, n: 30, btn: ['💎', 'Crystal Cave'], title: "Maple's<br>Gem Dig<small>✦ no ads · no paywalls ✦</small>",
    pc: ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'rose'], prism: 'prism', scoreIcon: 'prism', tileIcon: 'ice',
    per: [330, 190], tiles: 'ice', meter: null, pets: ['maple', null], mapHome: 'wag',
    words: ['', '', 'Nice!', 'Sparkly!', 'Dazzling!', 'Radiant!', 'Legendary!', 'MAPLE MODE!'],
    pieceWords: ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'rose'],
    bonus: "Maple's Bonus Dig!", done: 'All 30 digs done. Maple is very proud of you. ♥',
    helper: 'Maple sniffed out', extra: '🦴', fail: 'Every dig gets you closer.', tileGoal: 'Break all the ice',
  },
  {
    id: 'vegas', start: 30, n: VEGAS.length, btn: ['🎰', 'Vegas Nights'], title: 'Vegas<br>Nights<small>✦ starring Whiskey &amp; Tiki ✦</small>',
    pc: ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'], prism: 'disco', scoreIcon: 'coin', tileIcon: 'bulb',
    per: [620, 420], tiles: 'bulb', meter: 'jack', pets: ['whiskey', 'tiki'], mapHome: 'idle',
    words: ['', '', 'Nice!', 'Lucky!', 'On a roll!', 'Hot streak!', 'High roller!', 'WHISKEY MODE!'],
    pieceWords: ['cherries', 'chips', 'clovers', 'bells', 'dice', 'flamingos'],
    bonus: "Whiskey's Bonus Round!", done: 'You ran the whole Strip. Whiskey and Tiki are purring. ♥',
    helper: 'Whiskey won you', extra: '🎰', fail: 'The next spin could be the lucky one.', tileGoal: 'Light up every bulb',
    seen: 'seenVegas',
  },
  {
    id: 'dino', start: 54, n: DIG.length, btn: ['🦕', 'Dino Dig'], title: "Kailey's<br>Dino Dig<small>✦ starring Sprout &amp; Maple ✦</small>",
    pc: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'], prism: 'meteor', scoreIcon: 'trophy', tileIcon: 'mound',
    per: [650, 330], tiles: 'dirt', meter: 'roar', pets: ['sprout', 'maple'], mapHome: 'idle', mapPet: 'sproutf',
    words: ['', '', 'Nice!', 'Roar!', 'Stomping!', 'Colossal!', 'Mesozoic!', 'SPROUT MODE!'],
    pieceWords: ['volcanoes', 'ammonites', 'ferns', 'claws', 'footprints', 'magnolias'], early: { 5: 'd5b' }, earlyWords: { 5: 'dragonflies' },
    bonus: "Sprout's Bonus Stomp!", done: 'Thirty dinosaurs, 165 million years, one brilliant palaeontologist. Sprout and Maple are so proud of you. ♥',
    helper: 'Sprout dug up', extra: '🦕', fail: 'Real digs take patience too. The bones are still down there.', tileGoal: 'Dig out all the dirt',
    seen: 'seenDino',
  },
  {
    id: 'golf', start: 84, n: GOLF.length, btn: ['⛳', 'Golf Classic'], title: "Maple's<br>Golf Classic<small>✦ with Tiki on the bag ✦</small>",
    pc: ['gf0', 'gf1', 'gf2', 'gf3', 'gf4', 'gf5'], prism: 'gf_umbrella', scoreIcon: 'gf_card', tileIcon: 'gf_tuft',
    per: [600, 330], tiles: 'dirt', meter: 'call', pets: ['maple', 'tiki'], mapHome: 'wag',
    words: ['', '', 'Nice!', 'Great shot!', 'On the green!', 'Eagle!', 'Albatross!', 'TIKI MODE!'],
    pieceWords: ['flags', 'caps', 'golf bags', 'trophies', 'clubs', 'golf carts'],
    bonus: "Maple's Bonus Round!", done: 'Fifteen holes and not one lost ball (Tiki found them all). Maple says you are the club champion. ♥',
    helper: 'Tiki fetched you', extra: '⛳', fail: 'Even the pros land in the rough. Tee it up again.', tileGoal: 'Tidy up all the rough and sand',
    seen: 'seenGolf',
    skin: { dirt: 'gf_rough', rock: 'gf_sand', bone: 'gf_ball', egg: 'gf_mound', egg2: 'gf_gopher' },
    under: { edge: ['rgba(18,70,30,.9)', 'rgba(150,112,52,.9)'], clear: ['rgba(170,240,140,.22)'], shard: ['#e8cf8a', '#5fbf5a'], snd: 'snip' },
    txt: { boneOne: 'In the hole!', boneAll: 'Every putt sunk!', eggOne: 'Shoo!', eggAll: 'Course is clear!', eggSnd: 'yip' },
    goal: {
      bone: n => `Sink ${n} golf ball${n > 1 ? 's' : ''} in the bottom row`,
      egg: n => `Shoo ${n} gopher${n > 1 ? 's' : ''} (two knocks each)`,
    },
    runner: { img: 'gf_run' },
    call: { lbl: 'Swing', ready: 'Tap to swing!', img: 'gf_ball', shots: [
      { pow: 'tail', shout: 'Long Drive!', img: 'gf_ball', scale: .55, snd: 'swing' },
      { pow: 'stomp', shout: 'Bunker Blast!', img: 'gf_ball', scale: .55, snd: 'swing' },
      { pow: 'swoop', shout: 'Birdie!', img: 'gf_bird', scale: .8, snd: 'chirp' },
    ] },
  },
  {
    id: 'park', start: 99, n: PARK.length, btn: ['🐾', 'Pet Park'], title: "Maple's<br>Pet Park<small>✦ starring the whole crew ✦</small>",
    pc: ['pk0', 'pk1', 'pk2', 'pk3', 'pk4', 'pk5'], prism: 'pk_frisbee', scoreIcon: 'pk_ribbon', tileIcon: 'pk_print',
    per: [600, 330], tiles: 'dirt', meter: 'call', pets: ['maple', 'whiskey'], mapHome: 'wag',
    words: ['', '', 'Nice!', 'Good dog!', 'Purrfect!', 'Pawsome!', 'Best in show!', 'WHOLE CREW!'],
    pieceWords: ['food bowls', 'fish', 'tennis balls', 'rubber ducks', 'toy mice', 'paw prints'],
    bonus: "The Crew's Bonus Zoomies!", done: 'Paws wiped, bubbles popped, Tiki found every single time. Maple, Whiskey and Tiki think you are the best human in the whole park. ♥',
    helper: 'Maple fetched you', extra: '🐾', fail: 'Shake it off and go again. The crew is right behind you.', tileGoal: 'Clean up every muddy paw print',
    seen: 'seenPark',
    skin: { dirt: 'pk_mud', rock: 'pk_mud2', amber: 'pk_bubble', amberblob: 'pk_bubble' },
    under: { edge: ['rgba(70,40,18,.9)', 'rgba(40,22,8,.95)'], clear: ['rgba(190,235,255,.22)'], shard: ['#6b4423', '#9a6a3a'], snd: 'dig' },
    txt: { amberStuck: "It's in a bubble!", amberSnd: 'pop', amberCol: '#9fe3ff', amberA: .9 },
    goal: { amber: n => `Pop ${n} bubble${n > 1 ? 's' : ''}` },
    call: { lbl: 'Treats', ready: 'Treat time!', img: 'pk_treat', shots: [
      { pow: 'charge', shout: 'Zoomies!', frames: ['whiskey', 'run'], snd: 'meow' },
      { pow: 'stomp', shout: 'Dig, Maple, Dig!', frames: ['maple', 'jump'], snd: 'yip' },
      { pow: 'pack', shout: 'Tiki Pounce!', frames: ['tiki', 'run'], scale: 1.2, snd: 'meow' },
    ] },
  },
  {
    id: 'home', start: 114, n: HOME.length, btn: ['☕', 'Maple Grove'], title: 'Maple<br>Grove<small>✦ the liveliest retirement home ✦</small>',
    pc: ['hm0', 'hm1', 'hm2', 'hm3', 'hm4', 'hm5'], prism: 'hm_ball', scoreIcon: 'hm_star', tileIcon: 'hm_quilt',
    per: [600, 330], tiles: 'dirt', meter: 'call', pets: ['whiskey', 'maple'], mapHome: 'idle',
    words: ['', '', 'Nice!', 'Lovely!', 'Marvellous!', 'Spiffing!', "Bee's knees!", 'BINGO MODE!'],
    pieceWords: ['roses', 'teacups', 'pot plants', 'biscuits', 'balls of yarn', 'spectacles'],
    bonus: 'Bonus Bingo Round!', done: 'Quilts stitched, tins emptied, bingo won fair and square. Everyone at Maple Grove is saving you a seat (Whiskey is sitting in it). ♥',
    helper: 'Whiskey nudged over', extra: '☕', fail: 'No rush here. Put the kettle on and have another go.', tileGoal: 'Stitch every patch of the quilt',
    seen: 'seenHome',
    skin: { dirt: 'hm_patch', rock: 'hm_patch2', box: 'hm_tin', tikibox: 'hm_tin2', amber: 'hm_tangle', amberblob: 'hm_tangle' },
    under: { edge: ['rgba(120,90,60,.9)', 'rgba(90,60,40,.95)'], clear: ['rgba(255,170,190,.5)', 'rgba(150,210,255,.5)', 'rgba(255,225,130,.5)', 'rgba(170,230,170,.5)', 'rgba(205,170,255,.5)'], shard: ['#f3e6c8', '#ffd7e6'], snd: 'snip' },
    txt: { boxOne: 'Biscuits!', boxAll: 'Every tin is open!', boxFly: 'hm3', boxSnd: 'bone', amberStuck: 'All tangled up!', amberSnd: 'snip', amberCol: '#c9a0ff', amberA: .95 },
    goal: {
      box: (n, hp) => `Open ${n} biscuit tin${n > 1 ? 's' : ''}${hp > 1 ? ' (two knocks each)' : ''}`,
      amber: n => `Untangle ${n} piece${n > 1 ? 's' : ''} of yarn`,
    },
    call: { lbl: 'Bingo', ready: 'Shout BINGO!', img: 'hm_card', shots: [
      { pow: 'charge', shout: 'Two Lines!', img: 'hm_ball', scale: .55, snd: 'bingo' },
      { pow: 'swoop', shout: 'Four Corners!', img: 'hm_ball', scale: .6, snd: 'bingo' },
      { pow: 'roar', shout: 'FULL HOUSE!', img: 'hm_ball', scale: .5, snd: 'bingo' },
    ] },
  },
];
const stageOf = i => { let s = 0; for (let k = 1; k < STAGES.length; k++) if (i >= STAGES[k].start) s = k; return s; };
// Stage skins: the engine asks for 'dirt', 'egg', 'bone'... and a stage may answer with its own picture or words.
const skOf = (T, k) => (T.skin && T.skin[k]) || k;
const sk = k => skOf(LV.T, k);
const say = (k, def) => (LV.T.txt && LV.T.txt[k]) || def;
const callMeter = () => !!LV && (LV.T.meter === 'roar' || LV.T.meter === 'call');   // a meter she taps when it is full
const SECS_PER_MOVE = 2.2;   // how the bot (and the star maths) converts a timed level into moves
function levelDef(i) {
  const L = LEVELS[i], st = stageOf(i), T = STAGES[st];
  const sg = L.g.find(g => g.t === 'score');
  const m = L.time ? Math.round(L.time / SECS_PER_MOVE) : L.m;
  const per = L.per || T.per[L.k === 5 ? 0 : 1];
  const s2 = Math.round(Math.max(sg ? sg.n * 1.3 : 0, m * per) / 100) * 100;
  // Flowers only arrive in the Cretaceous, so the earlier eras of Dino Dig swap the magnolia piece for a dragonfly.
  const d = L.d ? DINO[L.d] : null, early = d && d.era < 2 && T.early;
  return {
    pc: early ? T.pc.map((k, n) => T.early[n] || k) : T.pc, words: early ? T.pieceWords.map((w, n) => T.earlyWords[n] || w) : T.pieceWords,
    idx: i, num: i - T.start + 1, stage: st, T, time: L.time || 0, moves: L.time ? 0 : L.m,
    colors: L.k, goals: L.g.map(g => (g.t === 'fossil' ? { ...g, n: L.fos.length } : g)), ice: L.ice ? P[L.ice] : null, name: L.name, s2, s3: Math.round(s2 * 1.7 / 100) * 100,
    fos: L.fos || null, dino: d,
  };
}

/* ---- the Field Journal: one dinosaur per Dino Dig level, in the order they lived ----
   Every line here is meant to be solid, current science. Anything debated is either left out or says so.
   sz: how big its voice is (0 chirp .. 3 rumble) · pow: what it does when the Roar meter calls it in. */
const ERAS = [
  { id: 'Triassic', span: '252 to 201 million years ago', note: 'The first dinosaurs appear, in a world ruled by other reptiles.' },
  { id: 'Jurassic', span: '201 to 145 million years ago', note: 'Giants take over, and the first feathered fliers take off.' },
  { id: 'Cretaceous', span: '145 to 66 million years ago', note: 'The first flowers bloom, and the most famous dinosaurs of all arrive.' },
];
const DINOS = [
  { id: 'eoraptor', name: 'Eoraptor', say: 'EE-oh-rap-tor', means: 'dawn thief', era: 0, when: 'Late Triassic, about 231 million years ago', diet: 'Probably both plants and meat: it had two kinds of teeth', size: 'About 1 m long: the size of a fox', sz: 0, pow: 'pack',
    clue: 'One of the very first dinosaurs, no bigger than a fox.',
    fact: 'It is one of the earliest dinosaurs known. In its day dinosaurs were small, rare animals living in a world ruled by other reptiles.' },
  { id: 'plateosaurus', name: 'Plateosaurus', say: 'PLAT-ee-oh-SORE-us', means: '', era: 0, when: 'Late Triassic, about 210 million years ago', diet: 'Plants', size: '5 to 10 m long: grown-ups ranged from car-length to bus-length', sz: 2, pow: 'stomp',
    clue: 'An early long-necked plant-eater that walked on two legs.',
    fact: 'It was named in 1837, five years before anyone had invented the word "dinosaur".' },
  { id: 'coelophysis', name: 'Coelophysis', say: 'SEE-low-FY-sis', means: 'hollow form', era: 0, when: 'Late Triassic, about 210 million years ago', diet: 'Meat', size: 'About 3 m long but very light: roughly the weight of a border collie', sz: 0, pow: 'pack',
    clue: 'A slim, speedy hunter with hollow bones.',
    fact: 'Hundreds of skeletons were found together at Ghost Ranch in New Mexico, one of the richest dinosaur bonebeds ever discovered.' },
  { id: 'dilophosaurus', name: 'Dilophosaurus', say: 'dy-LOAF-oh-SORE-us', means: 'two-crested lizard', era: 1, when: 'Early Jurassic, about 190 million years ago', diet: 'Meat', size: 'Up to about 7 m long: as long as a delivery van', sz: 2, pow: 'roar',
    clue: 'Two thin crests on its head. The movies got the rest wrong.',
    fact: 'The neck frill and the venom spit were invented for the movies. The real animal had neither, and was far bigger than its film version.' },
  { id: 'yi', name: 'Yi', say: 'EE', means: 'wing (its full name, Yi qi, means "strange wing")', era: 1, when: 'Jurassic, about 160 million years ago', diet: 'Not known for sure', size: 'About the size of a pigeon', sz: 0, pow: 'swoop',
    clue: 'A tiny feathered dinosaur with the wings of a bat.',
    fact: 'Its wings were skin, like a bat\'s, held out by a long rod of bone from each wrist. It also has the shortest name of any dinosaur.' },
  { id: 'stegosaurus', name: 'Stegosaurus', say: 'STEG-oh-SORE-us', means: 'roof lizard', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Plants', size: 'Up to about 9 m long: nearly the length of a bus', sz: 2, pow: 'tail',
    clue: 'Plates on its back and four spikes on its tail.',
    fact: 'Its tail spikes are called a thagomizer. The word comes from a 1982 Far Side cartoon, and scientists liked it enough to keep it.' },
  { id: 'allosaurus', name: 'Allosaurus', say: 'AL-oh-SORE-us', means: 'different lizard', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Meat', size: 'About 8.5 m long: two cars parked end to end', sz: 2, pow: 'roar',
    clue: 'The top hunter of the Jurassic, with a little horn over each eye.',
    fact: 'A young Allosaurus nicknamed Big Al is about 95% complete, and its bones show many healed injuries and infections. Life as a hunter was rough.' },
  { id: 'diplodocus', name: 'Diplodocus', say: 'dih-PLOD-oh-kus', means: 'double beam', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Plants', size: 'About 26 m long: longer than a tennis court', sz: 3, pow: 'tail',
    clue: 'Longer than a tennis court, and much of that is tail.',
    fact: 'Its tail had about 80 bones and tapered to a thin whip. The name "double beam" describes the little two-pronged bones underneath it.' },
  { id: 'brachiosaurus', name: 'Brachiosaurus', say: 'BRAK-ee-oh-SORE-us', means: 'arm lizard', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Plants', size: 'Around 22 m long, and tall enough to look in a fourth-floor window', sz: 3, pow: 'stomp',
    clue: 'Built like a giraffe the size of a building.',
    fact: 'Its front legs were longer than its back legs, so its back sloped like a giraffe\'s. That is the "arm" in "arm lizard".' },
  { id: 'brontosaurus', name: 'Brontosaurus', say: 'BRON-toe-SORE-us', means: 'thunder lizard', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Plants', size: 'About 22 m long: nearly two buses end to end', sz: 3, pow: 'stomp',
    clue: 'The "thunder lizard" whose name went missing for a century.',
    fact: 'Named in 1879, it was folded into Apatosaurus in 1903. A 2015 study argued it is different enough to be its own genus again, though not every palaeontologist agrees.' },
  { id: 'compsognathus', name: 'Compsognathus', say: 'komp-SOG-nah-thus', means: 'elegant jaw', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Meat: lizards and other small animals', size: 'About 1 m long, most of it tail: roughly turkey-sized', sz: 0, pow: 'pack',
    clue: 'A turkey-sized hunter with a dainty jaw.',
    fact: 'One skeleton was found with a whole lizard in its stomach. Its last meal became a fossil too.' },
  { id: 'archaeopteryx', name: 'Archaeopteryx', say: 'ar-kee-OP-ter-iks', means: 'ancient wing', era: 1, when: 'Late Jurassic, about 150 million years ago', diet: 'Meat: probably insects and other small animals', size: 'About 50 cm long: the size of a raven', sz: 0, pow: 'swoop',
    clue: 'Feathered wings, but teeth and a long bony tail.',
    fact: 'It had wings like a bird, plus teeth, clawed fingers and a bony tail. The first skeleton was found in 1861, two years after Darwin published On the Origin of Species.' },
  { id: 'iguanodon', name: 'Iguanodon', say: 'ig-WAH-no-don', means: 'iguana tooth', era: 2, when: 'Early Cretaceous, about 125 million years ago', diet: 'Plants', size: 'About 10 m long: as long as a bus', sz: 2, pow: 'charge',
    clue: 'It gives a spiky thumbs-up.',
    fact: 'Its spiky thumb was first reconstructed as a horn on its nose. It was only the second dinosaur ever named, back in 1825.' },
  { id: 'sinosauropteryx', name: 'Sinosauropteryx', say: 'SY-no-sore-OP-ter-iks', means: 'Chinese lizard wing', era: 2, when: 'Early Cretaceous, about 125 million years ago', diet: 'Meat', size: 'About 1 m long: a house cat with a very long tail', sz: 0, pow: 'pack',
    clue: 'Small, fuzzy and ginger, with a stripy tail.',
    fact: 'In 1996 it became the first dinosaur outside the bird family found with feathers: a coat of simple fuzz. Fossil pigment later showed it was ginger with a striped tail.' },
  { id: 'psittacosaurus', name: 'Psittacosaurus', say: 'SIT-ah-co-SORE-us', means: 'parrot lizard', era: 2, when: 'Early Cretaceous, about 120 million years ago', diet: 'Plants', size: 'Up to 2 m long: about the size of a Labrador', sz: 1, pow: 'charge',
    clue: 'A parrot beak at one end and bristles at the other.',
    fact: 'One fossil kept its skin so well that scientists mapped its colours: dark on top and pale underneath, good camouflage for life in a forest.' },
  { id: 'microraptor', name: 'Microraptor', say: 'MY-crow-rap-tor', means: 'small thief', era: 2, when: 'Early Cretaceous, about 120 million years ago', diet: 'Meat', size: 'About the size of a crow', sz: 0, pow: 'swoop',
    clue: 'Four wings and feathers as glossy as a crow\'s.',
    fact: 'It had four wings, with long flight feathers on its legs as well as its arms. Fossil pigment shows the feathers were glossy black.' },
  { id: 'deinonychus', name: 'Deinonychus', say: 'dy-NON-ih-kus', means: 'terrible claw', era: 2, when: 'Early Cretaceous, about 110 million years ago', diet: 'Meat', size: 'About 3.4 m long and as heavy as a grown person', sz: 1, pow: 'pack',
    clue: 'The real animal behind the movie "raptors".',
    fact: 'Described in 1969, this agile hunter helped convince scientists that dinosaurs were active animals closely related to birds. The movie "Velociraptors" are really its size.' },
  { id: 'spinosaurus', name: 'Spinosaurus', say: 'SPY-no-SORE-us', means: 'spine lizard', era: 2, when: 'Late Cretaceous, about 95 million years ago', diet: 'Fish and other meat', size: 'About 14 m long: one of the longest meat-eaters known, likely longer than T. rex', sz: 3, pow: 'roar',
    clue: 'A sail on its back and a snout like a crocodile.',
    fact: 'The first skeleton was destroyed in a bombing raid on Munich in 1944. For decades scientists had only drawings and notes to work from.' },
  { id: 'argentinosaurus', name: 'Argentinosaurus', say: 'AR-jen-TEEN-oh-SORE-us', means: 'Argentina lizard', era: 2, when: 'Late Cretaceous, about 95 million years ago', diet: 'Plants', size: 'Perhaps 30 to 35 m long and as heavy as a dozen elephants', sz: 3, pow: 'stomp',
    clue: 'One of the biggest animals ever to walk on land.',
    fact: 'It is known from only a handful of bones, but what bones: a single piece of its backbone is about 1.6 m tall, the height of a person.' },
  { id: 'maiasaura', name: 'Maiasaura', say: 'MY-ah-SORE-ah', means: 'good mother lizard', era: 2, when: 'Late Cretaceous, about 77 million years ago', diet: 'Plants', size: 'About 9 m long: nearly the length of a bus', sz: 2, pow: 'charge',
    clue: 'A duck-billed dinosaur famous for its nests.',
    fact: 'It was found beside nests of eggs and babies, the first strong evidence that some dinosaurs cared for their young. A piece of one even flew into space in 1985.' },
  { id: 'parasaurolophus', name: 'Parasaurolophus', say: 'PAIR-ah-sore-OL-oh-fus', means: 'near crested lizard', era: 2, when: 'Late Cretaceous, about 76 million years ago', diet: 'Plants', size: 'About 9.5 m long: nearly the length of a bus', sz: 2, pow: 'charge',
    clue: 'It carried a trumpet on its head.',
    fact: 'Its crest was a hollow tube over a metre long, connected to its nose. Air blown through it probably made deep, booming calls.' },
  { id: 'protoceratops', name: 'Protoceratops', say: 'PRO-toe-SAIR-ah-tops', means: 'first horned face', era: 2, when: 'Late Cretaceous, about 75 million years ago', diet: 'Plants', size: 'About 2 m long: the size of a sheep', sz: 1, pow: 'charge',
    clue: 'A sheep-sized cousin of Triceratops, with a frill but no horns.',
    fact: 'A famous fossil from Mongolia shows one locked in a fight with a Velociraptor. The two were buried together in the middle of the battle.' },
  { id: 'velociraptor', name: 'Velociraptor', say: 'veh-LOSS-ih-RAP-tor', means: 'swift thief', era: 2, when: 'Late Cretaceous, about 75 million years ago', diet: 'Meat', size: 'About the size of a turkey, plus a long tail', sz: 0, pow: 'pack',
    clue: 'Turkey-sized, feathered, and nothing like the movie.',
    fact: 'It had feathers: a forearm bone found in Mongolia has quill knobs, the anchor points for wing feathers. The movie version is more than twice too big.' },
  { id: 'oviraptor', name: 'Oviraptor', say: 'OH-vih-RAP-tor', means: 'egg thief', era: 2, when: 'Late Cretaceous, about 75 million years ago', diet: 'Not known for sure, probably a mix', size: 'About 1.6 m long and the weight of a big dog', sz: 1, pow: 'pack',
    clue: 'Wrongly accused of stealing eggs.',
    fact: 'It was named "egg thief" because it was found on a nest it seemed to be robbing. The eggs turned out to belong to its own kind: it was most likely a parent guarding them.' },
  { id: 'therizinosaurus', name: 'Therizinosaurus', say: 'THAIR-ih-ZIN-oh-SORE-us', means: 'scythe lizard', era: 2, when: 'Late Cretaceous, about 70 million years ago', diet: 'Plants', size: 'About 10 m long: as long as a bus', sz: 2, pow: 'tail',
    clue: 'It had the longest claws of any animal, ever.',
    fact: 'Its hand claws are the longest of any known animal: the bone alone is over half a metre. The scientists who first found them thought they came from a giant turtle.' },
  { id: 'carnotaurus', name: 'Carnotaurus', say: 'KAR-no-TORE-us', means: 'meat-eating bull', era: 2, when: 'Late Cretaceous, about 70 million years ago', diet: 'Meat', size: 'About 8 m long: two cars parked end to end', sz: 2, pow: 'charge',
    clue: 'A hunter with bull horns and the tiniest arms.',
    fact: 'It had a horn over each eye and arms even smaller than a T. rex\'s. Fossil skin impressions show it was covered in scales, not feathers.' },
  { id: 'pachycephalosaurus', name: 'Pachycephalosaurus', say: 'PAK-ee-SEF-ah-lo-SORE-us', means: 'thick-headed lizard', era: 2, when: 'Late Cretaceous, about 67 million years ago', diet: 'Mostly plants', size: 'About 4.5 m long: as long as a car', sz: 1, pow: 'charge',
    clue: 'The thickest skull in the business.',
    fact: 'The dome on top of its head was solid bone up to 25 cm thick: thicker than a bowling ball is wide.' },
  { id: 'ankylosaurus', name: 'Ankylosaurus', say: 'an-KY-low-SORE-us', means: 'fused lizard', era: 2, when: 'Late Cretaceous, about 67 million years ago', diet: 'Plants', size: '6 to 8 m long and as heavy as an elephant', sz: 2, pow: 'tail',
    clue: 'A walking tank with a club for a tail.',
    fact: 'Bony plates grew inside its skin, like a crocodile\'s, and its tail ended in a heavy club of fused bone, probably strong enough to break bones.' },
  { id: 'triceratops', name: 'Triceratops', say: 'try-SAIR-ah-tops', means: 'three-horned face', era: 2, when: 'Late Cretaceous, about 67 million years ago', diet: 'Plants', size: 'Up to 9 m long and heavier than an elephant', sz: 2, pow: 'charge',
    clue: 'Three horns, one frill, and Sprout\'s whole family.',
    fact: 'Its skull could reach about 2.5 m long, one of the largest of any land animal, and its jaws held up to 800 teeth stacked in rows.' },
  { id: 'trex', name: 'Tyrannosaurus rex', say: 'tie-RAN-oh-SORE-us REX', means: 'tyrant lizard king', era: 2, when: 'Late Cretaceous, about 67 million years ago', diet: 'Meat', size: 'About 12 m long: as long as a city bus', sz: 3, pow: 'roar',
    clue: 'The king. You know the one.',
    fact: 'It lived closer in time to you than to Stegosaurus: about 66 million years before us, but more than 80 million years after Stegosaurus.' },
];
const DINO = {}; DINOS.forEach((d, i) => { DINO[d.id] = d; d.n = i; });
const SPROUT = { id: 'sprout', name: 'Sprout', pow: 'charge', sz: 0 };   // who answers the Roar before anything is in the journal
const POWERS = {
  charge: ['Stampede!', 'clears two whole rows'], tail: ['Tail Swipe!', 'clears two whole columns'], stomp: ['Stomp!', 'two giant footprints'],
  roar: ['Mighty Roar!', 'clears every piece of one kind'], pack: ['Pack Hunt!', 'three blasters at once'], swoop: ['Swoop!', 'clears a big X across the board'],
};
// A dinosaur is in the journal once its level has a star: nothing extra to save.
const DINO_STAGE = STAGES.findIndex(s => s.id === 'dino');
const dinoLevel = d => STAGES[DINO_STAGE].start + d.n;
const hasDino = d => (save.stars[dinoLevel(d)] || 0) > 0;
function buddyDino() {
  const pick = DINO[save.buddy];
  if (pick && hasDino(pick)) return pick;
  for (let i = DINOS.length - 1; i >= 0; i--) if (hasDino(DINOS[i])) return DINOS[i];
  return SPROUT;
}

/* ================= images ================= */
const SPROUT_FRAMES = { idle: 15, jump: 7, eat: 11, roar: 9, sleep: 8, run: 6, fidle: 15, fjump: 7, feat: 11, froar: 9, fsleep: 8 };   // f* = facing the camera
const IMG = {}, SRC = {};   // IMG[key] = loaded image, SRC[key] = its path (for <img> tags)
const SPR = {
  maple: { idle: 8, jump: 8, wag: 8, pant: 8 },
  whiskey: { stand: 4, jump: 8, swat: 4, loaf: 10, yawn: 11, run: 6 },
  tiki: { stand: 4, jump: 8, swat: 4, run: 6 },
  sprout: SPROUT_FRAMES,
};
const DINO_ART = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd5b', 'meteor', 'egg', 'egg2', 'skull', 'amber', 'amberblob', 'trophy', 'mound', 'giftegg', 'dirt', 'rock',
  'f_tooth', 'f_claw', 'f_print', 'f_bone', 'f_skull', 'f_ribs', 'f_tail', 'f_rex', 'journal', 'star', 'hatch'];
const STAGE_ART = {
  golf: ['gf0', 'gf1', 'gf2', 'gf3', 'gf4', 'gf5', 'gf_umbrella', 'gf_card', 'gf_rough', 'gf_sand', 'gf_tuft', 'gf_ball', 'gf_mound', 'gf_gopher', 'gf_run', 'gf_bird'],
  park: ['pk0', 'pk1', 'pk2', 'pk3', 'pk4', 'pk5', 'pk_frisbee', 'pk_ribbon', 'pk_mud', 'pk_mud2', 'pk_print', 'pk_bubble', 'pk_treat'],
  home: ['hm0', 'hm1', 'hm2', 'hm3', 'hm4', 'hm5', 'hm_ball', 'hm_star', 'hm_patch', 'hm_patch2', 'hm_quilt', 'hm_tin', 'hm_tin2', 'hm_tangle', 'hm_card'],
};
const FR = {};   // FR[who][anim] = [frames]
let BULB_SRC = '';
function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function loadAll() {
  const jobs = [];
  const get = (key, src) => { SRC[key] = src; jobs.push(loadImg(src).then(i => IMG[key] = i)); };
  for (const n of [...GEMS, 'prism', 'bone', 'ice']) get(n, 'art/' + n + '.png');
  for (const n of ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'seven', 'disco', 'coin', 'box', 'clock']) get(n, 'art/vegas/' + n + '.png');
  get('tikibox', 'art/tiki/box.png');
  for (const n of DINO_ART) get(n, 'art/dino/' + n + '.png');
  for (const d of DINOS) get('p_' + d.id, 'art/dino/p_' + d.id + '.png');
  for (const id in STAGE_ART) for (const n of STAGE_ART[id]) get(n, `art/${id}/${n}.png`);
  for (const who in SPR) {
    FR[who] = {};
    for (const anim in SPR[who]) {
      FR[who][anim] = [];
      for (let i = 0; i < SPR[who][anim]; i++) jobs.push(loadImg(`art/${who}/${anim}_${i}.png`).then(img => FR[who][anim][i] = img));
    }
  }
  await Promise.all(jobs);
  for (const who in FR) for (const anim in FR[who]) FR[who][anim] = FR[who][anim].filter(Boolean);
  // goal icon for "light the bulbs" is drawn, not downloaded
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 28, 2, 32, 28, 30); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(.45, '#ffd34d'); gr.addColorStop(1, 'rgba(255,170,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff6c2'; g.beginPath(); g.arc(32, 28, 13, 0, 7); g.fill();
  g.fillStyle = '#8a6a3a'; g.fillRect(25, 42, 14, 10); g.fillStyle = '#5a4020'; g.fillRect(27, 52, 10, 4);
  BULB_SRC = SRC.bulb = cv.toDataURL();
  FR.sproutf = FR.sprout;   // same sprite sheet, front-facing animations (see ALIAS)
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
  // --- Vegas ---
  light() { tone(1320, .12, 'sine', .07); tone(1980, .18, 'sine', .05, .05); },
  reel() { tone(900 + Math.random() * 300, .03, 'square', .025); },
  reelStop() { tone(180, .12, 'square', .08, 0, .6); tone(660, .1, 'triangle', .06, .02); },
  lever() { tone(300, .18, 'sawtooth', .06, 0, .4); tone(140, .12, 'square', .06, .16); },
  jackpot(big) { const n = big ? 22 : 10; for (let i = 0; i < n; i++) tone(note(1047, PENTA[(i * 3) % 8]), .12, 'triangle', .07, i * .06); if (big) [0, 4, 7, 12].forEach((s, i) => tone(note(523, s), .5, 'sawtooth', .04, i * .12)); },
  meow() { tone(520, .16, 'sawtooth', .05, 0, 1.75); tone(910, .3, 'sawtooth', .05, .15, .55); tone(1040, .16, 'sine', .05, 0, 1.75); tone(1820, .3, 'sine', .04, .15, .55); },
  rip() { noise(.12, .12); tone(500, .08, 'square', .04, 0, .5); },
  tick() { tone(1000, .05, 'square', .05); },
  // --- Dino Dig ---
  dig() { noise(.09, .1); tone(160, .08, 'triangle', .06, 0, .6); },
  crack() { noise(.07, .14); tone(900, .05, 'square', .04, 0, .5); },
  hatch() { tone(1200, .08, 'sine', .07, 0, 1.5); tone(1700, .1, 'sine', .07, .08, 1.3); tone(2100, .14, 'sine', .06, .17, .8); },
  chirp() { tone(1500, .07, 'triangle', .06, 0, 1.4); tone(1900, .09, 'triangle', .06, .09, 1.2); },
  fossil() { [0, 7, 12, 16].forEach((n, i) => tone(note(392, n), .22, 'triangle', .09, i * .07)); },
  amber() { tone(1400, .1, 'triangle', .06, 0, .6); tone(2100, .16, 'sine', .05, .04); },
  yip() { tone(700, .07, 'square', .05, 0, 1.4); tone(900, .1, 'square', .05, .09, .8); },
  // --- Golf / Pet Park / Maple Grove ---
  swing() { noise(.1, .1); tone(1400, .16, 'sine', .08, .06, .35); },
  pop() { tone(900, .06, 'sine', .08, 0, 1.8); tone(1600, .05, 'triangle', .04, .05); },
  snip() { noise(.05, .07); tone(1100, .04, 'triangle', .04, 0, .7); },
  bingo() { [0, 4, 7, 12, 7, 12].forEach((n, i) => tone(note(659, n), .16, 'triangle', .09, i * .08)); },
  // Every dinosaur gets a voice sized to its body: 0 chirps, 3 rumbles.
  roar(sz = 2) {
    if (sz <= 0) { tone(1100, .09, 'sawtooth', .05, 0, 1.5); tone(1500, .14, 'sawtooth', .05, .08, .6); return; }
    const f = [0, 260, 150, 85][sz], d = [0, .45, .7, 1][sz];
    tone(f, d, 'sawtooth', .09, 0, .55); tone(f * 1.5, d * .9, 'square', .035, .02, .5); tone(f * .5, d, 'sine', .14, 0, .7); noise(d * .8, .1 + sz * .03);
  },
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
// Vegas state: timed levels and the jackpot meter
let timed = false, timeLeft = 0, timeStarted = false, paused = false, jackMeter = 0, jackNeed = 50;
// Dino state: buried fossils, and the rows waiting for a hatchling to run along them. (The Roar meter reuses the jackpot meter.)
let fossils = [], hatchQ = [], shotN = 0;   // shotN: how many times this level's call meter has fired

const mkCell = (c, kind = 'gem', sp = null) => ({ id: ++cellId, c, kind, sp, x: 0, y: 0, s: 1, a: 1, fired: false, hp: 1 });
const randColor = () => Math.floor(Math.random() * LV.colors);
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const colorOf = cell => (cell && cell.kind === 'gem' && cell.sp !== 'prism') ? cell.c : -1;
const goalOf = t => goals.find(g => g.t === t);

function startLevel(i) {
  LV = levelDef(i);
  moves = LV.moves; score = 0; cascade = 1; extraUsed = false; ended = false; busy = false;
  selected = null; boosterMode = null; hint = null; dying = []; fx = []; tweens.length = 0;
  timed = !!LV.time; timeLeft = LV.time; timeStarted = false; paused = false; jackMeter = 0; jackNeed = callMeter() ? ROAR_NEED : 50;
  fossils = []; hatchQ = []; shotN = 0;
  setStage(LV.stage, LV.dino ? LV.dino.era : 0);
  goals = LV.goals.map(g => ({ ...g, have: 0 }));
  ice =[...Array(ROWS)].map((_, r) => [...Array(COLS)].map((_, c) => LV.ice ? (+LV.ice[r][c] || 0) : 0));
  const ig = goalOf('ice'); if (ig) ig.n = ice.flat().filter(v => v > 0).length;
  if (LV.fos) placeFossils();
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

// Bury the level's fossils at random under the dirt, biggest first, never overlapping.
function placeFossils() {
  const order = LV.fos.slice().sort((a, b) => FOS[b].w * FOS[b].h - FOS[a].w * FOS[a].h);
  for (let tries = 0; tries < 300; tries++) {
    const used = new Set(), out = [];
    for (const id of order) {
      const sh = FOS[id];
      for (let t = 0; t < 60; t++) {
        const r = Math.floor(Math.random() * (ROWS - sh.h + 1)), c = Math.floor(Math.random() * (COLS - sh.w + 1));
        const cells = [];
        for (let dr = 0; dr < sh.h; dr++) for (let dc = 0; dc < sh.w; dc++) cells.push([r + dr, c + dc]);
        if (cells.some(([rr, cc]) => !ice[rr][cc] || used.has(rr * COLS + cc))) continue;
        cells.forEach(([rr, cc]) => used.add(rr * COLS + cc));
        out.push({ id, r, c, w: sh.w, h: sh.h, cells, found: false });
        break;
      }
    }
    if (out.length === order.length) { fossils = out; return; }
  }
  const g = goalOf('fossil'); if (g) g.n = fossils.length;   // never expected: every pattern has room
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
    // Tiki's boxes and dinosaur eggs start scattered through the middle of the board, never side by side
    for (const xg of [goalOf('box'), goalOf('egg')]) if (xg) {
      const spots = [];
      for (let r = 1; r < ROWS - 1; r++) for (let c = 0; c < COLS; c++) spots.push([r, c]);
      spots.sort(() => Math.random() - .5);
      const used = [];
      for (const [r, c] of spots) {
        if (used.length >= xg.n) break;
        if (used.some(([ur, uc]) => Math.abs(ur - r) + Math.abs(uc - c) < 2)) continue;
        const b = mkCell(-1, xg.t); b.hp = xg.hp; b.x = c; b.y = r; grid[r][c] = b; used.push([r, c]);
      }
    }
    const ag = goalOf('amber');
    if (ag) plainGems(ag.n).forEach(([r, c]) => grid[r][c].amber = true);
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
    const a = grid[r][c], b = grid[r2][c2]; if (!a || !b || a.amber || b.amber) continue;
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
  if (a.amber || b.amber) {   // stuck in amber: it can be matched, but not moved
    const k = a.amber ? a : b; selected = null; sfx.bad(); k.s = 1.18; tween(k, { s: 1 }, 220, E.back);
    bigText(say('amberStuck', 'Stuck in amber!')); lastInput = performance.now(); return;
  }
  busy = true; selected = null; hint = null; sfx.swap();
  timeStarted = true;
  const spend = () => { if (!timed) moves--; else if (SPD < 1) timeLeft = Math.max(0, timeLeft - SECS_PER_MOVE); updateHUD(); };
  grid[r1][c1] = b; grid[r2][c2] = a;
  await Promise.all([tween(a, { x: c2, y: r2 }, 160), tween(b, { x: c1, y: r1 }, 160)]);
  cascade = 1;
  if (isCombo(a, b)) {
    spend();
    await comboSwap(a, r2, c2, b, r1, c1);
  } else {
    const g = findMatches();
    if (!g.length) {
      sfx.bad(); grid[r1][c1] = a; grid[r2][c2] = b;
      await Promise.all([tween(a, { x: c1, y: r1 }, 160), tween(b, { x: c2, y: r2 }, 160)]);
      busy = false; lastInput = performance.now(); return;
    }
    spend();
    await resolve(g, [[r2, c2], [r1, c1]]);
  }
  await settle();
  await jackpots();
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

async function clearSet(seeds, creates = [], from = null, gentle = false) {
  const set = new Set(), q = seeds.slice(), fired = [], boxHit = new Set(), amberHit = new Set();
  while (q.length) {
    const [r, c] = q.pop(); if (!inB(r, c)) continue;
    const k = r * COLS + c; if (set.has(k)) continue;
    const cell = grid[r][c]; if (!cell || cell.kind === 'bone') continue;
    if (cell.kind === 'box' || cell.kind === 'egg') { boxHit.add(k); continue; }   // a blast landing right on a box or egg
    if (cell.amber) { amberHit.add(k); continue; }   // amber cracks open instead; the piece inside stays
    set.add(k);
    if (cell.sp && !cell.fired) { cell.fired = true; fired.push([cell, r, c]); q.push(...area(cell.sp, r, c)); }
  }
  // anything cleared right next to a box gives it a knock too
  for (const k of set) {
    const r = Math.floor(k / COLS), c = k % COLS;
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const n = inB(r + dr, c + dc) && grid[r + dr][c + dc];
      if (n && (n.kind === 'box' || n.kind === 'egg')) boxHit.add((r + dr) * COLS + c + dc);
    }
  }
  if (!gentle) for (const k of boxHit) hitBox(Math.floor(k / COLS), k % COLS);   // gentle: a hatchling runs past other eggs without waking them
  for (const k of amberHit) freeAmber(Math.floor(k / COLS), k % COLS);
  if (LV.T.meter && !ended) jackMeter += set.size;
  if (callMeter()) jackMeter = Math.min(jackMeter, jackNeed);   // a roar waits until she calls it
  for (const [cell, r, c] of fired) fireFx(cell.sp, r, c, GEM_COL[cell.c] || '#fff');
  if (fired.length) { shake = Math.min(18, 7 + fired.length * 3); sfx.blast(); if (fired.length >= 2 || fired.some(f => f[0].sp === 'prism')) maple.game.play('jump'); }
  const anims = [];
  let cx = 0, cy = 0;
  const origin = from || (fired.length ? [fired[0][1], fired[0][2]] : null);
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
    const held = grid[cr.r][cr.c];
    if (held) {   // only when the spot was a piece just freed from amber: it becomes the power piece
      if (held.kind === 'gem' && !held.sp) { held.sp = cr.sp; held.c = cr.color; held.s = 1.5; anims.push(tween(held, { s: 1 }, 320, E.back, 60)); sfx.special(); }
      continue;
    }
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

// A box takes a knock: the ribbon comes off first (hp 2), then Tiki pops out and is collected.
function hitBox(r, c) {
  const cell = grid[r][c], g = goalOf('box');
  if (cell && cell.kind === 'egg') return hitEgg(cell, r, c);
  if (!cell || cell.kind !== 'box') return;
  cell.hp--;
  if (cell.hp > 0) {
    sfx.rip(); cell.s = 1.35; tween(cell, { s: 1 }, 260, E.back);
    burst({ x: c, y: r, kind: 'gem', c: 0 });
    return;
  }
  grid[r][c] = null; score += 400;
  if (g) g.have++;
  sfx[say('boxSnd', 'meow')](); ring(c, r, 1.5, '#ffd34d', 500); floatText('+400', c, r, '#ffe14d');
  dying.push(cell); tween(cell, { s: 1.6, a: 0 }, 300, E.out);
  if (g) {
    flyToGoal(cell, c, r, g, LV.T.txt && LV.T.txt.boxFly ? SRC[LV.T.txt.boxFly] : 'art/tiki/south.png');
    bigText(g.have >= g.n ? say('boxAll', 'Tiki is free!') : `${say('boxOne', 'Found Tiki!')} ${g.have} of ${g.n}`, true);
  }
  maple.game.play('jump');
}

// An egg takes two knocks: first it cracks, then it hatches and the hatchling runs the length of its row.
function hitEgg(cell, r, c) {
  const g = goalOf('egg');
  cell.hp--;
  if (cell.hp > 0) { sfx.crack(); cell.s = 1.3; tween(cell, { s: 1 }, 260, E.back); burst({ x: c, y: r, kind: 'gem', c: 3 }); return; }
  grid[r][c] = null; score += 300; hatchQ.push(r);
  if (g) g.have++;
  sfx[say('eggSnd', 'hatch')](); ring(c, r, 1.5, '#fff3c4', 500); floatText('+300', c, r, '#ffe14d');
  dying.push(cell); tween(cell, { s: 1.6, a: 0 }, 300, E.out);
  if (g) { bumpGoal(g); bigText(g.have >= g.n ? say('eggAll', 'All hatched!') : say('eggOne', 'Hatched!'), true); }
  maple.game.play('jump');
}
function freeAmber(r, c) {
  const cell = grid[r][c], g = goalOf('amber');
  if (!cell || !cell.amber) return;
  cell.amber = false; score += 100; cell.s = 1.35; tween(cell, { s: 1 }, 260, E.back);
  sfx[say('amberSnd', 'amber')](); ring(c, r, .9, say('amberCol', '#ffb93b'), 350); burst({ x: c, y: r, kind: 'gem', c: 3 });
  if (g && g.have < g.n) { g.have++; bumpGoal(g); }
}
// A tile of dirt has just been dug away: is a whole fossil showing now?
function checkFossils(r, c) {
  for (const f of fossils) {
    if (f.found || !f.cells.some(([rr, cc]) => rr === r && cc === c) || f.cells.some(([rr, cc]) => ice[rr][cc] > 0)) continue;
    f.found = true;
    const g = goalOf('fossil'), mx = f.c + (f.w - 1) / 2, my = f.r + (f.h - 1) / 2, pts = 150 * f.w * f.h;
    score += pts; sfx.fossil(); ring(mx, my, 1.2 + f.w * .4, '#fff3c4', 600); floatText('+' + pts, mx, my, '#ffe14d');
    if (g) {
      g.have++;
      flyToGoal(null, mx, my, g, SRC['f_' + f.id]);
      bigText(g.have >= g.n ? 'All dug up!' : `${FOS[f.id].name}!`, true);
    }
    maple.game.play('jump');
  }
}

function onCleared(cell, r, c) {
  const k = cell.sp === 'prism' ? -1 : cell.c;
  for (const g of goals) if (g.t === 'color' && g.c === k && g.have < g.n) { g.have++; bumpGoal(g); }
  if (ice[r][c] > 0) {
    ice[r][c]--;
    const tl = LV.T.tiles;
    if (tl === 'bulb') { if (ice[r][c] === 0) { sfx.light(); ring(c, r, .9, '#ffd34d', 350); } else sfx.tap(); }
    else if (tl === 'dirt') { const U = LV.T.under || {}; sfx[U.snd || 'dig'](); shards(c, r, (U.shard || ['#8d8792', '#a8713c'])[ice[r][c] ? 0 : 1]); }
    else { sfx.ice(); shards(c, r); }
    if (ice[r][c] === 0) { const g = goalOf('ice'); if (g) { g.have++; bumpGoal(g); } if (tl === 'dirt') checkFossils(r, c); }
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
      flyToGoal(cell, c, ROWS - 1, bg, SRC[sk('bone')]);
      bigText(bg.have >= bg.n ? say('boneAll', 'All bones found!') : `${say('boneOne', 'Golden bone!')} ${bg.have} of ${bg.n}`, true);
      maple.game.play('jump');
    }
  }
  if (any) { updateHUD(); await wait(320); }
  return any;
}
// The collected bone leaves the board and visibly flies into its goal box.
function flyToGoal(cell, c, r, g, src = 'art/bone.png') {
  const el = document.getElementById('goal' + goals.indexOf(g));
  const b = bc.getBoundingClientRect();
  if (!el || SPD < 1) { bumpGoal(g); return; }
  const t = el.querySelector('img').getBoundingClientRect();
  const img = document.createElement('img');
  img.src = src; img.className = 'flyer';
  const size = cs * 1.2;
  Object.assign(img.style, { left: (b.left + (c + .5) * cs - size / 2) + 'px', top: (b.top + (r + .5) * cs - size / 2) + 'px', width: size + 'px', height: size + 'px' });
  document.body.appendChild(img);
  img.animate([
    { transform: 'translate(0,0) scale(1)', offset: 0 },
    { transform: 'translate(0,-' + cs * 1.2 + 'px) scale(1.6) rotate(-15deg)', offset: .3 },
    { transform: `translate(${t.left + t.width / 2 - (b.left + (c + .5) * cs)}px,${t.top + t.height / 2 - (b.top + (r + .5) * cs)}px) scale(.6) rotate(20deg)`, offset: 1 },
  ], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).onfinish = () => { img.remove(); bumpGoal(g); updateHUD(); };
}
// Each hatchling scampers along the row it hatched in and clears it.
async function hatchRuns() {
  if (!hatchQ.length) return false;
  const rows = [...new Set(hatchQ.splice(0))];
  for (const r of rows) {
    sfx.chirp(); cameo(LV.T.runner || SPROUT, -1, r + .5, COLS + 1, r + .5, 650, 1.5, 5);
    const cells = []; for (let c = 0; c < COLS; c++) cells.push([r, c]);
    await wait(160);
    await clearSet(cells, [], [r, -1], true);
  }
  return true;
}
async function settle(allowShuffle = true) {
  for (let guard = 0; guard < 60; guard++) {
    await gravity();
    if (await collectBones()) continue;
    if (await hatchRuns()) continue;
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
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.kind === 'gem' && !k.amber) { pos.push([r, c]); cells.push(k); } }
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
  if (timed) { if (timeLeft <= 0) lose(); return; }
  if (moves <= 0) return lose();
  if (moves === 3) bigText('3 moves left!');
}

/* ---------- Vegas: the jackpot slot machine ---------- */
// Every piece cleared fills the meter. When it's full Whiskey pulls the lever. It always pays out.
const JACK = [
  { id: 'cherry', img: 'v0', w: 28, name: 'Cherry Bombs!', sub: '3 bombs go off' },
  { id: 'bell', img: 'v3', w: 28, name: 'Ring-a-ding!', sub: '4 blasters fire' },
  { id: 'clover', img: 'v2', w: 22, name: 'Lucky Clover!', sub: 'A whole colour is cleared' },
  { id: 'dice', img: 'v4', w: 14, name: 'Lucky Roll!', sub: '' },
  { id: 'seven', img: 'seven', w: 8, name: 'JACKPOT!!!', sub: 'Everything at once' },
];
let forceJack = null;   // test hook
async function jackpots() {
  while (LV.T.meter === 'jack' && !ended && jackMeter >= jackNeed && !allDone()) await jackpot();
  updateJack();
}
async function jackpot() {
  jackMeter -= jackNeed; jackNeed += 15; paused = true; updateJack();
  let roll = Math.random() * 100, pick = JACK[0];
  for (const j of JACK) { if (roll < j.w) { pick = j; break; } roll -= j.w; }
  if (forceJack) { pick = JACK.find(j => j.id === forceJack) || pick; forceJack = null; }
  if (SPD >= 1) await slotShow(pick);
  await applyJackpot(pick.id);
  paused = false;
  await settle();
}
function plainGems(n) {
  const pool = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.kind === 'gem' && !k.sp && !k.amber) pool.push([r, c]); }
  return pool.sort(() => Math.random() - .5).slice(0, n);
}
async function applyJackpot(id) {
  cascade = 1;
  const arm = async kinds => {   // turn random pieces into power pieces, then set them all off
    const ps = plainGems(kinds.length);
    for (let i = 0; i < ps.length; i++) {
      const [r, c] = ps[i], k = grid[r][c];
      k.sp = kinds[i]; k.s = 1.6; tween(k, { s: 1 }, 260, E.back); ring(c, r, 1, '#ffd34d', 300); sfx.special();
      await wait(130);
    }
    await wait(280);
    if (ps.length) await clearSet(ps);
  };
  const line = () => (Math.random() < .5 ? 'h' : 'v');
  if (id === 'cherry') await arm(['bomb', 'bomb', 'bomb']);
  else if (id === 'bell') await arm([line(), line(), line(), line()]);
  else if (id === 'clover') { sfx.prism(); flash(); await clearSet(area('prism', 0, 0)); }
  else if (id === 'dice') { if (timed) timeLeft += 8; else moves += 3; score += 500; updateHUD(); await wait(300); }
  else if (id === 'seven') { score += 3000; shake = 20; flash(); updateHUD(); await arm(['bomb', 'bomb', 'h', 'v', 'prism']); }
}
function slotShow(pick) {
  return new Promise(done => {
    const el = $('#slot'), reels = [...el.querySelectorAll('.strip')], res = el.querySelector('.res');
    const H = 76, pool = ['v0', 'v3', 'v2', 'v4', 'seven', 'v5', 'v1'];
    res.innerHTML = '&nbsp;'; el.classList.remove('win', 'big'); el.classList.add('on');
    maple.game.play('wag'); sfx.lever();
    reels.forEach((s, i) => {
      const n = 14 + i * 7, items = [];
      for (let j = 0; j < n - 1; j++) items.push(pool[Math.floor(Math.random() * pool.length)]);
      items.push(pick.img);
      s.style.transition = 'none'; s.style.transform = 'translateY(0)';
      s.innerHTML = items.map(k => `<div class="it"><img src="art/vegas/${k}.png"></div>`).join('');
      void s.offsetHeight;
      const dur = 1100 + i * 500;
      s.style.transition = `transform ${dur}ms cubic-bezier(.12,.75,.25,1)`;
      s.style.transform = `translateY(${-(n - 1) * H}px)`;
      setTimeout(() => sfx.reelStop(), dur);
    });
    const tick = setInterval(() => sfx.reel(), 85);
    setTimeout(() => {
      clearInterval(tick);
      const sub = pick.id === 'dice' ? (timed ? '+8 seconds' : '+3 moves') : pick.sub;
      res.innerHTML = `<b>${pick.name}</b><span>${sub}</span>`;
      el.classList.add('win'); if (pick.id === 'seven') el.classList.add('big');
      sfx.jackpot(pick.id === 'seven'); maple.game.play('jump');
      setTimeout(() => { el.classList.remove('on'); done(); }, pick.id === 'seven' ? 1900 : 1300);
    }, 2250);
  });
}
function updateJack() {
  const el = $('#jack'), kind = LV && LV.T.meter; el.hidden = !kind;
  if (el.hidden) return;
  const p = Math.min(1, jackMeter / jackNeed), roar = callMeter(), K = LV.T.call, ready = roar && p >= 1 && !ended;
  $('#jackfill').style.width = (p * 100) + '%';
  el.classList.toggle('hot', p >= .8 && !roar); el.classList.toggle('roar', roar); el.classList.toggle('ready', ready);
  $('#jacklbl').textContent = K ? (ready ? K.ready : K.lbl) : roar ? (ready ? 'Tap to roar!' : 'Roar') : 'Jackpot';
  const src = K ? SRC[K.img] : roar ? (buddyDino() === SPROUT ? 'art/sprout/fidle_0.png' : SRC['p_' + buddyDino().id]) : SRC.seven, im = $('#jackimg');
  if (im.getAttribute('src') !== src) im.src = src;
}

/* ---------- Dino Dig: the Roar ---------- */
// Clearing pieces fills the Roar meter. When it is full she taps it (or Sprout) and a dinosaur from her journal
// crosses the board doing what it does best. Which one comes is hers to choose in the journal.
const ROAR_NEED = 55;
function cameo(d, x1, y1, x2, y2, ms, size = 2.6, hops = 4, pulse = false) {
  if (SPD < 1) return;
  const frames = d.frames ? FR[d.frames[0]][d.frames[1]] : d.id === 'sprout' ? FR.sprout.run : null;
  fx.push({ t: 'dino', img: IMG[d.img] || IMG['p_' + d.id], frames, x1, y1, x2, y2, size: size * (d.scale || 1), hops, pulse, flip: x2 < x1, life: 0, max: ms / 1000 });
}
// How much a spot matters to the goals: powers aim themselves where they help most.
function goalWorth(r, c) {
  if (!inB(r, c)) return 0;
  const k = grid[r][c];
  return 1 + (ice[r][c] > 0 ? 2 : 0) + (k && (k.kind === 'egg' || k.amber) ? 3 : 0);
}
function bestOf(list, worth) { let best = list[0], bv = -1; for (const o of list) { const v = worth(o) + Math.random(); if (v > bv) { bv = v; best = o; } } return best; }
async function fireRoar() {
  if (!callMeter() || busy || ended || jackMeter < jackNeed) return;
  busy = true; paused = true; hint = null; selected = null; boosterMode = null; timeStarted = true;
  jackMeter -= jackNeed; jackNeed += 15; updateJack(); updateBoosters();
  const K = LV.T.call;   // Dino Dig sends the journal buddy; the newer stages take their shots in turn
  await dinoPower(K ? K.shots[shotN++ % K.shots.length] : buddyDino());
  paused = false;
  await settle();
  busy = false; lastInput = performance.now();
  afterMove();
}
async function dinoPower(d) {
  cascade = 1;
  bigText(d.shout || POWERS[d.pow][0], true); if (d.snd) sfx[d.snd](); else sfx.roar(d.sz); maple.game.play('wag');
  const sum = cells => cells.reduce((s, [r, c]) => s + goalWorth(r, c), 0);
  const row = r => [...Array(COLS)].map((_, c) => [r, c]), col = c => [...Array(ROWS)].map((_, r) => [r, c]);
  const box = (r, c) => { const o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) o.push([r + dr, c + dc]); return o; };
  const idx = [0, 1, 2, 3, 4, 5, 6];
  if (d.pow === 'charge') {            // two rows, flattened
    const r0 = bestOf(idx, r => sum([...row(r), ...row(r + 1)]));
    cameo(d, -1.5, r0 + 1, COLS + 1.5, r0 + 1, 900);
    await wait(260); shake = 14; sfx.blast();
    await clearSet([...row(r0), ...row(r0 + 1)], [], [r0 + .5, -1]);
  } else if (d.pow === 'tail') {       // two columns, swept away
    const c0 = bestOf(idx, c => sum([...col(c), ...col(c + 1)]));
    cameo(d, c0 + 1, -1.5, c0 + 1, ROWS + 1.5, 900);
    await wait(260); shake = 14; sfx.blast();
    await clearSet([...col(c0), ...col(c0 + 1)], [], [-1, c0 + .5]);
  } else if (d.pow === 'stomp') {      // two giant footprints
    const spots = []; for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) spots.push([r, c]);
    const a = bestOf(spots, ([r, c]) => sum(box(r, c)));
    const b = bestOf(spots.filter(([r, c]) => Math.abs(r - a[0]) >= 3 || Math.abs(c - a[1]) >= 3), ([r, c]) => sum(box(r, c)));
    for (const [r, c] of [a, b]) {
      cameo(d, c + .5, r - 3, c + .5, r + .3, 420, 2.8, 0);
      await wait(340); shake = 16; sfx.blast(); fireFx('bomb2', r, c, '#ffd9a0');
      await clearSet(box(r, c), [], [r, c]);
    }
  } else if (d.pow === 'roar') {       // every piece of the kind that helps most
    const by = Array(6).fill(0), cells = [...Array(6)].map(() => []);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = colorOf(grid[r][c]); if (k >= 0) { by[k] += goalWorth(r, c); cells[k].push([r, c]); } }
    const pick = bestOf([0, 1, 2, 3, 4, 5], k => by[k]);
    cameo(d, COLS / 2, ROWS / 2, COLS / 2, ROWS / 2, 1000, 4.4, 0, true);
    ring(COLS / 2 - .5, ROWS / 2 - .5, 3, '#fff', 500);
    await wait(480); shake = 20; flash(); ring(COLS / 2 - .5, ROWS / 2 - .5, 5, GEM_COL[pick], 700);
    await clearSet(cells[pick], [], [ROWS / 2, COLS / 2]);
  } else if (d.pow === 'pack') {       // three hunters, three blasters
    cameo(d, -1.5, 2.5, COLS + 1.5, 2.5, 800, 1.9, 6); cameo(d, COLS + 1.5, 5.5, -1.5, 5.5, 800, 1.9, 6);
    const pool = plainGems(64).map(([r, c]) => { const h = sum(row(r)), v = sum(col(c)); return { r, c, sp: h >= v ? 'h' : 'v', w: Math.max(h, v) + Math.random() }; }).sort((p, q) => q.w - p.w);
    const ps = [];
    for (const p of pool) { if (ps.length >= 3) break; if (ps.some(o => (o.sp === p.sp) && (p.sp === 'h' ? o.r === p.r : o.c === p.c))) continue; ps.push(p); }
    for (const p of ps) { const k = grid[p.r][p.c]; k.sp = p.sp; k.s = 1.6; tween(k, { s: 1 }, 260, E.back); ring(p.c, p.r, 1, '#ffd34d', 300); sfx.special(); await wait(140); }
    await wait(280);
    if (ps.length) await clearSet(ps.map(p => [p.r, p.c]));
  } else if (d.pow === 'swoop') {      // a big X, wherever it does the most good
    const diag = (r, c) => { const o = [[r, c]]; for (let i = 1; i < 8; i++) o.push([r - i, c - i], [r + i, c + i], [r - i, c + i], [r + i, c - i]); return o.filter(([y, x]) => inB(y, x)); };
    const spots = []; for (let r = 2; r < ROWS - 2; r++) for (let c = 2; c < COLS - 2; c++) spots.push([r, c]);
    const [r, c] = bestOf(spots, ([y, x]) => sum(diag(y, x)));
    cameo(d, c - 5.5, r - 5.5, c + 6.5, r + 6.5, 700, 2.3, 0);
    await wait(300); shake = 12; sfx.blast(); ring(c, r, 2.5, '#fff', 450);
    await clearSet(diag(r, c), [], [r, c]);
  }
}

async function win() {
  ended = true; busy = true;
  if (timed) { moves = Math.min(10, Math.floor(timeLeft / 4)); timed = false; timeLeft = 0; }
  sfx.win(); maple.game.play('wag');
  bigText('Goal reached!', true);
  await wait(1100);
  if (moves > 0) {
    bigText(LV.T.bonus, true);
    await wait(500);
    while (moves > 0) {
      const pool = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = grid[r][c]; if (k && k.kind === 'gem' && !k.sp && !k.amber) pool.push(k); }
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
  if (LV.stage === 0) save.unlocked = Math.max(save.unlocked, Math.min(STAGES[0].n, LV.idx + 2));
  persist();
  const icons = { hammer: '🔨', shuffle: '🔀', paw: '💥' };
  const last = LV.num === STAGES[LV.stage].n;
  const d = LV.dino, fresh = d && prev === 0;   // first star on a Dino Dig level puts its dinosaur in the journal
  const result = () => {
  modal(`
    <h2>${last ? 'You did it!' : 'Level clear!'}</h2>
    <div class="big-stars"><span>★</span><span>★</span><span>★</span></div>
    <p style="font-size:26px;font-weight:900">${score.toLocaleString()}</p>
    ${reward.length ? `<p>New stars earned you: <b style="font-size:22px">${reward.map(k => icons[k]).join(' ')}</b></p>` : ''}
    ${d ? `<div class="dyk"><img src="${SRC['p_' + d.id]}"><span>${fresh ? `<b>${d.name}</b> is in your Field Journal.` : `<b>${d.name}:</b> ${d.fact}`}</span></div>` : ''}
    ${last ? `<p>${LV.T.done}</p>` : ''}
    <div class="btns">
      ${last ? '' : '<button class="btn" data-a="next">Next level ›</button>'}
      <button class="btn alt" data-a="retry">Play again</button>
      <button class="btn alt" data-a="map">Level map</button>
    </div>`, {
    next: () => intro(LV.idx + 1), retry: () => intro(LV.idx), map: () => showMap(),
  });
  const st = [...document.querySelectorAll('#card .big-stars span')];
  for (let i = 0; i < stars; i++) setTimeout(() => { st[i].classList.add('on'); sfx.star(i); }, 350 + i * 380);
  };
  if (fresh) discover(d, result); else result();
}

function lose() {
  ended = true;
  if (!extraUsed) {
    sfx.lose();
    const who = LV.T.helper;
    modal(`<h2>${timed ? "Time's up!" : 'Out of moves!'}</h2>
      <div class="goals-list">${goalChips()}</div>
      <p>${who} <b>${timed ? '15 extra seconds' : '5 extra moves'}</b>. Free, of course.</p>
      <div class="btns"><button class="btn" data-a="more">${timed ? '+15 seconds ⏱' : '+5 moves ' + LV.T.extra}</button><button class="btn alt" data-a="quit">Give up</button></div>`,
      { more: () => { extraUsed = true; ended = false; if (timed) timeLeft += 15; else moves += 5; updateHUD(); maple.game.play('wag'); }, quit: () => failed() });
  } else failed();
}
function failed() {
  sfx.lose();
  modal(`<h2>So close!</h2><div class="goals-list">${goalChips()}</div><p>${LV.T.fail}</p>
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
  await jackpots();
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
function shards(c, r, col = '#cdefff') {
  if (SPD < 1) return;
  for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3; fx.push({ t: 'p', x: c + .5, y: r + .5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 0, max: .7, col, size: .1 }); }
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
function comboText(k) {
  bigText(LV.T.words[Math.min(k, 7)], k >= 5);
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
  const top = $('#top').offsetHeight + $('#goals').offsetHeight + $('#jack').offsetHeight + 120 + 34;
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
  if ($('#game').classList.contains('on')) {
    draw(t, dt); hintTick(t);
    // Happy Hour clock: runs from her first move, stops for the slot machine and any pop-up
    if (timed && timeStarted && !ended && !paused && SPD >= 1 && !$('#modal').classList.contains('on')) {
      const before = Math.ceil(timeLeft);
      timeLeft = Math.max(0, timeLeft - dt);
      const now = Math.ceil(timeLeft);
      if (now !== before) { updateHUD(); if (now <= 5 && now > 0) sfx.tick(); }
      if (timeLeft <= 0 && !busy) afterMove();
    }
  }
  for (const v of Object.values(maple)) v.tick(t);
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
  const tiles = LV.T.tiles;
  if (tiles === 'bulb') drawLights(t, S);
  if (tiles === 'dirt') drawDirt(t, S);
  // ice under-glow (tile tint)
  if (tiles === 'ice') for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (ice[r][c]) {
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
  if (tiles === 'ice') for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (ice[r][c]) {
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

// Vegas bulbs sit UNDER the pieces: dark = off, pink dashes = one more match, gold glow = lit.
function drawLights(t, S) {
  if (!LV.ice) return;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!(+LV.ice[r][c])) continue;
    const x = c * S + 1.5 * dpr, y = r * S + 1.5 * dpr, w = S - 3 * dpr, v = ice[r][c];
    if (v === 0) {
      const pulse = .78 + Math.sin(t / 320 + r * 1.3 + c * .7) * .22;
      ctx.fillStyle = `rgba(255,205,70,${.6 * pulse})`; rr(x, y, w, w, S * .18); ctx.fill();
      ctx.strokeStyle = `rgba(255,244,190,${.95 * pulse})`; ctx.lineWidth = 2.5 * dpr; ctx.stroke();
    } else {
      ctx.fillStyle = v === 2 ? 'rgba(6,3,16,.9)' : 'rgba(40,14,70,.85)'; rr(x, y, w, w, S * .18); ctx.fill();
      ctx.strokeStyle = v === 2 ? 'rgba(130,120,165,.9)' : 'rgba(255,120,210,.85)'; ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([3 * dpr, 4 * dpr]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = v === 2 ? '#6b6485' : '#ff9ad8';
      const d = w * .16;
      for (const [bx, by] of [[x + d, y + d], [x + w - d, y + d], [x + d, y + w - d], [x + w - d, y + w - d]]) { ctx.beginPath(); ctx.arc(bx, by, 2.2 * dpr, 0, 7); ctx.fill(); }
    }
  }
}

// Dino dirt sits UNDER the pieces like the bulbs do: brown soil = one dig, grey rock = two, pale sand = dug out.
// A fossil shows through wherever its dirt is gone, and lifts out once every tile of it is clear.
function drawDirt(t, S) {
  if (!LV.ice) return;
  const U = LV.T.under || {};
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!(+LV.ice[r][c])) continue;
    const x = c * S + 1.5 * dpr, y = r * S + 1.5 * dpr, w = S - 3 * dpr, v = ice[r][c];
    if (v > 0) {
      const img = v === 2 ? IMG[sk('rock')] : IMG[sk('dirt')];
      ctx.save(); rr(x, y, w, w, S * .18); ctx.clip();
      if (img) ctx.drawImage(img, x, y, w, w); else { ctx.fillStyle = v === 2 ? '#6d6772' : '#7a4f2a'; ctx.fillRect(x, y, w, w); }
      ctx.restore();
      ctx.strokeStyle = U.edge ? U.edge[v - 1] : v === 2 ? 'rgba(210,205,220,.75)' : 'rgba(60,32,12,.9)'; ctx.lineWidth = 2 * dpr; rr(x, y, w, w, S * .18); ctx.stroke();
    } else {
      ctx.fillStyle = U.clear ? U.clear[(r * 3 + c) % U.clear.length] : 'rgba(255,224,160,.2)'; rr(x, y, w, w, S * .18); ctx.fill();
    }
  }
  for (const f of fossils) {
    if (f.found) continue;
    const open = f.cells.filter(([r, c]) => ice[r][c] === 0); if (!open.length) continue;
    const pulse = .55 + Math.sin(t / 260 + f.r) * .2;
    ctx.save(); ctx.beginPath();
    for (const [r, c] of open) ctx.rect(c * S + 1.5 * dpr, r * S + 1.5 * dpr, S - 3 * dpr, S - 3 * dpr);
    ctx.clip();
    ctx.fillStyle = `rgba(255,240,200,${.35 * pulse})`; ctx.fillRect(f.c * S, f.r * S, f.w * S, f.h * S);
    const img = IMG['f_' + f.id]; if (img) ctx.drawImage(img, f.c * S, f.r * S, f.w * S, f.h * S);
    ctx.restore();
    ctx.strokeStyle = `rgba(255,240,200,${pulse})`; ctx.lineWidth = 2 * dpr;
    for (const [r, c] of open) { rr(c * S + 1.5 * dpr, r * S + 1.5 * dpr, S - 3 * dpr, S - 3 * dpr, S * .18); ctx.stroke(); }
  }
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
  const img = k.kind === 'bone' ? IMG[sk('bone')] : k.kind === 'box' ? IMG[sk(k.hp > 1 ? 'box' : 'tikibox')] : k.kind === 'egg' ? IMG[sk(k.hp > 1 ? 'egg' : 'egg2')]
    : k.sp === 'prism' ? IMG[LV.T.prism] : IMG[LV.pc[k.c]];
  if (k.sp === 'prism') {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t / 300) * .25);
    if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  } else if (k.kind !== 'gem') {
    const bob = Math.sin(t / 250 + k.id) * S * .04;
    const z = k.kind === 'box' && k.hp <= 1 && sk('tikibox') === 'tikibox' ? size * 1.7 : size;   // Tiki's own sprite is small inside its frame
    if (img) ctx.drawImage(img, cx - z / 2, cy - z / 2 + bob - (z - size) * .12, z, z);
  } else if (img) ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  else { ctx.fillStyle = GEM_COL[k.c] || '#fff'; ctx.beginPath(); ctx.arc(cx, cy, size * .35, 0, 7); ctx.fill(); }
  if (k.amber) {   // a blob of amber over the piece, with a slow glint
    const a = Math.max(0, k.a), z = size * 1.08, blob = IMG[sk('amberblob')];
    ctx.globalAlpha = a * say('amberA', .5); if (blob) ctx.drawImage(blob, cx - z / 2, cy - z / 2, z, z);
    ctx.globalAlpha = a * (.5 + Math.sin(t / 300 + k.id) * .25); ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.arc(cx, cy, S * .4 * sc, -2.4, -1.2); ctx.stroke();
    ctx.globalAlpha = a;
  }
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
    } else if (f.t === 'dino') {   // a dinosaur crossing the board
      const img = f.frames && f.frames.length ? f.frames[Math.floor(f.life * 12) % f.frames.length] : f.img;
      const hop = f.hops ? Math.abs(Math.sin(p * Math.PI * f.hops)) * S * .22 : 0;
      const z = f.size * S * (f.pulse ? .7 + E.out(Math.min(1, p * 2.5)) * .3 + Math.sin(p * 40) * .03 : 1);
      ctx.globalAlpha = p < .12 ? p / .12 : p > .85 ? (1 - p) / .15 : 1;
      ctx.save(); ctx.translate((f.x1 + (f.x2 - f.x1) * p) * S, (f.y1 + (f.y2 - f.y1) * p) * S - hop); if (f.flip) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      if (img) ctx.drawImage(img, -z / 2, -z / 2, z, z);
      ctx.restore();
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
// The game asks every mascot for the same four moods; each pet answers with the animation it has.
const ALIAS = {
  whiskey: { idle: 'loaf', pant: 'yawn', wag: 'swat', jump: 'jump' },
  tiki: { idle: 'stand', pant: 'stand', wag: 'swat', jump: 'jump' },
  sprout: { idle: 'idle', pant: 'eat', wag: 'roar', jump: 'jump' },                                  // beside the board, turned toward it
  sproutf: { idle: 'fidle', pant: 'feat', wag: 'froar', jump: 'fjump', roar: 'froar', eat: 'feat', sleep: 'fsleep' },   // on the map, facing her
};
const MIRROR = { whiskey: true, tiki: true };   // the cats are drawn flipped so they face the board; Maple is never mirrored
// What each pet does when it is tapped, in turn.
const REACT = { maple: ['wag', 'jump', 'pant'], whiskey: ['swat', 'yawn', 'jump'], tiki: ['swat', 'jump'], sprout: ['roar', 'eat', 'jump', 'sleep'], sproutf: ['roar', 'eat', 'jump', 'sleep'] };
class MapleView {
  constructor(canvas) { this.cv = canvas; this.cx = canvas.getContext('2d'); this.who = 'maple'; this.home = 'idle'; this.anim = 'idle'; this.f = 0; this.nt = 0; this.once = false; this.link = null; }
  res(name) { const a = ALIAS[this.who]; return (a && a[name]) || name; }
  set(who, home = 'idle') { this.who = who; this.home = home; this.anim = this.res(home); this.f = 0; this.once = false; this.nt = 0; }
  play(name) {
    if (this.link) this.link.play(name);
    const n = this.res(name), fr = FR[this.who] && FR[this.who][n];
    if (!fr || !fr.length) return;
    this.anim = n; this.f = 0; this.once = n !== this.res(this.home);
    this.loops = this.who === 'maple' && (name === 'wag' || name === 'pant') ? 2 : this.who !== 'maple' && name === 'wag' ? 2 : 1;
  }
  tick(t) {
    if (!this.cv.offsetParent) return;
    let fr = FR[this.who] && FR[this.who][this.anim]; if (!fr || !fr.length) return;
    if (t > this.nt) {
      this.nt = t + (this.anim === 'jump' ? 85 : this.anim === 'loaf' ? 190 : /sleep/.test(this.anim) ? 170 : 120);
      this.f++;
      if (this.f >= fr.length) { this.f = 0; if (this.once && --this.loops <= 0) { this.anim = this.res(this.home); this.once = false; fr = FR[this.who][this.anim] || fr; } }
      const img = fr[this.f % fr.length], x = this.cx;
      x.imageSmoothingEnabled = false; x.clearRect(0, 0, 64, 64);
      if (!img) return;
      if (!MIRROR[this.who]) x.drawImage(img, 0, 0, 64, 64);   // Maple is never mirrored
      else { x.save(); x.translate(64, 0); x.scale(-1, 1); x.drawImage(img, 0, 0, 64, 64); x.restore(); }   // the cats face the board
    }
  }
}
const maple = {
  game: new MapleView($('#game-maple')), map: new MapleView($('#map-maple')),
  buddy: new MapleView($('#game-buddy')), mapBuddy: new MapleView($('#map-buddy')),
};
maple.game.link = maple.buddy;
function setMascots(stage) {
  const T = STAGES[stage], [pet, buddy] = T.pets;
  maple.game.set(pet, 'idle'); maple.map.set(T.mapPet || pet, T.mapHome);
  if (buddy) { maple.buddy.set(buddy); maple.mapBuddy.set(buddy); }
  $('#game-buddy').hidden = $('#map-buddy').hidden = !buddy;
}
// One place that dresses the whole page for a stage: background, colours, pets.
function setStage(stage, era = 0) {
  STAGES.forEach((s, i) => document.body.classList.toggle(s.id, i === stage));
  document.body.dataset.era = STAGES[stage].id === 'dino' ? era : '';
  setMascots(stage);
}
// Tap a pet and it answers.
function petTap(view) {
  ac(); view.tapN = (view.tapN || 0) + 1;
  const list = REACT[view.who] || ['jump'], a = list[view.tapN % list.length];
  view.play(a);
  if (/sprout/.test(view.who)) { if (a === 'roar') sfx.roar(0); else if (!/sleep/.test(a)) sfx.chirp(); }
  else if (view.who === 'maple') sfx.yip(); else sfx.meow();
}
$('#map-maple').onclick = () => petTap(maple.map);
$('#map-buddy').onclick = () => petTap(maple.mapBuddy);
$('#game-buddy').onclick = () => petTap(maple.buddy);
$('#game-maple').onclick = () => { if (callMeter() && jackMeter >= jackNeed && !busy && !ended) { ac(); fireRoar(); } else { const l = maple.game.link; maple.game.link = null; petTap(maple.game); maple.game.link = l; } };
$('#jack').onclick = () => { ac(); fireRoar(); };

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
function goalIcon(g, L = LV) {
  const T = L.T;
  if (g.t === 'color') return SRC[L.pc[g.c]];
  if (g.t === 'bone') return SRC[skOf(T, 'bone')];
  if (g.t === 'box') return SRC[skOf(T, g.hp > 1 ? 'box' : 'tikibox')];
  if (g.t === 'ice') return SRC[T.tileIcon];
  if (g.t === 'fossil') return SRC.skull;
  if (g.t === 'egg') return SRC[skOf(T, 'egg')];
  if (g.t === 'amber') return SRC[skOf(T, 'amber')];
  return SRC[T.scoreIcon];
}
const COUNTED = { bone: 1, box: 1, fossil: 1, egg: 1, amber: 1 };   // goals shown as "2/5" rather than a countdown
function goalLabel(g) {
  if (g.t === 'score') return Math.max(0, g.n - score).toLocaleString();
  if (COUNTED[g.t]) return `${g.have}/${g.n}`;
  return Math.max(0, g.n - g.have);
}
function buildGoals() {
  $('#goals').innerHTML = goals.map((g, i) => `<div class="goal box" id="goal${i}"><img src="${goalIcon(g)}"><span></span></div>`).join('');
}
function goalChips() {
  return goals.map(g => `<div class="goal box ${goalDone(g) ? 'done' : ''}"><img src="${goalIcon(g)}"><span>${goalDone(g) ? '✓' : (g.t === 'score' ? g.n.toLocaleString() : COUNTED[g.t] ? g.have + '/' + g.n : g.n)}</span></div>`).join('');
}
function bumpGoal(g) {
  const el = document.getElementById('goal' + goals.indexOf(g)); if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function updateHUD() {
  $('#moves').textContent = timed ? Math.ceil(timeLeft) : moves;
  $('#moves').classList.toggle('low', (timed ? timeLeft <= 10 : moves <= 3) && !ended);
  $('#moveslbl').textContent = timed ? 'secs' : 'moves';
  $('#score').textContent = score.toLocaleString();
  $('#lvlname').textContent = `Level ${LV.num}${LV.name ? ' · ' + LV.name : ''}`;
  updateJack();
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
  $('#tip').textContent = boosterMode === 'hammer' ? 'Tap a piece to smash it' : boosterMode === 'paw' ? 'Tap a spot to blast a 5×5 area'
    : timed && !timeStarted && !ended ? 'The clock starts on your first move' : '';
}

/* ================= screens / modal ================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
function modal(html, actions = {}) {
  const m = $('#modal'); $('#card').innerHTML = html; m.classList.add('on');
  $('#card').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { ac(); sfx.tap(); m.classList.remove('on'); (actions[b.dataset.a] || (() => { }))(); });
}
function totalStars() { return Object.values(save.stars).reduce((a, b) => a + b, 0); }
const CHEST_EVERY = 9;
// A level is open if it starts its stage, the one before it has a star, or (Crystal Cave) the old save says so.
const isOpen = i => i === STAGES[stageOf(i)].start || (save.stars[i - 1] || 0) > 0 || (stageOf(i) === 0 && i < save.unlocked);
function showMap() {
  show('map'); ended = true;
  const stg = STAGES[save.stage] ? save.stage : 0, T = STAGES[stg], dino = T.id === 'dino';
  // In Dino Dig the map sits in whichever era she has dug down to.
  let era = 0;
  if (dino) for (const d of DINOS) if (isOpen(dinoLevel(d))) era = d.era;
  setStage(stg, era);
  $('#map .title').innerHTML = T.title;
  $('#stages').innerHTML = STAGES.map((s, i) => {
    const fresh = i > 0 && !Object.keys(save.stars).some(k => stageOf(+k) === i);
    return `<button data-s="${i}" class="${i === stg ? 'on' : ''}"><i>${s.btn[0]}</i>${s.btn[1]}${fresh ? '<span class="stage-new">NEW</span>' : ''}</button>`;
  }).join('');
  document.querySelectorAll('#stages button').forEach(b => b.onclick = () => { ac(); sfx.tap(); save.stage = +b.dataset.s; persist(); showMap(); $('#map').scrollTop = 0; });
  const ts = totalStars();
  $('#total-stars').textContent = `${ts} / ${LEVELS.length * 3}`;
  $('#bp-h').textContent = save.boost.hammer; $('#bp-s').textContent = save.boost.shuffle; $('#bp-p').textContent = save.boost.paw;
  const avail = Math.floor(ts / CHEST_EVERY) - save.chests;
  $('#chest-btn').hidden = avail <= 0;
  $('#chest-prog').textContent = `🎁 ${ts % CHEST_EVERY}/${CHEST_EVERY}★ to next treasure`;
  $('#sound-btn').textContent = save.sound ? '🔊 Sound on' : '🔇 Sound off';
  $('#dex-btn').hidden = !dino;
  $('#dex-btn').innerHTML = `<img src="art/dino/journal.png" alt="">Field Journal <b>${DINOS.filter(hasDino).length}/${DINOS.length}</b>`;
  mapExtras(dino);
  const lv = $('#levels'); lv.innerHTML = '';
  let curSet = false, lastEra = -1;
  LEVELS.forEach((L, i) => {
    if (stageOf(i) !== stg) return;
    const d = L.d ? DINO[L.d] : null;
    if (d && d.era !== lastEra) {   // Dino Dig is a walk through time: a signpost at the start of each era
      lastEra = d.era;
      lv.insertAdjacentHTML('beforeend', `<div class="era"><b>${ERAS[d.era].id}</b><span>${ERAS[d.era].span}</span></div>`);
    }
    const b = document.createElement('button');
    const st = save.stars[i] || 0, locked = !isOpen(i), cur = !locked && !st && !curSet;
    if (cur) curSet = true;
    const label = d && st ? `<img src="${SRC['p_' + d.id]}" alt="${d.name}">`   // a level she has finished shows the dinosaur she found there
      : L.name && L.name.includes('♥') ? '♥' : L.time ? '⏱' : i - T.start + 1;
    b.className = 'lv' + (locked ? ' lock' : st ? ' done' : '') + (cur ? ' cur' : '');
    b.innerHTML = locked ? '🔒' : `${label}<span class="stars">${[0, 1, 2].map(j => `<span class="${j < st ? '' : 'off'}">★</span>`).join('')}</span>`;
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
$('#howto-btn').onclick = () => { ac(); HOWTO[STAGES[save.stage] ? STAGES[save.stage].id : 'cave'](); };
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
function howtoVegas(after) {
  modal(`<h2>Vegas rules</h2><div class="howto">
    <div><span class="ic"><img src="art/vegas/seven.png"></span><b>Jackpot meter:</b> every piece you clear fills it. When it's full, Whiskey spins the slot machine. It always pays out.</div>
    <div><span class="ic"><img src="${BULB_SRC}"></span><b>Bulbs:</b> match on top of a dark tile to light it up. Light them all.</div>
    <div><span class="ic"><img src="art/tiki/box.png"></span><b>Tiki's boxes:</b> make a match right next to a box to let her out. Boxes with a ribbon need two.</div>
    <div><span class="ic"><img src="art/vegas/clock.png"></span><b>Happy Hour:</b> no move limit, just a clock. Go fast.</div>
    <div><span class="ic"><img src="art/vegas/disco.png"></span>Blasters, bombs and boosters work the same. The disco ball is the Vegas prism.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Let's roll!</button></div>`, { ok: after || (() => { }) });
}
function howtoDino(after) {
  modal(`<h2>Dino Dig rules</h2><div class="howto">
    <div><span class="ic"><img src="art/dino/skull.png"></span><span><b>Fossils</b> are buried under the dirt. Match on top of dirt to dig. Uncover every tile of a fossil to lift it out. Grey rock takes two digs.</span></div>
    <div><span class="ic"><img src="art/dino/egg.png"></span><span><b>Eggs:</b> match right beside one to crack it, and again to hatch it. The hatchling clears its whole row on the way out.</span></div>
    <div><span class="ic"><img src="art/dino/amber.png"></span><span><b>Amber:</b> a piece stuck in amber can't be moved. Match it where it sits to set it free.</span></div>
    <div><span class="ic"><img src="art/sprout/fidle_0.png"></span><span><b>Roar meter:</b> clearing pieces fills it. When it's full, tap it (or Sprout) and a dinosaur from your journal charges in.</span></div>
    <div><span class="ic"><img src="art/dino/journal.png"></span><span>Every level you finish adds a real dinosaur to your <b>Field Journal</b>. Pick your favourite there to answer the Roar.</span></div>
    <div><span class="ic"><img src="art/dino/meteor.png"></span>Blasters, bombs and boosters work the same. The meteor is the Dino Dig prism.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Let's dig!</button></div>`, { ok: after || (() => { }) });
}
function howtoGolf(after) {
  modal(`<h2>Golf Classic rules</h2><div class="howto">
    <div><span class="ic"><img src="art/golf/gf_tuft.png"></span><span><b>Rough and sand:</b> match on top of long grass to trim it. Sandy bunkers take two. Tidy the whole course.</span></div>
    <div><span class="ic"><img src="art/golf/gf_ball.png"></span><span><b>Golf balls:</b> clear the pieces underneath to roll a ball down to the bottom row. That's a putt sunk.</span></div>
    <div><span class="ic"><img src="art/golf/gf_mound.png"></span><span><b>Gophers:</b> match right beside a gopher hill, twice. The gopher scampers off and clears its whole row on the way.</span></div>
    <div><span class="ic"><img src="art/maple/idle_0.png"></span><span><b>Swing meter:</b> clearing pieces fills it. When it's full, tap it (or Maple) for her next shot: a long drive, a bunker blast, then a birdie.</span></div>
    <div><span class="ic"><img src="art/vegas/clock.png"></span><span><b>Speed Golf:</b> no move limit, just a clock.</span></div>
    <div><span class="ic"><img src="art/golf/gf_umbrella.png"></span>Blasters, bombs and boosters work the same. The golf umbrella is the prism here.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Tee off!</button></div>`, { ok: after || (() => { }) });
}
function howtoPark(after) {
  modal(`<h2>Pet Park rules</h2><div class="howto">
    <div><span class="ic"><img src="art/park/pk_print.png"></span><span><b>Muddy paws:</b> match on top of a muddy tile to clean it. Deep puddles take two.</span></div>
    <div><span class="ic"><img src="art/tiki/box.png"></span><span><b>Tiki's boxes:</b> she is hiding again. Match right next to a box to let her out. Ribbons take two.</span></div>
    <div><span class="ic"><img src="art/bone.png"></span><span><b>Golden bones:</b> drop them to the bottom row, just like in the Crystal Cave.</span></div>
    <div><span class="ic"><img src="art/park/pk_bubble.png"></span><span><b>Bubbles:</b> a piece in a bubble can't be moved. Match it where it floats to pop it.</span></div>
    <div><span class="ic"><img src="art/park/pk_treat.png"></span><span><b>Treat meter:</b> clearing pieces fills it. When it's full, tap it (or Maple) and the crew pitches in: Whiskey's zoomies, Maple's digging, then Tiki's pounce.</span></div>
    <div><span class="ic"><img src="art/park/pk_frisbee.png"></span>Blasters, bombs and boosters work the same. The rainbow frisbee is the prism here.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Walkies!</button></div>`, { ok: after || (() => { }) });
}
function howtoHome(after) {
  modal(`<h2>Maple Grove rules</h2><div class="howto">
    <div><span class="ic"><img src="art/home/hm_quilt.png"></span><span><b>The quilt:</b> match on top of a bare patch to stitch it in. Knotted patches take two. Finish the whole quilt.</span></div>
    <div><span class="ic"><img src="art/home/hm_tin.png"></span><span><b>Biscuit tins:</b> match right next to a tin to pop the lid. Tins tied with string take two.</span></div>
    <div><span class="ic"><img src="art/home/hm_tangle.png"></span><span><b>Whiskey's yarn:</b> a tangled piece can't be moved. Match it where it sits to untangle it.</span></div>
    <div><span class="ic"><img src="art/home/hm_card.png"></span><span><b>Bingo meter:</b> clearing pieces fills it. When it's full, tap it (or Whiskey) and shout BINGO: two lines, four corners, then a full house.</span></div>
    <div><span class="ic"><img src="art/vegas/clock.png"></span><span><b>Dance Night:</b> no move limit, just a clock.</span></div>
    <div><span class="ic"><img src="art/home/hm_ball.png"></span>Blasters, bombs and boosters work the same. The lucky bingo ball is the prism here.</div>
  </div><div class="btns"><button class="btn" data-a="ok">Eyes down!</button></div>`, { ok: after || (() => { }) });
}
const HOWTO = { cave: howto, vegas: howtoVegas, dino: howtoDino, golf: howtoGolf, park: howtoPark, home: howtoHome };
function intro(i) {
  const L = levelDef(i), T = L.T, d = L.dino, known = d && hasDino(d), plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const chips = L.goals.map(g => `<div class="goal box"><img src="${goalIcon(g, L)}"><span>${g.t === 'score' ? g.n.toLocaleString() : g.t === 'ice' ? 'all' : g.n}</span></div>`).join('');
  const words = L.goals.map(g => T.goal && T.goal[g.t] ? T.goal[g.t](g.n, g.hp)
    : g.t === 'score' ? `Score ${g.n.toLocaleString()}`
    : g.t === 'color' ? `Collect ${g.n} ${L.words[g.c]}`
    : g.t === 'bone' ? `Bring ${g.n} golden bone${g.n > 1 ? 's' : ''} down to the bottom row`
    : g.t === 'box' ? `Let Tiki out of ${g.n} box${g.n > 1 ? 'es' : ''}${g.hp > 1 ? ' (two knocks each)' : ''}`
    : g.t === 'fossil' ? `Dig up ${plural(g.n, 'fossil')}`
    : g.t === 'egg' ? `Hatch ${plural(g.n, 'egg')}`
    : g.t === 'amber' ? `Free ${plural(g.n, 'piece')} from amber`
    : T.tileGoal).join(' · ');
  // Dino Dig: who is buried here? A silhouette and a clue until she finds out.
  const who = d ? `<div class="who ${known ? '' : 'unk'}"><img src="${SRC['p_' + d.id]}"><div><b>${known ? d.name : 'Who is buried here?'}</b><span>${known ? d.when : ERAS[d.era].id + ' clue: ' + d.clue}</span></div></div>` : '';
  const go = () => modal(`<h2>Level ${L.num}</h2>${L.name ? `<p style="color:#ff9ad8;font-weight:900;font-size:20px">${L.name}</p>` : ''}${who}
    <div class="goals-list">${chips}</div><p>${words}</p><p style="opacity:.7">${L.time ? `${L.time} seconds · no move limit` : `${L.moves} moves`}</p>
    <div class="btns"><button class="btn" data-a="go">Play</button><button class="btn alt" data-a="back">Back</button></div>`,
    { go: () => startLevel(i), back: () => { } });
  if (T.seen && !save[T.seen]) { save[T.seen] = true; save.seenHowto = true; persist(); HOWTO[T.id](go); }
  else if (!save.seenHowto) { save.seenHowto = true; persist(); howto(go); } else go();
}

/* ================= Dino Dig: the Field Journal ================= */
function dinoCard(d) {
  return `<button class="dexpic" id="dexpic"><img src="${SRC['p_' + d.id]}" alt=""></button><div class="taphint">tap to say hello</div>
    <h2>${d.name}</h2><p class="say">${d.say}${d.means ? ` · “${d.means}”` : ''}</p>
    <div class="facts"><div><b>When</b><span>${d.when}</span></div><div><b>Ate</b><span>${d.diet}</span></div><div><b>Size</b><span>${d.size}</span></div></div>
    <p class="fact">${d.fact}</p>`;
}
// The portrait answers when tapped: its own move, its own voice.
function wirePortrait(d) {
  const el = $('#dexpic'); if (!el) return; let n = 0;
  el.onclick = () => {
    ac(); sfx.roar(d.sz);
    el.className = 'dexpic'; void el.offsetWidth; el.classList.add(n++ % 2 ? 'a-hop' : 'a-' + d.pow);
  };
}
function discover(d, after) {
  sfx.fossil();
  modal(`<p class="newdino">★ New dinosaur discovered ★</p>${dinoCard(d)}<div class="btns"><button class="btn" data-a="ok">Into the journal!</button></div>`, { ok: after });
  wirePortrait(d);
  const el = $('#dexpic'); el.classList.add('a-reveal');
  setTimeout(() => { if ($('#dexpic') === el) sfx.roar(d.sz); }, 650);
}
function showDex() {
  show('dex'); ended = true; setStage(DINO_STAGE, document.body.dataset.era || 0);
  const mine = buddyDino(), el = $('#dex-list');
  $('#dex-count').textContent = `${DINOS.filter(hasDino).length} of ${DINOS.length} discovered`;
  el.innerHTML = ERAS.map((e, ei) => `<div class="era"><b>${e.id}</b><span>${e.span}</span><i>${e.note}</i></div><div class="dexgrid">${
    DINOS.filter(d => d.era === ei).map(d => { const has = hasDino(d); return `<button class="dx${has ? '' : ' unk'}${mine === d ? ' mine' : ''}" data-d="${d.id}"><img src="${SRC['p_' + d.id]}" alt=""><span>${has ? d.name : '???'}</span></button>`; }).join('')}</div>`).join('');
  el.querySelectorAll('.dx').forEach(b => b.onclick = () => { ac(); sfx.tap(); dexCard(DINO[b.dataset.d]); });
  $('#dex').scrollTop = 0;
}
function dexCard(d) {
  if (!hasDino(d)) {
    modal(`<div class="dexpic unk"><img src="${SRC['p_' + d.id]}" alt=""></div><h2>???</h2><p>Still buried.</p><p><b>Clue:</b> ${d.clue}</p>
      <p style="opacity:.7">Finish level ${d.n + 1} to dig it up.</p><div class="btns"><button class="btn alt" data-a="ok">Close</button></div>`, { ok: () => { } });
    return;
  }
  const mine = buddyDino() === d, [pn, pd] = POWERS[d.pow];
  modal(`${dinoCard(d)}<p class="pow">Roar power · <b>${pn}</b> ${pd}</p><div class="btns">
    ${mine ? '<button class="btn alt" data-a="ok">✓ Answers your Roar</button>' : '<button class="btn" data-a="pick">Answer my Roar</button>'}
    <button class="btn alt" data-a="ok">Close</button></div>`,
    { pick: () => { save.buddy = d.id; persist(); sfx.roar(d.sz); showDex(); }, ok: () => { } });
  wirePortrait(d);
}
$('#dex-btn').onclick = () => { ac(); sfx.tap(); showDex(); };
$('#dex-back').onclick = () => { ac(); sfx.tap(); showMap(); };

// Little surprises on the Dino Dig map: a mystery egg that turns up once a day, and a shooting star to wish on.
let eggTaps = 0;
function mapExtras(dino) {
  const today = new Date().toDateString();
  eggTaps = 0; $('#gift-egg').className = '';
  $('#gift-egg').hidden = !(dino && save.eggDay !== today);
  $('#shoot').hidden = !dino;
}
$('#gift-egg').onclick = () => {
  ac(); const el = $('#gift-egg');
  if (++eggTaps < 3) { sfx.crack(); el.className = ''; void el.offsetWidth; el.className = 'wob'; return; }
  const k = ['hammer', 'shuffle', 'paw'][Math.floor(Math.random() * 3)];
  save.eggDay = new Date().toDateString(); save.boost[k]++; persist(); sfx.hatch(); maple.map.play('jump');
  modal(`<h2>It hatched!</h2><img src="art/dino/hatch.png" alt="" style="width:128px;height:128px;image-rendering:pixelated"><p style="font-size:36px;margin:0">${{ hammer: '🔨', shuffle: '🔀', paw: '💥' }[k]}</p><p>A little present from Sprout. A new mystery egg turns up every day.</p><div class="btns"><button class="btn" data-a="ok">Thank you, Sprout!</button></div>`, { ok: showMap });
};
$('#shoot').onclick = () => { ac(); sfx.prism(); const b = $('#banner'); b.innerHTML = '<span>Make a wish ✨</span>'; clearTimeout(bannerT); bannerT = setTimeout(() => b.innerHTML = '', 1150); };

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
  get state() { return { moves, score, goals, ended, busy, LV, timed, timeLeft, jackMeter, jackNeed }; },
  startLevel, findMoves, findMatches, trySwap, setSpeed: v => SPD = v, save, get grid() { return grid; }, get ice() { return ice; },
  LEVELS, STAGES, forceJack: id => { forceJack = id; jackMeter = jackNeed; }, jackpots, showMap, slotShow, JACK,
  // Dino Dig
  get fossils() { return fossils; }, fireRoar, fillRoar: () => { jackMeter = jackNeed; updateJack(); }, dinoPower, DINOS, DINO, levelDef, showDex, dexCard, discover, intro, persist,
  useBoosterAt, setBooster: k => { boosterMode = k; }, get shotN() { return shotN; }, P,
};
