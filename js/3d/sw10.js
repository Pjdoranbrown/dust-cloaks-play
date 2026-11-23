/* ===== INDEX SW10: contracts at 12 fps on Patrick's PC (Patrick 2026-11-13; F-10 and F-20 did not fix it) =====================
   His readouts: Firefox 159, AMD Radeon R9 200, 76 ms of JS a frame, while this PC's Chrome draws the same field in 8 to 16 ms.
   Firefox draws a canvas on the GPU (DrawTargetWebgl) only for solid colours and images. A gradient fill or a ctx.filter falls
   back to its CPU path (Skia), which reads the whole frame back from the GPU and uploads it again. A field frame did this 3 to 5
   times: the LOOK grade's haze ('screen') and vignette, the Command Deck's band, and every crossbow bolt in flight
   (hue-rotate filter), plus hit flashes and the dead mates' grey portraits.
   1. Filter cache: a drawImage with a colour-only filter draws a copy of the image that was filtered once and
      cached (WeakMap per image), with no filter on the main canvas. Same pixels; no fallback.
   2. Gradient cache: a fillRect with a gradient that repeats from frame to frame (same gradient, rect and
      transform) is painted once into a canvas and blitted afterwards, with the same alpha, blend and clip. Same pixels.
   3. Strip patterns: a path filled with a vertical linear gradient (the sunbeams, glow.js) fills with a
      cached 1-pixel-wide strip of that gradient as an image pattern. Same pixels.
   4. Glow sprites: a circle or ellipse filled with a concentric radial gradient that fades to clear (glow.js
      halos, look.js fire pools) draws a cached sprite of the gradient, clipped to the same path. Same pixels.
   5. The F8 phase line gains "slow N": the gradient fills and filtered draws per frame that still take the slow path.
   Only the main canvas's context is hooked (an instance hook; offscreen canvases are untouched).
   No switch (SW10.on and its four part switches were removed in INT-1, 2026-11-15; SW10.fvSync stays). */
(function(){
  'use strict';
  const P = CanvasRenderingContext2D.prototype;
  const FILT = Object.getOwnPropertyDescriptor(P, 'filter');
  const S = window.SW10 = {stripMade: 0, glowMade: 0, v: 1, maxGrad: 16, maxGradPx: 24e6,
    fvSync: true, fvFixed: 0, slow: 0, cached: 0, last: {slow: 0, cached: 0}, ema: 0, hooked: null, gradHits: 0, gradMade: 0, filtMade: 0};
  const COLOUR_ONLY = /^(\s*(hue-rotate|saturate|brightness|grayscale|contrast|sepia|invert)\(\s*-?[\d.]+(deg|%)?\s*\)\s*)+$/;

  /* ---- 1. filter cache ---------------------------------------------------------------------- */
  const FC = new WeakMap();
  function filtered(img, f){
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h || w * h > 4e6) return null;
    let m = FC.get(img); if (!m){ m = new Map(); FC.set(img, m); }
    let c = m.get(f);
    if (c && (c.__w !== w || c.__h !== h)) c = null;
    if (!c){
      c = document.createElement('canvas'); c.width = w; c.height = h; c.__w = w; c.__h = h;
      const g = c.getContext('2d'); g.filter = f; g.drawImage(img, 0, 0); g.filter = 'none';
      m.set(f, c); S.filtMade++;
    }
    return c;
  }

  /* ---- 2. gradient cache -------------------------------------------------------------------- */
  const GR = new WeakMap();              // gradient -> {t, a, stops}
  const GC = new Map();                  // key -> {c, x, y, used}
  const seen = new Map();                // key -> frame last seen (a key is cached the second time it shows)
  let frame = 0;
  function rebuild(g, rec){
    const gr = rec.t === 'L' ? g.createLinearGradient.apply(g, rec.a) : g.createRadialGradient.apply(g, rec.a);
    for (const [o, c] of rec.stops) gr.addColorStop(o, c);
    return gr;
  }
  function gradBlit(c, rec, x, y, w, h){
    const m = P.getTransform.call(c);
    if (m.b || m.c || !(w > 0) || !(h > 0)) return false;
    const ax = m.a * x + m.e, ay = m.d * y + m.f, bx = m.a * (x + w) + m.e, by = m.d * (y + h) + m.f;
    const x0 = Math.floor(Math.min(ax, bx)), y0 = Math.floor(Math.min(ay, by)), x1 = Math.ceil(Math.max(ax, bx)), y1 = Math.ceil(Math.max(ay, by));
    const W = x1 - x0, H = y1 - y0; if (W < 1 || H < 1 || W * H > 8e6) return false;
    const key = rec.t + rec.a.map(v => +(+v).toFixed(2)).join(',') + '|' + rec.stops.map(s => s[0] + ':' + s[1]).join(';') + '|' +
      [m.a, m.d, m.e, m.f, x, y, w, h].map(v => +(+v).toFixed(2)).join(',');
    let e = GC.get(key);
    if (!e){
      const was = seen.get(key); seen.set(key, frame);
      if (seen.size > 400) seen.clear();
      if (was === undefined || frame - was > 2) return false;          // the first time: draw it the usual way
      let px = 0; for (const v of GC.values()) px += v.c.width * v.c.height;
      while (GC.size >= S.maxGrad || (GC.size && px + W * H > S.maxGradPx)){
        let old = null, ok = null; for (const [k, v] of GC) if (!old || v.used < old.used){ old = v; ok = k; }
        px -= old.c.width * old.c.height; GC.delete(ok);
      }
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d'); g.setTransform(m.a, 0, 0, m.d, m.e - x0, m.f - y0); g.fillStyle = rebuild(g, rec); g.fillRect(x, y, w, h);
      e = {c: cv, x: x0, y: y0, used: frame}; GC.set(key, e); S.gradMade++;
    }
    e.used = frame;
    P.setTransform.call(c, 1, 0, 0, 1, 0, 0);
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
    try { P.drawImage.call(c, e.c, e.x, e.y); } finally { c.imageSmoothingEnabled = sm; P.setTransform.call(c, m); }
    S.gradHits++;
    return true;
  }

  /* ---- 2b. vertical gradient on a path (the sunbeams): a 1-pixel-wide strip of the gradient, cached, filled as a
     pattern (Firefox draws image patterns on the GPU). The strip covers the whole visible height, so the gradient's
     clamped end colours come out the same. */
  const SC = new Map();
  function strip(c, rec){
    const a = rec.a; if (rec.t !== 'L' || a[0] !== a[2] || a[1] === a[3] || !rec.stops.length) return null;
    const m = P.getTransform.call(c); if (m.b || m.c || !m.d) return null;
    const yA = (0 - m.f) / m.d, yB = (c.canvas.height - m.f) / m.d;
    const lo = Math.floor(Math.min(yA, yB, a[1], a[3]) / 32) * 32 - 32, hi = Math.ceil(Math.max(yA, yB, a[1], a[3]) / 32) * 32 + 32;
    const N = Math.max(2, Math.min(4096, Math.ceil((hi - lo) * Math.abs(m.d))));
    const key = (+a[1]).toFixed(2) + ',' + (+a[3]).toFixed(2) + '|' + lo + ',' + hi + ',' + N + '|' + rec.stops.map(s => s[0] + ':' + s[1]).join(';');
    let e = SC.get(key);
    if (!e){
      if (SC.size >= 32) SC.delete(SC.keys().next().value);
      const cv = document.createElement('canvas'); cv.width = 1; cv.height = N;
      const g = cv.getContext('2d'); g.setTransform(1, 0, 0, N / (hi - lo), 0, -lo * N / (hi - lo));
      g.fillStyle = rebuild(g, {t: 'L', a: [0, a[1], 0, a[3]], stops: rec.stops}); g.fillRect(0, lo, 1, hi - lo);
      const pat = P.createPattern.call(c, cv, 'repeat'); pat.setTransform(new DOMMatrix([1, 0, 0, (hi - lo) / N, 0, lo]));
      e = {pat}; SC.set(key, e); S.stripMade++;
    } else { SC.delete(key); SC.set(key, e); }
    return e.pat;
  }

  /* ---- 2c. round glows (halos, fire pools): a path filled with a concentric radial gradient that fades to clear is
     drawn as a cached sprite of that gradient, clipped to the same path. The stops' alphas are scaled to a peak of 1
     and the peak goes on globalAlpha, so one sprite serves every flicker. Same pixels (to rounding). */
  const RC = new Map();
  const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.e-]+)\s*)?\)$/;
  function glow(c, rec, args, fl){
    const a = rec.a; if (rec.t !== 'R' || a[0] !== a[3] || a[1] !== a[4] || !(a[5] > 0) || !(a[2] >= 0) || rec.stops.length < 2) return false;
    const m = P.getTransform.call(c); if (m.b || m.c) return false;
    const st = []; let peak = 0;
    for (const [o, col] of rec.stops){ const q = RGBA.exec(col); if (!q) return false; const al = q[4] === undefined ? 1 : +q[4]; st.push([+o, +q[1], +q[2], +q[3], al]); if (al > peak) peak = al; }
    if (st[st.length - 1][4] !== 0 || !(peak > 0)) return false;
    const r1 = a[5], R = Math.max(4, Math.min(512, Math.ceil(r1 * Math.max(Math.abs(m.a), Math.abs(m.d)) / 4) * 4));
    const ns = st.map(s => [s[0], s[1], s[2], s[3], Math.round(s[4] / peak * 1000) / 1000]);
    const key = (a[2] / r1).toFixed(3) + '|' + R + '|' + ns.map(s => s.join(',')).join(';');
    let e = RC.get(key);
    if (!e){
      if (RC.size >= 64) RC.delete(RC.keys().next().value);
      const cv = document.createElement('canvas'); cv.width = cv.height = 2 * R + 2;
      const g = cv.getContext('2d'), gr = g.createRadialGradient(R + 1, R + 1, R * a[2] / r1, R + 1, R + 1, R);
      for (const s of ns) gr.addColorStop(s[0], 'rgba(' + s[1] + ',' + s[2] + ',' + s[3] + ',' + s[4] + ')');
      g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
      e = cv; RC.set(key, e); S.glowMade++;
    } else { RC.delete(key); RC.set(key, e); }
    const s = r1 / R, ga = c.globalAlpha;
    c.save();
    try {
      P.clip.apply(c, args);   /* the same path (current path or Path2D) and fill rule as the fill */
      c.globalAlpha = ga * peak;
      P.drawImage.call(c, e, a[0] - (R + 1) * s, a[1] - (R + 1) * s, e.width * s, e.height * s);
    } finally { c.restore(); }
    return true;
  }

  /* ---- the hook, on one context instance ---------------------------------------------------- */
  S.hook = function(c){
    if (!c || c.__sw10) return; c.__sw10 = true;
    let fv = 'none';
    Object.defineProperty(c, 'filter', {configurable: true, get(){ return FILT.get.call(this); }, set(v){ FILT.set.call(this, v); fv = FILT.get.call(this); }});
    const di = P.drawImage, fr = P.fillRect, fl = P.fill, st = P.stroke, cl = P.createLinearGradient, crg = P.createRadialGradient;
    c.drawImage = function(img){
      if (fv === 'none' || !fv) return di.apply(this, arguments);
      /* F-45 (h): ctx.restore() and a canvas resize change the filter without the setter above, so fv went stale after any
         save / filter / restore hit flash (wagon, gate, tower): every later image in the frame, the LOOK grade layers too, was
         drawn through that flash's brightness (the night raid's random bright and dark flashes). Read the real value.
         ROLLBACK: SW10.fvSync = false. */
      if (S.fvSync){ const cur = FILT.get.call(this); if (cur !== fv){ fv = cur; S.fvFixed++; if (fv === 'none' || !fv) return di.apply(this, arguments); } }
      if (COLOUR_ONLY.test(fv)){
        let f = null; try { f = filtered(img, fv); } catch (e) { f = null; }
        if (f){
          const a = Array.prototype.slice.call(arguments); a[0] = f;
          FILT.set.call(this, 'none'); try { return di.apply(this, a); } finally { FILT.set.call(this, fv); S.cached++; }
        }
      }
      S.slow++; return di.apply(this, arguments);
    };
    c.createLinearGradient = function(){ const g = cl.apply(this, arguments); track(g, 'L', arguments); return g; };
    c.createRadialGradient = function(){ const g = crg.apply(this, arguments); track(g, 'R', arguments); return g; };
    c.fillRect = function(x, y, w, h){
      const fs = this.fillStyle;
      if (fs instanceof CanvasGradient){
        const rec = GR.get(fs);
        if (rec && fv === 'none'){ try { if (gradBlit(this, rec, x, y, w, h)){ S.cached++; return; } } catch (e) {} }
        S.slow++;
      } else if (fv !== 'none' && fv) S.slow++;
      return fr.apply(this, arguments);
    };
    c.fill = function(){
      const fs = this.fillStyle;
      if (fs instanceof CanvasGradient){
        const rec = GR.get(fs), pat = rec && fv === 'none' ? strip(this, rec) : null;
        if (pat){ this.fillStyle = pat; try { return fl.apply(this, arguments); } finally { this.fillStyle = fs; S.cached++; } }
        if (rec && fv === 'none'){ try { if (glow(this, rec, arguments, fl)){ S.cached++; return; } } catch (e) {} }
        S.slow++;
      } else if (fv !== 'none' && fv) S.slow++;
      return fl.apply(this, arguments);
    };
    c.stroke = function(){ if (this.strokeStyle instanceof CanvasGradient || (fv !== 'none' && fv)) S.slow++; return st.apply(this, arguments); };
    S.hooked = c;
  };
  function track(g, t, args){
    const rec = {t, a: Array.prototype.slice.call(args), stops: []}; GR.set(g, rec);
    const add = g.addColorStop; g.addColorStop = function(o, col){ rec.stops.push([o, String(col)]); return add.call(this, o, col); };
  }

  /* ---- frame boundary: roll the counters; re-hook if the main context was replaced ------------ */
  S.frame = function(){
    frame++; S.last = {slow: S.slow, cached: S.cached}; S.ema = S.ema * 0.9 + S.slow * 0.1; S.slow = 0; S.cached = 0;
  };
  const G_ = n => { try { return (0, eval)('typeof ' + n + " !== 'undefined' ? " + n + ' : undefined'); } catch (e) { return undefined; } };
  const set = (n, v) => { window.__sw10 = v; (0, eval)(n + ' = window.__sw10'); delete window.__sw10; };
  for (const n of ['draw', 'drawCamp']){
    const f = G_(n); if (typeof f !== 'function') continue;
    set(n, function(){
      const c = G_('ctx'); if (c && !c.__sw10) S.hook(c);
      try { return f.apply(this, arguments); } finally { S.frame(); }
    });
  }
  { const c = G_('ctx'); if (c) S.hook(c); }
  if (window.H25 && typeof H25.line === 'function'){
    const f = H25.line; H25.line = function(){ return f.apply(this, arguments) + '   slow ' + S.ema.toFixed(1); };
  }

  /* ---- self-test ---------------------------------------------------------------------------- */
  S.clearCaches = function(){ GC.clear(); RC.clear(); seen.clear(); };   // the next draws rebuild them
  S.selfTest = function(){
    S.clearCaches();   // QA Low: a second run on one page found the test's gradients and glows already cached
    const out = []; let pass = 0, n = 0;
    const ok = (name, c) => { n++; if (c) pass++; out.push((c ? 'ok  ' : 'FAIL') + ' ' + name); };
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const px = (c, x, y) => Array.from(P.getImageData.call(c.getContext('2d'), x, y, 1, 1).data);
    const near = (a, b, t) => a.every((v, i) => Math.abs(v - b[i]) <= (t || 2));
    // premultiplied compare: at low alpha the stored RGB is rounded hard (alpha 33 can differ by 10 per channel while looking the same)
    const nearP = (a, b, t) => Math.abs(a[3] - b[3]) <= t && a.slice(0, 3).every((v, i) => Math.abs(v * a[3] / 255 - b[i] * b[3] / 255) <= t);
    const src = mk(8, 8), sg = src.getContext('2d'); sg.fillStyle = '#c03020'; sg.fillRect(0, 0, 8, 8); sg.fillStyle = '#20a040'; sg.fillRect(4, 0, 4, 8);
    try {
      // 1. filter cache gives the native pixels
      const A = mk(16, 16), a = A.getContext('2d'), B = mk(16, 16), b = B.getContext('2d'); S.hook(a);
      a.filter = 'hue-rotate(160deg) saturate(2)'; S.cached = 0; a.drawImage(src, 2, 2); a.filter = 'none';
      b.filter = 'hue-rotate(160deg) saturate(2)'; b.drawImage(src, 2, 2); b.filter = 'none';
      ok('SW10-1 a colour filter draws from the cache', S.cached === 1);
      ok('SW10-2 the cached filter gives the native pixels', near(px(A, 3, 3), px(B, 3, 3)) && near(px(A, 8, 3), px(B, 8, 3)));
      // 2. a blur is not cached
      S.slow = 0; a.filter = 'blur(1px)'; a.drawImage(src, 0, 0); a.filter = 'none';
      ok('SW10-3 a blur filter keeps the native path and counts as slow', S.slow === 1);
      // 3. gradient cache: first draw native, the repeat from the cache, same pixels
      const C2 = mk(64, 32), c2 = C2.getContext('2d'), D2 = mk(64, 32), d2 = D2.getContext('2d'); S.hook(c2);
      const paint = (g) => { const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(200,180,150,.6)'); gr.addColorStop(1, 'rgba(20,12,6,.9)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 32); };
      const made0 = S.gradMade, hit0 = S.gradHits;
      paint(c2); S.frame(); paint(c2); S.frame(); paint(c2);
      paint(d2); paint(d2); paint(d2);
      ok('SW10-4 a repeated gradient fill is cached once and reused', S.gradMade === made0 + 1 && S.gradHits >= hit0 + 2);
      ok('SW10-5 the cached gradient gives the native pixels', near(px(C2, 10, 2), px(D2, 10, 2)) && near(px(C2, 50, 28), px(D2, 50, 28)));
      // 4. rotated: native
      const hit1 = S.gradHits; c2.save(); c2.rotate(0.3); paint(c2); S.frame(); paint(c2); c2.restore();
      ok('SW10-6 a rotated gradient keeps the native path', S.gradHits === hit1);
      // 6. the main context is hooked and the phase line carries the count
      { const c = G_('ctx'); if (c) S.hook(c); ok('SW10-8 the main canvas context is hooked', !c || (c.__sw10 && Object.prototype.hasOwnProperty.call(c, 'filter'))); }
      ok('SW10-9 the F8 line shows slow', !window.H25 || /slow /.test(H25.line()));
      // 7. a vertical gradient on a path (sunbeams) fills from a cached strip, same pixels, ends clamped
      const E = mk(48, 64), e2 = E.getContext('2d'), F = mk(48, 64), f2 = F.getContext('2d'); S.hook(e2);
      const beam = (g) => { g.setTransform(1.25, 0, 0, 1.25, 0, 0); const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, 'rgba(250,210,140,.8)'); gr.addColorStop(0.55, 'rgba(250,210,140,.3)'); gr.addColorStop(1, 'rgba(250,210,140,0.1)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(4, 0); g.lineTo(20, 0); g.lineTo(34, 51); g.lineTo(18, 51); g.closePath(); g.fill(); };
      S.cached = 0; beam(e2); beam(f2);
      ok('SW10-10 a vertical gradient on a path fills from the strip', S.cached === 1);
      ok('SW10-11 the strip gives the native pixels, ends clamped', near(px(E, 20, 5), px(F, 20, 5), 3) && near(px(E, 28, 30), px(F, 28, 30), 3) && near(px(E, 38, 60), px(F, 38, 60), 3));
      // 8. a glow (radial gradient, fading to clear, on an ellipse) draws from a sprite; same pixels; the flicker reuses it
      const H = mk(64, 64), h2 = H.getContext('2d'), J = mk(64, 64), j2 = J.getContext('2d'); S.hook(h2);
      const halo = (g, k) => { g.setTransform(1.25, 0, 0, 1.25, 0, 0); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(24, 24, 2, 24, 24, 20);
        gr.addColorStop(0, 'rgba(255,170,80,' + 0.34 * k + ')'); gr.addColorStop(0.5, 'rgba(255,170,80,' + 0.12 * k + ')'); gr.addColorStop(1, 'rgba(255,170,80,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(24, 24, 20, 12, 0, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over'; };
      const gm0 = S.glowMade; S.cached = 0; halo(h2, 0.9); halo(j2, 0.9);
      ok('SW10-12 a glow draws from a cached sprite', S.cached === 1 && S.glowMade === gm0 + 1);
      ok('SW10-13 the glow sprite gives the native pixels, clipped to the ellipse', nearP(px(H, 30, 30), px(J, 30, 30), 3) && nearP(px(H, 42, 30), px(J, 42, 30), 3) && nearP(px(H, 30, 48), px(J, 30, 48), 3) && nearP(px(H, 30, 18), px(J, 30, 18), 3));
      S.cached = 0; halo(h2, 0.6);
      ok('SW10-14 a flicker (other alpha) reuses the same sprite', S.cached === 1 && S.glowMade === gm0 + 1);
    } catch (e) { ok('SW10 threw: ' + e, false); }
    const fails = out.filter(s => s.startsWith('FAIL')); out.push(pass + '/' + n); return {ok: pass === n, n, pass, fails, out};
  };
})();
/* ===== END INDEX SW10 ======================================================================== */
