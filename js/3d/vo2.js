/* Index VO2-1: the VO-2 "one world" composer (Fable, 2026-11-11; docs/vo2-design.md, audits/fable/vo2.md).
   WHAT   One picture instead of three pipelines: the painted ground (js/3d/ground.js, GROUND), the structures and
          trees rendered through the figures' ray-caster (js/3d/world.js, STRUCT) and the figures, under one key
          light by time of day, at a 2x internal render with smoothing, with the figures in the "painted" style.
          Loads last. With VO2.on false (the default until Patrick's look check) nothing in the game changes.
   HOOKS  drawTerrain (ground + cast shadows when on), contractBodies (STRUCT items y-sorted with the units),
          w3dMapTree (old trees off when STRUCT draws them), r3dDrawUnit (figure scale), r3dStyleId (painted),
          resize (render scale), settingsHTML (the switch).
   KNOBS  VO2.on (settings key 'vo2', on unless false), VO2.scale (internal render scale, 2), VO2.budget (canvas pixel cap, 6e6), VO2.kMax (adaptive cap on the
          render scale, lowered by 0.25 while frames run long; VO2.perf has the frame EMA), VO2.pumpMs (figure frames built per game frame, 4), VO2.figure (figure scale, 1.0), VO2.world (STRUCT.K size overrides, null), VO2.lazy (GROUND.LAZY),
          VO2.leafMute / VO2.leafDim (how far the season's leaf greens are pulled toward grey-green and darkened for STRUCT's trees),
          VO2.vignette (LOOK.vignette while on, 0.12), VO2.grade.<time> (lighter LOOK.grade dusk and night while on), VO2.lights.<time> (dir, elev, colour, shadow).
   ROLLBACK remove the script tag (or VO2.set(false)).
   TEST   VO2.selfTest(); VO2.mock('day') returns a PNG data URL of the current field. */
(function(){
  'use strict';
  const V = window.VO2 = {
    scale: 2, figure: 1.0, vignette: 0.12, lazy: true,
    budget: 6e6, kMax: 3, kDpr: 1.25, pumpMs: 4, pumpSteps: true, perf: {ema: 0, long: 0, drops: 0},   // VO2-PERF (2026-11-11): Patrick's field ran unplayably slow
    shadowRes: 0.5, groundMs: 8, standIns: 0,   // VO2-PERF: one multiply blit for all cast shadows; ground chunks painted ahead; a figure's missing clip stands in for a frame   // figure 1.0: Patrick's note 2026-11-11, people stood taller than trees
    campFigure: 1.3,   // VO2-CAMP: figures in the story camps, which are seen from further up than the field
    world: null,   // optional STRUCT.K overrides ({oakH, pineH, ...}); null since 9cad704 baked the sizes (oak 110, pine 135, birch 100, dead 80: two to three and a half figures)   // lazy: the ground paints a chunk the first time it is in view (about 6 ms each) instead of the whole map at build
    // one key light per time of day (dir is the direction the light travels on the ground, y down; elev 0..1)
    lights: {
      dawn:  {dir: {x: -0.85, y: 0.5},  elev: 0.3,  colour: '#ffd7a8', shadow: '#4a4468'},
      day:   {dir: {x: -0.45, y: 0.85}, elev: 0.8,  colour: '#fff1d0', shadow: '#4a5670'},
      dusk:  {dir: {x: 0.85, y: 0.5},   elev: 0.3,  colour: '#ffb070', shadow: '#3a2a52'},
      night: {dir: {x: -0.3, y: 0.95},  elev: 0.55, colour: '#9ab4e8', shadow: '#101830'}
    },
    built: null   // {map, env} of the last build, so GROUND and STRUCT are built once per map
  };
  const set = () => { try { return settings(); } catch (e) { return {}; } };
  const field = () => (typeof G !== 'undefined' && G) ? G : null;   // G and MAP are lets in index.html, never on window
  const mapNow = () => (typeof MAP !== 'undefined' && MAP && MAP.g) ? MAP : null;
  Object.defineProperty(V, 'on', {get(){ return set().vo2 !== false; }, set(v){ V.set(v); }});   // on by default since Patrick's look check passed (2026-11-11); settings.vo2 === false turns it off
  V.set = function(on){
    const s = set(); s.vo2 = !!on; try { saveMeta(); } catch (e) {}
    V.built = null; if (window.GROUND && GROUND.invalidate) GROUND.invalidate(); if (window.STRUCT && STRUCT.invalidate) STRUCT.invalidate();
    if (window.LOOK){ if (on){ if (V.vignetteWas === undefined) V.vignetteWas = LOOK.vignette; LOOK.vignette = V.vignette; } else if (V.vignetteWas !== undefined) LOOK.vignette = V.vignetteWas; }
    applyGrade(on);
    try { resize(); } catch (e) {}
    try { if (typeof R3D !== 'undefined' && R3D.cache) for (const k in R3D.cache) delete R3D.cache[k]; } catch (e) {}
  };
  /* the VO-1 dusk and night grades (LOOK.grade) were tuned over the bright tiles; on the darker painted base they went murky, so while
     VO2 is on the multiply tint is lifted and the ambient raised (Patrick's dusk frame, 2026-11-11). The originals come back when off. */
  V.grade = {dusk: {mul: '#cfa48e', add: 0.12, hazeA: 0.16, amb: 0.72}, night: {mul: '#606f9a', add: 0.09, hazeA: 0.12, amb: 0.42}};
  function applyGrade(on){
    if (!window.LOOK || !LOOK.grade) return;
    if (on){ if (!V.gradeWas){ V.gradeWas = {}; for (const t in V.grade) V.gradeWas[t] = Object.assign({}, LOOK.grade[t]); } for (const t in V.grade) Object.assign(LOOK.grade[t], V.grade[t]); }
    else if (V.gradeWas){ for (const t in V.gradeWas) Object.assign(LOOK.grade[t], V.gradeWas[t]); }
  }
  const timeNow = () => (window.LOOK && LOOK.time) ? LOOK.time() : 'day';
  V.light = function(time){ const L = V.lights[time || timeNow()] || V.lights.day; return {dir: {x: L.dir.x, y: L.dir.y}, elev: L.elev, colour: L.colour, shadow: L.shadow}; };
  V.env = function(){ return {season: typeof seasonOf === 'function' ? seasonOf() : 'spring', host: (field() && G.contract && G.contract.host) || 'bandits', time: timeNow()}; };
  /* VO2-CAMP (2026-11-11, Patrick's Varnholt frame: buildings read as dark smudges, the whole town one sepia wash): the story camps
     (the prologue town and the road nights) have a real MAP grid, so they get the painted ground, the cast shadows, the 3D buildings,
     walls, tents and trees, and bigger figures, like the field. The company's own camp (no grid, Art's holding backdrop) is untouched. */
  const campNow = () => !field() && typeof CAMP !== 'undefined' && CAMP && CAMP.on && typeof inStory === 'function' && inStory() && !!mapNow();
  const ready = () => V.on && !!mapNow() && !(typeof isBrawl === 'function' && isBrawl() && !(G && G.contract && G.contract.camp === true)) && (!!field() || campNow());   // F-35b: the camp brawl (OPENBAR35 Pick a fight) takes the field look
  V.campNow = campNow;
  V.paintedCamp = () => { try { return !!(ready() && campNow() && window.GROUND && typeof GROUND.draw === 'function'); } catch (e) { return false; } };   // SW-1: true when the story camp's ground is the painted layer (its puddles are baked there)
  /* VO2-CAMP: LOOK keeps every camp at evening; the prologue town is lived in for three days, and under the dusk multiply the whole
     town went one sepia wash (grass read 80,62,34). The siege days are day, the road nights stay as LOOK has them. */
  V.campTime = 'day';
  if (window.LOOK && typeof LOOK.time === 'function'){
    const f = LOOK.time;
    LOOK.time = function(){ if (V.on && V.campTime && !LOOK.force && campNow() && typeof CP === 'function' && CP() && CP().part === 'siege') return V.campTime; return f.apply(this, arguments); };
  }
  const hasGround = () => window.GROUND && typeof GROUND.build === 'function' && typeof GROUND.draw === 'function';
  const hasStruct = () => window.STRUCT && typeof STRUCT.build === 'function' && typeof STRUCT.items === 'function';

  /* build the streams once per map and time */
  V.build = function(){
    const env = V.env(), key = env.season + '|' + env.host + '|' + env.time;
    if (V.built && V.built.map === MAP && V.built.key === key) return;
    const L = V.light(env.time);
    if (hasGround()){ GROUND.lightDir = L.dir; GROUND.LAZY = V.lazy; if (GROUND.K && V.ground) Object.assign(GROUND.K, V.ground); GROUND.invalidate(); withPal(() => GROUND.build(MAP, env)); }
    if (hasStruct()){ STRUCT.light = L; if (STRUCT.K && V.world) Object.assign(STRUCT.K, V.world); STRUCT.invalidate(); withMutedLeaves(env.season, () => STRUCT.build(MAP, env)); }
    V.built = {map: MAP, key};
  };

  /* the season palette's leaf greens (W3D_PAL, tuned for the 16-bit tiles) are too bright for the Witcher base: pull them
     toward a grey-green and darken while the structures build; the palette is restored at once, so the old tiles never see it */
  V.leafMute = 0.45; V.leafDim = 0.82;
  /* VO2-COLOUR (2026-11-11, Patrick's Varnholt frame "one sepia wash"): the painted ground takes LOOK.pal, which VO-1 tuned toward
     the Witcher base over the bright tiles, and in the town the summer grass came out khaki (view median 113,109,62). While the
     ground builds, these greener, slightly lighter greens stand in (restored at once); null keeps LOOK's own. Winter stays. */
  V.pal = {spring: {grass: '#58743a', dirt: '#766246'}, summer: {grass: '#647a3c', dirt: '#846e4a'}, autumn: {grass: '#8a6e36', dirt: '#6e5438'}, winter: null};
  V.ground = {mottle: 0.26, shadowA: 0.5};   // GROUND.K: a little more mottle and firmer baked shadow, for contrast
  function withPal(fn){
    const LP = window.LOOK && LOOK.pal; if (!LP || !V.pal) return fn();
    const was = {};
    try { for (const se in V.pal) if (V.pal[se] && LP[se]){ was[se] = Object.assign({}, LP[se]); Object.assign(LP[se], V.pal[se]); } return fn(); }
    finally { for (const se in was) Object.assign(LP[se], was[se]); }
  }
  const hex2 = h => { const n = parseInt(String(h || '#3e6a2e').slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const muteHex = h => { const c = hex2(h), g = [86, 98, 74], k = V.leafMute, d = V.leafDim; return '#' + c.map((v, i) => Math.round((v + (g[i] - v) * k) * d).toString(16).padStart(2, '0')).join(''); };
  function withMutedLeaves(season, fn){
    const P = typeof W3D_PAL !== 'undefined' && W3D_PAL[season];
    if (!P || !(V.leafMute > 0)) return fn();
    const was = {leaf: P.leaf, leafD: P.leafD, leafL: P.leafL};
    try { for (const k in was) if (was[k]) P[k] = muteHex(was[k]); return fn(); }
    finally { for (const k in was) P[k] = was[k]; }
  }
  /* ground: the painted layer and the cast shadows instead of the tiles */
  if (typeof drawTerrain === 'function'){
    const f = drawTerrain;
    drawTerrain = function(cx, cy){
      V.flatIn = false;
      if (!ready() || !hasGround()) return f(cx, cy);
      try {
        ctx.imageSmoothingEnabled = true;
        V.build();
        if (V.groundMs > 0 && typeof GROUND.ahead === 'function') GROUND.ahead(cx, cy, V.groundMs, 1);
        V.flatIn = false;
        if (V.groundCache && typeof GROUND.base === 'function' && typeof GROUND.anim === 'function' && groundCached(cx, cy)) return;
        GROUND.draw(ctx, cx, cy);
        if (hasStruct() && STRUCT.drawShadows && !(V.low && V.lowShadows)){ drawShadowLayer(cx, cy); }
      } catch (e) { console.warn('VO2 ground fell back:', e); f(cx, cy); }
    };
  }
  /* VO2-PERF cast shadows: STRUCT.drawShadows drew each of the 100 to 200 visible shadow sprites with its own multiply blend, and on
     the big canvas every one of those was a GPU pipeline flush (5 ms a frame on average, spikes of 120 to 200 ms). The sprites now
     go source-over into one layer (at shadowRes of the view) and the layer is multiplied over the ground once. Where two shadows
     overlap they no longer darken twice, which reads better under trees. */
  let shLayer = null, shKey = null;
  /* F-42 PERF: the shadows never move, but the layer was cleared and its 200 to 540 sprites redrawn every frame. With VO2.shadowCache
     the layer covers the view plus shadowPad world px on each side and is redrawn only when the view leaves it (or the structures, the
     view or the resolution change); each frame is then one multiply blit of the part in view. ROLLBACK: VO2.shadowCache = false. */
  V.shadowCache = true; V.shadowPad = 320; V.shadowBuilds = 0;
  function drawShadowLayer(cx, cy){
    const L = STRUCT.list; if (!L || !L.length) return;
    if (V.shadowCache) return drawShadowCached(L, cx, cy);
    shKey = null;
    const r = V.shadowRes || 1, w = Math.ceil(VW * r), h = Math.ceil(VH * r);
    if (!shLayer || shLayer.width !== w || shLayer.height !== h){ shLayer = document.createElement('canvas'); shLayer.width = w; shLayer.height = h; }
    const g = shLayer.getContext('2d'); g.setTransform(r, 0, 0, r, -cx * r, -cy * r); g.clearRect(cx, cy, VW, VH);
    const x1 = cx + VW, y1 = cy + VH; let n = 0;
    for (let i = 0; i < L.length; i++){ const it = L[i], sh = it.shadow; if (!sh || it.sx1 < cx || it.sx0 > x1 || it.sy1 < cy || it.sy0 > y1) continue; g.drawImage(sh.img, it.x - sh.ax, it.y - sh.ay); n++; }
    V.shadowsDrawn = n; if (!n) return;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = STRUCT.K.shadowA; ctx.imageSmoothingEnabled = true; ctx.drawImage(shLayer, cx, cy, VW, VH); ctx.restore();
  }
  function shadowRegion(L, x0, y0, x1, y1){   // the shadows of L inside the world box, source-over into shLayer at shadowRes
    const r = V.shadowRes || 1, w = Math.ceil((x1 - x0) * r), h = Math.ceil((y1 - y0) * r);
    if (!shLayer || shLayer.width !== w || shLayer.height !== h){ shLayer = document.createElement('canvas'); shLayer.width = w; shLayer.height = h; }
    const g = shLayer.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(r, 0, 0, r, -x0 * r, -y0 * r);
    let n = 0;
    for (let i = 0; i < L.length; i++){ const it = L[i], sh = it.shadow; if (!sh || it.sx1 < x0 || it.sx0 > x1 || it.sy1 < y0 || it.sy0 > y1) continue; g.drawImage(sh.img, it.x - sh.ax, it.y - sh.ay); n++; }
    shKey = {list: L, n: L.length, r, vw: VW, vh: VH, x0, y0, x1, y1, drawn: n}; V.shadowBuilds++;
    return n;
  }
  function drawShadowCached(L, cx, cy){
    const r = V.shadowRes || 1, K = shKey;
    if (!K || K.list !== L || K.n !== L.length || K.r !== r || K.vw !== VW || K.vh !== VH || cx < K.x0 || cy < K.y0 || cx + VW > K.x1 || cy + VH > K.y1){
      const pad = Math.max(0, V.shadowPad | 0); shadowRegion(L, cx - pad, cy - pad, cx + VW + pad, cy + VH + pad);
    }
    V.shadowsDrawn = shKey.drawn; if (!shKey.drawn) return;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = STRUCT.K.shadowA; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(shLayer, (cx - shKey.x0) * r, (cy - shKey.y0) * r, VW * r, VH * r, cx, cy, VW, VH); ctx.restore();
  }
  /* F-43 terrain cache (QA audits/f43-playability.md s2 item 2, terrain 4.4 ms; item 1, flat structures): the ground chunks, the
     cast shadows and the flat structures (VO2.flatKinds: rubble, which nobody walks behind) never move, but every frame blitted 4 to 9
     chunks scaled, multiplied the shadow layer over them and drew each rubble sprite in the y-sort. With VO2.groundCache they are
     drawn once into a layer at device resolution covering the view plus groundPad world px, and each frame is one unscaled blit of
     the part on the canvas plus GROUND.anim (the water shimmer and the puddle rings, which move). The layer is redrawn when the view
     leaves it, or when the ground (GROUND.ver: a rebuild; a decal repaints only its own box, GROUND.dirty), the structures, the render scale, the view or the shadow switch
     change. The shimmer now lies over the shadows rather than under them. ROLLBACK: VO2.groundCache = false (flatMerge = false keeps
     the cache but returns rubble to the y-sort). When the view leaves the layer it is scrolled (the kept part shifted in place, only
     the uncovered strips repainted) rather than redrawn whole, so walking costs no hitch; groundScroll = false redraws it whole. */
  V.groundCache = true; V.groundPad = 320; V.groundBuilds = 0; V.groundScroll = true; V.groundScrolls = 0; V.groundPatches = 0; V.flatMerge = true; V.flatKinds = {rubble: 1}; V.flatIn = false;
  let gc = null, gcKey = null;
  function gcPaint(g, k, L, px0, py0, px1, py1){   // repaint the device-px rect of the layer: ground, shadows multiplied, flat structures
    const r = k.r, x0 = k.x0 + px0 / r, y0 = k.y0 + py0 / r, x1 = k.x0 + px1 / r, y1 = k.y0 + py1 / r;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(px0, py0, px1 - px0, py1 - py0); g.clip();
    g.setTransform(r, 0, 0, r, -k.x0 * r, -k.y0 * r);
    GROUND.base(g, x0, y0, x1 - x0, y1 - y0);
    if (k.sh && shadowRegion(L, x0, y0, x1, y1)){ g.globalCompositeOperation = 'multiply'; g.globalAlpha = k.shA; g.imageSmoothingEnabled = true; g.drawImage(shLayer, x0, y0, x1 - x0, y1 - y0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    if (k.flat){ const fk = V.flatKinds; g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
      for (let i = 0; i < L.length; i++){ const it = L[i]; if (!fk[it.kind] || it.x1 < x0 || it.x0 > x1 || it.y1 < y0 || it.y0 > y1) continue;
        const s = it.s || 1, ws = Math.max(1, Math.round(it.img.width * s * r)), hs = Math.max(1, Math.round(it.img.height * s * r));
        g.drawImage(bakedOf(it.img, ws, hs), Math.round((it.x - (it.ax || 0) * s - k.x0) * r), Math.round((it.y - (it.ay || 0) * s - k.y0) * r)); k.nf++; } }
    g.restore();
  }
  function groundCached(cx, cy){
    const m = nGet.call(ctx);
    if (m.b || m.c || !(m.a > 0) || Math.abs(m.a - m.d) > 1e-6) return false;
    const r = m.a, L = hasStruct() ? STRUCT.list : null, nL = L ? L.length : 0, shOn = !!(nL && STRUCT.drawShadows && !(V.low && V.lowShadows)),
      flat = !!(V.flatMerge && nL), shA = shOn ? STRUCT.K.shadowA : 0, K = gcKey, pad = Math.max(0, V.groundPad | 0);
    const same = K && K.ver === GROUND.ver && K.list === L && K.n === nL && K.r === r && K.vw === VW && K.vh === VH && K.sh === shOn && K.shA === shA && K.flat === flat && K.fk === V.flatKinds && K.sr === V.shadowRes && K.pad === pad;
    if (!same || cx < K.x0 || cy < K.y0 || cx + VW > K.x1 || cy + VH > K.y1){
      const t0 = performance.now(), w = Math.ceil((VW + 2 * pad) * r), h = Math.ceil((VH + 2 * pad) * r);
      let Dx = 0, Dy = 0, full = !same || !gc || gc.width !== w || gc.height !== h;
      if (!full){ Dx = Math.round((cx - pad - K.x0) * r); Dy = Math.round((cy - pad - K.y0) * r); if (!V.groundScroll || Math.abs(Dx) >= w * 0.6 || Math.abs(Dy) >= h * 0.6) full = true; }
      if (!gc || gc.width !== w || gc.height !== h){ gc = null; gc = document.createElement('canvas'); gc.width = w; gc.height = h; }
      const g = gc.getContext('2d');
      const k = {ver: GROUND.ver, list: L, n: nL, r, vw: VW, vh: VH, sh: shOn, shA, flat, fk: V.flatKinds, sr: V.shadowRes, pad, x0: full ? cx - pad : K.x0 + Dx / r, y0: full ? cy - pad : K.y0 + Dy / r, nf: 0};
      k.x1 = k.x0 + w / r; k.y1 = k.y0 + h / r;
      if (full) gcPaint(g, k, L, 0, 0, w, h);
      else {   // scroll: shift what is kept, then paint the strips the move uncovered
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.imageSmoothingEnabled = false; g.drawImage(gc, -Dx, -Dy); g.restore();
        if (Dx > 0) gcPaint(g, k, L, w - Dx, 0, w, h); else if (Dx < 0) gcPaint(g, k, L, 0, 0, -Dx, h);
        const xa = Dx < 0 ? -Dx : 0, xb = Dx > 0 ? w - Dx : w;
        if (Dy > 0) gcPaint(g, k, L, xa, h - Dy, xb, h); else if (Dy < 0) gcPaint(g, k, L, xa, 0, xb, -Dy);
        V.groundScrolls++;
      }
      k.ms = performance.now() - t0; k.full = full; k.why = !K ? 'first' : !same ? 'key' : 'edge'; gcKey = k; V.groundBuilds++; GROUND.dirty.length = 0;
    }
    if (GROUND.dirty && GROUND.dirty.length){   // decals since the last look: repaint their boxes only
      const k = gcKey, D = GROUND.dirty, g = gc.getContext('2d'), r = k.r;
      for (let i = 0; i + 3 < D.length; i += 4){ const px0 = Math.max(0, Math.floor((D[i] - k.x0) * r)), py0 = Math.max(0, Math.floor((D[i + 1] - k.y0) * r)),
          px1 = Math.min(gc.width, Math.ceil((D[i + 2] - k.x0) * r)), py1 = Math.min(gc.height, Math.ceil((D[i + 3] - k.y0) * r));
        if (px1 > px0 && py1 > py0){ gcPaint(g, k, L, px0, py0, px1, py1); V.groundPatches++; } }
      D.length = 0;
    }
    const k = gcKey, dx = Math.round(m.a * k.x0 + m.e), dy = Math.round(m.d * k.y0 + m.f), cw = ctx.canvas.width, chh = ctx.canvas.height;
    const sx = Math.max(0, -dx), sy = Math.max(0, -dy), sw = Math.min(gc.width - sx, cw - dx - sx), sh = Math.min(gc.height - sy, chh - dy - sy);
    const sm = ctx.imageSmoothingEnabled; nSet.call(ctx, 1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    if (sw > 0 && sh > 0) ctx.drawImage(gc, sx, sy, sw, sh, dx + sx, dy + sy, sw, sh);
    nSet.call(ctx, m); ctx.imageSmoothingEnabled = sm;
    V.shadowsDrawn = shOn ? (shKey ? shKey.drawn : 0) : 0; V.flatIn = flat;
    GROUND.anim(ctx, cx, cy, VW, VH);
    return true;
  }
  V.groundKey = () => gcKey;
  /* F-42 PERF fog (index.html Index 71 drawFieldFog): the quarter-size dim layer was cleared, filled and cut by every vision circle each
     frame, and the black (never seen) layer was blitted over the view even with every cell in view explored. The dim layer is now
     redrawn every fogEvery frames (world-pinned, with a margin so a moving camera never shows its edge) and the black blit is skipped
     when no unexplored cell is in view. ROLLBACK: VO2.fogEvery = 0 (Index 71's own draw). */
  V.fogEvery = 2; V.fogDims = 0;
  /* F-43 (QA audits/f43-playability.md s2 item 4, fog 2.2 ms): the dim layer is already quarter size; the cost is two full-view scaled
     blits a frame (dim, then black over the unexplored cells), each about 11 ms in a software canvas. The black is now drawn into the dim
     layer when it is rebuilt (source-over then source-over is the same picture), so the frame pays one blit. The black lags by at most
     fogEvery draws, as the dim layer already does. ROLLBACK: VO2.fogFold = false (two blits). */
  V.fogFold = true;
  if (typeof drawFieldFog === 'function' && typeof FOGK !== 'undefined' && typeof fogBlack === 'function'){
    const f = drawFieldFog, FC = {c: null, map: null, n: 0, built: -1e9, ox: 0, oy: 0};   // n counts draws, not game frames: at a low frame rate several updates run per draw
    const unseenIn = (x0, y0, x1, y1) => { const S = MAP.seen; if (!S) return true; for (let y = y0; y < y1; y++){ const r = y * MAP.w; for (let x = x0; x < x1; x++) if (!S[r + x]) return true; } return false; };
    drawFieldFog = function(cx, cy){
      if (!(V.fogEvery > 1) || !field() || typeof rtsFogOn !== 'function' || !rtsFogOn() || !MAP || !MAP.fog) return f(cx, cy);
      const Q = 4, P = 10, w = Math.ceil(VW / Q) + 2 * P, h = Math.ceil(VH / Q) + 2 * P, fr = ++FC.n;
      /* SW-10 (Patrick: contracts rarely above 12 fps): drawing a canvas that was just changed makes the browser flush it, about
         2.5 ms of CPU each time, so the timed rebuild cost ~3.3 ms a frame even when nothing moved (a hold: the Leader stands).
         The timed rebuild now runs only when its inputs changed (vision sources, explored cells): the same picture, drawn once.
         ROLLBACK: VO2.fogSig = false. */
      const due = fr - FC.built >= (V.fogEveryNow ? V.fogEveryNow() : V.fogEvery);
      let sig = null;
      if (due && V.fogSig !== false){ let k = 0; const S = MAP.seen; if (S) for (let i = 0; i < S.length; i++) if (S[i]) k++;
        sig = k + '|' + visSources().map(s => s.x + ',' + s.y + ',' + s.r).join(';'); }
      if (!FC.c || FC.c.width !== w || FC.c.height !== h || FC.map !== MAP || (due && (sig === null || sig !== FC.sig)) || FC.fold !== !!V.fogFold || Math.abs(cx - FC.cx) > P * Q - 4 || Math.abs(cy - FC.cy) > P * Q - 4){
        if (!FC.c || FC.c.width !== w || FC.c.height !== h){ FC.c = newCanvas(w, h); }
        const ox = cx - P * Q, oy = cy - P * Q, g = FC.c.getContext('2d');
        g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
        g.fillStyle = 'rgba(8,6,4,.62)'; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'destination-out';
        for (const s of visSources()){
          const x = (s.x - ox) / Q, y = (s.y - oy) / Q, r = s.r / Q; if (x < -r || y < -r || x > w + r || y > h + r) continue;
          const gr = g.createRadialGradient(x, y, r * (window.FOG_CORE ?? 0.6), x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        }
        g.globalCompositeOperation = 'source-over';
        if (V.fogFold){ const bx0 = Math.max(0, Math.floor(ox / CELL) - 1), by0 = Math.max(0, Math.floor(oy / CELL) - 1),
            bx1 = Math.min(MAP.w, Math.ceil((ox + w * Q) / CELL) + 1), by1 = Math.min(MAP.h, Math.ceil((oy + h * Q) / CELL) + 1);
          if (bx1 > bx0 && by1 > by0 && unseenIn(bx0, by0, bx1, by1)){ g.imageSmoothingEnabled = true;
            g.drawImage(fogBlack(), bx0, by0, bx1 - bx0, by1 - by0, (bx0 * CELL - ox) / Q, (by0 * CELL - oy) / Q, (bx1 - bx0) * CELL / Q, (by1 - by0) * CELL / Q); } }
        Object.assign(FC, {map: MAP, built: fr, ox, oy, cx, cy, fold: !!V.fogFold, sig}); V.fogDims++;
      } else if (due) FC.built = fr;   // unchanged: check again in fogEvery draws
      ctx.save(); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(FC.c, (cx - FC.ox) / Q, (cy - FC.oy) / Q, VW / Q, VH / Q, cx, cy, VW, VH);
      const x0 = Math.max(0, Math.floor(cx / CELL) - 1), y0 = Math.max(0, Math.floor(cy / CELL) - 1),
        x1 = Math.min(MAP.w, Math.ceil((cx + VW) / CELL) + 1), y1 = Math.min(MAP.h, Math.ceil((cy + VH) / CELL) + 1);
      if (!FC.fold && x1 > x0 && y1 > y0 && unseenIn(x0, y0, x1, y1)){ const B = fogBlack(); ctx.drawImage(B, x0, y0, x1 - x0, y1 - y0, x0 * CELL, y0 * CELL, (x1 - x0) * CELL, (y1 - y0) * CELL); }
      ctx.restore();
    };
  }
  /* F-43 (QA audits/f43-playability.md 1b: about 190 structure blits a frame): 55 to 75% of the structures in view stand wholly in
     unexplored ground, under the solid black fog, so drawing them is wasted. A structure is skipped while every map cell under its
     box, plus a 2-cell ring (the black is blurred 0.8 cell, GFX-04), is unseen; once any of them is seen it is drawn for good (seen
     cells never go dark again). The game's own tile trees already skip unseen cells (wSeen). ROLLBACK: VO2.fogCull = false. */
  V.fogCull = true; V.fogCulled = 0;
  function fogged(it){
    if (typeof G === 'undefined' || !G || !G.rtsFog || !MAP || !MAP.seen || it.x0 === undefined) return false;
    const sn = MAP.seen; if (it._rev42 === sn) return false;
    const R = 2, gx0 = Math.max(0, Math.floor(it.x0 / CELL) - R), gx1 = Math.min(MAP.w - 1, Math.floor(it.x1 / CELL) + R),
      gy0 = Math.max(0, Math.floor(it.y0 / CELL) - R), gy1 = Math.min(MAP.h - 1, Math.floor(it.y1 / CELL) + R);
    for (let y = gy0; y <= gy1; y++){ const r = y * MAP.w; for (let x = gx0; x <= gx1; x++) if (sn[r + x]){ it._rev42 = sn; return false; } }
    return true;
  }
  V.fogged = fogged;
  /* standing things: STRUCT's sprites join the y-sorted bodies; the old tile trees step aside */
  if (typeof contractBodies === 'function'){
    const f = contractBodies;
    contractBodies = function(bodies, onScreen){
      f(bodies, onScreen);
      if (!ready() || !hasStruct()) return;
      try {
        V.build();
        const L = G.leader, cx = Math.round(L.x - VW / 2), cy = Math.round(L.y - VH / 2 - (typeof camDY === 'function' ? camDY() : 0));
        let culled = 0;
        const fk = V.flatIn ? V.flatKinds : null;
        for (const it of STRUCT.items(cx, cy)){ if (fk && fk[it.kind]) continue; if (V.fogCull && fogged(it)){ culled++; continue; } bodies.push({y: it.y, it, custom: () => drawItem(it, L)}); }   /* A1: it rides along so the silhouette pass knows what covers whom */
        V.fogCulled = culled;
      } catch (e) { console.warn('VO2 structures:', e); }
    };
  }
  /* SW-6 (Patrick 2026-11-12, ahead of F-28 2026-11-13): canopies and roofs leaning over the ring hid the Leader and mates, because
     the old rule faded a sprite only when the Leader stood in a narrow box straight behind its base. Now the test is what is DRAWN
     over the squad: a tall sprite fades when its image (trimmed at the sides) covers the figure of the Leader or of any mate inside
     the Command Radius standing behind its base (so drawn under it). The fade eases in and out. INT-1 group 12: no switch. */
  /* A1 item 3: the figure box from the real drawn figures (LE probe, 22 Nov, 3D figures at 1920): on foot the top is 24 to 30 world px
     above the anchor and the shadow ends 21 to 23 below; mounted, 36 above and 29 below. figH = the tallest (36) + 4 up; figDown =
     29 + 4 down (was 46 up, 0 down). figW 12 stays: the body's half-width (weapon tips reach 19, a horse 36). */
  const SW6 = window.SW6 = {a: 0.35, aLow: 0.5, ease: 0.25, figH: 40, figDown: 33, figW: 12, trim: 0.15,
    /* A1 item 2 (audits/art/a1a2-squad-read.md): low things whose image still covers a figure behind the base fade too, to aLow */
    LOW: {dead: 1, log: 1, stump: 1, deadfall: 1, branch: 1, branches: 1, banner: 1}};
  SW6.low = it => !!(it && !it.tall && SW6.LOW[it.kind]);
  SW6.figs = function(L){
    const out = [L];
    try { if (typeof G !== 'undefined' && G && L === G.leader && G.squad){ const R = (G.mod && G.mod.radius) || 118;
      for (const m of G.squad) if (m && m.state !== 'dead' && Math.hypot(m.x - L.x, m.y - L.y) <= R) out.push(m); } } catch (e) {}
    return out; };
  SW6.covers = function(it, w, h, figs){   // true when the sprite is drawn over one of the figures
    if (!it.tall && !SW6.low(it)) return false;
    const s = it.s || 1, x0 = it.x - (it.ax || 0) * s + w * SW6.trim, x1 = it.x - (it.ax || 0) * s + w * (1 - SW6.trim), y0 = it.y - (it.ay || 0) * s, y1 = y0 + h;
    for (const f of figs){ if (!f || !(f.y < it.y)) continue;   // a figure in front of the base is drawn over the sprite: no need
      if (f.x + SW6.figW > x0 && f.x - SW6.figW < x1 && f.y + SW6.figDown > y0 && f.y - SW6.figH < y1) return true; }
    return false; };
  /* QA (Fable, 2026-11-15) PERF: figs() was built for every structure every frame (the argument is evaluated before covers() tests
     it.tall). Only tall items need it, and the squad only moves in update(), so the list is cached per G.frame for the field Leader. */
  let figsKey = -1, figsL = null, figsC = null;
  SW6.figsCached = function(L){
    const fr = (typeof G !== 'undefined' && G && L === G.leader) ? G.frame : -1;
    if (fr < 0) return SW6.figs(L);
    if (fr !== figsKey || L !== figsL){ figsKey = fr; figsL = L; figsC = SW6.figs(L); }
    return figsC; };
  SW6.alpha = function(it, w, h, L){
    const t = (it.tall || SW6.low(it)) && SW6.covers(it, w, h, SW6.figsCached(L)) ? (it.tall ? SW6.a : SW6.aLow) : 1, c = it._sw6 == null ? 1 : it._sw6;
    let a = c + (t - c) * SW6.ease; if (Math.abs(a - t) < 0.02) a = t; it._sw6 = a; return a; };
  /* F-42 PERF (Patrick 2026-11-14: escort 10 fps, contract 3 fps on Firefox / Radeon R9 200; QA audits/perf-flags.md): the 100 to 450
     STRUCT sprites a frame were each a 510x540 canvas drawn at s 0.5 with smoothing on, at fractional coordinates: a 2x downscale
     resampled every frame, the largest part of "rest". Each source is now baked once at the size it lands on the canvas (s times the
     render scale, high-quality resample) and blitted 1:1 at whole device pixels with smoothing off. Its time shows as 'structs' in
     the F8 phase line. ROLLBACK: VO2.bake = false. */
  V.bake = true; V.baked = 0;
  const bakeC = new WeakMap(), P2 = CanvasRenderingContext2D.prototype, nGet = P2.getTransform, nSet = P2.setTransform;
  function bakedOf(img, ws, hs){
    let m = bakeC.get(img); if (!m){ m = new Map(); bakeC.set(img, m); }
    const key = ws * 8192 + hs; let c = m.get(key);
    if (!c){ if (m.size > 3) m.clear(); c = document.createElement('canvas'); c.width = ws; c.height = hs;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, ws, hs); m.set(key, c); V.baked++; }
    return c;
  }
  V.bakedOf = bakedOf;
  function drawItem(it, L){
    const t0 = performance.now();
    try { drawItem1(it, L); } finally { if (window.H25 && H25.ph) H25.ph.structs = (H25.ph.structs || 0) + performance.now() - t0; }
  }
  V.drawItem = drawItem;
  function drawItem1(it, L){
    const s = it.s || 1, w = it.img.width * s, h = it.img.height * s;
    // SW-6: a tall thing drawn over the squad inside the Command Radius goes see-through
    { const al = SW6.alpha(it, w, h, L); if (al < 1) ctx.globalAlpha = al; }
    const x0 = it.x - (it.ax || 0) * s, y0 = it.y - (it.ay || 0) * s;
    const m = V.bake ? nGet.call(ctx) : null;
    if (m && !m.b && !m.c && m.a > 0 && m.d > 0){
      const ws = Math.max(1, Math.round(w * m.a)), hs = Math.max(1, Math.round(h * m.d)), sm = ctx.imageSmoothingEnabled;
      const c = bakedOf(it.img, ws, hs);
      nSet.call(ctx, 1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(c, Math.round(m.a * x0 + m.e), Math.round(m.d * y0 + m.f));
      nSet.call(ctx, m); ctx.imageSmoothingEnabled = sm;
    } else ctx.drawImage(it.img, x0, y0, w, h);
    ctx.globalAlpha = 1;
  }
  if (typeof w3dMapTree === 'function'){
    const f = w3dMapTree;
    w3dMapTree = function(t, near){ if (ready() && hasStruct() && STRUCT.trees !== false) return true; return f(t, near); };
  }
  /* VO2-CAMP: the story camp's draw list asks for the standing things (index.html, the story drawCamp: `VO2.campItems`), y-sorted
     with the people; its own trees step aside the same way the field's do */
  V.campItems = function(cx, cy){
    if (!ready() || !campNow() || !hasStruct()) return [];
    try { V.build(); const out = STRUCT.items(cx, cy), fk = V.flatIn ? V.flatKinds : null; return fk ? out.filter(it => !fk[it.kind]) : out; } catch (e) { console.warn('VO2 camp structures:', e); return []; }
  };
  V.drawCampItem = function(it){ const L = typeof CAMP !== 'undefined' && CAMP && CAMP.people && CAMP.people.find(q => q.kind === 'leader'); drawItem(it, L || {x: -1e9, y: -1e9}); };
  if (typeof w3dTree === 'function'){
    const f = w3dTree;
    w3dTree = function(t, tick){ if (ready() && campNow() && hasStruct() && STRUCT.trees !== false) return true; return f(t, tick); };
  }
  /* figures: the painted style, a little bigger, under the same light */
  if (typeof r3dStyleId === 'function'){
    const f = r3dStyleId;
    r3dStyleId = function(){ return V.on && typeof R3D_STYLES !== 'undefined' && R3D_STYLES.painted ? 'painted' : f(); };
  }
  /* VO2: the Settings "Squad Leader look" cards (Retro, Crisp) do nothing while the painted look is forced, so the row is hidden
     (Patrick 2026-11-11: "don't do anything anymore but are still in the menu"); it comes back when VO2 is off */
  V.hideLook = function(s){
      return V.on ? s.replace(/<div style="width:100%;text-align:center;font:bold 14px Georgia[^"]*"[^>]*>Squad Leader look<\/div>\s*<div[^>]*>(?:<button[\s\S]*?<\/button>)*<\/div>/, '') : s;
  };
  if (typeof r3dDrawUnit === 'function'){
    const f = r3dDrawUnit;
    r3dDrawUnit = function(rec, u, x, y, s, frame, flash, tick){ return f(rec, u, x, y, V.on && !campNow() ? s * V.figure : s, frame, flash, tick); };
  }
  /* VO2-CAMP: the story camp's people are scaled at drawSprite, so the pixel-art fallback (before the 3D clip is pumped, or a sprite without one)
     grows with the 3D figure; r3dDrawUnit then sees the scaled size and must not multiply again */
  if (typeof drawSprite === 'function'){
    const f = drawSprite;
    drawSprite = function(spr, x, y, s, frame, left, flash){ return f(spr, x, y, V.on && spr && (spr.p3d || spr.lead3d) && campNow() ? s * V.campFigure : s, frame, left, flash); };
  }
  /* render scale: twice the device pixels, smoothed, so the painted ground and the figures keep their detail */
  if (typeof resize === 'function'){
    const f = resize;
    resize = function(){
      f();
      if (!V.on || typeof TXT === 'undefined') return;
      try {
        /* VO2-PERF: the 2x render is capped by a pixel budget (a 2560x1440 screen at DPR 1.25 had a 14.7 M pixel canvas, every grade and bloom
           pass over all of it) and by kMax, which the frame watch below lowers while frames run long. Never below the device's own 1. */
        /* VO2-PERF (Patrick's Firefox readout 2026-11-11: view 1253x613 at dpr 1.5 got k 2.79, a 3502x1713 canvas, 75 ms of JS a frame):
           the scale is also capped at kDpr times the device pixel ratio (never under 1.5), so a small view never gets a huge canvas */
        const want = TXT.k * V.scale, cap = Math.sqrt(V.budget / Math.max(1, VW * VH)), dcap = Math.max(1.5, (window.devicePixelRatio || 1) * V.kDpr);
        TXT.k = Math.max(kFloorNow(), Math.min(3, want, cap, dcap, V.kMax));
        canvas.width = Math.round(VW * TXT.k); canvas.height = Math.round(VH * TXT.k);
        canvas.style.imageRendering = 'auto';
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
        if (field()) G.bgPat = null;
      } catch (e) { console.warn('VO2 scale:', e); }
    };
  }
  /* VO2-PERF frame watch: the wall time between draws of a live field, as an EMA; after about two seconds over 34 ms the render
     scale steps down a quarter (to 1 at the least) and the canvas is resized. Stalls over 250 ms (a tab switch, a build burst) are
     ignored, so the hidden-pane 1 fps loop and a one-off hitch never drop the scale. Nothing raises it again until a reload. */
  V.watchMax = 1200; V.watchSlowMs = 2500;
  /* F-42 PERF (QA, Patrick's 3 fps box: k 1.00, kMax 1, one drop, then nowhere left to go): in a live field the render scale may now
     fall below the device's 1 in steps (V.kSteps), to V.kFloor; the canvas keeps its CSS size, so the browser stretches it. The HUD,
     fog, grade and terrain are full-view costs, so 0.7 roughly halves them; text in the field goes softer. The camp and menus stay at
     1 or more (the camp resizes back up when it draws). ROLLBACK: VO2.kFloor = 1. */
  V.kFloor = 0.6; V.kSteps = [0.85, 0.7, 0.6];
  /* F-43 LOW SPEC (Director 2026-11-14): when a field is still slow with the scale at its floor, the watch turns on V.low for the rest
     of the session: cast shadows off (V.lowShadows), the fog dim layer every V.lowFogEvery draws, figure frames built at most
     V.lowPumpMs a frame. Each part has its own switch; VO2.low = true forces it, VO2.lowAuto = false stops the watch turning it on. */
  V.lowAuto = true; V.low = false; V.lowShadows = true; V.lowFogEvery = 4; V.lowPumpMs = 2;
  V.fogEveryNow = () => (V.low && V.lowFogEvery > V.fogEvery) ? V.lowFogEvery : V.fogEvery;
  function kFloorNow(){ return (field() && !G.over && V.kFloor > 0 && V.kFloor < 1) ? V.kFloor : 1; }
  V.kFloorNow = kFloorNow;
  function nextK(k){ if (k > 1 + 1e-6) return Math.max(1, Math.round((k - 0.25) * 4) / 4); const f = kFloorNow(); const s = V.kSteps.find(x => x < k - 1e-6 && x >= f - 1e-6); return s === undefined ? f : s; }
  function frameWatch(fn, live){
    let last = 0;
    return function(){
      try { if (typeof TXT !== 'undefined' && V.on){ if (kFloorNow() < 1 ? (V.kMax < 1 && TXT.k > V.kMax + 1e-6) : TXT.k < 1 - 1e-6) resize(); } } catch (e) {}   // a field picks up a sub-1 scale; the camp goes back to 1
      const r = fn.apply(this, arguments);
      try {
        const now = performance.now(), dt = now - last; last = now;
        /* F-42 PERF: frames over 250 ms were skipped as stalls, so at Patrick's 3 fps (343 ms a frame) the scale never dropped. Now a
           frame up to watchMax counts unless the page is hidden, and 'long' is slow time in ms (V.watchSlowMs of it drops a step), so a
           very slow field drops within seconds instead of never. ROLLBACK: VO2.watchMax = 250 and VO2.watchSlowMs = 0 (old frame count). */
        const slow = V.watchSlowMs > 0;
        if (V.on && live() && dt > 0 && dt < (V.watchMax || 250) && !(slow && document.hidden) && typeof TXT !== 'undefined'){
          const P = V.perf; P.ema = P.ema ? P.ema * 0.9 + dt * 0.1 : dt;
          if (slow){ if (P.ema > 34) P.long += dt; else P.long = Math.max(0, P.long - 2 * dt); }
          else { if (P.ema > 34) P.long++; else P.long = Math.max(0, P.long - 2); }
          if (slow ? P.long > V.watchSlowMs : P.long > 120){
            if (TXT.k > kFloorNow() + 1e-6){ V.kMax = nextK(TXT.k); P.long = 0; P.drops++; P.ema = 0; console.info('VO2 perf: render scale down to ' + V.kMax); resize(); }
            else if (V.lowAuto && !V.low && kFloorNow() < 1){ V.low = true; P.long = 0; P.ema = 0; console.info('VO2 perf: low spec on (shadows off, fog every ' + V.lowFogEvery + ', pump ' + V.lowPumpMs + ' ms)'); }
          }
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof draw === 'function') draw = frameWatch(draw, () => field() && !G.over && !G.paused);
  if (typeof drawCamp === 'function') drawCamp = frameWatch(drawCamp, () => !field() && !document.hidden);   // the camp too: Patrick's Firefox sat at 12 fps in camp with no drop
  /* Firefox (Patrick 2026-11-11: 12 fps in camp on a Radeon R9 200, 75 ms of JS a frame on a 6 M pixel canvas, Chrome on the same
     scene fine): its canvas path is far slower per pixel, so it starts from a smaller budget and scale; the watch still lowers it */
  V.firefox = /Firefox\//.test(navigator.userAgent);
  if (V.firefox){ V.budget = 2.5e6; V.kMax = 1.5; }
  /* VO2-PERF readout (2026-11-11): F8 in play, index.html?perf=1 or VO2.hud = true paints the frame timings in the top left corner of the field
     and the camp, so a slow machine can be read without the devtools: wall time between frames (the real speed), the JS time of the
     draw, the worst frame of the last five seconds, the canvas and view sizes, the render scale, the VO2 layers, the GPU and browser. */
  V.hud = /[?&#]perf\b/.test(location.search + location.hash);
  window.addEventListener('keydown', e => { if (e.key === 'F8'){ V.hud = !V.hud; H.last = 0; H.worst = 0; e.preventDefault(); } });   // F8 toggles it in play (Patrick could not find the ?perf box)
  const H = {last: 0, gap: 0, cpu: 0, worst: 0, n: 0, gpu: null};
  function hudPaint(cpuMs){
    const now = performance.now(), dt = H.last ? now - H.last : 0; H.last = now;
    if (dt > 0 && dt < 2000){ H.gap = H.gap ? H.gap * 0.9 + dt * 0.1 : dt; H.cpu = H.cpu * 0.9 + cpuMs * 0.1; if (dt > H.worst) H.worst = dt; if (++H.n % 300 === 0) H.worst = 0; }
    if (!H.gpu){ try { const g = document.createElement('canvas').getContext('webgl'), d = g && g.getExtension('WEBGL_debug_renderer_info'); H.gpu = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)).replace(/ANGLE \(|Direct3D.*|\)/g, '').slice(0, 48) : 'no webgl'; } catch (e) { H.gpu = '?'; } }
    const br = (navigator.userAgent.match(/(Firefox|Edg|OPR|Chrome|Safari)\/(\d+)/) || ['', '?', ''])
    const lines = [
      'frame ' + H.gap.toFixed(1) + ' ms (' + (1000 / Math.max(1, H.gap)).toFixed(0) + ' fps)   js ' + H.cpu.toFixed(1) + ' ms   worst ' + H.worst.toFixed(0) + ' ms',
      'canvas ' + canvas.width + 'x' + canvas.height + '   view ' + VW + 'x' + VH + '   dpr ' + (window.devicePixelRatio || 1).toFixed(2) + '   k ' + (typeof TXT !== 'undefined' ? TXT.k.toFixed(2) : '-') + '   kMax ' + V.kMax,
      'vo2 ' + (V.on ? 'on' : 'off') + '   shadows ' + (V.shadowsDrawn || 0) + '   stand-ins ' + (V.standInsLast || 0) + '/frame (total ' + V.standIns + ')   fog-culled ' + (V.fogCulled || 0) + '   low spec ' + (V.low ? 'ON' : 'off') + '   queue ' + (typeof R3DQ !== 'undefined' ? R3DQ.q.length + ' (warm-up ' + R3DQ.q.reduce((n, j) => n + (j.warm42 ? 1 : 0), 0) + (V.warmIdle && V.warmIdle() ? ', slow' : '') + ')' : 0) + '   ground ' + (V.groundCache ? 'cached' : 'live') + '   scale drops ' + V.perf.drops,
      H.gpu + '   ' + br[1] + ' ' + br[2] + (field() ? '   field' : '   camp')];
    if (window.H25) try { lines.push(H25.line()); } catch (e) {}   /* INDEX H25: phase line */
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, y0 = VH - 18 * lines.length - 150;   // bottom left, clear of the squad panel and the brief
    ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(8, y0, w, 18 * lines.length + 10);
    ctx.fillStyle = H.gap > 40 ? '#ff8a6a' : '#d8f0c0'; lines.forEach((l, i) => ctx.fillText(l, 16, y0 + 6 + i * 18));
    ctx.restore();
  }
  if (typeof draw === 'function'){ const f = draw; draw = function(){ const t = performance.now(), r = f.apply(this, arguments); V.standInsLast = V.standInsF || 0; V.standInsF = 0; if (V.hud) try { hudPaint(performance.now() - t); } catch (e) {} return r; }; }
  if (typeof drawCamp === 'function'){ const f = drawCamp; drawCamp = function(){ const t = performance.now(), r = f.apply(this, arguments); if (V.hud) try { hudPaint(performance.now() - t); } catch (e) {} return r; }; }
  /* VO2-PERF figure pump: a queued clip used to be built whole (8 to 12 ray-cast frames, 6 to 30 ms, a boss far more) inside a 7 ms
     budget, so every new foe kind cost a run of long frames. Now a job renders one frame per step, keeps the part on the job, and
     installs the clip when complete; r3dFrames then sees a cache hit and the halo pass runs as before. Any error falls back to the
     original pump for good. */
  if (typeof r3dPump === 'function' && typeof R3DQ !== 'undefined' && typeof r3dRenderSS === 'function'){
    const f = r3dPump;
    const drop = j => { R3DQ.q.shift(); R3DQ.keys.delete(j.jk); };
    const stepFrame = (rec, def, i, dir, st) => {
      r3dUseStyle(st);
      const F = rec.frame, k = st.res;
      if (F){ R3D.W = Math.round(F.W * k); R3D.H = Math.round(F.H * k); R3D.FEET = Math.round(F.FEET * k); R3D.CX = Math.round(F.CX * k); R3D.RB = null; }
      try { const t = performance.now(), c = r3dRenderSS(rec, def.fn(i / def.n, rec), dir, st); R3D.ms += performance.now() - t; R3D.made++; return c; }
      finally { if (F){ R3D.STY = null; r3dUseStyle(st); } }
    };
    r3dPump = function(ms){
      if (!V.on || !V.pumpSteps) return f(ms);
      const t0 = performance.now(), cur = R3D_STYLES[r3dStyleId() || 'crisp']; let made = 0;   // frames built in THIS call (the stall fix, 2026-11-13)
      try {
        while (R3DQ.q.length){
          const j = R3DQ.q[0];
          if (j.st !== cur || !j.rec || !R3D_CLIPS[j.rec.rig] || !R3D_CLIPS[j.rec.rig][j.clip]){ drop(j); continue; }
          const key = j.rec.key + ':' + j.st.id, C = R3D.cache[key];
          if (C && C[j.clip] && C[j.clip][j.dir]){ drop(j); continue; }   // built elsewhere meanwhile
          const def = R3D_CLIPS[j.rec.rig][j.clip], part = j.part = j.part || [];
          if (part.length < def.n){
            if (made && performance.now() - t0 >= ms) break;   // at least one frame per call (was part.length: a part-built job stalled at a tiny budget), never a second past the budget
            part.push(stepFrame(j.rec, def, part.length, j.dir, j.st)); made++;
          }
          if (part.length >= def.n){
            const CC = R3D.cache[key] = R3D.cache[key] || {}, K = CC[j.clip] = CC[j.clip] || []; K[j.dir] = part;
            drop(j);
            try { r3dFrames(j.rec, j.clip, j.dir, j.st); } catch (e) {}
          }
          if (performance.now() - t0 >= ms) break;
        }
      } catch (e) { console.warn('VO2 pump fell back:', e); V.pumpSteps = false; return f(ms); }
      r3dUseStyle(cur);
    };
    if (typeof r3dPumpTick === 'function'){
      r3dPumpTick = function(){ const t = field() ? G.frame : CAMP.t; if (t !== R3DQ.last){ R3DQ.last = t;
        if (V.queuePrune && V.prune && V.on && field() && !G.over && (t - (V.pruneAt || 0) > 300 || t < (V.pruneAt || 0))){ V.pruneAt = t; try { V.prune(); } catch (e) {} }   // F-42: drop jobs nobody asks for
        if (R3DQ.q.length){ let ms = V.on ? ((V.low && V.lowPumpMs > 0) ? Math.min(V.pumpMs, V.lowPumpMs) : V.pumpMs) : 7;
          if (V.on && V.warmIdle && V.warmIdle()){ ms = Math.min(ms, V.warmPumpMs); if (V.warmEvery > 1 && t % V.warmEvery) ms = 0; }   // F-43: only warm-up jobs nobody has asked for: a smaller slice, every warmEvery frames
          if (ms > 0) r3dPump(ms); } } };
    }
  }
  /* VO2-PERF stand-ins: a unit's clip is fetched synchronously (r3dDrawUnit, MON3D.drawUnit), so every new facing of every squad member
     and foe used to ray-cast 8 to 12 frames inside the frame (about a second of stalls per field). While a field is live and the
     clip is not built yet, the nearest built facing of the same clip (else the rec's idle, else any built clip) stands in for the
     frame, padded to the clip's own length so any frame index is valid, and the real clip goes to the front of the pump queue.
     A rec with nothing built at all is still rendered on the spot. Nothing is written to the cache but by the pump. */
  if (typeof r3dFrames === 'function' && typeof r3dFramesAsync === 'function' && typeof R3DQ !== 'undefined'){
    const f = r3dFrames;
    /* F-42 PERF (QA part 2): the padded stand-in array is cached per source clip (it was a new array per figure per frame); a job already
       in the queue is moved to the front at most every V.frontEvery frames (r3dFramesAsync's findIndex + splice over a queue of 1,800 ran
       for every stand-in every frame); V.standInsLast is the count of the last frame (V.standIns stays the running total); and in a field
       a queued job no figure has asked for in V.queueKeepF game frames is dropped (QA's queue never drained: 1,809 jobs), so the pump
       builds what is on screen. ROLLBACK: VO2.frontEvery = 0, VO2.queuePrune = false. */
    V.frontEvery = 30; V.queuePrune = true; V.queueKeepF = 900; V.standInsF = 0; V.standInsLast = 0; V.pruned = 0;
    const padC = new WeakMap(), asked = new Map();
    /* F-43 (QA audits/f43-playability.md s2 item 5: the queue never drains, 800 jobs, and the pump costs 2.1 to 2.3 ms a frame). Cause:
       the warm-ups queue every facing of every clip at deploy whether or not it will be seen: the briefing's B.warm (js/ui/briefing.js 56:
       every squad recipe's core and extra clips, 208 jobs on a hold T2), startDeployment's host pools and bosses (index.html Index 20385,
       64 jobs), the beast kinds (24056, 32) and MON3D.warm (24). The field then pumped them at the full pumpMs for a minute or more, and
       a long contract keeps adding more. Warm jobs are now marked, and while the job at the front of the queue is one no draw has asked
       for, the pump gets warmPumpMs every warmEvery frames instead of pumpMs every frame (one step of a figure is about 2.5 ms, so
       the slice alone did not cut it); anything a figure asks for still goes to the front at the full slice.
       The queue still drains, more slowly, and nothing is dropped early. ROLLBACK: VO2.warmPumpMs = 0. */
    V.warmPumpMs = 1; V.warmEvery = 3;
    { const fA = r3dFramesAsync;
      r3dFramesAsync = function(rec, clip, dir, st, warm){
        const n0 = R3DQ.q.length, r = fA.apply(this, arguments);
        try { if (warm){ if (R3DQ.q.length > n0){ const j = R3DQ.q[R3DQ.q.length - 1]; if (j) j.warm42 = 1; } }
          else if (!r && rec && st && typeof G !== 'undefined' && G) asked.set(rec.key + ':' + st.id + '|' + clip + '|' + dir, G.frame); } catch (e) {}
        return r; }; }
    V.warmIdle = function(){ if (!(V.warmPumpMs > 0) || !field() || G.over) return false; const j = R3DQ.q[0]; return !!(j && j.warm42 && !asked.has(j.jk)); };
    const pad = (src, n) => { if (src.length >= n) return src; let m = padC.get(src); if (!m){ m = new Map(); padC.set(src, m); } let out = m.get(n);
      if (!out){ out = []; for (let i = 0; i < n; i++) out.push(src[i % src.length]); m.set(n, out); } return out; };
    V.prune = function(){
      const q = R3DQ.q, now = G ? G.frame : 0, keep = V.queueKeepF; let w = 0, n = 0;
      for (let i = 0; i < q.length; i++){ const j = q[i]; if (j.seen42 === undefined) j.seen42 = now;
        const last = Math.max(j.seen42, asked.get(j.jk) || -1e9);
        if (now - last > keep){ R3DQ.keys.delete(j.jk); asked.delete(j.jk); n++; } else q[w++] = j; }
      q.length = w; V.pruned += n; if (asked.size > 4000) asked.clear(); return n;
    };
    r3dFrames = function(rec, clip, dir, st){
      if (!V.on || !field() || G.over || !rec || !rec.key || !R3D_CLIPS[rec.rig] || !R3D_CLIPS[rec.rig][clip]) return f(rec, clip, dir, st);
      const S = st || R3D_STYLES[r3dStyleId() || 'crisp'], C = R3D.cache[rec.key + ':' + S.id];
      if (C && C[clip] && C[clip][dir]) return f(rec, clip, dir, st);
      if (!C) return f(rec, clip, dir, st);   // first sight of this rec: build on the spot, the pump has nothing to stand in
      let best = null;
      if (C[clip]) for (let d = 1; d < 5 && !best; d++) best = C[clip][(dir + d) & 7] || C[clip][(dir - d + 8) & 7];
      if (!best && C.idle) best = C.idle[dir] || C.idle.find(x => x);
      if (!best) for (const k in C){ const K = C[k] && C[k].find(x => x); if (K){ best = K; break; } }
      if (!best) return f(rec, clip, dir, st);
      const jk = rec.key + ':' + S.id + '|' + clip + '|' + dir, fr = G.frame, a = asked.get(jk);
      if (!(V.frontEvery > 0) || !R3DQ.keys.has(jk) || a === undefined || fr - a >= V.frontEvery || fr < a){ try { r3dFramesAsync(rec, clip, dir, S, false); } catch (e) {} asked.set(jk, fr); }
      V.standIns++; V.standInsF++;
      return pad(best, R3D_CLIPS[rec.rig][clip].n);
    };
  }
  /* the switch in the settings panel */
  if (typeof settingsHTML === 'function'){
    const f = settingsHTML;
    settingsHTML = function(dark){
      const h = V.hideLook(f(dark));   // the look cards first (above)
      if (!(window.DEV && DEV.on)) return h;   // K92: the preview switch is a dev item
      const add = `<label title="VO-2: painted ground, one light, structures through the figure renderer"><input type="checkbox" ${V.on ? 'checked' : ''} onchange="VO2.set(this.checked)"> One-world look (preview)</label>`;
      const i = h.lastIndexOf('</div>'); return i < 0 ? h + add : h.slice(0, i) + add + h.slice(i);
    };
  }
  if (V.on && window.LOOK){ V.vignetteWas = LOOK.vignette; LOOK.vignette = V.vignette; applyGrade(true); }

  /* a frame of the current field for the look check: forces the time, draws once, returns a PNG data URL */
  V.mock = function(time, hud){
    if (!field() || !G.leader) return null;
    const was = window.LOOK ? LOOK.force : null, on = V.on, dl = window.DECK ? DECK.layer : false;
    if (dl) DECK.layer = false;   // F-43: the Deck's own layer is not in the canvas; draw it in for the shot
    try {
      if (window.LOOK && time){ LOOK.force = time; G.lookTime = null; }
      if (!on) V.set(true);
      V.built = null; draw(); if (hud !== false && typeof drawHUD === 'function') drawHUD();
      return canvas.toDataURL('image/png');
    } finally { if (window.LOOK) LOOK.force = was; if (!on) V.set(false); if (dl) DECK.layer = true; }
  };

  V.selfTest = function(){
    const details = []; let pass = 0, fail = 0;
    const ok = (name, cond) => { if (cond) pass++; else fail++; details.push((cond ? 'ok ' : 'FAIL ') + name); };
    const on = V.on;
    ok('switch on by default (only settings.vo2 === false turns it off)', on === (set().vo2 !== false));
    ok('light() for every time has a unit-ish dir and colours', ['dawn', 'day', 'dusk', 'night'].every(t => { const L = V.light(t); const n = Math.hypot(L.dir.x, L.dir.y); return n > 0.9 && n < 1.1 && /^#/.test(L.colour) && /^#/.test(L.shadow) && L.elev > 0 && L.elev <= 1; }));
    ok('dawn lights from the east, dusk from the west', V.light('dawn').dir.x < 0 && V.light('dusk').dir.x > 0);
    ok('env() names a season and a time', (() => { const e = V.env(); return typeof e.season === 'string' && typeof e.time === 'string'; })());
    ok('off: the style id is the save\'s own', on || r3dStyleId() !== 'painted' || set().chars3d === 'painted');
    ok('figure scale 1.0 (people never taller than trees)', V.figure === 1.0 && (!V.world || V.world.oakH >= 100) && (!hasStruct() || STRUCT.K.oakH >= 100));
    ok('streams optional: ready() false without a field or a story camp, no throw', (() => { try { return !field() && !campNow() ? !ready() : true; } catch (e) { return false; } })());
    ok('mock without a field returns null', field() ? true : V.mock('day') === null);
    ok('dusk grade lighter when on, the VO-1 grade when off', !window.LOOK || !LOOK.grade ? true : on ? LOOK.grade.dusk.amb === V.grade.dusk.amb : (!V.gradeWas || LOOK.grade.dusk.amb === V.gradeWas.dusk.amb));
    ok('VO2-PERF: render scale within the pixel budget and kMax', typeof TXT === 'undefined' || !on || (TXT.k * TXT.k * VW * VH <= V.budget * 1.02 + 1 && TXT.k <= Math.max(V.kMax, 1) + 1e-9 && TXT.k >= kFloorNow() - 1e-9));
    ok('VO2-PERF: the pump builds a clip one frame per step', (() => { try {
      if (typeof r3dLeaderRecipe !== 'function' || !on) return true; const rec = r3dLeaderRecipe(), st = R3D_STYLES.painted; if (!rec) return true;
      const key = rec.key + ':' + st.id; r3dFrames(rec, 'idle', 5, st); const C = R3D.cache[key], had = C.idle[5]; delete C.idle[5];
      const was = R3DQ.q.slice(), keys = new Set(R3DQ.keys); R3DQ.q.length = 0; R3DQ.keys.clear();
      r3dFramesAsync(rec, 'idle', 5, st, true); const j = R3DQ.q[0]; r3dPump(0); const one = j.part && j.part.length === 1 && R3DQ.q[0] === j;
      let n = 0; while (R3DQ.q.length && n++ < 40) r3dPump(0); const fr = R3D.cache[key].idle[5], done = !R3DQ.q.length && fr && fr.length === R3D_CLIPS[rec.rig].idle.n && fr[0].width > 0;
      R3DQ.q.push(...was); for (const k of keys) R3DQ.keys.add(k); return one && done && V.pumpSteps; } catch (e) { return false; } })());
    ok('VO2-PERF: the shadow layer is one blit of the view (no per-sprite multiply)', !on || typeof drawShadowLayer === 'function');
    ok('VO2-PERF: GROUND.ahead exists and paints nothing without a map', !hasGround() || typeof GROUND.ahead !== 'function' || field() || GROUND.ahead(0, 0, 1, 1) === 0);
    ok('VO2-PERF: a missing facing stands in while a field is live', (() => { try {
      if (!on || !field() || G.over || typeof r3dLeaderRecipe !== 'function') return true; const rec = r3dLeaderRecipe(), st = R3D_STYLES.painted, key = rec.key + ':' + st.id;
      f_ignore: { }
      const C = R3D.cache[key]; if (!C || !C.idle) return true; const had = C.idle[7]; delete C.idle[7]; const jk7 = rec.key + ':' + st.id + '|idle|7';
      { const i = R3DQ.q.findIndex(j => j.jk === jk7); if (i >= 0) R3DQ.q.splice(i, 1); R3DQ.keys.delete(jk7); }   // a job already queued for this facing would not be added again
      const n0 = V.standIns, q0 = R3DQ.q.length;
      const fr = r3dFrames(rec, 'idle', 7, st); const ok1 = fr && fr.length === R3D_CLIPS[rec.rig].idle.n && V.standIns === n0 + 1 && !(C.idle[7]) && R3DQ.q.length === q0 + 1 && R3DQ.q[0].dir === 7;
      R3DQ.q.shift(); R3DQ.keys.delete(rec.key + ':' + st.id + '|idle|7'); if (had) C.idle[7] = had; return ok1; } catch (e) { return false; } })());
    ok('VO2-CAMP: campItems is a function and answers [] outside a story camp', typeof V.campItems === 'function' && (campNow() || V.campItems(0, 0).length === 0));
    ok('VO2-CAMP: story camp figures a little bigger (1.1 to 1.6)', V.campFigure >= 1.1 && V.campFigure <= 1.6);
    { // SW-6 rows
      const it = {x: 300, y: 200, ax: 40, ay: 140, s: 1, tall: true}, w = 80, h = 150, L = {x: 380, y: 60}, mate = {x: 300, y: 150};
      ok('SW-6: a canopy whose trunk stands outside the ring fades over a mate inside it', SW6.covers(it, w, h, [L, mate]) && !SW6.covers(it, w, h, [L]));
      ok('SW-6: a figure in front of the base is not faded for (it is drawn over the sprite)', !SW6.covers(it, w, h, [{x: 300, y: 230}]));
      ok('SW-6: a sprite away from the squad stays solid; a low thing never fades', !SW6.covers(it, w, h, [{x: 600, y: 150}]) && !SW6.covers(Object.assign({}, it, {tall: false}), w, h, [mate]));
      const G0 = typeof G !== 'undefined' ? G : undefined, Lg = {x: 0, y: 0}; let figs;
      try { G = {leader: Lg, mod: {radius: 118}, squad: [{x: 50, y: 0, state: 'up'}, {x: 300, y: 0, state: 'up'}, {x: 10, y: 10, state: 'dead'}]}; figs = SW6.figs(Lg); } finally { G = G0; }
      ok('SW-6: the squad counted is the Leader and the living mates inside the Command Radius', figs.length === 2 && figs[1].x === 50);
      const e = {x: 300, y: 200, ax: 40, ay: 140, s: 1, tall: true}; let a1 = 1; for (let i = 0; i < 30; i++) a1 = SW6.alpha(e, w, h, mate);
      ok('SW-6: the fade eases down to SW6.a and back to solid', a1 === SW6.a && (() => { let b = 0; for (let i = 0; i < 30; i++) b = SW6.alpha(e, w, h, {x: 900, y: 900}); return b === 1; })());
    }
    ok('F-42 perf: a sprite bakes once at its drawn size and is reused', (() => { const c = document.createElement('canvas'); c.width = 100; c.height = 80;
      const b1 = bakedOf(c, 50, 40), b2 = bakedOf(c, 50, 40); return b1 === b2 && b1.width === 50 && b1.height === 40; })());
    ok('F-42 perf: a queued job nobody asked for in queueKeepF frames is dropped; one just asked for stays', typeof V.prune !== 'function' || typeof R3DQ === 'undefined' || !G || (() => {
      const q = R3DQ.q.slice(), k = new Set(R3DQ.keys), was = V.queueKeepF; try { R3DQ.q.length = 0; R3DQ.keys.clear();
        R3DQ.q.push({jk: 't42old', seen42: G.frame - 1000}, {jk: 't42new', seen42: G.frame}); R3DQ.keys.add('t42old'); R3DQ.keys.add('t42new'); V.queueKeepF = 900;
        const n = V.prune(); return n === 1 && R3DQ.q.length === 1 && R3DQ.q[0].jk === 't42new' && !R3DQ.keys.has('t42old'); }
      finally { V.queueKeepF = was; R3DQ.q.length = 0; R3DQ.q.push(...q); R3DQ.keys.clear(); for (const x of k) R3DQ.keys.add(x); } })());
    ok('F-43: a structure wholly in unexplored ground is skipped under the fog, drawn once a cell near it is seen, never without fog', (() => {
      if (typeof G === 'undefined' || !G || !MAP || !MAP.seen || !MAP.w) return true;
      const sn = MAP.seen, was = sn.slice(), rf = G.rtsFog; try {
        const it = {x0: 5 * CELL, x1: 6 * CELL, y0: 5 * CELL, y1: 6 * CELL}; for (let y = 2; y <= 9; y++) for (let x = 2; x <= 9; x++) sn[y * MAP.w + x] = 0;
        G.rtsFog = true; const a = fogged(it); sn[3 * MAP.w + 3] = 1; const b = fogged(it); sn[3 * MAP.w + 3] = 0; const c = fogged(it);
        const it2 = {x0: it.x0, x1: it.x1, y0: it.y0, y1: it.y1}; G.rtsFog = false; const d = fogged(it2);
        return a === true && b === false && c === false && d === false; }
      finally { for (let i = 0; i < was.length; i++) sn[i] = was[i]; G.rtsFog = rf; } })());
    ok('F-43 low spec: the watch can turn it on (lowAuto), each part has its switch, fog never runs more often than normal', V.lowAuto === true && typeof V.low === 'boolean' && V.lowShadows === true && V.lowFogEvery >= V.fogEvery && V.lowPumpMs > 0 && V.lowPumpMs <= V.pumpMs
      && (() => { const was = V.low; try { V.low = true; const a = V.fogEveryNow(); V.low = false; const b = V.fogEveryNow(); return a === Math.max(V.fogEvery, V.lowFogEvery) && b === V.fogEvery; } finally { V.low = was; } })());
    ok('F-42 perf: kill switches on by default (bake, shadowCache, fogEvery, frame watch counts slow frames)', V.bake === true && V.groundCache === true && V.groundScroll === true && V.flatMerge === true && V.warmPumpMs > 0 && V.fogCull === true && V.shadowCache === true && V.fogEvery === 2 && V.watchMax > 250 && V.watchSlowMs > 0);
    ok('F-43 terrain cache: GROUND splits into base and anim; a scrolled layer matches a full redraw; rubble leaves the y-sort only while cached', (() => { try {
      if (!hasGround() || typeof GROUND.base !== 'function' || typeof GROUND.anim !== 'function' || typeof GROUND.ver !== 'number') return false;
      if (!on || !field() || G.over || !G.leader || !V.groundCache) return true;
      const L = G.leader, cx = Math.round(L.x - VW / 2), cy = Math.round(L.y - VH / 2), was = V.groundScroll;
      const shot = () => { ctx.save(); drawTerrain(cx + 90, cy + 50); const d = ctx.getImageData(0, 0, Math.min(400, canvas.width), Math.min(300, canvas.height)).data; ctx.restore(); return d; };
      ctx.save(); drawTerrain(cx, cy); ctx.restore(); const k0 = V.groundKey(); V.groundScroll = true;
      ctx.save(); drawTerrain(cx + VW + V.groundPad, cy); ctx.restore();   // past the edge: a scroll or a rebuild
      ctx.save(); drawTerrain(cx, cy); ctx.restore();
      const A = shot(), k1 = V.groundKey(); GROUND.ver++; const B = shot(); let diff = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 6) diff++;
      V.groundScroll = was; return k0 && k1 && k1 !== k0 && diff < A.length / 4 * 0.002 && V.flatIn === !!V.flatMerge; } catch (e) { return false; } })());
    ok('F-43 figure queue: a warm-up job is marked; alone at the front and unasked it gets the small slice; once asked, the full one', (() => { try {
      if (!on || !field() || G.over || !V.warmIdle) return true; const rec = {key: 't43w' + G.frame, rig: 'human'}, st = R3D_STYLES.painted;   // a made-up rec: never pumped, the queue is restored
      const was = R3DQ.q.slice(), keys = new Set(R3DQ.keys); R3DQ.q.length = 0; R3DQ.keys.clear();
      try { r3dFramesAsync(rec, 'idle', 6, st, true); const j = R3DQ.q[0], a = !!(j && j.warm42 === 1) && V.warmIdle();
        r3dFramesAsync(rec, 'idle', 6, st, false); const b = !V.warmIdle(); return a && b; }
      finally { R3DQ.q.length = 0; R3DQ.q.push(...was); R3DQ.keys.clear(); for (const k of keys) R3DQ.keys.add(k); } } catch (e) { return false; } })());
    return {pass, fail, details, ok: fail === 0};
  };
})();
