/* ===== INDEX OB35: F-35 the open-air tavern on the barge and in the warehouse (Lead Programmer, 2026-11-14) =====
   Scope: audits/f35-open-air-tavern.md (Patrick's decisions at its foot).
   - On the barge and in the warehouse, building the Camp Tavern IS the open-air bar: same cost, no building sprite.
     The tavern plot becomes the counter (two barrels and a plank, mugs, a lantern); four trestle tables stand on a
     loose ring round the fire (one with dice for Crepitus, one with a Rank'n board, two plain), 4 seats each.
     The Frontier Fort keeps its tavern building. Before the Tavern is built, nothing changes.
   - Mates who would idle take a free seat, sit, drink (the mug tilts every 6 s) and leave after 20-40 s. At most 3
     stand at the counter. The Leader, Officers and the Chapter Master take the table nearest the camera; the injured
     sit nearest the fire; new faces (no contract together yet) take the outer table; bonded pairs and mates who came
     home from the same contract sit together. Mates resting, training, sparring or away never come.
   - Bark budget (F-15): one speaker at a time still holds; a seated mate is 1.3x as likely to be the speaker.
   - Clicks: the dice table opens Crepitus with the mates sat at it; the board table opens Rank'n against one of them;
     a plain table enters the tavern hub; the counter opens the bar (Hiring Line perks). Officers' Legwork stays on the fire.
   - A bar fight [S]: now and then two seated mates square up in a ring between the counter and the fire; the others
     stand (30 frames), gather round and watch, then everyone sits back down. Cosmetic: nobody is hurt, nothing is paid.
   Props are placeholders drawn here in world px until Art's sprites land (OB.draw.* can be replaced one by one).
   Numbers marked [S] are drafts. Load after art37.js.
   INT-1 group 16: no switches. */
(function(){
  'use strict';
  const TAU = Math.PI * 2, R = Math.random;
  const OB = window.OPENBAR35 = {
    K: {tableR: [150, 230], tableGap: 130, fireGap: 112, objGap: 70, rectPad: 12, hullPad: 34, angles: [-50, 30, 90, 150],
        sitMin: 1200, sitMax: 2400, sitChance: 1 / 300, counterMax: 3, counterShare: 0.2, mugEvery: 360, mugUp: 40,
        barkBoost: 1.3, seatLine: 0.5, fightEvery: 3600, fightChance: 0.2, fightLen: 480, standDelay: 30, ringR: 70},   // [S] all
    LINES: {start: ['Take that back, or take it outside.', 'That stool was mine.', 'You spilt that on purpose.'],
            cry: ['Fight! Make room!', 'Somebody hold my ale!', 'Ten on the short one!'],
            end: ['Call it even. I am buying.', 'We never speak of this.', 'Sit. Drink. We are friends again.'],
            seat: ['Is this seat taken? It is now.', 'Another round, and not a word to the Leader.', 'My feet hurt and my mug is empty.', 'Dice, anyone? I promise to lose.', 'The ale is bad. Pour me another.', 'Somebody sing. Not you, Pinch.', 'I am not drunk. The floor is moving.', 'Tell me about the road. Leave out the dead.']},   // Narrative, F-35 (seat: optional seated-table barks)
    cache: null};

  const hk = () => { try { const k = holding(); return k === 'barge' || k === 'warehouse' ? k : null; } catch (e) { return null; } };
  const built = () => { if (OB.force != null) return OB.force; try { return has('tavern'); } catch (e) { return false; } };   // OB.force: self-test only
  OB.on = () => !!(hk() && built() && PLOTS.tavern);
  OB.live = () => OB.on();

  /* ---- layout: the counter on the tavern plot, four tables round the fire ---- */
  let hullCtx = null;
  const inHull = (x, y) => { if (hk() !== 'barge' || typeof hullPath !== 'function') return true;
    if (!hullCtx){ hullCtx = document.createElement('canvas').getContext('2d'); hullPath(hullCtx, 16); }
    return hullCtx.isPointInPath(x, y); };
  const rects = () => { try { return (curLayout().rects || []).concat(); } catch (e) { return []; } };
  const roads = () => { try { return curLayout().roads || []; } catch (e) { return []; } };
  const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0; return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  // why a table may not stand at (x, y): null when it may
  OB.blocked = function(x, y, placed, ctr){
    const K = OB.K;
    if (Math.hypot(x - HUB.fire.x, y - HUB.fire.y) < K.fireGap) return 'fire';
    for (const o of campObjects()) if (o.id !== 'tavern' && Math.hypot(x - o.x, y - o.y) < K.objGap + (o.kind === 'house' ? 40 : 0)) return 'object ' + o.id;
    if (ctr && Math.hypot(x - ctr.x, y - ctr.y) < 110) return 'counter';
    for (const q of rects()) if (x > q.x - 44 - K.rectPad && x < q.x + q.w + 44 + K.rectPad && y > q.y - 22 - K.rectPad && y < q.y + q.h + 30 + K.rectPad) return 'aisle';
    for (const r of roads()) for (let i = 1; i < r.pts.length; i++) if (segD(x, y, r.pts[i - 1], r.pts[i]) < (r.w || 24) / 2 + 50) return 'road';
    if (typeof GRAVE !== 'undefined' && Math.abs(x - GRAVE.x) < GRAVE.w / 2 + 50 && Math.abs(y - GRAVE.y) < GRAVE.h / 2 + 40) return 'graveyard';
    if (typeof BENCH_LOGS !== 'undefined') for (const [lx, ly, w] of BENCH_LOGS) if (Math.abs(x - (HUB.fire.x + lx + w / 2)) < w / 2 + 50 && Math.abs(y - (HUB.fire.y + ly + 8)) < 40) return 'bench';
    for (const pr of _hp()) if (Math.hypot(x - pr.x, y - pr.y) < 60) return 'prop ' + pr.k;
    for (const [dx, dy] of [[-44, 0], [44, 0], [-30, -20], [30, -20], [-30, 22], [30, 22]]) if (!inHull(x + dx, y + dy) || !inHull(x + dx * 1.3, y + dy + Math.sign(dy) * OB.K.hullPad * 0.5)) return 'hull';
    // the four seats too: none may fall inside a building's footprint (QA: warehouse seats in the training ground) [S] 6 px pad
    for (const o of campObjects()){ if (o.kind === 'plot' || o.id === 'tavern' || typeof objRect !== 'function') continue; const q = objRect(o);
      for (const [dx, dy] of [[-17, -15], [17, -15], [-17, 15], [17, 15]]) if (x + dx > q.x - 6 && x + dx < q.x + q.w + 6 && y + dy > q.y - 6 && y + dy < q.y + q.h + 6) return 'seat in ' + o.id; }
    for (const t of placed) if (Math.hypot(x - t.x, y - t.y) < K.tableGap) return 'table';
    return null;
  };
  OB.layout = function(){
    const K = OB.K, pl = PLOTS.tavern, ctr = pl ? {x: pl[0], y: pl[1]} : null, sq = hk() === 'barge' ? 0.85 : 1, tables = [];
    const kinds = ['crepitus', 'plain', 'rankn', 'plain'];
    K.angles.forEach((a0, i) => {
      let at = null;
      search: for (const da of [0, 10, -10, 20, -20, 30, -30, 45, -45, 60, -60, 80, -80]) for (let r = K.tableR[0]; r <= K.tableR[1]; r += 20){
        const a = (a0 + da) * Math.PI / 180, x = Math.round(HUB.fire.x + Math.cos(a) * r), y = Math.round(HUB.fire.y + Math.sin(a) * r * 0.72 * sq);
        if (!OB.blocked(x, y, tables, ctr)){ at = {x, y}; break search; }
      }
      if (at) tables.push({i: tables.length, x: at.x, y: at.y, kind: kinds[i], ang: a0});
    });
    // a cramped deck: fill the rest from the nearest free spots to the ring, out to 420 px [S]
    if (tables.length < 4){
      const pts = [];
      for (let dx = -420; dx <= 420; dx += 20) for (let dy = -300; dy <= 300; dy += 20){ const d = Math.hypot(dx, dy); if (d >= K.tableR[0] && d <= 420) pts.push({x: HUB.fire.x + dx, y: HUB.fire.y + dy, d}); }
      pts.sort((p, q) => Math.abs(p.d - 190) - Math.abs(q.d - 190));
      for (const pt of pts){ if (tables.length >= 4) break; if (!OB.blocked(pt.x, pt.y, tables, ctr)) tables.push({i: tables.length, x: pt.x, y: pt.y, kind: kinds[tables.length], ang: null}); }
    }
    tables.forEach((t, k) => t.kind = kinds[k]);   // always one dice table and one Rank'n board
    const seats = [];
    for (const t of tables) for (const [dx, dy] of [[-17, -15], [17, -15], [-17, 15], [17, 15]]) seats.push({x: t.x + dx, y: t.y + dy, table: t.i, i: seats.length, taken: null, back: dy < 0});
    const counter = ctr ? [-34, 0, 34].map((dx, j) => ({x: ctr.x + dx, y: ctr.y + 34 + (j === 1 ? 6 : 0), table: -1, i: 100 + j, taken: null})) : [];
    return {key: OB.key(), ctr, tables, seats, counter};
  };
  OB.key = () => [hk(), HUB.fire.x, HUB.fire.y, (PLOTS.tavern || []).join(','), built()].join('|');
  OB.cur = function(){ const k = OB.key(); if (!OB.cache || OB.cache.key !== k){ const old = OB.cache; OB.cache = OB.layout(); if (old) for (const q of CAMP.people || []) q.ob = null; } return OB.cache; };
  OB.seatsList = () => OB.on() ? OB.cur().seats.concat(OB.cur().counter) : [];
  const seatOf = q => { if (!q || q.ob == null || !OB.cache) return null; return OB.cache.seats.find(s => s.i === q.ob) || OB.cache.counter.find(s => s.i === q.ob) || null; };

  /* ---- who sits where ---- */
  const eligible = q => q && (q.kind === 'mate' || q.kind === 'leader' || q.kind === 'officer' || q.kind === 'master');
  const friendsOf = q => { const p = q.p || {}, out = new Set(); if (p.bond) out.add(p.bond); const m = p.mem && p.mem[p.mem.length - 1]; if (m && m.stood) for (const id of m.stood) if (id !== p.id) out.add(id); return out; };
  OB.pick = function(q, L){
    L = L || OB.cur(); const p = q.p || {};
    const free = L.seats.filter(s => !s.taken), cfree = L.counter.filter(s => !s.taken);
    if (cfree.length && (!free.length || R() < OB.K.counterShare)) return cfree[R() * cfree.length | 0];
    if (!free.length) return null;
    const fd = t => Math.hypot(t.x - HUB.fire.x, t.y - HUB.fire.y), ts = L.tables;
    const front = ts.reduce((a, b) => (b.y > a.y ? b : a), ts[0]), near = ts.reduce((a, b) => (fd(b) < fd(a) ? b : a), ts[0]), outer = ts.reduce((a, b) => (fd(b) > fd(a) ? b : a), ts[0]);
    const boss = q.kind === 'leader' || q.kind === 'officer' || q.kind === 'master', hurt = !!(p.injuries && p.injuries.length), fresh = q.kind === 'mate' && !(p.mem && p.mem.length), fr = friendsOf(q);
    let best = null, bs = -1e9;
    for (const s of free){
      const t = ts[s.table]; let sc = R();
      if (boss && t === front) sc += 3;
      if (hurt && t === near) sc += 2;
      if (fresh && !boss && t === outer) sc += 2;
      for (const o of L.seats) if (o.table === s.table && o.taken && fr.has(o.taken.p && o.taken.p.id)) sc += 2.5;
      if (sc > bs){ bs = sc; best = s; }
    }
    return best;
  };
  OB.sit = function(q, s){ s.taken = q; q.ob = s.i; q.obT = OB.K.sitMin + R() * (OB.K.sitMax - OB.K.sitMin) | 0; q.obSat = false; };
  OB.rise = function(q){ const s = seatOf(q); if (s && s.taken === q) s.taken = null; q.ob = null; q.obSat = false; q.wait = 200 + R() * 300 | 0; };

  /* ---- hooks: role, anchor, the per-frame pass ---- */
  const _role = personRole;
  personRole = function(q){
    const r = _role.apply(this, arguments);
    if (OB.brawl && OB.live()){ const b = OB.brawl; if (q === b.a || q === b.b) return 'spar'; if (b.ring.has(q) && b.t >= OB.K.standDelay && r === 'wander') return 'watch'; }
    if (q.ob != null && OB.live() && r === 'wander') return 'sit';
    return r;
  };
  const _anchor = anchorFor;
  anchorFor = function(q, role){
    if (role === 'sit'){ const s = seatOf(q); if (s){ const t = {x: s.x, y: s.y + (s.table >= 0 ? 1.5 : 0)}; return window.SW2 && SW2.detour ? SW2.detour(q, t) : t; } }   // walk round the fire (SW2)
    if (OB.brawl && (role === 'spar' || role === 'watch')){ const b = OB.brawl;
      if (q === b.a || q === b.b){ const side = q === b.a ? 0 : 1; q.sparSide = side; return {x: b.x - 20 + side * 40, y: b.y}; }
      if (role === 'watch'){ const k = b.slot.get(q) || 0, a = k / Math.max(1, b.ring.size) * TAU; return {x: b.x + Math.cos(a) * OB.K.ringR, y: b.y + Math.sin(a) * OB.K.ringR * 0.55}; } }
    return _anchor.apply(this, arguments);
  };
  const _upd = updatePeople;
  updatePeople = function(){
    const r = _upd.apply(this, arguments);
    try { OB.tick(); } catch (e) { if (!OB.err) console.warn('OPENBAR35', e); OB.err = e; }
    return r;
  };
  OB.tick = function(){
    if (!OB.live()){ if (OB.cache) for (const q of CAMP.people) if (q.ob != null) q.ob = null; OB.brawl = null; return; }
    const L = OB.cur(), K = OB.K, t = CAMP.t || 0;
    for (const s of L.seats.concat(L.counter)) if (s.taken && !CAMP.people.includes(s.taken)) s.taken = null;
    for (const q of CAMP.people){
      if (q.ob != null){
        const s = seatOf(q);
        if (!s || q.role !== 'sit'){ if (q.role !== 'spar' && q.role !== 'watch') OB.rise(q); else if (s){ s.taken = null; q.ob = null; } continue; }
        // F-14 (Patrick 2026-11-14): sit only on the seat itself (a table spot or the counter), facing it; short of it, stand
        const sy = s.y + (s.table >= 0 ? 1.5 : 0), at = Math.hypot(q.x - s.x, q.y - sy) <= OB.SEAT_SNAP;
        if (!q.moving && at){ q.x = s.x; q.y = sy; q.obSat = true; if (s.table >= 0){ const tb = L.tables[s.table]; q.left = s.x > tb.x; } else q.left = false; }
        else q.obSat = false;
        if (--q.obT <= 0) OB.rise(q);
      } else if (eligible(q) && q.role === 'wander' && !q.moving && !(OB.brawl && OB.brawl.ring.has(q)) && R() < K.sitChance){
        const s = OB.pick(q, L); if (s) OB.sit(q, s);
      }
    }
    // the bar fight [S]
    if (OB.brawl){
      const b = OB.brawl; b.t++;
      if (b.t === K.standDelay){ const w = [...b.ring]; const c = w[R() * w.length | 0]; if (c && !anyBark()) say(c, OB.LINES.cry); }
      if (b.t >= K.fightLen){ OB.brawl = null; say(b.a, OB.LINES.end); }
    } else if (t > 0 && t % K.fightEvery === 0 && R() < K.fightChance) OB.startFight();
  };
  OB.startFight = function(){
    const L = OB.cur(), sat = CAMP.people.filter(q => q.ob != null && q.kind === 'mate' && L.seats.some(s => s.i === q.ob));
    if (sat.length < 4 || !L.ctr) return null;
    let a = sat[R() * sat.length | 0], pool = sat.filter(q => q !== a && !(a.p.bond && a.p.bond === q.p.id)), b = pool[R() * pool.length | 0];
    if (!b) return null;
    const ring = new Set(CAMP.people.filter(q => q.ob != null && q !== a && q !== b)), slot = new Map(); [...ring].forEach((q, k) => slot.set(q, k));
    for (const q of [a, b]) OB.rise(q);
    for (const q of ring) OB.rise(q);
    OB.brawl = {a, b, ring, slot, t: 0, x: Math.round((L.ctr.x + HUB.fire.x) / 2), y: Math.round((L.ctr.y + 30 + HUB.fire.y) / 2)};
    say(a, OB.LINES.start);
    return OB.brawl;
  };
  const anyBark = () => CAMP.people.some(q => q.bark && q.barkLife > 0);
  const say = (q, lines) => { if (!q) return; q.bark = lines[R() * lines.length | 0]; q.barkLife = 200; CAMP.barkT = Math.max(CAMP.barkT || 0, 120); try { if (window.VOICE15 && VOICE15.free) VOICE15.free.set(q.bark, (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 6000); } catch (e) {} };   // the bar fight is the player's own doing: its cries show

  OB.seatBark = q => { const sl = OB.LINES.seat; return sl && sl.length && R() < OB.K.seatLine ? sl[R() * sl.length | 0] : barkFor(q.p); };   // half the time a seated-table line (Narrative)
  /* ---- barks: a seated mate is 1.3x as likely to speak (one speaker at a time holds) ---- */
  const _dc = drawCamp;
  drawCamp = function(){
    try {
      if (OB.live() && (CAMP.barkT || 0) <= 1 && !anyBark()){
        const pool = CAMP.people.filter(q => q.kind === 'mate' || q.kind === 'leader' || q.kind === 'officer'), sat = pool.filter(q => q.ob != null && q.obSat), f = pool.length ? sat.length / pool.length : 0;
        const p = f > 0 && f < 1 ? (OB.K.barkBoost - 1) * f / (1 - f) : 0;   // P(seated) = p + (1 - p) f = 1.3 f
        if (sat.length && R() < Math.min(1, p)){ const q = sat[R() * sat.length | 0]; q.bark = OB.seatBark(q); q.barkLife = 260; CAMP.barkT = 300 + R() * 300; }
      }
    } catch (e) {}
    return _dc.apply(this, arguments);
  };

  /* ---- props: tables via holdingProps (y-sorted with people), the counter via the facility painter ---- */
  const _hp = holdingProps;
  holdingProps = function(){
    const out = _hp.apply(this, arguments);
    if (OB.on()) for (const t of OB.cur().tables) out.push({x: t.x, y: t.y, k: 'obtable', t});
    return out;
  };
  const _dhp = drawHoldingProp;
  drawHoldingProp = function(p){
    if (p && p.k === 'obtable'){ OB.draw.table(p.t); return; }
    return _dhp.apply(this, arguments);
  };
  const W = '#6e5840', WD = '#4a3826', WL = '#8a7050', IRON = '#2a2a2e', MUG = '#c8b07a', MUGD = '#8a7040';
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const shadow = (x, y, rx, ry) => { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
  const mug = (x, y, up) => { ctx.save(); ctx.translate(x, y); if (up) ctx.rotate(-0.5); rect(-3, -8, 6, 8, MUG); rect(-3, -8, 6, 2, '#f0e6c8'); rect(3, -6, 2, 4, MUGD); ctx.restore(); };
  const barrel = (x, y) => { shadow(x, y + 2, 15, 5); rect(x - 13, y - 34, 26, 34, W); rect(x - 13, y - 34, 6, 34, WL); rect(x + 7, y - 34, 6, 34, WD); rect(x - 14, y - 28, 28, 3, IRON); rect(x - 14, y - 9, 28, 3, IRON); };
  OB.draw = {
    table(t){
      const x = t.x, y = t.y, L = OB.cache, tick = CAMP.t || 0, hov = CAMP.hover && CAMP.hover.kind === 'obtable' && CAMP.hover.id === t.i;
      shadow(x, y + 3, 42, 9);
      for (const sx of [-1, 1]) rect(x + sx * 26 - 3, y - 20, 6, 22, WD);   // trestle legs
      rect(x - 38, y - 26, 76, 8, hov ? '#8a7258' : W); rect(x - 38, y - 26, 76, 2, WL); rect(x - 38, y - 18, 76, 2, WD);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const st = {x: x + sx * 17, y: y + sy * 15}; shadow(st.x, st.y + 1, 7, 2); }
      if (t.kind === 'crepitus'){ rect(x - 6, y - 30, 5, 5, '#ece4cf'); rect(x + 2, y - 29, 5, 5, '#ece4cf'); rect(x - 4, y - 28, 1, 1, '#2a1a0a'); rect(x + 4, y - 27, 1, 1, '#2a1a0a'); }
      else if (t.kind === 'rankn'){ for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) rect(x - 12 + i * 6, y - 30 + j * 3, 6, 3, (i + j) % 2 ? '#2a1a0a' : '#d8c8a0'); }
      else { ctx.fillStyle = '#b08848'; ctx.beginPath(); ctx.ellipse(x + 14, y - 27, 7, 3, 0, 0, TAU); ctx.fill(); }   // a loaf
      mug(x - 24, y - 24, false); mug(x + 26, y - 24, false);
      if (L) for (const s of L.seats) if (s.table === t.i && s.back && s.taken && s.taken.obSat){   // the drinker on the far side lifts a mug every 6 s
        const q = s.taken, up = (tick + (q.seed || 0) * 37) % OB.K.mugEvery < OB.K.mugUp; mug(s.x + (s.x > x ? -8 : 8), s.y - (up ? 30 : 22), up); }
      if (hov && typeof campLabel === 'function'){ const n = OB.tableName(t); campLabel(x, y - 60, n[0], n[1]); }
    },
    counter(x, y){
      shadow(x, y + 4, 70, 12);
      barrel(x - 44, y); barrel(x + 44, y);
      rect(x - 62, y - 42, 124, 9, W); rect(x - 62, y - 42, 124, 2, WL); rect(x - 62, y - 34, 124, 2, WD);
      for (const dx of [-40, -18, 12, 30]) mug(x + dx, y - 42, false);
      rect(x + 56, y - 92, 4, 52, WD); rect(x + 50, y - 96, 16, 3, IRON);   // the lantern post
      const fl = 0.85 + 0.15 * Math.sin((CAMP.t || 0) / 5) * Math.sin((CAMP.t || 0) / 13);
      const g = ctx.createRadialGradient(x + 58, y - 86, 2, x + 58, y - 86, 90); g.addColorStop(0, 'rgba(255,200,110,' + (0.45 * fl).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 58, y - 86, 90, 0, TAU); ctx.fill();
      rect(x + 53, y - 92, 10, 12, '#ffd078'); rect(x + 53, y - 92, 10, 2, IRON); rect(x + 53, y - 82, 10, 2, IRON);
      for (const dx of [-34, 0, 34]) { shadow(x + dx, y + 38, 8, 3); rect(x + dx - 6, y + 22, 12, 4, W); rect(x + dx - 2, y + 26, 4, 12, WD); }   // three stools
    }
  };
  OB.tableName = t => t.kind === 'crepitus' ? ['The Crepitus table', 'Dice with whoever sits here'] : t.kind === 'rankn' ? ['The Rank’n board', 'Sit down and challenge one of them'] : ['A table', 'The tavern: games and the bar'];
  // the plot is the counter: sk2_barge_tavern / sk2_warehouse_tavern paint the counter instead of the grog-house or bay
  OB.parse = kind => typeof kind === 'string' && /^sk2?_(barge|warehouse)_tavern(_dmg)?$/.test(kind);
  if (window.VO3 && VO3.drawFacility && !VO3.drawFacility.__ob35){
    const f = VO3.drawFacility;
    VO3.drawFacility = function(kind, x, gl, o){
      if (OB.parse(kind)){ try { OB.draw.counter(x, gl); } catch (e) {} return true; }
      return f.apply(this, arguments);
    };
    VO3.drawFacility.__ob35 = true;
  }

  /* ---- clicks: tables open the games, the counter opens the bar ---- */
  const _hit = campHit;
  campHit = function(wx, wy){
    const h = _hit.apply(this, arguments);
    if (!OB.on()) return h;
    for (const t of OB.cur().tables){
      if (Math.abs(wx - t.x) < 38 && wy > t.y - 32 && wy < t.y - 14) return {kind: 'obtable', id: t.i};   // the plank itself beats a mate sat behind it
      if (!(h && h.kind === 'person') && Math.abs(wx - t.x) < 44 && wy > t.y - 40 && wy < t.y + 10) return {kind: 'obtable', id: t.i};
    }
    return h;
  };
  const _op = openPanel;
  openPanel = function(kind, id){
    if (kind === 'obtable') return OB.click(id);
    if (kind === 'building' && id === 'tavern' && OB.on() && window.TAVERN && !TAVERN.bypass && typeof TAVERN.bar === 'function') return TAVERN.bar();
    return _op.apply(this, arguments);
  };
  OB.atTable = i => (OB.cache ? OB.cache.seats.filter(s => s.table === i && s.taken && s.taken.obSat).map(s => s.taken) : []);
  OB.click = function(i){
    const t = OB.on() && OB.cur().tables[i], T = window.TAVERN; if (!t || !T) return null;
    const mates = OB.atTable(i).filter(q => q.kind === 'mate' || q.kind === 'officer').map(q => q.p);
    if (t.kind === 'crepitus'){
      const C = window.CREPITUS;
      if (!(C && typeof C.open === 'function') || !mates.length) return T.crepitus();
      const pad = (T.seats ? T.seats().crep : []).filter(p => !mates.includes(p)), seats = mates.slice(0, 3).concat(pad).slice(0, 3);
      if (typeof closePanel === 'function') closePanel();
      return C.open(seats, {stake: 'low', onClose: () => T.restoreChrome && T.restoreChrome()});
    }
    if (t.kind === 'rankn'){
      const opp = mates.find(p => META.roster.includes(p) || (META.officers || []).includes(p));
      if (opp && typeof rkNew === 'function') return rkNew(opp.id, (typeof RK_PICK !== 'undefined' && RK_PICK && RK_PICK.stake) || 'table');
      T.enter(); return T.go('rankn');
    }
    return T.enter();
  };

  /* ---- F-35b "Pick a fight" (Patrick's ruling 2026-11-13: "just a reskin of the brawl from the forest camp tileset. the bard starts
     to dance and play the combat music, and the squad leader and a chosen squad mate take on waves of fighters no perm injuries,
     same rewards as the other brawl") ----
     The counter (bar panel: choose the helper) and a mate sat at a table (their panel: that mate helps) offer PICK A FIGHT. It is the
     Officers' Legwork brawl (startBrawl: the Leader and one helper, waves, the ring, ales, bruises only, the same rewards, ESC the
     Parley), with c.camp = true: the map is the camp (grass, a ring of forest and trees, the open-air counter, tables and Marrow
     behind the plank) instead of the tavern room, and BARDBRAWL.active is set for Audio's dance cue while it runs. Counts as the
     downtime's legwork. No switch (INT-1 group 16). */
  OB.K.bigWave = 5;   // [S] BARDBRAWL.level 2 from this wave
  const pfOk = () => OB.on() && typeof startDeployment === 'function' && typeof META !== 'undefined' && META.leader && !(typeof inStoryNow === 'function' && inStoryNow());
  const fitP = p => p && META.roster.includes(p) && !(p.resting > 0);
  OB.seatedMates = () => (CAMP.people || []).filter(q => q.kind === 'mate' && q.ob != null && q.obSat && fitP(q.p)).map(q => q.p);
  OB.fitMates = () => { const s = OB.seatedMates(); return s.concat(META.roster.filter(p => fitP(p) && !s.includes(p))); };   // the seated first
  OB.fightBtn = function(pid){
    if (!pfOk()) return '';
    const done = typeof legworkDone === 'function' && legworkDone(), list = pid == null ? OB.fitMates() : [], none = pid == null && !list.length;
    const why = done ? 'You have already been into town this downtime.' : none ? 'Nobody is fit to back you up.' : '';
    const head = `<div class="desc" style="text-align:left;margin-top:8px;border-top:1px solid #c9bba4;padding-top:6px"><b>Pick a fight.</b> ${pid == null ? 'Choose one helper.' : 'They back you up.'} Fists only, wave after wave, the Bard plays and the camp watches. It counts as this downtime's night in town.</div>`;
    if (why) return head + `<button class="btn" disabled title="${why}">PICK A FIGHT</button><div class="desc" style="color:#8b0000">${why}</div>`;
    if (pid != null) return head + `<button class="btn" onclick="OPENBAR35.pickFight(${pid})">PICK A FIGHT</button>`;
    return head + list.slice(0, 8).map(p => `<button class="btn" onclick="OPENBAR35.pickFight(${p.id})">PICK A FIGHT WITH ${esc(p.name).toUpperCase()}</button>`).join('');
  };
  OB.pickFight = function(pid){
    if (!pfOk() || (typeof legworkDone === 'function' && legworkDone())) return null;
    const p = META.roster.find(x => x.id === pid);
    if (!fitP(p)) return null;
    if (typeof closePanel === 'function') closePanel();
    OB._camp = true;
    try { startDeployment({obj: 'brawl', camp: true, tier: 1, host: 'bandits', place: 'the camp', edges: [], council: null, picks: 0, minutes: 0, pay: 0, patron: 'nobody', faction: null, seed: 11,
      brief: `${META.leader.name} and ${p.name}, by the open-air bar. Somebody said something, and the Bard struck up.`}, [p.id]); } finally { OB._camp = false; }   // [S]
    if (typeof G !== 'undefined' && G){ G.noTick = true; G.noAdv = true; }
    return p;
  };
  const isCamp = () => typeof G !== 'undefined' && G && G.obj === 'brawl' && G.contract && G.contract.camp === true;
  OB.isCampBrawl = isCamp;
  const bard = (on, lv) => { try { if (window.BARDBRAWL){ BARDBRAWL.active = !!on; if (lv) BARDBRAWL.level = lv; } } catch (e) {} };
  // the camp map: the brawl room's layout (start, doors, tables, the bard's stage) on grass, a ring of forest round it
  OB.campMap = function(M){
    const w = M.w, h = M.h, g = M.g, hs = (x, y) => { let n = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const near = (x, y, px, py, r) => Math.hypot(x + 0.5 - px / CELL, y + 0.5 - py / CELL) < r;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const d = Math.min(x, y, w - 1 - x, h - 1 - y), door = M.doors.some(o => near(x, y, o.x, o.y, 1.6));
      g[y * w + x] = (!door && (d === 0 || (d === 1 && hs(x, y) < 0.45))) ? T.FOREST : T.GRASS;
    }
    for (let y = 11; y < h; y++) for (const x of [12, 13]) g[y * w + x] = T.ROAD;   // the track in from the south
    for (const t of M.tables){ g[t.y * w + t.x] = T.WAGON; g[t.y * w + t.x + 1] = T.WAGON; }
    for (let x = 11; x <= 14; x++) g[2 * w + x] = T.WAGON;                          // the open-air counter
    M.trees = [];   // none on the south edge (their canopies would hide the fight and the Bard's stage)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y * w + x] === T.FOREST && y < h - 2 && !near(x, y, 22.5 * CELL, 15.3 * CELL, 3.4) && hs(x + 7, y + 3) < 0.7) M.trees.push({x: (x + .2 + hs(x, y + 9) * .6) * CELL, y: (y + .3 + hs(x + 5, y) * .6) * CELL, v: hs(y, x) * 3 | 0});
    M.camp = true;
    const mg = M.mini.getContext('2d'); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
    M.reach = bfsFrom(13.5 * CELL, 9.5 * CELL);
    return M;
  };
  { const f = generateBrawlMap; generateBrawlMap = function(){ const M = f.apply(this, arguments); if (OB._camp || isCamp()){ try { OB.campMap(M); } catch (e) { console.warn('OPENBAR35 camp map', e); } } return M; }; }
  // the props: the open-air counter, Marrow behind it and the trestle tables, in place of the tavern room's (the ring stays last)
  OB.campBodies = function(bodies){
    const C = 13 * CELL, cy = 2.95 * CELL, A = window.OPENBAR35ART, kinds = ['crepitus', 'plain', 'rankn', 'plain', 'plain', 'plain'];
    bodies.push({y: cy - 21, custom: () => { try { if (A && A.drawBartender) A.drawBartender(C, cy - 21, G.frame); } catch (e) {} }});
    bodies.push({y: cy, custom: () => { try { OB.draw.counter(C, cy); } catch (e) {} }});
    (MAP.tables || []).forEach((t, k) => { const o = {x: (t.x + 1) * CELL, y: (t.y + 0.85) * CELL, kind: kinds[k] || 'plain', i: -1};
      bodies.push({y: o.y, custom: () => { try { OB.draw.table(o); } catch (e) {} }}); });
  };
  { const f = brawlBodies; brawlBodies = function(bodies, onScreen){
      if (!isCamp()) return f.apply(this, arguments);
      const n0 = bodies.length; f.apply(this, arguments);
      const B = G.brawl, live = (B && B.ring || []).filter(r => r.st !== 'out').length, keep = Math.min(live, bodies.length - n0);
      const tail = keep ? bodies.splice(bodies.length - keep, keep) : [];
      bodies.length = n0; OB.campBodies(bodies); for (const b of tail) bodies.push(b);
    }; }
  { const f = setupBrawl; setupBrawl = function(c){ const r = f.apply(this, arguments); bard(!!(c && c.camp === true) || isCamp(), 1); return r; }; }
  { const f = updateBrawl; updateBrawl = function(){
      const r = f.apply(this, arguments);
      if (isCamp() && G.brawl && !G.over) bard(true, G.brawl.wave >= OB.K.bigWave ? 2 : 1);
      return r;
    }; }
  { const f = brawlEnd; brawlEnd = function(){ bard(false, 1); return f.apply(this, arguments); }; }
  { const f = renderPanel; renderPanel = function(){
      f.apply(this, arguments);
      try {
        const P = CAMP.panel; if (!P || !pfOk()) return; const el = $('camp-panel'); if (!el) return;
        if (P.kind === 'building' && P.id === 'tavern') el.insertAdjacentHTML('beforeend', OB.fightBtn(null));
        else if (P.kind === 'person'){ const q = (CAMP.people || []).find(x => x.id === P.id); if (q && q.kind === 'mate' && q.ob != null && fitP(q.p)) el.insertAdjacentHTML('beforeend', OB.fightBtn(q.p.id)); }
      } catch (e) {}
    }; }

  /* ---- self-test ---- */
  /* ---- seated pose (Art's SEAT3D, 7b262e4): a mate sitting at a bar table or the counter is drawn seated, not standing.
     The camp draws people through drawSprite; this wrapper (outermost) sends a seated 3D person to SEAT3D.draw at the camp
     figure size (VO2.campFigure, which the inner VO2 wrapper would have applied). ---- */
  OB.SEAT_SNAP = 8;   // px from its seat that still counts as at the table [S]
  OB.seatedAt = (x, y) => {
    if (!OB.live() || typeof CAMP === 'undefined' || !CAMP || !CAMP.on || !CAMP.people || (typeof G !== 'undefined' && G)) return null;
    return CAMP.people.find(q => { if (q.ob == null || !q.obSat || q.role !== 'sit' || q.moving || Math.abs(q.x - x) >= 0.5 || Math.abs(q.y - y) >= 0.5) return false;
      const st = seatOf(q); return !!st && Math.hypot(q.x - st.x, q.y - st.y) <= OB.SEAT_SNAP + 2; }) || null;   // F-14: only on its own seat
  };
  if (typeof drawSprite === 'function'){
    const f = drawSprite; let busy = false;
    drawSprite = function(spr, x, y, s, frame, left, flash){
      if (!busy && spr && (spr.p3d || spr.lead3d) && window.SEAT3D && SEAT3D.on){
        const q = OB.seatedAt(x, y);
        if (q){
          const k = window.VO2 && VO2.on && VO2.campNow && VO2.campNow() ? (VO2.campFigure || 1) : 1;
          busy = true;   // SEAT3D's own fallback draws the standing figure through drawSprite again
          try { SEAT3D.draw(q, 0, spr, x, y, s * k, left); return; } catch (e) {} finally { busy = false; }
        }
      }
      return f(spr, x, y, s, frame, left, flash);
    };
  }

  OB.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const sv = {h: META.holding, people: CAMP.people, cache: OB.cache, brawl: OB.brawl};
    try {
      OB.force = true;
      for (const h of ['barge', 'warehouse']){
        META.holding = h; applySkin(); OB.cache = null; hullCtx = null;
        const L = OB.cur();
        ok(h + ': four tables, 16 seats, 3 counter spots', L.tables.length === 4 && L.seats.length === 16 && L.counter.length === 3);
        ok(h + ': no table on an aisle, road, plot or building (70 px), off the fire and inside the deck', L.tables.every((t, k) => !OB.blocked(t.x, t.y, L.tables.filter((_, j) => j !== k), L.ctr)));
        ok(h + ': every seat is reachable (on the deck, not inside a building)', L.seats.concat(L.counter).every(s => inHull(s.x, s.y) && !campObjects().some(o => o.kind !== 'plot' && o.id !== 'tavern' && (() => { const r = objRect(o); return s.x > r.x && s.x < r.x + r.w && s.y > r.y && s.y < r.y + r.h; })())));
        ok(h + ': the tavern skin is the counter', OB.parse('sk2_' + h + '_tavern') && OB.parse('sk2_' + h + '_tavern_dmg') && !OB.parse('sk2_' + h + '_kitchen'));
        ok(h + ': a dice table and a Rank’n table', L.tables.some(t => t.kind === 'crepitus') && L.tables.some(t => t.kind === 'rankn'));
        // seating rules on fake people
        const mk = (id, kind, p) => ({id: 'x' + id, kind, p: Object.assign({id, name: 'T' + id}, p || {}), x: 0, y: 0, role: 'wander', moving: false, seed: 1});
        let hits = 0; const ts = L.tables, fd = t => Math.hypot(t.x - HUB.fire.x, t.y - HUB.fire.y);
        const front = ts.reduce((a, b) => (b.y > a.y ? b : a)), near = ts.reduce((a, b) => (fd(b) < fd(a) ? b : a)), outer = ts.reduce((a, b) => (fd(b) > fd(a) ? b : a));
        const sk = OB.K.counterShare; OB.K.counterShare = 0;
        try {
          for (let n = 0; n < 20; n++){ const s = OB.pick(mk(1, 'leader'), L); if (s && ts[s.table] === front) hits++; }
          ok(h + ': the Leader takes the front table', hits >= 18); hits = 0;
          for (let n = 0; n < 20; n++){ const s = OB.pick(mk(2, 'mate', {injuries: ['x'], mem: [{}]}), L); if (s && ts[s.table] === near) hits++; }
          ok(h + ': the injured sit nearest the fire', hits >= 18); hits = 0;
          for (let n = 0; n < 20; n++){ const s = OB.pick(mk(3, 'mate', {mem: []}), L); if (s && ts[s.table] === outer) hits++; }
          ok(h + ': a new face takes the outer table', hits >= 18);
          const a = mk(4, 'mate', {bond: 5, mem: [{}]}), b = mk(5, 'mate', {bond: 4, mem: [{}]}), sa = L.seats.find(s => s.table === 1); OB.sit(a, sa); hits = 0;
          for (let n = 0; n < 20; n++){ const s = OB.pick(b, L); if (s && s.table === 1) hits++; }
          ok(h + ': a bonded mate sits with their partner', hits >= 18);
          OB.rise(a); ok(h + ': rising frees the seat', !sa.taken && a.ob == null);
        } finally { OB.K.counterShare = sk; }
        L.counter.forEach(s => s.taken = {}); const full = L.seats.map(s => s.taken); L.seats.forEach(s => s.taken = {});
        ok(h + ': at most 3 at the counter (a full house finds no seat)', OB.pick(mk(6, 'mate'), L) === null);
        L.seats.forEach((s, k) => s.taken = full[k]); L.counter.forEach(s => s.taken = null);
      }
      META.holding = 'fort'; applySkin(); OB.cache = null;
      ok('the Frontier Fort keeps its tavern building (no open-air bar)', !OB.on() && !holdingProps().some(p => p.k === 'obtable'));
      META.holding = 'barge'; applySkin(); OB.cache = null; OB.force = false;
      ok('nothing before the Tavern is built', !OB.on() && !holdingProps().some(p => p.k === 'obtable'));
      OB.force = true;
      const q = {id: 'xq', kind: 'mate', p: {id: 77}, role: 'wander', ob: OB.cur().seats[0].i, x: 0, y: 0};
      ok('a seated mate has the sit role and walks to the seat', personRole(q) === 'sit' && anchorFor(q, 'sit').x === OB.cur().seats[0].x);
      // a bar fight on fake people
      const L = OB.cur(), fake = [1, 2, 3, 4, 5].map(i => ({id: 'f' + i, kind: 'mate', p: {id: 900 + i, name: 'F' + i}, role: 'wander', x: 0, y: 0, seed: i}));
      CAMP.people = fake; fake.forEach((f, k) => OB.sit(f, L.seats[k]));
      const b = OB.startFight();
      ok('a bar fight: two square up in a ring between the counter and the fire, the rest watch', b && personRole(b.a) === 'spar' && b.ring.size === 3 && fake.every(f => f.ob == null) && b.x > Math.min(L.ctr.x, HUB.fire.x) - 1 && b.x < Math.max(L.ctr.x, HUB.fire.x) + 1);
      { const sk = OB.K.seatLine; let n = 0; OB.K.seatLine = 1; try { for (let k = 0; k < 10; k++) if ((OB.LINES.seat || []).includes(OB.seatBark(fake[0]))) n++; } finally { OB.K.seatLine = sk; }
        ok('a seated mate speaks the seated-table lines (LINES.seat)', !(OB.LINES.seat || []).length || n === 10); }
      // F-35b Pick a fight (startDeployment stubbed: nothing launches, nothing saves; MAP put back)
      { const fm = [1, 2].map(i => ({id: 880 + i, name: 'Pick' + i, race: 'HUMAN', resting: 0})), sd = startDeployment, sr = META.roster, sl = META.legworkAt, sm = MAP, sLead = META.leader, sCp = META.cp; let call = null;
        try {
          // F-44: the Pick a fight gate needs a Leader and a non-story save (pfOk); a story save or an empty one failed these rows for nothing
          if (!META.leader) META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); META.cp = null;   // META.cp live = a story save (inStory)
          META.roster = sr.concat(fm); META.legworkAt = -99; startDeployment = (c, ids) => { call = {c, ids}; };
          const fq = fm.map((p, k) => ({id: 'd' + k, kind: 'mate', p, role: 'wander', x: 0, y: 0, seed: k}));
          CAMP.people = fq; fq.forEach((q, k) => { OB.sit(q, L.seats[k]); q.obSat = true; });
          const bb = OB.fightBtn(null), mb = OB.fightBtn(881);
          ok('F-35b: the counter offers a helper to choose, a seated mate offers PICK A FIGHT', /pickFight\(881\)/.test(bb) && /pickFight\(882\)/.test(bb) && !/disabled/.test(bb) && /pickFight\(881\)/.test(mb));
          OB.pickFight(882);
          ok('F-35b: it starts the Legwork brawl in the camp, the Leader and the chosen mate', call && call.c.obj === 'brawl' && call.c.camp === true && call.ids.length === 1 && call.ids[0] === 882 && !call.c.duel);
          call = null; ok('F-35b: no helper chosen, no fight', OB.pickFight(null) === null && !call);
          OB._camp = true; let M; try { M = generateBrawlMap(); } finally { OB._camp = false; }
          const cnt = t => M.g.filter(c => c === t).length, at = (x, y) => M.g[y * M.w + x];
          ok('F-35b: the camp map is grass in a ring of forest and trees, no tavern walls or boards', M.camp && !cnt(T.WALL) && !cnt(T.FLOOR) && cnt(T.GRASS) > 250 && cnt(T.FOREST) > 60 && M.trees.length > 30);
          ok('F-35b: the room layout kept (start, three doors open, six tables, counter, all reachable)', M.start.x === 13 && M.start.y === 9 && M.doors.length === 3 && M.doors.every(d => [T.GRASS, T.ROAD].includes(at(d.x / CELL | 0, d.y / CELL | 0)) && M.reach[(d.y / CELL | 0) * M.w + (d.x / CELL | 0)] >= 0)
            && M.tables.length === 6 && M.tables.every(t => at(t.x, t.y) === T.WAGON && at(t.x + 1, t.y) === T.WAGON) && at(12, 2) === T.WAGON && at(6, 2) !== T.WAGON);
          const Mt = generateBrawlMap(); ok('F-35b: the tavern brawl keeps its room', !Mt.camp && Mt.g.filter(c => c === T.WALL).length > 50);
          META.legworkAt = META.deployments; call = null;
          ok('F-35b: once per downtime (legwork done: button disabled, no fight)', /disabled/.test(OB.fightBtn(null)) && OB.pickFight(881) === null && !call);
        } finally { startDeployment = sd; META.roster = sr; META.legworkAt = sl; OB._camp = false; MAP = sm; META.leader = sLead; META.cp = sCp; }
      }
    } catch (e){ ok('no throw: ' + e.message, false); }
    finally {
      OB.force = null; META.holding = sv.h; applySkin(); CAMP.people = sv.people; OB.cache = null; OB.brawl = sv.brawl; hullCtx = null;
      for (const q of CAMP.people || []) q.ob = null;
    }
    try {   // seated pose: a seated person at the bar goes to SEAT3D.draw; a standing one does not
      if (window.SEAT3D){
        const svD = SEAT3D.draw, svP = CAMP.people, svOn = CAMP.on, svG = typeof G !== 'undefined' ? G : null, calls = [];
        SEAT3D.draw = (q) => { calls.push(q); return true; };
        const sat = {ob: 0, obSat: true, role: 'sit', moving: false, x: 1001, y: 2002}, up = {ob: null, role: 'wander', x: 1101, y: 2002};
        const svL = OB.live, svC = OB.cache; OB.live = () => true; OB.cache = {seats: [{i: 0, x: 1001, y: 2002 - 1.5, table: 0}], counter: [], tables: []};
        CAMP.people = [sat, up]; CAMP.on = true; if (svG) G = null;
        const spr = {p3d: 'x', frames: [], w: 1, h: 1, ax: 0, ay: 0};
        try { drawSprite(spr, 1001, 2002, 2.4, 0, false, false); } catch (e) {}
        const n1 = calls.length; try { drawSprite(spr, 1101, 2002, 2.4, 0, false, false); } catch (e) {}
        ok('seated pose: a seated bar mate is drawn with SEAT3D, a standing one is not', n1 === 1 && calls[0] === sat && calls.length === 1);
        const stray = {ob: 0, obSat: true, role: 'sit', moving: false, x: 1301, y: 2002}; CAMP.people = [sat, stray];
        const n2 = calls.length; try { drawSprite(spr, 1301, 2002, 2.4, 0, false, false); } catch (e) {}
        ok('seated pose: a mate away from its table or the bar stands (F-14)', calls.length === n2);
        SEAT3D.draw = svD; OB.live = svL; OB.cache = svC; CAMP.people = svP; CAMP.on = svOn; if (svG) G = svG;
      }
    } catch (e) { ok('seated pose threw: ' + e.message, false); }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, n: out.length, details: out};
  };
})();
