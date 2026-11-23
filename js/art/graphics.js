/* ============================================================================
   INDEX 84 - GRAPHICS QUICK WINS (from audits/graphics.md)
   Loaded after the main game script in index.html. Wrap game functions the
   same way the Index sections do:  { const f = fn; fn = function(){ ... }; }
   Each change: a short note here (what, why) and a ROLLBACK line.

   GFX-01  r3dChoose        walk and run frames advance with the real speed
   GFX-09  r3dDirFor        a new facing must hold for 3 frames before it shows
   GFX-03  pop              floating combat text steps up instead of stacking
   GFX-05  drawPuddleList   winter puddles are frozen (no ripple, cracks);
           drawCampRoads    the fort's winter roads get a muddy edge
   GFX-12  w3dTreeAt        trees drawn 20% larger
   GFX-13  simpleSprite/blit coins and gems drawn smaller
   GFX-15  gfxMateBar       bordered, colour-graded squad bar (one in-place
                            patch in draw(), marked Index 84)
   GFX-16  r3dCorpse        a soft shadow under 3D corpses
   GFX-08  r3dCorpse        no flat pixel corpse while the 3D death frames render
   ROLLBACK  Delete this file's contents (the game falls back to the Index 55-80
             behaviour) and undo the one "Index 84" patch in draw()'s mate loop.
============================================================================ */
(function(){
'use strict';
const now = () => (typeof G !== 'undefined' && G) ? G.frame : (typeof CAMP !== 'undefined' ? CAMP.t : 0);

/* ---- GFX-01: walk and run cadence follows how fast the unit really moves ------------------
   Was Math.floor(tick / 6) (walk) and tick / 4 (run): the legs ran at one rate whatever the
   speed, so units in snow, mud or a trap, or sprinting, slid. Now a per-unit phase advances by
   a rate that grows with the measured speed. At the Leader's normal pace it is close to the
   old rate, so nothing speeds up for free. */
{ const f = r3dChoose;
  r3dChoose = function(rec, u, frame, tick){
    const c = f(rec, u, frame, tick);
    try {
      const st = u && u._r3d;
      if (st && typeof u.x === 'number'){
        const t = now();
        if (st.gfT !== t){
          let d = (st.gx === undefined) ? 0 : Math.hypot(u.x - st.gx, u.y - st.gy);
          if (d > 14) d = 0;                                              // a teleport, not a step
          st.gx = u.x; st.gy = u.y; st.gfT = t;
          st.gs = (st.gs === undefined ? d : st.gs * 0.7 + d * 0.3);      // smoothed px per frame
          const run = c.clip === 'run';
          let rate = run ? Math.min(0.36, 0.07 + 0.06 * st.gs) : Math.min(0.30, 0.045 + 0.05 * st.gs);
          /* P23 ANIM (AD 23 Nov): people plant their feet. gph counts 8-frame cycles (anim.js maps it to 12), so one cycle per 12 * walkPx
             of ground: about 55 px a walk cycle at field scale, the length a stride reaches. The old rate made it about 110 px (slow,
             floaty legs, sliding feet). Knob FEEL.hum in figures-2.js; FEEL.hum = null restores the old rate. */
          if (!run && typeof feelHum === 'function' && feelHum(rec)){ const px = feelPx(rec, 'walk');
            if (px > 0) rate = Math.max(0.03, Math.min(0.6, st.gs * 8 / (12 * px))); }
          if (c.clip === 'walk' || c.clip === 'run') st.gph = (st.gph || 0) + rate;
        }
        if ((c.clip === 'walk' || c.clip === 'run') && st.gph !== undefined){
          const n = (typeof R3D_CLIPS !== 'undefined' && rec && R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig][c.clip] && R3D_CLIPS[rec.rig][c.clip].n) || 8;
          c.i = Math.floor(st.gph) % n;
        }
      }
    } catch (e) {}
    return c;
  };
}

/* ---- GFX-09: a facing has to hold for three frames before it changes -----------------------
   Units pushed about by separation, wander wobble or slot corrections flip between
   neighbouring directions and shimmer. Eight directions are pre-rendered, so there is nothing
   to blend; this only filters one-frame flickers. */
{ const f = r3dDirFor;
  r3dDirFor = function(u){
    const st = f(u);
    try {
      if (st && typeof st.dir === 'number'){
        const t = now();
        if (st.hd === undefined){ st.hd = st.dir; st.hc = st.dir; st.hn = 0; st.ht = t; }
        else if (st.ht !== t){
          st.ht = t;
          if (st.dir === st.hd) st.hn = 0;
          else if (st.dir === st.hc){ if (++st.hn >= 3){ st.hd = st.dir; st.hn = 0; } }
          else { st.hc = st.dir; st.hn = 1; }
        }
        st.dir = st.hd;
      }
    } catch (e) {}
    return st;
  };
}

/* ---- GFX-03: floating text no longer stacks on one spot -----------------------------------
   pop() put every label at the unit's exact spot, so CRITICAL, MOMENTUM RANK and STEADY printed
   on top of each other. A new label now steps up 13px for each younger label near it. */
{ const f = pop;
  pop = function(x, y, text, c){
    f(x, y, text, c);
    if (window.L1I !== false && G && G.t45 && !G.over) return;   // the Founding has one stacker (deployment.js pop1i)
    try {
      const fx = G.fx, me = fx[fx.length - 1]; if (!me || me.text !== text) return;
      let k = 0;
      for (let i = fx.length - 2, n = 0; i >= 0 && n < 40; i--, n++){
        const o = fx[i]; if (o.text === undefined || o.life < 12) continue;
        const oy = o.y - (46 - o.life) * 0.7;
        if (Math.abs(o.x - me.x) < (String(o.text).length + String(text).length) * 2.8 && Math.abs(oy - me.y) < 12) k++;
      }
      if (k) me.y -= Math.min(4, k) * 13 * (window.gfxK ? gfxK() : 1);
    } catch (e) {}
  };
}

/* ---- GFX-05: frozen puddles in winter, a muddy edge on the fort's winter roads ------------- */
{ const f = drawPuddleList;
  drawPuddleList = function(list, cx, cy){
    if (!list || !list.length || seasonOf() !== 'winter') return f(list, cx, cy);
    for (const p of list){
      if (p.x < cx - 60 || p.x > cx + VW + 60 || p.y < cy - 40 || p.y > cy + VH + 40) continue;
      const a = (p.seed || 1) * 2.399, rx = p.rx, ry = p.ry;
      ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.ang || 0);
      if (window.PUDDLE44 !== false){   /* F-44 (n): dark, slightly see-through ice on a wet rim with a ragged edge and a thin snow lip, not a white disc */
        const n = 11, pts = []; for (let k = 0; k < n; k++){ const t = k / n * TAU, j = 0.82 + 0.28 * Math.abs(Math.sin(a * (k + 1.7) * 1.3)); pts.push([Math.cos(t) * rx * j, Math.sin(t) * ry * j]); }
        const blob = (m) => { ctx.beginPath(); pts.forEach((q, k) => { const x = q[0] * m, y = q[1] * m; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
        ctx.fillStyle = 'rgba(24,22,18,.5)'; blob(1.16); ctx.fill();                                   // wet mud ring
        ctx.fillStyle = 'rgba(58,78,96,.78)'; blob(1); ctx.fill();                                      // dark ice
        ctx.fillStyle = 'rgba(120,150,170,.35)'; blob(0.62); ctx.save(); ctx.translate(-rx * 0.1, -ry * 0.12); ctx.fill(); ctx.restore();   // paler heart
        ctx.strokeStyle = 'rgba(214,228,236,.55)'; ctx.lineWidth = 1.2; blob(1.02); ctx.stroke();       // the snow lip
        ctx.strokeStyle = 'rgba(150,180,198,.6)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < 2; k++){ const t = a + k * 2.2, x1 = Math.cos(t) * rx * 0.85, y1 = Math.sin(t) * ry * 0.85; ctx.moveTo(x1 * 0.1, y1 * 0.1); ctx.lineTo(x1 * 0.5 + Math.sin(a) * 2, y1 * 0.5 - Math.cos(a)); ctx.lineTo(x1, y1); }
        ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(Math.round(-rx * 0.4), Math.round(-ry * 0.38), Math.max(2, Math.round(rx * 0.22)), 1); ctx.restore(); continue; }
      ctx.fillStyle = 'rgba(40,36,28,.55)'; ctx.beginPath(); ctx.ellipse(1, 2, rx + 3, ry + 2.5, 0, 0, TAU); ctx.fill();        // frozen mud rim
      ctx.fillStyle = '#c4d6de'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();                               // ice
      ctx.fillStyle = '#e6f0f3'; ctx.beginPath(); ctx.ellipse(-rx * 0.14, -ry * 0.16, rx * 0.66, ry * 0.58, 0, 0, TAU); ctx.fill();   // frost bloom
      ctx.strokeStyle = 'rgba(86,120,140,.75)'; ctx.lineWidth = 1; ctx.beginPath();                                               // two cracks
      for (let k = 0; k < 2; k++){ const t = a + k * 2.2, x1 = Math.cos(t) * rx * 0.9, y1 = Math.sin(t) * ry * 0.9; ctx.moveTo(x1 * 0.1, y1 * 0.1); ctx.lineTo(x1 * 0.5 + Math.sin(a) * 2, y1 * 0.5 - Math.cos(a)); ctx.lineTo(x1, y1); }
      ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(-rx * 0.45), Math.round(-ry * 0.42), Math.max(2, Math.round(rx * 0.3)), 1);  // glint
      ctx.restore();
    }
  };
}
{ const f = drawCampRoads;
  drawCampRoads = function(){
    try {
      if (seasonOf() === 'winter' && typeof CAMP_LAYOUT !== 'undefined' && CAMP_LAYOUT.fort){
        ctx.save(); ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
        for (const r of CAMP_LAYOUT.fort.roads){ ctx.beginPath(); ctx.moveTo(r.pts[0][0], r.pts[0][1]); for (const p of r.pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = 'rgba(30,26,18,.5)'; ctx.lineWidth = r.w + 12; ctx.stroke(); }
        ctx.restore();
      }
    } catch (e) {}
    return f.apply(this, arguments);
  };
}

/* ---- GFX-12: trees 20% larger -------------------------------------------------------------
   Trees stood about 2.3 characters tall beside 3.5-character buildings. W3D.S is the world model
   scale (the same trick w3dMapProp uses for its o.scale). */
{ const f = w3dTreeAt;
  w3dTreeAt = function(t, frame, gl, alpha){
    const s0 = W3D.S; W3D.S = s0 * 1.2;
    try { return f(t, frame, gl, alpha); } finally { W3D.S = s0; }
  };
}

/* ---- GFX-13: coins and gems a little smaller (they were about half a torso) --------------- */
{ /* simpleSprite sets _gk itself (js/art/pixel.js; INT-1 step 3: the wrapper folded in) */
  const b = blit;
  blit = function(img, x, y, s, flip, ax, ay){ return b(img, x, y, img && img._gk ? s * img._gk : s, flip, ax, ay); };
}

/* ---- GFX-15: squad bar (called from draw()'s mate loop) -----------------------------------
   Was bare 4x3 pips with no backing, hard to see on the floor. Now a dark plate, 4x4 pips that
   shift green, amber, red as Constitution falls. More than 8 pips becomes a bar. */
window.gfxMateBar = function(m){
  const n = m.maxCon, fr = Math.max(0, m.con) / n, col = fr > 0.6 ? '#6fd37a' : fr > 0.3 ? '#e0c050' : '#e0604a';
  const y = Math.round(m.y + 21);
  if (n > 8){
    const w = 40, x0 = Math.round(m.x - w / 2);
    ctx.fillStyle = 'rgba(8,6,4,.8)'; ctx.fillRect(x0 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = col; ctx.fillRect(x0, y, Math.round(w * fr), 4); return;
  }
  const w = n * 5 - 1, x0 = Math.round(m.x - w / 2);
  ctx.fillStyle = 'rgba(8,6,4,.8)'; ctx.fillRect(x0 - 2, y - 2, w + 4, 8);
  for (let i = 0; i < n; i++){ ctx.fillStyle = i < m.con ? col : 'rgba(255,255,255,.14)'; ctx.fillRect(x0 + i * 5, y, 4, 4); }
};

/* ---- GFX-16 and GFX-08: corpses ------------------------------------------------------------
   Corpses are drawn with shadow:false and floated. Draw a soft shadow under them (fading with
   the corpse). The 3D death frames render in the background; until they are ready r3dCorpse
   returns false and the old flat rotated pixel sprite showed for a few frames. For kinds that
   do have 3D death clips, draw nothing for the first 24 frames instead of that pixel flash. */
{ const f = r3dCorpse;
  r3dCorpse = function(x){
    let drew = false;
    try {
      const B = BESTIARY[x.k];
      if (B && B.arch !== 'fixed' && x.born !== undefined){
        const s = B.sc * 1.2, a = Math.min(1, x.life / 40) * 0.55, quad = typeof QUAD_KINDS !== 'undefined' && QUAD_KINDS.has(x.k);
        ctx.save(); ctx.globalAlpha = a; shadow(x.x, x.y + 7 * s, (quad ? 7 : 5) * s); ctx.restore();
      }
    } catch (e) {}
    const r = f(x);
    try {
      if (!r && x.born !== undefined && G.frame - x.born < 24 && (ENEMY_LOOK[x.k] || (typeof QUAD_KINDS !== 'undefined' && QUAD_KINDS.has(x.k)) || (typeof R3D_SPECIAL !== 'undefined' && R3D_SPECIAL[x.k]))) return true;
    } catch (e) {}
    return r;
  };
}

/* ---- GFX-04: the unexplored (black) fog edge is softer ------------------------------------
   fogBlack() is one pixel per map cell, scaled up with smoothing, so the edge of the dark
   showed the cell grid. Its result is now blurred about one cell, once per change of the fog
   (not per frame), so the scale-up gives a smooth rim.
   V1DARK (Art review V1, Patrick Q49 draft, 2026-11-16): with V1DARK.on the never-seen layer is drawn at V1DARK.a (0.6; it sits on the 0.62 out-of-sight dim, so about 0.85 dark in all) instead of
   solid black, so the floor's shape shows very dark. Enemies stay hidden: they are drawn only while in sight (visNow, render.js), and
   buildings on never-seen cells are culled (VO2.fogCull). ON since Patrick Q49 A (16 Nov); V1DARK.set(false) rolls back to solid black live. */
window.V1DARK = window.V1DARK || {on:true, a:0.6, set(v){ this.on = !!v; try { FOGK.dirty = true; } catch (e) {} return this.on; }};
if (typeof fogBlack === 'function' && typeof FOGK !== 'undefined'){
  const f = fogBlack, S = {c:null, src:null, w:0, h:0, k:''};
  fogBlack = function(){
    const was = FOGK.dirty, B = f(), V = window.V1DARK, k = V && V.on ? 'v' + V.a : '';
    try {
      if (was || S.src !== B || S.w !== B.width || S.h !== B.height || !S.c || S.k !== k){
        if (!S.c || S.w !== B.width || S.h !== B.height){ S.c = newCanvas(B.width, B.height); S.w = B.width; S.h = B.height; }
        const g = S.c.getContext('2d'); g.clearRect(0, 0, S.w, S.h); S.k = k;
        g.globalAlpha = k ? V.a : 1; g.filter = 'blur(0.8px)'; g.drawImage(B, 0, 0); g.filter = 'none'; g.globalAlpha = 1; S.src = B;
      }
      return S.c;
    } catch (e) { return B; }
  };
}

/* ---- GFX-18 (seasonal particles): nothing to do. The "blue sparkles" are summer dragonflies and
   fireflies in drawSeasonOverlay; spring has pollen and bees, autumn leaves, winter rain streaks. */
})();

/* ============================================================================
   INDEX 84b - SQUAD SPACING, GAME FEEL AND IN-WORLD POLISH (J-06, J-08, J-09)
   J-06  slotTarget / updateMates / anchorFor
           Brace is a shoulder-to-shoulder arc in front of the Leader; squad mates
           keep 16px apart (they, never the Leader, are pushed, then collide()d
           off walls); camp people who share a role spot are spread round it.
   J-08  update / hurtEnemy / moveLeader
           dust at the feet when the squad charges, braces, and when the camp
           Leader sprints (construction dust already existed in drawSite);
           struck enemies are shoved 3.6px over 3 frames; optional hit-stop
           (setting "Hit-stop", off by default) of 1-2 frames on hits of 3+.
   J-09  gfxRing (one patch in draw()), camp speech bubbles, campLabel, shadow,
         w3dFire, w3dPlot
           ink-backed command ring, notched-corner parchment bubbles and
           labels, cast shadows fall lower-right (the light is upper-left, as
           in R3D_LIGHT), a warm light pool under the campfire, and empty
           plots fade when the Leader is far away.
   ROLLBACK  Delete from this comment to the end of this file and undo the
             "Index 84b" patch in draw() (command ring).
============================================================================ */
(function(){
'use strict';

/* ---- J-06: Brace as a line, and personal space ---------------------------------------- */
{ const f = slotTarget;
  slotTarget = function(i, n, shieldWall){
    if (!shieldWall) return f(i, n, shieldWall);
    const L = G.leader, fa = (typeof G.facing === 'number') ? G.facing : 0;
    const step = Math.min(22 / 34, 2.4 / Math.max(1, n - 1)), a = fa + (i - (n - 1) / 2) * step;
    return {x: L.x + Math.cos(a) * 34, y: L.y + Math.sin(a) * 30};
  };
}
const SEP_R = 16;
function sepMates(){
  const S = G.squad, L = G.leader; if (!S || !L) return;
  for (let i = -1; i < S.length; i++){
    const a = i < 0 ? L : S[i]; if (i >= 0 && a.state !== 'up') continue;
    for (let j = i + 1; j < S.length; j++){
      const b = S[j]; if (b.state !== 'up') continue;
      let dx = b.x - a.x, dy = (b.y - a.y) * 0.8, d = Math.hypot(dx, dy);   // vertical neighbours need more room: sprites are tall and the bar sits under the feet
      if (d >= SEP_R) continue;
      if (d < 0.01){ dx = (j % 2 ? 1 : -1); dy = 0.3; d = Math.hypot(dx, dy); }
      const p = Math.min(2.0, (SEP_R - d) * 0.35), mx = dx / d * p, my = dy / d * p / 0.8;
      if (i < 0){ b.x += mx; b.y += my; }
      else { a.x -= mx / 2; a.y -= my / 2; b.x += mx / 2; b.y += my / 2; }
      b.sep84 = 2; if (i >= 0) a.sep84 = 2;
    }
  }
  for (const m of S) if (m.sep84 > 0){ m.sep84--; if (m.state === 'up') collide(m, 9, true); }
}
{ const f = updateMates;
  updateMates = function(sw){ f(sw); try { if (G && !G.over){ sepMates(); sepMates(); } } catch (e) {} };   /* 84c: two passes, 2px cap */
}
// camp people who share a role spot (training yard, hospital, ...) stand in a small ring round it
{ const f = anchorFor;
  anchorFor = function(q, role){
    const a = f(q, role); if (!a || role === 'sit') return a;
    try {
      q._gax = a.x; q._gay = a.y; q._gar = role;
      let k = 0; const P = CAMP.people;
      for (let i = 0; i < P.length; i++){ const o = P[i]; if (o === q) break; if (o._gar === role && o.role === role && Math.abs(o._gax - a.x) < 10 && Math.abs(o._gay - a.y) < 10) k++; }
      if (k){ const ang = k * 2.4; a.x += Math.cos(ang) * (14 + 6 * (k >> 2)); a.y += Math.sin(ang) * 8; }
    } catch (e) {}
    return a;
  };
}

/* ---- J-08: dust, knock-back, optional hit-stop ----------------------------------------- */
const dustCol = () => { const s = seasonOf(); return s === 'winter' ? '#dfe6e6' : (SEASONS_CFG[s] || SEASONS_CFG.summer).dust2; };
function dust(x, y, n, spread, life){
  const c = dustCol();
  for (let i = 0; i < n; i++) G.fx.push({x: x + rnd(-spread, spread), y: y + rnd(-2, 2), vx: rnd(-0.5, 0.5), vy: rnd(-0.35, -0.1), life: life || 20, c, px: 2 + (i % 2)});
}
{ const f = update;
  update = function(){
    if (G && !G.over && !G.paused && G.hs84 > 0){ G.hs84--; return; }               // hit-stop: this frame does not advance
    f.apply(this, arguments);
    try {
      if (!G || G.over || G.paused) return;
      const L = G.leader;
      if (G.frame % 6 === 0 && G.chargeT > 0){
        if (L.moving && !L.down) dust(L.x, L.y + 15, 2, 5);
        for (const m of G.squad) if (m.state === 'up' && m.moving) dust(m.x, m.y + 15, 2, 5);
      }
      const sh = G.formation === 'SHIELD';
      if (sh && !G.sh84){ dust(L.x, L.y + 16, 4, 10, 24); for (const m of G.squad) if (m.state === 'up') dust(m.x, m.y + 16, 4, 10, 24); }
      G.sh84 = sh;
      for (const e of G.enemies){ const k = e.kb84; if (k && k.t > 0 && !e.dead){ e.x += k.x; e.y += k.y; collide(e, e.r * 0.7); k.t--; } }
    } catch (e) {}
  };
}
{ const f = hurtEnemy;
  hurtEnemy = function(e, n){
    try {
      if (G && e && !e.dead){
        const B = BESTIARY[e.k];
        if (B && !B.boss && B.arch !== 'fixed' && !e.dormant && !e.charging && settings().knockback !== false){   /* 84d: Knock-back setting */
          let best = G.leader, bd = Math.hypot(e.x - best.x, e.y - best.y);
          for (const m of G.squad){ if (m.state !== 'up') continue; const d = Math.hypot(e.x - m.x, e.y - m.y); if (d < bd){ bd = d; best = m; } }
          const a = Math.atan2(e.y - best.y, e.x - best.x); e.kb84 = {x: Math.cos(a) * 1.2, y: Math.sin(a) * 1.2, t: 3};
        }
        if (n >= 3 && settings().hitstop) G.hs84 = Math.max(G.hs84 || 0, n >= 5 ? 2 : 1);
      }
    } catch (err) {}
    return f(e, n);
  };
}
// the Settings row (stored as META.settings.hitstop; off unless ticked)
{ const f = settingsHTML;
  settingsHTML = function(dark){
    const h = f(dark), box = `<label title="Freeze the action for a frame or two on big hits"><input type="checkbox" ${settings().hitstop ? 'checked' : ''} onchange="setSetting('hitstop', this.checked)"> Hit-stop</label>`;
    return h.includes('Screen shake</label>') ? h.replace('Screen shake</label>', 'Screen shake</label>\n    ' + box) : h;
  };
}
{ const f = moveLeader;
  moveLeader = function(q){
    const px = q.x, py = q.y; f(q);
    try { if (window.P24 && P24.footfall && P24.footfall(q, px, py)) return;   /* F-19: dust on footfalls only (P24.on_footfall = false restores the old line below) */
    if (q.moving && keys.shift && CAMP.t % 4 === 0){   /* Index P24: smaller puffs at the heels, drifting back against the run; drawn under the figures (js/ui/polish.js) */
      const s = seasonOf(), dx = q.x - px, dy = q.y - py, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
      CAMP.puffs.push({run:true, x: q.x - ux * 8 + rnd(-3, 3), y: q.y + 1 - uy * 3, vx: -ux * 0.35 + rnd(-0.12, 0.12), vy: -0.05 + rnd(-0.03, 0), life: (window.P24 ? P24.K.puffLife : 24),
        c: s === 'winter' ? '#dfe6e6' : (SEASONS_CFG[s] || SEASONS_CFG.summer).dust2}); } } catch (e) {}
  };
}

/* ---- J-09: in-world overlay style ------------------------------------------------------- */
window.gfxRing = function(sw){
  const col = ctx.strokeStyle, lz = typeof CAMZ !== 'undefined' && CAMZ.on ? 1 / CAMZ.z : 1; ctx.save(); ctx.setLineDash([6 * lz, 8 * lz]);   /* A2: screen px under the zoom */
  ctx.lineWidth = (sw ? 5 : 4) * lz; ctx.strokeStyle = 'rgba(18,12,6,.3)'; ctx.stroke();      // a dark under-line so it reads on grass and stone
  ctx.lineWidth = (sw ? 3 : 2) * lz; ctx.strokeStyle = col; ctx.stroke(); ctx.restore();
};
function inkBox(x, y, w, h, fill, edge, hl){
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = edge; ctx.fillRect(x + 2, y - 2, w - 4, 2); ctx.fillRect(x + 2, y + h, w - 4, 2); ctx.fillRect(x - 2, y + 2, 2, h - 4); ctx.fillRect(x + w, y + 2, 2, h - 4);
  ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + w - 2, y, 2, 2); ctx.fillRect(x, y + h - 2, 2, 2); ctx.fillRect(x + w - 2, y + h - 2, 2, 2);
  ctx.fillStyle = fill; ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4);
  if (hl){ ctx.fillStyle = hl; ctx.fillRect(x + 2, y, w - 4, 1); }
}
function bubble(x, y, w, text){
  const bPx = typeof hudPx === 'function' ? hudPx(13) : 14, bh = Math.max(24, Math.ceil(bPx * 1.85)), by = y - bh + 6;
  const bx = x - w / 2, tx = Math.round(x);
  inkBox(bx + 2, by + 3, w, bh, 'rgba(0,0,0,.2)', 'rgba(0,0,0,0)');                          // soft drop
  inkBox(bx, by, w, bh, '#ece0c4', '#3a2c1a', '#f7efd9');
  ctx.fillStyle = '#3a2c1a'; ctx.fillRect(tx - 4, by + bh, 8, 2); ctx.fillRect(tx - 3, by + bh + 2, 6, 2); ctx.fillRect(tx - 2, by + bh + 4, 4, 2);   // stepped tail
  ctx.fillStyle = '#ece0c4'; ctx.fillRect(tx - 2, by + bh, 4, 2); ctx.fillRect(tx - 1, by + bh + 2, 2, 2);
  ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center'; ctx.font = `italic ${bPx}px Georgia`; ctx.fillText(text, x, y - 1, w - 10);
}
{ const f = drawCamp;
  drawCamp = function(){
    let hid = null;
    if (!G) for (const q of CAMP.people) if (q.bark){ (hid || (hid = [])).push(q, q.bark); q.bark = null; }   // the old bubble skips them
    const r = f.apply(this, arguments);
    if (G) return r;
    try {
      if (hid) for (let i = 0; i < hid.length; i += 2){ const q = hid[i]; if (!q.bark) q.bark = hid[i + 1]; if (q.bark === hid[i + 1]) q.barkLife--; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const placed = [];   // SW-1: two people talking stood close and their bubbles drew on top of each other; a bubble that would overlap one already placed rises above it
      for (const q of CAMP.people){
        if (!q.bark || !(q.barkLife > 0)) continue;
        const x = q.x - CAMP.cam.x; let y = q.y - CAMP.cam.y - 62; if (x < -100 || x > VW + 100 || y < -40 || y > VH) continue;
        const bPx = typeof hudPx === 'function' ? hudPx(13) : 14;
        ctx.font = `italic ${bPx}px Georgia`; const w = Math.min(260, ctx.measureText(q.bark).width + 16);
        for (let n = 0; n < 4; n++){ let hit = null; for (const r of placed) if (x - w / 2 < r.x1 && x + w / 2 > r.x0 && y - 18 < r.y1 && y + 12 > r.y0){ hit = r; break; } if (!hit) break; y = hit.y0 - 14; }
        placed.push({x0: x - w / 2, x1: x + w / 2, y0: y - 18, y1: y + 12});
        ctx.globalAlpha = Math.min(1, q.barkLife / 30); { const k = (window.gfxK ? gfxK() : 1) / (typeof CAMZ !== 'undefined' && CAMZ.on ? CAMZ.z : 1); if (Math.abs(k - 1) > 0.01){   /* A2: a bark keeps its screen size under the zoom */ ctx.save(); ctx.translate(x, y); ctx.scale(k, k); (window.bubbleV || bubble)(0, 0, w, q.bark); ctx.restore(); } else (window.bubbleV || bubble)(x, y, w, q.bark); } ctx.globalAlpha = 1;   /* 84d: window scale */
      }
    } catch (e) { if (hid) for (let i = 0; i < hid.length; i += 2) if (!hid[i].bark) hid[i].bark = hid[i + 1]; }
    return r;
  };
}
campLabel = function(x, y, title, sub){
  const subPx = typeof hudPx === 'function' ? hudPx(12) : 14, titlePx = Math.max(15, subPx + 1);
  const extra = Math.max(0, subPx - 12), h = 40 + Math.ceil(extra * 2), ty = y - 22 - Math.ceil(extra * 1.2);
  ctx.font = `bold ${titlePx}px Georgia`; const w1 = ctx.measureText(title).width; ctx.font = `${subPx}px Georgia`; const w2 = ctx.measureText(sub).width;
  const w = Math.max(w1, w2) + 20;
  inkBox(x - w / 2, y - h, w, h, 'rgba(30,20,10,.92)', '#d4af37', 'rgba(255,233,176,.18)');
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9b0'; ctx.font = `bold ${titlePx}px Georgia`; ctx.fillText(title, x, ty);
  ctx.fillStyle = '#cdbf9f'; ctx.font = `${subPx}px Georgia`; ctx.fillText(sub, x, y - 7);
};

/* ---- J-09: light direction. The 3D light comes from the upper left (R3D_LIGHT x < 0), so
   cast shadows now fall to the lower right, and the campfire throws a warm pool on the ground. */
{ const f = shadow;
  shadow = function(x, y, w){ return f(x + w * 0.2, y, w * 1.08); };
}
{ const f = w3dFire;
  w3dFire = function(x, y, t){
    try {
      if (!G){
        const r = 96 + Math.sin(t / 5) * 4, g = ctx.createRadialGradient(x, y + 6, 8, x, y + 6, r);
        g.addColorStop(0, 'rgba(255,160,70,.2)'); g.addColorStop(1, 'rgba(255,160,70,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + 6, r, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
    } catch (e) {}
    return f(x, y, t);
  };
}
/* ---- J-09: camp plot clutter. Empty plots (sign and stakes) fade when the Leader is far away. */
{ const f = w3dPlot;
  w3dPlot = function(o){
    let a = 1;
    try {
      const Lq = CAMP.people.find(q => q.kind === 'leader');
      if (Lq && CAMP.ctrl){ const d = Math.hypot(Lq.x - o.x, Lq.y - o.y); a = d > 420 ? 0.5 : d > 260 ? 0.5 + (420 - d) / 160 * 0.5 : 1; }
      const hv = CAMP.hover; if (hv && hv.kind === o.kind && hv.id === o.id) a = 1;
    } catch (e) {}
    if (a >= 1) return f(o);
    ctx.save(); ctx.globalAlpha *= a; try { return f(o); } finally { ctx.restore(); }
  };
}
})();

/* ============================================================================
   INDEX 84c - FIXES FROM audits/graphics-r2.md
   GFX2-R1  Brace line against walls: the arc picks the first of eight centre
            angles whose slots are all free (the last choice is tried first, so
            it does not flip); Brace only falls back to the old ring if none is.
   GFX2-R2  mates overlapping while moving: two separation passes, 2px cap
            (edit to 84b's sepMates / updateMates wrapper, marked 84c).
   GFX2-R3  bar-fight mates far from the Leader: by design (they engage the nearest brawler); no change.
   R2-01    campLabel keeps the UX builder wording (Building the Tents / Dunstan
            . 1 season left . click for the site), drawn in the notched style.
   ROLLBACK delete from this comment to the end of the file.
============================================================================ */
(function(){
'use strict';
const blk = (x, y) => blockedXY(x, y) || blockedXY(x + 11, y) || blockedXY(x - 11, y) || blockedXY(x, y + 11) || blockedXY(x, y - 11);
const OFFS = [0, 0.785, -0.785, 1.571, -1.571, 2.356, -2.356, 3.142];
function braceAngle(L, fa, n){
  const B = G.br84 || (G.br84 = {t: -1, off: 0, key: ''}), key = n + ':' + Math.round(fa * 4) + ':' + (L.x / 20 | 0) + ':' + (L.y / 20 | 0);
  if (B.t === G.frame) return B.off;
  if (B.key === key && G.frame - B.t < 20) return B.off;   // keep the choice while nothing has changed
  const step = Math.min(22 / 34, 2.4 / Math.max(1, n - 1));
  const free = off => { for (let i = 0; i < n; i++){ const a = fa + off + (i - (n - 1) / 2) * step; if (blk(L.x + Math.cos(a) * 34, L.y + Math.sin(a) * 30)) return false; } return true; };
  let pick = null;
  if (free(B.off)) pick = B.off; else for (const o of OFFS) if (free(o)){ pick = o; break; }
  B.off = pick === null ? B.off : pick; B.none = pick === null; B.t = G.frame; B.key = key;
  return B.off;
}
{ const f = slotTarget;
  slotTarget = function(i, n, shieldWall){
    if (!shieldWall || (typeof isBrawl === 'function' && isBrawl())) return f(i, n, shieldWall);   // the bar fight keeps its own engage-the-nearest slots
    try {
      const L = G.leader, fa = (typeof G.facing === 'number') ? G.facing : 0, off = braceAngle(L, fa, n);
      if (G.br84.none) return f(i, n, shieldWall);                    // walled in on every side: the old full ring
      const step = Math.min(22 / 34, 2.4 / Math.max(1, n - 1)), a = fa + off + (i - (n - 1) / 2) * step;
      return {x: L.x + Math.cos(a) * 34, y: L.y + Math.sin(a) * 30};
    } catch (e) { return f(i, n, shieldWall); }
  };
}

/* ---- R2-01: the label, with the UX builder wording ---------------------------------------- */
{ const draw = campLabel;      // the 84b notched label
  campLabel = function(x, y, title, sub){
    if (typeof sub === 'string'){
      const m = sub.match(/^Builder: (.+?)(?:, (.+) left)?$/);
      if (m){ const site = m[1], left = m[2];
        return draw.call(this, x, y, site === 'a new building' ? 'Building something new' : 'Building the ' + site, `${title}${left ? ' \u00b7 ' + left + ' left' : ''} \u00b7 click for the site`); }
      if (sub === 'Resting') return draw.call(this, x, y, title, 'Resting \u00b7 sits out the next contract');
    }
    return draw.apply(this, arguments);
  };
}

/* GFX2-R3: nothing to fix. In the bar fight the squad deliberately walks to the nearest brawler
   (Index 72 slotTarget / updateMates wrappers), so mates 100-200px from the Leader are by design. */
})();

/* ============================================================================
   INDEX 84d - BUNDLE D (audits/graphics-r2.md GFX2-N1 to N5)
   N1  world overlays scale with the window: gfxK() = clamp(VH/760, 1, 1.35). The
       floating combat text (one marked patch in draw()), squad bars, camp
       bubbles and camp labels use it. It is the window factor only: the Index 79
       text-size setting already scales canvas fonts (fixFont), so it is not
       applied a second time.
   N2  plot signs per holding: the barge gets bollards and a rope with a hanging
       tag, the warehouse a chalk rectangle with a crate stencil; the fort and
       the waystation keep the 3D sign and stakes.
   N3  camp wanderers keep out of the campfire, the bench logs and the wagon.
   N4  dust ring on Shield Bash and when a unit is thrown from its horse.
   N5  Settings: a hint after "Hit-stop" and a "Knock-back on hits" checkbox
       (default on; saves without the key count as on).
   ROLLBACK  Delete from this comment to the end of the file; undo the "84d"
             marked edits (hurtEnemy condition, pop spacing, bubble call) and the
             Index 84d font patch in draw().
============================================================================ */
(function(){
'use strict';
window.gfxK = () => Math.min(1.35, Math.max(1, (typeof CAMZ !== 'undefined' && CAMZ.on && SCRN.h ? SCRN.h : VH) / 760));   /* A2: the screen's height, not the zoomed world's */

/* ---- N1 ------------------------------------------------------------------------------------ */
window.gfxMateBar = function(m){
  const n = m.maxCon, fr = Math.max(0, m.con) / n, col = fr > 0.6 ? '#6fd37a' : fr > 0.3 ? '#e0c050' : '#e0604a', k = gfxK();
  ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y + 21)); ctx.scale(k, k);
  if (n > 8){
    const w = 40, x0 = -20;
    ctx.fillStyle = 'rgba(8,6,4,.8)'; ctx.fillRect(x0 - 1, -1, w + 2, 6); ctx.fillStyle = col; ctx.fillRect(x0, 0, Math.round(w * fr), 4);
  } else {
    const w = n * 5 - 1, x0 = -Math.round(w / 2);
    ctx.fillStyle = 'rgba(8,6,4,.8)'; ctx.fillRect(x0 - 2, -2, w + 4, 8);
    for (let i = 0; i < n; i++){ ctx.fillStyle = i < m.con ? col : 'rgba(255,255,255,.14)'; ctx.fillRect(x0 + i * 5, 0, 4, 4); }
  }
  ctx.restore();
};
{ const f = campLabel;
  campLabel = function(x, y, title, sub){
    const k = gfxK(); if (k < 1.01) return f.apply(this, arguments);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    try { return f.call(this, 0, 0, title, sub); } finally { ctx.restore(); }
  };
}

/* ---- N5 ------------------------------------------------------------------------------------ */
{ const f = settingsHTML;
  settingsHTML = function(dark){
    let h = f(dark); const s = settings();
    try {
      if (h.indexOf('Knock-back') < 0){
        const at = h.indexOf('Hit-stop</label>');
        const add = ` <span style="font-size:14px;opacity:.75">(freezes the action 1-2 frames on big hits)</span>\n    <label title="Struck enemies are shoved a few pixels back"><input type="checkbox" ${s.knockback !== false ? 'checked' : ''} onchange="setSetting('knockback', this.checked)"> Knock-back on hits</label>`;
        if (at >= 0) h = h.slice(0, at + 16) + add + h.slice(at + 16);
        else { const sk = h.indexOf('Screen shake</label>'); if (sk >= 0) h = h.slice(0, sk + 20) + add + h.slice(sk + 20); }
      }
    } catch (e) {}
    return h;
  };
}

/* ---- N2: plot signs for the barge and the warehouse ------------------------------------------ */
function plotFade(o){
  let a = 1;
  try {
    const Lq = CAMP.people.find(q => q.kind === 'leader');
    if (Lq && CAMP.ctrl){ const d = Math.hypot(Lq.x - o.x, Lq.y - o.y); a = d > 420 ? 0.5 : d > 260 ? 0.5 + (420 - d) / 160 * 0.5 : 1; }
    const hv = CAMP.hover; if (hv && hv.kind === o.kind && hv.id === o.id) a = 1;
  } catch (e) {}
  return a;
}
function bargePlot(x, y){
  x = Math.round(x); y = Math.round(y);
  for (const s of [-32, 32]){
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + s - 6, y - 1, 14, 3);
    ctx.fillStyle = '#5a3a1c'; ctx.fillRect(x + s - 4, y - 14, 8, 14); ctx.fillStyle = '#8a5a2c'; ctx.fillRect(x + s - 4, y - 14, 2, 14);
    ctx.fillStyle = '#2e1c0e'; ctx.fillRect(x + s - 5, y - 17, 10, 3); ctx.fillRect(x + s + 3, y - 14, 1, 14);
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6a5530'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x - 32, y - 15); ctx.quadraticCurveTo(x, y + 2, x + 32, y - 15); ctx.stroke();
  ctx.strokeStyle = '#d3bc86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 32, y - 15); ctx.quadraticCurveTo(x, y + 2, x + 32, y - 15); ctx.stroke();
  ctx.fillStyle = '#2e1c0e'; ctx.fillRect(x - 11, y - 9, 22, 13); ctx.fillStyle = '#dcc58e'; ctx.fillRect(x - 10, y - 8, 20, 11); ctx.fillStyle = '#f0e0b0'; ctx.fillRect(x - 10, y - 8, 20, 1);
  ctx.fillStyle = '#3a2c1a'; ctx.fillRect(x - 7, y - 5, 14, 1); ctx.fillRect(x - 7, y - 2, 10, 1); ctx.fillRect(x - 1, y - 11, 2, 3);
}
function warePlot(x, y){
  x = Math.round(x); y = Math.round(y);
  ctx.strokeStyle = 'rgba(240,236,220,.85)'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]); ctx.strokeRect(x - 38, y - 20, 76, 30); ctx.setLineDash([]);
  ctx.lineWidth = 3; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[-38, -20, 1, 1], [38, -20, -1, 1], [-38, 10, 1, -1], [38, 10, -1, -1]]){ ctx.moveTo(x + cx + sx * 9, y + cy); ctx.lineTo(x + cx, y + cy); ctx.lineTo(x + cx, y + cy + sy * 9); }
  ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeRect(x - 10, y - 16, 20, 17); ctx.beginPath(); ctx.moveTo(x - 10, y - 16); ctx.lineTo(x + 10, y - 1); ctx.moveTo(x + 10, y - 16); ctx.lineTo(x - 10, y - 1); ctx.stroke();   // a crate stencil
}
{ const f = w3dPlot;
  w3dPlot = function(o){
    const hk = holdKey(); if (hk !== 'barge' && hk !== 'warehouse') return f(o);
    ctx.save(); ctx.globalAlpha *= plotFade(o);
    try { (hk === 'barge' ? bargePlot : warePlot)(o.x, o.y + 2); } finally { ctx.restore(); }
    return true;
  };
}

/* ---- N3: wanderers keep clear of the fire, the bench logs and the wagon ------------------------ */
const FURN = {key: '', list: []};
function furniture(){
  const fx = HUB.fire.x, fy = HUB.fire.y, key = fx + ',' + fy + ',' + HUB.wagon.x + ',' + HUB.wagon.y;
  if (FURN.key !== key){
    FURN.key = key; const E = [[fx, fy + 4, 22, 13], [HUB.wagon.x, HUB.wagon.y + 2, 40, 17]];
    if (typeof BENCH_LOGS !== 'undefined') for (const L of BENCH_LOGS) E.push([fx + L[0] + L[2] / 2, fy + L[1] + 8, L[2] / 2 + 6, 11]);
    FURN.list = E;
  }
  return FURN.list;
}
{ const f = separatePeople;
  separatePeople = function(Lq){
    f(Lq);
    try {
      const E = furniture();   /* Index 84e (R3-05): every holding draws the fire, the logs and the wagon, so every holding keeps clear of them */
      for (const q of CAMP.people){
        if (q === Lq || q.kind === 'bard' || q.role !== 'wander') continue;
        for (const e of E){
          let dx = q.x - e[0], dy = q.y - e[1], nd = Math.hypot(dx / e[2], dy / e[3]);
          if (nd < 1){
            if (nd < 0.01){ dx = 1; dy = 0.2; nd = Math.hypot(dx / e[2], dy / e[3]); }
            const g = 1.05 / nd - 1, mx = dx * g, my = dy * g, len = Math.hypot(mx, my) || 1, sc = Math.min(1, 2 / len);
            q.x += mx * sc; q.y += my * sc;
          }
          const tx = q.tx - e[0], ty = q.ty - e[1], tn = Math.hypot(tx / e[2], ty / e[3]);
          if (tn < 1.05 && tn > 0.001){ const g = 1.2 / tn; q.tx = e[0] + tx * g; q.ty = e[1] + ty * g; }
        }
      }
    } catch (err) {}
  };
}

/* ---- N4: dust on Shield Bash and when a unit is thrown ----------------------------------------- */
function dustRing(x, y, n, r){
  if (!G) return;
  const s = seasonOf(), c = s === 'winter' ? '#dfe6e6' : (SEASONS_CFG[s] || SEASONS_CFG.summer).dust2;
  for (let i = 0; i < n; i++){ const a = i / n * TAU; G.fx.push({x: x + Math.cos(a) * r * 0.4, y: y + Math.sin(a) * r * 0.15, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.35 - 0.1, life: 22, c, px: 2 + (i % 2)}); }
}
{ const f = pop;
  pop = function(x, y, text, c){
    f(x, y, text, c);
    try { if (text === 'SHIELD BASH') dustRing(x, y + 47, 10, 26); else if (text === 'THROWN') dustRing(x, y + 37, 6, 14); } catch (e) {}
  };
}
})();

/* ===== INDEX 92 - T-01 art polish: faces, standing bard, spectators, KO bodies (Art & Interface Lead) =====
   All wrappers, installed on window load because tavern.js and crepitus.js load after this file.
     1. Crepitus / hub patrons get a face (race, spec, sex, id) so portraitURL works for them.
     2. The hub bard is the standing, lute-across-the-chest sprite (calm frames only) instead of the seated one.
     3. Bar-fight ring spectators: real person sprites (hair, hats, colours, a mug), cheering shuffle.
     4. KO bodies: the sprite lying down with orbiting stars and zzz.
   ROLLBACK: delete from this comment to END INDEX 92.
============================================================================ */
/* PL-1.1 step 1: any flat humanoid look becomes a 3D "enemy-kit" person. l3dLook registers the look under a kind key so r3dEnemyRecipe builds it. */
function l3dLook(key, p, look, armour){
  if (!ENEMY_LOOK[key]){ ENEMY_LOOK[key] = Object.assign({}, look, {sex:sexOf(p), cape:null}); if (armour) ENEMY_ARMOUR[key] = armour; }
  return key;
}
if (typeof auxSprite === 'function'){ const f = auxSprite;
  auxSprite = function(type, i){
    const spr = f(type, i);
    try { if (!spr.e3d){ const A = AUX[type], p = {race:A.look.race, spec:'PLAIN', name:'aux' + type + i, id:'a' + i, sex:i % 2 ? 'f' : 'm'};
      spr.e3d = l3dLook('aux_' + type + (i % 4), p, Object.assign(personLook(p, false), A.look), A.look.armour === 'quilt' ? 'quilt' : A.look.armour === 'chain' ? 'chain' : null); } } catch (e) { console.warn('aux 3D', e); }
    return spr;
  };
}
(function(){
  'use strict';
  const FEM = new Set(['Maud', 'Maud the Drover', 'Sister Wren', 'Little Ket']);
  const PATRON_RACE = ['HUMAN', 'HUMAN', 'DWARF', 'HUMAN', 'HUMAN', 'DWARF'];
  const face = (p, i) => { if (p && p.npc && !p.race){ p.race = PATRON_RACE[i % 6]; p.spec = 'PLAIN'; p.cls = 'FREEMAN'; p.sex = FEM.has(p.name) ? 'f' : 'm'; } return p; };
  const TOPS = ['#7a4a3a', '#4a5a7a', '#6a6a3a', '#5a3a6a', '#3a6a5a', '#8a6a3a', '#7a3a3a', '#5a5a5a'];
  const HATS = [null, 'tricorn', null, 'hood', null, null];
  // a stable villager sprite for one ring spectator
  function figure(r, i){
    if (r.fig) return r.fig;
    if (typeof PATRON_ART !== 'undefined' && !r.mate){ const ps = PATRON_ART.sprite(r.name, i); if (ps) return r.fig = ps; }   // C-01 return 03 (inert without js/art/patrons.js)
    const p = r.mate || {name:r.name, id:'sp' + i, race:PATRON_RACE[i % 6], spec:'PLAIN', sex:FEM.has(r.name) ? 'f' : 'm'};
    if (r.mate) return r.fig = personSprite(p, false);
    const look = personLook(p, false), h = hash(r.name + i), top = TOPS[h % TOPS.length];
    Object.assign(look, {top, legs:shade(top, .55), head:HATS[h % HATS.length] || look.head});
    if (look.head === 'hood'){ look.hood = shade(top, .7); look.acc = look.hood; }
    return r.fig = humanoidSprite('spec:' + r.name + ':' + i + ':' + top, look);
  }
  // PL-1.1 step 1: the 3D body of a spectator (named patrons included, until they get their own recipes): a villager look, 3D by look kind
  function figure3(r, i){
    if (r.fig3) return r.fig3;
    if (r.mate){ const m = figure(r, i); return r.fig3 = r3dTagged(m) ? m : null; }
    const p = {name:r.name, id:'sp' + i, race:PATRON_RACE[i % 6], spec:'PLAIN', sex:FEM.has(r.name) ? 'f' : 'm'};
    const look = personLook(p, false), h = hash(r.name + i), top = TOPS[h % TOPS.length];
    Object.assign(look, {top, legs:shade(top, .55), head:HATS[h % HATS.length] || look.head});
    if (look.head === 'hood'){ look.hood = shade(top, .7); look.acc = look.hood; }
    const spr = humanoidSprite('sp3:' + r.name + ':' + i + ':' + top, look);
    spr.e3d = l3dLook('sp_' + r.name + '_' + i, p, look);
    return r.fig3 = spr;
  }
  // PL-1.1: KO body in 3D, on a stub record kept on the ring entry (slot 1)
  function koBody3(r, spr, x, y, s){
    if (!spr || !r3dTagged(spr)) return false;
    try {
      const rec = r3dRecipeForSprite(spr); if (!rec) return false;
      const a = r._stub3 || (r._stub3 = []), u = a[1] || (a[1] = {kind:'stub', x, y, left:false, anim:{left:false}});
      u.x = x; u.y = y; if (spr.e3d) u.e3d = true;
      return !!r3dDraw(rec, u, x, y - 4 * s, s, {clip:'downed', i:Math.floor(G.frame / 40) % 2, dir:2, shadow:false, async:true});
    } catch (e) { return false; }
  }
  function drawSpectator(r, i, B){
    const t = G.frame, ko = r.st === 'ko', x = r.x, y = r.y, flat = figure(r, i), s = 2.1;
    let spr3 = null; try { spr3 = figure3(r, i); } catch (e) { console.warn('spectator 3D', e); }
    const spr = spr3 || flat;
    ctx.save();
    if (ko){
      shadow(x, y + 10, 26);
      if (!(spr3 && koBody3(r, spr3, x, y, s))){
      figPlaceholder(x, y - 2 * s, s, {down:true, shadow:false}); } /* S6-C note 10: non-pixel stand-in */
      // stars orbiting the head, then the zzz
      const hx = x - 22, hy = y - 4;
      for (let k = 0; k < 3; k++){ const a = t / 14 + k * 2.1; ctx.fillStyle = k % 2 ? '#ffe070' : '#fff6c0';
        const sx = hx + Math.cos(a) * 12, sy = hy - 12 + Math.sin(a) * 4; ctx.fillRect(sx - 1.5, sy - 4, 3, 8); ctx.fillRect(sx - 4, sy - 1.5, 8, 3); }
      ctx.textAlign = 'center'; ctx.fillStyle = '#e8f0ff';
      for (let k = 0; k < 3; k++){ const ph = ((t / 40 + k / 3) % 1); ctx.globalAlpha = 1 - ph; ctx.font = 'bold ' + (10 + k * 3) + 'px Georgia'; ctx.fillText('z', x + k * 8 + ph * 6, y - 22 - ph * 26); }
      ctx.globalAlpha = 1;
    } else {
      const cheer = r.talkT > 0, hop = cheer ? Math.abs(Math.sin(t / 5 + r.ph)) * 5 : Math.sin(t / 22 + r.ph) * 0.8;
      const left = x > 13 * CELL, frame = spr.pat ? PATRON_ART.frameFor(r, i, t) : (cheer ? 1 + ((t / 8 + i) | 0) % 2 : 0);
      if (spr3) drawStub(r, 0, spr3, x, y - hop, s, cheer ? 1 + ((t / 8 + i) | 0) % 2 : 0, left, false);   /* PL-1.1: 3D spectator (own shadow) */
      else figPlaceholder(x, y - hop, s, figSize(spr)); /* S6-C note 10: non-pixel stand-in */
      // a mug, raised when they cheer
      const mx = x + (left ? -11 : 11), my = y + 2 - hop - (cheer ? 12 : 0);
      ctx.fillStyle = '#7a5a2a'; ctx.fillRect(mx - 3, my, 6, 7); ctx.fillStyle = '#f4ecd0'; ctx.fillRect(mx - 3, my - 2, 6, 2); ctx.fillStyle = '#3a2410'; ctx.fillRect(mx + (left ? -5 : 3), my + 1, 2, 4);
      if (r.talkT > 0){ const w = Math.min(190, 12 + r.talk.length * 5.2), by = y - 64 - hop;
        ctx.font = '11px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,248,224,.95)'; ctx.fillRect(x - w / 2, by, w, 18);
        ctx.strokeStyle = '#4a3b2a'; ctx.strokeRect(x - w / 2, by, w, 18); ctx.fillStyle = '#2a1a0c'; ctx.fillText(r.talk, x, by + 13, w - 6); }
    }
    ctx.restore();
  }

  function install(){
    // 1. patrons get faces
    try { const T = window.TAVERN; if (T && T.seats){ const f = T.seats; T.seats = function(){ const o = f.apply(this, arguments); (o.crep || []).forEach((p, i) => face(p, i)); return o; }; } } catch (e) { console.warn('art92 seats', e); }
    try { const C = window.CREPITUS; if (C && C.open){ const f = C.open; C.open = function(seats){ if (Array.isArray(seats)) seats.forEach((p, i) => face(p, i)); return f.apply(this, arguments); }; } } catch (e) { console.warn('art92 crep', e); }
    // 2. the standing bard in the hub (the hub is open, so the camp behind it is hidden)
    try { if (typeof bardSprite === 'function' && typeof danceBardSprite === 'function'){ const f = bardSprite;
      bardSprite = function(p){ const hub = document.getElementById('tavern-hub');
        if (hub && !hub.classList.contains('hidden')){ const d = danceBardSprite(p); if (!d.calm) d.calm = {frames:[], ax:d.ax, ay:d.ay, w:d.w, h:d.h}; return d.calm; }
        return f.apply(this, arguments); }; } } catch (e) { console.warn('art92 bard', e); }
    // 3 + 4. spectators and KO bodies replace the placeholder rectangles tavern.js pushes (they are its last N bodies)
    try { if (typeof brawlBodies === 'function'){ const f = brawlBodies;
      brawlBodies = function(bodies, onScreen){
        const n0 = bodies.length; f.call(this, bodies, onScreen);
        const B = G.brawl; if (!B || !B.ring) return;
        const live = B.ring.map((r, i) => [r, i]).filter(([r]) => r.st !== 'out');
        if (bodies.length - n0 < live.length) return;                       // tavern.js did not add them: leave alone
        const tail = bodies.splice(bodies.length - live.length, live.length);
        live.forEach(([r, i], k) => bodies.push({y:tail[k].y, custom:() => { try { drawSpectator(r, i, B); } catch (e) { tail[k].custom(); } }}));
      }; } } catch (e) { console.warn('art92 ring', e); }
  }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();
/* ===== END INDEX 92 ======================================================= */

/* ===== INDEX 95: arrows and bolts that hit stay stuck (PL-1.3) ================
   A shot that ends (hit, wall, or out of range) leaves an arrow in the body or the ground for STUCK_SECS, then fades.
   Stuck arrows ride their host and vanish if it dies or despawns. Drawn with a 3D model (kind m_arrow), flat sprite as fallback.
   Hooks in index.html (one line each): drawing, after the G.shots / G.eshots loops (STUCK.draw) and the flying arrow (STUCK.fly).
   ROLLBACK: delete this block and the two STUCK hooks. */
(function(){
  const STUCK_SECS = 5, FADE_SECS = 1, STUCK_MAX = 48;
  const ARROW_SCALE = 0.62;   /* the model is built big enough for the 3D renderer; this brings it to the old 20 px arrow */
  const list = () => { if (!G) return null; if (!G.stuck) G.stuck = []; return G.stuck; };
  function addKind(){
    if (typeof W3D_KINDS === 'undefined' || W3D_KINDS.m_arrow || typeof MPK !== 'function' || typeof SKZ !== 'function') return;
    W3D_KINDS.m_arrow = MPK([36, 16, 4], se => { const P = [], add = wAdd(P);
      add([{t:'cap', a:[-9, 5, 0], p:[9, 5, 0], r:0.7, z:'shaft'}, {t:'cap', a:[9, 5, 0], p:[12.5, 5, 0], r:1.25, z:'head'},
        {t:'box', c:[-8, 5, 0], r:[2.2, 1.6, 0.2], z:'fl'}]);
      return {parts:P, zones:SKZ(se, null, {shaft:'#c8a070', head:'#c0c8d0', fl:'#b4463a', nock:'#8a6a3a'}), keepZones:['shaft', 'head', 'fl']}; });
  }
  function blit3(x, y, ang, alpha, bolt){
    if (typeof w3dMapProp !== 'function' || !addKindOK()) return false;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
    if (bolt) ctx.filter = 'hue-rotate(160deg) saturate(2)';
    let ok = false; try { ok = w3dMapProp('m_arrow', 0, 5 * ARROW_SCALE, {scale:ARROW_SCALE}); } finally { ctx.restore(); }
    return ok;
  }
  const addKindOK = () => { addKind(); return typeof W3D_KINDS !== 'undefined' && !!W3D_KINDS.m_arrow; };
  function flat(x, y, ang, alpha, bolt){
    ctx.save(); ctx.globalAlpha *= alpha; PROPS3D.bolt({x, y}, ang, bolt); ctx.restore();   /* S6-C 3a: a drawn shaft, never the pixel arrow */
  }
  const gone = (q, units) => !q.host || q.host.dead || (q.bolt ? units.indexOf(q.host) < 0 : (G.enemies || []).indexOf(q.host) < 0);
  function stick(s, hosts, bolt){
    const L = list(); if (!L) return;
    let host = null, bd = 1e9;
    for (const h of hosts) { const d = Math.hypot(h.x - s.x, h.y - s.y - (bolt ? 6 : 0)); const reach = (h.r || 12) + 8; if (d < reach && d < bd) { bd = d; host = h; } }
    const ang = Math.atan2(s.vy, s.vx);
    /* sunk a little into whatever it hit: the arrow shows its tail */
    const rec = {x:s.x + Math.cos(ang) * 4, y:s.y + Math.sin(ang) * 4, ang, life:STUCK_SECS * 60, bolt, host, ox:0, oy:0};
    if (host) { rec.ox = rec.x - host.x; rec.oy = rec.y - host.y; }
    L.push(rec); if (L.length > STUCK_MAX) L.shift();
  }
  function wrapStep(name, getShots, hostsOf, bolt){
    const f = window[name]; if (typeof f !== 'function' || f.stk) return;
    const w = function(){
      let before = null;
      try { const S = getShots(); if (S) before = S.filter(s => s.life >= 1 && (bolt ? s.kind === 'bolt' : s.kind === 'arrow')).map(s => [s, s.x, s.y]); } catch (e) {}
      const r = f.apply(this, arguments);
      try {
        if (before && G) { const hosts = hostsOf(); for (const [s] of before) if (s.life <= 0) stick(s, hosts, bolt);
          if (!bolt) { const L = list(), units = typeof squadUnits === 'function' ? squadUnits() : [];   /* ageing runs once per frame, in the player-shot step */
            if (L) for (let i = L.length - 1; i >= 0; i--) { const q = L[i]; q.life--; if (q.life <= 0 || (q.host && gone(q, units))) L.splice(i, 1); } } }
      } catch (e) { console.warn('stuck', e); }
      return r;
    };
    w.stk = 1; window[name] = w;
  }
  window.STUCK = {
    SECS:STUCK_SECS,
    draw(){
      const L = G && G.stuck; if (!L || !L.length) return;
      for (const q of L) {
        const a = Math.min(1, q.life / (FADE_SECS * 60));
        const x = q.host ? q.host.x + q.ox : q.x, y = q.host ? q.host.y + q.oy : q.y;
        if (!blit3(x, y, q.ang, a, q.bolt)) flat(x, y, q.ang, a, q.bolt);
      }
    },
    fly(s, a){ return blit3(s.x, s.y, a, 1, false); },
    flyBolt(s, a, bolt){ return blit3(s.x, s.y, a, 1, !!bolt); }   /* S6-C 3a: PROPS3D.bolt flies arrows and enemy bolts on the 3D arrow */
  };
  function install(){
    try {
      /* player arrows end in updateShots; enemy bolts in updateEnemyShots (their targets are the squad units) */
      wrapStep('updateShots', () => G && G.shots, () => G.enemies || [], false);
      wrapStep('updateEnemyShots', () => G && G.eshots, () => (typeof squadUnits === 'function' ? squadUnits() : []), true);
    } catch (e) { console.warn('art95', e); }
  }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();
/* ===== END INDEX 95 ======================================================= */

/* ---- F-44 (n), Patrick's playtest 2 (audits/f44-playtest2.md, 12.png, 13.png): the company camp's winter puddles were drawn by
   drawSeasonOverlay, after the whole camp, so frozen puddles sat on roofs, tents, the trench and in front of people. They are ground:
   they now draw in the ground pass, straight after the roads (drawCampRoads, wrapped at load so VO3's fort roads are under it), and buildings, tents and figures cover them. The
   overlay skips that set while this is on. Only the fort holding draws them there (the painted story camps bake their own).
   INT-1 group 12: no switch. ---- */
window.PUD44 = {ground: 0};
(function(){
  const fortSet = list => { try { return list === SEASON_FX.puddles && typeof holding === 'function' && holding() === 'fort'; } catch (e) { return false; } };
  let inGround = false;
  { const f = drawPuddleList;
    drawPuddleList = function(list){ if (!inGround && fortSet(list)) return; return f.apply(this, arguments); }; }
  function install(){ if (drawCampRoads.__pud44) return; const f = drawCampRoads;   // at load, outermost: VO3 replaces the fort's roads without calling on
    drawCampRoads = function(){
      const r = f.apply(this, arguments);
      try {
        if (SEASON_FX.puddles.length && fortSet(SEASON_FX.puddles) && currentSeason() === 'winter' && (typeof seasonFxOn !== 'function' || seasonFxOn())
            && !(window.VO2 && VO2.paintedCamp && VO2.paintedCamp())){
          inGround = true; try { drawPuddleList(SEASON_FX.puddles, Math.round(CAMP.cam.x), Math.round(CAMP.cam.y)); PUD44.ground++; } finally { inGround = false; } }
      } catch (e) {}
      return r;
    }; drawCampRoads.__pud44 = true; if (f.__vo3) drawCampRoads.__vo3 = true; }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();

/* ---- F-44 (o), Patrick's playtest 2: empty plots (the worn oval, the stakes and the sign) were y-sorted at their centre, but they
   reach about 14 px below it, so a Leader standing on the upper half was drawn first and the plot over his legs: he slid under it,
   and the faded plot read as floating. A plot is ground: it now draws in the ground pass, after the roads and puddles, and every
   figure, building and tree stands on it. Its hover label is drawn after the camp so nothing covers it. The y-sort is told to skip
   plots by a one-shot flag: the ground pass sets it and the next campObjects() call (the y-sort list, in the same drawCamp) takes it.
   INT-1 group 12: no switch. ---- */
window.PLOT44 = {ground: 0};
(function(){
  let skip = false, hotPlot = null;
  { const f = campObjects;
    campObjects = function(){ const r = f.apply(this, arguments); if (!skip) return r; skip = false; return r.filter(o => !o || o.kind !== 'plot'); }; }
  function drawPlots(){
    hotPlot = null; const hv = CAMP.hover, cx = CAMP.cam.x, cy = CAMP.cam.y, vw = typeof VW === 'number' ? VW : 2000, vh = typeof VH === 'number' ? VH : 1200;
    for (const o of campObjects()){
      if (!o || o.kind !== 'plot' || o.x < cx - 120 || o.x > cx + vw + 120 || o.y < cy - 60 || o.y > cy + vh + 120) continue;
      const hot = hv && hv.kind === o.kind && hv.id === o.id; if (hot) hotPlot = o;
      ctx.save();
      try { ctx.fillStyle = hot ? 'rgba(150,120,70,.55)' : 'rgba(110,88,52,.4)'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 10, 54, 24, 0, 0, TAU); ctx.fill();
        if (!(typeof w3dPlot === 'function' && w3dPlot(o))) PROPS3D.campPlot(o); }
      catch (e) {} finally { ctx.restore(); }
    }
    PLOT44.ground++;
  }
  function install(){ if (drawCampRoads.__plot44) return; const f = drawCampRoads;
    drawCampRoads = function(){
      const r = f.apply(this, arguments);
      try { if (!G && typeof CAMP !== 'undefined' && CAMP.on){ drawPlots(); skip = true; } } catch (e) { skip = false; }
      return r;
    }; drawCampRoads.__plot44 = true; for (const k of ['__vo3', '__pud44']) if (f[k]) drawCampRoads[k] = true;
    const g = drawCamp;
    drawCamp = function(){
      try { return g.apply(this, arguments); }
      finally { skip = false;
        if (hotPlot){ const o = hotPlot; hotPlot = null; ctx.save();
          try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-Math.round(CAMP.cam.x), -Math.round(CAMP.cam.y));
            campLabel(o.x, o.y - 70, typeof plotLabel === 'function' ? plotLabel(o)[0] : facility(o.id).name, typeof plotLabel === 'function' ? plotLabel(o)[1] : `Plot: ${facCost(facility(o.id))}gp`); }
          catch (e) {} finally { ctx.restore(); } } }
    };
  }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();

/* ---- F-44 (e) (QA audits/f44-playtest2.md row e, Relic Recovery: "walked into the fog, it did not reveal, the squad died unseen").
   Not reproduced; screenshot 8 shows the whole view dimmed with no sight hole anywhere, so the field fog was being cut round
   vision sources that were not where the squad was. Three guards, all cheap: the vision list is cached per frame only while the
   Leader has not moved (a stalled G.frame kept an old list); a vision radius that is not a positive number falls back to 360; and
   every fog draw reveals the ground round each live source if the cell it stands on is still black (so the reveal never depends
   on which update path ran). FOG44.fixes counts the times a guard did something. INT-1 group 12: no switch. ---- */
window.FOG44 = {fixes: 0, n: 0, heal: 60};
/* (e, QA follow-up: 8.png shows a hard-edged black block over seen ground) the never-seen layer (fogBlack, blurred by GFX-04, folded
   into the dim layer by VO2.fogFold) is rebuilt only when a reveal marks it dirty; it is now also rebuilt every FOG44.heal draws, so a
   stale black layer heals within a second whatever left it stale. Cost: one map-sized (1 px a cell) redraw and blur a second. */
(function(){
  if (typeof visSources !== 'function' || typeof visionR !== 'function') return;
  { const f = visSources;
    visSources = function(){
      if (G && G.leader && G.visS && G.visT === G.frame && (G.visLx !== G.leader.x || G.visLy !== G.leader.y || G.visS[0] && (G.visS[0].x !== G.leader.x || G.visS[0].y !== G.leader.y))){ G.visT = -1; }
      const S = f.apply(this, arguments); if (G && G.leader){ G.visLx = G.leader.x; G.visLy = G.leader.y; } return S;
    }; }
  function install(){
    if (!visionR.__fog44){ const f = visionR;   // at load: js/ui/polish.js replaces visionR outright
      visionR = function(){ const r = f.apply(this, arguments); if (!(r > 0 && isFinite(r))){ FOG44.fixes++; return 360; } return r; }; visionR.__fog44 = true; }
    if (typeof drawFieldFog !== 'function' || drawFieldFog.__fog44) return;
    const f = drawFieldFog;
    drawFieldFog = function(cx, cy){
      try {
        if (typeof rtsFogOn === 'function' && rtsFogOn() && MAP && MAP.seen && G && G.leader && !G.over){
          if (FOG44.heal > 0 && ++FOG44.n % FOG44.heal === 0 && typeof FOGK !== 'undefined') FOGK.dirty = true;
          const S = visSources();
          for (let i = 0; i < S.length; i++){ const s = S[i]; if (!s || !isFinite(s.x) || !isFinite(s.y)) continue;
            const gx = Math.floor(s.x / CELL), gy = Math.floor(s.y / CELL); if (!inMap(gx, gy) || MAP.seen[gy * MAP.w + gx]) continue;
            revealAround(s.x, s.y, Math.max(1, Math.ceil((i ? s.r : visionR()) / CELL))); FOG44.fixes++; }
        }
      } catch (e) {}
      return f.apply(this, arguments);
    };
    drawFieldFog.__fog44 = true;
  }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();

/* ---------------------------------------------------------------------------
   SCN48 (F-48 B1, UX review): the fort camp filled with trees after a few contracts.
   Cause: VO-3 scales the fort and plants its own tree border only when no contract
   is open (VO3.hubFort needs G to be null). When the scenery was rebuilt while a
   contract was still open (a season change, a skin or layout call on the way back),
   the base planter ran on the scaled field with its unscaled clearing: 1492 trees
   in place of 357, many inside the clearing. Fix: the scenery is always planted
   as the hub's. Installed at window load so it sits outside VO-3's wrapper.
   INT-1 group 12: no switch.
--------------------------------------------------------------------------- */
(function(){
  const S = window.SCN48 = {fixes: 0};
  function install(){
    if (typeof campScenery !== 'function' || campScenery.__scn48) return;
    const f = campScenery;
    campScenery = function(){
      if (typeof G === 'undefined' || !G || typeof CAMP === 'undefined' || !CAMP || CAMP.trees) return f.apply(this, arguments);
      const g = G; G = null;                       // plant as the hub does, whatever is open
      try { S.fixes++; return f.apply(this, arguments); } finally { G = g; }
    };
    campScenery.__scn48 = true;
  }
  S.selfTest = function(){
    const rows = [], ok = (n, c) => rows.push((c ? 'PASS ' : 'FAIL ') + n);
    if (typeof CAMP === 'undefined' || !CAMP || !CAMP.on){ return {pass:0, fail:0, rows:['SKIP not in camp']}; }
    const g0 = G, t0 = CAMP.trees, d0 = CAMP.decor;
    try {
      G = null; CAMP.trees = null; campScenery(); const hub = CAMP.trees.length;
      G = {}; CAMP.trees = null; campScenery(); ok('scenery planted during a contract matches the hub (' + hub + ')', CAMP.trees.length === hub);
      ok('the open contract is put back', G && G !== null && Object.keys(G).length === 0);
    } finally { G = g0; CAMP.trees = t0; CAMP.decor = d0; if (window.VO3) VO3.layers = null; }
    const fail = rows.filter(r => r.startsWith('FAIL')).length;
    return {pass: rows.length - fail, fail, rows};
  };
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();

/* ---- F-48 Art: encounter pop-up buttons in the game's wood style. INT-1 stage 3: no switch. ---- */
(function(){
  const B = window.EV48BTN = window.EV48BTN || {};
  const CSS = '#ev39-card button[data-ev39]{background:#4a3b2a;border:3px solid #2a2520;color:#f0e6d2;font:bold 15px Georgia,serif;padding:8px 20px!important;margin:4px;border-radius:4px;cursor:pointer;letter-spacing:.5px;text-shadow:0 2px 0 #000;box-shadow:inset 0 2px 0 rgba(255,220,160,.25),inset 0 -3px 0 rgba(0,0,0,.35),0 4px 0 #160c04,0 6px 12px rgba(0,0,0,.4);transition:transform .15s,background .15s}'
    + '#ev39-card button[data-ev39="accept"]{background:#7a5a14;border-color:#3a2a05}'
    + '#ev39-card button[data-ev39]:hover{background:#5d4e3e;transform:scale(1.04)}'
    + '#ev39-card button[data-ev39="accept"]:hover{background:#94701c}'
    + '#ev39-card button[data-ev39]:active{transform:translateY(2px);box-shadow:inset 0 2px 0 rgba(255,220,160,.2),inset 0 -2px 0 rgba(0,0,0,.35),0 2px 0 #160c04}'
    + '#ev39-card button[data-ev39]:focus-visible{outline:2px solid #e8c070;outline-offset:2px}';
  B.install = function(){
    if (document.getElementById('ev48-btn')) return;
    const st = document.createElement('style'); st.id = 'ev48-btn'; st.textContent = CSS; document.head.appendChild(st);
  };
  if (document.head) B.install(); else window.addEventListener('DOMContentLoaded', B.install);
})();

/* ---- F-48K Art: phone floors (K42 taps at least 40 px, K44 text at least 11 px), only below 500 px wide.
   INT-1 stage 3: no switch. TAP48.selfTest() checks the rules and the text pass. ---- */
(function(){
  const P = window.TAP48 = window.TAP48 || {};
  const MQ = '(max-width: 499px)';
  // K42: one 40 px floor for the small controls the UX pass measured (close x, small buttons, tabs, toggles, pills)
  const CSS = '@media ' + MQ + '{'
    + '.x{min-width:40px!important;min-height:40px!important}'
    + 'button.btn,.btn.small,.mc-exp,.tbtn,.qpill,.folio-tabs button,.c25-tabs button,.ux-tabs button,.dseg button,select,button.dsel,input.mansearch{min-height:40px!important}'
    + '.mini button,#m32 .btn.small{min-width:40px!important}'
    + 'input[type=checkbox]{width:22px!important;height:22px!important}'
    + 'label:has(> input[type=checkbox]),label:has(> select),label:has(> input[type=range]){min-height:40px;display:inline-flex;align-items:center;gap:6px}'
    + 'input[type=range]{min-height:40px}'
    + '.gc-big{gap:8px!important}.hxs span{letter-spacing:0!important;text-align:center;line-height:1.1}'
    // K65 (UX 5eb7f8e): the banner step's 22 px swatches, glyph and division buttons, and Cayde's chair skip, to the same 40 px floor
    + 'button[data-bed]{min-width:40px!important;min-height:40px!important}.mini button{min-height:40px!important}.cg-skip{min-height:40px!important}'
    // K65: keyboard words on a phone. The camp hint (several writers set it) and the War Table map button show tap words instead
    + '#camp-hint{font-size:0!important}#camp-hint::after{content:"Tap buildings, plots and people.";font-size:13px}'
    + '.c31-map{font-size:0!important}.c31-map::after{content:"MAP OF ARCADIA";font-size:12px}'
    + '#screen-table .table-head{flex-wrap:wrap;row-gap:6px}'   // the War Table head ran 50 px past the right edge at 375
    // K66 (UX): the coin-stack prop (js/camp/camp.js, right 3%, top 80 px) sat over BACK TO THE CAMP once the head wrapped; the title wrapped a word a line
    + '#screen-table img.prop[style*="top:80px"]{display:none!important}#screen-table .table-head h1{font-size:24px!important;line-height:1.15}'
    // K68 (UX): the Rank'n board had fixed 62 px cells (512 px wide), so a phone cut off columns 6 to 8 and the side boxes grew to match; cells now fit the screen and the coins shrink with them
    + '#screen-rankn .rkwrap{padding:48px 12px 24px!important}#screen-rankn .rkhead h1{font-size:44px!important}'
    + '#screen-rankn .rkboard{--rkc:min(62px,calc((100vw - 48px) / 8));grid-template-columns:repeat(8,var(--rkc))!important;grid-template-rows:repeat(8,var(--rkc))!important;border-width:8px!important;justify-self:center}'
    + '#screen-rankn .rkc>img{width:80%!important;height:80%!important}#screen-rankn .rkgrid{grid-template-columns:minmax(0,1fr)!important}'
    // PROG-1 art pass: Train buttons at a building fill the panel like the Research and Works buttons
    + '#camp-panel .line[style*="flex-wrap"]>.mini[style*="column"]{flex:1 1 100%}#camp-panel .line[style*="flex-wrap"]>.mini[style*="column"]>button{width:100%}'
    // War Table loadout on a phone: the book line's no-wrap spans (study rank) pushed the table 63 px wide
    + '[data-book33] span[style*="white-space:nowrap"]{white-space:normal!important}'
    + '}';
  P.n = 0;
  // K44: text under 11 px is raised to 11 px. Done in script because many sizes come from inline styles and em
  // scales; it looks only at newly added parts of the page, and only on a phone-width screen.
  const big = e => { try { if (!e || e.nodeType !== 1 || e.closest('svg,canvas,#camp-hint,.c31-map')) return;   // those two show their words through ::after (K65)
      for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim().length > 1){
        if (parseFloat(getComputedStyle(e).fontSize) < 11){ e.style.setProperty('font-size', '11px', 'important'); P.n++; } break; } } catch (err) {} };
  const pass = root => { if (!root || root.nodeType !== 1) return; big(root); const all = root.getElementsByTagName('*'); for (let i = 0; i < all.length && i < 4000; i++) big(all[i]); };
  const gated = root => { if (window.matchMedia(MQ).matches) pass(root); };   // the width gate every pass goes through
  let queue = [], raf = 0;
  const flush = () => { raf = 0; const q = queue; queue = []; for (const r of q) if (r.isConnected) gated(r); };
  P.install = function(){
    if (document.getElementById('tap48-css')) return;
    const st = document.createElement('style'); st.id = 'tap48-css'; st.textContent = CSS; document.head.appendChild(st);
    const mq = window.matchMedia(MQ);
    const watch = () => {
      if (!mq.matches || P.mo) return; gated(document.body);
      P.mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) queue.push(n);
        else if (n.nodeType === 3 && n.parentElement) queue.push(n.parentElement);
        if (queue.length && !raf) raf = setTimeout(flush, 30); });
      P.mo.observe(document.body, {childList: true, subtree: true});
    };
    try { mq.addEventListener('change', watch); } catch (e) {}
    watch();
  };
  P.selfTest = function(){ const rows = []; const ok = (c, t) => rows.push((c ? 'ok ' : 'FAIL ') + t);
    ok(!!document.getElementById('tap48-css'), 'style tag present');
    const d = document.createElement('div'); d.innerHTML = '<span style="font-size:8px">tiny words</span>'; document.body.appendChild(d); gated(d);
    const fs = parseFloat(getComputedStyle(d.firstChild).fontSize), phone = window.matchMedia(MQ).matches; d.remove();
    ok(phone ? fs >= 11 : fs === 8, phone ? 'phone width: 8 px text raised to 11 px (' + fs + ')' : 'desktop width: 8 px text left alone (' + fs + ')');
    return {pass: rows.filter(r => r[0] === 'o').length, fail: rows.filter(r => r[0] === 'F').length, rows};
  };
  if (document.body) P.install(); else window.addEventListener('DOMContentLoaded', P.install);
})();
