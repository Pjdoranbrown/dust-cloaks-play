/* ===== INDEX K36: F-36d kennel dogs roam the camp and kill rats (Lead Programmer, 2026-11-13) =====
   Patrick 2026-11-14 (bible Decisions log, F-36): "with Kennels built, dogs roam and kill rats".
   - With Kennels built, in every holding, two camp hounds (the contract hound sprite) trot between the kennel, the fire
     and the buildings. A hound that sees a LIVING36 rat (sight 240 px [S]) runs it down; on the catch the rat is gone,
     the hound stands over it a moment, then trots off. Each hound rests 30 s [S] after a kill.
   - A killed rat is not replaced at once: the rat count drops by one for 45 s [S], so a camp with hounds has fewer rats.
   - Cosmetic only. Drawn after the camp in world space, like the rats.
   Load after living36.js. INT-1 group 13: no switch. */
(function(){
  'use strict';
  const LV = window.LIVING36;
  const K = window.KENNEL36 = {dogs: [], gone: [],
    N: {count: 2, sight: 240, run: 3.4, trot: 1.3, catchR: 9, standF: 90, restF: 1800, ratBackF: 2700, roamWait: [120, 420]}};   // [S] all, frames at 60 fps
  const R = Math.random, TAU = Math.PI * 2;
  const inCamp = () => { try { return typeof G !== 'undefined' && !G && typeof CAMP !== 'undefined' && CAMP && CAMP.people; } catch (e) { return false; } };
  const built = () => { if (K.force != null) return K.force; try { return has('kennels') && !!PLOTS.kennels; } catch (e) { return false; } };
  K.live = () => !!built();
  const home = () => { try { const f = plotFront('kennels'); return {x: f.x, y: f.y + 10}; } catch (e) { return {x: PLOTS.kennels[0], y: PLOTS.kennels[1] + 30}; } };
  function roamSpots(){
    const out = [home()];
    try { out.push({x: HUB.fire.x + 60, y: HUB.fire.y + 30}, {x: HUB.wagon.x, y: HUB.wagon.y + 30}); } catch (e) {}
    try { for (const o of campObjects()) if (o && o.kind === 'plot' && typeof o.x === 'number') out.push({x: o.x, y: o.y + 30}); } catch (e) {}
    return out;
  }
  function feet(){   // the same footprints the rats keep out of
    const out = [];
    try { for (const o of campObjects()) if (o && typeof o.x === 'number' && (o.kind === 'plot' || o.kind === 'building' || o.kind === 'house')) out.push([o.x - 62, o.y - 88, o.x + 62, o.y + 6]); } catch (e) {}
    try { if (HUB.house) out.push([HUB.house.x - 70, HUB.house.y - 95, HUB.house.x + 70, HUB.house.y + 8]); } catch (e) {}
    return out;
  }
  const inFoot = (F, x, y) => F.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
  const rats = () => (LV && typeof LV.list === 'function') ? LV.list() : [];

  K.seed = function(){
    const h = home(); K.dogs = [];
    for (let i = 0; i < K.N.count; i++) K.dogs.push({x: h.x + (i ? 16 : -16), y: h.y + 4, tx: h.x, ty: h.y, st: 'roam', wait: 60 + i * 140, t: i * 7, left: !!i, rest: 0, prey: null});
    K.key = holdKey();
  };
  K.kill = function(d, r){
    const L = rats(), i = L.indexOf(r); if (i < 0) return false;
    L.splice(i, 1);
    if (LV){ if (K.base == null) K.base = LV.maxRats; LV.maxRats = Math.max(0, LV.maxRats - 1); K.gone.push(K.N.ratBackF); }
    d.st = 'stand'; d.wait = K.N.standF; d.rest = K.N.restF; d.prey = null; K.kills = (K.kills || 0) + 1;
    return true;
  };
  K.restore = function(){ if (LV && K.base != null){ LV.maxRats = K.base; } K.base = null; K.gone = []; };
  // one frame (f = frames this step, 1 at 60 fps)
  K.step = function(f){
    if (!K.live()){ if (K.dogs.length) K.dogs = []; if (K.base != null) K.restore(); return; }
    if (!K.dogs.length || K.key !== holdKey()) K.seed();
    for (let i = K.gone.length - 1; i >= 0; i--) if ((K.gone[i] -= f) <= 0){ K.gone.splice(i, 1); if (LV) LV.maxRats++; }
    if (K.base != null && LV){ LV.maxRats = Math.min(K.base, Math.max(0, K.base - K.gone.length)); if (!K.gone.length) K.base = null; }   // never above the normal count
    const F = feet(), RL = rats(), N = K.N;
    for (const d of K.dogs){
      d.t += f; if (d.rest > 0) d.rest -= f;
      if (d.st === 'stand'){ if ((d.wait -= f) <= 0){ d.st = 'roam'; d.wait = 0; } continue; }
      if (d.st === 'chase' && (!d.prey || !RL.includes(d.prey))){ d.st = 'roam'; d.prey = null; }
      if (d.st === 'roam' && d.rest <= 0){   // a rat in sight that no other hound is after
        let best = null, bd = N.sight;
        for (const r of RL){ if (K.dogs.some(o => o !== d && o.prey === r)) continue; const dd = Math.hypot(r.x - d.x, r.y - d.y); if (dd < bd){ bd = dd; best = r; } }
        if (best){ d.st = 'chase'; d.prey = best; }
      }
      let tx, ty, sp;
      if (d.st === 'chase'){ tx = d.prey.x; ty = d.prey.y; sp = N.run;
        if (Math.hypot(tx - d.x, ty - d.y) < N.catchR){ K.kill(d, d.prey); continue; } }
      else {
        if (d.wait > 0){ d.wait -= f; continue; }
        if (Math.hypot(d.tx - d.x, d.ty - d.y) < 4){ const S = roamSpots(), s = S[R() * S.length | 0]; d.tx = s.x + (R() - .5) * 40; d.ty = s.y + (R() - .5) * 20; d.wait = N.roamWait[0] + R() * (N.roamWait[1] - N.roamWait[0]); continue; }
        tx = d.tx; ty = d.ty; sp = N.trot;
      }
      const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy) || 1, st = Math.min(dd, sp * f);
      let mx = dx / dd * st, my = dy / dd * st;
      if (inFoot(F, d.x + mx * 3, d.y + my * 3)){
        if (!inFoot(F, d.x + Math.sign(dx) * st * 3, d.y)){ mx = Math.sign(dx) * st; my = 0; }
        else if (!inFoot(F, d.x, d.y + st * 3)){ mx = 0; my = st; }
        else { d.st = 'roam'; d.prey = null; d.tx = d.x; d.ty = d.y; continue; }
      }
      if (Math.abs(mx) > .05) d.left = mx < 0;
      d.x += mx; d.y += my; d.moving = true;
    }
  };
  K.draw = function(){
    if (typeof houndSprite !== 'function' || typeof blit !== 'function') return;
    for (const d of K.dogs){
      if (d.x < CAMP.cam.x - 40 || d.x > CAMP.cam.x + VW + 40 || d.y < CAMP.cam.y - 40 || d.y > CAMP.cam.y + VH + 40) continue;
      const hop = d.st === 'stand' ? 0 : ((d.t / (d.st === 'chase' ? 3 : 6) | 0) % 2);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 2, 16, 4, 0, 0, TAU); ctx.fill();
      figPlaceholder(d.x, d.y - 5 - hop, 2.4, {h:9, w:5, horse:true, shadowW:3.8});   /* S6-C 3a step 5: never the pixel hound */
    }
  };

  let prev = performance.now();
  if (typeof drawCamp === 'function'){
    const f0 = drawCamp;
    drawCamp = function(){
      const r = f0.apply(this, arguments);
      try {
        if (!inCamp()){ prev = performance.now(); return r; }
        const tn = performance.now(), f = Math.min(6, Math.max(0, (tn - prev) / (1000 / 60))); prev = tn;
        K.step(f);
        if (K.dogs.length){ ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-Math.round(CAMP.cam.x), -Math.round(CAMP.cam.y)); ctx.imageSmoothingEnabled = false; K.draw(); ctx.restore(); }
      } catch (e) { try { ctx.restore(); } catch (e2) {} if (!K.warned){ K.warned = 1; console.warn('KENNEL36', e); } }
      return r;
    };
  }

  K.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const sv = {dogs: K.dogs, gone: K.gone.slice(), base: K.base, max: LV && LV.maxRats, list: LV && LV.list(), kills: K.kills};
    try {
      K.gone = []; K.base = null;   // the test's own timers, never the live ones
      ok('LIVING36 rats are there to hunt', !!(LV && typeof LV.list === 'function'));
      K.force = false; K.dogs = []; K.step(1); ok('no Kennels: no hounds', K.dogs.length === 0);
      K.force = true; K.step(1); ok('Kennels built: two hounds by the kennel', K.dogs.length === 2 && K.dogs.every(d => Math.hypot(d.x - home().x, d.y - home().y) < 40));
      const L = LV.list(); L.length = 0; const max0 = LV.maxRats; const d = K.dogs[0], d2 = K.dogs[1];
      d2.rest = 1e9; d.rest = 0; d.st = 'roam'; d.wait = 0;
      const rat = {x: d.x + 120, y: d.y, tx: d.x + 120, ty: d.y, wait: 1e9, sp: 0, ph: 0, id: 0, fx: 1}; L.push(rat);
      K.step(1); ok('a hound sees a rat and gives chase', d.st === 'chase' && d.prey === rat);
      for (let i = 0; i < 120 && L.includes(rat); i++) K.step(1);
      ok('the hound catches and kills the rat', !L.includes(rat) && d.st === 'stand' && d.rest > 0);
      ok('a killed rat is not replaced at once', LV.maxRats === max0 - 1);
      const far = {x: d.x + 2000, y: d.y, tx: 0, ty: 0, wait: 1e9, sp: 0, ph: 0, id: 0, fx: 1}; L.push(far); d.st = 'roam'; d.rest = 0; K.step(1);
      ok('a rat out of sight is left alone', d.st !== 'chase');
      d.rest = 500; const near = {x: d.x + 30, y: d.y, tx: 0, ty: 0, wait: 1e9, sp: 0, ph: 0, id: 0, fx: 1}; L.push(near); K.step(1);
      ok('a resting hound does not hunt', d.st !== 'chase');
      K.gone = [1]; K.step(1); ok('the rat count comes back after a while', LV.maxRats === max0 && K.base == null);
    } catch (e){ ok('no throw: ' + e.message, false); }
    finally {
      K.force = null; K.dogs = sv.dogs; K.gone = sv.gone; K.base = sv.base; K.kills = sv.kills;
      if (LV){ LV.maxRats = sv.max; const L = LV.list(); L.length = 0; for (const r of sv.list || []) L.push(r); }
    }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, n: out.length, details: out};
  };
})();
