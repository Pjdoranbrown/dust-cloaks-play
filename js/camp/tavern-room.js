/* INDEX TAV48 - F-48 Art (sanity 16): the tavern room repainted (walk-in tavern and the bar fight).
   The floor, walls, rugs, fireplace and table candles were small tiles and low-resolution props that read as pixel art.
   This file paints them smooth, in the same warm, dim look: long floor boards with staggered joins, plaster and timber
   walls with a dark wainscot, woven rugs, a stone fireplace with a live fire, and wax candles with a soft flame.
   The room is painted once into one picture (2x) and drawn as one blit; only the flames and the light pools move.
   Nothing else changes: same map, same blocked cells, same counter, tables, kegs, barrels, doors and figures.
   INT-1 group 20: no switch. Load after the inline script (any place after tavernwalk.js is fine). */
(function(){
  'use strict';
  const A = window.TAV48 = {S:2, fails:{}, pic:null, key:'', hearth:null, drawn:0};
  const G_ = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const TAU = Math.PI * 2;
  const rng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); };

  /* ---- the still picture: floor, rugs, walls ---- */
  function boards(g, x0, y0, w, h, R){
    const BH = 20;
    for (let y = y0, row = 0; y < y0 + h; y += BH, row++){
      let x = x0 - R() * 120;
      while (x < x0 + w){
        const len = 110 + R() * 130, l = 30 + R() * 9, c = `hsl(${24 + R() * 7},${36 + R() * 10}%,${l}%)`;
        const bx = Math.max(x, x0), bw = Math.min(x + len, x0 + w) - bx;
        if (bw > 0){
          const gr = g.createLinearGradient(0, y, 0, y + BH); gr.addColorStop(0, c); gr.addColorStop(1, `hsl(24,38%,${l - 4}%)`);
          g.fillStyle = gr; g.fillRect(bx, y, bw, BH);
          g.save(); g.beginPath(); g.rect(bx, y, bw, BH); g.clip();                       // grain: a few long, faint, slightly wavy lines
          for (let k = 0; k < 4; k++){ const gy = y + 3 + R() * (BH - 6), wob = (R() - 0.5) * 3; g.strokeStyle = `rgba(${R() < 0.5 ? '20,10,4' : '255,214,160'},${0.05 + R() * 0.07})`; g.lineWidth = 0.6 + R() * 0.6;
            g.beginPath(); g.moveTo(bx - 4, gy); g.bezierCurveTo(bx + bw * 0.3, gy + wob, bx + bw * 0.6, gy - wob, bx + bw + 4, gy + wob * 0.5); g.stroke(); }
          if (R() < 0.16){ const kx = bx + 12 + R() * Math.max(1, bw - 24), ky = y + 6 + R() * 8; const kg = g.createRadialGradient(kx, ky, 0.5, kx, ky, 5); kg.addColorStop(0, 'rgba(26,14,6,.7)'); kg.addColorStop(1, 'rgba(26,14,6,0)'); g.fillStyle = kg; g.beginPath(); g.ellipse(kx, ky, 6, 3.4, 0, 0, TAU); g.fill(); }
          g.restore();
          if (x > x0){ g.fillStyle = 'rgba(12,6,2,.55)'; g.fillRect(x - 0.5, y, 1, BH); g.fillStyle = 'rgba(14,8,3,.32)'; for (const [nx, ny] of [[4, 5], [4, 15], [-4, 5], [-4, 15]]){ g.beginPath(); g.arc(x + nx, y + ny, 0.6, 0, TAU); g.fill(); } }
        }
        x += len;
      }
      g.fillStyle = 'rgba(10,5,2,.5)'; g.fillRect(x0, y - 0.5, w, 1); g.fillStyle = 'rgba(255,220,170,.05)'; g.fillRect(x0, y + 0.6, w, 0.8);
    }
  }
  function rug(g, x, y, w, h, c1, c2, c3){
    const sg = g.createRadialGradient(x + w / 2, y + h / 2 + 5, Math.min(w, h) * 0.3, x + w / 2, y + h / 2 + 5, Math.max(w, h) * 0.62); sg.addColorStop(0, 'rgba(0,0,0,.36)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(x - 14, y - 8, w + 28, h + 30);
    g.strokeStyle = '#cdbb94'; g.lineWidth = 0.9; g.beginPath(); for (let i = 2; i < h; i += 3){ g.moveTo(x - 4, y + i); g.lineTo(x, y + i + 0.4); g.moveTo(x + w, y + i); g.lineTo(x + w + 4, y + i + 0.4); } g.stroke();
    rr(g, x, y, w, h, 2.5); g.fillStyle = c1; g.fill();
    g.save(); rr(g, x, y, w, h, 2.5); g.clip();
    g.strokeStyle = c2; g.lineWidth = 2.4; g.strokeRect(x + 5, y + 5, w - 10, h - 10); g.lineWidth = 0.9; g.strokeRect(x + 10, y + 10, w - 20, h - 20);
    const n = Math.max(1, Math.round((w - 40) / 46)), step = (w - 40) / n, cy = y + h / 2, dh = Math.min(h / 2 - 16, 24);
    for (let i = 0; i < n; i++){ const cx = x + 20 + step * (i + 0.5), dw = Math.min(step / 2 - 3, 20);
      g.beginPath(); g.moveTo(cx, cy - dh); g.lineTo(cx + dw, cy); g.lineTo(cx, cy + dh); g.lineTo(cx - dw, cy); g.closePath(); g.fillStyle = c3; g.fill(); g.strokeStyle = c2; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.arc(cx, cy, 2.6, 0, TAU); g.fillStyle = c2; g.fill(); }
    g.globalAlpha = 0.1; g.strokeStyle = '#000'; g.lineWidth = 0.6; g.beginPath(); for (let j = 1.5; j < h; j += 3){ g.moveTo(x, y + j); g.lineTo(x + w, y + j); } g.stroke(); g.globalAlpha = 1;
    const lg = g.createLinearGradient(x, y, x + w * 0.4, y + h); lg.addColorStop(0, 'rgba(255,214,150,.16)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.26)'); g.fillStyle = lg; g.fillRect(x, y, w, h);
    g.restore();
  }
  function wallFace(g, px, py, C, x, R){                                       // a wall seen from the front: beam, plaster, dark wainscot
    const pg = g.createLinearGradient(0, py, 0, py + C); pg.addColorStop(0, '#6f5c40'); pg.addColorStop(0.55, '#8a7350'); pg.addColorStop(1, '#7a6444');
    g.fillStyle = pg; g.fillRect(px, py, C, C);
    for (let k = 0; k < 5; k++){ const mx = px + R() * C, my = py + 6 + R() * 16, mr = 5 + R() * 9; const mg = g.createRadialGradient(mx, my, 0, mx, my, mr); mg.addColorStop(0, `rgba(${R() < 0.5 ? '40,26,12' : '230,205,160'},.10)`); mg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = mg; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2); }
    const wy = py + C - 15, wg = g.createLinearGradient(0, wy, 0, py + C); wg.addColorStop(0, '#4a3220'); wg.addColorStop(1, '#2e1e12');
    g.fillStyle = wg; g.fillRect(px, wy, C, 15);
    g.fillStyle = 'rgba(10,5,2,.5)'; for (let i = 0; i < C; i += 10) g.fillRect(px + i + (x % 2 ? 3 : 0), wy + 2, 0.8, 13);
    g.fillStyle = '#5a3e26'; g.fillRect(px, wy - 1.5, C, 2.5); g.fillStyle = 'rgba(255,220,170,.14)'; g.fillRect(px, wy - 1.5, C, 0.8);
    const bg = g.createLinearGradient(0, py, 0, py + 7); bg.addColorStop(0, '#2a1b10'); bg.addColorStop(1, '#3e2a18'); g.fillStyle = bg; g.fillRect(px, py, C, 7);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px, py + 7, C, 1.2);
    if (x % 3 === 0){ const tg = g.createLinearGradient(px + 16, 0, px + 24, 0); tg.addColorStop(0, '#4a3220'); tg.addColorStop(0.5, '#5a3e26'); tg.addColorStop(1, '#33220f'); g.fillStyle = tg; g.fillRect(px + 16, py + 7, 8, C - 7); }
  }
  function wallTop(g, px, py, C, nb){                                          // a wall seen from above: pale plaster top with a dark edge on the room side
    const tg = g.createLinearGradient(px, py, px + C, py + C); tg.addColorStop(0, '#75634a'); tg.addColorStop(1, '#5f503a'); g.fillStyle = tg; g.fillRect(px, py, C, C);
    const edge = (x, y, w, h) => { g.fillStyle = 'rgba(16,9,4,.7)'; g.fillRect(x, y, w, h); };
    if (nb.r){ edge(px + C - 4, py, 4, C); g.fillStyle = 'rgba(255,225,180,.16)'; g.fillRect(px + C - 5.2, py, 1.2, C); }
    if (nb.l){ edge(px, py, 4, C); g.fillStyle = 'rgba(255,225,180,.16)'; g.fillRect(px + 4, py, 1.2, C); }
    if (nb.u){ edge(px, py, C, 4); g.fillStyle = 'rgba(255,225,180,.16)'; g.fillRect(px, py + 4, C, 1.2); }
    g.fillStyle = 'rgba(30,18,8,.16)'; g.fillRect(px, py + C - 0.6, C, 0.6);
  }
  function paint(M, C, T){
    const S = A.S, W = M.w * C, H = M.h * C, cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    const g = cv.getContext('2d'), R = rng(4816); g.scale(S, S);
    g.fillStyle = '#100b07'; g.fillRect(0, 0, W, H);
    boards(g, C, C, W - 2 * C, H - 2 * C, R);
    const wear = (x, y, rx, ry, a) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const wg = g.createRadialGradient(0, 0, 0, 0, 0, rx); wg.addColorStop(0, `rgba(214,170,116,${a})`); wg.addColorStop(1, 'rgba(214,170,116,0)'); g.fillStyle = wg; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };
    wear(W * 0.5, H * 0.3, 380, 60, 0.08); wear(W * 0.14, H * 0.5, 120, 150, 0.07); wear(W * 0.5, H * 0.86, 90, 110, 0.07);   // paths worn pale: along the bar, in from the doors
    rug(g, 9.2 * C, 8.2 * C, 7.6 * C, 2.6 * C, '#64271f', '#c8a050', '#7c3a26');
    rug(g, 11.6 * C, 14.2 * C, 1.8 * C, 2.6 * C, '#27365a', '#c8b890', '#34487a');
    const at = (x, y) => (x < 0 || y < 0 || x >= M.w || y >= M.h) ? -1 : M.g[y * M.w + x], inside = t => t === T.FLOOR || t === T.WAGON;
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++){
      if (at(x, y) !== T.WALL) continue;
      const px = x * C, py = y * C;
      if (inside(at(x, y + 1))){ wallFace(g, px, py, C, x, R); const sh = g.createLinearGradient(0, py + C, 0, py + C + 12); sh.addColorStop(0, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(px, py + C, C, 12); }
      else wallTop(g, px, py, C, {r:inside(at(x + 1, y)), l:inside(at(x - 1, y)), u:inside(at(x, y - 1)), d:false});
    }
    g.fillStyle = 'rgba(24,12,4,.34)'; g.fillRect(C, C, W - 2 * C, H - 2 * C);    // the dim room, as before
    return cv;
  }
  A.room = function(ctx, cx, cy, M, f, C, VW, VH, T){
    const key = M.w + 'x' + M.h + ':' + C;
    if (!A.pic || A.key !== key){ A.pic = paint(M, C, T); A.key = key; A.lights = null; }
    const W = M.w * C, H = M.h * C;
    ctx.fillStyle = '#100b07'; ctx.fillRect(cx - 40, cy - 40, VW + 80, VH + 80);
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(A.pic, 0, 0, W, H); ctx.imageSmoothingEnabled = sm;
    if (!A.lights) A.lights = [[3.5, 2.2, 300, 0.26], [8, 3.2, 130, 0.16], [12.5, 3.2, 130, 0.16], [17, 3.2, 130, 0.16]].concat((M.tables || []).map(t => [t.x + 1, t.y + 0.5, 110, 0.15]));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.lights.forEach(([lx, ly, r, a], i) => { const fl = 1 + Math.sin(f / (6 + i) + i * 1.7) * 0.05 + Math.sin(f / 2.3 + i) * 0.02, X = lx * C, Y = ly * C, Rr = r * fl;
      const gr = ctx.createRadialGradient(X, Y, 4, X, Y, Rr); gr.addColorStop(0, `rgba(255,170,80,${a})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gr; ctx.fillRect(X - Rr, Y - Rr, Rr * 2, Rr * 2); });
    ctx.restore(); A.drawn++;
    return true;
  };

  /* ---- the fireplace and the candles (drawn each frame; the stonework is painted once) ---- */
  function flame(ctx, x, y, w, h, t, i){                                        // one smooth tongue of fire, base at (x, y)
    const sway = Math.sin(t / 5 + i * 2.1) * w * 0.22 + Math.sin(t / 2.3 + i) * w * 0.08, hh = h * (0.86 + 0.14 * Math.sin(t / 3.1 + i * 1.3));
    const gr = ctx.createLinearGradient(0, y, 0, y - hh); gr.addColorStop(0, 'rgba(255,244,200,.95)'); gr.addColorStop(0.35, 'rgba(255,196,84,.92)'); gr.addColorStop(0.75, 'rgba(240,110,34,.7)'); gr.addColorStop(1, 'rgba(200,50,20,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - w / 2, y);
    ctx.bezierCurveTo(x - w * 0.62, y - hh * 0.45, x - w * 0.12 + sway * 0.5, y - hh * 0.7, x + sway, y - hh);
    ctx.bezierCurveTo(x + w * 0.12 + sway * 0.5, y - hh * 0.7, x + w * 0.62, y - hh * 0.45, x + w / 2, y); ctx.closePath(); ctx.fill();
  }
  function hearthPic(){
    const S = A.S, cv = document.createElement('canvas'); cv.width = 140 * S; cv.height = 110 * S; const g = cv.getContext('2d'), R = rng(77); g.scale(S, S);
    // local frame: ground line at y = 104, centre x = 70; the breast is 116 wide and 96 tall
    const x0 = 12, y0 = 8, w = 116, h = 96;
    g.fillStyle = '#1c1612'; rr(g, x0, y0, w, h, 3); g.fill();
    g.save(); rr(g, x0, y0, w, h, 3); g.clip();
    for (let y = y0 + 1, row = 0; y < y0 + h; y += 12, row++){ let x = x0 + 1 - (row % 2 ? 9 : 0) - R() * 4;
      while (x < x0 + w){ const bw = 17 + R() * 11, l = 30 + R() * 12; const sg = g.createLinearGradient(0, y, 0, y + 11); sg.addColorStop(0, `hsl(${26 + R() * 10},${7 + R() * 6}%,${l + 5}%)`); sg.addColorStop(1, `hsl(28,8%,${l - 5}%)`);
        g.fillStyle = sg; rr(g, x, y, bw - 1.6, 10.4, 2.2); g.fill(); x += bw; } }
    const sh = g.createLinearGradient(x0, 0, x0 + w, 0); sh.addColorStop(0, 'rgba(0,0,0,.3)'); sh.addColorStop(0.25, 'rgba(0,0,0,0)'); sh.addColorStop(0.75, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.36)'); g.fillStyle = sh; g.fillRect(x0, y0, w, h);
    g.restore();
    // the fire box: an arched opening, black at the back, warm at the floor
    g.beginPath(); g.moveTo(42, 102); g.lineTo(42, 66); g.quadraticCurveTo(42, 44, 70, 44); g.quadraticCurveTo(98, 44, 98, 66); g.lineTo(98, 102); g.closePath();
    const fb = g.createRadialGradient(70, 98, 2, 70, 90, 40); fb.addColorStop(0, '#5a2408'); fb.addColorStop(0.5, '#1e0c05'); fb.addColorStop(1, '#070403'); g.fillStyle = fb; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(255,170,90,.22)'; g.lineWidth = 1; g.stroke();
    // logs
    const log = (x1, y1, x2, y2) => { g.lineCap = 'round'; g.strokeStyle = '#1e120a'; g.lineWidth = 7; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = '#4a2c16'; g.lineWidth = 4.4; g.beginPath(); g.moveTo(x1, y1 - 0.6); g.lineTo(x2, y2 - 0.6); g.stroke(); };
    log(50, 98, 88, 94); log(54, 93, 92, 98);
    // mantel beam and hearth slab
    const mg = g.createLinearGradient(0, 30, 0, 40); mg.addColorStop(0, '#6a4828'); mg.addColorStop(1, '#3a2614'); g.fillStyle = mg; rr(g, 6, 30, 128, 10, 2); g.fill();
    g.fillStyle = 'rgba(255,220,170,.2)'; g.fillRect(8, 30.6, 124, 1); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(12, 40, 116, 3);
    const hg = g.createLinearGradient(0, 100, 0, 108); hg.addColorStop(0, '#5c554c'); hg.addColorStop(1, '#37322c'); g.fillStyle = hg; rr(g, 6, 100, 128, 8, 2); g.fill();
    return cv;
  }
  A.hearthAt = function(ctx, x, gl, t){
    if (!A.hearth) A.hearth = hearthPic();
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(A.hearth, x - 70, gl - 104, 140, 110); ctx.imageSmoothingEnabled = sm;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 28, gl - 62, 56, 60); ctx.clip();
    const eg = ctx.createRadialGradient(x, gl - 8, 1, x, gl - 8, 22); eg.addColorStop(0, `rgba(255,150,50,${0.55 + 0.12 * Math.sin(t / 7)})`); eg.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = eg; ctx.fillRect(x - 26, gl - 32, 52, 32);
    flame(ctx, x - 11, gl - 8, 13, 26, t, 0); flame(ctx, x + 10, gl - 8, 12, 23, t, 1); flame(ctx, x, gl - 7, 16, 36, t, 2); flame(ctx, x - 2, gl - 7, 8, 20, t, 3);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 0.16 + 0.03 * Math.sin(t / 4.3);
    const gg = ctx.createRadialGradient(x, gl - 18, 4, x, gl - 18, 70); gg.addColorStop(0, `rgba(255,160,70,${fl})`); gg.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gg; ctx.fillRect(x - 70, gl - 88, 140, 140); ctx.restore();
    return true;
  };
  A.candleAt = function(ctx, x, gl, t){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, gl, 6, 2.2, 0, 0, TAU); ctx.fill();
    const dg = ctx.createLinearGradient(x - 5, 0, x + 5, 0); dg.addColorStop(0, '#6a5226'); dg.addColorStop(0.5, '#c8a050'); dg.addColorStop(1, '#5a441e'); ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(x, gl - 1, 5, 1.9, 0, 0, TAU); ctx.fill();
    const wg = ctx.createLinearGradient(x - 2, 0, x + 2, 0); wg.addColorStop(0, '#b8a888'); wg.addColorStop(0.45, '#f0e4c8'); wg.addColorStop(1, '#a89878'); ctx.fillStyle = wg; rr(ctx, x - 2, gl - 11, 4, 10, 1); ctx.fill();
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(x - 0.35, gl - 12.6, 0.7, 2);
    flame(ctx, x, gl - 12, 3.6, 8, t, 5);
    ctx.globalCompositeOperation = 'lighter'; const r = 13 + Math.sin(t / 3.7) * 1.2, cg = ctx.createRadialGradient(x, gl - 15, 0.5, x, gl - 15, r); cg.addColorStop(0, 'rgba(255,200,110,.34)'); cg.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = cg; ctx.fillRect(x - r, gl - 15 - r, r * 2, r * 2);
    ctx.restore(); return true;
  };

  /* ---- the furniture (16 Nov, Director job): counter, doors, kegs, barrels and tables were near-black flat blocks.
     Each is painted once at 2x in warm oak with soft light from above, the same size and anchor as the old sprite,
     so nothing moves or collides differently. ---- */
  A.fur = {};
  const FUR = {counter:[584, 80], door:[68, 112], kegs:[114, 96], barrels:[88, 76], table:[104, 60]};   // logical size; content sits 12 in from the sides and 8 from top and bottom
  const OAK = {d:'#2a180c', m:'#5a3820', l:'#8a5a32', h:'#b88050', iron:'#2c2a28', ironL:'#77726a', brass:'#b08a40'};
  function grain(g, x, y, w, h, R, n, a){ g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.lineWidth = 0.6;
    for (let i = 0; i < n; i++){ const yy = y + R() * h, k = R(); g.strokeStyle = k < 0.5 ? `rgba(20,10,4,${a})` : `rgba(230,170,110,${a * 0.6})`; g.beginPath(); g.moveTo(x, yy);
      g.bezierCurveTo(x + w * 0.3, yy + (R() - 0.5) * 3, x + w * 0.7, yy + (R() - 0.5) * 3, x + w, yy + (R() - 0.5) * 2); g.stroke(); } g.restore(); }
  function vgrain(g, x, y, w, h, R, n, a){ g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.lineWidth = 0.6;
    for (let i = 0; i < n; i++){ const xx = x + R() * w; g.strokeStyle = R() < 0.55 ? `rgba(20,10,4,${a})` : `rgba(230,170,110,${a * 0.6})`; g.beginPath(); g.moveTo(xx, y); g.quadraticCurveTo(xx + (R() - 0.5) * 2.5, y + h / 2, xx + (R() - 0.5) * 1.5, y + h); g.stroke(); } g.restore(); }
  const lg = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => gr.addColorStop(k, c)); return gr; };
  function nail(g, x, y){ g.fillStyle = '#1a1816'; g.beginPath(); g.arc(x, y, 1.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(200,190,170,.5)'; g.beginPath(); g.arc(x - 0.3, y - 0.3, 0.45, 0, TAU); g.fill(); }
  function hoop(g, cx, y, rx, ry){ g.lineWidth = 2.2; g.strokeStyle = OAK.iron; g.beginPath(); g.ellipse(cx, y, rx, ry, 0, 0, Math.PI); g.stroke();
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(190,180,160,.45)'; g.beginPath(); g.ellipse(cx, y - 0.8, rx, ry, 0, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  function shadowEll(g, cx, cy, rx, ry, a){ const gr = g.createRadialGradient(cx, cy, 1, cx, cy, rx); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rx, 0, TAU); g.fill(); g.restore(); }
  function uprightBarrel(g, cx, base, bw, bh, R){            // a standing barrel: rounded by a side-to-side gradient, staves, two iron hoops, a lid
    const top = base - bh, rx = bw / 2, ry = bw * 0.16;
    g.save(); g.beginPath(); g.moveTo(cx - rx * 0.86, base); g.quadraticCurveTo(cx - rx * 1.08, base - bh / 2, cx - rx * 0.86, top); g.lineTo(cx + rx * 0.86, top); g.quadraticCurveTo(cx + rx * 1.08, base - bh / 2, cx + rx * 0.86, base);
    g.ellipse(cx, base, rx * 0.86, ry, 0, 0, Math.PI); g.closePath(); g.fillStyle = lg(g, cx - rx, 0, cx + rx, 0, [[0, OAK.d], [0.28, OAK.l], [0.42, OAK.h], [0.7, OAK.m], [1, OAK.d]]); g.fill(); g.clip();
    for (let i = -3; i <= 3; i++){ const k = i / 3.6; g.strokeStyle = 'rgba(20,10,4,.42)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx + k * rx * 0.86, base + 2); g.quadraticCurveTo(cx + k * rx * 1.06, base - bh / 2, cx + k * rx * 0.86, top - 2); g.stroke(); }
    vgrain(g, cx - rx, top, bw, bh, R, 14, 0.18); g.restore();
    hoop(g, cx, top + bh * 0.2, rx * 0.97, ry); hoop(g, cx, base - bh * 0.22, rx * 0.97, ry);
    g.fillStyle = lg(g, 0, top - ry, 0, top + ry, [[0, '#7a5030'], [1, '#4a2e18']]); g.beginPath(); g.ellipse(cx, top, rx * 0.86, ry, 0, 0, TAU); g.fill();
    g.strokeStyle = OAK.iron; g.lineWidth = 1.4; g.stroke(); g.strokeStyle = 'rgba(20,10,4,.35)'; g.lineWidth = 0.5;
    for (let i = -1; i <= 1; i++){ g.beginPath(); g.moveTo(cx - rx * 0.8, top + i * ry * 0.45); g.lineTo(cx + rx * 0.8, top + i * ry * 0.45); g.stroke(); }
  }
  function kegEnd(g, cx, cy, r, R, tap){                     // a keg on its side, seen end-on
    g.fillStyle = OAK.d; g.beginPath(); g.arc(cx + 1.5, cy + 1.5, r + 1, 0, TAU); g.fill();
    const fg = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); fg.addColorStop(0, '#a87244'); fg.addColorStop(0.6, '#6a4224'); fg.addColorStop(1, '#3a2312');
    g.fillStyle = fg; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.clip(); g.strokeStyle = 'rgba(20,10,4,.35)'; g.lineWidth = 0.6;
    for (let i = -3; i <= 3; i++){ g.beginPath(); g.moveTo(cx - r, cy + i * r * 0.27); g.lineTo(cx + r, cy + i * r * 0.27); g.stroke(); }
    for (let i = 1; i <= 3; i++){ g.strokeStyle = 'rgba(30,16,6,.18)'; g.beginPath(); g.arc(cx + (R() - 0.5), cy + (R() - 0.5), r * i * 0.22, 0, TAU); g.stroke(); } g.restore();
    g.lineWidth = 2.4; g.strokeStyle = OAK.iron; g.beginPath(); g.arc(cx, cy, r * 0.95, 0, TAU); g.stroke();
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(200,190,170,.5)'; g.beginPath(); g.arc(cx, cy, r * 0.95, 1.05 * Math.PI, 1.6 * Math.PI); g.stroke();
    if (tap){ g.fillStyle = OAK.brass; rr(g, cx - 1.6, cy + r * 0.25, 3.2, 6, 1); g.fill(); g.fillStyle = '#e8c878'; g.fillRect(cx - 0.6, cy + r * 0.25, 0.8, 5); g.fillStyle = OAK.brass; rr(g, cx - 3, cy + r * 0.2, 6, 2.2, 1); g.fill(); }
    else { g.fillStyle = '#2a1a0e'; g.beginPath(); g.arc(cx, cy + r * 0.45, 1.6, 0, TAU); g.fill(); }
  }
  function tankard(g, x, y){ g.fillStyle = lg(g, x - 3, 0, x + 3, 0, [[0, '#4a3a2a'], [0.4, '#a08a68'], [1, '#3a2e22']]); rr(g, x - 3, y - 8, 6, 8, 1); g.fill();
    g.strokeStyle = '#3a2e22'; g.lineWidth = 1.1; g.beginPath(); g.arc(x + 3.6, y - 4.2, 2, -Math.PI / 2, Math.PI / 2); g.stroke(); g.fillStyle = '#d8ccb0'; g.beginPath(); g.ellipse(x, y - 8, 3, 1, 0, 0, TAU); g.fill(); }
  function bottle(g, x, y, col){ g.fillStyle = col; g.beginPath(); g.moveTo(x - 2.4, y); g.lineTo(x - 2.4, y - 7); g.quadraticCurveTo(x - 2.4, y - 9, x - 0.9, y - 10); g.lineTo(x - 0.9, y - 13); g.lineTo(x + 0.9, y - 13); g.lineTo(x + 0.9, y - 10);
    g.quadraticCurveTo(x + 2.4, y - 9, x + 2.4, y - 7); g.lineTo(x + 2.4, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(x - 1.6, y - 8, 0.8, 7); }
  const FURPAINT = {
    counter(g, w, h, R){                                     // a long bar: polished top, panelled front, brass foot rail
      const x0 = 12, x1 = w - 12, top = 10, slab = 12, fy = top + slab, base = h - 8;
      shadowEll(g, w / 2, base + 1, (x1 - x0) / 2, 5, 0.45);
      g.fillStyle = lg(g, 0, fy, 0, base, [[0, '#3a2414'], [0.15, '#5e3c22'], [1, '#2c1a0e']]); g.fillRect(x0 + 3, fy, x1 - x0 - 6, base - fy);
      const pw = 44, n = Math.round((x1 - x0 - 6) / pw), step = (x1 - x0 - 6) / n;
      for (let i = 0; i < n; i++){ const px = x0 + 3 + i * step + 5, py = fy + 7, ww = step - 10, hh = base - fy - 18;
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, px, py, ww, hh, 2); g.fill();
        g.fillStyle = lg(g, px, py, px + ww, py + hh, [[0, '#7a5030'], [0.5, '#5a3820'], [1, '#3e2614']]); rr(g, px + 1.4, py + 1.4, ww - 2.8, hh - 2.8, 1.5); g.fill();
        vgrain(g, px + 2, py + 2, ww - 4, hh - 4, R, 6, 0.16);
        g.strokeStyle = 'rgba(255,210,150,.22)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(px + 1.5, py + hh - 1.5); g.lineTo(px + 1.5, py + 1.5); g.lineTo(px + ww - 1.5, py + 1.5); g.stroke();
        g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0 + 3 + i * step - 1, fy, 2, base - fy); }
      g.fillStyle = '#1c120a'; g.fillRect(x0 + 3, base - 6, x1 - x0 - 6, 6);                       // kick board
      g.strokeStyle = OAK.brass; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x0 + 6, base - 9); g.lineTo(x1 - 6, base - 9); g.stroke();
      g.strokeStyle = 'rgba(255,230,160,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x0 + 6, base - 9.7); g.lineTo(x1 - 6, base - 9.7); g.stroke();
      for (let x = x0 + 30; x < x1 - 20; x += 90){ g.fillStyle = OAK.brass; g.fillRect(x, base - 9, 1.6, 4); }
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x0, fy, x1 - x0, 3);                                // shadow under the lip
      g.fillStyle = lg(g, 0, top, 0, fy, [[0, '#9a6638'], [0.35, '#7a4e2a'], [1, '#4a2e18']]); rr(g, x0, top, x1 - x0, slab, 2.5); g.fill();
      grain(g, x0 + 2, top + 1, x1 - x0 - 4, slab - 2, R, 40, 0.22);
      g.fillStyle = 'rgba(255,225,170,.35)'; g.fillRect(x0 + 3, top + 0.8, x1 - x0 - 6, 1);
      for (let i = 0; i < 9; i++){ const sx = x0 + 20 + R() * (x1 - x0 - 40); g.fillStyle = 'rgba(255,230,190,.08)'; g.beginPath(); g.ellipse(sx, top + 5, 10 + R() * 14, 2.2, 0, 0, TAU); g.fill(); }   // a polished shine
      const items = [[0.12, 't'], [0.16, 't'], [0.31, 'b', '#3a5a2a'], [0.335, 'b', '#5a2a1e'], [0.47, 't'], [0.63, 'b', '#4a3a1a'], [0.78, 't'], [0.815, 't'], [0.9, 'b', '#2a3a4a']];
      for (const it of items){ const x = x0 + (x1 - x0) * it[0] + (R() - 0.5) * 6; it[1] === 't' ? tankard(g, x, top + 7) : bottle(g, x, top + 7, it[2]); }
      g.fillStyle = 'rgba(220,210,190,.75)'; g.beginPath(); g.ellipse(x0 + (x1 - x0) * 0.55, top + 6, 7, 1.6, 0.1, 0, TAU); g.fill();   // a bar cloth
    },
    door(g, w, h, R){                                        // an oak plank door in a timber frame, iron straps and a ring
      const x0 = 12, x1 = w - 12, y0 = 8, base = h - 8;
      g.fillStyle = lg(g, x0, 0, x1, 0, [[0, '#2a1a0e'], [0.5, '#4a3018'], [1, '#22150a']]); g.fillRect(x0, y0, x1 - x0, base - y0);
      g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(x0, y0, x1 - x0, 1.2);
      const ix0 = x0 + 5, ix1 = x1 - 5, iy0 = y0 + 5, n = 5, pw = (ix1 - ix0) / n;
      for (let i = 0; i < n; i++){ const px = ix0 + i * pw, l = 0.85 + R() * 0.3;
        g.fillStyle = lg(g, px, 0, px + pw, 0, [[0, `rgba(${92 * l | 0},${58 * l | 0},${30 * l | 0},1)`], [0.5, `rgba(${122 * l | 0},${80 * l | 0},${44 * l | 0},1)`], [1, `rgba(${80 * l | 0},${50 * l | 0},${26 * l | 0},1)`]]);
        g.fillRect(px, iy0, pw, base - iy0); vgrain(g, px, iy0, pw, base - iy0, R, 4, 0.22); g.fillStyle = 'rgba(15,8,3,.6)'; g.fillRect(px - 0.4, iy0, 0.8, base - iy0); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(ix0, iy0, ix1 - ix0, 3);
      for (const sy of [iy0 + 14, base - 22]){ g.fillStyle = OAK.iron; rr(g, ix0 - 2, sy, (ix1 - ix0) * 0.78, 4, 1.5); g.fill(); g.fillStyle = 'rgba(190,180,160,.35)'; g.fillRect(ix0 - 1, sy + 0.4, (ix1 - ix0) * 0.74, 0.8);
        for (let k = 0; k < 4; k++) nail(g, ix0 + 3 + k * 8, sy + 2); }
      const hx = ix1 - 8, hy = (iy0 + base) / 2 + 4; g.strokeStyle = OAK.iron; g.lineWidth = 1.6; g.beginPath(); g.arc(hx, hy + 3, 3.4, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(200,190,170,.5)'; g.lineWidth = 0.6; g.beginPath(); g.arc(hx, hy + 3, 3.4, Math.PI, 1.6 * Math.PI); g.stroke(); nail(g, hx, hy - 0.6);
      g.fillStyle = 'rgba(255,190,110,.22)'; g.fillRect(ix0, base - 1.2, ix1 - ix0, 1.2);         // warm light under the door
      g.fillStyle = '#4a4440'; g.fillRect(x0 - 2, base, x1 - x0 + 4, 3);                            // stone threshold
    },
    kegs(g, w, h, R){                                        // three kegs on a cradle, two with brass taps
      const base = h - 8, cx = w / 2, r = 17;
      shadowEll(g, cx, base, 46, 5, 0.5);
      g.fillStyle = lg(g, 0, base - 8, 0, base, [[0, '#5a3820'], [1, '#2e1c0e']]); rr(g, 14, base - 7, w - 28, 7, 1.5); g.fill(); grain(g, 15, base - 6, w - 30, 5, R, 6, 0.2);
      g.fillStyle = '#3a2414'; for (const x of [18, w - 22]){ g.beginPath(); g.moveTo(x, base - 7); g.lineTo(x + 4, base - 7); g.lineTo(x + (x < cx ? 7 : -3), base - 44); g.lineTo(x + (x < cx ? 4 : -6), base - 44); g.closePath(); g.fill(); }
      kegEnd(g, cx - 19, base - 7 - r, r, R, true); kegEnd(g, cx + 19, base - 7 - r, r, R, true); kegEnd(g, cx, base - 7 - r * 2.7, r, R, false);
    },
    barrels(g, w, h, R){                                     // two standing barrels, one with an open top of ale
      const base = h - 8; shadowEll(g, w / 2, base, 34, 5, 0.5);
      uprightBarrel(g, 30, base - 4, 30, 42, R); uprightBarrel(g, 56, base, 30, 46, R);
      g.fillStyle = 'rgba(40,24,10,.9)'; g.beginPath(); g.ellipse(30, base - 46, 11, 3.6, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(120,80,30,.55)'; g.beginPath(); g.ellipse(30, base - 45.5, 9, 2.6, 0, 0, TAU); g.fill();
    },
    table(g, w, h, R){                                       // a round tavern table on a trestle
      const cx = w / 2, base = h - 8, ty = 22, rx = 38, ry = 12, th = 4;
      shadowEll(g, cx, base, 34, 6, 0.55);
      g.strokeStyle = '#2a180c'; g.lineWidth = 4; g.lineCap = 'round';
      for (const s of [-1, 1]){ g.beginPath(); g.moveTo(cx + s * 16, ty + 6); g.lineTo(cx + s * 22, base - 1); g.stroke(); }
      g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - 19, base - 9); g.lineTo(cx + 19, base - 9); g.stroke();
      g.fillStyle = '#2e1c0e'; g.beginPath(); g.ellipse(cx, ty + th, rx, ry, 0, 0, TAU); g.fill();
      g.fillStyle = lg(g, cx - rx, ty - ry, cx + rx * 0.6, ty + ry, [[0, '#a06c3c'], [0.45, '#7a4c28'], [1, '#4a2c16']]); g.beginPath(); g.ellipse(cx, ty, rx, ry, 0, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.ellipse(cx, ty, rx - 1, ry - 0.6, 0, 0, TAU); g.clip(); g.strokeStyle = 'rgba(25,12,5,.5)'; g.lineWidth = 0.7;
      for (let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(cx + i * 15, ty - ry); g.lineTo(cx + i * 15 + 4, ty + ry); g.stroke(); }
      vgrain(g, cx - rx, ty - ry, rx * 2, ry * 2, R, 18, 0.16); g.fillStyle = 'rgba(255,230,180,.12)'; g.beginPath(); g.ellipse(cx - 10, ty - 4, 16, 4, -0.1, 0, TAU); g.fill();
      g.fillStyle = 'rgba(60,30,10,.35)'; g.beginPath(); g.arc(cx + 14, ty + 3, 3.4, 0, TAU); g.fill(); g.restore();          // an old ale ring
      g.strokeStyle = 'rgba(255,215,160,.28)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(cx, ty, rx - 0.5, ry - 0.4, 0, 1.05 * Math.PI, 1.95 * Math.PI); g.stroke();
    }
  };
  A.furPic = function(kind){
    if (A.fur[kind]) return A.fur[kind];
    const sz = FUR[kind], S = A.S, cv = document.createElement('canvas'); cv.width = sz[0] * S; cv.height = sz[1] * S;
    const g = cv.getContext('2d'); g.scale(S, S); FURPAINT[kind](g, sz[0], sz[1], rng(kind.length * 977 + kind.charCodeAt(0)));
    return (A.fur[kind] = cv);
  };
  A.furAt = function(ctx, kind, x, gl){                      // same anchor and scale as the VO3 set-piece sprite it replaces
    const pic = A.furPic(kind), sz = FUR[kind], V = window.VO3, s = (1 / A.S) * (V && typeof V.persp === 'function' ? V.persp(gl) : 1) * (window.W3D && A.s0 ? W3D.S / A.s0 : 1);
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(pic, x - sz[0] / 2 * A.S * s, gl - (sz[1] - 8) * A.S * s, pic.width * s, pic.height * s); ctx.imageSmoothingEnabled = sm; return true;
  };
  A.s0 = window.W3D ? W3D.S : 0;

  /* ---- bug fix (16 Nov): the bar fight is fists only, but it opened with the field tip ("Left click shoots ... click an enemy to mark it")
     and the AIM AUTO line said the squad "fires". In a bar fight both now say what the fight is. ---- */
  A.BRAWL_TIP = 'A bar fight: fists only. WASD moves the Leader and everyone brawls on their own. No shields, no abilities, no marks, and nobody dies: a Squad Mate who is knocked out gets up again. Ale on the floor heals.';
  A.BRAWL_LINE = 'BAR FIGHT: fists only';
  function hookTip(){
    if (typeof G_('tip') !== 'function') return;
    (0, eval)(`tip = (function(prev){ return function(id){
      if (id === 'move' && typeof isBrawl === 'function' && isBrawl() && window.TAV48){
        if (!G || !settings().tips) return; META.tipsSeen = META.tipsSeen || {}; if (META.tipsSeen.brawl48) return;
        META.tipsSeen.brawl48 = true; saveMeta(); G.tip = {text:TAV48.BRAWL_TIP, life:540}; return; }
      return prev.apply(this, arguments); }; })(tip);`);
    const M = window.MODE43; if (M && typeof M.text === 'function' && !M.text48){ const f = M.text; M.text = function(){ return (typeof isBrawl === 'function' && isBrawl()) ? A.BRAWL_LINE : f.apply(this, arguments); }; M.text48 = true; }
    A.tipHooked = true;
  }

  /* ---- hooks ---- */
  function hook(){
    if (typeof G_('tavern77') !== 'function' || typeof G_('w3dMapProp') !== 'function'){ A.fails.hook = 'no tavern77 or w3dMapProp'; return; }
    (0, eval)(`tavern77 = (function(prev){ return function(cx, cy){
      if (window.TAV48){ try { return TAV48.room(ctx, cx, cy, MAP, G ? G.frame : 0, CELL, VW, VH, T); } catch (e){ TAV48.fails.room = String(e && e.message || e); } }
      return prev(cx, cy); }; })(tavern77);
    w3dMapProp = (function(prev){ return function(kind, x, gl, o){
      if (window.TAV48 && typeof kind === 'string' && TAV48.isFur(kind) && !(o && o.mirror) && typeof isBrawl === 'function' && isBrawl()){
        try { return TAV48.furAt(ctx, kind.slice(3), x, gl); } catch (e){ TAV48.fails.fur = String(e && e.message || e); } }
      if (window.TAV48 && (kind === 'tv_hearth' || kind === 'tv_candle') && typeof isBrawl === 'function' && isBrawl()){
        try { const t = (o && o.t) || 0; return kind === 'tv_hearth' ? TAV48.hearthAt(ctx, x, gl, t) : TAV48.candleAt(ctx, x, gl, t); } catch (e){ TAV48.fails.prop = String(e && e.message || e); } }
      return prev.apply(this, arguments); }; })(w3dMapProp);`);
    A.hooked = true;
  }
  A.isFur = kind => kind.slice(0, 3) === 'tv_' && !!FUR[kind.slice(3)];
  try { hook(); } catch (e){ A.fails.hook = String(e && e.message || e); }
  try { hookTip(); } catch (e){ A.fails.tip = String(e && e.message || e); }

  A.selfTest = function(){
    const out = {pass:0, fail:0, notes:[]}, ok = (c, n) => { if (c) out.pass++; else { out.fail++; out.notes.push(n); } };
    try {
      ok(A.hooked === true && !A.fails.hook, 'hooks in place');
      const T = G_('T'), C = 40, M = {w:12, h:8, g:[], tables:[{x:4, y:3}]};
      for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) M.g.push(x === 0 || y === 0 || x === M.w - 1 || y === M.h - 1 ? T.WALL : T.FLOOR);
      const pic = paint(M, C, T), g = pic.getContext('2d'), S = A.S;
      ok(pic.width === M.w * C * S && pic.height === M.h * C * S, 'the room picture is the size of the map at 2x');
      const row = g.getImageData(C * S, 3.3 * C * S, (M.w - 2) * C * S, 1).data; let diff = 0, n = 0;
      for (let x = 0; x + C * S < (M.w - 2) * C * S; x += 3){ n++; if (Math.abs(row[x * 4] - row[(x + C * S) * 4]) + Math.abs(row[x * 4 + 1] - row[(x + C * S) * 4 + 1]) > 2) diff++; }
      ok(diff > n * 0.3, 'the floor does not repeat cell by cell (' + diff + ' of ' + n + ')');
      const px = (x, y) => g.getImageData(x * S, y * S, 1, 1).data, lum = d => d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11;
      ok(lum(px(3.5 * C, 22)) > lum(px(3.5 * C, 3)) + 12, 'the back wall shows plaster under a dark beam');
      ok(lum(px(20, 4 * C)) > lum(px(38, 4 * C)) + 20, 'side walls are a pale wall top with a dark edge on the room side');
      const cv = document.createElement('canvas'); cv.width = 480; cv.height = 320; const c2 = cv.getContext('2d');
      const sum = () => { const d = c2.getImageData(0, 0, 480, 320).data; let s = 0; for (let i = 0; i < d.length; i += 37) s += d[i]; return s; };
      const n0 = A.drawn; A.room(c2, 0, 0, M, 0, C, 480, 320, T); A.pic = null; A.key = ''; ok(A.drawn === n0 + 1 && sum() > 0, 'the room draws');
      c2.clearRect(0, 0, 480, 320); A.hearthAt(c2, 240, 200, 0); const h0 = sum(); c2.clearRect(0, 0, 480, 320); A.hearthAt(c2, 240, 200, 9); const h1 = sum();
      ok(h0 > 0 && h0 !== h1, 'the fireplace draws and its fire moves');
      c2.clearRect(0, 0, 480, 320); ok(A.candleAt(c2, 100, 100, 0) === true && sum() > 0, 'a candle draws');
      const f = G_('w3dMapProp'); let thrown = false, r; try { r = f('tv_nothing_48', 0, 0, {}); } catch (e){ thrown = true; }
      ok(!thrown && !r, 'other props pass through to the old drawer');
      Object.keys(FUR).forEach(k => {                      // the furniture: right size, painted, warm oak and not the old near-black block
        const pc = A.furPic(k), d = pc.getContext('2d').getImageData(0, 0, pc.width, pc.height).data; let on = 0, lit = 0, warm = 0;
        for (let i = 0; i < d.length; i += 4 * 7) if (d[i + 3] > 200){ on++; const L = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; if (L > 60) lit++; if (d[i] > d[i + 2] + 10) warm++; }
        ok(pc.width === FUR[k][0] * S && pc.height === FUR[k][1] * S, k + ' is painted at 2x its old size');
        ok(on > 50 && lit > on * 0.2 && warm > on * 0.5, k + ' is warm oak, not a dark block (' + on + '/' + lit + '/' + warm + ')');
        ok(A.isFur('tv_' + k) && A.furPic(k) === pc, k + ' is known and cached'); });
      c2.clearRect(0, 0, 480, 320); ok(A.furAt(c2, 'table', 240, 200) === true && sum() > 0, 'a table draws at its anchor');
      ok(Object.keys(A.fails).length === 0, 'no faults recorded (' + JSON.stringify(A.fails) + ')');
    } catch (e){ out.fail++; out.notes.push(String(e && e.message || e)); }
    return out;
  };
})();
