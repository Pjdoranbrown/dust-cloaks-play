/* ============================================================================
   INDEX 101 - VO-1 visual overhaul, phase 2: smoother animation
   (Fable job 5b, audits/fable/vo1.md; targets in docs/art-direction.md section 4)
   Loads after js/art/look.js. Every clip that the choosers index is resampled in
   the pose domain: more rendered frames per cycle (idle 4 to 8, walk and run
   8 to 12, melee 6 to 10, shoot and cast to 8, hit 3 to 4, death 6 to 8) with
   the same cycle length in ticks, so nothing speeds up and feet do not slide.
   The one stepped clip (hit) is eased between its keys, the continuous ones
   (melee, shoot and cast already interpolate through keyedT) are sampled finer. The choosers are
   wrapped last so their indices follow the new counts: the walk and run phase
   from the GFX-01 gait tracker (st.gph, in old-cycle units), idle and hit from
   the tick and the hit timer, the attacks already read the clip's n.
   Left alone (their index is computed inline with the old counts): mount
   gaits, quadruped death, downed, sit, the prop and world rigs.
   Knobs: LOOK.anim.on (switch, only before the first frame bakes),
   LOOK.anim.n.<rig>.<clip> (frame counts), LOOK.anim.deathTicks.
   ROLLBACK: remove this script tag.
============================================================================ */
(function(){
'use strict';
if (typeof LOOK === 'undefined' || typeof R3D_CLIPS === 'undefined') return;
const A = LOOK.anim = {
  on: true,
  n: {
    humanoid: {idle:8, walk:12, run:12, melee:10, shoot:8, cast:8, hit:4, death:8},
    brute:    {idle:8, walk:12, run:12, melee:10, shoot:8, cast:8, hit:4, death:8},
    quad:     {idle:8, walk:12, run:12, attack:10},
    mount:    {melee:10, shoot:8, cast:8}
  },
  stepped: {humanoid: ['hit']},   // picks its key by floor(t * n): ease between the keys (melee, shoot and cast already run through keyedT)
  base: {},                                           // the old counts, per rig and clip
  deathTicks: 36                                      // a humanoid death plays over this many ticks (was 6 frames x 6)
};
const oldN = (rig, clip) => (A.base[rig] || {})[clip];
A.loop = clip => clip === 'walk' || clip === 'run' || clip === 'idle';   // AD 63080567: only these cycle; a past-the-end index on any other clip holds its last frame

/* resample: the new fn samples the old one, eased between its keys where it was stepped */
for (const rig in A.n){
  const set = R3D_CLIPS[rig]; if (!set) continue; A.base[rig] = {};
  for (const clip in A.n[rig]){
    const old = set[clip]; if (!old) continue;
    const N = A.n[rig][clip], m = old.n, stepped = (A.stepped[rig] || []).includes(clip);
    A.base[rig][clip] = m;
    if (rig === 'brute'){ old.n = N; continue; }   // brute clips call the humanoid fns at run time, so only the count changes
    const fn = old.fn;
    set[clip] = {n: N, fn: stepped ? (t, rec) => {
      const x = Math.min(m - 1e-6, t * m), i = Math.floor(x), f = x - i;
      const P = fn(i / m, rec); if (f < 1e-4 || i + 1 >= m) return P;
      return keyedT([[0, P], [1, fn((i + 1) / m, rec)]], f);
    } : fn};
  }
}
if (R3D_CLIPS.mount && R3D_CLIPS.mount.attack && R3D_CLIPS.mount.melee && A.base.mount && A.base.mount.melee){
  R3D_CLIPS.mount.attack = R3D_CLIPS.mount.melee;
  A.base.mount.attack = A.base.mount.melee;
}

/* choosers: indices in the new counts, same cycle length in ticks */
{ const f = r3dChoose;
  r3dChoose = function(rec, u, frame, tick){
    const c = f(rec, u, frame, tick);
    if (!A.on || !c) return c;
    try {
      const rig = (rec && R3D_CLIPS[rec.rig]) ? rec.rig : 'humanoid', T = R3D_CLIPS[rig][c.clip], b = oldN(rig, c.clip);   // read each rig's own clip count (mount, prop, etc.)
      if (!T) return c;
      if (!b || T.n === b){ if (c.i >= T.n) c.i = A.loop(c.clip) ? c.i % T.n : T.n - 1; return c; }   // AD 63080567: loops wrap; attack, hit and death clamp on their last frame
      const n = T.n, st = u._r3d;
      if (c.clip === 'walk' || c.clip === 'run'){
        const ph = st && st.gph !== undefined ? st.gph : st && st.f75 ? st.f75.ph : tick / (c.clip === 'run' ? 4 : 6);
        c.i = Math.floor(ph * n / b) % n;
      } else if (c.clip === 'idle') c.i = Math.floor(tick / 14 * n / b) % n;
      else if (c.clip === 'hit' && !c.mountPeak) c.i = Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.flash || 0) / 6) * n));
    } catch (e) {}
    return c;
  };
}
{ const f = r3qChoose;
  r3qChoose = function(u, frame, tick, runner, rig){
    const c = f(u, frame, tick, runner, rig);
    if (!A.on || !c) return c;
    try {
      const rg = (rig && R3D_CLIPS[rig]) ? rig : 'quad', T = R3D_CLIPS[rg][c.clip], b = oldN(rg, c.clip);
      if (!T) return c;
      if (!b || T.n === b){ if (c.i >= T.n) c.i = A.loop(c.clip) ? c.i % T.n : T.n - 1; return c; }   // AD 63080567: loops wrap; attack, hit and death clamp on their last frame
      const n = T.n;
      if (c.clip === 'attack') c.i = Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / 14) * n));
      else if ((c.clip === 'run' || c.clip === 'walk') && u._r3d && u._r3d.qph >= 0) c.i = Math.floor(u._r3d.qph * n / b) % n;   // S6-ANIM: by distance (NaN or undefined falls through to the clock)
      else if (c.clip === 'run') c.i = Math.floor(tick / 4 * n / b) % n;
      else if (c.clip === 'walk') c.i = Math.floor(tick / 6 * n / b) % n;
      else if (c.clip === 'idle') c.i = Math.floor(tick / 14 * n / b) % n;
    } catch (e) {}
    return c;
  };
}
/* humanoid death: the fallen unit carries its birth tick, so the longer clip plays over the same time */
{ const f = r3dDraw;
  r3dDraw = function(rec, u, x, y, s, o){
    if (A.on && o && o.clip === 'death' && u && u.born !== undefined && typeof G !== 'undefined' && G){
      try { const set = (rec && R3D_CLIPS[rec.rig]) || R3D_CLIPS.humanoid, n = (set.death || R3D_CLIPS.humanoid.death).n; o.i = Math.min(n - 1, Math.floor((G.frame - u.born) / (A.deathTicks / n))); } catch (e) {}
    }
    return f(rec, u, x, y, s, o);
  };
}
A.selfTest = function(){
  const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
  try {
    ok('LOOK.anim.on is true', A.on === true);
    ok('humanoid resampled counts match A.n', Object.entries(A.n.humanoid).every(([c, n]) => R3D_CLIPS.humanoid[c] && R3D_CLIPS.humanoid[c].n === n));
    ok('quad resampled counts match A.n', Object.entries(A.n.quad).every(([c, n]) => R3D_CLIPS.quad[c] && R3D_CLIPS.quad[c].n === n));
    ok('only walk, run and idle wrap; attack, melee, hit and death clamp (AD 63080567)', ['walk', 'run', 'idle'].every(A.loop) && !['attack', 'melee', 'shoot', 'cast', 'hit', 'death'].some(A.loop));
    for (const rig of ['humanoid', 'brute', 'mount', 'prop']){
      if (!R3D_CLIPS[rig]) continue;
      let bad = null;
      const u = {x: 100, y: 100, moving: true, flash: 3, atkT: 6};
      for (const tick of [0, 5, 17, 42, 99]){
        for (const frame of [0, 3, 4]){
          const c = r3dChoose({rig, grip: 'swing'}, u, frame, tick);
          const def = R3D_CLIPS[rig][c.clip];
          if (def && (c.i < 0 || c.i >= def.n)) bad = rig + '.' + c.clip + ' i=' + c.i + ' n=' + def.n;
        }
      }
      ok('r3dChoose stays in bounds for ' + rig, !bad, bad || '');
    }
    for (const rig of ['quad', 'wyrm', 'spider', 'ram', 'mount']){
      if (!R3D_CLIPS[rig]) continue;
      let bad = null;
      for (const atkT of [0, 6, 14]){
        const u = {x: 100, y: 100, moving: true, atkT};
        for (const tick of [0, 5, 17, 42, 99]){
          for (const frame of [0, 3]){
            const c = r3qChoose(u, frame, tick, true, rig);
            const def = R3D_CLIPS[rig][c.clip];
            if (def && (c.i < 0 || c.i >= def.n)) bad = rig + '.' + c.clip + ' i=' + c.i + ' n=' + def.n;
          }
        }
      }
      ok('r3qChoose stays in bounds for ' + rig, !bad, bad || '');
    }
  } catch (e) { ok('threw', false, e && e.message); }
  const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
  return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
};
window.ANIM_TEST = {selfTest: A.selfTest};
})();
