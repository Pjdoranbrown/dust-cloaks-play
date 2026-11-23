/* ============================================================================
   INDEX TRAP2E: S6-11 (plan row 2e), trap disarm. Spec audits/specs/s6-11.md.
   Stand still with a spotted trap inside the command ring: a Scoundrel mate on
   his feet walks to it, stops beside it and works (K.work frames, today's time).
   Move the Leader and he stops at once and walks back; the trap keeps its
   progress (t.dis). A Leader who is a Scoundrel still disarms within the old
   short reach (K.reach), but a mate is sent first.

   Hooks (one line each): updateTraps and drawTraps (contracts.js), updateMates
   (deployment.js), the ring and the late marks (render.js), the Act I trap step
   (tutorial/act1.js). No numbers changed: sight, ring, disarm time and damage
   are as they were.
   Off: TRAP2E.on = false (console) gives back the old short-reach disarm and
   the old red ring. Self-test: TRAP2E.selfTest() (pure).
   Words: section 7 of the spec (the Narrative Designer's). W is a stand-in for
   lessons.trap in js/lines/campaign.js until her words are in that file: it is
   used only while lessons.trap has no "done" line.
   ============================================================================ */
(function(){
  'use strict';
  const D = window.TRAP2E = {on: true,
    K: {work: 90, reach: 70, stand: 42, still: 12, safe: 120, arrive: 10, clear: 30, detour: 44, movedGap: 240},
    F: {working: 'DISARMING', safe: 'SAFE', far: 'Too far: get it inside your ring', none: 'No Scoundrel: walk round the trap', done: '{name} disarms the trap.'},
    W: {title: 'Traps',
        text: ['Pinch has seen a trap. Walk onto it and it bites: it hurts, and holds you fast.',
               'Stand still with it inside your command ring, and Pinch goes to disarm it.',
               'If you move, he stops. Stand still again and he picks up where he left off.'],
        goal: 'STAND STILL: PINCH DISARMS THE TRAP',
        remind: {who: 'pinch', text: 'Hold still. I have got this one.'},
        moved: {who: 'pinch', text: 'You moved. Stand still and let me work.'},
        done: {who: 'pinch', text: 'Done. Clever, but not clever enough.'},
        sprung: {who: 'pinch', text: 'That was the trap. It cost you a Wound. Next time, stand still and let me work.'},
        legend: 'Stand still: disarm a trap'}};
  const on = D.live = () => D.on !== false;
  const K = D.K;
  const st = D.st = () => G.t2e || (G.t2e = {still: 0, lx: G.leader.x, ly: G.leader.y, ring: false, cut: 0, cutT: null});
  const live = t => !!(t && t.armed && t.enemy && t.seen);
  const mates = () => (G.squad || []).filter(m => m.state === 'up' && m.spec === 'SCOUNDREL');
  const leadCan = () => { const L = G.leader; return !!(L && !L.down && L.spec === 'SCOUNDREL'); };
  const others = t => (G.traps || []).filter(o => o !== t && live(o));
  const nameOf = u => (u && u.p && u.p.name) || (u === G.leader && typeof META !== 'undefined' && META && META.leader && META.leader.name) || 'Your Scoundrel';
  // distance from point p to the segment a-b
  const segDist = D.segDist = (p, a, b) => { const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1, k = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2));
    return Math.hypot(p.x - (a.x + vx * k), p.y - (a.y + vy * k)); };

  /* the words for the Act I lesson: the Narrative Designer's file wins once it carries the new lines */
  D.words = function(){
    try { const Ls = window.CAMPAIGN_LINES && CAMPAIGN_LINES.lessons; if (Ls && Ls.trap && !Ls.trap.done) Object.assign(Ls.trap, D.W); } catch (e) {}
    return (window.CAMPAIGN_LINES && CAMPAIGN_LINES.lessons && CAMPAIGN_LINES.lessons.trap) || D.W;
  };

  /* where he stands to work: beside the trap on the side he comes from, clear of walls and of other spotted traps */
  D.spot = function(t, m){
    if (t.spot) return t.spot;
    // beside or above the trap, never below it: the bar sits under the trap, and his own marks must not cover it
    let base = Math.atan2(m.y - t.y, m.x - t.x); if (Math.sin(base) > -0.2) base = Math.cos(base) >= 0 ? -0.2 : Math.PI + 0.2;
    const os = others(t);
    for (let i = 0; i < 12; i++){
      const a = base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 6), q = {x: t.x + Math.cos(a) * K.stand, y: t.y + Math.sin(a) * K.stand};
      if (typeof blockedXY === 'function' && blockedXY(q.x, q.y)) continue;
      if (os.some(o => Math.hypot(o.x - q.x, o.y - q.y) < K.clear)) continue;
      return t.spot = q;
    }
    return t.spot = {x: t.x + Math.cos(base) * K.stand, y: t.y + Math.sin(base) * K.stand};
  };
  /* where a mate with a job walks this frame: his spot, or a step round another spotted trap that lies on the way (updateMates) */
  D.target = function(m){
    if (!on() || !m || !m.job || !live(m.job)) return null;
    const q = D.spot(m.job, m);
    for (const o of others(m.job)){
      if (segDist(o, m, q) >= K.clear - 4) continue;
      const dx = q.x - m.x, dy = q.y - m.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, side = ((o.x - m.x) * nx + (o.y - m.y) * ny) > 0 ? -1 : 1;
      return {x: o.x + nx * side * K.detour, y: o.y + ny * side * K.detour};
    }
    return q;
  };

  /* 14a (GD 0cba86c0): a mate's formation place keeps clear of spotted live traps, and he steps round one on the way. Returns a point, or null when nothing changes. */
  D.avoid = function(m, t){
    if (!on() || !m || m.job || !(G.traps || []).length) return null;
    let q = {x: t.x, y: t.y}, moved = false;
    for (const o of (G.traps || []).filter(live)){
      const d = Math.hypot(q.x - o.x, q.y - o.y);
      if (d < K.clear + 4){ const a = d > 0.5 ? Math.atan2(q.y - o.y, q.x - o.x) : Math.atan2(m.y - o.y, m.x - o.x); q = {x: o.x + Math.cos(a) * (K.clear + 6), y: o.y + Math.sin(a) * (K.clear + 6)}; moved = true; }
    }
    for (const o of (G.traps || []).filter(live)){
      if (segDist(o, m, q) >= K.clear + 4) continue;   /* LE 6c18d1e4 F1: no exemption when he is already close, he keeps rounding to the far side */
      const dx = q.x - m.x, dy = q.y - m.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, side = ((o.x - m.x) * nx + (o.y - m.y) * ny) > 0 ? -1 : 1;
      return {x: o.x + nx * side * K.detour, y: o.y + ny * side * K.detour};
    }
    return moved ? q : null;
  };

  function finish(t, u){
    t.armed = false; t.safeT = G.frame; t.by = null; t.work = false; t.doneBy = u; if (u && u.job === t) u.job = null;
    try { SFX.play('knife'); } catch (e) {}
    if (!t.lesson && typeof note === 'function') note(D.F.done.replace('{name}', nameOf(u)));
  }

  /* once a frame, from updateTraps, before the traps are walked */
  D.tick = function(){
    const L = G.leader, s = st(), ks = (typeof keys !== 'undefined' && keys) || {};
    const moved = Math.hypot(L.x - s.lx, L.y - s.ly) > 0.6; s.lx = L.x; s.ly = L.y;
    s.still = (ks.w || ks.a || ks.s || ks.d || moved || L.down) ? 0 : s.still + 1;
    const still = s.still >= K.still, R = (G.mod && G.mod.radius) || 118, traps = (G.traps || []).filter(live);
    // a job ends when the Leader moves, the trap is gone or out of the ring, or the mate is off his feet
    for (const m of G.squad || []){ const t = m.job; if (!t) continue;
      if (still && live(t) && m.state === 'up' && Math.hypot(L.x - t.x, L.y - t.y) <= R) continue;
      if (!still && live(t)){ s.cut = G.frame; s.cutT = t; }
      if (t.by === m){ t.by = null; t.spot = null; } m.job = null; }
    for (const t of traps){ if (t.by && t.by.job !== t) t.by = null; t.work = false; }
    const vw = typeof VW === 'number' ? VW : 1280, vh = typeof VH === 'number' ? VH : 720;
    s.ring = traps.some(t => Math.abs(t.x - L.x) < vw / 2 + 40 && Math.abs(t.y - L.y) < vh / 2 + 40);   // criterion 22
    if (!still) return;
    const sc = mates(), inRing = traps.filter(t => Math.hypot(L.x - t.x, L.y - t.y) <= R).sort((a, b) => Math.hypot(L.x - a.x, L.y - a.y) - Math.hypot(L.x - b.x, L.y - b.y));
    for (const t of inRing){ if (t.by) continue;                       // the nearer trap first; one Scoundrel a trap
      const free = sc.filter(m => !m.job).sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
      if (!free) break; free.job = t; t.by = free; t.spot = null; }
    for (const m of sc){ const t = m.job; if (!t) continue;
      const q = D.spot(t, m), dt = Math.hypot(m.x - t.x, m.y - t.y);
      if (Math.hypot(m.x - q.x, m.y - q.y) <= K.arrive || (dt > 19 && dt <= K.stand + 6)){ t.work = true; m.workF = G.frame; if (++t.dis >= K.work) finish(t, m); } }
    if (leadCan()) for (const t of traps){                              // the Leader is a Scoundrel: the old short reach, a mate first
      if (!t.armed || t.by || Math.hypot(L.x - t.x, L.y - t.y) >= K.reach) continue;
      t.work = true; L.workF = G.frame; if (++t.dis >= K.work) finish(t, L); }
  };
  /* is this unit safe from this trap? (the Scoundrel working on it never springs it) */
  D.spares = (t, u) => on() && !!u && (u.job === t || (u.workF === G.frame && t.work && u === G.leader));

  /* ---- drawing. World px are screen px on the field (the view is the window), so sizes switch at 1600 wide ---- */
  const big = () => (typeof VW === 'number' ? VW : 1280) >= 1600;
  const figBox = u => ({x0: u.x - 14, x1: u.x + 14, y0: u.y - 40, y1: u.y + 10});
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  D.stateOf = function(t){
    const L = G.leader, R = (G.mod && G.mod.radius) || 118, d = Math.hypot(L.x - t.x, L.y - t.y), ms = mates().length > 0;
    if (!ms && !leadCan()) return 'none';
    return d <= (ms ? R : K.reach) ? 'in' : 'far';
  };
  /* on the ground, under the figures: the tick where a trap was made safe (drawTraps) */
  D.ground = function(onScreen){
    if (!on() || !G.traps) return;
    const b = big(), h = b ? 20 : 16;
    for (const t of G.traps){ if (t.armed || t.safeT == null || !onScreen(t)) continue;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [c, w] of [['rgba(18,12,6,.85)', b ? 7 : 6], ['#8fd39a', b ? 4 : 3]]){ ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
        ctx.moveTo(t.x - h * 0.5, t.y); ctx.lineTo(t.x - h * 0.12, t.y + h * 0.4); ctx.lineTo(t.x + h * 0.5, t.y - h * 0.45); ctx.stroke(); }
      ctx.restore(); }
  };
  function plate(text, cx, y0, fpx, pad, col){              // y0: the plate's top; returns its box
    ctx.font = 'bold ' + fpx + 'px Georgia'; const w = Math.ceil(ctx.measureText(text).width) + pad * 2, h = fpx + pad * 2, x = Math.round(cx - w / 2);
    ctx.fillStyle = 'rgba(18,12,6,.88)'; ctx.fillRect(x, y0, w, h); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y0 + 0.5, w - 1, h - 1);
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, y0 + h / 2 + 1); ctx.textBaseline = 'alphabetic';
    return {x0: x, x1: x + w, y0, y1: y0 + h};
  }
  D.probe = [];                                              // the boxes drawn last frame (for layout checks)
  /* late, over the ring and the figures: outline, bar, word plate, the word over the worker (render.js) */
  D.draw = function(onScreen){
    D.probe = [];
    if (!on() || !G.traps || !G.leader) return;
    const b = big(), lw = b ? 3 : 2, R = b ? 32 : 30, fpx = b ? 16 : 14, pad = b ? 8 : 4, L = G.leader, placed = [];
    const figs = [L].concat(G.squad || []).filter(u => u && (u === L || u.state === 'up')).concat((G.enemies || []).filter(e => e && !e.dead && !e.dormant)).map(figBox);
    ctx.save();
    for (const t of G.traps){
      if (!t.enemy || !t.seen || !onScreen(t)) continue;
      const pr = {trap: t, x: t.x, y: t.y};
      let word = null, col = '#f4ead0', barBottom = 0;
      if (!t.armed){ if (t.safeT == null || G.frame - t.safeT >= K.safe) continue; word = D.F.safe; col = '#8fd39a'; pr.state = 'safe'; }
      else {
        const s = pr.state = D.stateOf(t);
        // the outline: solid gold and pulsing (in the ring), dashed pale (too far), dotted red (no Scoundrel)
        ctx.lineCap = 'butt'; ctx.setLineDash([]); ctx.beginPath(); ctx.arc(t.x, t.y, R, 0, Math.PI * 2);
        ctx.lineWidth = lw + 2; ctx.strokeStyle = 'rgba(18,12,6,.4)'; ctx.stroke();
        if (s === 'in'){ ctx.strokeStyle = 'rgba(255,216,96,' + (0.7 + Math.sin(G.frame / 18) * 0.28).toFixed(2) + ')'; }
        else if (s === 'far'){ ctx.strokeStyle = '#e8e0c8'; ctx.setLineDash(b ? [10, 8] : [8, 6]); word = D.F.far; }
        else { ctx.strokeStyle = '#ff5a4a'; ctx.setLineDash(b ? [lw, 6] : [lw, 4]); word = D.F.none; col = '#ffb0a0'; }
        ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]);
        pr.outline = {x0: t.x - R, x1: t.x + R, y0: t.y - R, y1: t.y + R, style: s === 'in' ? 'solid' : s === 'far' ? 'dashed' : 'dotted'};
        if (t.dis > 0){                                      // the bar: a fixed left edge; paused = half strength and a pause mark
          const bw = b ? 64 : 48, bh = b ? 8 : 6, bx = Math.round(t.x - bw / 2), by = Math.round(t.y + R + 4), k = Math.min(1, t.dis / K.work), paused = !t.work;
          ctx.fillStyle = 'rgba(18,12,6,.9)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
          ctx.globalAlpha = paused ? 0.5 : 1; ctx.fillStyle = '#ffd860'; ctx.fillRect(bx, by, Math.round(bw * k), bh); ctx.globalAlpha = 1;
          pr.bar = {x0: bx, x1: bx + bw, y0: by, y1: by + bh, fill: k, paused};
          if (paused){ const ph = b ? 16 : 12, pw = b ? 4 : 3, px = bx + bw + 1 + 6, py = Math.round(by + bh / 2 - ph / 2);
            ctx.fillStyle = 'rgba(18,12,6,.9)'; ctx.fillRect(px - 2, py - 2, pw * 3 + 4, ph + 4);
            ctx.fillStyle = '#ffd860'; ctx.fillRect(px, py, pw, ph); ctx.fillRect(px + pw * 2, py, pw, ph);
            pr.pause = {x0: px, x1: px + pw * 3, y0: py, y1: py + ph}; }
          barBottom = by + bh + 1;
        }
      }
      if (word){                                             // above the outline; under the trap (or its bar) if a figure or another plate is in the way
        const text = word.toUpperCase(); ctx.font = 'bold ' + fpx + 'px Georgia';
        const w = Math.ceil(ctx.measureText(text).width) + pad * 2, h = fpx + pad * 2, top = Math.round(t.y - R - 8 - h);
        const up = {x0: t.x - w / 2, x1: t.x + w / 2, y0: top, y1: top + h};
        const under = !!t.lesson || figs.some(f => hit(up, f)) || placed.some(p => hit(up, p));   // the Act I gold pointer sits above the lesson's trap
        const box = plate(text, t.x, under ? Math.round((barBottom || t.y + R) + 8) : top, fpx, pad, col);
        placed.push(box); pr.plate = Object.assign({text, under}, box);
      }
      D.probe.push(pr);
    }
    // the word over the Scoundrel at work: steady, not a floating word
    for (const u of [L].concat(G.squad || [])){
      if (!u || u.workF == null || G.frame - u.workF > 1) continue;
      const text = D.F.working; ctx.font = 'bold ' + fpx + 'px Georgia'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      const y = Math.round(u.y - 40 - 8); ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(12,8,4,.9)'; ctx.strokeText(text, u.x, y); ctx.fillStyle = '#ffd860'; ctx.fillText(text, u.x, y);
      D.probe.push({worker: u, x: u.x, y, text});
    }
    ctx.restore();
  };

  D.selfTest = function(){
    const out = []; const ok = (n, c, d) => out.push({n, ok: !!c, d});
    const sv = {G: typeof G !== 'undefined' ? G : undefined};
    try {
      const mk = (x, y, spec) => ({x, y, spec, state: 'up', p: {name: 'Pinch'}});
      const run = n => { for (let i = 0; i < n; i++){ G.frame++; D.tick(); for (const m of G.squad){ const q = D.target(m); if (q){ const d = Math.hypot(q.x - m.x, q.y - m.y) || 1, s = Math.min(2, d); m.x += (q.x - m.x) / d * s; m.y += (q.y - m.y) / d * s; } } } };
      const t1 = {x: 180, y: 100, kind: 'beartrap', armed: true, seen: true, enemy: true, dis: 0, lesson: true}, pin = mk(70, 100, 'SCOUNDREL');
      G = {frame: 0, leader: {x: 100, y: 100, spec: 'SOLDIER'}, squad: [pin], traps: [t1], mod: {radius: 118}, msgs: []};
      run(K.still - 1); ok('nobody is sent before the Leader has stood still', !pin.job);
      run(2); ok('standing still sends the Scoundrel to a trap inside the ring', pin.job === t1 && t1.by === pin);
      run(60); const d1 = Math.hypot(pin.x - t1.x, pin.y - t1.y);
      ok('he stops beside the trap, not on it', d1 > 19 && d1 < K.stand + 7, d1.toFixed(1));
      ok('he is at work and the bar has progress', t1.work && t1.dis > 0 && t1.dis < K.work, t1.dis);
      const kept = t1.dis; G.leader.x += 3; run(1);
      ok('a move by the Leader ends the job at once and keeps the progress', !pin.job && !t1.by && t1.dis === kept && t1.armed && G.t2e.cutT === t1);
      run(K.still + 1); ok('standing still again sends him back', pin.job === t1);
      const f0 = G.frame; run(K.work); ok('the rest takes only the time that was left', !t1.armed && t1.safeT - f0 <= K.work - kept + K.still + 30, (t1.safeT - f0) + ' frames for ' + (K.work - kept));
      ok('a disarmed trap frees him and spares nobody after', !pin.job && t1.doneBy === pin);
      const far = {x: 400, y: 100, armed: true, seen: true, enemy: true, dis: 0}; G.traps = [far]; run(60);
      ok('a trap outside the ring is not approached', !pin.job && far.dis === 0 && D.stateOf(far) === 'far');
      const a = {x: 150, y: 100, armed: true, seen: true, enemy: true, dis: 0}, b2 = {x: 100, y: 190, armed: true, seen: true, enemy: true, dis: 0}; G.traps = [b2, a]; pin.x = 70; pin.y = 100; G.t2e = null; run(K.still + 1);
      ok('two traps in the ring: the nearer one first', pin.job === a);
      run(200); ok('then the other, with the Leader still', !a.armed && (pin.job === b2 || !b2.armed));
      const c = {x: 160, y: 100, armed: true, seen: true, enemy: true, dis: 0}, d = {x: 100, y: 40, armed: true, seen: true, enemy: true, dis: 0}, p2 = mk(100, 120, 'SCOUNDREL');
      G.traps = [c, d]; G.squad = [pin, p2]; pin.x = 70; pin.y = 100; pin.job = null; G.t2e = null; run(K.still + 1);
      ok('two Scoundrels: one to each trap', pin.job && p2.job && pin.job !== p2.job);
      const e = {x: 150, y: 100, armed: true, seen: true, enemy: true, dis: 0}; G.traps = [e]; G.squad = [mk(70, 100, 'SOLDIER')]; G.t2e = null; run(120);
      ok('no Scoundrel: nobody is sent and the mark says so', e.dis === 0 && D.stateOf(e) === 'none');
      G.squad = [Object.assign(mk(70, 100, 'SCOUNDREL'), {state: 'bleeding'})]; run(60); ok('a Scoundrel who is down does not count', e.dis === 0 && D.stateOf(e) === 'none');
      G.squad = []; G.leader.spec = 'SCOUNDREL'; G.t2e = null; run(K.still + K.work + 2); ok('a Scoundrel Leader within the old reach disarms it', !e.armed && e.doneBy === G.leader);
      const g = {x: 100 + K.reach + 20, y: 100, armed: true, seen: true, enemy: true, dis: 0}; G.traps = [g]; run(120); ok('a Scoundrel Leader beyond the old reach does not', g.dis === 0 && D.stateOf(g) === 'far');
      const h = {x: 200, y: 100, armed: true, seen: true, enemy: true, dis: 0}, o = {x: 150, y: 100, armed: true, seen: true, enemy: true, dis: 0}, p3 = mk(100, 100, 'SCOUNDREL'); p3.job = h; G.traps = [h, o];
      const q = D.target(p3); ok('the way to the trap steps round another spotted trap', q && Math.hypot(q.x - o.x, q.y - o.y) >= K.detour - 1 && segDist(o, p3, q) > 19, q && (q.x | 0) + ',' + (q.y | 0));
      { const tr = {x: 150, y: 100, armed: true, seen: true, enemy: true, dis: 0}, sm = mk(100, 100, 'SOLDIER'); G.traps = [tr];   // 14a
        const q1 = D.avoid(sm, {x: 152, y: 102}); ok('14a: a formation place on a spotted trap is pushed out to the clear distance', q1 && Math.hypot(q1.x - tr.x, q1.y - tr.y) >= K.clear, q1 && (q1.x | 0) + ',' + (q1.y | 0));
        const q2 = D.avoid(sm, {x: 200, y: 100}); ok('14a: a place beyond a trap on the straight line is reached by a step round it', q2 && D.segDist(tr, sm, q2) > 19);
        ok('14a: a place well clear of any trap is left alone', D.avoid(sm, {x: 100, y: 200}) === null);
        { const wm = {x: 100, y: 100, state: 'up'}, pl = {x: 200, y: 100}; let near = 1e9, at = 0; for (let n = 0; n < 400; n++){ const q = D.avoid(wm, pl) || pl, dx = q.x - wm.x, dy = q.y - wm.y, l = Math.hypot(dx, dy) || 1, st = Math.min(2, l); wm.x += dx / l * st; wm.y += dy / l * st; near = Math.min(near, Math.hypot(wm.x - tr.x, wm.y - tr.y)); at = Math.hypot(wm.x - pl.x, wm.y - pl.y); }
          ok('14a: walking past a spotted trap to a place beyond it never comes within the spring distance, and arrives', near > 19 && at < 8, 'nearest ' + near.toFixed(1) + ', ends ' + at.toFixed(1) + ' from the place'); }
        sm.job = tr; ok('14a: a mate with a job is not moved by it', D.avoid(sm, {x: 152, y: 102}) === null); sm.job = null;
        tr.armed = false; ok('14a: a disarmed trap is ignored', D.avoid(sm, {x: 152, y: 102}) === null); }
      { const lt = {x: 10, y: 10, kind: 'beartrap', armed: true, seen: true, enemy: true, dis: 0, lesson: true}, sv = {x: 10, y: 10, con: 4, state: 'up', inF: true, p: {id: 't17e', name: 'Test'}, anim: {}};   // 17e
        const fx = [G.squad, G.traps, G.fx]; G.squad = [sv]; G.traps = []; G.fx = G.fx || []; const fxn = G.fx.length; let worst = 9;
        for (let n = 0; n < 12; n++){ lt.armed = true; try { trapEffect(lt, sv); } catch (er) { lt.err = String(er.message || er).slice(0, 80); } worst = Math.min(worst, sv.con); }
        ok('17e: the lesson trap never takes a mate below 1 health', worst >= 1 && worst < 4 && sv.state === 'up' && !lt.err, 'con ' + worst + ' ' + (lt.err || ''));
        { const wOld = G.leader.wounds; G.leader.wounds = 3; const w0 = 3; sv.con = 4; for (let n = 0; n < 30 && sv.con >= 4; n++){ lt.armed = true; try { trapEffect(lt, sv); } catch (er) { lt.err = String(er.message || er).slice(0, 80); } } ok('17f: a mate springing the lesson trap costs the Leader no Wound', G.leader.wounds === w0 && sv.con < 4 && sv.con >= 1, w0 + ' -> ' + G.leader.wounds + ', con ' + sv.con + ' ' + (lt.err || '')); G.leader.wounds = wOld; }
        G.squad = fx[0]; G.traps = fx[1]; G.fx.length = fxn; G.fx = fx[2]; }
      ok('segDist', Math.abs(segDist({x: 5, y: 5}, {x: 0, y: 0}, {x: 10, y: 0}) - 5) < 1e-9);
    } catch (e) { ok('no error', false, String(e && e.stack || e)); }
    finally { G = sv.G; }
    const bad = out.filter(x => !x.ok);
    return {pass: out.length - bad.length, fail: bad.length, bad, all: out};
  };
})();
