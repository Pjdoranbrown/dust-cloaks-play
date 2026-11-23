/* ===== INDEX P24: five polish items (Patrick, 2026-11-12) ======================================
   1. The leader's running dust in the hub draws under the figures (index.html drawCamp calls P24.drawRunPuffs
      before the y-sorted pass and skips `run` puffs in its top loop); the puffs are smaller, spawn at the heels
      and drift back against the run (js/art/graphics.js moveLeader hook).
   2. The banner editor's swatches: the inline `BED.x='..';renderPanel()` handlers are replaced by P24.pick,
      which re-renders the screen the editor lives on and keeps the create screen's scroll position.
   3. Cayde's own model: the Chapter Master with hero 'cayde' is built on the FOLK_HERO kit with a grey cloak
      and cowl (hood down, never the banner's colours), red hair and beard, and a spear with a blue tip.
   4. The field's fog follows the Command Radius: vision is visionK x the radius (4.2 since Q103, 22 Nov; was 2 from SW-5, Patrick 2026-11-13; P24 made it 1.5 x, original 3 x; tune visionK in play), and the dimming layer is
      on for every contract map (was only maps with unexplored ground). Brawl, drill, defend and the story keep
      full sight.
   5. Stuck arrows draw in the y-sorted pass: arrows in the ground before everything, arrows in a body right
      after that body (contractBodies adds `custom` entries; STUCK.draw becomes a no-op).
   Load after js/ui/briefing.js. ROLLBACK: delete this file, its script tag and the two one-line hooks
   (index.html drawCamp, js/art/graphics.js moveLeader hook: restore the old puff line). */
(function(){
  'use strict';
  const G_ = n => { try { return (0, eval)('typeof ' + n + " !== 'undefined' ? " + n + ' : undefined'); } catch (e) { return undefined; } };
  const has = n => G_(n) !== undefined;
  const safe = (what, fn) => { try { return fn(); } catch (e) { console.warn('P24 ' + what, e); } };
  const P = window.P24 = {
    on:true,
    K:{visionK:4.2, puffLife:24, puffAlpha:0.42, caydeHair:'#b8402a', caydeHood:'#6a6a64', caydeCloak:'#7a7a74', caydeTrim:'#a8a8a0', spearTip:'#3f8ad0', stride:26, footLife:13, footAlpha:0.2, footSize:0.95}
  };

  /* ---- 1. running dust, under the figures ---------------------------------------------------- */
  P.drawRunPuffs = function(){
    const puffs = has('CAMP') && CAMP.puffs; if (!puffs || !puffs.length) return;
    for (const p of puffs){ if (!p.run) continue;
      if (p.foot){ ctx.globalAlpha = Math.min(1, p.life / 6) * P.K.footAlpha; PROPS3D.puff(p.x, p.y, P.K.footSize + (P.K.footLife - p.life) / 22); continue; }
      ctx.globalAlpha = Math.min(1, p.life / 12) * P.K.puffAlpha;
      PROPS3D.puff(p.x, p.y, 1.3 + (P.K.puffLife - p.life) / 11);
    }
    ctx.globalAlpha = 1;
  };

  /* F-19 (Patrick 2026-11-14: the old dust read as accelerating through farting): one small, low puff per stride at the trailing foot,
     alternating left and right, barely drifting. Kill switch: P24.on_footfall = false (the old every-4-ticks puff returns). */
  P.on_footfall = true; P.dist = 0; P.side = 1;
  P.footfall = function(q, px, py){
    if (!P.on_footfall || !P.on) return false;
    if (!(q.moving && keys.shift)){ P.dist = 0; return true; }
    const dx = q.x - px, dy = q.y - py, d = Math.hypot(dx, dy); if (!d) return true;
    P.dist += d; if (P.dist < P.K.stride) return true;
    P.dist -= P.K.stride; P.side = -P.side;
    const ux = dx / d, uy = dy / d, s = seasonOf();
    CAMP.puffs.push({run:true, foot:true, x: q.x - ux * 7 - uy * 4 * P.side, y: q.y + 1 - uy * 3 + ux * 2 * P.side, vx: -ux * 0.06, vy: -0.03, life: P.K.footLife,
      c: s === 'winter' ? '#dfe6e6' : (SEASONS_CFG[s] || SEASONS_CFG.summer).dust2});
    return true;
  };

  /* ---- 2. banner swatches ------------------------------------------------------------------- */
  P.pick = function(key, val){
    if (typeof BED === 'undefined' || !BED) BED = Object.assign({}, banner());
    BED[key] = val;
    P.rerender();
  };
  P.rerender = function(){
    const sc = document.getElementById('screen-create'), st = sc ? sc.scrollTop : 0;
    const onCreate = has('FD') && FD && FD.step === 'banner' && sc && !sc.classList.contains('hidden');
    try { if (onCreate) renderFound(); else renderPanel(); }
    finally { if (onCreate && sc) sc.scrollTop = st; }
  };
  P.swatchHTML = h => h.replace(/onclick="BED\.(\w+)='([^']*)';renderPanel\(\)"/g, (m, k, v) => `type="button" data-bed="${k}" onclick="P24.pick('${k}','${v}')"`);
  if (has('bannerEditorHTML')){
    const f = bannerEditorHTML;
    bannerEditorHTML = function(){ const h = f.apply(this, arguments); return typeof h === 'string' ? P.swatchHTML(h) : h; };
  }

  /* ---- 3. Cayde's model --------------------------------------------------------------------- */
  P.caydeLook = function(m){
    return Object.assign({}, personLook(Object.assign({}, m, {spec:'FOLK_HERO'}), false), {
      hair:P.K.caydeHair, hairStyle:'short', beard:true, hood:P.K.caydeHood, cape:P.K.caydeCloak, capeTrim:P.K.caydeTrim,
      top:'#5a4a36', legs:'#3e3428', acc:'#6a6a64', head:null});
  };
  P.blueTip = function(rec){
    let n = 0;
    for (const q of rec.parts || []){
      if (q.z === 'metal' && q.t === 'ell' && q.r && q.r.length === 3 && Math.abs(q.r[2] - 3.4) < 0.01 && Math.abs(q.r[1] - 1.5) < 0.01){
        q.z = 'spearTip'; q.r = [0.8, 1.9, 4.2]; if (q.c) q.c = [q.c[0], q.c[1], q.c[2] + 0.8]; n++; }
    }
    rec.zones.spearTip = P.K.spearTip;
    return n;
  };
  if (has('R3D_KITS') && R3D_KITS.FOLK_HERO && has('r3dMasterRecipe')){
    R3D_KITS.CAYDE = (D, x) => { const k = R3D_KITS.FOLK_HERO(D, x); k.main = 'spear'; k.helm = null; return k; };   /* hood down: the red hair shows; the grey cowl stays on the shoulders */
    const f = r3dMasterRecipe;
    r3dMasterRecipe = function(){
      const m = ensureMaster();
      if (!m || m.hero !== 'cayde') return f.apply(this, arguments);
      const key = 'm:cayde24:' + m.name + (m.race || '') + (m.sex || '');
      if (R3DR[key]) return R3DR[key];
      const race = (has('HEROES') && HEROES.cayde && HEROES.cayde.race) || 'HUMAN', mc = Object.assign({}, m, {race, spec:'FOLK_HERO', injuries:[]});   /* Cayde is a man of Oirbsen whatever chair he took; a race culture would recolour his hair */
      const rec = r3dRecipeFor(mc, false, {kit:'CAYDE', look:P.caydeLook(mc), weight:'light', weapon:'spear'});
      P.blueTip(rec);
      if (rec.key) rec.key += '|c24';
      return R3DR[key] = rec;
    };
  }

  /* ---- 4. fog from the Command Radius ------------------------------------------------------- */
  if (has('visionR') && has('VISION_MAX')){
    visionR = function(){
      if (!G || !G.mod) return 360;
      return Math.min(VISION_MAX, G.mod.radius * P.K.visionK * (1 + 0.15 * rank('scout')));
    };
  }
  if (has('setupContract')){
    const f = setupContract;
    setupContract = function(c){
      const r = f.apply(this, arguments);
      try { G.rtsFog = !!(MAP && MAP.fog) && !['brawl', 'drill', 'defend'].includes(c && c.obj) && !inStoryNow(); } catch (e) {}
      return r;
    };
  }
  if (has('openManual')){
    const f = openManual;
    openManual = function(){
      const r = f.apply(this, arguments);
      safe('manual', () => { for (const p of document.querySelectorAll('#manual-inner .idx49')) p.innerHTML = p.innerHTML.replace(/Vision is \d+(\.\d+)? times the Command Radius/, 'Vision is ' + P.K.visionK + ' times the Command Radius'); });
      return r;
    };
  }

  /* ---- 5. stuck arrows in the sorted pass --------------------------------------------------- */
  P.drawStuck = function(qs){
    const S = window.STUCK; if (!S || !S.drawAll || !G) return;
    const keep = G.stuck; G.stuck = qs;
    try { S.drawAll(); } finally { G.stuck = keep; }
  };
  P.arrowBodies = function(bodies, onScreen){
    const L = G && G.stuck; if (!L || !L.length || !window.STUCK) return;
    const ground = [], byHost = new Map(), vis = has('visNow') ? visNow : () => true;
    for (const q of L){
      if (q.host){
        if (q.host.dead || !onScreen(q.host, 80) || !vis(q.host)) continue;
        let a = byHost.get(q.host); if (!a) byHost.set(q.host, a = []); a.push(q);
      } else if (onScreen(q, 40)) ground.push(q);
    }
    if (ground.length) bodies.push({y:-1e9, custom:() => P.drawStuck(ground)});
    for (const [h, qs] of byHost) bodies.push({y:h.y + 0.5, custom:() => P.drawStuck(qs)});
  };
  function installArrows(){
    const S = window.STUCK; if (!S || S.drawAll || !has('contractBodies')) return false;
    S.drawAll = S.draw; S.draw = function(){};
    const f = contractBodies;
    contractBodies = function(bodies, onScreen){ const r = f.apply(this, arguments); safe('arrows', () => P.arrowBodies(bodies, onScreen)); return r; };
    return true;
  }
  if (!installArrows()) window.addEventListener('load', () => setTimeout(installArrows, 0));

  /* ---- self-test ---------------------------------------------------------------------------- */
  P.selfTest = function(){
    const out = []; let pass = 0, n = 0;
    const ok = (name, c) => { n++; if (c) pass++; out.push((c ? 'ok  ' : 'FAIL') + ' ' + name); };
    ok('P24-1 drawRunPuffs is a function', typeof P.drawRunPuffs === 'function');
    ok('P24-2 swatches rewritten', /P24\.pick\('c1'/.test(P.swatchHTML(`<button onclick="BED.c1='#7a3e26';renderPanel()">`)) && !/renderPanel/.test(P.swatchHTML(`<button onclick="BED.div='plain';renderPanel()">`)));
    ok('P24-3 CAYDE kit on FOLK_HERO with a spear', !!(R3D_KITS.CAYDE && R3D_KITS.CAYDE({s:1, w:1}, {ranged:'bow'}).main === 'spear'));
    safe('cayde', () => {
      const m0 = ensureMaster(), keep = Object.assign({}, m0);
      Object.assign(m0, {hero:'cayde', name:'Cayde'});
      try {
        const rec = r3dMasterRecipe();
        ok('P24-4 Cayde recipe has a blue spear tip zone', rec && rec.zones && rec.zones.spearTip === P.K.spearTip && (rec.parts || []).some(q => q.z === 'spearTip'));
        const grey = c => { const [r, g, b] = hex3(c); return Math.abs(r - g) < 10 && Math.abs(g - b) < 10; }, red = c => { const [r, g, b] = hex3(c); return r > g + 30 && r > b + 30; };
        ok('P24-5 Cayde wears a grey cloak and hood, red hair (after the muted palette)', rec && grey(rec.zones.cape) && grey(rec.zones.hood) && red(rec.zones.hair));
        ok('P24-6 the cloak ignores the banner', rec && rec.zones.cape !== banner().c1 || P.K.caydeCloak === banner().c1);
      } finally { Object.assign(m0, keep); if (!('hero' in keep)) delete m0.hero; }
    });
    ok('P24-7 vision is K x the Command Radius', (() => { const g = G; G = {mod:{radius:118}, ranks:{}, picks:[], leader:{picks:[]}}; try { return Math.abs(visionR() - Math.min(VISION_MAX, 118 * P.K.visionK * (1 + 0.15 * rank('scout')))) < 0.01; } finally { G = g; } })());
    ok('SW-5 sight is at least 2 x the Command Radius, and Hold the Line / mounts (a wider radius) widen it', (() => { const g = G; G = {mod:{radius:100}, ranks:{}, picks:[], leader:{picks:[]}}; try { const a = visionR(); G.mod.radius = 140; const b = visionR(); return P.K.visionK >= 2 && Math.abs(a - Math.min(VISION_MAX, 100 * P.K.visionK)) < 0.01 && Math.abs(b - Math.min(VISION_MAX, 140 * P.K.visionK)) < 0.01 && b > a; } finally { G = g; } })());
    ok('P24-8 STUCK.draw is a no-op, drawAll kept', !!(window.STUCK && STUCK.drawAll && STUCK.draw.toString().length < 40));
    ok('P24-9 arrowBodies sorts a hosted arrow after its host and ground arrows first', (() => {
      const g = G; const host = {x:10, y:50}; G = {stuck:[{x:1, y:1, host:null}, {x:9, y:49, host, ox:0, oy:0}]};
      try { const b = []; P.arrowBodies(b, () => true); return b.length === 2 && b[0].y === -1e9 && b[1].y === 50.5; } finally { G = g; } })());
    out.push(pass + '/' + n);
    console.log(out.join('\n'));
    return {pass, n, out};
  };
})();
/* ===== END INDEX P24 ========================================================================= */
