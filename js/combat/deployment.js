/* js/combat/deployment.js (INT-1 step 2, 2026-11-16): THE DEPLOYMENT: one contract in the field.
   Cut unchanged from the inline script in index.html (old lines 1959 to 3030). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   THE DEPLOYMENT - one contract in the field
============================================================================ */
const TAU = Math.PI * 2;
const PX_PER_MOVE = 0.58;
const BASE_RADIUS = 118;             // 3-Hex Command Radius
const HEX_PX = 39;
const ROUND = 360;                   // one tabletop round = 6 seconds
const MAX_ENEMIES = 300, CULL_DIST = 1500;
const rnd = (a,b) => a + Math.random()*(b-a);
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
let canvas, ctx, VW = 1000, VH = 620;
/* A2 world zoom (audits/art/a1a2-squad-read.md, UX audits/uiux/a1a2-hud-check.md). Only the world layer is zoomed; the HUD
   keeps its size. Z = clamp(min(screen w / perW, screen h / perH), min, max). Since Q103 (Patrick Q107 A, 22 Nov) min = max = 1.4, so Z is 1.4 at
   every window size and the width and height terms no longer matter. window.ZOOM_A2 = false turns it off (Z = 1). */
const ZOOM = {perW: 1000, perH: 560, min: 1.4, max: 1.4};   /* Q103 (Patrick Q107 A, AD/GD q103-vision.md): fixed at 1.4 at every window size, so a figure is as tall in the field as in the camp; camView stays */
const SCRN = {w: 0, h: 0};                  // the main canvas's CSS size at the last draw (HUD passes swap VW and VH)
const CAMZ = {on: false, dy: 0, z: 1, cls: ''};   // on: inside a zoomed world pass (VW, VH and camDY() are world px); cls 'H': hold text
function camZoom(sw, sh){
  if (window.ZOOM_A2 === false || !(sw > 0 && sh > 0)) return 1;
  const k = Math.min(sw / ZOOM.perW, ZOOM.perH > 0 ? sh / ZOOM.perH : Infinity);
  return Math.max(ZOOM.min, Math.min(ZOOM.max, k));
}
/* The one camera: {x, y} world px at the screen's top left, z, w and h the view in world px, sw and sh the screen.
   Screen px = (world - x) * z. The Leader stays on the same screen row as at Z 1 (camDY is screen px, so it is divided by Z). */
function camView(sw, sh){
  sw = sw || SCRN.w || VW; sh = sh || SCRN.h || VH;
  const z = camZoom(sw, sh), w = sw / z, h = sh / z, L = typeof G !== 'undefined' && G && G.leader;
  let dy = 0;
  if (CAMZ.on) dy = CAMZ.dy;
  else if (L){ const v0 = VW, h0 = VH; VW = sw; VH = sh; try { dy = camDYScreen() / z; } finally { VW = v0; VH = h0; } }
  return {x: L ? Math.round(L.x - w / 2) : 0, y: L ? Math.round(L.y - h / 2 - dy) : 0, z, w, h, sw, sh, dy};
}
function camK(){ const v = camView(); return v.z * VW / v.sw; }          // world px to the current drawing unit (a HUD pass may scale)
function camToScreen(wx, wy){ const v = camView(); return {x: (wx - v.x) * v.z, y: (wy - v.y) * v.z}; }   // screen CSS px
/* Draw fn in world space at screen time (an overlay drawn from drawHUD): the zoomed transform, VW and VH in world px. */
function camWorld(fn){
  const v = camView(), vw = VW, vh = VH, on = CAMZ.on, dy = CAMZ.dy;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(v.z, v.z); ctx.translate(-v.x, -v.y);
  const z0 = CAMZ.z; VW = v.w; VH = v.h; CAMZ.on = true; CAMZ.dy = v.dy; CAMZ.z = v.z;
  try { return fn(v); } finally { ctx.restore(); VW = vw; VH = vh; CAMZ.on = on; CAMZ.dy = dy; CAMZ.z = z0; }
}
/* World text under the zoom (UX a1a2-hud-check.md section 4). Drawn in the zoomed world, a font would grow by Z. Class G (the
   default: labels, damage numbers) grows at most 1.25 times, and a word (two letters or more) is never under 14 screen px.
   Class H (CAMZ.cls = 'H': pop words, barks, No mark) keeps today's screen size. The text is scaled about its anchor;
   measureText answers in the same scale, so a box sized from it still fits. Text drawn at any other transform is left alone. */
/* UX text floor (audits/uiux/text-floor-1280-ruling.md item 4): the 14 is screen px, after the canvas's CSS stretch (camStretch: screen px per
   drawing unit at this transform's scale 1, kept for the frame), and it holds at Z 1 too. ROLLBACK: window.FLOOR14 = false (14 canvas px, zoom only). */
const CAMST = {f: -1, v: 1};
function camStretch(c, s){
  const fr = (typeof G !== 'undefined' && G && G.frame) | 0; if (CAMST.f === fr && CAMST.c === c.canvas) return CAMST.v;
  const v = typeof hudScreenK === 'function' ? hudScreenK(c) / (s || 1) : 1; CAMST.f = fr; CAMST.c = c.canvas; CAMST.v = v > 0 && isFinite(v) ? v : 1; return CAMST.v;
}
function camTextK(c, t){
  const fl = window.FLOOR14 !== false;
  if (!CAMZ.on || !(fl || CAMZ.z > 1.001) || c !== ctx) return 1;
  const m = c.getTransform(), s = Math.hypot(m.a, m.b); if (Math.abs(s - CAMZ.z) > 0.02) return 1;
  if (CAMZ.cls === 'S') return 1;
  const f = parseFloat((/(\d+(?:\.\d+)?)px/.exec(c.font) || [])[1]); if (!(f > 0)) return 1;
  let tgt = f;
  if (CAMZ.cls !== 'H'){ tgt = Math.min(f * s, f * 1.25); if (/[A-Za-z]{2}/.test(String(t))) tgt = Math.max(tgt, fl ? 14 / camStretch(c, s) : 14); }
  const q = tgt / (f * s); return Math.abs(q - 1) < 1e-3 ? 1 : q;
}
function camTextHook(c){
  if (!c || c.__a2t) return; c.__a2t = true;
  for (const n of ['fillText', 'strokeText']){ const o = c[n];
    c[n] = function(t, x, y, mw){ const q = camTextK(this, t);
      if (q === 1) return mw === undefined ? o.call(this, t, x, y) : o.call(this, t, x, y, mw);
      this.save(); this.translate(x, y); this.scale(q, q);
      try { return mw === undefined ? o.call(this, t, 0, 0) : o.call(this, t, 0, 0, mw / q); } finally { this.restore(); } }; }
  const mt = c.measureText;
  c.measureText = function(t){ const r = mt.call(this, t), q = camTextK(this, t); if (q === 1) return r;
    return {width: r.width * q, actualBoundingBoxLeft: (r.actualBoundingBoxLeft || 0) * q, actualBoundingBoxRight: (r.actualBoundingBoxRight || 0) * q,
      actualBoundingBoxAscent: (r.actualBoundingBoxAscent || 0) * q, actualBoundingBoxDescent: (r.actualBoundingBoxDescent || 0) * q,
      fontBoundingBoxAscent: (r.fontBoundingBoxAscent || 0) * q, fontBoundingBoxDescent: (r.fontBoundingBoxDescent || 0) * q}; };
}
function camDY(){ return CAMZ.on ? CAMZ.dy : camDYScreen(); }
function camDYScreen(){ if (window.DECK && DECK.camDY && typeof G !== 'undefined' && G && G.leader) return DECK.camDY();   /* INDEX HD1: the standard on the open field above the band */
  return (typeof VO3 !== 'undefined' && VO3.on && VO3.K && VO3.K.frameDown) ? Math.round(VH * VO3.K.frameDown) : 0; }   /* camera standard (game-bible.md): the target sits below the character */
let G = null;
const keys = {};
let GROUP = 1;

function startDeployment(contract, mateIds){
  const L = META.leader, ls = leaderStats(L), g = META.gear;
  const armour = gear(g.armour), melee = gear(g.melee), ranged = gear(g.ranged), shield = gear(g.shield);
  const kits = g.kits.map(gear);
  const squadMates = META.roster.filter(p => mateIds.includes(p.id));
  let mount = gear(g.mount), noMountWhy = '';
  if (mount.id !== 'nomount' && (RACES[L.race].noMount || squadMates.some(p => RACES[p.race].noMount))){
    mount = gear('nomount'); noMountWhy = 'A Firbolg cannot ride. The horses stay in camp.';
  }
  const shieldMax = Math.min(7, shield.pool + (kits.some(k => k.id === 'towershield') ? 3 : 0) + (mastery('carpentry') ? 2 : 0));
  contract.seed = contract.seed || (Math.random() * 1e9 | 0);
  MAP = generateMap(contract);
  const edges = contract.edges || [];

  G = {
    contract, obj:contract.obj, edges, frame:0, sec:0, over:false, paused:false,
    armour, melee, ranged, shield, kits, mount,
    wards:0, shieldPool:shieldMax, shieldMax, mountPool:(mount.pool||0) + (mount.pool && mastery('stables') ? 2 : 0), mountMax:(mount.pool||0) + (mount.pool && mastery('stables') ? 2 : 0), mounted:mount.id!=='nomount',
    formation:'OPEN', facing:0, braceT:0,
    coin:0, coinSpent:0, xp:0, xpNext:60, lvl:0, streak:0, streakT:0, orders:{}, momChoice:null, kills:0, bossKills:0,
    ranks:{}, mod:{}, luck:ls.luck, nudge:0, burn:0, shaken:0, broken:0, moraleCd:0, momentumKills:0, blessT:0,
    stormT:0, smokeT:0, fogT:0, witherT:0, baneT:0, stagger:0, chargeRun:0, chargeT:0, lastAng:0,
    enemies:[], pickups:[], shots:[], eshots:[], hazards:[], fires:[], works:[], fx:[], msgs:[],
    caches:MAP.caches, blips:MAP.blips, vaults:MAP.vaults, camps:MAP.camps,
    spawnClock:1, bossesDone:[false,false], alarm:0, exitOpen:false, payDuesUsed:false, grace:0, shake:0, flash:0,
    hired:[], prisoners:[], commandersDefeated:[], slainFactions:[], captivesFreed:0, downedIds:new Set(), result:null, levelQueue:0, flow:null, showMini:true, abilQ:[], illusionT:0, lastContact:-999, slowmo:0, tick:0, absorbFx:0, wardFx:0
  };
  G.leader = {
    p:L, s:ls, x:(MAP.start.x + .5) * CELL, y:(MAP.start.y + .5) * CELL, con:ls.con, maxCon:ls.con, wounds:ls.maxWounds, maxWounds:ls.maxWounds,
    spec:L.spec, timer:20, atkT:0, anim:{left:false}, flash:0, isLeader:true, spr:personSprite(L, true)
  };
  G.squad = squadMates.map((p, i) => runMate(p, i));
  buildAbilities();
  for (const id of L.picks) G.ranks[id] = 1;
  for (const m of squadMates) for (const id of (m.picks || [])) G.ranks[id] = Math.max(G.ranks[id] || 0, 1);   // abilities Squad Mates have learnt
  for (const d of DOCTRINES) if (d.card && hasDoc(d.id)) G.ranks[d.card] = Math.max(G.ranks[d.card] || 0, 1);
  recompute();
  G.flow = bfsFrom(G.leader.x, G.leader.y);

  let w = ls.wards + (has('armoury') ? 1 : 0) + (armour.ward||0) + (kits.some(k=>k.id==='focus') ? 1 : 0) + (G.mod.warded ? 1 : 0);
  for (const m of G.squad) w += mateFeatures(m.p).ward;
  w += (mastery('kitchen') ? 1 : 0) + (mastery('armoury') ? 1 : 0) + (allied('mendor') ? 1 : 0) + (perk('liberation', 9) ? 2 : 0);
  G.wards = Math.min(4, w);

  // Contract Edges from the War Council (Table 4.2)
  if (edges.includes('recon')){ revealAll(); for (const b of G.blips) b.known = d6(); }
  if (META.intel === 'full' && !edges.includes('recon')){ revealAll(); for (const b of G.blips) b.known = d6(); note('Your prisoner talked: the whole map is known.'); }
  if (META.intel === 'blips') for (const b of G.blips) b.known = b.known || d6();
  META.intel = null;
  if (mastery('ranger')) for (const b of G.blips) b.known = b.known || d6();
  if (allied('skulk') && G.blips.length){ const b = G.blips.find(x => !x.known); if (b) b.known = d6(); }
  // free caches from veteran staff and allies
  const gifts = [];
  if (mastery('engineering')) gifts.push('cusser'); if (allied('reprobates')) gifts.push('cusser');
  if (mastery('alchemy')) gifts.push('smoke'); if (mastery('magetower')) gifts.push('scroll');
  gifts.forEach((k, i) => G.caches.push({x:G.leader.x - 60 + i * 40, y:G.leader.y + 50, kind:k, opened:false}));
  if (edges.includes('asset')) for (let i = 0; i < 2; i++) G.caches.push({x:G.leader.x + (i ? 50 : -50), y:G.leader.y - 40, kind:'poultice', opened:false});
  if (edges.includes('approach')){ G.fogT = G.fogWard = 90 * 60; addWard(2); }   /* fogWard: bought fog keeps the flat ward (js/combat/terrain.js) */

  // Garrisons: commanders in their camps, guards at the strongboxes. They wait until disturbed.
  const HST = HOSTS[contract.host] || HOSTS.bandits, pool = HST.bosses[contract.tier].slice().sort(() => Math.random() - .5);
  G.camps.forEach((c, i) => {
    const k = pool[i % pool.length], grp = GROUP++;
    c.boss = spawnEnemy(k, c.x, c.y, {dormant:true, group:grp, home:c});
    for (const gk of BESTIARY[k].guards || []){ const a = Math.random() * TAU, d = rnd(40, 110);
      spawnEnemy(gk, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, {dormant:true, group:grp}); }
  });
  const guardPool = HST.pools[contract.tier];
  for (const v of G.vaults){ const grp = GROUP++;
    for (let i = 0; i < 3 + contract.tier; i++){ const a = Math.random() * TAU, d = rnd(30, 120);
      spawnEnemy(guardPool[Math.random() * guardPool.length | 0], v.x + Math.cos(a) * d, v.y + Math.sin(a) * d, {dormant:true, group:grp}); } }

  // The road is never empty: an opening wave already closing in.
  if (!['defend','siege','night','sortie'].includes(contract.obj)) for (let i = 0; i < 8; i++){ const a = i/8*TAU + rnd(-.3,.3), d = rnd(250, 330);
    const p = {x:G.leader.x + Math.cos(a) * d, y:G.leader.y + Math.sin(a) * d}; if (!blockedXY(p.x, p.y)) spawnEnemy(HST.pools[1][0], p.x, p.y); }
  setupContract(contract);
  placeTraps(contract);
  if (cmIs('OUTCAST')){ const b = G.blips.find(x => !x.known); if (b) b.known = d6(); const tr = (G.traps || []).find(x => !x.seen); if (tr) tr.seen = true;
    if (b || tr) note(`${ensureMaster().name}'s street contacts sent word: ${[b ? 'a Blip Token' : '', tr ? 'a trap' : ''].filter(Boolean).join(' and ')} marked on your map.`); }

  revealAround(G.leader.x, G.leader.y, Math.ceil(visionR() / CELL));   /* Index 49 */
  tip('move');
  note(`${OBJECTIVES[contract.obj].name}${contract.patron ? " " + forPatron(contract.patron) : ""}. Enemy: ${HST.name}.`);
  if (edges.length) note('Contract Edges: ' + edges.map(e => EDGES.find(x => x.id === e).name).join(', ') + '.');
  if (noMountWhy) note(noMountWhy);
  hideAll(); resize();
  requestAnimationFrame(loop);
}

function runMate(p, i){
  const s = mateStats(p), L = G.leader;
  return {p, s, x:L.x + rnd(-20,20), y:L.y + rnd(-20,20), con:s.con, maxCon:s.con, state:'up', slot:i,
          timer:20 + i*7, hold:0, atkT:0, inF:true, bleedT:0, stabT:0, flash:0, healCd:240,
          anim:{left:false}, spec:p.spec, spr:personSprite(p, false)};
}

/* ---------------------------------------------------------------------------
   DERIVED MODIFIERS from tactics cards
--------------------------------------------------------------------------- */
const rank = id => G.ranks[id] || 0;
function recompute(){
  const m = G.mod = {};
  for (const c of CARDS) m[c.id] = rank(c.id);
  m.radius = BASE_RADIUS + rank('radius')*22 + (G.mounted && G.mount && /Command Radius \+1 hex/.test(G.mount.note || '') ? HEX_PX : 0);   /* Patrick, Q66: only a mount whose card says so */
  m.speed  = 1 + rank('scout')*0.09;
  m.loot   = 1 + rank('plunder')*0.30;
  if (m.thornwise && !m.briar) m.briar = 1;
  m.briarDmg = m.briar + (m.thornwise ? 1 : 0);
}

/* ---------------------------------------------------------------------------
   OBJECTIVES
--------------------------------------------------------------------------- */
function progress(){
  const pc = contractProgress(); if (pc !== null) return pc;
  if (G.obj === 'hold') return Math.min(1, G.sec / (G.contract.minutes * 60));
  if (G.obj === 'hunt') return G.camps.filter(c => c.done).length / Math.max(1, G.camps.length);
  const v = G.vaults.filter(v => v.done).length / Math.max(1, G.vaults.length);
  return G.exitOpen ? Math.min(1, 0.9 + 0.1 * v) : v * 0.9;
}
function checkObjective(){
  if (contractCheck()) return;
  if (G.obj === 'hold' && G.sec >= G.contract.minutes * 60) return endDeployment('victory');
  if (G.obj === 'hunt' && G.camps.length && G.camps.every(c => c.done) && !G.winT){ const wn = window.CF ? CF.raidWin() : 'The last commander is dead. The field is yours.'; if (wn){ G.winT = 150; if (typeof wn === 'string') note(wn); } }
  if (G.obj === 'extract' && G.exitOpen && dist(G.leader, MAP.exit) < 70) return endDeployment('victory');
  if (G.winT && --G.winT <= 0) endDeployment('victory');
}

/* ---------------------------------------------------------------------------
   MAIN LOOP
--------------------------------------------------------------------------- */
function loop(){
  if (!G) return;
  if (!G.paused && !G.over){
    G.tick = (G.tick || 0) + gameSpeed() * (G.slowmo > 0 ? 0.35 : 1) * momentumSlow() * (G.cutscene ? 0 : 1);
    if (G.slowmo > 0) G.slowmo--;
    while (G.tick >= 1 && !G.over && !G.paused){ G.tick -= 1; update(); }
  }
  if (G) draw();
  if (G && !G.over) requestAnimationFrame(loop);
}

function canBrace(){ return G.stagger <= 0; }
function update(){
  const L = G.leader, f = ++G.frame;
  if (f % 60 === 0) G.sec++;
  for (const k of ['nudge','burn','shaken','broken','moraleCd','grace','shake','flash','blessT','stormT','smokeT','fogT','fogWard','witherT','baneT','stagger','chargeT','illusionT']) if (G[k] > 0) G[k]--;
  if (G.formation === 'SHIELD' && !canBrace()){ G.formation = 'OPEN'; pop(L.x, L.y-30, 'STAGGERED: NO SHIELD WALL', '#ff8a7a'); }
  const shieldWall = G.formation === 'SHIELD';

  // ---- Brace (6.4): while the shields are locked, up to 2 Shield Pool comes back each round.
  // A Firbolg In Formation makes it 3 (Gentle Titan).
  if (shieldWall){
    G.braceT++;
    if (G.braceT % ROUND === 0){
      const per = G.squad.some(m => m.state === 'up' && m.inF && RACES[m.p.race].brace3) || RACES[L.p.race].brace3 ? 3 : 2;
      if (hasDoc('shieldlock')) addWard(1);                         // Shield Wall Lock: a Ward Token every round Braced
      if (G.frame - G.lastContact < 90){ pop(L.x, L.y - 30, 'ENGAGED: NO SHIELD WALL', '#ff8a7a'); if (!G.noBraceF || G.frame - G.noBraceF >= 180) G.noBraceF = G.frame; }   /* UX e6e0979f: the stance badge flashes #ff8a7a twice over 600 ms (36 frames), at most once per 3 s */
      else if (G.shieldPool < G.shieldMax){ const n = Math.min(per, G.shieldMax - G.shieldPool); G.shieldPool += n; pop(L.x, L.y - 30, '+' + n + ' SHIELD POOL', '#d4af37'); SFX.play('brace'); }
    }
  } else G.braceT = 0;
  if (shieldWall && G.mod.shieldwall && f % 240 === 0) addWard(1);
  if (G.mod.litany && f % ((12 - G.mod.litany*3)*60) === 0) addWard(1);
  if (G.mod.rally && f % ((36 - G.mod.rally*8)*60) === 0){ addWard(2); pop(L.x, L.y-30, 'RALLYING CRY', '#d4af37'); }
  if (G.mod.warded && f % 1200 === 0) addWard(1);
  if (G.mod.fieldmed && f % ((10 - G.mod.fieldmed*2)*60) === 0 && L.wounds < L.maxWounds) L.wounds++;
  if (G.mod.masscure && f % ((12 - G.mod.masscure*3)*60) === 0)
    for (const m of G.squad) if (m.state === 'up' && m.con < m.maxCon){ m.con++; pop(m.x, m.y-14, '+1', '#6fa37a'); }
  if (G.mod.bless && f % 1200 === 0){ G.blessT = (G.mod.bless*4+2)*60; pop(L.x, L.y-34, 'BLESS THE LINE', '#e3cf8a'); }

  // ---- Leader movement, terrain, and the Charge
  let dx = (keys.d ? 1:0) - (keys.a ? 1:0), dy = (keys.s ? 1:0) - (keys.w ? 1:0);
  if (L.down){ dx = dy = 0; updateLeaderDown(); if (G.over) return; }
  if (G.snareT > 0 && !b2Slip()){ dx = dy = 0; }   /* Index 39 */
  const mountMul = G.mounted ? G.mount.spd : 1;
  const base = Math.max(3, L.s.move + G.armour.mv) * PX_PER_MOVE * G.mod.speed * mountMul * seasonSlow(L) * (G.shaken ? 0.85 : 1) * (G.witherT && !b2Slip() ? 0.75 : 1)
    * (mastery('training') && f < ROUND ? 1.15 : 1) * (mastery('leather') && G.armour.light ? 1.05 : 1) * (G.carrying ? 0.8 : 1) * (G.trapSlow > 0 && !b2Slip() ? 0.6 : 1);
  const cellL = cellAt(L.x, L.y);
  const terr = (G.mod.scout && (cellL === T.FOREST || cellL === T.RUBBLE)) ? 1 : (SLOW[cellL] || 1);
  const lspd = base * terr * (shieldWall ? 0.55 : 1);
  L.moving = !!(dx || dy);
  if (L.moving){
    const n = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    L.x += dx/n*lspd; L.y += dy/n*lspd; collide(L, 10, true);
    // Charge (6.4): a clear straight run of at least 2 hexes, no difficult terrain, shifts melee up 1 step
    const straight = Math.abs(((ang - G.lastAng + Math.PI*3) % TAU) - Math.PI) < 0.3;
    G.chargeRun = (straight && !shieldWall && terr === 1 && !SLOW[cellL]) ? G.chargeRun + 1 : 0;
    if (G.chargeRun >= 45){ if (!G.chargeT){ G.chargeAnnounce = true; if (!(window.T45 && T45.holdCharge && T45.holdCharge())) tip('charge'); } G.chargeT = 30; }
    G.facing = ang; G.lastAng = ang; if (dx && !(L.faceT > 0)) L.anim.left = dx < 0;
  } else G.chargeRun = 0;

  if (f % 20 === 0){ G.flow = bfsFrom(L.x, L.y, G.flow); G.fflow = MAP.g.includes(T.GATE) ? bfsFrom(L.x, L.y, G.fflow, true) : G.flow; }
  if (f % 6 === 0) revealAround(L.x, L.y, Math.ceil(visionR() / CELL));   /* Index 49 */

  updateMates(shieldWall);
  updateAbilities();
  if (f === 600) tip('abilities');
  if (L.atkT > 0) L.atkT--; if (L.faceT > 0) L.faceT--; if (L.flash > 0) L.flash--;
  if (!G.broken && !L.down){ if (window.F33 && F33.manual()) F33.leaderTick(L, shieldWall); else unitAttack(L, true, shieldWall); if (!shieldWall && L.timer > 0 && L.timer % 5 === 0) L.timer--; }
  runSpells();
  separate();
  updateEnemies(shieldWall);
  if (G.over) return;
  updateEnemyShots(shieldWall);
  updateHazards(shieldWall);
  if (G.over) return;
  updateShots();
  updateWorks();
  updatePickups();
  updateMapObjects();
  updateContract();
  updateTraps();
  for (const x of G.fx){ if (x.vx !== undefined){ x.x += x.vx; x.y += x.vy; } x.life--; }
  G.fx = G.fx.filter(x => x.life > 0);
  spawn();
  checkObjective();
}
// The horses are lost: everyone is thrown, and the animals bolt.
function unhorse(){
  if (!G.mounted) return;
  G.mounted = false; G.mountMax = 0; G.mountPool = 0; G.unhorsed = G.mount.id; recompute();
  note('The squad is unhorsed and fights on foot. The horses bolt.'); G.shake = 14; SFX.play('down');
  for (const u of squadUnits()){ const a = Math.random() * TAU;
    G.fx.push({horse:true, k:G.mount.id, x:u.x, y:u.y + 8, vx:Math.cos(a) * 3.2, vy:Math.sin(a) * 1.6, life:90});
    pop(u.x, u.y - 22, 'THROWN', '#ff8a7a'); u.flash = 10; }
}
function addWard(n){ G.wards = Math.min(4, G.wards + n); G.wardFx = 30; }

/* ---------------------------------------------------------------------------
   THE SQUAD - Open Order and Shield Wall slots. Each mate walks at their own
   racial Move, and finds their way round walls on the shared flow field.
--------------------------------------------------------------------------- */
function slotTarget(i, n, shieldWall){
  const L = G.leader;
  if (shieldWall){ const a = i * TAU / Math.max(1, n); return {x: L.x + Math.cos(a)*34, y: L.y + Math.sin(a)*30}; }
  // Open Order: a loose ring through the Command Radius, so a 7-hex blast
  // catches one or two models rather than the whole squad (Section 6.11).
  const a = G.facing + Math.PI + (i - (n - 1) / 2) * (TAU / Math.max(3, n + 1)), r = Math.min(G.mod.radius * 0.6, 58 + (i % 2) * 16);
  return {x: L.x + Math.cos(a) * r, y: L.y + Math.sin(a) * r * 0.85};
}
function updateMates(shieldWall){
  const L = G.leader, live = G.squad.filter(m => m.state === 'up');
  live.forEach((m, i) => {
    if (m.hold > 0) m.hold--; if (m.atkT > 0) m.atkT--; if (m.flash > 0) m.flash--;
    let t = slotTarget(i, live.length, shieldWall);
    if (m.job && window.TRAP2E){ const q = TRAP2E.target(m); if (q) t = q; }   /* S6-11 (2e): a Scoundrel sent to a trap walks to it, not to his place */
    if (window.F33 && F33.rushOn && F33.rushOn(m)) t = F33.rushPoint(m);   /* P23-E3: the squad charge: to the Leader's target, not to the place */
    if (L.down){ const nearestUp = live.slice().sort((a, b) => dist(a, L) - dist(b, L))[0];
      if (nearestUp === m) t = {x:L.x, y:L.y}; }
    // keep the spot clear of walls, or the mate is pushed out and walks back in all day
    const nearWall = q => [[0,0],[11,0],[-11,0],[0,11],[0,-11]].some(([ox, oy]) => blockedXY(q.x + ox, q.y + oy));
    for (let k = 0; k < 8 && nearWall(t); k++) t = {x:t.x + (L.x - t.x) * 0.3, y:t.y + (L.y - t.y) * 0.3};
    if (nearWall(t)) t = {x:L.x, y:L.y};
    if (window.TRAP2E && TRAP2E.avoid && !L.down && !(m.hold > 0)){ const q = TRAP2E.avoid(m, t); if (q && !nearWall(q)) t = q; }   /* 14a: round a spotted trap, never onto it */
    const cm = cellAt(m.x, m.y), terr = (G.mod.scout && (cm === T.FOREST || cm === T.RUBBLE)) ? 1 : (SLOW[cm] || 1);
    let spd = Math.max(3, m.s.move + G.armour.mv) * PX_PER_MOVE * 1.12 * G.mod.speed * terr
              * (G.mounted ? G.mount.spd : 1) * seasonSlow(m) * (G.shaken ? 0.85 : 1) * (G.witherT && !b2Slip() ? 0.75 : 1) * (G.trapSlow > 0 && !b2Slip() ? 0.6 : 1)
              // Double-time: a mate falling behind the Leader hurries to catch up, so short legs lag but are never left behind
              * (1 + Math.max(0, Math.min(0.7, (dist(m, L) - G.mod.radius * 0.55) / (G.mod.radius * 0.6))));
    let ddx = t.x - m.x, ddy = t.y - m.y, dd = Math.hypot(ddx, ddy) || 1;
    // Stuck on terrain: if the straight line to the spot is blocked, or the mate
    // has not closed on it for most of a second, follow the flow field back to
    // the Leader (walls, water, buildings and palisades are all routed round).
    const want = dd;
    if (m.hold <= 0 && want > 14){ if (want > (m.lastD || 1e9) - 0.25) m.stuckT = (m.stuckT || 0) + 1; else m.stuckT = Math.max(0, (m.stuckT || 0) - 2); }
    else m.stuckT = 0;
    m.lastD = want;
    if (m.stuckT > 40) m.pathT = 90;
    if (m.pathT > 0) m.pathT--;
    if ((dist(m, L) > 60 && !clearLine(m, L)) || (want > 20 && !clearLine(m, t, 12)) || m.pathT > 0){
      const fd = flowDir(G.fflow || G.flow, m.x, m.y); if (fd){ ddx = fd.x; ddy = fd.y; dd = 1; m.viaFlow = true; } }
    else m.viaFlow = false;
    m.moving = dd > 4 && m.hold <= 0;
    if (m.faceT > 0) m.faceT--;
    if (m.hold <= 0 && (dd > 3 || m.viaFlow)){ const step = m.viaFlow ? spd : Math.min(spd, dd*0.2); m.x += ddx/dd*step; m.y += ddy/dd*step;
      // turn only on a real step, and never straight after an attack (no flicker when standing still)
      if (!(m.faceT > 0) && dd > 10 && Math.abs(ddx) > 6) m.anim.left = ddx < 0; }
    if (m.moving && dd < 7) m.moving = false;
    collide(m, 9, true);
    const was = m.inF;
    m.inF = dist(m, L) <= G.mod.radius;
    if (was && !m.inF) pop(m.x, m.y-20, 'OUT OF FORMATION', '#d47a6a');
    // Everyone keeps fighting while they move; a mate catching up just does not stop to plant their feet.
    if (!G.broken) unitAttack(m, false, shieldWall);
    if (dist(m, L) > G.mod.radius * 0.85) m.hold = Math.min(m.hold, 3);
  });
  // Bleeding Out (6.9): roll 1d6 every MATE_BLEED_T frames, 1-3 dies. Stand on them to Stabilise.
  // PD-39 (Patrick Q45 B, 2026-11-16): a downed Squad Mate takes 25% longer to bleed out, every squad: 8 s -> 10 s [S].
  for (const m of G.squad){
    if (m.state !== 'bleeding' && m.state !== 'stable') continue;
    if (dist(m, L) < 40){
      if (G.mod.getback){ standUp(m, 'BACK IN THE FIGHT'); continue; }
      if (m.state === 'bleeding' && ++m.stabT >= (hasDoc('fieldmed') ? 22 : 45)){ m.state = 'stable'; pop(m.x, m.y-18, 'STABILISED', '#6fa37a'); }
      continue;
    }
    if (m.state === 'bleeding' && ++m.bleedT % MATE_BLEED_T === 0){
      const r = d6();
      if (r <= 3){ m.state = 'dead'; pop(m.x, m.y-18, m.p.name.toUpperCase() + ' DIES', '#b22222');
        note(`${m.p.name} bled out in the mud (Bleeding Out roll ${r}).`); G.shake = 14; }
      else pop(m.x, m.y-18, 'CLINGING ON', '#c8a24a');
    }
  }
}
var MATE_BLEED_T = 600;   /* PD-39: frames between a downed mate's Bleeding Out rolls (was 480, 8 s at 60 fps) */
function standUp(m, label){ m.state = 'up'; m.con = 1; m.stabT = 0; m.hold = 0; pop(m.x, m.y-18, label, '#6fa37a'); }

/* ---------------------------------------------------------------------------
   ATTACKS - each Specialty fights the way it did in the original game,
   resolved on the Shifted d6 ladder.
   Bracing (Shield Wall) forgoes the squad's attack: only casters still cast,
   and Soldiers with Shield Wall Mastery still swing (6.4, Table 2.8).
--------------------------------------------------------------------------- */
function stepBonus(u, isMelee){
  let s = 0;
  if (isMelee) s += G.mod.vanguard;
  if (isMelee && G.chargeT > 0 && (u === G.leader || u.inF)) s += 1;          // Charge
  if (cellAt(u.x, u.y) === T.HILL) s += 1;                                    // Elevation
  if (G.shaken) s -= 1;
  if (G.blessT > 0) s += 1;
  if (G.stormT > 0) s += 1;
  if (G.witherT > 0) s -= 1;
  if (G.baneT > 0) s -= 1;
  if (u.p && u.p.bond){ const pt = G.squad.find(m => m.p.id === u.p.bond); if (pt && pt.state === 'up' && dist(pt, u) < 60) s += 1; }   // Comrade Bond
  return s;
}
function nearest(from, reach, skip, los){
  let best = null, bd = reach;
  for (const e of G.enemies){ if (e.dead || e.dormant && !e.seen || (skip && skip.has(e))) continue; const d = dist(from, e);
    if (d < bd && (!los || losLine(from, e))){ bd = d; best = e; } }
  return best;
}
/* Every model fights with the squad's weapons (Section 3.1): the Squad
   Standard melee weapon when an enemy is in reach, otherwise the Squad
   Standard ranged weapon. How well depends on their own Melee and Ranged
   dice, so a Folk Hero shoots well and swings badly, a Soldier the reverse,
   and a caster does both badly. On top of that each Specialty has a passive:
     Soldier    Sweep: a melee swing hits up to three enemies in reach.
     Folk Hero  Marksman: shoots 30% faster and 40px further.
     Scoundrel  Soft Spot: +1 damage on a Solid Hit, +2 when Out of Formation.
     Cleric     Mending Prayer: every 7 seconds the most hurt model nearby
                regains 1 Condition (or Wound). Healing Word lifts the downed.
     Mage       Magic Missile: every 4 seconds, one unerring Piercing dart per
                point of Magic.
     Witch      Withering Hex: every 5 seconds a hex bolt that poisons and
                slows its target.
   In a Shield Wall the squad forgoes its weapon attacks; passives go on, and
   Soldiers with Shield Wall Mastery keep swinging (6.4, Table 2.8). */
function face(u, e){ u.anim.left = e.x < u.x; u.atkT = 12; u.faceT = 36; }
function specPassive(u, isLeader){
  const st = u.s, spec = u.spec;
  if (u.passT > 0){ u.passT -= 1 + 0.33 * (G.gifts || 0); return; }
  const focus = (isLeader ? st.focus : mateFeatures(u.p).focus) || G.kits.some(k => k.id === 'focus');
  const range = focus ? 60 : 0;
  if (spec === 'MAGE'){
    const n = Math.max(1, st.magic) + G.mod.margin, used = new Set(), list = [];
    for (let k = 0; k < n; k++){ const e = nearest(u, 300 + range, used, true); if (!e) break; used.add(e); list.push(e); }
    if (!list.length){ u.passT = 20; return; }
    for (const e of list){ const a = Math.atan2(e.y-u.y, e.x-u.x);
      G.shots.push({by:u, x:u.x, y:u.y-10, vx:Math.cos(a)*8, vy:Math.sin(a)*8, life:70, kind:'missile', target:e}); }
    u.passT = 300;
  }
  else if (spec === 'WITCH'){
    const e = nearest(u, 250 + range, null, true); if (!e){ u.passT = 20; return; }
    const a = Math.atan2(e.y-u.y, e.x-u.x);
    G.shots.push({by:u, x:u.x, y:u.y-10, vx:Math.cos(a)*6.5, vy:Math.sin(a)*6.5, life:80, kind:'hex', target:e});
    u.passT = 300;
  }
  else if (spec === 'CLERIC'){
    if (u.healCd > 0) u.healCd -= cmIs('DEVOUT') ? 40 : 20;
    if (u.healCd <= 0){
      if (G.leader.down && u !== G.leader && dist(G.leader, u) < 230){ standLeader('HEALING WORD'); u.healCd = 600; u.passT = 30; return; }
      const down = G.squad.find(m => (m.state === 'bleeding' || m.state === 'stable') && dist(m, u) < 230);
      if (down){ standUp(down, 'HEALING WORD'); u.healCd = 600; u.passT = 30; return; }
    }
    const L = G.leader, reach = 150 + range;
    let best = null, need = 0;
    if (!L.down && dist(L, u) < reach){ const n = (L.maxCon - L.con) * 2 + (L.maxWounds - L.wounds); if (n > need){ need = n; best = L; } }
    for (const m of G.squad) if (m.state === 'up' && dist(m, u) < reach){ const n = (m.maxCon - m.con) * 2; if (n > need){ need = n; best = m; } }
    if (!best){ u.passT = 20; return; }
    if (best === L){ if (L.con < L.maxCon) L.con++; else L.wounds = Math.min(L.maxWounds, L.wounds + 1); } else best.con++;
    G.fx.push({beam:true, x:u.x, y:u.y, tx:best.x, ty:best.y, life:14, c:'#ffe680'});
    pop(best.x, best.y - 18, '+1', '#8fd39a');
    u.passT = 420;
  }
  else u.passT = 9999;
}
function unitAttack(u, isLeader, shieldWall){
  specPassive(u, isLeader);
  if (u.timer > 0){ u.timer--; return; }
  const st = u.s, spec = u.spec, outF = !isLeader && !u.inF;
  const canSwing = !shieldWall || (spec === 'SOLDIER' && G.mod.shieldwall);
  const announce = () => { if (G.chargeAnnounce && !(window.T45 && T45.holdCharge && T45.holdCharge())){ G.chargeAnnounce = false; if (!G.chargePopped){ G.chargePopped = true; pop(u.x, u.y - 28, 'CHARGE', '#ffd860'); } } };   // K54 (ux48.k54): the pop once per fight
  const soft = spec === 'SCOUNDREL' ? ((isLeader ? st.soft2 : mateFeatures(u.p).soft2) ? 2 : 1) + 0 + G.mod.softspot : 0;

  // Melee: anything in reach of the squad melee weapon
  const reach = 46 + (G.melee.reach || 0) + (G.reachBonus || 0);
  const pointBlank = spec === 'FOLK_HERO' && (isLeader ? (u.p.level || 1) : 1 + (u.p.adv || 0)) >= 3;   // Point Blank: Effective Level 3+ Folk Heroes keep shooting
  const first = (pointBlank && !(window.F33 && F33.rushOn && F33.rushOn(u))) ? null : (window.F33 && F33.pick ? F33.pick(u, reach, null, false, isLeader) : nearest(u, reach));   // INDEX F33: the mark
  if (first){
    if (!canSwing){ u.timer = 10; return; }
    const hit = new Set([first]);
    if (spec === 'SOLDIER') for (let k = 0; k < 2; k++){ const e = nearest(u, reach, hit); if (!e) break; hit.add(e); }
    announce();
    for (const e of hit){ if (spec === 'SOLDIER' && e !== first && G.mod.vanguard < 2){ hurtEnemy(e, 1); continue; }   // Sweep: secondary targets take a Grazing Hit until Vanguard 2
      strike(e, st.melee + stepBonus(u, true), G.melee.dmg, {crush:G.melee.crush||0, from:u, flat:soft, scoundrel:spec === 'SCOUNDREL'}); }
    if (st.melee2 >= 0) for (const e of hit) if (!e.dead) strike(e, st.melee2 + stepBonus(u, true), G.melee.dmg, {crush:G.melee.crush||0, from:u, flat:soft, scoundrel:spec === 'SCOUNDREL'});   // the second die (Skill 6 and beyond)
    face(u, first); u.atkKind = 'melee'; fxArc(u, first); SFX.play('swing');
    u.timer = Math.round((spec === 'SCOUNDREL' ? 42 : 55) * (G.melee.cd||1)); u.hold = 12;
    return;
  }
  if (shieldWall){ u.timer = 10; return; }
  // Ranged: the squad ranged weapon at the nearest enemy in sight
  const rw = G.ranged, fh = spec === 'FOLK_HERO';
  const far = rw.range + (fh ? 40 + G.mod.skirmisher * 35 : 0), targets = [], used = new Set();
  for (let k = 0; k <= (fh ? G.mod.volley : 0); k++){ const e = window.F33 && F33.pick ? F33.pick(u, far, used, true, isLeader) : nearest(u, far, used, true); if (!e) break; used.add(e); targets.push(e); }
  if (!targets.length){ u.timer = 12; return; }
  for (const e of targets){
    const a = Math.atan2(e.y-u.y, e.x-u.x), close = rw.close && dist(u,e) < rw.close ? 1 : 0;
    G.shots.push({by:u, x:u.x, y:u.y-6, vx:Math.cos(a)*9, vy:Math.sin(a)*9, life:70, kind:'arrow', flat:soft, scoundrel:spec === 'SCOUNDREL',
                  skill: st.ranged + stepBonus(u, false) + close, dmg: rw.dmg, longbow: rw.id === 'longbows'});
    if (st.ranged2 >= 0) G.shots.push({by:u, x:u.x, y:u.y-10, vx:Math.cos(a + 0.06)*9, vy:Math.sin(a + 0.06)*9, life:70, kind:'arrow', flat:soft, scoundrel:spec === 'SCOUNDREL',
                  skill: st.ranged2 + stepBonus(u, false) + close, dmg: rw.dmg, longbow: rw.id === 'longbows'});   // a second arrow
  }
  SFX.play('bow'); face(u, targets[0]); u.atkKind = 'ranged';
  u.timer = Math.round(62 * (rw.cd||1) * (fh ? 0.7 * (1 - G.mod.skirmisher*0.2) : 1)); u.hold = 6;
}
function fxArc(u, e){ G.fx.push({arc:true, x:u.x, y:u.y-4, ang:Math.atan2(e.y-u.y, e.x-u.x), life:9, c:'#e8dcc0'}); }

/* ---------------------------------------------------------------------------
   HITTING AN ENEMY
--------------------------------------------------------------------------- */
function wake(e){
  if (!e.dormant) return;
  for (const o of G.enemies) if (o.group === e.group && o.dormant){ o.dormant = false; o.seen = true;
    if (BESTIARY[o.k].boss){ note(`${ename(o)} has seen you.`); G.shake = 10; SFX.play('boss');
      if (BESTIARY[o.k].howl){ for (const w of G.enemies) if (!w.dead && (w.k === 'wolf') && dist(w, o) < 400) w.howled = 600; pop(o.x, o.y - 40, 'HOWL', '#c8c8d8'); } } }
}
function strike(e, skill, baseDmg, o = {}){
  if (e.dead) return;
  if (o.from || o.by) e.lastBy = o.from || o.by;   /* Index 48 */
  const B = BESTIARY[e.k];
  wake(e);
  if (o.piercing){ hurtEnemy(e, o.flat || 1); return; }
  const cover = o.ranged && (cellAt(e.x, e.y) === T.FOREST || cellAt(e.x, e.y) === T.RUBBLE) ? 1 : 0;   // Light Cover
  const sk = skill + (e.exposed > 0 ? 1 : 0);
  const shift = Math.max(0, e.shift - (o.crush||0)) + cover;
  const {out, natMax} = attackDie(sk, B.ac + cover, {nudge:G.nudge>0, burn:G.burn>0});
  if (out === 'miss') return;
  if (out === 'graze'){ if ((B.grazeImmune || shift >= 3) && !natMax) return; hurtEnemy(e, 1); return; }
  const crit = out === 'crit';
  let dmg = damageRoll(baseDmg + G.mod.veteran + vetMastery(), Math.max(0, shift - (crit && o.longbow ? 1 : 0)));
  if (crit){ dmg += 1; pop(e.x, e.y-14, 'CRITICAL', '#f0c96a'); SFX.play('crit'); }
  dmg += (o.flat || 0);
  if (G.mod.armourbreak) e.shift = Math.max(0, e.shift - G.mod.armourbreak);
  if (G.mod.bleeding) e.bleed = Math.max(e.bleed, G.mod.bleeding);
  if (o.scoundrel && G.mod.poisoned){ e.weak = 120; e.slow = Math.max(e.slow||0, 120); }
  if (o.scoundrel && G.mod.highlight) e.exposed = 180;
  if (o.knock && !B.boss){ const a = Math.atan2(e.y-o.from.y, e.x-o.from.x); e.x += Math.cos(a)*o.knock; e.y += Math.sin(a)*o.knock; collide(e, e.r * .7); }
  hurtEnemy(e, dmg);
  if (!e.dead) enemyMorale(e, hasDoc('pushthrough') && G.chargeT > 0 && !!o.from && !o.ranged);
}
function vetMastery(){ return META.leader.level >= 6 ? 1 : 0; }
function hurtEnemy(e, n){ e.con -= n; e.flash = 6; wake(e); if ((e.escort || e.mark) && G.obj === 'assassinate') G.markAlarm = true; SFX.play('hit'); if (e.con <= 0) return killEnemy(e);
  if (!e.parleyed && !PARLAY && !G.over && PARLEY_COMMANDERS.includes(e.k) && e.con <= e.maxCon * 0.35) offerParlay(e); }
function enemyMorale(e, forced, step){
  const B = BESTIARY[e.k];
  if ((B.frenzy && !e.noFrenzy) || B.boss) return;
  if (!forced && (e.moraleRolled || e.con > e.maxCon * (G.mod.evileye ? 0.75 : 0.5))) return;
  e.moraleRolled = true;
  const {face, natMin} = attackDie(clampSkill(B.skill - (G.mod.evileye ? 1 : 0) - (step || 0) - (perk('fame', 9) ? 1 : 0) - (perk('fame', 6) && G.chargeT > 0 ? 1 : 0) - (G.disarray || 0)), 99);
  if (natMin && face < 5){ e.broken = true; pop(e.x, e.y-12, 'BROKEN', '#c8a24a'); }
  else if (face < 5) e.shakenT = 180;
}
function killEnemy(e){
  if (e.dead) return;
  e.dead = true; G.kills++; creditKill(e);   /* Index 48 */
  const B = BESTIARY[e.k];
  killReward(e, B);
  const coinChance = B.boss ? 1 : 0.32 + G.mod.cutpurse*0.06;
  if (Math.random() < coinChance)
    G.pickups.push({x:e.x+5, y:e.y+5, kind:'coin', v:Math.max(1, Math.round(B.coin * G.mod.loot * (1 + 0.25 * (G.spoils || 0)))), vx:rnd(-.8,.8), vy:rnd(-.8,.8), life:2400});
  if (!B.boss && Math.random() < 0.012) G.caches.push({x:e.x, y:e.y, kind:Math.random() < .6 ? 'poultice' : 'ward', opened:false, small:true});
  for (let i = 0; i < (B.boss ? 26 : 5); i++)
    G.fx.push({x:e.x, y:e.y-6, vx:rnd(-2.6,2.6), vy:rnd(-2.6,2.6), life:rnd(14,30), c:i%2 ? B.colour : '#8a1a1a', px:2 + (Math.random()*2|0)});
  if (B.arch === 'fixed'){ G.fx.push({blast:true, x:e.x, y:e.y, r:0, max:70, life:24, c:'#ff8a3a'}); G.fires.push({x:e.x, y:e.y, r:30, life:600}); G.shake = 12; SFX.play('blast'); pop(e.x, e.y - 40, (e.name || B.name).toUpperCase() + ' DESTROYED', '#ffd860'); }
  else G.fx.push({corpse:true, k:e.k, x:e.x, y:e.y, left:e.left, life:90});
  if (B.boss){
    G.bossKills++; G.commandersDefeated.push(B.tier); if (COMMANDER_FACTION[e.k]) G.slainFactions.push(COMMANDER_FACTION[e.k]);
    if (e.nemesis) nemesisSlain(e, 'kill');
    momentum(); G.shake = 22; note(`${ename(e)} falls.`); G.slowmo = 50; SFX.play('bossdie');
    G.caches.push({x:e.x, y:e.y + 20, kind:'veteran', opened:false});
    if (e.home){ e.home.done = true; G.alarm++; huntingParty(); }
    // The commander is dead: everything near him tests Morale (6.8), and Orsolt's levies lose their frenzy.
    for (const o of G.enemies){ if (o.dead || dist(o, e) > 520) continue;
      if (B.rallies === 'levy' && o.k === 'levy'){ o.noFrenzy = true; enemyMorale(o, true, 2); }
      else if (!BESTIARY[o.k].boss) enemyMorale(o, true, 1); }
  }
  else if (++G.momentumKills >= 80){ G.momentumKills = 0; momentum(); }
}
function momentum(){ if (G.luck < G.leader.s.luck){ G.luck++; pop(G.leader.x, G.leader.y-38, 'MOMENTUM +1 LUCK', '#f0c96a'); } }

/* ---------------------------------------------------------------------------
   DAMAGE TO THE SQUAD - absorption order (6.5)
   Wards -> Shield Pool -> Mount Pool -> Leader's Wounds -> Condition.
   Piercing skips the first three. A mate Out of Formation skips all four.
--------------------------------------------------------------------------- */
function hurtSquad(n, victim, piercing){
  const L = G.leader;
  if (!victim) victim = L;
  if (victim === L && L.down){ victim = G.squad.find(m => m.state === 'up' && m.inF) || G.squad.find(m => m.state === 'up'); if (!victim) return; }
  if (victim !== L && !victim.inF){ dropMate(victim, n); return; }
  let left = n;
  const take = k => { if (left > 0 && G[k] > 0){ const t = Math.min(G[k], left); G[k] -= t; left -= t; G.absorbFx = 14; G.absorbKind = k; SFX.play('block'); } };
  if (!piercing){
    take('wards'); take('shieldPool');
    if (G.mounted && G.mountMax > 0){
      take('mountPool');
      if (G.mountPool <= 0) unhorse();
    } else if (G.mounted && left > 0) unhorse();          // Riding Horses have no Mount Pool: the first hit through throws them

  }
  if (left > 0 && L.wounds > 0){ const t = Math.min(L.wounds, left); L.wounds -= t; left -= t;
    if (L.wounds === 0 && !G.woundsGone){ G.woundsGone = true; squadMorale('The Leader is out of Wounds'); } }
  if (left <= 0) return;
  if (victim === L){
    const ex = !G.payDuesUsed && G.squad.find(m => m.state === 'up' && m.p.cls === 'SLAVE' && m.inF);
    if (ex){ G.payDuesUsed = true; pop(ex.x, ex.y-22, 'PAY DUES', '#d4af37'); dropMate(ex, left); return; }
    const cover = G.squad.filter(m => m.state === 'up' && m.inF && m.con > 1).sort((a,b) => b.con - a.con)[0];
    if (cover){ const t = Math.min(left, cover.con - 1); cover.con -= t; cover.flash = 10; left -= t;
      pop(cover.x, cover.y-22, 'COVERING', '#d4af37'); if (left <= 0) return; }
    L.con -= left; L.flash = 10; G.flash = 20; G.shake = 12; SFX.play('hurt');
    if (L.con <= 0) leaderFalls();
  } else dropMate(victim, left);
}
function dropMate(m, n){
  m.con -= n; m.flash = 10; G.flash = Math.max(G.flash, 6);
  if (m.con <= 0){
    m.con = 0; m.state = 'bleeding'; m.bleedT = 0; m.stabT = 0; G.downedIds.add(m.p.id);
    pop(m.x, m.y-18, m.p.name.toUpperCase() + ' DOWN', '#b22222'); G.shake = 14; SFX.play('down'); tip('matedown');
    const pt = m.p.bond && G.squad.find(x => x.p.id === m.p.bond && x.state === 'up');
    if (pt){ G.moraleCd = 0; pop(pt.x, pt.y - 30, 'COMRADE DOWN', '#ff8a7a'); }
    squadMorale(pt ? `${m.p.name}, ${pt.p.name}'s Comrade, went down` : `${m.p.name} went down`, pt ? -1 : 0);
  }
}
function squadMorale(why, step = 0){
  if (G.moraleCd > 0) return;
  G.moraleCd = 480;
  const sk = (G.leader.down ? 1 : G.leader.s.per) + step + (perk('liberation', 3) ? 1 : 0);
  const roll = () => attackDie(sk, 99);
  let r = roll();
  const twice = G.mod.chaplain || (mastery('chapel') && !G.firstMorale);
  G.firstMorale = true;
  if (twice){ const r2 = roll(); if (r2.face > r.face && !r2.natMin) r = r2; }
  if (r.natMin && r.face < 5){ G.broken = 180; pop(G.leader.x, G.leader.y-44, 'BROKEN', '#b22222'); note(`${why}. Morale roll ${r.face}: the squad is Broken.`); }
  else if (r.face < 5){ G.shaken = 300; pop(G.leader.x, G.leader.y-44, 'SHAKEN', '#d47a6a'); note(`${why}. Morale roll ${r.face}: the squad is Shaken.`); }
  else pop(G.leader.x, G.leader.y-44, 'STEADY', '#6fa37a');
}
const squadUnits = () => G.leader.down ? G.squad.filter(m => m.state === 'up') : [G.leader, ...G.squad.filter(m => m.state === 'up')];

/* ---------------------------------------------------------------------------
   THE LEADER GOES DOWN (6.9). The Leader Bleeds Out like anyone else.
   A Squad Mate who reaches them gets them up at 1 Condition (3 seconds the
   first time, 6 the second, 9 the third); a Cleric's Healing Word does it at
   once. [R] burns 2 Luck to stand (6.7). The contract is lost only if the
   Leader dies or every Squad Mate is down.
--------------------------------------------------------------------------- */
function leaderFalls(){
  const L = G.leader;
  L.con = 0; L.wounds = 0; L.down = true; L.bleedT = 0; L.helpT = 0; G.leaderWasDown = true; G.leaderDowns = (G.leaderDowns || 0) + 1;
  L.helpNeed = 180 * G.leaderDowns;
  G.formation = 'OPEN'; G.shake = 20; SFX.play('down');
  pop(L.x, L.y - 30, META.leader.name.toUpperCase() + ' IS DOWN', '#ff5a4a');
  note(`${META.leader.name} is down and Bleeding Out. Get a Squad Mate to them, or burn 2 Luck [R].`);
  if (!G.squad.some(m => m.state === 'up')) return endDeployment('fallen');
  G.moraleCd = 0; squadMorale('The Leader is down');
  tip('leaderdown');
}
function standLeader(label){
  const L = G.leader; L.down = false; L.con = 1; L.helpT = 0; L.flash = 12; G.grace = 60;
  pop(L.x, L.y - 30, label, '#8fd39a'); SFX.play('stand');
}
function updateLeaderDown(){
  const L = G.leader;
  if (!G.squad.some(m => m.state === 'up')) return endDeployment('fallen');
  const helper = G.squad.find(m => m.state === 'up' && dist(m, L) < 40);
  if (helper){ if (++L.helpT >= L.helpNeed) standLeader(helper.p.name.toUpperCase() + ' GETS YOU UP'); }
  else L.helpT = Math.max(0, L.helpT - 1);
  if (++L.bleedT % 480 === 0){
    const r = d6();
    if (r <= 3){
      if (G.leader.s.luck >= 1){ META.leader.burnt = (META.leader.burnt || 0) + 1; G.leader.s = leaderStats(META.leader); G.luck = Math.min(G.luck, G.leader.s.luck);
        pop(L.x, L.y - 40, 'LUCK BURNT TO HOLD ON', '#ff8a3a'); note(`Bleeding Out roll ${r}: a point of Luck burns away for good to keep ${META.leader.name} breathing.`); luckSaved(r); }   /* Index 32 */
      else { G.leaderSlain = true; note(`Bleeding Out roll ${r}: ${META.leader.name} is dead.`); return endDeployment('fallen'); }
    } else pop(L.x, L.y - 40, 'CLINGING ON (' + r + ')', '#c8a24a');
  }
}
const inCover = u => { const c = cellAt(u.x, u.y); return c === T.FOREST || c === T.RUBBLE || extraCover(u); };

/* ---------------------------------------------------------------------------
   ENEMIES - the Enemy Behaviour table (10.1). Bruisers press the line,
   Skirmishers keep their distance and shoot, Casters hang back and drop
   artillery on clusters, Beasts stalk anyone out of formation.
   Target priority: a lone model outside the Command Radius, then the Leader.
--------------------------------------------------------------------------- */
const SEP = 40;
function separate(){
  const grid = new Map();
  for (const e of G.enemies){ if (e.dead || e.dormant) continue; const k = ((e.x/SEP)|0) + ':' + ((e.y/SEP)|0); let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(e); }
  for (const [k, b] of grid){ const [cx, cy] = k.split(':').map(Number);
    for (const e of b) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++){
      const nb = grid.get((cx+ox)+':'+(cy+oy)); if (!nb) continue;
      for (const o of nb){ if (o === e) continue;
        const dx = o.x-e.x, dy = o.y-e.y, d2 = dx*dx+dy*dy, want = e.r+o.r;
        if (d2 > 0.01 && d2 < want*want){ const d = Math.sqrt(d2), p = (want-d)*0.17/d; e.x -= dx*p; e.y -= dy*p; o.x += dx*p; o.y += dy*p; } } } }
}
function moveEnemy(e, tx, ty, sp, target){
  let dx, dy;
  const d = Math.hypot(tx - e.x, ty - e.y);
  // QA S6-PREP: close foes also need a clear line, or one behind a wall stays pinned; blocked ones follow the flow field
  if (clearLine(e, {x:tx, y:ty}, d < 260 ? 18 : 30)){ dx = (tx - e.x) / (d || 1); dy = (ty - e.y) / (d || 1); }
  else { const fd = flowDir(G.flow, e.x, e.y); if (fd){ dx = fd.x; dy = fd.y; } else { dx = (tx - e.x) / (d || 1); dy = (ty - e.y) / (d || 1); } }
  const c = cellAt(e.x, e.y), terr = BESTIARY[e.k].flit || e.k === 'cinder' ? 1 : (SLOW[c] || 1);
  e.wob += 0.08;
  e.x += dx * sp * terr + Math.cos(e.wob) * 0.14; e.y += dy * sp * terr + Math.sin(e.wob) * 0.14;
  if (Math.abs(dx) > 0.05) e.left = dx < 0;
}
function updateEnemies(shieldWall){
  const L = G.leader;
  const strays = G.squad.filter(m => m.state === 'up' && !m.inF);
  const soldiers = G.mod.taunt ? [L, ...G.squad].filter(u => u.spec === 'SOLDIER' && (u === L || u.state === 'up')) : [];
  const hexR = G.mod.hex ? 160 : 0;
  const ac = G.armour.ac + (shieldWall ? 1 + G.mod.warden : 0);
  const units = squadUnits();
  for (const e of G.enemies){
    if (G.over) break;
    if (e.dead) continue;
    const B = BESTIARY[e.k];
    if (e.dormant){
      const cz = (hasDoc('concealment') ? 0.6 : 1) * seasonWakeK();   /* Index 40: Autumn */
      if (dist(e, L) < 430 * cz && (dist(e, L) < 200 * cz || clearLine(e, L, 30))){ e.seen = true; wake(e); }
      else { if (e.flash > 0) e.flash--; if (!e.seen && seenXY(e.x, e.y) && dist(e, L) < 700) e.seen = true; continue; }
    }
    for (const k of ['flash','shakenT','weak','slow','exposed','hexT','stagger','atkT','charging','howled','castT','scootT']) if (e[k] > 0) e[k]--;
    if (G.frame % 60 === 0){
      if (e.bleed) hurtEnemy(e, e.bleed);
      if (e.hexT > 0 && !e.dead) hurtEnemy(e, e.poison || 1);
      if (e.dead) continue;
    }
    if (contractEnemyAI(e, B)) continue;
    // choose a target
    let tgt = L, best = 1e9;
    if (L.down){ tgt = units[0]; if (!tgt) continue; for (const u of units) if (dist(e, u) < dist(e, tgt)) tgt = u; }
    for (const m of strays){ const d = dist(e, m); if (d < 220 && d < best){ best = d; tgt = m; } }
    if (tgt === L) for (const s of soldiers){ if (dist(e, s) < 90 + G.mod.taunt*50){ tgt = s; break; } }
    if (tgt === L){ const ot = objTarget(e); if (ot) tgt = ot; }
    if (G.fordWagons){ const ft = fordTarget(e); if (ft) tgt = ft; }   /* Long Road pass 1, Night 3: a foe near a wagon goes for the wagon, before the squad, the strays or a Taunt */
    let sp = B.speed * (e.howled ? 1.25 : 1);
    if (G.mod.frost && dist(e, L) < 110 + G.mod.frost*40) sp *= 1 - (0.15 + G.mod.frost*0.12);
    if (e.slow > 0 || e.hexT > 0) sp *= 0.7;
    if (e.shakenT > 0) sp *= 0.8;
    const dT = dist(e, tgt);

    if (e.broken){ const a = Math.atan2(e.y - L.y, e.x - L.x); e.x += Math.cos(a) * sp; e.y += Math.sin(a) * sp; collide(e, e.r * .7); continue; }

    if (RANGED_ARCH(B.arch)){
      // Skirmishers and casters: keep their distance, shoot when they can see you
      const los = dT < B.rng * (G.sightK || 1) + 40 && losLine(e, tgt, 24);
      if (e.scootT > 0 || dT < B.keep * 0.7){ const a = Math.atan2(e.y - tgt.y, e.x - tgt.x); e.x += Math.cos(a) * sp * 1.1; e.y += Math.sin(a) * sp * 1.1; e.left = Math.cos(a) > 0 ? false : true; }
      else if (dT > B.rng * 0.92 || !los) moveEnemy(e, tgt.x, tgt.y, sp, tgt);
      else { const a = Math.atan2(tgt.y - e.y, tgt.x - e.x) + Math.PI / 2 * (e.seed % 2 ? 1 : -1); e.x += Math.cos(a) * sp * 0.3; e.y += Math.sin(a) * sp * 0.3; e.left = tgt.x < e.x; }
      collide(e, e.r * .7);
      if (e.castT <= 0 && los && dT <= B.rng){ enemyFire(e, tgt); e.castT = B.cd * rnd(0.85, 1.2); if (B.scoot) e.scootT = 40; }
    } else {
      // brutes, beasts and bosses: press the line, and sometimes charge (Flank Charge, 5-6)
      if (!e.charging && e.chCd-- <= 0 && dT > 60 && dT < 190 && B.arch !== 'beast'){ e.chCd = 360; if (d6() >= 5){ e.charging = 45; e.chargeHit = true; } }
      moveEnemy(e, tgt.x, tgt.y, sp * (e.charging ? 1.8 : 1), tgt);
      collide(e, e.r * .7);
      if (B.boss && (B.spells || B.breath) && e.castT <= 0 && dT < 320 && clearLine(e, tgt, 24)){ enemyFire(e, tgt); e.castT = (B.cd || 240) * rnd(0.9, 1.2); }
    }
    // boss signature abilities
    if (B.summons && --e.sumCd <= 0){ e.sumCd = 300; for (let i = 0; i < 3; i++) spawnEnemy(B.summons, e.x+rnd(-40,40), e.y+rnd(-40,40)); }
    if (B.brimstone && G.frame % 40 === 0) G.fires.push({x:e.x, y:e.y + 10, r:26, life:300, enemy:true});
    if (B.rallies === '*' && G.frame % ROUND === 0) for (const o of G.enemies) if (!o.dead && dist(o, e) < 160){ o.shakenT = 0; o.broken = false; }

    // contact attack
    if (e.hitCd > 0) e.hitCd--;
    if (e.hitCd > 0 || G.grace > 0 || e.stagger > 0 || RANGED_ARCH(B.arch) && dT > 30) continue;
    const reach = e.r + (B.sweep ? 22 : 9);
    if (tgt.objHp && tgt.hp > 0 && dist(e, tgt) <= e.r + (tgt.r || 12) + 6){ e.hitCd = 84; e.atkT = 14; e.left = tgt.x < e.x; hitObjective(e, tgt); continue; }
    const victims = units.filter(v => dist(e, v) <= reach);
    if (!victims.length) continue;
    G.lastContact = G.frame;
    e.hitCd = B.twice ? 44 : 84; e.atkT = 14; e.left = victims[0].x < e.x;
    if (hasDoc('feigned') && L.moving){ let da = Math.atan2(e.y - L.y, e.x - L.x) - G.facing; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (Math.abs(da) > Math.PI / 2){ e.exposed = 180; pop(e.x, e.y - 20, 'EXPOSED', '#ffd860'); } }
    if (shieldWall && G.melee.id === 'spears' && !e.speared && victims.some(v => v === L || v.inF)){ e.speared = true; hurtEnemy(e, 1); }   // Set Spearwall: once, as they close
    if (e.dead) continue;
    const hits = B.sweep ? victims.slice(0, Math.max(2, victims.length)) : [victims[0]];   // Sweeping Club: one die per adjacent model
    for (const v of hits){
      const sk = B.skill - (e.weak > 0 ? 1 : 0) - (e.hexT > 0 ? 1 : 0) - (hexR && dist(e,L) < hexR ? G.mod.hex : 0) - (e.shakenT > 0 ? 1 : 0)
               + (e.chargeHit && e.charging && !(hasDoc('pikesquare') && G.melee.id === 'pikes') ? 1 : 0) + (e.howled ? 1 : 0) + (B.bully && G.shaken ? 1 : 0) - (G.illusionT > 0 ? 1 : 0) + (window.TERRAIN ? TERRAIN.eMelee(e, v) : 0);   /* INDEX TR28: higher ground */
      let vAC = ac + (v !== L && !v.inF && mateFeatures(v.p).evade ? 1 : 0) + b2ACBonus(v) + (window.TERRAIN ? TERRAIN.meleeCover(v) : 0);   /* Index 39; INDEX TR28: walls and wagons in melee */
      if (shieldWall && hasDoc('spearwall') && G.melee.id === 'spears' && e.charging) vAC += 1;   // Spear Wall Mastery
      if (hasDoc('wedge') && G.chargeT > 0 && wedgeFlank(e)) vAC -= 1;   /* Index 37: Wedge Formation costs AC against a flank */
      let {out, natMax} = attackDie(sk, vAC); out = fpDowngrade(out, v);   /* Index 37 */
      if (out === 'miss') continue;
      let d;
      if (out === 'graze'){ if (G.armour.graze0 && !natMax) continue; d = 1; }
      else d = damageRoll(B.dmg, G.armour.shift + G.leader.s.shift + (shieldWall && hasDoc('shieldlock') ? 1 : 0)) + (out === 'crit' ? 1 : 0);
      if (B.hellspark && out !== 'graze') G.fires.push({x:v.x, y:v.y + 6, r:22, life:240, enemy:true});
      pop(v.x, v.y-18, '-' + d, '#d47a6a');
      hurtSquad(d, v, out === 'crit' && B.critPierce);
      if (G.over) return;
    }
    e.chargeHit = false;
    G.grace = 20;
  }
  G.enemies = G.enemies.filter(e => !e.dead && (e.group || BESTIARY[e.k].boss || dist(e, L) < CULL_DIST));
}

/* ---------------------------------------------------------------------------
   ENEMY SHOTS, SPELLS AND ARTILLERY
   Artillery is telegraphed: a circle on the ground, then the blast.
   A squad that stands still in a Shield Wall is exactly what it is for.
--------------------------------------------------------------------------- */
function squadCentre(){
  const u = squadUnits(); if (!u.length) return {x:G.leader.x, y:G.leader.y}; let x = 0, y = 0; for (const v of u){ x += v.x; y += v.y; } return {x: x / u.length, y: y / u.length};
}
function enemyFire(e, tgt){
  const B = BESTIARY[e.k];
  e.atkT = 14; e.left = tgt.x < e.x;
  if (B.arch === 'skirm'){
    const a = Math.atan2(tgt.y - e.y, tgt.x - e.x);
    tip('ranged'); SFX.play('shoot');
    G.eshots.push({x:e.x, y:e.y - 6, vx:Math.cos(a) * 5.5, vy:Math.sin(a) * 5.5, life:100, skill:B.rskill, dmg:B.dmg, pierce:B.critPierce, ign:B.ignoreShift||0, kind:'bolt', at:tgt.objHp ? tgt : null});
    return;
  }
  if (B.breath){ const a = Math.atan2(tgt.y - e.y, tgt.x - e.x);
    G.hazards.push({x:e.x + Math.cos(a) * 90, y:e.y + Math.sin(a) * 90, r:85, t:55, max:55, kind:'breath', skill:4, dmg:4, from:e});
    pop(e.x, e.y - 40, 'BREATH', '#ff8a2a'); return; }
  const spells = B.spells || []; const sp = spells[e.spellI = ((e.spellI || 0) + 1) % spells.length];
  if (sp === 'orb' || sp === 'ray'){ const a = Math.atan2(tgt.y - e.y, tgt.x - e.x);
    G.eshots.push({x:e.x, y:e.y - 10, vx:Math.cos(a) * 6, vy:Math.sin(a) * 6, life:90, skill:(B.mg||2) + 1, dmg:2, kind:sp === 'ray' ? 'ray' : 'orb', pierce:sp === 'ray'}); }
  if (sp === 'fireball' || sp === 'sharper') tip('hazard');
  if (sp === 'fireball'){ const c = squadCentre(); G.hazards.push({x:c.x, y:c.y, r:80, t:75, max:75, kind:'fireball', skill:(B.mg||3) + 1, dmg:4}); pop(e.x, e.y - 30, 'FIREBALL', '#ff8a2a'); }
  if (sp === 'sharper'){ const c = squadCentre(); G.hazards.push({x:c.x + rnd(-20,20), y:c.y + rnd(-20,20), r:72, t:65, max:65, kind:'sharper'}); pop(e.x, e.y - 30, 'SHARPER', '#d8d0c0'); }
  if (sp === 'hex'){ G.witherT = 240; G.fx.push({beam:true, x:e.x, y:e.y, tx:tgt.x, ty:tgt.y, life:16, c:'#9a5fc8'}); pop(G.leader.x, G.leader.y - 34, 'WITHERING HEX: -1 STEP', '#b07ad8'); }
  if (sp === 'bane'){ G.baneT = 300; G.fx.push({beam:true, x:e.x, y:e.y, tx:tgt.x, ty:tgt.y, life:16, c:'#c03030'}); pop(G.leader.x, G.leader.y - 34, 'BANE OF THE WICKED: -1 STEP', '#e05050'); }
  if (sp === 'rime'){ for (const o of G.enemies) if (!o.dead && dist(o, e) < 220) o.con = Math.min(o.maxCon, o.con + 2); G.fx.push({ring:true, x:e.x, y:e.y, r:200, life:16, c:'#9fd0f0'}); }
}
function enemyHitsUnit(v, skill, dmgDie, opts){
  const shieldWall = G.formation === 'SHIELD';
  const sk = skill - (G.smokeT ? 1 : 0) - (G.fogT ? 1 : 0) - (G.illusionT > 0 ? 1 : 0);
  const cover = inCover(v) ? 1 : 0;
  const vAC = G.armour.ac + (shieldWall ? 1 + G.mod.warden : 0) + cover + (v !== G.leader && !v.inF && mateFeatures(v.p).evade ? 1 : 0) + b2ACBonus(v);   /* Index 39 */
  let {out, natMax} = attackDie(sk, vAC); out = fpDowngrade(out, v);   /* Index 37 */
  if (out === 'miss') return 0;
  if (out === 'graze') return (G.armour.graze0 && !natMax && !opts.pierce) ? 0 : 1;
  return damageRoll(dmgDie, Math.max(0, G.armour.shift + G.leader.s.shift + cover - (opts.ign || 0))) + (out === 'crit' ? 1 : 0);
}
function updateEnemyShots(shieldWall){
  const units = squadUnits();
  for (const s of G.eshots){
    s.x += s.vx; s.y += s.vy; s.life--;
    if (shotBlocked(s.x, s.y)){ s.life = 0; continue; }
    if (shotHitsObjective(s)){ s.life = 0; continue; }
    for (const v of units){
      if (Math.hypot(v.x - s.x, v.y - (s.y + 6)) > 13) continue;
      const d = enemyHitsUnit(v, s.skill, s.dmg, s);
      if (d){ pop(v.x, v.y - 18, '-' + d, '#d47a6a'); hurtSquad(d, v, s.pierce && d > 1); }
      s.life = 0; break;
    }
    if (G.over) return;
  }
  G.eshots = G.eshots.filter(s => s.life > 0);
}
function updateHazards(){
  for (const h of G.hazards){
    if (--h.t > 0) continue;
    h.done = true;
    G.fx.push({blast:true, x:h.x, y:h.y, r:0, max:h.r, life:20, c:h.kind === 'sharper' ? '#b8b0a0' : '#ff7a2a'}); G.shake = 10; SFX.play('blast');
    const caught = squadUnits().filter(v => dist(v, h) <= h.r);
    if (!caught.length) continue;
    let packet = 0, pierce = h.kind === 'sharper' || h.kind === 'breath', first = null;
    for (const v of caught){
      let d = 0;
      if (h.kind === 'sharper') d = 1;
      else d = enemyHitsUnit(v, h.skill, h.dmg, {pierce});
      if (!d) continue;
      pop(v.x, v.y - 18, '-' + d, '#ff8a6a');
      if (v === G.leader || v.inF){ packet += d; first = first || v; } else hurtSquad(d, v, pierce);   // one packet per squad (6.5)
    }
    if (packet) hurtSquad(packet, first === G.leader ? null : first, pierce);
    if (h.kind === 'sharper'){ G.stagger = 360; note('Sharper: the squad is Staggered and cannot form a Shield Wall.'); }
    if (G.over) return;
  }
  G.hazards = G.hazards.filter(h => !h.done);
  // enemy fire on the ground: Brimstone Wake, Hellspark
  for (const fz of G.fires){ fz.life--;
    if (fz.friendly && G.frame % 60 === 0) for (const e of G.enemies) if (!e.dead && !e.dormant && dist(e, fz) < fz.r) hurtEnemy(e, 1);
    if (fz.enemy && G.frame % 60 === 0) for (const v of squadUnits()) if (dist(v, fz) < fz.r){ pop(v.x, v.y - 18, '-1', '#ff8a2a'); hurtSquad(1, v === G.leader ? null : v); if (G.over) return; } }
  G.fires = G.fires.filter(fz => fz.life > 0);
}

/* ---------------------------------------------------------------------------
   SPAWNING
   Hold the Redoubt: waves on the clock, two bosses arrive.
   Headhunter and Extraction: a thinner ambient host that grows with the
   Alarm, which rises with time and every commander or strongbox taken.
--------------------------------------------------------------------------- */
function spawnPoint(){
  const L = G.leader, base = Math.max(VW, VH) / 2 + 40;
  for (let i = 0; i < 30; i++){
    const a = Math.random() * TAU, d = base + rnd(0, 260), x = L.x + Math.cos(a) * d, y = L.y + Math.sin(a) * d;
    if (x < CELL || y < CELL || x > (MAP.w - 1) * CELL || y > (MAP.h - 1) * CELL) continue;
    const i2 = cellIdx(x, y); if (G.flow[i2] < 0 || G.flow[i2] > 45) continue;
    return {x, y};
  }
  return null;
}
function spawnEnemy(k, x, y, o = {}){
  if (BESTIARY[k].boss && !o.noNem){ const nm = pickNemesis(k); if (nm){ k = nm.k; o.nem = nm; } }
  const B = BESTIARY[k];
  if (x === undefined){ const p = spawnPoint(); if (!p) return null; x = p.x; y = p.y; }
  const e = {k, x, y, con:B.con, maxCon:B.con, r:B.r, shift:B.shift, flash:0, bleed:0, hitCd:0, atkT:0, chCd:120 + Math.random()*240,
             wob:Math.random()*TAU, seed:Math.random()*20|0, sumCd:200, castT:60 + Math.random()*120, moraleRolled:false, broken:false, left:false,
             dormant:!!o.dormant, group:o.group || 0, home:o.home || null};
  if (B.boss){ e.name = o.nem ? o.nem.name : commanderName(k); const up = (G.contract.tier || 1) - (B.tier || 1); if (up > 0){ e.con = e.maxCon = Math.round(B.con * (1 + 0.6 * up)); }
    if (o.nem){ e.nemesis = o.nem; o.nem.met = (o.nem.met || 1) + 1; e.con = e.maxCon = Math.round(e.maxCon * (1 + 0.25 * o.nem.grudge)); e.seenNote = true;
      note(`${e.name} remembers the Chapter. Your nemesis is here.`); } }
  collide(e, e.r * .7);
  G.enemies.push(e);
  return e;
}
function pickKind(pool){
  const ranged = G.enemies.filter(e => !e.dead && RANGED_ARCH(BESTIARY[e.k].arch)).length;
  const cap = Math.min(3 + G.contract.tier * 2, 1 + Math.floor(G.sec / 50) + (G.contract.tier - 1) * 2);   // ranged enemies phase in
  for (let i = 0; i < 6; i++){ const k = pool[Math.random() * pool.length | 0]; if (!RANGED_ARCH(BESTIARY[k].arch) || ranged < cap) return k; }
  return pool[0];
}
function huntingParty(){
  const w = hostWave(TIER_WAVE_OFFSET[G.contract.tier] + 2 + G.alarm);
  for (let i = 0; i < 6 + G.alarm * 2; i++) spawnEnemy(pickKind(w.pool));
  note('The host is roused. A hunting party is on your trail.');
}
/* PD-22 (Patrick Q22; on by Patrick Q46 A, 2026-11-16) [S] (audits/pd22-topup-stop-draft.md; ?topup22=0 or TOPUP22.on = false turns it off):
   on non-Hold field jobs the refill stops once the objective is done or after K.waves bursts, pauses K.gap s after the
   squad clears the field, and the top-up floor is capped. Raids and the Founding have their own spawners and are untouched. */
const TOPUP22 = {on: !/[?&]topup22=0/.test(location.search), waves: 10, gap: 25, clearAt: 2, cap: 10, capAlarm: 4};
function near22(){
  const L = G.leader, r = Math.max(VW, VH) / 2;
  if (!L) return 0;
  return G.enemies.filter(e => !e.dormant && e.con > 0 && Math.hypot(e.x - L.x, e.y - L.y) < r && (typeof visNow !== 'function' || visNow(e))).length;
}
function topup22(awake){
  const K = TOPUP22, st = G.tu22 || (G.tu22 = {bursts: 0, quietT: 0});
  if (!K.on) return {burst: true, fill: Infinity};
  let done = false; try { done = typeof contractProgress === 'function' && contractProgress() >= 1; } catch (e) {}
  if (done) return {burst: false, fill: 0};
  const near = near22();   // QA S6-PREP: count only foes the squad can see (on screen and in vision); the drip refills off screen, so the whole-field count never fell to clearAt
  if (near > K.clearAt) st.fought = true;   // the gap follows a fight the squad cleared, not fresh off-screen refills
  if (st.quietT > 0) st.quietT--; else if (near <= K.clearAt && st.fought && G.sec > 20 && !st.cleared){ st.cleared = true; st.fought = false; st.quietT = K.gap * 60; }
  if (awake > K.clearAt + 3) st.cleared = false;
  if (st.quietT > 0) return {burst: false, fill: 0};
  return {burst: st.bursts < K.waves, fill: K.cap + G.alarm * K.capAlarm};
}
function spawn(){
  const awake = G.enemies.filter(e => !e.dormant).length;
  if (G.obj === 'hold'){
    const prog = G.sec / (G.contract.minutes*60);
    const w = hostWave(Math.floor(prog*6) + TIER_WAVE_OFFSET[G.contract.tier]);
    if (--G.spawnClock <= 0){
      G.spawnClock = w.rate;
      const n = Math.min(MAX_ENEMIES - awake, w.burst + Math.floor(G.sec/240));
      for (let i = 0; i < n; i++) spawnEnemy(pickKind(w.pool));
    }
    const minField = Math.min(MAX_ENEMIES, 5 + Math.floor(G.sec * 0.06) + TIER_WAVE_OFFSET[G.contract.tier]*4);
    if (awake < minField && G.frame % 8 === 0) spawnEnemy(pickKind(w.pool));
    const bosses = hostBosses();
    [0.45, 0.88].forEach((at, i) => {
      if (!G.bossesDone[i] && prog >= at){ G.bossesDone[i] = true;
        const e = spawnEnemy(bosses[i % bosses.length]); if (e){ e.seen = true; SFX.play('boss'); note(`${ename(e)} is coming for the Redoubt.`); G.shake = 20; } else G.bossesDone[i] = false; }
    });
  } else {
    const level = Math.min(9, TIER_WAVE_OFFSET[G.contract.tier] + Math.floor(G.sec / 100) + G.alarm);
    const w = hostWave(level);
    const tu = topup22(awake);   // PD-22 (on; ?topup22=0 turns it off)
    if (--G.spawnClock <= 0){
      G.spawnClock = Math.round(w.rate * 2.6 * (G.obj === 'escort' ? 1.5 : 1));
      const n = tu.burst ? Math.min(MAX_ENEMIES - awake, Math.ceil(w.burst * 0.5) + Math.floor(G.alarm / 2)) : 0;
      for (let i = 0; i < n; i++) spawnEnemy(pickKind(w.pool));
      if (n > 0) G.tu22.bursts++;
    }
    const minField = Math.min(140, tu.fill, (G.obj === 'escort' ? 3 : 6) + Math.floor(G.sec * (G.obj === 'escort' ? 0.02 : 0.03)) + G.alarm * (G.obj === 'escort' ? 2 : 4));
    if (awake < minField && G.frame % 12 === 0) spawnEnemy(pickKind(w.pool));
  }
}

/* ---------------------------------------------------------------------------
   THE MAP'S CONTENTS: loot caches, Blip Tokens, strongboxes, the road out
--------------------------------------------------------------------------- */
function applyLoot(kind, at){
  const L = G.leader, Ld = LOOT[kind]; SFX.play('chest');
  pop(at.x, at.y - 24, Ld.name.toUpperCase(), Ld.col);
  for (let i = 0; i < 14; i++) G.fx.push({x:at.x, y:at.y - 6, vx:rnd(-2,2), vy:rnd(-3,-.5), life:rnd(18,34), c:Ld.col, px:2});
  if (kind === 'poultice'){
    for (const m of G.squad){ if (m.state === 'up') m.con = Math.min(m.maxCon, m.con + 2); else if (m.state !== 'dead') standUp(m, 'ON THEIR FEET'); }
    L.wounds = Math.min(L.maxWounds, L.wounds + 2); L.con = Math.min(L.maxCon, L.con + 2);
  }
  if (kind === 'veteran'){ gainXP(Math.max(1, G.xpNext - G.xp)); }
  if (kind === 'ward'){ G.wards = 4; G.shieldPool = G.shieldMax; }
  if (kind === 'purse'){ const v = 10 + (Math.random() * 16 | 0) + G.contract.tier * 5; G.coin += v; pop(at.x, at.y - 40, '+' + v + ' COIN', '#ffd700'); }
  if (kind === 'wafer'){ if (G.luck < L.s.luck) G.luck++; else { G.coin += 15; pop(at.x, at.y - 40, 'LUCK FULL: +15 COIN', '#ffd700'); } }
  if (kind === 'storm') G.stormT = 15 * 60;
  if (kind === 'smoke') G.smokeT = 15 * 60;
  if (kind === 'cusser'){
    G.fx.push({blast:true, x:L.x, y:L.y, r:0, max:150, life:24, c:'#c8b8a0'}); G.shake = 18;
    for (const e of G.enemies){ if (e.dead || e.dormant || dist(e, L) > 150) continue; strike(e, 3, 3, {}); if (!e.dead) enemyMorale(e, true); }
  }
  if (kind === 'scroll'){
    const done = [];
    for (let k = 0; k < 3; k++){ let best = null, bc = 0;
      for (const e of G.enemies){ if (e.dead || e.dormant || dist(e, L) > 520 || done.some(d => dist(d, e) < 120)) continue;
        let c = 0; for (const o of G.enemies) if (!o.dead && dist(e,o) < 70) c++; if (c > bc){ bc = c; best = e; } }
      if (!best) break; done.push({x:best.x, y:best.y});
      G.fx.push({blast:true, x:best.x, y:best.y, r:0, max:80, life:22, c:'#e07a32'});
      for (const e of G.enemies) if (!e.dead && dist(e, best) < 80) strike(e, 5, 4, {}); }
    G.shake = 14;
  }
  if (kind === 'mules') for (const p of G.pickups) p.mule = true;
  if (kind === 'captive'){
    G.captivesFreed++; liberationDeed(1);
    if (G.squad.filter(m => m.state !== 'dead').length < 5){
      const r = rollRecruit('SLAVE'); r.id = META.nextId++; r.newHire = true; if (allied('suderia')) r.conTrained = 1;
      const m = runMate(r, G.squad.length); m.x = at.x; m.y = at.y; G.squad.push(m); G.hired.push(r); buildAbilities();
      note(`${r.name}, a ${RACES[r.race].name} ${SPECS[r.spec].name}, is cut free and joins the squad.`);
    } else { G.coin += 20; note('The squad is full, so the freed captive pays what they can: 20 coin.'); }
  }
}
function updateMapObjects(){
  const L = G.leader;
  for (const c of G.caches){
    if (!c.opened && dist(c, L) < 260) tip('chest');
    if (c.opened || dist(c, L) > 28) continue;
    c.opened = true; c.openT = 240; applyLoot(c.kind, c);
  }
  G.caches = G.caches.filter(c => !c.opened || (c.openT-- > 0 && !c.small));
  // Blip Tokens (6.1, 10.2): flip within 5 hexes and Line of Sight, then roll 1d6
  for (const b of G.blips){
    if (b.revealed || dist(b, L) > 195 || !clearLine(b, L)) continue;
    b.revealed = true; const r = b.known || d6(); b.res = r;
    const BT = blipTroops(), tierSk = BT.sk.length ? BT.sk : ['goblinsniper'], tierBr = BT.br.length ? BT.br : ['brigand'];
    if (r <= 2){ pop(b.x, b.y - 20, 'DECOY: ONLY TRACKS', '#c8a878'); if (Math.random() < .5) G.caches.push({x:b.x, y:b.y, kind:'purse', opened:false}); }
    else if (r <= 4){ pop(b.x, b.y - 20, 'SNIPER NEST', '#ff8a7a'); for (let i = 0; i < 3; i++) spawnEnemy(tierSk[i % tierSk.length], b.x + rnd(-40,40), b.y + rnd(-40,40)); }
    else if (r === 5){ if (b.known){ pop(b.x, b.y - 20, 'TRAP DISARMED', '#8fd39a'); }
      else { const d = damageRoll(3, 0); pop(L.x, L.y - 26, 'PIT TRAP: -' + d, '#ff8a7a'); hurtSquad(d, null); } }
    else { pop(b.x, b.y - 20, 'AMBUSH', '#ff6a5a'); for (let i = 0; i < 4; i++) spawnEnemy(tierBr[i % tierBr.length], b.x + rnd(-50,50), b.y + rnd(-50,50)); G.shake = 10; }
  }
  // Strongboxes: stand beside one to crack it. Enemies close by stop the work.
  for (const v of G.vaults){
    if (v.done) continue;
    const near = dist(v, L) < 60, contested = vaultContested(v);
    if (near && !contested) v.claimed++; else if (v.claimed > 0 && !near) v.claimed = Math.max(0, v.claimed - 1);
    if (near && contested && !v.sealed && G.frame % 60 === 0) { pop(v.x, v.y - 30, 'CLEAR THE ENEMY OFF IT', '#ff8a7a'); contestRing(v.x, v.y); }
    if (v.claimed >= 180){
      v.done = true; G.alarm++; momentum();
      const coin = 25 * G.contract.tier; G.coin += coin; pop(v.x, v.y - 30, 'STRONGBOX CRACKED: +' + coin + ' COIN', '#ffd860');
      gainXP(Math.max(1, Math.round(G.xpNext * 0.5)));
      if (G.vaults.every(x => x.done)){
        G.exitOpen = true; note('All three strongboxes are cracked. Get back to the road you came in on.');
        const bk = pickOf(hostBosses()), e = spawnEnemy(bk);
        if (e){ e.seen = true; note(`${ename(e)} rides to cut you off.`); }
      } else huntingParty();
    }
  }
}

/* ---------------------------------------------------------------------------
   SHOTS, SPELLS, GROUND WORKS, PICKUPS
--------------------------------------------------------------------------- */
function updateShots(){
  for (const s of G.shots){
    if ((s.kind === 'missile' || s.kind === 'hex' || s.kind === 'called') && s.target && !s.target.dead){
      const a = Math.atan2(s.target.y-s.y, s.target.x-s.x), sp = Math.hypot(s.vx, s.vy);
      s.vx = Math.cos(a)*sp; s.vy = Math.sin(a)*sp;
    }
    s.x += s.vx; s.y += s.vy; s.life--;
    if (s.kind === 'arrow' && shotBlocked(s.x, s.y)){ s.life = 0; continue; }
    for (const e of G.enemies){
      if (e.dead || dist(s, e) > e.r + 5) continue;
      if (s.kind === 'arrow') strike(e, s.skill, s.dmg, {by:s.by, longbow:s.longbow, ranged:true, flat:s.flat||0, scoundrel:s.scoundrel});
      else if (s.kind === 'missile') strike(e, 0, 0, {by:s.by, piercing:true, flat:1});        // Magic Missile never misses
      else if (s.kind === 'called'){ if (e !== s.target && s.target && !s.target.dead) continue; strike(e, 0, 0, {by:s.by, piercing:true, flat:s.flat}); pop(e.x, e.y - 20, '-' + s.flat, '#ffe9a8'); }
      else if (s.kind === 'hex'){ e.hexT = G.mod.lingering ? 480 : 240; e.poison = 1; hurtEnemy(e, 1); }
      s.life = 0; break;
    }
  }
  G.shots = G.shots.filter(s => s.life > 0);
}
function runSpells(){
  const L = G.leader, f = G.frame, m = G.mod;
  if (m.fireball && f % Math.round((9 - m.fireball*1.5)*60) === 0){
    const c = crowd(420); if (c){   // E3 (GD, 17 Nov): fire the game casts by itself does not set G.burned
      G.fx.push({blast:true, x:c.x, y:c.y, r:0, max:78, life:22, c:'#e07a32'});
      for (const e of G.enemies) if (!e.dead && dist(e,c) < 78) strike(e, Math.max(3, mageMagic()) + 1 + m.precision, 4, {});
      G.shake = 8; }
  }
  if (m.burning && f % Math.round((4.5 - m.burning*0.7)*60) === 0){
    const spread = 0.55 + m.burning*0.22, reach = 130 + m.burning*28;
    G.fx.push({cone:true, x:L.x, y:L.y, ang:G.facing, spread, reach, life:16, c:'#e8923c'});   // timer-cast: does not set G.burned (E3)
    for (const e of G.enemies){ if (e.dead || dist(e,L) > reach) continue;
      let da = Math.atan2(e.y-L.y, e.x-L.x) - G.facing;
      while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (Math.abs(da) < spread) strike(e, 0, 0, {piercing:true, flat:1 + m.burning}); }
  }
  const shr = m.sharpers + (G.kits.some(k => k.id === 'satchel') ? 1 : 0);
  if (shr && f % Math.round(Math.max(3, 10 - shr*1.5)*60) === 0){
    const c = crowd(360); if (c){
      G.fx.push({blast:true, x:c.x, y:c.y, r:0, max:70, life:18, c:'#b8b0a0'});
      for (const e of G.enemies) if (!e.dead && dist(e,c) < 70){ e.stagger = 120; strike(e, 0, 0, {piercing:true, flat:1}); } }
  }
  if (m.briar && f % 42 === 0) G.works.push({x:L.x, y:L.y, r:30, dmg:m.briarDmg, life:260, kind:'briar'});
  if (m.stakes && f % ((5 - m.stakes)*60) === 0) G.works.push({x:L.x, y:L.y, r:42, dmg:m.stakes, life:420, kind:'stakes'});
}
function mageMagic(){
  let best = G.leader.spec === 'MAGE' ? G.leader.s.magic : 0;
  for (const u of G.squad) if (u.spec === 'MAGE' && u.state === 'up') best = Math.max(best, u.s.magic);
  return best;
}
function crowd(range){
  let best = null, bc = 0;
  for (const e of G.enemies){ if (e.dead || e.dormant || dist(e, G.leader) > range) continue;
    let c = 0; for (const o of G.enemies) if (!o.dead && dist(e,o) < 70) c++;
    if (c > bc){ bc = c; best = e; } }
  return best;
}
function updateWorks(){
  for (const w of G.works){ w.life--; if (G.frame % 30) continue;
    for (const e of G.enemies) if (!e.dead && !e.dormant && dist(w,e) < w.r) hurtEnemy(e, w.dmg); }
  G.works = G.works.filter(w => w.life > 0);
}
function updatePickups(){
  const L = G.leader, mag = 100;
  for (const p of G.pickups){
    p.life--; const d = dist(p, L);
    if (d < mag || p.mule){ const sp = p.mule ? 0.09 : 0.15; p.x += (L.x-p.x)*sp; p.y += (L.y-p.y)*sp; if (p.mule) p.life = Math.max(p.life, 60); }
    else { p.x += p.vx; p.y += p.vy; p.vx *= .94; p.vy *= .94; }
    if (d < 18){ p.got = true;
      if (p.kind === 'xp') gainXP(p.v);
      else { G.coin += p.v; pop(p.x, p.y-10, '+' + p.v + ' COIN', '#ffd700'); SFX.play('coin'); } }
  }
  G.pickups = G.pickups.filter(p => !p.got && p.life > 0);
}

/* ---------------------------------------------------------------------------
   LUCK - Q spends, R burns (Section 6.7)
--------------------------------------------------------------------------- */
function spendLuck(){
  if (G.luck < 1 || G.nudge > 0) return pop(G.leader.x, G.leader.y-30, G.luck < 1 ? 'NO LUCK LEFT' : 'LUCK ALREADY SPENT', '#999');
  G.luck--; G.nudge = 240; pop(G.leader.x, G.leader.y-30, 'LUCK: +1 TO EVERY DIE', '#f0c96a');
}
/* INDEX LK1 (Patrick 2026-11-13): a burn takes an unspent (solid) Luck pip first, so every burn shows; with none solid
   it takes a spent one. cur = available points, n = points burnt, max = the new maximum. Rollback: LUCK_SOLID.on = false. */
const LUCK_SOLID = {on: true};
function luckAfterBurn(cur, n, max){ cur = Math.max(0, cur | 0); return Math.max(0, Math.min(LUCK_SOLID.on ? cur - n : cur, max)); }
function burnLuck(){
  const L = META.leader;
  if (G.leader.down){
    if (G.leader.s.luck < 2) return pop(G.leader.x, G.leader.y-30, 'NEED 2 LUCK TO BURN', '#999');
    L.burnt = (L.burnt||0) + 2; G.leader.s = leaderStats(L); G.luck = luckAfterBurn(G.luck, 2, G.leader.s.luck);
    note(`${L.name} burns 2 Luck for good and gets up. Maximum Luck is now ${G.leader.s.luck}.`);
    return standLeader('2 LUCK BURNT: BACK UP');
  }
  if (G.leader.s.luck < 1) return pop(G.leader.x, G.leader.y-30, 'NOTHING LEFT TO BURN', '#999');
  L.burnt = (L.burnt||0) + 1;
  G.leader.s = leaderStats(L); G.luck = luckAfterBurn(G.luck, 1, G.leader.s.luck);
  G.burn = 360; G.shake = 18;
  pop(G.leader.x, G.leader.y-34, 'LUCK BURNT: EVERY DIE A NATURAL MAXIMUM', '#ff6a3a');
  note(`${L.name} burns 1 Luck for good. Maximum Luck is now ${G.leader.s.luck}.`);
}

function note(t){ if (!G) return; G.msgs.unshift({t, life:300}); G.msgs = G.msgs.slice(0, window.LOG43 === false ? 4 : 2); }
/* S6 1i F (audits/specs/s6-1-layout.md; the Founding only): a new floating word starts just above the ring of the unit it is about,
   never on the ring, and older words within 48 px above it move up a line (line height + 4) so no two overlap. ROLLBACK: L1I = false. */
function pop1i(o){
  const fs = window.gfxK ? Math.round(15 * gfxK()) : 15, lh = fs + 8, us = [G.leader].concat(G.squad || [], G.enemies || []);   /* UX 2c: a line is the font plus 8, so the 3.5 px outlines never touch */
  /* the unit the word is about: under the word (callers ask for 10 to 60 px above the unit). This is the only rule that moves words
     in the Founding (graphics.js GFX-03 and art-f48.js stand aside when L1I is on). The word always starts at the one place. */
  let u = null, bd = 28; for (const q of us){ if (!q || q.dead || q.y - o.y < -40 || q.y - o.y > 130) continue; const d = Math.abs(q.x - o.x); if (d < bd){ bd = d; u = q; } }
  if (u) o.y = u.y - (u.r || 12) - 14;
  const cy = f => f.y - (46 - f.life) * 0.7, wd = f => { try { ctx.save(); ctx.font = 'bold ' + fs + 'px Georgia'; const w = ctx.measureText(String(f.text)).width / 2; ctx.restore(); return w; } catch (e) { return String(f.text).length * fs * 0.3; } };   /* real half-width, so words that overlap sideways are stepped too (UX 2c-01) */
  /* every word the new one could touch, lowest first; each is lifted a full line clear of the one below it, all the way up the chain (UX 2c a, b, c) */
  const near = G.fx.filter(f => f.text && !f.corpse && f.life > 0 && Math.abs(f.x - o.x) < wd(f) + wd(o) && cy(f) < o.y + lh).sort((a, b) => cy(b) - cy(a));
  let floor = o.y; for (const f of near){ const c = cy(f); if (c > floor - lh) f.y -= c - (floor - lh); floor = cy(f); }
  const live = near.filter(f => f.life > 12);   // at most three words in one stack: the oldest fades when a fourth arrives
  while (live.length > 2){ let k = 0; for (let i = 1; i < live.length; i++) if (live[i].life < live[k].life) k = i; live[k].y += (live[k].life - 12) * 0.7; live[k].life = 12; live.splice(k, 1); }
}
/* UX U-slice section2 (U2): three tiers of floating words. Tier C is never a word (shown elsewhere: the Deck's pool counter, the ability card), or only the first time in a contract (G.popSeen).
   Tier B (CRITICAL, LONG RANGE, HIGH GROUND, DARK, EXPOSED, COVER, CHARGE) keeps its word until the AD's cue for it is ready: set POP_ONCE entries here then. Tier A is everything else. Never more than 3 words in a 130 px circle: the oldest goes. window.POP_TIERS = false: off. */
/* GD 458b99f2 (F3): a strongbox is contested by a walking foe within 90 px; a fixed foe (nest, engine) cannot leave it, so it does not count (same rule as contracts.js contested()) */
function vaultContested(v){ return G.enemies.some(e => !e.dead && !e.dormant && (BESTIARY[e.k] || {}).arch !== 'fixed' && dist(e, v) < 90); }
function contestRing(x, y, r){ if (G && G.fx) G.fx.push({cring: true, x, y, r: r || 34, life: 24, max: 24, c: '#ff8a7a'}); }   /* UX C2-3: same centre and radius as the objective's own progress arc */   /* UX e6e0979f: a contested objective's ring pulses #ff8a7a once a second (the callers run it on G.frame % 60) */
const POP_NEVER = /^(AUTO|MANUAL|[+][0-9]+ SHIELD POOL|ENGAGED: NO SHIELD WALL)$/, POP_ONCE = /^CLEAR THE ENEMY OFF IT$/;   /* UX e6e0979f: SHIELD POOL, NO BRACE and CLEAR THE ENEMY OFF IT have cues now: the pool pips pulse and the stance badge flash (hud-deck.js stanceBadge), the objective ring pulse (contestRing); CLEAR THE ENEMY OFF IT shows once */
function pop(x, y, text, c){
  if (window.POP_TIERS !== false){ const t = String(text);
    if (POP_NEVER.test(t)) return;
    if (POP_ONCE.test(t)){ const sn = G.popSeen || (G.popSeen = {}); if (sn[t]) return; sn[t] = 1; } }
  const o = {text, x, y, life:46, c}; if (window.L1I !== false && G.t45 && !G.over) try { pop1i(o); } catch (e) {} G.fx.push(o);
  if (window.POP_TIERS !== false) try { const near = G.fx.filter(f => f.text && !f.corpse && f.life > 12 && Math.hypot(f.x - o.x, (f.y - (46 - f.life) * 0.7) - o.y) < 65);   /* 130 px circle */
    while (near.length > 3){ let k = 0; for (let i = 1; i < near.length; i++) if (near[i].life < near[k].life) k = i; near[k].life = 12; near.splice(k, 1); } } catch (e) {} }

window.DEPLOY_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svG = typeof G !== 'undefined' ? G : undefined;
    try {
      G = {stagger: 0, wards: 0, wardFx: 0, fx: [], over: false};
      ok('canBrace true when stagger is 0', canBrace() === true);
      G.stagger = 10; ok('canBrace false when staggered', canBrace() === false);
      addWard(2); ok('addWard adds up to cap 4', G.wards === 2 && G.wardFx === 30);
      addWard(10); ok('addWard caps at 4', G.wards === 4);
      pop(10, 20, 'TEST', '#fff');
      ok('pop pushes floating text with life 46', G.fx.length === 1 && G.fx[0].text === 'TEST' && G.fx[0].life === 46 && G.fx[0].c === '#fff');
      G.t45 = true; G.leader = {x: 100, y: 120, r: 12, dead: false}; G.squad = []; G.enemies = [];
      pop(100, 100, 'FIRST', '#fff'); pop(100, 100, 'SECOND', '#ff0');
      ok('pop1i stacks two overlapping Founding pops without overlap', G.fx.length === 3 && G.fx[1].y < G.fx[2].y);
      G.t45 = false; G.fx = []; G.popSeen = null; pop(50, 50, '+3 SHIELD POOL', '#fff'); pop(50, 50, 'AUTO', '#fff'); pop(50, 50, 'CLEAR THE ENEMY OFF IT', '#f88'); pop(50, 50, 'CLEAR THE ENEMY OFF IT', '#f88');
      ok('U2 tiers: AUTO and the pool words never; CLEAR THE ENEMY OFF IT once (their cues are the pool pulse, the badge flash and the ring)', G.fx.length === 1 && G.fx[0].text === 'CLEAR THE ENEMY OFF IT');
      G.fx = []; pop(50, 50, 'ENGAGED: NO SHIELD WALL', '#ff8a7a');
      ok('U2 tiers: ENGAGED: NO SHIELD WALL never pops (POP_NEVER)', G.fx.length === 0);
      G.fx = []; contestRing(10, 20); ok('U2 cue: a contested objective pushes a #ff8a7a ring', G.fx.length === 1 && G.fx[0].cring === true && G.fx[0].c === '#ff8a7a' && G.fx[0].x === 10 && G.fx[0].y === 20);
      G.fx = []; for (let i = 0; i < 5; i++) pop(50 + i, 50, 'W' + i, '#fff');
      ok('U2 cap: at most 3 live words in a 130 px circle, the oldest goes', G.fx.filter(f => f.life > 12).length === 3 && G.fx[0].life === 12 && G.fx[1].life === 12);
      const svM = typeof META !== 'undefined' ? META : undefined;
      try {
        if (typeof META !== 'undefined' && !META) META = {retired: [], doctrines: {}, leader: {level: 1}};
        G = {
          obj: 'hunt', contract: {tier: 1, obj: 'hunt'}, frame: 100, sec: 1, over: false, paused: false,
          formation: 'SHIELD', stagger: 0, braceT: ROUND - 1, lastContact: 100, noBraceF: 0,
          wards: 0, shieldPool: 0, shieldMax: 3, mounted: false, mount: {spd: 1},
          armour: {ac: 10, mv: 0, shift: 0}, melee: {dmg: 2, reach: 0}, ranged: {dmg: 1, range: 200},
          kits: [], mod: {speed: 1, radius: 118, vanguard: 0, warden: 0, veteran: 0, hex: 0, frost: 0, scout: 0, plunder: 0, volley: 0, skirmisher: 0, fireball: 0, burning: 0, sharpers: 0, briar: 0, stakes: 0},
          ranks: {}, abil: {}, abilQ: [], squad: [], enemies: [], pickups: [], shots: [], eshots: [], hazards: [], fires: [], works: [], fx: [], caches: [], blips: [], vaults: [], camps: [{done: false}], msgs: [],
          tu22: {bursts: 10, quietT: 999}, spawnClock: 999, alarm: 0,
          leader: {x: 100, y: 100, r: 12, dead: false, down: false, con: 5, maxCon: 5, wounds: 2, maxWounds: 2, timer: 20, atkT: 0, faceT: 0, flash: 0, anim: {left: false}, spec: 'SOLDIER', p: {race: 'HUMAN', spec: 'SOLDIER', level: 1}, s: {move: 5, shift: 0, luck: 2, per: 3, magic: 0}}
        };
        update(); const t1 = G.noBraceF;
        G.frame = 200; G.braceT = ROUND - 1; G.lastContact = 200;
        update(); const t2 = G.noBraceF;
        G.frame = 280; G.braceT = ROUND - 1; G.lastContact = 280;
        update(); const t3 = G.noBraceF;
        ok('U2 cue: noBraceF 180-frame cooldown keeps old stamp inside 180 frames and refreshes after', t1 === 101 && t2 === 101 && t3 === 281, [t1, t2, t3].join(','));
      } finally { if (typeof META !== 'undefined') META = svM; }
      G.leader = {x: 0, y: 0, r: 12}; const bx = {x: 0, y: 0}; G.enemies = [{k: 'nest', x: 30, y: 0, r: 22, dead: false, dormant: false}, {k: 'engine', x: 0, y: 40, r: 22, dead: false, dormant: false}];
      ok('F3: a nest and an engine beside a strongbox do not contest it', vaultContested(bx) === false);
      G.enemies.push({k: HOST_KEYS && HOSTS[HOST_KEYS[0]].pools[1][0], x: 50, y: 0, r: 10, dead: false, dormant: false});
      ok('F3: a walking foe beside it does', vaultContested(bx) === true);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { G = svG; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};

