/* js/combat/abilities-2b.js (INT-1 step 2, 2026-11-16): INDEX 39 (build 2B: abilities, prayers, spells, rituals).
   Cut unchanged from the inline script in index.html (old lines 16200 to 16561). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 39 - BUILD 2B: SEVENTEEN ABILITIES, PRAYERS, SPELLS AND RITUALS
   Every effect comes from the Players Manual (Tables 2.8 to 2.13 and 7.2, 7.4,
   7.6). A tabletop battle lasts a handful of rounds and a contract here lasts
   6 to 10 minutes, so the manual's limits are read like this:
     "once per battle"    a cooldown (20 to 30 seconds)
     "one round"          6 seconds
     Preparation spells   cast as the contract starts and again every 60 seconds
   Each card is an ordinary card: abilities are chosen at a Level pick, at the
   Command Tent or in a Momentum rank; spells and prayers are learnt at the Mage
   Tower, Chapel or Alchemy Lab, and need the Magic stat shown on the card
   (minMagic), for a Leader as well as a Squad Mate.
     SOLDIER    Disarm, Improved Charge
     FOLK HERO  Assist Allies, Defiant Stand
     SCOUNDREL  Slip the Line, Nobody Saw Me
     CLERIC     Censure, Sanctified Blade, Last Rites, Flame Strike, Silence the Unholy
     MAGE       Counterspell Reflex, Conjure Stone Wall, Illusory Decoy, Earthquake Tremor
     WITCH      Bleeding Omen, Veil of Shadows, Rain Dance
   Where the manual's wording needed a call, the call is written on the card.
   Every timing is in the table T2B below.
   To roll back, delete from this comment to END INDEX 39 and undo the small
   patches marked "Index 39" elsewhere in the file.
============================================================================ */
const T2B = {
  assistEvery:480, assistSec:240, assistLoss:43,          // Assist Allies: every 8 s, +1 step for 4 s, and the Folk Hero gives up one shot
  discSec:360,                                            // Disarm: 1 round
  chargeStagger:60, chargeSlow:120,                       // Improved Charge: a failed Morale stumbles
  sanctCd:1200, lastRitesCd:1800, lastRitesSec:540,       // Sanctified Blade every 20 s; Last Rites every 30 s, +1 step for 9 s
  counterCd:1200, nobodyCd:1800, nobodyStun:180,
  flameCd:[1800, 1200], flameFavour:4, flameRadius:78,
  silenceSec:1080, silenceFavour:3,
  wallLife:[1200, 1800], wallEvery:[3600, 2700], wallHalf:78,
  decoySec:480, decoyEvery:3600, decoyAhead:150,
  tremorCd:[1500, 1080], tremorMax:[14, 18], tremorRadius:156, tremorStagger:120, tremorSlow:240,
  omenEvery:[420, 300], omenSec:360, omenMax:[6, 8],
  veilSec:360, veilEvery:3600,
  rainSec:1800, rainEvery:3600
};
const UNHOLY_B2 = UNHOLY;
const B2_SPELLS = {flamestrike:'chapel', silence:'chapel', stonewall:'magetower', decoy:'magetower', tremor:'magetower', omen:'alchemy', veil:'alchemy', raindance:'alchemy'};
CARDS.push(
  // ---- Soldier (Table 2.8)
  {id:'disarm', spec:'SOLDIER', ability:true, max:1, tag:'Soldier Talent', name:'Disarm', glyph:'disarm',
   text:() => 'A Soldier\'s Critical Hit disarms its target: it attacks 1 step lower for 6 seconds.'},
  {id:'impcharge', spec:'SOLDIER', ability:true, max:1, tag:'Soldier Talent', name:'Improved Charge', glyph:'horse',
   text:() => 'A Soldier\'s Solid Hit during a Charge forces its target to test Morale. If it fails it stumbles: staggered for 1 second and slowed for 2.'},
  // ---- Folk Hero (Table 2.9)
  {id:'assist', spec:'FOLK_HERO', ability:true, max:1, tag:'Folk Hero Talent', name:'Assist Allies', glyph:'flag',
   text:() => 'Every 8 seconds the Folk Hero gives the Squad Mate fighting hardest +1 step on their attacks for 4 seconds, and gives up one shot to do it.'},
  {id:'defiant', spec:'FOLK_HERO', ability:true, max:1, tag:'Folk Hero Talent', name:'Defiant Stand', glyph:'shield',
   text:() => 'A Folk Hero at or below half Condition gains +1 Melee step, and either 1 Ward Token once a contract (in formation) or +1 AC (out of formation).'},
  // ---- Scoundrel (Table 2.10)
  {id:'slipline', spec:'SCOUNDREL', ability:true, max:1, tag:'Scoundrel Talent', name:'Slip the Line', glyph:'boot',
   text:() => 'The squad moves through enemy zones of control: snares, caltrops and Withering Hex no longer slow it.'},
  {id:'nobody', spec:'SCOUNDREL', ability:true, max:1, tag:'Scoundrel Talent', name:'Nobody Saw Me', glyph:'mask',
   text:() => 'Once every 30 seconds an enemy shot or spell at the squad is cancelled, and the shooter loses its next attack for 3 seconds.'},
  // ---- Cleric (Table 2.11 and Table 7.4)
  {id:'censure', spec:'CLERIC', ability:true, max:1, tag:'Cleric Talent', name:'Censure', glyph:'sun',
   text:() => 'The Cleric\'s Solid Hits and damaging prayers deal +2 flat damage against the Hollow dead and fiends (Hollow Levies, Cinderlings, Orsolt, Devil-Knights).'},
  {id:'sanctified', spec:'CLERIC', ability:true, max:1, tag:'Cleric Talent', name:'Sanctified Blade', glyph:'sword',
   text:() => 'Every 20 seconds the Cleric\'s next Solid Hit is Piercing: it ignores armour.'},
  {id:'lastrites', spec:'CLERIC', ability:true, max:1, tag:'Cleric Talent', name:'Last Rites', glyph:'heart',
   text:() => 'When a Squad Mate within 3 hexes of the Cleric is downed, the squad shifts its attack dice up 1 step for 9 seconds. Once every 30 seconds.'},
  {id:'flamestrike', spec:'CLERIC', req:'chapel', minMagic:3, max:2, tag:'Divine Prayer', name:'Flame Strike', glyph:'flame',
   text:r => `Costs 4 Favour. A pillar of solar fire on the thickest crowd within 8 hexes: Magic +1 against every enemy in the blast, Skill 4 damage. Needs a Cleric with Magic 3. Recasts every ${r >= 2 ? 20 : 30} seconds while Favour lasts.`},
  {id:'silence', spec:'CLERIC', req:'chapel', minMagic:3, max:1, tag:'Continuous Prayer', name:'Silence the Unholy', glyph:'star',
   text:() => 'Costs 3 Favour. For 18 seconds enemy casters within 3 hexes of the Cleric cannot cast. The manual silences your own casters too; here they are exempt, because the prayer is automatic. Needs a Cleric with Magic 3.'},
  // ---- Mage (Table 2.12 and Table 7.2)
  {id:'counterspell', spec:'MAGE', ability:true, max:1, tag:'Mage Talent', name:'Counterspell Reflex', glyph:'bars',
   text:() => 'Once every 20 seconds, when an enemy caster within 6 hexes of the Mage casts, the spell is rolled again and the worse result stands: bolts hit 1 step easier to dodge, and curses last half as long.'},
  {id:'stonewall', spec:'MAGE', req:'magetower', minMagic:2, max:2, tag:'Arcane: Pre-Scenario', name:'Conjure Stone Wall', glyph:'bars',
   text:r => `Cast at the start and every ${r >= 2 ? 45 : 60} seconds: a stone parapet 4 hexes wide ahead of the squad for ${r >= 2 ? 30 : 20} seconds. Heavy Cover (+1 AC) for anyone beside it, and enemy shots cannot cross it. Needs a Mage with Magic 2.`},
  {id:'decoy', spec:'MAGE', req:'magetower', minMagic:3, max:1, tag:'Arcane: Pre-Scenario', name:'Illusory Decoy', glyph:'flag',
   text:() => 'Cast at the start and every 60 seconds: a phantom squad stands ahead of the squad for 8 seconds, and enemy shots and artillery are drawn to it harmlessly. Needs a Mage with Magic 3.'},
  {id:'tremor', spec:'MAGE', req:'magetower', minMagic:4, max:2, tag:'Arcane: Once per Scenario', name:'Earthquake Tremor', glyph:'anvil',
   text:r => `Every ${r >= 2 ? 18 : 25} seconds the ground cracks under the thickest crowd within 8 hexes: up to ${r >= 2 ? 18 : 14} enemies (never commanders) are knocked Prone for 2 seconds and slowed for 4, and nests and engines take 2. Needs a Mage with Magic 4.`},
  // ---- Witch (Table 2.13 and Table 7.6)
  {id:'omen', spec:'WITCH', req:'alchemy', max:2, tag:'Occult Foci', name:'Bleeding Omen', glyph:'stake',
   text:r => `Every ${r >= 2 ? 5 : 7} seconds the toughest enemy near the squad, and up to ${(r >= 2 ? 8 : 6) - 1} around it, have their armour cursed: it shifts down 1 step for 6 seconds.`},
  {id:'veil', spec:'WITCH', req:'alchemy', max:1, tag:'Occult Ritual', name:'Veil of Shadows', glyph:'snow',
   text:() => 'Cast at the start and every 60 seconds: for 6 seconds enemy archers and crossbowmen cannot shoot at the squad.'},
  {id:'raindance', spec:'WITCH', req:'alchemy', minMagic:3, max:1, tag:'Occult Ritual', name:'Rain Dance', glyph:'drop',
   text:() => 'Cast at the start and every 60 seconds: a downpour for 30 seconds. Every bow and crossbow, yours included, reaches 2 hexes less, and fires go out. Needs a Witch with Magic 3.'}
);
SPELL_IDS.push(...Object.keys(B2_SPELLS)); Object.assign(SPELL_HOME, B2_SPELLS);

/* ---- who is on the field -------------------------------------------------------- */
const b2Has = spec => squadUnits().some(u => u.spec === spec);
const b2Best = (spec, min) => squadUnits().find(u => u.spec === spec && (u.s ? u.s.magic : 0) >= (min || 0)) || null;
const b2Mage = min => b2Best('MAGE', min), b2Cleric = min => b2Best('CLERIC', min), b2Witch = min => b2Best('WITCH', min);
const b2Half = u => u.con <= u.maxCon / 2;
const b2Slip = () => !!(G && G.mod && G.mod.slipline && b2Has('SCOUNDREL'));
const b2St = () => G.b2 || (G.b2 = {cd:{}, wall:null, decoy:null, veilUntil:0, rainUntil:0, silenceUntil:0, nextAssist:240, nextWall:30, nextDecoy:30, nextVeil:30, nextRain:30, nextOmen:200, defiantWard:false});
const b2Ready = k => (b2St().cd[k] || 0) <= G.frame;
const b2Set = (k, frames) => { b2St().cd[k] = G.frame + frames; };
const b2Pop = (x, y, t, c) => { const n = (G._b2pf !== undefined && G.frame - G._b2pf < 20) ? Math.min(4, (G._b2pn || 0) + 1) : 0; G._b2pn = n; G._b2pf = G.frame; pop(x, y - 46 - n * 14, t, c || '#ffe9a8'); };   // casts on the same beat stack instead of overlapping
const b2Caster = e => { const B = BESTIARY[e.k]; return B.arch === 'caster' || !!(B.spells && B.spells.length); };
function b2Seg(px, py, w){      // distance from a point to the wall segment
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l2 = dx * dx + dy * dy || 1;
  let t = ((px - w.x1) * dx + (py - w.y1) * dy) / l2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (w.x1 + dx * t), py - (w.y1 + dy * t));
}

/* ---- the contract starts and every frame ---------------------------------------------- */
{ const f = startDeployment;
  startDeployment = function(c, ids){ const r = f(c, ids); try { if (G) G.b2 = null; } catch (e) {} return r; };
}
{ const f = attackDie;       // remember how the last die landed (for Disarm, Improved Charge)
  attackDie = function(skill, ac, l){ const r = f(skill, ac, l); if (G) G._out = r.out; return r; };
}
{ const f = update;
  update = function(){
    f();
    if (!G || G.over || G.paused || !G.leader || !G.leader.p) return;
    try { b2Tick(); } catch (e) { if (!G._b2bErr){ G._b2bErr = 1; console.log('build2b error', e && e.message); } }
  };
}
function b2Tick(){
  const m = G.mod, s = b2St(), f = G.frame, L = G.leader;
  const units = squadUnits(); if (!units.length) return;
  for (const u of units) if (u.assistT > 0) u.assistT--;
  if (m.omen) for (const e of G.enemies) if (e.omenT > 0) e.omenT--;
  // Assist Allies: the Folk Hero gives up a shot and lifts the Squad Mate fighting hardest
  if (m.assist && f >= s.nextAssist){
    const fh = units.find(u => u.spec === 'FOLK_HERO');
    if (!fh) s.nextAssist = f + 120;
    else {
      let best = null, bn = 0;
      for (const u of units){ if (u === fh) continue; let n = 0; for (const e of G.enemies) if (!e.dead && !e.dormant && dist(e, u) < 100) n++; if (n > bn){ bn = n; best = u; } }
      if (best){ best.assistT = T2B.assistSec; fh.timer = (fh.timer || 0) + T2B.assistLoss; s.nextAssist = f + T2B.assistEvery; b2Pop(best.x, best.y, 'ASSISTED: +1 STEP', '#9fd8a0'); G.fx.push({beam:true, x:fh.x, y:fh.y - 8, tx:best.x, ty:best.y - 8, life:12, c:'#9fd8a0'}); }
      else s.nextAssist = f + 60;
    }
  }
  // Defiant Stand: the one Ward Token
  if (m.defiant && !s.defiantWard){
    const u = units.find(x => x.spec === 'FOLK_HERO' && b2Half(x) && (x === L || x.inF));
    if (u){ s.defiantWard = true; addWard(1); b2Pop(u.x, u.y, 'DEFIANT STAND: +1 WARD', '#ffd860'); }
  }
  // Conjure Stone Wall (Prep spell, recast every minute)
  if (m.stonewall && f >= s.nextWall && b2Mage(2)){
    const r = Math.min(2, m.stonewall), a = G.facing || 0, cx = L.x + Math.cos(a) * 70, cy = L.y + Math.sin(a) * 70, px = -Math.sin(a) * T2B.wallHalf, py = Math.cos(a) * T2B.wallHalf;
    s.wall = {x1:cx - px, y1:cy - py, x2:cx + px, y2:cy + py, until:f + T2B.wallLife[r - 1], born:f}; s.nextWall = f + T2B.wallEvery[r - 1];
    b2Pop(cx, cy, 'CONJURE STONE WALL', '#c8c0b0'); SFX.play('bash');
  }
  if (s.wall){
    if (f > s.wall.until) s.wall = null;
    else {
      for (const sh of G.eshots) if (!sh.at && !sh.walled && b2Seg(sh.x, sh.y, s.wall) < 11){ sh.life = 0; G.fx.push({blast:true, x:sh.x, y:sh.y, r:0, max:16, life:8, c:'#c8c0b0'}); }
      if (f % 30 === 0) for (const e of G.enemies) if (!e.dead && !e.dormant && BESTIARY[e.k].arch !== 'fixed' && b2Seg(e.x, e.y, s.wall) < 30) e.slow = Math.max(e.slow || 0, 50);
    }
  }
  // Illusory Decoy (Prep spell, recast every minute)
  if (m.decoy && f >= s.nextDecoy && b2Mage(3)){
    const a = G.facing || 0; s.decoy = {x:L.x + Math.cos(a) * T2B.decoyAhead, y:L.y + Math.sin(a) * T2B.decoyAhead, until:f + T2B.decoySec, born:f}; s.nextDecoy = f + T2B.decoyEvery;
    b2Pop(s.decoy.x, s.decoy.y, 'ILLUSORY DECOY', '#9fd0ff'); SFX.play('heal');
  }
  if (s.decoy){
    const d = s.decoy;
    if (f > d.until) s.decoy = null;
    else {
      for (const sh of G.eshots){
        if (sh.at) continue;
        if (!sh.dcDone){ sh.dcDone = true; const sp = Math.hypot(sh.vx, sh.vy) || 5, a = Math.atan2(d.y - sh.y, d.x - sh.x); sh.vx = Math.cos(a) * sp; sh.vy = Math.sin(a) * sp; sh.decoyed = true; }
        if (sh.decoyed && dist(sh, d) < 14){ sh.life = 0; G.fx.push({blast:true, x:d.x, y:d.y, r:0, max:20, life:8, c:'#9fd0ff'}); }
      }
      for (const h of G.hazards) if (!h.dcDone){ h.dcDone = true; if (h.kind === 'fireball' || h.kind === 'sharper' || h.kind === 'breath'){ h.x = d.x + rnd(-8, 8); h.y = d.y + rnd(-8, 8); } }
    }
  }
  // Veil of Shadows and Rain Dance (Prep rituals, recast every minute)
  if (m.veil && f >= s.nextVeil && b2Has('WITCH')){ s.veilUntil = f + T2B.veilSec; s.nextVeil = f + T2B.veilEvery; b2Pop(L.x, L.y, 'VEIL OF SHADOWS', '#9a9ac8'); G.fx.push({ring:true, x:L.x, y:L.y, r:G.mod.radius, life:24, c:'#8a8ab8'}); }
  if (m.raindance && f >= s.nextRain && b2Witch(3)){ s.rainUntil = f + T2B.rainSec; s.nextRain = f + T2B.rainEvery; b2Pop(L.x, L.y, 'RAIN DANCE', '#7fb8e8'); G.fx.push({ring:true, x:L.x, y:L.y, r:G.mod.radius * 1.4, life:30, c:'#7fb8e8'}); }
  if (s.rainUntil > f && f % 30 === 0 && G.fires && G.fires.length) G.fires.length = 0;
  // Earthquake Tremor (Once per Scenario spell)
  if (m.tremor && b2Ready('tremor') && b2Mage(4)){
    const c = crowd(8 * HEX_PX);
    if (c){
      const r = Math.min(2, m.tremor), hit = G.enemies.filter(e => !e.dead && !e.dormant && !BESTIARY[e.k].boss && dist(e, c) < T2B.tremorRadius), movers = hit.filter(e => BESTIARY[e.k].arch !== 'fixed').sort((a, b) => dist(a, c) - dist(b, c)).slice(0, T2B.tremorMax[r - 1]);
      if (movers.length >= 3){
        b2Set('tremor', T2B.tremorCd[r - 1]); G.fx.push({blast:true, x:c.x, y:c.y, r:0, max:T2B.tremorRadius, life:26, c:'#8a6a4a'}); G.shake = Math.max(G.shake || 0, 14); SFX.play('bash');
        for (const e of movers){ e.stagger = Math.max(e.stagger || 0, T2B.tremorStagger); e.slow = Math.max(e.slow || 0, T2B.tremorSlow); }
        for (const e of hit) if (BESTIARY[e.k].arch === 'fixed') hurtEnemy(e, 2);
        b2Pop(c.x, c.y, 'EARTHQUAKE TREMOR (' + movers.length + ')', '#c8a878');
      }
    }
  }
  // Flame Strike and Silence the Unholy (Favour)
  const cl = (m.flamestrike || m.silence) ? b2Cleric(3) : null;
  if (cl && m.flamestrike && G.favour >= T2B.flameFavour && b2Ready('flame')){
    const c = crowd(360);
    if (c && G.enemies.filter(e => !e.dead && !e.dormant && dist(e, c) < T2B.flameRadius).length >= 4){
      const r = Math.min(2, m.flamestrike); G.favour -= T2B.flameFavour; b2Set('flame', T2B.flameCd[r - 1]);   // an auto-cast: not fire for Jasena's tenet (GD ruling E3, 17 Nov)
      G.fx.push({blast:true, x:c.x, y:c.y, r:0, max:T2B.flameRadius + 8, life:26, c:'#ffe680'}); G.shake = Math.max(G.shake || 0, 10); SFX.play('blast');
      for (const e of G.enemies) if (!e.dead && !e.dormant && dist(e, c) < T2B.flameRadius) strike(e, cl.s.magic + 1 + (r >= 2 ? 1 : 0), 4, {from:cl});
      b2Pop(c.x, c.y, 'FLAME STRIKE', '#ffe680');
    }
  }
  if (cl && m.silence && G.favour >= T2B.silenceFavour && s.silenceUntil <= f){
    if (G.enemies.some(e => !e.dead && !e.dormant && b2Caster(e) && dist(e, cl) < G.mod.radius * 2)){
      G.favour -= T2B.silenceFavour; s.silenceUntil = f + T2B.silenceSec; s.silenceAt = cl;
      G.fx.push({ring:true, x:cl.x, y:cl.y, r:G.mod.radius, life:30, c:'#c8c8e8'}); b2Pop(cl.x, cl.y, 'SILENCE THE UNHOLY', '#c8c8e8');
    }
  }
  if (s.silenceUntil > f && f % 45 === 0){ const c = b2Cleric(3); if (c) G.fx.push({ring:true, x:c.x, y:c.y, r:G.mod.radius, life:24, c:'#c8c8e8'}); }
  // Bleeding Omen
  if (m.omen && f >= s.nextOmen && b2Has('WITCH')){
    const r = Math.min(2, m.omen);
    let best = null, bs = -1;
    for (const e of G.enemies){ if (e.dead || e.dormant || dist(e, L) > 6 * HEX_PX) continue; const B = BESTIARY[e.k], sc = (B.boss ? 1000 : 0) + e.shift * 60 + e.con; if (sc > bs){ bs = sc; best = e; } }
    if (best){
      s.nextOmen = f + T2B.omenEvery[r - 1]; let n = 0;
      const near = G.enemies.filter(e => !e.dead && !e.dormant && dist(e, best) < 90).sort((a, b) => dist(a, best) - dist(b, best));
      for (const e of near){ if (n >= T2B.omenMax[r - 1]) break; e.omenT = T2B.omenSec; n++; }
      G.fx.push({ring:true, x:best.x, y:best.y, r:90, life:18, c:'#b02a2a'}); b2Pop(best.x, best.y, 'BLEEDING OMEN (' + n + ')', '#e06a6a');
    } else s.nextOmen = f + 60;
  }
}

/* ---- armour class: Defiant Stand out of formation, the Stone Wall as cover ------------------ */
function b2ACBonus(v){
  if (!G || !G.mod) return 0;
  let n = 0;
  if (G.mod.defiant && v.spec === 'FOLK_HERO' && v !== G.leader && !v.inF && b2Half(v)) n++;
  return n;
}
{ const f = extraCover;
  extraCover = function(u){
    if (f(u)) return true;
    const s = G && G.b2; return !!(s && s.wall && G.frame <= s.wall.until && b2Seg(u.x, u.y, s.wall) < 36);
  };
}
{ const f = stepBonus;        // Defiant Stand and Assist Allies
  stepBonus = function(u, isMelee){
    let s = f(u, isMelee);
    if (G && G.mod){
      if (u.assistT > 0) s += 1;
      if (isMelee && G.mod.defiant && u.spec === 'FOLK_HERO' && b2Half(u)) s += 1;
    }
    return s;
  };
}
{ const f = dropMate;         // Last Rites
  dropMate = function(m, n){
    const was = m.state; f(m, n);
    if (!G || !G.mod || !G.mod.lastrites || was !== 'up' || m.state !== 'bleeding') return;
    const cl = squadUnits().find(u => u.spec === 'CLERIC'); if (!cl || dist(m, cl) > G.mod.radius || !b2Ready('lastrites')) return;
    b2Set('lastrites', T2B.lastRitesCd); G.blessT = Math.max(G.blessT || 0, T2B.lastRitesSec); b2Pop(cl.x, cl.y, 'LAST RITES: +1 STEP', '#ffe680'); G.fx.push({ring:true, x:cl.x, y:cl.y, r:G.mod.radius, life:22, c:'#ffe680'});
  };
}

/* ---- hitting: Disarm, Improved Charge, Censure, Sanctified Blade, Bleeding Omen -------------- */
{ const f = strike;
  strike = function(e, skill, baseDmg, o = {}){
    if (!G || !G.mod || !e || e.dead || !o) return f(e, skill, baseDmg, o);
    const from = o.from, sp = from ? from.spec : null, m = G.mod;
    if (o.piercing) return f(e, skill, baseDmg, o);
    let flat = 0, crush = 0, sanct = false;
    if (sp === 'CLERIC'){
      if (m.censure && UNHOLY_B2.includes(e.k)) flat += 2;
      if (m.sanctified && !(from._sanct > G.frame)){ crush += 3; sanct = true; }
    }
    if (e.omenT > 0) crush += 1;
    if (flat || crush) o = Object.assign({}, o, {flat:(o.flat || 0) + flat, crush:(o.crush || 0) + crush});
    const c0 = e.con; G._out = null;
    f(e, skill, baseDmg, o);
    if (sanct && (e.dead || e.con < c0)){ from._sanct = G.frame + T2B.sanctCd; b2Pop(from.x, from.y, 'SANCTIFIED BLADE', '#ffe680'); }
    if (sp === 'SOLDIER' && !e.dead){
      if (m.disarm && G._out === 'crit'){ e.weak = Math.max(e.weak || 0, T2B.discSec); b2Pop(e.x, e.y + 10, 'DISARMED', '#e0c070'); }
      if (m.impcharge && G.chargeT > 0 && (G._out === 'solid' || G._out === 'crit') && !(e.icT > G.frame)){
        e.icT = G.frame + 240; const was = e.shakenT > 0 || e.broken; enemyMorale(e, true);
        if (!was && (e.shakenT > 0 || e.broken)){ e.stagger = Math.max(e.stagger || 0, T2B.chargeStagger); e.slow = Math.max(e.slow || 0, T2B.chargeSlow); b2Pop(e.x, e.y + 10, 'STUMBLES', '#e0c070'); }
      }
    }
  };
}

/* ---- enemy fire: Veil, Silence, Nobody Saw Me, Counterspell Reflex --------------------------- */
{ const f = enemyFire;
  enemyFire = function(e, tgt){
    if (!G || !G.mod || !e) return f(e, tgt);
    const s = b2St(), B = BESTIARY[e.k], fr = G.frame, ranged = B.arch === 'skirm', caster = b2Caster(e);
    if (ranged && s.veilUntil > fr){ e.atkT = 14; if (fr % 60 === 0) b2Pop(e.x, e.y + 30, 'VEILED', '#9a9ac8'); return; }
    if (caster && s.silenceUntil > fr){ const c = b2Cleric(3); if (c && dist(e, c) < G.mod.radius){ e.atkT = 14; b2Pop(e.x, e.y + 20, 'SILENCED', '#c8c8e8'); return; } }
    if ((ranged || caster) && G.mod.nobody && b2Ready('nobody') && b2Has('SCOUNDREL')){
      b2Set('nobody', T2B.nobodyCd); e.atkT = 14; e.stagger = Math.max(e.stagger || 0, T2B.nobodyStun); b2Pop(e.x, e.y + 20, 'NOBODY SAW ME', '#b0b0b0'); return;
    }
    const n0 = G.eshots.length, h0 = G.hazards.length, w0 = G.witherT || 0, b0 = G.baneT || 0;
    f(e, tgt);
    if (caster && G.mod.counterspell && b2Ready('counter')){
      const mg = b2Mage(0);
      if (mg && dist(e, mg) <= 6 * HEX_PX){
        b2Set('counter', T2B.counterCd);
        for (let i = n0; i < G.eshots.length; i++) G.eshots[i].skill = Math.max(0, G.eshots[i].skill - 1);
        for (let i = h0; i < G.hazards.length; i++) if (G.hazards[i].skill !== undefined) G.hazards[i].skill = Math.max(0, G.hazards[i].skill - 1);
        if ((G.witherT || 0) > w0) G.witherT = Math.round(G.witherT / 2);
        if ((G.baneT || 0) > b0) G.baneT = Math.round(G.baneT / 2);
        b2Pop(mg.x, mg.y, 'COUNTERSPELL REFLEX', '#9fd0ff');
      }
    }
  };
}

/* ---- rain: enemy bows reach less, and so do yours ------------------------------------------------ */
{ const f = updateEnemies;
  updateEnemies = function(sw){
    const s = G && G.b2;
    if (!s || s.rainUntil <= G.frame) return f(sw);
    const saved = []; for (const k in BESTIARY){ const B = BESTIARY[k]; if (B.arch === 'skirm' && B.rng){ saved.push([B, B.rng]); B.rng = Math.max(120, B.rng - 2 * HEX_PX); } }
    try { return f(sw); } finally { for (const [B, r] of saved) B.rng = r; }
  };
}
{ const f = unitAttack;
  unitAttack = function(u, isL, sw){
    const s = G && G.b2;
    if (s && s.rainUntil > G.frame && G.ranged && G.ranged.range > 0){
      const r = G.ranged; G.ranged = Object.assign({}, r, {range:Math.max(120, r.range - 2 * HEX_PX)});
      try { return f(u, isL, sw); } finally { G.ranged = r; }
    }
    return f(u, isL, sw);
  };
}

/* ---- drawing: the wall and the decoy ------------------------------------------------------------- */
{ const f = drawTraps;
  drawTraps = function(onScreen){
    f(onScreen);
    const s = G && G.b2; if (!s) return;
    if (s.wall && G.frame <= s.wall.until){
      const w = s.wall, k = Math.min(1, (G.frame - w.born) / 20), left = Math.min(1, (w.until - G.frame) / 40), len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1), n = Math.max(1, Math.round(len / 24));
      ctx.save(); ctx.globalAlpha = k * left; ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(w.x1 + 3, w.y1 + 5); ctx.lineTo(w.x2 + 3, w.y2 + 5); ctx.stroke();
      ctx.strokeStyle = '#2e2a24'; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
      ctx.strokeStyle = '#c4b896'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
      ctx.strokeStyle = '#7a6e56'; ctx.lineWidth = 1.5; for (let i = 1; i < n; i++){ const t = i / n, x = w.x1 + (w.x2 - w.x1) * t, y = w.y1 + (w.y2 - w.y1) * t, nx = -(w.y2 - w.y1) / len * 6, ny = (w.x2 - w.x1) / len * 6; ctx.beginPath(); ctx.moveTo(x - nx, y - ny); ctx.lineTo(x + nx, y + ny); ctx.stroke(); }
      ctx.restore();
    }
    if (s.decoy && G.frame <= s.decoy.until){
      const d = s.decoy, k = Math.min(1, (G.frame - d.born) / 15), left = Math.min(1, (d.until - G.frame) / 30), ph = G.frame / 14;
      ctx.save(); ctx.globalAlpha = 0.5 * k * left;
      for (let i = 0; i < 4; i++){ const a = i * 1.57 + 0.4, x = d.x + Math.cos(a) * 26, y = d.y + Math.sin(a) * 16 + Math.sin(ph + i) * 2; ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.ellipse(x, y + 10, 9, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8e4ff'; ctx.fillRect(x - 4, y - 8, 8, 16); ctx.beginPath(); ctx.arc(x, y - 12, 4.5, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 0.6 * k * left; ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(d.x, d.y, 42, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (s.rainUntil > G.frame){
      ctx.save(); ctx.strokeStyle = 'rgba(160,200,240,.5)'; ctx.lineWidth = 1; const cx = G.leader.x, cy = G.leader.y;
      for (let i = 0; i < 26; i++){ const x = cx - 300 + ((i * 97 + G.frame * 5) % 600), y = cy - 220 + ((i * 53 + G.frame * 11) % 440); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); ctx.stroke(); }
      ctx.restore();
    }
  };
}

/* ---- the Manual ------------------------------------------------------------------------------------- */
function b2bManualHTML(){
  const by = {}; for (const c of CARDS) if (B2_ALL.includes(c.id)) (by[c.spec] = by[c.spec] || []).push(c);
  return `<p class="idx39"><b>New abilities, prayers, spells and rituals.</b> The tabletop's "once per battle" is a cooldown here (20 to 30 seconds), "one round" is 6 seconds, and Preparation spells and rituals are cast at the start and again every 60 seconds, because a contract lasts minutes, not rounds. Spells and prayers need the Magic shown on the card, for a Leader as well as a Squad Mate.</p>` +
    Object.keys(by).map(sp => `<p class="idx39"><b>${SPECS[sp].name}.</b> ` + by[sp].map(c => `<i>${esc(c.name)}${c.minMagic ? ' (Magic ' + c.minMagic + ')' : ''}:</i> ${esc(c.text(1))}`).join(' ') + '</p>').join('');
}
const B2_ALL = ['disarm', 'impcharge', 'assist', 'defiant', 'slipline', 'nobody', 'censure', 'sanctified', 'lastrites', 'flamestrike', 'silence', 'counterspell', 'stonewall', 'decoy', 'tremor', 'omen', 'veil', 'raindance'];
{ const f = openManual;
  openManual = function(){ f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx39')) return; lg.insertAdjacentHTML('beforeend', b2bManualHTML()); };
}
/* ===== END INDEX 39 ======================================================= */



window.ABIL2B_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svG = typeof G !== 'undefined' ? G : undefined;
    try {
      G = {frame: 100, mod: {slipline: false}, leader: {x: 0, y: 0, spec: 'SOLDIER', dead: false, s: {magic: 0}}, squad: []};
      const st = b2St();
      ok('b2St initializes G.b2 state object', !!st && typeof st.cd === 'object');
      b2Set('wall', 60);
      ok('b2Set schedules cooldown relative to G.frame', st.cd.wall === 160);
      const d = b2Seg(10, 5, {x1: 0, y1: 0, x2: 20, y2: 0});
      ok('b2Seg computes perpendicular distance to wall segment', Math.abs(d - 5) < 0.01);
      ok('b2bManualHTML returns non-empty markup', typeof b2bManualHTML() === 'string' && b2bManualHTML().length > 20);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { G = svG; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
