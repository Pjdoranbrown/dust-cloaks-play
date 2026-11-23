/* INDEX PORT48 - F-48 Phase 4 (Art lead): portraits show the person's state, painted into the picture.
   Replaces portWounds (index.html Index 30), which drew flat stickers on the painting: pink scratches, a white plaster,
   a white bar for a sling. The new marks are blended into the painting's own colours and masked to the painted figure:
     scars      a dark groove with a pale raised edge and flushed skin round it (1 to 4, the same places as before)
     eye        a leather patch with a shaded dome, a rim and a strap that fades into the hair
     hurt       (resting) a bruise on the cheekbone, a split brow and a line of dried blood
     arm        a linen sling with folds and its own shadow
     mana       pale branching burn lines from the temple, with a faint glow
     lung       dark hollows under the eyes
     shell      the same hollows, and the colour drained from the face
   The knee does not show on a bust. Custom (uploaded) portraits keep the old corner badges: the face position is not known.
   Also fixes the framed portrait cache, which ignored rest and scars (see hook).
   Skin marks (scars, bruise, blood, burn lines, hollows) keep to bare skin: a helmet, nose guard, hood or mask over the spot
   hides that part of the mark. The skin is found by colour, from the band round the eyes.
   INT-1 group 11: no switch (on, avoid baked in). */
(function(){
  'use strict';
  let avoid = true;   // the self-test turns it off for one comparison
  const A = window.PORT48 = {fails:{}, drawn:0, skinned:0};
  const G_ = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const TAU = Math.PI * 2;
  function rng(seed){ let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  let W = 144, H = 176;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  // draw on a spare sheet (blurred if asked), keep only what falls on the painted figure
  function layer(fig, draw, blur){
    const c = mk(), q = c.getContext('2d'); q.lineCap = q.lineJoin = 'round';
    if (blur) q.filter = 'blur(' + blur.toFixed(2) + 'px)';
    draw(q); q.filter = 'none';
    q.globalCompositeOperation = 'destination-in'; q.drawImage(fig.cv, 0, 0);
    return c;
  }
  function put(g, c, mode, alpha){ g.save(); g.globalCompositeOperation = mode || 'source-over'; g.globalAlpha = alpha === undefined ? 1 : alpha; g.drawImage(c, 0, 0); g.restore(); }
  // a smooth path through three points, with a little wander
  function curve(P, n, rnd, wob){
    const out = [];
    for (let i = 0; i <= n; i++){ const t = i / n, u = 1 - t;
      const x = u * u * P[0][0] + 2 * u * t * (2 * P[1][0] - (P[0][0] + P[2][0]) / 2) + t * t * P[2][0];
      const y = u * u * P[0][1] + 2 * u * t * (2 * P[1][1] - (P[0][1] + P[2][1]) / 2) + t * t * P[2][1];
      const k = Math.sin(Math.PI * t); out.push([x + (rnd() - 0.5) * wob * k, y + (rnd() - 0.5) * wob * k]); }
    return out;
  }
  // a stroke that is widest in the middle and comes to a point at both ends
  function taper(q, pts, w, col, pow){
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++){ const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
      const hw = w / 2 * Math.pow(Math.sin(Math.PI * (i / (n - 1))), pow || 0.6) + 0.05;
      L.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]); R.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]); }
    q.beginPath(); q.moveTo(L[0][0], L[0][1]); for (const p of L) q.lineTo(p[0], p[1]); for (let i = n - 1; i >= 0; i--) q.lineTo(R[i][0], R[i][1]); q.closePath();
    q.fillStyle = col; q.fill();
  }
  const ell = (q, x, y, rx, ry, rot) => { q.beginPath(); q.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };

  function scar(g, fig, P, s, rnd){
    const pts = curve(P, 18, rnd, 1.6 * s);
    put(g, layer(fig, q => taper(q, pts, 4.2 * s + 1.5, '#a04848'), 1.5 * s + 0.4), 'soft-light', 0.75);          // flushed skin
    put(g, layer(fig, q => taper(q, pts, 1.5 * s + 0.6, '#6a342c'), 0.35), 'multiply', 0.85);                     // the groove
    put(g, layer(fig, q => taper(q, pts.map(p => [p[0] - 0.55 * s - 0.2, p[1] - 0.45 * s - 0.2]), 0.8 * s + 0.35, '#ffe9dc'), 0.3), 'soft-light', 0.95);   // raised edge, lit from the upper left
    put(g, layer(fig, q => taper(q, pts.map(p => [p[0] - 0.55 * s - 0.2, p[1] - 0.45 * s - 0.2]), 0.5 * s + 0.25, '#f3cdbd'), 0.25), 'source-over', 0.28);
  }
  function eyePatch(g, fig, P, dir, d){
    const rx = 0.42 * d, ry = 0.35 * d, sw = Math.max(1.4, 0.1 * d);
    const strap = (q, off) => {
      for (const [ex, ey, cxp, cyp] of [[P[0] - dir * 1.25 * d, P[1] - 1.0 * d, P[0] - dir * 0.5 * d, P[1] - 0.72 * d], [P[0] + dir * 1.3 * d, P[1] - 0.42 * d, P[0] + dir * 0.7 * d, P[1] - 0.42 * d]]){
        const gr = q.createLinearGradient(P[0], P[1], ex, ey); gr.addColorStop(0, off ? 'rgba(0,0,0,.75)' : '#241810'); gr.addColorStop(0.72, off ? 'rgba(0,0,0,.55)' : '#1c120c'); gr.addColorStop(1, 'rgba(20,12,8,0)');
        q.strokeStyle = gr; q.lineWidth = sw; q.beginPath(); q.moveTo(P[0], P[1] + (off || 0)); q.quadraticCurveTo(cxp, cyp + (off || 0), ex, ey + (off || 0)); q.stroke();
      }
    };
    const shape = (q, ox, oy, k) => { const x = P[0] + (ox || 0), y = P[1] + (oy || 0), a = rx * (k || 1), b = ry * (k || 1);
      q.beginPath(); q.moveTo(x - a, y - b * 0.62); q.quadraticCurveTo(x, y - b * 1.2, x + a, y - b * 0.62); q.quadraticCurveTo(x + a * 1.08, y + b * 0.55, x, y + b * 1.12); q.quadraticCurveTo(x - a * 1.08, y + b * 0.55, x - a, y - b * 0.62); q.closePath(); };
    put(g, layer(fig, q => strap(q, 1.2), 0.9), 'multiply', 0.7);
    put(g, layer(fig, q => { strap(q, 0); q.strokeStyle = 'rgba(150,120,90,.35)'; q.lineWidth = 0.5; q.beginPath(); q.moveTo(P[0], P[1] - sw * 0.3); q.quadraticCurveTo(P[0] - dir * 0.5 * d, P[1] - 0.72 * d - sw * 0.3, P[0] - dir * 1.0 * d, P[1] - 0.9 * d - sw * 0.3); q.stroke(); }, 0.25));
    put(g, layer(fig, q => { shape(q, 1.0, 1.8, 1.06); q.fillStyle = 'rgba(0,0,0,.9)'; q.fill(); }, 1.6), 'multiply', 0.65);
    put(g, layer(fig, q => {
      shape(q); const gr = q.createRadialGradient(P[0] - rx * 0.35, P[1] - ry * 0.45, 0.5, P[0], P[1], rx * 1.25);
      gr.addColorStop(0, '#5c4532'); gr.addColorStop(0.35, '#2e2118'); gr.addColorStop(1, '#0e0906'); q.fillStyle = gr; q.fill();
      q.strokeStyle = 'rgba(120,96,70,.55)'; q.lineWidth = 0.6; q.stroke();
      shape(q, 0, 0, 0.82); q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 0.4; q.setLineDash([1, 1.4]); q.stroke(); q.setLineDash([]);
    }, 0.2));
  }
  function hurt(g, fig, F, s, rnd){
    const d = F.d, a = F.A, b = F.B;
    put(g, layer(fig, q => { ell(q, a[0] - 0.08 * d, a[1] + 0.4 * d, 0.5 * d, 0.3 * d, 0.2); q.fillStyle = '#9a9440'; q.fill(); }, 2.6 * s + 0.6), 'soft-light', 0.5);
    put(g, layer(fig, q => { ell(q, a[0] - 0.1 * d, a[1] + 0.36 * d, 0.3 * d, 0.17 * d, 0.2); q.fillStyle = '#5c3a7c'; q.fill();
      ell(q, a[0] + 0.06 * d, a[1] + 0.3 * d, 0.16 * d, 0.1 * d, -0.3); q.fillStyle = '#7a2c44'; q.fill(); }, 1.8 * s + 0.5), 'multiply', 0.8);
    const cut = curve([[b[0] - 0.02 * d, b[1] - 0.44 * d], [b[0] + 0.2 * d, b[1] - 0.4 * d], [b[0] + 0.42 * d, b[1] - 0.3 * d]], 10, rnd, 0.6 * s);
    put(g, layer(fig, q => taper(q, cut, 2.8 * s + 1, '#a03030'), 1.2 * s + 0.3), 'soft-light', 0.8);
    put(g, layer(fig, q => taper(q, cut, 1.5 * s + 0.7, '#4a0c0c'), 0.3), 'multiply', 1);
    const run = curve([[b[0] + 0.4 * d, b[1] - 0.3 * d], [b[0] + 0.5 * d, b[1] + 0.06 * d], [b[0] + 0.44 * d, b[1] + 0.46 * d]], 14, rnd, 0.5 * s);
    put(g, layer(fig, q => { taper(q, run, 1.6 * s + 0.7, '#5c0e0e', 0.35); ell(q, run[run.length - 2][0], run[run.length - 2][1], 0.7 * s + 0.3, 0.9 * s + 0.4); q.fillStyle = '#6a1212'; q.fill(); }, 0.3), 'multiply', 0.85);
    put(g, layer(fig, q => taper(q, run.map(p => [p[0] - 0.3 * s, p[1]]), 0.45 * s + 0.2, '#e06a5a', 0.35), 0.25), 'soft-light', 0.7);
  }
  function sling(g, fig){
    const top = t => [144 * t, 106 + 52 * Math.sin(Math.min(1, t * 1.1) * Math.PI / 2)], wd = t => 13 + 7 * t;
    const band = (q, oy) => { q.beginPath(); for (let i = 0; i <= 24; i++){ const p = top(i / 24); if (i) q.lineTo(p[0], p[1] + oy); else q.moveTo(p[0], p[1] + oy); }
      for (let i = 24; i >= 0; i--){ const p = top(i / 24); q.lineTo(p[0], p[1] + wd(i / 24) + oy); } q.closePath(); };
    put(g, layer(fig, q => { band(q, 4); q.fillStyle = '#000'; q.fill(); }, 3), 'multiply', 0.55);
    put(g, layer(fig, q => {
      band(q, 0); const gr = q.createLinearGradient(40, 118, 60, 176); gr.addColorStop(0, '#b0a184'); gr.addColorStop(0.45, '#8f8167'); gr.addColorStop(1, '#5a4f3c'); q.fillStyle = gr; q.fill();
      q.save(); band(q, 0); q.clip();
      q.filter = 'blur(0.8px)';
      for (const [k, al] of [[0.3, 0.5], [0.72, 0.55]]){ q.strokeStyle = 'rgba(40,30,18,' + al + ')'; q.lineWidth = 2.2; q.beginPath(); for (let i = 0; i <= 24; i++){ const p = top(i / 24), y = p[1] + wd(i / 24) * (k + 0.06 * Math.sin(i * 0.9)); if (i) q.lineTo(p[0], y); else q.moveTo(p[0], y); } q.stroke(); }
      q.strokeStyle = 'rgba(255,244,220,.32)'; q.lineWidth = 1.4; q.beginPath(); for (let i = 0; i <= 24; i++){ const p = top(i / 24); if (i) q.lineTo(p[0], p[1] + 1.2); else q.moveTo(p[0], p[1] + 1.2); } q.stroke();
      q.filter = 'none'; q.globalCompositeOperation = 'overlay'; q.globalAlpha = 0.55; q.drawImage(fig.cv, 0, 0); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1;
      q.restore();
      // the knot at the shoulder
      for (const [x, y, r, c] of [[8, 106, 6.5, '#6e624c'], [12, 102, 4.8, '#a39579'], [5, 100, 3.2, '#8a7d64']]){ ell(q, x, y, r, r * 0.85, 0.4); q.fillStyle = c; q.fill(); }
    }, 0.45));
  }
  function mana(g, fig, F, s, rnd){
    const d = F.d, o = [F.B[0] + 0.52 * d, F.B[1] - 0.45 * d], segs = [];
    (function grow(x, y, ang, len, depth){
      if (depth > 6 || len < 0.05 * d) return;
      const a = ang + (rnd() - 0.5) * 0.9, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; segs.push([x, y, x2, y2, 1 - depth / 7]);
      grow(x2, y2, a, len * (0.78 + rnd() * 0.12), depth + 1);
      if (rnd() < 0.55) grow(x2, y2, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5), len * 0.62, depth + 2);
    })(o[0], o[1], Math.PI / 2 + 0.25, 0.24 * d, 0);
    const lines = (q, w, col) => { q.strokeStyle = col; for (const [x, y, x2, y2, k] of segs){ q.lineWidth = w * (0.4 + 0.6 * k); q.beginPath(); q.moveTo(x, y); q.lineTo(x2, y2); q.stroke(); } };
    put(g, layer(fig, q => { ell(q, o[0], o[1] + 0.3 * d, 0.3 * d, 0.5 * d, 0.2); q.fillStyle = '#6a3030'; q.fill(); }, 2.6 * s + 0.6), 'multiply', 0.35);
    put(g, layer(fig, q => lines(q, 2.6 * s + 1, '#6fd0ff'), 1.5 * s + 0.4), 'screen', 0.6);
    put(g, layer(fig, q => lines(q, 0.9 * s + 0.4, '#f2fcff'), 0.3), 'soft-light', 0.95);
    put(g, layer(fig, q => lines(q, 0.6 * s + 0.3, '#d8f4ff'), 0.25), 'source-over', 0.4);
  }
  function hollows(g, fig, F, s, drain){
    const d = F.d;
    put(g, layer(fig, q => { for (const P of [F.A, F.B]){ ell(q, P[0], P[1] + 0.27 * d, 0.3 * d, 0.11 * d); q.fillStyle = '#3c2c50'; q.fill(); } }, 1.2 * s + 0.4), 'multiply', 0.6);
    if (drain){
      put(g, layer(fig, q => { ell(q, F.cx, F.cy + 0.25 * d, 1.0 * d, 1.25 * d); q.fillStyle = '#808080'; q.fill(); }, 5 * s + 1), 'saturation', 0.62);
      put(g, layer(fig, q => { ell(q, F.cx, F.cy + 0.25 * d, 0.95 * d, 1.2 * d); q.fillStyle = '#b8c4cc'; q.fill(); }, 5 * s + 1), 'multiply', 0.3);
    }
  }

  /* The bare skin of the face, as a picture to mask marks with. The skin colour is the middle colour of the band round the
     eyes (dark pixels left out); skin is every pixel near that hue and not much darker or lighter. Returns null (no avoiding)
     when the skin is grey (steel cannot be told from it) or too little skin is found for the answer to be trusted. */
  function skinMask(fig, F){
    try {
      const d = F.d, x0 = Math.max(0, Math.floor(F.cx - 1.5 * d)), y0 = Math.max(0, Math.floor(F.cy - 1.3 * d)), x1 = Math.min(W, Math.ceil(F.cx + 1.5 * d)), y1 = Math.min(H, Math.ceil(F.cy + 1.9 * d));
      const w = x1 - x0, h = y1 - y0; if (w < 6 || h < 6) return null;
      const D = fig.cv.getContext('2d').getImageData(x0, y0, w, h).data, R = [], Gn = [], B = [];
      const bx0 = Math.min(F.A[0], F.B[0]) - 0.35 * d, bx1 = Math.max(F.A[0], F.B[0]) + 0.35 * d, by0 = Math.min(F.A[1], F.B[1]) - 0.12 * d, by1 = Math.max(F.A[1], F.B[1]) + 0.34 * d;
      for (let y = Math.max(y0, by0 | 0); y < Math.min(y1, by1); y++) for (let x = Math.max(x0, bx0 | 0); x < Math.min(x1, bx1); x++){ const i = ((y - y0) * w + (x - x0)) * 4;
        if (D[i + 3] > 200 && D[i] + D[i + 1] + D[i + 2] > 170){ R.push(D[i]); Gn.push(D[i + 1]); B.push(D[i + 2]); } }
      if (R.length < 12) return null;
      const mid = a => a.sort((p, q) => p - q)[a.length >> 1], r = mid(R), gg = mid(Gn), b = mid(B), L = r + gg + b, cr = r / L, cg = gg / L;
      if (Math.abs(cr - 1 / 3) < 0.028 && Math.abs(cg - 1 / 3) < 0.028) return null;
      const c = mk(), q = c.getContext('2d'), im = q.createImageData(w, h), O = im.data; let n = 0, nf = 0;
      for (let i = 0; i < D.length; i += 4){ if (D[i + 3] < 40) continue; nf++; const sm = D[i] + D[i + 1] + D[i + 2];
        if (sm > L * 0.42 && sm < L * 2.1 && Math.abs(D[i] / sm - cr) < 0.055 && Math.abs(D[i + 1] / sm - cg) < 0.04){ O[i] = O[i + 1] = O[i + 2] = O[i + 3] = 255; n++; } }
      if (n < nf * 0.14) return null;
      const t = mk(), tq = t.getContext('2d'); tq.putImageData(im, x0, y0);
      q.filter = 'blur(' + (0.06 * d + 0.3).toFixed(2) + 'px)'; for (let k = 0; k < 3; k++) q.drawImage(t, 0, 0); q.filter = 'none';      // soften, and close the small gaps (brows, lashes)
      { const im2 = q.getImageData(0, 0, W, H), P = im2.data;      // cut the blur's faint tail: Firefox's blur reaches about 3 px further than Chrome's and let marks onto steel (QA, ALLT PORT48)
        for (let i = 3; i < P.length; i += 4) P[i] = P[i] <= 72 ? 0 : Math.min(255, Math.round((P[i] - 72) * 255 / 183));
        q.putImageData(im2, 0, 0); }
      q.globalCompositeOperation = 'destination-in'; q.drawImage(fig.cv, 0, 0);
      A.skinned++;
      return {cv:c, eyes:fig.eyes, V:fig.V};
    } catch (e){ A.fails.skin = String(e && e.message || e); return null; }
  }
  A.skinMask = skinMask;
  function wounds(g, fig0, o){
    let fig = fig0;
    W = fig.cv.width; H = fig.cv.height;
    const F = G_('portFace')(fig.eyes), d = F.d, s = d / 22, a = F.A, b = F.B, cx = F.cx, cy = F.cy, seed = (fig.V && fig.V.seed) || 0, rnd = rng(seed * 7919 + 13);
    const sling0 = fig0; if (avoid){ const sk = skinMask(fig0, F); if (sk) fig = sk; }      // skin marks keep to bare skin; the sling and the eye patch are things, and sit on top
    const inj = o.inj || [], scars = Math.min(4, (o.scars || 0) + inj.filter(i => i !== 'eye').length);
    const masked = o.spec === 'SCOUNDREL', covered = ['SOLDIER', 'FOLK_HERO', 'SCOUNDREL', 'WITCH'].includes(o.spec);
    if (inj.includes('shell')) hollows(g, fig, F, s, true); else if (inj.includes('lung')) hollows(g, fig, F, s, false);
    if (inj.includes('arm')) sling(g, sling0);
    const T = [
      [[b[0] + 0.12 * d, b[1] - 0.22 * d], [b[0] + 0.30 * d, b[1] + 0.20 * d], [b[0] + 0.22 * d, b[1] + 0.70 * d]],
      [[a[0] - 0.14 * d, a[1] - 0.14 * d], [a[0] - 0.30 * d, a[1] + 0.26 * d], [a[0] - 0.16 * d, a[1] + 0.72 * d]],
      [[cx + 0.30 * d, cy - 0.04 * d], [cx + 0.42 * d, cy + 0.32 * d], [cx + 0.30 * d, cy + 0.80 * d]],
      [[a[0] - 0.05 * d, a[1] - 0.48 * d], [a[0] + 0.28 * d, a[1] - 0.33 * d], [a[0] + 0.62 * d, a[1] - 0.36 * d]]];
    const order = masked ? [0, 1, 3, 2] : covered ? [0, 1, 2, 3] : [0, 3, 1, 2];
    for (let i = 0; i < scars; i++) scar(g, fig, T[order[(i + (seed % 4)) % 4]], s, rnd);
    if (inj.includes('mana')) mana(g, fig, F, s, rnd);
    if (o.hurt) hurt(g, fig, F, s, rnd);
    if (inj.includes('eye')){
      const e = fig.eyes, P = (e[0] >= 0 && e[2] >= 0) ? ((fig.V && fig.V.eye) ? b : a) : (e[0] >= 0 ? [e[0], e[1]] : [e[2], e[3]]);
      eyePatch(g, fig0, P, P === a ? -1 : 1, d);
    }
    A.drawn++;
  }
  A.wounds = wounds;
  function hook(){
    /* Bug fixed here: the framed portrait was cached by a key that left out rest and scars, so a mate who was wounded,
       healed or newly scarred kept the old picture until something else changed. The state is now part of the key. */
    const fu = G_('framedURL');
    if (typeof fu === 'function'){
      window.__port48_framed = function(p, isLeader, v){
        try {
          if (p && G_('portHas')(p)){
            const hurt = p.resting > 0 && !p.trainingAt, scars = p.scars || 0;
            if (hurt || scars){
              const S = G_('SPECS'), fr = G_('cosm')().frame, col = S[p.spec] ? S[p.spec].color : '#6a5a44', b = v && v.b ? 1 : 0;
              const u = G_('portURL')('pp48:' + G_('personKey')(p, isLeader) + '|' + fr + '|' + b + '|' + (hurt ? 1 : 0) + '|' + scars, () => G_('portFramed')(p, isLeader, fr, col, b));
              if (u) return u;
            }
          }
        } catch (e){ A.fails.framed = String(e && e.message || e); }
        return fu(p, isLeader, v);
      };
      (0, eval)('framedURL = window.__port48_framed');
    } else A.fails.framed = 'no framedURL';
    /* INT-1 stage 3: the portWounds wrapper and the Chapter Master key fix (portURL 'pm1:') are folded into js/art/portraits.js. */
  }
  try { hook(); } catch (e){ A.fails.hook = String(e && e.message || e); }

  A.selfTest = function(){
    const out = {pass:0, fail:0, notes:[]}, ok = (c, n) => { if (c) out.pass++; else { out.fail++; out.notes.push(n); } };
    try {
      ok(typeof G_('portWoundsFlat') === 'function', 'portWounds folded into js/art/portraits.js');
      const P = G_('PORT'), dress = G_('portDressed');
      if (P && P.ok){
        const base = {race:'HUMAN', spec:'CLERIC', sex:'m', name:'T48', id:-48};
        const px = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const diff = (x, y) => { let n = 0; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 24) n++; return n; };
        const clean = px(dress(base, false).cv);
        for (const [n, st] of [['scars', {scars:2}], ['eye', {injuries:['eye']}], ['hurt', {resting:1}], ['arm', {injuries:['arm']}], ['mana', {injuries:['mana']}], ['shell', {injuries:['shell']}]]){
          const fig = dress(Object.assign({}, base, st), false), dd = px(fig.cv), n1 = diff(clean, dd);
          ok(n1 > 20, n + ' changes the picture (' + n1 + ')');
          let leak = 0; for (let i = 3; i < dd.length; i += 4) if (clean[i] === 0 && dd[i] !== 0) leak++;
          ok(leak === 0, n + ' stays on the painted figure (' + leak + ')');
        }
        ok(diff(clean, px(dress(Object.assign({}, base, {injuries:['knee']}), false).cv)) < 400, 'a knee shows as one scar at most');
        { // a made-up face: skin, with a steel nose guard down the middle and a steel brow band
          const c = document.createElement('canvas'); c.width = 144; c.height = 176; const q = c.getContext('2d');
          q.fillStyle = '#d8a888'; q.beginPath(); q.ellipse(72, 80, 40, 52, 0, 0, TAU); q.fill();
          q.fillStyle = '#8a8e94'; q.fillRect(66, 20, 12, 90); q.fillRect(30, 28, 84, 30);
          const run = av => { const c2 = document.createElement('canvas'); c2.width = 144; c2.height = 176; const g2 = c2.getContext('2d'); g2.drawImage(c, 0, 0); const was = avoid; avoid = av;
            try { wounds(g2, {cv:c, eyes:[58, 70, 86, 70], V:{seed:3}}, {scars:4, hurt:true, inj:['mana', 'shell'], spec:'SOLDIER'}); } finally { avoid = was; } return g2.getImageData(0, 0, 144, 176).data; };
          const b0 = px(c), on = run(true), off = run(false); let sOn = 0, sOff = 0, kOn = 0;
          for (let y = 0; y < 176; y++) for (let x = 0; x < 144; x++){ const i = (y * 144 + x) * 4, steel = b0[i] === 0x8a && b0[i + 3] === 255, dOn = Math.abs(on[i] - b0[i]) + Math.abs(on[i + 1] - b0[i + 1]) + Math.abs(on[i + 2] - b0[i + 2]) > 30, dOff = Math.abs(off[i] - b0[i]) + Math.abs(off[i + 1] - b0[i + 1]) + Math.abs(off[i + 2] - b0[i + 2]) > 30;
            const inner = steel && ((x > 68 && x < 75) || (y > 32 && y < 54 && (x < 62 || x > 82)));      // away from the soft edge
            if (inner && dOn) sOn++; if (inner && dOff) sOff++; if (!steel && dOn) kOn++; }
          ok(sOff > 10, 'without avoiding, marks cross the steel (' + sOff + ')');
          ok(sOn === 0, 'marks keep off a nose guard and a brow band (' + sOn + ')');
          ok(kOn > 40, 'marks still show on the skin (' + kOn + ')');
        }
        const fu = G_('framedURL'), u0 = fu(base, false), u1 = fu(Object.assign({}, base, {resting:1}), false), u2 = fu(Object.assign({}, base, {scars:1}), false);
        ok(u0 && u1 && u0 !== u1, 'the framed portrait changes when the person is hurt');
        ok(u0 && u2 && u0 !== u2 && u1 !== u2, 'the framed portrait changes with a new scar');
        { const M = G_('ensureMaster')(), s0 = M.scars; M.scars = 0; let k0 = '', k1 = ''; const mk = () => null;
          try { G_('portURL')('pm1:t48', mk); k0 = Object.keys(G_('PORT').urls).filter(k => /^pm(1|48):t48/.test(k)).join(); M.scars = 2; G_('portURL')('pm1:t48', mk); k1 = Object.keys(G_('PORT').urls).filter(k => /^pm(1|48):t48/.test(k)).join(); }
          finally { M.scars = s0; for (const k of Object.keys(G_('PORT').urls)) if (/^pm(1|48):t48/.test(k)) delete G_('PORT').urls[k]; }
          ok(k0 !== k1 && k1.split(',').some(k => k.indexOf('pm48:t48|') === 0 && k.split('|')[2] === '2'), 'the Chapter Master portrait key carries state'); }
      } else out.notes.push('paintings not loaded: picture tests skipped');
    } catch (e){ out.fail++; out.notes.push(String(e && e.message || e)); }
    return out;
  };
})();
