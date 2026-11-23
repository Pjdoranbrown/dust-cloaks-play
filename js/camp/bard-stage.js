/* INDEX 95 - standing bard and stage (js/camp/bard-stage.js)
 *
 * What it does: in the Camp Tavern hub, replaces the borrowed dance-floor look of the Camp Bard
 * with a standing bard drawn from personLook(META.bard) + drawHumanoid (same palette, same 1px
 * outline) that loops a 6-frame play cycle (strum, tap, sway), standing on a small pixel-art plank
 * stage with a front lip, flickering footlights, an optional back curtain and a warm pool of light.
 * Hooks (no edits to existing files): wraps window.TAVERN.enter, watches #tavern-hub with a
 * MutationObserver, hides the stock CSS plank stage (.bard.bs), and paints over #tavern-bard plus a
 * second canvas (.bs-stage) added inside .bard. bardSprite is NOT wrapped; its output is painted over.
 *
 * ROLLBACK: delete this file and its <script> tag
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ constants (tunable) */

  // Pixel sizes. Bard canvas is 34 x 32 (same as danceBardSprite). Stage canvas is wider and taller
  // so the platform sits under the feet; the bard canvas is centred inside it by CSS.
  var BARD_W = 34, BARD_H = 32, OX = 4, OY = 6;           // OX/OY: where the 24 x 26 body sits in the bard canvas
  var STAGE_W = 50, STAGE_H = 40;                         // (STAGE_W - BARD_W) must be even
  var SCALE = 3;                                          // CSS px per art pixel (integer keeps pixels square)
  var NAME_GAP_PX = 3;                                    // gap between stage and the name label

  // 6-frame play cycle. FRAME_* name the frames; LOOP_ORDER is the order played; FRAME_MS is the idle
  // duration of each step of LOOP_ORDER (same index). LOOP_MS is derived.
  var FRAME = { STRUM_UP: 0, STRUM_DOWN: 1, TAP_UP: 2, TAP_DOWN: 3, SWAY_LEFT: 4, SWAY_RIGHT: 5 };
  var FRAME_COUNT = 6;
  var LOOP_ORDER = [FRAME.STRUM_UP, FRAME.STRUM_DOWN, FRAME.TAP_UP, FRAME.TAP_DOWN, FRAME.SWAY_LEFT, FRAME.SWAY_RIGHT];
  var FRAME_MS   = [150, 150, 170, 170, 230, 230];
  var LOOP_MS = FRAME_MS.reduce(function (a, b) { return a + b; }, 0);   // 1100 ms idle loop

  // Pose table. leg: drawHumanoid frame for the legs (0 stand, 1 lifted foot). dx: upper body shift in px
  // (weight shift). headDy: head nod in px. slope: lute neck angle (0.4 flat .. 1.1 steep). hand: strum
  // hand height (0 high, 2 mid, 1 low), as in danceBardSprite.
  var POSES = [
    { leg: 0, dx:  0, headDy: 0, slope: 0.95, hand: 0 },   // STRUM_UP
    { leg: 0, dx:  0, headDy: 0, slope: 0.95, hand: 1 },   // STRUM_DOWN
    { leg: 1, dx:  0, headDy: 0, slope: 0.95, hand: 2 },   // TAP_UP    (foot lifted)
    { leg: 0, dx:  0, headDy: 1, slope: 0.95, hand: 2 },   // TAP_DOWN  (foot lands, head nods)
    { leg: 0, dx: -1, headDy: 0, slope: 0.40, hand: 2 },   // SWAY_LEFT (weight left, lute flatter)
    { leg: 0, dx:  1, headDy: 0, slope: 1.10, hand: 2 }    // SWAY_RIGHT (weight right, lute steeper)
  ];

  // Music sync (only if MUS exists and is playing): each frame lasts beat / MUS_FRAMES_PER_BEAT, clamped.
  var MUS_FRAMES_PER_BEAT = 2, MUS_MS_MIN = 90, MUS_MS_MAX = 300;

  // Animation timing: painting never happens faster than MIN_PAINT_MS (about 12 fps). MAX_DT_MS stops a
  // long pause (tab hidden) from fast-forwarding the loop.
  var MIN_PAINT_MS = 80, MAX_DT_MS = 250, FALLBACK_TIMER_MS = 83;

  // Footlight flicker.
  var FLICKER_STEP_MS = 90;
  var FLICKER_ALPHA = [0.55, 0.8, 1.0, 1.25];             // glow strength per flicker level 0..3
  var FOOTLIGHTS = [                                      // x: centre column; h: glass height in px
    { x: 5,  h: 3 },
    { x: 25, h: 1 },                                      // low centre lamp: its flame stays below the bard's feet
    { x: 45, h: 3 }
  ];
  var LAMP_Y = 34;                                        // stage row of the lamp base

  // Light on the bard: alpha per band of canvas rows (source-atop, so only his pixels are tinted).
  var BARD_LIGHT = [{ from: 0, a: 0.03 }, { from: 12, a: 0.08 }, { from: 20, a: 0.15 }, { from: 26, a: 0.24 }];
  var LIGHT_RGB = '255,196,110';

  // Stage geometry (rows/cols in stage pixels).
  var PLAT_X0 = 1, PLAT_X1 = 48, PLAT_BACK = 28, PLAT_LIP = 35;     // back edge row; lip top row
  var CURTAIN_ON = true, CUR_X0 = 3, CUR_X1 = 46, CUR_Y0 = 3, CUR_Y1 = 27;

  // Colours (planks match the stock CSS stage).
  var C_WOOD = '#a06a30', C_WOOD_HI = '#c08a48', C_WOOD_LIP = '#d9a458', C_WOOD_SEAM = '#8c5a28',
      C_WOOD_BACK = '#7a4e22', C_FASCIA = '#7a4a20', C_POST = '#4a2c12', C_EDGE = '#2a1608';
  var C_CURTAIN = ['#3a1418', '#4a1a1e', '#5c2227', '#4a1a1e', '#3a1418', '#3a1418', '#4a1a1e'];
  var C_VALANCE = '#6a2428', C_GOLD = '#b8923a', C_GOLD_DK = '#7a5e22', C_RAIL = '#3a2410', C_HEM = '#2e1014';
  var C_BRASS = '#6a4a20', C_BRASS_DK = '#3a2410', C_FLAME_CORE = '#fff2b8', C_FLAME = '#ffb040';
  var C_GLASS = ['#c8802c', '#e09a38', '#f4b448', '#ffd070'];
  var GLOW_RGB = '255,190,90';

  var STYLE_ID = 'bard-stage-css', CLS = 'bs', STAGE_CLS = 'bs-stage';

  /* ------------------------------------------------------------------ small helpers */

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function mk(w, h) {
    var c = (typeof newCanvas === 'function') ? newCanvas(w, h) : null;
    if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; }
    return c;
  }
  function pen(g) { return function (x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash01(n) {
    n = Math.imul(n | 0, 374761393) + 668265263 | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function hasBard() { try { return typeof META !== 'undefined' && !!META && !!META.bard; } catch (e) { return false; } }
  function bardKey(p) { return 'bs:' + p.race + '|' + p.sex + '|' + p.name; }   // same inputs as the stock sprite key
  function reduced() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function musicBeatMs() {
    try {
      if (typeof MUS !== 'undefined' && MUS && typeof MUS.playing === 'function' && MUS.playing() && typeof MUS.beat === 'function') {
        var b = +MUS.beat();
        if (isFinite(b) && b > 0) return b * 1000;
      }
    } catch (e) { /* MUS absent or broken: use idle cycle */ }
    return 0;
  }

  /* ------------------------------------------------------------------ standing bard frames */

  var spriteCache = null;   // only the latest bard is kept

  function buildFrames(p) {
    return [];   // S6-C 3a step 5 phase B: 3D frames / soft figure only, never the pixel bard
  }

  function getSprite(p) {
    var key = bardKey(p);
    if (spriteCache && spriteCache.key === key) return spriteCache;
    var frames = buildFrames(p);
    spriteCache = { key: key, frames: frames };
    return spriteCache;
  }

  /* ------------------------------------------------------------------ stage art */



  // Flicker level 0..3 per lamp at time t (ms). Steady (level 2) when t < 0.
  function flickerLevel(i, t) {
    if (t < 0) return 2;
    var step = Math.floor(t / FLICKER_STEP_MS), n = hash01(step * 7 + i * 13 + 1);
    var v = clamp(0.6 + 0.22 * Math.sin(t / 340 + i * 2.3) + 0.3 * (n - 0.5), 0, 1);
    return v < 0.4 ? 0 : v < 0.62 ? 1 : v < 0.82 ? 2 : 3;
  }

  /* ------------------------------------------------------------------ S6-C 3a: the painted stage (3D on) */
  // While PROPS3D is on, both canvases run at K = 3 times their art size and are scaled smoothly by CSS:
  // the bard comes from js/3d/hub.js (its 3D frames, or the soft figure while they bake), and the stage is
  // painted in soft shapes (curtain folds, planks in perspective, brass footlights) in the same stage units.
  var K = 1, static3 = null;
  function hiRes() { return 3; }   // S6-C 3a step 5: the pixel stage is gone; always the painted stage at 3x
  function rgbaOf(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function soft(g, cx, cy, rx, ry, rgb, a) {                           // a smooth elliptical glow
    if (a <= 0) return;
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
  }
  function buildStatic3() {
    var c = mk(STAGE_W * K, STAGE_H * K), g = c.getContext('2d'), i, x;
    g.setTransform(K, 0, 0, K, 0, 0);
    var x0 = CUR_X0 - 0.5, x1 = CUR_X1 + 1.5, y0 = CUR_Y0, y1 = CUR_Y1 + 1, cw = x1 - x0;
    if (CURTAIN_ON) {
      // curtain: soft vertical folds, darker at the top and the hem
      var fold = g.createLinearGradient(x0, 0, x1, 0), nF = 10;
      for (i = 0; i <= nF; i++) { var u = i / nF; fold.addColorStop(u, i % 2 ? '#62252b' : '#341115'); if (i < nF) fold.addColorStop(u + 0.5 / nF, '#4c1b20'); }
      g.fillStyle = fold; g.beginPath(); g.moveTo(x0, y0);
      g.lineTo(x1, y0); g.lineTo(x1, y1 - 1);
      for (i = nF; i >= 0; i--) { x = x0 + cw * i / nF; g.quadraticCurveTo(x + cw / nF / 2, y1 + 0.6, x, y1 - 0.4); }   // a scalloped hem
      g.closePath(); g.fill();
      var sh = g.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, 'rgba(10,2,4,.55)'); sh.addColorStop(0.35, 'rgba(10,2,4,0)'); sh.addColorStop(0.8, 'rgba(10,2,4,0)'); sh.addColorStop(1, 'rgba(10,2,4,.45)');
      g.fillStyle = sh; g.fillRect(x0, y0, cw, y1 - y0 + 1);
      g.strokeStyle = rgbaOf(C_GOLD_DK, 0.9); g.lineWidth = 0.45; g.beginPath(); g.moveTo(x0, y1 - 0.6); g.lineTo(x1, y1 - 0.6); g.stroke();   // hem braid
      // valance: a swagged pelmet with gold trim and tassels
      var vg = g.createLinearGradient(0, y0, 0, y0 + 5); vg.addColorStop(0, '#7a2a2f'); vg.addColorStop(1, '#4e1a1e');
      g.fillStyle = vg; g.beginPath(); g.moveTo(x0 - 0.5, y0 - 0.5); g.lineTo(x1 + 0.5, y0 - 0.5); g.lineTo(x1 + 0.5, y0 + 3.6);
      for (i = 6; i > 0; i--) { x = x0 - 0.5 + (cw + 1) * (i - 1) / 6; g.quadraticCurveTo(x + (cw + 1) / 12, y0 + 6.4, x, y0 + 3.6); }
      g.closePath(); g.fill();
      g.strokeStyle = C_GOLD; g.lineWidth = 0.55; g.beginPath(); g.moveTo(x1 + 0.5, y0 + 3.6);
      for (i = 6; i > 0; i--) { x = x0 - 0.5 + (cw + 1) * (i - 1) / 6; g.quadraticCurveTo(x + (cw + 1) / 12, y0 + 6.4, x, y0 + 3.6); }
      g.stroke();
      for (i = 1; i < 6; i++) { x = x0 - 0.5 + (cw + 1) * i / 6; g.fillStyle = C_GOLD_DK; g.fillRect(x - 0.3, y0 + 3.6, 0.6, 1.6); g.fillStyle = C_GOLD; g.beginPath(); g.ellipse(x, y0 + 5.6, 0.7, 1, 0, 0, Math.PI * 2); g.fill(); }
      // rail and finials
      var rg = g.createLinearGradient(0, y0 - 1.6, 0, y0 - 0.2); rg.addColorStop(0, '#6a4420'); rg.addColorStop(1, '#2a180a');
      g.fillStyle = rg; g.fillRect(x0 - 1.2, y0 - 1.6, cw + 2.4, 1.3);
      for (x of [x0 - 1.4, x1 + 1.4]) { var fg = g.createRadialGradient(x - 0.4, y0 - 1.4, 0, x, y0 - 1, 1.6); fg.addColorStop(0, '#f0d080'); fg.addColorStop(1, '#7a5e22'); g.fillStyle = fg; g.beginPath(); g.arc(x, y0 - 1, 1.4, 0, Math.PI * 2); g.fill(); }
    }
    // the platform: boards in perspective, a lit lip and a dark fascia
    var bx0 = PLAT_X0 + 0.5, bx1 = PLAT_X1 + 0.5, back = PLAT_BACK, lip = PLAT_LIP, inset = 2.2, vx = STAGE_W / 2;
    var top = g.createLinearGradient(0, back, 0, lip); top.addColorStop(0, '#6e4520'); top.addColorStop(0.5, '#a06a30'); top.addColorStop(1, '#b67c3e');
    g.fillStyle = top; g.beginPath(); g.moveTo(bx0 + inset, back); g.lineTo(bx1 - inset, back); g.lineTo(bx1, lip); g.lineTo(bx0, lip); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,32,12,.55)'; g.lineWidth = 0.32;
    for (i = 1; i < 9; i++) { var fx = bx0 + (bx1 - bx0) * i / 9, bxp = vx + (fx - vx) * (1 - 2 * inset / (bx1 - bx0)); g.beginPath(); g.moveTo(bxp, back + 0.2); g.lineTo(fx, lip); g.stroke(); }   // plank seams run to the back
    g.strokeStyle = 'rgba(60,32,12,.35)'; g.beginPath(); g.moveTo(bx0 + inset * 0.55, back + 3); g.lineTo(bx1 - inset * 0.55, back + 3); g.stroke();
    var bs = g.createLinearGradient(0, back, 0, back + 2); bs.addColorStop(0, 'rgba(20,8,2,.6)'); bs.addColorStop(1, 'rgba(20,8,2,0)');   // the curtain's shadow on the back boards
    g.fillStyle = bs; g.fillRect(bx0, back, bx1 - bx0, 2);
    var lg = g.createLinearGradient(0, lip - 0.2, 0, lip + 1.4); lg.addColorStop(0, '#f0c070'); lg.addColorStop(1, '#b07a3c');
    g.fillStyle = lg; g.beginPath(); g.moveTo(bx0 - 0.2, lip - 0.2); g.lineTo(bx1 + 0.2, lip - 0.2); g.lineTo(bx1 + 0.2, lip + 1.4); g.lineTo(bx0 - 0.2, lip + 1.4); g.closePath(); g.fill();
    var fa = g.createLinearGradient(0, lip + 1.4, 0, STAGE_H - 0.4); fa.addColorStop(0, '#7a4a20'); fa.addColorStop(1, '#3a2010');
    g.fillStyle = fa; g.fillRect(bx0, lip + 1.4, bx1 - bx0, STAGE_H - 0.4 - lip - 1.4);
    for (x = PLAT_X0 + 4.5; x < PLAT_X1; x += 8) { var pg = g.createLinearGradient(x - 0.6, 0, x + 0.6, 0); pg.addColorStop(0, '#5a3618'); pg.addColorStop(1, '#2e1a0a'); g.fillStyle = pg; g.fillRect(x - 0.6, lip + 1.4, 1.2, STAGE_H - 0.4 - lip - 1.4); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx0, STAGE_H - 0.9, bx1 - bx0, 0.5);
    return c;
  }
  function paintStage3(ctx, t) {
    var levels = [], sum = 0, i;
    for (i = 0; i < FOOTLIGHTS.length; i++) { levels[i] = flickerLevel(i, t); sum += FLICKER_ALPHA[levels[i]]; }
    var avg = FOOTLIGHTS.length ? sum / FOOTLIGHTS.length : 1, mid = STAGE_W / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, STAGE_W * K, STAGE_H * K);
    if (!static3) static3 = buildStatic3();
    ctx.drawImage(static3, 0, 0);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';                       // light only lands on curtain and planks
    soft(ctx, mid, 21, 21, 14, GLOW_RGB, 0.16 * avg);                   // halo on the curtain
    soft(ctx, mid, 32, 20, 5, GLOW_RGB, 0.3 * avg);                     // pool on the boards
    for (i = 0; i < FOOTLIGHTS.length; i++) soft(ctx, FOOTLIGHTS[i].x + 0.5, LAMP_Y - 1, 9, 4.5, GLOW_RGB, 0.32 * FLICKER_ALPHA[levels[i]]);
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < FOOTLIGHTS.length; i++) {                           // brass footlights with a glass chimney and a live flame
      var L = FOOTLIGHTS[i], lv = levels[i], x = L.x + 0.5, gh = L.h + 1.2, gt = LAMP_Y - gh + 0.4;
      var bb = ctx.createLinearGradient(x - 1.8, 0, x + 1.8, 0); bb.addColorStop(0, '#3a2410'); bb.addColorStop(0.4, '#c09040'); bb.addColorStop(1, '#4a2e12');
      ctx.fillStyle = bb; ctx.beginPath(); ctx.ellipse(x, LAMP_Y + 1, 1.9, 0.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1.5, LAMP_Y + 0.2, 3, 0.9);
      var gg = ctx.createLinearGradient(x - 1.4, 0, x + 1.4, 0); gg.addColorStop(0, rgbaOf(C_GLASS[lv], 0.55)); gg.addColorStop(0.45, rgbaOf(C_GLASS[Math.min(3, lv + 1)], 0.9)); gg.addColorStop(1, rgbaOf(C_GLASS[Math.max(0, lv - 1)], 0.5));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(x, gt + gh / 2, 1.35, gh / 2, 0, 0, Math.PI * 2); ctx.fill();
      var fh = 1.2 + lv * 0.45, fl = ctx.createRadialGradient(x, gt + gh * 0.55, 0, x, gt + gh * 0.45, fh);
      fl.addColorStop(0, C_FLAME_CORE); fl.addColorStop(0.5, rgbaOf(C_FLAME, 0.9)); fl.addColorStop(1, rgbaOf(C_FLAME, 0));
      ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(x, gt + gh * 0.5 - fh * 0.2, fh * 0.45, fh, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e1c0a'; ctx.beginPath(); ctx.ellipse(x, gt - 0.2, 1.1, 0.45, 0, 0, Math.PI * 2); ctx.fill();   // the cap
      ctx.globalCompositeOperation = 'lighter'; soft(ctx, x, gt + gh * 0.4, 3.2, 3.2, GLOW_RGB, 0.16 * FLICKER_ALPHA[lv]); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function paintStage(ctx, t) {
    return paintStage3(ctx, t);
  }

  function paintBard(ctx, frame, t) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, BARD_W * K, BARD_H * K);
    if (frame) { if (K > 1) ctx.drawImage(frame, 0, 0, BARD_W * K, BARD_H * K); else ctx.drawImage(frame, 0, 0); }
    else if (Object.prototype.hasOwnProperty.call(ctx, 'drawImage')) { ctx.drawImage(null, 0, 0, BARD_W * K, BARD_H * K); }
    else if (typeof PROPS3D !== 'undefined' && PROPS3D.figure) { PROPS3D.figure(ctx, BARD_W * K / 2, 29 * K, 27 * K, false); }
    var sum = 0, i;
    for (i = 0; i < FOOTLIGHTS.length; i++) sum += FLICKER_ALPHA[flickerLevel(i, t)];
    var m = FOOTLIGHTS.length ? sum / FOOTLIGHTS.length : 1;
    ctx.globalCompositeOperation = 'source-atop';                      // warm tint on his pixels only
    if (K > 1) { var wl = ctx.createLinearGradient(0, 0, 0, BARD_H * K); for (i = 0; i < BARD_LIGHT.length; i++) wl.addColorStop(BARD_LIGHT[i].from / BARD_H, 'rgba(' + LIGHT_RGB + ',' + (BARD_LIGHT[i].a * m).toFixed(3) + ')'); wl.addColorStop(1, 'rgba(' + LIGHT_RGB + ',' + (BARD_LIGHT[BARD_LIGHT.length - 1].a * m * 1.15).toFixed(3) + ')');
      ctx.fillStyle = wl; ctx.fillRect(0, 0, BARD_W * K, BARD_H * K); ctx.globalCompositeOperation = 'source-over'; return; }
    for (i = 0; i < BARD_LIGHT.length; i++) {
      var to = (i + 1 < BARD_LIGHT.length) ? BARD_LIGHT[i + 1].from : BARD_H;
      ctx.fillStyle = 'rgba(' + LIGHT_RGB + ',' + (BARD_LIGHT[i].a * m).toFixed(3) + ')';
      ctx.fillRect(0, BARD_LIGHT[i].from, BARD_W, to - BARD_LIGHT[i].from);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------------ state + hooks */

  var S = { hub: null, hubMO: null, clsMO: null, cvMO: null, bard: null, cv: null, stage: null,
            cvCtx: null, stCtx: null, sprite: null, idx: 0, acc: 0, last: 0, lastPaint: 0, t0: 0,
            raf: 0, timer: 0, mq: null };

  function hubEl() { return document.getElementById('tavern-hub'); }
  function hubVisible(h) { return !!h && h.isConnected && !h.classList.contains('hidden'); }

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    var w = STAGE_W * SCALE, h = STAGE_H * SCALE, bw = BARD_W * SCALE, bh = BARD_H * SCALE;
    var gap = (STAGE_H - BARD_H) * SCALE + NAME_GAP_PX;
    var base = 'html #tavern-hub .bard.' + CLS;
    var css =
      base + '::before,' + base + '::after{ display:none !important; content:none !important }' +
      base + '{ width:' + w + 'px }' +
      base + ' canvas#tavern-bard{ width:' + bw + 'px; height:' + bh + 'px; margin:0 auto ' + gap + 'px; position:relative; z-index:2;' +
        ' image-rendering:pixelated; animation:none !important; transform:none !important; pointer-events:none }' +
      base + ' canvas.' + STAGE_CLS + '{ position:absolute; left:0; top:0; margin:0; width:' + w + 'px; height:' + h + 'px; z-index:1;' +
        ' image-rendering:pixelated; animation:none !important; transform:none !important; pointer-events:none }' +
      base + '.' + CLS + '3 canvas{ image-rendering:auto !important }';   /* S6-C 3a: smooth while 3D is on */
    var st = document.createElement('style'); st.id = STYLE_ID; st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  function stopLoop() {
    if (S.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(S.raf);
    if (S.timer) clearTimeout(S.timer);
    S.raf = 0; S.timer = 0;
  }

  function stepMs(i) {
    var beat = musicBeatMs();
    return beat ? clamp(beat / MUS_FRAMES_PER_BEAT, MUS_MS_MIN, MUS_MS_MAX) : FRAME_MS[i];
  }

  function alive() {
    return hubVisible(S.hub) && !!S.cv && S.cv.isConnected && !!S.bard && S.bard.isConnected && hasBard();
  }

  function paintNow(t) {
    if (!S.sprite || !S.cv || !S.cv.isConnected) return;
    try {
      var p = META.bard;
      if (bardKey(p) !== S.sprite.key) S.sprite = getSprite(p);                 // race / sex / name changed in the console
      var f = S.sprite.frames[LOOP_ORDER[S.idx]];
      if (S.cv.width !== BARD_W * K) S.cv.width = BARD_W * K;
      if (S.cv.height !== BARD_H * K) S.cv.height = BARD_H * K;
      paintBard(S.cvCtx, f, t);
      paintStage(S.stCtx, t);
    } catch (e) { if (!S.warned) { S.warned = true; try { console.warn('bard-stage: paint failed, the stage stops redrawing', e); } catch (e2) {} } }   // once only (EN a0748846 note)
  }

  function tick() {
    S.raf = 0; S.timer = 0;
    if (!alive()) { stopLoop(); return; }
    var n = now();
    if (n - S.lastPaint >= MIN_PAINT_MS) {
      var dt = Math.min(MAX_DT_MS, n - S.last);
      S.last = n; S.lastPaint = n;
      S.acc += dt;
      var guard = FRAME_COUNT * 2, d = stepMs(S.idx);
      while (S.acc >= d && guard-- > 0) { S.acc -= d; S.idx = (S.idx + 1) % LOOP_ORDER.length; d = stepMs(S.idx); }
      paintNow(n - S.t0);
    }
    schedule();
  }

  function schedule() {
    if (typeof requestAnimationFrame === 'function') S.raf = requestAnimationFrame(tick);
    else S.timer = setTimeout(tick, FALLBACK_TIMER_MS);
  }

  function startLoop() {
    if (S.raf || S.timer) return;
    if (!alive()) return;
    if (reduced()) { S.idx = 0; S.acc = 0; paintNow(-1); return; }          // frame 0 only, steady lights
    S.last = S.lastPaint = now(); if (!S.t0) S.t0 = S.last;
    schedule();
  }

  function onCanvasAttr() {                                                    // stock paintBard() just reset width/height and redrew
    try { if (S.cv && S.cv.isConnected) paintNow(reduced() ? -1 : now() - S.t0); } catch (e) { /* ignore */ }
    if (S.cvMO) S.cvMO.takeRecords();
  }

  function tavernObj() {
    try { return (typeof TAVERN !== 'undefined' && TAVERN) ? TAVERN : window.TAVERN; } catch (e) { return typeof window !== 'undefined' ? window.TAVERN : null; }
  }

  function setup(b) {
    var cv = b.querySelector('#tavern-bard');
    if (!cv) return;
    var sprite; try { sprite = getSprite(META.bard); } catch (e) { return; }
    var old = b.querySelectorAll('canvas.' + STAGE_CLS);                       // never two stages in one .bard
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
    var st = document.createElement('canvas');
    K = hiRes(); if (K === 1) static3 = null;
    st.className = STAGE_CLS; st.width = STAGE_W * K; st.height = STAGE_H * K; st.setAttribute('aria-hidden', 'true');
    b.insertBefore(st, b.firstChild);
    cv.width = BARD_W * K; cv.height = BARD_H * K;
    b.classList.add(CLS); b.classList.toggle(CLS + '3', K > 1);
    S.bard = b; S.cv = cv; S.stage = st; S.sprite = sprite;
    S.cvCtx = cv.getContext('2d'); S.stCtx = st.getContext('2d');
    S.cvCtx.imageSmoothingEnabled = K > 1; S.stCtx.imageSmoothingEnabled = K > 1;
    if (S.cvMO) S.cvMO.disconnect();
    if (typeof MutationObserver === 'function') {
      S.cvMO = new MutationObserver(onCanvasAttr);
      S.cvMO.observe(cv, { attributes: true, attributeFilter: ['width', 'height'] });
    }
    try { var T = tavernObj(); if (T && typeof T.hookBard3D === 'function') T.hookBard3D(); } catch (e) {}
    paintNow(reduced() ? -1 : (S.t0 ? now() - S.t0 : 0));                       // paint before the browser can show the stock frame
  }

  function sync() {
    try {
      var h = attach();
      if (!h) return;
      var b = h.querySelector('.bard');
      if (!b || !hasBard()) { S.bard = S.cv = null; stopLoop(); return; }
      if (!b.classList.contains(CLS) || S.bard !== b) setup(b);
      if (hubVisible(h)) startLoop(); else stopLoop();
    } catch (e) { /* fail silently */ }
  }

  function attach() {
    var h = hubEl();
    if (!h) return null;
    if (h !== S.hub) {
      if (S.hubMO) S.hubMO.disconnect();
      if (S.clsMO) S.clsMO.disconnect();
      S.hub = h;
      if (typeof MutationObserver === 'function') {
        S.hubMO = new MutationObserver(sync);                                   // .bard is re-created on every render()
        S.hubMO.observe(h, { childList: true });
        S.clsMO = new MutationObserver(sync);                                   // leaving / re-entering the hub (class hidden)
        S.clsMO.observe(h, { attributes: true, attributeFilter: ['class'] });
      }
    }
    return h;
  }

  function repaintNow() {
    if (alive()) paintNow(reduced() ? -1 : (S.t0 ? now() - S.t0 : 0));
  }

  function wrapEnter() {
    var T = tavernObj();
    if (T) try { T.repaintBardStage = repaintNow; } catch (e) {}
    if (!T || typeof T.enter !== 'function') return false;
    if (T.enter.__bardStage) return true;
    var orig = T.enter;
    var wrapped = function () {
      var r = orig.apply(this, arguments);
      sync();
      return r;
    };
    wrapped.__bardStage = true; wrapped.__orig = orig;
    try { T.enter = wrapped; } catch (e) { return false; }
    return true;
  }

  function onMotionChange() { if (reduced()) { stopLoop(); S.idx = 0; S.acc = 0; paintNow(-1); } else sync(); }

  function init() {
    try {
      injectCSS();
      wrapEnter();
      sync();
      if (window.matchMedia) {
        S.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (S.mq.addEventListener) S.mq.addEventListener('change', onMotionChange);
        else if (S.mq.addListener) S.mq.addListener(onMotionChange);
      }
      document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
    } catch (e) { /* fail silently */ }
  }

  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { if (!S.hub) init(); });
    try { injectCSS(); wrapEnter(); } catch (e) { /* ignore */ }
  } else init();
  window.addEventListener('load', function () { try { wrapEnter(); sync(); } catch (e) { /* ignore */ } });   // late-defined TAVERN
})();
