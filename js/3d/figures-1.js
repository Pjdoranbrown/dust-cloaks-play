/* js/3d/figures-1.js (INT-1 step 2, 2026-11-16): INDEX 50 to 54 (3D characters, style, armour).
   Cut unchanged from the inline script in index.html (old lines 18476 to 19863). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 50 - 3D CHARACTER PROTOTYPE (SQUAD LEADER ONLY)
   The Squad Leader is modelled in code as a 3D "recipe", rendered to sprite
   frames the first time each direction and clip is needed, and cached. Eight
   facing directions; idle, walk and melee clips (plus a short shoot clip so
   archers do not swing their bows). Everyone else is still pixel art.
   Settings has a "3D Squad Leader" switch to go back to the pixel sprite.
   Mounted, downed and bar-fight-knockout poses still use the pixel sprite.
   Nothing is saved except the setting. To roll back, delete from this comment
   to END INDEX 50.

   ===========================================================================
   3D DESIGN NOTE  (read this before extending the 3D characters)
   ===========================================================================
   OVERVIEW
     recipe  ->  r3dPose(recipe, clip, i, dir)  ->  r3dRender(...)  ->  canvas
     A RECIPE is plain data: a rig name, a skeleton (bones), a list of parts
     (primitive shapes fixed to bones) and a colour table (zones). The RENDERER
     (r3dRender) knows nothing about races, armour or monsters: it poses the
     bones with a CLIP, ray-casts every part, shades by zone, and outlines. To
     add content you add DATA to the tables or a new recipe BUILDER. Do not
     change r3dRender, r3dPrep*, r3dShade or r3dPoseBones.

   COORDINATES AND UNITS
     1 unit = R3D.SC rendered pixels (0.84, sized to stand level with the
     pixel Squad Mates) at a draw scale of R3D.K (2.7, the Squad Leader's
     field scale). y is up, the model faces +z, the character's own
     right hand is on -x and left hand on +x. Feet stand on y = 0.
     Camera: orthographic, pitched down R3D.PITCH radians. Frames are
     R3D.W x R3D.H pixels; the feet sit on row R3D.FEET, centred on column
     R3D.CX. The draw call puts the feet 7 sprite cells below the unit's
     (x, y), the same place the pixel sprites put them.

   DIRECTIONS
     dir 0..7 = screen angle dir * 45 degrees: 0 east (right), 1 south-east,
     2 south (toward the viewer), 3 south-west, 4 west, 5 north-west,
     6 north (back to the viewer), 7 north-east. r3dDirOf(angle) converts a
     game angle (Math.atan2(dy, dx), screen y down) to a dir.

   RECIPE FORMAT
     {
       rig:   'humanoid',                 // which clip set animates it (R3D_CLIPS[rig])
       skel:  {order:[names...],          // parents before children
               bones:{name:{parent:'name'|null, off:[x,y,z]}}},
                                          // off = joint position in the parent's frame
       parts: [ part, ... ],
       zones: {zoneName:'#rrggbb', ...},
       grip:  'swing'|'thrust'|'staff'|'bow'   // picks the melee variant
     }
     PART SHAPES (all coordinates in the owning bone's frame):
       {b:bone, t:'ell', c:[x,y,z], r:[rx,ry,rz], rot:[ax,ay,az]?, z:zone}
            ellipsoid; rot is radians, applied Y * X * Z
       {b:bone, t:'cap', a:[x,y,z], p:[x,y,z], r:radius, z:zone}
            capsule (a rounded rod from a to p)
       {b:bone, t:'box', c:[x,y,z], r:[hx,hy,hz], rot:[ax,ay,az]?, z:zone}
            box with half-sizes hx, hy, hz
     Keep parts few: about 30-60 per character renders a frame in ~1-3 ms.

   HUMANOID BONES (rig 'humanoid', built by r3dSkeleton)
     pelvis (root)  chest  head  upL loL hdL (left arm, hand)  upR loR hdR
     thL shL (left thigh, shin)  thR shR  cape
     Arms and legs hang along -y from their joint. Weapons in hand are built
     along the hand's +z (forward), staves along +y.

   COLOUR ZONES
     skin hair eye nose? top legs boots leather metal gold wood bone horn
     cape capeTrim robe hat hood helm shield orb glow string acc
     Zones in R3D.EMIT (orb, glow, eye on glowing races) are drawn unlit.
     Zones in R3D.METAL get a specular glint. Any new zone name works: give it
     a colour in the recipe's zones and it is shaded like cloth.

   CLIPS
     R3D_CLIPS[rig][clipName] = {n:frameCount, fn:(t, rec) => pose}
       t runs 0 .. 1 across the clip (frame i of n gets t = i / n).
       pose = {bob:yOffset, boneName:[rx, ry, rz], ...}  (radians)
       rx > 0 swings a hanging limb BACKWARD, rx < 0 FORWARD.
       rz > 0 swings it toward +x (the character's LEFT side).
     Humanoid clips: idle (4), walk (8), melee (6), shoot (4).
     Add a clip by adding a function; add its name to R3D.CLIPS_FOR[rig]
     only if it should be pre-rendered when warming up.

   HOW TO ADD A RACE
     Add an entry to RACE3D: {h:height, w:bulk, hk:head size, ears, nose,
     tusks, horns, muzzle, beard, halo, glow}. Colours still come from the
     pixel look (personLook), so skin and hair match the portraits.

   HOW TO ADD AN ARMOUR PIECE OR WEAPON
     Armour: add a branch in r3dArmourParts (weight 'light'|'medium'|'heavy'
     comes from the Quartermaster armour's mv: 0, -1, -2). Weapons: add a
     key to WEAPON3D returning parts for the hand bone (hdR, or hdL for bows),
     and a grip in WEAPON_GRIP if it should thrust or shoot.

   HOW TO ADD A MONSTER
     Write a builder that returns a recipe with its own rig name, skeleton and
     parts (for example rig 'quad' with bones body, neck, head, fl, fr, bl, br,
     tail), and add R3D_CLIPS.quad = {idle, walk, melee}. The renderer and the
     cache need no changes. Hook the drawing the same way the Leader is hooked
     (see r3dDrawUnit and the drawSprite wrapper at the end of this block).

   CACHE
     R3D.cache[recipeKey][clip][dir] = array of canvases, filled on demand.
     recipeKey is a hash of the recipe JSON, so any look change re-renders.
   ============================================================================ */
const R3D = {W:96, H:100, FEET:90, CX:48, K:2.7, SC:0.84, PITCH:0.52, cache:{}, made:0, ms:0,
  EMIT:new Set(['orb', 'glow']), METAL:new Set(['metal', 'helm', 'gold']),
  CLIPS_FOR:{humanoid:['idle', 'walk', 'melee', 'shoot']}};
const RACE3D = {
  HUMAN:{h:1, w:1, hk:1},
  SUN_ELF:{h:1.05, w:0.9, hk:0.96, ears:'elf'},
  GREY_ELF:{h:1.05, w:0.88, hk:0.96, ears:'elf'},
  DARK_ELF:{h:1.02, w:1.02, hk:0.96, ears:'elf'},
  ORC:{h:1.06, w:1.22, hk:1.02, tusks:true, ears:'small'},
  GOBLIN:{h:0.74, w:0.86, hk:1.18, ears:'big', nose:'long'},
  HOBGOBLIN:{h:1.0, w:1.02, hk:1.0, ears:'cat', muzzle:true},
  DWARF:{h:0.8, w:1.3, hk:1.14, nose:'big', beard:'long'},
  GNOME:{h:0.7, w:0.9, hk:1.2, nose:'big', ears:'small'},
  HALFLING:{h:0.72, w:0.95, hk:1.16},
  HALF_ELF:{h:1.02, w:0.95, hk:0.98, ears:'half'},
  HALF_ORC:{h:1.03, w:1.1, hk:1.0, tusks:true},
  FIRBOLG:{h:1.2, w:1.28, hk:1.0, ears:'half', nose:'big', beard:'short'},
  CAMBION:{h:1.02, w:1.0, hk:0.98, horns:true},
  NEPHILIM:{h:1.04, w:0.95, hk:0.98, halo:true},
  ZUHRI:{h:1.02, w:0.98, hk:0.98, glow:true}
};
const WEAPON_GRIP = {spear:'thrust', pike:'thrust', staff:'staff', bow:'bow', xbow:'bow'};

/* ---- small vector and matrix helpers (3 x 3 row-major) ---- */
const m3 = {
  rx:a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },
  ry:a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; },
  rz:a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
  mul:(A, B) => [A[0]*B[0]+A[1]*B[3]+A[2]*B[6], A[0]*B[1]+A[1]*B[4]+A[2]*B[7], A[0]*B[2]+A[1]*B[5]+A[2]*B[8],
                 A[3]*B[0]+A[4]*B[3]+A[5]*B[6], A[3]*B[1]+A[4]*B[4]+A[5]*B[7], A[3]*B[2]+A[4]*B[5]+A[5]*B[8],
                 A[6]*B[0]+A[7]*B[3]+A[8]*B[6], A[6]*B[1]+A[7]*B[4]+A[8]*B[7], A[6]*B[2]+A[7]*B[5]+A[8]*B[8]],
  v:(M, p) => [M[0]*p[0]+M[1]*p[1]+M[2]*p[2], M[3]*p[0]+M[4]*p[1]+M[5]*p[2], M[6]*p[0]+M[7]*p[1]+M[8]*p[2]],
  tv:(M, p) => [M[0]*p[0]+M[3]*p[1]+M[6]*p[2], M[1]*p[0]+M[4]*p[1]+M[7]*p[2], M[2]*p[0]+M[5]*p[1]+M[8]*p[2]],
  eul:e => e ? m3.mul(m3.ry(e[1] || 0), m3.mul(m3.rx(e[0] || 0), m3.rz(e[2] || 0))) : [1, 0, 0, 0, 1, 0, 0, 0, 1]
};
const hex3 = h => { const n = parseInt(String(h || '#888888').slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const r3dDirOf = a => ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;

/* ---- the skeleton ---- */
function r3dSkeleton(R, fem){
  const s = R.h, w = R.w * (fem ? 0.9 : 1), thigh = 17 * s, shin = 16 * s, hip = thigh + shin + 3 * s, torso = 19 * s;   /* Index 53: about 7.5 heads tall */
  const bones = {
    pelvis:{parent:null, off:[0, hip, 0]},
    chest:{parent:'pelvis', off:[0, 2 * s, 0]},
    head:{parent:'chest', off:[0, torso + 2.3 * s, 0.4]},
    upL:{parent:'chest', off:[9.6 * w, torso - 2.5 * s, 0]}, loL:{parent:'upL', off:[0, -13 * s, 0]}, hdL:{parent:'loL', off:[0, -11.5 * s, 0]},
    upR:{parent:'chest', off:[-9.6 * w, torso - 2.5 * s, 0]}, loR:{parent:'upR', off:[0, -13 * s, 0]}, hdR:{parent:'loR', off:[0, -11.5 * s, 0]},
    thL:{parent:'pelvis', off:[4.4 * w, -1 * s, 0]}, shL:{parent:'thL', off:[0, -thigh, 0]},
    thR:{parent:'pelvis', off:[-4.4 * w, -1 * s, 0]}, shR:{parent:'thR', off:[0, -thigh, 0]},
    cape:{parent:'chest', off:[0, torso - 1.2 * s, -6.6 * w]}, cape2:{parent:'cape', off:[0, -12 * s, 0]}, cape3:{parent:'cape2', off:[0, -12 * s, 0]}   /* Index 53 */
  };
  return {order:['pelvis', 'chest', 'head', 'upL', 'loL', 'hdL', 'upR', 'loR', 'hdR', 'thL', 'shL', 'thR', 'shR', 'cape', 'cape2', 'cape3'], bones,
    dims:{s, w, thigh, shin, torso, hk:0.71 * R.hk * Math.max(0.85, s * 0.92 + 0.08)}};   /* Index 53: smaller heads again */
}

/* ---- weapons, built in the hand's frame ---- */
const WEAPON3D = {
  sword:   () => [{t:'box', c:[0, 0, 11], r:[0.6, 1.3, 8], z:'metal'}, {t:'box', c:[0, 0, 2.6], r:[0.9, 3.2, 0.8], z:'gold'}, {t:'ell', c:[0, 0, -2.4], r:[1.2, 1.2, 1.2], z:'gold'}],
  greatsword:() => [{t:'box', c:[0, 0, 15], r:[0.7, 1.6, 12], z:'metal'}, {t:'box', c:[0, 0, 2.8], r:[1, 4, 0.9], z:'gold'}, {t:'cap', a:[0, 0, -1], p:[0, 0, -5], r:1, z:'leather'}],
  spear:   () => [{t:'cap', a:[0, 0, -10], p:[0, 0, 24], r:0.85, z:'wood'}, {t:'ell', c:[0, 0, 26.5], r:[0.6, 1.5, 3.4], z:'metal'}],
  pike:    () => [{t:'cap', a:[0, 0, -12], p:[0, 0, 32], r:0.85, z:'wood'}, {t:'ell', c:[0, 0, 34.5], r:[0.6, 1.4, 3.2], z:'metal'}],
  dagger:  () => [{t:'box', c:[0, 0, 5.2], r:[0.45, 1, 3.6], z:'metal'}, {t:'box', c:[0, 0, 1.4], r:[0.7, 2, 0.6], z:'gold'}],
  mace:    () => [{t:'cap', a:[0, 0, -2], p:[0, 0, 10], r:0.9, z:'wood'}, {t:'ell', c:[0, 0, 11.5], r:[2.6, 2.6, 2.6], z:'metal'}, {t:'ell', c:[0, 0, 11.5], r:[3.4, 0.7, 1.6], z:'metal'}],
  club:    () => [{t:'cap', a:[0, 0, -2], p:[0, 0, 9], r:1, z:'wood'}, {t:'ell', c:[0, 0, 10.5], r:[2.2, 2.2, 3.4], z:'wood'}],
  staff:   () => [{t:'cap', a:[0, -15, 0], p:[0, 22, 0], r:1, z:'wood'}, {t:'ell', c:[0, 24.2, 0], r:[2.4, 2.4, 2.4], z:'orb'}, {t:'ell', c:[0, 22, 0], r:[1.6, 1, 1.6], z:'gold'}],
  bow:     () => { const pts = [[0, -14, -0.5], [0, -8, 2.4], [0, 0, 3.3], [0, 8, 2.4], [0, 14, -0.5]], out = [];
                   for (let i = 0; i < 4; i++) out.push({t:'cap', a:pts[i], p:pts[i + 1], r:0.75, z:'wood'});
                   out.push({t:'cap', a:[0, -14, -0.6], p:[0, 14, -0.6], r:0.22, z:'string'}); return out; },
  xbow:    () => [{t:'box', c:[0, 0, 6], r:[1, 1, 7], z:'wood'}, {t:'box', c:[0, 0, 11], r:[7, 0.6, 0.8], z:'metal'}]
};

/* ---- armour by weight ---- */
function r3dArmourParts(weight, D, robe){
  const s = D.s, w = D.w, P = [];
  if (weight === 'light') return P;
  if (!robe) P.push({b:'chest', t:'ell', c:[0, 12.5 * s, 0.4], r:[10.4 * w, 8.6 * s, 7.2 * w], z:'top'});
  const pr = weight === 'heavy' ? [5.2 * w, 4.2, 5.4] : [4.2 * w, 3.3, 4.6];
  P.push({b:'upL', t:'ell', c:[0.8, -0.5, 0], r:pr, z:weight === 'heavy' ? 'metal' : 'top'}, {b:'upR', t:'ell', c:[-0.8, -0.5, 0], r:pr, z:weight === 'heavy' ? 'metal' : 'top'});
  if (weight === 'heavy'){
    P.push({b:'shL', t:'cap', a:[0, -1.5, 0.6], p:[0, -12.5 * s, 0.6], r:3 * w, z:'metal'}, {b:'shR', t:'cap', a:[0, -1.5, 0.6], p:[0, -12.5 * s, 0.6], r:3 * w, z:'metal'});
    if (!robe) P.push({b:'pelvis', t:'ell', c:[0, -2.5 * s, 0.3], r:[9.6 * w, 5 * s, 7 * w], z:'metal'});
  }
  return P;
}

/* ---- a recipe for a member of the Chapter ---- */
function r3dRecipeFor(p, isLeader){
  const look = personLook(p, isLeader), R = RACE3D[p.race] || RACE3D.HUMAN, fem = sexOf(p) === 'f';
  const sk = r3dSkeleton(R, fem), D = sk.dims, s = D.s, w = D.w, hk = D.hk, P = [];
  const add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  let weight = 'light';
  try { const a = gear(gearLook().armour); weight = a.mv <= -2 ? 'heavy' : a.mv <= -1 ? 'medium' : 'light'; } catch (e) {}
  if (p.spec === 'SOLDIER' && weight === 'light') weight = 'medium';
  const robe = !!look.robe, lower = robe ? 'robe' : 'legs';
  // body
  add('pelvis', [{t:'ell', c:[0, 0, 0], r:[8.1 * w, 5.4 * s, 5.8 * w], z:lower}]);
  add('chest', [{t:'ell', c:[0, 4.5 * s, 0.4], r:[7.5 * w, 6.4 * s, 5.5 * w], z:robe ? 'robe' : 'top'},
                {t:'ell', c:[0, 12.5 * s, 0], r:[(fem ? 8.5 : 9.4) * w, 8.2 * s, 6.1 * w], z:robe ? 'robe' : 'top'},
                {t:'box', c:[0, 0.6 * s, 0.6], r:[8.8 * w, 1.1 * s, 6.3 * w], z:'leather'},
                {t:'cap', a:[0, 18 * s, 0.2], p:[0, 21.8 * s, 0.4], r:2.3 * hk, z:'skin'}]);
  if (fem && !robe) add('chest', [{t:'ell', c:[0, 12.5 * s, 4.2 * w], r:[6.6 * w, 3.6 * s, 2.8 * w], z:'top'}]);
  if (robe) add('pelvis', [{t:'ell', c:[0, -14 * s, 0.4], r:[9.6 * w, 15.5 * s, 7.6 * w], z:'robe'}, {t:'box', c:[0, -0.4 * s, 6.4 * w], r:[1.2, 4 * s, 0.6], z:'acc'}]);
  // arms
  for (const [u, l, h, sx] of [['upL', 'loL', 'hdL', 1], ['upR', 'loR', 'hdR', -1]]){
    add(u, [{t:'cap', a:[0, 0, 0], p:[0, -12 * s, 0], r:2.7 * w, z:robe ? 'robe' : 'top'}]);
    add(l, [{t:'cap', a:[0, 0, 0], p:[0, -10.5 * s, 0], r:2.25 * w, z:robe ? 'robe' : weight === 'heavy' ? 'metal' : 'top'}]);
    add(h, [{t:'ell', c:[0, 0.5, 0.5], r:[2 * w, 2.2, 2], z:weight === 'heavy' ? 'metal' : 'skin'}]);
  }
  // legs
  for (const [t, sh] of [['thL', 'shL'], ['thR', 'shR']]){
    add(t, [{t:'cap', a:[0, 0, 0], p:[0, -15 * s, 0], r:3.2 * w, z:'legs'}]);
    add(sh, [{t:'cap', a:[0, 0, 0], p:[0, -13.5 * s, 0.2], r:2.6 * w, z:'legs'}, {t:'ell', c:[0, -14.8 * s, 1.6], r:[2.8 * w, 2.5 * s, 4.6 * s], z:'boots'}]);
  }
  P.push(...r3dArmourParts(weight, D, robe));
  // head
  const H = [], hy = 6.2 * hk;
  H.push({t:'ell', c:[0, hy, 0], r:[6 * hk, 6.6 * hk, 6.1 * hk], z:'skin'});
  for (const sx of [1, -1]) H.push({t:'ell', c:[sx * 2.3 * hk, hy + 0.4 * hk, 5.35 * hk], r:[1.05, 1.2, 0.8], z:'eye'}, {t:'box', c:[sx * 2.4 * hk, hy + 2.2 * hk, 5.5 * hk], r:[1.5, 0.45, 0.5], rot:[0, 0, sx * 0.15], z:'hair'});
  H.push(R.nose === 'big' ? {t:'ell', c:[0, hy - 1.2 * hk, 6.2 * hk], r:[1.9, 2.1, 2]} : R.nose === 'long' ? {t:'ell', c:[0, hy - 0.6 * hk, 6.8 * hk], r:[1, 1.2, 2.6]} : {t:'ell', c:[0, hy - 0.8 * hk, 6 * hk], r:[1, 1.4, 1.2]});
  H[H.length - 1].z = 'skin';
  if (R.muzzle) H.push({t:'ell', c:[0, hy - 1.8 * hk, 5 * hk], r:[3.4 * hk, 2.6 * hk, 2.6 * hk], z:'skin'});
  const ear = R.ears || 'human';
  for (const sx of [1, -1]){
    if (ear === 'elf') H.push({t:'ell', c:[sx * 6.3 * hk, hy + 1.6 * hk, -1.2 * hk], r:[0.8, 1.3, 3.8 * hk], rot:[-0.7, 0, 0], z:'skin'});
    else if (ear === 'half') H.push({t:'ell', c:[sx * 6.2 * hk, hy + 1 * hk, -0.6 * hk], r:[0.8, 1.4, 2.4 * hk], rot:[-0.5, 0, 0], z:'skin'});
    else if (ear === 'big') H.push({t:'ell', c:[sx * 8 * hk, hy + 1.2 * hk, 0], r:[4.6 * hk, 1.7, 0.9], rot:[0, 0, sx * 0.35], z:'skin'});
    else if (ear === 'cat') H.push({t:'ell', c:[sx * 3.9 * hk, hy + 6.2 * hk, -0.4], r:[1.9, 3.2, 1.1], rot:[0, 0, -sx * 0.25], z:'skin'});
    else if (ear === 'small') H.push({t:'ell', c:[sx * 6.1 * hk, hy, 0], r:[0.9, 1.3, 1.2], z:'skin'});
    else H.push({t:'ell', c:[sx * 6 * hk, hy, 0], r:[0.9, 1.6, 1.2], z:'skin'});
    if (R.tusks) H.push({t:'ell', c:[sx * 2 * hk, hy - 3.2 * hk, 5.3 * hk], r:[0.75, 1.6, 0.75], rot:[-0.25, 0, 0], z:'bone'});
    if (R.horns) H.push({t:'cap', a:[sx * 3.4 * hk, hy + 5 * hk, 1], p:[sx * 5.6 * hk, hy + 8.6 * hk, -2], r:1.4, z:'horn'},
                        {t:'cap', a:[sx * 5.6 * hk, hy + 8.6 * hk, -2], p:[sx * 6.2 * hk, hy + 9.6 * hk, -4.8], r:0.9, z:'horn'});
  }
  // hair
  const hs = look.hairStyle;
  if (!(hs === 'bald' && !look.head)) H.push({t:'ell', c:[0, hy + 1.5 * hk, -1.3 * hk], r:[6.4 * hk, 6.2 * hk, 6.4 * hk], z:'hair'});
  if (hs === 'long' || (fem && hs !== 'bun' && hs !== 'braids' && hs !== 'ponytail')) H.push({t:'ell', c:[0, hy - 3.5 * hk, -4.2 * hk], r:[5.6 * hk, 7.5 * hk, 2.8 * hk], z:'hair'});
  if (hs === 'ponytail') H.push({t:'cap', a:[0, hy + 2 * hk, -6 * hk], p:[0, hy - 7 * hk, -7.4 * hk], r:1.9 * hk, z:'hair'});
  if (hs === 'bun') H.push({t:'ell', c:[0, hy + 4 * hk, -6 * hk], r:[2.6 * hk, 2.6 * hk, 2.4 * hk], z:'hair'});
  if (hs === 'topknot') H.push({t:'ell', c:[0, hy + 7 * hk, -1.5 * hk], r:[2 * hk, 2.4 * hk, 2 * hk], z:'hair'});
  if (hs === 'braids') for (const sx of [1, -1]) H.push({t:'cap', a:[sx * 4.6 * hk, hy - 1 * hk, 2 * hk], p:[sx * 4.4 * hk, hy - 11 * hk, 3.4 * hk], r:1.5 * hk, z:'hair'});
  if (look.beard && !fem){
    if (R.beard === 'long') H.push({t:'ell', c:[0, hy - 5.2 * hk, 4 * hk], r:[5.6 * hk, 6.6 * hk, 3.6 * hk], z:'hair'});
    else H.push({t:'ell', c:[0, hy - 3.4 * hk, 4.2 * hk], r:[4.8 * hk, 4.2 * hk, 3 * hk], z:'hair'});
  }
  if (R.halo) H.push({t:'ell', c:[0, hy + 10.5 * hk, -1], r:[4.6 * hk, 0.55, 4.6 * hk], z:'glow'});
  // headgear
  const hd = look.head, top = hy + 6.6 * hk;
  if (hd === 'helmet') H.push({t:'ell', c:[0, hy + 2.6 * hk, -0.3], r:[6.9 * hk, 4.8 * hk, 6.9 * hk], z:'helm'}, {t:'box', c:[0, hy + 0.6 * hk, 6.7 * hk], r:[0.6, 2.4 * hk, 0.5], z:'helm'}, {t:'box', c:[0, hy + 7 * hk, -0.3], r:[0.9, 1.1, 5.6 * hk], z:'acc'});
  else if (hd === 'hood') H.push({t:'ell', c:[0, hy + 1.2 * hk, -2.6 * hk], r:[7.3 * hk, 7.6 * hk, 7.2 * hk], z:'hood'}, {t:'ell', c:[0, hy - 5 * hk, -1.8 * hk], r:[8.4 * hk, 3.2 * hk, 6.6 * hk], z:'hood'});
  else if (hd === 'circlet') H.push({t:'box', c:[0, hy + 3.2 * hk, 5.5 * hk], r:[3.6 * hk, 0.55, 0.6], z:'gold'}, {t:'ell', c:[0, hy + 3.4 * hk, 6.1 * hk], r:[0.9, 0.9, 0.6], z:'orb'});
  else if (hd === 'wizard' || hd === 'witch'){
    const wb = hd === 'witch' ? 10 : 8.4;
    H.push({t:'ell', c:[0, top - 1.2, -0.4], r:[wb * hk, 1, wb * hk], z:'hat'}, {t:'ell', c:[0, top + 1.8, -0.8], r:[5 * hk, 3.4, 5 * hk], z:'hat'},
           {t:'ell', c:[0, top + 5.4, -1.8], r:[3.4 * hk, 3, 3.4 * hk], z:'hat'}, {t:'ell', c:[0, top + 8.4, -3.2], r:[2 * hk, 2.6, 2 * hk], z:'hat'},
           {t:'ell', c:[0, top + 10.4, hd === 'witch' ? -6 : -4.6], r:[1.1, 1.8, 1.1], z:'hat'}, {t:'box', c:[0, top + 0.4, 0], r:[5.1 * hk, 0.6, 5.1 * hk], z:'acc'});
  }
  add('head', H);
  // cape
  if (look.cape) P.push(...r3dCapeParts(D));   /* Index 53 */
  // weapon, shield, quiver
  const wk = WEAPON3D[look.weapon] ? look.weapon : 'sword', grip = WEAPON_GRIP[wk] || 'swing';
  add(grip === 'bow' ? 'hdL' : 'hdR', WEAPON3D[wk]());
  if (grip === 'bow') add('cape', [{t:'cap', a:[-4 * w, -2, 1.2], p:[3 * w, -16 * s, 1.2], r:2, z:'leather'}, {t:'ell', c:[-4.2 * w, 0, 1.4], r:[1.6, 2.2, 1.6], z:'wood'}]);
  if (look.shield){
    const big = look.shield === 'big';
    add('loL', big ? [{t:'box', c:[3.4 * w, -6 * s, 1], r:[0.9, 8.5 * s, 6.2], z:'shield'}, {t:'ell', c:[4.3 * w, -6 * s, 1], r:[0.9, 1.6, 1.6], z:'metal'}]
                   : [{t:'ell', c:[3.4 * w, -6 * s, 1], r:[0.9, 6.4, 6.4], z:'shield'}, {t:'ell', c:[4.4 * w, -6 * s, 1], r:[0.9, 1.7, 1.7], z:'metal'}]);
  }
  const zones = {skin:look.skin, hair:look.hair || '#3a2a1a', eye:R.glow ? '#cfeeff' : '#1a1410', top:look.top || '#8a6a4a', legs:look.legs || '#4a3a2a',
    boots:'#3a2616', leather:'#5a3a22', metal:'#a8b0b8', gold:'#d4af37', wood:'#7a4e2a', bone:'#ece4cf', horn:'#2a2024', glow:'#ffe9a0',
    cape:look.cape || '#2e4a6a', capeTrim:look.capeTrim || look.cape || '#d4af37', robe:look.robeCol || look.top || '#5a4a6a', hat:look.hat || '#33508f',
    hood:look.hood || '#3a3a44', helm:look.helm || '#a8b0b8', shield:look.shieldCol || '#7a3e26', orb:look.orb || '#9fe0ff', string:'#e8e0cc', acc:look.acc || '#7a3e26'};
  if (R.glow) zones.glow = '#bfe6ff';
  const rec = {rig:'humanoid', skel:{order:sk.order, bones:sk.bones}, parts:P, zones, grip};
  rec.key = 'r3d' + hash(JSON.stringify(rec));
  return rec;
}

/* ---- clips (humanoid) ---- */
const lerp3 = (a, b, k) => a + (b - a) * k;
function keyed(keys, t){   // keys: array of poses evenly spaced over 0..1, wrapping
  const n = keys.length, f = t * n, i = Math.floor(f) % n, j = (i + 1) % n, k = f - Math.floor(f), out = {};
  const A = keys[i], B = keys[j];
  for (const name of new Set(Object.keys(A).concat(Object.keys(B)))){
    const a = A[name], b = B[name];
    if (typeof a === 'number' || typeof b === 'number') out[name] = lerp3(a || 0, b || 0, k);
    else { const x = a || [0, 0, 0], y = b || [0, 0, 0]; out[name] = [lerp3(x[0], y[0], k), lerp3(x[1] || 0, y[1] || 0, k), lerp3(x[2] || 0, y[2] || 0, k)]; }
  }
  return out;
}
const ARMS_REST = rec => rec.grip === 'bow' ? {upL:[-0.25, 0, 0.12], loL:[-0.35, 0, 0], upR:[0.05, 0, -0.14], loR:[-0.2, 0, 0]}
  : rec.grip === 'staff' ? {upL:[0.05, 0, 0.14], loL:[-0.2, 0, 0], upR:[-0.25, 0, -0.1], loR:[-0.9, 0, 0], hdR:[1.15, 0, 0]}
  : {upL:[-0.15, 0, 0.16], loL:[-0.55, 0, 0], upR:[-0.2, 0, -0.14], loR:[-0.7, 0, 0]};
const R3D_CLIPS = {humanoid:{
  idle:{n:4, fn:(t, rec) => { const b = Math.sin(t * Math.PI * 2), A = ARMS_REST(rec);
    return Object.assign({bob:b * 0.5, chest:[0.03 * b, 0, 0], head:[-0.02 * b, 0, 0], cape:[0.12 + 0.03 * b, 0, 0], thL:[0, 0, 0.03], thR:[0, 0, -0.03]}, A); }},
  walk:{n:8, fn:(t, rec) => { const ph = t * Math.PI * 2, sn = Math.sin(ph), A = ARMS_REST(rec), wk = rec.grip === 'staff' ? 0.15 : 0.32;
    return {bob:1.3 * Math.abs(Math.cos(ph)) - 0.6, pelvis:[0, -0.08 * sn, 0], chest:[-0.05, 0.12 * sn, 0], head:[0.04, -0.1 * sn, 0],
      thL:[-0.55 * sn, 0, 0.02], thR:[0.55 * sn, 0, -0.02], shL:[0.12 + 0.75 * Math.max(0, Math.cos(ph + 0.4)), 0, 0], shR:[0.12 + 0.75 * Math.max(0, -Math.cos(ph + 0.4)), 0, 0],
      upL:[A.upL[0] + 0.45 * sn, 0, A.upL[2]], loL:A.loL, upR:[A.upR[0] - wk * sn, 0, A.upR[2]], loR:A.loR, hdR:A.hdR || [0, 0, 0], hdL:A.hdL || [0, 0, 0], cape:[0.32 + 0.1 * Math.abs(sn), 0, 0]}; }},
  melee:{n:6, fn:(t, rec) => {
    const legs = {thL:[-0.4, 0, 0.04], shL:[0.25, 0, 0], thR:[0.32, 0, -0.04], shR:[0.18, 0, 0], bob:-1};
    const shieldUp = {upL:[-0.9, 0, 0.25], loL:[-0.9, 0, 0]};
    const K = rec.grip === 'thrust' ? [
        {upR:[-0.35, 0, -0.2], loR:[-1.2, 0, 0], chest:[0, 0, 0], cape:[0.2, 0, 0]},
        {upR:[0.25, 0, -0.25], loR:[-1.8, 0, 0], chest:[0.08, 0.35, 0], cape:[0.18, 0, 0]},
        {upR:[-0.9, 0, -0.1], loR:[-0.9, 0, 0], chest:[-0.1, 0.05, 0], cape:[0.3, 0, 0]},
        {upR:[-1.45, 0, 0], loR:[-0.1, 0, 0], chest:[-0.22, -0.32, 0], cape:[0.42, 0, 0]},
        {upR:[-1.4, 0, 0], loR:[-0.15, 0, 0], chest:[-0.2, -0.3, 0], cape:[0.38, 0, 0]},
        {upR:[-0.7, 0, -0.15], loR:[-0.8, 0, 0], chest:[-0.05, -0.05, 0], cape:[0.25, 0, 0]}]
      : [
        {upR:[-0.5, 0, -0.2], loR:[-0.7, 0, 0], chest:[0, 0, 0], cape:[0.2, 0, 0]},
        {upR:[-2.7, 0, -0.35], loR:[-0.9, 0, 0], chest:[0.12, 0.38, 0], cape:[0.15, 0, 0]},
        {upR:[-2.1, 0, -0.2], loR:[-0.3, 0, 0], chest:[0, 0.1, 0], cape:[0.25, 0, 0]},
        {upR:[-0.9, 0, 0], loR:[-0.05, 0, 0], chest:[-0.25, -0.3, 0], cape:[0.45, 0, 0]},
        {upR:[-0.1, 0, 0.1], loR:[-0.15, 0, 0], chest:[-0.28, -0.42, 0], cape:[0.4, 0, 0]},
        {upR:[-0.4, 0, -0.15], loR:[-0.6, 0, 0], chest:[-0.08, -0.1, 0], cape:[0.25, 0, 0]}];
    if (rec.grip === 'thrust') for (const k of K) k.hdR = [-(k.upR[0] + k.loR[0]) - 0.15, 0, 0];   // keep the spear level and pointing forward
    const p = Object.assign(rec.grip === 'staff' ? {hdR:[1.0, 0, 0]} : {}, legs, rec.zones && rec.parts.some(q => q.z === 'shield') ? shieldUp : {upL:[-0.25, 0, 0.3], loL:[-0.8, 0, 0]}, K[Math.min(5, Math.floor(t * 6))]);
    return p; }},
  shoot:{n:4, fn:(t, rec) => {
    const K = rec.grip === 'bow' ? [
        {upL:[-1.45, 0, 0.05], loL:[0, 0, 0], hdL:[1.45, 0, 0], upR:[-1.2, 0, -0.1], loR:[-1.2, 0, 0]},
        {upL:[-1.5, 0, 0.05], loL:[0, 0, 0], hdL:[1.5, 0, 0], upR:[-1.45, 0, -0.15], loR:[-2.5, 0, 0], chest:[0, 0.25, 0]},
        {upL:[-1.5, 0, 0.05], loL:[0, 0, 0], hdL:[1.5, 0, 0], upR:[-1.45, 0, -0.15], loR:[-2.55, 0, 0], chest:[0, 0.28, 0]},
        {upL:[-1.45, 0, 0.05], loL:[0, 0, 0], hdL:[1.45, 0, 0], upR:[-1.1, 0, -0.55], loR:[-1.4, 0, 0], chest:[0, 0.15, 0]}]
      : [{upR:[-1.3, 0, 0], loR:[-0.4, 0, 0]}, {upR:[-1.6, 0, 0], loR:[-0.1, 0, 0], chest:[-0.1, -0.2, 0]}, {upR:[-1.6, 0, 0], loR:[-0.1, 0, 0], chest:[-0.1, -0.2, 0]}, {upR:[-0.9, 0, 0], loR:[-0.6, 0, 0]}];
    return Object.assign({thL:[-0.2, 0, 0.06], thR:[0.2, 0, -0.06], shL:[0.1, 0, 0], shR:[0.15, 0, 0], cape:[0.15, 0, 0]}, ARMS_REST(rec), K[Math.min(3, Math.floor(t * 4))]); }}
}};

/* ---- the renderer (do not change; extend with data) ---- */
function r3dPoseBones(rec, pose, yaw){
  const S = rec.skel, out = {};
  for (const name of S.order){
    const b = S.bones[name], R = m3.eul(pose[name]);
    if (!b.parent) out[name] = {P:[b.off[0], b.off[1] + (pose.bob || 0), b.off[2]], M:m3.mul(m3.ry(yaw), R)};
    else { const pa = out[b.parent], o = m3.v(pa.M, b.off); out[name] = {P:[pa.P[0] + o[0], pa.P[1] + o[1], pa.P[2] + o[2]], M:m3.mul(pa.M, R)}; }
  }
  return out;
}
const R3D_T = 400;
// r3dPrep* turn one posed part into a fast pixel test: test(px, py) -> t (or -1), normal() -> [nx, ny, nz] of the last hit.
// The ray for pixel (px, py) is ro + t * rd, rd = -v; ro is affine in px and py, so everything per pixel is a few multiplies.
function r3dRayBasis(){
  const ct = Math.cos(R3D.PITCH), st = Math.sin(R3D.PITCH);
  // ro(px, py) = O + px * EX + py * EY
  const k = 1 / R3D.SC, X0 = (0.5 - R3D.CX) * k, Y0 = (0.5 - R3D.FEET) * k;
  return {ct, st, v:[0, st, ct], O:[X0, -Y0 * ct + R3D_T * st, Y0 * st + R3D_T * ct], EX:[k, 0, 0], EY:[0, -ct * k, st * k]};
}
function r3dPrepEll(q, RB){
  const Mt = v3 => m3.tv(q.M, v3), r = q.r;
  const o0 = Mt([RB.O[0] - q.c[0], RB.O[1] - q.c[1], RB.O[2] - q.c[2]]), gx = Mt(RB.EX), gy = Mt(RB.EY), d = Mt([-RB.v[0], -RB.v[1], -RB.v[2]]);
  const b0 = o0[0] / r[0], b1 = o0[1] / r[1], b2 = o0[2] / r[2], x0 = gx[0] / r[0], x1 = gx[1] / r[1], x2 = gx[2] / r[2], y0 = gy[0] / r[0], y1 = gy[1] / r[1], y2 = gy[2] / r[2];
  const dx = d[0] / r[0], dy = d[1] / r[1], dz = d[2] / r[2], A = dx * dx + dy * dy + dz * dz;
  let hx = 0, hy = 0, hz = 0;
  return {test(px, py){
      const ox = b0 + px * x0 + py * y0, oy = b1 + px * x1 + py * y1, oz = b2 + px * x2 + py * y2;
      const B = ox * dx + oy * dy + oz * dz, C = ox * ox + oy * oy + oz * oz - 1, disc = B * B - A * C;
      if (disc < 0) return -1;
      const t = (-B - Math.sqrt(disc)) / A; if (t <= 0) return -1;
      hx = ox + t * dx; hy = oy + t * dy; hz = oz + t * dz; return t; },
    normal(){ const n = m3.v(q.M, [hx / r[0], hy / r[1], hz / r[2]]), l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; }};
}
function r3dPrepBox(q, RB){
  const Mt = v3 => m3.tv(q.M, v3), r = q.r;
  const o0 = Mt([RB.O[0] - q.c[0], RB.O[1] - q.c[1], RB.O[2] - q.c[2]]), gx = Mt(RB.EX), gy = Mt(RB.EY), d = Mt([-RB.v[0], -RB.v[1], -RB.v[2]]);
  const inv = d.map(x => Math.abs(x) < 1e-9 ? 0 : 1 / x);
  let ax = 0, sg = 1;
  return {test(px, py){
      let tn = -1e9, tf = 1e9;
      for (let k = 0; k < 3; k++){
        const o = o0[k] + px * gx[k] + py * gy[k];
        if (!inv[k]){ if (o > r[k] || o < -r[k]) return -1; continue; }
        let t1 = (-r[k] - o) * inv[k], t2 = (r[k] - o) * inv[k], s = -1;
        if (t1 > t2){ const tt = t1; t1 = t2; t2 = tt; s = 1; }
        if (t1 > tn){ tn = t1; ax = k; sg = s; }
        if (t2 < tf) tf = t2;
        if (tn > tf) return -1;
      }
      return tn > 0 ? tn : -1; },
    normal(){ const nl = [0, 0, 0]; nl[ax] = sg; return m3.v(q.M, nl); }};
}
function r3dPrepCap(q, RB){
  const rd = [-RB.v[0], -RB.v[1], -RB.v[2]], ba = [q.b[0] - q.a[0], q.b[1] - q.a[1], q.b[2] - q.a[2]], rr = q.r * q.r;
  const dot = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const baba = dot(ba, ba), bard = dot(ba, rd), A = baba - bard * bard;
  const oa0 = [RB.O[0] - q.a[0], RB.O[1] - q.a[1], RB.O[2] - q.a[2]], ob0 = [RB.O[0] - q.b[0], RB.O[1] - q.b[1], RB.O[2] - q.b[2]];
  let px_ = 0, py_ = 0, tt_ = 0;
  const ray = (px, py) => [RB.O[0] + px * RB.EX[0] + py * RB.EY[0], RB.O[1] + px * RB.EX[1] + py * RB.EY[1], RB.O[2] + px * RB.EX[2] + py * RB.EY[2]];
  return {test(px, py){
      const ex = px * RB.EX[0] + py * RB.EY[0], ey = px * RB.EX[1] + py * RB.EY[1], ez = px * RB.EX[2] + py * RB.EY[2];
      const oax = oa0[0] + ex, oay = oa0[1] + ey, oaz = oa0[2] + ez;
      const baoa = ba[0] * oax + ba[1] * oay + ba[2] * oaz, rdoa = rd[0] * oax + rd[1] * oay + rd[2] * oaz, oaoa = oax * oax + oay * oay + oaz * oaz;
      let t = -1;
      if (A > 1e-6){
        const B = baba * rdoa - baoa * bard, C = baba * oaoa - baoa * baoa - rr * baba, h = B * B - A * C;
        if (h < 0) return -1;
        const t1 = (-B - Math.sqrt(h)) / A, y = baoa + t1 * bard;
        if (y > 0 && y < baba) t = t1;
      }
      if (t < 0){
        const Bq = rdoa, Cq = oaoa - rr, h1 = Bq * Bq - Cq;
        if (h1 > 0){ const t1 = -Bq - Math.sqrt(h1); if (t1 > 0) t = t1; }
        const obx = ob0[0] + ex, oby = ob0[1] + ey, obz = ob0[2] + ez, Bb = rd[0] * obx + rd[1] * oby + rd[2] * obz, h2 = Bb * Bb - (obx * obx + oby * oby + obz * obz - rr);
        if (h2 > 0){ const t2 = -Bb - Math.sqrt(h2); if (t2 > 0 && (t < 0 || t2 < t)) t = t2; }
      }
      if (t <= 0) return -1;
      px_ = px; py_ = py; tt_ = t; return t; },
    normal(){
      const ro = ray(px_, py_), p = [ro[0] + tt_ * rd[0], ro[1] + tt_ * rd[1], ro[2] + tt_ * rd[2]], pa = [p[0] - q.a[0], p[1] - q.a[1], p[2] - q.a[2]];
      const k = Math.max(0, Math.min(1, dot(pa, ba) / (baba || 1))), n = [pa[0] - k * ba[0], pa[1] - k * ba[1], pa[2] - k * ba[2]], l = Math.hypot(n[0], n[1], n[2]) || 1;
      return [n[0] / l, n[1] / l, n[2] / l]; }};
}
/* ---- Index 98 (Fable job 5, audits/fable/models.md): three more shapes for recipes ----
   {t:'cone', a, p, r, r2}  rounded cone from a (radius r) to p (radius r2): tapered limbs, horns, tusks, hats, tails
   {t:'cyl',  a, p, r}      flat-ended cylinder: buckets, plates, wheel hubs, boots, pauldron rims
   {t:'ring', c, R, Rz?, r, rot?, n?, z}  a torus of radius R and tube r in the bone frame, built from n capsules (default 10): belts, collars, crowns, rims
   All three take a zone like any part. A ring is expanded to capsules at render time (r3dExpandParts). */
function r3dPrepCone(q, RB){
  const rd = [-RB.v[0], -RB.v[1], -RB.v[2]], ba = [q.b[0] - q.a[0], q.b[1] - q.a[1], q.b[2] - q.a[2]], ra = q.r, rb = q.r2, rr = ra - rb;
  const dot = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const m0 = dot(ba, ba), m2 = dot(ba, rd), d2 = m0 - rr * rr, k2 = d2 - m2 * m2;
  const oa0 = [RB.O[0] - q.a[0], RB.O[1] - q.a[1], RB.O[2] - q.a[2]], ob0 = [RB.O[0] - q.b[0], RB.O[1] - q.b[1], RB.O[2] - q.b[2]];
  let nx = 0, ny = 0, nz = 1;
  return {test(px, py){
      const ex = px * RB.EX[0] + py * RB.EY[0], ey = px * RB.EX[1] + py * RB.EY[1], ez = px * RB.EX[2] + py * RB.EY[2];
      const oax = oa0[0] + ex, oay = oa0[1] + ey, oaz = oa0[2] + ez, obx = ob0[0] + ex, oby = ob0[1] + ey, obz = ob0[2] + ez;
      const m1 = ba[0] * oax + ba[1] * oay + ba[2] * oaz, m3_ = rd[0] * oax + rd[1] * oay + rd[2] * oaz, m5 = oax * oax + oay * oay + oaz * oaz;
      const m6 = rd[0] * obx + rd[1] * oby + rd[2] * obz, m7 = obx * obx + oby * oby + obz * obz;
      if (Math.abs(k2) > 1e-6){
        const k1 = d2 * m3_ - m1 * m2 + m2 * rr * ra, k0 = d2 * m5 - m1 * m1 + m1 * rr * ra * 2 - m0 * ra * ra, h = k1 * k1 - k0 * k2;
        if (h >= 0){
          const t = (-Math.sqrt(h) - k1) / k2, y = m1 - ra * rr + t * m2;
          if (t > 0 && y > 0 && y < d2){
            const hx = oax + t * rd[0], hy = oay + t * rd[1], hz = oaz + t * rd[2];
            nx = d2 * hx - ba[0] * y; ny = d2 * hy - ba[1] * y; nz = d2 * hz - ba[2] * y;
            const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; return t; }
        }
      }
      const h1 = m3_ * m3_ - m5 + ra * ra, h2 = m6 * m6 - m7 + rb * rb;
      let t = 1e9;
      if (h1 > 0){ const t1 = -m3_ - Math.sqrt(h1); if (t1 > 0){ t = t1; nx = (oax + t * rd[0]) / ra; ny = (oay + t * rd[1]) / ra; nz = (oaz + t * rd[2]) / ra; } }
      if (h2 > 0){ const t2 = -m6 - Math.sqrt(h2); if (t2 > 0 && t2 < t){ t = t2; nx = (obx + t * rd[0]) / rb; ny = (oby + t * rd[1]) / rb; nz = (obz + t * rd[2]) / rb; } }
      return t < 1e9 ? t : -1; },
    normal(){ return [nx, ny, nz]; }};
}
function r3dPrepCyl(q, RB){
  const rd = [-RB.v[0], -RB.v[1], -RB.v[2]], ba = [q.b[0] - q.a[0], q.b[1] - q.a[1], q.b[2] - q.a[2]], rr = q.r * q.r;
  const dot = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const baba = dot(ba, ba), bard = dot(ba, rd), k2 = baba - bard * bard, lb = Math.sqrt(baba) || 1;
  const oa0 = [RB.O[0] - q.a[0], RB.O[1] - q.a[1], RB.O[2] - q.a[2]];
  let nx = 0, ny = 0, nz = 1;
  return {test(px, py){
      const ocx = oa0[0] + px * RB.EX[0] + py * RB.EY[0], ocy = oa0[1] + px * RB.EX[1] + py * RB.EY[1], ocz = oa0[2] + px * RB.EX[2] + py * RB.EY[2];
      const baoc = ba[0] * ocx + ba[1] * ocy + ba[2] * ocz, ocrd = rd[0] * ocx + rd[1] * ocy + rd[2] * ocz, ococ = ocx * ocx + ocy * ocy + ocz * ocz;
      const k1 = baba * ocrd - baoc * bard, k0 = baba * ococ - baoc * baoc - rr * baba;
      if (Math.abs(k2) < 1e-6) return -1;   // looking straight down the axis (never, with the fixed pitched camera)
      let h = k1 * k1 - k2 * k0; if (h < 0) return -1;
      h = Math.sqrt(h);
      let t = (-k1 - h) / k2; const y = baoc + t * bard;
      if (t > 0 && y > 0 && y < baba){
        nx = (ocx + t * rd[0] - ba[0] * y / baba) / q.r; ny = (ocy + t * rd[1] - ba[1] * y / baba) / q.r; nz = (ocz + t * rd[2] - ba[2] * y / baba) / q.r; return t; }
      t = ((y < 0 ? 0 : baba) - baoc) / bard;
      if (t > 0 && Math.abs(k1 + k2 * t) < h){ const sg = y < 0 ? -1 : 1; nx = ba[0] * sg / lb; ny = ba[1] * sg / lb; nz = ba[2] * sg / lb; return t; }
      return -1; },
    normal(){ return [nx, ny, nz]; }};
}
const R3D_RINGS = new WeakMap();
function r3dExpandParts(parts){
  if (!parts.some(q => q.t === 'ring')) return parts;
  let out = R3D_RINGS.get(parts); if (out) return out;
  out = [];
  for (const q of parts){
    if (q.t !== 'ring'){ out.push(q); continue; }
    const n = q.n || 10, M = m3.eul(q.rot), c = q.c || [0, 0, 0];
    for (let i = 0; i < n; i++){
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const Rz = q.Rz === undefined ? q.R : q.Rz, pa = m3.v(M, [Math.cos(a0) * q.R, 0, Math.sin(a0) * Rz]), pb = m3.v(M, [Math.cos(a1) * q.R, 0, Math.sin(a1) * Rz]);
      out.push({b:q.b, t:'cap', a:[c[0] + pa[0], c[1] + pa[1], c[2] + pa[2]], p:[c[0] + pb[0], c[1] + pb[1], c[2] + pb[2]], r:q.r, z:q.z});
    }
  }
  R3D_RINGS.set(parts, out);
  return out;
}
function r3dRender(rec, pose, dir){
  const W = R3D.W, H = R3D.H, N = W * H, a = dir * Math.PI / 4, yaw = Math.atan2(Math.cos(a), Math.sin(a));
  const RB = R3D.RB = R3D.RB || r3dRayBasis(), ct = RB.ct, st = RB.st;
  const bones = r3dPoseBones(rec, pose, yaw);
  const zb = new Float32Array(N).fill(1e9), nb = new Float32Array(N * 3), zone = new Array(N);
  const SC = R3D.SC, toScr = p => [R3D.CX + p[0] * SC, R3D.FEET + (-p[1] * ct + p[2] * st) * SC];
  for (const q of r3dExpandParts(rec.parts)){   /* Index 98 */
    const B = bones[q.b]; if (!B) continue;
    let prim, bound;
    if (q.t === 'cap' || q.t === 'cone' || q.t === 'cyl'){
      const A = m3.v(B.M, q.a), Pp = m3.v(B.M, q.p);
      const a3 = [B.P[0] + A[0], B.P[1] + A[1], B.P[2] + A[2]], b3 = [B.P[0] + Pp[0], B.P[1] + Pp[1], B.P[2] + Pp[2]], sa = toScr(a3), sb = toScr(b3);
      prim = q.t === 'cap' ? r3dPrepCap({a:a3, b:b3, r:q.r}, RB) : q.t === 'cone' ? r3dPrepCone({a:a3, b:b3, r:q.r, r2:q.r2 === undefined ? q.r : q.r2}, RB) : r3dPrepCyl({a:a3, b:b3, r:q.r}, RB);   /* Index 98 */
      const qr = Math.max(q.r, q.r2 || 0) * SC; bound = [Math.min(sa[0], sb[0]) - qr, Math.max(sa[0], sb[0]) + qr, Math.min(sa[1], sb[1]) - qr, Math.max(sa[1], sb[1]) + qr];
    } else {
      const c = m3.v(B.M, q.c), C3 = [B.P[0] + c[0], B.P[1] + c[1], B.P[2] + c[2]], M = q.rot ? m3.mul(B.M, m3.eul(q.rot)) : B.M;
      const rr = q.t === 'box' ? Math.hypot(q.r[0], q.r[1], q.r[2]) : Math.max(q.r[0], q.r[1], q.r[2]), cs = toScr(C3);
      prim = q.t === 'box' ? r3dPrepBox({c:C3, M, r:q.r}, RB) : r3dPrepEll({c:C3, M, r:q.r}, RB);
      bound = [cs[0] - rr * SC, cs[0] + rr * SC, cs[1] - rr * SC, cs[1] + rr * SC];
    }
    const x0 = Math.max(0, Math.floor(bound[0])), x1 = Math.min(W - 1, Math.ceil(bound[1])), y0 = Math.max(0, Math.floor(bound[2])), y1 = Math.min(H - 1, Math.ceil(bound[3]));
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++){
      const t = prim.test(px, py); if (t < 0) continue;
      const i = py * W + px; if (t >= zb[i]) continue;
      const n = prim.normal(); zb[i] = t; nb[i * 3] = n[0]; nb[i * 3 + 1] = n[1]; nb[i * 3 + 2] = n[2]; zone[i] = q.z;
    }
  }
  return r3dShade(rec, zb, nb, zone, RB.v);
}
const R3D_LIGHT = (() => { const l = [-0.5, 0.78, 0.42], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
function r3dShade(rec, zb, nb, zone, v){
  const W = R3D.W, H = R3D.H, c = newCanvas(W, H), g = c.getContext('2d', {willReadFrequently:true}), im = g.createImageData(W, H), d = im.data, L = R3D_LIGHT;
  const hl = [L[0] + v[0], L[1] + v[1], L[2] + v[2]], hn = Math.hypot(hl[0], hl[1], hl[2]); hl[0] /= hn; hl[1] /= hn; hl[2] /= hn;
  const col = {}; for (const k in rec.zones) col[k] = hex3(rec.zones[k]);
  for (let i = 0; i < W * H; i++){
    const z = zone[i]; if (z === undefined) continue;
    const base = col[z] || [136, 136, 136], nx = nb[i * 3], ny = nb[i * 3 + 1], nz = nb[i * 3 + 2];
    let k = 1, sp = 0;
    if (!R3D.EMIT.has(z)){
      const df = nx * L[0] + ny * L[1] + nz * L[2];
      k = df > 0.62 ? 1.08 : df > 0.28 ? 0.86 : df > -0.05 ? 0.68 : 0.54;
      const rim = 1 - Math.max(0, nx * v[0] + ny * v[1] + nz * v[2]); if (rim > 0.82 && ny > -0.2) k += 0.1;
      if (R3D.METAL.has(z)){ const sh = nx * hl[0] + ny * hl[1] + nz * hl[2]; if (sh > 0.93) sp = 0.5; else if (sh > 0.82) sp = 0.18; }
    }
    // a darker line where one surface sits well in front of the next (inner contours)
    const x = i % W, zi = zb[i];
    if ((x > 0 && zone[i - 1] !== undefined && zi - zb[i - 1] > 3.2) || (x < W - 1 && zone[i + 1] !== undefined && zi - zb[i + 1] > 3.2) ||
        (i >= W && zone[i - W] !== undefined && zi - zb[i - W] > 3.2) || (i + W < W * H && zone[i + W] !== undefined && zi - zb[i + W] > 3.2)) k *= 0.62;
    d[i * 4] = Math.min(255, base[0] * k + 255 * sp); d[i * 4 + 1] = Math.min(255, base[1] * k + 255 * sp); d[i * 4 + 2] = Math.min(255, base[2] * k + 255 * sp); d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return outline(c);
}

/* ---- cache and drawing ---- */
function r3dWarm(rec){ for (const clip of R3D.CLIPS_FOR[rec.rig]) for (let d = 0; d < 8; d++) r3dFrames(rec, clip, d); }
const R3DL = {rec:null, recKey:'', flash:null};
function r3dLeaderRecipe(){
  const L = META && META.leader; if (!L) return null;
  const k = personKey(L, true);
  if (R3DL.recKey !== k){ R3DL.rec = r3dRecipeFor(L, true); R3DL.recKey = k; }
  return R3DL.rec;
}
function r3dDrawUnit(rec, u, x, y, s, frame, flash, tick){
  // facing
  const st = u._r3d = u._r3d || {dir:2};
  if (G && u === G.leader){
    let a = G.facing;
    if (u.faceT > 0 && !u.moving && typeof a === 'number' && (Math.cos(a) < 0) !== !!u.anim.left) a = Math.PI - a;
    if (typeof a === 'number') st.dir = r3dDirOf(a);
  } else if (u.moving){
    const kx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), ky = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (kx || ky) st.dir = r3dDirOf(Math.atan2(ky, kx)); else if (u.tx !== undefined && Math.hypot(u.tx - u.x, u.ty - u.y) > 1) st.dir = r3dDirOf(Math.atan2(u.ty - u.y, u.tx - u.x));
  }
  // clip and frame
  let clip = 'idle', i = Math.floor(tick / 14) % 4;
  if (frame === 3 || frame === 4){ clip = frame === 4 ? 'shoot' : 'melee'; const n = R3D_CLIPS.humanoid[clip].n; i = Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / 12) * n)); }
  else if (u.moving){ clip = 'walk'; i = Math.floor(tick / 6) % 8; }
  const img = r3dFrames(rec, clip, st.dir)[i], sc = s / R3D.K;
  shadow(x, y + 7 * s, 4.5 * s);
  const dx = x - R3D.CX * sc, dy = y + 7 * s - R3D.FEET * sc;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (flash){
    const f = R3DL.flash = R3DL.flash || newCanvas(R3D.W, R3D.H), g = f.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, R3D.W, R3D.H); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, R3D.W, R3D.H);
    ctx.drawImage(f, dx, dy, R3D.W * sc, R3D.H * sc);
  } else ctx.drawImage(img, dx, dy, R3D.W * sc, R3D.H * sc);
  ctx.restore();
  return true;
}
// the Leader's pixel sprite is tagged, and drawSprite swaps in the 3D frames
{ const f = personSprite; personSprite = function(p, isLeader){ const spr = f(p, isLeader); if (isLeader && META && p === META.leader) spr.lead3d = true; return spr; }; }
{ const f = drawSprite;
  drawSprite = function(spr, x, y, s, frame, left, flash){
    if (spr && spr.lead3d){
      try {
        const rec = r3dLeaderRecipe();
        let u = null, tick = 0;
        if (G && G.leader && Math.abs(G.leader.x - x) < 0.5 && Math.abs(G.leader.y - y) < 0.5){ u = G.leader; tick = G.frame; }
        else { u = CAMP.people.find(q => q.kind === 'leader' && Math.abs(q.x - x) < 0.5 && Math.abs(q.y - y) < 0.5); tick = CAMP.t; }
        if (rec && u && r3dDrawUnit(rec, u, x, y, s, frame, flash, tick)) return;
      } catch (e) { (typeof r3dWarnOnce === 'function' ? r3dWarnOnce('leader', e) : console.warn('3D leader drew the placeholder:', e)); /* S6-C note 10: no pixel fallback; once per kind */ }
    }
    return f(spr, x, y, s, frame, left, flash);
  };
}
// render the whole set ahead of time where a short pause will not be noticed
{ const f = startDeployment; startDeployment = function(c, ids){ const r = f(c, ids); try { if (G){ const rec = r3dLeaderRecipe(); if (rec) r3dWarm(rec); } } catch (e) {} return r; }; }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx50')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx50"><b>3D Squad Leader (prototype).</b> Your Squad Leader is drawn as a 3D model that turns through eight directions. Switch it off in Settings to go back to the pixel sprite.</p>`);
  };
}
/* ===== END INDEX 50 ======================================================= */

/* ============================================================================
   INDEX 51 - 3D STYLE PASS: THREE LOOKS, FIRELIGHT, AND SMALLER HEADS
   PROPORTIONS  Heads are about 20% smaller and legs a touch longer: about one
                head in six and a half of height, a stylised game hero rather
                than a chibi.
   STYLES       Settings now offers three looks, with a live preview of your own
                Squad Leader in each, side by side, plus "Pixel sprite" (off).
                  Retro   rendered at the pixel world's own resolution (one 3D
                          pixel = one sprite pixel), 3 light bands, shadows
                          shifted toward cool purple, a hard 1-pixel outline.
                          Sits closest to the pixel terrain.
                  Crisp   rendered at half the screen's resolution, 4 bands, hue
                          shifted shadows, inner contour lines, a rim of light.
                  Painted full resolution, smooth shading, warm highlights, a
                          soft coloured outline instead of black.
   LIGHT        Ground fires, the campfire, braziers and the Chapter's magic
                (missiles, hexes, called shots) now light the Leader from their
                side, warm or cold to match. Strength falls off with distance.
   Old saves: the old on/off setting becomes Crisp (on) or Pixel sprite (off).
   To roll back, delete from this comment to END INDEX 51 and undo the patch
   marked "Index 51" in r3dSkeleton.

   3D DESIGN NOTE, ADDENDUM (read with the note in Index 50)
     STYLES live in R3D_STYLES. Each has res (render resolution as a fraction
     of the base 96 x 100 frame), shade(df, rim, zoneIsMetal) -> [k, warm, cool]
     and flags: inner (contour lines), outline ('black' | 'sel' | 'none'),
     hard (stepped light glow). r3dUseStyle(style) sets R3D.W, H, FEET, CX,
     SC and resets the ray basis; r3dFrames and r3dDrawUnit call it, and the
     frame cache key includes the style id. To add a style, add an entry: no
     renderer changes needed. Draw scale is s / R3D.K / style.res.
     LIGHTS come from r3dLights(x, y): add a source there as {x, y, r, col}.
   ============================================================================ */
const R3D_BASE = {W:96, H:100, FEET:90, CX:48, SC:0.84};
const R3D_STYLES = {
  retro:{id:'retro', name:'Retro', blurb:'Pixel-for-pixel with the world. Hard outline, three bands.', res:0.37, inner:false, outline:'black', hard:true, ss:1, ao:0,
    shade:(df, rim, metal) => [df > 0.45 ? 1.06 : df > 0.0 ? 0.8 : 0.6, df > 0.45 ? 0.1 : 0, df > 0.45 ? 0 : df > 0 ? 0.12 : 0.3]},
  crisp:{id:'crisp', name:'Crisp', blurb:'Twice the detail, contour lines and a rim of light.', res:0.5, inner:true, outline:'black', hard:false, ss:2, ao:0.35, aoR:1,
    shade:(df, rim, metal) => { let k = df > 0.62 ? 1.08 : df > 0.28 ? 0.88 : df > -0.05 ? 0.7 : 0.56; if (rim > 0.84) k += 0.12; return [k, df > 0.62 ? 0.08 : 0, df > 0.28 ? 0 : 0.2]; }},
  painted:{id:'painted', name:'Painted', blurb:'Full resolution, smooth light and a soft coloured outline.', res:1, inner:true, outline:'sel', hard:false, ss:1, ao:0.45, aoR:2,
    shade:(df, rim, metal) => { const l = Math.max(0, df); let k = 0.58 + 0.5 * Math.pow(l, 0.75); if (rim > 0.86) k += 0.1 * (rim - 0.86) / 0.14; return [k, 0.1 * l, 0.12 * (1 - l)]; }}
};
const R3D_STYLE_ORDER = ['retro', 'crisp', 'painted'];
let r3dStyleId = function(){ const v = settings().chars3d; return (v && v !== true && v !== 'painted' && R3D_STYLES[v]) ? v : 'crisp'; };   /* Index 52: a saved 'painted' reads as Crisp */   /* PL-1.1: every figure is 3D; old 'off'/false saves read as Crisp */
function r3dUseStyle(st){
  if (R3D.STY === st) return;
  const k = st.res;
  R3D.STY = st; R3D.W = Math.round(R3D_BASE.W * k); R3D.H = Math.round(R3D_BASE.H * k); R3D.FEET = Math.round(R3D_BASE.FEET * k); R3D.CX = Math.round(R3D_BASE.CX * k);
  R3D.SC = R3D_BASE.SC * k; R3D.RB = null;
}
r3dUseStyle(R3D_STYLES.crisp);

/* ---- shading, by style ---- */
const R3D_WARM = [255, 236, 190], R3D_COOL = [52, 40, 92];
/* Index 98: materials. A zone is shaded by its material: specular width and strength (two bands for the hard styles, a
   smooth lobe for Painted), how strongly the rim light takes, how deep the crease shadow goes, and a warm tint for gold.
   Zone -> material comes from R3D_ZONE_MAT, R3D.METAL (metal) and R3D.EMIT (unlit); a recipe can override with rec.mats = {zone:'leather'}. */
const R3D_SURF = {
  cloth:  {sp:0,    sw:1,    rim:1,   ao:1},
  skin:   {sp:0.1,  sw:0.975, rim:0.75, ao:0.9},
  leather:{sp:0.2,  sw:0.95, rim:0.9, ao:1},
  wood:   {sp:0.08, sw:0.96, rim:0.8, ao:1},
  stone:  {sp:0,    sw:1,    rim:0.7, ao:1.1},
  bone:   {sp:0.22, sw:0.94, rim:1.1, ao:0.8},
  metal:  {sp:0.5,  sw:0.93, sp2:0.18, sw2:0.82, rim:1.3, ao:1},
  gold:   {sp:0.55, sw:0.9,  sp2:0.2,  sw2:0.78, rim:1.2, ao:1, warm:0.18},
  glass:  {sp:0.6,  sw:0.95, rim:1.4, ao:0.5},
  mail:   {sp:0.28, sw:0.9,  rim:1.1, ao:1.15},
  hair:   {sp:0.18, sw:0.96, rim:1.15, ao:0.9},
  fur:    {sp:0.05, sw:0.97, rim:1.25, ao:1.1}
};
const R3D_ZONE_MAT = {skin:'skin', nose:'skin', ears:'skin', hand:'skin', leather:'leather', boots:'leather', strap:'leather', belt:'leather', quiver:'leather', hide:'leather',
  wood:'wood', woodD:'wood', woodL:'wood', clubwood:'wood', shaft:'wood', bark:'wood', bone:'bone', horn:'bone', tusk:'bone', tusks:'bone', teeth:'bone', ivory:'bone', claw:'bone',
  stone:'stone', stoneD:'stone', stoneL:'stone', slate:'stone', gold:'gold', brass:'gold', glass:'glass',
  plate:'metal', helm:'metal', mail:'mail', hair:'hair', feather:'hair', mane:'hair', fur:'fur', coat:'fur', belly:'fur', hoof:'bone', claw:'bone', tack:'leather', saddleC:'leather', eye:'glass', qeye:'glass', mouth:'skin'};
function r3dMatOf(rec, z){
  const m = (rec.mats && rec.mats[z]) || R3D_ZONE_MAT[z] || (R3D.METAL.has(z) ? 'metal' : 'cloth');
  return R3D_SURF[m] || R3D_SURF.cloth;
}
function r3dSelOutline(c){   // selective outline: each edge takes a dark version of the colour it borders
  /* raid3 PERF (QA 0b9df6b): same pixels as before (neighbour order right, left, down, up), without a
     neighbour array per pixel and with the bounds test folded into the index; the top self time in a raid */
  const g = c.getContext('2d', {willReadFrequently:true}), W = c.width, H = c.height, im2 = g.getImageData(0, 0, W, H), a = im2.data, out = new Uint8ClampedArray(a), row = W * 4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = (y * W + x) * 4; if (a[i + 3]) continue;
    const j = (x + 1 < W && a[i + 7]) ? i + 4 : (x > 0 && a[i - 1]) ? i - 4 : (y + 1 < H && a[i + row + 3]) ? i + row : (y > 0 && a[i - row + 3]) ? i - row : -1;
    if (j < 0) continue;
    out[i] = a[j] * 0.32 + 12; out[i + 1] = a[j + 1] * 0.28 + 8; out[i + 2] = a[j + 2] * 0.3 + 14; out[i + 3] = 255;
  }
  g.putImageData(new ImageData(out, W, H), 0, 0);
  return c;
}
function r3dOutlineFor(c, S){ return S.outline === 'black' ? outline(c) : S.outline === 'sel' ? r3dSelOutline(c) : c; }
r3dShade = function(rec, zb, nb, zone, v){
  const S = R3D.STY, W = R3D.W, H = R3D.H, c = newCanvas(W, H), g = c.getContext('2d', {willReadFrequently:true}), im = g.createImageData(W, H), d = im.data, L = R3D_LIGHT;
  const hl = [L[0] + v[0], L[1] + v[1], L[2] + v[2]], hn = Math.hypot(hl[0], hl[1], hl[2]); hl[0] /= hn; hl[1] /= hn; hl[2] /= hn;
  const col = {}, mat = {}; for (const k in rec.zones){ col[k] = hex3(rec.zones[k]); mat[k] = r3dMatOf(rec, k); }
  const ssk = R3D.SSPASS ? (S.ss || 1) : 1;
  const cdepth = 3.2 / (R3D.SC / R3D_BASE.SC) * S.res * ssk;   // contour depth gap, in model units
  const ao = S.ao || 0, aoR = Math.max(1, Math.round((S.aoR || 1) * ssk)), aoD = 1.4, smooth = !S.hard && S.outline === 'sel';
  for (let i = 0; i < W * H; i++){
    const z = zone[i]; if (z === undefined) continue;
    const base = col[z] || [136, 136, 136], nx = nb[i * 3], ny = nb[i * 3 + 1], nz = nb[i * 3 + 2];
    let k = 1, warm = 0, cool = 0, sp = 0;
    if (!R3D.EMIT.has(z)){
      const M = mat[z] || R3D_SURF.cloth;
      const df = nx * L[0] + ny * L[1] + nz * L[2], rim = (1 - Math.max(0, nx * v[0] + ny * v[1] + nz * v[2])) * M.rim, metal = R3D.METAL.has(z);
      [k, warm, cool] = S.shade(df, ny > -0.2 ? Math.min(1, rim) : 0, metal);
      if (M.sp){
        const sh = nx * hl[0] + ny * hl[1] + nz * hl[2];
        if (smooth){ sp = M.sp * Math.pow(Math.max(0, sh), 1 / (1.001 - M.sw)) * 1.15; }
        else if (sh > M.sw) sp = S.hard ? M.sp * 0.8 : M.sp; else if (M.sp2 && sh > M.sw2 && !S.hard) sp = M.sp2;
      }
      if (M.warm && df > 0) warm += M.warm * df;
      const x = i % W, zi = zb[i], y = (i / W) | 0;
      if (S.inner){
        if ((x > 0 && zone[i - 1] !== undefined && zi - zb[i - 1] > cdepth) || (x < W - 1 && zone[i + 1] !== undefined && zi - zb[i + 1] > cdepth) ||
            (i >= W && zone[i - W] !== undefined && zi - zb[i - W] > cdepth) || (i + W < W * H && zone[i + W] !== undefined && zi - zb[i + W] > cdepth)) k *= 0.64;
      }
      if (ao){   // crease shadow: how many of eight neighbours at aoR sit in front of this pixel
        let occ = 0;
        for (let dy = -aoR; dy <= aoR; dy += aoR) for (let dx = -aoR; dx <= aoR; dx += aoR){
          if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const j = Y * W + X; if (zone[j] !== undefined && zi - zb[j] > aoD) occ++;
        }
        if (occ) k *= 1 - ao * M.ao * occ / 8;
      }
    }
    for (let ch = 0; ch < 3; ch++){
      let x = base[ch] * k; x = x + (R3D_WARM[ch] - x) * warm; x = x + (R3D_COOL[ch] - x) * cool; x += 255 * sp;
      d[i * 4 + ch] = x < 0 ? 0 : x > 255 ? 255 : x;
    }
    d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  if (R3D.SSPASS) return c;   // Index 98: the outline goes on after the downsample (r3dRenderSS)
  return r3dOutlineFor(c, S);
};

/* ---- frames are cached per style ---- */
/* Index 98: a style with ss:2 renders every frame at twice the size and averages 2x2 blocks down (alpha-weighted), then outlines.
   Edges and inner contours come out anti-aliased at the same cached size; cost is about 4x the ray tests per frame. */
function r3dRenderSS(rec, pose, dir, st){
  const ss = (st && st.ss) || 1; if (ss === 1 || rec.noSS) return r3dRender(rec, pose, dir);
  const W = R3D.W, H = R3D.H, FEET = R3D.FEET, CX = R3D.CX, SC = R3D.SC;
  R3D.W = W * ss; R3D.H = H * ss; R3D.FEET = FEET * ss; R3D.CX = CX * ss; R3D.SC = SC * ss; R3D.RB = null; R3D.SSPASS = true;
  let big; try { big = r3dRender(rec, pose, dir); } finally { R3D.W = W; R3D.H = H; R3D.FEET = FEET; R3D.CX = CX; R3D.SC = SC; R3D.RB = null; R3D.SSPASS = false; }
  const a = big.getContext('2d', {willReadFrequently:true}).getImageData(0, 0, W * ss, H * ss).data, c = newCanvas(W, H), g = c.getContext('2d', {willReadFrequently:true}), im = g.createImageData(W, H), d = im.data, BW = W * ss;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    let r = 0, gg = 0, b = 0, al = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++){ const j = ((y * ss + sy) * BW + x * ss + sx) * 4, w = a[j + 3]; if (!w) continue; r += a[j] * w; gg += a[j + 1] * w; b += a[j + 2] * w; al += w; }
    const i = (y * W + x) * 4; if (!al) continue;
    d[i] = r / al; d[i + 1] = gg / al; d[i + 2] = b / al; d[i + 3] = al / (ss * ss);
  }
  g.putImageData(im, 0, 0);
  return r3dOutlineFor(c, st);
}
/* a clip's frames in one style, cached (folded: Index 52 styles; figures-2 recipes with their own canvas (rec.frame)
   and the boss halo (rec.halo, painted once into each cached frame, also into frames r3dFramesAsync made) */
function r3dFrames(rec, clip, dir, st){
  st = st || R3D_STYLES[r3dStyleId() || 'crisp']; r3dUseStyle(st);
  const key = rec.key + ':' + st.id, C = R3D.cache[key] = R3D.cache[key] || {}, K = C[clip] = C[clip] || [];
  let fr = K[dir];
  if (!fr){
    const F = rec.frame;
    if (F){ const k = st.res; R3D.W = Math.round(F.W * k); R3D.H = Math.round(F.H * k); R3D.FEET = Math.round(F.FEET * k); R3D.CX = Math.round(F.CX * k); R3D.RB = null; }
    try {
      const def = R3D_CLIPS[rec.rig][clip], t0 = performance.now(), out = [];
      for (let i = 0; i < def.n; i++) out.push(r3dRenderSS(rec, def.fn(i / def.n, rec), dir, st));   /* Index 98 */
      R3D.ms += performance.now() - t0; R3D.made += def.n;
      fr = K[dir] = out;
    } finally { if (F){ R3D.STY = null; r3dUseStyle(st); } }
  }
  if (rec.halo && fr) r3dHalo(fr, rec.halo);
  return fr;
}

/* ---- light from fires and magic ---- */
function r3dLights(x, y){
  const out = [], add = (sx, sy, r, col, k = 1) => { const dd = Math.hypot(sx - x, sy - y); if (dd < r) out.push({dx:sx - x, dy:sy - y, f:(1 - dd / r) * k, col}); };
  if (G){
    for (const f of (G.fires || [])) add(f.x, f.y, 150 + (f.r || 20), [255, 140, 50], Math.min(1, (f.life || 60) / 60));
    for (const s of (G.shots || [])){ if (s.kind === 'missile') add(s.x, s.y, 120, [120, 200, 255], 0.9); else if (s.kind === 'hex') add(s.x, s.y, 110, [150, 230, 110], 0.8); else if (s.kind === 'called') add(s.x, s.y, 70, [255, 240, 200], 0.5); }
    for (const b of (G.braziers || [])) if (b.lit !== false) add(b.x, b.y, 220, [255, 160, 70], 0.8);
  } else if (typeof HUB !== 'undefined' && HUB.fire) add(HUB.fire.x, HUB.fire.y, 260, [255, 150, 60], 0.75 + 0.08 * Math.sin((CAMP.t || 0) / 5));
  out.sort((a, b) => b.f - a.f); return out.slice(0, 2);
}
const R3DG = {c:null};
function r3dLightUp(img, dx, dy, w, h, lights, hard){
  if (!lights.length) return;
  const W = img.width, H = img.height;
  if (!R3DG.c || R3DG.c.width !== W || R3DG.c.height !== H) R3DG.c = newCanvas(W, H);
  const g = R3DG.c.getContext('2d');
  for (const L of lights){
    const n = Math.hypot(L.dx, L.dy) || 1, ux = L.dx / n, uy = L.dy / n, a = Math.min(0.75, 0.85 * L.f);
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    const cx = W / 2, cy = H * 0.55, x0 = cx + ux * W * 0.42, y0 = cy + uy * H * 0.3, x1 = cx - ux * W * 0.2, y1 = cy - uy * H * 0.15;
    const gr = g.createLinearGradient(x0, y0, x1, y1), c = L.col, rgba = al => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
    if (hard){ gr.addColorStop(0, rgba(a)); gr.addColorStop(0.45, rgba(a)); gr.addColorStop(0.46, rgba(a * 0.35)); gr.addColorStop(0.75, rgba(a * 0.35)); gr.addColorStop(0.76, rgba(0)); gr.addColorStop(1, rgba(0)); }
    else { gr.addColorStop(0, rgba(a)); gr.addColorStop(0.6, rgba(a * 0.25)); gr.addColorStop(1, rgba(0)); }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = false; ctx.drawImage(R3DG.c, dx, dy, w, h); ctx.restore();
  }
}

/* ---- drawing, scaled for the style's resolution ---- */
r3dDrawUnit = function(rec, u, x, y, s, frame, flash, tick){
  const St = R3D_STYLES[r3dStyleId() || 'crisp'];
  const st = u._r3d = u._r3d || {dir:2};
  if (G && u === G.leader){
    let a = G.facing;
    if (u.faceT > 0 && !u.moving && typeof a === 'number' && (Math.cos(a) < 0) !== !!u.anim.left) a = Math.PI - a;
    if (typeof a === 'number') st.dir = r3dDirOf(a);
  } else if (u.moving){
    const kx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), ky = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (kx || ky) st.dir = r3dDirOf(Math.atan2(ky, kx)); else if (u.tx !== undefined && Math.hypot(u.tx - u.x, u.ty - u.y) > 1) st.dir = r3dDirOf(Math.atan2(u.ty - u.y, u.tx - u.x));
  }
  let clip = 'idle', i = Math.floor(tick / 14) % 4;
  if (frame === 3 || frame === 4){ clip = frame === 4 ? 'shoot' : 'melee'; const n = R3D_CLIPS.humanoid[clip].n; i = Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / 12) * n)); }
  else if (u.moving){ clip = 'walk'; i = Math.floor(tick / 6) % 8; }
  const img = r3dFrames(rec, clip, st.dir, St)[i], sc = s / R3D.K / St.res;
  const W = img.width, H = img.height, dx = x - R3D.CX * sc, dy = y + 7 * s - R3D.FEET * sc, w = W * sc, h = H * sc;
  shadow(x, y + 7 * s, 4.5 * s);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (flash){
    if (!R3DL.flash || R3DL.flash.width !== W || R3DL.flash.height !== H) R3DL.flash = newCanvas(W, H);
    const f = R3DL.flash, g = f.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, W, H);
    ctx.drawImage(f, dx, dy, w, h);
  } else ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();
  if (!flash) try { r3dLightUp(img, dx, dy, w, h, r3dLights(x, y), St.hard); } catch (e) {}
  return true;
};
r3dWarm = function(rec){ const st = R3D_STYLES[r3dStyleId() || 'crisp']; for (const clip of R3D.CLIPS_FOR[rec.rig]) for (let d = 0; d < 8; d++) r3dFrames(rec, clip, d, st); };

/* ---- Settings: three looks side by side ---- */
const R3DP = {};
function r3dPreviewURL(sid){
  const L = META && META.leader; if (!L) return '';
  const rec = r3dLeaderRecipe(), key = rec.key + sid; if (R3DP[key]) return R3DP[key];
  const st = R3D_STYLES[sid], f = r3dFrames(rec, 'idle', 1, st)[0], k = 2 / st.res, c = newCanvas(Math.round(f.width * k * 0.6), Math.round(f.height * k * 0.6));
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#5f7a43'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(f, -f.width * k * 0.2, -f.height * k * 0.28, f.width * k, f.height * k);
  r3dUseStyle(R3D_STYLES[r3dStyleId() || 'crisp']);
  return R3DP[key] = c.toDataURL();
}
function r3dPick(sid){ setSetting('chars3d', sid || 'off'); try { const el = $('tb-settings'); if (el) el.outerHTML = el.outerHTML; } catch (e) {} if (typeof toggleSettings === 'function' && $('tb-settings')){ toggleSettings(); toggleSettings(); } refreshUI(); }
settingsHTML = (function(prev){
  return function(dark){
    const s = prev(dark);
    const cur = r3dStyleId(), has = !!(META && META.leader), col = dark ? '#ddd' : '#2a2520';
    const card = (sid, name, blurb, img) => `<button type="button" onclick="r3dPick('${sid}')" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px;width:118px;cursor:pointer;font-family:Georgia;font-size:14px;color:${col};background:${(cur || 'off') === sid ? 'rgba(212,175,55,.35)' : 'rgba(0,0,0,.12)'};border:${(cur || 'off') === sid ? '2px solid #d4af37' : '1px solid rgba(128,110,80,.6)'};border-radius:4px">
      ${img ? `<img src="${img}" style="height:96px">` : '<div style="height:96px;width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;font-size:14px;opacity:.75">No Squad Leader yet</div>'}<b>${name}</b><span style="font-size:14px;line-height:1.2">${blurb}</span></button>`;
    const row = `<div style="width:100%;text-align:center;font:bold 14px Georgia;color:${col};margin-top:6px">Squad Leader look</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;width:100%">${R3D_STYLE_ORDER.map(sid => card(sid, R3D_STYLES[sid].name, R3D_STYLES[sid].blurb, has ? r3dPreviewURL(sid) : '')).join('')}</div>`;
    const i = s.lastIndexOf('</div>'); return i < 0 ? s + row : s.slice(0, i) + row + s.slice(i);
  };
})(settingsHTML);
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx51')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx51"><b>The Squad Leader's look.</b> Settings shows your Squad Leader in Retro, Crisp and Painted 3D styles. Click one to use it. Fires and magic light the 3D Leader from their side.</p>`);
  };
}
/* ===== END INDEX 51 ======================================================= */

/* ============================================================================
   INDEX 52 - 3D FOR THE WHOLE CHAPTER (TEST BUILD), TWO LOOKS
   Every member of the Chapter drawn through personSprite is now 3D when a 3D
   look is on: Squad Mates in the field and the bar fight, officers and
   veterans in raids, and everyone walking the camp. Enemies, the Chapter
   Master, the Bard and horses stay pixel art for now.
   Squad Mates face the way they move (8 directions) and turn to strike.
   Only the Squad Leader is pre-rendered when a contract starts; everyone else
   renders a direction the first time it is needed (a few milliseconds).
   Looks: Retro and Crisp. Painted is gone from Settings; a saved Painted
   setting becomes Crisp.
   To roll back, delete from this comment to END INDEX 52.
============================================================================ */
R3D_STYLE_ORDER.length = 0; R3D_STYLE_ORDER.push('retro', 'crisp');
const R3DM = {recs:new Map()};
function r3dRecipeOf(p, isLeader){
  const k = personKey(p, isLeader); let r = R3DM.recs.get(k);
  if (!r){ r = r3dRecipeFor(p, isLeader); R3DM.recs.set(k, r); if (R3DM.recs.size > 80) R3DM.recs.delete(R3DM.recs.keys().next().value); }
  return r;
}
{ const f = personSprite; personSprite = function(p, isLeader){ const spr = f(p, isLeader); if (p && p.race && p.spec && RACES[p.race] && (SPECS[p.spec] || R3D_KITS[p.spec]) && !spr.lead3d){ spr.p3d = p; spr.p3dL = !!isLeader; } return spr; }; }
function r3dFindUnit(x, y){
  const at = u => u && Math.abs(u.x - x) < 0.5 && Math.abs(u.y - y) < 0.5;
  if (G){ for (const m of (G.squad || [])) if (at(m)) return [m, G.frame]; for (const a of (G.allies || [])) if (at(a)) return [a, G.frame]; }
  for (const q of (CAMP.people || [])) if (at(q)) return [q, CAMP.t];
  return [null, 0];
}
// facing for anyone who is not the Leader: from how they moved since the last frame
function r3dFaceOther(u){
  const st = u._r3d = u._r3d || {dir:2, px:u.x, py:u.y};
  const dx = u.x - st.px, dy = u.y - st.py; st.px = u.x; st.py = u.y;
  if (Math.hypot(dx, dy) > 0.25) st.dir = r3dDirOf(Math.atan2(dy, dx));
  else if ((u.atkT || 0) > 0 && u.anim){ const left = !!u.anim.left, dl = st.dir >= 3 && st.dir <= 5; if (left !== dl) st.dir = left ? 4 : 0; }
  else if ((u.atkT || 0) > 0 && u.left !== undefined){ const dl = st.dir >= 3 && st.dir <= 5; if (!!u.left !== dl) st.dir = u.left ? 4 : 0; }
  return st;
}
{ const f = r3dDrawUnit;
  r3dDrawUnit = function(rec, u, x, y, s, frame, flash, tick){
    if (G && u === G.leader) return f(rec, u, x, y, s, frame, flash, tick);
    const st = r3dFaceOther(u), keep = st.dir, mv = u.moving;
    // the Index 51 routine reads the keyboard for non-Leaders; hide that by faking no keys for this call
    const saved = {w:keys.w, a:keys.a, s:keys.s, d:keys.d}; keys.w = keys.a = keys.s = keys.d = false;
    const walking = Math.hypot(u.x - (u._r3dLX === undefined ? u.x : u._r3dLX), u.y - (u._r3dLY === undefined ? u.y : u._r3dLY)) > 0.25 || !!mv;
    u._r3dLX = u.x; u._r3dLY = u.y;
    const tx = u.tx, ty = u.ty; u.tx = undefined;
    try { u.moving = walking; const r = f(rec, u, x, y, s, frame, flash, tick); return r; }
    finally { Object.assign(keys, saved); u.tx = tx; u.ty = ty; u.moving = mv; st.dir = keep; }
  };
}
{ const f = drawSprite;
  drawSprite = function(spr, x, y, s, frame, left, flash){
    if (spr && spr.p3d){
      try {
        const [u, tick] = r3dFindUnit(x, y);
        if (u){ u.anim = u.anim || {left}; if (u.anim.left === undefined) u.anim.left = left; if (r3dDrawUnit(r3dRecipeOf(spr.p3d, spr.p3dL), u, x, y, s, frame, flash, tick)) return; }
      } catch (e) { (typeof r3dWarnOnce === 'function' ? r3dWarnOnce('person', e) : console.warn('3D person drew the placeholder:', e)); /* S6-C note 10: no pixel fallback; once per kind */ }
    }
    return f(spr, x, y, s, frame, left, flash);
  };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx52')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx52"><b>3D Chapter (test).</b> With a 3D look on in Settings (Retro or Crisp), every member of the Chapter is drawn in 3D. Enemies, the Chapter Master, the Bard and horses are still pixel art.</p>`);
  };
}
/* ===== END INDEX 52 ======================================================= */

/* ============================================================================
   INDEX 53 - GRIMMER PROPORTIONS, A REAL CLOAK, AND LOOSER MOVEMENT
   PROPORTIONS  About 7.5 heads tall (was 6.5): smaller heads, longer legs and
                arms, slimmer limbs, a narrower waist. Robes reach the ankle.
   PALETTE      Every colour on the 3D models is muted (less saturated, a
                little darker, drawn toward an earthy grey-brown), shadows go
                deeper and cooler, highlights are less yellow. Both looks.
   CLOAK        The cloak is three hanging panels on a chain of three bones
                (cape, cape2, cape3) with a shoulder mantle, a gold clasp,
                sides that wrap forward round the body, folds down the back and
                a trimmed hem that flares. Each panel lags the one above, so it
                swings and settles instead of moving as one board.
   MOVEMENT     Walk: hips sway and roll, shoulders twist against them, the
                head stays level, elbows bend on the forward swing, the trailing
                foot lifts properly, and the body bobs twice per stride.
                Idle: breathing with a slight weight shift and a stirring cloak.
                Melee (8 frames, was 6): eased keyframes with anticipation,
                a fast strike, a lunge and follow-through. Shooting (6 frames,
                was 4): draw, hold and release.
   Nothing new is saved. To roll back, delete from this comment to END INDEX
   53 and undo the patches marked "Index 53" in r3dSkeleton and r3dRecipeFor.

   3D DESIGN NOTE, ADDENDUM
     Humanoid bones now include cape2 and cape3 (children of cape, 12 units
     apart). Clips should set cape, cape2 and cape3: each child's angle is added
     to its parent's, so small lagging values give a flowing cloak.
     keyedT(keys, t) interpolates [[time, pose], ...] with easing, for clips
     whose keys are not evenly spaced. r3dMute(rec) mutes a recipe's colours;
     zones in R3D_MUTE_SKIP are left alone.
   ============================================================================ */
function r3dCapeParts(D){
  const s = D.s, w = D.w, L = 12 * s, out = [];
  out.push({b:'chest', t:'ell', c:[0, D.torso - 2.6 * s, -2.4 * w], r:[9.4 * w, 2.7 * s, 6 * w], z:'cape'});      // the mantle over the shoulders
  out.push({b:'chest', t:'ell', c:[0, D.torso - 3.4 * s, 4.9 * w], r:[1.15, 1.15, 0.8], z:'gold'});                 // the clasp
  ['cape', 'cape2', 'cape3'].forEach((b, i) => {
    const wi = (8 + 1.4 * i) * w;
    out.push({b, t:'ell', c:[0, -L / 2 + 0.6, 0], r:[wi, L / 2 + 2.9, 0.9], z:'cape'});
    for (const sx of [1, -1]) out.push({b, t:'ell', c:[sx * (wi - 1.5), -L / 2, 1.8], r:[2.8, L / 2 + 2.6, 0.85], rot:[0, -sx * 0.95, 0], z:'cape'});
    if (i > 0) for (const fx of [-0.42, 0.38]) out.push({b, t:'ell', c:[fx * wi, -L / 2, -0.55], r:[1.3, L / 2 + 0.6, 0.9], z:'cape'});
    if (i === 2) out.push({b, t:'ell', c:[0, -L + 0.5, 0.1], r:[wi + 0.5, 1.15, 1.15], z:'capeTrim'});
  });
  return out;
}

/* ---- a muted, grimmer palette ---- */
const R3D_MUTE_SKIP = new Set(['orb', 'glow', 'eye', 'string']);
function r3dMute(rec){
  const earth = [74, 66, 56];
  for (const k in rec.zones){
    if (R3D_MUTE_SKIP.has(k)) continue;
    let [r, g, b] = hex3(rec.zones[k]); r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, sat = 0; const l = (mx + mn) / 2;
    if (mx !== mn){ const d = mx - mn; sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    const sk = k === 'skin', sf = sk ? 0.8 : k === 'gold' ? 0.72 : (k === 'metal' || k === 'helm') ? 0.45 : 0.6, lf = sk ? 0.95 : k === 'gold' ? 0.9 : 0.85;
    const S2 = sat * sf, L2 = l * lf;
    const q = L2 < 0.5 ? L2 * (1 + S2) : L2 + S2 - L2 * S2, p2 = 2 * L2 - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2; };
    const rgb = S2 === 0 ? [L2, L2, L2] : [f(h + 1 / 3), f(h), f(h - 1 / 3)];
    const mix = sk ? 0.05 : 0.12;
    rec.zones[k] = '#' + rgb.map((v, i) => Math.round(v * 255 * (1 - mix) + earth[i] * mix)).map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  return rec;
}
{ const f = r3dRecipeFor;
  r3dRecipeFor = function(p, isLeader){ const rec = r3dMute(f(p, isLeader)); delete rec.key; rec.key = 'r3d53' + hash(JSON.stringify(rec)); return rec; };
}
// deeper, cooler shadows and less yellow highlights in both looks
R3D_STYLES.retro.shade = (df, rim, metal) => [df > 0.45 ? 1.0 : df > 0.0 ? 0.72 : 0.5, df > 0.45 ? 0.05 : 0, df > 0.45 ? 0.02 : df > 0 ? 0.16 : 0.34];
R3D_STYLES.crisp.shade = (df, rim, metal) => { let k = df > 0.62 ? 1.03 : df > 0.28 ? 0.83 : df > -0.05 ? 0.63 : 0.48; if (rim > 0.84) k += 0.08; return [k, df > 0.62 ? 0.05 : 0, df > 0.28 ? 0.03 : 0.27]; };
R3D_WARM[0] = 238; R3D_WARM[1] = 214; R3D_WARM[2] = 176;
R3D_COOL[0] = 40; R3D_COOL[1] = 36; R3D_COOL[2] = 62;

/* ---- clips ---- */
const r3dEase = k => k * k * (3 - 2 * k);
function keyedT(keys, t){
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [t0, A] = keys[i], [t1, B] = keys[i + 1], k = r3dEase(Math.max(0, Math.min(1, (t - t0) / ((t1 - t0) || 1)))), out = {};
  for (const name of new Set(Object.keys(A).concat(Object.keys(B)))){
    const a = A[name], b = B[name];
    if (typeof a === 'number' || typeof b === 'number') out[name] = lerp3(a || 0, b || 0, k);
    else { const x = a || [0, 0, 0], y = b || [0, 0, 0]; out[name] = [lerp3(x[0] || 0, y[0] || 0, k), lerp3(x[1] || 0, y[1] || 0, k), lerp3(x[2] || 0, y[2] || 0, k)]; }
  }
  return out;
}
const Z3 = [0, 0, 0];
Object.assign(R3D_CLIPS.humanoid, {
  idle:{n:4, fn:(t, rec) => {
    const ph = t * Math.PI * 2, b = Math.sin(ph), A = ARMS_REST(rec);
    return Object.assign({bob:-0.15 + 0.35 * b, pelvis:[0, 0, 0.015 * b], chest:[0.03 * b, 0, -0.015 * b], head:[-0.025 * b, 0.03 * Math.cos(ph), 0],
      thL:[0.02, 0, 0.05], thR:[-0.02, 0, -0.05], shL:[0.06, 0, 0], shR:[0.04, 0, 0], hdR:Z3, hdL:Z3,
      cape:[0.08 + 0.03 * b, 0, 0], cape2:[-0.04 + 0.03 * Math.sin(ph - 1), 0, 0.02 * Math.sin(ph - 0.5)], cape3:[-0.02 + 0.04 * Math.sin(ph - 2), 0, 0.03 * Math.sin(ph - 1.3)]},
      A, {upL:[A.upL[0] + 0.03 * b, 0, A.upL[2] + 0.02 * b], upR:[A.upR[0] - 0.03 * b, 0, A.upR[2] - 0.02 * b]}); }},
  walk:{n:8, fn:(t, rec) => {
    const ph = t * Math.PI * 2, sn = Math.sin(ph), cs = Math.cos(ph), A = ARMS_REST(rec), wk = rec.grip === 'staff' ? 0.14 : rec.grip === 'bow' ? 0.22 : 0.36;
    const lift = x => 0.12 + 1.0 * Math.pow(Math.max(0, x), 1.5);
    return {bob:0.9 * Math.cos(2 * ph) - 0.5, pelvis:[0.05, 0.1 * sn, 0.045 * sn], chest:[0.04, -0.17 * sn, -0.05 * sn], head:[-0.04, 0.07 * sn, 0.03 * sn],
      thL:[-0.62 * sn, 0, 0.03], thR:[0.62 * sn, 0, -0.03], shL:[lift(cs), 0, 0], shR:[lift(-cs), 0, 0],
      upL:[A.upL[0] + 0.48 * sn, 0, A.upL[2] + 0.04], loL:[A.loL[0] - 0.28 * Math.max(0, -sn), 0, 0],
      upR:[A.upR[0] - wk * sn, 0, A.upR[2] - 0.04], loR:[A.loR[0] - 0.22 * Math.max(0, sn) * (wk / 0.36), 0, 0],
      hdR:A.hdR || Z3, hdL:A.hdL || Z3,
      cape:[0.3 + 0.07 * Math.cos(2 * ph), 0, 0.05 * sn], cape2:[0.1 + 0.12 * Math.sin(2 * ph - 1.1), 0, 0.06 * Math.sin(ph - 0.9)], cape3:[0.12 + 0.14 * Math.sin(2 * ph - 2.2), 0, 0.08 * Math.sin(ph - 1.8)]}; }},
  melee:{n:8, fn:(t, rec) => {
    const shield = rec.parts.some(q => q.z === 'shield');
    const base = Object.assign({bob:-0.6, pelvis:Z3, chest:Z3, head:Z3, thL:[-0.35, 0, 0.05], shL:[0.25, 0, 0], thR:[0.3, 0, -0.05], shR:[0.22, 0, 0], cape:[0.15, 0, 0], cape2:[-0.02, 0, 0], cape3:Z3, hdR:Z3, hdL:Z3},
      shield ? {upL:[-0.9, 0, 0.25], loL:[-0.9, 0, 0]} : {upL:[-0.3, 0, 0.3], loL:[-0.85, 0, 0]}, rec.grip === 'staff' ? {hdR:[1, 0, 0]} : {});
    const mk = o => { const p = Object.assign({}, base, o); if (rec.grip === 'thrust') p.hdR = [-(p.upR[0] + p.loR[0]) - 0.15, 0, 0]; return p; };
    const lunge = {thL:[-0.5, 0, 0.05], shL:[0.35, 0, 0], thR:[0.42, 0, -0.05]};
    const K = rec.grip === 'thrust' ? [
        [0, mk({upR:[-0.4, 0, -0.2], loR:[-1.1, 0, 0]})],
        [0.34, mk({upR:[0.3, 0, -0.25], loR:[-1.9, 0, 0], chest:[0.1, 0.42, 0], pelvis:[0, 0.14, 0], bob:-0.3, cape:[0.1, 0, 0]})],
        [0.52, mk({upR:[-1.0, 0, -0.08], loR:[-0.55, 0, 0], chest:[-0.12, 0, 0], cape:[0.22, 0, 0], cape2:[0.06, 0, 0]})],
        [0.64, mk(Object.assign({upR:[-1.48, 0, 0], loR:[-0.05, 0, 0], chest:[-0.26, -0.36, 0], pelvis:[0.06, -0.14, 0], bob:-1.4, cape:[0.4, 0, 0], cape2:[0.14, 0, 0], cape3:[0.1, 0, 0]}, lunge))],
        [0.82, mk(Object.assign({upR:[-1.4, 0, 0], loR:[-0.15, 0, 0], chest:[-0.22, -0.3, 0], bob:-1.2, cape:[0.3, 0, 0], cape2:[0.16, 0, 0], cape3:[0.12, 0, 0]}, lunge))],
        [1, mk({upR:[-0.4, 0, -0.2], loR:[-1.1, 0, 0], cape:[0.2, 0, 0], cape2:[0.08, 0, 0], cape3:[0.1, 0, 0]})]]
      : [
        [0, mk({upR:[-0.5, 0, -0.2], loR:[-0.7, 0, 0]})],
        [0.34, mk({upR:[-2.8, 0, -0.4], loR:[-1.05, 0, 0], chest:[0.12, 0.48, 0], pelvis:[0, 0.16, 0], head:[0, -0.22, 0], bob:-0.2, cape:[0.08, 0, 0], cape2:[0.02, 0, 0]})],
        [0.5, mk({upR:[-1.7, 0, -0.15], loR:[-0.3, 0, 0], chest:[-0.12, 0.1, 0], pelvis:[0.02, 0.05, 0], cape:[0.2, 0, 0], cape2:[0.06, 0, 0], cape3:[0.08, 0, 0]})],
        [0.62, mk(Object.assign({upR:[-0.55, 0, 0.05], loR:[-0.1, 0, 0], chest:[-0.3, -0.34, 0], pelvis:[0.06, -0.12, 0], head:[0.06, 0.16, 0], bob:-1.4, cape:[0.36, 0, 0.05], cape2:[0.1, 0, 0], cape3:[0.08, 0, 0]}, lunge))],
        [0.8, mk(Object.assign({upR:[0.05, 0, 0.15], loR:[-0.22, 0, 0], chest:[-0.26, -0.38, 0], pelvis:[0.05, -0.12, 0], bob:-1.2, cape:[0.32, 0, 0.06], cape2:[0.16, 0, 0.04], cape3:[0.12, 0, 0.05]}, lunge))],
        [1, mk({upR:[-0.5, 0, -0.2], loR:[-0.7, 0, 0], cape:[0.2, 0, 0], cape2:[0.06, 0, 0], cape3:[0.1, 0, 0]})]];
    return keyedT(K, t); }},
  shoot:{n:6, fn:(t, rec) => {
    const base = {bob:-0.4, pelvis:Z3, head:Z3, thL:[-0.22, 0, 0.07], thR:[0.22, 0, -0.07], shL:[0.12, 0, 0], shR:[0.16, 0, 0], cape:[0.12, 0, 0], cape2:[-0.02, 0, 0], cape3:Z3, hdR:Z3, hdL:Z3, chest:Z3};
    const mk = o => Object.assign({}, base, o);
    const K = rec.grip === 'bow' ? [
        [0, mk({upL:[-1.45, 0, 0.05], loL:Z3, hdL:[1.45, 0, 0], upR:[-1.2, 0, -0.1], loR:[-1.2, 0, 0], chest:[0, 0.1, 0]})],
        [0.45, mk({upL:[-1.5, 0, 0.05], loL:Z3, hdL:[1.5, 0, 0], upR:[-1.45, 0, -0.15], loR:[-2.55, 0, 0], chest:[0, 0.3, 0], head:[0, -0.12, 0]})],
        [0.62, mk({upL:[-1.5, 0, 0.05], loL:Z3, hdL:[1.5, 0, 0], upR:[-1.45, 0, -0.15], loR:[-2.6, 0, 0], chest:[0, 0.3, 0], head:[0, -0.12, 0]})],
        [0.74, mk({upL:[-1.45, 0, 0.05], loL:Z3, hdL:[1.45, 0, 0], upR:[-0.95, 0, -0.65], loR:[-1.25, 0, 0], chest:[0, 0.12, 0], cape:[0.2, 0, 0], cape2:[0.06, 0, 0]})],
        [1, mk({upL:[-1.45, 0, 0.05], loL:Z3, hdL:[1.45, 0, 0], upR:[-1.2, 0, -0.1], loR:[-1.2, 0, 0], chest:[0, 0.1, 0]})]]
      : [
        [0, mk({upR:[-1.3, 0, 0], loR:[-0.4, 0, 0], upL:[-1.1, 0, 0.1], loL:[-0.6, 0, 0]})],
        [0.4, mk({upR:[-1.55, 0, 0], loR:[-0.1, 0, 0], upL:[-1.2, 0, 0.1], loL:[-0.5, 0, 0], chest:[-0.1, -0.2, 0]})],
        [0.6, mk({upR:[-1.75, 0, 0], loR:[-0.1, 0, 0], upL:[-1.25, 0, 0.1], loL:[-0.5, 0, 0], chest:[0.05, -0.1, 0], cape:[0.18, 0, 0]})],
        [1, mk({upR:[-1.3, 0, 0], loR:[-0.4, 0, 0], upL:[-1.1, 0, 0.1], loL:[-0.6, 0, 0]})]];
    return keyedT(K, t); }}
});
for (const k in R3DP) delete R3DP[k];
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx53')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx53"><b>3D figures.</b> The 3D Chapter now stands about seven and a half heads tall in a muted, grimmer palette, with flowing cloaks and looser movement.</p>`);
  };
}
/* ===== END INDEX 53 ======================================================= */

/* ============================================================================
   INDEX 54 - 3D ARMOUR WEIGHTS AND SPECIALTY GEAR AS SWAPPABLE PARTS
   Every 3D figure is now assembled from four independent part sets:
     body (race, sex)  +  armour (light | medium | heavy)  +  specialty kit
     +  weapon and shield
   so every race, sex, specialty and armour combination builds.
   ARMOUR      light   padded gambeson or leather jerkin, tunic skirt, bracers
               medium  mail hauberk to the knee under a leather jerkin, mail
                       sleeves, leather pauldrons, gorget, greave straps
               heavy   breastplate and plackart, layered pauldrons, tassets on
                       the thighs, couters, vambraces, gauntlets, greaves,
                       knee cops and sabatons
               Robed specialties wear theirs under or over the robe (medium:
               mail sleeves and collar; heavy: breastplate, pauldrons,
               gauntlets and sabatons over the robe).
               The Quartermaster armour sets the weight and the material
               colour (ARMOUR3D_OF): rags/padded/leather light; brigandine,
               chain shirt, hide and scale medium; heavy chain, cuirass, splint,
               lamellar and half-plate heavy.
   KITS        Soldier  helm by weight (kettle hat, nasal helm with mail
                        aventail, great helm with plume), shield, melee weapon
               Folk Hero hood and cowl, hip quiver with fletchings, long or
                        short bow, hip sword
               Scoundrel low hood, face mask, a dagger in each hand,
                        bandolier and belt pouches
               Cleric   robe, tabard with a gold sun holy symbol, amulet,
                        mace, book on the hip, circlet
               Mage     tall hat, staff with orb, satchel, scroll case, sash
               Witch    wide crooked hat, gnarled staff with a green orb and
                        hanging fetish, shawl, pouches
               Bard     feathered cap, slung lute, short sword (ready for the
                        camp Bard, who is not drawn in 3D yet)
   SHIELDS     none | buckler | heater | tower (bucklers, no shield and heavy
               infantry shields in the Quartermaster map to buckler, none and
               heater; tower is available to recipes)
   Saves: nothing new. Rollback: delete from this comment to END INDEX 54.

   3D DESIGN NOTE, ADDENDUM (read with Index 50, 51 and 53)
     r3dRecipeFor(p, isLeader, opt) now builds from these tables. opt can force
     {weight, material, weapon, shield, ranged}, which is how the contact sheet
     shows every weight without changing the Quartermaster.
       R3D_ARMOUR[weight](D, ctx)  -> parts       (ctx: {robe, fem, mat})
       R3D_KITS[spec](D, ctx)      -> {head:[parts on the head bone], parts,
                                       grip, main, off, hair:'keep'|'short'|'hide'}
       R3D_HELMS[name](hk, hy)     -> head parts
       R3D_SHIELDS[name](D)        -> parts on loL
       WEAPON3D[name]()            -> parts in the hand frame
       R3D_MATS[material]          -> zone colours for that armour material
     To add an armour piece: push parts in the matching R3D_ARMOUR entry.
     To add a specialty: add an R3D_KITS entry (and a SPEC_LOOK colour set).
     New zones used: cloth clothD mail plate tabard fur feather mask slit
     paper fetish trim strap.
============================================================================ */
R3D.METAL.add('mail'); R3D.METAL.add('plate');
const ARMOUR3D_OF = {rags:['light', 'rags'], padded:['light', 'padded'], leather:['light', 'leather'], brigandine:['medium', 'brigandine'],
  chainshirt:['medium', 'chain'], hide:['medium', 'hide'], scale:['medium', 'scale'], heavychain:['heavy', 'chain'], cuirass:['heavy', 'plate'],
  splint:['heavy', 'bands'], lamellar:['heavy', 'lamellar'], halfplate:['heavy', 'plate'], clothes:['light', 'padded']};
const R3D_MATS = {
  rags:{cloth:'#7d6e52'}, padded:{cloth:'#a8946c'}, leather:{cloth:'#6e4a2a'},
  brigandine:{cloth:'#5a3a2e', mail:'#7a7f86'}, chain:{cloth:'#5c4632', mail:'#8e959d'}, hide:{cloth:'#7a5e3c', mail:'#7a6248', fur:'#6e5a40'},
  scale:{cloth:'#5c4632', mail:'#8a8f86'}, plate:{plate:'#b0b8c0', mail:'#858c94'}, bands:{plate:'#949ca4', mail:'#7f868e'}, lamellar:{plate:'#9a8456', mail:'#7f868e'}
};

/* ---- armour by weight ---- */
const R3D_ARMOUR = {
  light:(D, x) => {
    const s = D.s, w = D.w, P = [];
    if (!x.robe){
      P.push({b:'chest', t:'ell', c:[0, 11.5 * s, 0.3], r:[(x.fem ? 8.7 : 9.6) * w, 8.6 * s, 6.3 * w], z:'cloth'});
      if (x.mat === 'padded') for (const y of [8, 11, 14]) P.push({b:'chest', t:'box', c:[0, y * s, 5.9 * w], r:[6.4 * w, 0.35, 0.5], z:'clothD'});
      P.push({b:'pelvis', t:'ell', c:[0, -5.5 * s, 0.3], r:[8.6 * w, 7.2 * s, 6.5 * w], z:'cloth'});
      for (const b of ['upL', 'upR']) P.push({b, t:'cap', a:[0, 0, 0], p:[0, -11.5 * s, 0], r:2.85 * w, z:'cloth'});
    }
    for (const b of ['loL', 'loR']) P.push({b, t:'cap', a:[0, -4 * s, 0], p:[0, -9.5 * s, 0], r:2.5 * w, z:'leather'});
    return P;
  },
  medium:(D, x) => {
    const s = D.s, w = D.w, P = [];
    for (const b of ['loL', 'loR']) P.push({b, t:'cap', a:[0, -3.5 * s, 0], p:[0, -9.8 * s, 0], r:2.55 * w, z:x.robe ? 'mail' : 'leather'});
    P.push({b:'chest', t:'ell', c:[0, 18.6 * s, -0.2], r:[5.4 * w, 2.1 * s, 4.9 * w], z:'mail'});                       // gorget
    if (x.robe) return P;
    P.push({b:'chest', t:'ell', c:[0, 11.5 * s, 0.4], r:[(x.fem ? 9 : 9.9) * w, 8.8 * s, 6.7 * w], z:'mail'},
           {b:'chest', t:'ell', c:[0, 10.8 * s, 0.9], r:[(x.fem ? 8.4 : 9.2) * w, 7.6 * s, 6.5 * w], z:x.mat === 'hide' ? 'fur' : 'cloth'},
           {b:'pelvis', t:'ell', c:[0, -8.5 * s, 0.3], r:[9.4 * w, 10.5 * s, 7.1 * w], z:'mail'});
    for (const [b, sx] of [['upL', 1], ['upR', -1]]) P.push({b, t:'cap', a:[0, 0, 0], p:[0, -10 * s, 0], r:3 * w, z:'mail'}, {b, t:'ell', c:[sx * 0.6, -0.4, 0], r:[4.3 * w, 2.9, 4.6], z:'leather'});
    for (const b of ['shL', 'shR']) P.push({b, t:'box', c:[0, -6 * s, 2.3 * w], r:[2.2 * w, 0.5, 0.5], z:'strap'}, {b, t:'box', c:[0, -10 * s, 2.3 * w], r:[2.2 * w, 0.5, 0.5], z:'strap'});
    return P;
  },
  heavy:(D, x) => {
    const s = D.s, w = D.w, P = [];
    P.push({b:'chest', t:'ell', c:[0, 12.3 * s, 0.9], r:[(x.fem ? 9.3 : 10.2) * w, 8.7 * s, 7.2 * w], z:'plate'},
           {b:'chest', t:'ell', c:[0, 5.2 * s, 0.8], r:[8.3 * w, 5.8 * s, 6.2 * w], z:'plate'},
           {b:'chest', t:'ell', c:[0, 18.8 * s, -0.2], r:[5.6 * w, 2.2 * s, 5.1 * w], z:'plate'});
    for (const [b, sx] of [['upL', 1], ['upR', -1]]) P.push({b, t:'ell', c:[sx * 0.9, -0.2, 0], r:[5.6 * w, 3.9, 5.8], z:'plate'}, {b, t:'ell', c:[sx * 1.3, -3.4, 0], r:[4.7 * w, 2.6, 5], z:'plate'});
    for (const b of ['loL', 'loR']) P.push({b, t:'ell', c:[0, 0, -0.3], r:[2.9 * w, 2.6, 3], z:'plate'}, {b, t:'cap', a:[0, -2.5 * s, 0], p:[0, -9.5 * s, 0], r:2.7 * w, z:'plate'});
    for (const b of ['hdL', 'hdR']) P.push({b, t:'ell', c:[0, 0.3, 0.5], r:[2.5 * w, 2.6, 2.5], z:'plate'});
    for (const b of ['thL', 'thR']) P.push({b, t:'box', c:[0, -3.8 * s, 2.7 * w], r:[3.3 * w, 4.4 * s, 0.75], rot:[-0.12, 0, 0], z:'plate'});
    for (const b of ['shL', 'shR']) P.push({b, t:'ell', c:[0, 0, 0.6], r:[3.1 * w, 2.6, 3.2], z:'plate'}, {b, t:'cap', a:[0, -2.5 * s, 0.5], p:[0, -12.5 * s, 0.5], r:3 * w, z:'plate'},
                                           {b, t:'ell', c:[0, -14.8 * s, 1.8], r:[3 * w, 2.6 * s, 4.9 * s], z:'plate'});
    if (!x.robe) P.push({b:'pelvis', t:'ell', c:[0, -3 * s, 0.4], r:[9.4 * w, 5.4 * s, 7 * w], z:'mail'});
    return P;
  }
};

/* ---- helms ---- */
const R3D_HELMS = {
  kettle:(hk, hy) => [{t:'ell', c:[0, hy + 2.6 * hk, -0.4], r:[6.7 * hk, 4.6 * hk, 6.7 * hk], z:'helm'}, {t:'ell', c:[0, hy + 2.3 * hk, -0.4], r:[9.6 * hk, 0.85, 9.6 * hk], z:'helm'}],
  nasal:(hk, hy) => [{t:'ell', c:[0, hy + 2.8 * hk, -0.3], r:[6.9 * hk, 5.6 * hk, 6.9 * hk], z:'helm'}, {t:'box', c:[0, hy + 0.4 * hk, 6.8 * hk], r:[0.6, 2.6 * hk, 0.5], z:'helm'},
                     {t:'ell', c:[0, hy - 3 * hk, -0.6], r:[6.9 * hk, 4.4 * hk, 6.6 * hk], z:'mail'}],
  great:(hk, hy) => [{t:'ell', c:[0, hy + 0.6 * hk, 0], r:[7 * hk, 8 * hk, 7 * hk], z:'helm'}, {t:'box', c:[0, hy + 0.9 * hk, 6.7 * hk], r:[4.4 * hk, 0.55, 0.6], z:'slit'},
                     {t:'box', c:[0, hy - 1.6 * hk, 6.8 * hk], r:[0.5, 3 * hk, 0.5], z:'slit'},
                     {t:'cap', a:[0, hy + 7.6 * hk, -0.5], p:[0, hy + 9.4 * hk, -6.5 * hk], r:1.5, z:'trim'}, {t:'cap', a:[0, hy + 9.4 * hk, -6.5 * hk], p:[0, hy + 6 * hk, -10.5 * hk], r:1.2, z:'trim'}],
  hood:(hk, hy) => [{t:'ell', c:[0, hy + 1.2 * hk, -2.6 * hk], r:[7.3 * hk, 7.6 * hk, 7.2 * hk], z:'hood'}, {t:'ell', c:[0, hy - 5 * hk, -1.8 * hk], r:[8.4 * hk, 3.2 * hk, 6.6 * hk], z:'hood'}],
  lowhood:(hk, hy) => [{t:'ell', c:[0, hy + 1.6 * hk, -1.6 * hk], r:[7 * hk, 7 * hk, 7.1 * hk], z:'hood'}, {t:'ell', c:[0, hy + 4 * hk, 4.4 * hk], r:[6 * hk, 2.2 * hk, 2.6 * hk], z:'hood'},
                       {t:'box', c:[0, hy - 2.4 * hk, 5.6 * hk], r:[5 * hk, 2.6 * hk, 1], z:'mask'}],
  circlet:(hk, hy) => [{t:'box', c:[0, hy + 3.2 * hk, 5.5 * hk], r:[3.6 * hk, 0.55, 0.6], z:'gold'}, {t:'ell', c:[0, hy + 3.4 * hk, 6.1 * hk], r:[0.9, 0.9, 0.6], z:'orb'}],
  wizard:(hk, hy) => { const top = hy + 6.6 * hk; return [{t:'ell', c:[0, top - 1.2, -0.4], r:[8.4 * hk, 1, 8.4 * hk], z:'hat'}, {t:'ell', c:[0, top + 1.8, -0.8], r:[5 * hk, 3.4, 5 * hk], z:'hat'},
    {t:'ell', c:[0, top + 5.4, -1.8], r:[3.4 * hk, 3, 3.4 * hk], z:'hat'}, {t:'ell', c:[0, top + 8.4, -3.2], r:[2 * hk, 2.6, 2 * hk], z:'hat'}, {t:'ell', c:[0, top + 10.4, -4.6], r:[1.1, 1.8, 1.1], z:'hat'},
    {t:'box', c:[0, top + 0.4, 0], r:[5.1 * hk, 0.6, 5.1 * hk], z:'trim'}]; },
  witch:(hk, hy) => { const top = hy + 6.6 * hk; return [{t:'ell', c:[0, top - 1.4, -0.4], r:[11 * hk, 0.9, 11 * hk], rot:[0.12, 0, 0.08], z:'hat'}, {t:'ell', c:[0, top + 1.8, -0.9], r:[5 * hk, 3.4, 5 * hk], z:'hat'},
    {t:'ell', c:[0.8, top + 5.2, -2.6], r:[3.2 * hk, 3, 3.2 * hk], z:'hat'}, {t:'ell', c:[2, top + 7.8, -5], r:[1.9 * hk, 2.6, 1.9 * hk], z:'hat'}, {t:'cap', a:[2, top + 9, -6], p:[4.5, top + 8.6, -9.5], r:0.9, z:'hat'},
    {t:'box', c:[0, top + 0.3, 0], r:[5.1 * hk, 0.6, 5.1 * hk], z:'trim'}]; },
  feathered:(hk, hy) => [{t:'ell', c:[0.8, hy + 4.6 * hk, -0.4], r:[7 * hk, 2.6 * hk, 7 * hk], rot:[0, 0, -0.18], z:'hat'},
                         {t:'cap', a:[-4 * hk, hy + 5.6 * hk, -1], p:[-6 * hk, hy + 12 * hk, -6 * hk], r:1.1, z:'feather'}, {t:'ell', c:[-5.4 * hk, hy + 10.6 * hk, -5 * hk], r:[1, 2.6, 1.2], z:'feather'}]
};

/* ---- shields (on the left forearm) ---- */
const R3D_SHIELDS = {
  none:() => [],
  buckler:D => { const w = D.w, s = D.s; return [{b:'loL', t:'ell', c:[3.2 * w, -6.5 * s, 1], r:[0.9, 4.3, 4.3], z:'shield'}, {b:'loL', t:'ell', c:[4 * w, -6.5 * s, 1], r:[0.9, 1.4, 1.4], z:'metal'}]; },
  heater:D => { const w = D.w, s = D.s; return [{b:'loL', t:'box', c:[3.3 * w, -4.4 * s, 1], r:[0.85, 4.4 * s, 5.4], z:'shield'}, {b:'loL', t:'ell', c:[3.3 * w, -9.2 * s, 1], r:[0.85, 4.2 * s, 4.4], z:'shield'},
    {b:'loL', t:'box', c:[4.1 * w, -5 * s, 1], r:[0.4, 4.6 * s, 0.7], z:'trim'}, {b:'loL', t:'box', c:[4.1 * w, -3.4 * s, 1], r:[0.4, 0.7, 3.4], z:'trim'}]; },
  tower:D => { const w = D.w, s = D.s; return [{b:'loL', t:'box', c:[3.4 * w, -6 * s, 1], r:[1, 10.5 * s, 6.2], z:'shield'}, {b:'loL', t:'box', c:[4.4 * w, -6 * s, 1], r:[0.4, 10.6 * s, 0.6], z:'metal'},
    {b:'loL', t:'ell', c:[4.5 * w, -6 * s, 1], r:[0.7, 2, 2], z:'metal'}]; }
};

/* ---- more weapons ---- */
Object.assign(WEAPON3D, {
  shortsword:() => WEAPON3D.sword(),
  longbow:() => { const pts = [[0, -19, -0.6], [0, -10, 2.4], [0, 0, 3.4], [0, 10, 2.4], [0, 19, -0.6]], out = [];
                  for (let i = 0; i < 4; i++) out.push({t:'cap', a:pts[i], p:pts[i + 1], r:0.75, z:'wood'});
                  out.push({t:'cap', a:[0, -19, -0.7], p:[0, 19, -0.7], r:0.22, z:'string'}, {t:'ell', c:[0, 0, 3.2], r:[1, 1.8, 1], z:'leather'}); return out; },
  gnarled:() => { const pts = [[0, -15, 0], [0.8, -6, 0.4], [-0.6, 4, -0.3], [0.9, 13, 0.3], [-0.4, 20, 0], [1.6, 23, 0.6]], out = [];
                  for (let i = 0; i < 5; i++) out.push({t:'cap', a:pts[i], p:pts[i + 1], r:1.05 - i * 0.06, z:'wood'});
                  out.push({t:'cap', a:[-0.4, 20, 0], p:[-2.2, 24, 0], r:0.6, z:'wood'}, {t:'ell', c:[0.3, 22.4, 0.2], r:[1.9, 1.9, 1.9], z:'orb'},
                           {t:'cap', a:[1.2, 18, 0], p:[2.2, 13.5, 0], r:0.25, z:'string'}, {t:'ell', c:[2.3, 12.8, 0], r:[0.9, 1.2, 0.9], z:'fetish'}); return out; },
  holymace:() => [{t:'cap', a:[0, 0, -2], p:[0, 0, 10], r:0.85, z:'wood'}, {t:'ell', c:[0, 0, 11.5], r:[2.4, 2.4, 2.4], z:'metal'},
                  {t:'box', c:[0, 0, 11.5], r:[3.3, 0.5, 0.9], z:'gold'}, {t:'box', c:[0, 0, 11.5], r:[0.5, 3.3, 0.9], z:'gold'}],
  daggerL:() => [{t:'box', c:[0, 0, 5.2], r:[0.45, 1, 3.6], z:'metal'}, {t:'box', c:[0, 0, 1.4], r:[0.7, 2, 0.6], z:'gold'}]
});

/* ---- specialty kits ---- */
const R3D_KITS = {
  SOLDIER:(D, x) => ({helm:x.weight === 'heavy' ? 'great' : x.weight === 'medium' ? 'nasal' : 'kettle', hair:'hide', main:x.melee, shield:x.shield, parts:[]}),
  FOLK_HERO:(D, x) => { const s = D.s, w = D.w;
    const P = [{b:'chest', t:'ell', c:[0, 15.8 * s, -0.8], r:[(x.weight === 'heavy' ? 11.4 : 10.4) * w, 3.6 * s, 7.6 * w], z:'hood'}];
    P.push({b:'pelvis', t:'cap', a:[-7.6 * w, 2 * s, -2.4], p:[-6.4 * w, -10 * s, -0.6], r:2.2, z:'leather'});
    for (const [dx, dz] of [[-0.6, -0.4], [0.5, 0.3], [-0.1, 0.9]]) P.push({b:'pelvis', t:'ell', c:[-7.8 * w + dx, 3.8 * s, -2.6 + dz], r:[0.55, 1.6, 0.55], z:'feather'});
    P.push({b:'pelvis', t:'cap', a:[6.6 * w, -1 * s, 1.8], p:[7.2 * w, -11 * s, 4], r:0.7, z:'leather'});
    return {helm:'hood', hair:'keep', main:x.ranged === 'xbow' ? 'xbow' : x.ranged === 'longbow' ? 'longbow' : 'bow', parts:P}; },
  SCOUNDREL:(D, x) => { const s = D.s, w = D.w;
    const P = [{b:'chest', t:'cap', a:[-8 * w, 17 * s, 5 * w], p:[7.4 * w, 3 * s, 5.6 * w], r:0.9, z:'strap'}];
    for (const sx of [1, -1]) P.push({b:'pelvis', t:'ell', c:[sx * 6.4 * w, -0.5 * s, 4.4 * w], r:[1.8, 2, 1.4], z:'leather'});
    return {helm:'lowhood', hair:'keep', main:'dagger', off:'daggerL', parts:P}; },
  CLERIC:(D, x) => { const s = D.s, w = D.w;
    const P = [{b:'chest', t:'box', c:[0, 9 * s, 6.2 * w], r:[4.6 * w, 9 * s, 0.6], z:'tabard'}, {b:'pelvis', t:'box', c:[0, -9 * s, 6.6 * w], r:[4.2 * w, 10 * s, 0.6], z:'tabard'},
      {b:'chest', t:'ell', c:[0, 12 * s, 7 * w], r:[3, 3, 0.7], z:'gold'}];
    for (let i = 0; i < 4; i++){ const a = i * Math.PI / 4; P.push({b:'chest', t:'box', c:[0, 12 * s, 7.1 * w], r:[4.8, 0.55, 0.45], rot:[0, 0, a], z:'gold'}); }
    P.push({b:'chest', t:'ell', c:[0, 16.4 * s, 6 * w], r:[1.1, 1.1, 0.5], z:'gold'}, {b:'pelvis', t:'box', c:[7.4 * w, -2 * s, 1.5], r:[1, 3.2, 2.6], z:'paper'}, {b:'pelvis', t:'box', c:[7.9 * w, -2 * s, 1.5], r:[0.4, 3.4, 2.8], z:'leather'});
    return {helm:x.weight === 'heavy' ? 'nasal' : 'circlet', hair:x.weight === 'heavy' ? 'hide' : 'short', main:'holymace', robe:true, parts:P}; },
  MAGE:(D, x) => { const s = D.s, w = D.w;
    return {helm:'wizard', hair:'keep', main:'staff', robe:true, parts:[{b:'pelvis', t:'box', c:[7.2 * w, -3 * s, 0.4], r:[1.4, 3.4, 3], z:'leather'},
      {b:'chest', t:'cap', a:[-7 * w, 17 * s, 5.8 * w], p:[7.4 * w, 0 * s, 6 * w], r:0.8, z:'leather'}, {b:'chest', t:'cap', a:[4 * w, 17 * s, -7 * w], p:[-4 * w, 6 * s, -7.4 * w], r:1.5, z:'leather'},
      {b:'pelvis', t:'box', c:[0, -0.6 * s, 0], r:[8.4 * w, 1.1 * s, 6.3 * w], z:'trim'}]}; },
  WITCH:(D, x) => { const s = D.s, w = D.w;
    const P = [{b:'chest', t:'ell', c:[0, 15.5 * s, 0.4], r:[10.6 * w, 4 * s, 7.4 * w], z:'fur'}];
    for (const sx of [1, -1, 0.3]) P.push({b:'pelvis', t:'ell', c:[sx * 6.6 * w, -1.5 * s, 4.6 * w], r:[1.6, 2.2, 1.4], z:sx === 0.3 ? 'fetish' : 'leather'});
    return {helm:'witch', hair:'keep', main:'gnarled', robe:true, parts:P}; },
  BARD:(D, x) => { const s = D.s, w = D.w;
    return {helm:'feathered', hair:'keep', main:window.BARD_SWORD === true ? 'shortsword' : 'fist' /* F-42b: his hand held a shortsword that read as tapping a sword on his knee; window.BARD_SWORD = true brings it back */, parts:[
      {b:'chest', t:'ell', c:[-1.6 * w, 7.5 * s, 7.6 * w], r:[4.2, 5.4, 2], rot:[0, 0, 0.75], z:'wood'}, {b:'chest', t:'ell', c:[-1.6 * w, 7.5 * s, 9.2 * w], r:[1.2, 1.2, 0.5], z:'slit'},
      {b:'chest', t:'cap', a:[1.6 * w, 10.5 * s, 7.6 * w], p:[7.6 * w, 18 * s, 6.4 * w], r:0.8, z:'wood'}, {b:'chest', t:'box', c:[8.2 * w, 19 * s, 6.2 * w], r:[0.9, 1.8, 0.7], rot:[0, 0, 0.75], z:'wood'},
      {b:'chest', t:'cap', a:[-6 * w, 18 * s, 6 * w], p:[5 * w, 4 * s, 7 * w], r:0.6, z:'strap'}]}; }
};

/* ---- the builder ---- */
function r3dHeadParts(R, look, fem, hk, hairMode){
  const H = [], hy = 6.2 * hk;
  H.push({t:'ell', c:[0, hy, 0], r:[6 * hk, 6.6 * hk, 6.1 * hk], z:'skin'});
  for (const sx of [1, -1]) H.push({t:'ell', c:[sx * 2.3 * hk, hy + 0.4 * hk, 5.35 * hk], r:[1.05, 1.2, 0.8], z:'eye'}, {t:'box', c:[sx * 2.4 * hk, hy + 2.2 * hk, 5.5 * hk], r:[1.5, 0.45, 0.5], rot:[0, 0, sx * 0.15], z:'hair'});
  const nose = R.nose === 'big' ? {t:'ell', c:[0, hy - 1.2 * hk, 6.2 * hk], r:[1.9, 2.1, 2]} : R.nose === 'long' ? {t:'ell', c:[0, hy - 0.6 * hk, 6.8 * hk], r:[1, 1.2, 2.6]} : {t:'ell', c:[0, hy - 0.8 * hk, 6 * hk], r:[1, 1.4, 1.2]};
  nose.z = 'skin'; H.push(nose);
  if (R.muzzle) H.push({t:'ell', c:[0, hy - 1.8 * hk, 5 * hk], r:[3.4 * hk, 2.6 * hk, 2.6 * hk], z:'skin'});
  const ear = R.ears || 'human';
  for (const sx of [1, -1]){
    if (ear === 'elf') H.push({t:'ell', c:[sx * 6.3 * hk, hy + 1.6 * hk, -1.2 * hk], r:[0.8, 1.3, 3.8 * hk], rot:[-0.7, 0, 0], z:'skin'});
    else if (ear === 'half') H.push({t:'ell', c:[sx * 6.2 * hk, hy + 1 * hk, -0.6 * hk], r:[0.8, 1.4, 2.4 * hk], rot:[-0.5, 0, 0], z:'skin'});
    else if (ear === 'big') H.push({t:'ell', c:[sx * 8 * hk, hy + 1.2 * hk, 0], r:[4.6 * hk, 1.7, 0.9], rot:[0, 0, sx * 0.35], z:'skin'});
    else if (ear === 'cat') H.push({t:'ell', c:[sx * 3.9 * hk, hy + 6.2 * hk, -0.4], r:[1.9, 3.2, 1.1], rot:[0, 0, -sx * 0.25], z:'skin'});
    else if (ear === 'small') H.push({t:'ell', c:[sx * 6.1 * hk, hy, 0], r:[0.9, 1.3, 1.2], z:'skin'});
    else H.push({t:'ell', c:[sx * 6 * hk, hy, 0], r:[0.9, 1.6, 1.2], z:'skin'});
    if (R.tusks) H.push({t:'ell', c:[sx * 2 * hk, hy - 3.2 * hk, 5.3 * hk], r:[0.75, 1.6, 0.75], rot:[-0.25, 0, 0], z:'bone'});
    if (R.horns) H.push({t:'cap', a:[sx * 3.4 * hk, hy + 5 * hk, 1], p:[sx * 5.6 * hk, hy + 8.6 * hk, -2], r:1.4, z:'horn'},
                        {t:'cap', a:[sx * 5.6 * hk, hy + 8.6 * hk, -2], p:[sx * 6.2 * hk, hy + 9.6 * hk, -4.8], r:0.9, z:'horn'});
  }
  const hs = hairMode === 'short' ? 'short' : look.hairStyle;
  if (hairMode !== 'hide'){
    if (hs !== 'bald') H.push({t:'ell', c:[0, hy + 1.5 * hk, -1.3 * hk], r:[6.4 * hk, 6.2 * hk, 6.4 * hk], z:'hair'});
    if (hs === 'long' || (fem && !['bun', 'braids', 'ponytail', 'short'].includes(hs))) H.push({t:'ell', c:[0, hy - 3.5 * hk, -4.2 * hk], r:[5.6 * hk, 7.5 * hk, 2.8 * hk], z:'hair'});
    if (hs === 'ponytail') H.push({t:'cap', a:[0, hy + 2 * hk, -6 * hk], p:[0, hy - 7 * hk, -7.4 * hk], r:1.9 * hk, z:'hair'});
    if (hs === 'bun') H.push({t:'ell', c:[0, hy + 4 * hk, -6 * hk], r:[2.6 * hk, 2.6 * hk, 2.4 * hk], z:'hair'});
    if (hs === 'topknot') H.push({t:'ell', c:[0, hy + 7 * hk, -1.5 * hk], r:[2 * hk, 2.4 * hk, 2 * hk], z:'hair'});
  }
  if (hs === 'braids') for (const sx of [1, -1]) H.push({t:'cap', a:[sx * 4.6 * hk, hy - 1 * hk, 2 * hk], p:[sx * 4.4 * hk, hy - 11 * hk, 3.4 * hk], r:1.5 * hk, z:'hair'});
  if (look.beard && !fem) H.push(R.beard === 'long' ? {t:'ell', c:[0, hy - 5.2 * hk, 4 * hk], r:[5.6 * hk, 6.6 * hk, 3.6 * hk], z:'hair'} : {t:'ell', c:[0, hy - 3.4 * hk, 4.2 * hk], r:[4.8 * hk, 4.2 * hk, 3 * hk], z:'hair'});
  if (R.halo) H.push({t:'ell', c:[0, hy + 10.5 * hk, -1], r:[4.6 * hk, 0.55, 4.6 * hk], z:'glow'});
  return {H, hy};
}
function r3dShieldOf(id){ return id === 'none' ? 'none' : id === 'heavyshield' ? 'heater' : id === 'tower' ? 'tower' : id === 'heater' ? 'heater' : 'buckler'; }
const r3dRangedOf = id => id === 'longbows' ? 'longbow' : id === 'crossbows' ? 'xbow' : 'bow';
const r3dMeleeOf = id => id === 'pikes' ? 'pike' : id === 'shortswords' ? 'sword' : id === 'greatswords' ? 'greatsword' : 'spear';
function r3dBuild54(p, isLeader, opt){
  opt = opt || {};
  const look = opt.look || personLook(p, isLeader), R = opt.race3d || RACE3D[p.race] || RACE3D.HUMAN, fem = sexOf(p) === 'f';   /* Index 55 */
  const sk = r3dSkeleton(R, fem), D = sk.dims, s = D.s, w = D.w, hk = D.hk, P = [];
  const add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  const g = gearLook();
  const [gw, gm] = ARMOUR3D_OF[g.armour] || ['light', 'padded'];
  let weight = opt.weight || gw, mat = opt.material || (opt.weight ? {light:'padded', medium:'chain', heavy:'plate'}[opt.weight] : gm);
  const spec = opt.kit || (R3D_KITS[p.spec] ? p.spec : 'SOLDIER');
  const ctx = {look, fem, weight, mat, melee:opt.weapon || r3dMeleeOf(g.melee), ranged:opt.ranged || r3dRangedOf(g.ranged), shield:opt.shield || r3dShieldOf(g.shield)};
  const kit = R3D_KITS[spec](D, ctx), robe = !!kit.robe;
  ctx.robe = robe;
  // body
  add('pelvis', [{t:'ell', c:[0, 0, 0], r:[8.1 * w, 5.4 * s, 5.8 * w], z:robe ? 'robe' : 'legs'}]);
  add('chest', [{t:'ell', c:[0, 4.5 * s, 0.4], r:[7.5 * w, 6.4 * s, 5.5 * w], z:robe ? 'robe' : 'top'},
                {t:'ell', c:[0, 12.5 * s, 0], r:[(fem ? 8.5 : 9.4) * w, 8.2 * s, 6.1 * w], z:robe ? 'robe' : 'top'},
                {t:'cap', a:[0, 18 * s, 0.2], p:[0, 21.8 * s, 0.4], r:2.3 * hk, z:'skin'}]);
  if (!robe) add('chest', [{t:'box', c:[0, 0.6 * s, 0.6], r:[8.6 * w, 1.1 * s, 6.3 * w], z:'leather'}, {t:'box', c:[0, 0.6 * s, 6.8 * w], r:[1.2, 1.2, 0.5], z:'gold'}]);
  if (robe) add('pelvis', [{t:'ell', c:[0, -14 * s, 0.4], r:[9.6 * w, 15.5 * s, 7.6 * w], z:'robe'}, {t:'ell', c:[0, -27 * s, 0.4], r:[10.4 * w, 3.4 * s, 8.3 * w], z:'robe'}]);
  for (const [u, l, h] of [['upL', 'loL', 'hdL'], ['upR', 'loR', 'hdR']]){
    add(u, [{t:'cap', a:[0, 0, 0], p:[0, -12 * s, 0], r:2.7 * w, z:robe ? 'robe' : 'top'}]);
    add(l, [{t:'cap', a:[0, 0, 0], p:[0, -10.5 * s, 0], r:2.25 * w, z:robe ? 'robe' : 'top'}]);
    if (robe) add(l, [{t:'ell', c:[0, -9 * s, 0], r:[3.4 * w, 2.6 * s, 3.4 * w], z:'robe'}]);
    add(h, [{t:'ell', c:[0, 0.5, 0.5], r:[2 * w, 2.2, 2], z:'skin'}]);
  }
  for (const [t, sh] of [['thL', 'shL'], ['thR', 'shR']]){
    add(t, [{t:'cap', a:[0, 0, 0], p:[0, -15 * s, 0], r:3.2 * w, z:'legs'}]);
    add(sh, [{t:'cap', a:[0, 0, 0], p:[0, -13.5 * s, 0.2], r:2.6 * w, z:'legs'}, {t:'ell', c:[0, -14.8 * s, 1.6], r:[2.8 * w, 2.5 * s, 4.6 * s], z:'boots'},
             {t:'cap', a:[0, -9 * s, 0.2], p:[0, -13.5 * s, 0.2], r:2.85 * w, z:'boots'}]);
  }
  // armour, kit, head
  P.push(...R3D_ARMOUR[weight](D, ctx));
  P.push(...kit.parts);
  const {H, hy} = r3dHeadParts(R, look, fem, hk, kit.hair);
  if (kit.helm && R3D_HELMS[kit.helm]) H.push(...R3D_HELMS[kit.helm](hk, hy));
  add('head', H);
  if (look.cape) P.push(...r3dCapeParts(D));
  // weapons and shield
  const main = WEAPON3D[kit.main] ? kit.main : 'sword', grip = WEAPON_GRIP[main] || (main === 'gnarled' ? 'staff' : main === 'longbow' ? 'bow' : 'swing');
  add(grip === 'bow' ? 'hdL' : 'hdR', WEAPON3D[main]());
  if (kit.off) add('hdL', WEAPON3D[kit.off]());
  if (kit.shield) P.push(...R3D_SHIELDS[kit.shield](D));
  // colours
  const M = Object.assign({cloth:look.top || '#8a6a4a', mail:'#858c94', plate:'#a8b0b8', fur:'#6e5a40'}, R3D_MATS[mat] || {});
  const zones = {skin:look.skin, hair:look.hair || '#3a2a1a', eye:R.glow ? '#cfeeff' : '#1a1410', top:robe ? (look.robeCol || look.top) : '#5a4a3a', legs:look.legs || '#3e3428',
    boots:'#3a2616', leather:'#5a3a22', metal:'#a8b0b8', gold:'#c9a440', wood:'#6e4626', bone:'#ddd4be', horn:'#2a2024', glow:'#ffe9a0',
    cape:look.cape || '#2e4a6a', capeTrim:look.capeTrim || look.cape || '#d4af37', robe:look.robeCol || look.top || '#5a4a6a', hat:look.hat || '#33508f',
    hood:look.hood || '#3a3a44', helm:weight === 'heavy' ? M.plate : weight === 'medium' ? '#8a9098' : '#7a7f86', shield:look.shieldCol || '#7a3e26', orb:look.orb || '#9fe0ff',
    string:'#d8d0bc', acc:look.acc || '#7a3e26', cloth:M.cloth, clothD:shade(M.cloth, 0.72), mail:M.mail, plate:M.plate, fur:M.fur, tabard:look.acc && spec === 'CLERIC' ? '#7a2424' : (look.acc || '#7a2424'),
    feather:spec === 'BARD' ? '#b03a2a' : '#d8d0c0', mask:'#22222a', slit:'#120e10', paper:'#d8cfb4', fetish:'#d0c8b0', trim:look.capeTrim || look.acc || '#8a2a2a', strap:'#4a301c'};
  if (spec === 'BARD'){ zones.hat = '#5a2a3a'; zones.top = '#6a2a3a'; }
  if (R.glow) zones.glow = '#bfe6ff';
  if (spec === 'SOLDIER' && kit.shield === 'tower') zones.shield = look.cape || zones.shield;
  return {rig:'humanoid', skel:{order:sk.order, bones:sk.bones}, parts:P, zones, grip};
}
r3dRecipeFor = function(p, isLeader, opt){
  const rec = r3dMute(r3dBuild54(p, isLeader, opt));
  rec.key = 'r3d54' + hash(JSON.stringify(rec));
  return rec;
};
for (const k in R3DP) delete R3DP[k];
R3DM.recs.clear(); R3DL.recKey = '';
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx54')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx54"><b>3D armour and kit.</b> The Quartermaster's armour shows on the 3D Chapter as light, medium or heavy, and each specialty carries its own kit: helms and shields, hooded archers with quivers, masked knife-fighters, tabarded clerics with the holy sun, mages with staves and witches with gnarled ones.</p>`);
  };
}
/* ===== END INDEX 54 ======================================================= */

