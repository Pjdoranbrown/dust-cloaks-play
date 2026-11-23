/* ============================================================================
   CLEAR THE FIELD (S6 row 2d, spec audits/specs/s6-14.md; Patrick's playtest: the camp fight ended with slavers standing)
   A Founding hunt ends when no foe is left, not when the last commander falls: the camp fight (b3, F45) and the raid
   lead hunt (b6) and every main-game Hunt (row 2i, Q58). This file holds the count, the goal line, the notes, the red edge
   arrow, the field-clear prompt and its pick-up time. The hooks: intro.js (win, goal, pointer), deployment.js and render.js.
   b8 to b10 (the clock defences) are not touched: they end on the clock, not on a commander (Lead Engineer ebcd231).
   NO STALL TIMER (Q57): every foe left is woken, loses any escort and comes at the squad. A runner (broken) leaves once off screen.
   PICK-UP TIME (Q57/Q58): when the count reaches zero a prompt shows. With coin on the ground the Leader has CF.PICKUP_SEC
   seconds (Patrick, Q62) to walk over it (ends early when none is left); coin left behind is LOST (nothing collects it when a fight
   ends: updatePickups in deployment.js is the only collector). Then the win, as before.
   SWITCH: CF.on = false (or ?clear=0) restores the old rule (the win at the commander's death).
   ROLLBACK: delete this file, its <script> line, and the CF lines in intro.js, deployment.js, render.js.
============================================================================ */
(function(){
  'use strict';
  const CF = window.CF = {
    on: !/[?&]clear=0/.test(location.search),
    PICKUP_SEC: 10,       // (Patrick, Q62) seconds the Leader has to pick up coin once the field is clear
    OK_FRAMES: 90,        // the prompt's stay when there is no coin
    BROKEN_MAX_SEC: 10,   // a broken foe cornered on screen is let go after this long
    TXT: {
      vaneDown: 'The commander is down. The rest are coming for you: stand and fight, or go to them.',
      arrow: 'The red arrow points to the slavers who are left.',
      raidArrow: 'The red arrow points to the enemies who are left.',
      lastRun: 'The last of them run off the field. They will not be back.',
      raidDown: 'The last commander is down. The rest are coming for you: stand and fight, or go to them.',
      won: 'FIGHT WON',
      wonCoin: 'FIGHT WON: PICK UP ALL THE COIN',
      secs: n => `${n} second${n === 1 ? '' : 's'}. Walk your Leader over it: any coin left behind is lost.`,
      left: n => `SLAVERS LEFT IN THE CAMP: ${n}`,
      raidLeft: n => `ENEMIES LEFT: ${n}`
    }
  };
  const live = () => typeof G !== 'undefined' && G && !G.over && G.contract && G.enemies;
  CF.mode = function(){
    if (!CF.on || !live()) return null;
    if (G.contract.f45 && G.f45){ const cp = G.camps && G.camps[0]; return G.f45.stage === 'camp' && cp && cp.done ? 'camp' : null; }
    if (G.obj === 'hunt' && G.camps && G.camps.length && G.camps.every(c => c.done)) return 'raid';
    return null;
  };
  const ours = e => e && !e.dead && !e.gone && !(BESTIARY[e.k] && BESTIARY[e.k].arch === 'fixed');   // a nest or an engine is not a foe that can come
  CF.list = () => live() ? G.enemies.filter(ours) : [];
  CF.left = () => CF.list().length;
  // true when the win may show: the rule is off, or nothing is left
  CF.clear = () => !CF.on || !CF.mode() || (CF.state().phase === 'done' && CF.left() === 0);
  const coins = () => (G.pickups || []).filter(p => p.kind !== 'xp' && !p.got && p.life > 0 && p.v > 0).length;
  CF.coins = coins;
  const off = e => { const L = G.leader, m = 70, v = typeof camView === 'function' ? camView() : {w: VW, h: VH}; return Math.abs(e.x - L.x) > v.w / 2 + m || Math.abs(e.y - L.y) > v.h / 2 + m; };   // A2: the zoomed view
  const once = (st, k, fn) => { if (!st.said[k]){ st.said[k] = true; fn(); } };
  CF.state = () => (G.cf && G.cf.f === G.contract) ? G.cf : (G.cf = {f: G.contract, said: {}, far: null, ran: false, kills: 0, was: -1, woke: false, phase: 'fight', t: 0, fade: 0, slot: 0});
  CF.tick = function(){
    const m = CF.mode(); if (!m) return;
    const st = CF.state(), L = G.leader, fps = 60;
    // every foe left comes: none stays asleep, on guard or tied to an escort (every frame, so a late spawn is woken too)
    for (const e of G.enemies) if (ours(e)){ if (e.dormant){ e.dormant = false; e.seen = true; } if (e.escort){ e.escort = null; } }
    if (!st.woke){
      st.woke = true;
      if (m === 'camp'){
        once(st, 'down', () => note(CF.TXT.vaneDown));
        try { const f = window.CAMPAIGN_LINES, a = f && f.pinch && f.pinch.vaneDown, ln = Array.isArray(a) ? a[0] : a; if (ln) note('Pinch: \u201c' + ln + '\u201d'); } catch (e) {}
      } else if (CF.left() > 0) once(st, 'down', () => note(CF.TXT.raidDown));
    }
    // a runner counts until he is off screen (or has been cornered for BROKEN_MAX_SEC); then he is gone and never returns
    let gone = 0;
    for (const e of G.enemies){
      if (!ours(e) || !e.broken) continue;
      if (e._cfB == null) e._cfB = G.frame;
      if (off(e) || G.frame - e._cfB > CF.BROKEN_MAX_SEC * fps){ e.gone = true; gone++; }
    }
    if (gone){ G.enemies = G.enemies.filter(e => !e.gone); st.ran = true; st.kills = G.kills; }
    const n = CF.left();
    if (n === 0 && st.was !== 0 && st.ran && G.kills === st.kills) once(st, 'run', () => note(CF.TXT.lastRun));
    st.was = n;
    if (CF.target()) once(st, 'arrow', () => note(m === 'camp' ? CF.TXT.arrow : CF.TXT.raidArrow));
    // the field-clear prompt and the pick-up time
    if (st.phase === 'fight' && n === 0){ const c = coins(); st.coin = c > 0; st.t = st.coin ? CF.PICKUP_SEC * fps : CF.OK_FRAMES; st.t0 = st.t; st.phase = st.coin ? 'coin' : 'ok'; }
    else if (st.phase === 'coin'){ if (--st.t <= 0 || coins() === 0){ st.phase = 'done'; st.fade = 12; } }
    else if (st.phase === 'ok'){ if (--st.t <= 0){ st.phase = 'done'; st.fade = 12; } }
    else if (st.phase === 'done' && st.fade > 0) st.fade--;
  };
  // the nearest remaining foe, only while he is off screen
  CF.target = function(){
    if (!CF.mode()) return null;
    const L = G.leader; let best = null, bd = 1e9;
    for (const e of CF.list()){ if (!off(e)) continue; const d = Math.hypot(e.x - L.x, e.y - L.y); if (d < bd){ bd = d; best = e; } }
    return best;
  };
  // the field-clear prompt (UI/UX layout, s6-14 section 8): one plate, centred, its top on the goal box's top; heading, line, bar
  CF.plate = function(){
    if (!CF.mode()) return; const st = CF.state();
    // GD F3 (2d174d9): other notes wait while the plate shows and come back after it, in order; the win line (already in G.msgs) is first
    if ((st.phase === 'fight' || st.phase === 'done') && st.held && st.held.length){ for (const m of st.held) G.msgs.push({t:m.t, life:300}); st.held = []; G.msgs = G.msgs.slice(0, 4); }
    if (st.phase === 'fight' || (st.phase === 'done' && st.fade <= 0)) return;
    const D = window.DECK, px = (a, b) => D && D.px ? D.px(a, b) : a;
    if (st.phase !== 'done'){ st.held = st.held || []; for (let i = G.msgs.length - 1; i >= 0; i--) st.held.push(G.msgs[i]); G.msgs = []; G.tip = null; }   // one instruction at a time; the win line pushed as the plate fades stays
    if (D && D.vw && st.phase !== 'done'){ if (!D.momAt){ CF.waitMom = (CF.waitMom | 0) + 1; if (CF.waitMom < 8) return; } else CF.waitMom = 0; }   // UX 2d-05: hold the first frames until the Momentum box's place is known (8 frames at most, in case it never shows)
    const q = D && D.vw ? VW / D.vw : 1, DW = D && D.vw ? D.vw : VW, DH = D && D.vh ? D.vh : VH;   // the Deck's units: canvas px = units x q (UX 2d-02)
    const w = Math.min(DW - 40, px(480, 640)), pad = px(16, 24), hf = px(20, 24), lf = px(15, 17), bh = px(8, 10);
    const coin = st.coin, h = coin ? pad * 2 + hf + 8 + lf + 12 + bh : pad * 2 + hf, secs = Math.max(0, Math.ceil(st.t / 60));
    const home = D && D.slotTop ? D.slotTop() : (D && D.objAt) ? D.objAt.y : 14;   // under the Momentum bar when it shows (UX 2d-01)
    let x = Math.round(DW / 2 - w / 2), y = Math.round(home);
    if (st.slot === 0){ const L = G.leader, cv = camView(), cx = cv.x, cy = cv.y, z = cv.z;   /* A2: screen px under the world zoom */
      const near = (bx, by, br) => bx + br > (x - 16) * q && bx - br < (x + w + 16) * q && by + br > (y - 16) * q && by - br < (y + h + 16) * q;
      if (near((L.x - cx) * z, (L.y - cy) * z, 22) || (G.pickups || []).some(p => p.kind !== 'xp' && near((p.x - cx) * z, (p.y - cy) * z, 14))) st.slot = 1; }
    if (st.slot === 1){   // UX 2d-04: the legend's top, even in a frame where the legend is not drawn: its one-line box (the size D.legend gives it) sits 6 above the band
      let lt = D && D.legendAt && D.legendAt.y;
      if (!lt && D && D.H && D.sc){ const sc = D.sc() || 1, iw = window.innerWidth || 1280, pxs = Math.max(14, Math.min(16, 14 + (iw - 1280) * 2 / 640)), fs = Math.ceil(pxs / sc * 2) / 2; lt = DH - D.H - 6 - (8 + Math.round(fs * 1.3)); }
      y = Math.round((lt || (D && D.H ? DH - D.H - 6 : DH - 160)) - 16 / (D && D.sc ? D.sc() : 1) - h); }   // legendAt is in Deck units (legendRect is screen px); 16 screen px clear of the legend or the band (UX 2d-04)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(q, q);
    ctx.globalAlpha = st.phase === 'done' ? st.fade / 12 : 1;
    ctx.fillStyle = 'rgba(12,10,8,.92)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#d9b45a'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; const cx0 = x + w / 2;
    ctx.fillStyle = '#efe6d2'; ctx.font = 'bold ' + hf + 'px Georgia'; ctx.fillText(coin ? CF.TXT.wonCoin : CF.TXT.won, cx0, y + pad + hf * .8);
    if (coin){
      const red = secs <= 3;
      ctx.fillStyle = red ? '#ff8a7a' : '#c9bda3'; ctx.font = (red ? 'bold ' : '') + lf + 'px Georgia'; ctx.fillText(CF.TXT.secs(secs), cx0, y + pad + hf + 8 + lf * .85);
      const bx = x + pad, by = y + h - pad - bh, bw = w - pad * 2, fr = Math.max(0, st.t / st.t0);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = red ? '#ff8a7a' : '#d9b45a'; ctx.fillRect(bx, by, bw * fr, bh);
    }
    ctx.restore();
  };
  CF.plateOn = () => { try { if (!CF.mode()) return false; const st = CF.state(); return st.phase === 'coin' || st.phase === 'ok'; } catch (e) { return false; } };   // T45's gold line stays off the plate (UX 2d-03)
  CF.drawMarker = function(){
    try { CF.plate(); } catch (e) { console.warn('clear-field plate', e); }
    const t = CF.target(); if (!t || G.paused || (G.f45 && G.f45.making)) return;
    const sp = camToScreen(t.x, t.y);   /* A2: screen px under the world zoom */
    const px = sp.x, py = sp.y, ph = Math.sin(G.frame / 10), m = 54;
    const ox = VW / 2, oy = VH / 2 - 20, a = Math.atan2(py - oy, px - ox), hw = VW / 2 - m, hh = VH / 2 - m - 50;
    const k = Math.min(hw / Math.max(1e-6, Math.abs(Math.cos(a))), hh / Math.max(1e-6, Math.abs(Math.sin(a)))), sz = 18 + ph * 2;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ff5a4a'; ctx.translate(ox + Math.cos(a) * k, oy + Math.sin(a) * k); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(sz, 0); ctx.lineTo(-sz * .7, -sz * .7); ctx.lineTo(-sz * .3, 0); ctx.lineTo(-sz * .7, sz * .7); ctx.closePath();
    ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke(); ctx.restore();
  };
  // goal lines
  CF.campLine = () => CF.mode() === 'camp' ? CF.TXT.left(CF.left()) : null;
  CF.raidLine = function(){
    if (CF.mode() !== 'raid' || G.f45) return null;
    return [G.camps.filter(c => c.done).length + ' / ' + G.camps.length, CF.TXT.raidLeft(CF.left())];
  };
  // the raid lead's win (deployment.js checkObjective): false = wait; else the note to show
  // the win note is the prompt's job now (no note here): false = wait, true = win with no extra line
  CF.raidWin = () => CF.on && CF.mode() === 'raid' ? CF.clear() : 'The last commander is dead. The field is yours.';

  { const f = checkObjective; checkObjective = function(){ try { CF.tick(); } catch (e) { console.warn('clear-field', e); } return f.apply(this, arguments); }; }
  const hook = () => { if (CF.hooked || typeof draw !== 'function') return; CF.hooked = true;
    const f = draw; draw = function(){ const r = f.apply(this, arguments); try { CF.drawMarker(); } catch (e) {} return r; }; };
  if (document.readyState === 'complete') hook(); else window.addEventListener('load', hook);

  CF.selfTest = function(){
    const out = []; let bad = 0; const ok = (n, v) => { out.push((v ? 'ok   ' : 'FAIL ') + n); if (!v) bad++; };
    const g0 = typeof G !== 'undefined' ? G : null, on0 = CF.on, nt = window.note;
    try {
      window.note = function(){};
      const ct = {f45: 1}; const mk = (n, o) => { const a = []; for (let i = 0; i < n; i++) a.push(Object.assign({x: 100 * i, y: 0, con: 3}, o || {})); return a; };
      G = {over: false, contract: ct, f45: {stage: 'camp'}, camps: [{done: true}], enemies: mk(3), leader: {x: 0, y: 0}, frame: 0, kills: 0, paused: false};
      CF.on = true;
      ok('mode camp once the commander is down', CF.mode() === 'camp');
      ok('count is every foe alive and not gone', CF.left() === 3);
      G.enemies[0].dead = true; G.enemies[1].gone = true; ok('dead and gone foes are off the count', CF.left() === 1);
      G.camps[0].done = false; ok('no mode while the commander lives', CF.mode() === null);
      G.camps[0].done = true; CF.on = false; ok('switch off: no mode, and the win rule is the old one', CF.mode() === null && CF.clear());
      CF.on = true; G.enemies = mk(2, {dormant: true}); G.cf = null; CF.tick(); ok('sleepers wake', G.enemies.every(e => !e.dormant && e.seen));
      G.enemies = mk(2, {escort: {}, dormant: true}); G.enemies.forEach(e => { e.x = 4000; }); G.cf = null; G.frame = 10; CF.tick(); G.frame += 5000; CF.tick();
      ok('no stall timer: a far foe stays on the count and is not removed', CF.left() === 2 && G.enemies.length === 2 && G.enemies.every(e => !e.escort && !e.dormant));
      G.enemies = mk(2).concat([{x: 5, y: 5, con: 3, k: 'nest'}]); ok('a fixed nest is not a foe', CF.left() === 2);
      G.enemies = []; G.pickups = [{kind: 'coin', v: 5, life: 500}]; G.cf = null; CF.tick(); ok('count zero with coin: pick-up phase, win waits', CF.state().phase === 'coin' && !CF.clear());
      G.pickups = []; CF.tick(); ok('last coin taken: the time ends early', CF.state().phase === 'done' && CF.clear());
      G.pickups = [{kind: 'coin', v: 5, life: 99999}]; G.cf = null; CF.tick(); for (let i = 0; i < CF.PICKUP_SEC * 60 + 2; i++) CF.tick(); ok('time runs out: win may show', CF.clear());
      G.pickups = []; G.cf = null; CF.tick(); ok('no coin: the prompt stays a moment', CF.state().phase === 'ok' && !CF.clear()); for (let i = 0; i < CF.OK_FRAMES + 2; i++) CF.tick(); ok('then the win', CF.clear());
      G.enemies = mk(1); G.pickups = []; G.cf = null;
      G.f45 = null; ct.f45 = 0; ct.f34 = 'b6'; G.obj = 'hunt'; G.camps = [{done: true}, {done: false}]; ok('raid lead waits for every commander', CF.mode() === null);
      G.camps[1].done = true; G.enemies = mk(2); G.cf = null; ok('raid lead: mode raid, waits while foes stand', CF.mode() === 'raid' && CF.raidWin() === false);
      G.enemies = []; for (let i = 0; i < 300; i++) CF.tick(); ok('raid lead: wins when clear and the prompt is over', CF.raidWin() === true);
      ct.f34 = 0; G.enemies = mk(1); G.cf = null; ok('main game Hunt ends the same way (row 2i)', CF.mode() === 'raid' && CF.raidWin() === false);
      G.obj = 'escort'; ok('other contracts keep their own rule', CF.mode() === null && CF.raidWin() === 'The last commander is dead. The field is yours.');
    } catch (e) { ok('self-test threw: ' + e.message, false); }
    window.note = nt; G = g0; CF.on = on0;
    return {pass: out.length - bad, total: out.length, out};
  };
})();
// LE 2d note: a Momentum card choice must not open on the same frame as the plate and draw over it; it waits until the plate is done
{ const f = openMomentum; openMomentum = function(){ try { if (CF.plateOn()) return; } catch (e) {} return f.apply(this, arguments); }; }
