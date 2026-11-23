/* js/core/render.js (INT-1 step 2, 2026-11-16): RENDER.
   Cut unchanged from the inline script in index.html (old lines 3952 to 4302). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   RENDER
============================================================================ */
function blit(img, x, y, s, flip, ax, ay){
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -ax*s, -ay*s, img.width*s, img.height*s); ctx.restore();
}
function shadow(x, y, w){ ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, w, w*0.32, 0, 0, TAU); ctx.fill(); }
function pickFrame(u, moving, seed){ return u.atkT > 0 ? (u.atkKind === 'ranged' ? 4 : 3) : moving ? 1 + (((G.frame + (seed||0)*7) / 9 | 0) % 2) : 0; }
/* S6-C note 10 (Art Director, 2026-11-17): the old 2D pixel sprites are retired (Patrick, PL-1). These three base draws
   used to blit the pixel frames whenever a 3D hook declined (bake not ready, unit not matched, a throw). They now draw
   FIG_PH, a soft non-pixel stand-in (shadow plus a dim rounded silhouette) for the few frames before the 3D figure is
   baked. spr is read only for its size; its frames are never drawn. Spec: audits/art/pixel-purge.md section 1. */
const FIG_PH = {col:'rgba(34,28,22,.55)', rim:'rgba(220,200,160,.10)', n:0};
function figPlaceholder(x, y, s, o){
  o = o || {}; FIG_PH.n++;
  const h = (o.h || 16) * s, w = (o.w || 7) * s, feet = y + (o.feet !== undefined ? o.feet : 7) * s;
  if (o.shadow !== false) shadow(x, feet, (o.shadowW || 4.5) * s);
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.translate(x, feet); if (o.down) ctx.rotate(o.left ? Math.PI / 2 : -Math.PI / 2);
  ctx.fillStyle = FIG_PH.col; ctx.strokeStyle = FIG_PH.rim; ctx.lineWidth = Math.max(1, s * 0.4);
  if (o.mount){ ctx.beginPath(); ctx.ellipse(0, -h * 0.42, w * 1.9, h * 0.26, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (o.box){ ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h, w, h * 0.8, s * 2) : ctx.rect(-w / 2, -h, w, h * 0.8); ctx.fill(); ctx.stroke(); ctx.restore(); return; }   // a wagon or cart
  if (o.horse){ ctx.beginPath(); ctx.ellipse(0, -h * 0.5, w * 1.6, h * 0.3, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); return; }   // a four-legged body only (horse, hound)
  const top = o.mount ? -h * 1.25 : -h;
  ctx.beginPath(); ctx.ellipse(0, top * 0.48 + (o.mount ? -h * 0.3 : 0), w / 2, -top * 0.36, 0, 0, TAU); ctx.fill(); ctx.stroke();   // body
  ctx.beginPath(); ctx.arc(0, top + w * 0.42, w * 0.38, 0, TAU); ctx.fill(); ctx.stroke();   // head
  ctx.restore();
}
function figSize(spr){ try { return spr && spr.h ? {h:Math.min(30, spr.h - 2), w:Math.min(14, (spr.w || 12) * 0.55), feet:spr.h - spr.ay - 2} : {}; } catch (e) { return {}; } }
function drawSprite(spr, x, y, s, frame, left, flash){
  figPlaceholder(x, y, s, figSize(spr));
}
// A rider on the squad's horse, before the 3D horse and rider are baked.
function drawMounted(spr, x, y, s, frame, left, flash, moving, seed){
  figPlaceholder(x, y, s * 1.05, {h:22, w:7, mount:true, shadowW:10});
}
function drawDowned(spr, x, y, s, alpha){
  ctx.fillStyle = 'rgba(120,10,10,.45)'; ctx.beginPath(); ctx.ellipse(x, y+6, 9*s/2, 3*s/2, 0, 0, TAU); ctx.fill();
  figPlaceholder(x, y - 3 * s, s, Object.assign(figSize(spr), {down:true, alpha, shadow:false}));
}

// Terrain layer: grass pattern, then a tile for every non-grass cell on screen.
function drawTerrain(cx, cy){
  if (!G.bgPat) G.bgPat = ctx.createPattern(groundPattern(), 'repeat');
  ctx.fillStyle = '#16130f'; ctx.fillRect(cx - 40, cy - 40, VW + 80, VH + 80);
  ctx.fillStyle = G.bgPat; ctx.fillRect(Math.max(0, cx - 40), Math.max(0, cy - 40),
    Math.min(MAP.w * CELL, cx + VW + 40) - Math.max(0, cx - 40), Math.min(MAP.h * CELL, cy + VH + 40) - Math.max(0, cy - 40));
  const x0 = Math.max(0, Math.floor(cx / CELL) - 1), x1 = Math.min(MAP.w - 1, Math.floor((cx + VW) / CELL) + 1);
  const y0 = Math.max(0, Math.floor(cy / CELL) - 1), y1 = Math.min(MAP.h - 1, Math.floor((cy + VH) / CELL) + 1);
  const g = MAP.g, w = MAP.w, wf = (G.frame / 30 | 0) % 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const t = g[y * w + x]; if (t === T.GRASS) continue;
    const px = x * CELL, py = y * CELL, below = y + 1 < MAP.h ? g[(y + 1) * w + x] : -1, v = (x * 7 + y * 13) % 3;
    let img = null;
    if (t === T.FOREST) img = TILE.forest(v);
    else if (t === T.RUBBLE) img = TILE.rubble(v);
    else if (t === T.ROAD) img = TILE.road(v);
    else if (t === T.FLOOR) img = TILE.floor(0);
    else if (t === T.HILL){ ctx.drawImage(TILE.hill(v), px, py); if (below !== T.HILL) ctx.drawImage(TILE.hillEdge(), px, py); continue; }
    else if (t === T.WATER) img = TILE.water(wf);
    else if (t === T.STONE) img = below === T.STONE ? TILE.stoneTop() : TILE.stone();
    else if (t === T.PALISADE) img = TILE.palisade();
    else if (t === T.ROOF){ const st = MAP.structures.find(s => s.kind === 'house' && Math.abs(s.x - x) <= 4 && Math.abs(s.y - y) <= 3); img = below === T.ROOF ? TILE.roof(st ? st.v : 0) : TILE.wallFront(0); }
    else if (t === T.TENT) img = TILE.tent(v);
    else if (t === T.WALL) img = below === T.WALL ? TILE.stoneTop() : TILE.stone();
    else if (t === T.WAGON){ if (typeof isBrawl === 'function' && isBrawl()) img = TILE.floor(0); else continue; }   /* Index 70: floor under the tavern furniture */
    else if (t === T.GATE) img = TILE.road(v);
    if (img) ctx.drawImage(img, px, py);
  }
}

/* A1 (audits/art/a1a2-squad-read.md): the squad shows through what covers it.
   silCovers() finds, before the y-sorted body pass, each squad figure (Leader and living mates, whole field) that a structure or
   tree drawn after it covers (SW6.covers on vo2/vo3 items, the old near-box on MAP.trees). silDraw() draws such a figure into a
   small canvas at whole device pixels and blits it 1:1 (it looks the same), and keeps the copy. silFinish(), after all bodies,
   draws each copy again at SIL.a with a 1 px rim in the Leader ring's gold at SIL.rimA. Enemies get none.
   window.SIL_A1 = false turns the silhouettes off. */
const SIL = {a: 0.45, rimA: 0.7, col: '#d4af37', mateRing: 0.5, box: {w: 44, up: 56, down: 40}, cov: new Set(), shots: [], pool: [], n: 0};
/* AD gap (e903a7da): rubble, cliffs and tents are neither tall nor SW6.low, so SW6.covers always said no and a ruined wall could hide
   the Leader to the helmet with no silhouette. Rule 1 is any structure, so these get their own test: the image (trimmed at the sides
   like SW-6) must reach above the figure's feet, not just its shadow. No fade for them: only the silhouette. */
function silOver(it, w, h, f){
  if (!(f.y < it.y)) return false;
  const x0 = it.x - (it.ax || 0) * (it.s || 1), y0 = it.y - (it.ay || 0) * (it.s || 1), t = SW6.trim || 0;
  return f.x + SW6.figW > x0 + w * t && f.x - SW6.figW < x0 + w * (1 - t) && y0 < f.y - 4 && y0 + h > f.y - SW6.figH;
}
/* PL-1 item 3 (AD ruling, audits/art/pl1-2d-rulings.md): the Called Shot is a vector throwing knife in world units, spinning as before.
   Hilt 4 long and 2 wide, #5a3a1e; blade a tapered quad 10 long, 2.5 at the base, steel #c8ccd4 with a #f0f2f4 edge line; a 1 px dark
   edge. Drawn in the world pass, so it scales with the zoom. No smear. */
function calledKnife(s){
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(G.frame * 0.6);
  const t = ctx.getTransform(), zk = Math.hypot(t.a, t.b) || 1, px = 1 / zk;   // 1 device px in world units, so the edge stays 1 px at any zoom (hypot: after the rotate, a alone is zoom*cos; EN review)
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(12,8,4,.9)'; ctx.lineWidth = px;
  ctx.beginPath(); ctx.rect(-7, -1, 4, 2); ctx.fillStyle = '#5a3a1e'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3, -1.25); ctx.lineTo(7, 0); ctx.lineTo(-3, 1.25); ctx.closePath(); ctx.fillStyle = '#c8ccd4'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2.6, -0.7); ctx.lineTo(6.2, -0.08); ctx.strokeStyle = '#f0f2f4'; ctx.lineWidth = Math.max(px, 0.5); ctx.stroke();
  ctx.restore();
}
function silCovers(bodies, L){
  SIL.cov.clear(); SIL.shots.length = 0;
  if (window.SIL_A1 === false || typeof SW6 !== 'object' || !SW6 || !G) return;
  const figs = []; if (L && !L.down) figs.push(L);
  for (const m of G.squad || []) if (m && m.state === 'up') figs.push(m);
  if (!figs.length) return;
  for (const b of bodies){
    if (b.it){ const it = b.it; if (!it.img) continue;
      const s = it.s || 1, w = it.img.width * s, h = it.img.height * s, fade = it.tall || (SW6.low && SW6.low(it));
      for (const f of figs) if (!SIL.cov.has(f) && (fade ? SW6.covers(it, w, h, [f]) : silOver(it, w, h, f))) SIL.cov.add(f); }
    else if (b.tree){ const t = b.tree; for (const f of figs) if (Math.abs(t.x - f.x) < 34 && f.y < t.y && f.y > t.y - 70) SIL.cov.add(f); }
  }
}
function silDraw(f, fn){
  if (!SIL.cov.has(f)) return fn();
  const P = CanvasRenderingContext2D.prototype, m = P.getTransform.call(ctx);
  if (m.b || m.c || !(m.a > 0) || !(m.d > 0)) return fn();
  const B = SIL.box, x0 = f.x - B.w, y0 = f.y - B.up, ox = Math.floor(m.a * x0 + m.e), oy = Math.floor(m.d * y0 + m.f);
  const W = Math.ceil(m.a * 2 * B.w) + 4, H = Math.ceil(m.d * (B.up + B.down)) + 4, i = SIL.shots.length;
  const p = SIL.pool[i] || (SIL.pool[i] = {c: document.createElement('canvas'), r: document.createElement('canvas')});
  if (p.c.width !== W || p.c.height !== H){ p.c.width = p.r.width = W; p.c.height = p.r.height = H; }
  const g = p.c.getContext('2d'); P.setTransform.call(g, 1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  P.setTransform.call(g, m.a, 0, 0, m.d, m.e - ox, m.f - oy); g.imageSmoothingEnabled = ctx.imageSmoothingEnabled;
  const main = ctx; ctx = g;
  try { fn(); } finally { ctx = main; }
  ctx.save(); P.setTransform.call(ctx, 1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(p.c, ox, oy); ctx.restore();
  SIL.shots.push({p, ox, oy, f});
}
function silFinish(){
  SIL.n = SIL.shots.length; if (!SIL.n) return;
  const P = CanvasRenderingContext2D.prototype;
  ctx.save(); P.setTransform.call(ctx, 1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'source-over';
  try {
    for (const q of SIL.shots){ const c = q.p.c, r = q.p.r, g = r.getContext('2d');
      P.setTransform.call(g, 1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, r.width, r.height);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(c, dx, dy);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = SIL.col; g.fillRect(0, 0, r.width, r.height);
      g.globalCompositeOperation = 'destination-out'; g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = SIL.rimA; ctx.drawImage(r, q.ox, q.oy);
      ctx.globalAlpha = SIL.a; ctx.drawImage(c, q.ox, q.oy); }
  } finally { ctx.restore(); }
}
function draw(){
  const L = G.leader, sw = VW, sh0 = VH;
  if (ctx.canvas === canvas){ SCRN.w = sw; SCRN.h = sh0; }
  const v = camView(sw, sh0), cx = v.x, cy = v.y;   /* A2: the world pass is zoomed by v.z; VW and VH are world px inside it */
  const sh = settings().shake ? G.shake : 0;
  const sx = sh ? rnd(-sh, sh)*0.35 : 0, sy = sh ? rnd(-sh, sh)*0.35 : 0;
  ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled = false;
  ctx.save(); ctx.scale(v.z, v.z); ctx.translate(-cx + sx, -cy + sy);
  VW = v.w; VH = v.h; CAMZ.on = true; CAMZ.dy = v.dy; CAMZ.z = v.z; CAMZ.cls = ''; camTextHook(ctx);
  try {
  drawTerrain(cx, cy);
  const onScreen = (o, pad = 60) => o.x > cx - pad && o.x < cx + VW + pad && o.y > cy - pad && o.y < cy + VH + pad;

  // fire on the ground
  for (const fz of G.fires) if (onScreen(fz)){
    ctx.globalAlpha = Math.min(1, fz.life / 60) * 0.85;
    // Art 16 Nov: the VO3 ground fire paints its own patch; the old flat disc left a hard round edge under it, so it is drawn only without VO3
    if (!(typeof VO3 !== 'undefined' && VO3 && VO3.on && VO3.gfire)){ ctx.fillStyle = 'rgba(200,70,20,.25)'; ctx.beginPath(); ctx.arc(fz.x, fz.y, fz.r, 0, TAU); ctx.fill(); }
    if (!(typeof w3dFlames === 'function' && w3dFlames(fz.x, fz.y, G.frame + (fz.x | 0)))) PROPS3D.box(fz.x, fz.y, 2.4, 12, 12, 6, 9, '#f0a040', 0.85); ctx.globalAlpha = 1; }   /* Index 76 */
  // corpses
  for (const x of G.fx) if (x.corpse && onScreen(x)){
    if (typeof r3dCorpse === 'function' && r3dCorpse(x)) continue;   /* Index 55 */
    /* S6-C note 10: no pixel corpse; the stand-in lies down instead */
    figPlaceholder(x.x, x.y, BESTIARY[x.k].sc * 1.2, {down:true, left:x.left, alpha:Math.min(1, x.life/40) * 0.7, shadow:false});
  }
  drawTraps(onScreen);
  for (const w of G.works){
    ctx.globalAlpha = Math.min(1, w.life/90);
    PROPS3D.work(w); ctx.globalAlpha = 1;   /* S6-C 3a: 3D briar and stakes (js/3d/props3d.js) */
  }
  // telegraphed artillery: get out of the circle
  for (const h of G.hazards){
    const k = 1 - h.t / h.max;
    ctx.fillStyle = h.kind === 'sharper' ? 'rgba(220,210,190,.18)' : 'rgba(255,90,30,.16)'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
    ctx.fillStyle = h.kind === 'sharper' ? 'rgba(220,210,190,.35)' : 'rgba(255,90,30,.35)'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = h.kind === 'sharper' ? '#e8e0d0' : '#ff6a2a'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  // the road out
  if (G.exitOpen && MAP.exit){ const pulse = 50 + Math.sin(G.frame / 10) * 6;
    ctx.strokeStyle = 'rgba(120,230,140,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(MAP.exit.x, MAP.exit.y, pulse, 0, TAU); ctx.stroke(); }
  // strongbox progress
  for (const v of G.vaults) if (!v.done && v.claimed > 0){ ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(v.x, v.y, 34, -Math.PI/2, -Math.PI/2 + TAU * v.claimed / 180); ctx.stroke(); }

  // Comrade Bonds: a gold thread between partners fighting side by side
  for (const m of G.squad){ if (m.state !== 'up' || !m.p.bond || m.p.id > m.p.bond) continue;
    const pt = G.squad.find(x => x.p.id === m.p.bond); if (!pt || pt.state !== 'up') continue;
    const d = dist(m, pt); if (d > 120) continue;
    ctx.strokeStyle = d < 60 ? 'rgba(255,216,96,.75)' : 'rgba(255,216,96,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m.x, m.y + 14); ctx.lineTo(pt.x, pt.y + 14); ctx.stroke(); }
  // Command Radius
  ctx.beginPath(); ctx.arc(L.x, L.y, G.mod.radius, 0, TAU);
  const sw = G.formation === 'SHIELD';
  ctx.strokeStyle = sw ? 'rgba(110,150,255,.75)' : G.chargeT ? 'rgba(255,220,110,.85)' : (G.t2e && G.t2e.ring && (window.TRAP2E && TRAP2E.live())) ? 'rgba(240,210,110,.95)' : 'rgba(240,210,110,.5)';   /* S6-11 criterion 22: full strength while a spotted trap is on screen */
  if (window.gfxRing) gfxRing(sw); else {   /* Index 84b: ink-backed command ring (js/art/graphics.js) */
  ctx.lineWidth = sw ? 3 : 2; ctx.setLineDash([8,10]); ctx.stroke(); ctx.setLineDash([]); }

  for (const p of G.pickups){ if (!onScreen(p) || !visNow(p)) continue;
    const bob = Math.sin((G.frame + p.x) / 10) * 1.5;
    PROPS3D.pickup(p, bob); }   /* S6-C 3a: 3D coin and gem */
  for (const b of G.blips) if (!b.revealed && onScreen(b) && (b.known || visNow(b))){
    if (b.known){ drawKnownBlip(b); continue; }
    PROPS3D.blip(b, (G.frame + b.x) / 14);
 }

  if (window.F33 && F33.drawMark) F33.drawMark(ctx);   // INDEX F33: the mark's ring, under the bodies
  // bodies, y-sorted so lower figures overlap higher ones
  const bodies = [];
  for (const e of G.enemies) if (onScreen(e, 120) && visNow(e)) bodies.push({y:e.y, e});   /* Index 49 */
  for (const m of G.squad) if (m.state !== 'dead') bodies.push({y:m.y, m});
  bodies.push({y:L.y, L});
  for (const t of MAP.trees) if (onScreen(t, 50) && (typeof wSeen !== 'function' || wSeen(t))) bodies.push({y:t.y, tree:t});   /* Index 70 */
  for (const c of G.caches) if (onScreen(c) && (typeof wSeen !== 'function' || wSeen(c))) bodies.push({y:c.y, cache:c});
  for (const v of G.vaults) if (onScreen(v) && (typeof wSeen !== 'function' || wSeen(v))) bodies.push({y:v.y, vault:v});
  for (const c of G.camps) if (onScreen(c, 80) && (typeof wSeen !== 'function' || wSeen(c))) bodies.push({y:c.y - 30, camp:c});   /* Index 70 */
  if (G.exitOpen && MAP.exit && onScreen(MAP.exit)) bodies.push({y:MAP.exit.y, exit:true});
  contractBodies(bodies, onScreen);
  bodies.sort((a,b) => a.y - b.y);
  silCovers(bodies, L);   /* A1 item 1 */
  for (const b of bodies){ ctx.save(); try {   /* Index 80: one bad body hides only itself */
    if (b.custom){ b.custom(); continue; }
    if (b.tree){ const t = b.tree, near = Math.abs(t.x - L.x) < 34 && L.y < t.y && L.y > t.y - 70;
      if (typeof w3dMapTree === 'function' && w3dMapTree(t, near)) continue;   /* Index 67 */
      if (near) ctx.globalAlpha = 0.45; PROPS3D.box(t.x, t.y, 2.4, 22, 30, 11, 28, '#3e5a2e'); ctx.globalAlpha = 1; continue; }
    if (b.cache){ const c = b.cache;
      if (!c.opened){ ctx.fillStyle = 'rgba(255,230,120,' + (0.15 + Math.sin(G.frame / 12) * 0.1) + ')'; ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, TAU); ctx.fill(); }
      if (!(typeof w3dCache === 'function' && w3dCache(c))) PROPS3D.box(c.x, c.y, 2.4, 14, c.kind === 'captive' ? 16 : 12, 7, 8, c.kind === 'captive' ? '#5f6870' : '#8a5a2a'); continue; }
    if (b.vault){ if (!(typeof w3dVault === 'function' && w3dVault(b.vault))) PROPS3D.box(b.vault.x, b.vault.y, 2.6, 18, 15, 9, 9, '#6a6a70'); continue; }
    if (b.camp){ if (!(typeof w3dBanner === 'function' && w3dBanner(b.camp.x - 70, b.camp.y - 44, b.camp.done ? 'm_banner_done' : 'm_banner'))) PROPS3D.box(b.camp.x - 70, b.camp.y - 50, 3, 10, 24, 2, 22, b.camp.done ? '#5a5a5a' : '#8a1a1a'); continue; }
    if (b.exit){ if (!(typeof w3dBanner === 'function' && w3dBanner(MAP.exit.x, MAP.exit.y + 6, 'm_banner_exit'))) PROPS3D.box(MAP.exit.x, MAP.exit.y, 3, 10, 24, 2, 22, '#3a8a4a'); continue; }   /* Index 70 */
    if (b.e){
      const e = b.e, B = BESTIARY[e.k], spr = enemySprite(e.k), s = B.sc * 1.2;
      const fr = e.dormant ? 0 : pickFrame(e, true, e.seed);
      if (e.hexT > 0){ ctx.fillStyle = 'rgba(150,90,200,.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 7*s, 6*s, 2*s, 0, 0, TAU); ctx.fill(); }
      if (e.charging){ ctx.fillStyle = 'rgba(255,120,60,.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 7*s, 7*s, 2.4*s, 0, 0, TAU); ctx.fill(); }
      drawSprite(spr, e.x, e.y, s, fr, e.left, e.flash > 0);
      if (e.b45wait){ const gx = e.x + 18, gy = e.y - spr.ay*s*0.5;   /* UX G7: beside its own dummy at chest height, same side for all (dummies are 62 px apart) */ ctx.save(); ctx.fillStyle = 'rgba(20,14,6,.7)'; ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd860'; ctx.fillRect(gx - 4, gy - 4.5, 3, 9); ctx.fillRect(gx + 1, gy - 4.5, 3, 9); ctx.restore(); }   // UX G7: a dummy waiting for Hal's word wears a 18 px pause mark over its head, no world text, no bar
      else if (B.boss || e.maxCon > 6){
        const w = Math.max(26, e.r*2.2), top = e.y - spr.ay*s + 4;
        ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(e.x-w/2-1, top-1, w+2, 6);
        ctx.fillStyle = '#b22222'; ctx.fillRect(e.x-w/2, top, w*Math.max(0, e.con/e.maxCon), 4);
        if (B.boss || B.arch === 'fixed'){ ctx.fillStyle = e.mark ? '#ff8a7a' : '#ffd860'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText((e.mark ? 'THE MARK: ' : e.nemesis ? 'NEMESIS: ' : '') + ename(e), e.x, top - 4);
          if (e.nemesis){ ctx.fillStyle = '#ffb04a'; ctx.font = 'bold 10px Georgia'; ctx.fillText('escaped you ' + e.nemesis.grudge + (e.nemesis.grudge > 1 ? ' times' : ' time'), e.x, top - 16); } }
      }
      if (e.dormant && B.boss){ ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('z', e.x + 18, e.y - spr.ay * s); }
      if (e.broken || e.shakenT > 0){ ctx.fillStyle = '#ffd860'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
        ctx.fillText(e.broken ? 'BROKEN' : 'SHAKEN', e.x, e.y - spr.ay*s + 2); }
    } else if (b.m){
      const m = b.m;
      if (m.state !== 'up'){
        drawDowned(m.spr, m.x, m.y, 2.4, 0.85);
        ctx.fillStyle = m.state === 'stable' ? '#8fd39a' : '#ff6a5a'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
        ctx.fillText(m.state === 'stable' ? 'STABLE' : 'BLEEDING OUT', m.x, m.y + 26);
        continue;
      }
      if (!m.inF){ ctx.beginPath(); ctx.ellipse(m.x, m.y + 17, 15, 5, 0, 0, TAU); ctx.strokeStyle = 'rgba(230,70,58,.95)';
        ctx.lineWidth = 2; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]); }
      else { const a0 = ctx.globalAlpha; ctx.beginPath(); ctx.ellipse(m.x, m.y + 17, 15, 5, 0, 0, TAU); ctx.globalAlpha = a0 * SIL.mateRing;   /* A1 item 4: a mate's ring */
        ctx.strokeStyle = SIL.col; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = a0; }
      silDraw(m, () => { if (G.mounted){ drawMounted(m.spr, m.x, m.y, 2.4, pickFrame(m, m.moving, m.slot), m.anim.left, m.flash > 0, m.moving, m.slot); }
      else drawSprite(m.spr, m.x, m.y, 2.4, pickFrame(m, m.moving, m.slot), m.anim.left, m.flash > 0); });
      if (window.gfxMateBar) gfxMateBar(m); else   /* Index 84: bordered, colour-graded squad bar (js/art/graphics.js) */
      for (let i = 0; i < m.maxCon; i++){ ctx.fillStyle = i < m.con ? '#6fd37a' : 'rgba(0,0,0,.45)';
        ctx.fillRect(m.x - m.maxCon*2.5 + i*5, m.y + 22, 4, 3); }
    } else if (L.down){
      drawDowned(L.spr, L.x, L.y, 2.7, 0.9);
      ctx.fillStyle = '#ff6a5a'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('LEADER DOWN', L.x, L.y + 30);
      if (L.helpT > 0){ ctx.strokeStyle = '#8fd39a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(L.x, L.y, 26, -Math.PI/2, -Math.PI/2 + TAU * L.helpT / L.helpNeed); ctx.stroke(); }
    } else {
      drawBuffer(L);
      ctx.beginPath(); ctx.ellipse(L.x, L.y + 19, 15, 5, 0, 0, TAU);
      ctx.strokeStyle = G.burn > 0 ? '#ff6a3a' : G.nudge > 0 ? '#f0e06a' : '#d4af37'; ctx.lineWidth = 2; ctx.stroke();
      silDraw(L, () => { if (G.mounted) drawMounted(L.spr, L.x, L.y, 2.7, pickFrame(L, L.moving, 0), L.anim.left, L.flash > 0, L.moving, 0);
      else drawSprite(L.spr, L.x, L.y, 2.7, pickFrame(L, L.moving, 0), L.anim.left, L.flash > 0); });
    }
  } catch (e) { campDrawError(e, b); } finally { ctx.restore(); } }   /* Index 80 */
  try { silFinish(); } catch (e) {}   /* A1 item 1: covered squad figures show through */

  for (const s of G.shots){
    const a = Math.atan2(s.vy, s.vx);
    if (s.kind === 'arrow' && window.STUCK && STUCK.fly(s, a)){ /* Index 95: 3D arrow */ }
    else if (s.kind === 'arrow') PROPS3D.bolt(s, a, false);   /* S6-C 3a: a drawn shaft while the 3D arrow bakes */
    else if (s.kind === 'called') calledKnife(s);   /* PL-1 item 3: vector knife, not two flat rects */
    else PROPS3D.orb(s, s.kind === 'hex' ? 'hex' : 'mm');   /* S6-C 3a: shaded spell spheres */
  }
  for (const s of G.eshots){
    const a = Math.atan2(s.vy, s.vx);
    if (s.kind === 'bolt') PROPS3D.bolt(s, a, true); else PROPS3D.orb(s, s.kind === 'ray' ? 'ray' : 'fire', true);   /* S6-C 3a */
  }
  if (window.STUCK) STUCK.draw();   /* Index 95: arrows and bolts that hit stay stuck */
  if (window.TRAP2E && TRAP2E.live()) try { TRAP2E.draw(onScreen); } catch (e) { console.warn('TRAP2E draw', e); }   /* S6-11: trap outline, bar and word plate, over the ring and the figures */
  for (const x of G.fx){
    if (x.corpse) continue;
    if (x.text){ ctx.globalAlpha = Math.min(1, x.life/25); CAMZ.cls = 'H';   /* A2: pop words keep their screen size */ ctx.font = 'bold ' + (window.gfxK ? Math.round(15 * gfxK()) : 15) + 'px Georgia'; ctx.textAlign = 'center';   /* Index 84d: scales with the window; Index 79: a dark outline, not a thin monospace */
      const ty = x.y - (46 - x.life)*0.7; ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(12,8,4,.9)'; ctx.strokeText(x.text, x.x, ty); ctx.fillStyle = x.c; ctx.fillText(x.text, x.x, ty); ctx.globalAlpha = 1; CAMZ.cls = ''; }
    else if (x.arc){ ctx.globalAlpha = x.life/9; ctx.strokeStyle = x.c; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x.x, x.y, 26, x.ang-0.75, x.ang+0.75); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (x.bolt){ ctx.globalAlpha = x.life/16; const r2 = rng(x.seed + (G.frame >> 2));
      for (const [c, w] of [['#9fd0ff', 6], ['#ffffff', 2]]){ ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x.x, x.y);
        for (let k = 1; k <= 10; k++){ const t = k / 10; ctx.lineTo(x.x + (x.tx - x.x) * t + (k < 10 ? (r2() - .5) * 18 : 0), x.y + (x.ty - x.y) * t + (k < 10 ? (r2() - .5) * 18 : 0)); }
        ctx.stroke(); }
      ctx.globalAlpha = 1; }
    else if (x.beam){ ctx.globalAlpha = x.life/16; ctx.strokeStyle = x.c; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x.x, x.y - 10); ctx.lineTo(x.tx, x.ty - 10); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (x.shock){ const t = 1 - x.life / x.max, k = Math.min(1, t / 0.32), rr = x.r * (1 - Math.pow(1 - k, 3)), a = Math.min(1, x.life / 12);   /* Index 32 */
      ctx.globalAlpha = a * (window.O1RING === false ? 0.2 : 0.04); ctx.fillStyle = x.c; ctx.beginPath(); ctx.arc(x.x, x.y, rr, 0, TAU); ctx.fill();   // UX O1 (Art 16 Nov): a faint wash, not a solid disc over the squad; window.O1RING = false brings back the old fill
      ctx.globalAlpha = a * 0.9; ctx.strokeStyle = x.c; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x.x, x.y, Math.max(1, rr), 0, TAU); ctx.stroke();
      ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x.x, x.y, Math.max(1, rr - 5), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (x.cring){ ctx.globalAlpha = 0.9 * x.life / x.max; ctx.strokeStyle = x.c; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x.x, x.y, x.r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }   /* UX C2-3: a contested objective's progress arc, whole, in #ff8a7a; it does not grow */
    else if (x.ring){ ctx.globalAlpha = x.life/14*0.7; ctx.strokeStyle = x.c; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x.x, x.y, Math.max(1, x.r*(1-x.life/24)), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (x.blast && window.FX48 !== false){ x.r += (x.max - x.r)*0.3; ctx.globalAlpha = Math.min(1, x.life/22);   /* FX48: a soft fireball */
      const gr = ctx.createRadialGradient(x.x, x.y, 0, x.x, x.y, Math.max(1, x.r)); gr.addColorStop(0, '#fff8dc'); gr.addColorStop(0.3, '#ffe080'); gr.addColorStop(0.68, x.c || '#ff8a3a'); gr.addColorStop(1, 'rgba(90,24,8,0)');
      ctx.beginPath(); ctx.arc(x.x, x.y, Math.max(1, x.r), 0, TAU); ctx.fillStyle = gr; ctx.fill(); ctx.globalAlpha = 1; }
    else if (x.blast){ x.r += (x.max - x.r)*0.3; ctx.globalAlpha = x.life/22;
      ctx.beginPath(); ctx.arc(x.x, x.y, x.r, 0, TAU); ctx.fillStyle = x.c; ctx.fill();
      ctx.beginPath(); ctx.arc(x.x, x.y, x.r*0.55, 0, TAU); ctx.fillStyle = '#ffe080'; ctx.fill(); ctx.globalAlpha = 1; }
    else if (x.horse && typeof r3qBolt === 'function' && r3qBolt(x)){}   /* Index 56 */
    else if (x.horse) figPlaceholder(x.x, x.y - 7 * 2.4, 2.4, {h:20, w:8, horse:true, shadowW:8, alpha:Math.min(1, x.life / 30)}); /* S6-C note 10: non-pixel stand-in */
    else if (x.spark){ const k = 1 - x.life / 28; ctx.globalAlpha = x.life / 28; ctx.fillStyle = x.c;
      for (let i = 0; i < 6; i++){ const a = i / 6 * TAU + k; ctx.fillRect(x.x + Math.cos(a) * k * 22 - 1, x.y + Math.sin(a) * k * 22 - k * 14 - 1, 3, 3); } ctx.globalAlpha = 1; }
    else if (x.cone){ ctx.globalAlpha = x.life/16*0.65; ctx.beginPath(); ctx.moveTo(x.x, x.y);
      ctx.arc(x.x, x.y, x.reach, x.ang-x.spread, x.ang+x.spread); ctx.closePath(); ctx.fillStyle = x.c; ctx.fill(); ctx.globalAlpha = 1; }
    else { ctx.globalAlpha = Math.min(1, x.life/30); ctx.fillStyle = x.c; ctx.fillRect(x.x|0, x.y|0, x.px||3, x.px||3); ctx.globalAlpha = 1; }
  }
  if (G.smokeT > 0 || G.fogT > 0){ ctx.fillStyle = 'rgba(200,200,200,.10)'; ctx.fillRect(cx, cy, VW, VH); }
  try { drawFieldFog(cx, cy); } catch (e) {}   /* Index 48 */
  } finally { VW = sw; VH = sh0; CAMZ.on = false; CAMZ.z = 1; CAMZ.cls = ''; }
  ctx.restore();
  try { drawExitArrow(cx, cy, v, sw, sh0); } catch (e) {}   /* F17: a gold arrow at the field edge points at the open exit while it is off screen */
  drawHUD();
  if (G.flash > 0){ ctx.fillStyle = `rgba(178,34,34,${G.flash/90})`; ctx.fillRect(0,0,VW,VH); }
  if (G.slowmo > 0){ ctx.fillStyle = `rgba(255,230,160,${G.slowmo/50*0.18})`; ctx.fillRect(0,0,VW,VH); }
}

// The squad's buffer on the field: Ward Tokens as blue pips, the Shield Pool as
// a gold arc, round the Leader's feet.
function drawBuffer(L){
  const y = L.y + 4, R = 30;
  if (G.shieldMax > 0){
    const seg = (Math.PI * 1.2) / G.shieldMax, start = Math.PI * 0.9;
    for (let i = 0; i < G.shieldMax; i++){
      const a0 = start + i * seg + 0.05, a1 = start + (i + 1) * seg - 0.05;
      ctx.strokeStyle = i < G.shieldPool ? (G.absorbFx && G.absorbKind === 'shieldPool' ? '#fff6c0' : '#d4af37') : 'rgba(0,0,0,.35)';
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(L.x, y, R, a0, a1); ctx.stroke();
    }
  }
  for (let i = 0; i < 4; i++){
    const a = -Math.PI / 2 + (i - 1.5) * 0.32, x = L.x + Math.cos(a) * (R + 14), yy = y + Math.sin(a) * (R + 14);
    if (i >= G.wards && !(G.wardFx > 0)) continue;
    ctx.fillStyle = i < G.wards ? (G.absorbFx && G.absorbKind === 'wards' ? '#ffffff' : '#87ceeb') : 'rgba(135,206,235,.25)';
    ctx.beginPath(); ctx.arc(x, yy, 3.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#123'; ctx.lineWidth = 1; ctx.stroke();
  }
  if (G.absorbFx > 0) G.absorbFx--;
  if (G.wardFx > 0) G.wardFx--;
}

/* ---------------------------------------------------------------------------
   MAPS: the corner minimap and the full map on the pause screen
--------------------------------------------------------------------------- */
function objectiveMarkers(){
  const out = [];
  for (const c of G.camps) out.push({x:c.x, y:c.y, kind:c.done ? 'done' : 'boss', k:c.boss && !c.boss.dead ? c.boss.k : null});
  for (const v of G.vaults) out.push({x:v.x, y:v.y, kind:v.done ? 'done' : 'vault', sp:'vault'});
  if (G.exitOpen && MAP.exit) out.push({x:MAP.exit.x, y:MAP.exit.y, kind:'exit', sp:'exit'});
  contractMarkers(out);
  if (G.obj === 'hold') out.push({x:(MAP.w/2) * CELL, y:(MAP.h/2) * CELL, kind:'fort'});
  for (const e of G.enemies) if (!e.dead && BESTIARY[e.k].boss && !e.home && !e.mark && e.seen) out.push({x:e.x, y:e.y, kind:'boss', k:e.k});
  return out;
}
function drawMapInto(g, X, Y, W, H, detail){
  const s = Math.min(W / MAP.w, H / MAP.h), ox = X + (W - MAP.w * s) / 2, oy = Y + (H - MAP.h * s) / 2;
  g.imageSmoothingEnabled = false;
  g.drawImage(MAP.mini, ox, oy, MAP.w * s, MAP.h * s);
  g.drawImage(MAP.fog, ox, oy, MAP.w * s, MAP.h * s);
  const P = (x, y) => [ox + x / CELL * s, oy + y / CELL * s];
  if (detail){
    for (const e of G.enemies) if (!e.dead && !e.dormant && seenXY(e.x, e.y) && visNow(e) && !BESTIARY[e.k].boss){ const [x, y] = P(e.x, e.y); g.fillStyle = 'rgba(220,60,50,.8)'; g.fillRect(x - 1, y - 1, 2, 2); }
  }
  // what is on the map looks like what it is: chests, cages and turned Blip Tokens
  const isz = detail ? 15 : 9;
  for (const t of (G.traps || [])) if (t.armed && (!t.enemy || t.seen)){ const [x, y] = P(t.x, t.y); mapIcon(g, PROPS3D.mapTrap(t.kind), x, y, isz, t.enemy ? '#ff6a5a' : '#8fd39a'); }
  for (const c of G.caches) if (!c.opened && !c.small && (seenXY(c.x, c.y) || (detail && G.edges.includes('recon')))){ const [x, y] = P(c.x, c.y); mapIcon(g, PROPS3D.mapCache(c.kind === 'captive'), x, y, isz, '#d4af37'); }
  for (const b of G.blips) if (!b.revealed && (seenXY(b.x, b.y) || b.known)){ const [x, y] = P(b.x, b.y);
    if (b.known) mapIcon(g, blipImage(b.known), x, y, isz + 2, b.known <= 2 ? '#c8a878' : b.known === 5 ? '#e8c060' : '#ff6a5a');
    else { g.fillStyle = '#c8a878'; g.font = 'bold ' + (detail ? 13 : 9) + 'px Georgia'; g.textAlign = 'center'; g.fillText('?', x, y + 4); } }
  if (detail){
    for (const e of G.enemies) if (!e.dead && !e.dormant && seenXY(e.x, e.y) && visNow(e) && !BESTIARY[e.k].boss){ const [x, y] = P(e.x, e.y); g.fillStyle = 'rgba(220,60,50,.8)'; g.fillRect(x - 1, y - 1, 2, 2); }
  }
  for (const m of objectiveMarkers()){
    const [x, y] = P(m.x, m.y), r = detail ? 7 : 4, ic = m.kind !== 'done' ? markerIcon(m) : null;
    if (ic){ mapIcon(g, ic, x, y, detail ? 22 : 12, {boss:'#e03030', vault:'#ffd860', exit:'#5ee07a', ally:'#9fe0ff', beacon:'#ff9a3a', lit:'#ffe060'}[m.kind] || '#fff'); continue; }
    g.strokeStyle = '#000'; g.lineWidth = 2;
    g.fillStyle = {boss:'#e03030', vault:'#ffd860', exit:'#5ee07a', done:'#7a7a7a', fort:'#87ceeb', ally:'#9fe0ff', beacon:'#ff9a3a', lit:'#ffe060'}[m.kind];
    g.beginPath(); if (m.kind === 'boss'){ g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); }
    else g.arc(x, y, r * .8, 0, TAU);
    g.fill(); g.stroke();
  }
  const [lx, ly] = P(G.leader.x, G.leader.y);
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(lx, ly, detail ? 5 : 3, 0, TAU); g.fill(); g.stroke();
  if (detail){ const cv = camView(), vw = cv.w / CELL * s, vh = cv.h / CELL * s, [bx, by] = P(cv.x, cv.y);   /* A2: the zoomed view's box */
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.strokeRect(bx, by, vw, vh); }
  return {ox, oy, s};
}
function drawPauseMap(cv){
  const g = cv.getContext('2d');
  g.fillStyle = '#d8c9a8'; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = '#4a3b2a'; g.lineWidth = 4; g.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  drawMapInto(g, 12, 12, cv.width - 24, cv.height - 24, true);
}

/* ---------------------------------------------------------------------------
   HUD - the Squad Leader Dashboard on screen
--------------------------------------------------------------------------- */
function pips(x, y, n, max, on){
  for (let i = 0; i < max; i++){ ctx.fillStyle = i < n ? on : 'rgba(245,239,227,.15)'; ctx.fillRect(x + i*11, y, 8, 8);
    if (i < n){ ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + i*11, y, 8, 2); } }
}
function panel(x, y, w, h){
  ctx.fillStyle = 'rgba(20,16,12,.82)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(x+1, y+1, w-2, h-2);
  ctx.strokeStyle = '#5d4e3e'; ctx.lineWidth = 1; ctx.strokeRect(x+4.5, y+4.5, w-9, h-9);
}
/* The places the edge arrows keep out of (canvas px): the goal box, IN SIGHT, the key hints with the AIM line, an open tip card. Used by drawExitArrow and by DECK.pointers (hud-deck.js, which divides by kx). */
window.edgeBoxes = function(ctx, W, H){
  const D = window.DECK, kx = D && D.vw > 0 ? W / D.vw : 1, ky = D && D.vh > 0 ? H / D.vh : kx, boxes = [];
  if (D){ for (const q of [D.objAt, D.sightAt]) if (q) boxes.push({x: q.x * kx, y: q.y * ky, w: q.w * kx, h: q.h * ky}); }
  try { const U = window.UX83;   // QA 23 Nov: the key hints and the AIM line (HUD units x UX83.k) are a box too: four hint lines, then the AIM line a step under
    if (U && U.hintTop && U.hintF && window.HUD43 !== false && !G.brawl && !(VW < 640 && window.K56 !== false)){
      const hk = U.k || 1, f = U.hintF(), st = U.hintStep(f), y0 = U.hintTop(); ctx.save(); ctx.font = f + 'px Georgia';
      const tw = Math.max(ctx.measureText('[SPACE] Shield Wall · [Q/R] Luck · [M] map').width, ctx.measureText('AIM MANUAL: left click shoots, right click or X swings').width + 8); ctx.restore();
      boxes.push({x: W - (14 + tw) * hk, y: (y0 - f) * hk, w: (14 + tw) * hk, h: (4 * st + 12 + f * 0.4) * hk}); }
  } catch (e) {}
  try { const cd = window.T45 && T45.card, e = cd && cd.getBoundingClientRect && cd.getBoundingClientRect(), cv = ctx.canvas.getBoundingClientRect();
    if (e && e.width && e.height && !(cd.classList && cd.classList.contains('hidden')) && getComputedStyle(cd).display !== 'none') boxes.push({x: (e.left - cv.left) * W / cv.width, y: (e.top - cv.top) * H / cv.height, w: e.width * W / cv.width, h: e.height * H / cv.height}); } catch (e) {}
  return boxes;
};
function drawExitArrow(cx, cy, v, W, H){
  if (!G.exitOpen || !MAP.exit || G.over) return;
  const z = v.z || 1, px = (MAP.exit.x - cx) * z, py = (MAP.exit.y - cy) * z, m = 24, r = 18;
  if (px > -40 && px < W + 40 && py > -40 && py < H + 40) return;   // the banner is on screen: no arrow
  /* P23-CARD s9 (UX 2cdfb907): the field area is measured live. Top = lowest bottom edge of the top-centre HUD (Momentum bar, coin and
     slain counter) + 24; bottom = the deck's top - 24; sides 24 in; the whole shape (radius r) stays inside. Deck rects are in the Deck's
     own scale (DECK.vw), so they go to canvas units by W / DECK.vw. The point then slides along the edge off the goal box, the key hints
     and an open tip card (12 clear). */
  const D = window.DECK, kx = D && D.vw > 0 ? W / D.vw : 1, ky = D && D.vh > 0 ? H / D.vh : kx;
  let topE = 46 * ky; if (D){ if (D.momAt) topE = Math.max(topE, (D.momAt.y + D.momAt.h) * ky); if (D.coinAt) topE = Math.max(topE, D.coinAt.y1 * ky); }
  const top = topE + m, bot = H - (D ? D.H * ky : 128) - m;
  const x0 = m + r, x1 = W - m - r, y0 = top + r, y1 = Math.max(y0 + 1, bot - r);
  const boxes = window.edgeBoxes(ctx, W, H);
  if (D && D.ptAt) for (const q of D.ptAt) boxes.push({x: q.x * kx, y: q.y * ky, w: q.w * kx, h: q.h * ky});   // QA 23 Nov: the blue ally / boss pointers (hud-deck.js) are boxes too
  const hit = (x, y) => boxes.some(q => x + r > q.x - 12 && x - r < q.x + q.w + 12 && y + r > q.y - 12 && y - r < q.y + q.h + 12);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = px - mx, dy = py - my, k = Math.min((x1 - x0) / 2 / Math.max(1, Math.abs(dx)), (y1 - y0) / 2 / Math.max(1, Math.abs(dy)));
  let ax = mx + dx * k, ay = my + dy * k;
  if (hit(ax, ay)){   // walk the inner rectangle's edge both ways from the point until clear (nearest first)
    const w = x1 - x0, h = y1 - y0, P = 2 * (w + h), at = s => { s = ((s % P) + P) % P; return s < w ? [x0 + s, y0] : s < w + h ? [x1, y0 + s - w] : s < 2 * w + h ? [x1 - (s - w - h), y1] : [x0, y1 - (s - 2 * w - h)]; };
    const s0 = (() => { const t = Math.abs(ay - y0) < 1 ? ax - x0 : Math.abs(ax - x1) < 1 ? w + ay - y0 : Math.abs(ay - y1) < 1 ? w + h + x1 - ax : 2 * w + h + y1 - ay; return t; })();
    for (let d = 2; d < P / 2; d += 2) for (const sg of [1, -1]){ const p = at(s0 + sg * d); if (!hit(p[0], p[1])){ ax = p[0]; ay = p[1]; d = P; break; } }
  }
  const a = Math.atan2(py - ay, px - ax);
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
  ctx.globalAlpha = 0.9 + Math.sin(G.frame / 12) * 0.1;
  ctx.fillStyle = '#ffd860'; ctx.strokeStyle = '#2a1f0c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * .7, -r * .75); ctx.lineTo(-r * .35, 0); ctx.lineTo(-r * .7, r * .75); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.restore();
  if (window.__arrowDbg) window.__arrowDbg = {ax, ay, r, boxes, top, bot, W, H};
}
function objectiveLine(){
  if (G.obj === 'hold'){ const left = Math.max(0, G.contract.minutes*60 - G.sec); return [`${String(left/60|0).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`, 'HOLD THE REDOUBT']; }
  const t = `${String(G.sec/60|0).padStart(2,'0')}:${String(G.sec%60).padStart(2,'0')}`;
  const cl = contractLine(t); if (cl) return cl;
  if (window.CF){ const rl = CF.raidLine(); if (rl) return rl; }
  if (G.obj === 'hunt') return [`${G.camps.filter(c => c.done).length} / ${G.camps.length}`, `COMMANDERS SLAIN  \u00b7  ${t}  \u00b7  ALARM ${G.alarm}`];
  if (G.exitOpen) return ['GET OUT', `REACH THE GREEN BANNER  \u00b7  ${t}`];
  return [`${G.vaults.filter(v => v.done).length} / ${G.vaults.length}`, `STRONGBOXES CRACKED  \u00b7  ${t}  \u00b7  ALARM ${G.alarm}`];
}
function drawHUD(){ return DECK.draw(); }   /* INDEX HD1: the Command Deck (js/ui/hud-deck.js) draws the field HUD; the old panels went in INT-1 group 14 */

