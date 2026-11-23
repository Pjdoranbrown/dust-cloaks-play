/* js/3d/maps.js (INT-1 step 2, 2026-11-16): INDEX 70 to 76 (3D contract maps, playtest fixes, replacement audit, movement).
   Cut unchanged from the inline script in index.html (old lines 23385 to 24312). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 70 - 3D CONTRACT MAPS
   With "3D world" on, the contract maps match the 3D world:
     GROUND DRESSING  3D rocks, bushes, grass tufts, flowers and stumps scattered
                      on open ground; weathered stones on rubble; broken columns
                      and fallen blocks where rubble meets old walls (ruins). The
                      same cell always gets the same piece, and they follow the
                      seasons.
     OBJECTIVES       strongboxes (shut, and open with the gold showing), the
                      cages on Rescue (with a captive inside, then the door swung
                      open), strongroom vaults, signal beacons (cold, then lit
                      with a 3D fire), the relic on its plinth, enemy camp
                      banners and the green exit banner.
     THE CARAVAN      the 3D covered wagon pulled by a 3D horse, facing the way
                      it travels; it flashes when hit.
     RAIDS            the four gates are 3D timber gates with iron bands (they
                      fall into broken planks when breached); the facilities in a
                      raid are the camp's own 3D buildings in the holding's style,
                      showing damage below half health and burnt out at zero.
     THE BAR FIGHT    the tavern: a long bar with bottle shelves and kegs behind
                      it, tables with stools and tankards, and oak doors.
     (Nests and siege engines were already 3D.)
   FOG OF WAR  Fixed things (trees, strongboxes, vaults, camps, cages, beacons,
               the relic and the ground dressing) are now drawn only on ground
               you have explored, so a tall tree or banner standing in the black
               can no longer poke its top into view. Moving things (enemies,
               hounds) still show only while someone can see them.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 70 and
   undo the patches marked "Index 70".

   3D DESIGN NOTE: WORLD, ADDENDUM
     MAP PROPS  w3dMapProp(kind, x, groundLine, o) draws a world kind on a
                contract map; o.scale shrinks or grows it (raid facilities are
                drawn at 0.64 of their camp size, like their pixel art), o.view
                turns it, o.flash whitens it. Returns false (pixel fallback)
                when "3D world" is off or the frames are not ready.
     FOG        wSeen(o) is true when the rts fog is off or o's cell has been
                explored. Every fixed map object must check it before drawing.
     DRESSING   mapDressing(x0, y0, x1, y1) returns the dressing for the cells
                in view, from a hash of each cell, so nothing is stored.
     INDOOR     Kinds named tv_* (the tavern) are indoors, like the warehouse.
============================================================================ */
const wSeen = o => !(G && G.rtsFog) || seenXY(o.x, o.y);
function w3dMapProp(kind, x, gl, o = {}){
  if (!W3D_KINDS[kind]) return false;
  const s0 = W3D.S; if (o.scale) W3D.S = s0 * o.scale;
  let ok = false;
  try {
    if (o.flash){ ctx.save(); ctx.filter = 'brightness(2.2)'; }
    ok = w3dDraw(kind, x, gl, {view:o.view, t:o.t, alpha:o.alpha});
    if (o.flash) ctx.restore();
  } finally { W3D.S = s0; }
  return ok;
}
const MPK = (frame, build, extra) => Object.assign({frame, view:2.3, keep:0.7, clip:'still', build}, extra || {});
Object.assign(W3D_KINDS, {
  m_chest:MPK([60, 50, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 7, 0], r:[14, 7, 9], z:'chestW'}, {t:'box', c:[0, 15.5, 0], r:[14.4, 2.4, 9.4], z:'chestL'}, {t:'ell', c:[0, 17.5, 0], r:[14, 2.6, 9], z:'chestL'}]);
    for (const x of [-9, 9]) add([{t:'box', c:[x, 10, 0], r:[1.4, 10, 9.6], z:'iron'}]);
    add([{t:'box', c:[0, 12, 9.4], r:[2.4, 3, 0.6], z:'gold'}, {t:'ell', c:[0, 11.4, 10], r:[0.7, 0.7, 0.4], z:'iron'}]);
    return {parts:P, zones:SKZ(se, null, {chestW:'#7a4a22', chestL:'#8a5a2a'})}; }),
  m_chest_open:MPK([60, 60, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 7, 0], r:[14, 7, 9], z:'chestW'}, {t:'box', c:[0, 14.4, 0], r:[13, 0.8, 8], z:'tentIn'}, {t:'box', c:[0, 22, -9.6], r:[14.4, 9, 2], rot:[-0.25, 0, 0], z:'chestL'}]);
    for (const x of [-9, 9]) add([{t:'box', c:[x, 7, 0], r:[1.4, 7, 9.6], z:'iron'}]);
    for (let k = 0; k < 7; k++) add([{t:'ell', c:[-9 + k * 3, 14.6 + (k % 2), (k % 3 - 1) * 3], r:[2, 1, 2], z:'gold'}]);
    return {parts:P, zones:SKZ(se, null, {chestW:'#7a4a22', chestL:'#8a5a2a'})}; }),
  m_cage:MPK([70, 80, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[17, 2, 13], z:'wood'}, {t:'box', c:[0, 36, 0], r:[17.6, 1.6, 13.6], z:'iron'}]);
    for (let x = -15; x <= 15; x += 5) for (const z of [-12.6, 12.6]) add([{t:'cap', a:[x, 3, z], p:[x, 35, z], r:0.7, z:'bar'}]);
    for (let z = -10; z <= 10; z += 5) for (const x of [-16.6, 16.6]) add([{t:'cap', a:[x, 3, z], p:[x, 35, z], r:0.7, z:'bar'}]);
    add([{t:'cap', a:[0, 4, 0], p:[0, 17, 0], r:3.6, z:'captC'}, {t:'ell', c:[0, 21.4, 0.6], r:[3, 3.4, 3], z:'skinC'}, {t:'ell', c:[0, 23.4, -0.6], r:[3.1, 2, 3.1], z:'hairC'}]);
    add([{t:'box', c:[17.6, 20, 0], r:[0.8, 3, 1.6], z:'iron'}]);
    return {parts:P, zones:SKZ(se, null, {bar:'#9aa0a8', captC:'#6b5a42', skinC:'#d9a07a', hairC:'#3a2414'}), keepZones:['bar', 'skinC']}; }),
  m_cage_open:MPK([90, 80, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[17, 2, 13], z:'wood'}, {t:'box', c:[0, 36, 0], r:[17.6, 1.6, 13.6], z:'iron'}]);
    for (let x = -15; x <= 15; x += 5) add([{t:'cap', a:[x, 3, -12.6], p:[x, 35, -12.6], r:0.7, z:'bar'}]);
    for (let z = -10; z <= 10; z += 5) add([{t:'cap', a:[-16.6, 3, z], p:[-16.6, 35, z], r:0.7, z:'bar'}]);
    for (const x of [-15, -10]) add([{t:'cap', a:[x, 3, 12.6], p:[x, 35, 12.6], r:0.7, z:'bar'}]);
    for (let k = 0; k < 5; k++) add([{t:'cap', a:[16.6 + k * 3.4, 3, 13 + k * 2], p:[16.6 + k * 3.4, 35, 13 + k * 2], r:0.7, z:'bar'}]);
    return {parts:P, zones:SKZ(se, null, {bar:'#9aa0a8'}), keepZones:['bar']}; }),
  m_vault:MPK([80, 70, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[22, 2, 15], z:'stoneD'}, {t:'box', c:[0, 18, 0], r:[20, 14, 13], z:'vaultS'}, {t:'box', c:[0, 33, 0], r:[21, 1.6, 14], z:'iron'}]);
    for (const x of [-12, 0, 12]) add([{t:'box', c:[x, 18, 13.2], r:[0.6, 14, 0.5], z:'iron'}]);
    add([{t:'box', c:[0, 15, 13.4], r:[9, 9, 0.6], z:'iron'}, {t:'ell', c:[0, 15, 14.2], r:[3, 3, 0.6], z:'gold'}]);
    for (const x of [-16, -6, 6, 16]) add([{t:'ell', c:[x, 29, 13.6], r:[0.8, 0.8, 0.4], z:'metal'}]);
    return {parts:P, zones:SKZ(se, null, {vaultS:'#5f6870'})}; }),
  m_vault_open:MPK([90, 70, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[22, 2, 15], z:'stoneD'}, {t:'box', c:[0, 18, 0], r:[20, 14, 13], z:'vaultS'}, {t:'box', c:[0, 33, 0], r:[21, 1.6, 14], z:'iron'}, {t:'box', c:[0, 15, 13.2], r:[9, 9, 0.6], z:'tentIn'}]);
    add([{t:'box', c:[14, 15, 20], r:[9, 9, 0.6], rot:[0, -1.2, 0], z:'iron'}]);
    for (let k = 0; k < 5; k++) add([{t:'ell', c:[-6 + k * 3, 8 + (k % 2) * 2, 12], r:[2, 1.2, 1.6], z:'gold'}]);
    return {parts:P, zones:SKZ(se, null, {vaultS:'#5f6870'})}; }),
  m_beacon:MPK([80, 110, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 3, 0], r:[22, 3, 14], z:'stoneD'}]); for (let y = 6; y < 54; y += 8) add([{t:'box', c:[0, y + 4, 0], r:[7 - (y > 40 ? 1 : 0), 4, 7], z:(y / 8) % 2 ? 'stone' : 'stoneL'}]);
    add([{t:'ell', c:[0, 58, 0], r:[16, 4, 12], z:'iron'}, {t:'ell', c:[0, 61, 0], r:[13, 1, 10], z:'ash'}]);
    for (const a of [0.5, 2.1, 3.7, 5.3]) add([{t:'cap', a:[Math.cos(a) * 15, 56, Math.sin(a) * 11], p:[Math.cos(a) * 17, 64, Math.sin(a) * 13], r:0.8, z:'iron'}]);
    for (const [a, b] of [[[-9, 62, -4], [8, 66, 5]], [[-8, 62, 5], [9, 65, -4]], [[0, 62, -7], [1, 67, 7]]]) add([{t:'cap', a, p:b, r:1.8, z:'wood'}]);
    return {parts:P, zones:SKZ(se, null, {ash:'#3a3230'})}; }),
  m_banner:MPK([70, 120, 6], se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 2, 0], r:[8, 2.4, 6], z:'stoneD'}, {t:'cap', a:[0, 0, 0], p:[0, 70, 0], r:1.6, z:'wood'}, {t:'ell', c:[0, 71, 0], r:[2.2, 2.2, 2.2], z:'gold'}, {t:'box', c:[0, 66, 0], r:[1, 1, 12], z:'woodD'}]);
    add([{t:'box', c:[11, 52, 0], r:[10, 13, 0.6], z:'flag'}, {t:'box', c:[11, 38, 0], r:[10, 1.6, 0.7], z:'flagD'}]);
    for (const x of [4, 11, 18]) add([{t:'box', c:[x, 36, 0], r:[2, 2, 0.6], z:'flag'}]);
    return {parts:P, zones:SKZ(se, null, {flag:'#8a1a1a', flagD:'#5a1010'}), keepZones:['flag']}; }),
  m_relic:MPK([60, 70, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 4, 0], r:[11, 4, 8], z:'stone'}, {t:'box', c:[0, 9, 0], r:[8, 1.4, 6], z:'stoneL'}]);
    add([{t:'box', c:[0, 15, 0], r:[7, 5, 4.4], z:'gold'}, {t:'ell', c:[0, 21, 0], r:[6, 2.6, 4], z:'gold'}, {t:'ell', c:[0, 24.4, 0], r:[1.6, 1.6, 1.6], z:'orb'}, {t:'box', c:[0, 15, 4.6], r:[2, 2.6, 0.4], z:'orb'}]);
    return {parts:P, zones:SKZ(se, null, {orb:'#9fd0ff'}), keepZones:['gold']}; }),
  m_ruinstone:MPK([60, 40, 4], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 4, 0], r:[8, 4, 6], rot:[0, 0.4, 0.15], z:'ruin'}, {t:'box', c:[9, 2.6, 5], r:[4, 2.6, 3.4], rot:[0, -0.3, 0], z:'ruinL'}, {t:'ell', c:[-8, 2, 5], r:[4, 2, 3], z:'ruinM'}]);
    return {parts:P, zones:SKZ(se, null, {ruin:'#8a887a', ruinL:'#a4a090', ruinM:'#6e7656'})}; }, {mirror:true}),
  m_column:MPK([70, 90, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 3, 0], r:[10, 3, 10], z:'ruinD'}]); for (let y = 6; y < 40; y += 7) add([{t:'cap', a:[0, y, 0], p:[0, y + 6, 0], r:6.4, z:(y / 7 | 0) % 2 ? 'ruin' : 'ruinL'}]);
    add([{t:'box', c:[1, 42, 0], r:[6, 2, 6], rot:[0.2, 0, 0.3], z:'ruinL'}, {t:'cap', a:[10, 4, 10], p:[30, 6, 16], r:5.6, z:'ruin'}, {t:'ell', c:[0, 30, 6.2], r:[3, 6, 1], z:'ruinM'}]);
    if (se === 'winter') add([{t:'ell', c:[1, 44.6, 0], r:[5.4, 1.4, 5.4], z:'snow'}, {t:'ell', c:[20, 10, 13], r:[9, 1.6, 4], z:'snow'}, {t:'ell', c:[-4, 1, 10], r:[10, 1.2, 4], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {ruin:'#8a887a', ruinL:'#a4a090', ruinD:'#5e5c54', ruinM:'#6e7656'})}; }, {mirror:true, seasonPass:false}),
  m_gate:MPK([110, 110, 6], se => { const P = [], add = wAdd(P);
    for (const sx of [-1, 1]) add([{t:'cap', a:[sx * 38, 0, 0], p:[sx * 38, 60, 0], r:4, z:'wood'}, {t:'ell', c:[sx * 38, 62, 0], r:[3.4, 4.6, 3.4], z:'woodL'}]);
    add([{t:'box', c:[0, 52, 0], r:[42, 3, 3.4], z:'woodD'}]);
    for (const sx of [-1, 1]){ for (let k = 0; k < 4; k++) add([{t:'box', c:[sx * (4 + k * 8.4), 24, 1], r:[4, 24, 1.6], z:k % 2 ? 'gateW' : 'wood'}]);
      for (const y of [10, 36]) add([{t:'box', c:[sx * 17, y, 2.8], r:[16, 1.2, 0.6], z:'iron'}]); add([{t:'ell', c:[sx * 3, 24, 3], r:[1.2, 1.2, 0.6], z:'metal'}]); }
    return {parts:P, zones:SKZ(se, null, {gateW:'#6a4a2a'})}; }),
  m_gate_broken:MPK([110, 70, 6], se => { const P = [], add = wAdd(P);
    for (const sx of [-1, 1]) add([{t:'cap', a:[sx * 38, 0, 0], p:[sx * 38, 30 + sx * 6, 0], r:4, z:'char'}]);
    for (let k = 0; k < 7; k++) add([{t:'box', c:[(k - 3) * 9, 1.2 + (k % 2), 6 + (k % 3) * 4], r:[4, 1.2, 14], rot:[0, (k - 3) * 0.3, 0.1], z:k % 2 ? 'gateW' : 'char'}]);
    add([{t:'box', c:[-8, 2.4, 12], r:[14, 0.6, 0.8], rot:[0, 0.5, 0], z:'iron'}]);
    return {parts:P, zones:SKZ(se, null, {gateW:'#6a4a2a', char:'#2a2420'})}; }),
  tv_counter:MPK([600, 120, 6], se => { const P = [], add = wAdd(P), W = 278;
    add([{t:'box', c:[0, 15, 6], r:[W, 15, 10], z:'barW'}, {t:'box', c:[0, 31, 6], r:[W + 3, 1.6, 12], z:'barTop'}]);
    for (let x = -W + 14; x < W; x += 28) add([{t:'box', c:[x, 15, 16.2], r:[0.8, 14, 0.4], z:'barD'}]);
    add([{t:'box', c:[0, 30, -16], r:[W, 30, 3], z:'shelfW'}]);
    for (const y of [26, 42, 56]){ add([{t:'box', c:[0, y, -12], r:[W, 1, 4], z:'barTop'}]);
      for (let x = -W + 8; x < W; x += 9){ const c = ['bot1', 'bot2', 'bot3', 'bot4'][Math.abs(Math.round(x / 9 + y)) % 4]; add([{t:'cap', a:[x, y + 1, -12], p:[x, y + 6, -12], r:1.6, z:c}]); } }
    for (const x of [-W + 30, -W + 50, W - 50]) add([{t:'ell', c:[x, 7, -6], r:[7, 7, 6], rot:[0, 0, Math.PI / 2], z:'wood'}, {t:'ell', c:[x, 7, -0.4], r:[2, 2, 0.8], z:'iron'}]);
    for (let x = -W + 30; x < W - 20; x += 60) add([{t:'cap', a:[x, 33, 8], p:[x, 39, 8], r:2.2, z:'pewter'}, {t:'ell', c:[x, 39.6, 8], r:[2.2, 0.6, 2.2], z:'foam'}]);
    return {parts:P, zones:SKZ(se, null, {barW:'#6a4422', barD:'#3a2410', barTop:'#8a5a2b', shelfW:'#4a2e16', bot1:'#4a8a3a', bot2:'#8a2a2a', bot3:'#3a5a8a', bot4:'#c8a040', pewter:'#9a9a94', foam:'#f4ecd8'}),
      keepZones:['bot1', 'bot2', 'bot3', 'bot4', 'foam']}; }),
  tv_table:MPK([120, 70, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 14, 0], r:[38, 1.6, 15], z:'barTop'}]); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add([{t:'box', c:[sx * 33, 6.4, sz * 11], r:[1.6, 6.4, 1.6], z:'barD'}]);
    for (const [x, z] of [[-28, 22], [0, 22], [28, 22], [-28, -22], [28, -22]]) add([{t:'cap', a:[x, 0, z], p:[x, 7, z], r:3.4, z:'barW'}, {t:'ell', c:[x, 7.4, z], r:[4, 0.8, 4], z:'barTop'}]);
    for (const [x, z] of [[-14, 4], [14, -4]]) add([{t:'cap', a:[x, 15.6, z], p:[x, 21, z], r:2, z:'pewter'}, {t:'ell', c:[x, 21.6, z], r:[2, 0.6, 2], z:'foam'}]);
    add([{t:'ell', c:[0, 16.4, 2], r:[4, 1, 3], z:'bread'}]);
    return {parts:P, zones:SKZ(se, null, {barW:'#6a4422', barD:'#3a2410', barTop:'#8a5a2b', pewter:'#9a9a94', foam:'#f4ecd8', bread:'#c89a50'}), keepZones:['foam']}; }),
  tv_door:MPK([60, 70, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 19, 0], r:[16, 19, 2], z:'stoneD'}, {t:'box', c:[0, 17.5, 1.6], r:[13, 17.5, 1], z:'oak'}]);
    for (const x of [-6, 0, 6]) add([{t:'box', c:[x, 17.5, 2.7], r:[0.5, 17.5, 0.3], z:'barD'}]);
    for (const y of [7, 28]) add([{t:'box', c:[0, y, 2.8], r:[13, 1, 0.4], z:'iron'}]); add([{t:'ell', c:[8, 17, 3.2], r:[1.4, 1.4, 0.8], z:'iron'}]);
    return {parts:P, zones:SKZ(se, null, {oak:'#5a3a1a', barD:'#3a2410'})}; })
});
W3D_KINDS.m_beacon_lit = Object.assign({}, W3D_KINDS.m_beacon, {clip:'flicker', build:se => { const o = W3D_KINDS.m_beacon.build(se);
  o.bones = {flame:{parent:'root', off:[0, 62, 0]}};
  for (const q of [{t:'ell', c:[0, 72, 0], r:[11, 12, 9], z:'flame'}, {t:'ell', c:[1, 82, 0], r:[7, 11, 6], z:'flame2'}, {t:'ell', c:[-3, 90, 1], r:[3, 6, 3], z:'flame2'}, {t:'ell', c:[0, 63, 0], r:[12, 2, 9], z:'ember'}]) o.parts.push(Object.assign({b:'flame'}, q));
  Object.assign(o.zones, {flame:'#ff9a30', flame2:'#ffd860', ember:'#ff7a2a'}); return o; }});
W3D_KINDS.m_banner_done = Object.assign({}, W3D_KINDS.m_banner, {build:se => { const o = W3D_KINDS.m_banner.build(se); Object.assign(o.zones, {flag:'#5a5a5a', flagD:'#3a3a3a'}); return o; }});
W3D_KINDS.m_banner_exit = Object.assign({}, W3D_KINDS.m_banner, {build:se => { const o = W3D_KINDS.m_banner.build(se); Object.assign(o.zones, {flag:'#3a8a4a', flagD:'#245a30'}); return o; }});

/* -------------------------------------------------------- dressing --- */
function cellHash(x, y){ let h = Math.imul(x * 374761393 + y * 668265263 ^ (MAP.seed || 7) * 2246822519, 1274126177); h ^= h >>> 13; return (Math.imul(h, 1103515245) >>> 0); }
function mapDressing(x0, y0, x1, y1){
  const out = [], g = MAP.g, w = MAP.w;
  const nearWall = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const t = g[(y + dy) * w + x + dx]; return t === T.STONE || t === T.WALL; });
  for (let y = Math.max(1, y0); y <= Math.min(MAP.h - 2, y1); y++) for (let x = Math.max(1, x0); x <= Math.min(w - 2, x1); x++){
    const t = g[y * w + x], h = cellHash(x, y), jx = ((h >> 4) % 24) - 12, jy = ((h >> 9) % 16) - 8, px = (x + 0.5) * CELL + jx, py = (y + 0.5) * CELL + jy;
    if (t === T.GRASS){ const r = h % 100; if (r < 4) out.push({x:px, y:py, k:['dc_tuft', 'dc_flowers', 'dc_rock', 'dc_bush', 'dc_stump', 'dc_tuft', 'dc_rock'][(h >> 14) % 7], h}); }
    else if (t === T.RUBBLE){ if (nearWall(x, y) && h % 5 === 0) out.push({x:px, y:py, k:'m_column', h}); else if (h % 3 === 0) out.push({x:px, y:py, k:'m_ruinstone', h}); }
    else if (t === T.FOREST){ if (h % 9 === 0) out.push({x:px, y:py, k:(h >> 6) % 2 ? 'dc_bush' : 'dc_stump', h}); }
  }
  return out;
}
contractBodies = (function(prev){
  return function(bodies, onScreen){
    prev(bodies, onScreen);
    if (!G || !MAP || isBrawl()) return;
    const L = G.leader, x0 = Math.floor((L.x - VW / 2) / CELL) - 1, x1 = Math.ceil((L.x + VW / 2) / CELL) + 1, y0 = Math.floor((L.y - VH / 2 - camDY()) / CELL) - 1, y1 = Math.ceil((L.y + VH / 2 - camDY()) / CELL) + 3;
    for (const d of mapDressing(x0, y0, x1, y1)) if (wSeen(d)) bodies.push({y:d.y, custom:() => w3dMapProp(d.k, d.x, d.y + 3, {view:(d.h >> 3) % 2 ? 2.3 : 1.7, t:G.frame + (d.h % 88)})});
  };
})(contractBodies);

/* ----------------------------------------------------- the bar fight --- */
brawlBodies = (function(prev){
  return function(bodies, onScreen){
    for (const a of G.ales) if (onScreen(a)) bodies.push({y:a.y, custom:() => { ctx.fillStyle = 'rgba(255,220,120,' + (0.18 + Math.sin(G.frame / 8) * 0.08) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, TAU); ctx.fill(); if (!w3dMapProp('tv_ale', a.x, a.y + 4)){ PROPS3D.blob(a.x, a.y - 8, 6, 8, '#c8a040'); }   /* S6-C 3a step 4: no pixel mug while the 3D one bakes */ }});   /* Index 76 */
    bodies.push({y:2.9 * CELL, custom:() => { if (!w3dMapProp('tv_counter', 13 * CELL, 3 * CELL + 2)){ ctx.fillStyle = '#6a4422'; ctx.fillRect(6 * CELL, 2 * CELL, 14 * CELL, 40); }
      drawStub(BARKEEP_OWN, 0, barkeepSprite(), 12.5 * CELL, 1.6 * CELL, 2.5, 0, false, false); }});   /* Index 74 */
    for (const t of MAP.tables) bodies.push({y:(t.y + 0.9) * CELL, custom:() => { if (window.TAVDEPTH44 !== false){ ctx.save(); const tg = ctx.createRadialGradient((t.x + 1) * CELL, (t.y + 1) * CELL + 8, 6, (t.x + 1) * CELL, (t.y + 1) * CELL + 8, CELL * 1.25); tg.addColorStop(0, 'rgba(0,0,0,.4)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.translate((t.x + 1) * CELL, (t.y + 1) * CELL + 8); ctx.scale(1, 0.4); ctx.translate(-(t.x + 1) * CELL, -((t.y + 1) * CELL + 8)); ctx.fillRect((t.x - 0.4) * CELL, (t.y + 1) * CELL + 8 - CELL * 1.3, 2.8 * CELL, CELL * 2.6); ctx.restore(); }   /* F-44 (k): a soft floor shadow grounds the table */ if (!w3dMapProp('tv_table', (t.x + 1) * CELL, (t.y + 1) * CELL + 2)){ ctx.fillStyle = '#6a4422'; ctx.fillRect(t.x * CELL, t.y * CELL, 2 * CELL, 40); } }});
    for (const d of MAP.doors) bodies.push({y:d.y - 30, custom:() => { const side = 2;
      if (!w3dMapProp('tv_door', d.x, d.y + 18, {view:side})){ ctx.fillStyle = '#3a2410'; ctx.fillRect(d.x - 18, d.y - 22, 36, 40); } }});
  };
})(brawlBodies);

/* ------------------------------------------------------------ raids --- */
function raidFacKind(id){
  const hk = holdKey(); let k = null;
  if (hk === 'barge' || hk === 'warehouse') k = skinKind2(hk, id);
  else { k = W3D_FAC[id]; if (k && hk === 'waystation') k = ruinKind(k); }
  return k && W3D_KINDS[k] ? k : null;
}
raidBodies = (function(prev){
  return function(bodies, onScreen){
    const gates = G.gates, facs = G.facs; G.gates = []; G.facs = [];
    try { prev(bodies, onScreen); } finally { G.gates = gates; G.facs = facs; }
    const bar = (t, w, col, top) => { ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(t.x - w / 2 - 1, top, w + 2, 7); ctx.fillStyle = t.hp > t.maxHp * 0.35 ? col : '#e0503a'; ctx.fillRect(t.x - w / 2, top + 1, w * Math.max(0, t.hp / t.maxHp), 5); };
    for (const g of (gates || [])) if (onScreen(g, 90)) bodies.push({y:g.y + 10, custom:() => {
      const vert = Math.abs(g.nx) > 0.5, gl = g.y + (vert ? 28 : 6);
      const ok = w3dMapProp(g.hp > 0 ? 'm_gate' : 'm_gate_broken', g.x, gl, {view:vert ? 0 : 2, flash:g.flash > 0});
      if (!ok){ ctx.fillStyle = '#6a4a28'; if (vert) ctx.fillRect(g.x - 9, g.y - 44, 18, 72); else ctx.fillRect(g.x - 40, g.y - 24, 80, 30); }
      if (g.hp > 0){ bar(g, 60, '#d4af37', g.y - 74); ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('GATE', g.x, g.y - 78); } }});
    for (const t of (facs || [])) if (onScreen(t, 90)) bodies.push({y:t.y + 8, custom:() => {
      const k = raidFacKind(t.id); let ok = false;
      if (k){ ctx.save(); if (t.hp <= 0) ctx.filter = 'grayscale(1) brightness(.55)';
        ok = w3dMapProp(t.hp < t.maxHp * 0.5 ? wDmg(k) : k, t.x, t.y + 14, {scale:0.64, flash:t.flash > 0 && t.hp > 0}); ctx.restore(); }
      if (!ok){ const img = facilityCanvas(t.id), s = 2.1, w = img.width * s, h = img.height * s; ctx.drawImage(img, t.x - w / 2, t.y - h + 14, w, h); }
      if (t.hp < t.maxHp * 0.5 && G.frame % 9 === 0) G.fx.push({x:t.x + rnd(-18, 18), y:t.y - 30, vx:rnd(-.3, .3), vy:-1.1, life:36, c:'#9a8a7a', px:3});
      bar(t, 56, '#6fd37a', t.y - 66); ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText(facility(t.id).name.toUpperCase(), t.x, t.y - 70); }});
  };
})(raidBodies);

/* -------------------------------------------------------- the caravan --- */
function w3dCaravan(w){
  const fwd = w.left ? -1 : 1;
  const rec = r3qRecipe('horse:riding'), hx = w.x + fwd * 66, St = R3D_STYLES[r3dStyleId() || 'crisp'];
  const ok1 = r3qDraw(rec, hx, w.y + 8, 2.4, {clip:'walk', i:Math.floor(G.frame / 6) % 8, dir:w.left ? 4 : 0, async:true, shadowW:12});
  ctx.save(); ctx.strokeStyle = '#4a301c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w.x + fwd * 34, w.y - 12); ctx.lineTo(hx - fwd * 18, w.y - 22); ctx.stroke(); ctx.restore();
  shadow(w.x, w.y + 6, 40);
  const ok2 = w3dMapProp('w_wagon', w.x, w.y + 6, {view:w.left ? 1.7 : 2.3, flash:w.flash > 0});
  return ok1 && ok2;
}

/* -------------------------------------------- objectives and fog hooks --- */
function w3dCache(c){
  if (c.kind === 'captive') return w3dMapProp(c.opened ? 'm_cage_open' : 'm_cage', c.x, c.y + 18, {scale:0.85});
  return w3dMapProp(c.opened ? 'm_chest_open' : 'm_chest', c.x, c.y + 9); }
function w3dVault(v){ return w3dMapProp(v.done ? 'm_vault_open' : 'm_vault', v.x, v.y + 15); }
function w3dBanner(x, y, kind){ return w3dMapProp(kind, x, y, {t:G.frame}); }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx70')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx70"><b>3D contracts.</b> With 3D world on, contract maps get 3D rocks, ruins and undergrowth, and strongboxes, cages, vaults, beacons, banners, the caravan, raid gates and the bar-fight tavern are 3D. Fixed things only show on ground you have explored.</p>`);
  };
}
/* ===== END INDEX 70 ======================================================= */

/* ============================================================================
   INDEX 71 - SWEEP AND FIX (3D WORLD AND 3D CHARACTERS ON)
   Played every contract type, the bar fight, the drill, a raid in each holding
   and the three prologue fights, spread across all four holdings and seasons,
   and opened every camp panel in every holding and season.
   FRAME RATE  Contracts hitched for a quarter to half a second at a time. The
               cause was the fog of war: every frame it ran a brightness filter
               over the whole map and drew full-screen soft circles. Now:
                 - the black (never seen) layer is a cached copy of the fog,
                   rebuilt only when new ground is explored, and only the cells
                   on screen are drawn;
                 - the dim (out of sight) layer is drawn at a quarter of the
                   screen's size and scaled up, which looks the same because it
                   is soft-edged.
   Rollback: delete from this comment to END INDEX 71 and undo the patch marked
   "Index 71" in revealAround.
============================================================================ */
const FOGK = {black:null, dirty:true, map:null, dim:null};
function fogBlack(){
  if (FOGK.map !== MAP){ FOGK.map = MAP; FOGK.dirty = true; FOGK.black = null; }
  if (!FOGK.black || FOGK.black.width !== MAP.w || FOGK.black.height !== MAP.h) FOGK.black = newCanvas(MAP.w, MAP.h);
  if (FOGK.dirty){ const g = FOGK.black.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, MAP.w, MAP.h); g.drawImage(MAP.fog, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, MAP.w, MAP.h); g.globalCompositeOperation = 'source-over'; FOGK.dirty = false; }
  return FOGK.black;
}
drawFieldFog = function(cx, cy){
  if (!rtsFogOn() || !MAP || !MAP.fog) return;
  const Q = 4, w = Math.ceil(VW / Q), h = Math.ceil(VH / Q);
  if (!FOGK.dim || FOGK.dim.width !== w || FOGK.dim.height !== h) FOGK.dim = newCanvas(w, h);
  const g = FOGK.dim.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,6,4,.62)'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  for (const s of visSources()){
    const x = (s.x - cx) / Q, y = (s.y - cy) / Q, r = s.r / Q; if (x < -r || y < -r || x > w + r || y > h + r) continue;
    const gr = g.createRadialGradient(x, y, r * (window.FOG_CORE ?? 0.6), x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(FOGK.dim, cx, cy, w * Q, h * Q);
  const B = fogBlack(), x0 = Math.max(0, Math.floor(cx / CELL) - 1), y0 = Math.max(0, Math.floor(cy / CELL) - 1),
    x1 = Math.min(MAP.w, Math.ceil((cx + VW) / CELL) + 1), y1 = Math.min(MAP.h, Math.ceil((cy + VH) / CELL) + 1);
  if (x1 > x0 && y1 > y0) ctx.drawImage(B, x0, y0, x1 - x0, y1 - y0, x0 * CELL, y0 * CELL, (x1 - x0) * CELL, (y1 - y0) * CELL);
  ctx.restore();
};

/* ---- Index 71: lighting and settings cost ----
   Fire and magic light on 3D figures was drawn on a scratch canvas every frame,
   several times per figure, which forced the browser to stop and redraw each
   time. It is now cached: one lit copy per frame image, light direction (eight
   ways), strength (four steps) and colour, made once and reused.
   settings() rebuilt its object every call (hundreds of times a frame); it now
   returns the stored object when it is already complete. */
const LITC = new WeakMap();
r3dLightUp = function(img, dx, dy, w, h, lights, hard){
  if (!lights || !lights.length) return;
  let m = LITC.get(img); if (!m){ m = new Map(); LITC.set(img, m); }
  for (const L of lights){
    const a8 = ((Math.round(Math.atan2(L.dy, L.dx) / (Math.PI / 4)) % 8) + 8) % 8, f4 = Math.max(1, Math.min(4, Math.round(L.f * 4))), key = a8 + ':' + f4 + ':' + L.col.join(',') + (hard ? 'h' : 's');
    let c = m.get(key);
    if (!c){
      const W = img.width, H = img.height; c = newCanvas(W, H); const g = c.getContext('2d');
      g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in';
      const ang = a8 * Math.PI / 4, ux = Math.cos(ang), uy = Math.sin(ang), a = Math.min(0.75, 0.85 * f4 / 4);
      const cx = W / 2, cy = H * 0.55, gr = g.createLinearGradient(cx + ux * W * 0.42, cy + uy * H * 0.3, cx - ux * W * 0.2, cy - uy * H * 0.15), col = L.col, rgba = al => `rgba(${col[0]},${col[1]},${col[2]},${al})`;
      if (hard){ gr.addColorStop(0, rgba(a)); gr.addColorStop(0.45, rgba(a)); gr.addColorStop(0.46, rgba(a * 0.35)); gr.addColorStop(0.75, rgba(a * 0.35)); gr.addColorStop(0.76, rgba(0)); gr.addColorStop(1, rgba(0)); }
      else { gr.addColorStop(0, rgba(a)); gr.addColorStop(0.6, rgba(a * 0.25)); gr.addColorStop(1, rgba(0)); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H); m.set(key, c);
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = typeof r3dSmooth === 'function' && window.LIGHTUP_SMOOTH !== false ? r3dSmooth(w, c.width) : false; ctx.drawImage(c, dx, dy, w, h); ctx.restore();   // PL-1 follow-up (AD 23 Nov): the light layer is smoothed by the same rule as the figure under it (it was always off, so a 1.55x lit figure got a stepped glow); LIGHTUP_SMOOTH = false restores it
  }
};
settings = (function(prev){
  return function(){
    if (META && META.settings && META.settings._ok && META.settings.volume !== undefined) return META.settings;
    const s = prev(); if (s && META && s === META.settings) Object.defineProperty(s, '_ok', {value:true, enumerable:false, writable:true}); return s;
  };
})(settings);
/* ===== END INDEX 71 ======================================================= */

/* ============================================================================
   INDEX 72 - PLAYTEST FIXES
   CAMP
     - The campfire is smaller (it filled the Bard's seat) and the Bard and his
       log sit further west, clear of the flames.
     - The Quartermaster's wagon is 3D in every holding (the camp drew it
       before the 3D hook was reached).
     - The treasury in the top bar updates the moment you spend or earn, with a
       coin clink when money goes out.
     - Building pictures on their panels are smaller.
     - The Bard starts on Shuffle, so new players hear all five tunes.
     - The palisade is a wall: twice as many stakes, thicker, bound with a
       rail; a pair of gate towers stands at each of the north, east and west
       gates (the south gate is the Gatehouse facility). Those gaps are gates.
     - Streets are softer: no dark border, a soft dirt verge instead, and the
       road tile's ruts are shallow grooves instead of black lines.
   TERRAIN
     - Hills are drawn as a soft grassy rise with a shaded lip, not a stone
       ledge, so they no longer look like a wall. They still give the height
       bonus and slow you a little.
     - Tile edges blend: where forest, rubble, roads, hills, floors or water
       meet open grass, the grass reaches over the edge in a ragged, noisy
       fringe instead of a straight line. Walls, roofs, tents and palisades
       keep their hard edges.
   BAR FIGHT
     - Squad Mates pile in on whoever the Squad Leader is fighting (the nearest
       brawler to the Leader), surrounding them; they no longer drop back into
       formation when you move, and never call "out of formation".
   3D MONSTERS
     - Cave Bear: a heavy shaggy quadruped with a shoulder hump, round ears and
       claws; it rears to swipe.
     - Giant Spider: eight jointed legs, a bulbous abdomen with markings, fangs
       and a cluster of red eyes; its legs ripple as it scuttles.
     - Goblin Wolf-Rider: a goblin with a spear riding a saddled wolf; they
       move, bite and fall together.
   Nothing new is saved except that the Bard's tune setting defaults to
   Shuffle. Rollback: delete from this comment to END INDEX 72 and undo the
   patches marked "Index 72".
============================================================================ */

/* ----------------------------------------------------------- treasury --- */
const TREAS = {last:null};
function treasuryWatch(){
  if (!META) return;
  const v = META.treasury;
  if (TREAS.last !== null && v !== TREAS.last){ try { renderTopbar(); } catch (e) {} if (v < TREAS.last) try { SFX.play('coin'); } catch (e) {} }
  TREAS.last = v;
}
drawCamp = (function(prev){ return function(){ treasuryWatch(); return prev.apply(this, arguments); }; })(drawCamp);
saveMeta = (function(prev){ return function(){ const r = prev.apply(this, arguments); treasuryWatch(); return r; }; })(saveMeta);

/* ---------------------------------------------------------- the Bard --- */
settings = (function(prev){ return function(){ const s = prev(); if (s && s.campSong === undefined) s.campSong = 'shuffle'; return s; }; })(settings);
document.head.appendChild(Object.assign(document.createElement('style'), {textContent:'#camp-panel .pimg{height:84px !important;min-height:0 !important}'}));

/* -------------------------------------------------------- the palisade --- */
W3D_KINDS.w_stake.build = se => { const P = [], add = wAdd(P);
  add([{t:'cap', a:[0, 0, 0], p:[0, 26, 0], r:5.2, z:'wood'}, {t:'ell', c:[0, 28.4, 0], r:[3.6, 4.6, 3.6], z:'woodL'}, {t:'box', c:[0, 10, 4.6], r:[6.4, 1.2, 0.6], z:'woodD'}, {t:'box', c:[0, 19, 4.6], r:[6.4, 1.2, 0.6], z:'woodD'}]);
  if (se === 'winter') add([{t:'ell', c:[0, 32, 0], r:[3, 1.4, 3], z:'snow'}]);
  return {parts:P, zones:W3K.zones(se)}; };
W3D_KINDS.w_gatetower = {frame:[80, 120, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
  for (let k = 0; k < 5; k++) add([{t:'cap', a:[-10 + k * 5, 0, 0], p:[-10 + k * 5, 52, 0], r:2.8, z:k % 2 ? 'wood' : 'woodL'}]);
  add([{t:'box', c:[0, 54, 0], r:[15, 2, 10], z:'woodD'}]); for (let k = -1; k <= 1; k++) add([{t:'box', c:[k * 9, 60, 8], r:[2.6, 4, 1.4], z:'wood'}]);
  add([{t:'box', c:[0, 66, 0], r:[16, 1.6, 11], z:'rfS'}, {t:'box', c:[0, 70, 0], r:[9, 3, 7], z:'rfSD'}, {t:'cap', a:[0, 73, 0], p:[0, 84, 0], r:0.6, z:'wood'}, {t:'box', c:[5, 80, 0], r:[5, 3, 0.4], z:'banner'}]);
  if (se === 'winter') add([{t:'box', c:[0, 74, 0], r:[9.4, 1.2, 7.4], z:'snow'}, {t:'box', c:[0, 68, 0], r:[16, 0.8, 11], z:'snow'}]);
  let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
  return {parts:P, zones:W3K.zones(se, {rfS:'#5a4a3a', rfSD:'#3e3226', banner:bn})}; }};
function drawPalisadeRing(){
  if (holding() !== 'fort' || !has('palisade')) return false;
  const gates = [0, Math.PI / 2, Math.PI, Math.PI * 1.5], N = 400, pts = [];
  for (let a = 0; a < N; a++){ const t = a / N * TAU; if (gates.some(gt => Math.abs(((t - gt + Math.PI * 3) % TAU) - Math.PI) < 0.07)) continue; pts.push([880 + Math.cos(t) * 760, 640 + Math.sin(t) * 470]); }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of pts) w3dStake(x, y);
  for (const gt of [0, Math.PI, Math.PI * 1.5]) for (const s of [-1, 1]){ const t = gt + s * 0.09, x = 880 + Math.cos(t) * 760, y = 640 + Math.sin(t) * 470;
    if (wOn(x, y, 80)) w3dDraw('w_gatetower', x, y + 4); }
  return true;
}

/* -------------------------------------------------------------- roads --- */
drawCampRoads = function(){
  const L = CAMP_LAYOUT.fort;
  if (!CAMP.road) CAMP.road = ctx.createPattern(TILE.road(1), 'repeat');
  if (!CAMP.plaza) CAMP.plaza = ctx.createPattern(TILE.floor(0), 'repeat');
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const verge = w3dBands(w3dZ('dirt'))[2];
  for (const r of L.roads){ ctx.beginPath(); ctx.moveTo(r.pts[0][0], r.pts[0][1]); for (const p of r.pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.globalAlpha = 0.28; ctx.strokeStyle = verge; ctx.lineWidth = r.w + 14; ctx.stroke(); ctx.globalAlpha = 1; }
  for (const r of L.roads){ ctx.beginPath(); ctx.moveTo(r.pts[0][0], r.pts[0][1]); for (const p of r.pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = CAMP.road; ctx.lineWidth = r.w; ctx.stroke(); }
  for (const q of L.rects){ ctx.globalAlpha = 0.3; ctx.fillStyle = verge; ctx.fillRect(q.x - 7, q.y - 7, q.w + 14, q.h + 14); ctx.globalAlpha = 1; ctx.fillStyle = CAMP.plaza; ctx.fillRect(q.x, q.y, q.w, q.h); }
  for (const id in L.plots){ if (!has(id) || !PLOTS[id] || ['palisade', 'watchtower', 'kennels'].includes(id)) continue; const [x, y] = PLOTS[id];   /* Index 77: wherever it was built */ ctx.fillStyle = CAMP.road; ctx.fillRect(x - 9, y - 2, 18, 22); }
  ctx.restore();
  return true;
};
W3T.road = v => wTile('road2' + v, (P, D, r, x) => {
  const Dt = x.Z('dirt'), S = x.Z('stone'); P(0, 0, 20, 20, Dt[2]);
  for (let i = 0; i < 50 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.5 ? wMix(Dt[2], Dt[1], 0.5) : wMix(Dt[2], Dt[3], 0.6)); }
  for (const y of [6, 13]) for (let k = 0; k < 5; k++){ const x0 = r() * 16; P(x0, y + (r() - 0.5), 3 + r() * 4, 0.6, wMix(Dt[2], Dt[1], 0.55)); P(x0, y - 0.6, 3 + r() * 3, 0.4, wMix(Dt[2], Dt[3], 0.5)); }
  for (let i = 0; i < 4; i++){ const px = r() * 18, py = r() * 18; P(px, py, 1, 1, S[3]); P(px, py + 1, 1, 0.5, wMix(S[1], Dt[2], 0.5)); }
  if (x.se === 'winter') for (let i = 0; i < 6; i++) P(r() * 16, r() * 18, 2 + r() * 3, 0.7, x.Z('snow')[2]);
  wSeasonSpeckle(P, D, r, x, x.se === 'autumn' ? 10 : 3);
});
TILE.road = function(v){ return W3T.road(v); };
CAMP.road = null;

/* ------------------------------------------------------- hills, edges --- */
W3T.hillEdge = () => wTile('hilledge2', (P, D, r, x) => {
  const H = x.Z('cliff'), G2 = x.Z('grass');
  for (let i = 0; i < 20 * x.N / 20; i++){ const px = r() * 20, h = 2.2 + r() * 2.6; P(px, 16, 1.6, h, wMix(H[2], H[1], 0.55)); }
  P(0, 15.4, 20, 0.6, H[3]);
  if (x.se === 'winter') P(0, 14.6, 20, 1.2, x.Z('snow')[2]);
  void G2;
});
W3T.hill = v => wTile('hill2' + v, (P, D, r, x) => {
  const H = x.Z('cliff'), G2 = x.Z('grass'); P(0, 0, 20, 20, wMix(G2[2], H[2], 0.45));
  for (let i = 0; i < 40 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.5 ? wMix(G2[2], H[1], 0.35) : wMix(G2[2], H[3], 0.5)); }
  if (x.se === 'winter') for (let i = 0; i < 4; i++) P(r() * 16, r() * 16, 3 + r() * 2, 1.2, x.Z('snow')[2]);
  wSeasonSpeckle(P, D, r, x, 5);
});
for (const k of ['hill', 'hillEdge']){ TILE[k] = function(v){ return W3T[k](v); }; }
const EDGE = {masks:{}, scratch:null};
function edgeMask(bits){
  if (EDGE.masks[bits]) return EDGE.masks[bits];
  const c = newCanvas(CELL, CELL), g = c.getContext('2d'), im = g.createImageData(CELL, CELL), d = im.data, r = rng(bits * 97 + 13), F = 13;
  const noise = []; for (let i = 0; i < CELL * 4; i++) noise.push(r());
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++){
    let a = 0;
    const dist = [bits & 1 ? y : 99, bits & 2 ? CELL - 1 - x : 99, bits & 4 ? CELL - 1 - y : 99, bits & 8 ? x : 99];
    dist.forEach((dd, k) => { if (dd >= 99) return; const along = k % 2 ? y : x, n = noise[k * CELL + along] * 0.6 + noise[k * CELL + ((along + 7) % CELL)] * 0.4, edge = F * (0.35 + n * 0.9);
      const v = dd < edge ? 1 - dd / edge : 0; if (v > a) a = v; });
    const jitter = r() < 0.12 && a > 0.05 ? 0.35 : 0;
    d[(y * CELL + x) * 4 + 3] = Math.min(255, Math.round((a > 0.55 ? 1 : a / 0.55) * 255 * (a > 0 ? 1 : 0) + jitter * 255 * (a > 0.05 ? 1 : 0)));
  }
  g.putImageData(im, 0, 0);
  return EDGE.masks[bits] = c;
}
const BLEND_T = new Set([T.FOREST, T.RUBBLE, T.ROAD, T.HILL, T.FLOOR, T.WATER, T.GATE]);
drawTerrain = (function(prev){
  return function(cx, cy){
    prev(cx, cy);
    if (!G || !MAP || (typeof isBrawl === 'function' && isBrawl())) return;
    if (!G.bgPat) return;
    if (!EDGE.scratch) EDGE.scratch = newCanvas(CELL, CELL);
    const sg = EDGE.scratch.getContext('2d');
    const x0 = Math.max(0, Math.floor(cx / CELL) - 1), x1 = Math.min(MAP.w - 1, Math.floor((cx + VW) / CELL) + 1), y0 = Math.max(0, Math.floor(cy / CELL) - 1), y1 = Math.min(MAP.h - 1, Math.floor((cy + VH) / CELL) + 1);
    const g = MAP.g, w = MAP.w, isG = (x, y) => x >= 0 && y >= 0 && x < w && y < MAP.h && g[y * w + x] === T.GRASS;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
      const t = g[y * w + x]; if (!BLEND_T.has(t)) continue;
      const bits = (isG(x, y - 1) ? 1 : 0) | (isG(x + 1, y) ? 2 : 0) | (isG(x, y + 1) ? 4 : 0) | (isG(x - 1, y) ? 8 : 0); if (!bits) continue;
      sg.globalCompositeOperation = 'source-over'; sg.setTransform(1, 0, 0, 1, -x * CELL, -y * CELL); sg.fillStyle = G.bgPat; sg.fillRect(x * CELL, y * CELL, CELL, CELL);
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'destination-in'; sg.drawImage(edgeMask(bits), 0, 0); sg.globalCompositeOperation = 'source-over';
      ctx.drawImage(EDGE.scratch, x * CELL, y * CELL);
    }
  };
})(drawTerrain);

/* ---------------------------------------------------------- bar fight --- */
slotTarget = (function(prev){
  return function(i, n, shieldWall){
    if (!(typeof isBrawl === 'function' && isBrawl()) || !G) return prev(i, n, shieldWall);
    const L = G.leader; let best = null, bd = 2000;
    for (const e of G.enemies){ if (e.dead || e.dormant) continue; const d = dist(e, L); if (d < bd){ bd = d; best = e; } }
    if (!best) return prev(i, n, shieldWall);
    const a = Math.atan2(L.y - best.y, L.x - best.x) + (i + 1) * TAU / (n + 1), rr = (best.r || 10) + 16;
    return {x:best.x + Math.cos(a) * rr, y:best.y + Math.sin(a) * rr};
  };
})(slotTarget);
updateMates = (function(prev){
  return function(sw){
    if (!(typeof isBrawl === 'function' && isBrawl())) return prev(sw);
    const r0 = G.mod.radius; G.mod.radius = 9999;
    for (const m of G.squad) m.inF = true;
    try { return prev(sw); } finally { G.mod.radius = r0; }
  };
})(updateMates);

/* ------------------------------------------------------- bears, spiders --- */
Object.assign(QUAD3D, {
  bear:{hh:22, sh:27, L:30, bw:10.5, bh:11, neck:6, neckR:6, neckRx:1.25, headL:11, headR:6, tail:4, legU:4.2, legL:3.4, ears:'bear', tailT:'stub', foot:'paw', ruff:1.15,
        coat:'#5a3a22', belly:'#7a5a3a', dark:'#2a1a10', qeye:'#141010', qnose:'#141010'}
});
const BEAST_SCALE = {bear:1.75, spider:1.7, wolfrider:1.35};   // Index 73: the new beasts render at their proper size
r3qBuild = (function(prev){
  const build = kind => {
    if (kind === 'bear'){
      const Q = QUAD3D.bear, b = prev('bear');
      const add = (bn, list) => { for (const q of list) b.parts.push(Object.assign({b:bn}, q)); };
      add('qWith', [{t:'ell', c:[0, Q.bh * 0.55, -2], r:[Q.bw * 0.9, Q.bh * 0.7, Q.L * 0.22], z:'coat'}]);
      for (const sx of [1, -1]) add('qHead', [{t:'ell', c:[sx * Q.headR * 0.68, Q.headR * 0.92, -Q.headR * 0.15], r:[1.9, 1.9, 1.2], z:'coat'}]);
      add('qTail', [{t:'ell', c:[0, 0, -1.4], r:[2.4, 2.4, 2], z:'coat'}]);
      for (const p of ['qFLp', 'qFRp']) for (const x of [-1.6, 0, 1.6]) add(p, [{t:'cap', a:[x, 0, 2.6], p:[x * 1.2, -0.6, 5.2], r:0.5, z:'bone'}]);
      b.parts = b.parts.filter(q => !((q.b === 'qTail' || q.b === 'qTail2') && q.z === 'mane'));
      b.zones.bone = '#ddd4be'; b.key = 'r3qb' + hash(JSON.stringify(b)); return b;
    }
    if (kind === 'spider') return spiderBuild();
    if (kind === 'wolfrider') return wolfriderBuild();
    return prev(kind);
  };
  return function(kind){
    const rec = build(kind), k = BEAST_SCALE[kind];
    if (k && !rec._scaled){ r3dScaleRec(rec, k); const F = rec.frame; rec.frame = {W:Math.round(F.W * k), H:Math.round(F.H * k), FEET:Math.round(F.FEET * k), CX:Math.round(F.CX * k)}; rec._scaled = true; rec.key += 's' + k; }
    return rec;
  };
})(r3qBuild);
function spiderBuild(){
  const S = {order:['qHips', 'body', 'head'], bones:{qHips:{parent:null, off:[0, 9, 0]}, body:{parent:'qHips', off:[0, 0, 0]}, head:{parent:'qHips', off:[0, 0, 9]}}};
  const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  add('body', [{t:'ell', c:[0, 2, -10], r:[9, 7.5, 11], z:'abd'}, {t:'ell', c:[0, 6.6, -10], r:[3.4, 1.4, 6], z:'mark'}, {t:'ell', c:[0, 6.4, -15], r:[2.4, 1.2, 2], z:'mark'}]);
  add('head', [{t:'ell', c:[0, 0, 0], r:[6, 4.4, 6], z:'abd'}, {t:'ell', c:[0, -1.4, 5], r:[3.6, 2.4, 2], z:'dark'}]);
  for (const [x, y] of [[-1.6, 2.6], [1.6, 2.6], [-3, 1.6], [3, 1.6], [-0.6, 3.6], [0.6, 3.6]]) add('head', [{t:'ell', c:[x, y, 5.4], r:[0.8, 0.8, 0.6], z:'eyeglow'}]);
  for (const sx of [1, -1]) add('head', [{t:'cap', a:[sx * 1.6, -2, 5.6], p:[sx * 1.2, -5.4, 7.4], r:0.7, z:'bone'}]);
  for (let k = 0; k < 4; k++) for (const sx of [1, -1]){
    const nm = 'L' + k + (sx > 0 ? 'l' : 'r'), nm2 = nm + 'b', z = 4 - k * 3;
    S.bones[nm] = {parent:'qHips', off:[sx * 4, 1, z]}; S.bones[nm2] = {parent:nm, off:[sx * 10, 6, (k - 1.5) * 2]}; S.order.push(nm, nm2);
    add(nm, [{t:'cap', a:[0, 0, 0], p:[sx * 10, 6, (k - 1.5) * 2], r:1.2, z:'leg'}]);
    add(nm2, [{t:'cap', a:[0, 0, 0], p:[sx * 5, -15, (k - 1.5) * 2], r:0.9, z:'leg'}]);
  }
  const rec = {rig:'spider', skel:S, parts:P, zones:{abd:'#3a3036', mark:'#a82a24', dark:'#1a1418', leg:'#2a2226', bone:'#d8cfb4', eyeglow:'#ff3a2a'}, frame:QUAD_FRAME.small, Q:{hh:9, bw:9, horse:false}};
  r3dMute(rec); rec.zones.eyeglow = '#ff3a2a'; rec.zones.mark = '#a82a24';
  rec.key = 'r3sp' + hash(JSON.stringify(rec)); return rec;
}
const spLegs = (t, amp, lift) => { const p = {}; for (let k = 0; k < 4; k++) for (const sx of [1, -1]){ const ph = t * TAU + k * Math.PI / 2 + (sx > 0 ? 0 : Math.PI);
  p['L' + k + (sx > 0 ? 'l' : 'r')] = [0, amp * Math.sin(ph) * sx, -sx * lift * Math.max(0, Math.cos(ph))]; } return p; };
R3D_CLIPS.spider = {
  idle:{n:4, fn:t => Object.assign({bob:0.4 * Math.sin(t * TAU), body:[0.05 * Math.sin(t * TAU), 0, 0]}, spLegs(t, 0.05, 0))},
  walk:{n:8, fn:t => Object.assign({bob:0.5 * Math.abs(Math.sin(t * TAU * 2))}, spLegs(t, 0.35, 0.3))},
  run:{n:8, fn:t => Object.assign({bob:0.8 * Math.abs(Math.sin(t * TAU * 2))}, spLegs(t, 0.5, 0.45))},
  attack:{n:6, fn:t => { const k = Math.sin(Math.min(1, t * 1.4) * Math.PI); return Object.assign({bob:2 * k, qHips:[-0.5 * k, 0, 0], head:[0.2 * k, 0, 0]}, spLegs(0, 0, 0), {L0l:[0, 0, -0.9 * k], L0r:[0, 0, 0.9 * k]}); }},
  death:{n:6, fn:t => { const k = Math.min(1, t * 1.4), p = {bob:-6 * k, qHips:[0, 0, 0]}; for (let i = 0; i < 4; i++){ p['L' + i + 'l'] = [0, 0, 1.2 * k]; p['L' + i + 'r'] = [0, 0, -1.2 * k]; p['L' + i + 'lb'] = [0, 0, -1.4 * k]; p['L' + i + 'rb'] = [0, 0, 1.4 * k]; } return p; }}
};
function wolfriderBuild(){
  const w = r3qBuild('wolf'), Q = Object.assign({}, w.Q, {horse:false});
  const wolf = Object.assign({}, w, {skel:{order:w.skel.order.concat(['qSad']), bones:Object.assign({}, w.skel.bones, {qSad:{parent:'qSpine', off:[0, Q.bh * 0.9, -1]}})}, parts:w.parts.slice()});
  wolf.parts.push({b:'qSad', t:'box', c:[0, -0.6, 0], r:[Q.bw * 0.9, 0.8, 5], z:'saddleC'}, {b:'qSad', t:'ell', c:[0, 0.6, -3.6], r:[Q.bw * 0.5, 1.6, 1], z:'saddleC'});
  wolf.zones = Object.assign({}, w.zones, {saddleC:'#6a3a2a', tack:'#3a2616'});
  R3QR.__warg = wolf;
  const rider = r3dEnemyRecipe('goblinsniper');
  const L = Object.assign({}, rider, {parts:rider.parts.filter(q => !(q.b === 'hdL' && /wood|string/.test(q.z)))});
  WEAPON3D.spear().forEach(q => L.parts.push(Object.assign({b:'hdR'}, q)));
  L.grip = 'thrust';
  const rec = r3qMountRecipe(L, '__warg');
  rec.frame = QUAD_FRAME.small; rec.Q = Q;
  return rec;
}
/* the warg recipe is R3QR.__warg (set above); the base r3qRecipe returns it (INT-1 step 3: wrapper folded) */
R3D_CLIPS.mount.attack = R3D_CLIPS.mount.melee;
R3D_CLIPS.mount.death = {n:6, fn:(t, rec) => Object.assign(R3D_CLIPS.quad.death.fn(t, rec), seatPose(rec.rider, 'ride', 0, 'idle'))};
for (const k of ['bear', 'spider', 'wolfrider']) QUAD_KINDS.add(k);
for (const k of ['bear', 'spider', 'wolfrider']) delete R3QR[k];
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx72')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx72"><b>Playtest fixes.</b> A smaller campfire, a 3D Quartermaster's wagon, a live treasury, a proper palisade wall with gate towers, softer roads and terrain edges, bar-fight mates who join the Leader's fight, and 3D bears, spiders and goblin wolf-riders.</p>`);
  };
}

/* ---- Index 73: the new beasts render ahead and at their proper size (BEAST_SCALE is in r3qBuild above) ---- */
startDeployment = (function(prev){
  return function(c, ids){
    const r = prev(c, ids);
    try { if (G){ const St = R3D_STYLES[r3dStyleId()], H = hostOf(), want = new Set(G.enemies.map(e => e.k));
      for (const t in H.pools) for (const k of H.pools[t]) want.add(k);
      for (const k of ['bear', 'spider', 'wolfrider']) if (want.has(k)){ const rec = r3qRecipe(k); for (const clip of ['idle', 'walk', 'run', 'attack']) for (let d = 0; d < 8; d++) r3dFramesAsync(rec, clip, d, St, true); } } } catch (e) {}
    return r;
  };
})(startDeployment);
/* ===== END INDEX 72 ======================================================= */

/* ============================================================================
   INDEX 74 - THE 3D REPLACEMENT AUDIT: WHAT WAS STILL DRAWN IN PIXEL ART
   Found by wrapping drawImage with 3D characters and 3D world on and sorting
   every image drawn by its sprite cache key, in the camp, every contract type,
   a raid, the bar fight and the prologue. Fixed here:
     UNITS WITH NO UNIT RECORD   Intel blips (scouted troops), hostages, plague
               villagers, night-march refugees, the prologue camp's folk and
               the barkeep were drawn from lists the 3D hook does not search,
               or from sprites that were never tagged for 3D, so they stayed
               pixel art. Now:
                 - personSpriteK(key, p) is a person sprite that carries the 3D
                   tag (the same tag personSprite adds for the Chapter);
                 - drawUnit3(u, spr, ...) draws a tagged sprite in 3D using the
                   unit record the caller already has (a hostage, a villager, a
                   refugee), with the pixel sprite as the fallback while the 3D
                   frames render in the background;
                 - drawStub(owner, i, spr, ...) does the same for things that
                   have no unit record at all (intel blips, the barkeep). It
                   keeps one light stub record per owner and slot, so there is
                   NO per-draw search of any unit list and no cost on the
                   normal draw path.
     RAIDS     The Chapter House, its banner and the watchtowers were pixel art
               in a raid. Now the 3D house for the holding, a 3D Chapter
               banner and the 3D watchtower. The old drawing is kept as the
               fallback and still runs if a 3D frame is not ready.
     AMBUSH    The Prize Wagon and its horse use the caravan's 3D helper; the
               Valley's End banner uses the 3D banner.
     NIGHT MARCH   Column wagons and the Ledger Wagon are 3D (w3dWagon); the
               Kalloon riders' horses are 3D light horses (w3dRider).
     CAMP      The Chapter's banner beside the Chapter House is a 3D banner in
               the Chapter's own colours (w3dChBanner).
   ROLLBACK   Delete from this comment to END INDEX 74, and undo each one-line
              patch marked "Index 74" (drawKnownBlip, hostage draw, refugee
              draws, folk draw, plague villager draw, night wagons and Ledger
              Wagon, Kalloon riders, Prize Wagon, Valley's End banner, camp
              banner, barkeepSprite and the two barkeep draws).
   NOT DONE HERE (needs a new system)   Contract structures made of terrain
              cells, terrain tile repetition, traps, the quarry crystal, ground
              fire, bones decor, trophies, the barge hull and quay, the
              warehouse shell, masts, pillars and memorials.
============================================================================ */
const BARKEEP_P = {race:'HUMAN', spec:'PLAIN', name:'Barkeep', id:'bk', sex:'m'};
const BARKEEP_OWN = {};
function personSpriteK(key, p){
  const spr = humanoidSprite(key, personLook(p, false));
  if (!spr.p3d && p && p.race && RACES[p.race] && p.spec && (SPECS[p.spec] || R3D_KITS[p.spec])){ spr.p3d = p; spr.p3dL = false; }
  return spr;
}
// P23-BUG-9/10: bake the sweep riders ahead (from 10 s in, asking again every 5 s until baked). A warm counts for the art style it baked, so a style change bakes again.
// Called from drawUnit3 and, every combat frame, from storyBodies (the solo siege draws nothing through drawUnit3: Neon R20).
function w3dRiderWarms(){
  if (!G || !(G.kalloon || G.duruk)) return;
  const styleNow = r3dStyleId() || 'crisp';
  if (G.kalloon && G.knWarm !== styleNow && G.frame >= 600 && G.frame - (G.knAsk || 0) >= 300){ G.knAsk = G.frame; G.knWarm = w3dKnightWarm() ? styleNow : false; }
  if (G.duruk && G.orcWarm !== styleNow && G.frame >= 600 && G.frame - (G.orcAsk || 0) >= 300){ G.orcAsk = G.frame; G.orcWarm = w3dOrcRiderWarm() ? styleNow : false; }
}
// Draw a 3D-tagged sprite with a unit record the caller already has. Pixel art is the fallback.
function drawUnit3(u, spr, x, y, s, frame, left, flash){
  if (u && r3dTagged(spr)){
    try {
      r3dPumpTick();
      w3dRiderWarms();
      const rec = r3dRecipeForSprite(spr);
      if (rec){
        if (spr.e3d) u.e3d = true;
        const c = r3dChoose(rec, u, frame, G ? G.frame : CAMP.t);
        if (r3dDraw(rec, u, x, y, s, Object.assign(c, {flash, async:true, light:!spr.e3d}))) return;
      }
    } catch (e) { (typeof r3dWarnOnce === 'function' ? r3dWarnOnce('map unit', e) : console.warn('3D map unit drew the placeholder:', e)); /* S6-C note 10: no pixel fallback; once per kind */ }
  }
  drawSprite(spr, x, y, s, frame, left, flash);
}
// The same for things with no unit record: one light stub per owner and slot, kept on the owner.
function drawStub(owner, i, spr, x, y, s, frame, left, flash){
  const a = owner._stub3 || (owner._stub3 = []);
  const u = a[i] || (a[i] = {kind:'stub', x, y, left:!!left, anim:{left:!!left}});
  u.x = x; u.y = y; u.left = !!left; u.anim.left = !!left; u.flash = flash ? 5 : 0;
  drawUnit3(u, spr, x, y, s, frame, left, flash);
}

/* ------------------------------------------------------------ banners --- */
// A hanging banner in the Chapter's own colours: field, division, and a round charge. The pole is at x = -26, the cloth centred on x = 0.
function w3dChBannerKind(){
  const b = banner(), key = 'm_bch_' + hash(bannerSig()).toString(36);
  if (W3D_KINDS[key]) return key;
  const steps = (add, pts, r) => { for (const [x, y] of pts) add([{t:'box', c:[x, y, 0], r, z:'flagD'}]); };
  const diag = (flip, n = 6) => Array.from({length:n}, (_, i) => [flip * (-17.5 + (35 / (n - 1)) * i), 66 - (38 / (n - 1)) * i]);
  W3D_KINDS[key] = MPK([70, 120, 6], se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[-26, 2, 0], r:[8, 2.4, 6], z:'stoneD'}, {t:'cap', a:[-26, 0, 0], p:[-26, 74, 0], r:1.7, z:'wood'}, {t:'ell', c:[-26, 76, 0], r:[2.4, 2.4, 2.4], z:'gold'}, {t:'box', c:[0, 72, 0], r:[27, 1.4, 1.4], z:'woodD'}]);
    add([{t:'box', c:[0, 47.5, 0], r:[23, 23.5, 0.7], z:'flag'}, {t:'box', c:[-12.5, 21, 0], r:[10, 3.5, 0.7], z:'flag'}, {t:'box', c:[12.5, 21, 0], r:[10, 3.5, 0.7], z:'flag'}]);
    const dv = b.div;
    if (dv === 'pale') add([{t:'box', c:[11.5, 47.5, 0], r:[11.5, 23.5, 0.9], z:'flagD'}]);
    else if (dv === 'fess') add([{t:'box', c:[0, 35.75, 0], r:[23, 11.75, 0.9], z:'flagD'}]);
    else if (dv === 'bend') steps(add, diag(1), [3.8, 4.4, 0.9]);
    else if (dv === 'saltire'){ steps(add, diag(1), [3.2, 3.8, 0.9]); steps(add, diag(-1), [3.2, 3.8, 0.9]); }
    else if (dv === 'chevron'){ const pts = []; for (let i = 0; i < 5; i++){ pts.push([-18 + i * 4.5, 34 + i * 5], [18 - i * 4.5, 34 + i * 5]); } steps(add, pts, [3.2, 3.4, 0.9]); }
    else if (dv === 'quarterly') add([{t:'box', c:[-11.5, 59.25, 0], r:[11.5, 11.75, 0.9], z:'flagD'}, {t:'box', c:[11.5, 35.75, 0], r:[11.5, 11.75, 0.9], z:'flagD'}]);
    else if (dv === 'bordure') add([{t:'box', c:[0, 69, 0], r:[23, 2, 0.9], z:'flagD'}, {t:'box', c:[0, 26, 0], r:[23, 2, 0.9], z:'flagD'}, {t:'box', c:[-21, 47.5, 0], r:[2, 23.5, 0.9], z:'flagD'}, {t:'box', c:[21, 47.5, 0], r:[2, 23.5, 0.9], z:'flagD'}]);
    add([{t:'ell', c:[0, 48, 0], r:[7.5, 7.5, 1.3], z:'chg'}]);
    return {parts:P, zones:SKZ(se, null, {flag:b.c1, flagD:b.c2, chg:b.charge}), keepZones:['flag', 'flagD', 'chg'], _seasoned:true}; });   // no leaves or snow on a banner's foot
  return key;
}
// s is the pixel banner's scale (its pole is 22 px tall at that scale; this pole is about 75 units at 3.4). x is the pole's foot.
function w3dChBanner(x, gl, s){ const k = s / 3.4; return w3dMapProp(w3dChBannerKind(), x + 26 * k, gl, {scale:k, t:G ? G.frame : CAMP.t}); }

/* ------------------------------------------------------------- wagons --- */
function w3dWagon(x, y, left, s, flash){
  shadow(x, y + 2 * s, 13 * s);
  return w3dMapProp('w_wagon', x, y + 2 * s, {view:left ? 1.7 : 2.3, flash:!!flash, scale:s / 3});
}
/* P23-ARTEMIS (AD, 23 Nov): Artemis's mounted Empire knights for the Thornwater Ford relief (spec audits/specs/p23-artemis-final-road.md;
   livery Lore ruling R-208: brownish-red and white checks, a gold sun). Plate, great helm, heater shield and lance, a checked surcoat, a warhorse
   in red-brown barding. The lead rider is Lord Artemis: bareheaded (dark hair, short beard), sword, his banner on a pole from the saddle.
   Scenery only (the sweep in founding-story.js does the killing). Riders draw as knights when rd.kind === 'knight', or on the Ford night
   (G.kalloon) when the sweep sets no kind; the front-row rider nearest the middle is Artemis unless the sweep sets rd.lead itself.
   w3dKnightWarm() queues the run frames (call it at the round-4 horn so they are baked when the knights ride). */
const KNIGHT_LIV = {a:'#8a3a26', b:'#e6dfcf', sun:'#d8a838', barding:'#6a2a1c', pole:'#5a3a22'}, KNIGHT_RECS = {};
function w3dKnightRecipe(lead){
  const k = lead ? 'lead' : 'knight'; if (KNIGHT_RECS[k]) return KNIGHT_RECS[k];
  const look = {skin:'#cf9f7a', hair:lead ? '#4a423c' : '#2a2018', hairStyle:'short', beard:true, top:KNIGHT_LIV.a, legs:'#3a2e26', acc:KNIGHT_LIV.a, shieldCol:KNIGHT_LIV.a, cape:null};
  const p = {name:'npc:' + k, race:'HUMAN', spec:'SOLDIER', sex:'m', id:'K', injuries:[]};
  const rider = r3dBuild54(p, false, {kit:'SOLDIER', look, race3d:RACE3D.HUMAN, weight:'heavy', material:'plate', weapon:lead ? 'sword' : 'pike', shield:'heater'});
  const R = RACE3D.HUMAN, D = r3dSkeleton(R, false).dims, S = D.s, W = D.w;
  if (lead){ rider.parts = rider.parts.filter(q => q.b !== 'head'); for (const q of r3dHeadParts(R, look, false, D.hk, 'keep').H) rider.parts.push(Object.assign({b:'head'}, q)); }   // no helm
  const checks = (b, z, y0, y1, x0, cols, rows) => { const cw = 2 * x0 / cols, rh = (y1 - y0) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) rider.parts.push({b, t:'box', c:[-x0 + cw * (i + 0.5), y0 + rh * (j + 0.5), z], r:[cw / 2, rh / 2, 0.5], z:(i + j) % 2 ? 'chkB' : 'chkA'}); };
  checks('chest', 8.4 * W, 1.5 * S, 17 * S, 7.6 * W, 4, 4);    // the surcoat, front
  checks('chest', -6.7 * W, 1.5 * S, 17 * S, 7.6 * W, 4, 4);   // and back
  for (const sx of [1, -1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++){   // and both sides (QA 23 Nov: the sweep rides east or west, so the sides are what shows)
    const zw = 14.6 * W / 3, rh = 15.5 * S / 4;
    rider.parts.push({b:'chest', t:'box', c:[sx * 9.2 * W, 1.5 * S + rh * (j + 0.5), -6.4 * W + zw * (i + 0.5)], r:[0.5, rh / 2, zw / 2], z:(i + j) % 2 ? 'chkB' : 'chkA'}); }
  if (lead) rider.parts.push({b:'chest', t:'ell', c:[0, 10 * S, 9 * W], r:[2.4 * W, 2.4 * W, 0.6], z:'sun'});
  Object.assign(rider.zones, {chkA:KNIGHT_LIV.a, chkB:KNIGHT_LIV.b, sun:KNIGHT_LIV.sun, shield:KNIGHT_LIV.a, pole:KNIGHT_LIV.pole});
  r3dMute(rider);
  rider.key = 'r3dkn' + hash(JSON.stringify(rider));
  const base = r3qMountRecipe(rider, 'horse:warhorses'), parts = base.parts.slice();
  if (lead){   // the banner: a pole from the saddle's right side, the flag trailing behind (4 x 3 checks, a sun on both faces)
    parts.push({b:'qSad', t:'cap', a:[8, -2, -5], p:[8, 64, -5], r:0.9, z:'pole'}, {b:'qSad', t:'ell', c:[8, 65.5, -5], r:[1.6, 1.6, 1.6], z:'sun'});
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) parts.push({b:'qSad', t:'box', c:[8, 47 + j * 5.5, -8.5 - i * 5.5], r:[0.4, 2.75, 2.75], z:(i + j) % 2 ? 'chkB' : 'chkA'});
    for (const sx of [1, -1]) parts.push({b:'qSad', t:'ell', c:[8 + sx * 0.6, 52.5, -19.5], r:[0.4, 3.4, 3.4], z:'sun'});
  }
  const rec = Object.assign({}, base, {parts, zones:Object.assign({}, base.zones, r3dMute({zones:{barding:KNIGHT_LIV.barding}}).zones)});
  rec.key = 'r3mkn' + hash(k + JSON.stringify(rec.zones) + parts.length);
  return KNIGHT_RECS[k] = rec;
}
function w3dKnightWarm(){   // asks for the four run clips as real draws do (front of the queue, safe from the F-42 prune); true once all four are baked
  try { const St = R3D_STYLES[r3dStyleId() || 'crisp']; let n = 0; for (const lead of [true, false]) for (const d of [0, 4]) if (r3dFramesAsync(w3dKnightRecipe(lead), 'run', d, St)) n++; return n === 4; } catch (e) { r3dWarnOnce('knight warm', e); return false; }
}
function w3dKnight(rd){
  const rs = G.riders || [];
  if (rs.length && !rs.some(r => r.lead !== undefined)){   // Artemis heads the sweep: the front row, nearest the middle
    const H = MAP.h * CELL, dx = r => r.x * Math.sign(r.vx || 1), front = Math.max(...rs.map(dx));
    let best = null; for (const r of rs){ r.lead = false; if (dx(r) >= front - 1 && (!best || Math.abs(r.y - H / 2) < Math.abs(best.y - H / 2))) best = r; }
    if (best) best.lead = true;
  }
  return r3qDraw(w3dKnightRecipe(!!rd.lead), rd.x, rd.y + 8 * 2.6, 2.6, {clip:'run', i:Math.floor(G.frame / 4) % 8, dir:r3dDirOf(Math.atan2(0, rd.vx || 1)), async:true, shadowW:14});
}
/* P23-BUG-9 (AD 23 Nov): Khan Duruk's orc riders drew as riderless light horses. Each now carries a steppe orc (the ORC culture dresses him:
   blue deel, red sash, bone necklace, fur hat while bare-headed), light padded kit, no shield, half with spears and half with swords. */
const ORC_RIDER_RECS = {};
function w3dOrcRiderRecipe(spear){
  const k = spear ? 'spear' : 'sword'; if (ORC_RIDER_RECS[k]) return ORC_RIDER_RECS[k];
  const p = {name:'npc:orcrider' + k, race:'ORC', spec:'SOLDIER', sex:'m', id:'O' + k, injuries:[]};
  const look = {skin:'#74903f', hair:'#14140e', hairStyle:'topknot', beard:false, top:'#34507a', legs:'#3a2e26', acc:'#9a2a24', cape:null};
  const rider = r3dBuild54(p, false, {kit:'SOLDIER', look, weight:'light', material:'padded', weapon:spear ? 'spear' : 'sword', shield:'none'});
  rider.parts = rider.parts.filter(q => q.z !== 'shield' && q.b !== 'head');   // no shield; no kit helm (it read as a human soldier)
  const R = RACE3D.ORC, D = r3dSkeleton(R, false).dims;
  for (const q of r3dHeadParts(R, look, false, D.hk, 'keep').H) rider.parts.push(Object.assign({b:'head'}, q));   // the orc's own head: tusks, topknot
  for (const q of RACE_CULTURE.ORC.parts(D, {fem:false, bare:true, weight:'light', robe:false, spec:'SOLDIER'})) if (q.b === 'head') rider.parts.push(q);   // and the steppe fur hat
  r3dMute(rider); rider.zones.skin = '#6a8a3a';   // muted like every other recipe (Neon R20), then the orc green: the culture picks from a flesh-to-green range; Duruk's riders read as orcs at field size only when green
  rider.key = 'r3dorc' + hash(JSON.stringify(rider));
  const rec = r3qMountRecipe(rider, 'horse:lighthorse');
  rec.key = 'r3morc' + hash(k + JSON.stringify(rec.zones) + rec.parts.length);
  return ORC_RIDER_RECS[k] = rec;
}
function w3dOrcRiderWarm(){   // as w3dKnightWarm: front-of-queue asks for both run clips both ways; true once all four are baked
  try { const St = R3D_STYLES[r3dStyleId() || 'crisp']; let n = 0; for (const sp of [true, false]) for (const d of [0, 4]) if (r3dFramesAsync(w3dOrcRiderRecipe(sp), 'run', d, St)) n++; return n === 4; } catch (e) { r3dWarnOnce('orc rider warm', e); return false; }
}
function w3dRider(rd){
  try { r3dPumpTick();
    if (rd.kind === 'knight' || (rd.kind === undefined && G.kalloon)) return w3dKnight(rd);
    if (G.duruk && rd.sp === undefined) rd.sp = G.riders.indexOf(rd) % 2 === 0;   // spear or sword by turns (Neon R20: the y-based pick gave the Keep lanes all spears)
    const rec = G.duruk ? w3dOrcRiderRecipe(rd.sp) : r3qRecipe('horse:lighthorse');
    return r3qDraw(rec, rd.x, rd.y + 8 * 2.6, 2.6, {clip:'run', i:Math.floor(G.frame / 4) % 8, dir:r3dDirOf(Math.atan2(0, rd.vx || 1)), async:true, shadowW:12}); } catch (e) { return false; }
}

/* -------------------------------------------------------------- raids --- */
function w3dHouseKind(){ const hk = holdKey(); return hk === 'barge' || hk === 'warehouse' ? 'hh_' + hk : hk === 'waystation' ? ruinKind('house') : 'house'; }
function w3dRaidHouse(orig){
  const H = G.house, ok = w3dMapProp(w3dHouseKind(), H.x, H.y + 64, {scale:0.92, view:curLayout().houseView, flash:H.flash > 0});
  if (!ok) return orig();
  const img = houseCanvas(), w = img.width * 3.6, hh = img.height * 3.6;
  w3dChBanner(H.x + w / 2 - 6, H.y + 63, 3);
  if (H.hp < H.maxHp * 0.5 && G.frame % 6 === 0) G.fx.push({x:H.x + rnd(-40, 40), y:H.y - 40, vx:rnd(-.3, .3), vy:-1.2, life:40, c:'#ff8a2a', px:3});
  const bw = 140, top = H.y - hh + 52;
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(H.x - bw / 2 - 1, top - 1, bw + 2, 8);
  ctx.fillStyle = H.hp > H.maxHp * 0.3 ? '#6fd37a' : '#e0503a'; ctx.fillRect(H.x - bw / 2, top, bw * Math.max(0, H.hp / H.maxHp), 6);
  ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.fillText(HS().house.toUpperCase(), H.x, top - 5);
}
function w3dRaidTower(t){
  const k = raidFacKind('watchtower');
  if (k && w3dMapProp(k, t.x, t.y + 10, {scale:0.85})) return;
  const img = facilityCanvas('watchtower'); ctx.drawImage(img, t.x - img.width * 1.4, t.y - img.height * 2.8 + 10, img.width * 2.8, img.height * 2.8);
}
raidBodies = (function(prev){
  return function(bodies, onScreen){
    const towers = G.towers, n0 = bodies.length; G.towers = [];
    try { prev(bodies, onScreen); } finally { G.towers = towers; }
    const hb = bodies[n0];   // the Chapter House is the first body the raid pushes
    if (hb && hb.custom && G.house && hb.y === G.house.y + 30){ const orig = hb.custom; hb.custom = () => w3dRaidHouse(orig); }
    for (const t of (towers || [])) if (onScreen(t, 80)) bodies.push({y:t.y, custom:() => w3dRaidTower(t)});
  };
})(raidBodies);
/* ===== END INDEX 74 ======================================================= */

/* ============================================================================
   INDEX 75 - MOVEMENT FEEL
   A  The walk and run cycles are driven by distance travelled, not by time.
      Before: one step every 24 frames whatever the speed, so at the Leader's
      normal pace (about 1.95 px a frame) the body moved roughly 47 px per step
      while the feet reached about 25 px. Feet slid. Now one animation frame
      per FEEL.walkPx (or runPx) of real movement, so speed changes (shield
      wall, terrain, armour, mounts, race) keep the feet planted.
      A walk starts on the first stride pose instead of wherever the global
      tick happens to be, and a stop plays on to the next passing pose (at
      most FEEL.settleMax frames) instead of snapping to idle.
   B  The game loop runs on real time (60 steps a second, at most 2 steps per
      displayed frame) instead of one step per display frame. A slow frame no
      longer slows the game down, and a 120 or 144 Hz screen no longer speeds
      it up.
   TUNING     FEEL.walkPx (6.5) is the distance walked per animation frame. Raise it
              (try 9) for a calmer, slower step; lower it for a busier one.
              FEEL.runPx is the same for running.
   NOT COVERED  Horses, riders, beasts and other non-humanoid clips are unchanged.
   ROLLBACK   Delete from this comment to END INDEX 75. Nothing else was patched.
============================================================================ */
/* FEEL and the stride pacing are in r3dChoose (js/3d/figures-2.js) */

const LOOP75 = {t:0};
loop = function(){
  if (!G) return;
  const now = performance.now(); let dt = LOOP75.t ? (now - LOOP75.t) / 16.667 : 1; LOOP75.t = now;
  dt = dt > 0.85 && dt < 1.15 ? 1 : Math.min(2, Math.max(0.2, dt));
  if (!G.paused && !G.over){
    G.tick = (G.tick || 0) + gameSpeed() * dt * (G.slowmo > 0 ? 0.35 : 1) * momentumSlow() * (G.cutscene ? 0 : 1);
    if (G.slowmo > 0) G.slowmo--;
    let guard = 0;
    while (G.tick >= 1 && !G.over && !G.paused && guard++ < 2){ G.tick -= 1; update(); }
    if (G.tick > 2) G.tick = 2;
  }
  if (G) draw();
  if (G && !G.over) requestAnimationFrame(loop);
};
/* ===== END INDEX 75 ======================================================= */

/* ============================================================================
   INDEX 76 - THE 3D REPLACEMENT AUDIT, PART 2
   A second sweep (camp in all four holdings with plots empty and built, all
   sixteen contract kinds, a raid, the bar fight and the prologue) found these
   still drawn in pixel art with "3D world" on. Now 3D:
     CAMP       the signpost and roped stakes on every empty building plot; the
                bones decor; the three bench logs round the campfire
     PROLOGUE   the campfire (the camp's own 3D campfire) and the fires burning
                in overrun districts
     CONTRACTS  enemy traps (caltrops, snare, tripwire, deadfall, fire pots,
                stake line); the Circle of Iron's ring of stakes (Trial); the
                quarry crystals; the Seal's braziers (the Beacons contract's 3D
                beacon, cold or lit); scouted Blip Tokens (tracks, spike pit,
                hide); the relic carried above the Leader's head; fire on the
                ground
     BAR FIGHT  the tankards of ale
   Every draw keeps the old pixel art as its fallback, used when "3D world" is
   off or while a 3D frame is still rendering.
   ROLLBACK   Delete from this comment to END INDEX 76, and undo each one-line
              patch marked "Index 76" (plot sign, bench logs, prologue fire,
              district fires, ground fire, traps, Circle of Iron, crystals,
              braziers, tracks, pit, hide, carried relic, ale).
   STILL FLAT ON PURPOSE   arrows, bolts and magic orbs, coin and gem pickups,
              the "?" Blip Token, smoke puffs, and the HUD.
============================================================================ */
// Scale a part list built small up to its screen size.
const w76Scale = (P, k) => { for (const q of P){ for (const f of ['c', 'a', 'p']) if (q[f]) q[f] = q[f].map(v => v * k); if (q.r !== undefined) q.r = Array.isArray(q.r) ? q.r.map(v => v * k) : q.r * k; } return P; };
const w76Flame = P => list => { for (const q of list) P.push(Object.assign({b:'flame'}, q)); };
for (const z of ['crys', 'crysL']) { R3D.EMIT.add(z); R3D_MUTE_SKIP.add(z); }

Object.assign(W3D_KINDS, {
  /* ---------------------------------------------------------------- camp --- */
  m_plot:MPK([120, 80, 14], se => { const P = [], add = wAdd(P);
    const st = [[-36, -10], [36, -10], [30, 12], [-30, 12]];
    for (const [x, z] of st) add([{t:'cap', a:[x, 0, z], p:[x, 12, z], r:1.8, z:'wood'}, {t:'ell', c:[x, 12.4, z], r:[1.7, 1.2, 1.7], z:'stake'}]);
    for (let i = 0; i < 4; i++){ const [x1, z1] = st[i], [x2, z2] = st[(i + 1) % 4]; add([{t:'cap', a:[x1, 9, z1], p:[x2, 9, z2], r:0.9, z:'rope'}]); }
    add([{t:'ell', c:[0, 0.6, -6], r:[4, 1.2, 3], z:'dirt'}, {t:'cap', a:[0, 0, -6], p:[0, 40, -6], r:1.8, z:'woodD'},
      {t:'box', c:[0, 32, -4.6], r:[18, 8.5, 1], z:'board'}, {t:'box', c:[0, 40.6, -4.6], r:[18.4, 0.8, 1.3], z:'woodL'}]);
    for (const [x, y, w] of [[-1, 34.5, 12], [-4, 30, 8.5]]) add([{t:'box', c:[x, y, -3.4], r:[w, 0.6, 0.2], z:'ink'}]);
    if (se === 'winter') add([{t:'box', c:[0, 41.8, -4.6], r:[18, 0.7, 1.4], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {board:'#c8a878', stake:'#d8c8a0', rope:'#e0d4b0', dirt:'#6a5236'}), keepZones:['board', 'rope']}; }),
  dc_bones:{frame:[50, 30, 8], view:2.3, mirror:true, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[-9, 1.2, 1], p:[3, 1.2, -1], r:1, z:'bone'}, {t:'ell', c:[-9.6, 1.4, 1.6], r:[1.4, 1.2, 1.2], z:'bone'}, {t:'ell', c:[-9.6, 1.4, 0.2], r:[1.4, 1.2, 1.2], z:'bone'},
      {t:'ell', c:[3.6, 1.4, -0.4], r:[1.4, 1.2, 1.2], z:'bone'}, {t:'ell', c:[3.6, 1.4, -1.8], r:[1.4, 1.2, 1.2], z:'bone'}, {t:'cap', a:[-6, 1, -4], p:[0, 1, 4], r:0.8, z:'boneD'}]);
    add([{t:'ell', c:[8, 3.4, 2], r:[3.6, 3.2, 3.4], z:'bone'}, {t:'ell', c:[8.4, 1.6, 4.2], r:[2.2, 1.4, 1.6], z:'bone'}, {t:'ell', c:[6.9, 3.8, 5], r:[0.9, 0.9, 0.5], z:'socket'}, {t:'ell', c:[9.5, 3.8, 5], r:[0.9, 0.9, 0.5], z:'socket'}]);
    for (let i = 0; i < 3; i++) add([{t:'cap', a:[-3 + i * 2.4, 0.8, -6], p:[-4 + i * 2.4, 2.6, -2.4], r:0.5, z:'boneD'}]);
    if (se === 'winter') add([{t:'ell', c:[8, 6.2, 2], r:[3, 0.8, 2.6], z:'snow'}]);
    return {parts:w76Scale(P, 1.8), zones:SKZ(se, null, {bone:'#e0d6bc', boneD:'#c4b898', socket:'#2a2218'}), keepZones:['bone', 'boneD']}; }},
  dc_benchlog:{frame:[60, 30, 8], view:2, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[-10, 4, 0], p:[10, 4, 0], r:4, z:'log'}, {t:'ell', c:[-12.4, 4, 0], r:[1.2, 3.2, 3.2], z:'ring'}, {t:'ell', c:[12.4, 4, 0], r:[1.2, 3.2, 3.2], z:'ring'},
      {t:'box', c:[0, 7.7, 0], r:[9, 0.4, 2], z:'woodL'}, {t:'cap', a:[-4, 1.6, 3.6], p:[-1, 0.6, 7], r:0.9, z:'woodD'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 8.2, 0], r:[10, 0.9, 2.8], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {log:'#5a3a1a', ring:'#c8a070'}), keepZones:['ring']}; }},

  /* ------------------------------------------------------------- fire --- */
  m_flames:{frame:[60, 60, 6], view:2, keep:0.6, clip:'flicker', seasonPass:false, build:se => { const P = [], add = wAdd(P), fl = w76Flame(P);
    add([{t:'ell', c:[0, 0.6, 0], r:[9, 0.6, 6], z:'ash'}, {t:'cap', a:[-7, 1, -2], p:[6, 2.4, 3], r:1.4, z:'char'}, {t:'cap', a:[-5, 1, 4], p:[7, 1.6, -3], r:1.2, z:'char'}, {t:'ell', c:[2, 1.6, 1], r:[1.4, 1, 1.4], z:'ember'}]);
    fl([{t:'ell', c:[0, 8, 0], r:[7, 8, 5], z:'flame'}, {t:'ell', c:[1, 14, 0], r:[4.4, 7, 3.6], z:'flame2'}, {t:'ell', c:[-2.6, 18, 1], r:[2.2, 4.4, 2], z:'flame2'},
      {t:'ell', c:[3, 17, -1], r:[1.8, 3.8, 1.8], z:'flame'}, {t:'ell', c:[0, 23, 0], r:[1.2, 2.6, 1.2], z:'flame2'}]);
    return {parts:w76Scale(P, 1.5), bones:{flame:{parent:'root', off:[0, 3, 0]}}, zones:{char:'#2a2420', ash:'#3a3230', ember:'#ff7a2a', flame:'#ff9a30', flame2:'#ffd860', snow:'#eef2f6'}, keepZones:['char', 'ash']}; }},

  /* ------------------------------------------------------------ traps --- */
  m_trap_caltrops:MPK([60, 40, 14], se => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-12, -4], [-4, -8], [6, -6], [13, 2], [-9, 6], [2, 5], [9, 9]])
      add([{t:'cap', a:[x, 0.6, z], p:[x, 3.8, z], r:0.7, z:'steel'}, {t:'cap', a:[x, 0.6, z], p:[x + 2.8, 0.4, z + 1.4], r:0.7, z:'steel'}, {t:'cap', a:[x, 0.6, z], p:[x - 2.8, 0.4, z + 1.4], r:0.7, z:'steel'}, {t:'cap', a:[x, 0.6, z], p:[x, 0.4, z - 3], r:0.7, z:'steel'}]);
    return {parts:P, zones:SKZ(se, null, {steel:'#9aa0a8'}), keepZones:['steel']}; }),
  m_trap_beartrap:MPK([60, 40, 14], se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 1, 0], r:[13, 1, 8], z:'steelD'}, {t:'ell', c:[0, 1.5, 0], r:[9.5, 0.6, 5.4], z:'dark'}, {t:'ell', c:[0, 2, 0], r:[3, 0.5, 2], z:'steel'}]);
    for (let i = 0; i < 12; i++){ const a = i / 12 * TAU, x = Math.cos(a) * 11, z = Math.sin(a) * 6.6; add([{t:'cap', a:[x, 1.4, z], p:[x * 0.9, 5, z * 0.9], r:0.7, z:'steel'}]); }
    add([{t:'cap', a:[13, 0.8, 0], p:[20, 0.6, 4], r:0.6, z:'iron'}, {t:'cap', a:[20, 0, 4], p:[20, 3, 4], r:1, z:'woodD'}]);
    return {parts:P, zones:SKZ(se, null, {steel:'#b8c0c8', steelD:'#5f6870', dark:'#2a2a2a'}), keepZones:['steel', 'steelD']}; }),
  m_trap_tripwire:MPK([60, 40, 14], se => { const P = [], add = wAdd(P);
    for (const x of [-18, 18]) add([{t:'cap', a:[x, 0, 0], p:[x, 12, 0], r:1.2, z:'wood'}]);
    add([{t:'cap', a:[-18, 7, 0], p:[18, 7, 0], r:0.7, z:'line'}, {t:'ell', c:[15.6, 10.6, 1.8], r:[2.2, 2.6, 2.2], z:'gold'}, {t:'ell', c:[15.6, 8.2, 1.8], r:[0.7, 0.7, 0.7], z:'iron'}, {t:'cap', a:[18, 12, 0], p:[15.6, 13, 1.8], r:0.5, z:'line'}]);
    return {parts:P, zones:SKZ(se, null, {line:'#d8d0c0'}), keepZones:['gold', 'line']}; }),
  m_trap_deadfall:MPK([60, 50, 14], se => { const P = [], add = wAdd(P);
    for (const x of [-19, 19]) add([{t:'cap', a:[x, 0, -1], p:[x, 22, -1], r:1.3, z:'woodD'}]);
    add([{t:'cap', a:[-19, 22, -1], p:[19, 22, -1], r:0.9, z:'woodD'}, {t:'cap', a:[0, 22, -1], p:[0, 24, -1], r:0.5, z:'line'}, {t:'cap', a:[-19, 1.2, 5], p:[19, 1.2, 5], r:0.6, z:'line'}]);
    [[6, 'wood'], [11.6, 'woodL'], [17.2, 'wood']].forEach(([y, z], i) => { const h = 13 - i; add([{t:'cap', a:[-h, y, -3], p:[h, y, -3], r:2.7, z}, {t:'ell', c:[-h - 2.3, y, -3], r:[0.7, 2.4, 2.4], z:'ring'}, {t:'ell', c:[h + 2.3, y, -3], r:[0.7, 2.4, 2.4], z:'ring'}]); });
    return {parts:P, zones:SKZ(se, null, {line:'#e8e0d0', ring:'#c8a070'}), keepZones:['line', 'ring']}; }),
  m_trap_firepot:MPK([60, 40, 14], se => { const P = [], add = wAdd(P), fl = w76Flame(P);
    [[-12, -2], [0, 3], [12, -1]].forEach(([x, z]) => add([{t:'ell', c:[x, 0.6, z], r:[6.4, 0.6, 5.6], z:'dirt'}, {t:'ell', c:[x, 4.4, z], r:[5.2, 5, 5.2], z:'clay'}, {t:'ell', c:[x, 2.6, z + 3], r:[3.6, 1, 2.4], z:'clayD'},
      {t:'cap', a:[x, 8.4, z], p:[x, 10, z], r:2.6, z:'clayL'}, {t:'ell', c:[x, 10.4, z], r:[2, 0.4, 2], z:'oil'}, {t:'cap', a:[x, 10, z], p:[x + 0.8, 13.4, z], r:0.5, z:'line'}]));
    fl([{t:'ell', c:[0.8, 14.6, 3], r:[1.1, 1.8, 1.1], z:'flame2'}]);
    return {parts:P, bones:{flame:{parent:'root', off:[0, 0, 0]}}, zones:SKZ(se, null, {clay:'#a0603a', clayD:'#7a4426', clayL:'#c08050', oil:'#1a1410', line:'#e8e0d0', dirt:'#4a3a24', flame2:'#ffb040'}), keepZones:['clay', 'clayD', 'clayL']}; }),
  m_trap_stakes:MPK([60, 50, 14], se => { const P = [], add = wAdd(P);
    [[-15, 16], [-5, 20], [5, 18], [15, 14]].forEach(([x, h]) => add([{t:'ell', c:[x, 0.6, 0], r:[3, 0.8, 2.6], z:'dirt'}, {t:'cap', a:[x, 0, 0], p:[x, h, 3], r:1.6, z:'wood'}, {t:'ell', c:[x, h + 0.6, 3.1], r:[1, 1.8, 1], z:'stakeT'}]));
    if (se === 'winter') add([{t:'ell', c:[0, 0.6, 1], r:[18, 0.8, 4], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {stakeT:'#d8c8a0', dirt:'#4a3a24'}), keepZones:['stakeT']}; }),

  /* ------------------------------------------------------- objectives --- */
  m_crystal:MPK([60, 80, 8], se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 3, 0], r:[14, 4, 10], z:'rock'}, {t:'ell', c:[8, 2, 5], r:[6, 3, 4], z:'rockD'},
      {t:'ell', c:[0, 22, 0], r:[4.4, 20, 4.4], z:'crys'}, {t:'ell', c:[-7, 14, 2], r:[3, 12, 3], rot:[0, 0, 0.35], z:'crysD'}, {t:'ell', c:[7, 15, -1], r:[3.4, 13, 3.4], rot:[0, 0, -0.3], z:'crysD'},
      {t:'ell', c:[2, 10, 6], r:[2.4, 8, 2.4], rot:[0.3, 0, -0.2], z:'crys'}, {t:'ell', c:[-1, 26, 3.4], r:[0.8, 12, 0.6], z:'crysL'}]);
    if (se === 'winter') add([{t:'ell', c:[-6, 5.6, 2], r:[7, 1.2, 5], z:'snow'}]);
    return {parts:w76Scale(P, 1.3), zones:SKZ(se, null, {crys:'#7fd8ff', crysD:'#4aa8e0', crysL:'#e8fcff', rock:'#5a5a66', rockD:'#44444e'}), keepZones:['crys', 'crysD', 'crysL']}; }),
  m_relic_held:MPK([40, 40, 6], se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 5, 0], r:[7, 5, 4.4], z:'gold'}, {t:'ell', c:[0, 11, 0], r:[6, 2.6, 4], z:'gold'}, {t:'ell', c:[0, 14.4, 0], r:[1.6, 1.6, 1.6], z:'orb'}, {t:'box', c:[0, 5, 4.6], r:[2, 2.6, 0.4], z:'orb'}]);
    return {parts:w76Scale(P, 1.3), zones:SKZ(se, null, {orb:'#9fd0ff'}), keepZones:['gold', 'orb']}; }, {seasonPass:false}),

  /* --------------------------------------------------------- blip tokens --- */
  m_tracks:MPK([60, 30, 10], se => { const P = [], add = wAdd(P);
    for (let i = 0; i < 5; i++){ const x = -16 + i * 8, z = i % 2 ? 3 : -3; add([{t:'ell', c:[x, 0.25, z], r:[3, 0.3, 1.8], z:'print'}, {t:'ell', c:[x + 3.8, 0.25, z], r:[1, 0.3, 1.4], z:'print'}]); }
    return {parts:P, zones:SKZ(se, null, {print:'#3a2e22'}), keepZones:['print']}; }),
  m_pit:MPK([60, 34, 12], se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 0.3, 0], r:[16, 0.4, 9], z:'hole'}]);
    for (let i = 0; i < 12; i++){ const a = i / 12 * TAU; add([{t:'ell', c:[Math.cos(a) * 16.5, 0.8, Math.sin(a) * 9.5], r:[3, 1.2, 2], z:'dirt'}]); }
    for (const [x, z] of [[-9, -3], [-4, 2], [1, -4], [6, 3], [10, -1], [-1, 5]]) add([{t:'cap', a:[x, -1, z], p:[x, 5, z], r:0.8, z:'steel'}]);
    add([{t:'box', c:[13, 1.2, 6], r:[5, 0.6, 2], rot:[0, 0.5, 0], z:'wood'}]);
    return {parts:P, zones:SKZ(se, null, {hole:'#1a1410', dirt:'#5a4630', steel:'#b8c0c8'}), keepZones:['hole', 'steel']}; }),
  m_hide:MPK([60, 40, 12], se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[-12, 0, 6], p:[-7, 14, 0], r:0.9, z:'wood'}, {t:'cap', a:[12, 0, 6], p:[7, 14, 0], r:0.9, z:'wood'},
      {t:'ell', c:[0, 6, 0], r:[16, 7, 10], z:'leafD'}, {t:'ell', c:[-6, 9, -2], r:[8, 6, 6], z:'leaf'}, {t:'ell', c:[7, 9, -1], r:[8, 5, 6], z:'leafM'}, {t:'ell', c:[0, 4, 8.6], r:[6, 3.4, 1.6], z:'hole'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 12.4, -1], r:[11, 2, 7], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {leaf:'#5f7e3e', leafD:'#3e5a28', leafM:'#6a8a40', hole:'#1a1410'})}; }),

  /* ---------------------------------------------------------- the tavern --- */
  tv_ale:MPK([40, 40, 6], se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[0, 1.6, 0], p:[0, 8, 0], r:3.4, z:'tank'}, {t:'ell', c:[0, 2.6, 0], r:[3.7, 0.5, 3.7], z:'iron'}, {t:'ell', c:[0, 7.4, 0], r:[3.7, 0.5, 3.7], z:'iron'},
      {t:'ell', c:[0, 10.4, 0], r:[3.4, 1.6, 3.4], z:'foam'}, {t:'ell', c:[2.4, 9, 2], r:[0.9, 1.4, 0.7], z:'foam'},
      {t:'cap', a:[3.4, 3, 0], p:[5.6, 5.6, 0], r:0.7, z:'tankD'}, {t:'cap', a:[5.6, 5.6, 0], p:[3.4, 8, 0], r:0.7, z:'tankD'}]);
    return {parts:w76Scale(P, 1.8), zones:SKZ(se, null, {tank:'#8a5a2b', tankD:'#5a3a1a', foam:'#f4ecd8'}), keepZones:['foam']}; })
});
W3D_DECOR.bones = 'dc_bones';
// Each of these adds its own winter snow; the general seasons pass would scatter flowers round traps and bones.
for (const k of ['m_plot', 'dc_bones', 'dc_benchlog', 'm_crystal', 'm_tracks', 'm_pit', 'm_hide', 'tv_ale'].concat(Object.keys(W3D_KINDS).filter(k => /^m_trap_/.test(k)))) W3D_KINDS[k].seasonPass = false;

/* ------------------------------------------------------------- helpers --- */
// The empty building plot. o is the camp object (its foot is o.y).
function w3dPlot(o){ return w3dDraw('m_plot', o.x, o.y + 2); }
// The three bench logs round the camp fire. All or nothing, so the pixel logs never mix with 3D ones.
const BENCH_LOGS = [[-72, 4, 28], [36, 6, 26], [-12, 34, 30]];
// A patch of burning ground: ground fire on a contract map, or a fire in an overrun district.
function w3dFlames(x, y, t){ return w3dDraw('m_flames', x, y + 5, {t}); }
// An enemy trap. s is a size relative to the pixel trap (the Circle of Iron's stakes are 0.7).
function w3dTrap(k, x, y, s){ return W3D_KINDS['m_trap_' + k] ? w3dMapProp('m_trap_' + k, x, y + (k === 'stakes' ? 4 : 2) * (s || 1), {scale:s}) : false; }
// A scouted Blip Token: tracks, a spike pit or a hide.
function w3dToken(k, x, y){ return w3dMapProp(k, x, y); }
/* ===== END INDEX 76 ======================================================= */

