/* js/art/pixel.js (INT-1 step 2, 2026-11-16): ART: every pixel-art graphic, drawn in code.
   Cut unchanged from the inline script in index.html (old lines 579 to 1372). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   ART - every graphic in the game is drawn here, in code, as pixel art.
   Each sprite is painted once onto a small offscreen canvas, outlined, and
   cached. The game then scales it up with smoothing off, so it stays crisp.
============================================================================ */
const SPR = {}, URLS = {};
const OUT = '#1b1410';
function newCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function hash(s){ let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ let s = (seed >>> 0) || 7; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shade(hex, f){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  if (f < 1){ r *= f; g *= f; b *= f; } else { r += (255-r)*(f-1); g += (255-g)*(f-1); b += (255-b)*(f-1); }
  return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, v|0)).toString(16).padStart(2,'0')).join('');
}
const painter = g => (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// A 1px dark outline round every opaque pixel: the classic tile look.
function outline(c, col = OUT){
  const g = c.getContext('2d'), w = c.width, h = c.height, a = g.getImageData(0, 0, w, h).data;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y*w + x)*4 + 3] > 40;
  g.fillStyle = col;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!op(x, y) && (op(x-1,y) || op(x+1,y) || op(x,y-1) || op(x,y+1))) g.fillRect(x, y, 1, 1);
  return c;
}
function whiteOf(c){
  const w = newCanvas(c.width, c.height), g = w.getContext('2d');
  g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return w;
}
function scaled(c, s){
  const o = newCanvas(c.width*s, c.height*s), g = o.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o;
}
function crop(c, pad = 1){
  const g = c.getContext('2d'), a = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++)
    if (a[(y*c.width + x)*4 + 3] > 0){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const o = newCanvas(x1 - x0 + 1 + pad*2, y1 - y0 + 1 + pad*2);
  o.getContext('2d').drawImage(c, pad - x0, pad - y0); return o;
}
function toURL(key, make, scale = 4){
  if (!URLS[key]){ try { URLS[key] = scaled(make(), scale).toDataURL(); } catch(e){ URLS[key] = ''; } }
  return URLS[key];
}

/* ---------------------------------------------------------------------------
   PALETTE
--------------------------------------------------------------------------- */
const C = {
  steel:'#9aa3ad', steelL:'#d3d9de', steelD:'#5f6870', gold:'#d4af37', goldD:'#8a6d1a',
  wood:'#8a5a2b', woodD:'#5a3a1a', leather:'#7a4f2a', boot:'#3a2a1c', bone:'#ece0c4', eye:'#1b1410'
};
/* PD-31 (Q31): one Orc look with variety: skin runs from flesh tones to green; Half-Orcs lighter. */
const SKIN = {
  HUMAN:['#e8b48a','#c98d5f','#8d5a3a','#f1c7a2'], SUN_ELF:['#f4dcb0'], GREY_ELF:['#d9d6cf'], DARK_ELF:['#6f6a86'],
  ORC:['#b98a62','#a08a56','#86944a','#6f9a3f'], GOBLIN:['#8db04a'], HOBGOBLIN:['#c9682e'], DWARF:['#e0a57a'], GNOME:['#efc19a'], HALFLING:['#e9b48c'],
  HALF_ELF:['#e6b993'], HALF_ORC:['#dcae86','#cfa77c','#c2a67e'], FIRBOLG:['#8fa2b8'], CAMBION:['#b8443a'], NEPHILIM:['#f3e2c4'], ZUHRI:['#4f9fb0']
};
const HAIRS = ['#2b1d12','#5a3a1e','#8a5a2b','#c9a24a','#d8d0c0','#7a2a1a','#1a1a24'];
const RACE_LOOK = {
  HUMAN:{}, SUN_ELF:{ears:'elf', hair:'#f0d070'}, GREY_ELF:{ears:'elf', hair:'#c8c8d8'}, DARK_ELF:{ears:'elf', hair:'#eeeeff'},
  ORC:{tusks:true, bulky:true, hair:'#1a1a14'}, GOBLIN:{ears:'big', short:true, hair:'#2a2414'}, HOBGOBLIN:{ears:'elf', hair:'#1a1410'},
  DWARF:{short:true, beard:true, bulky:true}, GNOME:{short:true, hair:'#e8e8e8', nose:true}, HALFLING:{short:true},
  HALF_ELF:{ears:'elf'}, HALF_ORC:{tusks:true}, FIRBOLG:{tall:true, bulky:true, beard:true, ears:'elf', hair:'#6a5a4a'},
  CAMBION:{horns:true, hair:'#1a1a24'}, NEPHILIM:{halo:true, hair:'#f0e0a0'}, ZUHRI:{hair:'#e8f4ff', marks:true}
};
const SPEC_LOOK = {
  SOLDIER:  {top:'#8f98a2', acc:'#7a3e26', head:'helmet', weapon:'spear', shield:true, shieldCol:'#7a3e26', legs:'#4e3e2e'},
  FOLK_HERO:{top:'#7a5a32', acc:'#4e6b2c', head:'hood', hood:'#4e6b2c', weapon:'bow', legs:'#4a3a24'},
  SCOUNDREL:{top:'#3a3a44', head:'hood', hood:'#24242c', mask:true, weapon:'dagger', legs:'#2a2a30'},
  CLERIC:   {top:'#ece4cf', acc:'#d4af37', robe:true, head:'circlet', weapon:'mace', hairStyle:'short'},
  MAGE:     {top:'#3f5ea8', acc:'#d4af37', robe:true, head:'wizard', hat:'#33508f', weapon:'staff', orb:'#9fe0ff'},
  WITCH:    {top:'#4a2f5e', acc:'#7ac05a', robe:true, head:'witch', hat:'#2a1a36', weapon:'staff', orb:'#9ae070'},
  PLAIN:    {top:'#8a6a4a', acc:'#5a4030', legs:'#4a3a2a'}
};
const ENEMY_LOOK = {
  levy:    {skin:'#8a9478', hair:'#3a3a2a', hairStyle:'messy', top:'#6b5a42', legs:'#4a3e2e', weapon:'pitchfork', eye:'#e04030'},
  brigand: {skin:'#d9a07a', hair:'#3a2414', top:'#7a5232', acc:'#9b2d24', head:'bandana', legs:'#4a3a2a', weapon:'club', beard:true},
  enforcer:{skin:'#e0aa84', hair:'#1a1a1a', top:'#3c3c48', acc:'#8c3a2e', head:'cap', legs:'#2a2a34', weapon:'sword', bulky:true},
  hobgob:  {skin:'#c9682e', hair:'#1a1410', ears:'elf', top:'#5e6e4a', head:'helmet', weapon:'spear', shield:true, shieldCol:'#8c3a2e', legs:'#3a3a2a'},
  raider:  {skin:'#b8443a', horns:true, hair:'#1a1a24', top:'#4a1e2a', acc:'#a03a5e', weapon:'twin', legs:'#2a1418', eye:'#ffd040'},
  phalanx: {skin:'#6f6a86', hair:'#eeeeff', ears:'elf', top:'#4e7a8c', head:'helmet', helm:'#7aa0b0', weapon:'spear', shield:'big', shieldCol:'#2e4a5a', legs:'#2e3a44'},
  warden:  {skin:'#e0a57a', hair:'#b0603a', short:true, bulky:true, beard:true, top:'#8f98a2', head:'helmet', weapon:'hammer', shield:true, shieldCol:'#6e5a3a', legs:'#5f6870'},
  ogre:    {skin:'#9a8a5a', hair:'#3a3020', hairStyle:'bald', bulky:true, tall:true, tusks:true, top:'#6a5236', legs:'#5a4630', weapon:'club', eye:'#f0c040'},
  vane:    {skin:'#e8b48a', hair:'#2b1d12', top:'#4a1e1e', acc:'#d4af37', cape:'#b4463a', head:'tricorn', weapon:'sword', legs:'#2a1a14', beard:true},
  devil:   {skin:'#5a2436', horns:true, top:'#3a1a24', acc:'#e0602a', head:'helmet', helm:'#3a2a30', weapon:'flame', bulky:true, tall:true, eye:'#ff8a2a', cape:'#5a1a1a', legs:'#2a1418'},
  renegade:{skin:'#c98d5f', hair:'#3a2a1a', top:'#6a5a44', acc:'#3a5a7a', head:'helmet', helm:'#7f8892', weapon:'sword', shield:true, shieldCol:'#3a5a7a', legs:'#3a3226', beard:true},
  goblinsniper:{skin:'#8db04a', hair:'#2a2414', ears:'big', short:true, top:'#5a4a2a', head:'hood', hood:'#4a3a24', weapon:'bow', legs:'#3a3020'},
  crossbow:{skin:'#e0aa84', hair:'#1a1a1a', top:'#4a4450', acc:'#8c3a2e', head:'cap', weapon:'xbow', legs:'#2a2a34'},
  arbalest:{skin:'#d9a07a', hair:'#5a3a1e', top:'#6a5a3a', acc:'#2a6a3a', head:'bandana', weapon:'xbow', legs:'#3a3020', beard:true},
  shadowhunter:{skin:'#6f6a86', hair:'#eeeeff', ears:'elf', top:'#2e3a4a', head:'hood', hood:'#1e2a3a', mask:true, weapon:'bow', legs:'#1e2430', cape:'#1e2a3a'},
  hedgewitch:{skin:'#c9a07a', hair:'#3a3a2a', top:'#4a6a3a', acc:'#a0c060', robe:true, head:'witch', hat:'#2a3a24', weapon:'staff', orb:'#9ae070'},
  battlemage:{skin:'#e8b48a', hair:'#1a1a1a', top:'#8a2a2a', acc:'#d4af37', robe:true, head:'wizard', hat:'#6a1a1a', weapon:'staff', orb:'#ff8a3a'},
  sapper:  {skin:'#efc19a', hair:'#e8e8e8', short:true, nose:true, beard:true, top:'#6a4a2a', acc:'#3a3a3a', head:'cap', weapon:'bomb', legs:'#3a2a1a'},
  tithepriest:{skin:'#6f6a86', hair:'#eeeeff', ears:'elf', top:'#3e3a5a', acc:'#9fd0f0', robe:true, head:'circlet', weapon:'staff', orb:'#bfe8ff'},
  orsolt:  {skin:'#8a9478', hair:'#3a3a2a', hairStyle:'bald', tall:true, top:'#4a4a3a', acc:'#c8c0a0', robe:true, head:'circlet', weapon:'staff', orb:'#c8f0a0', eye:'#e04030', cape:'#3a3a2a'},
  inquisitor:{skin:'#e8b48a', hair:'#1a1a1a', top:'#7a1e1e', acc:'#ece0c4', robe:true, head:'hood', hood:'#5a1414', weapon:'staff', orb:'#ff4a4a', cape:'#3a0a0a'},
  ilvaryn: {skin:'#6f6a86', hair:'#eeeeff', ears:'elf', tall:true, top:'#2e3a4e', acc:'#9fd0f0', head:'helmet', helm:'#9fb0c8', weapon:'sword', shield:'big', shieldCol:'#1e2a3e', cape:'#6a8aa8', capeTrim:'#d3d9de', legs:'#1e2430'}
};

/* ---------------------------------------------------------------------------
   THE HUMANOID - one generator draws every person in the game.
   Canvas 24 x 26. Facing right. Feet on row 24. Frames: 0 idle, 1 and 2
   walking, 3 attacking.
--------------------------------------------------------------------------- */
const HW = 24, HH = 26, AX = 11, AY = 17;

// Size record only (step 5 phase B): 3D figures draw from look/recipe, soft figPlaceholder reads w/h/ay, vo3 gates on truthy frames.
function humanoidSprite(key, look){
  if (SPR[key]) return SPR[key];
  return SPR[key] = {frames:[], white:[], ax:AX, ay:AY, w:HW, h:HH};
}
// Everyone is drawn from their Race, Specialty and sex, wearing the squad's
// equipped armour and carrying its weapons. Specialty marks stay on top:
// Soldiers wear helmets and carry the shield, Folk Heroes green hoods and the
// bow in hand, Scoundrels dark hoods and masks, Clerics white robes and a
// circlet, Mages and Witches their hats and staves.
const MELEE_ART = {spears:'spear', pikes:'pike', shortswords:'sword', greatswords:'greatsword'};
const RANGED_ART = {shortbows:'bow', longbows:'bow', crossbows:'xbow'};
function gearLook(p){ const g = (window.ARM && META && META.gear) ? ARM.loadoutOf(p) : ((META && META.gear) || {armour:'padded', melee:'spears', ranged:'shortbows', shield:'bucklers'}); return g; }   /* INDEX A30: a person's own squad's loadout */
function personLook(p, isLeader){
  const R = RACE_LOOK[p.race] || {}, S = SPEC_LOOK[p.spec] || SPEC_LOOK.PLAIN, h = hash(p.name + ':' + (p.id || 'L'));
  const skins = SKIN[p.race] || SKIN.HUMAN, sex = sexOf(p), fem = sex === 'f';
  const look = Object.assign({skin: skins[h % skins.length], hair: HAIRS[(h >> 3) % HAIRS.length],
    hairStyle: fem ? ['long','ponytail','braids','bun'][(h >> 6) % 4] : ['short','messy','bald','topknot','long'][(h >> 6) % 5]}, R, S, {sex});
  if (R.hair) look.hair = R.hair;
  if (fem){ look.beard = false; if (p.race === 'DWARF' || p.race === 'FIRBOLG') look.hairStyle = 'braids'; }
  if (S === SPEC_LOOK.PLAIN) return look;
  const g = gearLook(), [acol, apat] = ARMOUR_LOOK[g.armour] || ['#8a6a4a', 'plain'];
  const melee = MELEE_ART[g.melee] || 'spear', ranged = RANGED_ART[g.ranged] || 'bow';
  look.armour = apat; look.rweapon = ranged; look.top = acol; look.legs = shade(acol, .55);
  if (p.spec === 'SOLDIER'){
    look.weapon = melee; look.back = ranged; look.head = 'helmet'; look.helm = apat === 'plate' || apat === 'chain' ? shade(acol, 1.05) : C.steel;
    look.shield = g.shield === 'none' ? false : g.shield === 'heavyshield' ? 'big' : true; look.shieldCol = '#7a3e26';
  } else if (p.spec === 'FOLK_HERO'){
    look.weapon = ranged; look.hip = melee; look.head = 'hood'; look.hood = '#4e6b2c'; look.acc = '#4e6b2c';
  } else if (p.spec === 'SCOUNDREL'){
    look.weapon = melee === 'spear' || melee === 'pike' ? 'dagger' : melee; look.back = ranged; look.head = 'hood'; look.hood = '#24242c'; look.acc = '#24242c';
  } else if (p.spec === 'CLERIC'){
    look.weapon = 'mace'; look.back = ranged; look.robe = true; look.robeCol = '#ece4cf'; look.acc = C.gold; look.head = 'circlet';
  } else { // MAGE, WITCH
    look.weapon = 'staff'; look.back = ranged; look.robe = true; look.robeCol = S.top;
  }
  // every member of the Chapter wears a cloak in the banner's colours
  const bn = banner(); look.cape = bn.c1; if (isLeader) look.capeTrim = bn.c2;
  return look;
}
function personKey(p, isLeader){ const g = gearLook(); return p.race + p.spec + p.name + (p.id||'L') + (isLeader?'L':'') + sexOf(p) + (p.injuries || []).join('') + g.armour + g.melee + g.ranged + g.shield + bannerSig()
  + '|' + (p.scars || 0) + (p.resting > 0 && !p.trainingAt ? 'h' : ''); }   // scars and the hurt look (was core/fixes16.js)
function personSprite(p, isLeader){ return humanoidSprite('p:' + personKey(p, isLeader), personLook(p, isLeader)); }

/* ---------------------------------------------------------------------------
   BEASTS - size records only (step 5 phase B)
--------------------------------------------------------------------------- */
function beastSprite(kind){
  if (SPR['b:' + kind]) return SPR['b:' + kind];
  const W = kind === 'wolf' ? 24 : 16, H = kind === 'wolf' ? 16 : 18;
  return SPR['b:' + kind] = {frames:[], white:[], ax: kind === 'wolf' ? 12 : 8, ay: kind === 'wolf' ? 9 : 10, w:W, h:H};
}
function enemySprite(kind){
  if (kind === 'alpha'){
    if (SPR['b:alpha']) return SPR['b:alpha'];
    return SPR['b:alpha'] = {frames:[], white:[], ax:12, ay:9, w:24, h:16};
  }
  if (kind === 'wyrm'){
    if (SPR['b:wyrm']) return SPR['b:wyrm'];
    return SPR['b:wyrm'] = {frames:[], white:[], ax:16, ay:10, w:33, h:18};
  }
  if (kind === 'wolf' || kind === 'cinder') return beastSprite(kind);
  if (kind === 'nest' || kind === 'engine') return fixedSprite(kind);
  const cu = customEnemySprite(kind); if (cu) return cu;
  return humanoidSprite('e:' + kind + bannerSig(), enemyLook(kind));
}

/* ---------------------------------------------------------------------------
   PICKUPS, PROJECTILES, GROUND WORKS
--------------------------------------------------------------------------- */
function simpleSprite(key, w, h, draw, noOutline){
  let o = SPR[key];
  if (!o){ const c = newCanvas(w, h); draw(painter(c.getContext('2d')), c.getContext('2d')); o = SPR[key] = noOutline ? c : outline(c); }
  if (o._gk === undefined) o._gk = /^coin[0-3]$/.test(key) ? 0.79 : key === 'gem' ? 0.82 : 0;   // GFX-13: coins and gems drawn smaller (js/art/graphics.js blit reads _gk; INT-1 step 3: its wrapper folded in)
  return o;
}

/* ---------------------------------------------------------------------------
   THE GROUND - a dusty battlefield tile, plus scattered decor
--------------------------------------------------------------------------- */
function groundPattern(){
  if (SPR.ground) return SPR.ground;
  const N = 96, c = newCanvas(N, N), g = c.getContext('2d'), P = painter(g), r = rng(1234);
  P(0, 0, N, N, '#5f6d3e');
  const greens = ['#56653a','#687845','#73824c','#4f5d35'];
  for (let i = 0; i < 2400; i++){ const x = r()*N|0, y = r()*N|0; P(x, y, 1, r() < .35 ? 2 : 1, greens[r()*4|0]); }
  for (let k = 0; k < 6; k++){                         // dusty patches
    const cx = r()*N, cy = r()*N, rad = 4 + r()*7;
    for (let y = -rad; y <= rad; y++) for (let x = -rad*1.4; x <= rad*1.4; x++)
      if ((x*x)/(rad*rad*1.9) + (y*y)/(rad*rad) < 1 - r()*.25) P(((cx+x)%N+N)%N|0, ((cy+y)%N+N)%N|0, 1, 1, r() < .7 ? '#7d7650' : '#8a8258');
  }
  for (let i = 0; i < 14; i++){ const x = r()*N|0, y = r()*N|0; P(x, y, 1, 1, ['#e8d870','#d8d8e8','#c87070'][r()*3|0]); }
  for (let i = 0; i < 18; i++){ const x = r()*N|0, y = r()*N|0; P(x, y, 1, 1, '#8a8a80'); }
  return SPR.ground = scaled(c, 3);
}

/* ---------------------------------------------------------------------------
   SMALL GLYPHS - 7x7, used on signs, tactic cards and gear
--------------------------------------------------------------------------- */
const GLYPHS = {
  sword:  ['......#','.....#.','....#..','#..#...','.##....','.##....','#..#...'],
  dagger: ['.......','.....#.','....#..','...#...','.##....','.#.....','#......'],
  anvil:  ['.......','#######','.#####.','...#...','..###..','.#####.','.......'],
  cross:  ['...#...','...#...','#######','...#...','...#...','...#...','...#...'],
  potion: ['..###..','...#...','..###..','.#####.','#######','#######','.#####.'],
  star:   ['...#...','...#...','#######','.#####.','..###..','.##.##.','#.....#'],
  saw:    ['#######','#######','.#.#.#.','.......','..#....','.###...','..#....'],
  gear:   ['.#.#.#.','#######','.##.##.','###.###','.##.##.','#######','.#.#.#.'],
  bow:    ['..##...','.#..#..','#....#.','#.....#','#....#.','.#..#..','..##...'],
  coin:   ['..###..','.#####.','##.#.##','###.###','##.#.##','.#####.','..###..'],
  hide:   ['#.....#','.#####.','.#####.','#######','.#####.','.#####.','#.....#'],
  flag:   ['#......','#####..','######.','#####..','#......','#......','#......'],
  bars:   ['#######','#.#.#.#','#.#.#.#','#.#.#.#','#.#.#.#','#.#.#.#','#######'],
  shield: ['#######','#.....#','#..#..#','#.###.#','#..#..#','.#...#.','..###..'],
  mug:    ['.......','#####..','#####.#','#####.#','#####..','#####..','.###...'],
  horse:  ['..##...','.####..','######.','##.###.','...###.','...####','...##.#'],
  drop:   ['...#...','..###..','.#####.','#######','#######','.#####.','..###..'],
  boot:   ['..###..','..###..','..###..','..###..','..####.','.######','.######'],
  horn:   ['#......','##.....','.###...','..####.','...####','....###','.....##'],
  heart:  ['.##.##.','#######','#######','#######','.#####.','..###..','...#...'],
  eye:    ['.......','..###..','.#...#.','#..#..#','.#...#.','..###..','.......'],
  sun:    ['#..#..#','.#.#.#.','..###..','###.###','..###..','.#.#.#.','#..#..#'],
  book:   ['.#####.','.#...#.','.#####.','.#...#.','.#####.','.#...#.','.######'],
  flame:  ['...#...','..##...','..###..','.####..','.#####.','#######','.#####.'],
  snow:   ['...#...','.#.#.#.','..###..','#######','..###..','.#.#.#.','...#...'],
  thorn:  ['#.....#','.#...#.','..#.#..','...#...','..#.#..','.#...#.','#.....#'],
  skull:  ['.#####.','#######','#..#..#','#######','.#####.','.#.#.#.','.......'],
  stake:  ['.#...#.','.#...#.','##.#.##','##.#.##','##.#.##','##.#.##','#######'],
  bomb:   ['.....#.','....#..','..###..','.#####.','#######','#######','.#####.'],
  arrows: ['....###','.....##','#...#.#','.#.#...','..#....','.#.#...','#......'],
  // Art 16 Nov: Disarm (a sword struck out; anvil was Armour Break's) and Nobody Saw Me (a mask; 'hide' is a pelt)
  disarm: ['.....#.','....#..','...#...','..#....','.##.#.#','.##..#.','#...#.#'],
  mask:   ['.......','.......','#######','#..#..#','#######','.##.##.','.......']
};
function glyph(P, name, x, y, col){
  const rows = GLYPHS[name]; if (!rows) return;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') P(x+i, y+j, 1, 1, col); });
}
const GLYPH_COLOURS = { sword:C.steelL, dagger:C.steelL, anvil:C.steel, cross:'#e04040', potion:'#7ac05a', star:'#ffe060', saw:C.steel,
  gear:C.steel, bow:C.wood, coin:'#e8c040', hide:'#b08a5a', flag:'#b4463a', bars:C.steel, shield:'#7a3e26', mug:'#d4af37', horse:'#8a5a2b',
  drop:'#c03030', boot:'#7a4f2a', horn:'#ece0c4', heart:'#d04050', eye:'#87ceeb', sun:'#ffd040', book:'#7a3e26', flame:'#ff8a2a',
  snow:'#bfe8ff', thorn:'#5f7e3e', skull:'#ece0c4', stake:C.wood, bomb:'#555', arrows:C.wood, disarm:C.steelL, mask:'#c8bca8' };
// A glyph on a little round badge: the tactic card icon.
function badgeURL(name, ring){
  return toURL('badge:' + name + ring, () => {
    const c = newCanvas(13, 13), P = painter(c.getContext('2d'));
    P(2, 0, 9, 13, ring); P(0, 2, 13, 9, ring); P(1, 1, 11, 11, ring);
    P(3, 1, 7, 11, '#2a2520'); P(1, 3, 11, 7, '#2a2520'); P(2, 2, 9, 9, '#2a2520');
    glyph(P, name, 3, 3, GLYPH_COLOURS[name] || '#fff');
    return outline(c);
  }, 4);
}

/* ---------------------------------------------------------------------------
   GEAR ICONS - one per Quartermaster card, 16x16
--------------------------------------------------------------------------- */
const ARMOUR_LOOK = {
  rags:['#8a7a5a','rag'], padded:['#c9b48a','quilt'], leather:['#7a4f2a','plain'], brigandine:['#5a3a2e','studs'],
  chainshirt:['#9aa3ad','chain'], hide:['#8a6a44','fur'], scale:['#8f98a2','scale'], heavychain:['#7f8892','chain'],
  cuirass:['#c0c8d0','plate'], splint:['#8f98a2','bands'], lamellar:['#a08a5a','bands'], halfplate:['#d3d9de','plate']
};
function drawGear(P, g){
  const id = g.id;
  if (g.slot === 'armour'){
    const [col, pat] = ARMOUR_LOOK[id], d = shade(col, .7), l = shade(col, 1.3);
    P(2, 3, 12, 11, col); P(0, 3, 3, 5, col); P(13, 3, 3, 5, col); P(5, 2, 6, 2, col); P(6, 2, 4, 3, '#2a2520');
    P(2, 13, 12, 1, d); P(13, 4, 1, 9, d); P(2, 3, 11, 1, l);
    if (pat === 'quilt') for (let y = 6; y < 13; y += 3) P(3, y, 10, 1, d);
    if (pat === 'studs') for (let y = 6; y < 13; y += 2) for (let x = 4; x < 13; x += 3) P(x, y, 1, 1, C.gold);
    if (pat === 'chain') for (let y = 5; y < 13; y++) for (let x = 3 + (y%2); x < 13; x += 2) P(x, y, 1, 1, d);
    if (pat === 'scale') for (let y = 5; y < 13; y += 2) for (let x = 3 + (y%4 ? 1 : 0); x < 13; x += 3) P(x, y, 2, 1, d);
    if (pat === 'bands') for (let y = 6; y < 13; y += 2) P(3, y, 10, 1, d);
    if (pat === 'plate'){ P(7, 5, 2, 8, l); P(4, 10, 8, 1, d); }
    if (pat === 'fur'){ P(0, 3, 16, 2, '#c8b090'); P(1, 2, 14, 1, '#c8b090'); }
    if (pat === 'rag'){ P(4, 7, 2, 2, d); P(10, 10, 2, 1, d); P(2, 13, 2, 1, 'rgba(0,0,0,0)'); }
    P(2, 10, 12, 1, C.leather);
    return;
  }
  if (g.slot === 'shield'){
    if (id === 'none'){ P(3, 7, 10, 2, '#8a3a2a'); P(7, 3, 2, 10, '#8a3a2a'); return; }
    if (id === 'bucklers'){ P(4, 3, 8, 10, C.wood); P(3, 4, 10, 8, C.wood); P(7, 7, 2, 2, C.steelL); P(4, 3, 8, 1, '#b08a5a'); return; }
    P(2, 1, 12, 9, '#7a3e26'); P(3, 10, 10, 2, '#7a3e26'); P(5, 12, 6, 2, '#7a3e26'); P(7, 14, 2, 1, '#7a3e26');
    P(2, 1, 12, 1, C.steel); P(7, 2, 2, 11, C.gold); P(3, 5, 10, 2, C.gold); return;
  }
  if (g.slot === 'melee'){
    if (id === 'spears' || id === 'pikes'){ for (let i = 0; i < 13; i++) P(1+i, 14-i, 1, 1, C.wood); P(12, 1, 3, 3, C.steelL); P(14, 0, 1, 2, C.steelL);
      if (id === 'pikes') P(10, 3, 3, 1, '#b4463a'); return; }
    if (id === 'shortswords'){ for (let i = 0; i < 8; i++) P(6+i, 9-i, 1, 1, C.steelL); P(4, 9, 3, 3, C.gold); P(2, 12, 2, 2, C.wood);
      P(1, 1, 5, 3, C.steel); P(3, 3, 1, 8, C.wood); return; }
    for (let i = 0; i < 11; i++){ P(4+i, 11-i, 1, 1, C.steelL); P(4+i, 12-i, 1, 1, C.steel); }
    P(2, 10, 5, 1, C.gold); P(4, 8, 1, 5, C.gold); P(1, 13, 3, 2, C.wood); return;
  }
  if (g.slot === 'ranged'){
    if (id === 'crossbows'){ P(2, 7, 12, 2, C.wood); P(10, 2, 2, 12, C.woodD); P(9, 2, 1, 1, C.woodD); P(9, 13, 1, 1, C.woodD);
      P(4, 7, 1, 1, '#e8e0d0'); for (let i = 0; i < 5; i++){ P(5+i, 3+i, 1, 1, '#e8e0d0'); P(5+i, 12-i, 1, 1, '#e8e0d0'); } P(13, 7, 2, 2, C.steelL); return; }
    const big = id === 'longbows';
    for (let y = 1; y < 15; y++){ const x = 4 + Math.round(Math.sin((y-1)/13*Math.PI) * (big ? 6 : 5)); P(x, y, 2, 1, C.wood); }
    P(4, 1, 1, 14, '#e8e0d0'); return;
  }
  if (g.slot === 'kit'){
    if (id === 'towershield'){ P(3, 0, 10, 15, C.wood); P(3, 0, 10, 1, '#b08a5a'); for (let y = 3; y < 15; y += 4) P(3, y, 10, 1, C.woodD); P(7, 1, 2, 14, C.steel); return; }
    if (id === 'focus'){ P(7, 5, 2, 11, C.wood); P(5, 0, 6, 6, '#87ceeb'); P(6, 1, 2, 2, '#ffffff'); P(4, 2, 1, 2, '#87ceeb'); return; }
    P(2, 5, 12, 9, C.leather); P(2, 5, 12, 2, shade(C.leather, 1.3)); P(4, 2, 8, 3, C.leatherD || '#4e321a'); P(4, 8, 3, 3, '#c89a6a'); P(9, 8, 3, 3, '#c89a6a'); return;
  }
  if (g.slot === 'mount'){
    if (id === 'nomount'){ glyph(P, 'boot', 4, 4, '#7a4f2a'); return; }
    const col = id === 'riding' ? '#8a5a2b' : id === 'lighthorse' ? '#c8a070' : '#2a2224';
    P(5, 3, 6, 5, col); P(8, 6, 6, 9, col); P(3, 6, 5, 4, col); P(2, 8, 3, 3, shade(col,.85));
    P(7, 1, 2, 3, col); P(9, 2, 4, 8, '#3a2a1c'); P(5, 5, 1, 1, '#111');
    if (id === 'warhorses'){ P(8, 10, 6, 5, '#b4463a'); P(8, 10, 6, 1, C.gold); }
  }
}
function gearURL(g){
  return toURL('gear:' + g.id, () => { const c = newCanvas(16, 16); drawGear(painter(c.getContext('2d')), g); return outline(c); }, 4);
}

/* ---------------------------------------------------------------------------
   BUILDINGS - one per Camp Facility, 32x32
--------------------------------------------------------------------------- */
const FAC_LOOK = {
  tents:{type:'tent', col:'#c9b48a', stripe:'#9b7a4a'},
  kitchen:{type:'fire'},
  tavern:{type:'house', wall:'plaster', roof:'#8a3a2a', glyph:'mug'},
  command:{type:'tent', col:'#7a3e26', stripe:'#d4af37', big:true, banner:true},
  merchant:{type:'stall', col:'#c8a24a', stripe:'#8c3a2e'},
  cells:{type:'cells'},
  barracks:{type:'house', wall:'wood', roof:'#5a4a3a', glyph:'flag', wide:true},
  training:{type:'yard'},
  armoury:{type:'house', wall:'stone', roof:'#4a4a52', glyph:'shield'},
  stables:{type:'barn'},
  ranger:{type:'house', wall:'log', roof:'#4e6b2c', glyph:'bow'},
  hospital:{type:'tent', col:'#ece4cf', stripe:'#ece4cf', cross:true},
  blacksmith:{type:'house', wall:'stone', roof:'#3a3a40', glyph:'anvil', chimney:true},
  carpentry:{type:'house', wall:'wood', roof:'#8a5a2b', glyph:'saw'},
  leather:{type:'house', wall:'wood', roof:'#6a4a2a', glyph:'hide'},
  engineering:{type:'house', wall:'stone', roof:'#5a4a3a', glyph:'gear', chimney:true},
  alchemy:{type:'house', wall:'plaster', roof:'#4a6a3a', glyph:'potion', chimney:true, smoke:'#9ae070'},
  magetower:{type:'tower', roof:'#3f3f8f', glyph:'star'},
  chapel:{type:'chapel'}
};
function wallFill(P, x, y, w, h, kind){
  const base = {wood:'#9a6a3a', log:'#7a5230', stone:'#8a8a86', plaster:'#e0d4b8'}[kind];
  P(x, y, w, h, base);
  const d = shade(base, .78);
  if (kind === 'wood') for (let i = x+2; i < x+w; i += 3) P(i, y, 1, h, d);
  if (kind === 'log') for (let j = y+1; j < y+h; j += 2) P(x, j, w, 1, d);
  if (kind === 'stone') for (let j = y; j < y+h; j += 3) for (let i = x + (j%2 ? 0 : 2); i < x+w; i += 4) P(i, j, 3, 1, d);
  if (kind === 'plaster'){ P(x, y, 1, h, '#6a4a2a'); P(x+w-1, y, 1, h, '#6a4a2a'); P(x, y + (h>>1), w, 1, '#6a4a2a'); }
  P(x, y+h-1, w, 1, shade(base, .6));
}
function signBoard(P, x, y, name){ P(x+3, y-2, 1, 2, C.woodD); P(x, y, 9, 9, '#c8a878'); P(x, y, 9, 1, '#e0c898'); glyph(P, name, x+1, y+1, '#2a2520'); }
function roof(P, x0, x1, yTop, yBase, col){
  const d = shade(col, .7);
  for (let y = yTop; y <= yBase; y++){ const t = (y - yTop) / Math.max(1, yBase - yTop), half = ((x1 - x0) / 2) * t + 1, cx = (x0 + x1) / 2;
    P(Math.round(cx - half), y, Math.round(half*2), 1, (y - yTop) % 3 === 2 ? d : col); }
}
function drawBuilding(P, look){
  const t = look.type;
  if (t === 'tent'){
    const x0 = look.big ? 1 : 4, x1 = look.big ? 30 : 27, top = look.big ? 6 : 11;
    for (let y = top; y <= 30; y++){ const half = (y - top) / (30 - top) * (x1 - x0) / 2 + 1, cx = 16;
      for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) P(x, y, 1, 1, ((x - cx + 40) % 6 < 3) ? look.col : look.stripe); }
    P(14, 22, 4, 9, '#3a2a1c'); P(15, top-3, 1, 4, C.woodD);
    if (look.banner){ P(16, top-6, 5, 3, '#d4af37'); P(16, top-3, 1, 1, '#d4af37'); }
    if (look.cross){ P(14, top+6, 4, 1, '#c03030'); P(15, top+4, 2, 6, '#c03030'); P(13, top+6, 6, 2, '#c03030'); }
    return;
  }
  if (t === 'fire'){
    P(9, 26, 14, 3, C.woodD); P(11, 24, 10, 2, C.wood); P(8, 28, 16, 2, '#6a6a66');
    P(13, 16, 6, 9, '#e8602a'); P(14, 13, 4, 6, '#ffb030'); P(15, 11, 2, 5, '#ffe060');
    P(6, 8, 1, 21, C.woodD); P(25, 8, 1, 21, C.woodD); P(6, 8, 20, 1, C.woodD);
    P(12, 10, 8, 6, '#3a3a3a'); P(12, 10, 8, 1, '#5a5a5a'); P(15, 9, 2, 1, '#3a3a3a');
    P(14, 5, 1, 3, 'rgba(220,220,220,.5)'); P(17, 3, 1, 4, 'rgba(220,220,220,.5)');
    return;
  }
  if (t === 'stall'){
    P(4, 8, 24, 6, look.col); for (let x = 4; x < 28; x += 6) P(x, 8, 3, 6, look.stripe); for (let x = 4; x < 28; x += 3) P(x, 14, 2, 1, look.stripe);
    P(5, 14, 1, 16, C.woodD); P(26, 14, 1, 16, C.woodD); P(3, 22, 26, 3, C.wood); P(3, 22, 26, 1, '#b08a5a'); P(3, 25, 26, 5, C.woodD);
    P(6, 19, 3, 3, '#c04030'); P(10, 20, 3, 2, '#e8c040'); P(15, 19, 3, 3, '#7ac05a'); P(20, 20, 4, 2, '#d8c8a0');
    return;
  }
  if (t === 'yard'){
    for (let x = 1; x < 31; x += 5) P(x, 18, 2, 12, C.wood); P(1, 21, 30, 1, C.woodD); P(1, 26, 30, 1, C.woodD);
    P(15, 8, 2, 22, C.woodD); P(11, 13, 10, 2, C.woodD); P(13, 9, 6, 9, '#c8b48a'); P(14, 4, 4, 5, '#c8b48a'); P(15, 6, 1, 1, '#3a2a1c');
    return;
  }
  if (t === 'cells'){
    wallFill(P, 3, 10, 26, 20, 'stone'); P(2, 8, 28, 3, '#6a6a66');
    for (let x = 3; x < 29; x += 4) P(x, 6, 2, 3, '#6a6a66');
    P(10, 15, 12, 9, '#1a1a1a'); for (let x = 11; x < 22; x += 3) P(x, 15, 1, 9, C.steel); P(10, 19, 12, 1, C.steel);
    return;
  }
  if (t === 'barn'){
    P(1, 8, 30, 3, '#5a3a2a'); roof(P, 2, 30, 4, 12, '#5a3a2a');
    P(2, 12, 28, 18, '#9b3a2a'); for (let x = 4; x < 30; x += 3) P(x, 12, 1, 18, '#7a2a20'); P(2, 29, 28, 1, '#5a2018');
    P(10, 17, 12, 13, '#e8e0d0'); P(11, 18, 10, 12, '#6a2a20'); for (let i = 0; i < 10; i++){ P(11+i, 18+i, 1, 1, '#e8e0d0'); P(20-i, 18+i, 1, 1, '#e8e0d0'); }
    P(14, 8, 4, 3, '#e8e0d0');
    return;
  }
  if (t === 'tower'){
    wallFill(P, 9, 10, 14, 21, 'stone'); P(8, 9, 16, 2, '#6a6a66');
    roof(P, 7, 25, 0, 9, look.roof); P(15, 0, 2, 1, '#ffe060');
    P(14, 14, 4, 5, '#2a2a40'); P(15, 15, 2, 3, '#ffe060'); P(13, 24, 6, 7, '#3a2a1c');
    signBoard(P, 23, 18, look.glyph);
    return;
  }
  if (t === 'chapel'){
    wallFill(P, 4, 14, 24, 17, 'stone'); roof(P, 3, 29, 8, 15, '#5a5a6a');
    P(13, 3, 6, 12, '#8a8a86'); roof(P, 12, 20, -2, 4, '#5a5a6a');
    P(15, -1, 2, 1, C.gold); P(14, 6, 4, 4, '#2a2a40'); P(15, 7, 2, 2, '#87ceeb');
    P(13, 22, 6, 9, '#4a3020'); P(13, 21, 6, 1, '#6a4a30'); P(7, 18, 3, 5, '#87ceeb'); P(22, 18, 3, 5, '#87ceeb');
    P(15, 0, 2, 0, C.gold);
    return;
  }
  // house
  const x0 = look.wide ? 1 : 4, x1 = look.wide ? 31 : 28;
  if (look.chimney){ P(x1-8, 3, 4, 9, '#6a6a66'); P(x1-9, 2, 6, 2, '#5a5a56');
    const sm = look.smoke || 'rgba(210,210,210,.65)'; P(x1-7, 0, 2, 2, sm); P(x1-5, -2, 2, 2, sm); }
  wallFill(P, x0+1, 15, x1-x0-2, 16, look.wall);
  roof(P, x0, x1, 5, 15, look.roof);
  const dx = ((x0 + x1) >> 1) - 2;
  P(dx, 22, 5, 9, '#4a3020'); P(dx, 22, 5, 1, '#6a4a30'); P(dx+3, 26, 1, 1, C.gold);
  P(x0+3, 18, 4, 4, '#2a2a40'); P(x0+4, 19, 2, 2, '#ffe0a0');
  if (look.glyph) signBoard(P, x1-11, 18, look.glyph);
}
function buildingURL(id){
  return toURL('bld:' + id, () => {
    const c = newCanvas(34, 36), g = c.getContext('2d'); g.translate(1, 3);
    drawBuilding(painter(g), FAC_LOOK[id]); g.setTransform(1,0,0,1,0,0); return outline(c);
  }, 4);
}

/* ---------------------------------------------------------------------------
   PORTRAITS for menus
--------------------------------------------------------------------------- */
/* S6-C note 10: where no painted face or card exists yet (or it has not loaded), a plain smooth silhouette, never a pixel bust. */
function faceStandIn(w, h, v){
  const c = newCanvas(w, h), g = c.getContext('2d'), b = v && v.b ? 1 : 0;
  g.fillStyle = '#2b241d'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(214,190,150,.30)'; g.strokeStyle = 'rgba(232,212,170,.22)'; g.lineWidth = Math.max(1, w / 34);
  g.beginPath(); g.arc(w / 2, h * 0.40 - b * h / 68, w * 0.19, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(w / 2, h * 1.02, w * 0.40, h * 0.36, 0, Math.PI, 0); g.fill(); g.stroke();
  return c;
}
function portraitURL(p, isLeader){
  return toURL('por0', () => faceStandIn(48, 48), 1);
}
function specIconURL(spec){ return portraitURL({race:'HUMAN', spec, name:'icon'+spec, id:1}, false); }
function raceIconURL(race){
  if (typeof PORT !== 'undefined' && PORT.ok && PORT_RACES.indexOf(race) >= 0)   // a painted face where there is one (js/art/portraits.js; INT-1 step 3: its wrapper folded in)
    return portraitURL({race, spec:'SOLDIER', sex:(hash(race) & 2) ? 'f' : 'm', name:'icon' + race, id:2}, false);
  return portraitURL({race, spec:'PLAIN', name:'icon'+race, id:2}, false);
}
function enemyIconURL(kind){ return toURL('enemy0', () => faceStandIn(48, 48), 1); }   // S6-C note 10: the painted FOE49 card is put in front of this (js/art/art-f48.js)

/* ---------------------------------------------------------------------------
   PARCHMENT for the menu screens
--------------------------------------------------------------------------- */
/* PL-1 textures (AD ruling, 22 Nov): no pixel speckle. softNoise is smooth, tileable value noise: cx x cy random cells across
   an N px square, smoothstep between them, wrapping at the edges; values about -1..1. */
function softNoise(N, cx, cy, seed){
  const r = rng(seed), g = new Float32Array(cx * cy), out = new Float32Array(N * N), s = t => t * t * (3 - 2 * t);
  for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1;
  for (let y = 0; y < N; y++){ const fy = y * cy / N, y0 = fy | 0, ty = s(fy - y0), y1 = (y0 + 1) % cy;
    for (let x = 0; x < N; x++){ const fx = x * cx / N, x0 = fx | 0, tx = s(fx - x0), x1 = (x0 + 1) % cx;
      const top = g[y0 * cx + x0] + (g[y0 * cx + x1] - g[y0 * cx + x0]) * tx, bot = g[y1 * cx + x0] + (g[y1 * cx + x1] - g[y1 * cx + x0]) * tx;
      out[y * N + x] = top + (bot - top) * ty; } }
  return out;
}
// a field scaled to mean 0 and largest |value| 1
function softNorm(f){ let m = 0; for (const v of f) m += v; m /= f.length; let k = 0; for (let i = 0; i < f.length; i++){ f[i] -= m; k = Math.max(k, Math.abs(f[i])); } if (k) for (let i = 0; i < f.length; i++) f[i] /= k; return f; }
/* PL-1 (AD): parchment is soft fibre noise, one 256 px tile drawn at 1x (CSS shows it at 256px), two octaves (cloud + horizontal fibre),
   lightness within +-4%, no hard dots. The base is the old speckled tile's mean colour, so the mean lightness and text contrast stay put. */
const PARCH_MEAN = [219.47, 202.42, 163.55];
function parchmentURL(){
  return toURL('parch', () => {
    const N = 256, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
    const A = softNoise(N, 8, 8, 99), B = softNoise(N, 16, 96, 199), f = new Float32Array(N * N);
    for (let i = 0; i < f.length; i++) f[i] = 0.6 * A[i] + 0.4 * B[i];
    softNorm(f);
    for (let i = 0; i < f.length; i++){ const k = 1 + 0.04 * f[i]; d[i * 4] = PARCH_MEAN[0] * k; d[i * 4 + 1] = PARCH_MEAN[1] * k; d[i * 4 + 2] = PARCH_MEAN[2] * k; d[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }, 1);
}

/* ---------------------------------------------------------------------------
   TERRAIN TILES - 20x20 source, drawn at 40px (one map cell)
--------------------------------------------------------------------------- */
function tileSprite(key, draw){
  if (SPR['t:' + key]) return SPR['t:' + key];
  const c = newCanvas(20, 20), g = c.getContext('2d'); draw(painter(g), rng(hash(key)));
  return SPR['t:' + key] = scaled(c, 2);
}
const TILE = {
  forest: v => tileSprite('forest' + v, (P, r) => { P(0,0,20,20,'#43552f'); for (let i = 0; i < 90; i++) P(r()*20|0, r()*20|0, 1, 1, ['#3a4a28','#4e6236','#556a3a','#2e3c22'][r()*4|0]); }),
  rubble: v => tileSprite('rubble' + v, (P, r) => { P(0,0,20,20,'#6a6a58'); for (let i = 0; i < 9; i++){ const x = r()*17|0, y = r()*17|0, w = 2 + (r()*3|0); P(x,y,w,w-1,'#8a8a80'); P(x,y,w,1,'#a8a8a0'); P(x,y+w-1,w,1,'#4a4a44'); } }),
  road: v => tileSprite('road' + v, (P, r) => { P(0,0,20,20,'#8a7650'); for (let i = 0; i < 70; i++) P(r()*20|0, r()*20|0, 1, 1, ['#7a6644','#9a865c','#6e5c3c'][r()*3|0]); P(0, 6, 20, 1, '#6e5c3c'); P(0, 13, 20, 1, '#6e5c3c'); }),
  floor: v => tileSprite('floor' + v, (P, r) => { P(0,0,20,20,'#7a7468'); for (let y = 0; y < 20; y += 5) for (let x = (y/5 % 2) * 5; x < 20; x += 10){ P(x, y, 9, 4, '#8e887a'); P(x, y, 9, 1, '#a09a8a'); } }),
  hill: v => tileSprite('hill' + v, (P, r) => { P(0,0,20,20,'#7a8a4a'); for (let i = 0; i < 60; i++) P(r()*20|0, r()*20|0, 1, 1, ['#869650','#6e7e42','#909e58'][r()*3|0]); }),
  hillEdge: () => tileSprite('hilledge', P => { P(0, 16, 20, 4, '#4e5a2e'); P(0, 15, 20, 1, '#5e6a36'); }),
  water: f => tileSprite('water' + f, (P, r) => { P(0,0,20,20,'#2e5a7a'); for (let i = 0; i < 6; i++){ const x = (r()*16|0), y = (i*3 + f*2) % 20; P(x, y, 4, 1, '#5a8aaa'); } P(0,0,20,1,'#24485f'); }),
  stone: () => tileSprite('stone', P => { P(0,0,20,20,'#8a8a86'); for (let y = 0; y < 14; y += 4) for (let x = (y/4 % 2) * 4; x < 20; x += 8){ P(x, y, 7, 3, '#9a9a96'); P(x, y, 7, 1, '#b4b4ae'); } P(0, 14, 20, 6, '#5e5e5a'); for (let x = 2; x < 20; x += 6) P(x, 15, 1, 5, '#4a4a46'); }),
  stoneTop: () => tileSprite('stonetop', P => { P(0,0,20,20,'#8a8a86'); for (let y = 0; y < 20; y += 4) for (let x = (y/4 % 2) * 4; x < 20; x += 8){ P(x, y, 7, 3, '#9a9a96'); P(x, y, 7, 1, '#b4b4ae'); } }),
  palisade: () => tileSprite('palisade', P => { P(0,0,20,20,'#5a7040'); for (let x = 0; x < 20; x += 4){ P(x, 2, 3, 18, '#8a5a2b'); P(x, 1, 3, 2, '#b08a5a'); P(x + 2, 4, 1, 16, '#5a3a1a'); P(x + 1, 0, 1, 1, '#b08a5a'); } P(0, 10, 20, 1, '#4a3018'); }),
  roof: v => tileSprite('roof' + v, (P, r) => { const c = ['#8a3a2a','#6a4a2a','#5a5a6a'][v % 3]; P(0,0,20,20,c); for (let y = 0; y < 20; y += 4){ P(0, y, 20, 1, shade(c, .7)); for (let x = (y/4 % 2) * 3; x < 20; x += 6) P(x, y, 1, 4, shade(c, .8)); } }),
  wallFront: v => tileSprite('wallfront' + v, P => { P(0,0,20,20,'#c8b890'); P(0,0,1,20,'#6a4a2a'); P(19,0,1,20,'#6a4a2a'); P(0,9,20,1,'#6a4a2a'); P(7, 10, 6, 10, '#4a3020'); }),
  tent: v => tileSprite('tent' + v, (P, r) => { const a = ['#c9b48a','#9b3a2a','#6a6a4a'][v % 3], b = shade(a, .75); P(0,0,20,20,a); for (let x = 0; x < 20; x += 5) P(x, 0, 2, 20, b); P(0, 18, 20, 2, shade(a, .55)); })
};
// Loot and markers
const bannerSprite = col => simpleSprite('banner' + col, 10, 24, P => { P(1, 0, 1, 24, '#5a3a1a'); P(2, 1, 7, 9, col); P(2, 10, 3, 2, col); P(6, 10, 3, 2, col); P(4, 3, 3, 3, '#1a1a1a'); });

/* ---------------------------------------------------------------------------
   HORSES - Squad Asset mounts (Section 3.5). Side view, facing right, a
   three-frame gallop. Riders sit on top; when the Mount Pool breaks the
   horses bolt and the squad fights on foot.
--------------------------------------------------------------------------- */
const HORSE_LOOK = {
  riding:    {coat:'#8a5a2b', mane:'#3a2414', saddle:'#7a3e26'},
  lighthorse:{coat:'#c8a070', mane:'#f0e6d2', saddle:'#4e6b2c'},
  warhorses: {coat:'#2a2224', mane:'#5a4a40', saddle:'#7a1e1e', barding:true}
};
function horseSprite(k){
  if (SPR['horse:' + k]) return SPR['horse:' + k];
  return SPR['horse:' + k] = {frames:[], ax:12, ay:13, w:26, h:21};
}

