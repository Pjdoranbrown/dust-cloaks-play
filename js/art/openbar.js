/* ===== INDEX OB35ART: F-35 open-air bar, finished props (Art & Interface Lead, 2026-11-14) =====
   The Lead Programmer's js/camp/openbar.js owns layout, seats, games and pathing, and draws placeholder props through
   OPENBAR35.draw.table(t) and OPENBAR35.draw.counter(x, y). This file only replaces those two painters (same signatures,
   same footprints: table 76 x 26 at t.x,t.y with seats at +-17,+-15; counter 124 wide at the plot, stools at -34,0,34 below).
   Barge: deck-board plank and a rope-bound cask; warehouse: crate-lid plank and stencilled crates. Dice, Rank'n board and
   plain tables differ on top. A lantern on the counter post throws a warm pool that flickers with the fire.
   INT-1 group 13: no switch. Load after openbar35.js. */
(function(){
  'use strict';
  const OB = window.OPENBAR35; if (!OB || !OB.draw) return;
  const A = window.OPENBAR35ART = {orig: {table: OB.draw.table, counter: OB.draw.counter}};
  const TAU = Math.PI * 2;
  const deck = () => { try { return META.holding === 'barge'; } catch (e) { return false; } };
  const P = {w: '#6e5840', wl: '#8a7050', wd: '#4a3826', wk: '#2e2216', iron: '#2a2a2e', ironL: '#5a5e66', rope: '#b8a070', mug: '#c8b07a', mugd: '#8a7040', foam: '#f0e6c8',
    cloth: '#8a3a2a', clothL: '#a84a36', bread: '#b08848', breadL: '#d0a860', ember: '#ffd078', crate: '#5a4630', crateL: '#7a6244', stencil: '#d8c8a0'};
  const fx = () => ctx;
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const E = (c, x, y, rx, ry, col, rot) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); };
  const poly = (c, pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  const shade = (c, x, y, rx, ry) => E(c, x, y, rx, ry, 'rgba(0,0,0,.26)');
  const grain = (c, x, y, w, h, n, col) => { for (let i = 1; i < n; i++) R(c, x, y + h * i / n, w, 1, col || 'rgba(30,20,10,.45)'); };
  const mug = (c, x, y, up) => { c.save(); c.translate(x, y); if (up) c.rotate(-0.5); R(c, -3, -8, 6, 8, P.mug); R(c, -3, -8, 2, 8, 'rgba(255,255,255,.18)'); R(c, 1, -8, 2, 8, 'rgba(0,0,0,.2)'); R(c, -3, -9, 6, 2, P.foam); R(c, 3, -6, 2.5, 4, P.mugd); R(c, 4.5, -5, 1, 2, P.mug); c.restore(); };
  const cask = (c, x, y) => {
    shade(c, x, y + 2, 16, 5); const top = y - 15;   /* waist height for a 40 px mate */
    poly(c, [[x - 12, y], [x - 14, y - 8], [x - 12, top], [x + 12, top], [x + 14, y - 8], [x + 12, y]], P.w);
    R(c, x - 14, top, 7, 15, P.wl); R(c, x + 8, top, 6, 15, P.wd);
    for (const dy of [-12, -4]) R(c, x - 14, y + dy, 28, 3, P.iron), R(c, x - 14, y + dy, 28, 1, P.ironL);
    for (const dx of [-3, 3]) R(c, x + dx, top + 2, 1, 11, 'rgba(30,20,10,.35)');
    E(c, x, top, 12, 3.2, P.wl); E(c, x, top, 8, 1.8, P.wd);
    if (deck()) { c.strokeStyle = P.rope; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 13, y - 9); c.quadraticCurveTo(x, y - 5, x + 13, y - 9); c.stroke(); }
  };
  const crate = (c, x, y, s, lbl) => {
    shade(c, x, y + 1, s * 0.62, 4);
    R(c, x - s / 2, y - s, s, s, P.crate); R(c, x - s / 2, y - s, s, 3, P.crateL); R(c, x - s / 2, y - s, 3, s, P.crateL); R(c, x + s / 2 - 3, y - s, 3, s, 'rgba(0,0,0,.25)');
    for (const dy of [0.33, 0.66]) R(c, x - s / 2, y - s * dy - 1, s, 2, 'rgba(0,0,0,.28)');
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s / 2 + 2, y - s + 2); c.lineTo(x + s / 2 - 2, y - 2); c.stroke();
    if (lbl) R(c, x - 4, y - s * 0.6, 8, 3, P.stencil);
  };
  const stool = (c, x, y) => { shade(c, x, y + 1, 8, 2.5); R(c, x - 6, y - 5, 2, 6, P.wd); R(c, x + 4, y - 5, 2, 6, P.wd); R(c, x - 7, y - 8, 14, 4, P.w); R(c, x - 7, y - 8, 14, 1.4, P.wl); R(c, x - 7, y - 5, 14, 1.2, P.wd); };
  const light = (c, x, y, r, a) => { const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,200,110,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const flick = () => { const t = window.CAMP ? CAMP.t || 0 : 0; return 0.85 + 0.15 * Math.sin(t / 5) * Math.sin(t / 13); };

  A.table = function(t){
    const c = fx(), x = t.x, y = t.y, tick = window.CAMP ? CAMP.t || 0 : 0, hov = window.CAMP && CAMP.hover && CAMP.hover.kind === 'obtable' && CAMP.hover.id === t.i;
    shade(c, x, y + 3, 44, 9);
    // four bench stools at the seat positions (far two sit behind the top; near two in front)
    for (const sx of [-1, 1]) stool(c, x + sx * 17, y - 13);
    // trestles: an A-frame at each end with a cross brace
    for (const sx of [-1, 1]){ const bx = x + sx * 27; poly(c, [[bx - 6, y + 2], [bx - 3, y - 19], [bx + 3, y - 19], [bx + 6, y + 2], [bx + 4, y + 2], [bx, y - 14], [bx - 4, y + 2]], P.wd); R(c, bx - 4, y - 8, 8, 2, P.wd); }
    // the top: three planks (deck boards on the barge: caulked seams; crate lids in the warehouse: nailed battens)
    const tw = 76, th = 9, tx = x - tw / 2, ty = y - 27;
    R(c, tx, ty, tw, th, hov ? '#8a7258' : P.w); R(c, tx, ty, tw, 2, P.wl); R(c, tx, ty + th - 2, tw, 2, P.wd);
    if (deck()) { grain(c, tx, ty, tw, th, 3, 'rgba(10,8,6,.55)'); for (const gx of [-26, 4, 30]) R(c, x + gx, ty + 2, 1, th - 3, 'rgba(10,8,6,.3)'); }
    else { R(c, tx + 12, ty, 3, th, P.wd); R(c, tx + tw - 15, ty, 3, th, P.wd); for (const nx of [13.5, tw - 13.5]) for (const ny of [2, 6]) R(c, tx + nx - 0.5, ty + ny, 1.4, 1.4, P.ironL); R(c, tx + 24, ty + 2, 10, 3, P.stencil), R(c, tx + 25, ty + 3, 8, 1, P.wd); }
    // what is on it
    if (t.kind === 'crepitus'){
      E(c, x, ty + 4, 22, 3.6, P.cloth); E(c, x, ty + 3.4, 22, 3, P.clothL); E(c, x, ty + 4, 22, 3.6, 'rgba(0,0,0,.18)');   // a baize pad to throw on
      R(c, x - 9, ty - 4, 6, 6, '#ece4cf'); R(c, x - 9, ty - 4, 6, 1.5, '#fff'); R(c, x + 3, ty - 3, 6, 6, '#e0d8c2'); R(c, x + 3, ty - 3, 6, 1.5, '#fff');
      for (const [px, py] of [[-7, -2], [-5, -2.5], [5, -1], [7, 1]]) R(c, x + px - 0.5, ty + py - 0.5, 1.4, 1.4, '#2a1a0a');
      R(c, x - 16, ty + 1, 3, 3, '#ece4cf'); R(c, x + 14, ty + 3, 2.4, 2.4, '#c9a24a'); R(c, x + 17, ty + 2, 2.4, 2.4, '#c9a24a');   // a stray die, two coins
    } else if (t.kind === 'rankn'){
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R(c, x - 13 + i * 6.5, ty + 1 + j * 3.6, 6.5, 3.6, (i + j) % 2 ? '#2a1a0a' : '#d8c8a0');
      R(c, x - 14, ty, 28, 1, P.wd); R(c, x - 14, ty + 8, 28, 1, P.wd);
      for (const [px, col] of [[-12, '#9a2e22'], [-2, '#2e4a7a'], [8, '#d8c8a0']]) { R(c, x + px, ty - 3, 3, 4, col); R(c, x + px, ty - 3, 3, 1, 'rgba(255,255,255,.3)'); }   // rank pieces
      R(c, x + 17, ty + 2, 6, 4, '#d8c8a0'); R(c, x + 18, ty + 3, 4, 1, P.wd);   // a spare card
    } else {
      R(c, x - 21, ty + 1, 14, 6, 'rgba(0,0,0,.18)'); E(c, x + 14, ty + 2.5, 8, 3.2, P.bread); E(c, x + 14, ty + 1.8, 7, 2.2, P.breadL); R(c, x + 10, ty + 1, 1, 2, 'rgba(60,30,10,.5)'); R(c, x + 14, ty, 1, 2, 'rgba(60,30,10,.5)');
      E(c, x - 4, ty + 4, 6, 2, '#6a5a46'); R(c, x - 8, ty + 1, 3, 3, '#d8b868'); // a cheese wedge on a board
    }
    for (const sx of [-1, 1]) stool(c, x + sx * 17, y + 17);   // near stools in front of the trestles
    mug(c, x - 25, ty + 5, false); mug(c, x + 27, ty + 5, false);
    const L = OB.cache;
    if (L) for (const s of L.seats) if (s.table === t.i && s.back && s.taken && s.taken.obSat){
      const q = s.taken, up = (tick + (q.seed || 0) * 37) % OB.K.mugEvery < OB.K.mugUp; mug(c, s.x + (s.x > x ? -8 : 8), s.y - (up ? 30 : 22), up); }
    if (hov && typeof campLabel === 'function'){ const n = OB.tableName(t); campLabel(x, y - 60, n[0], n[1]); }
  };

  A.counter = function(x, y){
    const c = fx();
    shade(c, x, y + 4, 72, 12);
    cask(c, x - 44, y); cask(c, x + 44, y);
    // supplies: the warehouse stacks stencilled crates; the barge ties a coil and a net bag
    if (deck()) { E(c, x - 66, y - 2, 9, 3, P.rope); E(c, x - 66, y - 4, 9, 3, '#d0b888'); E(c, x - 66, y - 4, 4, 1.4, P.wd); R(c, x + 62, y - 14, 10, 14, '#6a5a46'); R(c, x + 62, y - 14, 10, 2, P.rope); }
    else { crate(c, x - 70, y, 16, true); crate(c, x - 70, y - 16, 12, false); }
    // the plank: crate-lid slats (warehouse) or two deck boards (barge), a cloth runner and a rear shelf
    const tx = x - 62, ty = y - 20, tw = 124;
    R(c, tx, ty, tw, 10, P.w); R(c, tx, ty, tw, 2, P.wl); R(c, tx, ty + 8, tw, 2, P.wd);
    if (deck()) { R(c, tx, ty + 5, tw, 1, 'rgba(10,8,6,.55)'); for (const gx of [-40, 14, 46]) R(c, x + gx, ty + 1, 1, 8, 'rgba(10,8,6,.3)'); }
    else { for (const dx of [-30, 0, 30]) { R(c, x + dx - 1.5, ty, 3, 10, P.wd); R(c, x + dx - 0.5, ty + 2, 1.4, 1.4, P.ironL); R(c, x + dx - 0.5, ty + 6, 1.4, 1.4, P.ironL); } }
    R(c, x - 30, ty - 1, 60, 3, P.cloth); R(c, x - 30, ty - 1, 60, 1, P.clothL);
    R(c, x - 58, ty - 20, 3, 20, P.wd); R(c, x - 62, ty - 22, 40, 3, P.w); R(c, x - 62, ty - 22, 40, 1, P.wl);   // a shelf on a bracket
    for (const [bx, col] of [[-54, '#3a6a5a'], [-47, '#6a3a2a'], [-40, '#3a5a7a'], [-33, '#7a6a3a']]) { R(c, x + bx - 2.5, ty - 33, 5, 11, col); R(c, x + bx - 1, ty - 37, 2, 5, col); R(c, x + bx - 2.5, ty - 33, 1.4, 9, 'rgba(255,255,255,.22)'); }
    for (const dx of [-24, -10, 16, 34]) mug(c, x + dx, ty, false);
    R(c, x + 24, ty - 5, 10, 5, '#d8c8a0'), R(c, x + 25, ty - 4, 8, 1, P.wd);   // a tally slate
    // the lantern post (fire-flicker light pool 90 px)
    const lx = x + 58, ly = ty - 50, f = flick();
    R(c, lx - 1.5, ly + 6, 3, 50, P.wd); R(c, lx - 8, ly + 3, 16, 3, P.iron); R(c, lx - 1, ly - 8, 2, 4, P.iron); E(c, lx, ly - 9, 3, 2, P.iron);
    light(c, lx, ly + 2, 90, 0.4 * f);
    R(c, lx - 5, ly - 4, 10, 10, 'rgba(255,208,120,' + (0.8 + 0.2 * f).toFixed(2) + ')'); R(c, lx - 5, ly - 4, 10, 1.6, P.iron); R(c, lx - 5, ly + 5, 10, 1.6, P.iron); R(c, lx - 0.5, ly - 4, 1, 10, 'rgba(60,30,10,.6)');
    light(c, lx, ly + 2, 14, 0.5 * f);
    // three stools on the fire side
    for (const dx of [-34, 0, 34]) stool(c, x + dx, y + 38);
  };

  /* ---- F-35b: the bartender (idle loop only) ----
     PLACEMENT: OPENBAR35ART.stand() -> {x, y} behind the counter, or null when the bar is not on (fort, Tavern not built).
     OPENBAR35ART.drawBartender(x, y) paints the figure + wiping loop at any point (camp figure sprite, 2.4 scale like the mates).
     This file places it itself: a holdingProps row k:'obbartender' (y-sorted behind the counter plank),
     and campHit returns {kind:'building', id:'tavern'} on the figure, so a click opens the bar like the counter does. */
  A.keeper = {race: 'HUMAN', spec: 'PLAIN', name: 'Marrow', id: 'bartender', sex: 'm'};
  A.stand = function(){ try { if (!OB.on || !OB.on()) return null; const c = OB.cur().ctr; return c ? {x: c.x, y: c.y - 21} : null;   /* feet a little behind the plank; the sprite's feet sit about 17 px below its anchor */ } catch (e) { return null; } };
  A.drawBartender = function(x, y, t){
    const c = fx(); t = t === undefined ? (window.CAMP ? CAMP.t || 0 : 0) : t;
    if (typeof personSpriteK !== 'function' || typeof drawSprite !== 'function') return;
    const spr = personSpriteK('bt:Marrow', A.keeper), seed = 7;
    // glance: faces the room mostly, looks left now and then (3 s, every ~7 s)
    const left = ((t + seed * 40) % 420) > 300;
    // lean on the counter for a beat, else a slow breath
    const lean = ((t + 90) % 900) < 220 ? 1 : 0, bob = Math.sin(t / 55) * 0.5;
    c.save(); c.translate(x, y); c.rotate((lean ? 0.045 : Math.sin(t / 130) * 0.012) * (left ? -1 : 1)); c.translate(-x, -y);
    drawSprite(spr, x, y - (lean ? 1 : 0) + bob, 2.4, 0, left, false);
    c.restore();
    // wiping a cup: arm circle for 5 s out of every 8, then the cup goes back on the plank
    const dir = left ? -1 : 1, ph = t % 480, wiping = ph < 300;
    if (wiping){ const a = t / 6, hx = x + dir * 7 + Math.cos(a) * 2.4, hy = y - 8 + Math.sin(a) * 1.4;
      mug(c, x + dir * 8, y - 4, false);
      R(c, hx - 4, hy - 3, 8, 5, '#e8e0cc'); R(c, hx - 4, hy + 1, 8, 1.4, 'rgba(0,0,0,.18)'); }
  };
  const _hp = holdingProps;
  holdingProps = function(){
    const out = _hp.apply(this, arguments), s = A.stand();
    if (s) out.push({x: s.x, y: s.y, k: 'obbartender'});
    return out;
  };
  const _dhp = drawHoldingProp;
  drawHoldingProp = function(p){
    if (p && p.k === 'obbartender'){ { const s = A.stand(); if (s) A.drawBartender(s.x, s.y); } return; }
    return _dhp.apply(this, arguments);
  };
  const _hit = campHit;
  campHit = function(wx, wy){
    const h = _hit.apply(this, arguments);
    if (h && h.kind === 'person') return h;
    const s = A.stand(); if (s && Math.abs(wx - s.x) < 22 && wy > s.y - 76 && wy < s.y + 6) return {kind: 'building', id: 'tavern'};
    return h;
  };

  OB.draw.table = A.table; OB.draw.counter = A.counter;

  A.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c}), sv = {h: META.holding};
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const g = cv.getContext('2d'), c0 = ctx;
    try {
      ctx = g;
      for (const h of ['barge', 'warehouse']) for (const k of ['crepitus', 'rankn', 'plain']){
        META.holding = h; g.clearRect(0, 0, 400, 300); A.table({x: 200, y: 160, i: 0, kind: k});
        const d = g.getImageData(0, 0, 400, 300).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
        ok(h + ' ' + k + ' table paints', n > 1500);
      }
      for (const h of ['barge', 'warehouse']){ META.holding = h; g.clearRect(0, 0, 400, 300); A.counter(200, 200); const d = g.getImageData(0, 0, 400, 300).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; ok(h + ' counter paints', n > 3000); }
      { const hs = typeof holdingProps === 'function' ? holdingProps() : []; ok('bartender: no row when the bar is off (fort)', (META.holding = 'fort', !holdingProps().some(p => p.k === 'obbartender'))); META.holding = sv.h; }
      ok('the art is installed', OB.draw.table === A.table && OB.draw.counter === A.counter);
    } catch (e){ ok('no throw: ' + e.message, false); }
    finally { ctx = c0; META.holding = sv.h; }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, n: out.length, details: out};
  };
})();
