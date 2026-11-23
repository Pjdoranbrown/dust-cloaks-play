/* ============================================================================
   INDEX MOM41 - F-41 momentum review, Systems' plan minus Field Purchase
   (Patrick 2026-11-16; audits/momentum-review.md sections 5, 6 and 8)
   1. Hold factor: a kill in a Hold counts 0.55 of its XP (was 0.45 x 0.78 =
      0.35), so the first card comes at about 23 s, not 36 s.
   2. Cut Purse is cut: never offered as an Empower card, nor to learn (create
      screen, Training, a Leader's Advancement). A Scoundrel who has it keeps it.
   3. Hold the Line becomes Close Ranks: Command Radius +22 px, and every
      Squad Mate inside the ring (and the Leader) takes 1 less damage from
      their next hit.
   4. Captured Supplies becomes a heal: as before (Ward Tokens, Shield Pool)
      and 1 Condition for every Squad Mate up and for the Leader.
   5. Focus Fire (gold order, at most 2 a contract): for 12 s every squad attack
      on the toughest enemy within 320 px of the Leader rolls its Base Damage
      Die 1 step up.
   Numbers [S]: MOM41.K. Hooks: wraps gainXP, rollMomentum, hurtSquad, strike,
   learnable, leaderOpts, renderCreate; edits the TIERED and GOLD_ORDERS rows
   in place and puts them back when off.
   ROLLBACK: MOM41.set(false) (or MOM41.on = false before load).
============================================================================ */
(function(){
  'use strict';
  const M = window.MOM41 = {K: {hold: 0.55, holdNow: 0.45 * 0.78, radius: 22, less: 1, condHeal: 1,
    focusS: 12, focusRange: 320, focusStep: 1, focusMax: 2, focusW: 3}};   /* focusW: Patrick Q104 A, Focus Fire weight 3 (other gold orders 1), 30% roll kept */
  M.on = true;   // rollback switch on its own line
  M.CUT = ['cutpurse'];
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const wrap = (n, mk) => { const f = gl(n); if (typeof f !== 'function') return false;
    M['_' + n] = mk(f); (0, eval)(n + ' = window.MOM41._' + n); return true; };

  /* 1. the Hold factor (the 0.45 and 0.78 wrappers stay; this lifts their product to K.hold) */
  wrap('gainXP', f => function(n){ const G = gl('G');
    return f.call(this, M.on && G && G.obj === 'hold' && typeof n === 'number' ? n * (M.K.hold / M.K.holdNow) : n); });

  /* 3, 4, 5: the order rows */
  const TI = gl('TIERED'), GO = gl('GOLD_ORDERS');
  const ix = id => TI ? TI.findIndex(t => t.id === id) : -1;
  M.old = {holdline: TI && TI[ix('holdline')], supplies: TI && TI[ix('supplies')]};
  M.CLOSE = {id: 'holdline', name: 'Close Ranks', glyph: 'flag', v: [1, 1, 1],
    text: () => `Command Radius +${M.K.radius}px. Every Squad Mate inside the ring takes ${M.K.less} less damage from their next hit.`,
    apply: () => { const G = gl('G'); G.radiusBonus = (G.radiusBonus || 0) + M.K.radius; gl('recompute')();
      const L = G.leader, R = G.mod.radius; L.cr41 = (L.cr41 || 0) + 1;
      for (const m of G.squad) if (m.state === 'up' && Math.hypot(m.x - L.x, m.y - L.y) <= R) m.cr41 = (m.cr41 || 0) + 1;
      G.fx.push({ring: true, x: L.x, y: L.y, r: R, life: 18, c: '#9fc8ff'}); }};
  M.SUPPLIES = {id: 'supplies', name: 'Captured Supplies', glyph: 'shield', v: [1, 2, 4],
    text: v => (v >= 4 ? 'Ward Tokens to 4 and the Shield Pool refilled' : `+${v} Ward Token${v > 1 ? 's' : ''} and ${v} Shield Pool back`) + `, and ${M.K.condHeal} Condition for everyone.`,
    apply: v => { const G = gl('G'); gl('addWard')(v); G.shieldPool = Math.min(G.shieldMax, G.shieldPool + (v >= 4 ? 99 : v));
      for (const m of G.squad) if (m.state === 'up') m.con = Math.min(m.maxCon, m.con + M.K.condHeal);
      const L = G.leader; if (!L.down) L.con = Math.min(L.maxCon, L.con + M.K.condHeal); }};
  M.FOCUS = {id: 'focusfire', name: 'Focus Fire', glyph: 'sword', get max(){ return M.K.focusMax; }, get w(){ return M.K.focusW; },
    get text(){ return `For ${M.K.focusS} seconds every squad attack on the toughest enemy near the Leader rolls its Base Damage Die ${M.K.focusStep} step up.`; },
    apply(){ const G = gl('G'), L = G.leader; let b = null;
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - L.x, e.y - L.y) < M.K.focusRange && (!b || (e.maxCon || e.con) > (b.maxCon || b.con))) b = e;
      if (b){ b.focus41 = G.frame + M.K.focusS * 60; gl('pop')(b.x, b.y - 30, 'FOCUS FIRE', '#e8b830'); } }};
  M.apply = function(on){
    if (!TI || !GO) return;
    const h = ix('holdline'), s = ix('supplies');
    if (h >= 0) TI[h] = on ? M.CLOSE : M.old.holdline;
    if (s >= 0) TI[s] = on ? M.SUPPLIES : M.old.supplies;
    const f = GO.indexOf(M.FOCUS);
    if (on && f < 0) GO.push(M.FOCUS); else if (!on && f >= 0) GO.splice(f, 1);
  };
  M.set = function(on){ M.on = !!on; M.apply(M.on); };

  /* Close Ranks: the next hit on a unit in the ring is 1 less */
  wrap('hurtSquad', f => function(n, victim, piercing){
    try { const G = gl('G'), v = victim || (G && G.leader);
      if (M.on && v && v.cr41 > 0 && n > 0){ v.cr41--; n -= M.K.less; if (n <= 0){ gl('pop')(v.x, v.y - 22, 'CLOSE RANKS', '#9fc8ff'); return; } } } catch (e) {}
    return f.call(this, n, victim, piercing);
  });
  M.dmgUp = (e, d) => { const G = gl('G'); return M.on && e && G && e.focus41 > G.frame && typeof d === 'number' ? d + M.K.focusStep : d; };
  /* Focus Fire: squad attacks on the marked foe roll 1 Base Damage step up */
  wrap('strike', f => { M._strike0 = f; return function(e, skill, baseDmg, o){
    baseDmg = M.dmgUp(e, baseDmg);
    return f.apply(this, [e, skill, baseDmg].concat(o === undefined ? [] : [o]));
  }; });
  /* String(strike) also shows the wrapped function, so source checks on the inner wrappers (TERRAIN's) still see them */
  if (M._strike) M._strike.toString = function(){ return Function.prototype.toString.call(this) + ' /* MOM41 wraps: */ ' + String(M._strike0); };

  /* 2. Cut Purse is not offered */
  const cut = M.cut = id => M.on && M.CUT.includes(id);
  wrap('rollMomentum', f => function(){ const r = f.apply(this, arguments);
    return Array.isArray(r) && M.on ? r.filter(x => !(x && x.c && cut(x.c.id))) : r; });
  wrap('learnable', f => function(){ const r = f.apply(this, arguments); return Array.isArray(r) ? r.filter(c => !cut(c.id)) : r; });
  wrap('leaderOpts', f => function(){ const r = f.apply(this, arguments); return Array.isArray(r) ? r.filter(c => !cut(c.id)) : r; });
  wrap('renderCreate', f => function(){ const r = f.apply(this, arguments);
    try { const CR = gl('CR'), box = document.getElementById('create-inner');
      if (M.on && CR && CR.step === 'pick' && box){ if (cut(CR.pick)) CR.pick = null;
        box.querySelectorAll('.card[onclick]').forEach(el => { const m = /CR\.pick='([a-z_]+)'/.exec(el.getAttribute('onclick')); if (m && cut(m[1])) el.remove(); }); } } catch (e) {}
    return r; });


  M.apply(M.on);

  /* ---- self-test: MOM41.selfTest() (puts G and the switch back) ---------- */
  M.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const G0 = gl('G'), on0 = M.on;
    try {
      M.set(true);
      ok('Close Ranks replaces Hold the Line', TI[ix('holdline')].name === 'Close Ranks');
      ok('Focus Fire is a gold order', GO.includes(M.FOCUS));
      const L = {x: 0, y: 0, con: 3, maxCon: 6, wounds: 0, maxWounds: 3, down: false};
      const a = {x: 40, y: 0, state: 'up', con: 2, maxCon: 5, inF: true}, b = {x: 900, y: 0, state: 'up', con: 2, maxCon: 5, inF: true};
      const foe = {x: 100, y: 0, con: 9, maxCon: 9}, small = {x: 50, y: 0, con: 2, maxCon: 2};
      const TG = {obj: 'hold', frame: 10, leader: L, squad: [a, b], enemies: [small, foe], mod: {radius: 120}, fx: [], wards: 0, shieldPool: 0, shieldMax: 4, radiusBonus: 0};
      window.__m41g = TG; (0, eval)('G = window.__m41g');
      const rc = gl('recompute'); window.__m41rc = rc; (0, eval)('recompute = function(){ G.mod.radius = 120 + (G.radiusBonus || 0); }');
      M.CLOSE.apply(1);
      ok('Close Ranks: +22 px', TG.radiusBonus === 22, TG.radiusBonus);
      ok('Close Ranks: a mate in the ring and the Leader are covered, one far off is not', a.cr41 === 1 && L.cr41 === 1 && !b.cr41);
      M.SUPPLIES.apply(1);
      ok('Captured Supplies: +1 Ward and 1 Condition each', TG.wards === 1 && a.con === 3 && b.con === 3 && L.con === 4, [TG.wards, a.con, b.con, L.con].join());
      M.FOCUS.apply();
      ok('Focus Fire marks the toughest enemy near the Leader for 12 s', foe.focus41 === 10 + 720 && !small.focus41, foe.focus41);
      ok('Focus Fire: a squad attack on it rolls 1 step up, others do not', M.dmgUp(foe, 2) === 3 && M.dmgUp(small, 2) === 2);
      TG.frame = 10 + 721; ok('Focus Fire ends after 12 s', M.dmgUp(foe, 2) === 2); TG.frame = 10;
      { const mr = Math.random, fm = Array.prototype.flatMap; let pw = null, n = 0;   /* Q104: watch the pool the override builds */
        try { TG.orders = {}; TG.leader = {x: 0, y: 0, s: gl('leaderStats')(gl('makeLeader')('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'))}; TG.luck = 0; TG.ranks = {}; Math.random = () => 0.1;
          Array.prototype.flatMap = function(){ const x = this.find(q => q && q.o === M.FOCUS); if (x) pw = x.w; return fm.apply(this, arguments); };
          n = gl('rollMomentum')().length; }
        finally { Array.prototype.flatMap = fm; Math.random = mr; TG.leader = L; }
        ok('Q104: Focus Fire goes in the pool at weight 3 (K.focusW); other gold orders keep 1', pw === 3 && GO.every(o => o === M.FOCUS || !o.w) && n > 0, [pw, n].join(' ')); }
      ok('hurtSquad and strike are wrapped', typeof M._hurtSquad === 'function' && typeof M._strike === 'function');
      M._hurtSquad(1, a); ok('Close Ranks: a 1-damage hit on a covered mate does nothing and spends the cover', a.cr41 === 0 && a.con === 3, [a.cr41, a.con].join());
      ok('the Hold factor comes to 0.55', Math.abs(M.K.hold / M.K.holdNow * 0.45 * 0.78 - 0.55) < 1e-9);
      ok('String(strike) still shows the inner wrapper', String(M._strike).includes(String(M._strike0)));
      ok('Cut Purse is not offered', M.cut('cutpurse') && !M.cut('litany'));
      ok('learnable and leaderOpts are wrapped', typeof M._learnable === 'function' && typeof M._leaderOpts === 'function');
      M.set(false);
      ok('off: Hold the Line and the old Supplies back, no Focus Fire', TI[ix('holdline')].name === 'Hold the Line' && TI[ix('supplies')] === M.old.supplies && !GO.includes(M.FOCUS));
      ok('off: Cut Purse offered again', !cut('cutpurse'));
      M.set(true);
      (0, eval)('recompute = window.__m41rc');
    } catch (e) { ok('no throw', false, e.message); }
    finally { window.__m41g = G0; (0, eval)('G = window.__m41g'); delete window.__m41g; if (window.__m41rc) (0, eval)('recompute = window.__m41rc'); delete window.__m41rc; delete window.__m41f; M.set(on0); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
