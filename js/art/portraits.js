/* js/art/portraits.js (INT-1 step 2, 2026-11-16): INDEX 19 busts, 20 (portraits v3), 26 (painted portraits).
   Cut unchanged from the inline script in index.html (old lines 12135 to 13308). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 19 - BUSTS BACK ON THE CARDS (SQUARE FRAMES), AND THE MISSING
   SCENARIO PIECES: Ambush road-traps and captures, the Breach gate and petard,
   the Mana-Quarry basin, Plague cures, Frost-Vault Seal Defense and the
   Blood-Honour Trial.
============================================================================ */
(function(){
  const st = document.createElement('style');
  st.textContent = `.mcard .mc-por{width:88px !important;height:88px !important}`;
  document.head.appendChild(st);
})();

/* ---- small map helpers -------------------------------------------------- */
function finishMap(M, startPx){
  const {w, h, g} = M;
  for (let x = 0; x < w; x++){ g[x] = T.STONE; g[(h - 1) * w + x] = T.STONE; }
  for (let y = 0; y < h; y++){ g[y * w] = T.STONE; g[y * w + w - 1] = T.STONE; }
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
  MAP = M; M.reach = bfsFrom(startPx.x, startPx.y); return M;
}
function repaintCell(cx, cy){ const mg = MAP.mini.getContext('2d'); mg.fillStyle = MINI_COL[MAP.g[cy * MAP.w + cx]]; mg.fillRect(cx, cy, 1, 1); }
const newMap = (w, h, seed) => ({w, h, g:new Uint8Array(w * h), seed, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null, cages:[], nests:[], engines:[], beacons:[]});

/* ---- new contracts registered ------------------------------------------- */
Object.assign(OBJECTIVES, {
  seal: {name:'Frost-Vault Seal Defense', brief:'Keep two of the three braziers burning while the rune-seal is renewed.'},
  trial:{name:'Blood-Honour Trial',       brief:'Face their champion alone in the Circle of Iron, or fight the whole warband.'}
});
Object.assign(CONTRACTS, {
  seal: {name:'Frost-Vault Seal Defense', pay:330, desc:c => `The rune-seal under ${c.place} is cracking, and ${HOSTS[c.host].the} ${/^an? /.test(HOSTS[c.host].the) ? 'is' : 'are'} clawing up through the sinkholes. Keep at least two of the three braziers burning for two minutes while the seal is renewed. Something big comes up near the end.`},
  trial:{name:'Blood-Honour Trial',       pay:240, desc:c => `${cap(HOSTS[c.host].the)} meet you at a border stone on ${c.place} and demand the Circle of Iron. Step into the ring alone, with no magic, and beat their champion: the warband honours the result. Break the code, or fall, and the whole warband charges.`}
});
for (const k of ['seal', 'trial']) if (!CONTRACT_KEYS.includes(k)) CONTRACT_KEYS.push(k);
{ const f = makeContract; makeContract = function(obj, tier){
    const c = f(obj, tier);
    const pin = (rk, host) => { const R = REGIONS[rk], at = pickOf(R.coords);
      Object.assign(c, {host, region:rk, regionName:R.name, place:pickOf(R.places), town:pickOf(R.towns), mapAt:[at[0] + rnd(-2, 2), at[1] + rnd(-2, 2)]}); };
    if (obj === 'seal') pin('frost', 'deserters');
    if (obj === 'trial') pin('freelands', 'orcs');
    if (obj === 'seal' || obj === 'trial') c.brief = CONTRACTS[obj].desc(c);
    return c;
  }; }

/* ---- maps --------------------------------------------------------------- */
function generateSealMap(c){
  const w = 56, h = 46, M = newMap(w, h, c.seed || 41), g = M.g, r = rng(M.seed), n = valueNoise(w, h, 7, r);
  const cx = 28, cy = 23, set = (x, y, t) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y * w + x] = t; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const d = Math.hypot((x - cx) / 1.2, y - cy), v = n(x, y);
    g[y * w + x] = d > 22 ? T.STONE : (d > 9 && v > 0.66) ? T.STONE : (v < 0.2 ? T.RUBBLE : T.FLOOR);
  }
  M.sinks = [];
  for (const a of [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6]){
    const sx = Math.round(cx + Math.cos(a) * 19), sy = Math.round(cy + Math.sin(a) * 16);
    for (let t = 0; t <= 1; t += 0.02){ const x = Math.round(cx + (sx - cx) * t), y = Math.round(cy + (sy - cy) * t); for (let k = -1; k <= 1; k++){ set(x + k, y, T.FLOOR); set(x, y + k, T.FLOOR); } }
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) set(sx + x, sy + y, x * x + y * y <= 2 ? T.RUBBLE : T.FLOOR);
    M.sinks.push({x:(sx + .5) * CELL, y:(sy + .5) * CELL});
  }
  for (let y = -8; y <= 8; y++) for (let x = -9; x <= 9; x++) if ((x / 1.1) ** 2 + y * y <= 64) set(cx + x, cy + y, T.FLOOR);
  M.sealAt = {x:(cx + .5) * CELL, y:(cy + .5) * CELL};
  M.braziers = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6].map(a => ({x:(cx + .5 + Math.cos(a) * 6) * CELL, y:(cy + .5 + Math.sin(a) * 5.5) * CELL}));
  M.start = {x:cx, y:cy + 2};
  return finishMap(M, {x:(cx + .5) * CELL, y:(cy + 2.5) * CELL});
}
function generateTrialMap(c){
  const w = 56, h = 46, M = newMap(w, h, c.seed || 77), g = M.g, r = rng(M.seed), n = valueNoise(w, h, 9, r);
  const cx = 28, cy = 21;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const v = n(x, y), d = Math.hypot(x - cx, y - cy);
    g[y * w + x] = d < 9 ? T.GRASS : v > 0.78 ? T.STONE : v > 0.6 ? T.HILL : v < 0.12 ? T.RUBBLE : T.GRASS;
  }
  for (let y = cy; y < h - 2; y++) for (let k = -1; k <= 1; k++) g[y * w + cx + k] = T.ROAD;
  for (let y = 3; y < cy - 6; y++) for (let x = cx - 9; x <= cx + 9; x++) if (g[y * w + x] === T.STONE) g[y * w + x] = T.GRASS;
  M.ring = {x:(cx + .5) * CELL, y:(cy + .5) * CELL, r:5 * CELL};
  M.start = {x:cx, y:cy + 15};
  return finishMap(M, {x:(cx + .5) * CELL, y:(cy + 15.5) * CELL});
}
{ const f = generateMap; generateMap = function(c){
    if (c.obj === 'seal') return generateSealMap(c);
    if (c.obj === 'trial') return generateTrialMap(c);
    const M = f(c);
    // Mana-Quarry: a rocky basin of boulders and spoil heaps around each vein
    if (c.obj === 'quarry'){
      const r = rng((c.seed || 5) + 3);
      for (const v of M.vaults){ const vx = Math.floor(v.x / CELL), vy = Math.floor(v.y / CELL);
        for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++){ const d = Math.hypot(x, y), X = vx + x, Y = vy + y;
          if (X < 1 || Y < 1 || X >= M.w - 1 || Y >= M.h - 1) continue; const i = Y * M.w + X;
          if (d > 5 && d < 8 && (M.g[i] === T.GRASS || M.g[i] === T.FOREST)) M.g[i] = r() < 0.45 ? T.HILL : T.RUBBLE; } }
      M.trees = M.trees.filter(t => !M.vaults.some(v => dist(t, v) < 8 * CELL));
      const mg = M.mini.getContext('2d'); for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++){ mg.fillStyle = MINI_COL[M.g[y * M.w + x]]; mg.fillRect(x, y, 1, 1); }
    }
    // Breach & Seize: close the keep's gateways
    if (c.obj === 'breach' && M.siege){
      const sx = Math.floor(M.siege.x / CELL), sy = Math.floor(M.siege.y / CELL), R = 8, cells = [];
      for (let k = -R; k <= R; k++) for (const [x, y] of [[sx + k, sy - R], [sx + k, sy + R], [sx - R, sy + k], [sx + R, sy + k]]){
        const i = y * M.w + x; if (M.g[i] === T.ROAD){ M.g[i] = T.PALISADE; cells.push([x, y]); } }
      const groups = [];
      for (const cl of cells){ const gp = groups.find(gq => gq.some(([x, y]) => Math.abs(x - cl[0]) + Math.abs(y - cl[1]) <= 1)); if (gp) gp.push(cl); else groups.push([cl]); }
      M.gates = groups.map(gp => ({cells:gp, x:(gp.reduce((a, q) => a + q[0], 0) / gp.length + .5) * CELL, y:(gp.reduce((a, q) => a + q[1], 0) / gp.length + .5) * CELL, prog:0, open:false}));
      const mg = M.mini.getContext('2d'); for (const [x, y] of cells){ mg.fillStyle = MINI_COL[T.PALISADE]; mg.fillRect(x, y, 1, 1); }
    }
    return M;
  }; }

/* ---- setup -------------------------------------------------------------- */
const SEAL_POOL = {1:['skeleton', 'ghoul', 'shadowhunter', 'skeleton'], 2:['ghoul', 'shadowhunter', 'skeleton', 'phalanx'], 3:['ghoul', 'shadowhunter', 'phalanx', 'warden']};
{ const f = setupContract; setupContract = function(c){
    f(c);
    const tier = c.tier;
    if (c.obj === 'ambush'){ G.trapStock = 2; G.traps = G.traps || []; G.trapKind = 0;
      note('Before the convoy arrives: press [F] to lay road traps (2), [G] to change the kind. Kill the guards round a wagon and stand by it to capture it intact.'); }
    if (c.obj === 'breach'){ G.gates = MAP.gates || []; G.gateOpen = !G.gates.length;
      note('The keep gates are barred. Stand at a gate to plant the petard (4 seconds).'); }
    if (c.obj === 'quarry'){ G.slavesFreed = 0; }
    if (c.obj === 'plague' && G.villagers){
      const rotT = {1:60, 2:50, 3:45}[tier] * 60; for (const v of G.villagers) v.maxRot = rotT;
      while (G.villagers.length < 8 && MAP.town){ const race = rollRace(), sex = Math.random() < .5 ? 'f' : 'm', a = Math.random() * TAU, d = rnd(60, 260);
        const x = MAP.town.x + Math.cos(a) * d, y = MAP.town.y + Math.sin(a) * d; if (blockedXY(x, y)) continue;
        G.villagers.push({x, y, rot:0, maxRot:rotT, state:'sick', p:{race, spec:'PLAIN', name:randomName(race, sex), id:'v' + G.villagers.length, sex}}); }
      G.plagueDead = 0;
      note(`The townsfolk turn in ${rotT / 60} seconds.`); if (0) note('The townsfolk turn in 45 seconds. Smash obelisks to cleanse those near them, or stand by a villager to use a Poultice.');
    }
    if (c.obj === 'seal'){
      G.caches.length = 0; G.blips.length = 0;
      G.seal = {t:0, need:120 * 60, boss:false, dark:0, spawnT:200};
      G.braziers = MAP.braziers.map(p => ({x:p.x, y:p.y, hp:28 + 10 * tier, maxHp:28 + 10 * tier, r:16, ac:4, shift:0, objHp:true, lit:true, relight:0, flash:0}));
      G.fogT = 120 * 60 + 600;
      note('The braziers keep the dark back. Hold two of three burning for two minutes. Stand at a dead brazier to relight it.');
    }
    if (c.obj === 'trial'){
      G.caches.length = 0; G.blips.length = 0; G.enemies.length = 0;
      const H = HOSTS.orcs, R = MAP.ring;
      const ch = spawnEnemy({1:'hobgob', 2:'raider', 3:'warden'}[tier], R.x, R.y - 60, {group:GROUP++, dormant:true, noNem:true});
      ch.name = `${randomName('ORC', 'm')} the Champion`; ch.con = ch.maxCon = {1:16, 2:26, 3:34}[tier]; ch.parleyed = true; ch.champion = true; G.champion = ch;
      G.warGroup = GROUP++;
      const n = 6 + tier * 3;
      for (let i = 0; i < n; i++){ const a = Math.PI + (i + .5) / n * Math.PI, d = R.r + 90 + (i % 2) * 40;
        spawnEnemy(pickOf(H.pools[tier]), R.x + Math.cos(a) * d * 1.3, R.y + Math.sin(a) * d * 0.9, {dormant:true, group:G.warGroup, noNem:true}); }
      const b = spawnEnemy(pickOf(H.bosses[tier]), R.x, R.y - R.r - 210, {dormant:true, group:G.warGroup});
      G.duel = {state:'wait', endT:0};
      note('The warband waits at the Circle of Iron. Step inside alone. No magic, no help.');
    }
  }; }
{ const f = placeTraps; placeTraps = c => ['seal', 'trial'].includes(c.obj) ? (G.traps = []) : f(c); }
{ const f = spawn; spawn = () => (G && ['seal', 'trial'].includes(G.obj)) ? null : f(); }
{ const f = offerParlay; offerParlay = e => (G && G.obj === 'trial' && G.duel && G.duel.state !== 'war') ? null : f(e); }

/* ---- the duel: squad mates hold outside the ring and do not fight ------- */
const duelOn = () => !!(G && G.obj === 'trial' && G.duel && (G.duel.state === 'wait' || G.duel.state === 'duel'));
{ const f = slotTarget; slotTarget = function(i, n, sw){
    if (!duelOn()) return f(i, n, sw);
    const s = MAP.start; return {x:(s.x + .5) * CELL + (i - (n - 1) / 2) * 38, y:(s.y + .5) * CELL + 30};
  }; }
{ const f = unitAttack; unitAttack = function(u, isLeader, sw){ if (duelOn() && !isLeader) return; return f(u, isLeader, sw); }; }
{ const f = specPassive; specPassive = function(u, isLeader){ if (duelOn()) return; return f(u, isLeader); }; }
function breakCode(why){
  if (!G.duel || G.duel.state === 'war' || G.duel.state === 'won') return;
  G.duel.state = 'war'; G.trialHonour = false;
  for (const e of G.enemies) if (!e.dead && (e.group === G.warGroup || e.champion)){ e.dormant = false; e.seen = true; }
  SFX.play('horn'); G.shake = 16; G.alarm += 2;
  pop(G.leader.x, G.leader.y - 50, 'THE WARBAND CHARGES!', '#ff6a5a'); note(why + ' The horns sound and the whole warband charges.');
}
{ const f = useAbility; useAbility = function(s){ if (duelOn() && G.duel.state === 'duel'){ breakCode('Magic and tricks in the Circle of Iron!'); } return f(s); }; }

/* ---- objectives target the braziers / champion ------------------------- */
{ const f = objTarget; objTarget = function(e){
    if (G && G.obj === 'trial' && e.champion) return G.leader;
    if (G && G.obj === 'seal' && G.braziers && e.seed % 3 !== 0){
      let best = null, bd = 520; for (const b of G.braziers) if (b.lit){ const d = dist(e, b); if (d < bd){ bd = d; best = b; } }
      if (best) return best;
    }
    return f(e);
  }; }

/* ---- every frame -------------------------------------------------------- */
{ const f = updateContract; updateContract = function(){
    f();
    const L = G.leader, o = G.obj, tier = G.contract.tier;
    // Ambush: road traps stop wagons; capture a wagon by clearing its guards and standing by it
    if (o === 'ambush' && G.convoy){
      for (const w of G.convoy){
        if (w.dead || w.escaped) continue;
        for (const t of G.traps || []) if (t.armed && !t.enemy && dist(t, w) < 34){
          t.armed = false; w.stall = Math.max(w.stall || 0, 300); w.hp -= 8 + 4 * tier; w.flash = 10;
          pop(w.x, w.y - 50, 'WAGON CAUGHT IN THE TRAP!', '#ffd860'); SFX.play('bash'); G.shake = 8; }
        if (w.stall > 0) w.stall--;
        if (w.hp <= 0 && !w.dead){ w.dead = true; G.coin += 45 * tier; G.fx.push({blast:true, x:w.x, y:w.y, r:0, max:70, life:22, c:'#ff8a3a'}); pop(w.x, w.y - 44, 'PRIZE WAGON WRECKED', '#ffd700'); continue; }
        const free = !contested(w, 170), near = dist(L, w) < 64 && !L.down;
        w.cap = free && near ? (w.cap || 0) + 1 : Math.max(0, (w.cap || 0) - 2);
        if (w.cap >= 150){ w.dead = true; w.captured = true; G.coin += 60 * tier;
          pop(w.x, w.y - 50, `CAPTURED INTACT (+${60 * tier} COIN)`, '#8fd39a'); SFX.play('coin'); note('A prize wagon is taken intact, with everything on it.'); }
      }
    }
    // Breach: the petard
    if (o === 'breach' && G.gates && !G.gateOpen){
      for (const gt of G.gates){
        if (gt.open) continue;
        const near = dist(L, gt) < 58 && !L.down;
        gt.prog = near ? gt.prog + (contested(gt, 110) ? 0.5 : 1) : Math.max(0, gt.prog - 1);
        if (gt.prog >= 240){
          gt.open = true; G.gateOpen = true;
          for (const [x, y] of gt.cells){ MAP.g[y * MAP.w + x] = T.ROAD; repaintCell(x, y); }
          G.fx.push({blast:true, x:gt.x, y:gt.y, r:0, max:110, life:26, c:'#ff8a3a'}); G.shake = 22; SFX.play('blast');
          for (const e of G.enemies) if (!e.dead && dist(e, gt) < 110){ wake(e); hurtEnemy(e, 4); }
          pop(gt.x, gt.y - 40, 'THE GATE SPLINTERS!', '#ffd860'); note('The petard blows the gate in. Storm the courtyard!');
          G.flow = bfsFrom(L.x, L.y, G.flow);
        }
      }
    }
    // Quarry: each vein pays out, frees its slaves, and fires up the squad's casters
    if (o === 'quarry'){
      for (const v of G.vaults){ if (!v.done || v.paid) continue; v.paid = true;
        G.coin += 15; pop(v.x, v.y - 50, 'RAW MANA CORE (+15)', '#9fe0ff');
        if ((G.manaBonus || 0) < 2){ G.manaBonus = (G.manaBonus || 0) + 1; for (const u of squadUnits()) if (u.spec && SPECS[u.spec].caster && u.s){ u.s.magic = (u.s.magic || 0) + 1; pop(u.x, u.y - 30, '+1 MAGIC', '#9fe0ff'); } }
        G.slavesFreed++; applyLoot('captive', {x:v.x, y:v.y + 30});
        note('The vein is cracked. The quarry slaves chained to it are free, and your casters drink in the raw mana (+1 Magic for this contract).'); }
    }
    // Plague: poultices, and smashed obelisks cleanse their neighbourhood
    if (o === 'plague' && G.villagers){
      for (const n of G.nests) if (n.dead && !n.cleansed){ n.cleansed = true;
        for (const v of G.villagers) if (v.state === 'sick' && dist(v, n) < 300) v.cured = true; }
      for (const v of G.villagers){
        if (v.state !== 'sick' || v.cured) continue;
        if (G.carry && G.carry.poultice > 0 && dist(v, L) < 48 && !L.down){ v.treat = (v.treat || 0) + 1;
          if (v.treat >= 60){ G.carry.poultice--; v.cured = true; pop(v.x, v.y - 30, 'POULTICE', '#8fd39a'); } }
        else v.treat = 0;
      }
    }
    // Seal: braziers, the channel, the spawner and the boss
    if (o === 'seal' && G.seal){
      const S = G.seal;
      for (const b of G.braziers){
        if (b.flash > 0) b.flash--;
        if (b.lit && b.hp <= 0){ b.lit = false; b.hp = 0; pop(b.x, b.y - 50, 'BRAZIER OUT!', '#ff8a7a'); SFX.play('nope'); note('A brazier has gone out. Stand at it to relight it.'); }
        if (!b.lit){ const near = dist(L, b) < 56 && !L.down && !contested(b, 80);
          b.relight = near ? b.relight + 1 : Math.max(0, b.relight - 1);
          if (b.relight >= 120){ b.lit = true; b.hp = b.maxHp; b.relight = 0; pop(b.x, b.y - 50, 'RELIT', '#ffd860'); SFX.play('blast'); } }
      }
      const lit = G.braziers.filter(b => b.lit).length;
      if (lit >= 2) S.t++;
      S.dark = lit === 0 ? S.dark + 1 : 0;
      if (--S.spawnT <= 0){
        S.spawnT = Math.max(110, 300 - tier * 40 - (S.t / 60 | 0));
        const sk = pickOf(MAP.sinks), n = (G.enemies.filter(e => !e.dead).length > 16 + tier * 6) ? 0 : 1 + tier + (S.t > 60 * 60 ? 1 : 0);
        for (let i = 0; i < n; i++){ const e = spawnEnemy(pickOf(SEAL_POOL[tier]), sk.x + rnd(-30, 30), sk.y + rnd(-30, 30), {noNem:true}); if (e) e.seen = true; }
      }
      if (!S.boss && S.t >= 90 * 60){ S.boss = true;
        const sk = MAP.sinks[0], e = spawnEnemy(pickOf(HOSTS.deserters.bosses[tier]), sk.x, sk.y);
        if (e){ e.seen = true; SFX.play('boss'); G.shake = 18; note(`${ename(e)} climbs out of the great fissure!`); } }
    }
    // Trial: the duel
    if (o === 'trial' && G.duel){
      const D = G.duel, R = MAP.ring, ch = G.champion;
      if (D.state === 'wait' && dist(L, R) < R.r - 10 && !L.down){ D.state = 'duel'; ch.dormant = false; ch.seen = true; SFX.play('horn'); pop(R.x, R.y - R.r - 20, 'THE CIRCLE OF IRON', '#ffd860'); note(`${ename(ch)} steps in to meet you.`); }
      if (D.state === 'duel'){
        if (ch.dead){ D.state = 'won'; D.endT = 180; G.trialHonour = true; G.coin += 80 * tier;
          for (const e of G.enemies) if (e.group === G.warGroup) e.dormant = true;
          SFX.play('win'); pop(R.x, R.y - 40, `HONOUR SATISFIED (+${80 * tier} TRIBUTE)`, '#ffd860'); note('The warband beats its shields. The trial is won, and they pay tribute.'); }
        else if (L.down) breakCode('Your Leader falls in the ring.');
        else if (dist(L, R) > R.r + 30) breakCode('You fled the ring.');
        else if (G.squad.some(m => m.state === 'up' && dist(m, R) < R.r)) breakCode('Your squad stepped into the ring.');
      }
      if (D.state === 'won' && D.endT > 0) D.endT--;
    }
  }; }

/* ---- objectives, HUD, markers, drawing, report ------------------------- */
{ const f = contractCheck; contractCheck = function(){
    const o = G.obj;
    if (o === 'seal'){
      if (G.seal.t >= G.seal.need){ note('The rune-seal flares white and holds. The sinkholes fall silent.'); endDeployment('victory'); return true; }
      if (G.seal.dark >= 10 * 60) return contractFail('THE SEAL BREAKS', 'Every brazier has been dark too long. The seal breaks.');
      return false;
    }
    if (o === 'trial'){
      if (G.duel.state === 'won' && G.duel.endT <= 0){ endDeployment('victory'); return true; }
      if (G.duel.state === 'war' && !G.enemies.some(e => !e.dead && (e.group === G.warGroup || e.champion))){ note('The warband is broken.'); endDeployment('victory'); return true; }
      return false;
    }
    return f();
  }; }
{ const f = contractProgress; contractProgress = function(){
    if (G.obj === 'seal') return G.seal.t / G.seal.need;
    if (G.obj === 'trial'){ const all = G.enemies.filter(e => e.group === G.warGroup || e.champion); return G.duel.state === 'won' ? 1 : all.length ? all.filter(e => e.dead).length / all.length : 0; }
    return f();
  }; }
{ const f = contractLine; contractLine = function(t){
    const o = G.obj;
    if (o === 'seal'){ const lit = G.braziers.filter(b => b.lit).length;
      return [`SEAL ${Math.floor(100 * G.seal.t / G.seal.need)}%`, `BRAZIERS LIT ${lit} / 3${lit < 2 ? '  \u00b7  RELIGHT ONE!' : ''}  \u00b7  ${t}`]; }
    if (o === 'trial'){ const D = G.duel;
      if (D.state === 'wait') return ['THE CIRCLE OF IRON', `STEP INTO THE RING ALONE  \u00b7  ${t}`];
      if (D.state === 'duel') return ['DUEL', `${ename(G.champion).toUpperCase()}  \u00b7  NO MAGIC, NO HELP  \u00b7  ${t}`];
      if (D.state === 'won') return ['HONOUR SATISFIED', t];
      return ['ALL-OUT CLASH', `BREAK THE WARBAND  \u00b7  ${t}`]; }
    if (o === 'breach' && !G.gateOpen) return ['BREACH THE GATE', `STAND AT A GATE TO PLANT THE PETARD  \u00b7  ${t}`];
    if (o === 'ambush' && G.convoy && G.trapStock > 0 && G.sec < 40) return [`${G.convoy.filter(w => w.dead).length} / ${G.convoy.length} TAKEN`, `[F] LAY A ROAD TRAP (${G.trapStock})  \u00b7  [G] NEXT KIND  \u00b7  ${t}`];
    if (o === 'plague' && G.villagers){ const r = f(t); return [r[0], r[1] + `  \u00b7  POULTICES ${(G.carry && G.carry.poultice) || 0}`]; }
    return f(t);
  }; }
{ const f = contractMarkers; contractMarkers = function(out){
    const o = G.obj;
    if (o === 'seal'){ out.push({x:MAP.sealAt.x, y:MAP.sealAt.y, kind:'ally', sp:'beacon'}); for (const b of G.braziers) out.push({x:b.x, y:b.y, kind:b.lit ? 'lit' : 'beacon', sp:'beacon'}); return; }
    if (o === 'trial'){ if (G.champion && !G.champion.dead) out.push({x:G.champion.x, y:G.champion.y, kind:'boss', k:G.champion.k}); return; }
    f(out);
    if (o === 'breach' && G.gates) for (const gt of G.gates) if (!gt.open) out.push({x:gt.x, y:gt.y, kind:'vault', sp:'vault'});
  }; }
{ const f = contractBodies; contractBodies = function(bodies, onScreen){
    const o = G.obj;
    if (o === 'seal'){
      bodies.push({y:MAP.sealAt.y - 40, custom:() => { const s = MAP.sealAt, k = G.seal.t / G.seal.need;
        ctx.fillStyle = 'rgba(20,30,50,.55)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 70, 50, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(160,220,255,${0.35 + 0.4 * k + Math.sin(G.frame / 10) * 0.1})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 60, 42, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 60, 42, 0, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.strokeStyle = '#e8fcff'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = '#9fe0ff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.fillText('THE RUNE-SEAL', s.x, s.y + 4); }});
      for (const sk of MAP.sinks) if (onScreen(sk, 80)) bodies.push({y:sk.y - 30, custom:() => { ctx.fillStyle = '#0a0808'; ctx.beginPath(); ctx.ellipse(sk.x, sk.y, 46, 26, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3a3030'; ctx.lineWidth = 3; ctx.stroke(); }});
      for (const b of G.braziers) if (onScreen(b, 80)) bodies.push({y:b.y, custom:() => {
        const b3 = typeof w3dMapProp === 'function' && w3dMapProp(b.lit ? 'm_beacon_lit' : 'm_beacon', b.x, b.y + 6, {t:G.frame, scale:0.87, flash:b.flash > 0});   /* Index 76 */
        if (!b3) PROPS3D.box(b.x, b.y, 2.6, 18, 22, 9, 20, '#6a5a48');
        if (b.lit){ const gl = ctx.createRadialGradient(b.x, b.y - 40, 4, b.x, b.y - 40, 110); gl.addColorStop(0, 'rgba(255,170,60,.4)'); gl.addColorStop(1, 'rgba(255,170,60,0)');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y - 40, 110, 0, TAU); ctx.fill(); if (!b3) PROPS3D.box(b.x, b.y - 46, 3.2, 12, 12, 6, 9, '#f0a040', 0.85);
          const bw = 50; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(b.x - bw / 2, b.y + 14, bw, 5); ctx.fillStyle = '#ffb040'; ctx.fillRect(b.x - bw / 2, b.y + 14, bw * b.hp / b.maxHp, 5); }
        else if (b.relight > 0){ ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.x, b.y - 10, 40, -Math.PI / 2, -Math.PI / 2 + TAU * b.relight / 120); ctx.stroke(); } }});
      return;
    }
    if (o === 'trial'){
      const R = MAP.ring;
      bodies.push({y:R.y - R.r, custom:() => {
        ctx.fillStyle = 'rgba(120,90,50,.25)'; ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = G.duel.state === 'war' ? 'rgba(200,40,30,.8)' : 'rgba(240,210,120,.85)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 16; i++){ const a = i / 16 * TAU, sx = R.x + Math.cos(a) * R.r, sy = R.y + Math.sin(a) * R.r;   /* Index 76 */
          if (!(typeof w3dTrap === 'function' && w3dTrap('stakes', sx, sy, 0.7))) PROPS3D.box(sx, sy, 1.8, 16, 12, 8, 10, '#9aa0a8'); }
        ctx.fillStyle = '#ffe9b0'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.fillText('THE CIRCLE OF IRON', R.x, R.y + R.r + 22); }});
      return;
    }
    f(bodies, onScreen);
    if (o === 'quarry') for (const v of G.vaults) if (!v.done && onScreen(v)) bodies.push({y:v.y + 1, custom:() => {
      const glow = 0.25 + Math.sin(G.frame / 9 + v.x) * 0.15; ctx.fillStyle = `rgba(120,210,255,${glow})`; ctx.beginPath(); ctx.arc(v.x, v.y - 10, 34, 0, TAU); ctx.fill();
      if (!(typeof w3dMapProp === 'function' && w3dMapProp('m_crystal', v.x, v.y + 4))) PROPS3D.box(v.x, v.y, 3, 16, 20, 8, 18, '#9fc8f0'); }});   /* Index 76 */
    if (o === 'breach' && G.gates) for (const gt of G.gates) if (!gt.open && onScreen(gt, 80)) bodies.push({y:gt.y + 2, custom:() => {
      ctx.fillStyle = '#4a3020'; ctx.fillRect(gt.x - 30, gt.y - 34, 60, 46); ctx.fillStyle = '#6a4428'; for (let x = -28; x < 28; x += 9) ctx.fillRect(gt.x + x, gt.y - 34, 7, 46);
      ctx.fillStyle = C.steel; ctx.fillRect(gt.x - 30, gt.y - 26, 60, 4); ctx.fillRect(gt.x - 30, gt.y, 60, 4);
      if (gt.prog > 0){ ctx.strokeStyle = '#ff8a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gt.x, gt.y - 12, 44, -Math.PI / 2, -Math.PI / 2 + TAU * gt.prog / 240); ctx.stroke(); }
      ctx.fillStyle = '#ffe9b0'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('BARRED GATE', gt.x, gt.y - 40); }});
    if (o === 'plague' && G.villagers) for (const v of G.villagers) if (v.state === 'sick' && v.treat > 0 && onScreen(v)) bodies.push({y:v.y + 1, custom:() => {
      ctx.strokeStyle = '#8fd39a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(v.x, v.y - 8, 24, -Math.PI / 2, -Math.PI / 2 + TAU * v.treat / 60); ctx.stroke(); }});
  }; }
{ const f = contractHow; contractHow = function(c, result){
    const t = `${G.sec / 60 | 0}m ${G.sec % 60}s`;
    if (c.obj === 'seal') return `The rune-seal at ${c.place} was ${result === 'victory' ? 'renewed' : 'lost'} after ${t} (${Math.floor(100 * G.seal.t / G.seal.need)}% channelled).`;
    if (c.obj === 'trial') return G.trialHonour ? `${esc(ename(G.champion))} fell in the Circle of Iron after ${t}. The warband honoured the result.` : `The code was broken and the warband charged; ${result === 'victory' ? 'it was broken in turn' : 'the squad was driven off'} after ${t}.`;
    if (c.obj === 'ambush' && G.convoy){ const cap = G.convoy.filter(w => w.captured).length; return f(c, result) + (cap ? ` ${cap} taken intact.` : ''); }
    if (c.obj === 'quarry') return f(c, result) + (G.slavesFreed ? ` ${G.slavesFreed} gang${G.slavesFreed > 1 ? 's' : ''} of quarry slaves freed.` : '');
    return f(c, result);
  }; }
{ const f = contractDebrief; contractDebrief = function(c, result, lines){
    f(c, result, lines);
    if (c.obj === 'trial' && G.trialHonour) shiftStanding('orcs', 1, lines);
  }; }
{ const f = openManual; openManual = function(){ f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx19')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx19"><b>Supply Line Ambush.</b> Press F before the convoy arrives to lay up to two road traps (G changes the kind): a wagon that hits one stalls and is damaged. Kill the guards around a wagon and stand by it for a few seconds to capture it intact for extra coin.</p>
      <p><b>Breach &amp; Seize.</b> The keep's gates are barred. Stand at one for 4 seconds to plant the petard and blow it in, then kill the castellan and hold the courtyard.</p>
      <p><b>Mana-Quarry Heist.</b> Each cracked crystal vein pays 15 coin, frees the slaves chained to it, and gives your Mages and Witches +1 Magic for the rest of the contract.</p>
      <p><b>Plague-Gem Containment.</b> Townsfolk turn in 45 seconds. Smashing an obelisk cleanses everyone near it; a Cleric's prayer or a Poultice (stand by the villager) cures one at a time.</p>
      <p><b>Frost-Vault Seal Defense.</b> Keep at least two of three braziers burning for two minutes while the seal is renewed. The dead climb out of the sinkholes to douse them; stand at a dark brazier to relight it. A commander comes up at 90 seconds. If every brazier is dark for 10 seconds, the seal breaks.</p>
      <p><b>Blood-Honour Trial.</b> Step into the Circle of Iron alone and beat the champion without abilities: the warband honours the result (+1 Standing with the Steppe Orc Clans and tribute). If your squad steps in, you use an ability, flee the ring or fall, the whole warband charges.</p>`); }; }

{ const f = startDeployment; startDeployment = function(c, ids){ f(c, ids); if (G && c.obj === 'plague'){ G.carry = G.carry || {}; G.carry.poultice = (G.carry.poultice || 0) + 2; } }; }

/* ============================================================================
   INDEX 20 - PORTRAITS v3 (expressions, breathing, blinking, painted
   backdrops and frames), THE EDELOS TRADERS, AND SCENARIO POLISH
============================================================================ */
/* ---- 1. The bust, redrawn: shaded lids, a muted eye, neat mouths, an
   expression for every mood, tapered long hair, tusks from the jaw. ---- */
drawBust = function(g, o, seed){
  const P = painter(g), skin = o.skin, sk = v => shade(skin, v);
  const hair = o.hair || '#3a2a1a', fem = o.sex === 'f', acc = o.acc;
  const top = (o.robe ? (o.robeCol || o.top) : o.top) || '#8a6a4a';
  const wide = o.bulky ? 1 : 0, HW = {5:3, 6:5, 16:5, 17:5, 18:4, 19:4, 20:3, 21:2};
  const sv = (sh, k) => ((seed >>> sh) & 1023) % k;
  const shape = ((seed >>> 23) & 7) % 3;
  const hw = y => (HW[y] || 6) + (y >= 7 && y <= 19 ? wide : 0) - (fem && y >= 16 && y <= 19 ? 1 : 0) + (shape === 1 && y >= 15 && y <= 19 ? 1 : 0) - (shape === 2 && !wide && y >= 13 && y <= 19 ? 1 : 0);
  const head = ['helmet','hood','wizard','witch','cap','tricorn','bandana','circlet'].includes(o.head) ? o.head : null;
  const hs = o.hairStyle || 'short', hd = shade(hair, .72), hl = shade(hair, 1.25);
  const E = o.expr || (o.hurt ? 'pained' : o.elder ? 'stern' : ['neutral', 'neutral', 'stern', 'smirk', 'calm', 'neutral'][sv(4, 6)]);
  if (o.cape){ P(2, 23, 5, 9, o.cape); P(25, 23, 5, 9, shade(o.cape, .8)); P(2, 23, 5, 1, shade(o.cape, 1.2)); }
  const longH = (fem && hs !== 'bun') || hs === 'long' || hs === 'braids';
  if (longH && head !== 'helmet'){
    P(7, 8, 4, 13, hair); P(7, 21, 3, 4, hair); P(8, 25, 2, 3, hair);
    P(21, 8, 4, 13, hd); P(22, 21, 3, 4, hd); P(22, 25, 2, 3, hd);
    for (let y = 10; y < 26; y += 3){ P(8, y, 1, 2, hd); P(23, y, 1, 2, shade(hair, .58)); }
    P(9, 9, 1, 8, hl);
  }
  if (hs === 'ponytail' && head !== 'helmet'){ P(22, 6, 3, 10, hd); P(23, 16, 2, 4, hd); }
  // shoulders: sloped, lit from the left
  const tD = shade(top, .72), tL = shade(top, 1.2);
  P(11, 21, 10, 1, top); P(8, 22, 16, 1, top); P(6, 23, 20, 1, top); P(4, 24, 24, 1, top); P(3, 25, 26, 2, top); P(2, 27, 28, 5, top);
  P(4, 24, 4, 1, tL); P(3, 25, 3, 7, tL); P(2, 27, 1, 5, tL); P(24, 23, 2, 1, tD); P(26, 24, 3, 8, tD); P(29, 27, 1, 5, shade(top, .6));
  P(8, 22, 3, 1, tL); P(10, 28, 1, 4, tD); P(21, 28, 1, 4, tD);
  const ap = o.armour;
  if (ap === 'chain') for (let y = 24; y < 32; y++) for (let x = 4 + (y % 2); x < 28; x += 2) P(x, y, 1, 1, tD);
  if (ap === 'scale') for (let y = 24; y < 32; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 28; x += 3) P(x, y, 2, 1, tD);
  if (ap === 'quilt') for (let y = 26; y < 32; y += 3) for (let x = 4; x < 28; x += 4) P(x, y, 3, 1, shade(top, .85));
  if (ap === 'bands') for (let y = 25; y < 32; y += 2) P(4, y, 24, 1, tD);
  if (ap === 'studs') for (let y = 25; y < 32; y += 2) for (let x = 5; x < 28; x += 3) P(x, y, 1, 1, C.gold);
  if (ap === 'plate'){ P(2, 23, 9, 6, tL); P(21, 23, 9, 6, top); P(3, 23, 7, 1, '#ffffff'); P(2, 28, 9, 1, tD); P(21, 28, 9, 1, tD); P(4, 25, 2, 1, '#ffffff'); P(5, 26, 1, 1, C.gold); P(26, 26, 1, 1, C.gold); }
  if (ap === 'fur'){ P(5, 22, 22, 3, '#c8b090'); P(6, 22, 5, 1, '#e0d0b0'); for (let x = 6; x < 26; x += 3) P(x, 25, 1, 1, '#a89070'); }
  if (o.robe){ P(10, 22, 12, 2, acc || tD); if (acc){ P(15, 24, 2, 8, acc); P(15, 24, 1, 8, shade(acc, 1.25)); } }
  else { P(13, 22, 6, 1, sk(.8)); P(14, 23, 4, 1, sk(.78)); P(15, 24, 2, 1, sk(.7)); if (acc){ P(11, 25, 3, 7, acc); P(11, 25, 1, 7, shade(acc, 1.2)); } }
  if (o.cape){ P(9, 23, 2, 2, C.gold); P(21, 23, 2, 2, C.gold); P(9, 23, 1, 1, '#fff2a0'); if (o.capeTrim){ P(7, 24, 1, 8, o.capeTrim); P(24, 24, 1, 8, o.capeTrim); } }
  if (head === 'hood'){ const c = o.hood || '#4a3a2a'; P(7, 2, 18, 19, c); P(11, 0, 10, 2, c); P(5, 19, 22, 5, c); P(24, 3, 2, 19, shade(c, .7)); P(9, 4, 14, 17, shade(c, .5)); P(5, 19, 4, 5, shade(c, 1.2)); }
  // neck and face, lit from the left
  P(13, 19, 6, 4, sk(.76)); P(13, 21, 6, 1, sk(.62));
  for (let y = 5; y <= 21; y++){ const h = hw(y); P(16 - h, y, 2 * h, 1, skin); P(16 + h - 2, y, 2, 1, sk(.82)); P(16 + h - 1, y, 1, 1, sk(.74)); P(16 - h, y, 1, 1, sk(.92)); }
  P(11, 6, 3, 3, sk(1.1)); P(12, 13, 2, 2, sk(1.06)); P(16, 12, 1, 2, sk(1.08));
  P(13, 19, 6, 1, sk(.86)); P(14, 20, 4, 1, sk(.78)); P(19, 14, 2, 3, sk(.84)); P(11, 14, 1, 2, sk(.94));
  if (fem) P(10, 15, 1, 1, shade('#d08a7a', 1));
  if (o.ears === 'elf'){ P(8, 10, 2, 3, skin); P(6, 8, 2, 3, skin); P(5, 6, 1, 3, skin); P(22, 10, 2, 3, sk(.8)); P(24, 8, 2, 3, sk(.8)); P(26, 6, 1, 3, sk(.8)); }
  else if (o.ears === 'big'){ P(5, 9, 5, 5, skin); P(6, 10, 3, 3, sk(.72)); P(22, 9, 5, 5, sk(.85)); P(23, 10, 3, 3, sk(.68)); }
  else { P(9 - wide, 10, 1, 4, sk(.9)); P(22 + wide, 10, 1, 4, sk(.76)); P(9 - wide, 11, 1, 1, sk(.72)); }
  const eyeT = sv(2, 4), noseT = sv(5, 5), mouthT = sv(8, 3), browT = sv(11, 3);
  const frk = sv(14, 5) === 0, mole = sv(17, 6) === 0, stub = !fem && !o.beard && sv(20, 3) === 0;
  const iris = ['#3a2a1c', '#2e4a6a', '#3a5a2a', '#5a3a1a', '#4a4a5a', '#6a5a2a'][seed % 6], dk = o.eye || iris;
  // brows
  const brow = shade(hair, .58), shp = ['stern', 'angry', 'shout'].includes(E) ? 'down' : ['pained', 'sad'].includes(E) ? 'up' : E === 'grin' ? 'raised' : ['level', 'arched', 'level'][browT];
  const B = (pts) => { for (const [x, y] of pts) P(x, y, 1, 1, brow); };
  if (shp === 'level'){ B([[11, 9], [12, 9], [13, 9], [18, 9], [19, 9], [20, 9]]); if (!fem) B([[10, 9], [21, 9]]); }
  if (shp === 'arched'){ B([[11, 9], [12, 8], [13, 8], [18, 8], [19, 8], [20, 9]]); if (!fem) B([[10, 10], [21, 10]]); }
  if (shp === 'raised'){ B([[11, 8], [12, 8], [13, 8], [18, 8], [19, 8], [20, 8]]); }
  if (shp === 'down'){ B([[10, 8], [11, 8], [12, 9], [13, 9], [21, 8], [20, 8], [19, 9], [18, 9]]); if (!fem) B([[13, 10], [18, 10]]); }
  if (shp === 'up'){ B([[10, 9], [11, 9], [12, 8], [13, 8], [21, 9], [20, 9], [19, 8], [18, 8]]); }
  // eyes
  const lid = sk(.58), scl = '#d6cbb8', pup = '#140c08';
  const st = o.blink ? 'closed' : E === 'pained' ? 'squeeze' : E === 'grin' ? 'squint' : ['stern', 'angry', 'shout'].includes(E) || eyeT === 1 ? 'narrow' : 'open';
  if (st === 'open'){
    P(11, 10, 3, 1, lid); P(18, 10, 3, 1, lid); P(11, 11, 3, 1, scl); P(18, 11, 3, 1, scl);
    P(12, 11, 2, 1, dk); P(19, 11, 2, 1, dk); if (!o.eye){ P(12, 11, 1, 1, pup); P(19, 11, 1, 1, pup); }
    if (eyeT === 3){ P(11, 11, 1, 1, lid); P(18, 11, 1, 1, lid); }
    if (fem){ P(10, 10, 1, 1, '#2a1a10'); P(21, 10, 1, 1, '#2a1a10'); }
  } else if (st === 'narrow'){
    P(11, 10, 3, 1, lid); P(18, 10, 3, 1, lid); P(11, 11, 3, 1, sk(.7)); P(18, 11, 3, 1, sk(.7)); P(12, 11, 1, 1, o.eye || pup); P(19, 11, 1, 1, o.eye || pup);
  } else if (st === 'squint'){
    P(11, 11, 1, 1, lid); P(12, 10, 1, 1, lid); P(13, 11, 1, 1, lid); P(18, 11, 1, 1, lid); P(19, 10, 1, 1, lid); P(20, 11, 1, 1, lid);
  } else if (st === 'squeeze'){
    P(11, 11, 3, 1, lid); P(18, 11, 3, 1, lid); P(13, 10, 1, 1, lid); P(18, 10, 1, 1, lid); P(11, 12, 1, 1, lid); P(20, 12, 1, 1, lid);
  } else { P(11, 11, 3, 1, lid); P(18, 11, 3, 1, lid); if (fem){ P(10, 11, 1, 1, '#2a1a10'); P(21, 11, 1, 1, '#2a1a10'); } }
  P(11, 12, 3, 1, sk(.88)); P(18, 12, 3, 1, sk(.84));
  // noses
  if (o.nose){ P(15, 13, 3, 3, sk(1.05)); P(17, 14, 1, 2, sk(.72)); P(15, 15, 3, 1, sk(.72)); }
  else if (noseT === 0){ P(16, 12, 1, 3, sk(.84)); P(17, 14, 1, 1, sk(.68)); P(15, 15, 3, 1, sk(.74)); }
  else if (noseT === 1){ P(16, 11, 1, 4, sk(.84)); P(17, 14, 1, 1, sk(.66)); P(15, 15, 3, 1, sk(.72)); }
  else if (noseT === 2){ P(16, 12, 1, 2, sk(.86)); P(14, 15, 5, 1, sk(.7)); P(14, 14, 1, 1, sk(.8)); P(18, 14, 1, 1, sk(.74)); P(16, 14, 1, 1, sk(1.08)); }
  else if (noseT === 3){ P(16, 11, 1, 2, sk(.84)); P(17, 12, 1, 2, sk(.76)); P(17, 14, 1, 1, sk(.62)); P(15, 15, 3, 1, sk(.72)); P(16, 12, 1, 1, sk(1.1)); }
  else { P(16, 13, 1, 1, sk(.84)); P(15, 15, 2, 1, sk(.76)); P(15, 14, 1, 1, sk(1.08)); }
  if (frk) for (const [x, y] of [[11, 13], [13, 14], [12, 15], [19, 13], [20, 14], [18, 15]]) P(x, y, 1, 1, shade(skin, .8));
  if (mole) P(sv(29, 2) ? 19 : 12, 16, 1, 1, '#4a2a1a');
  if (stub) for (let y = 16; y <= 20; y++){ const h = hw(y); for (let x = 16 - h + 1; x < 16 + h - 1; x++) if ((x + y) % 2 === 0 && !(y >= 16 && y <= 18 && x >= 13 && x <= 18)) P(x, y, 1, 1, shade(skin, .7)); }
  // mouths
  const lipD = fem ? '#8a3a3c' : sk(.55), lipL = fem ? '#b86a68' : sk(.92), teeth = '#ece4d4';
  const mouth = () => {
    const mw = mouthT === 2 ? 3 : 4;
    if (E === 'grin'){ P(13, 16, 1, 1, lipD); P(18, 16, 1, 1, lipD); P(14, 17, 4, 1, teeth); P(14, 18, 4, 1, lipD); }
    else if (E === 'shout'){ P(14, 16, 4, 1, lipD); P(13, 17, 6, 2, '#2a0a08'); P(14, 17, 4, 1, teeth); P(15, 18, 2, 1, '#8a2a2a'); P(14, 19, 4, 1, lipD); }
    else if (E === 'pained'){ P(13, 17, 6, 1, lipD); P(14, 17, 4, 1, teeth); P(14, 18, 4, 1, lipD); }
    else if (E === 'angry' || E === 'sad'){ P(14, 17, 4, 1, lipD); P(13, 18, 1, 1, lipD); P(18, 18, 1, 1, lipD); }
    else if (E === 'smirk'){ P(14, 17, 3, 1, lipD); P(17, 16, 1, 1, lipD); P(15, 18, 2, 1, lipL); }
    else if (E === 'calm'){ P(14, 17, mw, 1, lipD); P(13, 16, 1, 1, sk(.7)); P(14 + mw, 16, 1, 1, sk(.7)); P(15, 18, 2, 1, lipL); }
    else { P(14, 17, mw, 1, lipD); P(15, 18, 2, 1, lipL); }
  };
  mouth();
  if (o.marks){ P(11, 14, 1, 1, '#bff6ff'); P(20, 14, 1, 1, '#bff6ff'); P(10, 16, 1, 1, '#bff6ff'); }
  if (o.elder){ P(12, 7, 8, 1, sk(.86)); P(10, 12, 1, 1, sk(.72)); P(21, 12, 1, 1, sk(.72)); P(13, 16, 1, 2, sk(.8)); P(18, 16, 1, 2, sk(.8)); }
  if (o.beard && !fem){
    const bd = shade(hair, .78);
    P(13, 16, 6, 1, hair); P(12, 17, 2, 1, hair); P(18, 17, 2, 1, hair);
    for (let y = 17; y <= 23; y++){ const h = Math.max(2, hw(Math.min(y, 21)) - (y > 21 ? y - 21 : 0)); P(16 - h, y, 2 * h, 1, hair); }
    P(14, 17, 4, 1, '#2a1a10'); P(18, 18, 3, 6, bd);
    for (let y = 18; y < 24; y += 2) P(13 + (y % 4), y, 1, 2, bd);
    P(11, 18, 2, 2, hl); P(12, 20, 1, 2, hl);
    if (['grin', 'shout', 'pained', 'angry'].includes(E)) mouth();
  }
  if (o.tusks){ P(13, 16, 1, 3, C.bone); P(18, 16, 1, 3, shade(C.bone, .85)); P(13, 16, 1, 1, '#ffffff'); }
  // hair in front
  if (!head || head === 'circlet'){
    if (hs === 'bald'){ P(12, 5, 3, 2, sk(1.2)); P(9, 8, 2, 4, hair); P(21, 8, 2, 4, hd); }
    else {
      P(12, 1, 8, 1, hair); P(10, 2, 12, 1, hair); P(9, 3, 14, 2, hair); P(8, 5, 16, 3, hair); P(7, 7, 2, 4, hair); P(23, 7, 2, 4, hd); P(8, 8, 3, 5, hair); P(21, 8, 3, 5, hd); P(11, 8, 2, 1, hair); P(19, 8, 3, 1, hd);
      for (let x = 10; x < 23; x += 3) P(x, 4, 1, 4, hd);
      P(12, 2, 4, 1, hl); P(10, 3, 2, 2, hl); P(9, 5, 1, 2, hl); P(14, 3, 1, 3, hl);
      if (hs === 'messy'){ P(10, 1, 1, 1, hair); P(14, 0, 2, 2, hair); P(19, 1, 1, 1, hair); P(13, 8, 1, 2, hair); }
      if (longH && hs !== 'braids'){ P(8, 12, 3, 10, hair); P(9, 22, 2, 4, hair); P(21, 12, 3, 10, hd); P(21, 22, 2, 4, hd); P(9, 13, 1, 6, hl); }
      if (hs === 'bun'){ P(13, 0, 6, 4, hair); P(14, 0, 2, 1, hl); }
      if (hs === 'topknot'){ P(15, 0, 3, 3, hair); P(15, 0, 1, 1, hl); }
      if (hs === 'braids'){ P(8, 13, 2, 12, hair); P(22, 13, 2, 12, hd); for (let y = 14; y < 25; y += 2){ P(8, y, 2, 1, hd); P(22, y, 2, 1, shade(hair, .55)); } P(8, 25, 2, 1, acc || '#7a3e26'); P(22, 25, 2, 1, acc || '#7a3e26'); }
    }
  } else if (head !== 'helmet' && head !== 'hood' && hs !== 'bald'){ P(8, 8, 3, 6, hair); P(21, 8, 3, 6, hd); }
  if (o.horns){ P(9, 2, 2, 4, C.bone); P(8, 0, 2, 3, C.bone); P(21, 2, 2, 4, shade(C.bone, .8)); P(22, 0, 2, 3, shade(C.bone, .8)); }
  if (o.halo){ P(10, 0, 12, 1, '#ffe680'); P(9, 1, 1, 1, '#ffe680'); P(22, 1, 1, 1, '#ffe680'); }
  const helm = o.helm || C.steel;
  if (head === 'helmet'){
    P(12, 1, 8, 1, helm); P(10, 2, 12, 1, helm); P(9, 3, 14, 6, helm); P(15, 9, 2, 6, shade(helm, .85));
    P(8, 10, 3, 8, helm); P(21, 10, 3, 8, shade(helm, .75)); P(11, 2, 2, 5, shade(helm, 1.35)); P(20, 3, 2, 6, shade(helm, .75));
    P(8, 9, 16, 1, shade(helm, .6)); for (let x = 10; x < 23; x += 4) P(x, 9, 1, 1, shade(helm, 1.4));
    if (acc) P(15, 0, 2, 3, acc);
  }
  if (head === 'hood'){ const c = o.hood || '#4a3a2a'; P(9, 3, 14, 3, c); P(8, 6, 2, 13, c); P(22, 6, 2, 13, shade(c, .75)); P(11, 3, 4, 1, shade(c, 1.25)); P(10, 6, 12, 1, shade(c, .6)); }
  if (o.mask){ P(11, 14, 10, 6, '#24242c'); P(11, 14, 10, 1, '#3a3a46'); P(12, 16, 8, 1, '#1a1a20'); }
  if (head === 'wizard'){ const h = o.hat || '#333', d = shade(h, .7);
    P(3, 7, 26, 2, d); P(3, 7, 26, 1, shade(h, .85)); P(9, 6, 14, 1, h); P(10, 5, 12, 1, C.gold); P(11, 4, 11, 1, h); P(12, 3, 9, 1, h); P(13, 2, 8, 1, h);
    P(15, 1, 6, 1, h); P(17, 0, 4, 1, h); P(12, 3, 2, 2, shade(h, 1.25)); P(19, 2, 2, 4, d); P(14, 4, 1, 1, '#ffe680'); }
  if (head === 'witch'){ const h = o.hat || '#222', d = shade(h, .7);
    P(2, 7, 28, 2, d); P(9, 6, 14, 1, h); P(10, 5, 12, 1, acc || '#7ac05a'); P(11, 4, 9, 1, h); P(10, 3, 8, 1, h); P(9, 2, 6, 1, h); P(7, 1, 5, 1, h); P(5, 0, 4, 1, d); P(15, 3, 3, 3, d); }
  if (head === 'circlet'){ P(9, 7, 14, 1, C.gold); P(15, 6, 2, 2, '#87ceeb'); P(15, 6, 1, 1, '#ffffff'); }
  if (head === 'bandana'){ const a = acc || '#9b2d24'; P(9, 4, 14, 4, a); P(9, 4, 14, 1, shade(a, 1.25)); P(9, 7, 14, 1, shade(a, .7)); P(23, 6, 3, 2, a); P(24, 8, 2, 3, shade(a, .8)); for (let x = 11; x < 22; x += 3) P(x, 5, 1, 1, '#f0e6d2'); }
  if (head === 'cap'){ P(10, 2, 12, 1, '#2a2a30'); P(9, 3, 14, 4, '#2a2a30'); P(8, 7, 16, 2, '#1a1a20'); P(11, 3, 3, 2, '#44444e'); }
  if (head === 'tricorn'){ P(4, 5, 24, 3, '#1a1414'); P(9, 2, 14, 3, '#1a1414'); P(3, 3, 3, 3, '#1a1414'); P(26, 3, 3, 3, '#1a1414'); P(4, 7, 24, 1, C.gold); P(22, 0, 2, 5, '#f0f0f0'); }
  drawWounds(P, o, sk, head, seed);
};
// Scars, injuries and the wounded: a dressing at the brow, blood from the temple, a bruise, a split lip.
drawWounds = function(P, o, sk, head, seed){
  const inj = o.inj || [], scars = Math.min(4, (o.scars || 0) + inj.filter(i => i !== 'eye').length), lt = '#e8b0a4', dk = '#7a3a34';
  const SCARS = [[[21, 12], [20, 13], [20, 14], [19, 15]], [[14, 5], [15, 6], [16, 7], [17, 8]], [[12, 18], [13, 19], [14, 20]], [[10, 13], [11, 14], [11, 15]]];
  for (let i = 0; i < scars; i++){ const S = SCARS[(i + (seed % 4)) % 4];
    if (S === SCARS[1] && head) continue;
    for (const [x, y] of S){ P(x, y, 1, 1, lt); P(x + 1, y, 1, 1, dk); } }
  if (inj.includes('mana')){ P(10, 14, 2, 2, '#5a2a2a'); P(11, 15, 1, 1, '#8a4a3a'); P(20, 16, 2, 1, '#5a2a2a'); P(19, 7, 2, 1, '#7a3a2a'); }
  if (inj.includes('lung') || inj.includes('shell')){ P(11, 12, 3, 1, sk(.66)); P(18, 12, 3, 1, sk(.66)); }
  if (inj.includes('arm')){ for (let i = 0; i < 16; i++) P(7 + i, 23 + (i >> 1), 2, 1, i % 3 ? '#e8e0d0' : '#c8c0b0'); }
  if (inj.includes('eye')){
    for (let x = 7; x <= 17; x++) P(x, 8 + ((x - 7) / 5 | 0), 1, 1, '#1a1410');
    P(21, 10, 3, 1, '#1a1410'); P(24, 9, 1, 1, '#1a1410');
    P(17, 10, 5, 3, '#1a1410'); P(18, 10, 3, 1, '#3a3030'); P(17, 12, 1, 1, '#2a2020');
    P(20, 13, 1, 1, lt); P(21, 9, 1, 1, lt);
  }
  if (o.hurt){
    const B = '#8a1414', B2 = '#b02020';
    if (!head || head === 'circlet'){ P(9, 5, 14, 2, '#e6dccb'); P(9, 6, 14, 1, '#c4b8a4'); P(18, 5, 3, 2, B2); P(19, 5, 1, 1, '#d84040'); }
    else { P(20, 9, 2, 1, B2); }
    P(21, 7, 1, 2, B); P(21, 9, 1, 3, B); P(20, 12, 1, 3, B); P(20, 15, 1, 1, '#6a1010');
    P(18, 12, 3, 1, shade(skin_or(o), .6)); P(19, 13, 2, 1, '#7a4a5a');
    P(17, 18, 1, 1, B2);
    P(5, 26, 2, 1, B); P(6, 27, 1, 2, B); P(22, 28, 2, 2, '#6a1010'); P(25, 26, 1, 1, B);
  }
};
const skin_or = o => o.skin || '#e8b48a';
const vkey = v => v ? (v.b ? 'b' : '') + (v.blink ? 'k' : '') + (v.expr || '') : '';
bustOf = function(look, seed, v = {}){ return faceStandIn(34, 34, v); };   // S6-C note 10: the pixel bust is gone; a painted face is drawn in front of this wherever one exists
personBust = function(p, isLeader, v){
  const k = personKey(p, isLeader) + '|' + vkey(v);
  return BUSTS[k] || (BUSTS[k] = bustOf(Object.assign({}, personLook(p, isLeader), {inj:p.injuries || [], scars:p.scars || 0, hurt:p.resting > 0 && !p.trainingAt}), hash(p.name + ':' + (p.id || 'L')), v || {}));
};
{ const f = enemyLook; enemyLook = k => Object.assign(f(k), {expr:['stern', 'angry'][hash(k) % 2]}); }
/* ---- 2. Painted backdrops and frames ------------------------------------ */
const FRAMES = {
  plain:  {name:'Plain',             cost:0,  o:'#2a1a10', i:null},
  gilt:   {name:'Gilt',              cost:60, o:C.goldD,   i:C.gold, stud:'#fff2a0'},
  silver: {name:'Silver Filigree',   cost:50, o:'#5f6870', i:'#d3d9de', stud:'#ffffff'},
  ebony:  {name:'Ebony and Brass',   cost:40, o:'#0e0a08', i:'#3a2a20', stud:C.gold},
  royal:  {name:'Imperial Purple',   cost:90, o:'#2a0e3a', i:'#8a5ac8', stud:C.gold},
  verdant:{name:'Verdant Leaf',      cost:45, o:'#1a3012', i:'#6a9a3a', stud:'#c8e890'}
};
const cosm = () => { if (!META) return {frames:['plain'], frame:'plain', dyes:[], charges:[], trim:false, trimOn:false};
  return META.cosm = Object.assign({frames:['plain'], frame:'plain', dyes:[], charges:[], trim:false, trimOn:false}, META.cosm || {}); };
function framedCanvas(bust, col, frameId){
  const c = newCanvas(36, 36), g = c.getContext('2d'), P = painter(g), base = shade(col || '#4a3a2a', .34), F = FRAMES[frameId] || FRAMES.plain;
  P(0, 0, 36, 36, base);
  for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++){ const d = Math.hypot(x - 17, y - 13);
    if (d < 9) P(x, y, 1, 1, shade(col || '#4a3a2a', .52)); else if (d < 14 && (x + y) % 2 === 0) P(x, y, 1, 1, shade(col || '#4a3a2a', .44));
    else if (d > 20 && (x + y) % 2 === 0) P(x, y, 1, 1, shade(base, .7)); }
  g.drawImage(bust, 1, 2);
  P(0, 0, 36, 1, F.o); P(0, 35, 36, 1, F.o); P(0, 0, 1, 36, F.o); P(35, 0, 1, 36, F.o);
  if (F.i){ P(1, 1, 34, 1, F.i); P(1, 34, 34, 1, shade(F.i, .75)); P(1, 1, 1, 34, F.i); P(34, 1, 1, 34, shade(F.i, .75));
    for (const [x, y] of [[1, 1], [33, 1], [1, 33], [33, 33]]){ P(x, y, 2, 2, F.o); P(x, y, 1, 1, F.stud); } }
  return c;
}
const PANIM = new Map();
function regAnim(url, mk){ if (url && !PANIM.has(url)) PANIM.set(url, {mk, f:[url], off:hash(url.slice(-60)) % 997}); return url; }
function framedURL(p, isLeader, v){   // a painted portrait first (section 7), else the pixel bust
  const fr = cosm().frame, col = SPECS[p.spec] ? SPECS[p.spec].color : '#6a5a44';
  if (portHas(p)){ const b = v && v.b ? 1 : 0, u = portURL('pp1:' + personKey(p, isLeader) + '|' + fr + '|' + b, () => portFramed(p, isLeader, fr, col, b)); if (u) return u; }
  return toURL('pf3:' + personKey(p, isLeader) + '|' + fr + '|' + vkey(v), () => framedCanvas(personBust(p, isLeader, v), col, fr), 4);
}
portraitURL = (p, isLeader) => regAnim(framedURL(p, isLeader, null), v => framedURL(p, isLeader, v));
let BVAR = null;
bustCanvas = function(spr, bg, look){
  const c = newCanvas(38, 38), g = c.getContext('2d'), P = painter(g);
  P(0, 0, 38, 38, C.goldD); P(1, 1, 36, 36, C.gold); P(2, 2, 34, 34, bg || '#2e3a44');
  for (let y = 4; y < 36; y += 3) P(2, y, 34, 1, shade(bg || '#2e3a44', .9));
  g.drawImage(bustOf(look, hash(look.skin + look.hair + (look.head || '')), BVAR || {}), 2, 3, 34, 34);
  P(1, 36, 36, 1, C.goldD);
  return c;
};
/* ---- 3. Breathing and blinking: every portrait on screen lives ---------- */
let PTICK = 0;
setInterval(() => {
  PTICK++;
  for (const img of document.images){
    if (!img.isConnected || img.offsetParent === null) continue;
    let base = img.dataset.pb;
    if (!base){ if (!PANIM.has(img.src)) continue; base = img.src; img.dataset.pb = base; }
    const A = PANIM.get(base); if (!A) continue;
    if (img.style.filter && img.style.filter.includes('grayscale')) continue;     // the dead do not breathe
    const t = PTICK + A.off, b = (t % 20) >= 10 ? 1 : 0, k = (t % 29) === 0 ? 1 : 0, i = b * 2 + k;
    if (!A.f[i]) A.f[i] = A.mk({b, blink:!!k});
    if (img.src !== A.f[i]) img.src = A.f[i];
  }
}, 150);
/* ---- 4. The Leader's face on the HUD reacts to the fight ---------------- */
function hudBustPixel(){   // the pixel bust: hudBust (part 5 below) uses it when the Leader has no painted face
  const L = G.leader, P = META.leader;
  let e = null;
  if (L.down || L.con <= Math.max(1, Math.floor(L.maxCon / 3)) || G.flash > 8) e = 'pained';
  else if (G.shoutT > 0) e = 'shout';
  else if (G.grinT > 0) e = 'grin';
  else if (G.frame - (G.lastContact || -999) < 90) e = 'angry';
  else if (G.shaken) e = 'sad';
  const b = ((G.frame / 50) | 0) % 2, blink = L.down || (G.frame % 270) < 7;
  return personBust(P, true, {b, blink, expr:e});
}
{ const f = useAbility; useAbility = function(s){ const a = G && G.abil && G.abil[s], before = a ? a.cd : 0; f(s); if (a && a.cd > before) G.shoutT = 45; }; }
{ const f = killEnemy; killEnemy = function(e){ const was = e.dead; f(e); if (G && !was && e.dead && (BESTIARY[e.k].boss || (G.streak && G.streak % 25 === 0))) G.grinT = 150; }; }
{ const f = update; update = function(){ f(); if (!G) return; if (G.shoutT > 0) G.shoutT--; if (G.grinT > 0) G.grinT--; }; }

/* ---- 5. THE EDELOS TRADERS: wagons in the forest, a stall elsewhere, and a
   factor who sells cosmetics: portrait frames, banner dyes and charges, and
   gold-thread cloak trim for the whole Chapter. ---------------------------- */
FACILITIES.push({id:'edelos', cat:'Command', name:'Edelōs Trade Wagons', cost:160, x:66, req:'merchant',
  desc:'Invite a caravan of Edel\u014ds traders to camp beside the Merchant Stalls. Their factor sells cosmetics: portrait frames, rare banner dyes and charges, and gold-thread trim for every cloak in the Chapter.'});
FACILITIES[FACILITIES.length - 1].baseName = 'Edelōs Trade Wagons';
FAC_SKIN_NAMES.barge.edelos = 'Edelōs Trade Stall'; FAC_SKIN_NAMES.warehouse.edelos = 'Edelōs Silk Stall';
PLOTS.edelos = [620, 650]; BASE_PLOTS.edelos = [620, 650];
FAC_LOOK.edelos = {type:'caravan'}; BARGE_LOOK.edelos = {t:'exstall'}; WARE_LOOK.edelos = {t:'exstall'};
{ const f = facCost; facCost = function(fc){ let c = f(fc); if (fc.id === 'edelos' && cmIs('EDELOS')) c = Math.max(0, c - 40); return c; }; }
{ const f = drawBuilding; drawBuilding = function(P, look){
    if (look.type === 'caravan'){
      const purple = '#6a2a8a', gold = '#d4af37', pd = '#4a1a62';
      // bunting
      for (let x = 0; x < 32; x++) P(x, 3 + Math.round(Math.sin(x / 5) * 1), 1, 1, '#5a3a1a');
      for (let i = 0; i < 6; i++){ const x = 2 + i * 5, y = 4 + Math.round(Math.sin(x / 5)); P(x, y, 3, 1, [gold, purple, '#b02040'][i % 3]); P(x + 1, y + 1, 1, 1, [gold, purple, '#b02040'][i % 3]); }
      // the back wagon
      P(3, 9, 12, 1, purple); P(2, 10, 14, 7, purple); for (let x = 3; x < 16; x += 3) P(x, 10, 1, 7, gold); P(2, 10, 14, 1, shade(purple, 1.3));
      P(1, 17, 16, 3, C.wood); P(1, 17, 16, 1, '#b08a5a'); for (const wx of [3, 11]){ P(wx, 19, 4, 4, '#3a2a1c'); P(wx + 1, 20, 2, 2, C.wood); }
      // the front wagon, gold canopy with purple stripes
      P(15, 12, 14, 1, gold); P(14, 13, 16, 8, gold); for (let x = 15; x < 30; x += 3) P(x, 13, 1, 8, pd); P(14, 13, 16, 1, '#fff2a0');
      P(13, 21, 18, 3, C.woodD); P(13, 21, 18, 1, C.wood); for (const wx of [15, 25]){ P(wx, 23, 5, 5, '#2a1a10'); P(wx + 1, 24, 3, 3, C.wood); P(wx + 2, 25, 1, 1, gold); }
      // silks and wares
      P(2, 25, 5, 4, '#b02040'); P(2, 25, 5, 1, '#e05070'); P(7, 26, 4, 3, '#2e6a8a'); P(7, 26, 4, 1, '#5aa0c0'); P(11, 27, 3, 2, gold);
      return;
    }
    if (look.type === 'exstall'){
      const purple = '#6a2a8a', gold = '#d4af37';
      for (let x = 2; x < 30; x += 4){ P(x, 6, 2, 7, purple); P(x + 2, 6, 2, 7, gold); } P(2, 6, 28, 1, '#fff2a0'); for (let x = 2; x < 30; x += 2) P(x, 13, 1, 1, purple);
      P(4, 13, 1, 17, C.woodD); P(27, 13, 1, 17, C.woodD);
      P(3, 22, 26, 3, '#5a3a1a'); P(3, 22, 26, 1, '#8a6a3a'); P(3, 25, 26, 5, '#3a2410');
      P(6, 18, 4, 4, '#b02040'); P(11, 19, 3, 3, '#2e6a8a'); P(16, 18, 2, 4, gold); P(19, 19, 4, 3, '#3a8a5a'); P(24, 18, 2, 4, '#e8e0d0');
      P(8, 14, 2, 3, '#ffb030'); P(22, 14, 2, 3, '#ffb030');
      return;
    }
    return f(P, look);
  }; }
{ const f = drawSkinBuilding; drawSkinBuilding = function(P, L){ if (L && L.t === 'exstall') return drawBuilding(P, {type:'exstall'}); return f(P, L); }; }
// cosmetics on sale
const EDELOS_DYES = [['#6a2a8a', 'Edel\u014ds Violet'], ['#e0a020', 'Saffron'], ['#b01830', 'Crimson Lake'], ['#3a8a7a', 'Verdigris'], ['#1a2a4a', 'Midnight'], ['#c86a7a', 'Rose Madder']];
const EDELOS_CHARGES = ['dagger', 'potion', 'mug', 'drop', 'gear', 'arrows', 'bars', 'boot', 'coin', 'stake'];
const BASE_BC = BANNER_COLOURS.length, BASE_BG = BANNER_GLYPHS.length;
function applyCosmetics(){
  const C2 = cosm();
  BANNER_COLOURS.length = BASE_BC; for (const d of C2.dyes) if (!BANNER_COLOURS.includes(d)) BANNER_COLOURS.push(d);
  BANNER_GLYPHS.length = BASE_BG; for (const g of C2.charges) if (!BANNER_GLYPHS.includes(g)) BANNER_GLYPHS.push(g);
}
{ const f = bannerEditorHTML; bannerEditorHTML = function(){ applyCosmetics(); return f(); }; }
{ const f = personLook; personLook = function(p, isLeader){
    if (p && p.spec === 'TRADER'){ const look = f(Object.assign({}, p, {spec:'PLAIN'}), false);
      return Object.assign(look, {top:'#6a2a8a', acc:'#d4af37', robe:true, robeCol:'#6a2a8a', head:'bandana', cape:'#c8a040', capeTrim:'#6a2a8a', legs:'#3a1a4a', weapon:null, armour:null, expr:'smirk', beard:sexOf(p) === 'm'}); }
    const look = f(p, isLeader);
    if (look.cape && !look.capeTrim && cosm().trim && cosm().trimOn) look.capeTrim = banner().c2;
    return look;
  }; }
SPECS.TRADER = {name:'Edel\u014ds Trader', role:'Merchant', color:'#8a3a9a', con:3, mg:0, luck:2, per:2, caster:false, attack:''};
function ensureTrader(){
  if (META.trader) return META.trader;
  const sex = Math.random() < .5 ? 'f' : 'm', race = pickOf(['HUMAN', 'HUMAN', 'HALF_ELF', 'SUN_ELF']);
  const first = sex === 'f' ? pickOf(['Ysolde', 'Odile', 'Severine', 'Camille', 'Liane']) : pickOf(['Casimir', 'Aurelien', 'Thibault', 'Lucan', 'Severin']);
  META.trader = {id:'TR', name:first + ' ' + pickOf(['Varre', 'Edelmont', 'Daunt', 'Marchant', 'Saint-Ivo']), race, cls:'EDELOS', spec:'TRADER', sex, facility:'edelos', trader:true, injuries:[]};
  saveMeta(); return META.trader;
}
{ const f = personRole; personRole = q => q.kind === 'trader' ? 'vet' : f(q); }
{ const f = campSync; campSync = function(){
    f();
    if ((typeof inStory === 'function' && inStory()) || !has('edelos') || !PLOTS.edelos) return;
    if (!CAMP.traderQ){ const T = ensureTrader(), pl = PLOTS.edelos; CAMP.traderQ = {id:'trader', kind:'trader', p:T, x:pl[0] + 34, y:pl[1] + 20, tx:pl[0] + 34, ty:pl[1] + 20, wait:0, left:true, moving:false, seed:3}; }
    CAMP.traderQ.p = ensureTrader();
    if (!CAMP.people.includes(CAMP.traderQ)) CAMP.people.push(CAMP.traderQ);
  }; }
const TRADER_LINES = ['Silks from Zenbos! Dyes no Imperial has seen!', 'A frame of gilt makes any face noble.', 'Gold thread, for a Chapter that means business.', 'Everything is for sale. Except the wagons.', 'Rare charges for a rare banner!', 'Coin first, compliments after.'];
{ const f = drawCamp; drawCamp = function(){
    const T = CAMP.traderQ;
    if (T && !G && CAMP.people.includes(T) && !(T.barkLife > 0) && Math.random() < 1 / 900){ T.bark = pickOf(TRADER_LINES); T.barkLife = 240; }
    f();
  }; }
function frameSwatchURL(id){ return toURL('frsw:' + id, () => { const c = newCanvas(18, 18), P = painter(c.getContext('2d')), F = FRAMES[id];
  P(0, 0, 18, 18, F.o); if (F.i){ P(1, 1, 16, 16, F.i); } P(3, 3, 12, 12, '#3a3226'); P(6, 6, 6, 6, '#6a5a44'); if (F.stud){ P(1, 1, 1, 1, F.stud); P(16, 1, 1, 1, F.stud); } return c; }, 3); }
function edelosChargeURL(g){
  const k = 'glv:' + g;
  if (!URLS[k]){
    try {
      const col = (typeof GLYPH_COLOURS !== 'undefined' && GLYPH_COLOURS[g]) || '#d4af37';
      URLS[k] = typeof GLYPHVEC !== 'undefined' && GLYPHVEC.chargeBake
        ? (() => {   /* AD 23 Nov: the bare charge, no octagon plate, over a 2 px parchment outline (8 ways, about 1 px once shown at 20) so brown charges read on the brown .mini button (shop only) */
            const ch = GLYPHVEC.chargeBake(g, col, 40), t = newCanvas(40, 40), tg = t.getContext('2d'), c = newCanvas(44, 44), cg = c.getContext('2d');
            tg.drawImage(ch, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = 'rgba(245,234,210,.7)'; tg.fillRect(0, 0, 40, 40);
            for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, -2], [-2, 2], [2, 2]]) cg.drawImage(t, 2 + dx, 2 + dy);
            cg.drawImage(ch, 2, 2); return c.toDataURL(); })()
        : toURL('gl:' + g, () => { const c = newCanvas(9, 9); glyph(painter(c.getContext('2d')), g, 1, 1, '#2a2520'); return c; }, 3);
    } catch (e) { URLS[k] = ''; }
  }
  return URLS[k];
}
function traderShopHTML(){
  const C2 = cosm(), T = ensureTrader(), tr = META.treasury;
  const btn = (ok, label, act) => `<button ${ok ? '' : `disabled title="${/^Buy/.test(label) ? `Not enough gold: the Treasury holds ${tr}gp.` : 'Worn now.'}"`} onclick="${act}">${label}</button>`;   /* K46: a dead button says why */
  let h = `<div class="line"><img src="${portraitURL(T, false)}"><div class="grow"><b>${esc(T.name)}</b>, Edel\u014ds factor<br><span style="font-size:14px"><i>"${esc(pickOf(TRADER_LINES))}"</i></span></div></div>`;
  /* UX K96: each wares group is a closed section (sec96, campaign.js); the charge swatches get a title and a label */
  const S96 = (k, sum, body) => typeof sec96 === 'function' ? sec96('ware:' + k, sum, body) : body;
  let fr = `<div class="desc" style="text-align:left;margin-top:6px"><b>Portrait frames</b> (worn by every portrait in the Chapter):</div>`;
  for (const [id, F] of Object.entries(FRAMES)){ const own = C2.frames.includes(id), on = C2.frame === id;
    fr += `<div class="line"><img src="${frameSwatchURL(id)}"><div class="grow">${F.name}${on ? ' <b style="color:#226b2a">(in use)</b>' : ''}</div>${own ? btn(!on, on ? 'In use' : 'Use', `setFrame('${id}')`) : btn(tr >= F.cost, `Buy, ${F.cost}gp`, `buyCosm('frame','${id}',${F.cost})`)}</div>`; }
  h += S96('frames', `<b>Portrait frames</b> <span style="opacity:.8">\u00b7 ${C2.frames.length} owned; in use: ${esc((FRAMES[C2.frame] || {}).name || 'none')}</span>`, fr);
  h += S96('dyes', `<b>Rare banner dyes</b> <span style="opacity:.8">\u00b7 30gp each, ${EDELOS_DYES.filter(([c]) => C2.dyes.includes(c)).length} of ${EDELOS_DYES.length} owned</span>`, `<div class="desc" style="text-align:left;margin-top:6px"><b>Rare banner dyes</b> (30gp each, then free to use in the banner editor):</div><div class="mini" style="justify-content:flex-start">` +
    EDELOS_DYES.map(([c, n]) => C2.dyes.includes(c) ? `<button disabled style="background:${c};color:#fff">${n} \u2713</button>` : `<button ${tr >= 30 ? '' : 'disabled'} style="border-left:10px solid ${c}" onclick="buyCosm('dye','${c}',30)">${n}</button>`).join('') + '</div>');
  const gN = g => g.charAt(0).toUpperCase() + g.slice(1), gT = g => C2.charges.includes(g) ? gN(g) + ': owned' : gN(g) + ', 25gp' + (tr < 25 ? ' (not enough gold)' : '');
  h += S96('charges', `<b>Banner charges</b> <span style="opacity:.8">\u00b7 25gp each, ${EDELOS_CHARGES.filter(g => C2.charges.includes(g)).length} of ${EDELOS_CHARGES.length} owned</span>`, `<div class="desc" style="text-align:left;margin-top:6px"><b>Banner charges</b> (25gp each):</div><div class="mini" style="justify-content:flex-start">` +
    EDELOS_CHARGES.map(g => `<button title="${gT(g)}" aria-label="${gT(g)}" ${C2.charges.includes(g) || tr < 25 ? 'disabled' : ''} onclick="buyCosm('charge','${g}',25)" style="padding:2px 4px"><img src="${edelosChargeURL(g)}" style="height:20px;vertical-align:middle"> ${C2.charges.includes(g) ? '\u2713' : ''}</button>`).join('') + '</div>');
  h += `<div class="line"><div class="grow"><b>Gold-thread cloak trim</b><br><span style="font-size:14px">Every Squad Mate's cloak is trimmed in the banner's second colour, not just the Leader's.</span></div>${C2.trim ? btn(true, C2.trimOn ? 'Take it off' : 'Wear it', 'toggleTrim()') : btn(tr >= 80, 'Buy, 80gp', `buyCosm('trim','trim',80)`)}</div>`;
  h += `<div class="desc" style="font-size:14px;color:#6a5a44;margin-top:4px">Cosmetics change how the Chapter looks, nothing else.</div>`;
  if (has('edelos')) h += `<button class="btn small" onclick="BED=null;openPanel('banner','banner')">OPEN THE BANNER EDITOR</button>`;
  return h;
}
function buyCosm(kind, id, cost){
  const C2 = cosm(); if (META.treasury < cost) return SFX.play('nope');
  if (kind === 'frame'){ if (C2.frames.includes(id)) return; C2.frames.push(id); C2.frame = id; }
  if (kind === 'dye'){ if (C2.dyes.includes(id)) return; C2.dyes.push(id); }
  if (kind === 'charge'){ if (C2.charges.includes(id)) return; C2.charges.push(id); }
  if (kind === 'trim'){ C2.trim = true; C2.trimOn = true; }
  META.treasury -= cost; applyCosmetics(); SFX.play('coin'); saveMeta(); CAMP.dirty = true; refreshUI();
}
function setFrame(id){ cosm().frame = id; SFX.play('pick'); saveMeta(); refreshUI(); }
function toggleTrim(){ cosm().trimOn = !cosm().trimOn; SFX.play('pick'); saveMeta(); CAMP.dirty = true; refreshUI(); }
{ const f = trainingHTML; trainingHTML = function(fid){ const h = f(fid); return fid === 'edelos' && has('edelos') ? h + `<h3 style="margin:10px 0 2px">The Factor's Wares</h3>` + traderShopHTML() : h; }; }
{ const f = renderPanel; renderPanel = function(){
    const P = CAMP.panel;
    if (P && P.kind === 'person' && P.id === 'trader' && !(FD && FD.step === 'banner')){
      $('camp-panel').innerHTML = `<button class="x" onclick="closePanel()" title="Close">&#215;</button><h2>${esc(ensureTrader().name)}</h2><img class="pimg" src="${portraitURL(ensureTrader(), false)}"><div class="tag">Edel\u014ds Factor</div>` + traderShopHTML();
      return; }
    f();
  }; }
{ const f = loadMeta; loadMeta = function(){ f(); applyCosmetics(); if (typeof CAMP !== 'undefined') CAMP.traderQ = null; }; }
{ const f = switchSlot; switchSlot = function(k){ f(k); applyCosmetics(); CAMP.traderQ = null; }; }

/* ---- 6. Scenario polish -------------------------------------------------- */
// Ambush: a capture ring, a warning as a wagon nears the valley's end, and the far end of the road marked.
{ const f = contractBodies; contractBodies = function(bodies, onScreen){
    f(bodies, onScreen);
    if (!G) return;
    if (G.obj === 'ambush' && G.convoy){
      const end = MAP.route[MAP.route.length - 1];
      if (onScreen(end, 80)) bodies.push({y:end.y, custom:() => { if (!(typeof w3dBanner === 'function' && w3dBanner(end.x, end.y + 6, 'm_banner'))) PROPS3D.box(end.x, end.y, 3, 10, 24, 2, 22, '#8a1a1a');   /* Index 74 */
        ctx.fillStyle = '#ff8a7a'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText("THE VALLEY'S END", end.x, end.y + 18); }});
      for (const w of G.convoy) if (!w.dead && !w.escaped && w.cap > 0 && onScreen(w, 80)) bodies.push({y:w.y + 1, custom:() => {
        ctx.strokeStyle = '#8fd39a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(w.x, w.y - 10, 46, -Math.PI / 2, -Math.PI / 2 + TAU * w.cap / 150); ctx.stroke(); }});
    }
    if (G.obj === 'trial' && G.duel && G.duel.state !== 'war' && onScreen(MAP.ring, 300)) bodies.push({y:MAP.ring.y - MAP.ring.r - 1, custom:() => {
      if (G.duel.state === 'duel' && G.frame % 90 < 30){ ctx.globalAlpha = 1 - (G.frame % 90) / 30; ctx.fillStyle = '#ffd860'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('HROOM!', MAP.ring.x + Math.sin(G.frame) * 160, MAP.ring.y - MAP.ring.r - 50); ctx.globalAlpha = 1; } }});
  }; }
{ const f = updateContract; updateContract = function(){
    f(); if (!G || G.over) return;
    if (G.obj === 'ambush' && G.convoy){
      for (const w of G.convoy) if (!w.dead && !w.escaped && !w.warned && w.idx > MAP.route.length * 0.8){ w.warned = true; pop(w.x, w.y - 60, 'NEARLY AWAY!', '#ff8a7a'); note('A prize wagon is nearly out of the valley!'); SFX.play('horn'); }
    }
    if (G.obj === 'trial' && G.duel && G.duel.state === 'duel' && G.frame % 90 === 0){ G.shake = Math.max(G.shake, 3); SFX.play('bash'); }
    if (G.obj === 'breach' && G.gateOpen && !G.castellanWoken && G.castellan && !G.castellan.dead){ G.castellanWoken = true; wake(G.castellan); note(`${ename(G.castellan)} rallies the courtyard. Kill the castellan, then hold.`); }
  }; }
// Seal: braziers under attack point the way.
{ const f = damageObjective; damageObjective = (t, d) => { f(t, d); if (G && G.braziers && G.braziers.includes(t)){ t.attackedT = G.frame;
    if (!t.warnT || G.frame - t.warnT > 360){ t.warnT = G.frame; if (dist(t, G.leader) > 260){ pop(G.leader.x, G.leader.y - 60, 'A BRAZIER IS UNDER ATTACK', '#ff8a5a'); SFX.play('horn'); } } } }; }
{ const f = drawHUD; drawHUD = function(){ f(); if (!G || !G.braziers) return;
    for (const b of G.braziers) if (b.lit && b.attackedT && G.frame - b.attackedT < 240) edgePointer(b.x, b.y, '#ff5a3a', 'Brazier', true); }; }
// Plague: count the turned.
{ const f = contractLine; contractLine = function(t){ const r = f(t); if (G && G.obj === 'plague' && G.villagers && r){ const turned = G.villagers.filter(v => v.state === 'turned').length; if (turned) r[1] = r[1] + `  \u00b7  TURNED ${turned}`; } return r; }; }
// Manual
{ const f = openManual; openManual = function(){ f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx20')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx20"><b>Edel\u014ds Traders.</b> Once the Merchant Stalls stand, invite an Edel\u014ds caravan (wagons in the forest, a stall on the barge or in the warehouse). Their factor walks the camp and sells cosmetics: portrait frames, rare banner dyes and charges, and gold-thread cloak trim. They change how the Chapter looks, nothing else. An Edel\u014ds Chapter Master gets 40gp off the caravan.</p>
      <p><b>Portraits.</b> Every face is drawn once for each person and kept: face shape, eyes, brows, nose, mouth, freckles and scars are their own. Portraits breathe and blink. In the field the Leader's face shows the fight: grim in contact, shouting an ability, grinning at a commander's death, wincing when hurt. The wounded wear a dressing until they are back on their feet.</p>`); }; }


/* ============================================================================
   INDEX 26 - PAINTED PORTRAITS (Index 20 plus the generated portrait set).
   Every face in the game (rosters, hiring, leader and master cards, the HUD
   bust, retired veterans, graves, opponents) now comes from the painted
   portrait for that person's race, specialty and sex. The pixel-art faces
   stay in the file as the fallback for anyone without a portrait (traders,
   plain townsfolk) and if the embedded images ever fail to load.
     - 16 races x 6 specialties x 2 sexes = 192 portraits, embedded below as two
       atlases so the game still runs from a single file.
     - The scarf or sash (the green key in the paintings) takes the banner's
       first colour; the Leader, and everyone while gold-thread trim is on,
       gets a banner-second-colour edge.
     - Each person gets a small, repeatable variation: flipped or not, a slight
       hue shift, and slightly different saturation and lightness, so skin and
       hair tones are not identical between two people of the same race.
     - Scars, wounds, the eye patch, the dressing and the arm sling are drawn on
       top of the painting from per-portrait eye positions.
     - Frames from the Edelos traders, breathing and the HUD expressions still work.
   To roll back to pixel faces, delete everything from this comment down to
   END PAINTED PORTRAITS, plus the one <style> line it adds.
============================================================================ */
const PORT_RACES = ['HUMAN','SUN_ELF','GREY_ELF','DARK_ELF','ORC','GOBLIN','HOBGOBLIN','DWARF','GNOME','HALFLING','HALF_ELF','HALF_ORC','FIRBOLG','CAMBION','NEPHILIM','ZUHRI'];
const PORT_SPECS = ['SOLDIER','FOLK_HERO','MAGE','CLERIC','SCOUNDREL','WITCH'];
const PORT_W = 144, PORT_H = 176;
// PORT_IMG is loaded from assets/portraits.js
// Eye positions per portrait (x,y of left eye then right eye, in the unflipped 144 x 176 painting; -1 = not visible).
// Order: race (as PORT_RACES), then male SOLDIER..WITCH, then female SOLDIER..WITCH.
const PORT_EYES = [65,56,85,57,84,60,100,60,65,68,79,71,89,33,105,36,83,58,100,60,76,59,96,59,68,52,86,54,86,49,98,51,70,57,91,59,85,38,100,42,83,54,96,57,80,58,94,58,71,56,88,58,79,54,98,56,67,62,84,64,74,45,94,47,87,57,104,58,68,60,90,60,72,56,88,58,88,50,101,52,78,54,94,58,73,37,98,41,78,54,91,57,84,54,97,56,72,66,90,67,81,58,100,60,71,50,91,51,73,45,99,46,73,54,94,57,75,54,101,55,83,59,96,59,84,57,102,58,72,49,100,50,85,48,100,49,82,64,95,64,89,55,102,57,82,58,96,60,82,57,100,60,79,50,94,50,83,58,100,60,87,64,105,64,75,58,95,62,70,60,84,61,84,58,100,58,65,51,84,54,82,45,105,49,81,60,100,62,84,58,101,60,77,77,92,76,77,63,94,63,84,63,99,62,81,53,95,53,77,62,100,63,82,58,100,57,63,62,81,62,87,49,101,49,74,58,93,60,79,52,93,54,76,53,97,54,75,56,95,56,71,58,87,61,79,60,97,62,75,50,87,52,77,46,103,50,78,62,102,64,84,67,99,66,72,60,90,63,81,56,107,58,80,62,106,63,78,51,105,52,83,62,96,66,89,60,101,64,80,70,99,71,86,61,103,61,81,56,96,56,84,55,99,55,82,63,96,64,67,64,81,63,72,64,87,67,89,56,103,58,88,56,101,60,88,59,102,62,86,60,100,62,70,61,85,63,82,64,95,65,87,55,101,53,80,60,98,61,86,32,101,33,62,57,82,56,80,58,98,60,63,55,81,57,87,52,109,55,80,49,104,51,80,39,103,40,86,56,104,57,75,55,96,56,79,70,100,70,76,58,92,58,85,59,106,62,90,46,106,47,72,64,97,64,77,69,93,69,74,63,89,65,83,62,108,63,89,65,105,67,80,60,105,61,80,66,97,67,75,69,100,69,64,60,83,61,81,58,100,60,75,58,87,57,79,37,96,37,73,63,97,62,83,59,95,60,78,61,90,63,91,48,109,48,83,44,100,46,88,46,106,45,87,54,107,55,83,50,97,53,63,60,82,59,86,49,100,49,82,47,97,47,81,43,96,44,80,55,92,57,76,60,95,62,76,55,90,57,86,56,102,58,82,50,97,52,79,42,95,44,81,57,95,57,85,53,99,55,73,60,88,61,93,48,109,50,88,52,101,53,86,44,101,45,81,58,97,60,84,58,100,60,75,58,91,60,90,51,105,52,81,52,104,53,83,49,103,51,79,60,99,62,72,55,90,54,81,55,100,54,91,53,107,50,84,51,104,54,79,35,95,38,86,51,99,54,86,51,105,53,76,58,94,60,87,54,104,53,87,42,104,43,78,47,97,50,84,54,97,57,73,52,86,53,80,56,99,56,77,55,92,52,88,55,103,56,81,49,96,51,84,58,100,58,76,58,93,60,83,60,100,60,92,48,104,50,78,52,99,55,70,50,92,53,84,59,101,61,87,60,100,59,65,60,81,61,87,45,103,47,79,35,91,34,83,41,95,44,73,49,87,49,80,48,96,50,78,60,94,60,87,47,104,48,77,35,99,38,74,48,95,49,84,46,100,47,78,52,98,54,70,67,85,69,71,51,92,53,87,45,100,47,87,37,100,41,67,58,85,55,86,58,102,60,85,56,102,55,90,51,107,51,90,38,102,42,78,35,92,39,84,50,100,52,92,43,104,47];
const PORT = {ok:false, ab:null, mb:null, figs:{}, urls:{}, hud:{}};
PORT.load = function(){
  return new Promise(resolve => {
    let left = 2, bad = false;
    const a = new Image(), m = new Image();
    const fin = () => {
      if (--left) return;
      if (!bad){
        try {
          for (const [k, im] of [['ab', a], ['mb', m]]){
            const c = newCanvas(im.width, im.height), g = c.getContext('2d', {willReadFrequently:true});
            g.drawImage(im, 0, 0); PORT[k] = g; (PORT.keep = PORT.keep || []).push(c);
          }
          PORT.ok = PORT.ab.getImageData(0, 0, 1, 1) !== null;
        } catch(e){ PORT.ok = false; }
      }
      resolve();
    };
    a.onload = fin; m.onload = fin;
    a.onerror = () => { bad = true; fin(); }; m.onerror = () => { bad = true; fin(); };
    a.src = PORT_IMG.base; m.src = PORT_IMG.mask;
  });
};

/* ---- player-supplied portraits ------------------------------------------ */
const ckey = p => p ? String(p.name) + '|' + p.race : '';
PORT.cust = {};
function customOf(p){ const k = ckey(p); return k && typeof META !== 'undefined' && META && META.customPortraits && META.customPortraits[k] ? META.customPortraits[k] : null; }
function portCustomDecode(k){
  const e = META && META.customPortraits && META.customPortraits[k]; if (!e) return;
  const cur = PORT.cust[k]; if (cur && (cur.v === e.v || cur.pending === e.v)) return;
  PORT.cust[k] = {v:-1, pending:e.v};
  const im = new Image();
  im.onload = () => { try { const c = newCanvas(PORT_W, PORT_H), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, PORT_W, PORT_H); PORT.cust[k] = {v:e.v, cv:c};
      try { CAMP.dirty = true; refreshUI(); } catch (x) {} } catch (x) { delete PORT.cust[k]; } };
  im.onerror = () => { delete PORT.cust[k]; };
  im.src = e.d;
}
function portCustomFig(p){
  const e = customOf(p); if (!e) return null;
  const k = ckey(p), c = PORT.cust[k];
  if (!c || c.v !== e.v){ portCustomDecode(k); return null; }
  return c.fig || (c.fig = {cv:c.cv, eyes:[58, 62, 86, 62], V:{flip:false, hue:0, sat:1, lit:1, eye:0, seed:hash(k)}, custom:true});
}
const portHas = p => !!portCustomFig(p) || (PORT.ok && !!portIdx(p));
{ const f = personKey;   // the banner trim, then a custom portrait's version (one wrapper; js/art/face-picker.js adds the face)
  personKey = function(p, l){ let s = f(p, l) + (cosm().trim && cosm().trimOn ? '|T' : ''); const e = customOf(p);
    if (e){ const c = PORT.cust[ckey(p)]; if (!c || c.v !== e.v) portCustomDecode(ckey(p)); s += '|cp' + e.v + (c && c.v === e.v ? 'r' : 'w'); }
    return s; };
}
function portBadges(g, o){
  const inj = o.inj || [], sc = Math.min(4, (o.scars || 0) + inj.filter(i => i !== 'eye').length);
  g.save();
  if (o.hurt){ const gr = g.createRadialGradient(72, 72, 46, 72, 72, 104); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, 'rgba(120,0,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, PORT_W, PORT_H); }
  let x = 10; const y = 124;   // the framed view shows the top 144 rows of the 176-row painting
  const chip = draw => { g.fillStyle = 'rgba(20,14,10,.74)'; g.fillRect(x, y - 12, 24, 24); g.strokeStyle = '#d4af37'; g.lineWidth = 1; g.strokeRect(x + .5, y - 11.5, 23, 23); draw(x + 12, y); x += 28; };
  if (o.hurt) chip((cx, cy) => { g.save(); g.translate(cx, cy); g.rotate(-.6); g.fillStyle = '#e6dccb'; g.fillRect(-9, -4, 18, 8); g.fillStyle = '#c4b8a4'; g.fillRect(-9, 2, 18, 2); g.fillStyle = '#b02020'; g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill(); g.restore(); });
  if (inj.includes('eye')) chip((cx, cy) => { g.fillStyle = '#0c0805'; g.beginPath(); g.ellipse(cx, cy, 7, 5.5, 0, 0, 7); g.fill(); g.strokeStyle = '#8a7e6a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 9, cy - 8); g.lineTo(cx + 9, cy + 8); g.stroke(); });
  if (inj.includes('arm')) chip((cx, cy) => { g.strokeStyle = '#e6dccb'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 8, cy - 7); g.lineTo(cx + 8, cy + 7); g.stroke(); g.strokeStyle = '#b8ac98'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 8, cy - 4); g.lineTo(cx + 8, cy + 10); g.stroke(); });
  if (sc) chip((cx, cy) => { g.strokeStyle = '#e8b0a4'; g.lineWidth = 1.7; for (let i = 0; i < sc; i++){ const xx = cx - 7 + i * 4.6; g.beginPath(); g.moveTo(xx, cy - 7); g.lineTo(xx + 1.5, cy + 7); g.stroke(); } });
  g.restore();
}
// Which painting belongs to this person? null means: use the pixel face.
function portIdx(p){
  if (!p) return null;
  const ri = PORT_RACES.indexOf(p.race), si = PORT_SPECS.indexOf(p.portSpec || p.spec);   // Index 30: the Scribe borrows a robed look
  if (ri < 0 || si < 0) return null;
  const sx = sexOf(p) === 'f' ? 1 : 0;
  return {ri, si, sx, c:sx * 6 + si};
}
const portHex = h => { const n = parseInt(String(h).replace('#', '').slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
// Slight, repeatable per-person variation: flip, hue, saturation, lightness.
function portVary(p){
  { const F = window.FACE47C; if (F && F.match && F.match(p)) return {flip:!!p.face.flip, hue:0, sat:1, lit:1, eye:0, seed:(p.face.k * 2 + (p.face.flip ? 1 : 0)) << 3}; }   // F-47c (js/art/face-picker.js): a face picked on the create screen
  if (p && p.hero) return {flip:false, hue:0, sat:1, lit:1, eye:0, seed:hash(String(p.name))};   // Index 28: heroes keep one look
  /* F-47: the look is tied to the first id a person had (p.vid), so a recruit keeps the same face after hiring gives a new id. INT-1 group 22: no switch */
  if (p && p.vid === undefined && p.id){ try { p.vid = p.id; } catch (e) {} }
  let h = hash(String(p.name) + ':' + (p.vid || p.id || 'L') + ':' + p.race);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = (h ^ (h >>> 16)) >>> 0;   // spread the bits
  return {flip:!!((h >>> 7) & 1), hue:((h >>> 8) % 17) - 8, sat:0.9 + ((h >>> 13) % 23) / 100, lit:0.93 + ((h >>> 18) % 15) / 100, eye:(h >>> 23) & 1, seed:h};
}
function portAdjust(d, hueDeg, sat, lit){
  const dh = hueDeg / 360;
  for (let i = 0; i < d.length; i += 4){
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dd = mx - mn;
    let h = 0, s = 0;
    if (dd > 1e-6){
      s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6;
    }
    h += dh; h -= Math.floor(h); s = Math.min(1, s * sat);
    const l2 = Math.min(1, l * lit);
    const q = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s, pp = 2 * l2 - q;
    const f = t => { t -= Math.floor(t); return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    if (s === 0){ d[i] = d[i + 1] = d[i + 2] = l2 * 255; } else { d[i] = f(h + 1 / 3) * 255; d[i + 1] = f(h) * 255; d[i + 2] = f(h - 1 / 3) * 255; }
  }
}
// F-47 (b) (js/art/portraits-more.js): a person may use one of the extra painted sheets (PORT47.pick). That sheet's arrays and eyes
// are swapped in while portFigureSheet paints, then put back. Folded from the port47 wrapper (INT-1 stage 3).
function portFigure(p, isLeader, opt = {}){
  const A = window.PORT47; let k = 0;
  try { if (A && !(opt && opt.plain) && !portCustomFig(p)) k = A.pick(p); } catch (e){ k = 0; }
  if (!k) return portFigureSheet(p, isLeader, opt);
  const s = A.sets[k - 1], ix = portIdx(p), at = (ix.ri * 12 + ix.c) * 4, E = PORT_EYES;
  const keep = {ab:PORT.ab, mb:PORT.mb, figs:PORT.figs, e:[E[at], E[at + 1], E[at + 2], E[at + 3]]};
  try {
    PORT.ab = s.ab; PORT.mb = s.mb; PORT.figs = s.figs; for (let i = 0; i < 4; i++) E[at + i] = s.eyes[at + i];
    const fig = portFigureSheet(p, isLeader, opt); A.used++; return fig;
  } catch (e){ A.fails.figure = String(e && e.message || e); }
  finally { s.figs = PORT.figs; PORT.ab = keep.ab; PORT.mb = keep.mb; PORT.figs = keep.figs; for (let i = 0; i < 4; i++) E[at + i] = keep.e[i]; }
  return portFigureSheet(p, isLeader, opt);
}
// The painting for one person, tinted, varied and (maybe) flipped, from the sheet now in PORT. Returns {cv, eyes}.
function portFigureSheet(p, isLeader, opt = {}){
  const cf = portCustomFig(p); if (cf) return cf;
  const ix = portIdx(p); if (!ix || !PORT.ok) return null;
  const bn = banner(), V = opt.plain ? {flip:false, hue:0, sat:1, lit:1, eye:0, seed:0} : portVary(p);
  const trim = !!(isLeader || opt.trim || (cosm().trim && cosm().trimOn));
  const key = [ix.ri, ix.c, V.flip ? 1 : 0, V.hue, V.sat, V.lit, bn.c1, trim ? bn.c2 : '-', opt.plain ? 'p' : ''].join('|');
  if (PORT.figs[key]) return PORT.figs[key];
  if (Object.keys(PORT.figs).length > 360) PORT.figs = {};
  const W = PORT_W, H = PORT_H, x0 = ix.c * W, y0 = ix.ri * H;
  const bi = PORT.ab.getImageData(x0, y0, W, H), mi = PORT.mb.getImageData(x0, y0, W, H), bd = bi.data, md = mi.data;
  // scarf shading comes from the painting's own luminance in the keyed area
  let sum = 0, cnt = 0; const cov = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < W * H; i++, j += 4){
    if (md[j] > 128){ cov[i] = 1; sum += 0.3 * bd[j] + 0.59 * bd[j + 1] + 0.11 * bd[j + 2]; cnt++; }
  }
  const mu = cnt ? sum / cnt : 100;
  const lum = new Float32Array(W * H);
  for (let i = 0, j = 0; i < W * H; i++, j += 4) lum[i] = 0.3 * bd[j] + 0.59 * bd[j + 1] + 0.11 * bd[j + 2];
  if (V.hue || V.sat !== 1 || V.lit !== 1) portAdjust(bd, V.hue, V.sat, V.lit);
  const c1 = portHex(bn.c1), c2 = portHex(bn.c2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = y * W + x, j = i * 4, ma = md[j] / 255;
    if (ma < 0.02) continue;
    let k = lum[i] / mu; k = k < 0.4 ? 0.4 : k > 1.55 ? 1.55 : k;
    let edge = false;
    if (trim && cov[i]) edge = !cov[(y > 1 ? y - 2 : y) * W + x] || !cov[(y < H - 2 ? y + 2 : y) * W + x] || !cov[y * W + (x > 1 ? x - 2 : x)] || !cov[y * W + (x < W - 2 ? x + 2 : x)];
    const t = edge ? c2 : c1, kk = edge ? Math.min(1.2, k) : k;
    for (let ch = 0; ch < 3; ch++){ const v = bd[j + ch] * (1 - ma) + t[ch] * kk * ma; bd[j + ch] = v > 255 ? 255 : v; }
  }
  let cv = newCanvas(W, H); cv.getContext('2d').putImageData(bi, 0, 0);
  const e = PORT_EYES[(ix.ri * 12 + ix.c) * 4 + 0] === undefined ? [-1, -1, -1, -1] : PORT_EYES.slice((ix.ri * 12 + ix.c) * 4, (ix.ri * 12 + ix.c) * 4 + 4);
  let eyes = [e[0], e[1], e[2], e[3]];
  if (V.flip){
    const f = newCanvas(W, H), g = f.getContext('2d'); g.translate(W, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); cv = f;
    eyes = [eyes[0] < 0 ? -1 : W - 1 - eyes[0], eyes[1], eyes[2] < 0 ? -1 : W - 1 - eyes[2], eyes[3]];
  }
  return PORT.figs[key] = {cv, eyes, V};
}
/* ---- wounds on top of the painting -------------------------------------- */
function portFace(eyes){
  let pts = [];
  if (eyes[0] >= 0) pts.push([eyes[0], eyes[1]]);
  if (eyes[2] >= 0) pts.push([eyes[2], eyes[3]]);
  pts.sort((a, b) => a[0] - b[0]);
  if (!pts.length) pts = [[60, 62], [84, 62]];
  if (pts.length === 1) pts = pts[0][0] < 72 ? [pts[0], [pts[0][0] + 22, pts[0][1]]] : [[pts[0][0] - 22, pts[0][1]], pts[0]];
  const d = Math.max(16, Math.min(38, pts[1][0] - pts[0][0]));
  return {A:pts[0], B:pts[1], cx:(pts[0][0] + pts[1][0]) / 2, cy:(pts[0][1] + pts[1][1]) / 2, d};
}
function portStroke(g, pts, w, col, alpha = 1){
  g.save(); g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); g.restore();
}
// F-48 Phase 4 (js/art/portrait-state.js): wounds are painted into the picture by PORT48.wounds; the old flat marks
// (portWoundsFlat) are the fallback if that throws. Folded from the port48 wrapper (INT-1 stage 3).
function portWounds(g, fig, o){
  const A = window.PORT48;
  if (A && A.wounds){ try { g.save(); A.wounds(g, fig, o); g.restore(); return; } catch (e){ g.restore(); A.fails.draw = String(e && e.message || e); } }
  return portWoundsFlat(g, fig, o);
}
function portWoundsFlat(g, fig, o){
  const F = portFace(fig.eyes), d = F.d, s = d / 22, A = F.A, B = F.B, cx = F.cx, cy = F.cy, seed = fig.V.seed;
  const inj = o.inj || [], scars = Math.min(4, (o.scars || 0) + inj.filter(i => i !== 'eye').length);
  const masked = o.spec === 'SCOUNDREL', covered = o.spec === 'SOLDIER' || o.spec === 'FOLK_HERO' || o.spec === 'SCOUNDREL' || o.spec === 'WITCH';
  g.save();
  // scars: pale ridge with a dark edge, small stitch ticks
  const T = [
    [[B[0] + 0.12 * d, B[1] - 0.18 * d], [B[0] + 0.30 * d, B[1] + 0.20 * d], [B[0] + 0.22 * d, B[1] + 0.62 * d]],
    [[A[0] - 0.14 * d, A[1] - 0.10 * d], [A[0] - 0.30 * d, A[1] + 0.26 * d], [A[0] - 0.16 * d, A[1] + 0.66 * d]],
    [[cx + 0.30 * d, cy - 0.04 * d], [cx + 0.42 * d, cy + 0.32 * d], [cx + 0.30 * d, cy + 0.74 * d]],
    [[A[0] - 0.05 * d, A[1] - 0.46 * d], [A[0] + 0.28 * d, A[1] - 0.30 * d], [A[0] + 0.58 * d, A[1] - 0.34 * d]]
  ];
  const order = masked ? [0, 1, 3, 2] : covered ? [0, 1, 2, 3] : [0, 3, 1, 2];
  for (let i = 0; i < scars; i++){
    const P = T[order[(i + (seed % 4)) % 4]];
    portStroke(g, P.map(q => [q[0] + 0.8, q[1] + 0.8]), 1.3 * s + 0.4, '#5a2420', 0.75);
    portStroke(g, P, 1.5 * s + 0.4, '#e8b0a4', 0.9);
    for (let k = 0.25; k < 0.9; k += 0.3){ const x = P[0][0] + (P[2][0] - P[0][0]) * k, y = P[0][1] + (P[2][1] - P[0][1]) * k; portStroke(g, [[x - 1.6 * s, y - 1.2 * s], [x + 1.6 * s, y + 1.2 * s]], 0.8, '#5a2420', 0.7); }
  }
  if (inj.includes('mana')){
    for (const [x, y, r] of [[A[0] - 0.55 * d, A[1] + 0.45 * d, 0.16 * d], [B[0] + 0.5 * d, B[1] + 0.3 * d, 0.12 * d], [cx + 0.1 * d, cy - 0.7 * d, 0.1 * d]]){
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(110,40,36,.85)'); gr.addColorStop(1, 'rgba(110,40,36,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }
  if (inj.includes('lung') || inj.includes('shell')){
    for (const P of [A, B]){ g.fillStyle = 'rgba(50,34,56,.38)'; g.beginPath(); g.ellipse(P[0], P[1] + 0.27 * d, 0.26 * d, 0.08 * d, 0, 0, 7); g.fill(); }
  }
  if (inj.includes('arm')){
    // cloth sling across the chest, drawn only over the painted bust
    g.save(); g.globalCompositeOperation = 'source-atop'; g.lineCap = 'butt';
    portStroke(g, [[6, 126], [140, 178]], 17, '#7a6e5c', 0.9);
    portStroke(g, [[6, 123], [140, 175]], 15, '#e6dccb', 1);
    portStroke(g, [[6, 129], [140, 181]], 3, '#b8ac98', 0.9);
    portStroke(g, [[6, 117], [140, 169]], 1.4, '#fff6e4', 0.8);
    g.fillStyle = '#c9bda8'; g.beginPath(); g.arc(18, 123, 8, 0, 7); g.fill();
    g.fillStyle = '#e6dccb'; g.beginPath(); g.arc(17, 121, 6.5, 0, 7); g.fill();
    g.strokeStyle = '#8a7e6a'; g.lineWidth = 1.2; g.beginPath(); g.arc(17, 121, 6.5, 0, 7); g.stroke();
    g.restore();
  }
  if (inj.includes('eye')){
    const P = (fig.eyes[0] >= 0 && fig.eyes[2] >= 0) ? (fig.V.eye ? B : A) : (fig.eyes[0] >= 0 ? [fig.eyes[0], fig.eyes[1]] : [fig.eyes[2], fig.eyes[3]]);
    const dir = P === A ? -1 : 1, rx = 0.34 * d, ry = 0.27 * d;
    portStroke(g, [[P[0], P[1]], [P[0] - dir * 0.9 * d, P[1] - 0.95 * d]], 1.5 * s + 0.4, '#1a1410', 0.95);
    portStroke(g, [[P[0], P[1]], [P[0] + dir * 1.0 * d, P[1] - 0.45 * d]], 1.5 * s + 0.4, '#1a1410', 0.95);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(P[0] + 0.6, P[1] + 1.2, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = '#17110c'; g.beginPath(); g.ellipse(P[0], P[1], rx, ry, 0, 0, 7); g.fill();
    g.strokeStyle = '#3c3028'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(P[0], P[1], rx - 0.7, ry - 0.7, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(110,96,84,.55)'; g.beginPath(); g.ellipse(P[0] - 0.12 * d, P[1] - 0.1 * d, rx * 0.4, ry * 0.25, -0.5, 0, 7); g.fill();
  }
  if (o.hurt){
    // plaster across the cheekbone, blood from the temple, a bruise
    const px = B[0] + 0.45 * d, py = B[1] + 0.34 * d;
    g.fillStyle = 'rgba(92,52,92,.28)'; g.beginPath(); g.ellipse(A[0] - 0.1 * d, A[1] + 0.38 * d, 0.3 * d, 0.16 * d, 0.2, 0, 7); g.fill();
    g.save(); g.translate(px, py); g.rotate(-0.5);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-0.34 * d + 0.7, -0.12 * d + 1, 0.68 * d, 0.24 * d);
    g.fillStyle = '#e6dccb'; g.fillRect(-0.34 * d, -0.12 * d, 0.68 * d, 0.24 * d);
    g.fillStyle = '#c4b8a4'; g.fillRect(-0.34 * d, 0.07 * d, 0.68 * d, 0.05 * d);
    g.fillStyle = '#b02020'; g.beginPath(); g.arc(0.07 * d, 0, 0.07 * d, 0, 7); g.fill();
    g.restore();
    const T2 = [[B[0] + 0.38 * d, B[1] - 0.48 * d], [B[0] + 0.46 * d, B[1] - 0.1 * d], [B[0] + 0.40 * d, B[1] + 0.12 * d]];
    portStroke(g, T2, 1.9 * s + 0.3, '#7a1010', 0.95); portStroke(g, T2, 0.8 * s + 0.2, '#c02828', 0.9);
    g.fillStyle = '#8a1414'; g.beginPath(); g.arc(B[0] + 0.62 * d, B[1] + 0.62 * d, 0.07 * d, 0, 7); g.fill();
  }
  g.restore();
}
// The finished figure: painting plus wounds.
function portDressed(p, isLeader, opt = {}){
  const fig = portFigure(p, isLeader, opt); if (!fig) return null;
  const inj = p.injuries || [], hurt = !!(p.resting > 0 && !p.trainingAt), scars = p.scars || 0;
  if (!inj.length && !hurt && !scars) return fig;
  const k = 'd|' + inj.join(',') + '|' + (hurt ? 1 : 0) + '|' + scars;
  fig.dress = fig.dress || {};
  if (!fig.dress[k]){
    const cv = newCanvas(PORT_W, PORT_H), g = cv.getContext('2d'); g.drawImage(fig.cv, 0, 0);
    if (fig.custom) portBadges(g, {inj, hurt, scars}); else portWounds(g, fig, {inj, hurt, scars, spec:p.spec});
    fig.dress[k] = {cv, eyes:fig.eyes, V:fig.V};
  }
  return fig.dress[k];
}
/* ---- framing: the Edelos frames sit round the painting ------------------ */
function portFrameOverlay(fid){
  const c = newCanvas(36, 36), P = painter(c.getContext('2d')), F = FRAMES[fid] || FRAMES.plain;
  P(0, 0, 36, 1, F.o); P(0, 35, 36, 1, F.o); P(0, 0, 1, 36, F.o); P(35, 0, 1, 36, F.o);
  if (F.i){ P(1, 1, 34, 1, F.i); P(1, 34, 34, 1, shade(F.i, .75)); P(1, 1, 1, 34, F.i); P(34, 1, 1, 34, shade(F.i, .75));
    for (const [x, y] of [[1, 1], [33, 1], [1, 33], [33, 33]]){ P(x, y, 2, 2, F.o); P(x, y, 1, 1, F.stud); } }
  return c;
}
function portBackSmooth(g, col){
  const base = shade(col || '#4a3a2a', .34), mid = shade(col || '#4a3a2a', .52), K = 4;
  g.fillStyle = base; g.fillRect(0, 0, 144, 144);
  const gr = g.createRadialGradient(17 * K, 13 * K, 0, 17 * K, 13 * K, 20 * K); gr.addColorStop(0, mid); gr.addColorStop(.45, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 144, 144);
  const vg = g.createRadialGradient(72, 72, 40, 72, 72, 104); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
  g.fillStyle = vg; g.fillRect(0, 0, 144, 144);
}
// the frame lines as vector at 144 (the old overlay was a 36x36 blit); same colours and studs as portFrameOverlay
function portFrameVec(g, fid){
  const F = FRAMES[fid] || FRAMES.plain, K = 4; g.save();
  g.fillStyle = F.o; g.fillRect(0, 0, 144, K); g.fillRect(0, 144 - K, 144, K); g.fillRect(0, 0, K, 144); g.fillRect(144 - K, 0, K, 144);
  if (F.i){ const i = shade(F.i, .75);
    g.fillStyle = F.i; g.fillRect(K, K, 136, K); g.fillRect(K, K, K, 136);
    g.fillStyle = i; g.fillRect(K, 144 - 2 * K, 136, K); g.fillRect(144 - 2 * K, K, K, 136);
    for (const [x, y] of [[1, 1], [33, 1], [1, 33], [33, 33]]){ g.fillStyle = F.o; g.beginPath(); g.arc((x + 1) * K, (y + 1) * K, 2.6 * K, 0, 7); g.fill(); g.fillStyle = F.stud; g.beginPath(); g.arc((x + 1) * K, (y + 1) * K, 1.4 * K, 0, 7); g.fill(); } }
  g.restore();
}
function portPaint(g, fig, bob, zoom){
  g.save(); g.beginPath(); g.rect(5, 5, 134, 134); g.clip();
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const sw = 144 / zoom, sh = 144 / zoom, sx = (144 - sw) / 2, sy = bob;
  g.drawImage(fig.cv, sx, sy, sw, sh, 5, 5, 134, 134);
  g.restore();
}
function portFramed(p, isLeader, frameId, col, b){
  const fig = portDressed(p, isLeader); if (!fig) return null;
  const c = newCanvas(144, 144), g = c.getContext('2d');
  portBackSmooth(g, col);   // PL-1 item 6 (AD 23 Nov): a smooth fill drawn at 144, not the 34x34 dither enlarged 4x
  portPaint(g, fig, b ? 1.5 : 0, b ? 1.012 : 1);
  portFrameVec(g, frameId);
  return c;
}
function portURL(key, make){
  /* F-48 (js/art/portrait-state.js): the Chapter Master's gold portrait (cache 'pm1:') is keyed by rest, scars and injuries too,
     so a hurt or newly scarred Master gets a new picture. Folded from the port48 wrapper (INT-1 stage 3). */
  if (typeof key === 'string' && key.indexOf('pm1:') === 0){
    try {
      const m = ensureMaster(), hurt = m && m.resting > 0 && !m.trainingAt, scars = (m && m.scars) || 0, inj = ((m && m.injuries) || []).join(',');
      if (hurt || scars || inj) key = 'pm48:' + key.slice(4) + '|' + (hurt ? 1 : 0) + '|' + scars + '|' + inj;
    } catch (e){ if (window.PORT48) PORT48.fails.master = String(e && e.message || e); }
  }
  if (PORT.urls[key] === undefined){
    let u = '';
    try { const c = make(); if (c) u = c.toDataURL('image/jpeg', 0.92) + '#pt'; } catch(e){ u = ''; }
    PORT.urls[key] = u;
  }
  return PORT.urls[key];
}
// Race cards and specialty icons use a painted face too.
// (raceIconURL's painted face is in js/art/pixel.js: INT-1 step 3)
/* ---- Chapter Master and the founding screens: gold frame, banner backdrop */
function portGold(p, isLeader, opt){
  const fig = portDressed(p, isLeader, opt); if (!fig) return null;
  const c = newCanvas(144, 144), g = c.getContext('2d'), bg = shade(banner().c1, 0.55);
  g.fillStyle = C.goldD; g.fillRect(0, 0, 144, 144); g.fillStyle = C.gold; g.fillRect(4, 4, 136, 136);
  g.fillStyle = bg; g.fillRect(8, 8, 128, 128);
  g.fillStyle = shade(bg, .9); for (let y = 14; y < 136; y += 12) g.fillRect(8, y, 128, 4);
  g.save(); g.beginPath(); g.rect(8, 8, 128, 128); g.clip();
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(fig.cv, 0, 0, 144, 144, 8, 8, 128, 128); g.restore();
  g.fillStyle = C.goldD; g.fillRect(4, 138, 136, 2);
  return c;
}
{ const f = toURL;   // pixel.js's cache. One wrapper: the Master's painted portrait, then the breathing and blinking variants (section 3)
  toURL = function(key, make, scale){
    if (typeof key === 'string' && key.indexOf('cmb3:') === 0 && key.indexOf('|') < 0){
      const m = ensureMaster();
      if (portHas(m)){ const u = portURL('pm1:' + key + '|' + personKey(m, true), () => portGold(m, true, {trim:true})); if (u) return u; }
    }
    const u = f(key, make, scale);
    if ((key.startsWith('cmb3:') || key.startsWith('cmpv3:')) && key.indexOf('|') < 0)
      regAnim(u, v => f(key + '|' + vkey(v), () => { BVAR = v; try { return make(); } finally { BVAR = null; } }, scale));
    return u;
  };
}
{ const f0 = previewBustURL;
  previewBustURL = function(race, sex, spec, cls){
    const m = {id:'CMP', name:'preview' + race + sex, race, sex, spec:spec || 'CLERIC', cls:cls || 'FREEMAN'};
    if (!PORT.ok || !portIdx(m)) return f0(race, sex, spec, cls);
    const u = portURL('pv1:' + race + sex + m.spec + bannerSig(), () => portGold(m, true, {plain:true, trim:true}));
    return u || f0(race, sex, spec, cls);
  };
}
/* ---- the Leader's face on the HUD (44 x 44, redrawn only when it changes) */
function hudBust(){   // INT-1 step 3: the wrapper folded in; hudBustPixel is the old body
    const P = META.leader;
    if (!P || !portHas(P)) return hudBustPixel();
    const L = G.leader;
    let e = '';
    if (L.down || L.con <= Math.max(1, Math.floor(L.maxCon / 3)) || G.flash > 8) e = 'pained';
    else if (G.shoutT > 0) e = 'shout';
    else if (G.grinT > 0) e = 'grin';
    else if (G.frame - (G.lastContact || -999) < 90) e = 'angry';
    else if (G.shaken) e = 'sad';
    const b = ((G.frame / 50) | 0) % 2;
    const key = personKey(P, true) + '|' + b + '|' + e;
    if (PORT.hud[key]) return PORT.hud[key];
    const fig = portDressed(P, true); if (!fig) return hudBustPixel();
    const c = newCanvas(64, 64), g = c.getContext('2d'), F = portFace(fig.eyes);
    const zoom = (e === 'shout' ? 1.1 : e === 'grin' ? 1.05 : 1) * (b ? 1.012 : 1), sz = 104 / zoom;
    const sx = Math.max(0, Math.min(PORT_W - sz, F.cx - sz / 2)), sy = Math.max(0, F.cy - sz * 0.42 + (b ? 1 : 0));
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(fig.cv, sx, sy, sz, sz, 0, 0, 64, 64);
    if (e === 'pained'){ g.fillStyle = 'rgba(170,20,20,.30)'; g.fillRect(0, 0, 64, 64); }
    else if (e === 'angry'){ const gr = g.createRadialGradient(32, 32, 14, 32, 32, 46); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,0,0,.38)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    else if (e === 'sad'){ g.fillStyle = 'rgba(40,60,100,.22)'; g.fillRect(0, 0, 64, 64); }
    else if (e === 'grin' || e === 'shout'){ g.fillStyle = 'rgba(255,220,140,.12)'; g.fillRect(0, 0, 64, 64); }
    const keys = Object.keys(PORT.hud); if (keys.length > 80) delete PORT.hud[keys[0]];
    return PORT.hud[key] = c;
}
// Painted faces are smooth, so the pixel-art "crisp edges" rule must not apply to them.
{ const st = document.createElement('style');
  st.textContent = 'img[src$="#pt"]{image-rendering:auto!important;min-height:72px;width:auto}'
    + 'img.ic[src$="#pt"]{height:96px;min-height:96px;margin-bottom:4px}img.ic.sm[src$="#pt"]{height:72px;min-height:72px}'
    + '#camp-panel .pimg[src$="#pt"]{height:150px;min-height:150px}#camp-panel .line img[src$="#pt"]{height:72px}'
    + '.council .master img[src$="#pt"]{height:96px;min-height:96px}.marcher img[src$="#pt"]{height:84px;min-height:84px}'
    + 'table.man img[src$="#pt"]{height:64px;min-height:64px}.ledger .line img[src$="#pt"],.advbox .line img[src$="#pt"]{height:72px}';
  document.head.appendChild(st); }
// Load the paintings before the title screen appears.
{ const f = window.onload; window.onload = function(){ const self = this; PORT.load().then(() => f.call(self), () => f.call(self)); }; }
/* ===== END PAINTED PORTRAITS ============================================== */

