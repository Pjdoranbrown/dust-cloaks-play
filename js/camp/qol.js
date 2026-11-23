/* js/camp/qol.js (INT-1 step 2, 2026-11-16): INDEX 77 (quality of life, tavern), 78 (the Scribe's ledger).
   Cut unchanged from the inline script in index.html (old lines 24313 to 25118). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 77 - QUALITY OF LIFE: GROUND, THE TAVERN, AND BUILDING ANYWHERE
   THE GROUND (3D world on)
     - Terrain edges are soft and rounded, not cell squares: roads and paths
       curve round corners and cut diagonals, forest and rubble have ragged,
       bumpy edges (rubble still reads as a rough patch), water and cliffs
       round off. The ground of each map is baked once into one picture and
       re-baked when the season or the look changes.
     - Roads no longer carry two horizontal ruts in every tile; wheel ruts are
       drawn along the road's own direction on narrow paths. Water no longer
       has a dark line at the top of every tile.
     - Walls and stone blocks read as raised: a capstone top with a lit rim
       and moss, a dark face, and a shadow cast on the ground. Paving (the
       walkable stone floor) is flat, warm, irregular flagstones with grass in
       the joints, so you can tell at a glance what you can walk on.
   THE TAVERN (the bar fight)
     A plank floor, timber-and-plaster walls, a stone hearth with a fire and
     antlers over the mantel, kegs on a rack, barrels in the corners, candles
     on the tables, rugs, and warm firelight pools in a dim room. The hearth,
     kegs and barrels stand on cells that now block movement, like furniture.
   THE CAMP
     - The bard sits on his log, not behind it: each bench log is its own
       body in the draw order, and the bard's log is always drawn before him.
     - BUILD ANYWHERE: every empty plot is a building site. Click any plot
       sign to choose from every building you can build (cost, build time,
       what it needs). The palisade keeps its gate plot.
     - BUILD TIMES: a building takes seasons to raise, by its tech level
       (cost up to 150gp: 1 season; up to 250gp: 2; above: 3). A season passes
       with every contract. Until it is finished it gives no benefit.
     - BUILDERS: three unarmoured townsfolk walk in from the edge of the camp
       and hammer at the site; the building rises out of its footings inside
       scaffolding, with timber and stone stacked beside it. Click the site
       or a builder to see how long is left, or to stop work (half refunded).
   SAVED   META.sites {facility: plot} and META.build {facility: {start, need}}.
           Old saves keep every building where it was.
   ROLLBACK   Delete from this comment to END INDEX 77, and undo the patches
              marked "Index 77" (camp draw list, bench logs, plot label, site
              draw, builder sprite and frame, two driveway lines).
============================================================================ */

/* ------------------------------------------------------------- tiles --- */
W3T.road = v => wTile('road3' + v, (P, D, r, x) => {
  const Dt = x.Z('dirt'), S = x.Z('stone'); P(0, 0, 20, 20, Dt[2]);
  for (let i = 0; i < 46 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.5 ? wMix(Dt[2], Dt[1], 0.45) : wMix(Dt[2], Dt[3], 0.55)); }
  for (let k = 0; k < 3; k++){ const px = r() * 16, py = r() * 16, w = 2 + r() * 3; P(px, py, w, w * 0.6, wMix(Dt[2], Dt[1], 0.25)); }   // soft worn patches, no direction
  for (let i = 0; i < 5; i++){ const px = r() * 18, py = r() * 18; P(px, py, 0.9, 0.9, S[3]); P(px, py + 0.9, 0.9, 0.4, wMix(S[1], Dt[2], 0.5)); }
  if (x.se === 'winter') for (let i = 0; i < 6; i++) P(r() * 16, r() * 18, 2 + r() * 3, 0.7, x.Z('snow')[2]);
  wSeasonSpeckle(P, D, r, x, x.se === 'autumn' ? 10 : 3);
});
W3T.water = f => wTile('water3' + f, (P, D, r, x) => {
  const W = x.Z('water'); P(0, 0, 20, 20, W[2]);
  for (let i = 0; i < 30 * x.U * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, W[1]);
  for (let i = 0; i < 5; i++){ const px = r() * 16, py = (i * 4 + f * 2 + r() * 2) % 20; P(px, py, 3 + r() * 2, 0.5, W[4]); P(px + 1, py + 0.5, 2, 0.4, W[3]); }
  if (x.se === 'winter'){ const I = w3dBands('#cfe0ea'); for (let i = 0; i < 4; i++) P(r() * 16, r() * 18, 3, 0.8, I[3]); }
});
// Paving: flat, warm, irregular flagstones with grass and dirt in the joints.
W3T.floor = () => wTile('floor4', (P, D, r, x) => {
  const S = w3dBands(wMix(w3dZ('stone', x.se), '#c8b088', 0.6)), G = x.Z('grass'), J = wMix(S[2], S[1], 0.7); P(0, 0, 20, 20, J);
  [[0, 10], [10, 10]].forEach(([y0, h], j) => { let xx = -((j * 5) % 9); while (xx < 20){ const w = 8 + r() * 5, c = [S[2], wMix(S[2], S[3], 0.35), wMix(S[2], S[1], 0.2)][r() * 3 | 0];
    P(xx + 0.4, y0 + 0.4, w - 0.8, h - 0.8, c); P(xx + 0.4, y0 + 0.4, w - 0.8, 0.4, wMix(c, S[3], 0.5));
    for (let k = 0; k < 3; k++) P(xx + 1 + r() * (w - 3), y0 + 1 + r() * (h - 3), 1 + r(), 0.4, wMix(c, S[1], 0.35));
    xx += w; } });
  for (let i = 0; i < 5; i++){ const px = r() * 19, py = r() < 0.5 ? 9.6 : 19.6; P(px, py, 1, 0.6, G[2]); }   // a little grass in the joints
  if (x.se === 'winter'){ const W = x.Z('snow'); for (let i = 0; i < 6; i++) P(r() * 16, r() * 18, 2 + r() * 3, 0.8, W[2]); }
  else if (x.se === 'autumn') wSeasonSpeckle(P, D, r, x, 4);
});
// A wall's face: dark, tall courses, a deep shadow line where it meets the ground.
W3T.stone = () => wTile('stone3', (P, D, r, x) => {
  const S = w3dBands(wMix(w3dZ('wall', x.se), '#4a4640', 0.35)); P(0, 0, 20, 20, S[1]);
  for (let y = 0; y < 17; y += 4.25) for (let xx = (Math.round(y / 4.25) % 2) * 5 - 5; xx < 20; xx += 10){ P(xx + 0.5, y + 0.5, 9, 3.4, wMix(S[1], S[2], 0.55)); P(xx + 0.5, y + 0.5, 9, 0.5, S[2]); }
  P(0, 0, 20, 1.2, S[3]);                         // the capstone lip
  P(0, 17.6, 20, 2.4, S[0]);                      // the shadow at the foot
});
// A wall's top: big capstones with a lit rim, a dark edge, and moss.
W3T.stoneTop = () => wTile('stonetop3', (P, D, r, x) => {
  const S = w3dBands(w3dZ('wall', x.se)); P(0, 0, 20, 20, S[0]);
  for (const [y0, h] of [[0.6, 9], [10.4, 9]]) { let xx = (y0 > 5 ? -4 : 0); while (xx < 20){ const w = 7 + r() * 4;
    P(xx + 0.6, y0, w - 1.2, h - 0.6, S[2]); P(xx + 0.6, y0, w - 1.2, 0.7, S[4]); P(xx + 0.6, y0, 0.6, h - 0.6, S[3]); P(xx + w - 1.2, y0 + 0.6, 0.6, h - 1.2, S[1]);
    xx += w; } }
  if (x.se !== 'winter') for (let i = 0; i < 3; i++) P(r() * 16, r() * 18, 2 + r() * 2, 1, wMix(w3dZ('forest', x.se), S[2], 0.3));
  else { const W = x.Z('snow'); P(0, 0, 20, 20, W[2]); for (let i = 0; i < 18 * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, W[3]); }
});
// A floor of warm boards, for the tavern.
W3T.planks = () => wTile('planks77', (P, D, r, x) => {
  const W0 = w3dBands('#8a5a30'); P(0, 0, 20, 20, W0[0]);
  for (let y = 0; y < 20; y += 4){ let xx = -((y * 3) % 11); while (xx < 20){ const w = 8 + r() * 8, c = [W0[2], wMix(W0[2], W0[1], 0.35), wMix(W0[2], W0[3], 0.3)][r() * 3 | 0];
    P(xx + 0.4, y + 0.4, w - 0.8, 3.2, c); P(xx + 0.4, y + 0.4, w - 0.8, 0.5, wMix(c, W0[4], 0.5));
    for (let k = 0; k < 4; k++) P(xx + 1 + r() * (w - 2), y + 1.2 + r() * 1.6, 1.6 + r() * 2, 0.3, wMix(c, W0[1], 0.5));   // grain
    P(xx + 1, y + 1.6, 0.5, 0.5, W0[0]); P(xx + w - 1.6, y + 1.6, 0.5, 0.5, W0[0]);                                   // nails
    if (r() < 0.12) P(xx + 2 + r() * (w - 5), y + 1.4, 1.2, 1, wMix(c, W0[0], 0.5));                                 // a knot
    xx += w; } }
});
W3T.tavWall = () => wTile('tavwall77', (P, D, r, x) => {        // timber and plaster, oak panelling below
  const Pl = w3dBands('#d4c4a0'), O = w3dBands('#5a3a1e');
  P(0, 0, 20, 9, Pl[2]); P(0, 0, 20, 0.8, Pl[3]); for (let i = 0; i < 12; i++) D(r() * x.N | 0, r() * (9 * x.U) | 0, Pl[1]);
  P(0, 0, 20, 1.6, O[1]); P(0, 8.4, 20, 1.6, O[1]); P(0, 8.4, 20, 0.4, O[3]); for (const xx of [0, 10]){ P(xx, 0, 1.6, 10, O[1]); P(xx, 0, 0.4, 10, O[3]); }
  P(0, 10, 20, 9, O[2]); for (let xx = 0; xx < 20; xx += 4){ P(xx, 10, 0.5, 9, O[0]); P(xx + 0.5, 10, 0.4, 9, O[3]); }
  P(0, 18.5, 20, 1.5, O[0]);
});
W3T.tavWallTop = () => wTile('tavwalltop77', (P, D, r, x) => {
  const O = w3dBands('#5a3a1e'), Pl = w3dBands('#d4c4a0'); P(0, 0, 20, 20, O[1]);
  P(4, 0, 12, 20, Pl[1]); P(5, 0, 10, 20, Pl[2]); P(0, 0, 4, 20, O[2]); P(0, 0, 0.6, 20, O[3]); P(16, 0, 4, 20, O[2]); P(19.4, 0, 0.6, 20, O[0]);
  for (let y = 0; y < 20; y += 10){ P(0, y, 20, 1.2, O[1]); P(0, y, 20, 0.4, O[3]); }
});
// A larger repeat made of a tile's variants, so the pattern is hard to spot.
function t77Pat(key, tile){
  const k = 'tp77:' + key + ':' + w3dTileSig(); if (SPR[k]) return SPR[k];
  const t0 = tile(0), n = t0.width, c = newCanvas(n * 3, n * 3), g = c.getContext('2d');
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) g.drawImage(tile((i * 7 + j * 13 + i * j) % 3), i * n, j * n);
  return SPR[k] = c;
}

/* ------------------------------------------------------------ ground --- */
const T77 = {tmp:null};
const t77r = (x, y, k) => (Math.imul((x * 73856093) ^ (y * 19349663) ^ ((k || 0) * 83492791), 2654435761) >>> 0) / 4294967296;
const WALLISH = new Set([T.WALL, T.STONE]);
const STRUCT77 = new Set([T.WALL, T.STONE, T.PALISADE, T.ROOF, T.TENT]);
const T77_LAYERS = [
  {types:[T.FOREST], tile:v => TILE.forest(v), r:0.6, rough:0.55, join:[T.FOREST], halo:0.14},
  {types:[T.HILL], tile:v => TILE.hill(v), r:0.58, rough:0.28, join:[T.HILL], halo:0.12, cliff:true},
  {types:[T.ROAD, T.GATE], tile:v => TILE.road(v), r:0.5, rough:0.12, join:[T.ROAD, T.GATE], halo:0.2, ruts:true},
  {types:[T.FLOOR], tile:() => TILE.floor(0), r:0.53, rough:0.05, join:[T.FLOOR, T.WALL, T.STONE, T.ROOF, T.GATE, T.PALISADE, T.TENT, T.WAGON, T.RUBBLE], halo:0.16, one:true},
  {types:[T.RUBBLE], tile:v => TILE.rubble(v), r:0.55, rough:0.85, join:[T.RUBBLE, T.STONE, T.WALL], halo:0.2},   // over the paving: broken flagstones
  {types:[T.WATER], tile:() => TILE.water(0), r:0.56, rough:0.18, join:[T.WATER], halo:0.32, one:true}
];
// The layer's shape, in black, on g. expand grows it (for the soft dark halo).
function t77Shapes(g, M, L, expand){
  const w = M.w, h = M.h, grid = M.g, own = new Set(L.types), join = new Set(L.join);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : grid[y * w + x];
  const R = CELL * L.r + expand;
  g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.lineWidth = R * 2;
  g.beginPath();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    if (!own.has(at(x, y))) continue;
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1], [-1, 0], [0, -1]]){
      const n = at(x + dx, y + dy); if (!join.has(n)) continue;
      if (own.has(n) && (dx < 0 || dy < 0)) continue;                        // an own-own link is drawn once
      if (dx && dy && join.has(at(x + dx, y)) && join.has(at(x, y + dy))) continue;   // the square fill covers it
      g.moveTo(cx, cy); g.lineTo(cx + dx * CELL * (own.has(n) ? 1 : 0.62), cy + dy * CELL * (own.has(n) ? 1 : 0.62));
    }
  }
  g.stroke();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    if (!own.has(at(x, y))) continue;
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL, j = L.rough * 7;
    g.beginPath(); g.arc(cx + (t77r(x, y, 1) - 0.5) * j, cy + (t77r(x, y, 2) - 0.5) * j, R * (1 + L.rough * 0.32 * (t77r(x, y, 3) - 0.5)), 0, TAU); g.fill();
    if (join.has(at(x + 1, y)) && join.has(at(x, y + 1)) && join.has(at(x + 1, y + 1))) g.fillRect(cx, cy, CELL, CELL);
    if (L.rough > 0.2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      if (join.has(at(x + dx, y + dy))) continue;
      const k = Math.floor(L.rough * 2.4 + t77r(x, y, 10 + dx * 3 + dy));
      for (let i = 0; i < k; i++){ const a = t77r(x, y, 20 + i * 4 + dx * 2 + dy * 7) - 0.5, d = 0.36 + 0.14 * t77r(x, y, 40 + i),
          px = cx + dx * CELL * d + (dy ? a : 0) * CELL * 0.9, py = cy + dy * CELL * d + (dx ? a : 0) * CELL * 0.9;
        g.beginPath(); g.arc(px, py, CELL * (0.08 + 0.16 * t77r(x, y, 60 + i)) * L.rough + expand, 0, TAU); g.fill(); }
    }
  }
}
// Wheel ruts that follow narrow roads.
function t77Ruts(g, M){
  const w = M.w, h = M.h, grid = M.g, rd = t => t === T.ROAD || t === T.GATE, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : grid[y * w + x];
  const Dt = w3dBands(w3dZ('dirt', w3dSeason()));
  g.lineCap = 'round'; g.lineWidth = 2.2; g.strokeStyle = wMix(Dt[2], Dt[0], 0.45); g.globalAlpha = 0.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    if (!rd(at(x, y))) continue;
    let nb = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && rd(at(x + dx, y + dy))) nb++;
    if (nb > 3) continue;                                                      // wide roads and squares: no ruts
    const cx = (x + 0.5) * CELL, cy = (y + 0.5) * CELL;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]){
      if (!rd(at(x + dx, y + dy))) continue; if (dx && dy && (rd(at(x + dx, y)) || rd(at(x, y + dy)))) continue;
      const L = Math.hypot(dx, dy), nx = -dy / L * 7, ny = dx / L * 7;
      for (const s of [-1, 1]){ g.beginPath(); g.moveTo(cx + nx * s, cy + ny * s); g.lineTo(cx + dx * CELL + nx * s, cy + dy * CELL + ny * s); g.stroke(); }
    }
  }
  g.globalAlpha = 1;
}
function t77Bake(){
  const M = MAP, sig = w3dTileSig() + ':' + M.w + 'x' + M.h;
  if (M._b77 && M._b77sig === sig) return M._b77;
  const W = M.w * CELL, H = M.h * CELL;
  const c = M._b77 || newCanvas(W, H); if (c.width !== W || c.height !== H){ c.width = W; c.height = H; }
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = g.createPattern(groundPattern(), 'repeat'); g.fillRect(0, 0, W, H);
  if (!T77.tmp) T77.tmp = newCanvas(W, H);
  const tmp = T77.tmp; if (tmp.width !== W || tmp.height !== H){ tmp.width = W; tmp.height = H; }
  const tg = tmp.getContext('2d'); tg.imageSmoothingEnabled = false;
  const present = new Set(M.g);
  for (const L of T77_LAYERS){
    if (!L.types.some(t => present.has(t))) continue;
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); t77Shapes(tg, M, L, 3);
    g.globalAlpha = L.halo; g.drawImage(tmp, 0, 0); g.globalAlpha = 1;
    tg.clearRect(0, 0, W, H); t77Shapes(tg, M, L, 0);
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = tg.createPattern(L.one ? L.tile(0) : t77Pat(String(L.types[0]), L.tile), 'repeat'); tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'source-over';
    g.drawImage(tmp, 0, 0);
    if (L.ruts) t77Ruts(g, M);
    if (L.cliff){ const edge = TILE.hillEdge(); for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (M.g[y * M.w + x] === T.HILL && (y + 1 >= M.h || M.g[(y + 1) * M.w + x] !== T.HILL)) g.drawImage(edge, x * CELL, y * CELL); }
  }
  tmp.width = 1; tmp.height = 1;                                              // let the scratch go
  M._b77 = c; M._b77sig = sig; return c;
}
function terrain77(cx, cy){
  const b = t77Bake(), M = MAP, f = G ? G.frame : CAMP.t;
  ctx.fillStyle = '#16130f'; ctx.fillRect(cx - 40, cy - 40, VW + 80, VH + 80);
  const sx = Math.max(0, cx - 40), sy = Math.max(0, cy - 40), ex = Math.min(M.w * CELL, cx + VW + 40), ey = Math.min(M.h * CELL, cy + VH + 40);
  if (ex > sx && ey > sy) ctx.drawImage(b, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
  const x0 = Math.max(0, Math.floor(cx / CELL) - 1), x1 = Math.min(M.w - 1, Math.floor((cx + VW) / CELL) + 1), y0 = Math.max(0, Math.floor(cy / CELL) - 1), y1 = Math.min(M.h - 1, Math.floor((cy + VH) / CELL) + 1);
  const g = M.g, w = M.w, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= M.h) ? -1 : g[y * w + x];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const t = g[y * w + x], px = x * CELL, py = y * CELL, below = at(x, y + 1);
    if (WALLISH.has(t)){
      const front = !WALLISH.has(below);
      if (!STRUCT77.has(below)){ ctx.fillStyle = 'rgba(18,12,8,.34)'; ctx.fillRect(px + 4, py + CELL, CELL, 10); ctx.fillStyle = 'rgba(18,12,8,.16)'; ctx.fillRect(px + 4, py + CELL + 10, CELL, 6); }
      if (!STRUCT77.has(at(x + 1, y))){ ctx.fillStyle = 'rgba(18,12,8,.24)'; ctx.fillRect(px + CELL, py + 8, 7, CELL); }
      if (front){ ctx.drawImage(TILE.stoneTop(), 0, 0, CELL, CELL * 0.45, px, py, CELL, CELL * 0.45); ctx.drawImage(TILE.stone(), 0, 0, CELL, CELL, px, py + CELL * 0.45, CELL, CELL * 0.55); }   // a top, then a tall face
      else ctx.drawImage(TILE.stoneTop(), px, py);
      ctx.fillStyle = 'rgba(14,10,8,.75)';                                                                 // a dark outline where the block meets anything else
      if (!WALLISH.has(at(x, y - 1))) ctx.fillRect(px, py, CELL, 2);
      if (!WALLISH.has(at(x - 1, y))) ctx.fillRect(px, py, 2, CELL);
      if (!WALLISH.has(at(x + 1, y))) ctx.fillRect(px + CELL - 2, py, 2, CELL);
      if (front) ctx.fillRect(px, py + CELL * 0.45 - 1, CELL, 2);
    }
    else if (t === T.PALISADE) ctx.drawImage(TILE.palisade(), px, py);
    else if (t === T.ROOF){ const st = (M.structures || []).find(s => s.kind === 'house' && Math.abs(s.x - x) <= 4 && Math.abs(s.y - y) <= 3); ctx.drawImage(below === T.ROOF ? TILE.roof(st ? st.v : 0) : TILE.wallFront(0), px, py); }
    else if (t === T.TENT) ctx.drawImage(TILE.tent((x * 7 + y * 13) % 3), px, py);
    else if (t === T.WATER){ const k = t77r(x, y, 5); ctx.fillStyle = 'rgba(210,230,245,.28)';
      for (let i = 0; i < 2; i++){ const ox = ((k * 997 + f * (0.25 + i * 0.1)) % 46) - 6, oy = 9 + i * 17 + Math.sin((f + k * 300) / 40 + i) * 2; ctx.fillRect(px + ox, py + oy, 7, 1.5); } }
  }
}

/* ------------------------------------------------------------ tavern --- */
const TAV77 = {lights:null};
function tavern77(cx, cy){
  const M = MAP, f = G ? G.frame : 0, W = M.w * CELL, H = M.h * CELL;
  ctx.fillStyle = '#100b07'; ctx.fillRect(cx - 40, cy - 40, VW + 80, VH + 80);
  if (!TAV77.pat || TAV77.sig !== w3dTileSig()){ TAV77.pat = ctx.createPattern(t77Pat('planks', () => W3T.planks()), 'repeat'); TAV77.sig = w3dTileSig(); }
  ctx.fillStyle = TAV77.pat; ctx.fillRect(CELL, CELL, W - 2 * CELL, H - 2 * CELL);
  // rugs
  const rug = (x, y, w, h, c1, c2) => { if (window.TAVDEPTH44 !== false){   /* F-44 (k): the rug gets depth: a soft contact shadow, a thick pile edge, woven weft, a worn sheen and a lamp-side highlight, not a flat red slab */
      ctx.save(); const sg = ctx.createRadialGradient(x + w / 2, y + h / 2 + 6, Math.min(w, h) * 0.3, x + w / 2, y + h / 2 + 6, Math.max(w, h) * 0.62); sg.addColorStop(0, 'rgba(0,0,0,.34)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.fillRect(x - 14, y - 8, w + 28, h + 30);
      ctx.fillStyle = c1; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; for (let j = 0; j < h; j += 3) ctx.fillRect(x, y + j, w, 1); ctx.fillStyle = '#fff'; for (let i = 0; i < w; i += 5) ctx.fillRect(x + i, y, 1, h); ctx.globalAlpha = 1;
      const lg = ctx.createLinearGradient(x, y, x + w * 0.4, y + h); lg.addColorStop(0, 'rgba(255,214,150,.2)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = lg; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = c2; ctx.fillRect(x + 5, y + 5, w - 10, 3); ctx.fillRect(x + 5, y + h - 8, w - 10, 3); ctx.fillRect(x + 5, y + 5, 3, h - 10); ctx.fillRect(x + w - 8, y + 5, 3, h - 10);
      for (let i = 0; i < w; i += 9){ ctx.fillRect(x + i + 2, y + 12, 4, 4); ctx.fillRect(x + i + 6, y + h - 16, 4, 4); }
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x, y + h - 3, w, 3); ctx.fillStyle = 'rgba(255,225,170,.28)'; ctx.fillRect(x, y, w, 1.5); ctx.fillStyle = '#d8c8a0'; for (let i = 3; i < h; i += 4){ ctx.fillRect(x - 3, y + i, 3, 1); ctx.fillRect(x + w, y + i, 3, 1); } ctx.restore(); return; }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 3, y + 4, w, h); ctx.fillStyle = c1; ctx.fillRect(x, y, w, h); ctx.fillStyle = c2; ctx.fillRect(x + 5, y + 5, w - 10, 3); ctx.fillRect(x + 5, y + h - 8, w - 10, 3); ctx.fillRect(x + 5, y + 5, 3, h - 10); ctx.fillRect(x + w - 8, y + 5, 3, h - 10);
    for (let i = 0; i < w; i += 9){ ctx.fillRect(x + i + 2, y + 12, 4, 4); ctx.fillRect(x + i + 6, y + h - 16, 4, 4); } ctx.fillStyle = '#d8c8a0'; for (let i = 3; i < h; i += 4){ ctx.fillRect(x - 3, y + i, 3, 1); ctx.fillRect(x + w, y + i, 3, 1); } };
  rug(9.2 * CELL, 8.2 * CELL, 7.6 * CELL, 2.6 * CELL, '#6a2a22', '#c8a050');
  rug(11.6 * CELL, 14.2 * CELL, 1.8 * CELL, 2.6 * CELL, '#2a3a5a', '#c8b890');
  // walls
  const g = M.g, w = M.w, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= M.h) ? -1 : g[y * w + x], inside = t => t === T.FLOOR || t === T.WAGON;
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++){
    if (at(x, y) !== T.WALL) continue;
    const px = x * CELL, py = y * CELL;
    if (inside(at(x, y + 1))){ ctx.drawImage(W3T.tavWall(), px, py); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(px, py + CELL, CELL, 7); }
    else ctx.drawImage(W3T.tavWallTop(), px, py);
  }
  // dim room, warm pools of light
  ctx.fillStyle = 'rgba(24,12,4,.34)'; ctx.fillRect(CELL, CELL, W - 2 * CELL, H - 2 * CELL);
  if (!TAV77.lights) TAV77.lights = [[3.5, 2.2, 300, 0.26], [8, 3.2, 130, 0.16], [12.5, 3.2, 130, 0.16], [17, 3.2, 130, 0.16]].concat((M.tables || []).map(t => [t.x + 1, t.y + 0.5, 110, 0.15]));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  TAV77.lights.forEach(([lx, ly, r, a], i) => { const fl = 1 + Math.sin(f / (6 + i) + i * 1.7) * 0.05 + Math.sin(f / 2.3 + i) * 0.02, X = lx * CELL, Y = ly * CELL, R = r * fl;
    const gr = ctx.createRadialGradient(X, Y, 4, X, Y, R); gr.addColorStop(0, `rgba(255,170,80,${a})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gr; ctx.fillRect(X - R, Y - R, R * 2, R * 2); });
  ctx.restore();
}
Object.assign(W3D_KINDS, {
  tv_hearth:{frame:[170, 140, 12], view:2, keep:0.7, clip:'flicker', seasonPass:false, build:se => { const P = [], add = wAdd(P), fl = w76Flame(P);
    add([{t:'box', c:[0, 1.5, 4], r:[56, 1.5, 14], z:'stoneD'}, {t:'box', c:[0, 30, -10], r:[50, 30, 10], z:'stone'}]);
    for (let y = 7; y < 60; y += 8) add([{t:'box', c:[0, y, 0.2], r:[50, 0.5, 0.3], z:'stoneD'}]);
    for (let y = 3; y < 60; y += 8) for (let x = -40 + ((y / 8 | 0) % 2) * 10; x < 50; x += 20) add([{t:'box', c:[x, y, 0.2], r:[0.5, 3.6, 0.3], z:'stoneD'}]);
    add([{t:'box', c:[0, 13, 0.6], r:[25, 12, 0.5], z:'soot'}, {t:'ell', c:[0, 25, 0.6], r:[25, 6, 0.5], z:'soot'}, {t:'box', c:[0, 34, 3], r:[56, 2.8, 6], z:'beam'}, {t:'box', c:[0, 75, -12], r:[30, 16, 8], z:'stone'}]);
    for (const [a, b] of [[[-14, 3, 2], [12, 6, 3]], [[-12, 3, 5], [14, 4, 1]]]) add([{t:'cap', a, p:b, r:2.6, z:'log'}]);
    for (const x of [-42, -30, 38]) add([{t:'cap', a:[x, 37, 4], p:[x, 43, 4], r:1.2, z:'wax'}]);
    add([{t:'ell', c:[0, 50, 1.5], r:[3.6, 4.4, 2.6], z:'bone'}, {t:'ell', c:[0, 46.4, 3], r:[2, 2, 1.6], z:'bone'}]);
    for (const s of [-1, 1]) add([{t:'cap', a:[s * 3, 52, 1.5], p:[s * 13, 61, 1.5], r:1, z:'bone'}, {t:'cap', a:[s * 8, 56, 1.5], p:[s * 10, 63, 1.5], r:0.7, z:'bone'}, {t:'cap', a:[s * 11, 59, 1.5], p:[s * 17, 63, 1.5], r:0.7, z:'bone'}]);
    add([{t:'cap', a:[48, 1, 10], p:[52, 22, 8], r:0.8, z:'iron'}, {t:'cap', a:[52, 1, 10], p:[55, 20, 8], r:0.8, z:'iron'}]);
    fl([{t:'ell', c:[0, 9, 2], r:[11, 8, 5], z:'flame'}, {t:'ell', c:[2, 14, 2], r:[6, 7, 4], z:'flame2'}, {t:'ell', c:[-5, 13, 2], r:[3, 5, 2], z:'flame2'}, {t:'ell', c:[0, 4, 3], r:[12, 2, 5], z:'ember'}]);
    for (const x of [-42, -30, 38]) fl([{t:'ell', c:[x, 44.6, 4], r:[0.9, 1.6, 0.9], z:'flame2'}]);
    return {parts:P, bones:{flame:{parent:'root', off:[0, 0, 0]}}, zones:SKZ(se, null, {stone:'#8a8278', stoneD:'#5e584f', soot:'#1a1210', beam:'#4a2e16', wax:'#f0e6c8', bone:'#e0d6bc', log:'#5a3a1a', flame:'#ff9a30', flame2:'#ffd860', ember:'#ff7a2a'}),
      keepZones:['stone', 'stoneD', 'soot', 'beam', 'wax', 'bone']}; }},
  tv_kegs:MPK([130, 80, 10], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[34, 2, 9], z:'barD'}, {t:'box', c:[0, 15.5, 0], r:[34, 1.4, 9], z:'barD'}]);
    for (const x of [-32, 0, 32]) add([{t:'box', c:[x, 8, 0], r:[1.6, 8, 9], z:'barD'}]);
    for (const [x, y] of [[-18, 9], [0, 9], [18, 9], [-9, 22], [9, 22]]) add([{t:'ell', c:[x, y, 0], r:[8, 7, 7], rot:[0, Math.PI / 2, 0], z:'wood'}, {t:'ell', c:[x, y, 7.4], r:[6, 6, 0.6], z:'woodL'}, {t:'ell', c:[x - 5, y, 0], r:[0.6, 7.2, 7.2], z:'iron'}, {t:'ell', c:[x + 5, y, 0], r:[0.6, 7.2, 7.2], z:'iron'}, {t:'cap', a:[x, y - 3, 7.6], p:[x, y - 3, 10], r:0.8, z:'brass'}]);
    return {parts:P, zones:SKZ(se, null, {barD:'#3a2410', brass:'#c8a040'}), keepZones:['brass']}; }, {seasonPass:false}),
  tv_barrels:MPK([90, 70, 10], se => { const P = [], add = wAdd(P);
    barrel(add, -8, -4, 1.5); barrel(add, 9, -2, 1.4); barrel(add, 0, 9, 1.2); crate(add, -20, 8, 1.1);
    for (const [x, z, s] of [[-8, -4, 1.5], [9, -2, 1.4], [0, 9, 1.2]]) add([{t:'ell', c:[x, 12.4 * s, z], r:[4.6 * s, 0.5, 4.6 * s], z:'woodD'}]);
    return {parts:P, zones:SKZ(se)}; }, {seasonPass:false}),
  tv_candle:{frame:[30, 50, 8], view:2, keep:0.7, clip:'flicker', seasonPass:false, build:se => { const P = [], add = wAdd(P), fl = w76Flame(P);
    add([{t:'ell', c:[0, 16, 0], r:[2.4, 0.6, 2.4], z:'brass'}, {t:'cap', a:[0, 16, 0], p:[0, 22, 0], r:1.1, z:'wax'}, {t:'ell', c:[0.8, 20, 0.9], r:[0.5, 1.2, 0.4], z:'wax'}]);
    fl([{t:'ell', c:[0, 24, 0], r:[0.9, 1.7, 0.9], z:'flame2'}]);
    return {parts:P, bones:{flame:{parent:'root', off:[0, 0, 0]}}, zones:{brass:'#c8a040', wax:'#f0e6c8', flame2:'#ffd860', flame:'#ff9a30'}, keepZones:['brass', 'wax']}; }}
});
// Furniture cells: the hearth, the kegs and the corner barrels stop feet.
{ const f = generateBrawlMap;
  generateBrawlMap = function(){
    const M = f();
    try {
      const set = (x, y) => { if (M.g[y * M.w + x] === T.FLOOR) M.g[y * M.w + x] = T.WAGON; };
      for (const x of [2, 3, 4]) set(x, 1);
      for (const x of [22, 23, 24]) set(x, 1);
      for (const [x, y] of [[1, 15], [1, 16], [2, 16], [24, 15], [24, 16], [23, 16]]) set(x, y);
      const mg = M.mini.getContext('2d'); for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++){ mg.fillStyle = MINI_COL[M.g[y * M.w + x]]; mg.fillRect(x, y, 1, 1); }
      M.reach = bfsFrom(13.5 * CELL, 9.5 * CELL); TAV77.lights = null;
    } catch (e) { console.warn('tavern furniture:', e); }
    return M;
  };
}
brawlBodies = (function(prev){
  return function(bodies, onScreen){
    prev(bodies, onScreen);
    if (!G || !MAP) return;
    bodies.push({y:1.9 * CELL, custom:() => w3dMapProp('tv_hearth', 3.5 * CELL, 1.95 * CELL, {t:G.frame})});
    bodies.push({y:1.9 * CELL, custom:() => w3dMapProp('tv_kegs', 23.5 * CELL, 1.95 * CELL)});
    bodies.push({y:16.9 * CELL, custom:() => w3dMapProp('tv_barrels', 1.9 * CELL, 16.95 * CELL)});
    bodies.push({y:16.9 * CELL, custom:() => w3dMapProp('tv_barrels', 24.1 * CELL, 16.95 * CELL, {view:1.7})});
    (MAP.tables || []).forEach((t, i) => bodies.push({y:(t.y + 0.9) * CELL + 0.1, custom:() => w3dMapProp('tv_candle', (t.x + 1) * CELL + (i % 2 ? 8 : -6), (t.y + 1) * CELL + 2, {t:G.frame + i * 11})}));
  };
})(brawlBodies);

/* ------------------------------------------------- the terrain switch --- */
drawTerrain = (function(prev){
  return function(cx, cy){
    if (!MAP || !MAP.g) return prev(cx, cy);
    try { w3dTileReset(); if (typeof isBrawl === 'function' && isBrawl()) tavern77(cx, cy); else terrain77(cx, cy); }
    catch (e) { console.warn('3D ground fell back:', e); prev(cx, cy); }
  };
})(drawTerrain);

/* --------------------------------------------------------- bench logs --- */
const BARD_SEAT = {dx:-58, dy:-4};
function benchLogBodies(){
  const fx = HUB.fire.x, fy = HUB.fire.y, B = CAMP.bardQ, out = [];
  for (const L of BENCH_LOGS){ const [lx, ly, w] = L, mx = fx + lx + w / 2, gy = fy + ly + 8;
    let y = gy; if (B && CAMP.people.includes(B) && Math.abs(B.x - mx) < w / 2 + 8 && Math.abs(B.y - gy) < 34) y = B.y - 0.5;
    out.push({y, blog:L}); }
  return out;
}
function drawBenchLog(L){
  const [lx, ly, w] = L, fx = HUB.fire.x, fy = HUB.fire.y;
  if (w3dDraw('dc_benchlog', fx + lx + w / 2, fy + ly + 8)) return;
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(fx + lx, fy + ly, w, 8); ctx.fillStyle = '#7a5230'; ctx.fillRect(fx + lx, fy + ly, w, 3);
}

/* ----------------------------------------------------- build anywhere --- */
const FIXED_SITE = new Set(['palisade', 'watchtower']);   // fixed plots: each builds only on its own plot (startBuild)
const SITE = {map:null, walkIn:{}};
const inBuild = id => !!(META && META.build && META.build[id]);
function sitePlan(){
  const L = curLayout(), S = (META && META.sites) || {}, map = {}, taken = new Set();
  const placed = FACILITIES.filter(f => L.plots[f.id] && !FIXED_SITE.has(f.id)), slots = Object.keys(L.plots).filter(s => !FIXED_SITE.has(s));
  for (const f of placed){ const s = S[f.id]; if (s && L.plots[s] && !FIXED_SITE.has(s) && !taken.has(s)){ map[f.id] = s; taken.add(s); } }
  for (const f of placed) if (!map[f.id] && (has(f.id) || inBuild(f.id)) && !taken.has(f.id)){ map[f.id] = f.id; taken.add(f.id); }
  for (const f of placed) if (!map[f.id] && !taken.has(f.id)){ map[f.id] = f.id; taken.add(f.id); }
  const free = slots.filter(s => !taken.has(s));
  for (const f of placed) if (!map[f.id]){ const s = free.shift(); if (s){ map[f.id] = s; taken.add(s); } }
  for (const id of FIXED_SITE) if (L.plots[id]) map[id] = id;
  return map;
}
function applySites(){
  if (!META) return;
  const L = curLayout(), m = SITE.map = sitePlan();
  for (const id in m){ const p = L.plots[m[id]]; if (p) PLOTS[id] = [p[0], p[1]]; }
  CAMP.dirty = true; CAMP.walk = null; CAMP.aisle = null;
}
applySkin = (function(prev){ return function(){ prev(); try { applySites(); } catch (e) { console.warn('sites:', e); } }; })(applySkin);
plotView = (function(prev){
  return function(id){
    const s = SITE.map && SITE.map[id];
    if (s && s !== id){ const L = curLayout(), p = L.plots[s]; if (p && p[2] !== undefined) return p[2]; if (layoutKey() === 'fort' && p) return fortView(p[0]); return undefined; }
    return prev(id);
  };
})(plotView);
paddockAt = (function(prev){
  return function(){ const L = curLayout(), s = SITE.map && SITE.map.stables; if (!s || s === 'stables' || !L.paddock || !L.plots.stables || !L.plots[s]) return prev();
    const a = L.plots.stables, b = L.plots[s]; return [L.paddock[0] - a[0] + b[0], L.paddock[1] - a[1] + b[1]]; };
})(paddockAt);

/* -------------------------------------------------------- construction --- */
function buildSeasons(f){ const o = {kennels:1, trapyard:1, edelos:1, watchtower:2, palisade:1}; if (o[f.id] !== undefined) return o[f.id]; return f.cost <= 150 ? 1 : f.cost <= 250 ? 2 : 3; }
// The clock is the Chronicle's season (one per contract; moving house does not wind it back).
const buildNow = () => { try { return chron().turn; } catch (e) { return META.deployments || 0; } };
function buildRec(id){
  const b = META.build[id];
  if (b && b.clk !== 't'){ const done = (META.deployments || 0) - b.start; b.need = Math.max(1, Math.round(b.need / 2)); b.start = buildNow() - Math.min(done, b.need - 1); b.clk = 't'; }   // first versions counted half-seasons
  return b;
}
function buildLeft(id){ const b = buildRec(id); return Math.max(0, b.need - (buildNow() - b.start)); }
function buildProg(id){ const b = buildRec(id); return Math.max(0, Math.min(1, (buildNow() - b.start) / b.need)); }
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
function leftText(id){ const n = buildLeft(id); return n <= 0 ? 'finishing' : plural(n, 'season'); }
function campNote(msg){
  let el = $('camp-note');
  if (!el){ el = document.createElement('div'); el.id = 'camp-note';
    el.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:60;background:rgba(20,14,8,.9);color:#f0e2bf;border:2px solid #7a5a14;padding:8px 16px;font:15px Georgia,serif;border-radius:4px;pointer-events:none;transition:opacity .4s;max-width:80vw;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.5)';
    document.body.appendChild(el); }
  el.textContent = msg; el.style.opacity = '1'; clearTimeout(campNote.t); campNote.t = setTimeout(() => { el.style.opacity = '0'; }, 4200);
}
function startBuild(fid, slot){
  if (FIXED_SITE.has(fid)) slot = fid; if (FIXED_SITE.has(slot) && slot !== fid) return;   // a fixed facility on its own plot only, and nothing else there
  const f = facility(fid); if (!f || has(fid) || inBuild(fid)) return;
  if (META.treasury < facCost(f) || (f.req && !has(f.req))) return;
  META.treasury -= facCost(f);
  META.sites = META.sites || {}; META.build = META.build || {};
  for (const k in META.sites) if (META.sites[k] === slot && !has(k) && !inBuild(k)) delete META.sites[k];
  META.sites[fid] = slot;
  META.build[fid] = {start:buildNow(), need:buildSeasons(f), clk:'t', paid:facCost(f)};
  SITE.walkIn[fid] = Date.now(); CAMP.people = CAMP.people.filter(q => !(q.kind === 'worker' && q.site === fid));
  applySites(); saveMeta();
  try { refreshUI(); } catch (e) {}
  SFX.play('pick'); campNote(`${f.name}: the builders are on their way. Ready in ${leftText(fid)}.`);
  openPanel('site', fid);
  worksLog('start', fid, {cost: META.build[fid].paid, seasons: META.build[fid].need});
}
const buildRefund = fid => { const b = buildRec(fid), paid = b.paid || facCost(facility(fid)); return buildNow() === b.start ? paid : Math.round(paid / 2); };   // changed your mind this season: all of it back
function cancelBuild(fid){
  if (!inBuild(fid)) return;
  const f = facility(fid), back = buildRefund(fid);
  META.treasury += back; delete META.build[fid]; if (META.sites) delete META.sites[fid];
  applySites(); saveMeta(); try { refreshUI(); } catch (e) {}
  closePanel(); campNote(`Work on the ${f.name} stops. ${back}gp comes back to the Treasury.`);
  worksLog('stop', fid, {back});
}
function tickBuilds(){
  if (!META || !META.build) return;
  const done = [];
  for (const id of Object.keys(META.build)){
    if (buildLeft(id) > 0) continue;
    delete META.build[id]; if (has(id)) continue;
    META.facilities[id] = true; done.push(id);
    if (id === 'command' && META.leader && leaderStats(META.leader).rawLuck > 6) META.treasury += 60;
  }
  if (!done.length) return;
  try { checkMilestones(null); } catch (e) {}
  saveMeta(); applySites();
  for (const id of done){ if (PLOTS[id]) CAMP.fx.push({x:PLOTS[id][0], y:PLOTS[id][1], life:70}); }
  campNote(done.map(id => facility(id).name).join(', ') + (done.length > 1 ? ' are' : ' is') + ' finished.');
  SFX.play('win');
}
// What an empty plot says when you point at it.
function plotLabel(o){ return FIXED_SITE.has(o.id) ? [facility(o.id).name, `Plot: ${facCost(facility(o.id))}gp`] :   /* Index 88 */ ['Empty plot', 'Click to choose a building']; }
campObjects = (function(prev){
  return function(){
    const out = prev();
    if (META && META.build) for (let i = 0; i < out.length; i++){ const o = out[i]; if (o.kind === 'plot' && inBuild(o.id)) out[i] = {kind:'site', id:o.id, x:o.x, y:o.y, img:facilityCanvas(o.id)}; }
    return out;
  };
})(campObjects);
Object.assign(W3D_KINDS, {
  m_footing:MPK([130, 70, 14], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 0.4, 0], r:[44, 0.4, 24], z:'dirt'}]);
    for (const [x, z, w, d] of [[0, -24, 46, 2.4], [0, 24, 46, 2.4], [-44, 0, 2.4, 24], [44, 0, 2.4, 24]]) add([{t:'box', c:[x, 2.4, z], r:[w, 2.4, d], z:'stone'}, {t:'box', c:[x, 4.9, z], r:[w, 0.3, d], z:'stoneL'}]);
    return {parts:P, zones:SKZ(se, null, {dirt:'#6a5236'})}; }, {seasonPass:false}),
  m_scaffold:MPK([140, 110, 14], se => { const P = [], add = wAdd(P);
    const posts = [[-46, -26], [46, -26], [-46, 26], [46, 26], [0, 26], [0, -26]];
    for (const [x, z] of posts) add([{t:'cap', a:[x, 0, z], p:[x, 64, z], r:1.4, z:'pole'}]);
    for (const y of [22, 44]){ for (const z of [-26, 26]) add([{t:'cap', a:[-46, y, z], p:[46, y, z], r:0.9, z:'pole'}]); for (const x of [-46, 46]) add([{t:'cap', a:[x, y, -26], p:[x, y, 26], r:0.9, z:'pole'}]);
      add([{t:'box', c:[0, y + 1.4, 30], r:[46, 0.8, 4], z:'plank'}]); }
    add([{t:'cap', a:[-46, 0, 26], p:[46, 44, 26], r:0.7, z:'pole'}]);                                                 // a brace
    for (const sx of [-1, 1]) add([{t:'cap', a:[20 + sx * 4, 0, 33], p:[20 + sx * 4, 46, 31], r:0.7, z:'pole'}]);      // a ladder
    for (let y = 5; y < 46; y += 6) add([{t:'cap', a:[16, y, 33 - y / 23], p:[24, y, 33 - y / 23], r:0.5, z:'pole'}]);
    return {parts:P, zones:SKZ(se, null, {pole:'#b08a5a', plank:'#9a6a3a'})}; }, {seasonPass:false}),
  m_buildpile:MPK([80, 50, 10], se => { const P = [], add = wAdd(P);
    for (let k = 0; k < 4; k++) add([{t:'box', c:[-8, 1.2 + k * 2.4, (k % 2) * 1.5], r:[14, 1.1, 3], rot:[0, (k % 2 ? 0.06 : -0.04), 0], z:k % 2 ? 'woodL' : 'wood'}]);
    for (const [x, y, z] of [[14, 2.4, -3], [20, 2.4, 2], [16, 6.8, 0]]) add([{t:'box', c:[x, y, z], r:[3.6, 2.4, 3], z:'stone'}, {t:'box', c:[x, y + 2.3, z], r:[3.6, 0.3, 3], z:'stoneL'}]);
    return {parts:P, zones:SKZ(se)}; }, {seasonPass:false})
});
function drawSite(o, hot){
  const s = BSCALE, w = o.img.width * s, h = o.img.height * s, p = 0.14 + 0.76 * buildProg(o.id), k = Math.max(0.55, Math.min(1.5, w / 100));
  shadowAt(o.x, o.y + 4, w * 0.42);
  if (!(w3dMapProp('m_footing', o.x, o.y + 6, {scale:k}))){ ctx.fillStyle = 'rgba(120,110,95,.85)'; ctx.fillRect(o.x - w * 0.42, o.y - 4, w * 0.84, 10); }
  ctx.save(); ctx.beginPath(); ctx.rect(o.x - w * 1.2, o.y + 8 - h * p, w * 2.4, h * 2); ctx.clip();
  if (hot) ctx.filter = 'brightness(1.18)';
  const ok = typeof w3dFacility === 'function' && w3dFacility({kind:'building', id:o.id, x:o.x, y:o.y});
  if (!ok) ctx.drawImage(o.img, o.x - w / 2, o.y - h + 8, w, h);
  ctx.restore();
  if (!(w3dMapProp('m_scaffold', o.x, o.y + 10, {scale:k}))){ ctx.fillStyle = '#b08a5a'; for (const dx of [-0.46, 0, 0.46]) ctx.fillRect(o.x + dx * w - 2, o.y - h * 0.7, 4, h * 0.7 + 8); ctx.fillRect(o.x - w * 0.48, o.y - h * 0.4, w * 0.96, 3); }
  if (!(w3dMapProp('m_buildpile', o.x + w * 0.55, o.y + 22))){ ctx.fillStyle = '#9a6a3a'; ctx.fillRect(o.x + w * 0.4, o.y + 10, 40, 10); }
  if ((CAMP.t + (hash(o.id) % 50)) % 50 === 0) CAMP.puffs.push({x:o.x + rnd(-w * 0.3, w * 0.3), y:o.y - rnd(0, h * p * 0.6), vx:rnd(-.15, .15), vy:-0.25, life:70, c:'#c8b898'});
  if (hot) campLabel(o.x, o.y - h * p - 20, facility(o.id).name, 'Building: ' + leftText(o.id));
}
// The builders: three townsfolk per site who walk in from the gate road and hammer away.
const WORKER_RACES = ['HUMAN', 'HUMAN', 'DWARF', 'HALFLING', 'HALF_ORC', 'GNOME', 'HUMAN'];
const WORK_SPOTS = [[-54, 28, false], [54, 28, true], [8, 44, false]];
function workersFor(id){
  return [0, 1, 2].map(i => { const h = hash(id + ':' + i), race = WORKER_RACES[h % WORKER_RACES.length], sex = (h >> 4) % 3 === 0 ? 'f' : 'm';
    let name = 'Builder'; try { const g = NAMES[RACES[race].grp] || NAMES.HUMAN, list = g[sex] || g.m; name = list[(h >>> 7) % list.length] || 'Builder'; } catch (e) {}   // Index 80: a real name, the same every time
    return {id:'wk' + id + i, kind:'worker', site:id, slotI:i, p:{race, spec:'PLAIN', name, id:'wk' + id + i, sex}}; });
}
campSync = (function(prev){
  return function(){
    try { tickBuilds(); } catch (e) { console.warn('builds:', e); }
    const keep = new Map(CAMP.people.filter(q => q.kind === 'worker').map(q => [q.id, q]));
    prev();
    if (CAMP.bardQ && !inStoryNow()){ const B = CAMP.bardQ, x = HUB.fire.x + BARD_SEAT.dx, y = HUB.fire.y + BARD_SEAT.dy;   // the bard sits on his log
      Object.assign(B, {sx:x, sy:y, tx:x, ty:y}); if (Math.hypot(B.x - x, B.y - y) > 4){ B.x = x; B.y = y; } }
    if (inStoryNow() || !META || !META.build) return;
    for (const id of Object.keys(META.build)){
      if (!PLOTS[id]) continue; const pl = PLOTS[id], fresh = SITE.walkIn[id] && Date.now() - SITE.walkIn[id] < 60000;   // ordered just now: they walk in from the gate road
      for (const w of workersFor(id)){
        let q = keep.get(w.id);
        if (!q){ const sx = fresh ? 880 + (w.slotI - 1) * 26 : pl[0] + WORK_SPOTS[w.slotI][0], sy = fresh ? CAMP_H + 40 + w.slotI * 22 : pl[1] + WORK_SPOTS[w.slotI][1];
          q = Object.assign(w, {x:sx, y:sy, tx:sx, ty:sy, wait:0, left:false, moving:false, seed:hash(w.id) % 10}); }
        CAMP.people.push(q);
      }
    }
  };
})(campSync);
{ const f = personRole; personRole = q => q.kind === 'worker' ? 'build' : f(q); }
anchorFor = (function(prev){
  return function(q, role){
    if (role === 'build'){ const pl = PLOTS[q.site]; if (!pl) return null; const s = WORK_SPOTS[q.slotI % 3]; q.face = s[2]; return {x:pl[0] + s[0], y:pl[1] + s[1]}; }
    return prev(q, role);
  };
})(anchorFor);
updatePeople = (function(prev){
  return function(){
    prev();
    for (const q of CAMP.people){ if (q.kind !== 'worker') continue;
      if (q.moving){ const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy); if (d > 3){ const st = Math.min(0.9, d - 2); q.x += dx / d * st; q.y += dy / d * st; } }
      else if (SITE.walkIn[q.site]) delete SITE.walkIn[q.site]; }                       // arrived: next time they start on site
  };
})(updatePeople);
openPanel = (function(prev){
  return function(kind, id){
    if (kind === 'person' && String(id).indexOf('wk') === 0){ const q = CAMP.people.find(x => x.id === id); if (q && inBuild(q.site)) return prev('site', q.site); }
    return prev(kind, id);
  };
})(openPanel);
function plotPanelHTML(P){
  const slot = (SITE.map && SITE.map[P.id]) || P.id, L = curLayout();
  const opts = FACILITIES.filter(f => L.plots[f.id] && !has(f.id) && !inBuild(f.id) && (FIXED_SITE.has(slot) ? f.id === slot : !FIXED_SITE.has(f.id)));   /* Index 88: a fixed slot lists only its own facility */
  const cats = [...new Set(opts.map(f => f.cat))];
  let h = `<h2>${FIXED_SITE.has(slot) ? facility(slot).name : 'An Empty Plot'}</h2>
    <div class="desc" style="text-align:left">Choose what to build here. Builders from the town raise it over the seasons (a season passes with every contract); it does nothing until it is finished. Change your mind before the next contract and you get every coin back.</div>
    <div class="desc" style="text-align:left;margin:4px 0"><b>Treasury:</b> ${META.treasury}gp</div>`;
  if (!opts.length) h += `<div class="desc">Everything that can be built is built or under way.</div>`;
  for (const c of cats){
    h += `<h3 style="margin:10px 0 2px;text-align:left">${c}</h3>`;
    for (const f of opts.filter(x => x.cat === c).sort((a, b) => facCost(a) - facCost(b))){
      const need = f.req && !has(f.req) ? facility(f.req) : null, cost = facCost(f), afford = META.treasury >= cost, sn = buildSeasons(f);
      const why = need ? `Needs the ${need.name}${inBuild(f.req) ? ' (being built)' : ''}` : !afford ? `Needs ${cost - META.treasury}gp more` : '';
      h += `<div class="line" style="align-items:flex-start"><img src="${buildingURL(f.id)}" style="${need ? 'opacity:.5;filter:grayscale(.7)' : ''}"><div class="grow"><b>${f.name}</b> · ${cost}gp · ${plural(sn, 'season')}${STAFF_REQ.includes(f.id) ? ' · needs staff' : ''}
        <br><span style="font-size:14px">${f.desc}</span>${why ? `<br><span style="font-size:14px;color:#8b0000">${why}</span>` : ''}</div>
        <button ${need || !afford ? 'disabled' : ''} onclick="startBuild('${f.id}','${slot}')">Build</button></div>`;
    }
  }
  try { const pk = window.CAMP31 && CAMP31.build && CAMP31.build.pick, pf = pk && facility(pk);   /* INT-1 stage 3 group 4: folded in from js/camp/camp-build.js: the panel names the building chosen on the Build screen */
    if (pf && !has(pf.id) && !inBuild(pf.id)) h = h.replace('</h2>', '</h2><div class="desc" style="text-align:left;color:#7a5a14"><b>You chose: ' + esc(pf.name) + '</b> (' + facCost(pf) + 'gp, ' + plural(buildSeasons(pf), 'season') + '). Press Build on it below.</div>'); } catch (e) {}
  return h;
}
function sitePanelHTML(P){
  const f = facility(P.id), b = buildRec(P.id), pct = Math.round(buildProg(P.id) * 100), back = buildRefund(P.id);
  return `<h2>${f.name}</h2><img class="pimg" src="${buildingURL(f.id)}" style="opacity:.75">
    <div class="tag">${f.cat} · Under construction</div>
    <div style="margin:8px 0;height:12px;background:rgba(0,0,0,.25);border:1px solid var(--ink-soft);border-radius:3px"><div style="width:${pct}%;height:100%;background:#7a9a3a;border-radius:2px"></div></div>
    <div class="desc" style="text-align:left"><b>Ready in ${leftText(P.id)}.</b> Three builders from the town are on the site. ${b.need === 1 ? 'A simple building: one season.' : `Tech level ${b.need}: ${b.need} seasons.`}${back === (b.paid || facCost(f)) ? ' Ordered this season: stopping now refunds it all.' : ''}</div>
    <div class="desc" style="text-align:left;margin:6px 0">${f.desc}</div>
    <button class="btn small" onclick="cancelBuild('${f.id}')">STOP WORK (REFUND ${back}GP)</button>`;
}
renderPanel = (function(prev){
  return function(){
    const P = CAMP.panel;
    if (P && (P.kind === 'plot' || (P.kind === 'site' && inBuild(P.id)))){
      $('camp-panel').innerHTML = '<button class="x" onclick="closePanel()" title="Close">&#215;</button>' + (P.kind === 'plot' ? plotPanelHTML(P) : sitePanelHTML(P));
      return;
    }
    if (P && P.kind === 'site') CAMP.panel = {kind:'building', id:P.id};          // finished while the panel was open
    return prev();
  };
})(renderPanel);
/* ===== END INDEX 77 ======================================================= */

/* ============================================================================
   INDEX 78 - THE SCRIBE'S LEDGER: WORKS, FORECASTS, MOVING HOUSE BY HOUSE
   THE LEDGER   The Chapter Scribe (Scribe, Librarian and Historian) now keeps
                a ledger at the top of the Chronicle:
                  - Works: every building going up, with a progress bar and the
                    seasons left;
                  - The coming season: civilian upkeep (and any debt), Hazard
                    Upkeep for a full squad, prisoner upkeep, Merchant income
                    and the pay on the contract board.
                A "Ledger" chip on the top bar shows the short version (works
                under way, upkeep due) and opens the Scribe's scroll.
   THE CHRONICLE   records the works: ground broken (with cost and expected
                seasons), finished, stopped, moved and pulled down. A "Works"
                filter shows only those.
   THE DEBRIEF  after every contract the Scribe reports the works: what is
                finished and how long the rest will take.
   CHANGE YOUR MIND   stopping work in the season it was ordered refunds all of
                it; after that, half (Index 77 already gave half).
   MOVE AND PULL DOWN   a built facility's panel can move it to any empty plot
                (a quarter of its cost, at least 20gp: the town's builders take
                it down and raise it again over the downtime) or pull it down
                (a quarter back as salvage). Not while another building needs
                it, nor while a veteran staffs it. The palisade stays put.
   CAMP KEYS    B build on the nearest empty plot, R roster, P planning table,
                Q quartermaster, H hire, L or C the Scribe's ledger and Chronicle,
                M manual. Hold Alt to see the name of every building, site and
                plot.
   Fix to Index 77: a season passes with every contract (the calendar of
                Index 30), so build times now count seasons on the Chronicle's
                clock; builds already under way are converted.
   SAVED   Chronicle entries of kind 'works'; META.build[id].paid.
   ROLLBACK   Delete from this comment to END INDEX 78.
============================================================================ */

/* ------------------------------------------------- the Chronicle's works --- */
function worksLog(act, id, extra){ try { chron(); chronAdd('works', Object.assign({act, id, name:facility(id).name}, extra || {}), false); } catch (e) {} }
{ const f = chronText;
  chronText = function(e){
    if (e.k !== 'works') return f(e);
    const n = `<b>${esc(e.name)}</b>`;
    return ({start:`Builders break ground on the ${n}${e.cost ? ` (${e.cost}gp)` : ''}.${e.seasons ? ` Expected in ${plural(e.seasons, 'season')}.` : ''}`,
             done:`The ${n} is finished.`,
             stop:`Work on the ${n} is stopped${e.back ? `; ${e.back}gp comes back to the Treasury` : ''}.`,
             move:`The ${n} is taken down and raised again on another plot${e.cost ? ` (${e.cost}gp)` : ''}.`,
             demolish:`The ${n} is pulled down${e.back ? `; ${e.back}gp of timber and stone is sold` : ''}.`})[e.act] || '';
  };
}
CHR_TAG.works = ['Works', '#2a5a6a'];
CHR_FILTERS.splice(4, 0, ['works', 'Works']);
/* INT-1 stage 3 group 4: the chronStats Works spending is folded into js/camp/scribe-bard.js, and the cancelBuild 'stop' log into cancelBuild above */
{ const f = tickBuilds;
  tickBuilds = function(){
    const before = META && META.build ? Object.keys(META.build) : [];
    f();
    for (const id of before) if (!(META.build && META.build[id]) && has(id)) worksLog('done', id);
  };
}

/* ------------------------------------------------------- the forecast --- */
function forecast(){
  const avail = (META.roster || []).filter(p => !(p.resting > 0)).length, n = Math.min(avail, 5);
  const pays = (META.board || []).map(c => c.pay || 0).filter(x => x > 0);
  return {civ:typeof upkeepDue === 'function' ? upkeepDue() : 0, nCiv:typeof upkeepFacilities === 'function' ? upkeepFacilities().length : 0, debt:META.upkeepDebt || 0,
          hazard:Math.round(n * 10 * (perk('dominion', 6) ? 0.5 : 1)), n, prisoners:!has('cells') ? (META.prisoners || []).length * 5 : 0,
          merchant:has('merchant') ? (mastery('merchant') ? 30 : 15) : 0, payMin:pays.length ? Math.min(...pays) : 0, payMax:pays.length ? Math.max(...pays) : 0};
}
function forecastTitle(){
  const F = forecast();
  return `Next contract: civilian upkeep -${F.civ}gp${F.debt ? `, debt ${F.debt}gp` : ''} · Hazard Upkeep up to -${F.hazard}gp${F.prisoners ? ` · prisoners -${F.prisoners}gp` : ''}${F.merchant ? ` · Merchant +${F.merchant}gp` : ''}${F.payMax ? ` · board pays ${F.payMin}-${F.payMax}gp` : ''}. Click for the Scribe's ledger.`;
}
function ledgerHTML(){
  const F = forecast(), S = META.scribe ? META.scribe.name : 'the Scribe', ids = META.build ? Object.keys(META.build) : [];
  const row = (a, b, c) => `<tr><td style="padding:2px 8px 2px 0">${a}</td><td style="padding:2px 8px;text-align:right;white-space:nowrap">${b}</td><td style="padding:2px 0 2px 8px;font-size:14px;color:#5a4a2a">${c || ''}</td></tr>`;
  let works = ids.length ? ids.map(id => { const p = Math.round(buildProg(id) * 100);
    return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="min-width:170px"><b>${esc(facility(id).name)}</b></span>
      <span style="flex:1;height:10px;background:rgba(0,0,0,.15);border:1px solid #8a6d3a;border-radius:3px"><span style="display:block;width:${p}%;height:100%;background:#6a8a3a;border-radius:2px"></span></span>
      <span style="min-width:90px;text-align:right">${leftText(id)}</span></div>`; }).join('')
    : `<div style="font-style:italic;color:#5a4a2a">Nothing is being built. Click an empty plot in camp (or press B) to break ground.</div>`;
  const net = F.merchant - F.civ - F.hazard - F.prisoners - F.debt;
  return `<div style="margin:4px 22px 8px;padding:8px 12px;background:rgba(138,109,58,.12);border:1px solid #b89a5a;border-radius:4px;text-align:left;font:14px Georgia">
    <div style="font:bold 16px Georgia;color:var(--wood);margin-bottom:4px">The Ledger <span style="font:italic 14px Georgia;color:#6a5a3a">kept by ${esc(S)}</span></div>
    <div style="font:bold 14px Georgia;letter-spacing:.5px;color:#2a5a6a;text-transform:uppercase;margin-top:4px">Works</div>${works}
    <div style="font:bold 14px Georgia;letter-spacing:.5px;color:#6a5a1a;text-transform:uppercase;margin-top:8px">The coming season</div>
    <table style="border-collapse:collapse;font:14px Georgia">
      ${row('Civilian staff', `-${F.civ}gp`, F.nCiv ? `${F.nCiv} facilit${F.nCiv === 1 ? 'y' : 'ies'} without a veteran at ${UPKEEP_EACH}gp a season` : 'no facility needs paid staff yet')}
      ${F.debt ? row('Upkeep owed', `-${F.debt}gp`, 'unpaid from last season') : ''}
      ${row('Hazard Upkeep', `up to -${F.hazard}gp`, `10gp for each of ${F.n} Squad Mate${F.n === 1 ? '' : 's'} who comes home`)}
      ${F.prisoners ? row('Prisoner upkeep', `-${F.prisoners}gp`, 'no Prisoner Cells') : ''}
      ${F.merchant ? row('Merchant Stalls', `+${F.merchant}gp`, 'after a paid contract') : ''}
      ${row('<b>Before the pay</b>', `<b>${net >= 0 ? '+' : ''}${net}gp</b>`, F.payMax ? `the board offers ${F.payMin === F.payMax ? F.payMax : F.payMin + '-' + F.payMax}gp, plus salvage` : 'the pay depends on the contract you take')}
    </table></div>`;
}
{ const f = chronicleHTML; chronicleHTML = function(){ const h = f(); try { return h.replace('<div style="padding:2px 22px 6px;', ledgerHTML() + '<div style="padding:2px 22px 6px;'); } catch (e) { return h; } }; }
// The top bar: works under way and upkeep due; click for the scroll.
{ const f = renderTopbar;
  renderTopbar = function(){
    f();
    try {
      if (!META || inStoryNow() || !META.founded) return;
      const tb = $('topbar'), grow = tb && tb.querySelector('.grow'); if (!grow) return;
      const n = META.build ? Object.keys(META.build).length : 0, F = forecast();
      const chip = document.createElement('span'); chip.className = 'stat'; chip.style.cursor = 'pointer'; chip.title = forecastTitle();
      chip.innerHTML = `Ledger: ${n ? `<b>${n}</b> building · ` : ''}upkeep <b>-${F.civ + F.debt}gp</b>`;
      chip.onclick = () => openChronicle();
      tb.insertBefore(chip, grow);
    } catch (e) {}
  };
}
// The debrief: the Scribe reports on the works.
{ const f = endDeployment;
  endDeployment = function(result){
    const d0 = META ? META.deployments : 0; f(result);
    try {
      if (!META || inStoryNow() || !(META.deployments > d0) || !META.build) return;
      const ids = Object.keys(META.build); if (!ids.length) return;
      const done = ids.filter(id => buildLeft(id) <= 0);
      tickBuilds();
      const still = Object.keys(META.build);
      const parts = done.map(id => `<b>${esc(facility(id).name)}</b> is finished`).concat(still.map(id => `${esc(facility(id).name)}: ${leftText(id)} to go`));
      const li = `<p><b>Works</b> (${esc(META.scribe ? META.scribe.name : 'the Scribe')}'s ledger): ${parts.join(' · ')}.</p>`;
      if (renderDebrief.last) renderDebrief(renderDebrief.last.head, renderDebrief.last.lines.concat([li]));
    } catch (e) { console.warn('works report:', e); }
  };
}

/* --------------------------------------------- moving and pulling down --- */
const moveFee = f => Math.max(20, Math.round(facCost(f) * 0.25));
const salvageOf = f => Math.round(facCost(f) * 0.25);
function demolishBlock(id){
  const deps = FACILITIES.filter(x => x.req === id && (has(x.id) || inBuild(x.id)));
  if (deps.length) return `The ${deps.map(d => d.name).join(' and the ')} need${deps.length === 1 && !/s$/.test(deps[0].name) ? 's' : ''} it, so it cannot come down.`;   /* K46: 'The Huts need it' */
  if (staffOf(id)) return `${staffOf(id).name} staffs it; a veteran cannot be turned out.`;
  return '';
}
function beginMove(id){
  const f = facility(id); if (!has(id) || FIXED_SITE.has(id) || META.treasury < moveFee(f)) return;
  closePanel(); CAMP.moving = id;
  campNote(`Click an empty plot to move the ${f.name} there (${moveFee(f)}gp). Click anything else to cancel.`);
}
function doMove(fid, slot){
  const f = facility(fid), fee = moveFee(f);
  if (!slot || FIXED_SITE.has(slot) || !has(fid) || META.treasury < fee) return;
  META.treasury -= fee; META.sites = META.sites || {};
  for (const k in META.sites) if (META.sites[k] === slot && !has(k) && !inBuild(k)) delete META.sites[k];
  META.sites[fid] = slot; applySites(); saveMeta();
  worksLog('move', fid, {cost:fee});
  try { refreshUI(); } catch (e) {}
  if (PLOTS[fid]) CAMP.fx.push({x:PLOTS[fid][0], y:PLOTS[fid][1], life:70});
  SFX.play('win'); campNote(`The town's builders take the ${f.name} down and raise it again on its new plot.`);
}
function askDemolish(id){
  const f = facility(id), why = demolishBlock(id); if (!has(id) || why) return;
  askConfirm(`Pull down the ${f.name}?`, `It stops working at once. The timber and stone sell for <b>${salvageOf(f)}gp</b>. Building it again costs the full price and takes ${plural(buildSeasons(f), 'season')}.`, () => doDemolish(id));
}
function doDemolish(id){
  const f = facility(id); if (!has(id) || demolishBlock(id)) return;
  const back = salvageOf(f);
  delete META.facilities[id]; if (META.damaged) delete META.damaged[id]; if (META.sites) delete META.sites[id];
  META.treasury += back; applySites(); saveMeta();
  worksLog('demolish', id, {back});
  closePanel(); try { refreshUI(); } catch (e) {}
  campNote(`The ${f.name} comes down. ${back}gp of salvage goes to the Treasury.`);
}
renderPanel = (function(prev){
  return function(){
    prev();
    try {
      const P = CAMP.panel; if (!P || P.kind !== 'building' || !has(P.id) || !PLOTS[P.id] || !curLayout().plots[P.id]) return;
      const f = facility(P.id), fee = moveFee(f), why = demolishBlock(P.id);
      const h = `<div style="margin-top:10px;border-top:1px solid rgba(74,59,42,.4);padding-top:6px;text-align:left"><b>Works</b><br>
        ${FIXED_SITE.has(P.id) ? '' : `<button class="btn small" ${META.treasury >= fee ? '' : `disabled title="${esc(`Moving costs ${fee}gp; the Treasury holds ${META.treasury}gp.`)}"`} onclick="beginMove('${P.id}')">MOVE TO ANOTHER PLOT (${fee}GP)</button>`}
        <button class="btn small" ${why ? `disabled title="${esc(why)}"` : ''} onclick="askDemolish('${P.id}')">PULL DOWN (+${salvageOf(f)}GP)</button>
        </div>`;   /* K46: a dead button carries its reason as a title; UX's ux-why prints it under the button */
      $('camp-panel').insertAdjacentHTML('beforeend', h);
    } catch (e) {}
  };
})(renderPanel);
openPanel = (function(prev){
  return function(kind, id){
    if (CAMP.moving){ const mv = CAMP.moving; CAMP.moving = null;
      if (kind === 'plot'){ const slot = SITE.map && SITE.map[id]; if (slot && !FIXED_SITE.has(slot)) return doMove(mv, slot); }
      campNote('Move cancelled.'); }
    return prev(kind, id);
  };
})(openPanel);
closePanel = (function(prev){ return function(){ if (CAMP.moving){ CAMP.moving = null; campNote('Move cancelled.'); } return prev(); }; })(closePanel);

/* ---------------------------------------------- camp keys and Alt labels --- */
const KEYS78 = {alt:false};
function nearestPlot(){
  const L = META.leader && CAMP.people.find(q => q.kind === 'leader'), cx = L ? L.x : CAMP.cam.x + VW / 2, cy = L ? L.y : CAMP.cam.y + VH / 2;
  let best = null, bd = 1e9; for (const o of campObjects()) if (o.kind === 'plot' && !FIXED_SITE.has(o.id)){   /* Index 88 */ const d = Math.hypot(o.x - cx, o.y - cy); if (d < bd){ bd = d; best = o; } }
  return best;
}
window.addEventListener('keydown', e => {
  if (e.key === 'Alt'){ KEYS78.alt = true; e.preventDefault(); return; }
  if (G || !CAMP.on || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
  if (typeof ASK !== 'undefined' && ASK) return;
  const chr = $('chronicle'); if (chr && chr.style.display !== 'none') return;
  if (campOverlayOpen() || !$('screen-title').classList.contains('hidden') /* Index 81: not from the title screen */ || (typeof inStoryNow === 'function' && inStoryNow())) return;
  const k = e.key.toLowerCase(), L = !!META.leader;
  const act = {r:() => L && openRoster(), p:() => L && openTable(), q:() => openCamp(), h:() => { if (L){ centreCamOn(HUB.fire.x, HUB.fire.y); openPanel('fire', 'fire'); } },
    l:() => openScribeBook('chronicle'), c:() => openScribeBook('chronicle'), m:() => openScribeBook('manual'),
    b:() => { const o = nearestPlot(); if (o){ centreCamOn(o.x, o.y); openPanel('plot', o.id); } }}[k];
  if (act){ act(); SFX.play('pick'); }
});
window.addEventListener('keyup', e => { if (e.key === 'Alt'){ KEYS78.alt = false; e.preventDefault(); } });
window.addEventListener('blur', () => { KEYS78.alt = false; });
function campOverlays78(){
  const mv = CAMP.moving, alt = KEYS78.alt; if (!mv && !alt) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-Math.round(CAMP.cam.x), -Math.round(CAMP.cam.y));
  for (const o of campObjects()){
    if (mv && o.kind === 'plot' && !FIXED_SITE.has(o.id)){   /* Index 88 */ const a = 0.5 + 0.35 * Math.sin(CAMP.t / 8);
      ctx.strokeStyle = `rgba(255,216,96,${a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(o.x, o.y - 10, 60, 27, 0, 0, TAU); ctx.stroke(); }
    if (alt){
      if (o.kind === 'building') campLabel(o.x, o.y - o.img.height * BSCALE * 0.9, facility(o.id).name, staffOf(o.id) ? 'Staffed by ' + staffOf(o.id).name : upkeepLabel(o.id));
      else if (o.kind === 'site') campLabel(o.x, o.y - 60, facility(o.id).name, 'Building: ' + leftText(o.id));
      else if (o.kind === 'plot') campLabel(o.x, o.y - 60, FIXED_SITE.has(o.id) ? facility(o.id).name : 'Empty plot', FIXED_SITE.has(o.id) ? 'Fixed plot' : 'B to build');   /* Index 88 */
      else if (o.kind === 'house') campLabel(o.x, o.y - 120, HS().house, 'Planning table (P)');
      else if (o.kind === 'wagon') campLabel(o.x, o.y - 80, HS().qm, 'Squad gear (Q)');
    }
  }
  ctx.restore();
}
{ const f = drawCamp; drawCamp = function(){ const r = f.apply(this, arguments); try { if (!G && !inStoryNow()) campOverlays78(); } catch (e) {} return r; }; }
{ const f = startCamp; startCamp = function(){ try { tickBuilds(); } catch (e) {} return f.apply(this, arguments); }; }   // the camp keys line is late-fixes hint81's
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx78')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx78"><b>Building and the Scribe's ledger.</b> Click any empty plot (or press B) to choose a building. It takes 1 to 3 seasons to build (a season passes with every contract) and does nothing until finished; stop work in the season you ordered it for a full refund, later for half. A built facility can be moved to another plot for a quarter of its cost, or pulled down for a quarter back. The Scribe's Chronicle opens with the Ledger: works under way and what the coming season will cost. Camp keys: B build, R roster, P planning table, Q quartermaster, H hire, L ledger, M manual; hold Alt to name everything.</p>`);
  };
}
window.QOL_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      ok('buildSeasons returns 1..3 for known facilities', ['palisade', 'barracks', 'command'].every(id => { const s = buildSeasons(id); return s >= 1 && s <= 3; }));
      ok('startBuild and tickBuilds are functions', typeof startBuild === 'function' && typeof tickBuilds === 'function');
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
/* ===== END INDEX 78 ======================================================= */

