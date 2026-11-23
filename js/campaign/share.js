(function(){
'use strict';
/* ============================================================================
   INDEX SHARE34 (js/campaign/share.js) - SHARE34 [S]: allied squads take a share of pay and loot (Patrick chose A, 2026-11-13; draft in
   audits/campaign-teach.md, Scope (3)). On since 2026-11-13 (Patrick), the Long Road band (lent gear, guard order) too; the story loop is js/campaign/long-road.js.
   No switch (its on, bands and extra switches were removed in INT-1, 2026-11-15). Every number is a draft.
   1. An AI squad always scales the contract (ALLY.countFor counts every squad).
   2. The squad keeps a dividend of its size-share: 25% a company officer's squad, 25% a hired band (sq.band; was 50%, Patrick 2026-11-14), then the approved
      upkeep. Gold only: the contract pay (COOP.splitPay) and the loot gold (coin carried, salvage; settled in endDeployment).
   3. JOINT offers: SHARE34.jointOffer(base, officerLevel) -> a contract at pay x k x 1.25, up to one tier above the Leader's gate when
      the officer meets that tier's gate, flagged for one extra objective (SHARE34.addObjective after startDeployment: a Hunt gets one more
      camp, a Rescue one more cage, an Extract one more strongbox; other objectives get the scaled field only).
   4. Bands with lent gear: SHARE34.band(id, kit) builds a captain's officer record (level 4, loadout = the lent kit) and four mates, spawns
      them as an ALLY squad flagged band; the field reads the captain's cards through ARM.kitOf (the story switches ARM off, so kitOf is
      allowed for a band captain while SHARE34 is on). SHARE34.recall(sq) returns the cards (loadout back to bare).
   Test: SHARE34.selfTest().
============================================================================ */
{
  const SH = window.SHARE34 = {rate: {company: 0.25, band: 0.25}, hazard: 0.25, tierUp: 1, guardEngage: 220, log: []};   /* Patrick 2026-11-13: parts 1 and 2 ON; the Long Road lent-gear band ON too, same day ("turn it on"). Hired band share 0.50 to 0.25 (Patrick 2026-11-14, from the 8-run sim: gold +19% T1, +39% T2, no cost in wins); rollback rate.band = 0.50 */
  const r5 = n => Math.round(n / 5) * 5;
  // 1. AI squads count toward the field and the pay: ALLY.countFor (js/combat/ally.js) counts every squad
  // 2. the dividend inside the pay split
  SH.rateOf = seat => { const sq = window.ALLY && ALLY.bySeat ? ALLY.bySeat(seat) : null; return sq && sq.band ? SH.rate.band : SH.rate.company; };
  if (window.COOP && COOP.splitPay){ const f = COOP.splitPay;
    COOP.splitPay = function(contract, seats, o){
      const r = f.apply(this, arguments);
      let host = 0, cuts = 0;
      for (const s of r.seats){
        if (s.seatIndex > 0 && s.controller === 'ai'){ s.cut = Math.round(s.share * SH.rateOf(s.seatIndex)); s.net = s.share - s.cut - s.upkeep; }
        cuts += s.cut; host += s.net;
      }
      r.host = host; r.cuts = cuts; return r;
    };
    // 3a. the hazard bonus on a JOINT offer
    const j = COOP.joint;
    COOP.joint = function(contract, n){
      const c = j.apply(this, arguments);
      if (contract && contract.jointOffer && c.joint > 1) c.pay = r5((c.basePay !== undefined ? c.basePay : c.pay) * c.jointK * (1 + SH.hazard));
      return c;
    };
  }
  // 3b. the offer: tier one above the gate when the second squad's officer meets that gate; one extra objective
  SH.tierFor = function(tier, leaderLevel, officerLevel){
    const gate = (window.DETACH && DETACH.TIER_GATE) || {1: 1, 2: 3, 3: 5}, fits = t => leaderLevel >= (gate[t] || 99);
    let t = tier; if (t < 3 && !fits(t + 1) && officerLevel >= (gate[t + 1] || 99) && SH.tierUp > 0) t = t + 1; return t;
  };
  SH.jointOffer = function(base, leaderLevel, officerLevel){
    const c = Object.assign({}, base), t = SH.tierFor(base.tier || 1, leaderLevel, officerLevel);
    if (t !== c.tier){ c.pay = Math.round((base.basePay || base.pay) * (TIER_PAY[t] / TIER_PAY[base.tier || 1])); c.tier = t; c.tierUp = true; }
    c.jointOffer = true; c.extraObjective = true; return c;
  };
  SH.addObjective = function(){
    if (!G || !G.contract || !G.contract.extraObjective) return null;
    const o = G.contract.obj, tier = G.contract.tier || 1, H = HOSTS[G.contract.host] || HOSTS.bandits, L = G.leader;
    const spot = (anchor) => { for (let i = 0; i < 40; i++){ const a = i / 40 * TAU + Math.random() * 0.3, d = 420 + (i % 5) * 60, x = anchor.x + Math.cos(a) * d, y = anchor.y + Math.sin(a) * d; if (!blockedXY(x, y) && Math.hypot(x - L.x, y - L.y) > 380) return {x, y}; } return null; };
    const garrison = (x, y, boss) => { const grp = GROUP++, pool = H.pools[tier]; if (boss){ const b = spawnEnemy(boss, x, y, {dormant: true, group: grp}); for (const gk of BESTIARY[boss].guards || []){ const a = Math.random() * TAU, d = rnd(40, 110); spawnEnemy(gk, x + Math.cos(a) * d, y + Math.sin(a) * d, {dormant: true, group: grp}); } return b; } for (let i = 0; i < 3 + tier; i++){ const a = Math.random() * TAU, d = rnd(30, 110); spawnEnemy(pool[Math.random() * pool.length | 0], x + Math.cos(a) * d, y + Math.sin(a) * d, {dormant: true, group: grp}); } return null; };
    if (o === 'hunt' && G.camps && G.camps.length){ const p = spot(G.camps[0]); if (!p) return null; const boss = (H.bosses[tier] || H.bosses[1])[0], c = {cx: p.x / CELL | 0, cy: p.y / CELL | 0, x: p.x, y: p.y, boss: null, done: false, idx: G.camps.length}; G.camps.push(c); c.boss = garrison(p.x, p.y, boss); SH.log.push({added: 'camp', tier}); return c; }
    if (o === 'rescue' && G.cages && G.cages.length){ const p = spot(G.cages[0]); if (!p) return null; const c = {x: p.x, y: p.y, prog: 0, open: false}; G.cages.push(c); garrison(p.x, p.y, null); SH.log.push({added: 'cage', tier}); return c; }
    if (o === 'extract' && G.vaults && G.vaults.length){ const p = spot(G.vaults[0]); if (!p) return null; const v = {x: p.x, y: p.y, claimed: 0, done: false, guarded: false}; G.vaults.push(v); garrison(p.x, p.y, null); SH.log.push({added: 'vault', tier}); return v; }
    return null;
  };
  // 2b. the dividend on loot gold (coin carried home and salvage), settled when the contract ends
  if (typeof endDeployment === 'function'){ const f = endDeployment;
    endDeployment = function(result){
      const live = G && !G.over && G.allies && window.ALLY && ALLY.hostSquad !== undefined;
      const t0 = live ? META.treasury : 0, sqs = live ? G.allies.filter(u => u && u.units) : [];
      const r = f.apply(this, arguments);
      try {
        if (live && sqs.length && (result === 'victory' || result === 'withdrawn') && G.contract){
          const D = window.DEBRIEF31, pay0 = G.contract.payJoint || G.contract.pay || 0;
          const loot = (G.coin || 0) + (D && D.salvage ? D.salvage : Math.round(pay0 * 0.10));
          const sizes = [G.squad.length + 1].concat(sqs.map(s => s.units.length)), tot = sizes.reduce((a, b) => a + b, 0);
          let div = 0; sqs.forEach((s, i) => { div += Math.round(loot * (sizes[i + 1] / tot) * (s.band ? SH.rate.band : SH.rate.company)); });
          if (div > 0){ META.treasury = Math.max(0, META.treasury - div); SH.log.push({loot, dividend: div}); if (typeof renderDebrief !== 'undefined' && renderDebrief.last && renderDebrief.last.lines) renderDebrief.last.lines.push('<p>The allied squad takes its share of the loot: <b>-' + div + 'gp</b>.</p>'); }
        }
      } catch (e) { console.warn('SHARE34 loot', e); }
      return r;
    };
  }
  // 4. bands with lent gear
  SH.band = function(id, kit, nights, o){   // o (optional): {race, name, n mates, spec of the mates, names: [mate names]}
    o = o || {}; const race = o.race || 'HUMAN';
    const off = makeLeader(race, 'FREEMAN', 'SOLDIER', o.name || 'Captain ' + id); off.id = 'band34:' + id; off.level = 4; off.band30 = id; off.loadout = Object.assign({}, kit);
    const mates = []; for (let i = 0; i < (o.n == null ? 4 : o.n); i++){ const m = makeMate(race, 'FREEMAN', o.spec || 'SOLDIER', (o.names && o.names[i]) || id + ' ' + (i + 1)); m.id = 'b34:' + id + ':' + i; m.guestMate = true; mates.push(m); }
    return {officer: off, mates, nights: nights || 3};
  };
  SH.spawnBand = function(b, o){ const sq = ALLY.spawn(b.officer, b.mates, Object.assign({seat: 2, controller: 'ai', orders: 'follow'}, o)); sq.band = true; return sq; };
  // 4b. the guard-the-column order [S]: the band holds the Column Zone and fights what comes within SH.guardEngage px of it
  SH.guard = sq => { if (sq){ sq.guard = true; sq.band = true; } return sq; };
  if (typeof updateContract === 'function'){ const f = updateContract;
    updateContract = function(){
      let keep = null;
      try {
        if (G && G.column && G.allies){
          for (const sq of G.allies) if (sq && sq.units && sq.guard){ sq.orders = 'hold'; sq.anchor = sq.anchor || {x: 0, y: 0}; sq.anchor.x = (G.camp || G.column).x; sq.anchor.y = (G.camp || G.column).y + 20; keep = keep === null ? ALLY.ENGAGE : keep; }
          if (keep !== null) ALLY.ENGAGE = SH.guardEngage;
        }
      } catch (e) {}
      try { return f.apply(this, arguments); } finally { if (keep !== null) ALLY.ENGAGE = keep; }
    };
  }
  SH.recall = function(sq){ if (sq && sq.officer){ sq.officer.loadout = (window.ARM && ARM.bare) ? ARM.bare() : {armour: 'rags', shield: 'none', melee: 'spears', ranged: 'shortbows', mount: 'nomount', kits: []}; } };
  if (window.ARM && ARM.kitOf){ const f = ARM.kitOf;     // the story switches ARM off; a band captain's lent cards still count
    ARM.kitOf = function(p, M){ if (p && p.band30 && p.loadout){ const M2 = Object.assign({}, M || (typeof META !== 'undefined' ? META : {}), {cp: null}); return f.call(this, p, M2); } return f.apply(this, arguments); };
  }
  SH.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      ok(ALLY.countFor([{controller: 'ai'}]) === 2, 'an AI squad counts');
      const seats = [COOP.create(0, 'leader', 'host', {mateIds: [1, 2, 3, 4]}), COOP.create(1, 'ally', 'ai', {officerId: 9, mateIds: [5, 6, 7, 8]})];
      const j = COOP.joint({pay: 300, tier: 1}, 2); const s = COOP.splitPay(j, seats, {sizes: [5, 5]});
      ok(j.pay === 480 && s.seats[1].share === 240 && s.seats[1].cut === 60 && s.host === 480 - 60 - 40, 'company squad: 25% dividend: ' + JSON.stringify([j.pay, s.seats[1].cut, s.host]));
      const jo = COOP.joint({pay: 300, tier: 1, jointOffer: true}, 2); ok(jo.pay === 600, 'joint offer: x1.6 x1.25 = 600, got ' + jo.pay);
      ok(SH.tierFor(1, 2, 4) === 2 && SH.tierFor(1, 2, 2) === 1 && SH.tierFor(1, 4, 6) === 1, 'tier one above the gate only when the officer meets it');
    } catch (e) { fails.push('error ' + e.message); }
    return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'count, dividend, hazard, tier gate'};
  };
}
/* END INDEX 86i */

})();
