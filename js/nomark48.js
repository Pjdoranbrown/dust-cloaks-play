/* ============================================================================
   INDEX NOMARK48 - F-48 UX K12: an undrilled mate with no mark gives a sign
   An undrilled Squad Mate attacks only the enemy you mark (F33). With no mark
   it stands idle, and nothing said so. Now, once an enemy has been within
   200 px of such a mate for 2 s and nothing is marked, a small "No mark"
   shows over that mate and their name goes grey on the Command Deck. Both
   clear the moment a mark is set (or no enemy is near).
   Only the host's own squad; not in a Brawl; not when clicks are off (F33).
   Numbers [S]: NOMARK48.K.delay (frames, 60 a second), NOMARK48.K.range (px).
   Hooks: wraps contractBodies (index.html) to draw the word with the bodies;
   js/ui/hud-deck.js mateCard reads NOMARK48.grey(m) for the name colour.
   K27 (UX sixth pass): in a packed squad the words overlapped. Now a word is
   drawn only where its box clears every word already placed this frame, so a
   cluster shows one "No mark"; the grey names on the Deck say which mates.
   Box size [S]: NOMARK48.K.boxW, K.boxH (px).
   K36 (UX 2026-11-16): the field canvas is scaled down to the screen (0.4 at
   375 px wide), so an 11 px word was 4.4 px on a phone. The word and its box
   now grow by 1 / that scale, so the word is at least K.minPx screen pixels.
   [S] NOMARK48.K.minPx (11), K.maxMul (3).
   INT-1 group 15: no switch.
============================================================================ */
(function(){
  'use strict';
  const N = window.NOMARK48 = {K: {delay: 120, range: 200, boxW: 64, boxH: 18, minPx: 11, maxMul: 3}, TXT: {word: 'No mark'}};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const live = e => e && !e.dead && !(e.dormant && !e.seen);
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  N.active = function(){
    const G = gl('G'), F = window.F33;
    return !!(G && F && typeof F.markOn === 'function' && F.markOn() && !G.over);
  };
  N.undrilled = m => { if (!m || !m.p || m.state === 'dead' || m.state === 'bleeding' || m.state === 'stable') return false;
    const d = m.p.drills || {}; return !d.cut && !d.fire; };
  N.near = function(m){
    const G = gl('G'); if (!G || !G.enemies) return false;
    for (const e of G.enemies) if (live(e) && d2(m, e) <= N.K.range) return true;
    return false;
  };
  /* one step a frame: count up while the mate is undrilled, unmarked and an enemy is near; else reset */
  N.step = function(){
    const G = gl('G'); if (!G || !Array.isArray(G.squad)) return;
    const on = N.active(), marked = on && window.F33.mark();
    for (const m of G.squad){
      if (!on || marked || !window.F33.host(m) || !N.undrilled(m) || !N.near(m)){ m.nomark48 = 0; continue; }
      if (m.nomark48f !== G.frame){ m.nomark48f = G.frame; m.nomark48 = (m.nomark48 || 0) + 1; }
    }
  };
  N.shows = m => !!(N.active() && m && (m.nomark48 || 0) >= N.K.delay && !window.F33.mark());
  N.grey = m => { try { return N.shows(m); } catch (e) { return false; } };

  /* K36: how much bigger than 11 canvas px the word must be to reach K.minPx on screen */
  N.mul = function(){
    try { const c = gl('canvas'); if (!c || !c.width || !c.clientWidth) return 1;
      const sc = c.clientWidth / c.width; return Math.max(1, Math.min(N.K.maxMul, N.K.minPx / (11 * sc))); } catch (e) { return 1; }
  };
  N.drawWord = function(m){
    const ctx = gl('ctx'); if (!ctx || !N.shows(m)) return;
    const hz = typeof CAMZ !== 'undefined' && CAMZ.on ? CAMZ.z : 1, k = N.mul() / hz, fs = 11 * k;   /* A2: held at its screen size under the zoom */
    const G = gl('G'), y = m.y - 34 - 6 * k + Math.sin((G.frame || 0) / 14) * 1.2;
    ctx.save(); ctx.font = 'bold ' + fs + 'px Georgia'; ctx.textAlign = 'center'; const cls0 = hz > 1 ? CAMZ.cls : null; if (hz > 1) CAMZ.cls = 'S';   /* S: sized for the screen already; the world-text hook leaves it */
    const w = ctx.measureText(N.TXT.word).width + 10 * k;
    ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(30,20,12,.8)'; ctx.fillRect(m.x - w / 2, y - fs, w, fs + 4 * k);
    ctx.globalAlpha = 1; ctx.fillStyle = '#e8d8b0'; ctx.fillText(N.TXT.word, m.x, y);
    ctx.restore(); if (cls0 !== null) CAMZ.cls = cls0;
  };

  /* K27: which mates get a word this frame; a word whose box meets a placed one is dropped */
  N.placed = function(ms){
    const k = N.mul() / (typeof CAMZ !== 'undefined' && CAMZ.on ? CAMZ.z : 1), out = [], W = N.K.boxW * k, H = N.K.boxH * k;   /* A2: world px under the zoom */
    for (const m of ms.slice().sort((a, b) => a.y - b.y || a.x - b.x))
      if (!out.some(o => Math.abs(o.x - m.x) < W && Math.abs(o.y - m.y) < H)) out.push(m);
    return out;
  };

  /* hook: contractBodies runs once a frame inside the world draw; the step and the word ride on it */
  try {
    const cb = gl('contractBodies');
    if (typeof cb === 'function'){
      N._cb = function(bodies, onScreen){
        const r = cb.apply(this, arguments);
        try {
          N.step();
          const G = gl('G');
          if (N.active() && G && G.squad) for (const m of N.placed(G.squad.filter(m => N.shows(m) && (!onScreen || onScreen(m))))) bodies.push({y: m.y + 0.5, custom: () => N.drawWord(m)});
        } catch (e) { if (!N._err){ N._err = 1; console.warn('NOMARK48', e); } }
        return r;
      };
      (0, eval)('contractBodies = window.NOMARK48._cb');
    }
  } catch (e) { console.warn('NOMARK48 wrap', e); }

  N.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const F = window.F33, G0 = gl('G'), K0 = Object.assign({}, N.K);
    if (!F){ ok('F33 loaded', false); return {pass: 0, total: 1, rows}; }
    const mo = F.markOn;
    /* the test G is set through a window slot so the game's own G is put back after */
    const hal = {x: 100, y: 100, state: 'up', p: {name: 'Hal', drills: {}}}, ves = {x: 120, y: 100, state: 'up', p: {name: 'Ves', drills: {cut: 1}}},
          far = {x: 900, y: 900, state: 'up', p: {name: 'Far', drills: {}}}, foe = {x: 250, y: 100, k: 'x'};
    const TG = {frame: 0, squad: [hal, ves, far], enemies: [foe], leader: {x: 0, y: 0}, mark33: null};
    N._tg = TG;
    try {
      (0, eval)('G = window.NOMARK48._tg');
      N.K.delay = 120; N.K.range = 200; F.markOn = () => true;
      const run = n => { for (let i = 0; i < n; i++){ TG.frame++; N.step(); } };
      run(119); ok('nothing before 2 s', !N.shows(hal) && !N.grey(hal));
      run(1); ok('after 2 s: No mark over an undrilled mate near an enemy', N.shows(hal) && N.grey(hal), hal.nomark48);
      ok('a drilled mate never shows it', !N.shows(ves));
      ok('a mate with no enemy within 200 px does not', !N.shows(far));
      N.step(); ok('two calls in one frame count once', hal.nomark48 === 120, hal.nomark48);
      TG.mark33 = foe; ok('the sign clears the moment a mark is set', !N.shows(hal) && !N.grey(hal));
      run(1); TG.mark33 = null; ok('and the 2 s start again after the mark goes', !N.shows(hal) && hal.nomark48 === 0, hal.nomark48);
      run(120); foe.x = 400; run(1); ok('the enemy moves off: the sign clears', !N.shows(hal));
      foe.x = 250; run(120); ok('back in range for 2 s: it shows again', N.shows(hal));
      hal.state = 'bleeding'; run(1); ok('a downed mate does not show it', !N.shows(hal)); hal.state = 'up';
      run(120); F.markOn = () => false; ok('clicks off or a Brawl (markOn false): nothing', !N.shows(hal) && !N.active());
      F.markOn = () => true;
      const bodies = []; run(1); N._cb(bodies, () => true);
      ok('the hook adds one body for the word, with a draw', bodies.filter(b => b.custom).length >= 1 && bodies.some(b => Math.abs(b.y - 100.5) < 0.01));
      { const a = {x: 100, y: 100}, b = {x: 130, y: 105}, c = {x: 300, y: 100}, d = {x: 100, y: 140};
        const pl = N.placed([b, a, c, d]);
        ok('K27: two mates close together get one word', pl.includes(a) && !pl.includes(b), pl.length);
        ok('K27: mates apart each get a word', pl.includes(c) && pl.includes(d) && pl.length === 3);
      }
      { const c0 = gl('canvas'); window.__nm48c = {width: 938, clientWidth: 375}; (0, eval)('canvas = window.__nm48c');
        const k = N.mul(); ok('K36: at 375 px wide the word is at least 11 screen px', Math.abs(11 * k * 375 / 938 - 11) < 0.01, k.toFixed(2));
        Object.assign(window.__nm48c, {width: 1000, clientWidth: 1000}); ok('K36: at full scale it stays 11 px', N.mul() === 1);
        Object.assign(window.__nm48c, {width: 938, clientWidth: 100}); ok('K36: capped at K.maxMul', N.mul() === N.K.maxMul);
        Object.assign(window.__nm48c, {width: 938, clientWidth: 375});
        window.__nm48c = c0; (0, eval)('canvas = window.__nm48c'); delete window.__nm48c; }
      ok('contractBodies is wrapped', gl('contractBodies') === N._cb || typeof gl('contractBodies') === 'function');
    } catch (e) { ok('no throw', false, e.message); }
    finally { window.__nm48g = G0; (0, eval)('G = window.__nm48g'); delete window.__nm48g; F.markOn = mo; Object.assign(N.K, K0); N._tg = null; }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
