/* js/tutorial/lessons.js (INT-1 stage 1, 2026-11-16): the Founding lesson module T45 (lesson, gate, hold, used, coach marks), with the Settings row "Lessons" (L45, was js/lessons45.js) folded in at the end.
   Was js/teach45.js, moved unchanged. Classic script; the globals keep their names. */
/* ============================================================================
   T45: the Founding's lesson module (F-45 teaching plan v2, section 3).
   Lead Programmer, 2026-11-15. One pattern for every step: meet, lesson card,
   do it, check, keep.

     T45.lesson(id, o)   pause, show a card beside the thing (gold outline), one
                         button, keep the lesson in Field Notes. o: {vars, hud, world,
                         el, rect, deck, then}. hud = {kind:'ability', spec} (a Command Deck
                         rect; part:'con' = the Condition marks on a mate's card), deck = () => a rect
                         in the Deck's own units (DECK.objAt, DECK.momAt), world = a thing with x, y on the field, el = a DOM
                         node, rect = () => {x, y, w, h} in canvas units.
     T45.gate(id, test, o)  the gold "do it" line; the story waits until test() is
                         true once. A reminder every T45.K.remind frames. o: {vars, then}.
     T45.hold(...names)  keep a system out of sight until its lesson; T45.release(n);
                         T45.held(n). Presentation only: no rule changes.
     T45.used(id)        count a lesson used (the unprompted check); T45.usedList().
     T45.coach(id, marks, o)  coach marks on a menu screen: one outlined element at a
                         time, NEXT on each. marks: [{sel | el, id}] with text from
                         lessons[id][i].
     T45.legend(text)    the key legend grows by one entry.

   Words: CAMPAIGN_LINES.lessons[id] = {title, lines:[], after, gate, remind, btn}
   (the Campaign Planner's, js/campaign-lines.js) over T45.DRAFT[id] (the plan's
   drafts), field by field. {key}, {key2}, {name}, {ability} ... are filled from o.vars.

   Switches: T45.on = false (console only; the ?t45=0 flag was removed in INT-1) turns the module off: every
   lesson is skipped, every gate passes through its test alone, nothing is held.
   T45.sw[id] = false turns one step off. Settings "Lessons: off" (settings().lessons
   === false) does the same for a second run. Self-test: T45.selfTest() (pure).
   ============================================================================ */
(function(){
  'use strict';
  const T = window.T45 = {on: true, sw: {}, K: {remind: 1200, enterAfter: 500}, cur: null, g: null, log: []};
  const $i = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
  const inFight = () => typeof G !== 'undefined' && !!G && !G.over;
  T.lessonsOn = () => { try { return T.on && !(typeof settings === 'function' && typeof META !== 'undefined' && META && settings().lessons === false); } catch (e) { return T.on; } };
  T.is = id => T.lessonsOn() && T.sw[id] !== false;

  /* ---- words ------------------------------------------------------------------ */
  T.DRAFT = {};                                                    // filled by the act scripts (the plan's draft words)
  /* S6 1c: the fixed keys, by name, for lesson words ({kWall}, {kLuck} ...). A lesson's own vars win. Only text that goes through T.fill (lessons) reads them. */
  T.KEYS = {kLeader: 'E', kWall: 'SPACE', kMomentum: 'TAB', kLuck: 'Q', kBurn: 'R', kSwing: 'X', kMap: 'M', kPause: 'ESC', kTrap: 'F', kTrapNext: 'G', kStart: 'ENTER'};
  T.fill = (s, v) => String(s == null ? '' : s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null) ? v[k] : (T.KEYS[k] != null ? T.KEYS[k] : (k === 'families' && window.F34 && F34.families) ? F34.families() : m));   // P23-VOICE F18: {families} (F34.families)
  T.who = w => { const c = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.cast45 && CAMPAIGN_LINES.cast45[w]) || null; return (c && c.name) || (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''); };
  T.text = function(id, vars){
    const L = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.lessons) || {}, a = T.DRAFT[id], b = L[id];
    if (Array.isArray(a) || Array.isArray(b)){                    // a coach-mark set
      const A = Array.isArray(a) ? a : [], B = Array.isArray(b) ? b : [], n = Math.max(A.length, B.length), out = [];
      for (let i = 0; i < n; i++){ const o = Object.assign({}, A[i], B[i]); out.push({title: T.fill(o.title, vars), lines: (o.text || o.lines || []).map(x => T.fill(x, vars)), btn: o.btn, mark: o.mark || o.sel}); }
      return out;
    }
    const o = Object.assign({}, a, b), f = x => x == null ? x : T.fill(x, vars), j = x => Array.isArray(x) ? x.join(' ') : x;
    // the Planner's shape: text[], after[], goal, remind {who, text}, moved, legend, replaces[]
    const rm = o.remind && typeof o.remind === 'object' ? (o.remind.who ? T.who(o.remind.who) + ': “' + o.remind.text + '”' : o.remind.text) : o.remind;
    return {title: f(o.title) || '', lines: (o.text || o.lines || []).map(f), after: f(j(o.after)), gate: String(f(o.goal || o.gate) || '').toUpperCase() || undefined, remind: f(rm), btn: f(o.btn),
            moved: f(o.moved), said: o.said && o.said.text ? {who: T.who(o.said.who), text: f(o.said.text)} : null, legend: f(o.legend), legendRaw: o.legend, replaces: o.replaces || [], step: o.step};
  };

  /* ---- state: per fight on G.t45, else on the save ----------------------------- */
  T.st = function(){
    if (typeof G !== 'undefined' && G){ return G.t45 || (G.t45 = {holds: {}, used: {}, legend: [], done: {}}); }
    if (typeof META !== 'undefined' && META){ return META.t45 || (META.t45 = {holds: {}, used: {}, legend: [], done: {}}); }
    return T._st || (T._st = {holds: {}, used: {}, legend: [], done: {}});
  };
  T.hold = function(){ const s = T.st(); for (const n of arguments) s.holds[n] = true; };
  T.release = function(){ const s = T.st(); for (const n of arguments) delete s.holds[n]; };
  T.held = n => { try { return T.lessonsOn() && !!T.st().holds[n]; } catch (e) { return false; } };
  T.used = function(id){ const s = T.st(); s.used[id] = (s.used[id] || 0) + 1; return s.used[id]; };
  T.usedList = () => Object.keys(T.st().used);
  /* S6 1c: ONE source for an ability's key in lesson words: the rule the card badge is drawn from (ABIL33.keyOf: E the Leader,
     1 to 5 the mates in bar order). T.keysOf(spec) lists the key of every unit on the field with that Specialty, Leader first.
     T.keyOf(spec) is the key a lesson names: a mate's if a mate has it (the lesson is about the mate), else the Leader's;
     T.keyOf(spec, 'leader') is the Leader's only. '' when nobody on the field has it. The old table (ABILITIES[spec].key) is
     read only when the per-character abilities are off. */
  T.keysOf = function(spec){
    try {
      if (window.ABIL33 && ABIL33.live() && typeof G !== 'undefined' && G)
        return [G.leader].concat(G.squad || []).filter(u => u && (u.spec === spec || (u.p && u.p.spec === spec))).map(u => ABIL33.keyOf(u)).filter(k => k && k !== '0');
    } catch (e) {}
    const k = typeof ABILITIES !== 'undefined' && ABILITIES[spec] && ABILITIES[spec].key; return k ? [String(k)] : [];
  };
  T.keyOf = function(spec, who){ const ks = T.keysOf(spec);
    if (who === 'leader') return ks[0] === 'E' ? 'E' : (window.ABIL33 && ABIL33.live() ? '' : ks[0] || '');
    return ks.find(k => k !== 'E') || ks[0] || ''; };
  /* the legend after the hand-over: the 'you' line, and E with the Leader's own ability by name */
  T.legendYou = function(spec){ const t = T.text('you').legend; if (t) T.legend(t);
    if (spec && typeof ABILITIES !== 'undefined' && ABILITIES[spec]) T.legend('{key} ' + ABILITIES[spec].name, spec); };
  /* B1 and B5 (sign-off): the 'you' card's {key} is the Leader's (the same vars object the gate reads); the Cleric card's {n} is the hire's Magic */
  T.lessonVars = function(id, o){
    if (!o) return;
    if (id === 'you' && o.vars && window.ABIL33 && typeof G !== 'undefined' && G && G.leader) o.vars.key = ABIL33.keyOf(G.leader);
    if (id === 'cleric' && o.face && !(o.vars && o.vars.n != null))
      o.vars = Object.assign({}, o.vars, {n: typeof mateStats === 'function' ? mateStats(o.face).magic : (o.face.magic | 0)});
  };
  T.legend = function(t, spec){ const s = T.st(); if (!t) return;
    if (spec){ if (!s.legend.some(x => x && x.spec === spec && x.t === t)) s.legend.push({t, spec}); return; }   // an ability entry: its key is read when drawn, never stored (keys move when the squad changes)
    if (!s.legend.includes(t)) s.legend.push(t); };
  T.legendList = function(){ const out = [], ab = [];
    for (const x of T.st().legend){
      if (typeof x === 'string'){ out.push(x); continue; }
      const a = typeof ABILITIES !== 'undefined' && ABILITIES[x.spec]; if (!a || !(G.abil && G.abil[x.spec])) continue;
      for (const key of T.keysOf(x.spec)){ const t = T.fill(x.t, {key}); if (!ab.includes(t) && !out.includes(t)) ab.push(t); } }   // S6 1c: one entry per unit that has it, with its badge key; nobody has it: off the legend
    const k = t => /^\d/.test(t) ? t.charAt(0) : '';               // in key order: words first, then 1, 2, 3 ... 7 8 9
    return out.concat(ab).map((t, i) => [t, i]).sort((p, q) => k(p[0]) < k(q[0]) ? -1 : k(p[0]) > k(q[0]) ? 1 : p[1] - q[1]).map(p => p[0]); };
  T.done = id => !!T.st().done[id];
  /* K54 (Planner ruling ux48.k54): in the Founding a lesson card shows once per Founding, kept in the Founding save
     (META.f34.l45), not per fight. A retry shows no card; a gated step shows one retryNote line, its test still counts
     and the game is not held. Outside the Founding nothing changes. */
  T.seenBook = function(){ try { return typeof META !== 'undefined' && META && META.f34 && window.F34 && typeof F34.active === 'function' && F34.active() ? (META.f34.l45 || (META.f34.l45 = {})) : null; } catch (e) { return null; } };
  T.seen = id => { const b = T.seenBook(); return !!(b && b[id]); };
  /* s6-1i (GD 0b52d185): with lessons on, an idea no lesson has taught yet is not stated as text. Charge waits for its lesson (Act II); Long range is not drawn on the road. */
  T.holdCharge = () => { try { return T.lessonsOn() && !!(window.F34 && F34.active && F34.active()) && !T.seen('charge'); } catch (e) { return false; } };
  T.holdTipsoff = () => { try { return T.lessonsOn() && !!(typeof G !== 'undefined' && G && G.f45 && G.f45.a && !G.f45.a.camp); } catch (e) { return false; } };
  T.holdLong = () => { try { return T.lessonsOn() && (!!(typeof G !== 'undefined' && G && G.f45 && G.f45.a && !G.f45.a.camp) || (!!(window.F34 && F34.active && F34.active()) && !T.seen('cover') && !T.coverGaveUp)); } catch (e) { return false; } };
  T.markSeen = function(id){ const b = T.seenBook(); if (!b || b[id]) return; b[id] = true; try { if (typeof saveMeta === 'function') saveMeta(); } catch (e) {} };
  T.retryNote = function(tx){ const w = window.CAMPAIGN_LINES && CAMPAIGN_LINES.ux48 && CAMPAIGN_LINES.ux48.k54, t = (w && w.retryNote) || 'You know this one: {lesson}.';
    const name = (tx && (tx.title || (tx.gate && tx.gate.charAt(0) + tx.gate.slice(1).toLowerCase()))) || ''; return name ? T.fill(t, {lesson: name}) : ''; };
  // the old one-line tips a lesson stands in for never fire beside it
  T.quiet = function(keys){ try { if (!keys || typeof META === 'undefined' || !META) return; META.tipsSeen = META.tipsSeen || {}; T.quieted = T.quieted || {}; for (const k of keys) T.quieted[k] = true; } catch (e) {} };

  /* ---- keep: the lesson goes to Field Notes (the tip table and META.tipsSeen) ---- */
  T.keep = function(id, tx){
    try {
      const k = 'L45_' + id;
      if (typeof TIPS !== 'undefined') TIPS[k] = (tx.title ? tx.title + '. ' : '') + tx.lines.join(' ');
      if (typeof META !== 'undefined' && META){ META.tipsSeen = META.tipsSeen || {}; if (!META.tipsSeen[k]){ META.tipsSeen[k] = true; if (typeof saveMeta === 'function') saveMeta(); } }
    } catch (e) {}
  };

  /* ---- the card and the outline (DOM, over the canvas) -------------------------- */
  T.dom = function(){
    if (T.card && document.body.contains(T.card)) return;
    const st = document.createElement('style');
    st.textContent = '#t45-card{position:fixed;z-index:9000;box-sizing:border-box;max-width:min(416px,calc(100vw - 20px));min-width:min(296px,calc(100vw - 20px));background:#1c140c;border:2px solid #d9b45a;border-radius:6px;padding:14px 16px 12px;color:#ecdcb8;font:15px/1.45 Georgia,serif;box-shadow:0 6px 24px rgba(0,0,0,.7)}'
      + '#t45-card h3{margin:0 0 6px;font:bold 18px Georgia,serif;color:#ffd860}#t45-card p{margin:0 0 6px}#t45-card .t45-n{float:right;color:#a08a5c;font-size:14px}'
      + '#t45-card button{margin-top:6px;float:right}#t45-card .t45-said{font-style:italic;color:#f6ead0;min-height:56px;overflow:hidden}#t45-card .t45-said img{float:left;width:48px;height:54px;object-fit:cover;margin:0 10px 2px 0;border:1px solid #d9b45a;image-rendering:pixelated}'
      + '#t45-ring{box-sizing:border-box;position:fixed;z-index:8999;pointer-events:none;border:3px solid #ffd860;border-radius:8px;box-shadow:0 0 0 2px #2a1a08,0 0 14px 2px rgba(255,216,96,.7);animation:t45p 1.1s ease-in-out infinite}'
      + '@keyframes t45p{50%{box-shadow:0 0 0 2px #2a1a08,0 0 22px 7px rgba(255,216,96,.9)}}'
      /* S6 1i D: 440 px wide at 1280 to 520 at 1920; padding 16 to 24; heading 17 to 20; body 15 to 17; the button bottom right */
      + '#t45-card.l1i{width:clamp(440px,calc(440px + (100vw - 1280px)*.125),520px);max-width:calc(100vw - 20px);min-width:0;padding:clamp(16px,calc(16px + (100vw - 1280px)*.0125),24px);font-size:clamp(15px,calc(15px + (100vw - 1280px)*.003125),17px)}'
      + '#t45-card.l1i h3{font-size:clamp(17px,calc(17px + (100vw - 1280px)*.0046875),20px)}#t45-card.l1i::after{content:"";display:block;clear:both}#t45-card.l1i button{margin-bottom:0}';
    document.head.appendChild(st);
    T.card = document.createElement('div'); T.card.id = 't45-card'; T.card.style.display = 'none';
    T.ring = document.createElement('div'); T.ring.id = 't45-ring'; T.ring.style.display = 'none';
    document.body.appendChild(T.ring); document.body.appendChild(T.card);
  };
  // a target's rectangle in CSS pixels, or null
  T.rectOf = function(o){
    try {
      if (!o) return null;
      if (o.el || o.sel){ const el = o.el || document.querySelector(o.sel); if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); if (!(r.width || r.height)) return null; const e2 = o.sel2 && document.querySelector(o.sel2), q = e2 && e2.getBoundingClientRect();   // sel2: one ring round both
        if (q && (q.width || q.height)){ const x0 = Math.min(r.left, q.left), y0 = Math.min(r.top, q.top); return {x: x0, y: y0, w: Math.max(r.right, q.right) - x0, h: Math.max(r.bottom, q.bottom) - y0}; }
        return {x: r.left, y: r.top, w: r.width, h: r.height}; }
      const cv = typeof ctx !== 'undefined' && ctx && ctx.canvas; if (!cv) return null;
      const b = cv.getBoundingClientRect(), kx = b.width / VW, ky = b.height / VH;
      let q = null;
      /* S6 1d: the Deck is drawn in the HUD scale (ux.js hudK: 1.42 at 1920 x 1080), so its rects are not in canvas units. DECK.vw and
         DECK.vh are the size it was last drawn in: a Deck rect goes to screen px by the canvas's CSS size over those, not over VW, VH. */
      if ((o.hud || o.deck) && window.DECK){
        let top;                                              // a part of a card: the card's own top, so the lesson card sits clear of the whole card
        if (o.deck) q = o.deck();
        else if (DECK.rects){ const h = o.hud, spOf = u => u && (u.spec || (u.p && u.p.spec));
          q = DECK.rects.find(r => r.kind === h.kind && (h.spec === undefined || r.spec === h.spec) && (h.m === undefined || r.m === h.m));
          if (!q && h.kind === 'ability') q = DECK.rects.find(r => r.kind === 'abil33' && spOf(r.u) === h.spec);   // the badge on the card (F-33) took the place of the old button
          if (q && h.part){ top = q.y; q = q[h.part] || null; } }
        if (!q || !(DECK.vw > 0) || !(DECK.vh > 0)) return null;
        const dx = b.width / DECK.vw, dy = b.height / DECK.vh;
        const r = {x: b.left + q.x * dx, y: b.top + q.y * dy, w: q.w * dx, h: q.h * dy}; if (top !== undefined) r.clearY = b.top + top * dy;
        return r;
      }
      if (o.rect) q = o.rect();
      else if (o.world && typeof G !== 'undefined' && G && G.leader){
        const sp = camToScreen(o.world.x, o.world.y - (o.up || 0)), R = o.r || 44;   /* A2: the centre follows the world zoom; the ring keeps its screen size */
        q = {x: sp.x - R, y: sp.y - R, w: 2 * R, h: 2 * R};
      }
      if (!q) return null;
      return {x: b.left + q.x * kx, y: b.top + q.y * ky, w: q.w * kx, h: q.h * ky};
    } catch (e) { return null; }
  };
  /* S6 1i D (audits/specs/s6-1-layout.md): the card takes the first of three slots that is 16 px clear of the thing it points at,
     the story box, the legend and (off the field) any button: left (left edge on the goal box's left edge, under it), right (right
     edge on IN SIGHT's right edge, under it), centre (on the screen axis, under the top-centre slot). No clear slot: the one that
     covers least, and T.log says so. All in CSS px. T.slot is the slot last used ('left', 'right', 'centre', or with '!' when not clear). */
  T.place1i = function(r, cw, ch){
    /* UX 1i-02: over a story card there is no free slot at 1280, so the card sits in the story card, in a gap kept open above its button row */
    let slot = document.getElementById('t45-slot');
    const row = inFight() ? null : document.querySelector('#create-inner > .f34-sc ~ .f34-row');
    /* UX 22 Nov (D2): on the debrief the card sits in a slot straight after the ringed line (o.after, else the target), left edge on the panel's text edge, so it never covers the panel's text */
    if (!inFight() && !(row && row.offsetParent)){ try {
      const o = T.cur && T.cur.o || {}, dsc = document.querySelector('#screen-debrief:not(.hidden)'), inner = dsc && dsc.querySelector('#debrief-inner'),
        tg = inner && (o.after ? document.querySelector(o.after) : (o.el || (o.sel2 && document.querySelector(o.sel2)) || (o.sel && document.querySelector(o.sel))));
      if (tg && inner.contains(tg) && tg !== inner && dsc.scrollHeight > 0){
        const ae = tg.closest('.u4-r') || tg, pr = ae.parentNode;
        /* UX D2-1: a target too tall to hold the card under it on screen (the 394 px picker): no slot; the debrief scrolls to the target's top at 8 px under the top and the card sits 8 px above the bottom of the screen, left edge on the target's, over the lower part of the ring */
        { const vr0 = dsc.getBoundingClientRect(), th = ae.getBoundingClientRect().height, ch0 = T.card.offsetHeight + 4;
          T.dtall = th + 10 + ch0 + 16 > vr0.height;
          if (T.dtall){ if (slot){ slot.remove(); slot = null; } const er0 = ae.getBoundingClientRect(), w0 = Math.min(cw, innerWidth - er0.left - 10); T.card.style.width = w0 + 'px';
            T.slot = 'debrief-tall'; Object.assign(T.card.style, {left: Math.round(er0.left) + 'px', top: Math.round(Math.min(vr0.bottom, innerHeight) - 8 - T.card.offsetHeight) + 'px', clipPath: ''}); return; } }
        let chg = false; if (!slot || slot.previousSibling !== ae){ chg = true; if (slot) slot.remove(); slot = document.createElement('div'); slot.id = 't45-slot'; slot.style.cssText = 'display:block;grid-column:1/-1;align-self:stretch;flex:none;margin-top:10px'; pr.insertBefore(slot, ae.nextSibling); }
        const w = Math.min(cw, slot.offsetWidth || cw); T.card.style.width = w + 'px'; const sh = T.card.offsetHeight + 4 + 'px'; if (slot.style.height !== sh){ slot.style.height = sh; chg = true; } if (chg) T.settle(o);
        const q = slot.getBoundingClientRect(), vr = dsc.getBoundingClientRect(), ct = Math.max(0, Math.ceil(vr.top - q.top)), cb = Math.max(0, Math.ceil(q.top + T.card.offsetHeight - vr.bottom));
        T.slot = 'debrief'; Object.assign(T.card.style, {left: Math.round(q.left) + 'px', top: Math.round(q.top) + 'px', clipPath: ct || cb ? 'inset(' + ct + 'px 0 ' + cb + 'px 0)' : ''}); return; }
    } catch (e) {} }
    /* UX 22 Nov (W1): o.after names the thing the card follows; the slot then sits straight after it, so the card and its target can both be in view */
    const af = T.cur && T.cur.o && T.cur.o.after, ae = af && document.querySelector(af), host = ae && ae.parentNode && row && row.parentNode.contains(ae) ? ae.parentNode : null;
    if (row && row.offsetParent){ const fresh = !slot || slot.parentNode !== (host || row.parentNode);
      if (fresh){ if (slot) slot.remove(); slot = document.createElement('div'); slot.id = 't45-slot'; if (host) host.insertBefore(slot, ae.nextSibling); else row.parentNode.insertBefore(slot, row); }
      T.card.style.width = slot.offsetWidth + 'px'; const sh = T.card.offsetHeight + 4 + 'px', grew = slot.style.height !== sh; slot.style.height = sh;   // 4: the card's shadow
      if (fresh || grew) try { slot.scrollIntoView({block: 'nearest'}); } catch (e) {}
      const q = slot.getBoundingClientRect(); T.slot = 'card';
      /* UX 1i-09: the story card's body scrolls; the lesson card shows only where its slot does (not over the pinned button row) */
      let cut = ''; try { const a = row.parentNode.getBoundingClientRect().top, z = row.getBoundingClientRect().top, ct = Math.max(0, Math.ceil(a - q.top)), cb = Math.max(0, Math.ceil(q.top + T.card.offsetHeight - z)); if (ct || cb) cut = 'inset(' + ct + 'px 0 ' + cb + 'px 0)'; } catch (e) {}
      Object.assign(T.card.style, {left: Math.round(q.left) + 'px', top: Math.round(q.top) + 'px', clipPath: cut}); return; }
    T.card.style.clipPath = '';
    if (slot){ slot.remove(); T.card.style.width = ''; }
    const W = window.innerWidth, H = window.innerHeight, f = Math.max(0, Math.min(1, (W - 1280) / 640)), gap = 16 + 8 * f, m = 13 + 5 * f, D = window.DECK;
    let b = null; try { b = ctx.canvas.getBoundingClientRect(); } catch (e) {}
    const css = q => q && b && D && D.vw > 0 ? {x: b.left + q.x * b.width / D.vw, y: b.top + q.y * b.height / D.vh, w: q.w * b.width / D.vw, h: q.h * b.height / D.vh} : null;
    const fight = inFight(), ob = fight ? css(D && D.objAt) : null, si = fight ? css(D && D.sightAt) : null;
    let bar = 0; if (!fight) try { const tb = document.getElementById('topbar'); if (tb && tb.getClientRects().length) bar = tb.getBoundingClientRect().bottom; } catch (e) {}   // off the field the slots start under the top bar
    let top0 = ob ? ob.y + ob.h + gap : bar ? bar + gap : m + 2 + 7 * f;
    try { const dh = !fight && document.querySelector('#screen-debrief:not(.hidden) #debrief-inner > h1'); if (dh){ const hb = dh.getBoundingClientRect(); if (hb.bottom > 0 && hb.bottom + gap > top0) top0 = hb.bottom + gap; } } catch (e) {}   // UX D2: under the debrief's title, not over it
    const slots = [['left', ob ? ob.x : m, top0], ['right', (si ? si.x + si.w : W - m) - cw, si ? si.y + si.h + gap : top0], ['centre', W / 2 - cw / 2, top0]];
    const obst = []; if (r) obst.push({x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12});
    if (fight && D && D.legendRect) obst.push(D.legendRect);
    try { document.querySelectorAll(fight ? '#create-inner .log' : '#create-inner .log, button, .btn').forEach(el => { if (T.card.contains(el) || !el.offsetParent) return; const q = el.getBoundingClientRect(); if (q.width && q.height) obst.push({x: q.left, y: q.top, w: q.width, h: q.height}); }); } catch (e) {}
    const over = (x, y, p) => obst.reduce((s, o) => s + Math.max(0, Math.min(x + cw, o.x + o.w) - Math.max(x, o.x) + 2 * p) * Math.max(0, Math.min(y + ch, o.y + o.h) - Math.max(y, o.y) + 2 * p), 0);   // area shared with the boxes, each grown by p
    let best = null;
    for (const s of slots){ const x = Math.max(10, Math.min(W - cw - 10, s[1])), y = Math.max(10, Math.min(H - ch - 10, s[2])), v = over(x, y, 16); if (!best || v < best.v) best = {n: s[0], x, y, v}; if (!v) break; }
    if (best.v) for (const x of [10, W - cw - 10]){ if (!over(x, best.y, 0)){ best = {n: x === 10 ? 'left' : 'right', x, y: best.y, v: best.v}; break; } }   // no slot 16 px clear: hard against the screen edge, if the card then covers nothing (short of 16 px, and logged)
    const nm = best.n + (best.v ? '!' : '');
    if (best.v && T.slot !== nm) try { T.log.push('lesson card: no clear slot for ' + ((T.cur && T.cur.id) || '?') + ', used ' + best.n); } catch (e) {}
    T.slot = nm;
    Object.assign(T.card.style, {left: Math.round(best.x) + 'px', top: Math.round(best.y) + 'px'});
  };
  T.place = function(){
    const c = T.cur; if (!c || !T.card) return;
    /* UX 22 Nov (D1): one overlay at a time. While the dice tray shows or a roll is queued the card and ring are hidden; they come back 300 ms after */
    const busy = typeof DICE_ON !== 'undefined' && (DICE_ON || (typeof DICE_Q !== 'undefined' && DICE_Q.length));
    if (busy) T.diceT = Date.now();
    if (busy || (T.diceT && Date.now() - T.diceT < 300)){ T.card.style.visibility = 'hidden'; if (T.ring) T.ring.style.visibility = 'hidden'; return; }
    T.diceT = 0; T.card.style.visibility = ''; if (T.ring) T.ring.style.visibility = '';
    /* UX D2-4: on a debrief the ledger pass rebuilds the rows a moment after the lesson opens; the card and ring stay hidden until it has (at most 1.5 s), so the card never shows in one place and then jumps */
    try { const di = !inFight() && document.querySelector('#screen-debrief:not(.hidden) #debrief-inner'); if (di && window.__u4led && typeof LEDGER !== 'undefined' && LEDGER.on !== false && !di.querySelector('.u4-led')){ if (!T.ledT) T.ledT = Date.now(); if (Date.now() - T.ledT < 1500){ T.card.style.visibility = 'hidden'; if (T.ring) T.ring.style.visibility = 'hidden'; return; } } else T.ledT = 0; } catch (e) {}
    const r = T.rectOf(c.o), W = window.innerWidth, H = window.innerHeight, cw = T.card.offsetWidth || 320, ch = T.card.offsetHeight || 140;
    /* UX 22 Nov: a debrief lesson whose target matches nothing waits hidden (it shows when the target appears); it never falls back to the top left over the cards */
    try { if (!r && !inFight() && c.o && c.o.sel && document.querySelector('#screen-debrief:not(.hidden) #debrief-inner')){
      if (!c.missT) c.missT = Date.now();
      if (Date.now() - c.missT > 3000){   /* UX 22 Nov: no target in 3 s, so close it unseen (not marked seen: it teaches the next time its target shows) so a hidden card never holds the queue */
        console.warn('T45 no target', c.id, c.o.sel); T.cur = null; T.hide(); if (c.was === false && typeof G !== 'undefined' && G && !(window.BRIEFING && BRIEFING.up) && !document.getElementById('a1r')) G.paused = false;   /* LE: not while the briefing or the resume card is up */   /* P23-BUG-3: lift only a pause this card set; never put back one that ended under it */
        const then = c.marks ? c.done : c.o.then; if (then) try { then(false); } catch (e) {}
        if (!T.cur && T.queue && T.queue.length){ const [id, o] = T.queue.shift(); T.lesson(id, o); } return; }
      T.card.style.visibility = 'hidden'; if (T.ring) T.ring.style.display = 'none'; return; } else c.missT = 0; } catch (e) {}
    if (window.L1I !== false){
      const trapT = c.o && c.o.world && c.o.world.lesson && window.TRAP2E && TRAP2E.live();   // 2e-02: the trap draws its own outline; no second ring on it
      const pd = c.o && c.o.pad != null ? c.o.pad : 6;   // U1: the contract's ring hugs the card (pad 4)
      if (r && !trapT) Object.assign(T.ring.style, {display: 'block', left: (r.x - pd) + 'px', top: (r.y - pd) + 'px', width: (r.w + 2 * pd) + 'px', height: (r.h + 2 * pd) + 'px'}); else T.ring.style.display = 'none';
      /* UX 1i-09: a ring on a thing in the story card's scrolling body is cut where the body is (not drawn over the pinned button row) */
      let rc = ''; try { const sc = document.getElementById('create-inner'), row = sc && sc.querySelector(':scope > .f34-row'), el = c.o && (c.o.el || (c.o.sel && document.querySelector(c.o.sel)));
        if (r && row && el && sc.contains(el) && !row.contains(el)){ const bs = el.closest('.b45-sc'), h1 = !bs && sc.querySelector(':scope > h1'), sl = !bs && sc.querySelector(':scope > #t45-slot'), a = Math.max((bs || sc).getBoundingClientRect().top, h1 ? h1.getBoundingClientRect().bottom : 0), z = bs ? bs.getBoundingClientRect().bottom : Math.min(row.getBoundingClientRect().top, sl && !sl.contains(el) ? sl.getBoundingClientRect().top : 1e9),   /* G2: also cut at the sticky title's bottom and the lesson slot's top */   /* UX 2g-14: in the Campfire the ring is cut where the scrolling body is */
           ct = Math.ceil(a - (r.y - 6)), cb = Math.ceil(r.y + r.h + 6 - z);
          if (ct > 0 || cb > 0) rc = 'inset(' + (ct > 0 ? ct : -20) + 'px -20px ' + (cb > 0 ? cb : -20) + 'px -20px)'; if (r.y + r.h <= a || r.y >= z) T.ring.style.display = 'none'; } } catch (e) {}
      T.ring.style.clipPath = rc;
      T.place1i(r, cw, ch); return; }
    if (r){
      Object.assign(T.ring.style, {display: 'block', left: (r.x - 6) + 'px', top: (r.y - 6) + 'px', width: (r.w + 12) + 'px', height: (r.h + 12) + 'px'});
      let x = r.x + r.w + 18, y = r.y + r.h / 2 - ch / 2;
      if (c.o.hud || r.y > H * 0.62){ x = -1e9; }                    // a thing on the deck: the card goes above it, never on the bar it names
      else if (x + cw > W - 10) x = r.x - cw - 18;                       // no room on the right: the left
      if (x < 10){ x = Math.min(W - cw - 10, Math.max(10, r.x + r.w / 2 - cw / 2)); y = (r.clearY !== undefined ? r.clearY : r.y) - ch - 18; if (y < 10) y = r.y + r.h + 18; }
      y = Math.min(H - ch - 10, Math.max(10, y));
      Object.assign(T.card.style, {left: x + 'px', top: y + 'px'});
    } else {
      T.ring.style.display = 'none';
      Object.assign(T.card.style, {left: Math.max(10, (W - cw) / 2) + 'px', top: Math.max(10, H * 0.3 - ch / 2) + 'px'});
    }
  };
  T.show = function(tx, n){
    T.dom();
    let face = ''; try { const fc = T.cur && T.cur.o && T.cur.o.face; face = !fc ? '' : typeof fc === 'string' ? fc : portraitURL(fc, false); } catch (e) {}
    if (tx.said && tx.said.text){ (T.saidShown = T.saidShown || []).push(tx.said.text); }   // UX Q81: the tip line beside a banner skips a speech line its card has just shown
    T.card.innerHTML = (n ? `<span class="t45-n">${n}</span>` : '') + `<h3>${esc(tx.title)}</h3>` + (tx.said ? `<p class="t45-said">${face ? `<img src="${face}" alt="">` : ''}${esc(tx.said.who)}: “${esc(tx.said.text)}”</p>` : '') + tx.lines.map(l => `<p>${esc(l)}</p>`).join('')
      + `<button class="btn gold" id="t45-ok" onclick="T45.next()">${esc(tx.btn || (T.cur && T.cur.marks && T.cur.i < T.cur.marks.length - 1 ? 'NEXT' : 'GOT IT'))}</button>`;
    T.card.classList.toggle('l1i', window.L1I !== false);
    T.card.style.display = 'block'; T.place();
    clearInterval(T.iv); T.iv = setInterval(T.place, 120);         // the pane may be hidden: no rAF
  };
  T.hide = function(){ clearInterval(T.iv); try { const s = document.getElementById('t45-slot'); if (s){ const sc0 = s.closest('#create-inner'); s.remove(); T.card.style.width = ''; if (sc0) sc0.scrollTop = 0; }   /* QA 9fc47306: the card returns to its top, so nothing stays under the sticky title */ } catch (e) {} T.diceT = 0; T.dtall = false; if (T.card){ T.card.style.width = ''; T.card.style.visibility = ''; T.card.style.display = 'none'; T.card.style.clipPath = ''; } if (T.ring) T.ring.style.display = 'none'; };

  // a new fight starts clean: no card, gate or queue left over from the last one
  T.reset = function(){ T.cur = null; T.g = null; T.queue = []; T.hide(); };
  /* ---- lesson -------------------------------------------------------------------- */
  T.lesson = function(id, o){
    try { T.lessonVars(id, o); } catch (e) {}
    o = o || {};
    const tx = T.text(id, o.vars);
    if (!T.is(id) || (!tx.title && !tx.lines.length)){ T.st().done[id] = true; if (o.then) o.then(false); return false; }
    if (T.seen(id)){ T.st().done[id] = true; T.log.push('lesson seen ' + id); if (o.then) o.then(false); return false; }   // K54: once per Founding
    if (T.cur){ (T.queue = T.queue || []).push([id, o]); return true; }   // one card at a time
    if (o.moved && tx.moved) tx.lines.push(tx.moved);              // a joining mate changed the number keys
    T.quiet(tx.replaces);
    /* P23-BUG-6 (F22): a lesson that opens under the contract briefing waits for CONTINUE; its field target (a mate, the deck) is under the overlay, and the briefing holds its own pause */
    if (window.BRIEFING && BRIEFING.up){ (T.briefQ = T.briefQ || []).push([id, o]); if (!T.briefIv) T.briefIv = setInterval(() => { if (window.BRIEFING && BRIEFING.up) return; clearInterval(T.briefIv); T.briefIv = 0; const q = T.briefQ || []; T.briefQ = []; q.forEach(([i, p]) => T.lesson(i, p)); }, 150); return true; }
    if (typeof DICE_ON !== 'undefined' && (DICE_ON || (typeof DICE_Q !== 'undefined' && DICE_Q.length))){ setTimeout(() => T.lesson(id, o), 300); return true; }   // UX 22 Nov: one overlay at a time; wait for the dice tray, then open about 300 ms after it closes
    T.cur = {id, o, tx, t: Date.now(), was: inFight() ? !!G.paused : null};
    if (inFight()) G.paused = true;
    T.keep(id, tx); T.log.push('lesson ' + id);
    T.settle(o); T.show(tx); T.settle(o); setTimeout(() => T.settle(o), 150);
    return true;
  };
  T.next = function(){
    const c = T.cur; if (!c) return;
    if (c.marks && c.i < c.marks.length - 1){ c.i++; c.o = c.marks[c.i]; T.show(c.texts[c.i], (c.i + 1) + ' / ' + c.marks.length); return; }
    T.cur = null; T.hide();
    T.st().done[c.id] = true; T.markSeen(c.id);
    if (c.was === false && typeof G !== 'undefined' && G && !(window.BRIEFING && BRIEFING.up) && !document.getElementById('a1r')) G.paused = false;   /* LE: not while the briefing or the resume card is up */   /* P23-BUG-3: lift only a pause this card set; never put back one that ended under it */
    try { if (typeof SFX !== 'undefined') SFX.play('pick'); } catch (e) {}
    const then = c.marks ? c.done : c.o.then;
    if (then) try { then(true); } catch (e) { console.warn('T45 then', c.id, e); }
    if (!T.cur && T.queue && T.queue.length){ const [id, o] = T.queue.shift(); T.lesson(id, o); }
  };
  // U1: scroll a story card's body so the marked thing's top edge sits under the title and the lesson card shows whole above the button row; the card wins if both cannot fit
  T.settle = function(m){ try { const el = m && (m.el || (m.sel && document.querySelector(m.sel))), sc = el && el.closest('#create-inner');
    if (el && !sc){   // UX D2: a debrief lesson scrolls the report the least it can, so its target is in view (the card sits beside the panel)
      const dc = el.closest('#screen-debrief'); if (dc && dc.scrollHeight > dc.clientHeight){ const cr = dc.getBoundingClientRect(), er = el.getBoundingClientRect(), up = er.top - (cr.top + 8);
        if (up < 0) dc.scrollTop += up; else if (er.bottom > cr.bottom - 8) dc.scrollTop += Math.min(er.bottom - (cr.bottom - 8), up);
        if (T.dtall){ const e3 = el.closest('.u4-r') || el, d3 = e3.getBoundingClientRect().top - (cr.top + 8); if (Math.abs(d3) > 1) dc.scrollTop += d3; return; }   // D2-1: a tall target sits 8 px under the top
        const dsl = document.getElementById('t45-slot');   // D2: the card's slot follows the target: scroll the least that keeps the slot whole, never past the target's top at 8 px under the top
        if (dsl && dc.contains(dsl)){ const sb = dsl.getBoundingClientRect().bottom, e2 = el.getBoundingClientRect(), room = e2.top - (cr.top + 8); if (sb > cr.bottom - 8 && room > 0) dc.scrollTop += Math.min(sb - (cr.bottom - 8), room); } }
      return; }
    if (!sc || sc.scrollHeight <= sc.clientHeight) return;
    const h = sc.querySelector(':scope > h1'), slot = sc.querySelector('#t45-slot'), row = sc.querySelector(':scope > .f34-row');
    const top = h ? h.getBoundingClientRect().bottom + 8 : sc.getBoundingClientRect().top, gap = el.getBoundingClientRect().top - top;
    // UX 22 Nov (b6 ruling): scroll the least it can. Top hidden: up until its top is 8 px under the title. Bottom hidden: down until it sits 8 px above the tip card, but never past its top at 8 px under the title (the tip card wins, the ring is cut).
    const aft = slot && slot.parentNode !== sc;   // W1: the slot follows its target: both must be whole above the button row
    if (gap < 0) sc.scrollTop += gap;
    else if (aft && row){ const hid = slot.getBoundingClientRect().bottom - (row.getBoundingClientRect().top - 8); if (hid > 0) sc.scrollTop += Math.min(hid, gap); }
    else { const lim = (slot ? slot.getBoundingClientRect().top : row ? row.getBoundingClientRect().top : innerHeight) - 8, hid = el.getBoundingClientRect().bottom - lim; if (hid > 0) sc.scrollTop += Math.min(hid, gap); }
    if (slot && row){ const over = slot.getBoundingClientRect().bottom - row.getBoundingClientRect().top; if (over > 0) sc.scrollTop += over; }   // UX 22 Nov (W1 rule): the card is always whole above the button row, and wins over the 8 px under the title (the ring is cut at the title)
  } catch (e) {} };
  // coach marks on a menu screen
  T.coach = function(id, marks, o){
    o = o || {};
    const texts = T.text(id, o.vars);
    if (!T.is(id) || !Array.isArray(texts) || !texts.length || !marks || !marks.length){ T.st().done[id] = true; if (o.then) o.then(false); return false; }
    if (T.seen(id)){ T.st().done[id] = true; T.log.push('coach seen ' + id); if (o.then) o.then(false); return false; }   // K54
    const n = Math.min(marks.length, texts.length);
    if (typeof DICE_ON !== 'undefined' && (DICE_ON || (typeof DICE_Q !== 'undefined' && DICE_Q.length))){ setTimeout(() => T.coach(id, marks, o), 300); return true; }
    T.cur = {id, marks: marks.slice(0, n), texts: texts.slice(0, n), i: 0, o: marks[0], done: o.then, was: inFight() ? !!G.paused : null, t: Date.now()};   // UX 22 Nov: no coach mark over the dice tray
    if (inFight()) G.paused = true;
    texts.slice(0, n).forEach((tx, i) => T.keep(id + '_' + (i + 1), tx)); T.log.push('coach ' + id);
    T.settle(marks[0]);   // U1: the ringed thing's top edge is in view under the sticky title, and the card's button above the pinned row
    T.show(texts[0], n > 1 ? '1 / ' + n : '');   // one card: no counter
    T.settle(marks[0]); setTimeout(() => T.settle(marks[0]), 150);
    return true;
  };
  // a lesson cannot be skipped by accident: ESC, P and M do nothing while a card is open; Enter or Space presses the button after a moment
  window.addEventListener('keydown', function(e){
    if (!T.cur) return;
    const k = e.key;
    if (k === 'Escape' || k === 'p' || k === 'P' || k === 'm' || k === 'M' || k === 'Tab'){ e.stopImmediatePropagation(); e.preventDefault(); return; }
    if ((k === 'Enter' || k === ' ') && Date.now() - T.cur.t > T.K.enterAfter){ e.stopImmediatePropagation(); e.preventDefault(); T.cur.t = Date.now(); T.next(); return; }
    if (typeof G !== 'undefined' && G) e.stopImmediatePropagation();   // no ability or Luck key reaches the fight behind the card
  }, true);
  if (typeof togglePause === 'function'){ const f = togglePause; togglePause = function(){ if (T.cur) return; return f.apply(this, arguments); }; }

  /* ---- gate: the gold "do it" line -------------------------------------------------- */
  T.gate = function(id, test, o){
    o = o || {};
    const tx = T.text(id, o.vars);
    T.g = {id, test, o, tx, t0: (typeof G !== 'undefined' && G) ? G.frame : 0, n: 0, show: T.is(id)};
    if (T.g.show && T.seen('g_' + id)){ T.g.show = false; T.g.retry = true; const t = T.retryNote(tx); if (t && typeof note === 'function') note(t); }   // K54: a retry, one line
    T.log.push('gate ' + id);
    return T.g;
  };
  T.tick = function(){
    const g = T.g; if (!g || T.cur) return;
    let ok = false; try { ok = !!g.test(); } catch (e) { console.warn('T45 gate', g.id, e); ok = true; }   // a broken test never blocks the story
    if (!ok && g.o.spec && g.o.vars && g.o.vars.key != null){        // S6 1c: an open goal line follows the badge when the squad changes
      const k = T.keyOf(g.o.spec, g.o.lead ? 'leader' : undefined); if (k && k !== g.o.vars.key){ g.o.vars.key = k; g.tx = T.text(g.id, g.o.vars); } }
    if (ok){
      T.g = null; T.w = null; T.st().done['g_' + g.id] = true; T.log.push('gate done ' + g.id); if (g.show) T.markSeen('g_' + g.id);
      if (g.show && g.tx.after && !g.o.noAfter && typeof note === 'function') note(g.tx.after);
      if ((g.show || g.retry) && g.tx.legend){ if (g.o.spec && /\{key\}/.test(g.tx.legendRaw || '')) T.legend(g.tx.legendRaw, g.o.spec); else T.legend(g.tx.legend); }
      if (g.o.then) try { g.o.then(); } catch (e) { console.warn('T45 gate then', g.id, e); }
      return;
    }
    if (g.show && !g.wait && g.tx.remind && typeof G !== 'undefined' && G && G.frame - g.t0 >= T.K.remind * (g.n + 1)){ g.n++; if (typeof note === 'function') note(g.tx.remind); }
  };
  if (typeof updateContract === 'function'){ const f = updateContract; updateContract = function(){ const r = f.apply(this, arguments); try { if (T.g) T.tick(); } catch (e) {} return r; }; }

  /* ---- S6 1c criterion 6: the right key did nothing, so one line says why ------------- */
  // Words: Narrative Designer, audits/narrative/s6-1c-1f-words.md (2ac98d0, cold read passed). No catch-all line: a block with no line here shows nothing.
  T.WHY = {far: 'Too far. Move closer, then press {key} again.', cool: 'Not ready. Wait for the ring on the {key} badge to fill, then press {key}.', aim: 'No target. Put the mouse on one, then press {key} again.'};
  T.K.why = 180;                                                  // about 3 s; a new press shows it again
  T.why = function(kind, key){ if (!T.WHY[kind] || typeof G === 'undefined' || !G) return; T.w = {kind, text: T.fill(T.WHY[kind], {key}), until: G.frame + T.K.why}; T.log.push('why ' + kind); };
  // which line, if any: only while a goal for this character's ability is open. cd0 is the cooldown before the press; fired is what the press returned.
  T.whyFor = function(u, cd0, fired){
    const g = T.g, A = window.ABIL33; if (!g || !g.o.spec || !u || !A || T.cur || !T.lessonsOn() || !inFight()) return null;
    if ((u.spec || (u.p && u.p.spec)) !== g.o.spec || (g.o.lead && u !== G.leader) || !A.able(u)) return null;
    if (g.far && g.far()) return 'far';                           // the lesson is waiting for a target in reach: a press does not count yet
    if (cd0 > 0) return 'cool';
    if (fired) return null;                                       // it went off. (An aimed Shot or Bolt with the mouse on nothing still fires, at the nearest foe or the way the Leader faces.)
    const R = A.REG[A.lo(u).active]; if (!R || !R.own) return null;
    if ((R.minMagic && ((u.s && u.s.magic) | 0) < R.minMagic) || (R.favour && (G.favour | 0) < R.favour)) return null;   // the Magic and Favour pops already say why
    if (R.aimed){ const a = A.aim(), rr = (A.K && A.K.aimR) || 24; if (!(a && (G.enemies || []).some(e => e && !e.dead && Math.hypot(e.x - a.x, e.y - a.y) < (e.r || 12) + rr))) return 'aim'; }
    return 'far';                                                 // an ability with its own effect that found nothing in reach
  };
  if (window.ABIL33 && typeof ABIL33.press === 'function'){ const f = ABIL33.press;
    ABIL33.press = function(u){ let cd0 = 0; try { cd0 = u ? ABIL33.ab(u).cd : 0; } catch (e) {}
      const r = f.apply(this, arguments);
      try { const k = T.whyFor(u, cd0, r); if (k) T.why(k, ABIL33.keyOf(u)); } catch (e) {}
      return r; }; }

  /* ---- drawn on the field: the gold line and the growing key legend ------------------ */
  T.gateOn = () => { try { const g = T.g; return !!(inFight() && G.t45 && g && g.show && !g.wait && g.tx.gate && !G.paused); } catch (e) { return false; } };   // S6 1i: a gold goal call holds the top-centre slot (ux.js UX.tip1i)
  T.drawOver = function(){
    if (!inFight() || !G.t45 || typeof ctx === 'undefined') return;
    /* S6 1i A: the gold call sits in the top-centre slot, its top on the goal box's top (Deck units times the HUD scale are canvas px here) */
    const D1 = window.DECK, l1 = !!(D1 && D1.l1i && D1.l1i()), gy = l1 ? Math.round(D1.slotTop() * ((window.UX83 && UX83.k) || 1)) + 17 : 132;
    const g = T.g, lg = G.t45.legend;
    const w = T.w && G.frame < T.w.until && T.g && T.lessonsOn() && !(T.w.kind === 'far' && T.g.far && !T.g.far()) ? T.w : (T.w = null);   // the too-far line goes the moment a target is in reach
    if (!(g && g.show && !g.wait && g.tx.gate) && !(lg && lg.length && T.lessonsOn()) && !w) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'alphabetic';
    if (g && g.show && !g.wait && g.tx.gate && !G.paused && !(window.CF && CF.plateOn && CF.plateOn()) && !(window.F45 && F45.cardOpen && F45.cardOpen()) && !document.querySelector('#screen-create:not(.hidden) .cr2')){   // no gold line over the plate, the last-cage card or the Creator (UX 2d-03, 2c-04)
      ctx.font = 'bold 19px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1a1006'; ctx.fillStyle = '#ffd860';
      const y = gy + (l1 ? 0 : Math.sin(performance.now() / 1000 * 4.28) * 2); if (!G.b45){ ctx.strokeText(g.tx.gate, VW / 2, y); ctx.fillText(g.tx.gate, VW / 2, y); }   // UX ruling 22 Nov: the drill yard's goal is in the panel, so its gold gate line goes; the border pulse stays
    }
    if (w && !G.paused){                                             // S6 1c criterion 6: under the goal line
      ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1a1006'; ctx.fillStyle = '#f0e6d2';
      ctx.strokeText(w.text, VW / 2, gy + 28); ctx.fillText(w.text, VW / 2, gy + 28);
    }
    if (lg && lg.length && T.lessonsOn() && !(window.DECK && DECK.legendOwn !== false && DECK.legendRect)){   // S6 1e: the Deck draws the legend itself (hud-deck.js D.legend) while it is on
      ctx.font = '13px Georgia'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1006'; ctx.fillStyle = '#d9b45a';
      const s = T.legendList().join('  ·  '), y = VH - ((window.DECK && DECK.H) || 128) - 10; ctx.strokeText(s, 14, y); ctx.fillText(s, 14, y);
    }
    ctx.restore();
  };
  T.hookDraw = function(){ if (T.hooked || typeof draw !== 'function') return; T.hooked = true;
    const f = draw; draw = function(){ const r = f.apply(this, arguments); try { T.drawOver(); } catch (e) {} return r; }; };
  if (document.readyState === 'complete') T.hookDraw(); else window.addEventListener('load', T.hookDraw);

  /* ---- hold: the systems the module itself keeps back --------------------------------- */
  // 'momentum': kills fill nothing and no cards open. 'tips': the old tip line stays quiet. 'aimline': no AIM AUTO line.
  if (typeof gainXP === 'function'){ const f = gainXP; gainXP = function(){ if (T.held('momentum')) return; return f.apply(this, arguments); }; }
  if (typeof tip === 'function'){ const f = tip; tip = function(id){ if (T.held('tips') || (T.lessonsOn() && T.quieted && T.quieted[id])) return; return f.apply(this, arguments); }; window.tip = tip; }
  T.hookLate = function(){
    if (window.MODE43 && typeof MODE43.text === 'function' && !MODE43.text.__t45){ const f = MODE43.text; MODE43.text = function(){ return T.held('aimline') ? '' : f.apply(this, arguments); }; MODE43.text.__t45 = true; }
  };
  if (document.readyState === 'complete') T.hookLate(); else window.addEventListener('load', T.hookLate);

  /* ---- self-test (pure: no fight, no save) ---------------------------------------------- */
  T.selfTest = function(){
    const rows = [], ok = (n, c) => rows.push((c ? 'PASS ' : 'FAIL ') + n);
    const sv = {on: T.on, cur: T.cur, g: T.g, q: T.queue, D: T.DRAFT, sw: T.sw, G: typeof G !== 'undefined' ? G : undefined, M: typeof META !== 'undefined' ? META : undefined, L: window.CAMPAIGN_LINES, save: typeof saveMeta === 'function' ? saveMeta : null, note: typeof note === 'function' ? note : null};
    const notes = [];
    try {
      T.on = true; T.cur = null; T.g = null; T.queue = []; T.sw = {};
      T.DRAFT = {a: {title: 'Moving', lines: ['WASD moves {name}.', 'Press {key}.'], gate: 'WALK TO THE RING', remind: 'East.', after: 'Good.'}, c: [{title: 'One', lines: ['1']}, {title: 'Two', lines: ['2']}]};
      window.CAMPAIGN_LINES = {lessons: {a: {title: 'Walking'}, c: [null, {lines: ['two!']}]}};
      if (sv.save) saveMeta = () => {};
      if (sv.note) note = t => notes.push(t);
      META = {settings: {tips: true}, tipsSeen: {}}; G = {frame: 0, paused: false, over: false, msgs: []};
      const tx = T.text('a', {name: 'Cayde', key: '1'});
      ok('words: the lines file wins field by field, the draft fills the rest', tx.title === 'Walking' && tx.lines[0] === 'WASD moves Cayde.' && tx.lines[1] === 'Press 1.' && tx.gate === 'WALK TO THE RING');
      T.DRAFT.p = {title: 'Soldier', text: ['Press {key}.'], after: ['A.', 'B.'], goal: 'USE IT: {key}', remind: {who: 'hal', text: 'Bash.'}, moved: 'Command is now on {key2}.', legend: '{key} Shield Bash'};
      const px = T.text('p', {key: '2', key2: '1'});
      ok('words: the Planner’s shape (text, after, goal, remind who, moved, legend)', px.lines[0] === 'Press 2.' && px.after === 'A. B.' && px.gate === 'USE IT: 2' && px.remind === 'Hal: “Bash.”' && px.moved === 'Command is now on 1.' && px.legend === '2 Shield Bash');
      const ct = T.text('c'); ok('words: a coach set merges entry by entry', ct.length === 2 && ct[0].title === 'One' && ct[1].title === 'Two' && ct[1].lines[0] === 'two!');
      let then = null; T.lesson('a', {vars: {name: 'Cayde', key: '1'}, then: v => then = v});
      ok('lesson: the fight pauses and the card shows', G.paused === true && T.cur && T.card.style.display === 'block' && /Walking/.test(T.card.innerHTML));
      ok('lesson: kept in Field Notes', META.tipsSeen.L45_a === true && /^Walking\. WASD moves Cayde\./.test(TIPS.L45_a));
      T.lesson('a', {}); ok('lesson: a second card waits its turn', T.queue.length === 1); T.queue = [];
      T.next(); ok('lesson: the button resumes the fight and runs then(true)', G.paused === false && !T.cur && then === true && T.card.style.display === 'none' && T.done('a'));
      { const B0 = window.BRIEFING; try { window.BRIEFING = {up: true}; G.paused = false;
          const w = T.lesson('a', {}) === true && !T.cur && T.briefQ.length === 1 && G.paused === false;
          clearInterval(T.briefIv); T.briefIv = 0; window.BRIEFING.up = false; const q = T.briefQ; T.briefQ = []; q.forEach(([i, p]) => T.lesson(i, p));
          ok('P23-BUG-6: a lesson under the contract briefing waits, and opens when it closes', w && T.cur && T.cur.id === 'a' && G.paused === true); T.next(); } finally { window.BRIEFING = B0; } }
      T.sw.a = false; then = null; ok('lesson: a step switched off is skipped and then(false) runs', T.lesson('a', {then: v => then = v}) === false && then === false && !T.cur); T.sw = {};
      META.settings.lessons = false; ok('Settings "Lessons: off": no card, nothing held', T.lesson('a', {}) === false && (T.hold('x'), !T.held('x'))); META.settings.lessons = true;
      ok('hold and release', T.held('x') && (T.release('x'), !T.held('x')));
      let hit = false, done = 0; T.gate('a', () => hit, {then: () => done++});
      T.tick(); ok('gate: waits until the test is true', T.g && !done);
      G.frame = T.K.remind + 1; T.tick(); ok('gate: the reminder is spoken once per interval', notes.filter(x => x === 'East.').length === 1 && (T.tick(), notes.filter(x => x === 'East.').length === 1));
      hit = true; T.tick(); ok('gate: done once, the after line, then()', !T.g && done === 1 && notes.includes('Good.') && T.done('g_a'));
      T.gate('a', () => { throw new Error('x'); }, {then: () => done++}); const w = console.warn; console.warn = () => {}; try { T.tick(); } finally { console.warn = w; }
      ok('gate: a broken test never blocks the story', !T.g && done === 2);
      ok('used and the legend', T.used('bash') === 1 && T.used('bash') === 2 && T.usedList().join() === 'bash' && (T.legend('WASD move'), T.legend('WASD move'), T.legend('1 ability'), G.t45.legend.length === 2));
      { const D0 = window.DECK, b = ctx.canvas.getBoundingClientRect(), cv = {x: 40, y: 60, w: 100, h: 80, con: {x: 50, y: 120, w: 30, h: 7}}, m = {};   // S6 1d
        window.DECK = {rects: [Object.assign({kind: 'mate', m}, cv), {kind: 'abil33', u: {p: {spec: 'SOLDIER'}}, x: 5, y: 6, w: 24, h: 24}], vw: VW / 2, vh: VH / 2};
        const kx = b.width / (VW / 2), ky = b.height / (VH / 2), near = (a, c) => Math.abs(a - c) < 0.01;
        try { const r = T.rectOf({hud: {kind: 'mate', m}}), c = T.rectOf({hud: {kind: 'mate', m, part: 'con'}}), a = T.rectOf({hud: {kind: 'ability', spec: 'SOLDIER'}}), d = T.rectOf({deck: () => ({x: 10, y: 10, w: 20, h: 20})});
          ok('1d: a Deck rect goes to screen px by the size the Deck was drawn in, not by VW and VH', b.width > 0 ? (r && near(r.x, b.left + 40 * kx) && near(r.y, b.top + 60 * ky) && near(r.w, 100 * kx) && near(r.h, 80 * ky)) : true);
          ok('1d: part con frames the Condition marks and keeps the card top for the lesson card', b.width > 0 ? (c && near(c.y, b.top + 120 * ky) && near(c.w, 30 * kx) && near(c.clearY, b.top + 60 * ky)) : true);
          ok('1d: an ability target finds the badge on that Specialty card; a deck target scales the same way', b.width > 0 ? (a && near(a.x, b.left + 5 * kx) && d && near(d.w, 20 * kx)) : true);
          ok('1d: no target on the bar, no box', T.rectOf({hud: {kind: 'mate', m: {}}}) === null && T.rectOf({hud: {kind: 'ability', spec: 'MAGE'}}) === null && T.rectOf({deck: () => null}) === null && T.rectOf({hud: {kind: 'mate', m, part: 'none'}}) === null);
        } finally { window.DECK = D0; } }
      { const A0 = window.ABIL33, L0 = G.leader, S0 = G.squad, B0 = G.abil, lg0 = G.t45.legend, g0 = T.g, AB = ABILITIES, nmA = k => AB[k].name;   // S6 1c
        const cay = {spec: 'FOLK_HERO'}, hal = {p: {spec: 'SOLDIER'}}, pin = {p: {spec: 'SCOUNDREL'}}, sol = {spec: 'SOLDIER'};
        window.ABIL33 = {live: () => true, keyOf: u => u === G.leader ? 'E' : String((G.squad || []).indexOf(u) + 1)};
        try { G.leader = cay; G.squad = []; G.abil = {FOLK_HERO: {}, SOLDIER: {}, SCOUNDREL: {}}; G.t45.legend = [];
          const k1 = T.keyOf('FOLK_HERO'), k0 = T.keyOf('SCOUNDREL'); G.squad = [hal, pin];
          ok('1c: a lesson names the badge key: E the Leader, 1 to 5 the mates in bar order, nothing for nobody', k1 === 'E' && k0 === '' && T.keyOf('SOLDIER') === '1' && T.keyOf('SCOUNDREL') === '2' && T.keyOf('SCOUNDREL', 'leader') === '', [k1, k0, T.keyOf('SOLDIER'), T.keyOf('SCOUNDREL')].join());
          for (const k of ['FOLK_HERO', 'SOLDIER', 'SCOUNDREL']) T.legend('{key} ' + nmA(k), k);
          const l1 = T.legendList().join('|'); G.leader = sol; const l2 = T.legendList().join('|');
          ok('1c: the legend reads each key when drawn; an ability nobody has is off it; E names the new Leader ability', l1 === ['E ' + nmA('FOLK_HERO'), '1 ' + nmA('SOLDIER'), '2 ' + nmA('SCOUNDREL')].join('|') && l2 === ['E ' + nmA('SOLDIER'), '1 ' + nmA('SOLDIER'), '2 ' + nmA('SCOUNDREL')].join('|') && !G.t45.legend.some(x => typeof x === 'string'), l1 + ' // ' + l2);
          const v = {key: T.keyOf('SCOUNDREL')}, v2 = {key: 'E'}; T.gate('k1c', () => false, {vars: v, spec: 'SCOUNDREL'}); G.squad = [pin]; T.tick(); const moved = v.key;
          G.squad = [hal]; T.g = null; T.gate('k1c', () => false, {vars: v2, spec: 'SOLDIER', lead: true}); T.tick();
          ok('1c: an open goal line follows the badge when the squad changes; a Leader lesson stays on E', moved === '1' && v2.key === 'E', moved + ' ' + v2.key);
          { const A = ABIL33; T.g = null; const g6 = T.gate('k6', () => false, {vars: {key: 'E'}, spec: 'SOLDIER', lead: true}), on0 = T.lessonsOn, ab0 = A.able, lo0 = A.lo, aim0 = A.aim, R0 = A.REG; let far = true;
            T.lessonsOn = () => true; A.able = () => true; A.lo = () => ({active: 'x', auto: []}); A.REG = {x: {aimed: false}}; g6.far = () => far;
            const a = T.whyFor(sol, 0, true); far = false; const b = T.whyFor(sol, 30, false), c = T.whyFor(sol, 0, true), d = T.whyFor(hal, 30, false);
            A.REG = {x: {aimed: true, own: true}}; A.aim = () => null; const e2 = T.whyFor(sol, 0, false), e3 = T.whyFor(sol, 0, true); A.REG = {x: {own: true}}; const f2 = T.whyFor(sol, 0, false);
            T.why('cool', 'E'); const tx = T.w && T.w.text; T.w = null;
            T.lessonsOn = on0; A.able = ab0; A.lo = lo0; A.aim = aim0; A.REG = R0; T.g = null;
            ok('1c criterion 6: the right key did nothing: too far, not ready, no target; no line for the wrong character or a press that worked', a === 'far' && b === 'cool' && c === null && d === null && e2 === 'aim' && e3 === null && f2 === 'far' && tx === 'Not ready. Wait for the ring on the E badge to fill, then press E.', [a, b, c, d, e2, f2, tx].join(' | ')); }
          ok('1c: the fixed keys fill by name; a lesson var wins; an unknown token stays', T.fill('{kWall} {kLuck} {key} {x}', {key: '3'}) === 'SPACE Q 3 {x}' && T.fill('{kWall}', {kWall: 'B'}) === 'B');
        } finally { window.ABIL33 = A0; G.leader = L0; G.squad = S0; G.abil = B0; G.t45.legend = lg0; T.g = g0; } }
      let cd = null; T.coach('c', [{sel: 'body'}, {sel: 'body'}], {then: v => cd = v});
      ok('coach: first mark, 1 / 2, NEXT', T.cur && T.cur.i === 0 && /1 \/ 2/.test(T.card.innerHTML) && />NEXT</.test(T.card.innerHTML));
      T.next(); ok('coach: second mark, the last button', T.cur && T.cur.i === 1 && /two!/.test(T.card.innerHTML) && />GOT IT</.test(T.card.innerHTML));
      T.next(); ok('coach: done', !T.cur && cd === true && T.done('c'));
      { const F0 = window.F34, n0 = notes.length; window.F34 = {active: () => true}; META.f34 = {beat: 2}; T.st().done = {}; T.sw = {}; window.CAMPAIGN_LINES.ux48 = {k54: {retryNote: 'Known: {lesson}.'}};
        T.lesson('a', {}); T.next(); ok('K54: a card seen in the Founding is kept in the Founding save', META.f34.l45 && META.f34.l45.a === true);
        G.t45 = null; let tv = null; ok('K54: on a retry (a new fight) the card does not show again', T.lesson('a', {then: v => tv = v}) === false && !T.cur && tv === false);
        let gd = 0, hit = false; T.gate('a', () => hit, {then: () => gd++}); hit = true; T.tick();
        G.t45 = null; hit = false; T.gate('a', () => hit, {then: () => gd++});
        ok('K54: a retried gate shows one line, not the gold goal', T.g && T.g.show === false && notes.slice(n0).filter(x => x === 'Known: Walking.').length === 1);
        hit = true; T.tick(); ok('K54: the retried gate still counts', !T.g && gd === 2);
        window.F34 = {active: () => false}; G.t45 = null; ok('K54: outside the Founding a card shows as before', T.lesson('a', {}) === true && T.cur); T.next();
        window.F34 = F0; delete META.f34; }
      T.on = false; ok('module off: no lesson, nothing held', T.lesson('a', {}) === false && (T.hold('y'), !T.held('y')));
    } catch (e) { ok('no exception: ' + e.message, false); }
    finally {
      T.hide(); T.on = sv.on; T.cur = sv.cur; T.g = sv.g; T.queue = sv.q; T.DRAFT = sv.D; T.sw = sv.sw; window.CAMPAIGN_LINES = sv.L;
      try { delete TIPS.L45_a; delete TIPS.L45_c_1; delete TIPS.L45_c_2; } catch (e) {}
      if (sv.save) saveMeta = sv.save; if (sv.note) note = sv.note;
      G = sv.G; META = sv.M;
    }
    const fail = rows.filter(r => r.startsWith('FAIL')).length;
    return {pass: rows.length - fail, fail, rows};
  };
})();

/* ---- the Settings row "Lessons" (INDEX L45; was js/lessons45.js, folded in at INT-1 stage 1) ---- */
/* ============================================================================
   INDEX L45 - F-45 teaching plan v2, Q5: the Settings row "Lessons"
   One tick box in Settings (title screen, pause and camp) turns the Founding
   lessons on or off. It sets settings().lessons, the flag T45.lessonsOn()
   reads (js/teach45.js); the flag lives in META.settings, so it is kept in the
   save. Off: the old Founding, with no lesson cards or goals (A45 and B45 fall
   back). On (the default): the lessons as built.
   Wrapper only (settingsHTML). INT-1 stage 1: no switch (L45.on is gone).
============================================================================ */
(function(){
  'use strict';
  const L = window.L45 = {};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const ANCHOR = '<button class="btn small" style="font-size:14px;padding:4px 10px" onclick="resetTips()"';

  L.state = function(){ try { return gl('settings')().lessons !== false; } catch (e) { return true; } };
  L.set = function(v){
    try { gl('setSetting')('lessons', !!v); } catch (e) { console.warn('L45 set', e); }
    try { if (!v && window.T45 && typeof T45.hide === 'function') T45.hide(); } catch (e) {}   // a card on screen goes at once
    return L.state();
  };
  L.row = function(){
    return `<label id="l45-row" title="The Founding teaches the game one step at a time. Off: the Founding plays without the lesson cards and goals."><input type="checkbox" ${L.state() ? 'checked' : ''} onchange="L45.set(this.checked)"> Lessons</label>\n    `;
  };
  L.dress = function(h){
    if (typeof h !== 'string' || h.indexOf('id="l45-row"') >= 0) return h;
    const i = h.indexOf(ANCHOR);
    if (i >= 0) return h.slice(0, i) + L.row() + h.slice(i);
    const j = h.indexOf('Tips</label>');                       // the row moved: sit after Tips
    return j >= 0 ? h.slice(0, j + 12) + L.row() + h.slice(j + 12) : h;
  };
  try {
    const f = gl('settingsHTML');
    if (typeof f === 'function'){
      L._sh = function(){ let h = f.apply(this, arguments); try { h = L.dress(h); } catch (e) { console.warn('L45', e); } return h; };
      (0, eval)('settingsHTML = window.L45._sh');
    }
  } catch (e) { console.warn('L45 wrap', e); }

  L.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const M = gl('META'), had = !!(M && M.settings && 'lessons' in M.settings), v0 = M && M.settings && M.settings.lessons;
    const sm = gl('saveMeta');
    try {
      (0, eval)('saveMeta = function(){}');                    // the test writes nothing to the save
      const h = gl('settingsHTML')(false);
      ok('the row shows in Settings, once', (h.match(/id="l45-row"/g) || []).length === 1);
      ok('the row sits before "Show tips again"', h.indexOf('id="l45-row"') > 0 && h.indexOf('id="l45-row"') < h.indexOf('resetTips()'));
      if (M){
        L.set(false);
        ok('off: the flag is false and the box is clear', gl('settings')().lessons === false && !/id="l45-row"[^>]*><input type="checkbox" checked/.test(gl('settingsHTML')(true)));
        if (window.T45) ok('off: T45.lessonsOn() is false', T45.lessonsOn() === false);
        if (window.A45 && window.B45) ok('off: A45 and B45 fall back', !A45.ok() && !B45.ok());
        L.set(true);
        ok('on: the flag is true and the box is ticked', gl('settings')().lessons === true && /id="l45-row"[^>]*><input type="checkbox" checked/.test(gl('settingsHTML')(true)));
        if (window.T45) ok('on: T45.lessonsOn() follows T45.on', T45.lessonsOn() === !!T45.on);
        ok('the flag is in the save data', JSON.parse(JSON.stringify(M)).settings.lessons === true);
      }
    } catch (e) { ok('no throw', false, e.message); }
    finally {
      try { if (M && M.settings){ if (had) M.settings.lessons = v0; else delete M.settings.lessons; } } catch (e) {}
      try { window.__l45sm = sm; (0, eval)('saveMeta = window.__l45sm'); delete window.__l45sm; } catch (e) {}
    }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
