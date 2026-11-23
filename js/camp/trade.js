/* ===== INDEX T29: trade shells, "a house with a decal" (Patrick, 2026-11-12, feedback theme 4) ================
   Patrick: barracks, armoury, blacksmith, leather and alchemy "look like a house with a decal"; each wants a
   silhouette of its own. This file paints those five shells; facility() in js/3d/vo3.js takes them in place of the
   inner house through the sprite kind 'tshell' (S() swaps the kind when VO3.K.trade[kind] is set) and keeps each
   yard's own props (racks, crates, anvil, hide frames, still, herbs):
   - barracks: a long flat-roofed hall with a stone parapet and merlons, slit windows, a wide plank door;
   - armoury: a small front-gabled warehouse, wide double doors under a shield and crossed spears, a hoist beam;
   - blacksmith: an open-front smithy, the forge glowing at the back wall under its hood, a big stone chimney
     the yard's smoke leaves from (sp.chim), half walls and heavy posts;
   - leather: a lean-to on four posts with a planked back wall, hides hanging from the front beam (no house);
   - alchemy: a round plaster hut under a tall thatch cone, a round window of coloured bottles, smoke from the apex.
   Every shell has its lit side toward the light (the F28 standard) and its windows glow at dusk.
   Load after facade28.js. No switch (T29.on was removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  if (!window.VO3 || !VO3.K || !VO3._int) return;
  const I = VO3._int, R = I.R, hx = I.hx, mix = I.mix, mul = I.mul, rgb = I.rgb, rgba = I.rgba, poly = I.poly, mk = I.mk, rng = I.rng, hsh = I.hsh, light = I.light, lit = I.lit;
  const T = window.T29 = {K: {barracks: 1, armoury: 1, blacksmith: 1, leather: 1, alchemy: 1}};
  T.apply = function(){ VO3.K.trade = Object.assign({}, T.K); if (VO3.cache) for (const k in VO3.cache) if (k.startsWith('fac:') || k.startsWith('tshell:')) delete VO3.cache[k]; if (typeof CAMP !== 'undefined' && CAMP) CAMP.dirty = true; if (VO3.layers) VO3.layers = null; };
  T.apply();
  const DK = hx('#0c0a08');
  T.shell = function(v, se, o){
    o = o || {}; const kind = o.k; if (!T.K[kind]) return null;
    const F = VO3.K.facade || null, p = Object.assign(I.P(se), F && F.pal ? Object.fromEntries(Object.entries(F.pal).map(([k, c]) => [k, hx(c)])) : {});
    const r = rng(hsh(v * 53 + 9, kind.length * 77 + kind.charCodeAt(1) * 5)), L = lit(), Lc = hx(light().colour), dusk = light().elev < 0.5, w = se === 'winter';
    const C = I.CELLW() * R, over = VO3.K.overhang * R, HW = VO3.K.wallH * R * (o.wall || 1), dh = (o.door || 82) * R, dw = (o.dw || 36) * R, sideLit = F ? F.sideLit : 0.1;
    const rk = F && F.roof && F.roof[kind], roofC = rk ? hx(rk[0]) : p.shingle, roofL = rk ? hx(rk[1]) : p.shingleL, sideC = mix(p.plaster, Lc, sideLit), foot = 13 * R;
    let g, c; const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    const rect = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    // the box: a front face W wide and H tall, the side face receding toward the light (the house painter's three-quarter)
    const box = (W, H, extraTop) => { const SD = Math.min(Math.max(W * 0.6, C) * 0.6, 80 * R), SY = SD * 0.55, ox = L * SD, oy = -SY; c = mk(W + over * 2 + SD + 10 * R, H + SY + (extraTop || 0) + 10 * R); g = c.getContext('2d');
      const x0 = over + 5 * R + (L < 0 ? SD : 0), by = c.height - 4 * R, ye = by - H, xe = L > 0 ? x0 + W : x0; return {W, H, SD, SY, ox, oy, x0, by, ye, xe}; };
    const sideWall = (B, H) => { const xe = B.xe, by = B.by, ox = B.ox, oy = B.oy, ye = by - (H || B.H); poly(g, [[xe, by], [xe + ox, by + oy], [xe + ox, ye + oy], [xe, ye]], rgb(sideC));
      g.save(); g.beginPath(); g.moveTo(xe, by); g.lineTo(xe + ox, by + oy); g.lineTo(xe + ox, ye + oy); g.lineTo(xe, ye); g.closePath(); g.clip();
      for (let i = 0; i < 5; i++){ const t = r(), x = xe + ox * t; rect(x, ye + oy * t, (2 + r() * 4) * R, (by - ye) * (0.3 + r() * 0.6), rgba(DK, 0.3)); }
      poly(g, [[xe, by], [xe + ox, by + oy], [xe + ox, by + oy - foot], [xe, by - foot]], rgb(mul(p.stone, 0.72)));
      for (let i = 1; i < 3; i++){ const t = i / 3; rect(xe + ox * t - 1.4 * R, ye + oy * t, 2.8 * R, (by - ye) - foot, rgb(mul(p.timber, 0.7))); }
      const sg = g.createLinearGradient(xe, 0, xe + ox, 0); sg.addColorStop(0, 'rgba(255,236,190,.16)'); sg.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = sg; g.fillRect(Math.min(xe, xe + ox), ye + oy, Math.abs(ox), by - ye - oy); g.restore(); };
    const frontWall = (B, H, bays) => { const x0 = B.x0, W = B.W, by = B.by, ye = by - (H || B.H); rect(x0, ye, W, by - ye, rgb(p.plasterD)); rect(x0, ye + (by - ye) * 0.35, W, (by - ye) * 0.65, rgb(p.plaster));
      for (let i = 0; i < 6; i++){ const x = x0 + r() * W; rect(x, ye, (2 + r() * 5) * R, (by - ye) * (0.4 + r() * 0.6), rgba(p.plasterD, 0.5)); }
      rect(x0, by - foot, W, foot, rgb(p.stone)); for (let x = x0; x < x0 + W; x += (10 + r() * 8) * R){ rect(x, by - foot, 1.6 * R, foot, rgba(p.stoneD, 0.8)); rect(x + 2 * R, by - foot + 2 * R, 6 * R, 2 * R, rgba(p.stoneL, 0.35)); }
      bays = bays || 3; for (let i = 0; i <= bays; i++) rect(x0 + i * W / bays - 1.6 * R, ye, 3.2 * R, by - ye - foot, rgb(p.timber)); rect(x0, ye + (by - ye) * 0.35, W, 3 * R, rgb(p.timber));
      const sh = g.createLinearGradient(0, ye, 0, ye + (by - ye) * 0.4); sh.addColorStop(0, 'rgba(0,0,0,.5)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(x0, ye, W, (by - ye) * 0.4);
      const wg = g.createLinearGradient(L > 0 ? x0 : x0 + W, 0, L > 0 ? x0 + W : x0, 0); wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(10,14,24,.38)'); g.fillStyle = wg; g.fillRect(x0, ye, W, by - ye);
      const bg = g.createLinearGradient(0, by - 14 * R, 0, by); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = bg; g.fillRect(x0, by - 14 * R, W, 14 * R); };   /* SW-4: stays on the front wall */
    const door = (x, wd, hd, by, seam) => { rect(x - wd / 2 - 2 * R, by - hd - 2 * R, wd + 4 * R, hd + 2 * R, rgb(p.timber)); rect(x - wd / 2, by - hd, wd, hd, rgb(mul(p.timber, 0.55))); for (let i = 1; i < 6; i++) rect(x - wd / 2 + wd * i / 6, by - hd, 0.8 * R, hd, rgba(DK, 0.5));
      if (seam) rect(x - 0.9 * R, by - hd, 1.8 * R, hd, rgb(DK)); for (const t of [0.78, 0.25]) for (const s of (seam ? [-1, 1] : [1])) rect(seam ? x + (s < 0 ? -wd / 2 + 2 * R : 2 * R) : x - wd / 2 + 2 * R, by - hd * t, seam ? wd / 2 - 4 * R : wd * 0.7, 2.2 * R, rgba(p.iron, 0.9)); rect(x + (seam ? -4 * R : wd / 2 - 7 * R), by - hd * 0.48, 3 * R, 3 * R, rgb(p.iron)); };
    const win = (x, y, ww, wh) => { rect(x - ww / 2 - 2 * R, y - 2 * R, ww + 4 * R, wh + 4 * R, rgb(p.timber)); if (dusk){ ell(x, y + wh / 2, ww * 1.6, wh, rgba(p.window, 0.16)); rect(x - ww / 2, y, ww, wh, rgb(p.window)); rect(x - ww / 2, y, ww / 2, wh, rgba(mix(p.window, p.ember, 0.3), 0.4)); } else { rect(x - ww / 2, y, ww, wh, rgb(hx('#0e1012'))); rect(x - ww / 2, y, ww / 2, wh * 0.5, rgba(p.window, 0.18)); } rect(x - 0.5 * R, y, R, wh, rgb(p.timber)); };
    const planks = (x0, y0, bw, bh, col, ph) => { ph = ph || 7 * R; rect(x0, y0, bw, bh, rgb(col)); for (let yy = ph; yy < bh; yy += ph) line(x0, y0 + yy, x0 + bw, y0 + yy, rgba(DK, 0.3), 0.8 * R); rect(x0, y0, bw, R, rgba(p.barkL, 0.35)); };
    const litBand = (x0, x1, y0, y1) => { const lg = g.createLinearGradient(L > 0 ? x0 : x1, 0, L > 0 ? x1 : x0, 0); lg.addColorStop(0, 'rgba(255,236,190,.22)'); lg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = lg; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); };
    let ax, ay, chim = null;
    if (kind === 'barracks'){
      // a long hall, the roof flat behind a stone parapet with merlons; slits, not windows; one wide door
      const W = 2 * C + 30 * R, H = HW, B = box(W, H, 18 * R), x0 = B.x0, by = B.by, ye = B.ye, ox = B.ox, oy = B.oy, xe = B.xe;
      sideWall(B); frontWall(B, 0, 4);
      // the flat roof: tar and planks seen from above, lighter toward the light
      poly(g, [[x0 - 3 * R, ye], [x0 + W + 3 * R, ye], [x0 + W + 3 * R + ox, ye + oy], [x0 - 3 * R + ox, ye + oy]], rgb(mul(roofC, 0.85)));
      g.save(); g.beginPath(); g.moveTo(x0 - 3 * R, ye); g.lineTo(x0 + W + 3 * R, ye); g.lineTo(x0 + W + 3 * R + ox, ye + oy); g.lineTo(x0 - 3 * R + ox, ye + oy); g.closePath(); g.clip();
      for (let i = 1; i < 10; i++){ const t = i / 10; line(x0 - 3 * R + ox * t, ye + oy * t, x0 + W + 3 * R + ox * t, ye + oy * t, rgba(DK, 0.35), 0.9 * R); } for (let i = 0; i < 6; i++){ const x = x0 + r() * W, y = ye + oy * r(); ell(x, y, (6 + r() * 8) * R, (2 + r() * 3) * R, rgba(p.wet, 0.12)); }
      litBand(x0 - 3 * R, x0 + W + 3 * R, ye + oy, ye); g.restore();
      // the parapet: a stone band along the front and the lit side, merlons on top
      const pb = 9 * R; rect(x0 - 3 * R, ye - pb, W + 6 * R, pb, rgb(p.stone)); for (let x = x0 - 3 * R; x < x0 + W + 3 * R; x += (9 + r() * 6) * R) rect(x, ye - pb, 1.4 * R, pb, rgba(p.stoneD, 0.8)); rect(x0 - 3 * R, ye - pb, W + 6 * R, 1.5 * R, rgba(p.stoneL, 0.45));
      for (let x = x0 - 3 * R + 4 * R; x < x0 + W; x += 18 * R){ rect(x, ye - pb - 6 * R, 9 * R, 6.5 * R, rgb(mix(p.stone, p.stoneL, 0.2))); rect(x, ye - pb - 6 * R, 9 * R, R, rgba(p.stoneL, 0.5)); }
      poly(g, [[xe, ye - pb], [xe + ox, ye - pb + oy], [xe + ox, ye + oy], [xe, ye]], rgb(mix(p.stone, Lc, sideLit * 0.8))); for (let i = 1; i < 6; i++){ const t = i / 6; rect(xe + ox * t - 3 * R * L, ye - pb - 6 * R + oy * t, 5 * R, 6.5 * R, rgb(mix(p.stone, Lc, sideLit * 0.6))); }
      line(x0 - 3 * R, ye + 1.2 * R, x0 + W + 3 * R, ye + 1.2 * R, rgba(DK, 0.5), 1.5 * R);
      const dx = x0 + W * (L > 0 ? 0.3 : 0.7); door(dx, dw * 1.25, dh, by); for (let i = 0; i < 3; i++){ const x = x0 + W * (L > 0 ? 0.58 : 0.42) + (i - 1) * W * 0.16 * L; win(x, ye + H * 0.3, 6 * R, 20 * R); }
      ax = x0 + W / 2; ay = by;
    } else if (kind === 'armoury'){
      // a front-gabled store: double doors under the gable, a shield and crossed spears over them, a hoist beam at the apex
      const W = 1.5 * C + 30 * R, H = HW * 0.9, RH = W * 0.4, B = box(W, H, RH + 12 * R), x0 = B.x0, by = B.by, ye = B.ye, ox = B.ox, oy = B.oy, xe = B.xe, cxx = x0 + W / 2, yr = ye - RH;
      // the far slope first (seen over the ridge), then the side wall and the lit slope
      poly(g, [[cxx, yr], [cxx + ox, yr + oy], [x0 + (L > 0 ? 0 : W) + ox, ye + oy], [x0 + (L > 0 ? 0 : W), ye]], rgb(mul(roofC, 0.6)));
      sideWall(B); frontWall(B, 0, 3);
      poly(g, [[xe, ye + R], [xe + ox, ye + oy + R], [cxx + ox, yr + oy], [cxx, yr]], rgb(roofC)); g.save(); g.beginPath(); g.moveTo(xe, ye + R); g.lineTo(xe + ox, ye + oy + R); g.lineTo(cxx + ox, yr + oy); g.lineTo(cxx, yr); g.closePath(); g.clip();
      for (let i = 1; i < 9; i++){ const t = i / 9; line(xe + (cxx - xe) * t, ye - RH * t, xe + ox + (cxx - xe) * t, ye + oy - RH * t, rgba(mul(roofC, 0.5), 0.8), 1.1 * R); } for (let i = 1; i < 6; i++){ const t = i / 6; line(xe + ox * t, ye + oy * t, cxx + ox * t, yr + oy * t, rgba(roofL, 0.25), 0.7 * R); }
      litBand(xe, xe + ox, yr + oy, ye); g.restore();
      // the gable: plaster with a timber brace, bargeboards, the hoist beam and its hook
      poly(g, [[x0 - over * 0.5, ye], [x0 + W + over * 0.5, ye], [cxx, yr - 2 * R]], rgb(mix(p.plaster, p.plasterD, 0.3))); poly(g, [[x0 + W * 0.25, ye], [x0 + W * 0.75, ye], [cxx, yr + RH * 0.4]], rgba(DK, 0.08));
      line(x0 + W * 0.2, ye, cxx, yr + RH * 0.45, rgb(p.timber), 2.4 * R); line(x0 + W * 0.8, ye, cxx, yr + RH * 0.45, rgb(p.timber), 2.4 * R); line(cxx, yr, cxx, ye, rgb(p.timber), 2.4 * R); line(x0, ye, cxx, yr - 2 * R, rgb(mul(roofC, 0.5)), 3 * R); line(x0 + W, ye, cxx, yr - 2 * R, rgb(mul(roofC, 0.5)), 3 * R);
      { const wg = g.createLinearGradient(L > 0 ? x0 : x0 + W, 0, L > 0 ? x0 + W : x0, 0); wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(10,14,24,.3)'); g.fillStyle = wg; g.beginPath(); g.moveTo(x0, ye); g.lineTo(x0 + W, ye); g.lineTo(cxx, yr); g.closePath(); g.fill(); }
      line(cxx, yr + 2 * R, cxx + 14 * R * L, yr + 2 * R, rgb(p.bark), 3 * R); line(cxx + 12 * R * L, yr + 3 * R, cxx + 12 * R * L, yr + 12 * R, rgb(p.iron), 1.2 * R); g.strokeStyle = rgb(p.iron); g.lineWidth = 1.4 * R; g.beginPath(); g.arc(cxx + 12 * R * L, yr + 14 * R, 2.5 * R, -Math.PI * 0.5, Math.PI * 0.9); g.stroke();
      win(cxx, yr + RH * 0.55, 8 * R, 10 * R);
      // the doors, the shield and the crossed spears over them
      door(cxx, dw * 2, dh, by, true); { const y = by - dh - 16 * R; line(cxx - 12 * R, y + 9 * R, cxx + 12 * R, y - 9 * R, rgb(mix(p.timber, p.barkD, 0.5)), 1.6 * R); line(cxx + 12 * R, y + 9 * R, cxx - 12 * R, y - 9 * R, rgb(mix(p.timber, p.barkD, 0.5)), 1.6 * R); for (const s of [-1, 1]) for (const t of [-1, 1]) poly(g, [[cxx + s * 12 * R - 1.5 * R, y + t * 9 * R], [cxx + s * 12 * R + 1.5 * R, y + t * 9 * R], [cxx + s * 14 * R, y + t * 13 * R]], rgb(p.iron));
        poly(g, [[cxx - 7 * R, y - 8 * R], [cxx + 7 * R, y - 8 * R], [cxx + 7 * R, y], [cxx, y + 8 * R], [cxx - 7 * R, y]], rgb(mix(p.timber, p.barkD, 0.3)), rgb(p.iron), R); poly(g, [[cxx - 7 * R, y - 8 * R], [cxx, y - 8 * R], [cxx, y + 8 * R], [cxx - 7 * R, y]], rgba(p.plasterD, 0.4)); ell(cxx, y - R, 1.8 * R, 1.8 * R, rgb(p.iron)); }
      ax = cxx; ay = by;
    } else if (kind === 'blacksmith'){
      // the smithy: open along the front between heavy posts and half walls, the forge glowing at the back under its hood, a big stone chimney over it
      const W = 2 * C + 30 * R, H = HW * 0.85, B = box(W, H, 60 * R), x0 = B.x0, by = B.by, ye = B.ye, ox = B.ox, oy = B.oy, SD = B.SD, RH = Math.max(W * 0.6 * 0.78 * 0.81, H * 0.4), yr = ye - RH, xl = x0 - over, xr = x0 + W + over, rx = ox * 0.5, ry = oy * 0.5;
      // the inside: a dark room, the back wall of sooted stone, the floor of beaten earth
      rect(x0, ye, W, H, rgb(hx('#100e0c'))); { const fg = g.createLinearGradient(0, ye, 0, by); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(60,48,36,.5)'); g.fillStyle = fg; g.fillRect(x0, ye, W, H); }
      const fx = x0 + W * (L > 0 ? 0.66 : 0.34), fy = by - 4 * R, hw = 22 * R;   // the forge
      rect(fx - hw, by - H * 0.55, hw * 2, H * 0.55 - 4 * R, rgb(mix(p.stone, DK, 0.5))); for (let yy = by - H * 0.55; yy < fy; yy += 6 * R) for (let xx = fx - hw + (((yy / (6 * R)) | 0) & 1) * 6 * R; xx < fx + hw; xx += 12 * R) rect(xx + 0.6 * R, yy + 0.6 * R, Math.min(12 * R, fx + hw - xx) - 1.2 * R, 5 * R, rgb(mix(mul(p.stone, 0.7 + r() * 0.3), DK, 0.4)));
      rect(fx - hw * 0.6, fy - 18 * R, hw * 1.2, 14 * R, rgb(hx('#0a0806'))); ell(fx, fy - 8 * R, hw * 0.9, 9 * R, rgba(p.ember, 0.22)); ell(fx, fy - 9 * R, hw * 0.45, 4 * R, rgba(p.ember, 0.9)); ell(fx - 3 * R, fy - 9.5 * R, hw * 0.2, 2 * R, rgba(mix(p.ember, p.thatchL, 0.45), 0.95)); for (let i = 0; i < 8; i++) ell(fx + (r() - 0.5) * hw * 1.3, fy - 6 * R - r() * 6 * R, 1.6 * R, 1.2 * R, rgb(mix(hx('#1a1410'), p.ember, r() * 0.6)));
      poly(g, [[fx - hw * 1.1, fy - 20 * R], [fx + hw * 1.1, fy - 20 * R], [fx + hw * 0.5, fy - 34 * R], [fx - hw * 0.5, fy - 34 * R]], rgb(mix(p.iron, DK, 0.3))); rect(fx - hw * 1.1, fy - 20 * R, hw * 2.2, 1.5 * R, rgba(p.ember, 0.35)); rect(fx - 5 * R, by - H + 2 * R, 10 * R, H - 36 * R, rgb(mix(p.iron, DK, 0.2)));
      { const gg = g.createRadialGradient(fx, fy - 8 * R, 4 * R, fx, fy - 8 * R, W * 0.5); gg.addColorStop(0, 'rgba(200,112,42,.35)'); gg.addColorStop(1, 'rgba(200,112,42,0)'); g.fillStyle = gg; g.fillRect(x0, ye, W, H); }
      line(fx - hw - 8 * R, by - 2 * R, fx - hw - 4 * R, by - 26 * R, rgb(p.iron), 1.2 * R); line(fx + hw + 8 * R, by - 2 * R, fx + hw + 4 * R, by - 24 * R, rgb(p.iron), 1.2 * R);
      // the half walls at both ends, the posts, the lintel beam
      for (const s of [0, 1]){ const hx0 = x0 + s * W * 0.8, hw2 = W * 0.2, hy = by - H * 0.42; rect(hx0, hy, hw2, H * 0.42, rgb(p.plaster)); rect(hx0, by - foot, hw2, foot, rgb(p.stone)); for (let x = hx0; x < hx0 + hw2; x += 9 * R) rect(x, by - foot, 1.4 * R, foot, rgba(p.stoneD, 0.8)); rect(hx0, hy, hw2, 2.5 * R, rgb(p.timber)); for (let i = 0; i < 3; i++) rect(hx0 + r() * hw2, hy + 3 * R, (2 + r() * 4) * R, H * 0.3 * r(), rgba(p.plasterD, 0.5)); }
      for (const t of [0, 0.2, 0.5, 0.8, 1]){ const x = x0 + W * t; rect(x - 3 * R, ye, 6 * R, H, rgb(p.timber)); rect(x - 3 * R + (L > 0 ? 4 * R : 0), ye, 2 * R, H, rgba(p.barkL, 0.3)); }
      rect(x0 - 2 * R, ye - 2 * R, W + 4 * R, 8 * R, rgb(mul(p.timber, 0.9))); rect(x0 - 2 * R, ye - 2 * R, W + 4 * R, R, rgba(p.barkL, 0.4));
      sideWall(B);
      { const wg = g.createLinearGradient(L > 0 ? x0 : x0 + W, 0, L > 0 ? x0 + W : x0, 0); wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(10,14,24,.3)'); g.fillStyle = wg; g.fillRect(x0, ye, W, H); }
      // the roof: the back slope, the chimney through it, the front slope
      const ridge = [[xl + 2 * R + rx, yr + ry], [xr - 2 * R + rx, yr + ry]];
      poly(g, [[ridge[0][0], ridge[0][1]], [ridge[1][0], ridge[1][1]], [xr + ox, ye + oy], [xl + ox, ye + oy]], rgb(mul(roofC, 0.6)));
      const chx = x0 + W * (L > 0 ? 0.66 : 0.34) + rx * 0.9, cht = yr + ry - 30 * R; rect(chx - 9 * R, cht, 18 * R, ye + oy * 0.9 - cht, rgb(p.stoneD)); for (let yy = cht + 3 * R; yy < yr + ry + 10 * R; yy += 6 * R) for (let xx = chx - 9 * R + (((yy / (6 * R)) | 0) & 1) * 5 * R; xx < chx + 9 * R; xx += 10 * R) rect(xx + 0.5 * R, yy, Math.min(10 * R, chx + 9 * R - xx) - R, 5 * R, rgb(mul(p.stone, 0.5 + r() * 0.3)));
      rect(chx - 11 * R, cht - 3 * R, 22 * R, 4 * R, rgb(mul(p.stone, 0.8))); rect(chx - 7 * R, cht - 2 * R, 14 * R, 2 * R, rgb(DK)); rect(chx - 9 * R + (L > 0 ? 9 * R : 0), cht, 9 * R, yr + ry + 10 * R - cht, rgba(Lc, sideLit * 0.5)); chim = {x: chx, y: cht - 3 * R};
      poly(g, [[xl, ye + 1 * R], [xr, ye + 1 * R], [ridge[1][0], ridge[1][1]], [ridge[0][0], ridge[0][1]]], rgb(roofC));
      g.save(); g.beginPath(); g.moveTo(xl, ye + R); g.lineTo(xr, ye + R); g.lineTo(ridge[1][0], ridge[1][1]); g.lineTo(ridge[0][0], ridge[0][1]); g.closePath(); g.clip();
      { const rows = Math.round(RH / (6 * R)); for (let i = 1; i < rows; i++){ const y = ye - i * (RH / rows), sx = rx * (ye - y) / RH; line(xl + sx - SD, y, xr + sx + SD, y + Math.sin(i * 1.7) * R, rgba(mul(roofC, 0.55), 0.8), 1.2 * R); } for (let i = 0; i < 5; i++){ const y = ye - r() * RH * 0.3; ell(xl + r() * W, y, (5 + r() * 8) * R, 3 * R, rgba(hx('#2a2420'), 0.5)); } }
      litBand(xl, xr, yr + ry, ye); g.restore();
      g.strokeStyle = rgba(mix(roofL, hx('#c8d0dc'), 0.3), 0.9); g.lineWidth = 3 * R; g.beginPath(); g.moveTo(ridge[0][0], ridge[0][1]); g.lineTo(ridge[1][0], ridge[1][1]); g.stroke(); line(xl, ye + 1.5 * R, xr, ye + 1.5 * R, rgba(DK, 0.5), 1.5 * R);
      ax = x0 + W / 2; ay = by;
    } else if (kind === 'leather'){
      // the tannery lean-to: four posts, a planked back wall, one slope of boards sagging toward the front, hides hung from the front beam
      const W = 1.3 * C + 20 * R, Hb = HW * 0.8, Hf = HW * 0.46, B = box(W, Hb, 0), x0 = B.x0, by = B.by, ox = B.ox, oy = B.oy, SD = B.SD, yf = by - Hf, yb = by + oy - Hb;
      ell(x0 + W / 2 + ox * 0.5, by + oy * 0.5 + 2 * R, W * 0.6, SD * 0.5, rgba(hx('#16120e'), 0.4));
      planks(x0 + ox, yb, W, Hb - 6 * R, mix(p.timber, p.barkL, 0.15), 8 * R); rect(x0 + ox, yb, W, Hb - 6 * R, rgba(DK, 0.25)); for (let i = 0; i < 4; i++) rect(x0 + ox + r() * W, yb + r() * Hb * 0.5, (2 + r() * 3) * R, Hb * 0.4, rgba(DK, 0.3));
      // the end toward the light is closed by a wattle panel; the other end is open
      { const xs = L > 0 ? x0 + W : x0; poly(g, [[xs, by], [xs + ox, by + oy], [xs + ox, yb], [xs, yf]], rgb(mix(sideC, p.barkL, 0.3))); for (let i = 1; i < 7; i++){ const t = i / 7; line(xs, yf + (by - yf) * t, xs + ox, yb + (by + oy - yb) * t, rgba(DK, 0.35), 0.8 * R); } const sg = g.createLinearGradient(xs, 0, xs + ox, 0); sg.addColorStop(0, 'rgba(255,236,190,.16)'); sg.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = sg; g.beginPath(); g.moveTo(xs, by); g.lineTo(xs + ox, by + oy); g.lineTo(xs + ox, yb); g.lineTo(xs, yf); g.closePath(); g.fill(); }
      for (const x of [x0 + ox + 3 * R, x0 + ox + W - 3 * R]) rect(x - 2.2 * R, yb, 4.4 * R, by + oy - yb, rgb(p.barkD));
      // the roof: boards from the back beam down to the front beam, the lit end brighter
      poly(g, [[x0 + ox - 4 * R, yb - 3 * R], [x0 + ox + W + 4 * R, yb - 3 * R], [x0 + W + 6 * R, yf - 2 * R], [x0 - 6 * R, yf - 2 * R]], rgb(mix(roofC, p.bark, 0.3)));
      g.save(); g.beginPath(); g.moveTo(x0 + ox - 4 * R, yb - 3 * R); g.lineTo(x0 + ox + W + 4 * R, yb - 3 * R); g.lineTo(x0 + W + 6 * R, yf - 2 * R); g.lineTo(x0 - 6 * R, yf - 2 * R); g.closePath(); g.clip();
      for (let i = 1; i < 9; i++){ const t = i / 9; line(x0 - 6 * R + (ox + 2 * R) * t, yf - 2 * R + (yb - yf) * t, x0 + W + 6 * R + (ox - 2 * R) * t, yf - 2 * R + (yb - yf) * t, rgba(DK, 0.35), 0.9 * R); } for (let i = 0; i < 12; i++){ const t = i / 12; line(x0 - 6 * R + (W + 12 * R) * t, yf - 2 * R, x0 + ox - 4 * R + (W + 8 * R) * t, yb - 3 * R, rgba(roofL, 0.25), 0.8 * R); }
      for (let i = 0; i < 4; i++) ell(x0 + r() * W + ox * 0.5, yf + (yb - yf) * 0.5 * r(), (5 + r() * 6) * R, 3 * R, rgba(p.moss, 0.5)); litBand(x0 - 6 * R, x0 + W + 6 * R, yb - 3 * R, yf - 2 * R); g.restore();
      rect(x0 - 6 * R, yf - 4 * R, W + 12 * R, 5 * R, rgb(p.bark)); rect(x0 - 6 * R, yf - 4 * R, W + 12 * R, R, rgba(p.barkL, 0.45));
      for (const x of [x0 + 4 * R, x0 + W - 4 * R]){ rect(x - 2.5 * R, yf - 2 * R, 5 * R, Hf + 2 * R, rgb(p.bark)); rect(x - 2.5 * R + (L > 0 ? 3 * R : 0), yf - 2 * R, 2 * R, Hf + 2 * R, rgba(p.barkL, 0.45)); }
      // the hides on the beam, pegged up, drying in the shade
      const hideC = hx(w ? '#6e5a48' : '#7e6448'), hideD = hx('#4a3828'); for (let i = 0; i < 3; i++){ const x = x0 + W * (0.22 + i * 0.28), y = yf + R, hh = (26 + (i * 7) % 10) * R; line(x, y, x, y + 3 * R, rgb(hx('#4e4430')), 0.8 * R); poly(g, [[x - 7 * R, y + 3 * R], [x + 6 * R, y + 2 * R], [x + 8 * R, y + hh * 0.55], [x + 4 * R, y + hh], [x - 4 * R, y + hh - 3 * R], [x - 8 * R, y + hh * 0.5]], rgb(mix(hideC, hideD, i * 0.25))); ell(x - R, y + hh * 0.5, 3 * R, hh * 0.2, rgba(hideD, 0.25)); }
      ax = x0 + W / 2; ay = by;
    } else if (kind === 'alchemy'){
      // the alchemist's round hut: a plaster drum on a stone footing, a tall thatch cone with a smoking pipe at the apex, an arched door, a round window of coloured bottles
      const rw = 0.72 * C + 10 * R, Hh = HW * 0.72, RH = rw * 1.45; c = mk(rw * 2 + 40 * R, Hh + RH + rw * 0.4 + 24 * R); g = c.getContext('2d'); const cxx = c.width / 2, by = c.height - 4 * R - rw * 0.15, ye = by - Hh, apex = ye - RH;
      // the drum: lit toward the light, the footing of stone, timber bands
      ell(cxx, by, rw, rw * 0.35, rgb(p.stoneD)); rect(cxx - rw, ye, rw * 2, Hh, rgb(p.plaster)); ell(cxx, ye, rw, rw * 0.35, rgb(p.plaster));
      rect(cxx - rw, by - foot, rw * 2, foot, rgb(p.stone)); for (let x = cxx - rw; x < cxx + rw; x += (9 + r() * 7) * R) rect(x, by - foot, 1.5 * R, foot, rgba(p.stoneD, 0.8)); ell(cxx, by, rw, rw * 0.35, rgb(mul(p.stone, 0.8)));
      for (let i = 0; i < 6; i++){ const x = cxx - rw + r() * rw * 2; rect(x, ye + r() * Hh * 0.5, (2 + r() * 4) * R, Hh * (0.2 + r() * 0.4), rgba(p.plasterD, 0.5)); } for (const t of [0.3, 0.62]) rect(cxx - rw, ye + Hh * t, rw * 2, 2.6 * R, rgb(p.timber));
      for (const t of [-0.75, -0.3, 0.3, 0.75]) rect(cxx + rw * t - 1.5 * R, ye, 3 * R, Hh - foot, rgb(p.timber));
      { const wg = g.createLinearGradient(cxx - rw, 0, cxx + rw, 0); const a = ['rgba(0,0,0,.5)', 'rgba(255,236,190,' + (sideLit * 0.8).toFixed(2) + ')']; wg.addColorStop(0, L > 0 ? a[0] : a[1]); wg.addColorStop(0.55, 'rgba(0,0,0,0)'); wg.addColorStop(1, L > 0 ? a[1] : a[0]); g.fillStyle = wg; g.fillRect(cxx - rw, ye - rw * 0.35, rw * 2, Hh + rw * 0.7); }
      { const dx = cxx - rw * 0.25 * L, wd = dw * 0.9, hd = dh * 0.92; rect(dx - wd / 2 - 2 * R, by - hd - 2 * R, wd + 4 * R, hd + 2 * R, rgb(p.timber)); poly(g, [[dx - wd / 2, by], [dx - wd / 2, by - hd + wd * 0.4], [dx, by - hd], [dx + wd / 2, by - hd + wd * 0.4], [dx + wd / 2, by]], rgb(mul(p.timber, 0.55))); for (let i = 1; i < 4; i++) rect(dx - wd / 2 + wd * i / 4, by - hd + wd * 0.3, 0.8 * R, hd - wd * 0.3, rgba(DK, 0.5)); for (const t of [0.3, 0.72]) rect(dx - wd / 2, by - hd * t, wd, 2.2 * R, rgb(p.iron)); ell(dx + wd * 0.3, by - hd * 0.5, 1.4 * R, 1.4 * R, rgb(p.iron)); }
      { const wx = cxx + rw * 0.5 * L, wy = ye + Hh * 0.42, wr = 9 * R; ell(wx, wy, wr + 2 * R, wr + 2 * R, rgb(p.timber)); ell(wx, wy, wr, wr, dusk ? rgb(p.window) : rgb(hx('#0e1012'))); if (dusk) ell(wx, wy, wr * 2, wr * 1.6, rgba(p.window, 0.14));
        const glass = [hx('#4a6a44'), hx('#8a5a2c'), hx('#3e5a6a'), hx('#7a4a5a')]; for (let i = 0; i < 4; i++){ const bx = wx - wr * 0.6 + i * wr * 0.4, bh = (7 + (i * 5) % 5) * R, col = dusk ? mix(glass[i], p.window, 0.35) : glass[i]; rect(bx - 1.6 * R, wy + wr * 0.6 - bh, 3.2 * R, bh, rgb(col)); rect(bx - 0.8 * R, wy + wr * 0.6 - bh - 2.5 * R, 1.6 * R, 2.5 * R, rgb(col)); rect(bx - 1.2 * R, wy + wr * 0.6 - bh + R, 0.7 * R, bh - 2 * R, rgba(p.stoneL, 0.4)); }
        line(wx - wr, wy + wr * 0.62, wx + wr, wy + wr * 0.62, rgb(p.timber), 1.4 * R); line(wx, wy - wr, wx, wy + wr * 0.6, rgb(p.timber), R); }
      // the thatch cone: strokes laid from the apex to the eave, the lit side brighter, a moss band and a bound top
      const thC = hx(w ? '#4e4430' : '#5c4a2c'), thL = hx('#8a7448'); poly(g, [[cxx - rw - 10 * R, ye + 2 * R], [cxx, apex], [cxx + rw + 10 * R, ye + 2 * R]], rgb(thC)); ell(cxx, ye + 2 * R, rw + 10 * R, (rw + 10 * R) * 0.35, rgb(thC));
      g.save(); g.beginPath(); g.moveTo(cxx - rw - 10 * R, ye + 2 * R); g.lineTo(cxx, apex); g.lineTo(cxx + rw + 10 * R, ye + 2 * R); g.closePath(); g.clip();
      for (let i = 0; i < 90; i++){ const t = r() * 2 - 1, k = r(); line(cxx + t * (rw + 10 * R) * k, apex + (ye + 2 * R - apex) * k, cxx + t * (rw + 10 * R) * Math.min(1, k + 0.18), apex + (ye + 2 * R - apex) * Math.min(1, k + 0.18), rgba(r() < 0.5 ? thL : mul(thC, 0.6), 0.5), R); }
      for (let j = 1; j < 5; j++){ const k = j / 5; g.strokeStyle = rgba(DK, 0.3); g.lineWidth = 0.9 * R; g.beginPath(); g.ellipse(cxx, apex + (ye + 2 * R - apex) * k, (rw + 10 * R) * k, (rw + 10 * R) * k * 0.3, 0, 0, Math.PI, false); g.stroke(); }
      for (let i = 0; i < 4; i++) ell(cxx + (r() - 0.5) * rw * 1.4, ye - r() * RH * 0.25, (5 + r() * 7) * R, 3 * R, rgba(p.moss, 0.55));
      { const lg = g.createLinearGradient(cxx - rw, 0, cxx + rw, 0); lg.addColorStop(0, L > 0 ? 'rgba(0,0,0,.45)' : 'rgba(255,236,190,.26)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, L > 0 ? 'rgba(255,236,190,.26)' : 'rgba(0,0,0,.45)'); g.fillStyle = lg; g.fillRect(cxx - rw - 10 * R, apex, rw * 2 + 20 * R, RH + 2 * R); }
      g.restore();
      for (let j = 0; j < 3; j++){ const y = apex + 10 * R + j * 5 * R; line(cxx - (y - apex) / RH * (rw + 10 * R), y, cxx + (y - apex) / RH * (rw + 10 * R), y, rgb(hx('#4e4430')), 1.2 * R); }
      rect(cxx - 2 * R, apex - 10 * R, 4 * R, 16 * R, rgb(p.iron)); rect(cxx - 3 * R, apex - 11 * R, 6 * R, 2 * R, rgb(p.iron)); chim = {x: cxx, y: apex - 11 * R};
      if (w) poly(g, [[cxx - rw * 0.6, apex + RH * 0.45], [cxx, apex + 2 * R], [cxx + rw * 0.6, apex + RH * 0.45]], rgba(p.snow, 0.75));
      ax = cxx; ay = by + rw * 0.15;
    }
    if (!c) return null;
    const sp = {img: c, ax, ay, s: 1 / R, tall: true, kind: 'tshell'}; if (chim) sp.chim = {x: chim.x - ax, y: chim.y - ay}; return sp;
  };
  T.selfTest = function(){
    const out = []; const ok = (n, c) => out.push((c ? 'PASS ' : 'FAIL ') + n);
    const sh = k => VO3.sprite('tshell', 1, 'summer', Object.assign({k, fk: k}, VO3.K.facHouse || {}));
    ok('T29: the five trade kinds take a shell', ['barracks', 'armoury', 'blacksmith', 'leather', 'alchemy'].every(k => sh(k) && sh(k).img.width > 50));
    { const b = sh('barracks'), d = b.img.getContext('2d').getImageData(0, 0, b.img.width, b.img.height).data, W = b.img.width, H = b.img.height, tops = []; for (let x = Math.round(W * 0.35); x < W * 0.65; x += 4){ for (let y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] > 100){ tops.push(y); break; } }
      ok('T29: the barracks roof is flat (the top edge level across the middle)', tops.length > 5 && Math.max.apply(null, tops) - Math.min.apply(null, tops) < 10 * R); }
    { const s = sh('blacksmith'), d = s.img.getContext('2d').getImageData(0, 0, s.img.width, s.img.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] > 150 && d[i + 1] > 70 && d[i + 1] < 140 && d[i + 2] < 80) n++; ok('T29: the forge glows inside the open front', n > 30 && !!s.chim); }
    { const l = sh('leather'), h = VO3.sprite('building', 3, 'summer', Object.assign({w: 1, d: 1, roof: 48, foot: 1}, VO3.K.facHouse || {})); ok('T29: the lean-to is lower than the house it replaces', l.img.height < h.img.height * 0.8); }
    { const a = sh('alchemy'), W = a.img.width, H = a.img.height, d = a.img.getContext('2d').getImageData(0, 0, W, H).data, wid = y => { let x0 = W, x1 = 0; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 100){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return x1 - x0; }; ok('T29: the alchemist hut narrows to a point (a cone over a drum)', wid(Math.round(H * 0.15)) < wid(Math.round(H * 0.45)) * 0.5 && !!a.chim); }
    { const f = VO3.sprite('fac', 0, 'summer', {k: 'armoury'}); ok('T29: facility() paints the armoury with its shell', !!f && f.img.width > 100); }
    T.apply();   // clears the sprite cache, so a later suite (S26, SW10) builds its sprites afresh
    return out;
  };
})();
