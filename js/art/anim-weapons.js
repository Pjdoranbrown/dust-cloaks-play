/* INDEX ANIM48 - F-48 Phase 2 (Art lead): the weapon in the hand matches the action, and attacks play out a little longer.
   Before: every member of the squad looses arrows with the squad's ranged weapon, but only the Folk Hero held a bow, so a
   Soldier "shot" with a spear in the hand and a Folk Hero swung the bow as a club.
   Now, for members of the Chapter (not enemies):
     - loosing an arrow: the figure holds the squad's bow or crossbow; the usual weapon is slung on the back;
     - a melee blow from a bow carrier: a short sword in the hand; the bow is slung on the back;
     - the figure keeps that weapon out for ANIM48.hold ticks after the last such blow, then goes back to the usual look;
     - the attack pose plays over ANIM48.len ticks (was 12) when the figure stands still, so the swing and the draw can be read.
   Camp-defence veterans and officers get the same, and now show the shooting or casting pose when they loose.
   Auxiliaries (militia, volunteers, wood elves, hedge-mages) and the men on the wall get the same:
   militia hold a bow when they loose, elf archers draw a blade in a melee, wall archers show the shooting pose.
   INT-1 group 10: no switch (on, swap, allies, aux baked in). ANIM48.len = 12 gives the old attack length. */
(function(){
  'use strict';
  const A = window.ANIM48 = {len:20, hold:150, fails:{}, made:0};
  const G_ = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const vars = new Map();
  const CASTERS = ['MAGE', 'WITCH', 'CLERIC'];
  const isHand = b => b === 'hdR' || b === 'hdL';

  // the weapon is everything on a hand bone except the hand itself (first part) and the skin-coloured thumb
  function split(rec){
    const keep = [], wp = [], seen = {};
    for (const q of rec.parts){
      if (isHand(q.b)){ const first = !seen[q.b]; seen[q.b] = 1; if (!first && q.z !== 'skin'){ wp.push(q); continue; } }
      keep.push(q);
    }
    return {keep, wp};
  }
  // sling a weapon down the back (chest bone: y up from the belt, z forward)
  function stow(q, alongY, side){
    const m = alongY ? v => [v[0] + side, v[1] + 10, -7.4 - v[2]] : v => [v[0] + side, v[2] * 0.78 + 5, -7.4 - v[1]];
    const o = {b:'chest', t:q.t, z:q.z};
    if (q.t === 'cap'){ o.a = m(q.a); o.p = m(q.p); o.r = q.r; }
    else if (q.t === 'box' || q.t === 'ell'){ o.c = m(q.c); o.r = alongY ? q.r.slice() : [q.r[0], q.r[2] * 0.78, q.r[1]]; }
    else return null;
    return o;
  }
  function variant(rec, kind){
    const k = rec.key + ':' + kind; if (vars.has(k)) return vars.get(k);
    let v = null;
    try {
      const W = G_('WEAPON3D'), {keep, wp} = split(rec), parts = keep.slice();
      const main = wp.filter(q => q.b === (rec.grip === 'bow' ? 'hdL' : 'hdR'));
      for (const q of main){ const s = stow(q, rec.grip === 'bow' || rec.grip === 'staff', rec.grip === 'bow' ? 0 : 2.5); if (s) parts.push(s); }
      if (kind === 'blade'){ for (const q of W.sword()) parts.push(Object.assign({b:'hdR'}, q)); }
      else {
        for (const q of W[kind]()) parts.push(Object.assign({b:'hdL'}, q));
        parts.push({b:'cape', t:'cap', a:[-4, -2, 1.2], p:[3, -16, 1.2], r:2, z:'leather'}, {b:'cape', t:'ell', c:[-4.2, 0, 1.4], r:[1.6, 2.2, 1.6], z:'wood'});   // quiver
      }
      v = Object.assign({}, rec, {parts, grip:kind === 'blade' ? 'swing' : 'bow', key:rec.key + 'a48' + kind});
      A.made++;
    } catch (e){ A.fails.variant = String(e && e.message || e); v = null; }
    vars.set(k, v); if (vars.size > 200) vars.delete(vars.keys().next().value);
    return v;
  }
  A.variant = variant;
  function rangedKind(){
    try { const g = G_('G'), art = G_('RANGED_ART'), k = g && g.ranged && art && art[g.ranged.id]; return k === 'xbow' ? 'xbow' : 'bow'; } catch (e){ return 'bow'; }
  }
  // render the swapped figure ahead of need, through the game's own idle queue, so the first shot does not hitch
  const warmed = new Set();
  function warm(rec, caster){
    if (warmed.has(rec.key)) return; warmed.add(rec.key); if (warmed.size > 300) warmed.clear();
    try {
      const q = G_('r3dFramesAsync'), St = G_('R3D_STYLES')[G_('r3dStyleId')() || 'crisp']; if (typeof q !== 'function') return;
      const v = rec.grip === 'bow' ? variant(rec, 'blade') : caster ? null : variant(rec, rangedKind()); if (!v) return;
      for (const clip of [rec.grip === 'bow' ? 'melee' : 'shoot', 'idle', 'walk', 'run']) for (let d = 0; d < 8; d++) q(v, clip, d, St, true);
    } catch (e){ A.fails.warm = String(e && e.message || e); }
  }
  // an auxiliary: no person record (or the wall's nameless militia), a known auxiliary type that can shoot or cast
  function isAux(u){ try { if (u.kind === 'militia' && u.wall30) return true; const X = G_('AUX'); return !!(u.auxUnit && !(u.p && u.p.spec) && X && X[u.type] && (X[u.type].shoot || X[u.type].magic)); } catch (e){ return false; } }
  A.isAux = isAux;
  function isMember(u){
    const g = G_('G'); if (!u) return false;
    if (isAux(u) && g && (g.allies || []).includes(u)) return true;      // auxiliaries and the wall's militia (their figures are enemy-kit, e3d)
    if (u.e3d) return false;
    if (g && (u === g.leader || (g.squad || []).includes(u))) return true;
    if (g && u.ally && u.p && (g.allies || []).includes(u)) return true;      // the veterans and officers who hold the camp
    return false;
  }
  /* Two hooks. r3dChoose (every draw path calls it) reads the unit's state, stretches the attack pose and names the weapon
     variant on its answer (c.a48); the callers pass that answer on to r3dDraw, which then draws the variant recipe. */
  function hook(){
    const f = G_('r3dChoose'), d = G_('r3dDraw');
    if (typeof f !== 'function' || typeof d !== 'function'){ A.fails.hook = 'no r3dChoose or r3dDraw'; return; }
    window.__anim48_choose = function(rec, u, frame, tick){
      if (!rec || rec.rig !== 'humanoid' || !isMember(u)) return f(rec, u, frame, tick);
      let fr2 = frame, at0 = u.atkT, fake = false, kind = '';
      try {
        const g = G_('G'), now = g.frame | 0, st = u._a48 = u._a48 || {a:0, t0:-999, k:0, wt:-999, w:'', x:u.x, y:u.y, f:-1, mv:false};
        if (st.f !== now){ st.mv = Math.hypot(u.x - st.x, u.y - st.y) > 0.25; st.x = u.x; st.y = u.y; st.f = now;
          if ((u.atkT || 0) > st.a && (frame === 3 || frame === 4)){ st.t0 = now; st.k = frame;                // a new blow
            if (u.wall30) st.k = st.ak = u.stones ? 3 : 4;      // the men on the wall only loose (or throw stones)
            else if (isAux(u)) st.k = st.ak = (u.timer === 60 || u.timer === 12) ? 3 : 4;      // an auxiliary's timer: 60 after a blow, 70 or 120 after a shot or a spell
            else if (u.ally) st.k = st.ak = u.timer === 60 ? 4 : 3; }      // camp allies always ask for the melee frame; their timer tells a shot (60) from a blow (52)
          st.a = u.atkT || 0; }
        if ((u.ally || u.auxUnit) && frame === 3 && st.ak === 4) frame = fr2 = 4;
        const caster = rec.grip === 'staff' || CASTERS.includes(u.spec || (u.p && u.p.spec));
        warm(rec, caster);
        if (frame === 3 || frame === 4){ st.w = frame === 4 ? 'shoot' : 'melee'; st.wt = now; }
        // a longer attack pose, only while standing
        const pr = (now - st.t0) / A.len;
        if (A.len > 12 && st.k && pr >= 0 && pr < 1 && !st.mv && (frame === 3 || frame === 4 || frame === 0)){
          fr2 = st.k; u.atkT = Math.max(0.01, 12 * (1 - pr)); fake = true; st.wt = now;
        }
        if (now - st.wt <= A.hold){
          if (st.w === 'shoot' && !caster && rec.grip !== 'bow') kind = rangedKind();
          else if (st.w === 'melee' && rec.grip === 'bow' && !u.stones) kind = 'blade';
        }
      } catch (e){ A.fails.choose = String(e && e.message || e); fr2 = frame; kind = ''; }
      let c;
      try { c = f(kind ? (variant(rec, kind) || rec) : rec, u, fr2, tick); }
      finally { if (fake) u.atkT = at0; }
      if (c && kind) c.a48 = kind;
      return c;
    };
    window.__anim48_draw = function(rec, u, x, y, s, o){
      if (o && o.a48 && rec && rec.rig === 'humanoid'){ const v = variant(rec, o.a48); if (v) rec = v; }
      return d(rec, u, x, y, s, o);
    };
    (0, eval)('r3dChoose = window.__anim48_choose; r3dDraw = window.__anim48_draw');
  }
  try { hook(); } catch (e){ A.fails.hook = String(e && e.message || e); }

  A.selfTest = function(){
    const out = {pass:0, fail:0, notes:[]}, ok = (c, n) => { if (c) out.pass++; else { out.fail++; out.notes.push(n); } };
    try {
      const mk = spec => G_('r3dRecipeOf')({race:'HUMAN', spec, name:'T', sex:'m', seed:7}, false);
      const so = mk('SOLDIER'), fh = mk('FOLK_HERO');
      const b = variant(so, 'bow'), s = variant(fh, 'blade');
      ok(b && b.grip === 'bow' && b.key !== so.key, 'soldier bow variant');
      ok(b && b.parts.some(q => q.b === 'hdL' && q.z === 'string'), 'bow in the left hand');
      ok(b && !b.parts.some(q => q.b === 'hdR' && q.z === 'metal' && q.t === 'ell' && q !== b.parts.find(p => p.b === 'hdR')), 'spear out of the right hand');
      ok(b && b.parts.filter(q => q.b === 'chest').length > so.parts.filter(q => q.b === 'chest').length, 'spear slung on the back');
      ok(s && s.grip === 'swing' && s.parts.some(q => q.b === 'hdR' && q.z === 'metal'), 'folk hero blade variant');
      ok(s && !s.parts.some(q => q.b === 'hdL' && q.z === 'string'), 'bow out of the left hand');
      ok(so.parts.length === mk('SOLDIER').parts.length, 'the usual recipe is untouched');
      { const g = G_('G'), u = {auxUnit:true, type:'militia', e3d:true, x:0, y:0}, lv = {auxUnit:true, type:'levy', e3d:true}, fk = {auxUnit:true, type:'folk30', e3d:true}; let was;
        try { if (g){ was = g.allies; g.allies = [u, lv, fk]; } ok(!g || isMember(u), 'a militia auxiliary counts as a member'); ok(!isMember(lv) && !isMember(fk), 'levies and caravan folk are left alone'); } finally { if (g) g.allies = was; } }
      { const g = G_('G'), u = {ally:true, p:{}, x:0, y:0}; let was; try { if (g){ was = g.allies; g.allies = [u]; } ok(!g || isMember(u), 'a camp ally counts as a member'); } finally { if (g) g.allies = was; } }
      ok(G_('r3dChoose') === window.__anim48_choose && G_('r3dDraw') === window.__anim48_draw, 'hooks in place');
    } catch (e){ out.fail++; out.notes.push(String(e && e.message || e)); }
    return out;
  };
})();
