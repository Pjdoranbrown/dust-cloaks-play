/* INDEX TOWN30 - F-30 part B: Varnholt holds one front (scope: audits/defence-f30.md, part B; write-up audits/fable/f30.md).
   New story saves get CP().oneSide. Then the town backs onto a mountain on the west and south (rock, no passage, a
   scree apron), every wave comes down the north road or up the east road, and the town's auxiliaries (levy, militia,
   volunteers...) stand on the palisade as wall archers: placed, never moving, levy throw stones; Rally and Train make
   them more and better; the ones who fall are lost for good (the old aux rule). The squad starts outside the North Gate.
   If the North Gate falls (and it stood at the start), the fight moves to the Keep at once (C.fallback; the archers
   walk to the Keep walls) and the assault is lost only if the Keep falls (Patrick 2026-11-13). The sortie's field map
   gets the same rock on its west and south edges. The escalating assault (the prologue's last day; the full
   chronicle's "Tithe Is Called") brings a ram and ladder teams; "Over the Wall" comes over the east palisade on ladders.
   Old saves in progress (no oneSide flag) keep the old map and assaults.
   No switch (TOWN30.on was removed in INT-1, 2026-11-15). Knobs: TOWN30.K. Test: TOWN30.selfTest(). Text marked [N] is interim, for Narrative. */
(function(){
  'use strict';
  if (typeof generateVarnholt !== 'function' || typeof setupStory !== 'function' || typeof ASSAULTS === 'undefined') return;
  const T30 = window.TOWN30 = {
    K: {rate: 150, stoneRate: 300, magicRate: 120, range: 340, ladderShare: 0.2, climb: 300, cover: 3}
  };
  const K = T30.K;
  T30.applies = () => !!(typeof META !== 'undefined' && META && META.cp && META.cp.oneSide);
  T30.stamp = cp => { if (cp) cp.oneSide = true; return cp; };
  const live = () => !!(typeof G !== 'undefined' && G && G.t30 && G.obj === 'siege');

  /* ------------------------------------------------------------- the assaults --- */
  // One front: the north road, and a wing up the east road. Text marked [N] is interim for Narrative.
  const OVR = {
    // Patrick 2026-11-14 (Systems): wall fire halved (rate 80 to 150, stoneRate 160 to 300 above) and one more North mob at wave 3.
    // OLD: waves at 0, 2, 4 (3 mobs).  NEW: 0, 2, 3, 4 (4 mobs).  Rollback: delete this entry and restore the two K numbers.
    'The First Wave': {waves:[[0, [['mob', 'N']]], [2, [['mob', 'N']]], [3, [['mob', 'N']]], [4, [['mob', 'N']]]], intel:{1:'4 Hollow Levy Mobs'}},
    "The Reeve's Tithe": {waves:[[0, [['mob', 'N'], ['mob', 'E']]], [1, [['orsolt', 'E']]], [3, [['mob', 'N'], ['mob', 'E']]]],
      intel:{0:'The north road and the east road', 2:'The North Gate and the East Wall', 3:'Orsolt hangs back on the east road and flees when badly hurt.'}},
    'Over the Wall': {waves:[[0, [['raider', 'E'], ['cinder', 'E']]], [1, [['priest', 'E']]], [2, [['raider', 'E'], ['cinder', 'E']]], [4, [['mob', 'N']]]],
      ladders:true, ladderAll:['raider'],
      intel:{0:'The east road, at night, with ladders', 2:'The East Wall and Smithy Row', 3:'The raiders carry ladders. The Tithe-Priest restores their wounds.'}},
    'The Tithe Is Called': {waves:[[0, [['mob', 'N'], ['mob', 'N'], ['mob', 'E']]], [1, [['chain', 'N'], ['ram', 'N']]], [2, [['orsolt?', 'E'], ['renegade', 'E']]], [4, [['mob', 'N'], ['mob', 'E']]]],
      ladders:true,
      intel:{0:'The north road, then the east road', 1:'5 Hollow Levy Mobs, a Chain-Gang with its Overseer, a Ram Crew, a Renegade squad', 2:'The North Gate', 3:'They bring a ram and ladders. Orsolt returns, if he fled.'},
      rule:'Hold the North Gate to the end; if it falls, fall back and hold the Keep. This time they bring a ram and ladders.'},
    'The Last Wall': {waves:[[0, [['mob', 'N'], ['mob', 'N']]], [1, [['ilvaryn', 'N'], ['devil', 'E']]], [2, [['mob', 'E']]], [4, [['renegade', 'N'], ['cinder', 'E']]], [6, [['renegade', 'N']]]],
      intel:{0:'North and east, then the Keep'}},
    'The Last Day of Varnholt': {waves:[[0, [['mob', 'N'], ['mob', 'E']]], [1, [['orsolt', 'E']]], [2, [['ram', 'N'], ['renegade', 'E']]], [4, [['mob', 'N'], ['mob', 'N']]]],
      ladders:true,
      intel:{0:'The north road, and a wing up the east road', 1:'Hollow Levy Mobs, Orsolt the Hollow Reeve, a Renegade squad, a Ram Crew', 2:'The North Gate',
             3:'They bring a ram and ladders. The town cannot hold: keep the gate to the end of the day, and the wagons are waiting.'},
      rule:'Hold the North Gate, and the Keep if the gate falls, to the end of the day: this time they bring a ram and ladders. Then the town must be abandoned.'}
  };
  T30.OVR = OVR;
  // Narrative's strings (window.TOWN30_LINES, js/campaign/story.js INDEX 85q) win over the interim ones, read at call time.
  const NL = () => (typeof window !== 'undefined' && window.TOWN30_LINES) || {};
  const overlay = b => { const o = OVR[b.name], L = NL(), A = Object.assign({}, b, o, {__t30base:b, __t30lines:L});
    A.intel = b.intel.slice(); for (const i in (o.intel || {})) A.intel[i] = o.intel[i];
    const li = L.intel && L.intel[b.name]; if (li) for (const i in li) A.intel[i] = li[i];
    if (L.rule && L.rule[b.name]) A.rule = L.rule[b.name];
    return A; };
  T30.NL = NL;
  const D0 = {};
  const syncDistricts = () => { if (typeof DISTRICTS === 'undefined') return; const d = NL().districts || {};
    for (const k in DISTRICTS){ if (!D0[k]) D0[k] = {name:DISTRICTS[k].name, lost:DISTRICTS[k].lost};
      const n = T30.applies() && d[k]; DISTRICTS[k].name = n && n.name || D0[k].name; DISTRICTS[k].lost = n && n.lost || D0[k].lost; } };
  // ASSAULTS holds the base objects (QUICK or FULL); with oneSide its entries are swapped for overlaid copies.
  T30.sync = function(){
    for (let i = 0; i < ASSAULTS.length; i++){
      const A = ASSAULTS[i], b = A.__t30base || A;
      if (T30.applies() && OVR[b.name]){ if (!A.__t30base || A.__t30lines !== NL()) ASSAULTS[i] = overlay(b); }
      else if (A.__t30base) ASSAULTS[i] = b;
    }
    syncDistricts();
  };
  { const f = setChronicle; setChronicle = function(){ const r = f.apply(this, arguments); try { T30.sync(); } catch (e) { console.warn('TOWN30 sync', e); } return r; }; }
  { const f = newStory; newStory = function(){ const r = f.apply(this, arguments); try { if (META && META.cp){ T30.stamp(META.cp); T30.sync(); saveMeta(); } } catch (e) { console.warn('TOWN30 new', e); } return r; }; }
  if (typeof renderWorkBoard === 'function'){ const f = renderWorkBoard; renderWorkBoard = function(){ try { T30.sync(); } catch (e) {} return f.apply(this, arguments); }; }
  try { T30.sync(); } catch (e) {}
  window.addEventListener('load', () => { try { T30.sync(); } catch (e) {} });

  /* ---------------------------------------------------------------- the map --- */
  // The mountain: rock west of the palisade and south of it, a scree apron of hill and rubble on the open side.
  T30.mountain = function(M, contract){
    const w = M.w, h = M.h, g = M.g, r = rng(717), rock = new Uint8Array(w * h);
    const wEdge = [], sEdge = [];
    for (let y = 0; y < h; y++) wEdge[y] = y >= PAL.y0 ? PAL.x0 - 1 : PAL.x0 - 1 + Math.round((PAL.y0 - y) * 0.45 + r() * 1.2);
    for (let x = 0; x < w; x++) sEdge[x] = x <= PAL.x1 ? PAL.y1 + 1 : PAL.y1 + 1 - Math.round((x - PAL.x1) * 0.6 + r() * 1.2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x <= wEdge[y] || y >= sEdge[x]){ rock[y * w + x] = 1; g[y * w + x] = T.STONE; }
    const outside = (x, y) => x < PAL.x0 || x > PAL.x1 || y < PAL.y0 || y > PAL.y1;
    const open = t => t === T.GRASS || t === T.FOREST || t === T.HILL;
    for (let ring = 1; ring <= 2; ring++){
      const mark = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const i = y * w + x; if (rock[i] || !outside(x, y) || !open(g[i])) continue;
        let near = false; for (let oy = -1; oy <= 1 && !near; oy++) for (let ox = -1; ox <= 1; ox++){ const xx = x + ox, yy = y + oy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && rock[yy * w + xx] === ring){ near = true; break; } }
        if (near && (ring === 1 || r() < 0.45)) mark.push(i); }
      for (const i of mark){ rock[i] = ring + 1; g[i] = r() < 0.6 ? T.HILL : T.RUBBLE; }
    }
    M.trees = M.trees.filter(t => { const c = g[Math.floor(t.y / CELL) * w + Math.floor(t.x / CELL)]; return c === T.FOREST; });
    const C = CP(), A = contract && ASSAULTS[contract.assault], fall = C.fallback || (A && A.keep);
    if (!fall && (!contract || contract.obj === 'siege')) M.start = {x:24, y:6};          // outside the North Gate
    M.oneSide = true;
    const mg = M.mini.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
    M.reach = bfsFrom((M.start.x + .5) * CELL, (M.start.y + .5) * CELL, null, true);
    return M;
  };
  { const f = generateVarnholt;
    generateVarnholt = function(contract){
      const M = f.apply(this, arguments);
      try { if (T30.applies()) T30.mountain(M, contract); } catch (e) { console.warn('TOWN30 map', e); }
      return M;
    };
  }
  T30.mapDir = d => d === 'S' || d === 'W' ? 'N' : d === 'EIN' ? 'E' : d;
  { const f = edgePointDir; edgePointDir = function(dir){ return f.call(this, T30.applies() && G && G.obj === 'siege' ? T30.mapDir(dir) : dir); }; }

  /* --------------------------------------------------------- the wall archers --- */
  const NX = [21, 27, 20, 28, 18, 30, 16, 32, 14, 34, 12, 36, 10, 38], EY = [15, 21, 13, 23];
  T30.slots = function(keepFight, east){
    if (keepFight) return [33, 39, 32, 40, 34, 38].map(x => ({x:(x + .5) * CELL, y:(28 + 1.45) * CELL}))
      .concat([30, 32, 34, 36].map(y => ({x:(31 + 1.45) * CELL, y:(y + .5) * CELL})));
    const n = NX.map(x => ({x:(x + .5) * CELL, y:(PAL.y0 + 1.45) * CELL, side:'N'}));
    if (!east) return n;
    const e = EY.map(y => ({x:(PAL.x1 - .45) * CELL, y:(y + .5) * CELL, side:'E'})), out = [];
    while (n.length || e.length){ out.push(...n.splice(0, 2)); if (e.length) out.push(e.shift()); }
    return out;
  };
  T30.buildArchers = function(auxList, keepFight, east){
    const slots = T30.slots(keepFight, east), out = [];
    for (const a of auxList){ const A = AUX[a.type]; if (!A) continue;
      for (let j = 0; j < a.n && out.length < slots.length; j++){
        const s = slots[out.length], i = out.length; let spr = null;
        try { spr = auxSprite(a.type, j); } catch (e) {}
        out.push({aux:a, type:a.type, x:s.x, y:s.y, hx:s.x, hy:s.y, hp:A.con, maxHp:A.con, ac:A.ac + 1, shift:0, r:9, objHp:true, auxUnit:true, wallT30:true,
                  stones:!(A.shoot || A.magic), magic:!!A.magic, state:'up', timer:40 + i * 9, atkT:0, left:false, flash:0, spr, slot:i}); }
    }
    return out;
  };
  const ladderPts = () => [14, 18, 31, 35].map(x => ({x:(x + .5) * CELL, y:PAL.y0 * CELL - 16, side:'N'}))
    .concat([13, 23].map(y => ({x:(PAL.x1 + 1) * CELL + 16, y:(y + .5) * CELL, side:'E'})));
  T30.ladderPts = ladderPts;

  /* ------------------------------------------------------------------- setup --- */
  { const f = setupStory;
    setupStory = function(c){
      try { T30.sync(); } catch (e) {}
      f.apply(this, arguments);
      G.t30 = null;
      if (!(T30.applies() && c && c.obj === 'siege')) return;
      const C = CP(), A = ASSAULTS[c.assault], keepFight = !!(C.fallback || A.keep);
      const east = A.waves.some(w => w[1].some(g => g[1] === 'E'));
      const archers = T30.buildArchers(C.aux, keepFight, east);
      G.allies = G.allies.filter(a => !a.auxUnit || (a.aux && a.aux.hired)).concat(archers);
      G.t30 = {archers, keepFight, gate0:!!G.structs.ngate, downT:null, notes:{}, ladders:ladderPts(), ladderOn:!!A.ladders && !keepFight, ladderAll:A.ladderAll || []};
      if (G.trickle) G.trickle.dirs = [...new Set(G.trickle.dirs.map(T30.mapDir))];
      if (archers.length) note(`${archers.length} of the town's fighters stand on the ${keepFight ? 'Keep walls' : 'palisade'} and shoot for you. They never leave the wall; the ones who fall are gone for good.`);
      else note('Nobody stands on the wall: Rally the Town and Train them, and they will.');
      if (!keepFight) note('Hold the North Gate. If it falls, fall back to the Keep: lose the Keep and the assault is lost.');
    };
  }
  // The sortie is fought on a field map (generateMap), not the town: it gets the same mountain on its west and south
  // edges (Patrick 2026-11-13). A start corner in the rock moves to the north-east corner.
  T30.edgeRock = function(M, seed){
    const w = M.w, h = M.h, g = M.g, r = rng(seed || 719), rock = new Uint8Array(w * h);
    const wEdge = [], sEdge = [];
    for (let y = 0; y < h; y++) wEdge[y] = 4 + Math.round(1.5 + 1.5 * Math.sin(y / 5) + r() * 1.2);
    for (let x = 0; x < w; x++) sEdge[x] = h - 5 - Math.round(1.5 + 1.5 * Math.sin(x / 6) + r() * 1.2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x <= wEdge[y] || y >= sEdge[x]){ rock[y * w + x] = 1; g[y * w + x] = T.STONE; }
    const open = t => t === T.GRASS || t === T.FOREST || t === T.HILL || t === T.ROAD;
    for (let ring = 1; ring <= 2; ring++){ const mark = [];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++){ const i = y * w + x; if (rock[i] || !open(g[i])) continue;
        let near = false; for (let oy = -1; oy <= 1 && !near; oy++) for (let ox = -1; ox <= 1; ox++) if (rock[(y + oy) * w + x + ox] === ring){ near = true; break; }
        if (near && (ring === 1 || r() < 0.45)) mark.push(i); }
      for (const i of mark){ rock[i] = ring + 1; g[i] = r() < 0.6 ? T.HILL : T.RUBBLE; } }
    const s = M.start;
    if (s.x <= wEdge[s.y] + 6 || s.y >= sEdge[s.x] - 6){ const sx = w - 7, sy = 6;
      for (let y = sy - 3; y <= sy + 3; y++) for (let x = sx - 3; x <= sx + 3; x++) g[y * w + x] = T.GRASS;
      M.start = {x:sx, y:sy}; }
    const onRock = p => rock[Math.floor(p.y / CELL) * w + Math.floor(p.x / CELL)] === 1;
    M.trees = M.trees.filter(t => g[Math.floor(t.y / CELL) * w + Math.floor(t.x / CELL)] === T.FOREST);
    if (M.caches) M.caches = M.caches.filter(p => !onRock(p));
    if (M.blips) M.blips = M.blips.filter(p => !onRock(p));
    if (M.exit && onRock(M.exit)) M.exit = {x:(M.start.x + .5) * CELL, y:(M.start.y + .5) * CELL};
    M.oneSide = true;
    const mg = M.mini.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
    MAP = M; M.reach = bfsFrom((M.start.x + .5) * CELL, (M.start.y + .5) * CELL);
    return M;
  };
  { const f = generateMap;
    generateMap = function(c){
      const M = f.apply(this, arguments);
      try { if (T30.applies() && c && c.obj === 'sortie') T30.edgeRock(M, c.seed); } catch (e) { console.warn('TOWN30 sortie map', e); }
      return M;
    };
  }
  // nothing may spawn inside the rock: move it to the nearest open, reachable cell
  T30.unstick = function(e){
    const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL), ok = (x, y) => x > 0 && y > 0 && x < MAP.w - 1 && y < MAP.h - 1 && !BLOCKS.has(MAP.g[y * MAP.w + x]) && (!MAP.reach || MAP.reach[y * MAP.w + x] >= 0);
    for (let R = 1; R < 30; R++) for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++){
      if (Math.max(Math.abs(ox), Math.abs(oy)) !== R || !ok(cx + ox, cy + oy)) continue;
      e.x = (cx + ox + .5) * CELL; e.y = (cy + oy + .5) * CELL; return true; }
    return false;
  };
  { const f = setupStory;
    setupStory = function(c){
      f.apply(this, arguments);
      if (T30.applies() && c && c.obj === 'sortie') for (const e of G.enemies) if (e.sortie && blockedXY(e.x, e.y)) T30.unstick(e);
    };
  }

  /* ------------------------------------------------------------ ladders, spawning --- */
  { const f = spawnGroup;
    spawnGroup = function(key){
      const S = live() ? G.t30 : null, n0 = G && G.enemies ? G.enemies.length : 0;
      const r = f.apply(this, arguments);
      if (S && S.ladderOn) for (let i = n0; i < G.enemies.length; i++){
        const e = G.enemies[i], B = BESTIARY[e.k]; if (!B || B.boss || B.ram || RANGED_ARCH(B.arch) || e.flees) continue;
        if (!S.ladderAll.includes(String(key).replace('?', '')) && Math.random() > K.ladderShare) continue;
        const side = e.x > PAL.x1 * CELL ? 'E' : 'N', ls = S.ladders.filter(l => l.side === side); if (!ls.length) continue;
        e.lad30 = pickOf(ls); e.climb = 0;
        if (!S.notes.ladder){ S.notes.ladder = true; note('Ladders! Teams are making for the palisade. The archers on the wall shoot the climbers first.'); }
      }
      return r;
    };
  }

  /* --------------------------------------------------------------- targeting --- */
  const gateUp = () => !!(G.structs && G.structs.ngate && G.structs.ngate.hp > 0);
  { const f = storyTarget;
    storyTarget = function(e){
      if (!live()) return f.apply(this, arguments);
      const S = G.t30;
      if (outsideWalls(e)){
        if (e.lad30 && gateUp()) return e.lad30;
        const B = BESTIARY[e.k];
        if (B && RANGED_ARCH(B.arch) && !B.boss && e.seed % 2 === 0){ let best = null, bd = (B.rng || 260) + 40;
          for (const a of S.archers) if (a.state === 'up'){ const d = dist(e, a); if (d < bd){ bd = d; best = a; } } if (best) return best; }
        // the men on the wall are out of reach from outside: hide them from the melee pick
        const all = G.allies; G.allies = all.filter(a => !a.wallT30);
        try { return f.apply(this, arguments); } finally { G.allies = all; }
      }
      return f.apply(this, arguments);
    };
  }
  // one front: the palisade sections hold; only the North Gate gives (live test: the ne and ep sections fell in 50 s, gate untouched)
  T30.solid = k => !!(live() && (!G.t30.keepFight || G.t30.fellBack) && k !== 'ngate' && !/^k/.test(k));   // after a fall back too: the way in is the broken gate
  { const f = damageObjective;
    damageObjective = function(t, d){
      if (t && t.struct && T30.solid(t.k)) return;
      return f.apply(this, arguments);
    };
  }
  // Heavy Cover: a shot at a wall archer stops in the palisade on 1-3
  { const f = storyShot;
    storyShot = function(s){
      if (live()) for (const a of G.t30.archers) if (a.state === 'up' && !a.walking && Math.hypot(a.x - s.x, a.y - 6 - s.y) < 12 && d6() <= K.cover){ pop(a.x, a.y - 26, 'COVER', '#c9c0a8'); return true; }
      return f.apply(this, arguments);
    };
  }
  if (window.TERRAIN && TERRAIN.highs) TERRAIN.highs.push(u => !!(u && u.wallT30 && !u.walking && typeof G !== 'undefined' && G && G.t30));

  /* ------------------------------------------------------------- each frame --- */
  function archerShot(a){
    let best = null, bs = 1e9;
    for (const e of G.enemies){ if (e.dead || e.dormant || e.fleeing) continue; const d = dist(e, a); if (d > K.range) continue;
      const B = BESTIARY[e.k]; if (B && B.arch === 'fixed') continue;
      const score = d - (B && B.ram ? 400 : 0) - (e.climb > 0 ? 300 : 0) - (!outsideWalls(e) ? 250 : 0);
      if (score < bs){ bs = score; best = e; } }
    if (!best) return 15;
    const A = AUX[a.type], ang = Math.atan2(best.y - (a.y - 16), best.x - a.x);
    G.shots.push({x:a.x, y:a.y - 16, vx:Math.cos(ang) * 9, vy:Math.sin(ang) * 9, life:60, kind:a.magic ? 'missile' : 'arrow', target:best,
                  skill:a.stones ? 0 : (A.r || 0) + 1, dmg:a.stones ? 1 : 2, flat:0});
    a.atkT = 12; a.left = best.x < a.x;
    return Math.round((a.stones ? K.stoneRate : a.magic ? K.magicRate : K.rate) * rnd(0.85, 1.15));
  }
  function frameT30(){
    const S = G.t30;
    for (const a of S.archers){ if (a.flash > 0) a.flash--; if (a.atkT > 0) a.atkT--;
      if (a.walking && a.state === 'up'){ const dx = a.hx - a.x, dy = a.hy - a.y, d = Math.hypot(dx, dy);   // off the wall to the Keep
        if (d <= 2.6){ a.walking = false; a.x = a.hx; a.y = a.hy; } else { a.x += dx / d * 2.4; a.y += dy / d * 2.4; a.left = dx < 0; }
        a.moving = a.walking; continue; }
      a.x = a.hx; a.y = a.hy; a.moving = false;
      if (a.state === 'up' && G.prepT <= 0 && --a.timer <= 0) a.timer = archerShot(a); }
    const up = gateUp();
    for (const e of G.enemies){ if (e.dead || !e.lad30) continue;
      if (!up){ e.lad30 = null; e.climb = 0; continue; }
      const Lp = e.lad30; if (Lp.by && (Lp.by.dead || Lp.by.lad30 !== Lp || dist(Lp.by, Lp) >= 36)) Lp.by = null;
      if (dist(e, Lp) < 36 && (!Lp.by || Lp.by === e)){ Lp.by = e;
        if (++e.climb >= K.climb){ Lp.by = null; e.lad30 = null; e.climb = 0;
          if (Lp.side === 'E'){ e.x = (PAL.x1 - .5) * CELL; e.y = Lp.y; } else { e.x = Lp.x; e.y = (PAL.y0 + 1.6) * CELL; }
          pop(e.x, e.y - 30, 'OVER THE WALL', '#ff6a5a'); SFX.play('down'); } }
      else e.climb = 0; }
  }
  { const f = updateStory;
    updateStory = function(){
      if (!live()) return f.apply(this, arguments);
      const all = G.allies; G.allies = all.filter(a => !a.wallT30);          // the old aux AI would walk them off the wall
      try { f.apply(this, arguments); } finally { G.allies = all; }
      frameT30();
    };
  }
  // Gate down (Patrick 2026-11-13): no loss. The fight moves to the Keep, and the assault is lost only if the Keep falls.
  // C.fallback goes up at once (targeting, HUD and the base Keep-fall check read it); the districts beyond go in the debrief.
  T30.fallBack = function(){
    const S = G.t30, C = CP(); if (S.fellBack) return;
    S.fellBack = true; S.keepFight = true; S.ladderOn = false;
    C.fallback = true; C.canFallBack = false;
    for (const e of G.enemies) if (e.lad30){ e.lad30 = null; e.climb = 0; }
    const slots = T30.slots(true, false); let i = 0;
    for (const a of S.archers) if (a.state === 'up'){ const s = slots[i % slots.length], ring = Math.floor(i / slots.length);
      a.hx = s.x + ring * 14; a.hy = s.y + ring * 10; a.walking = true; i++; }
    const kg = G.structs && G.structs.kgate;
    const gd = NL().gateDown || {};
    if (kg) G.alert = {text:gd.banner || 'FALL BACK TO THE KEEP', t:kg, life:320};
    try { SFX.play('horn'); } catch (e) {}
    const tl = gd.toast && gd.toast.length ? gd.toast[Math.floor(Math.random() * gd.toast.length)] : 'The North Gate is down! Fall back to the Keep: the fight is there now.';
    note(tl); note(gd.coach || 'Lose the Keep and the assault is lost.');
  };
  // the Keep stands unless its gate is down and the enemy holds the yard (the base game's own Keep-fall test)
  T30.keepStands = function(){
    const kg = G.structs && G.structs.kgate; if (!kg || kg.hp > 0) return true;
    const K = G.districts && G.districts.keep; if (!K) return false;
    const en = G.enemies.filter(e => !e.dead && dist(e, K) < K.r).length, fr = squadUnits().filter(u => dist(u, K) < K.r).length;
    return !(en > fr + 4 && !(dist(G.leader, K) < K.r));
  };
  { const f = storyCheck;
    storyCheck = function(){
      if (live() && !G.over){ const S = G.t30;
        if (!S.keepFight && S.gate0 && G.prepT <= 0 && !gateUp()) T30.fallBack();
        // time up after a fall back: the base check would ask for the North Gate; ask for the Keep instead
        if (S.fellBack && G.prepT <= 0 && (G.storyT || 0) >= G.timeLimit){
          if (T30.keepStands()){ endDeployment('victory'); return true; }
          return contractFail('THE KEEP HAS FALLEN', 'The Keep is overrun.');
        }
      }
      return f.apply(this, arguments);
    };
  }

  /* ------------------------------------------------------------ HUD, debrief --- */
  { const f = storyLine;
    storyLine = function(){
      const L = f.apply(this, arguments);
      if (live() && G.prepT <= 0 && L && L[1]) L[1] += `  ·  ${G.t30.archers.filter(a => a.state === 'up').length} ON THE WALL`;
      return L;
    };
  }
  { const f = storyDebrief;
    storyDebrief = function(c, result, lines){
      const S = G && G.t30, r = f.apply(this, arguments);
      if (S && c && c.obj === 'siege' && S.fellBack){ const C = CP();
        for (const k in C.district) if (k !== 'keep') C.district[k] = 'overrun';
        try { CAMP.cpMap = null; syncStoryFacilities(); } catch (e) {}
        lines.push(`<p class="bad">${NL().gateDown && NL().gateDown.debriefLost || 'The North Gate fell and the company fell back to the Keep.'} Every district beyond its walls is lost.</p>`); }
      else if (S && c && c.obj === 'siege' && S.gate0 && !S.keepFight && result === 'victory' && NL().gateDown && NL().gateDown.debriefHeld) lines.push(`<p class="good">${NL().gateDown.debriefHeld}</p>`);
      if (S && c && c.obj === 'siege' && S.archers.length){
        const dead = S.archers.filter(a => a.state === 'dead').length;
        lines.push(dead ? `<p class="bad">${dead} of the ${S.archers.length} on the wall fell. They are gone for good.</p>`
                        : `<p class="good">All ${S.archers.length} on the wall came down alive.</p>`);
      }
      return r;
    };
  }
  // coach lines [N]: interim, for Narrative
  { const f = coachLines;
    coachLines = function(){
      const out = f.apply(this, arguments);
      if (!T30.applies()) return out;
      const pairs = NL().coach;
      if (Array.isArray(pairs) && pairs.length) return out.map(s => pairs.reduce((t, p) => t.replace(p[0], p[1]), s));
      return out.map(s => s
        .replace('Your own gates open for you. Walk out and press <b>F</b> to set traps before the horn.', 'The squad starts outside the North Gate; it opens for you. Press <b>F</b> to set traps before the horn.')
        .replace('The town cannot hold. Survive the day; then the wagons are waiting.', 'The town cannot hold. Hold the North Gate, then the Keep if it falls, to the end of the day; then the wagons are waiting. This time they bring a ram and ladders.')
        .replace('Your levies run there first.', 'Your levies and militia stay on the wall and shoot; the ones who fall are gone for good.'));
    };
  }

  /* ---------------------------------------------------------------- drawing --- */
  { const f = storyBodies;
    storyBodies = function(bodies, onScreen){
      const r = f.apply(this, arguments);
      if (live()) for (const L of G.t30.ladders) if (onScreen(L, 60) && G.enemies.some(e => !e.dead && e.lad30 === L && e.climb > 0)) bodies.push({y:L.y - 2, custom:() => {
        ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(L.x - 8, L.y); ctx.lineTo(L.x - 6, L.y - 62); ctx.moveTo(L.x + 8, L.y); ctx.lineTo(L.x + 10, L.y - 62);
        for (let k = 8; k < 60; k += 10){ ctx.moveTo(L.x - 7, L.y - k); ctx.lineTo(L.x + 9, L.y - k); } ctx.stroke(); }});
      return r;
    };
  }

  /* --------------------------------------------------------------- self-test --- */
  T30.selfTest = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    if (typeof META === 'undefined' || !META) return {ok:false, n:0, pass:0, fails:['no META'], out};
    const sv = {G, MAP, cp:META.cp, cover:K.cover, cf:contractFail, note};
    try {
      ok('new saves get the one-side flag', T30.stamp({}).oneSide === true);
      const fake = oneSide => { const cp = {part:'siege', day:3, oneSide, fallback:false, aux:[], st:{}, district:{market:'held', mill:'held', smithy:'held', common:'held', ore:'held', keep:'held'}, fort:{stakes:0, firepits:0, barricades:0, murder:false}, orsolt:'alive'};
        for (const k in STRUCTS) cp.st[k] = {hp:STRUCTS[k].max * HPX, max:STRUCTS[k].max * HPX}; return cp; };
      META.cp = fake(false); T30.sync();
      ok('old saves keep the old assaults', ASSAULTS.every(A => !A.__t30base));
      META.cp = fake(true); T30.sync();
      const dirs = ASSAULTS.flatMap(A => A.waves.flatMap(w => w[1].map(g => g[1])));
      ok('one side: every wave from the north road or the east road', dirs.every(d => d === 'N' || d === 'E'), [...new Set(dirs)].join(','));
      ok('the escalating assault brings a ram and ladders', ASSAULTS.some(A => A.ladders && A.waves.some(w => w[1].some(g => g[0] === 'ram'))));
      ok('no intel card says three sides', ASSAULTS.every(A => !/three sides|all sides/i.test(A.intel[0])));
      const iq = ASSAULTS.findIndex(A => !A.keep);
      const M = generateVarnholt({obj:'siege', assault:iq}), at = (x, y) => M.g[y * M.w + x], rc = (x, y) => M.reach[y * M.w + x] >= 0;
      ok('rock on the west and south', at(2, 25) === T.STONE && at(20, 45) === T.STONE && at(PAL.x0 - 1, 20) === T.STONE);
      ok('the north road and east road stay open', at(24, 2) === T.ROAD && at(M.w - 1, 18) === T.ROAD);
      ok('the squad starts outside the North Gate', M.start.y < PAL.y0, M.start.x + ',' + M.start.y);
      ok('no way round: the rock is out of reach', rc(24, 1) && rc(M.w - 2, 25) && !rc(2, 25) && !rc(20, 45));
      G = {obj:'siege', enemies:[], allies:[], shots:[], fx:[], msgs:[], structs:{}, districts:{}, contract:{assault:iq}, leader:{x:24 * CELL, y:2 * CELL, down:false}, prepT:0, storyT:0, timeLimit:1e9};
      const pS = [], pW = []; for (let i = 0; i < 12; i++){ pS.push(edgePointDir('S')); pW.push(edgePointDir('W')); }
      ok('south and west waves land on the north road', pS.concat(pW).every(p => p.y < PAL.y0 * CELL));
      const ar = T30.buildArchers([{type:'militia', n:6}, {type:'levy', n:4}], false, false);
      ok('the town\'s fighters stand on the north wall', ar.length === 10 && ar.every(a => a.wallT30 && a.auxUnit && Math.abs(a.y - (PAL.y0 + 1.45) * CELL) < 1));
      ok('levy throw stones, militia shoot', ar.filter(a => a.stones).length === 4 && ar.filter(a => a.type === 'militia' && !a.stones).length === 6);
      const ae = T30.buildArchers([{type:'militia', n:6}, {type:'militia', n:6}], false, true);
      ok('an east wing puts some on the east wall', ae.some(a => Math.abs(a.x - (PAL.x1 - .45) * CELL) < 1) && ae.length === 12);
      const ak = T30.buildArchers([{type:'militia', n:6}, {type:'militia', n:6}], true, false);
      ok('at the Keep they stand on the Keep walls', ak.length === 10 && ak.every(a => a.x > 31 * CELL && a.y > 28 * CELL));
      const gs = STRUCTS.ngate;
      G.structs.ngate = {k:'ngate', x:gs.face[0] * CELL, y:gs.face[1] * CELL, hp:50, maxHp:50, r:34, objHp:true, struct:true, name:gs.name};
      G.t30 = {archers:ar, keepFight:false, gate0:true, downT:null, notes:{}, ladders:ladderPts(), ladderOn:true, ladderAll:[]};
      G.allies = ar.slice();
      const fk = Object.keys(BESTIARY).find(k => BESTIARY[k].arch === 'brute' && !BESTIARY[k].ram && !BESTIARY[k].boss);
      const foot = {k:fk, x:ar[0].x, y:(PAL.y0 - 1.5) * CELL, seed:1};
      const t1 = storyTarget(foot);
      ok('outside, the foot go for the gate, not the men on the wall', t1 && !t1.wallT30, t1 ? (t1.name || 'xy') : 'null');
      foot.lad30 = G.t30.ladders[0]; ok('a ladder team goes for its ladder', storyTarget(foot) === G.t30.ladders[0]); foot.lad30 = null;
      ok('the men on the wall have higher ground (F-28)', !window.TERRAIN || !TERRAIN.high || TERRAIN.high(ar[0]));
      K.cover = 6; const hp0 = ar[0].hp;
      ok('a shot at the wall stops in the palisade (Heavy Cover)', storyShot({x:ar[0].x, y:ar[0].y - 6, dmg:2}) && ar[0].hp === hp0);
      K.cover = sv.cover;
      const ne = {k:'ne', hp:40, maxHp:40, struct:true, name:'East Palisade', x:0, y:0}; damageObjective(ne, 10);
      ok('one front: the side palisade holds, only the gate gives', ne.hp === 40 && T30.solid('nw') && !T30.solid('ngate') && !T30.solid('kgate'));
      let failed = null; note = () => {}; contractFail = (h) => { failed = h; return true; };
      G.structs.ngate.hp = 0; for (let i = 0; i < 300; i++) storyCheck();
      ok('gate down: no loss, the fight moves to the Keep', !failed && G.t30.fellBack && G.t30.keepFight && META.cp.fallback === true);
      ok('gate down: the archers walk to the Keep walls', ar.every(a => a.walking && a.hy > 28 * CELL) && !G.t30.ladderOn);
      ok('walking archers have no cover or high ground', !(window.TERRAIN && TERRAIN.highs && TERRAIN.highs.some(fn => fn(ar[0]))));
      const kp = STRUCTS.kgate; G.structs.kgate = {k:'kgate', x:kp.face[0] * CELL, y:kp.face[1] * CELL, hp:40, maxHp:40, struct:true, name:kp.name};
      ok('the Keep stands while its gate does', T30.keepStands());
      G.storyT = G.timeLimit = 100; let won = null; const ed = endDeployment; endDeployment = r => { won = r; };
      try { storyCheck(); } finally { endDeployment = ed; }
      ok('time up after the fall back: holding the Keep wins', won === 'victory' && !failed, String(won));
      contractFail = sv.cf; note = sv.note;
      META.cp.part = 'siege'; META.cp.day = 3;
      const cl = coachLines().join(' ');
      ok('coach lines: no levies running about', !/run there first/.test(cl));
      { T30.sync(); const L = window.TOWN30_LINES, T = ASSAULTS.find(A => A.name === 'The Last Day of Varnholt'), cl2 = coachLines().join(' '); const bits = !L ? [] : [T && T.intel[3] === L.intel['The Last Day of Varnholt'][3], T && T.rule === L.rule['The Last Day of Varnholt'], !/Your levies run there first/.test(cl2), DISTRICTS.ore.name === L.districts.ore.name]; ok('Narrative lines win: intel, rule, coach, Ore Yard', bits.every(Boolean), L ? bits.map(b => b ? 1 : 0).join('') : 'no TOWN30_LINES'); }
      const SM = generateMap(storyContract('sortie', {seed:4242})), sat = (x, y) => SM.g[y * SM.w + x];
      ok('the sortie field has rock on the west and south', sat(3, SM.h >> 1) === T.STONE && sat(SM.w >> 1, SM.h - 4) === T.STONE && SM.oneSide
        && !BLOCKS.has(sat(SM.start.x, SM.start.y)) && SM.start.x > 8 && SM.start.y < SM.h - 10, SM.start.x + ',' + SM.start.y);
      META.cp = fake(false); T30.sync(); G = sv.G;
      const M0 = generateVarnholt({obj:'siege', assault:iq});
      ok('an old save (no one-side flag): the old map and assaults', M0.g[25 * M0.w + 2] !== T.STONE && !M0.oneSide && ASSAULTS.every(A => !A.__t30base));
    } catch (e) { ok('no throw', false, String(e && e.stack || e).slice(0, 200)); }
    finally { G = sv.G; MAP = sv.MAP; META.cp = sv.cp; K.cover = sv.cover; contractFail = sv.cf; note = sv.note; try { T30.sync(); } catch (e) {} }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
