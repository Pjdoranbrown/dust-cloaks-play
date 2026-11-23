/* js/3d/world-1.js (INT-1 step 2, 2026-11-16): INDEX 61 to 65 (3D world, ground, fort facilities).
   Cut unchanged from the inline script in index.html (old lines 21283 to 22330). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 61 - 3D WORLD PROTOTYPE: THE CHAPTER HOUSE, THE CAMPFIRE AND THE OAK
   A static prop pipeline for buildings, trees and decor, using the same
   renderer, palette, light bands and outlines as the 3D characters. Built in
   the Frontier Timber Fort for now:
     Chapter House  stone walls with quoins and coursing, a gabled tile roof
                    with a ridge, gable ends and chimney, a timber door, lit
                    windows with shutters and the Chapter's sign
     Campfire       a ring of stones, crossed logs and flickering flames
     Oak            a trunk with roots and branches and a full crown that
                    sways in the wind. Camp oaks only; pines and birches, and
                    the trees on contract maps, are still pixel art.
   SEASONS          Spring: lighter leaves with blossom, flower boxes under the
                    windows. Summer: deep green, ivy on the house. Autumn: orange
                    and red leaves, leaf drifts. Winter: bare branches, snow on
                    the roof, branches, stones and window ledges, icicles.
   SETTINGS         "3D world" is its own switch, separate from the 3D characters.
   Click areas and draw order are unchanged: each 3D model is drawn inside the
   same box as the pixel art it replaces. New frames render in the background
   and the pixel art shows until they are ready.
   Nothing new is saved except the setting. Rollback: delete from this comment
   to END INDEX 61 and undo the three patches marked "Index 61".

   ===========================================================================
   3D DESIGN NOTE: WORLD  (read with the character note, Index 50 to 60)
   ===========================================================================
   UNITS        World recipes are built in SCREEN PIXELS: 1 unit = 1 screen pixel
                at the camp's zoom. y is up, the front of a building faces +z
                (toward the viewer), the ground is y = 0, the footprint is
                centred on x = 0, z = 0.
   RECIPE       w3dRecipe(kind, season) returns a cached recipe:
                  {rig:'world', skel:{order, bones}, parts:[...], zones:{...},
                   frame:wFrame(widthPx, heightPx, groundPx), view, keep}
                Bones: 'root' (static), plus any animated bones the kind needs
                ('flame', 'crown'). Parts use the shapes of the character note
                (ell, cap, box) and any zone name.
   BUILDERS     W3D_KINDS[kind] = {build(season) -> {parts, bones?, zones},
                frame:[w, h, ground], view, mirror, keep, clip}
                  view    the camera turn, in direction units (2 = straight on,
                          2.3 = a little from the right). Use the same view for
                          everything in a set so the light agrees.
                  mirror  true: a second view at 4 - view (trees use this so
                          neighbours do not look identical)
                  keep    how much of the original colour survives the muting
                          (characters 0, bosses 0.7, world 0.55)
                  clip    'still' (1 frame), 'flicker' (4 frames, the 'flame'
                          bone wobbles) or 'sway' (4 frames, 'crown' rocks)
   FOOTPRINT    The 3D model REPLACES the pixel art inside the pixel art's own
   AND ANCHOR   rectangle. Click areas (objRect, campHit), walking blockers
                and draw order (y-sorting) all keep using the pixel object, so
                they do not change. Draw with w3dDraw(rec, x, groundY, opts):
                groundY is where the pixel art's base meets the ground:
                  buildings  o.y + 8 - 4 (the pixel canvas has 4 rows below the
                             wall base)
                  campfire   HUB.fire.y + 6
                  trees      t.y + 2
                Keep the model's widest point inside the pixel art's width so
                it never pokes out of its click box.
   SEASONS      w3dSeason() returns spring|summer|autumn|winter (the game's own
                season). A builder gets the season and can (a) recolour zones
                and (b) add or drop parts. The season is part of the recipe, so
                each season is cached separately, and only the current one is
                ever rendered. Conventional seasonal zones: leaf leafD leafL
                (foliage), blossom, snow (always pale and bright), ice, ivy,
                flower, drift.
   CACHE        Frames are cached by recipe, look (Retro, Crisp) and view, and
                rendered in the background with r3dFramesAsync. While a frame
                is missing, w3dDraw returns false and the caller draws the
                pixel art.
   SWITCH       none since PL-1.1: w3dOn() is always true (kept for add-ons)
                AND a 3D look is chosen for the characters (the world uses the
                same Retro or Crisp look).
   ADDING A BUILDING
                1. add a W3D_KINDS entry built from boxes (walls, beams),
                   rotated boxes (roof slopes: a slope of angle a on the +z
                   side is rot [a, 0, 0]) and caps (posts, logs);
                2. size it to the pixel art: width = pixel canvas width x
                   draw scale (BSCALE 3.3, the house 3.9);
                3. in the drawing hook, call w3dDraw for that building id
                   and fall back to the pixel art when it returns false.
============================================================================ */
for (const z of ['winglow', 'flame', 'flame2', 'ember', 'snow']) { if (z !== 'snow') R3D.EMIT.add(z); R3D_MUTE_SKIP.add(z); }
R3D_MUTE_SKIP.add('blossom'); R3D_MUTE_SKIP.add('flower');
const W3D = {S:R3D.K / R3D_BASE.SC, cache:{}};      // the draw scale that makes 1 unit = 1 screen pixel
const wFrame = (w, h, g) => ({W:w * R3D_BASE.SC, H:h * R3D_BASE.SC, FEET:(h - g) * R3D_BASE.SC, CX:w / 2 * R3D_BASE.SC});
const w3dSeason = () => { try { if (typeof isBrawl === 'function' && isBrawl()) return 'summer';   /* Index 70: the tavern is indoors */
  return currentSeason(); } catch (e) { return 'summer'; } };
const w3dOn = () => true;   /* PL-1.1: always on (the world3d switch is gone) */
R3D_CLIPS.world = {
  still:{n:1, fn:() => ({bob:0})},
  flicker:{n:4, fn:t => { const a = t * Math.PI * 2; return {bob:0, flame:[0.1 * Math.sin(a), 0.4 * a, 0.12 * Math.cos(a * 2)]}; }},
  sway:{n:4, fn:t => { const a = t * Math.PI * 2; return {bob:0, crown:[0.035 * Math.sin(a), 0, 0.05 * Math.sin(a + 0.7)]}; }}
};
for (const c of ['idle', 'walk']) R3D_CLIPS.world[c] = R3D_CLIPS.world.still;

/* ---------------------------------------------------------------- kinds --- */
const W3D_KINDS = {
  house:{frame:[200, 230, 8], view:2.3, keep:0.6, clip:'still', scale:1.18,
    build:season => {
      const P = [], add = list => { for (const q of list) P.push(Object.assign({b:'root'}, q)); };
      // the gable faces the viewer, like the pixel house: the ridge runs front to back (z)
      const W = 44, D = 32, H = 62, top = H + 3, ridge = top + 42, eave = W + 7, sa = Math.atan2(ridge - top, eave), sl = Math.hypot(ridge - top, eave) / 2;
      add([{t:'box', c:[0, 3, 0], r:[W + 4, 3, D + 4], z:'stoneD'}, {t:'box', c:[0, H / 2 + 3, 0], r:[W, H / 2, D], z:'stone'}]);
      for (const sx of [1, -1]) for (let y = 8; y < H; y += 10) add([{t:'box', c:[sx * (W - 3), y, D - 3], r:[4, 4.5, 4], z:(y / 10 | 0) % 2 ? 'stoneL' : 'stone'}]);
      for (const y of [18, 34, 50]) add([{t:'box', c:[0, y, D + 0.3], r:[W - 6, 0.5, 0.4], z:'stoneD'}]);
      // gable end over the front wall, and the back one
      for (const sz of [1, -1]) for (let k = 0; k < 6; k++){ const y = top + k * 7, hw = W * (1 - (k + 0.5) / 6.1); add([{t:'box', c:[0, y + 3.5, sz * (D - 0.5)], r:[hw, 3.5, 1], z:k % 2 ? 'stone' : 'stoneL'}]); }
      add([{t:'box', c:[0, 18, D + 0.5], r:[11, 18, 1.2], z:'stoneD'}, {t:'box', c:[0, 16.5, D + 1.2], r:[8.5, 16.5, 1], z:'wood'},
           {t:'box', c:[0, 16.5, D + 2.3], r:[0.5, 16.5, 0.4], z:'woodD'}, {t:'ell', c:[5, 16, D + 2.4], r:[1.1, 1.1, 0.8], z:'gold'}]);
      for (const sx of [1, -1]) add([{t:'box', c:[sx * 27, 36, D + 0.6], r:[8, 9.5, 0.8], z:'stoneD'}, {t:'box', c:[sx * 27, 36, D + 1], r:[6.2, 7.8, 0.6], z:'winglow'},
        {t:'box', c:[sx * 27, 36, D + 1.6], r:[0.5, 7.8, 0.4], z:'woodD'}, {t:'box', c:[sx * 27, 36, D + 1.6], r:[6.2, 0.5, 0.4], z:'woodD'},
        {t:'box', c:[sx * 27, 26, D + 2], r:[8.5, 1, 2], z:'stoneD'}]);
      // the Chapter's sign on the gable
      add([{t:'box', c:[0, top + 15, D + 1.4], r:[10, 9, 1], z:'wood'}, {t:'box', c:[-2, top + 15, D + 2.4], r:[0.7, 7, 0.5], z:'woodD'}, {t:'box', c:[2.6, top + 18, D + 2.4], r:[4.6, 3.4, 0.5], z:'banner'}]);
      // roof: two slopes, tile courses and a ridge
      for (const sx of [1, -1]){
        add([{t:'box', c:[sx * eave / 2, (top + ridge) / 2 + 2, 0], r:[sl + 2, 2.4, D + 7], rot:[0, 0, -sx * sa], z:'roof'}]);
        for (const k of [0.22, 0.48, 0.74]) add([{t:'box', c:[sx * eave * k, top + (ridge - top) * (1 - k) + 4.4, 0], r:[1.1, 0.7, D + 7.2], rot:[0, 0, -sx * sa], z:'roofD'}]);
      }
      add([{t:'cap', a:[0, ridge + 3.4, -D - 7], p:[0, ridge + 3.4, D + 7], r:2.6, z:'roofD'}]);
      add([{t:'box', c:[24, ridge - 2, -14], r:[6.5, 18, 6.5], z:'stone'}, {t:'box', c:[24, ridge + 16.5, -14], r:[8, 1.6, 8], z:'stoneD'}]);
      if (season === 'winter'){
        for (const sx of [1, -1]) add([{t:'box', c:[sx * eave / 2 + sx * 0.4, (top + ridge) / 2 + 5, 0], r:[sl + 1.6, 1.6, D + 7.4], rot:[0, 0, -sx * sa], z:'snow'}]);
        add([{t:'cap', a:[0, ridge + 5.6, -D - 7], p:[0, ridge + 5.6, D + 7], r:2.2, z:'snow'}, {t:'box', c:[24, ridge + 19, -14], r:[8.4, 1.4, 8.4], z:'snow'}]);
        for (const sx of [1, -1]) add([{t:'box', c:[sx * 27, 27.6, D + 2.6], r:[8.6, 1, 2.2], z:'snow'}]);
        for (let z = -D; z <= D; z += 8) for (const sx of [1, -1]) add([{t:'cap', a:[sx * (eave + 1), top + 1, z], p:[sx * (eave + 1), top - 5 - (Math.abs(z) % 6), z], r:0.7, z:'ice'}]);
        add([{t:'ell', c:[-W + 4, 2, D + 4], r:[14, 3.4, 6], z:'snow'}, {t:'ell', c:[W - 8, 2, D + 3], r:[16, 3, 5], z:'snow'}]);
      } else if (season === 'spring'){
        for (const sx of [1, -1]){ add([{t:'box', c:[sx * 27, 24.5, D + 3.2], r:[8, 2, 2.6], z:'wood'}]); for (let k = -3; k <= 3; k++) add([{t:'ell', c:[sx * 27 + k * 2.4, 27.6, D + 3.8], r:[1.4, 1.4, 1.4], z:k % 2 ? 'flower' : 'leafL'}]); }
      } else if (season === 'summer'){
        for (const [x, y, r] of [[-W + 6, 12, 9], [-W + 4, 28, 8], [-W + 10, 42, 6], [-W + 3, 52, 5]]) add([{t:'ell', c:[x, y, D + 1.6], r:[r, r * 1.2, 1.6], z:'ivy'}]);
      } else {
        for (const [x, r] of [[-W + 6, 12], [W - 12, 15], [16, 8]]) add([{t:'ell', c:[x, 1.5, D + 4], r:[r, 2.4, 5], z:'drift'}]);
      }
      let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
      return {parts:P, zones:{stone:'#a8a498', stoneL:'#c2bcac', stoneD:'#666258', roof:'#8a4630', roofD:'#5e2c1a', wood:'#7a4e2a', woodD:'#4a2e16',
        winglow:'#ffd47a', gold:'#d4af37', banner:bn, snow:'#eef2f6', ice:'#cfe6f2', flower:'#e86a8a', leafL:'#6a9a3a', ivy:'#3e6a2e', drift:'#b8602a'}};
    }},
  campfire:{frame:[120, 110, 8], view:2, keep:0.6, clip:'flicker', scale:1.1,
    build:season => {
      const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
      for (let i = 0; i < 11; i++){ const a = i / 11 * TAU; add('root', [{t:'ell', c:[Math.cos(a) * 17, 3, Math.sin(a) * 11], r:[4.4, 3.4, 3.8], rot:[0, a, 0], z:i % 3 ? 'stone' : 'stoneD'}]); }
      add('root', [{t:'ell', c:[0, 1.5, 0], r:[13, 1.5, 8], z:'ash'}]);
      for (const [a, b] of [[[-11, 3, -4], [10, 7, 4]], [[-10, 3, 5], [11, 6, -4]], [[0, 3, -9], [1, 8, 8]]]) add('root', [{t:'cap', a, p:b, r:2.4, z:'wood'}, {t:'ell', c:b, r:[2.2, 2.2, 2.2], z:'ember'}]);
      add('flame', [{t:'ell', c:[0, 9, 0], r:[8, 9, 6], z:'flame'}, {t:'ell', c:[1, 16, 0], r:[5, 8, 4], z:'flame2'}, {t:'ell', c:[-3, 20, 1], r:[2.6, 5, 2.4], z:'flame2'},
        {t:'ell', c:[3.4, 21, -1], r:[2, 4.4, 2], z:'flame'}, {t:'ell', c:[0, 26, 0], r:[1.4, 3, 1.4], z:'flame2'}]);
      if (season === 'winter') for (let i = 0; i < 11; i += 2){ const a = i / 11 * TAU; add('root', [{t:'ell', c:[Math.cos(a) * 18.5, 5.6, Math.sin(a) * 12], r:[3.4, 1.2, 2.8], z:'snow'}]); }
      return {parts:P, bones:{flame:{parent:'root', off:[0, 3, 0]}}, zones:{stone:'#8a8680', stoneD:'#5e5a54', ash:'#3a3230', wood:'#5a3a1c', ember:'#ff7a2a', flame:'#ff9a30', flame2:'#ffd860', snow:'#eef2f6'}};
    }},
  oak:{frame:[90, 110, 6], view:2.2, mirror:true, keep:0.55, clip:'sway',
    build:season => {
      const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
      add('root', [{t:'cap', a:[0, 0, 0], p:[0.6, 34, 0], r:5.2, z:'bark'}, {t:'ell', c:[0, 2, 0], r:[9, 3.4, 7], z:'bark'}]);
      for (const [x, z] of [[-7, 2], [6, 3], [1, -6]]) add('root', [{t:'cap', a:[0, 4, 0], p:[x, 0.5, z], r:2.2, z:'barkD'}]);
      const br = [[[0.6, 30, 0], [-16, 50, 4]], [[0.6, 32, 0], [15, 52, -3]], [[0.6, 34, 0], [2, 60, 8]], [[0.6, 34, 0], [-4, 58, -9]], [[-16, 50, 4], [-24, 56, 2]], [[15, 52, -3], [23, 60, -1]]];
      for (const [a, b] of br) add('crown', [{t:'cap', a, p:b, r:a[1] > 40 ? 1.4 : 2.6, z:'bark'}]);
      if (season === 'winter'){
        for (const [, b] of br) add('crown', [{t:'ell', c:[b[0], b[1] + 2, b[2]], r:[4.6, 1.3, 3], z:'snow'}]);
        for (const [x, y, z] of [[-10, 46, 2], [9, 47, -1], [1, 52, 4], [-20, 54, 2], [20, 58, -1], [3, 60, 8], [-4, 58, -9], [-24, 56, 2], [23, 60, -1]]) add('crown', [{t:'cap', a:[x, y, z], p:[x * 1.35 + (x > 0 ? 3 : -3), y + 10, z + 2], r:0.9, z:'bark'}, {t:'cap', a:[x, y, z], p:[x * 0.8, y + 12, z - 3], r:0.7, z:'bark'}]);
        add('root', [{t:'ell', c:[0, 1.2, 0], r:[16, 1.6, 12], z:'snow'}]);
      } else {
        const cl = [[0, 58, 0, 21], [-17, 52, 3, 15], [16, 54, -2, 15], [-7, 70, -3, 14], [9, 69, 4, 13], [2, 50, 12, 13], [-2, 52, -13, 13], [-20, 62, -4, 10], [19, 64, 3, 10]];
        cl.forEach(([x, y, z, r], i) => add('crown', [{t:'ell', c:[x, y, z], r:[r, r * 0.86, r], z:i === 0 || i === 6 ? 'leafD' : i % 3 === 1 ? 'leafL' : 'leaf'}]));
        if (season === 'spring') for (let i = 0; i < 14; i++){ const a = i * 2.4, rr = 18 + (i % 3) * 4; add('crown', [{t:'ell', c:[Math.cos(a) * rr, 56 + (i % 5) * 4, Math.sin(a) * rr * 0.7 + 6], r:[1.6, 1.6, 1.6], z:'blossom'}]); }
        if (season === 'autumn') for (const [x, r] of [[-12, 10], [10, 8], [2, 6]]) add('root', [{t:'ell', c:[x, 1, 8], r:[r, 1.4, r * 0.6], z:'leaf'}]);
      }
      const L = {spring:['#6aa040', '#4e8a34', '#8ab850'], summer:['#3e6a2e', '#2e5222', '#4e7a34'], autumn:['#c0602a', '#9a3a1e', '#d8a03a'], winter:['#3e6a2e', '#2e5222', '#4e7a34']}[season];
      return {parts:P, bones:{crown:{parent:'root', off:[0, 30, 0]}}, zones:{bark:'#5a3a1e', barkD:'#3e2812', leaf:L[0], leafD:L[1], leafL:L[2], blossom:'#f4c0d0', snow:'#eef2f6'}};
    }}
};

/* ----------------------------------------------------------- recipes --- */
/* folded: Index 67 (decor in the warehouse is indoors; every kind gets the season pass) and Index 62 (w3dFit sizes the frame) */
let w3dRecipe = function(kind, season){
  if (holdKey && holdKey() === 'warehouse' && /^dc_/.test(kind) && !/@in$/.test(kind)){ const alias = kind + '@in'; if (!W3D_KINDS[alias]) W3D_KINDS[alias] = Object.assign({}, W3D_KINDS[kind], {_sp:false, build:W3D_KINDS[kind]._b0 || W3D_KINDS[kind].build}); kind = alias; }
  if (typeof w3dWrapKind === 'function') w3dWrapKind(kind);
  const key = kind + ':' + season; if (W3D.cache[key]) return W3D.cache[key];
  const K = W3D_KINDS[kind], b = K.build(season), bones = Object.assign({root:{parent:null, off:[0, 0, 0]}}, b.bones || {});
  // parts on child bones are given in world coordinates: shift them into the bone's frame
  for (const q of b.parts){ const bo = bones[q.b]; if (!bo || q.b === 'root') continue; const o = bo.off, sh = v => [v[0] - o[0], v[1] - o[1], v[2] - o[2]];
    if (q.c) q.c = sh(q.c); if (q.a) q.a = sh(q.a); if (q.p) q.p = sh(q.p); }
  const rec = {rig:'world', skel:{order:Object.keys(bones), bones}, parts:b.parts, zones:b.zones, frame:wFrame(...K.frame), kind, season};
  if (K.scale) r3dScaleRec(rec, K.scale);
  r3dBossColours(rec, K.keep);
  for (const z of ['snow', 'ice', 'blossom', 'flower', 'winglow', 'flame', 'flame2', 'ember', 'glyph', 'ink', 'signF'].concat(b.keepZones || [])) if (b.zones[z]) rec.zones[z] = b.zones[z];
  rec.key = 'w3d' + hash(JSON.stringify(rec));
  w3dFit(rec); rec.fitted = true; rec.key = 'w3e' + hash(JSON.stringify(rec));
  return W3D.cache[key] = rec;
}
if (window.PL1L_SMOOTH === undefined) window.PL1L_SMOOTH = true;
if (window.PL1L_SMOOTH_AT === undefined) window.PL1L_SMOOTH_AT = 1.45;
/* the world model's draw: Index 62 puts its lowest pixel on groundLine; o.view (Index 68) turns it to a fixed view */
let w3dDraw = function(kind, x, groundLine, o = {}){
  r3dPumpTick();
  const K = W3D_KINDS[kind]; if (!K) return false;
  const rec = w3dRecipe(kind, w3dSeason()), St = R3D_STYLES[r3dStyleId() || 'crisp'];
  const view = o.view !== undefined ? o.view : o.mirror && K.mirror ? 4 - K.view : K.view, n = R3D_CLIPS.world[K.clip].n;
  const fr = r3dFramesAsync(rec, K.clip, view, St); if (!fr) return false;
  const i = n > 1 ? ((Math.floor((o.t || 0) / (K.clip === 'flicker' ? 7 : 22)) % n) + n) % n : 0, img = fr[Math.min(fr.length - 1, i)];
  const base = w3dInfo(fr[0], kind), F = rec.frame, k = St.res, sc = W3D.S / R3D.K / k;
  const W = img.width, w = W * sc, dx = x - Math.round(F.CX * k) * sc, dy = groundLine - (base.bottom + 1) * sc;
  const prevSmooth = ctx.imageSmoothingEnabled;
  const at = typeof window.PL1L_SMOOTH_AT === 'number' ? window.PL1L_SMOOTH_AT : 1.45;
  const smooth = typeof r3dSmooth === 'function' ? r3dSmooth(w, W)
    : (window.PL1L_SMOOTH !== false && W > 0 && (typeof ctx.getTransform === 'function' ? Math.abs(ctx.getTransform().a) : 1) * w / W > at);
  ctx.save(); ctx.imageSmoothingEnabled = smooth; if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(img, dx, dy, w, img.height * sc); ctx.restore();
  ctx.imageSmoothingEnabled = prevSmooth;
  return true;
};
/* the house, the wagon and the buildings in 3D, for every holding (folded: Index 61, 62, 64, 66, 68) */
let w3dDrawObj = function(o){
  const hk = holdKey();
  if (o.kind === 'building') return w3dFacility(o);
  if (o.kind === 'house'){ const k = hk === 'barge' || hk === 'warehouse' ? 'hh_' + hk : hk === 'waystation' ? ruinKind('house') : 'house';
    return w3dDraw(k, o.x, o.y + 6, {view:curLayout().houseView}); }
  if (hk === 'barge' || hk === 'warehouse') return o.kind === 'wagon' ? w3dDraw('qm_' + hk, o.x, o.y + 6) : false;
  if (o.kind === 'wagon' && holding() === 'fort') return w3dDraw('w_wagon', o.x, o.y + 6);
  return false;
};
let w3dFire = function(x, y, t){ if (holding() !== 'fort') return false; return w3dDraw('campfire', x, y + 6, {t}); }
let w3dTree = function(tr, t){ if (tr.v % 3 !== 1) return false;
  const sx = tr.x - CAMP.cam.x, sy = tr.y - CAMP.cam.y; if (sx < -80 || sx > VW + 80 || sy < -20 || sy > VH + 140) return true; return w3dDraw('oak', tr.x, tr.y + 2, {t:t + (Math.abs(tr.x * 7) | 0), mirror:((tr.x + tr.y) | 0) % 2 === 0}); }

/* ---------------------------------------------------------- settings --- */
/* PL-1.1: the 3D world switch is gone (no settings line) */
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx61')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx61"><b>3D world (prototype).</b> In the Frontier Timber Fort, the Chapter House, the campfire and the oaks are drawn in 3D, and change with the seasons.</p>`);
  };
}
/* ===== END INDEX 61 ======================================================= */

/* ============================================================================
   INDEX 62 - 3D WORLD: NOTHING CUT OFF, EVERYTHING ON THE GROUND
   The Chapter House's near walls were cut off at the bottom of the picture the
   model is rendered into, so it looked melted; the fire's front stones and the
   oak's roots were touching the same edge.
     - Each world model now sizes its picture from its own parts (with room to
       spare), so no corner, eave or branch can be cut off.
     - Each model is placed so its lowest drawn pixel (the near corner of the
       house's plinth, the front stones, the roots) sits on the pixel art's own
       ground line. Click areas and draw order are unchanged.
     - A check runs on every new world frame: if anything still touches the
       edge of its picture, a warning names the model, so later buildings
       cannot repeat this.
   Rollback: delete from this comment to END INDEX 62.

   3D DESIGN NOTE: WORLD, ADDENDUM
     FRAME   W3D_KINDS[kind].frame is now ignored. w3dFit(rec) measures every
             part (centre and size, after any scale) and builds a frame that
             holds the model from any camera turn, with W3D_PAD pixels spare.
     GROUND  w3dDraw(kind, x, groundLine, o) puts the model's lowest opaque
             pixel on groundLine (measured once per recipe, look and view).
             Ground lines: the house o.y + 6, the campfire HUB.fire.y + 12,
             trees t.y + 5. For a new building, use the bottom of its pixel
             art (pixel canvas bottom x draw scale, measured from the anchor).
     CHECK   w3dEdgeCheck warns (console) when an opaque pixel touches a frame
             edge. The test harness treats warnings as failures.
============================================================================ */
const W3D_PAD = 10, W3DM = new WeakMap(), W3D_WARNED = new Set();
function w3dFit(rec){
  const ct = Math.cos(R3D.PITCH), st = Math.sin(R3D.PITCH), B = rec.skel.bones;
  const at = b => { let o = [0, 0, 0]; for (let n = b; n && B[n]; n = B[n].parent) { const f = B[n].off; o = [o[0] + f[0], o[1] + f[1], o[2] + f[2]]; } return o; };
  let half = 0, up = 0, down = 0;
  const pt = (p, r) => { const R = Math.hypot(p[0], p[2]) + r;
    half = Math.max(half, R); up = Math.max(up, p[1] * ct + R * st + r); down = Math.max(down, R * st - p[1] * ct + r); };
  for (const q of rec.parts){
    const o = at(q.b), rr = q.r === undefined ? 0 : Array.isArray(q.r) ? (q.t === 'box' ? Math.hypot(q.r[0], q.r[1], q.r[2]) : Math.max(q.r[0], q.r[1], q.r[2])) : q.t === 'ring' ? q.R + q.r : Math.max(q.r, q.r2 || 0);   /* Index 98 */
    const sway = q.b === 'root' ? 0 : 0.08 * Math.hypot(...(q.c || q.p || [0, 0, 0]));   // room for the sway and flicker clips
    for (const c of [q.c, q.a, q.p]) if (c) pt([o[0] + c[0], o[1] + c[1], o[2] + c[2]], rr + sway);
  }
  const w = Math.ceil(2 * half + 2 * W3D_PAD), h = Math.ceil(up + down + 2 * W3D_PAD), g = Math.ceil(down + W3D_PAD);
  rec.frame = wFrame(w, h, g);
  return rec;
}
function w3dInfo(img, kind){
  let I = W3DM.get(img); if (I) return I;
  const W = img.width, H = img.height, d = img.getContext('2d', {willReadFrequently:true}).getImageData(0, 0, W, H).data;
  let bottom = -1, edge = false;
  for (let y = H - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]){ bottom = y; break; }
  for (let x = 0; x < W && !edge; x++) if (d[x * 4 + 3] || d[((H - 1) * W + x) * 4 + 3]) edge = true;
  for (let y = 0; y < H && !edge; y++) if (d[(y * W) * 4 + 3] || d[(y * W + W - 1) * 4 + 3]) edge = true;
  if (edge && !W3D_WARNED.has(kind)){ W3D_WARNED.add(kind); console.warn('3D world: "' + kind + '" touches the edge of its frame and may be cut off.'); }
  I = {bottom:Math.max(0, bottom), edge}; W3DM.set(img, I); return I;
}
w3dFire = function(x, y, t){ if (holding() !== 'fort') return false; return w3dDraw('campfire', x, y + 12, {t}); };
w3dTree = function(tr, t){ if (tr.v % 3 !== 1) return false;
  const sx = tr.x - CAMP.cam.x, sy = tr.y - CAMP.cam.y; if (sx < -80 || sx > VW + 80 || sy < -20 || sy > VH + 140) return true;
  return w3dDraw('oak', tr.x, tr.y + 5, {t:t + (Math.abs(tr.x * 7) | 0), mirror:((tr.x + tr.y) | 0) % 2 === 0}); };
for (const k in W3D.cache) delete W3D.cache[k];
/* ===== END INDEX 62 ======================================================= */

/* ============================================================================
   INDEX 63 - 3D WORLD: GROUND TILES AND THE SEASONS ENGINE
   With "3D world" on, the ground of the camp and of every contract map is
   redrawn in the 3D look: the same light bands (deep, dark, mid, light,
   highlight), shadows pulled toward cool purple, highlights toward warm, light
   from the upper left, and a dark outline where anything raised meets the
   ground. Still flat tiles, not 3D ground.
     grass, forest floor, dirt roads and camp paths, rubble, flagstone floors,
     stone and walls (faces and tops), cliffs (top and face), water, the
     palisade, roofs, plaster walls, tents, and puddles (now a mud rim round
     the water).
   Retro draws each tile at the pixel world's own resolution; Crisp at twice
   that, so it has finer grain, like the characters.
   SEASONS ENGINE  Every zone has a colour per season (W3D_PAL), and every tile
   adds its season's parts:
     Spring  fresh green, wildflowers and blossom petals
     Summer  warm green, dry grass and a few flowers
     Autumn  brown-gold grass, fallen leaves on grass, roads and forest floor
     Winter  grey-green, snow patches and drifts, snow caps on wall tops,
             cliff lips, palisade points and roofs, ice rims on water. The
             winter rain and its puddles stay (they slow foot units).
   The oak's leaves now take their colours from the same table.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 63.

   3D DESIGN NOTE: WORLD, ADDENDUM (read with Index 61 and 62)
     PALETTE  W3D_PAL[season][zone] is the one place a zone's colour lives:
              grass dirt stone water mud snow cliff wall forest wood plaster
              canvas roof0..roof2 leaf leafD leafL, plus accent: [colours] for
              that season's flowers, leaves or frost. w3dZ(zone, season)
              returns it; w3dBands(hex) returns [deep, dark, mid, light, hi].
              Buildings and trees should read seasonal colours from here
              rather than hard-code them (the oak already does).
     TILES    wTile(key, fn) makes a 40 x 40 tile (Retro: 20 x 20 drawn
              double). fn(P, D, r, ctx) where P(x, y, w, h, colour) paints in
              20-unit tile coordinates, D(x, y, colour) paints one native
              pixel, r is a seeded random, and ctx = {se, U (native pixels per
              unit), N (native size), Z (zone -> bands), acc (season accents)}.
              Light rules: lit edges on the top and left, dark on the bottom
              and right, the deep band as an outline where a raised thing meets
              the ground. Cached per look, season and key.
     PARTS    wSeasonSpeckle(P, D, r, ctx, density) scatters the season's
              ground parts (flowers, dry grass, leaves, frost) on any tile;
              wSnowCap(P, ctx, y, w) lays a snow cap with a lit top and a cool
              shadow under it.
     RESETS   Cached patterns (camp ground, camp road, contract ground, the
              prologue camp's ground) reset whenever the look, the season or
              the switch changes.
============================================================================ */
const W3D_PAL = {
  spring:{grass:'#5e7a3e', dirt:'#7c6646', stone:'#8c8a84', water:'#356a8e', mud:'#4e3c28', snow:'#e8eef2', cliff:'#6e8444', wall:'#8e8a80', forest:'#3e5a2c',
          wood:'#7a5230', plaster:'#cfc0a0', canvas:'#c9b48a', roof0:'#8a3a2a', roof1:'#6a4a2a', roof2:'#5a5a6a', leaf:'#6aa040', leafD:'#4e8a34', leafL:'#8ab850',
          accent:['#f4c0d0', '#ffe878', '#f8f4ec', '#b8d0ff']},
  summer:{grass:'#687438', dirt:'#8a7450', stone:'#8e8a82', water:'#2e6884', mud:'#56442c', snow:'#e8eef2', cliff:'#828a46', wall:'#908a80', forest:'#44542a',
          wood:'#7a5230', plaster:'#d2c4a4', canvas:'#cdb88e', roof0:'#8e3e2c', roof1:'#6e4c2a', roof2:'#5c5c6c', leaf:'#3e6a2e', leafD:'#2e5222', leafL:'#4e7a34',
          accent:['#e8d060', '#d8b850', '#c87050']},
  autumn:{grass:'#6c6236', dirt:'#7e6444', stone:'#888480', water:'#2c5268', mud:'#4e3a26', snow:'#e8eef2', cliff:'#7e7040', wall:'#8a8680', forest:'#504428',
          wood:'#74502e', plaster:'#c8b898', canvas:'#c4ae86', roof0:'#843a2a', roof1:'#664628', roof2:'#565664', leaf:'#c0602a', leafD:'#9a3a1e', leafL:'#d8a03a',
          accent:['#c84a20', '#df8228', '#e6ae34', '#8a3618']},
  winter:{grass:'#59604c', dirt:'#6c6656', stone:'#848a8e', water:'#2a4a62', mud:'#463a2e', snow:'#e8eef2', cliff:'#5e664e', wall:'#868a8c', forest:'#3a4430',
          wood:'#6a4a2e', plaster:'#c0b8a8', canvas:'#bab0a0', roof0:'#7a3a2e', roof1:'#5e4430', roof2:'#545866', leaf:'#3e6a2e', leafD:'#2e5222', leafL:'#4e7a34',
          accent:['#e8eef2', '#d4dee6', '#c0ccd6']}
};
const w3dZ = (zone, se) => (W3D_PAL[se || w3dSeason()] || W3D_PAL.summer)[zone];
const W3D_BANDCACHE = {};
function w3dBands(hex){
  if (W3D_BANDCACHE[hex]) return W3D_BANDCACHE[hex];
  const b = hex3(hex), cool = R3D_COOL, warm = R3D_WARM;
  const mk = (k, c, w) => '#' + b.map((v, i) => { let x = v * k; x = x + (cool[i] - x) * c; x = x + (warm[i] - x) * w; return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }).join('');
  return W3D_BANDCACHE[hex] = [mk(0.34, 0.42, 0), mk(0.7, 0.18, 0), mk(1, 0, 0), mk(1.12, 0, 0.06), mk(1.24, 0, 0.14)];
}
const wMix = (a, b, k) => { const x = hex3(a), y = hex3(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const wLook = () => (R3D_STYLES[r3dStyleId() || 'crisp'] || R3D_STYLES.crisp).id;
function wTile(key, fn){
  const se = w3dSeason(), look = wLook(), k = 'wt:' + look + ':' + se + ':' + key;
  if (SPR[k]) return SPR[k];
  const retro = look === 'retro', N = retro ? 20 : 40, U = N / 20, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(hash(key + ':' + se));
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x * U), Math.round(y * U), Math.max(1, Math.round(w * U)), Math.max(1, Math.round(h * U))); };
  const D = (x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };
  fn(P, D, r, {se, U, N, Z:z => w3dBands(w3dZ(z, se)), acc:W3D_PAL[se].accent});
  return SPR[k] = retro ? scaled(c, 2) : c;
}
// the season's scattered ground parts
function wSeasonSpeckle(P, D, r, x, density){
  const n = Math.round(density * x.U * x.U), A = x.acc;
  if (x.se === 'spring') for (let i = 0; i < n; i++){ const px = r() * x.N | 0, py = r() * x.N | 0, col = A[r() * A.length | 0]; D(px, py, col); D(px, py + 1, w3dBands(w3dZ('grass', x.se))[1]); }
  else if (x.se === 'summer') for (let i = 0; i < n; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, A[r() * A.length | 0]); }
  else if (x.se === 'autumn') for (let i = 0; i < n * 1.6; i++){ const px = r() * x.N | 0, py = r() * x.N | 0, col = A[r() * A.length | 0]; D(px, py, col); D(px + 1, py, col); D(px + 1, py + 1, w3dBands(col)[1]); }
  else for (let i = 0; i < n; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, A[r() * A.length | 0]); }
}
function wSnowCap(P, x, y, w, h){
  if (x.se !== 'winter') return;
  const S = x.Z('snow'); P(0, y, w || 20, h || 2, S[2]); P(0, y, w || 20, 0.5, S[4]); P(0, y + (h || 2), w || 20, 0.5, w3dBands('#6a7a8a')[1]);
}
// a soft blob in tile coordinates (patches, drifts, puddle rims)
function wBlob(D, r, x, cx, cy, rx, ry, cols, lit){
  const U = x.U, N = x.N;
  for (let y = -ry * U; y <= ry * U; y++) for (let xx = -rx * U; xx <= rx * U; xx++){
    const q = (xx * xx) / (rx * rx * U * U) + (y * y) / (ry * ry * U * U); if (q > 1 - r() * 0.18) continue;
    const px = ((cx * U + xx) % N + N) % N, py = ((cy * U + y) % N + N) % N;
    const edgeTop = y < -ry * U * 0.55 && xx < rx * U * 0.3, edgeBot = y > ry * U * 0.6;
    D(px, py, edgeBot ? cols[1] : (lit && edgeTop) ? cols[3] : cols[2]);
  }
}

/* --------------------------------------------------------------- tiles --- */
const W3T = {};
W3T.ground = () => {
  const se = w3dSeason(), look = wLook(), key = 'wg2:' + look + ':' + se;
  if (SPR[key]) return SPR[key];
  // a 576-pixel repeat (twice the old one) so the pattern is hard to spot; res = native pixels per unit
  const retro = look === 'retro', PU = 192, res = retro ? 1 : 2, N = PU * res, c = newCanvas(N, N), g = c.getContext('2d'), r = rng(4321 + hash(se));
  const D = (x, y, col) => { g.fillStyle = col; g.fillRect(((x | 0) % N + N) % N, ((y | 0) % N + N) % N, 1, 1); };
  const G = w3dBands(w3dZ('grass', se)), Dt = w3dBands(w3dZ('dirt', se)), x = {se, U:res, N, Z:z => w3dBands(w3dZ(z, se)), acc:W3D_PAL[se].accent};
  const A = (PU / 96) * (PU / 96) * res * res;          // area factor for counts
  g.fillStyle = G[2]; g.fillRect(0, 0, N, N);
  const Gc = wMix(G[2], G[1], 0.5), Gl = wMix(G[2], G[3], 0.6);
  for (let i = 0; i < 60 * A / (res * res) ; i++){ const cx = r() * N, cy = r() * N, rr = (1 + r() * 2.2) * res;
    for (let y = -rr; y <= rr; y++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + y * y <= rr * rr) D(cx + xx, cy + y, Gc);
    D(cx - rr, cy - rr + 1, Gl); D(cx - rr + 1, cy - rr, Gl); }
  for (let i = 0; i < 240 * A; i++){ const px = r() * N, py = r() * N; D(px, py, wMix(G[2], G[3], 0.7)); D(px, py + 1, Gc); if (r() < 0.12) D(px, py - 1, G[3]); }
  // a few soft worn patches, lit on top, barely darker below
  const DtSoft = [Dt[0], wMix(Dt[2], Dt[1], 0.5), wMix(G[2], Dt[2], 0.75), wMix(Dt[2], Dt[3], 0.6), Dt[4]];
  for (let k = 0; k < 5; k++) wBlob(D, r, x, r() * PU, r() * PU, 5 + r() * 9, 3 + r() * 5, DtSoft, true);
  if (se === 'winter') for (let k = 0; k < 10; k++) wBlob(D, r, x, r() * PU, r() * PU, 3 + r() * 7, 2 + r() * 3, w3dBands(w3dZ('snow', se)), true);
  const xs = Object.assign({}, x, {U:res * 2});           // speckle density over the bigger tile
  wSeasonSpeckle(null, D, r, xs, se === 'autumn' ? 30 : se === 'spring' ? 26 : 18);
  return SPR[key] = scaled(c, retro ? 3 : 1.5);
};
W3T.forest = v => wTile('forest' + v, (P, D, r, x) => {
  const F = x.Z('forest'); P(0, 0, 20, 20, F[2]);
  for (let i = 0; i < 46 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.7 ? wMix(F[2], F[1], 0.7) : F[1]); }
  for (let i = 0; i < 18 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, wMix(F[2], F[3], 0.7)); D(px, py + 1, wMix(F[2], F[1], 0.7)); }
  for (let i = 0; i < 3; i++){ const px = r() * 16, py = r() * 16; P(px, py + 1.5, 3, 1, F[0]); P(px, py, 3, 1, w3dBands(w3dZ('wood', x.se))[1]); }   // twigs and their shadows
  wSeasonSpeckle(P, D, r, x, x.se === 'autumn' ? 16 : 6);
});
W3T.road = v => wTile('road' + v, (P, D, r, x) => {
  const Dt = x.Z('dirt'), S = x.Z('stone'); P(0, 0, 20, 20, Dt[2]);
  for (let i = 0; i < 60 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.5 ? Dt[1] : Dt[3]); }
  for (const y of [6, 13]){ P(0, y, 20, 1, Dt[0]); P(0, y - 1, 20, 0.5, Dt[3]); }   // ruts: a dark groove, lit above
  for (let i = 0; i < 5; i++){ const px = r() * 18, py = r() * 18; P(px, py, 1, 1, S[3]); P(px, py + 1, 1, 0.5, S[0]); }
  if (x.se === 'winter'){ for (const y of [6, 13]) for (let i = 0; i < 4; i++) P(r() * 17, y - 0.4, 2 + r() * 2, 0.6, x.Z('snow')[2]); }
  wSeasonSpeckle(P, D, r, x, x.se === 'autumn' ? 10 : 3);
});
W3T.rubble = v => wTile('rubble' + v, (P, D, r, x) => {
  const G = x.Z('grass'), S = x.Z('stone'); P(0, 0, 20, 20, G[1]);
  for (let i = 0; i < 40 * x.U * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, G[2]);
  for (let i = 0; i < 8; i++){ const px = r() * 16, py = r() * 16, w = 2 + r() * 3;
    P(px, py + w - 0.5, w + 0.5, 0.8, S[0]); P(px, py, w, w - 1, S[2]); P(px, py, w, 0.6, S[4]); P(px, py, 0.6, w - 1, S[3]); P(px + w - 0.6, py + 0.6, 0.6, w - 1.6, S[1]);
    if (x.se === 'winter') P(px, py - 0.4, w, 0.8, x.Z('snow')[3]); }
});
W3T.floor = () => wTile('floor', (P, D, r, x) => {
  const S = x.Z('stone'); P(0, 0, 20, 20, wMix(S[1], S[0], 0.3));
  for (let y = 0; y < 20; y += 5) for (let xx = (y / 5 % 2) * 5 - 5; xx < 20; xx += 10){ P(xx + 0.5, y + 0.5, 9, 4, S[2]); P(xx + 0.5, y + 0.5, 9, 0.6, S[3]); P(xx + 0.5, y + 3.9, 9, 0.6, S[1]); }
  if (x.se === 'winter'){ const W = x.Z('snow'); for (let y = 0; y < 20; y += 5) for (let i = 0; i < 3; i++) P(r() * 16, y + 3.6, 2 + r() * 3, 0.9, W[2]); for (let i = 0; i < 10 * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, W[3]); }
  else if (x.se === 'autumn') wSeasonSpeckle(P, D, r, x, 4);
});
W3T.hill = v => wTile('hill' + v, (P, D, r, x) => {
  const H = x.Z('cliff'); P(0, 0, 20, 20, H[2]);
  for (let i = 0; i < 50 * x.U * x.U; i++){ const px = r() * x.N | 0, py = r() * x.N | 0; D(px, py, r() < 0.5 ? H[1] : H[3]); }
  if (x.se === 'winter') for (let i = 0; i < 5; i++){ const px = r() * 16, py = r() * 16; P(px, py, 3 + r() * 2, 1.2, x.Z('snow')[2]); }
  wSeasonSpeckle(P, D, r, x, 5);
});
W3T.hillEdge = () => wTile('hilledge', (P, D, r, x) => {
  const H = x.Z('cliff'), S = x.Z('stone');
  P(0, 13, 20, 1, H[4]);                                   // the lit lip
  P(0, 14, 20, 4.5, S[1]); for (let xx = 0; xx < 20; xx += 3 + (xx % 2)){ P(xx, 14, 0.6, 4.5, S[0]); P(xx + 0.6, 14.2, 1, 1.5, S[2]); }   // the rock face
  P(0, 18.5, 20, 1.5, S[0]);                               // the outline where the face meets the ground
  if (x.se === 'winter'){ const W = x.Z('snow'); P(0, 12.2, 20, 1.6, W[2]); P(0, 12.2, 20, 0.5, W[4]); }
});
W3T.water = f => wTile('water' + f, (P, D, r, x) => {
  const W = x.Z('water'); P(0, 0, 20, 20, W[2]);
  for (let i = 0; i < 30 * x.U * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, W[1]);
  for (let i = 0; i < 6; i++){ const px = r() * 16, py = (i * 3 + f * 2) % 20; P(px, py, 4, 0.6, W[4]); P(px + 1, py + 0.6, 2, 0.5, W[3]); }
  P(0, 0, 20, 1, W[0]);
  if (x.se === 'winter'){ const I = w3dBands('#cfe0ea'); P(0, 0, 20, 1.2, I[2]); for (let i = 0; i < 4; i++) P(r() * 16, r() * 18, 3, 0.8, I[3]); }
});
W3T.stone = () => wTile('stone', (P, D, r, x) => {
  const S = x.Z('wall'); P(0, 0, 20, 20, wMix(S[1], S[0], 0.35));
  for (let y = 0; y < 18; y += 4) for (let xx = (y / 4 % 2) * 4 - 4; xx < 20; xx += 8){ P(xx + 0.5, y + 0.5, 7, 3, S[2]); P(xx + 0.5, y + 0.5, 7, 0.6, S[3]); P(xx + 0.5, y + 0.5, 0.6, 3, S[3]); P(xx + 0.5, y + 2.9, 7, 0.6, S[1]); }
  P(0, 19, 20, 1, S[0]);
});
W3T.stoneTop = () => wTile('stonetop', (P, D, r, x) => {
  const S = x.Z('wall'); P(0, 0, 20, 20, S[1]);
  for (let y = 0; y < 20; y += 4) for (let xx = (y / 4 % 2) * 4 - 4; xx < 20; xx += 8){ P(xx + 0.5, y + 0.5, 7, 3, S[3]); P(xx + 0.5, y + 0.5, 7, 0.6, S[4]); P(xx + 0.5, y + 2.9, 7, 0.6, S[2]); }
  if (x.se === 'winter'){ const W = x.Z('snow'); P(0, 0, 20, 20, W[2]); for (let i = 0; i < 18 * x.U; i++) D(r() * x.N | 0, r() * x.N | 0, W[3]); P(0, 18.6, 20, 1.4, w3dBands('#7a8a9a')[1]); }
});
W3T.palisade = () => wTile('palisade', (P, D, r, x) => {
  const G = x.Z('grass'), Wd = x.Z('wood'); P(0, 0, 20, 20, G[2]);
  for (let xx = 0; xx < 20; xx += 4){ P(xx, 3, 3, 16, Wd[2]); P(xx, 3, 0.8, 16, Wd[3]); P(xx + 2.2, 3, 0.8, 16, Wd[1]); P(xx + 0.5, 1.5, 2, 1.5, Wd[3]); P(xx + 1, 0.5, 1, 1, Wd[4]);
    P(xx, 18.4, 3.4, 1.2, Wd[0]); if (x.se === 'winter') P(xx + 0.3, 1.2, 2.4, 1, x.Z('snow')[3]); }
  for (const y of [7, 14]) P(0, y, 20, 0.8, Wd[1]);
});
W3T.roof = v => wTile('roof' + v, (P, D, r, x) => {
  const R = x.Z('roof' + (v % 3)); P(0, 0, 20, 20, R[1]);
  for (let y = 0; y < 20; y += 4){ for (let xx = (y / 4 % 2) * 3 - 3; xx < 20; xx += 6){ P(xx + 0.4, y + 0.4, 5.2, 3.2, R[2]); P(xx + 0.4, y + 0.4, 5.2, 0.6, R[3]); } P(0, y + 3.4, 20, 0.6, R[0]); }
  if (x.se === 'winter'){ const W = x.Z('snow'); P(0, 0, 20, 11, W[2]); P(0, 0, 20, 0.8, W[4]); for (let xx = 0; xx < 20; xx += 3) P(xx, 11, 2, 1 + (xx % 2), W[2]); P(0, 12, 20, 0.6, w3dBands('#7a8a9a')[1]); }
});
W3T.wallFront = v => wTile('wallfront' + v, (P, D, r, x) => {
  const Pl = x.Z('plaster'), Wd = x.Z('wood'); P(0, 0, 20, 20, Pl[2]); P(0, 0, 20, 0.8, Pl[3]);
  P(0, 0, 1, 20, Wd[1]); P(19, 0, 1, 20, Wd[0]); P(0, 9, 20, 1, Wd[1]); P(7, 10, 6, 10, Wd[0]); P(7, 10, 6, 0.8, Wd[2]); P(0, 19, 20, 1, Pl[0]);
});
W3T.tent = v => wTile('tent' + v, (P, D, r, x) => {
  const base = v % 3 === 0 ? w3dZ('canvas', x.se) : v % 3 === 1 ? '#9b3a2a' : '#6a6a4a', B = w3dBands(base);
  P(0, 0, 20, 20, B[2]); for (let xx = 0; xx < 20; xx += 5){ P(xx, 0, 2, 20, B[1]); P(xx + 2, 0, 0.6, 20, B[3]); }
  P(0, 18, 20, 2, B[0]); if (x.se === 'winter') wSnowCap(P, x, 0, 20, 3);
});

/* --------------------------------------------------------------- hooks --- */
for (const k of Object.keys(W3T)) if (k !== 'ground' && TILE[k]){ TILE[k] = function(v){ return W3T[k](v); }; }
groundPattern = function(){ return W3T.ground(); };
const W3TS = {sig:''};
function w3dTileSig(){ return wLook() + ':' + w3dSeason(); }
function w3dTileReset(){
  const s = w3dTileSig(); if (s === W3TS.sig) return; W3TS.sig = s;
  CAMP.pat = null; CAMP.road = null; CAMP.cpPat = null; if (G) G.bgPat = null;
}
drawCamp = (function(prev){ return function(){ try { w3dTileReset(); } catch (e) {} return prev.apply(this, arguments); }; })(drawCamp);
drawTerrain = (function(prev){ return function(cx, cy){ try { w3dTileReset(); } catch (e) {} return prev(cx, cy); }; })(drawTerrain);
// puddles: a mud rim, banded water, a lit edge, and the old ripple
drawPuddleList = (function(prev){
  return function(list, cx, cy){
    if (!list || !list.length) return prev(list, cx, cy);
    const f = G ? G.frame : CAMP.t, M = w3dBands(w3dZ('mud')), W = w3dBands(w3dZ('water'));
    for (const p of list){
      if (p.x < cx - 60 || p.x > cx + VW + 60 || p.y < cy - 40 || p.y > cy + VH + 40) continue;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0);
      ctx.fillStyle = wMix(M[2], M[1], 0.5); ctx.beginPath(); ctx.ellipse(1, 2, p.rx + 3, p.ry + 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = M[3]; ctx.beginPath(); ctx.ellipse(-1.5, -1.5, p.rx + 1, p.ry + 1, 0, Math.PI, Math.PI * 1.6); ctx.lineTo(0, 0); ctx.fill();
      ctx.globalAlpha = 0.82; ctx.fillStyle = wMix(W[2], M[2], 0.25); ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = wMix(W[3], '#a8bccb', 0.35); ctx.beginPath(); ctx.ellipse(-p.rx * 0.12, -p.ry * 0.12, p.rx * 0.74, p.ry * 0.66, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = W[4]; ctx.fillRect(-p.rx * 0.5, -p.ry * 0.45, p.rx * 0.4, 1.5);
      const rt = ((f + p.seed * 7) % 50) / 50;
      ctx.strokeStyle = `rgba(220,235,245,${(1 - rt) * 0.55})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse((p.seed % 7 - 3) * 2, (p.seed % 5 - 2) * 1.2, p.rx * 0.45 * rt, p.ry * 0.45 * rt, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  };
})(drawPuddleList);
// the oak's leaves follow the season palette
{ const K = W3D_KINDS.oak, b = K.build; K.build = se => { const o = b(se); Object.assign(o.zones, {leaf:w3dZ('leaf', se), leafD:w3dZ('leafD', se), leafL:w3dZ('leafL', se)}); return o; };
  for (const k in W3D.cache) if (k.indexOf('oak:') === 0) delete W3D.cache[k]; }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx63')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx63"><b>3D ground.</b> With 3D world on, the ground of the camp and of every contract is drawn in the 3D look and changes with the seasons: flowers in Spring, dry grass in Summer, fallen leaves in Autumn, and snow on walls, cliffs, roofs and the ground in Winter.</p>`);
  };
}
/* ===== END INDEX 63 ======================================================= */

/* ============================================================================
   INDEX 64 - 3D FORT FACILITIES, BATCH 1
   With "3D world" on, in the Frontier Timber Fort these facilities are 3D:
     Quarters    Tents (two ridge tents), Huts (a log hut) and Bunks (a long
                 two-storey bunkhouse): the model follows the upgrade tier
     Kitchen     a lean-to roof on posts over a fire pit, a cauldron on a
                 tripod, a table with pots, firewood
     Tavern      a timber-framed plaster house with a hanging mug sign
     Command Tent  a big red pavilion with gold stripes and a flag on a pole
     Merchant Stalls  a striped awning over a counter of goods, with a coin sign
     Cells       a squat stone block with barred windows, an iron door and a
                 bars sign
     Barracks    a wide timber hall with a flag sign and a weapon rack
     Training Grounds  a fenced yard with a straw dummy, an archery butt and a
                 sword sign on the gatepost
     Armoury     a stone house with a slate roof, a shield sign and a rack of
                 spears and shields
     Stables     a timber barn with double doors, a hayloft, hay bales and a
                 horse sign; the paddock fence beside it is 3D too
   Each building's sign is its pixel glyph, built in raised squares on a board,
   so it reads the same as before. Every model changes with the seasons (snow
   on roofs, awnings and fences in winter; leaves in autumn; flower tubs in
   spring), and sits inside the pixel art's click box. The other facilities and
   the other holdings stay pixel art for now.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 64.

   3D DESIGN NOTE: WORLD, ADDENDUM
     KIT       Builders share helpers in W3K (all in screen pixels):
                 W3K.house(add, o, season)   walls (stone|plaster|wood|log),
                   gable-front roof, door, windows, optional chimney, sign
                 W3K.sign(add, glyph, cx, cy, z, px)   a board with the glyph in
                   raised squares facing the viewer; px = size of one glyph cell
                 W3K.tent(add, o, season)    ridge tent with stripes and a flap
                 W3K.fence(add, x0, x1, z, h, season)  posts and two rails
                 W3K.winterRoof / W3K.leaves  seasonal extras
               Sign glyphs use the 'glyph' zone (never muted) in the colour the
               pixel art uses (GLYPH_COLOURS).
     HOOK      w3dFacility(o) draws a building from W3D_FAC[id] (its kind name)
               and returns false to fall back to the pixel art. Ground line
               o.y + 6, as for the house.
============================================================================ */
R3D_MUTE_SKIP.add('glyph'); R3D_MUTE_SKIP.add('ink'); R3D_MUTE_SKIP.add('signF');
const W3K = {
  sign(add, gname, cx, cy, z, px, board){
    const rows = GLYPHS[gname]; if (!rows) return;
    const w = 3.5 * px + 2.4, h = 3.5 * px + 2.4;
    add([{t:'box', c:[cx, cy, z], r:[w, h, 1], z:board && board !== 'keep' ? board : 'signB'}, {t:'box', c:[cx, cy, z + 1.05], r:[w - 1.1, h - 1.1, 0.2], z:'signF'}]);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') add([{t:'box', c:[cx + (i - 3) * px, cy + (3 - j) * px, z + 1.5], r:[px / 2, px / 2, 0.5], z:board === 'keep' ? 'glyph' : 'ink'}]); });
  },
  house(add, o, season){
    const W = o.W, D = o.D, H = o.H, top = H + 3, ridge = top + o.roofH, eave = W + 6, sa = Math.atan2(ridge - top, eave), sl = Math.hypot(ridge - top, eave) / 2, wall = o.wall;
    add([{t:'box', c:[0, 2, 0], r:[W + 3, 2, D + 3], z:'stoneD'}, {t:'box', c:[0, H / 2 + 3, 0], r:[W, H / 2, D], z:wall}]);
    if (wall === 'stone') for (const sx of [1, -1]) for (let y = 8; y < H; y += 10) add([{t:'box', c:[sx * (W - 3), y, D - 3], r:[4, 4.5, 4], z:(y / 10 | 0) % 2 ? 'stoneL' : 'stone'}]);
    if (wall === 'plaster'){ for (const x of [-W + 1, -W / 3, W / 3, W - 1]) add([{t:'box', c:[x, H / 2 + 3, D + 0.6], r:[1.6, H / 2, 0.6], z:'beam'}]);
      add([{t:'box', c:[0, H * 0.55, D + 0.6], r:[W, 1.4, 0.6], z:'beam'}, {t:'box', c:[0, H + 2, D + 0.6], r:[W, 1.4, 0.6], z:'beam'}]); }
    if (wall === 'wood' || wall === 'barn') for (let x = -W + 4; x < W; x += 8) add([{t:'box', c:[x, H / 2 + 3, D + 0.4], r:[0.5, H / 2, 0.4], z:'woodD'}]);
    if (wall === 'log') for (let y = 6; y < H; y += 6) add([{t:'cap', a:[-W - 2, y, D + 0.2], p:[W + 2, y, D + 0.2], r:2.6, z:(y / 6) % 2 ? 'wood' : 'woodL'}]);
    for (const sz of [1, -1]) for (let k = 0; k < 6; k++){ const y = top + k * o.roofH / 6, hw = W * (1 - (k + 0.5) / 6.1); add([{t:'box', c:[0, y + o.roofH / 12, sz * (D - 0.5)], r:[hw, o.roofH / 12, 1], z:wall === 'log' ? 'wood' : wall}]); }
    const dw = o.doorW || 9, dh = o.doorH || 16;
    add([{t:'box', c:[o.doorX || 0, dh + 1, D + 0.5], r:[dw + 2, dh + 1, 1.1], z:'woodD'}, {t:'box', c:[o.doorX || 0, dh, D + 1.1], r:[dw, dh, 0.9], z:o.door || 'wood'},
         {t:'box', c:[(o.doorX || 0) + dw * 0.55, dh, D + 2.1], r:[1, 1, 0.6], z:'metal'}]);
    for (const [x, y] of (o.windows || [])) add([{t:'box', c:[x, y, D + 0.6], r:[7, 7, 0.8], z:'woodD'}, {t:'box', c:[x, y, D + 1], r:[5.4, 5.4, 0.6], z:o.dark ? 'winD' : 'winglow'},
      {t:'box', c:[x, y, D + 1.6], r:[0.5, 5.4, 0.4], z:'woodD'}, {t:'box', c:[x, y, D + 1.6], r:[5.4, 0.5, 0.4], z:'woodD'}]);
    for (const sx of [1, -1]){
      add([{t:'box', c:[sx * eave / 2, (top + ridge) / 2 + 2, 0], r:[sl + 2, 2.2, D + 6], rot:[0, 0, -sx * sa], z:o.roof}]);
      for (const k of [0.25, 0.55, 0.82]) add([{t:'box', c:[sx * eave * k, top + (ridge - top) * (1 - k) + 4.2, 0], r:[1, 0.7, D + 6.2], rot:[0, 0, -sx * sa], z:o.roof + 'D'}]);
      if (season === 'winter') add([{t:'box', c:[sx * eave / 2 + sx * 0.4, (top + ridge) / 2 + 4.6, 0], r:[sl + 1.4, 1.5, D + 6.4], rot:[0, 0, -sx * sa], z:'snow'}]);
    }
    add([{t:'cap', a:[0, ridge + 3, -D - 6], p:[0, ridge + 3, D + 6], r:2.4, z:o.roof + 'D'}]);
    if (season === 'winter') add([{t:'cap', a:[0, ridge + 5, -D - 6], p:[0, ridge + 5, D + 6], r:2, z:'snow'}]);
    if (o.chimney) add([{t:'box', c:[W * 0.5, ridge - 4, -D * 0.4], r:[5, 15, 5], z:'stone'}, {t:'box', c:[W * 0.5, ridge + 11, -D * 0.4], r:[6, 1.4, 6], z:'stoneD'}]);
    return {top, ridge};
  },
  tent(add, o, season){
    const W = o.W, D = o.D, H = o.H, ox = o.x || 0, oz = o.z || 0, sa = Math.atan2(H, W), sl = Math.hypot(H, W) / 2;
    for (const sx of [1, -1]){
      add([{t:'box', c:[ox + sx * W / 2, H / 2, oz], r:[sl, 1.2, D], rot:[0, 0, -sx * sa], z:'canvas'}]);
      for (const k of [0.3, 0.7]) add([{t:'box', c:[ox + sx * W * k, H * (1 - k) + 1.3, oz], r:[1.6, 0.5, D + 0.2], rot:[0, 0, -sx * sa], z:'stripe'}]);
      if (season === 'winter') add([{t:'box', c:[ox + sx * W / 2 + sx * 0.4, H / 2 + 2.2, oz], r:[sl - 1, 1, D + 0.2], rot:[0, 0, -sx * sa], z:'snow'}]);
    }
    for (let k = 0; k < 5; k++){ const y = k * H / 5, hw = W * (1 - (k + 0.5) / 5); add([{t:'box', c:[ox, y + H / 10, oz - D + 0.6], r:[hw, H / 10, 0.6], z:'canvas'}]); }
    for (let k = 0; k < 5; k++){ const y = k * H / 5, hw = W * (1 - (k + 0.5) / 5); add([{t:'box', c:[ox - hw * 0.35, y + H / 10, oz + D - 0.6], r:[hw * 0.65, H / 10, 0.6], z:'canvas'}]); }
    add([{t:'box', c:[ox + W * 0.12, H * 0.32, oz + D - 1], r:[W * 0.3, H * 0.32, 0.4], z:'tentIn'},
         {t:'cap', a:[ox, H + 0.5, oz - D - 2], p:[ox, H + 0.5, oz + D + 2], r:1, z:'wood'}, {t:'cap', a:[ox, 0, oz + D + 1], p:[ox, H + 1, oz + D + 1], r:0.9, z:'wood'}]);
    for (const sx of [1, -1]) add([{t:'cap', a:[ox + sx * (W + 1), 0.4, oz + D + 3], p:[ox + sx * (W + 3), 3, oz + D + 4], r:0.6, z:'wood'}]);
  },
  fence(add, x0, x1, z, h, season, step){
    for (let x = x0; x <= x1 + 0.1; x += step || 16){ add([{t:'box', c:[x, h / 2, z], r:[1.4, h / 2, 1.4], z:'wood'}]); if (season === 'winter') add([{t:'box', c:[x, h + 0.8, z], r:[1.6, 0.8, 1.6], z:'snow'}]); }
    for (const y of [h * 0.4, h * 0.85]){ add([{t:'box', c:[(x0 + x1) / 2, y, z + 0.8], r:[(x1 - x0) / 2 + 1, 0.9, 0.6], z:'woodL'}]); if (season === 'winter') add([{t:'box', c:[(x0 + x1) / 2, y + 1.1, z + 0.8], r:[(x1 - x0) / 2, 0.4, 0.7], z:'snow'}]); }
  },
  fenceZ(add, z0, z1, x, h, season, step){
    for (let z = z0; z <= z1 + 0.1; z += step || 16){ add([{t:'box', c:[x, h / 2, z], r:[1.4, h / 2, 1.4], z:'wood'}]); if (season === 'winter') add([{t:'box', c:[x, h + 0.8, z], r:[1.6, 0.8, 1.6], z:'snow'}]); }
    for (const y of [h * 0.4, h * 0.85]) add([{t:'box', c:[x + 0.8, y, (z0 + z1) / 2], r:[0.6, 0.9, (z1 - z0) / 2 + 1], z:'woodL'}]);
  },
  extras(add, season, W, D){
    if (season === 'spring') for (const x of [-W + 6, W - 6]) { add([{t:'box', c:[x, 3, D + 6], r:[4, 3, 3], z:'wood'}]); for (let k = -1; k <= 1; k++) add([{t:'ell', c:[x + k * 2.4, 7, D + 6], r:[1.6, 1.6, 1.6], z:k ? 'flower' : 'leafL'}]); }
    if (season === 'autumn') for (const [x, r] of [[-W + 4, 9], [W - 10, 12]]) add([{t:'ell', c:[x, 1.3, D + 5], r:[r, 2, 4], z:'drift'}]);
    if (season === 'winter') add([{t:'ell', c:[-W + 6, 2, D + 4], r:[12, 3, 5], z:'snow'}, {t:'ell', c:[W - 8, 2, D + 3], r:[13, 2.6, 4], z:'snow'}]);
  },
  zones(season, extra){
    const P = W3D_PAL[season] || W3D_PAL.summer;
    return Object.assign({stone:P.stone, stoneL:shade(P.stone, 1.14), stoneD:shade(P.stone, 0.66), plaster:P.plaster, wood:'#7a4e2a', woodL:'#9a6a3a', woodD:'#4a2e16', log:'#7a4e2a', beam:'#4a2e16',
      metal:'#7a7f86', gold:'#d4af37', winglow:'#ffd47a', winD:'#2a2420', signB:'#4a2e16', signF:'#e6d2a2', ink:'#2a2520', snow:'#eef2f6', drift:'#b8602a', flower:'#e86a8a', leafL:P.leafL,
      canvas:P.canvas, stripe:'#9b7a4a', tentIn:'#2a2018', straw:'#d8b860', hay:'#c8a850', iron:'#4a4a52', cloth:'#8c3a2e', coin:'#e8c040', fire:'#ff9a30', fire2:'#ffd860', ember:'#ff7a2a'}, extra || {});
  }
};
for (const z of ['fire', 'fire2']) { R3D.EMIT.add(z); R3D_MUTE_SKIP.add(z); }
const wAdd = P => list => { for (const q of list) P.push(Object.assign({b:'root'}, q)); };
const GC = n => GLYPH_COLOURS[n] || '#d4af37';
const W3D_FAC = {tents:'q_tents', huts:'q_huts', bunks:'q_bunks', kitchen:'f_kitchen', tavern:'f_tavern', command:'f_command', merchant:'f_merchant', cells:'f_cells',
  barracks:'f_barracks', training:'f_training', armoury:'f_armoury', stables:'f_stables'};
const facKind = (frame, keep, build) => ({frame:frame || [120, 120, 6], view:2.3, keep:Math.max(0.7, keep || 0.7), clip:'still', build});
Object.assign(W3D_KINDS, {
  q_tents:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.tent(add, {W:17, D:13, H:36, x:30, z:-12}, se); W3K.tent(add, {W:32, D:20, H:66, x:-6, z:6}, se);
    add([{t:'ell', c:[2, 3, 18], r:[5, 3, 4], z:'stoneD'}, {t:'cap', a:[-3, 2, 18], p:[6, 4, 19], r:1.4, z:'wood'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 1.5, 20], r:[22, 2, 6], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se, {canvas:w3dZ('canvas', se), stripe:'#9b7a4a'})}; }),
  q_huts:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:34, D:24, H:34, roofH:26, wall:'log', roof:'rfS', windows:[[20, 22]], doorX:-8}, se); W3K.sign(add, 'shield', 0, 52, 25, 3.08); W3K.extras(add, se, 34, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('shield'), rfS:'#6e5236', rfSD:'#4a3622'})}; }),
  q_bunks:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:46, D:26, H:58, roofH:30, wall:'plaster', roof:'rfS', windows:[[-26, 22], [26, 22], [-26, 46], [26, 46]]}, se); W3K.sign(add, 'flag', 0, 48, 27, 3.20);
    add([{t:'box', c:[0, 34, 27.5], r:[46, 1.2, 1.2], z:'beam'}]); W3K.extras(add, se, 46, 26);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('flag'), rfS:'#7a4a3a', rfSD:'#542e22'})}; }),
  f_kitchen:facKind(null, 0.62, se => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-34, -16], [34, -16], [-34, 14], [34, 14]]) add([{t:'box', c:[x, 21, z], r:[2, 21, 2], z:'wood'}]);
    add([{t:'box', c:[0, 44, -2], r:[40, 2, 22], rot:[0.22, 0, 0], z:'rfS'}, {t:'box', c:[0, 46.5, -2], r:[40.2, 0.6, 22.2], rot:[0.22, 0, 0], z:'rfSD'}]);
    if (se === 'winter') add([{t:'box', c:[0, 47.4, -2], r:[40.4, 1.3, 22.4], rot:[0.22, 0, 0], z:'snow'}]);
    for (let i = 0; i < 9; i++){ const a = i / 9 * TAU; add([{t:'ell', c:[-6 + Math.cos(a) * 11, 2.6, 6 + Math.sin(a) * 8], r:[3.4, 2.6, 3], z:'stoneD'}]); }
    add([{t:'ell', c:[-6, 5, 6], r:[6, 4, 4], z:'fire'}, {t:'ell', c:[-6, 9, 6], r:[3.4, 4, 2.6], z:'fire2'}]);
    for (const a of [0, 2.1, 4.2]) add([{t:'cap', a:[-6 + Math.cos(a) * 11, 0, 6 + Math.sin(a) * 8], p:[-6, 30, 6], r:0.9, z:'woodD'}]);
    add([{t:'cap', a:[-6, 30, 6], p:[-6, 21, 6], r:0.4, z:'iron'}, {t:'ell', c:[-6, 16, 6], r:[8, 6.4, 7], z:'iron'}, {t:'ell', c:[-6, 21.5, 6], r:[7, 0.8, 6], z:'stew'}]);
    add([{t:'box', c:[22, 13, 0], r:[11, 1.2, 8], z:'woodL'}, {t:'box', c:[14, 6, 0], r:[1, 6, 6], z:'wood'}, {t:'box', c:[30, 6, 0], r:[1, 6, 6], z:'wood'},
         {t:'ell', c:[18, 17, 2], r:[3, 3, 3], z:'iron'}, {t:'ell', c:[26, 16, -2], r:[2.6, 2.4, 2.6], z:'pot'}, {t:'ell', c:[24, 16, 4], r:[2, 2.8, 2], z:'pot'}]);
    for (let i = 0; i < 4; i++) add([{t:'cap', a:[-36, 2 + i * 3.4, -6 + (i % 2) * 2], p:[-24, 2 + i * 3.4, -6 + (i % 2) * 2], r:1.7, z:i % 2 ? 'wood' : 'woodL'}]);
    W3K.sign(add, 'flame', 30, 34, 15, 2.52);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('flame'), rfS:'#8a6a3a', rfSD:'#5a4424', stew:'#8a5a2a', pot:'#a06a44'})}; }),
  f_tavern:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    const t = W3K.house(add, {W:42, D:26, H:48, roofH:34, wall:'plaster', roof:'rfR', windows:[[-24, 30], [24, 30]], chimney:true}, se);
    add([{t:'cap', a:[30, 50, 27], p:[56, 50, 27], r:0.9, z:'iron'}]); W3K.sign(add, 'mug', 48, 36, 27.5, 2.6);
    add([{t:'box', c:[-24, 18, 30], r:[8, 3, 3], z:'wood'}, {t:'ell', c:[-30, 23, 30], r:[2, 2.4, 2], z:'pot'}]);
    W3K.extras(add, se, 42, 26);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('mug'), rfR:'#8a3a2a', rfRD:'#5e2418', pot:'#a06a44'})}; }),
  f_command:facKind(null, 0.66, se => { const P = [], add = wAdd(P);
    W3K.tent(add, {W:42, D:26, H:60}, se);
    add([{t:'cap', a:[0, 58, 0], p:[0, 82, 0], r:1.1, z:'wood'}, {t:'ell', c:[0, 83, 0], r:[1.8, 1.8, 1.8], z:'gold'}, {t:'box', c:[9, 74, 0], r:[9, 7, 0.5], z:'banner'}, {t:'box', c:[9, 74, 0.6], r:[3, 3, 0.3], z:'gold'}]);
    W3K.sign(add, 'star', 0, 40, 26.8, 2.6, 'keep');
    if (se === 'winter') add([{t:'ell', c:[0, 1.5, 30], r:[30, 2, 6], z:'snow'}]);
    let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
    return {parts:P, zones:W3K.zones(se, {canvas:'#a83a2a', stripe:'#e8b830', banner:bn, glyph:'#ffe060'}), keepZones:['canvas', 'stripe']}; }),
  f_merchant:facKind(null, 0.66, se => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-34, -14], [34, -14], [-34, 16], [34, 16]]) add([{t:'box', c:[x, 24, z], r:[1.6, 24, 1.6], z:'wood'}]);
    for (let i = 0; i < 8; i++) add([{t:'box', c:[-31.5 + i * 9, 48, 2 + 0], r:[4.5, 1.4, 20], rot:[0.28, 0, 0], z:i % 2 ? 'stripe' : 'awn'}]);
    for (let i = 0; i < 8; i++) add([{t:'box', c:[-31.5 + i * 9, 41.5, 22.5], r:[4.5, 3, 0.5], z:i % 2 ? 'stripe' : 'awn'}]);
    if (se === 'winter') add([{t:'box', c:[0, 51.5, 1], r:[37, 1.4, 20.5], rot:[0.28, 0, 0], z:'snow'}]);
    add([{t:'box', c:[0, 10, 12], r:[30, 10, 5], z:'wood'}, {t:'box', c:[0, 20.5, 12], r:[31, 0.8, 6], z:'woodL'}]);
    for (const [x, z] of [[-30, -6], [-20, -8], [26, -6]]) add([{t:'box', c:[x, 6, z], r:[5, 6, 5], z:'crate'}, {t:'box', c:[x, 6, z + 5.1], r:[5, 0.5, 0.2], z:'woodD'}]);
    add([{t:'ell', c:[-16, 23.5, 12], r:[4, 2.4, 3], z:'fruit'}, {t:'ell', c:[-6, 23, 13], r:[3, 1.8, 2.6], z:'cloth'}, {t:'cap', a:[4, 22, 12], p:[12, 22, 12], r:1.8, z:'cloth2'}, {t:'ell', c:[20, 22.5, 12], r:[2.4, 1.4, 2.4], z:'coin'}]);
    W3K.sign(add, 'coin', 0, 34, 23.4, 2.4);
    return {parts:P, zones:W3K.zones(se, {awn:'#c8a24a', stripe:'#8c3a2e', crate:'#9a6a3a', fruit:'#b84a2a', cloth:'#3a5a8a', cloth2:'#6a8a3a', glyph:GC('coin')})}; }),
  f_cells:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    const W = 40, D = 26, H = 40;
    add([{t:'box', c:[0, 2, 0], r:[W + 3, 2, D + 3], z:'stoneD'}, {t:'box', c:[0, H / 2 + 3, 0], r:[W, H / 2, D], z:'stone'}, {t:'box', c:[0, H + 5, 0], r:[W + 3, 2.4, D + 3], z:'stoneD'}]);
    for (const sx of [1, -1]) for (let y = 8; y < H; y += 10) add([{t:'box', c:[sx * (W - 3), y, D - 3], r:[4, 4.5, 4], z:(y / 10 | 0) % 2 ? 'stoneL' : 'stone'}]);
    for (let x = -W + 6; x < W; x += 12) add([{t:'box', c:[x, H + 9, D - 1], r:[4, 2.4, 2], z:'stone'}]);
    for (const x of [-24, 24]){ add([{t:'box', c:[x, 26, D + 0.3], r:[9.5, 7.5, 0.8], z:'stoneD'}, {t:'box', c:[x, 26, D + 0.6], r:[8, 6, 0.8], z:'cellIn'}]); for (let k = -3; k <= 3; k++) add([{t:'cap', a:[x + k * 2.3, 20, D + 1.6], p:[x + k * 2.3, 32, D + 1.6], r:0.8, z:'iron'}]); }
    add([{t:'box', c:[0, 15, D + 0.6], r:[9, 15, 1.2], z:'iron'}]); for (const y of [6, 15, 24]) add([{t:'box', c:[0, y, D + 1.9], r:[9.2, 0.9, 0.4], z:'metal'}]);
    add([{t:'ell', c:[5, 15, D + 2.4], r:[1.6, 1.6, 1], z:'metal'}]);
    W3K.sign(add, 'bars', 0, H - 2, D + 0.5, 2.38);
    if (se === 'winter') add([{t:'box', c:[0, H + 8, 0], r:[W + 3, 1.6, D + 3], z:'snow'}]);
    W3K.extras(add, se, W, D);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('bars'), cellIn:'#c89a50', iron:'#2a2a30'}), keepZones:['cellIn']}; }),
  f_barracks:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:48, D:24, H:40, roofH:28, wall:'wood', roof:'rfB', windows:[[-30, 26], [30, 26]], doorX:0}, se); W3K.sign(add, 'flag', 0, 52, 25, 3.20);
    add([{t:'box', c:[-58, 14, 10], r:[1, 14, 1], z:'wood'}, {t:'box', c:[-58, 24, 10], r:[1, 1, 7], z:'woodD'}]);
    for (const z of [5, 10, 15]) add([{t:'cap', a:[-56, 2, z], p:[-58, 34, z], r:0.6, z:'woodL'}, {t:'ell', c:[-58, 35, z], r:[0.8, 2, 0.8], z:'metal'}]);
    W3K.extras(add, se, 48, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('flag'), rfB:'#5a4a3a', rfBD:'#3e3226'})}; }),
  f_training:facKind(null, 0.62, se => { const P = [], add = wAdd(P);
    W3K.fence(add, -48, 48, -26, 14, se, 16); W3K.fence(add, -48, -14, 26, 14, se, 17); W3K.fence(add, 14, 48, 26, 14, se, 17);
    W3K.fenceZ(add, -26, 26, -48, 14, se, 13); W3K.fenceZ(add, -26, 26, 48, 14, se, 13);
    add([{t:'ell', c:[0, 0.8, 0], r:[42, 0.8, 22], z:'dirt'}]);
    add([{t:'cap', a:[-16, 0, -2], p:[-16, 52, -2], r:2, z:'wood'}, {t:'cap', a:[-31, 38, -2], p:[-1, 38, -2], r:1.6, z:'wood'},
         {t:'ell', c:[-16, 34, -2], r:[8, 12, 6.5], z:'straw'}, {t:'ell', c:[-16, 52, -2], r:[6, 6.4, 5.6], z:'sack'}, {t:'box', c:[-16, 30, 4.2], r:[6, 1, 0.5], z:'rope'}, {t:'box', c:[-16, 42, 4.2], r:[6, 1, 0.5], z:'rope'}]);
    add([{t:'box', c:[22, 12, -6], r:[1, 12, 5], rot:[0, 0, 0.2], z:'wood'}, {t:'ell', c:[22, 22, -2], r:[9, 9, 2], z:'straw'}, {t:'ell', c:[22, 22, 0.2], r:[6, 6, 0.4], z:'tgt1'},
         {t:'ell', c:[22, 22, 0.8], r:[3, 3, 0.4], z:'tgt2'}, {t:'cap', a:[20, 23, 1], p:[26, 24, 6], r:0.4, z:'woodL'}]);
    add([{t:'box', c:[-14, 21, 27], r:[1.6, 21, 1.6], z:'wood'}]); W3K.sign(add, 'sword', -14, 34, 29, 2.52);
    if (se === 'winter') add([{t:'ell', c:[0, 1.6, 0], r:[40, 1.2, 20], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('sword'), dirt:w3dZ('dirt', se), sack:'#c8b088', rope:'#6a4a2a', tgt1:'#e8e0cc', tgt2:'#a82a24'})}; }),
  f_armoury:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:40, D:26, H:46, roofH:30, wall:'stone', roof:'rfA', windows:[[-24, 32], [24, 32]], dark:true, door:'iron'}, se); W3K.sign(add, 'shield', 0, 58, 27, 3.20);
    add([{t:'box', c:[52, 16, 12], r:[1, 16, 1], z:'wood'}, {t:'box', c:[52, 26, 12], r:[1, 1, 8], z:'woodD'}]);
    for (const z of [6, 12, 18]) add([{t:'cap', a:[50, 2, z], p:[52, 40, z], r:0.6, z:'woodL'}, {t:'ell', c:[52, 41, z], r:[0.9, 2.4, 0.9], z:'metal'}]);
    for (const z of [8, 16]) add([{t:'ell', c:[-50, 9, z], r:[1.4, 8, 6.4], z:'shieldC'}, {t:'ell', c:[-48.6, 9, z], r:[0.8, 2, 2], z:'metal'}]);
    W3K.extras(add, se, 40, 26);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('shield'), rfA:'#4a4a52', rfAD:'#30303a', shieldC:'#7a3e26'})}; }),
  f_stables:facKind(null, 0.6, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:46, D:28, H:44, roofH:30, wall:'barn', roof:'rfB', windows:[], doorW:16, doorH:18, door:'barnD'}, se);
    add([{t:'box', c:[0, 18, 29.6], r:[16, 0.7, 0.5], rot:[0, 0, 0.85], z:'woodL'}, {t:'box', c:[0, 18, 29.6], r:[16, 0.7, 0.5], rot:[0, 0, -0.85], z:'woodL'}, {t:'box', c:[0, 18, 29.8], r:[0.6, 18, 0.5], z:'woodD'}]);
    add([{t:'box', c:[0, 50, 28.6], r:[8, 7, 0.8], z:'woodD'}, {t:'box', c:[0, 48, 29.2], r:[6.4, 4, 0.5], z:'hay'}]);
    W3K.sign(add, 'horse', 0, 66, 27, 2.66);
    for (const [x, z] of [[-38, 34], [-28, 36], [36, 34]]) add([{t:'box', c:[x, 5, z], r:[6, 5, 4.4], z:'hay'}, {t:'box', c:[x, 5, z + 4.5], r:[6, 0.5, 0.2], z:'rope'}]);
    if (se === 'winter') for (const [x, z] of [[-38, 34], [-28, 36], [36, 34]]) add([{t:'box', c:[x, 10.6, z], r:[6.2, 0.8, 4.6], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('horse'), rfB:'#5a4a3a', rfBD:'#3e3226', barn:'#a8382a', barnD:'#8a2a1e', woodL:'#e8e0cc', rope:'#6a4a2a'}), keepZones:['barn', 'barnD']}; }),
  paddock:{frame:[120, 70, 6], view:2.3, keep:0.6, clip:'still', build:se => { const P = [], add = wAdd(P);
    W3K.fence(add, -50, 50, -22, 18, se, 16); W3K.fence(add, -50, 50, 22, 18, se, 16); W3K.fenceZ(add, -22, 22, -50, 18, se, 11); W3K.fenceZ(add, -22, 22, 50, 18, se, 11);
    add([{t:'box', c:[34, 4, 12], r:[8, 4, 3], z:'wood'}, {t:'box', c:[34, 7.6, 12], r:[7, 0.6, 2.4], z:'water'}]);
    return {parts:P, zones:W3K.zones(se, {water:w3dZ('water', se)})}; }}
});
/* a building in 3D: the fort's, the barge's and warehouse's skins, the waystation's ruins, damage, the plot's view (folded: Index 64, 66, 68) */
function w3dFacility(o){
  if (o.kind !== 'building') return false;
  const hk = holdKey(); let id = o.id;
  if (id === 'tents') id = META.facilities.bunks ? 'bunks' : META.facilities.huts ? 'huts' : 'tents';
  let k = null;
  if (hk === 'barge' || hk === 'warehouse') k = skinKind2(hk, id);
  else { k = W3D_FAC[id]; if (k && hk === 'waystation') k = ruinKind(k); }
  if (!k || !W3D_KINDS[k]) return false;
  if (isDamaged(o.id)) k = wDmg(k);
  return w3dDraw(k, o.x, o.y + 6, {view:plotView(o.id)});
}
function w3dPaddock(px, py){ if (holding() !== 'fort') return false; return w3dDraw('paddock', px, py + 8); }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx64')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx64"><b>3D fort, part one.</b> In the Frontier Timber Fort, the quarters, Kitchen, Tavern, Command Tent, Merchant Stalls, Cells, Barracks, Training Grounds, Armoury and Stables are 3D, with their signs, and change with the seasons.</p>`);
  };
}
/* ===== END INDEX 64 ======================================================= */

/* ============================================================================
   INDEX 65 - 3D FORT FACILITIES, BATCH 2, AND DAMAGE FROM RAIDS
   With "3D world" on, the rest of the Frontier Timber Fort is 3D:
     Ranger's Hut      a log hut with a green roof, a bow sign, antlers over the
                       door and a stack of arrows in a barrel
     Field Hospital    a white ward tent with a red cross, cots under an awning
     Blacksmith        a stone forge with a glowing hearth, chimney, an anvil on
                       a stump and an anvil sign
     Carpentry         a timber shop with planks on trestles, a saw-horse and a
                       saw sign
     Leatherworking    a timber shop with a hide stretched on a frame, tanning
                       tubs and a hide sign
     Engineering       a stone workshop with a chimney, a big cog on the gable,
                       a ballista frame and a gear sign
     Alchemy Lab       a plaster house with a green roof, green smoke, bottles
                       on a bench and a potion sign
     Mage Tower        a tall round stone tower with a pointed blue roof, lit
                       slit windows, a star finial and a star sign
     Chapel            a small stone chapel with a bell-cote and sun sign;
     Fortress Church   the upgrade, with a square bell tower and buttresses
     Kennels           a log kennel house with dog doors, a fenced run, a water
                       trough and a boot sign
     Palisade & Gatehouse  a timber gatehouse with two towers, a walkway and the
                       Chapter's banner; the stake ring round the camp is 3D
     Watchtower        a tall timber tower with a railed platform and roof
     Trap Yard         a log shed with sharpened stakes, a spike pit and a stake
                       sign
     Graveyard         a 3D fence and gate, a stone cross for each fallen
                       Squad Leader and a wooden cross for each Squad Mate, and
                       the oak beside it
     Trophy Rack       a 3D frame; the trophies hang from it as before
     Quartermaster     a covered wagon with spoked wheels, crates and a coin sign
   DAMAGE   A facility damaged in a raid shows it until it is repaired: some
            roof and wall pieces are missing, others are charred black, broken
            planks and rubble lie at its foot and a tarp is lashed over the
            worst of it. This covers both batches. (It still smokes, as before.)
   Seasons as before. Click areas and draw order unchanged. The other holdings
   stay pixel art. Nothing new is saved. Rollback: delete from this comment to
   END INDEX 65 and undo the patches marked "Index 65".

   3D DESIGN NOTE: WORLD, ADDENDUM
     NEW KIT   W3K.tower(add, o, season)  a round tower (stacked rings) with a
                 cone roof, slit windows and an optional finial
               W3K.stakes(add, x0, x1, z, h, season)  a row of sharpened stakes
     DAMAGE    w3dDamaged(build) wraps a builder: it removes about one roof or
               upper part in seven, chars about one in five (zone 'char'),
               and adds rubble, broken planks and a tarp. Damaged kinds are
               registered as <kind>_dmg; w3dFacility picks them when
               isDamaged(id). Deterministic, so the same building always breaks
               the same way.
     PROPS     Small repeated props (stake, cross, stone) are their own kinds
               and are drawn once per instance; off-screen ones are skipped.
============================================================================ */
const W3K2 = {
  tower(add, o, se){
    const R = o.R, H = o.H, ox = o.x || 0, oz = o.z || 0;
    for (let y = 0; y < H; y += 6) add([{t:'ell', c:[ox, y + 3, oz], r:[R, 3.4, R], z:(y / 6) % 2 ? 'stone' : 'stoneL'}]);
    add([{t:'ell', c:[ox, H + 1, oz], r:[R + 3, 2.4, R + 3], z:'stoneD'}]);
    for (let k = 0; k < 6; k++){ const rr = (R + 4) * (1 - k / 6), y = H + 3 + k * o.roofH / 6; add([{t:'ell', c:[ox, y + o.roofH / 12, oz], r:[rr, o.roofH / 12 + 0.6, rr], z:k % 2 ? o.roof : o.roof + 'D'}]); }
    if (se === 'winter') add([{t:'ell', c:[ox - 1, H + 3 + o.roofH * 0.4, oz], r:[(R + 4) * 0.62, o.roofH * 0.34, (R + 4) * 0.62], z:'snow'}, {t:'ell', c:[ox, H + 3, oz], r:[R + 4.4, 1.6, R + 4.4], z:'snow'}]);
    for (const y of o.slits || []) add([{t:'box', c:[ox, y, oz + R - 0.4], r:[1.4, 4, 0.8], z:'winglow'}]);
    if (o.finial) add([{t:'cap', a:[ox, H + 3 + o.roofH, oz], p:[ox, H + 10 + o.roofH, oz], r:0.7, z:'gold'}, {t:'ell', c:[ox, H + 11 + o.roofH, oz], r:[2, 2, 2], z:'gold'}]);
    add([{t:'box', c:[ox, 10, oz + R - 0.5], r:[5, 10, 1.4], z:'woodD'}, {t:'box', c:[ox, 9.5, oz + R + 0.4], r:[3.8, 9.5, 0.6], z:'wood'}]);
  },
  stakes(add, x0, x1, z, h, se, step){
    for (let x = x0; x <= x1 + 0.1; x += step || 6){ add([{t:'cap', a:[x, 0, z], p:[x, h, z], r:2.6, z:'wood'}, {t:'ell', c:[x, h + 2.4, z], r:[1.8, 3.4, 1.8], z:'woodL'}]); if (se === 'winter') add([{t:'ell', c:[x, h + 4.8, z], r:[1.4, 1, 1.4], z:'snow'}]); }
    add([{t:'box', c:[(x0 + x1) / 2, h * 0.45, z + 2.4], r:[(x1 - x0) / 2 + 2, 1.2, 0.8], z:'woodD'}]);
  }
};
const W3D_FAC2 = {ranger:'f_ranger', hospital:'f_hospital', blacksmith:'f_blacksmith', carpentry:'f_carpentry', leather:'f_leather', engineering:'f_engineering', alchemy:'f_alchemy',
  magetower:'f_magetower', chapel:'f_chapel', fortresschurch:'f_church', kennels:'f_kennels', palisade:'f_gatehouse', watchtower:'f_watchtower', trapyard:'f_trapyard'};
Object.assign(W3D_FAC, W3D_FAC2);
Object.assign(W3D_KINDS, {
  f_ranger:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:36, D:24, H:36, roofH:28, wall:'log', roof:'rfG', windows:[[22, 22]], doorX:-8}, se); W3K.sign(add, 'bow', 4, 54, 25, 2.6);
    add([{t:'cap', a:[-8, 37, 25.5], p:[-16, 44, 26], r:0.8, z:'bone'}, {t:'cap', a:[-8, 37, 25.5], p:[0, 44, 26], r:0.8, z:'bone'}, {t:'cap', a:[-14, 42, 26], p:[-18, 46, 26], r:0.6, z:'bone'}, {t:'cap', a:[-2, 42, 26], p:[2, 46, 26], r:0.6, z:'bone'}]);
    add([{t:'cap', a:[44, 0, 18], p:[44, 12, 18], r:4.4, z:'wood'}]); for (let k = 0; k < 6; k++) add([{t:'cap', a:[42 + (k % 3) * 2, 11, 16 + (k >> 1) * 1.6], p:[42.5 + (k % 3) * 2, 19, 16.5 + (k >> 1) * 1.6], r:0.4, z:'woodL'}, {t:'ell', c:[42.5 + (k % 3) * 2, 19.5, 16.5 + (k >> 1) * 1.6], r:[0.8, 1.2, 0.3], z:'feather'}]);
    W3K.extras(add, se, 36, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('bow'), rfG:'#4e6b2c', rfGD:'#344a1c', bone:'#e0d6bc', feather:'#e8e0cc'}), keepZones:['rfG']}; }),
  f_hospital:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.tent(add, {W:34, D:26, H:46, x:-6}, se);
    for (const [x, z] of [[30, -8], [52, -8], [30, 22], [52, 22]]) add([{t:'box', c:[x, 14, z], r:[1.2, 14, 1.2], z:'wood'}]);
    add([{t:'box', c:[41, 29, 7], r:[14, 1, 18], rot:[0.15, 0, 0], z:'canvas'}]); if (se === 'winter') add([{t:'box', c:[41, 30.6, 7], r:[14, 1, 18], rot:[0.15, 0, 0], z:'snow'}]);
    for (const z of [-2, 14]) add([{t:'box', c:[41, 6, z], r:[10, 1, 4], z:'woodL'}, {t:'box', c:[41, 7.6, z], r:[9, 1, 3.4], z:'linen'}, {t:'ell', c:[33, 8.4, z], r:[2, 1.4, 2.4], z:'linen'}]);
    add([{t:'box', c:[-6, 30, 27], r:[8, 2.4, 0.6], z:'redX'}, {t:'box', c:[-6, 30, 27], r:[2.4, 8, 0.6], z:'redX'}]);
    return {parts:P, zones:W3K.zones(se, {canvas:'#ece4cf', stripe:'#d8d0bc', linen:'#f0ece0', redX:'#c83030'}), keepZones:['canvas', 'redX', 'linen']}; }),
  f_blacksmith:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:40, D:26, H:42, roofH:28, wall:'stone', roof:'rfK', windows:[], chimney:true, doorX:-16, doorW:8}, se); W3K.sign(add, 'anvil', 0, 56, 27, 2.6);
    add([{t:'box', c:[14, 16, 26.4], r:[11, 12, 1.2], z:'stoneD'}, {t:'box', c:[14, 13, 27], r:[8.4, 8, 0.6], z:'fire'}, {t:'box', c:[14, 17, 27.2], r:[5, 3, 0.4], z:'fire2'}]);
    add([{t:'cap', a:[-34, 0, 36], p:[-34, 9, 36], r:5, z:'wood'}, {t:'box', c:[-34, 11, 36], r:[7, 2, 3], z:'iron'}, {t:'box', c:[-29, 11.5, 36], r:[3, 1.4, 1.6], z:'iron'}, {t:'box', c:[-34, 14, 36], r:[5, 1.6, 2.6], z:'iron'}]);
    add([{t:'ell', c:[38, 5, 36], r:[5, 5, 5], z:'wood'}, {t:'ell', c:[38, 10.2, 36], r:[4.2, 0.6, 4.2], z:'water'}]);
    W3K.extras(add, se, 40, 26);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('anvil'), rfK:'#3a3a40', rfKD:'#26262c', water:w3dZ('water', se)})}; }),
  f_carpentry:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:40, D:24, H:38, roofH:26, wall:'wood', roof:'rfC', windows:[[24, 24]], doorX:-10}, se); W3K.sign(add, 'saw', 0, 50, 25, 2.6);
    for (const x of [-46, -26]) add([{t:'box', c:[x, 6, 36], r:[1, 6, 4], z:'wood'}]);
    for (let k = 0; k < 4; k++) add([{t:'box', c:[-36, 13 + k * 2.2, 36 - k * 0.4], r:[14, 1, 3.4], z:k % 2 ? 'woodL' : 'plank'}]);
    add([{t:'box', c:[40, 8, 34], r:[8, 1.2, 1.6], z:'woodL'}, {t:'cap', a:[33, 0, 31], p:[35, 8, 34], r:0.8, z:'wood'}, {t:'cap', a:[47, 0, 37], p:[45, 8, 34], r:0.8, z:'wood'}, {t:'cap', a:[33, 0, 37], p:[35, 8, 34], r:0.8, z:'wood'}, {t:'cap', a:[47, 0, 31], p:[45, 8, 34], r:0.8, z:'wood'}]);
    if (se === 'winter') add([{t:'box', c:[-36, 20.6, 35], r:[14, 0.8, 3.4], z:'snow'}]);
    W3K.extras(add, se, 40, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('saw'), rfC:'#8a5a2b', rfCD:'#5e3c1c', plank:'#c8a070'})}; }),
  f_leather:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:38, D:24, H:38, roofH:26, wall:'wood', roof:'rfL', windows:[[-22, 24]], doorX:10}, se); W3K.sign(add, 'hide', -2, 50, 25, 2.6);
    add([{t:'box', c:[-48, 16, 30], r:[1, 16, 1], z:'wood'}, {t:'box', c:[-28, 16, 30], r:[1, 16, 1], z:'wood'}, {t:'box', c:[-38, 31, 30], r:[11, 1, 1], z:'wood'}, {t:'box', c:[-38, 4, 30], r:[11, 1, 1], z:'wood'},
         {t:'ell', c:[-38, 17, 30.6], r:[8, 11, 0.6], z:'hide'}]);
    for (const [x, z] of [[40, 30], [50, 22]]) add([{t:'ell', c:[x, 5, z], r:[6, 5, 6], z:'wood'}, {t:'ell', c:[x, 10.3, z], r:[5.2, 0.6, 5.2], z:'tan'}]);
    W3K.extras(add, se, 38, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('hide'), rfL:'#6a4a2a', rfLD:'#46301a', hide:'#b08a5a', tan:'#6a3a1a'})}; }),
  f_engineering:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:44, D:26, H:44, roofH:28, wall:'stone', roof:'rfE', windows:[[-26, 30]], chimney:true, doorX:16, doorW:11}, se); W3K.sign(add, 'gear', -6, 56, 27, 2.6);
    for (let i = 0; i < 10; i++){ const a = i / 10 * TAU; add([{t:'box', c:[-54 + Math.cos(a) * 9, 22 + Math.sin(a) * 9, 22], r:[2, 2, 1.6], rot:[0, 0, a], z:'iron'}]); }
    add([{t:'ell', c:[-54, 22, 22], r:[8, 8, 1.4], z:'iron'}, {t:'ell', c:[-54, 22, 23.2], r:[2.4, 2.4, 0.8], z:'metal'}, {t:'cap', a:[-54, 0, 22], p:[-54, 14, 22], r:1.2, z:'wood'}]);
    add([{t:'box', c:[46, 6, 34], r:[8, 1.4, 6], z:'wood'}, {t:'cap', a:[38, 9, 34], p:[54, 9, 34], r:0.8, z:'wood'}, {t:'cap', a:[46, 8, 26], p:[46, 12, 44], r:1.2, z:'wood'}, {t:'cap', a:[39, 10, 30], p:[53, 10, 38], r:0.3, z:'string'}]);
    for (const x of [38, 54]) add([{t:'ell', c:[x, 4, 40], r:[1.2, 4, 4], z:'woodD'}]);
    W3K.extras(add, se, 44, 26);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('gear'), rfE:'#5a4a3a', rfED:'#3e3226', string:'#d8d0bc'})}; }),
  f_alchemy:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:38, D:24, H:42, roofH:30, wall:'plaster', roof:'rfP', windows:[[-22, 28], [22, 28]], chimney:true}, se); W3K.sign(add, 'potion', 0, 56, 25, 2.6);
    for (let k = 0; k < 3; k++) add([{t:'ell', c:[19 + k * 2, 82 + k * 9, -9.6], r:[4 + k * 1.4, 3.4 + k, 4 + k * 1.4], z:'smokeG'}]);
    add([{t:'box', c:[-44, 9, 30], r:[8, 1, 4], z:'woodL'}, {t:'box', c:[-50, 4.5, 30], r:[1, 4.5, 3], z:'wood'}, {t:'box', c:[-38, 4.5, 30], r:[1, 4.5, 3], z:'wood'}]);
    for (const [x, c] of [[-49, 'bot1'], [-45, 'bot2'], [-41, 'bot3'], [-38, 'bot1']]) add([{t:'ell', c:[x, 12, 30], r:[1.6, 2.4, 1.6], z:c}, {t:'cap', a:[x, 14, 30], p:[x, 16, 30], r:0.5, z:c}]);
    W3K.extras(add, se, 38, 24);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('potion'), rfP:'#4a6a3a', rfPD:'#30482a', smokeG:'#9ae070', bot1:'#7ac05a', bot2:'#c04a6a', bot3:'#4a8ac0'}), keepZones:['smokeG', 'bot1', 'bot2', 'bot3', 'rfP']}; }),
  f_magetower:facKind(null, 0.72, se => { const P = [], add = wAdd(P);
    W3K2.tower(add, {R:21, H:74, roofH:40, roof:'rfM', slits:[34, 58], finial:true}, se);
    add([{t:'ell', c:[0, 2, 0], r:[26, 2, 26], z:'stoneD'}]); W3K.sign(add, 'star', 0, 28, 21, 2.4);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('star'), rfM:'#3f3f8f', rfMD:'#2a2a6a'}), keepZones:['rfM', 'rfMD']}; }),
  f_chapel:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:30, D:30, H:44, roofH:34, wall:'stone', roof:'rfS', windows:[], doorW:8, doorH:18}, se);
    add([{t:'ell', c:[0, 36, 31], r:[6, 6, 0.8], z:'winglow'}, {t:'box', c:[0, 36, 31.6], r:[0.5, 6, 0.4], z:'woodD'}, {t:'box', c:[0, 36, 31.6], r:[6, 0.5, 0.4], z:'woodD'}]);
    add([{t:'box', c:[0, 92, 28], r:[6, 9, 4], z:'stone'}, {t:'box', c:[0, 92, 31], r:[3.2, 5, 1], z:'winD'}, {t:'ell', c:[0, 91, 30.6], r:[2.4, 2.8, 2], z:'gold'}, {t:'box', c:[0, 102, 28], r:[8, 1.6, 6], z:'rfSD'}]);
    add([{t:'box', c:[0, 108, 28], r:[0.8, 5, 0.8], z:'gold'}, {t:'box', c:[0, 109, 28], r:[3, 0.8, 0.8], z:'gold'}]);
    W3K.sign(add, 'sun', 22, 22, 31, 2.2); W3K.extras(add, se, 30, 30);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('sun'), rfS:'#5a5a6a', rfSD:'#3e3e4a'})}; }),
  f_church:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:38, D:32, H:52, roofH:40, wall:'stone', roof:'rfS', windows:[[-24, 36], [24, 36]], doorW:9, doorH:20}, se);
    for (const sx of [1, -1]) add([{t:'box', c:[sx * 41, 18, 30], r:[3, 18, 4], z:'stoneD'}, {t:'box', c:[sx * 41, 38, 28], r:[2.4, 4, 3], rot:[0.5, 0, 0], z:'stoneD'}]);
    add([{t:'ell', c:[0, 44, 33], r:[7, 7, 0.8], z:'winglow'}]);
    add([{t:'box', c:[0, 60, -36], r:[14, 60, 14], z:'stone'}, {t:'box', c:[0, 104, -22], r:[6, 8, 1], z:'winD'}, {t:'ell', c:[0, 102, -21.4], r:[3, 3.4, 2], z:'gold'}, {t:'box', c:[0, 121, -36], r:[16, 2, 16], z:'stoneD'}]);
    for (let k = 0; k < 5; k++){ const hw = 15 * (1 - (k + 0.5) / 5); add([{t:'box', c:[0, 125 + k * 5, -36], r:[hw, 2.5, hw], z:k % 2 ? 'rfS' : 'rfSD'}]); }
    if (se === 'winter') add([{t:'box', c:[0, 123.4, -36], r:[16.4, 1, 16.4], z:'snow'}]);
    add([{t:'box', c:[0, 156, -36], r:[0.9, 6, 0.9], z:'gold'}, {t:'box', c:[0, 158, -36], r:[3.4, 0.9, 0.9], z:'gold'}]);
    W3K.sign(add, 'sun', 0, 70, 33, 2.4); W3K.extras(add, se, 38, 32);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('sun'), rfS:'#5a5a6a', rfSD:'#3e3e4a'})}; }),
  f_kennels:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:28, D:20, H:28, roofH:22, wall:'log', roof:'rfS', windows:[], doorW:5, doorH:8, door:'tentIn', doorX:-10}, se);
    add([{t:'box', c:[10, 8, 20.6], r:[5, 8, 0.8], z:'tentIn'}]); W3K.sign(add, 'boot', 0, 42, 21, 2.2);
    W3K.fence(add, 30, 64, 24, 12, se, 11); W3K.fence(add, 30, 64, -16, 12, se, 11); W3K.fenceZ(add, -16, 24, 64, 12, se, 10);
    add([{t:'box', c:[48, 3, 8], r:[7, 3, 3], z:'wood'}, {t:'box', c:[48, 5.8, 8], r:[6, 0.5, 2.4], z:'water'}, {t:'ell', c:[56, 2, -6], r:[3, 1.4, 2], z:'bone'}]);
    W3K.extras(add, se, 28, 20);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('boot'), rfS:'#6a5236', rfSD:'#46361e', water:w3dZ('water', se), bone:'#e0d6bc'})}; }),
  f_gatehouse:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    for (const sx of [1, -1]){ const x = sx * 34;
      for (let k = 0; k < 7; k++) add([{t:'cap', a:[x - 9 + k * 3, 0, 0], p:[x - 9 + k * 3, 64, 0], r:1.8, z:k % 2 ? 'wood' : 'woodL'}]);
      add([{t:'box', c:[x, 66, 0], r:[12, 2, 10], z:'woodD'}]); for (let k = -1; k <= 1; k++) add([{t:'box', c:[x + k * 8, 72, 8], r:[2.4, 4, 1.4], z:'wood'}]);
      add([{t:'box', c:[x, 82, 0], r:[13, 1.6, 11], rot:[0, 0, 0], z:'rfS'}, {t:'box', c:[x, 87, 0], r:[8, 4, 7], z:'rfSD'}]);
      if (se === 'winter') add([{t:'box', c:[x, 92, 0], r:[8.4, 1.4, 7.4], z:'snow'}, {t:'box', c:[x, 84.4, 0], r:[13, 0.8, 11], z:'snow'}]);
      for (let k = 0; k < 5; k++) add([{t:'cap', a:[x - 9 + k * 4.4, 74, 8], p:[x - 9 + k * 4.4, 80, 8], r:0.5, z:'wood'}]); }
    add([{t:'box', c:[0, 52, 0], r:[24, 2.4, 9], z:'woodD'}, {t:'box', c:[0, 58, 7], r:[24, 3.6, 1.2], z:'wood'}]);
    for (const sx of [1, -1]) add([{t:'box', c:[sx * 11, 24, 2], r:[11, 24, 1.2], z:'gateW'}, {t:'box', c:[sx * 11, 12, 3.4], r:[11, 1, 0.5], z:'iron'}, {t:'box', c:[sx * 11, 36, 3.4], r:[11, 1, 0.5], z:'iron'}]);
    add([{t:'box', c:[0, 46, 3.2], r:[8, 5, 0.5], z:'banner'}, {t:'box', c:[0, 46, 3.8], r:[3, 3, 0.3], z:'gold'}]);
    let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
    return {parts:P, zones:W3K.zones(se, {rfS:'#5a4a3a', rfSD:'#3e3226', gateW:'#6a4a2a', banner:bn})}; }),
  f_watchtower:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    for (const [x, z] of [[-12, -10], [12, -10], [-12, 10], [12, 10]]) add([{t:'cap', a:[x * 1.2, 0, z * 1.2], p:[x, 82, z], r:2, z:'wood'}]);
    for (const y of [24, 52]) add([{t:'cap', a:[-13, y, 11], p:[13, y + 18, 11], r:0.9, z:'woodD'}, {t:'cap', a:[13, y, 11], p:[-13, y + 18, 11], r:0.9, z:'woodD'}]);
    add([{t:'box', c:[0, 84, 0], r:[17, 2, 15], z:'woodL'}]);
    for (const sx of [1, -1]) add([{t:'box', c:[sx * 16, 91, 0], r:[1, 6, 15], z:'wood'}]); add([{t:'box', c:[0, 91, 14.4], r:[16, 6, 1], z:'wood'}, {t:'box', c:[0, 91, -14.4], r:[16, 6, 1], z:'wood'}]);
    for (const [x, z] of [[-14, -12], [14, -12], [-14, 12], [14, 12]]) add([{t:'cap', a:[x, 86, z], p:[x, 104, z], r:0.9, z:'wood'}]);
    add([{t:'box', c:[0, 108, 0], r:[19, 2, 17], rot:[0.1, 0, 0], z:'rfS'}, {t:'box', c:[0, 112, 0], r:[11, 3, 10], z:'rfSD'}, {t:'cap', a:[0, 115, 0], p:[0, 126, 0], r:0.7, z:'wood'}, {t:'box', c:[5, 122, 0], r:[5, 3.4, 0.4], z:'banner'}]);
    if (se === 'winter') add([{t:'box', c:[0, 111, 0], r:[19, 1.2, 17], rot:[0.1, 0, 0], z:'snow'}, {t:'box', c:[0, 86.4, 0], r:[17, 0.8, 15], z:'snow'}]);
    for (let y = 6; y < 82; y += 8) add([{t:'box', c:[0, y, 13], r:[6, 0.7, 0.6], z:'woodL'}]);
    let bn = '#8a1a1a'; try { bn = banner().c1; } catch (e) {}
    return {parts:P, zones:W3K.zones(se, {rfS:'#5a4a3a', rfSD:'#3e3226', banner:bn})}; }),
  f_trapyard:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    W3K.house(add, {W:28, D:20, H:30, roofH:20, wall:'log', roof:'rfS', windows:[], doorX:0, doorW:7, doorH:12}, se); W3K.sign(add, 'stake', 0, 40, 21, 2.2);
    W3K2.stakes(add, 34, 64, 18, 16, se, 6);
    add([{t:'ell', c:[-46, 0.8, 22], r:[12, 0.8, 8], z:'tentIn'}]); for (const [x, z] of [[-50, 20], [-44, 24], [-48, 26], [-40, 20]]) add([{t:'cap', a:[x, 0, z], p:[x, 7, z], r:0.7, z:'woodL'}]);
    add([{t:'ell', c:[-40, 4, -8], r:[6, 4, 5], z:'iron'}, {t:'box', c:[-40, 8.6, -8], r:[6, 0.6, 0.6], z:'metal'}]);
    W3K.extras(add, se, 28, 20);
    return {parts:P, zones:W3K.zones(se, {glyph:GC('stake'), rfS:'#5a4a3a', rfSD:'#3e3226'})}; }),
  // camp props
  w_wagon:facKind(null, 0.7, se => { const P = [], add = wAdd(P);
    add([{t:'box', c:[0, 22, 0], r:[34, 4, 16], z:'wood'}, {t:'box', c:[0, 26, 16.5], r:[34, 0.6, 0.4], z:'woodL'}]);
    for (let k = 0; k < 9; k++){ const a = Math.PI * (k + 0.5) / 9; add([{t:'box', c:[0, 26 + Math.sin(a) * 18, Math.cos(a) * 16], r:[31, 1.3, 3.4], rot:[Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 0], z:'canvas'}]); }
    for (const x of [-20, -7, 7, 20]) for (let k = 0; k < 9; k++){ const a = Math.PI * (k + 0.5) / 9; add([{t:'box', c:[x, 26 + Math.sin(a) * 18.6, Math.cos(a) * 16.6], r:[1.2, 0.7, 3.4], rot:[Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 0], z:'canvasD'}]); }
    for (const sx of [1, -1]) add([{t:'ell', c:[sx * 31, 26, 0], r:[0.8, 18, 16], z:'canvasD'}]);
    for (const [x, z] of [[-24, 16], [24, 16], [-24, -16], [24, -16]]){ add([{t:'ell', c:[x, 10, z + Math.sign(z) * 1], r:[10, 10, 1.4], z:'woodD'}, {t:'ell', c:[x, 10, z + Math.sign(z) * 1.8], r:[7.4, 7.4, 1], z:'wheel'}, {t:'ell', c:[x, 10, z + Math.sign(z) * 2.6], r:[2, 2, 1], z:'gold'}]);
      for (let s = 0; s < 4; s++) add([{t:'box', c:[x, 10, z + Math.sign(z) * 2.2], r:[7, 0.6, 0.4], rot:[0, 0, s * Math.PI / 4], z:'woodD'}]); }
    add([{t:'cap', a:[34, 18, 0], p:[56, 12, 0], r:1, z:'wood'}, {t:'box', c:[-50, 6, 8], r:[6, 6, 6], z:'crate'}, {t:'box', c:[-48, 6, -10], r:[5, 5, 5], z:'crate'}, {t:'ell', c:[44, 6, 18], r:[5, 6, 5], z:'wood'}]);
    W3K.sign(add, 'coin', 24, 30, 18, 2);
    if (se === 'winter') for (let k = 2; k < 7; k++){ const a = Math.PI * (k + 0.5) / 9; add([{t:'box', c:[0, 27.4 + Math.sin(a) * 18.6, Math.cos(a) * 16.4], r:[31.2, 0.9, 3.4], rot:[Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 0], z:'snow'}]); }
    return {parts:P, zones:W3K.zones(se, {glyph:GC('coin'), canvas:'#e8dcc0', canvasD:'#c8b890', wheel:'#6a4a2a', crate:'#9a6a3a'}), keepZones:['canvas', 'canvasD']}; }),
  w_stake:{frame:[100, 100, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'cap', a:[0, 0, 0], p:[0, 20, 0], r:3.2, z:'wood'}, {t:'ell', c:[0, 22.4, 0], r:[2.2, 3.6, 2.2], z:'woodL'}]); if (se === 'winter') add([{t:'ell', c:[0, 25.2, 0], r:[1.8, 1.2, 1.8], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se)}; }},
  w_cross:{frame:[100, 100, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 1, 4], r:[7, 1.6, 9], z:'mound'}, {t:'box', c:[0, 12, 0], r:[1.2, 12, 1.2], z:'wood'}, {t:'box', c:[0, 17, 0], r:[6, 1.2, 1.2], z:'wood'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 2.4, 4], r:[6, 1, 8], z:'snow'}, {t:'box', c:[0, 18.6, 0], r:[6, 0.6, 1.3], z:'snow'}]);
    if (se === 'spring') add([{t:'ell', c:[3, 2.6, 8], r:[1.4, 1.4, 1.4], z:'flower'}]);
    return {parts:P, zones:W3K.zones(se, {mound:w3dZ('dirt', se)})}; }},
  w_stone:{frame:[100, 100, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    add([{t:'ell', c:[0, 1, 4], r:[8, 1.6, 10], z:'mound'}, {t:'box', c:[0, 14, 0], r:[2, 14, 2], z:'stone'}, {t:'box', c:[0, 20, 0], r:[7, 2, 2], z:'stone'}, {t:'box', c:[0, 3, 0], r:[5, 3, 4], z:'stoneD'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 2.4, 4], r:[7, 1, 9], z:'snow'}, {t:'box', c:[0, 22.6, 0], r:[7, 0.6, 2.2], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se, {mound:w3dZ('dirt', se)})}; }},
  w_gfenceH:{frame:[100, 100, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P); W3K.fence(add, -95, 95, 0, 14, se, 19); return {parts:P, zones:W3K.zones(se)}; }},
  w_gfenceV:{frame:[100, 100, 6], view:2.3, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P); W3K.fenceZ(add, -60, 60, 0, 14, se, 15); return {parts:P, zones:W3K.zones(se)}; }},
  w_rack:{frame:[100, 100, 6], view:2.0, keep:0.7, clip:'still', build:se => { const P = [], add = wAdd(P);
    for (const sx of [1, -1]) add([{t:'box', c:[sx * 72, 44, 0], r:[3.4, 44, 3.4], z:'wood'}, {t:'cap', a:[sx * 72, 70, 2], p:[sx * 60, 86, 2], r:1.2, z:'woodD'}]);
    add([{t:'box', c:[0, 88, 0], r:[78, 4.4, 4], z:'wood'}, {t:'box', c:[0, 92.6, 0], r:[78, 0.6, 4], z:'woodL'}]);
    if (se === 'winter') add([{t:'box', c:[0, 93.6, 0], r:[78, 1.2, 4.2], z:'snow'}]);
    return {parts:P, zones:W3K.zones(se)}; }}
});

/* ---------------------------------------------------------- damage --- */
function w3dDamaged(build){
  return se => {
    const o = build(se), r = rng(97 + o.parts.length), P = [], add = wAdd(P);
    let top = 0; for (const q of o.parts){ const c = q.c || q.p || q.a || [0, 0, 0]; top = Math.max(top, c[1]); }
    for (const q of o.parts){
      const c = q.c || q.p || q.a || [0, 0, 0], upper = c[1] > top * 0.55, glyphy = ['glyph', 'signF', 'signB', 'snow'].includes(q.z);
      if (upper && !glyphy && r() < 0.15) continue;
      if (!glyphy && r() < 0.22) q.z = 'char';
      P.push(q);
    }
    let W = 0; for (const q of o.parts){ const c = q.c || q.p || [0, 0, 0]; W = Math.max(W, Math.abs(c[0])); }
    W = Math.min(46, Math.max(20, W));
    for (let k = 0; k < 6; k++) add([{t:'box', c:[(r() - 0.5) * W * 1.8, 1.2, 28 + r() * 10], r:[6 + r() * 5, 1, 1.4], rot:[0, (r() - 0.5) * 1.6, (r() - 0.5) * 0.3], z:r() < 0.5 ? 'char' : 'wood'}]);
    for (let k = 0; k < 5; k++) add([{t:'ell', c:[(r() - 0.5) * W * 1.6, 2, 26 + r() * 10], r:[2.6 + r() * 2, 2, 2.4 + r() * 2], z:r() < 0.5 ? 'stoneD' : 'stone'}]);
    add([{t:'box', c:[(r() - 0.5) * W * 0.6, top * 0.62, 20], r:[10, 8, 1.6], rot:[0.3, 0.2, 0.2], z:'tarp'}, {t:'cap', a:[-6, top * 0.62 + 7, 21.6], p:[6, top * 0.62 - 7, 21.6], r:0.4, z:'rope'}]);
    o.parts = P; o.zones = Object.assign({}, o.zones, {char:'#2a2420', tarp:'#6a7a5a', rope:'#6a4a2a'});
    o.keepZones = (o.keepZones || []).concat(['char']);
    return o;
  };
}
for (const k of Object.values(W3D_FAC)) if (W3D_KINDS[k] && !W3D_KINDS[k + '_dmg']) W3D_KINDS[k + '_dmg'] = Object.assign({}, W3D_KINDS[k], {build:w3dDamaged(W3D_KINDS[k].build)});

/* ----------------------------------------------------------- hooks --- */
const wOn = (x, y, pad) => { const sx = x - CAMP.cam.x, sy = y - CAMP.cam.y; return sx > -pad && sx < VW + pad && sy > -pad && sy < VH + pad * 2; };
function w3dStake(x, y){ if (holding() !== 'fort') return false; if (!wOn(x, y, 40)) return true; return w3dDraw('w_stake', x, y + 2); }
function w3dGraveyard(hot){
  if (holding() !== 'fort') return false;
  const g = GRAVE, x0 = g.x - g.w / 2, y0 = g.y - g.h / 2, dead = META.memorial || [];
  if (!w3dRecipe('w_gfenceH', w3dSeason())) return false;
  ctx.fillStyle = hot ? 'rgba(90,80,60,.4)' : 'rgba(70,62,46,.3)'; ctx.fillRect(x0, y0, g.w, g.h);
  let ok = w3dDraw('w_gfenceH', g.x, y0 + 4);
  ok = w3dDraw('w_gfenceV', x0, g.y + 4) && ok; ok = w3dDraw('w_gfenceV', x0 + g.w, g.y + 4) && ok;
  const cols = 6;
  dead.slice(-18).forEach((d, i) => { const cx = x0 + 22 + (i % cols) * ((g.w - 44) / (cols - 1)), cy = y0 + 34 + Math.floor(i / cols) * 34;
    ok = w3dDraw(typeof d === 'object' && d.leader ? 'w_stone' : 'w_cross', cx, cy + 16) && ok; });
  ok = w3dDraw('w_gfenceH', g.x, y0 + g.h + 4) && ok;
  w3dDraw('oak', x0 + g.w + 26, y0 + 25, {t:CAMP.t});
  if (!dead.length){ ctx.fillStyle = 'rgba(240,230,210,.6)'; ctx.font = `italic ${typeof hudPx === 'function' ? hudPx(12) : 14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('No graves yet', g.x, g.y + 6); }
  if (hot) campLabel(g.x, y0 - 12, 'The Graveyard', dead.length ? `${dead.length} fallen` : 'Empty, for now');
  return ok;
}
drawGraveyard = (function(prev){ return function(hot){ if (w3dGraveyard(hot)) return; return prev(hot); }; })(drawGraveyard);
function w3dRack(x, y){ if (holding() !== 'fort') return false; return w3dDraw('w_rack', x, y + 4); }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx65')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx65"><b>3D fort, part two.</b> The rest of the Frontier Timber Fort is 3D: workshops, the Mage Tower, the Chapel and Fortress Church, the Kennels, the defences, the Graveyard, the Trophy Rack and the Quartermaster's wagon. A facility damaged in a raid looks it, charred and patched, until you repair it.</p>`);
  };
}
/* ===== END INDEX 65 ======================================================= */

