/* ============================================================================
   INDEX 96 - 3D figures
   Replaces the remaining flat combat and spectator sprites with 3D recipes:
     1. Mounted Outrider Slaver ('slaver') - chain-clad spearman in dark cloak
        riding the warhorse quadruped ('horse:warhorses').
     2. Battering Ram ('ram') - wheeled timber siege frame with sloped hide
        roof, swinging iron-headed log on chains, and two crewmen walking and
        heaving beside it.
     3. Named tavern patrons (Old Hob, Maud the Drover, Tall Pell, One-Ear Jory,
        Sister Wren, Gaffer Dunn) - distinct 3D looks registered via l3dLook()
        and exposed at window.PATRONS3D.lookFor(name, i).
   ROLLBACK: delete this file and its <script> tag
============================================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------ tunable constant table --- */
  const CFG = {
    slaver: {
      horseKind: 'horse:warhorses',
      armour: 'chain',
      feetOff: 7.4,
      shadowW: 14,
      look: {
        skin: '#d9a477',
        hair: '#2a1c12',
        hairStyle: 'short',
        beard: true,
        top: '#6e2222',
        legs: '#2b2320',
        acc: '#c9a24b',
        head: 'nasal',
        weapon: 'spear',
        armour: 'chain',
        cape: '#1e2430',
        capeTrim: '#2e3a4a'
      }
    },
    ram: {
      frame: { W: 170, H: 140, FEET: 114, CX: 85 },
      feetOff: 5,
      shadowW: 18,
      bossBlend: 0.65,
      swingBackRad: 0.42,
      swingHitRad: -0.56,
      walkStrideRad: 0.52,
      wheelSpinRad: 0.78,
      crewX: 16.5,
      scale: 1.8,
      zones: {
        wood: '#6b4c2b',
        woodD: '#4a3319',
        woodL: '#886239',
        hide: '#7a5a3a',
        hideD: '#583e26',
        hideL: '#94704c',
        metal: '#78828c',
        metalD: '#3e444c',
        rope: '#9c8456',
        skin: '#c98d5f',
        skinD: '#9e6b43',
        cloth: '#6b5a42',
        clothD: '#4a3e2e',
        legs: '#3e3426',
        boot: '#261e16',
        bandana: '#8f98a2',
        hair: '#3a2a1d',
        eye: '#1a1410'
      }
    }
  };

  /* Named tavern patrons (names from js/art/patrons.js, plus short aliases) */
  const PATRON_3D = {
    'Old Hob': {
      race: 'HUMAN',
      sex: 'm',
      spec: 'BRAWLER',
      armour: 'rag',
      look: {
        skin: '#c88c68',
        hair: '#96928a',
        hairStyle: 'bald',
        beard: true,
        top: '#584430',
        legs: '#32281e',
        acc: '#786042',
        head: 'hood',
        hood: '#3e3224',
        cape: '#483a2a',
        capeTrim: '#2e2419',
        weapon: 'club',
        bulky: true,
        nose: true,
        parts: [
          /* Red bulbous sot nose, clay pipe, and pewter tankard */
          { k: 'ellipsoid', b: 'head', c: [0, 3.3, 4.7], r: [1.3, 1.1, 1.3], z: 'acc' },
          { k: 'box', b: 'head', c: [0.8, 1.8, 5.2], s: [0.6, 0.6, 3.2], z: 'bone' },
          { k: 'box', b: 'head', c: [1.2, 2.3, 6.6], s: [1.1, 1.4, 1.1], z: 'woodD' },
          { k: 'box', b: 'hdL', c: [0, -1.2, 1.8], s: [2.4, 3.2, 2.4], z: 'metal' }
        ]
      }
    },
    'Maud the Drover': {
      race: 'HUMAN',
      sex: 'f',
      spec: 'HUNTER',
      armour: 'quilt',
      look: {
        skin: '#c68e63',
        hair: '#6e341c',
        hairStyle: 'ponytail',
        beard: false,
        top: '#6e4427',
        legs: '#3b2b1e',
        acc: '#b8863b',
        head: 'bycocket',
        hat: '#3b2616',
        cape: '#54351e',
        capeTrim: '#8a5a32',
        weapon: 'whip',
        tall: true,
        parts: [
          /* Wide drover hat brim and weathered shoulder capelet */
          { k: 'ellipsoid', b: 'head', c: [0, 6.2, 0], r: [6.8, 0.9, 6.4], z: 'hat' },
          { k: 'ellipsoid', b: 'chest', c: [0, 8.2, 0], r: [7.4, 2.2, 5.0], z: 'cape' }
        ]
      }
    },
    'Tall Pell': {
      race: 'HUMAN',
      sex: 'm',
      spec: 'POLEARM',
      armour: 'rag',
      look: {
        skin: '#d49e72',
        hair: '#8c6236',
        hairStyle: 'short',
        beard: false,
        top: '#a8926c',
        legs: '#3e3428',
        acc: '#4e6852',
        head: null,
        weapon: 'staff',
        tall: true,
        parts: [
          /* Open green tavern waistcoat panels and pewter mug */
          { k: 'box', b: 'chest', c: [-2.8, 4.8, 2.4], s: [2.2, 8.4, 1.4], z: 'acc' },
          { k: 'box', b: 'chest', c: [2.8, 4.8, 2.4], s: [2.2, 8.4, 1.4], z: 'acc' },
          { k: 'box', b: 'hdL', c: [0, -1.2, 1.6], s: [2.2, 3.0, 2.2], z: 'metal' }
        ]
      }
    },
    'One-Ear Jory': {
      race: 'HUMAN',
      sex: 'm',
      spec: 'CUTTHROAT',
      armour: 'studs',
      look: {
        skin: '#c48d64',
        hair: '#221c18',
        hairStyle: 'mohawk',
        beard: true,
        top: '#3a4638',
        legs: '#282420',
        acc: '#8e3228',
        head: 'bandana',
        hat: '#7a2820',
        weapon: 'dagger',
        offhand: 'dagger',
        parts: [
          /* Pale head-wrap over missing left ear and belt dice pouch */
          { k: 'box', b: 'head', c: [-4.1, 3.8, 0], s: [1.4, 2.8, 3.2], z: 'paper' },
          { k: 'ellipsoid', b: 'pelvis', c: [3.8, 1.2, 2.4], r: [1.5, 1.8, 1.4], z: 'acc' }
        ]
      }
    },
    'Sister Wren': {
      race: 'HUMAN',
      sex: 'f',
      spec: 'HEALER',
      armour: 'rag',
      look: {
        skin: '#e0b490',
        hair: '#3a2c22',
        hairStyle: 'bun',
        beard: false,
        top: '#32485c',
        legs: '#263646',
        robe: true,
        robeCol: '#32485c',
        acc: '#d8c898',
        head: 'circlet',
        cape: '#263848',
        capeTrim: '#d8c898',
        weapon: 'healerStaff',
        parts: [
          /* White healer's wimple veil and gold sanctuary cross on chest */
          { k: 'ellipsoid', b: 'head', c: [0, 4.6, -0.8], r: [4.8, 4.6, 4.8], z: 'paper' },
          { k: 'box', b: 'chest', c: [0, 8.2, 1.2], s: [8.4, 2.4, 4.8], z: 'paper' },
          { k: 'box', b: 'chest', c: [0, 5.2, 3.6], s: [0.9, 2.8, 0.6], z: 'gold' },
          { k: 'box', b: 'chest', c: [0, 5.6, 3.6], s: [2.1, 0.9, 0.6], z: 'gold' }
        ]
      }
    },
    'Gaffer Dunn': {
      race: 'HUMAN',
      sex: 'm',
      spec: 'MAGE',
      armour: 'quilt',
      look: {
        skin: '#cca07c',
        hair: '#d8d4cc',
        hairStyle: 'bald',
        beard: true,
        top: '#52402e',
        legs: '#34291e',
        robe: true,
        robeCol: '#483828',
        acc: '#9e8458',
        head: null,
        cape: '#3a2e20',
        capeTrim: '#786240',
        weapon: 'staff',
        short: true,
        parts: [
          /* Long white elder beard, brass spectacles, and crooked cane top */
          { k: 'ellipsoid', b: 'head', c: [0, 0.2, 3.6], r: [2.8, 3.6, 2.2], z: 'hair' },
          { k: 'box', b: 'head', c: [-1.6, 4.1, 4.3], s: [1.5, 1.2, 0.5], z: 'gold' },
          { k: 'box', b: 'head', c: [1.6, 4.1, 4.3], s: [1.5, 1.2, 0.5], z: 'gold' },
          { k: 'box', b: 'head', c: [0, 4.2, 4.3], s: [1.8, 0.4, 0.5], z: 'gold' }
        ]
      }
    }
  };
  /* Short aliases used by camp ambient speech bubbles */
  PATRON_3D['Maud'] = PATRON_3D['Maud the Drover'];
  PATRON_3D['Jory'] = PATRON_3D['One-Ear Jory'];

  /* ------------------------------------------ 1. Mounted Outrider Slaver --- */
  function buildSlaverRecipe() {
    if (typeof r3dEnemyRecipe !== 'function' || typeof r3qMountRecipe !== 'function') return null;
    if (typeof R3DR === 'object' && R3DR) {
      const k = 'e:slaver' + (typeof bannerSig === 'function' ? bannerSig() : '');
      if (R3DR[k]) return R3DR[k];
    }
    if (typeof ENEMY_LOOK === 'object' && ENEMY_LOOK) {
      const base = ENEMY_LOOK.overseer || {};
      ENEMY_LOOK.slaver = Object.assign({}, base, CFG.slaver.look);
      ENEMY_LOOK.slaver_rider = ENEMY_LOOK.slaver;
    }
    if (typeof ENEMY_ARMOUR === 'object' && ENEMY_ARMOUR) {
      ENEMY_ARMOUR.slaver = CFG.slaver.armour;
      ENEMY_ARMOUR.slaver_rider = CFG.slaver.armour;
    }
    const riderRec = origEnemyRecipe ? origEnemyRecipe('slaver_rider') : null;
    if (!riderRec) return null;
    const mountRec = r3qMountRecipe(riderRec, CFG.slaver.horseKind);
    if (!mountRec) return null;
    mountRec.feetOff = CFG.slaver.feetOff;
    mountRec.shadowW = CFG.slaver.shadowW;
    if (typeof R3DR === 'object' && R3DR) {
      const k = 'e:slaver' + (typeof bannerSig === 'function' ? bannerSig() : '');
      R3DR[k] = mountRec;
    }
    return mountRec;
  }

  function ensureMountClips() {
    if (typeof R3D_CLIPS !== 'object' || !R3D_CLIPS || !R3D_CLIPS.mount) return;
    const M = R3D_CLIPS.mount;
    if (!M.hit && M.idle) {
      M.hit = {
        n: 3,
        fn: function (t, rec) {
          const p = Object.assign({}, M.idle.fn(t, rec));
          const s = Math.sin(t * Math.PI);
          const q = (k, d) => { const b = p[k] || [0, 0, 0]; p[k] = [b[0] + d, b[1], b[2]]; };   /* mount bones are qNeck/qWith/qHead (figures-2.js 569-571); neck and r_* do not exist there */
          q('qWith', -0.10 * s); q('qNeck', -0.14 * s); q('qHead', 0.06 * s); q('chest', -0.18 * s); q('head', -0.14 * s);   /* AD N1 version B: the horse's head stays in view facing the camera, and the rider flinches too */
          return p;
        }
      };
    }
    if (!M.downed && M.death) M.downed = M.death;
  }

  /* --------------------------------------------------- 2. Battering Ram --- */
  function ensureRamClips() {
    if (typeof R3D_CLIPS !== 'object' || !R3D_CLIPS) return;
    if (!R3D_CLIPS.ram) {
      const C = CFG.ram;
      const Z3 = [0, 0, 0];
      const basePose = function () {
        return {
          bob: 0,
          root: Z3,
          roof: Z3,
          hanger: Z3,
          beam: Z3,
          wFL: Z3,
          wFR: Z3,
          wBL: Z3,
          wBR: Z3,
          c1: Z3,
          c1L: Z3,
          c1R: Z3,
          c1A: [-0.45, 0, 0.25],
          c2: Z3,
          c2L: Z3,
          c2R: Z3,
          c2A: [-0.45, 0, -0.25]
        };
      };
      R3D_CLIPS.ram = {
        idle: {
          n: 4,
          fn: function (t) {
            const ph = t * Math.PI * 2;
            const sw = 0.04 * Math.sin(ph);
            const p = basePose();
            p.hanger = [sw, 0, 0];
            p.beam = [-sw, 0, 0];
            p.c1 = [0.03 * Math.sin(ph), 0, 0];
            p.c2 = [0.03 * Math.cos(ph), 0, 0];
            return p;
          }
        },
        walk: {
          n: 8,
          fn: function (t) {
            const ph = t * Math.PI * 2;
            const s = Math.sin(ph);
            const c = Math.cos(ph);
            const sw = 0.1 * s;
            const st = C.walkStrideRad * s;
            const wh = t * Math.PI * 2;
            const p = basePose();
            p.bob = 0.45 * Math.abs(s);
            p.hanger = [sw, 0, 0];
            p.beam = [-sw, 0, 0];
            p.wFL = [wh, 0, 0];
            p.wFR = [wh, 0, 0];
            p.wBL = [wh, 0, 0];
            p.wBR = [wh, 0, 0];
            p.c1 = [0.1, 0, 0];
            p.c1L = [st, 0, 0];
            p.c1R = [-st, 0, 0];
            p.c1A = [-0.55 + 0.15 * c, 0, 0.25];
            p.c2 = [0.1, 0, 0];
            p.c2L = [-st, 0, 0];
            p.c2R = [st, 0, 0];
            p.c2A = [-0.55 - 0.15 * c, 0, -0.25];
            return p;
          }
        },
        melee: {
          /* 6 frames so frame === 3 || frame === 4 is the forward ram impact */
          n: 6,
          fn: function (t) {
            const fi = Math.round(t * 6) % 6;
            let sw = 0;
            let lean = 0;
            let stride = 0;
            if (fi === 1) { sw = C.swingBackRad * 0.55; lean = -0.14; stride = -0.25; }
            else if (fi === 2) { sw = C.swingBackRad; lean = -0.26; stride = -0.45; }
            else if (fi === 3 || fi === 4) { sw = C.swingHitRad; lean = 0.34; stride = 0.55; }
            else if (fi === 5) { sw = C.swingHitRad * 0.35; lean = 0.12; stride = 0.2; }
            const p = basePose();
            p.bob = (fi === 3 || fi === 4) ? 0.8 : 0;
            p.root = [(fi === 3 || fi === 4) ? 0.04 : 0, 0, 0];
            p.hanger = [sw, 0, 0];
            p.beam = [-sw, 0, 0];
            p.c1 = [lean, 0, 0];
            p.c1L = [stride, 0, 0];
            p.c1R = [-stride * 0.7, 0, 0];
            p.c1A = [-0.7 - lean, 0, 0.3];
            p.c2 = [lean, 0, 0];
            p.c2L = [-stride * 0.7, 0, 0];
            p.c2R = [stride, 0, 0];
            p.c2A = [-0.7 - lean, 0, -0.3];
            return p;
          }
        },
        hit: {
          n: 3,
          fn: function (t) {
            const s = Math.sin(t * Math.PI);
            const p = basePose();
            p.root = [-0.07 * s, 0, 0.05 * s];
            p.hanger = [0.22 * s, 0, 0];
            p.beam = [-0.22 * s, 0, 0];
            p.c1 = [-0.25 * s, 0, -0.1 * s];
            p.c2 = [-0.25 * s, 0, 0.1 * s];
            return p;
          }
        },
        death: {
          n: 6,
          fn: function (t) {
            const k = Math.min(1, t * 1.15);
            const p = basePose();
            p.bob = -5.5 * k;
            p.root = [0.18 * k, 0, 0.28 * k];
            p.roof = [0.12 * k, 0.1 * k, -0.35 * k];
            p.hanger = [0.48 * k, 0, 0];
            p.beam = [-0.32 * k, 0, 0.2 * k];
            p.wFL = [0, 0, -0.9 * k];
            p.wFR = [0, 0, 0.9 * k];
            p.wBL = [0, 0, -0.7 * k];
            p.wBR = [0, 0, 0.7 * k];
            p.c1 = [-1.35 * k, 0, -0.3 * k];
            p.c2 = [1.3 * k, 0, 0.3 * k];
            return p;
          }
        }
      };
      R3D_CLIPS.ram.run = R3D_CLIPS.ram.walk;
      R3D_CLIPS.ram.attack = R3D_CLIPS.ram.melee;
      R3D_CLIPS.ram.shoot = R3D_CLIPS.ram.melee;
      R3D_CLIPS.ram.cast = R3D_CLIPS.ram.melee;
      R3D_CLIPS.ram.downed = R3D_CLIPS.ram.death;
    }
    if (typeof R3D === 'object' && R3D && R3D.CLIPS_FOR) {
      R3D.CLIPS_FOR.ram = ['idle', 'walk', 'melee', 'hit', 'death'];
    }
  }

  function buildRamRecipe() {
    const C = CFG.ram;
    if (typeof R3DR === 'object' && R3DR && R3DR['e:ram']) return R3DR['e:ram'];
    ensureRamClips();

    const bones = {
      root: { p: null, off: [0, 0, 0] },
      roof: { p: 'root', off: [0, 18, 0] },
      hanger: { p: 'root', off: [0, 25, 0] },
      beam: { p: 'hanger', off: [0, -13, 0] },
      wFL: { p: 'root', off: [-11.5, 5, 11] },
      wFR: { p: 'root', off: [11.5, 5, 11] },
      wBL: { p: 'root', off: [-11.5, 5, -11] },
      wBR: { p: 'root', off: [11.5, 5, -11] },
      c1: { p: 'root', off: [-C.crewX, 9, -2] },
      c1L: { p: 'c1', off: [-1.5, 0, 0] },
      c1R: { p: 'c1', off: [1.5, 0, 0] },
      c1A: { p: 'c1', off: [2.6, 7.5, 0] },
      c2: { p: 'root', off: [C.crewX, 9, 2] },
      c2L: { p: 'c2', off: [-1.5, 0, 0] },
      c2R: { p: 'c2', off: [1.5, 0, 0] },
      c2A: { p: 'c2', off: [-2.6, 7.5, 0] }
    };

    const parts = [];
    const box = function (b, c, s, z) { parts.push({ k: 'box', b: b, c: c, s: s, z: z }); };
    const ell = function (b, c, r, z) { parts.push({ k: 'ellipsoid', b: b, c: c, r: r, z: z }); };
    const cap = function (b, a, d, r, z) { parts.push({ k: 'capsule', b: b, a: a, d: d, r: r, z: z }); };

    /* Heavy axles and lower timber sills */
    box('root', [0, 5, 11], [24, 2.2, 2.2], 'woodD');
    box('root', [0, 5, -11], [24, 2.2, 2.2], 'woodD');
    box('root', [-9.5, 6.5, 0], [2.4, 2.4, 32], 'wood');
    box('root', [9.5, 6.5, 0], [2.4, 2.4, 32], 'wood');
    box('root', [0, 6.5, 14.5], [21, 2.2, 2.2], 'woodD');
    box('root', [0, 6.5, -14.5], [21, 2.2, 2.2], 'woodD');

    /* Four corner posts and diagonal side timber braces */
    for (const sx of [-9.5, 9.5]) {
      for (const sz of [-12, 12]) {
        box('root', [sx, 12.5, sz], [2.2, 12, 2.2], 'wood');
        box('root', [sx, 7.5, sz], [2.6, 1.4, 2.6], 'metalD');
      }
      cap('root', [sx, 7, -11], [sx, 17.5, 0], 1.0, 'woodD');
      cap('root', [sx, 7, 11], [sx, 17.5, 0], 1.0, 'woodD');
      box('root', [sx, 18, 0], [2.2, 2.0, 30], 'wood');
    }

    /* Sloped roofed hide cover over the timber frame */
    box('roof', [0, 7.5, 0], [2.4, 2.4, 33], 'woodD');
    for (const sz of [-13, 0, 13]) {
      cap('roof', [-10.5, 0, sz], [0, 7.2, sz], 1.2, 'woodD');
      cap('roof', [10.5, 0, sz], [0, 7.2, sz], 1.2, 'woodD');
    }
    /* Overlapping hide panels on left and right roof slopes */
    box('roof', [-7.2, 2.2, 0], [5.8, 1.8, 31], 'hideD');
    box('roof', [-3.6, 5.0, 0], [5.4, 1.8, 31], 'hide');
    box('roof', [7.2, 2.2, 0], [5.8, 1.8, 31], 'hideD');
    box('roof', [3.6, 5.0, 0], [5.4, 1.8, 31], 'hide');
    box('roof', [0, 6.8, 0], [4.2, 1.6, 31.5], 'hideL');
    /* Iron corner straps and roof studs */
    for (const sz of [-14, 0, 14]) {
      box('roof', [0, 7.7, sz], [3.2, 1.2, 2.0], 'metalD');
    }

    /* Four iron-shod wooden wheels on the axles */
    for (const wb of ['wFL', 'wFR', 'wBL', 'wBR']) {
      ell(wb, [0, 0, 0], [1.6, 5.2, 5.2], 'metalD');
      ell(wb, [0, 0, 0], [1.8, 4.2, 4.2], 'wood');
      box(wb, [0, 0, 0], [2.1, 9.6, 1.4], 'woodD');
      box(wb, [0, 0, 0], [2.1, 1.4, 9.6], 'woodD');
      ell(wb, [0, 0, 0], [2.4, 1.8, 1.8], 'metal');
    }

    /* Suspension chains/ropes from ridge hanger to the swinging ram beam */
    for (const sz of [-7.5, 7.5]) {
      cap('hanger', [-2.2, -1, sz], [0, -13, sz], 0.85, 'rope');
      cap('hanger', [2.2, -1, sz], [0, -13, sz], 0.85, 'rope');
    }

    /* Swinging battering log + banded iron collars + iron ram head */
    cap('beam', [0, 0, -17], [0, 0, 15], 3.1, 'woodL');
    box('beam', [0, 0, -17.5], [4.6, 4.6, 2.4], 'metalD');
    for (const sz of [-8, 0, 8, 13.5]) {
      ell('beam', [0, 0, sz], [3.5, 3.5, 1.4], 'metalD');
    }
    /* Heavy iron battering head at +z */
    box('beam', [0, 0, 18.2], [6.6, 6.6, 6.2], 'metal');
    box('beam', [0, 0, 21.8], [5.0, 5.0, 2.6], 'metalD');
    ell('beam', [-3.6, 0.4, 17.5], [1.8, 2.2, 2.6], 'metalD');
    ell('beam', [3.6, 0.4, 17.5], [1.8, 2.2, 2.6], 'metalD');

    /* Two crewmen walking beside the frame and gripping the haul ropes */
    const addCrew = function (prefix, side) {
      /* Legs and boots */
      cap(prefix + 'L', [0, 0, 0], [0, -6.5, 0], 1.35, 'legs');
      box(prefix + 'L', [0, -7.8, 0.5], [2.4, 2.2, 3.4], 'boot');
      cap(prefix + 'R', [0, 0, 0], [0, -6.5, 0], 1.35, 'legs');
      box(prefix + 'R', [0, -7.8, 0.5], [2.4, 2.2, 3.4], 'boot');
      /* Pelvis, tunic torso, belt */
      box(prefix, [0, 0.8, 0], [5.2, 2.8, 3.4], 'clothD');
      box(prefix, [0, 5.2, 0], [6.0, 6.8, 3.8], 'cloth');
      box(prefix, [0, 2.2, 0], [6.3, 1.3, 4.1], 'hideD');
      /* Head, face, bandana */
      ell(prefix, [0, 10.8, 0], [2.6, 3.0, 2.7], 'skin');
      ell(prefix, [0, 12.1, -0.2], [2.8, 1.8, 2.9], 'bandana');
      box(prefix, [0, 11.4, -2.8], [1.8, 1.2, 1.4], 'bandana');
      box(prefix, [-0.9, 11.0, 2.4], [0.6, 0.6, 0.5], 'eye');
      box(prefix, [0.9, 11.0, 2.4], [0.6, 0.6, 0.5], 'eye');
      /* Inner arm reaching toward the ram frame & outer swinging arm */
      cap(prefix + 'A', [0, 0, 0], [-side * 4.5, -2.2, 3.2], 1.2, 'skin');
      cap(prefix, [side * 3.4, 7.5, 0], [side * 4.0, 2.2, 1.6], 1.2, 'skin');
    };
    addCrew('c1', -1);
    addCrew('c2', 1);

    /* convert the drafted shapes to the engine's recipe format (t/r/a/p, skel{order,bones}) */
    const eparts = parts.map(function (q) {
      if (q.k === 'box') return { b: q.b, t: 'box', c: q.c, r: [q.s[0] / 2, q.s[1] / 2, q.s[2] / 2], z: q.z };
      if (q.k === 'capsule') return { b: q.b, t: 'cap', a: q.a, p: q.d, r: q.r, z: q.z };
      return { b: q.b, t: 'ell', c: q.c, r: q.r, z: q.z };
    });
    const ebones = {};
    Object.keys(bones).forEach(function (n) { ebones[n] = { parent: bones[n].p, off: bones[n].off }; });
    const rec = {
      rig: 'ram',
      skel: { order: Object.keys(bones), bones: ebones },
      frame: C.frame,
      feetOff: C.feetOff,
      shadowW: C.shadowW,
      parts: eparts,
      zones: Object.assign({}, C.zones)
    };
    /* the drafted model is small beside the horse; scale it up (parts, bone offsets and frame) */
    const RK = C.scale || 1;
    if (RK !== 1) {
      const v = function (a) { return a.map(function (x) { return x * RK; }); };
      rec.parts.forEach(function (q) { if (q.c) q.c = v(q.c); if (q.a) q.a = v(q.a); if (q.p) q.p = v(q.p); q.r = Array.isArray(q.r) ? v(q.r) : q.r * RK; });
      Object.keys(rec.skel.bones).forEach(function (n) { rec.skel.bones[n].off = v(rec.skel.bones[n].off); });
      rec.frame = { W: Math.round(C.frame.W * RK), H: Math.round(C.frame.H * RK), FEET: Math.round(C.frame.FEET * RK), CX: Math.round(C.frame.CX * RK) };
    }
    if (typeof r3dBossColours === 'function') {
      r3dBossColours(rec, C.bossBlend);
    } else if (typeof r3dMute === 'function') {
      r3dMute(rec);
    } else if (typeof hash === 'function') {
      rec.key = 'ram3d_' + hash(JSON.stringify(rec.zones));
    } else {
      rec.key = 'ram3d_default';
    }
    if (typeof R3DR === 'object' && R3DR) R3DR['e:ram'] = rec;
    return rec;
  }

  /* ------------------------------------------------ 3. Named Patrons 3D --- */
  function ensureWhipWeapon() {
    if (typeof WEAPON3D === 'object' && WEAPON3D && !WEAPON3D.whip) {
      WEAPON3D.whip = [
        { k: 'box', b: 'hdR', c: [0, -1, 0], s: [1.3, 5.2, 1.3], z: 'woodD' },
        { k: 'box', b: 'hdR', c: [0, 2.0, 0], s: [1.6, 1.2, 1.6], z: 'gold' },
        { k: 'ellipsoid', b: 'hdR', c: [0.6, 4.2, 1.8], r: [1.2, 3.2, 2.8], z: 'wood' },
        { k: 'capsule', b: 'hdR', a: [0, 1.8, 0.6], d: [0.8, 6.8, 4.2], r: 0.65, z: 'woodD' }
      ];
    }
    if (typeof WEAPON_GRIP === 'object' && WEAPON_GRIP && !WEAPON_GRIP.whip) {
      WEAPON_GRIP.whip = 'swing';
    }
  }

  function slugOf(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function lookFor(name, i) {
    if (!name || !Object.prototype.hasOwnProperty.call(PATRON_3D, name)) return null;
    const entry = PATRON_3D[name];
    const idx = i !== undefined && i !== null ? i : 0;
    const slug = slugOf(name);
    const key = 'pat_' + slug + '_' + idx;
    const p = {
      name: name,
      race: entry.race || 'HUMAN',
      spec: entry.spec || 'BRAWLER',
      sex: entry.sex || 'm',
      id: 'P_' + slug + '_' + idx,
      injuries: []
    };
    const look = Object.assign({}, entry.look);
    if (typeof l3dLook === 'function') {
      l3dLook(key, p, look, entry.armour || 'rag');
    }
    return { p: p, look: look, key: key };
  }

  window.PATRONS3D = {
    PATRON_3D: PATRON_3D,
    lookFor: lookFor
  };

  /* -------------------------------------------- Wrappers & Installation --- */
  let installed = false;
  let origEnemySprite = null;
  let origEnemyRecipe = null;
  let origCorpse = null;
  let origKitEnemy = null;
  let origL3dLook = null;

  function registerAllPatrons() {
    if (typeof l3dLook !== 'function') return;
    const names = Object.keys(PATRON_3D);
    for (let i = 0; i < names.length; i++) {
      lookFor(names[i], i);
    }
  }

  function install() {
    if (installed) return;
    if (typeof enemySprite !== 'function' || typeof r3dEnemyRecipe !== 'function') return;
    installed = true;

    ensureMountClips();
    ensureRamClips();
    ensureWhipWeapon();

    if (typeof R3D_SPECIAL === 'object' && R3D_SPECIAL && typeof R3D_SPECIAL.add === 'function') {
      R3D_SPECIAL.add('slaver');
      R3D_SPECIAL.add('ram');
    }

    /* Preserve custom WEAPON3D entries (e.g. whip) and custom look.parts in ENEMY kit */
    if (typeof R3D_KITS === 'object' && R3D_KITS && typeof R3D_KITS.ENEMY === 'function') {
      origKitEnemy = R3D_KITS.ENEMY;
      R3D_KITS.ENEMY = function (p, D, L) {
        const out = origKitEnemy.apply(this, arguments);
        if (L && L.weapon && typeof WEAPON3D === 'object' && WEAPON3D[L.weapon]) {
          const std = ['sword', 'axe', 'mace', 'club', 'hammer', 'pick', 'cleaver', 'dagger', 'spear', 'halberd', 'bow', 'xbow', 'wand', 'staff', 'healerStaff'];
          if (std.indexOf(L.weapon) < 0 && out && Array.isArray(out.parts)) {
            for (let i = 0; i < WEAPON3D[L.weapon].length; i++) {
              out.parts.push(Object.assign({}, WEAPON3D[L.weapon][i]));
            }
          }
        }
        if (L && Array.isArray(L.parts) && out && Array.isArray(out.parts)) {
          for (let i = 0; i < L.parts.length; i++) {
            out.parts.push(Object.assign({}, L.parts[i]));
          }
        }
        return out;
      };
    }

    /* Wrap enemySprite so 'slaver' and 'ram' carry spr.e3d while keeping flat fallback */
    origEnemySprite = enemySprite;
    enemySprite = function (kind) {
      const spr = origEnemySprite.apply(this, arguments);
      if (spr && (kind === 'slaver' || kind === 'ram')) {
        spr.e3d = kind;
      }
      return spr;
    };

    /* Wrap r3dEnemyRecipe to build the 3D mounted slaver and 3D battering ram */
    origEnemyRecipe = r3dEnemyRecipe;
    r3dEnemyRecipe = function (kind) {
      if (kind === 'slaver') {
        const rec = buildSlaverRecipe();
        if (rec) return rec;
      } else if (kind === 'ram') {
        const rec = buildRamRecipe();
        if (rec) return rec;
      }
      return origEnemyRecipe.apply(this, arguments);
    };

    /* Wrap r3dCorpse so dead slavers and shattered rams draw their 3D death pose */
    if (typeof r3dCorpse === 'function') {
      origCorpse = r3dCorpse;
      r3dCorpse = function (x) {
        if (x && (x.k === 'slaver' || x.k === 'ram') && typeof r3qDraw === 'function') {
          const rec = r3dEnemyRecipe(x.k);
          if (rec) {
            const clip = R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig].death ? R3D_CLIPS[rec.rig].death : { n: 4 };
            const age = x.t != null ? x.t : x.life != null ? 90 - x.life : 0;   /* one age for frame, fade and shadow (LE 0a3e4ef8) */
            const f = Math.min(clip.n - 1, Math.floor(age / 5));   /* real corpses carry life (90 down), never t (QA f16d189f) */
            return r3qDraw(
              rec,
              x.x,
              x.y + (rec.feetOff !== undefined ? rec.feetOff : 7) * R3D.S,
              R3D.S,
              {
                clip: 'death',
                f: f, i: f,   /* r3qDraw reads o.i; o.f left the death on frame 0 */
                dir: x.dir !== undefined ? x.dir : (x.vx < 0 ? 6 : 2),
                alpha: Math.max(0, Math.min(1, (90 - age) / 40)) * 0.95,
                shadowW: age > 12 ? 0 : (rec.shadowW || 14)
              }
            );
          }
        }
        return origCorpse.apply(this, arguments);
      };
    }

    /* Wrap l3dLook so bar-fight spectators matching named patrons get their 3D look */
    if (typeof l3dLook === 'function') {
      origL3dLook = l3dLook;
      l3dLook = function (key, p, look, armour) {
        const nm = p && p.name;
        if (nm && Object.prototype.hasOwnProperty.call(PATRON_3D, nm)) {
          const entry = PATRON_3D[nm];
          const mergedP = Object.assign({}, p, {
            race: entry.race || p.race || 'HUMAN',
            spec: entry.spec || p.spec || 'BRAWLER',
            sex: entry.sex || p.sex || 'm'
          });
          const mergedLook = Object.assign({}, look || {}, entry.look);
          return origL3dLook.call(this, key, mergedP, mergedLook, entry.armour || armour || 'rag');
        }
        return origL3dLook.apply(this, arguments);
      };
      registerAllPatrons();
    }

    /* Clear cached flat sprites for slaver/ram so next enemySprite() sets e3d */
    if (typeof SPR === 'object' && SPR) {
      delete SPR['e:slaver'];
      delete SPR['e:ram'];
    }
  }

  if (document.readyState === 'complete') {
    install();
  } else {
    window.addEventListener('load', install);
  }
})();
