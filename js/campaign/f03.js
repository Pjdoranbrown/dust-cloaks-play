/* ============================================================================
   INDEX F03 - F-03: six new contracts and the Flesh Guilds (Lead Programmer, 2026-11-14).
   Mechanics: audits/f03-scope.md (Systems). Text: js/lines/f03.js (Narrative, F03_LINES).
   ON by default (Patrick 2026-11-15). ROLLBACK: F03.set(false), or the page flag ?f03=0. Off = no faction, no new jobs,
   every wrapper idle (a variant job already on the board stays until the board is rolled again).
   Each contract is a variant of a base objective (c.obj stays the base; c.f03 names the variant), so
   the engine's own map, win checks and HUD carry it; this file adds only the new rules:
     cellarSummit (hunt)    three chiefs in one cellar; a chief's fall routs his men; the last raises the alarm;
                            the named order (pavise, smoke-hand, bomb-thrower) pays a bonus.
     garrisonBait (rescue)  one safehouse cage, no opening wave, no ambient spawns; patrols walk rounds and
                            chase smoke pots (key G); every kill raises the alert, K.baitFail dead PATROL guards = fail (other kills don't count).
     vaultShakedown (extract) shield guards take half damage unless flanked; three valve wheels open the
                            blast doors for K.doorOpen s; sealed doors stop the strongboxes.
     marketRaid (rescue)    Mercias; 6 to 8 pens; a roll call marches unopened pens off unless the Guild Master is dead.
     marketDefend (hold)    Mercias; 6 lots of captives near the redoubt; raiders go for them; each freed lot
                            cuts the pay K.lotCut; every lot freed = fail.
     slaveHulk (rescue, T2+) the hatch opens when the deck crew is dead; a scuttle timer; freed rowers fight
                            for the squad this contract only (never join the roster).
     burnWharves (beacons, T2+) each lit pier burns out (enemies on it die, the ground stays on fire);
                            all three lit = hold K.wharfHold s.
   Honest limits: no bespoke maps (no decks, stalls or piers: the base maps are reused); no BAL-BOT routine.
   ============================================================================ */
(function(){
  const F = window.F03 = {};
  F.on = !/[?&]f03=0/.test(location.search);
  F.RIVAL = 'suderia';                 // the Free Lands rival: ONE-LINE SWITCH (Patrick to confirm; Narrative recommends suderia)
  F.FAC = 'fleshguilds';
  const LN = () => window.F03_LINES || {};

  /* ---- [S] every draft number in one block (Systems' scope; Patrick to sign off) ---- */
  const K = F.K = {
    pay: {cellarSummit:330, garrisonBait:280, vaultShakedown:340, marketRaid:320, marketDefend:300, slaveHulk:340, burnWharves:320},
    win: 1, loss: -1,                  // the patron's own move is the engine's (+1 win, -1 fled)
    bigWin: 1,                         // Hulk and market raid: the rival gets +1 more (total +2)
    guildHit: -2,                      // Hulk or market raid won: the Flesh Guilds
    defendRival: -1,                   // market defend won: the rival
    perk: 0.15,                        // Chartered Convoy at Allied: first escort or extract each season
    boardChance: 0.5,                  // chance a rolled board carries one F-03 job
    threat: {cellarSummit:6, marketDefend:4, marketRaid:3, burnWharves:2, vaultShakedown:1, garrisonBait:0, slaveHulk:0},   // board threat offset per job (Systems F03.K draft, Patrick 2026-11-14)
    orderBonus: 0.25,                  // Cellar Summit, chiefs in the named order
    summitAlarm: 2,                    // the last chief raises the alarm by this
    summitCon: 0.6, summitRetinue: 2,  // Cellar Summit: chiefs at this share of Condition, this many men each (draft, 2026-11-14)
    vaultGuards: [0, 2, 2, 3],         // Vault: shield guards a strongbox by tier (Tier 2 one fewer, draft 2026-11-14)
    barkEvery: 35,                     // s between Guard the Market ambience lines [T]
    baitFail: 3,                       // Garrison Bait: dead patrol guards before the alert brings the post down
    pots: [0, 3, 3, 4],                // smoke pots by tier
    potLife: 8,                        // s
    potRange: 200,                     // px thrown ahead
    lureR: 640,                        // px a pot pulls patrols from
    patrols: [0, 3, 3, 4], patrolSize: 3, sight: 230,
    shieldCut: 0.5, flankR: 180, flankAng: 2.1,   // radians between two squad units round a shield guard
    valveHold: 2, doorOpen: 90,        // s
    rollCall: [0, 210, 135, 120],      // s before unopened pens are marched off (Tier 1 150 -> 210, draft 2026-11-14)
    lots: 6, lotCut: 0.10, defendMin: 3,
    lotHp: [0, 320, 550, 700],         // PD-24 (Patrick Q24, 2026-11-16): lot Condition x8 at Tier 1, x10 at Tier 2 (was 40, 55, 70; F-03 numbers review)
    baitGarrisonR: 360,                // PD-24: the Bait cage's own garrison (dormant men this close to the cage) is removed
    rowers: 6, scuttle: [0, 0, 240, 180],         // s (Tier 2 200 -> 240, draft 2026-11-14)
    burnR: 6, wharfHold: 60,           // cells; s
    minTier: {slaveHulk: 2, burnWharves: 2},
    maxTier: 2                         // scope: Tier 1 and 2 only until the tier softening lands
  };
  F.BASE = {cellarSummit:'hunt', garrisonBait:'rescue', vaultShakedown:'extract', marketRaid:'rescue', marketDefend:'hold', slaveHulk:'rescue', burnWharves:'beacons'};
  F.PATRON_FAC = () => ({cellarSummit:'skulk', garrisonBait:'skulk', vaultShakedown:'skulk', burnWharves:'mendor', slaveHulk:F.RIVAL, marketRaid:F.RIVAL, marketDefend:F.FAC});
  F.HOST = {cellarSummit:'bandits', garrisonBait:'bandits', vaultShakedown:'bandits', marketRaid:'bandits', marketDefend:'bandits', slaveHulk:'bandits', burnWharves:'hollow'};
  F.KEYS = Object.keys(F.BASE);
  F.lines = k => { const L = LN(); return k === 'marketRaid' ? (L.slaveMarket || {}).raid || {} : k === 'marketDefend' ? (L.slaveMarket || {}).defend || {} : L[k] || {}; };
  F.fill = (s, c) => String(s || '').replace(/\{P\}/g, c.patron || '').replace(/\{place\}/g, c.place || '').replace(/\{C\}/g, c.title || '')
    .replace(/\{L\}/g, (typeof META !== 'undefined' && META && META.leader && META.leader.name) || 'The Leader').replace(/\{F\}/g, c.faction && FACTIONS[c.faction] ? FACTIONS[c.faction].name : '');

  /* ---- the faction (like F34's Sun Elves) ---- */
  F.addFaction = function(){
    if (FACTIONS[F.FAC]) return false;
    const L = LN().fleshGuilds || {}, pk = L.perk || {};
    FACTIONS[F.FAC] = {name: (L.name || 'The Flesh Guilds').replace(/^The /, ''), patron: L.patron || 'A Guild Factor',
      perk: (pk.name || 'Chartered Convoy') + ': ' + (pk.line || 'Once a season, the first escort or extract job pays 15% more.')};
    if (!PATRONS.includes(FACTIONS[F.FAC].patron)) PATRONS.push(FACTIONS[F.FAC].patron);
    HOSTAGE_FOLK[F.FAC] = L.folk || 'Flesh Guild guards';
    FACTION_LOOK[F.FAC] = {glyph:'chain', col:'#3a3a40', at:[43.5, 28.5]};   // Mercias (js/campaign/places.js); placeholder seal for Art
    FACTION_RIVAL[F.FAC] = F.RIVAL;                                          // one way
    if (!NO_RAIDERS.includes(F.FAC)) NO_RAIDERS.push(F.FAC);
    return true;   // not in any REGIONS list: the guilds offer only the market defend job
  };
  F.removeFaction = function(){
    const p = FACTIONS[F.FAC] && FACTIONS[F.FAC].patron;
    delete FACTIONS[F.FAC]; delete HOSTAGE_FOLK[F.FAC]; delete FACTION_LOOK[F.FAC]; delete FACTION_RIVAL[F.FAC];
    const i = PATRONS.indexOf(p); if (i >= 0) PATRONS.splice(i, 1);
    const j = NO_RAIDERS.indexOf(F.FAC); if (j >= 0) NO_RAIDERS.splice(j, 1);
  };
  if (F.on) F.addFaction();
  F.set = function(on){ F.on = !!on; if (F.on) F.addFaction(); else F.removeFaction(); return F.on; };

  /* ---- making a contract ---- */
  F.make = function(key, tier){
    const base = F.BASE[key], c = makeContract(base, tier), L = F.lines(key);
    c.f03 = key; c.host = F.HOST[key];
    if (key === 'marketRaid' || key === 'marketDefend'){
      const R = REGIONS.marches;
      Object.assign(c, {place:'Mercias', town:'Mercias', region:'marches', regionName:R ? R.name : c.regionName, mapAt:[43 + rnd(-1, 1), 28 + rnd(-1, 1)]});
    }
    if (key === 'marketDefend') c.minutes = K.defendMin;
    c.title = L.title || key; c.patron = L.patron || c.patron; c.faction = F.PATRON_FAC()[key];
    if (base === 'rescue') c.hostFaction = c.faction;
    c.pay = Math.round(K.pay[key] * TIER_PAY[tier] / 5) * 5;
    c.threatAdd = K.threat[key] || 0;
    c.brief = F.fill(L.brief, c) + (L.twist ? ' ' + L.twist : '') + (L.cost ? ' ' + F.fill(L.cost, c) : '');   // the cost line (Guard the Market) on the card
    c.f03hud = L.hud || '';
    if (key === 'garrisonBait') c.teach = Object.assign({}, c.teach, {noAmbient:true});
    return c;
  };
  // Which F-03 jobs can be offered at this tier and Standing.
  F.offerable = function(tier){
    if (tier > K.maxTier) return [];
    return F.KEYS.filter(k => tier >= (K.minTier[k] || 1)).filter(k => {
      const f = F.PATRON_FAC()[k];
      if (f === F.FAC && !FACTIONS[F.FAC]) return false;
      return standing(f) > -2;
    });
  };
  F.addToBoard = function(board, tiers, roll){
    if (!board || (roll === undefined ? Math.random() : roll) >= K.boardChance) return null;
    const ts = (tiers || [1]).filter(t => F.offerable(t).length); if (!ts.length) return null;
    const t = ts[Math.random() * ts.length | 0], ks = F.offerable(t), c = F.make(ks[Math.random() * ks.length | 0], t);
    board.push(c); return c;
  };
  { const f = rollBoard; rollBoard = function(){
      const r = f.apply(this, arguments);
      if (F.on && typeof META !== 'undefined' && META && Array.isArray(META.board)){
        const lvl = META.leader ? META.leader.level : 1, tiers = [1]; if (lvl >= 3) tiers.push(2); if (lvl >= 5) tiers.push(3);
        try { if (F.addToBoard(META.board, tiers)) saveMeta(); } catch(err){ console.warn('F03 board', err); }
      }
      return r;
    }; }

  /* ---- shared helpers ---- */
  const V = () => (typeof G !== 'undefined' && G && G.contract && G.contract.f03) || null;
  const S = () => G.f03 || (G.f03 = {});
  const BLK = new Set([2, 3, 7, 8, 9, 11, 12, 13]);
  const cellAt = (M, x, y) => { const cx = x / CELL | 0, cy = y / CELL | 0; if (cx < 1 || cy < 1 || cx >= M.w - 1 || cy >= M.h - 1) return null; return cy * M.w + cx; };
  const openAt = (M, x, y) => { const i = cellAt(M, x, y); return i !== null && !BLK.has(M.g[i]); };
  F.openNear = function(M, x, y, r0, r1, tries){
    for (let i = 0; i < (tries || 60); i++){ const a = Math.random() * TAU, d = rnd(r0, r1), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (openAt(M, px, py)) return {x:px, y:py}; }
    return null;
  };
  // Two squad units on opposite sides of a body (wider than K.flankAng) = flanked.
  F.flanked = function(e, units){
    const near = units.filter(u => dist(u, e) < K.flankR).map(u => Math.atan2(u.y - e.y, u.x - e.x));
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++){
      let d = Math.abs(near[i] - near[j]); if (d > Math.PI) d = TAU - d; if (d >= K.flankAng) return true; }
    return false;
  };
  F.seasonKey = () => { try { const s = String(seasonName()), m = s.match(/(Spring|Summer|Autumn|Winter)\D*(\d{3,4})?/); return m ? m[1] + (m[2] || '') : s; } catch(e){ return ''; } };

  /* ---- the map ---- */
  { const f = generateMap; generateMap = function(contract){
      const M = f.apply(this, arguments), k = contract && contract.f03;
      if (!k) return M;
      try {
        if (k === 'garrisonBait' && M.cages && M.cages.length > 1) M.cages = M.cages.slice(0, 1);
        if (k === 'marketRaid' && M.cages && M.cages.length){
          const want = Math.min(8, 5 + contract.tier), src = M.cages.slice();
          for (let i = 0; M.cages.length < want && i < 40; i++){ const b = src[i % src.length], p = F.openNear(M, b.x, b.y, 90, 220);
            if (p && M.cages.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 70)) M.cages.push(p); }
        }
        if (k === 'cellarSummit' && M.camps && M.camps.length){
          // one cellar: the chiefs sit close together on a cleared floor
          const c0 = M.camps[0], cx = c0.cx, cy = c0.cy, offs = [[0, 0], [5, 0], [2, 4]];
          for (let y = cy - 3; y <= cy + 7; y++) for (let x = cx - 3; x <= cx + 8; x++) if (x > 0 && y > 0 && x < M.w - 1 && y < M.h - 1) M.g[y * M.w + x] = 6;
          const camps = [];
          for (let i = 0; i < 3; i++){ const gx = Math.min(M.w - 2, cx + offs[i][0]), gy = Math.min(M.h - 2, cy + offs[i][1]);
            camps.push(Object.assign({}, M.camps[i] || c0, {cx:gx, cy:gy, x:gx * CELL + CELL / 2, y:gy * CELL + CELL / 2, done:false, idx:i})); }
          M.camps = camps;
        }
      } catch(err){ console.warn('F03 map', err); }
      return M;
    }; }

  /* ---- setting up the field ---- */
  { const f = startDeployment; startDeployment = function(c){
      // Chartered Convoy (Allied with the guilds): first escort or extract each season pays more
      if (F.on && c && !c.f03 && (c.obj === 'escort' || c.obj === 'extract') && FACTIONS[F.FAC] && allied(F.FAC)){
        const sk = F.seasonKey(); if (sk && META.f03Convoy !== sk){ META.f03Convoy = sk; c.pay = Math.round(c.pay * (1 + K.perk) / 5) * 5; c.f03Convoy = true; }
      }
      const r = f.apply(this, arguments);
      if (c && c.f03 && typeof G !== 'undefined' && G && G.contract === c){ try { F.setup(c); } catch(err){ console.warn('F03 setup', err); } }
      return r;
    }; }
  const guildName = () => ((LN().fleshGuilds || {}).folk || 'Flesh Guild guards').replace(/s$/, '');
  F.setup = function(c){
    const st = S(), k = c.f03, tier = c.tier;
    if (c.f03Convoy) note('Chartered Convoy: the guild adds ' + Math.round(K.perk * 100) + '% to this job.');
    if (c.f03hud) note(c.f03hud);
    if (k === 'garrisonBait'){
      G.enemies = G.enemies.filter(e => e.dormant || dist(e, G.leader) > 420);    // no opening wave (it spawns awake, 250 to 330 px out)
      G.enemies = G.enemies.filter(e => !(e.dormant && (G.cages || []).some(cg => dist(e, cg) < K.baitGarrisonR)));   // PD-24: no cage garrison; only the patrols guard the post
      st.kills0 = G.kills; st.patrolMen = []; st.pots = K.pots[tier]; st.smoke = null;
      for (let p = 0; p < K.patrols[tier]; p++){
        const pts = []; for (let i = 0; i < 4; i++){ const q = F.openNear(MAP, G.leader.x, G.leader.y, 500, 1400, 80); if (q) pts.push(q); }
        if (pts.length < 2) continue;
        const grp = GROUP++, pool = HOSTS[c.host].pools[tier];
        for (let i = 0; i < K.patrolSize; i++){ const e = spawnEnemy(pool[i % pool.length], pts[0].x + rnd(-30, 30), pts[0].y + rnd(-30, 30), {group:grp});
          if (e){ e.f03patrol = {pts, i:1}; e.seen = false; st.patrolMen.push(e); } }
      }
    }
    if (k === 'cellarSummit'){
      st.order = []; const tags = ['the heavy man with the pavise', 'the smoke-hand', 'the bomb-thrower'];
      G.camps.forEach((cp, i) => { const b = cp.boss; if (!b) return; b.f03Tag = tags[i];
        b.con = b.maxCon = Math.max(1, Math.round(b.maxCon * K.summitCon));
        const men = G.enemies.filter(e => e !== b && !e.dead && e.group === b.group && !BESTIARY[e.k].boss);
        const cut = new Set(men.slice(K.summitRetinue)); if (cut.size) G.enemies = G.enemies.filter(e => !cut.has(e)); });
    }
    if (k === 'vaultShakedown'){
      st.valves = []; st.doorT = 0;
      for (const v of G.vaults){
        const grp = GROUP++;
        for (const kind of ['phalanx', 'phalanx', 'warden'].slice(0, K.vaultGuards[tier] || 2)){ const p = F.openNear(MAP, v.x, v.y, 30, 90) || v;
          const e = BESTIARY[kind] && spawnEnemy(kind, p.x, p.y, {dormant:true, group:grp}); if (e) e.shieldFront = true; }
        const q = F.openNear(MAP, v.x, v.y, 200, 360, 80); if (q) st.valves.push({x:q.x, y:q.y, prog:0, on:false});
      }
    }
    if (k === 'marketRaid'){
      st.rollT = K.rollCall[tier] * 60; st.gone = 0;
      for (const e of G.enemies) if (!e.dead && e.dormant){ if (BESTIARY[e.k].boss && dist(e, MAP.town) < 160 && !st.master){ st.master = e; e.name = 'Guild Master ' + (e.name || '').split(' ').pop(); } else if (!BESTIARY[e.k].boss) e.name = guildName(); }
      note('The roll call has begun. Any pen still shut when it ends is marched away, unless the Guild Master falls first.');
    }
    if (k === 'marketDefend'){
      st.lots = []; st.freed = 0; const cx = MAP.w / 2 * CELL, cy = MAP.h / 2 * CELL;
      for (let i = 0; i < K.lots; i++){ const a = i / K.lots * TAU; let p = {x:cx + Math.cos(a) * 130, y:cy + Math.sin(a) * 110};
        if (!openAt(MAP, p.x, p.y)) p = F.openNear(MAP, cx, cy, 60, 200) || p;
        st.lots.push({x:p.x, y:p.y, hp:K.lotHp[tier], maxHp:K.lotHp[tier], objHp:true, ac:4, r:16, flash:0, freed:false}); }
    }
    if (k === 'slaveHulk'){
      st.scuttleT = K.scuttle[tier] * 60; st.hatch = false; st.rowers = 0;
      const b = G.enemies.find(e => !e.dead && BESTIARY[e.k].boss && dist(e, MAP.town) < 160);
      st.deck = b ? b.group : null; if (b) b.name = 'the Hulk-master';
      note('The hatch is barred until the deck crew is dead. The ship is being scuttled.');
    }
    if (k === 'burnWharves'){ st.held = false; for (const b of G.beacons) b.f03 = false; }
  };

  /* ---- each frame ---- */
  { const f = updateContract; updateContract = function(){
      const k = V();
      if (k === 'slaveHulk' && G.cages) for (const cg of G.cages) cg.sealed = !S().hatch;   /* LE F1: a sealed objective gives no contest cue */
      if (k === 'slaveHulk' && !S().hatch && G.cages) for (const cg of G.cages) cg.prog = 0;
      if (k === 'vaultShakedown' && G.vaults) for (const v of G.vaults) v.sealed = !(S().doorT > 0);
      if (k === 'vaultShakedown' && !(S().doorT > 0) && G.vaults) for (const v of G.vaults) if (!v.done) v.claimed = 0;
      const nH = G.hostages ? G.hostages.length : 0;
      const r = f.apply(this, arguments);
      if (k){ try { F.tick(k, nH); } catch(err){ console.warn('F03 tick', err); } }
      return r;
    }; }
  F.baitDead = st => (st.patrolMen || []).filter(e => e.dead).length;   // the alarm counts dead patrol guards only (the brief); the cage garrison and ambient spawns don't
  F.tick = function(k, nH){
    const st = S(), L = G.leader;
    if (k === 'garrisonBait'){
      if (st.smoke && --st.smoke.t <= 0) st.smoke = null;
      if (F.baitDead(st) >= K.baitFail && !G.over) contractFail('THE ALARM IS RUNG', 'Guards are dead. The post comes down on the street.');
    }
    if (k === 'vaultShakedown'){
      if (st.doorT > 0 && --st.doorT === 0){ for (const v of st.valves){ v.on = false; v.prog = 0; } pop(L.x, L.y - 40, 'THE BLAST DOORS SEAL', '#ff8a7a'); note('The blast doors seal. Turn the wheels again.'); }
      if (!(st.doorT > 0)) for (const v of st.valves){ if (v.on) continue;
        if (dist(L, v) < 46 && !L.down && !contested(v, 90)){ if (++v.prog >= K.valveHold * 60){ v.on = true; pop(v.x, v.y - 30, 'WHEEL TURNED', '#ffd860'); SFX.play('chest'); } } else v.prog = Math.max(0, v.prog - 1); }
      if (!(st.doorT > 0) && st.valves.length && st.valves.every(v => v.on)){ st.doorT = K.doorOpen * 60; note('The blast doors are open for ' + K.doorOpen + ' seconds. Take the strongbox and go.'); SFX.play('horn'); }
    }
    if (k === 'marketRaid' && st.rollT > 0){
      if (st.master && st.master.dead){ st.rollT = 0; note('The Guild Master is dead. The roll call ends.'); }
      else if (--st.rollT === 0){ let n = 0; for (const cg of G.cages) if (!cg.open){ cg.open = true; cg.gone = true; n++; }
        st.gone = n; if (n){ note(n + ' pen' + (n > 1 ? 's are' : ' is') + ' marched away at the roll call.'); pop(L.x, L.y - 40, 'ROLL CALL', '#ff8a7a'); SFX.play('horn'); } }
    }
    if (k === 'marketDefend'){
      const amb = F.lines(k).ambience || [];
      if (amb.length && !G.over && (G.frame || 0) % (K.barkEvery * 60) === K.barkEvery * 30){   // first at half the gap, then every gap
        st.amb = ((st.amb == null ? Math.random() * amb.length | 0 : st.amb) + 1) % amb.length; note(amb[st.amb]); }
      for (const t of st.lots){ if (t.flash > 0) t.flash--;
        if (!t.freed && t.hp <= 0){ t.freed = true; st.freed++; pop(t.x, t.y - 30, 'CAPTIVES FREED', '#ff8a7a'); note('A captive was freed. The guild docks your pay.'); } }
      if (st.freed >= st.lots.length && !G.over) contractFail('THE CAGES STAND OPEN', 'Every lot is open. The sale is ruined.');
    }
    if (k === 'slaveHulk'){
      if (!st.hatch){
        if (st.deck == null || !G.enemies.some(e => !e.dead && e.group === st.deck)){ st.hatch = true; note('The deck is taken. The hatch is open. Break the oar-locks below.'); SFX.play('horn'); }
        else if (st.scuttleT > 0 && --st.scuttleT === 0 && !G.over) return contractFail('THE HULK GOES DOWN', 'She is scuttled with the rowers chained below.');
      }
      for (let i = nH; i < G.hostages.length; i++){ const h = G.hostages[i]; if (h.state !== 'walk') continue;
        h.state = 'saved'; G.saved++; G.captivesFreed = (G.captivesFreed || 0) + 1; if (typeof liberationDeed === 'function') liberationDeed(1);
        if (st.rowers < K.rowers){ st.rowers++; const p = rollRecruit(); p.name = h.p.name; const m = runMate(p, G.squad.length); m.x = h.x; m.y = h.y; m.f03Rower = true; G.squad.push(m);
          pop(h.x, h.y - 24, 'A ROWER FIGHTS', '#8fd39a'); } }
    }
    if (k === 'burnWharves'){
      for (const b of G.beacons) if (b.burning && !b.f03){ b.f03 = true; F.burnPier(b); }
    }
  };
  // A lit pier burns out: everything on it dies, and the ground stays on fire (both sides) for the rest of the field.
  F.burnPier = function(b){
    const R = K.burnR * CELL;
    for (const e of G.enemies) if (!e.dead && !BESTIARY[e.k].boss && dist(e, b) > 2.5 * CELL && dist(e, b) < R){ e.dormant = false; hurtEnemy(e, 999); }
    for (let r = 3 * CELL; r <= R; r += CELL * 1.2) for (let a = 0; a < TAU; a += CELL * 1.2 / r)
      G.fires.push({x:b.x + Math.cos(a) * r, y:b.y + Math.sin(a) * r, r:30, life:1e7, friendly:true, enemy:true, f03:true});
    G.shake = 14; pop(b.x, b.y - 70, 'THE PIER BURNS', '#ffb060');
  };

  /* ---- the enemy ---- */
  { const f = contractEnemyAI; contractEnemyAI = function(e, B){
      if (e.f03patrol && !e.f03alert && V() === 'garrisonBait'){
        const L = G.leader, st = S();
        if (dist(e, L) < K.sight && clearLine(e, L)){ for (const o of G.enemies) if (o.group === e.group) o.f03alert = true; pop(e.x, e.y - 40, 'SPOTTED', '#ff8a7a'); return false; }
        let tx, ty; if (st.smoke && dist(e, st.smoke) < K.lureR){ tx = st.smoke.x; ty = st.smoke.y; }
        else { const wp = e.f03patrol.pts[e.f03patrol.i]; tx = wp.x; ty = wp.y; if (dist(e, wp) < 24) e.f03patrol.i = (e.f03patrol.i + 1) % e.f03patrol.pts.length; }
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
        if (d > 18){ moveEnemy(e, tx, ty, BESTIARY[e.k].speed * 0.55, {x:tx, y:ty}); collide(e, e.r * .7); }
        return true;
      }
      return f.apply(this, arguments);
    }; }
  { const f = objTarget; objTarget = function(e){
      if (V() === 'marketDefend' && !e.mark && !e.escort && e.seed % 3 !== 0){
        let best = null, bd = 900; for (const t of S().lots || []) if (!t.freed && t.hp > 0){ const d = dist(e, t); if (d < bd){ bd = d; best = t; } }
        if (best) return best;
      }
      return f.apply(this, arguments);
    }; }
  /* Garrison Bait: mates and the Leader's auto-attack hold fire on patrol guards until the group is alerted (it spots the
     Leader, or one of it is hurt). Deliberate attacks still choose them: a manual Leader order (F33.fire) and a mark the
     player sets on a guard (F33). The Leader's auto-fire reach (280) outranged guard sight (230): QA 2026-11-14. */
  F.deliberate = 0;
  F.holdFire = (from, e) => !!(e && e.f03patrol && !e.f03alert && from && G.leader && V() === 'garrisonBait'
    && (from === G.leader ? !F.deliberate : Array.isArray(G.squad) && G.squad.includes(from)));
  if (window.F33 && typeof F33.fire === 'function'){ const f = F33.fire; F33.fire = function(){ F.deliberate++; try { return f.apply(this, arguments); } finally { F.deliberate--; } }; }
  { const f = nearest; nearest = function(from, reach, skip, los){
      if (V() !== 'garrisonBait' || (from === G.leader && F.deliberate)) return f.apply(this, arguments);
      const sk = new Set(skip || []); for (const e of G.enemies) if (F.holdFire(from, e)) sk.add(e);
      return f.call(this, from, reach, sk, los);
    }; }
  { const f = hurtEnemy; hurtEnemy = function(e, n){
      if (e && e.f03patrol && !e.f03alert && V() === 'garrisonBait' && n > 0){ for (const o of G.enemies) if (o.group === e.group) o.f03alert = true; pop(e.x, e.y - 40, 'SPOTTED', '#ff8a7a'); }
      if (e && e.shieldFront && V() === 'vaultShakedown' && n > 0 && n < 999 && !F.flanked(e, squadUnits())) n = Math.max(1, Math.round(n * K.shieldCut));
      return f.call(this, e, n);
    }; }
  { const f = killEnemy; killEnemy = function(e){
      const was = e && e.dead, r = f.apply(this, arguments);
      if (!was && e && e.dead && V() === 'cellarSummit' && e.home && G.camps.includes(e.home)){
        const st = S(); st.order.push(e.home.idx);
        for (const o of G.enemies) if (!o.dead && o.group === e.group){ o.broken = true; o.dormant = false; }
        pop(e.x, e.y - 60, 'HIS MEN BREAK', '#8fd39a');
        if (st.order.length === 2){ G.alarm += K.summitAlarm; huntingParty(); note('The last chief bellows for the street. The alarm is up.'); }
      }
      return r;
    }; }

  /* ---- player input: smoke pots (Garrison Bait) ---- */
  F.throwPot = function(){
    if (V() !== 'garrisonBait' || !G || G.over) return false;
    const st = S(); if (!(st.pots > 0)) { pop(G.leader.x, G.leader.y - 40, 'NO SMOKE LEFT', '#ff8a7a'); return false; }
    st.pots--; const a = G.facing || 0, x = G.leader.x + Math.cos(a) * K.potRange, y = G.leader.y + Math.sin(a) * K.potRange;
    st.smoke = {x, y, t:K.potLife * 60};
    G.fx.push({ring:true, x, y, r:90, life:40, c:'#b0b0a0'}); pop(x, y - 20, 'SMOKE', '#d0d0c0'); SFX.play('blast');
    return true;
  };
  addEventListener('keydown', ev => { if ((ev.key === 'g' || ev.key === 'G') && !ev.repeat && V() === 'garrisonBait' && !G.paused){ F.throwPot(); } });

  /* ---- win checks ---- */
  { const f = contractCheck; contractCheck = function(){
      const k = V();
      if (k === 'marketRaid'){
        const st = S(), walking = G.hostages.filter(h => h.state === 'walk').length;
        if (G.cages.every(c => c.open) && walking === 0){
          const ours = G.cages.filter(c => !c.gone).length;
          if (ours > G.cages.length / 2 && G.saved >= Math.ceil(G.hostages.length * 0.5)){ endDeployment('victory'); return true; }
          return contractFail('THE MARKET KEEPS ITS CAGES', st.gone ? 'Too many pens were marched off.' : 'Too many of the captives are dead.');
        }
        return false;
      }
      const r = f.apply(this, arguments);
      // the engine's beacon hold (20 s, a boss, +2 alarm) starts first; the wharves stretch it to K.wharfHold
      if (k === 'burnWharves' && !G.over && G.beaconHoldStarted && !S().held){ S().held = true; G.winT = K.wharfHold * 60; note('All three piers burn. Hold the last walkway for ' + K.wharfHold + ' seconds.'); }
      return r;
    }; }

  /* ---- the HUD, markers and drawing ---- */
  { const f = contractLine; contractLine = function(t){
      const k = V(), st = k && S();
      if (k === 'garrisonBait'){ const r = f.apply(this, arguments) || ['', ''];
        return [r[0], `SMOKE POTS ${st.pots || 0} (G)  ·  PATROL DEAD ${F.baitDead(st)} / ${K.baitFail}  ·  ${t}`]; }
      if (k === 'vaultShakedown') return G.exitOpen ? ['GET OUT', `REACH THE GREEN BANNER  ·  ${t}`] : st.doorT > 0 ? [`DOORS ${Math.ceil(st.doorT / 60)}s`, `STRONGBOXES ${G.vaults.filter(v => v.done).length} / ${G.vaults.length}  ·  ${t}`]
        : G.exitOpen ? ['GET OUT', `REACH THE GREEN BANNER  ·  ${t}`] : [`${st.valves.filter(v => v.on).length} / ${st.valves.length}`, `WHEELS TURNED: THE DOORS ARE SEALED  ·  ${t}`];
      if (k === 'marketRaid'){ const r = f.apply(this, arguments) || ['', ''];
        return [r[0], (st.rollT > 0 ? `ROLL CALL ${Math.ceil(st.rollT / 60)}s  ·  ` : '') + r[1]]; }
      if (k === 'marketDefend') return null;
      if (k === 'slaveHulk'){ const r = f.apply(this, arguments) || ['', ''];
        return [r[0], (st.hatch ? `HATCH OPEN  ·  ROWERS ${st.rowers}` : `SCUTTLED IN ${Math.ceil(st.scuttleT / 60)}s  ·  CLEAR THE DECK`) + `  ·  ${t}`]; }
      if (k === 'burnWharves' && st.held) return [`HOLD ${Math.ceil(G.winT / 60)}s`, `THE PIERS BURN  ·  ${t}`];
      return f.apply(this, arguments);
    }; }
  if (typeof objectiveLine === 'function'){ const f = objectiveLine; objectiveLine = function(){
      if (V() === 'marketDefend'){ const st = S(), r = f.apply(this, arguments); if (Array.isArray(r)) return [r[0], `LOTS SHUT ${st.lots.length - st.freed} / ${st.lots.length}`]; return r; }
      return f.apply(this, arguments);
    }; }
  { const f = contractMarkers; contractMarkers = function(out){
      const r = f.apply(this, arguments), k = V(), st = k && S();
      if (k === 'vaultShakedown') for (const v of st.valves) out.push({x:v.x, y:v.y, kind:v.on ? 'lit' : 'beacon'});
      if (k === 'marketDefend') for (const t of st.lots) out.push({x:t.x, y:t.y, kind:t.freed ? 'done' : 'ally', sp:'cage'});
      if (k === 'garrisonBait' && st.smoke) out.push({x:st.smoke.x, y:st.smoke.y, kind:'ally'});
      return r;
    }; }
  { const f = contractBodies; contractBodies = function(bodies, onScreen){
      const r = f.apply(this, arguments), k = V(), st = k && S();
      if (k === 'marketDefend') for (const t of st.lots) if (onScreen(t)) bodies.push({y:t.y, custom:() => {
        if (!t.freed){ ctx.fillStyle = '#3a1a14'; ctx.fillRect(t.x - 18, t.y - 40, 36, 4); ctx.fillStyle = '#e0a040'; ctx.fillRect(t.x - 18, t.y - 40, 36 * Math.max(0, t.hp) / t.maxHp, 4); }
        PROPS3D.cage(t.x, t.y, t.freed); }});   /* S6-C 3a */
      if (k === 'vaultShakedown') for (const v of st.valves) if (onScreen(v)) bodies.push({y:v.y, custom:() => {
        ctx.strokeStyle = v.on ? '#ffd860' : '#8a8a86'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(v.x, v.y, 18, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(v.x - 18, v.y); ctx.lineTo(v.x + 18, v.y); ctx.moveTo(v.x, v.y - 18); ctx.lineTo(v.x, v.y + 18); ctx.stroke();
        if (!v.on && v.prog > 0){ ctx.strokeStyle = '#ffd860'; ctx.beginPath(); ctx.arc(v.x, v.y, 26, -Math.PI / 2, -Math.PI / 2 + TAU * v.prog / (K.valveHold * 60)); ctx.stroke(); } }});
      if (k === 'garrisonBait' && st.smoke) bodies.push({y:st.smoke.y, custom:() => {
        ctx.fillStyle = 'rgba(200,200,190,0.35)'; for (let i = 0; i < 5; i++){ ctx.beginPath(); ctx.arc(st.smoke.x + Math.sin(G.frame / 20 + i) * 20, st.smoke.y - i * 8, 26 - i * 3, 0, TAU); ctx.fill(); } }});
      return r;
    }; }

  /* ---- the debrief: pay changes go in before the engine pays, Standing and lines after ---- */
  F.payNow = function(c, result, st){
    let pay = c.pay, why = [];
    if (result !== 'victory') return {pay, why};
    if (c.f03 === 'cellarSummit' && st.order && st.order.join() === '0,1,2'){ const b = Math.round(c.pay * K.orderBonus / 5) * 5; pay += b; why.push(`The chiefs fell in the named order: +${b} crowns.`); }
    if (c.f03 === 'marketDefend' && st.freed){ const cut = Math.round(c.pay * Math.min(1, K.lotCut * st.freed) / 5) * 5; pay -= cut; why.push(`${st.freed} lot${st.freed > 1 ? 's' : ''} freed: the guild docks ${cut} crowns.`); }
    return {pay, why};
  };
  F.settle = function(c, result, lines){
    const L = F.lines(c.f03), won = result === 'victory', out = won ? 'win' : result === 'withdrawn' ? 'withdrew' : 'loss';
    if (L.result && L.result[out]) lines.push(`<p>${esc(F.fill(L.result[out], c))}</p>`);
    if (L.patronLine) lines.push(`<p class="${won ? 'good' : 'bad'}">${esc(F.fill(won ? L.patronLine.thanks : L.patronLine.angry, c))}</p>`);
    if (won && (c.f03 === 'slaveHulk' || c.f03 === 'marketRaid')){
      shiftStanding(F.RIVAL, K.bigWin, lines);
      if (FACTIONS[F.FAC]) shiftStanding(F.FAC, K.guildHit, lines);
    }
    if (won && c.f03 === 'marketDefend') shiftStanding(F.RIVAL, K.defendRival, lines);
  };
  { const f = endDeployment; endDeployment = function(result){
      const c = typeof G !== 'undefined' && G && G.contract;
      if (c && c.f03 && !G.over){
        const st = S(); G.squad = G.squad.filter(m => !m.f03Rower);        // rowers go home: never on the roster
        const r0 = result === 'withdrawn' && progress() < 0.5 && !G.sallyExit ? 'fled' : result, pm = F.payNow(c, r0, st);
        c.pay = pm.pay; st.why = pm.why;
      }
      return f.apply(this, arguments);
    }; }
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      if (!c || !c.f03) return f.apply(this, arguments);
      const st = (typeof G !== 'undefined' && G && G.f03) || {};
      for (const w of st.why || []) lines.push(`<p class="${/docks/.test(w) ? 'bad' : 'good'}">${esc(w)}</p>`);
      const n0 = lines.length, r = f.call(this, F.BASE[c.f03] === 'rescue' ? Object.assign({}, c, {obj:'f03x'}) : c, result, lines);   // no hostage Standing: the patron's move covers it
      { const L = F.lines(c.f03).result || {}, out = result === 'victory' ? 'win' : result === 'withdrawn' ? 'withdrew' : 'loss';   // our own result line replaces the base engine's (no fort in a market)
        if (L[out]) for (let i = lines.length - 1; i >= n0; i--) if (/^<p class="sx">/.test(lines[i])) lines.splice(i, 1); }
      try { F.settle(c, result, lines); } catch(err){ console.warn('F03 debrief', err); }
      return r;
    }; }

  /* ---- self-test (REG row) ---- */
  F.selfTest = function(){
    const res = [], ok = (name, cond) => res.push({name, ok: !!cond});
    const had = !!FACTIONS[F.FAC], meta0 = META.standing ? Object.assign({}, META.standing) : null, on0 = F.on;
    try {
      if (!had) F.addFaction();
      ok('lines loaded (six contracts and the faction)', F.KEYS.every(k => F.lines(k).title) && LN().fleshGuilds);
      ok('the Flesh Guilds are a faction with a seal near Mercias', FACTIONS[F.FAC] && FACTION_LOOK[F.FAC].at[0] === 43.5 && PATRONS.includes(FACTIONS[F.FAC].patron) && NO_RAIDERS.includes(F.FAC));
      ok('the rival is a one-line switch (now ' + F.RIVAL + ')', FACTION_RIVAL[F.FAC] === F.RIVAL && FACTIONS[F.RIVAL]);
      for (const k of F.KEYS){ const t = K.minTier[k] || 1, c = F.make(k, t);
        ok(k + ': base ' + F.BASE[k] + ', title, pay, patron faction', c.obj === F.BASE[k] && c.f03 === k && c.title === F.lines(k).title && c.pay === Math.round(K.pay[k] * TIER_PAY[t] / 5) * 5 && c.faction === F.PATRON_FAC()[k] && c.threatAdd === (K.threat[k] || 0) && !/\{/.test(c.brief)); }
      const m1 = F.make('marketRaid', 1), m2 = F.make('marketDefend', 1);
      ok('both market jobs stand in Mercias; defend runs ' + K.defendMin + ' min', m1.place === 'Mercias' && m2.town === 'Mercias' && m2.minutes === K.defendMin);
      ok('the bait job has no ambient spawns', F.make('garrisonBait', 1).teach.noAmbient === true);
      ok('PD-24: market lots x8 at Tier 1 and x10 at Tier 2 (320, 550)', K.lotHp[1] === 320 && K.lotHp[2] === 550);
      { const g0 = G, L = {x:0, y:0}, m = {x:10, y:0}, gd = {x:30, y:0, group:7, f03patrol:{pts:[], i:0}}, ot = {x:60, y:0, group:8};
        try { G = {contract:{f03:'garrisonBait'}, leader:L, squad:[m], enemies:[gd, ot]};
          const a1 = nearest(m, 999) === ot, a2 = nearest(L, 999) === ot; F.deliberate++; const a5 = nearest(L, 999) === gd; F.deliberate--;
          gd.f03alert = true; const a3 = nearest(m, 999) === gd && nearest(L, 999) === gd;
          G.contract.f03 = 'vaultShakedown'; gd.f03alert = false; const a4 = nearest(m, 999) === gd && nearest(L, 999) === gd;
          ok('bait: mates and the Leader auto-attack hold fire on an unalerted guard, a deliberate order does not, an alert frees them, other jobs untouched', a1 && a2 && a5 && a3 && a4);
        } finally { G = g0; } }
      ok('Tier 1 offers no Hulk and no Wharves; Tier 3 offers none yet', !F.offerable(1).includes('slaveHulk') && !F.offerable(1).includes('burnWharves') && F.offerable(2).includes('slaveHulk') && (K.maxTier >= 3 || !F.offerable(3).length));
      META.standing = Object.assign({}, META.standing || {}, {[F.FAC]: -2});
      ok('Hostile guilds: no market defend job', !F.offerable(1).includes('marketDefend'));
      META.standing[F.RIVAL] = -2;
      ok('Hostile rival: no raid and no Hulk', !F.offerable(2).includes('marketRaid') && !F.offerable(2).includes('slaveHulk'));
      META.standing = {};
      const b = []; ok('the board gets one F-03 job on a hit roll, none on a miss', F.addToBoard(b, [1], 0) && b.length === 1 && b[0].f03 && !F.addToBoard(b, [1], 0.99) && b.length === 1);
      const cs = F.make('cellarSummit', 1);
      ok('the named order pays +' + K.orderBonus * 100 + '%', F.payNow(cs, 'victory', {order:[0, 1, 2]}).pay > cs.pay && F.payNow(cs, 'victory', {order:[1, 0, 2]}).pay === cs.pay);
      const md = F.make('marketDefend', 1);
      { const a = {dead:true}, b = {dead:false}, c2 = {dead:true}, st0 = {patrolMen:[a, b, c2]};
        ok('Bait alarm counts dead patrol guards only (2 of 3 here; other kills not counted)', F.baitDead(st0) === 2 && F.baitDead({}) === 0); }
      ok('per-job Threat: Summit +6, Defend +4, Raid +3, Wharves +2, Vault +1, Bait and Hulk 0', cs.threatAdd === 6 && md.threatAdd === 4 && F.make('marketRaid', 1).threatAdd === 3 && F.make('vaultShakedown', 1).threatAdd === 1 && F.make('garrisonBait', 1).threatAdd === 0);
      ok('drafts: roll call 210 s at Tier 1, scuttle 240 s at Tier 2, Vault Tier 2 two shield guards, chiefs 60% with two men', K.rollCall[1] === 210 && K.scuttle[2] === 240 && K.vaultGuards[2] === 2 && K.summitCon === 0.6 && K.summitRetinue === 2);
      ok('Guard the Market: the cost line is on the card and the ambience lines are loaded', F.lines('marketDefend').cost && md.brief.indexOf(F.lines('marketDefend').cost.slice(0, 30)) >= 0 && (F.lines('marketDefend').ambience || []).length === 4);
      ok('each freed lot cuts the pay ' + K.lotCut * 100 + '%', F.payNow(md, 'victory', {freed:2}).pay === md.pay - Math.round(md.pay * K.lotCut * 2 / 5) * 5);
      const L1 = []; META.standing = {}; F.settle(F.make('marketRaid', 1), 'victory', L1);
      ok('raid won: rival +1 more, guilds -2, patron lines', standing(F.RIVAL) === K.bigWin && standing(F.FAC) === K.guildHit && L1.length >= 3);
      META.standing = {}; F.settle(F.make('marketDefend', 1), 'victory', []);
      ok('defend won: the rival -1', standing(F.RIVAL) === K.defendRival);
      const e = {x:0, y:0};
      ok('a shield guard is flanked only from two sides', !F.flanked(e, [{x:-100, y:0}, {x:-90, y:30}]) && F.flanked(e, [{x:-100, y:0}, {x:100, y:10}]));
      const tm = {fill:F.fill('{P} at {place}: {C}', {patron:'X', place:'Y', title:'Z'})};
      ok('tokens fill', tm.fill === 'X at Y: Z');
    } catch(err){ res.push({name:'threw: ' + (err && err.message), ok:false}); }
    finally { if (meta0) META.standing = meta0; else delete META.standing; if (!had) F.removeFaction(); F.on = on0; }
    const pass = res.filter(r => r.ok).length;
    return {ok: pass === res.length, pass, total: res.length, fails: res.filter(r => !r.ok).map(r => r.name)};
  };
})();
