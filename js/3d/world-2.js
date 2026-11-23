/* js/3d/world-2.js (INT-1 step 2, 2026-11-16): INDEX 66 to 69 (fence, barge, trees, seasons, planned camps).
   Cut unchanged from the inline script in index.html (old lines 22331 to 23384). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 66 - THE GRAVEYARD FENCE, AND 3D BARGE, WAREHOUSE AND WAYSTATION
   GRAVEYARD  The fence was four separate pieces seen from a slight angle, so
              its sides were too short and its corners did not meet. It is now
              one closed rectangle seen straight on, sized to the plot: back
              and side runs behind the graves, the front run in front of them,
              posts at every corner and the gate gap on the left, as in the
              pixel version.
   HOLDINGS   With "3D world" on, every facility is 3D in all four holdings, in
              that holding's style, with its sign, its four seasons and a
              damaged version for raid repairs:
                Barge       deck cabins with portholes, tarps, hatches with
                            crates and barrels, masts with crow's nests, a deck
                            bombard, a prow shrine, rigging, boarding nets and
                            the Great Cabin, the Gangplank Brazier and the
                            Purser's Hatch
                Warehouse   brick rooms under the great roof, lofts on posts,
                            iron cages, a sparring pit, furnaces, tanning vats,
                            rooftop ladders, barricaded doors and the Foreman's
                            Office, the Barrel Fire and the Quartermaster Counter
                Waystation  the fort's buildings built into old imperial ruins:
                            weathered mossy stone, broken wall stubs, timber
                            patches, ivy and rubble; the Waystone Hall and the
                            Hearth Ruin too
              The barge's deck and the warehouse's floor are drawn in the 3D
              look as well. The Edelos Trade Wagons are 3D in every holding.
   STILL PIXEL  The barge's masts, the warehouse pillars and the Memorial
              Rail and Memorial Wall.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 66.

   3D DESIGN NOTE: WORLD, ADDENDUM
     SKINS    Barge and Warehouse facilities are built from the skin type in
              BARGE_LOOK / WARE_LOOK (t: cabin, tarp, galley, hatch, rigging,
              mast, bench, cannon, shrine, nets, loft, room, stall, exstall,
              cage, pit, ladder, furnace, vat, barricade) by W3D_SKIN[t](L, se),
              which reads the look's colour (c, roof), glyph (g) and flags
              (big, dark, cross, orb, smoke). Kinds are registered on first use
              as sk_<holding>_<facility> (and _dmg). To restyle one facility,
              change its skin look; to add a skin type, add a W3D_SKIN entry.
     RUINS    The Waystation reuses the fort kinds through w3dRuin(build):
              stone becomes weathered and mossy, some upper stones fall away,
              old wall stubs, timber patches and ivy are added. Kinds ws_<kind>.
     SCREEN AND DEPTH  1 unit of x is 1 screen pixel, but 1 unit of depth (z)
              is only sin(R3D.PITCH) = about 0.5 screen pixels. Anything that
              must cover a known area on screen (a fenced plot, a rug, a deck)
              needs depth = screen height / W3D_ZK. Seen at view 2.3 it is also
              skewed; use view 2 for anything that must line up with the
              pixel rectangles of the camp.
============================================================================ */
const W3D_ZK = Math.sin(R3D.PITCH), W3D_YK = Math.cos(R3D.PITCH);
const wKind = (name, mk) => { if (!W3D_KINDS[name]) W3D_KINDS[name] = mk(); return name; };
const wDmg = name => wKind(name + '_dmg', () => Object.assign({}, W3D_KINDS[name], {build:w3dDamaged(W3D_KINDS[name].build)}));

/* ------------------------------------------------------------ graveyard --- */
function gyBuild(part){
  return se => {
    const g = GRAVE, P = [], add = wAdd(P), hw = g.w / 2, hd = g.h / 2 / W3D_ZK, h = 14 / W3D_YK;
    const post = (x, z) => { add([{t:'box', c:[x, h / 2, z], r:[1.6, h / 2, 1.6], z:'wood'}]); if (se === 'winter') add([{t:'box', c:[x, h + 0.9, z], r:[1.8, 0.9, 1.8], z:'snow'}]); };
    const railX = (z) => { for (const y of [h * 0.42, h * 0.85]){ add([{t:'box', c:[0, y, z + 1], r:[hw + 1.6, 1, 0.7], z:'woodL'}]); if (se === 'winter') add([{t:'box', c:[0, y + 1.2, z + 1], r:[hw, 0.4, 0.8], z:'snow'}]); } };
    const railZ = (x, z0, z1) => { for (const y of [h * 0.42, h * 0.85]) add([{t:'box', c:[x + 1, y, (z0 + z1) / 2], r:[0.7, 1, (z1 - z0) / 2], z:'woodL'}]); };
    if (part === 'front'){ for (let x = -hw; x <= hw + 0.1; x += 14) post(x, hd); railX(hd); }
    else {
      for (let x = -hw; x <= hw + 0.1; x += 14) post(x, -hd); railX(-hd);
      const gate = 16 / W3D_ZK;
      for (let z = -hd; z <= hd + 0.1; z += 14 / W3D_ZK){ post(hw, z); if (Math.abs(z) > gate) post(-hw, z); }
      railZ(hw, -hd, hd); railZ(-hw, -hd, -gate); railZ(-hw, gate, hd);
      add([{t:'box', c:[-hw, h * 0.6, gate], r:[2.2, h * 0.6, 2.2], z:'woodD'}, {t:'box', c:[-hw, h * 0.6, -gate], r:[2.2, h * 0.6, 2.2], z:'woodD'}]);
    }
    return {parts:P, zones:W3K.zones(se)};
  };
}
W3D_KINDS.gy_back = {frame:[100, 100, 6], view:2, keep:0.7, clip:'still', build:gyBuild('back')};
W3D_KINDS.gy_front = {frame:[100, 100, 6], view:2, keep:0.7, clip:'still', build:gyBuild('front')};
w3dGraveyard = function(hot){
  if (holding() !== 'fort') return false;
  const g = GRAVE, x0 = g.x - g.w / 2, y0 = g.y - g.h / 2, dead = META.memorial || [], gl = y0 + g.h + 4;
  ctx.fillStyle = hot ? 'rgba(90,80,60,.4)' : 'rgba(70,62,46,.3)'; ctx.fillRect(x0, y0, g.w, g.h);
  let ok = w3dDraw('gy_back', g.x, gl);
  const cols = 6;
  dead.slice(-18).forEach((d, i) => { const cx = x0 + 22 + (i % cols) * ((g.w - 44) / (cols - 1)), cy = y0 + 34 + Math.floor(i / cols) * 34;
    ok = w3dDraw(typeof d === 'object' && d.leader ? 'w_stone' : 'w_cross', cx, cy + 16) && ok; });
  if (!dead.length){ ctx.fillStyle = 'rgba(240,230,210,.6)'; ctx.font = `italic ${typeof hudPx === 'function' ? hudPx(12) : 14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText(holdKey() === 'waystation' ? 'No cairns yet' : 'No graves yet', g.x, g.y + 6); }
  ok = w3dDraw('gy_front', g.x, gl) && ok;
  w3dDraw('oak', x0 + g.w + 26, y0 + 25, {t:CAMP.t});
  if (hot) campLabel(g.x, y0 - 12, HS().grave, dead.length ? `${dead.length} fallen` : 'Empty, for now');
  return ok;
};

/* --------------------------------------------------------- skin kit --- */
const SKZ = (se, L, extra) => W3K.zones(se, Object.assign({glyph:'#2a2520', deck:'#a07a4a', deckD:'#6a4a2a', brick:'#7a3a2a', brickL:'#9a5040', rope:'#c8b890',
  canvas:(L && L.c) || '#c9b48a', stripe:shade((L && L.c) || '#c9b48a', 0.75), rfX:(L && L.roof) || '#5a4a3a', rfXD:shade((L && L.roof) || '#5a4a3a', 0.68),
  doorC:(L && L.c) || '#6a4a2a', crate:'#9a6a3a', water:w3dZ('water', se), tan:'#6a3a1a', redX:'#c83030', orb:'#9fe0ff', bone:'#e0d6bc'}, extra || {}));
const sgn = (add, L, x, y, z, px) => { if (L && L.g) W3K.sign(add, L.g, x, y, z, px || 2.4); };
const barrel = (add, x, z, s) => { s = s || 1; add([{t:'ell', c:[x, 6 * s, z], r:[4.6 * s, 6.2 * s, 4.6 * s], z:'wood'}, {t:'ell', c:[x, 3 * s, z], r:[4.8 * s, 0.6, 4.8 * s], z:'iron'}, {t:'ell', c:[x, 9 * s, z], r:[4.8 * s, 0.6, 4.8 * s], z:'iron'}]); };
const crate = (add, x, z, s) => { s = s || 1; add([{t:'box', c:[x, 5 * s, z], r:[5 * s, 5 * s, 5 * s], z:'crate'}, {t:'box', c:[x, 5 * s, z + 5 * s + 0.1], r:[5 * s, 0.5, 0.2], z:'woodD'}, {t:'box', c:[x, 5 * s, z + 5 * s + 0.1], r:[0.5, 5 * s, 0.2], z:'woodD'}]); };
const snowTop = (add, se, c, r) => { if (se === 'winter') add([{t:'box', c, r, z:'snow'}]); };
const W3D_SKIN = {
  cabin:(L, se) => { const P = [], add = wAdd(P), W = L.big ? 44 : 34, D = 22, H = 40;
    W3K.house(add, {W, D, H, roofH:12, wall:'wood', roof:'rfX', windows:[], doorX:-W * 0.45, doorW:7, doorH:13}, se);
    for (const x of L.big ? [-6, 14, 30] : [6, 22]) add([{t:'ell', c:[x, 26, D + 0.8], r:[4, 4, 0.8], z:'iron'}, {t:'ell', c:[x, 26, D + 1.3], r:[2.8, 2.8, 0.6], z:'winglow'}]);
    sgn(add, L, 0, H + 9, D + 1, 2.2); add([{t:'box', c:[0, 1.5, D + 6], r:[W + 4, 1.5, 5], z:'deckD'}]);
    return {parts:P, zones:SKZ(se, L), keepZones:['rfX']}; },
  tarp:(L, se) => { const P = [], add = wAdd(P);
    W3K.tent(add, {W:26, D:22, H:30}, se);
    if (L.cross) add([{t:'box', c:[0, 18, 22.6], r:[6, 1.8, 0.5], z:'redX'}, {t:'box', c:[0, 18, 22.6], r:[1.8, 6, 0.5], z:'redX'}]);
    for (const sx of [1, -1]) add([{t:'cap', a:[sx * 28, 0, 18], p:[sx * 22, 10, 14], r:0.4, z:'rope'}]);
    crate(add, 34, 10); barrel(add, -34, 12);
    if (L.g){ add([{t:'box', c:[38, 14, 24], r:[1, 14, 1], z:'wood'}]); sgn(add, L, 38, 30, 25, 2); }
    return {parts:P, zones:SKZ(se, L), keepZones:['canvas', 'stripe', 'redX']}; },
  galley:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 14, 0], r:[16, 14, 12], z:'iron'}, {t:'box', c:[0, 28.6, 0], r:[17, 0.8, 13], z:'metal'}, {t:'box', c:[0, 9, 12.2], r:[9, 6, 0.5], z:'fire'}, {t:'box', c:[0, 10, 12.4], r:[5, 3, 0.4], z:'fire2'},
      {t:'cap', a:[10, 29, -6], p:[10, 62, -6], r:3, z:'iron'}, {t:'ell', c:[-6, 32.4, 2], r:[5, 4, 5], z:'iron'}, {t:'ell', c:[-6, 36, 2], r:[4, 0.6, 4], z:'stew'}, {t:'ell', c:[6, 31.4, 4], r:[3, 2.4, 3], z:'pot'}]);
    barrel(add, -26, 8); crate(add, 26, 6); crate(add, 26, 6 - 10.2, 0.8);
    add([{t:'box', c:[0, 1, 18], r:[24, 1, 6], z:'deckD'}]);
    snowTop(add, se, [0, 30, 0], [17, 0.8, 13]);
    return {parts:P, zones:SKZ(se, L, {stew:'#8a5a2a', pot:'#a06a44'})}; },
  hatch:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 4, 0], r:[22, 4, 15], z:'wood'}, {t:'box', c:[0, 8.4, 0], r:[22.6, 0.6, 15.6], z:'woodL'}, {t:'box', c:[0, 8, 0], r:[19, 0.6, 12.4], z:L.dark ? 'tentIn' : 'deckD'}]);
    if (L.dark) for (let x = -16; x <= 16; x += 4) add([{t:'box', c:[x, 9, 0], r:[0.7, 0.8, 12.4], z:'iron'}]);
    else for (let x = -16; x <= 16; x += 4) add([{t:'box', c:[x, 8.8, 0], r:[1.2, 0.6, 12.4], z:'woodD'}]);
    crate(add, -30, 8); crate(add, -30, 8 - 10.4, 0.85); barrel(add, 30, 10); barrel(add, 38, -2, 0.9);
    if (L.smoke) for (let k = 0; k < 3; k++) add([{t:'ell', c:[4 + k * 2, 18 + k * 9, -4], r:[4 + k, 3.4 + k, 4 + k], z:'smoke'}]);
    crate(add, 30, -12, 1.2); crate(add, 30, -12 - 12.5, 1); crate(add, 30, -12 - 23, 0.8);
    if (L.g){ add([{t:'box', c:[-38, 22, 18], r:[1.2, 22, 1.2], z:'wood'}]); sgn(add, L, -38, 44, 19.4, 2.6); }
    if (se === 'winter') add([{t:'box', c:[0, 9.8, 0], r:[22.6, 0.6, 15.6], z:'snow'}]);
    return {parts:P, zones:SKZ(se, L, {smoke:'#9a948a'})}; },
  rigging:(L, se) => { const P = [], add = wAdd(P);
    for (const x of [-30, 30]) add([{t:'cap', a:[x, 0, 0], p:[x, 64, 0], r:2, z:'wood'}]);
    add([{t:'cap', a:[-32, 60, 0], p:[32, 60, 0], r:1.4, z:'wood'}]);
    for (let k = -4; k <= 4; k++) add([{t:'cap', a:[k * 6, 60, 0], p:[k * 6 + 8, 4, 2], r:0.35, z:'rope'}, {t:'cap', a:[k * 6, 60, 0], p:[k * 6 - 8, 4, 2], r:0.35, z:'rope'}]);
    for (let y = 14; y < 60; y += 12) add([{t:'cap', a:[-30, y, 1], p:[30, y, 1], r:0.35, z:'rope'}]);
    add([{t:'cap', a:[0, 60, 10], p:[0, 44, 10], r:0.4, z:'rope'}, {t:'ell', c:[0, 36, 10], r:[5, 8, 4], z:'straw'}, {t:'ell', c:[0, 47, 10], r:[3.4, 3.4, 3.4], z:'sack'}]);
    return {parts:P, zones:SKZ(se, L, {sack:'#c8b088'})}; },
  mast:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[0, 0, 0], p:[0, 92, 0], r:3, z:'wood'}, {t:'ell', c:[0, 70, 0], r:[12, 3, 12], z:'woodL'}]);
    for (let k = 0; k < 10; k++){ const a = k / 10 * TAU; add([{t:'cap', a:[Math.cos(a) * 11, 70, Math.sin(a) * 11], p:[Math.cos(a) * 11, 77, Math.sin(a) * 11], r:0.6, z:'wood'}]); }
    add([{t:'ell', c:[0, 77, 0], r:[11.6, 0.8, 11.6], z:'woodD'}]);
    for (const sx of [1, -1]) add([{t:'cap', a:[0, 66, 0], p:[sx * 22, 0, 6], r:0.4, z:'rope'}]);
    if (L.orb) add([{t:'ell', c:[0, 98, 0], r:[5, 5, 5], z:'orb'}, {t:'ell', c:[0, 98, 0], r:[7, 1, 7], z:'gold'}]);
    else add([{t:'box', c:[9, 88, 0], r:[9, 5, 0.5], z:'banner'}]);
    sgn(add, L, 0, 30, 4, 2.2); snowTop(add, se, [0, 71.8, 0], [12, 1, 12]);
    let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
    return {parts:P, zones:SKZ(se, L, {banner:bn})}; },
  bench:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 14, 0], r:[22, 1.6, 9], z:'woodL'}]); for (const [x, z] of [[-19, -7], [19, -7], [-19, 7], [19, 7]]) add([{t:'box', c:[x, 6.5, z], r:[1.2, 6.5, 1.2], z:'wood'}]);
    add([{t:'box', c:[-8, 16.4, 0], r:[8, 0.4, 2.4], z:'metal'}, {t:'cap', a:[8, 16, -3], p:[16, 16, 3], r:0.8, z:'wood'}, {t:'box', c:[16, 17, 3], r:[2, 1.6, 1.4], z:'iron'}]);
    for (let k = 0; k < 4; k++) add([{t:'box', c:[-34, 1.2 + k * 2.2, 8], r:[12, 1, 3], z:k % 2 ? 'woodL' : 'plank'}]);
    if (L.g === 'stake') for (const x of [26, 31, 36]) add([{t:'cap', a:[x, 0, -4], p:[x, 18, -4], r:1.6, z:'wood'}, {t:'ell', c:[x, 20, -4], r:[1.2, 2.4, 1.2], z:'woodL'}]);
    if (L.g){ add([{t:'box', c:[30, 14, 12], r:[1, 14, 1], z:'wood'}]); sgn(add, L, 30, 30, 13, 2.2); }
    snowTop(add, se, [0, 16.2, 0], [22, 0.6, 9]);
    return {parts:P, zones:SKZ(se, L, {plank:'#c8a070'})}; },
  cannon:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 8, 0], r:[9, 4, 14], z:'wood'}, {t:'cap', a:[0, 14, -10], p:[0, 18, 22], r:4.6, z:'iron'}, {t:'ell', c:[0, 18, 22.4], r:[5.4, 5.4, 1.4], z:'iron'}, {t:'ell', c:[0, 14, -12], r:[3.4, 3.4, 3.4], z:'iron'}]);
    for (const sx of [1, -1]) for (const z of [-8, 8]) add([{t:'ell', c:[sx * 9.6, 5, z], r:[1.4, 5, 5], z:'woodD'}]);
    for (const [x, z, y] of [[22, 0, 2.6], [27, 2, 2.6], [24.5, 1, 6.4], [-22, 6, 2.6]]) add([{t:'ell', c:[x, y, z], r:[2.6, 2.6, 2.6], z:'iron'}]);
    barrel(add, -24, -8); sgn(add, {g:'gear'}, 28, 24, 10, 1.8); add([{t:'box', c:[28, 10, 9], r:[1, 10, 1], z:'wood'}]);
    snowTop(add, se, [0, 12.6, 0], [9, 0.6, 14]);
    return {parts:P, zones:SKZ(se, L)}; },
  shrine:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 2, 0], r:[24, 2, 14], z:'stoneD'}, {t:'box', c:[0, 10, 0], r:[12, 6, 7], z:'stone'}, {t:'box', c:[0, 16.6, 0], r:[13, 0.8, 8], z:'stoneL'}]);
    for (const x of [-8, -3, 3, 8]) add([{t:'cap', a:[x, 17, 4], p:[x, 21, 4], r:0.8, z:'linen'}, {t:'ell', c:[x, 22.4, 4], r:[0.8, 1.4, 0.8], z:'fire2'}]);
    add([{t:'cap', a:[0, 17, -4], p:[0, 40, -4], r:4, z:'statue'}, {t:'ell', c:[0, 44, -4], r:[3.6, 4, 3.6], z:'statue'}, {t:'cap', a:[-3, 34, -4], p:[-9, 44, -4], r:1.4, z:'statue'}, {t:'cap', a:[3, 34, -4], p:[9, 44, -4], r:1.4, z:'statue'},
      {t:'ell', c:[0, 48, -5], r:[6, 6, 0.6], z:'gold'}]);
    W3K.sign(add, 'sun', 0, 9, 7.6, 1.5); snowTop(add, se, [0, 17.6, 0], [13, 0.6, 8]);
    return {parts:P, zones:SKZ(se, L, {statue:'#b4ae9e', linen:'#ece4d0'})}; },
  nets:(L, se) => { const P = [], add = wAdd(P);
    for (let x = -42; x <= 42; x += 14) add([{t:'box', c:[x, 14, 0], r:[1.4, 14, 1.4], z:'wood'}]);
    add([{t:'box', c:[0, 27, 0], r:[44, 1.2, 1.2], z:'woodL'}]);
    for (let x = -42; x < 42; x += 5) add([{t:'cap', a:[x, 27, 0.8], p:[x + 6, 2, 0.8], r:0.3, z:'rope'}, {t:'cap', a:[x + 6, 27, 0.8], p:[x, 2, 0.8], r:0.3, z:'rope'}]);
    return {parts:P, zones:SKZ(se, L)}; },
  loft:(L, se) => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-24, -14], [24, -14], [-24, 14], [24, 14]]) add([{t:'box', c:[x, 16, z], r:[1.6, 16, 1.6], z:'wood'}]);
    add([{t:'box', c:[0, 33, 0], r:[27, 1.6, 17], z:'woodL'}]); for (const x of [-26, 26]) add([{t:'box', c:[x, 38, 0], r:[0.8, 4, 17], z:'wood'}]); add([{t:'box', c:[0, 38, -16.4], r:[27, 4, 0.8], z:'wood'}]);
    for (const x of [-12, 8]) add([{t:'cap', a:[x - 8, 40, -4], p:[x + 8, 40, -4], r:0.4, z:'rope'}, {t:'ell', c:[x, 37.4, -4], r:[8, 1.6, 4], z:'canvas'}]);
    crate(add, 14, 6, 0.9); add([{t:'cap', a:[30, 0, 18], p:[26, 34, 14], r:0.8, z:'wood'}, {t:'cap', a:[36, 0, 18], p:[32, 34, 14], r:0.8, z:'wood'}]);
    for (let y = 4; y < 34; y += 5) add([{t:'box', c:[31, y, 18 - y * 0.12], r:[3.4, 0.6, 0.6], z:'woodL'}]);
    crate(add, -14, 4); barrel(add, 0, 6);
    return {parts:P, zones:SKZ(se, L, {canvas:'#b8a482'})}; },
  room:(L, se) => { const P = [], add = wAdd(P), W = L.big ? 42 : 34, D = 20, H = 40;
    add([{t:'box', c:[0, 2, 0], r:[W + 2, 2, D + 2], z:'stoneD'}, {t:'box', c:[0, H / 2 + 3, 0], r:[W, H / 2, D], z:'brick'}]);
    for (let y = 6; y < H; y += 5) add([{t:'box', c:[0, y + ((y / 5) % 2) * 0.1, D + 0.3], r:[W - 0.5, 0.35, 0.3], z:'brickL'}]);
    add([{t:'box', c:[0, H + 4, 0], r:[W + 3, 1.6, D + 3], z:'roomTop'}, {t:'box', c:[0, H + 6, 0], r:[W + 3.4, 0.6, D + 3.4], z:'roomTopL'}, {t:'box', c:[0, H - 2, D + 1.2], r:[W + 1, 3, 1.4], z:'doorC'}]);
    for (let x = -W + 6; x < W; x += 12) add([{t:'box', c:[x, H + 6.8, 0], r:[0.6, 0.3, D + 3.4], z:'woodD'}]);
    add([{t:'box', c:[-W * 0.45, 12, D + 0.6], r:[6.5, 12, 1], z:'doorC'}, {t:'box', c:[-W * 0.45, 25, D + 0.8], r:[7.4, 1, 1.2], z:'woodD'}]);
    add([{t:'box', c:[W * 0.35, 20, D + 0.6], r:[7, 5.5, 0.8], z:'woodD'}, {t:'box', c:[W * 0.35, 20, D + 1], r:[5.6, 4.2, 0.6], z:'winglow'}]);
    if (L.g === 'cross') add([{t:'box', c:[4, H * 0.55, D + 1.4], r:[1.6, 7, 0.8], z:'redX'}, {t:'box', c:[4, H * 0.55 + 2, D + 1.4], r:[5, 1.6, 0.8], z:'redX'}]);
    else sgn(add, L, 4, H * 0.55, D + 1.4, 2.6);
    return {parts:P, zones:SKZ(se, L, {roomTop:'#8a6a44', roomTopL:'#a8845a'}), keepZones:['doorC']}; },
  stall:(L, se) => W3D_KINDS.f_merchant.build(se),
  exstall:(L, se) => { const o = W3D_KINDS.f_merchant.build(se); Object.assign(o.zones, {awn:'#6a3a8a', stripe:'#d4af37'}); o.keepZones = (o.keepZones || []).concat(['awn', 'stripe']); return o; },
  cage:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 1.5, 0], r:[22, 1.5, 15], z:'iron'}]);
    for (let x = -21; x <= 21; x += 7){ add([{t:'cap', a:[x, 2, 15], p:[x, 31, 15], r:0.6, z:'bar'}, {t:'cap', a:[x, 2, -15], p:[x, 31, -15], r:0.6, z:'bar'}]); }
    for (let z = -15; z <= 15; z += 7.5) for (const x of [-22, 22]) add([{t:'cap', a:[x, 2, z], p:[x, 31, z], r:0.6, z:'bar'}]);
    add([{t:'box', c:[0, 32, 0], r:[22.6, 1.4, 15.6], z:'bar'}]);
    if (L.dark) add([{t:'ell', c:[0, 3.4, 0], r:[16, 2, 10], z:'straw'}, {t:'ell', c:[-8, 5, -4], r:[3, 2.4, 3], z:'bone'}]);
    else { for (const x of [-12, 0, 12]) add([{t:'ell', c:[x, 12, -10], r:[1.4, 9, 6.4], z:'shieldC'}]); for (const x of [-16, 16]) add([{t:'cap', a:[x, 3, 6], p:[x - 2, 30, 4], r:0.6, z:'woodL'}]); }
    if (L.g) sgn(add, L, 0, 24, 16.4, 2);
    return {parts:P, zones:SKZ(se, L, {shieldC:'#7a3e26', bar:'#9aa0a8', straw:'#d8b860'}), keepZones:['bar']}; },
  pit:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 0.6, 0], r:[30, 0.6, 22], z:'sand'}]);
    for (let k = 0; k < 18; k++){ const a = k / 18 * TAU; add([{t:'ell', c:[Math.cos(a) * 31, 3, Math.sin(a) * 23], r:[5, 3, 3.6], rot:[0, -a, 0], z:'sack'}]); }
    for (const [x, z] of [[-30, -22], [30, -22], [-30, 22], [30, 22]]) add([{t:'cap', a:[x, 0, z], p:[x, 18, z], r:1.2, z:'wood'}]);
    for (const [a, b] of [[[-30, 16, -22], [30, 16, -22]], [[-30, 16, 22], [30, 16, 22]], [[-30, 16, -22], [-30, 16, 22]], [[30, 16, -22], [30, 16, 22]]]) add([{t:'cap', a, p:b, r:0.4, z:'rope'}]);
    add([{t:'cap', a:[-6, 0, 0], p:[-6, 26, 0], r:1.4, z:'wood'}, {t:'ell', c:[-6, 18, 0], r:[5, 8, 4.4], z:'straw'}, {t:'ell', c:[-6, 29, 0], r:[3.6, 3.6, 3.6], z:'sack'}]);
    W3K.sign(add, 'sword', 30, 26, 23, 1.6);
    return {parts:P, zones:SKZ(se, L, {sand:'#c8b088', sack:'#b89a6a'})}; },
  ladder:(L, se) => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) add([{t:'box', c:[x, 38, z], r:[1.2, 38, 1.2], z:'wood'}]);
    for (const y of [20, 44]) add([{t:'cap', a:[-10, y, 8.6], p:[10, y + 18, 8.6], r:0.5, z:'woodD'}, {t:'cap', a:[10, y, 8.6], p:[-10, y + 18, 8.6], r:0.5, z:'woodD'}]);
    add([{t:'box', c:[0, 77, 0], r:[14, 1.4, 12], z:'woodL'}]); for (const sx of [1, -1]) add([{t:'box', c:[sx * 13.6, 81, 0], r:[0.6, 3, 12], z:'wood'}]); add([{t:'box', c:[0, 81, 11.6], r:[14, 3, 0.6], z:'wood'}]);
    for (const x of [-4, 4]) add([{t:'cap', a:[x, 0, 12], p:[x, 76, 9], r:0.7, z:'wood'}]);
    for (let y = 4; y < 76; y += 6) add([{t:'box', c:[0, y, 12 - y * 0.04], r:[4.4, 0.5, 0.5], z:'woodL'}]);
    if (L.orb) add([{t:'cap', a:[0, 78, 0], p:[0, 92, 0], r:0.8, z:'gold'}, {t:'ell', c:[0, 95, 0], r:[4.4, 4.4, 4.4], z:'orb'}]);
    else add([{t:'cap', a:[8, 78, -6], p:[8, 98, -6], r:0.7, z:'wood'}, {t:'box', c:[15, 94, -6], r:[7, 4, 0.4], z:'banner'}]);
    sgn(add, L, 0, 60, 9.6, 2); snowTop(add, se, [0, 79, 0], [14.2, 0.8, 12.2]);
    let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
    return {parts:P, zones:SKZ(se, L, {banner:bn})}; },
  furnace:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 16, 0], r:[18, 16, 14], z:'brick'}, {t:'box', c:[0, 33, 0], r:[19, 1.4, 15], z:'stoneD'}, {t:'box', c:[6, 50, -4], r:[6, 16, 6], z:'brick'}, {t:'box', c:[6, 66.5, -4], r:[7, 1.2, 7], z:'stoneD'}]);
    for (let y = 4; y < 32; y += 4) add([{t:'box', c:[0, y, 14.3], r:[17.6, 0.3, 0.3], z:'brickL'}]);
    add([{t:'ell', c:[0, 12, 14.2], r:[8, 7, 0.8], z:'fire'}, {t:'ell', c:[0, 11, 14.6], r:[4.6, 3.6, 0.6], z:'fire2'}]);
    if (L.g === 'anvil') add([{t:'cap', a:[-28, 0, 14], p:[-28, 8, 14], r:4.4, z:'wood'}, {t:'box', c:[-28, 10, 14], r:[6, 1.8, 2.6], z:'iron'}, {t:'box', c:[-28, 12.6, 14], r:[4.4, 1.4, 2.2], z:'iron'}]);
    else for (let i = 0; i < 8; i++){ const a = i / 8 * TAU; add([{t:'box', c:[-30 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, 12], r:[1.6, 1.6, 1.2], rot:[0, 0, a], z:'iron'}]); }
    if (L.g === 'gear') add([{t:'ell', c:[-30, 12, 12], r:[6, 6, 1], z:'iron'}, {t:'cap', a:[-30, 0, 12], p:[-30, 6, 12], r:1, z:'wood'}]);
    sgn(add, L, -6, 26, 14.6, 1.8); snowTop(add, se, [0, 34.4, 0], [19, 0.6, 15]);
    return {parts:P, zones:SKZ(se, L)}; },
  vat:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 3, 0], r:[30, 3, 14], z:'woodD'}]);
    for (const x of [-15, 15]) add([{t:'ell', c:[x, 14, 0], r:[12, 10, 11], z:'wood'}, {t:'ell', c:[x, 8, 0], r:[12.4, 0.8, 11.4], z:'iron'}, {t:'ell', c:[x, 18, 0], r:[12.4, 0.8, 11.4], z:'iron'}, {t:'ell', c:[x, 23.6, 0], r:[10.6, 0.8, 9.6], z:'tan'}]);
    add([{t:'cap', a:[-15, 24, 0], p:[-6, 40, 4], r:0.8, z:'wood'}, {t:'box', c:[36, 16, 10], r:[1, 16, 1], z:'wood'}]); W3K.sign(add, 'hide', 36, 32, 11, 1.8);
    return {parts:P, zones:SKZ(se, L)}; },
  barricade:(L, se) => { const P = [], add = wAdd(P);
    crate(add, -26, 0); crate(add, -16, 2, 1.1); crate(add, -21, 2 - 10.4, 0.9); barrel(add, 0, 4); barrel(add, 10, -2); crate(add, 24, 2); crate(add, 34, 0, 0.9);
    add([{t:'box', c:[0, 22, 6], r:[38, 1, 2], rot:[0, 0, 0.08], z:'woodL'}, {t:'box', c:[4, 14, 10], r:[34, 1, 2], rot:[0, 0, -0.1], z:'wood'}]);
    return {parts:P, zones:SKZ(se, L)}; }
};
const SK_SCALE = {cabin:1.2, hatch:1.3, tarp:1.2, bench:1.6, cannon:1.85, shrine:1.15, galley:1.2, room:1.2, cage:1.15, furnace:1.2, vat:1.2, pit:1.1, loft:1.1, rigging:1.1, mast:1.1, ladder:1.1, nets:1.1, barricade:1.2, stall:1.05, exstall:1.05};
const W3D_EXTRA_LOOK = {barge:{kennels:{t:'hatch', g:'boot'}}, warehouse:{kennels:{t:'cage', g:'boot'}}};

/* -------------------------------------------------------------- ruins --- */
function w3dRuin(build){
  return se => {
    const o = build(se), r = rng(311 + o.parts.length), P = [], add = wAdd(P);
    let top = 0, W = 20, D = 10; for (const q of o.parts){ const c = q.c || q.p || q.a || [0, 0, 0]; top = Math.max(top, c[1]); W = Math.max(W, Math.min(50, Math.abs(c[0]))); D = Math.max(D, Math.min(32, Math.abs(c[2]))); }
    for (const q of o.parts){
      const c = q.c || q.p || [0, 0, 0], stone = ['stone', 'stoneL', 'stoneD', 'plaster'].includes(q.z);
      if (stone && c[1] > top * 0.45 && c[1] < top * 0.8 && r() < 0.1) continue;
      if (q.z === 'stone') q.z = r() < 0.25 ? 'ruinM' : 'ruin'; else if (q.z === 'stoneL') q.z = 'ruinL'; else if (q.z === 'plaster') q.z = r() < 0.3 ? 'ruin' : 'ruinP';
      P.push(q);
    }
    for (const sx of [-1, 1]){ const x = sx * (W + 10), z = D * 0.2 * sx; add([{t:'box', c:[x, 7, z], r:[4, 7, 6], z:'ruin'}, {t:'box', c:[x, 15, z - 2], r:[4, 3, 3], z:'ruinL'}, {t:'ell', c:[x, 0.8, z + 6], r:[6, 1.6, 4], z:'ruinM'}]); }
    for (let k = 0; k < 4; k++) add([{t:'ell', c:[(r() - 0.5) * W * 1.8, 1.6, D + 3 + r() * 6], r:[2.4 + r() * 2, 1.6, 2 + r() * 2], z:r() < 0.5 ? 'ruin' : 'ruinL'}]);
    add([{t:'ell', c:[-W * 0.85, top * 0.32, D + 1.4], r:[5, top * 0.3, 1.4], z:'ivy'}, {t:'box', c:[W * 0.5, top * 0.38, D + 1.6], r:[6, 1.2, 0.6], rot:[0, 0, 0.2], z:'wood'}, {t:'box', c:[W * 0.5, top * 0.3, D + 1.6], r:[6, 1.2, 0.6], rot:[0, 0, -0.1], z:'woodL'}]);
    if (se === 'winter') add([{t:'box', c:[-W - 10, 18.4, -D * 0.2], r:[4.2, 0.8, 3.2], z:'snow'}, {t:'box', c:[W + 10, 18.4, D * 0.2], r:[4.2, 0.8, 3.2], z:'snow'}]);
    const leaf = se === 'autumn' ? '#9a5a24' : se === 'winter' ? '#4a5a3a' : '#4e6a2e';
    o.parts = P; o.zones = Object.assign({}, o.zones, {ruin:'#8a887a', ruinL:'#a4a090', ruinM:'#6e7656', ruinP:'#b8ae96', ivy:leaf});
    return o;
  };
}
const ruinKind = k => wKind('ws_' + k, () => Object.assign({}, W3D_KINDS[k], {build:w3dRuin(W3D_KINDS[k].build), _b0:w3dRuin(W3D_KINDS[k]._b0 || W3D_KINDS[k].build)}));   // PL-1 item 4: its own _b0 too, or a menu picture (P3ZONED) of the ruin shows the whole building

/* ------------------------------------------------- holding hubs and QM --- */
Object.assign(W3D_KINDS, {
  hh_barge:{frame:[120, 120, 6], view:2.3, keep:0.72, clip:'still', scale:1.35, build:se => { const o = W3D_SKIN.cabin({big:1, roof:'#7a3e26', g:'flag'}, se), add = wAdd(o.parts);
    add([{t:'box', c:[0, 9, 25], r:[46, 9, 2], z:'deckD'}]); for (let x = -38; x <= 38; x += 12) add([{t:'box', c:[x, 24, 22.6], r:[4, 4, 0.8], z:'winglow'}]);
    add([{t:'cap', a:[44, 38, 22], p:[52, 38, 22], r:0.6, z:'iron'}, {t:'ell', c:[52, 33, 22], r:[2.4, 3.4, 2.4], z:'winglow'}]); return o; }},
  hh_warehouse:{frame:[120, 120, 6], view:2.3, keep:0.72, clip:'still', scale:1.35, build:se => { const o = W3D_SKIN.room({big:1, c:'#7a3e26', g:'flag'}, se), add = wAdd(o.parts);
    for (const x of [-30, -14, 14, 30]) add([{t:'box', c:[x, 40, 22.4], r:[6, 3, 0.6], z:'winglow'}]);
    add([{t:'box', c:[-48, 10, 18], r:[4, 10, 6], z:'wood'}]); for (let y = 2; y < 20; y += 4) add([{t:'box', c:[-48, y, 24.4], r:[4, 0.6, 0.6], z:'woodL'}]); return o; }},
  qm_barge:{frame:[120, 120, 6], view:2.3, keep:0.72, clip:'still', scale:1.1, build:se => { const o = W3D_SKIN.hatch({g:'coin'}, se); return o; }},
  qm_warehouse:{frame:[120, 120, 6], view:2.3, keep:0.72, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 10, 0], r:[34, 10, 7], z:'wood'}, {t:'box', c:[0, 20.6, 0], r:[35, 0.8, 8], z:'woodL'}]);
    for (let x = -30; x <= 30; x += 6) add([{t:'box', c:[x, 10, 7.2], r:[0.4, 10, 0.3], z:'woodD'}]);
    crate(add, -20, -14); crate(add, -9, -14, 0.8); add([{t:'ell', c:[-22, 24, 0], r:[5, 3, 3], z:'canvas'}, {t:'ell', c:[14, 23, 1], r:[3.4, 2, 3.4], z:'coin'}, {t:'cap', a:[24, 0, -6], p:[24, 40, -6], r:1, z:'wood'}]);
    W3K.sign(add, 'coin', 24, 36, -4.8, 2.2);
    return {parts:P, zones:SKZ(se, {c:'#ece4cf'})}; }},
  fire_barge:{frame:[90, 90, 6], view:2, keep:0.72, clip:'flicker', scale:1.7, build:se => { const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    for (const a of [0, 2.1, 4.2]) add('root', [{t:'cap', a:[Math.cos(a) * 12, 0, Math.sin(a) * 8], p:[0, 18, 0], r:1, z:'iron'}]);
    add('root', [{t:'ell', c:[0, 20, 0], r:[12, 4.4, 8], z:'iron'}, {t:'ell', c:[0, 23.4, 0], r:[10, 1, 7], z:'ember'}]);
    add('flame', [{t:'ell', c:[0, 28, 0], r:[7, 8, 5], z:'flame'}, {t:'ell', c:[1, 34, 0], r:[4, 7, 3], z:'flame2'}, {t:'ell', c:[-2, 38, 1], r:[2, 4, 2], z:'flame2'}]);
    return {parts:P, bones:{flame:{parent:'root', off:[0, 22, 0]}}, zones:W3K.zones(se, {flame:'#ff9a30', flame2:'#ffd860', ember:'#ff7a2a'})}; }},
  fire_warehouse:{frame:[90, 90, 6], view:2, keep:0.72, clip:'flicker', scale:1.7, build:se => { const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    add('root', [{t:'ell', c:[0, 11, 0], r:[9, 11, 9], z:'barrelR'}, {t:'ell', c:[0, 5, 0], r:[9.4, 0.8, 9.4], z:'iron'}, {t:'ell', c:[0, 17, 0], r:[9.4, 0.8, 9.4], z:'iron'}, {t:'ell', c:[0, 21.4, 0], r:[7.6, 1, 7.6], z:'ember'}]);
    for (const [x, z] of [[4, 4], [-5, 2], [3, -5]]) add('root', [{t:'ell', c:[x, 5, z + 9.2], r:[1.4, 1.4, 0.4], z:'ember'}]);
    add('flame', [{t:'ell', c:[0, 27, 0], r:[6, 7, 5], z:'flame'}, {t:'ell', c:[1, 33, 0], r:[3.4, 6, 3], z:'flame2'}]);
    return {parts:P, bones:{flame:{parent:'root', off:[0, 21, 0]}}, zones:W3K.zones(se, {flame:'#ff9a30', flame2:'#ffd860', ember:'#ff7a2a', barrelR:'#5a4a40'})}; }},
  f_edelos:facKind(null, 0.72, se => { const o = W3D_KINDS.w_wagon.build(se); Object.assign(o.zones, {canvas:'#6a3a8a', canvasD:'#d4af37'}); return o; })
});
W3D_FAC.edelos = 'f_edelos';

/* -------------------------------------------------------------- hooks --- */
w3dFire = function(x, y, t){
  const hk = holdKey();
  if (hk === 'barge' || hk === 'warehouse') return w3dDraw('fire_' + hk, x, y + 16, {t});
  return w3dDraw(hk === 'waystation' ? ruinKind('campfire') : 'campfire', x, y + 12, {t});
};
// the barge deck and the warehouse floor in the 3D look
plankPattern = (function(prev){
  return function(col, h, seed){
    const se = holdKey() === 'warehouse' ? 'summer' : w3dSeason(), key = 'wpl:' + wLook() + ':' + se + ':' + holdKey() + col + h + seed;   /* Index 69: no weather indoors */ if (SPR[key]) return SPR[key];
    const retro = wLook() === 'retro', U = retro ? 1 : 2, c = newCanvas(64 * U, h * 4 * U), g = c.getContext('2d'), r = rng(seed);
    const B = w3dBands(se === 'winter' ? wMix(col, '#8a8a8a', 0.25) : col), P = (x, y, w, hh, cc) => { g.fillStyle = cc; g.fillRect(x * U, y * U, w * U, hh * U); };
    for (let y = 0; y < 4; y++){ const base = r() < 0.5 ? B[2] : wMix(B[2], B[1], 0.3); P(0, y * h, 64, h, base); P(0, y * h, 64, 0.5, B[3]); P(0, y * h + h - 1, 64, 1, B[0]);
      const j = (y * 23 + 11) % 64; P(j, y * h, 1, h, B[0]); P(j + 1, y * h, 0.5, h, B[3]);
      for (let i = 0; i < 8; i++) P(r() * 60 | 0, y * h + 1 + (r() * (h - 2) | 0), 3 + (r() * 6 | 0), 0.5, wMix(base, B[1], 0.5)); }
    if (se === 'winter') for (let i = 0; i < (holdKey() === 'warehouse' ? 10 : 30) * U; i++){ g.fillStyle = holdKey() === 'warehouse' ? 'rgba(190,206,216,.55)' : w3dBands(w3dZ('snow', se))[2];   /* Index 68: light frost indoors */ g.fillRect(r() * 64 * U | 0, r() * h * 4 * U | 0, 2 + r() * 4 * U, 1); }
    return SPR[key] = scaled(c, retro ? 3 : 1.5);
  };
})(plankPattern);
{ let sig = ''; drawCamp = (function(prev){ return function(){ const s = wLook() + ':' + w3dSeason(); if (s !== sig){ sig = s; CAMP.deck = null; CAMP.floor = null; CAMP.cobble = null; } return prev.apply(this, arguments); }; })(drawCamp); }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx66')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx66"><b>3D holdings.</b> The Dockside Cog-Barge, the Abandoned City Warehouse and the Ruined Waystation are 3D too, each built in its own style, with signs, seasons and raid damage.</p>`);
  };
}
/* ===== END INDEX 66 ======================================================= */

/* ============================================================================
   INDEX 67 - 3D TREES AND DECOR
   With "3D world" on, every tree and the camp's scattered decor are 3D, in all
   four seasons, with a gentle wind sway (four frames; each tree is offset so
   they never sway in step):
     Oak        (as before) full crown, blossom in spring, orange and red in
                autumn, bare with snow in winter
     Birch      a slim white trunk with black marks, a light airy crown that
                turns gold in autumn and goes bare in winter
     Pine       a dark trunk under five tiers of needles, snow on every tier in
                winter; evergreen
     Dead tree  grey and twisted, broken branches, no leaves (about one tree in
                twelve, the same ones every time)
     Bushes     leafy clumps; flowers in spring, berries in summer, rust red in
                autumn, snow-topped in winter
     Grass tufts and flower tufts that sway; dry and brown in autumn, frosted
                in winter
     Rocks, stumps, crates, barrels, sacks, coiled rope, an anchor, fences and
                signposts (still; snow on top in winter)
   WHERE        the camp in every holding (the fort's forest edge and clearing
                decor, the barge's and warehouse's stores), the prologue's
                camp, and every contract map's woods. A tree between you and
                your Leader still turns see-through.
   NEW IN CAMP  a few fence runs and two signposts by the fort's roads (decor
                only, not clickable).
   Nothing new is saved. Rollback: delete from this comment to END INDEX 67 and
   undo the patches marked "Index 67".

   3D DESIGN NOTE: WORLD, ADDENDUM
     TREES    w3dTreeKind(t) maps a tree's variant (t.v % 3: 0 pine, 1 oak,
              2 birch) and a stable hash of its position (1 in 12 dead) to a
              kind. Draw with w3dTreeAt(t, frame, groundLine, alpha). Trees use
              the 'sway' clip and the 'crown' bone; anything on 'crown' moves.
     DECOR    W3D_DECOR maps a decor key to a kind (dc_<key>). Swaying decor
              (tufts, flowers, bushes) puts its leaves on 'crown' too. Add a
              decor item by adding a builder and a W3D_DECOR entry; a pixel
              DECOR entry is the fallback when "3D world" is off.
     COST     Every tree of a kind shares one set of frames per season and look
              (two views, mirrored), so a forest costs no more than one tree.
============================================================================ */
const wTree = (frame, build, extra) => Object.assign({frame, view:2.2, mirror:true, keep:0.6, clip:'sway', build}, extra || {});
const wCrown = P => (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
const wSnowZ = {snow:'#eef2f6'};
Object.assign(W3D_KINDS, {
  t_pine:wTree([90, 120, 6], se => { const P = [], add = wCrown(P);
    add('root', [{t:'cap', a:[0, 0, 0], p:[0, 22, 0], r:3.6, z:'bark'}, {t:'ell', c:[0, 1.5, 0], r:[6, 2, 5], z:'bark'}]);
    const tiers = [[24, 21, 13], [36, 18, 12], [48, 15, 11], [59, 11, 10], [69, 7, 9]];
    tiers.forEach(([y, r, h], i) => { add('crown', [{t:'ell', c:[0, y, 0], r:[r, h * 0.62, r * 0.9], z:i % 2 ? 'leaf' : 'leafD'}, {t:'ell', c:[-r * 0.25, y + h * 0.18, r * 0.35], r:[r * 0.6, h * 0.35, r * 0.4], z:'leafL'}]);
      if (se === 'winter') add('crown', [{t:'ell', c:[-1, y + h * 0.42, 0], r:[r * 0.82, h * 0.2, r * 0.74], z:'snow'}]); });
    add('crown', [{t:'ell', c:[0, 78, 0], r:[2.4, 5, 2.4], z:'leaf'}]);
    if (se === 'winter') add('root', [{t:'ell', c:[0, 1.2, 0], r:[16, 1.6, 12], z:'snow'}]);
    if (se === 'autumn') add('root', [{t:'ell', c:[4, 1, 6], r:[10, 1, 5], z:'needle'}]);
    const G = {spring:['#2e5a2e', '#22462a', '#46763e'], summer:['#2e5226', '#20401e', '#3e6a32'], autumn:['#34502a', '#263e22', '#4a6234'], winter:['#2a4630', '#1e3624', '#3a5a40']}[se];
    return {parts:P, bones:{crown:{parent:'root', off:[0, 22, 0]}}, zones:Object.assign({bark:'#4e321c', leaf:G[0], leafD:G[1], leafL:G[2], needle:'#8a6a3a'}, wSnowZ)}; }),
  t_birch:wTree([80, 110, 6], se => { const P = [], add = wCrown(P);
    add('root', [{t:'cap', a:[0, 0, 0], p:[1, 40, 0], r:2.6, z:'bark'}, {t:'ell', c:[0, 1.5, 0], r:[5, 2, 4], z:'barkD'}]);
    for (const y of [8, 15, 23, 31, 37]) add('root', [{t:'box', c:[0.5 + (y % 3 - 1) * 0.6, y, 2.4], r:[1.6, 0.6, 0.4], z:'mark'}]);
    for (const [a, b] of [[[1, 30, 0], [-10, 46, 3]], [[1, 32, 0], [10, 48, -2]], [[1, 38, 0], [2, 56, 3]], [[1, 36, 0], [-3, 52, -6]]]) add('crown', [{t:'cap', a, p:b, r:1, z:'bark'}]);
    if (se === 'winter'){ for (const [x, y, z] of [[-10, 46, 3], [10, 48, -2], [2, 56, 3], [-3, 52, -6]]) add('crown', [{t:'cap', a:[x, y, z], p:[x * 1.5, y + 8, z + 1], r:0.6, z:'bark'}, {t:'ell', c:[x, y + 1.6, z], r:[3, 0.9, 2], z:'snow'}]);
      add('root', [{t:'ell', c:[0, 1.1, 0], r:[13, 1.4, 10], z:'snow'}]); }
    else { [[0, 50, 0, 13], [-11, 46, 3, 9], [10, 48, -2, 9], [-4, 58, -3, 9], [5, 59, 3, 8], [0, 44, 9, 8]].forEach(([x, y, z, r], i) => add('crown', [{t:'ell', c:[x, y, z], r:[r, r * 1.05, r], z:i === 0 ? 'leafD' : i % 2 ? 'leaf' : 'leafL'}]));
      if (se === 'spring') for (let i = 0; i < 8; i++){ const a = i * 2.2; add('crown', [{t:'ell', c:[Math.cos(a) * 12, 46 + (i % 4) * 4, Math.sin(a) * 9 + 4], r:[1.1, 1.6, 1.1], z:'catkin'}]); }
      if (se === 'autumn') add('root', [{t:'ell', c:[3, 1, 6], r:[9, 1, 5], z:'leaf'}]); }
    const L = {spring:['#8ab850', '#6a9a40', '#a8cc6a'], summer:['#6a9a3a', '#4e7a2e', '#88b04a'], autumn:['#e0b040', '#c08a2a', '#f0cc5a'], winter:['#6a9a3a', '#4e7a2e', '#88b04a']}[se];
    return {parts:P, bones:{crown:{parent:'root', off:[0, 30, 0]}}, zones:Object.assign({bark:'#e8e4da', barkD:'#8a8478', mark:'#2a2622', leaf:L[0], leafD:L[1], leafL:L[2], catkin:'#d8d070'}, wSnowZ), keepZones:['bark', 'mark']}; }),
  t_dead:wTree([90, 100, 6], se => { const P = [], add = wCrown(P);
    add('root', [{t:'cap', a:[0, 0, 0], p:[-2, 18, 1], r:4.4, z:'bark'}, {t:'cap', a:[-2, 18, 1], p:[2, 34, -1], r:3.4, z:'bark'}, {t:'ell', c:[0, 1.5, 0], r:[8, 2.4, 6], z:'barkD'}]);
    for (const [x, z] of [[-8, 2], [7, 3], [1, -6]]) add('root', [{t:'cap', a:[0, 4, 0], p:[x, 0.5, z], r:2, z:'barkD'}]);
    const br = [[[2, 34, -1], [-12, 46, 2]], [[2, 34, -1], [14, 44, -3]], [[2, 34, -1], [4, 52, 3]], [[-1, 26, 1], [-16, 34, 4]], [[-12, 46, 2], [-18, 52, 1]], [[14, 44, -3], [20, 54, -2]], [[4, 52, 3], [8, 60, 4]], [[-16, 34, 4], [-22, 32, 5]]];
    for (const [a, b] of br) add('crown', [{t:'cap', a, p:b, r:a[1] > 40 ? 1 : 1.8, z:'bark'}]);
    add('root', [{t:'ell', c:[3, 22, 4.2], r:[1.6, 2.2, 0.6], z:'hole'}]);
    if (se === 'winter'){ for (const [, b] of br) add('crown', [{t:'ell', c:[b[0], b[1] + 1.4, b[2]], r:[2.6, 0.8, 1.8], z:'snow'}]); add('root', [{t:'ell', c:[0, 1.2, 0], r:[14, 1.4, 10], z:'snow'}]); }
    if (se === 'spring' || se === 'summer') add('root', [{t:'ell', c:[-3, 6, 4], r:[3, 6, 1.6], z:'moss'}]);
    return {parts:P, bones:{crown:{parent:'root', off:[0, 28, 0]}}, zones:Object.assign({bark:'#7a746a', barkD:'#5a544c', hole:'#1a1612', moss:'#5a6a3a'}, wSnowZ)}; }, {keep:0.7}),
  dc_bush:wTree([60, 44, 6], se => { const P = [], add = wCrown(P);
    [[0, 8, 0, 11], [-9, 6, 2, 8], [9, 6, -1, 8], [-3, 12, -3, 7], [5, 11, 3, 7]].forEach(([x, y, z, r], i) => add('crown', [{t:'ell', c:[x, y, z], r:[r, r * 0.8, r * 0.85], z:i === 0 ? 'leafD' : i % 2 ? 'leaf' : 'leafL'}]));
    if (se === 'spring') for (let i = 0; i < 7; i++){ const a = i * 2.4; add('crown', [{t:'ell', c:[Math.cos(a) * 9, 9 + (i % 3) * 3, Math.sin(a) * 6 + 4], r:[1.4, 1.4, 1.4], z:'flower'}]); }
    if (se === 'summer') for (let i = 0; i < 6; i++){ const a = i * 2.6; add('crown', [{t:'ell', c:[Math.cos(a) * 8, 7 + (i % 3) * 3, Math.sin(a) * 6 + 5], r:[1.1, 1.1, 1.1], z:'berry'}]); }
    if (se === 'winter') add('crown', [{t:'ell', c:[0, 14, 0], r:[11, 3, 8], z:'snow'}, {t:'ell', c:[-9, 11, 2], r:[6, 2, 5], z:'snow'}, {t:'ell', c:[9, 11, -1], r:[6, 2, 5], z:'snow'}]);
    const L = {spring:['#5a8a34', '#3e6a28', '#78a84a'], summer:['#4e7a2e', '#365a22', '#6a943e'], autumn:['#9a3a1e', '#7a2a16', '#c06a2a'], winter:['#3e5a2e', '#2a4422', '#4e6a38']}[se];
    return {parts:P, bones:{crown:{parent:'root', off:[0, 0, 0]}}, zones:Object.assign({leaf:L[0], leafD:L[1], leafL:L[2], flower:'#f0d0e0', berry:'#c02a2a'}, wSnowZ)}; }),
  dc_tuft:wTree([40, 34, 4], se => { const P = [], add = wCrown(P);
    const blades = [[-5, 0.6, -0.4], [-2.4, 0.3, 0.2], [0, 0, 0], [2.6, -0.3, 0.1], [5, -0.6, -0.2], [-1, 0.1, 2], [1.6, -0.2, -2]];
    blades.forEach(([x, lean, z], i) => add('crown', [{t:'cap', a:[x, 0, z], p:[x + lean * 6, 10 + (i % 3) * 3, z], r:0.8, z:i % 2 ? 'grass' : 'grassL'}]));
    if (se === 'winter') add('root', [{t:'ell', c:[0, 0.8, 0], r:[7, 1, 4], z:'snow'}]);
    const G = {spring:['#6a9a3a', '#8ab850'], summer:['#7a8a40', '#9aa850'], autumn:['#a08040', '#c0a050'], winter:['#7a8070', '#a0a898']}[se];
    return {parts:P, bones:{crown:{parent:'root', off:[0, 0, 0]}}, zones:Object.assign({grass:G[0], grassL:G[1]}, wSnowZ)}; }, {view:2, mirror:true}),
  dc_flowers:wTree([40, 34, 4], se => { const P = [], add = wCrown(P);
    const heads = se === 'winter' ? [] : [[-5, 8, 0], [-1, 11, 1], [3, 9, -1], [6, 7, 1]];
    for (const [x, y, z] of [[-5, 8, 0], [-1, 11, 1], [3, 9, -1], [6, 7, 1]]) add('crown', [{t:'cap', a:[x * 0.8, 0, z], p:[x, y, z], r:0.6, z:'grass'}]);
    heads.forEach(([x, y, z], i) => add('crown', [{t:'ell', c:[x, y + 1, z], r:[1.8, 1.4, 1.8], z:'fl' + (i % 3)}, {t:'ell', c:[x, y + 1.4, z + 1], r:[0.6, 0.6, 0.6], z:'flC'}]));
    if (se === 'winter') add('root', [{t:'ell', c:[0, 0.8, 0], r:[7, 1, 4], z:'snow'}]);
    const F = se === 'autumn' ? ['#c07a2a', '#a0502a', '#d8a040'] : se === 'summer' ? ['#e8d060', '#d87a40', '#e8e0d0'] : ['#f4c0d0', '#b8a0e8', '#f8f4ec'];
    return {parts:P, bones:{crown:{parent:'root', off:[0, 0, 0]}}, zones:Object.assign({grass:se === 'autumn' ? '#8a7a3a' : '#5f7e3e', fl0:F[0], fl1:F[1], fl2:F[2], flC:'#e8c040'}, wSnowZ), keepZones:['fl0', 'fl1', 'fl2']}; }, {view:2}),
  dc_rock:{frame:[50, 36, 4], view:2.3, mirror:true, keep:0.65, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 5, 0], r:[11, 6.4, 8], rot:[0, 0.4, 0.1], z:'stone'}, {t:'ell', c:[7, 3.4, 4], r:[5, 3.6, 4], z:'stoneL'}, {t:'ell', c:[-6, 2.6, 5], r:[4, 2.6, 3], z:'stoneD'}]);
    if (se === 'winter') add([{t:'ell', c:[-1, 9.6, 0], r:[8, 2, 5.4], z:'snow'}]); else if (se !== 'autumn') add([{t:'ell', c:[-4, 8, 3], r:[4, 1.6, 3], z:'moss'}]);
    return {parts:P, zones:W3K.zones(se, {moss:'#5a6a3a'})}; }},
  dc_stump:{frame:[50, 36, 4], view:2.3, mirror:true, keep:0.65, clip:'still', build:se => { const P = [], add = wAdd(P);
    for (let y = 1; y < 8; y += 2) add([{t:'ell', c:[0, y, 0], r:[6.6 - y * 0.08, 1.6, 6.6 - y * 0.08], z:y % 4 === 1 ? 'wood' : 'woodD'}]);
    add([{t:'ell', c:[0, 8.2, 0], r:[6.2, 0.9, 6.2], z:'ring'}, {t:'ell', c:[0, 8.7, 0], r:[3, 0.4, 3], z:'woodD'}, {t:'ell', c:[0, 8.8, 0], r:[1, 0.3, 1], z:'ring'}]);
    for (const [x, z] of [[-8, 3], [7, 4], [2, -7]]) add([{t:'cap', a:[0, 2, 0], p:[x, 0.4, z], r:2, z:'wood'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 9.6, 0], r:[6, 1, 6], z:'snow'}]); else add([{t:'ell', c:[-4, 3, 5], r:[2, 2, 1.4], z:'shroom'}]);
    return {parts:P, zones:W3K.zones(se, {wood:'#8a5a2b', ring:'#d8b080', shroom:se === 'autumn' ? '#c84a2a' : '#d8c8a0'}), keepZones:['ring']}; }},
  dc_crate:{frame:[50, 40, 4], view:2.3, mirror:true, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    crate(add, 0, 0, 1.3); if (se === 'winter') add([{t:'box', c:[0, 13.6, 0], r:[6.6, 0.6, 6.6], z:'snow'}]);
    return {parts:P, zones:SKZ(se)}; }},
  dc_barrel:{frame:[44, 44, 4], view:2.3, mirror:true, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    barrel(add, 0, 0, 1.3); add([{t:'ell', c:[0, 15.8, 0], r:[5.4, 0.4, 5.4], z:'woodD'}]); if (se === 'winter') add([{t:'ell', c:[0, 16.6, 0], r:[5.2, 0.8, 5.2], z:'snow'}]);
    return {parts:P, zones:SKZ(se)}; }},
  dc_sacks:{frame:[50, 36, 4], view:2.3, mirror:true, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[-4, 6, 0], r:[6, 6.4, 5], z:'sack'}, {t:'ell', c:[-4, 12.6, 0], r:[2, 1.4, 2], z:'rope'}, {t:'ell', c:[6, 5, 2], r:[5, 5.4, 4.4], z:'sackL'}, {t:'ell', c:[6, 10.6, 2], r:[1.6, 1.2, 1.6], z:'rope'}]);
    return {parts:P, zones:SKZ(se, null, {sack:'#c8b48a', sackL:'#d8c49a', rope:'#8a6a3a'})}; }},
  dc_rope:{frame:[44, 30, 4], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    for (let k = 0; k < 3; k++) add([{t:'ell', c:[0, 1.4 + k * 1.6, 0], r:[8 - k * 1.6, 1, 6 - k * 1.2], z:k % 2 ? 'rope' : 'ropeD'}]);
    add([{t:'cap', a:[6, 2, 4], p:[12, 0.8, 7], r:0.9, z:'rope'}]);
    return {parts:P, zones:SKZ(se, null, {rope:'#c8b890', ropeD:'#a89870'})}; }},
  dc_anchor:{frame:[50, 44, 4], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[0, 2, 0], p:[0, 22, 0], r:1.4, z:'iron'}, {t:'cap', a:[-6, 20, 0], p:[6, 20, 0], r:1, z:'iron'}, {t:'ell', c:[0, 24, 0], r:[2.4, 2.4, 0.8], z:'iron'},
      {t:'cap', a:[-10, 7, 0], p:[0, 2, 0], r:1.4, z:'iron'}, {t:'cap', a:[10, 7, 0], p:[0, 2, 0], r:1.4, z:'iron'}, {t:'ell', c:[-11, 8, 0], r:[2, 2.6, 0.8], z:'iron'}, {t:'ell', c:[11, 8, 0], r:[2, 2.6, 0.8], z:'iron'}]);
    return {parts:P, zones:SKZ(se)}; }},
  dc_fence:{frame:[90, 40, 4], view:2, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P); W3K.fence(add, -24, 24, 0, 14, se, 12); return {parts:P, zones:W3K.zones(se)}; }},
  dc_sign:{frame:[60, 60, 4], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[0, 0, 0], p:[0, 34, 0], r:1.6, z:'wood'}, {t:'box', c:[8, 28, 1], r:[10, 3, 0.8], rot:[0, 0, 0.06], z:'woodL'}, {t:'box', c:[-7, 20, 1], r:[9, 2.6, 0.8], rot:[0, 0, -0.08], z:'woodL'},
      {t:'box', c:[17, 28, 1], r:[2, 3, 0.8], rot:[0, 0, 0.8], z:'woodL'}, {t:'box', c:[-15, 20, 1], r:[2, 2.6, 0.8], rot:[0, 0, -0.8], z:'woodL'}]);
    for (const [x, y, w] of [[6, 28, 7], [-6, 20, 6]]) add([{t:'box', c:[x, y, 1.9], r:[w, 0.4, 0.2], z:'ink'}]);
    if (se === 'winter') add([{t:'box', c:[8, 31.4, 1], r:[10, 0.6, 1], z:'snow'}, {t:'box', c:[-7, 23, 1], r:[9, 0.6, 1], z:'snow'}, {t:'ell', c:[0, 1, 0], r:[5, 1.2, 4], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se)}; }}
});
const W3D_SCALE = {t_birch:1.3, t_pine:1.12, t_dead:1.1, dc_bush:1.25, dc_tuft:1.5, dc_flowers:1.9, dc_rock:1.45, dc_stump:1.7, dc_crate:1.8, dc_barrel:1.7, dc_sacks:1.6, dc_rope:1.6, dc_anchor:1.3};
for (const k in W3D_SCALE) if (W3D_KINDS[k]) W3D_KINDS[k].scale = W3D_SCALE[k];
const W3D_DECOR = {bush:'dc_bush', tuft:'dc_tuft', flowers:'dc_flowers', rock:'dc_rock', stump:'dc_stump', crate:'dc_crate', barrel:'dc_barrel', sacks:'dc_sacks', rope:'dc_rope', anchor:'dc_anchor', fence:'dc_fence', sign:'dc_sign'};

/* ---------------------------------------------------------------- draw --- */
const wHash = (x, y) => (Math.imul((x * 7 | 0) ^ 0x5bd1e995, 31) + Math.imul(y * 13 | 0, 17)) >>> 0;
function w3dTreeKind(t){ if (wHash(t.x, t.y) % 12 === 0) return 't_dead'; return ['t_pine', 'oak', 't_birch'][((t.v % 3) + 3) % 3]; }
function w3dTreeAt(t, frame, gl, alpha){
  const h = wHash(t.x, t.y);
  return w3dDraw(w3dTreeKind(t), t.x, gl, {t:frame + (h % 88), mirror:(h >> 4) % 2 === 0, alpha});
}
w3dTree = function(tr, t){
  const sx = tr.x - CAMP.cam.x, sy = tr.y - CAMP.cam.y; if (sx < -80 || sx > VW + 80 || sy < -20 || sy > VH + 160) return true;
  return w3dTreeAt(tr, t, tr.y + 5);
};
function w3dDecor(d){
  const k = W3D_DECOR[d.k]; if (!k) return false;
  const sx = d.x - CAMP.cam.x, sy = d.y - CAMP.cam.y; if (sx < -60 || sx > VW + 60 || sy < -20 || sy > VH + 60) return true;
  const h = wHash(d.x, d.y);
  return w3dDraw(k, d.x, d.y + 3, {t:CAMP.t + (h % 88), mirror:(h >> 3) % 2 === 0});
}
function w3dMapTree(t, near){ if (!G) return false; return w3dTreeAt(t, G.frame, t.y + 4, near ? 0.45 : undefined); }
// a few fence runs and signposts by the fort's roads
campScenery = (function(prev){
  return function(){
    const had = !!CAMP.trees; prev();
    if (!had && CAMP.decor && holding() === 'fort' && holdKey() === 'fort'){
      for (const [x, y, k] of [[880, 1010, 'sign'], [1240, 300, 'sign'], [300, 640, 'fence'], [1480, 640, 'fence'], [700, 1020, 'fence'], [1060, 1020, 'fence']])
        if (!Object.values(PLOTS).some(([px, py]) => Math.hypot(px - x, py - y) < 70)) CAMP.decor.push({x, y, k});
    }
  };
})(campScenery);
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx67')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx67"><b>3D trees and decor.</b> Oaks, birches, pines and dead trees, bushes, grass, rocks, stumps and stores are 3D, sway in the wind and change with the seasons, in camp and on every contract map.</p>`);
  };
}
/* ===== END INDEX 67 ======================================================= */

/* ============================================================================
   INDEX 68 - SEASONS PASS: EVERY BUILDING, TREE AND PROP
   An audit of every 3D world model (buildings in all four holdings, damaged
   versions, hubs, fires, trees and decor) in all four seasons and both looks
   found 29 models with no winter version and most models with no visible
   spring or autumn change. Every model now has all four:
     Winter   snow settles on every upward-facing surface: roofs and awnings,
              wall tops, ledges, crates, barrels, rails, posts and logs (a
              generic pass that reads each model's shape, and skips anything
              already snow-covered)
     Spring   flower clumps and new green at the base; climbing blossom on a
              front corner of anything building-sized
     Autumn   fallen leaves round the base and a few on roofs and ledges
     Summer   unchanged
   INDOORS    The Warehouse is indoors, so it never gets snow on its roofs:
              in Winter its rooms, stores and decor are rimed with frost (and
              the floor too); in Spring weeds and small flowers push up through
              the cracks; in Autumn a few leaves have blown in.
   TREES      Pines put out pale new shoots in Spring; dead trees bud green in
              Spring and keep their moss in Summer; grass tufts flower in
              Spring.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 68
   and undo the patch marked "Index 68".

   3D DESIGN NOTE: WORLD, ADDENDUM
     SEASON PASS  w3dSeasonPass(out, kind, season) runs on every world model
              after its builder. A builder only needs to do what is special to
              it; the pass adds the common seasonal dressing. Opt out per kind:
              W3D_KINDS[kind].seasonPass = false (trees and bushes that do
              their own), or per part: give it zone 'snow', 'frost' or any
              glowing zone and the pass leaves it alone.
     INDOOR   Kinds whose names start with sk_warehouse_, hh_warehouse,
              qm_warehouse or fire_warehouse, and decor drawn in the Warehouse
              (an alias <kind>@in), are indoor: snow becomes 'frost'.
     AUDIT    Every seasonal model differs visibly from its Summer version.
============================================================================ */
for (const z of ['sprFl1', 'sprFl2', 'sprFl3', 'aut1', 'aut2', 'aut3', 'frost', 'shoot']) R3D_MUTE_SKIP.add(z);
const W3D_SP_SKIPZ = new Set(['snow', 'frost', 'ice', 'glyph', 'ink', 'signF', 'signB', 'winglow', 'flame', 'flame2', 'fire', 'fire2', 'ember', 'smoke', 'smokeG', 'water', 'orb', 'eyeglow', 'string', 'rope', 'banner', 'redX', 'tan', 'stew', 'cellIn', 'tentIn', 'hole', 'winD']);
const W3D_SP_ZONES = {frost:'#c4d4e0', sprLeaf:'#5a8a34', sprFl1:'#e8608e', sprFl2:'#f0d040', sprFl3:'#a888ec', aut1:'#c84a20', aut2:'#df8228', aut3:'#e6ae34', shoot:'#a8d070'};
const W3D_SP_KEEP = ['frost', 'sprFl1', 'sprFl2', 'sprFl3', 'aut1', 'aut2', 'aut3', 'shoot', 'sprLeaf'];
const wIndoor = kind => /^(sk_warehouse_|hh_warehouse|qm_warehouse|fire_warehouse)/.test(kind) || /@in$/.test(kind);

/* the season pass (folded: Index 68 no weather indoors, no flowers on the barge, no snow over anything hot;
   maps: the tavern is indoors). The outdoor season dressing is w3dSeasonOutdoor below. */
const HOTZ = new Set(['fire', 'fire2', 'flame', 'flame2', 'ember', 'smoke', 'smokeG', 'stew']);
function w3dSeasonPass(out, kind, se){
  if (/^tv_/.test(kind)) kind += '@in';
  if (!out) return out;
  if (/warehouse/.test(kind) || /@in$/.test(kind)){
    out.zones = Object.assign({}, W3D_SP_ZONES, out.zones || {});
    out.parts = out.parts.filter(q => !['snow', 'frost', 'ice'].includes(q.z));
    out._seasoned = true; return out;
  }
  if (/barge/.test(kind) && se !== 'winter'){ out.zones = Object.assign({}, W3D_SP_ZONES, out.zones || {}); out._seasoned = true; return out; }   // no flowers growing on a ship's deck
  const o = w3dSeasonOutdoor(out, kind, se);
  if (se === 'winter'){
    const ctr = q => q.c || (q.a && q.p ? [(q.a[0] + q.p[0]) / 2, (q.a[1] + q.p[1]) / 2, (q.a[2] + q.p[2]) / 2] : null);
    const hot = o.parts.filter(q => HOTZ.has(q.z)).map(q => ({c:ctr(q), smoke:q.z === 'smoke' || q.z === 'smokeG'})).filter(h => h.c);
    if (hot.length) o.parts = o.parts.filter(q => { if (q.z !== 'snow') return true; const c = ctr(q); if (!c) return true;
      return !hot.some(h => Math.hypot(c[0] - h.c[0], c[2] - h.c[2]) < 26 && (h.smoke ? c[1] > 2.5 : c[1] > h.c[1] - 6)); });
  }
  return o;
}
function w3dSeasonOutdoor(out, kind, se){
  if (!out) return out;
  const K = W3D_KINDS[kind] || {}, indoor = wIndoor(kind);
  if (indoor) for (const q of out.parts) if (q.z === 'snow') q.z = 'frost';
  if (indoor && out.zones) out.zones.frost = out.zones.frost || W3D_SP_ZONES.frost;
  if (out._seasoned) return out; out._seasoned = true;
  out.zones = Object.assign({}, W3D_SP_ZONES, out.zones || {});
  out.keepZones = (out.keepZones || []).concat(W3D_SP_KEEP);
  if (indoor) for (const q of out.parts) if (q.z === 'snow') q.z = 'frost';
  if (K.seasonPass === false || se === 'summer') return out;
  const P = out.parts, root = P.filter(q => q.b === 'root' || !q.b), r = rng(hash(kind + ':' + se)), add = wAdd(P);
  // footprint and height
  let W = 4, D = 3, H = 2;
  for (const q of root){ const c = q.c || q.a || [0, 0, 0], rr = Array.isArray(q.r) ? q.r : [q.r || 0, q.r || 0, q.r || 0];
    if (c[1] - (rr[1] || 0) < 4){ W = Math.max(W, Math.min(70, Math.abs(c[0]) + (rr[0] || 0))); D = Math.max(D, Math.min(45, c[2] + (rr[2] || 0))); }
    for (const e of [q.c, q.a, q.p]) if (e) H = Math.max(H, e[1] + (Array.isArray(q.r) ? q.r[1] : (q.r || 0))); }
  const big = H > 28, tiny = H < 14, k = tiny ? 0.5 : big ? 1 : 0.75;

  if (se === 'winter'){
    // snow on every upward-facing surface not already covered
    const snowCs = P.filter(q => q.z === 'snow' || q.z === 'frost').map(q => q.c || q.a).filter(Boolean);
    const covered = (x, y, z, rx, rz) => snowCs.some(s => Math.abs(s[0] - x) < rx + 1 && Math.abs(s[2] - z) < rz + 1 && s[1] > y - 2.5 && s[1] < y + 6);
    const tops = [];
    for (const q of root){
      if (W3D_SP_SKIPZ.has(q.z)) continue;
      if (q.t === 'box'){ const [rx, ry, rz] = q.r; if (rx < 1.2 && rz < 1.2) continue;
        if (q.rot && (q.rot[0] || q.rot[2])){ const M = m3.eul(q.rot), n = m3.v(M, [0, 1, 0]); if (n[1] < 0.35) continue;
          const c = [q.c[0] + n[0] * (ry + 0.7), q.c[1] + n[1] * (ry + 0.7), q.c[2] + n[2] * (ry + 0.7)]; if (covered(c[0], c[1], c[2], rx * 0.5, rz * 0.5)) continue;
          tops.push({t:'box', c, r:[rx * 0.97, 0.75, rz * 0.97], rot:q.rot}); }
        else { const top = q.c[1] + ry, cx = q.c[0], cz = q.c[2];
          if (root.some(o => o !== q && o.t === 'box' && !o.rot && o.c[1] - o.r[1] >= top - 0.6 && Math.abs(o.c[0] - cx) < o.r[0] && Math.abs(o.c[2] - cz) < o.r[2])) continue;
          if (covered(cx, top, cz, rx, rz)) continue;
          tops.push({t:'box', c:[cx, top + 0.7, cz], r:[rx * 0.94, 0.8, rz * 0.94], rot:q.rot}); } }
      else if (q.t === 'ell'){ const [rx, ry, rz] = q.r; if (rx < 1.8 || rz < 1.8 || q.c[1] < 1.2) continue;
        const top = q.c[1] + ry * 0.72; if (covered(q.c[0], top, q.c[2], rx * 0.6, rz * 0.6)) continue;
        if (root.some(o => o !== q && o.t === 'ell' && o.c[1] > q.c[1] + 0.5 && Math.abs(o.c[0] - q.c[0]) < o.r[0] * 0.8 && Math.abs(o.c[2] - q.c[2]) < o.r[2] * 0.8 && o.r[0] > rx * 0.6)) continue;
        tops.push({t:'ell', c:[q.c[0], top, q.c[2]], r:[rx * 0.74, Math.max(0.8, ry * 0.3), rz * 0.74]}); }
      else if (q.t === 'cap' && q.r >= 0.8){ const dy = Math.abs(q.a[1] - q.p[1]), len = Math.hypot(q.a[0] - q.p[0], q.a[1] - q.p[1], q.a[2] - q.p[2]);
        if (dy < len * 0.35){ const lift = q.r * 0.85, a = [q.a[0], q.a[1] + lift, q.a[2]], p = [q.p[0], q.p[1] + lift, q.p[2]]; if (covered((a[0] + p[0]) / 2, a[1], (a[2] + p[2]) / 2, len / 2, len / 2)) continue; tops.push({t:'cap', a, p, r:q.r * 0.6}); }
        else { const t = q.a[1] > q.p[1] ? q.a : q.p; if (covered(t[0], t[1], t[2], q.r, q.r)) continue; tops.push({t:'ell', c:[t[0], t[1] + q.r * 0.7, t[2]], r:[q.r * 1.05, q.r * 0.55, q.r * 1.05]}); } }
    }
    for (const t of tops.slice(0, 70)) add([Object.assign(t, {z:indoor ? 'frost' : 'snow'})]);
    if (!indoor && !P.some(q => (q.z === 'snow') && (q.c || [0, 9])[1] < 3)) add([{t:'ell', c:[-W * 0.5, 1, D + 2 * k], r:[Math.max(3, W * 0.35), 1.4 * k, 3 * k], z:'snow'}, {t:'ell', c:[W * 0.45, 1, D + 1.5 * k], r:[Math.max(3, W * 0.3), 1.2 * k, 2.6 * k], z:'snow'}]);
    return out;
  }
  if (se === 'spring'){
    const n = tiny ? 2 : big ? (indoor ? 3 : 7) : 4;
    for (let i = 0; i < n; i++){
      const x = (-0.9 + 1.8 * (i + 0.5) / n) * W + (r() - 0.5) * 4, z = D + (2 + r() * 3) * k;
      if (indoor){ for (const dx of [-2, 0, 2]) add([{t:'cap', a:[x + dx, 0, z], p:[x + dx * 1.6, 6 * k + 2, z], r:0.7, z:'sprLeaf'}, {t:'ell', c:[x + dx * 1.3 + 1, 3 * k + 1, z], r:[1.8 * k + 0.6, 0.7, 1.2 * k + 0.4], z:'sprLeaf'}]);
        add([{t:'ell', c:[x, 6.6 * k + 2.4, z], r:[1.4, 1.4, 1.4], z:i % 2 ? 'sprFl2' : 'sprFl3'}]); continue; }
      add([{t:'ell', c:[x, 1.6 * k, z], r:[3.4 * k + 1, 1.8 * k + 0.6, 2.4 * k + 0.6], z:'sprLeaf'}]);
      for (let j = 0; j < 4; j++) add([{t:'ell', c:[x + (j - 1.5) * 2 * k, 3.2 * k + 1.2 + (j % 2), z + (r() - 0.3) * 1.5], r:[1.5 * k + 0.6, 1.5 * k + 0.6, 1.4 * k + 0.5], z:['sprFl1', 'sprFl2', 'sprFl3', 'sprFl1'][(i + j) % 4]}]);
    }
    if (big && !indoor){ const sx = r() < 0.5 ? -1 : 1, x = sx * (W - 3);
      for (let j = 0; j < 7; j++){ const y = 4 + j * Math.min(7, H / 8); add([{t:'ell', c:[x + (r() - 0.5) * 3, y, D + 0.4], r:[3.4, 3.6, 1], z:'sprLeaf'}]); for (let m = 0; m < 2; m++) add([{t:'ell', c:[x + (r() - 0.5) * 6, y + (r() - 0.5) * 3, D + 1.3], r:[1.6, 1.6, 0.7], z:m ? 'sprFl3' : 'sprFl1'}]); } }
    return out;
  }
  if (se === 'autumn'){
    const n = tiny ? 6 : big ? 24 : 12;
    for (let i = 0; i < n; i++) add([{t:'ell', c:[(r() * 2 - 1) * W * 1.1, 0.6, D + (r() * 7 - 1) * k], r:[2.6 * k + 0.8, 0.6, 1.8 * k + 0.6], rot:[0, r() * 3, 0], z:['aut1', 'aut2', 'aut3'][i % 3]}]);
    if (!tiny) for (const sx of [-1, 1]) add([{t:'ell', c:[sx * W * 0.7, 1.2 * k, D + 2 * k], r:[5 * k + 1, 1.8 * k, 3 * k + 1], z:sx > 0 ? 'aut2' : 'aut1'}, {t:'ell', c:[sx * W * 0.7 + 2, 2 * k, D + 2.6 * k], r:[2.6 * k, 1.2 * k, 2 * k], z:'aut3'}]);
    if (!indoor){
      const ups = root.filter(q => q.t === 'box' && q.rot && q.rot[2] && !W3D_SP_SKIPZ.has(q.z) && q.r[0] > 4).slice(0, 2);
      for (const q of ups){ const M = m3.eul(q.rot), nn = m3.v(M, [0, 1, 0]); if (nn[1] < 0.35) continue;
        for (let j = 0; j < 8; j++){ const u = (r() - 0.5) * q.r[0] * 1.6, w = (r() - 0.5) * q.r[2] * 1.6, off = m3.v(M, [u, q.r[1] + 0.6, w]);
          add([{t:'ell', c:[q.c[0] + off[0], q.c[1] + off[1], q.c[2] + off[2]], r:[2.2, 0.6, 1.6], rot:q.rot, z:['aut1', 'aut2', 'aut3'][j % 3]}]); } }
    }
    return out;
  }
  return out;
}
// tree and tuft specials
const W3D_SP_TREE = {
  t_pine:(out, se) => { if (se !== 'spring') return; const add = wCrown(out.parts);
    for (const [y, rr] of [[24, 21], [36, 18], [48, 15], [59, 11]]) for (let j = 0; j < 6; j++){ const a = j / 6 * TAU + y; add('crown', [{t:'ell', c:[Math.cos(a) * rr * 0.85, y + 1.5, Math.sin(a) * rr * 0.7], r:[1, 1.8, 1], z:'shoot'}]); }
    add('crown', [{t:'ell', c:[0, 82, 0], r:[1.4, 2.6, 1.4], z:'shoot'}]); },
  t_dead:(out, se) => { if (se !== 'spring') return; const add = wCrown(out.parts);
    for (const [x, y, z] of [[-12, 46, 2], [14, 44, -3], [4, 52, 3], [-16, 34, 4], [-18, 52, 1], [20, 54, -2], [8, 60, 4]]) add('crown', [{t:'ell', c:[x, y + 1, z], r:[2, 1.6, 1.6], z:'shoot'}, {t:'ell', c:[x + 1.4, y + 2, z + 0.6], r:[1.2, 1, 1], z:'sprLeaf'}]);
    out.parts = out.parts.filter(q => q.z !== 'moss'); },
  dc_tuft:(out, se) => { if (se === 'autumn'){ Object.assign(out.zones, {grass:'#b08a3a', grassL:'#d0a850'}); out.keepZones = (out.keepZones || []).concat(['grass', 'grassL']); wAdd(out.parts)([{t:'ell', c:[3, 0.6, 3], r:[2.2, 0.5, 1.4], z:'aut1'}, {t:'ell', c:[-3, 0.6, 2], r:[1.8, 0.5, 1.2], z:'aut2'}]); return; } if (se !== 'spring') return; const add = wCrown(out.parts); for (const [x, y] of [[-5, 10], [2.6, 12], [5, 9]]) add('crown', [{t:'ell', c:[x + 1.2, y + 1, 0], r:[1.4, 1.2, 1.4], z:'sprFl' + (1 + (x > 0 ? 1 : 0))}]); }
};
for (const k of ['oak', 't_birch', 't_pine', 't_dead', 'dc_bush', 'dc_flowers', 'dc_tuft']) if (W3D_KINDS[k]) W3D_KINDS[k].seasonPass = false;
function w3dWrapKind(kind){
  const K = W3D_KINDS[kind]; if (!K || K._sp) return;
  const b = K.build; K._sp = true;
  K.build = se => { const o = b(se); if (W3D_SP_TREE[kind.replace(/@in$/, '')]) W3D_SP_TREE[kind.replace(/@in$/, '')](o, se); return w3dSeasonPass(o, kind, se); };
}
for (const k of Object.keys(W3D_KINDS)) { W3D_KINDS[k]._b0 = W3D_KINDS[k].build; }
for (const k in W3D.cache) delete W3D.cache[k];
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx68')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx68"><b>Seasons in camp.</b> Every building, tree and prop dresses for the season: snow on every roof, rail and crate in Winter, flowers and blossom in Spring, fallen leaves in Autumn. The Warehouse is indoors: frost, not snow.</p>`);
  };
}
/* ===== END INDEX 68 ======================================================= */

/* ============================================================================
   INDEX 69 - PLANNED CAMPS: STREETS, A DECK PLAN, A WAREHOUSE FLOOR PLAN
   THE FORT (and the Ruined Waystation, which shares its plan)
     A town plan inside the palisade: four streets running east to west, the
     High Street joining the east and west gates, the main street running from
     the south gate up to a cobbled square, and two alleys tying the streets
     together. The Chapter House faces the square; the fire, the wagon and the
     trophy rack stand on it. Faith and learning to the north, the company's
     working buildings along the High Street, the market and stables on the
     square's street, the trades by the south gate. The watchtower stands by
     the gate. The graveyard and the kennels sit outside the east wall.
     Buildings now turn to face the main street: west of it they look east,
     east of it they look west, so no two rows sit at quite the same angle.
   THE BARGE (Dockside Cog-Barge)
     Laid out like a working ship. The Great Cabin, the Captain's Cabin and the
     Apothecary's Cabin are deckhouses on the stern. The hatches (the Brig, the
     Trade Hold, the Horse Hold) run down the centreline between the masts,
     with the Star-Mast, the Fighting Tops and the Crow's Nest on the same
     line and the Prow Shrine at the bow. Crew quarters, the arms locker and
     the work benches line the starboard rail; the Grog Deck, the Galley and
     the Sickbay the larboard rail. Two deck walkways run stern to bow, with
     cross-walks at the masts and the gangway down to the quay amidships.
     Deckhouses are low, with flat roofs, rails and portholes, not houses.
     The Grog Deck is an awning over a barrel bar; the Fighting Deck is weapon
     racks and a dummy on open deck.
   THE WAREHOUSE (Abandoned City Warehouse)
     One big room the company has moved into. No buildings inside it: every
     facility is a bay on the floor, marked out by low partitions or curtains,
     with its furniture inside (bunks, desks and shelves, a bar on barrels,
     cots, an altar, a cart and hay). Offices along the back wall, the trades
     and furnaces down the sides near the flues, the stalls and the carriage
     bay by the great doors. A cart aisle runs from the doors to the Foreman's
     Office, crossed by an aisle between the pillars.
     No weather indoors: no snow, frost, leaves or flowers on anything, no
     frost on the floor, nothing blowing about; one roof leak drips in Winter.
   SNOW SENSE
     Snow no longer settles on or over anything hot: stoves, cauldrons,
     braziers, forges, the kitchen's lean-to roof, fire-ring stones.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 69 and
   undo the patches marked "Index 69".

   3D DESIGN NOTE: WORLD, ADDENDUM
     LAYOUT  CAMP_LAYOUT[fort|barge|warehouse] = {plots:{id:[x, y, view]},
             hub:{house, wagon, fire}, grave, trophy, paddock, masts, roads,
             rects}. applySkin puts it into PLOTS, HUB, GRAVE and TROPHY, so
             clicking, walking and draw order all follow it. view is the
             camera turn for that plot (2 straight on, below 2 turns the front
             to the right, above 2 to the left). roads are polylines
             {pts:[[x,y]...], w}; rects are {x, y, w, h, kind}.
     SKINS   Barge and Warehouse facilities come from skinKind2(holding, id),
             named sk2_<holding>_<id>. Barge cabins are 'deckhouse', the
             tavern 'grog', the barracks 'fightdeck'. Warehouse rooms are
             'wbay' (contents chosen by facility id) and the kennels 'kpen'.
     INDOORS Any kind whose name contains 'warehouse' (or ends in @in) is
             indoors: the season pass removes snow, frost and ice and adds
             nothing.
     HOT     The season pass drops snow within 26 px (across the ground) of
             any part in a hot zone (fire, fire2, flame, flame2, ember, smoke,
             smokeG, stew) when the snow is above that part's base.
============================================================================ */

/* ------------------------------------------------------------- layouts --- */
const fortView = x => Math.max(1.55, Math.min(2.45, 2 + (x - 880) / 1300));
const CAMP_LAYOUT = {
  fort:{
    plots:{
      chapel:[300, 380], fortresschurch:[450, 380], alchemy:[690, 380], magetower:[880, 380], hospital:[1070, 380], ranger:[1230, 380], cells:[1380, 380],
      barracks:[230, 610], armoury:[380, 610], training:[530, 610], command:[690, 610], tavern:[1070, 610], kitchen:[1230, 610], tents:[1380, 610], edelos:[1530, 610],
      stables:[450, 840], merchant:[1230, 840], trapyard:[1380, 840],
      leather:[520, 1020], carpentry:[700, 1020], blacksmith:[1060, 1020], engineering:[1240, 1020],
      palisade:[880, 1100], watchtower:[788, 1100], kennels:[1665, 470]
    },
    hub:{house:[880, 610], wagon:[1030, 830], fire:[880, 760]}, houseView:2,
    grave:{x:1650, y:870}, trophy:[730, 830], paddock:[300, 880],
    roads:[
      {pts:[[250, 410], [1510, 410]], w:30}, {pts:[[110, 640], [1650, 640]], w:38}, {pts:[[200, 870], [1560, 870]], w:32}, {pts:[[440, 1050], [1320, 1050]], w:30},
      {pts:[[880, 870], [880, 1112]], w:40}, {pts:[[610, 410], [610, 1050]], w:24}, {pts:[[1150, 410], [1150, 1050]], w:24},
      {pts:[[880, 168], [880, 410]], w:26}, {pts:[[1650, 640], [1665, 500]], w:20}, {pts:[[1650, 640], [1650, 805]], w:20}
    ],
    rects:[{x:640, y:658, w:480, h:196, kind:'plaza'}],
    signs:[[588, 622], [1172, 622], [858, 1060]]
  },
  barge:{
    plots:{
      command:[400, 450, 1.55], alchemy:[400, 950, 1.55],
      magetower:[540, 650], cells:[820, 650], merchant:[990, 650], watchtower:[1100, 650], stables:[1350, 650], ranger:[1500, 650], chapel:[1640, 650, 1.6],
      armoury:[520, 420], tents:[650, 420], barracks:[780, 420], leather:[910, 420], training:[1040, 420], engineering:[1170, 420, 2.4], carpentry:[1300, 420], trapyard:[1430, 430], fortresschurch:[1520, 480, 1.7],
      tavern:[520, 930], edelos:[660, 930], kitchen:[1100, 930], hospital:[1240, 930], kennels:[1380, 920], blacksmith:[1480, 860],
      palisade:[880, 1046]
    },
    hub:{house:[400, 700], wagon:[800, 975], fire:[965, 985]}, houseView:1.5,
    grave:{x:215, y:650}, trophy:[700, 560], masts:[660, 1200],
    roads:[], rects:[{x:300, y:530, w:1330, h:30, kind:'walk'}, {x:300, y:752, w:1330, h:30, kind:'walk'}, {x:645, y:300, w:30, h:700, kind:'walk'}, {x:1185, y:300, w:30, h:700, kind:'walk'},
      {x:860, y:752, w:40, h:300, kind:'walk'}]
  },
  warehouse:{
    plots:{
      tents:[300, 300], command:[560, 300], tavern:[1180, 300], cells:[1440, 300], fortresschurch:[1620, 300],
      magetower:[140, 520, 1.6], ranger:[140, 780, 1.6], watchtower:[140, 1010, 1.6],
      barracks:[340, 590, 1.85], armoury:[540, 590, 1.9], alchemy:[1220, 590, 2.1], chapel:[1420, 590, 2.15],
      kitchen:[340, 870, 1.85], hospital:[540, 870, 1.9], training:[760, 870], carpentry:[1220, 870, 2.1], engineering:[1420, 870, 2.15], leather:[1630, 870, 2.4],
      kennels:[280, 1045], edelos:[450, 1045], merchant:[620, 1045], palisade:[880, 1095], stables:[1140, 1045], trapyard:[1310, 1045], blacksmith:[1500, 1045, 2.3]
    },
    hub:{house:[880, 320], wagon:[1010, 880], fire:[880, 690]}, houseView:2,
    grave:{x:1610, y:600}, trophy:[740, 560], leak:[700, 690],
    roads:[], rects:[{x:850, y:340, w:60, h:770, kind:'aisle'}, {x:100, y:665, w:1560, h:50, kind:'aisle'}, {x:100, y:405, w:1560, h:34, kind:'aisle'}]
  }
};
const layoutKey = () => holdKey() === 'warehouse' ? 'warehouse' : holdKey() === 'barge' ? 'barge' : 'fort';
const curLayout = () => CAMP_LAYOUT[layoutKey()];
function plotView(id){
  const L = curLayout(), p = L.plots[id];
  if (p && p[2] !== undefined) return p[2];
  if (layoutKey() === 'fort' && p) return fortView(p[0]);
  return undefined;
}
applySkin = (function(prev){
  return function(){
    prev();
    const L = curLayout();
    for (const id in L.plots){ if (PLOTS[id] || BASE_PLOTS[id]) PLOTS[id] = [L.plots[id][0], L.plots[id][1]]; }
    for (const h of ['house', 'wagon', 'fire']) if (L.hub[h]) HUB[h] = {x:L.hub[h][0], y:L.hub[h][1]};
    if (L.grave) Object.assign(GRAVE, L.grave);
    if (L.trophy){ TROPHY.x = L.trophy[0]; TROPHY.y = L.trophy[1]; }
    CAMP.trees = null; CAMP.decor = null; CAMP.dirty = true; CAMP.walk = null; CAMP.aisle = null;
    if (typeof campScenery === 'function' && CAMP.on) campScenery();
  };
})(applySkin);
function paddockAt(){ const L = curLayout(); return L.paddock || [PLOTS.stables[0] + 70, PLOTS.stables[1] + 46]; }
holdingProps = (function(prev){
  return function(){
    const L = curLayout(); let mi = 0;
    return prev().map(p => (p.k === 'mast' && L.masts) ? Object.assign({}, p, {x:L.masts[mi++] || p.x}) : p);
  };
})(holdingProps);

/* --------------------------------------------------------------- roads --- */
function drawCampRoads(){
  const L = CAMP_LAYOUT.fort;
  if (!CAMP.road) CAMP.road = ctx.createPattern(TILE.road(1), 'repeat');
  if (!CAMP.plaza) CAMP.plaza = ctx.createPattern(TILE.floor(0), 'repeat');
  ctx.save(); ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  for (const r of L.roads){ ctx.beginPath(); ctx.moveTo(r.pts[0][0], r.pts[0][1]); for (const p of r.pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = 'rgba(52,38,22,.45)'; ctx.lineWidth = r.w + 6; ctx.stroke(); }
  for (const r of L.roads){ ctx.beginPath(); ctx.moveTo(r.pts[0][0], r.pts[0][1]); for (const p of r.pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = CAMP.road; ctx.lineWidth = r.w; ctx.stroke(); }
  for (const q of L.rects){ ctx.fillStyle = 'rgba(52,38,22,.5)'; ctx.fillRect(q.x - 4, q.y - 4, q.w + 8, q.h + 8); ctx.fillStyle = CAMP.plaza; ctx.fillRect(q.x, q.y, q.w, q.h);
    ctx.strokeStyle = 'rgba(240,230,210,.18)'; ctx.lineWidth = 2; ctx.strokeRect(q.x + 3, q.y + 3, q.w - 6, q.h - 6); }
  // a short drive from every built facility's door to its street
  for (const id in L.plots){ if (!has(id) || !PLOTS[id] || ['palisade', 'watchtower', 'kennels'].includes(id)) continue; const [x, y] = PLOTS[id];   /* Index 77: wherever it was built */
    ctx.fillStyle = CAMP.road; ctx.fillRect(x - 9, y - 2, 18, 22); }
  ctx.restore();
  return true;
}
function summerPattern(make){ const p = window.SEASON_FORCE; window.SEASON_FORCE = 'summer'; try { return make(); } finally { window.SEASON_FORCE = p; } }
drawHoldingBackdrop = (function(prev){
  return function(cx, cy, t){
    const r = prev(cx, cy, t); if (!r) return r;
    const k = layoutKey(), L = CAMP_LAYOUT[k];
    if (k === 'barge'){
      if (!CAMP.walk) CAMP.walk = ctx.createPattern(plankPattern('#c8a070', 7, 5), 'repeat');
      ctx.save(); hullPath(ctx, 16); ctx.clip();
      for (const q of L.rects){ ctx.fillStyle = CAMP.walk; ctx.fillRect(q.x, q.y, q.w, q.h);
        ctx.fillStyle = 'rgba(60,36,18,.55)'; if (q.w > q.h){ ctx.fillRect(q.x, q.y, q.w, 2); ctx.fillRect(q.x, q.y + q.h - 2, q.w, 2); } else { ctx.fillRect(q.x, q.y, 2, q.h); ctx.fillRect(q.x + q.w - 2, q.y, 2, q.h); } }
      ctx.restore();
      // the gangway down to the quay
      ctx.fillStyle = '#7a5230'; ctx.fillRect(860, 1040, 40, 74); ctx.fillStyle = '#5a3a1e'; for (let y = 1046; y < 1112; y += 9) ctx.fillRect(860, y, 40, 2);
      ctx.fillStyle = '#4a2c16'; ctx.fillRect(856, 1040, 4, 74); ctx.fillRect(900, 1040, 4, 74);
    }
    if (k === 'warehouse'){
      if (!CAMP.aisle) CAMP.aisle = ctx.createPattern(summerPattern(() => TILE.floor(0)), 'repeat');
      for (const q of L.rects){ ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.fillRect(q.x - 3, q.y - 3, q.w + 6, q.h + 6); ctx.fillStyle = CAMP.aisle; ctx.fillRect(q.x, q.y, q.w, q.h);
        ctx.strokeStyle = 'rgba(232,206,120,.45)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]); ctx.strokeRect(q.x + 2, q.y + 2, q.w - 4, q.h - 4); ctx.setLineDash([]); }
    }
    return r;
  };
})(drawHoldingBackdrop);
// keep scattered decor off the streets, aisles, walkways, square and plots
const segDist = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
function onPlan(x, y){
  const L = curLayout();
  for (const r of L.roads) for (let i = 1; i < r.pts.length; i++) if (segDist(x, y, r.pts[i - 1], r.pts[i]) < r.w / 2 + 16) return true;
  for (const q of L.rects) if (x > q.x - 14 && x < q.x + q.w + 14 && y > q.y - 14 && y < q.y + q.h + 24) return true;
  for (const id in PLOTS){ const p = PLOTS[id]; if (Math.abs(p[0] - x) < 80 && y > p[1] - 120 && y < p[1] + 40) return true; }
  for (const h of Object.values(HUB)) if (Math.abs(h.x - x) < 90 && y > h.y - 140 && y < h.y + 40) return true;
  if (Math.abs(TROPHY.x - x) < 95 && y > TROPHY.y - 100 && y < TROPHY.y + 30) return true;
  if (layoutKey() === 'fort'){ const pk = paddockAt(); if (Math.abs(pk[0] - x) < 70 && y > pk[1] - 50 && y < pk[1] + 20) return true; }
  return false;
}
campScenery = (function(prev){
  return function(){
    const had = !!CAMP.trees; prev();
    if (had || !CAMP.decor) return;
    CAMP.decor = CAMP.decor.filter(d => !onPlan(d.x, d.y));
    if (layoutKey() === 'fort' && holding() === 'fort') for (const [x, y] of CAMP_LAYOUT.fort.signs) CAMP.decor.push({x, y, k:'sign'});
    if (CAMP.trees) CAMP.trees = CAMP.trees.filter(t => !(Math.hypot(t.x - GRAVE.x, t.y - GRAVE.y) < 140) && !(Math.abs(t.x - CAMP_LAYOUT.fort.plots.kennels[0]) < 90 && Math.abs(t.y - 470) < 110 && layoutKey() === 'fort'));
  };
})(campScenery);

/* -------------------------------------------------------- barge skins --- */
Object.assign(W3D_SKIN, {
  deckhouse:(L, se) => { const P = [], add = wAdd(P), W = L.big ? 44 : 34, D = 22, H = 26;
    add([{t:'box', c:[0, 1.5, 0], r:[W + 2, 1.5, D + 2], z:'deckD'}, {t:'box', c:[0, H / 2 + 3, 0], r:[W, H / 2, D], z:'deckW'}]);
    for (let x = -W + 5; x < W; x += 7) add([{t:'box', c:[x, H / 2 + 3, D + 0.3], r:[0.4, H / 2, 0.3], z:'deckWD'}]);
    add([{t:'box', c:[0, H + 4.5, 0], r:[W + 3, 1.6, D + 3], z:'roofDk'}, {t:'box', c:[0, H + 6.4, 0], r:[W + 2, 0.5, D + 2], z:'roofDkL'}]);
    for (let x = -W; x <= W + 0.1; x += W / 3) add([{t:'cap', a:[x, H + 6, D + 2.4], p:[x, H + 12, D + 2.4], r:0.6, z:'wood'}, {t:'cap', a:[x, H + 6, -D - 2.4], p:[x, H + 12, -D - 2.4], r:0.6, z:'wood'}]);
    add([{t:'box', c:[0, H + 12, D + 2.4], r:[W, 0.6, 0.6], z:'woodL'}, {t:'box', c:[0, H + 12, -D - 2.4], r:[W, 0.6, 0.6], z:'woodL'}, {t:'box', c:[W * 0.45, H + 8, -4], r:[6, 1.6, 5], z:'woodD'}]);
    add([{t:'box', c:[-W * 0.55, 11, D + 0.6], r:[6, 11, 1], z:'woodD'}, {t:'box', c:[-W * 0.55, 10.5, D + 1.2], r:[4.6, 10.5, 0.8], z:'wood'}, {t:'ell', c:[-W * 0.55 + 3, 11, D + 2], r:[0.8, 0.8, 0.6], z:'metal'}]);
    const ports = L.big ? [-4, 14, 30] : [6, 22];
    for (const x of ports) add([{t:'ell', c:[x, H * 0.62, D + 0.8], r:[3.6, 3.6, 0.8], z:'iron'}, {t:'ell', c:[x, H * 0.62, D + 1.3], r:[2.5, 2.5, 0.6], z:'winglow'}]);
    sgn(add, L, ports[0] - 14 < -W * 0.4 ? 8 : -6, H + 1, D + 3, 2.2);
    return {parts:P, zones:SKZ(se, L, {deckW:'#8a5a30', deckWD:'#5e3c1e', roofDk:L.roof || '#5a4a3a', roofDkL:shade(L.roof || '#5a4a3a', 1.2)}), keepZones:['roofDk']}; },
  grog:(L, se) => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-30, -14], [30, -14], [-30, 14], [30, 14]]) add([{t:'box', c:[x, 18, z], r:[1.4, 18, 1.4], z:'wood'}]);
    for (let i = 0; i < 7; i++) add([{t:'box', c:[-27 + i * 9, 37, 0], r:[4.5, 1.2, 17], rot:[0.12, 0, 0], z:i % 2 ? 'awn2' : 'awn'}]);
    barrel(add, -16, 6); barrel(add, 16, 6); add([{t:'box', c:[0, 13, 6], r:[22, 1, 4.4], z:'woodL'}]);
    for (const [x, y] of [[-8, 15.6], [2, 15.6], [10, 15.6]]) add([{t:'ell', c:[x, y, 6], r:[1.2, 1.6, 1.2], z:'pewter'}]);
    for (const [x, z] of [[-18, -6], [-8, -8], [2, -6]]) add([{t:'ell', c:[x, 5, z], r:[4, 4.6, 4], z:'wood'}, {t:'ell', c:[x, 5, z + 4], r:[2, 2, 0.6], z:'iron'}]);
    for (const x of [-20, 20]) add([{t:'cap', a:[x, 0, 18], p:[x, 6, 18], r:2.2, z:'woodD'}, {t:'ell', c:[x, 6.4, 18], r:[2.6, 0.6, 2.6], z:'woodL'}]);
    add([{t:'cap', a:[30, 30, 15], p:[38, 30, 15], r:0.5, z:'iron'}]); W3K.sign(add, 'mug', 38, 24, 15.6, 1.8);
    return {parts:P, zones:SKZ(se, L, {awn:'#8a3a2a', awn2:'#d8c8a0', pewter:'#9a9a94'}), keepZones:['awn', 'awn2']}; },
  fightdeck:(L, se) => { const P = [], add = wAdd(P);
    for (const x of [-30, 24]){ add([{t:'box', c:[x - 9, 12, -6], r:[1, 12, 1], z:'wood'}, {t:'box', c:[x + 9, 12, -6], r:[1, 12, 1], z:'wood'}, {t:'box', c:[x, 18, -6], r:[10, 1, 1.4], z:'woodD'}, {t:'box', c:[x, 6, -6], r:[10, 1, 1.4], z:'woodD'}]);
      for (let k = -2; k <= 2; k++) add([{t:'cap', a:[x + k * 3.6, 2, -4], p:[x + k * 3.6 - 1, 32, -7], r:0.5, z:'woodL'}, {t:'ell', c:[x + k * 3.6 - 1, 33, -7], r:[0.8, 2, 0.8], z:'metal'}]); }
    for (const x of [-12, -3, 6]) add([{t:'ell', c:[x, 8, 10], r:[1.2, 7, 5.4], z:'shieldC'}, {t:'ell', c:[x + 1.2, 8, 10], r:[0.7, 1.8, 1.8], z:'metal'}]);
    add([{t:'cap', a:[0, 0, -16], p:[0, 34, -16], r:1.6, z:'wood'}, {t:'cap', a:[-10, 26, -16], p:[10, 26, -16], r:1.2, z:'wood'}, {t:'ell', c:[0, 23, -16], r:[6, 9, 5], z:'straw'}, {t:'ell', c:[0, 36, -16], r:[4.4, 4.6, 4.2], z:'sack'}]);
    add([{t:'box', c:[38, 14, 14], r:[1, 14, 1], z:'wood'}]); W3K.sign(add, 'shield', 38, 30, 15, 2);
    return {parts:P, zones:SKZ(se, L, {shieldC:'#7a3e26', sack:'#c8b088'})}; }
});

/* ---------------------------------------------------- warehouse bays --- */
function bayBase(add, W, D, H, wall){
  add([{t:'box', c:[0, 0.35, 0], r:[W, 0.35, D], z:'bayF'}]);
  add([{t:'box', c:[0, H / 2, -D], r:[W, H / 2, 1.1], z:wall}, {t:'box', c:[0, H + 0.6, -D], r:[W + 0.8, 0.7, 1.6], z:'partD'}]);
  for (const sx of [1, -1]) add([{t:'box', c:[sx * W, H / 2, -D * 0.35], r:[1.1, H / 2, D * 0.65], z:wall}, {t:'box', c:[sx * W, H + 0.6, -D * 0.35], r:[1.6, 0.7, D * 0.65 + 0.6], z:'partD'},
    {t:'box', c:[sx * W, (H + 2) / 2, -D], r:[1.8, (H + 2) / 2, 1.8], z:'partD'}, {t:'box', c:[sx * W, (H + 2) / 2, D * 0.3], r:[1.8, (H + 2) / 2, 1.8], z:'partD'}]);
  if (wall === 'curtain') for (let x = -W + 4; x < W; x += 6) add([{t:'box', c:[x, H / 2, -D + 1.2], r:[0.6, H / 2, 0.4], z:'curtainD'}]);
}
const cot = (add, x, z) => add([{t:'box', c:[x, 4.6, z], r:[4, 0.8, 9], z:'wood'}, {t:'box', c:[x, 5.8, z], r:[3.6, 0.7, 8.6], z:'linen'}, {t:'ell', c:[x, 6.8, z - 6.4], r:[2.6, 1, 1.8], z:'linen'},
  {t:'box', c:[x, 6.2, z + 2], r:[3.8, 0.6, 5], z:'blanket'}, {t:'box', c:[x - 3.6, 2.2, z - 8], r:[0.6, 2.2, 0.6], z:'woodD'}, {t:'box', c:[x + 3.6, 2.2, z + 8], r:[0.6, 2.2, 0.6], z:'woodD'}]);
const shelf = (add, x, z, w, items) => { add([{t:'box', c:[x, 12, z], r:[w, 12, 2.4], z:'wood'}]); for (const y of [7, 14, 21]){ add([{t:'box', c:[x, y, z + 1], r:[w, 0.5, 2.6], z:'woodL'}]);
  for (let i = 0; i < w / 2.4; i++) add([{t:'ell', c:[x - w + 2 + i * 4.4, y + 1.8, z + 1.4], r:[1.2, 1.8, 1.2], z:items[i % items.length]}]); } };
const table = (add, x, z, w, d) => { add([{t:'box', c:[x, 9, z], r:[w, 0.8, d], z:'woodL'}]); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add([{t:'box', c:[x + sx * (w - 1.4), 4.2, z + sz * (d - 1.2)], r:[0.7, 4.2, 0.7], z:'wood'}]); };
const BAY = {
  house:(add, L) => { bayBase(add, 52, 26, 24, 'part'); add([{t:'box', c:[0, 1.2, -8], r:[44, 1.2, 16], z:'woodD'}]); table(add, -10, -6, 14, 7);
    add([{t:'box', c:[-14, 10.6, -6], r:[4, 0.4, 3], z:'paper'}, {t:'box', c:[-4, 10.6, -6], r:[6, 0.3, 4], z:'map'}, {t:'box', c:[18, 6, -14], r:[7, 6, 4], z:'crate'}, {t:'box', c:[18, 12.4, -14], r:[7.4, 0.6, 4.4], z:'gold'}]);
    add([{t:'box', c:[-28, 15, -24.6], r:[8, 10, 0.4], z:'banner'}, {t:'box', c:[28, 15, -24.6], r:[8, 10, 0.4], z:'banner'}, {t:'box', c:[0, 16, -24.6], r:[10, 7, 0.3], z:'map'}]);
    shelf(add, -42, -20, 7, ['paper', 'book']); W3K.sign(add, 'flag', 30, 26, -24, 2.2); },
  command:(add, L) => { bayBase(add, 38, 24, 20, 'part'); table(add, -4, -6, 12, 6);
    add([{t:'box', c:[-8, 10.4, -6], r:[3.4, 0.5, 2.4], z:'paper'}, {t:'box', c:[6, 11, -6], r:[3, 1.4, 2.2], z:'crate'}, {t:'ell', c:[6, 13, -6], r:[2.6, 0.8, 1.8], z:'gold'}, {t:'box', c:[-4, 5, 2], r:[3, 0.6, 3], z:'wood'}]);
    shelf(add, 28, -18, 7, ['paper', 'book']); add([{t:'box', c:[-18, 12, -22.6], r:[9, 6, 0.3], z:'map'}]); W3K.sign(add, L.g || 'flag', 8, 15, -22.4, 2); },
  tavern:(add, L) => { bayBase(add, 40, 24, 18, 'part'); barrel(add, -24, -10); barrel(add, -6, -10); add([{t:'box', c:[-15, 13, -10], r:[16, 0.9, 4.4], z:'woodL'}]);
    for (const [x, y] of [[-26, 15], [-16, 15], [-6, 15]]) add([{t:'ell', c:[x, y, -10], r:[1.2, 1.6, 1.2], z:'pewter'}]);
    for (let k = 0; k < 3; k++) add([{t:'ell', c:[22 + (k % 2) * 9, 5 + (k > 1 ? 8.6 : 0), -16], r:[4, 4.4, 4], z:'wood'}, {t:'ell', c:[22 + (k % 2) * 9, 5 + (k > 1 ? 8.6 : 0), -12], r:[1.6, 1.6, 0.6], z:'iron'}]);
    for (const [x, z] of [[-14, 10], [14, 8]]){ add([{t:'cap', a:[x, 0, z], p:[x, 8, z], r:1, z:'wood'}, {t:'ell', c:[x, 8.6, z], r:[6, 0.8, 6], z:'woodL'}, {t:'ell', c:[x, 10, z], r:[1, 1.4, 1], z:'pewter'}]);
      for (const sx of [-1, 1]) add([{t:'cap', a:[x + sx * 8, 0, z], p:[x + sx * 8, 5, z], r:1.6, z:'woodD'}]); }
    W3K.sign(add, 'mug', 14, 13, -22.4, 2); },
  barracks:(add, L) => { bayBase(add, 44, 24, 18, 'part');
    for (const x of [-30, -10, 10]){ for (const sx of [-1, 1]) for (const sz of [-1, 1]) add([{t:'box', c:[x + sx * 6, 11, -8 + sz * 9], r:[0.8, 11, 0.8], z:'wood'}]);
      for (const y of [5, 15]) add([{t:'box', c:[x, y, -8], r:[6.4, 0.8, 9.6], z:'wood'}, {t:'box', c:[x, y + 1.3, -8], r:[5.8, 0.7, 9.2], z:'blanket'}, {t:'ell', c:[x, y + 2, -15.6], r:[3.4, 1, 1.6], z:'linen'}]);
      add([{t:'box', c:[x, 3, 6], r:[5, 3, 3], z:'crate'}]); }
    add([{t:'box', c:[32, 12, -10], r:[1, 12, 8], z:'wood'}]); for (let k = -2; k <= 2; k++) add([{t:'cap', a:[33, 2, -10 + k * 3.4], p:[34, 28, -10 + k * 3.4], r:0.5, z:'woodL'}, {t:'ell', c:[34, 29, -10 + k * 3.4], r:[0.8, 2, 0.8], z:'metal'}]);
    W3K.sign(add, L.g || 'shield', 30, 13, -22.4, 2); },
  stables:(add, L) => { add([{t:'box', c:[0, 0.35, 0], r:[42, 0.35, 24], z:'bayF'}]);
    for (const x of [-42, 42]) W3K.fenceZ(add, -24, 14, x, 10, 'summer', 9); W3K.fence(add, -42, 42, -24, 10, 'summer', 14);
    add([{t:'box', c:[-6, 10, -2], r:[18, 1.4, 9], z:'wood'}, {t:'box', c:[-6, 13, -10.6], r:[18, 3, 0.8], z:'wood'}, {t:'box', c:[-6, 13, 6.6], r:[18, 3, 0.8], z:'wood'}]);
    for (const [x, z] of [[-18, 9], [6, 9], [-18, -12], [6, -12]]) add([{t:'ell', c:[x, 7, z], r:[7, 7, 1.2], z:'woodD'}, {t:'ell', c:[x, 7, z + Math.sign(z) * 0.8], r:[1.6, 1.6, 1], z:'iron'}]);
    add([{t:'cap', a:[12, 9, -6], p:[34, 4, -8], r:0.8, z:'wood'}, {t:'cap', a:[12, 9, 2], p:[34, 4, 4], r:0.8, z:'wood'}]);
    for (const [x, z] of [[28, -16], [36, -16], [32, -16 + 0]]) add([{t:'box', c:[x, z === -16 && x === 32 ? 13 : 5, z], r:[5, 5, 4], z:'hay'}]);
    add([{t:'box', c:[-30, 3, 14], r:[8, 3, 3], z:'wood'}, {t:'box', c:[-30, 5.8, 14], r:[7, 0.5, 2.4], z:'water'}]); W3K.sign(add, 'horse', 30, 22, -23, 1.8); add([{t:'box', c:[30, 11, -24], r:[1, 11, 1], z:'wood'}]); },
  hospital:(add, L) => { bayBase(add, 42, 24, 22, 'curtain'); for (const x of [-26, -6, 14]) cot(add, x, -6); shelf(add, 32, -18, 6, ['bot1', 'bot3', 'paper']);
    add([{t:'box', c:[-8, 15, -22.6], r:[1.8, 6, 0.5], z:'redX'}, {t:'box', c:[-8, 16, -22.6], r:[5.4, 1.8, 0.5], z:'redX'}, {t:'ell', c:[30, 4, 12], r:[5, 3, 4], z:'metal'}]); },
  alchemy:(add, L) => { bayBase(add, 38, 24, 20, 'part'); table(add, -12, -8, 12, 6);
    for (const [x, c] of [[-20, 'bot1'], [-15, 'bot2'], [-9, 'bot3'], [-4, 'bot1']]) add([{t:'ell', c:[x, 12.4, -8], r:[1.6, 2.4, 1.6], z:c}, {t:'cap', a:[x, 14.4, -8], p:[x, 16.6, -8], r:0.5, z:c}]);
    shelf(add, 26, -18, 7, ['bot1', 'bot2', 'bot3']);
    add([{t:'ell', c:[14, 6, 6], r:[7, 6, 7], z:'iron'}, {t:'ell', c:[14, 11.6, 6], r:[5.6, 0.8, 5.6], z:'brew'}, {t:'ell', c:[14, 18, 6], r:[4, 3.4, 4], z:'smokeG'}, {t:'ell', c:[15, 25, 5], r:[3, 3, 3], z:'smokeG'}]);
    W3K.sign(add, 'potion', -20, 15, -22.4, 2); },
  chapel:(add, L, big) => { const W = big ? 44 : 36; bayBase(add, W, 24, big ? 26 : 22, 'altarCloth');
    add([{t:'box', c:[0, 5, -14], r:[12, 5, 5], z:'stone'}, {t:'box', c:[0, 10.4, -14], r:[13, 0.6, 5.6], z:'linen'}, {t:'box', c:[0, 7, -8.6], r:[6, 3, 0.4], z:'gold'}]);
    for (const x of [-9, -5, 5, 9]) add([{t:'cap', a:[x, 11, -14], p:[x, 15, -14], r:0.8, z:'linen'}, {t:'ell', c:[x, 16.4, -14], r:[0.8, 1.4, 0.8], z:'fire2'}]);
    for (const z of [2, 12]) add([{t:'box', c:[0, 3, z], r:[16, 0.8, 2.4], z:'wood'}, {t:'box', c:[-13, 1.5, z], r:[0.8, 1.5, 2], z:'woodD'}, {t:'box', c:[13, 1.5, z], r:[0.8, 1.5, 2], z:'woodD'}]);
    if (big) for (const sx of [-1, 1]) add([{t:'box', c:[sx * 30, 16, -22.6], r:[6, 11, 0.4], z:'banner'}]);
    W3K.sign(add, 'sun', 0, big ? 21 : 18, -22.4, 2); }
};
Object.assign(W3D_SKIN, {
  wbay:(L, se) => { const P = [], add = wAdd(P), id = L.id;
    const b = id === 'command' ? BAY.command : id === 'tavern' ? BAY.tavern : id === 'barracks' || id === 'bunks' ? BAY.barracks : id === 'stables' ? BAY.stables : id === 'hospital' ? BAY.hospital
      : id === 'alchemy' ? BAY.alchemy : id === 'chapel' ? BAY.chapel : id === 'fortresschurch' ? ((a, l) => BAY.chapel(a, l, true)) : id === 'house' ? BAY.house : BAY.command;
    b(add, L);
    return {parts:P, zones:SKZ(se, L, {bayF:L.rug || '#6a4a3a', part:'#8a6a44', partD:'#5a4028', curtain:'#ddd2bc', curtainD:'#bcae94', altarCloth:'#5a3a6a', linen:'#ece4d0', blanket:'#7a5a8a',
      paper:'#e0d4b4', map:'#c8b484', book:'#7a3e26', pewter:'#9a9a94', bot1:'#7ac05a', bot2:'#c04a6a', bot3:'#4a8ac0', brew:'#9ae070', smokeG:'#9ae070', hay:'#c8a850', water:'#2e6884', banner:(() => { try { return banner().c1; } catch (e) { return '#8a1a1a'; } })()}),
      keepZones:['curtain', 'curtainD', 'altarCloth', 'linen', 'blanket', 'bot1', 'bot2', 'bot3', 'brew', 'smokeG', 'banner', 'redX']}; },
  kpen:(L, se) => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 0.35, 0], r:[30, 0.35, 18], z:'bayF'}]); W3K.fence(add, -30, 30, -18, 10, 'summer', 10); W3K.fence(add, -30, 30, 18, 10, 'summer', 10); W3K.fenceZ(add, -18, 18, -30, 10, 'summer', 9); W3K.fenceZ(add, -18, 18, 30, 10, 'summer', 9);
    add([{t:'box', c:[-12, 7, -6], r:[10, 7, 8], z:'wood'}, {t:'box', c:[-12, 7, 2.1], r:[4, 5, 0.4], z:'tentIn'}, {t:'box', c:[-17, 16, -6], r:[6.4, 1, 9], rot:[0, 0, 0.6], z:'woodD'}, {t:'box', c:[-7, 16, -6], r:[6.4, 1, 9], rot:[0, 0, -0.6], z:'woodD'}]);
    add([{t:'ell', c:[14, 1.6, 6], r:[4, 1.4, 3], z:'iron'}, {t:'ell', c:[14, 2.8, 6], r:[3, 0.4, 2.2], z:'water'}, {t:'ell', c:[6, 1.4, 10], r:[2.6, 1, 1], z:'bone'}, {t:'box', c:[26, 12, 18.6], r:[1, 12, 1], z:'wood'}]);
    W3K.sign(add, 'boot', 26, 24, 19.4, 1.6);
    return {parts:P, zones:SKZ(se, L, {bayF:'#5a4a30', water:'#2e6884', bone:'#e0d6bc'})}; }
});
Object.assign(SK_SCALE, {deckhouse:1.2, grog:1.2, fightdeck:1.2, wbay:1.15, kpen:1.2});
const SK2_MAP = {
  barge:(L, id) => L.t === 'cabin' ? (id === 'tavern' ? 'grog' : id === 'barracks' ? 'fightdeck' : 'deckhouse') : L.t,
  warehouse:(L, id) => L.t === 'room' ? 'wbay' : (id === 'kennels' ? 'kpen' : L.t)
};
function skinKind2(hk, id){
  const L0 = (hk === 'barge' ? BARGE_LOOK : WARE_LOOK)[id] || W3D_EXTRA_LOOK[hk][id]; if (!L0) return null;
  const t = SK2_MAP[hk](L0, id); if (!W3D_SKIN[t]) return null;
  const L = Object.assign({id}, L0, {t});
  return wKind('sk2_' + hk + '_' + id, () => ({frame:[120, 120, 6], view:2.3, keep:0.72, clip:'still', scale:SK_SCALE[t] || 1.1, build:se => W3D_SKIN[t](L, se)}));
}
W3D_KINDS.hh_barge.build = se => { const o = W3D_SKIN.deckhouse({big:1, roof:'#7a3e26', g:'flag'}, se), add = wAdd(o.parts);
  for (const z of [-14, 14]) add([{t:'cap', a:[-46, 34, z], p:[-52, 34, z], r:0.6, z:'iron'}, {t:'ell', c:[-52, 30, z], r:[2.4, 3.4, 2.4], z:'winglow'}]);
  add([{t:'cap', a:[-30, 32, 0], p:[-30, 66, 0], r:0.9, z:'wood'}, {t:'box', c:[-22, 60, 0], r:[8, 5, 0.5], z:'banner'}]);
  o.zones.banner = (() => { try { return banner().c1; } catch (e) { return '#8a1a1a'; } })(); return o; };
W3D_KINDS.hh_barge.scale = 1.3;
W3D_KINDS.hh_warehouse.build = se => W3D_SKIN.wbay({id:'house', g:'flag', rug:'#5a3a2a'}, se);
W3D_KINDS.hh_warehouse.scale = 1.2;

/* -------------------------------------------------------------- hooks --- */
// one roof leak, nothing else blowing about, indoors
syncSeasonParticles = (function(prev){
  return function(mode, w, h){
    const ware = mode === 'camp' && holding() === 'warehouse', s = currentSeason();
    if (!ware){ SEASON_FX._ws = null; return prev(mode, w, h); }
    if (SEASON_FX._ws === s) return;
    prev(mode, w, h);
    const lk = CAMP_LAYOUT.warehouse.leak;
    SEASON_FX.items = []; SEASON_FX.puddles = [{x:lk[0], y:lk[1], rx:15, ry:8, ang:0.1, seed:7, leak:true}];
    SEASON_FX._ws = s;
  };
})(syncSeasonParticles);
for (const k in W3D.cache) delete W3D.cache[k];
for (const k of Object.keys(W3D_KINDS)) if (/^sk_/.test(k)) delete W3D_KINDS[k];
try { applySkin(); } catch (e) {}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx69')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx69"><b>Camp plans.</b> The fort is laid out on streets round a square, with the High Street between the east and west gates. On the barge, cabins sit on the stern, holds down the centreline and work along the rails. In the warehouse each facility is a bay on the floor, not a building, and no weather comes indoors.</p>`);
  };
}
/* ===== END INDEX 69 ======================================================= */

