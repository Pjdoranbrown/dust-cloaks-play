/* Founding backdrops (Art Director, 17 Nov 2026; plan row 2f, spec audits/specs/s6-15a.md section 6 and layout section 8 B).
   Four places the Founding's between-fight cards sit over, in the house 3D style: the same ground and road tiles and
   the same baked 3D props as the camp and the field, seen from the field's 3/4 view.
     road      Act I's cards: the slavers' road through pine and birch, the broken cage and the wagon.
     varnholt  beats b4 to b10: a mining town under threat. Its four hub places stand at the corners
               (Campfire, Barracks, the Quartermaster's wagon, the command tent for the War Table).
     longroad  the Long Road: the refugee column of wagons strung along the road.
     kalloon   the last card: the walled town of Kalloon, its gate towers at the top.
   The card sits centred and the top strip runs across the top (layout 8 A, 8 B), so every landmark stands at the
   edges and corners; the middle is quiet ground under the card's 30% wash.
   Use: FOUNDBACK.draw(name) paints the whole game canvas (cover-fit, centred). It returns true once every prop is
   baked; until then it paints the ground, road and every prop already baked, and rebuilds as the rest arrive.
   FOUNDBACK.names, FOUNDBACK.warm(name), FOUNDBACK.selfTest(). Roll back: ?fback=0 (draw returns false). */
const FOUNDBACK = (function(){
  const on = !/[?&]fback=0/.test(location.search);
  const LW = 1600, LH = 900;                 // scene size in camp world units (camp scale: the props look as they do in camp)
  const cache = {}, n = {built:0, partial:0};
  const rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pat = (g, c) => g.createPattern(c, 'repeat');
  const tile = (k, v) => { try { return (typeof W3T !== 'undefined' && W3T[k]) ? W3T[k](v) : null; } catch (e) { return null; } };
  const bands = z => { try { return w3dBands(w3dZ(z)); } catch (e) { return null; } };

  /* ---------------- ground layers (painted with the house tiles) ---------------- */
  function ground(g){
    const gp = (() => { try { return groundPattern(); } catch (e) { return null; } })();
    g.fillStyle = gp ? pat(g, gp) : '#4a5a32'; g.fillRect(0, 0, LW, LH);
  }
  function road(g, pts, w){
    const rt = tile('road', 1), Dt = bands('dirt');
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++){ const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } const L = pts[pts.length - 1]; g.lineTo(L[0], L[1]); };
    path(); g.globalAlpha = 0.3; g.strokeStyle = Dt ? Dt[2] : '#7a6040'; g.lineWidth = w + 26; g.stroke();
    path(); g.globalAlpha = 1; g.strokeStyle = rt ? pat(g, rt) : '#8a7050'; g.lineWidth = w; g.stroke();
    path(); g.globalAlpha = 0.22; g.strokeStyle = 'rgba(40,28,14,1)'; g.lineWidth = 3; g.setLineDash([18, 26]); g.lineDashOffset = 0; g.stroke();   // a cart rut
    g.restore();
  }
  function patch(g, kind, v, x, y, w, h, alpha){
    const t = tile(kind, v); if (!t) return;                       // a feathered patch: the tile fades out to the edge, no hard rim
    const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); const q = c.getContext('2d');
    q.translate(-(x - w / 2), -(y - h / 2)); q.fillStyle = pat(q, t); q.fillRect(x - w / 2, y - h / 2, w, h); q.setTransform(1, 0, 0, 1, 0, 0);
    q.globalCompositeOperation = 'destination-in'; q.translate(w / 2, h / 2); q.scale(1, h / w);
    const gr = q.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    q.fillStyle = gr; q.fillRect(-w / 2, -w / 2, w, w);
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.drawImage(c, x - w / 2, y - h / 2); g.restore();
  }
  function band(g, kind, v, x, y, w, h){ const t = tile(kind, v); if (!t) return; g.fillStyle = pat(g, t); g.fillRect(x, y, w, h); }
  function soft(g, x, y, r, col, a){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }

  /* ---------------- scenes: ground painter + prop list [kind, x, groundLine, opts] ---------------- */
  function scatter(r, list, kinds, box, count, opts){
    for (let i = 0; i < count; i++){ const k = kinds[(r() * kinds.length) | 0]; list.push([k, box[0] + r() * box[2], box[1] + r() * box[3], Object.assign({}, opts || {}, r() < 0.5 ? {} : {mirror:true})]); }
  }
  const SCENES = {
    road: {
      paint(g){ ground(g); patch(g, 'forest', 0, 120, 160, 520, 360, 0.55); patch(g, 'forest', 1, 1500, 760, 520, 360, 0.55);
        road(g, [[-60, 980], [380, 700], [800, 470], [1220, 230], [1660, -80]], 96); },
      props(){ const r = rngOf(11), L = [];
        scatter(r, L, ['t_pine', 't_pine', 't_birch', 'oak'], [-40, 40, 420, 230], 9);
        scatter(r, L, ['t_pine', 't_birch', 't_pine'], [1180, 640, 440, 280], 8);
        scatter(r, L, ['t_pine', 't_dead', 't_birch'], [1260, 40, 360, 170], 4);
        scatter(r, L, ['dc_bush', 'dc_tuft', 'dc_rock', 'dc_stump', 'dc_tuft'], [0, 0, LW, LH], 26);
        L.push(['w_wagon', 250, 820, {}], ['m_cage_open', 400, 860, {}], ['dc_sacks', 160, 868, {}], ['dc_barrel', 470, 790, {}],
               ['dc_sign', 1330, 330, {}], ['dc_rock', 1100, 140, {}], ['m_tracks', 640, 590, {}], ['m_tracks', 980, 360, {}]);
        return L; }
    },
    varnholt: {
      paint(g){ ground(g);
        patch(g, 'hill', 0, 140, 60, 620, 300, 0.85); patch(g, 'rubble', 0, 360, 170, 260, 120, 0.8);    // the mine's spoil heap, top left
        band(g, 'palisade', 0, 0, 0, LW, 40);                                                               // the town's wall along the top
        patch(g, 'floor', 0, 800, 470, 980, 520, 0.55);                                                      // the trodden square under the card
        road(g, [[800, 980], [800, 640], [800, 40]], 110); road(g, [[-60, 520], [800, 500], [1660, 470]], 70); },
      props(){ const r = rngOf(23), L = [];
        L.push(['campfire', 230, 770, {}], ['dc_benchlog', 150, 810, {}], ['dc_benchlog', 320, 812, {mirror:true}],      // the Campfire, bottom left
               ['f_barracks', 250, 300, {}],                                                                             // the Barracks, top left
               ['w_wagon', 1360, 800, {}], ['dc_crate', 1470, 830, {}], ['dc_barrel', 1240, 840, {}], ['dc_sacks', 1500, 760, {}],   // the Quartermaster, bottom right
               ['f_command', 1350, 300, {}],                                                                             // the War Table, top right
               ['house', 560, 150, {}], ['house', 1040, 150, {mirror:true}], ['f_blacksmith', 560, 840, {}], ['house', 1060, 860, {mirror:true}],
               ['f_watchtower', 1540, 120, {}], ['f_watchtower', 60, 520, {}],
               ['m_scaffold', 120, 120, {}], ['m_buildpile', 420, 200, {}], ['dc_rope', 330, 150, {}], ['m_crystal', 200, 210, {}]);
        scatter(r, L, ['dc_crate', 'dc_barrel', 'dc_tuft', 'dc_rock', 'dc_sacks'], [0, 560, LW, 340], 10);
        scatter(r, L, ['dc_tuft', 'dc_bush'], [1150, 380, 440, 140], 5);
        return L; }
    },
    longroad: {
      paint(g){ ground(g); patch(g, 'forest', 0, 160, 140, 640, 300, 0.5); patch(g, 'forest', 1, 1440, 120, 640, 300, 0.5); patch(g, 'hill', 0, 800, 40, 900, 160, 0.6);
        road(g, [[-60, 760], [500, 700], [1000, 740], [1660, 690]], 104); },
      props(){ const r = rngOf(37), L = [];
        // the column: wagons strung out along the road, people's packs and barrels between them
        for (const [x, y, m] of [[90, 740, 0], [330, 712, 0], [610, 712, 1], [1060, 742, 0], [1320, 722, 1], [1560, 700, 0]]) L.push(['w_wagon', x, y, m ? {mirror:true} : {}]);
        for (const x of [200, 470, 760, 1190, 1440]) L.push(['dc_sacks', x, 760 + r() * 30, {}], ['m_tracks', x + 40, 700 + r() * 20, {}]);
        L.push(['campfire', 1400, 870, {}], ['q_tents', 1520, 880, {}], ['dc_barrel', 160, 880, {}], ['q_tents', 260, 890, {mirror:true}]);
        scatter(r, L, ['t_pine', 't_birch', 'oak', 't_pine'], [-40, 30, 500, 220], 8);
        scatter(r, L, ['t_pine', 't_birch', 't_dead'], [1160, 30, 460, 220], 7);
        scatter(r, L, ['dc_bush', 'dc_tuft', 'dc_rock', 'dc_stump'], [0, 260, LW, 640], 20);
        return L; }
    },
    kalloon: {
      paint(g){ ground(g);
        band(g, 'stone', 0, 0, 0, LW, 170); band(g, 'stoneTop', 0, 0, 150, LW, 24);                          // Kalloon's wall across the top
        patch(g, 'floor', 0, 800, 520, 1100, 560, 0.5);
        road(g, [[800, 980], [790, 600], [800, 170]], 120); },
      props(){ const r = rngOf(53), L = [];
        L.push(['w_gatetower', 690, 190, {}], ['w_gatetower', 910, 190, {mirror:true}], ['m_banner', 640, 210, {}], ['m_banner', 960, 210, {mirror:true}],
               ['f_church', 260, 160, {}], ['f_watchtower', 70, 150, {}], ['f_watchtower', 1530, 150, {}], ['f_merchant', 1340, 170, {}],
               ['house', 140, 420, {}], ['house', 1460, 420, {mirror:true}], ['f_tavern', 230, 820, {}], ['house', 1380, 820, {mirror:true}],
               ['w_wagon', 1080, 860, {}], ['dc_crate', 560, 860, {}], ['dc_barrel', 1180, 880, {}], ['dc_sign', 640, 900, {}]);
        scatter(r, L, ['dc_crate', 'dc_barrel', 'dc_sacks', 'dc_tuft'], [0, 560, LW, 340], 10);
        scatter(r, L, ['oak', 't_birch', 'dc_bush'], [1150, 420, 440, 140], 4);
        scatter(r, L, ['oak', 't_birch', 'dc_bush'], [10, 520, 300, 140], 3);
        return L; }
    }
  };

  /* ---------------- building ---------------- */
  function drawProps(g, list){
    let ok = 0, miss = 0; const real = ctx; ctx = g;
    try {
      for (const [k, x, gl, o] of list.slice().sort((a, b) => a[2] - b[2])){
        if (typeof W3D_KINDS === 'undefined' || !W3D_KINDS[k]){ continue; }
        let d = false;
        try {
          if (o && o.mirror){ g.save(); g.translate(x, 0); g.scale(-1, 1); d = w3dMapProp(k, 0, gl, {}); g.restore(); }
          else d = w3dMapProp(k, x, gl, {});
        } catch (e) { d = false; }
        if (d) ok++; else miss++;
      }
    } finally { ctx = real; }
    return {ok, miss};
  }
  function grade(g, name){
    // late-summer light from the top left; edges fall off so the card and strip read (layout 8 B)
    soft(g, 260, 120, 900, 'rgba(255,214,150,A)', name === 'kalloon' ? 0.10 : 0.16);
    const vg = g.createRadialGradient(LW / 2, LH / 2, LW * 0.28, LW / 2, LH / 2, LW * 0.68);
    vg.addColorStop(0, 'rgba(10,8,4,0)'); vg.addColorStop(1, 'rgba(10,8,4,0.42)'); g.fillStyle = vg; g.fillRect(0, 0, LW, LH);
  }
  function build(name){
    const S = SCENES[name]; if (!S) return null;
    const c = document.createElement('canvas'); c.width = LW; c.height = LH;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    S.paint(g); const res = drawProps(g, S.props()); grade(g, name);
    if (res.miss) n.partial++; else n.built++;
    return {c, done:!res.miss, at:performance.now(), res, tries:1};
  }
  const MAXTRY = 20;   // LE B1: a prop that never bakes stops the rebuilds after 20 tries (about 8 s); the scene then stands as drawn
  // LE B4: a scene is kept for one season and one figure style; a change of either rebuilds it
  const sig = () => { try { return w3dSeason() + '|' + (r3dStyleId() || 'crisp'); } catch (x) { return ''; } };
  function get(name){
    let e = cache[name]; const sg = sig();
    if (e && e.sig !== sg) e = null;
    if (!e || (!e.done && performance.now() - e.at > 400)){
      try { if (typeof r3dPump === 'function') r3dPump(6); } catch (x) {}
      const t = e ? e.tries : 0, f = build(name);
      if (f){ f.sig = sg; f.tries = t + 1; if (!f.done && f.tries >= MAXTRY){ f.done = true; f.capped = true; n.capped = (n.capped || 0) + 1; } e = cache[name] = f; }
    }
    return e;
  }
  /* paint the whole game canvas, cover-fit and centred */
  function draw(name){
    if (!on || !SCENES[name]) return false;
    const e = get(name); if (!e) return false;
    // the main context is hooked (late-fixes.js, Index 79): setTransform scales by TXT.k (device pixels), so fit to the canvas in CSS units
    const cv = ctx.canvas, px = (ctx.__i79 && typeof TXT !== 'undefined' && TXT.k > 0) ? TXT.k : 1, W = cv.width / px, H = cv.height / px, k = Math.max(W / LW, H / LH), dw = LW * k, dh = LH * k;
    // QA 97565bcb: a high-quality scale of the whole scene every frame cost ~17 ms in headless Chromium 1920. Scale it once into a
    // canvas the size it is shown at, then each frame is a 1:1 copy. Rebuilt when the scene, its bake state or the canvas size changes.
    const sw = Math.round(dw * px), sh = Math.round(dh * px);   // device pixels: the hooked transform scales CSS units by px
    if (!(sw >= 1 && sh >= 1)) return e.done;   // a hidden (0-wide) canvas: a 0-size canvas would throw InvalidStateError on drawImage (EN 3a412ff7)
    if (!e.fit || e.fit.width !== sw || e.fit.height !== sh || e.fitOf !== e.c){
      const f = e.fit && e.fit.width === sw && e.fit.height === sh ? e.fit : document.createElement('canvas'); f.width = sw; f.height = sh;
      const fg = f.getContext('2d'); fg.imageSmoothingEnabled = true; fg.imageSmoothingQuality = 'high'; fg.clearRect(0, 0, sw, sh); fg.drawImage(e.c, 0, 0, sw, sh); e.fit = f; e.fitOf = e.c; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(e.fit, Math.round((W - dw) / 2 * px) / px, Math.round((H - dh) / 2 * px) / px, sw / px, sh / px); ctx.restore();
    return e.done;
  }
  // LE B3: warm one scene per idle slice, never all four in one task
  function warm(name){
    if (name){ try { get(name); } catch (e) {} return; }
    const q = Object.keys(SCENES).filter(k => !cache[k]);
    const idle = window.requestIdleCallback ? (f => requestIdleCallback(f, {timeout:2000})) : (f => setTimeout(f, 200));
    const step = () => { const k = q.shift(); if (!k) return; if (!cache[k]) { try { get(k); } catch (e) {} } idle(step); };
    idle(step);
  }
  function selfTest(){
    const rows = [], ok = (s, v) => rows.push((v ? 'ok   ' : 'FAIL ') + s);
    for (const k of Object.keys(SCENES)){
      const missing = SCENES[k].props().map(p => p[0]).filter(x => typeof W3D_KINDS === 'undefined' || !W3D_KINDS[x]);
      ok(k + ': every prop kind exists' + (missing.length ? ' (missing ' + [...new Set(missing)].join(', ') + ')' : ''), !missing.length);
    }
    ok('ground tiles exist', !!tile('road', 1) && !!tile('forest', 0) && !!tile('stone', 0));
    return {pass:rows.filter(r => r.startsWith('ok')).length, fail:rows.filter(r => r.startsWith('FAIL')).length, rows};
  }
  window.addEventListener('load', () => setTimeout(() => { if (on) warm(); }, 2500));
  return {on, names:Object.keys(SCENES), draw, warm, selfTest, n, cache, LW, LH};
})();
