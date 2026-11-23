/* DEF30READ: F-30 Hold the gate, readability pass (Art & Interface; the Director's note after F-31.3). No edit to defence30.js or vo3.js.
   1. Raiders under camp tents: SW6 (js/3d/vo2.js) fades a tall sprite that covers the squad; in gate mode it also counts the live raiders
      near the Leader, so a tent roof goes see-through over a raider instead of hiding him.
   2. The ram: a pale amber rim round the Ram Crew sprite (b:ram), so it reads against the night tint, and a wide amber ring under it.
   3. The breach crowd: a red ring under every raider who is inside the wall (y above the wall line), so the crowd reads as people.
   Gate mode (G.def30) and Varnholt (G.t30): there the live wall archers count too, so house roofs fade over them. No switch (DEF30READ.on was removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  const R = window.DEF30READ = {near: 520, cap: 80, rim: '#f0d8a0'};
  let CUR = null, rimmed = false;
  const gate = () => typeof G !== 'undefined' && G && G.def30;
  const town = () => typeof G !== 'undefined' && G && G.t30;   // Varnholt (js/campaign/town.js): wall archers stand behind house roofs
  R.inside = function(e){ return !!(gate() && e && !e.dead && !e.dormant && typeof CELL !== 'undefined' && e.y < G.def30.WY * CELL); };
  R.rimRam = function(){   // one pale rim round each frame of the ram sprite; safe to call twice
    if (rimmed || typeof enemySprite !== 'function' || typeof SPR === 'undefined') return false;
    const spr = enemySprite('ram'); if (!spr || spr._rim30) return false;
    if (!spr.frames || !spr.frames.length){ spr._rim30 = true; rimmed = true; return true; }
    const P = 2, frames = spr.frames.map(f => {
      const c = document.createElement('canvas'); c.width = f.width + P * 2; c.height = f.height + P * 2; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      const t = document.createElement('canvas'); t.width = f.width; t.height = f.height; const tg = t.getContext('2d'); tg.drawImage(f, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = R.rim; tg.fillRect(0, 0, t.width, t.height);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(t, P + dx, P + dy);
      g.drawImage(f, P, P); return c; });
    spr.frames = frames; if (typeof whiteOf === 'function') spr.white = frames.map(whiteOf);
    spr.ax += P; spr.ay += P; spr.w += P * 2; spr.h += P * 2; spr._rim30 = true; rimmed = true; return true; };
  function ring(e, s){
    if (typeof ctx === 'undefined') return;
    if (e.archer30){ ctx.save(); ctx.beginPath(); ctx.ellipse(e.x, e.y + 7 * s, 8 * s, 2.8 * s, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(120,190,255,.2)'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(140,205,255,.9)'; ctx.stroke(); ctx.restore(); return; }   // our wall archers, on the palisade or the Keep walls
    const ram = !!e.ram30 || (e.k === 'ram');
    ctx.save(); ctx.beginPath(); ctx.ellipse(e.x, e.y + 7 * s, (ram ? 11 : 7.5) * s, (ram ? 3.6 : 2.6) * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = ram ? 'rgba(255,200,90,.22)' : 'rgba(255,100,70,.18)'; ctx.fill();
    ctx.lineWidth = ram ? 2.2 : 1.4; ctx.strokeStyle = ram ? 'rgba(255,210,110,.95)' : 'rgba(255,110,76,.85)'; ctx.stroke(); ctx.restore(); }
  function install(){
    R.rimRam();
    if (typeof SW6 === 'object' && SW6 && typeof SW6.figs === 'function' && !SW6._d30){
      const f = SW6.figs; SW6._d30 = true;
      SW6.figs = function(L){
        const out = f.apply(this, arguments);
        if (!(gate() || town()) || !L) return out;
        if (town()) try { for (const a of G.t30.archers || []) if (a && a.state === 'up') out.push(a); } catch (x) {}
        try { let n = 0; for (const e of G.enemies){ if (e.dead || e.dormant) continue; if (Math.hypot(e.x - L.x, e.y - L.y) > R.near) continue; out.push(e); if (++n >= R.cap) break; } } catch (x) {}
        return out; };
    }
    if (typeof SW6 === 'object' && SW6 && typeof SW6.covers === 'function' && !SW6._d30c){   // VO3 tents are not flagged tall, so SW6 never fades them: in gate mode they count as tall
      const c0 = SW6.covers; SW6._d30c = true;
      SW6.covers = function(it){
        if (it && it.kind === 'tent' && !it.tall && (gate() || town())){ it.tall = true; try { return c0.apply(this, arguments); } finally { it.tall = false; } }
        return c0.apply(this, arguments); };
    }
    if (typeof pickFrame === 'function' && !pickFrame._d30){
      const pf = pickFrame; pickFrame = function(u){ CUR = u; return pf.apply(this, arguments); }; pickFrame._d30 = true; }
    if (typeof drawSprite === 'function' && !drawSprite._d30){
      const ds = drawSprite;
      drawSprite = function(spr, x, y, s){
        const u = CUR; CUR = null;
        try { if (u && town() && u.x === x && u.y === y && u.state === 'up' && G.t30.archers.indexOf(u) >= 0){ u.archer30 = true; ring(u, s); }
          if (u && gate() && u.x === x && u.y === y && (u.ram30 || R.inside(u)) && G.enemies.indexOf(u) >= 0) ring(u, s); } catch (e) {}
        return ds.apply(this, arguments); };
      drawSprite._d30 = true; }
  }
  R.selfTest = function(){
    const fails = [], ck = (c, m) => { if (!c) fails.push(m); };
    ck(typeof SW6 !== 'object' || (SW6._d30 && SW6._d30c), 'SW6.figs and SW6.covers wrapped');
    ck(typeof drawSprite !== 'function' || drawSprite._d30, 'drawSprite wrapped');
    ck(typeof enemySprite !== 'function' || enemySprite('ram')._rim30, 'ram rim applied');
    ck(!R.inside({x: 0, y: 1e9}), 'a raider south of the wall is not inside');
    ck(!R.inside(null), 'null is not inside');
    return {ok: !fails.length, fails};
  };
  window.addEventListener('load', () => setTimeout(install, 0));
})();
