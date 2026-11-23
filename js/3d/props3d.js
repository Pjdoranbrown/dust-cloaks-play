/* ============================================================================
   PROPS3D - the Founding props in the game's 3D style (Art Director, S6-C 3a step 4, Q55 = a, 2026-11-17)
   Replaces the always-pixel props of audits/art/pixel-purge.md section 3 that the Founding shows:
     coin and gem pickups (P2), unknown blips (P3), spells and bolts (P4), briar and stake works (P1),
     minimap trap, cage, chest and blip icons (P5), the F-03 cages (P11), the HUD coin (P12), and the
     fallbacks under traps and known blips (P14).
   Models are W3D kinds (the same ray-traced parts, light and palette as every world prop). Spells are
   shaded spheres with a glow, lit from the upper left like the models. While a model bakes, a smooth
   vector stand-in draws; never the pixel sprite.
   No switch: step 5 removed the ?props3d=0 rollback and the pixel builders it fell back to.
   TEST    PROPS3D.selfTest()
============================================================================ */
const PROPS3D = {n:{model:0, standIn:0}};
Object.assign(W3D_KINDS, {
  m_coin:MPK([30, 30, 8], se => { const P = [], add = wAdd(P);   // a small stack of gold coins, the top one tipped
    add([{t:'cyl', a:[0, 0, 0], p:[0, 1.6, 0], r:5, z:'coin'}, {t:'cyl', a:[0.6, 1.6, 0.3], p:[0.6, 3.2, 0.3], r:5, z:'coinL'},
         {t:'cyl', a:[-0.4, 3.4, -0.2], p:[-0.2, 5.2, 1.4], r:5, z:'coin'}, {t:'ell', c:[-0.3, 4.6, 0.8], r:[2.2, 0.5, 2.2], z:'coinD'}]);
    return {parts:P, zones:SKZ(se, null, {coin:'#d8a830', coinL:'#f0c850', coinD:'#a87a18'}), keepZones:['coin', 'coinL', 'coinD']}; }, {seasonPass:false}),
  m_gem:MPK([30, 34, 8], se => { const P = [], add = wAdd(P);   // a cut gem: two cones, point down and point up
    add([{t:'cone', a:[0, 5.5, 0], p:[0, 0.4, 0], r:4.2, r2:0.2, z:'gem'}, {t:'cone', a:[0, 5.5, 0], p:[0, 9, 0], r:4.2, r2:1.6, z:'gemL'},
         {t:'ell', c:[-1.2, 7.6, 1.2], r:[0.9, 0.7, 0.5], z:'gemS'}]);
    return {parts:P, zones:SKZ(se, null, {gem:'#2a7ab0', gemL:'#5ab0e0', gemS:'#e8f6ff'}), keepZones:['gem', 'gemL', 'gemS']}; }, {seasonPass:false}),
  m_blip:MPK([40, 44, 10], se => { const P = [], add = wAdd(P);   // something crouched under a cloak in the grass: you cannot tell what
    add([{t:'ell', c:[0, 0.6, 0], r:[11, 0.8, 7], z:'dirt'}, {t:'cone', a:[0, 0.5, 0], p:[0, 13, -1], r:8.5, r2:2.2, z:'cloakB'},
         {t:'ell', c:[0, 14, -0.6], r:[3.6, 3.4, 3.4], z:'cloakB'}, {t:'ell', c:[0, 13.6, 2.2], r:[2.2, 1.8, 1], z:'shade'}]);
    for (const [x, z, h] of [[-9, 4, 6], [-6, 6, 8], [7, 5, 7], [10, 2, 5], [3, 7, 6]]) add([{t:'cap', a:[x, 0, z], p:[x * 1.1, h, z + 1], r:0.5, z:'grass'}]);
    return {parts:P, zones:SKZ(se, null, {cloakB:'#4a4238', shade:'#141210', dirt:'#4a3a24', grass:'#5f7e3e'}), keepZones:['shade']}; }, {seasonPass:false}),   /* no season flowers on a pickup or a blip */
  m_briar:MPK([60, 40, 12], se => { const P = [], add = wAdd(P);   // a cut briar laid as a barrier: thorny canes in a low tangle
    for (const [x0, z0, x1, z1, h] of [[-16, -3, 14, 2, 7], [-13, 3, 16, -3, 9], [-10, -5, 8, 5, 11], [-4, 4, 15, 0, 6], [-15, 0, 4, -5, 8]]){
      add([{t:'cap', a:[x0, 1.4, z0], p:[(x0 + x1) / 2, h, (z0 + z1) / 2], r:1, z:'cane'}, {t:'cap', a:[(x0 + x1) / 2, h, (z0 + z1) / 2], p:[x1, 2, z1], r:1, z:'cane'}]);
      for (let k = 1; k < 4; k++){ const t = k / 4, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = 1.4 + (h - 1.4) * (1 - Math.abs(t * 2 - 1));
        add([{t:'cone', a:[x, y, z], p:[x + 0.6, y + 2.2, z + 0.8], r:0.6, r2:0.05, z:'thorn'}]); }
    }
    for (const [x, z] of [[-8, 2], [5, -2], [11, 3]]) add([{t:'ell', c:[x, 6, z], r:[2.4, 1.6, 2], z:'leaf'}]);
    if (se === 'winter') add([{t:'ell', c:[0, 0.6, 0], r:[17, 0.8, 5], z:'snow'}]);
    return {parts:P, zones:SKZ(se, null, {cane:'#4a3a22', thorn:'#c8b890', leaf:'#3e5a2a'})}; })
});
Object.assign(W3D_KINDS, {   // trophies for the rack (P10, step 4 rest)
  m_skull:MPK([34, 40, 8], se => { const P = [], add = wAdd(P);   // a horned beast skull, as hung on the rack
    add([{t:'ell', c:[0, 12, 0], r:[6, 5.4, 5.4], z:'bone'}, {t:'ell', c:[0, 6.4, 2.4], r:[3.6, 3.4, 3.4], z:'bone'}, {t:'ell', c:[-2.3, 12, 4.6], r:[1.5, 1.6, 0.8], z:'socket'}, {t:'ell', c:[2.3, 12, 4.6], r:[1.5, 1.6, 0.8], z:'socket'},
         {t:'box', c:[0, 4, 4.6], r:[2.2, 0.5, 0.6], z:'socket'}, {t:'cone', a:[-5, 15, 0], p:[-10, 20, -1], r:1.6, r2:0.3, z:'horn'}, {t:'cone', a:[5, 15, 0], p:[10, 20, -1], r:1.6, r2:0.3, z:'horn'}]);
    return {parts:P, zones:SKZ(se, null, {bone:'#d8cdb0', socket:'#2a2520', horn:'#a8946a'})}; }, {seasonPass:false}),
  m_mask:MPK([34, 40, 8], se => { const P = [], add = wAdd(P);   // a goblin war-mask on a stick
    add([{t:'cap', a:[0, 0, 0], p:[0, 10, 0], r:0.9, z:'stick'}, {t:'ell', c:[0, 15, 0.8], r:[6, 5.4, 2.6], z:'mask'}, {t:'ell', c:[-2.4, 16, 3.1], r:[1.2, 0.8, 0.5], z:'eyeG'}, {t:'ell', c:[2.4, 16, 3.1], r:[1.2, 0.8, 0.5], z:'eyeG'},
         {t:'box', c:[0, 12.6, 3], r:[2.4, 0.5, 0.5], z:'socket'}, {t:'cone', a:[-5.4, 16, 0.6], p:[-10, 18.4, 0], r:1.6, r2:0.3, z:'ear'}, {t:'cone', a:[5.4, 16, 0.6], p:[10, 18.4, 0], r:1.6, r2:0.3, z:'ear'}]);
    return {parts:P, zones:SKZ(se, null, {stick:'#6a4a2a', mask:'#7a3e26', eyeG:'#ffe060', socket:'#2a2520', ear:'#8db04a'}), keepZones:['eyeG']}; }, {seasonPass:false})
});
/* ---- drawing ------------------------------------------------------------ */
// a model on the map; o.standIn draws while it bakes
PROPS3D.draw = function(kind, x, gl, o){
  o = o || {};
  if (typeof w3dMapProp === 'function' && w3dMapProp(kind, x, gl, o)){ PROPS3D.n.model++; return true; }
  PROPS3D.n.standIn++; if (o.standIn) o.standIn(); return true;
};
// a soft shaded blob, lit from the upper left: the stand-in for a model that is still baking
PROPS3D.blob = function(x, y, rx, ry, col, alpha){
  ctx.save(); if (alpha !== undefined) ctx.globalAlpha *= alpha;
  const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.4, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, shade(col, 1.35)); g.addColorStop(0.7, col); g.addColorStop(1, shade(col, 0.55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
};
// a model as a small picture (minimap and HUD): the baked frame cropped to what is drawn and scaled smoothly
const P3I = {};
PROPS3D.icon = function(kind, px, fit){   // fit: keep the model's own proportions (the longer side is px), for menu pictures
  const key = kind + '|' + px + (fit ? 'f' : ''); if (P3I[key]) return P3I[key];
  const K = W3D_KINDS[kind]; if (!K) return null;
  let fr = null;
  try { const rec = w3dRecipe(kind, w3dSeason()), St = R3D_STYLES[r3dStyleId() || 'crisp']; fr = r3dFramesAsync(rec, K.clip, K.view, St); } catch (e) { return null; }
  if (!fr || !fr[0]) return null;
  const src = fr[0], W = src.width, H = src.height, d = src.getContext('2d', {willReadFrequently:true}).getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = px / Math.max(w, h), cw = fit ? Math.ceil(w * k) : px, ch = fit ? Math.ceil(h * k) : px, c = newCanvas(cw, ch), g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, x0, y0, w, h, (cw - w * k) / 2, (ch - h * k) / 2, w * k, h * k);
  c.smooth = true;
  return P3I[key] = c;
};
// a vector icon for when the model has not baked yet (a dark disc already sits under map icons)
PROPS3D.iconStandIn = function(col){
  const key = 'si|' + col; if (P3I[key]) return P3I[key];
  const c = newCanvas(32, 32), g = c.getContext('2d'), gr = g.createRadialGradient(12, 11, 0, 16, 16, 12);
  gr.addColorStop(0, shade(col, 1.35)); gr.addColorStop(1, shade(col, 0.6)); g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 10, 0, TAU); g.fill();
  c.smooth = true; return P3I[key] = c;
};
const P3ICON = (kind, col) => PROPS3D.icon(kind, 32) || PROPS3D.iconStandIn(col);
/* ---- the props ---------------------------------------------------------- */
const ORB_COL = {hex:'#9a5fc8', mm:'#87ceeb', ray:'#b8b8c0', fire:'#ff7a3a'};
// a spell: a shaded, glowing sphere and a fading trail
PROPS3D.orb = function(s, kind, big){
  const col = ORB_COL[kind] || ORB_COL.fire, r = big ? 7.5 : 6.5;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 3; i >= 1; i--){ ctx.globalAlpha = 0.16 * (4 - i) / 3; const tx = s.x - (s.vx || 0) * i * 1.4, ty = s.y - (s.vy || 0) * i * 1.4;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, r * (1 - i * 0.18), 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 0.6; const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.6);
  halo.addColorStop(0, col); halo.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.6, 0, TAU); ctx.fill();
  ctx.restore();
  PROPS3D.blob(s.x, s.y, r, r, col);
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s.x - r * 0.35, s.y - r * 0.4, r * 0.28, 0, TAU); ctx.fill(); ctx.restore();
};
// a crossbow bolt in flight: the 3D arrow model, tinted as bolts are; a drawn shaft while it bakes
PROPS3D.bolt = function(s, a, enemy){
  if (window.STUCK && STUCK.flyBolt && STUCK.flyBolt(s, a, enemy)) return;
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a); ctx.lineCap = 'round';
  ctx.strokeStyle = enemy ? '#3a2a1a' : '#6a4a2a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(7, 0); ctx.stroke();
  ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(6, -2.6); ctx.lineTo(6, 2.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = enemy ? '#5a7a9a' : '#d8c8a0'; ctx.fillRect(-11, -2.4, 4, 1.4); ctx.fillRect(-11, 1, 4, 1.4); ctx.restore();
};
PROPS3D.pickup = function(p, bob){
  const coin = p.kind === 'coin', y = p.y + bob;
  shadow(p.x, p.y + 8, coin ? 8 : 6);
  PROPS3D.draw(coin ? 'm_coin' : 'm_gem', p.x, y + 7, {scale:coin ? 1.6 : 1.4, standIn:() => coin ? PROPS3D.blob(p.x, y + 3, 6, 3.4, '#d8a830') : PROPS3D.blob(p.x, y, 4, 6, '#3a8ac0')});
};
PROPS3D.blip = function(b, bob){
  PROPS3D.draw('m_blip', b.x, b.y + 12, {scale:1.35, alpha:0.85 + 0.1 * Math.sin(bob), standIn:() => PROPS3D.blob(b.x, b.y + 2, 8, 10, '#4a4238', 0.85)});
  ctx.save(); ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(12,8,4,.85)'; ctx.fillStyle = '#c8a878';   /* the token still says "unknown", as the map does */
  const qy = b.y - 20 + Math.sin(bob) * 1.5; ctx.strokeText('?', b.x, qy); ctx.fillText('?', b.x, qy); ctx.restore();
};
PROPS3D.work = function(w){   // a briar barrier or a stake line the squad has built
  const st = w.kind !== 'briar';
  if (!st){ PROPS3D.draw('m_briar', w.x, w.y + 8, {scale:1.7, standIn:() => PROPS3D.blob(w.x, w.y + 2, 18, 6, '#4a3a22')}); return; }
  const one = (x, y, s) => { if (!(typeof w3dTrap === 'function' && w3dTrap('stakes', x, y, s))) PROPS3D.blob(x, y, 14 * s, 5 * s, '#7a4e2a'); };
  one(w.x, w.y, 1); one(w.x - 26, w.y + 6, 0.7); one(w.x + 26, w.y + 6, 0.7);
};
PROPS3D.cage = function(x, y, freed){ PROPS3D.draw(freed ? 'm_cage_open' : 'm_cage', x, y + 12, {standIn:() => PROPS3D.blob(x, y - 10, 15, 20, '#5f6870')}); };
// P7 camp smoke: a soft round puff, sized as the old 6 px puff at scale s
PROPS3D.puff = function(x, y, s){
  const r = 3.2 * s, g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, 'rgba(206,200,190,.9)'); g.addColorStop(0.6, 'rgba(170,164,156,.55)'); g.addColorStop(1, 'rgba(150,144,136,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
};
PROPS3D.trapStandIn = function(t){ PROPS3D.blob(t.x, t.y + 2, 14, 5, '#5f6870'); };
PROPS3D.knownStandIn = function(b, what){ PROPS3D.blob(b.x, b.y + (what === 'hide' ? 12 : 2), what === 'hide' ? 18 : 14, 5, what === 'hide' ? '#4e6b2c' : '#4a3a24'); };
PROPS3D.hudCoin = function(x, y){   // the HUD coin beside the coin count (18 px)
  const c = PROPS3D.icon('m_coin', 36);
  if (c){ ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(c, x - 9, y - 9, 18, 18); ctx.restore(); }
  else PROPS3D.blob(x, y, 7, 5, '#d8a830');
};
// minimap and full-map icons
PROPS3D.mapTrap = k => P3ICON('m_trap_' + k, '#9aa0a8');
PROPS3D.mapCache = captive => captive ? P3ICON('m_cage', '#5f6870') : P3ICON('m_chest', '#8a5a2a');
PROPS3D.mapBlip = r => r <= 2 ? P3ICON('m_tracks', '#4a3a24') : r === 5 ? P3ICON('m_pit', '#4a3a24') : null;   // troops: the painted foe card (iconOfEnemy)
// mapIcon draws pixel art unsmoothed; a model icon is drawn smoothly
{ const f = mapIcon; mapIcon = function(g, img, x, y, size, ring){
    if (!img || !img.smooth) return f.apply(this, arguments);
    const s = size / Math.max(img.width, img.height);
    g.fillStyle = 'rgba(20,16,12,.72)'; g.beginPath(); g.arc(x, y, size * 0.62, 0, TAU); g.fill();
    if (ring){ g.strokeStyle = ring; g.lineWidth = 1.5; g.stroke(); }
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(img, x - img.width * s / 2, y - img.height * s / 2, img.width * s, img.height * s); g.restore();
  }; }
/* ---- step 4, the rest (camp) ------------------------------------------ */
// P6 camp hounds (js/camp/kennel.js): the 3D Kennel hound the field dogs use, never houndSprite
if (window.KENNEL36){ const KN = KENNEL36, f = KN.draw;
  KN.draw = function(){
    for (const d of KN.dogs){
      if (d.x < CAMP.cam.x - 40 || d.x > CAMP.cam.x + VW + 40 || d.y < CAMP.cam.y - 40 || d.y > CAMP.cam.y + VH + 40) continue;
      try { r3dPumpTick(); const c = r3qChoose(d, 0, d.t || 0, d.st === 'chase');
        if (r3qDraw(r3qRecipe('hound'), d.x, d.y + 2, 2.4, Object.assign(c, {async:true, shadowW:7}))){ PROPS3D.n.model++; continue; }
      } catch (e) { if (typeof r3dWarnOnce === 'function') r3dWarnOnce('camp hound', e); }
      PROPS3D.n.standIn++; figPlaceholder(d.x, d.y - 5, 2.4, {h:9, w:5, horse:true, shadowW:3.8});
    }
  };
}
// P10 the trophy rack in camp (js/campaign/legwork.js, and the legend shelf under it, js/ui/guided-start.js:84).
// The drawing chain runs as before (same rack, shelf, glows, labels: layout unchanged); only each trophy's picture
// is swapped, from the pixel sprite to a picture of its 3D model, at the same place and size.
// EN f8e0bd8 note: the colour carries meaning (a rival's banner wears that rival's colours; each legend is its own object), so it is kept
const P3ZONED = (base, name, zones) => { if (!W3D_KINDS[name] && W3D_KINDS[base]) { const b0 = W3D_KINDS[base]._b0 || W3D_KINDS[base].build, bd = se => { const o = b0(se), bare = b0('summer');   // the summer build adds no season dressing: a trophy keeps its parts bare
  return Object.assign({}, o, {parts:bare.parts, zones:Object.assign({}, o.zones, zones), keepZones:(o.keepZones || []).concat(Object.keys(zones))}); }; W3D_KINDS[name] = Object.assign({}, W3D_KINDS[base], {seasonPass:false, _sp:true, _b0:bd, build:bd}); } return W3D_KINDS[name] ? name : base; };
const P3BANNER = col => { col = /^#[0-9a-f]{6}$/i.test(col || '') ? col.toLowerCase() : '#8a1a1a'; return P3ZONED('m_banner', 'm_banner_c' + col.slice(1), {flag:col, flagD:shade(col, .62)}); };   // a trophy, so no season flowers at its foot
const LEGEND3D = {gaxx:['m_leg_gaxx', '#4f9a2a'], grimgor:['m_leg_grimgor', '#4a4a54'], zenif:['m_leg_zenif', '#9fc8f0'], marakyr:['m_leg_marakyr', '#a07a48'], artemis:['m_leg_artemis', '#c8ccd2'], keltaras:['m_leg_keltaras', '#2a2438']};
const TROPHY3D = t => t.kind === 'skull' ? 'm_skull' : t.kind === 'banner' ? P3BANNER(t.col) : t.kind === 'legend' && LEGEND3D[t.legend] ? LEGEND3D[t.legend][0] : t.kind === 'relic' || t.kind === 'legend' ? P3ZONED('m_relic', 'm_relic_t', {}) : 'm_mask';
const TROPHYCOL = t => t.kind === 'skull' ? '#d8cdb0' : t.kind === 'banner' ? (t.col || '#8a1a1a') : t.kind === 'legend' && LEGEND3D[t.legend] ? LEGEND3D[t.legend][1] : t.kind === 'legend' ? '#c8a040' : '#7a3e26';
{ const f = drawHoldingProp; drawHoldingProp = function(p){
    if (!p || p.k !== 'trophies') return f.apply(this, arguments);
    const pics = new Map();
    try { for (const t of (META.trophies || [])) if (!t.legend) pics.set(trophySprite(t), {k:TROPHY3D(t), col:TROPHYCOL(t)}); } catch (e) {}
    try { if (typeof LEGENDS !== 'undefined') for (const l of LEGENDS){ const t = {kind:'legend', legend:l.id}; pics.set(legendSprite(l.id), {k:TROPHY3D(t), col:TROPHYCOL(t)}); } } catch (e) {}
    const b = blit;
    blit = function(s, x, y, sc, flip, ox, oy){ const q = s && pics.get(s); if (!q) return b.apply(this, arguments);
      const cx = x - ((ox || 0) - s.width / 2) * sc, cy = y - (oy || 0) * sc + s.height * sc / 2, D = Math.max(s.width, s.height) * sc * 1.05, ic = PROPS3D.icon(q.k, 48);
      if (ic){ ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(ic, cx - D / 2, cy - D / 2, D, D); ctx.restore(); PROPS3D.n.model++; }
      else { PROPS3D.blob(cx, cy, s.width * sc * 0.4, s.height * sc * 0.42, q.col); PROPS3D.n.standIn++; } };
    try { return f.apply(this, arguments); } finally { blit = b; }
  }; }
/* warm the Founding models after load, so the first coin or blip is the model, not the stand-in */
window.addEventListener('load', () => setTimeout(() => { try {
  const St = R3D_STYLES[r3dStyleId() || 'crisp'];
  for (const k of ['m_skull', 'm_mask', 'm_banner', 'm_relic', 'm_coin', 'm_gem', 'm_blip', 'm_briar', 'm_cage', 'm_cage_open', 'm_chest', 'm_trap_stakes', 'm_arrow']){ const K = W3D_KINDS[k]; if (K) r3dFramesAsync(w3dRecipe(k, w3dSeason()), K.clip, K.view, St, true); }
} catch (e) {} }, 1500));
/* ---- camp fallbacks (S6-C 3a step 4 rest, pixel-purge section 4: js/camp/camp.js trees, decor, fire, plots, wagon,
   buildings, Chapter banner, graveyard markers; founding-story.js trees; graphics.js plots). The camp's own 3D hook runs
   first; when it declines (a bake still pending, or a holding the hook does not cover) these draw the matching 3D model,
   and a soft lit shape only while that model bakes. Never the pixel sprite. */
Object.assign(W3D_KINDS, {
  dc_sword:MPK([30, 44, 8], se => { const P = [], add = wAdd(P);   // a sword pushed into the ground: the 'sword' decor had no model
    add([{t:'ell', c:[0, 0.5, 0], r:[5, 0.7, 3.4], z:'dirt'}, {t:'box', c:[0, 9, 0], r:[0.9, 9, 0.3], z:'blade'}, {t:'box', c:[0.3, 9, 0.3], r:[0.3, 8.6, 0.1], z:'edge'},
         {t:'box', c:[0, 18.6, 0], r:[3.6, 0.6, 0.8], z:'guard'}, {t:'cap', a:[0, 19.2, 0], p:[0, 23, 0], r:0.7, z:'grip'}, {t:'ell', c:[0, 23.6, 0], r:[1.1, 1.1, 1.1], z:'guard'}]);
    return {parts:P, zones:SKZ(se, null, {dirt:'#4a3a24', blade:'#9aa0a8', edge:'#d8dde2', guard:'#b8902a', grip:'#5a3a1e'}), keepZones:['blade', 'edge', 'guard']}; }),
  // the six legends, each its own object on the shelf (they had all shown the one relic model)
  m_leg_grimgor:MPK([40, 50, 6], se => { const P = [], add = wAdd(P);   // one link of a blackened chain, still glowing at the edges
    add([{t:'ell', c:[0, 1, 0], r:[8, 1.2, 5], z:'soot'}, {t:'cap', a:[-5, 6, 0], p:[-5, 22, 0], r:2.2, z:'iron'}, {t:'cap', a:[5, 6, 0], p:[5, 22, 0], r:2.2, z:'ironD'},
         {t:'cap', a:[-5, 22, 0], p:[0, 26, 0], r:2.2, z:'iron'}, {t:'cap', a:[0, 26, 0], p:[5, 22, 0], r:2.2, z:'ironD'}, {t:'cap', a:[-5, 6, 0], p:[0, 3, 0], r:2.2, z:'iron'}, {t:'cap', a:[0, 3, 0], p:[5, 6, 0], r:2.2, z:'ironD'},
         {t:'ell', c:[5.6, 14, 1.6], r:[1, 1.6, 1], z:'ember'}, {t:'ell', c:[0, 25.6, 1.6], r:[1.4, 0.9, 1], z:'ember'}, {t:'ell', c:[-5.4, 8, 1.6], r:[0.9, 1.2, 0.9], z:'emberD'}]);
    return {parts:P, zones:SKZ(se, null, {soot:'#2a2420', iron:'#55555f', ironD:'#3a3a42', ember:'#f0a040', emberD:'#c8501c'}), keepZones:['iron', 'ironD', 'ember', 'emberD']}; }, {seasonPass:false}),
  m_leg_marakyr:MPK([40, 50, 6], se => { const P = [], add = wAdd(P);   // a small carved wooden plaque with a figure in relief
    add([{t:'box', c:[0, 13, 0], r:[8, 12, 1.4], z:'wood'}, {t:'box', c:[0, 13, -0.4], r:[8.8, 12.8, 1], z:'woodD'}, {t:'ell', c:[0, 26, 0], r:[5, 2.2, 1.4], z:'wood'},
         {t:'ell', c:[0, 19, 1.6], r:[2, 2, 0.9], z:'carve'}, {t:'box', c:[0, 12, 1.6], r:[3, 5, 0.8], z:'carve'}, {t:'box', c:[0, 5.4, 1.6], r:[4, 1.2, 0.7], z:'carveD'}]);
    return {parts:P, zones:SKZ(se, null, {wood:'#8a5a2b', woodD:'#5a3a1a', carve:'#d8b070', carveD:'#b08848'}), keepZones:['wood', 'woodD', 'carve', 'carveD']}; }, {seasonPass:false}),
  m_leg_artemis:MPK([30, 50, 8], se => { const P = [], add = wAdd(P);   // a bastard sword that has never been swung, point down on a stone
    add([{t:'box', c:[0, 2, 0], r:[6, 2, 4], z:'stone'}, {t:'box', c:[0, 15, 0], r:[1.1, 11, 0.35], z:'blade'}, {t:'box', c:[0.4, 15, 0.35], r:[0.35, 10.6, 0.1], z:'edge'},
         {t:'box', c:[0, 26.6, 0], r:[5.4, 0.8, 1], z:'gold'}, {t:'cap', a:[0, 27.4, 0], p:[0, 33, 0], r:0.9, z:'grip'}, {t:'ell', c:[0, 33.8, 0], r:[1.4, 1.4, 1.4], z:'gold'}, {t:'ell', c:[0, 20, 0.5], r:[0.5, 0.5, 0.2], z:'gem'}]);
    return {parts:P, zones:SKZ(se, null, {stone:'#6a6a70', blade:'#c8ccd2', edge:'#f0f4f8', gold:'#d4af37', grip:'#6a3e1c', gem:'#3a7a4a'}), keepZones:['blade', 'edge', 'gold', 'gem']}; }, {seasonPass:false})
});
P3ZONED('m_crystal', 'm_leg_gaxx', {crys:'#7ac83a', crysD:'#3a7a22', crysL:'#d8ffa0', rock:'#3a3a2e', rockD:'#2a2a20'});      // a shard of green plague-gem
P3ZONED('m_crystal', 'm_leg_zenif', {crys:'#dff0ff', crysD:'#9fc8f0', crysL:'#ffffff', rock:'#6a8ab0', rockD:'#4a6a90'});     // a glass prism
P3ZONED('m_crystal', 'm_leg_keltaras', {crys:'#2a2438', crysD:'#14101e', crysL:'#a98ae0', rock:'#3a3440', rockD:'#24202a'});  // a shard of obsidian with a violet edge
{ const D = (k, x, gl, o, st) => { if (!k || !W3D_KINDS[k]){ if (st) st(); PROPS3D.n.standIn++; return true; } return PROPS3D.draw(k, x, gl, Object.assign({}, o || {}, {standIn:st})); };   // a missing kind: its soft shape, never blank
  const B = (...a) => () => PROPS3D.blob(...a);
  PROPS3D.campTree = (tr, t) => D(typeof w3dTreeKind === 'function' ? w3dTreeKind(tr) : ['t_pine', 'oak', 't_birch'][((tr.v % 3) + 3) % 3], tr.x, tr.y + 5, {t},
    () => { PROPS3D.blob(tr.x, tr.y - 8, 4, 12, '#5a3e24'); PROPS3D.blob(tr.x, tr.y - 44, 24, 32, '#3e5a2e'); });
  PROPS3D.campDecor = d => D((typeof W3D_DECOR !== 'undefined' && W3D_DECOR[d.k]) || 'dc_' + d.k, d.x, d.y + 3, {}, B(d.x, d.y - 4, 10, 7, '#6a5a40'));
  PROPS3D.campFire = (x, y, t) => D('campfire', x, y + 12, {t}, () => { PROPS3D.blob(x, y + 6, 20, 7, '#4a3020'); PROPS3D.blob(x, y - 4, 9, 12, '#e08a30', 0.85); });
  PROPS3D.campPlot = o => D('m_plot', o.x, o.y + 2, {}, B(o.x, o.y - 6, 26, 10, '#6e5834'));
  // the holding's own look, as w3dDrawObj and w3dFacility pick it: barge and warehouse skins, waystation ruins, raid damage, the plot's view
  const HK = () => { try { return typeof holdKey === 'function' ? holdKey() : 'fort'; } catch (e) { return 'fort'; } };
  const OK = k => !!(k && typeof W3D_KINDS !== 'undefined' && W3D_KINDS[k]);
  const TRY = f => { try { return f(); } catch (e) { return null; } };
  PROPS3D.campWagon = o => { const hk = HK(), q = (hk === 'barge' || hk === 'warehouse') && OK('qm_' + hk) ? 'qm_' + hk : 'w_wagon';
    return D(q, o.x, o.y + 6, {}, B(o.x, o.y - 18, 40, 24, '#6a5038')); };
  PROPS3D.campKind = o => { const hk = HK(); let k = null, view;
    if (o.kind === 'house'){ k = hk === 'barge' || hk === 'warehouse' ? 'hh_' + hk : hk === 'waystation' ? TRY(() => ruinKind('house')) : 'house';
      view = TRY(() => curLayout().houseView) ?? undefined; return [OK(k) ? k : 'house', view]; }
    let id = o.id; if (id === 'tents') id = META.facilities.bunks ? 'bunks' : META.facilities.huts ? 'huts' : 'tents';
    const plain = (typeof W3D_FAC !== 'undefined' && W3D_FAC[id]) || (typeof W3D_FAC2 !== 'undefined' && W3D_FAC2[id]) || null;
    if (hk === 'barge' || hk === 'warehouse') k = typeof skinKind2 === 'function' ? TRY(() => skinKind2(hk, id)) : null;
    else { k = plain; if (k && hk === 'waystation' && typeof ruinKind === 'function') k = TRY(() => ruinKind(k)) || k; }
    if (!OK(k)) k = OK(plain) ? plain : 'house';
    if (typeof isDamaged === 'function' && typeof wDmg === 'function' && TRY(() => isDamaged(o.id))) k = TRY(() => wDmg(k)) || k;
    view = typeof plotView === 'function' ? TRY(() => plotView(o.id)) ?? undefined : undefined;
    return [k, view]; };
  PROPS3D.campBuilding = (o, w, h) => { const [k, view] = PROPS3D.campKind(o);
    return D(k, o.x, o.y + 6, view === undefined ? {} : {view}, B(o.x, o.y - h * 0.32, w * 0.44, h * 0.34, '#6a5440')); };
  PROPS3D.campBanner = (x, gl, s) => D('m_banner', x + 26 * s / 3.4, gl, {scale:s / 3.4}, B(x, gl - 40 * s / 3.4, 6 * s / 3.4, 22 * s / 3.4, '#7a2a24'));
  // LE 3a4 (c): a kind that is missing draws its soft shape instead of nothing
  const DS = (k, x, gl, o, st) => D(k, x, gl, o, st) || (st(), true);
  PROPS3D.graveFence = (g, x0, y0) => { const W = g.w, Hh = g.h, D = DS;
    D('w_gfenceH', g.x, y0 + 4, {}, B(g.x, y0 - 2, W / 2, 5, '#6a4a28')); D('w_gfenceV', x0, g.y + 4, {}, B(x0, g.y - 2, 4, Hh / 2, '#6a4a28'));
    D('w_gfenceV', x0 + W, g.y + 4, {}, B(x0 + W, g.y - 2, 4, Hh / 2, '#6a4a28')); D('w_gfenceH', g.x, y0 + Hh + 4, {}, B(g.x, y0 + Hh - 2, W / 2, 5, '#6a4a28'));
    D('oak', x0 + W + 26, y0 + 25, {t:CAMP.t}, () => { PROPS3D.blob(x0 + W + 26, y0 + 12, 4, 12, '#5a3e24'); PROPS3D.blob(x0 + W + 26, y0 - 24, 24, 32, '#3e5a2e'); });
    return true; };
  // LE 3a4 (b): a Founding column wagon keeps the sprite's facing and size (the same view and scale w3dWagon uses)
  PROPS3D.wagonAt = (x, y, left, s) => DS('w_wagon', x, y + 2 * s, {view:left ? 1.7 : 2.3, scale:s / 3}, B(x, y - 7 * s, 14 * s, 8 * s, '#6a5038'));
  // LE 3a4 (d): the stable paddock (w3dPaddock covers the fort's bake only)
  PROPS3D.paddock = (px, py) => DS('paddock', px, py + 8, {}, () => { PROPS3D.blob(px, py - 16, 54, 6, '#6a4a28'); PROPS3D.blob(px, py - 2, 54, 5, '#5a3e22'); });
  // the Founding fire and its flames (founding-story.js)
  PROPS3D.flame = (x, y) => { PROPS3D.blob(x, y - 3, 4.5, 7, '#f0a040', 0.85); PROPS3D.n.standIn++; return true; };
  // step 5: a world prop whose 3D hook declined (bake pending) draws a soft shape where the w x h sprite (anchor ax, ay, scale sc) stood
  PROPS3D.box = (x, y, sc, w, h, ax, ay, col, a) => { PROPS3D.blob(x - (ax - w / 2) * sc, y - ay * sc + h * sc / 2, w * sc * 0.4, h * sc * 0.42, col, a); PROPS3D.n.standIn++; return true; };
  PROPS3D.mapIcon = (k, col) => PROPS3D.icon(k, 32) || PROPS3D.iconStandIn(col);   // P3ICON for other files
  PROPS3D.grave = (leader, x, gl) => D(leader ? 'w_stone' : 'w_cross', x, gl, {}, B(x, gl - 14, leader ? 8 : 6, 14, leader ? '#8a8a84' : '#7a5a34'));
}
/* ---- menu and panel pictures (pixel-purge I8 buildings, I9 trophies, I10 the quartermaster's wagon, and the graveyard
   panel's cross). Every one is built through toURL under a known key; those keys now give a picture of the matching 3D
   model (the same model the camp draws), and a soft lit shape while the model bakes, swapped in place once it is ready.
   Same <img>, same size and place: layout unchanged. */
{ const URL3 = {}, WAIT = new Map(), ASP = new Map(), PX = 192;
  const facKind3 = id => { if (id === 'tents' && typeof META !== 'undefined' && META.facilities) id = META.facilities.bunks ? 'bunks' : META.facilities.huts ? 'huts' : 'tents';
    const plain = (typeof W3D_FAC !== 'undefined' && W3D_FAC[id]) || (typeof W3D_FAC2 !== 'undefined' && W3D_FAC2[id]) || 'house';
    // barge and warehouse pictures wear the holding's skin, as on the map; the Waystation keeps the fort's pictures (its key is the fort's, as its pixel art was)
    let hk = 'fort'; try { hk = holdKey(); } catch (e) {}
    if ((hk === 'barge' || hk === 'warehouse') && typeof skinKind2 === 'function'){ let k = null; try { k = skinKind2(hk, id); } catch (e) {} if (k && W3D_KINDS[k]) return k; }
    return plain; };
  const facOf = rest => { let best = null; try { for (const f of FACILITIES) if (rest.startsWith(f.id) && (!best || f.id.length > best.length)) best = f.id; } catch (e) {} return best; };
  PROPS3D.picOf = function(key){   // a toURL key -> [model kind, stand-in colour], or null when the key is not a picture this covers
    if (typeof key !== 'string') return null; let m;
    if (key.startsWith('bld2:') || key.startsWith('bld:')){
      let rest = key.slice(key.indexOf(':') + 1); try { const h = holding(); if (key.startsWith('bld2:') && h && rest.startsWith(h)) rest = rest.slice(h.length); } catch (e) {}
      const id = facOf(rest); if (!id) return null; const k = facKind3(id); return [P3ZONED(k, k + '_pic', {}), '#6a5440']; }   // no season flowers in a menu picture
    if ((m = /^trophy:(skull|banner|relic|legend|mask)?([a-z]*)(#[0-9a-f]{6})?/i.exec(key))){ const t = {kind:m[1] || 'mask', legend:m[2] || undefined, col:m[3]}; return [TROPHY3D(t), TROPHYCOL(t)]; }
    if (key.startsWith('wagonpanel')) return [P3ZONED('w_wagon', 'w_wagon_pic', {}), '#6a5038'];   // a menu picture: the summer build's parts, so no season flowers at its foot
    if (key === 'gravepanel' || key === 'gravecross') return [P3ZONED('w_cross', 'w_cross_pic', {}), '#7a5a34'];   // PL-1 item 5: the small cross on each graveyard line is the same 3D cross, baked once (picURL caches it)
    if (key.startsWith('housepanel')){ const k = PROPS3D.campKind({kind:'house', id:'house'})[0]; return [P3ZONED(k, k + '_pic', {}), '#6a5440']; }   // PL-1 item 4: the holding's own 3D house, as on the map
    return null;
  };
  // the picture keeps the pixel sprite's own width-to-height (asp), so a column sized by height keeps its width (Producer, EN f8e0bd8 note 2)
  const box = asp => asp > 0 ? (asp >= 1 ? [PX, Math.max(8, Math.round(PX / asp))] : [Math.max(8, Math.round(PX * asp)), PX]) : null;
  const standIn = (kind, col, asp) => { const [W, H] = box(asp) || [96, 96], c = newCanvas(W, H), g = c.getContext('2d'), r = Math.min(W, H) * .4, gr = g.createRadialGradient(W / 2 - r * .2, H / 2 - r * .3, 2, W / 2, H / 2, r * 1.1);
    gr.addColorStop(0, shade(col, 1.3)); gr.addColorStop(1, shade(col, 0.55)); g.fillStyle = gr; g.beginPath(); g.ellipse(W / 2, H / 2 + r * .05, r * .9, r, 0, 0, TAU); g.fill();
    return c.toDataURL('image/png') + '#p3s:' + kind + ':' + (asp || 0).toFixed(3); };
  const ready = (kind, asp) => { const k = kind + '|' + (asp || 0).toFixed(3); if (URL3[k]) return URL3[k]; const ic = PROPS3D.icon(kind, PX, true); if (!ic) return null;
    const b = box(asp); let c = ic; if (b){ c = newCanvas(b[0], b[1]); const g = c.getContext('2d'), z = Math.min(b[0] / ic.width, b[1] / ic.height);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(ic, (b[0] - ic.width * z) / 2, (b[1] - ic.height * z) / 2, ic.width * z, ic.height * z); }
    return URL3[k] = c.toDataURL('image/png') + '#p3'; };
  let tick = 0;
  const watch = () => { if (tick) return; tick = setInterval(() => {
    for (const [wk, w] of WAIT){ const u = ready(w.kind, w.asp);
      if (u){ WAIT.delete(wk); for (const im of document.querySelectorAll('img')) if (im.src === w.si) im.src = u; }
      else if (++w.n > 150) WAIT.delete(wk); }   // about a minute: a model that never bakes keeps its soft shape
    if (!WAIT.size){ clearInterval(tick); tick = 0; } }, 400); };
  PROPS3D.picURL = function(kind, col, asp){
    const u = ready(kind, asp); if (u){ PROPS3D.n.model++; return u; }
    const wk = kind + '|' + (asp || 0).toFixed(3); let w = WAIT.get(wk); if (!w) WAIT.set(wk, w = {si:standIn(kind, col, asp), n:0, kind, asp});
    PROPS3D.n.standIn++; watch(); return w.si;
  };
  // I11: the tactic-card badge as a smooth painted disc; the 7x7 glyph is blurred and re-cut so it reads as drawn shapes, not cells
  const BADGE = {};
  PROPS3D.badgeURL = function(name, ring){
    const key = name + ring; if (BADGE[key]) return BADGE[key];
    const rows = (typeof GLYPHS !== 'undefined') && GLYPHS[name], S = 104, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const rim = /^#[0-9a-f]{6}$/i.test(ring) ? ring : '#7a3e26';   // shade() reads 6 digits only (EN 3738ba8 notes 1-2)
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 5; g.shadowOffsetY = 2;
    const rg = g.createLinearGradient(0, 4, 0, S - 4); rg.addColorStop(0, shade(rim, 1.45)); rg.addColorStop(.5, rim); rg.addColorStop(1, shade(rim, .5));
    g.fillStyle = rg; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 5, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = 'rgba(12,8,5,.85)'; g.lineWidth = 2; g.stroke();
    const ig = g.createRadialGradient(S / 2 - 8, S / 2 - 10, 4, S / 2, S / 2, S / 2 - 13); ig.addColorStop(0, '#3e352c'); ig.addColorStop(1, '#17120e');
    g.fillStyle = ig; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 13, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.5; g.stroke();
    if (rows){
      const C = 8, M = 14, N = 7 * C + 2 * M, m = document.createElement('canvas'); m.width = m.height = N; const mg = m.getContext('2d'); mg.fillStyle = '#000';
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') mg.fillRect(M + i * C, M + j * C, C, C); });
      const t = document.createElement('canvas'); t.width = t.height = N; const tg = t.getContext('2d'); tg.filter = 'blur(3.2px)'; tg.drawImage(m, 0, 0); tg.filter = 'none';
      const d = tg.getImageData(0, 0, N, N), a = d.data; for (let i = 3; i < a.length; i += 4) a[i] = Math.max(0, Math.min(255, (a[i] - 92) * 6));
      tg.putImageData(d, 0, 0);
      const col = ((typeof GLYPH_COLOURS !== 'undefined') && GLYPH_COLOURS[name]) || '#e8dcc0';
      tg.globalCompositeOperation = 'source-in'; const fg = tg.createLinearGradient(0, M, 0, N - M); fg.addColorStop(0, shade(col, 1.35)); fg.addColorStop(1, shade(col, .7)); tg.fillStyle = fg; tg.fillRect(0, 0, N, N);
      const k = 56 / (7 * C), o = (S - N * k) / 2;
      g.save(); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5; g.drawImage(t, o, o, N * k, N * k); g.restore();
    }
    PROPS3D.n.model++; return (BADGE[key] = c.toDataURL() + '#p3');
  };
  const prev = toURL;
  window.__p3_toURL = function(key, make, scale){
    if (typeof key === 'string' && key.startsWith('badge:')){ const r = key.slice(6), h = r.indexOf('#'); try { return PROPS3D.badgeURL(h < 0 ? r : r.slice(0, h), h < 0 ? '' : r.slice(h)); } catch (e) {} }
    { const p = PROPS3D.picOf(key); if (p && W3D_KINDS[p[0]]){ let asp = ASP.get(key);
      if (!asp){ try { const c = typeof make === 'function' && make(); asp = c && c.width > 0 && c.height > 0 ? c.width / c.height : 0; } catch (e) { asp = 0; } if (asp) ASP.set(key, asp); }   // the sprite is built for its size only, never shown; a key with no sprite to measure is not cached
      return PROPS3D.picURL(p[0], p[1], asp); } }
    return prev.apply(this, arguments);
  };
  (0, eval)('toURL = window.__p3_toURL');
  const st = document.createElement('style'); st.textContent = 'img[src$="#p3"],img[src*="#p3s:"]{image-rendering:auto!important}'; document.head.appendChild(st);
}
// P13: the hub's running dust and footprints as soft puffs (P24 blitted the pixel smoke puff)
if (window.P24 && typeof P24.drawRunPuffs === 'function'){ const f = P24.drawRunPuffs;
  P24.drawRunPuffs = function(){
    const puffs = typeof CAMP !== 'undefined' && CAMP.puffs; if (!puffs || !puffs.length) return; const K = P24.K;
    for (const p of puffs){ if (!p.run) continue;
      const foot = !!p.foot, a = foot ? Math.min(1, p.life / 6) * K.footAlpha : Math.min(1, p.life / 12) * K.puffAlpha,
        sc = foot ? K.footSize + (K.footLife - p.life) / 22 : 1.3 + (K.puffLife - p.life) / 11, r = 2.6 * sc;
      if (!isFinite(p.x + p.y + r + a) || r <= 0) continue;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, 'rgba(196,172,132,.85)'); g.addColorStop(1, 'rgba(160,138,104,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * (foot ? .55 : .8), 0, 0, TAU); ctx.fill(); ctx.restore(); PROPS3D.n.puff = (PROPS3D.n.puff || 0) + 1; }   // its own counter, one per puff per frame (EN 3738ba8 note 4)
  };
}
// P15/P16: a soft seated or standing figure for the bard while his 3D frames bake (never the pixel bard)
PROPS3D.figure = function(g, cx, feet, h, seated){
  const k = h / 27, body = '#5a4636', head = '#c8a080';
  g.save(); g.globalAlpha *= .9;
  const sh = g.createRadialGradient(cx, feet, 0, cx, feet, 9 * k); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.ellipse(cx, feet, 9 * k, 2.4 * k, 0, 0, TAU); g.fill();
  const top = feet - h, bg = g.createLinearGradient(0, top + 7 * k, 0, feet); bg.addColorStop(0, shade(body, 1.3)); bg.addColorStop(1, shade(body, .6)); g.fillStyle = bg;
  g.beginPath(); if (seated){ g.ellipse(cx, feet - 8 * k, 6.5 * k, 8.5 * k, 0, 0, TAU); g.ellipse(cx + 4 * k, feet - 2.5 * k, 6 * k, 2.5 * k, 0, 0, TAU); }
  else { g.ellipse(cx, feet - 11 * k, 5.5 * k, 11 * k, 0, 0, TAU); } g.fill();
  g.fillStyle = '#8a5a2c'; g.beginPath(); g.ellipse(cx + 1 * k, feet - (seated ? 9 : 13) * k, 4 * k, 3 * k, -.5, 0, TAU); g.fill();
  const hg = g.createRadialGradient(cx - 1 * k, top + 4 * k, 0, cx, top + 5 * k, 4.5 * k); hg.addColorStop(0, shade(head, 1.2)); hg.addColorStop(1, shade(head, .7));
  g.fillStyle = hg; g.beginPath(); g.arc(cx, top + 5 * k, 4.3 * k, 0, TAU); g.fill(); g.restore(); PROPS3D.n.figure = (PROPS3D.n.figure || 0) + 1; return true;   // its own counter: it draws every frame while the bake waits (EN 87d4f1f note 2)
};
PROPS3D.selfTest = function(){
  const rows = [], ok = (n, v) => rows.push((v ? 'ok   ' : 'FAIL ') + n);
  for (const k of ['m_skull', 'm_mask', 'm_banner', 'm_relic', 'm_coin', 'm_gem', 'm_blip', 'm_briar']) ok(k + ' builds', (() => { try { return !!w3dRecipe(k, 'summer'); } catch (e) { return false; } })());
  ok('camp hounds drawn in 3D', !window.KENNEL36 || !/houndSprite/.test(String(KENNEL36.draw)));
  ok('every Founding prop drawer exists', ['pickup', 'blip', 'work', 'cage', 'orb', 'bolt', 'hudCoin', 'mapTrap', 'mapCache', 'mapBlip'].every(n => typeof PROPS3D[n] === 'function'));
  ok('menu pictures route to 3D models (buildings, trophies, wagon, grave)', (() => { try { const h = holding();
    return /^(f|sk2_[a-z]+)_blacksmith/.test(PROPS3D.picOf('bld2:' + h + 'blacksmith')[0]) && /^(f_gatehouse|sk2_[a-z]+_palisade)/.test(PROPS3D.picOf('bld2:' + h + 'palisadeplain#7a3e26')[0]) && /^m_banner/.test(PROPS3D.picOf('trophy:banner#8a1a1a')[0])
      && /^w_wagon/.test(PROPS3D.picOf('wagonpanel' + h)[0]) && /^w_cross/.test(PROPS3D.picOf('gravepanel')[0]) && PROPS3D.picOf('badge:sword#7a3e26') === null && /#p3s?/.test(toURL('trophy:skull', () => null)); } catch (e) { return false; } })());
  ok('step 5: the pixel prop builders are gone (no rollback to fall to)', ['treeSprite', 'decorSprite', 'campfireSprite', 'plotSprite', 'smokePuff', 'cageSprite', 'fireSprite', 'trapSprite', 'aleSprite', 'chestSprite', 'blipSprite', 'coinSprite', 'gemSprite', 'briarSprite', 'stakeSprite', 'orbSprite', 'arrowSprite', 'vaultSprite', 'beaconSprite', 'crystalSprite',
    'drawHumanoid', 'drawWeapon', 'drawWolf', 'drawCinder', 'drawWyrm', 'drawBear', 'drawSpider', 'drawHorse', 'makeSeasonTree', 'DECOR']
    .every(n => { try { (0, eval)(n); return false; } catch (e) { return e instanceof ReferenceError; } }) && !('on' in PROPS3D));
  ok('step 5: a missing kind draws its soft shape, never blank', (() => { const b = PROPS3D.blob, n0 = PROPS3D.n.standIn; let drawn = 0;
    try { PROPS3D.blob = function(){ drawn++; }; return PROPS3D.campDecor({k:'no_such_kind_xx', x:0, y:0}) === true && drawn === 1 && PROPS3D.n.standIn === n0 + 1
      && PROPS3D.box(0, 0, 2, 10, 10, 5, 5, '#888') === true && drawn === 2; } catch (e) { return false; } finally { PROPS3D.blob = b; } })());
  ok('step 5: building a fresh person, foe and beast sprite creates no canvas', (() => {
    const orig = document.createElement, keep = {};
    const keys = ['e:brigand' + bannerSig(), 'b:wolf', 'b:cinder', 'b:alpha', 'b:wyrm', 'b:spider', 'b:bear', 'b:wolfrider', 'b:slaver', 'b:ram', 'horse:riding'];
    for (const k of keys) if (k in SPR){ keep[k] = SPR[k]; delete SPR[k]; }
    const p = {name:'ST5b', race:'HUMAN', spec:'SOLDIER', cls:'FREEMAN', sex:'m', id:'_st5b_' + Math.random()}, pk = 'p:' + personKey(p, false);
    let cv = 0;
    document.createElement = function(t){ if (String(t).toLowerCase() === 'canvas') cv++; return orig.apply(this, arguments); };
    try {
      const sp = [personSprite(p, false), enemySprite('brigand'), enemySprite('wyrm'), enemySprite('wolf'), enemySprite('alpha'), enemySprite('spider'), enemySprite('bear'), enemySprite('wolfrider'), enemySprite('slaver'), enemySprite('ram'), horseSprite('riding')];
      return cv === 0 && sp.every(s => s && Array.isArray(s.frames) && !s.frames.length && s.w > 0 && s.h > 0);
    } catch (e) { return false; } finally {
      document.createElement = orig; delete SPR[pk];
      for (const k of keys){ delete SPR[k]; if (k in keep) SPR[k] = keep[k]; }
    }
  })());
  ok('tactic badges painted, not pixel (I11)', (() => { try { return /#p3$/.test(badgeURL('sword', '#7a3e26')); } catch (e) { return false; } })());
  ok('hub footprints soft, not the pixel puff (P13)', !window.P24 || (() => { const C = (0, eval)('CAMP'), keep = C.puffs, b = blit; let px = 0;   // EN 3738ba8 note 3: counts real draws
    try { C.puffs = [{x:40, y:40, vx:0, vy:0, life:8, run:true}, {x:50, y:40, vx:0, vy:0, life:8, run:true, foot:true}]; blit = function(){ px++; };   // the pixel puff went through blit
      const n0 = PROPS3D.n.puff || 0; P24.drawRunPuffs(); return px === 0 && (PROPS3D.n.puff || 0) - n0 === 2; } catch (e) { return false; } finally { C.puffs = keep; blit = b; } })());
  ok('menu wagon, cross and buildings carry no season flowers (parts of the summer build)', (() => { try { return ['wagonpanel' + holding(), 'gravepanel', 'bld2:' + holding() + 'blacksmith'].every(k => { const n = PROPS3D.picOf(k)[0], b = n.replace('_pic', '');
    return W3D_KINDS[n].build('spring').parts.length === (W3D_KINDS[b]._b0 || W3D_KINDS[b].build)('summer').parts.length; }); } catch (e) { return false; } })());
  ok('trophy colours kept: rival banners wear their colour, each legend its own model', (() => { try { const ks = LEGENDS.map(l => PROPS3D.picOf('trophy:legend' + l.id)[0]);
    return PROPS3D.picOf('trophy:banner#2a5a8a')[0] !== PROPS3D.picOf('trophy:banner#8a1a1a')[0] && new Set(ks).size === LEGENDS.length && ks.every(k => !!w3dRecipe(k, 'summer')); } catch (e) { return false; } })());
  ok('build-menu pictures wear the barge and warehouse skins', (() => { const M = META, hk = M.holding; try {
    return ['barge', 'warehouse'].every(h => { M.holding = h; return new RegExp('^sk2_' + h + '_blacksmith_pic$').test(PROPS3D.picOf('bld2:' + h + 'blacksmith')[0]); })
      && (M.holding = 'fort', /^f_blacksmith_pic$/.test(PROPS3D.picOf('bld2:fortblacksmith')[0])); } catch (e) { return false; } finally { M.holding = hk; } })());
  ok('bard waits on a soft figure, not the pixel bard (P15/P16)', typeof PROPS3D.figure === 'function');
  ok('camp fallback buildings take the look of the holding (skins, ruins, damage)', (() => { const M = META, hk = M.holding, dm = M.damaged; try { M.damaged = {blacksmith:1};
    const want = {fort:[/^f_blacksmith_dmg$/, /^house$/], barge:[/^sk2_barge_blacksmith_dmg$/, /^hh_barge$/], warehouse:[/^sk2_warehouse_blacksmith_dmg$/, /^hh_warehouse$/], waystation:[/^ws_f_blacksmith_dmg$/, /^ws_house$/]};
    return Object.keys(want).every(h => { M.holding = h; return want[h][0].test(PROPS3D.campKind({kind:'building', id:'blacksmith'})[0]) && want[h][1].test(PROPS3D.campKind({kind:'house', id:'house'})[0]); });
  } catch (e) { return false; } finally { M.holding = hk; M.damaged = dm; } })());
  ok('PL-1 item 5: each graveyard line\'s cross is the panel\'s 3D cross', (() => { try { const a = PROPS3D.picOf('gravecross'), b = PROPS3D.picOf('gravepanel'); return !!a && a[0] === b[0] && /^w_cross/.test(a[0]); } catch (e) { return false; } })());
  ok('PL-1 item 4: the House panel is each holding\'s own 3D house, not pixel art', (() => { const M = META, hk = M.holding; try {
    const want = {fort:/^house_pic$/, barge:/^hh_barge_pic$/, warehouse:/^hh_warehouse_pic$/, waystation:/^ws_house_pic$/};
    return Object.keys(want).every(h => { M.holding = h; const p = PROPS3D.picOf('housepanel' + h); return p && want[h].test(p[0]) && !!W3D_KINDS[p[0]]; });
  } catch (e) { return false; } finally { M.holding = hk; } })());
  const fail = rows.filter(r => r.startsWith('FAIL')).length;
  console.log('PROPS3D selfTest: ' + (rows.length - fail) + ' pass, ' + fail + ' fail\n' + rows.join('\n'));
  return {pass:rows.length - fail, fail, rows};
};
