/* js/combat/capstones.js (INT-1 step 2, 2026-11-16): INDEX 36 (capstones), 37 (build 2A), 38 (specialty balance).
   Cut unchanged from the inline script in index.html (old lines 15313 to 16199). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 36 - THE CAPSTONES, AND A LEADER WHO CAN STUDY MAGIC
   The thirty Level 1 to 11 rows that were only text ("tabletop only for now")
   now do something. Each follows the Players Manual (Table 2.14 and the Level
   rows) and is turned from a slow, planned table into real time:
     - "once per battle" becomes a cooldown (20 to 120 seconds), because a
       contract lasts 6 to 10 minutes and a tabletop battle lasts a handful
       of rounds
     - costs that were "per round" are paid once per use, and never take a
       model below 2 Condition
     - active capstones fold into the ability the Specialty already has
       (Command, Called Shot, Cure Wounds, Lightning Bolt, Dark Illusion), so
       there are no new keys; the rest are automatic
     - the effect always works through die steps, Wards, the Shield Pool,
       Condition or a status the game already has
   A capstone is live while the Leader, or a Squad Mate of that Specialty who
   is still on their feet, is at or above its level (a Squad Mate's level is
   1 plus their Advancements). It does not stack with itself.
   LEADERS STUDY MAGIC. A Mage, Cleric or Witch Leader can raise Magic at the
   Mage Tower, Chapel or Alchemy Lab on the Roster screen, once a contract, at
   the same price as a Squad Mate. Index 35 stopped promotion throwing Magic
   away; this lets a Leader grow it.
   Soft Spot (Scoundrel level 1) was already live. window.CAPS_OFF = true turns
   every capstone off, for comparing balance.
   To roll back, delete from this comment to END INDEX 36 and undo the small
   patches marked "Index 36" elsewhere in the file.
============================================================================ */
const CAPS = {
  unbreakable:['SOLDIER', 10, 'Unbreakable Line'],  bastion:['SOLDIER', 11, 'Living Bastion'],
  inspire:['FOLK_HERO', 10, 'Legendary Inspiration'], marches:['FOLK_HERO', 11, 'Hero of the Marches'],
  evade:['SCOUNDREL', 3, 'Evade'], assassin:['SCOUNDREL', 9, 'Assassinate'], shadows:['SCOUNDREL', 10, 'Master of Shadows'], phantom:['SCOUNDREL', 11, 'Phantom Blade'],
  consecrate:['CLERIC', 3, 'Consecrated Ground'], intervene:['CLERIC', 5, 'Divine Intervention'], prayers:['CLERIC', 7, 'Improved Prayers'],
  grace:['CLERIC', 9, "Avatar's Grace"], miracle:['CLERIC', 10, 'Miracle Worker'], voice:['CLERIC', 11, 'Voice of the God'],
  counter:['MAGE', 4, 'Counter-Ward'], twin:['MAGE', 5, 'Twin Cantrip'], casting:['MAGE', 7, 'Improved Casting'], overchannel:['MAGE', 8, 'Overchannel'],
  arcanist:['MAGE', 9, 'High Arcanist'], sigil:['MAGE', 10, 'Archmage Sigil'], grimoire:['MAGE', 11, 'Living Grimoire'],
  brews:['WITCH', 2, 'Potent Brews'], fetish:['WITCH', 4, 'Deep Fetish'], curses:['WITCH', 5, 'Greater Curses'], hexes:['WITCH', 7, 'Improved Hexes'],
  bloodbrew:['WITCH', 8, 'Blood Brew'], dread:['WITCH', 9, 'Dread Sovereign'], unseen:['WITCH', 10, 'Master of the Unseen'], conduit:['WITCH', 11, 'Elder Conduit']
};
const CAP_TEXT = {
  unbreakable:'Once every 90 seconds, when the squad would be Broken it is only Shaken. Cost: the squad will not retreat for the next 45 seconds.',
  bastion:'While in a Shield Wall, Squad Mates outside the formation (within 1.5 Command Radii) can pass up to 2 damage a hit into the Shield Pool, and enemies are drawn to your Soldiers. Cost: the Soldier takes 1 Condition (never below 2), at most once every 12 seconds.',
  inspire:'With Command, once every 90 seconds: +1 step to every attack for 6 seconds and Shaken is lifted. Cost: 1 Luck.',
  marches:'Morale rolls shift up 1 step while the Hero stands. If a Hero Squad Mate goes down, the squad rolls Morale at once.',
  evade:'The Leader has +1 AC while no Squad Mate is within the Command Radius. (Squad Mates out of formation already do.)',
  assassin:"The Scoundrel's two highest faces both count as Natural Maximum.",
  shadows:'With Called Shot, once every 90 seconds: the squad slips out of sight for 4 seconds and enemy ranged attacks cannot find it. Cost: all Ward Tokens, and no Shield Wall for 3 seconds afterwards.',
  phantom:'Once every 30 seconds, a Solid Hit on an enemy Commander or Specialist becomes a Piercing Critical Hit.',
  consecrate:'For 45 seconds at the start, and for 20 seconds every 2.5 minutes after that, holy ground round the Leader: allies shift Morale up 1 step and undead and fiends attack 1 step lower. Cost: 1 Favour each time, and the later ones only while 2 Favour remain.',
  intervene:'When the Leader would fall or the squad would Break, they are saved: the Leader stands at 2 Condition, or the squad Steadies. Once a contract, and no more than once every 3 contracts. Cost: all remaining Favour.',
  prayers:'Cure Wounds heals 1 more.',
  grace:'With Cure Wounds, once every 90 seconds: for 6 seconds bleeding allies in the Command Radius are stabilised and the Leader cannot bleed out. Cost: 1 more Favour (2 in all).',
  miracle:'With Cure Wounds, once every 2 minutes, when two or more are hurt: everyone in the Command Radius heals 1 Condition and Shaken is lifted. Cost: Favour drops to 0, and no automatic healing for 6 seconds.',
  voice:"The first Cure Wounds each minute costs no Favour. If the Cleric has broken their god's tenet it fails, and all Favour is lost.",
  counter:'Once every 45 seconds, an enemy Bane or Wither curse on the squad is cancelled.',
  twin:'Magic Missile fires 1 extra dart.',
  casting:'Spells and Lightning Bolt hit 1 step easier.',
  overchannel:'Press Lightning Bolt while it recharges to cast it again at once, once every 60 seconds. Cost: 1 Condition (never below 2).',
  arcanist:'When the squad has no Wards and is in contact, the Mage casts 2 Wards, once every 60 seconds. Cost: 1 Condition.',
  sigil:'Every 30 seconds a Sigil is inscribed ahead of the squad (two at a time). The first enemies to step on one take a Piercing Skill 3 hit, up to 8 of them.',
  grimoire:'Once every 45 seconds, a Fireball is cast a second time. Cost: 1 Condition.',
  brews:'Opening a potion (Stormroot, Wishing Wafer, Poultice) also gives +1 Ward Token.',
  fetish:'Hexes are cast 25% more often.',
  curses:'A Hex also curses up to 3 more enemies within 80 px of its target, and Dark Illusion lasts 3 seconds longer.',
  hexes:'Hexes last 50% longer.',
  bloodbrew:'Potions also heal 1 Condition on whoever is most hurt, and Stormroot lasts 50% longer.',
  dread:'With Dark Illusion, once a minute: up to 12 enemies near the Leader are hexed and weakened (attacks 1 step lower) for 8 seconds. Cost: the Witch cannot hex for 7 seconds.',
  unseen:'Every 45 seconds, hidden Blip Tokens and traps within 420 px of the Leader are revealed.',
  conduit:"Once every 20 seconds, if the Witch's hex is still recharging, a Squad Mate at full Condition gives 1 Condition to recharge it at once."
};
const CAP_BY_NAME = {}; for (const k in CAPS) CAP_BY_NAME[CAPS[k][2]] = k;
const UNHOLY = ['levy', 'orsolt', 'cinder', 'devil'];
function capLabel(name){ const k = CAP_BY_NAME[name]; return k ? name + ': ' + CAP_TEXT[k].replace(/\.$/, '') : name; }   // the debrief adds its own full stop

/* ---- who has what ---------------------------------------------------------- */
const unitLv = u => u === G.leader ? (G.leader.p.level || 1) : 1 + ((u.p && u.p.adv) || 0);
function capUnitsRaw(spec, lv){
  const out = [], L = G.leader;
  if (L.spec === spec && !L.down && unitLv(L) >= lv) out.push(L);
  for (const m of G.squad) if (m.spec === spec && m.state === 'up' && unitLv(m) >= lv) out.push(m);
  return out;
}
function capAct(){
  if (!G || !G.leader || !G.leader.p) return {};
  const c = G._capC; if (c && c.f === G.frame) return c.a;
  const a = {};
  if (!window.CAPS_OFF && !(typeof isBrawl === 'function' && isBrawl())) for (const k in CAPS) a[k] = capUnitsRaw(CAPS[k][0], CAPS[k][1]);
  G._capC = {f:G.frame, a}; return a;
}
const capHas = k => { const a = capAct()[k]; return !!(a && a.length); };
const capUnit = k => (capAct()[k] || [])[0];
const capUnitHas = (u, k) => !window.CAPS_OFF && !!u && u.spec === CAPS[k][0] && unitLv(u) >= CAPS[k][1];
const capSt = () => G.cap || (G.cap = {cd:{}, sig:[], auraUntil:0, auraNext:0, bastionAt:0, noRetreat:0, noBrace:0, shadowUntil:0, graceUntil:0, unseenNext:0, sigilNext:0});
const capReady = k => (capSt().cd[k] || 0) <= G.frame;
const capSet = (k, sec) => { capSt().cd[k] = G.frame + Math.round(sec * 60); };
const capPop = (u, text, col) => pop(u.x, u.y - 56, text, col || '#ffe9a8');
function capPay(u, n){      // a cost no Ward or Shield can stop; never takes anyone below 2 Condition
  if (u === G.leader){ if (G.leader.con - n < 2) return false; G.leader.con -= n; G.leader.flash = 10; return true; }
  if (!u || u.con - n < 2) return false; u.con -= n; u.flash = 10; return true;
}
const capHurt = () => { const L = G.leader; let n = (!L.down && L.con < L.maxCon) ? 1 : 0; for (const m of G.squad) if (m.state === 'up' && m.con < m.maxCon) n++; return n; };

/* ---- the contract starts and every frame ----------------------------------- */
{ const f = startDeployment;
  startDeployment = function(c, ids){
    const r = f(c, ids);
    try {
      if (G){ G.cap = null; const s = capSt(); s.auraNext = 90; s.unseenNext = 150; s.sigilNext = 600;
        const names = Object.keys(CAPS).filter(k => capHas(k)).map(k => CAPS[k][2]);
        if (names.length) note('Capstones in play: ' + names.slice(0, 6).join(', ') + (names.length > 6 ? ' and ' + (names.length - 6) + ' more' : '') + '.'); }
    } catch (e) {}
    try { if (G && Object.keys(CAPS).some(k => capHas(k)) && CAP_HUD.some(k => capHas(k))) tip('capstone'); } catch (e) {}   // the Capstone tip (TIPS.capstone, below)
    return r;
  };
}
{ const f = update;
  update = function(){ f(); if (G && !G.over && !G.paused){ try { capTick(); } catch (e) { if (!G._capErr){ G._capErr = 1; console.log('capstone error', e && e.message); } } } };
}
function capTick(){
  if (!G.leader || !G.leader.p || window.CAPS_OFF) return;
  const L = G.leader, s = capSt(), f = G.frame, A = capAct(); if (!Object.values(A).some(x => x.length)) return;
  // Consecrated Ground: holy ground round the Leader, 30 s at the start and every 2 minutes (1 Favour)
  if (capHas('consecrate') && f >= s.auraNext && !L.down && (s.auraDone ? G.favour >= 2 : G.favour >= 1)){
    G.favour--; s.auraUntil = f + (s.auraDone ? 1200 : 2700); s.auraNext = f + 9000; s.auraDone = true; capPop(L, 'CONSECRATED GROUND', '#ffe680'); SFX.play('heal');
  }
  if (s.auraUntil > f && capHas('consecrate')){
    if (f % 40 === 0) G.fx.push({ring:true, x:L.x, y:L.y, r:G.mod.radius, life:24, c:'#ffe680'});
    if (f % 10 === 0) for (const e of G.enemies) if (!e.dead && !e.dormant && UNHOLY.includes(e.k) && dist(e, L) < G.mod.radius) e.weak = Math.max(e.weak || 0, 30);
  }
  // Counter-Ward: a curse on the squad is cancelled
  if ((G.baneT > 0 || G.witherT > 0) && capHas('counter') && capReady('counter')){ G.baneT = 0; G.witherT = 0; capSet('counter', 45); capPop(capUnit('counter'), 'COUNTER-WARD', '#9fd0ff'); }
  // High Arcanist: re-cast the opening Wards when the squad has none and is in contact
  if (G.wards === 0 && capHas('arcanist') && capReady('arcanist') && (f - G.lastContact) < 120){
    const u = capUnit('arcanist'); if (capPay(u, 1)){ addWard(2); capSet('arcanist', 60); capPop(u, 'HIGH ARCANIST: +2 WARDS', '#87ceeb'); G.fx.push({ring:true, x:u.x, y:u.y, r:G.mod.radius, life:20, c:'#87ceeb'}); }
  }
  // Archmage Sigil: a rune ahead of the squad that the first enemies to step on take a Piercing hit
  if (capHas('sigil')){
    if (f >= s.sigilNext && s.sig.length < 2){
      const a = G.facing || 0, nx = L.x + Math.cos(a) * 110, ny = L.y + Math.sin(a) * 110;
      if (!s.sig.some(g => Math.hypot(g.x - nx, g.y - ny) < 90)){ s.sigilNext = f + 1800; s.sig.push({x:nx, y:ny, r:62, born:f, life:5400}); capPop(capUnit('sigil'), 'SIGIL INSCRIBED', '#c8a0ff'); }
    }
  }
  if (s.sig.length){
    for (const g of s.sig){
      g.life--;
      const hit = G.enemies.filter(e => !e.dead && !e.dormant && dist(e, g) < g.r);
      if (hit.length){
        g.life = 0; G.fx.push({blast:true, x:g.x, y:g.y, r:0, max:g.r + 10, life:22, c:'#b48cff'}); G.shake = Math.max(G.shake, 8); SFX.play('blast');
        const near = G.enemies.filter(e => !e.dead && !e.dormant && dist(e, g) < g.r + 12).sort((p, q) => dist(p, g) - dist(q, g)).slice(0, 8);
        for (const e of near) hurtEnemy(e, damageRoll(3, 0));
      }
    }
    s.sig = s.sig.filter(g => g.life > 0);
  }
  // Master of Shadows: ranged attacks cannot find the squad
  if (s.shadowUntil > f){ if (G.eshots.length) G.eshots = G.eshots.filter(x => x.at); if (f % 30 === 0) G.fx.push({ring:true, x:L.x, y:L.y, r:G.mod.radius, life:18, c:'#6a6a8a'}); }
  // Avatar's Grace: nobody bleeds out
  if (s.graceUntil > f){
    for (const m of G.squad) if (m.state === 'bleeding' && dist(m, L) < G.mod.radius * 1.2){ m.state = 'stable'; pop(m.x, m.y - 18, 'GRACE', '#ffe680'); }
    if (L.down) L.bleedT = Math.min(L.bleedT || 0, 470);
  }
  // Master of the Unseen: blips and traps come into view
  if (capHas('unseen') && f >= s.unseenNext){
    s.unseenNext = f + 2700; let n = 0;
    for (const b of G.blips || []) if (!b.known && dist(b, L) < 420){ b.known = d6(); n++; }
    for (const t of G.traps || []) if (t.armed && !t.seen && dist(t, L) < 420){ t.seen = true; n++; }
    if (n) capPop(capUnit('unseen'), 'THE UNSEEN REVEALED (' + n + ')', '#d0a8ff');
  }
  // Elder Conduit: a mate at full Condition gives 1 to recharge the Witch's hex
  if (capHas('conduit') && capReady('conduit')){
    const w = capUnit('conduit');
    if (w.passT > 90 && liveFoes().some(e => dist(e, w) < 260)){
      const d = G.squad.find(m => m.state === 'up' && m.inF && m.con >= m.maxCon && m.maxCon >= 3);
      if (d){ d.con--; d.flash = 10; w.passT = 0; capSet('conduit', 20); capPop(w, 'ELDER CONDUIT', '#d0a8ff'); G.fx.push({beam:true, x:d.x, y:d.y, tx:w.x, ty:w.y, life:14, c:'#b48cff'}); }
    }
  }
}

/* ---- Soldier -------------------------------------------------------------- */
{ const f = squadMorale;    // Unbreakable Line, Divine Intervention (a Break), Hero of the Marches, Consecrated Ground
  squadMorale = function(why, step = 0){
    if (!G || window.CAPS_OFF) return f(why, step);
    let st = step + (capHas('marches') ? 1 : 0) + (capSt().auraUntil > G.frame && capHas('consecrate') ? 1 : 0);
    const rolling = !(G.moraleCd > 0), b0 = G.broken, sh0 = G.shaken;
    f(why, st);
    if (!rolling || !(G.broken > b0)) return;
    const L = G.leader;
    if (capHas('unbreakable') && capReady('unbreakable')){
      G.broken = b0; G.shaken = Math.max(sh0, 300); capSet('unbreakable', 90); capSt().noRetreat = G.frame + 2700;
      capPop(capUnit('unbreakable'), 'UNBREAKABLE LINE: SHAKEN, NOT BROKEN', '#d4af37'); note('Unbreakable Line holds the squad. It will not retreat for 45 seconds.'); return;
    }
    if (capCanIntervene()){ G.broken = b0; G.shaken = sh0; capIntervene(capIntervener(), 'The squad Steadies.'); }
  };
}
{ const f = askWithdraw;
  askWithdraw = function(){
    if (G && G.cap && G.cap.noRetreat > G.frame){ SFX.play('nope'); note('Unbreakable Line: the squad will not retreat for another ' + Math.ceil((G.cap.noRetreat - G.frame) / 60) + ' seconds.'); return; }
    return f();
  };
}
{ const f = hurtSquad;      // Living Bastion
  hurtSquad = function(n, victim, piercing){
    if (G && !window.CAPS_OFF && !piercing && G.formation === 'SHIELD' && victim && victim !== G.leader && !victim.inF && G.shieldPool > 0 && capHas('bastion') && dist(victim, G.leader) <= G.mod.radius * 1.5){
      const s = capSt(), sol = capUnit('bastion'); let ok = true;
      if (s.bastionAt <= G.frame){ ok = capPay(sol, 1); if (ok) s.bastionAt = G.frame + 720; }
      if (ok){ const t = Math.min(2, n, G.shieldPool); if (t > 0){ G.shieldPool -= t; n -= t; G.absorbFx = 14; G.absorbKind = 'shieldPool'; capPop(victim, 'BASTION', '#d4af37'); if (n <= 0) return; } }
    }
    return f(n, victim, piercing);
  };
}
{ const f = updateEnemies;  // Living Bastion also draws enemies to the Soldiers
  updateEnemies = function(shieldWall){
    if (!G || window.CAPS_OFF || !shieldWall || !capHas('bastion')) return f(shieldWall);
    const t = G.mod.taunt; G.mod.taunt = Math.max(t || 0, 1);
    try { return f(shieldWall); } finally { G.mod.taunt = t; }
  };
}
{ const f = canBrace; canBrace = function(){ return f() && !(G && G.cap && G.cap.noBrace > G.frame); }; }

/* ---- Folk Hero ------------------------------------------------------------- */
{ const f = ABIL_FX.FOLK_HERO;
  ABIL_FX.FOLK_HERO = function(u){
    f(u);
    if (G && capUnitHas(u, 'inspire') && capReady('inspire') && G.luck >= 1){
      G.luck--; G.blessT = Math.max(G.blessT || 0, 360); G.shaken = 0; capSet('inspire', 90);
      capPop(u, 'LEGENDARY INSPIRATION (-1 LUCK)', '#ffd860'); G.fx.push({ring:true, x:u.x, y:u.y, r:G.mod.radius, life:24, c:'#ffd860'});
    }
  };
}
{ const f = dropMate;        // Hero of the Marches: a Hero going down shakes everyone
  dropMate = function(m, n){
    const was = m.state; f(m, n);
    if (G && capUnitHas(m, 'marches') && was === 'up' && m.state === 'bleeding'){ G.moraleCd = 0; pop(m.x, m.y - 40, 'THE HERO IS DOWN', '#ff8a7a'); squadMorale('The Hero is down'); }
  };
}

/* ---- Scoundrel ------------------------------------------------------------- */
{ const f = enemyHitsUnit;   // Evade for a Leader on their own
  enemyHitsUnit = function(v, skill, dmgDie, opts){
    if (G && v === G.leader && capUnitHas(v, 'evade') && !G.squad.some(m => m.state === 'up' && dist(m, v) < G.mod.radius)){
      const ac = G.armour.ac; G.armour.ac = ac + 1;
      try { return f(v, skill, dmgDie, opts); } finally { G.armour.ac = ac; }
    }
    return f(v, skill, dmgDie, opts);
  };
}
{ const f = attackDie;
  attackDie = function(skill, ac, l){
    const r = f(skill, ac, l);
    if (!G || (!G._asn && !G._ph)) return r;
    let o = r;
    if (G._asn && !r.natMax && !r.natMin && r.face === clampSkill(skill) + 4) o = {face:r.face, natMin:false, natMax:true, out:r.face >= ac ? 'crit' : 'graze'};
    if (G._ph && o.out === 'solid'){ o = Object.assign({}, o, {out:'crit'}); G._phHit = true; }
    return o;
  };
}
{ const f = ABIL_FX.SCOUNDREL;   // Master of Shadows rides on Called Shot
  ABIL_FX.SCOUNDREL = function(u){
    f(u);
    if (G && capUnitHas(u, 'shadows') && capReady('shadows')){
      const s = capSt(); s.shadowUntil = G.frame + 240; s.noBrace = G.frame + 180;   /* Patrick, Q67: 3 s */ G.wards = 0; capSet('shadows', 90);
      capPop(u, 'MASTER OF SHADOWS', '#9a9ac8'); G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:G.mod.radius, life:24, c:'#6a6a8a'});
    }
  };
}

/* ---- Cleric ----------------------------------------------------------------- */
const capIntervener = () => capUnitHas(G.leader, 'intervene') ? G.leader : G.squad.find(m => m.state === 'up' && capUnitHas(m, 'intervene'));   // the Leader counts even as they fall
function capCanIntervene(){
  return !!G && !window.CAPS_OFF && !!capIntervener() && !G.divineIntervened && G.favour > 0 && (META.deployments - (META.divineLast === undefined ? -99 : META.divineLast)) >= 3;
}
function capIntervene(u, text){
  G.divineIntervened = true; META.divineLast = META.deployments; G.favour = 0;
  G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:160, life:30, c:'#ffe680'}); capPop(u, 'DIVINE INTERVENTION', '#ffe680'); note('Divine Intervention. ' + text); SFX.play('stand');
}
{ const f = leaderFalls;
  leaderFalls = function(){
    f();
    if (!G || G.over || !G.leader.down || !capCanIntervene()) return;
    capIntervene(capIntervener(), META.leader.name + ' is lifted back to their feet.');
    standLeader('DIVINE INTERVENTION'); G.leader.con = Math.min(G.leader.maxCon, 2); addWard(2);
  };
}
{ const f = ABIL_FX.CLERIC;
  ABIL_FX.CLERIC = function(u){ return (!G || window.CAPS_OFF) ? f(u) : capCure(u, f); };
}
function capCure(u, f){
  const s = capSt(), L = G.leader;
  if (capUnitHas(u, 'miracle') && capReady('miracle') && capHurt() >= 2){
    G.fx.push({ring:true, x:u.x, y:u.y, r:G.mod.radius, life:26, c:'#ffe680'}); SFX.play('heal');
    if (!L.down && dist(L, u) < G.mod.radius * 1.6){ if (L.con < L.maxCon) L.con++; else L.wounds = Math.min(L.maxWounds, L.wounds + 1); pop(L.x, L.y - 20, '+1', '#8fd39a'); }
    for (const m of G.squad) if (m.state === 'up' && m.con < m.maxCon && dist(m, u) < G.mod.radius * 1.6){ m.con++; pop(m.x, m.y - 20, '+1', '#8fd39a'); }
    G.shaken = 0; G.favour = 0; u.passT = Math.max(u.passT || 0, 360); capSet('miracle', 120); capPop(u, 'MIRACLE WORKER', '#ffe680'); return;
  }
  const bleeding = L.down || G.squad.some(m => m.state === 'bleeding');
  if (capUnitHas(u, 'grace') && capReady('grace') && bleeding && G.favour >= 1){
    G.favour--; s.graceUntil = G.frame + 360; capSet('grace', 90); capPop(u, "AVATAR'S GRACE", '#ffe680'); G.fx.push({ring:true, x:u.x, y:u.y, r:G.mod.radius, life:26, c:'#ffe680'});
  }
  if (capUnitHas(u, 'prayers')){
    const m0 = u.s.magic; u.s.magic = (m0 || 1) + 1;
    try { f(u); } finally { u.s.magic = m0; }
  } else f(u);
}
{ const f = useAbility;      // Voice of the God: a free prayer each minute
  useAbility = function(spec){
    if (spec !== 'CLERIC' || !G || window.CAPS_OFF || !G.abil || !G.abil.CLERIC || !capHas('voice') || !capReady('voice') || G.abil.CLERIC.cd > 0) return f(spec);
    const pre = G.favour; f(spec);
    if (G.favour < pre){
      const c = capUnit('voice');
      if ((c.p.devotion || 0) < 0){ G.favour = 0; capPop(c, 'TENET BROKEN: THE PRAYER FAILS', '#ff8a7a'); capSet('voice', 60); }
      else { G.favour = pre; capSet('voice', 60); capPop(c, 'VOICE OF THE GOD: FREE', '#ffe680'); }
    }
  };
}

/* ---- Mage -------------------------------------------------------------------- */
{ const f = specPassive;     // Twin Cantrip, and Deep Fetish for the Witch
  specPassive = function(u, isLeader){
    if (!G || window.CAPS_OFF) return f(u, isLeader);
    if (u.spec === 'MAGE' && capUnitHas(u, 'twin')){ const m0 = G.mod.margin; G.mod.margin = (m0 || 0) + 1; try { return f(u, isLeader); } finally { G.mod.margin = m0; } }
    if (u.spec === 'WITCH' && capUnitHas(u, 'fetish')){ const b = u.passT; f(u, isLeader); if (b <= 0 && u.passT === 300) u.passT = 225; return; }
    return f(u, isLeader);
  };
}
{ const f = ABIL_FX.MAGE;    // Improved Casting for Lightning Bolt
  ABIL_FX.MAGE = function(u){
    if (!G || !capUnitHas(u, 'casting')) return f(u);
    const p0 = G.mod.precision; G.mod.precision = (p0 || 0) + 1; try { f(u); } finally { G.mod.precision = p0; }
  };
}
{ const f = useAbility;      // Overchannel
  useAbility = function(spec){
    if (spec === 'MAGE' && G && !G.over && !G.paused && G.abil && G.abil.MAGE && G.abil.MAGE.cd > 0 && capHas('overchannel') && capReady('overchannel')){
      const u = capAct().overchannel.find(x => x.con > 2);
      if (u && capPay(u, 1)){ G.abil.MAGE.cd = 0; capSet('overchannel', 60); capPop(u, 'OVERCHANNEL (-1 CON)', '#9fd0ff'); }
    }
    return f(spec);
  };
}
function capFireball(){
  const m = G.mod, c = crowd(420); if (!c) return;   // Living Grimoire casts by itself: not fire for Jasena's tenet (E3)
  G.fx.push({blast:true, x:c.x, y:c.y, r:0, max:78, life:22, c:'#e07a32'});
  for (const e of G.enemies) if (!e.dead && dist(e, c) < 78) strike(e, Math.max(3, mageMagic()) + 1 + m.precision, 4, {});
  G.shake = 8;
}
{ const f = runSpells;       // Improved Casting for spells, Living Grimoire
  runSpells = function(){
    if (!G || window.CAPS_OFF) return f();
    const m = G.mod, fb = m.fireball && G.frame % Math.round((9 - m.fireball * 1.5) * 60) === 0, p0 = m.precision, cast = capHas('casting');
    if (cast) m.precision = (p0 || 0) + 1;
    try { f(); } finally { m.precision = p0; }
    if (fb && capHas('grimoire') && capReady('grimoire')){
      const u = capUnit('grimoire');
      if (capPay(u, 1)){ capSet('grimoire', 45); capPop(u, 'LIVING GRIMOIRE: SECOND FIREBALL', '#ff9a4a'); if (cast) m.precision = (p0 || 0) + 1; try { capFireball(); } finally { m.precision = p0; } }
    }
  };
}
{ const f = drawTraps;       // the Sigils on the ground
  drawTraps = function(onScreen){
    f(onScreen);
    if (!G || !G.cap || !G.cap.sig.length) return;
    for (const g of G.cap.sig){
      const k = Math.min(1, (G.frame - g.born) / 30), pulse = 0.5 + 0.25 * Math.sin(G.frame / 8);
      ctx.save(); ctx.globalAlpha = (0.35 + pulse * 0.4) * k; ctx.strokeStyle = '#c8a0ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(g.x, g.y, g.r * 0.62, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3 + G.frame / 120; ctx.beginPath(); ctx.moveTo(g.x + Math.cos(a) * g.r * 0.62, g.y + Math.sin(a) * g.r * 0.62); ctx.lineTo(g.x + Math.cos(a + 2.1) * g.r, g.y + Math.sin(a + 2.1) * g.r); ctx.stroke(); }
      ctx.fillStyle = 'rgba(180,140,255,.12)'; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill(); ctx.restore();
    }
  };
}

/* ---- Witch ------------------------------------------------------------------- */
{ const f = updateShots;     // Greater Curses and Improved Hexes
  updateShots = function(){
    if (!G || window.CAPS_OFF || !G.shots.some(s => s.kind === 'hex') || !(capHas('curses') || capHas('hexes'))) return f();
    const before = new Map(); for (const e of G.enemies) if (!e.dead && e.hexT > 0) before.set(e, e.hexT);
    f();
    const fresh = G.enemies.filter(e => !e.dead && e.hexT > 0 && e.hexT > (before.get(e) || 0));
    const curses = capHas('curses'), hexes = capHas('hexes'), spread = new Set();
    for (const e of fresh){
      if (spread.has(e)) continue;
      if (hexes) e.hexT = Math.round(e.hexT * 1.5);
      if (curses){
        let n = 0;
        for (const o of G.enemies){ if (n >= 3) break; if (o === e || o.dead || o.dormant || o.hexT > 0 || dist(o, e) > 80) continue; o.hexT = e.hexT; o.poison = 1; spread.add(o); n++; }
      }
    }
  };
}
{ const f = ABIL_FX.WITCH;   // Greater Curses (longer Dark Illusion) and Dread Sovereign
  ABIL_FX.WITCH = function(u){
    f(u);
    if (!G || window.CAPS_OFF) return;
    if (capUnitHas(u, 'curses')) G.illusionT += 180;
    if (capUnitHas(u, 'dread') && capReady('dread')){
      const L = G.leader, near = liveFoes().filter(e => dist(e, L) < G.mod.radius * 1.5).sort((a, b) => dist(a, L) - dist(b, L)).slice(0, 12);
      if (near.length){ for (const e of near){ e.hexT = Math.max(e.hexT || 0, 480); e.weak = Math.max(e.weak || 0, 480); e.poison = Math.max(e.poison || 0, 1); }
        u.passT = Math.max(u.passT || 0, 420); capSet('dread', 60); capPop(u, 'DREAD SOVEREIGN (' + near.length + ')', '#b48cff'); G.fx.push({ring:true, x:L.x, y:L.y, r:G.mod.radius * 1.5, life:26, c:'#b48cff'}); }
    }
  };
}
const CAP_BREWS = ['storm', 'wafer', 'poultice'];
{ const f = applyLoot;       // Potent Brews and Blood Brew
  applyLoot = function(kind, at){
    f(kind, at);
    if (!G || window.CAPS_OFF || !CAP_BREWS.includes(kind)) return;
    if (capHas('brews')) addWard(1);
    if (capHas('bloodbrew')){
      if (kind === 'storm') G.stormT = Math.round(G.stormT * 1.5);
      let best = null, need = 0; const L = G.leader;
      if (!L.down && L.con < L.maxCon){ best = L; need = (L.maxCon - L.con) * 2; }
      for (const m of G.squad) if (m.state === 'up' && (m.maxCon - m.con) * 2 > need){ best = m; need = (m.maxCon - m.con) * 2; }
      if (best){ best.con = Math.min(best.maxCon, best.con + 1); pop(best.x, best.y - 20, '+1 BLOOD BREW', '#8fd39a'); }
    }
  };
}

/* ---- the ability bar shows what is ready --------------------------------------- */
const CAP_HUD = ['unbreakable', 'inspire', 'shadows', 'phantom', 'intervene', 'grace', 'miracle', 'voice', 'counter', 'overchannel', 'arcanist', 'grimoire', 'dread', 'conduit', 'sigil', 'consecrate'];
/* U-slice 10 (E4, Patrick 20 Nov "Consecr on"): a chip reads the capstone's full name from CAPS (ND 22 Nov: "Consecrated Ground",
   not a short form); the state is shown by the box, not a word. The hover lines are the ND's (s6-1c-1f-words.md); the chips it
   has not worded yet show CAP_TEXT until it does. */
const CAP_HOVER = {unbreakable:'When the squad would Break, it is only Shaken. Once every 90 seconds.',
  consecrate:'Holy ground round the Leader: allies hold their nerve, and undead and fiends hit less often. Costs Favour.',
  intervene:'Once a contract, saves a falling Leader or a breaking squad. Costs all your Favour.',
  overchannel:'Cast Lightning Bolt again while it recharges. Once a minute; costs 1 Condition.'};
function capName(k){ return (CAPS[k] && CAPS[k][2]) || k; }
function capChipText(k, st){ return capName(k) + (st > 0 ? ' ' + st + 's' : st === -2 ? ' set' : ''); }   // a countdown (or a placed Sigil) adds to the name
function capPanel(k){ const st = capStatus(k);
  return [capName(k), st > 0 ? 'Ready in ' + st + 's' : st === -1 ? 'Spent' : st === -2 ? 'Set' : st === -3 ? 'On' : 'Ready', CAP_HOVER[k] || CAP_TEXT[k] || '']; }
function capStatus(k){
  const s = capSt(), f = G.frame;
  if (k === 'intervene') return capCanIntervene() ? 0 : -1;
  if (k === 'sigil') return s.sig.length ? -2 : Math.max(0, Math.ceil((s.sigilNext - f) / 60));
  if (k === 'consecrate') return s.auraUntil > f ? -3 : Math.max(0, Math.ceil((s.auraNext - f) / 60));
  const r = (s.cd[k] || 0) - f; return r > 0 ? Math.ceil(r / 60) : 0;
}
{ const f = drawHUD;   /* captain-ability chips above the Deck band; they wrapped drawAbilityBar, which the Deck stubbed, so they went unseen from 2026-11-13 */
  drawHUD = function(){
    if (window.CAP_G !== G){ window.CAP_G = G; window.CAP_TOP = null; window.CAP_RECTS = []; }   /* Argon lead (a): a new deployment never hovers or lays out against the last one's chips (the Deck reads them inside f()) */
    f();
    window.CAP_TOP = null; window.CAP_RECTS = [];   /* CAP_RECTS: the chips' boxes (VH units) for the Deck's hover. Own list: the Deck layer paints and hovers before the chips draw, and clears DECK.rects only when it repaints. UX 593295bd: the top of the chip rows (VH units), read next frame by the SHAKEN line and the log so they stack above the chips; null when there are none */
    if (!G || window.CAPS_OFF || !G.abil || isBrawl()) return;
    const act = CAP_HUD.filter(k => capHas(k)); if (!act.length) return;
    /* U-slice 10: the text is 14 screen px or more (hudPx); the box is measureText + 8, so it cannot clip, and grows upward:
       the bottom row still ends 9 px above the band */
    const fs = typeof hudPx === 'function' ? hudPx(12) : 12, bh = Math.max(15, Math.ceil(fs * 1.25) + 2), step = bh + 2, by0 = VH - DECK.H - 9 - bh, R = window.CAP_RECTS;
    ctx.save(); ctx.font = 'bold ' + fs + 'px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const items = act.map(k => { const st = capStatus(k), txt = capChipText(k, st); return {k, txt, st, w:Math.ceil(ctx.measureText(txt).width) + 8}; });
    const maxW = VW - 60, rows = []; let row = [], rw = 0;
    for (const it of items){ if (row.length && rw + it.w + 3 > maxW){ rows.push({row, rw}); row = []; rw = 0; } row.push(it); rw += it.w + 3; }
    if (row.length) rows.push({row, rw});
    window.CAP_TOP = by0 - (rows.length - 1) * step;
    rows.forEach((r, ri) => {
      let x = Math.round(VW / 2 - (r.rw - 3) / 2); const y = by0 - (rows.length - 1 - ri) * step;   /* INDEX HD1: above the band */
      for (const it of r.row){
        const lit = it.st === -3 || it.st === -2, hot = it.st === 0 || lit, spent = it.st === -1;   /* ready: gold edge; counting: the seconds; on or a set Sigil (UX C10-2: in force): lit fill, dark text; spent: opaque fill, edge at 50 % */
        ctx.fillStyle = lit ? '#f0d070' : spent ? '#2c2017' : 'rgba(20,16,12,.82)'; ctx.fillRect(x, y, it.w, bh);   /* UX C10-1 ruling (23 Nov, after QA's 3.68-3.94:1 FAIL): a spent chip's fill is opaque #2c2017, so no ground shows through */
        ctx.globalAlpha = spent ? 0.5 : 1;   /* only the spent chip's edge is dimmed */
        ctx.strokeStyle = hot ? '#d4af37' : '#5d4e3e'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, it.w - 1, bh - 1);
        ctx.globalAlpha = 1;   /* UX C10-1: spent text #a89c84 (the counting grey), 5.85:1 on #2c2017 on any ground */
        ctx.fillStyle = lit ? '#2a1c08' : hot ? '#ffe9a8' : '#a89c84'; ctx.fillText(it.txt, x + 4, y + Math.round((bh + fs * 0.7) / 2)); ctx.globalAlpha = 1;
        R.push({kind: 'cap', k: it.k, x, y, w: it.w, h: bh});   // U-slice 10: the Deck's hover panel names it and says what it does (hud-deck.js D.hover, a frame later)
        x += it.w + 3;
      }
    });
    ctx.restore();
  };
}

/* ---- a Leader who can study Magic ------------------------------------------------ */
const LEADER_STUDY = {MAGE:{fac:'magetower', label:'Arcane study', price:m => 100 * m, lim:5, name:'Mage Tower'}, CLERIC:{fac:'chapel', label:'Devotions', price:m => 50 * m, lim:2, name:'Chapel'}, WITCH:{fac:'alchemy', label:'Fetish-craft', price:m => 75 * m, lim:5, name:'Alchemy Lab'}};
function leaderStudyInfo(){
  const L = META.leader; if (!L || !LEADER_STUDY[L.spec]) return null;
  const S = LEADER_STUDY[L.spec], cur = leaderStats(L).magic, next = cur + 1, price = S.price(next);
  let why = '';
  if (!has(S.fac)) why = 'build the ' + S.name + ' first'; else if (cur >= S.lim) why = L.spec === 'CLERIC' ? (has('fortresschurch') ? 'Magic 5 is the limit' : 'a Chapel teaches Divine Magic to 2; build the Fortress Church for 3 to 5') : 'Magic ' + S.lim + ' is the limit';   /* Index 37 */
  else if (META.leaderStudyAt === META.deployments) why = 'already studied this downtime'; else if (META.treasury < price) why = 'not enough gold';
  return {S, cur, next, price, why, ok:!why};
}
function leaderStudy(){
  const i = leaderStudyInfo(); if (!i || !i.ok) return SFX.play('nope');
  META.treasury -= i.price; META.leader.magic = i.next; META.leaderStudyAt = META.deployments;
  SFX.play('level'); saveMeta(); refreshUI();
}
chronWrap('leaderStudy', () => { const i = leaderStudyInfo(); return i ? i.S.label + ' for the Squad Leader (Magic ' + i.next + ')' : 'Leader study'; });
function leaderStudyHTML(){
  const i = leaderStudyInfo(); if (!i) return '';
  return `<div class="advbox" style="margin-top:6px"><b>${esc(META.leader.name)}'s studies.</b> A ${SPECS[META.leader.spec].name} Leader can raise Magic at the ${i.S.name}, once a downtime, for the same price as a Squad Mate. Magic is ${i.cur} now.
    <div class="mini" style="justify-content:flex-start;margin-top:4px"><button ${i.ok ? '' : 'disabled'} data-tip="${esc(i.ok ? i.S.label + ' raises Magic to ' + i.next : i.why)}" onclick="leaderStudy()">${i.S.label}: +1 Magic (${i.cur} \u2192 ${i.next}), ${i.price}gp</button>${i.ok ? '' : `<span style="font-size:14px;color:var(--blood);align-self:center">${esc(i.why)}</span>`}</div></div>`;
}
{ const f = leadershipHTML; leadershipHTML = () => f() + (META.leader && !inStoryNow() ? leaderStudyHTML() : ''); }

/* ---- the Manual and a tip ----------------------------------------------------------- */
TIPS.capstone = 'Your high-level Specialties have Capstones. Most fire on their own; the "READY" chips above the ability bar are the ones tied to your ability keys.';
/* the Capstone tip is shown in the startDeployment wrapper at the top of this file */
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx36')) return;
    lg.insertAdjacentHTML('beforeend', capManualHTML());
  };
}
function capManualHTML(){
    const bySpec = {}; for (const k in CAPS) (bySpec[CAPS[k][0]] = bySpec[CAPS[k][0]] || []).push(k);
    return (`<p class="idx36"><b>Capstones.</b> From Level 2 to Level 11 each Specialty gains abilities that fire on their own or ride on the ability it already has. They are live when the Leader, or a Squad Mate of that Specialty on their feet, is at the level. They never stack. The tabletop's "once per battle" becomes a cooldown here, and each cost is paid every time.</p>` +
      Object.keys(bySpec).map(sp => `<p class="idx36"><b>${SPECS[sp].name}.</b> ` + bySpec[sp].sort((a, b) => CAPS[a][1] - CAPS[b][1]).map(k => `<i>Level ${CAPS[k][1]}, ${CAPS[k][2]}:</i> ${esc(CAP_TEXT[k])}`).join(' ') + '</p>').join('') +
      `<p class="idx36"><b>Leaders study Magic.</b> A Mage, Cleric or Witch Leader can raise Magic once a downtime from the Roster screen, at the Mage Tower, Chapel or Alchemy Lab, for the same price as a Squad Mate.</p>`);
}
/* ===== END INDEX 36 ======================================================= */


/* ============================================================================
   INDEX 37 - BUILD 2A: BUILDINGS, GEAR, DOCTRINES AND CIVILIAN UPKEEP
   Everything here comes from the Players Manual (Tables 3.1 to 3.3, 4.3, 4.4,
   4.12 and Section 4.4), turned from a slow tabletop round into real time
   where it has to be (one round is 6 seconds, as elsewhere in the game).
     BUILDINGS  Huts (150gp) and Bunks (350gp) raise the Reserve Bench to 4 and
                6 places. The Fortress Church (350gp, needs the Chapel) lets
                Clerics, and a Cleric Leader, study Divine Magic from 2 up to 5,
                blesses every weapon against undead and fiends (+1 damage), and
                gives a retired Cleric or Nephilim veteran +2 Favour.
     ARMOUR     Masterwork Full Plate (4,000gp, needs a Blacksmith run by a
                veteran) and Runed Deep-Iron Plate (3,200gp, needs the Dwarven
                Syndicates at +2). Full Plate turns the first Solid Hit against
                the squad each round (6 s) into a Grazing Hit.
     KITS       Heavy Arbalest (75gp), Imperial Siege Arbalest (120gp, needs the
                Empire at +2) and the Scorpion (260gp, takes both kit slots, as
                its crew of two). They fire on their own at the toughest enemy.
     DOCTRINES  Pike Square, Fire Line, Wedge Formation, Fortification Breaching;
                and from the War Council table: Read the Small Print, The
                Courier Net, Hard Bargainers, Ledger and Seal, Quartered in
                Advance (all need the Command Tent).
     UPKEEP     Facilities marked "Staff Req? Yes" in Table 4.3 cost 15gp a
                contract in civilian staff, unless a retired veteran runs them.
                A shortfall is carried to the next contract. The Dominion perk
                Warlord's Levy makes one facility's staff free.
   To roll back, delete from this comment to END INDEX 37 and undo the small
   patches marked "Index 37" elsewhere in the file.
============================================================================ */
const UPKEEP_EACH = 15;
const STAFF_REQ = ['cells', 'barracks', 'training', 'armoury', 'stables', 'ranger', 'hospital', 'blacksmith', 'carpentry', 'leather', 'engineering', 'alchemy', 'magetower', 'fortresschurch'];

/* ---- requirement tokens: '@empire' is Allied with a faction, '#blacksmith' is a veteran-run facility ---- */
function reqPseudo(id){
  const k = id.slice(1);
  if (id[0] === '@') return {id, name:'Allied standing (+2) with the ' + (FACTIONS[k] ? FACTIONS[k].name : k)};
  const f = FACILITIES.find(x => x.id === k), v = VETERANS[k];
  return {id, name:(f ? f.name : k) + ' run by a veteran (' + (v ? v.match.map(matchName).join(' or ') : '') + ', 3+ Advancements)'};
}

/* ---- the buildings ---------------------------------------------------------- */
FACILITIES.push(
  {id:'huts',  cat:'Holding', name:'Huts', cost:150, x:10, req:'tents',
   desc:'Timber huts to replace the tents: the Reserve Bench grows to 6 places.'},
  {id:'bunks', cat:'Holding', name:'Bunks', cost:350, x:14, req:'huts',
   desc:'Proper bunkhouses: the Reserve Bench grows to 8 places.'},
  {id:'fortresschurch', cat:'Arcane', name:'Fortress Church', cost:350, x:38, req:'chapel',
   desc:'Upgrades the Chapel. Clerics, and a Cleric Leader, can study Divine Magic from 2 up to 5. Every weapon is blessed against undead and fiends (+1 damage).'}
);
for (const f of FACILITIES) f.baseName = f.baseName || f.name;
Object.assign(PLOTS, {fortresschurch:[320, 920]});
Object.assign(BASE_PLOTS, {fortresschurch:[320, 920]});   /* Index 48: Huts and Bunks are upgrades of the Tents */
Object.assign(FAC_LOOK, {huts:{type:'house', wall:'log', roof:'#6e5236', glyph:'shield', wide:true}, bunks:{type:'house', wall:'plaster', roof:'#7a4a3a', glyph:'flag', wide:true}, fortresschurch:{type:'tower', roof:'#b8963a', glyph:'sun'}});
Object.assign(FAC_SKIN_NAMES.barge, {huts:'Lower-Deck Berths', bunks:'Officers\u2019 Quarters', fortresschurch:'Stern Reliquary'});
Object.assign(FAC_SKIN_NAMES.warehouse, {huts:'Timber Mezzanine', bunks:'Dormitory Floor', fortresschurch:'Vaulted Sanctuary'});
Object.assign(BARGE_LOOK, {huts:{t:'tarp', c:'#b09a72'}, bunks:{t:'cabin', roof:'#5a4a3a', g:'flag', big:1}, fortresschurch:{t:'cabin', roof:'#b8963a', g:'cross', big:1}});
Object.assign(WARE_LOOK, {huts:{t:'loft'}, bunks:{t:'room', c:'#5a4a3a', g:'flag', big:1}, fortresschurch:{t:'room', c:'#b8963a', g:'cross', big:1}});
VETERANS.fortresschurch = {match:['CLERIC', 'NEPHILIM'], text:'+2 bonus Divine Favour at the start of every contract (it does not stack with other Favour bonuses, to a maximum of +2).'};
for (const id of STAFF_REQ){ const f = FACILITIES.find(x => x.id === id); if (f && !/civilian/.test(f.desc)) f.desc += ` Needs staff: a civilian costs ${UPKEEP_EACH}gp a contract, or a retired veteran runs it free.`; }
Object.defineProperty(LEADER_STUDY.CLERIC, 'lim', {get(){ return has('fortresschurch') ? 5 : 2; }, configurable:true});

/* ---- gear ------------------------------------------------------------------------- */
ARMOUR_LOOK.fullplate = ['#e6d79c', 'plate']; ARMOUR_LOOK.deepiron = ['#8fa6bc', 'plate'];
GEAR.push(
  {id:'fullplate', slot:'armour', name:'Masterwork Full Plate', cost:4000, ac:6, shift:3, mv:-2, req:['blacksmith', '#blacksmith'], graze0:true, fullplate:true,
   note:'Grazing hits do nothing. The first Solid Hit against the squad each round (6 seconds) is only a Grazing Hit. Needs a Blacksmith run by a veteran.'},
  {id:'deepiron', slot:'armour', name:'Runed Deep-Iron Plate', cost:3200, ac:6, shift:3, mv:-1, req:['blacksmith', '@dwarves'], graze0:true,
   note:'Kraggan masterwork: heavy plate with only -1 Move. Needs the Dwarven Syndicates at +2.'},
  {id:'arbalest', slot:'kit', name:'Heavy Arbalest', cost:75, req:['carpentry', 'blacksmith'], noLoot:true, bolt:{range:400, cd:300, struct:1},
   note:'A sniper crossbow: every 5 seconds a bolt at the toughest enemy within 400 px (commanders first). Skill 4, Base Damage 4, ignores 1 step of armour.'},
  {id:'siegearbalest', slot:'kit', name:'Imperial Siege Arbalest', cost:120, req:['carpentry', 'blacksmith', '@empire'], noLoot:true, bolt:{range:480, cd:300, struct:2},
   note:'As the Heavy Arbalest, 480 px, and double damage against nests, siege engines and obelisks. Needs the Empire at +2.'},
  {id:'scorpion', slot:'kit', name:'Scorpion', cost:260, req:['carpentry', 'blacksmith'], noLoot:true, crew:2,
   note:'A bolt thrower with a crew of two, so it takes both kit slots. Every 6 seconds two Skill 4 bolts at the two toughest enemies within 460 px, each a Skill 5 Piercing hit (double against structures).'}
);
{ const f = drawGear;
  drawGear = function(P, g){
    if (g.id === 'arbalest' || g.id === 'siegearbalest'){
      P(1, 7, 12, 2, C.wood); P(10, 3, 2, 10, C.woodD); P(9, 3, 1, 1, C.woodD); P(9, 12, 1, 1, C.woodD); P(9, 4, 1, 8, '#e8e0d0');
      P(2, 6, 12, 1, C.steelL); P(14, 6, 2, 1, C.steelL); P(3, 9, 4, 2, C.steel); P(4, 11, 2, 2, C.steel);
      if (g.id === 'siegearbalest'){ P(2, 7, 6, 1, C.gold); P(11, 1, 3, 2, C.gold); } return;
    }
    if (g.id === 'scorpion'){
      P(1, 10, 14, 2, C.woodD); P(2, 12, 4, 3, C.wood); P(10, 12, 4, 3, C.wood); P(3, 13, 2, 1, C.steel); P(11, 13, 2, 1, C.steel);
      P(1, 3, 2, 8, C.wood); P(13, 3, 2, 8, C.wood); P(3, 3, 10, 1, '#e8e0d0'); P(3, 4, 10, 1, '#e8e0d0'); P(2, 8, 12, 1, C.steelL); P(14, 7, 2, 3, C.steelL); P(6, 7, 4, 4, C.steel); return;
    }
    return f(P, g);
  };
}
{ const f = gearClick;     // the Scorpion's crew of two take both kit slots
  gearClick = function(id){
    const g = gear(id), before = META.gear.kits.join(); f(id);
    if (!g || g.slot !== 'kit') return;
    const k = META.gear.kits; let nk = k;
    if (g.crew === 2 && k.includes(id)) nk = [id]; else if (k.includes('scorpion') && k.length > 1) nk = k.filter(x => x !== 'scorpion');
    if (nk !== k){ META.gear.kits = nk; saveMeta(); renderCamp(); }
  };
}
function fpDowngrade(out, v){
  if (G.armour && G.armour.fullplate && out === 'solid'){
    const r = Math.floor(G.frame / ROUND);
    if (G.fpRound !== r){ G.fpRound = r; pop(v.x, v.y - 30, 'FULL PLATE: A GRAZE', '#c8d8e8'); return 'graze'; }
  }
  return out;
}
const B2_RANGED = ['shortbows', 'crossbows', 'longbows'];
function kitTarget(L, range, skip){
  let best = null, bs = -1;
  for (const e of liveFoes()){
    if (e.dormant || (skip && skip.includes(e)) || dist(e, L) > range) continue;
    const B = BESTIARY[e.k], s = (B.boss ? 1000 : 0) + (B.arch === 'fixed' ? 400 : 0) + e.maxCon * 2 + e.con;
    if (s > bs){ bs = s; best = e; }
  }
  return best;
}
function kitBolt(L, e, skill, dmg, crush, struct){
  const c0 = e.con; G.fx.push({beam:true, x:L.x, y:L.y - 10, tx:e.x, ty:e.y - 10, life:12, c:'#efe6c8'});
  strike(e, skill, dmg, {crush, ranged:true, from:L});
  if (struct > 1 && !e.dead && BESTIARY[e.k].arch === 'fixed' && c0 > e.con) hurtEnemy(e, (c0 - e.con) * (struct - 1));
}
function kitTick(){
  if (!G.kits || !G.kits.length || G.leader.down) return;
  const L = G.leader, s = G.kitS = G.kitS || {};
  for (const k of G.kits){
    if (k.bolt){
      if ((s[k.id] || 0) > G.frame) continue;
      const e = kitTarget(L, k.bolt.range); if (!e) continue;
      s[k.id] = G.frame + k.bolt.cd; SFX.play('shoot'); kitBolt(L, e, 4, 4, 1, k.bolt.struct);
    } else if (k.crew){
      if ((s[k.id] || 0) > G.frame) continue;
      const a = kitTarget(L, 460); if (!a) continue;
      const b = kitTarget(L, 460, [a]); s[k.id] = G.frame + 360; SFX.play('shoot');
      for (const e of [a, b]) if (e) kitBolt(L, e, 4, 5, 3, 2);
      pop(L.x, L.y - 56, 'SCORPION', '#efe6c8');
    }
  }
}

/* ---- the four tactical doctrines and the five War Council doctrines ------------------ */
DOCTRINES.push(
  {id:'pikesquare', name:'Pike Square', cost:150, req:['barracks', 'carpentry'], text:'With Long Spears or Pikes, enemy charges lose their +1 step from any side, and a squad in a Shield Wall strikes with reach at the first enemies to close within 2 hexes (Overwatch).'},
  {id:'fireline', name:'Fire Line', cost:140, req:['carpentry'], text:'While the Leader stands still, every ranged attack shifts up 1 step. Needs a bow or crossbow.'},
  {id:'wedge', name:'Wedge Formation', cost:130, req:['barracks'], text:'A Charge is 1 hex faster and a melee Critical Hit does +1 damage, at the cost of -1 AC against flank attacks while charging.'},
  {id:'breaching', name:'Fortification Breaching', cost:200, req:['engineering'], text:'Double damage to nests, siege engines and Plague Obelisks.'},
  {id:'smallprint', name:'Read the Small Print', cost:120, req:['command'], text:'War Council. Once a contract, after seeing the Patron Resistance, decline the job and draw a different lead with no loss of Standing. Without it, walking away costs 1 Standing.'},
  {id:'courier', name:'The Courier Net', cost:140, req:['command'], text:'War Council. The job board always offers one extra contract lead.'},
  {id:'hardbargain', name:'Hard Bargainers', cost:160, req:['command'], text:'War Council. Declare it before the Council rolls. Then once, re-roll one die and keep the better result.'},
  {id:'ledgerseal', name:'Ledger and Seal', cost:110, req:['command'], text:'War Council. A fighting withdrawal pays in full once the job is at least half done. Without it, a withdrawal pays half.'},
  {id:'quartered', name:'Quartered in Advance', cost:170, req:['command'], text:'War Council. Declare it before the Council rolls. You start with one free Contract Edge, which cannot be Better Terms.'}
);
{ const f = buyDoctrine;
  buyDoctrine = function(id){
    const had = hasDoc(id); f(id);
    if (!had && hasDoc(id) && id === 'courier' && META.board && META.board.length === 3){
      const used = new Set(META.board.map(c => c.obj)), pool = CONTRACT_KEYS.filter(k => !used.has(k)), lvl = META.leader ? META.leader.level : 1, tiers = [1]; if (lvl >= 3) tiers.push(2); if (lvl >= 5) tiers.push(3);
      META.board.push(makeContract(pickOf(pool.length ? pool : CONTRACT_KEYS), pickOf(tiers))); saveMeta(); refreshUI();
    }
  };
}
function councilRecount(c){
  const base = c.council.filter(d => d.res === 'success').length + (perk('dominion', 9) ? 1 : 0) + (c.qia ? 1 : 0);
  c.picks = Math.max(0, base - (c.edges || []).length);
  st().bestCouncil = Math.max(st().bestCouncil || 0, base);
}
{ const f = rollCouncil;
  rollCouncil = function(){
    f(); const c = META.board && MU && META.board[MU.contract];
    if (c && c.council && c.declared === 'quartered' && hasDoc('quartered') && !c.qia){ c.qia = true; councilRecount(c); checkMilestones(null); saveMeta(); renderMuster(); }
  };
}
{ const f = lkCouncilRedo;     // a Luck re-roll must keep the free Edge
  lkCouncilRedo = function(mode){ f(mode); const c = META.board && MU && META.board[MU.contract]; if (c && c.council && c.qia){ councilRecount(c); saveMeta(); renderMuster(); } };
}
{ const f = pickEdge;
  pickEdge = function(id){
    const c = META.board[MU.contract];
    if (c && id === 'terms' && c.qia && !c.edges.some(e => e !== 'terms') && c.picks <= 1) return SFX.play('nope');   // the free Edge cannot be Better Terms
    f(id);
  };
}
function wcDeclare(id){
  const c = META.board[MU.contract]; if (!c || c.council || !hasDoc(id)) return;
  c.declared = c.declared === id ? null : id; SFX.play('pick'); saveMeta(); renderTable();
}
function wcDecline(){
  const c = META.board && META.board[MU.contract]; if (!c || c.council || c.finale || inStoryNow()) return;
  const free = hasDoc('smallprint') && META.smallPrintAt !== META.deployments;
  if (!free && !gate(`Walk away from this job? Standing with ${facName(c.faction)} falls by 1.`, () => wcDecline())) return;
  const used = new Set(META.board.map(x => x.obj)), pool = CONTRACT_KEYS.filter(k => !used.has(k)), lvl = META.leader ? META.leader.level : 1, tiers = [1]; if (lvl >= 3) tiers.push(2); if (lvl >= 5) tiers.push(3);
  META.board[MU.contract] = makeContract(pickOf(pool.length ? pool : CONTRACT_KEYS), pickOf(tiers));
  if (free) META.smallPrintAt = META.deployments; else shiftStanding(c.faction, -1, null);
  SFX.play('pick'); saveMeta(); renderTable();
}
function wcPreRollHTML(sel){
  let h = '';
  const opts = [['hardbargain', 'Hard Bargainers'], ['quartered', 'Quartered in Advance']].filter(([id]) => hasDoc(id));
  if (opts.length) h += `<div class="sub" style="font-size:14px"><b>Declare a War Council doctrine</b> (one a contract):<br>${opts.map(([id, n]) => `<button class="btn small ${sel.declared === id ? 'gold' : ''}" onclick="wcDeclare('${id}')">${n}${sel.declared === id ? ' (declared)' : ''}</button>`).join('')}</div>`;
  if (!sel.finale){
    const free = hasDoc('smallprint') && META.smallPrintAt !== META.deployments;
    h += `<div class="sub" style="font-size:14px"><button class="btn small" onclick="wcDecline()" data-tip="Draw a different lead in its place.">Decline this job${free ? ' (Read the Small Print: free)' : ' (-1 Standing)'}</button></div>`;
  }
  return h;
}
function hbHTML(sel){
  let h = '';
  if (sel.qia) h += '<div class="sub" style="font-size:14px;color:#1e6a24">Quartered in Advance: one Edge is free, and it cannot be Better Terms.</div>';
  if (hasDoc('hardbargain') && sel.declared === 'hardbargain'){
    if (sel.hbUsed) h += '<div class="sub" style="font-size:14px">Hard Bargainers has been used on this job.</div>';
    else { const bad = sel.council.map((d, i) => d.res !== 'success' ? `<button class="btn small" onclick="hbReroll(${i})">Re-roll: ${esc(d.label)}</button>` : '').join(''); if (bad) h += `<div class="sub" style="font-size:14px"><b>Hard Bargainers:</b> re-roll one die and keep the better result.<br>${bad}</div>`; }
  }
  return h;
}
function hbReroll(i){
  const c = META.board[MU.contract]; if (!c || !c.council || c.hbUsed || c.declared !== 'hardbargain' || !hasDoc('hardbargain')) return;
  const d = c.council[i]; if (!d || d.res === 'success') return;
  const diff = councilDiff(c), r = attackDie(d.skill, diff), res = (r.out === 'solid' || r.out === 'crit') ? 'success' : r.out === 'graze' ? 'partial' : 'miss', rank = {miss:0, partial:1, success:2};
  const better = rank[res] > rank[d.res]; if (better) c.council[i] = {label:d.label, skill:d.skill, face:r.face, res};
  c.hbUsed = true; councilRecount(c); checkMilestones(null); saveMeta();
  showDice('Hard Bargainers', [{face:r.face, skill:clampSkill(d.skill), out:r.out, ac:diff, label:d.label}], {sub:`Against Patron Resistance ${diff}`, result:better ? 'The better roll is kept.' : 'The first roll was as good: it stands.', sfx:better ? 'win' : 'nope'});
  renderMuster();
}

/* ---- the doctrines at work in the field ----------------------------------------------- */
function wedgeFlank(e){
  let da = Math.atan2(e.y - G.leader.y, e.x - G.leader.x) - G.facing; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
  return Math.abs(da) > Math.PI / 3;
}
function pikeTick(){
  if (G.frame % 20 || G.melee.id !== 'pikes' || G.formation !== 'SHIELD') return;
  let n = 0;
  for (const e of G.enemies){
    if (n >= 2) break;
    if (e.dead || e.dormant || e.pikeHit || BESTIARY[e.k].arch === 'fixed') continue;
    const u = squadUnits().find(x => dist(x, e) < 82); if (!u) continue;
    e.pikeHit = true; n++; G.fx.push({arc:true, x:u.x, y:u.y, ang:Math.atan2(e.y - u.y, e.x - u.x), life:9, c:'#c8d8e8'});
    strike(e, (u.s ? u.s.melee : G.leader.s.melee) + stepBonus(u, true), G.melee.dmg, {crush:G.melee.crush || 0, from:u});
  }
}
{ const f = update;
  update = function(){
    if (!G || G.over || G.paused) return f();
    const L = G.leader;
    if (L.x !== G._px || L.y !== G._py){ G.moveF = G.frame; G._px = L.x; G._py = L.y; }
    const ar = G.armour, wedge = hasDoc('wedge') && G.chargeT > 0 && !!ar; if (wedge) ar.mv += 1;       // Wedge: a Charge is 1 hex faster
    try { f(); } finally { if (wedge) ar.mv -= 1; }
    if (G && !G.over){ try { kitTick(); if (hasDoc('pikesquare')) pikeTick(); } catch (e) { if (!G._b2err){ G._b2err = 1; console.log('build2a error', e && e.message); } } }
  };
}
{ const f = stepBonus;       // Fire Line
  stepBonus = function(u, isMelee){
    let s = f(u, isMelee);
    if (!isMelee && G && hasDoc('fireline') && G.frame - (G.moveF || 0) >= 30 && B2_RANGED.includes(G.ranged.id)) s += 1;
    return s;
  };
}
{ const f = attackDie;       // remember a critical for Wedge Formation
  attackDie = function(skill, ac, l){ const r = f(skill, ac, l); if (G && G._probe && r.out === 'crit') G._crit = true; return r; };
}
{ const f = hurtEnemy;       // Fortification Breaching: double damage to nests, engines and obelisks
  hurtEnemy = function(e, n){
    f(e, n);
    if (G && !G._brD && hasDoc('breaching') && e && !e.dead && BESTIARY[e.k] && BESTIARY[e.k].arch === 'fixed'){ G._brD = true; try { f(e, n); } finally { G._brD = false; } }
  };
}

/* ---- civilian upkeep -------------------------------------------------------------------- */
const upkeepFacilities = () => STAFF_REQ.filter(id => has(id) && VETERANS[id] && !staffOf(id));
const upkeepDue = () => Math.max(0, upkeepFacilities().length - (perk('dominion', 6) ? 1 : 0)) * UPKEEP_EACH;
const upkeepLabel = id => (STAFF_REQ.includes(id) && VETERANS[id]) ? (perk('dominion', 6) && upkeepFacilities()[0] === id ? 'Civilian staff, free (Warlord\u2019s Levy)' : `Civilian staff: ${UPKEEP_EACH}gp a contract`) : 'Built';
function civilUpkeep(){
  const n = upkeepFacilities().length, due = upkeepDue(), owed = due + (META.upkeepDebt || 0);
  if (!owed) return;
  const paid = Math.min(Math.max(0, META.treasury), owed); META.treasury -= paid; META.upkeepDebt = owed - paid;
  try { chron(); chronSpend(`Civilian staff for ${n} facilit${n === 1 ? 'y' : 'ies'}`, paid); } catch (e) {}
  saveMeta();
  const li = `<p>${due ? `<b>Facility upkeep:</b> ${n} facilit${n === 1 ? 'y' : 'ies'} without a veteran at ${UPKEEP_EACH}gp${perk('dominion', 6) ? ' (one free, Warlord\u2019s Levy)' : ''}: -${paid}gp.` : ''}${META.upkeepDebt ? ` <span class="bad">The Treasury could not cover it: ${META.upkeepDebt}gp is owed and comes out of the next contract.</span>` : ''}${!due && paid ? `Earlier upkeep paid: -${paid}gp.` : ''}</p>`;
  if (renderDebrief.last) renderDebrief(renderDebrief.last.head, renderDebrief.last.lines.concat([li]));
}
{ const f = endDeployment;
  endDeployment = function(result){
    const d0 = META ? META.deployments : 0; f(result);
    try { if (META && !inStoryNow() && META.deployments > d0) civilUpkeep(); } catch (e) { console.log('upkeep error', e && e.message); }
  };
}

/* ---- the Manual ------------------------------------------------------------------------------- */
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx37')) return;
    lg.insertAdjacentHTML('beforeend', b2ManualHTML());
  };
}
function b2ManualHTML(){
  return `<p class="idx37"><b>Civilian upkeep.</b> Facilities marked Staff Req in Table 4.3 (Cells, Barracks, Training Grounds, Armoury, Stables, Ranger's Hut, Field Hospital, Blacksmith, Carpentry, Leatherworking, Engineering, Alchemy Lab, Mage Tower and Fortress Church) cost ${UPKEEP_EACH}gp a contract in civilian staff, paid after every contract. A retired veteran runs a facility free: retire a maimed or veteran Squad Mate into it from the Roster. A shortfall is carried to the next contract. Warlord's Levy makes one facility free.</p>
    <p class="idx37"><b>New buildings.</b> Huts (150gp, needs Tents) and Bunks (350gp, needs Huts) raise the Reserve Bench to 6 and 8 places. The Fortress Church (350gp, needs the Chapel) teaches Divine Magic 3 to 5 to Clerics and a Cleric Leader, blesses weapons against undead and fiends, and gives a retired Cleric or Nephilim veteran +2 Favour. The tabletop's Sacred Oath for Magic 3 to 5 is not in the game yet.</p>
    <p class="idx37"><b>New gear.</b> Masterwork Full Plate (needs a veteran-run Blacksmith) and Runed Deep-Iron Plate (needs the Dwarven Syndicates at +2). Heavy Arbalest, Imperial Siege Arbalest (needs the Empire at +2) and the Scorpion (both kit slots) fire on their own at the toughest enemy in range.</p>
    <p class="idx37"><b>New doctrines.</b> Pike Square, Fire Line, Wedge Formation and Fortification Breaching are bought on the planning table. So are the War Council doctrines (they need the Command Tent): Read the Small Print, The Courier Net, Hard Bargainers, Ledger and Seal and Quartered in Advance. Declare Hard Bargainers or Quartered in Advance before the Council rolls; only one can be declared for a job. Declining a job costs 1 Standing unless you hold Read the Small Print.</p>`;
}
/* ===== END INDEX 37 ======================================================= */


/* ============================================================================
   INDEX 38 - SPECIALTY BALANCE PASS
   Every number below is a lever in one table, BAL, so the pass can be read,
   tuned and undone in one place. A lever left at its default changes nothing.
     cadMelee / cadRanged   multiplies the time between a Specialty's swings
                            or shots (below 1 is faster)
     fan                    a melee swing also nicks a second enemy in reach
                            for the Specialty's flat damage minus `drop`
                            (no die is rolled for it)
     flat                   flat damage added to a Specialty's Solid Hits
     healCd                 multiplies the time between a Cleric's automatic
                            heals (below 1 is faster)
     leaderCon              Condition added to a Leader of that Specialty. Off
                            for every Specialty. The report recommends testing
                            {MAGE:1}: a Level 11 Mage Leader was wiped in 5 of
                            18 Tier 3 runs against 1 of 18 for a Soldier.
   How the numbers were chosen, and what they are measured against, is in the
   Balance Report. They were measured on squads of five trained veterans
   (the Leader's row for their level, Con +2), with the squad kept alive so
   that output is measured, not luck.
   To roll back, delete from this comment to END INDEX 38.
============================================================================ */
const BAL = {
  cadMelee:{}, cadRanged:{}, flat:{}, healCd:{}, leaderCon:{},
  fan:{SCOUNDREL:{n:1, drop:1}}       // Twin Blades: the Scoundrel's swing also nicks a second enemy for Soft Spot damage less 1
};
SPECS.SCOUNDREL.attack = 'Soft Spot: +1 damage on every Solid Hit, +2 against a foe that is engaged with an ally, Slowed, Staggered or hexed. Quick with a blade. Twin Blades: each swing also nicks a second enemy in reach for the Soft Spot damage less 1.';
const balGet = (tbl, spec, d) => (BAL[tbl] && BAL[tbl][spec] !== undefined) ? BAL[tbl][spec] : d;
{ const f = unitAttack;
  unitAttack = function(u, isLeader, shieldWall){
    const t0 = u.timer, fan = (u.spec === 'SCOUNDREL') ? balGet('fan', u.spec, null) : null;
    let extra = null;
    if (fan && fan.n > 0 && !(t0 > 0) && G && !shieldWall){            // choose who gets nicked before the swing moves anyone
      const reach = 46 + (G.melee.reach || 0) + (G.reachBonus || 0), skip = new Set(), e1 = nearest(u, reach);
      if (e1){ skip.add(e1); extra = []; for (let k = 0; k < fan.n; k++){ const e = nearest(u, reach, skip); if (!e) break; skip.add(e); extra.push(e); } }
    }
    f(u, isLeader, shieldWall);
    if (!G || !(t0 <= 0) || !(u.timer > 14) || (u.atkKind !== 'melee' && u.atkKind !== 'ranged')) return;
    const mult = balGet(u.atkKind === 'melee' ? 'cadMelee' : 'cadRanged', u.spec, 1);
    if (mult !== 1) u.timer = Math.max(8, Math.round(u.timer * mult));
    if (extra && u.atkKind === 'melee' && extra.length){
      const soft = ((isLeader ? u.s.soft2 : mateFeatures(u.p).soft2) ? 2 : 1) + G.mod.softspot, d = Math.max(1, soft - (fan.drop || 0));
      for (const e of extra){ if (e.dead) continue; G.fx.push({arc:true, x:u.x, y:u.y - 4, ang:Math.atan2(e.y - u.y, e.x - u.x), life:7, c:'#d8d0c0'}); hurtEnemy(e, d); }
    }
  };
}
/* strike, one layer for this file (INT-1 group 9): the balance flat bonus outermost, then Wedge Formation, the Fortress Church,
   Assassinate and Phantom Blade, then the game's strike (the order the four separate wrappers had) */
{ const f = strike;
  const blade = function(e, skill, baseDmg, o = {}){   // Assassinate and Phantom Blade
    if (!G || window.CAPS_OFF || !o.scoundrel || e.dead || o.piercing) return f(e, skill, baseDmg, o);
    const B = BESTIARY[e.k], asn = capHas('assassin'), ph = capHas('phantom') && capReady('phantom') && (B.boss || B.arch === 'skirm' || B.arch === 'caster');
    if (!asn && !ph) return f(e, skill, baseDmg, o);
    G._asn = asn; G._ph = ph; G._phHit = false;
    try { return f(e, skill, baseDmg, ph ? Object.assign({}, o, {crush:(o.crush || 0) + 3}) : o); }
    finally { G._asn = false; G._ph = false; if (G._phHit){ G._phHit = false; capSet('phantom', 30); pop(e.x, e.y - 34, 'PHANTOM BLADE', '#c8c8ff'); } }
  };
  const church = function(e, skill, baseDmg, o = {}){   // the Fortress Church blesses every weapon against undead and fiends
    if (G && e && !e.dead && has('fortresschurch') && UNHOLY.includes(e.k) && o.from && !o.piercing) o = Object.assign({}, o, {flat:(o.flat || 0) + 1});
    return blade(e, skill, baseDmg, o);
  };
  const wedge = function(e, skill, baseDmg, o = {}){   // Wedge Formation: +1 damage on a melee Critical Hit while charging
    if (!G || !hasDoc('wedge') || !(G.chargeT > 0) || !o.from || o.ranged || !e || e.dead) return church(e, skill, baseDmg, o);
    G._probe = true; G._crit = false;
    try { church(e, skill, baseDmg, o); } finally { G._probe = false; }
    if (G._crit && !e.dead) hurtEnemy(e, 1);
    G._crit = false;
  };
  strike = function(e, skill, baseDmg, o = {}){   // the balance table's flat bonus
    if (G && o && o.from && !o.piercing){ const b = balGet('flat', o.from.spec, 0); if (b) o = Object.assign({}, o, {flat:(o.flat || 0) + b}); }
    return wedge(e, skill, baseDmg, o);
  };
}
{ const f = leaderStats;
  leaderStats = function(L){ const s = f(L), c = balGet('leaderCon', L.spec, 0); if (c){ s.con += c; s.maxWounds = s.con + s.wounds; } return s; };
}
{ const f = specPassive;
  specPassive = function(u, isLeader){
    const t0 = u.passT; f(u, isLeader);
    if (u.spec === 'CLERIC' && u.passT >= 400 && !(t0 > 0)){ const m = balGet('healCd', 'CLERIC', 1); if (m !== 1) u.passT = Math.max(60, Math.round(u.passT * m)); }
  };
}
/* ---- the Manual ------------------------------------------------------------- */
function balManualHTML(){
  return `<p class="idx38"><b>Balance.</b> Specialties were compared on squads of five trained veterans at Levels 8 and 11, with the squad kept alive so that damage output, not luck, is what is measured, and again against a lone commander. The aim is that no damage-dealing Specialty is more than a quarter off the middle in a crowd fight. <b>Scoundrel:</b> Twin Blades. Each swing also nicks a second enemy in reach for the Soft Spot damage less 1, with no die. It brings the Scoundrel's crowd fighting level with the other damage dealers and does not change how fast it kills a commander.</p>`;
}
{ const f = openManual;
  openManual = function(){ f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx38')) return; lg.insertAdjacentHTML('beforeend', balManualHTML()); };
}
window.CAPS_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      ok('CAP_HUD entries all have a full CAPS name and a hover line', CAP_HUD.every(k => CAPS[k] && capName(k) === CAPS[k][2] && !!(CAP_HOVER[k] || CAP_TEXT[k])));
      ok('U-slice 10: a chip reads the full name; only a countdown or a set Sigil adds to it', capChipText('consecrate', 0) === 'Consecrated Ground' && capChipText('consecrate', -3) === 'Consecrated Ground' && capChipText('consecrate', -1) === 'Consecrated Ground' && capChipText('consecrate', 12) === 'Consecrated Ground 12s' && capChipText('sigil', -2) === 'Archmage Sigil set');
      ok('LEADER_STUDY covers MAGE, CLERIC, WITCH', ['MAGE', 'CLERIC', 'WITCH'].every(s => !!LEADER_STUDY[s] && typeof LEADER_STUDY[s].price === 'function'));
      ok('capLabel returns string for known capstone', typeof capLabel('consecrate') === 'string' && capLabel('consecrate').length > 0);
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
/* ===== END INDEX 38 ======================================================= */


