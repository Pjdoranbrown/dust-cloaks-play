/* F-15: one voice for camp text. Loads last. ROLLBACK: VOICE15.set(false) (or VOICE15.on = false then reload).
   - one bubble drawer (canvas), restyled to match the DOM speech boxes
   - one type scale: fine 11, aside 12.5, speech 14, label 15, title 21; no italics anywhere (Patrick 2026-11-13); asides are upright, marked by size and a softer tone
   - bark budget: one speaker (or one exchange) on screen, long gaps, quiet first minute
   - click-to-talk: click a mate in camp and they say a line (the panel still opens)
   - NO AMBIENT BUBBLES (Patrick 2026-11-14): only click-to-talk and registered lines (V.free) show. VOICE15.ambient = true restores the budgeted ambient barks. */
(function(){
  'use strict';
  const V = window.VOICE15 = {on: true, speech: 'upright', quietMs: 60000, gap: 2.2, minGapMs: 0, talk: true, ambient: false, SCALE: {fine: 14, aside: 14, speech: 14, label: 15, title: 21}};
  // Q106: a canvas size n that shows at least 14 CSS px once the canvas's CSS scale and the current transform are applied
  window.canvasPx106 = function(c, n){ try { const cv = c.canvas, cw = cv.width, bw = cv.getBoundingClientRect().width, t = c.getTransform ? c.getTransform() : {a: 1, b: 0};
    const s = (cw && bw ? bw / cw : 1) * Math.hypot(t.a, t.b); return s > 0 ? Math.max(n, 14 / s) : Math.max(n, 14); } catch (e) { return Math.max(n, 14); } };
  let FP = 14;
  const FONT = () => (V.speech === 'italic' ? 'italic ' : '') + FP.toFixed(1) + 'px Georgia';
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* ---- bark budget ---- */
  V.t0 = now(); V.cur = null; V.free = new Map();   // free: text -> expiry (click-to-talk lines skip the budget)
  V.allow = function(text, t){
    t = t == null ? now() : t;
    if (!V.on) return true;
    if (V.free.has(text) && V.free.get(text) > t) return true;
    if (!V.ambient) return false;   // Patrick 2026-11-14: no ambient bubbles; only click-to-talk and lines registered in V.free show. KILL SWITCH: VOICE15.ambient = true brings the old budgeted ambient barks back
    if (t - V.t0 < V.quietMs) return false;
    const ex = window.CAMPLIFE && CAMPLIFE.lastEx;
    if (V.cur && V.cur.until > t){
      if (V.cur.texts.includes(text)) return true;
      if (ex && V.cur.texts.includes(ex.a) && text === ex.b){ V.cur.texts.push(text); return true; }   // the reply in one exchange
      return false;
    }
    if (V.minGapMs > 0 && V.lastEnd && t < V.lastEnd + V.minGapMs) return false;   // F-42 [S]: a floor between one speaker and the next (0 = off)
    V.cur = {texts: [text], until: t + 4500}; V.lastEnd = t + 4500;
    if (ex && text === ex.a) V.cur.texts.push(ex.b);
    return true;
  };
  V.stretch = function(before, after){ return (before <= 0 && after > 0 && V.on) ? after * V.gap : after; };

  /* ---- the one bubble drawer ---- */
  function lines(text, maxW){
    if (ctx.measureText(text).width <= maxW) return [text];
    const w = text.split(' '); let a = ''; const out = [];
    for (const x of w){ const t = a ? a + ' ' + x : x; if (ctx.measureText(t).width > maxW && a){ out.push(a); a = x; } else a = t; }
    if (a) out.push(a); return out.slice(0, 3);
  }
  function inkBox(x, y, w, h, fill, edge, hl){   // same notched box as js/art/graphics.js (that copy is private to its closure)
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.fillStyle = edge; ctx.fillRect(x + 2, y - 2, w - 4, 2); ctx.fillRect(x + 2, y + h, w - 4, 2); ctx.fillRect(x - 2, y + 2, 2, h - 4); ctx.fillRect(x + w, y + 2, 2, h - 4);
    ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + w - 2, y, 2, 2); ctx.fillRect(x, y + h - 2, 2, 2); ctx.fillRect(x + w - 2, y + h - 2, 2, 2);
    ctx.fillStyle = fill; ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4);
    if (hl){ ctx.fillStyle = hl; ctx.fillRect(x + 2, y, w - 4, 1); }
  }
  function bubble(x, y, w, text){
    if (!V.allow(text)) return;
    FP = canvasPx106(ctx, V.SCALE.speech); const k = FP / V.SCALE.speech;
    ctx.save(); ctx.font = FONT();
    const L = lines(text, 250 * k), lw = Math.max(...L.map(s => ctx.measureText(s).width)), bw = Math.round(Math.min(268 * k, lw + 18 * k)), bh = Math.round(10 * k + L.length * 16 * k), bx = Math.round(x - bw / 2), by = Math.round(y - 18 - (bh - 24)), tx = Math.round(x);
    inkBox(bx + 2, by + 3, bw, bh, 'rgba(0,0,0,.2)', 'rgba(0,0,0,0)');
    inkBox(bx, by, bw, bh, '#ece0c4', '#3a2c1a', '#f7efd9');
    const ty = by + bh; ctx.fillStyle = '#3a2c1a'; ctx.fillRect(tx - 4, ty, 8, 2); ctx.fillRect(tx - 3, ty + 2, 6, 2); ctx.fillRect(tx - 2, ty + 4, 4, 2);
    ctx.fillStyle = '#ece0c4'; ctx.fillRect(tx - 2, ty, 4, 2); ctx.fillRect(tx - 1, ty + 2, 2, 2);
    ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    L.forEach((s, i) => ctx.fillText(s, x, by + Math.round(16 * k + i * 16 * k)));
    ctx.restore();
  }
  window.bubbleV = bubble;   // js/art/graphics.js draws (window.bubbleV || bubble)

  /* ---- gaps + camp clock ---- */
  if (typeof drawCamp === 'function'){
    const f = drawCamp; let wasG = true;
    drawCamp = function(){
      if (G){ wasG = true; return f.apply(this, arguments); }
      if (wasG){ wasG = false; V.t0 = now(); V.cur = null; }
      const before = typeof CAMP !== "undefined" ? CAMP.barkT || 0 : 0;
      const r = f.apply(this, arguments);
      try { if (V.on && typeof CAMP !== "undefined" && before <= 0 && (CAMP.barkT || 0) > 0) CAMP.barkT = V.stretch(before, CAMP.barkT); } catch (e) {}
      return r;
    };
  }

  /* ---- click-to-talk ---- */
  let down = null;
  window.addEventListener('mousedown', e => { down = {x: e.clientX, y: e.clientY}; }, true);
  window.addEventListener('mouseup', e => {
    const d = down; down = null;
    if (!V.on || !V.talk || G || !d || e.target !== canvas || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
    try {
      const hit = campHit(e.clientX + CAMP.cam.x, e.clientY + CAMP.cam.y);
      const q = hit && hit.q; if (!q || !(q.kind === 'mate' || q.kind === 'leader' || q.kind === 'officer') || !q.p) return;
      const line = barkFor(q.p); q.bark = line; q.barkLife = 260; V.free.set(line, now() + 6000);
    } catch (err) { console.warn('VOICE15', err); }
  });

  /* ---- type scale (DOM) ---- */
  const S = V.SCALE, st = document.createElement('style'); st.id = 'voice15-css';
  const asides = ['.role', '.fl', /* S6 1h: .ux-why has its own 15/17 px size and full colour in ux.js */ '#ux-foot .fw', '#ux-foot .fn', '.ux-plain', '.plaque.dim', '.aq-hint', '.aq-empty', '.dash-head span'];
  const upright = ['.speech', '.cpsay', '#tavern-hub .talk', '.cg-box .speech', '.council .master', '.arch-card .who', '.hcard .ht', '.cg-card .ht', '.d31-m'];
  st.textContent =
    asides.map(s => s + '{font-style:normal!important;opacity:.82;font-size:' + S.aside + 'px!important}').join('') +
    '*,*::before,*::after,i,em,cite{font-style:normal!important}' +   /* Patrick 2026-11-13: no italics anywhere in game text (hard to read); asides are marked by size and a softer tone */
    upright.map(s => s + '{font-style:normal!important}').join('') +
    ['.speech', '.cpsay', '#tavern-hub .talk', '.cg-box .speech'].map(s => s + '{font-size:' + S.speech + 'px!important}').join('') +
    '.speech{background:#ece0c4!important;border:2px solid #3a2c1a!important;border-radius:2px!important;color:#2a1a0a}' +
    '.cg-box .speech,.cpsay .speech,#tavern-hub .talk{background:none!important;border:0!important;border-radius:0!important}';   /* these sit inside a box already: no box in a box */
  V.css = st; document.head.appendChild(st);
  /* canvas text: strip 'italic' from every ctx.font set while VOICE15 is on */
  try { const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font'); if (d && d.set && !d.set.__v15){ const set = function(v){ d.set.call(this, V.on && typeof v === 'string' ? v.replace(/\bitalic\s+/g, '') : v); }; set.__v15 = 1; Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {get: d.get, set, configurable: true}); } } catch (e) {}

  V.set = function(on){ V.on = !!on; st.disabled = !V.on; if (V.on) window.bubbleV = bubble; else { delete window.bubbleV; V.cur = null; } return V.on; };

  V.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const was = {on: V.on, t0: V.t0, cur: V.cur, free: V.free, ex: window.CAMPLIFE && CAMPLIFE.lastEx};
    const wasAmb = V.ambient; V.ambient = true;   // the budget rows test the ambient path
    V.on = true; st.disabled = false; V.free = new Map(); V.cur = null; V.t0 = 0;
    ok('bubble hook set', window.bubbleV === bubble);
    ok('bubble draws (one and two lines) without throwing', (() => { try { V.free.set('probe line', now() + 1e6); V.free.set('probe line two that is long enough to wrap onto a second line because it keeps going and going well past the limit', now() + 1e6); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); bubble(500, 300, 100, 'probe line'); bubble(500, 360, 100, 'probe line two that is long enough to wrap onto a second line because it keeps going and going well past the limit'); ctx.restore(); return true; } catch (err) { return false; } })());
    ok('quiet first minute: nothing speaks', (V.t0 = 1000, !V.allow('hello', 1000 + 5000)));
    V.t0 = 0; const T = 100000;
    ok('first speaker is allowed', V.allow('A line', T));
    ok('second speaker held while the first is up', !V.allow('Another line', T + 1000));
    ok('same speaker redraws every frame', V.allow('A line', T + 2000));
    ok('free again after the window', V.allow('Another line', T + 5000));
    if (window.CAMPLIFE){ CAMPLIFE.lastEx = {a: 'Q?', b: 'A.'}; V.cur = null;
      ok('an exchange: opener', V.allow('Q?', T + 20000)); ok('an exchange: reply shares the slot', V.allow('A.', T + 20500)); ok('an outsider still waits', !V.allow('Stranger', T + 21000)); }
    { const mg = V.minGapMs, le = V.lastEnd; V.minGapMs = 10000; V.lastEnd = 0; V.cur = null;
      ok('minGap off by default', mg === 0);
      ok('minGap: a speaker is allowed after a long silence', V.allow('Gap A', T + 90000));
      ok('minGap: the next speaker waits out the floor (bubble 4.5 s + 10 s)', !V.allow('Gap B', T + 90000 + 6000) && !V.allow('Gap B', T + 90000 + 14000));
      ok('minGap: and speaks after it', V.allow('Gap B', T + 90000 + 15000));
      V.minGapMs = mg; V.lastEnd = le; V.cur = null; }
    V.cur = null; V.free.set('Clicked', T + 50000);
    ok('click-to-talk skips the budget and the quiet minute', (V.t0 = T + 40000, V.allow('Clicked', T + 40001)));
    ok('gap stretch only on a fresh bark', V.stretch(0, 400) === 400 * V.gap && V.stretch(5, 400) === 400);
    const probe = (cls, css) => { const e = document.createElement('div'); e.className = cls; document.body.appendChild(e); const v = getComputedStyle(e)[css]; e.remove(); return v; };
    ok('speech is upright', probe('speech', 'fontStyle') === 'normal');
    ok('asides are upright (no italics, size and tone only)', probe('ux-why', 'fontStyle') === 'normal'); { const c = document.createElement('canvas').getContext('2d'); c.font = 'italic bold 13px Georgia'; ok('canvas italic is stripped', !/italic/.test(c.font)); }
    ok('speech and asides sit on the scale', probe('speech', 'fontSize') === S.speech + 'px' && probe('fl', 'fontSize') === S.aside + 'px');
    V.ambient = false; V.cur = null; V.t0 = 0; ok('ambient off: an unregistered bark never shows, a registered one does', !V.allow('Ambient line', 200000) && (V.free.set('Clicked line', 1e9), V.allow('Clicked line', 200000)));
    V.ambient = wasAmb;
    V.set(false); ok('rollback drops the hook and the style', window.bubbleV === undefined && st.disabled === true && V.allow('anything', 1));
    V.set(true);
    V.on = was.on; st.disabled = !V.on; V.t0 = was.t0; V.cur = was.cur; V.free = was.free; if (window.CAMPLIFE) CAMPLIFE.lastEx = was.ex;
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, details: out};
  };
})();
