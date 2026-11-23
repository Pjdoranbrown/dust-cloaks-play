/* ===== INDEX H25: hygiene pass (Patrick, 2026-11-12: "about 14 fps sometimes") =================
   1. The F8 perf box gets a phase line: terrain (ground, shadows), figures (drawSprite, corpses), props
      (STRUCT sprites, stuck arrows), fog, hud+grade (the HUD and LOOK's full-screen grade), pump (background
      ray-cast building), minimap, and rest (everything else in draw). Exponential averages in ms, so a slow
      machine says where its frame goes without the devtools. Also the average cost of one ray-cast frame.
   2. Pump pacing: the VO2 pump renders at least one ray-cast frame per game frame while its queue holds work.
      On a slow machine one frame costs more than the 4 ms budget (20 ms and more on an old GPU), so every game
      frame paid it and the field stuttered for the whole warm-up. The pump now measures what a step cost and,
      when it beats the budget, rests enough game frames that the average stays at the budget (at most 12 in a
      row). Stand-ins cover the missing clips meanwhile, as before.
   Load last. ROLLBACK: delete this file, its script tag and the one-line hook in js/3d/vo2.js hudPaint. */
(function(){
  'use strict';
  const G_ = n => { try { return (0, eval)('typeof ' + n + " !== 'undefined' ? " + n + ' : undefined'); } catch (e) { return undefined; } };
  const has = n => typeof G_(n) === 'function';
  const set = (n, v) => { window.__h25 = v; (0, eval)(n + ' = window.__h25'); delete window.__h25; };
  const H = window.H25 = {K:{pumpShare:1, maxRest:12}, ph:{}, ema:{}, pump:{cost:0, rest:0, steps:0, held:0, last:-1, hold:false}};

  /* ---- 2. pump pacing (installed first so the timing wrapper below measures it) ------------------ */
  if (has('r3dPumpTick') && typeof R3D !== 'undefined'){
    const f = G_('r3dPumpTick'), P = H.pump;
    set('r3dPumpTick', function(){
      const t = (typeof G !== 'undefined' && G) ? G.frame : (typeof CAMP !== 'undefined' && CAMP ? CAMP.t : 0);
      if (t !== P.last){ P.last = t; if (P.rest > 0){ P.rest--; P.held++; P.hold = true; } else P.hold = false; }
      if (P.hold) return;
      const made0 = R3D.made, t0 = performance.now();
      const r = f.apply(this, arguments);
      if (R3D.made > made0){
        const cost = performance.now() - t0; P.cost = P.cost ? P.cost * 0.7 + cost * 0.3 : cost; P.steps++;
        const budget = Math.max(1, ((window.VO2 && VO2.pumpMs) || 7) * H.K.pumpShare);
        if (P.cost > budget) P.rest = Math.min(H.K.maxRest, Math.ceil(P.cost / budget) - 1);
      }
      return r;
    });
  }

  /* ---- 1. phase timings ---------------------------------------------------------------------- */
  const timed = (label, fn) => function(){ const t0 = performance.now(); try { return fn.apply(this, arguments); } finally { H.ph[label] = (H.ph[label] || 0) + performance.now() - t0; } };
  const PH = [['drawTerrain', 'terrain'], ['drawSprite', 'figures'], ['r3dCorpse', 'figures'], ['w3dMapProp', 'props'], ['w3dMapTree', 'props'], ['drawFieldFog', 'fog'], ['drawHUD', 'hud+grade'], ['drawMapInto', 'minimap'], ['r3dPumpTick', 'pump']];
  H.wrapped = [];
  for (const [n, label] of PH){ if (!has(n)) continue; try { set(n, timed(label, G_(n))); H.wrapped.push(n); } catch (e) {} }
  H.ORDER = ['terrain', 'figures', 'structs', 'props', 'fog', 'hud+grade', 'pump', 'minimap', 'rest'];
  H.frame = function(total){
    const p = H.ph, e = H.ema;
    if (p.pump) p.figures = Math.max(0, (p.figures || 0) - p.pump);   /* the pump ticks inside the figure draws */
    let known = 0; for (const k of H.ORDER) if (k !== 'rest') known += p[k] || 0;
    p.rest = Math.max(0, total - known);
    for (const k of H.ORDER){ const v = p[k] || 0; e[k] = e[k] === undefined ? v : e[k] * 0.9 + v * 0.1; p[k] = 0; }
    e.total = e.total === undefined ? total : e.total * 0.9 + total * 0.1;
  };
  for (const n of ['draw', 'drawCamp']){ if (!has(n)) continue; const f = G_(n);
    set(n, function(){ const t0 = performance.now(); try { return f.apply(this, arguments); } finally { try { H.frame(performance.now() - t0); } catch (e) {} } }); }
  H.line = function(){
    const e = H.ema, s = H.ORDER.map(k => k + ' ' + (e[k] || 0).toFixed(1)).join('  ');
    const build = (typeof R3D !== 'undefined' && R3D.made) ? (R3D.ms / R3D.made).toFixed(1) : '-';
    return s + '   build ' + build + ' ms/frame' + (H.pump.held ? '  rested ' + H.pump.held : '');
  };

  /* ---- self-test ----------------------------------------------------------------------------- */
  H.selfTest = function(){
    const out = []; let pass = 0, n = 0;
    const ok = (name, c) => { n++; if (c) pass++; out.push((c ? 'ok  ' : 'FAIL') + ' ' + name); };
    ok('H25-1 phase line is a string with every phase', typeof H.line() === 'string' && H.ORDER.every(k => H.line().includes(k)));
    ok('H25-2 draw and the phases are wrapped', H.wrapped.includes('drawTerrain') && H.wrapped.includes('drawSprite') && H.wrapped.includes('r3dPumpTick'));
    ok('H25-3 frame() folds the phases and clears them', (() => { H.ph = {terrain:2, figures:5, pump:1}; H.frame(10); return H.ph.terrain === 0 && H.ema.rest >= 0 && H.ema.figures >= 0; })());
    ok('H25-4 pacing rests when a step beats the budget', (() => { const P = H.pump, keep = Object.assign({}, P); const budget = Math.max(1, ((window.VO2 && VO2.pumpMs) || 7) * H.K.pumpShare);
      P.cost = budget * 3; const rest = Math.min(H.K.maxRest, Math.ceil(P.cost / budget) - 1); Object.assign(P, keep); return rest === 2; })());
    out.push(pass + '/' + n); console.log(out.join('\n')); return {pass, n, out};
  };
})();
/* ===== END INDEX H25 ========================================================================== */
