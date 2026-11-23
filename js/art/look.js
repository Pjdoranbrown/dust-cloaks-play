/* ============================================================================
   INDEX 100 - VO-1 visual overhaul, phase 1: palette and time-of-day grade
   (Fable job 5b, audits/fable/vo1.md; direction in docs/art-direction.md)
   Loads last. Grim desaturated ground palette per season, a grade on the field
   and camp canvases by time of day (multiply shadow tint, additive key light,
   horizon haze, vignette), fire light pools drawn above the grade so fires
   punch through, and unit rim light that grows as the scene darkens.
   Time of day: the mission's night flag, else a fixed sequence by deployment
   count (so each mission has its own hour); the camp is always evening.
   Knobs: LOOK.on (switch), LOOK.force ('dawn'|'day'|'dusk'|'night' pins the
   time for screenshots), LOOK.grade.<time> (mul, add, hazeA, amb), LOOK.pal.
   ROLLBACK: remove this script tag (or LOOK.on = false at runtime).
============================================================================ */
(function(){
'use strict';
const LOOK = window.LOOK = {
  on: true,
  force: null,
  accentShare: 0.15,
  // grim base and accents (docs/art-direction.md section 2)
  base: {ink:'#140c06', mud:'#3a2c20', wood:'#2e1f12', steel:'#5d6670', slate:'#2b3038', ash:'#8a8478', bone:'#efe3c8', parchment:'#f0e6d2'},
  accent: {crimson:'#e0525a', azure:'#6fa0e8', saffron:'#f0b030', verdant:'#7fd070', violet:'#c4a0f4', fire:'#ff9a2e', cyan:'#5fd6e8', leaf:'#e0a838'},
  // ground palette per season, written over W3D_PAL at load: desaturated mud and stubble, the leaves keep their colour
  pal: {
    spring:{grass:'#566b3a', dirt:'#6e5a40', forest:'#36502a', mud:'#463424'},
    summer:{grass:'#626a36', dirt:'#7a6646', forest:'#3e4c28', mud:'#4e3c28'},
    autumn:{grass:'#826634', dirt:'#6b5238', forest:'#3d3a22', mud:'#44301e'},
    winter:{grass:'#4e5444', dirt:'#605a4e', forest:'#333d2c', mud:'#3e342a'}
  },
  // time-of-day grade (section 2, by time of day): sky/horizon/key/shadow/panel from the sheet;
  // mul = the multiply tint over the whole frame (its brightness is the ambient level, its hue the shadow cast),
  // add = additive key light alpha, hazeA = horizon haze alpha, amb = ambient share of day (drives fire strength)
  grade: {
    dawn:  {sky:'#6e7fa8', hor:'#f2b58a', key:'#ffd7a8', sh:'#4a4468', panel:'#2b2438', mul:'#c4b0c2', add:0.08, hazeA:0.16, amb:0.72},
    day:   {sky:'#5f93c8', hor:'#bcd6e6', key:'#fff1d0', sh:'#4a5670', panel:'#2e2a24', mul:'#f2ece0', add:0.04, hazeA:0.08, amb:1.0},
    dusk:  {sky:'#4a3a6a', hor:'#e8774a', key:'#ffb070', sh:'#3a2a52', panel:'#2a1a24', mul:'#b48272', add:0.10, hazeA:0.20, amb:0.6},
    night: {sky:'#0e1630', hor:'#243a62', key:'#9ab4e8', sh:'#101830', panel:'#10162a', mul:'#44527e', add:0.07, hazeA:0.14, amb:0.3}
  },
  seq: ['day', 'dusk', 'day', 'dawn', 'day', 'night', 'day', 'dusk'],
  fire: {r: 6 * CELL, col: [255, 150, 60], brazier: [255, 160, 70]},
  vignette: 0.22,
  afterPools: []   // fns (cx, cy, grade, fireK) drawn in world space after the pools, before the HUD
};
const hex2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c, a) => { const v = typeof c === 'string' ? hex2(c) : c; return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; };

/* time of day: forced > mission night flag > per-mission sequence; camp is evening */
LOOK.time = function(){
  if (LOOK.force) return LOOK.force;
  if (typeof G !== 'undefined' && G){
    if (G.lookTime) return G.lookTime;
    if (G.nightTint) return (G.lookTime = 'night');
    const n = (typeof META !== 'undefined' && META && META.deployments) | 0;
    return (G.lookTime = LOOK.seq[n % LOOK.seq.length]);
  }
  return 'dusk';
};
LOOK.gradeOf = () => LOOK.grade[LOOK.time()] || LOOK.grade.day;
/* how much the fires matter: 0.5 by day, about 1.3 at night */
LOOK.fireK = () => { const g = LOOK.gradeOf(); return 0.5 + (1 - g.amb) * 1.2; };

/* F-43 (QA audits/f43-playability.md s2 item 3, HUD plus grade 3.6 ms): the grade was four full-screen passes (multiply, additive key,
   screen haze, vignette). Every one of them is a per-pixel function that does not depend on what is under it, so together they are
   out = dst * M + A, exactly (screen and source-over with fixed colours are affine in dst). M and A are worked out once per grade on a
   1/foldRes grid, smoothed up to canvas size into two layers, and the frame pays two unscaled blits: multiply M, add A (a scaled blit
   costs three times a fill on a software canvas, an unscaled one the same as a fill). The layers cost 2 x canvas size in memory and are
   rebuilt when the grade, the view, the render scale or the vignette change. ROLLBACK: LOOK.gradeFold = false (the four passes). */
LOOK.gradeFold = true; LOOK.foldRes = 4; LOOK.foldBuilds = 0;
let gfM = null, gfA = null, gfKey = '';
const nSetT = CanvasRenderingContext2D.prototype.setTransform, nGetT = CanvasRenderingContext2D.prototype.getTransform;
function gradeFolded(w, h, g, vignette){
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0); const t = nGetT.call(ctx);
    if (t.b || t.c || !(t.a > 0) || !(t.d > 0)) throw new Error('grade fold: transform');
    const q = Math.max(1, LOOK.foldRes | 0), lw = Math.ceil(w / q) + 1, lh = Math.ceil(h / q) + 1, va = vignette ? LOOK.vignette : 0;
    const DW = Math.ceil(w * t.a), DH = Math.ceil(h * t.d);
    const key = [w, h, q, DW, DH, g.mul, g.key, g.add, g.hor, g.hazeA, va].join('|');
    if (key !== gfKey || !gfM){
      const small = () => { const c = document.createElement('canvas'); c.width = lw; c.height = lh; return c; };
      const sM = small(), sA = small();
      const mul = hex2(g.mul).map(v => v / 255), kc = hex2(g.key).map(v => v / 255), hor = hex2(g.hor).map(v => v / 255), vc = [20 / 255, 12 / 255, 6 / 255];
      const cx = w / 2, cy = h / 2, r0 = Math.min(w, h) * 0.4, r1 = Math.max(w, h) * 0.72, hz = h * 0.45;
      const gm = sM.getContext('2d'), ga = sA.getContext('2d'), DM = gm.createImageData(lw, lh), DA = ga.createImageData(lw, lh), m = DM.data, ad = DA.data;
      for (let j = 0; j < lh; j++){ const y = (j + 0.5) * q, H = y < hz ? g.hazeA * (1 - y / hz) : 0;
        for (let i = 0; i < lw; i++){ const x = (i + 0.5) * q, o = (j * lw + i) * 4;
          let a = 0; if (va){ const d = Math.hypot(x - cx, y - cy); a = va * Math.max(0, Math.min(1, (d - r0) / (r1 - r0))); }
          for (let c = 0; c < 3; c++){ const sc = H * hor[c];
            m[o + c] = Math.round(255 * mul[c] * (1 - sc) * (1 - a));
            ad[o + c] = Math.round(255 * Math.min(1, ((g.add * kc[c]) * (1 - sc) + sc) * (1 - a) + vc[c] * a)); }
          m[o + 3] = 255; ad[o + 3] = 255; } }
      gm.putImageData(DM, 0, 0); ga.putImageData(DA, 0, 0);
      const up = (src, old) => { const c = (old && old.width === DW && old.height === DH) ? old : document.createElement('canvas'); c.width = DW; c.height = DH;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, lw * q * t.a, lh * q * t.d); return c; };
      gfM = up(sM, gfM); gfA = up(sA, gfA); gfKey = key; LOOK.foldBuilds++;
    }
    nSetT.call(ctx, 1, 0, 0, 1, Math.round(t.e), Math.round(t.f)); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(gfM, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(gfA, 0, 0);
  } finally { ctx.restore(); }
}
/* the grade itself, in screen space over everything drawn so far */
function grade(w, h, g, vignette){
  if (LOOK.gradeFold){ try { return gradeFolded(w, h, g, vignette); } catch (e) { LOOK.gradeFold = false; } }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1; ctx.fillStyle = g.mul; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = g.add; ctx.fillStyle = g.key; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1;
  const hz = ctx.createLinearGradient(0, 0, 0, h * 0.45); hz.addColorStop(0, rgba(g.hor, g.hazeA)); hz.addColorStop(1, rgba(g.hor, 0));
  ctx.fillStyle = hz; ctx.fillRect(0, 0, w, h * 0.45);
  if (vignette){
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(20,12,6,0)'); vg.addColorStop(1, 'rgba(20,12,6,' + LOOK.vignette + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
/* a warm pool of light on the ground, additive, in world space */
function pool(x, y, r, col, k){
  const gr = ctx.createRadialGradient(x, y + 4, r * 0.08, x, y + 4, r);
  gr.addColorStop(0, rgba(col, 0.34 * k)); gr.addColorStop(0.5, rgba(col, 0.12 * k)); gr.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y + 4, r, r * 0.6, 0, 0, TAU); ctx.fill();
}

/* palette: write the grim ground colours over the 3D world palette before any tile is baked.
   LOOK.setPal(false) puts the old colours back and flushes the baked tiles (for before/after shots); setPal(true) restores. */
LOOK.palOld = {};
LOOK.setPal = function(on){
  try {
    for (const se in LOOK.pal) if (W3D_PAL[se]){
      if (!LOOK.palOld[se]){ LOOK.palOld[se] = {}; for (const k in LOOK.pal[se]) LOOK.palOld[se][k] = W3D_PAL[se][k]; }
      Object.assign(W3D_PAL[se], on ? LOOK.pal[se] : LOOK.palOld[se]);
    }
    for (const k in SPR) if (/^(wg2|wt|wpl):/.test(k)) delete SPR[k];
    for (const k in W3D_BANDCACHE) delete W3D_BANDCACHE[k];
    if (typeof W3TS !== 'undefined') W3TS.sig = '';
    if (typeof G !== 'undefined' && G) G.bgPat = null;
    if (typeof CAMP !== 'undefined'){ CAMP.pat = null; CAMP.road = null; CAMP.cpPat = null; }
  } catch (e) {}
};
LOOK.setPal(true);

/* field: grade the world, then the fire pools, then the HUD as before */
{ const f = drawHUD;
  drawHUD = function(){
    if (LOOK.on && G && G.leader && MAP && G.obj !== 'brawl'){
      try {
        const g = LOOK.gradeOf(); grade(VW, VH, g, true);
        const k = LOOK.fireK();
        camWorld(v => { const cx = v.x, cy = v.y; ctx.globalCompositeOperation = 'lighter';   /* A2: the zoomed world (deployment.js camWorld) */
        for (const fz of (G.fires || [])) pool(fz.x, fz.y, LOOK.fire.r * (0.7 + 0.3 * Math.min(1, (fz.life || 60) / 60)), LOOK.fire.col, k * Math.min(1, (fz.life || 60) / 60));
        for (const b of (G.braziers || [])) if (b.lit !== false) pool(b.x, b.y, LOOK.fire.r * 1.2, LOOK.fire.brazier, k * 0.9);
        for (const h of LOOK.afterPools) h(cx, cy, g, k);   /* phase 3 hooks: bloom, beams; world space, still 'lighter' */
        });
      } catch (e) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    }
    f();
  };
}
/* camp: the evening grade over the finished camp, then the cookfire pool */
{ const f = drawCamp;
  drawCamp = function(){
    f();
    if (!LOOK.on || (typeof G !== 'undefined' && G)) return;
    try {
      const g = LOOK.gradeOf(); grade(VW, VH, g, false);
      const F = typeof LOOK.campFire === 'function' ? LOOK.campFire() : (typeof HUB !== 'undefined' && HUB.fire);   /* VO3: the prologue town's fire is not at the hub's spot */
      if (F && typeof CAMP !== 'undefined' && CAMP.cam){
        ctx.save(); ctx.translate(-Math.round(CAMP.cam.x), -Math.round(CAMP.cam.y)); ctx.globalCompositeOperation = 'lighter';
        pool(F.x, F.y, LOOK.fire.r * 1.1, LOOK.fire.col, LOOK.fireK() * (0.9 + 0.1 * Math.sin((CAMP.t || 0) / 5)));
        ctx.restore();
      }
    } catch (e) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  };
}
/* unit rim light from fires: stronger as the scene darkens */
{ const f = r3dLights;
  r3dLights = function(x, y){
    const out = f(x, y);
    if (!LOOK.on || !out.length) return out;
    const k = 0.55 + (1 - LOOK.gradeOf().amb) * 0.9;
    for (const L of out) L.f = Math.min(1, L.f * k);
    return out;
  };
}
})();
