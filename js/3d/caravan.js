/* caravan3d.js: the escort wagon and its horse face the way they travel (F-42c, Art, 2026-11-14).
   Before: the horse only had east and west walks and the wagon only an east view, so on south-north maps the team "walked east and slid north".
   Now: the heading is read from the wagon's own movement (smoothed, held while it stands still) and snapped to 8 ways.
   Horse dir = heading / 45deg (0 east, 2 south = toward us, 4 west, 6 north = away). Wagon prop dir = 2 + heading / 45deg (its side view is dir 2 = pole east; dir 0/4 are its ends).
   INT-1 group 13: no switch. */
window.CARAVAN3D = (function(){
  const C = {old:null};
  C.dirs = function(ang){   // heading in radians (screen: 0 east, +pi/2 south) -> {horse, wagon} dir indices 0..7
    const k = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
    return {horse:k, wagon:(k + 2) % 8};
  };
  C.heading = function(w){   // updates and returns the smoothed heading vector's angle; holds it when the wagon is still
    const h = w._c3 || (w._c3 = {px:w.x, py:w.y, vx:w.left ? -1 : 1, vy:0});
    const dx = w.x - h.px, dy = w.y - h.py; h.px = w.x; h.py = w.y;
    if (dx * dx + dy * dy > 0.04 && dx * dx + dy * dy < 900){ const d = Math.hypot(dx, dy); h.vx += (dx / d - h.vx) * 0.12; h.vy += (dy / d - h.vy) * 0.12; }
    return Math.atan2(h.vy, h.vx);
  };
  C.wagonProp = function(x, y, dir, flash){   // the 3D wagon prop at one of its 8 views; VO3's painted wagon only faces right (and flips by position), so it is bypassed here
    const rec = w3dRecipe('w_wagon', w3dSeason());
    if (flash){ ctx.save(); ctx.filter = 'brightness(2.2)'; }
    try { return r3qDraw(rec, x, y, W3D.S, {clip:'still', i:0, dir, async:true, shadow:false}); } finally { if (flash) ctx.restore(); }
  };
  // UX W1 (Art, 2026-11-16): the escort wagon was a small sprite lost in the dark. Under it: a warm lantern glow and a dashed
  // gold ring (like the beacons); ahead of it: a faint dotted line along the next stretch of MAP.route. Escort only; C.markOn = false hides it.
  C.markOn = true;
  C.mark = function(w){
    if (!C.markOn || typeof G === 'undefined' || !G || G.obj !== 'escort' || w !== G.wagon) return;
    const R = typeof MAP !== 'undefined' && MAP && MAP.route, TAU = Math.PI * 2;
    ctx.save();
    if (R && R.length > 1){
      ctx.strokeStyle = 'rgba(255,216,96,.55)'; ctx.lineWidth = 3.5; ctx.setLineDash([4, 12]); ctx.lineDashOffset = -(G.frame % 64) / 4;
      ctx.beginPath(); ctx.moveTo(w.x, w.y + 6); let left = 640, px = w.x, py = w.y;
      for (let i = (w.idx | 0) + 1; i < R.length && left > 0; i++){ const d = Math.hypot(R[i].x - px, R[i].y - py), t = Math.min(1, left / (d || 1));
        ctx.lineTo(px + (R[i].x - px) * t, py + 6 + (R[i].y - py) * t); left -= d; px = R[i].x; py = R[i].y; }
      ctx.stroke(); ctx.setLineDash([]);
    }
    const gl = ctx.createRadialGradient(w.x, w.y - 20, 6, w.x, w.y - 20, 110); gl.addColorStop(0, 'rgba(255,190,90,.42)'); gl.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(w.x, w.y - 20, 110, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,12,4,.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(w.x, w.y + 8, 78, 40, 0, 0, TAU); ctx.stroke();   // dark under-stroke so the ring reads at night
    ctx.strokeStyle = 'rgba(255,224,110,' + (0.78 + Math.sin(G.frame / 12) * 0.15) + ')'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 7]);
    ctx.beginPath(); ctx.ellipse(w.x, w.y + 8, 78, 40, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  };
  C.draw = function(w){
    try { C.mark(w); } catch (e) {}
    const ang = C.heading(w), D = C.dirs(ang), cx = Math.cos(D.horse * Math.PI / 4), cy = Math.sin(D.horse * Math.PI / 4);   // the snapped heading
    const rec = r3qRecipe('horse:riding'), hx = w.x + cx * 66, hy = w.y + 8 + cy * 40, front = cy > 0.3;   // heading south: the horse is nearer the camera, so it draws last
    const horse = () => r3qDraw(rec, hx, hy, 2.4, {clip:'walk', i:Math.floor(G.frame / 6) % 8, dir:D.horse, async:true, shadowW:12});
    let ok1 = true, ok2;
    if (!front) ok1 = horse();
    ctx.save(); ctx.strokeStyle = '#4a301c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w.x + cx * 34, w.y - 12 + cy * 20); ctx.lineTo(hx - cx * 18, hy - 30); ctx.stroke(); ctx.restore();
    shadow(w.x, w.y + 6, 40);
    ok2 = C.wagonProp(w.x, w.y + 6, D.wagon, w.flash > 0);
    if (front) ok1 = horse();
    return ok1 && ok2;
  };
  if (typeof w3dCaravan === 'function'){
    C.old = w3dCaravan;
    w3dCaravan = function(w){
      try { return C.draw(w); } catch (e) { console.warn('caravan3d fell back:', e); return C.old(w); }
    };
  }
  C.selfTest = function(){
    const a = C.dirs(0), b = C.dirs(Math.PI / 2), c = C.dirs(Math.PI), d = C.dirs(-Math.PI / 2);
    const ok = a.horse === 0 && a.wagon === 2 && b.horse === 2 && b.wagon === 4 && c.horse === 4 && c.wagon === 6 && d.horse === 6 && d.wagon === 0 && typeof C.old === 'function';
    return {ok, info: ok ? 'E/S/W/N pick horse 0/2/4/6 and wagon 2/4/6/0' : 'dir mapping wrong: ' + JSON.stringify([a, b, c, d])};
  };
  return C;
})();
