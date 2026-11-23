/* ============================================================================
   INDEX GROUND1 - VO-2 painted ground (Fable session "vo2-ground", 2026-11-11)
   Contract: docs/vo2-design.md (the js/3d/ground.js block). Direction: docs/art-direction.md 1 to 3.
   WHAT: the field's ground as one painted picture instead of square tiles. Materials are
   tileable noise paintings (grass, hill, forest floor, mud, road, rubble, stone footing,
   flags, boards, water) coloured from LOOK.pal / SEASONS_CFG with a tint per setting (the
   contract's host). The map is painted once into 512 px world-space chunks: grass is the
   body, every other terrain is a layer masked by soft jittered discs per cell, so edges
   blend over about half a cell and chunk borders meet without seams (a one-cell margin is
   painted into every chunk). Detail passes add road ruts, worn paths, lit hill edges, wall
   footing, rubble pieces, a muddy bank round water; decals (puddles, cracks, bones, leaves,
   scorch) sit by cell hash, so a map always paints the same; baked shadow (the hour's cool
   shadow colour, multiplied, never grey) lies on the side of STONE, WALL, PALISADE, ROOF and
   TENT cells away from GROUND.lightDir, a light ambient on every FOREST cell and a canopy disc
   under every MAP.trees entry (the world stream draws the trees), compounding to dark inside a wood.
   MAP.puddles (the game's winter puddles, drawPuddleList's when VO2 is off) are baked in; their ring animates in draw(). draw() paints only the chunks in view with no per-frame allocation; water
   gets a slow shimmer from G.frame.
   API: GROUND.build(map, env) / draw(ctx, cx, cy) / decal(kind, x, y, r) / invalidate() / warm(env) /
   lightDir / selfTest() / sheet() / sampler() / stats(). Set GROUND.PROF = {} before a build to get per-phase ms. Nothing here runs unless called: the game is
   unchanged until the composer (js/3d/vo2.js) calls build and draw with VO2.on.
   KNOBS: GROUND.K (blend radii, jitter, shadow alpha and offset, decal rates, shimmer),
   GROUND.TINT (per-setting cast), GROUND.RES (chunk pixels per world px, 1), GROUND.LAZY (paint
   chunks on first view instead of all in build), GROUND.lightDir. Chunk canvases are pooled across maps.
   ROLLBACK: remove the script tag.
============================================================================ */
(function(){
'use strict';
const W = window;
const CELL_ = (typeof W.CELL === 'number') ? W.CELL : 40;
const TT = W.T || {GRASS:0, FOREST:1, STONE:2, WATER:3, HILL:4, ROAD:5, FLOOR:6, PALISADE:7, ROOF:8, TENT:9, RUBBLE:10, WALL:11, WAGON:12, GATE:13};
const CH = 512;                     // chunk size in world px
const TILE_N = 256;                 // material tile size (periodic)
const INK = '#16130f';

const GROUND = W.GROUND = {
  VERSION: 1,
  RES: 1,
  LAZY: false,                      // true: build() only lays the chunk grid out and draw() paints a chunk the first time it is in view
  lightDir: {x: -0.6, y: 0.8},      // unit vector from the ground toward the key light; baked shadow lies the other way
  K: {
    smooth: 1,                       // Q103: 1 = the hill outline is one smoothed contour (mask and light edges); 0 = the old stepped look
    blend: 0.5,                      // cells: how far a layer's soft edge reaches
    jitter: 0.18,                    // cells: disc centre jitter (organic edges)
    mottle: 0.2,                    // alpha of the large grass mottle discs
    shadowA: 0.42, shadowOff: 0.7,  // tall-cell shadow alpha and offset (cells)
    canopyA: 0.16, canopyOff: 0.3,   // ambient shade per FOREST cell (the wood's floor)
    treeA: 0.42, treeOff: 0.45, treeR: 1.15,   // canopy shadow under each MAP.trees entry, offset against lightDir (cells)
    denseA: 0.18,                    // extra shadow inside a wood (6+ forest neighbours)
    worn: 0.42,                      // alpha of the worn path on grass next to a road
    rut: 0.22,                       // road rut alpha
    rutGap: 0.14,                    // half the distance between the two ruts (cells)
    rutMin: 3,                       // shortest road run that gets ruts (cells)
    rutAni: 0.3,                     // least anisotropy of the road for ruts to show (0 blob, 1 straight)
    decal: {puddle: 0.035, crack: 0.09, bones: 0.006, leaves: 0.45, scorch: 0.012},
    shimmer: 0.2, shimmerSpeed: 0.35
  },
  TINT: {   // per setting (contract host): desaturate, then a cast colour at k
    bandits:    {desat: 0.06, cast: '#6a5a44', k: 0.04},
    greenskins: {desat: 0.08, cast: '#4a4028', k: 0.10},
    monsters:   {desat: 0.05, cast: '#2e3a26', k: 0.08},
    hollow:     {desat: 0.30, cast: '#5a5e66', k: 0.14},
    deserters:  {desat: 0.16, cast: '#56687a', k: 0.13},
    camp:       {desat: 0.08, cast: '#6b5238', k: 0.12}
  },
  SETTINGS: ['bandits', 'greenskins', 'monsters', 'hollow', 'deserters'],
  SEASONS: ['spring', 'summer', 'autumn', 'winter']
};

/* ------------------------------------------------------------ helpers --- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const lum = a => a[0] * 0.3 + a[1] * 0.59 + a[2] * 0.11;
const desat = (a, k) => { const l = lum(a); return [a[0] + (l - a[0]) * k, a[1] + (l - a[1]) * k, a[2] + (l - a[2]) * k]; };
const css = (a, al) => 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + (al === undefined ? 1 : al) + ')';
function hash32(x, y, k){ let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return h >>> 0; }
const hf = (x, y, k) => hash32(x, y, k) / 4294967296;
function rngOf(seed){ let s = (seed >>> 0) || 7; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const smooth = t => t * t * (3 - 2 * t);

/* periodic value noise over a TILE_N square: lattice spacing sx, sy (both divide TILE_N) */
function noiseField(seed, sx, sy){
  const N = TILE_N, nx = N / sx, ny = N / sy, r = rngOf(seed), lat = new Float32Array(nx * ny);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++){
    const gy = y / sy, y0 = gy | 0, ty = smooth(gy - y0), y1 = (y0 + 1) % ny;
    for (let x = 0; x < N; x++){
      const gx = x / sx, x0 = gx | 0, tx = smooth(gx - x0), x1 = (x0 + 1) % nx;
      const a = lat[y0 * nx + x0], b = lat[y0 * nx + x1], c = lat[y1 * nx + x0], d = lat[y1 * nx + x1];
      out[y * N + x] = (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
    }
  }
  return out;
}
let NF = null;   // the noise fields, built once per page
function fields(){
  if (NF) return NF;
  const A = noiseField(101, 64, 64), B = noiseField(202, 16, 16), C = noiseField(303, 4, 4), S = noiseField(404, 32, 4), V = noiseField(505, 4, 32), B2 = noiseField(606, 32, 32);
  const N = TILE_N * TILE_N, fb = new Float32Array(N);
  for (let i = 0; i < N; i++) fb[i] = A[i] * 0.5 + B2[i] * 0.3 + B[i] * 0.2;   // fractal mottle
  return NF = {A: fb, B, C, S, V};
}

/* ---------------------------------------------------------- palette --- */
const FALLBACK = {
  spring: {grass: '#566b3a', dirt: '#6e5a40', forest: '#36502a', mud: '#463424', water: '#2e6488', stone: '#7e7c76'},
  summer: {grass: '#626a36', dirt: '#7a6646', forest: '#3e4c28', mud: '#4e3c28', water: '#286480', stone: '#807c74'},
  autumn: {grass: '#826634', dirt: '#6b5238', forest: '#3d3a22', mud: '#44301e', water: '#2c5068', stone: '#7a7670'},
  winter: {grass: '#4e5444', dirt: '#605a4e', forest: '#333d2c', mud: '#3e342a', water: '#223e54', stone: '#787c80'}
};
const LEAVES = {spring: ['#a8b060', '#c8b870', '#f4b8c8'], summer: ['#b8a850', '#a89040', '#c87050'], autumn: ['#c84a20', '#df8228', '#e0a838', '#8a3618'], winter: ['#7a8478', '#8e988c', '#5a645a']};
function palette(season, host){
  const L = W.LOOK, SC = W.SEASONS_CFG, WP = W.W3D_PAL;
  const base = (L && L.pal && L.pal[season]) || FALLBACK[season] || FALLBACK.summer, fb = FALLBACK[season] || FALLBACK.summer;
  const tint = GROUND.TINT[host] || GROUND.TINT.bandits, cast = hex(tint.cast);
  const T_ = h => { let c = desat(hex(h), tint.desat); return mix(c, cast, tint.k); };
  const p = {
    grass: T_(base.grass || fb.grass), dirt: T_(base.dirt || fb.dirt), forest: T_(base.forest || fb.forest), mud: T_(base.mud || fb.mud),
    water: mul(desat(T_((SC && SC[season] && SC[season].water) || fb.water), 0.18), 0.86),
    stone: T_((WP && WP[season] && WP[season].stone) || fb.stone),
    wood: T_('#5a3e26'), moss: T_('#4a5e34'), ash: T_('#8a8478'), bone: hex('#d8ccb0'),
    leaves: (LEAVES[season] || LEAVES.summer).map(h => mix(hex(h), [120, 110, 90], 0.25)),
    snow: hex('#c8ccc8')
  };
  p.hill = mul(mix(p.grass, mix(p.dirt, [200, 170, 120], 0.2), 0.45), 1.14);
  p.litter = season === 'autumn' ? mix(hex('#8a5a28'), p.forest, 0.3) : mix(hex('#5a4a2c'), p.forest, 0.35);
  return p;
}

/* -------------------------------------------------------- materials --- */
/* each paints one pixel: (x, y, A big mottle, B mid, C fine, S horizontal streaks, V vertical streaks) -> [r,g,b] */
function materials(p, season){
  const flagShade = (fx, fy) => 0.92 + hf(fx, fy, 9) * 0.16;
  return {
    grass: (x, y, A, B, C, S) => {
      let c = p.grass;
      if (A > 0.5) c = mix(c, p.dirt, (A - 0.5) * 0.9);                   // dry worn patches
      if (B < 0.42) c = mul(c, 0.84 + B * 0.3);                            // darker damp hollows
      c = mul(c, 0.93 + C * 0.14);                                        // blades
      if (S > 0.78) c = mul(c, 1.06);                                      // lie of the grass
      if (C > 0.985) c = mix(c, p.leaves[1] || p.dirt, 0.5);              // a seed head or fleck
      if (season === 'winter' && A < 0.3 && C > 0.5) c = mix(c, p.snow, (0.3 - A) * 1.6);   // old snow in the hollows
      return c;
    },
    hill: (x, y, A, B, C, S) => {
      let c = p.hill;
      c = mul(c, 0.9 + S * 0.18);                                          // slope striations
      c = mul(c, 0.95 + C * 0.1);
      if (A > 0.6) c = mix(c, p.dirt, (A - 0.6) * 0.8);                   // bare scree
      if (C > 0.975) c = mix(c, p.stone, 0.6);                             // small stones
      return c;
    },
    forest: (x, y, A, B, C, S, V) => {
      let c = mul(p.forest, 0.86);
      c = mul(c, 0.88 + S * 0.2);                                          // needle drifts
      if (B > 0.6) c = mix(c, p.litter, (B - 0.6) * 1.2);                 // leaf litter
      if (A > 0.62) c = mix(c, p.moss, (A - 0.62) * 0.9);                 // moss
      if (C < 0.08) c = mul(c, 0.68);                                      // pits
      if (V > 0.9) c = mul(c, 0.8);                                        // roots
      if (season === 'winter' && A < 0.35 && C > 0.4) c = mix(c, p.snow, (0.35 - A) * 0.9);
      return c;
    },
    mud: (x, y, A, B, C, S) => {
      let c = p.mud;
      if (A < 0.45) c = mix(mul(c, 0.78), [40, 46, 56], 0.15);           // wet, cool
      c = mul(c, 0.92 + S * 0.14);                                        // ridges
      c = mul(c, 0.96 + C * 0.08);
      return c;
    },
    road: (x, y, A, B, C, S) => {
      let c = mul(mix(p.dirt, [190, 170, 130], 0.12), 1.08);                    // packed pale dirt, lighter than the grass
      c = mul(c, 0.92 + B * 0.16);
      if (C > 0.93) c = mix(c, p.stone, 0.5);                              // pebbles
      if (C < 0.06) c = mul(c, 0.8);                                       // hoof pocks
      if (A > 0.6) c = mul(c, 1.05);                                       // dust
      return c;
    },
    rubble: (x, y, A, B, C) => {
      let c = mul(mix(p.stone, p.dirt, 0.35), 0.9);
      c = mul(c, 0.84 + C * 0.3);                                          // gravel
      c = mul(c, 0.95 + A * 0.1);
      if (B < 0.3) c = mix(c, p.ash, 0.3);
      return c;
    },
    stone: (x, y, A, B, C) => {                                             // wall footing: flags 32 x 24 in offset rows
      const fy = (y / 24) | 0, ox = (fy & 1) * 16, fx = ((x + ox) / 32) | 0, mx = (x + ox) % 32, my = y % 24;
      let c = mul(p.stone, 0.85 * flagShade(fx, fy));
      if (mx < 2 || my < 2) c = mul(c, 0.62);                              // mortar
      else if (mx === 2 || my === 2) c = mul(c, 1.1);                      // the lit lip
      c = mul(c, 0.95 + C * 0.1);
      if (season !== 'winter' && A > 0.66 && (mx < 7 || my < 7)) c = mix(c, p.moss, (A - 0.66) * 1.2);   // moss in the joints
      if (B < 0.3) c = mul(c, 0.9);                                        // wet
      return c;
    },
    flags: (x, y, A, B, C) => {                                             // fort floor: big flags 48 x 40
      const fy = (y / 40) | 0, ox = (fy & 1) * 24, fx = ((x + ox) / 48) | 0, mx = (x + ox) % 48, my = y % 40;
      let c = mul(mix(p.stone, p.ash, 0.3), flagShade(fx, fy));
      if (mx < 2 || my < 2) c = mul(c, 0.66);
      else if (mx === 2 || my === 2) c = mul(c, 1.08);
      c = mul(c, 0.95 + C * 0.1);
      if (A > 0.7) c = mul(c, 0.92);                                       // worn dark
      return c;
    },
    boards: (x, y, A, B, C, S) => {                                         // tavern floor: planks 18 high, joins staggered
      const py = (y / 18) | 0, jx = ((x + hf(py, 0, 3) * 120) / 120) | 0, my = y % 18;
      let c = mul(p.wood, 0.9 + hf(jx, py, 4) * 0.22);
      c = mul(c, 0.9 + S * 0.16);                                          // grain
      if (my === 0) c = mul(c, 0.55); else if (my === 1) c = mul(c, 1.08);
      if (((x + (hf(py, 0, 3) * 120 | 0)) % 120) < 2) c = mul(c, 0.6);     // the join
      c = mul(c, 0.96 + C * 0.08);
      return c;
    },
    packed: (x, y, A, B, C, S) => {                                         // under a palisade: packed earth
      let c = mul(mix(p.mud, p.dirt, 0.5), 0.9);
      c = mul(c, 0.92 + S * 0.12); c = mul(c, 0.95 + C * 0.1);
      return c;
    },
    footing: (x, y, A, B, C) => {                                           // under a roof: dark packed stone
      let c = mul(mix(p.stone, p.mud, 0.4), 0.7);
      c = mul(c, 0.94 + C * 0.12);
      return c;
    },
    bank: (x, y, A, B, C, S) => {                                           // the wet rim of water
      let c = mix(mul(p.mud, 0.82), [40, 46, 56], 0.12);
      c = mul(c, 0.94 + S * 0.1); c = mul(c, 0.96 + C * 0.08);
      return c;
    },
    water: (x, y, A, B, C, S) => {
      let c = mul(p.water, 0.78 + A * 0.34);                                // depth
      if (S > 0.72) c = mul(c, 1.0 + (S - 0.72) * 0.6);                     // ripples
      c = mul(c, 0.97 + C * 0.06);
      return c;
    }
  };
}
const MATS = {};   // material tiles by season:host
GROUND.clearMats = () => { for (const k in MATS) delete MATS[k]; };   // after GROUND.MAT changes
function matTiles(season, host){
  const key = season + ':' + host;
  if (MATS[key]) return MATS[key];
  const p = palette(season, host), M = materials(p, season), F = fields(), N = TILE_N, out = {pal: p};
  if (typeof GROUND.MAT === 'function') Object.assign(M, GROUND.MAT(p, season, M) || {});   // VO3 (js/3d/vo3.js) hands in its own painters by material name
  for (const name in M){
    const c = mkCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, fn = M[name];
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++){
      const col = fn(x, y, F.A[i], F.B[i], F.C[i], F.S[i], F.V[i]), o = i * 4;
      d[o] = clamp(col[0], 0, 255); d[o + 1] = clamp(col[1], 0, 255); d[o + 2] = clamp(col[2], 0, 255); d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    out[name] = c;
  }
  return MATS[key] = out;
}

/* ------------------------------------------------------ disc sprites --- */
const DISCS = {};
function disc(R, col){   // a soft disc: alpha 1 to 0.55 R, falling to 0 at R; tinted when col is given
  const key = R + ':' + (col || '');
  if (DISCS[key]) return DISCS[key];
  const D = Math.ceil(R * 2) + 2, c = mkCanvas(D, D), g = c.getContext('2d'), gr = g.createRadialGradient(D / 2, D / 2, 0, D / 2, D / 2, R);
  const base = col || 'rgb(0,0,0)';
  const rgb = base.startsWith('#') ? hex(base) : [0, 0, 0];
  gr.addColorStop(0, css(rgb, 1)); gr.addColorStop(0.55, css(rgb, 1)); gr.addColorStop(0.85, css(rgb, 0.35)); gr.addColorStop(1, css(rgb, 0));
  g.fillStyle = gr; g.fillRect(0, 0, D, D);
  return DISCS[key] = c;
}

/* Q103: the hill field. Cell centres hold the hill/not-hill value blurred with [1 2 1] x [1 2 1] / 16, read back bilinearly. A straight edge
   sits exactly on the cell boundary (0.5 there), a stair corner is cut (outside corners rounded, inside corners filled), and the gradient gives the
   contour's own normal. The material mask and the light edges both come from this one field. */
function hillField(at, C){
  const memo = new Map(), H0 = (i, j) => at(i, j) === TT.HILL ? 1 : 0,
    H = (i, j) => H0(i, j) ? ((!H0(i - 1, j) && !H0(i + 1, j)) || (!H0(i, j - 1) && !H0(i, j + 1)) ? 1.3 : 1) : 0;   /* a cell one wide in x or y counts 1.3, so a lone cell or a 1-cell ridge keeps about its old size */
  const B = (i, j) => { const k = i * 4099 + j; let v = memo.get(k); if (v === undefined){
    v = (H0(i-1,j-1) + 2*H0(i,j-1) + H0(i+1,j-1) + 2*H0(i-1,j) + 4*H0(i,j) + 2*H0(i+1,j) + H0(i-1,j+1) + 2*H0(i,j+1) + H0(i+1,j+1)) / 16; memo.set(k, v); } return v; };
  const F = (px, py) => { const u = px / C - 0.5, v = py / C - 0.5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    const sm = (B(i, j) * (1 - a) + B(i + 1, j) * a) * (1 - b) + (B(i, j + 1) * (1 - a) + B(i + 1, j + 1) * a) * b,
      raw = (H(i, j) * (1 - a) + H(i + 1, j) * a) * (1 - b) + (H(i, j + 1) * (1 - a) + H(i + 1, j + 1) * a) * b;
    return Math.max(sm, raw); };   /* the raw bilinear keeps a lone cell or a 1-cell ridge alive (the blur alone would lose it) */
  F.onContour = (px, py) => {   // walk a point on to F = 0.5 along the gradient; returns [x, y, nx, ny] with n pointing out of the hill
    const e = C * 0.08; let gx = 1, gy = 0;
    for (let it = 0; it < 4; it++){ gx = F(px + e, py) - F(px - e, py); gy = F(px, py + e) - F(px, py - e); const m = gx * gx + gy * gy; if (m < 1e-9) break;
      const k = (F(px, py) - 0.5) * 2 * e / m; px -= gx * k; py -= gy * k; }
    gx = F(px + e, py) - F(px - e, py); gy = F(px, py + e) - F(px, py - e); const m = Math.hypot(gx, gy) || 1;
    return [px, py, -gx / m, -gy / m]; };
  return F;
}

GROUND.hillField = hillField;   /* Q103: the cliff faces in world.js read the same field */

/* ----------------------------------------------------- the layers --- */
const LAYERS = [
  {name: 'hill',    mat: 'hill',    R: 0.95, jit: 1.0,  is: t => t === TT.HILL, round: true},
  {name: 'forest',  mat: 'forest',  R: 1.0,  jit: 1.1,  is: t => t === TT.FOREST},
  {name: 'tent',    mat: 'mud',     R: 0.95, jit: 0.7,  is: t => t === TT.TENT},
  {name: 'bank',    mat: 'bank',    R: 1.12, jit: 0.8,  is: t => t === TT.WATER},
  {name: 'rubble',  mat: 'rubble',  R: 0.82, jit: 1.2,  is: t => t === TT.RUBBLE},
  {name: 'road',    mat: 'road',    R: 0.8,  jit: 0.7,  is: t => t === TT.ROAD || t === TT.GATE, worn: true},
  {name: 'flags',   mat: 'flags',   R: 0.74, jit: 0.3,  is: (t, brawl) => t === TT.FLOOR && !brawl},
  {name: 'boards',  mat: 'boards',  R: 0.74, jit: 0.2,  is: (t, brawl) => brawl && (t === TT.FLOOR || t === TT.WAGON)},
  {name: 'packed',  mat: 'packed',  R: 0.82, jit: 0.5,  is: t => t === TT.PALISADE},
  {name: 'footing', mat: 'footing', R: 0.8,  jit: 0.3,  is: t => t === TT.ROOF},
  {name: 'stone',   mat: 'stone',   R: 0.86, jit: 0.3,  is: t => t === TT.STONE || t === TT.WALL},
  {name: 'water',   mat: 'water',   R: 0.9,  jit: 0.6,  is: t => t === TT.WATER}
];
const TALL = t => t === TT.STONE || t === TT.WALL || t === TT.PALISADE || t === TT.ROOF || t === TT.TENT;
const SOFT = t => t === TT.GRASS || t === TT.ROAD || t === TT.GATE || t === TT.HILL || t === TT.TENT;

/* ------------------------------------------------------------ state --- */
let S = {map: null, key: '', chunks: null, cols: 0, rows: 0, env: null, tiles: null, scratch: null, shadowCol: '#4a5670'};
const POOL = [];   // chunk canvases kept across builds: a page that makes a canvas per chunk per map soon loses GPU acceleration
function takeCanvas(){ const px = CH * GROUND.RES; let c = POOL.pop(); while (c && c.width !== px) c = POOL.pop(); if (!c){ c = mkCanvas(px, px); } return c; }
function releaseChunks(chunks){ if (chunks) for (const ch of chunks) if (ch && ch.c && POOL.length < 96) POOL.push(ch.c); }
const scratch = () => S.scratch || (S.scratch = mkCanvas(CH * GROUND.RES, CH * GROUND.RES));

function envOf(map, env){
  env = env || {};
  const G_ = W.G, L = W.LOOK;
  let season = env.season;
  if (!season){ try { season = (G_ && G_.season) || (typeof W.currentSeason === 'function' ? W.currentSeason() : null); } catch (e) {} }
  if (!FALLBACK[season]) season = 'summer';
  let host = env.host || (G_ && G_.contract && G_.contract.host) || 'bandits';
  let time = env.time; if (!time){ try { time = L && L.time ? L.time() : 'day'; } catch (e) { time = 'day'; } }
  let brawl = env.brawl; if (brawl === undefined){ try { brawl = !!(typeof W.isBrawl === 'function' && W.isBrawl() && map === W.MAP); } catch (e) { brawl = false; } }
  const sh = (L && L.grade && L.grade[time] && L.grade[time].sh) || '#4a5670';
  return {season, host, time, brawl, shadow: sh};
}


/* ------------------------------------------------------------ roads --- */
/* Ruts follow the road, not the grid. Once per map: a distance-to-edge field over the road cells and a local
   orientation tensor (the covariance of road cells within three cells, centre-weighted), then streamlines are
   integrated through the tensor field from the most central cells outward, pulled toward the centreline, and
   stopped where they leave the road or meet a streamline already running the same way. Each streamline is a
   polyline in world px with a per-vertex strength (anisotropy, so it fades into junctions and blobs); the chunk
   painter strokes the two ruts as offset curves along it and fades the ends. */
function traceRoads(map){
  const w = map.w, h = map.h, g = map.g, C = CELL_, K = GROUND.K;
  const isR = t => t === TT.ROAD || t === TT.GATE;
  const road = new Uint8Array(w * h); let n = 0;
  for (let i = 0; i < w * h; i++) if (isR(g[i])){ road[i] = 1; n++; }
  if (!n) return [];
  // distance to the road's edge (4-neighbour, capped at 4)
  const dist = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const i = y * w + x; if (!road[i]) continue;
    let d = 4; for (let k = 1; k <= 3 && k < d; k++){ if (x - k < 0 || !road[i - k] || x + k >= w || !road[i + k] || y - k < 0 || !road[i - k * w] || y + k >= h || !road[i + k * w]) d = k; }
    dist[i] = d; }
  // orientation tensor per road cell: (Sxx - Syy, 2 Sxy) is the doubled-angle vector, its length over the trace is the anisotropy
  const tx = new Float32Array(w * h), ty = new Float32Array(w * h), an = new Float32Array(w * h), RR = 3;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const i = y * w + x; if (!road[i]) continue;
    let sxx = 0, syy = 0, sxy = 0;
    for (let v = -RR; v <= RR; v++) for (let u = -RR; u <= RR; u++){ const xx = x + u, yy = y + v; if (xx < 0 || yy < 0 || xx >= w || yy >= h || !road[yy * w + xx]) continue;
      const wgt = 1 / (1 + (u * u + v * v) * 0.15); sxx += u * u * wgt; syy += v * v * wgt; sxy += u * v * wgt; }
    const tr = sxx + syy; if (tr < 1e-6) continue;
    tx[i] = (sxx - syy) / tr; ty[i] = 2 * sxy / tr; an[i] = Math.hypot(tx[i], ty[i]); }
  // bilinear samples of the fields at a cell-space point
  const samp = (F, x, y) => { const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5), fx = x - 0.5 - x0, fy = y - 0.5 - y0;
    const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= h) ? 0 : F[yy * w + xx];
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy; };
  const seeds = []; for (let i = 0; i < w * h; i++) if (road[i] && an[i] >= K.rutAni) seeds.push(i);
  seeds.sort((a, b) => (dist[b] - dist[a]) || (an[b] - an[a]) || (a - b));
  const claim = new Map();   // cell index -> list of [doubled-angle vector, road id] of streamlines through it
  const parallelHere = (i, dx, dy, self) => { const L = claim.get(i); if (L) for (const e of L) if (e[2] !== self && e[0] * dx + e[1] * dy > 0.5) return true; return false; };
  const out = [], STEP = 0.4;
  for (const si of seeds){
    const sx = (si % w) + 0.5, sy = (si / w | 0) + 0.5, id = out.length;
    if (parallelHere(si, tx[si], ty[si], id)) continue;
    const halves = [];
    for (const sign of [1, -1]){
      const pts = []; let x = sx, y = sy, px = 0, py = 0, first = true;
      for (let step = 0; step < 400; step++){
        const cx = x | 0, cy = y | 0; if (x < 0 || y < 0 || cx >= w || cy >= h) break; const ci = cy * w + cx; if (!road[ci]) break;
        const dx = samp(tx, x, y), dy = samp(ty, x, y), a = Math.hypot(dx, dy); if (a < 1e-4) break;
        // the tangent from the doubled angle, with the sign that keeps the direction continuous
        const th = Math.atan2(dy, dx) / 2; let vx = Math.cos(th), vy = Math.sin(th);
        if (first){ vx *= sign; vy *= sign; } else if (vx * px + vy * py < 0){ vx = -vx; vy = -vy; }
        if (!first && vx * px + vy * py < 0.3) break;   // a sharp turn: the road's orientation flipped, end here
        if (!first && parallelHere(ci, dx / a, dy / a, id)) break;
        pts.push([x * C, y * C, Math.min(1, a)]);
        { const L = claim.get(ci) || []; if (!L.some(e => e[2] === id)){ L.push([dx / a, dy / a, id]); claim.set(ci, L); } }
        // pull toward the centreline: the gradient of the distance field, its part across the tangent
        const gx = samp(dist, x + 0.5, y) - samp(dist, x - 0.5, y), gy = samp(dist, x, y + 0.5) - samp(dist, x, y - 0.5);
        const across = gx * -vy + gy * vx, k = Math.max(-0.5, Math.min(0.5, across * 0.6));
        px = vx; py = vy; x += (vx - vy * k) * STEP; y += (vy + vx * k) * STEP; first = false;
      }
      halves.push(pts);
    }
    const pts = halves[1].slice(1).reverse().concat(halves[0]);
    if (pts.length * STEP < K.rutMin){ for (const [i, L] of claim) claim.set(i, L.filter(e => e[2] !== id)); continue; }
    out.push(pts);
  }
  return out;
}

/* ------------------------------------------------------------ build --- */
GROUND.build = function(map, env){
  if (!map || !map.g || !map.w || !map.h) return;
  const E = envOf(map, env), ld = GROUND.lightDir;
  const key = [map.w, map.h, map.seed, E.season, E.host, E.time, E.brawl, ld.x.toFixed(2), ld.y.toFixed(2), GROUND.RES].join('|');
  if (S.map === map && S.key === key && S.chunks) return;
  releaseChunks(S.chunks);
  const t0 = performance.now();
  const tiles = matTiles(E.season, E.host);
  if (GROUND.PROF) GROUND.PROF.tiles = (GROUND.PROF.tiles || 0) + performance.now() - t0;
  const cols = Math.ceil(map.w * CELL_ / CH), rows = Math.ceil(map.h * CELL_ / CH), chunks = new Array(cols * rows);
  const roads = (S.map === map && S.roads && S.roadsG === map.g) ? S.roads : traceRoads(map);
  S = {map, key, chunks, cols, rows, env: E, tiles, roads, roadsG: map.g, scratch: S.scratch, pats: S.pats, dirty: S.dirty, shadowCol: E.shadow, ms: 0}; GROUND.ver++;
  if (GROUND.PROF) GROUND.PROF.roads = (GROUND.PROF.roads || 0) + performance.now() - t0;
  if (!GROUND.LAZY) for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) chunks[j * cols + i] = paintChunk(map, i, j, E, tiles);
  S.ms = performance.now() - t0;
};
GROUND.invalidate = function(){ GROUND.ver++; releaseChunks(S.chunks); S.map = null; S.key = ''; S.chunks = null; };
/* warm(): pays the once-per-page cost (JIT, material tiles for the env, texture upload) on a tiny map, so the first real
   build is 3 to 5 times quicker; the composer can call it from the deployment screen. Leaves the live chunks alone. */
GROUND.warm = function(env){
  const saved = S; S = {map: null, key: '', chunks: null, scratch: saved.scratch, pats: saved.pats, dirty: saved.dirty};
  try { GROUND.build(GROUND.sampler(), env); } finally { const d = S.dirty, pp = S.pats; S = saved; S.dirty = d; S.pats = pp; }
};
/* VO2-PERF (Fable, 2026-11-11): paint the chunks in and just around the view ahead of time, at most `ms` of work and never more
   than one chunk past the budget, so a new column of chunks (3 to 4 at 11 to 25 ms each) never lands in one frame. The view's own
   missing chunks come first, then the ring `margin` chunks out. draw() still paints anything in view that is left. */
GROUND.ahead = function(cx, cy, ms, margin){
  if (!S.chunks || !S.map) return 0;
  const vw = (typeof W.VW === 'number' && W.VW > 0) ? W.VW : 1280, vh = (typeof W.VH === 'number' && W.VH > 0) ? W.VH : 800, m = margin == null ? 1 : margin, t0 = performance.now();
  const i0 = Math.max(0, (cx / CH) | 0), i1 = Math.min(S.cols - 1, ((cx + vw) / CH) | 0), j0 = Math.max(0, (cy / CH) | 0), j1 = Math.min(S.rows - 1, ((cy + vh) / CH) | 0);
  let n = 0;
  for (let ring = 0; ring <= m; ring++){
    for (let j = Math.max(0, j0 - ring); j <= Math.min(S.rows - 1, j1 + ring); j++) for (let i = Math.max(0, i0 - ring); i <= Math.min(S.cols - 1, i1 + ring); i++){
      if (ring && i > i0 - ring && i < i1 + ring && j > j0 - ring && j < j1 + ring) continue;   // inside the ring: done on an earlier pass
      const idx = j * S.cols + i; if (S.chunks[idx]) continue;
      if (n && performance.now() - t0 >= (ms || 8)) return n;
      S.chunks[idx] = paintChunk(S.map, i, j, S.env, S.tiles); n++;
    }
  }
  return n;
};
GROUND.stats = () => ({chunks: S.chunks ? S.chunks.length : 0, painted: S.chunks ? S.chunks.filter(Boolean).length : 0, cols: S.cols, rows: S.rows, ms: S.ms, env: S.env});

function cellAt(map, x, y){ return (x < 0 || y < 0 || x >= map.w || y >= map.h) ? -1 : map.g[y * map.w + x]; }

function paintChunk(map, ci, cj, E, tiles){
  const RES = GROUND.RES, c = takeCanvas(), g = c.getContext('2d'), ox = ci * CH, oy = cj * CH;
  const sc = scratch(), sg = sc.getContext('2d'), K = GROUND.K, p = tiles.pal, brawl = E.brawl;
  const x0 = Math.max(0, (ox / CELL_ | 0) - 2), y0 = Math.max(0, (oy / CELL_ | 0) - 2);
  const x1 = Math.min(map.w - 1, ((ox + CH) / CELL_ | 0) + 2), y1 = Math.min(map.h - 1, ((oy + CH) / CELL_ | 0) + 2);
  const at = (x, y) => cellAt(map, x, y);
  const world = ctx => { ctx.setTransform(RES, 0, 0, RES, -ox * RES, -oy * RES); };
  const pats = S.pats && S.pats.tiles === tiles ? S.pats : (S.pats = {tiles});
  const pat = (ctx, name) => ctx === sg ? (pats[name] || (pats[name] = sg.createPattern(tiles[name], 'repeat'))) : ctx.createPattern(tiles[name], 'repeat');
  const PR = GROUND.PROF, tp = PR ? performance.now() : 0, lap = PR ? k => { const t = performance.now(); PR[k] = (PR[k] || 0) + t - PR._t; PR._t = t; } : null; if (PR) PR._t = tp;
  // 1. ink outside, grass body inside
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = INK; g.fillRect(0, 0, CH * RES, CH * RES);
  world(g);
  const mw = map.w * CELL_, mh = map.h * CELL_;
  g.fillStyle = pat(g, 'grass'); g.fillRect(Math.max(ox, 0), Math.max(oy, 0), Math.min(ox + CH, mw) - Math.max(ox, 0), Math.min(oy + CH, mh) - Math.max(oy, 0));
  // large mottle: one soft disc per cell in a lighter or darker grass, alpha by hash, so the body is never flat and the tile repeat hides
  const dry = css(mix(p.grass, p.dirt, 0.3)), dark = css(mul(p.grass, 0.8)), lit = css(mul(p.grass, 1.12));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const h = hf(x, y, 11); if (h > 0.55) continue;
    const R = CELL_ * (1.1 + hf(x, y, 12) * 1.2), col = h < 0.18 ? dry : h < 0.4 ? dark : lit;
    g.globalAlpha = K.mottle * (0.5 + hf(x, y, 13));
    g.drawImage(disc(R, colHex(col)), (x + 0.5 + (hf(x, y, 14) - 0.5)) * CELL_ - R - 1, (y + 0.5 + (hf(x, y, 15) - 0.5)) * CELL_ - R - 1);
  }
  g.globalAlpha = 1;
  if (PR) lap('base');
  // 2. the layers: soft jittered discs per cell as a mask, the material through the mask
  // the scratch is cleared only where the last layer dirtied it, and each layer's mask, fill and copy touch only the box round its cells
  let dirty = S.dirty || null;
  for (const L of LAYERS){
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (L.is(at(x, y), brawl)){ if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (bx1 < 0) continue;
    const pad = L.worn ? 2 : 1;   // the worn path reaches one cell further
    const rx0 = Math.max(0, (bx0 - pad) * CELL_ - ox), ry0 = Math.max(0, (by0 - pad) * CELL_ - oy), rx1 = Math.min(CH, (bx1 + 1 + pad) * CELL_ - ox), ry1 = Math.min(CH, (by1 + 1 + pad) * CELL_ - oy);
    if (rx1 <= rx0 || ry1 <= ry0) continue;
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1;
    if (dirty) sg.clearRect(dirty[0] * RES, dirty[1] * RES, (dirty[2] - dirty[0]) * RES, (dirty[3] - dirty[1]) * RES);
    dirty = [rx0, ry0, rx1, ry1];
    world(sg);
    const D = disc(L.R * CELL_ * (0.6 + K.blend));
    if (L.round && K.smooth){   // Q103: the hill mask cut from the smoothed field
      const F = hillField(at, CELL_), S8 = 8, xa = bx0 - pad, ya = by0 - pad, nw = (bx1 + pad - xa + 1), nh = (by1 + pad - ya + 1), mc = mkCanvas(nw * S8, nh * S8), mg = mc.getContext('2d'), im = mg.createImageData(nw * S8, nh * S8), dd = im.data;
      for (let py = 0; py < nh * S8; py++) for (let px = 0; px < nw * S8; px++){ const v = F((xa + (px + 0.5) / S8) * CELL_, (ya + (py + 0.5) / S8) * CELL_), q = Math.max(0, Math.min(1, (v - 0.35) / 0.30)), a = q * q * (3 - 2 * q); dd[(py * nw * S8 + px) * 4 + 3] = a * 255 | 0; }
      mg.putImageData(im, 0, 0); sg.drawImage(mc, 0, 0, mc.width, mc.height, xa * CELL_, ya * CELL_, nw * CELL_, nh * CELL_);
    } else
    for (let y = Math.max(y0, by0 - pad); y <= Math.min(y1, by1 + pad); y++) for (let x = Math.max(x0, bx0 - pad); x <= Math.min(x1, bx1 + pad); x++){
      const t = at(x, y);
      if (L.is(t, brawl)){
        const j = K.jitter * L.jit * CELL_, R = L.R * CELL_ * (0.6 + K.blend) * (0.92 + hf(x, y, 21) * 0.16);
        const px = (x + 0.5) * CELL_ + (hf(x, y, 22) - 0.5) * 2 * j, py = (y + 0.5) * CELL_ + (hf(x, y, 23) - 0.5) * 2 * j;
        sg.drawImage(D, 0, 0, D.width, D.height, px - R, py - R, R * 2, R * 2);
      } else if (L.worn && t === TT.GRASS){
        // a worn path where the road meets grass: half-alpha discs on the grass side
        let n = 0; if (L.is(at(x - 1, y))) n++; if (L.is(at(x + 1, y))) n++; if (L.is(at(x, y - 1))) n++; if (L.is(at(x, y + 1))) n++;
        if (!n) continue;
        const R = CELL_ * (0.45 + hf(x, y, 24) * 0.25);
        sg.globalAlpha = K.worn * Math.min(1, n * 0.6) * (0.6 + hf(x, y, 25) * 0.4);
        sg.drawImage(D, 0, 0, D.width, D.height, (x + 0.5 + (hf(x, y, 26) - 0.5) * 0.5) * CELL_ - R, (y + 0.5 + (hf(x, y, 27) - 0.5) * 0.5) * CELL_ - R, R * 2, R * 2);
        sg.globalAlpha = 1;
      }
    }
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = pat(sg, L.mat); sg.fillRect(ox + rx0, oy + ry0, rx1 - rx0, ry1 - ry0);
    sg.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sc, rx0 * RES, ry0 * RES, (rx1 - rx0) * RES, (ry1 - ry0) * RES, rx0 * RES, ry0 * RES, (rx1 - rx0) * RES, (ry1 - ry0) * RES); world(g);
  }
  S.dirty = dirty;
  if (PR) lap('layers');
  // 3. details per cell
  details(g, map, x0, y0, x1, y1, E, p, at);
  if (PR) lap('details');
  // 4. decals by hash
  decals(g, map, x0, y0, x1, y1, E, p, at);
  if (PR) lap('decals');
  // 4b. the game's puddles (MAP.puddles, winter): body baked here, the ring animates in draw
  if (map.puddles && map.puddles.length) for (const q of map.puddles) if (q.x > ox - 60 && q.x < ox + CH + 60 && q.y > oy - 40 && q.y < oy + CH + 40) gamePuddle(g, q, p);
  // 5. baked shadow (multiply, coloured)
  const trees = []; if (map.trees && map.trees.length) for (const t of map.trees) if (t.x > ox - 2 * CELL_ && t.x < ox + CH + 2 * CELL_ && t.y > oy - 2 * CELL_ && t.y < oy + CH + 2 * CELL_) trees.push(t);
  shadows(g, map, x0, y0, x1, y1, E, at, trees);
  if (PR) lap('shadows');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // water cells for the shimmer: [x, y, ...] cells inside this chunk
  const wc = [];
  for (let y = Math.max(0, oy / CELL_ | 0); y <= Math.min(map.h - 1, (oy + CH - 1) / CELL_ | 0); y++) for (let x = Math.max(0, ox / CELL_ | 0); x <= Math.min(map.w - 1, (ox + CH - 1) / CELL_ | 0); x++) if (at(x, y) === TT.WATER){ wc.push(x, y); }
  return {x: ox, y: oy, c, water: Int16Array.from(wc)};
}
const COLHEX = {};
function colHex(cssCol){   // 'rgba(r,g,b,a)' -> '#rrggbb' for the disc cache key
  if (COLHEX[cssCol]) return COLHEX[cssCol];
  const m = cssCol.match(/\d+/g); const h = '#' + [0, 1, 2].map(i => ('0' + (+m[i]).toString(16)).slice(-2)).join('');
  return COLHEX[cssCol] = h;
}

/* --------------------------------------------------------- details --- */
function wobble(g, x1, y1, x2, y2, h, amp){   // a slightly bent line between two points
  const mx = (x1 + x2) / 2 + (hf(h, 1, 31) - 0.5) * amp, my = (y1 + y2) / 2 + (hf(h, 2, 32) - 0.5) * amp;
  g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
}
function strokeRuts(g, roads, x0, y0, x1, y1, p){
  // the two ruts of every traced road that touches this chunk: offset curves along the polyline, strength from the
  // road's anisotropy at each vertex, a fade over the last 1.5 cells at either end, drawn in runs of near-equal alpha
  const K = GROUND.K, C = CELL_, wx0 = x0 * C - C, wy0 = y0 * C - C, wx1 = (x1 + 1) * C + C, wy1 = (y1 + 1) * C + C;
  const dark = css(mul(p.mud, 0.7)), pale = css(mul(p.dirt, 1.2)), FADE = 1.5 / 0.4;   // vertices per 1.5 cells at the 0.4-cell step
  g.lineCap = 'butt'; g.lineJoin = 'round';
  for (const pts of roads){
    let inside = false; for (const q of pts) if (q[0] > wx0 && q[0] < wx1 && q[1] > wy0 && q[1] < wy1){ inside = true; break; }
    if (!inside) continue;
    const n = pts.length, L = [];   // per-vertex offset frame and alpha
    for (let i = 0; i < n; i++){
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const end = Math.min(1, Math.min(i, n - 1 - i) / FADE), al = Math.min(1, pts[i][2] * 1.8) * end;
      const wob = Math.sin(i * 0.37) * 1.1 + Math.sin(i * 0.11) * 0.7;
      L.push([pts[i][0], pts[i][1], -dy, dx, al, wob]);
    }
    const run = (off, col, alpha, width) => {
      g.strokeStyle = col; g.lineWidth = width;
      let i = 0;
      while (i < n - 1){
        const q = Math.round(L[i][4] * 6); if (!q){ i++; continue; }
        g.globalAlpha = alpha * q / 6; g.beginPath();
        let j = i; g.moveTo(L[j][0] + L[j][2] * (off + L[j][5]), L[j][1] + L[j][3] * (off + L[j][5]));
        while (j < n - 1 && Math.round(L[j + 1][4] * 6) === q){ j++; g.lineTo(L[j][0] + L[j][2] * (off + L[j][5]), L[j][1] + L[j][3] * (off + L[j][5])); }
        if (j === i){ j++; g.lineTo(L[j][0] + L[j][2] * (off + L[j][5]), L[j][1] + L[j][3] * (off + L[j][5])); }
        g.stroke(); i = j;
      }
    };
    run(-K.rutGap * C, dark, K.rut, 2.6); run(K.rutGap * C, dark, K.rut, 2.6);
    run(-K.rutGap * C - 2.2, pale, 0.12, 1.2);   // the lit lip of one rut
  }
  g.globalAlpha = 1; g.lineCap = 'round';
}

function details(g, map, x0, y0, x1, y1, E, p, at){
  const K = GROUND.K, ld = GROUND.lightDir, C = CELL_, keyCol = css(mix(p.grass, [255, 236, 200], 0.55));
  const shadowRGB = hex(E.shadow), shadowCss = css(shadowRGB);
  if (S.roads && S.roads.length) strokeRuts(g, S.roads, x0, y0, x1, y1, p);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const hx = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
  const browD = disc(C * 0.42, hx(mix(p.hill, hex('#fff1d0'), 0.5))), shadeD = disc(C * 0.42, hx(shadowRGB));
  const HF = GROUND.K.smooth ? hillField(at, C) : null, placed = new Map(), PQ = C * 0.28;   /* spatial hash of placed blobs: buckets PQ wide, so a near check reads 9 buckets, not the whole list */
  const runs = {};   // key -> {style, segs: [[x1, y1, x2, y2, h], ...]}: stroked once each after the cell loop
  const seg = (key, style, x1, y1, x2, y2, h) => { (runs[key] || (runs[key] = {style, segs: []})).segs.push([x1, y1, x2, y2, h]); };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const t = at(x, y), px = x * C, py = y * C, h = hash32(x, y, 41);
    if (t === TT.ROAD || t === TT.GATE){ /* ruts are stroked from the traced roads below */ }
    else if (t === TT.HILL){
      // slope edges: the edge facing the light is lit, the one away from it falls into cool shadow
      const edges = [[0, -1, px, py, px + C, py], [1, 0, px + C, py, px + C, py + C], [0, 1, px + C, py + C, px, py + C], [-1, 0, px, py + C, px, py]];
      for (const [nx0, ny0, ax, ay, bx, by] of edges){
        if (at(x + nx0, y + ny0) === TT.HILL) continue;
        const d0 = nx0 * ld.x + ny0 * ld.y;   // > 0: this edge faces the light
        const hh = h + nx0 * 3 + ny0 * 7;
        // soft discs chained along the edge instead of strokes: no hard rim, no caps, nothing to bead at the corners
        const blob = (D, R, cx, cy, a, mul) => { g.globalAlpha = a; if (mul) g.globalCompositeOperation = 'multiply'; g.drawImage(D, 0, 0, D.width, D.height, cx - R, cy - R, R * 2, R * 2); g.globalCompositeOperation = 'source-over'; };
        for (const f of [0.2, 0.5, 0.8]){
          let ex = ax + (bx - ax) * f + (hf(hh, f * 10 | 0, 33) - 0.5) * 4, ey = ay + (by - ay) * f + (hf(hh, f * 10 | 0, 34) - 0.5) * 4, nx = nx0, ny = ny0, d = d0;
          if (HF){ const c = HF.onContour(ax + (bx - ax) * f, ay + (by - ay) * f); ex += c[0] - (ax + (bx - ax) * f); ey += c[1] - (ay + (by - ay) * f); nx = c[2]; ny = c[3]; d = nx * ld.x + ny * ld.y;
            const bi = Math.floor(c[0] / PQ), bj = Math.floor(c[1] / PQ); let near = false;
              for (let a = bi - 1; a <= bi + 1 && !near; a++) for (let b = bj - 1; b <= bj + 1 && !near; b++){ const L = placed.get(a * 65537 + b); if (L) for (const q of L) if (Math.hypot(q[0] - c[0], q[1] - c[1]) < PQ){ near = true; break; } }
            if (near) continue; const bk = bi * 65537 + bj; (placed.get(bk) || placed.set(bk, []).get(bk)).push([c[0], c[1]]); }   /* the blob sits on the smoothed contour and is lit by its own normal */
          if (HF){   // continuous in d, with a faint rim all round: no dead zone for an edge across the light
            const dp = Math.max(0, d), dm = Math.max(0, -d);
            blob(browD, C * 0.42, ex - nx * C * 0.2, ey - ny * C * 0.2, 0.36 * dp + 0.05, false);
            blob(shadeD, C * 0.36, ex + nx * C * 0.16, ey + ny * C * 0.16, 0.28 * dp + 0.04, true);
            if (dm > 0) blob(shadeD, C * 0.42, ex - nx * C * 0.14, ey - ny * C * 0.14, 0.4 * dm, true); }
          else if (d > 0.2){
            // the lit brow just inside the edge, and the slope's shade cast on the ground beyond it
            blob(browD, C * 0.42, ex - nx * C * 0.2, ey - ny * C * 0.2, 0.36 * d, false);
            blob(shadeD, C * 0.36, ex + nx * C * 0.16, ey + ny * C * 0.16, 0.28 * d, true); }
          else if (d < -0.2){
            blob(shadeD, C * 0.42, ex - nx * C * 0.14, ey - ny * C * 0.14, 0.4 * -d, true); }
        }
        g.globalAlpha = 1;
      }
    }
    else if (t === TT.STONE || t === TT.WALL){
      // the footing: a dark seam where the block meets soft ground
      const st = {col: css(mul(p.stone, 0.45)), a: 0.5, w: 2};
      if (SOFT(at(x, y + 1)) || at(x, y + 1) === TT.FOREST){ seg('seam', st, px - 1, py + C - 1, px + C + 1, py + C - 1, h); }
      if (SOFT(at(x, y - 1)) || at(x, y - 1) === TT.FOREST){ seg('seam', st, px - 1, py + 1, px + C + 1, py + 1, h + 1); }
      if (SOFT(at(x - 1, y))){ seg('seam', st, px + 1, py - 1, px + 1, py + C + 1, h + 2); }
      if (SOFT(at(x + 1, y))){ seg('seam', st, px + C - 1, py - 1, px + C - 1, py + C + 1, h + 3); }
    }
    else if (t === TT.RUBBLE){
      // broken pieces: a few convex shards lit from the key side, spilling a little into the next cell
      const n = 3 + (h % 4);
      for (let i = 0; i < n; i++){
        const r = rngOf(h + i * 977), sx = px + r() * C, sy = py + r() * C, sr = 3 + r() * 6, k = 4 + (r() * 2 | 0);
        g.beginPath();
        for (let v = 0; v < k; v++){ const a = v / k * Math.PI * 2 + r() * 0.6, rr = sr * (0.7 + r() * 0.5); const vx = sx + Math.cos(a) * rr * 1.3, vy = sy + Math.sin(a) * rr; if (v) g.lineTo(vx, vy); else g.moveTo(vx, vy); }
        g.closePath();
        g.fillStyle = css(mul(p.stone, 0.72 + r() * 0.3)); g.fill();
        g.fillStyle = css(mul(p.stone, 1.3), 0.45); g.beginPath(); g.ellipse(sx + ld.x * sr * 0.35, sy + ld.y * sr * 0.3, sr * 0.6, sr * 0.3, 0.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = css(shadowRGB, 0.35); g.beginPath(); g.ellipse(sx - ld.x * sr * 0.6, sy - ld.y * sr * 0.5, sr * 1.3, sr * 0.6, 0, 0, Math.PI * 2); g.globalCompositeOperation = 'multiply'; g.fill(); g.globalCompositeOperation = 'source-over';
      }
    }
    else if (t === TT.FOREST){
      // twigs and a root or two
      if (hf(x, y, 42) < 0.5){ const r = rngOf(h); g.strokeStyle = css(mul(p.forest, 0.45), 0.6); g.lineWidth = 1.5;
        for (let i = 0; i < 2; i++){ const ax = px + r() * C, ay = py + r() * C, a = r() * Math.PI, l = 6 + r() * 10; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + Math.cos(a) * l, ay + Math.sin(a) * l); g.stroke(); } }
    }
    else if (t === TT.PALISADE){
      // the post line: a dark seam along the palisade's run
      const isP = v => v === TT.PALISADE, horiz = isP(at(x - 1, y)) || isP(at(x + 1, y));
      g.strokeStyle = css(mul(p.mud, 0.5), 0.5); g.lineWidth = 4;
      if (horiz) wobble(g, px - 2, py + C * 0.5, px + C + 2, py + C * 0.5, h, 3); else wobble(g, px + C * 0.5, py - 2, px + C * 0.5, py + C + 2, h, 3);
    }
  }
  // the gathered edge runs, one stroke each (brows and lips under the shade so the shade still multiplies over them)
  const order = Object.keys(runs).sort((a, b) => (runs[a].style.mul ? 1 : 0) - (runs[b].style.mul ? 1 : 0));
  for (const k of order){
    const R = runs[k], st = R.style;
    g.strokeStyle = st.col; g.lineWidth = st.w; g.globalAlpha = st.a; g.globalCompositeOperation = st.mul ? 'multiply' : 'source-over';
    g.beginPath();
    for (const [x1, y1, x2, y2, hh] of R.segs){ const mx = (x1 + x2) / 2 + (hf(hh, 1, 31) - 0.5) * (st.w > 2 ? 5 : 2), my = (y1 + y2) / 2 + (hf(hh, 2, 32) - 0.5) * (st.w > 2 ? 5 : 2); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); }
    g.stroke();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ---------------------------------------------------------- decals --- */
function decals(g, map, x0, y0, x1, y1, E, p, at){
  const K = GROUND.K.decal, C = CELL_, se = E.season, hollow = E.host === 'hollow';
  const wet = se === 'winter' ? 2.4 : se === 'spring' ? 1.8 : se === 'autumn' ? 1.2 : 0.5;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const t = at(x, y), px = x * C, py = y * C, h = hash32(x, y, 51), r = rngOf(h), u = hf(x, y, 52);
    const nearForest = at(x - 1, y) === TT.FOREST || at(x + 1, y) === TT.FOREST || at(x, y - 1) === TT.FOREST || at(x, y + 1) === TT.FOREST;
    if ((t === TT.GRASS || t === TT.ROAD || t === TT.TENT || t === TT.GATE) && u < K.puddle * wet * (t === TT.GRASS ? 0.3 : 1)) puddle(g, px + 8 + r() * (C - 16), py + 8 + r() * (C - 16), 9 + r() * 9, 5 + r() * 5, r, p);
    else if ((t === TT.FLOOR || t === TT.STONE || t === TT.WALL) && u < K.crack) crack(g, px + r() * C, py + r() * C, r, p);
    else if ((t === TT.GRASS || t === TT.RUBBLE || t === TT.HILL) && u < K.bones * (hollow ? 4 : 1)) bones(g, px + 6 + r() * (C - 12), py + 6 + r() * (C - 12), r, p);
    else if ((t === TT.RUBBLE || t === TT.ROAD) && u < K.scorch * (hollow ? 2 : 1)) scorch(g, px + C / 2, py + C / 2, 12 + r() * 10, r);
    if (se === 'autumn' && (t === TT.FOREST || (nearForest && t !== TT.WATER)) && hf(x, y, 53) < (t === TT.FOREST ? K.leaves : K.leaves * 0.35)) leaves(g, px, py, r, p, t === TT.FOREST ? 7 : 4);
    if (se === 'winter' && t === TT.FOREST && hf(x, y, 54) < 0.3) leaves(g, px, py, r, {leaves: [p.snow]}, 3);
  }
}
function puddle(g, x, y, rx, ry, r, p){
  const a = (r() - 0.5) * 0.8;
  g.save(); g.translate(x, y); g.rotate(a);
  const wet = mix(mul(p.mud, 0.7), [40, 48, 60], 0.25), sky = mix(mix(p.water || [120, 150, 175], [168, 182, 192], 0.5), p.dirt, 0.2);
  g.fillStyle = css(wet, 0.3); g.beginPath(); g.ellipse(0.5, 1, rx + 3, ry + 2, 0, 0, Math.PI * 2); g.ellipse(rx * 0.5, -ry * 0.3, rx * 0.6, ry * 0.8, 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = css(sky, 0.34); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.ellipse(rx * 0.5, -ry * 0.3, rx * 0.5, ry * 0.65, 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = css(mix(sky, [225, 235, 240], 0.5), 0.2); g.beginPath(); g.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.5, ry * 0.3, 0.2, 0, Math.PI * 2); g.fill();
  g.restore();
}
function gamePuddle(g, q, p){   // the same shape drawPuddleList draws, baked: body, lighter heart, rim
  g.save(); g.translate(q.x, q.y); g.rotate(q.ang || 0);
  g.fillStyle = 'rgba(28,48,68,0.52)'; g.beginPath(); g.ellipse(0, 0, q.rx, q.ry, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(110,155,190,0.28)'; g.beginPath(); g.ellipse(-q.rx * 0.15, -q.ry * 0.18, q.rx * 0.72, q.ry * 0.62, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(70,100,125,0.45)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, q.rx, q.ry, 0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
function crack(g, x, y, r, p){
  g.strokeStyle = css(mul(p.stone, 0.35), 0.75); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y);
  let a = r() * Math.PI * 2;
  for (let i = 0; i < 4 + (r() * 3 | 0); i++){ a += (r() - 0.5) * 1.4; const l = 4 + r() * 8; x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x, y); }
  g.stroke();
}
function bones(g, x, y, r, p){
  g.save(); g.translate(x, y); g.rotate(r() * Math.PI * 2);
  g.strokeStyle = css(p.bone, 0.85); g.lineWidth = 1.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-9, 0); g.lineTo(7, 0); g.stroke();
  for (let i = -6; i <= 4; i += 3){ g.beginPath(); g.moveTo(i, 0); g.quadraticCurveTo(i + 1, -5 - r() * 2, i + 3, -6); g.stroke(); }
  g.fillStyle = css(p.bone, 0.9); g.beginPath(); g.ellipse(11, 1, 3.5, 2.8, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(20,12,6,0.8)'; g.fillRect(10, 0, 1.2, 1.2); g.fillRect(12, 0, 1.2, 1.2);
  g.restore();
}
function scorch(g, x, y, R, r){
  g.globalCompositeOperation = 'multiply';
  g.drawImage(disc(R, '#2a2018'), x - R - 1 + (r() - 0.5) * 6, y - R - 1 + (r() - 0.5) * 6);
  g.globalAlpha = 0.6; g.drawImage(disc(R * 0.55, '#1a1410'), x - R * 0.55 - 1, y - R * 0.55 - 1); g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(138,132,120,0.35)'; g.beginPath(); g.ellipse(x + 2, y + 1, R * 0.3, R * 0.18, 0.4, 0, Math.PI * 2); g.fill();
}
function leaves(g, px, py, r, p, n){
  for (let i = 0; i < n; i++){
    const c = p.leaves[(r() * p.leaves.length) | 0], x = px + r() * CELL_, y = py + r() * CELL_, a = r() * Math.PI;
    g.fillStyle = css(c, 0.7 + r() * 0.3); g.beginPath(); g.ellipse(x, y, 2.6 + r() * 1.6, 1.3 + r() * 0.8, a, 0, Math.PI * 2); g.fill();
  }
}

/* --------------------------------------------------------- shadows --- */
function shadows(g, map, x0, y0, x1, y1, E, at, trees){
  const K = GROUND.K, ld = GROUND.lightDir, C = CELL_, col = E.shadow;
  g.globalCompositeOperation = 'multiply';
  const Dt = disc(C * 1.0, col), Dc = disc(C * 1.2, col), Dr = disc(C * K.treeR, col);
  // canopy under each tree, offset against the light
  for (const t of trees){ const R = C * K.treeR * (0.9 + hf(t.x | 0, t.y | 0, 63) * 0.2); g.globalAlpha = K.treeA; g.drawImage(Dr, 0, 0, Dr.width, Dr.height, t.x - ld.x * K.treeOff * C - R, t.y - ld.y * K.treeOff * C - R, R * 2, R * 2); }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const t = at(x, y);
    if (TALL(t)){
      const ox = -ld.x * K.shadowOff * C, oy = -ld.y * K.shadowOff * C, R = C * (t === TT.TENT ? 0.8 : 1.0);
      g.globalAlpha = K.shadowA * (t === TT.TENT ? 0.6 : 1);
      g.drawImage(Dt, 0, 0, Dt.width, Dt.height, (x + 0.5) * C + ox - R, (y + 0.5) * C + oy - R, R * 2, R * 2);
    } else if (t === TT.FOREST){
      const ox = -ld.x * K.canopyOff * C, oy = -ld.y * K.canopyOff * C, R = C * 1.2;
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy) === TT.FOREST) n++;
      g.globalAlpha = K.canopyA + (n >= 6 ? K.denseA : n >= 3 ? K.denseA * 0.4 : 0);
      g.drawImage(Dc, 0, 0, Dc.width, Dc.height, (x + 0.5 + (hf(x, y, 61) - 0.5) * 0.4) * C + ox - R, (y + 0.5 + (hf(x, y, 62) - 0.5) * 0.4) * C + oy - R, R * 2, R * 2);
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ------------------------------------------------------------- draw --- */
/* F-43: draw() is base() (the painted chunks; static until a decal, a rebuild or an invalidate, each of which bumps GROUND.ver) and
   anim() (the water shimmer and the puddle rings, per frame). VO2's terrain cache (js/3d/vo2.js) keeps base() in a padded layer and
   repaints the boxes a decal lists in GROUND.dirty. */
GROUND.ver = 0; GROUND.dirty = [];   // dirty: world boxes [x0, y0, x1, y1, ...] a decal painted since the cache last looked
GROUND.base = function(ctx, cx, cy, vw, vh){
  ctx.fillStyle = INK; ctx.fillRect(cx - 40, cy - 40, vw + 80, vh + 80);
  if (!S.chunks) return;
  const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
  const i0 = Math.max(0, (cx / CH) | 0), i1 = Math.min(S.cols - 1, ((cx + vw) / CH) | 0), j0 = Math.max(0, (cy / CH) | 0), j1 = Math.min(S.rows - 1, ((cy + vh) / CH) | 0);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ let ch = S.chunks[j * S.cols + i]; if (!ch) ch = S.chunks[j * S.cols + i] = paintChunk(S.map, i, j, S.env, S.tiles); ctx.drawImage(ch.c, ch.x, ch.y, CH, CH); }
  ctx.imageSmoothingEnabled = was;
};
GROUND.draw = function(ctx, cx, cy){
  const vw = (typeof W.VW === 'number' && W.VW > 0) ? W.VW : ctx.canvas.width, vh = (typeof W.VH === 'number' && W.VH > 0) ? W.VH : ctx.canvas.height;
  GROUND.base(ctx, cx, cy, vw, vh); GROUND.anim(ctx, cx, cy, vw, vh);
};
GROUND.anim = function(ctx, cx, cy, vw, vh){
  if (!S.chunks) return;
  const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
  const i0 = Math.max(0, (cx / CH) | 0), i1 = Math.min(S.cols - 1, ((cx + vw) / CH) | 0), j0 = Math.max(0, (cy / CH) | 0), j1 = Math.min(S.rows - 1, ((cy + vh) / CH) | 0);
  const f = (W.G && W.G.frame) || 0, K = GROUND.K, C = CELL_;
  // a slow shimmer on the water: two short lights per cell drifting with the frame
  if (K.shimmer > 0){
    ctx.fillStyle = 'rgba(214,228,240,' + K.shimmer + ')';
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
      const ch = S.chunks[j * S.cols + i]; if (!ch || !ch.water.length) continue;
      const wl = ch.water;
      for (let k = 0; k < wl.length; k += 2){
        const x = wl[k], y = wl[k + 1], px = x * C, py = y * C;
        if (px + C < cx || px > cx + vw || py + C < cy || py > cy + vh) continue;
        const h = hash32(x, y, 71) % 1000;
        for (let q = 0; q < 2; q++){
          const ox = ((h * 7 + q * 19 + f * K.shimmerSpeed * (0.8 + q * 0.5)) % (C + 10)) - 5, oy = 6 + ((h + q * 13) % 3) * 11 + Math.sin((f + h * 3) / 45 + q) * 2.5;
          ctx.fillRect(px + ox, py + oy, 8, 1.4);
        }
      }
    }
  }
  // the puddles' spreading ring, as drawPuddleList animates it
  const pl = S.map && S.map.puddles;
  if (pl && pl.length){
    ctx.lineWidth = 1;
    for (const q of pl){
      if (q.x < cx - 60 || q.x > cx + vw + 60 || q.y < cy - 40 || q.y > cy + vh + 40) continue;
      const rt = ((f + q.seed * 7) % 50) / 50;
      ctx.strokeStyle = 'rgba(190,220,245,' + ((1 - rt) * 0.55).toFixed(3) + ')';
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.ang || 0);
      ctx.beginPath(); ctx.ellipse((q.seed % 7 - 3) * 2, (q.seed % 5 - 2) * 1.2, q.rx * 0.45 * rt, q.ry * 0.45 * rt, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.imageSmoothingEnabled = was;
};

/* ------------------------------------------------------------ decal --- */
GROUND.decal = function(kind, x, y, r){
  if (!S.chunks) return;
  r = r || 10; if (GROUND.dirty.length < 64) GROUND.dirty.push(x - r - 24, y - r - 24, x + r + 24, y + r + 24); else GROUND.ver++;   // F-43: a cache repaints the patch (a flood of decals: the lot)
  const i0 = Math.max(0, ((x - r) / CH) | 0), i1 = Math.min(S.cols - 1, ((x + r) / CH) | 0), j0 = Math.max(0, ((y - r) / CH) | 0), j1 = Math.min(S.rows - 1, ((y + r) / CH) | 0);
  const h = hash32(x | 0, y | 0, 81), rr = rngOf(h);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const ch = S.chunks[j * S.cols + i]; if (!ch) continue;   // a lazy chunk not yet painted takes no decal (it is painted from the map when first seen)
    const g = ch.c.getContext('2d'); g.save(); g.setTransform(GROUND.RES, 0, 0, GROUND.RES, -ch.x * GROUND.RES, -ch.y * GROUND.RES);
    if (kind === 'blood'){
      g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.75; g.drawImage(disc(r, '#6a1418'), x - r - 1, y - r - 1);
      g.fillStyle = 'rgba(90,16,20,0.8)'; for (let k = 0; k < 5; k++){ const a = rr() * Math.PI * 2, d = r * (0.6 + rr() * 0.9); g.beginPath(); g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.5 + rr() * 2, 1 + rr() * 1.5, a, 0, Math.PI * 2); g.fill(); }
    } else if (kind === 'scorch'){
      scorch(g, x, y, r, rr);
    } else if (kind === 'rut'){
      g.strokeStyle = 'rgba(30,22,14,0.35)'; g.lineWidth = 3; g.lineCap = 'round'; wobble(g, x - r, y + 2, x + r, y - 2, h, 4);
    } else if (kind === 'ash'){
      g.globalAlpha = 0.55; g.drawImage(disc(r, '#8a8478'), x - r - 1, y - r - 1);
      g.globalAlpha = 0.5; g.drawImage(disc(r * 0.5, '#b8b2a4'), x - r * 0.5 - 1, y - r * 0.5 - 1);
    }
    g.restore();
  }
};

/* ---------------------------------------------------------- sampler --- */
/* a 13 x 13 sampler map with every terrain id, for the sheet and the self-test */
const SAMPLER = [
  'GGGGGGGFFFFFF',
  'GGGGGGGFFFFFF',
  'GGHHHGGGFFFFF',
  'GHHHHGGGGFFFG',
  'GHHHGRRRGGGGG',
  'GGGGGRRRGGWWG',
  'RRRRRRRRGWWWW',
  'GGGGGRRRGGWWG',
  'GSSSSGRRGGGGG',
  'GSLLSGGGGBBBG',
  'GSLLSGGGGBBBG',
  'GSSSSGPPPGGAA',
  'GGGGGGPPMOOTT'
];
const SAMP_T = {G: TT.GRASS, F: TT.FOREST, H: TT.HILL, R: TT.ROAD, W: TT.WATER, S: TT.STONE, L: TT.FLOOR, B: TT.RUBBLE, P: TT.PALISADE, A: TT.WALL, M: TT.GATE, O: TT.ROOF, T: TT.TENT, D: TT.WAGON};
GROUND.sampler = function(rows){
  rows = rows || SAMPLER;
  const w = rows[0].length, h = rows.length, g = new Uint8Array(w * h);
  const trees = [], puddles = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ g[y * w + x] = SAMP_T[rows[y][x]] || 0;
    if (g[y * w + x] === TT.FOREST && hf(x, y, 91) < 0.55) trees.push({x: (x + 0.2 + hf(x, y, 92) * 0.6) * CELL_, y: (y + 0.3 + hf(x, y, 93) * 0.6) * CELL_, v: hash32(x, y, 94) % 3}); }
  puddles.push({x: 4.5 * CELL_, y: 1.5 * CELL_, rx: 24, ry: 13, ang: 0.2, seed: 17}, {x: 1.5 * CELL_, y: 6.5 * CELL_, rx: 18, ry: 10, ang: -0.3, seed: 41});
  return {w, h, g, seed: 1, structures: [], trees, puddles};
};

/* ------------------------------------------------------------ sheet --- */
/* one 512 px chunk of the sampler per setting x season; returns {keys, canvases} and leaves the live map's chunks alone */
GROUND.sheet = function(settings, seasons){
  const saved = S; S = {map: null, key: '', chunks: null, scratch: saved.scratch, pats: saved.pats, dirty: saved.dirty};
  const out = {keys: [], canvases: {}}, map = GROUND.sampler(), lazy0 = GROUND.LAZY; GROUND.LAZY = false;   /* the swatch reads chunk 0 straight away */
  try {
    for (const host of (settings || GROUND.SETTINGS)) for (const season of (seasons || GROUND.SEASONS)){
      GROUND.build(map, {season, host, time: 'day', brawl: false});
      const key = host + '-' + season; out.keys.push(key); const cp = mkCanvas(CH * GROUND.RES, CH * GROUND.RES); cp.getContext('2d').drawImage(S.chunks[0].c, 0, 0); out.canvases[key] = cp; GROUND.invalidate();
    }
  } finally { GROUND.LAZY = lazy0; const d = S.dirty, pp = S.pats; S = saved; S.dirty = d; S.pats = pp; }
  return out;
};

/* --------------------------------------------------------- self-test --- */
GROUND.selfTest = function(){
  const pass = [], fail = [], d = (ok, msg) => (ok ? pass : fail).push(msg);
  const snap = () => {
    let st = '';
    try { st = typeof W.settings === 'function' ? JSON.stringify(W.settings()) : ''; } catch (e) {}
    return {map: W.MAP, g: W.G, dt: W.drawTerrain, spr: W.SPR ? Object.keys(W.SPR).length : -1, st, ls: (() => { try { return localStorage.length; } catch (e) { return -1; } })(), canv: document.querySelectorAll('canvas').length, ld: GROUND.lightDir.x + ',' + GROUND.lightDir.y};
  };
  const before = snap(), saved = S; S = {map: null, key: '', chunks: null, scratch: saved.scratch, pats: saved.pats, dirty: saved.dirty};
  const lazy0 = GROUND.LAZY; GROUND.LAZY = false;   /* the test samples chunk pixels, so every chunk must be painted at build time (chunks are lazy by default) */
  try {
    const map = GROUND.sampler(), ids = new Set(map.g);
    d(ids.size >= 13, 'sampler map has ' + ids.size + ' terrain ids');
    const t0 = performance.now(); GROUND.build(map, {season: 'autumn', host: 'bandits', time: 'day', brawl: false}); const ms = performance.now() - t0;
    d(S.chunks && S.chunks.length === 4, 'chunk count 4 for 13x13 (' + (S.chunks ? S.chunks.length : 0) + ')');
    d(ms < 400, 'sampler built in ' + ms.toFixed(0) + ' ms (' + (4 * 262144 / 1e6).toFixed(1) + ' Mpx)');
    GROUND.build(map, {season: 'autumn', host: 'bandits', time: 'day', brawl: false}); d(S.chunks.length === 4, 'rebuild is idempotent');
    // pixel samples: material centres
    const px = (x, y) => { const q = S.chunks[0].c.getContext('2d').getImageData(((x + 0.5) * CELL_) | 0, ((y + 0.5) * CELL_) | 0, 1, 1).data; return [q[0], q[1], q[2]]; };
    const grass = px(2, 0), water = px(11, 6), forest = px(10, 1), stone = px(2, 8), road = px(3, 6), hill = px(2, 3), rubble = px(10, 9), floor = px(2, 9);
    d(water[2] > water[0] + 10, 'water is blue ' + water);
    d(lum(forest) < lum(grass) - 15, 'forest floor darker than grass ' + lum(forest).toFixed(0) + ' < ' + lum(grass).toFixed(0));
    d(Math.abs(stone[0] - stone[2]) < 40, 'stone footing is near grey ' + stone);
    d(lum(road) > lum(forest), 'road lighter than forest floor ' + road);
    d(lum(hill) > lum(forest), 'hill lighter than forest ' + hill);
    d(rubble.join() !== grass.join() && floor.join() !== grass.join(), 'rubble and flags painted');
    const sat = c => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
    d(sat(grass) < 110 && lum(grass) < 150, 'grass is desaturated and dim (chroma ' + sat(grass) + ', lum ' + lum(grass).toFixed(0) + ')');
    // north of a stone cell is darker than open grass (baked shadow): stone at (2,8), cell above (2,7) is grass
    const above = px(2, 7), open = px(4, 2);
    d(lum(above) < lum(open), 'baked shadow north of stone ' + lum(above).toFixed(0) + ' < ' + lum(open).toFixed(0));
    const tr = map.trees[0], ld = GROUND.lightDir, c2 = S.chunks[0].c.getContext('2d');
    const under = c2.getImageData((tr.x - ld.x * CELL_ * 0.45) | 0, (tr.y - ld.y * CELL_ * 0.45) | 0, 1, 1).data;
    d(map.trees.length > 10 && lum([under[0], under[1], under[2]]) < lum(open) * 0.5, 'canopy under ' + map.trees.length + ' trees: ' + lum([under[0], under[1], under[2]]).toFixed(0) + ' under half of open grass ' + lum(open).toFixed(0));
    const pu = px(4, 1); d(pu[2] > pu[0] + 8 && lum(pu) < lum(open), 'game puddle baked at (4,1) ' + pu);
    // draw to a scratch view
    const view = mkCanvas(640, 480), vc = view.getContext('2d'); vc.translate(-20, -30);
    const savedVW = W.VW, savedVH = W.VH;
    let threw = null; try { GROUND.draw(vc, 20, 30); } catch (e) { threw = e; }
    d(!threw, 'draw ran' + (threw ? ': ' + threw.message : ''));
    d(W.VW === savedVW && W.VH === savedVH, 'view size untouched');
    threw = null; try { GROUND.decal('blood', 100, 100, 12); GROUND.decal('scorch', 200, 100, 14); GROUND.decal('rut', 150, 150, 10); GROUND.decal('ash', 250, 150, 10); } catch (e) { threw = e; }
    d(!threw, 'decals ran' + (threw ? ': ' + threw.message : ''));
    // seasons and settings change colours, not shapes: the same cell is water in every season
    for (const se of GROUND.SEASONS){ S.key = ''; GROUND.build(map, {season: se, host: 'hollow', time: 'night', brawl: false}); const w2 = px(11, 6), g2 = px(2, 0); d(w2[2] > w2[0] && lum(g2) < 150 && g2.join() !== grass.join(), se + '/hollow paints (grass ' + g2 + ')'); }
    // a sheet
    threw = null; let sh = null; try { sh = GROUND.sheet(['bandits'], ['summer']); } catch (e) { threw = e; }
    d(!threw && sh && sh.keys.length === 1 && sh.canvases['bandits-summer'].width === 512, 'sheet renders a 512 swatch');
    GROUND.invalidate(); d(!S.chunks, 'invalidate clears the chunks');
  } catch (e) { fail.push('threw: ' + (e && e.message)); }
  finally { GROUND.LAZY = lazy0; const d = S.dirty, pp = S.pats; S = saved; S.dirty = d; S.pats = pp; }
  const after = snap();
  d(after.map === before.map && after.g === before.g && after.dt === before.dt, 'MAP, G and drawTerrain untouched');
  d(after.spr === before.spr && after.st === before.st && after.ls === before.ls, 'SPR, settings and localStorage untouched');
  d(after.canv === before.canv, 'no canvas added to the page');
  d(after.ld === before.ld, 'lightDir untouched');
  return {pass: pass.length, fail: fail.length, details: pass.map(m => 'ok ' + m).concat(fail.map(m => 'FAIL ' + m))};
};
})();
