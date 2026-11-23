/* ============================================================================
   INDEX SEAT1 - co-op seats and the scaling model (Fable job 7, phase 1)
   Design: docs/coop-seats.md (approved numbers, bible 2026-11-11). Findings:
   audits/fable/coop.md. Owner after handover: Systems (model), QA (sync).
   What it does:
   - the seat record (section 1 of the design) and its helpers;
   - the joint contract: pay and enemy threat x1.6 / 2.4 / 3.2 for 2 / 3 / 4
     squads; the Visiting Captain's cut (40% of that seat's share), auxilia
     upkeep by tier (15 / 20 / 30gp a militia mate), detachment upkeep
     (10gp a mate), the guest bank cap (150 / 340 / 675gp by the guest's tier);
   - real enemy scaling on the field by COOP.active (squads on the field):
     garrison guards, the opening wave and the wave bursts x k (same clock),
     through wrappers of startDeployment and hostWave (inert at one squad);
   - COOP.odds: the joint-force odds band (sum of seat powers at efficiency
     against the solo threat x the joint factor, the DETACH logistic).
   Nothing here changes a single-player game: COOP.active is 1 unless ALLY1
   or mp-coop sets it before startDeployment.
   ROLLBACK: remove this script tag (or COOP.on = false at runtime).
============================================================================ */
(function(){
'use strict';
const COOP = window.COOP = {
  on: true,
  JOINT: {1: 1, 2: 1.6, 3: 2.4, 4: 3.2},     // joint contract factor by squads: pay and enemy threat
  CAPTAIN_CUT: 0.40,                         // a Visiting Captain's cut of that seat's share leaves the host's payout
  AUX_UPKEEP: {1: 15, 2: 20, 3: 30},         // hired auxilia upkeep per militia mate, by contract tier
  DET_UPKEEP_PER_MATE: 10,                   // detachment and ally squads: upkeep per roster mate
  GUEST_CAP: {1: 150, 2: 340, 3: 675},       // a guest banks at most half a contract of the guest's tier
  GUEST_XP_TICK: 1, GUEST_CHRONICLE_LINES: 1,
  OFFICER_CAP_MP: 4,                         // seats on the table (no roll detachments in MP)
  READY_OVERRIDE_S: 30,                      // the host may start the march after 30 s of waiting
  PAY_PER_SEAT_TARGET: 0.8, SUCCESS_BAND: [86, 92],
  MAX_SEATS: 4,
  EFF: {host: 1, guest: 0.95, ai: 0.85, roll: 0.8},   // power efficiency of a seat by its controller
  active: 1,                                 // squads on the field this deployment (ALLY1 / mp-coop set it before startDeployment)
  seats: [],                                 // the table (one record per seat)
  log: []
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r5 = v => Math.round(v / 5) * 5;
const sig = x => 1 / (1 + Math.exp(-x));
COOP.k = n => COOP.JOINT[clamp(n || COOP.active || 1, 1, 4)] || 1;

/* ---- seat records (docs/coop-seats.md section 1) ---- */
COOP.create = function(seatIndex, kind, controller, o){
  o = o || {};
  return {
    seatIndex: clamp(seatIndex | 0, 0, 3), kind: kind || (seatIndex ? 'ally' : 'leader'), controller: controller || (seatIndex ? 'ai' : 'host'),
    guest: o.guest || null, officerId: o.officerId === undefined ? null : o.officerId, mateIds: (o.mateIds || []).slice(0, 4),
    contractId: o.contractId === undefined ? null : o.contractId, orders: o.orders || (seatIndex ? 'follow' : 'normal'), result: null,
    id: 'seat' + (seatIndex | 0)
  };
};
/* a table of n squads: seat 0 the host's leader, the rest AI allies until a guest or a detachment takes them */
COOP.table = function(n, kinds){
  const out = [];
  for (let i = 0; i < clamp(n | 0, 1, COOP.MAX_SEATS); i++) out.push(COOP.create(i, kinds && kinds[i], undefined));
  return out;
};
/* assign an officer and 2 to 4 mates to a seat; locks them with p.away = seat.id when the roster is at hand */
COOP.assign = function(seat, o){
  o = o || {};
  if (o.officerId !== undefined) seat.officerId = o.officerId;
  if (o.mateIds) seat.mateIds = o.mateIds.slice(0, 4);
  if (o.orders) seat.orders = o.orders;
  if (o.contractId !== undefined) seat.contractId = o.contractId;
  if (o.guest !== undefined){ seat.guest = o.guest; seat.controller = o.guest ? 'guest' : (seat.kind === 'detachment' ? 'roll' : 'ai'); }
  if (o.lock !== false && typeof META !== 'undefined' && META && META.roster) for (const p of META.roster) if (seat.mateIds.indexOf(p.id) !== -1) p.away = seat.id;
  return seat;
};
COOP.release = function(seat){
  if (typeof META !== 'undefined' && META && META.roster) for (const p of META.roster) if (p.away === seat.id) delete p.away;
  seat.mateIds = []; seat.officerId = null; return seat;
};
/* what goes over the wire: never the guest token */
COOP.toSnapshot = function(seat){
  const g = seat.guest ? {name: seat.guest.name, status: seat.guest.status, rejoinLeftS: seat.guest.rejoinLeftS || 0, captain: seat.guest.captain ? {name: seat.guest.captain.name, level: seat.guest.captain.level} : null} : null;
  return {seatIndex: seat.seatIndex, kind: seat.kind, controller: seat.controller, guest: g, officerId: seat.officerId, mateIds: seat.mateIds.slice(), contractId: seat.contractId, orders: seat.orders,
          result: seat.result ? {outcome: seat.result.outcome, payShare: seat.result.payShare, upkeep: seat.result.upkeep, xp: seat.result.xp} : null};
};
COOP.activeSeats = seats => (seats || COOP.seats).filter(s => s && s.controller !== 'roll' && (s.seatIndex === 0 || (s.mateIds && s.mateIds.length) || s.officerId !== null));

/* ---- the joint contract: pay x the joint factor (threat follows on the field) ---- */
COOP.joint = function(contract, n){
  n = clamp(n | 0, 1, 4);
  const c = Object.assign({}, contract);
  if (c.joint) { c.pay = c.basePay !== undefined ? c.basePay : c.pay; }
  c.basePay = c.pay;
  c.joint = n; c.jointK = COOP.k(n);
  if (n > 1){ c.pay = r5(c.basePay * c.jointK); c.big = true; }
  return c;
};

/* ---- pay: shares by squad size, then the captain's cuts and upkeep leave the host's payout ----
   splitPay(contract, seats, o) -> {total, host, cuts, upkeep, seats:[{seatIndex, kind, controller, size, share, cut, upkeep, net}]}
   o.sizes: squad size per seat (default mateIds.length + 1); o.aux: militia mates per seat (upkeep by tier);
   a seat whose result.outcome is dead, captured, lost or fled earns no share. */
COOP.splitPay = function(contract, seats, o){
  o = o || {};
  const tier = (contract && contract.tier) || 1;
  const total = Math.round(((contract && contract.pay) || 0) * (o.payMult || 1));
  const list = (seats || COOP.seats).map((s, i) => ({seatIndex: s.seatIndex, kind: s.kind, controller: s.controller,
    size: Math.max(1, (o.sizes && o.sizes[i]) || ((s.mateIds || []).length + 1)), aux: (o.aux && o.aux[i]) || 0, lost: !!(s.result && /dead|captured|lost|fled/.test(s.result.outcome || ''))}));
  const sizeSum = list.reduce((a, s) => a + (s.lost ? 0 : s.size), 0) || 1;
  let host = 0, cuts = 0, upkeep = 0, given = 0;
  const lastLive = list.map(s => !s.lost).lastIndexOf(true);
  list.forEach((s, i) => {
    s.share = s.lost ? 0 : Math.round(total * s.size / sizeSum);
    if (i === lastLive) s.share = total - given; given += s.share;
    s.cut = s.controller === 'guest' ? Math.round(s.share * COOP.CAPTAIN_CUT) : 0;
    s.upkeep = s.aux * (COOP.AUX_UPKEEP[tier] || COOP.AUX_UPKEEP[3]) + (s.seatIndex > 0 ? Math.max(0, s.size - 1 - s.aux) * COOP.DET_UPKEEP_PER_MATE : 0);   /* every seat beyond the Leader's pays mate upkeep (design section 4) */
    s.net = s.share - s.cut - s.upkeep;
    cuts += s.cut; upkeep += s.upkeep; host += s.net;
  });
  return {total, host, cuts, upkeep, seats: list};
};
/* the guest's reward receipt: the captain's cut, capped at half a contract of the guest's own tier; nothing when host and guest share a save */
COOP.guestOffer = function(cut, guestTier, o){
  o = o || {};
  const cap = COOP.GUEST_CAP[clamp(guestTier | 0, 1, 3)];
  if (o.sameSave) return {gold: 0, xpTick: 0, chronicleLine: 0, blocked: 'same save', cap};
  return {gold: Math.max(0, Math.min(cap, Math.round(cut || 0))), xpTick: COOP.GUEST_XP_TICK, chronicleLine: COOP.GUEST_CHRONICLE_LINES, blocked: null, cap};
};

/* ---- joint-force odds (the Systems model in .claude/coop-tune.js): powers summed at efficiency, threat x the joint factor ----
   forces: [{officer, mates, controller}] or seats (officerId / mateIds resolved by DETACH); contract: the solo contract. */
COOP.odds = function(contract, forces, orders){
  if (!window.DETACH || !DETACH.odds) return null;
  const list = (forces || COOP.seats).map(f => ({officer: f.officer !== undefined ? f.officer : f.officerId, mates: f.mates || f.mateIds || [], controller: f.controller || 'host'}));
  const n = clamp(list.length, 1, 4);
  let power = 0, threat = 0; const seats = [];
  for (const f of list){
    let r; try { r = DETACH.odds(f.officer, f.mates, contract, orders || 'normal'); } catch (e) { r = null; }
    const p = r ? r.power : 0, eff = COOP.EFF[f.controller] || 1;
    threat = r ? r.threat : threat; power += p * eff; seats.push({controller: f.controller, power: p, eff, pct: r ? r.pct : null});
  }
  const k = COOP.k(n), jointThreat = Math.round(threat * k * 100) / 100;
  const pct = Math.round(sig((power - jointThreat) * 0.12) * 100);
  const band = pct >= 80 ? 'Near certain' : pct >= 62 ? 'Likely' : pct >= 42 ? 'Even' : pct >= 25 ? 'Risky' : 'Desperate';
  return {pct, band, label: band + ' (about ' + pct + '%)', power: Math.round(power * 100) / 100, threat: jointThreat, soloThreat: threat, k, n, seats};
};

/* ---- the field: more of the enemy for more squads ---- */
COOP.fieldK = () => (COOP.on && COOP.active > 1) ? COOP.k(COOP.active) : 1;
function extraGarrisons(contract, k){
  if (!G || k <= 1 || typeof spawnEnemy !== 'function') return 0;
  let added = 0;
  const HST = HOSTS[contract.host] || HOSTS.bandits, guardPool = HST.pools[contract.tier] || HST.pools[1];
  for (const c of G.camps || []){
    const boss = c.boss; if (!boss) continue;
    const base = (BESTIARY[boss.k] && BESTIARY[boss.k].guards) || guardPool, extra = Math.round(base.length * (k - 1));
    for (let i = 0; i < extra; i++){ const a = Math.random() * TAU, d = rnd(40, 110);
      if (spawnEnemy(base[i % base.length], c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, {dormant: true, group: boss.group})) added++; }
  }
  for (const v of G.vaults || []){
    const near = G.enemies.find(e => e.dormant && Math.hypot(e.x - v.x, e.y - v.y) < 130), grp = near ? near.group : 0;
    const extra = Math.round((3 + contract.tier) * (k - 1));
    for (let i = 0; i < extra; i++){ const a = Math.random() * TAU, d = rnd(30, 120);
      if (spawnEnemy(guardPool[Math.random() * guardPool.length | 0], v.x + Math.cos(a) * d, v.y + Math.sin(a) * d, {dormant: true, group: grp})) added++; }
  }
  if (!['defend', 'siege', 'night', 'sortie'].includes(contract.obj)){
    const extra = Math.round(8 * (k - 1));
    for (let i = 0; i < extra; i++){ const a = i / extra * TAU + rnd(-.3, .3), d = rnd(250, 330);
      const p = {x: G.leader.x + Math.cos(a) * d, y: G.leader.y + Math.sin(a) * d}; if (!blockedXY(p.x, p.y) && spawnEnemy(HST.pools[1][0], p.x, p.y)) added++; }
  }
  return added;
}
if (typeof startDeployment === 'function'){ const f = startDeployment;
  startDeployment = function(contract, mateIds){
    const k = COOP.fieldK();
    if (k > 1 && !contract.joint){ const j = COOP.joint(contract, COOP.active); contract.basePay = j.basePay; contract.pay = j.pay; contract.joint = j.joint; contract.jointK = j.jointK; contract.big = true; }
    f(contract, mateIds);
    try {
      if (G){ G.coop = {n: COOP.active, k, added: 0}; if (k > 1){ G.coop.added = extraGarrisons(contract, k); COOP.log.push({sec: 0, n: COOP.active, k, added: G.coop.added, enemies: G.enemies.length}); } }
    } catch (e) { COOP.log.push({err: String(e)}); }
  };
}
if (typeof hostWave === 'function'){ const f = hostWave;
  hostWave = function(level){
    const w = f(level), k = COOP.fieldK();
    if (k > 1) w.burst = Math.round(w.burst * k);   /* the wave clock stays: throughput x k, as the threat target, not k squared */
    return w;
  };
}

/* ---- self-test (REG addons gate) ---- */
COOP.selfTest = function(){
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  const t = COOP.table(4); ok(t.length === 4 && t[0].kind === 'leader' && t[0].controller === 'host' && t[3].kind === 'ally' && t[3].controller === 'ai', 'table shape');
  const c1 = {pay: 300, tier: 1, obj: 'hunt', host: 'bandits'};
  const j2 = COOP.joint(c1, 2), j3 = COOP.joint(c1, 3), j4 = COOP.joint(c1, 4), j1 = COOP.joint(c1, 1);
  ok(j2.pay === 480 && j3.pay === 720 && j4.pay === 960 && j1.pay === 300 && j2.basePay === 300 && COOP.joint(j2, 3).pay === 720, 'joint pay 1.6 / 2.4 / 3.2');
  const seats2 = [COOP.create(0, 'leader', 'host', {mateIds: [1, 2, 3, 4]}), COOP.create(1, 'coop-march', 'guest', {mateIds: [5, 6, 7, 8], guest: {name: 'Ann', status: 'connected', token: 'abcdefghijkl'}})];
  const s = COOP.splitPay(j2, seats2);
  ok(s.total === 480 && s.seats[0].share === 240 && s.seats[1].share === 240 && s.seats[1].cut === 96 && s.seats[1].upkeep === 40 && s.host === 344 && s.cuts === 96 && s.upkeep === 40, 'split 2 seats, captain cut 40%, 10gp a mate: ' + JSON.stringify(s));
  ok(s.seats[0].share / 300 === 0.8, 'per-seat pay 0.8x solo');
  const ally = [COOP.create(0, 'leader', 'host', {mateIds: [1, 2, 3, 4]}), COOP.create(1, 'ally', 'ai', {officerId: 9, mateIds: [5, 6, 7]})];
  const sa = COOP.splitPay(j2, ally, {aux: [0, 2]});
  ok(sa.seats[1].size === 4 && sa.seats[0].share === 267 && sa.seats[1].share === 213 && sa.seats[1].upkeep === 2 * 15 + 1 * 10 && sa.seats[1].cut === 53 && sa.host === 480 - 40 - 53, 'ally upkeep: auxilia 15gp a mate at tier 1, 10gp a roster mate: ' + JSON.stringify(sa));
  const sb = COOP.splitPay(COOP.joint({pay: 1350, tier: 3}, 2), ally, {aux: [0, 3]}); ok(sb.seats[1].upkeep === 90, 'auxilia 30gp at tier 3');
  const lost = [COOP.create(0, 'leader', 'host', {mateIds: [1, 2, 3, 4]}), COOP.create(1, 'coop-march', 'guest', {mateIds: [5, 6, 7, 8]})]; lost[1].result = {outcome: 'captured'};
  const sl = COOP.splitPay(j2, lost); ok(sl.seats[1].share === 0 && sl.seats[0].share === 480 && sl.host === 480 - 40, 'a lost seat earns nothing (its upkeep is still owed)');
  const g = COOP.guestOffer(96, 1), g2 = COOP.guestOffer(500, 2), g3 = COOP.guestOffer(96, 1, {sameSave: true});
  ok(g.gold === 96 && g.xpTick === 1 && g.chronicleLine === 1 && g2.gold === 340 && g3.gold === 0 && g3.blocked, 'guest offer and cap');
  const snap = COOP.toSnapshot(seats2[1]); ok(snap.guest && snap.guest.name === 'Ann' && snap.guest.token === undefined && JSON.stringify(snap).indexOf('abcdefghijkl') === -1, 'snapshot hides the token');
  ok(COOP.k(1) === 1 && COOP.k(2) === 1.6 && COOP.k(3) === 2.4 && COOP.k(4) === 3.2 && COOP.k(9) === 3.2, 'joint factor table');
  const saveA = COOP.active; COOP.active = 1; const w1 = hostWave(3); COOP.active = 2; const w2 = hostWave(3); COOP.active = saveA;
  ok(w2.burst === Math.round(w1.burst * 1.6) && w2.rate === w1.rate && w1.pool.length === w2.pool.length, 'hostWave scales burst x k, same clock');
  if (window.DETACH && DETACH.odds && typeof META !== 'undefined' && META && META.leader){
    const o1 = COOP.odds(c1, [{officer: META.leader, mates: META.roster.slice(0, 4), controller: 'host'}]);
    const o2 = COOP.odds(c1, [{officer: META.leader, mates: META.roster.slice(0, 4), controller: 'host'}, {officer: META.leader, mates: META.roster.slice(0, 4), controller: 'ai'}]);
    ok(o1 && o2 && o1.k === 1 && o2.k === 1.6 && o2.threat > o1.threat && o2.power > o1.power && typeof o2.pct === 'number' && o2.band, 'joint odds: ' + JSON.stringify([o1 && o1.label, o2 && o2.label]));
  }
  return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'seat records, joint pay, split and cuts, guest cap, snapshot, wave scaling, odds'};
};
})();
