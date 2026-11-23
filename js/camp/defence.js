/* INDEX DEF30 - F-30 "Hold the gate" (scope: audits/defence-f30.md, part A; write-up audits/fable/f30.md).
   A camp raid at the fort holding (with a palisade) becomes one front: a forest road from the south, the
   palisade with one gate, the camp behind it. The squad fights in front of the gate. Mates who did not march,
   veterans and officers stand on the wall walk as archers (own Ranged skill, stones at half rate without one,
   higher ground through F-28, knocked out but never killed). A ram comes three times. From Tier 2 ladder teams
   go for the flanks. With a Watchtower, two towers flank the gate; fire arrows can set them burning (the
   Leader stands by one to put it out). If the gate falls it is a second phase, not a loss: raiders go for the
   buildings, and after 30 s inside they start on the Vault. The flat 30% loss is gone. Win: the timer ends
   with the gate standing, or the camp is cleared after it. Loss: the Chapter House, as before.
   Other holdings, and a fort with no palisade, keep the old ring raid.
   No switch (DEF30.on, quietTips and rewards were removed in INT-1, 2026-11-15). Knobs: DEF30.K. Test: DEF30.selfTest().
   Campaign hooks (F-34 step 4, all on the contract, so nothing leaks into a normal raid): c.force30 uses the gate map
   without a fort or palisade (Varnholt's North Gate); c.towers30 puts the two gate towers up without a Watchtower;
   c.wall30 = how many stand on the wall (militia fill the gap); c.script30.breachAt = the share of the clock at which
   the gate gives way whatever its hit points (the third defence). DEF30.script.breachAt is the same for every raid (0 = off).
   DEF30.onScripted(contract), if set, runs when the scripted breach fires (campaign34 shows the b10 breach lines).
   DEF30.onEvent(kind, contract), if set, runs at 'start' (the wall is manned), 'ladder' (the first ladder team),
   'ram' (the first ram) and 'breach' (the gate is down); campaign34 fires its tips there (F-34 step 6). */
(function(){
  'use strict';
  if (typeof generateRaidMap !== 'function' || typeof setupRaid !== 'function') return;
  const D = window.DEF30 = {
    K: {w: 36, h: 40, wallY: 17, slots: 6, perTower: 2, cap: 12, militia: 3,
        rate: 75, stoneRate: 150, range: 340, gateHp: k => 2 * GATE_HP + 40 * k, ramAt: [0.2, 0.55, 0.85], ramHit: k => 8 + 2 * d6() + 2 * k,
        ladderTier: 2, ladderShare: k => k >= 3 ? 0.25 : 0.15, climb: 300, towerHp: k => 40 + 10 * k, burnHp: 3, douse: 90,
        lootAfter: 30 * 60, lootPerSec: 0.01, lootCap: 0.3, cover: 3, clearCap: k => 8 + 6 * k}
  };
  const K = D.K;
  D.script = {breachAt: 0};
  const gate30 = () => !!(G && G.obj === OBJ_DEFEND && G.def30);
  D.applies = () => !!(META && has('palisade') && holdKey() === 'fort');

  /* ---------------------------------------------------------------- the map --- */
  function gateMap(contract){
    const w = K.w, h = K.h, WY = K.wallY, cx = w >> 1, r = rng((contract.seed || 7) + 30), g = new Uint8Array(w * h);
    const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
    const M = {w, h, g, seed:contract.seed, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null, cages:[], nests:[], engines:[], beacons:[]};
    const nf = valueNoise(w, h, 6, r);
    // the approach: a forest road, thick at the flanks
    for (let y = WY + 1; y < h; y++) for (let x = 0; x < w; x++){
      const side = Math.abs(x + .5 - cx);
      if (side > 11 && nf(x, y) > 0.3) set(x, y, T.FOREST);
      else if (side > 5 && r() < 0.05) set(x, y, T.FOREST);
    }
    for (let y = 7; y < h; y++){ set(cx - 1, y, T.ROAD); set(cx, y, T.ROAD); }
    // the camp: the Chapter House, tents, a cross road
    for (let x = 4; x < w - 4; x++) set(x, 10, T.ROAD);
    for (let y = 4; y <= 6; y++) for (let x = cx - 1; x <= cx + 1; x++) set(x, y, T.STONE);
    for (const [tx, ty] of [[11, 4], [23, 4], [12, 8], [22, 8], [14, 13], [20, 13]]) if (r() < .9){ set(tx, ty, T.TENT); set(tx + 1, ty, T.TENT); }
    // the wall walk, the palisade, the gate
    for (let x = 1; x < w - 1; x++){ set(x, WY - 1, T.FLOOR); set(x, WY, T.PALISADE); }
    const gateCells = [[cx - 1, WY], [cx, WY]];
    for (const [x, y] of gateCells) set(x, y, T.GATE);
    for (let x = 0; x < w; x++){ set(x, 0, T.STONE); set(x, h - 1, T.STONE); }
    for (let y = 0; y < h; y++){ set(0, y, T.STONE); set(w - 1, y, T.STONE); }
    // F17: the sally gate, in the back wall, up the north-east side past the Keep. Shut and unmarked until the breach (b10 only); the wall stays STONE, the door is drawn over it
    if (contract.f34 === 'b10' || contract.sally30) M.sally = {x:(cx + 10) * CELL, y:1.3 * CELL, w:2 * CELL};
    M.start = {x:cx, y:WY + 3};
    M.house = {x:(cx + .5) * CELL, y:5.5 * CELL};
    M.towers = (has('watchtower') || contract.towers30) ? [cx - 3, cx + 2].map(tx => ({x:(tx + .5) * CELL, y:(WY - .3) * CELL, timer:0})) : [];
    M.def30 = {WY, cx, gateCells, sally:M.sally || null,
      ladders: [cx - 8, cx - 12, cx + 7, cx + 11].map(lx => ({x:(lx + .5) * CELL, y:(WY + 1) * CELL + 16, ladder:true})),
      slots: [cx - 3, cx + 2, cx - 5, cx + 4, cx - 7, cx + 6, cx - 9, cx + 8, cx - 11, cx + 10, cx - 13, cx + 12, cx - 15, cx + 14].map(sx => (sx + .5) * CELL),
      facSlots: [[5, 4], [30, 4], [6, 8], [29, 8], [9, 13], [26, 13], [4, 13], [31, 13]].map(([fx, fy]) => ({x:(fx + .5) * CELL, y:(fy + .5) * CELL}))};
    MAP = M;
    M.reach = bfsFrom((cx + .5) * CELL, (WY + 3.5) * CELL);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y * w + x] === T.FOREST && r() < 0.55) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
    M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
    M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
    return M;
  }
  D.gateMap = gateMap;
  { const f = generateRaidMap;
    generateRaidMap = function(c){
      if (c) c.gate30 = false;
      try { if (c && (c.force30 || D.applies())){ c.gate30 = true; return gateMap(c); } } catch (e) { console.warn('DEF30 map', e); c.gate30 = false; }
      return f.apply(this, arguments);
    };
  }

  /* --------------------------------------------------------- the wall archers --- */
  D.slotCount = towers => Math.min(K.cap, K.slots + K.perTower * towers);
  D.pickArchers = function(nSlots, fill){
    const inSquad = new Set((G && G.squad || []).map(m => m.p && m.p.id));
    const up = p => p && !(p.resting > 0) && !p.away && !p.dead;
    const out = [];
    for (const o of officers()) if (up(o)) out.push({p:o, s:leaderStats(o), kind:'officer'});
    for (const p of (META.retired || [])) out.push({p, s:mateStats(p), kind:'veteran'});
    const mates = META.roster.filter(p => up(p) && !inSquad.has(p.id) && p !== META.leader).map(p => ({p, s:mateStats(p), kind:'mate'}));
    mates.sort((a, b) => (b.s.ranged || 0) - (a.s.ranged || 0));
    const list = out.concat(mates).slice(0, nSlots);
    for (let i = list.length; i < Math.max(K.militia, Math.min(nSlots, fill | 0)); i++) list.push({p:{name:'Militia', id:null}, s:{ranged:AUX.militia.r, con:AUX.militia.con}, kind:'militia', i});
    return list;
  };
  function makeArcher(a, x, y, i){
    const stones = !((a.s.ranged || 0) > 0), con = Math.max(2, a.s.con || 3);
    let spr = null;
    try { spr = a.kind === 'militia' ? auxSprite('militia', i) : personSprite(a.p, a.kind === 'officer'); } catch (e) {}
    return {p:a.p, s:a.s, kind:a.kind, spec:a.p.spec, x, y, hx:x, hy:y, hp:con * 2, maxHp:con * 2, ac:G.armour.ac + 1, shift:G.armour.shift, r:10,
      objHp:true, ally:true, wall30:true, vet:a.kind !== 'mate', stones, state:'up', koT:0, timer:40 + i * 11, atkT:0, left:false, flash:0, spr};
  }

  /* ------------------------------------------------------------------- setup --- */
  { const f = setupRaid;
    setupRaid = function(c){
      f.apply(this, arguments);
      if (!(c && c.gate30 && MAP.def30)) { if (G) G.def30 = null; return; }
      const M = MAP.def30, tier = c.tier || 1, gx = M.cx * CELL, gy = (M.WY + .5) * CELL, hp = K.gateHp(tier);
      G.def30 = {WY:M.WY, cx:M.cx, ladders:M.ladders, rams:K.ramAt.map(() => false), breach:false, breachAt:(c.script30 && c.script30.breachAt) || D.script.breachAt || 0, inT:0, loot:0, t0:META.treasury || 0,
                 notes:{}, ko:new Set(), archers:[]};
      G.gates = [{x:gx, y:gy, nx:0, ny:1, hp, maxHp:hp, r:30, ac:6, shift:2, objHp:true, gate:true, flash:0}];
      (G.facs || []).forEach((t, i) => { const s = M.facSlots[i % M.facSlots.length]; t.x = s.x; t.y = s.y; });
      for (const t of G.towers){ t.hp = t.maxHp = K.towerHp(tier); t.burn = 0; t.douse = 0; }
      const picks = c.wall30 ? D.pickArchers(c.wall30, c.wall30) : D.pickArchers(D.slotCount(G.towers.length)), ay = (M.WY - .45) * CELL;
      const xs = M.slots.filter(x => !G.towers.some(t => Math.abs(t.x - x) < 20));
      G.def30.archers = picks.map((a, i) => makeArcher(a, xs[i % xs.length], ay, i));
      G.allies = G.def30.archers.slice();
      note(`Hold the gate for ${c.minutes} minutes. ${G.allies.length} stand on the wall and shoot for you. A ram will come up the road: kill its crew before it reaches the gate.`);
      D.ev('start');
    };
  }
  { const f = raidEdgePoint;
    raidEdgePoint = function(){
      if (!gate30()) return f.apply(this, arguments);
      for (let i = 0; i < 40; i++){
        const x = (3 + Math.random() * (MAP.w - 6) + .5) * CELL, y = (MAP.h - 3 + .5) * CELL;
        if (MAP.reach[cellIdx(x, y)] >= 0) return {x, y};
      }
      return {x:G.def30.cx * CELL, y:(MAP.h - 2.5) * CELL};
    };
  }

  /* ---------------------------------------------------------------- spawning --- */
  { const f = raidSpawn;
    raidSpawn = function(){
      if (!gate30()) return f.apply(this, arguments);
      const S = G.def30, lim = G.contract.minutes * 3600;
      if (G.raidT >= lim) return;                                     // time is up: no more come
      const n0 = G.enemies.length;
      f.apply(this, arguments);
      const tier = G.contract.tier || 1;
      if (tier >= K.ladderTier) for (let i = n0; i < G.enemies.length; i++){
        const e = G.enemies[i], B = BESTIARY[e.k];
        if (B.boss || B.ram || RANGED_ARCH(B.arch) || Math.random() > K.ladderShare(tier)) continue;
        e.ladder30 = pickOf(S.ladders); e.climb = 0;
        if (!S.notes.ladder){ S.notes.ladder = true; note('Ladders! A team is making for the flank of the palisade. The wall archers will shoot the climbers first.'); D.ev('ladder'); }
      }
      if (G.prepT > 0) return;
      const prog = G.raidT / lim;
      K.ramAt.forEach((at, i) => {
        if (S.rams[i] || prog < at) return; S.rams[i] = true; if (S.breach) return;   // no ram once the gate is down
        const e = spawnEnemy('ram', S.cx * CELL, (MAP.h - 2.5) * CELL); if (!e) return;
        e.con = e.maxCon = Math.round(BESTIARY.ram.con * (1 + 0.5 * (tier - 1))); e.seen = true; e.ram30 = true;
        SFX.play('horn'); note(i ? 'Another ram is coming up the road.' : 'A battering ram is coming up the road. Kill its crew before it reaches the gate.'); if (!i) D.ev('ram');
      });
    };
  }

  /* --------------------------------------------------------------- targeting --- */
  const inside = e => e.y < G.def30.WY * CELL;
  D.target = function(e){
    const S = G.def30, L = G.leader, gate = G.gates[0], B = BESTIARY[e.k], up = gate && gate.hp > 0;
    if (!inside(e)){
      if (B.ram) return up ? gate : null;
      if (e.ladder30 && up) return e.ladder30;
      if (up){
        if (RANGED_ARCH(B.arch) && e.seed % 2 === 0){ let best = null, bd = (B.rng || 260) + 40; for (const a of S.archers) if (a.state === 'up'){ const d = dist(e, a); if (d < bd){ bd = d; best = a; } } if (best) return best; }
        return (e.seed % 3 !== 0 || dist(e, L) > 300) ? gate : null;
      }
      // the gate is down: in through the gap
      const gx = gate ? gate.x : S.cx * CELL, gy = (S.WY + .5) * CELL;
      return Math.abs(e.x - gx) < 40 && e.y < gy + 70 ? {x:gx, y:gy - 90} : {x:gx, y:gy + 30};
    }
    let best = null, bd = 120;
    for (const a of S.archers) if (a.state === 'up'){ const d = dist(e, a); if (d < bd){ bd = d; best = a; } }
    if (best && bd < dist(e, L)) return best;
    const facs = (G.facs || []).filter(t => t.hp > 0);
    if (facs.length && e.seed % 2 === 0){ let bf = null, bfd = 1e9; for (const t of facs){ const d = dist(e, t); if (d < bfd){ bfd = d; bf = t; } } if (bf) return bf; }
    if (G.house.hp > 0 && (e.seed % 3 === 0 || dist(e, G.house) < 140)) return G.house;
    return null;
  };
  { const f = raidTarget; raidTarget = function(e){ return gate30() ? D.target(e) : f.apply(this, arguments); }; }

  // the ram: walks to the gate and beats on it
  { const f = contractEnemyAI;
    contractEnemyAI = function(e, B){
      if (gate30() && B && B.ram){
        const gate = G.gates[0];
        if (gate && gate.hp > 0){
          const tx = gate.x, ty = gate.y + 34, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
          if (d > 14){ e.x += dx / d * B.speed; e.y += dy / d * B.speed; e.left = dx < 0; collide(e, e.r * .7); }
          if (dist(e, gate) <= e.r + gate.r + 50 && --e.hitCd <= 0){ e.hitCd = 150; e.atkT = 14; damageObjective(gate, K.ramHit(G.contract.tier || 1)); G.shake = 10; SFX.play('bash'); pop(gate.x, gate.y - 60, 'RAM!', '#ff9a6a'); }
          return true;
        }
      }
      return f.apply(this, arguments);
    };
  }
  // Heavy Cover: a shot at a wall archer stops in the palisade on 1-3
  { const f = shotHitsObjective;
    shotHitsObjective = function(s){
      if (gate30()) for (const a of G.def30.archers) if (a.state === 'up' && Math.hypot(a.x - s.x, a.y - 6 - s.y) < 12 && d6() <= K.cover){ pop(a.x, a.y - 26, 'COVER', '#c9c0a8'); return true; }
      return f.apply(this, arguments);
    };
  }
  if (window.TERRAIN && TERRAIN.highs) TERRAIN.highs.push(u => !!(u && u.wall30 && G && G.def30));

  /* ------------------------------------------------------------- each frame --- */
  function archerShot(a){
    const S = G.def30; let best = null, bs = 1e9;
    for (const e of G.enemies){ if (e.dead || e.dormant) continue; const d = dist(e, a); if (d > K.range) continue;
      const B = BESTIARY[e.k], score = d - (B.ram ? 400 : 0) - (e.climb > 0 || inside(e) ? 250 : 0);
      if (score < bs){ bs = score; best = e; } }
    if (!best) return 15;
    const ang = Math.atan2(best.y - (a.y - 16), best.x - a.x), dmg = (G.ranged && G.ranged.dmg) || 2;
    G.shots.push({by:a, x:a.x, y:a.y - 16, vx:Math.cos(ang) * 9, vy:Math.sin(ang) * 9, life:60, kind:'arrow', target:best,
                  skill:a.stones ? (a.s.ranged || 0) : a.s.ranged + 1, dmg:a.stones ? Math.max(1, dmg - 1) : dmg, flat:0});
    a.atkT = 12; a.left = best.x < a.x;
    return Math.round((a.stones ? K.stoneRate : K.rate) * rnd(0.85, 1.15));
  }
  function frame30(){
    const S = G.def30, gate = G.gates[0], f60 = G.frame % 60 === 0;
    for (const a of S.archers){
      if (a.flash > 0) a.flash--; if (a.atkT > 0) a.atkT--;
      a.x = a.hx; a.y = a.hy;
      if (a.state === 'ko'){ S.ko.add(a); continue; }
      if (G.prepT <= 0 && --a.timer <= 0) a.timer = archerShot(a);
    }
    // ladders: climbers at the foot of the wall come over after a while
    for (const e of G.enemies){ if (e.dead || !e.ladder30) continue;
      const Lp = e.ladder30; if (Lp.by && (Lp.by.dead || Lp.by.ladder30 !== Lp || dist(Lp.by, Lp) >= 36)) Lp.by = null;
      if (dist(e, Lp) < 36 && (!Lp.by || Lp.by === e)){ Lp.by = e; if (++e.climb >= K.climb){ Lp.by = null; e.x = e.ladder30.x; e.y = (S.WY - .6) * CELL; e.ladder30 = null; e.climb = 0; pop(e.x, e.y - 30, 'OVER THE WALL', '#ff6a5a'); SFX.play('down'); } }
      else e.climb = 0;
      if (gate && gate.hp <= 0) e.ladder30 = null; }
    // the scripted breach (the campaign's third defence): at breachAt of the clock the gate gives way
    if (S.breachAt && gate && gate.hp > 0 && !S.breach && G.prepT <= 0 && G.raidT >= S.breachAt * G.contract.minutes * 3600){
      gate.hp = 0; S.scripted = true; G.shake = 12; SFX.play('down'); pop(gate.x, gate.y - 40, 'THE GATE GIVES WAY', '#ff6a5a');
      note('The gate gives way. Its timbers were cracked by every ram before this one.');
      if (typeof D.onScripted === 'function') try { D.onScripted(G.contract); } catch (er){ console.warn('DEF30 onScripted', er); }   // the campaign's own lines (F-34 b10)
    }
    // the breach
    if (gate && gate.hp <= 0 && !S.breach){
      S.breach = true;
      for (const [x, y] of MAP.def30.gateCells) MAP.g[y * MAP.w + x] = T.ROAD;
      G.flow = bfsFrom(G.leader.x, G.leader.y, G.flow);
      note('The raiders are through the gate. Fall back and save the buildings. If they stay inside long enough they will find the Vault.');
      if (MAP.sally) D.openSally();   // F17: the way out opens, with the exit kit all at once
      D.ev('breach');
    }
    // F17: the Leader at the sally gate takes the people out (the result b10's Withdraw gives); no roll, it is the planned way out
    if (S.sallyOpen && MAP.exit && !G.over && !G.leader.down && dist(G.leader, MAP.exit) < 75){ G.sallyExit = true; endDeployment('withdrawn'); return; }
    if (S.breach){
      const n = G.enemies.filter(e => !e.dead && inside(e)).length;
      if (n) S.inT++;
      if (n && S.inT >= K.lootAfter && f60){
        const cap = Math.round(S.t0 * K.lootCap), add = Math.min(cap - S.loot, Math.max(1, Math.round(S.t0 * K.lootPerSec)));
        if (add > 0 && S.t0 > 0){ S.loot += add; pop(G.house.x, G.house.y - 90, `VAULT -${add}gp`, '#ffd860'); if (!S.notes.vault){ S.notes.vault = true; note('They have found the Vault. Every second they stay inside costs the Treasury.'); } }
      }
    }
    // towers: fire arrows set them burning; the Leader standing by puts it out
    for (const t of G.towers){ if (t.hp === undefined || t.hp <= 0) continue;
      if (t.burn > 0){
        if (G.frame % 4 === 0) G.fx.push({x:t.x + rnd(-14, 14), y:t.y - 50 - rnd(0, 30), vx:rnd(-.3, .3), vy:-1.4, life:30, c:Math.random() < .5 ? '#ff8a2a' : '#ffd860', px:3});
        if (dist(G.leader, t) < 90){ if (++t.douse >= K.douse){ t.burn = 0; t.douse = 0; pop(t.x, t.y - 70, 'FIRE OUT', '#9fe0ff'); SFX.play('brace'); } } else t.douse = 0;
        if (f60){ t.hp -= K.burnHp; t.flash = 6;
          if (t.hp <= 0){ t.burn = 0; pop(t.x, t.y - 70, 'THE TOWER FALLS', '#ff6a5a'); note('A tower has burned down.'); SFX.play('down'); G.shake = 10; } }
      } else if (f60 && G.prepT <= 0){
        let n = 0; for (const e of G.enemies) if (!e.dead && !inside(e) && BESTIARY[e.k].arch === 'skirm' && dist(e, t) < 320) n++;
        if (n && Math.random() < Math.min(0.3, 0.04 * n)){ t.burn = 1; t.douse = 0;
          if (!S.notes.fire){ S.notes.fire = true; note('Fire arrows! A tower is burning. Stand by it to put it out.'); } else pop(t.x, t.y - 70, 'TOWER ON FIRE', '#ff8a2a'); }
      }
    }
    if (G.raidT >= G.contract.minutes * 3600 && S.breach && !S.notes.clear){ S.notes.clear = true; D.rout(); }
  }
  { const f = updateRaid;
    updateRaid = function(){
      if (!gate30()) return f.apply(this, arguments);
      const allies = G.allies, towers = G.towers; G.allies = []; G.towers = towers.filter(t => t.hp === undefined || t.hp > 0);
      try { f.apply(this, arguments); } finally { G.allies = allies; G.towers = towers; }
      D.tagTowerShots(towers);
      frame30();
    };
  }

  /* ------------------------------------------------------------ end and HUD --- */
  // Time is up after a breach: the raiders outside give up, and all but a hard core inside run for the gap.
  D.rout = function(){
    const S = G.def30, keep = K.clearCap(G.contract.tier || 1), H = G.house;
    const live = G.enemies.filter(e => !e.dead && !e.dormant);
    const ins = live.filter(e => e.y < S.WY * CELL).sort((a, b) => dist(a, H) - dist(b, H));
    const stay = new Set(ins.slice(0, keep)), gone = live.filter(e => !stay.has(e));
    G.enemies = G.enemies.filter(e => e.dead || e.dormant || stay.has(e));
    S.routed = gone.length;
    note(`Time. No more are coming. ${gone.length} raiders break and run; ${stay.size} inside the walls fight on. Clear them out of the camp.`);
    return {gone: gone.length, stay: stay.size};
  };
  /* K88 (UX f48, soft-lock): after the hold, a breach waits for the camp to be clear, but a broken foe runs from the Leader for
     ever (deployment.js) and three pikemen sat in the map corners, so CLEAR THE CAMP never ended. A broken foe is out of the
     fight: it is not counted, and once the time is up it leaves the field (counted with the routed). */
  /* F17: the sally gate. The direction is worked out once, at the breach, so it never flickers. */
  D.DIRS = ['NORTH', 'NORTH-EAST', 'EAST', 'SOUTH-EAST', 'SOUTH', 'SOUTH-WEST', 'WEST', 'NORTH-WEST'];
  D.compass = (dx, dy) => D.DIRS[(Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) + 8) % 8];
  D.openSally = function(){
    const sa = MAP.sally, S = G.def30; if (!sa || !S || S.sallyOpen) return false;
    S.sallyOpen = true; MAP.exit = {x:sa.x, y:sa.y}; G.exitOpen = true;
    S.sallyDir = D.compass(sa.x - G.house.x, sa.y - G.house.y);
    return true;
  };
  D.drawSally = function(sa, open){   // a plain timber double door in the back wall: shut and unmarked, then standing open
    const x = sa.x - sa.w / 2, w = sa.w, y = 6, h = 36, st = '#6b665c';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 5, y + h + 2, w + 10, 3);   // shadow line under the sill
    ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 5, y - 4, w + 10, h + 6);
    if (open){
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0b0907'); g.addColorStop(.6, '#15110d'); g.addColorStop(1, 'rgba(70,62,44,.55)');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(140,175,230,.10)'; ctx.fillRect(x + 8, y + 6, w - 16, h - 6);   // a faint cool spill
      ctx.fillStyle = '#3e2c1c'; ctx.fillRect(x, y, 6, h); ctx.fillRect(x + w - 6, y, 6, h);   // the leaves folded back against the jambs
      ctx.fillStyle = '#23201d'; ctx.fillRect(x, y + 7, 6, 3); ctx.fillRect(x, y + h - 10, 6, 3); ctx.fillRect(x + w - 6, y + 7, 6, 3); ctx.fillRect(x + w - 6, y + h - 10, 6, 3);
    } else {
      ctx.fillStyle = '#3e2c1c'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#2f2114'; for (let i = 1; i < 8; i++) ctx.fillRect(x + i * w / 8 - 1, y, 2, h);
      ctx.fillStyle = '#2a2724'; ctx.fillRect(x, y + 7, w, 3); ctx.fillRect(x, y + h - 10, w, 3); ctx.fillRect(x + w / 2 - 1, y, 2, h);   // iron straps
      ctx.fillStyle = '#8a8478'; for (let i = 0; i < 6; i++){ const sx = x + 4 + i * (w - 8) / 5; ctx.fillRect(sx, y + 8, 2, 1); ctx.fillRect(sx, y + h - 9, 2, 1); }   // studs
    }
    ctx.fillStyle = st; ctx.fillRect(x - 5, y - 4, w + 10, 5); ctx.fillRect(x - 5, y - 4, 5, h + 6); ctx.fillRect(x + w, y - 4, 5, h + 6);   // stone lintel and jambs
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x, y + 1, w, 2);
    ctx.restore();
  };
  D.alive = () => G.enemies.filter(e => !e.dead && !e.dormant && !e.broken).length;
  D.dropBroken = function(){
    const out = G.enemies.filter(e => !e.dead && !e.dormant && e.broken);
    if (out.length){ G.enemies = G.enemies.filter(e => !out.includes(e)); G.def30.routed = (G.def30.routed | 0) + out.length; }
    return out.length;
  };
  { const f = raidCheck;
    raidCheck = function(){
      if (!gate30() || G.house.hp <= 0 || G.raidT < G.contract.minutes * 3600) return f.apply(this, arguments);
      try { D.dropBroken(); } catch (e) { console.warn('DEF30 broken', e); }
      if (G.def30.breach && D.alive() > 0) return false;
      return f.apply(this, arguments);
    };
  }
  { const f = raidLine;
    raidLine = function(t){
      if (!gate30() || G.prepT > 0) return f.apply(this, arguments);
      const S = G.def30, g = G.gates[0], left = Math.max(0, G.contract.minutes * 60 - Math.floor(G.raidT / 60));
      const top = left > 0 ? `${String(left / 60 | 0).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` : `CLEAR THE CAMP  ${D.alive()}`;
      const wall = S.archers.filter(a => a.state === 'up').length;
      if (S.sallyOpen) return [top, ['LEAVE BY THE SALLY GATE · ' + S.sallyDir, `HOUSE ${Math.max(0, G.house.hp)} / ${G.house.maxHp}`, `${wall} ON THE WALL`].join('  ·  ')];
      return [top, [g.hp > 0 ? `GATE ${g.hp} / ${g.maxHp}` : 'THE GATE IS DOWN', `HOUSE ${Math.max(0, G.house.hp)} / ${G.house.maxHp}`, `${wall} ON THE WALL`,
                    S.loot ? `VAULT -${S.loot}gp` : '', `${G.trapStock} TRAPS [F]`].filter(Boolean).join('  ·  ')];
    };
  }
  { const f = raidDebrief;
    raidDebrief = function(c, result, lines){
      if (!(c && c.gate30 && G && G.def30)) return f.apply(this, arguments);
      const S = G.def30, t0 = META.treasury, n0 = lines.length;
      f.apply(this, arguments);
      META.treasury = t0;                                              // no flat 30%: only what they took from the Vault
      for (let i = lines.length - 1; i >= n0; i--) if (/carry off \d+gp from the Treasury/.test(lines[i])) lines.splice(i, 1);
      if (S.loot > 0){ META.treasury = Math.max(0, META.treasury - S.loot); lines.splice(n0, 0, `<p class="bad">The raiders got into the Vault and carried off ${S.loot}gp.</p>`); }
      else if (result !== 'victory') lines.splice(n0, 0, '<p class="bad">The raiders burned what they could, but never reached the Vault.</p>');
      else if (!S.breach) lines.splice(n0, 0, '<p class="good">The gate held. Not one of them got inside the walls.</p>');
      if (S.towerKills) lines.push(`<p>${fill30(TL30().towerKills || 'The towers took {n} of them off the road.', {n:S.towerKills})}</p>`);
      META.raid30Tier = c.tier;
      D.heldGate(c, result, S, lines);
      // one free repair for each surviving veteran or officer (knocked off the wall still counts: nobody dies up there)
      const vets = S.archers.filter(a => a.vet && a.kind !== 'militia');
      if (vets.length && META.damaged){
        const {bill} = raidRepairs(), ids = Object.keys(bill).sort((a, b) => bill[b] - bill[a]).slice(0, vets.length), done = [];
        for (const id of ids){ if (!META.damaged[id]) continue; META.damaged[id] -= bill[id]; if (META.damaged[id] <= 0) delete META.damaged[id]; done.push(facility(id).name); }
        if (done.length) lines.push(`<p class="good">${vets.slice(0, done.length).map(a => esc(a.p.name)).join(' and ')} mend${done.length > 1 ? '' : 's'} the ${done.join(' and the ')} for nothing.</p>`);
      }
      // knocked out on the wall: hurt, not dead; a mate or officer rests one deployment
      const hurt = [...S.ko].filter(a => a.kind === 'mate' || a.kind === 'officer');
      for (const a of hurt) a.p.resting = Math.max(a.p.resting || 0, 1);
      if (hurt.length) lines.push(`<p>${hurt.map(a => esc(a.p.name)).join(', ')} ${hurt.length > 1 ? 'were' : 'was'} hurt on the wall and rest${hurt.length > 1 ? '' : 's'} next time.</p>`);
    };
  }
  // Tutorial tips wait for another contract: at the gate the tip box covers the wall (Director, 2026-11-13). Not marked seen.
  { const f = tip; tip = function(){ if (gate30()) return; return f.apply(this, arguments); }; }
  { const f = makeRaidContract;
    makeRaidContract = function(R){
      const c = f.apply(this, arguments);
      try { if (D.applies() && c.brief) c.brief = c.brief.replace(/coming for the camp/, 'coming up the road to the camp').replace(/Hold the Chapter House for (\d+) minutes\./, 'Hold the gate for $1 minutes; if it falls, save the buildings and clear them out.').replace(/ ?Retired veterans and officers fight beside you\./, '') + ' Mates who stayed home, veterans and officers shoot from the wall.'; } catch (e) {}
      return c;
    };
  }
  { const f = raidPanelHTML;
    raidPanelHTML = function(){
      let h = f.apply(this, arguments);
      try { if (D.applies()) h = h.replace('four watchtowers', 'two gate towers').replace('Hold the Chapter House for', 'Hold the gate (or, if it falls, the Chapter House) for'); } catch (e) {}
      return h;
    };
  }

  /* ---------------------------------------------------------------- drawing --- */
  { const f = raidBodies;
    raidBodies = function(bodies, onScreen){
      if (!gate30()) return f.apply(this, arguments);
      const S = G.def30, allies = G.allies, towers = G.towers;
      G.allies = []; G.towers = towers.filter(t => t.hp === undefined || t.hp > 0);
      try { f.apply(this, arguments); } finally { G.allies = allies; G.towers = towers; }
      for (const t of towers) if (t.hp !== undefined && onScreen(t, 80)) bodies.push({y:t.y + 1, custom:() => {
        if (t.hp <= 0){ ctx.fillStyle = '#3a2a1a'; for (let i = 0; i < 5; i++) ctx.fillRect(t.x - 24 + i * 10, t.y - 8 + (i % 2) * 5, 8, 4); return; }
        const bw = 44, top = t.y - 128; ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(t.x - bw / 2 - 1, top, bw + 2, 6);
        ctx.fillStyle = t.burn ? '#ff8a2a' : '#d4af37'; ctx.fillRect(t.x - bw / 2, top + 1, bw * Math.max(0, t.hp / t.maxHp), 4);
        if (t.burn && t.douse > 0){ ctx.fillStyle = '#9fe0ff'; ctx.fillRect(t.x - bw / 2, top + 7, bw * t.douse / K.douse, 3); } }});
      for (const L of S.ladders) if (onScreen(L, 60) && G.enemies.some(e => !e.dead && e.ladder30 === L && e.climb > 0)) bodies.push({y:L.y - 2, custom:() => {
        ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(L.x - 8, L.y); ctx.lineTo(L.x - 6, L.y - 62); ctx.moveTo(L.x + 8, L.y); ctx.lineTo(L.x + 10, L.y - 62);
        for (let k = 8; k < 60; k += 10){ ctx.moveTo(L.x - 7, L.y - k); ctx.lineTo(L.x + 9, L.y - k); } ctx.stroke(); }});
      for (const a of S.archers) if (onScreen(a)) bodies.push({y:a.y, custom:() => {
        if (!a.spr) return;
        if (a.state === 'ko'){ drawDowned(a.spr, a.x, a.y, 2.2, 0.8); ctx.fillStyle = '#9fe0ff'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 10) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText('KNOCKED OUT ' + Math.ceil(a.koT / 60) + 's', a.x, a.y + 24); return; }
        drawSprite(a.spr, a.x, a.y, 2.2, a.atkT > 0 ? 3 : 0, a.left, a.flash > 0);
        for (let i = 0; i < a.maxHp; i++){ ctx.fillStyle = i < a.hp ? '#9fe0ff' : 'rgba(0,0,0,.45)'; ctx.fillRect(a.x - a.maxHp * 2 + i * 4, a.y + 20, 3, 3); }
        ctx.fillStyle = '#cfe8f4'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 9) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(a.p.name + (a.stones ? ' (stones)' : ''), a.x, a.y - 30); }});
      if (MAP.sally && onScreen(MAP.sally, 90)) bodies.push({y:MAP.sally.y - 4, custom:() => D.drawSally(MAP.sally, !!S.sallyOpen)});   // F17
    };
  }

  /* --------------------------------------------------------------- self-test --- */
  /* ---------------------------------- F-30.1: tower kill credit, Standing, mend --- */
  // Tower arrows carry their tower, so a tower's kill is the tower's (creditKill gave every unowned kill to the Leader).
  // +1 Standing for a held gate and the free Mend the palisade action follow Systems' spec (archive-notes/systems.md,
  // 'F-30.1 numbers'); both on since 2026-11-14 (Patrick).
  const TL30 = () => window.TOWN30_LINES || {};
  const fill30 = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);   // Narrative's {placeholders}
  D.towerBy = t => t.by30 || (t.by30 = {tower30:true, x:t.x, y:t.y});
  D.tagTowerShots = function(towers){
    for (const s of G.shots || []){ if (s.by || s.kind !== 'arrow' || s.life < 59) continue;
      const t = (towers || []).find(t => Math.abs(t.x - s.x) < 10 && Math.abs(t.y - 30 - s.y) < 10); if (t) s.by = D.towerBy(t); }
  };
  { const f = creditKill;
    creditKill = function(e){ const u = e && e.lastBy;
      if (u && u.tower30){ if (G && G.def30) G.def30.towerKills = (G.def30.towerKills || 0) + 1; return; }
      return f.apply(this, arguments); };
  }
  // the watching faction: the rival of the raider faction, else the patron of the contract that came before the raid
  { const f = rollRaid;
    rollRaid = function(c){ const had = META.raid, r = f.apply(this, arguments);
      if (!had && META.raid && META.raid.patron30 === undefined) META.raid.patron30 = (c && c.faction) || null; return r; };
  }
  { const f = makeRaidContract; makeRaidContract = function(R){ const c = f.apply(this, arguments); if (c && R) c.patron30 = R.patron30 || null; return c; }; }
  D.standingFaction = c => { const f = c && (c.raidFaction ? FACTION_RIVAL[c.raidFaction] : c.patron30); return f && FACTIONS[f] ? f : null; };
  D.heldGate = function(c, result, S, lines){
    if (result !== 'victory' || S.breach || S.standing30) return null;
    S.standing30 = true;
    const f = D.standingFaction(c); if (!f || standing(f) >= 2) return null;
    lines.push(`<p class="good">${fill30(TL30().heldGate || 'Word of the held gate gets about. {faction} take note.', {faction:cap(facName(f))})}</p>`);
    shiftStanding(f, 1, lines); return f;
  };
  // Mend the palisade: once a downtime, for nothing, the company clears the worst entry of the repair bill (up to the raid cap)
  D.mendTarget = () => { const d = META.damaged || {}; return Object.keys(d).filter(id => d[id] > 0).sort((a, b) => d[b] - d[a])[0] || null; };
  D.canMend = () => !!(META && META.leader && (META.facilities || {}).palisade && D.mendTarget() && META.mend30At !== META.deployments);
  D.mend = function(){
    if (!D.canMend()) return SFX.play('nope');
    const id = D.mendTarget(), most = RAID_REPAIR_CAP * (META.raid30Tier || 1);
    META.damaged[id] -= most; if (META.damaged[id] <= 0) delete META.damaged[id];
    META.mend30At = META.deployments;
    SFX.play('coin'); saveMeta(); refreshUI(); renderPanel(); return id;
  };
  { const f = renderPanel;
    renderPanel = function(){
      f.apply(this, arguments);
      try { const P = CAMP.panel; if (!P || P.kind !== 'building' || !isDamaged(P.id) || !D.canMend()) return;
        const el = $('camp-panel'), id = D.mendTarget(), d = META.damaged[id], most = RAID_REPAIR_CAP * (META.raid30Tier || 1);
        if (el) el.insertAdjacentHTML('beforeend', `<button class="btn" onclick="DEF30.mend()">${esc(TL30().mendBtn || 'MEND THE PALISADE')}<br><span class="small">${esc(fill30(TL30().mendSub || '{discount} on the {facility}, once a downtime', {discount:d > most ? most + 'gp off' : 'free', facility:facility(id).name}))}</span></button>`);
      } catch (e) {}
    };
  }

  D.ev = function(k){ if (typeof D.onEvent === 'function') try { D.onEvent(k, G.contract); } catch (er){ console.warn('DEF30 onEvent', er); } };
  D.selfTest = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const sv = {G, MAP}, fac = META && META.facilities ? Object.assign({}, META.facilities) : null, hold = META ? META.holding : undefined, dmg = META ? META.damaged : undefined;
    try {
      if (!META) return {ok:false, n:0, pass:0, fails:['no META'], out};
      META.damaged = null; META.facilities.palisade = 1; META.facilities.watchtower = 1; META.holding = 'fort';
      ok('applies at the fort with a palisade', D.applies());
      META.holding = Object.keys(HOLDINGS).find(k => k !== 'fort') || 'barge'; ok('another holding keeps the old raid', !D.applies()); META.holding = 'fort';
      const c = {obj:OBJ_DEFEND, tier:2, minutes:3, seed:11};
      const M = generateRaidMap(c), S = M.def30;
      ok('gate map built', c.gate30 && M.w === K.w && S, M.w + 'x' + M.h);
      const at = (x, y) => M.g[y * M.w + x];
      let wall = 0; for (let x = 1; x < M.w - 1; x++) if (at(x, S.WY) === T.PALISADE) wall++;
      ok('palisade across the map, one gate', wall === M.w - 4 && S.gateCells.every(([x, y]) => at(x, y) === T.GATE), wall + ' palisade cells');
      ok('the gate stops enemies, lets the squad through', !passable(T.GATE, false) && passable(T.GATE, true));
      ok('two towers flank the gate', M.towers.length === 2 && M.towers.every(t => Math.abs(t.x - S.cx * CELL) < 5 * CELL));
      ok('the squad starts outside the gate', M.start.y > S.WY);
      { // F17: the sally gate is b10's, shut until the breach, then open with the exit kit and a compass word worked out once
        const cb = {obj:OBJ_DEFEND, tier:3, minutes:4, seed:11, f34:'b10'}, Mb = generateRaidMap(cb), Sb = Mb.def30;
        ok('F17: b10 has a sally gate in the back wall, far from the north gate, shut with no exit', Mb.sally && Mb.sally.y < 2 * CELL && !Mb.exit && Math.hypot(Mb.sally.x - Sb.cx * CELL, Mb.sally.y - Sb.WY * CELL) > 15 * CELL && at(0, 0) === T.STONE);
        ok('F17: no other gate defence has one', !M.sally && !generateRaidMap({obj:OBJ_DEFEND, tier:2, minutes:3, seed:11, f34:'b8'}).sally);
        const g0 = G;
        G = {obj:OBJ_DEFEND, exitOpen:false, def30:{WY:Sb.WY, cx:Sb.cx, archers:[], notes:{}, ko:new Set()}, house:{x:Mb.house.x, y:Mb.house.y, hp:10, maxHp:10}, leader:{x:0, y:0}, enemies:[]};
        MAP = Mb;
        ok('F17: before the breach the exit is not open', !G.exitOpen && !MAP.exit && !G.def30.sallyOpen);
        ok('F17: the breach opens it once and names the way', D.openSally() === true && G.exitOpen && MAP.exit.x === Mb.sally.x && G.def30.sallyDir === 'NORTH-EAST' && D.openSally() === false);
        ok('F17: compass words', D.compass(0, -1) === 'NORTH' && D.compass(1, 0) === 'EAST' && D.compass(0, 1) === 'SOUTH' && D.compass(-1, -1) === 'NORTH-WEST' && D.compass(-1, 0) === 'WEST');
        G = g0; MAP = M;
      }
      G = {obj:OBJ_DEFEND, def30:{WY:S.WY, cx:S.cx, ladders:S.ladders, archers:[], notes:{}, ko:new Set()}, enemies:[], squad:[], contract:c, gates:[], facs:[], leader:{x:S.cx * CELL, y:(S.WY + 3) * CELL}, house:{x:M.house.x, y:M.house.y, hp:10, maxHp:10}};
      const pts = []; for (let i = 0; i < 20; i++) pts.push(raidEdgePoint());
      ok('raiders come from the south only', pts.every(p => p && p.y > (M.h - 4) * CELL), pts.length + ' points');
      ok('slots: 6 + 2 per tower, cap 12', D.slotCount(0) === 6 && D.slotCount(2) === 10 && D.slotCount(9) === 12);
      const ar = D.pickArchers(0);
      ok('at least 3 militia when nobody is home', ar.length === K.militia && ar.every(a => a.kind === 'militia'));
      ok('wall archers have higher ground (F-28)', !window.TERRAIN || TERRAIN.high({x:S.cx * CELL, y:(S.WY - .45) * CELL, wall30:true}));
      const gate = {x:S.cx * CELL, y:(S.WY + .5) * CELL, nx:0, ny:1, hp:50, maxHp:50, r:30, objHp:true, gate:true}; G.gates = [gate];
      const ram = {k:'ram', x:gate.x, y:(S.WY + 8) * CELL, seed:0}, foot = {k:pickOf(Object.keys(BESTIARY).filter(k => BESTIARY[k].arch === 'brute' && !BESTIARY[k].ram && !BESTIARY[k].boss)), x:gate.x + 200, y:(S.WY + 6) * CELL, seed:1};
      ok('the ram goes for the gate', D.target(ram) === gate);
      ok('foot raiders go for the gate', D.target(foot) === gate);
      foot.ladder30 = S.ladders[0]; ok('a ladder team goes for its ladder', D.target(foot) === S.ladders[0]); foot.ladder30 = null;
      gate.hp = 0; const wp = D.target(foot); ok('gate down: raiders head for the gap', wp && Math.abs(wp.x - gate.x) < 1 && wp.y > gate.y);
      G.facs = [{x:200, y:200, hp:5, maxHp:5}]; const inn = {k:foot.k, x:210, y:210, seed:2};
      ok('inside: raiders go for the buildings', D.target(inn) === G.facs[0]);
      G.def30.notes = {}; G.enemies = []; for (let i = 0; i < 40; i++) G.enemies.push({k:foot.k, x:300 + i, y:(i < 30 ? S.WY - 3 : S.WY + 5) * CELL});
      const nk = note; note = () => {}; let r; try { r = D.rout(); } finally { note = nk; }
      ok('time up after a breach: outside raiders go, a hard core stays inside', r.stay === K.clearCap(2) && G.enemies.length === K.clearCap(2) && G.enemies.every(e => e.y < S.WY * CELL), r.gone + ' gone, ' + r.stay + ' stay');
      { const n0 = G.enemies.length, rt = G.def30.routed | 0; G.enemies.slice(0, 2).forEach(e => { e.broken = true; });
        const a0 = D.alive(), dr = D.dropBroken();
        ok('K88: broken foes are not counted and leave once the time is up (no soft-lock in the corners)', a0 === n0 - 2 && dr === 2 && G.enemies.length === n0 - 2 && D.alive() === n0 - 2 && G.def30.routed === rt + 2, [a0, dr, G.enemies.length].join('/')); }
      { const st = settings().tips, seen = META.tipsSeen; settings().tips = true; META.tipsSeen = {}; G.tip = null; const sm = saveMeta; saveMeta = () => {};
        try { tip('wounds'); ok('no tutorial tip over the gate (it waits, unseen)', !G.tip && !META.tipsSeen.wounds); } finally { saveMeta = sm; settings().tips = st; META.tipsSeen = seen; } }
      { const t = {x:400, y:500}; G.shots = [{kind:'arrow', x:400, y:470, life:60}, {kind:'arrow', x:100, y:100, life:60}]; D.tagTowerShots([t]);
        const L = META.leader, k0 = L ? (L.kills || 0) : 0; G.def30.towerKills = 0; creditKill({lastBy:G.shots[0].by});
        ok("a tower arrow kill is the tower's, not the Leader's", G.shots[0].by && G.shots[0].by.tower30 && !G.shots[1].by && G.def30.towerKills === 1 && (!L || (L.kills || 0) === k0)); }
      ok("Standing goes to the raider's rival, else the last patron", D.standingFaction({raidFaction:'empire'}) === FACTION_RIVAL.empire && D.standingFaction({raidFaction:null, patron30:'dwarves'}) === 'dwarves' && D.standingFaction({}) === null);
      { const st = META.standing; META.standing = {}; const c2 = {raidFaction:'empire'}, fr = FACTION_RIVAL.empire, L2 = [];
        try {
          const S1 = {}; D.heldGate(c2, 'victory', S1, L2); D.heldGate(c2, 'victory', S1, L2); const once = standing(fr) === 1;
          D.heldGate(c2, 'victory', {breach:true}, L2); D.heldGate(c2, 'fled', {}, L2); const only = standing(fr) === 1;
          META.standing[fr] = 2; D.heldGate(c2, 'victory', {}, L2); const cap2 = standing(fr) === 2;
          ok('held gate: +1 once, only on a clean win, never past Allied', once && only && cap2 && L2.length >= 2, [once, only, cap2].join('/'));
        } finally { META.standing = st; } }
      { const sv2 = {d:META.damaged, t:META.raid30Tier, m:META.mend30At, dep:META.deployments, ldr:META.leader, f:META.facilities.palisade, s:saveMeta, r:refreshUI, p:renderPanel, sf:SFX.play};
        saveMeta = () => {}; refreshUI = () => {}; renderPanel = () => {}; SFX.play = () => {};
        try {
          META.damaged = {armoury:50, forge:300}; META.raid30Tier = 2; META.leader = META.leader || {name:'Test'};   // the row sets its own state: a save with no Leader made it red META.facilities.palisade = 1; META.deployments = 7; META.mend30At = 6;
          const id = D.mend(), again = !D.canMend();
          ok('Mend the palisade: the worst bill, up to 90 x tier, once a downtime', id === 'forge' && META.damaged.forge === Math.max(0, 300 - RAID_REPAIR_CAP * 2) && META.damaged.armoury === 50 && again);
          META.deployments = 8; D.mend(); META.deployments = 9; D.mend();
          ok('a bill under the cap is cleared in full', !META.damaged.forge && !META.damaged.armoury);
        } finally { META.damaged = sv2.d; META.raid30Tier = sv2.t; META.mend30At = sv2.m; META.deployments = sv2.dep; META.leader = sv2.ldr; META.facilities.palisade = sv2.f; saveMeta = sv2.s; refreshUI = sv2.r; renderPanel = sv2.p; SFX.play = sv2.sf; } }
      META.facilities.palisade = 0; const M0 = generateRaidMap({obj:OBJ_DEFEND, tier:1, minutes:2, seed:3}); ok('a fort with no palisade keeps the old ring map', M0.w === 48 && !M0.def30);
    } catch (e) { ok('no throw', false, String(e && e.stack || e).slice(0, 160)); }
    finally { G = sv.G; MAP = sv.MAP; if (META){ if (fac) META.facilities = fac; META.holding = hold; META.damaged = dmg; } }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
