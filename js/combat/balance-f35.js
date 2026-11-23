
/* ============================================================================
   INDEX 87a - BAL35 [S]: the BAL-BOT balance changes (Patrick approved drafts 1 to 4, 2026-11-14; audits/bal-bot-results.md).
   ONE KILL SWITCH: BAL35.on = false puts every old number back at once (each part also has its own switch).
   1. Rescue: the freed hostages have 18 hp, not 6 (BAL35.hostage.hp), and at Tier 1 raiders only pick a hostage as a target within BAL35.hostage.t1Radius px (0: never; was 240). The bot's walking-hostage runs lost every hostage to raiders on the ~1500 px road.
   2. Hold at Tier 1: a third fewer raiders (BAL35.holdT1.k = 0.67 of the wave spawns are kept, bursts and the minimum field alike; the two
      commanders and the clock are unchanged). Target: the bot wins 40 to 50% at the starting kit (was about 15%).
      SW-9 (Patrick 2026-11-16, audits/f44-hold-t1.md): the factor goes by the Hold's length, BAL35.holdT1.byMin [S]: 2 min 0.67, 3 min 0.50,
      4 min 0.40 (the squad wore down at about 160 s whatever the length). Another length keeps BAL35.holdT1.k.
   3. DETACH.odds: FITTED, NOT WIRED (BAL35.liveForecast, BAL35.odds.fit). The shown percentage barely predicts a live fight (slope 0.3 to 0.4),
      so no offset can make "Near certain" mean 80% real; and DETACH.odds also drives the detachment rolls. Held for Patrick (audits/bal-bot-after.md).
   4. Tiers 2 and 3: about 15% softer. Plain wave spawns are thinned to 85% (garrisons, engines and other dormant spawns are never touched), and a commander's per-tier hit-point
      bonus is 0.51 a tier, not 0.60 (BAL35.tierSoft). Wave thinning applies to board contracts only (not the story fights).
   ROLLBACK: BAL35.on = false (or a part's own .on = false). Test: BAL35.selfTest().
============================================================================ */
{
  const K = window.BAL35 = {on: true,
    hostage: {on: true, hp: 18, t1Radius: 0},         /* t1Radius: at Tier 1 raiders pick a hostage only within this many px (0 = never; the old rule was 240) */
    holdT1: {on: true, k: 0.67, byMin: {2: 0.67, 3: 0.5, 4: 0.4}},   /* SW-9: the kept share by the Hold's minutes [S] */
    tierSoft: {on: true, k: 0.85, boss: 0.51, guard: {on: true, t2: 0.8, t3: 0.7, min: 2}},   /* guard: the second lever ([S] numbers; ON, Patrick 2026-11-15; rollback BAL35.tierSoft.guard.on = false): plain garrison guards thinned at T2/T3, never named, fixed, engine, nest or boss spawns, at least `min` kept a camp */
    odds: {on: false},                                  // part 3 is a fitted helper only (liveForecast), not wired into DETACH.odds: see audits/bal-bot-after.md
    boardObjs: ['hold', 'hunt', 'rescue', 'escort', 'extract', 'purge', 'assassinate', 'sabotage', 'beacons', 'relic', 'ambush', 'breach', 'quarry', 'plague', 'seal', 'trial'],
    log: {thinned: 0, kept: 0}};
  const live = () => K.on && typeof G !== 'undefined' && G && G.contract && K.boardObjs.includes(G.obj || G.contract.obj);
  // 1. hostage hp
  if (typeof updateContract === 'function'){ const f = updateContract;
    updateContract = function(){
      try { if (K.on && K.hostage.on && G && G.hostages) for (const h of G.hostages) if (!h.b35){ h.b35 = true; if (h.maxHp === 6){ h.hp = h.maxHp = K.hostage.hp; } } } catch (e) {}
      return f.apply(this, arguments);
    };
  }
  if (typeof objTarget === 'function'){ const f = objTarget;
    objTarget = function(e){
      const t = f.apply(this, arguments);
      try { if (t && K.on && K.hostage.on && G && G.contract && (G.contract.tier || 1) === 1 && G.hostages && G.hostages.includes(t) && dist(e, t) > K.hostage.t1Radius) return null; } catch (er) {}
      return t;
    };
  }
  K.holdT1F = min => (K.holdT1.byMin && K.holdT1.byMin[min]) || K.holdT1.k;
  const plainGuard = k => { try { const H = HOSTS[G.contract.host], pool = H && H.pools && H.pools[G.contract.tier || 1]; return !!(pool && pool.includes(k)); } catch (e) { return false; } };
  // 2 and 4. thinned wave spawns (no position given = a wave or the minimum field); softer commanders (garrisons and dormant spawns are never thinned)
  if (typeof spawnEnemy === 'function'){ const f = spawnEnemy;
    spawnEnemy = function(k, x, y, o){
      try {
        if (live() && BESTIARY[k] && !BESTIARY[k].boss){
          const tier = G.contract.tier || 1; let keep = 1;
          const wave = x === undefined && !(o && (o.dormant || o.group));   /* only plain wave spawns: dormant and grouped spawns (engines, ballistae, garrisons) are never thinned, their callers use the result */
          if (wave && tier === 1 && G.obj === 'hold' && K.holdT1.on) keep = K.holdT1F(G.contract.minutes);
          else if (wave && tier >= 2 && K.tierSoft.on) keep = K.tierSoft.k;
          const gd = K.tierSoft.guard;
          if (keep === 1 && gd.on && tier >= 2 && o && o.dormant && o.group && !o.home && !o.noNem && !o.name && BESTIARY[k].arch !== 'fixed' && k !== 'engine' && k !== 'nest' && plainGuard(k)){
            G.b35g = G.b35g || {}; const n = G.b35g[o.group] = (G.b35g[o.group] || 0) + 1;
            if (n > gd.min) keep = tier >= 3 ? gd.t3 : gd.t2;
          }
          if (keep < 1){ if (Math.random() > keep){ K.log.thinned++; return null; } K.log.kept++; }
        }
      } catch (e) {}
      const e = f.apply(this, arguments);
      try {
        if (e && K.on && K.tierSoft.on && BESTIARY[e.k] && BESTIARY[e.k].boss && !e.nemesis && G && G.contract){
          const B = BESTIARY[e.k], up = (G.contract.tier || 1) - (B.tier || 1);
          if (up > 0) e.con = e.maxCon = Math.round(B.con * (1 + K.tierSoft.boss * up));
        }
      } catch (er) {}
      return e;
    };
  }
  // 3. the odds fit (BAL-BOT, 6,888 contracts): a pure helper, NOT wired in. real win % ~ sig(a*logit(shown) + b) per tier. The slope is about 0.3 to 0.4, so
  // the shown DETACH percentage barely predicts a live fight (shown 95 at Tier 1 is 63% real, shown 80 at Tier 2 is 26%). Wiring it into DETACH.odds would also
  // change the detachment rolls (resolveAll uses the same function), so it waits for Patrick; see audits/bal-bot-after.md.
  K.odds.fit = {1: {a: 0.31, b: -0.36}, 2: {a: 0.34, b: -1.51}, 3: {a: 0.43, b: -2.67}};
  K.liveForecast = function(pct, tier){
    const f = K.odds.fit[tier] || K.odds.fit[3], p = Math.min(0.995, Math.max(0.005, pct / 100)), z = Math.log(p / (1 - p));
    return Math.round(100 / (1 + Math.exp(-(f.a * z + f.b))));
  };
  // 3b. the board forecast (Patrick, option A, 2026-11-14): each contract card on the table shows what the squad's own fight is likely to be,
  // from liveForecast over the detachment odds of the Leader's squad. The detachment odds themselves are unchanged. Switch: BAL35.forecast.on.
  K.forecast = {on: true, mates: 4};
  K.forecastOf = function(c){
    try {
      if (!K.on || !K.forecast.on || !window.DETACH || !DETACH.odds || !META || !META.leader || !c) return null;
      const mates = (META.roster || []).filter(p => p && !p.away && !p.resting).slice(0, K.forecast.mates);
      const od = DETACH.odds(META.leader, mates, c, 'normal'); if (!od || typeof od.pct !== 'number') return null;
      const pct = K.liveForecast(od.pct, c.tier || 1);
      const band = pct >= 80 ? 'Near certain' : pct >= 62 ? 'Likely' : pct >= 42 ? 'Even' : pct >= 25 ? 'Risky' : 'Desperate';
      return {pct, band};
    } catch (e) { return null; }
  };
  if (typeof renderTable === 'function'){ const f = renderTable;
    renderTable = function(){
      const r = f.apply(this, arguments);
      try {
        if (K.on && K.forecast.on && META && META.board){
          const cards = document.querySelectorAll('.cscroll');
          cards.forEach((el, i) => {
            if (el.querySelector('.fc35')) return;
            const fc = K.forecastOf(META.board[i]); if (!fc) return;
            const d = document.createElement('div'); d.className = 'desc fc35'; d.style.cssText = 'font-size:14px';
            d.innerHTML = '<b>Forecast for your squad:</b> ' + fc.band + ', about ' + fc.pct + '%';
            const cost = el.querySelector('.cost'); if (cost && cost.parentNode) cost.parentNode.insertBefore(d, cost); else el.appendChild(d);
          });
        }
      } catch (e) {}
      return r;
    };
  }
  K.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); }, was = K.on, g = G;
    try {
      ok(typeof K.liveForecast === 'function' && K.liveForecast(95, 1) === 63 && K.liveForecast(80, 2) === 26, 'liveForecast reads the fit: ' + K.liveForecast(95, 1) + ' ' + K.liveForecast(80, 2));
      ok(typeof K.hostage.hp === 'number' && K.hostage.hp === 18 && K.holdT1.k > 0.5 && K.holdT1.k < 0.8, 'knobs present');
      G = {obj: 'hold', contract: {tier: 1, host: 'bandits', minutes: 3}, enemies: [], sec: 0, frame: 0, hostages: [{hp: 6, maxHp: 6}, {hp: 3, maxHp: 4}]};
      K.on = true; ok(live(), 'live on a board contract');
      ok(K.holdT1F(2) === 0.67 && K.holdT1F(3) === 0.5 && K.holdT1F(4) === 0.4 && K.holdT1F(10) === K.holdT1.k, 'SW-9: the Hold T1 factor by length (2/3/4 min), other lengths the old k');
      { const se = Math.random; Math.random = () => 0.45; G.obj = 'hold'; G.contract.obj = 'hold'; G.contract.minutes = 3;   // 0.45 < 0.5 keeps at 3 min, > 0.4 thins at 4 min
        try { const sp = () => { try { spawnEnemy('brigand'); } catch (e) {} }; const t3 = K.log.thinned; sp(); const kept3 = K.log.thinned === t3; G.contract.minutes = 4; const t4 = K.log.thinned; sp(); ok(kept3 && K.log.thinned === t4 + 1, 'SW-9: a wave spawn is kept at 3 min, thinned at 4 min (same roll)'); }
        finally { Math.random = se; G.enemies = []; G.contract.minutes = 3; } }
      G.obj = 'siege'; G.contract.obj = 'siege'; ok(!live(), 'story fights are untouched');
      K.on = false; G.obj = 'hold'; ok(!live(), 'off: nothing is live');
      K.on = true;     } catch (e) { fails.push('error ' + e.message); }
    finally { G = g; K.on = was; }
    return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'knobs, live scope, off = unchanged (the thinning is checked by the sim)'};
  };
}
/* END INDEX 87a */
