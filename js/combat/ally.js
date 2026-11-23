/* ============================================================================
   INDEX ALLY1 - the second squad (Fable job 7 phase 2, docs/coop-seats.md
   section 2 step 2, audits/fable/coop.md). Loads after js/mp/seats.js.
   An officer and up to four roster mates march beside the Leader's squad as
   seat 1 (kind 'ally', controller 'ai'): picked at the planning table (a block
   under Who Marches), driven by the raid-ally AI with one-key orders ([V]
   cycles Follow / Hold / Advance), hurt through the objective damage path like
   the camp-raid veterans, with real casualties at the debrief (injury rolls,
   graves, a dead officer leaves the roll).
   Phase 3 (js/mp/coop.js) adds more squads the same way: ALLY.extra lists
   seats 2 to 4 ({officer, mates, seat, controller 'guest'|'ai', name}); every
   squad on the field lives in G.allies and G.ally is the first. A guest's
   Visiting Captain (officer.guestCaptain) is knocked out, never killed, and
   leaves no grave (design section 5).
   With n squads on the field COOP.active is n, so SEAT1 scales the contract
   (joint pay x1.6 / 2.4 / 3.2, the extra garrison and wave bursts); the debrief
   takes the host's share from COOP.splitPay (upkeep, the guests' 40% cut).
   Knobs: ALLY.on, ALLY.KEY, ALLY.ENGAGE, ALLY.FOLLOW (offset), ALLY.SPREAD,
   ALLY.PATCH_S, ALLY.HP_MULT, ALLY.pick {officerId, mateIds}, ALLY.extra, ALLY.log.
   ROLLBACK: remove this script tag (or ALLY.on = false before a deployment).
============================================================================ */
(function(){
'use strict';
if (typeof window.COOP === 'undefined') { console.warn('ALLY1: js/mp/seats.js (COOP) missing; second squad off'); return; }
const ALLY = window.ALLY = {
  on: true,
  KEY: 'v',
  ORDERS: ['follow', 'hold', 'advance'],
  LABEL: {follow: 'FOLLOW', hold: 'HOLD HERE', advance: 'ADVANCE'},
  ENGAGE: 280,          // px from a unit or its slot at which it picks a fight
  FOLLOW: {x: -70, y: 50},
  SPREAD: 90,           // px between the squads' follow slots
  RING: 28,             // mates stand this far round the officer
  PATCH_S: 5,           // seconds an up ally must stand by a downed one to patch them up (once each)
  HP_MULT: 2,           // hit points = con x this (the camp-raid veterans' rule; at x1 a fresh squad is gone in a minute)
  ADVANCE_SPD: 1.3,     // px a frame the anchor walks under Advance
  MAX_MATES: 4,
  pick: null,           // the table's second squad (seat 1)
  extra: [],            // phase 3: squads for seats 2 to 4, registered by js/mp/coop.js
  armed: false,
  log: []
};
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const squads = () => (G && G.allies) ? G.allies.filter(u => u && u.units) : [];   // story aux, camp veterans and wall archers share G.allies; skip them
const upIn = sq => sq.units.filter(u => u.state === 'up');
const allUnits = () => { const out = []; for (const sq of squads()) for (const u of sq.units) out.push(u); return out; };
const RING_C = ['#ffd860', '#7fd3ff', '#b9ff7f', '#ff9ad5'];
ALLY.colour = seat => RING_C[((seat || 1) - 1) % RING_C.length];

/* ---- the pick at the table ------------------------------------------------ */
ALLY.readyOfficers = () => (typeof readyOfficers === 'function' ? readyOfficers() : []);
ALLY.takenMates = () => { const s = new Set(); for (const x of ALLY.extra) if (x && x.mates) for (const p of x.mates) s.add(p.id); return s; };
ALLY.freeMates = () => { const taken = ALLY.takenMates(); return (META.roster || []).filter(p => !p.resting && !p.away && !taken.has(p.id) && !(typeof MU !== 'undefined' && MU && MU.ids.includes(p.id))); };
ALLY.setOfficer = function(id){
  id = +id;
  if (!id){ ALLY.pick = null; }
  else {
    const o = ALLY.readyOfficers().find(o => o.id === id); if (!o || ALLY.extra.some(x => x.officer === o)) return;
    const mates = ALLY.freeMates().sort((a, b) => (b.adv || 0) - (a.adv || 0)).slice(0, ALLY.MAX_MATES).map(p => p.id);
    ALLY.pick = {officerId: id, mateIds: mates};
  }
  if (typeof SFX !== 'undefined') SFX.play('pick');
  if (typeof renderTable === 'function') renderTable();
};
ALLY.toggleMate = function(id){
  if (!ALLY.pick) return;
  const i = ALLY.pick.mateIds.indexOf(id);
  if (i >= 0) ALLY.pick.mateIds.splice(i, 1);
  else if (ALLY.pick.mateIds.length < ALLY.MAX_MATES && ALLY.freeMates().some(p => p.id === id)) ALLY.pick.mateIds.push(id);
  if (typeof SFX !== 'undefined') SFX.play('pick');
  if (typeof renderTable === 'function') renderTable();
};
/* the pick resolved against the live roster; null when the officer is gone or busy */
ALLY.resolve = function(){
  const pk = ALLY.pick; if (!pk) return null;
  const officer = ALLY.readyOfficers().find(o => o.id === pk.officerId); if (!officer) return null;
  const mates = pk.mateIds.map(id => (META.roster || []).find(p => p.id === id && !p.resting && !p.away)).filter(Boolean);
  return {officer, mates};
};
/* every squad that would march now: the pick as seat 1, then the registered extras */
ALLY.marchers = function(){
  const out = [], pk = ALLY.resolve();
  if (pk) out.push({officer: pk.officer, mates: pk.mates, seat: 1, controller: 'ai', name: null});
  for (const x of ALLY.extra) if (x && x.officer) out.push(x);
  return out;
};
ALLY.countFor = list => 1 + list.length;   // squads that scale the field and the pay
ALLY.forces = function(){   // for COOP.odds: the host's squad then every marcher
  const leaderMates = (typeof MU !== 'undefined' && MU ? MU.ids : []).map(id => META.roster.find(p => p.id === id)).filter(Boolean);
  return [{officer: META.leader, mates: leaderMates, controller: 'host'}].concat(ALLY.marchers().map(m => ({officer: m.officer, mates: m.mates, controller: m.controller})));
};
ALLY.blockHTML = function(contract){
  const offs = ALLY.readyOfficers().filter(o => !ALLY.extra.some(x => x.officer === o)), pk = ALLY.pick && ALLY.resolve();
  const e = typeof esc === 'function' ? esc : s => String(s);
  if (!offs.length) return `<div id="ally-block" class="sub" style="margin-top:8px;font-size:14px;opacity:.8">Second squad: promote an officer on the Roster (the Command Tent must be built) to march a second squad beside your own.</div>`;
  let h = `<div id="ally-block" style="margin-top:8px;border-top:1px solid rgba(0,0,0,.25);padding-top:6px"><b>Second squad</b> `;
  h += `<select onchange="ALLY.setOfficer(this.value)" style="font:inherit;font-size:14px"><option value="">none: the Leader marches alone</option>`;
  for (const o of offs) h += `<option value="${o.id}" ${pk && pk.officer.id === o.id ? 'selected' : ''}>${e(o.name)} (${SPECS[o.spec] ? SPECS[o.spec].name : o.spec}, Level ${o.level || 1})</option>`;
  h += `</select>`;
  if (pk){
    const free = ALLY.freeMates();
    h += `<div class="sub" style="font-size:14px;margin-top:4px">With ${e(pk.officer.name)} (${pk.mates.length} / ${ALLY.MAX_MATES} mates; click to change):</div><div>`;
    for (const p of free.concat(pk.mates.filter(m => !free.includes(m)))) h += `<span class="marcher ${pk.mates.includes(p) ? 'on' : ''}" style="display:inline-block;margin:2px 4px 2px 0;padding:2px 6px;cursor:pointer;font-size:14px" onclick="ALLY.toggleMate(${p.id})">${e(p.name)}</span>`;
    h += `</div>`;
    try {
      const c = contract || (META.board && MU ? META.board[MU.contract] : null);
      if (c){
        const forces = ALLY.forces(), n = forces.length;
        const solo = COOP.odds(c, [forces[0]]), joint = COOP.odds(c, forces);
        const nk = ALLY.countFor(ALLY.marchers()), j = COOP.joint(c, nk), upkeep = pk.mates.length * COOP.DET_UPKEEP_PER_MATE;
        h += `<div class="sub" style="font-size:14px;margin-top:4px">${nk > 1 ? `Joint contract: pay ${j.pay}gp (x${COOP.k(nk)}, enemy to match)` : `Contract pay ${c.pay}gp (an AI squad does not change the enemy or the pay)`}, this squad's upkeep ${upkeep}gp. Odds together <b>${joint.label}</b>, alone ${solo.label}. [V] in the field cycles Follow / Hold / Advance.</div>`;
      }
    } catch (err) { h += `<div class="sub" style="font-size:14px">(odds unavailable: ${e(String(err.message || err))})</div>`; }
  }
  return h + `</div>`;
};
if (typeof renderTable === 'function'){ const f = renderTable;
  renderTable = function(){
    f();
    if (!ALLY.on) return;
    try { const box = typeof $ === 'function' && $('tbl-march'); if (!box || box.querySelector('#ally-block')) return;
      const div = document.createElement('div'); div.innerHTML = ALLY.blockHTML(); box.appendChild(div.firstChild); } catch (e) {}
  };
}
if (typeof toggleMuster === 'function'){ const f = toggleMuster;
  toggleMuster = function(id){ if (ALLY.pick){ const i = ALLY.pick.mateIds.indexOf(id); if (i >= 0) ALLY.pick.mateIds.splice(i, 1); } return f(id); };
}
if (typeof deploy === 'function'){ const f = deploy;
  deploy = function(){ ALLY.armed = ALLY.on && ALLY.marchers().length > 0; try { return f(); } finally { ALLY.armed = false; } };
}

/* ---- into the field ------------------------------------------------------- */
function mkUnit(p, s, officer, i, sq){
  const hp = Math.ceil(s.con * ALLY.HP_MULT);
  const kit = (window.ARM && ARM.kitOf && sq && sq.officer) ? ARM.kitOf(sq.officer) : null;   /* INDEX A32: the officer's own cards, else the Leader's */
  return {p, s, officer, sq, kit, x: 0, y: 0, hx: 0, hy: 0, hp, maxHp: hp, ac: (kit || G).armour.ac, shift: ((kit || G).armour.shift || 0), r: 10, objHp: true, seatAlly: true,
    state: 'up', timer: 30 + i * 9, atkT: 0, flash: 0, left: false, moving: false, wasDown: false, patched: false, patchT: 0, steer: 0, stuck: 0,
    spec: p.spec, anim: {left: false}, spr: personSprite(p, officer)};
}
/* spawn one squad round the Leader; o = {seat, controller, name, orders} */
ALLY.spawn = function(officer, mates, o){
  o = o || {};
  const L = G.leader, seat = o.seat || (squads().length + 1), k = seat - 1;
  const sq = {seat, officer, mates, units: [], orders: o.orders || 'follow', controller: o.controller || 'ai', name: o.name || null,
    off: {x: ALLY.FOLLOW.x - (k % 2 ? ALLY.SPREAD : 0) + (k >= 2 ? ALLY.SPREAD * 2 : 0), y: ALLY.FOLLOW.y + (k >= 2 ? 40 : 0)},
    anchor: {x: 0, y: 0}, kills: 0, overrun: false, dead: 0, hurt: 0, lines: null, split: null, share: null};
  sq.units = [mkUnit(officer, leaderStats(officer), true, 0, sq)].concat(mates.map((p, i) => mkUnit(p, mateStats(p), false, i + 1, sq)));
  const ax = L.x + sq.off.x, ay = L.y + sq.off.y; sq.anchor = {x: ax, y: ay};
  sq.units.forEach((u, i) => { const a = i / Math.max(1, sq.units.length - 1) * Math.PI * 2; u.x = u.hx = i ? ax + Math.cos(a) * ALLY.RING : ax; u.y = u.hy = i ? ay + Math.sin(a) * ALLY.RING : ay; });
  G.allies = G.allies || []; G.allies.push(sq); G.ally = squads()[0];
  note(sq.controller === 'guest' ? `${officer.name} brings ${sq.name || 'a friend'}'s squad: ${mates.length} mates.` : `${officer.name} brings ${seat === 1 ? 'the second' : 'another'} squad: ${mates.length} mates.${sq === ALLY.hostSquad() ? ' [V] cycles their orders.' : ''}`);
  ALLY.log.push({sec: 0, seat, officer: officer.name, mates: mates.length, controller: sq.controller, k: G.coop ? G.coop.k : 1});
  return sq;
};
/* COOP.seats rebuilt from the field: seat 0 the Leader, then every squad */
ALLY.seatsSync = function(){
  const seats = [COOP.create(0, 'leader', 'host', {officerId: META.leader && META.leader.id, mateIds: G.squad.map(m => m.p.id), orders: 'normal', contractId: G.contract.seed})];
  for (const sq of squads()) seats.push(COOP.create(sq.seat, sq.controller === 'guest' ? 'guest' : 'ally', sq.controller, {officerId: sq.officer.id, mateIds: sq.mates.map(p => p.id), orders: sq.orders, contractId: G.contract.seed, guest: sq.name ? {name: sq.name} : null}));
  COOP.seats = seats; return seats;
};
{ const f = startDeployment;
  startDeployment = function(contract, mateIds){
    const list = ALLY.on && ALLY.armed ? ALLY.marchers() : [], ok = list.length && contract && contract.obj !== 'brawl' && contract.obj !== 'drill' && (contract.pay > 0);
    // keep what the contract's own setup put in G.allies (story aux, camp-raid veterans, wall archers); clear only ALLY squads
    const auxOnly = () => (G.allies || []).filter(u => u && !u.units);
    if (!ok){ const r = f(contract, mateIds); if (G){ G.allies = auxOnly(); G.ally = null; } return r; }
    const saveA = COOP.active; COOP.active = ALLY.countFor(list);
    try { f(contract, mateIds); } finally { COOP.active = saveA; }
    try {
      G.allies = auxOnly(); G.ally = null;
      for (const m of list) ALLY.spawn(m.officer, m.mates.filter(p => !mateIds.includes(p.id)), m);
      ALLY.seatsSync(); ALLY.pick = null;
    } catch (e) { console.error('ALLY1 spawn', e); G.allies = auxOnly(); G.ally = null; }
  };
}

/* ---- orders --------------------------------------------------------------- */
ALLY.hostSquad = () => squads().find(sq => sq.controller === 'ai') || null;   // the squad [V] drives
ALLY.bySeat = seat => squads().find(sq => sq.seat === seat) || null;
ALLY.setOrdersFor = function(sq, o, quiet){
  if (!sq || !ALLY.ORDERS.includes(o)) return;
  const live = upIn(sq), c = live.length ? live[0] : sq.units[0];
  sq.orders = o;
  if (o === 'hold' || o === 'advance') sq.anchor = {x: c.x, y: c.y};
  const seat = COOP.seats.find(s => s.seatIndex === sq.seat); if (seat) seat.orders = o;
  if (!quiet){ pop(c.x, c.y - 30, ALLY.LABEL[o], ALLY.colour(sq.seat)); SFX.play('pick'); }
};
ALLY.setOrders = function(o, seat){ ALLY.setOrdersFor(seat ? ALLY.bySeat(seat) : ALLY.hostSquad(), o); };
ALLY.cycle = function(){ const sq = ALLY.hostSquad(); if (sq) ALLY.setOrdersFor(sq, ALLY.ORDERS[(ALLY.ORDERS.indexOf(sq.orders) + 1) % ALLY.ORDERS.length]); };
window.addEventListener('keydown', e => {
  if (!G || !squads().length || G.paused || G.over || e.repeat) return;
  if (e.key.toLowerCase() === ALLY.KEY) ALLY.cycle();
});

/* ---- the AI ----------------------------------------------------------------- */
function advanceGoal(sq){
  const out = []; try { contractMarkers(out); } catch (e) {}
  const goals = out.filter(m => m.kind === 'boss' || m.kind === 'vault' || m.kind === 'beacon');
  for (const c of (G.camps || [])) if (!c.done) goals.push({x: c.x, y: c.y});
  for (const v of (G.vaults || [])) if (!v.done) goals.push({x: v.x, y: v.y});
  let best = null, bd = 1e9;
  for (const g of goals){ const d = dist2(sq.anchor, g); if (d < bd){ bd = d; best = g; } }
  if (!best) for (const e of G.enemies) if (!e.dead){ const d = dist2(sq.anchor, e); if (d < bd){ bd = d; best = e; } }
  return best;
}
function updateSquad(sq){
  const L = G.leader, live = upIn(sq);
  if (sq.orders === 'follow'){ sq.anchor.x = L.x + sq.off.x; sq.anchor.y = L.y + sq.off.y; }
  else if (sq.orders === 'advance'){ const g = advanceGoal(sq); if (g){ const d = dist2(sq.anchor, g); if (d > 60){ sq.anchor.x += (g.x - sq.anchor.x) / d * ALLY.ADVANCE_SPD; sq.anchor.y += (g.y - sq.anchor.y) / d * ALLY.ADVANCE_SPD; } } }
  sq.units.forEach((u, i) => {
    if (u.flash > 0) u.flash--; if (u.atkT > 0) u.atkT--;
    if (u.state !== 'up'){
      if (u.state === 'down' && !u.patched && live.some(v => v !== u && dist2(v, u) < 30)){ if (++u.patchT >= ALLY.PATCH_S * 60){ u.state = 'up'; u.patched = true; u.hp = Math.ceil(u.maxHp / 2); pop(u.x, u.y - 20, 'PATCHED UP', '#8fd39a'); } }
      else u.patchT = Math.max(0, u.patchT - 1);
      return;
    }
    const a = i / Math.max(1, sq.units.length - 1) * Math.PI * 2;
    u.hx = i ? sq.anchor.x + Math.cos(a) * ALLY.RING : sq.anchor.x; u.hy = i ? sq.anchor.y + Math.sin(a) * ALLY.RING : sq.anchor.y;
    let tgt = null, bd = ALLY.ENGAGE * (u.seeK || 1);   /* LR34: a band's trait dials (u.seeK, u.spdK, u.reachX, u.rangeX), unset for every other squad */
    for (const e of G.enemies){ if (e.dead || (e.dormant && sq.orders !== 'advance')) continue; const d = Math.min(dist2(e, u), dist2(e, {x: u.hx, y: u.hy}) + 40); if (d < bd){ bd = d; tgt = e; } }
    if (window.F33 && F33.seatMark){ const m = F33.seatMark(sq, u); if (m) tgt = m; }   // F-33 step 8: a guest's mark comes first
    if (tgt && tgt.dormant && dist2(tgt, u) < 120) wake(tgt);
    const ranged = u.spec === 'FOLK_HERO' || u.spec === 'MAGE' || u.spec === 'WITCH';
    const goal = tgt ? {x: tgt.x, y: tgt.y} : {x: u.hx, y: u.hy}, want = tgt ? (ranged ? 180 + (u.rangeX || 0) : 38 + (u.reachX || 0)) : 4;
    let dx = goal.x - u.x, dy = goal.y - u.y, d = Math.hypot(dx, dy) || 1;
    const cm = cellAt(u.x, u.y), terr = SLOW[cm] || 1;
    const far = dist2(u, {x: u.hx, y: u.hy});
    let spd = Math.max(3, (u.s.move || 4) + ((u.kit || G).armour.mv || 0)) * PX_PER_MOVE * 1.05 * terr * (!tgt && far > 160 ? 1.4 : 1) * (u.spdK || 1);
    if (d > want){
      let sx = dx / d, sy = dy / d;
      if (!clearLine(u, goal, 12)){
        const fd = sq.orders === 'follow' && !tgt ? flowDir(G.fflow || G.flow, u.x, u.y) : null;
        if (fd){ sx = fd.x; sy = fd.y; }
        else { if (u.stuck++ % 40 === 0) u.steer = u.steer ? 0 : (u.stuck % 80 < 40 ? 1 : -1); const ang = Math.atan2(sy, sx) + u.steer * Math.PI / 3; sx = Math.cos(ang); sy = Math.sin(ang); }
      } else u.stuck = 0;
      const bx = u.x, by = u.y;
      u.x += sx * spd; u.y += sy * spd; u.left = sx < 0; u.moving = true;
      if (typeof blockedXY === 'function' && blockedXY(u.x, u.y)){ u.x = bx; u.y = by; u.stuck += 5; }
    } else u.moving = false;
    collide(u, 9);
    if (tgt && --u.timer <= 0){
      u.left = tgt.x < u.x; u.atkT = 12;
      if (dist2(u, tgt) < 50 + (u.reachX || 0)){ strike(tgt, u.s.melee + (u.officer ? 1 : 0), (u.kit || G).melee.dmg, {from: u}); u.timer = 52; fxArc(u, tgt); }
      else if (ranged && dist2(u, tgt) < 300 + (u.rangeX || 0)){ const ang = Math.atan2(tgt.y - u.y, tgt.x - u.x);
        G.shots.push({by: u, x: u.x, y: u.y - 6, vx: Math.cos(ang) * 9, vy: Math.sin(ang) * 9, life: 60, kind: u.spec === 'FOLK_HERO' ? 'arrow' : 'missile', target: tgt, skill: u.s.ranged + (u.officer ? 1 : 0), dmg: (u.kit || G).ranged.dmg, flat: 0}); u.timer = 60; }
      else u.timer = 10;
    }
  });
  if (!live.length && !sq.overrun){ sq.overrun = true; note(`${sq.officer.name}'s squad is down. Stand by them to patch them up.`); }
}
ALLY.update = function(){
  if (!ALLY.on) return;
  for (const sq of squads()) updateSquad(sq);
  if (G.frame % 600 === 0) for (const sq of squads()) ALLY.log.push({sec: G.sec, seat: sq.seat, orders: sq.orders, up: upIn(sq).length, of: sq.units.length});
};
{ const f = updateContract; updateContract = function(){ const r = f(); if (G && squads().length) { try { ALLY.update(); } catch (e) { if (!ALLY._err){ ALLY._err = e; console.error('ALLY1 update', e); } } } return r; }; }

/* ---- being hit ------------------------------------------------------------- */
{ const f = creditKill;   // kills by a squad count for it (an officer's for the officer, not the Leader)
  creditKill = function(e){ const u = e.lastBy; if (u && u.seatAlly && u.sq){ u.sq.kills++; if (u.officer){ u.p.kills = (u.p.kills || 0) + 1; return; } } return f(e); };
}
function allyDown(u){
  u.state = 'down'; u.hp = 0; u.wasDown = true; u.patchT = 0;
  pop(u.x, u.y - 20, u.p.name.toUpperCase() + ' DOWN', '#ff8a7a'); SFX.play('down');
}
{ const f = objTarget;
  objTarget = function(e){
    if (squads().length){ let best = null, bd = 200;
      for (const u of allUnits()) if (u.state === 'up'){ const d = dist2(e, u); if (d < bd){ bd = d; best = u; } }
      if (best && bd < dist2(e, G.leader)) return best; }
    return f(e);
  };
}
{ const f = damageObjective; damageObjective = function(t, d){ f(t, d); if (t.seatAlly && t.state === 'up' && t.hp <= 0) allyDown(t); }; }
{ const f = shotHitsObjective;
  shotHitsObjective = function(s){
    if (squads().length) for (const u of allUnits()) if (u.state === 'up' && Math.hypot(u.x - s.x, u.y - 6 - s.y) < 12){ damageObjective(u, Math.max(1, damageRoll(s.dmg || 2, u.shift) - 1)); return true; }
    return f(s);
  };
}

/* ---- drawing ----------------------------------------------------------------- */
{ const f = contractBodies;
  contractBodies = function(bodies, onScreen){
    f(bodies, onScreen);
    if (!squads().length) return;
    for (const u of allUnits()) if (onScreen(u)) bodies.push({y: u.y, custom: () => {
      const col = ALLY.colour(u.sq.seat);
      if (u.state !== 'up'){ drawDowned(u.spr, u.x, u.y, 2.4, 0.8); ctx.fillStyle = col; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('DOWN', u.x, u.y + 26); return; }
      ctx.beginPath(); ctx.ellipse(u.x, u.y + 17, 14, 5, 0, 0, TAU); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      const frame = u.atkT > 0 ? 3 : u.moving ? 1 + ((G.frame / 9 | 0) % 2) : 0;
      if (typeof drawUnit3 === 'function') drawUnit3(u, u.spr, u.x, u.y, 2.4, frame, u.left, u.flash > 0); else drawSprite(u.spr, u.x, u.y, 2.4, frame, u.left, u.flash > 0);
      for (let i = 0; i < u.maxHp; i++){ ctx.fillStyle = i < u.hp ? col : 'rgba(0,0,0,.45)'; ctx.fillRect(u.x - u.maxHp * 2 + i * 4, u.y + 22, 3, 3); }
      ctx.fillStyle = col; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
      ctx.fillText(u.p.name + (u.officer ? (u.sq.name ? ' (' + u.sq.name + ')' : u.sq.seat === 1 ? ' (2nd squad)' : ' (squad ' + (u.sq.seat + 1) + ')') : ''), u.x, u.y - 30); }});
  };
}
{ const f = contractMarkers; contractMarkers = function(out){ f(out); if (G.allies) for (const u of allUnits()) if (u.state === 'up') out.push({x: u.x, y: u.y, kind: 'ally'}); }; }
ALLY.hudLine = function(sq){
  const n = sq.units.length, l = upIn(sq).length;
  const who = sq.controller === 'guest' ? `${(sq.name || 'FRIEND').toUpperCase()}: ${sq.officer.name.toUpperCase()}` : `${sq.seat === 1 ? '2ND SQUAD' : 'SQUAD ' + (sq.seat + 1)}  ${sq.officer.name.toUpperCase()}`;
  return `${who}  ·  ${ALLY.LABEL[sq.orders]}${sq === ALLY.hostSquad() ? ' [V]' : ''}  ·  ${l} / ${n} UP`;
};
{ const f = drawHUD;
  drawHUD = function(){
    f();
    if (!G || !squads().length || G.obj === 'brawl') return;
    try { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left'; ctx.font = 'bold 12px Georgia';
      let y = window.DECK ? VH - DECK.H - 10 : VH - 46;   /* INDEX HD1: above the Deck's band */
      for (const sq of squads()){ ctx.fillStyle = upIn(sq).length ? ALLY.colour(sq.seat) : '#ff8a7a'; ctx.fillText(ALLY.hudLine(sq), 28, y); y -= 16; }
      ctx.restore(); } catch (e) {}
  };
}

/* ---- the debrief ------------------------------------------------------------ */
function settleSquad(sq, c, good){
  const lines = [], e = typeof esc === 'function' ? esc : s => String(s), tag = sq.name ? `of ${e(sq.name)}'s squad` : sq.seat === 1 ? 'of the second squad' : `of squad ${sq.seat + 1}`;
  let dead = 0, hurt = 0, koCaptain = false;
  for (const u of sq.units){
    const p = u.p;
    let alive = u.state === 'up';
    if (!alive && u.officer && p.guestCaptain){ koCaptain = true; lines.push(`<p>${e(p.name)}, the visiting captain, is knocked out and carried off; a guest's captain never dies here.</p>`); continue; }
    if (!alive){
      if (good){ alive = true; lines.push(`<p>${e(p.name)} ${tag} is carried off the field.</p>`); }
      else { const r = d6(); if (r >= 4){ alive = true; lines.push(`<p>${e(p.name)} ${tag} crawls out alive (Bleeding Out roll ${r}).</p>`); }
             else lines.push(`<p class="bad">${e(p.name)} ${tag} is left behind and does not come home (Bleeding Out roll ${r}).</p>`); }
    }
    if (!alive){
      dead++;
      if (p.guestMate){ lines.push(`<p class="bad">${e(p.name)} was ${e(sq.name || 'the guest')}'s mate; the loss is theirs to record.</p>`); continue; }
      META.memorial = META.memorial || []; META.memorial.push(graveEntry(p, false, sq.seat === 1 ? 'Fell with the second squad' : `Fell with ${sq.officer.name}'s squad`, c));
      if (u.officer){ META.officers = (META.officers || []).filter(o => o.id !== p.id); lines.push(`<p class="bad"><b>${e(p.name)}, officer, is dead.</b> The squad brought back the cloak.</p>`);
        if (window.ARM && ARM.loseOfficer) ARM.loseOfficer(p, lines);   /* INDEX A32: the cards go with them */ }
      else META.roster = META.roster.filter(q => q.id !== p.id);
      continue;
    }
    if (p.guestMate || p.guestCaptain) continue;   // a guest's people are the guest's save, not this one; mates lent by the host stay the host's
    p.deployments = (p.deployments || 0) + 1;
    if (u.wasDown){ hurt++; const r = injuryCheck(u.maxHp, p.name, lines); if (r === 'rest') p.resting = 1; else if (r){ p.injuries = p.injuries || []; p.injuries.push(r); } }
  }
  sq.dead = dead; sq.hurt = hurt; sq.koCaptain = koCaptain; sq.lines = lines;
  const seat = COOP.seats.find(s => s.seatIndex === sq.seat); if (seat) seat.result = {outcome: good ? 'win' : 'fail', dead, hurt};
}
ALLY.settle = function(result){
  const c = G.contract, good = result === 'victory' || result === 'withdrawn', e = typeof esc === 'function' ? esc : s => String(s), list = squads();
  for (const sq of list) settleSquad(sq, c, good);
  let split = null;
  if (good && list.length && c.pay > 0){
    const seats = COOP.seats.length === list.length + 1 ? COOP.seats : ALLY.seatsSync();
    split = COOP.splitPay(c, seats, {sizes: [G.squad.length + 1].concat(list.map(sq => sq.units.length))});
    c.payJoint = c.pay; c.pay = split.host;
    list[0].lines.push(`<p>${c.joint ? `Joint contract ${c.payJoint}gp (x${c.jointK || COOP.k(list.length + 1)})` : `Contract ${c.payJoint}gp`}; after ${list.length > 1 ? "the squads'" : "the squad's"} upkeep${split.cuts ? " and the visiting captains' cuts" : ''} the Chapter keeps ${split.host}gp.</p>`);
  }
  for (const sq of list){
    const who = sq.name ? `${e(sq.name)}'s squad under ${e(sq.officer.name)}` : `${sq.seat === 1 ? 'The second squad' : 'Squad ' + (sq.seat + 1)} under ${e(sq.officer.name)}`;
    sq.lines.push(`<p>${who}: ${sq.kills} kills; ${sq.dead ? sq.dead + ' dead, ' : ''}${sq.hurt ? sq.hurt + ' hurt.' : sq.dead ? '' : 'all home.'}${good ? '' : ' They came home with nothing.'}</p>`);
    sq.split = split; sq.share = split ? split.seats.find(s => s.seatIndex === sq.seat) || null : null;
  }
  G.allySettled = true;
  ALLY.log.push({sec: G.sec, settle: result, dead: list.reduce((a, s) => a + s.dead, 0), host: split && split.host, upkeep: split && split.upkeep, cuts: split && split.cuts});
};
{ const f = endDeployment;
  endDeployment = function(result){
    if (G && squads().length && !G.over && !G.allySettled){ try { ALLY.settle(result === 'withdrawn' && progress() < 0.5 ? 'fled' : result); } catch (e) { console.error('ALLY1 settle', e); G.allySettled = true; for (const sq of squads()) sq.lines = [`<p class="bad">The squad's return could not be reckoned (${e.message}).</p>`]; } }
    return f(result);
  };
}
{ const f = contractDebrief; contractDebrief = function(c, r, lines){ f(c, r, lines); if (G && G.allies) for (const sq of squads()) if (sq.lines) lines.push(...sq.lines); }; }

/* ---- self-test -------------------------------------------------------------- */
ALLY.selfTest = function(){
  const fails = [], ok = (name, cond) => { if (!cond) fails.push(name); };
  ok('orders cycle', ALLY.ORDERS[(ALLY.ORDERS.indexOf('advance') + 1) % 3] === 'follow');
  ok('wrappers', typeof objTarget === 'function' && typeof updateContract === 'function' && typeof endDeployment === 'function');
  const savePick = ALLY.pick, saveExtra = ALLY.extra;
  ALLY.pick = null; ALLY.extra = [];
  ok('no pick resolves null', ALLY.resolve() === null && ALLY.marchers().length === 0);
  ok('block html string', typeof ALLY.blockHTML() === 'string');
  ALLY.extra = [{officer: {id: -1, name: 'Test'}, mates: [], seat: 2, controller: 'guest', name: 'Pat'}];
  ok('extra marches as seat 2', ALLY.marchers().length === 1 && ALLY.marchers()[0].seat === 2);
  ALLY.pick = savePick; ALLY.extra = saveExtra;
  ok('coop seat table', COOP.table(2, ['leader', 'ally']).length === 2);
  const split = COOP.splitPay({pay: 480, tier: 1, joint: true}, [COOP.create(0, 'leader', 'host'), COOP.create(1, 'ally', 'ai')], {sizes: [5, 5]});
  ok('ally split: host 380 after the 25% dividend and upkeep', split.host === 380 && split.cuts === 60 && split.upkeep === 40);
  ok('an AI squad counts toward the joint contract', ALLY.countFor([{controller: 'ai'}]) === 2 && ALLY.countFor([{controller: 'guest'}, {controller: 'ai'}]) === 3);
  const three = COOP.splitPay({pay: 1152, tier: 1, joint: true}, [COOP.create(0, 'leader', 'host'), COOP.create(1, 'ally', 'ai'), COOP.create(2, 'guest', 'guest')], {sizes: [4, 4, 4]});
  ok('guest cut 40%, AI squad dividend 25%', three.seats[2].cut === Math.round(384 * COOP.CAPTAIN_CUT) && three.seats[1].cut === 96 && three.cuts === three.seats[1].cut + three.seats[2].cut);
  ok('key free', ALLY.KEY === 'v');
  ok('colours', ALLY.colour(1) !== ALLY.colour(2));
  return {ok: !fails.length, fails, info: 'orders, wrappers, table block, extras, split, guest cut'};
};
})();
