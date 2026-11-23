/* ============================================================================
   INDEX 97 - 3D tavern hub
   Replaces the Camp Tavern hub's flat bard and flat pixel backdrop with 3D:
     1. Hub bard (<canvas id="tavern-bard">): renders the bard in 3D (standing,
        strumming the lute across his chest with the 'play' clip, or 'sit'
        fallback) into cached 34x32 frames, drawing the old flat frame until
        the async 3D frames are ready.
     2. Hub backdrop (<canvas id="tavern-art">): builds a cached 3-layer 3D
        tavern interior from the bar-fight props (tv_hearth, tv_counter,
        tv_table, tv_kegs, tv_barrels, tv_candle, tv_door) via w3dMapProp /
        w3dDraw, keeping the hearth/candle flicker, rising sparks, and warm
        lamp glow overlay. Leaves the old pixel backdrop showing until all 3D
        props are ready.
   ROLLBACK: delete this file and its <script> tag
============================================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------ tunable constant table --- */
  const CFG = {
    bard: {
      canvasId: 'tavern-bard',
      w: 34,
      h: 32,
      dir: 1,
      preferredClip: 'play',
      fallbackClip: 'sit',
      framePeriodMs: 180,
      feetY: 29,
      targetH: 27,
      shadowRx: 8,
      shadowRy: 2.2,
      shadowAlpha: 0.32
    },
    backdrop: {
      canvasId: 'tavern-art',
      zIndex: 59,
      floorRatio: 0.62,
      propScale: 0.58,
      foreScale: 0.68,
      pumpMs: 8,
      tickMs: 80,
      maxSparks: 26,
      props: [
        'tv_hearth',
        'tv_counter',
        'tv_table',
        'tv_kegs',
        'tv_barrels',
        'tv_candle',
        'tv_door'
      ],
      pal: {
        bgDeep: '#0d0705',
        bgDark: '#160c07',
        bgMid: '#24150c',
        woodD: '#2e1b0f',
        wood: '#472a17',
        woodL: '#684024',
        stoneD: '#2b2522',
        stone: '#423934',
        stoneL: '#594e47',
        rugD: '#4a1914',
        rug: '#6e241c',
        rugTrim: '#b88a3c',
        gold: '#e0a844',
        fireLo: '#e05219',
        fireMid: '#f28c24',
        fireHi: '#ffd86b',
        glowRgb: '255,155,55',
        lampRgb: '255,190,95'
      }
    }
  };

  /* ------------------------------------------------ 1. Hub Bard in 3D --- */
  const BARD = {
    rec: null,
    recSig: '',
    frames3d: null,
    styleId: '',
    hookedCanvas: null,
    origDrawImage: null,
    tickIdx: 0,
    lastStep: 0,
    k: 1
  };
  /* S6-C 3a: while 3D is on the hub bard bakes at 3x and scales smoothly, never a 34 x 32 pixel frame */
  const bardK = () => 3;

  function getBardClip() {
    if (typeof R3D_CLIPS === 'object' && R3D_CLIPS && R3D_CLIPS.humanoid) {
      if (R3D_CLIPS.humanoid[CFG.bard.preferredClip]) return CFG.bard.preferredClip;
      if (R3D_CLIPS.humanoid[CFG.bard.fallbackClip]) return CFG.bard.fallbackClip;
    }
    return CFG.bard.fallbackClip;
  }

  function ensureBardRecipe() {
    if (typeof META !== 'object' || !META || !META.bard) return null;
    if (typeof r3dRecipeOf !== 'function' && typeof r3dRecipeFor !== 'function') return null;
    const b = META.bard;
    const sig = [b.name, b.race, b.sex, typeof bannerSig === 'function' ? bannerSig() : ''].join(':');
    if (BARD.rec && BARD.recSig === sig) return BARD.rec;

    const base = typeof r3dRecipeOf === 'function' ? r3dRecipeOf(b, false) : r3dRecipeFor(b, false);
    if (!base || !Array.isArray(base.parts)) return null;

    /* Clone recipe and strip right-hand sword parts so only the lute shows */
    const cleanParts = [];
    for (let i = 0; i < base.parts.length; i++) {
      const q = base.parts[i];
      if (q && q.b === 'hdR' && q.z !== 'skin') continue;
      cleanParts.push(q);
    }
    const rec = Object.assign({}, base, {
      parts: cleanParts,
      key: (base.key || 'bard3d') + '_hublute'
    });
    BARD.rec = rec;
    BARD.recSig = sig;
    BARD.frames3d = null;
    return rec;
  }

  function bakeBardSmallFrame(srcCanvas) {
    const k = bardK();
    const W = CFG.bard.w * k;
    const H = CFG.bard.h * k;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const g = out.getContext('2d');
    if (!g || !srcCanvas) return out;
    g.imageSmoothingEnabled = k > 1;
    if (k > 1) g.imageSmoothingQuality = 'high';

    /* Measure non-transparent bounds of the 3D render */
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    let x0 = sw, y0 = sh, x1 = 0, y1 = 0;
    try {
      const d = srcCanvas.getContext('2d').getImageData(0, 0, sw, sh).data;
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          if (d[(y * sw + x) * 4 + 3] > 16) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
    } catch (e) {
      x0 = 0; y0 = 0; x1 = sw - 1; y1 = sh - 1;
    }
    if (x1 < x0 || y1 < y0) return out;

    /* Soft floor shadow under feet */
    g.save();
    g.fillStyle = 'rgba(0,0,0,' + CFG.bard.shadowAlpha + ')';
    g.beginPath();
    g.ellipse(W * 0.5, CFG.bard.feetY * k, CFG.bard.shadowRx * k, CFG.bard.shadowRy * k, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    const bw = Math.max(1, x1 - x0 + 1);
    const bh = Math.max(1, y1 - y0 + 1);
    const scale = Math.min((W - 4 * k) / bw, CFG.bard.targetH * k / bh);
    const dw = Math.max(1, Math.round(bw * scale));
    const dh = Math.max(1, Math.round(bh * scale));
    const dx = Math.round((W - dw) * 0.5);
    const dy = Math.round(CFG.bard.feetY * k - dh);

    g.drawImage(srcCanvas, x0, y0, bw, bh, dx, dy, dw, dh);
    return out;
  }

  function getBardFrames3D() {
    if (typeof r3dFramesAsync !== 'function' || typeof R3D_STYLES !== 'object') return null;
    const stId = typeof r3dStyleId === 'function' ? (r3dStyleId() || 'crisp') : 'crisp';
    const St = R3D_STYLES[stId] || R3D_STYLES.crisp;
    if (!St) return null;

    const rec = ensureBardRecipe();
    if (!rec) return null;
    if (BARD.frames3d && BARD.styleId === stId && BARD.k === bardK()) return BARD.frames3d;

    const clip = getBardClip();
    const raw = r3dFramesAsync(rec, clip, CFG.bard.dir, St);
    if (!raw || !raw.length) {
      if (typeof r3dPump === 'function') r3dPump(CFG.backdrop.pumpMs);
      return null;
    }

    const baked = [];
    for (let i = 0; i < raw.length; i++) {
      baked.push(bakeBardSmallFrame(raw[i]));
    }
    BARD.frames3d = baked;
    BARD.styleId = stId;
    BARD.k = bardK();
    return baked;
  }

  function bardWarnOnce(e) {
    if (BARD.warned) return;
    BARD.warned = true;
    try { console.warn('hub bard: 3D frame or figure failed, drawing the plain silhouette', e); } catch (e2) {}
  }

  /* the last fallback when neither the baked frames nor PROPS3D.figure can draw: a plain dark seated shape, no gradients */
  function bardLastResort(g, cx, feet, h) {
    try {
      const k = h / 27;
      g.save();
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, feet, 8 * k, 2.2 * k, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a3a2c'; g.beginPath(); g.ellipse(cx, feet - 11 * k, 5.5 * k, 11 * k, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b08c6c'; g.beginPath(); g.arc(cx, feet - h + 5 * k, 4.2 * k, 0, Math.PI * 2); g.fill();
      g.restore();
    } catch (e) {}
  }

  function hookBardCanvas() {
    const cv = document.getElementById(CFG.bard.canvasId);
    if (!cv || BARD.hookedCanvas === cv) return false;
    const g = cv.getContext('2d');
    if (!g || typeof g.drawImage !== 'function') return false;

    const orig = g.drawImage.bind(g);
    BARD.hookedCanvas = cv;
    BARD.origDrawImage = orig;

    g.drawImage = function (img) {
      try {
        const fr = getBardFrames3D();
        if (fr && fr.length) {
          const now = performance.now();
          if (now - BARD.lastStep >= CFG.bard.framePeriodMs) {
            BARD.lastStep = now;
            BARD.tickIdx = (BARD.tickIdx + 1) % fr.length;
          }
          const f3 = fr[BARD.tickIdx % fr.length];
          if (f3) return orig(f3, 0, 0, cv.width, cv.height);
        }
      } catch (e) { bardWarnOnce(e); }
      if (img === cv) return orig.apply(g, arguments);
      /* S6-C 3a P15/P16: while the 3D frames bake, a soft figure, never the pixel bard */
      const feet = CFG.bard.feetY * cv.height / CFG.bard.h, h = CFG.bard.targetH * cv.height / CFG.bard.h;   /* sized to the canvas: feet stay inside the stock 28 px canvas too (EN 87d4f1f note 1) */
      try { if (typeof PROPS3D !== 'undefined' && PROPS3D.figure(g, cv.width / 2, feet, h, false)) return; } catch (e) { bardWarnOnce(e); }
      if (!img) { bardLastResort(g, cv.width / 2, feet, h); return; }   /* LE 072afab1 N1/N2: never throw on null, never leave the canvas blank */
      return orig.apply(g, arguments);
    };
    return true;
  }

  function tavernObj() {
    try { return (typeof TAVERN === 'object' && TAVERN) ? TAVERN : (typeof window !== 'undefined' ? window.TAVERN : null); } catch (e) { return null; }
  }

  function repaintBardNow() {
    const cv = document.getElementById(CFG.bard.canvasId);
    if (!cv || !hubOpen()) return;
    const T = tavernObj();
    if (T && typeof T.repaintBardStage === 'function' && cv.closest('.bs')) {
      T.repaintBardStage();
      return;
    }
    const g = cv.getContext('2d');
    if (g && Object.prototype.hasOwnProperty.call(g, 'drawImage')) {
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(null, 0, 0);
    }
  }

  const T0 = tavernObj();
  if (T0) T0.hookBard3D = hookBardCanvas;

  /* ---------------------------------------------- 2. Hub Backdrop in 3D --- */
  const SCENE = {
    key: '',
    lw: 0,
    lh: 0,
    fy: 0,
    cx: 0,
    staticBack: null,
    hearthFrames: null,
    foreLayer: null,
    compCanvas: null,
    compCtx: null,
    sparks: [],
    hookedArtCanvas: null,
    origArtDrawImage: null,
    pumpTimer: null
  };

  function hubOpen() {
    const el = document.getElementById('tavern-hub');
    return !!el && !el.classList.contains('hidden');
  }

  /* Draw a 3D map prop into an arbitrary 2D context by temporarily routing
     global ctx drawing calls into targetCtx around (x, gl) at scale sc. */
  function drawPropToCtx(targetCtx, kind, x, gl, sc, opts) {
    if (typeof w3dMapProp !== 'function' || typeof ctx !== 'object' || !ctx) return false;
    const origSave = ctx.save;
    const origRestore = ctx.restore;
    const origDrawImage = ctx.drawImage;
    const origAlpha = ctx.globalAlpha;
    const origSmooth = ctx.imageSmoothingEnabled;
    let ok = false;
    try {
      ctx.save = function () { targetCtx.save(); };
      ctx.restore = function () { targetCtx.restore(); };
      ctx.drawImage = function (img, dx, dy, dw, dh) {
        targetCtx.imageSmoothingEnabled = false;
        const k = sc || 1;
        const sx = Math.round(x + (dx - x) * k);
        const sy = Math.round(gl + (dy - gl) * k);
        const sw = Math.max(1, Math.round(dw * k));
        const sh = Math.max(1, Math.round(dh * k));
        targetCtx.drawImage(img, sx, sy, sw, sh);
      };
      ok = !!w3dMapProp(kind, x, gl, opts || {});
    } catch (e) {
      ok = false;
    } finally {
      ctx.save = origSave;
      ctx.restore = origRestore;
      ctx.drawImage = origDrawImage;
      ctx.globalAlpha = origAlpha;
      ctx.imageSmoothingEnabled = origSmooth;
    }
    return ok;
  }

  /* Check & warm all required tv_* 3D props; returns true only when all are ready */
  function allPropsReady() {
    if (typeof w3dRecipe !== 'function' || typeof r3dFramesAsync !== 'function') return false;
    if (typeof W3D_KINDS !== 'object' || !W3D_KINDS) return false;

    const stId = typeof r3dStyleId === 'function' ? (r3dStyleId() || 'crisp') : 'crisp';
    const St = typeof R3D_STYLES === 'object' && R3D_STYLES ? (R3D_STYLES[stId] || R3D_STYLES.crisp) : null;
    if (!St) return false;
    const season = typeof w3dSeason === 'function' ? w3dSeason() : 'summer';

    let ready = true;
    const list = CFG.backdrop.props;
    for (let i = 0; i < list.length; i++) {
      const fullKind = 'mp_' + list[i];
      const K = W3D_KINDS[fullKind];
      if (!K) return false;
      const rec = w3dRecipe(fullKind, season);
      if (!rec) { ready = false; continue; }
      const fr = r3dFramesAsync(rec, K.clip, K.view, St);
      if (!fr || !fr.length) ready = false;
      if (K.mirror) {
        const mfr = r3dFramesAsync(rec, K.clip, 4 - K.view, St);
        if (!mfr || !mfr.length) ready = false;
      }
    }
    if (!ready && typeof r3dPump === 'function') {
      r3dPump(CFG.backdrop.pumpMs);
    }
    return ready;
  }

  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    const g = c.getContext('2d');
    if (g) g.imageSmoothingEnabled = false;
    return { c: c, g: g };
  }

  function build3DScene(lw, lh) {
    const P = CFG.backdrop.pal;
    const fy = Math.round(lh * CFG.backdrop.floorRatio);
    const cx = Math.round(lw * 0.5);
    const psc = CFG.backdrop.propScale;
    const fsc = CFG.backdrop.foreScale;

    /* 1. Back wall + plank floor + static 3D props */
    const back = mkCanvas(lw, lh);
    const bg = back.g;

    /* Stone & plaster upper wall, dark beams, wainscot lower wall */
    bg.fillStyle = P.bgDark;
    bg.fillRect(0, 0, lw, fy);
    for (let y = 10; y < fy - 24; y += 6) {
      bg.fillStyle = ((y / 6) | 0) % 2 === 0 ? P.stoneD : P.bgMid;
      bg.fillRect(0, y, lw, 5);
    }
    /* Timber wainscot along the lower back wall */
    bg.fillStyle = P.woodD;
    bg.fillRect(0, fy - 26, lw, 26);
    bg.fillStyle = P.wood;
    bg.fillRect(0, fy - 27, lw, 2);
    for (let x = 0; x < lw; x += 8) {
      bg.fillStyle = P.bgDeep;
      bg.fillRect(x, fy - 25, 1, 25);
    }
    /* Ceiling beams & vertical timber posts */
    bg.fillStyle = P.bgDeep;
    bg.fillRect(0, 0, lw, 9);
    bg.fillStyle = P.woodD;
    bg.fillRect(0, 7, lw, 3);
    const posts = [0, Math.round(lw * 0.22), Math.round(lw * 0.78), lw - 6];
    for (let i = 0; i < posts.length; i++) {
      bg.fillStyle = P.woodD;
      bg.fillRect(posts[i], 8, 6, fy - 8);
      bg.fillStyle = P.woodL;
      bg.fillRect(posts[i] + 1, 8, 1, fy - 8);
    }

    /* Plank floor with perspective boards and central hearth rug */
    bg.fillStyle = P.bgMid;
    bg.fillRect(0, fy, lw, lh - fy);
    for (let y = fy; y < lh; y += 5) {
      bg.fillStyle = ((y - fy) / 5 | 0) % 2 === 0 ? P.woodD : P.bgMid;
      bg.fillRect(0, y, lw, 4);
      bg.fillStyle = P.bgDeep;
      bg.fillRect(0, y + 4, lw, 1);
    }
    /* Perspective plank joints radiating from center */
    bg.strokeStyle = 'rgba(13,7,5,0.45)';
    bg.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      bg.beginPath();
      bg.moveTo(cx + i * 18, fy);
      bg.lineTo(cx + i * 42, lh);
      bg.stroke();
    }
    /* Woven crimson hearth rug before the fireplace */
    const rw = Math.min(108, Math.round(lw * 0.34));
    const rh = Math.min(26, Math.round((lh - fy) * 0.36));
    const rx = cx - (rw >> 1);
    const ry = fy + 8;
    bg.fillStyle = P.rugD;
    bg.fillRect(rx - 2, ry - 1, rw + 4, rh + 2);
    bg.fillStyle = P.rugTrim;
    bg.fillRect(rx - 1, ry, rw + 2, rh);
    bg.fillStyle = P.rug;
    bg.fillRect(rx + 1, ry + 2, rw - 2, rh - 4);

    /* Render 3D bar-fight props onto the back & floor layer via w3dMapProp */
    drawPropToCtx(bg, 'tv_door', Math.round(lw * 0.11), fy + 2, psc, {});
    drawPropToCtx(bg, 'tv_counter', Math.round(lw * 0.30), fy + 3, psc, {});
    drawPropToCtx(bg, 'tv_counter', Math.round(lw * 0.70), fy + 3, psc, { mirror: true });
    drawPropToCtx(bg, 'tv_kegs', Math.round(lw * 0.88), fy + 6, psc, {});
    drawPropToCtx(bg, 'tv_barrels', Math.round(lw * 0.18), fy + 7, psc, {});
    drawPropToCtx(bg, 'tv_barrels', Math.round(lw * 0.08), fy + 24, psc, { mirror: true });
    drawPropToCtx(bg, 'tv_kegs', Math.round(lw * 0.92), fy + 24, psc, { mirror: true });

    /* Hanging iron ceiling lamps */
    const lampXs = [Math.round(lw * 0.28), cx, Math.round(lw * 0.72)];
    const lampY = Math.max(22, Math.round(fy * 0.25));
    for (let i = 0; i < lampXs.length; i++) {
      const lx = lampXs[i];
      bg.fillStyle = P.stoneL;
      bg.fillRect(lx, 9, 1, lampY - 12);
      bg.fillStyle = P.bgDeep;
      bg.fillRect(lx - 3, lampY - 3, 7, 2);
      bg.fillStyle = P.gold;
      bg.fillRect(lx - 2, lampY - 1, 5, 5);
    }

    /* 2. Pre-bake 4 flickering frames for tv_hearth + counter tv_candle */
    const hearthFrames = [];
    for (let f = 0; f < 4; f++) {
      const hc = mkCanvas(lw, lh);
      const tTick = f * 7;
      drawPropToCtx(hc.g, 'tv_hearth', cx, fy + 4, psc * 1.12, { t: tTick });
      drawPropToCtx(hc.g, 'tv_candle', Math.round(lw * 0.30), fy - 12, psc, { t: tTick });
      drawPropToCtx(hc.g, 'tv_candle', Math.round(lw * 0.70), fy - 12, psc, { t: tTick + 14 });
      hearthFrames.push(hc.c);
    }

    /* 3. Foreground layer: left & right 3D tables with candles + edge vignette */
    const fore = mkCanvas(lw, lh);
    const fg = fore.g;
    const tblY = Math.min(lh - 8, fy + Math.round((lh - fy) * 0.72));
    const leftX = Math.round(lw * 0.20);
    const rightX = Math.round(lw * 0.80);

    drawPropToCtx(fg, 'tv_table', leftX, tblY, fsc, {});
    drawPropToCtx(fg, 'tv_table', rightX, tblY, fsc, { mirror: true });
    drawPropToCtx(fg, 'tv_candle', leftX, tblY - Math.round(22 * fsc), psc, { t: 0 });
    drawPropToCtx(fg, 'tv_candle', rightX, tblY - Math.round(22 * fsc), psc, { t: 7 });

    /* Soft vignette around outer edges so the central UI cards read cleanly */
    const vg = fg.createRadialGradient(cx, Math.round(lh * 0.5), Math.round(lw * 0.25), cx, Math.round(lh * 0.5), Math.round(lw * 0.72));
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,4,2,0.55)');
    fg.fillStyle = vg;
    fg.fillRect(0, 0, lw, lh);

    const comp = mkCanvas(lw, lh);
    SCENE.lw = lw;
    SCENE.lh = lh;
    SCENE.fy = fy;
    SCENE.cx = cx;
    SCENE.lampXs = lampXs;
    SCENE.lampY = lampY;
    SCENE.staticBack = back.c;
    SCENE.hearthFrames = hearthFrames;
    SCENE.foreLayer = fore.c;
    SCENE.compCanvas = comp.c;
    SCENE.compCtx = comp.g;
  }

  function stepSparks() {
    const sp = SCENE.sparks;
    while (sp.length < CFG.backdrop.maxSparks) {
      sp.push({
        x: SCENE.cx + (Math.random() - 0.5) * 18,
        y: SCENE.fy - 4 - Math.random() * 10,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.35 - Math.random() * 0.45,
        life: 18 + Math.random() * 26,
        max: 44
      });
    }
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i];
      s.x += s.vx + Math.sin(s.life * 0.25) * 0.15;
      s.y += s.vy;
      s.life -= 1;
      if (s.life <= 0 || s.y < SCENE.fy - 36) {
        s.x = SCENE.cx + (Math.random() - 0.5) * 16;
        s.y = SCENE.fy - 4;
        s.life = 22 + Math.random() * 22;
        s.max = s.life;
      }
    }
  }

  function compose3DFrame(lw, lh) {
    const stId = typeof r3dStyleId === 'function' ? (r3dStyleId() || 'crisp') : 'crisp';
    const season = typeof w3dSeason === 'function' ? w3dSeason() : 'summer';
    const key = [lw, lh, stId, season].join(':');
    if (SCENE.key !== key || !SCENE.staticBack) {
      build3DScene(lw, lh);
      SCENE.key = key;
    }

    const g = SCENE.compCtx;
    const P = CFG.backdrop.pal;
    const t = performance.now() * 0.001;
    const fi = Math.floor(t * 8) % SCENE.hearthFrames.length;
    const pulse = 0.88 + 0.12 * Math.sin(t * 6.2) + 0.05 * Math.cos(t * 13.7);

    g.clearRect(0, 0, lw, lh);
    g.drawImage(SCENE.staticBack, 0, 0);
    g.drawImage(SCENE.hearthFrames[fi], 0, 0);

    /* Warm additive hearth & lamp glow pools */
    g.save();
    g.globalCompositeOperation = 'screen';
    const hg = g.createRadialGradient(SCENE.cx, SCENE.fy - 4, 2, SCENE.cx, SCENE.fy + 6, Math.round(lw * 0.32));
    hg.addColorStop(0, 'rgba(' + P.glowRgb + ',' + (0.34 * pulse).toFixed(3) + ')');
    hg.addColorStop(0.5, 'rgba(' + P.glowRgb + ',' + (0.14 * pulse).toFixed(3) + ')');
    hg.addColorStop(1, 'rgba(' + P.glowRgb + ',0)');
    g.fillStyle = hg;
    g.fillRect(0, 0, lw, lh);

    for (let i = 0; i < SCENE.lampXs.length; i++) {
      const lx = SCENE.lampXs[i];
      const ly = SCENE.lampY;
      const lg = g.createRadialGradient(lx, ly, 1, lx, ly + 12, 46);
      lg.addColorStop(0, 'rgba(' + P.lampRgb + ',' + (0.26 * pulse).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(' + P.lampRgb + ',0)');
      g.fillStyle = lg;
      g.fillRect(lx - 48, 0, 96, lh);
    }
    g.restore();

    /* Rising hearth sparks */
    stepSparks();
    for (let i = 0; i < SCENE.sparks.length; i++) {
      const s = SCENE.sparks[i];
      const k = Math.max(0, Math.min(1, s.life / s.max));
      g.fillStyle = k > 0.6 ? P.fireHi : (k > 0.3 ? P.fireMid : P.fireLo);
      g.globalAlpha = k;
      g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }
    g.globalAlpha = 1;

    /* Foreground 3D tables & candles */
    g.drawImage(SCENE.foreLayer, 0, 0);
    return SCENE.compCanvas;
  }

  function hookArtCanvas() {
    const cv = document.getElementById(CFG.backdrop.canvasId);
    if (!cv || SCENE.hookedArtCanvas === cv) return;
    const g = cv.getContext('2d');
    if (!g || typeof g.drawImage !== 'function') return;

    const orig = g.drawImage.bind(g);
    SCENE.hookedArtCanvas = cv;
    SCENE.origArtDrawImage = orig;

    g.drawImage = function (img, sx, sy, sw, sh, dx, dy, dw, dh) {
      try {
        if (allPropsReady() && sw > 60 && sh > 60) {
          const c3d = compose3DFrame(sw, sh);
          if (c3d) return orig(c3d, sx, sy, sw, sh, dx, dy, dw, dh);
        }
      } catch (e) {}
      return orig.apply(g, arguments);
    };
  }

  /* Pump async 3D frames while the hub is open so bard & props finish quickly */
  function startHubPump() {
    if (SCENE.pumpTimer) return;
    SCENE.pumpTimer = setInterval(function () {
      if (!hubOpen()) return;
      const hooked = hookBardCanvas();
      hookArtCanvas();
      if (typeof R3DQ === 'object' && R3DQ && Array.isArray(R3DQ.q) && R3DQ.q.length > 0 && typeof r3dPump === 'function') {
        r3dPump(CFG.backdrop.pumpMs);
      }
      /* Warm bard frames so #tavern-bard switches from flat to 3D as soon as ready */
      const prevFrames = BARD.frames3d;
      let fr = null;
      try { fr = getBardFrames3D(); } catch (e) { bardWarnOnce(e); }   /* a failing bake must not throw every tick (AD, with LE 072afab1 N1) */
      if (hooked || (fr && fr.length && fr !== prevFrames)) repaintBardNow();
    }, CFG.backdrop.tickMs);
  }

  function install() {
    if (hookBardCanvas() && hubOpen()) repaintBardNow();
    hookArtCanvas();
    startHubPump();

    const hub = document.getElementById('tavern-hub');
    if (hub && typeof MutationObserver === 'function') {
      const mo = new MutationObserver(function () {
        if (hubOpen()) {
          if (hookBardCanvas()) repaintBardNow();
          hookArtCanvas();
        }
      });
      mo.observe(hub, { attributes: true, attributeFilter: ['class'], childList: true });
    }
  }

  if (document.readyState === 'complete') {
    install();
  } else {
    window.addEventListener('load', install);
  }
})();
