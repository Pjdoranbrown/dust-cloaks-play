/* ============================================================================
   F45 (INTRO45): F-45 (e), (d), (c), (c2): the Founding's opening as ONE mission (Lead Programmer, 2026-11-15).
   Patrick: the whole intro up to arriving at Varnholt is one long mission, never back to a card between parts.
   Beats b1, b2 and b3 of F34 run as one fight on one hand-made map:
     1. the road    Cayde alone clears the slavers on the road (the old b1)
     2. the cages   three cage wagons in plain view beside the road. The first two free Hal and Pinch into the
                    squad (F34's own release rule). The third stays shut until both are out (d).
     3. the Leader  the third cage opens the real Leader screen over the frozen fight. When it is signed, the new
                    Leader stands where Cayde stood, Cayde goes to the chair, and the fight carries on.
     4. the camp    the new Leader, Hal and Pinch take the slavers' camp at the end of the road (the old b3).
   The debrief then goes straight to Varnholt (b4).
   (c)/(c2): the map is open grass with a road, trees only along the edges, no buildings, no traps, no ambient
   spawns and no hunting parties; a gold pointer always shows the next thing to do (ring on screen, arrow at the
   screen edge when it is off screen).
   A loss before the Leader is built replays the mission; a loss after it starts again at the camp with the Leader.
   The one-mission opening is the opening (the F45.one switch and ?f45one=0 were removed in INT-1, 2026-11-15).
   The pointer alone: F45.pointer = false.
   New words here are [N] drafts for Narrative (F45.TXT). Enemy counts are [S] drafts (F45.N).
   Self-test: F45.selfTest()
   ============================================================================ */
(function(){
  'use strict';
  if (typeof F34 === 'undefined') return;
  const F = F34, X = window.F45 = {};
  X.pointer = true;
  X.N = {road:3, cage:2, last:2};                                   // [S] slavers on the road, at each of the first two cages, at the last cage
  X.HOST = 'deserters'; X.FOE = 'brigand';                          // [S] the Dark Elf host's slave column: Frost-Vault troops, Captain Vane's camp
  X.W = 88; X.H = 40; X.RY = 20;
  X.AT = {start:18, road:31, cages:[[42, -4], [49, 4], [57, -4]], camp:73};   // cells: x, and the cages' offset from the road
  X.TXT = {                                                         // [N] drafts
    road:   ['CLEAR THE ROAD', n => `SLAVERS ON THE ROAD: ${n}`],
    cages:  ['FREE THE PRISONERS', n => `CAGES OPEN ${n} / 3  ·  STAND BY A CAGE UNTIL IT BREAKS`],
    camp:   ['TAKE THE CAMP', n => `KILL THE SLAVERS' COMMANDER${n ? ': ' + n : ''}`],
    locked: 'FREE THE OTHER TWO FIRST',
    roadClear: 'The road is clear. Three cage wagons stand beside it.',
    lastCage: 'One cage is left.',
    toCamp: 'The slavers’ camp is at the end of the road. Take it.',
    won: 'The camp is taken. The road to Varnholt is open.',
    how: t => `Hal and Pinch are out of the cages, your Leader is sworn, and the slavers' camp is taken, in ${t}.`,
    howPart: t => `The column was hit but not broken, in ${t}.`
  };
  const lines = () => window.CAMPAIGN_LINES || {};
  const say = (who, id) => { const a = (lines()[who] || {})[id]; return Array.isArray(a) ? a.join(' ') : (a || ''); };
  const C2P = (x, y) => ({x:(x + .5) * CELL, y:(y + .5) * CELL});
  const S = () => (typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.f45 && G.f45) || null;
  X.live = () => !!S();

  /* ---- the map: open ground, one road, cages in plain view ------------------- */
  X.buildMap = function(c){
    const w = X.W, h = X.H, ry = X.RY, M = newMap(w, h, c.seed || 45), g = M.g, r = rng(M.seed);
    Object.assign(M, {route:null, relic:null, markRoute:null, escape:null, town:null, siege:null});
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const edge = Math.min(y, h - 1 - y);       // deep trees along the top and bottom only
      g[y * w + x] = edge < 4 || (edge < 7 && r() < 0.35) ? T.FOREST : T.GRASS;
    }
    for (let x = 1; x < w - 1; x++){ g[ry * w + x] = T.ROAD; g[(ry + 1) * w + x] = T.ROAD; }
    // the camp: a palisade ring with its gate on the road, facing the squad
    const cx = X.AT.camp, cy = ry, R = 5;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++){
      const i = (cy + dy) * w + cx + dx, rim = Math.max(Math.abs(dx), Math.abs(dy)) === R;
      g[i] = rim && !(dx === -R && dy >= -1 && dy <= 2) ? T.PALISADE : (g[i] === T.ROAD ? T.ROAD : T.GRASS);
    }
    for (const [tx, ty] of [[2, -3], [2, 3]]){ g[(cy + ty) * w + cx + tx] = T.TENT; g[(cy + ty) * w + cx + tx + 1] = T.TENT; }
    M.camps.push({cx, cy, x:(cx + 1.5) * CELL, y:(cy + .5) * CELL, boss:null, done:false, idx:0});
    M.structures.push({kind:'camp', x:cx, y:cy, r:R});
    M.cages = X.AT.cages.map(([x, dy]) => C2P(x, ry + dy));
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
      if (g[y * w + x] === T.FOREST && r() < 0.55) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
    const sx = c.f45from === 'camp' ? X.AT.cages[2][0] : X.AT.start;
    M.start = {x:sx, y:ry}; M.exit = C2P(X.AT.start, ry); M.town = C2P(X.AT.cages[1][0], ry);
    return finishMap(M, C2P(sx, ry));
  };
  { const f = generateMap; generateMap = function(c){ return c && c.f45 ? X.buildMap(c) : f.apply(this, arguments); }; }

  /* ---- starting it ------------------------------------------------------------ */
  X.fromCamp = function(){ const st = F.state(), L = META.leader; return !!(st && st.beat === 2 && st.leader && L && !L.f34cayde); };
  X.march = function(){
    const st = F.state(); if (!st) return;
    const camp = X.fromCamp();
    if (!camp){ st.beat = 0; st.leader = false; if (META.leader && !META.leader.f34cayde) META.leader = null; }
    F.cast({id:'b2'});                                             // Cayde (when no Leader is built) and the two friends
    const c = makeContract('rescue', 1);
    if (HOSTS[X.HOST]){ c.host = X.HOST; if (CONTRACTS.rescue && CONTRACTS.rescue.desc) try { c.brief = CONTRACTS.rescue.desc(c); } catch (e) {} }
    c.teach = {noAmbient:true}; c.f45 = true; c.pay = 0; if (camp) c.f45from = 'camp';
    startDeployment(c, camp ? F.squad() : []);
    c.f34 = 'b2';                                                  // from here F34's cage rule and debrief runner take it
    X.setup(camp);
  };
  X.setup = function(camp){
    const H = HOSTS[G.contract.host] || HOSTS.bandits, k = BESTIARY[X.FOE] ? X.FOE : H.pools[1][0], ry = X.RY, cp = G.camps[0], grp = cp && cp.boss ? cp.boss.group : -1;
    G.enemies = G.enemies.filter(e => e.home === cp || (e.group && e.group === grp));   // only the camp's own garrison stays
    G.traps = (G.traps || []).filter(t => !t.enemy); G.exitOpen = false; G.alarm = 0;
    G.f45 = {stage:camp ? 'camp' : 'road', road:[], t:0};
    G.rtsFog = false;                                              // (c2) the whole field is in plain view: no fog of war here
    const post = (px, py, n, o) => { const g2 = GROUP++, out = [];
      for (let i = 0; i < n; i++){ const a = i / n * TAU + 0.6; out.push(spawnEnemy(k, px + Math.cos(a) * 46, py + Math.sin(a) * 46, Object.assign({dormant:true, group:g2}, o || {}))); }
      return out.filter(Boolean); };
    if (camp){ for (const cg of G.cages){ cg.open = true; cg.prog = 110; } }
    else {
      const p = C2P(X.AT.road, ry); G.f45.road = post(p.x, p.y + CELL / 2, X.N.road);
      G.cages.forEach((cg, i) => post(cg.x, cg.y + 30, i < 2 ? X.N.cage : X.N.last));
      const ln = say('cayde', 'b1'); if (ln) note(`Cayde: “${ln}”`);
      try { F.fightTip('firstEnemy', 'outOfReach'); } catch (e) {}
    }
    if (camp){ note(X.TXT.toCamp); try { F.fightTip('commandRadius', 'hurtMate'); } catch (e) {} }
  };
  { const f = F.play; F.play = function(){
      const st = F.state(), b = st && F.BEATS[st.beat];
      if (b && /^b[123]$/.test(b.id)){
        if (b.id === 'b3' && !X.fromCamp()) return F.go();          // the Leader fell at the camp: F.go's card builds a new one first
        return X.march();
      }
      return f.apply(this, arguments); }; }
  // the card before the mission: with a Leader waiting at b3, F.go's own MARCH button already calls F.play

  /* ---- the stages --------------------------------------------------------------- */
  X.target = function(){
    const s = S(); if (!s) return null;
    if (s.stage === 'road'){ const L = G.leader; let best = null, bd = 1e9; for (const e of s.road) if (!e.dead && G.enemies.includes(e)){ const d = dist(e, L); if (d < bd){ bd = d; best = e; } } return best; }
    if (s.stage === 'cages'){ const both = G.cages[0].open && G.cages[1].open; return both ? G.cages[2] : G.cages.slice(0, 2).filter(c => !c.open).sort((a, b) => dist(a, G.leader) - dist(b, G.leader))[0] || null; }
    if (s.stage === 'camp'){ const cp = G.camps[0]; return cp && cp.boss && !cp.boss.dead ? cp.boss : cp; }
    return null;
  };
  X.tick = function(){
    const s = S(); if (!s) return;
    if (s.stage === 'road' && !s.road.some(e => !e.dead && G.enemies.includes(e))){
      s.stage = 'cages'; note(X.TXT.roadClear); const ln = say('cayde', 'b2'); if (ln) note(`Cayde: “${ln}”`);
      try { F.fightTip('cage'); } catch (e) {}
    }
    if (s.stage === 'road' && G.cages.some(c => c.open)) s.stage = 'cages';   // went round the road guard
    if (s.stage === 'cages' && !s.lastSaid && G.cages[0].open && G.cages[1].open && !G.cages[2].open){ s.lastSaid = true; }
  };
  { const f = updateContract; updateContract = function(){
      const s = S(); if (!s) return f.apply(this, arguments);
      const c3 = G.cages[2], was = c3.open, locked = !(G.cages[0].open && G.cages[1].open);
      c3.sealed = locked && !c3.open;   /* LE F1: a shut objective gives no contest cue */
      if (locked && !c3.open){ c3.prog = 0; if (dist(G.leader, c3) < 46 && G.frame % 90 === 0) pop(c3.x, c3.y - 34, X.TXT.locked, '#ffd860'); }
      const r = f.apply(this, arguments);
      if (locked && !c3.open) c3.prog = 0;
      if (!was && c3.open && G && !G.over) X.openLast();
      X.tick(); X.tick2();
      if (s.card){ G.msgs && (G.msgs.length = 0); G.tip = null; }
      return r; }; }
  { const f = huntingParty; huntingParty = function(){ if (S()) return; return f.apply(this, arguments); }; }
  { const f = contractCheck; contractCheck = function(){
      const s = S(); if (!s) return f.apply(this, arguments);
      const cp = G.camps[0];
      if (s.stage === 'camp' && cp && cp.done && !G.winT && (!window.CF || CF.clear())){ G.winT = 150; note(X.TXT.won); }
      if (G.winT && --G.winT <= 0) endDeployment('victory');
      return true; }; }
  X.prog = function(){
    const s = (typeof G !== 'undefined' && G && G.f45) || null; if (!s) return 0;
    if (s.stage === 'camp') return G.camps[0] && G.camps[0].done ? (window.CF && !CF.clear() ? 0.9 : 1) : 0.6;
    return 0.15 * ((s.stage === 'road' ? 0 : 1) + G.cages.filter(c => c.open).length);   // never 0.5 before the Leader: leaving early is a retry
  };
  const mine = () => typeof G !== 'undefined' && G && G.contract && G.contract.f45 && G.f45;
  { const f = contractProgress; contractProgress = function(){ return mine() ? X.prog() : f.apply(this, arguments); }; }
  { const f = contractLine; contractLine = function(t){
      const s = mine(); if (!s) return f.apply(this, arguments);
      const tx = X.TXT[s.stage] || X.TXT.road, cp = G.camps[0];
      if (window.CF && CF.campLine()) return [tx[0], CF.campLine()];
      const n = s.stage === 'road' ? s.road.filter(e => !e.dead && G.enemies.includes(e)).length : s.stage === 'cages' ? G.cages.filter(c => c.open).length : (cp && cp.boss && !cp.boss.dead ? ename(cp.boss).toUpperCase() : '');
      return [tx[0], tx[1](n)]; }; }
  { const f = contractHow; contractHow = function(c, result){
      if (!mine()) return f.apply(this, arguments);
      const t = `${G.sec / 60 | 0}m ${G.sec % 60}s`; return result === 'victory' ? X.TXT.how(t) : X.TXT.howPart(t); }; }
  { const f = contractDebrief; contractDebrief = function(c){ if (c && c.f45) return; return f.apply(this, arguments); }; }   // no hostages here: no Standing for them

  /* ---- (d) the third cage: build the Leader inside the mission ---------------------- */
  X.openLast = function(){
    const s = S(); if (!s || s.making) return;
    s.making = true; G.cutscene = true;                             // the fight stands still behind the Leader screen
    X.card(() => F.buildLeader());
  };
  /* S6 2c (s6-12): the story card before the Creator. A modal over the frozen field (dimmed 50%); Cayde's portrait and name left, the
     title, his line and three paragraphs right, one gold button. No close box; Esc, right-click and outside clicks do nothing. */
  X.card = function(go){
    const s = S(), I = ((lines().coach || {}).leader || {}).intro;
    if (!I || !s) return go();
    s.card = true;
    let face = ''; try { face = heroPortraitURL('cayde'); } catch (e) {}
    const v = (a, b) => `clamp(${a}px,calc(${a}px + (100vw - 1280px)*${(b - a) / 640}),${b}px)`;
    if (!document.getElementById('x2c-css')){ const st = document.createElement('style'); st.id = 'x2c-css';
      st.textContent = `#x2c{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}`
        + `#x2c .x2c-c{box-sizing:border-box;width:${v(640, 760)};padding:${v(24, 24)};background:#1c140c;border:2px solid #6a4a22;color:#e8dcc0;display:flex;flex-direction:column;gap:${v(24, 24)}}`
        + `#x2c .x2c-r{display:flex;gap:${v(24, 24)};align-items:flex-start}#x2c .x2c-f{flex:none;width:${v(96, 128)};text-align:center}`
        + `#x2c .x2c-f img{display:block;width:100%;aspect-ratio:1;object-fit:cover;object-position:top;border:2px solid #3a2a1a;box-sizing:border-box}`
        + `#x2c .x2c-f span{display:block;margin-top:8px;font-variant:small-caps;font-size:14px;letter-spacing:.06em}`
        + `#x2c .x2c-t{flex:1;text-align:left;font-size:${v(15, 17)};line-height:1.4}#x2c h2{margin:0 0 8px;font-size:${v(20, 24)};font-weight:normal}`
        + `#x2c .x2c-t p.x2c-s{margin:0 0 16px}#x2c .x2c-t p{margin:0 0 8px}#x2c .x2c-t p:last-child{margin:0}`
        + `body:has(#x2c) #t45-card,body:has(#x2c) #t45-ring,body:has(#screen-create:not(.hidden) .cr2) #t45-card,body:has(#screen-create:not(.hidden) .cr2) #t45-ring{display:none!important}`
        + `#x2c .x2c-b{font-size:${v(18, 20)};align-self:flex-end;margin:0;min-width:${v(240, 280)};height:${v(48, 56)};white-space:nowrap}`;
      document.head.appendChild(st); }
    const el = document.createElement('div'); el.id = 'x2c';
    const E = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    el.innerHTML = `<div class="x2c-c" role="dialog" aria-modal="true"><div class="x2c-r"><div class="x2c-f">${face ? `<img src="${face}" alt="">` : ''}<span>Cayde</span></div>`
      + `<div class="x2c-t"><h2>${E(I.title)}</h2>${I.said ? `<p class="x2c-s">“${E(I.said)}”</p>` : ''}${(I.text || []).map(t => `<p>${E(t)}</p>`).join('')}</div></div>`
      + `<button class="btn gold x2c-b" id="x2c-go">${E(I.button)}</button></div>`;
    for (const ev of ['contextmenu', 'mousedown', 'click']) el.addEventListener(ev, e => { if (ev === 'contextmenu' || e.target === el) e.preventDefault(); });
    document.body.appendChild(el);
    $('x2c-go').onclick = () => { el.remove(); s.card = false; go(); };
    try { $('x2c-go').focus(); } catch (e) {}
  };
  X.cardOpen = () => !!document.getElementById('x2c');
  { const f = togglePause; togglePause = function(){ if (X.cardOpen()) return; return f.apply(this, arguments); }; }   // Esc and M do nothing behind the card
  X.creatorOpen = () => !!document.querySelector('#screen-create:not(.hidden) .cr2');
  { const f = togglePause; togglePause = function(){ if (X.creatorOpen()) return; return f.apply(this, arguments); }; }   // LE 2a: M and Esc open no pause screen over the Creator
  X.swap = function(L){
    const old = G.leader, was = old.p, ls = leaderStats(L);
    const c3 = G.cages && G.cages[2], gh = {x:old.x, y:old.y, left:!!old.left, spr:old.spr};
    if (c3){
      const sp = (a) => ({x: c3.x + Math.cos(a) * 72, y: c3.y + 12 + Math.sin(a) * 72});
      const room = q => { let d = Math.hypot(q.x - c3.x, q.y - (c3.y + 12)); for (const m of G.squad) if (m !== old) d = Math.min(d, Math.hypot(m.x - q.x, m.y - q.y)); return d; };
      let best = null; for (let i = 0; i < 8; i++){ const q = sp(i * Math.PI / 4); q.d = room(q); if (!best || q.d > best.d) best = q; }   // LE 2c F2: eight spots at 72 px, the one farthest from every figure
      const side = best.x < c3.x ? -1 : 1;
      gh.x = best.x; gh.y = best.y; gh.left = side < 0; gh.f0 = G.frame | 0; X.ghost = gh; old.x = c3.x; old.y = c3.y + 12; }
    G.abilQ = (G.abilQ || []).filter(q => !(q.u === old && q.spec === 'FOLK_HERO'));   // Cayde's queued Command goes with him (LE 2c: a COMMAND pop after he left)
    for (const id of (was.picks || [])) if (!G.squad.some(m => (m.p.picks || []).includes(id))) delete G.ranks[id];
    Object.assign(old, {p:L, s:ls, con:ls.con, maxCon:ls.con, wounds:ls.maxWounds, maxWounds:ls.maxWounds, spec:L.spec, spr:personSprite(L, true), down:false, flash:0});
    for (const id of (L.picks || [])) G.ranks[id] = Math.max(G.ranks[id] || 0, 1);
    G.luck = ls.luck; buildAbilities(); recompute();
  };
  { const f = contractBodies; contractBodies = function(bodies, onScreen){
      f.apply(this, arguments);
      X.tick2();                                                      // runs per drawn frame: the lesson cards pause the update
      const g = X.ghost; if (g && S() && onScreen(g)) bodies.push({y:g.y, custom:() => { if (typeof drawUnit3 === 'function') drawUnit3(g, g.spr, g.x, g.y, 2.4, 0, g.left, false); }}); }; }
  X.tick2 = function(){
    const g = X.ghost; if (!g) return;
    if (!S()){ X.ghost = null; return; }
    const id = window.T45 && T45.cur ? T45.cur.id : (typeof T !== 'undefined' && T && T.cur ? T.cur.id : null);
    if (id === 'handover') g.seen = true; else if (g.seen || id === 'you') X.ghost = null;   // Cayde leaves with his card
    else if (!g.seen && !id && (G.frame | 0) - (g.f0 | 0) > 90) X.ghost = null;                // Lessons off: no card, so he goes after a moment
  };
  X.signed = function(L){
    const s = G.f45, st = F.state();
    F.crown(L); X.swap(L);
    if (st){ st.beat = 2; st.log = st.log || []; st.log.push({id:'b1', r:'victory'}, {id:'b2', r:'victory'}); }
    saveMeta();
    s.making = false; s.stage = 'camp'; G.cutscene = false; G.paused = false;
    hideAll(); resize();
    note(X.TXT.toCamp);
    try { F.fightTip('commandRadius', 'hurtMate'); } catch (e) {}
  };
  { const f = finishCreate; finishCreate = function(){
      if (!(F.making && mine() && G.f45.making)) return f.apply(this, arguments);
      F.making = false;
      const el = $('cr-name'), name = ((el && el.value) || CR.name || '').trim() || randomName(CR.race, CR.sex);
      const L = makeLeader(CR.race, CR.cls, CR.spec, name); if (CR.sex) L.sex = CR.sex; if (CR.pick) L.picks.push(CR.pick);
      CR = null; X.signed(L); }; }
  { const f = ldrBack; ldrBack = function(){
      if (F.making && mine() && G.f45.making && CR && ldrSteps().indexOf(CR.step) <= 0) return;   // no way out to a menu mid-mission
      return f.apply(this, arguments); }; }

  // inside the mission the Leader screen has no Import and no Cancel: the only way on is to sign
  { const f = renderCreate; renderCreate = function(){
      const r = f.apply(this, arguments);
      try { if (F.making && mine() && G.f45.making) for (const b of document.querySelectorAll('#screen-create button')){
        const oc = b.getAttribute('onclick') || '';
        if (/importPerson/.test(oc) || (/^ldrBack\(\)/.test(oc) && CR && ldrSteps().indexOf(CR.step) <= 0)) b.style.display = 'none'; } } catch (e) {}
      return r; }; }

  /* ---- (c) the pointer ---------------------------------------------------------------- */
  X.drawPointer = function(){
    const s = S(); if (!s || !X.pointer || s.making || G.paused || (window.CF && CF.mode())) return;
    const t = X.target(); if (!t) return;
    try { if (t.lesson && t.armed && window.TRAP2E && TRAP2E.live() && TRAP2E.stateOf(t) === 'in') return; } catch (e) {}   // 2e-01: the trap's own gold outline says "work here"; the pointer comes back when the trap is far
    const sp = camToScreen(t.x, t.y);   /* A2: screen px under the world zoom */
    const px = sp.x, py = sp.y, m = 54, on = px > m && px < VW - m && py > m + 40 && py < VH - m - 90, ph = Math.sin(G.frame / 10);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);                 // the main ctx applies the render scale itself (INDEX hookMainCtx)
    ctx.strokeStyle = X.pointerCol || 'rgba(255,216,96,.9)'; ctx.fillStyle = X.pointerCol || '#ffd860'; ctx.lineWidth = 3;   // A45 turns it red for a commander
    if (on){
      ctx.setLineDash([9, 6]); ctx.beginPath(); ctx.arc(px, py, 40 + ph * 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const ay = py - 62 + ph * 4; ctx.beginPath(); ctx.moveTo(px, ay + 14); ctx.lineTo(px - 10, ay); ctx.lineTo(px + 10, ay); ctx.closePath();
      ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    } else {
      const ox = VW / 2, oy = VH / 2 - 20, a = Math.atan2(py - oy, px - ox), hw = VW / 2 - m, hh = VH / 2 - m - 50;
      const k = Math.min(hw / Math.max(1e-6, Math.abs(Math.cos(a))), hh / Math.max(1e-6, Math.abs(Math.sin(a))));
      const ex = ox + Math.cos(a) * k, ey = oy + Math.sin(a) * k, sz = 18 + ph * 2;
      ctx.translate(ex, ey); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(sz, 0); ctx.lineTo(-sz * .7, -sz * .7); ctx.lineTo(-sz * .3, 0); ctx.lineTo(-sz * .7, sz * .7); ctx.closePath();
      ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };
  // wrapped once every script has loaded, so the pointer is drawn over the fog and light passes
  X.hookDraw = function(){ if (X.hooked || typeof draw !== 'function') return; X.hooked = true;
    const f = draw; draw = function(){ const r = f.apply(this, arguments); try { X.drawPointer(); } catch (e) {} return r; }; };
  if (document.readyState === 'complete') X.hookDraw(); else window.addEventListener('load', X.hookDraw);

  /* ---- self-test (pure parts only: it starts no fight and writes no save) --------------- */
  X.selfTest = function(){
    const out = []; let bad = 0; const ok = (n, v) => { out.push((v ? 'ok   ' : 'FAIL ') + n); if (!v) bad++; };
    const M0 = typeof MAP !== 'undefined' ? MAP : null;
    try {
      const M = X.buildMap({seed:45}), w = M.w, at = (x, y) => M.g[y * w + x];
      ok('three cages, one camp', M.cages.length === 3 && M.camps.length === 1);
      ok('every cage on open grass and reachable', M.cages.every(p => { const x = p.x / CELL | 0, y = p.y / CELL | 0; return at(x, y) === T.GRASS && M.reach[y * w + x] >= 0; }));
      ok('no buildings on the map', !Array.from(M.g).some(t => t === T.ROOF || t === T.WALL || t === T.FLOOR || t === T.RUBBLE || t === T.WATER || t === T.HILL));
      ok('no tree within 3 cells of a cage or the road', !M.trees.some(t => Math.abs(t.y / CELL - X.RY - .5) < 3 || M.cages.some(p => Math.hypot(p.x - t.x, p.y - t.y) < 3 * CELL)));
      ok('the camp is reachable through its gate', M.reach[M.camps[0].cy * w + M.camps[0].cx] >= 0);
      ok('cages in order along the road', M.cages[0].x < M.cages[1].x && M.cages[1].x < M.cages[2].x && M.cages[2].x < M.camps[0].x);
      const Mc = X.buildMap({seed:45, f45from:'camp'}); ok('a replay after the Leader starts at the last cage', Mc.start.x === X.AT.cages[2][0]);
    } catch (e){ ok('map builds: ' + e.message, false); }
    if (M0) MAP = M0;
    ok('progress stays under a half before the Leader', 0.15 * 3 < 0.5);
    return {pass:out.length - bad, total:out.length, out};
  };
})();

/* S6 2f (s6-15a): every Founding card sits over a picture of the place the story is in, never over the main camp's map. The road for Act I
   (b1 to b3), Varnholt for b4 to b10, the Long Road for b11, Kalloon for the last card. FOUNDBACK.draw returns false until its props are
   baked (it paints what it has) or with ?fback=0; then the old camp draw runs as before. ROLLBACK: ?fback=0. */
{ const f = drawCamp;
  drawCamp = function(){
    try {
      if (typeof FOUNDBACK !== 'undefined' && !/[?&]fback=0/.test(location.search) && !G && F34.state() && SAVE_KEY === F34.slotNow && (F34.active() || !document.getElementById('screen-create').classList.contains('hidden'))){   // the finished-Founding card too, but never the real camp after it
        const st = F34.state(), b = st && F34.BEATS[st.beat], id = b ? b.id : null;
        const name = (!b || F34.over()) ? 'kalloon' : id === 'b11' ? 'longroad' : /^b([4-9]|5b|10)$/.test(id) ? 'varnholt' : 'road';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        FOUNDBACK.draw(name); return;   // draws what is baked so far; the rest arrives within a few frames
      }
    } catch (e) {}
    return f.apply(this, arguments);
  };
}
