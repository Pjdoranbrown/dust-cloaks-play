/* Index VO3-1: the world from the bin (Fable consultant, 2026-11-11; brief in audits/fable/vo3.md).
   WHAT   Patrick: "I want the trees, the buildings, the cute flowers on the curb thrown in the bin ... not a filter on the old
          stuff." Every standing thing in the world except the figures is painted here from a blank page, in the Diablo 2 /
          Path of Exile / Witcher direction: earth not lawn, gnarled bare trees that read as silhouettes, weathered timber and
          dark stone under sagging slate and black thatch, iron and rot. No old sprite function is read or called by this file.
   HOW    VO-2's composer already asks STRUCT for a y-sorted list of standing things ({x, y, img, ax, ay, s, shadow, tall, kind}).
          VO3 wraps STRUCT.build: after the walk it swaps every item of a kind it covers for its own sprite (same fields, same
          anchors), recomputes the bounds (palisade masks, wall runs and ends read back off the map), and adds a gate item per run of GATE cells.
          It also hands the composer a muddier ground palette and thins the ground decals (no flowers, fewer leaves).
   KNOBS  VO3.on, VO3.K (heights, canopy density, roof pitch, shadow length), VO3.COVER (kinds taken over), VO3.pal (ground).
   API    VO3.sprite(kind, v, season, o)  a cached sprite; VO3.sheet(season)  one of each for a look check; VO3.selfTest().
   ROLLBACK remove the script tag; STRUCT and VO2 are unchanged. */
(function(){
  'use strict';
  const V = window.VO3 = {
    on: true,
    K: {person: 75, pitch: 35, frameDown: 0.1, persp: 0.22, footprint: 1.5, oakH: 260, pineH: 320, birchH: 230, deadH: 200, wallH: 108, roofH: 96, overhang: 22, tentH: 70, palH: 100, cliffH: 76, cliffSlope: 1, shadowLen: 0.5, shadowBlur: 3,
        canopy: 0.8, grit: 12, rimW: 0.6, rimA: 0.35},
    COVER: {oak: 1, pine: 1, birch: 1, dead: 1, building: 1, tent: 1, boulder: 1, rubble: 1, palisade: 1, wall: 1, cliff: 1, gate: 1},
    // the ground: earth, not lawn (handed to VO2.pal, which applies it while GROUND builds)
    pal: {spring: {grass: '#485234', dirt: '#4e4438', forest: '#2a3424', mud: '#342a22'},
          summer: {grass: '#4c5234', dirt: '#54483a', forest: '#2e3626', mud: '#3a3024'},
          autumn: {grass: '#5a5236', dirt: '#4a3e32', forest: '#322e22', mud: '#34281e'},
          winter: {grass: '#444840', dirt: '#4a4642', forest: '#2a302a', mud: '#302c2a'}},
    motes: false,   // the season particles (pollen, bees, dragonflies, fireflies, blown leaves) are off; winter keeps its rain and snow
    ground: {mottle: 0.3, shadowA: 0.5, shimmer: 0.08},   // the water's shimmer lights are faint on dark water
    decal: {puddle: 0.06, crack: 0.1, bones: 0.01, leaves: 0.12, scorch: 0.02},
    cache: {}, stats: {sprites: 0, ms: 0, swapped: 0}
  };
  const R = 2;   // sprites are painted at twice the screen size and drawn at s = 0.5
  const CELLW = () => (typeof CELL === 'number' ? CELL : 40);
  const light = () => (window.STRUCT && STRUCT.light) || {dir: {x: -0.45, y: 0.85}, elev: 0.8, colour: '#fff1d0', shadow: '#4a5670'};
  const lit = () => (light().dir.x < 0 ? 1 : -1);   // which side of a thing the light falls on (+1 = right)

  /* ---- small painter's kit ---- */
  function rng(seed){ let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function hsh(a, b){ let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 13; return Math.imul(h, 1103515245) >>> 0; }
  const hx = h => { const n = parseInt(String(h).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const cl = v => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = c => 'rgb(' + cl(c[0]) + ',' + cl(c[1]) + ',' + cl(c[2]) + ')';
  const rgba = (c, a) => 'rgba(' + cl(c[0]) + ',' + cl(c[1]) + ',' + cl(c[2]) + ',' + a + ')';
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const COLD = hx('#6a7890'), WARM = hx('#d8a060');
  const cool = (c, k) => mix(c, COLD, k), warm = (c, k) => mix(c, WARM, k);
  /* Stage 5 frame rate: a sprite bake reads its pixels back (trim, grit, the shadow), and each read of a GPU canvas forces a
     sync (40 ms a sprite in a hidden pane; first frame of a Hold 4 to 8 s). Inside spriteBase the canvases are CPU ones, and
     the finished picture and its shadow are copied once to plain canvases, so drawing them each frame costs what it did.
     Measured in Hold T3 (hidden pane): bake 21-41 ms to 10-14 ms a sprite, first frame 4.1-6.2 s to 2.6-2.7 s, steady frames
     unchanged (mean 9-11 ms). CPU and GPU raster differ a little at the edges (mean under 3 of 255). VO3.wrf = false: the old way. */
  let bakeDepth = 0;
  const toGPU = c => { if (!c || !c.getContext) return c; const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(c, 0, 0); return o; };
  function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); if (bakeDepth > 0 && V.wrf !== false) c.getContext('2d', {willReadFrequently: true}); return c; }
  function poly(g, pts, fill, stroke, lw){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); } }
  // a ragged blob: n points round (cx, cy) at radius r, jittered; the thing every canopy, moss patch and rock is made of
  function blob(r_, cx, cy, rad, n, jag){ const pts = []; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, k = 1 - jag * r_() ; pts.push([cx + Math.cos(a) * rad * k, cy + Math.sin(a) * rad * k * 0.9]); } return pts; }
  // grit: per-pixel noise over every painted pixel, the painter's tooth
  function grit(c, amt, seed){ const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, r = rng(seed); for (let i = 0; i < d.length; i += 4){ if (!d[i + 3]) continue; const n = (r() - 0.5) * amt; d[i] = cl(d[i] + n); d[i + 1] = cl(d[i + 1] + n); d[i + 2] = cl(d[i + 2] + n * 0.8); } g.putImageData(im, 0, 0); }
  // rim: a thin cold light along the lit edge of the painted shape (alpha mask shifted against the light)
  function rim(c, col, px, dx, dy){ const w = c.width, h = c.height, m = mk(w, h), mg = m.getContext('2d'); mg.drawImage(c, 0, 0); mg.globalCompositeOperation = 'destination-out'; mg.drawImage(c, dx * px, dy * px); const g = c.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.globalAlpha = V.K.rimA; const m2 = mk(w, h), g2 = m2.getContext('2d'); g2.drawImage(m, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = col; g2.fillRect(0, 0, w, h); g.drawImage(m2, 0, 0); g.restore(); }
  // the cast shadow: the sprite's silhouette laid on the ground along the light, blurred, in the light's shadow colour
  function shadowOf(img, ax, ay, s, len){
    // a sprite point at height h above the base lands at base + (dx*h, dy*h): the silhouette sheared and flattened along the light
    const L = light(), dx = L.dir.x * len, dy = Math.max(0.08, L.dir.y * len), h = ay * s, Lx = dx * h, Ly = dy * h, pad = V.K.shadowBlur * 2 + 2;
    const c = mk(img.width * s + Math.abs(Lx) + pad * 2, Ly + pad * 2), g = c.getContext('2d');
    const bx = pad + Math.max(0, -Lx) + ax * s, by = pad;   // the base point in the shadow canvas
    g.filter = 'blur(' + V.K.shadowBlur + 'px)';
    g.setTransform(s, 0, -dx * s, -dy * s, bx - ax * s + dx * ay * s, by + dy * ay * s);
    g.drawImage(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalCompositeOperation = 'source-in'; g.fillStyle = L.shadow || '#4a5670'; g.fillRect(0, 0, c.width, c.height);
    return {img: c, ax: bx, ay: by};
  }
  // trim the blank margins (the three-quarter buildings paint on a padded canvas) so the sprite's size is what was painted
  function trim(c, ax, ay){
    const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w * 4 + 3; x < w; x++, i += 4) if (d[i]){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return {c, ax, ay};
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
    if (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1) return {c, ax, ay};
    const t = mk(x1 - x0 + 1, y1 - y0 + 1); t.getContext('2d').drawImage(c, -x0, -y0); return {c: t, ax: ax - x0, ay: ay - y0};
  }
  function finish(c, ax, ay, tall, kind, len){ if (kind === 'building' || kind === 'fac'){ const t = trim(c, ax, ay); c = t.c; ax = t.ax; ay = t.ay; } grit(c, V.K.grit, hsh(c.width, c.height) + 5); return {img: c, ax, ay, s: 1 / R, shadow: shadowOf(c, ax, ay, 1 / R, len === undefined ? V.K.shadowLen : len), tall: !!tall, kind}; }

  /* ---- palette by season (grim; colour lives in weather and fire) ---- */
  function P(se){
    const a = se === 'autumn', w = se === 'winter', sp = se === 'spring';
    return {
      bark: hx(w ? '#1e1e20' : '#221b16'), barkL: hx(w ? '#3a3c40' : '#3e342a'), barkD: hx('#15110e'),
      leaf: hx(a ? '#3e3018' : w ? '#262a26' : '#262e1c'), leafL: hx(a ? '#6a4a1e' : w ? '#3a403a' : sp ? '#46522a' : '#3e4a24'), leafD: hx(a ? '#1e160c' : '#10140e'),
      needle: hx(w ? '#1e2824' : '#1c2a22'), needleL: hx(w ? '#3e4e48' : '#34483a'),
      slate: hx('#24282e'), slateL: hx('#3e4650'), thatch: hx('#2c2620'), thatchL: hx('#564a38'), shingle: hx('#3a3028'), shingleL: hx('#5e5244'),
      plaster: hx('#463c34'), plasterD: hx('#2c2520'), timber: hx('#231c16'), stone: hx('#3e3e3c'), stoneL: hx('#5a5a56'), stoneD: hx('#262624'),
      moss: hx(w ? '#3a4438' : '#44502c'), canvas: hx('#4a4238'), canvasD: hx('#2a2420'), canvasL: hx('#6e6252'),
      iron: hx('#1e1e20'), ember: hx('#c8702a'), window: hx('#b07a30'), snow: hx('#b8bcb8'), wet: hx('#8a98a8')
    };
  }

  /* ---- trees: silhouettes first ---- */
  function branches(parts, r, x, y, len, ang, wid, depth, ends){
    const n = depth > 1 ? 2 + (r() < 0.4 ? 1 : 0) : 0;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    // a gnarled branch is three short kinked segments, not one line
    let px = x, py = y; const k = 3; for (let i = 1; i <= k; i++){ const t = i / k, bend = (r() - 0.5) * len * 0.22; const nx = x + (ex - x) * t + Math.cos(ang + Math.PI / 2) * bend, ny = y + (ey - y) * t + Math.sin(ang + Math.PI / 2) * bend; parts.push({x0: px, y0: py, x1: nx, y1: ny, w: wid * (1 - t * 0.35)}); px = nx; py = ny; }
    if (!n){ ends.push([ex, ey]); return; }
    for (let i = 0; i < n; i++){ const a = ang + (r() - 0.5) * 1.5 - 0.25 * (Math.sin(ang) > 0 ? -1 : 1) * 0; branches(parts, r, ex, ey, len * (0.55 + r() * 0.25), a - (Math.sin(a) > -0.2 ? 0.5 : 0) * r(), wid * 0.6, depth - 1, ends); }
  }
  function treeBase(g, p, r, bx, by, wb){
    // roots that grip the ground
    for (let i = 0; i < 5; i++){ const dx = (i - 2) * wb * 0.45 + (r() - 0.5) * wb * 0.3, L = wb * (0.6 + r() * 0.8); poly(g, [[bx + dx * 0.3, by - wb * 0.5], [bx + dx + L * Math.sign(dx || 1) * 0.5, by + 2 + r() * 3], [bx + dx * 0.6, by + 1]], rgb(p.barkD)); }
  }
  function paintTrunk(g, p, r, parts, lt){
    for (const s of parts){ g.strokeStyle = rgb(p.bark); g.lineWidth = s.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.x0, s.y0); g.lineTo(s.x1, s.y1); g.stroke(); }
    // bark: dark fissures down the lit side's opposite, a cold edge on the lit side
    for (const s of parts){ if (s.w < 3) continue; const dx = s.x1 - s.x0, dy = s.y1 - s.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      g.strokeStyle = rgba(p.barkD, 0.7); g.lineWidth = Math.max(1, s.w * 0.22); g.beginPath(); g.moveTo(s.x0 - nx * s.w * 0.25 * lt, s.y0 - ny * s.w * 0.25 * lt); g.lineTo(s.x1 - nx * s.w * 0.25 * lt, s.y1 - ny * s.w * 0.25 * lt); g.stroke();
      g.strokeStyle = rgba(cool(p.barkL, 0.35), 0.5); g.lineWidth = Math.max(1, s.w * 0.12); g.beginPath(); g.moveTo(s.x0 + nx * s.w * 0.4 * lt, s.y0 + ny * s.w * 0.4 * lt); g.lineTo(s.x1 + nx * s.w * 0.4 * lt, s.y1 + ny * s.w * 0.4 * lt); g.stroke(); }
  }
  function canopy(g, p, r, ends, rad, density, lt, leafL){
    // ragged dark masses hung on the branch ends, lit side a shade lighter; sparse enough that the branches show through
    const masses = ends.filter(() => r() < density);
    for (const e of masses){ const n = 11 + (r() * 6 | 0); for (let i = 0; i < n; i++){ const cx = e[0] + (r() - 0.5) * rad * 1.7, cy = e[1] + (r() - 0.35) * rad * 1.3, rr = rad * (0.22 + r() * 0.36);
      poly(g, blob(r, cx, cy, rr, 11 + (r() * 4 | 0), 0.55), rgb(p.leafD));
      if (r() < 0.7) poly(g, blob(r, cx + lt * rr * 0.25, cy - rr * 0.2, rr * 0.65, 10, 0.6), rgba(p.leaf, 0.85));
      if (r() < 0.3) poly(g, blob(r, cx + lt * rr * 0.4, cy - rr * 0.35, rr * 0.28, 8, 0.7), rgba(leafL || p.leafL, 0.4)); } }
    // hanging stragglers under the masses
    for (let i = 0; i < masses.length * 3; i++){ const e = masses[i % masses.length]; const x = e[0] + (r() - 0.5) * rad * 1.5, y = e[1] + rad * (0.5 + r() * 0.6); poly(g, [[x, y], [x + 2 * R, y + rad * 0.5], [x - 1.5 * R, y + rad * 0.45]], rgb(p.leafD)); }
  }
  function tree(kind, v, se){
    const p = P(se), r = rng(hsh(v * 17 + 3, kind.length * 101 + 7)), lt = lit();
    const H = (kind === 'oak' ? V.K.oakH : kind === 'pine' ? V.K.pineH : kind === 'birch' ? V.K.birchH : V.K.deadH) * R;
    const W = H * (kind === 'pine' ? 0.6 : 0.95), pad48 = window.TREE48 !== false && kind !== 'pine' ? Math.round(H * 0.32) : 0;   /* F-48 Art sanity 12: room for the whole crown (it was cut off square at the sprite's edge); TREE48 = false to undo */
    let c = mk(W + 8 * R + pad48 * 2, H + 10 * R + pad48), bx = c.width / 2, by = c.height - 6 * R; const g = c.getContext('2d');
    const lean = (r() - 0.5) * (kind === 'dead' ? 0.5 : 0.25), wb = (kind === 'pine' ? 0.06 : kind === 'birch' ? 0.05 : kind === 'dead' ? 0.075 : 0.09) * H;
    const parts = [], ends = [];
    const trunkTop = H * (kind === 'oak' ? 0.42 : kind === 'birch' ? 0.5 : kind === 'dead' ? 0.6 : 0.9);
    // the trunk: kinked, tapering, leaning
    { let x = bx, y = by, w = wb; const k = 4; for (let i = 1; i <= k; i++){ const t = i / k, nx = bx + lean * trunkTop * t + (r() - 0.5) * wb * 0.6, ny = by - trunkTop * t; parts.push({x0: x, y0: y, x1: nx, y1: ny, w: w}); x = nx; y = ny; w = wb * (1 - t * 0.55); } ends.push([x, y]);
      if (kind !== 'pine'){ const n = kind === 'dead' ? 4 : 3 + (r() * 2 | 0); for (let i = 0; i < n; i++){ const a = -Math.PI / 2 + (i - (n - 1) / 2) * (kind === 'dead' ? 0.75 : 0.6) + (r() - 0.5) * 0.4, yy = by - trunkTop * (0.55 + r() * 0.45), xx = bx + lean * (by - yy); branches(parts, r, xx, yy, H * (kind === 'dead' ? 0.22 : 0.26) * (0.8 + r() * 0.5), a, wb * 0.55, kind === 'dead' ? 3 : 3, ends); } }
      if (kind === 'dead'){ const t = ends[0]; poly(g, [[t[0] - wb * 0.3, t[1] + 2], [t[0] + wb * 0.1, t[1] - H * 0.08], [t[0] + wb * 0.35, t[1] + 1]], rgb(p.barkD)); } }
    treeBase(g, p, r, bx, by, wb);
    if (kind === 'pine'){
      paintTrunk(g, p, r, parts, lt);
      // tiers of drooping needle masses, widest low, ragged, dark; the trunk shows between them
      const tiers = 6 + (v & 1); for (let i = tiers; i >= 1; i--){ const t = i / tiers, y = by - trunkTop * (0.18 + 0.8 * (1 - t)) , wT = W * 0.5 * (0.25 + 0.75 * t) * (0.85 + r() * 0.3), x = bx + lean * (by - y), drop = wT * 0.45;
        const pts = [[x, y - wT * 0.25]]; const n = 7; for (let k = 0; k <= n; k++){ const u = k / n; pts.push([x + wT * (u - 0.5) * 2 * (0.6 + 0.4 * Math.sin(u * Math.PI)), y + drop * (0.4 + 0.6 * Math.sin(u * Math.PI)) * (0.7 + r() * 0.5) + (k % 2 ? -drop * 0.25 : 0)]); }
        poly(g, pts, rgb(i % 2 ? p.needle : mul(p.needle, 0.85)));
        for (let k = 0; k < 4; k++){ poly(g, blob(r, x + lt * wT * (0.12 + r() * 0.3), y + drop * (0.05 + r() * 0.3), wT * (0.05 + r() * 0.05), 7, 0.6), rgba(p.needleL, 0.3)); }   // a few lit needle clumps, not a sheet
        poly(g, pts.map(q => [q[0], q[1] + drop * 0.12]).filter((q, k) => k > 0), rgba(hx('#06080a'), 0.25)); }   // the underside of the tier in shade
      poly(g, [[bx + lean * trunkTop - 3, by - trunkTop + 6], [bx + lean * trunkTop, by - trunkTop - H * 0.08], [bx + lean * trunkTop + 3, by - trunkTop + 6]], rgb(p.needle));
    } else {
      paintTrunk(g, p, r, parts, lt);
      if (kind === 'birch'){ for (const s of parts) if (s.w >= 3){ g.strokeStyle = rgba(hx('#9a9c98'), 0.55); g.lineWidth = s.w * 0.7; g.beginPath(); g.moveTo(s.x0, s.y0); g.lineTo(s.x1, s.y1); g.stroke(); for (let i = 0; i < 6; i++){ const t = r(); g.fillStyle = rgb(p.barkD); g.fillRect(s.x0 + (s.x1 - s.x0) * t - s.w * 0.4, s.y0 + (s.y1 - s.y0) * t, s.w * 0.8, 1.5 * R); } } }
      if (kind !== 'dead') canopy(g, p, r, ends, H * (kind === 'oak' ? 0.13 : 0.1), V.K.canopy * (kind === 'birch' ? 0.8 : 1), lt, kind === 'birch' ? mix(p.leafL, hx('#a0a060'), 0.15) : null);
      else if (v === 3){ for (let i = 0; i < 2; i++){ const e = ends[1 + (r() * (ends.length - 1) | 0)] || ends[0]; poly(g, blob(r, e[0], e[1], H * 0.04, 9, 0.6), rgb(p.leafD)); } }
    }
    if (se === 'winter') for (const s of parts) if (s.w > 4){ g.fillStyle = rgba(p.snow, 0.6); g.fillRect(Math.min(s.x0, s.x1), Math.min(s.y0, s.y1) - 1, Math.abs(s.x1 - s.x0) + 2, 2 * R); }
    if (pad48){ try {   // trim the spare room back to the painted crown, so cover and fade tests keep a tight box
      const w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data; let x0 = w, x1 = -1, y0 = h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; }
      if (x1 >= x0){ x0 = Math.max(0, x0 - 3); x1 = Math.min(w - 1, x1 + 3); y0 = Math.max(0, y0 - 3);
        const c2 = mk(x1 - x0 + 1, h - y0); c2.getContext('2d').drawImage(c, -x0, -y0); c = c2; bx -= x0; by -= y0; }
    } catch (e) {} }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -lt, 0.3);
    return finish(c, bx, by, true, kind, kind === 'pine' ? 0.42 : 0.5);
  }

  /* ---- buildings: weathered timber and dark stone under a sagging roof ---- */
  const segD = (px, py, b) => { const dx = b[2] - b[0], dy = b[3] - b[1], t = Math.max(0, Math.min(1, ((px - b[0]) * dx + (py - b[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - b[0] - t * dx, py - b[1] - t * dy); };   /* INDEX F48: distance from a point to a brace */
  function building(v, se, o){
    const F = V.K.facade || null, p = Object.assign(P(se), F && F.pal ? Object.fromEntries(Object.entries(F.pal).map(([k, c]) => [k, hx(c)])) : {}), C = CELLW()   /* INDEX F28: the facade standard (lit side, palette, roof per kind, shadow) */ * R * ((o && o.foot) || V.K.footprint), w = Math.max(1, ((o && o.w) || 2) * ((o && o.wide) || 1)), d = Math.max(1, (o && o.d) || 2), r = rng(hsh(v * 7 + w * 31, d * 13 + 5)), lt = lit();   /* INDEX S26: o.wide widens the cells (the facilities' houses) */   /* camera standard scale table: a 40 px cell is under a metre, so the drawn footprint is the cells times K.footprint; the cells stay the collision */
    const over = V.K.overhang * R, W = w * C + over * 1.2, HW = V.K.wallH * R * (o && o.upper && window.BLDG48 !== false ? Math.max(1.65, (o && o.wall) || 1) : ((o && o.wall) || 1)),   /* INDEX F48: a jetty storey needs the two-storey wall, or the jetty beam crosses the door */ RD = d * C * 0.78,   /* INDEX S26: o.wall lowers the wall */ RH = o && o.roof ? o.roof * R : Math.max(RD * 0.81, HW * 0.4);   /* camera standard: a 40-degree roof seen from 35 degrees shows its near slope only, 0.81 of the foreshortened depth (half the real depth times sin 35 + tan 40 cos 35); the ridge runs along the width, so the width does not raise it */   // the wall stands a person high and the roof rises RH above the eave; both overhang the footprint
    // seen from high three-quarters (the Diablo 2 / Path of Exile camera, Patrick 2026-11-12): a side wall and gable recede on the shaded end, the ridge sits half the depth back, both roof slopes show from above
    // the camera looks down from high three-quarters, so the plan shows: a house is at least six tenths as deep as it is wide whatever the old footprint said, the depth foreshortened to 0.6 and climbing at about 30 degrees
    const sd = lt > 0 ? 1 : -1, RDv = Math.max(RD, W * 0.6), SD = Math.min(RDv * 0.6, 80 * R), SY = SD * 0.55, ox = sd * SD, oy = -SY;
    const c = mk(W + over * 2 + SD + 6 * R, HW + RH + SY + 12 * R), g = c.getContext('2d'), x0 = over + 3 * R + (sd < 0 ? SD : 0), by = c.height - 4 * R, ye = by - HW;   // ye: the eave line
    const yr = ye - RH;   // the ridge height
    const sag = (3 + r() * 5) * R, tilt = (r() - 0.5) * 6 * R, foot = 13 * R;
    const xe = sd > 0 ? x0 + W : x0;   // the end of the front wall where the side wall starts
    // the side wall: dark plaster peeling to brick on a stone footing, posts along the slant, a slit window, the gable up to the ridge
    { const sideD = F ? mix(p.plaster, hx(light().colour), F.sideLit) : mul(p.plasterD, 0.7);   /* INDEX F28: the side wall faces the light */
      poly(g, [[xe, by], [xe + ox, by + oy], [xe + ox, ye + oy], [xe, ye]], rgb(sideD));
      g.save(); g.beginPath(); g.moveTo(xe, by); g.lineTo(xe + ox, by + oy); g.lineTo(xe + ox, ye + oy); g.lineTo(xe, ye); g.closePath(); g.clip();
      for (let i = 0; i < 4; i++){ const t = r(), x = xe + ox * t, y = ye + oy * t + HW * (0.15 + r() * 0.6), bp48 = blob(r, x, y, (5 + r() * 7) * R, 8, 0.6); if (window.BLDG48 !== false && Math.abs(t - 0.5) < 0.3 && y < ye + oy * 0.5 + HW * 0.3 + 40 * R) continue;   /* INDEX F48: no brick patch behind the side window */ poly(g, bp48, rgb(mix(hx('#4a2e22'), p.stoneD, 0.5))); for (let j = 0; j < 4; j++) g.fillRect(x - 6 * R + (j % 2) * 3 * R, y - 4 * R + j * 2.5 * R, 6 * R, 1 * R); }
      for (let i = 0; i < 6; i++){ const t = r(), x = xe + ox * t; g.fillStyle = rgba(hx('#0c0a08'), 0.35); g.fillRect(x, ye + oy * t, (2 + r() * 4) * R, HW * (0.3 + r() * 0.6)); }
      g.restore();
      poly(g, [[xe, by], [xe + ox, by + oy], [xe + ox, by + oy - foot], [xe, by - foot]], rgb(mul(p.stone, 0.72)));
      for (let i = 1; i < 3; i++){ const t = i / 3, x = xe + ox * t; g.fillStyle = rgb(mul(p.timber, 0.7)); g.fillRect(x - 1.4 * R, ye + oy * t, 2.8 * R, HW - foot); }
      { const x = xe + ox * 0.5, y = ye + oy * 0.5 + HW * 0.3; g.fillStyle = rgb(mul(p.timber, 0.6)); g.fillRect(x - 5 * R, y - 1.5 * R, 10 * R, 25 * R); g.fillStyle = rgb(hx('#0c0e10')); g.fillRect(x - 3.5 * R, y, 7 * R, 22 * R); }
      poly(g, [[xe, ye], [xe + ox, ye + oy], [xe + ox * 0.5, yr + oy * 0.5 + 2 * R]], rgb(F ? mix(sideD, p.plasterD, 0.2) : mul(p.plasterD, 0.78)));   /* INDEX F28 */
      g.fillStyle = rgb(mul(p.timber, 0.7)); g.fillRect(xe + ox * 0.5 - 1.5 * R, yr + oy * 0.5 + 2 * R, 3 * R, ye + oy * 0.5 - (yr + oy * 0.5 + 2 * R)); g.fillRect(xe + ox * 0.5 - 1.5 * R, ye + oy * 0.5 - HW * 0.45, 3 * R, HW * 0.45);
      const sg = g.createLinearGradient(xe, 0, xe + ox, 0); sg.addColorStop(0, F ? 'rgba(255,236,190,.16)' : 'rgba(0,0,0,.35)'); sg.addColorStop(1, F ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.05)');   /* INDEX F28: light at the corner, shade at the far end */ g.fillStyle = sg; poly(g, [[xe, by], [xe + ox, by + oy], [xe + ox * 0.5, yr + oy * 0.5], [xe, ye]], null); g.beginPath(); g.moveTo(xe, by); g.lineTo(xe + ox, by + oy); g.lineTo(xe + ox, ye + oy); g.lineTo(xe + ox * 0.5, yr + oy * 0.5 + 2 * R); g.lineTo(xe, ye); g.closePath(); g.fill(); }
    // the front wall: stone footing, dark plaster, timber frame, water stains, deep windows, a door
    g.fillStyle = rgb(p.plasterD); g.fillRect(x0, ye, W, HW);
    g.fillStyle = rgb(p.plaster); g.fillRect(x0, ye + HW * 0.35, W, HW * 0.65);
    for (let i = 0; i < 7; i++){ const x = x0 + r() * W; g.fillStyle = rgba(p.plasterD, 0.5); g.fillRect(x, ye, (2 + r() * 5) * R, HW * (0.4 + r() * 0.6)); }
    g.fillStyle = rgb(p.stone); g.fillRect(x0, by - foot, W, foot); for (let x = x0; x < x0 + W; x += (10 + r() * 8) * R){ g.fillStyle = rgba(p.stoneD, 0.8); g.fillRect(x, by - foot, 1.6 * R, foot); g.fillStyle = rgba(p.stoneL, 0.35); g.fillRect(x + 2 * R, by - foot + 2 * R, 5 * R, 1.5 * R); }
    const B44 = window.BLDG44 !== false, GEO = {win: [], door: null, quoin: [], beam: [], post: [], decal: [], R};   /* INDEX F44 (i)(j): building sanity rules; kill switch BLDG44 = false */ const bays = Math.max(2, Math.round(w * 1.6)); g.fillStyle = rgb(p.timber); for (let i = 0; i <= bays; i++) GEO.post.push([x0 + i * W / bays - 1.6 * R, ye, 3.2 * R, HW - foot]); GEO.beam.push([x0, ye + HW * 0.35, W, 3 * R]); for (let i = 0; i <= bays; i++){ const x = x0 + i * W / bays; g.fillRect(x - 1.6 * R, ye, 3.2 * R, HW - foot); } g.fillRect(x0, ye + HW * 0.35, W, 3 * R); const B48 = window.BLDG48 !== false, brace48 = []; GEO.brace = []; for (let i = 0; i < bays; i++) if (r() < 0.5){ const x = x0 + i * W / bays, bw = W / bays; if (B48 && B44){ brace48.push([x, ye + HW * 0.37, x + bw, by - foot]); continue; } g.beginPath(); g.moveTo(x, ye + HW * 0.37); g.lineTo(x + bw, by - foot); g.lineWidth = 3 * R; g.strokeStyle = rgb(p.timber); g.stroke(); }
    const dw = ((o && o.dw) || 36) * R, dh = ((o && o.door) || 82) * R, door = x0 + W * (0.2 + r() * 0.6) - dw / 2;   /* INDEX S26: o.door / o.dw size the door (the facilities pass V.K.facHouse) */ g.fillStyle = rgb(p.timber); g.fillRect(door - 2 * R, by - dh - 2 * R, dw + 4 * R, dh + 2 * R); g.fillStyle = rgb(mul(p.timber, 0.55)); g.fillRect(door, by - dh, dw, dh); for (let i = 1; i < 4; i++){ g.fillStyle = rgba(hx('#0c0a08'), 0.5); g.fillRect(door + dw * i / 4, by - dh, 0.8 * R, dh); } g.fillStyle = rgba(p.iron, 0.9); g.fillRect(door + 2 * R, by - dh * 0.78, dw * 0.7, 2.2 * R); g.fillRect(door + 2 * R, by - dh * 0.25, dw * 0.7, 2.2 * R); g.fillStyle = rgb(p.iron); g.fillRect(door + dw - 7 * R, by - dh * 0.48, 3 * R, 3 * R); V._doorH = dh / R; GEO.door = [door - 2 * R, by - dh - 2 * R, dw + 4 * R, dh + 2 * R];
    const nwin = Math.max(1, w - 1), bw44 = W / bays, win44 = (bi, y, wh, wmax) => { let lo = x0 + bi * bw44 + 3 * R, hi = x0 + (bi + 1) * bw44 - 3 * R; if (bi === 0) lo = x0 + 12 * R; if (bi === bays - 1) hi = x0 + W - 12 * R; const ww = Math.min(wmax, hi - lo - 3 * R); if (ww < 12 * R) return null; const x = (lo + hi) / 2; if (Math.abs(x - door - dw / 2) < ww / 2 + dw / 2 + (B48 ? 10 : 5) * R) return null; return {x, y, ww, wh}; };
    const used48 = {}; if (B44) for (let i = 0; i < nwin; i++){ const wy48 = (o && o.upper) ? ye + HW * 0.08 : ye + HW * 0.35 + 8 * R, wh48 = (o && o.upper) ? 24 * R : Math.min(30 * R, HW - foot - HW * 0.35 - 14 * R), b048 = Math.min(bays - 1, Math.floor((i + 0.5) * bays / nwin)); let wr = used48[b048] ? null : win44(b048, wy48, wh48, 22 * R), wb48 = b048; if (!wr && B48) for (let bi = 0; bi < bays && !wr; bi++) if (!used48[bi]){ wr = win44(bi, wy48, wh48, 22 * R); wb48 = bi; }   /* INDEX F48: a bay the door blocks hands its window to the next free bay */ if (!wr) continue; used48[wb48] = 1; const {x, y, ww, wh} = wr; GEO.win.push([x - ww / 2 - 1.5 * R, y - 1.5 * R, ww + 3 * R, wh + 3 * R]); g.fillStyle = rgb(p.plaster); g.fillRect(x - ww / 2 - 3 * R, y - 3 * R, ww + 6 * R, wh + 6 * R); g.fillStyle = rgb(p.timber); g.fillRect(x - ww / 2 - 1.5 * R, y - 1.5 * R, ww + 3 * R, wh + 3 * R); const litW = (i === 0 && r() < 0.5) || !!(F && light().elev < 0.5); g.fillStyle = litW ? rgb(p.window) : rgb(hx('#101214')); g.fillRect(x - ww / 2, y, ww, wh); g.fillStyle = rgb(p.timber); g.fillRect(x - 1 * R, y, 2 * R, wh); g.fillRect(x - ww / 2, y + wh * 0.5, ww, 2 * R); if (litW){ g.fillStyle = rgba(p.window, F ? 0.3 : 0.18); if (B48) g.fillRect(x - ww / 2 - 3 * R, y - 3 * R, ww + 6 * R, wh + 6 * R); else g.fillRect(x - ww * 0.8, y - 2 * R, ww * 1.6, wh + 6 * R); } }
    else for (let i = 0; i < nwin; i++){ const x = x0 + W * (i + 0.5) / nwin + (r() - 0.5) * 20 * R; if (Math.abs(x - door - dw / 2) < 32 * R) continue; const ww = 22 * R, wh = 30 * R, y = ye + HW * ((o && o.upper) ? 0.1 : 0.3); g.fillStyle = rgb(p.timber); g.fillRect(x - ww / 2 - 1.5 * R, y - 1.5 * R, ww + 3 * R, wh + 3 * R); const litW = (i === 0 && r() < 0.5) || !!(F && light().elev < 0.5);   /* INDEX F28 batch 2: every window lit at dusk */ g.fillStyle = litW ? rgb(p.window) : rgb(hx('#101214')); g.fillRect(x - ww / 2, y, ww, wh); g.fillStyle = rgb(p.timber); g.fillRect(x - 1 * R, y, 2 * R, wh); g.fillRect(x - ww / 2, y + wh * 0.5, ww, 2 * R); if (litW){ g.fillStyle = rgba(p.window, F ? 0.3 : 0.18);   /* INDEX F28 */ g.fillRect(x - ww, y - 2 * R, ww * 2, wh + 6 * R); } }
    if (o && o.upper){ /* INDEX ART37: a second storey: a jetty beam at mid height and a lower row of windows either side of the door */
      g.fillStyle = rgb(mul(p.timber, 0.8)); g.fillRect(x0 - 2 * R, ye + HW * 0.47, W + 4 * R, 5 * R); GEO.beam.push([x0 - 2 * R, ye + HW * 0.47, W + 4 * R, 9 * R]); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, ye + HW * 0.47 + 5 * R, W, 4 * R);
      for (let i = 0; i < 2; i++){ let x = x0 + W * (i ? 0.78 : 0.22), ww = 20 * R, wh = 24 * R, y = by - foot - wh - 14 * R; if (B44){ y = ye + HW * 0.47 + 13 * R; wh = Math.min(24 * R, by - foot - 4 * R - y); const wr = win44(Math.min(bays - 1, Math.floor((i ? 0.78 : 0.22) * bays)), y, wh, 20 * R); if (!wr) continue; x = wr.x; ww = wr.ww; GEO.win.push([x - ww / 2 - 1.5 * R, y - 1.5 * R, ww + 3 * R, wh + 3 * R]); g.fillStyle = rgb(p.plaster); g.fillRect(x - ww / 2 - 3 * R, y - 3 * R, ww + 6 * R, wh + 6 * R); } else if (Math.abs(x - door - dw / 2) < 30 * R) continue; g.fillStyle = rgb(p.timber); g.fillRect(x - ww / 2 - 1.5 * R, y - 1.5 * R, ww + 3 * R, wh + 3 * R); const lw = light().elev < 0.5; g.fillStyle = lw ? rgb(p.window) : rgb(hx('#101214')); g.fillRect(x - ww / 2, y, ww, wh); g.fillStyle = rgb(p.timber); g.fillRect(x - R, y, 2 * R, wh); g.fillRect(x - ww / 2, y + wh * 0.5, ww, 2 * R); if (lw){ g.fillStyle = rgba(p.window, 0.28); if (B48 && B44) g.fillRect(x - ww / 2 - 3 * R, y - 3 * R, ww + 6 * R, wh + 6 * R); else g.fillRect(x - ww, y - 2 * R, ww * 2, wh + 6 * R); } } }
    if (brace48.length){ /* INDEX F48: a brace only crosses a bay with no window or door in its height, and passes behind the jetty beam */ const ov = (a, x1, y1, x2, y2) => a[0] < Math.max(x1, x2) && Math.min(x1, x2) < a[0] + a[2] && a[1] < Math.max(y1, y2) && Math.min(y1, y2) < a[1] + a[3]; g.save(); g.beginPath(); g.rect(x0, ye, W, HW); for (const b of GEO.beam) if (b[3] > 4 * R) g.rect(b[0] + b[2], b[1], -b[2], b[3]); g.clip('evenodd'); for (const b of brace48){ if (GEO.win.concat([GEO.door]).some(q => ov(q, b[0] - 3 * R, b[1], b[2] + 3 * R, b[3]))) continue; GEO.brace.push(b); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[2], b[3]); g.lineWidth = 3 * R; g.strokeStyle = rgb(p.timber); g.stroke(); } g.restore(); }
    // the eave shadow on the wall
    const sh = g.createLinearGradient(0, ye, 0, ye + HW * 0.4); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(x0, ye, W, HW * 0.4);
    // the plaster peels to brick in patches; stone quoins stand at the corners (the Witcher reference)
    GEO.quoin.push([x0, ye, 10 * R, HW - foot], [x0 + W - 10 * R, ye, 10 * R, HW - foot]);
    for (let i = 0; i < 2 + w; i++){ const x = x0 + 10 * R + r() * (W - 20 * R), y = ye + HW * (0.15 + r() * 0.55), rad = (6 + r() * 8) * R; let x48 = null, y48 = 0, r48 = 0; if (Math.abs(x - door - dw / 2) < 26 * R) continue; if (B44){ const hit = q => { const nx = Math.max(q[0], Math.min(x, q[0] + q[2])), ny = Math.max(q[1], Math.min(y, q[1] + q[3])); return Math.hypot(x - nx, y - ny) < rad * 1.3 + 3 * R; }; if (GEO.win.some(hit) || hit(GEO.door)) continue; if (B48 && (GEO.post.concat(GEO.quoin, GEO.beam).some(hit) || GEO.brace.some(b => segD(x, y, b) < rad * 1.3 + 3 * R))) { const bw = W / bays, bi = Math.max(0, Math.min(bays - 1, Math.floor((x - x0) / bw))), top = GEO.beam.reduce((m, b) => Math.max(m, b[1] + b[3]), ye), px = x0 + (bi + 0.5) * bw, py = (top + by - foot) / 2, pr = Math.min(rad, (bw / 2 - 6 * R) / 1.3, ((by - foot - top) / 2 - 5 * R) / 1.3); const free = pr >= 4 * R && ![GEO.door].concat(GEO.win, GEO.quoin).some(q => q[0] < px + bw / 2 && px - bw / 2 < q[0] + q[2] && q[1] < by - foot && top < q[1] + q[3]) && !GEO.brace.some(b => Math.abs((b[0] + b[2]) / 2 - px) < bw / 2) && !GEO.decal.some(d => Math.abs(d[0] - px) < bw / 2); if (!free) continue; x48 = px; y48 = py; r48 = pr; } GEO.decal.push([x48 === null ? x : x48, x48 === null ? y : y48, (x48 === null ? rad : r48) * 1.3]); } { const X = x48 === null ? x : x48, Y = x48 === null ? y : y48, RAD = x48 === null ? rad : r48; g.save(); poly(g, blob(r, X, Y, RAD, 9, 0.6), rgb(mix(hx('#4a2e22'), p.stoneD, 0.45))); g.clip(); g.fillStyle = rgba(hx('#0c0a08'), 0.4); for (let j = -4; j < 5; j++) g.fillRect(X - 16 * R + (j % 2) * 4 * R, Y + j * 3 * R, 32 * R, 0.9 * R); for (let j = 0; j < 6; j++) g.fillRect(X - 14 * R + j * 6 * R, Y - 12 * R, 0.9 * R, 24 * R); g.restore(); } }
    for (const qx of [x0, x0 + W]){ for (let y = by - foot - 9 * R, k = 0; y > ye + 2 * R; y -= 9 * R, k++){ const qw = (k % 2 ? 7 : 10) * R; g.fillStyle = rgb(mix(p.stone, p.stoneL, 0.3)); g.fillRect(qx === x0 ? qx : qx - qw, y, qw, 8 * R); g.fillStyle = rgba(p.stoneD, 0.6); g.fillRect(qx === x0 ? qx : qx - qw, y + 7 * R, qw, 1 * R); } }
    // the front wall turns from the light; the ground throws a dark band up its foot
    { const wg = g.createLinearGradient(lt > 0 ? x0 : x0 + W, 0, lt > 0 ? x0 + W : x0, 0); wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, F ? 'rgba(10,14,24,.38)' : 'rgba(0,0,0,.28)'); g.fillStyle = wg; g.fillRect(x0, ye, W, HW);   /* INDEX F28 */
      const bg = g.createLinearGradient(0, by - 14 * R, 0, by); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = bg; g.fillRect(x0, by - 14 * R, W, 14 * R); }   /* SW-4: the foot band stays on the front wall (it ran over * 2 + SD wider, a grey strip past both corners) */
    // the roof: the front slope from the eave to a sagging ridge set half the depth back, the back slope beyond it down to the back eave, overhang both sides
    const xl = x0 - over, xr = x0 + W + over, rx = ox * 0.5, ry = oy * 0.5;
    const ridge = [[xl + 2 * R + rx, yr + tilt + ry], [(xl + xr) / 2 + rx, yr + sag + ry], [xr - 2 * R + rx, yr - tilt + ry]];
    const rk = F && o && o.fk && F.roof && F.roof[o.fk], roofCol = rk ? hx(rk[0]) : v === 0 ? p.slate : v === 1 ? p.thatch : p.shingle, roofL = rk ? hx(rk[1]) : v === 0 ? p.slateL : v === 1 ? p.thatchL : p.shingleL;   /* INDEX F28: a roof colour per facility kind */
    const frontP = () => { g.beginPath(); g.moveTo(xl, ye + 1 * R); g.lineTo(xr, ye + 1 * R); g.lineTo(ridge[2][0], ridge[2][1]); g.quadraticCurveTo(ridge[1][0], ridge[1][1] + sag, ridge[0][0], ridge[0][1]); g.closePath(); };
    const backP = () => { g.beginPath(); g.moveTo(ridge[0][0], ridge[0][1]); g.quadraticCurveTo(ridge[1][0], ridge[1][1] + sag, ridge[2][0], ridge[2][1]); g.lineTo(ridge[2][0] + ox * 0.08, ridge[2][1] - 3 * R); g.quadraticCurveTo(ridge[1][0] + ox * 0.08, ridge[1][1] + sag - 3 * R, ridge[0][0] + ox * 0.08, ridge[0][1] - 3 * R); g.closePath(); };   /* the far slope is hidden behind the ridge; this is the ridge cap */
    const shear = y => rx * Math.max(0, Math.min(1, (ye - y) / RH));
    backP(); g.fillStyle = rgb(mul(roofCol, 0.66)); g.fill(); { const vg = g.createLinearGradient(0, yr + ry, 0, ye + oy); vg.addColorStop(0, 'rgba(0,0,0,.4)'); vg.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = vg; g.fill(); }
    g.save(); backP(); g.clip(); { const rows = Math.round(RH / (7 * R)); for (let i = 1; i < rows; i++){ const y = yr + ry + (ye + oy - yr - ry) * i / rows; g.strokeStyle = rgba(mul(roofCol, 0.45), 0.7); g.lineWidth = 1.1 * R; g.beginPath(); g.moveTo(xl + ox, y); g.lineTo(xr + ox, y); g.stroke(); } } g.restore();
    frontP(); g.fillStyle = rgb(roofCol); g.fill();
    { const lg = g.createLinearGradient(lt > 0 ? xl : xr, 0, lt > 0 ? xr : xl, 0); lg.addColorStop(0, F ? 'rgba(255,236,190,.24)' : 'rgba(190,200,215,.16)'); lg.addColorStop(1, F ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.42)');   /* INDEX F28 */ g.fillStyle = lg; g.fill();   // the slope turns away from the light
      const vg = g.createLinearGradient(0, yr + ry, 0, ye); vg.addColorStop(0, 'rgba(170,180,195,.14)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = vg; g.fill(); }   // and falls from the ridge to the eave
    // courses on the front slope, sheared toward the ridge: slate rows, thatch strokes or tile rows with a wet highlight toward the light
    g.save(); frontP(); g.clip();
    if (v === 1){ for (let i = 0; i < W * RH / (60 * R * R); i++){ const y = ye - r() * RH * 0.95, x = xl - SD + r() * (xr - xl + SD * 2), L = (6 + r() * 10) * R; g.strokeStyle = rgba(r() < 0.5 ? roofL : mul(roofCol, 0.6), 0.5); g.lineWidth = 1 * R; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2 * R, y + L); g.stroke(); } for (let x = xl - 4 * R; x < xr + 4 * R; x += 4 * R){ g.fillStyle = rgb(roofCol); g.fillRect(x, ye - 1 * R, 3 * R, (3 + r() * 6) * R); } }
    else { const rows = Math.round(RH / (6 * R)); for (let i = 1; i < rows; i++){ const y = ye - i * (RH / rows) + Math.sin(i * 1.7) * 2 * R, sx = shear(y); g.strokeStyle = rgba(mul(roofCol, 0.55), 0.8); g.lineWidth = 1.2 * R; g.beginPath(); g.moveTo(xl - SD + sx, y + 1 * R); g.lineTo(xr + SD + sx, y - 1 * R); g.stroke(); for (let x = xl - SD + (i % 2) * 5 * R; x < xr + SD; x += 10 * R){ g.fillStyle = rgba(roofL, 0.35 * (lt > 0 ? (x - xl) / (xr - xl) : 1 - (x - xl) / (xr - xl))); g.fillRect(x + sx, y - 5 * R, 4 * R, 2 * R); if (v === 2) { g.fillStyle = rgba(mul(roofCol, 0.5), 0.5); g.fillRect(x + sx + 4 * R, y - 6 * R, 1 * R, 6 * R); } } } }
    // moss and stains near the eave, a broken patch
    for (let i = 0; i < 3 + w; i++){ const y = ye - r() * RH * 0.2; poly(g, blob(r, xl + shear(y) + r() * (xr - xl), y, (5 + r() * 8) * R, 9, 0.6), rgba(p.moss, 0.6)); }
    if (r() < 0.6){ const y = ye - RH * 0.3 - r() * RH * 0.35, x = xl + shear(y) + r() * (xr - xl - 24 * R); poly(g, blob(r, x, y, 9 * R, 8, 0.5), rgb(mul(roofCol, 0.4))); g.fillStyle = rgb(p.timber); g.fillRect(x - 7 * R, y - 1 * R, 14 * R, 2 * R); }
    g.restore();
    // the ridge line and the eaves' shadow lines
    g.strokeStyle = rgba(cool(roofL, 0.4), 0.9); g.lineWidth = 3 * R; g.beginPath(); g.moveTo(ridge[0][0], ridge[0][1]); g.quadraticCurveTo(ridge[1][0], ridge[1][1] + sag, ridge[2][0], ridge[2][1]); g.stroke();
    g.strokeStyle = rgba(hx('#0c0a08'), 0.5); g.lineWidth = 1.5 * R; g.beginPath(); g.moveTo(xl, ye + 1.5 * R); g.lineTo(xr, ye + 1.5 * R); g.stroke();
    // a chimney of black stone on the ridge toward the lit end; its mouth is remembered so the camp's smoke rises from it
    let chim = null;
    if (r() < 0.75 || (o && o.chimney)){ const cx = ridge[lt > 0 ? 2 : 0][0] - lt * W * 0.22, cy = ridge[lt > 0 ? 2 : 0][1] + (lt > 0 ? tilt : -tilt) * 0.3; g.fillStyle = rgb(p.stoneD); g.fillRect(cx - 5 * R, cy - 18 * R, 10 * R, 20 * R); g.fillStyle = rgba(p.stoneL, 0.35); g.fillRect(cx - 5 * R + (lt > 0 ? 0 : 7 * R), cy - 18 * R, 3 * R, 20 * R); g.fillStyle = rgb(p.stone); g.fillRect(cx - 6 * R, cy - 20 * R, 12 * R, 3 * R); g.fillStyle = rgb(hx('#0c0a08')); g.fillRect(cx - 3 * R, cy - 21 * R, 6 * R, 1.5 * R); chim = {x: cx, y: cy - 21 * R}; }
    if (se === 'winter'){   // SW-1: the snow strips along the eaves are clipped to their roof slope; as plain rectangles they ran past the slanted ends as pale lines across the houses
      g.fillStyle = rgba(p.snow, 0.5);
      g.save(); frontP(); g.clip(); g.fillRect(xl, ye - 5 * R, xr - xl, 6 * R); g.restore();
      g.save(); backP(); g.clip(); g.fillRect(xl + ox, ye + oy - 4 * R, xr - xl, 5 * R); g.restore(); }
    rim(c, rgba(cool(hx('#c8d0dc'), 0.2), 1), V.K.rimW * R, -lt, 0.4);
    const sp = finish(c, x0 + W / 2, by, true, 'building', F ? F.shadowLen : 0.42);   /* INDEX F28 */ if (chim) sp.chim = {x: chim.x - (x0 + W / 2), y: chim.y - by}; sp.geo = GEO; return sp;
  }

  /* ---- tents: dark sagging canvas on rough poles ---- */
  function tent(v, se, o){
    const p = P(se), C = CELLW() * R * ((o && o.foot) || V.K.footprint), w = Math.max(1, (o && o.w) || 1), r = rng(hsh(v * 5 + 11, w * 3 + 2)), lt = lit();
    const W = Math.max(w * C, 2 * C) + 16 * R, H = V.K.tentH * R + (w - 1) * 10 * R, c = mk(W + 16 * R, H + 10 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 5 * R;
    const xl = bx - W / 2, xr = bx + W / 2, top = by - H, sag = 8 * R;
    poly(g, [[xl, by], [xl + W * 0.18, top + sag * 1.5], [bx, top], [xr - W * 0.18, top + sag * 1.5], [xr, by]], rgb(p.canvasD));
    poly(g, [[bx, top], [xr - W * 0.18, top + sag * 1.5], [xr, by], [bx, by]], rgba(lt > 0 ? p.canvas : p.canvasD, 0.9));
    poly(g, [[bx, top], [xl + W * 0.18, top + sag * 1.5], [xl, by], [bx, by]], rgba(lt < 0 ? p.canvas : p.canvasD, 0.9));
    // the opening: a dark slit, a flap tied back
    poly(g, [[bx - 9 * R, by], [bx - 2 * R, top + H * 0.35], [bx + 3 * R, top + H * 0.4], [bx + 9 * R, by]], rgb(hx('#0e0c0a')));
    poly(g, [[bx + 3 * R, top + H * 0.4], [bx + 20 * R, top + H * 0.5], [bx + 13 * R, by]], rgb(p.canvasL));
    // patches, seams, mud at the hem, a pole and guy ropes to stakes
    for (let i = 0; i < 3; i++){ const x = xl + W * (0.15 + r() * 0.7), y = top + H * (0.3 + r() * 0.5); g.fillStyle = rgba(r() < 0.5 ? p.canvasL : mul(p.canvasD, 0.8), 0.8); g.fillRect(x, y, (7 + r() * 9) * R, (5 + r() * 7) * R); }
    g.strokeStyle = rgba(p.canvasD, 0.9); g.lineWidth = 1.5 * R; for (let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(bx, top); g.lineTo(xl + W * i / 4, by); g.stroke(); }
    g.fillStyle = rgba(hx('#2a2018'), 0.7); g.fillRect(xl, by - 5 * R, W, 5 * R);
    g.fillStyle = rgb(p.timber); g.fillRect(bx - 1.5 * R, top - 10 * R, 3 * R, 12 * R);
    g.strokeStyle = rgba(hx('#8a8070'), 0.8); g.lineWidth = 1.2 * R; for (const s of [-1, 1]){ g.beginPath(); g.moveTo(bx + s * W * 0.28, top + sag * 1.5); g.lineTo(bx + s * (W / 2 + 7 * R), by + 2 * R); g.stroke(); g.fillStyle = rgb(p.timber); g.fillRect(bx + s * (W / 2 + 7 * R) - 1.5 * R, by - 3 * R, 3 * R, 7 * R); }
    rim(c, rgba(cool(hx('#c8d0dc'), 0.2), 1), V.K.rimW * R, -lt, 0.4);
    return finish(c, bx, by, false, 'tent', 0.4);
  }

  /* ---- boulders and rubble: dark stone, cold facets, lichen ---- */
  function boulder(v, se){
    const p = P(se), r = rng(hsh(v * 3 + 1, 77)), lt = lit(), W = (44 + v * 10 + r() * 16) * R, H = W * (0.6 + r() * 0.2), c = mk(W + 6 * R, H + 8 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
    const pts = blob(r, bx, by - H * 0.5, W * 0.5, 9 + (v & 1), 0.35).map(q => [q[0], Math.min(by, q[1] + (q[1] > by - H * 0.5 ? H * 0.08 : 0))]);
    poly(g, pts, rgb(p.stoneD));
    // the lit facet: the upper, light-side half, a cold grey; a crack across; lichen on the top
    const facet = pts.filter(q => (q[0] - bx) * lt > -W * 0.15 && q[1] < by - H * 0.3); if (facet.length > 2) poly(g, [[bx, by - H * 0.45], ...facet], rgb(p.stone));
    const topF = pts.filter(q => q[1] < by - H * 0.6); if (topF.length > 2) poly(g, [[bx - lt * W * 0.1, by - H * 0.5], ...topF], rgba(cool(p.stoneL, 0.35), 0.8));
    g.strokeStyle = rgba(hx('#0c0c0c'), 0.8); g.lineWidth = 1.6 * R; g.beginPath(); g.moveTo(bx - W * 0.3, by - H * 0.35); g.lineTo(bx - W * 0.05, by - H * 0.6); g.lineTo(bx + W * 0.15, by - H * 0.5); g.stroke();
    for (let i = 0; i < 4; i++) poly(g, blob(r, bx + (r() - 0.5) * W * 0.6, by - H * (0.6 + r() * 0.3), (4 + r() * 5) * R, 8, 0.6), rgba(p.moss, 0.7));
    g.fillStyle = rgba(hx('#2a2420'), 0.6); g.fillRect(bx - W * 0.5, by - 3 * R, W, 4 * R);
    rim(c, rgba(cool(hx('#d0d8e0'), 0.2), 1), V.K.rimW * R, -lt, 0.5);
    return finish(c, bx, by, false, 'boulder', 0.3);
  }
  function rubble(v, se){
    const p = P(se), r = rng(hsh(v * 9 + 2, 51)), lt = lit(), W = 64 * R, H = 36 * R, c = mk(W + 6 * R, H + 8 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
    poly(g, blob(r, bx, by - H * 0.25, W * 0.5, 10, 0.4), rgba(hx('#2a2622'), 0.9));
    for (let i = 0; i < 12; i++){ const x = bx + (r() - 0.5) * W * 0.8, y = by - r() * H * 0.7, s = (5 + r() * 8) * R; const pts = blob(r, x, y, s, 6, 0.4); poly(g, pts, rgb(i % 3 ? p.stone : p.stoneD)); poly(g, pts.filter(q => (q[0] - x) * lt > 0 && q[1] < y), rgba(p.stoneL, 0.6)); }
    g.strokeStyle = rgb(hx('#141008')); g.lineWidth = 5 * R; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - W * 0.4, by - 2 * R); g.lineTo(bx + W * 0.2, by - H * 0.6); g.stroke();
    g.strokeStyle = rgba(p.ember, 0.5); g.lineWidth = 1.5 * R; g.beginPath(); g.moveTo(bx - W * 0.2, by - H * 0.2); g.lineTo(bx - W * 0.05, by - H * 0.35); g.stroke();
    return finish(c, bx, by, false, 'rubble', 0.25);
  }

  /* ---- the palisade: leaning sharpened stakes, lashed to a rail, black with weather (batch 2) ---- */
  // one stake: a tapered plank with a sharpened head, the lit edge a shade paler, a grain line down it
  function stake(g, p, x, yb, w, h, lean, lt, r_, dim){
    const tip = w * 0.9, xt = x + lean;
    poly(g, [[x - w / 2, yb], [xt - w / 2, yb - h + tip], [xt, yb - h], [xt + w / 2, yb - h + tip], [x + w / 2, yb]], rgb(r_() < 0.5 ? p.timber : mul(p.timber, 1.25)));
    poly(g, [[x + lt * w * 0.18, yb], [xt + lt * w * 0.18, yb - h + tip], [xt + lt * w / 2, yb - h + tip], [x + lt * w / 2, yb]], rgba(mix(p.barkL, hx('#8a7e6a'), 0.3), 0.55));
    g.strokeStyle = rgba(p.barkD, 0.7); g.lineWidth = 1 * R; g.beginPath(); g.moveTo(x - lt * w * 0.2, yb - h * 0.1); g.lineTo(xt - lt * w * 0.15, yb - h * 0.8); g.stroke();
    // the fresh-cut head, pale wood
    if (!dim) poly(g, [[xt - w * 0.35, yb - h + tip * 0.9], [xt, yb - h + 1 * R], [xt + w * 0.35, yb - h + tip * 0.9]], rgba(hx('#8a7a5e'), 0.8));
  }
  function palisade(v, se, o){
    const p = P(se), C = CELLW() * R, m = (o && o.mask) || 10, r = rng(hsh(v * 7 + 3, m * 13 + 1)), lt = lit(), H = ((o && o.low) ? 16 : V.K.palH) * R;   /* INDEX SW8 */
    const horiz = !!(m & 10), vert = !!(m & 5);
    const c = mk(C + 12 * R, H + C + 12 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
    if (vert){
      // the line runs into the picture: the stakes stand one behind the next up the cell, a narrow column seen edge-on
      const y0 = by - ((m & 1) ? C : C * 0.5), y1 = by - ((m & 4) ? 0 : C * 0.3);
      g.fillStyle = rgb(p.barkD); g.fillRect(bx - 8 * R, y0 - H * 0.95, 16 * R, y1 - y0 + H * 0.95);   // the dark of the stakes behind one another
      let k = 0; for (let y = y0; y <= y1 + 0.1; y += 4 * R, k++) stake(g, p, bx + (k & 1 ? 4 : -4) * R + (r() - 0.5) * 2 * R, y, (7 + r() * 2) * R, H * (0.92 + r() * 0.12), (r() - 0.5) * 3 * R, lt, r, k % 3 !== 0);   // seen edge-on the heads merge into one dark line; only a few catch the light
      g.fillStyle = rgba(hx('#1a1510'), 0.55); g.fillRect(bx - 9 * R, y0 - H * 0.6, 18 * R, 2.5 * R); g.fillRect(bx - 9 * R, y1 - H * 0.6, 18 * R, 2.5 * R);
      g.fillStyle = rgba(hx('#8a7e6a'), 0.3); g.fillRect(bx + lt * 7 * R, y0 - H * 0.9, 2 * R, y1 - y0 + H * 0.8);   // the lit flank of the whole line
    }
    if (horiz){
      const xl = (m & 8) ? bx - C / 2 - 2 * R : bx - 7 * R, xr = (m & 2) ? bx + C / 2 + 2 * R : bx + 7 * R;
      const n = Math.max(1, Math.round((xr - xl) / (7.5 * R)));
      // the rail behind the stakes first, then the stakes, then the lashings over them
      g.fillStyle = rgb(mul(p.timber, 0.8)); g.fillRect(xl, by - H * 0.62, xr - xl, 4 * R);
      for (let i = 0; i < n; i++){ const x = xl + (i + 0.5) * (xr - xl) / n; stake(g, p, x, by + (r() - 0.5) * 2 * R, (6.5 + r() * 2) * R, H * (0.88 + r() * 0.16), (r() - 0.5) * 6 * R, lt, r); }
      g.fillStyle = rgba(hx('#1a1510'), 0.6); g.fillRect(xl, by - H * 0.6, xr - xl, 2.5 * R);
      g.strokeStyle = rgba(hx('#6e6450'), 0.7); g.lineWidth = 1.2 * R; for (let i = 0; i < n; i += 2){ const x = xl + (i + 0.5) * (xr - xl) / n; g.beginPath(); g.moveTo(x - 4 * R, by - H * 0.64); g.lineTo(x + 4 * R, by - H * 0.56); g.moveTo(x + 4 * R, by - H * 0.64); g.lineTo(x - 4 * R, by - H * 0.56); g.stroke(); }
      // the earth banked at the foot, mud up the first hand of timber
      g.fillStyle = rgba(hx('#2a2018'), 0.7); g.fillRect(xl, by - 6 * R, xr - xl, 7 * R);
      if (!(m & 8) || !(m & 2)){ const xe = !(m & 8) ? xl : xr; stake(g, p, xe, by, 10 * R, H * 1.06, 0, lt, r); }   // a free end gets a heavier post
    }
    if (!horiz && !vert) stake(g, p, bx, by, 9 * R, H, 0, lt, r);
    rim(c, rgba(cool(hx('#c8d0dc'), 0.2), 1), V.K.rimW * R, -lt, 0.3);
    return finish(c, bx, by, true, 'palisade', 0.45);
  }

  /* ---- the curtain wall: coursed dark stone a person high, a parapet along the top, moss at the foot ---- */
  // courses of uneven stones over (xl..xr, yb up to yt): mortar the colour of soot, the lit side a shade cooler and paler
  function courses(g, p, r, xl, xr, yb, yt, lt, bx, W){
    const course = 9 * R; let row = 0;
    for (let y = yb; y > yt; y -= course, row++){
      let x = xl - (row & 1 ? 8 * R : 0) - r() * 6 * R;
      while (x < xr){ const sw = (10 + r() * 16) * R, x0 = Math.max(xl, x), x1 = Math.min(xr, x + sw); if (x1 > x0){ const k = r(); g.fillStyle = rgb(mix(k < 0.4 ? p.stoneD : k < 0.9 ? mul(p.stone, 0.85) : p.stone, cool(p.stoneL, 0.5), Math.max(0, ((x0 + x1) / 2 - bx) * lt / W * 0.25 + 0.05))); g.fillRect(x0, Math.max(yt, y - course + 1.2 * R), x1 - x0 - 1.2 * R, course - 1.2 * R); } x += sw; }
    }
  }
  /* INDEX SW8: a doorway through a wall line reads open: packed earth worn bare, three flat flags, no grass; painted flat on the cell */
  function threshold(v, se, o){
    const p = P(se), C = CELLW() * R, r = rng(hsh(v * 31 + 7, 4423)), c = mk(C + 8 * R, C + 8 * R), g = c.getContext('2d'), cx = c.width / 2, top = 4 * R;
    // a warm, light, worn path across the cell (stone floors and stone walls are the same grey, so the doorway has to be the one pale thing), edged dark, with two pale sill slabs
    const sand = mix(hx('#b09a6c'), p.stoneL, 0.15), W = C * 0.92, X = cx - W / 2, Y = top + C * 0.04, Hh = C * 0.92;
    g.fillStyle = rgba(hx('#14100a'), 0.55); g.fillRect(X - 2 * R, Y - 2 * R, W + 4 * R, Hh + 4 * R);
    g.fillStyle = rgba(sand, 0.92); g.fillRect(X, Y, W, Hh);
    for (let i = 0; i < 9; i++){ g.fillStyle = rgba(mix(sand, hx(r() < 0.5 ? '#6a583a' : '#d8c898'), 0.4), 0.55); g.fillRect(X + r() * (W - 8 * R), Y + r() * (Hh - 6 * R), (6 + r() * 6) * R, (3 + r() * 3) * R); }
    for (const fy of [0.3, 0.68]){ g.fillStyle = rgb(mix(p.stone, hx('#d8d0b8'), 0.35)); g.fillRect(cx - 11 * R, top + C * fy - 4 * R, 22 * R, 8 * R); g.fillStyle = rgba(hx('#000'), 0.35); g.fillRect(cx - 11 * R, top + C * fy + 3 * R, 22 * R, R); }
    return {img: c, ax: cx, ay: top, s: 1 / R, shadow: null, tall: false, kind: 'threshold'};
  }
  function wall(v, se, o){
    const p = P(se), C = CELLW() * R, run = Math.max(1, (o && o.run) || 1), ends = (o && o.ends) || 0, up = !!(o && o.up), down = !!(o && o.down), r = rng(hsh(v * 11 + 5, run * 17 + ends + (up ? 64 : 0) + (down ? 128 : 0))), lt = lit();
    const HW = ((o && o.low) ? 9 : V.K.wallH) * R, PAR = ((o && o.low) ? 4 : 14) * R, TOP = ((o && o.low) ? 4 : 12) * R;   /* INDEX SW8: o.low = the piece south of a doorway, a jamb low enough to see the gap over */
    if (run === 1 && (up || down)){
      // a piece of a wall running into the picture: its walkway seen from above, the shade flank beside it, the end face where it stops
      const TW = 24 * R, c = mk(TW + 20 * R, HW + PAR + C + 16 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
      const yTop = by - HW - PAR, y0 = yTop - C, y1 = down ? yTop : yTop;   // the walkway from the cell's far edge to its near edge, HW above the ground
      g.fillStyle = rgb(mul(p.stoneD, 0.8)); g.fillRect(bx - lt * TW / 2 - (lt > 0 ? 7 * R : 0), y0, 7 * R, C + (down ? 0 : HW + PAR));   // the shade flank
      g.fillStyle = rgb(p.stoneD); g.fillRect(bx - TW / 2, y0, TW, C);
      g.fillStyle = rgb(mix(p.stone, cool(p.stoneL, 0.4), 0.15)); g.fillRect(bx - TW / 2 + 3 * R, y0, TW - 6 * R, C);   // the walkway flags
      g.strokeStyle = rgba(hx('#0c0c0c'), 0.6); g.lineWidth = 1 * R; for (let y = y0 + 6 * R; y < y0 + C; y += (7 + r() * 5) * R){ g.beginPath(); g.moveTo(bx - TW / 2 + 3 * R, y); g.lineTo(bx + TW / 2 - 3 * R, y); g.stroke(); }
      g.fillStyle = rgb(mul(p.stoneD, 0.9)); for (let y = y0 + 2 * R; y < y0 + C; y += 10 * R){ g.fillRect(bx - TW / 2, y, 3 * R, 5 * R); g.fillRect(bx + TW / 2 - 3 * R, y, 3 * R, 5 * R); }   // the merlons along both edges
      g.fillStyle = rgba(hx('#8a929c'), 0.25); g.fillRect(bx + lt * (TW / 2 - 3 * R) - (lt < 0 ? 0 : 0), y0, 1.5 * R, C);   // the lit edge
      if (!down){ courses(g, p, r, bx - TW / 2, bx + TW / 2, by, yTop, lt, bx, TW); g.fillStyle = rgb(mul(p.stoneD, 0.85)); g.fillRect(bx - TW / 2, yTop, TW, PAR); for (let x = bx - TW / 2 + 2 * R; x < bx + TW / 2 - 4 * R; x += 8 * R) g.fillStyle = rgba(hx('#0a0a0a'), 0.6), g.fillRect(x + 4 * R, yTop, 4 * R, PAR * 0.6); g.fillStyle = rgba(hx('#14120e'), 0.5); g.fillRect(bx - TW / 2 - 4 * R, by - 8 * R, TW + 8 * R, 8 * R); }   // the end face toward us
      if (!up){ g.fillStyle = rgb(mul(p.stoneD, 0.9)); g.fillRect(bx - TW / 2, y0 - 4 * R, TW, 4 * R); }   // the far end's cap
      rim(c, rgba(cool(hx('#c8d0dc'), 0.25), 1), V.K.rimW * R, -lt, 0.3);
      return finish(c, bx, by, true, 'wall', 0.3);
    }
    const W = run * C + 4 * R, c = mk(W + 16 * R, HW + PAR + TOP + 10 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
    const xl = bx - W / 2, xr = bx + W / 2, yt = by - HW;
    g.fillStyle = rgb(mul(p.stoneD, 0.8)); g.fillRect(xl, yt - PAR, W, HW + PAR);
    courses(g, p, r, xl, xr, by, yt - PAR, lt, bx, W);
    // the parapet: merlons with dark gaps, and the walkway behind them as a top band
    g.fillStyle = rgb(mix(p.stone, cool(p.stoneL, 0.4), 0.15)); g.fillRect(xl, yt - PAR - TOP, W, TOP);
    g.fillStyle = rgba(hx('#0a0a0a'), 0.7); const mw = 11 * R; for (let x = xl + 6 * R; x < xr - mw; x += mw * 2) g.fillRect(x + mw, yt - PAR - TOP, mw, PAR * 0.6 + TOP * 0.5);
    g.fillStyle = rgba(hx('#000'), 0.35); g.fillRect(xl, yt - PAR * 0.4, W, 2 * R);
    // free ends get a buttress column; the foot is dark with damp and moss
    for (const sgn of [-1, 1]) if (ends & (sgn < 0 ? 1 : 2)){ const x = sgn < 0 ? xl - 6 * R : xr - 4 * R; g.fillStyle = rgb(mix(mul(p.stone, 0.9), cool(p.stoneL, 0.4), sgn * lt > 0 ? 0.25 : 0)); g.fillRect(x, yt - PAR - TOP - 4 * R, 10 * R, HW + PAR + TOP + 4 * R); g.strokeStyle = rgba(hx('#0c0c0c'), 0.7); g.lineWidth = 1 * R; for (let y = by; y > yt - PAR; y -= 9 * R){ g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 * R, y); g.stroke(); } }
    g.fillStyle = rgba(hx('#14120e'), 0.5); g.fillRect(xl - 6 * R, by - 10 * R, W + 12 * R, 10 * R);
    for (let i = 0; i < run * 3; i++) poly(g, blob(r, xl + r() * W, by - r() * 14 * R, (3 + r() * 5) * R, 7, 0.6), rgba(p.moss, 0.6));
    // a crack or two, and a stained run below a drain
    g.strokeStyle = rgba(hx('#0a0a0a'), 0.8); g.lineWidth = 1.4 * R; for (let i = 0; i < 1 + (v & 1); i++){ let x = xl + W * (0.2 + r() * 0.6), y = yt + r() * HW * 0.3; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++){ x += (r() - 0.5) * 10 * R; y += (8 + r() * 10) * R; g.lineTo(x, y); } g.stroke(); }
    rim(c, rgba(cool(hx('#c8d0dc'), 0.25), 1), V.K.rimW * R, -lt, 0.3);
    return finish(c, bx, by, true, 'wall', 0.4);
  }

  /* ---- the cliff: a rock face under the hill's edge, dark strata, scree at the foot ---- */
  function cliff(v, se, o){
    const p = P(se), C = CELLW() * R, r = rng(hsh(v * 13 + 7, 29)), lt = lit(), H = (V.K.cliffH + v * 6) * R, W = C + 14 * R, c = mk(W, H + 14 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 6 * R;
    const xl = 0, xr = W, yt = by - H;
    // the face, with a ragged brow so the cells do not meet in a straight seam
    const brow = []; for (let x = xl; x <= xr; x += 6 * R) brow.push([x, yt + (x <= xl || x + 6 * R > xr ? 4 : r() * 8) * R]);   /* QA hill-verify: the edges meet the neighbour at the same height */
    poly(g, [[xl, by], ...brow, [xr, by]], rgb(p.stoneD));
    // strata: bands tilted a little, each a shade apart, the lit side of each lip paler
    /* QA hill-verify: the bands are laid from the foot with a fixed seed and no tilt, so neighbouring cells (any variant) run on across the join */
    { const rb = rng(4242); let y = by - 4 * R, k = 0; while (y > yt + 4 * R){ const t = (6 + rb() * 9) * R, sh0 = rb() * 0.15; poly(g, [[xl, y - t], [xr, y - t], [xr, y], [xl, y]], rgb(mix(k & 1 ? mul(p.stone, 0.8) : mul(p.stoneD, 0.9), cool(p.stoneL, 0.3), sh0))); g.fillStyle = rgba(cool(p.stoneL, 0.4), 0.14); g.fillRect(xl, y - t - 1 * R, W, 1.5 * R); y -= t; k++; } }
    // cracks down the face, moss in the shade, a scree of broken stone at the foot
    g.strokeStyle = rgba(hx('#0a0a0a'), 0.85); g.lineWidth = 1.5 * R; for (let i = 0; i < 3; i++){ let x = xl + r() * W, yy = yt + r() * H * 0.4; g.beginPath(); g.moveTo(x, yy); for (let j = 0; j < 4; j++){ x += (r() - 0.5) * 12 * R; yy += (6 + r() * 12) * R; g.lineTo(x, yy); } g.stroke(); }
    for (let i = 0; i < 4; i++) poly(g, blob(r, bx - lt * W * 0.2 + (r() - 0.5) * W * 0.5, yt + H * (0.3 + r() * 0.5), (3 + r() * 5) * R, 7, 0.6), rgba(p.moss, 0.55));
    for (let i = 0; i < 7; i++){ const x = xl + r() * W, s = (3 + r() * 5) * R, pts = blob(r, x, by - r() * 5 * R, s, 6, 0.4); poly(g, pts, rgb(i & 1 ? p.stone : p.stoneD)); }
    g.fillStyle = rgba(hx('#14120e'), 0.4); g.fillRect(xl, by - 6 * R, W, 7 * R);
    /* Q103: the face is sheared to the contour's slope (o.sh = rise per unit run, from the same hill field as the ground), lip and foot together */
    let cc = c, bb = by; const sh = o && o.sh || 0;
    if (sh){ const ex = Math.ceil(Math.abs(sh) * W / 2) + 2, c2 = mk(W, c.height + 2 * ex), g2 = c2.getContext('2d'); g2.setTransform(1, sh, 0, 1, 0, ex - sh * bx); g2.drawImage(c, 0, 0); g2.setTransform(1, 0, 0, 1, 0, 0); cc = c2; bb = by + ex; }
    rim(cc, rgba(cool(hx('#c8d0dc'), 0.2), 1), V.K.rimW * R, 0, 0.6);   /* top lip only: a side rim drew a light hairline at every cell join */
    const out = finish(cc, bx, bb, false, 'cliff', 0.2);
    if (sh && out.shadow){   /* the shadow is cast by the upright face onto flat ground, then the ground is sheared with the hill: not cast from the sheared face (that made the stairs again) */
      const s0 = shadowOf(c, bx, by, 1 / R, 0.2), sc = s0.img, ex = Math.ceil(Math.abs(sh) * Math.max(s0.ax, sc.width - s0.ax)) + 2, c3 = mk(sc.width, sc.height + 2 * ex), g3 = c3.getContext('2d');
      g3.setTransform(1, sh, 0, 1, 0, ex - sh * s0.ax); g3.drawImage(sc, 0, 0); g3.setTransform(1, 0, 0, 1, 0, 0);
      out.shadow = {img: c3, ax: s0.ax, ay: s0.ay + ex};
    }
    return out;
  }

  /* ---- the gate: two posts and a hoarding over the road, the doors swung open against the line ---- */
  function gate(v, se, o){
    const p = P(se), C = CELLW() * R, n = Math.max(2, (o && o.n) || 3), stone = !!(o && o.stone), r = rng(hsh(v * 17 + 9, n * 3 + (stone ? 1 : 0))), lt = lit();
    const H = (V.K.palH + 10) * R, W = n * C, PW = (stone ? 16 : 11) * R, c = mk(W + 24 * R, H + 30 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 4 * R;
    const xl = bx - W / 2, xr = bx + W / 2, yt = by - H;
    const post = (x) => { if (stone){ g.fillStyle = rgb(p.stoneD); g.fillRect(x - PW / 2, yt - 6 * R, PW, H + 6 * R); for (let y = by; y > yt; y -= 9 * R){ g.fillStyle = rgb(mix(r() < 0.5 ? p.stone : p.stoneL, cool(p.stoneL, 0.4), (x - bx) * lt > 0 ? 0.3 : 0.05)); g.fillRect(x - PW / 2 + 1 * R, y - 8 * R, PW - 2 * R, 7 * R); } }
      else { stake(g, p, x, by, PW, H + 4 * R, 0, lt, r); g.fillStyle = rgba(p.iron, 0.9); g.fillRect(x - PW / 2 - 1 * R, yt + H * 0.3, PW + 2 * R, 3 * R); g.fillRect(x - PW / 2 - 1 * R, yt + H * 0.7, PW + 2 * R, 3 * R); } };
    // the doors, swung in and seen edge-on against the posts: two slabs of black planks with iron straps
    for (const sgn of [-1, 1]){ const x = sgn < 0 ? xl + PW / 2 : xr - PW / 2, dw = 9 * R, x0 = sgn < 0 ? x : x - dw; g.fillStyle = rgb(mul(p.timber, 0.9)); g.fillRect(x0 + sgn * 3 * R, yt + 12 * R, dw, H - 12 * R); g.fillStyle = rgba(p.iron, 0.9); g.fillRect(x0 + sgn * 3 * R, yt + H * 0.35, dw, 2.5 * R); g.fillRect(x0 + sgn * 3 * R, yt + H * 0.7, dw, 2.5 * R); g.fillStyle = rgba(hx('#8a7e6a'), 0.25); g.fillRect(x0 + sgn * 3 * R + (sgn * lt > 0 ? dw - 2 * R : 0), yt + 12 * R, 2 * R, H - 12 * R); }
    post(xl + PW / 2); post(xr - PW / 2);
    // the hoarding: a lintel beam, a plank walk with a low rail, a lantern hook; the posts run on above it
    const yl = yt + 4 * R, LH = 9 * R;
    g.fillStyle = rgb(mul(p.timber, 1.1)); g.fillRect(xl - 4 * R, yl, W + 8 * R, LH);
    g.fillStyle = rgba(hx('#8a7e6a'), 0.3); g.fillRect(xl - 4 * R, yl, W + 8 * R, 1.5 * R);
    g.fillStyle = rgb(p.timber); g.fillRect(xl - 4 * R, yl - 14 * R, W + 8 * R, 4 * R);   // the rail
    for (let x = xl + 6 * R; x < xr; x += 10 * R){ g.fillStyle = rgb(mul(p.timber, 0.85 + r() * 0.4)); g.fillRect(x, yl - 14 * R, 3 * R, 14 * R); }
    g.fillStyle = rgba(p.iron, 0.9); for (const x of [xl + 2 * R, xr - 6 * R]) g.fillRect(x, yl + 1 * R, 4 * R, LH - 2 * R);
    g.fillStyle = rgba(hx('#000'), 0.35); g.fillRect(xl, yl + LH, W, 5 * R);   // the shade the hoarding throws on the posts and doors
    // a lantern under the beam, the one warm note
    g.fillStyle = rgba(p.iron, 1); g.fillRect(bx - 1 * R, yl + LH, 2 * R, 7 * R); g.fillRect(bx - 4 * R, yl + LH + 7 * R, 8 * R, 9 * R);
    g.fillStyle = rgba(p.window, 0.9); g.fillRect(bx - 2.5 * R, yl + LH + 9 * R, 5 * R, 5 * R); g.fillStyle = rgba(p.ember, 0.12); g.fillRect(bx - 14 * R, yl + LH + 2 * R, 28 * R, 24 * R);
    g.fillStyle = rgba(hx('#2a2018'), 0.7); for (const x of [xl, xr - PW]) g.fillRect(x - 2 * R, by - 5 * R, PW + 4 * R, 6 * R);
    rim(c, rgba(cool(hx('#c8d0dc'), 0.2), 1), V.K.rimW * R, -lt, 0.3);
    return finish(c, bx, by, true, 'gate', 0.4);
  }


  /* ---- batch 3: the hearth and its fire, the wagon, loose flames ---- */
  const seNow = () => (typeof currentSeason === 'function' && currentSeason()) || 'summer';
  // the campfire's still part: a ring of blackened stones round a bed of ash, charred logs across it, a scorch on the ground
  function hearth(v, se){
    const p = P(se), r = rng(hsh(v * 31 + 5, 77)), lt = lit(), W = 56 * R, H = 34 * R, c = mk(W + 8 * R, H + 8 * R), g = c.getContext('2d'), cx = c.width / 2, cy = c.height - 10 * R;
    g.fillStyle = rgba(hx('#0e0c0a'), 0.55); g.beginPath(); g.ellipse(cx, cy, W * 0.62, H * 0.36, 0, 0, Math.PI * 2); g.fill();   // the scorch
    g.fillStyle = rgb(mix(p.stoneL, hx('#8a8070'), 0.4)); g.beginPath(); g.ellipse(cx, cy - 2 * R, W * 0.36, H * 0.2, 0, 0, Math.PI * 2); g.fill();   // the ash bed
    g.fillStyle = rgba(p.ember, 0.45); g.beginPath(); g.ellipse(cx, cy - 2 * R, W * 0.2, H * 0.1, 0, 0, Math.PI * 2); g.fill();   // embers under the logs
    // logs across the bed, charred, a crack of ember along each
    for (let i = 0; i < 3; i++){ const a = -0.5 + i * 0.6 + (r() - 0.5) * 0.3, L = W * (0.42 + r() * 0.18), w = (5 + r() * 2) * R, x0 = cx + Math.cos(a) * -L / 2, y0 = cy - 3 * R + Math.sin(a) * -L * 0.35, x1 = cx + Math.cos(a) * L / 2, y1 = cy - 3 * R + Math.sin(a) * L * 0.35;
      g.strokeStyle = rgb(p.barkD); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = rgba(p.ember, 0.8); g.lineWidth = Math.max(1, w * 0.18); g.setLineDash([3 * R, 5 * R]); g.beginPath(); g.moveTo(x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2); g.lineTo(x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8); g.stroke(); g.setLineDash([]);
      g.strokeStyle = rgba(cool(p.barkL, 0.3), 0.5); g.lineWidth = 1 * R; g.beginPath(); g.moveTo(x0, y0 - w * 0.3); g.lineTo(x1, y1 - w * 0.3); g.stroke(); }
    // the stone ring, the near stones over the logs
    const n = 11; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2 + 0.3, sx = cx + Math.cos(a) * W * 0.46, sy = cy + Math.sin(a) * H * 0.3, rr = (4.5 + r() * 2.5) * R, near = Math.sin(a) > 0;
      const base = i % 4 === 0 ? p.stoneD : p.stone, pts = blob(r, sx, sy, rr, 8, 0.4);
      poly(g, pts, rgb(mul(base, 0.8))); poly(g, blob(r, sx + lt * rr * 0.25, sy - rr * 0.35, rr * 0.6, 7, 0.4), rgba(mix(p.stoneL, p.ember, near ? 0.35 : 0.1), 0.55));
      if (near) poly(g, blob(r, sx, sy + rr * 0.3, rr * 0.7, 7, 0.4), rgba(hx('#000'), 0.35)); }
    return finish(c, cx, cy, false, 'hearth', 0.2);
  }
  // tongues of flame: drawn straight onto the frame, no cache; the shape moves with t
  function tongues(g, x, y, t, n, h, w, seed){
    const r = rng(seed + ((t / 3) | 0)), ph = t / 5;
    for (let i = 0; i < n; i++){ const k = (i + 0.5) / n - 0.5, bx = x + k * w, sway = Math.sin(ph + i * 1.9) * w * 0.08, hh = h * (0.55 + 0.45 * Math.abs(Math.sin(ph * 1.3 + i * 2.1))) * (1 - Math.abs(k) * 0.7), ww = w * (0.22 + r() * 0.1);
      const tip = [bx + sway * 1.6, y - hh];
      for (const [col, m] of [[rgba(hx('#b8401a'), 0.85), 1], [rgba(hx('#f08a28'), 0.9), 0.72], [rgba(hx('#ffd060'), 0.9), 0.42], [rgba(hx('#fff6c0'), 0.85), 0.2]]){
        g.fillStyle = col; g.beginPath(); g.moveTo(bx - ww * m, y); g.quadraticCurveTo(bx - ww * m * 0.9 + sway * m, y - hh * m * 0.55, tip[0] * m + bx * (1 - m), y - hh * m); g.quadraticCurveTo(bx + ww * m * 0.9 + sway * m, y - hh * m * 0.55, bx + ww * m, y); g.closePath(); g.fill(); } }
    // embers lifting off
    g.fillStyle = rgba(hx('#ffa040'), 0.8); for (let i = 0; i < 4; i++){ const life = ((t * 1.3 + i * 23) % 60) / 60, ex = x + Math.sin(i * 2.7 + t / 9) * w * 0.3 * (0.4 + life), ey = y - h * 0.4 - life * h * 1.2; g.globalAlpha = 1 - life; g.fillRect(ex, ey, 2, 2); } g.globalAlpha = 1;
  }
  /* camera standard (game-bible.md): one camera pitched 35 degrees, the target a tenth below the character, and things farther up the screen smaller.
     perspAt(sy) is the scale at screen row sy (1 on the character's row); persp(y) reads the camera for a world y, and answers 1 outside world space (HUD, sheets, bakes) */
  V.perspAt = function(sy, H){ return Math.max(0.8, Math.min(1.2, 1 + V.K.persp * (sy / (H || VH) - 0.5 - V.K.frameDown))); };
  V.persp = function(y){
    if (!V.K.persp || V.noPersp) return 1;
    const t = ctx.getTransform(); if (t.e === 0 && t.f === 0) return 1;
    let cy; if (typeof G !== 'undefined' && G && G.leader) cy = G.leader.y - VH / 2 - (typeof camDY === 'function' ? camDY() : 0); else if (typeof CAMP !== 'undefined' && CAMP && CAMP.cam) cy = CAMP.cam.y; else return 1;
    return V.perspAt(y - cy);
  };
  function blitSprite(sp, x, y, sc, flip, flat){
    sc = (sc || 1) * (flat ? 1 : V.persp(y));   // flat: a standing structure keeps one scale (SW-3: the ground does not scale, so a building must not either)
    const s = sp.s * sc;
    if (sp.shadow){ ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.6; if (flip){ ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); } ctx.drawImage(sp.shadow.img, x - sp.shadow.ax * sc, y - sp.shadow.ay * sc, sp.shadow.img.width * sc, sp.shadow.img.height * sc); ctx.restore(); }
    ctx.save(); if (flip){ ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); } ctx.imageSmoothingEnabled = true; ctx.drawImage(sp.img, x - sp.ax * s, y - sp.ay * s, sp.img.width * s, sp.img.height * s); ctx.restore();
  }
  // the campfire on the frame: ground glow, hearth, flames; (x, gl) is the ground line, t the frame
  V.drawFire = function(x, gl, t, o){
    const sc = (o && o.scale) || 1, sp = V.sprite('hearth', (o && o.v) || 0, seNow()); if (!sp) return false;
    const fl = 0.75 + Math.sin(t / 4) * 0.1 + Math.sin(t / 1.7) * 0.06, gr = ctx.createRadialGradient(x, gl - 6, 4, x, gl - 6, 95 * sc);
    gr.addColorStop(0, 'rgba(255,150,60,' + (0.3 * fl) + ')'); gr.addColorStop(0.5, 'rgba(220,110,40,' + (0.12 * fl) + ')'); gr.addColorStop(1, 'rgba(200,90,30,0)');
    ctx.save(); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, gl - 6, 95 * sc, 48 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    blitSprite(sp, x, gl, sc, false);
    ctx.save(); tongues(ctx, x, gl - 7 * sc, t, 5, 38 * sc, 30 * sc, 17); ctx.restore();
    return true;
  };
  // flames loose on a thing (an overrun district): bigger, with a smoke smudge above
  V.drawFlames = function(x, y, t){
    ctx.save(); const sm = ctx.createRadialGradient(x, y - 50, 4, x, y - 50, 40); sm.addColorStop(0, 'rgba(30,24,20,0.45)'); sm.addColorStop(1, 'rgba(30,24,20,0)'); ctx.fillStyle = sm; ctx.beginPath(); ctx.ellipse(x + Math.sin(t / 30) * 8, y - 50, 40, 26, 0, 0, Math.PI * 2); ctx.fill();
    tongues(ctx, x, y, t, 4, 44, 34, (x | 0) + 3); ctx.restore(); return true;
  };
  // F-48 ground fire (G.fires): a burning patch, not one flat flame on a disc. Ragged charred ground, a soft warm glow, coals that break up the rim,
  // and a few small tongues across the patch, the biggest in the middle (V.gfire = false: the old single flame)
  V.gfire = true;
  V.drawGroundFire = function(fz, t){
    const T = Math.PI * 2, x = fz.x, y = fz.y, r = fz.r || 30, q = 0.62, s = hsh((x | 0) * 7 + (y | 0), 53), rr = rng(s);
    ctx.save();
    for (let i = 0; i < 7; i++){ const a = rr() * T, d = rr() * r * 0.55, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * q, cr = r * (0.35 + rr() * 0.3), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, 'rgba(24,14,8,0.4)'); g.addColorStop(1, 'rgba(24,14,8,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, cr, cr * q, 0, 0, T); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.8 + Math.sin(t / 4 + s) * 0.12 + Math.sin(t / 1.7) * 0.06, R = r * 1.4, g2 = ctx.createRadialGradient(x, y, 2, x, y, R);
    g2.addColorStop(0, 'rgba(255,140,50,' + (0.3 * fl) + ')'); g2.addColorStop(0.5, 'rgba(210,80,20,' + (0.12 * fl) + ')'); g2.addColorStop(1, 'rgba(160,50,10,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(x, y, R, R * q, 0, 0, T); ctx.fill();
    for (let i = 0; i < 16; i++){ const a = rr() * T, d = Math.sqrt(rr()) * r * 1.08, ex = x + Math.cos(a) * d, ey = y + Math.sin(a) * d * q, pu = 0.5 + 0.5 * Math.sin(t / 6 + i * 1.7), cr = 1.1 + rr() * 1.8;
      ctx.fillStyle = 'rgba(255,' + (110 + (pu * 90 | 0)) + ',40,' + (0.3 + 0.45 * pu) + ')'; ctx.beginPath(); ctx.ellipse(ex, ey, cr * 1.4, cr, 0, 0, T); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    const n = Math.max(2, Math.min(5, Math.round(r / 11))), pts = [[x, y, 1]];
    for (let i = 1; i < n; i++){ const a = rr() * T, d = (0.4 + rr() * 0.45) * r; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * q, 0.5 + rr() * 0.25]); }
    pts.sort((u, v) => u[1] - v[1]);
    for (const [px, py, k] of pts) tongues(ctx, px, py, t + (px | 0), 3, 34 * k, 22 * k, (px | 0) + 3);
    ctx.restore(); return true;
  };
  // the wagon: a covered cart seen from the front quarter, facing right; the drawer mirrors it for the other way
  function wagon(v, se){
    const p = P(se), r = rng(hsh(v * 13 + 1, 91)), lt = lit(), L = 66 * R, BH = 22 * R, c = mk(L + 24 * R, 68 * R), g = c.getContext('2d'), bx = c.width / 2, by = c.height - 6 * R;
    const x0 = bx - L / 2, x1 = bx + L / 2, yb = by - 9 * R, yt = yb - BH;   // the bed's bottom and top
    // far wheels, dark
    for (const wx of [x0 + 14 * R, x1 - 12 * R]){ g.fillStyle = rgb(p.barkD); g.beginPath(); g.ellipse(wx + 2 * R, by - 11 * R, 9 * R, 11 * R, 0, 0, Math.PI * 2); g.fill(); }
    // the bed: planks end-on, a lit top rail
    g.fillStyle = rgb(p.timber); g.fillRect(x0, yt, L, BH);
    for (let y = yt + 4 * R; y < yb; y += 5 * R){ g.fillStyle = rgba(p.barkD, 0.8); g.fillRect(x0, y, L, 1.2 * R); }
    g.fillStyle = rgba(cool(p.barkL, 0.3), 0.55); g.fillRect(x0, yt, L, 1.5 * R);
    for (let i = 0; i < 4; i++){ const px = x0 + 6 * R + i * (L - 12 * R) / 3; g.fillStyle = rgb(p.barkD); g.fillRect(px - 1.5 * R, yt - 2 * R, 3 * R, BH + 2 * R); g.fillStyle = rgb(p.iron); g.fillRect(px - 2 * R, yt + 3 * R, 4 * R, 2 * R); }
    // the tilt: hoops under a sagging canvas, grimy, with folds and a shade side
    const hT = 30 * R, cxl = x0 + 5 * R, cxr = x1 - 3 * R;
    g.fillStyle = rgb(p.canvas); g.beginPath(); g.moveTo(cxl, yt + 1 * R); g.quadraticCurveTo(cxl + 2 * R, yt - hT * 0.95, cxl + 14 * R, yt - hT); g.lineTo(cxr - 10 * R, yt - hT); g.quadraticCurveTo(cxr + 2 * R, yt - hT * 0.95, cxr, yt + 1 * R); g.closePath(); g.fill();
    g.fillStyle = rgba(p.canvasD, 0.7); g.beginPath(); g.moveTo(cxl, yt + 1 * R); g.quadraticCurveTo(cxl + 2 * R, yt - hT * 0.95, cxl + 14 * R, yt - hT); g.lineTo(cxl + 16 * R, yt - hT); g.quadraticCurveTo(cxl + 4 * R, yt - hT * 0.9, cxl + 4 * R, yt + 1 * R); g.closePath(); g.fill();   // the shade side (left)
    for (let i = 0; i < 5; i++){ const hxp = cxl + 10 * R + i * (cxr - cxl - 16 * R) / 4; g.strokeStyle = rgba(p.canvasD, 0.55); g.lineWidth = 1.2 * R; g.beginPath(); g.moveTo(hxp, yt + 1 * R); g.quadraticCurveTo(hxp + (r() - 0.5) * 3 * R, yt - hT * 0.55, hxp + 1 * R, yt - hT + 0.5 * R); g.stroke(); }   // hoops showing through as folds
    g.fillStyle = rgba(cool(p.canvasL, 0.2), 0.45); g.beginPath(); g.moveTo(cxl + 14 * R, yt - hT); g.lineTo(cxr - 10 * R, yt - hT); g.lineTo(cxr - 12 * R, yt - hT + 3 * R); g.lineTo(cxl + 16 * R, yt - hT + 3 * R); g.closePath(); g.fill();   // the ridge in the light
    g.fillStyle = rgba(hx('#000'), 0.3); g.fillRect(cxl, yt - 1 * R, cxr - cxl, 2 * R);   // the dark under the canvas hem
    // the open back: a black mouth with the canvas tied off
    g.fillStyle = rgb(hx('#0c0a08')); g.beginPath(); g.ellipse(cxr - 2 * R, yt - hT * 0.45, 5 * R, hT * 0.42, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = rgba(p.canvasL, 0.5); g.lineWidth = 1 * R; g.beginPath(); g.moveTo(cxr - 2 * R, yt - hT + 2 * R); g.lineTo(cxr - 2 * R, yt - hT * 0.4); g.stroke();
    // the driver's board and the shaft
    g.fillStyle = rgb(p.barkD); g.fillRect(x0 - 8 * R, yt + 2 * R, 10 * R, 3 * R); g.fillRect(x0 - 20 * R, yb - 4 * R, 22 * R, 2 * R);
    // near wheels: iron tyre, dark felloe, spokes, a mud-caked lower rim
    for (const [wx, rr] of [[x0 + 12 * R, 12 * R], [x1 - 14 * R, 13 * R]]){ const wy = by - rr + 1 * R;
      g.strokeStyle = rgb(p.iron); g.lineWidth = 2.5 * R; g.beginPath(); g.ellipse(wx, wy, rr, rr, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgb(p.barkD); g.lineWidth = 2 * R; g.beginPath(); g.ellipse(wx, wy, rr - 2.5 * R, rr - 2.5 * R, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgb(mul(p.barkL, 0.8)); g.lineWidth = 1.3 * R; for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI + 0.2; g.beginPath(); g.moveTo(wx - Math.cos(a) * (rr - 3 * R), wy - Math.sin(a) * (rr - 3 * R)); g.lineTo(wx + Math.cos(a) * (rr - 3 * R), wy + Math.sin(a) * (rr - 3 * R)); g.stroke(); }
      g.fillStyle = rgb(p.iron); g.beginPath(); g.arc(wx, wy, 2.5 * R, 0, Math.PI * 2); g.fill();
      g.strokeStyle = rgba(mix(p.barkD, hx('#3a3026'), 0.5), 0.8); g.lineWidth = 3 * R; g.beginPath(); g.ellipse(wx, wy, rr, rr, 0, Math.PI * 0.25, Math.PI * 0.75); g.stroke();
      g.strokeStyle = rgba(cool(p.wet, 0.5), 0.35); g.lineWidth = 1 * R; g.beginPath(); g.ellipse(wx, wy, rr, rr, 0, Math.PI * (lt > 0 ? 1.1 : 1.6), Math.PI * (lt > 0 ? 1.6 : 2.1)); g.stroke(); }
    // a bucket on a hook and a lantern at the back
    g.fillStyle = rgb(p.iron); g.fillRect(x0 + 2 * R, yt + 6 * R, 4 * R, 5 * R); g.fillStyle = rgb(p.ember); g.fillRect(x1 - 5 * R, yt - 9 * R, 2.5 * R, 3 * R); g.fillStyle = rgba(p.ember, 0.25); g.beginPath(); g.arc(x1 - 4 * R, yt - 7 * R, 7 * R, 0, Math.PI * 2); g.fill();
    rim(c, rgba(cool(p.canvasL, 0.6), V.K.rimA), V.K.rimW * R, -lt, 1);
    return finish(c, bx, by, false, 'wagon', 0.35);
  }


  // camp decor painted afresh: dead tufts, thorn scrub (stands in for the old bushes and flowers: no bloom), field stones, stumps, crates, barrels, sacks, rope, an anchor, a broken fence, a sign
  const DECOR = {tuft: [30, 22], scrub: [46, 36], rock: [30, 20], stump: [34, 28], crate: [34, 30], barrel: [28, 36], sacks: [46, 26], rope: [30, 14], anchor: [34, 44], fence: [84, 34], sign: [30, 62], bones: [50, 18], benchlog: [32, 14]};
  function decor(kind, v, se){
    const K = kind === 'flowers' || kind === 'bush' ? 'scrub' : kind, size = DECOR[K]; if (!size) return null;
    const p = P(se), w = se === 'winter', r = rng(hsh(v * 17 + 3, K.length * 101 + K.charCodeAt(0) * 7));
    const W = size[0] * R, H = size[1] * R, c = mk(W + 12 * R, H + 12 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 6 * R;
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const dry = hx(w ? '#4a4638' : '#56482c'), dryD = hx('#26200f'), rust = hx('#4a2e1c'), tall = K === 'sign' || K === 'anchor' || K === 'fence';
    if (K === 'tuft'){
      ell(cx, by, W * 0.3, H * 0.12, rgba(hx('#0e0c0a'), 0.25));
      for (let i = 0; i < 16; i++){ const x0 = cx + (r() - 0.5) * W * 0.7, h = H * (0.45 + r() * 0.55), lean = (0.3 + r() * 0.6) * (r() < 0.75 ? 1 : -1) * W * 0.3; line(x0, by, x0 + lean, by - h, rgb(mix(dryD, dry, r())), (1 + r()) * R); }
    } else if (K === 'scrub'){
      ell(cx, by, W * 0.45, H * 0.14, rgba(hx('#0e0c0a'), 0.3));
      for (let i = 0; i < 24; i++){ const a = -Math.PI * (0.12 + r() * 0.76), L = H * (0.4 + r() * 0.6), x0 = cx + (r() - 0.5) * W * 0.5, x1 = x0 + Math.cos(a) * L, y1 = by + Math.sin(a) * L; line(x0, by, x1, y1, rgb(mix(p.barkD, p.barkL, r() * 0.6)), (0.8 + r()) * R); line(x1, y1, x1 + (r() - 0.5) * 8 * R, y1 - r() * 8 * R, rgb(p.barkD), 0.8 * R); if (r() < 0.5) line(x1, y1, x1 + (r() - 0.5) * 3 * R, y1 + 2 * R, rgb(p.barkD), 0.6 * R); }
      for (let i = 0; i < 9; i++){ const x = cx + (r() - 0.5) * W * 0.8, y = by - H * (0.3 + r() * 0.6); ell(x, y, 2.5 * R, 1.4 * R, rgb(mix(p.leaf, p.leafL, r() * 0.7)), r() * 3); }
    } else if (K === 'rock'){
      const pts = blob(r, cx, by - H * 0.42, W * 0.42, 9, 0.3); poly(g, pts, rgb(p.stone)); g.save(); g.clip();
      ell(cx - W * 0.1, by - H * 0.62, W * 0.3, H * 0.26, rgba(p.stoneL, 0.55), -0.3); g.fillStyle = rgba(p.stoneD, 0.7); g.fillRect(0, by - H * 0.22, c.width, H);
      ell(cx + W * 0.15, by - H * 0.22, W * 0.2, H * 0.12, rgba(p.moss, 0.5)); line(cx - W * 0.2, by - H * 0.5, cx + W * 0.05, by - H * 0.15, rgba(p.stoneD, 0.8), 1.2 * R); g.restore();
    } else if (K === 'stump'){
      const rw = W * 0.34, top = by - H * 0.72;
      for (let i = 0; i < 4; i++){ const a = (i / 4 + r() * 0.2) * Math.PI * 2; line(cx + Math.cos(a) * rw * 0.7, by - 2 * R, cx + Math.cos(a) * rw * 1.5, by + Math.sin(a) * 3 * R, rgb(p.barkD), 4 * R); }
      g.fillStyle = rgb(p.bark); g.fillRect(cx - rw, top, rw * 2, by - top); g.fillStyle = rgba(p.barkD, 0.7); g.fillRect(cx + rw * 0.3, top, rw * 0.7, by - top);
      for (let i = 0; i < 7; i++){ const x = cx - rw + r() * rw * 2; line(x, top + 2 * R, x + (r() - 0.5) * 4 * R, by - 2 * R, rgba(i % 2 ? p.barkL : p.barkD, 0.6), (0.8 + r()) * R); }
      ell(cx, top, rw, rw * 0.42, rgb(mix(p.thatchL, p.plaster, 0.5))); g.strokeStyle = rgba(p.barkD, 0.5); g.lineWidth = 0.8 * R; for (let i = 1; i < 4; i++){ g.beginPath(); g.ellipse(cx, top, rw * i / 4, rw * 0.42 * i / 4, 0, 0, Math.PI * 2); g.stroke(); }
      line(cx - rw * 0.2, top - rw * 0.3, cx + rw * 0.6, top + rw * 0.2, rgb(p.barkD), 1.2 * R); ell(cx - rw * 0.5, top + rw * 0.1, rw * 0.3, rw * 0.12, rgba(p.moss, 0.6));
    } else if (K === 'crate'){
      const fw = W * 0.72, fh = H * 0.62, x0 = cx - fw / 2, y0 = by - fh, dx = W * 0.2, dy = H * 0.26;
      poly(g, [[x0, y0], [x0 + fw, y0], [x0 + fw + dx, y0 - dy], [x0 + dx, y0 - dy]], rgb(mix(p.timber, p.thatchL, 0.45)));
      g.fillStyle = rgb(mix(p.timber, p.plaster, 0.35)); g.fillRect(x0, y0, fw, fh); poly(g, [[x0 + fw, y0], [x0 + fw + dx, y0 - dy], [x0 + fw + dx, y0 - dy + fh], [x0 + fw, y0 + fh]], rgb(p.timber));
      for (let i = 1; i < 4; i++) line(x0, y0 + fh * i / 4, x0 + fw, y0 + fh * i / 4, rgba(p.barkD, 0.7), 1.2 * R);
      for (let i = 1; i < 3; i++) line(x0 + dx * i / 3, y0 - dy * i / 3, x0 + fw + dx * i / 3, y0 - dy * i / 3, rgba(p.barkD, 0.5), R);
      g.strokeStyle = rgb(p.iron); g.lineWidth = 2.2 * R; g.strokeRect(x0 + 1.5 * R, y0 + 1.5 * R, fw - 3 * R, fh - 3 * R); line(x0 + fw, y0, x0 + fw, y0 + fh, rgb(p.iron), 2.2 * R);
      for (let i = 0; i < 6; i++) ell(x0 + 3 * R + r() * (fw - 6 * R), y0 + 3 * R + r() * (fh - 6 * R), 1.2 * R, 1.2 * R, rgb(rust));
    } else if (K === 'barrel'){
      const bw = W * 0.38, bh = H * 0.82, y0 = by - bh;
      g.fillStyle = rgb(mix(p.timber, p.thatchL, 0.4)); g.beginPath(); g.moveTo(cx - bw, y0 + bw * 0.3); g.quadraticCurveTo(cx - bw * 1.25, by - bh / 2, cx - bw, by - bw * 0.3); g.lineTo(cx + bw, by - bw * 0.3); g.quadraticCurveTo(cx + bw * 1.25, by - bh / 2, cx + bw, y0 + bw * 0.3); g.closePath(); g.fill();
      g.save(); g.clip(); for (let i = 0; i < 7; i++){ const x = cx - bw * 1.2 + i * bw * 0.36; line(x, y0, x + (i < 3 ? -2 : 2) * R, by, rgba(p.barkD, 0.6), 1.1 * R); } g.fillStyle = rgba(p.barkD, 0.6); g.fillRect(cx + bw * 0.4, 0, bw, c.height); g.fillStyle = rgba(p.plaster, 0.25); g.fillRect(cx - bw * 0.9, 0, bw * 0.5, c.height);
      for (const f of [0.18, 0.5, 0.82]){ const y = y0 + bh * f; line(cx - bw * 1.3, y, cx + bw * 1.3, y, rgb(p.iron), 2.4 * R); line(cx - bw * 1.3, y - 1.2 * R, cx + bw * 1.3, y - 1.2 * R, rgba(p.stoneL, 0.35), 0.8 * R); } g.restore();
      ell(cx, y0 + bw * 0.3, bw, bw * 0.3, rgb(p.timber)); ell(cx, y0 + bw * 0.3, bw * 0.8, bw * 0.22, rgb(mix(p.timber, p.plaster, 0.5))); ell(cx + bw * 0.3, by - bh * 0.42, 1.8 * R, 1.8 * R, rgb(p.barkD));
    } else if (K === 'sacks'){
      const sack = (x, y, sw, sh, slump) => { g.fillStyle = rgb(mix(p.canvas, p.canvasL, 0.3 + r() * 0.3)); g.beginPath(); g.moveTo(x - sw, y); g.quadraticCurveTo(x - sw * 1.1, y - sh * 0.7, x - sw * 0.5 + slump, y - sh); g.quadraticCurveTo(x, y - sh * 1.05, x + sw * 0.5 + slump, y - sh * 0.95); g.quadraticCurveTo(x + sw * 1.1, y - sh * 0.6, x + sw, y); g.closePath(); g.fill(); g.save(); g.clip(); g.fillStyle = rgba(p.canvasD, 0.55); g.fillRect(x + sw * 0.35, y - sh * 2, sw, sh * 3); g.fillStyle = rgba(p.canvasD, 0.4); g.fillRect(x - sw * 2, y - sh * 0.25, sw * 4, sh); line(x - sw * 0.3, y - sh * 0.5, x + sw * 0.2, y - sh * 0.1, rgba(p.canvasD, 0.5), R); g.restore(); line(x - sw * 0.4 + slump, y - sh * 0.96, x + sw * 0.4 + slump, y - sh * 0.92, rgb(p.barkD), 1.6 * R); };
      ell(cx, by, W * 0.46, H * 0.16, rgba(hx('#0e0c0a'), 0.3)); sack(cx - W * 0.22, by, W * 0.22, H * 0.78, 2 * R); sack(cx + W * 0.2, by - R, W * 0.24, H * 0.9, -3 * R); sack(cx - W * 0.02, by + R, W * 0.2, H * 0.55, 0);
    } else if (K === 'rope'){
      ell(cx, by, W * 0.46, H * 0.3, rgba(hx('#0e0c0a'), 0.3));
      g.strokeStyle = rgb(mix(dry, p.timber, 0.4)); g.lineWidth = 2.6 * R; for (let i = 0; i < 4; i++){ g.beginPath(); g.ellipse(cx + (r() - 0.5) * 3 * R, by - 2 * R - i * 2.2 * R, W * (0.42 - i * 0.04), H * (0.28 - i * 0.03), 0, 0, Math.PI * 2); g.stroke(); }
      g.strokeStyle = rgba(p.barkD, 0.5); g.lineWidth = 0.8 * R; for (let i = 0; i < 4; i++){ g.beginPath(); g.ellipse(cx, by - 2 * R - i * 2.2 * R + 1.2 * R, W * (0.42 - i * 0.04), H * (0.28 - i * 0.03), 0, 0, Math.PI * 2); g.stroke(); }
      line(cx + W * 0.3, by - 4 * R, cx + W * 0.5, by + 2 * R, rgb(mix(dry, p.timber, 0.4)), 2.4 * R);
    } else if (K === 'anchor'){
      const ir = rgb(mix(p.iron, rust, 0.35)), sh = H * 0.88, sx = cx + W * 0.08, top = by - sh;
      g.save(); g.translate(sx, by); g.rotate(0.22); g.translate(-sx, -by);
      line(sx, top + 6 * R, sx, by - 6 * R, ir, 3.2 * R); g.strokeStyle = ir; g.lineWidth = 2.4 * R; g.beginPath(); g.arc(sx, top + 3 * R, 4 * R, 0, Math.PI * 2); g.stroke();
      line(sx - W * 0.34, top + H * 0.22, sx + W * 0.34, top + H * 0.22, rgb(p.timber), 3 * R);
      g.beginPath(); g.moveTo(sx - W * 0.42, by - H * 0.36); g.quadraticCurveTo(sx, by + 2 * R, sx + W * 0.42, by - H * 0.36); g.lineWidth = 3.4 * R; g.stroke();
      poly(g, [[sx - W * 0.42, by - H * 0.36], [sx - W * 0.5, by - H * 0.2], [sx - W * 0.3, by - H * 0.3]], ir); poly(g, [[sx + W * 0.42, by - H * 0.36], [sx + W * 0.5, by - H * 0.2], [sx + W * 0.3, by - H * 0.3]], ir);
      for (let i = 0; i < 8; i++) ell(sx + (r() - 0.5) * W * 0.6, by - r() * sh, 1.4 * R, 1.4 * R, rgba(rust, 0.8)); g.restore();
    } else if (K === 'fence'){
      const ph = H * 0.9, px0 = cx - W * 0.4, px1 = cx + W * 0.4;
      for (const px of [px0, px1]){ g.fillStyle = rgb(p.timber); g.fillRect(px - 2.6 * R, by - ph, 5.2 * R, ph); g.fillStyle = rgba(p.barkL, 0.35); g.fillRect(px - 2.6 * R, by - ph, 1.6 * R, ph); poly(g, [[px - 2.6 * R, by - ph], [px + 2.6 * R, by - ph], [px + 1.2 * R, by - ph - 3 * R]], rgb(p.timber)); }
      line(px0, by - ph * 0.78, px1, by - ph * 0.72, rgb(mix(p.timber, p.thatchL, 0.3)), 3.4 * R);
      line(px0, by - ph * 0.42, cx + W * 0.06, by - ph * 0.38, rgb(mix(p.timber, p.thatchL, 0.3)), 3.4 * R); line(cx + W * 0.08, by - ph * 0.37, px1 - 2 * R, by - 2 * R, rgb(mix(p.timber, p.thatchL, 0.2)), 3 * R);
      for (let i = 0; i < 6; i++){ const x = px0 + r() * (px1 - px0); line(x, by - ph * (0.7 + r() * 0.1), x + 6 * R, by - ph * (0.68 + r() * 0.1), rgba(p.barkD, 0.7), R); }
      for (let i = 0; i < 8; i++){ const x = cx + (r() - 0.5) * W * 0.9; line(x, by, x + (r() - 0.5) * 4 * R, by - (4 + r() * 6) * R, rgb(mix(dryD, dry, r())), R); }
    } else if (K === 'bones'){
      const bone = hx(w ? '#7a7668' : '#7e7662'), boneD = hx('#3c382e'), bx = cx - W * 0.28, bY = by - H * 0.45;
      ell(cx, by - H * 0.3, W * 0.5, H * 0.42, rgba(hx('#16120e'), 0.45));   // the sunk patch of mud the bones lie in
      for (let i = 0; i < 5; i++){ const x = cx - W * 0.1 + i * W * 0.11, k = 1 - i * 0.12; g.strokeStyle = rgb(bone); g.lineWidth = 1.3 * R; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, by - H * 0.1); g.quadraticCurveTo(x + 3 * R, by - H * (0.5 + 0.3 * k), x + 7 * R, by - H * (0.75 + 0.2 * k)); g.stroke(); }   // ribs
      line(cx + W * 0.08, by - H * 0.15, cx + W * 0.46, by - H * 0.3, rgb(bone), 1.8 * R); ell(cx + W * 0.46, by - H * 0.3, 1.6 * R, 1.2 * R, rgb(bone)); ell(cx + W * 0.08, by - H * 0.15, 1.6 * R, 1.2 * R, rgb(bone));   // a long bone
      ell(bx, bY, W * 0.13, H * 0.36, rgb(bone)); ell(bx + W * 0.05, bY + H * 0.2, W * 0.09, H * 0.2, rgb(mix(bone, boneD, 0.3)));   // skull and jaw
      ell(bx - W * 0.04, bY - H * 0.05, 1.8 * R, 2.2 * R, rgb(boneD)); ell(bx + W * 0.04, bY - H * 0.03, 1.6 * R, 2 * R, rgb(boneD)); line(bx + W * 0.03, bY + H * 0.3, bx + W * 0.1, bY + H * 0.3, rgba(boneD, 0.6), 0.8 * R);
      ell(cx, by - H * 0.22, W * 0.5, H * 0.4, rgba(hx('#16120e'), 0.2));   // mud over the lower half
    } else if (K === 'benchlog'){
      // a split log bench: half a trunk laid flat side up on two stump feet, the seat worn pale where people sit, bark hanging off the ends
      const L = lit(), sw = W * 0.47, top = by - H * 0.78, mid = by - H * 0.36, wood = hx(w ? '#5c5648' : '#66583c'), woodD = hx('#40331f');
      ell(cx, by - R, sw * 1.05, 2.4 * R, rgba(hx('#16120e'), 0.4));
      for (const fx of [cx - sw * 0.62, cx + sw * 0.62]){ poly(g, [[fx - 3.2 * R, by], [fx - 2.6 * R, mid], [fx + 2.6 * R, mid], [fx + 3.2 * R, by]], rgb(p.barkD)); poly(g, [[fx + 0.2 * R * L, by], [fx + 0.4 * R * L, mid], [fx + 2.6 * R * L, mid], [fx + 3.2 * R * L, by]], rgba(p.barkL, 0.35)); }
      poly(g, [[cx - sw, mid + 1.5 * R], [cx - sw - 1.5 * R, top + 2 * R], [cx + sw + 1.5 * R, top + 1.5 * R], [cx + sw, mid + 2 * R]], rgb(p.bark));   // the round bark underside
      for (let i = 0; i < 6; i++){ const x = cx - sw + r() * sw * 2; line(x, mid + R, x + (r() - 0.5) * 2 * R, top + 3.5 * R, rgba(p.barkD, 0.55), 0.8 * R); }
      poly(g, [[cx - sw, top + 2.2 * R], [cx - sw + 1.2 * R, top], [cx + sw - 1.2 * R, top - 0.5 * R], [cx + sw, top + 1.7 * R]], rgb(wood));   // the flat cut seat
      for (let i = 0; i < 5; i++) line(cx - sw * 0.9, top + 0.3 * R + i * 0.4 * R, cx + sw * 0.9, top + (r() - 0.5) * 0.8 * R + i * 0.35 * R, rgba(woodD, 0.35), 0.5 * R);
      ell(cx + (r() - 0.5) * sw * 0.5, top + 0.9 * R, sw * 0.4, 1.1 * R, rgba(p.plaster, 0.12));   // worn pale where people sit
      for (const ex of [cx - sw, cx + sw]){ ell(ex, top + 1.2 * R + (mid - top) * 0.45, 1.6 * R, (mid - top) * 0.5, rgb(mix(wood, woodD, 0.5))); line(ex + (ex < cx ? -1 : 1) * 1.2 * R, mid, ex + (ex < cx ? -2.5 : 2.5) * R, mid + 3 * R, rgb(p.barkD), 1.1 * R); }   // end grain and a strip of bark hanging
      line(cx - sw * 0.3, top + 0.6 * R, cx - sw * 0.1, top + 1.6 * R, rgba(woodD, 0.7), 0.7 * R);   // a split in the seat
    } else if (K === 'sign'){
      const ph = H * 0.95, bw = W * 0.5, bh = H * 0.26, by0 = by - ph * 0.82;
      g.fillStyle = rgb(p.timber); g.fillRect(cx - 2.6 * R, by - ph, 5.2 * R, ph); g.fillStyle = rgba(p.barkL, 0.35); g.fillRect(cx - 2.6 * R, by - ph, 1.6 * R, ph);
      g.save(); g.translate(cx, by0); g.rotate(-0.06); poly(g, [[-bw, -bh / 2], [bw + 2 * R, -bh / 2 + R], [bw, bh / 2], [-bw - 1.5 * R, bh / 2 - 2 * R]], rgb(mix(p.timber, p.thatchL, 0.4)), rgb(p.barkD), 1.2 * R);
      for (let i = 0; i < 3; i++) line(-bw, -bh / 2 + bh * (i + 0.5) / 3, bw, -bh / 2 + bh * (i + 0.5) / 3 + R, rgba(p.barkD, 0.35), 0.8 * R);
      for (let i = 0; i < 5; i++){ const x = -bw * 0.75 + i * bw * 0.36; line(x, -bh * 0.1, x + bw * 0.22, -bh * 0.1 + (r() - 0.5) * 2 * R, rgba(p.barkD, 0.85), 2.2 * R); }
      for (const x of [-bw * 0.85, bw * 0.85]) ell(x, -bh * 0.3, 1.3 * R, 1.3 * R, rgb(p.iron)); g.restore();
      line(cx - 2 * R, by - ph * 0.5, cx + 2 * R, by - ph * 0.2, rgba(p.barkD, 0.7), 0.9 * R);
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -lit(), 0.3);
    return finish(c, cx, by, tall, 'decor', tall ? 0.45 : K === 'bones' ? 0.04 : K === 'benchlog' ? 0.1 : 0.2);
  }
  // the hook: every camp decor call (W3D's dc_* kinds) lands here while VO3 is on
  V.drawDecor = function(kind, x, gl, o){
    const K = kind === 'flowers' || kind === 'bush' ? 'scrub' : kind; if (!DECOR[K]) return null;
    const sp = V.sprite('decor', hsh(x | 0, gl | 0) % 4, seNow(), {k: K}); if (!sp) return false;
    blitSprite(sp, x, gl, 1, !!(o && o.mirror)); return true;
  };

  // batch 5: the fort's standing props painted afresh: a palisade stake, the trophy rack, the stable paddock and a staked-out building plot
  const PROP = {stake: [12, 84], rack: [164, 94], paddock: [116, 42], plot: [116, 66], cross: [20, 34], stone: [22, 30], gatetower: [58, 118]};
  function prop(kind, v, se){
    const size = PROP[kind]; if (!size) return null;
    const p = P(se), w = se === 'winter', r = rng(hsh(v * 29 + 11, kind.length * 211 + kind.charCodeAt(1) * 13));
    const W = size[0] * R, H = size[1] * R, c = mk(W + 16 * R, H + 12 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 6 * R;
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const mud = hx(w ? '#2a2826' : '#2a2219'), mudD = hx('#16120e'), cut = hx(w ? '#6a6456' : '#7a6a4c'), rope = hx('#4e4430'), hide = hx('#3a2c20'), tall = kind === 'stake' || kind === 'rack' || kind === 'gatetower' || kind === 'cross' || kind === 'stone';
    // a weathered post: dark shaded side, lit side, grain lines, a split at the top
    const post = (x, top, bot, pw, lean) => { const L = lit(), x1 = x + (lean || 0);
      poly(g, [[x - pw, bot], [x1 - pw * 0.9, top], [x1 + pw * 0.9, top], [x + pw, bot]], rgb(p.bark));
      poly(g, [[x + pw * L * 0.15, bot], [x1 + pw * L * 0.1, top], [x1 + pw * L * 0.9, top], [x + pw * L, bot]], rgba(p.barkL, 0.55));
      poly(g, [[x - pw * L, bot], [x1 - pw * L * 0.9, top], [x1 - pw * L * 0.35, top], [x - pw * L * 0.4, bot]], rgba(p.barkD, 0.75));
      for (let i = 0; i < 3; i++){ const t = r(); line(x - pw + pw * 2 * t, bot - 2 * R, x1 - pw * 0.9 + pw * 1.8 * t, top + (3 + r() * 6) * R, rgba(p.barkD, 0.5), 0.7 * R); }
      line(x1 - pw * 0.3, top, x1 + pw * 0.1, top + (4 + r() * 5) * R, rgb(p.barkD), 0.9 * R); };
    const rect_ = (gg, x, y, ww, hh, col) => { gg.fillStyle = col; gg.fillRect(x, y, ww, hh); };
    const lash = (x, y, pw) => { for (let i = 0; i < 3; i++) line(x - pw * 1.15, y + i * 1.6 * R + 0.4 * R, x + pw * 1.15, y + i * 1.6 * R - 0.4 * R, rgb(i === 1 ? mix(rope, p.plaster, 0.3) : rope), 1.3 * R); };
    if (kind === 'stake'){
      // one palisade stake: a sharpened log, leaning its own way, lashed where its neighbour was, mud heaped at its foot
      const pw = W * 0.3, h = H * (0.86 + r() * 0.14), lean = (r() - 0.5) * W * 0.4, top = by - h, tx = cx + lean;
      ell(cx, by, W * 0.6, 3 * R, rgba(mudD, 0.5)); post(cx, top + 8 * R, by, pw, lean);
      poly(g, [[tx - pw * 0.9, top + 8 * R], [tx + pw * 0.9, top + 8 * R], [tx + pw * 0.15 * lit(), top]], rgb(cut)); poly(g, [[tx - pw * 0.9 * lit(), top + 8 * R], [tx + pw * 0.15 * lit(), top], [tx + pw * 0.15 * lit(), top + 8 * R]], rgba(p.barkD, 0.45));
      lash(cx + lean * 0.3, by - h * 0.62, pw); if (r() < 0.5) lash(cx + lean * 0.75, by - h * 0.9, pw * 0.95);
      for (let i = 0; i < 3; i++) ell(cx + (r() - 0.5) * W * 0.9, by - r() * 2 * R, (2 + r() * 3) * R, (1 + r()) * R, rgb(mix(mud, p.stone, r() * 0.4)));
    } else if (kind === 'rack'){
      // the trophy rack: two posts, a crossbar, braces, a lower rail, iron hooks, one hide and a rope hanging; the trophies are drawn over it by the camp
      const px = W * 0.42, pw = 4.2 * R, top = by - H * 0.88;
      ell(cx, by, W * 0.5, 4 * R, rgba(mudD, 0.45));
      post(cx - px, top + 2 * R, by, pw, (r() - 0.5) * 3 * R); post(cx + px, top + 2 * R, by, pw, (r() - 0.5) * 3 * R);
      line(cx - px + pw, by - H * 0.42, cx + px - pw, by - H * 0.46, rgb(p.bark), 3.2 * R); line(cx - px + pw, by - H * 0.42 - 1.2 * R, cx + px - pw, by - H * 0.46 - 1.2 * R, rgba(p.barkL, 0.5), 1.2 * R);
      poly(g, [[cx - px - pw * 1.7, top + 3 * R], [cx + px + pw * 1.7, top + 1.5 * R], [cx + px + pw * 1.7, top - 4.5 * R], [cx - px - pw * 1.7, top - 3 * R]], rgb(p.bark));
      line(cx - px - pw * 1.5, top - 2.5 * R, cx + px + pw * 1.5, top - 4 * R, rgba(p.barkL, 0.6), 1.4 * R); line(cx - px - pw * 1.5, top + 2.5 * R, cx + px + pw * 1.5, top + R, rgba(p.barkD, 0.8), 1.2 * R);
      line(cx - px + pw, top + 4 * R, cx - px + pw + H * 0.2, top + 2 * R + H * 0.2, rgb(p.barkD), 2.6 * R); line(cx + px - pw, top + 4 * R, cx + px - pw - H * 0.2, top + 2 * R + H * 0.2, rgb(p.barkD), 2.6 * R);
      for (let i = 0; i < 6; i++){ const x = cx - px + pw * 2 + (W * 0.84 - pw * 4) * (i + 0.5) / 6, y = top + 3 * R; line(x, y, x, y + 5 * R, rgb(p.iron), 1.4 * R); line(x, y + 5 * R, x + 2.2 * R, y + 3.5 * R, rgb(p.iron), 1.4 * R); }
      { const x = cx - px + pw * 2 + (W * 0.84 - pw * 4) * 1.5 / 6, y = top + 7 * R; poly(g, [[x - 3 * R, y], [x + 4 * R, y + R], [x + 9 * R, y + H * 0.3], [x + 2 * R, y + H * 0.36], [x - 7 * R, y + H * 0.28]], rgb(hide)); poly(g, [[x - 3 * R, y], [x + 4 * R, y + R], [x + R, y + H * 0.2], [x - 4 * R, y + H * 0.16]], rgba(mix(hide, p.plasterD, 0.5), 0.8)); }
      { const x = cx - px + pw * 2 + (W * 0.84 - pw * 4) * 4.5 / 6, y = top + 7 * R; for (let i = 0; i < 5; i++) ell(x + (i % 2) * 1.2 * R, y + 3 * R + i * 2.6 * R, 3.2 * R, 1.6 * R, rgb(i % 2 ? rope : mix(rope, p.barkD, 0.4))); line(x + R, y + 15 * R, x + 2 * R, y + 26 * R, rgb(rope), 1.3 * R); }
      for (let i = 0; i < 2; i++) lash(cx + (i ? px : -px), top + 5 * R, pw * 1.2);
    } else if (kind === 'paddock'){
      // the stable paddock: a run of fence posts with two sagging rails over trampled mud, one rail broken and hanging
      const n = 5, ph = H * 0.72, pw = 2.6 * R, xs = []; for (let i = 0; i < n; i++) xs.push(cx - W * 0.46 + W * 0.92 * i / (n - 1) + (r() - 0.5) * 4 * R);
      ell(cx, by - 2 * R, W * 0.54, H * 0.22, rgba(mud, 0.9)); for (let i = 0; i < 14; i++) ell(cx + (r() - 0.5) * W * 0.95, by - r() * H * 0.3, (1.5 + r() * 3) * R, (0.8 + r()) * R, rgba(i % 3 ? mudD : p.stoneL, 0.5));
      const broken = v % 2 === 1 ? n - 2 : -1;
      for (let i = 0; i < n - 1; i++) for (const [k, sag] of [[0.78, 1], [0.42, 1.6]]){ const y0 = by - ph * k + (r() - 0.5) * 2 * R, y1 = by - ph * k + (r() - 0.5) * 2 * R;
        if (i === broken && k < 0.5){ line(xs[i], y0, xs[i] + (xs[i + 1] - xs[i]) * 0.55, by - 1 * R, rgb(p.bark), 2.4 * R); continue; }
        g.strokeStyle = rgb(p.bark); g.lineWidth = 2.6 * R; g.lineCap = 'round'; g.beginPath(); g.moveTo(xs[i], y0); g.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, (y0 + y1) / 2 + sag * 2 * R, xs[i + 1], y1); g.stroke();
        g.strokeStyle = rgba(p.barkL, 0.45); g.lineWidth = 0.9 * R; g.beginPath(); g.moveTo(xs[i], y0 - 0.8 * R); g.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, (y0 + y1) / 2 + sag * 2 * R - 0.8 * R, xs[i + 1], y1 - 0.8 * R); g.stroke(); }
      xs.forEach((x, i) => { post(x, by - ph - (r() * 4) * R, by + (i % 2) * R, pw, (r() - 0.5) * 3 * R); lash(x, by - ph * 0.78, pw); });
    } else if (kind === 'plot'){
      // an empty building plot: dug dark earth, four corner pegs with string, a stack of cut timber and a spade left in the ground
      const rx = W * 0.46, ry = H * 0.34, cy = by - ry - 2 * R;
      // scraped, not dug: the plot read as a black pit under the camp grade (Patrick, 2026-11-12), so it is pale turned earth with the turf cut away
      const scr = mix(mud, cut, 0.42);
      const pts = blob(r, cx, cy, rx, 14, 0.12).map(q => [q[0], cy + (q[1] - cy) * ry / rx]); poly(g, pts, rgb(scr)); g.save(); g.clip();
      for (let i = 0; i < 40; i++) ell(cx + (r() - 0.5) * rx * 2, cy + (r() - 0.5) * ry * 2, (2 + r() * 5) * R, (1 + r() * 2) * R, rgba(i % 4 ? mudD : p.stoneL, i % 4 ? 0.22 : 0.3), r() * 3);
      for (let i = 0; i < 5; i++){ const y = cy - ry + ry * 2 * (i + 0.5) / 5; line(cx - rx, y, cx + rx, y + 2 * R, rgba(mudD, 0.3), 1.4 * R); }
      g.restore(); poly(g, pts, null, rgba(mudD, 0.5), 1.2 * R);
      const pegs = [[cx - rx * 0.88, cy + ry * 0.55], [cx + rx * 0.88, cy + ry * 0.6], [cx + rx * 0.8, cy - ry * 0.7], [cx - rx * 0.8, cy - ry * 0.65]];
      for (let i = 0; i < 4; i++){ const a = pegs[i], b = pegs[(i + 1) % 4]; line(a[0], a[1] - 5.5 * R, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 4.5 * R, rgb(mix(rope, p.plaster, 0.4)), 0.9 * R); line((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 4.5 * R, b[0], b[1] - 5.5 * R, rgb(mix(rope, p.plaster, 0.4)), 0.9 * R); }
      for (const q of pegs){ post(q[0], q[1] - 7 * R, q[1], 2.1 * R, (r() - 0.5) * 1.5 * R); ell(q[0], q[1] - 7 * R, 2.2 * R, 1 * R, rgb(cut)); }
      { const x = cx + rx * 0.45, y = cy + ry * 0.25; for (let i = 0; i < 4; i++){ const yy = y - i * 3.2 * R, xx = x + (i % 2) * 1.5 * R; line(xx - 14 * R, yy, xx + 14 * R, yy - 0.6 * R, rgb(i % 2 ? p.bark : p.barkL), 3.4 * R); ell(xx + 14 * R, yy - 0.3 * R, 1.9 * R, 1.7 * R, rgb(cut)); } }
      { const x = cx - rx * 0.5, y = cy - ry * 0.2; line(x, y, x + 3 * R, y - 22 * R, rgb(p.bark), 1.6 * R); line(x + 2 * R, y - 22 * R, x + 4.5 * R, y - 22.5 * R, rgb(p.bark), 1.6 * R); poly(g, [[x - 3.5 * R, y - 2 * R], [x + 3.5 * R, y - 3 * R], [x + 3 * R, y + 5 * R], [x - 3 * R, y + 5.5 * R]], rgb(p.iron)); }
    } else if (kind === 'cross' || kind === 'stone'){
      // a grave: a low mound of turned earth with a few stones pressed in; over it either two weathered timbers lashed into a cross, leaning, or a rounded slate headstone, cracked and lichened
      const L = lit(), mh = H * 0.2, mw = W * 0.5, lean = (r() - 0.5) * 0.14;
      ell(cx, by - mh * 0.45, mw, mh, rgb(mix(mud, mudD, 0.25))); ell(cx - mw * 0.2 * L, by - mh * 0.6, mw * 0.55, mh * 0.4, rgba(mix(mud, p.stoneL, 0.25), 0.5));
      for (let i = 0; i < 5; i++) ell(cx + (r() - 0.5) * mw * 1.6, by - r() * mh * 0.9, (1 + r() * 1.5) * R, (0.7 + r() * 0.6) * R, rgb(mix(p.stone, i % 2 ? p.stoneL : p.stoneD, r() * 0.5)));
      for (let i = 0; i < 4; i++) line(cx + (r() - 0.5) * mw * 1.5, by - r() * mh * 0.8, cx + (r() - 0.5) * mw * 1.5, by - r() * mh * 0.8, rgba(mudD, 0.7), 0.7 * R);
      if (kind === 'cross'){
        const h = H * 0.76, pw = 1.9 * R, top = by - mh * 0.6 - h, arm = W * 0.38, ay = top + h * 0.3;
        g.save(); g.translate(cx, by - mh * 0.6); g.rotate(lean); g.translate(-cx, -(by - mh * 0.6));
        post(cx, top, by - mh * 0.6 + 2 * R, pw, 0);
        poly(g, [[cx - arm, ay - pw * 0.9], [cx + arm, ay - pw * 1.1], [cx + arm, ay + pw * 0.9], [cx - arm, ay + pw * 1.1]], rgb(p.bark));
        poly(g, [[cx - arm, ay - pw * 0.9], [cx + arm, ay - pw * 1.1], [cx + arm, ay - pw * 0.3], [cx - arm, ay - pw * 0.1]], rgba(p.barkL, 0.5));
        poly(g, [[cx - arm, ay + pw * 0.4], [cx + arm, ay + pw * 0.2], [cx + arm, ay + pw * 0.9], [cx - arm, ay + pw * 1.1]], rgba(p.barkD, 0.7));
        line(cx - arm * 0.5, ay + pw * 0.3, cx - arm * 0.1, ay + pw * 0.1, rgba(p.barkD, 0.6), 0.7 * R); line(cx + arm * 0.2, ay - pw * 0.2, cx + arm * 0.8, ay, rgba(p.barkD, 0.5), 0.6 * R);
        for (let i = 0; i < 2; i++) line(cx - pw * 1.6, ay - pw * 1.3 + i * 1.5 * R, cx + pw * 1.6, ay + pw * 1.3 - i * 1.5 * R, rgb(i ? rope : mix(rope, p.plaster, 0.25)), 1.1 * R);
        for (let i = 0; i < 2; i++) line(cx - pw * 1.6, ay + pw * 1.3 - i * 1.5 * R, cx + pw * 1.6, ay - pw * 1.3 + i * 1.5 * R, rgb(i ? rope : mix(rope, p.barkD, 0.3)), 1.1 * R);
        if (r() < 0.6) ell(cx + pw * 0.5 * L, top + h * 0.62, 1.2 * R, 2.4 * R, rgba(p.moss, 0.5));
        g.restore();
      } else {
        const sw = W * 0.4, sh = H * 0.72, bot = by - mh * 0.55, top = bot - sh, slate = mix(p.slate, p.stone, 0.6), slateL = mix(p.slateL, p.stoneL, 0.6), slateD = mix(slate, p.stoneD, 0.6);
        g.save(); g.translate(cx, bot); g.rotate(lean * 0.6); g.translate(-cx, -bot);
        const face = [[cx - sw, bot], [cx - sw, top + sw * 0.9], [cx - sw * 0.55, top + sw * 0.2], [cx, top], [cx + sw * 0.55, top + sw * 0.2], [cx + sw, top + sw * 0.9], [cx + sw, bot]];
        poly(g, face.map(q => [q[0] + 1.6 * R * L, q[1] + 0.6 * R]), rgb(slateD));   // the shaded edge
        poly(g, face, rgb(slate));
        poly(g, [[cx - sw * L, bot], [cx - sw * L, top + sw * 0.9], [cx - sw * 0.55 * L, top + sw * 0.2], [cx - sw * 0.15 * L, top + sw * 0.08], [cx - sw * 0.15 * L, bot]], rgba(slateL, 0.22));   // the lit half
        g.strokeStyle = rgba(p.stoneD, 0.8); g.lineWidth = 0.8 * R; g.beginPath(); g.moveTo(cx - sw * 0.3, top + sw * 0.6); g.lineTo(cx + sw * 0.1, top + sh * 0.45); g.lineTo(cx - sw * 0.05, top + sh * 0.7); g.stroke();   // the crack
        for (let i = 0; i < 4; i++){ const y = top + sh * (0.3 + i * 0.16); line(cx - sw * 0.55, y, cx + sw * 0.55, y + (r() - 0.5) * R, rgba(p.stoneD, 0.5), 0.9 * R); line(cx - sw * 0.35 + r() * sw * 0.3, y, cx - sw * 0.1 + r() * sw * 0.4, y, rgba(p.stoneD, 0.7), 1.3 * R); }   // worn lines of a name nobody can read
        for (let i = 0; i < 4; i++) ell(cx + (r() - 0.5) * sw * 1.4, top + sw * 0.3 + r() * sh * 0.4, (1 + r() * 1.5) * R, (0.8 + r()) * R, rgba(mix(p.moss, p.plaster, 0.5), 0.35));   // lichen
        ell(cx + sw * 0.5 * L, bot - 2 * R, sw * 0.5, 2.2 * R, rgba(p.moss, 0.45)); poly(g, face, null, rgba(p.stoneD, 0.6), 0.7 * R);
        g.restore();
      }
    } else if (kind === 'gatetower'){
      // a watchtower on the palisade ring: four lashed legs with cross braces, a plank hoarding leaning out at the top, a steep shingle hood, a ladder up the back and mud heaped round the feet
      const L = lit(), th = H * 0.94, lw = W * 0.3, pw = 2.6 * R, legT = by - th * 0.62, hoodT = by - th, hoodB = by - th * 0.8, hw = W * 0.47;
      ell(cx, by, W * 0.55, 5 * R, rgba(mudD, 0.5));
      for (let i = 0; i < 2; i++){ const x = cx + (i ? 1 : -1) * lw * 0.55; post(x, legT - 3 * R, by - 3 * R, pw * 0.85, (i ? 1 : -1) * 1.5 * R); }   // the back legs
      line(cx - lw * 0.75, by - th * 0.45, cx + lw * 0.75, by - th * 0.2, rgb(p.barkD), 2.2 * R); line(cx - lw * 0.75, by - th * 0.2, cx + lw * 0.75, by - th * 0.45, rgb(p.barkD), 2.2 * R);   // back braces
      for (let i = 0; i < 2; i++){ const x = cx + (i ? 1 : -1) * lw; post(x, legT, by, pw, (i ? 1 : -1) * 3 * R); }   // the front legs
      line(cx - lw - 2 * R, by - th * 0.5, cx + lw + 2 * R, by - th * 0.25, rgb(p.bark), 2.6 * R); line(cx - lw - 2 * R, by - th * 0.5 - R, cx + lw + 2 * R, by - th * 0.25 - R, rgba(p.barkL, 0.5), R);
      line(cx - lw - 2 * R, by - th * 0.25, cx + lw + 2 * R, by - th * 0.5, rgb(p.bark), 2.6 * R); line(cx - lw - 2 * R, by - th * 0.25 - R, cx + lw + 2 * R, by - th * 0.5 - R, rgba(p.barkL, 0.4), R);   // front braces
      for (let i = 0; i < 2; i++) lash(cx + (i ? 1 : -1) * lw * 0.98, by - th * 0.375, pw * 1.1);
      line(cx - lw, legT + 2 * R, cx + lw, legT + 2 * R, rgb(p.barkD), 3 * R);   // the platform beam
      { const x = cx + lw * 0.95 * L, step = th * 0.055; line(x - 2.5 * R, by, x - 1.5 * R, legT, rgb(p.barkD), 1.3 * R); line(x + 2.5 * R, by, x + 3.5 * R, legT, rgb(p.barkD), 1.3 * R); for (let i = 1; i < 10; i++) line(x - 2.5 * R + i * 0.1 * R, by - i * step, x + 2.5 * R + i * 0.1 * R, by - i * step, rgb(p.bark), 1.1 * R); }   // the ladder
      // the hoarding: planks leaning out, a lit face and a shaded face, a slot for the watcher
      const hb = legT, ht = hoodB + 3 * R, pts = [[cx - hw * 0.85, hb], [cx - hw, ht], [cx + hw, ht], [cx + hw * 0.85, hb]];
      poly(g, pts, rgb(mix(p.bark, p.timber, 0.4)));
      for (let i = 0; i < 9; i++){ const t = i / 9, u = (i + 1) / 9, xa = cx - hw * 0.85 + hw * 1.7 * t, xb = cx - hw + hw * 2 * t, xc = cx - hw + hw * 2 * u - 0.5 * R, xd = cx - hw * 0.85 + hw * 1.7 * u - 0.5 * R;
        poly(g, [[xa, hb], [xb, ht], [xc, ht], [xd, hb]], rgb(mix(p.bark, p.barkL, r() * 0.4 + (i % 2) * 0.1))); line(xb, ht + (hb - ht) * 0.15, xa, hb - 2 * R, rgba(p.barkD, 0.55), 0.7 * R); }
      poly(g, [[cx - hw * 0.85 * L, hb], [cx - hw * L, ht], [cx - hw * 0.35 * L, ht], [cx - hw * 0.3 * L, hb]], rgba(p.barkL, 0.22)); poly(g, [[cx + hw * 0.85 * L, hb], [cx + hw * L, ht], [cx + hw * 0.4 * L, ht], [cx + hw * 0.35 * L, hb]], rgba(p.barkD, 0.45));
      line(cx - hw * 0.9, hb - 1.5 * R, cx + hw * 0.9, hb - 1.5 * R, rgb(p.barkD), 1.6 * R); line(cx - hw * 0.95, ht + 2 * R, cx + hw * 0.95, ht + 2 * R, rgb(p.barkD), 1.6 * R);   // the rails holding the planks
      rect_(g, cx - hw * 0.28, ht + 5 * R, hw * 0.56, 4.5 * R, rgb(mudD)); rect_(g, cx - hw * 0.28, ht + 5 * R, hw * 0.56, 0.8 * R, rgba(p.barkD, 0.9));   // the watch slot, black inside
      // the shingle hood: a steep pitch with a lit face, rows of shingles, a dark eave and a split board at the ridge
      const ridge = hoodT + 2 * R, eave = hoodB + 4 * R, ew = hw * 1.12;
      poly(g, [[cx - ew, eave], [cx, ridge], [cx + ew, eave]], rgb(p.shingle));
      poly(g, [[cx - ew * L, eave], [cx, ridge], [cx, eave]], rgba(p.shingleL, 0.3));
      for (let i = 0; i < 6; i++){ const t = (i + 1) / 7, y = ridge + (eave - ridge) * t, xw = ew * t; line(cx - xw, y, cx + xw, y, rgba(p.stoneD, 0.5), 0.8 * R); for (let j = 0; j < 4 + i * 2; j++){ const x = cx - xw + xw * 2 * (j + 0.5) / (4 + i * 2); line(x, y, x + (r() - 0.5) * R, y - (eave - ridge) / 7 * 0.9, rgba(p.stoneD, 0.4), 0.6 * R); } }
      line(cx - ew, eave, cx + ew, eave, rgb(p.barkD), 1.8 * R); line(cx - 3 * R, ridge, cx + 3 * R, ridge + 0.5 * R, rgb(p.barkD), 2.2 * R);
      for (let i = 0; i < 3; i++) ell(cx + (r() - 0.5) * ew * 0.8, ridge + (eave - ridge) * (0.4 + r() * 0.5), (1.5 + r() * 2) * R, (0.8 + r()) * R, rgba(p.moss, 0.4));
      for (let i = 0; i < 5; i++) ell(cx + (r() - 0.5) * W * 0.9, by - r() * 2 * R, (2 + r() * 3) * R, (1 + r()) * R, rgb(mix(mud, p.stone, r() * 0.4)));
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -lit(), 0.3);
    return finish(c, cx, by, tall, 'prop', tall ? 0.45 : 0.18);
  }
  // the hook: W3D's w_stake, w_rack, paddock and m_plot kinds land here while VO3 is on
  const PROP_KIND = {w_stake: 'stake', w_rack: 'rack', paddock: 'paddock', m_plot: 'plot', w_cross: 'cross', w_stone: 'stone', w_gatetower: 'gatetower'};
  V.drawProp = function(kind, x, gl, o){
    const K = PROP_KIND[kind]; if (!K) return null;
    const sp = V.sprite('prop', hsh(x | 0, gl | 0) % 4, seNow(), {k: K}); if (!sp) return false;
    blitSprite(sp, x, gl, K === 'plot' && V.hubFort && V.hubFort() ? V.K.hubBuild : 1, K !== 'rack' && !!(hsh(x | 0, 7) % 2), K === 'plot' || K === 'gatetower'); return true;
  };

  // batch 6: the contract-map holding props painted afresh: chest, cage, vault, beacon, banner, relic, ruin stone, column, gate (W3D's m_* kinds, in world pixels)
  const MPROP = {chest: [44, 32], cage: [52, 78], vault: [70, 120], beacon: [50, 104], banner: [54, 112], relic: [44, 60], ruinstone: [52, 30], column: [42, 88], gate: [104, 118], chbanner: [64, 92]};
  function mapProp(kind, v, se, o){
    const size = MPROP[kind]; if (!size) return null;
    o = o || {}; const open = !!o.open, isLit = !!o.lit, flag = o.flag || 'war';
    const p = P(se), w = se === 'winter', r = rng(hsh(v * 31 + 5, kind.length * 173 + kind.charCodeAt(0) * 11 + (open ? 7 : 0)));
    const W = size[0] * R, H = size[1] * R, c = mk(W + 24 * R, H + 16 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 8 * R, L = lit();
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const rect = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    const mudD = hx('#16120e'), brass = hx('#3e3218'), brassL = hx('#544424'), ironL = hx('#3c3e44'), rust = hx('#4a2e1c'), cut = hx(w ? '#6a6456' : '#7a6a4c'), rope = hx('#4e4430');
    const tall = kind === 'cage' || kind === 'beacon' || kind === 'banner' || kind === 'column' || kind === 'gate' || kind === 'chbanner';
    // dressed stone block with a lit and a shaded face, cracks and moss
    const block = (x, y, ww, hh, d) => { rect(x, y, ww, hh, rgb(p.stone)); rect(x + (L > 0 ? ww - d : 0), y, d, hh, rgba(p.stoneL, 0.5)); rect(x + (L > 0 ? 0 : ww - d), y, d, hh, rgba(p.stoneD, 0.7)); rect(x, y + hh - 2 * R, ww, 2 * R, rgba(p.stoneD, 0.8));
      for (let i = 0; i < 2; i++) line(x + r() * ww, y + r() * hh, x + r() * ww, y + r() * hh, rgba(p.stoneD, 0.7), 0.8 * R); if (r() < 0.7) ell(x + r() * ww, y + hh - r() * hh * 0.3, 3 * R, 1.5 * R, rgba(p.moss, 0.5)); };
    const planks = (x, y, ww, hh, n, vert) => { for (let i = 0; i < n; i++){ const t = i / n, u = (i + 1) / n; if (vert) rect(x + ww * t, y, ww / n - 0.5 * R, hh, rgb(mix(p.bark, p.barkL, r() * 0.35))); else rect(x, y + hh * t, ww, hh / n - 0.5 * R, rgb(mix(p.bark, p.barkL, r() * 0.35))); }
      g.strokeStyle = rgba(p.barkD, 0.6); g.lineWidth = 0.7 * R; for (let i = 0; i < 4; i++){ g.beginPath(); const yy = y + r() * hh; g.moveTo(x, yy); g.lineTo(x + ww, yy + (r() - 0.5) * 3 * R); g.stroke(); } };
    const band = (x, y, ww, hh) => { rect(x, y, ww, hh, rgb(p.iron)); rect(x, y, ww, hh * 0.35, rgba(ironL, 0.6)); for (let i = 0; i < 3; i++) ell(x + ww * (i + 0.5) / 3, y + hh / 2, 0.9 * R, 0.9 * R, rgba(rust, 0.9)); };
    const bar = (x0, y0, x1, y1, lw) => { line(x0, y0, x1, y1, rgb(p.iron), lw); line(x0 - 0.5 * R * L, y0, x1 - 0.5 * R * L, y1, rgba(ironL, 0.55), lw * 0.35); if (r() < 0.6) line(x0, y0 + (y1 - y0) * r(), x1, y0 + (y1 - y0) * (0.5 + r() * 0.5), rgba(rust, 0.5), lw * 0.5); };
    if (kind === 'chest'){
      // an iron-banded timber chest; open: the lid thrown back, something dull-bright inside
      const bw = W * 0.46, bh = H * 0.62, top = by - bh, lx = cx - bw;
      ell(cx, by, bw * 1.15, 3 * R, rgba(mudD, 0.45)); planks(lx, top, bw * 2, bh, 3, false); rect(lx + (L > 0 ? bw * 2 - 3 * R : 0), top, 3 * R, bh, rgba(p.barkD, 0.7));
      if (!open){ g.fillStyle = rgb(p.barkD); g.beginPath(); g.moveTo(lx - R, top); g.quadraticCurveTo(cx, top - H * 0.42, lx + bw * 2 + R, top); g.closePath(); g.fill(); g.fillStyle = rgba(p.barkL, 0.35); g.beginPath(); g.moveTo(lx + 2 * R, top); g.quadraticCurveTo(cx, top - H * 0.32, cx + bw * 0.8, top); g.closePath(); g.fill(); band(lx + bw * 0.5, top - H * 0.17, 4 * R, H * 0.2 + bh); band(lx + bw * 1.4, top - H * 0.17, 4 * R, H * 0.2 + bh); rect(cx - 2.5 * R, top + 2 * R, 5 * R, 6 * R, rgb(p.iron)); ell(cx, top + 5 * R, 1.3 * R, 1.3 * R, rgb(brass)); }
      else { rect(lx + R, top, bw * 2 - 2 * R, bh * 0.5, rgb(mudD)); for (let i = 0; i < 7; i++) ell(lx + 4 * R + r() * (bw * 2 - 8 * R), top + 3 * R + r() * bh * 0.3, 2 * R, 1.2 * R, rgb(i % 3 ? brass : brassL)); g.fillStyle = rgb(p.barkD); g.beginPath(); g.moveTo(lx - R, top); g.lineTo(lx + bw * 2 + R, top); g.lineTo(lx + bw * 2 + 4 * R, top - H * 0.5); g.lineTo(lx + 2 * R, top - H * 0.5); g.closePath(); g.fill(); rect(lx + 2 * R, top - H * 0.5, bw * 2, 3 * R, rgba(p.barkL, 0.3)); band(lx + bw * 0.5, top, 4 * R, bh); band(lx + bw * 1.4, top, 4 * R, bh); band(lx + bw * 0.6, top - H * 0.5, 4 * R, H * 0.5); band(lx + bw * 1.5, top - H * 0.5, 4 * R, H * 0.5); }
    } else if (kind === 'cage'){
      // a hanging-iron cage set on the ground: a ring top and bottom, bars, a dark inside; open: the door bars swung out
      const rw = W * 0.4, top = by - H * 0.92, n = 7;
      ell(cx, by, rw * 1.2, 4 * R, rgba(mudD, 0.5)); ell(cx, by - 2 * R, rw, 4 * R, rgb(p.iron)); ell(cx, by - 3 * R, rw * 0.9, 2.5 * R, rgba(mudD, 0.9));
      for (let i = 0; i < n; i++){ const t = i / (n - 1), x = cx - rw + rw * 2 * t, bulge = Math.sin(t * Math.PI) * 0; if (open && i >= n - 3){ const sx = cx + rw + (i - (n - 3)) * 5 * R + 4 * R; bar(sx, by - 4 * R - (i - (n - 3)) * 2 * R, sx + 8 * R, top + 8 * R + (i - (n - 3)) * 3 * R, 1.8 * R); continue; } bar(x + bulge, by - 3 * R, x, top + 3 * R, 1.8 * R); }
      for (const yy of [by - H * 0.35, by - H * 0.65]) line(cx - rw, yy, cx + rw, yy - R, rgb(p.iron), 1.6 * R);
      g.fillStyle = rgb(p.iron); g.beginPath(); g.moveTo(cx - rw, top + 4 * R); g.quadraticCurveTo(cx, top - 6 * R, cx + rw, top + 4 * R); g.lineTo(cx + rw, top + 7 * R); g.quadraticCurveTo(cx, top - 2 * R, cx - rw, top + 7 * R); g.closePath(); g.fill();
      line(cx - rw * 0.3, top, cx + rw * 0.2, top - R, rgba(ironL, 0.6), 1.2 * R); line(cx, top - 2 * R, cx, top - 8 * R, rgb(p.iron), 2 * R); ell(cx, top - 10 * R, 3 * R, 3 * R, rgb(p.iron)); ell(cx, top - 10 * R, 1.4 * R, 1.4 * R, rgb(mix(p.stone, mudD, 0.3)));
      if (open) rect(cx + rw * 0.35, top + 8 * R, rw * 0.65, by - top - 12 * R, rgba(mudD, 0.35)); for (let i = 0; i < 6; i++) ell(cx + (r() - 0.5) * rw * 1.8, by - r() * H * 0.08, (1.5 + r() * 2) * R, R, rgba(i % 2 ? p.stoneL : mudD, 0.5));
    } else if (kind === 'vault'){
      // a strongroom door set in a squat dressed-stone front; open: a black doorway
      const bw = W * 0.48, bh = H * 0.8, top = by - bh, x0 = cx - bw;
      ell(cx, by, bw * 1.2, 4 * R, rgba(mudD, 0.5)); block(x0, top, bw * 2, bh, 5 * R); line(x0, top + bh * 0.5, x0 + bw * 2, top + bh * 0.5 + R, rgba(p.stoneD, 0.8), 1.2 * R); for (let i = 0; i < 4; i++) line(x0 + bw * 2 * (i + 0.5) / 4, top + bh * (i % 2 ? 0 : 0.5), x0 + bw * 2 * (i + 0.5) / 4, top + bh * (i % 2 ? 0.5 : 1), rgba(p.stoneD, 0.7), R);
      block(x0 - 3 * R, top - 5 * R, bw * 2 + 6 * R, 7 * R, 4 * R);
      const dw = bw * 0.62, dh = bh * 0.8, dx = cx - dw, dy = by - dh;
      if (open){ rect(dx, dy, dw * 2, dh, rgb(mudD)); rect(dx, dy, dw * 2, dh * 0.15, rgba(p.stoneD, 0.5)); rect(dx + dw * 2 - 8 * R * L, dy, 7 * R, dh, rgb(p.iron)); for (let i = 0; i < 3; i++) rect(dx + dw * 2 - 8 * R * L, dy + dh * (0.15 + i * 0.3), 7 * R, 3 * R, rgba(ironL, 0.6)); }
      else { rect(dx, dy, dw * 2, dh, rgb(p.iron)); rect(dx, dy, dw * 2, dh * 0.1, rgba(ironL, 0.6)); for (let i = 0; i < 3; i++) band(dx, dy + dh * (0.12 + i * 0.32), dw * 2, 4 * R); for (let i = 0; i < 2; i++) band(dx + dw * 2 * (i ? 0.78 : 0.14), dy, 4 * R, dh); ell(cx + dw * 0.45, dy + dh * 0.5, 4 * R, 4 * R, rgb(p.iron)); ell(cx + dw * 0.45, dy + dh * 0.5, 2.6 * R, 2.6 * R, rgba(ironL, 0.7)); ell(cx + dw * 0.45, dy + dh * 0.5, 1.2 * R, 1.2 * R, rgb(rust)); }
    } else if (kind === 'beacon'){
      // a beacon: an iron fire basket on a timber post with three legs; lit: embers in the basket and the flames drawn over it by the camp
      const pw = 3.2 * R, top = by - H * 0.74;
      ell(cx, by, W * 0.5, 4 * R, rgba(mudD, 0.5)); for (const d of [-1, 1]) line(cx + d * 3 * R, by - H * 0.3, cx + d * W * 0.4, by - R, rgb(p.barkD), 3 * R); line(cx + pw * 0.4, by - H * 0.3, cx + 2 * R, by - 2 * R, rgb(p.barkD), 2.4 * R);
      rect(cx - pw, top, pw * 2, by - top, rgb(p.bark)); rect(cx + (L > 0 ? 0 : -pw), top, pw, by - top, rgba(p.barkL, 0.45)); rect(cx + (L > 0 ? -pw : pw * 0.3), top, pw * 0.7, by - top, rgba(p.barkD, 0.7)); for (let i = 0; i < 3; i++) line(cx - pw * 1.2, by - H * (0.2 + i * 0.18), cx + pw * 1.2, by - H * (0.2 + i * 0.18) - R, rgb(rope), 1.3 * R);
      const bw = W * 0.42, bt = top - H * 0.2; g.fillStyle = rgb(p.iron); g.beginPath(); g.moveTo(cx - bw, bt); g.lineTo(cx + bw, bt); g.lineTo(cx + bw * 0.55, top + 6 * R); g.lineTo(cx - bw * 0.55, top + 6 * R); g.closePath(); g.fill();
      for (let i = 0; i < 5; i++){ const t = i / 4; bar(cx - bw + bw * 2 * t, bt, cx - bw * 0.55 + bw * 1.1 * t, top + 6 * R, 1.4 * R); } line(cx - bw, bt, cx + bw, bt, rgb(p.iron), 2.2 * R); line(cx - bw, bt, cx + bw, bt, rgba(ironL, 0.5), R);
      if (isLit){ ell(cx, bt + 2 * R, bw * 0.8, 3 * R, rgb(p.ember)); ell(cx, bt + R, bw * 0.5, 2 * R, rgb(mix(p.ember, hx('#f0c060'), 0.5))); for (let i = 0; i < 5; i++) ell(cx + (r() - 0.5) * bw * 1.4, bt + 3 * R + r() * 6 * R, 1.6 * R, R, rgba(p.ember, 0.8)); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(cx, bt, 0, cx, bt, H * 0.5); gr.addColorStop(0, rgba(p.ember, 0.35)); gr.addColorStop(1, rgba(p.ember, 0)); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); g.restore(); }
      else { for (let i = 0; i < 6; i++) ell(cx + (r() - 0.5) * bw * 1.3, bt + 2 * R + r() * 5 * R, (1.5 + r()) * R, R, rgba(i % 2 ? p.stoneD : p.barkD, 0.9)); ell(cx, bt + R, bw * 0.6, 2 * R, rgba(mudD, 0.8)); }
    } else if (kind === 'banner'){
      // a banner: a leaning pole with a cross-spar, a torn hanging cloth, a rope tie and a heap of stones at the foot (war: dark red; done: grey; exit: moss)
      const pw = 2.4 * R, lean = (r() - 0.5) * 6 * R, top = by - H * 0.95, cloth = flag === 'done' ? hx('#34332f') : flag === 'exit' ? hx('#2a3424') : hx('#341c1a'), clothD = mul(cloth, 0.6), clothL = mix(cloth, p.plasterD, 0.4);
      ell(cx, by, W * 0.4, 3 * R, rgba(mudD, 0.5)); for (let i = 0; i < 5; i++){ const pts = blob(r, cx + (r() - 0.5) * W * 0.5, by - r() * 3 * R, (2.5 + r() * 2.5) * R, 7, 0.3); poly(g, pts, rgb(mix(p.stone, p.stoneL, r() * 0.5))); }
      line(cx, by, cx + lean, top, rgb(p.bark), pw * 2); line(cx + pw * 0.5 * L, by, cx + lean + pw * 0.5 * L, top, rgba(p.barkL, 0.5), pw * 0.7); line(cx + lean - W * 0.34, top + 4 * R, cx + lean + W * 0.34, top + 2 * R, rgb(p.bark), 2 * R); ell(cx + lean, top - R, 2.5 * R, 2.5 * R, rgb(p.iron));
      const fx = cx + lean + (L > 0 ? -W * 0.3 : W * 0.3) * 0, x0 = cx + lean - W * 0.32, x1 = cx + lean + W * 0.32, y0 = top + 5 * R, fh = H * 0.5;
      g.fillStyle = rgb(cloth); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0 - 2 * R); g.lineTo(x1 - 2 * R, y0 + fh * 0.6); g.lineTo(x1 - 8 * R, y0 + fh * 0.5); g.lineTo(x1 - 14 * R, y0 + fh * 0.82); g.lineTo(x0 + 12 * R, y0 + fh * 0.7); g.lineTo(x0 + 6 * R, y0 + fh); g.lineTo(x0 + 2 * R, y0 + fh * 0.75); g.closePath(); g.fill();
      g.save(); g.clip(); for (let i = 0; i < 5; i++) line(x0 + (x1 - x0) * (i + 0.5) / 5, y0, x0 + (x1 - x0) * (i + 0.5) / 5 + (r() - 0.5) * 6 * R, y0 + fh, rgba(i % 2 ? clothD : clothL, 0.5), 2.5 * R); rect(x0, y0 + fh * 0.55, x1 - x0, fh * 0.5, rgba(clothD, 0.5)); for (let i = 0; i < 3; i++) ell(x0 + r() * (x1 - x0), y0 + fh * (0.3 + r() * 0.6), 2 * R, 2.5 * R, rgba(mudD, 0.6)); g.restore();
      for (let i = 0; i < 3; i++) line(x0 + (x1 - x0) * (i + 0.5) / 3 - R, y0 - 3 * R, x0 + (x1 - x0) * (i + 0.5) / 3 + R, y0 + 2 * R, rgb(rope), 1.2 * R); void fx;
    } else if (kind === 'chbanner'){
      // the Chapter's banner by the Leader's house: a pole with a gilt finial and a cross-spar, the cloth hung from the spar in the Chapter's field with its division and a round charge, swallow-tailed and a little worn; the pole stands 26 world px left of the anchor (the cloth's centre), as the old banner did
      const dull = col => mix(hx(col), p.plasterD, 0.3), c1 = dull(o.c1 || '#7a3e26'), c2 = dull(o.c2 || '#d4af37'), c3 = dull(o.charge || '#d4af37'), dv = o.div || 'plain';
      const px = cx - 26 * R, top = by - 80 * R, sx0 = cx - 23 * R, sx1 = cx + 23 * R, y0 = top + 8 * R, y1 = y0 + 46 * R;
      ell(px, by, 9 * R, 2.6 * R, rgba(mudD, 0.5)); for (let i = 0; i < 4; i++) poly(g, blob(r, px + (r() - 0.5) * 12 * R, by - r() * 2 * R, (2 + r() * 2) * R, 7, 0.3), rgb(mix(p.stone, p.stoneL, r() * 0.5)));
      line(px, by, px, top, rgb(p.bark), 3.4 * R); line(px + 0.8 * R * L, by, px + 0.8 * R * L, top, rgba(p.barkL, 0.5), 1 * R); ell(px, top - 2 * R, 2.6 * R, 2.6 * R, rgb(brassL)); ell(px - 0.8 * R * L, top - 2.8 * R, 1 * R, 1 * R, rgba(p.thatchL, 0.6));
      line(px, top + 6 * R, sx1 + 4 * R, top + 6 * R, rgb(p.barkD), 2.8 * R);
      g.fillStyle = rgb(c1); g.beginPath(); g.moveTo(sx0, y0); g.lineTo(sx1, y0); g.lineTo(sx1, y1); g.lineTo(cx + 12 * R, y1 - 4 * R); g.lineTo(cx, y1 + 6 * R); g.lineTo(cx - 12 * R, y1 - 4 * R); g.lineTo(sx0, y1); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = rgb(c2);
      if (dv === 'pale') g.fillRect(cx, y0, sx1 - cx, y1 - y0 + 8 * R); else if (dv === 'fess') g.fillRect(sx0, y0, sx1 - sx0, (y1 - y0) * 0.5);
      else if (dv === 'bend'){ g.beginPath(); g.moveTo(sx0, y0); g.lineTo(sx0 + 12 * R, y0); g.lineTo(sx1, y1 - 4 * R); g.lineTo(sx1, y1 + 8 * R); g.closePath(); g.fill(); }
      else if (dv === 'saltire'){ for (const sg of [1, -1]){ g.beginPath(); g.moveTo(sg > 0 ? sx0 : sx1, y0 - 2 * R); g.lineTo(sg > 0 ? sx1 : sx0, y1 + 6 * R); g.lineWidth = 7 * R; g.strokeStyle = rgb(c2); g.stroke(); } }
      else if (dv === 'chevron'){ g.beginPath(); g.moveTo(sx0, y1 - 6 * R); g.lineTo(cx, y0 + 10 * R); g.lineTo(sx1, y1 - 6 * R); g.lineWidth = 7 * R; g.strokeStyle = rgb(c2); g.stroke(); }
      else if (dv === 'quarterly'){ g.fillRect(cx, y0, sx1 - cx, (y1 - y0) * 0.5); g.fillRect(sx0, y0 + (y1 - y0) * 0.5, cx - sx0, (y1 - y0) * 0.5 + 8 * R); }
      else if (dv === 'bordure'){ g.lineWidth = 4 * R; g.strokeStyle = rgb(c2); g.strokeRect(sx0 + 2 * R, y0 + 2 * R, sx1 - sx0 - 4 * R, y1 - y0 - 2 * R); }
      // the charge is the Chapter's chosen glyph (banner().glyph, the 9x9 GLYPHS cell art), not a round blob (Patrick, 2026-11-12: "always rendering a circle no matter the selected icon")
      const gy = y0 + (y1 - y0) * 0.5, gw = 24 * R;
      if (o.glyph && window.GLYPHVEC && typeof GLYPHS !== 'undefined' && GLYPHS[o.glyph]){   // PL-1 item 4 (AD 23 Nov): the bare vector charge in the tincture (no badge plate)
        GLYPHVEC.charge(g, o.glyph, rgb(c3), cx - gw / 2, gy - gw / 2, gw); ell(cx - 1.5 * R * L, gy - 1.5 * R, 4 * R, 4 * R, rgba(p.thatchL, 0.12)); }
      else { ell(cx, gy, 7.5 * R, 7.5 * R, rgb(c3)); ell(cx - 1.5 * R * L, gy - 1.5 * R, 4 * R, 4 * R, rgba(p.thatchL, 0.18)); }
      for (let i = 0; i < 6; i++) line(sx0 + (sx1 - sx0) * (i + 0.5) / 6, y0, sx0 + (sx1 - sx0) * (i + 0.5) / 6 + (r() - 0.5) * 4 * R, y1 + 6 * R, rgba(i % 2 ? hx('#0c0a08') : p.plasterD, 0.22), 3 * R);
      const vg = g.createLinearGradient(0, y0, 0, y1 + 6 * R); vg.addColorStop(0, 'rgba(0,0,0,.3)'); vg.addColorStop(0.3, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = vg; g.fillRect(sx0, y0, sx1 - sx0, y1 - y0 + 8 * R);
      for (let i = 0; i < 5; i++) ell(sx0 + r() * (sx1 - sx0), y1 - r() * 8 * R, (1.5 + r() * 2) * R, (1 + r()) * R, rgba(p.plasterD, 0.5));
      g.restore();
      for (let i = 0; i < 4; i++) line(sx0 + (sx1 - sx0) * (i + 0.5) / 4 - R, top + 4 * R, sx0 + (sx1 - sx0) * (i + 0.5) / 4 + R, y0 + 1 * R, rgb(rope), 1.2 * R);
    } else if (kind === 'relic'){
      // a relic: a squat stone plinth with a dull bronze idol set on it, moss creeping up
      const pw = W * 0.36, ph = H * 0.42, top = by - ph;
      ell(cx, by, pw * 1.3, 3 * R, rgba(mudD, 0.5)); block(cx - pw, top, pw * 2, ph, 4 * R); block(cx - pw - 2 * R, top - 3 * R, pw * 2 + 4 * R, 4 * R, 3 * R);
      const ix = cx, iy = top - 3 * R, ih = H * 0.5; g.fillStyle = rgb(mix(brass, p.stoneD, 0.55)); g.beginPath(); g.moveTo(ix - 5 * R, iy); g.lineTo(ix + 5 * R, iy); g.lineTo(ix + 4 * R, iy - ih * 0.4); g.lineTo(ix + 6 * R, iy - ih * 0.7); g.lineTo(ix, iy - ih); g.lineTo(ix - 6 * R, iy - ih * 0.7); g.lineTo(ix - 4 * R, iy - ih * 0.4); g.closePath(); g.fill();
      g.fillStyle = rgba(brassL, 0.3); g.beginPath(); g.moveTo(ix - 4 * R * L, iy - ih * 0.4); g.lineTo(ix - 6 * R * L, iy - ih * 0.7); g.lineTo(ix, iy - ih); g.lineTo(ix, iy - ih * 0.3); g.closePath(); g.fill(); rect(ix - 5 * R, iy - 2 * R, 10 * R, 2 * R, rgba(mudD, 0.6)); ell(ix - 2 * R * L, iy - ih * 0.75, 1.2 * R, 1.6 * R, rgb(mudD)); ell(ix + 2 * R * L, iy - ih * 0.75, 1.2 * R, 1.6 * R, rgb(mudD));
      for (let i = 0; i < 3; i++) line(ix + (r() - 0.5) * 8 * R, iy - r() * ih * 0.5, ix + (r() - 0.5) * 8 * R, iy - r() * ih, rgba(mix(brass, p.moss, 0.6), 0.6), 1.2 * R);
    } else if (kind === 'ruinstone'){
      // a fallen dressed block, half sunk, cracked across, moss on the north side
      const pts = [[cx - W * 0.46, by - H * 0.3], [cx - W * 0.3, by - H * 0.9], [cx + W * 0.4, by - H * 0.95], [cx + W * 0.46, by - H * 0.25], [cx + W * 0.2, by], [cx - W * 0.35, by]];
      ell(cx, by, W * 0.5, 3 * R, rgba(mudD, 0.45)); poly(g, pts, rgb(p.stone)); g.save(); g.clip(); rect(cx - W * 0.5, by - H * 0.3, W, H * 0.3, rgba(p.stoneD, 0.7)); rect(cx + (L > 0 ? W * 0.2 : -W * 0.5), by - H, W * 0.3, H, rgba(p.stoneL, 0.4)); line(cx - W * 0.1, by - H * 0.95, cx + W * 0.05, by - H * 0.2, rgba(p.stoneD, 0.9), 1.4 * R); line(cx - W * 0.3, by - H * 0.55, cx + W * 0.4, by - H * 0.6, rgba(p.stoneD, 0.5), R); ell(cx - W * 0.25, by - H * 0.2, W * 0.18, H * 0.12, rgba(p.moss, 0.6)); g.restore(); g.strokeStyle = rgba(p.stoneD, 0.8); g.lineWidth = R; poly(g, pts, null, rgba(p.stoneD, 0.8), R);
    } else if (kind === 'column'){
      // a broken column: stacked stone drums on a square base, the top sheared off, a crack and ivy
      const cw = W * 0.3, top = by - H * (0.72 + r() * 0.2), n = 5;
      ell(cx, by, cw * 1.6, 3 * R, rgba(mudD, 0.5)); block(cx - cw * 1.4, by - 6 * R, cw * 2.8, 6 * R, 4 * R); block(cx - cw * 1.2, by - 10 * R, cw * 2.4, 4 * R, 3 * R);
      for (let i = 0; i < n; i++){ const y1 = by - 10 * R - (by - 10 * R - top) * i / n, y0 = by - 10 * R - (by - 10 * R - top) * (i + 1) / n, dx = (r() - 0.5) * 1.5 * R; rect(cx - cw + dx, y0, cw * 2, y1 - y0 - 0.6 * R, rgb(p.stone)); rect(cx + (L > 0 ? cw * 0.45 : -cw) + dx, y0, cw * 0.55, y1 - y0 - 0.6 * R, rgba(p.stoneL, 0.45)); rect(cx + (L > 0 ? -cw : cw * 0.5) + dx, y0, cw * 0.5, y1 - y0 - 0.6 * R, rgba(p.stoneD, 0.7)); }
      g.fillStyle = rgb(p.stoneD); g.beginPath(); g.moveTo(cx - cw, top); for (let i = 0; i <= 6; i++) g.lineTo(cx - cw + cw * 2 * i / 6, top - r() * 6 * R); g.lineTo(cx + cw, top); g.closePath(); g.fill();
      line(cx + cw * 0.2, top, cx - cw * 0.4, by - H * 0.4, rgba(p.stoneD, 0.9), 1.2 * R); for (let i = 0; i < 7; i++) ell(cx - cw * L * 0.8 + (r() - 0.5) * cw, by - 12 * R - r() * H * 0.45, 2.5 * R, 1.5 * R, rgba(mix(p.leaf, p.leafL, r() * 0.5), 0.9), r() * 3);
    } else if (kind === 'gate'){
      // a gate between two stone piers: a timber-and-iron double door; broken: one leaf hanging off its hinge, the other gone, rubble in the way
      const pw = W * 0.12, ph = H * (open ? 0.84 : 0.9), top = by - ph, gx = W * 0.5 - pw;
      ell(cx, by, W * 0.55, 4 * R, rgba(mudD, 0.45));
      for (const d of [-1, 1]){ const x0 = cx + d * gx - pw; block(x0, top, pw * 2, ph, 4 * R); for (let i = 1; i < 5; i++) line(x0, top + ph * i / 5, x0 + pw * 2, top + ph * i / 5 + 0.5 * R, rgba(p.stoneD, 0.6), 0.8 * R); block(x0 - 2 * R, top - 4 * R, pw * 2 + 4 * R, 5 * R, 3 * R); }
      const dx0 = cx - gx + pw, dx1 = cx + gx - pw, dh = ph * 0.8, dy = by - dh;
      if (!open){ line(dx0, top + 3 * R, dx1, top + 3 * R, rgb(p.bark), 5 * R); planks(dx0, dy, (dx1 - dx0) / 2 - R, dh, 4, true); planks(cx + R, dy, (dx1 - dx0) / 2 - R, dh, 4, true); for (const yy of [dy + dh * 0.15, dy + dh * 0.5, dy + dh * 0.85]){ band(dx0, yy, (dx1 - dx0) / 2 - 2 * R, 3.5 * R); band(cx + R, yy, (dx1 - dx0) / 2 - 2 * R, 3.5 * R); } rect(cx - R, dy, 2 * R, dh, rgba(mudD, 0.9)); ell(cx - 5 * R, dy + dh * 0.5, 2 * R, 2 * R, rgb(p.iron)); ell(cx + 5 * R, dy + dh * 0.5, 2 * R, 2 * R, rgb(p.iron)); }
      else { rect(dx0, dy, dx1 - dx0, dh, rgba(mudD, 0.35)); g.save(); g.translate(dx0, dy); g.rotate(0.22); planks(0, 0, (dx1 - dx0) / 2 - 4 * R, dh * 0.95, 4, true); for (const yy of [dh * 0.15, dh * 0.5]) band(0, yy, (dx1 - dx0) / 2 - 5 * R, 3.5 * R); g.restore(); for (let i = 0; i < 8; i++){ const pts = blob(r, cx + (r() - 0.5) * (dx1 - dx0) * 0.9, by - r() * 5 * R, (2.5 + r() * 4) * R, 7, 0.3); poly(g, pts, rgb(mix(p.stone, i % 2 ? p.stoneL : p.stoneD, r() * 0.6))); } line(dx0 + 3 * R, dy, dx0 + 14 * R, dy - 2 * R, rgb(p.barkD), 2 * R); line(dx1 - 2 * R, top + 4 * R, dx1 - 9 * R, top + 12 * R, rgb(p.iron), 1.6 * R); }
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -L, 0.3);
    return finish(c, cx, by, tall, 'mprop', tall ? 0.45 : 0.2);
  }
  // batch 7: the field props painted afresh: the six traps, the crystal, the held relic, the scout tokens (tracks, pit, hide) and the build set (footing, scaffold, build pile), in world pixels
  const FPROP = {caltrops: [40, 14], beartrap: [34, 16], tripwire: [56, 20], deadfall: [54, 44], firepot: [30, 26], stakes: [60, 36], crystal: [40, 64], relic_held: [22, 28], tracks: [56, 22], pit: [56, 30], hide: [52, 40], footing: [130, 56], scaffold: [140, 110], buildpile: [76, 44]};
  function fieldProp(kind, v, se, o){
    const size = FPROP[kind]; if (!size) return null;
    const p = P(se), w = se === 'winter', r = rng(hsh(v * 47 + 9, kind.length * 211 + kind.charCodeAt(1) * 13));
    const W = size[0] * R, H = size[1] * R, c = mk(W + 24 * R, H + 16 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 8 * R, L = lit();
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const rect = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    const lump = (x, y, rad, n, jag, col) => { const pts = []; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, k = 1 - jag * r(); pts.push([x + Math.cos(a) * rad * k, y + Math.sin(a) * rad * 0.7 * k]); } poly(g, pts, col); };
    const mudD = hx('#16120e'), ironL = hx('#3c3e44'), rust = hx('#4a2e1c'), rope = hx('#4e4430'), cut = hx(w ? '#6a6456' : '#7a6a4c'), bone = hx('#8a8470');
    const flat = kind === 'caltrops' || kind === 'beartrap' || kind === 'tripwire' || kind === 'tracks' || kind === 'pit' || kind === 'footing';
    const tall = kind === 'scaffold' || kind === 'crystal';
    const spike = (x0, y0, x1, y1, lw) => { line(x0, y0, x1, y1, rgb(p.iron), lw); line(x0, y0, x1, y1, rgba(ironL, 0.5), lw * 0.35); };
    const stake = (x, top, bot, pw, lean) => { const tx = x + lean * (bot - top) * 0.25; poly(g, [[x - pw, bot], [x + pw, bot], [tx + pw * 0.4, top + 4 * R], [tx, top], [tx - pw * 0.4, top + 4 * R]], rgb(p.bark)); poly(g, [[x - pw, bot], [x - pw * 0.3, bot], [tx - pw * 0.1, top + 4 * R], [tx - pw * 0.4, top + 4 * R]], rgba(L > 0 ? p.barkD : p.barkL, 0.5)); poly(g, [[tx - pw * 0.4, top + 4 * R], [tx + pw * 0.4, top + 4 * R], [tx, top]], rgb(cut)); };
    const mud = (rx, ry, a) => ell(cx, by, rx, ry, rgba(mudD, a));
    if (kind === 'caltrops'){
      // a scatter of four-pointed iron caltrops on the mud, one point always up
      mud(W * 0.5, 4 * R, 0.3);
      for (let i = 0; i < 6; i++){ const x = cx + (r() - 0.5) * W * 0.85, y = by - 2 * R - r() * H * 0.6, s = (2.4 + r() * 1.2) * R; spike(x - s, y + s * 0.4, x + s, y - s * 0.2, 1.1 * R); spike(x + s * 0.3, y + s * 0.5, x - s * 0.4, y - s * 0.3, 1.1 * R); spike(x, y + s * 0.2, x + s * 0.15, y - s * 1.1, 1.2 * R); ell(x, y + s * 0.2, 1.1 * R, 1.1 * R, rgba(rust, 0.9)); }
    } else if (kind === 'beartrap'){
      // open iron jaws, two toothed half rings, a chain to a stake
      mud(W * 0.5, 4 * R, 0.3); const jx = cx, jy = by - 5 * R, rx = W * 0.3, ry = H * 0.28;
      for (const d of [-1, 1]){ g.strokeStyle = rgb(p.iron); g.lineWidth = 2 * R; g.beginPath(); g.ellipse(jx, jy, rx, ry, 0, d > 0 ? 0 : Math.PI, d > 0 ? Math.PI : Math.PI * 2); g.stroke(); for (let i = 0; i < 7; i++){ const a = (d > 0 ? 0 : Math.PI) + Math.PI * (i + 0.5) / 7, x = jx + Math.cos(a) * rx, y = jy + Math.sin(a) * ry; spike(x, y, x - Math.cos(a) * 3 * R, y - Math.sin(a) * 3.5 * R, 1 * R); } }
      ell(jx, jy, 4 * R, 2.5 * R, rgb(p.iron)); ell(jx, jy - 0.5 * R, 2.5 * R, 1.2 * R, rgba(ironL, 0.6));
      for (let i = 0; i < 5; i++) ell(jx + (rx + (i + 1) * 2.7 * R) * L, jy + 2 * R + Math.sin(i) * R, 1.5 * R, 1 * R, rgb(p.iron)); const sx = jx + (rx + 17 * R) * L; line(sx, jy + 3 * R, sx + 2 * R, jy - 6 * R, rgb(p.barkD), 2.2 * R);
      ell(jx + rx * 0.3, jy + ry * 0.6, 2 * R, 1.2 * R, rgba(rust, 0.7));
    } else if (kind === 'tripwire'){
      // two pegs and a taut dark wire, tins hung on it to rattle
      mud(W * 0.5, 3 * R, 0.25); const y0 = by - 6 * R; for (const d of [-1, 1]){ const x = cx + d * W * 0.42; line(x, by, x + d * R, y0 - 4 * R, rgb(p.barkD), 2.2 * R); line(x, by, x, y0 - 2 * R, rgba(p.barkL, 0.35), 0.8 * R); }
      line(cx - W * 0.42, y0 - 2 * R, cx + W * 0.42, y0 - 2 * R, rgba(hx('#1c1a18'), 0.95), 0.7 * R);
      for (let i = 0; i < 3; i++){ const x = cx - W * 0.25 + i * W * 0.25 + (r() - 0.5) * 6 * R; line(x, y0 - 2 * R, x, y0 + 2 * R, rgba(p.iron, 0.8), 0.6 * R); rect(x - 1.8 * R, y0 + 2 * R, 3.6 * R, 4.5 * R, rgb(p.iron)); rect(x - 1.8 * R, y0 + 2 * R, 1.2 * R, 4.5 * R, rgba(ironL, 0.6)); }
    } else if (kind === 'deadfall'){
      // a heavy stone propped on a stick over a bait bone, a cord to the trigger
      mud(W * 0.45, 5 * R, 0.4); const rx = W * 0.36, top = by - H * 0.85;
      lump(cx + 2 * R, top + H * 0.32, rx, 9, 0.18, rgb(p.stone)); lump(cx + 2 * R - rx * 0.3 * L, top + H * 0.26, rx * 0.55, 7, 0.2, rgba(p.stoneL, 0.4)); lump(cx + 2 * R + rx * 0.35 * L, top + H * 0.45, rx * 0.5, 7, 0.2, rgba(p.stoneD, 0.6));
      for (let i = 0; i < 3; i++) line(cx + (r() - 0.5) * rx * 1.4, top + r() * H * 0.5, cx + (r() - 0.5) * rx * 1.4, top + r() * H * 0.6, rgba(p.stoneD, 0.6), 0.8 * R);
      const px = cx - rx * 0.7 * L; line(px, by - R, px + 3 * R * L, top + H * 0.6, rgb(p.bark), 2.4 * R); line(px, by - R, px + 1.5 * R * L, top + H * 0.6, rgba(p.barkL, 0.35), 0.8 * R); line(px + 3 * R * L, top + H * 0.6, cx + rx * 0.5 * L, by - 2 * R, rgba(rope, 0.9), 0.8 * R);
      ell(cx + rx * 0.4 * L, by - 2 * R, 3 * R, 1.6 * R, rgba(bone, 0.8));
    } else if (kind === 'firepot'){
      // a squat clay pot stuffed with oiled rag, soot up its side, the lid beside it; the flame is drawn live over it
      mud(W * 0.5, 4 * R, 0.35); const pw = W * 0.34, ph = H * 0.72, top = by - ph; const clay = hx(w ? '#4a3a30' : '#5a4232');
      g.fillStyle = rgb(clay); g.beginPath(); g.moveTo(cx - pw * 0.6, top); g.bezierCurveTo(cx - pw * 1.3, top + ph * 0.35, cx - pw * 1.1, by, cx - pw * 0.5, by); g.lineTo(cx + pw * 0.5, by); g.bezierCurveTo(cx + pw * 1.1, by, cx + pw * 1.3, top + ph * 0.35, cx + pw * 0.6, top); g.closePath(); g.fill();
      g.fillStyle = rgba(hx('#1a1612'), 0.55); g.beginPath(); g.moveTo(cx + pw * 0.6 * L, top); g.bezierCurveTo(cx + pw * 1.3 * L, top + ph * 0.35, cx + pw * 1.1 * L, by, cx + pw * 0.5 * L, by); g.lineTo(cx + pw * 0.2 * L, by); g.bezierCurveTo(cx + pw * 0.6 * L, by, cx + pw * 0.7 * L, top + ph * 0.3, cx + pw * 0.3 * L, top); g.closePath(); g.fill();
      ell(cx, top, pw * 0.6, 2.2 * R, rgb(mudD)); ell(cx, top - R, pw * 0.4, 1.6 * R, rgba(hx('#3a2a1a'), 0.9)); for (let i = 0; i < 4; i++) ell(cx + (r() - 0.5) * pw * 0.7, top - R - r() * 2 * R, 1.5 * R, 0.8 * R, rgba(hx('#6a5438'), 0.8));
      ell(cx - pw * 1.4 * L, by - R, pw * 0.55, 2.2 * R, rgb(mix(clay, p.stoneD, 0.4)));
    } else if (kind === 'stakes'){
      // a row of sharpened stakes driven in at an angle toward the enemy, bound by a rail
      mud(W * 0.5, 4 * R, 0.4); const n = 5;
      for (let i = 0; i < n; i++){ const x = cx - W * 0.4 + i * W * 0.8 / (n - 1) + (r() - 0.5) * 4 * R, h = H * (0.75 + r() * 0.25); stake(x, by - h, by - r() * 2 * R, 2.4 * R, 0.9 * L); }
      line(cx - W * 0.42, by - H * 0.42, cx + W * 0.42, by - H * 0.38, rgb(p.barkD), 1.6 * R); for (let i = 0; i < n; i++){ const x = cx - W * 0.4 + i * W * 0.8 / (n - 1) + H * 0.4 * 0.225 * L; line(x - 2 * R, by - H * 0.4 - R, x + 2 * R, by - H * 0.4 + R, rgba(rope, 0.9), 1.2 * R); }
    } else if (kind === 'crystal'){
      // a cluster of dark crystal shards on a lump of rock, cold grey-blue with a dim inner light, nothing neon
      mud(W * 0.55, 5 * R, 0.4); lump(cx, by - 5 * R, W * 0.42, 9, 0.2, rgb(p.stoneD)); lump(cx - W * 0.1 * L, by - 7 * R, W * 0.22, 7, 0.2, rgba(p.stone, 0.6));
      const cr = hx(w ? '#262e38' : '#242a34'), crL = hx('#3e4a58'), crD = hx('#10141a');
      const shard = (x, b, h, ww, lean) => { const tx = x + lean * h * 0.3; poly(g, [[x - ww, b], [x + ww, b], [tx + ww * 0.35, b - h * 0.75], [tx, b - h], [tx - ww * 0.4, b - h * 0.7]], rgb(cr)); poly(g, [[x - ww * L, b], [tx - ww * 0.4 * L, b - h * 0.7], [tx, b - h], [tx - ww * 0.05 * L, b - h * 0.55]], rgba(crL, 0.45)); poly(g, [[x + ww * L, b], [tx + ww * 0.35 * L, b - h * 0.75], [tx, b - h * 0.5]], rgba(crD, 0.6)); line(tx, b - h, tx - ww * 0.2 * L, b - h * 0.35, rgba(hx('#8aa0b8'), 0.18), 0.7 * R); };
      shard(cx - W * 0.22, by - 6 * R, H * 0.45, 4 * R, -0.5); shard(cx + W * 0.2, by - 7 * R, H * 0.55, 4.5 * R, 0.45); shard(cx + W * 0.02, by - 8 * R, H * 0.88, 6 * R, -0.08); shard(cx - W * 0.1, by - 5 * R, H * 0.3, 3 * R, -0.8); shard(cx + W * 0.3, by - 5 * R, H * 0.28, 3 * R, 0.9);
      const gl = g.createRadialGradient(cx, by - H * 0.4, 2 * R, cx, by - H * 0.4, W * 0.5); gl.addColorStop(0, 'rgba(110,140,170,0.12)'); gl.addColorStop(1, 'rgba(110,140,170,0)'); g.fillStyle = gl; g.fillRect(0, 0, c.width, c.height);
    } else if (kind === 'relic_held'){
      // the relic bundled in sacking at the bearer's feet, cord round it, the idol's head showing
      mud(W * 0.6, 3 * R, 0.35); const bw = W * 0.42, bh = H * 0.6, top = by - bh; const sack = hx(w ? '#4a4438' : '#564c3a');
      g.fillStyle = rgb(sack); g.beginPath(); g.moveTo(cx - bw, by); g.quadraticCurveTo(cx - bw * 1.1, top + bh * 0.3, cx - bw * 0.4, top); g.lineTo(cx + bw * 0.4, top); g.quadraticCurveTo(cx + bw * 1.1, top + bh * 0.3, cx + bw, by); g.closePath(); g.fill();
      g.fillStyle = rgba(hx('#1a1612'), 0.4); g.beginPath(); g.moveTo(cx + bw * 0.3 * L, by); g.quadraticCurveTo(cx + bw * 0.9 * L, top + bh * 0.4, cx + bw * 0.4 * L, top); g.quadraticCurveTo(cx + bw * 1.1 * L, top + bh * 0.3, cx + bw * L, by); g.closePath(); g.fill();
      line(cx - bw * 0.9, top + bh * 0.45, cx + bw * 0.9, top + bh * 0.5, rgba(rope, 0.95), 1.3 * R); line(cx - bw * 0.95, top + bh * 0.65, cx + bw * 0.95, top + bh * 0.6, rgba(rope, 0.95), 1.3 * R);
      const ih = H * 0.42; poly(g, [[cx - 3 * R, top + R], [cx + 3 * R, top + R], [cx + 2.5 * R, top - ih * 0.5], [cx, top - ih], [cx - 2.5 * R, top - ih * 0.5]], rgb(mix(hx('#3e3218'), p.stoneD, 0.55))); poly(g, [[cx - 2.5 * R * L, top - ih * 0.5], [cx, top - ih], [cx, top - ih * 0.3]], rgba(hx('#544424'), 0.3)); ell(cx - R, top - ih * 0.55, 0.6 * R, 0.8 * R, rgb(mudD)); ell(cx + R, top - ih * 0.55, 0.6 * R, 0.8 * R, rgb(mudD));
    } else if (kind === 'tracks'){
      // a line of boot prints pressed into the mud, heading off one way
      mud(W * 0.5, 4 * R, 0.2); const n = 5;
      for (let i = 0; i < n; i++){ const t = i / (n - 1), x = cx - W * 0.4 + t * W * 0.8, y = by - 3 * R - (i % 2 ? 5 * R : 0) + (r() - 0.5) * 2 * R; g.save(); g.translate(x, y); g.rotate(-0.25 * L + (r() - 0.5) * 0.2); ell(0, 0, 4.2 * R, 2.4 * R, rgba(mudD, 0.85)); ell(4.5 * R, -0.3 * R, 2.2 * R, 2 * R, rgba(mudD, 0.85)); ell(-0.6 * R, -1.6 * R, 3.6 * R, 1 * R, rgba(p.stoneL, 0.18)); g.restore(); }
    } else if (kind === 'pit'){
      // a spike pit: a dark hole with its cover of sticks broken through, pale stake points below
      mud(W * 0.55, 5 * R, 0.3); ell(cx, by - 4 * R, W * 0.42, H * 0.36, rgb(mudD)); ell(cx, by - 4 * R, W * 0.42, H * 0.36, rgba(hx('#0a0806'), 0.6));
      for (let i = 0; i < 5; i++){ const x = cx + (r() - 0.5) * W * 0.6, y = by - 2 * R - r() * H * 0.3; poly(g, [[x - 1.3 * R, y + 3 * R], [x + 1.3 * R, y + 3 * R], [x, y - 3 * R]], rgba(bone, 0.6)); }
      for (let i = 0; i < 6; i++){ const x0 = cx - W * 0.5 + r() * W, y0 = by - 4 * R - H * 0.4 + r() * H * 0.5, a = r() * Math.PI; line(x0, y0, x0 + Math.cos(a) * 10 * R, y0 + Math.sin(a) * 4 * R, rgb(p.barkD), 1.4 * R); }
      ell(cx - W * 0.3, by - H * 0.15, W * 0.2, 3 * R, rgba(hx('#5a5240'), 0.35));
    } else if (kind === 'hide'){
      // a hunter's hide: a low screen of bound branches and dry brush with a dark slot to watch through
      mud(W * 0.5, 4 * R, 0.4); const top = by - H * 0.85;
      for (let i = 0; i < 4; i++){ const x = cx - W * 0.4 + i * W * 0.8 / 3; line(x, by, x + (r() - 0.5) * 3 * R, top, rgb(p.barkD), 2 * R); }
      for (let i = 0; i < 28; i++){ const x0 = cx - W * 0.46 + r() * W * 0.92, y0 = top + 2 * R + r() * (H * 0.75), len = 6 * R + r() * 10 * R, a = (r() - 0.5) * 0.9; line(x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len * 0.3, rgb(mix(p.barkD, p.bark, r() * 0.6)), (0.8 + r() * 0.8) * R); }
      for (let i = 0; i < 12; i++){ const x0 = cx - W * 0.4 + r() * W * 0.8, y0 = top + r() * H * 0.5, len = 5 * R + r() * 7 * R; line(x0, y0, x0 + (r() - 0.5) * len, y0 - len * 0.6, rgba(hx(w ? '#6a6450' : '#7a6a3c'), 0.8), 0.9 * R); }
      rect(cx - W * 0.16, top + H * 0.32, W * 0.32, 4 * R, rgba(hx('#0c0a08'), 0.85));
      line(cx - W * 0.42, top + H * 0.5, cx + W * 0.42, top + H * 0.52, rgba(rope, 0.9), 1.1 * R);
    } else if (kind === 'footing'){
      // a footing: the first course of dressed stone laid in a trench, pegs and string marking the rest, spoil heaped beside
      mud(W * 0.5, 6 * R, 0.45); const fw = W * 0.84, fh = H * 0.28, x0 = cx - fw / 2, y0 = by - fh;
      rect(x0 - 3 * R, y0 - 3 * R, fw + 6 * R, fh + 3 * R, rgba(mudD, 0.6));
      const n = 7; for (let i = 0; i < n; i++){ const bw = fw / n; rect(x0 + i * bw + 0.5 * R, y0, bw - R, fh - 2 * R, rgb(mix(p.stone, p.stoneL, r() * 0.3))); rect(x0 + i * bw + 0.5 * R, y0 + fh - 4 * R, bw - R, 2 * R, rgba(p.stoneD, 0.8)); rect(x0 + i * bw + (L > 0 ? bw - 2.5 * R : 0.5 * R), y0, 2 * R, fh - 2 * R, rgba(p.stoneL, 0.4)); if (r() < 0.5) line(x0 + i * bw + r() * bw, y0 + r() * fh, x0 + i * bw + r() * bw, y0 + r() * fh, rgba(p.stoneD, 0.6), 0.7 * R); }
      for (const d of [-1, 1]){ const px = cx + d * fw * 0.52; line(px, y0 - 2 * R, px + d * R, y0 - H * 0.45, rgb(p.barkD), 1.8 * R); } line(cx - fw * 0.52, y0 - H * 0.4, cx + fw * 0.52, y0 - H * 0.4, rgba(hx('#8a8470'), 0.7), 0.6 * R);
      for (let i = 0; i < 5; i++) ell(cx + fw * 0.3 * L + (r() - 0.5) * fw * 0.3, y0 - H * 0.2 - r() * H * 0.15, 6 * R, 2.5 * R, rgba(mix(mudD, p.bark, 0.35), 0.9)); for (let i = 0; i < 3; i++) ell(cx - fw * 0.3 * L + (r() - 0.5) * fw * 0.2, y0 - H * 0.12, 4 * R, 2 * R, rgb(mix(p.stone, p.stoneD, 0.5)));
    } else if (kind === 'scaffold'){
      // a timber scaffold against a build: lashed poles, two lifts of planks, a leaning ladder, a rope and bucket
      mud(W * 0.5, 6 * R, 0.45); const top = by - H * 0.95, px = [cx - W * 0.4, cx - W * 0.05, cx + W * 0.32], pw = 2.6 * R;
      for (const x of px){ const lean = (r() - 0.5) * 0.08; line(x, by, x + lean * H, top + r() * 6 * R, rgb(p.bark), pw); line(x - pw * 0.3 * L, by, x + lean * H - pw * 0.3 * L, top + 6 * R, rgba(p.barkL, 0.35), pw * 0.3); }
      for (const lift of [0.45, 0.85]){ const y = by - H * lift; line(px[0] - 6 * R, y + (r() - 0.5) * 2 * R, px[2] + 8 * R, y, rgb(p.barkD), 2.2 * R); for (let i = 0; i < 6; i++){ const x = px[0] - 4 * R + i * (px[2] - px[0] + 10 * R) / 6; rect(x, y - 3 * R, (px[2] - px[0] + 10 * R) / 6 - 0.6 * R, 2.4 * R, rgb(mix(p.bark, p.barkL, r() * 0.4))); } for (const x of px){ line(x - 3 * R, y + 2 * R, x + 3 * R, y - 2 * R, rgba(rope, 0.95), 1.4 * R); line(x - 3 * R, y - 2 * R, x + 3 * R, y + 2 * R, rgba(rope, 0.95), 1.4 * R); } for (const x of [px[0], px[2]]) line(x + 2 * R * L, y - 3 * R, x + 2 * R * L, y - 12 * R, rgb(p.barkD), 1.4 * R); }
      line(px[1], by - H * 0.45, px[2], by - H * 0.85, rgba(p.barkD, 0.9), 1.6 * R);
      const lx = cx + W * 0.5 * L; line(lx - 4 * R * L, by, lx + 2 * R * L, by - H * 0.5, rgb(p.barkD), 1.8 * R); line(lx + 2 * R * L, by, lx + 8 * R * L, by - H * 0.5, rgb(p.barkD), 1.8 * R); for (let i = 1; i < 7; i++){ const t = i / 7; line(lx - 4 * R * L + 6 * R * L * t, by - H * 0.5 * t, lx + 2 * R * L + 6 * R * L * t, by - H * 0.5 * t, rgb(p.bark), 1.2 * R); }
      const bx = px[0] - 7 * R * L; line(bx, top + 4 * R, bx, by - H * 0.6, rgba(rope, 0.9), 0.8 * R); rect(bx - 3 * R, by - H * 0.6, 6 * R, 5 * R, rgb(p.iron)); rect(bx - 3 * R, by - H * 0.6, 6 * R, R, rgba(ironL, 0.6));
    } else if (kind === 'buildpile'){
      // the build pile: stacked cut timber and a heap of rough stone, a sack of lime, a barrow handle poking out
      mud(W * 0.5, 5 * R, 0.45); const lx = cx - W * 0.18, ly = by - 2 * R;
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++){ const x = lx - W * 0.22 + i * W * 0.14 + row * W * 0.07, y = ly - row * 5.5 * R, len = W * 0.14, hh = 5 * R; rect(x, y - hh, len, hh, rgb(mix(p.bark, p.barkL, r() * 0.3))); rect(x, y - hh, len, hh * 0.3, rgba(p.barkL, 0.3)); ell(x + len * (L > 0 ? 1 : 0), y - hh / 2, 1.6 * R, hh / 2, rgb(cut)); line(x + 2 * R, y - hh * 0.5, x + len - 2 * R, y - hh * 0.45, rgba(p.barkD, 0.5), 0.7 * R); }
      for (let i = 0; i < 9; i++){ const x = cx + W * 0.22 + (r() - 0.5) * W * 0.3, y = by - 2 * R - r() * H * 0.45; lump(x, y, (4 + r() * 3) * R, 7, 0.3, rgb(mix(p.stone, i % 3 ? p.stoneD : p.stoneL, 0.5))); }
      ell(cx + W * 0.08, by - 3 * R, 6 * R, 4 * R, rgb(hx(w ? '#6a6456' : '#7a7260'))); ell(cx + W * 0.08, by - 5 * R, 3 * R, 1.5 * R, rgba(mudD, 0.5));
      line(cx - W * 0.42, by - 9 * R, cx - W * 0.3, by - 3 * R, rgb(p.barkD), 2 * R);
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -L, 0.3);
    return finish(c, cx, by, tall, 'fprop', tall ? 0.45 : flat ? 0.05 : 0.2);
  }
  /* ---- batch 8, the set pieces: the bar-fight tavern (tv_*) and the fort graveyard enclosure (gy_*); indoor and enclosure sprites, no cast shadow, never flipped ---- */
  const SPROP = {hearth: [130, 110], counter: [560, 64], table: [80, 44], door: [44, 96], kegs: [90, 80], barrels: [64, 60], candle: [12, 26], ale: [14, 18], gy_back: [210, 160], gy_front: [210, 34]};
  function setProp(kind, v, se, o){
    const size = SPROP[kind]; if (!size) return null;
    const p = P(se), w = se === 'winter', r = rng(hsh(v * 31 + 5, kind.length * 173 + kind.charCodeAt(0) * 19)), t = v * 4;
    const W = size[0] * R, H = size[1] * R, c = mk(W + 24 * R, H + 16 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 8 * R, L = lit();
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const rect = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    const lump = (x, y, rad, n, jag, col) => { const pts = []; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, k = 1 - jag * r(); pts.push([x + Math.cos(a) * rad * k, y + Math.sin(a) * rad * 0.7 * k]); } poly(g, pts, col); };
    const planks = (x, y, ww, hh, n, vert, col, seam) => { rect(x, y, ww, hh, col); for (let i = 1; i < n; i++){ const k = i / n; if (vert) line(x + ww * k, y, x + ww * k, y + hh, seam, 0.9 * R); else line(x, y + hh * k, x + ww, y + hh * k + (r() - 0.5) * R, seam, 0.9 * R); } };
    const band = (x, y, ww, col) => { rect(x, y, ww, 1.8 * R, col); rect(x, y, ww, 0.6 * R, rgba(hx('#5a5e66'), 0.35)); };
    const barrel = (x, y, bw, bh) => { const bL = mix(p.timber, p.barkL, 0.4), bD = rgb(p.barkD); g.fillStyle = rgb(p.timber); g.beginPath(); g.moveTo(x - bw * 0.42, y); g.quadraticCurveTo(x - bw * 0.56, y - bh * 0.5, x - bw * 0.42, y - bh); g.lineTo(x + bw * 0.42, y - bh); g.quadraticCurveTo(x + bw * 0.56, y - bh * 0.5, x + bw * 0.42, y); g.closePath(); g.fill();
      for (let i = 1; i < 5; i++){ const k = -0.42 + i * 0.168, bulge = 1 + 0.3 * (1 - Math.abs(k) / 0.42); line(x + bw * k * bulge, y - bh * 0.06, x + bw * k * bulge, y - bh * 0.94, rgba(p.barkD, 0.55), 0.9 * R); }
      rect(x - bw * 0.4, y - bh * 0.9, bw * 0.08, bh * 0.8, rgba(bL, 0.45)); band(x - bw * 0.52, y - bh * 0.78, bw * 1.04, rgb(p.iron)); band(x - bw * 0.52, y - bh * 0.24, bw * 1.04, rgb(p.iron)); ell(x, y - bh, bw * 0.42, bw * 0.12, bD); };
    const stones = (x0, y0, ww, hh, rows, cols, col, colL) => { const rh = hh / rows, mortar = rgba(hx('#0c0a08'), 0.75); rect(x0, y0, ww, hh, rgb(mix(col, hx('#0c0a08'), 0.5))); for (let j = 0; j < rows; j++){ let x = x0 + (j % 2 ? -r() * ww / cols * 0.5 : 0); while (x < x0 + ww){ const bw = ww / cols * (0.7 + r() * 0.7), xa = Math.max(x0, x), xb = Math.min(x0 + ww, x + bw); if (xb - xa > R) poly(g, [[xa + 0.5 * R, y0 + j * rh + 0.6 * R], [xb - 0.6 * R, y0 + j * rh + 0.4 * R + (r() - 0.5) * R], [xb - 0.4 * R, y0 + (j + 1) * rh - 0.6 * R], [xa + 0.6 * R, y0 + (j + 1) * rh - 0.4 * R - (r() - 0.5) * R]], rgb(mix(col, colL, r() * 0.55)), mortar, 0.7 * R); x += bw; } } };
    const mossD = rgba(p.moss, 0.14), ironL = hx('#3c3e44'), wax = hx(w ? '#a8a08a' : '#b4a88c'), ale = hx('#4a3214'), foam = hx('#b8ae92'), flick = 0.8 + Math.sin(v * 1.9) * 0.15;
    if (kind === 'hearth'){
      const hw = W * 0.5, hh = H * 0.92, ox = W * 0.17, oy = H * 0.36;   // the surround, the opening
      stones(cx - hw * 0.4, by - hh - 6 * R, hw * 0.8, hh * 0.3, 3, 4, p.stone, p.stoneL);   // the chimney breast rising behind the mantel
      stones(cx - hw, by - hh * 0.72, hw * 2, hh * 0.72, 7, 8, p.stone, p.stoneL);   // the surround
      rect(cx - hw - 2 * R, by - hh * 0.72 - 5 * R, hw * 2 + 4 * R, 5 * R, rgb(p.timber)); rect(cx - hw - 2 * R, by - hh * 0.72 - 5 * R, hw * 2 + 4 * R, 1.2 * R, rgba(p.barkL, 0.5)); for (let i = 0; i < 6; i++) line(cx - hw + i * hw * 0.34, by - hh * 0.72 - 3.5 * R, cx - hw + i * hw * 0.34 + hw * 0.2, by - hh * 0.72 - 3.5 * R + (r() - 0.5) * R, rgba(p.barkD, 0.6), 0.7 * R);   // the mantel beam
      rect(cx - ox, by - oy, ox * 2, oy, rgb(hx('#0c0a08'))); rect(cx - ox - 3 * R, by - oy - 4 * R, ox * 2 + 6 * R, 4 * R, rgb(p.stoneD)); rect(cx - ox - 3 * R, by - oy - 4 * R, ox * 2 + 6 * R, 1.2 * R, rgba(p.stoneL, 0.35));   // the firebox and its lintel
      for (const [dx, lw] of [[-ox * 0.5, 3.2 * R], [ox * 0.4, 3 * R]]) line(cx + dx, by - 3 * R, cx - dx * 0.4, by - oy * 0.32, rgb(p.barkD), lw);   // logs
      g.save(); g.beginPath(); g.rect(cx - ox, by - oy, ox * 2, oy); g.clip(); const gr = g.createRadialGradient(cx, by - 4 * R, R, cx, by - 4 * R, ox * 0.9); gr.addColorStop(0, rgba(p.ember, 0.55 * flick)); gr.addColorStop(1, rgba(p.ember, 0)); g.fillStyle = gr; g.fillRect(cx - ox, by - oy, ox * 2, oy);
      tongues(g, cx, by - 5 * R, t, 3, oy * 0.62 * flick, ox * 1.1, 31 + v); g.restore();
      ell(cx, by, ox * 1.5, 3.5 * R, rgb(p.stoneD)); ell(cx, by - R, ox * 1.4, 2.4 * R, rgb(mix(p.stone, p.stoneD, 0.4)));   // the hearthstone
      const gl2 = g.createRadialGradient(cx, by, 2 * R, cx, by, ox * 1.9); gl2.addColorStop(0, rgba(p.ember, 0.22 * flick)); gl2.addColorStop(1, rgba(p.ember, 0)); g.fillStyle = gl2; g.fillRect(cx - ox * 2, by - oy * 0.3, ox * 4, oy * 0.5);
      rect(cx - hw, by - hh * 0.72, hw * 2, hh * 0.72, rgba(hx('#0c0a08'), 0.18)); rect(cx - ox * 1.6, by - oy * 1.4, ox * 3.2, oy * 1.1, rgba(hx('#0c0a08'), 0.25));   // soot above the mouth
    } else if (kind === 'counter'){
      const th = H * 0.4, fh = H - th, x0 = cx - W / 2, seam = rgba(p.barkD, 0.7);
      planks(x0 + 2 * R, by - fh, W - 4 * R, fh, 22, true, rgb(mix(p.barkD, p.timber, 0.45)), rgba(hx('#0c0a08'), 0.85)); for (let i = 0; i < 22; i++) rect(x0 + 2 * R + i * (W - 4 * R) / 22, by - fh, 1.5 * R, fh, rgba(p.barkL, 0.12 + r() * 0.1));   // the front panelling, a lit edge on each board   // the front panelling
      rect(x0 + 2 * R, by - 3 * R, W - 4 * R, 3 * R, rgb(p.iron)); rect(x0 + 2 * R, by - 3 * R, W - 4 * R, 0.7 * R, rgba(ironL, 0.5));   // the foot rail
      planks(x0, by - fh - th, W, th, 3, false, rgb(p.timber), seam); rect(x0, by - fh - th, W, 1.4 * R, rgba(p.barkL, 0.5)); rect(x0, by - fh - 1.4 * R, W, 1.4 * R, rgba(p.barkD, 0.8));   // the top slab, lit edge, lip
      for (let i = 0; i < 9; i++){ const x = x0 + W * (0.08 + r() * 0.84), y = by - fh - th * (0.2 + r() * 0.6); ell(x, y, (3 + r() * 5) * R, (1 + r() * 1.5) * R, rgba(hx('#0c0a08'), 0.18 + r() * 0.15)); }   // ring stains and spills
      for (const kx of [0.14, 0.52, 0.84]){ const x = x0 + W * kx, y = by - fh - th; rect(x - 2.2 * R, y - 7 * R, 4.4 * R, 7 * R, rgb(ale)); band(x - 2.2 * R, y - 6 * R, 4.4 * R, rgb(p.iron)); ell(x, y - 7 * R, 2.2 * R, 0.9 * R, rgb(foam)); }   // tankards left on the bar
      rect(x0 + 2 * R, by - fh * 0.55, W - 4 * R, 2 * R, rgba(p.barkD, 0.9)); rect(x0 + 2 * R, by - fh * 0.55 - 0.8 * R, W - 4 * R, 0.8 * R, rgba(p.barkL, 0.3));   // a mid rail
    } else if (kind === 'table'){
      const rx = W * 0.5, ry = H * 0.3, ty = by - H * 0.62;
      for (const dx of [-W * 0.34, W * 0.34]){ line(cx + dx, ty, cx + dx * 0.8, by, rgb(p.barkD), 3.2 * R); } line(cx - W * 0.3, by - H * 0.2, cx + W * 0.3, by - H * 0.2, rgb(p.barkD), 2 * R);   // trestle
      ell(cx, ty + 2 * R, rx, ry, rgb(p.barkD)); ell(cx, ty, rx, ry, rgb(p.timber));
      g.save(); g.beginPath(); g.ellipse(cx, ty, rx, ry, 0, 0, Math.PI * 2); g.clip(); for (let i = 1; i < 5; i++) line(cx - rx, ty - ry + ry * 2 * i / 5, cx + rx, ty - ry + ry * 2 * i / 5 + (r() - 0.5) * R, rgba(p.barkD, 0.7), 0.9 * R); ell(cx - rx * 0.3, ty - ry * 0.3, rx * 0.35, ry * 0.3, rgba(p.barkL, 0.18)); for (let i = 0; i < 4; i++) ell(cx + (r() - 0.5) * rx * 1.4, ty + (r() - 0.5) * ry * 1.4, (2 + r() * 3) * R, (1 + r()) * R, rgba(hx('#0c0a08'), 0.25)); g.restore();
    } else if (kind === 'door'){
      const dw = W * 0.5, dh = H * 0.92;
      rect(cx - dw - 3 * R, by - dh - 3 * R, dw * 2 + 6 * R, dh + 3 * R, rgb(p.stoneD)); stones(cx - dw - 3 * R, by - dh - 3 * R, 3 * R, dh, 5, 1, p.stone, p.stoneL); stones(cx + dw, by - dh - 3 * R, 3 * R, dh, 5, 1, p.stone, p.stoneL); rect(cx - dw - 3 * R, by - dh - 3 * R, dw * 2 + 6 * R, 3 * R, rgb(mix(p.stone, p.stoneD, 0.3)));   // the stone frame
      planks(cx - dw, by - dh, dw * 2, dh, 4, true, rgb(p.barkD), rgba(hx('#0c0a08'), 0.8)); rect(cx - dw, by - dh, 1.6 * R, dh, rgba(p.barkL, 0.25));
      for (const y of [by - dh * 0.8, by - dh * 0.22]){ rect(cx - dw, y, dw * 1.3, 2.2 * R, rgb(p.iron)); rect(cx - dw, y, dw * 1.3, 0.6 * R, rgba(ironL, 0.4)); }   // strap hinges
      ell(cx + dw * 0.55, by - dh * 0.5, 2.2 * R, 2.2 * R, rgb(p.iron)); ell(cx + dw * 0.55, by - dh * 0.5, 1.1 * R, 1.1 * R, rgb(p.barkD));   // the ring
      rect(cx - dw, by - 2 * R, dw * 2, 2 * R, rgba(hx('#0c0a08'), 0.5));
    } else if (kind === 'kegs'){
      const kw = W * 0.4, kh = H * 0.42;
      rect(cx - W * 0.5, by - 4 * R, W, 4 * R, rgb(p.barkD)); line(cx - W * 0.46, by - 4 * R, cx - W * 0.4, by - H * 0.52, rgb(p.barkD), 3 * R); line(cx + W * 0.46, by - 4 * R, cx + W * 0.4, by - H * 0.52, rgb(p.barkD), 3 * R);   // the cradle
      for (const [x, y] of [[cx - kw * 0.6, by - 4 * R], [cx + kw * 0.6, by - 4 * R], [cx, by - kh - 6 * R]]){ ell(x, y - kh * 0.5, kw * 0.5, kh * 0.52, rgb(p.barkD)); ell(x, y - kh * 0.5, kw * 0.46, kh * 0.48, rgb(mix(p.timber, p.barkD, 0.35))); for (let i = 0; i < 2; i++) line(x - kw * 0.44, y - kh * 0.5 + (i - 0.5) * kh * 0.3, x + kw * 0.44, y - kh * 0.5 + (i - 0.5) * kh * 0.3, rgba(p.barkD, 0.7), 0.9 * R); g.strokeStyle = rgb(p.iron); g.lineWidth = 1.6 * R; g.beginPath(); g.ellipse(x, y - kh * 0.5, kw * 0.42, kh * 0.44, 0, 0, Math.PI * 2); g.stroke(); ell(x + kw * 0.1, y - kh * 0.55, 2 * R, 2 * R, rgb(p.barkD)); ell(x - kw * 0.18, y - kh * 0.7, kw * 0.1, kh * 0.08, rgba(p.barkL, 0.25)); }   // kegs end on, a bung in each
    } else if (kind === 'barrels'){
      barrel(cx + W * 0.22, by - H * 0.1, W * 0.5, H * 0.78); barrel(cx - W * 0.22, by, W * 0.54, H * 0.84);
      ell(cx + W * 0.22, by - H * 0.88, W * 0.21, W * 0.06, rgba(hx('#0c0a08'), 0.4)); ell(cx - W * 0.22, by - H * 0.84, W * 0.2, W * 0.06, rgba(p.wet, 0.35));   // one lid dry, one wet
    } else if (kind === 'candle'){
      const ch = H * 0.5;
      ell(cx, by - R, W * 0.5, W * 0.22, rgb(p.iron)); ell(cx, by - 2 * R, W * 0.42, W * 0.16, rgb(ironL));
      rect(cx - W * 0.22, by - ch - 2 * R, W * 0.44, ch, rgb(wax)); rect(cx - W * 0.22, by - ch - 2 * R, W * 0.1, ch, rgba(hx('#ffffff'), 0.12)); for (let i = 0; i < 3; i++) line(cx - W * 0.2 + i * W * 0.15, by - ch - R, cx - W * 0.2 + i * W * 0.15 + R, by - ch * (0.2 + r() * 0.5), rgba(wax, 0.9), 1.4 * R);   // drips
      line(cx, by - ch - 2 * R, cx, by - ch - 4 * R, rgb(hx('#1a1612')), 0.8 * R);
      g.save(); tongues(g, cx, by - ch - 3 * R, t, 1, H * 0.4 * flick, W * 0.35, 77 + v); g.restore();
      const hg = g.createRadialGradient(cx, by - ch - 6 * R, R, cx, by - ch - 6 * R, H * 0.5); hg.addColorStop(0, rgba(hx('#e0a050'), 0.2 * flick)); hg.addColorStop(1, rgba(hx('#e0a050'), 0)); g.fillStyle = hg; g.fillRect(0, 0, c.width, c.height);
    } else if (kind === 'ale'){
      const mw = W * 0.36, mh = H * 0.8;
      rect(cx - mw, by - mh, mw * 2, mh, rgb(ale)); rect(cx - mw, by - mh, mw * 0.35, mh, rgba(p.barkL, 0.25)); band(cx - mw, by - mh * 0.85, mw * 2, rgb(p.iron)); band(cx - mw, by - mh * 0.2, mw * 2, rgb(p.iron));
      g.strokeStyle = rgb(ale); g.lineWidth = 1.8 * R; g.beginPath(); g.arc(cx + mw, by - mh * 0.5, mw * 0.7, -Math.PI / 2, Math.PI / 2); g.stroke();   // the handle
      ell(cx, by - mh, mw, mw * 0.45, rgb(foam)); ell(cx - mw * 0.3, by - mh - R, mw * 0.5, mw * 0.3, rgba(hx('#ffffff'), 0.18));
    } else if (kind === 'gy_back' || kind === 'gy_front'){
      const front = kind === 'gy_front', wh = 22 * R, x0 = cx - W / 2, depth = 124 * R;   // the plot is 190 by 120 world px; the sprite stands 4 px below its bottom edge
      const run = (x, y, ww, hh) => { rect(x, y, ww, hh, rgb(p.stoneD)); stones(x, y, ww, hh, Math.max(1, Math.round(hh / (7 * R))), Math.max(1, Math.round(ww / (9 * R))), p.stone, p.stoneL); rect(x, y + hh - 2 * R, ww, 2 * R, rgba(hx('#0c0a08'), 0.45)); rect(x, y, ww, hh, mossD); rect(x, y, ww, 1.2 * R, rgba(p.stoneL, 0.25)); };
      if (!front){
        run(x0, by - depth - wh, W, wh);   // the back wall
        for (const sx of [x0, x0 + W - 7 * R]){ rect(sx, by - depth - wh, 7 * R, depth + wh - 10 * R, rgb(p.stoneD)); stones(sx, by - depth - wh, 7 * R, depth + wh - 10 * R, 14, 1, p.stone, p.stoneL); rect(sx, by - depth - wh, 7 * R, depth, mossD); }   // the side walls running down to the front
        const lx = x0 + W - 3.5 * R, lh = 46 * R; line(lx, by - depth - wh, lx, by - depth - wh - lh, rgb(p.iron), 2.4 * R); rect(lx - 4 * R, by - depth - wh - lh - 2 * R, 8 * R, 9 * R, rgb(p.iron)); rect(lx - 2.6 * R, by - depth - wh - lh, 5.2 * R, 6 * R, rgba(hx('#c8a050'), 0.35)); rect(lx - 6 * R, by - depth - wh - lh - 3 * R, 12 * R, 1.6 * R, rgb(p.iron));   // an unlit iron lantern on a post at the back corner
        for (let i = 0; i < 6; i++) ell(x0 + W * (0.1 + r() * 0.8), by - depth - wh * 0.2 - r() * 3 * R, (2 + r() * 2) * R, R, rgba(hx('#c8c4b8'), 0.3));   // bird lime and dust on the coping
      } else {
        const gap = 34 * R; run(x0, by - wh, (W - gap) / 2, wh); run(x0 + (W + gap) / 2, by - wh, (W - gap) / 2, wh);   // the front wall with a gap
        for (const px of [x0 + (W - gap) / 2 - 5 * R, x0 + (W + gap) / 2 - 5 * R]){ rect(px, by - wh - 10 * R, 10 * R, wh + 10 * R, rgb(p.stoneD)); stones(px, by - wh - 10 * R, 10 * R, wh + 10 * R, 4, 1, p.stone, p.stoneL); ell(px + 5 * R, by - wh - 10 * R, 5.6 * R, 2.4 * R, rgb(mix(p.stone, p.stoneL, 0.3))); }   // the gate posts
        rect(x0 + (W - gap) / 2 + 5 * R, by - 2 * R, gap - 10 * R, 2 * R, rgba(hx('#0c0a08'), 0.35));   // a worn sill in the gap
      }
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -L, 0.3);
    const sp = finish(c, cx, by, kind === 'hearth' || kind === 'door' || kind === 'gy_back' || kind === 'kegs', 'sprop', 0.04); sp.shadow = null; return sp;
  }
  // the hook: W3D's m_* holding props land here while VO3 is on; o.scale comes through W3D.S, flash through w3dMapProp's own filter
  const MPROP_KIND = {m_chest: ['chest', {}], m_chest_open: ['chest', {open: 1}], m_cage: ['cage', {}], m_cage_open: ['cage', {open: 1}], m_vault: ['vault', {}], m_vault_open: ['vault', {open: 1}],
    m_beacon: ['beacon', {}], m_beacon_lit: ['beacon', {lit: 1}], m_banner: ['banner', {flag: 'war'}], m_banner_done: ['banner', {flag: 'done'}], m_banner_exit: ['banner', {flag: 'exit'}],
    m_relic: ['relic', {}], m_ruinstone: ['ruinstone', {}], m_column: ['column', {}], m_gate: ['gate', {}], m_gate_broken: ['gate', {open: 1}],
    // batch 7, the field props (third entry marks the fieldProp painter)
    m_trap_caltrops: ['caltrops', {}, 1], m_trap_beartrap: ['beartrap', {}, 1], m_trap_tripwire: ['tripwire', {}, 1], m_trap_deadfall: ['deadfall', {}, 1], m_trap_firepot: ['firepot', {lit: 1, flameH: 22, flameS: 0.2}, 1], m_trap_stakes: ['stakes', {}, 1],
    m_crystal: ['crystal', {}, 1], m_relic_held: ['relic_held', {}, 1], m_tracks: ['tracks', {}, 1], m_pit: ['pit', {}, 1], m_hide: ['hide', {}, 1], m_footing: ['footing', {}, 1], m_scaffold: ['scaffold', {}, 1], m_buildpile: ['buildpile', {}, 1],
    // batch 8, the set pieces (third entry 2 marks the setProp painter; flick picks the frame from o.t)
    tv_hearth: ['hearth', {flick: 1}, 2], tv_counter: ['counter', {}, 2], tv_table: ['table', {}, 2], tv_door: ['door', {}, 2], tv_kegs: ['kegs', {}, 2], tv_barrels: ['barrels', {}, 2], tv_candle: ['candle', {flick: 1}, 2], tv_ale: ['ale', {}, 2],
    gy_back: ['gy_back', {}, 2], gy_front: ['gy_front', {}, 2]};
  const S0 = typeof W3D === 'object' && W3D ? W3D.S : 1;
  V.drawMapProp = function(kind, x, gl, o){
    const m = MPROP_KIND[kind]; if (!m) return null;
    const v = m[1].flick ? ((((o && o.t) || 0) >> 2) & 3) : hsh(x | 0, gl | 0) % 4, sp = V.sprite(m[2] === 2 ? 'sprop' : m[2] ? 'fprop' : 'mprop', v, seNow(), Object.assign({k: m[0]}, m[1])); if (!sp) return false;
    const sc = typeof W3D === 'object' && W3D && S0 ? W3D.S / S0 : 1, a = o && o.alpha != null ? o.alpha : 1;
    if (a < 1){ ctx.save(); ctx.globalAlpha *= a; } blitSprite(sp, x, gl, sc, m[2] !== 2 && m[0] !== 'gate' && m[0] !== 'tracks' && !!(hsh(x | 0, 3) % 2)); if (a < 1) ctx.restore();
    if (m[1].lit && typeof V.drawFlames === 'function'){ const fy = gl - (m[1].flameH || MPROP.beacon[1] * 0.9) * sc, fs = (m[1].flameS || 0.42) * sc; ctx.save(); ctx.translate(x, fy); ctx.scale(fs, fs); ctx.translate(-x, -fy); V.drawFlames(x, fy, (o && o.t) || 0); ctx.restore(); }
    return true;
  };

  /* ---- the cache and the swap into STRUCT's list ---- */
  const lightKey = () => { const L = light(); return L.dir.x.toFixed(2) + ',' + L.dir.y.toFixed(2) + ',' + (+L.elev || 0).toFixed(2); };   /* INDEX F28 batch 2: dusk rebuilds */
  V._int = {R, P, hx, mix, mul, rgb, rgba, cool, poly, blob, mk, rng, hsh, light, lit, CELLW};   /* INDEX T29: the trade shells (js/camp/trade.js) paint with the same helpers */
  V.sprite = function(kind, v, se, o){
    const A37 = window.ART37;   // SW-11 (js/art/art-sw11.js): the Edelos wagon, and a solid outline on gates and boulders (folded, INT-1 stage 3)
    if (A37 && kind === 'wagon' && o && o.edelos) return A37.wagon(v, se);
    const sp = spriteBase(kind, v, se, o);
    return A37 && sp && sp.img && (kind === 'boulder' || kind === 'gate') ? A37.solid(sp) : sp;
  };
  function spriteBase(kind, v, se, o){
    const key = kind + ':' + v + ':' + se + ':' + (o ? Object.keys(o).sort().map(k => k + '=' + o[k]).join('&') : '') + ':' + lightKey();
    let sp = V.cache[key]; if (sp) return sp;
    const t0 = performance.now(), cpu = V.wrf !== false;
    if (cpu) bakeDepth++;
    try {
    sp = kind === 'threshold' ? threshold(v, se, o) : kind === 'tshell' ? (window.T29 ? T29.shell(v, se, o) : building(v, se, o)) : /* INDEX T29 */ kind === 'building' ? building(v, se, o) : kind === 'tent' ? tent(v, se, o) : kind === 'palisade' ? palisade(v, se, o) : kind === 'wall' ? wall(v, se, o) : kind === 'cliff' ? cliff(v, se, o) : kind === 'gate' ? gate(v, se, o) : kind === 'hearth' ? hearth(v, se) : kind === 'wagon' ? wagon(v, se) : kind === 'decor' ? decor(o && o.k, v, se) : kind === 'prop' ? prop(o && o.k, v, se) : kind === 'mprop' ? mapProp(o && o.k, v, se, o) : kind === 'fprop' ? fieldProp(o && o.k, v, se, o) : kind === 'sprop' ? setProp(o && o.k, v, se, o) : kind === 'fac' ? facility(o && o.k, v, se, o) : kind === 'boulder' ? boulder(v, se) : kind === 'rubble' ? rubble(v, se) : (kind === 'oak' || kind === 'pine' || kind === 'birch' || kind === 'dead') ? tree(kind, v, se) : null;
    } finally { if (cpu) bakeDepth--; }
    if (!sp) return null;
    if (cpu){ sp.img = toGPU(sp.img); if (sp.shadow && sp.shadow.img) sp.shadow.img = toGPU(sp.shadow.img); }
    V.stats.sprites++; V.stats.ms += performance.now() - t0;
    return V.cache[key] = sp;
  }
  function bounds(it, sp){
    it.img = sp.img; it.ax = sp.ax; it.ay = sp.ay; it.s = sp.s; it.shadow = sp.shadow; it.tall = sp.tall; it.vo3 = true;
    it.x0 = it.x - sp.ax * sp.s; it.x1 = it.x0 + sp.img.width * sp.s; it.y0 = it.y - sp.ay * sp.s; it.y1 = it.y0 + sp.img.height * sp.s;
    const sh = sp.shadow; if (sh){ it.sx0 = Math.min(it.x0, it.x - sh.ax); it.sx1 = Math.max(it.x1, it.x - sh.ax + sh.img.width); it.sy0 = Math.min(it.y0, it.y - sh.ay); it.sy1 = Math.max(it.y1, it.y - sh.ay + sh.img.height); } else { it.sx0 = it.x0; it.sx1 = it.x1; it.sy0 = it.y0; it.sy1 = it.y1; }
  }
  // size of a building or tent from the old item's footprint (the sprite's width is the footprint plus a fixed pad per kind)
  function footprint(it, C){ const w = Math.max(1, Math.round((it.x1 - it.x0) / C)); return {w, d: Math.max(1, Math.round((it.y1 - it.y0 - 30) / (C * 0.8)))}; }
  V.swap = function(map, env){
    if (!V.on || !window.STRUCT || !STRUCT.list) return 0;
    const se = (env && env.season) || 'summer', C = CELLW(), T_ = (typeof T !== 'undefined' ? T : null), g = map && map.g, w = map && map.w;
    let n = 0;
    const at = (x, y) => (!g || x < 0 || y < 0 || x >= w || y >= map.h) ? -1 : g[y * w + x];
    const isStone = t => T_ && (t === T_.STONE || t === T_.WALL);
    /* INDEX SW8: doorways. A doorway is a run of 1 to 3 passable cells between two cells of one wall line (stone, wall or palisade), across a
       row (a gap in a north-south line) or a column (a gap in an east-west line). The gate has its own sprite and is left out. */
    const lineT = t => T_ && (t === T_.STONE || t === T_.WALL || t === T_.PALISADE), openT = t => T_ && t >= 0 && !(t === T_.STONE || t === T_.WALL || t === T_.PALISADE || t === T_.ROOF || t === T_.TENT || t === T_.WAGON || t === T_.GATE || t === T_.WATER);
    const wallish = (x, y, dx, dy) => lineT(at(x, y)) && lineT(at(x + dx, y + dy));   // the wall carries on in the same direction: a break in a straight line, not a corridor between two walls
    const gaps = new Map();   // "x,y" -> 'h' (the gap cuts a row: walls left and right) or 'v' (walls above and below)
    if (g && T_ && V.K.gaps !== false) for (let y = 0; y < map.h; y++) for (let x = 0; x < w; x++){   // V.K.gaps = false turns the doorway fix off
      if (!openT(at(x, y))) continue;
      for (const [dx, dy, tag] of [[1, 0, 'h'], [0, 1, 'v']]){
        if (openT(at(x - dx, y - dy))) continue;   // only start at the first open cell of the run
        let n = 0; while (n < 3 && openT(at(x + dx * n, y + dy * n))) n++;
        const ex = x + dx * n, ey = y + dy * n;
        if (n > 3 || openT(at(ex, ey)) || !wallish(x - dx, y - dy, -dx, -dy) || !wallish(ex, ey, dx, dy)) continue;
        let thin = true; for (let k = 0; k < n; k++){ const cx_ = x + dx * k, cy_ = y + dy * k; if (lineT(at(cx_ - dy, cy_ + dx)) || lineT(at(cx_ + dy, cy_ - dx))) thin = false; }
        if (!thin) continue;   // a lane running between two walls is not a doorway
        for (let k = 0; k < n; k++) gaps.set((x + dx * k) + ',' + (y + dy * k), tag);
      }
    }
    V._gaps = gaps;
    for (const it of STRUCT.list){
      if (!V.COVER[it.kind] || it.vo3) continue;
      const hv = hsh(Math.round(it.x), Math.round(it.y)), cy = Math.round(it.y / C) - 1;
      let sp = null;
      if (it.kind === 'building'){
        // the footprint from the map: the ROOF run under the item's centre
        let wc = 2, dc = 2; if (it.fw){ wc = it.fw; dc = it.fd; } else if (g && T_){ const cx = Math.floor(it.x / C); let x0 = cx, x1 = cx, y0 = cy; while (at(x0 - 1, cy) === T_.ROOF) x0--; while (at(x1 + 1, cy) === T_.ROOF) x1++; while (at(cx, y0 - 1) === T_.ROOF) y0--; wc = x1 - x0 + 1; dc = cy - y0 + 1; }
        sp = V.sprite('building', hv % 3, se, {w: wc, d: dc});
      } else if (it.kind === 'tent'){ sp = V.sprite('tent', hv % 3, se, {w: Math.max(1, Math.min(3, Math.round((it.x1 - it.x0) / C)))}); }
      else if (it.kind === 'palisade'){ const cx = Math.floor(it.x / C); const m = T_ ? (at(cx, cy - 1) === T_.PALISADE ? 1 : 0) | (at(cx + 1, cy) === T_.PALISADE ? 2 : 0) | (at(cx, cy + 1) === T_.PALISADE ? 4 : 0) | (at(cx - 1, cy) === T_.PALISADE ? 8 : 0) : 10; sp = V.sprite('palisade', hv % 4, se, {mask: m, low: gaps.get(cx + ',' + (cy - 1)) === 'v' ? 1 : 0}); }
      else if (it.kind === 'wall'){ const run = Math.max(1, Math.round((it.x1 - it.x0) / C)), x0 = Math.round(it.x / C - run / 2); const cx = Math.floor(it.x / C); sp = V.sprite('wall', hv % 6, se, {run, ends: (isStone(at(x0 - 1, cy)) ? 0 : 1) | (isStone(at(x0 + run, cy)) ? 0 : 2), low: gaps.get(cx + ',' + (cy - 1)) === 'v' ? 1 : 0, up: run === 1 && isStone(at(cx, cy - 1)) ? 1 : 0, down: run === 1 && isStone(at(cx, cy + 1)) ? 1 : 0}); }
      else if (it.kind === 'cliff' && it.sh) sp = V.sprite('cliff', (hv >> 2) % 4, se, {sh: it.sh});   /* Q103: sheared to the hill contour (world.js sets it.sh) */
      else sp = V.sprite(it.kind, (hv >> 2) % 4, se);
      if (sp){ bounds(it, sp); n++; }
    }
    // the gates: GATE cells are road to the ground and nothing to STRUCT; each horizontal run becomes one gate item (timber in a
    // palisade line, stone in a wall line)
    if (g && T_ && T_.GATE !== undefined && !STRUCT.list.some(it => it.kind === 'gate')){
      for (let y = 0; y < map.h; y++) for (let x = 0; x < w; x++){
        if (at(x, y) !== T_.GATE || at(x - 1, y) === T_.GATE) continue;
        let nn = 1; while (at(x + nn, y) === T_.GATE) nn++;
        const stone = isStone(at(x - 1, y)) || isStone(at(x + nn, y)), sp = V.sprite('gate', hsh(x, y) % 3, se, {n: nn, stone: stone ? 1 : 0});
        if (!sp) continue;
        const it = {x: (x + nn / 2) * C, y: (y + 1) * C, kind: 'gate'}; bounds(it, sp); STRUCT.list.push(it); n++;
      }
      STRUCT.list.sort((a, b) => a.y - b.y);
    }
    if (gaps.size && !STRUCT.list.some(it => it.kind === 'threshold')){   // INDEX SW8: the worn threshold on every doorway cell
      for (const k of gaps.keys()){ const [gx, gy] = k.split(',').map(Number), sp = V.sprite('threshold', hsh(gx, gy) % 4, se);
        if (!sp) continue; const it = {x: (gx + 0.5) * C, y: gy * C, kind: 'threshold'}; bounds(it, sp); STRUCT.list.push(it); n++; }
      STRUCT.list.sort((a, b) => a.y - b.y);
    }
    if (n) V.stats.swapped = n; return n;
  };
  if (window.STRUCT && typeof STRUCT.build === 'function'){
    const f = STRUCT.build;
    STRUCT.build = function(map, env){ const was = STRUCT.built; f.apply(this, arguments); if (STRUCT.built !== was) try { V.swap(map || window.MAP, env); } catch (e) { console.warn('VO3 swap:', e); } };
    // the cache survives STRUCT.invalidate (its keys carry kind, variant, season, footprint and light), so a second build is free; V.rebuild clears it
    V.rebuild = function(){ V.cache = {}; if (window.VO2) VO2.built = null; STRUCT.invalidate(); };   // VO2.build keys on map|season|host|time, so a bare STRUCT.invalidate leaves the list empty
    if (STRUCT.built && V.on) try { V.rebuild(); } catch (e) {}   // the title screen's camp was built before this file loaded
  }
  // VO2-CAMP lit only the siege part by day; the whole prologue town (kit, siege) now stands under the one low day sun, since the dusk
  // grade (#cfa48e multiply) was the sepia wash Patrick hated; the road nights keep their night
  V.campDay = true;
  if (window.LOOK && typeof LOOK.time === 'function'){
    const f = LOOK.time;
    // the prologue camp by day (the road nights keep their night); the campaign hub by day too, since LOOK's "camp is evening" dusk grade
    // (#cfa48e multiply) turned the painted fort to sepia and its dark timber and dug plots to black (Patrick, 2026-11-12)
    LOOK.time = function(){
      if (V.on && V.campDay && !LOOK.force){
        if (window.VO2 && VO2.campNow && VO2.campNow() && typeof CP === 'function' && CP()){ if (CP().part !== 'road') return 'day'; }
        else if (!(typeof G !== 'undefined' && G) && typeof CAMP !== 'undefined' && CAMP && CAMP.on) return 'day';
      }
      return f.apply(this, arguments); };
  }
  // the season sparkle (drawSeasonOverlay: summer dragonflies and fireflies, spring pollen and bees) is the "cute" Patrick binned;
  // the overlay still runs in winter for the rain and snow
  if (typeof drawSeasonOverlay === 'function'){
    const f = drawSeasonOverlay;
    drawSeasonOverlay = function(cx, cy, w, h, fr, mode){ if (V.on && !V.motes && typeof currentSeason === 'function' && currentSeason() !== 'winter') return; return f.apply(this, arguments); };
  }
  // the old gatehouse drawer painted its own posts and leaves over the GATE cells; VO3's gate item replaces it
  if (typeof drawGateHouse === 'function'){ const f = drawGateHouse; drawGateHouse = function(){ if (V.on) return; return f.apply(this, arguments); }; }

  // batch 3: the campfire, the loose flames and the wagon were r3d renders (voxel kits); VO3 paints them while it is on
  // the hub's trees (w3dTree -> t_pine/oak/t_birch/t_dead), the quartermaster's wagon (w_wagon) and the Chapter banner (m_bch_<hash>, from banner()) were still the old painters (Patrick, 2026-11-12)
  const TREE_KIND = {t_pine: 'pine', oak: 'oak', t_birch: 'birch', t_dead: 'dead'};
  V.drawHubKind = function(kind, x, gl, o){
    const a = o && o.alpha != null ? o.alpha : 1, sc = typeof W3D === 'object' && W3D && S0 ? W3D.S / S0 : 1;
    let sp = null, flip = false;
    if (TREE_KIND[kind]){ sp = V.sprite(TREE_KIND[kind], hsh(x | 0, gl | 0) % 4, seNow()); flip = !!(o && o.mirror); }
    else if (kind === 'w_wagon'){ sp = V.sprite('wagon', hsh(x | 0, gl | 0) % 2, seNow()); flip = !!(hsh(x | 0, 7) % 2); }
    else if (kind.slice(0, 6) === 'm_bch_' && typeof banner === 'function'){ const b = banner(); sp = V.sprite('mprop', 0, seNow(), {k: 'chbanner', div: b.div, c1: b.c1, c2: b.c2, charge: b.charge, glyph: b.glyph || 'sword'});
      if (V.hubFort && V.hubFort() && typeof HUB !== 'undefined' && HUB.house) x = HUB.house.x + (x - HUB.house.x) * V.K.hubBuild; }   // the house blits at hubBuild, so its corner moved
    else return null;
    if (!sp) return null;
    if (a < 1){ ctx.save(); ctx.globalAlpha *= a; } blitSprite(sp, x, gl, kind === 'w_wagon' ? sc * 1.25 : sc, flip); if (a < 1) ctx.restore(); return true;
  };
  if (typeof w3dDraw === 'function'){ const f = w3dDraw; w3dDraw = function(kind, x, gl, o){ if (V.on && (kind === 'campfire' || kind === 'campfire_ruin')) return V.drawFire(x, gl, (o && o.t) || 0); if (V.on && typeof kind === 'string'){ const d = V.drawHubKind(kind, x, gl, o); if (d !== null) return d; } if (V.on && typeof kind === 'string' && kind.slice(0, 3) === 'dc_'){ const d = V.drawDecor(kind.slice(3), x, gl, o); if (d !== null) return d; } if (V.on){ const d = V.drawFacility(kind, x, gl, o); if (d !== null) return d; } if (V.on && PROP_KIND[kind]){ const d = V.drawProp(kind, x, gl, o); if (d !== null) return d; } if (V.on && MPROP_KIND[kind]){ const d = V.drawMapProp(kind, x, gl, o); if (d !== null) return d; } return f.apply(this, arguments); }; }
  if (typeof w3dFlames === 'function'){ const f = w3dFlames; w3dFlames = function(x, y, t){ if (V.on && V.gfire && typeof G !== 'undefined' && G && G.fires){ const fz = G.fires.find(f => f.x === x && f.y === y); if (fz) try { return V.drawGroundFire(fz, t); } catch (e){ V.gfireFail = String(e && e.message || e); } } if (V.on) return V.drawFlames(x, y, t); return f.apply(this, arguments); }; }
  // the campaign hub's people (drawSprite at 2.4, 62 px) stand in a world sized to V.K.person (75 px): scale them up as the story camps do (VO2 campFigure); the hub is any camp with no mission and no prologue part
  V.K.hubFigure = 1.4;   // camera standard: one scale for the hub's people and buildings, so the door table holds
  V.K.townFigure = 1.4 * 2.4 / 2.2;   // the prologue town's people arrive at 2.2 (VO2 campFigure 1.3 on 1.7) where the hub's arrive at 2.4: both land at 3.36, so a person is 75 px against the same buildings (town22: doors were 1.4 people tall)
  if (typeof drawSprite === 'function' && !drawSprite.__vo3){ const f = drawSprite; drawSprite = function(spr, x, y, s, frame, left, flash){
      if (V.on && spr && spr.frames){ if (typeof CAMP !== 'undefined' && CAMP && CAMP.on && !(typeof G !== 'undefined' && G)) s *= (typeof inStory === 'function' && inStory()) ? V.K.townFigure : V.K.hubFigure; s *= V.persp(y); }
      return f.call(this, spr, x, y, s, frame, left, flash); }; drawSprite.__vo3 = true; }
  if (typeof w3dWagon === 'function'){ const f = w3dWagon; w3dWagon = function(x, y, left, s, flash){ if (!V.on) return f.apply(this, arguments);
    const sp = V.sprite('wagon', (hsh(Math.round(x), Math.round(y)) % 2), seNow()); if (!sp) return f.apply(this, arguments);
    if (flash){ ctx.save(); ctx.filter = 'brightness(2.2)'; } blitSprite(sp, x, y + 2 * (s || 2.6) * 0.3, (s || 2.6) / 2.6, !!left); if (flash) ctx.restore(); return true; }; }
  // LOOK's cookfire pool was drawn at the campaign hub's fire spot even in the prologue town (a pale disc over the market square): it follows the town's fire now, and the road nights have none (the column's fire carries its own glow)
  if (window.LOOK) LOOK.campFire = function(){ if (!V.on || typeof inStory !== 'function' || !inStory()) return typeof HUB !== 'undefined' && HUB.fire; const C = typeof CP === 'function' && CP(); if (!C || C.part === 'road') return false; return {x: 28 * CELLW(), y: 23.5 * CELLW() + 8}; };
  // the district haze: the flat gold disc over a held district is gone; an overrun one keeps a thin red wash, hover a little more
  V.hazeAlpha = (over, hot) => hot ? 0.16 : over ? 0.12 : 0;
  // the ground materials: GROUND paints its tiles by material; VO3 hands it darker water, churned roads, worn flags and wall footing
  V.mat = function(p, se){
    const h3 = (x, y, k) => (hsh(x * 7 + k * 131, y * 11 + k) % 1000) / 1000, wet = [38, 44, 52];
    return {
      water: (x, y, A, B, C, S) => { let c = mix(mul(p.water, 0.5), [22, 30, 34], 0.55); c = mul(c, 0.8 + A * 0.3); if (S > 0.84) c = mul(c, 1.0 + (S - 0.84) * 1.2); c = mul(c, 0.97 + C * 0.06); return c; },
      bank:  (x, y, A, B, C, S) => { let c = mix(mul(p.mud, 0.7), wet, 0.22); c = mul(c, 0.94 + S * 0.1); c = mul(c, 0.96 + C * 0.08); return c; },
      road:  (x, y, A, B, C, S) => { let c = mul(mix(p.dirt, p.mud, 0.45), 0.92); c = mul(c, 0.9 + B * 0.18); if (S > 0.72) c = mul(c, 0.84); if (A < 0.3) c = mix(mul(c, 0.86), wet, (0.3 - A) * 1.2); if (C > 0.95) c = mix(c, p.stone, 0.4); if (C < 0.05) c = mul(c, 0.74); return c; },
      flags: (x, y, A, B, C) => {   // worn flags about a third of a person across, in rows of uneven offset, wide dark joints, some gone to earth, a crack here and there
        const fy = (y / 20) | 0, ox = (h3(fy, 0, 5) * 26) | 0, fx = ((x + ox) / 26) | 0, mx = (x + ox) % 26, my = y % 20, sh = 0.8 + h3(fx, fy, 1) * 0.36;
        if (h3(fx, fy, 2) < 0.1) return mul(mix(p.mud, p.dirt, 0.4), 0.82 + C * 0.14);   // a flag gone, earth in the gap
        let c = mul(mix(mix(p.stone, wet, 0.3), p.mud, 0.15), 0.58 * sh); if (mx < 2 || my < 2) c = mul(c, 0.45); else if (mx === 2 || my === 2) c = mul(c, 1.08);
        if (h3(fx, fy, 7) < 0.22 && Math.abs(my - ((mx * 0.7 + h3(fx, fy, 8) * 15) % 20)) < 1.1) c = mul(c, 0.55);   // a crack across the flag
        c = mul(c, 0.92 + C * 0.16); if (A > 0.62) c = mul(c, 0.86); if (B < 0.28) c = mix(c, wet, 0.2); return c; },
      stone: (x, y, A, B, C) => { const fy = (y / 13) | 0, ox = (fy & 1) * 9, fx = ((x + ox) / 18) | 0, mx = (x + ox) % 18, my = y % 13, sh = 0.86 + h3(fx, fy, 3) * 0.2;
        let c = mul(mix(p.stone, p.mud, 0.2), 0.66 * sh); if (mx < 1 || my < 1) c = mul(c, 0.5); else if (mx === 1 || my === 1) c = mul(c, 1.06); c = mul(c, 0.94 + C * 0.12); if (se !== 'winter' && A > 0.66 && (mx < 4 || my < 4)) c = mix(c, p.moss, (A - 0.66) * 1.1); if (B < 0.3) c = mul(c, 0.9); return c; }
    };
  };
  // the camp squares (the story town's plaza, the fort's parade ground, the warehouse floor) tile TILE.floor: while VO3 is on they get the same worn flags as the field, painted periodic at 260 px
  const FLAGT = {};
  V.flagTile = function(se){
    if (FLAGT[se]) return FLAGT[se];
    const q = P(se), p = {stone: q.stone, mud: hx('#3c3024'), dirt: hx('#5a4c3c'), moss: q.moss, water: hx('#50606a')}, m = V.mat(p, se), N = 260, c = mk(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
    const n = (x, y, k) => (hsh(x * 13 + k * 977, y * 17 + k * 31) % 1000) / 1000;
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++){ const col = m.flags(x, y, n(x >> 3, y >> 3, 1), n(x >> 2, y >> 2, 2), n(x, y, 3), 0.5), o = i * 4; d[o] = Math.max(0, Math.min(255, col[0])); d[o + 1] = Math.max(0, Math.min(255, col[1])); d[o + 2] = Math.max(0, Math.min(255, col[2])); d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return FLAGT[se] = c;
  };
  // the fort's streets and parade ground (drawCampRoads, Index 69): the stone court read as a flat panel over the painted grass
  // (Patrick, 2026-11-12), so while VO3 is on they are packed earth with cart ruts, a soft dark verge and a few flat stones trodden in
  const EARTHT = {};
  V.earthTile = function(se){
    if (EARTHT[se]) return EARTHT[se];
    const q = P(se), p = {stone: q.stone, mud: hx('#3c3024'), dirt: hx('#5a4c3c'), moss: q.moss, water: hx('#50606a')}, m = V.mat(p, se), N = 260, c = mk(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
    const n = (x, y, k) => (hsh(x * 13 + k * 977, y * 17 + k * 31) % 1000) / 1000;
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++){ const col = m.road(x, y, 0.5 + n(x >> 4, y >> 4, 1) * 0.5, n(x >> 2, y >> 2, 2), n(x, y, 3), n(x >> 3, y >> 3, 4) * 0.7), o = i * 4; d[o] = Math.max(0, Math.min(255, col[0])); d[o + 1] = Math.max(0, Math.min(255, col[1])); d[o + 2] = Math.max(0, Math.min(255, col[2])); d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return EARTHT[se] = c;
  };
  if (typeof drawCampRoads === 'function' && !drawCampRoads.__vo3){
    const f = drawCampRoads, VERGE = 'rgba(22,18,14,.3)', RUT = 'rgba(22,18,14,.2)';
    const rr = (x, y, w, h, k) => { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath(); };
    const path = (pts, ox, oy) => { ctx.beginPath(); ctx.moveTo(pts[0][0] + (ox || 0), pts[0][1] + (oy || 0)); for (const p of pts.slice(1)) ctx.lineTo(p[0] + (ox || 0), p[1] + (oy || 0)); };
    drawCampRoads = function(){
      if (!V.on || typeof layoutKey !== 'function' || layoutKey() !== 'fort' || typeof CAMP_LAYOUT === 'undefined') return f.apply(this, arguments);
      const L = CAMP_LAYOUT.fort, se = seNow(), q = P(se);
      if (!V.earthPat || V.earthPatSe !== se){ V.earthPat = ctx.createPattern(V.earthTile(se), 'repeat'); V.earthPatSe = se; }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const r of L.roads){ path(r.pts); ctx.strokeStyle = VERGE; ctx.lineWidth = r.w + 10; ctx.stroke(); }
      for (const r of L.roads){ path(r.pts); ctx.strokeStyle = V.earthPat; ctx.lineWidth = r.w; ctx.stroke(); }
      for (const r of L.roads){ const a = r.pts[0], b = r.pts[r.pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len * r.w * 0.24, ny = dx / len * r.w * 0.24;
        for (const sg of [-1, 1]){ path(r.pts, nx * sg, ny * sg); ctx.strokeStyle = RUT; ctx.lineWidth = 2.5; ctx.stroke(); } }
      for (const g of L.rects){
        ctx.fillStyle = VERGE; rr(g.x - 8, g.y - 8, g.w + 16, g.h + 16, 44); ctx.fill();
        ctx.fillStyle = V.earthPat; rr(g.x, g.y, g.w, g.h, 36); ctx.fill();
        for (let i = 0; i < 26; i++){ const h1 = hsh(i * 7 + 3, g.x + g.y), h2 = hsh(i * 11 + 5, g.w + i), x = g.x + 18 + h1 % (g.w - 36), y = g.y + 14 + h2 % (g.h - 28), w = 5 + h1 % 7, h = 3 + h2 % 4;
          ctx.fillStyle = rgba(mix(q.stone, i % 3 ? q.stoneL : q.stoneD, (h1 % 100) / 100), 0.55); ctx.beginPath(); ctx.ellipse(x, y, w, h, ((h2 % 60) - 30) / 100, 0, Math.PI * 2); ctx.fill(); }
        for (let i = 0; i < 14; i++){ const h1 = hsh(i * 5 + 1, g.y), h2 = hsh(i * 3 + 9, g.x), ex = i % 2 ? g.x + 4 + h1 % 30 : g.x + g.w - 4 - h1 % 30, ey = g.y + 10 + h2 % (g.h - 20);
          ctx.fillStyle = rgba(q.moss, 0.35); ctx.beginPath(); ctx.ellipse(ex, ey, 7 + h2 % 8, 3 + h1 % 3, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      for (const id in L.plots){ if (typeof has !== 'function' || !has(id) || !PLOTS[id] || ['palisade', 'watchtower', 'kennels'].includes(id)) continue; const [x, y] = PLOTS[id];
        ctx.fillStyle = V.earthPat; ctx.fillRect(x - 9, y - 2, 18, 22); }
      ctx.restore();
      if (V.hubFort && V.hubFort() && V.bakeHub){ try { V.blitLayer(V.bakeHub().back); } catch (e) { console.warn('VO3 hub layers:', e); } }   // the border trees above the content, with the palisade ring, as one image
      return true;
    };
    drawCampRoads.__vo3 = true;
  }
  if (typeof TILE !== 'undefined' && typeof TILE.floor === 'function' && !TILE.floor.__vo3){ const f = TILE.floor; TILE.floor = function(v){ if (V.on) return V.flagTile(seNow()); return f.apply(this, arguments); }; TILE.floor.__vo3 = true; }
  if (window.GROUND && V.on){ GROUND.MAT = V.mat; if (typeof GROUND.clearMats === 'function') GROUND.clearMats(); }
  // the ground: VO2 applies V.pal while GROUND builds; the decal rates are set once
  if (window.VO2){ if (V.on){ VO2.pal = V.pal; VO2.ground = V.ground; } }
  if (window.GROUND && GROUND.K && GROUND.K.decal && V.on) Object.assign(GROUND.K.decal, V.decal);
  V.tint = {camp: {desat: 0.12, cast: '#4a4c48', k: 0.1}, bandits: {desat: 0.1, cast: '#4e4a42', k: 0.06}};   // GROUND.TINT: the camp's warm sepia cast (#6b5238) becomes a cold grey one
  if (window.GROUND && GROUND.TINT && V.on) for (const k in V.tint) Object.assign(GROUND.TINT[k], V.tint[k]);

  // batch 10: the fort camp's facility buildings, each composed from VO3's own buildings, tents and decor plus the dressing that says at a glance what it is for
  const FAC = {tents: [150, 96], huts: [150, 170], bunks: [160, 170], kitchen: [150, 172], tavern: [160, 172], command: [150, 116], merchant: [150, 100], house: [130, 170], cells: [150, 126], barracks: [160, 172], training: [164, 104], armoury: [140, 172], stables: [160, 120], ranger: [150, 130], hospital: [160, 116], blacksmith: [160, 172], carpentry: [160, 112], leather: [150, 172], engineering: [166, 132], alchemy: [150, 172], magetower: [110, 170], chapel: [150, 170], church: [164, 172], kennels: [160, 112], gatehouse: [164, 150], watchtower: [100, 170], trapyard: [164, 110], edelos: [160, 132],
    b_deckhouse: [150, 120], b_grog: [160, 124], b_fightdeck: [160, 124], b_tarp: [150, 96], b_galley: [150, 120], b_hatch: [140, 90], b_rigging: [150, 150], b_mast: [100, 156], b_bench: [150, 100], b_cannon: [160, 110], b_shrine: [130, 130], b_nets: [160, 110],
    w_wbay: [160, 130], w_kpen: [150, 96], w_loft: [160, 150], w_galley: [150, 120], w_stall: [150, 110], w_cage: [130, 120], w_pit: [160, 90], w_ladder: [110, 158], w_furnace: [150, 130], w_vat: [160, 90], w_barricade: [150, 120], w_bench: [150, 100]};   // the barge and warehouse skins (sk2_<holding>_<id>): type from SK2_MAP, look flags from BARGE_LOOK / WARE_LOOK   // building kinds carry a person-and-a-half wall under a shallow roof, so they stay under 2.6 persons tall on a 140 px fort plot pitch
  const FAC_KIND = {q_tents: 'tents', q_huts: 'huts', q_bunks: 'bunks', f_kitchen: 'kitchen', f_tavern: 'tavern', f_command: 'command', f_merchant: 'merchant', house: 'house', f_cells: 'cells', f_barracks: 'barracks', f_training: 'training', f_armoury: 'armoury', f_stables: 'stables', f_ranger: 'ranger', f_hospital: 'hospital', f_blacksmith: 'blacksmith', f_carpentry: 'carpentry', f_leather: 'leather', f_engineering: 'engineering', f_alchemy: 'alchemy', f_magetower: 'magetower', f_chapel: 'chapel', f_church: 'church', f_kennels: 'kennels', f_gatehouse: 'gatehouse', f_watchtower: 'watchtower', f_trapyard: 'trapyard', f_edelos: 'edelos'};
  function facKey(kind){ if (typeof kind !== 'string') return null; let k = kind, ruin = false, dmg = false; if (k.slice(0, 3) === 'ws_'){ ruin = true; k = k.slice(3); } if (k.slice(-4) === '_dmg'){ dmg = true; k = k.slice(0, -4); }
    const m = /^sk2?_(barge|warehouse)_(.+)$/.exec(k);
    if (m){ const hk = m[1], id = m[2]; if (id === 'edelos') return {key: 'edelos', ruin, dmg}; const T = typeof BARGE_LOOK !== 'undefined' ? (hk === 'barge' ? BARGE_LOOK : WARE_LOOK) : null, X = typeof W3D_EXTRA_LOOK !== 'undefined' ? W3D_EXTRA_LOOK[hk] : null, look = T && (T[id] || (X && X[id])); if (!look) return null;
      const t = typeof SK2_MAP !== 'undefined' && SK2_MAP[hk] ? SK2_MAP[hk](look, id) : look.t, key = (hk === 'barge' ? 'b_' : 'w_') + t; return FAC[key] ? {key, ruin, dmg, look} : null; }
    const key = FAC_KIND[k]; return key ? {key, ruin, dmg} : null; }
  function facility(kind, v, se, o){
    const size = FAC[kind]; if (!size) return null;
    o = o || {}; const F = V.K.facade || null, p = Object.assign(P(se), F && F.pal ? Object.fromEntries(Object.entries(F.pal).map(([k, c]) => [k, hx(c)])) : {}), w = se === 'winter', r = rng(hsh(v * 37 + 3, kind.length * 101 + kind.charCodeAt(0) * 7)), L = lit();
    const W = size[0] * R, H = size[1] * R, c = mk(W + 24 * R + 80 * R, H + 20 * R + 44 * R), g = c.getContext('2d'), cx = c.width / 2, by = c.height - 8 * R;   // the pad past the old footprint holds the three-quarter buildings' side wall and gable
    const line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
    const rect = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    if (F && F.roof && F.roof[kind]){ p.slate = p.shingle = hx(F.roof[kind][0]); p.slateL = p.shingleL = hx(F.roof[kind][1]); }   /* INDEX F28 batch 2: the shell's own roof takes the kind's colour */
    let chim = null;   // where smoke leaves this facility, in canvas px (a building's chimney mouth, or the sprite's own smoke call)
    const put = (sp, x, y, flip) => { if (!sp) return; if (sp.chim && !chim) chim = {x: x + (flip ? -sp.chim.x : sp.chim.x), y: y + sp.chim.y}; g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.drawImage(sp.img, -sp.ax, -sp.ay); g.restore(); };
    const TR = V.K.trade && window.T29 && V.K.trade[kind];   /* INDEX T29: this kind has a trade shell of its own (flat hall, warehouse, open forge, lean-to, round hut) */
    const S = (k, vv, oo) => V.sprite(k === 'building' && TR ? 'tshell' : k, vv, se, k === 'building' ? Object.assign({foot: 1, fk: kind, k: kind}, V.K.facHouse || {}, oo)   /* INDEX F28: o.fk picks the roof colour */ : k === 'tent' ? Object.assign({foot: 1}, oo) : oo);   /* INDEX S26: the facilities' houses take the door and wall standard */   // the facilities' inner huts are sized in px already: no footprint factor
    const mud = hx(w ? '#2a2826' : '#2a2219'), mudD = hx('#16120e'), rope = hx('#4e4430'), cut = hx(w ? '#6a6456' : '#7a6a4c'), linen = hx('#9a927e');
    const tread = (x, y, rx, ry) => { ell(x, y, rx, ry, rgba(mud, 0.55)); for (let i = 0; i < 10; i++) ell(x + (r() - 0.5) * rx * 1.6, y + (r() - 0.5) * ry * 1.4, (1.5 + r() * 2.5) * R, (0.8 + r()) * R, rgba(i % 3 ? mudD : p.stoneL, 0.4)); };
    const post = (x, top, bot, pw) => { poly(g, [[x - pw, bot], [x - pw * 0.9, top], [x + pw * 0.9, top], [x + pw, bot]], rgb(p.bark)); poly(g, [[x + pw * 0.1 * L, bot], [x + pw * 0.1 * L, top], [x + pw * 0.9 * L, top], [x + pw * L, bot]], rgba(p.barkL, 0.5)); };
    const smoke = (x, y, n) => { chim = {x, y}; for (let i = 0; i < n; i++){ const t = i / n; ell(x + (r() - 0.5) * 6 * R + t * 10 * R * L, y - t * 26 * R, (3 + t * 7) * R, (2.5 + t * 4) * R, rgba(hx('#8a8680'), 0.22 * (1 - t))); } };
    const lantern = (x, y) => { line(x, y, x, y - 7 * R, rgb(p.iron), 1.1 * R); rect(x - 2 * R, y - 7 * R, 4 * R, 5.5 * R, rgb(p.iron)); rect(x - 1.3 * R, y - 6.2 * R, 2.6 * R, 3.8 * R, rgb(mix(p.ember, p.thatchL, 0.5))); ell(x, y - 4.5 * R, 6 * R, 5 * R, rgba(p.ember, 0.12)); };
    const trestle = (x, y, tw, dark) => { for (const dx of [-tw * 0.7, tw * 0.7]){ line(x + dx - 2 * R, y, x + dx + R, y - 10 * R, rgb(p.barkD), 1.4 * R); line(x + dx + 2 * R, y, x + dx - R, y - 10 * R, rgb(p.barkD), 1.4 * R); }
      poly(g, [[x - tw, y - 10 * R], [x + tw, y - 10.5 * R], [x + tw + R, y - 8 * R], [x - tw - R, y - 7.5 * R]], rgb(dark ? mix(p.timber, p.barkD, 0.4) : p.timber)); rect(x - tw, y - 10 * R, tw * 2, R, rgba(p.barkL, 0.4)); };
    const courses = (x0, y0, bw, bh, ch, cw, col) => { col = col || p.stone; rect(x0, y0, bw, bh, rgb(mix(col, p.stoneD, 0.5))); for (let yy = 0; yy < bh; yy += ch){ const off = (((yy / ch) | 0) & 1) * cw * 0.5, hh = Math.min(ch, bh - yy); for (let xx = -off; xx < bw; xx += cw){ const a = Math.max(0, xx), b = Math.min(bw, xx + cw); if (b - a > 2 * R) rect(x0 + a + 0.6 * R, y0 + yy + 0.6 * R, b - a - 1.2 * R, hh - 1.2 * R, rgb(mul(col, 0.84 + r() * 0.28))); } } };
    const slateRoof = (x0, y0, bw, rh, inset) => { poly(g, [[x0, y0], [x0 + bw, y0], [x0 + bw - inset, y0 - rh], [x0 + inset, y0 - rh]], rgb(p.slate)); poly(g, L > 0 ? [[x0 + bw / 2, y0], [x0 + bw, y0], [x0 + bw - inset, y0 - rh], [x0 + bw / 2, y0 - rh]] : [[x0, y0], [x0 + bw / 2, y0], [x0 + bw / 2, y0 - rh], [x0 + inset, y0 - rh]], rgba(p.slateL, 0.14));
      for (let j = 1; j < 6; j++){ const t = j / 6; line(x0 + inset * t, y0 - rh * t, x0 + bw - inset * t, y0 - rh * t, rgba(hx('#0c0a08'), 0.3), 0.8 * R); } for (let i = 1; i < 8; i++) line(x0 + inset + (bw - 2 * inset) * i / 8, y0 - rh, x0 + bw * i / 8, y0, rgba(p.slateL, 0.22), 0.7 * R);
      rect(x0 + inset, y0 - rh - R, bw - 2 * inset, 2.5 * R, rgb(mix(p.slate, p.slateL, 0.35))); if (w) poly(g, [[x0 + inset, y0 - rh], [x0 + bw - inset, y0 - rh], [x0 + bw - inset * 0.45, y0 - rh * 0.55], [x0 + inset * 0.45, y0 - rh * 0.55]], rgba(p.snow, 0.8)); };
    const plankDoor = (dx, dt, dw, dh, arch) => { const col = rgb(mul(p.timber, 0.58)); if (arch) poly(g, [[dx - dw / 2, dt + dh], [dx - dw / 2, dt + dw * 0.4], [dx, dt], [dx + dw / 2, dt + dw * 0.4], [dx + dw / 2, dt + dh]], col); else rect(dx - dw / 2, dt, dw, dh, col);
      for (let i = 1; i < 4; i++) rect(dx - dw / 2 + dw * i / 4, dt + (arch ? dw * 0.3 : 0), 0.8 * R, dh - (arch ? dw * 0.3 : 0), rgba(hx('#0c0a08'), 0.5)); for (const t of [0.3, 0.72]) rect(dx - dw / 2, dt + dh * t, dw, 2.4 * R, rgb(p.iron)); ell(dx + dw * 0.3, dt + dh * 0.52, 1.4 * R, 1.4 * R, rgb(p.iron)); };
    const archWindow = (wx, wy, ww, wh, i) => { const dk = F && light().elev < 0.5; if (dk) ell(wx, wy + wh * 0.5, ww * 1.8, wh * 0.9, rgba(p.window, 0.16)); poly(   /* INDEX F28 batch 2: lit at dusk */g, [[wx - ww / 2 - 1.5 * R, wy + wh], [wx - ww / 2 - 1.5 * R, wy + ww * 0.5], [wx, wy - 2 * R], [wx + ww / 2 + 1.5 * R, wy + ww * 0.5], [wx + ww / 2 + 1.5 * R, wy + wh]], rgb(p.stoneD)); poly(g, [[wx - ww / 2, wy + wh], [wx - ww / 2, wy + ww * 0.5], [wx, wy], [wx + ww / 2, wy + ww * 0.5], [wx + ww / 2, wy + wh]], dk ? rgb(p.window) : rgb(hx(i ? '#4a5a52' : '#5e4a3a'))); poly(g, [[wx - ww / 2, wy + wh], [wx - ww / 2, wy + ww * 0.5], [wx, wy], [wx, wy + wh]], dk ? rgba(mix(p.window, p.ember, 0.3), 0.4) : rgba(hx(i ? '#5e4a3a' : '#4a5a52'), 0.5));
      for (let k = 1; k < 4; k++) line(wx - ww / 2, wy + ww * 0.5 + (wh - ww * 0.5) * k / 4, wx + ww / 2, wy + ww * 0.5 + (wh - ww * 0.5) * k / 4, rgb(p.iron), 0.6 * R); line(wx, wy + 2 * R, wx, wy + wh, rgb(p.iron), 0.6 * R); ell(wx - ww * 0.2, wy + wh * 0.4, ww * 0.18, wh * 0.14, rgba(p.stoneL, 0.14)); };
    const brazier = (x, y) => { for (const dx of [-4, 0, 4]) line(x + dx * R, y, x + dx * 0.4 * R, y - 9 * R, rgb(p.iron), R); ell(x, y - 10 * R, 6 * R, 3 * R, rgb(p.iron)); ell(x, y - 11 * R, 4.5 * R, 1.8 * R, rgba(p.ember, 0.85)); ell(x - R, y - 11.5 * R, 1.8 * R, 0.8 * R, rgba(mix(p.ember, p.thatchL, 0.5), 0.9)); ell(x, y - 13 * R, 9 * R, 6 * R, rgba(p.ember, 0.12)); };
    const lookC = (c, k) => c ? mix(hx(c), p.timber, k === undefined ? 0.55 : k) : p.timber, tarC = c => c ? mix(hx(c), mix(p.slate, p.barkD, 0.5), 0.78) : mix(p.slate, p.barkD, 0.4);   // the look tables' paint colours, greyed into the palette
    const planks = (x0, y0, bw, bh, col, ph) => { ph = ph || 7 * R; rect(x0, y0, bw, bh, rgb(col)); for (let yy = ph; yy < bh; yy += ph) line(x0, y0 + yy, x0 + bw, y0 + yy, rgba(hx('#0c0a08'), 0.3), 0.8 * R); for (let i = 0; i < bh / ph; i++) rect(x0 + (r() * bw * 0.8), y0 + i * ph + R, (4 + r() * 10) * R, ph - 2 * R, rgba(p.barkL, 0.08 + r() * 0.08)); rect(x0, y0, bw, R, rgba(p.barkL, 0.35)); };
    const barrel = (x, y, bw, bh) => { poly(g, [[x - bw * 0.42, y], [x - bw * 0.5, y - bh * 0.5], [x - bw * 0.42, y - bh], [x + bw * 0.42, y - bh], [x + bw * 0.5, y - bh * 0.5], [x + bw * 0.42, y]], rgb(p.timber)); poly(g, L > 0 ? [[x + bw * 0.05, y], [x + bw * 0.05, y - bh], [x + bw * 0.42, y - bh], [x + bw * 0.5, y - bh * 0.5], [x + bw * 0.42, y]] : [[x - bw * 0.42, y], [x - bw * 0.5, y - bh * 0.5], [x - bw * 0.42, y - bh], [x - bw * 0.05, y - bh], [x - bw * 0.05, y]], rgba(p.barkL, 0.2)); for (const t of [0.2, 0.78]) rect(x - bw * 0.5, y - bh * t - R, bw, 2 * R, rgb(p.iron)); for (const dx of [-0.22, 0.1, 0.3]) line(x + dx * bw, y - bh + R, x + dx * bw, y - R, rgba(hx('#0c0a08'), 0.35), 0.7 * R); };
    const glyph = (x, y, gk, sz) => { const col = rgb(hx('#2a2420')), lw = 1.3 * R, s2 = sz / 2; g.save(); g.translate(x, y);
      if (gk === 'mug'){ rect(-s2 * 0.6, -s2 * 0.7, s2 * 1.1, s2 * 1.5, col); line(s2 * 0.5, -s2 * 0.3, s2 * 0.95, s2 * 0.3, col, lw); }
      else if (gk === 'flag'){ line(-s2 * 0.6, -s2, -s2 * 0.6, s2, col, lw); poly(g, [[-s2 * 0.6, -s2], [s2 * 0.7, -s2 * 0.5], [-s2 * 0.6, 0]], col); }
      else if (gk === 'shield'){ poly(g, [[-s2 * 0.7, -s2 * 0.8], [s2 * 0.7, -s2 * 0.8], [s2 * 0.6, s2 * 0.2], [0, s2], [-s2 * 0.6, s2 * 0.2]], col); }
      else if (gk === 'coin'){ ell(0, 0, s2 * 0.75, s2 * 0.75, col); ell(0, 0, s2 * 0.4, s2 * 0.4, rgba(p.timber, 0.9)); }
      else if (gk === 'bars'){ for (const dx of [-0.6, -0.2, 0.2, 0.6]) line(dx * s2, -s2 * 0.8, dx * s2, s2 * 0.8, col, lw); line(-s2 * 0.75, 0, s2 * 0.75, 0, col, lw); }
      else if (gk === 'horse'){ poly(g, [[-s2 * 0.8, s2 * 0.6], [-s2 * 0.8, -s2 * 0.2], [-s2 * 0.2, -s2 * 0.3], [s2 * 0.2, -s2 * 0.9], [s2 * 0.7, -s2 * 0.6], [s2 * 0.5, -s2 * 0.1], [s2 * 0.5, s2 * 0.6], [s2 * 0.2, s2 * 0.6], [s2 * 0.2, s2 * 0.1], [-s2 * 0.4, s2 * 0.1], [-s2 * 0.4, s2 * 0.6]], col); }
      else if (gk === 'bow'){ g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(-s2 * 0.5, 0, s2 * 0.95, -1.1, 1.1); g.stroke(); line(-s2 * 0.1, -s2 * 0.85, -s2 * 0.1, s2 * 0.85, col, lw * 0.7); line(-s2 * 0.8, 0, s2 * 0.9, 0, col, lw * 0.7); }
      else if (gk === 'anvil'){ poly(g, [[-s2 * 0.9, -s2 * 0.4], [s2 * 0.9, -s2 * 0.4], [s2 * 0.5, 0], [s2 * 0.3, s2 * 0.5], [-s2 * 0.3, s2 * 0.5], [-s2 * 0.5, 0], [-s2 * 0.9, -s2 * 0.1]], col); }
      else if (gk === 'saw'){ poly(g, [[-s2 * 0.9, -s2 * 0.3], [s2 * 0.9, -s2 * 0.3], [s2 * 0.9, s2 * 0.3], [-s2 * 0.4, s2 * 0.6]], col); for (let i = 0; i < 5; i++) poly(g, [[-s2 * 0.3 + i * s2 * 0.25, s2 * 0.3], [-s2 * 0.2 + i * s2 * 0.25, s2 * 0.55], [-s2 * 0.1 + i * s2 * 0.25, s2 * 0.3]], col); }
      else if (gk === 'hide'){ poly(g, [[-s2 * 0.8, -s2 * 0.5], [-s2 * 0.3, -s2 * 0.9], [s2 * 0.3, -s2 * 0.9], [s2 * 0.8, -s2 * 0.5], [s2 * 0.6, s2 * 0.6], [s2 * 0.2, s2 * 0.9], [-s2 * 0.2, s2 * 0.9], [-s2 * 0.6, s2 * 0.6]], col); }
      else if (gk === 'potion'){ rect(-s2 * 0.2, -s2 * 0.9, s2 * 0.4, s2 * 0.4, col); ell(0, s2 * 0.3, s2 * 0.6, s2 * 0.6, col); }
      else if (gk === 'star'){ const pts = []; for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s2 * 0.38 : s2 * 0.9; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } poly(g, pts, col); }
      else if (gk === 'stake'){ poly(g, [[-s2 * 0.25, -s2 * 0.9], [s2 * 0.25, -s2 * 0.9], [0, s2 * 0.9]], col); line(-s2 * 0.6, -s2 * 0.4, s2 * 0.6, -s2 * 0.4, col, lw); }
      else if (gk === 'cross'){ rect(-s2 * 0.25, -s2 * 0.9, s2 * 0.5, s2 * 1.8, col); rect(-s2 * 0.9, -s2 * 0.25, s2 * 1.8, s2 * 0.5, col); }
      else if (gk === 'gear'){ for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; line(0, 0, Math.cos(a) * s2 * 0.9, Math.sin(a) * s2 * 0.9, col, lw * 1.6); } ell(0, 0, s2 * 0.55, s2 * 0.55, col); ell(0, 0, s2 * 0.2, s2 * 0.2, rgba(p.timber, 0.9)); }
      else if (gk === 'boot'){ poly(g, [[-s2 * 0.5, -s2 * 0.9], [s2 * 0.1, -s2 * 0.9], [s2 * 0.1, s2 * 0.2], [s2 * 0.9, s2 * 0.6], [s2 * 0.9, s2 * 0.9], [-s2 * 0.5, s2 * 0.9]], col); }
      g.restore(); };
    const sign = (x, y, gk, hang) => { if (!gk) return; if (hang){ line(x - 9 * R, y - 12 * R, x + 2 * R, y - 12 * R, rgb(p.iron), 1.1 * R); line(x - 3 * R, y - 12 * R, x - 3 * R, y - 9 * R, rgb(p.iron), 0.8 * R); line(x + 3 * R, y - 12 * R, x + 3 * R, y - 9 * R, rgb(p.iron), 0.8 * R); } else post(x, y - 30 * R, y, 1.6 * R);
      const t = hang ? y - 9 * R : y - 30 * R; rect(x - 8 * R, t, 16 * R, 12 * R, rgb(mix(p.timber, p.barkL, 0.2))); rect(x - 8 * R, t, 16 * R, R, rgba(p.barkL, 0.35)); line(x - 8 * R, t + 6 * R, x + 8 * R, t + 6 * R, rgba(hx('#0c0a08'), 0.3), 0.6 * R); glyph(x, t + 6 * R, gk, 8 * R); };
    const ratlines = (xa, ya, xb, yb, xc, yc, n) => { line(xa, ya, xc, yc, rgb(rope), R); line(xb, yb, xc, yc, rgb(rope), R); for (let i = 1; i < n; i++){ const t = i / n; line(xa + (xc - xa) * t, ya + (yc - ya) * t, xb + (xc - xb) * t, yb + (yc - yb) * t, rgba(rope, 0.85), 0.7 * R); } };
    const coil = (x, y) => { ell(x, y, 7 * R, 3.5 * R, rgb(rope)); ell(x, y, 5 * R, 2.4 * R, rgba(hx('#0c0a08'), 0.35)); ell(x, y, 2.5 * R, 1.2 * R, rgb(rope)); };
    const cleat = (x, y) => { rect(x - 4 * R, y - 2 * R, 8 * R, 2 * R, rgb(p.iron)); line(x - 6 * R, y - 3 * R, x + 6 * R, y - 3 * R, rgb(p.iron), 1.4 * R); };
    const deckhouse = (bw, bh, roofC, gk, lit2) => { const x0 = cx - bw / 2, y0 = by - 4 * R - bh; planks(x0, y0, bw, bh, mix(p.timber, p.barkL, 0.12)); post(x0 + 2 * R, y0, by - 4 * R, 1.8 * R); post(x0 + bw - 2 * R, y0, by - 4 * R, 1.8 * R);
      const rc = roofC || mix(p.slate, p.barkD, 0.4); poly(g, [[x0 - 5 * R, y0], [x0 + bw + 5 * R, y0], [x0 + bw + 3 * R, y0 - 9 * R], [x0 - 3 * R, y0 - 9 * R]], rgb(rc)); rect(x0 - 3 * R, y0 - 10 * R, bw + 6 * R, 2.5 * R, rgb(mix(rc, p.slateL, 0.3))); line(x0 - 5 * R, y0, x0 + bw + 5 * R, y0, rgba(hx('#0c0a08'), 0.4), R); if (w) rect(x0 - 3 * R, y0 - 11 * R, bw + 6 * R, 3 * R, rgba(p.snow, 0.85));
      const dx = cx + bw * 0.22; plankDoor(dx, by - 4 * R - 40 * R, 18 * R, 40 * R, false); const px = cx - bw * 0.22, py = y0 + bh * 0.4; ell(px, py, 8 * R, 8 * R, rgb(p.iron)); ell(px, py, 6 * R, 6 * R, rgb(lit2 ? hx('#6a5230') : hx('#343c3e'))); ell(px - 2 * R, py - 2 * R, 2 * R, 1.5 * R, rgba(p.stoneL, 0.3)); for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + 0.6; ell(px + Math.cos(a) * 7 * R, py + Math.sin(a) * 7 * R, 0.9 * R, 0.9 * R, rgb(p.stoneD)); }
      if (lit2) ell(px, py, 12 * R, 9 * R, rgba(p.ember, 0.05)); sign(x0 + bw - 14 * R, y0 + 20 * R, gk, true); lantern(dx - 14 * R, by - 4 * R - 44 * R); cleat(x0 - 2 * R, by - 4 * R); coil(x0 + bw + 10 * R, by - 2 * R); return {x0, y0}; };
    if ((kind === 'tents' || kind === 'huts') && o.deck && window.ART37) ART37.paintHammocks({g, rect, ell, line, poly, post, p, L, R, cx, by, W, H, mix, mul, rgb, rgba, hx, r, smoke, planks, courses, w});
    else if (kind === 'tents'){
      // the quarters as tents: three canvas tents round a trodden patch, a washing line with shirts hung out, packs stacked by a flap, boots in the mud
      tread(cx, by - 8 * R, W * 0.45, 12 * R);
      put(S('tent', 0, {w: 1}), cx - W * 0.3, by - 26 * R); put(S('tent', 2, {w: 1}), cx + W * 0.32, by - 22 * R, true); put(S('tent', 1, {w: 2}), cx + 4 * R, by - 2 * R);
      { const x0 = cx - W * 0.46, x1 = cx - W * 0.12, yl = by - 34 * R; post(x0, yl - 4 * R, by - 6 * R, 1.3 * R); post(x1, yl - 2 * R, by - 4 * R, 1.3 * R);
        g.strokeStyle = rgb(rope); g.lineWidth = 0.8 * R; g.beginPath(); g.moveTo(x0, yl - 3 * R); g.quadraticCurveTo((x0 + x1) / 2, yl + R, x1, yl - 1.5 * R); g.stroke();
        for (let i = 0; i < 3; i++){ const t = 0.2 + i * 0.3, x = x0 + (x1 - x0) * t, y = yl - 2 * R + 3 * R * Math.sin(t * Math.PI); poly(g, [[x - 3 * R, y], [x + 3 * R, y], [x + 2.5 * R, y + (7 + i) * R], [x - 3.5 * R, y + (6 + i) * R]], rgb(i === 1 ? mix(linen, p.canvasD, 0.4) : mix(linen, p.plasterD, 0.3))); line(x - 2 * R, y + 2 * R, x + 2 * R, y + 2.5 * R, rgba(mudD, 0.25), 0.6 * R); } }
      put(S('decor', 1, {k: 'sacks'}), cx + W * 0.12, by - R);
      for (let i = 0; i < 2; i++){ const x = cx - W * 0.2 + i * 5 * R, y = by - 2 * R; poly(g, [[x - 2 * R, y], [x + 2.5 * R, y], [x + 2 * R, y - 6 * R], [x - 1.5 * R, y - 6 * R]], rgb(p.barkD)); poly(g, [[x - 2 * R, y], [x + 2.5 * R, y], [x + 2.5 * R, y - 1.5 * R], [x - 2 * R, y - 1.5 * R]], rgb(mudD)); }
      { const x = cx + W * 0.42, y = by + R; ell(x, y, 3 * R, 1.3 * R, rgb(p.barkD)); rect(x - 2.6 * R, y - 5 * R, 5.2 * R, 5 * R, rgb(p.bark)); line(x - 2.6 * R, y - 2.5 * R, x + 2.6 * R, y - 2.5 * R, rgb(p.iron), 0.8 * R); ell(x, y - 5 * R, 2.6 * R, 1 * R, rgb(hx('#3a4a4c'))); }   // a bucket
    } else if (kind === 'huts'){
      // the quarters as huts: two one-cell timber huts, a wood pile under a lean-to between them, a water butt, an axe in its block
      tread(cx, by - 6 * R, W * 0.4, 10 * R);
      put(S('building', 0, {w: 1, d: 1, roof: 48}), cx - W * 0.27, by - 4 * R); put(S('building', 2, {w: 1, d: 1, roof: 48}), cx + W * 0.28, by - 2 * R);
      { const px = cx, pb = by - 4 * R; post(px - 15 * R, pb - 22 * R, pb, 1.2 * R); post(px + 13 * R, pb - 20 * R, pb, 1.2 * R); poly(g, [[px - 17 * R, pb - 22 * R], [px + 15 * R, pb - 20 * R], [px + 15 * R, pb - 18 * R], [px - 17 * R, pb - 20 * R]], rgb(p.barkD));
        for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++){ const x = px - 11 * R + (i + row * 0.5) * 4.2 * R, y = pb - row * 3.6 * R; ell(x, y, 2.1 * R, 1.9 * R, rgb(mix(p.bark, p.barkD, r() * 0.5))); ell(x, y, 1.2 * R, 1.1 * R, rgb(mix(cut, p.bark, 0.3))); } }
      put(S('decor', 0, {k: 'barrel'}), cx + W * 0.1, by + R);
      { const x = cx - W * 0.1, y = by; ell(x, y, 3.5 * R, 1.6 * R, rgb(p.barkD)); rect(x - 3.5 * R, y - 5 * R, 7 * R, 5 * R, rgb(p.bark)); ell(x, y - 5 * R, 3.5 * R, 1.6 * R, rgb(cut)); line(x, y - 6 * R, x + 5 * R, y - 14 * R, rgb(p.bark), 1.2 * R); poly(g, [[x - 2.5 * R, y - 8 * R], [x + 1.5 * R, y - 6.5 * R], [x + R, y - 4.5 * R], [x - 3 * R, y - 5.5 * R]], rgb(p.iron)); }
    } else if (kind === 'bunks'){
      // the quarters as a bunkhouse: one long building, the muster bell on a post by the door, a split-log bench, boots drying on the step
      tread(cx, by - 6 * R, W * 0.42, 9 * R);
      put(S('building', 1, {w: 2, d: 1, roof: 48}), cx + 2 * R, by - 4 * R);
      { const x = cx - W * 0.43, top = by - 54 * R; post(x, top, by, 1.6 * R); line(x - 4 * R, top + R, x + 4 * R, top + R, rgb(p.bark), 2 * R); poly(g, [[x - 2.4 * R, top + 2 * R], [x + 2.4 * R, top + 2 * R], [x + 3.2 * R, top + 8 * R], [x - 3.2 * R, top + 8 * R]], rgb(mix(p.iron, p.thatch, 0.25))); poly(g, [[x - 2.4 * R, top + 2 * R], [x - 0.5 * R, top + 2 * R], [x - 0.8 * R, top + 8 * R], [x - 3.2 * R, top + 8 * R]], rgba(p.stoneL, 0.2)); rect(x - 3.2 * R, top + 7 * R, 6.4 * R, 1.2 * R, rgba(p.barkD, 0.8)); ell(x, top + 9 * R, 0.9 * R, 0.9 * R, rgb(p.iron)); }
      put(S('decor', 0, {k: 'benchlog'}), cx + W * 0.2, by + 2 * R);
      for (let i = 0; i < 4; i++){ const x = cx - W * 0.2 + i * 6 * R, y = by - R; poly(g, [[x - 2 * R, y], [x + 2.5 * R, y], [x + 2 * R, y - 6 * R], [x - 1.5 * R, y - 6 * R]], rgb(p.barkD)); poly(g, [[x - 2 * R, y], [x + 2.5 * R, y], [x + 2.5 * R, y - 1.5 * R], [x - 2 * R, y - 1.5 * R]], rgb(mudD)); }
    } else if (kind === 'kitchen'){
      // the kitchen: a two-cell house with a stone chimney smoking, a cauldron on an iron tripod over embers out front, a chopping block with a cleaver, hams under the eave, a barrel and a sack of roots
      tread(cx, by - 6 * R, W * 0.42, 10 * R);
      const bsp = S('building', 2, {w: 2, d: 1, roof: 48}); put(bsp, cx + 10 * R, by - 6 * R);
      { const x = cx + 10 * R + bsp.img.width * 0.2, top = by - 6 * R - bsp.img.height + 6 * R, bot = top + 24 * R; rect(x - 4 * R, top, 8 * R, bot - top, rgb(p.stone)); rect(x - 4 * R + (L > 0 ? 5 * R : 0), top, 3 * R, bot - top, rgba(p.stoneD, 0.6)); for (let i = 0; i < 5; i++) line(x - 4 * R, top + 2 * R + i * 4.5 * R, x + 4 * R, top + 2 * R + i * 4.5 * R, rgba(p.stoneD, 0.5), 0.6 * R); rect(x - 5 * R, top - 1.5 * R, 10 * R, 2 * R, rgb(p.stoneD)); smoke(x, top - 2 * R, window.ART37 ? 9 : 6); if (window.ART37) ART37.paintKitchen({g, rect, ell, line, poly, post, p, L, R, cx, by, W, mix, mul, rgb, rgba, hx, r, x, top, hams: 1}); }
      { const x = cx - W * 0.3, y = by - 2 * R; ell(x, y, 9 * R, 3 * R, rgba(mudD, 0.6)); for (let i = 0; i < 5; i++) ell(x + (r() - 0.5) * 12 * R, y - r() * 2 * R, 2 * R, 1.3 * R, rgb(mix(p.stone, p.stoneD, r()))); for (let i = 0; i < 3; i++) line(x - 6 * R + i * 5 * R, y - R, x - 2 * R + i * 4 * R, y - 3 * R, rgb(p.barkD), 1.6 * R); ell(x, y - 2.5 * R, 4 * R, 1.6 * R, rgba(p.ember, 0.8)); ell(x, y - 2.5 * R, 2 * R, 0.9 * R, rgba(mix(p.ember, p.thatchL, 0.5), 0.9));
        for (const dx of [-7, 0, 7]) line(x + dx * R, y - 2 * R, x, y - 24 * R, rgb(p.iron), 1.3 * R);
        line(x, y - 24 * R, x, y - 18 * R, rgb(p.iron), 1.1 * R); ell(x, y - 11 * R, 7 * R, 5.5 * R, rgb(p.iron)); ell(x, y - 15 * R, 7 * R, 2.2 * R, rgb(mix(p.iron, p.stoneL, 0.3))); ell(x, y - 15 * R, 5.5 * R, 1.5 * R, rgb(hx('#2a2a24'))); ell(x - 2 * R * L, y - 12 * R, 3 * R, 2.5 * R, rgba(p.stoneL, 0.12)); smoke(x, y - 17 * R, 3); }
      { const x = cx + W * 0.4, y = by - R; ell(x, y, 5 * R, 2.2 * R, rgb(p.barkD)); rect(x - 5 * R, y - 9 * R, 10 * R, 9 * R, rgb(p.bark)); rect(x - 5 * R + (L > 0 ? 0 : 6 * R), y - 9 * R, 4 * R, 9 * R, rgba(p.barkL, 0.25)); ell(x, y - 9 * R, 5 * R, 2.2 * R, rgb(cut)); for (let i = 0; i < 3; i++) line(x - 3 * R + r() * 6 * R, y - 10 * R, x - 3 * R + r() * 6 * R, y - 8.5 * R, rgba(p.barkD, 0.7), 0.6 * R); line(x + R, y - 9 * R, x + 4 * R, y - 17 * R, rgb(p.bark), 1.2 * R); poly(g, [[x - 2 * R, y - 11.5 * R], [x + 3 * R, y - 10 * R], [x + 2 * R, y - 7.5 * R], [x - 3 * R, y - 8.5 * R]], rgb(mix(p.iron, p.stoneL, 0.3))); }
      if (!window.ART37) { const ex = cx + 10 * R - bsp.img.width * 0.2, ey = by - 6 * R - V.K.wallH * R - 2 * R; for (let i = 0; i < 3; i++){ const x = ex + i * 7 * R; line(x, ey, x, ey + 5 * R, rgb(rope), 0.8 * R); ell(x, ey + 10 * R, 2.6 * R, 5 * R, rgb(hx('#4a2e22'))); ell(x - 0.8 * R * L, ey + 9 * R, 1.2 * R, 3 * R, rgba(hx('#7a5040'), 0.5)); } }
      put(S('decor', 1, {k: 'barrel'}), cx + W * 0.2, by + R); put(S('decor', 0, {k: 'sacks'}), cx - W * 0.05, by + 3 * R);
    } else if (kind === 'tavern'){
      // the tavern: a three-cell house, a sign on an iron bracket off the corner (a painted tankard swinging on two chains), a dim lantern by the door, barrels, a bench with a tankard left on it
      tread(cx, by - 5 * R, W * 0.44, 9 * R);
      const T37 = !!window.ART37, bsp = S('building', 0, T37 ? {w: 2, d: 1, roof: 46, wall: 1.65, upper: 1} : {w: 2, d: 1, roof: 48}); put(bsp, cx, by - 4 * R);
      { const x = cx - bsp.ax + (window.BLDG48 !== false ? V.K.overhang + 1 : 8) * R   /* INDEX F48: the bracket starts on the wall corner, not out under the eave */, y = by - 4 * R - V.K.wallH * R * 0.92; line(x, y, x - 16 * R, y, rgb(p.iron), 1.4 * R); line(x, y + 6 * R, x - 10 * R, y, rgb(p.iron), 1.1 * R); ell(x - 16 * R, y, 1.2 * R, 1.2 * R, rgb(p.iron));
        const sx = x - 10 * R, sy = y + 4 * R; line(sx - 5 * R, y, sx - 5 * R, sy, rgb(p.iron), 0.7 * R); line(sx + 5 * R, y, sx + 5 * R, sy, rgb(p.iron), 0.7 * R);
        g.save(); g.translate(sx, sy); g.rotate(0.05); poly(g, [[-7 * R, 0], [7 * R, 0], [7 * R, 10 * R], [-7 * R, 10 * R]], rgb(mix(p.timber, p.barkD, 0.3)), rgb(p.barkD), 0.8 * R); rect(-3 * R, 2.5 * R, 5 * R, 5.5 * R, rgb(mix(p.thatchL, p.plaster, 0.5))); rect(-3 * R, 2.5 * R, 5 * R, 1.2 * R, rgb(p.plaster)); line(2.5 * R, 4 * R, 4 * R, 6.5 * R, rgb(mix(p.thatchL, p.plaster, 0.5)), 1.2 * R); g.restore(); }
      lantern(cx + bsp.img.width * 0.12, by - 4 * R - V.K.wallH * R * 0.7);
      put(S('decor', 0, {k: 'barrel'}), cx + W * 0.36, by); put(S('decor', 2, {k: 'barrel'}), cx + W * 0.44, by - 3 * R); put(S('decor', 1, {k: 'benchlog'}), cx - W * 0.3, by + R);
      { const x = cx - W * 0.3 + 3 * R, y = by - 5 * R; rect(x - 1.5 * R, y - 3.5 * R, 3 * R, 3.5 * R, rgb(mix(p.iron, p.stoneL, 0.4))); ell(x, y - 3.5 * R, 1.5 * R, 0.6 * R, rgb(p.plaster)); }
    } else if (kind === 'command'){
      // the command tent: the big tent, the company banner, a map table out front with a parchment weighed down by stones, a brazier on iron legs
      tread(cx, by - 6 * R, W * 0.42, 10 * R);
      put(S('tent', 1, {w: 3}), cx + 6 * R, by - 3 * R);
      put(S('mprop', 0, {k: 'banner', flag: 'war'}), cx - W * 0.4, by - 2 * R);
      { const x = cx + W * 0.3, y = by - R, tw = 16 * R; trestle(x, y, tw, false);
        poly(g, [[x - tw * 0.8, y - 10.3 * R], [x + tw * 0.5, y - 10.6 * R], [x + tw * 0.55, y - 9 * R], [x - tw * 0.75, y - 8.8 * R]], rgb(mix(p.plaster, p.thatchL, 0.3))); for (let i = 0; i < 4; i++) line(x - tw * 0.6 + i * 5 * R, y - 10 * R, x - tw * 0.4 + i * 5 * R, y - 9.3 * R, rgba(p.barkD, 0.5), 0.5 * R); ell(x - tw * 0.7, y - 10.3 * R, 1.3 * R, 1 * R, rgb(p.stone)); ell(x + tw * 0.45, y - 10.5 * R, 1.3 * R, 1 * R, rgb(p.stoneD)); }
      { const x = cx - W * 0.12, y = by + 2 * R; for (const dx of [-3, 0, 3]) line(x + dx * R, y, x, y - 7 * R, rgb(p.iron), 1.1 * R); ell(x, y - 8 * R, 4 * R, 2 * R, rgb(p.iron)); ell(x, y - 8.5 * R, 2.6 * R, 1.1 * R, rgba(p.ember, 0.85)); ell(x, y - 8.5 * R, 1.3 * R, 0.6 * R, rgba(mix(p.ember, p.thatchL, 0.5), 0.9)); smoke(x, y - 10 * R, 3); }
    } else if (kind === 'merchant'){
      // the merchant stalls: two awning stalls on poles, faded stripes, boards on trestles with bolts of cloth, a basket of roots and jars, a cloth over the front, crates and sacks, a hanging balance
      tread(cx, by - 5 * R, W * 0.46, 9 * R);
      const stall = (x, y, sw, vv) => { const ph = 30 * R, top = y - ph;
        post(x - sw, top - 2 * R, y, 1.3 * R); post(x + sw, top - R, y, 1.3 * R);
        g.fillStyle = rgb(vv ? p.canvasD : mix(p.canvasD, p.canvas, 0.4)); g.beginPath(); g.moveTo(x - sw - 3 * R, top - 2 * R); g.lineTo(x + sw + 3 * R, top - R); g.lineTo(x + sw + 5 * R, top + 9 * R); g.quadraticCurveTo(x, top + 13 * R, x - sw - 5 * R, top + 8 * R); g.closePath(); g.fill();
        for (let i = 0; i < 5; i++){ const t = (i + 0.5) / 5, xx = x - sw - 3 * R + (sw * 2 + 6 * R) * t; line(xx, top - 2 * R + t * R, xx + R, top + 8 * R + 4 * R * Math.sin(t * Math.PI), rgba(i % 2 ? p.plasterD : p.canvas, 0.25), 3 * R); }
        for (let i = 0; i < 6; i++){ const t = (i + 0.5) / 6, xx = x - sw - 5 * R + (sw * 2 + 10 * R) * t, yy = top + 8 * R + 4 * R * Math.sin(t * Math.PI); poly(g, [[xx - 1.8 * R, yy], [xx + 1.8 * R, yy], [xx, yy + 4 * R]], rgb(p.canvasD)); }
        const ct = y - 11 * R; poly(g, [[x - sw - 2 * R, ct], [x + sw + 2 * R, ct - 0.5 * R], [x + sw + 2 * R, ct + 2.5 * R], [x - sw - 2 * R, ct + 3 * R]], rgb(p.timber)); rect(x - sw - 2 * R, ct, sw * 2 + 4 * R, 0.8 * R, rgba(p.barkL, 0.4));
        for (const dx of [-sw * 0.8, sw * 0.8]){ line(x + dx - 2 * R, y, x + dx, ct + 3 * R, rgb(p.barkD), 1.3 * R); line(x + dx + 2 * R, y, x + dx, ct + 3 * R, rgb(p.barkD), 1.3 * R); }
        poly(g, [[x - sw - R, ct + 3 * R], [x + sw + R, ct + 2.5 * R], [x + sw + R, y - 3 * R], [x - sw - R, y - 2 * R]], rgba(mix(p.canvasD, p.barkD, 0.5), 0.9));
        const cols = [mix(p.canvas, p.moss, 0.5), mix(p.plasterD, p.thatch, 0.4), mix(p.slate, p.plaster, 0.4)]; for (let i = 0; i < 3; i++){ const xx = x - sw * 0.7 + i * 5 * R; rect(xx - 2 * R, ct - 5 * R + i * 0.5 * R, 4 * R, 5 * R, rgb(cols[i])); ell(xx, ct - 5 * R + i * 0.5 * R, 2 * R, 0.8 * R, rgba(p.plaster, 0.3)); }
        { const xx = x + sw * 0.35; ell(xx, ct - 1.5 * R, 4 * R, 2 * R, rgb(mix(p.thatch, p.barkD, 0.3))); ell(xx, ct - 3 * R, 3.5 * R, 1.5 * R, rgb(mix(p.thatchL, p.bark, 0.4))); for (let i = 0; i < 4; i++) ell(xx - 2.5 * R + i * 1.6 * R, ct - 3.5 * R, 0.9 * R, 0.9 * R, rgb(mix(p.moss, p.thatchL, 0.4))); }
        for (let i = 0; i < 2; i++){ const xx = x + sw * 0.8 + i * 3 * R; rect(xx - 1.2 * R, ct - 4 * R, 2.4 * R, 4 * R, rgb(mix(p.stone, p.thatch, 0.4))); ell(xx, ct - 4 * R, 1.2 * R, 0.5 * R, rgb(p.barkD)); } };
      stall(cx - W * 0.24, by - 6 * R, 24 * R, 0); stall(cx + W * 0.26, by - 2 * R, 22 * R, 1);
      put(S('decor', 1, {k: 'crate'}), cx - W * 0.02, by); put(S('decor', 0, {k: 'sacks'}), cx + W * 0.44, by + 2 * R);
      { const x = cx + W * 0.26 + 14 * R, y = by - 2 * R - 30 * R; line(x, y, x, y + 6 * R, rgb(p.iron), 0.7 * R); line(x - 5 * R, y + 6 * R, x + 5 * R, y + 6 * R, rgb(p.iron), R); for (const dx of [-5, 5]){ line(x + dx * R, y + 6 * R, x + dx * R, y + 11 * R, rgb(p.iron), 0.5 * R); ell(x + dx * R, y + 11.5 * R, 2 * R, 0.8 * R, rgb(mix(p.iron, p.stoneL, 0.4))); } }
    } else if (kind === 'house'){
      // the Leader's house: a two-cell house with a lantern by the door, the company shield on the wall, a rain barrel at the corner, a mat at the step
      tread(cx, by - 5 * R, W * 0.4, 9 * R);
      const bsp = S('building', 3, {w: 2, d: 1, roof: 48}); put(bsp, cx, by - 4 * R);
      lantern(cx - bsp.ax + 14 * R, by - 4 * R - V.K.wallH * R * 0.7);
      { const x = cx + bsp.img.width * 0.22, y = by - 4 * R - V.K.wallH * R * 0.62; poly(g, [[x - 5 * R, y - 6 * R], [x + 5 * R, y - 6 * R], [x + 5 * R, y], [x, y + 6 * R], [x - 5 * R, y]], rgb(mix(p.timber, p.barkD, 0.4)), rgb(p.iron), 0.9 * R); poly(g, [[x - 5 * R, y - 6 * R], [x, y - 6 * R], [x, y + 6 * R], [x - 5 * R, y]], rgba(p.plasterD, 0.5)); line(x - 3.5 * R, y - 2 * R, x + 3.5 * R, y - 2 * R, rgba(p.iron, 0.9), 1.1 * R); }
      put(S('decor', 2, {k: 'barrel'}), cx + bsp.img.width * 0.5 - 8 * R, by - 2 * R);
      poly(g, [[cx - 6 * R, by - 3 * R], [cx + 6 * R, by - 3 * R], [cx + 7 * R, by], [cx - 7 * R, by]], rgb(mix(p.thatch, p.barkD, 0.5)));
    } else if (kind === 'cells'){
      // the holding cells: a squat stone block under a flagged roof, three barred slits, a strapped door with a grille, an iron cage out front, a post hung with manacles, the gaoler's stool and bucket
      tread(cx, by - 5 * R, W * 0.42, 9 * R);
      { const bw = W * 0.7, bh = 96 * R, x0 = cx - bw * 0.3, y0 = by - 4 * R - bh;
        rect(x0, y0, bw, bh, rgb(p.stone));
        for (let yy = 0; yy < bh; yy += 7 * R){ const off = (((yy / (7 * R)) | 0) & 1) * 9 * R; for (let xx = -off; xx < bw; xx += 18 * R){ const a = Math.max(0, xx), b = Math.min(bw, xx + 18 * R); rect(x0 + a + 0.6 * R, y0 + yy + 0.6 * R, b - a - 1.2 * R, 5.8 * R, rgb(mul(p.stone, 0.84 + r() * 0.28))); } }
        rect(x0 + (L > 0 ? 0 : bw - 6 * R), y0, 6 * R, bh, rgba(p.stoneD, 0.45)); rect(x0, y0 + bh - 6 * R, bw, 6 * R, rgba(mudD, 0.35));
        poly(g, [[x0 - 3 * R, y0], [x0 + bw + 3 * R, y0], [x0 + bw - 8 * R, y0 - 11 * R], [x0 + 8 * R, y0 - 11 * R]], rgb(mix(p.stone, p.stoneD, 0.55))); for (let i = 0; i < 5; i++) line(x0 + 8 * R + (bw - 16 * R) * i / 5, y0 - 11 * R, x0 - 3 * R + (bw + 6 * R) * i / 5, y0, rgba(p.stoneD, 0.5), 0.8 * R); rect(x0 - 3 * R, y0 - 2 * R, bw + 6 * R, 3.5 * R, rgb(p.stoneD)); rect(x0 - 3 * R, y0 - 2 * R, bw + 6 * R, R, rgba(p.stoneL, 0.5));
        for (let i = 0; i < 3; i++){ const sx = x0 + bw * (0.16 + i * 0.3), sy = y0 + 16 * R; if (Math.abs(sx - (x0 + bw * 0.62)) < 14 * R) continue; rect(sx - 5 * R, sy, 10 * R, 16 * R, rgb(hx('#100e0c'))); for (let b = 0; b < 3; b++) line(sx - 3.2 * R + b * 3.2 * R, sy, sx - 3.2 * R + b * 3.2 * R, sy + 16 * R, rgb(p.iron), R); rect(sx - 6 * R, sy + 16 * R, 12 * R, 1.5 * R, rgba(p.stoneL, 0.4)); }
        const C37 = !!window.ART37, dx = x0 + bw * 0.62, dw = (C37 ? 27 : 30) * R, dh = (C37 ? 60 : 84) * R, dt = by - 4 * R - dh; rect(dx - dw / 2 - 2 * R, dt - 2 * R, dw + 4 * R, dh + 2 * R, rgb(p.stoneD)); rect(dx - dw / 2, dt, dw, dh, rgb(mul(p.timber, 0.58))); for (let i = 1; i < 4; i++) rect(dx - dw / 2 + dw * i / 4, dt, 0.8 * R, dh, rgba(hx('#0c0a08'), 0.5)); for (const t of [0.22, 0.52, 0.82]) rect(dx - dw / 2, dt + dh * t, dw, 2.4 * R, rgb(p.iron)); rect(dx - 5 * R, dt + dh * 0.3, 10 * R, 8 * R, rgb(hx('#100e0c'))); for (let b = 0; b < 3; b++) line(dx - 3 * R + b * 3 * R, dt + dh * 0.3, dx - 3 * R + b * 3 * R, dt + dh * 0.3 + 8 * R, rgb(p.iron), 0.8 * R); rect(dx + dw / 2 - 7 * R, dt + dh * 0.62, 4 * R, 4 * R, rgb(p.iron));
      }
      put(S('mprop', 1, {k: 'cage'}), cx - W * 0.42, by - 2 * R);
      if (window.ART37) ART37.paintCells({g, rect, ell, line, poly, post, p, L, R, cx, by, W, bw: W * 0.7, mix, mul, rgb, rgba, hx});
      { const x = cx + W * 0.44, top = by - 50 * R; post(x, top, by, 1.6 * R); for (let i = 0; i < 2; i++){ const cxx = x + (i ? 5 : -5) * R, len = (18 + i * 6) * R; for (let k = 0; k < 7; k++) ell(cxx + Math.sin(k * 1.3) * 0.8 * R, top + 4 * R + k * len / 7, 1.3 * R, 1.1 * R, rgb(mix(p.iron, p.stoneL, k & 1 ? 0.2 : 0))); ell(cxx, top + 5 * R + len, 2.8 * R, 2 * R, rgb(p.iron)); ell(cxx, top + 5 * R + len, 1.6 * R, 1.1 * R, rgb(hx('#100e0c'))); } }
      { const x = cx - W * 0.1, y = by + 2 * R; for (const dx of [-3, 3]) line(x + dx * R, y, x + dx * 0.6 * R, y - 8 * R, rgb(p.bark), 1.2 * R); ell(x, y - 8 * R, 5 * R, 2 * R, rgb(p.timber)); }
      { const x = cx + W * 0.2, y = by + 2 * R; ell(x, y, 3 * R, 1.3 * R, rgb(p.barkD)); rect(x - 2.6 * R, y - 5 * R, 5.2 * R, 5 * R, rgb(p.bark)); line(x - 2.6 * R, y - 2.5 * R, x + 2.6 * R, y - 2.5 * R, rgb(p.iron), 0.8 * R); ell(x, y - 5 * R, 2.6 * R, R, rgb(hx('#3a4a4c'))); }
    } else if (kind === 'barracks'){
      // the barracks: a long bunk hall, the company shield high on the wall, a spear rack against the gable, a water trough, helmets drying on a row of pegs
      tread(cx, by - 6 * R, W * 0.44, 9 * R);
      const bsp = S('building', 1, {w: 2, d: 1, roof: 48}); put(bsp, cx + 4 * R, by - 4 * R);
      { const x = cx + 4 * R - bsp.img.width * 0.2, y = by - 4 * R - V.K.wallH * R * 0.74; poly(g, [[x - 6 * R, y - 7 * R], [x + 6 * R, y - 7 * R], [x + 6 * R, y], [x, y + 7 * R], [x - 6 * R, y]], rgb(mix(p.timber, p.barkD, 0.4)), rgb(p.iron), 0.9 * R); poly(g, [[x - 6 * R, y - 7 * R], [x, y - 7 * R], [x, y + 7 * R], [x - 6 * R, y]], rgba(p.plasterD, 0.35)); ell(x, y - R, 1.6 * R, 1.6 * R, rgb(p.iron)); }
      { const ex = cx + 4 * R + bsp.img.width * 0.08, ey = by - 4 * R - V.K.wallH * R * 0.9; for (let i = 0; i < 3; i++){ const x = ex + i * 8 * R; rect(x - 0.6 * R, ey, 1.2 * R, 3 * R, rgb(p.bark)); ell(x, ey + 6 * R, 3.2 * R, 3.6 * R, rgb(mix(p.iron, p.stoneL, 0.25))); ell(x - 0.8 * R * L, ey + 4.5 * R, 1.6 * R, 1.6 * R, rgba(p.stoneL, 0.35)); rect(x - 3.2 * R, ey + 8 * R, 6.4 * R, 1.2 * R, rgb(p.iron)); } }
      { const x = cx - W * 0.4, y = by - R; post(x - 9 * R, y - 26 * R, y, 1.3 * R); post(x + 9 * R, y - 25 * R, y, 1.3 * R); line(x - 10 * R, y - 24 * R, x + 10 * R, y - 23 * R, rgb(p.bark), 1.8 * R); for (let i = 0; i < 5; i++){ const sx = x - 7 * R + i * 3.5 * R; line(sx + 2 * R, y, sx, y - 72 * R, rgb(mix(p.timber, p.barkD, 0.5)), 1.1 * R); poly(g, [[sx - 1.4 * R, y - 72 * R], [sx + 1.4 * R, y - 72 * R], [sx, y - 80 * R]], rgb(p.iron)); } }
      { const x = cx + W * 0.1, y = by + 3 * R; rect(x - 16 * R, y - 8 * R, 32 * R, 8 * R, rgb(p.bark)); rect(x - 16 * R, y - 8 * R, 32 * R, 1.2 * R, rgba(p.barkL, 0.4)); for (const dx of [-16, 0, 15]) rect(x + dx * R, y - 8 * R, R, 8 * R, rgba(p.barkD, 0.7)); rect(x - 14 * R, y - 7 * R, 28 * R, 2 * R, rgb(mix(p.wet, hx('#3a4a4c'), 0.5))); }
      put(S('decor', 2, {k: 'benchlog'}), cx + W * 0.4, by + R);
    } else if (kind === 'training'){
      // the training ground: a raked sand ring, two pells scarred by blades, a straw man on a post with arrows in him, a straw butt on a stand, a rail of practice swords, a water barrel
      tread(cx, by - 6 * R, W * 0.46, 11 * R);
      ell(cx - W * 0.08, by - 8 * R, W * 0.34, 13 * R, rgb(mix(p.thatch, p.stone, 0.55))); for (let i = 0; i < 6; i++){ g.strokeStyle = rgba(p.barkD, 0.12); g.lineWidth = 0.8 * R; g.beginPath(); g.ellipse(cx - W * 0.08, by - 8 * R, W * 0.34 * (0.3 + i * 0.12), 13 * R * (0.3 + i * 0.12), 0, 0, Math.PI * 2); g.stroke(); }
      for (const [px, ph] of [[cx - W * 0.22, 62], [cx + W * 0.02, 56]]){ const top = by - 10 * R - ph * R; post(px, top, by - 10 * R, 3 * R); ell(px, top, 3 * R, 1.2 * R, rgb(cut)); for (let i = 0; i < 9; i++){ const yy = top + (6 + r() * (ph - 12)) * R, xx = px - 3 * R + r() * 6 * R; line(xx, yy, xx + R, yy + 2 * R, rgba(cut, 0.75), 0.9 * R); } }
      { const x = cx + W * 0.26, top = by - 6 * R - 76 * R; post(x, top + 30 * R, by - 6 * R, 1.6 * R); line(x - 16 * R, top + 24 * R, x + 16 * R, top + 20 * R, rgb(p.bark), 2 * R); ell(x, top + 36 * R, 9 * R, 18 * R, rgb(mix(p.thatch, p.thatchL, 0.4))); ell(x, top + 8 * R, 7 * R, 8 * R, rgb(mix(p.canvas, p.thatch, 0.5))); for (let i = 0; i < 12; i++){ const xx = x + (r() - 0.5) * 16 * R, yy = top + 20 * R + r() * 30 * R; line(xx, yy, xx + R, yy + 3 * R, rgba(p.thatchL, 0.6), 0.7 * R); } rect(x - 5 * R, top + 22 * R, 10 * R, 3 * R, rgb(rope)); for (let i = 0; i < 3; i++){ const xx = x + (r() - 0.5) * 10 * R, yy = top + 28 * R + r() * 16 * R; line(xx, yy, xx + 7 * R * L, yy - 9 * R, rgb(p.bark), 0.9 * R); } }
      { const x = cx - W * 0.44, y = by - 2 * R; line(x - 6 * R, y, x, y - 30 * R, rgb(p.barkD), 1.4 * R); line(x + 6 * R, y, x, y - 30 * R, rgb(p.barkD), 1.4 * R); ell(x, y - 20 * R, 12 * R, 12 * R, rgb(mix(p.thatch, p.thatchL, 0.5))); for (const rc of [[9, mix(p.canvasD, p.plasterD, 0.5)], [5.5, mix(p.thatch, p.barkD, 0.4)], [2.2, hx('#2a2420')]]) ell(x, y - 20 * R, rc[0] * R, rc[0] * R, rgb(rc[1])); for (let i = 0; i < 4; i++){ const xx = x + (r() - 0.5) * 12 * R, yy = y - 20 * R + (r() - 0.5) * 12 * R; line(xx, yy, xx + 9 * R * L, yy - 6 * R, rgb(p.bark), 0.9 * R); } }
      { const x = cx + W * 0.42, y = by + R; post(x - 10 * R, y - 22 * R, y, 1.2 * R); post(x + 10 * R, y - 21 * R, y, 1.2 * R); line(x - 11 * R, y - 20 * R, x + 11 * R, y - 19 * R, rgb(p.bark), 1.8 * R); for (let i = 0; i < 4; i++){ const sx = x - 7 * R + i * 4.6 * R; line(sx, y - 20 * R, sx + 2 * R, y - 2 * R, rgb(mix(p.timber, p.barkD, 0.5)), 1.4 * R); line(sx - 2 * R, y - 16 * R, sx + 2 * R, y - 16.5 * R, rgb(p.iron), R); } }
      put(S('decor', 1, {k: 'barrel'}), cx + W * 0.12, by + 3 * R);
    } else if (kind === 'armoury'){
      // the armoury: a one-cell strong store with a lantern on a chain, a rack of spears against the gable, shields stacked by the door, an open crate of bolts and a shut one
      tread(cx, by - 5 * R, W * 0.4, 9 * R);
      const bsp = S('building', 2, {w: 1, d: 1, roof: 48}); put(bsp, cx + 8 * R, by - 4 * R);
      lantern(cx + 8 * R - bsp.ax + 10 * R, by - 4 * R - V.K.wallH * R * 0.72);
      { const x = cx - W * 0.38, y = by - R; post(x - 9 * R, y - 26 * R, y, 1.3 * R); post(x + 9 * R, y - 25 * R, y, 1.3 * R); line(x - 10 * R, y - 24 * R, x + 10 * R, y - 23 * R, rgb(p.bark), 1.8 * R); for (let i = 0; i < 5; i++){ const sx = x - 7 * R + i * 3.5 * R; line(sx + 2 * R, y, sx, y - 70 * R, rgb(mix(p.timber, p.barkD, 0.5)), 1.1 * R); poly(g, [[sx - 1.4 * R, y - 70 * R], [sx + 1.4 * R, y - 70 * R], [sx, y - 78 * R]], rgb(p.iron)); } }
      for (let i = 0; i < 3; i++){ const x = cx + W * 0.44 - i * 3 * R, y = by - 2 * R - i * 1.5 * R; poly(g, [[x - 7 * R, y - 18 * R], [x + 7 * R, y - 18 * R], [x + 7 * R, y - 8 * R], [x, y], [x - 7 * R, y - 8 * R]], rgb(mix(p.timber, i === 1 ? p.plasterD : p.barkD, 0.4)), rgb(p.iron), 0.9 * R); ell(x, y - 10 * R, 1.8 * R, 1.8 * R, rgb(p.iron)); }
      put(S('decor', 0, {k: 'crate'}), cx - W * 0.24, by - 4 * R); put(S('decor', 2, {k: 'crate'}), cx - W * 0.08, by + 2 * R);
      for (let i = 0; i < 6; i++) line(cx - W * 0.08 - 6 * R + i * 2.2 * R, by - 10 * R, cx - W * 0.08 - 5 * R + i * 2.2 * R, by - 22 * R, rgb(mix(p.timber, p.barkD, 0.5)), 0.9 * R);
    } else if (kind === 'stables'){
      // the stables: an open-fronted shed, thatch on crooked posts, three stalls with half-doors, hay heaped in one with a fork stuck in it, a saddle over a door, a trough, feed sacks
      tread(cx, by - 5 * R, W * 0.44, 10 * R);
      { const sw = W * 0.4, x0 = cx - sw, x1 = cx + sw, ground = by - 4 * R, wallT = ground - 64 * R, roofT = wallT - 26 * R;
        rect(x0, wallT, sw * 2, 64 * R, rgb(mix(p.timber, p.barkD, 0.6))); for (let i = 0; i < 9; i++) rect(x0 + sw * 2 * i / 9, wallT, 0.8 * R, 64 * R, rgba(hx('#0c0a08'), 0.4));
        { const hx0 = x0 + sw * 0.33; for (let i = 0; i < 14; i++) ell(hx0 + (r() - 0.5) * 20 * R, ground - 30 * R - r() * 10 * R, (4 + r() * 3) * R, (2 + r() * 2) * R, rgb(mix(p.thatchL, p.thatch, r()))); line(hx0 + 8 * R, ground - 30 * R, hx0 + 16 * R, ground - 58 * R, rgb(p.bark), 1.1 * R); for (const d of [-2, 0, 2]) line(hx0 + 8 * R + d * R, ground - 30 * R, hx0 + 9 * R + d * 1.4 * R, ground - 37 * R, rgb(p.iron), 0.8 * R); }
        for (let i = 0; i < 3; i++){ const sx = x0 + sw * 2 * (i + 0.5) / 3; rect(sx - 11 * R, ground - 34 * R, 22 * R, 34 * R, rgb(mix(p.timber, p.barkD, 0.3))); rect(sx - 11 * R, ground - 34 * R, 22 * R, 1.5 * R, rgba(p.barkL, 0.4)); line(sx - 11 * R, ground - 30 * R, sx + 11 * R, ground - 8 * R, rgba(p.barkD, 0.6), 1.2 * R); rect(sx - 11 * R, ground - 20 * R, 22 * R, 1.2 * R, rgba(p.iron, 0.8)); }
        { const sx = x0 + sw * 2 * 2.5 / 3, sy = ground - 34 * R, sad = mix(p.bark, hx('#4a2e22'), 0.5); ell(sx, sy - 2 * R, 8 * R, 4 * R, rgb(sad)); ell(sx + 5 * R, sy - 5 * R, 2.5 * R, 3 * R, rgb(sad)); rect(sx - 6 * R, sy, 12 * R, 1.2 * R, rgba(p.barkD, 0.7)); }
        for (let i = 0; i <= 3; i++) post(x0 + sw * 2 * i / 3, roofT + 2 * R, ground, 2 * R);
        poly(g, [[x0 - 8 * R, wallT - 2 * R], [x1 + 8 * R, wallT - 2 * R], [x1 - 4 * R, roofT], [x0 + 4 * R, roofT]], rgb(p.thatch)); for (let i = 0; i < 40; i++){ const t = r(), xx = x0 - 8 * R + (sw * 2 + 16 * R) * t, yy = wallT - 2 * R - r() * 22 * R; line(xx, yy, xx + 1.5 * R, yy + 4 * R, rgba(r() > 0.5 ? p.thatchL : mul(p.thatch, 0.7), 0.6), 0.9 * R); }
        poly(g, [[x0 - 8 * R, wallT - 2 * R], [x1 + 8 * R, wallT - 2 * R], [x1 + 8 * R, wallT + 2 * R], [x0 - 8 * R, wallT + 2 * R]], rgba(hx('#0c0a08'), 0.35));
      }
      { const x = cx - W * 0.1, y = by + 3 * R; rect(x - 16 * R, y - 8 * R, 32 * R, 8 * R, rgb(p.bark)); rect(x - 16 * R, y - 8 * R, 32 * R, 1.2 * R, rgba(p.barkL, 0.4)); rect(x - 14 * R, y - 7 * R, 28 * R, 2 * R, rgb(mix(p.wet, hx('#3a4a4c'), 0.5))); }
      put(S('decor', 0, {k: 'sacks'}), cx + W * 0.42, by + 2 * R);
    } else if (kind === 'ranger'){
      // the ranger lodge: a hide-roofed lean-to on stout poles, antlers over the dark doorway, a pelt laced on a drying frame, a lookout post with a ladder, a stump, old bones by the step
      tread(cx, by - 5 * R, W * 0.42, 9 * R);
      { const x0 = cx - W * 0.3, x1 = cx + W * 0.2, ground = by - 3 * R, top = ground - 72 * R, hide = hx(w ? '#4e4236' : '#5a4634');
        rect(x0 + 2 * R, top + 10 * R, x1 - x0 - 4 * R, ground - top - 10 * R, rgb(mix(p.timber, p.barkD, 0.6))); for (let i = 0; i < 7; i++) rect(x0 + 2 * R + (x1 - x0 - 4 * R) * i / 7, top + 10 * R, 0.8 * R, ground - top - 10 * R, rgba(hx('#0c0a08'), 0.4));
        rect(cx - 10 * R, ground - 44 * R, 20 * R, 44 * R, rgb(hx('#100e0c')));
        post(x0, top + 4 * R, ground, 2 * R); post(x1, top + 14 * R, ground, 2 * R);
        poly(g, [[x0 - 10 * R, top + 6 * R], [x1 + 10 * R, top + 16 * R], [x1 + 6 * R, top - 4 * R], [x0 - 6 * R, top - 14 * R]], rgb(hide)); for (let i = 1; i < 4; i++){ const t = i / 4, xa = x0 - 6 * R + (x1 - x0 + 12 * R) * t, xb = x0 - 10 * R + (x1 - x0 + 20 * R) * t; line(xa, top - 14 * R + 10 * R * t, xb, top + 6 * R + 10 * R * t, rgba(hx('#3a2a1c'), 0.5), 0.9 * R); for (let k = 0; k < 5; k++){ const u = (k + 0.5) / 5, xx = xa + (xb - xa) * u, yy = top - 14 * R + 10 * R * t + (20 * R) * u; line(xx - 1.5 * R, yy - 0.8 * R, xx + 1.5 * R, yy + 0.8 * R, rgba(p.plasterD, 0.5), 0.6 * R); } }
        for (let i = 0; i < 6; i++) ell(x0 - 4 * R + (x1 - x0 + 10 * R) * (i + 0.5) / 6, top + 4 * R + 10 * R * (i + 0.5) / 6, 2 * R, 1.2 * R, rgba(hx('#5a4a38'), 0.7));
        { const ax = cx, ay = ground - 50 * R; for (const sgn of [-1, 1]){ line(ax + sgn * 8 * R, ay - 10 * R, ax, ay, rgb(p.plaster), 1.3 * R); line(ax + sgn * 6 * R, ay - 7 * R, ax + sgn * 10 * R, ay - 14 * R, rgb(p.plaster), R); line(ax + sgn * 4 * R, ay - 4 * R, ax + sgn * 8 * R, ay - 8 * R, rgb(p.plaster), 0.8 * R); } }
      }
      { const x = cx + W * 0.4, y = by - R, pelt = hx(w ? '#5a4a3a' : '#6a4a34'); post(x - 12 * R, y - 40 * R, y, 1.2 * R); post(x + 12 * R, y - 40 * R, y, 1.2 * R); line(x - 13 * R, y - 38 * R, x + 13 * R, y - 38 * R, rgb(p.bark), 1.4 * R); line(x - 13 * R, y - 6 * R, x + 13 * R, y - 6 * R, rgb(p.bark), 1.4 * R);
        poly(g, [[x - 8 * R, y - 34 * R], [x + 8 * R, y - 34 * R], [x + 10 * R, y - 20 * R], [x + 7 * R, y - 10 * R], [x - 7 * R, y - 10 * R], [x - 10 * R, y - 20 * R]], rgb(pelt)); for (let i = 0; i < 8; i++) ell(x + (r() - 0.5) * 12 * R, y - 22 * R + (r() - 0.5) * 16 * R, 2 * R, 1.3 * R, rgba(hx('#8a7258'), 0.5)); for (const d of [[-8, -34, -11, -38], [8, -34, 11, -38], [10, -20, 13, -20], [-10, -20, -13, -20], [7, -10, 9, -6], [-7, -10, -9, -6]]) line(x + d[0] * R, y + d[1] * R, x + d[2] * R, y + d[3] * R, rgb(rope), 0.7 * R); }
      { const x = cx - W * 0.44, top = by - 92 * R; post(x, top, by, 1.8 * R); rect(x - 8 * R, top - 2 * R, 16 * R, 2.5 * R, rgb(p.bark)); line(x + 2 * R, by, x + 7 * R, top + 4 * R, rgb(p.barkD), 1.1 * R); line(x + 8 * R, by, x + 13 * R, top + 4 * R, rgb(p.barkD), 1.1 * R); for (let i = 1; i < 9; i++){ const t = i / 9; line(x + 2 * R + 5 * R * t, by - (by - top - 4 * R) * t, x + 8 * R + 5 * R * t, by - (by - top - 4 * R) * t, rgb(p.bark), 1.2 * R); } }
      put(S('decor', 0, {k: 'stump'}), cx + W * 0.12, by + 2 * R); put(S('decor', 2, {k: 'bones'}), cx - W * 0.1, by + 4 * R);
    } else if (kind === 'hospital'){
      // the hospital: the long tent with a canvas awning on poles, two cots under it with grey blankets, a crutch against the pole, bandages pegged on a line, a copper steaming over a small fire, a herb rack, a crate
      tread(cx, by - 6 * R, W * 0.44, 10 * R);
      put(S('tent', 2, {w: 3}), cx + 20 * R, by - 8 * R);
      { const x0 = cx - W * 0.46, x1 = cx - W * 0.1, ground = by - 2 * R, top = ground - 40 * R;
        for (let i = 0; i < 2; i++){ const cxx = x0 + (x1 - x0) * (0.3 + i * 0.45), cy = ground - 8 * R + i * 5 * R, cw = 18 * R; for (const dx of [-cw * 0.8, cw * 0.8]) line(cxx + dx, cy, cxx + dx, cy - 9 * R, rgb(p.barkD), 1.3 * R); poly(g, [[cxx - cw, cy - 9 * R], [cxx + cw, cy - 10 * R], [cxx + cw, cy - 7 * R], [cxx - cw, cy - 6 * R]], rgb(p.bark)); poly(g, [[cxx - cw + R, cy - 10 * R], [cxx + cw - R, cy - 11 * R], [cxx + cw - 2 * R, cy - 15 * R], [cxx - cw + 2 * R, cy - 14 * R]], rgb(mix(p.slate, p.plasterD, 0.5))); ell(cxx - cw + 5 * R, cy - 14 * R, 4 * R, 2.2 * R, rgb(mix(linen, p.plasterD, 0.3))); }
        post(x0, top + 2 * R, ground, 1.3 * R); post(x1, top - 2 * R, ground, 1.3 * R);
        g.fillStyle = rgb(mix(p.canvas, p.canvasD, 0.3)); g.beginPath(); g.moveTo(x0 - 4 * R, top); g.lineTo(x1 + 4 * R, top - 4 * R); g.lineTo(x1 + 8 * R, top - 18 * R); g.lineTo(x0 - 6 * R, top - 12 * R); g.closePath(); g.fill(); poly(g, [[x0 - 4 * R, top], [x1 + 4 * R, top - 4 * R], [x1 + 4 * R, top - R], [x0 - 4 * R, top + 3 * R]], rgba(p.canvasD, 0.8));
        line(x1 + 3 * R, ground, x1 + 1.5 * R, ground - 34 * R, rgb(p.bark), 1.3 * R); line(x1 - R, ground - 34 * R, x1 + 4 * R, ground - 34 * R, rgb(p.bark), 1.6 * R);
      }
      { const x0 = cx - W * 0.1, x1 = cx + W * 0.12, yl = by - 48 * R; g.strokeStyle = rgb(rope); g.lineWidth = 0.7 * R; g.beginPath(); g.moveTo(x0, yl - 4 * R); g.quadraticCurveTo((x0 + x1) / 2, yl, x1, yl - 6 * R); g.stroke(); for (let i = 0; i < 4; i++){ const t = 0.15 + i * 0.23, x = x0 + (x1 - x0) * t, y = yl - 4 * R + 3 * R * Math.sin(t * Math.PI); poly(g, [[x - 1.5 * R, y], [x + 1.5 * R, y], [x + 1.8 * R, y + (9 + i * 2) * R], [x - 1.8 * R, y + (8 + i * 2) * R]], rgb(mix(linen, p.plaster, 0.5))); } }
      { const x = cx + W * 0.38, y = by; ell(x, y, 8 * R, 2.8 * R, rgba(mudD, 0.6)); for (let i = 0; i < 5; i++) ell(x + (r() - 0.5) * 10 * R, y - r() * 1.5 * R, 1.8 * R, 1.2 * R, rgb(mix(p.stone, p.stoneD, r()))); ell(x, y - 2 * R, 3 * R, 1.4 * R, rgba(p.ember, 0.8)); for (const dx of [-5, 0, 5]) line(x + dx * R, y - 2 * R, x, y - 20 * R, rgb(p.iron), 1.1 * R); ell(x, y - 10 * R, 5.5 * R, 4.5 * R, rgb(mix(p.iron, hx('#6a4a2a'), 0.5))); ell(x, y - 13.5 * R, 5.5 * R, 1.8 * R, rgb(mix(p.iron, hx('#8a6a3a'), 0.5))); smoke(x, y - 16 * R, 4); }
      { const x = cx + W * 0.12, y = by + 2 * R; post(x - 8 * R, y - 24 * R, y, R); post(x + 8 * R, y - 23 * R, y, R); for (let row = 0; row < 2; row++){ const yy = y - 22 * R + row * 8 * R; line(x - 9 * R, yy, x + 9 * R, yy, rgb(p.bark), R); for (let i = 0; i < 5; i++){ const xx = x - 7 * R + i * 3.5 * R; line(xx, yy, xx, yy + 5 * R, rgb(rope), 0.6 * R); ell(xx, yy + 6 * R, 1.8 * R, 2.4 * R, rgb(mix(p.moss, p.leafD, r() * 0.6))); } } }
      put(S('decor', 1, {k: 'crate'}), cx - W * 0.2, by + 4 * R);
    } else if (kind === 'blacksmith'){
      // the smithy: a two-cell house with its chimney smoking, an open forge of black stone out front with the coals glowing at the mouth under an iron hood, the anvil on its stump with the hammer laid across it, a quench barrel, tongs against the hearth, scrap iron in the mud
      tread(cx, by - 6 * R, W * 0.44, 10 * R);
      const bsp = S('building', 1, {w: 2, d: 1, roof: 48}); put(bsp, cx + 8 * R, by - 6 * R); if (TR && bsp.chim) smoke(cx + 8 * R + bsp.chim.x, by - 6 * R + bsp.chim.y, 5); else smoke(cx + 8 * R + 16 * R * L, by - 6 * R - bsp.ay + 14 * R, 4);   /* INDEX T29 */
      if (!TR){ const x = cx - W * 0.3, y = by; ell(x, y + R, 20 * R, 5 * R, rgba(mudD, 0.5)); courses(x - 15 * R, y - 24 * R, 30 * R, 24 * R, 5 * R, 11 * R, mix(p.stone, hx('#0c0a08'), 0.35));   /* INDEX T29: the forge is inside the open front */
        rect(x - 9 * R, y - 18 * R, 18 * R, 13 * R, rgb(hx('#100e0c'))); ell(x, y - 10 * R, 14 * R, 8 * R, rgba(p.ember, 0.16)); ell(x, y - 9 * R, 7 * R, 3.5 * R, rgba(p.ember, 0.85)); ell(x - 2 * R, y - 9.5 * R, 3 * R, 1.6 * R, rgba(mix(p.ember, p.thatchL, 0.45), 0.9)); for (let i = 0; i < 6; i++) ell(x + (r() - 0.5) * 12 * R, y - 7 * R - r() * 5 * R, 1.6 * R, 1.2 * R, rgb(mix(hx('#1a1410'), p.ember, r() * 0.5)));
        poly(g, [[x - 17 * R, y - 24 * R], [x + 17 * R, y - 24 * R], [x + 10 * R, y - 36 * R], [x - 10 * R, y - 36 * R]], rgb(mix(p.iron, hx('#0c0a08'), 0.3))); poly(g, [[x - 17 * R, y - 24 * R], [x + 17 * R, y - 24 * R], [x + 17 * R, y - 22.5 * R], [x - 17 * R, y - 22.5 * R]], rgba(p.ember, 0.3)); rect(x - 3.5 * R, y - 52 * R, 7 * R, 17 * R, rgb(p.iron)); rect(x - 4.5 * R, y - 53 * R, 9 * R, 2 * R, rgb(p.iron)); smoke(x, y - 54 * R, 4);
        line(x + 15 * R, y, x + 19 * R, y - 22 * R, rgb(p.iron), 1.1 * R); line(x + 16 * R, y, x + 20 * R, y - 22 * R, rgb(p.iron), 1.1 * R); for (let i = 0; i < 4; i++) line(x - 22 * R + i * 2 * R, y + 2 * R - i * 0.5 * R, x - 12 * R + i * 2 * R, y + 3 * R - i * 0.5 * R, rgb(mix(p.iron, hx('#0c0a08'), 0.3)), 1.4 * R); }
      { const x = cx + W * 0.04, y = by + 2 * R; ell(x, y, 7 * R, 2.8 * R, rgba(mudD, 0.6)); rect(x - 5.5 * R, y - 10 * R, 11 * R, 10 * R, rgb(p.bark)); rect(x - 5.5 * R + (L > 0 ? 7 * R : 0), y - 10 * R, 4.5 * R, 10 * R, rgba(p.barkL, 0.35)); ell(x, y - 10 * R, 5.5 * R, 2.2 * R, rgb(cut));
        poly(g, [[x - 6 * R, y - 11 * R], [x + 6 * R, y - 11 * R], [x + 5 * R, y - 14 * R], [x - 5 * R, y - 14 * R]], rgb(mix(p.iron, hx('#0c0a08'), 0.2))); poly(g, [[x - 9 * R, y - 14 * R], [x + 9 * R, y - 14 * R], [x + 10 * R, y - 16.5 * R], [x - 8 * R, y - 16.5 * R]], rgb(p.iron)); ell(x + 12 * R, y - 15.8 * R, 4 * R, 1.4 * R, rgb(p.iron)); rect(x - 9 * R, y - 16.5 * R, 18 * R, 0.8 * R, rgba(p.stoneL, 0.5));
        line(x - 3 * R, y - 17 * R, x + 7 * R, y - 21 * R, rgb(p.bark), 1.3 * R); rect(x + 5 * R, y - 23.5 * R, 5 * R, 4 * R, rgb(p.iron)); }
      { const bsp2 = S('decor', 0, {k: 'barrel'}); put(bsp2, cx + W * 0.3, by + 2 * R); ell(cx + W * 0.3, by + 2 * R - bsp2.ay + 2 * R, 5.5 * R, 2 * R, rgb(hx('#1c1a16'))); }
      for (let i = 0; i < 3; i++){ const x = cx - W * 0.1 + i * 4 * R, y = by + 3 * R; g.strokeStyle = rgb(p.iron); g.lineWidth = 1.2 * R; g.beginPath(); g.arc(x, y - 2 * R, 2.4 * R, Math.PI * 0.15, Math.PI * 0.85, true); g.stroke(); }
    } else if (kind === 'carpentry'){
      // the carpentry: an open shed on four posts under a lean roof of shingles, boards stacked at the back, a sawhorse with a plank and the saw left in the cut, shavings in the mud, a half-made cartwheel leaning on a post, a mallet hung on a peg, a barrel
      tread(cx, by - 5 * R, W * 0.42, 9 * R);
      { const x0 = cx - W * 0.42, x1 = cx + W * 0.38, top = by - 50 * R; rect(x0, top + 8 * R, x1 - x0, 40 * R, rgb(mix(p.bark, p.barkD, 0.55))); for (let i = 0; i < 9; i++) rect(x0 + 2 * R + i * (x1 - x0 - 4 * R) / 9, top + 8 * R, 1.2 * R, 40 * R, rgba(hx('#0c0a08'), 0.45)); rect(x0, top + 8 * R, x1 - x0, 12 * R, rgba(hx('#0c0a08'), 0.35));
        for (let row = 0; row < 5; row++) for (let i = 0; i < 2; i++) rect(x0 + 6 * R + i * 22 * R, by - 4 * R - row * 3 * R, 20 * R, 2.6 * R, rgb(mix(p.timber, cut, (row + i) % 2 ? 0.3 : 0))); for (let row = 0; row < 5; row++) rect(x0 + 5 * R, by - 4 * R - row * 3 * R, R, 2.6 * R, rgba(hx('#0c0a08'), 0.35));
        post(x0 + 3 * R, top + 6 * R, by - 2 * R, 1.4 * R); post(x1 - 3 * R, top + 4 * R, by - 4 * R, 1.4 * R); post(x0 + 10 * R, top + 2 * R, by - 8 * R, 1.2 * R); post(x1 - 10 * R, top, by - 10 * R, 1.2 * R);
        poly(g, [[x0 - 5 * R, top + 4 * R], [x1 + 5 * R, top + 2 * R], [x1 + 7 * R, top - 8 * R], [x0 - 7 * R, top - 5 * R]], rgb(mix(p.shingle, p.shingleL, 0.35))); for (let j = 1; j < 4; j++){ const t = j / 4; line(x0 - 5 * R - 2 * R * t, top + 4 * R - 9 * R * t, x1 + 5 * R + 2 * R * t, top + 2 * R - 10 * R * t, rgba(hx('#0c0a08'), 0.35), 0.8 * R); } for (let i = 0; i < 14; i++){ const t = i / 14 + 0.03; line(x0 - 5 * R + (x1 - x0 + 10 * R) * t, top + 4 * R - 2 * R * t, x0 - 7 * R + (x1 - x0 + 14 * R) * t, top - 5 * R - 3 * R * t, rgba(p.shingleL, 0.25), 0.7 * R); } rect(x0 - 5 * R, top + 3 * R, x1 - x0 + 10 * R, 3 * R, rgba(hx('#0c0a08'), 0.4));
        line(x0 + 10 * R, top + 12 * R, x0 + 10 * R, top + 15 * R, rgb(p.iron), R); line(x0 + 8 * R, top + 15 * R, x0 + 12 * R, top + 23 * R, rgb(p.bark), 1.4 * R); rect(x0 + 5 * R, top + 11 * R, 8 * R, 5 * R, rgb(mix(p.bark, p.barkD, 0.3))); }
      { const x = cx + 2 * R, y = by + 2 * R; for (const dx of [-14 * R, 14 * R]){ line(x + dx - 3 * R, y, x + dx + R, y - 12 * R, rgb(p.barkD), 1.4 * R); line(x + dx + 3 * R, y, x + dx - R, y - 12 * R, rgb(p.barkD), 1.4 * R); } rect(x - 18 * R, y - 13.5 * R, 36 * R, 2.5 * R, rgb(p.bark)); poly(g, [[x - 24 * R, y - 13.5 * R], [x + 20 * R, y - 15 * R], [x + 21 * R, y - 12 * R], [x - 23 * R, y - 10.5 * R]], rgb(p.timber)); rect(x - 24 * R, y - 13.5 * R, 44 * R, R, rgba(cut, 0.6));
        line(x + 4 * R, y - 15 * R, x + 7 * R, y - 32 * R, rgb(p.iron), 1.6 * R); for (let i = 0; i < 8; i++) line(x + 4.2 * R + i * 0.35 * R, y - 15.5 * R - i * 2 * R, x + 5.5 * R + i * 0.35 * R, y - 15.5 * R - i * 2 * R, rgb(p.stoneL), 0.5 * R); rect(x + 6 * R, y - 36 * R, 4 * R, 5 * R, rgb(p.bark));
        for (let i = 0; i < 9; i++){ const sx = x + (r() - 0.5) * 40 * R, sy = y + 2 * R + (r() - 0.5) * 6 * R; g.strokeStyle = rgb(mix(cut, p.thatchL, 0.4)); g.lineWidth = 0.9 * R; g.beginPath(); g.arc(sx, sy, (1.5 + r()) * R, r() * 3, r() * 3 + 4); g.stroke(); } }
      { const x = cx + W * 0.42, y = by - 2 * R, rr = 15 * R; g.strokeStyle = rgb(p.bark); g.lineWidth = 2.6 * R; g.beginPath(); g.ellipse(x, y - rr, rr * 0.55, rr, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = rgb(p.barkD); g.lineWidth = 0.8 * R; g.beginPath(); g.ellipse(x, y - rr, rr * 0.55 + 1.3 * R, rr + 1.3 * R, 0, 0, Math.PI * 2); g.stroke(); for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3; line(x, y - rr, x + Math.cos(a) * rr * 0.5, y - rr + Math.sin(a) * rr * 0.92, rgb(p.timber), 1.2 * R); } ell(x, y - rr, 2.2 * R, 3.5 * R, rgb(p.barkD)); }
      put(S('decor', 1, {k: 'barrel'}), cx - W * 0.44, by + 3 * R);
    } else if (kind === 'leather'){
      // the tannery: a one-cell hut, two hides laced out on frames, the tanning vat of dark liquor with a hide half in it, the scraping beam on its legs, hides pegged to dry on a line to a post, a bucket
      tread(cx, by - 6 * R, W * 0.44, 10 * R);
      put(S('building', 3, {w: 1, d: 1, roof: 48}), cx + W * 0.24, by - 6 * R);
      const hideCol = hx(w ? '#6e5a48' : '#7e6448'), hideD = hx('#4a3828');
      for (let i = 0; i < 2; i++){ const x = cx - W * 0.36 + i * 26 * R, y = by - 2 * R - i * 6 * R, fw = 11 * R, fh = 36 * R; post(x - fw, y - fh, y, R); post(x + fw, y - fh + R, y, R); line(x - fw, y - fh + 2 * R, x + fw, y - fh + 3 * R, rgb(p.bark), 1.6 * R); line(x - fw, y - 4 * R, x + fw, y - 3 * R, rgb(p.bark), 1.4 * R);
        poly(g, [[x - fw * 0.72, y - fh + 6 * R], [x + fw * 0.6, y - fh + 7 * R], [x + fw * 0.78, y - fh * 0.5], [x + fw * 0.55, y - 7 * R], [x - fw * 0.6, y - 8 * R], [x - fw * 0.8, y - fh * 0.55]], rgb(mix(hideCol, hideD, i * 0.3))); ell(x - fw * 0.2, y - fh * 0.55, fw * 0.35, fh * 0.2, rgba(hideD, 0.25));
        for (let k = 0; k < 7; k++){ const t = k / 7 + 0.07; line(x - fw * 0.75 + fw * 1.5 * t, y - fh + 6 * R, x - fw * 0.8 + fw * 1.6 * t, y - fh + 2.5 * R, rgb(rope), 0.6 * R); line(x - fw * 0.65 + fw * 1.3 * t, y - 7.5 * R, x - fw * 0.75 + fw * 1.5 * t, y - 3.5 * R, rgb(rope), 0.6 * R); } for (let k = 0; k < 4; k++){ const t = k / 4 + 0.12; line(x - fw * 0.75, y - fh + 6 * R + (fh - 14 * R) * t, x - fw, y - fh + 4 * R + (fh - 8 * R) * t, rgb(rope), 0.6 * R); line(x + fw * 0.65, y - fh + 7 * R + (fh - 14 * R) * t, x + fw, y - fh + 4 * R + (fh - 8 * R) * t, rgb(rope), 0.6 * R); } }
      { const x = cx - W * 0.02, y = by + 2 * R, vw = 16 * R; ell(x, y, vw + 2 * R, 3 * R, rgba(mudD, 0.6)); rect(x - vw, y - 12 * R, vw * 2, 12 * R, rgb(mix(p.timber, p.barkD, 0.5))); for (let i = 0; i < 5; i++) rect(x - vw + i * vw * 2 / 5, y - 12 * R, 0.8 * R, 12 * R, rgba(hx('#0c0a08'), 0.4)); for (const t of [0.25, 0.75]) rect(x - vw, y - 12 * R + 12 * R * t, vw * 2, 1.4 * R, rgb(p.iron)); ell(x, y - 12 * R, vw, 2.6 * R, rgb(hx('#231c14'))); ell(x - 3 * R, y - 12.5 * R, vw * 0.5, 1.2 * R, rgba(hx('#3a2e20'), 0.6));
        poly(g, [[x + 2 * R, y - 13 * R], [x + 9 * R, y - 14 * R], [x + 14 * R, y - 22 * R], [x + 12 * R, y - 26 * R], [x + 5 * R, y - 20 * R]], rgb(mix(hideCol, hideD, 0.5))); }
      { const x = cx + W * 0.02, y = by - 18 * R; for (const dx of [-12 * R, 12 * R]) for (const s2 of [-1, 1]) line(x + dx + s2 * 2 * R, y + 16 * R, x + dx, y - 3 * R, rgb(p.barkD), 1.2 * R); line(x - 20 * R, y + R, x + 20 * R, y - 4 * R, rgb(p.bark), 3.2 * R); line(x - 20 * R, y, x + 20 * R, y - 5 * R, rgba(p.barkL, 0.35), 1.2 * R); poly(g, [[x - 8 * R, y - 4 * R], [x + 4 * R, y - 5.5 * R], [x + 6 * R, y + 4 * R], [x + 1 * R, y + 9 * R], [x - 9 * R, y + 6 * R]], rgb(hideCol)); line(x + 8 * R, y - 6 * R, x + 16 * R, y - 9 * R, rgb(p.iron), 1.2 * R); }
      { const x0 = cx + W * 0.02, x1 = cx + W * 0.46, yl = by - 44 * R; post(x1, yl - 4 * R, by - 2 * R, 1.2 * R); g.strokeStyle = rgb(rope); g.lineWidth = 0.7 * R; g.beginPath(); g.moveTo(x0, yl - 2 * R); g.quadraticCurveTo((x0 + x1) / 2, yl + 2 * R, x1, yl - 3 * R); g.stroke(); for (let i = 0; i < 3; i++){ const t = 0.2 + i * 0.3, x = x0 + (x1 - x0) * t, y = yl - 2 * R + 3 * R * Math.sin(t * Math.PI); poly(g, [[x - 3.5 * R, y], [x + 3 * R, y], [x + 4 * R, y + 8 * R], [x + 1 * R, y + 12 * R], [x - 4 * R, y + 9 * R]], rgb(mix(hideCol, hideD, 0.2 + i * 0.25))); } }
      { const x = cx - W * 0.16, y = by + 3 * R; ell(x, y, 3 * R, 1.3 * R, rgb(p.barkD)); rect(x - 2.6 * R, y - 5 * R, 5.2 * R, 5 * R, rgb(p.bark)); line(x - 2.6 * R, y - 2.5 * R, x + 2.6 * R, y - 2.5 * R, rgb(p.iron), 0.8 * R); ell(x, y - 5 * R, 2.6 * R, R, rgb(hx('#231c14'))); }
    } else if (kind === 'engineering'){
      // the engineering yard: a timber crane on an A-frame with a pulley holding a beam off the ground, a siege engine half built with its throwing arm raised and the skein wound, a trestle with the drawings pinned under a stone, rope coils, a crate of iron fittings
      tread(cx, by - 6 * R, W * 0.45, 10 * R);
      { const x = cx - W * 0.3, y = by, top = y - 66 * R; for (const dx of [-11 * R, 11 * R]) line(x + dx, y, x, top, rgb(p.bark), 2.2 * R); line(x - 11 * R, y, x, top, rgba(p.barkL, 0.3), 0.8 * R); line(x - 7 * R, y - 24 * R, x + 7 * R, y - 24 * R, rgb(p.bark), 1.6 * R); line(x - 2 * R, top + 2 * R, x + 28 * R, top - 12 * R, rgb(p.bark), 2.4 * R); line(x + 2 * R, y - 30 * R, x + 24 * R, top - 10 * R, rgb(p.barkD), 1.4 * R);
        const px = x + 28 * R, py = top - 12 * R; ell(px, py + 3 * R, 3 * R, 3 * R, rgb(p.iron)); ell(px, py + 3 * R, 1.6 * R, 1.6 * R, rgb(p.bark)); line(px - 3 * R, py + 3 * R, px - 3 * R, py + 30 * R, rgb(rope), R); line(px + 3 * R, py + 3 * R, x - 6 * R, y - 36 * R, rgb(rope), 0.9 * R); line(x - 6 * R, y - 36 * R, x - 10 * R, y - 2 * R, rgb(rope), 0.9 * R);
        const bx = px - 3 * R, bb = py + 30 * R; line(bx, bb, bx - 8 * R, bb + 8 * R, rgb(rope), 0.9 * R); line(bx, bb, bx + 8 * R, bb + 8 * R, rgb(rope), 0.9 * R); poly(g, [[bx - 16 * R, bb + 6 * R], [bx + 16 * R, bb + 9 * R], [bx + 16 * R, bb + 13 * R], [bx - 16 * R, bb + 10 * R]], rgb(p.timber)); rect(bx - 16 * R, bb + 6 * R, 32 * R, R, rgba(cut, 0.6)); ell(bx, y + R, 18 * R, 2.5 * R, rgba(mudD, 0.4)); }
      { const x = cx + W * 0.22, y = by + 2 * R; ell(x, y, 30 * R, 5 * R, rgba(mudD, 0.5)); for (const dx of [-24 * R, 20 * R]){ g.strokeStyle = rgb(p.bark); g.lineWidth = 2.2 * R; g.beginPath(); g.ellipse(x + dx, y - 9 * R, 4 * R, 9 * R, 0, 0, Math.PI * 2); g.stroke(); line(x + dx, y - 18 * R, x + dx, y, rgb(p.timber), R); }
        rect(x - 26 * R, y - 12 * R, 48 * R, 3.5 * R, rgb(p.bark)); rect(x - 26 * R, y - 12 * R, 48 * R, R, rgba(p.barkL, 0.4)); for (const dx of [-16 * R, 10 * R]){ poly(g, [[x + dx - 2 * R, y - 12 * R], [x + dx + 2 * R, y - 12 * R], [x + dx + 1.5 * R, y - 40 * R], [x + dx - 1.5 * R, y - 40 * R]], rgb(p.bark)); } rect(x - 18 * R, y - 40 * R, 30 * R, 3 * R, rgb(p.bark)); rect(x - 17 * R, y - 32 * R, 28 * R, 2.4 * R, rgb(p.barkD));
        for (let k = 0; k < 9; k++) ell(x - 15 * R + k * 3.2 * R, y - 22 * R, 1.8 * R, 5 * R, rgb(mix(rope, hx('#2a2418'), k & 1 ? 0.3 : 0))); line(x - 3 * R, y - 22 * R, x + 14 * R, y - 62 * R, rgb(p.bark), 2.6 * R); line(x - 3 * R, y - 22 * R, x + 14 * R, y - 62 * R, rgba(p.barkL, 0.3), 0.9 * R); ell(x + 15 * R, y - 63 * R, 4 * R, 2.4 * R, rgb(hx('#4a3c2c'))); ell(x + 15 * R, y - 63.5 * R, 2.6 * R, 1.4 * R, rgb(hx('#2a2218')));
        for (const [dx, dy] of [[-22, -12], [16, -12], [-16, -40], [10, -40]]) ell(x + dx * R, y + dy * R, 1.4 * R, 1.4 * R, rgb(p.iron)); }
      { const x = cx - W * 0.02, y = by - 4 * R; trestle(x, y, 13 * R, true); poly(g, [[x - 10 * R, y - 10.5 * R], [x + 9 * R, y - 11 * R], [x + 10 * R, y - 7 * R], [x - 9 * R, y - 6.5 * R]], rgb(mix(linen, p.thatchL, 0.3))); for (let i = 0; i < 4; i++) line(x - 8 * R + i * R, y - 9.5 * R + i * 0.6 * R, x + 6 * R + (i % 2) * 2 * R, y - 10 * R + i * 0.6 * R, rgba(hx('#2a2218'), 0.5), 0.5 * R); ell(x + 6 * R, y - 10 * R, 2 * R, 1.4 * R, rgb(p.stone)); }
      put(S('decor', 0, {k: 'rope'}), cx - W * 0.44, by + 3 * R); put(S('decor', 2, {k: 'rope'}), cx - W * 0.33, by + 4 * R); put(S('decor', 1, {k: 'crate'}), cx + W * 0.47, by + 2 * R);
    } else if (kind === 'alchemy'){
      // the alchemist: a one-cell house with a greener smoke from its chimney, a copper still on a tripod over a small fire with its worm coiling down to a flask, a shelf of dull glass bottles on brackets, herb bundles hung from a pole, a mortar on a crate
      tread(cx, by - 6 * R, W * 0.44, 10 * R);
      const asp = S('building', 2, {w: 1, d: 1, roof: 48}); put(asp, cx + W * 0.22, by - 6 * R);
      { const sx = TR && asp.chim ? cx + W * 0.22 + asp.chim.x : cx + W * 0.22 + 14 * R * L, sy = TR && asp.chim ? by - 6 * R + asp.chim.y : by - 6 * R - asp.ay + 14 * R; /* INDEX T29 */ for (let i = 0; i < 5; i++){ const t = i / 5; ell(sx + (r() - 0.5) * 6 * R + t * 10 * R * L, sy - t * 26 * R, (3 + t * 7) * R, (2.5 + t * 4) * R, rgba(hx('#7e8a76'), 0.24 * (1 - t))); } }
      const copper = hx(w ? '#6e4e36' : '#7e5a3a'), copperL = hx('#9a7450'), glass = [hx('#4a5a44'), hx('#6a5234'), hx('#3e4a52'), hx('#5a4a3a'), hx('#56604a')];
      { const x = cx - W * 0.28, y = by + R; ell(x, y, 10 * R, 3.2 * R, rgba(mudD, 0.6)); for (let i = 0; i < 6; i++) ell(x + (r() - 0.5) * 14 * R, y - r() * 1.5 * R, 1.8 * R, 1.2 * R, rgb(mix(p.stone, p.stoneD, r()))); ell(x, y - 2.5 * R, 3.5 * R, 1.6 * R, rgba(p.ember, 0.8)); ell(x, y - 3 * R, 1.6 * R, 0.9 * R, rgba(mix(p.ember, p.thatchL, 0.5), 0.9));
        for (const dx of [-7, 0, 7]) line(x + dx * R, y - R, x + dx * 0.25 * R, y - 22 * R, rgb(p.iron), 1.1 * R); ell(x, y - 13 * R, 9 * R, 7.5 * R, rgb(copper)); ell(x - 3 * R, y - 15 * R, 3.5 * R, 2.8 * R, rgba(copperL, 0.5)); rect(x - 2.5 * R, y - 27 * R, 5 * R, 8 * R, rgb(copper)); ell(x, y - 27 * R, 3.5 * R, 1.6 * R, rgb(copperL)); line(x + 2 * R, y - 25 * R, x + 14 * R, y - 22 * R, rgb(copper), 1.6 * R);
        for (let k = 0; k < 5; k++){ g.strokeStyle = rgb(copper); g.lineWidth = 1.3 * R; g.beginPath(); g.ellipse(x + 15 * R, y - 20 * R + k * 3 * R, 2.8 * R, 1.4 * R, 0, 0, Math.PI * 2); g.stroke(); } line(x + 15 * R, y - 7 * R, x + 18 * R, y - 4 * R, rgb(copper), 1.2 * R);
        ell(x + 20 * R, y + 2 * R, 4 * R, 1.6 * R, rgb(p.barkD)); rect(x + 17 * R, y - 4 * R, 6 * R, 6 * R, rgb(p.bark)); ell(x + 20 * R, y - 8 * R, 3.2 * R, 3.6 * R, rgb(glass[0])); rect(x + 19 * R, y - 14 * R, 2 * R, 4 * R, rgb(glass[0])); ell(x + 19 * R, y - 9 * R, R, 1.4 * R, rgba(p.stoneL, 0.4)); }
      { const x = cx + 2 * R, y = by - 30 * R; post(x, y - 10 * R, by - 2 * R, 1.3 * R); for (const dx of [-13, 13]) line(x + dx * R, y + 3 * R, x, y + 10 * R, rgb(p.barkD), 1.2 * R); rect(x - 15 * R, y, 30 * R, 2.4 * R, rgb(p.timber)); rect(x - 15 * R, y, 30 * R, 0.8 * R, rgba(cut, 0.6));
        for (let i = 0; i < 5; i++){ const bx = x - 12 * R + i * 6 * R, bh = (6 + (i * 7) % 4) * R, col = glass[i % glass.length]; rect(bx - 2 * R, y - bh, 4 * R, bh, rgb(col)); ell(bx, y - bh, 2 * R, R, rgb(mix(col, p.stoneL, 0.2))); rect(bx - R, y - bh - 3 * R, 2 * R, 3.2 * R, rgb(col)); rect(bx - 1.2 * R, y - bh - 4 * R, 2.4 * R, 1.4 * R, rgb(cut)); rect(bx - 1.6 * R, y - bh + 1.5 * R, 0.8 * R, bh - 3 * R, rgba(p.stoneL, 0.35)); } }
      { const x0 = cx - W * 0.44, x1 = cx - W * 0.1, yl = by - 46 * R; post(x0, yl - 4 * R, by - 4 * R, 1.2 * R); line(x0, yl - 2 * R, x1, yl - 4 * R, rgb(p.bark), 1.4 * R); for (let i = 0; i < 3; i++){ const t = 0.25 + i * 0.25, x = x0 + (x1 - x0) * t, y = yl - 2 * R - 2 * R * t; line(x, y, x, y + 4 * R, rgb(rope), 0.7 * R); for (let k = 0; k < 6; k++) line(x, y + 4 * R, x + (k - 2.5) * 1.6 * R, y + (11 + (k % 2) * 3) * R, rgb(mix(p.leafD, i ? p.needle : p.moss, 0.5)), 1.1 * R); ell(x, y + 5 * R, 1.4 * R, R, rgb(rope)); } }
      { const x = cx - W * 0.1, y = by + 4 * R; put(S('decor', 2, {k: 'crate'}), x, y); ell(x, y - 15 * R, 4 * R, 2.2 * R, rgb(p.stone)); ell(x, y - 16 * R, 2.8 * R, 1.2 * R, rgb(p.stoneD)); line(x + R, y - 17 * R, x + 4 * R, y - 22 * R, rgb(p.bark), 1.2 * R); }
    } else if (kind === 'magetower'){
      // the mage tower: a round tower of dressed stone on a plinth, a planked door under an arch, two slit windows with the upper one lit a dull amber, a conical slate roof with an iron finial, moss at the foot
      tread(cx, by - 4 * R, W * 0.4, 8 * R);
      if (window.ART37) ART37.paintTower({g, rect, ell, line, poly, courses, plankDoor, p, L, R, cx, by, mix, mul, rgb, rgba, hx, r, w, light}); else   /* INDEX ART37 */
      { const bw = 64 * R, bh = 104 * R, x0 = cx - bw / 2, y0 = by - 4 * R - bh;
        rect(x0 - 5 * R, by - 18 * R, bw + 10 * R, 14 * R, rgb(mix(p.stone, p.stoneD, 0.3))); for (let i = 0; i < 6; i++) rect(x0 - 5 * R + i * (bw + 10 * R) / 6 + 0.6 * R, by - 17.4 * R, (bw + 10 * R) / 6 - 1.2 * R, 6 * R, rgb(mul(p.stone, 0.8 + r() * 0.25))); for (let i = 0; i < 5; i++) rect(x0 - 2 * R + i * (bw + 4 * R) / 5 + 0.6 * R, by - 10.4 * R, (bw + 4 * R) / 5 - 1.2 * R, 6 * R, rgb(mul(p.stone, 0.78 + r() * 0.25)));
        courses(x0, y0, bw, bh - 14 * R, 7 * R, 16 * R); for (let i = 0; i < 4; i++){ const a = 0.1 + i * 0.12, ww = 4 * R; rect(x0 + i * ww, y0, ww, bh - 14 * R, rgba(p.stoneD, L > 0 ? a + 0.12 : a * 0.5)); rect(x0 + bw - (i + 1) * ww, y0, ww, bh - 14 * R, rgba(p.stoneD, L > 0 ? a * 0.5 : a + 0.12)); } rect(x0 + bw * (L > 0 ? 0.6 : 0.25), y0, bw * 0.15, bh - 14 * R, rgba(p.stoneL, 0.12));
        const dx = cx + 2 * R, dw = 26 * R, dh = 60 * R, dt = by - 4 * R - dh; poly(g, [[dx - dw / 2 - 3 * R, dt + dh], [dx - dw / 2 - 3 * R, dt + 10 * R], [dx - dw / 2 + 2 * R, dt - 4 * R], [dx, dt - 7 * R], [dx + dw / 2 - 2 * R, dt - 4 * R], [dx + dw / 2 + 3 * R, dt + 10 * R], [dx + dw / 2 + 3 * R, dt + dh]], rgb(p.stoneD)); plankDoor(dx, dt, dw, dh, true); ell(dx, by - 3 * R, dw * 0.8, 2.5 * R, rgb(mix(p.stoneL, p.stone, 0.5))); ell(dx, by - R, dw * 0.9, 2 * R, rgba(p.stoneL, 0.5));
        for (let i = 0; i < 2; i++){ const sx = cx + (i ? -14 : 12) * R, sy = y0 + (i ? 18 : 48) * R, sw = 7 * R, sh = 18 * R; rect(sx - sw / 2 - 1.5 * R, sy - 1.5 * R, sw + 3 * R, sh + 3 * R, rgb(p.stoneD)); if (i){ rect(sx - sw / 2, sy, sw, sh, rgb(hx('#9a7a40'))); rect(sx - sw / 2, sy, sw, sh * 0.5, rgba(hx('#c09a58'), 0.5)); ell(sx, sy + sh / 2, sw * 2.2, sh * 0.9, rgba(hx('#a8863c'), 0.12)); } else rect(sx - sw / 2, sy, sw, sh, rgb(hx('#100e0c'))); line(sx, sy, sx, sy + sh, rgb(p.iron), 0.8 * R); }
        for (let i = 0; i < 6; i++) ell(x0 + r() * bw, by - 6 * R - r() * 12 * R, (3 + r() * 3) * R, (2 + r() * 3) * R, rgba(p.moss, 0.45));
        const ry = y0 - R, rw = bw + 14 * R, rh = 48 * R; rect(x0 - 7 * R, ry - 3 * R, rw, 4 * R, rgb(mix(p.slate, hx('#0c0a08'), 0.4))); poly(g, [[x0 - 7 * R, ry - 2 * R], [x0 + bw + 7 * R, ry - 2 * R], [cx, ry - rh]], rgb(p.slate)); poly(g, L > 0 ? [[cx, ry - 2 * R], [x0 + bw + 7 * R, ry - 2 * R], [cx, ry - rh]] : [[x0 - 7 * R, ry - 2 * R], [cx, ry - 2 * R], [cx, ry - rh]], rgba(p.slateL, 0.14));
        for (let i = 1; i < 7; i++) line(x0 - 7 * R + rw * i / 7, ry - 2 * R, cx, ry - rh, rgba(hx('#0c0a08'), 0.35), 0.8 * R); for (let j = 1; j < 6; j++){ const t = j / 6; line(x0 - 7 * R + rw * 0.5 * t, ry - 2 * R - (rh - 2 * R) * t, x0 + bw + 7 * R - rw * 0.5 * t, ry - 2 * R - (rh - 2 * R) * t, rgba(p.slateL, 0.2), 0.7 * R); } if (w) poly(g, [[x0 - 7 * R + rw * 0.2, ry - 2 * R - rh * 0.4], [x0 + bw + 7 * R - rw * 0.2, ry - 2 * R - rh * 0.4], [cx, ry - rh]], rgba(p.snow, 0.8));
        line(cx, ry - rh, cx, ry - rh - 9 * R, rgb(p.iron), 1.2 * R); ell(cx, ry - rh - 9.5 * R, 2 * R, 2 * R, rgb(p.iron)); line(cx - 4 * R, ry - rh - 6 * R, cx + 4 * R, ry - rh - 6 * R, rgb(p.iron), R); }
    } else if (kind === 'chapel'){
      // the chapel: a stone nave with quoined corners under a slate roof, a bellcote on the ridge with its bell, a pointed door with iron straps, two arched windows of dull leaded glass, a lantern by the door, flags to the step, a bench log
      tread(cx, by - 5 * R, W * 0.42, 9 * R);
      { const bw = 92 * R, bh = 84 * R, x0 = cx - bw * 0.5, y0 = by - 4 * R - bh; courses(x0, y0, bw, bh, 7 * R, 18 * R); for (let i = 0; i < 12; i++){ const qh = 7 * R, qw = (i & 1 ? 6 : 9) * R; rect(x0 + 0.6 * R, y0 + i * qh + 0.6 * R, qw, qh - 1.2 * R, rgb(mul(p.stoneL, 0.9 + r() * 0.15))); rect(x0 + bw - qw - 0.6 * R, y0 + i * qh + 0.6 * R, qw, qh - 1.2 * R, rgb(mul(p.stoneL, 0.9 + r() * 0.15))); } rect(x0 + (L > 0 ? 0 : bw - 8 * R), y0, 8 * R, bh, rgba(p.stoneD, 0.4)); rect(x0, y0 + bh - 6 * R, bw, 6 * R, rgba(mudD, 0.35));
        slateRoof(x0 - 5 * R, y0, bw + 10 * R, 40 * R, 12 * R); rect(x0 - 5 * R, y0 - R, bw + 10 * R, 2.5 * R, rgba(hx('#0c0a08'), 0.4));
        const bt = y0 - 40 * R - 24 * R; rect(cx - 9 * R, bt + 2 * R, 18 * R, 22 * R, rgb(p.stone)); for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) rect(cx - 8.4 * R + k * 9 * R, bt + 2.6 * R + i * 7 * R, 8 * R, 6 * R, rgb(mul(p.stone, 0.82 + r() * 0.25))); poly(g, [[cx - 11 * R, bt + 3 * R], [cx, bt - 6 * R], [cx + 11 * R, bt + 3 * R]], rgb(p.slate)); rect(cx - 5 * R, bt + 7 * R, 10 * R, 14 * R, rgb(hx('#100e0c'))); ell(cx, bt + 7 * R, 5 * R, 3 * R, rgb(hx('#100e0c'))); ell(cx, bt + 13 * R, 3.2 * R, 3.6 * R, rgb(hx(w ? '#5a4e34' : '#6a5a38'))); ell(cx - R, bt + 12 * R, 1.2 * R, 1.6 * R, rgba(p.stoneL, 0.3)); rect(cx - 3.6 * R, bt + 15.5 * R, 7.2 * R, 1.4 * R, rgb(hx('#4a3e28'))); ell(cx, bt + 17.5 * R, 1.1 * R, 1.3 * R, rgb(p.iron));
        line(cx, bt - 6 * R, cx, bt - 14 * R, rgb(p.iron), 1.2 * R); line(cx - 3 * R, bt - 11 * R, cx + 3 * R, bt - 11 * R, rgb(p.iron), 1.1 * R);
        const dx = x0 + bw * 0.3, dw = 28 * R, dh = 74 * R, dt = by - 4 * R - dh; poly(g, [[dx - dw / 2 - 3 * R, dt + dh], [dx - dw / 2 - 3 * R, dt + dw * 0.4], [dx, dt - 4 * R], [dx + dw / 2 + 3 * R, dt + dw * 0.4], [dx + dw / 2 + 3 * R, dt + dh]], rgb(p.stoneD)); plankDoor(dx, dt, dw, dh, true);
        for (let i = 0; i < 2; i++){ const wx = x0 + bw * (0.62 + i * 0.22), wy = y0 + 14 * R, ww = 11 * R, wh = 26 * R; poly(g, [[wx - ww / 2 - 1.5 * R, wy + wh], [wx - ww / 2 - 1.5 * R, wy + ww * 0.5], [wx, wy - 2 * R], [wx + ww / 2 + 1.5 * R, wy + ww * 0.5], [wx + ww / 2 + 1.5 * R, wy + wh]], rgb(p.stoneD)); poly(g, [[wx - ww / 2, wy + wh], [wx - ww / 2, wy + ww * 0.5], [wx, wy], [wx + ww / 2, wy + ww * 0.5], [wx + ww / 2, wy + wh]], rgb(hx(i ? '#4a5a52' : '#5e4a3a'))); poly(g, [[wx - ww / 2, wy + wh], [wx - ww / 2, wy + ww * 0.5], [wx, wy], [wx, wy + wh]], rgba(hx(i ? '#5e4a3a' : '#4a5a52'), 0.5)); for (let k = 1; k < 4; k++) line(wx - ww / 2, wy + ww * 0.5 + (wh - ww * 0.5) * k / 4, wx + ww / 2, wy + ww * 0.5 + (wh - ww * 0.5) * k / 4, rgb(p.iron), 0.6 * R); line(wx, wy + 2 * R, wx, wy + wh, rgb(p.iron), 0.6 * R); ell(wx - ww * 0.2, wy + wh * 0.4, ww * 0.18, wh * 0.14, rgba(p.stoneL, 0.14)); }
        lantern(dx + dw / 2 + 8 * R, dt + dh * 0.5); for (let i = 0; i < 4; i++) ell(dx + (i - 1.5) * 3 * R, by + 2 * R + i * 0.4 * R, 5 * R, 2 * R, rgba(p.stoneL, 0.5)); }
      put(S('decor', 0, {k: 'benchlog'}), cx + W * 0.38, by + 3 * R);
    } else if (kind === 'church'){
      // the fortress church: a long quoined nave under slate with three arched windows, a square tower at its end under a pyramid cap and an iron cross, with belfry openings and a slit, the pointed door at the tower foot, a stone trough, a bench log
      tread(cx, by - 5 * R, W * 0.45, 9 * R);
      { const tw = 44 * R, th = 128 * R, tx = cx - W * 0.46, ty = by - 4 * R - th, nw = 98 * R, nh = 80 * R, nx = tx + tw - 4 * R, ny = by - 4 * R - nh;
        courses(nx, ny, nw, nh, 7 * R, 18 * R); for (let i = 0; i < 11; i++){ const qw = (i & 1 ? 6 : 9) * R; rect(nx + nw - qw - 0.6 * R, ny + i * 7 * R + 0.6 * R, qw, 5.8 * R, rgb(mul(p.stoneL, 0.9 + r() * 0.15))); } rect(nx, ny + nh - 6 * R, nw, 6 * R, rgba(mudD, 0.35)); if (L < 0) rect(nx + nw - 8 * R, ny, 8 * R, nh, rgba(p.stoneD, 0.4));
        slateRoof(nx - 2 * R, ny, nw + 8 * R, 36 * R, 10 * R); rect(nx - 2 * R, ny - R, nw + 8 * R, 2.5 * R, rgba(hx('#0c0a08'), 0.4));
        for (let i = 0; i < 3; i++) archWindow(nx + nw * (0.22 + i * 0.28), ny + 14 * R, 11 * R, 26 * R, i & 1);
        courses(tx, ty, tw, th, 7 * R, 14 * R); for (let i = 0; i < 18; i++){ const qw = (i & 1 ? 6 : 9) * R; rect(tx + 0.6 * R, ty + i * 7 * R + 0.6 * R, qw, 5.8 * R, rgb(mul(p.stoneL, 0.9 + r() * 0.15))); rect(tx + tw - qw - 0.6 * R, ty + i * 7 * R + 0.6 * R, qw, 5.8 * R, rgb(mul(p.stoneL, 0.9 + r() * 0.15))); } rect(tx + (L > 0 ? 0 : tw - 7 * R), ty, 7 * R, th, rgba(p.stoneD, 0.4)); rect(tx, ty + th - 6 * R, tw, 6 * R, rgba(mudD, 0.35));
        for (const dx of [-9, 9]){ const bx = tx + tw / 2 + dx * R, bt = ty + 12 * R; rect(bx - 4.5 * R, bt - 1.5 * R, 9 * R, 20 * R, rgb(p.stoneD)); rect(bx - 3 * R, bt, 6 * R, 18 * R, rgb(hx('#100e0c'))); ell(bx, bt, 3 * R, 2 * R, rgb(hx('#100e0c'))); line(bx, bt, bx, bt + 18 * R, rgb(p.iron), 0.6 * R); } ell(tx + tw / 2, ty + 21 * R, 2.6 * R, 3 * R, rgb(hx(w ? '#5a4e34' : '#6a5a38'))); rect(tx + tw / 2 - 5 * R, ty + 54 * R, 10 * R, 16 * R, rgb(p.stoneD)); rect(tx + tw / 2 - 3 * R, ty + 55 * R, 6 * R, 14 * R, rgb(hx('#100e0c')));
        const cxT = tx + tw / 2, cy = ty - R; rect(tx - 4 * R, cy - 3 * R, tw + 8 * R, 4 * R, rgb(mix(p.slate, hx('#0c0a08'), 0.4))); poly(g, [[tx - 4 * R, cy - 2 * R], [tx + tw + 4 * R, cy - 2 * R], [cxT, cy - 30 * R]], rgb(p.slate)); poly(g, L > 0 ? [[cxT, cy - 2 * R], [tx + tw + 4 * R, cy - 2 * R], [cxT, cy - 30 * R]] : [[tx - 4 * R, cy - 2 * R], [cxT, cy - 2 * R], [cxT, cy - 30 * R]], rgba(p.slateL, 0.14)); for (let i = 1; i < 5; i++) line(tx - 4 * R + (tw + 8 * R) * i / 5, cy - 2 * R, cxT, cy - 30 * R, rgba(hx('#0c0a08'), 0.35), 0.8 * R); if (w) poly(g, [[tx + 4 * R, cy - 12 * R], [tx + tw - 4 * R, cy - 12 * R], [cxT, cy - 30 * R]], rgba(p.snow, 0.8));
        line(cxT, cy - 30 * R, cxT, cy - 42 * R, rgb(p.iron), 1.3 * R); line(cxT - 4 * R, cy - 38 * R, cxT + 4 * R, cy - 38 * R, rgb(p.iron), 1.2 * R);
        const dx = cxT, dw = 26 * R, dh = 70 * R, dt = by - 4 * R - dh; poly(g, [[dx - dw / 2 - 3 * R, dt + dh], [dx - dw / 2 - 3 * R, dt + dw * 0.4], [dx, dt - 4 * R], [dx + dw / 2 + 3 * R, dt + dw * 0.4], [dx + dw / 2 + 3 * R, dt + dh]], rgb(p.stoneD)); plankDoor(dx, dt, dw, dh, true); for (let i = 0; i < 3; i++) ell(dx + (i - 1) * 4 * R, by + 2 * R + i * 0.4 * R, 6 * R, 2.2 * R, rgba(p.stoneL, 0.5)); lantern(nx + 10 * R, ny + nh * 0.45);
        { const x = cx + W * 0.3, y = by + 2 * R; ell(x, y, 14 * R, 3 * R, rgba(mudD, 0.5)); rect(x - 12 * R, y - 9 * R, 24 * R, 9 * R, rgb(mix(p.stone, p.stoneD, 0.3))); rect(x - 12 * R, y - 9 * R, 24 * R, 1.2 * R, rgba(p.stoneL, 0.5)); ell(x, y - 9 * R, 10.5 * R, 2.2 * R, rgb(hx('#2a3034'))); ell(x - 3 * R, y - 9.4 * R, 4 * R, 0.8 * R, rgba(p.stoneL, 0.35)); } }
      put(S('decor', 1, {k: 'benchlog'}), cx + W * 0.46, by + 3 * R);
    } else if (kind === 'kennels'){
      // the kennels: three plank dog-houses with dark round doors under shingle gables, chained to their posts, a run fenced behind, a water trough, a gnawed bone, straw in the mud
      tread(cx, by - 6 * R, W * 0.44, 10 * R); for (let i = 0; i < 14; i++) line(cx + (r() - 0.5) * W * 0.8, by - r() * 10 * R, cx + (r() - 0.5) * W * 0.8, by - r() * 10 * R, rgba(p.thatchL, 0.45), 0.8 * R);
      put(S('decor', 0, {k: 'fence'}), cx - W * 0.2, by - 30 * R); put(S('decor', 1, {k: 'fence'}), cx + W * 0.26, by - 32 * R);
      for (let i = 0; i < 3; i++){ const x = cx - W * 0.34 + i * 32 * R, y = by - 2 * R - (i === 1 ? 6 : 0) * R, hw = 12 * R, hh = 16 * R; ell(x, y + R, hw + 2 * R, 3 * R, rgba(mudD, 0.5)); rect(x - hw, y - hh, hw * 2, hh, rgb(mix(p.timber, p.barkD, 0.35))); for (let k = 1; k < 5; k++) line(x - hw, y - hh + hh * k / 5, x + hw, y - hh + hh * k / 5, rgba(hx('#0c0a08'), 0.4), 0.7 * R); rect(x - hw + (L > 0 ? 0 : hw * 1.6), y - hh, hw * 0.4, hh, rgba(hx('#0c0a08'), 0.25));
        poly(g, [[x - hw - 3 * R, y - hh + R], [x + hw + 3 * R, y - hh + R], [x, y - hh - 11 * R]], rgb(p.shingle)); poly(g, L > 0 ? [[x, y - hh + R], [x + hw + 3 * R, y - hh + R], [x, y - hh - 11 * R]] : [[x - hw - 3 * R, y - hh + R], [x, y - hh + R], [x, y - hh - 11 * R]], rgba(p.shingleL, 0.18)); for (let k = 1; k < 4; k++) line(x - hw - 3 * R + (hw + 3 * R) * k / 4, y - hh + R - 11 * R * k / 4 - 1 * R, x + hw + 3 * R - (hw + 3 * R) * k / 4, y - hh + R - 11 * R * k / 4 - 1 * R, rgba(hx('#0c0a08'), 0.3), 0.7 * R); if (w) poly(g, [[x - hw, y - hh - 3 * R], [x + hw, y - hh - 3 * R], [x, y - hh - 11 * R]], rgba(p.snow, 0.8));
        rect(x - 5 * R, y - 11 * R, 10 * R, 11 * R, rgb(hx('#100e0c'))); ell(x, y - 11 * R, 5 * R, 4 * R, rgb(hx('#100e0c'))); rect(x - 6 * R, y - 1.5 * R, 12 * R, 1.5 * R, rgba(p.stoneL, 0.25));
        const px = x + hw + 8 * R; post(px, y - 22 * R, y + R, 1.1 * R); for (let k = 0; k < 8; k++){ const t = k / 8; ell(px + (x + 3 * R - px) * t, y - 20 * R + 14 * R * Math.sin(t * Math.PI) + 10 * R * t, 1.1 * R, 0.9 * R, rgb(mix(p.iron, p.stoneL, k & 1 ? 0.2 : 0))); } }
      { const x = cx + W * 0.4, y = by + 2 * R, tw = 12 * R; ell(x, y, tw + 2 * R, 2.6 * R, rgba(mudD, 0.5)); rect(x - tw, y - 7 * R, tw * 2, 7 * R, rgb(mix(p.timber, p.barkD, 0.5))); for (const t of [0.3, 0.75]) rect(x - tw, y - 7 * R + 7 * R * t, tw * 2, 1.2 * R, rgb(p.iron)); ell(x, y - 7 * R, tw, 2 * R, rgb(hx('#2a3034'))); ell(x - 2 * R, y - 7.3 * R, 4 * R, 0.7 * R, rgba(p.stoneL, 0.35)); }
      put(S('decor', 2, {k: 'bones'}), cx - W * 0.1, by + 4 * R); { const x = cx + W * 0.16, y = by + 3 * R; ell(x, y, 4 * R, 1.5 * R, rgb(mix(p.stone, p.stoneD, 0.3))); ell(x, y - 0.8 * R, 2.8 * R, 0.8 * R, rgb(hx('#2a3034'))); }
    } else if (kind === 'gatehouse'){
      // the gatehouse: the timber gate between its two towers, a brazier lit by the post, a swing bar on a post with a stone counterweight, a spear rack, a crate and a barrel for the watch
      tread(cx, by - 6 * R, W * 0.46, 10 * R);
      put(S('gate', 1, {n: 2, stone: 0}), cx, by - 2 * R);
      brazier(cx - W * 0.38, by + R);
      { const x = cx + W * 0.4, y = by + R; post(x, y - 30 * R, y, 1.5 * R); line(x - 34 * R, y - 14 * R, x + 8 * R, y - 30 * R, rgb(p.bark), 2.2 * R); line(x - 34 * R, y - 14 * R, x + 8 * R, y - 30 * R, rgba(p.barkL, 0.3), 0.8 * R); ell(x + 9 * R, y - 32 * R, 4 * R, 3.5 * R, rgb(mix(p.stone, p.stoneD, 0.3))); ell(x, y - 27 * R, 1.3 * R, 1.3 * R, rgb(p.iron)); line(x - 34 * R, y - 14 * R, x - 34 * R, y - 2 * R, rgb(rope), 0.7 * R); }
      { const x = cx - W * 0.2, y = by + 3 * R; for (let i = 0; i < 4; i++){ const sx = x + i * 3.2 * R; line(sx, y, sx + 1.5 * R, y - 36 * R, rgb(p.bark), 1.1 * R); poly(g, [[sx + 0.6 * R, y - 36 * R], [sx + 2.4 * R, y - 36 * R], [sx + 1.8 * R, y - 42 * R]], rgb(p.iron)); } line(x - 2 * R, y - 12 * R, x + 12 * R, y - 13 * R, rgb(p.barkD), 1.2 * R); }
      put(S('decor', 0, {k: 'crate'}), cx + W * 0.2, by + 3 * R); put(S('decor', 2, {k: 'barrel'}), cx + W * 0.28, by + 2 * R);
    } else if (kind === 'watchtower'){
      // the watchtower: four timber legs cross-braced to a railed platform under a shingle hip roof, a ladder up the near leg, a brazier and a horn on the platform, a shield hung on the rail
      tread(cx, by - 2 * R, W * 0.4, 7 * R);
      { const top = by - 120 * R, legs = [[-26, -18], [26, 18]];
        for (const [bx, tx] of [[-19, -14], [19, 14]]) line(cx + bx * R, by - 6 * R, cx + tx * R, top - 2 * R, rgb(p.barkD), 2.2 * R);
        for (let k = 0; k < 3; k++){ const t0 = 0.1 + k * 0.28, t1 = t0 + 0.26; const xa = (t) => cx - (26 - 8 * t) * R, xb = (t) => cx + (26 - 8 * t) * R, yy = (t) => by - (120 * t) * R; line(xa(t0), yy(t0), xb(t1), yy(t1), rgb(mix(p.bark, p.barkD, 0.4)), 1.6 * R); line(xb(t0), yy(t0), xa(t1), yy(t1), rgb(mix(p.bark, p.barkD, 0.4)), 1.6 * R); line(xa(t1), yy(t1), xb(t1), yy(t1), rgb(p.bark), 1.4 * R); }
        for (const [bx, tx] of legs){ line(cx + bx * R, by, cx + tx * R, top, rgb(p.bark), 2.8 * R); line(cx + bx * R + 0.8 * R * L, by, cx + tx * R + 0.8 * R * L, top, rgba(p.barkL, 0.4), 0.9 * R); }
        for (let k = 0; k < 14; k++){ const t = (k + 0.5) / 14, x = cx + (26 - 8 * t) * R, y = by - 120 * t * R; line(x - 3 * R, y, x + 4 * R, y - 0.5 * R, rgb(p.timber), 1.1 * R); } line(cx + 30 * R, by, cx + 22 * R, top, rgb(p.bark), 1.4 * R);
        poly(g, [[cx - 34 * R, top], [cx + 34 * R, top], [cx + 32 * R, top - 6 * R], [cx - 32 * R, top - 6 * R]], rgb(p.timber)); rect(cx - 34 * R, top, 68 * R, 2 * R, rgba(hx('#0c0a08'), 0.4)); for (let k = 1; k < 8; k++) line(cx - 34 * R + 68 * R * k / 8, top, cx - 32 * R + 64 * R * k / 8, top - 6 * R, rgba(hx('#0c0a08'), 0.3), 0.7 * R);
        for (const dx of [-32, -11, 11, 32]) post(cx + dx * R, top - 22 * R, top - 6 * R, R); for (const yy of [top - 20 * R, top - 13 * R]) line(cx - 32 * R, yy, cx + 32 * R, yy, rgb(p.bark), 1.2 * R);
        for (const dx of [-30, 30]) line(cx + dx * R, top - 6 * R, cx + dx * 0.9 * R, top - 40 * R, rgb(p.barkD), 1.6 * R);
        poly(g, [[cx - 38 * R, top - 38 * R], [cx + 38 * R, top - 38 * R], [cx, top - 56 * R]], rgb(p.shingle)); poly(g, L > 0 ? [[cx, top - 38 * R], [cx + 38 * R, top - 38 * R], [cx, top - 56 * R]] : [[cx - 38 * R, top - 38 * R], [cx, top - 38 * R], [cx, top - 56 * R]], rgba(p.shingleL, 0.18)); for (let k = 1; k < 5; k++){ const t = k / 5; line(cx - 38 * R * (1 - t), top - 38 * R - 18 * R * t, cx + 38 * R * (1 - t), top - 38 * R - 18 * R * t, rgba(hx('#0c0a08'), 0.3), 0.7 * R); } rect(cx - 38 * R, top - 39 * R, 76 * R, 2.5 * R, rgba(hx('#0c0a08'), 0.4)); if (w) poly(g, [[cx - 20 * R, top - 47 * R], [cx + 20 * R, top - 47 * R], [cx, top - 56 * R]], rgba(p.snow, 0.8));
        brazier(cx + 14 * R, top - 6 * R); line(cx - 14 * R, top - 38 * R, cx - 14 * R, top - 30 * R, rgb(rope), 0.7 * R); poly(g, [[cx - 16 * R, top - 30 * R], [cx - 12 * R, top - 30 * R], [cx - 6 * R, top - 22 * R], [cx - 10 * R, top - 20 * R]], rgb(hx('#6a5a44'))); ell(cx - 8 * R, top - 21 * R, 2.2 * R, 1.6 * R, rgb(hx('#4a3e2c')));
        ell(cx + 22 * R, top - 14 * R, 5 * R, 6 * R, rgb(mix(p.timber, p.barkD, 0.4))); ell(cx + 22 * R, top - 14 * R, 1.6 * R, 1.6 * R, rgb(p.iron)); g.strokeStyle = rgb(p.iron); g.lineWidth = 0.8 * R; g.beginPath(); g.ellipse(cx + 22 * R, top - 14 * R, 5 * R, 6 * R, 0, 0, Math.PI * 2); g.stroke(); }
    } else if (kind === 'trapyard'){
      // the trap yard: a bench with a vice and a half-made jaw, a rack of iron spikes hung from a beam, a bear trap set and a scatter of caltrops, sharpened stakes bundled, a deadfall propped behind, a crate of parts
      tread(cx, by - 5 * R, W * 0.45, 9 * R);
      put(S('fprop', 0, {k: 'deadfall'}), cx + W * 0.4, by - 14 * R); put(S('fprop', 1, {k: 'stakes'}), cx + W * 0.3, by - 2 * R);
      { const x = cx - W * 0.3, y = by - 4 * R; trestle(x, y, 15 * R, true); rect(x + 7 * R, y - 15 * R, 6 * R, 5 * R, rgb(p.iron)); rect(x + 8 * R, y - 17 * R, 4 * R, 2 * R, rgb(p.iron)); line(x + 13 * R, y - 13 * R, x + 17 * R, y - 13 * R, rgb(p.iron), R); g.strokeStyle = rgb(p.iron); g.lineWidth = 1.2 * R; g.beginPath(); g.arc(x - 4 * R, y - 11 * R, 5 * R, Math.PI, Math.PI * 2); g.stroke(); for (let k = 0; k < 5; k++) line(x - 8 * R + k * 2 * R, y - 11 * R, x - 8 * R + k * 2 * R, y - 13.5 * R, rgb(p.iron), 0.7 * R);
        post(x - 18 * R, y - 40 * R, y, 1.1 * R); post(x + 18 * R, y - 38 * R, y - 2 * R, 1.1 * R); line(x - 19 * R, y - 38 * R, x + 19 * R, y - 36 * R, rgb(p.bark), 1.6 * R); for (let k = 0; k < 7; k++){ const sx = x - 15 * R + k * 5 * R, sy = y - 37 * R + k * 0.3 * R; line(sx, sy, sx, sy + 3 * R, rgb(rope), 0.6 * R); poly(g, [[sx - 1.2 * R, sy + 3 * R], [sx + 1.2 * R, sy + 3 * R], [sx, sy + (12 + (k % 3) * 2) * R]], rgb(mix(p.iron, p.stoneL, k & 1 ? 0.15 : 0))); } }
      put(S('fprop', 0, {k: 'beartrap'}), cx - W * 0.02, by + 2 * R); put(S('fprop', 0, {k: 'caltrops'}), cx + W * 0.14, by + 3 * R);
      put(S('decor', 1, {k: 'crate'}), cx - W * 0.46, by + 3 * R);
    } else if (kind === 'edelos'){
      // the Edelos traders: their wagon under a dusty plum pennant, an awning run out on two poles with a scalloped edge, a worn rug on the ground, a trestle of cloth bolts and a balance, a strongbox, a lantern on the pole, a hitching post
      tread(cx, by - 6 * R, W * 0.45, 10 * R);
      const plum = hx(w ? '#4e3a50' : '#5a3e58'), plumD = hx('#362634');
      const E37 = !!window.ART37, wsp = S('wagon', 1, E37 ? {edelos: 1} : undefined), wgx = cx + W * (E37 ? 0.2 : 0.22); put(wsp, wgx, by - 4 * R);   /* INDEX ART37: the covered wagon with its ox (js/art/art-sw11.js), one drawing for all three holdings */
      { const px = wgx + (E37 ? 30 : 18) * R, py = by - 4 * R - wsp.ay + 4 * R; line(px, py + 10 * R, px, py - 16 * R, rgb(p.bark), 1.2 * R); poly(g, [[px, py - 16 * R], [px + 14 * R * (L > 0 ? 1 : -1), py - 12 * R], [px, py - 7 * R]], rgb(plum)); }
      { const x0 = cx - W * (E37 ? 0.8 : 0.44), x1 = cx - W * (E37 ? 0.44 : 0.08), ground = by - 2 * R, top = ground - 44 * R; post(x0, top + 2 * R, ground, 1.3 * R); post(x1, top - 2 * R, ground + 2 * R, 1.3 * R);
        g.fillStyle = rgb(mix(p.canvas, plum, 0.4)); g.beginPath(); g.moveTo(x0 - 4 * R, top); g.lineTo(x1 + 6 * R, top - 4 * R); g.lineTo(x1 + 20 * R, top - 16 * R); g.lineTo(x0 - 6 * R, top - 10 * R); g.closePath(); g.fill(); poly(g, [[x0 - 4 * R, top], [x1 + 6 * R, top - 4 * R], [x1 + 6 * R, top - R], [x0 - 4 * R, top + 3 * R]], rgba(plumD, 0.6)); for (let k = 0; k < 7; k++){ const t = k / 7, x = x0 - 4 * R + (x1 - x0 + 10 * R) * t, y = top + 3 * R - 4 * R * t; poly(g, [[x, y - 2 * R], [x + (x1 - x0 + 10 * R) / 7, y - 2.6 * R], [x + (x1 - x0 + 10 * R) / 14, y + 2.5 * R]], rgb(plum)); } for (let k = 1; k < 4; k++) line(x0 - 5 * R + (x1 - x0 + 11 * R) * k / 4, top + 0.5 * R - 4 * R * k / 4, x0 - 6 * R + (x1 - x0 + 26 * R) * k / 4, top - 10 * R - 6 * R * k / 4, rgba(plumD, 0.3), 0.8 * R);
        lantern(x1 + 4 * R, top + 14 * R);
        poly(g, [[x0 + 2 * R, ground + 4 * R], [x1 + 10 * R, ground + 2 * R], [x1 + 14 * R, ground + 9 * R], [x0 - 2 * R, ground + 10 * R]], rgb(hx(w ? '#4e3a34' : '#5a3c32'))); poly(g, [[x0 + 5 * R, ground + 4.6 * R], [x1 + 7 * R, ground + 3 * R], [x1 + 10 * R, ground + 8 * R], [x0 + 2 * R, ground + 9 * R]], rgba(hx('#8a7a5a'), 0.25)); for (let k = 0; k < 3; k++) line(x0 + 6 * R, ground + 5.5 * R + k * 1.3 * R, x1 + 8 * R, ground + 4 * R + k * 1.3 * R, rgba(plumD, 0.5), 0.6 * R);
        const tx = (x0 + x1) / 2 + 2 * R, ty = ground - 2 * R; trestle(tx, ty, 14 * R, false); const bolts = [hx('#4a5a52'), plum, hx('#8a7a5a')]; for (let k = 0; k < 3; k++){ const bx = tx - 9 * R + k * 6 * R, by2 = ty - 11 * R - (k === 1 ? 4 : 0) * R; rect(bx - 2.5 * R, by2 - 16 * R, 5 * R, 16 * R, rgb(bolts[k])); ell(bx, by2 - 16 * R, 2.5 * R, 1.4 * R, rgb(mix(bolts[k], p.stoneL, 0.3))); ell(bx, by2 - 16 * R, 1.2 * R, 0.6 * R, rgb(mix(bolts[k], hx('#0c0a08'), 0.4))); rect(bx - 2.5 * R, by2 - 16 * R, R, 16 * R, rgba(p.stoneL, 0.2)); }
        line(tx + 10 * R, ty - 11 * R, tx + 10 * R, ty - 20 * R, rgb(p.iron), 0.9 * R); line(tx + 5 * R, ty - 19 * R, tx + 15 * R, ty - 19 * R, rgb(p.iron), 0.8 * R); for (const dx of [5, 15]){ line(tx + dx * R, ty - 19 * R, tx + dx * R, ty - 14 * R, rgb(rope), 0.5 * R); ell(tx + dx * R, ty - 14 * R, 2 * R, 0.8 * R, rgb(mix(p.iron, p.thatchL, 0.3))); } }
      put(S('mprop', 0, {k: 'chest'}), cx - W * (E37 ? 0.6 : 0.02), by + (E37 ? 8 : 3) * R);
      { const x = cx + W * 0.47, y = by + R; post(x, y - 20 * R, y, 1.3 * R); g.strokeStyle = rgb(p.iron); g.lineWidth = 0.9 * R; g.beginPath(); g.ellipse(x + 1.5 * R * L, y - 15 * R, 1.8 * R, 2.2 * R, 0, 0, Math.PI * 2); g.stroke(); }
    }
    else if (kind === 'b_deckhouse'){ deckhouse(o.big ? 128 * R : 108 * R, 58 * R, tarC(o.roof), o.g, false); barrel(cx - W * 0.46, by - 2 * R, 16 * R, 22 * R); }
    else if (kind === 'b_grog'){ const d = deckhouse(104 * R, 58 * R, tarC(o.roof), o.g || 'mug', true); const ax = d.x0 - 2 * R; post(ax - 26 * R, by - 40 * R, by - 2 * R, 1.6 * R); poly(g, [[ax - 30 * R, by - 40 * R], [ax + 6 * R, by - 50 * R], [ax + 6 * R, by - 44 * R], [ax - 30 * R, by - 35 * R]], rgb(p.canvasD)); poly(g, [[ax - 30 * R, by - 40 * R], [ax + 6 * R, by - 50 * R], [ax + 6 * R, by - 47 * R], [ax - 30 * R, by - 37.5 * R]], rgba(p.canvasL, 0.3));
      barrel(ax - 20 * R, by - 2 * R, 16 * R, 20 * R); barrel(ax - 4 * R, by - 2 * R, 16 * R, 20 * R); barrel(ax - 12 * R, by - 21 * R, 16 * R, 20 * R); for (const [mx, my] of [[ax - 26 * R, by - 44 * R], [ax - 16 * R, by - 45 * R]]) rect(mx, my - 4 * R, 3 * R, 4 * R, rgb(p.iron)); }
    else if (kind === 'b_fightdeck'){ const d = deckhouse(128 * R, 58 * R, tarC(o.roof), o.g || 'shield', false); for (let i = 0; i < 4; i++){ const sx = d.x0 + 14 * R + i * 15 * R, sy = d.y0 + 18 * R; ell(sx, sy, 6.5 * R, 7.5 * R, rgb(i % 2 ? mix(p.timber, p.barkD, 0.3) : mix(p.iron, p.stoneD, 0.4))); ell(sx, sy, 2 * R, 2 * R, rgb(p.iron)); ell(sx - 2 * R, sy - 3 * R, 2 * R, 1.5 * R, rgba(p.stoneL, 0.22)); }
      const rx = cx + W * 0.47; post(rx - 8 * R, by - 30 * R, by - 2 * R, 1.4 * R); post(rx + 8 * R, by - 30 * R, by - 2 * R, 1.4 * R); line(rx - 9 * R, by - 26 * R, rx + 9 * R, by - 26 * R, rgb(p.timber), 2 * R); for (const dx of [-5, 0, 5]){ line(rx + dx * R, by - 2 * R, rx + dx * R * 1.1, by - 42 * R, rgb(p.bark), 1.1 * R); poly(g, [[rx + dx * R * 1.1 - 1.5 * R, by - 42 * R], [rx + dx * R * 1.1 + 1.5 * R, by - 42 * R], [rx + dx * R * 1.1, by - 48 * R]], rgb(p.iron)); }
      ell(cx - W * 0.44, by - 2 * R, 7 * R, 3 * R, rgb(p.iron)); rect(cx - W * 0.44 - 7 * R, by - 12 * R, 14 * R, 10 * R, rgb(p.iron)); ell(cx - W * 0.44, by - 12 * R, 7 * R, 3 * R, rgb(mix(p.stoneL, p.thatch, 0.5))); }
    else if (kind === 'b_tarp'){ const cc = lookC(o.c, 0.35), tw = W * 0.42, top = by - 46 * R; for (const [dx, h] of [[-tw, 42], [tw, 42], [-tw * 0.75, 50], [tw * 0.75, 50]]) post(cx + dx, by - h * R, by - 2 * R, 1.5 * R);
      poly(g, [[cx - tw - 4 * R, top + 4 * R], [cx - tw * 0.75, top - 4 * R], [cx + tw * 0.75, top - 6 * R], [cx + tw + 4 * R, top + 2 * R], [cx + tw * 0.3, top + 10 * R], [cx - tw * 0.3, top + 11 * R]], rgb(cc)); poly(g, [[cx - tw - 4 * R, top + 4 * R], [cx - tw * 0.75, top - 4 * R], [cx - tw * 0.3, top + 11 * R]], rgba(p.canvasD, 0.35)); poly(g, [[cx + tw * 0.75, top - 6 * R], [cx + tw + 4 * R, top + 2 * R], [cx + tw * 0.3, top + 10 * R]], rgba(p.canvasL, 0.25));
      for (let i = 0; i < 5; i++) line(cx - tw * 0.6 + i * tw * 0.3, top - 3 * R + i % 2 * 2 * R, cx - tw * 0.3 + i * tw * 0.15, top + 10 * R, rgba(hx('#0c0a08'), 0.12), 0.8 * R); for (const sx of [-1, 1]){ line(cx + sx * (tw + 4 * R), top + 3 * R, cx + sx * (tw + 12 * R), by - 2 * R, rgb(rope), 0.9 * R); cleat(cx + sx * (tw + 12 * R), by - 2 * R); }
      if (o.cross){ rect(cx - 2.5 * R, top - 2 * R, 5 * R, 14 * R, rgba(hx('#8a5a34'), 0.8)); rect(cx - 7 * R, top + 2.5 * R, 14 * R, 5 * R, rgba(hx('#8a5a34'), 0.8)); }
      if (o.cross){ rect(cx - 22 * R, by - 14 * R, 36 * R, 4 * R, rgb(p.timber)); for (const dx of [-20, 12]) line(cx + dx * R, by - 2 * R, cx + dx * R, by - 12 * R, rgb(p.bark), 1.4 * R); rect(cx - 22 * R, by - 18 * R, 36 * R, 5 * R, rgb(linen)); ell(cx + 10 * R, by - 20 * R, 5 * R, 3 * R, rgb(mix(linen, p.canvasL, 0.3))); }
      else if (o.g === 'hide'){ for (let i = 0; i < 3; i++){ const hx0 = cx - 24 * R + i * 20 * R; poly(g, [[hx0 - 8 * R, by - 4 * R], [hx0 - 6 * R, by - 20 * R], [hx0 + 7 * R, by - 20 * R], [hx0 + 9 * R, by - 4 * R]], rgb(mix(hx('#7a5a3a'), p.barkD, 0.2 + i * 0.2))); line(hx0 - 6 * R, by - 20 * R, hx0 + 7 * R, by - 20 * R, rgb(rope), 0.8 * R); } }
      else { for (let i = 0; i < 3; i++){ const bx = cx - 26 * R + i * 24 * R; ell(bx, by - 4 * R, 11 * R, 4.5 * R, rgb(mix(p.canvasD, hx(['#5a4a3a', '#4a4a42', '#5e5040'][i]), 0.6))); ell(bx - 7 * R, by - 5 * R, 4 * R, 3 * R, rgb(linen)); } }
      coil(cx + tw + 2 * R, by - 3 * R); }
    else if (kind === 'b_galley' || kind === 'w_galley'){ const sw = 56 * R, sh = 34 * R, x0 = cx - sw / 2 - 10 * R, y0 = by - 4 * R - sh; courses(x0, y0, sw, sh, 6 * R, 12 * R, mix(hx('#7a5a4a'), p.stone, 0.5)); rect(x0 - 2 * R, y0 - 3 * R, sw + 4 * R, 4 * R, rgb(p.iron)); rect(x0 + 6 * R, y0 + 10 * R, 16 * R, 14 * R, rgb(hx('#16120e'))); ell(x0 + 14 * R, y0 + 18 * R, 5 * R, 3 * R, rgba(p.ember, 0.85)); ell(x0 + 14 * R, y0 + 16 * R, 9 * R, 6 * R, rgba(p.ember, 0.12));
      const px = x0 + sw - 16 * R; ell(px, y0 - 3 * R, 11 * R, 4 * R, rgb(p.iron)); poly(g, [[px - 11 * R, y0 - 3 * R], [px + 11 * R, y0 - 3 * R], [px + 9 * R, y0 - 16 * R], [px - 9 * R, y0 - 16 * R]], rgb(mix(p.iron, p.stoneD, 0.3))); ell(px, y0 - 16 * R, 9 * R, 3.2 * R, rgb(mix(p.iron, p.stoneL, 0.2))); g.strokeStyle = rgb(p.iron); g.lineWidth = 1.2 * R; g.beginPath(); g.arc(px, y0 - 16 * R, 9 * R, Math.PI, 0); g.stroke();
      const fx = x0 + 10 * R; rect(fx - 3 * R, y0 - 30 * R, 6 * R, 28 * R, rgb(p.iron)); rect(fx - 5 * R, y0 - 33 * R, 10 * R, 4 * R, rgb(p.iron)); smoke(fx, y0 - 34 * R, 5); for (const dx of [-8, 0, 8]) line(fx + 24 * R + dx * R, y0 - 24 * R, fx + 24 * R + dx * R, y0 - 10 * R, rgb(p.iron), 1.2 * R); line(fx + 12 * R, y0 - 24 * R, fx + 36 * R, y0 - 24 * R, rgb(p.bark), 1.6 * R); for (const dx of [-8, 0, 8]) ell(fx + 24 * R + dx * R, y0 - 9 * R, 2.6 * R, 2 * R, rgb(mix(p.iron, p.stoneL, 0.25)));
      barrel(cx + W * 0.38, by - 2 * R, 17 * R, 24 * R); rect(cx + W * 0.16, by - 14 * R, 22 * R, 12 * R, rgb(mix(p.timber, p.barkD, 0.2))); for (let i = 0; i < 4; i++) ell(cx + W * 0.16 + 4 * R + i * 5 * R, by - 14 * R, 3.5 * R, 1.6 * R, rgb(mix(p.slateL, p.stoneL, 0.4 + r() * 0.3))); }
    else if (kind === 'b_hatch'){ const hw = 84 * R, hh = 14 * R, x0 = cx - hw / 2, y0 = by - 6 * R - hh; planks(x0, y0, hw, hh, mix(p.timber, p.barkL, 0.05), 14 * R); rect(x0 - 2 * R, y0 - 2 * R, hw + 4 * R, 3 * R, rgb(mix(p.timber, p.barkL, 0.25))); for (const dx of [6, hw - 6 * R]) rect(x0 + dx * (dx < 10 ? R : 1) - 2 * R, y0 + 2 * R, 4 * R, 4 * R, rgb(p.iron));
      if (o.dark){ rect(x0 + 4 * R, y0 - 6 * R, hw - 8 * R, 5 * R, rgb(hx('#16120e'))); for (let i = 1; i < 9; i++) line(x0 + 4 * R + (hw - 8 * R) * i / 9, y0 - 6 * R, x0 + 4 * R + (hw - 8 * R) * i / 9, y0 - R, rgb(p.iron), 1.2 * R); rect(x0 + hw / 2 - 6 * R, y0 - 4 * R, 12 * R, 3 * R, rgb(p.iron)); ell(x0 + hw / 2, y0 - 2.5 * R, 2 * R, 2 * R, rgb(mix(p.iron, p.stoneL, 0.3))); }
      else { rect(x0 + 4 * R, y0 - 4 * R, hw - 8 * R, 3 * R, rgb(hx('#16120e'))); const lx = x0 + hw * 0.5, lw2 = hw - 10 * R; poly(g, [[lx - lw2 / 2, y0 - 2 * R], [lx + lw2 / 2, y0 - 2 * R], [lx + lw2 / 2 - 6 * R, y0 - 30 * R], [lx - lw2 / 2 + 6 * R, y0 - 30 * R]], rgb(mix(p.timber, p.barkL, 0.1))); for (let i = 1; i < 6; i++) line(lx - lw2 / 2 + lw2 * i / 6, y0 - 2 * R, lx - lw2 / 2 + 6 * R + (lw2 - 12 * R) * i / 6, y0 - 30 * R, rgba(hx('#0c0a08'), 0.5), 0.9 * R); for (let j = 1; j < 4; j++) line(lx - lw2 / 2 + 1.5 * j * R, y0 - 2 * R - 7 * j * R, lx + lw2 / 2 - 1.5 * j * R, y0 - 2 * R - 7 * j * R, rgba(hx('#0c0a08'), 0.5), 0.9 * R); line(lx + lw2 / 2 - 6 * R, y0 - 30 * R, lx + lw2 / 2 + 10 * R, y0 - 2 * R, rgb(p.bark), 1.4 * R); }
      if (o.smoke){ const fx = x0 + hw - 8 * R; rect(fx - 2.5 * R, y0 - 34 * R, 5 * R, 30 * R, rgb(p.iron)); rect(fx - 4.5 * R, y0 - 37 * R, 9 * R, 3.5 * R, rgb(p.iron)); smoke(fx, y0 - 38 * R, 5); ell(fx - 14 * R, y0 - 2 * R, 5 * R, 2 * R, rgba(p.ember, 0.2)); }
      sign(x0 - 12 * R, by - 2 * R, o.g, false); barrel(x0 + hw + 14 * R, by - 2 * R, 15 * R, 20 * R); coil(cx + 10 * R, by - 2 * R); }
    else if (kind === 'b_rigging'){ const mx = cx - W * 0.1, top = by - 140 * R; post(mx, top, by - 2 * R, 4 * R); rect(mx - 4.5 * R, top, 9 * R, 3 * R, rgb(p.iron)); rect(mx - 4.5 * R, by - 40 * R, 9 * R, 3 * R, rgb(p.iron)); ratlines(mx - W * 0.42, by - 2 * R, mx - W * 0.1, by - 2 * R, mx, top + 30 * R, 9); ratlines(mx + W * 0.12, by - 2 * R, mx + W * 0.44, by - 2 * R, mx, top + 30 * R, 9); for (const dx of [-W * 0.42, -W * 0.1, W * 0.12, W * 0.44]) cleat(mx + dx, by - 2 * R);
      const dy = by - 54 * R; line(mx + 2 * R, top + 40 * R, mx + 30 * R, dy - 36 * R, rgb(rope), R); line(mx + 30 * R, dy - 36 * R, mx + 30 * R, dy - 28 * R, rgb(rope), 0.9 * R); ell(mx + 30 * R, dy - 22 * R, 5 * R, 5.5 * R, rgb(p.canvasD)); rect(mx + 22 * R, dy - 17 * R, 16 * R, 22 * R, rgb(mix(p.canvasD, p.barkD, 0.3))); for (let i = 0; i < 3; i++) line(mx + 22 * R, dy - 12 * R + i * 7 * R, mx + 38 * R, dy - 12 * R + i * 7 * R, rgb(rope), 0.8 * R); for (const dx of [-3, 6]) line(mx + 30 * R + dx * R, dy - 14 * R, mx + 30 * R + dx * R * 2, dy - 30 * R, rgba(p.stoneL, 0.5), 0.6 * R);
      coil(mx - 20 * R, by - 3 * R); coil(mx + 48 * R, by - 3 * R); barrel(mx - 44 * R, by - 2 * R, 15 * R, 20 * R); }
    else if (kind === 'b_mast'){ const top = by - 144 * R; post(cx, top, by - 2 * R, 4.5 * R); rect(cx - 5 * R, by - 20 * R, 10 * R, 4 * R, rgb(p.iron)); ratlines(cx - W * 0.46, by - 2 * R, cx - 6 * R, by - 2 * R, cx, by - 70 * R, 10); ratlines(cx + 6 * R, by - 2 * R, cx + W * 0.46, by - 2 * R, cx, by - 70 * R, 10); for (const dx of [-W * 0.46, W * 0.46]) cleat(cx + dx, by - 2 * R);
      const ny = by - 72 * R; poly(g, [[cx - 13 * R, ny], [cx + 13 * R, ny], [cx + 15 * R, ny - 18 * R], [cx - 15 * R, ny - 18 * R]], rgb(mix(p.timber, p.barkD, 0.25))); for (let i = 1; i < 6; i++) line(cx - 13 * R + 26 * R * i / 6, ny, cx - 15 * R + 30 * R * i / 6, ny - 18 * R, rgba(hx('#0c0a08'), 0.45), 0.8 * R); rect(cx - 15 * R, ny - 19 * R, 30 * R, 2.4 * R, rgb(p.iron)); rect(cx - 13 * R, ny - R, 26 * R, 2 * R, rgb(p.iron)); post(cx, top, ny - 18 * R, 3 * R); line(cx - 12 * R, ny - 8 * R, cx - 2 * R, ny + 20 * R, rgb(rope), 0.9 * R);
      if (o.orb){ line(cx, top, cx + 12 * R, top + 6 * R, rgb(p.iron), 1.2 * R); line(cx + 12 * R, top + 6 * R, cx + 12 * R, top + 12 * R, rgb(p.iron), 0.9 * R); ell(cx + 12 * R, top + 17 * R, 5 * R, 5 * R, rgb(p.iron)); ell(cx + 12 * R, top + 17 * R, 3.6 * R, 3.6 * R, rgb(hx('#6a7a7e'))); ell(cx + 11 * R, top + 16 * R, 1.2 * R, 1 * R, rgba(p.stoneL, 0.6)); ell(cx + 12 * R, top + 17 * R, 11 * R, 9 * R, rgba(hx('#8aa0a8'), 0.08)); }
      else { poly(g, [[cx + 2 * R, top + 2 * R], [cx + 26 * R, top + 8 * R], [cx + 2 * R, top + 16 * R]], rgb(mix(p.canvasD, hx('#6a5a4a'), 0.5))); poly(g, [[cx + 2 * R, top + 2 * R], [cx + 26 * R, top + 8 * R], [cx + 8 * R, top + 9 * R]], rgba(p.canvasL, 0.18)); }
      if (o.g === 'bow'){ line(cx + 8 * R, by - 44 * R, cx + 14 * R, by - 22 * R, rgb(p.bark), 1.2 * R); g.strokeStyle = rgb(rope); g.lineWidth = 0.6 * R; g.beginPath(); g.moveTo(cx + 8 * R, by - 44 * R); g.lineTo(cx + 14 * R, by - 22 * R); g.stroke(); }
      sign(cx - 16 * R, by - 2 * R, o.g, false); coil(cx + 20 * R, by - 3 * R); }
    else if (kind === 'b_bench' || kind === 'w_bench'){ trestle(cx - 10 * R, by - 4 * R, 44 * R, true); rect(cx - 54 * R, by - 15 * R, 88 * R, 2 * R, rgba(p.barkL, 0.25)); const vx = cx + 22 * R; rect(vx - 5 * R, by - 20 * R, 10 * R, 6 * R, rgb(p.iron)); rect(vx - 3 * R, by - 26 * R, 6 * R, 6 * R, rgb(p.iron)); line(vx - 9 * R, by - 18 * R, vx + 9 * R, by - 18 * R, rgb(p.iron), 1.4 * R);
      if (o.g === 'stake'){ for (let i = 0; i < 4; i++) poly(g, [[cx - 44 * R + i * 8 * R, by - 15 * R], [cx - 41 * R + i * 8 * R, by - 15 * R], [cx - 42.5 * R + i * 8 * R, by - 34 * R]], rgb(mix(p.timber, p.barkL, 0.3))); for (let i = 0; i < 3; i++) poly(g, [[cx + 40 * R + i * 2 * R, by - 2 * R], [cx + 46 * R + i * 2 * R, by - 20 * R - i * 4 * R], [cx + 50 * R + i * 2 * R, by - 2 * R]], rgb(p.timber)); }
      else { line(cx - 40 * R, by - 18 * R, cx - 6 * R, by - 24 * R, rgb(mix(p.iron, p.stoneL, 0.3)), 2.2 * R); rect(cx - 44 * R, by - 20 * R, 8 * R, 5 * R, rgb(p.bark)); for (let i = 0; i < 6; i++) line(cx - 36 * R + i * 5 * R, by - 20 * R + i * 0.9 * R, cx - 34 * R + i * 5 * R, by - 17 * R + i * 0.9 * R, rgb(mix(p.iron, p.stoneL, 0.3)), 0.9 * R); for (let i = 0; i < 4; i++) rect(cx + 36 * R, by - 6 * R - i * 4 * R, 30 * R, 3 * R, rgb(mix(p.timber, i % 2 ? p.barkL : p.barkD, 0.2))); for (let i = 0; i < 8; i++) ell(cx - 30 * R + r() * 50 * R, by - 2 * R + r() * 4 * R, (2 + r() * 2) * R, R, rgba(p.thatchL, 0.35)); }
      rect(cx - 70 * R, by - 16 * R, 20 * R, 14 * R, rgb(mix(p.timber, p.barkD, 0.2))); line(cx - 70 * R, by - 9 * R, cx - 50 * R, by - 9 * R, rgba(hx('#0c0a08'), 0.4), 0.8 * R); sign(cx + 60 * R, by - 2 * R, o.g, false); }
    else if (kind === 'b_cannon'){ const bx = cx - 6 * R, bb = by - 4 * R; for (const dx of [-30, 18]) ell(bx + dx * R, bb, 7 * R, 7 * R, rgb(mix(p.timber, p.barkD, 0.35))); for (const dx of [-30, 18]) ell(bx + dx * R, bb, 2.5 * R, 2.5 * R, rgb(p.iron)); poly(g, [[bx - 40 * R, bb - 6 * R], [bx + 30 * R, bb - 6 * R], [bx + 26 * R, bb - 20 * R], [bx - 36 * R, bb - 26 * R]], rgb(mix(p.timber, p.barkD, 0.25))); rect(bx - 40 * R, bb - 6 * R, 70 * R, R, rgba(p.barkL, 0.3)); for (const t of [0.2, 0.75]) line(bx - 40 * R + 70 * R * t, bb - 6 * R, bx - 36 * R + 62 * R * t, bb - 23 * R, rgb(p.iron), 1.4 * R);
      g.save(); g.translate(bx - 6 * R, bb - 24 * R); g.rotate(-0.22); poly(g, [[-48 * R, -7 * R], [40 * R, -5 * R], [40 * R, 5 * R], [-48 * R, 7 * R]], rgb(mix(p.iron, p.stoneD, 0.3))); poly(g, [[-48 * R, -7 * R], [40 * R, -5 * R], [40 * R, -2 * R], [-48 * R, -3 * R]], rgba(p.stoneL, 0.14)); for (const x of [-30, -6, 30]) rect(x * R, -7.5 * R, 3 * R, 15 * R, rgb(mix(p.iron, p.stoneL, 0.2))); ell(-50 * R, 0, 4 * R, 5 * R, rgb(p.iron)); ell(42 * R, 0, 2 * R, 4.2 * R, rgb(hx('#0c0a08'))); g.restore();
      for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) ell(cx + 54 * R + (j - i / 2) * 9 * R, by - 5 * R - (2 - i) * 7 * R, 4.4 * R, 4.4 * R, rgb(mix(p.iron, p.stoneD, 0.2 + j * 0.1))); barrel(cx - 62 * R, by - 2 * R, 15 * R, 18 * R); line(cx - 70 * R, by - 2 * R, cx - 46 * R, by - 44 * R, rgb(p.bark), 1.4 * R); ell(cx - 46 * R, by - 45 * R, 3 * R, 3 * R, rgb(mix(p.canvasD, p.barkD, 0.3))); }
    else if (kind === 'b_shrine'){ const sw = 54 * R, x0 = cx - sw / 2, bot = by - 4 * R, top = bot - 60 * R; rect(x0 - 6 * R, bot - 8 * R, sw + 12 * R, 8 * R, rgb(mix(p.timber, p.barkD, 0.3))); rect(x0 - 6 * R, bot - 8 * R, sw + 12 * R, R, rgba(p.barkL, 0.3)); post(x0, top, bot - 8 * R, 2 * R); post(x0 + sw, top, bot - 8 * R, 2 * R); planks(x0 + 2 * R, top + 4 * R, sw - 4 * R, 44 * R, mix(p.timber, p.barkD, 0.45), 6 * R);
      poly(g, [[x0 - 10 * R, top + 6 * R], [cx, top - 22 * R], [x0 + sw + 10 * R, top + 6 * R]], rgb(p.shingle)); poly(g, L > 0 ? [[cx, top + 6 * R], [cx, top - 22 * R], [x0 + sw + 10 * R, top + 6 * R]] : [[x0 - 10 * R, top + 6 * R], [cx, top - 22 * R], [cx, top + 6 * R]], rgba(p.shingleL, 0.14)); for (let j = 1; j < 5; j++) line(x0 - 10 * R + (cx - x0 + 10 * R) * j / 5, top + 6 * R - 28 * R * j / 5, x0 + sw + 10 * R - (x0 + sw + 10 * R - cx) * j / 5, top + 6 * R - 28 * R * j / 5, rgba(hx('#0c0a08'), 0.3), 0.8 * R); if (w) poly(g, [[x0 - 8 * R, top + 5 * R], [cx, top - 20 * R], [x0 + sw + 8 * R, top + 5 * R], [x0 + sw, top + 5 * R], [cx, top - 12 * R], [x0 + 2 * R, top + 5 * R]], rgba(p.snow, 0.8));
      poly(g, [[cx - 9 * R, bot - 10 * R], [cx - 9 * R, top + 22 * R], [cx, top + 12 * R], [cx + 9 * R, top + 22 * R], [cx + 9 * R, bot - 10 * R]], rgb(hx('#16120e'))); poly(g, [[cx - 6 * R, bot - 12 * R], [cx - 6 * R, top + 24 * R], [cx, top + 18 * R], [cx + 6 * R, top + 24 * R], [cx + 6 * R, bot - 12 * R]], rgb(mix(p.stone, p.timber, 0.4))); ell(cx, top + 30 * R, 3 * R, 3.5 * R, rgb(p.stoneD)); poly(g, [[cx - 4 * R, top + 34 * R], [cx + 4 * R, top + 34 * R], [cx + 3 * R, bot - 14 * R], [cx - 3 * R, bot - 14 * R]], rgb(p.stoneD));
      for (const dx of [-16, -11, 11, 16]){ rect(cx + dx * R - 1.2 * R, bot - 16 * R, 2.4 * R, 7 * R, rgb(linen)); ell(cx + dx * R, bot - 17 * R, 1 * R, 1.6 * R, rgba(mix(p.ember, p.thatchL, 0.6), 0.9)); ell(cx + dx * R, bot - 18 * R, 5 * R, 4 * R, rgba(p.ember, 0.1)); } for (const dx of [-22, 22]){ line(cx + dx * R, top + 8 * R, cx + dx * R, top + 26 * R, rgb(rope), 0.9 * R); for (let i = 0; i < 3; i++) ell(cx + dx * R, top + 14 * R + i * 5 * R, 1.6 * R, 1.6 * R, rgb(rope)); }
      ell(cx, bot - 2 * R, 10 * R, 3 * R, rgb(mix(p.iron, p.stoneD, 0.4))); ell(cx - 2 * R, bot - 3 * R, 3 * R, 1.5 * R, rgba(p.wet, 0.6)); ell(cx + 4 * R, bot - 3.5 * R, 2 * R, 1.2 * R, rgba(p.wet, 0.6)); coil(x0 - 18 * R, by - 3 * R); }
    else if (kind === 'b_nets'){ const nw = W * 0.36, top = by - 70 * R; for (const dx of [-nw, nw]){ post(cx + dx, top, by - 2 * R, 2.2 * R); rect(cx + dx - 2.5 * R, top - R, 5 * R, 3 * R, rgb(p.iron)); } line(cx - nw, top + 2 * R, cx + nw, top + 2 * R, rgb(rope), 1.3 * R); line(cx - nw, by - 6 * R, cx + nw, by - 6 * R, rgb(rope), 1.1 * R);
      const n = 9; for (let i = 0; i <= n; i++){ const t = i / n, x = cx - nw + 2 * nw * t; line(x, top + 2 * R, Math.min(cx + nw, x + 2 * nw / n * 2.4), by - 6 * R, rgba(rope, 0.85), 0.7 * R); line(x, top + 2 * R, Math.max(cx - nw, x - 2 * nw / n * 2.4), by - 6 * R, rgba(rope, 0.85), 0.7 * R); } for (let i = 1; i < 4; i++) line(cx - nw, top + 2 * R + (by - 8 * R - top) * i / 4, cx + nw, top + 2 * R + (by - 8 * R - top) * i / 4, rgba(rope, 0.5), 0.5 * R);
      const gx = cx + nw + 8 * R; poly(g, [[gx, by - 2 * R], [gx + 30 * R, by - 2 * R], [gx + 48 * R, by - 26 * R], [gx + 22 * R, by - 26 * R]], rgb(mix(p.timber, p.barkD, 0.25))); for (let i = 1; i < 5; i++) line(gx + 6 * R * i, by - 2 * R - 2 * R * i * 0, gx + 22 * R + 5.5 * R * i, by - 26 * R, rgba(hx('#0c0a08'), 0.3), 0.8 * R); for (let i = 0; i < 4; i++) line(gx + 4 * R + i * 7 * R, by - 3 * R - i * 6 * R, gx + 26 * R + i * 5 * R, by - 7 * R - i * 5 * R, rgba(p.barkL, 0.25), 0.8 * R);
      ell(cx - nw - 14 * R, by - 4 * R, 12 * R, 5 * R, rgb(mix(rope, p.barkD, 0.3))); for (let i = 0; i < 6; i++) line(cx - nw - 24 * R + i * 4 * R, by - 7 * R, cx - nw - 22 * R + i * 4 * R, by - 2 * R, rgba(hx('#0c0a08'), 0.3), 0.6 * R); cleat(cx - nw - 4 * R, by - 2 * R); coil(cx, by - 3 * R); }
    else if (kind === 'w_wbay'){ const bw = o.big ? 136 * R : 112 * R, bh = 72 * R, x0 = cx - bw / 2, y0 = by - 4 * R - bh, dc = mix(lookC(o.c, 0.72), p.barkD, 0.2); planks(x0, y0, bw, bh, mix(p.timber, p.barkD, 0.12)); for (const x of [x0, x0 + bw]) post(x, y0 - 4 * R, by - 2 * R, 2.2 * R); rect(x0 - 3 * R, y0 - 6 * R, bw + 6 * R, 5 * R, rgb(mix(p.timber, p.barkL, 0.15))); rect(x0 - 3 * R, y0 - 6 * R, bw + 6 * R, R, rgba(p.barkL, 0.35));
      const dx = cx + bw * 0.24, dh = 50 * R; rect(dx - 12 * R, by - 4 * R - dh - 3 * R, 24 * R, dh + 3 * R, rgb(p.barkD)); rect(dx - 10 * R, by - 4 * R - dh, 20 * R, dh, rgb(dc)); for (let i = 1; i < 4; i++) line(dx - 10 * R + 20 * R * i / 4, by - 4 * R - dh, dx - 10 * R + 20 * R * i / 4, by - 4 * R, rgba(hx('#0c0a08'), 0.4), 0.7 * R); rect(dx - 10 * R, by - 4 * R - dh * 0.5, 20 * R, 2 * R, rgb(p.iron)); ell(dx + 6 * R, by - 4 * R - dh * 0.45, 1.3 * R, 1.3 * R, rgb(p.iron));
      const sx = x0 + 10 * R, sw = bw * 0.42; for (const yy of [y0 + 24 * R, y0 + 46 * R]){ rect(sx, yy, sw, 2.5 * R, rgb(mix(p.timber, p.barkL, 0.1))); line(sx + 2 * R, yy + 2.5 * R, sx + 2 * R, yy + 8 * R, rgb(p.bark), 1.2 * R); line(sx + sw - 2 * R, yy + 2.5 * R, sx + sw - 2 * R, yy + 8 * R, rgb(p.bark), 1.2 * R); } for (let i = 0; i < 4; i++) rect(sx + 3 * R + i * sw * 0.24, y0 + 14 * R - (i % 2) * 2 * R, sw * 0.2, 10 * R + (i % 2) * 2 * R, rgb(mix(p.timber, [p.barkD, p.canvasD, p.stoneD, p.bark][i], 0.4))); for (let i = 0; i < 3; i++) ell(sx + 6 * R + i * sw * 0.3, y0 + 43 * R, 4 * R, 3.5 * R, rgb(mix(p.canvasD, p.stone, 0.3)));
      sign(x0 + bw - 14 * R, y0 + 20 * R, o.g, true); lantern(cx - 4 * R, y0 + 2 * R); ell(cx - 4 * R, y0 + 8 * R, 16 * R, 10 * R, rgba(p.ember, 0.035)); rect(x0 - 24 * R, by - 16 * R, 20 * R, 14 * R, rgb(mix(p.timber, p.barkD, 0.2))); line(x0 - 24 * R, by - 9 * R, x0 - 4 * R, by - 9 * R, rgba(hx('#0c0a08'), 0.4), 0.8 * R); }
    else if (kind === 'w_kpen'){ const pw = W * 0.44, ph = 26 * R; for (const dx of [-pw, -pw * 0.33, pw * 0.33, pw]) post(cx + dx, by - 2 * R - ph - 4 * R, by - 2 * R, 1.6 * R); for (const yy of [by - 8 * R, by - 20 * R]) line(cx - pw, yy, cx + pw, yy, rgb(mix(p.timber, p.barkD, 0.2)), 2.4 * R); for (let i = 0; i < 12; i++) line(cx - pw + 4 * R + i * pw * 2 / 12, by - 26 * R, cx - pw + 4 * R + i * pw * 2 / 12, by - 4 * R, rgba(p.timber, 0.9), 2 * R);
      for (let i = 0; i < 14; i++) line(cx - pw + r() * pw * 2, by - 3 * R + r() * 3 * R, cx - pw + r() * pw * 2, by - 4 * R + r() * 4 * R, rgba(p.thatchL, 0.5), 0.9 * R); ell(cx + pw * 0.6, by - 3 * R, 6 * R, 2.5 * R, rgb(p.iron)); ell(cx + pw * 0.6, by - 4 * R, 4.5 * R, 1.5 * R, rgba(p.wet, 0.7)); line(cx - pw * 0.5, by - 22 * R, cx - pw * 0.2, by - 6 * R, rgb(p.iron), 1.2 * R); for (let i = 0; i < 5; i++) ell(cx - pw * 0.5 + i * pw * 0.075, by - 22 * R + i * 3.2 * R, 1.4 * R, 1.4 * R, rgb(p.iron));
      const kx = cx - pw * 0.6; rect(kx - 12 * R, by - 28 * R, 24 * R, 22 * R, rgb(mix(p.timber, p.barkD, 0.3))); poly(g, [[kx - 15 * R, by - 28 * R], [kx, by - 40 * R], [kx + 15 * R, by - 28 * R]], rgb(p.shingle)); ell(kx, by - 15 * R, 6 * R, 7 * R, rgb(hx('#16120e'))); ell(cx + pw * 0.15, by - 4 * R, 4 * R, 1.4 * R, rgb(linen)); sign(cx + pw + 10 * R, by - 2 * R, o.g, false); }
    else if (kind === 'w_loft'){ const lw = W * 0.4, top = by - 134 * R; for (const dx of [-lw, lw]) post(cx + dx, top, by - 2 * R, 2.6 * R); rect(cx - lw - 4 * R, top, 2 * lw + 8 * R, 7 * R, rgb(mix(p.timber, p.barkD, 0.25))); rect(cx - lw - 4 * R, top, 2 * lw + 8 * R, R, rgba(p.barkL, 0.35)); for (let i = 0; i < 6; i++) line(cx - lw + 2 * R + i * lw * 2 / 6, top + 7 * R, cx - lw + 2 * R + i * lw * 2 / 6, top + 7 * R + 4 * R, rgba(hx('#0c0a08'), 0.3), 0.8 * R);
      const ham = (x0, x1, y, col) => { line(x0, y - 8 * R, x0 + (x1 - x0) * 0.2, y, rgb(rope), 0.9 * R); line(x1, y - 8 * R, x1 - (x1 - x0) * 0.2, y, rgb(rope), 0.9 * R); poly(g, [[x0 + (x1 - x0) * 0.2, y], [x1 - (x1 - x0) * 0.2, y], [x1 - (x1 - x0) * 0.3, y + 9 * R], [x0 + (x1 - x0) * 0.3, y + 9 * R]], rgb(col)); poly(g, [[x0 + (x1 - x0) * 0.2, y], [x1 - (x1 - x0) * 0.2, y], [x1 - (x1 - x0) * 0.25, y + 3 * R], [x0 + (x1 - x0) * 0.25, y + 3 * R]], rgba(p.canvasL, 0.18)); for (let i = 1; i < 5; i++) line(x0 + (x1 - x0) * (0.2 + 0.12 * i), y + R, x0 + (x1 - x0) * (0.3 + 0.1 * i), y + 8 * R, rgba(hx('#0c0a08'), 0.2), 0.6 * R); };
      ham(cx - lw, cx + lw, top + 30 * R, mix(p.canvasD, p.stone, 0.3)); ham(cx - lw, cx + lw, top + 62 * R, mix(p.canvasD, p.barkD, 0.3)); ham(cx - lw, cx + lw, top + 94 * R, mix(p.canvasD, hx('#5a4a3a'), 0.4)); ell(cx + lw * 0.3, top + 96 * R, 5 * R, 3 * R, rgb(linen));
      const rx = cx + lw + 12 * R; line(rx - 5 * R, by - 2 * R, rx + R, top + 4 * R, rgb(p.bark), 2 * R); line(rx + 5 * R, by - 2 * R, rx + 11 * R, top + 4 * R, rgb(p.bark), 2 * R); for (let i = 1; i < 10; i++){ const t = i / 10; line(rx - 5 * R + 6 * R * t, by - 2 * R - (by - 2 * R - top - 4 * R) * t, rx + 5 * R + 6 * R * t, by - 2 * R - (by - 2 * R - top - 4 * R) * t, rgb(p.timber), 1.6 * R); }
      lantern(cx - lw + 10 * R, top + 12 * R); ell(cx - lw + 10 * R, top + 18 * R, 14 * R, 9 * R, rgba(p.ember, 0.035)); rect(cx - lw - 24 * R, by - 14 * R, 18 * R, 12 * R, rgb(mix(p.timber, p.barkD, 0.2))); ell(cx - 10 * R, by - 3 * R, 12 * R, 4 * R, rgb(mix(p.canvasD, p.barkD, 0.3))); }
    else if (kind === 'w_stall'){ const sw = W * 0.4, top = by - 62 * R; for (const dx of [-sw, sw]) post(cx + dx, top, by - 2 * R, 1.8 * R); poly(g, [[cx - sw - 8 * R, top + 4 * R], [cx + sw + 8 * R, top + 4 * R], [cx + sw + 4 * R, top - 10 * R], [cx - sw - 4 * R, top - 10 * R]], rgb(p.canvasD)); poly(g, [[cx - sw - 8 * R, top + 4 * R], [cx + sw + 8 * R, top + 4 * R], [cx + sw + 6 * R, top], [cx - sw - 6 * R, top]], rgba(hx('#0c0a08'), 0.2)); for (let i = 0; i < 7; i++) poly(g, [[cx - sw - 8 * R + (2 * sw + 16 * R) * i / 7, top + 4 * R], [cx - sw - 8 * R + (2 * sw + 16 * R) * (i + 1) / 7, top + 4 * R], [cx - sw - 8 * R + (2 * sw + 16 * R) * (i + 0.5) / 7, top + 8 * R]], rgb(p.canvasD)); poly(g, [[cx - sw - 4 * R, top - 10 * R], [cx + sw + 4 * R, top - 10 * R], [cx + sw + 6 * R, top - 4 * R], [cx - sw - 6 * R, top - 4 * R]], rgba(p.canvasL, 0.22)); if (w) rect(cx - sw - 4 * R, top - 12 * R, 2 * sw + 8 * R, 3 * R, rgba(p.snow, 0.8));
      const ct = by - 26 * R; rect(cx - sw + 2 * R, ct, 2 * sw - 4 * R, 22 * R, rgb(mix(p.timber, p.barkD, 0.35))); for (let i = 1; i < 8; i++) line(cx - sw + 2 * R + (2 * sw - 4 * R) * i / 8, ct, cx - sw + 2 * R + (2 * sw - 4 * R) * i / 8, by - 4 * R, rgba(hx('#0c0a08'), 0.4), 0.7 * R); rect(cx - sw, ct - 3 * R, 2 * sw, 4 * R, rgb(mix(p.timber, p.barkL, 0.2))); rect(cx - sw, ct - 3 * R, 2 * sw, R, rgba(p.barkL, 0.4));
      for (let i = 0; i < 4; i++) ell(cx - sw + 10 * R + i * 14 * R, ct - 7 * R, 5 * R, 4 * R, rgb(mix(p.canvasD, [p.stone, p.thatch, p.bark, p.moss][i], 0.4))); rect(cx + 6 * R, ct - 12 * R, 14 * R, 9 * R, rgb(mix(p.timber, p.barkD, 0.2))); for (let i = 0; i < 3; i++){ rect(cx + 24 * R + i * 6 * R, ct - 13 * R, 3 * R, 10 * R, rgb(mix(hx(['#4a5a52', '#5e4a3a', '#6a6a5a'][i]), p.stoneD, 0.3))); } for (let i = 0; i < 2; i++) ell(cx + sw - 10 * R - i * 9 * R, by - 4 * R, 7 * R, 5 * R, rgb(mix(p.canvasD, p.thatch, 0.4)));
      sign(cx - sw - 2 * R, top + 24 * R, o.g || 'coin', true); lantern(cx + sw - 10 * R, top + 2 * R); }
    else if (kind === 'w_cage'){ const cw = 66 * R, ch = 74 * R, x0 = cx - cw / 2, y0 = by - 6 * R - ch; rect(x0 - 6 * R, by - 8 * R, cw + 12 * R, 6 * R, rgb(mix(p.timber, p.barkD, 0.3))); rect(x0 - 6 * R, by - 8 * R, cw + 12 * R, R, rgba(p.barkL, 0.3)); rect(x0, y0, cw, ch, rgba(hx('#0c0a08'), o.dark ? 0.75 : 0.45));
      if (o.g === 'shield' && !o.dark){ for (let i = 0; i < 3; i++) ell(x0 + 14 * R + i * 19 * R, y0 + 22 * R, 6 * R, 7 * R, rgb(mix(p.iron, i % 2 ? p.stoneD : p.timber, 0.4))); for (let i = 0; i < 4; i++) line(x0 + 10 * R + i * 14 * R, by - 8 * R, x0 + 12 * R + i * 14 * R, y0 + 36 * R, rgb(p.bark), 1.1 * R); for (let i = 0; i < 4; i++) poly(g, [[x0 + 10.5 * R + i * 14 * R, y0 + 36 * R], [x0 + 13.5 * R + i * 14 * R, y0 + 36 * R], [x0 + 12 * R + i * 14 * R, y0 + 29 * R]], rgb(p.iron)); }
      else { ell(x0 + cw * 0.5, by - 10 * R, 12 * R, 4 * R, rgba(p.thatchL, 0.25)); rect(x0 + 8 * R, by - 16 * R, 16 * R, 8 * R, rgb(mix(p.timber, p.barkD, 0.5))); }
      const nb = o.dark ? 9 : 7; for (let i = 0; i <= nb; i++) line(x0 + cw * i / nb, y0, x0 + cw * i / nb, by - 8 * R, rgb(mix(p.iron, p.stoneD, 0.2)), 1.6 * R); for (const yy of [y0, y0 + ch * 0.5, by - 10 * R]) rect(x0 - 2 * R, yy - R, cw + 4 * R, 2.6 * R, rgb(p.iron)); rect(x0 + cw * 0.6, y0 + ch * 0.5 - 7 * R, 14 * R, 5 * R, rgb(p.iron)); rect(x0 + cw * 0.6 + 4 * R, y0 + ch * 0.5 - 2 * R, 6 * R, 7 * R, rgb(mix(p.iron, p.stoneL, 0.25))); ell(x0 + cw * 0.6 + 7 * R, y0 + ch * 0.5 + 2 * R, 1.2 * R, 1.2 * R, rgb(hx('#0c0a08')));
      for (const x of [x0 - 2 * R, x0 + cw + 2 * R]) line(x, y0 - 2 * R, x, by - 8 * R, rgb(p.iron), 2.4 * R); rect(x0 - 2 * R, y0 - 3 * R, cw + 4 * R, 2 * R, rgba(p.stoneL, 0.18)); lantern(x0 + cw + 14 * R, by - 40 * R); post(x0 + cw + 14 * R, by - 40 * R, by - 2 * R, 1.3 * R); sign(x0 - 14 * R, by - 2 * R, o.dark ? 'bars' : o.g, false); }
    else if (kind === 'w_pit'){ const rx = W * 0.44, ry = 22 * R, pc = cx, py = by - 14 * R; ell(pc, py, rx + 6 * R, ry + 3 * R, rgb(mix(p.timber, p.barkD, 0.3))); ell(pc, py, rx, ry, rgb(mix(p.stone, hx('#7a6a50'), 0.6))); for (let i = 0; i < 24; i++) ell(pc + (r() - 0.5) * rx * 1.7, py + (r() - 0.5) * ry * 1.6, (1.5 + r() * 2.5) * R, (0.7 + r()) * R, rgba(i % 2 ? p.stoneL : p.stoneD, 0.3)); ell(pc, py - 2 * R, rx * 0.5, ry * 0.3, rgba(p.stoneL, 0.08));
      const pts = []; for (let i = 0; i < 8; i++){ const a = Math.PI * 2 * i / 8 + 0.2; pts.push([pc + Math.cos(a) * (rx + 4 * R), py + Math.sin(a) * (ry + 2 * R)]); } pts.sort((a, b) => a[1] - b[1]); for (const [x, y] of pts){ post(x, y - 18 * R, y, 1.3 * R); } g.strokeStyle = rgb(rope); g.lineWidth = 1.1 * R; g.beginPath(); g.ellipse(pc, py - 14 * R, rx + 4 * R, ry + 2 * R, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(pc, py - 7 * R, rx + 4 * R, ry + 2 * R, 0, 0, Math.PI * 2); g.stroke();
      const dx = pc + rx * 0.5; post(dx, py - 40 * R, py + 4 * R, 2 * R); rect(dx - 9 * R, py - 36 * R, 18 * R, 4 * R, rgb(p.bark)); ell(dx, py - 42 * R, 4 * R, 4 * R, rgb(mix(p.canvasD, p.barkD, 0.3))); rect(dx - 5 * R, py - 32 * R, 10 * R, 14 * R, rgb(mix(p.canvasD, p.barkD, 0.4))); for (let i = 0; i < 3; i++) line(dx - 5 * R, py - 30 * R + i * 4 * R, dx + 5 * R, py - 30 * R + i * 4 * R, rgb(rope), 0.7 * R); ell(pc - rx - 14 * R, by - 3 * R, 5 * R, 2.2 * R, rgb(p.iron)); rect(pc - rx - 19 * R, by - 12 * R, 10 * R, 9 * R, rgb(p.iron)); ell(pc - rx - 14 * R, by - 12 * R, 5 * R, 2 * R, rgba(p.wet, 0.6)); }
    else if (kind === 'w_ladder'){ const top = by - 140 * R, lx = cx - 6 * R; rect(cx - W * 0.48, top, W * 0.96, 7 * R, rgb(mix(p.timber, p.barkD, 0.3))); rect(cx - W * 0.48, top, W * 0.96, R, rgba(p.barkL, 0.35)); for (let i = 0; i < 5; i++) line(cx - W * 0.48 + 4 * R + i * W * 0.22, top + 7 * R, cx - W * 0.48 + 4 * R + i * W * 0.22, top + 11 * R, rgba(hx('#0c0a08'), 0.3), 0.8 * R); rect(lx - 12 * R, top - 3 * R, 24 * R, 3 * R, rgb(hx('#16120e'))); post(cx + W * 0.4, top, by - 2 * R, 2.2 * R);
      line(lx - 8 * R, by - 2 * R, lx - 2 * R, top - 6 * R, rgb(p.bark), 2.2 * R); line(lx + 8 * R, by - 2 * R, lx + 14 * R, top - 6 * R, rgb(p.bark), 2.2 * R); for (let i = 1; i < 14; i++){ const t = i / 14; line(lx - 8 * R + 6 * R * t, by - 2 * R - (by - 2 * R - top + 6 * R) * t, lx + 8 * R + 6 * R * t, by - 2 * R - (by - 2 * R - top + 6 * R) * t, rgb(p.timber), 1.8 * R); }
      if (o.orb){ line(cx + W * 0.4, top + 14 * R, cx + W * 0.4 - 12 * R, top + 14 * R, rgb(p.iron), 1.3 * R); line(cx + W * 0.4 - 12 * R, top + 14 * R, cx + W * 0.4 - 12 * R, top + 20 * R, rgb(p.iron), 0.9 * R); ell(cx + W * 0.4 - 12 * R, top + 25 * R, 5 * R, 5 * R, rgb(p.iron)); ell(cx + W * 0.4 - 12 * R, top + 25 * R, 3.6 * R, 3.6 * R, rgb(hx('#6a7a7e'))); ell(cx + W * 0.4 - 13 * R, top + 24 * R, 1.2 * R, R, rgba(p.stoneL, 0.6)); ell(cx + W * 0.4 - 12 * R, top + 25 * R, 12 * R, 10 * R, rgba(hx('#8aa0a8'), 0.08)); }
      else { lantern(cx + W * 0.4 - 8 * R, top + 20 * R); ell(cx + W * 0.4 - 8 * R, top + 26 * R, 13 * R, 9 * R, rgba(p.ember, 0.035)); } if (o.g === 'flag') poly(g, [[cx + W * 0.4 + 2 * R, top + 2 * R], [cx + W * 0.4 + 22 * R, top + 7 * R], [cx + W * 0.4 + 2 * R, top + 13 * R]], rgb(mix(p.canvasD, hx('#6a5a4a'), 0.5))); if (o.g === 'bow'){ line(cx + W * 0.4 - 2 * R, by - 50 * R, cx + W * 0.4 + 4 * R, by - 28 * R, rgb(p.bark), 1.2 * R); }
      rect(cx - W * 0.46, by - 16 * R, 20 * R, 14 * R, rgb(mix(p.timber, p.barkD, 0.2))); line(cx - W * 0.46, by - 9 * R, cx - W * 0.46 + 20 * R, by - 9 * R, rgba(hx('#0c0a08'), 0.4), 0.8 * R); coil(cx + 20 * R, by - 3 * R); sign(cx - W * 0.44, by - 2 * R, o.g === 'flag' || o.g === 'bow' ? null : o.g, false); }
    else if (kind === 'w_furnace'){ const fw = 64 * R, fh = 50 * R, x0 = cx - fw / 2 - 14 * R, y0 = by - 4 * R - fh; courses(x0, y0, fw, fh, 6 * R, 12 * R, mix(hx('#6a4a3e'), p.stone, 0.45)); poly(g, [[x0 + fw * 0.5 - 12 * R, by - 4 * R], [x0 + fw * 0.5 - 12 * R, y0 + 22 * R], [x0 + fw * 0.5, y0 + 10 * R], [x0 + fw * 0.5 + 12 * R, y0 + 22 * R], [x0 + fw * 0.5 + 12 * R, by - 4 * R]], rgb(hx('#16120e'))); ell(x0 + fw * 0.5, by - 10 * R, 8 * R, 4 * R, rgba(p.ember, 0.9)); ell(x0 + fw * 0.5 - 2 * R, by - 11 * R, 3 * R, 1.6 * R, rgba(mix(p.ember, p.thatchL, 0.6), 0.9)); ell(x0 + fw * 0.5, by - 14 * R, 18 * R, 12 * R, rgba(p.ember, 0.14));
      poly(g, [[x0 - 4 * R, y0], [x0 + fw + 4 * R, y0], [x0 + fw * 0.5 + 8 * R, y0 - 14 * R], [x0 + fw * 0.5 - 8 * R, y0 - 14 * R]], rgb(mix(p.iron, p.stoneD, 0.3))); rect(x0 + fw * 0.5 - 4 * R, y0 - 44 * R, 8 * R, 31 * R, rgb(p.iron)); rect(x0 + fw * 0.5 - 6 * R, y0 - 47 * R, 12 * R, 4 * R, rgb(p.iron)); smoke(x0 + fw * 0.5, y0 - 48 * R, 5); rect(x0 + fw * 0.5 - 4 * R, y0 - 44 * R, 2 * R, 31 * R, rgba(p.stoneL, 0.12));
      const ax = cx + W * 0.28; rect(ax - 7 * R, by - 14 * R, 14 * R, 12 * R, rgb(p.barkD)); poly(g, [[ax - 14 * R, by - 20 * R], [ax + 12 * R, by - 20 * R], [ax + 8 * R, by - 15 * R], [ax + 4 * R, by - 14 * R], [ax - 6 * R, by - 14 * R], [ax - 8 * R, by - 16 * R], [ax - 14 * R, by - 17 * R]], rgb(p.iron)); rect(ax - 14 * R, by - 20 * R, 26 * R, R, rgba(p.stoneL, 0.3)); line(ax + 16 * R, by - 4 * R, ax + 24 * R, by - 26 * R, rgb(p.bark), 1.4 * R); rect(ax + 21 * R, by - 30 * R, 7 * R, 5 * R, rgb(p.iron));
      const bx = x0 - 14 * R; poly(g, [[bx - 14 * R, by - 8 * R], [bx + 2 * R, by - 14 * R], [bx + 2 * R, by - 4 * R], [bx - 14 * R, by - 2 * R]], rgb(mix(p.timber, p.barkD, 0.3))); poly(g, [[bx - 14 * R, by - 8 * R], [bx + 2 * R, by - 14 * R], [bx + 2 * R, by - 10 * R], [bx - 14 * R, by - 6 * R]], rgba(hx('#5a4a3a'), 0.7)); line(bx + 2 * R, by - 9 * R, bx + 8 * R, by - 10 * R, rgb(p.iron), 1.6 * R); line(bx - 14 * R, by - 5 * R, bx - 26 * R, by - 20 * R, rgb(p.bark), 1.3 * R);
      if (o.g === 'gear'){ for (const [gx, gy, gr] of [[cx + W * 0.42, by - 44 * R, 8], [cx + W * 0.42 + 13 * R, by - 36 * R, 5]]){ for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + gr; line(gx, gy, gx + Math.cos(a) * gr * R * 1.25, gy + Math.sin(a) * gr * R * 1.25, rgb(mix(p.iron, p.stoneL, 0.2)), 2.2 * R); } ell(gx, gy, gr * R, gr * R, rgb(mix(p.iron, p.stoneL, 0.2))); ell(gx, gy, gr * R * 0.4, gr * R * 0.4, rgb(p.stoneD)); } }
      ell(cx + W * 0.44, by - 3 * R, 5 * R, 2.2 * R, rgb(p.iron)); rect(cx + W * 0.44 - 5 * R, by - 12 * R, 10 * R, 9 * R, rgb(p.iron)); ell(cx + W * 0.44, by - 12 * R, 5 * R, 2 * R, rgba(p.wet, 0.6)); sign(cx - W * 0.46, by - 2 * R, o.g === 'gear' ? null : o.g, false); }
    else if (kind === 'w_vat'){ for (let i = 0; i < 3; i++){ const vx = cx - 46 * R + i * 46 * R, vy = by - 4 * R, vw = 36 * R, vh = 18 * R; poly(g, [[vx - vw * 0.46, vy], [vx - vw * 0.5, vy - vh], [vx + vw * 0.5, vy - vh], [vx + vw * 0.46, vy]], rgb(mix(p.timber, p.barkD, 0.4))); for (let k2 = 1; k2 < 7; k2++) line(vx - vw * 0.5 + vw * k2 / 7, vy - vh, vx - vw * 0.46 + vw * 0.92 * k2 / 7, vy, rgba(hx('#0c0a08'), 0.4), 0.7 * R); for (const t of [0.25, 0.8]) rect(vx - vw * 0.5, vy - vh * t - R, vw, 2 * R, rgb(p.iron));
        ell(vx, vy - vh, vw * 0.5, 5 * R, rgb(mix(p.timber, p.barkL, 0.15))); ell(vx, vy - vh, vw * 0.42, 3.8 * R, rgb(mix(hx(['#4a3a28', '#5a4a30', '#3e3a30'][i]), p.wet, 0.3))); ell(vx - 4 * R, vy - vh - R, 4 * R, 1.2 * R, rgba(p.stoneL, 0.14)); for (let k2 = 0; k2 < 4; k2++) ell(vx - vw * 0.4 + r() * vw * 0.8, vy + 2 * R + r() * 3 * R, (2 + r() * 3) * R, R, rgba(hx('#2a2018'), 0.35)); }
      const hx0 = cx + 30 * R; for (const dx of [-16, 16]) post(hx0 + dx * R, by - 66 * R, by - 2 * R, 1.6 * R); line(hx0 - 16 * R, by - 64 * R, hx0 + 16 * R, by - 64 * R, rgb(p.timber), 2 * R); poly(g, [[hx0 - 12 * R, by - 58 * R], [hx0 + 12 * R, by - 58 * R], [hx0 + 10 * R, by - 30 * R], [hx0 - 10 * R, by - 30 * R]], rgb(mix(hx('#7a5a3a'), p.barkD, 0.3))); for (let k2 = 0; k2 < 5; k2++) line(hx0 - 12 * R + k2 * 6 * R, by - 64 * R, hx0 - 11 * R + k2 * 6 * R, by - 58 * R, rgb(rope), 0.7 * R); line(hx0 - 12 * R, by - 44 * R, hx0 - 16 * R, by - 44 * R, rgb(rope), 0.7 * R); line(hx0 + 12 * R, by - 44 * R, hx0 + 16 * R, by - 44 * R, rgb(rope), 0.7 * R);
      ell(cx - 72 * R, by - 3 * R, 5 * R, 2.2 * R, rgb(p.iron)); rect(cx - 77 * R, by - 11 * R, 10 * R, 8 * R, rgb(p.iron)); ell(cx - 72 * R, by - 11 * R, 5 * R, 2 * R, rgba(p.wet, 0.6)); line(cx - 60 * R, by - 2 * R, cx - 66 * R, by - 40 * R, rgb(p.bark), 1.3 * R); sign(cx + 66 * R, by - 2 * R, o.g || 'hide', false); }
    else if (kind === 'w_barricade'){ const dw = 70 * R, dh = 96 * R, x0 = cx - dw / 2, y0 = by - 4 * R - dh; rect(x0 - 8 * R, y0 - 8 * R, dw + 16 * R, dh + 8 * R, rgb(mix(p.stone, p.stoneD, 0.5))); for (let yy = 0; yy < dh + 8 * R; yy += 8 * R) for (let xx = ((yy / (8 * R)) & 1) * 8 * R - 8 * R; xx < dw + 16 * R; xx += 16 * R) rect(x0 - 8 * R + Math.max(0, xx) + 0.6 * R, y0 - 8 * R + yy + 0.6 * R, Math.min(16 * R, dw + 16 * R - Math.max(0, xx)) - 1.2 * R, 6.8 * R, rgb(mul(p.stone, 0.8 + r() * 0.3)));
      rect(x0, y0, dw, dh, rgb(hx('#16120e'))); planks(x0 + 2 * R, y0 + 2 * R, dw - 4 * R, dh - 2 * R, mul(p.timber, 0.6), 9 * R); for (const t of [0.3, 0.7]) rect(x0 + 2 * R, y0 + dh * t, dw - 4 * R, 2.6 * R, rgb(p.iron));
      for (const [a, b] of [[0.1, 0.7], [0.4, 0.95], [0.85, 0.25]]){ g.save(); g.translate(x0 + dw / 2, y0 + dh * (a + b) / 2); const ang = Math.atan2(dh * (b - a), dw * 1.1); g.rotate(ang); const len = Math.hypot(dw * 1.1, dh * (b - a)); rect(-len / 2, -5 * R, len, 10 * R, rgb(mix(p.timber, p.barkL, 0.1))); rect(-len / 2, -5 * R, len, 1.4 * R, rgba(p.barkL, 0.4)); for (const t of [-0.42, -0.1, 0.15, 0.42]) ell(len * t, 0, 1.4 * R, 1.4 * R, rgb(p.iron)); g.restore(); }
      rect(x0 - 12 * R, by - 4 * R - dh * 0.5, dw + 24 * R, 7 * R, rgb(mix(p.timber, p.barkD, 0.2))); for (const x of [x0 - 10 * R, x0 + dw + 10 * R]) rect(x - 3 * R, by - 4 * R - dh * 0.5 - 2 * R, 6 * R, 11 * R, rgb(p.iron));
      for (let i = 0; i < 3; i++){ const cxx = cx - W * 0.42 + (i % 2) * 6 * R, cy = by - 2 * R - i * 15 * R; rect(cxx - 12 * R, cy - 15 * R, 24 * R, 15 * R, rgb(mix(p.timber, i % 2 ? p.barkL : p.barkD, 0.25))); line(cxx - 12 * R, cy - 8 * R, cxx + 12 * R, cy - 8 * R, rgba(hx('#0c0a08'), 0.4), 0.8 * R); rect(cxx - 12 * R, cy - 15 * R, 24 * R, R, rgba(p.barkL, 0.3)); } for (let i = 0; i < 4; i++){ const sx = cx + W * 0.34 + i * 6 * R; line(sx, by - 2 * R, sx + 10 * R, by - 34 * R - i * 2 * R, rgb(p.bark), 2 * R); poly(g, [[sx + 9 * R, by - 33 * R - i * 2 * R], [sx + 12 * R, by - 32 * R - i * 2 * R], [sx + 12 * R, by - 40 * R - i * 2 * R]], rgb(cut)); } barrel(cx + W * 0.46, by - 2 * R, 15 * R, 20 * R); }
    if (window.ART37 && ART37.post) ART37.post(kind, {g, rect, ell, line, poly, post, p, L, R, cx, by, W, H, mix, mul, rgb, rgba, hx, r, smoke, planks, courses, w});   /* INDEX ART37: barge and warehouse dressing */
    if (F && !(F.house && F.house[kind])){ g.save(); g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(L > 0 ? cx - W * 0.6 : cx + W * 0.6, 0, L > 0 ? cx + W * 0.6 : cx - W * 0.6, 0); lg.addColorStop(0, 'rgba(10,14,24,.34)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(255,236,190,' + (F.sideLit * 0.9).toFixed(2) + ')'); g.fillStyle = lg; g.fillRect(0, 0, c.width, c.height); g.restore(); }   /* INDEX F28 batch 2: the shell turns to the light */
    if (o.dmg || o.ruin){
      // damage: soot climbing from the openings and the whole darkened; ruin: only the lower walls stand under a jagged edge, with fallen stone and charred timber at the foot
      if (o.ruin){ const keep = by - H * 0.42; g.save(); g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, c.height); g.lineTo(0, keep + 6 * R); for (let i = 0; i <= 12; i++) g.lineTo(c.width * i / 12, keep + (r() - 0.5) * 16 * R); g.lineTo(c.width, keep + 6 * R); g.lineTo(c.width, c.height); g.closePath(); g.fill(); g.restore();
        for (let i = 0; i < 8; i++) ell(cx + (r() - 0.5) * W * 0.9, by - r() * 6 * R, (3 + r() * 5) * R, (2 + r() * 2) * R, rgb(mix(p.stone, p.stoneD, r() * 0.6))); for (let i = 0; i < 4; i++) line(cx + (r() - 0.5) * W * 0.8, by - r() * H * 0.3, cx + (r() - 0.5) * W * 0.8, by - r() * 4 * R, rgb(p.barkD), 2.2 * R); }
      g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 6; i++){ const x = cx + (r() - 0.5) * W * 0.7, y = by - H * (0.2 + r() * 0.4); ell(x, y, (5 + r() * 6) * R, (8 + r() * 10) * R, rgba(hx('#0c0a08'), 0.35)); } g.fillStyle = rgba(hx('#0c0a08'), o.ruin ? 0.2 : 0.3); g.fillRect(0, 0, c.width, c.height); g.restore();
    }
    rim(c, rgba(cool(hx('#c0ccd8'), 0.2), 1), V.K.rimW * R, -L, 0.3);
    const fsp = finish(c, cx, by, true, 'fac', V.K.facade ? V.K.facade.shadowLen : 0.42);   /* INDEX F28 */ if (chim) fsp.chim = {x: chim.x - cx, y: chim.y - by}; return fsp;
  }
  // the hook: W3D's facility kinds (and their _dmg and ws_ forms) land here while VO3 is on
  V.drawFacility = function(kind, x, gl, o){
    const f = facKey(kind); if (!f) return null;
    const oo = {k: f.key, dmg: f.dmg ? 1 : 0, ruin: f.ruin ? 1 : 0}; if (window.ART37 && (f.key === 'tents' || f.key === 'huts') && V.hubDeck && V.hubDeck()) oo.deck = 1; if (f.look){ for (const q of ['g', 'big', 'dark', 'cross', 'orb', 'smoke', 'c', 'roof']) if (f.look[q]) oo[q] = f.look[q]; }
    const sp = V.sprite('fac', hsh(x | 0, gl | 0) % 4, seNow(), oo); if (!sp) return false;
    const B = (V.hubFort && V.hubFort()) || (V.hubDeck && V.hubDeck()) ? V.K.hubBuild : 1;   // the hub's buildings stand to the people, not to the old 150 px plot pitch (Patrick, 2026-11-12); OA27: the barge and warehouse too (their people were 1.4 x, their skins 1)
    blitSprite(sp, x, gl, B, false, true); if (sp.chim){ const Bp = B; V.chimAt[f.key] = {x: x + sp.chim.x * sp.s * Bp, y: gl + sp.chim.y * sp.s * Bp}; } return true;
  };
  // the camp's smoke puffs start at the painted chimney (Patrick, 2026-11-12: smoke rose from fixed old offsets, tied to nothing); null while VO3 paints a facility with no chimney, false when VO3 is off
  V.chimAt = {};
  window.w3dChimney = function(id){ if (!V.on) return false; return V.chimAt[id] || null; };

  /* ---- the hub at the people's scale (Patrick, 2026-11-12: "the building scale and perspective should be relative to the size of the people, which means
     making the map bigger. the trees are clipping strangely ... the banner is still always rendering a circle no matter the selected icon").
     The fort layout is scaled hubS once, in place (plots, hub, grave, trophy, paddock, streets, parade ground, signs, the waystation's ruins) and CAMP_W/CAMP_H
     follow it (index.html declares them with let; V.hubSize runs before applySkin copies the layout out). Buildings, facilities and the staked plot blit at
     hubBuild while the hub figures keep hubFigure, so a door is taller than a person. The border trees stand clear of the content by a canopy (an ellipse padded
     by the canopy's reach, further below the ring than above it, since a tree below the content would hide it) and are baked, y-sorted with the palisade stakes
     and gate towers, into two layers: back (bases above the content line, blitted after the streets) and front (the bottom rows, a holding prop at y = 1e9).
     A frame then blits two images instead of some 300 sprites with multiply shadows (Patrick's frame was 88 ms). ---- */
  V.K.hubS = 1.5; V.K.hubBuild = 1.4; V.K.hubTreeBand = 430;
  const BASE_W = 1760, BASE_H = 1180, HUB_FENCES = [[880, 1010, 'sign'], [1240, 300, 'sign'], [300, 640, 'fence'], [1480, 640, 'fence'], [700, 1020, 'fence'], [1060, 1020, 'fence']];
  const inHub = () => !(typeof G !== 'undefined' && G) && !(window.VO2 && VO2.campNow && VO2.campNow());
  const fortNow = () => typeof layoutKey === 'function' && layoutKey() === 'fort' && typeof holding === 'function' && holding() === 'fort';
  V.hubS = () => (typeof CAMP_LAYOUT !== 'undefined' && CAMP_LAYOUT.fort && CAMP_LAYOUT.fort.__vo3S) || 1;
  V.hubFort = () => V.on && fortNow() && inHub() && V.hubS() > 1;
  V.hubDeck = () => V.on && inHub() && typeof layoutKey === 'function' && layoutKey() !== 'fort' && typeof CAMP !== 'undefined' && !!CAMP && !!CAMP.on;   // INDEX OA27: the barge or warehouse hub, where the people already draw at hubFigure
  if (typeof CAMP_LAYOUT !== 'undefined' && CAMP_LAYOUT.fort && !CAMP_LAYOUT.fort.__vo3S){
    const L = CAMP_LAYOUT.fort, S = V.K.hubS;
    for (const id in L.plots){ L.plots[id][0] *= S; L.plots[id][1] *= S; }
    for (const h in L.hub){ L.hub[h][0] *= S; L.hub[h][1] *= S; }
    if (L.grave){ L.grave.x *= S; L.grave.y *= S; }
    if (L.trophy){ L.trophy[0] *= S; L.trophy[1] *= S; }
    if (L.paddock){ L.paddock[0] *= S; L.paddock[1] *= S; }
    for (const r of L.roads || []){ for (const p of r.pts){ p[0] *= S; p[1] *= S; } r.w *= S; }
    for (const g of L.rects || []){ g.x *= S; g.y *= S; g.w *= S; g.h *= S; }
    for (const q of L.signs || []){ q[0] *= S; q[1] *= S; }
    if (typeof WAY_RUINS !== 'undefined') for (const w of WAY_RUINS){ w[0] *= S; w[1] *= S; }
    L.__vo3S = S;
  }
  // the lowest content line of the fort (plots, hub, grave) plus a facility's footprint
  V.hubBottom = function(){ const L = CAMP_LAYOUT.fort; let b = 0; for (const id in L.plots) b = Math.max(b, L.plots[id][1]); for (const h in L.hub) b = Math.max(b, L.hub[h][1]); if (L.grave) b = Math.max(b, L.grave.y + 60); return b + 40; };
  V.hubSize = function(){
    if (typeof CAMP_W === 'undefined' || typeof layoutKey !== 'function') return;
    const fort = layoutKey() === 'fort' && V.hubS() > 1, W = fort ? BASE_W * V.hubS() : BASE_W, H = fort ? V.hubBottom() + V.K.hubTreeBand : BASE_H;
    if (CAMP_W !== W || CAMP_H !== H){ CAMP_W = W; CAMP_H = H; if (typeof CAMP !== 'undefined' && CAMP){ CAMP.trees = null; CAMP.decor = null; CAMP.dirty = true; } }
  };
  if (typeof applySkin === 'function' && !applySkin.__vo3){ const f = applySkin; applySkin = function(){ try { V.hubSize(); } catch (e) { console.warn('VO3 hub size:', e); } return f.apply(this, arguments); }; applySkin.__vo3 = true; }
  // the border: trees outside the padded ring, the bottom rows far enough down that their crowns stay below the content, a meadow between
  if (typeof campScenery === 'function' && !campScenery.__vo3){ const f = campScenery;
    campScenery = function(){
      if (!V.hubFort() || typeof CAMP === 'undefined' || !CAMP || CAMP.trees) return f.apply(this, arguments);
      f.apply(this, arguments); if (!CAMP.trees) return;
      const L = CAMP_LAYOUT.fort, S = V.hubS(), r = rng(77), trees = [], decor = [], ex0 = 880 * S, ey0 = 640 * S, rx0 = 760 * S, ry0 = 470 * S, cb = V.hubBottom();
      const near = (x, y, d) => Object.values(L.plots).some(p => Math.hypot(p[0] - x, p[1] - y) < d) || Object.values(L.hub).some(h => Math.hypot(h[0] - x, h[1] - y) < d) || (L.grave && Math.hypot(L.grave.x - x, L.grave.y - y) < d + 80);
      const inRing = (x, y, px, pyU, pyD) => { const ex = (x - ex0) / (rx0 + px), ey = (y - ey0) / (ry0 + (y > ey0 ? pyD : pyU)); return ex * ex + ey * ey <= 1; };
      const kindH = {t_pine: V.K.pineH, oak: V.K.oakH, t_birch: V.K.birchH, t_dead: V.K.deadH};
      for (let y = 10; y < CAMP_H + 40; y += 62) for (let x = -20; x < CAMP_W + 40; x += 70){
        const tx = x + (r() - 0.5) * 40, ty = y + (r() - 0.5) * 34, v = r() * 3 | 0; if (r() > 0.8) continue;
        const t = {x: tx, y: ty, v};
        if (ty < cb){ if (inRing(tx, ty, 110, 30, 300) || near(tx, ty, 230)) continue; trees.push(t); }
        else { const k = typeof w3dTreeKind === 'function' ? w3dTreeKind(t) : 'oak', h = kindH[k] || 260; if (ty - cb < h - 50) continue; trees.push(t); }
      }
      const pick = roll => roll < .35 ? 'tuft' : roll < .55 ? 'flowers' : roll < .7 ? 'rock' : roll < .82 ? 'bush' : roll < .92 ? 'stump' : 'bones';
      for (let i = 0; i < 110; i++){ const x = 140 + r() * (CAMP_W - 280), y = 140 + r() * (cb - 140); if (!inRing(x, y, -40, -24, -24) || near(x, y, 120)) continue; decor.push({x, y, k: pick(r())}); }
      for (let i = 0; i < 70; i++){ const x = r() * CAMP_W, y = ey0 + ry0 - 60 + r() * (cb + 180 - ey0 - ry0); if (inRing(x, y, 0, 0, 0) || near(x, y, 120)) continue; decor.push({x, y, k: pick(r())}); }
      for (const [x0, y0, k] of HUB_FENCES){ const x = x0 * S, y = y0 * S; if (!near(x, y, 90)) decor.push({x, y, k}); }
      for (const d of CAMP.decor) if (d.k === 'sign' && L.signs.some(q => Math.abs(q[0] - d.x) < 1 && Math.abs(q[1] - d.y) < 1)) decor.push(d);
      CAMP.trees = trees; CAMP.decor = typeof onPlan === 'function' ? decor.filter(d => !onPlan(d.x, d.y)) : decor; V.layers = null;
    };
    campScenery.__vo3 = true;
  }
  V.layers = null;
  V.bakeHub = function(){
    V.noPersp = true; try { return bakeHub0(); } finally { V.noPersp = false; } };
  function bakeHub0(){
    const trees = CAMP.trees, se = seNow(), pal = typeof has === 'function' && has('palisade'), key = se + ':' + lightKey() + ':' + (pal ? 1 : 0) + ':' + CAMP_W + 'x' + CAMP_H;
    if (V.layers && V.layers.trees === trees && V.layers.key === key) return V.layers;
    const cb = V.hubBottom(), S = V.hubS(), saved = ctx, lay = {trees, key, back: null, front: null}, t0 = performance.now();
    const items = trees.map(t => ({y: t.y, draw: () => V.drawHubKind(typeof w3dTreeKind === 'function' ? w3dTreeKind(t) : 'oak', t.x, t.y + 5, {mirror: typeof wHash === 'function' ? (wHash(t.x, t.y) >> 4) % 2 === 0 : false})}));
    if (pal){ const cx = 880 * S, cy = 640 * S, rx = 760 * S, ry = 470 * S, TAU_ = Math.PI * 2, gates = [0, Math.PI / 2, Math.PI, Math.PI * 1.5], N = Math.round(400 * S);
      for (let a = 0; a < N; a++){ const t = a / N * TAU_; if (gates.some(gt => Math.abs(((t - gt + Math.PI * 3) % TAU_) - Math.PI) < 0.07)) continue; const x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry; items.push({y, draw: () => V.drawProp('w_stake', x, y + 2)}); }
      for (const gt of [0, Math.PI, Math.PI * 1.5]) for (const sg of [-1, 1]){ const t = gt + sg * 0.09, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry; items.push({y, draw: () => V.drawProp('w_gatetower', x, y + 4)}); } }
    items.sort((a, b) => a.y - b.y);
    const bake = (list, y0, y1) => { if (!list.length) return null; const c = mk(CAMP_W + 300, y1 - y0), g = c.getContext('2d'); g.translate(150, -y0); ctx = g; try { for (const it of list) it.draw(); } finally { ctx = saved; } return {c, x0: -150, y0}; };
    try { lay.back = bake(items.filter(it => it.y < cb), -360, cb + 40); lay.front = bake(items.filter(it => it.y >= cb), cb - 360, CAMP_H + 80); }
    catch (e) { console.warn('VO3 hub layers:', e); ctx = saved; }
    lay.ms = performance.now() - t0; return V.layers = lay;
  };
  V.blitLayer = function(l){ if (!l || typeof CAMP === 'undefined') return; const cx = Math.round(CAMP.cam.x), cy = Math.round(CAMP.cam.y), x0 = Math.max(cx - 2, l.x0), y0 = Math.max(cy - 2, l.y0), x1 = Math.min(cx + VW + 2, l.x0 + l.c.width), y1 = Math.min(cy + VH + 2, l.y0 + l.c.height);
    if (x1 <= x0 || y1 <= y0) return; ctx.drawImage(l.c, x0 - l.x0, y0 - l.y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); };
  const baked = () => V.hubFort() && V.layers && typeof CAMP !== 'undefined' && CAMP && V.layers.trees === CAMP.trees;
  if (typeof w3dTree === 'function' && !w3dTree.__vo3){ const f = w3dTree; w3dTree = function(){ if (baked()) return true; return f.apply(this, arguments); }; w3dTree.__vo3 = true; }
  if (typeof drawPalisadeRing === 'function' && !drawPalisadeRing.__vo3){ const f = drawPalisadeRing; drawPalisadeRing = function(){ if (baked() && typeof has === 'function' && has('palisade')) return true; return f.apply(this, arguments); }; drawPalisadeRing.__vo3 = true; }
  if (typeof holdingProps === 'function' && !holdingProps.__vo3){ const f = holdingProps; holdingProps = function(){ const out = f.apply(this, arguments); return baked() && V.layers.front ? out.concat([{x: 0, y: 1e9, k: 'vo3_front'}]) : out; }; holdingProps.__vo3 = true; }
  if (typeof drawHoldingProp === 'function' && !drawHoldingProp.__vo3){ const f = drawHoldingProp; drawHoldingProp = function(p){ if (p && p.k === 'vo3_front'){ V.blitLayer(V.layers && V.layers.front); return; } return f.apply(this, arguments); }; drawHoldingProp.__vo3 = true; }
  // the hover and click rectangles of the buildings and the house follow the hubBuild blit
  if (typeof objRect === 'function' && !objRect.__vo3){ const f = objRect; objRect = function(o){ const r = f.apply(this, arguments); if (o && (o.kind === 'building' || o.kind === 'house') && V.hubFort()){ const B = V.K.hubBuild; return {x: o.x - r.w * B / 2, y: o.y + 8 - r.h * B, w: r.w * B, h: r.h * B}; } return r; }; objRect.__vo3 = true; }
  try { if (typeof applySkin === 'function') applySkin(); } catch (e) { console.warn('VO3 hub layout:', e); }

  /* ---- a look sheet and a self test ---- */
  V.sheet = function(se){
    se = se || 'summer'; const items = [['oak', 0], ['oak', 1], ['pine', 0], ['pine', 1], ['birch', 0], ['dead', 0], ['dead', 3], ['building', 0, {w: 2, d: 2}], ['building', 1, {w: 3, d: 2}], ['building', 2, {w: 2, d: 3}], ['tent', 0, {w: 1}], ['tent', 1, {w: 2}], ['boulder', 0], ['boulder', 2], ['rubble', 0], ['palisade', 0, {mask: 10}], ['palisade', 1, {mask: 5}], ['palisade', 2, {mask: 6}], ['wall', 0, {run: 3, ends: 3}], ['wall', 1, {run: 1, up: 1, down: 0}], ['cliff', 0], ['gate', 0, {n: 3, stone: 0}], ['gate', 1, {n: 3, stone: 1}], ['hearth', 0], ['wagon', 0], ['wagon', 1], ['decor', 0, {k: 'barrel'}], ['decor', 0, {k: 'crate'}], ['decor', 0, {k: 'sacks'}], ['decor', 0, {k: 'stump'}], ['decor', 0, {k: 'scrub'}], ['decor', 0, {k: 'tuft'}], ['decor', 0, {k: 'rock'}], ['decor', 0, {k: 'fence'}], ['decor', 0, {k: 'sign'}], ['decor', 0, {k: 'anchor'}], ['decor', 0, {k: 'rope'}], ['prop', 0, {k: 'stake'}], ['prop', 1, {k: 'rack'}], ['prop', 1, {k: 'paddock'}], ['prop', 0, {k: 'plot'}], ['prop', 0, {k: 'cross'}], ['prop', 1, {k: 'stone'}], ['prop', 0, {k: 'gatetower'}], ['decor', 1, {k: 'benchlog'}], ['fac', 0, {k: 'tents'}], ['fac', 0, {k: 'huts'}], ['fac', 0, {k: 'bunks'}], ['fac', 0, {k: 'kitchen'}], ['fac', 0, {k: 'tavern'}], ['fac', 0, {k: 'command'}], ['fac', 0, {k: 'merchant'}], ['fac', 0, {k: 'house'}], ['fac', 0, {k: 'cells'}], ['fac', 0, {k: 'barracks'}], ['fac', 0, {k: 'training'}], ['fac', 0, {k: 'armoury'}], ['fac', 0, {k: 'stables'}], ['fac', 0, {k: 'ranger'}], ['fac', 0, {k: 'hospital'}], ['fac', 0, {k: 'blacksmith'}], ['fac', 0, {k: 'carpentry'}], ['fac', 0, {k: 'leather'}], ['fac', 0, {k: 'engineering'}], ['fac', 0, {k: 'alchemy'}], ['fac', 0, {k: 'magetower'}], ['fac', 0, {k: 'chapel'}], ['fac', 0, {k: 'church'}], ['fac', 0, {k: 'kennels'}], ['fac', 0, {k: 'gatehouse'}], ['fac', 0, {k: 'watchtower'}], ['fac', 0, {k: 'trapyard'}], ['fac', 0, {k: 'edelos'}], ['fac', 0, {k: 'b_deckhouse', g: 'flag', big: 1, roof: '#7a3e26'}], ['fac', 0, {k: 'b_grog', g: 'mug', roof: '#8a3a2a'}], ['fac', 0, {k: 'b_fightdeck', g: 'shield', big: 1, roof: '#5a4a3a'}], ['fac', 0, {k: 'b_tarp', c: '#ece4cf', cross: 1}], ['fac', 0, {k: 'b_galley'}], ['fac', 0, {k: 'b_hatch', g: 'anvil', smoke: 1}], ['fac', 0, {k: 'b_hatch', g: 'bars', dark: 1}], ['fac', 0, {k: 'b_rigging'}], ['fac', 0, {k: 'b_mast', g: 'star', orb: 1}], ['fac', 0, {k: 'b_bench', g: 'saw'}], ['fac', 0, {k: 'b_cannon'}], ['fac', 0, {k: 'b_shrine'}], ['fac', 0, {k: 'b_nets'}], ['fac', 0, {k: 'w_wbay', c: '#8a3a2a', g: 'mug'}], ['fac', 0, {k: 'w_wbay', c: '#7a3e26', g: 'flag', big: 1}], ['fac', 0, {k: 'w_kpen', g: 'boot'}], ['fac', 0, {k: 'w_loft'}], ['fac', 0, {k: 'w_galley'}], ['fac', 0, {k: 'w_stall'}], ['fac', 0, {k: 'w_cage', dark: 1}], ['fac', 0, {k: 'w_cage', g: 'shield'}], ['fac', 0, {k: 'w_pit'}], ['fac', 0, {k: 'w_ladder', g: 'star', orb: 1}], ['fac', 0, {k: 'w_furnace', g: 'anvil'}], ['fac', 0, {k: 'w_vat'}], ['fac', 0, {k: 'w_barricade'}], ['fac', 0, {k: 'w_bench', g: 'stake'}], ['mprop', 0, {k: 'chest'}], ['mprop', 0, {k: 'chest', open: 1}], ['mprop', 0, {k: 'cage'}], ['mprop', 0, {k: 'vault'}], ['mprop', 0, {k: 'beacon', lit: 1}], ['mprop', 0, {k: 'banner', flag: 'war'}], ['mprop', 0, {k: 'relic'}], ['mprop', 0, {k: 'ruinstone'}], ['mprop', 0, {k: 'column'}], ['mprop', 0, {k: 'gate'}], ['mprop', 0, {k: 'gate', open: 1}], ['fprop', 0, {k: 'caltrops'}], ['fprop', 1, {k: 'beartrap'}], ['fprop', 2, {k: 'tripwire'}], ['fprop', 3, {k: 'deadfall'}], ['fprop', 0, {k: 'firepot'}], ['fprop', 1, {k: 'stakes'}], ['fprop', 2, {k: 'crystal'}], ['fprop', 3, {k: 'relic_held'}], ['fprop', 0, {k: 'tracks'}], ['fprop', 1, {k: 'pit'}], ['fprop', 2, {k: 'hide'}], ['fprop', 3, {k: 'footing'}], ['fprop', 0, {k: 'scaffold'}], ['fprop', 1, {k: 'buildpile'}], ['sprop', 0, {k: 'hearth'}], ['sprop', 1, {k: 'counter'}], ['sprop', 0, {k: 'table'}], ['sprop', 0, {k: 'door'}], ['sprop', 0, {k: 'kegs'}], ['sprop', 0, {k: 'barrels'}], ['sprop', 2, {k: 'candle'}], ['sprop', 0, {k: 'ale'}], ['sprop', 0, {k: 'gy_back'}], ['sprop', 0, {k: 'gy_front'}], ['decor', 0, {k: 'bones'}]];
    const sps = items.map(i => V.sprite(i[0], i[1], se, i[2])), cell = 360, cols = 4, rows = Math.ceil(sps.length / cols), c = mk(cols * cell, rows * cell), g = c.getContext('2d');
    g.fillStyle = '#4e4a36'; g.fillRect(0, 0, c.width, c.height);
    sps.forEach((sp, i) => { const x = (i % cols) * cell + cell / 2, y = (i / cols | 0) * cell + cell - 20; if (!sp) return; if (sp.shadow){ g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.6; g.drawImage(sp.shadow.img, x - sp.shadow.ax, y - sp.shadow.ay); g.restore(); } g.drawImage(sp.img, x - sp.ax * sp.s, y - sp.ay * sp.s, sp.img.width * sp.s, sp.img.height * sp.s); g.fillStyle = '#ddd'; g.font = '11px sans-serif'; g.fillText(items[i][0] + ' ' + items[i][1], (i % cols) * cell + 4, (i / cols | 0) * cell + 12); });
    return c;
  };
  V.checkBuilding = function(geo){   /* INDEX F44 (j): windows clear of posts, beams, quoins, the door and each other; decals clear of windows and the door */
    const bad = [], X = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
    geo.win.forEach((a, i) => { for (const k of ['post', 'beam', 'quoin']) for (const b of geo[k]) if (X(a, b)) bad.push('window x ' + k); if (X(a, geo.door)) bad.push('window x door'); for (let j = i + 1; j < geo.win.length; j++) if (X(a, geo.win[j])) bad.push('window x window'); });
    for (const d of geo.decal) for (const q of geo.win.concat([geo.door])){ const nx = Math.max(q[0], Math.min(d[0], q[0] + q[2])), ny = Math.max(q[1], Math.min(d[1], q[1] + q[3])); if (Math.hypot(d[0] - nx, d[1] - ny) < d[2]) bad.push('decal x window/door'); }
    if (window.BLDG48 !== false){   /* INDEX F48: braces, decals on timber, the door under a beam, windows inside the wall */
      const segRect = (b, q) => { for (let k = 0; k <= 24; k++){ const t = k / 24, x = b[0] + (b[2] - b[0]) * t, y = b[1] + (b[3] - b[1]) * t; if (x > q[0] && x < q[0] + q[2] && y > q[1] && y < q[1] + q[3]) return true; } return false; };
      for (const b of geo.brace || []) for (const q of geo.win.concat([geo.door])) if (segRect(b, q)) bad.push('brace x window/door');
      for (const b of geo.beam) if (b[3] > 4 * (geo.R || 1) && X(b, geo.door) && b[1] > geo.door[1] + 2) bad.push('beam x door');
      for (const d of geo.decal){ for (const q of geo.post.concat(geo.quoin, geo.beam)){ const nx = Math.max(q[0], Math.min(d[0], q[0] + q[2])), ny = Math.max(q[1], Math.min(d[1], q[1] + q[3])); if (Math.hypot(d[0] - nx, d[1] - ny) < d[2]) { bad.push('decal x timber/quoin'); break; } } for (const b of geo.brace || []) if (segD(d[0], d[1], b) < d[2]) bad.push('decal x brace'); }
    }
    return bad;
  };
  V.selfTest = function(){
    const rows = [], ok = (n, c) => rows.push({name: n, ok: !!c});
    try {
      for (const k of ['oak', 'pine', 'birch', 'dead', 'boulder', 'rubble']){ const sp = V.sprite(k, 0, 'summer'); ok('VO3: ' + k + ' paints with a base anchor inside the image and a shadow', sp && sp.img.width > 8 && sp.ay > 0 && sp.ay <= sp.img.height && sp.ax > 0 && sp.ax < sp.img.width && sp.shadow && sp.shadow.img.width > 0); }
      const b = V.sprite('building', 1, 'autumn', {w: 3, d: 2}); ok('VO3: a 3x2 building overhangs its footprint (three cells times K.footprint) but stays under nine cells (the three-quarter side wall and the eaves)', b && b.img.width * b.s > 3 * CELLW() * V.K.footprint && b.img.width * b.s < 9 * CELLW());
      const t = V.sprite('tent', 0, 'winter', {w: 2}); ok('VO3: a tent paints in winter', t && t.img.height > 10);
      { const bad = []; let n = 0; for (const se of ['spring', 'summer', 'autumn', 'winter']) for (let v = 0; v < 12; v++) for (const o of [{w: 2, d: 2}, {w: 3, d: 2}, {w: 4, d: 3}, {w: 3, d: 2, upper: true}, {w: 2, d: 2, wall: 0.8}]){ const sp = V.sprite('building', v, se, o); if (sp && sp.geo){ n++; const b = V.checkBuilding(sp.geo); if (b.length) bad.push(se + v + JSON.stringify(o) + ':' + b[0]); } } ok('VO3: building sanity (F-44 i/j): no window crosses a post, beam, quoin, door or window, no decal covers a window or door, over ' + n + ' buildings' + (bad.length ? ' [' + bad.slice(0, 3).join('; ') + ']' : ''), window.BLDG44 === false || (n > 100 && !bad.length)); }
      const h = V.sprite('oak', 1, 'summer'); ok('VO3: an oak stands about its knob height', h && h.img.height * h.s > V.K.oakH - 16 && h.img.height * h.s < V.K.oakH * (window.TREE48 !== false ? 1.3 : 1) + 16);   /* F-48: the whole crown is kept now, so an oak can stand up to a fifth taller than the knob */
      { const d = h.img.getContext('2d').getImageData(0, 0, h.img.width, 1).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; ok('VO3: an oak crown is not cut off square at the top of its picture (F-48 sanity 12)', window.TREE48 === false || n < h.img.width * 0.2); }
      ok('VO3: an oak is at least three persons tall and a wall one person (Patrick: people were bigger than trees)', h && h.img.height * h.s >= 3 * V.K.person && V.K.wallH >= V.K.person);
      ok('VO3: scale pass (Patrick: doorways were small, cobbles big): a house door is at least 0.78 persons (S26: a facility door is 60, the mage tower door) and fits under the wall, the set door and the strongroom door at least a person, a flag at most 0.4 persons across', V._doorH >= V.K.person * 0.78 && V._doorH <= V.K.person * 1.25 && SPROP.door[1] * 0.92 >= V.K.person && MPROP.vault[1] * 0.64 >= V.K.person && (() => { const p = {water: [80, 110, 120], mud: [60, 48, 36], dirt: [90, 76, 60], stone: [100, 100, 96], moss: [70, 80, 44]}, m = V.mat(p, 'summer'); let w = 0; for (let x = 2; x < 60; x++){ const c = m.flags(x, 10, 0.5, 0.5, 0.5); if (c[0] < m.flags(x - 1, 10, 0.5, 0.5, 0.5)[0] * 0.7){ w = x; break; } } return w > 0 && w <= V.K.person * 0.4; })() && (typeof TILE === 'undefined' || (TILE.floor(0).width === 260 && TILE.floor(0).height === 260)));
      { const fk = Object.keys(FAC_KIND)[0], pp = V.persp, runs = [], di = ctx.drawImage; try { for (const q of [0.8, 1.2]){ const w = []; ctx.drawImage = function(im, x, y, ww){ if (ww > 40) w.push(Math.round(ww * 100)); return di.apply(this, arguments); }; V.persp = () => q; V.drawFacility(fk, 300, 400, {}); runs.push(w.join()); } } catch (e) { runs.length = 0; } finally { ctx.drawImage = di; V.persp = pp; } ok('VO3: SW-3 a facade keeps one scale at every screen row (the ground does not scale, so a building must not)', runs.length === 2 && runs[0].length > 0 && runs[0] === runs[1]); }
      { let good = false; try { const b = V.sprite('building', 1, 'summer', {w: 3, d: 2}), im = b.img, gx = im.getContext('2d'), right = y => { const d = gx.getImageData(0, y, im.width, 1).data; for (let x = im.width - 1; x >= 0; x--) if (d[x * 4 + 3] > 8) return x; return -1; }; good = right(im.height - 3) <= right(Math.round(im.height * 0.75)) + 2; } catch (e) {} ok('VO3: SW-4 the foot band stays on the wall: the lowest row of a house reaches no farther right than its side wall', good); }
      ok('VO3: camera standard: the prologue town\'s people land at the hub\'s drawn scale (2.2 * townFigure = 2.4 * hubFigure)', Math.abs(2.2 * V.K.townFigure - 2.4 * V.K.hubFigure) < 1e-9);
      ok('VO3: camera standard (Patrick 2026-11-12): the frame target sits a tenth below the character, the depth scale is 1 on that row, under 1 at the top edge and over 1 at the bottom, the hub people share the buildings\' scale', V.K.frameDown === 0.1 && (() => { const H = (typeof VH === 'number' && VH > 0) ? VH : 800; return Math.abs(V.perspAt(H * 0.6, H) - 1) < 1e-9 && V.perspAt(0, H) < 0.9 && V.perspAt(H, H) > 1.05; })() && V.K.hubFigure === V.K.hubBuild);   /* the hidden pane has a 0-high viewport: test against 800 then */
      { const b = V.sprite('building', 0, 'summer', {w: 2, d: 2}); ok('VO3: camera standard: a house shows one roof slope, so it stands under 2.2 walls tall with its three-quarter gable', b && b.img.height * b.s <= V.K.wallH * 2.2); }
      { const b = V.sprite('building', 1, 'summer', {w: 3, d: 2}); ok('VO3: camera standard: a three-cell house is at least 2.6 persons (4.5 m) wide and under 2.2 walls tall', b && b.img.width * b.s >= V.K.person * 2.6 && b.img.height * b.s <= V.K.wallH * 2.2); }
      const pl = V.sprite('palisade', 0, 'summer', {mask: 10}), pv = V.sprite('palisade', 1, 'summer', {mask: 5}); ok('VO3: a palisade stands over a person, its stakes across the cell; a vertical run paints', pl && pl.img.height * pl.s > V.K.person && pl.img.width * pl.s >= CELLW() && pv && pv.img.height > 10);
      const wl = V.sprite('wall', 0, 'summer', {run: 3, ends: 3}); ok('VO3: a three-cell wall spans its cells and stands a person high', wl && wl.img.width * wl.s >= 3 * CELLW() && wl.img.height * wl.s >= V.K.person);
      const cf = V.sprite('cliff', 0, 'autumn'), gt = V.sprite('gate', 0, 'summer', {n: 3, stone: 0}); ok('VO3: a cliff paints wider than its cell (no seam) and a gate spans its three cells', cf && cf.img.width * cf.s > CELLW() && !cf.tall && gt && gt.img.width * gt.s >= 3 * CELLW() && gt.tall);
      const hr = V.sprite('hearth', 0, 'summer'), wg = V.sprite('wagon', 0, 'summer'); ok('VO3: the hearth is over half a cell wide and low, the wagon over a cell long and low', hr && wg && hr.img.width * hr.s > CELLW() / 2 && !hr.tall && wg.img.width * wg.s > CELLW() && !wg.tall);
      ok('VO3: fire, flames and the wagon draw on the frame; the ground materials are darker water and churned road', typeof V.drawFire === 'function' && typeof V.drawFlames === 'function' && (!window.GROUND || GROUND.MAT === V.mat) && (() => { const p = {water: [80, 110, 120], mud: [60, 48, 36], dirt: [90, 76, 60], stone: [100, 100, 96], moss: [70, 80, 44]}, m = V.mat(p, 'summer'), w = m.water(0, 0, 0.5, 0.5, 0.5, 0.5), rd = m.road(0, 0, 0.5, 0.5, 0.5, 0.5); return w[1] < p.water[1] * 0.6 && rd[0] < p.dirt[0]; })());
      ok('VO3: trees are tall (see-through near the Leader), rocks are not', V.sprite('pine', 0, 'summer').tall && !V.sprite('boulder', 1, 'summer').tall);
      ok('VO3: the cache answers the same sprite twice', V.sprite('dead', 2, 'spring') === V.sprite('dead', 2, 'spring'));
      ok('VO3: the sheet draws', V.sheet('summer').width > 100);
      ok('VO3: the ground palette is handed to VO2 and the decals thinned', !window.VO2 || (VO2.pal === V.pal && GROUND.K.decal.leaves === V.decal.leaves));
      ok('VO3: no old sprite drawer is referenced', !/treeSprite|decorSprite|houseSprite|tentSprite|w3dTree|KIND\./.test(String(tree) + String(building) + String(tent) + String(boulder) + String(rubble) + String(palisade) + String(wall) + String(cliff) + String(gate) + String(hearth) + String(wagon) + String(decor) + String(prop) + String(mapProp) + String(fieldProp) + String(setProp) + String(facility)));
      const dk = Object.keys(DECOR), dsp = dk.map(k => V.sprite('decor', 0, 'summer', {k})); ok('VO3: all ' + dk.length + ' decor kinds paint, none over a person tall, the bush and the flowers go to scrub', dsp.every(d => d && d.img.height * d.s <= V.K.person) && V.drawDecor('flowers', -9999, -9999, {}) === true && V.drawDecor('bones', -9999, -9999, {}) === true && V.drawDecor('benchlog', -9999, -9999, {}) === true);
      const pk = Object.keys(PROP), psp = pk.map(k => V.sprite('prop', 1, 'summer', {k})); ok('VO3: the stake, the trophy rack, the paddock, the plot, the two graves and the gate tower paint; stake, rack, graves and tower stand tall, paddock and plot lie flat; a grave fits its 29 px grave pitch, the tower is one to two persons; an unknown kind falls through', psp.every(d => d) && psp[0].tall && psp[1].tall && !psp[2].tall && !psp[3].tall && psp[4].tall && psp[5].tall && psp[6].tall && psp[4].img.width * psp[4].s <= 44 && psp[5].img.width * psp[5].s <= 44 && psp[6].img.height * psp[6].s >= V.K.person && psp[6].img.height * psp[6].s <= 2 * V.K.person && psp[0].img.height * psp[0].s <= V.K.palH + 12 && V.drawProp('m_cage', 0, 0, {}) === null);
      const mk_ = Object.keys(MPROP_KIND), msp = mk_.map(k => V.sprite(MPROP_KIND[k][2] === 2 ? 'sprop' : MPROP_KIND[k][2] ? 'fprop' : 'mprop', 2, 'summer', Object.assign({k: MPROP_KIND[k][0]}, MPROP_KIND[k][1]))); ok('VO3: all ' + mk_.length + ' holding, field and set props paint (chest, cage, vault, beacon, banner, relic, ruin stone, column, gate, the six traps, crystal, held relic, tracks, pit, hide, footing, scaffold, build pile, the eight tavern pieces, the graveyard walls), none over 2.4 persons (the graveyard back wall spans the 120 px plot), the set pieces cast no shadow, m_plot stays with the fort props', mk_.length === 40 && mk_.filter(k => MPROP_KIND[k][2] === 2).every(k => V.sprite('sprop', 0, 'summer', {k: MPROP_KIND[k][0]}).shadow === null) && msp.every(d => d && d.img.height * d.s <= V.K.person * 2.4) && V.drawMapProp('m_plot', 0, 0, {}) === null && V.drawMapProp('m_flames', 0, 0, {}) === null);
      const fk = Object.keys(FAC).filter(k => k.slice(1, 2) !== '_'), fsp = fk.map(k => V.sprite('fac', 0, 'summer', {k})); ok('VO3: all ' + fk.length + ' fort facilities paint (tents, huts, bunks, kitchen, tavern, command tent, stalls, the house, cells, barracks, training ground, armoury, stables, ranger lodge, hospital, smithy, carpentry, tannery, engineering yard, alchemy, mage tower, chapel, church, kennels, gatehouse, watchtower, trap yard, the Edelos wagon), each within 240 px wide (the Edelos wagon 270; 190 plus the three-quarter side wall; S26 widened the house-type cells) and 3 persons tall (the two-storey tavern 3.6; the kitchen smokes); damaged and ruined forms draw; an unknown kind falls through', fsp.every((d, i) => d && d.img.width * d.s <= (fk[i] === 'edelos' ? 270 : 240) && d.img.height * d.s <= V.K.person * (fk[i] === 'tavern' ? 3.6 : 3))   /* F-44: the tavern is two storeys (ART37) and the Edelos wagon is a long vehicle, so each gets its own allowance */ && V.drawFacility('f_kitchen_dmg', -9999, -9999, {}) === true && V.drawFacility('ws_f_tavern', -9999, -9999, {}) === true && V.drawFacility('f_nothing', 0, 0, {}) === null);
      const sk = Object.keys(FAC).filter(k => k.slice(1, 2) === '_'), ssp = sk.map(k => V.sprite('fac', 0, 'summer', {k, g: 'mug', big: 1, orb: 1, smoke: 1, cross: 1})); ok('VO3: all ' + sk.length + ' barge and warehouse skin types paint (deckhouse, grog shop, fighting deck, tarp, galley, hatch, rigging, mast, bench, cannon, prow shrine, boarding nets; bay, kennel pen, hammock loft, soup kitchen, street stall, cage, sparring pit, ladder, furnace, vats, barricade, bench), each within 190 px wide and 2.4 persons tall (the barge plots sit at 0.85 of the fort pitch); sk2_barge_tavern and sk2_warehouse_cells resolve when the look tables are present', ssp.every(d => d && d.img.width * d.s <= 230 && d.img.height * d.s <= V.K.person * 2.9) && (typeof BARGE_LOOK === 'undefined' || (V.drawFacility('sk2_barge_tavern', -9999, -9999, {}) === true && V.drawFacility('sk2_warehouse_cells_dmg', -9999, -9999, {}) === true)));
      const g1 = V.sprite('mprop', 0, 'summer', {k: 'chbanner', div: 'plain', c1: '#7a3e26', c2: '#d4af37', charge: '#d4af37', glyph: 'eye'}), g2 = V.sprite('mprop', 0, 'summer', {k: 'chbanner', div: 'plain', c1: '#7a3e26', c2: '#d4af37', charge: '#d4af37', glyph: 'skull'});
      ok('VO3: the Chapter banner carries the chosen glyph (eye and skull paint differently; the round charge is gone)', g1 && g2 && g1 !== g2 && g1.img.toDataURL() !== g2.img.toDataURL());
      ok('VO3: the fort layout stands at hubS (the house at 880 * hubS) and CAMP_W follows it in the fort', typeof CAMP_LAYOUT === 'undefined' || (CAMP_LAYOUT.fort.__vo3S === V.K.hubS && Math.abs(CAMP_LAYOUT.fort.hub.house[0] - 880 * V.K.hubS) < 1 && (typeof layoutKey !== 'function' || layoutKey() !== 'fort' || CAMP_W === 1760 * V.K.hubS)));
    } catch (e) { rows.push({name: 'VO3: threw ' + e, ok: false}); }
    const pass = rows.filter(r => r.ok).length, fail = rows.length - pass;
    if (fail) console.warn('VO3.selfTest', rows.filter(r => !r.ok).map(r => r.name));
    return {pass, fail, details: rows, ok: !fail};
  };
})();
