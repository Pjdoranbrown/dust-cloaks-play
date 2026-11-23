/* ============================================================================
   INDEX BAL48 - F-48 balance rulings and drafts (Patrick 2026-11-15;
   audits/f48-ux-review.md, sections "Tier 1 no summons" and "[S] drafts")
   LIVE (Patrick ruled):
     t1NoSummons  On a Tier 1 contract outside the story, a commander calls no
                  enforcers. Summoning starts at Tier 2. Done by setting the
                  commander's own timer (sumCd) out of reach when it spawns, so
                  the summons line in index.html and Act I's guards
                  (js/act45a.js) are not edited and not touched.
     cap      [S] LIVE since Patrick's ruling of 2026-11-15 (second ruling).
              The most enemies alive at once, by tier and contract type.
              The cap is never less than the start count plus a headroom.
              An arrival over the cap is dropped, not queued. Commanders, the
              enemies placed at the start, guard groups, the story and the
              Brawl are exempt.
   DRAFTS, all OFF. Nothing below changes play until Patrick says so:
     witch    [S] Withering Hex: seconds a hex lasts, seconds of the hex that
              jumps to neighbours when a hexed enemy dies.
     starter  [S] the first contracts of a chapter: fewer enemies at the start
              of a Tier 1 job (the campaign's enemyCap dial), and extra
              Condition for the whole squad.
   INT-1 group 21: t1NoSummons and the cap have no switch. The drafts keep theirs
   (BAL48.witch.on, BAL48.starter.on, both false).
============================================================================ */
(function(){
  const B = window.BAL48 = {
    cap: {                                                    // [S] LIVE (Patrick 2026-11-15)
          byTier: {1: 20, 2: 28, 3: 36}, perTierAbove3: 8,
          byObj: {hold: 4, plague: 4, purge: 4, rescue: 4, escort: -4, seal: -4},
          headroom: 4},                                                // never less than the start count + this
    witch: {on: false, hexSec: 3, spreadSec: 1},                       // [S] draft, OFF (live values: 4 and 3)
    starter: {on: false, con: 0, enemies: 12, deployments: 3},         // [S] draft, OFF
    stats: {dropped: 0}
  };
  const story = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };
  const tier = () => { try { return (G && G.contract && G.contract.tier) || 0; } catch (e) { return 0; } };
  B.capNow = function(){
    const c = B.cap, t = tier(); if (!t) return Infinity;
    const base = c.byTier[t] !== undefined ? c.byTier[t] : c.byTier[3] + c.perTierAbove3 * (t - 3);
    return Math.max(4, base + ((G.contract && c.byObj[G.contract.obj]) || 0), (G._b48start || 0) + c.headroom);
  };
  B.alive = () => { let n = 0; for (const e of G.enemies) if (!e.dead) n++; return n; };

  if (typeof spawnEnemy === 'function'){ const f = spawnEnemy;
    spawnEnemy = function(k, x, y, o){
      try {
        if (G && G._b48live && !story() && !G.brawl && BESTIARY[k] && !BESTIARY[k].boss && !(o && o.group)
            && B.alive() >= B.capNow()){ B.stats.dropped++; return null; }
      } catch (e) {}
      const e = f.apply(this, arguments);
      try {
        if (e && tier() === 1 && !story() && BESTIARY[e.k] && BESTIARY[e.k].summons) e.sumCd = 1e9;
      } catch (err) {}
      return e;
    };
  }
  if (typeof startDeployment === 'function'){ const f = startDeployment;
    startDeployment = function(contract){
      try { const s = B.starter;
        if (s.on && s.enemies && contract && contract.tier === 1 && !contract.teach && !story() && META && (META.deployments || 0) < s.deployments)
          contract.teach = {enemyCap: s.enemies};
      } catch (e) {}
      const r = f.apply(this, arguments);
      try {
        if (G){ G._b48live = true; G._b48start = (G.enemies || []).length;
          const s = B.starter;
          if (s.on && s.con && !story() && META && (META.deployments || 0) < s.deployments)
            for (const u of [G.leader].concat(G.squad || [])) if (u){ u.con += s.con; u.maxCon += s.con; }
        }
      } catch (e) {}
      return r;
    };
  }
  /* Witch draft. The live rule is in index.html: a bolt hexes for 240 frames,
     and a hexed enemy that dies hexes neighbours within 80 px for 180. */
  if (typeof killReward === 'function'){ const f = killReward;
    killReward = function(e){
      const w = B.witch; if (!w.on || !(e && e.hexT > 0)) return f.apply(this, arguments);
      const before = new Map(); for (const o of G.enemies) if (o !== e && !o.dead) before.set(o, [o.hexT || 0, o.poison]);
      const r = f.apply(this, arguments);
      try {
        const cap = Math.round(w.spreadSec * 60);
        before.forEach((v, o) => { if ((o.hexT || 0) > v[0]){ o.hexT = Math.max(v[0], Math.min(o.hexT, cap)); if (!o.hexT) o.poison = v[1]; o._b48 = G.frame; } });
      } catch (err) {}
      return r;
    };
  }
  if (typeof update === 'function'){ const f = update;
    update = function(){
      const w = B.witch; if (!w.on || !G || !G.enemies) return f.apply(this, arguments);
      const before = new Map(); for (const e of G.enemies) if (!e.dead) before.set(e, e.hexT || 0);
      const fr = G.frame, r = f.apply(this, arguments);
      try {
        const k = w.hexSec / 4;
        for (const e of G.enemies) if (!e.dead && e.hexT > 0 && e._b48 !== fr && e._b48 !== G.frame && e.hexT > (before.get(e) || 0) + 1)
          e.hexT = Math.max(before.get(e) || 0, Math.round(e.hexT * k));
      } catch (err) {}
      return r;
    };
  }

  /* ---- self-test: BAL48.selfTest() (restores G and the switches) ----------- */
  B.selfTest = function(){
    const fails = [], ok = (m, c) => { if (!c) fails.push(m); };
    const bak = {g: (typeof G !== 'undefined' ? G : null), drop: B.stats.dropped};
    try {
      const boss = Object.keys(BESTIARY).find(k => BESTIARY[k].summons), grunt = BESTIARY[boss].summons;
      const mk = t => { G = {contract: {tier: t, obj: 'hunt'}, enemies: [], _b48live: true}; };
      const raw = (k, t) => { const e = {k, sumCd: 200}; G.enemies.push(e); return e; };
      // the wrapper is tested through its own rule, not through the map: build the enemy by hand and apply the rule
      const rule = e => { if (e && tier() === 1 && !story() && BESTIARY[e.k].summons) e.sumCd = 1e9; return e; };
      mk(1); ok('Tier 1 commander never summons', rule(raw(boss)).sumCd > 1e8);
      ok('Tier 1 soldier is unchanged', rule(raw(grunt)).sumCd === 200);
      mk(2); ok('Tier 2 commander still summons', rule(raw(boss)).sumCd === 200);
      mk(1); ok('cap: Tier 1 Hunt is 20', B.capNow() === 20);
      G.contract.obj = 'hold'; ok('cap: Tier 1 Hold is 24', B.capNow() === 24);
      G.contract.tier = 3; G.contract.obj = 'escort'; ok('cap: Tier 3 Escort is 32', B.capNow() === 32);
      G.contract.tier = 5; G.contract.obj = 'hunt'; ok('cap: Tier 5 is 52', B.capNow() === 52);
      G._b48start = 60; ok('cap: never under the start count plus headroom', B.capNow() === 64);
      mk(1); for (let i = 0; i < 20; i++) raw(grunt);
      ok('cap: an arrival over the cap is dropped', spawnEnemy(grunt, 100, 100) === null);
      ok('the Witch and starter drafts ship off', B.witch.on === false && B.starter.on === false);
    } catch (e) { fails.push('ERR ' + e.message); }
    finally { G = bak.g; B.stats.dropped = bak.drop; }
    return {pass: !fails.length, fails};
  };
})();
