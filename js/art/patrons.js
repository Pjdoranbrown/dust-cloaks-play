/* C-01 integration fix: the API is PATRON_ART (the game already has a global const PATRONS: the contract patron factions). */
/* INDEX 94 - patron sprites (js/art/patrons.js)
 *
 * What it does: draws 8 villager types (6 are the named hub patrons, 2 are extras picked by
 * hash(name)), 4 frames each (idle, cheer, shuffle, ko), at the stock person size (24 x 26,
 * anchor 11,17), as runtime canvas code. Exposes window.PATRON_ART:
 *   PATRON_ART.sprite(name, i)  -> {frames:[idle, cheer, shuffle, ko], ax, ay, w, h, pat:true} or null
 *   PATRON_ART.draw(ctx, name, i, x, y, scale, state, tick, flip)
 *   PATRON_ART.portraitURL(patron) -> data URL (head and shoulders, 4x) or ''
 *   PATRON_ART.frameFor(r, i, tick) -> frame index for a ring spectator (ko 3, cheer 1, shuffle 2 / idle 0)
 * Everything is built lazily on first use and cached. Nothing runs at load except defining the API.
 * Fails silently: if a global is missing or canvas throws, functions return null / ''.
 *
 * ROLLBACK: delete this file and its <script> tag
 */
(function(){
  'use strict';

  /* ============================================================================
     TUNING TABLE  (Patrick: change colours and clothes here, nothing else needs touching)
     Base colours are the game's own (C, SKIN, HAIRS, TOPS in index.html / graphics.js).
     ============================================================================ */
  const PAL = {
    out:'#1b1410', eye:'#1b1410', boot:'#3a2a1c', leather:'#7a4f2a', wood:'#8a5a2b', woodD:'#5a3a1a',
    bone:'#ece0c4', gold:'#d4af37', steel:'#9aa3ad', steelD:'#5f6870', mouth:'#6a2a22',
    skinHuman:['#e8b48a', '#c98d5f', '#8d5a3a', '#f1c7a2'], skinDwarf:'#e0a57a',
    hairs:['#2b1d12', '#5a3a1e', '#8a5a2b', '#c9a24a', '#d8d0c0', '#7a2a1a', '#1a1a24'],
    tops:['#7a4a3a', '#4a5a7a', '#6a6a3a', '#5a3a6a', '#3a6a5a', '#8a6a3a', '#7a3a3a', '#5a5a5a'],   // spectator cloth colours (graphics.js TOPS)
    wall:'#3a2a1c', wallD:'#2a1a0c'                                                            // portrait backdrop (matches the seat CSS #2a1a0c)
  };
  const CFG = {
    mugInSprite:false,    // true = the cheer frame holds its own mug. Leave false while drawSpectator paints its own mug.
    bobScale:1,           // PATRON_ART.draw cheer hop and idle sway strength (0 = none)
    swapMs:28,            // ticks per idle <-> shuffle swap in frameFor (game ticks, about 60 per second)
    portraitScale:4, portraitSize:14   // source pixels cropped for the portrait (14 x 4 = 56 px)
  };
  // one entry per villager type; names[] = who always gets this type. vary = colours may shift for hash-picked names.
  const TYPES = [
    { id:'sot',      label:'old sot (Old Hob)',        names:['Old Hob'],
      L:7, W:8, legH:3, torH:5, sink:1, hx:1,
      skin:'#e8b48a', hair:'#d8d0c0', top:'#7a4a3a', legs:'#4a3a2a', patch:'#8a6a3a', shirt:'#d3cdb0', nose:'#c0504a', cheek:'#c9685a', bottle:'#3a6a5a', vary:true },
    { id:'drover',   label:'drover (Maud)',            names:['Maud the Drover', 'Maud'],
      L:8, W:7, legH:4, torH:5, robe:true, flare:1,
      skin:'#c98d5f', hair:'#8a5a2b', top:'#4a5a7a', legs:'#4a5a7a', hat:'#7a4f2a', hatBand:'#3a2410', scarf:'#9a3a2a', staff:'#8a5a2b' },
    { id:'labourer', label:'tall labourer (Tall Pell)', names:['Tall Pell'],
      L:8, W:6, legH:6, torH:5, sink:-1, armLen:7, rolled:true,
      skin:'#e8b48a', hair:'#5a3a1e', top:'#6a6a3a', legs:'#5a4a3a', cap:'#4a4a3a', capPeak:'#33332a', braces:'#5a3a1a', stubble:'#b98f6a', vary:true },
    { id:'boy',      label: "fiddler's boy (One-Ear Jory)", names:['One-Ear Jory', 'Jory'],
      L:8, W:5, legH:3, torH:4,
      skin:'#f1c7a2', hair:'#7a2a1a', top:'#5a3a6a', legs:'#4a3a2a', rope:'#c9a24a', bandage:'#ece0c4', blood:'#a03a2a', fiddle:'#8a5a2b', fiddleD:'#5a3a1a', vary:true },
    { id:'healer',   label:'nun or healer (Sister Wren)', names:['Sister Wren'],
      L:8, W:6, legH:4, torH:5, robe:true, flare:1,
      skin:'#f1c7a2', hair:'#8a5a2b', top:'#3a6a5a', legs:'#3a6a5a', wimple:'#ece0c4', sash:'#d3cdb0', bag:'#7a4f2a' },
    { id:'dwarf',    label:'dwarf miner (Gaffer Dunn)', names:['Gaffer Dunn'],
      L:7, W:8, legH:2, torH:4,
      skin:'#e0a57a', hair:'#d8d0c0', beard:'#b8b0a0', top:'#8a6a3a', legs:'#5a3a1a', cap:'#7a4f2a', lamp:'#f4d060', lampL:'#fff2b0', pickHandle:'#8a5a2b' },
    { id:'crone',    label:'crone (hash only)',        names:[],
      L:8, W:6, legH:4, torH:5, sink:1, hx:1, robe:true, flare:0,
      skin:'#e8b48a', hair:'#d8d0c0', top:'#5a5a5a', legs:'#5a5a5a', shawl:'#2f2f3a', cane:'#8a5a2b', nose:'#c98d5f' },
    { id:'fishwife', label:'fishwife (hash only)',     names:[],
      L:7, W:8, legH:4, torH:5, robe:true, flare:1, armLen:3, rolled:true,
      skin:'#e8b48a', hair:'#7a2a1a', top:'#7a3a3a', legs:'#5a4a3a', apron:'#d3cdb0', scarf:'#c9a24a', fish:'#9aa3ad', fishD:'#5f6870', vary:true }
  ];
  const ALIAS = {};   // exact name -> type index (built on first use)

  /* ============================================================================
     helpers (the game's own hash / shade / outline / newCanvas are used when present)
     ============================================================================ */
  const FRAME = ['idle', 'cheer', 'shuffle', 'ko'];
  const HW = 24, HH = 26, AX = 11, AY = 17, FEET = 24;
  const CACHE = {}, PORT = {};

  const hashS = s => {
    if (typeof hash === 'function') return hash(s) >>> 0;
    let h = 2166136261; s = String(s);
    for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const shadeS = (hex, f) => {
    if (typeof shade === 'function') return shade(hex, f);
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    if (f < 1){ r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
  };
  const canvasS = (w, h) => {
    if (typeof newCanvas === 'function') return newCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  };
  const outlineS = c => {
    if (typeof outline === 'function') return outline(c);
    const g = c.getContext('2d'), w = c.width, h = c.height, a = g.getImageData(0, 0, w, h).data;
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
    g.fillStyle = PAL.out;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) g.fillRect(x, y, 1, 1);
    return c;
  };

  /* ============================================================================
     type resolution: name -> type index, then colours (vary for hash-picked names)
     ============================================================================ */
  function typeIndex(name){
    if (!ALIAS.__built){
      TYPES.forEach((t, k) => t.names.forEach(n => { ALIAS[n] = k; }));
      ALIAS.__built = true;
    }
    name = String(name == null ? '' : name);
    return Object.prototype.hasOwnProperty.call(ALIAS, name) && name !== '__built' ? ALIAS[name] : hashS(name) % TYPES.length;
  }
  function resolve(name, i){
    const k = typeIndex(name), base = TYPES[k], t = Object.assign({}, base);
    const named = base.names.indexOf(String(name)) >= 0;
    if (!named && base.vary){
      const h = hashS(String(name) + ':' + (i | 0));
      t.top = PAL.tops[h % PAL.tops.length];
      if (base.legs && !base.robe) t.legs = shadeS(t.top, .55);
      if (base.id !== 'boy') t.hair = PAL.hairs[(h >>> 5) % PAL.hairs.length];
      t.skin = PAL.skinHuman[(h >>> 9) % PAL.skinHuman.length];
      if (base.id === 'fishwife') t.legs = shadeS(t.top, .6);
    }
    t.k = k; t.skD = shadeS(t.skin, .8); t.topD = shadeS(t.top, .7); t.topL = shadeS(t.top, 1.22);
    return t;
  }
  function geom(t){
    const legTop = FEET - t.legH + 1, torTop = legTop - t.torH, hd = torTop - 5 + (t.sink || 0);
    const R = t.L + t.W - 1, hx = t.L + ((t.W - 6) >> 1) + (t.hx || 0);
    return {legTop, torTop, hd, R, hx};
  }

  /* ============================================================================
     standing frames (0 idle, 1 cheer, 2 shuffle)
     ============================================================================ */
  const rect = g => (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  function stand(g, t, f){
    const P0 = rect(g), G = geom(t), cheer = f === 1, shuf = f === 2, dx = shuf ? 1 : 0;
    const U = (x, y, w, h, c) => P0(x + dx, y, w, h, c);   // upper body sways with the shuffle
    const {legTop, torTop, hd, R, hx} = G, {L, W, legH, torH} = t;
    const c = Object.assign({P0, U, f, cheer, shuf, dx, L, R, W, hx, hd, torTop, legTop, legH, torH, t}, G);
    const sleeve = t.sleeve || t.topD;

    if (t.back) t.back(c);

    // legs / skirt
    if (!t.robe){
      const lx = L + (W >= 7 ? 1 : 0), rx = R - 1 - (W >= 7 ? 1 : 0), lc = t.legs, lc2 = shadeS(t.legs, .78);
      const leg = (x, lift, col) => { P0(x, legTop, 2, legH - lift, col); P0(x, FEET - lift, 2, 1, PAL.boot); P0(x + 2, FEET - lift, 1, 1, PAL.boot); };
      if (cheer){ leg(lx - 1, 0, lc); leg(rx + 1, 0, lc2); }
      else if (shuf){ leg(lx, 0, lc); leg(rx + 1, 1, lc2); }
      else { leg(lx, 0, lc); leg(rx, 0, lc2); }
    } else {
      const fl = t.flare || 0, rc = t.legs, x0 = L - fl, w0 = W + fl * 2;
      P0(x0, legTop, w0, legH - 1, rc); P0(x0 + w0 - 1, legTop, 1, legH - 1, shadeS(rc, .7));
      P0(x0, FEET - 1, w0, 1, shadeS(rc, .6));
      P0(L + 1, FEET, 2, 1, PAL.boot); P0(R - 2 + (shuf ? 1 : 0), FEET, 2, 1, PAL.boot);
    }

    // back arm
    const aL = t.armLen || (torH - 2), hand = t.glove || t.skin;
    if (cheer){
      U(L - 1, torTop - 1, 1, 3, sleeve); U(L - 2, torTop - 3, 2, 2, t.skin);
    } else {
      const ax = shuf ? L - 2 : L - 1;
      const sl = t.rolled ? Math.min(2, aL) : aL;
      U(ax, torTop + 1, 1, sl, sleeve);
      if (t.rolled && aL > sl) U(ax, torTop + 1 + sl, 1, aL - sl, t.skin);
      U(ax, torTop + 1 + aL, 1, 1, t.skin);
    }

    // torso
    U(L, torTop, W, torH, t.top); U(R, torTop, 1, torH, t.topD); U(L, torTop, W, 1, t.topL);
    if (!t.robe){ U(L, torTop + torH - 1, W, 1, PAL.leather); U(L + 3, torTop + torH - 1, 1, 1, PAL.gold); }
    if (t.body) t.body(c);

    // front arm
    if (cheer){
      U(R + 1, torTop - 1, 1, 3, sleeve);
      if (CFG.mugInSprite){ U(R + 1, torTop - 2, 2, 1, t.skin); U(R, torTop - 6, 3, 1, '#f4ecd0'); U(R, torTop - 5, 3, 3, '#7a5a2a'); }
      else if (!t.fistProp) U(R + 1, torTop - 3, 2, 2, t.skin);
    } else if (t.frontArm){
      U(R + 1, torTop + 1, 1, aL, sleeve); U(R + 1, torTop + 1 + aL, 1, 1, t.skin);
    }

    // neck (tall types) and head
    if (t.sink < 0) U(hx + 2, hd + 5, 2, -t.sink, t.skD);
    U(hx, hd, 6, 5, t.skin); U(hx + 5, hd, 1, 5, t.skD); U(hx, hd + 4, 6, 1, t.skD);
    U(hx + 2, hd + 2, 1, 1, PAL.eye); U(hx + 4, hd + 2, 1, 1, PAL.eye);
    if (cheer) U(hx + 3, hd + 3, 2, 1, PAL.mouth);
    if (t.head) t.head(c);
    if (t.front) t.front(c);
  }

  /* ---- per-type clothes and props for standing frames --------------------- */
  TYPES[0].body = c => {            // old sot: patch, dingy shirt, bottle neck
    const {U, t, L, R, torTop, torH} = c;
    U(L + 3, torTop + 1, 2, torH - 2, t.shirt); U(L + 1, torTop + 2, 2, 2, t.patch);
    U(R - 1, torTop + 1, 1, 2, t.bottle); U(R - 1, torTop, 1, 1, PAL.wood);
  };
  TYPES[0].head = c => {            // bald, white tufts, red nose, stubble
    const {U, t, hx, hd} = c;
    U(hx - 1, hd + 1, 1, 3, t.hair); U(hx, hd + 1, 1, 2, t.hair); U(hx, hd, 5, 1, t.skD);
    U(hx + 6, hd + 2, 1, 2, t.nose); U(hx + 4, hd + 3, 1, 1, t.cheek); U(hx + 1, hd + 4, 4, 1, t.hair);
  };

  TYPES[1].back = c => {            // drover's crook (rises with the cheer)
    const {P0, t, L, hd, cheer} = c, up = cheer ? 2 : 0, x = L - 2;
    P0(x, hd - 2 - up, 1, FEET - hd + 2, t.staff);
    P0(x, hd - 3 - up, 3, 1, t.staff); P0(x + 2, hd - 2 - up, 1, 1, t.staff);
  };
  TYPES[1].body = c => {            // neckerchief, coat buttons
    const {U, t, L, W, torTop, torH} = c;
    U(L + 1, torTop, W - 2, 1, t.scarf); U(L + 3, torTop + 1, 1, 1, t.scarf);
    U(L + 3, torTop + 2, 1, torH + 1, shadeS(t.top, .8)); U(L + 2, torTop + 3, 1, 1, PAL.gold);
  };
  TYPES[1].head = c => {            // wide brim hat, plait
    const {U, t, hx, hd} = c;
    U(hx - 1, hd + 1, 1, 6, t.hair); U(hx - 1, hd + 7, 1, 1, shadeS(t.hair, .6));
    U(hx - 3, hd, 12, 1, t.hat); U(hx - 3, hd, 1, 1, shadeS(t.hat, .7)); U(hx + 8, hd, 1, 1, shadeS(t.hat, .7));
    U(hx, hd - 2, 6, 2, t.hat); U(hx, hd - 1, 6, 1, t.hatBand); U(hx + 1, hd - 2, 3, 1, shadeS(t.hat, 1.25));
  };

  TYPES[2].body = c => {            // braces over a shirt
    const {U, t, L, R, torTop, torH} = c;
    U(L + 1, torTop, 1, torH - 1, t.braces); U(R - 2, torTop, 1, torH - 1, t.braces);
    U(L + 2, torTop + 1, 2, torH - 2, shadeS(t.top, 1.15));
  };
  TYPES[2].head = c => {            // flat cap, stubble
    const {U, t, hx, hd} = c;
    U(hx, hd - 1, 6, 2, t.cap); U(hx + 1, hd - 1, 3, 1, shadeS(t.cap, 1.3)); U(hx + 5, hd, 3, 1, t.capPeak);
    U(hx + 1, hd + 4, 4, 1, t.stubble); U(hx - 1, hd + 1, 1, 2, t.hair);
  };

  TYPES[3].back = c => {            // fiddle in the back hand
    const {P0, t, L, torTop, cheer} = c, up = cheer ? -6 : 0, x = L - 4;
    P0(x + 1, torTop - 2 + up, 1, 3, t.fiddleD);
    P0(x, torTop + 1 + up, 3, 4, t.fiddle); P0(x + 1, torTop + 2 + up, 1, 1, t.fiddleD); P0(x + 2, torTop + 1 + up, 1, 4, shadeS(t.fiddle, .75));
    P0(x - 1, torTop + 4 + up, 1, 1, t.fiddleD);
  };
  TYPES[3].fistProp = false;
  TYPES[3].body = c => {            // rope belt
    const {U, t, L, W, torTop, torH} = c;
    U(L, torTop + torH - 1, W, 1, t.rope); U(L + 3, torTop + torH, 1, 1, t.rope);
  };
  TYPES[3].head = c => {            // messy ginger hair, bandaged ear (the missing one)
    const {U, t, hx, hd} = c;
    U(hx, hd, 6, 2, t.hair); U(hx, hd - 1, 2, 1, t.hair); U(hx + 3, hd - 1, 2, 1, t.hair); U(hx + 5, hd + 1, 1, 1, shadeS(t.hair, .75));
    U(hx - 1, hd + 1, 2, 4, t.hair);
    U(hx - 1, hd + 2, 2, 3, t.bandage); U(hx - 1, hd + 3, 1, 1, t.blood);
  };

  TYPES[4].body = c => {            // habit: collar, cross, clasped hands, sash, bag
    const {U, t, L, R, W, torTop} = c;
    U(L + 1, torTop, W - 2, 1, t.wimple);
    U(L + 3, torTop + 1, 1, 3, PAL.gold); U(L + 2, torTop + 2, 3, 1, PAL.gold);
    U(L, torTop + 3, W, 1, t.sash); U(L + 2, torTop + 4, 2, 1, t.skin);
    U(R + 1, torTop + 3, 2, 3, t.bag); U(R + 1, torTop + 3, 2, 1, shadeS(t.bag, .7));
  };
  TYPES[4].head = c => {            // white wimple and veil
    const {U, t, hx, hd, torTop} = c;
    U(hx - 1, hd - 1, 7, 2, t.wimple); U(hx - 2, hd, 2, 4, t.wimple); U(hx - 3, hd + 4, 3, torTop - hd - 2, t.wimple);
    U(hx + 5, hd, 1, 3, t.wimple); U(hx, hd + 4, 1, 1, t.wimple);
    U(hx - 1, hd + 1, 1, 3, shadeS(t.wimple, .8)); U(hx + 1, hd - 1, 3, 1, '#ffffff');
  };

  TYPES[5].back = c => {            // pickaxe leaning over the shoulder
    const {P0, t, L, hd, torTop, cheer} = c, up = cheer ? -3 : 0;
    for (let k = 0; k < 12; k++) P0(L - 5 + (k >> 2), torTop + 5 - k + up, 1, 1, t.pickHandle);
    const hy = torTop - 7 + up;
    P0(L - 5, hy, 6, 1, PAL.steel); P0(L - 5, hy + 1, 1, 1, PAL.steel); P0(L, hy + 1, 1, 1, PAL.steel); P0(L - 3, hy + 1, 1, 1, PAL.steelD);
  };
  TYPES[5].body = c => {            // leather jerkin straps
    const {U, t, L, R, torTop, torH} = c;
    U(L + 1, torTop, 1, torH - 1, shadeS(t.top, .6)); U(R - 2, torTop, 1, torH - 1, shadeS(t.top, .6));
  };
  TYPES[5].head = c => {            // miner's cap with lamp, big beard
    const {U, t, hx, hd} = c;
    U(hx, hd - 1, 6, 2, t.cap); U(hx + 1, hd - 1, 3, 1, shadeS(t.cap, 1.3)); U(hx - 1, hd + 1, 1, 1, t.cap);
    U(hx + 3, hd - 2, 2, 1, t.lamp); U(hx + 4, hd - 3, 1, 1, t.lampL);
    U(hx, hd + 1, 6, 1, shadeS(t.beard, .85));
    U(hx - 1, hd + 3, 8, 2, t.beard); U(hx, hd + 5, 7, 2, t.beard); U(hx + 1, hd + 7, 4, 1, shadeS(t.beard, .8));
    U(hx + 2, hd + 2, 1, 1, PAL.eye); U(hx + 4, hd + 2, 1, 1, PAL.eye);
  };

  TYPES[6].back = c => {            // shawl behind and the hump
    const {P0, t, L, torTop, legH, torH} = c;
    P0(L - 2, torTop - 1, 4, torH + legH, t.shawl); P0(L - 2, torTop + torH + legH - 2, 4, 1, shadeS(t.shawl, .6));
  };
  TYPES[6].body = c => {            // shawl over the shoulders, hands on a cane
    const {U, t, L, R, W, torTop} = c;
    U(L, torTop, W, 2, t.shawl); U(L + 1, torTop + 2, 1, 1, t.shawl); U(R - 1, torTop + 2, 1, 1, t.shawl);
  };
  TYPES[6].frontArm = true;
  TYPES[6].front = c => {
    const {U, t, R, torTop, cheer} = c, up = cheer ? -3 : 0;
    U(R + 2, torTop + 2 + up, 1, FEET - torTop - 1, t.cane); U(R + 1, torTop + 1 + up, 2, 1, t.cane);
  };
  TYPES[6].head = c => {            // wispy white hair with a bun, hooked nose
    const {U, t, hx, hd} = c;
    U(hx, hd, 6, 1, t.hair); U(hx - 1, hd + 1, 2, 3, t.hair); U(hx - 1, hd - 1, 3, 2, t.hair); U(hx, hd - 2, 2, 1, shadeS(t.hair, .8));
    U(hx + 6, hd + 2, 1, 2, t.nose); U(hx + 5, hd + 4, 1, 1, t.skD);
  };

  TYPES[7].back = c => {            // headscarf knot
    const {U, t, hx, hd} = c;
    U(hx - 2, hd, 2, 3, t.scarf);
  };
  TYPES[7].body = c => {            // bodice, apron with scale flecks
    const {U, t, L, R, torTop, torH, legH} = c;
    U(L + 2, torTop + 2, 4, torH + legH - 4, t.apron); U(L + 2, torTop + 2, 4, 1, shadeS(t.apron, .8));
    U(L + 3, torTop + 4, 1, 1, PAL.steel); U(L + 5, torTop + 6, 1, 1, PAL.steel);
    U(R - 1, torTop + 1, 1, 1, t.topL);
  };
  TYPES[7].head = c => {            // headscarf and fringe
    const {U, t, hx, hd} = c;
    U(hx - 1, hd - 1, 7, 2, t.scarf); U(hx, hd + 1, 1, 2, t.hair); U(hx + 5, hd, 1, 1, shadeS(t.scarf, .75)); U(hx + 1, hd - 1, 3, 1, shadeS(t.scarf, 1.25));
  };
  TYPES[7].fistProp = true;
  TYPES[7].front = c => {           // a fish, held up when cheering
    const {U, t, R, torTop, cheer} = c, fy = cheer ? torTop - 7 : torTop + 3;
    if (cheer){ U(R + 1, torTop - 3, 1, 2, t.skin); }
    else { U(R + 1, torTop + 1, 1, 1, t.topD); U(R + 1, torTop + 2, 1, 1, t.skin); }
    U(R + 1, fy, 2, 4, t.fish); U(R + 2, fy, 1, 4, t.fishD); U(R + 1, fy + 1, 1, 1, PAL.eye);
    U(R, fy + 4, 4, 1, t.fishD);
  };

  /* ============================================================================
     KO frame (frame 3): flat on the floor, head to the left, ground line at row 24
     ============================================================================ */
  function lying(g, t){
    const P = rect(g), th = t.W >= 8 ? 6 : 5, y0 = FEET + 1 - th;
    const headL = 5, torL = t.torH + 1, legL = t.legH + (t.robe ? 4 : 3), len = headL + torL + legL;
    const x0 = Math.max(0, Math.min(HW - len - 1, 10 - (len >> 1))), xT = x0 + headL, xL = xT + torL, hy = y0 + th - 5;
    const c = {P, t, x0, y0, th, xT, xL, torL, legL, hy, len};
    if (t.koBack) t.koBack(c);
    // legs
    const lc = t.legs;
    P(xL, y0 + 1, legL, th - 1, lc); P(xL, y0 + th - 2, legL, 2, shadeS(lc, .75));
    if (t.robe) P(xL + legL - 1, y0 + 1, 1, th - 1, shadeS(lc, .6)); else P(xL + legL - 2, y0 + th - 3, 2, 3, PAL.boot);
    P(xL + legL, y0 + th - 2, 1, 2, PAL.boot);
    // torso and flopped arm
    P(xT, y0, torL, th, t.top); P(xT, y0, torL, 1, t.topL); P(xT, y0 + th - 1, torL, 1, t.topD);
    if (!t.robe) P(xL - 1, y0, 1, th, PAL.leather);
    P(xT + 1, y0 + 2, torL - 2, 1, t.topD); P(xT + torL - 2, y0 + 2, 1, 1, t.skin);
    // head, eyes shut and a bit of hair
    P(x0, hy, 5, 5, t.skin); P(x0, hy + 4, 5, 1, t.skD);
    P(x0 + 3, hy + 1, 1, 1, PAL.eye); P(x0 + 3, hy + 3, 1, 1, PAL.eye); P(x0 + 4, hy + 2, 1, 1, PAL.mouth);
    P(x0, hy, 2, 5, t.hair); P(x0, hy, 5, 1, t.hair);
    if (t.koHead) t.koHead(c);
    if (t.koFront) t.koFront(c);
  }
  TYPES[0].koHead = c => { c.P(c.x0, c.hy, 3, 1, c.t.skD); c.P(c.x0 + 3, c.hy + 2, 1, 1, c.t.nose); };
  TYPES[0].koFront = c => { c.P(c.xT + 1, c.y0 - 1, 3, 1, c.t.bottle); c.P(c.xT + 4, c.y0 - 1, 1, 1, PAL.wood); };
  TYPES[1].koHead = c => { c.P(c.x0 - 0, c.hy, 5, 1, c.t.hair); };
  TYPES[1].koFront = c => {
    const {P, t, x0, y0} = c;
    P(x0, y0 - 1, 6, 1, t.hat); P(x0 + 1, y0 - 2, 4, 1, t.hat); P(x0 + 1, y0 - 1, 4, 1, t.hatBand);
    P(x0 + 6, y0 - 1, c.len - 6, 1, t.staff); P(x0 + c.len - 1, y0 - 2, 1, 1, t.staff);
  };
  TYPES[2].koHead = c => { c.P(c.x0, c.hy, 5, 1, c.t.hair); c.P(c.x0, c.hy + 4, 4, 1, c.t.stubble); };
  TYPES[2].koFront = c => { const {P, t, x0, y0} = c; P(x0 + 6, y0 - 1, 4, 1, t.cap); P(x0 + 10, y0 - 1, 2, 1, t.capPeak); };
  TYPES[3].koFront = c => {
    const {P, t, xL, y0} = c;
    P(c.x0 + 1, c.hy + 1, 2, 3, t.bandage); P(c.x0 + 1, c.hy + 2, 1, 1, t.blood);
    P(xL, y0 - 3, 3, 3, t.fiddle); P(xL + 1, y0 - 2, 1, 1, t.fiddleD); P(xL + 3, y0 - 2, 3, 1, t.fiddleD);
  };
  TYPES[4].koHead = c => { c.P(c.x0, c.hy, 5, 2, c.t.wimple); c.P(c.x0, c.hy + 2, 2, 3, c.t.wimple); c.P(c.x0 + 5, c.hy, 1, 2, c.t.wimple); };
  TYPES[4].koFront = c => { c.P(c.xT + 3, c.y0 + 1, 1, 3, PAL.gold); c.P(c.xT + 2, c.y0 + 2, 3, 1, PAL.gold); c.P(c.xL + 1, c.y0 - 1, 3, 2, c.t.bag); };
  TYPES[5].koHead = c => {
    const {P, t, x0, hy} = c;
    P(x0, hy, 5, 1, t.cap); P(x0 + 2, hy + 2, 3, 3, t.beard); P(x0 + 5, hy + 3, 2, 2, t.beard);
    P(x0 + 3, hy + 1, 1, 1, PAL.eye); P(x0 + 3, hy + 3, 1, 1, PAL.eye);
  };
  TYPES[5].koFront = c => {
    const {P, t, xT, y0} = c;
    P(xT, y0 - 1, c.len - 6, 1, t.pickHandle); P(xT + c.len - 7, y0 - 3, 1, 3, PAL.steel); P(xT + c.len - 8, y0 - 3, 3, 1, PAL.steel);
    P(c.x0, y0 - 1, 3, 1, t.cap); P(c.x0 + 1, y0 - 2, 1, 1, t.lamp);
  };
  TYPES[6].koBack = c => { c.P(c.xT, c.y0 - 1, c.torL, 1, c.t.shawl); };
  TYPES[6].koHead = c => { c.P(c.x0, c.hy - 1, 3, 2, c.t.hair); c.P(c.x0 + 5, c.hy + 2, 1, 2, c.t.nose); };
  TYPES[6].koFront = c => { c.P(c.xL, c.y0 - 1, c.legL + 1, 1, c.t.cane); c.P(c.xL + c.legL, c.y0 - 2, 1, 1, c.t.cane); };
  TYPES[7].koHead = c => { c.P(c.x0, c.hy, 5, 2, c.t.scarf); c.P(c.x0 - 0, c.hy + 2, 1, 1, c.t.hair); };
  TYPES[7].koFront = c => {
    const {P, t, xL, y0} = c;
    P(c.xT + 1, c.y0 + 1, c.torL - 2, 3, t.apron);
    P(xL + 1, y0 - 1, 4, 1, t.fish); P(xL + 5, y0 - 2, 1, 3, t.fishD); P(xL + 2, y0 - 1, 1, 1, PAL.eye);
  };

  /* ============================================================================
     build and cache
     ============================================================================ */
  function build(name, i){
    const t = resolve(name, i);
    return {frames:[], ax:AX, ay:AY, w:HW, h:HH, pat:true, type:t.id, k:t.k, geom:geom(t)};
  }
  function sprite(name, i){
    try {
      const key = String(name) + '#' + (typeIndex(name) < 6 && TYPES[typeIndex(name)].names.indexOf(String(name)) >= 0 ? 0 : (i | 0));
      if (CACHE[key] !== undefined) return CACHE[key];
      return CACHE[key] = build(name, i);
    } catch (e) { return null; }
  }
  function frameIndex(state){
    const k = FRAME.indexOf(String(state));
    return k < 0 ? (state === 'ok' || state === 'walk' ? 0 : state === 'sway' ? 2 : 0) : k;
  }
  function frameFor(r, i, tick){
    try {
      if (r && r.st === 'ko') return 3;
      if (r && r.talkT > 0) return 1;
      return (((tick || 0) / CFG.swapMs + (i | 0)) | 0) % 2 ? 2 : 0;
    } catch (e) { return 0; }
  }
  function draw(ctx, name, i, x, y, scale, state, tick, flip){
    try {
      const spr = sprite(name, i); if (!spr || !ctx) return null;
      const s = scale || 2.1, st = String(state || 'idle'), fr = spr.frames[frameIndex(st)] || spr.frames[0];
      if (!fr) return null;
      let by = 0;
      if (typeof tick === 'number' && st !== 'ko'){
        const ph = (hashS(name) % 100) / 10;
        by = st === 'cheer' ? -Math.abs(Math.sin(tick / 5 + ph)) * 5 * CFG.bobScale * (s / 2.1) : Math.sin(tick / 22 + ph) * 0.8 * CFG.bobScale * (s / 2.1);
      }
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(x), Math.round(y + by));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(fr, Math.round(-spr.ax * s), Math.round(-spr.ay * s), Math.round(spr.w * s), Math.round(spr.h * s));
      ctx.restore();
      return spr;
    } catch (e) { try { ctx.restore(); } catch (e2) {} return null; }
  }
  function portraitURL(patron){
    try {
      if (!patron) return '';
      const name = patron.name, i = typeof patron.id === 'number' && patron.id < 0 ? -1 - patron.id : 0;
      const key = String(name) + '#' + i;
      if (PORT[key] !== undefined) return PORT[key];
      const spr = sprite(name, i); if (!spr || !spr.frames || !spr.frames.length) return PORT[key] = '';
      const S = CFG.portraitSize, K = CFG.portraitScale, G = spr.geom, t = TYPES[spr.k];
      const bottom = G.torTop + t.torH, top = bottom - S, left = G.hx + 3 - (S >> 1);
      const cv = canvasS(S * K, S * K), g = cv.getContext('2d');
      g.fillStyle = PAL.wall; g.fillRect(0, 0, S * K, S * K);
      g.fillStyle = PAL.wallD; g.fillRect(0, 0, S * K, 3 * K);
      g.imageSmoothingEnabled = false;
      g.drawImage(spr.frames[0], left, top, S, S, 0, 0, S * K, S * K);
      const url = cv.toDataURL('image/png');
      return PORT[key] = (typeof url === 'string' && url.indexOf('data:') === 0) ? url : '';
    } catch (e) { return ''; }
  }

  const API = {sprite, draw, portraitURL, frameFor, types:() => TYPES.map(t => t.label), PAL, CFG, TYPES};
  if (typeof window !== 'undefined') window.PATRON_ART = API;
  else if (typeof globalThis !== 'undefined') globalThis.PATRON_ART = API;
})();
