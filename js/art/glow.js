/* ============================================================================
   INDEX 102 - VO-1 visual overhaul, phase 3: light and bloom
   (Fable job 5b, audits/fable/vo1.md; rules in docs/art-direction.md section 2)
   Cost: under 1 ms a frame at 1280x800 with the GPU canvas; a slow-frame guard
   (LOOK.glow.guard) turns the bloom and beams off below about 25 fps.
   Loads after js/art/look.js and js/art/anim.js. Bloom only on the things that emit:
   ground fires and braziers (a tight bright halo inside the phase-1 pool),
   spell orbs and enemy fire orbs, lightning, and a glint on coins and gems.
   One key light: a weak directional sun or moon in the grade's key colour is
   added to every unit's light list, so the existing rim light (r3dLightUp)
   models the hour on every figure, not only those near a fire. Sunbeams
   scaled by how wooded the map is, by day, dawn and dusk,
   and window light in the tavern brawl: soft diagonal bands in screen space.
   Knobs: LOOK.glow.on, .halo (fire halo radius and strength), .orb, .coin,
   .sun (strength by time), .beams (count, alpha, angle).
   ROLLBACK: remove this script tag (or LOOK.glow.on = false at runtime).
============================================================================ */
(function(){
'use strict';
if (typeof LOOK === 'undefined') return;
const GL = LOOK.glow = {
  on: true,
  halo: {r: 30, a: 0.5},                  // fire and brazier halo radius (px) and strength at night
  orb: {r: 22, a: 0.55},                  // spell orbs
  coin: {r: 16, a: 0.45},                 // pickups
  sun: {dawn: 0.32, day: 0.22, dusk: 0.34, night: 0.18, dx: -0.55, dy: -0.85},   // key-light rim strength and direction (screen space, from the upper left)
  beams: {n: 5, a: {dawn: 0.10, day: 0.07, dusk: 0.11, night: 0}, brawlA: 0.09, slope: 0.55, w: 70, gap: 230, forest: [0.12, 0.38]}   // beam strength ramps from none at 12% forest to full at 38% (maps run 15 to 40%)
};
const hex2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
const halo = (x, y, r, col, a) => {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.4, rgba(col, a * 0.45)); gr.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
};
const FIRE = [255, 170, 80], MISSILE = hex2(LOOK.accent.azure), HEX = hex2(LOOK.accent.violet), ORB = [255, 140, 60], BOLT = [170, 210, 255], COIN = hex2(LOOK.accent.saffron), GEM = hex2(LOOK.accent.cyan);

/* bloom, in world space after the pools (ctx is translated and 'lighter') */
LOOK.afterPools.push(function(cx, cy, g, k){
  if (!GL.on || GL.slow) return;
  const on = (o, pad = 60) => o.x > cx - pad && o.x < cx + VW + pad && o.y > cy - pad && o.y < cy + VH + pad;
  const kk = Math.min(1, 0.55 + k * 0.5), fl = 0.9 + 0.1 * Math.sin(G.frame / 3);
  for (const f of (G.fires || [])) if (on(f)) halo(f.x, f.y - 6, GL.halo.r * (0.7 + 0.3 * Math.min(1, (f.life || 60) / 60)), FIRE, GL.halo.a * kk * fl * Math.min(1, (f.life || 60) / 60));
  for (const b of (G.braziers || [])) if (b.lit !== false && on(b)) halo(b.x, b.y - 8, GL.halo.r * 0.9, FIRE, GL.halo.a * kk * fl);
  for (const s of (G.shots || [])) if (s.kind !== 'arrow' && s.kind !== 'called' && on(s)) halo(s.x, s.y, GL.orb.r, s.kind === 'hex' ? HEX : MISSILE, GL.orb.a);
  for (const s of (G.eshots || [])) if (s.kind !== 'bolt' && s.kind !== 'ray' && on(s)) halo(s.x, s.y, GL.orb.r, ORB, GL.orb.a);
  for (const x of (G.fx || [])) if (x.bolt && !x.corpse && on(x)){ const a = Math.min(1, x.life / 16) * 0.6; halo(x.x, x.y, 26, BOLT, a); halo(x.tx, x.ty, 34, BOLT, a); }
  for (const p of (G.pickups || [])) if (!p.got && on(p) && (typeof visNow !== 'function' || visNow(p))){
    const pulse = 0.6 + 0.4 * Math.sin((G.frame + p.x) / 9);
    halo(p.x, p.y, GL.coin.r, p.kind === 'coin' ? COIN : GEM, GL.coin.a * pulse * kk);
  }
});

/* sunbeams and window light, in screen space over the graded world */
function beams(a, g){
  if (!(a > 0)) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
  const col = hex2(g.key), B = GL.beams, drift = ((G.frame || 0) * 0.15) % B.gap;
  for (let i = -1; i <= B.n; i++){
    const x0 = i * B.gap + drift, gr = ctx.createLinearGradient(0, 0, 0, VH * 0.9);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.55, rgba(col, a * 0.35)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + B.w, 0); ctx.lineTo(x0 + B.w + VH * B.slope, VH); ctx.lineTo(x0 + VH * B.slope, VH); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
const forestK = () => {   /* 0..1: how wooded the map is, cached on G */
  if (G.lookForest === undefined){
    let n = 0; try { for (const c of MAP.g) if (c === T.FOREST) n++; const [lo, hi] = GL.beams.forest; G.lookForest = Math.max(0, Math.min(1, (n / MAP.g.length - lo) / (hi - lo))); } catch (e) { G.lookForest = 0; }
  }
  return G.lookForest;
};
{ const f = drawHUD;
  drawHUD = function(){
    if (GL.on && !GL.slow && LOOK.on && G && G.leader && MAP){
      try {
        const g = LOOK.gradeOf();
        if (G.obj === 'brawl') beams(GL.beams.brawlA, LOOK.grade.dusk);   /* lamplight through the tavern windows */
        else if (window.BEAMS44 === true) beams((GL.beams.a[LOOK.time()] || 0) * forestK(), g);   /* F-44c: the hard-edged forest stripes read as a broken monitor; off by default, window.BEAMS44 = true brings them back */
      } catch (e) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    }
    f();
  };
}
/* slow-frame guard: the bloom and beams switch off while the frame interval runs long (under about 25 fps) and come back when it recovers */
GL.slow = false; GL.guard = {off: 40, on: 26, ema: 16, last: 0};
{ const f = loop;
  loop = function(){
    const t = performance.now(), q = GL.guard;
    if (q.last){ const dt = Math.min(200, t - q.last); q.ema += (dt - q.ema) * 0.1; if (!GL.slow && q.ema > q.off) GL.slow = true; else if (GL.slow && q.ema < q.on) GL.slow = false; }
    q.last = (typeof G !== 'undefined' && G && !G.paused) ? t : 0;
    f();
  };
}
/* the key light: a weak sun or moon on every figure, in the hour's colour */
{ const f = r3dLights;
  r3dLights = function(x, y){
    const out = f(x, y);
    if (!GL.on || !LOOK.on || typeof G === 'undefined' || !G) return out;
    try { const t = LOOK.time(), g = LOOK.grade[t] || LOOK.grade.day; out.push({dx: GL.sun.dx * 100, dy: GL.sun.dy * 100, f: GL.sun[t] || 0.2, col: hex2(g.key)}); } catch (e) {}
    return out;
  };
}
})();
