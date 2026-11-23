/* F-36: living holdings (Art). Loads last. INT-1 group 16: no switches.
     The warehouse's sun shaft (unseen windows; moves across the floor and dims through the day).
     Rats scurrying between buildings, every holding.
     Click-to-squish (F-42d: a click on a rat squishes it; it stays gone until the next day, dayMs).
   Drawn after the camp, in world space, under the labels. No sprites to load: a rat is a few filled rects. */
(function(){
  'use strict';
  const L = window.LIVING36 = {dayMs: 240000, maxRats: 2, detour: .5, splatMs: 4000, last: {light: 0, rats: 0}};
  const TAU = Math.PI * 2, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let t0 = now(), prev = now(), rats = [], seedK = '', splats = [];
  const gone = {};   // squished rats per holding: {day, n}; a new day (L.dayMs) refills the holding

  /* the camp has no day clock of its own ("camp is evening"), so the shaft keeps one: dayMs of real time from sunrise to dusk, then it starts over */
  L.phase = (t) => (((t == null ? now() : t) - t0) % L.dayMs) / L.dayMs;   // 0 = sunrise, 1 = dusk
  L.alpha = (p) => Math.max(0, 0.385 * Math.pow(1 - p, 1.3) + 0.02 * (1 - p));   // full in the morning, nearly gone at dusk

  const hold = () => { try { return typeof holdKey === 'function' ? holdKey() : 'fort'; } catch (e) { return 'fort'; } };
  const inCamp = () => { try { return typeof G !== 'undefined' && !G && typeof CAMP !== 'undefined' && CAMP && CAMP.people; } catch (e) { return false; } };

  /* ---- the sun shaft (warehouse only) ---- */
  function drawLight(p){
    const W = typeof CAMP_W === 'number' ? CAMP_W : 1760, H = typeof CAMP_H === 'number' ? CAMP_H : 1300;
    const a = L.alpha(p); if (a < 0.01) return 0;
    const x0 = W * (0.16 + 0.62 * p), y0 = H * 0.22, len = H * 0.62, drift = 120 + 220 * p;   // west to east as the day goes; the foot slides further out as the sun drops
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // one shaft from a high window, two thin ones beside it (frames of the unseen windows)
    for (const [dx, wd, k] of [[0, 130, 1], [-250, 80, .6], [270, 64, .5]]){
      const xa = x0 + dx, g = ctx.createLinearGradient(xa, y0, xa + drift, y0 + len);
      g.addColorStop(0, 'rgba(255,214,130,' + (a * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xa + wd, y0); ctx.lineTo(xa + wd + drift, y0 + len); ctx.lineTo(xa + drift, y0 + len); ctx.closePath(); ctx.fill();
      // the lit patch where it lands
      const lx = xa + drift + wd / 2, ly = y0 + len, rg = ctx.createRadialGradient(lx, ly, 6, lx, ly, wd * 1.1);
      rg.addColorStop(0, 'rgba(255,214,140,' + (a * k * .8).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = rg; ctx.save(); ctx.translate(lx, ly); ctx.scale(1, .42); ctx.translate(-lx, -ly); ctx.beginPath(); ctx.arc(lx, ly, wd * 1.1, 0, TAU); ctx.fill(); ctx.restore();
    }
    // dust in the beam
    const tt = now() / 1000; ctx.fillStyle = 'rgba(255,236,190,' + (a * 1.6).toFixed(3) + ')';
    for (let i = 0; i < 18; i++){ const u = (i * 0.137 + tt * 0.02 * (1 + (i % 3) * .4)) % 1, xx = x0 + 75 + drift * u + Math.sin(tt * .7 + i) * 18, yy = y0 + len * u; ctx.fillRect(Math.round(xx), Math.round(yy), 2, 2); }
    ctx.restore(); return 1;
  }

  /* ---- rats ---- */
  function spots(){
    const out = [];
    try { for (const o of campObjects()) if (o && typeof o.x === 'number' && (o.kind === 'plot' || o.kind === 'building' || o.kind === 'hub')) out.push({x: o.x, y: o.y + 24}); } catch (e) {}
    try { if (typeof HUB !== 'undefined') for (const k in HUB) if (HUB[k] && typeof HUB[k].x === 'number') out.push({x: HUB[k].x, y: HUB[k].y + 28}); } catch (e) {}
    return out;
  }
  function newRat(S, i){
    const a = S[(Math.random() * S.length) | 0]; let b = S[(Math.random() * S.length) | 0], n = 0;
    while (b === a && n++ < 6) b = S[(Math.random() * S.length) | 0];
    return {x: a.x, y: a.y, tx: b.x, ty: b.y, wait: Math.random() * 600 + i * 220, sp: 1.5 + Math.random() * .9, ph: Math.random() * 9, id: Math.random() * 3, fx: b.x < a.x ? -1 : 1};
  }
  function feet(){   // building footprints the rats keep out of (a plot or building is about 120 wide and stands 85 up from its base)
    const out = [];
    try { for (const o of campObjects()) if (o && typeof o.x === 'number' && (o.kind === 'plot' || o.kind === 'building' || o.kind === 'house')) out.push([o.x - 62, o.y - 88, o.x + 62, o.y + 6]); } catch (e) {}
    try { if (typeof HUB !== 'undefined' && HUB.house) out.push([HUB.house.x - 70, HUB.house.y - 95, HUB.house.x + 70, HUB.house.y + 8]); } catch (e) {}
    return out;
  }
  const inFoot = (F, x, y) => F.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
  function ratsTick(dt, S){
    if (!S.length) return;
    while (rats.length < L.maxRats - L.goneNow()) rats.push(newRat(S, rats.length));
    const F = feet();
    for (const r of rats){
      if (r.wait > 0){ r.wait -= dt * 1000; continue; }
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      if (d < 4){ const n = newRat(S, 0); r.tx = n.tx; r.ty = n.ty; r.wait = 1500 + Math.random() * 6000; r.slide = 0; r.slid = 0; r.det = null; continue; }   // sit a while, then go to another building
      const st = Math.min(r.sp * dt * 60, d); let mx = dx / d * st, my = dy / d * st;   // never step past the target (low frame rates: no overshoot, no flicker)
      // never walk into a building. Blocked, the rat picks one detour (along the wall toward the target, else round on one side,
      // else down the front) and keeps it for L.detour s, so it cannot flick back and forth frame to frame (Patrick 2026-11-14)
      const clear = (ux, uy) => !inFoot(F, r.x + ux * st * 3, r.y + uy * st * 3);
      if (r.det){ r.det.t -= dt; const [ux, uy] = r.det.u;
        if (r.det.t > 0 && clear(ux, uy) && !(ux && Math.abs(dx) < st) && !(uy && Math.abs(dy) < st)){ mx = ux * st; my = uy * st; } else r.det = null; }
      const k3 = Math.min(3, d / st);   // look ahead 3 steps, never past the target (a target by a wall stays reachable)
      if (!r.det && inFoot(F, r.x + mx * k3, r.y + my * k3)){
        const hx = Math.abs(dx) >= st ? [Math.sign(dx), 0] : null, vy = Math.abs(dy) >= st ? [0, Math.sign(dy)] : null;
        let u = null;
        for (const c of Math.abs(dx) >= Math.abs(dy) ? [hx, vy] : [vy, hx]) if (c && !(r.slide && c[0] && c[0] !== r.slide) && clear(c[0], c[1])){ u = c; break; }
        if (!u){ if (!r.slide) r.slide = Math.sign(dx) || 1; r.slid = (r.slid || 0) + 1;   // one side per trip, kept until it arrives
          if (r.slid < 40 && clear(r.slide, 0)) u = [r.slide, 0]; else if (r.slid < 40 && clear(0, 1)) u = [0, 1]; }
        if (!u){ const n = newRat(S, 0); r.tx = n.tx; r.ty = n.ty; r.wait = 400; r.slide = 0; r.slid = 0; continue; }   // stuck or a long way round: go elsewhere
        r.det = {u, t: L.detour}; mx = u[0] * st; my = u[1] * st;
      }
      if (Math.abs(mx) > .05) r.fx = Math.sign(mx);
      r.x += mx; r.y += my; r.ph += st * .5;
    }
  }
  function drawRat(r){
    const x = Math.round(r.x), y = Math.round(r.y), f = r.fx < 0 ? -1 : 1, moving = r.wait <= 0, ph = r.ph, bob = moving ? Math.round(Math.sin(ph * 1.6) * .6) : 0,
      v = (Math.floor(r.id || 0)) % 3, body = ['#2a1d16', '#4a3a30', '#3a3a3c'][v], big = [1, .9, 1.1][v];
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 5.5 * big, 1.6, 0, 0, TAU); ctx.fill();
    // tail: a pink S curve that flicks
    const fl = Math.sin(ph * 1.3) * 2 * (moving ? 1 : .4);
    const OLD = window.RAT_OLD_ART === true;   /* F-42a: camp-palette rat; window.RAT_OLD_ART = true restores the pink tail, ear and bright rim */
    ctx.strokeStyle = OLD ? '#d89a8a' : '#65493f'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 4.5 * f * big, y - 2); ctx.bezierCurveTo(x - 8 * f, y - 5 + fl, x - 10 * f, y + fl * .6, x - 13 * f, y - 3 + fl); ctx.stroke();
    // legs
    ctx.fillStyle = '#1a120d'; const lg = moving ? (Math.floor(ph) & 1) : 0; ctx.fillRect(x - 2 + lg * 3, y - 1, 1, 2); ctx.fillRect(x + 2 - lg * 3, y - 1, 1, 2);
    // round body, head with a pointed nose, an ear
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x, y - 3 + bob, 4.8 * big, 2.9 * big, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4.2 * f * big, y - 3 + bob, 2.4, 1.9, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 5.2 * f * big, y - 4.6 + bob); ctx.lineTo(x + 8.6 * f * big, y - 2.8 + bob); ctx.lineTo(x + 5.2 * f * big, y - 1.4 + bob); ctx.closePath(); ctx.fill();   // the nose
    ctx.fillStyle = OLD ? '#c98f86' : '#54392f'; ctx.fillRect(Math.round(x + 4 * f * big), y - 6 + bob, 2, 2);                                                                                       // ear
    ctx.fillStyle = OLD ? '#f0b8b0' : '#6e514a'; ctx.fillRect(Math.round(x + 8 * f * big - (f < 0 ? 1 : 0)), y - 3 + bob, 1, 1);                                                                      // nose tip
    // the pale rim, only along the back
    ctx.strokeStyle = OLD ? 'rgba(236,222,196,.75)' : 'rgba(176,160,132,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - 3 + bob, 4.8 * big, 2.9 * big, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }

  /* ---- hook ---- */
  if (typeof drawCamp === 'function'){
    const f = drawCamp;
    drawCamp = function(){
      const r = f.apply(this, arguments);
      try {
        if (!inCamp() || (typeof inStory === 'function' && inStory())) return r;   /* P23-BUG-2: story scenes (the road) draw their own world and ignore CAMP.cam, so camp rats would slide with the drag */
        const tn = now(), dt = Math.min(.1, (tn - prev) / 1000); prev = tn;
        const k = hold(); if (k !== seedK){ seedK = k; rats = []; }
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-Math.round(CAMP.cam.x), -Math.round(CAMP.cam.y)); ctx.imageSmoothingEnabled = false;
        L.last.light = k === 'warehouse' ? drawLight(L.phase(tn)) : 0;
        if (splats.length) drawSplats(tn);
        { ratsTick(dt, spots()); for (const q of rats) if (q.x > CAMP.cam.x - 20 && q.x < CAMP.cam.x + VW + 20 && q.y > CAMP.cam.y - 20 && q.y < CAMP.cam.y + VH + 20){ ctx.save(); ctx.translate(Math.round(q.x), Math.round(q.y)); ctx.scale(1.7, 1.7); ctx.translate(-Math.round(q.x), -Math.round(q.y)); drawRat(q); ctx.restore(); } L.last.rats = rats.length; }
        ctx.restore();
      } catch (e) { try { ctx.restore(); } catch (e2) {} if (!L.warned){ L.warned = 1; console.warn('LIVING36', e); } }
      return r;
    };
  }

  /* ---- F-42d: click a rat to squish it (Patrick 2026-11-14). A capture listener runs before the camp's own mouseup, so the
     click never reaches what is under the rat. A dark splat fades over L.splatMs; a soft squeak through the SFX context. ---- */
  const dayNo = () => Math.floor((now() - t0) / L.dayMs);
  L.goneNow = () => { const g = gone[hold()]; return g && g.day === dayNo() ? g.n : 0; };
  L.ratAt = (wx, wy) => { let best = null, bd = 14; for (const r of rats){ const d = Math.hypot(r.x - wx, r.y - 5 - wy); if (d < bd){ bd = d; best = r; } } return best; };
  L.squishRat = function(r){
    const i = rats.indexOf(r); if (i < 0) return false;
    rats.splice(i, 1); const k = hold(), g = gone[k] && gone[k].day === dayNo() ? gone[k] : (gone[k] = {day: dayNo(), n: 0}); g.n++;
    splats.push({x: r.x, y: r.y, t: now(), s: .8 + Math.random() * .4, a: Math.random() * TAU}); if (splats.length > 12) splats.shift();
    squeak(); return true;
  };
  function squeak(){
    try {
      const X = typeof SFX !== 'undefined' && SFX._g ? SFX._g() : null; if (!X || !X.ac || !X.master) return;
      try { if (typeof settings === 'function' && !(settings().volume > 0)) return; } catch (e) {}
      const t = X.ac.currentTime, o = X.ac.createOscillator(), g = X.ac.createGain(), f = 1900 + Math.random() * 500;
      o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + .05); o.frequency.exponentialRampToValueAtTime(f * .7, t + .14);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
      o.connect(g); g.connect(X.master); o.start(t); o.stop(t + .18); L.lastSqueak = now();
    } catch (e) {}
  }
  function drawSplats(tn){
    splats = splats.filter(p => tn - p.t < L.splatMs);
    for (const p of splats){
      const a = 0.55 * (1 - (tn - p.t) / L.splatMs), x = Math.round(p.x), y = Math.round(p.y) - 2;
      ctx.fillStyle = 'rgba(38,20,16,' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(x, y, 7 * p.s, 3.2 * p.s, 0, 0, TAU); ctx.fill();
      for (let j = 0; j < 5; j++){ const an = p.a + j * 1.26, rr = (8 + (j % 2) * 4) * p.s; ctx.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(y + Math.sin(an) * rr * .45), 2, 1); }
    }
  }
  if (typeof window !== 'undefined'){   // canvas is set at init, after this file loads: check it at click time
    window.addEventListener('mouseup', e => {
      try {
        if (e.button !== 0 || typeof canvas === 'undefined' || !canvas || e.target !== canvas || !inCamp() || !CAMP.drag || CAMP.drag.moved) return;
        const r = L.ratAt(e.clientX + CAMP.cam.x, e.clientY + CAMP.cam.y); if (!r) return;
        L.squishRat(r); CAMP.drag = null; e.stopImmediatePropagation(); e.preventDefault();
      } catch (err) {}
    }, true);
  }
  L.splats = () => splats;   // for tests

  L.dayPhase = () => L.phase();                 // public, for Audio: 0 = sunrise .. 1 = dusk; loops every L.dayMs
  L.isDay = () => L.phase() < 0.85;             // gulls by day; the shaft is nearly gone after this
  L.list = () => rats;   // for tests

  L.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    ok('phase runs 0..1 and the shaft dims through the day', (() => { const a = [0, .25, .5, .75, .99].map(p => L.alpha(p)); return a.every((v, i) => i === 0 || v < a[i - 1]) && a[0] > .2 && a[4] < .06; })());
    ok('phase wraps', L.phase(t0 + L.dayMs * 1.5) > .49 && L.phase(t0 + L.dayMs * 1.5) < .51);
    ok('the camp has places for rats to run between', (() => { try { return spots().length >= 3; } catch (e) { return false; } })());
    ok('a rat walks toward its target', (() => { const S = [{x: 0, y: 0}, {x: 200, y: 0}]; const r = {x: 0, y: 0, tx: 200, ty: 0, wait: 0, sp: 2, ph: 0}; const save = rats; rats = [r]; const was = L.maxRats; L.maxRats = 1; ratsTick(.016, S); L.maxRats = was; const moved = r.x > 0; rats = save; return moved; })());
    ok('a rat 6 px from its target at dt 0.1 arrives without flipping', (() => { const S = [{x: 0, y: 0}, {x: 200, y: 0}]; const r = {x: 194, y: 0, tx: 200, ty: 0, wait: 0, sp: 2.4, ph: 0, fx: 1}; const save = rats, was = L.maxRats; rats = [r]; L.maxRats = 1; const fx = [];
      try { for (let i = 0; i < 4; i++){ if (r.wait > 0) break; ratsTick(.1, S); fx.push(r.fx); } } finally { L.maxRats = was; rats = save; } return r.x === 200 && fx.every(f => f === 1); })());
    ok('a squished rat is gone until the next day, leaves a fading splat, and its click stops there', (() => { const S = spots(); if (!S.length) return true;
      const sr = rats, ss = splats, sk = JSON.stringify(gone), st0 = t0, was = L.maxRats; let ok1 = false;
      try { rats = []; splats = []; for (const k in gone) delete gone[k]; L.maxRats = 2; ratsTick(.016, S); const r = rats[0]; r.wait = 9e9;
        const hit = L.ratAt(r.x, r.y - 5) === r, sq = L.squishRat(r); ratsTick(.016, S); const one = rats.length === 1 && splats.length === 1;
        t0 -= L.dayMs; ratsTick(.016, S); const back = rats.length === 2;
        ok1 = hit && sq && one && back && !L.ratAt(r.x + 200, r.y);
      } finally { rats = sr; splats = ss; for (const k in gone) delete gone[k]; Object.assign(gone, JSON.parse(sk)); t0 = st0; L.maxRats = was; }
      return ok1; })());
    rats = [];
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, details: out};
  };
})();
