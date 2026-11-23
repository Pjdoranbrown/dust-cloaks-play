/* ===== INDEX TW14: F-14 the walk-in tavern (Art & Interface Lead, 2026-11-14) =====
   Scope: audits/f14-walk-in-tavern.md (Patrick's decisions 2026-11-14: Fort only, mates sit and talk, entry free).
   At the Frontier Fort, clicking the Camp Tavern walks you into the brawl room as a PEACEFUL deployment (contract.peace):
   no waves, no enemies, no timer, no pay, no legwork used. WASD to walk, E to use what you stand beside:
     - the dice table  -> Crepitus (TAVERN.crepitus), the card table -> Rank'n (TAVERN.sit); closing the game walks you back in;
     - a plain table   -> sit a while and listen;
     - the bar counter -> the Camp Tavern panel (drink, Hiring Line perks, recruits) in camp;
     - the east door   -> the old tavern hub screen (the Back room: online button and bar-fight picker);
     - ESC or the west/south doors -> back to camp.
   Seated mates (the same ones TAVERN.seats() puts at the hub tables) talk with lines from TAVERN_LINES (crepChat, rankInvite).
   The bard on his stage is the brawl room's own (danceBardBodies). Reuses the hub's game hand-offs, so nothing else changes.
   Barge and warehouse keep their open-air bar (F-35); this does nothing there.
   INT-1 group 15: no switch. Load after tavern.js. */
(function(){
  'use strict';
  const T = window.TAVERN;
  if (!T || typeof startDeployment !== 'function') return;
  const TW = window.TAVERNWALK = {back: false, hub: false, seats: [], K: {reach: 0.95, chatMin: 260, chatMax: 520, bubble: 220}};   // [S]
  const $$ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lines = k => { const L = (window.TAVERN_LINES || {})[k]; return L && L.length ? L : ['Another round, and not a word to the Leader.']; };
  const sfx = n => { try { SFX.play(n); } catch (e) {} };

  const inPeace = () => !!(typeof G !== 'undefined' && G && G.obj === 'brawl' && G.contract && G.contract.peace);
  const fortOk = () => { try { return holding() === 'fort' && has('tavern') && META && META.leader && !G && !(typeof inStoryNow === 'function' && inStoryNow()); } catch (e) { return false; } };
  const NPC = (name, i) => ({id: -1 - i, name, race: 'HUMAN', cls: 'FREEMAN', spec: ['SOLDIER', 'SCOUNDREL'][i % 2], sex: i === 4 ? 'f' : 'm', level: 1, ticks: 0, burnt: 0, picks: [], injuries: [], kills: 0, deployments: 0});
  const PATRONS = ['Old Hob', 'Maud the Drover', 'Tall Pell', 'One-Ear Jory', 'Sister Wren', 'Gaffer Dunn'];

  /* ---- seats: dice table 0, card table 1, plain tables 2..5 ---- */
  TW.slotPos = (t, slot) => { const X = t.x * CELL, Y = t.y * CELL, W = 2 * CELL, H = CELL;      // [x, y, facing] of a stool at table edge
    return [[X + 0.25 * W, Y + 4, 2], [X + 0.75 * W, Y + 4, 2], [X + 0.25 * W, Y + H + 28, 6], [X + 0.75 * W, Y + H + 28, 6], [X - 12, Y + 26, 0], [X + W + 12, Y + 26, 4]][slot]; };
  const build = () => {
    TW.seats = [];
    // every sitter takes a stool right at a table edge (or the bar) and faces it: dir 2 = toward us, 6 = away, 0 = right, 4 = left
    const s = T.seats(), tb = MAP.tables, add = (ti, slot, p) => { const t = tb[ti]; if (!t || !p) return;
      const P = TW.slotPos(t, slot);
      TW.seats.push({p, ti, x: P[0], y: P[1], dir: P[2], left: P[2] === 4, say: 0, wait: rnd(60, 300), line: '', cx: P[0]}); };
    const bar = (i, p) => { const x = (9 + i * 4) * CELL; TW.seats.push({p, ti: -1, x, y: 3 * CELL + 24, dir: 6, left: false, say: 0, wait: rnd(60, 300), line: '', cx: x}); };
    const spare = [];                                                    // a mate with no free seat stands at the bar instead
    s.crep.forEach((p, i) => { if (i < 3) add(0, i, p.race ? p : NPC(p.name, i)); else spare.push(p); });
    s.rankn.forEach((p, i) => { if (i < 2) add(1, i * 2, p); else spare.push(p); });   // face to face across the board
    [2, 3, 4, 5].forEach((ti, i) => { if (Math.random() < 0.7) add(ti, i % 2 ? 2 : 0, NPC(PATRONS[(i + 3) % PATRONS.length], i + 3)); });
    [0, 1].forEach(i => { if (Math.random() < 0.6) bar(i, NPC(PATRONS[i + 1], i + 7)); });
    spare.slice(0, 3).forEach((p, i) => { const x = (7.5 + i * 4.5) * CELL; if (p.race) TW.seats.push({p, ti: -1, stand: true, x, y: 3 * CELL + 18, dir: 6, left: false, say: 0, wait: rnd(60, 300), line: '', cx: x}); });
  };

  /* ---- targets you can stand beside ---- */
  const rectD = (px, py, x0, y0, x1, y1) => Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1));
  const targets = () => {
    const out = [], tb = MAP.tables, d = MAP.doors;
    tb.forEach((t, i) => out.push({k: 'table' + i, ti: i, x0: t.x * CELL, y0: t.y * CELL, x1: (t.x + 2) * CELL, y1: (t.y + 1) * CELL,
      text: i === 0 ? 'E: Sit at the dice table (Crepitus)' : i === 1 ? 'E: Sit at the card table (Rank’n)' : 'E: Sit a while and listen'}));
    out.push({k: 'bar', x0: 6 * CELL, y0: 2 * CELL, x1: 20 * CELL, y1: 3 * CELL, text: 'E: Talk to the barkeep (drink, perks, recruits)'});
    d.forEach((o, i) => out.push({k: i === 1 ? 'back' : 'leave', x0: o.x - 18, y0: o.y - 22, x1: o.x + 18, y1: o.y + 18, text: i === 1 ? 'E: The back room' : 'E: Leave to camp'}));
    return out;
  };
  const near = () => { const L = G.leader; let best = null, bd = TW.K.reach * CELL;
    for (const t of targets()){ const dd = rectD(L.x, L.y, t.x0, t.y0, t.x1, t.y1); if (dd < bd){ bd = dd; best = t; } }
    return best; };

  /* ---- enter and leave ---- */
  TW.enter = function(){
    if (!META || !META.leader) return false;
    const intel = META.intel, place = pickOf(TAVERNS);
    const c = {obj: 'brawl', peace: true, tier: 1, host: 'bandits', place, edges: [], council: null, picks: 0, minutes: 0, pay: 0, patron: 'nobody', faction: null, seed: 11,
      brief: `An evening at ${place}. Nobody wants a fight tonight.`};
    try { const cp = $$('camp-panel'); if (cp) cp.classList.add('hidden'); if (CAMP) CAMP.panel = null; } catch (e) {}
    startDeployment(c, []);
    META.intel = intel;                                       // startDeployment clears a prisoner's tip; this visit must not eat it
    if (G){ G.noTick = true; G.noAdv = true; G.leader.x = 2.6 * CELL; G.leader.y = 8.5 * CELL; build(); TW.t = 0; G.msgs = []; note(c.brief + ' Walk up to a table, the bar or a door and press E.'); }
    sfx('tavernCrowd');
    return true;
  };
  const toCamp = () => { try { $$('overlay-pause').classList.add('hidden'); } catch (e) {} for (const k in keys) keys[k] = false; G = null; try { if (window.DECK && DECK.layerOff) DECK.layerOff(); } catch (e) {} renderTitle(); };   // the deck layer canvas is only hidden by a draw pass, and G = null ends them (QA bard-camp-after-hub)
  TW.leave = function(){ if (!inPeace()) return; toCamp(); sfx('pick'); };
  const viaCamp = fn => { TW.back = true; toCamp(); fn(); };
  // F-44(l): talk to the barkeep without leaving: the tavern menu (the camp panel) opens over the room, the room waits, and closing it brings you back
  TW.menu = function(){
    if (!inPeace() || TW.menuOpen) return;
    TW.menuOpen = true; G.paused = true; for (const k in keys) keys[k] = false; sfx('pick');
    try { T.bypass = true; openPanel('building', 'tavern'); } finally { T.bypass = false; }
  };
  TW.menuClosed = function(){ if (!TW.menuOpen) return; TW.menuOpen = false; if (inPeace()) { G.paused = false; for (const k in keys) keys[k] = false; } };
  { const f = closePanel; closePanel = function(){ const r = f.apply(this, arguments); try { TW.menuClosed(); } catch (e) {} return r; }; }

  TW.use = function(t){
    if (!inPeace() || !t) return;
    if (t.k === 'leave') return TW.leave();
    if (t.k === 'back'){ TW.hub = true; toCamp(); T.enter(); return; }
    if (t.k === 'bar') return TW.menu();   // F-44(l): the barkeep's menu opens in place, inside the room
    if (t.k === 'table0') return viaCamp(() => T.crepitus());
    if (t.k === 'table1'){ const m = TW.seats.find(s => s.ti === 1); if (!m){ sfx('nope'); note('Nobody is free to play Rank’n tonight.'); return; } return viaCamp(() => T.sit(m.p.id)); }
    const here = TW.seats.filter(s => s.ti === t.ti);                 // a plain table: sit and listen
    if (!here.length){ note('You sit a while. The table is empty, and so is the mug.'); sfx('pick'); return; }
    const s = here[0 | Math.random() * here.length]; s.line = lines('crepChat')[0 | Math.random() * lines('crepChat').length].replace(/\{name\}/g, 'friend'); s.say = TW.K.bubble;
    note('You sit a while and listen to the room.'); sfx('pick');
  };

  /* ---- hooks ---- */
  { const f = T.enter; T.enter = function(){
      if (TW.hub){ TW.hub = false; TW.back = false; return f.apply(this, arguments); }
      if ((TW.back || !G) && fortOk()){ TW.back = false; if (TW.enter()) return; }
      TW.back = false; return f.apply(this, arguments); }; }
  { const f = updateContract; updateContract = function(){
      if (!inPeace()) return f.apply(this, arguments);
      if (G.paused) return;
      const talking = TW.seats.some(s => s.say > 0);          // bark budget (F-15): one speaker at a time
      for (const s of TW.seats){ if (s.say > 0) s.say--; else if (!talking && --s.wait <= 0){ s.wait = rnd(TW.K.chatMin, TW.K.chatMax) * (window.VOICE15 && VOICE15.on ? VOICE15.gap : 1);
        const k = s.ti === 1 ? 'rankInvite' : 'crepChat'; s.line = lines(k)[0 | Math.random() * lines(k).length].replace(/\{name\}/g, G.leader.p.name); s.say = TW.K.bubble; } }
      const n = near(); TW.target = n; prompt(n && !G.over ? n.text : '');
    }; }
  { const f = contractLine; contractLine = function(t){ return inPeace() ? [G.contract.place.toUpperCase(), 'WASD TO WALK · E TO USE · ESC TO LEAVE'] : f.apply(this, arguments); }; }
  { const f = contractBodies; contractBodies = function(b, o){ f.apply(this, arguments); if (inPeace()) peopleBodies(b, o); }; }
  { const f = askWithdraw; askWithdraw = function(){ return inPeace() ? TW.leave() : f.apply(this, arguments); }; }
  { const f = togglePause; togglePause = function(){ if (inPeace()) return TW.menuOpen ? closePanel() : TW.leave(); return f.apply(this, arguments); }; }
  window.addEventListener('keydown', e => {
    if (!inPeace() || e.repeat) return;
    const k = e.key.toLowerCase();
    if (TW.menuOpen){ if (k === 'escape'){ e.preventDefault(); e.stopImmediatePropagation(); closePanel(); } return; }
    if (k === 'e' || k === 'enter'){ e.preventDefault(); e.stopImmediatePropagation(); TW.use(TW.target); }
    else if (k === 'escape'){ e.preventDefault(); e.stopImmediatePropagation(); TW.leave(); }
  }, true);

  /* ---- the seated mates and their talk ---- */
  const bubble = (x, y, text, a) => {
    if (window.VOICE15 && VOICE15.on && !VOICE15.allow(text)) return;   // F-42: the bark budget (F-15) covers this drawer too
    ctx.save(); ctx.globalAlpha = Math.min(1, a);
    const fp = window.canvasPx106 ? canvasPx106(ctx, 13) : 14, k = fp / 13, lh = Math.round(16 * k);   // Q106: 14 px on screen at any canvas scale
    ctx.font = fp.toFixed(1) + 'px Georgia, serif';
    const words = text.split(' '), rows = []; let cur = '';
    for (const wd of words){ if (ctx.measureText(cur + ' ' + wd).width > 284 * k && cur){ rows.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd; } rows.push(cur);
    const w = Math.min(300 * k, Math.max(...rows.map(r => ctx.measureText(r).width)) + 16 * k), h = rows.length * lh + 10 * k, bx = x - w / 2, by = y - h;
    ctx.fillStyle = 'rgba(245,235,215,.96)'; ctx.fillRect(bx, by, w, h); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, w, h);
    ctx.fillStyle = '#2a1a0c'; ctx.textAlign = 'center'; rows.forEach((r, i) => ctx.fillText(r, x, by + lh + k + i * lh)); ctx.restore(); };
  const stool = (x, y) => { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, y - 12); ctx.lineTo(x - 10, y + 1); ctx.moveTo(x + 8, y - 12); ctx.lineTo(x + 10, y + 1); ctx.stroke();
    ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.ellipse(x, y - 13, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); };
  const peopleBodies = (bodies, onScreen) => {
    TW.seats.forEach((s, i) => {
      bodies.push({y: s.y, custom: () => {
        try { const spr = personSpriteK('tw:' + s.p.name + s.p.race, s.p);
          if (!s.stand && window.SEAT3D && SEAT3D.on){ stool(s.x, s.y); SEAT3D.draw(TW, i, spr, s.x, s.y, 2.2, s.left, s.dir); }
          else drawStub(TW, i, spr, s.x, s.y, 2.2, 0, s.left, false); }
        catch (e) { ctx.fillStyle = '#6a5a4a'; ctx.beginPath(); ctx.arc(s.x, s.y - 26, 12, 0, Math.PI * 2); ctx.fill(); } }});
      if (s.say > 0) bodies.push({y: 9999, custom: () => bubble(s.x, s.y - 74, s.line, s.say / 30)});
    });
  };

  /* ---- the "E to use" prompt (click works too) ---- */
  let pe = null, last = '';
  const prompt = txt => {
    if (!pe){ pe = document.createElement('div'); pe.id = 'tw-prompt';
      pe.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:40;background:rgba(20,10,4,.88);color:#f0d890;border:2px solid #8a6a3a;border-radius:4px;padding:7px 16px;font:bold 14px Georgia,serif;cursor:pointer;display:none';
      pe.onclick = () => TW.use(TW.target); document.body.appendChild(pe); }
    if (txt !== last){ last = txt; pe.textContent = txt; pe.style.display = txt ? 'block' : 'none'; } };
  setInterval(() => { if (pe && !inPeace() && last){ last = ''; pe.style.display = 'none'; } }, 300);

  /* ---- after a game, walk back in (the hub's own returnFromGame calls T.enter; TW.back makes that the room) ---- */

  /* ---- self-test ---- */
  TW.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const sm = META, sg = G, sh = META && META.holding, sb = TW.back;
    try {
      ok('walk-in exposes enter/leave/use', typeof TW.enter === 'function' && typeof TW.leave === 'function' && typeof TW.use === 'function');
      ok('tavern hub keeps its own enter (back room)', typeof T.enter === 'function' && typeof T.crepitus === 'function' && typeof T.bar === 'function' && typeof T.sit === 'function');
      ok('chat lines exist', lines('crepChat').length > 0 && lines('rankInvite').length > 0);
      ok('no fight state outside the room', !inPeace() || G.contract.peace);
      const tb = {x: 5, y: 6}, X0 = tb.x * CELL, Y0 = tb.y * CELL;      // every stool slot is within 34 px of the table edge and faces it
      ok('every table slot sits at the table edge, facing it', [0, 1, 2, 3, 4, 5].every(sl => { const [x, y, d] = TW.slotPos(tb, sl), dd = rectD(x, y, X0, Y0, X0 + 2 * CELL, Y0 + CELL);
        const fx = d === 0 ? 1 : d === 4 ? -1 : 0, fy = d === 2 ? 1 : d === 6 ? -1 : 0, cx = X0 + CELL, cy = Y0 + CELL / 2;
        return dd <= 34 && ((cx - x) * fx + (cy - y) * fy) > 0; }));
      if (inPeace()) ok('every seated mate is at a table or the bar', TW.seats.every(s => s.stand || s.ti >= 0 || (s.y > 3 * CELL && s.y < 4 * CELL && s.x > 6 * CELL && s.x < 20 * CELL)));
    } catch (e) { ok('self-test threw: ' + e, false); }
    META = sm; G = sg; TW.back = sb;
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, n: out.length, details: out};
  };
})();

/* F-44 (k): inside the tavern the figures drew at 1.0 while the camp outside draws them at the hub figure scale (1.4), so everyone looked small.
   The peaceful room now draws every 3D figure at the same scale as outside. TAVERNWALK.K.fig = 1 gives the old 1.0 scale. */
(function(){
  'use strict';
  const TW = window.TAVERNWALK; if (!TW || typeof r3dDraw !== 'function' || r3dDraw.__tw44) return;
  TW.K.fig = (window.VO3 && VO3.K && VO3.K.hubFigure) || 1.4;
  const f = r3dDraw;
  r3dDraw = function(rec, u, x, y, s, o){
    if (TW.K.fig !== 1 && typeof G !== 'undefined' && G && G.contract && G.contract.peace && G.obj === 'brawl') s *= TW.K.fig;
    return f.call(this, rec, u, x, y, s, o); };
  r3dDraw.__tw44 = true;
})();
/* F-48 Art (sanity 16): no old pixel stand-ins when you walk in. The room's 3D figures (seated mates, patrons, barkeep, bard)
   used to render a few per tick, so about half the room showed the pixel stand-in for the first second. Now the room is drawn
   once unseen on entry (which queues every figure it needs), the queue is run for up to TAVERNWALK.K.warmMs, and only then
   does the first frame show. No switch (INT-1 group 15). */
(function(){
  'use strict';
  const TW = window.TAVERNWALK; if (!TW || TW.__warm48) return; TW.__warm48 = true;
  TW.K.warmMs = 220; TW.warmStat = null;
  TW.prewarm = function(){
    const t0 = performance.now(); let passes = 0;
    try {
      if (typeof draw !== 'function' || typeof r3dPump !== 'function' || typeof R3DQ === 'undefined') return null;
      draw(); passes++;                                         // asks for every figure on screen; missing ones join the queue (the room's first draw is slow by itself)
      const t1 = performance.now();
      while (passes < 4 && R3DQ.q.length && performance.now() - t1 < TW.K.warmMs){
        r3dPump(Math.max(10, TW.K.warmMs - (performance.now() - t1)));
        draw(); passes++;
      }
    } catch (e) { TW.warmStat = {err: String(e && e.message || e)}; return TW.warmStat; }
    return TW.warmStat = {ms: Math.round(performance.now() - t0), passes, left: R3DQ.q.length};
  };
  /* The room holds about 25 figures and one takes about 27 ms, so the short pause on entry cannot make them all. For the next
     TAVERNWALK.K.warmFor ms the queue runs faster (K.warmTick ms a tick, was 7) and a figure that is not ready is left out
     for those few frames (it steps in when made) instead of showing as old pixel art. After that window the old fallback is back. */
  TW.K.warmFor = 3000; TW.K.warmTick = 22; let t48 = -1e9, last48 = -1;
  const inWin = () => performance.now() - t48 < TW.K.warmFor && typeof G !== 'undefined' && G && G.obj === 'brawl' && G.contract && G.contract.peace;
  const en = TW.enter;
  TW.enter = function(){ const r = en.apply(this, arguments); if (r){ t48 = performance.now() + 6e4; try { TW.prewarm(); } finally { t48 = performance.now(); } } return r; };
  if (typeof r3dPumpTick === 'function' && typeof drawUnit3 === 'function'){
    const pt = r3dPumpTick, du = drawUnit3; let seat = 0;
    window.__tw48_pump = function(){ if (inWin()){ if (G.frame !== last48){ last48 = G.frame; if (R3DQ.q.length) r3dPump(TW.K.warmTick); } return; } return pt.apply(this, arguments); };
    // the async figure path: try the 3D figure as the game does; when it is not made yet, draw nothing this frame
    window.__tw48_unit = function(u, spr, x, y, s, frame, left, flash){
      if (!(u && inWin() && r3dTagged(spr))) return du.apply(this, arguments);
      try {
        if (seat){ TW.hid48 = (TW.hid48 || 0) + 1; return; }               // a seated mate waits for the seated figure, not the standing one
        r3dPumpTick();
        const rec = r3dRecipeForSprite(spr); if (!rec) return du.apply(this, arguments);
        if (spr.e3d) u.e3d = true;
        const c = r3dChoose(rec, u, frame, G.frame);
        if (!r3dDraw(rec, u, x, y, s, Object.assign(c, {flash, async:true, light:!spr.e3d}))) TW.hid48 = (TW.hid48 || 0) + 1;
      } catch (e) { return du.apply(this, arguments); }
    };
    (0, eval)('r3dPumpTick = window.__tw48_pump; drawUnit3 = window.__tw48_unit');
    if (window.SEAT3D && typeof SEAT3D.draw === 'function'){ const sd = SEAT3D.draw;
      SEAT3D.draw = function(){ seat++; try { return sd.apply(this, arguments); } finally { seat--; } }; }
  }
})();
