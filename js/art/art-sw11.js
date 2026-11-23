/* SW-11 Art (Patrick OK 2026-11-13). Loads last, after js/3d/vo3.js. INT-1 group 19: no switches.
   The Edelos wagon: a covered wagon a person could climb into. Body (bed and sides, wheels to rail) = one person (K.person 75), canopy a person
   and a half, an ox in the traces. One drawing for all three holdings: the barge and warehouse Edelos skins already resolve to the same
   facility ('edelos'), so they get it too. Painted at R = 2 like every VO3 sprite. */
(function(){
  'use strict';
  if (!window.VO3 || !VO3._int) return;
  const V = VO3, I = V._int, R = I.R, A = window.ART37 = {person: 51, last: {}};

  function paintWagon(v, se){
    const p = I.P(se), g0 = I.hx, rgb = I.rgb, rgba = I.rgba, mix = I.mix, mul = I.mul, lt = I.lit(), PERSON = (V.K && V.K.person) || 75, PERSON_CAMP = A.person;
    const plum = g0(se === 'winter' ? '#4e3a50' : '#5a3e58'), plumD = g0('#362634'), gold = g0('#a88a3a');
    const u = n => n * R, BODY = 75, TILT = 112, K = (PERSON_CAMP / 75);   // painted at the 75 px person scale, then reduced to the camp's figure (about 51 px)                      // rail height, canopy peak (screen px)
    const WL = 140, OXL = 110, pad = 14;                                                      // wagon body and ox lengths
    const c = I.mk(u(WL + OXL + pad * 2 + 8), u(TILT + 24)), g = c.getContext('2d'), by = c.height - u(6);
    const ox0 = u(pad), x0 = ox0 + u(OXL + 6), x1 = x0 + u(WL);                              // wagon from x0 (front, the ox end) to x1 (the back)
    const wy = by - u(22), yb = by - u(19), yt = by - u(BODY);                               // wheel centre, bed bottom, rail top
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const line = (x0_, y0_, x1_, y1_, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0_, y0_); g.lineTo(x1_, y1_); g.stroke(); };
    // ground shadow
    ell((x0 + x1) / 2, by - u(1), u(WL * 0.52), u(5), 'rgba(8,6,4,.34)');
    // ---- the ox in the traces (faces left) ----
    const oxc = g0(se === 'winter' ? '#3a3230' : '#4a382c'), oxl = mix(oxc, g0('#b09070'), 0.35), oxd = mul(oxc, 0.6), ox = ox0 + u(OXL * 0.52), oy = by - u(30); g.save(); g.translate(ox, by); g.scale(1.35, 1.35); g.translate(-ox, -by);
    for (const [dx, back] of [[-17, 1], [-7, 0], [14, 0], [23, 1]]){ const lx = ox + u(dx), top = oy + u(8); poly4(g, lx - u(3), top, lx + u(3), by - u(back ? 3 : 1), back ? rgb(oxd) : rgb(oxc)); ell(lx, by - u(back ? 3 : 1), u(3.6), u(2), rgb(g0('#1c1612'))); }   // four legs, hooves
    ell(ox + u(4), oy, u(28), u(14), rgb(oxc));                                              // barrel body
    ell(ox + u(4) + u(5 * lt), oy - u(3), u(22), u(8), rgba(oxl, 0.45));                      // lit back
    ell(ox - u(22), oy - u(4), u(10), u(11), rgb(mul(oxc, 1.05)));                          // shoulder hump and neck
    ell(ox - u(30), oy + u(3), u(8), u(7), rgb(oxc));                                        // head
    ell(ox - u(37), oy + u(6), u(4.5), u(3.4), rgb(mix(oxc, g0('#a07a64'), 0.55)));           // muzzle
    ell(ox - u(38), oy + u(5), u(1), u(1), rgb(g0('#1a0e0a')));                              // nostril
    ell(ox - u(30), oy - u(1.5), u(1.3), u(1.3), rgb(g0('#e8d8b0')));                        // eye
    line(ox - u(26), oy - u(3), ox - u(22), oy - u(9), rgb(g0('#d8cdb0')), u(2.6));          // horns
    line(ox - u(22), oy - u(9), ox - u(26), oy - u(13), rgb(g0('#d8cdb0')), u(2));
    poly4(g, ox - u(30), oy - u(2), ox - u(28), oy - u(5), rgb(oxd));                        // ear
    line(ox + u(30), oy - u(2), ox + u(33), oy + u(9), rgb(oxd), u(2));                      // tail
    ell(ox + u(33), oy + u(10), u(2), u(3), rgb(oxd));
    g.restore();
    // yoke and the pole to the wagon
    const hy = by - (by - oy) * 1.35;   // the yoke and pole sit on the scaled ox
    line(ox - u(34), hy - u(8), ox - u(16), hy - u(10), rgb(p.barkL), u(3));
    line(ox - u(16), hy - u(10), x0 + u(2), yb - u(2), rgb(p.bark), u(2.6));
    line(ox + u(16), hy + u(4), x0 + u(2), yb, rgba(p.barkD, 0.8), u(1.2));                  // the trace chain
    // ---- far wheels ----
    for (const wx of [x0 + u(16), x1 - u(18)]) ell(wx + u(2), wy, u(20), u(21), rgb(p.barkD));
    // ---- the body: plank side painted plum with gold trim, a lit rail ----
    g.fillStyle = rgb(mix(plum, p.timber, 0.35)); g.fillRect(x0, yt + u(2), x1 - x0, yb - yt - u(2));
    for (let y = yt + u(7); y < yb; y += u(6)) { g.fillStyle = rgba(plumD, 0.7); g.fillRect(x0, y, x1 - x0, u(1)); }
    g.fillStyle = rgba(gold, 0.85); g.fillRect(x0, yt + u(2), x1 - x0, u(2)); g.fillRect(x0, yb - u(3), x1 - x0, u(2));
    for (let i = 0; i < 5; i++){ const px = x0 + u(4) + i * (x1 - x0 - u(8)) / 4; g.fillStyle = rgb(p.barkD); g.fillRect(px - u(1.5), yt + u(2), u(3), yb - yt - u(2)); g.fillStyle = rgb(p.iron); g.fillRect(px - u(2), yt + u(10), u(4), u(2)); }
    g.fillStyle = rgba(I.cool(p.barkL, 0.3), 0.5); g.fillRect(x0, yt + u(2), x1 - x0, u(1.2));
    // painted lozenges on the side
    for (let i = 0; i < 5; i++){ const lx = x0 + u(18) + i * u(26), ly = (yt + yb) / 2 + u(1); poly(g, [[lx, ly - u(7)], [lx + u(6), ly], [lx, ly + u(7)], [lx - u(6), ly]], rgba(gold, 0.7)); poly(g, [[lx, ly - u(4)], [lx + u(3), ly], [lx, ly + u(4)], [lx - u(3), ly]], rgb(plumD)); }
    // ---- the driver's board at the front, a step, a lantern ----
    g.fillStyle = rgb(p.timber); g.fillRect(x0 - u(7), yt + u(4), u(11), u(3)); line(x0 - u(5), yt + u(7), x0 - u(5), yb - u(2), rgb(p.barkD), u(1.4));
    g.fillStyle = rgb(p.barkD); g.fillRect(x0 - u(3), yb + u(2), u(8), u(2)); g.fillRect(x0 - u(3), yb + u(9), u(8), u(2));   // two steps
    line(x0 - u(5), yt - u(2), x0 - u(5), yt + u(4), rgb(p.iron), u(1.2)); g.fillStyle = rgb(p.ember); g.fillRect(x0 - u(7), yt - u(8), u(4), u(5)); ell(x0 - u(5), yt - u(5), u(11), u(9), rgba(p.ember, 0.18));
    // ---- the tilt: a person and a half at the peak, hoops, plum stripes, a dark mouth at the back with a rolled flap ----
    const cxl = x0 + u(2), cxr = x1 - u(1), top = by - u(TILT);
    const tiltPath = () => { g.beginPath(); g.moveTo(cxl, yt + u(1)); g.bezierCurveTo(cxl + u(2), top - u(2), cxl + u(14), top, cxl + u(26), top); g.lineTo(cxr - u(26), top); g.bezierCurveTo(cxr - u(14), top, cxr - u(2), top - u(2), cxr, yt + u(1)); g.closePath(); };
    tiltPath(); g.fillStyle = rgb(mix(p.canvasL, g0('#b8a888'), 0.4)); g.fill();                  // sun-bleached duck
    g.save(); tiltPath(); g.clip();
    g.fillStyle = rgba(p.canvasD, 0.55); g.fillRect(cxl, top - u(2), u(18), by);                  // shade at the ox end (left)
    for (let i = 0; i <= 5; i++){ const hxp = cxl + u(9) + i * (cxr - cxl - u(18)) / 5; line(hxp, yt + u(1), hxp + u(1), top, rgba(p.canvasD, 0.5), u(1.3)); }   // hoops showing as folds
    g.fillStyle = rgba(plum, 0.85); for (let i = 0; i < 3; i++){ const sx = cxl + u(14) + i * (cxr - cxl - u(28)) / 2; g.fillRect(sx - u(2.5), top, u(5), yt - top + u(2)); }   // painted plum bands
    g.fillStyle = rgba(I.cool(g0('#f0e4c8'), 0.15), 0.42); g.fillRect(cxl + u(18), top, cxr - cxl - u(36), u(5));    // the ridge in the light
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(cxl, yt - u(1), cxr - cxl, u(2.4));               // the dark under the hem
    g.fillStyle = rgb(g0('#0c0a08')); g.beginPath(); g.ellipse(cxr - u(2), yt - (yt - top) * 0.45, u(6), (yt - top) * 0.42, 0, 0, Math.PI * 2); g.fill();   // the open back
    ell(cxr - u(3), yt - (yt - top) * 0.35, u(3), u(5), rgba(p.ember, 0.35));                      // a lamp glimmer inside
    g.strokeStyle = rgba(p.canvasL, 0.6); g.lineWidth = u(1.1); g.beginPath(); g.moveTo(cxr - u(2), top + u(3)); g.lineTo(cxr - u(2), yt - (yt - top) * 0.4); g.stroke();
    // ---- near wheels: iron tyre, dark felloe, spokes ----
    for (const wx of [x0 + u(14), x1 - u(20)]){
      g.strokeStyle = rgb(p.iron); g.lineWidth = u(2.6); g.beginPath(); g.ellipse(wx, wy, u(21), u(21), 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgb(p.barkD); g.lineWidth = u(2.4); g.beginPath(); g.ellipse(wx, wy, u(18.2), u(18.2), 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgb(mul(p.barkL, 0.85)); g.lineWidth = u(1.3); for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI + 0.25; g.beginPath(); g.moveTo(wx - Math.cos(a) * u(17), wy - Math.sin(a) * u(17)); g.lineTo(wx + Math.cos(a) * u(17), wy + Math.sin(a) * u(17)); g.stroke(); }
      g.fillStyle = rgb(p.iron); g.beginPath(); g.arc(wx, wy, u(3), 0, Math.PI * 2); g.fill();
      g.strokeStyle = rgba(mix(p.barkD, g0('#3a3026'), 0.5), 0.7); g.lineWidth = u(3); g.beginPath(); g.ellipse(wx, wy, u(21), u(21), 0, Math.PI * 0.25, Math.PI * 0.75); g.stroke();
    }
    // a bundle of cloth and a water cask roped to the back
    g.fillStyle = rgb(g0('#7a6a50')); g.fillRect(x1 - u(2), yb - u(2), u(10), u(8)); line(x1 - u(2), yb + u(1), x1 + u(8), yb + u(1), rgb(g0('#3a2a1a')), u(1));
    ell(x1 + u(4), yb - u(7), u(5), u(4.5), rgb(p.timber));
    const k = Math.min(1, K), c2 = I.mk(c.width * k, c.height * k), h = c2.getContext('2d'); h.imageSmoothingQuality = 'high'; h.drawImage(c, 0, 0, c2.width, c2.height);
    return {img: c2, ax: c2.width / 2, ay: by * k, s: 1 / R, shadow: null, tall: false, kind: 'wagon', _art37: true};
  }
  function poly4(g, xa, ya, xb, yb, col){ g.fillStyle = col; g.fillRect(Math.min(xa, xb), Math.min(ya, yb), Math.abs(xb - xa) || 2, Math.abs(yb - ya) || 2); }
  function poly(g, pts, fill){ g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = fill; g.fill(); }

  // INT-1 stage 3: VO3's V.sprite calls these two itself (the wrapper is folded into js/3d/vo3.js)
  A.wagon = function(v, se){
    const key = 'art37:ewagon:' + v + ':' + se + ':' + (V._int.light().dir.x.toFixed(2) + ',' + (+V._int.light().elev || 0).toFixed(2));
    return V.cache[key] || (V.cache[key] = paintWagon(v, se));
  };
  A.solid = sp => solid(sp);
  // SW-8 notes: gates and hill boulders get a dark silhouette line and a heavier foot so they read as solid at a glance
  const solidCache = new WeakMap();
  function solid(sp){
    const hit = solidCache.get(sp.img); if (hit) return hit;
    const w = sp.img.width, h = sp.img.height, c = V._int.mk(w, h), g = c.getContext('2d'), o = Math.max(1, Math.round(V._int.R * 1.6));
    try { g.filter = 'brightness(0.12)'; for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) g.drawImage(sp.img, dx, dy); g.filter = 'none'; } catch (e) { g.filter = 'none'; }
    g.drawImage(sp.img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, h * 0.55, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,8,10,.34)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const out = Object.assign({}, sp, {img: c, _solid: true}); solidCache.set(sp.img, out); return out;
  }

  /* ---- 2. the mage tower: three storeys, windows offset per storey, the orb on top. The door is the old one (26 x 60). Fort only: the barge and warehouse keep the OA27 teleport circle. ---- */
  A.paintTower = function(h){
    const {g, rect, ell, line, poly, courses, plankDoor, p, L, R, cx, by, mix, mul, rgb, rgba, hx, r, w} = h, dk = h.light().elev < 0.5;
    const base = by - 4 * R, tiers = [[64, 72], [56, 38], [48, 34]];   // [width, height] in screen px, bottom to top
    let y = base, top = base, lastW = 64;
    // plinth (as before)
    rect(cx - 32 * R - 5 * R, by - 18 * R, 64 * R + 10 * R, 14 * R, rgb(mix(p.stone, p.stoneD, 0.3))); for (let i = 0; i < 6; i++) rect(cx - 37 * R + i * 74 * R / 6 + 0.6 * R, by - 17.4 * R, 74 * R / 6 - 1.2 * R, 6 * R, rgb(mul(p.stone, 0.8 + r() * 0.25)));
    tiers.forEach(([tw, th], ti) => {
      const bw = tw * R, bh = th * R, x0 = cx - bw / 2, y0 = y - bh + (ti ? 0 : 14 * R);   // tier 0 starts on the plinth top
      const hh = ti ? bh : bh - 14 * R;
      courses(x0, y0, bw, hh, 7 * R, 16 * R);
      for (let i = 0; i < 4; i++){ const a = 0.1 + i * 0.12, ww = 4 * R; rect(x0 + i * ww, y0, ww, hh, rgba(p.stoneD, L > 0 ? a + 0.12 : a * 0.5)); rect(x0 + bw - (i + 1) * ww, y0, ww, hh, rgba(p.stoneD, L > 0 ? a * 0.5 : a + 0.12)); }
      rect(x0 + bw * (L > 0 ? 0.6 : 0.25), y0, bw * 0.15, hh, rgba(p.stoneL, 0.12));
      // a corbelled ledge on top of each tier, wider than the wall
      const ly = y0 - 3 * R; rect(x0 - 4 * R, ly, bw + 8 * R, 4 * R, rgb(mix(p.stone, p.stoneD, 0.25))); rect(x0 - 4 * R, ly, bw + 8 * R, R, rgba(p.stoneL, 0.45)); rect(x0 - 3 * R, ly + 4 * R, bw + 6 * R, 1.5 * R, rgba(hx('#0c0a08'), 0.4));
      if (ti < 2) y = y0 - 3 * R; else top = y0 - 3 * R;
      lastW = tw;
      // windows: one per storey, alternating sides (storey 1 left of the door, 2 right, 3 left); the top one lit
      const wx = cx + [-22, 12, -10][ti] * R, wy = y0 + [20, 8, 6][ti] * R, ww2 = [7, 8, 9][ti] * R, wh2 = [18, 17, 18][ti] * R;
      rect(wx - ww2 / 2 - 1.5 * R, wy - 1.5 * R, ww2 + 3 * R, wh2 + 3 * R, rgb(p.stoneD));
      const lit = ti === 2 || (dk && ti === 1);
      rect(wx - ww2 / 2, wy, ww2, wh2, lit ? rgb(hx('#9a7a40')) : rgb(hx('#100e0c')));
      if (lit){ rect(wx - ww2 / 2, wy, ww2, wh2 * 0.5, rgba(hx('#c09a58'), 0.5)); ell(wx, wy + wh2 / 2, ww2 * 2.2, wh2 * 0.9, rgba(hx('#a8863c'), dk ? 0.22 : 0.12)); }
      line(wx, wy, wx, wy + wh2, rgb(p.iron), 0.8 * R); line(wx - ww2 / 2, wy + wh2 / 2, wx + ww2 / 2, wy + wh2 / 2, rgb(p.iron), 0.7 * R);
    });
    // the door, unchanged (Patrick: do not change it)
    { const dx = cx + 2 * R, dw = 26 * R, dh = 60 * R, dt = by - 4 * R - dh; poly(g, [[dx - dw / 2 - 3 * R, dt + dh], [dx - dw / 2 - 3 * R, dt + 10 * R], [dx - dw / 2 + 2 * R, dt - 4 * R], [dx, dt - 7 * R], [dx + dw / 2 - 2 * R, dt - 4 * R], [dx + dw / 2 + 3 * R, dt + 10 * R], [dx + dw / 2 + 3 * R, dt + dh]], rgb(p.stoneD)); plankDoor(dx, dt, dw, dh, true); ell(dx, by - 3 * R, dw * 0.8, 2.5 * R, rgb(mix(p.stoneL, p.stone, 0.5))); ell(dx, by - R, dw * 0.9, 2 * R, rgba(p.stoneL, 0.5)); }
    for (let i = 0; i < 6; i++) ell(cx - 32 * R + r() * 64 * R, by - 6 * R - r() * 12 * R, (3 + r() * 3) * R, (2 + r() * 3) * R, rgba(p.moss, 0.45));
    // the roof: a steeper cone on the top tier
    const x0 = cx - lastW * R / 2, bw = lastW * R, ry = top - R, rw = bw + 14 * R, rh = 36 * R;
    rect(x0 - 7 * R, ry - 3 * R, rw, 4 * R, rgb(mix(p.slate, hx('#0c0a08'), 0.4))); poly(g, [[x0 - 7 * R, ry - 2 * R], [x0 + bw + 7 * R, ry - 2 * R], [cx, ry - rh]], rgb(p.slate)); poly(g, L > 0 ? [[cx, ry - 2 * R], [x0 + bw + 7 * R, ry - 2 * R], [cx, ry - rh]] : [[x0 - 7 * R, ry - 2 * R], [cx, ry - 2 * R], [cx, ry - rh]], rgba(p.slateL, 0.14));
    for (let i = 1; i < 7; i++) line(x0 - 7 * R + rw * i / 7, ry - 2 * R, cx, ry - rh, rgba(hx('#0c0a08'), 0.35), 0.8 * R); for (let j = 1; j < 5; j++){ const t = j / 5; line(x0 - 7 * R + rw * 0.5 * t, ry - 2 * R - (rh - 2 * R) * t, x0 + bw + 7 * R - rw * 0.5 * t, ry - 2 * R - (rh - 2 * R) * t, rgba(p.slateL, 0.2), 0.7 * R); }
    if (w) poly(g, [[x0 - 7 * R + rw * 0.2, ry - 2 * R - rh * 0.4], [x0 + bw + 7 * R - rw * 0.2, ry - 2 * R - rh * 0.4], [cx, ry - rh]], rgba(p.snow, 0.8));
    // the orb: an iron cradle on the finial, a glass sphere with a cold glow (stronger at dusk)
    const oy = ry - rh - 14 * R; line(cx, ry - rh, cx, oy + 4 * R, rgb(p.iron), 1.4 * R);
    for (const s of [-1, 1]) line(cx + s * 7 * R, oy - 2 * R, cx, oy + 6 * R, rgb(p.iron), 1.2 * R);
    ell(cx, oy, 15 * R, 15 * R, rgba(hx('#7a9ae0'), dk ? 0.22 : 0.1));
    const gr = g.createRadialGradient(cx - 2 * R, oy - 2 * R, R, cx, oy, 7 * R); gr.addColorStop(0, 'rgba(236,244,255,.98)'); gr.addColorStop(0.45, 'rgba(120,160,235,.95)'); gr.addColorStop(1, 'rgba(40,60,130,.95)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, oy, 7 * R, 0, Math.PI * 2); g.fill(); g.strokeStyle = rgb(p.iron); g.lineWidth = 0.9 * R; g.stroke();
    ell(cx - 2.5 * R, oy - 2.5 * R, 1.8 * R, 1.2 * R, 'rgba(255,255,255,.8)');
  };

  // cells: a barred window beside the door and a pair of stocks out front (door size is set in vo3's cells branch)
  A.paintCells = function(h){
    const {g, rect, ell, line, poly, post, p, R, cx, by, W, mix, mul, rgb, rgba, hx} = h;
    // barred window, left of the door, set into the stone block
    const wx = cx + W * 0.007, wy = by - 4 * R - 84 * R;
    rect(wx - 9 * R, wy - 1.5 * R, 18 * R, 22 * R, rgb(p.stoneD));
    rect(wx - 7.5 * R, wy, 15 * R, 19 * R, rgb(hx('#0e0c0a')));
    for (let b = 0; b < 5; b++) rect(wx - 6 * R + b * 3 * R, wy, 1.3 * R, 19 * R, rgb(p.iron));
    rect(wx - 7.5 * R, wy + 6 * R, 15 * R, 1.3 * R, rgb(p.iron)); rect(wx - 7.5 * R, wy + 13 * R, 15 * R, 1.3 * R, rgb(p.iron));
    rect(wx - 10 * R, wy + 19.5 * R, 20 * R, 2 * R, rgba(p.stoneL, 0.45));
    // the stocks: two posts, a hinged board with three holes, a step
    const sx = cx - W * 0.24, sy = by + 8 * R;
    rect(sx - 15 * R, sy - 2 * R, 30 * R, 2.5 * R, rgb(p.barkD));
    for (const d of [-13, 13]) post(sx + d * R, sy - 26 * R, sy, 2 * R);
    rect(sx - 15 * R, sy - 17 * R, 30 * R, 3.2 * R, rgb(p.bark)); rect(sx - 15 * R, sy - 11 * R, 30 * R, 3.2 * R, rgb(mix(p.bark, p.barkD, 0.4)));
    for (const d of [-8, 0, 8]) { ell(sx + d * R, sy - 13.5 * R, 3.1 * R, 3.3 * R, rgb(hx('#100e0c'))); }
    rect(sx + 13.5 * R, sy - 15 * R, 2.5 * R, 4 * R, rgb(p.iron));
    rect(sx - 15 * R, sy - 17 * R, 30 * R, R, rgba(p.barkL, 0.35));
  };
  // kitchen: a woodpile, a heavier always-lit chimney smoke, the hams on a drying pole beside the pot (no longer under the eave)
  A.paintKitchen = function(h){
    const {g, rect, ell, line, poly, post, p, L, R, cx, by, W, mix, rgb, rgba, hx, r, x, top} = h;
    for (let i = 0; i < 6; i++){ const t = i / 6; ell(x + (r() - 0.5) * 5 * R + t * 14 * R * L, top - 14 * R - t * 30 * R, (4 + t * 8) * R, (3 + t * 5) * R, rgba(hx('#9a968e'), 0.3 * (1 - t))); }
    // woodpile, three tiers of split logs on two stakes
    const wx = cx + W * 0.54, wy = by + 2 * R;
    ell(wx, wy, 17 * R, 3 * R, rgba(hx('#0c0a08'), 0.3));
    for (let row = 0; row < 3; row++){ const n = 5 - row; for (let i = 0; i < n; i++){ const lx = wx - (n - 1) * 3.4 * R + i * 6.8 * R, ly = wy - 2.6 * R - row * 5.4 * R; ell(lx, ly, 3.4 * R, 2.8 * R, rgb(mix(p.bark, p.barkD, (i + row) % 3 / 3))); ell(lx, ly, 2 * R, 1.6 * R, rgb(mix(p.thatchL, p.bark, 0.45))); } }
    for (const d of [-18, 18]) line(wx + d * R, wy, wx + d * R, wy - 19 * R, rgb(p.barkD), 1.6 * R);
    // a drying pole with hams and a string of onions
    const px = cx - W * 0.1, pw = 15 * R, pt = by - 40 * R;
    for (const d of [-1, 1]) post(px + d * pw, pt, by + R, 1.5 * R);
    line(px - pw - 2 * R, pt + R, px + pw + 2 * R, pt + R, rgb(p.bark), 2 * R);
    for (let i = 0; i < 3; i++){ const hx2 = px - pw * 0.6 + i * pw * 0.6; line(hx2, pt + R, hx2, pt + 6 * R, rgb(hx('#6a5a44')), 0.8 * R); ell(hx2, pt + 13 * R, 3.4 * R, 7 * R, rgb(hx('#4a2e22'))); ell(hx2 - 1.1 * R * L, pt + 11 * R, 1.3 * R, 3.6 * R, rgba(hx('#8a5a46'), 0.5)); }
    for (let i = 0; i < 4; i++) ell(px + pw * 0.7 + (i & 1) * 1.6 * R, pt + 5 * R + i * 3.6 * R, 2.3 * R, 2.1 * R, rgb(hx('#b08a4a')));
  };
  // barge and warehouse: hammocks under a tarp (replacing tents and huts), a raised galley with a flue and pot, pelts and a bow rack on the ranger ladder, a side face and stakes on the barricade
  A.paintHammocks = function(h){
    const {g, rect, ell, line, poly, post, p, L, R, cx, by, W, mix, mul, rgb, rgba, hx, r} = h;
    ell(cx, by - 3 * R, W * 0.4, 7 * R, rgba(hx('#0c0a08'), 0.28));
    const tw = W * 0.4;
    for (const [dx, hgt] of [[-tw, 52], [tw, 52], [-tw * 0.1, 62]]) post(cx + dx, by - hgt * R, by - 2 * R, 1.6 * R);
    for (const [y0, dy, col] of [[by - 36 * R, 9, hx('#8a7a5a')], [by - 20 * R, 8, hx('#6a5a46')]]){
      const xa = cx - tw + 2 * R, xb = cx + tw - 2 * R;
      g.fillStyle = rgb(col); g.beginPath(); g.moveTo(xa, y0); g.quadraticCurveTo(cx, y0 + dy * 2.2 * R, xb, y0); g.quadraticCurveTo(cx, y0 + dy * 1.2 * R, xa, y0); g.closePath(); g.fill();
      g.strokeStyle = rgba(p.barkD, 0.8); g.lineWidth = 1.1 * R; g.beginPath(); g.moveTo(xa, y0); g.quadraticCurveTo(cx, y0 + dy * 2.2 * R, xb, y0); g.stroke();
      ell(cx - tw * 0.35, y0 + dy * 0.7 * R, 7 * R, 2.2 * R, rgb(mix(col, hx('#d8c8a0'), 0.4)));
      line(xa - 2 * R, y0 - 3 * R, xa, y0, rgb(hx('#4a3a2a')), R); line(xb + 2 * R, y0 - 3 * R, xb, y0, rgb(hx('#4a3a2a')), R);
    }
    const tc = hx('#5a6a52');
    poly(g, [[cx - tw - 8 * R, by - 52 * R], [cx + tw + 8 * R, by - 52 * R], [cx + tw + 4 * R, by - 62 * R], [cx - tw - 4 * R, by - 62 * R]], rgb(tc));
    poly(g, [[cx - tw - 8 * R, by - 52 * R], [cx + tw + 8 * R, by - 52 * R], [cx + tw + 8 * R, by - 49 * R], [cx - tw - 8 * R, by - 49 * R]], rgba(hx('#0c0a08'), 0.35));
    for (let i = 1; i < 5; i++) line(cx - tw - 6 * R + i * (tw * 2 + 12 * R) / 5, by - 61 * R, cx - tw - 7 * R + i * (tw * 2 + 14 * R) / 5, by - 52 * R, rgba(hx('#0c0a08'), 0.22), R);
    ell(cx + tw * 0.2, by - 56 * R, 6 * R, 2.4 * R, rgba(hx('#7a8a6a'), 0.35));
    rect(cx + W * 0.28, by - 9 * R, 14 * R, 9 * R, rgb(p.bark)); rect(cx + W * 0.28, by - 9 * R, 14 * R, 1.6 * R, rgb(p.iron)); rect(cx + W * 0.28, by - 5 * R, 14 * R, 1.2 * R, rgb(p.iron));
  };
  A.post = function(kind, h){
    const {g, rect, ell, line, poly, post, p, L, R, cx, by, W, mix, mul, rgb, rgba, hx, r, smoke} = h;
    if (kind === 'b_galley' || kind === 'w_galley'){
      const sw = 56 * R, sh = 34 * R, x0 = cx - sw / 2 - 10 * R, y0 = by - 4 * R - sh;
      rect(x0 - 5 * R, by - 11 * R, sw + 10 * R, 8 * R, rgb(mix(p.stone, p.stoneD, 0.35))); rect(x0 - 5 * R, by - 11 * R, sw + 10 * R, 1.5 * R, rgba(p.stoneL, 0.5));
      for (let i = 0; i < 5; i++) line(x0 - 5 * R + i * (sw + 10 * R) / 5, by - 11 * R, x0 - 5 * R + i * (sw + 10 * R) / 5, by - 3 * R, rgba(p.stoneD, 0.7), R);
      const px = x0 + sw * 0.75; rect(px - 3.5 * R, y0 - 30 * R, 7 * R, 31 * R, rgb(mix(p.iron, p.stoneL, 0.15))); rect(px - 5 * R, y0 - 33 * R, 10 * R, 4 * R, rgb(p.iron)); rect(px - 3.5 * R + (L > 0 ? 0 : 4.5 * R), y0 - 30 * R, 2.5 * R, 31 * R, rgba(p.stoneL, 0.25)); if (smoke) smoke(px, y0 - 34 * R, 8);
      const gx = x0 + sw + 12 * R, gy = by - 4 * R; ell(gx, gy, 9 * R, 2.4 * R, rgba(hx('#0c0a08'), 0.3)); ell(gx, gy - 6 * R, 8 * R, 6.5 * R, rgb(p.iron)); ell(gx, gy - 11 * R, 8 * R, 2.4 * R, rgb(mix(p.iron, p.stoneL, 0.3))); ell(gx, gy - 11 * R, 6 * R, 1.6 * R, rgb(hx('#2a2a24'))); line(gx - 7 * R, gy - 11 * R, gx + 7 * R, gy - 15 * R, rgb(p.bark), 1.4 * R);
    } else if (kind === 'w_ladder'){
      const top = by - 140 * R;
      for (let i = 0; i < 3; i++){ const x = cx - W * 0.36 + i * 16 * R, len = (16 + (i * 5) % 9) * R, c1 = [hx('#8a6a46'), hx('#6a5440'), hx('#9a8a74')][i];
        line(x, top + 7 * R, x, top + 10 * R, rgb(p.barkD), R); poly(g, [[x - 5 * R, top + 9 * R], [x + 5.5 * R, top + 9 * R], [x + 6 * R, top + 9 * R + len * 0.6], [x + 3 * R, top + 9 * R + len], [x, top + 9 * R + len * 0.7], [x - 4 * R, top + 9 * R + len], [x - 6 * R, top + 9 * R + len * 0.5]], rgb(c1)); ell(x + 1.2 * R * L, top + 9 * R + len * 0.35, 1.6 * R, len * 0.25, rgba(hx('#e8d8b8'), 0.2)); }
      const rx = cx + W * 0.2, ry = by - 2 * R; post(rx - 9 * R, ry - 34 * R, ry, 1.4 * R); post(rx + 9 * R, ry - 34 * R, ry, 1.4 * R); line(rx - 11 * R, ry - 32 * R, rx + 11 * R, ry - 32 * R, rgb(p.bark), 1.8 * R); line(rx - 11 * R, ry - 14 * R, rx + 11 * R, ry - 14 * R, rgb(p.bark), 1.5 * R);
      for (let i = 0; i < 3; i++){ const bxx = rx - 6 * R + i * 6 * R; g.strokeStyle = rgb(mix(p.bark, p.thatchL, 0.25)); g.lineWidth = 1.5 * R; g.lineCap = 'round'; g.beginPath(); g.moveTo(bxx, ry - 31 * R); g.quadraticCurveTo(bxx + 5 * R, ry - 22 * R, bxx, ry - 13 * R); g.stroke(); line(bxx, ry - 31 * R, bxx, ry - 13 * R, rgba(hx('#e8d8b8'), 0.7), 0.5 * R); }
    } else if (kind === 'w_barricade'){
      const dw = 70 * R, dh = 96 * R, x0 = cx - dw / 2, y0 = by - 4 * R - dh, xr = x0 + dw + 8 * R, sd = 15 * R;
      poly(g, [[xr, y0 - 8 * R], [xr + sd, y0 - 14 * R], [xr + sd, by - 11 * R], [xr, by - 4 * R]], rgb(mul(p.stoneD, 0.8)));
      for (let yy = 0; yy < 5; yy++) line(xr, y0 - 8 * R + yy * 20 * R, xr + sd, y0 - 14 * R + yy * 20 * R, rgba(hx('#0c0a08'), 0.35), R);
      poly(g, [[x0 - 8 * R, y0 - 8 * R], [xr, y0 - 8 * R], [xr + sd, y0 - 14 * R], [x0 - 8 * R + sd, y0 - 14 * R]], rgb(mix(p.stone, p.stoneL, 0.2)));
      for (let i = 0; i < 7; i++){ const x = x0 - 4 * R + i * (dw + 8 * R) / 6, lean = (i % 2 ? 3 : -3) * R; poly(g, [[x - 2.4 * R, by + 3 * R], [x + 2.4 * R, by + 3 * R], [x + lean + 2 * R, by - 26 * R], [x + lean * 1.4, by - 36 * R], [x + lean - 2 * R, by - 26 * R]], rgb(mix(p.bark, p.barkD, i % 3 / 3))); line(x + lean * 1.4, by - 36 * R, x + lean * 1.3, by - 28 * R, rgba(p.barkL, 0.45), R); }
    }
  };

  A.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const w = V.sprite('wagon', 1, 'summer', {edelos: 1}), s = V.sprite('wagon', 1, 'summer'), PERSON = (V.K && V.K.person) || 75;
    ok('the Edelos wagon paints and the plain wagon is untouched', w && w._art37 && s && !s._art37);
    ok('canopy peaks between 1.3 and 1.7 camp persons (51 px)', w && w.ay / R >= A.person * 1.3 && w.ay / R <= A.person * 1.9);
    ok('it is wider than the plain wagon (the ox is in the traces)', w && s && w.img.width > s.img.width);
    const f = V.sprite('fac', 0, 'summer', {k: 'edelos'}); ok('the Edelos facility paints with it', !!f);
    {
      const bad = [];
      for (const [k, o] of [['magetower', {}], ['cells', {}], ['kitchen', {}], ['tavern', {}], ['tents', {deck: 1}], ['huts', {deck: 1}], ['b_galley', {}], ['w_galley', {}], ['w_ladder', {}], ['w_barricade', {}]]){ let sp = null; try { sp = V.sprite('fac', 0, 'summer', Object.assign({k, dmg: 0, ruin: 0}, o)); } catch (e) { bad.push(k + ':' + e.message); } if (!sp || !sp.img) bad.push(k); }
      ok('every SW-11 facility paints' + (bad.length ? ' (' + bad.join(',') + ')' : ''), !bad.length);
      const bo = V.sprite('boulder', 0, 'summer', {}); ok('solid outline marks boulders', bo && bo._solid);
    }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, details: out};
  };
})();
