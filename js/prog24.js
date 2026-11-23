/* ============================================================================
   INDEX PROG24 - PROG-1 steps 2 and 4: TIERS IN THE SLOTS, THE CHAPTER LIBRARY
   Plan: audits/progression-plan.md sections 2.1 to 2.6, 3 and 4 (steps 2, 4).
   Part of the game since PROG-1 step 4 (2026-11-16): PROG.init() (js/prog3.js,
   called at the end of js/prog5.js) applies steps 2, 3 and 4 once.
   Step 2, tiers (the PROG1 sheet, js/prog1-data.js):
   - Quick runs in an auto slot at its own cooldown (no x1.5); Battle at x1.5,
     as built; Prepared is refused in an auto slot.
   - Q14 (Patrick 2026-11-16): each character has one Prep slot (p.slots.prep)
     for a Prepared entry, cast once, free, as the fight starts (the first
     BOOK33 tick of a contract). A Prepared entry may also sit on the key.
   - Gates decide who may slot an entry: casters by Magic; martial Specialties
     by Level: library L1 Level 1, L2 Level 3, scrolls Level 5 [S] (Q13, Patrick
     2026-11-16; the sheet's gate column). The starting key has no gate.
   - Fireball moves to L2 with Magic 3 [S]. Ray of Frost becomes a Quick ladder
     entry (L1): one piercing dart at the nearest foe and a short slow [S].
   Step 4, the chapter library:
   - META.lib33: researched entries, shared by the whole chapter. BOOK33.research
     pays once at the building: L1 120 gp, L2 240 gp, scroll 150 gp [S]
     (PROG.K.research), instant. A found scroll is scribed the same way.
   - A book (BOOK33.book) is the starting key plus every library entry of the
     character's Specialty whose gate they meet. The old Copy calls Research.
   - The load fold: p.book ids join META.lib33; the five cut cards and the old
     Ray of Frost card leave p.picks and their technique joins the library.
   Not here: Burning Hands as the Mage's start key (R5) and the panels (step 5).
   Self-test rows are added to PROG.selfTest().
============================================================================ */
(function(){
  'use strict';
  const P = window.PROG; if (!P || !window.BOOK33 || !window.ABIL33) return;
  P.K.research = {L1: 120, L2: 240, scroll: 150};   // [S] draft prices
  P.K.frost = {cdS: 6, range: 300, slow: [90, 120, 150]};   // [S] Ray of Frost: recharge (s), reach (px), slow (frames) by rank
  P.K.fireball = {src: 'L2', minMagic: 3};   // [S]
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const S1 = () => window.PROG1, A = window.ABIL33, B = window.BOOK33;

  /* ---- step 2: tiers and gates ---- */
  P.entry = id => { const e = S1() && S1().BY[id]; return e && e.kind === 'technique' ? e : null; };
  P.tier = id => { const e = P.entry(id); return e ? e.tier : 'B'; };   // anything not on the sheet stays Battle (x1.5, as built)
  P.lvl = p => !p ? 1 : p.level != null ? (p.level | 0) || 1 : 1 + (p.adv | 0);
  P.gateOf = id => { const e = P.entry(id); return e && e.gate > 1 && e.src !== 'start' && e.src !== 'fixed' ? {stat: e.gateStat, n: e.gate} : null; };
  P.meets = (p, id) => { const g = P.gateOf(id); if (!g) return true; return g.stat === 'level' ? P.lvl(p) >= g.n : B.magic(p) >= g.n; };
  P.autoOk = id => P.tier(id) !== 'P';

  P._use0 = A.use;
  A.use = function(u, opt){
    if (!opt || !opt.auto) return P._use0.apply(this, arguments);
    const id = opt.id || A.lo(u).active, t = P.tier(id);
    if (t === 'P') return false;
    if (t !== 'Q') return P._use0.apply(this, arguments);
    const k = A.K.autoMul; A.K.autoMul = 1;
    try { return P._use0.apply(this, arguments); } finally { A.K.autoMul = k; }
  };
  P._lo0 = B.loadout;
  B.loadout = function(p, spec){
    if (!p || !p.slots || !Array.isArray(p.slots.auto)) return P._lo0.apply(this, arguments);
    const s0 = p.slots;   // a Prepared entry leaves the auto list before the slot count trims it
    p.slots = {active: s0.active, auto: s0.auto.filter(P.autoOk)};
    let r;
    try { r = P._lo0.apply(this, arguments); } finally { p.slots = s0; }
    const pr = s0.prep;
    if (pr && P.tier(pr) === 'P' && B.book(p, spec).includes(pr)) r.prep = pr;
    return r;
  };
  /* Q14: the Prep slot; slot 'prep' takes a Prepared entry from the book, or '' to empty it */
  P.setPrep = function(pid, val, where){
    const p = B.who(pid); if (!p || !B.live() || B.locked()) return false;
    val = val || null;
    if (val && (P.tier(val) !== 'P' || !B.book(p).includes(val))){
      B.msg = val && P.tier(val) !== 'P' ? `Only a Prepared entry goes in the Prep slot.` : `${p.name || 'They'} cannot use that yet.`; B.msgPid = pid;
      if (typeof SFX !== 'undefined') SFX.play('nope'); B.redraw(where); return false;
    }
    const lo = B.loadout(p); p.slots = {active: lo.active, auto: lo.auto.slice(), prep: val};
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof SFX !== 'undefined') SFX.play('pick');
    B.redraw(where); return true;
  };
  /* Q14: cast every Prep slot once, free, on the first tick of a contract */
  P.prepCast = function(){
    const G = gl('G'); if (!G || G.prep24) return 0;
    G.prep24 = true; let n = 0;
    for (const u of A.units()){
      if (!A.able(u)) continue;
      const lo = A.lo(u), id = lo && lo.prep, R = id && A.REG[id];
      if (!R || !R.own || P.tier(id) !== 'P') continue;
      try { if (R.fx(u, null, {prep: true})){ n++; const st = A.ab(u, id); st.flash = 20; } } catch (e) { if (!P._perr){ P._perr = 1; console.warn('PROG24 prep ' + id, e); } }
    }
    return n;
  };
  P._tick0 = B.tick;
  B.tick = function(){ try { P.prepCast(); } catch (e) {} return P._tick0.apply(this, arguments); };
  P._set0 = B.set;
  B.set = function(pid, slot, val, where){
    if (slot === 'prep') return P.setPrep(pid, val, where);
    if (slot !== 'key' && val && !P.autoOk(val)){
      B.msg = `${B.name(val)} is Prepared: it goes in the Prep slot or on the key.`; B.msgPid = pid;
      if (typeof SFX !== 'undefined') SFX.play('nope');
      B.redraw(where); return false;
    }
    const p = B.who(pid), pr = p && p.slots && p.slots.prep;
    const r = P._set0.apply(this, arguments);
    if (r && pr && p.slots && !p.slots.prep) p.slots.prep = pr;   // the Prep slot survives a key or auto change
    return r;
  };

  /* Ray of Frost, a ladder cantrip (it used to be a card: an aura round the Leader) */
  const foes = () => { const G = gl('G'); return typeof liveFoes === 'function' ? liveFoes() : ((G && G.enemies) || []).filter(e => !e.dead); };
  P.frostAt = function(u){
    let b = null, bd = P.K.frost.range;
    for (const e of foes()){ const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd && (typeof clearLine !== 'function' || clearLine(u, e))){ bd = d; b = e; } }
    return b;
  };
  P.FROST = {id: 'frost', spec: 'MAGE', name: 'Ray of Frost', src: 'L1', aimed: true, max: 3,
    when: u => { const e = P.frostAt(u); return e ? {x: e.x, y: e.y} : false; },
    fx(u, aim){
      const G = gl('G'), F = window.F33;
      let e = aim && F && F.foeAt ? F.foeAt(aim.x, aim.y, 60) : null;
      if (e && Math.hypot(e.x - u.x, e.y - u.y) > P.K.frost.range) e = null;
      e = e || P.frostAt(u);
      if (!e){ if (typeof pop === 'function') pop(u.x, u.y - 46, 'NO TARGET', '#999'); return false; }
      const r = B.rank(u, 'frost');
      gl('strike')(e, 0, 0, {piercing: true, flat: 1, from: u});
      e.slow = Math.max(e.slow || 0, P.K.frost.slow[r - 1] || 90);
      if (G && G.fx) G.fx.push({ring: true, x: e.x, y: e.y, r: 26, life: 14, c: '#9fd8ff'});
      return true;
    }};
  Object.defineProperty(P.FROST, 'cdS', {get(){ return P.K.frost.cdS; }, enumerable: true});

  /* ---- step 4: the chapter library ---- */
  P.lib = () => { const M = gl('META'); if (!M) return []; if (!Array.isArray(M.lib33)) M.lib33 = []; return M.lib33; };
  P.researchCost = id => { const L = B.LAD[id]; return L ? P.K.research[L.src] || 0 : 0; };
  B.research = function(id, where){
    const M = gl('META'), L = B.LAD[id];
    if (!M || !L || !B.live() || B.locked() || P.lib().includes(id) || !B.library(L.spec).includes(id)) return false;
    const c = P.researchCost(id);
    if ((M.treasury | 0) < c){ if (typeof SFX !== 'undefined') SFX.play('nope'); return false; }
    M.treasury -= c; P.lib().push(id);
    B.msg = `${L.name} joins the chapter library.`; B.msgPid = null;
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof SFX !== 'undefined') SFX.play('pick');
    B.redraw(where); return true;
  };
  B.book = function(p, spec){   // the starting key, then every library entry of the Specialty whose gate they meet
    spec = spec || (p && p.spec); const st = B.start(spec), out = st ? [st] : [];
    for (const id of P.lib().concat((p && Array.isArray(p.book)) ? p.book : [])){
      const R = A.REG[id]; if (R && R.spec === spec && !out.includes(id) && P.meets(p, id)) out.push(id); }
    return out;
  };
  B.copy = function(pid, id, where){ return B.research(id, where); };   // the old Copy button researches
  B.cost = function(id){ return P.researchCost(id); };
  B.waiting = function(){ return B.scrolls().filter(id => !P.lib().includes(id)); };

  /* the load fold: idempotent, run at init and on every sync */
  P.foldIds = ['frost'].concat(P.CUT);
  P.techOf = id => { const e = S1() && S1().BY[id]; return (e && e.to) || id; };
  P.fold = function(){
    const M = gl('META'); if (!M) return 0;
    const lib = P.lib(); let n = 0;
    const add = id => { if (A.REG[id] && B.LAD[id] && !lib.includes(id)){ lib.push(id); n++; } };
    for (const p of [M.leader].concat(M.roster || [])){
      if (!p) continue;
      for (const id of (Array.isArray(p.book) ? p.book : [])) add(id);
      const cut = (p.picks || []).filter(id => P.foldIds.includes(id));
      if (cut.length){ p.picks = p.picks.filter(id => !cut.includes(id)); cut.forEach(id => add(P.techOf(id))); }
    }
    return n;
  };

  /* ---- once at PROG.init: Fireball to L2 with Magic 3, Ray of Frost joins the ladder, the fold ---- */
  P.init24 = function(){
    if (P._done24) return; P._done24 = true;
    const LF = B.LAD.fireball, RF = A.REG.fireball;
    if (LF){ LF.src = P.K.fireball.src; LF.minMagic = P.K.fireball.minMagic; }
    if (RF){ RF.src = P.K.fireball.src; RF.minMagic = P.K.fireball.minMagic; }
    if (!B.LAD.frost){ if (!P.FROST.glyph && B.glyphOf) P.FROST.glyph = B.glyphOf('frost'); B.LAD.frost = P.FROST; A.def2(P.FROST); }
    P.fold();
  };
  const init3 = P.init;
  P.init = function(){ const r = init3.apply(this, arguments); P.init24(); return r; };
  const sync3 = P.sync;
  P.sync = function(){ P.fold(); return sync3.apply(this, arguments); };

  /* ---- self-test rows, added to PROG.selfTest ---- */
  P._rows24 = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    if (!S1()){ ok('PROG1 sheet loaded', false); return rows; }
    const M0 = gl('META'), K0 = JSON.parse(JSON.stringify(P.K)), SFX = gl('SFX'), sp0 = SFX && SFX.play;
    const sv = {sm: gl('saveMeta'), live: B.live, locked: B.locked, rd: B.redraw, msg: B.msg, mp: B.msgPid, u0: P._use0};
    window.__p24m = {treasury: 1000, roster: [], officers: [], leader: null, pendingPicks: 0, facilities: {magetower: 1, training: 1}, damaged: {}, scrolls: []};
    window.__p24f = () => {};
    try {
      (0, eval)('META = window.__p24m; saveMeta = window.__p24f');
      if (SFX) SFX.play = () => {};
      B.live = () => true; B.locked = () => false; B.redraw = () => {};
      const LF = B.LAD.fireball;
      ok('tiers from the sheet: Dark Illusion Quick, Shield Bash Battle, Stone Wall Prepared, Ray of Frost Quick',
        P.tier('illusion') === 'Q' && P.tier('bash') === 'B' && P.tier('stonewall') === 'P' && P.tier('frost') === 'Q' && P.tier('veil') === 'P');
      /* ABIL33: the cooldown a cast on auto sees */
      let seen = null; P._use0 = () => { seen = A.K.autoMul; return true; };
      const u = {spec: 'WITCH'};
      A.use(u, {id: 'illusion', auto: true}); ok('ABIL33: a Quick entry on auto runs at its own cooldown', seen === 1, seen);
      A.use(u, {id: 'briar', auto: true}); ok('ABIL33: a Battle entry on auto runs at x' + A.K.autoMul, seen === A.K.autoMul, seen);
      seen = null; const pr = A.use(u, {id: 'veil', auto: true}); ok('ABIL33: a Prepared entry never fires on auto', pr === false && seen === null);
      A.use(u, {id: 'veil'}); ok('ABIL33: a Prepared entry on the key fires as built', seen === A.K.autoMul);
      ok('autoMul is put back after a Quick cast', A.K.autoMul === K0.autoMul || A.K.autoMul === 1.5, A.K.autoMul);
      P._use0 = sv.u0;
      /* the chapter library */
      ok('Fireball moves to L2 with Magic 3', LF && LF.src === 'L2' && LF.minMagic === 3 && A.REG.fireball.minMagic === 3);
      ok('Ray of Frost is a ladder entry (L1, Quick, its own effect)', B.LAD.frost && B.LAD.frost.src === 'L1' && A.REG.frost && A.REG.frost.own && A.REG.frost.cd === P.K.frost.cdS);
      const m1 = {id: 911, name: 'Iva', spec: 'MAGE', magic: 2, adv: 1, picks: []}, m2 = {id: 912, name: 'Oro', spec: 'MAGE', magic: 2, adv: 1, picks: []};
      META.roster = [m1, m2]; META.leader = {name: 'Vel', spec: 'SOLDIER', level: 1, picks: []};
      ok('research costs L1 120, L2 240, scroll 150', P.researchCost('frost') === 120 && P.researchCost('fireball') === 240 && P.researchCost('tremor') === 150);
      ok('research once: 120 gp, the entry joins META.lib33', B.research('frost') && META.treasury === 880 && META.lib33.includes('frost'), META.treasury);
      ok('no second payment', !B.research('frost') && META.treasury === 880);
      ok('research once, two mates slot it', B.set(911, 0, 'frost') && B.set(912, 0, 'frost') && B.loadout(m1).auto.includes('frost') && B.loadout(m2).auto.includes('frost'));
      const k1 = B.LAD.burning.src === 'start' ? 'bolt' : 'burning';   // R5 (js/prog5.js): Burning Hands is the key, Lightning Bolt the L1 entry
      ok('the old Copy button researches', B.copy(911, k1) && META.lib33.includes(k1) && META.treasury === 760, META.treasury);
      ok('no library building, no research (Briar Thicket, no Alchemy Lab)', !B.research('briar') && META.treasury === 760);
      META.lib33.push('stonewall');
      ok('a Prepared entry cannot be set to auto', !B.set(911, 0, 'stonewall') && !B.loadout(m1).auto.includes('stonewall'));
      ok('but it may sit on the key', B.set(911, 'key', 'stonewall') && B.loadout(m1).active === 'stonewall');
      ok('Q14: a Prepared entry goes in the Prep slot', B.set(911, 'prep', 'stonewall') && B.loadout(m1).prep === 'stonewall');
      ok('Q14: the Prep slot refuses a Battle or Quick entry', !B.set(911, 'prep', 'frost') && B.loadout(m1).prep === 'stonewall');
      ok('Q14: the Prep slot survives a key change', B.set(911, 'key', B.start('MAGE')) && B.loadout(m1).prep === 'stonewall');
      { const G0 = gl('G'), R = A.REG.stonewall, fx0 = R.fx, u0 = {spec: 'MAGE', p: m1, lo33: B.loadout(m1), ab33: {}}; let cast = 0;
        const TG = {frame: 1, leader: {spec: 'SOLDIER', isLeader: true}, squad: [u0], over: false};
        u0.state = 'up'; window.__p24g = TG; R.fx = () => { cast++; return true; };
        try { (0, eval)('G = window.__p24g');
          const n1 = P.prepCast(), n2 = P.prepCast();
          ok('Q14: the Prep slot is cast once, free, as the fight starts', n1 === 1 && n2 === 0 && cast === 1 && !(A.ab(u0, 'stonewall').cd > 0), [n1, n2, cast].join('/'));
        } finally { R.fx = fx0; window.__p24g = G0; (0, eval)('G = window.__p24g'); delete window.__p24g; } }
      m1.slots = {active: 'bolt', auto: ['stonewall', 'frost']};
      ok('a Prepared ability in an auto slot is dropped, the rest kept', JSON.stringify(B.loadout(m1).auto) === '["frost"]');
      META.lib33.push('fireball'); m1.magic = 2;
      ok('a gate still blocks: Fireball needs Magic 3', !B.book(m1).includes('fireball') && !B.set(911, 'key', 'fireball'));
      m1.magic = 3; ok('at Magic 3 it is in the book', B.book(m1).includes('fireball'));
      const s1 = {id: 913, name: 'Ash', spec: 'SOLDIER', adv: 0, picks: []}; META.roster.push(s1); META.lib33.push('sprint', 'breakarm', 'push');
      ok('martial gates: a Level 1 Soldier has Push Back, not Sprint (Level 3) or Break Armour (Level 5)', B.book(s1).includes('push') && !B.book(s1).includes('sprint') && !B.book(s1).includes('breakarm'));
      s1.adv = 2; ok('at Level 3, Sprint', B.book(s1).includes('sprint') && !B.book(s1).includes('breakarm'));
      s1.adv = 4; ok('at Level 5, Break Armour', B.book(s1).includes('breakarm'));
      ok('the starting key has no gate', B.book({spec: 'MAGE', magic: 1})[0] === B.start('MAGE'));
      META.scrolls = ['tremor'];
      ok('a found scroll waits, then is scribed for 150 gp', B.waiting().includes('tremor') && B.research('tremor') && META.treasury === 610 && !B.waiting().length, META.treasury);
      /* the load fold */
      const fh = {name: 'Wren', spec: 'FOLK_HERO', level: 3, picks: ['rally', 'scout']}, sc = {id: 914, name: 'Rook', spec: 'SCOUNDREL', adv: 0, picks: ['poisoned'], book: ['disengage']};
      META.leader = fh; META.roster.push(sc); P.sync();
      ok('fold: a cut card leaves the picks and its technique joins the library', !fh.picks.includes('rally') && fh.picks.includes('scout') && META.lib33.includes('rally')
        && !sc.picks.includes('poisoned') && META.lib33.includes('poison'), META.lib33.join(','));
      ok('fold: a personal book joins the library', META.lib33.includes('disengage'));
      const n0 = META.lib33.length; P.fold(); ok('the fold runs once (no doubles)', META.lib33.length === n0);
    } catch (e) { ok('no throw', false, e.message); }
    finally {
      window.__p24m = M0; window.__p24s = sv.sm; (0, eval)('META = window.__p24m; saveMeta = window.__p24s');
      delete window.__p24m; delete window.__p24s; delete window.__p24f;
      if (SFX) SFX.play = sp0; B.live = sv.live; B.locked = sv.locked; B.redraw = sv.rd; B.msg = sv.msg; B.msgPid = sv.mp; P._use0 = sv.u0;
      Object.assign(P.K, K0); P.K.frost = K0.frost; P.K.research = K0.research; P.K.fireball = K0.fireball;
    }
    return rows;
  };
  const st3 = P.selfTest;
  P.selfTest = function(){
    const r = st3.apply(this, arguments), more = P._rows24();
    r.rows = r.rows.concat(more); r.total = r.rows.length; r.pass = r.rows.filter(x => x.pass).length;
    return r;
  };
})();
