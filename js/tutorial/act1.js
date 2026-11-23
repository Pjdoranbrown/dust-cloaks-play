/* js/tutorial/act1.js (INT-1 stage 1, 2026-11-16): teaching Act I, the Road (A45).
   Was js/act45a.js, moved unchanged. Classic script; the globals keep their names. */
/* ============================================================================
   A45 (ACT45A): F-45 teaching plan v2, Act I "The Road", steps S1 to S11 and S14 to S16a (Lead Programmer, 2026-11-15).
   Plan: audits/f45-teaching-plan.md section 4. It runs on the one-mission road map (js/intro45.js, F45) and uses the
   lesson module (js/teach45.js, T45). Words: CAMPAIGN_LINES.lessons and CAMPAIGN_LINES.founding45 (the Planner's file).
   The script, one new thing per step, nothing on the field before its lesson:
     s1         the opening card (no beat number), no briefing page
     move       walk to a gold ring                          fight      one sleeping slaver
     ability    two slavers come; use Command                objective  the gold arrow to the first cage
     wounds     the first Wound lost (a scripted bolt [S])   cage       stand by the cage
     soldier    Hal: Shield Bash on two slavers              ring       reach cage 2 with Hal inside the ring
     scoundrel  Pinch: Called Shot on a sergeant             trap       one trap in plain view
     (S12, S13: the Leader screen, build step 3)             you        the new Leader's own ability on a lone slaver
     momentum   held back until three outer guards fall      commander  the camp: the check fight, no cards
     debrief    the Founding debrief page (S16a)
   Two bugs named in the plan: the commander's call for guards is capped (once, 2 guards [S]); nothing is kept from a
   lost fight, and Hal and Pinch cannot die here (D2).
   Off: "Lessons: off" in Settings (the A45.on switch and ?a45=0 were removed in INT-1, 2026-11-15).
   One step: T45.sw.<key> = false (move, fight, ability, objective, wounds, cage, soldier, ring, scoundrel, trap, you,
   momentum, commander; s1, bolt, guards, nodeath, debrief). "Lessons: off" in Settings turns all of it off.
   Numbers are [S] drafts (A45.K). Self-test: A45.selfTest().
   ============================================================================ */
(function(){
  'use strict';
  if (typeof F34 === 'undefined' || !window.F45 || !window.T45) return;
  const F = F34, X = window.F45, T = window.T45, A = window.A45 = {};
  A.K = {                                                           // [S] drafts
    ring: 23, sleeper: 36,                                          // cells along the road: the gold ring, the sleeping slaver
    wave: 700,                                                      // px ahead of the Leader where a marching pair appears
    sergeant: 53, sergeantCon: 2,                                   // the sergeant's cell; Condition times this when no 'enforcer' exists
    trap: [55, 0], outer: 64, outerN: 3,                           // the trap's cell (x, offset from the road); the outer guards
    boltAfter: 75,                                                  // frames after the cage guards wake before the bolt that always hits
    guards: 2, guardsAfter: 300,                                    // the commander's one call for guards
    halReach: 110,                                                  // px: a marked slaver this near Hal holds the Command press (Q81)
    halPad: 16,                                                    // px: Hal swings at centre distance < 46 + reach, but under Command he closes the last stretch in the beat; the marked slaver stands 57 to 61 px from him and those strikes counted, 108 px got none (QA press log, LE read of the gate)
    beat: 60,                                                       // frames: a breath after an ability gate passes, so the hit is seen
    strikeWait: 150,                                                // frames after a Command press that Hal may take to close and strike before the press counts as no hit (QA log: strikes came 65 frames after a press at 60 px)
    reach: 320,                                                     // px: a target this close holds the fight for an ability "do it"
    again: 2,                                                       // times a "do it" gets fresh enemies before it lets the player on
    halOut: 180, halSay: 600                                        // frames Hal is outside the ring before he says so, and between repeats
  };
  A.TXT = {road:'THE NORTH ROAD', won:'The road is quiet', lost:'The slavers held the road', bolt:'A CROSSBOW BOLT', again:'The camp is still there. Go again.', moved:'{ability} is now on {key}.'};   // [N] drafts; founding45.debrief (wonHead, lostHead, road, bolt, again) wins
  const W2 = k => ((window.CAMPAIGN_LINES && CAMPAIGN_LINES.founding45 && CAMPAIGN_LINES.founding45.debrief) || {})[{won:'wonHead', lost:'lostHead'}[k] || k] || A.TXT[k];
  const has = k => [G.leader].concat(G.squad || []).some(u => u && (u.spec === k || (u.p && u.p.spec === k)));
  A.ORDER = ['move', 'fight', 'ability', 'objective', 'cage', 'soldier', 'ring', 'scoundrel', 'trap', 'last', 'you', 'momentum', 'commander'];
  A.ok = () => T.lessonsOn();
  A.is = k => A.ok() && T.sw[k] !== false;
  const FD = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.founding45) || {};
  const S = () => (typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.f45 && G.f45 && G.f45.a) || null;
  A.live = () => !!S();
  const P = (cx, dy) => ({x:(cx + .5) * CELL, y:(X.RY + (dy || 0) + .5) * CELL});
  const foe = () => BESTIARY[X.FOE] ? X.FOE : (HOSTS[G.contract.host] || HOSTS.bandits).pools[1][0];
  const alive = list => (list || []).filter(e => e && !e.dead && !e.broken && G.enemies.includes(e));   // a broken foe runs: he counts as gone
  const near = list => { let b = null, bd = 1e9; for (const e of alive(list)){ const d = dist(e, G.leader); if (d < bd){ bd = d; b = e; } } return b; };
  const put = (k, x, y, n, o) => { const g2 = GROUP++, out = [];
    for (let i = 0; i < n; i++){ const a = i / n * TAU + 0.6, r = n > 1 ? 46 : 0; out.push(spawnEnemy(k, x + Math.cos(a) * r, y + Math.sin(a) * r, Object.assign({group:g2}, o || {}))); }
    return out.filter(Boolean); };
  const key = spec => T.keyOf(spec);                               // S6 1c: the badge's own rule (lessons.js)
  const nm = (tab, k) => (tab && tab[k] && tab[k].name) || String(k || '');
  const mate = k => G.squad.find(m => m.p && m.p.f34 === k) || null;
  const said = lines => { const a = Array.isArray(lines) ? lines.join(' ') : lines; if (a) note(`Cayde: “${a}”`); };

  /* ---- S1: the opening card; no briefing page before a Founding fight ------------- */
  { const f = F.go; F.go = function(){ const r = go0.apply(this, arguments); try { if (A.is('hide') && !G && !document.getElementById('screen-create').classList.contains('hidden')){ const st = F.state(), b = st && F.BEATS[st.beat]; if (b && /^b[123]$/.test(b.id)) for (const k of ['topbar', 'camp-hint', 'camp-panel']) document.getElementById(k).classList.add('hidden'); } } catch (e) {} return r; };   // no camp bar behind a road card
    const go0 = function(){
      const st = F.state(), b = st && F.BEATS[st.beat], d = FD().s1;
      const e2 = typeof esc === 'function' ? esc : (x => x);
      if (A.is('s1') && d && b && b.id === 'b3' && X.fromCamp() && st.log.length && st.log[st.log.length - 1].id === 'b3'){   // the camp was lost: go again, in the Founding's own words
        if (b.step <= F.BUILT) F.cast(b);
        return F.card(e2((FD().acts || [])[0] || b.name), `<div class="log" style="max-width:640px;margin:8px auto;text-align:left"><p>${e2((FD().debrief || {}).lost || '')}</p><p>${e2(W2('again'))}</p></div>`,
          `<button class="btn gold" onclick="F34.play()">${e2(d.button || 'MARCH')}</button>`); }
      if (!(A.is('s1') && d && b && b.id === 'b1' && !X.fromCamp())) return f.apply(this, arguments);
      if (A.resumeWould(false)) return F.play();                     // Q59: a reload goes straight to the resume card; the opening story screen is not shown first
      return F.card(e2((FD().acts || [])[0] || b.name),
        `<div class="log" style="max-width:640px;margin:8px auto;text-align:left">${d.caption ? `<p>${e2(d.caption)}</p>` : ''}${d.cayde ? `<p><i>Cayde: “${e2(d.cayde.join(' '))}”</i></p>` : ''}</div>`,
        `<button class="btn gold" onclick="F34.play()">${e2(d.button || 'MARCH')}</button>`); }; }
  A.hookBrief = function(){ const B = window.BRIEFING; if (!B || typeof B.skip !== 'function' || B.skip.__a45) return;
    const f = B.skip; B.skip = function(c){ return (c && c.f45 && A.ok()) ? true : f.apply(this, arguments); }; B.skip.__a45 = true; };

  /* ---- starting: clear F45's own posts and stage the script instead ----------------- */
  { const f = X.setup; X.setup = function(camp){ const r = f.apply(this, arguments); try { if (A.ok()) A.begin(camp); } catch (e) { console.warn('A45 begin', e); } return r; }; }
  A.begin = function(camp){
    const cp = G.camps[0], grp = cp && cp.boss ? cp.boss.group : -1;
    G.enemies = G.enemies.filter(e => e.home === cp || (e.group && e.group === grp));
    G.msgs = []; T.reset();
    G.noAdv = true;                                                 // Advancement is taught after the first job (S29): the road gives none, so that report offers two, not four
    const s = G.f45.a = {step:null, use:{}, foes:[], w0:G.leader.wounds, k0:key('FOLK_HERO'), lock2:!camp, lock3:!camp, t:0, camp:!!camp, ringOn:!!camp};
    if (G.momChoice){ G.momChoice = null; G.levelQueue = (G.levelQueue | 0) + 1; }   // a rank carried in waits for its lesson
    G.f45.road = [];
    T.hold('momentum', 'parley', 'aimline');
    T.quiet(['firstEnemy', 'outOfReach', 'firstActive', 'firstMark', 'autoSlot', 'mateActive', 'setTrap', 'commandRadius', 'hurtMate', 'cage', 'levelup', 'trap']);
    if (cp && cp.boss) cp.boss.sumCd = 1e9;
    if (camp) try {                                                   // a camp replay starts with the legend the road had taught
      T.legend(T.text('move').legend);
      for (const [id, sp] of [['soldier', 'SOLDIER'], ['scoundrel', 'SCOUNDREL']]){ const raw = T.text(id).legendRaw; if (raw && sp) T.legend(raw, sp); }
      T.legendYou(META.leader && META.leader.spec);
    } catch (e) {}
    const R = A.resumeOf(camp);
    if (R){ try { return A.resume(R, s, camp); } catch (e) { console.warn('A45 resume', e); } }   // Q59: on a reload the road resumes at the start of the step reached
    if (!camp){ const st0 = F.state(); if (st0) st0.a1 = null; }
    A.enter(camp ? 'momentum' : 'move');
  };

  /* ---- Q59 (GD e53b4132, Patrick): a reload resumes at the start of the step you were on --------------------------------
     The step is saved when it begins (META.f34.a1 = {step, mom}); nothing inside a step is kept. Only the first road start after the page loads
     resumes (A.resumePending), so a lost camp still replays from momentum as before. The words are CAMPAIGN_LINES.resume (one table, `at`). */
  A.resumePending = true;
  A.save = function(step){ const st = F.state(); if (!st) return; st.a1 = {step, mom:step === 'momentum' ? [] : (st.a1 && st.a1.mom) || []}; try { saveMeta(); } catch (e) {} };
  const LESSONS = {move:['move'], fight:['fight'], ability:['abilityFight'], objective:['objective'], cage:['cage'], soldier:['halJoins', 'mark', 'command', 'soldier'],
    ring:['ring', 'condition'], scoundrel:['pinchJoins', 'scoundrel'], trap:['trap'], last:[], you:['handover', 'you'], momentum:['momentum'], commander:['commander']};
  const stepOf = id => A.ORDER.findIndex(k => (LESSONS[k] || []).includes(id) || k === id);
  A.resumeWould = function(camp){   // the same test as resumeOf, without using the resume up
    if (!A.resumePending) return false;
    const st = F.state(), r = st && st.a1, k = r && r.step; if (!k || k === 'move') return false;
    const you = A.ORDER.indexOf('you'), i = A.ORDER.indexOf(k === 'youCreator' ? 'you' : k);
    if (i < 0) return false;
    return !(camp ? (k === 'youCreator' || i < you) : (k !== 'youCreator' && i >= you));
  };
  A.resumeOf = function(camp){
    if (!A.resumePending) return null; A.resumePending = false;
    const st = F.state(), r = st && st.a1, k = r && r.step; if (!k || k === 'move') return null;
    const you = A.ORDER.indexOf('you'), i = A.ORDER.indexOf(k === 'youCreator' ? 'you' : k);
    if (i < 0) return null;
    if (camp ? (k === 'youCreator' || i < you) : (k !== 'youCreator' && i >= you)) return null;   // a step that does not fit who leads: start the road as before
    return {step:k, i, mom:r.mom || null};
  };
  A.unsee = function(i){   // lessons of earlier steps are read; this step's and later ones show as on a first play
    const bk = T.seenBook(); if (!bk) return;
    for (const k of A.ORDER) for (const id of LESSONS[k] || []){ if (A.ORDER.indexOf(k) < i) bk[id] = true; else delete bk[id]; }
    for (const key of Object.keys(bk)) if (/^g_/.test(key)){ const j = stepOf(key.slice(2).replace(/[0-9B]+$/, '')); if (j >= i) delete bk[key]; }
  };
  A.resume = function(R, s, camp){
    const L = G.leader, at = k => A.ORDER.indexOf(k), i = R.i, stp = R.step;
    A.unsee(i);
    // the legend of what was taught so far, in the order the road teaches it
    const leg = (id, sp) => { try { const t = T.text(id); if (!t) return; if (sp && /\{key\}/.test(t.legendRaw || '')) T.legend(t.legendRaw, sp); else if (t.legend) T.legend(t.legend); } catch (e) {} };
    if (i > at('move')) leg('move'); if (i > at('fight')) leg('fight'); 
    if (i > at('soldier')){ leg('mark'); leg('command', 'FOLK_HERO'); leg('soldier', 'SOLDIER'); }
    if (i > at('scoundrel')) leg('scoundrel', 'SCOUNDREL');
    if (i > at('you')){ try { T.legendYou(META.leader && META.leader.spec); } catch (e) {} }
    let open = 0;
    if (!camp){
      open = stp === 'youCreator' ? 3 : i >= at('scoundrel') ? 2 : i >= at('soldier') ? 1 : 0;
      for (let c = 0; c < open; c++){ G.cages[c].open = true; G.cages[c].prog = 110; }
      for (let c = 0; c < Math.min(open, 2); c++) F.release(G.cages[c]);
      G.msgs = []; G.fx = (G.fx || []).filter(x => !x.text);
      if (i >= at('objective')) G.f45.stage = 'cages';
      if (i >= at('ring')) s.ringOn = true;
      const cg = G.cages, ry = P(0).y + CELL / 2, sp = {cage:[cg[0].x - 60, cg[0].y + 50], soldier:[cg[0].x - 60, cg[0].y + 50], ring:[cg[0].x + 110, ry],
        scoundrel:[cg[1].x - 60, cg[1].y - 50], trap:[P(A.K.trap[0]).x - 140, ry], last:[cg[2].x - 80, cg[2].y + 55], youCreator:[cg[2].x - 80, cg[2].y + 55]};
      const q = sp[stp]; if (q){ L.x = q[0]; L.y = q[1]; G.squad.forEach((m, n) => { m.x = L.x - 34 - n * 14; m.y = L.y + (n % 2 ? -26 : 26); }); }
      if (stp === 'cage'){ const c0 = G.cages[0]; s.guards = put(foe(), c0.x, c0.y + 30, X.N.cage, {dormant:true}); s.foes = s.guards; }
    } else open = 3;
    if (stp === 'commander'){ G.levelQueue = 0;   // every Momentum card chosen in the last step is kept
      for (const m of [].concat(R.mom || [])){ try { if (m && m.k === 'card'){ G.ranks[m.id] = (G.ranks[m.id] | 0) + 1; recompute(); } else if (m && m.k === 'order'){ const o = FIELD_ORDERS.find(x => x.id === m.id); if (o){ (G.orders = G.orders || {})[o.id] = 1; o.apply(); } } } catch (e) {} } }
    A.resumeCard(R, open, () => { if (stp === 'youCreator') X.openLast(); else A.enter(stp); });
  };
  A.resumeCard = function(R, open, go){
    const D = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.resume) || {}, E = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
    const at = ((D.at || {})[R.step] || '').replace(/\{leader\}/g, (META.leader && META.leader.name) || 'Cayde');
    G.paused = true;
    if (!document.getElementById('a1r-css')){ const c = document.createElement('style'); c.id = 'a1r-css';
      c.textContent = '#a1r{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}#a1r .a1r-c{box-sizing:border-box;width:min(640px,90vw);padding:24px;background:#1c140c;border:2px solid #6a4a22;color:#e8dcc0;display:flex;flex-direction:column;gap:16px;text-align:left}#a1r h2{margin:0;font-size:22px;font-weight:normal}#a1r p{margin:0;font-size:16px;line-height:1.4}#a1r .btn{align-self:flex-end;min-width:200px;height:48px;font-size:18px}';
      document.head.appendChild(c); }
    const el = document.createElement('div'); el.id = 'a1r';
    el.innerHTML = '<div class="a1r-c" role="dialog" aria-modal="true"><h2>' + E(D.title || 'Back on the North Road') + '</h2><p>' + E(at) + '</p><p>' + E(D.rested) + '</p>' + (open > 0 && D.cagesKept ? '<p>' + E(D.cagesKept) + '</p>' : '') + '<button class="btn gold" id="a1r-go">' + E(D.button || 'CARRY ON') + '</button></div>';
    for (const ev of ['contextmenu', 'mousedown', 'click']) el.addEventListener(ev, e => { if (ev === 'contextmenu' || e.target === el) e.preventDefault(); });
    document.body.appendChild(el);
    $('a1r-go').onclick = () => { el.remove(); G.paused = false; go(); };
    try { $('a1r-go').focus(); } catch (e) {}
  };
  { const f = togglePause; togglePause = function(){ if (document.getElementById('a1r')) return; return f.apply(this, arguments); }; }   // Esc and M do nothing behind the resume card
  { const f = X.openLast; X.openLast = function(){ const r = f.apply(this, arguments); try { A.save('youCreator'); } catch (e) {} return r; }; }
  { const f = pickMomentum; pickMomentum = function(i){ let x = null; try { x = G && G.momChoice && !G.momHidden && G.momChoice.opts[i]; } catch (e) {}
      const r = f.apply(this, arguments);
      try { if (x && S() && G.f45.a.step === 'momentum'){ const st = F.state(); if (st && st.a1){ st.a1.mom = [].concat(st.a1.mom || [], [x.kind === 'card' ? {k:'card', id:x.c.id} : {k:'order', id:x.o.id}]); saveMeta(); } } } catch (e) {}
      return r; }; }
  A.enter = function(step){
    const s = S(); if (!s) return;
    s.step = step; s.t = G.frame; if (A.ORDER.indexOf(step) > A.ORDER.indexOf('soldier')) s.cmd = s.bashCard = true;   // Q81: Command's card has been read by now (a resume past it too)
     T.log.push('A45 ' + step); try { A.save(step); } catch (e) {}
    try { A.STEPS[step](s); } catch (e) { console.warn('A45 step', step, e); }
  };
  // a "do it" on an ability: it cannot be failed. If the enemies die first, fresh ones come (A.K.again times), then it lets the player on.
  A.need = function(id, spec, o){
    if (window.SO45) SO45.needSpec = spec;                          // B1: the freeze zeroes this Specialty's ab33 cooldowns (SO45.unfreeze)
    // The targets cannot die before the key is pressed, and when one is in reach the field stands still until it is (a use before that does not count).
    const s = S(), u0 = s.use[spec] | 0; let rounds = 0, uF = null;
    const close = () => alive(s.foes).some(e => !e.dormant && dist(e, G.leader) < A.K.reach);
    const used = () => uF !== null && (s.use[spec] | 0) > uF && (!o.ok || o.ok());
    const end = () => { s.keep = false; s.freeze = null; return true; };
    s.keep = A.is('freeze');
    let g = null; g = T.gate(id, () => {
      if (o.tick) o.tick();
      if (!A.is('freeze')){ if ((s.use[spec] | 0) > u0 && (!o.ok || o.ok())) return end(); }
      else { if (used()) return end();
        if (uF === null && !G.leader.down && (o.when ? o.when() : close())){ uF = s.use[spec] | 0; const a = G.abil[spec]; if (a) a.cd = 0; s.freeze = {done:() => (s.use[spec] | 0) > uF}; if (g) g.wait = false; } }   // the field runs again at the press; the step still waits for ok() (Q81: Hal must strike)
      if (o.fresh && !alive(s.foes).length){ if (!o.endless && rounds++ >= A.K.again) return end(); s.foes = o.fresh(); G.f45.road = s.foes; }
      return false; }, {vars:o.vars, spec, lead:o.lead, then(){ const f0 = G.frame; T.gate(id + 'B', () => G.frame >= f0 + A.K.beat, {then:o.then}); }});
    if (g) g.wait = A.is('freeze');                                  // the gold line shows only when a press counts
    if (g && !o.when) g.far = () => A.is('freeze') && uF === null;      // S6 1c criterion 6: a press before a target is in reach gets the too-far line (T45.whyFor)
  };
  const clear = (id, then) => T.gate(id, () => !alive(S().foes).length, {then(){ const s = S(), run = (s.foes || []).filter(e => e && e.broken && !e.dead); if (run.length) G.enemies = G.enemies.filter(e => !run.includes(e)); then(); }});   // a silent wait: an id with no words draws nothing
  const march = n => { const s = S(), L = G.leader; s.foes = put(foe(), Math.min(L.x + A.K.wave, P(A.K.outer).x), P(0).y + CELL / 2, n); G.f45.road = s.foes; return s.foes; };

  A.STEPS = {
    move(s){
      s.ring = P(A.K.ring); s.ring.y += CELL / 2; s.tgt = () => s.ring;
      T.lesson('move', {world:G.leader, r:34, then(){ T.gate('move', () => dist(G.leader, s.ring) < 46, {then(){ A.enter('fight'); }}); }});
    },
    fight(s){
      const p = P(A.K.sleeper); s.foes = put(foe(), p.x, p.y + CELL / 2, 1, {dormant:true}); G.f45.road = s.foes; s.tgt = () => near(s.foes);
      T.lesson('fight', {then(){ T.gate('fight', () => !alive(s.foes).length, {then(){ A.enter('ability'); }}); }});
    },
    ability(s){   // Q81: no card, no key; two slavers and a plain fight (Command is taught at the soldier step, after the mark)
      march(2); s.tgt = () => near(s.foes);
      clear('abilityFight', () => A.enter('objective'));
    },
    objective(s){
      const cg = G.cages[0]; G.f45.stage = 'cages'; s.tgt = () => cg;
      s.guards = put(foe(), cg.x, cg.y + 30, X.N.cage, {dormant:true}); s.foes = s.guards;
      T.lesson('objective', {deck:() => DECK.objAt, then(){
        T.gate('objective', () => dist(G.leader, cg) < 330 || s.guards.some(e => !e.dormant) || cg.open, {then(){ A.enter('cage'); }}); }});
    },
    cage(s){
      const cg = G.cages[0]; s.tgt = () => near(s.guards) || cg;
      T.gate('cage0', () => !alive(s.guards).length || cg.open, {then(){
        T.lesson('cage', {world:cg, r:46, then(){ T.gate('cage', () => cg.open, {then(){ A.enter('soldier'); }}); }}); }});
    },
    soldier(s){
      const vars = {key:key('SOLDIER')}, cv = {key:key('FOLK_HERO')}; s.foes = []; s.tgt = () => near(s.foes);   // Q81 9a: the dashed ring is not drawn before the ring step names it
      { const c2 = G.cages[1]; s.g2 = put(foe(), c2.x, c2.y + 30, X.N.cage, {dormant:true}); }   // not at the player's feet later
      const bashIn = () => { const R = (G.mod && G.mod.radius) || 120; return !!hal && hal.state === 'up' && alive(s.foes).some(e => !e.dormant && dist(e, hal) <= R); };   // QA 19 Nov: a downed Hal cannot bash   // Q81 9b: the bash's own test (abilities.js SOLDIER): a live slaver within the radius of Hal
      const hal = mate('hal');
      const markIn = () => { const m = window.F33 && F33.mark && F33.mark(); return !!(m && hal && hal.state === 'up' && alive(s.foes).includes(m) && dist(hal, m) < Math.min(A.K.halReach, 46 + (G.melee.reach || 0) + (G.reachBonus || 0) + A.K.halPad)); };   // QA 19 Nov: Hal swings only when the slaver is inside his melee reach (centre distance < 46 + weapon reach, about 60); the old 110 lit the line before he could strike   // Q81: a marked slaver within Hal's reach
      s.markIn = markIn;
      const noHit = () => { if (s.cmdAt > 0 && s.noHitAt !== s.cmdAt && !(s.halHit >= s.cmdAt) && G.frame - s.cmdAt > A.K.strikeWait){ s.noHitAt = s.cmdAt; try { const a = G.abil.FOLK_HERO; if (a) a.cd = 0; Object.values(G.leader.ab33 || {}).forEach(x => { x.cd = 0; }); } catch (e) {}   // criterion 8: pressed, Hal struck nothing
          try { const w = (CAMPAIGN_LINES.lessons.command || {}).noHit; if (w && w.text) note(T.who(w.who) + ': “' + w.text + '”'); } catch (e) {} } };
      T.lesson('halJoins', {hud:{kind:'mate', m:hal}, face:hal && hal.p, then(){
        // Q52: the mark lesson first. One slaver; he dies, or breaks, after a mark was placed (GD 103b1739). Then Q81: Command, then Shield Bash.
        T.lesson('mark', {then(){ march(1);
          T.gate('mark', () => { { const m = window.F33 && F33.mark && F33.mark(); if (m && s.foes.includes(m)) m._marked = true; }   // F1 (GD 103b1739): a mark placed, then he is dead or broken; who killed him does not matter
            if (!alive(s.foes).length){ if (s.foes.some(e => e && e._marked)) return true; march(1); } return false; }, {then(){
            s.cmd = true;                                               // Command's icon comes onto the bar with its card
            try { const raw = T.text('command').legendRaw; if (raw) T.legend(raw, 'FOLK_HERO'); } catch (e) {}   // criterion 10: the legend names Command from its card
            T.lesson('command', {hud:{kind:'ability', spec:'FOLK_HERO'}, vars:cv, then(){
              march(2);
              A.need('command', 'FOLK_HERO', {vars:cv, lead:true, when:markIn, ok:() => s.cmdAt > 0 && s.halHit >= s.cmdAt && s.noHitAt !== s.cmdAt, tick:noHit, endless:true, fresh:() => march(2), then(){ clear('command2', () => {
                s.bashCard = true; T.lesson('soldier', {hud:{kind:'ability', spec:'SOLDIER'}, vars, then(){
                  march(2);
                  A.need('soldier', 'SOLDIER', {vars, when:bashIn, ok:() => s.bash, fresh:() => march(2), then(){ clear('soldier2', () => A.enter('ring')); }}); }}); }); }}); }}); }}); }}); }});
    },
    ring(s){
      const cg = G.cages[1], hal = mate('hal'); s.lock2 = false; s.ringOn = true; s.tgt = () => cg;
      s.guards = s.g2 ? alive(s.g2) : put(foe(), cg.x, cg.y + 30, X.N.cage, {dormant:true}); s.g2 = null; s.foes = s.guards; s.hal = hal; s.halOut = 0;
      T.lesson('ring', {world:G.leader, r:(G.mod && G.mod.radius) || 120, then(){
        T.gate('ring', () => cg.open || (dist(G.leader, cg) < 170 && (!hal || hal.inF || hal.state !== 'up')), {noAfter:!!T.text('condition').title, then(){
          s.hal = null; T.lesson('condition', {hud:{kind:'mate', m:hal, part:'con'}, then(){ T.gate('ring2', () => cg.open, {then(){ A.enter('scoundrel'); }}); }}); }}); }});
    },
    scoundrel(s){
      const vars = {key:key('SCOUNDREL')}, p = P(A.K.sergeant);
      const serg = () => { const k = BESTIARY.enforcer ? 'enforcer' : foe(), out = put(k, p.x, p.y + CELL / 2, 1);
        if (k !== 'enforcer') for (const e of out){ e.maxCon = Math.round(e.maxCon * A.K.sergeantCon); e.con = e.maxCon; }
        s.foes = out; return out; };
      s.foes = []; s.tgt = () => near(s.foes);
      const pinch = mate('pinch');
      T.lesson('pinchJoins', {hud:{kind:'mate', m:pinch}, face:pinch && pinch.p, then(){ T.lesson('scoundrel', {hud:{kind:'ability', spec:'SCOUNDREL'}, vars, then(){
        serg();
        A.need('scoundrel', 'SCOUNDREL', {vars, fresh:serg, then(){ clear('scoundrel2', () => A.enter('trap')); }}); }}); }});
    },
    trap(s){
      const p = P(A.K.trap[0], A.K.trap[1]), t = {x:p.x, y:p.y, kind:'beartrap', armed:true, seen:true, enemy:true, dis:0, lesson:true};
      (G.traps = G.traps || []).push(t); s.trap = t; s.tgt = () => t; s.wT = G.leader.wounds;
      // S6-11 (2e): the new words (stand still), and the legend line only while the lesson is up (criterion 19)
      const t2 = window.TRAP2E && TRAP2E.live(), leg = t2 && T.is('trap') ? TRAP2E.words().legend : null;
      const legOff = () => { if (leg){ const z = T.st(); z.legend = z.legend.filter(x => x !== leg); } };
      if (leg) T.legend(leg);
      T.lesson('trap', {world:t, r:30, then(){ T.gate('trap', () => !t.armed || G.leader.x > t.x + 70, {then(){ legOff(); A.enter('last'); }}); }});
    },
    last(s){
      const cg = G.cages[2]; s.lock3 = false; s.tgt = () => cg; s.keys = {SOLDIER:key('SOLDIER'), SCOUNDREL:key('SCOUNDREL')};
      s.guards = put(foe(), cg.x, cg.y + 30, X.N.last, {dormant:true}); s.foes = s.guards;
    },
    you(s){
      const L = META.leader, sp = L.spec;
      const vars = {name:L.name, leader:L.name, race:nm(RACES, L.race), class:nm(CLASSES, L.cls), spec:nm(SPECS, sp), ability:nm(ABILITIES, sp), key:T.keyOf(sp, 'leader')};
      const lone = () => { const p = P(A.K.outer); s.foes = put(foe(), p.x, p.y + CELL / 2, 1); G.f45.road = s.foes; return s.foes; };
      s.foes = []; s.tgt = () => near(s.foes);
      const heal = sp === 'CLERIC', hurtOne = () => G.squad.some(m => m.state === 'up' && m.con < m.maxCon);
      // a healer's "do it" needs someone hurt: one scripted bolt on a mate when the slaver is in reach [S]
      const when = !heal ? null : () => { if (!alive(s.foes).some(e => !e.dormant && dist(e, G.leader) < A.K.reach)) return false;
        if (!hurtOne() && !s.cut && alive(s.foes).some(e => !e.dormant && dist(e, G.leader) < A.K.reach)){ s.cut = true; const h = [mate('hal'), mate('pinch')].concat(G.squad).find(m => m && m.state === 'up');
          if (h){ pop(h.x, h.y - 56, W2('bolt'), '#ff8a7a'); h.con = Math.max(1, h.con - 1); h.flash = 8; } }
        return hurtOne(); };
      if (heal) s.tgt = () => G.squad.filter(m => m.state === 'up' && m.con < m.maxCon).sort((a, b) => a.con / a.maxCon - b.con / b.maxCon)[0] || near(s.foes);
      let cf = ''; try { cf = heroPortraitURL('cayde'); } catch (e) {}
      if (!T.is('handover') || !T.text('handover').title) said((FD().s14 || {}).cayde);
      T.lesson('handover', {face:cf, then(){ T.lesson('you', {hud:{kind:'leader'}, vars, then(){
        lone();
        for (const k of ['SOLDIER', 'SCOUNDREL']) if (s.keys && s.keys[k] && key(k) && s.keys[k] !== key(k)) note(T.fill(W2('moved'), {ability:nm(ABILITIES, k), key:key(k)}));
        A.need('you', sp, {vars, lead:true, when, fresh:lone, then(){ T.legendYou(sp); clear('you2', () => A.enter('momentum')); }}); }}); }});
    },
    momentum(s){
      const p = P(A.K.outer + 1); s.foes = put(foe(), p.x, p.y + CELL / 2, A.K.outerN, {dormant:true}); G.f45.road = s.foes; s.tgt = () => near(s.foes);
      T.release('momentum');                                           // the bar shows from here, and the guards' deaths fill it
      T.lesson('momentum', {deck:() => DECK.momAt, then(){
        clear('momentum0', () => {
          try { if (!s.momSeen && G.levelQueue <= 0 && !G.momChoice) gainXP(Math.max(1, G.xpNext - G.xp)); if (!s.momSeen && !G.momChoice) openMomentum(); } catch (e) {}
          T.gate('momentum', () => !G.momChoice && G.levelQueue <= 0, {then(){ A.enter('commander'); }}); }); }});
    },
    commander(s){
      const cp = G.camps[0], boss = cp && cp.boss; s.check = true; s.tgt = null; G.f45.road = [];
      T.lesson('commander', boss && !boss.dead ? {world:boss, r:44} : {});
      T.gate('commander', () => !!(cp && cp.done));
    }
  };

  /* ---- the tick, the target, the cage locks -------------------------------------------- */
  { const f = X.tick; X.tick = function(){ if (!S()) return f.apply(this, arguments); try { A.tick(); } catch (e) { console.warn('A45 tick', e); } }; }
  { const f = X.target; X.target = function(){ const s = S(); if (!s) return f.apply(this, arguments);
      if (s.step === 'commander'){ const cp = G.camps[0]; return cp && cp.boss && !cp.boss.dead ? cp.boss : cp; }
      try { return typeof s.tgt === 'function' ? s.tgt() : (s.tgt || null); } catch (e) { return null; } }; }
  A.trapMate = by => !!(by && !by.leader && !by.wagon);
  A.trapLine = (by, LT) => !A.trapMate(by) ? LT.sprung : by.spec === 'SCOUNDREL' ? LT.sprungPinch : LT.sprungMate;   // 17d: who sprang the lesson trap picks the line
  A.tick = function(){
    const s = S(), L = G.leader; if (!s) return;
    X.pointerCol = s.step === 'commander' ? '#ff5a4a' : null;
    if (G.tipsoffWait && s.step === 'objective' && !T.cur && !G.enemies.some(e => e && !e.dead && !e.broken && !e.dormant)){ G.tipsoffWait = false; try { tip('tipsoff'); } catch (e) {} }   // GD 18 Nov: the tips-off banner comes on the quiet walk to the first cage
    if (s.step === 'momentum' && G.momChoice && !T.cur){ s.momSeen = true; if (A.is('freeze') && !s.freeze) s.freeze = {done:() => !G.momChoice}; }   // the first choice holds the fight
    if (s.trap && !s.sprung && !s.trap.armed){ s.sprung = true;       // stepped on: Pinch says so
      const w = A.trapLine(s.trap.sprungBy, (window.CAMPAIGN_LINES && CAMPAIGN_LINES.lessons && CAMPAIGN_LINES.lessons.trap) || {}), mate = A.trapMate(s.trap.sprungBy);   // S6-11 17d: the line follows who sprang it
      if (w && w.text && (mate || L.wounds < s.wT) && T.is('trap')) note(T.who(w.who) + ': “' + w.text.replace(/{mate}/g, mate ? (s.trap.sprungBy.name || 'A mate') : '') + '”'); }
    if (s.trap && s.trap.lesson && window.TRAP2E && TRAP2E.live() && T.is('trap')){   // S6-11 (2e): Pinch says it is done, or to stand still
      const t = s.trap, z = G.t2e, w = TRAP2E.words(), say = x => { const tx = x && (x.text || (typeof x === 'string' ? x : '')); if (tx) note(T.who((x && x.who) || 'pinch') + ': “' + tx + '”'); };
      if (t.safeT != null && !s.trapDone){ s.trapDone = true; say(w.done); }
      if (t.armed && s.step === 'trap' && z && z.cutT === t && z.cut !== s.cutSeen){ s.cutSeen = z.cut;
        if (G.frame - (s.cutAt == null ? -1e9 : s.cutAt) >= TRAP2E.K.movedGap){ s.cutAt = G.frame; say(w.moved); } } }
    // S6: the first Wound lost opens the lesson; the first bolt at the first cage always hits [S]
    if (!G.f45.signed && !s.wSaid && !s.camp){
      if (L.wounds < s.w0){ s.wSaid = true; T.lesson('wounds', {hud:{kind:'leader'}}); }
      else if (A.is('bolt') && s.step === 'cage' && s.guards && alive(s.guards).some(e => !e.dormant)){
        s.wake = s.wake || G.frame;
        if (G.frame - s.wake > A.K.boltAfter){ s.wake = 1e9; pop(L.x, L.y - 40, W2('bolt'), '#ff8a7a'); hurtSquad(1, L, true); }
      }
    }
    // S9: Hal outside the ring says so
    if (s.hal && s.hal.state === 'up'){
      if (s.hal.inF) s.halOut = 0;
      else if (++s.halOut >= A.K.halOut && G.frame - (s.halSaid || -1e9) >= A.K.halSay){ s.halSaid = G.frame; s.halOut = 0; const r = T.text('ring').remind; if (r && T.is('ring')) note(r); }
    }
    // S16: the commander calls for guards once [S] (the plan's bug: the call had no limit)
    const cp = G.camps[0], boss = cp && cp.boss;
    if (boss && !boss.dead && A.is('guards')){
      boss.sumCd = 1e9;
      const B = BESTIARY[boss.k];
      if (!boss.dormant && !s.sum && B && B.summons){ s.sumT = (s.sumT || 0) + 1;
        if (s.sumT > A.K.guardsAfter){ s.sum = true; for (let i = 0; i < A.K.guards; i++) spawnEnemy(B.summons, boss.x + rnd(-40, 40), boss.y + rnd(-40, 40)); } }
    }
    // D2: Hal and Pinch go down, they do not die
    if (A.is('nodeath')) for (const m of G.squad) if (m.p && m.p.f34 && m.state === 'dead') m.state = 'stable';
  };
  A.K.lunge = {frames:45, speed:6, stop:36};
  A.K.halUpAfter = 180;   // QA 19 Nov: the Founding has no Get Back, so a downed Hal got up only if he was never down; now he stands after 3 s, or at once when the Leader stands on him
  A.halUp = function(s){
    if (!s || !A.is('nodeath') || s.camp || G.leader.down) return;   // LE b71fcb56: with the Leader down nobody stands, or a mate is always up and the lost screen never comes
    for (const m of G.squad){ if (!(m.p && m.p.f34 === 'hal') || (m.state !== 'bleeding' && m.state !== 'stable')){ if (m.p && m.p.f34 === 'hal') m._downT = 0; continue; }
      m._downT = (m._downT | 0) + 1;
      if (m._downT >= A.K.halUpAfter || dist(m, G.leader) < 40){ m._downT = 0; standUp(m, 'BACK IN THE FIGHT'); } }
  };
  A.K.litGrace = 15;   // GD 6b edge: a press up to 15 frames (0.25 s) after the line went dark still counts as lit
  A.lunge = function(s){
    try { if (s && s.step === 'soldier' && s.markIn && s.markIn()) s.litAt = G.frame; } catch (e) {}   // for a moment after Command in the soldier step Hal closes on the mark (the squad's charge); his own swing test is 46 px
    if (!s || s.step !== 'soldier' || !s.cmd || s.bashCard || !(s.cmdAt > 0) || !s.lungeOk) return;
    const dt = G.frame - s.cmdAt; if (dt < 0 || dt > A.K.lunge.frames || G.leader.down) return;
    const m = window.F33 && F33.mark && F33.mark(), hal = G.squad.find(u => u.p && u.p.f34 === 'hal' && u.state === 'up'); if (!m || !hal || m.dead) return;
    if (s.lungeDone || s.halHit >= s.cmdAt) return;
    let d = dist(hal, m);
    if (d > A.K.lunge.stop){ const k = Math.min(A.K.lunge.speed, d - A.K.lunge.stop) / d; hal.x += (m.x - hal.x) * k; hal.y += (m.y - hal.y) * k; d = dist(hal, m); }   // step first, then test: updateMates pulls him back 2-4 px before this runs (LE 11e2f4ff)
    if (d <= A.K.lunge.stop + 1){ hal.timer = 0; s.lungeDone = true; }   // in reach: the swing is ready next frame (F5: a bow shot on the way spent it)
    else hal.timer = Math.max(hal.timer || 0, 3);   // out of reach: no bow shot until he is there
  };
  A.onUse = function(spec){
    const X5 = window.SO45;                                         // B1: in the 'you' step only the Leader's own press counts (SO45.caster is set round ABIL33.use)
    if (X5){ try { if (X5.youStep() && META.leader && spec === META.leader.spec && X5.caster !== undefined && (X5.caster !== G.leader || X5.casterAuto)) return; } catch (e) {} X5.counted = true; }
    const s = S(); if (!s) return;
    s.use[spec] = (s.use[spec] | 0) + 1; if (spec === 'FOLK_HERO'){ s.cmdAt = G.frame; try { s.lungeOk = !!(s.markIn && s.markIn()) || G.frame - s.litAt <= A.K.litGrace; s.lungeDone = false; if (s.lungeOk){ const h = G.squad.find(u => u.p && u.p.f34 === 'hal' && u.state === 'up'); if (h) h.timer = 3; } } catch (e) { s.lungeOk = false; } }   // GD 6b: Hal lunges only if the line was lit at the press
    if (spec === 'SOLDIER'){ const L = G.leader, R = (G.mod && G.mod.radius) || 120; const hu = G.squad.find(m => m.p && m.p.f34 === "hal" && m.state !== "dead") || L; if (G.enemies.some(e => !e.dead && !e.dormant && dist(e, hu) <= R + 10)) s.bash = true; }   // 9b: from the caster, Hal
    if (s.check) T.used(spec);
  };
  A.hookLate = function(){
    if (A.hooked) return; A.hooked = true;
    A.hookBrief();
    // Q81 (R3): until Command's card the Leader's ability is off the bar and its key does nothing (lessons on). The flag s.cmd is set when the card opens.
    if (window.ABIL33) ABIL33.locked = u => { const s = S() || (typeof G !== 'undefined' && G && G.over && G.contract && G.contract.f45 && G.f45 && G.f45.a) || null;   /* QA 54102382: still locked on the lost-fight screen (S() is null once G.over) */
      return !!(s && A.is('command') && u && ((!s.cmd && u === G.leader && u.spec === 'FOLK_HERO') || (!s.bashCard && u !== G.leader && u.spec === 'SOLDIER'))); };   // Q81 5a: Hal's Shield Bash waits for its own card too
    if (typeof useAbility === 'function'){ const f = useAbility; useAbility = function(spec){ if (spec === 'FOLK_HERO' && window.ABIL33 && ABIL33.locked(G.leader) && !ABIL33.inner) return; return f.apply(this, arguments); }; }
    // Q81 and Q52: what Hal struck. s.halHit is the frame of his last strike; a slaver Hal struck while he was marked carries _halMark.
    if (typeof strike === 'function'){ const f = strike; strike = function(e, skill, dmg, o){
        try { const s = S(), u = o && o.from; if (s && u && u !== G.leader && u.p && u.p.f34 === 'hal' && e){ s.halHit = G.frame; if (window.F33 && F33.mark && F33.mark() === e) e._halMark = true; } } catch (x) {}
        return f.apply(this, arguments); }; strike.toString = () => String(f); }   // self-tests read the source of strike (TERRAIN)
    // Q52 (Patrick, 18 Nov): in the Founding nobody attacks on their own. The old autoLeader wrap of F33.clicksOn is gone:
    // the Leader fights by clicks, and Squad Mates attack the mark or a foe in contact (js/combat/drills.js F.pick), as in the main game.
    if (typeof useAbility === 'function'){ const f = useAbility; useAbility = function(spec){
        const a = typeof G !== 'undefined' && G && G.abil && G.abil[spec], cd0 = a ? a.cd : 0;
        const r = f.apply(this, arguments);
        try { if (a && cd0 <= 0 && a.cd > 0) A.onUse(spec); } catch (e) {}
        return r; }; }
    if (typeof updateContract === 'function'){ const f = updateContract; updateContract = function(){
        const s = S(); if (!s) return f.apply(this, arguments);
        const c = G.cages, l2 = s.lock2 && c[1] && !c[1].open, l3 = s.lock3 && c[2] && !c[2].open;
        if (c[1]) c[1].sealed = !!l2; if (c[2]) c[2].sealed = !!l3;   /* LE F1: no contest cue on a locked cage */
        if (l2) c[1].prog = 0; if (l3) c[2].prog = 0;
        const r = f.apply(this, arguments);
        try { A.lunge(s); A.halUp(s); } catch (e) {}   // QA/LE F5 (19 Nov): Command sends Hal to the mark, so a press while the line is lit ends in a strike
        if (typeof G !== 'undefined' && G && G.cages){ if (l2 && !G.cages[1].open) G.cages[1].prog = 0; if (l3 && !G.cages[2].open) G.cages[2].prog = 0; }
        return r; }; }
    // while no slaver is on the road the task line does not count to zero
    if (typeof contractLine === 'function'){ const f = contractLine; contractLine = function(){
        const s = S(), r = f.apply(this, arguments);
        if (s && G.f45.stage === 'road' && Array.isArray(r) && !alive(G.f45.road).length) return [W2('road'), (T.g && T.g.show && T.g.tx.gate) || ''];
        return r; }; }
    // the camp sleeps until its lesson: no stray shot or long sight line brings Vane down the road early
    if (typeof wake === 'function'){ const f = wake; wake = function(e){
        const s = S();
        if (s && e && e.dormant && s.g2 && s.g2.includes(e)) return;
        if (s && e && e.dormant && A.is('campSleep') && s.step !== 'commander'){ const cp = G.camps[0];
          if (cp && cp.boss && e.group === cp.boss.group){ if (!s.heldWake){ s.heldWake = true; T.log.push('A45 camp wake held at ' + s.step); } return; } }
        return f.apply(this, arguments); }; }
    // a held fight: the field stands still until the player does the thing (the card pause is T45's own)
    if (typeof update === 'function'){ const f = update; update = function(){
        const s = S();
        if (s && s.freeze && !T.cur){ let done = true; try { done = !A.is('freeze') || s.freeze.done(); } catch (e) {}
          if (done) s.freeze = null; else { try { T.tick(); } catch (e) {} return; } }
        return f.apply(this, arguments); }; }
    const kept = e => { const s = S(); return !!(s && s.keep && e && s.foes && s.foes.includes(e)); };
    if (typeof hurtEnemy === 'function'){ const f = hurtEnemy; hurtEnemy = function(e, n){
        if (kept(e)){ if (e.con <= 1){ e.flash = 6; try { wake(e); } catch (x) {} return; } arguments[1] = Math.min(n, e.con - 1); }
        return f.apply(this, arguments); }; }
    if (typeof killEnemy === 'function'){ const f = killEnemy; killEnemy = function(e){ if (kept(e)){ e.con = Math.max(1, e.con); return; } return f.apply(this, arguments); }; }
    // nothing untaught on screen: the old key list, the Momentum bar before its lesson, the Command Radius before Hal, every marker but the gold pointer
    const hid = () => { const s = S(); return s && A.is('hide') ? s : null; };
    if (window.UX83 && typeof UX83.hint43 === 'function'){ const f = UX83.hint43; UX83.hint43 = function(){ if (hid() || (A.is('hide') && typeof G !== 'undefined' && G && G.contract && G.contract.f45 && G.f45 && G.f45.a)) return; return f.apply(this, arguments); }; }
    if (typeof drawMomentum === 'function'){ const f = drawMomentum; drawMomentum = function(){ if (hid() && T.held('momentum')) return; return f.apply(this, arguments); }; }
    if (window.DECK && typeof DECK.momentum === 'function'){ const f = DECK.momentum; DECK.momentum = function(){ if (hid() && T.held('momentum')) return; return f.apply(this, arguments); }; }
    if (typeof hurtSquad === 'function'){ const f = hurtSquad; hurtSquad = function(n, victim){           // the lesson trap costs the Leader one Wound at most [S]
        const s = S();
        if (s && s.step === 'trap' && A.is('trapCap') && (victim == null || victim === G.leader)){ if (G.leader.wounds < s.wT) return; return f.call(this, 1, G.leader, true); }
        return f.apply(this, arguments); }; hurtSquad.__deck = f.__deck; }   // keep the Deck's marker (DECK.selfTest reads it)
    if (typeof pop === 'function'){ const f = pop; pop = function(x, y, t){ const s = S(); if (s && s.step === 'trap' && A.is('trapCap') && /^-\d+$/.test(String(t)) && dist({x, y}, G.leader) < 60) arguments[2] = '-1'; return f.apply(this, arguments); }; }
    if (typeof tip === 'function'){ const f = tip; tip = function(){ if (hid()) return; return f.apply(this, arguments); }; window.tip = tip; }   // no old tip over a lesson
    { const f = X.drawPointer; X.drawPointer = function(){                // the gold arrow stays up behind a lesson card ("follow the arrow")
        if (S() && T.cur && G.paused){ G.paused = false; try { return f.apply(this, arguments); } finally { G.paused = true; } }
        return f.apply(this, arguments); }; }
    if (typeof objectiveMarkers === 'function'){ const f = objectiveMarkers; objectiveMarkers = function(){ const s = hid(), r = f.apply(this, arguments); return s && s.step !== 'commander' ? [] : r; }; }
    if (typeof window.gfxRing === 'function'){ const f = window.gfxRing; window.gfxRing = function(){ const s = hid(); if (s && !s.ringOn){ try { ctx.beginPath(); } catch (e) {} return; } return f.apply(this, arguments); }; }
    if (typeof offerParlay === 'function'){ const f = offerParlay; offerParlay = function(e){
        if (S() && T.held('parley')){ if (e) e.parleyed = true; return; }   // no white flag before its lesson (S44)
        return f.apply(this, arguments); }; }
    if (typeof endDeployment === 'function'){ const f = endDeployment; endDeployment = function(result){
        const s = S(); try { if (s && !s.camp && result !== 'victory') A.resumePending = true; } catch (e) {}   // GD 14a (19 Nov): a fight lost or left on the road is tried again from the start of its step, by the Q59 rule (resume card, no MARCH story)
        if (!s || !A.is('debrief')) return f.apply(this, arguments);
        const hurt = new Set(G.downedIds || []), lw = !!G.leaderWasDown, squad = G.squad.slice();
        for (const m of G.squad) if (m.p && m.p.f34 && (m.state === 'dead' || m.state === 'bleeding')) m.state = 'stable';
        if (G.downedIds && G.downedIds.clear) G.downedIds.clear();      // no injury roll in the Founding's first fight
        G.leaderWasDown = false;
        if (result !== 'victory'){ G.leaderSlain = false; if (result === 'fallen'){ arguments[0] = 'fled'; G.failHead = G.failHead || W2('lost').toUpperCase(); } }
        const won = arguments[0] === 'victory', keep = {nem:JSON.stringify(META.nemeses || []), st:JSON.stringify(META.standing || {}), bond:squad.map(m => m.p.bond)};
        A._deb = {result:arguments[0], s, squad, hurt, lw};          // read by the renderDebrief wrap below: later modules draw the report again
        try { T.reset(); } catch (e) {}
        const r = f.apply(this, arguments);
        try {
          META.nemeses = JSON.parse(keep.nem);                         // no nemesis is made on the road: Vane is story cast
          if (won) for (const m of squad) if (hurt.has(m.p.id)) m.p.resting = 1;   // [S] hurt: rests one job; a lost fight keeps nothing
          else { META.standing = JSON.parse(keep.st); squad.forEach((m, i) => { m.p.bond = keep.bond[i]; }); }
          if (typeof saveMeta === 'function') saveMeta();
          A.debrief(arguments[0], s, squad, hurt, lw);
        } catch (e) { console.warn('A45 debrief', e); }
        return r; }; }
    if (typeof renderDebrief === 'function'){ const f = renderDebrief; renderDebrief = function(){
        const r = f.apply(this, arguments);
        try { const d = A._deb; if (d && A.ok() && typeof G !== 'undefined' && G && G.contract && G.contract.f45) A.debrief(d.result, d.s, d.squad, d.hurt, d.lw); } catch (e) { console.warn('A45 debrief', e); }
        return r; }; renderDebrief.last = f.last; }
    if (typeof leaveDebrief === 'function'){ const f = leaveDebrief; leaveDebrief = function(){ A._deb = null; return f.apply(this, arguments); }; }
  };
  { const f = X.signed; X.signed = function(L){ const r = f.apply(this, arguments); try { if (G && G.f45 && G.f45.a){ G.f45.signed = true; A.enter('you'); } } catch (e) { console.warn('A45 signed', e); } return r; }; }
  if (document.readyState === 'complete') A.hookLate(); else window.addEventListener('load', A.hookLate);

  /* ---- S16a: the Founding debrief ---------------------------------------------------------- */
  A.usedNames = s => { const u = s.check ? ((G.t45 && G.t45.used) || {}) : s.use; return Object.keys(u).filter(k => u[k] > 0 && ABILITIES[k] && (has(k) || (META.leader && META.leader.spec === k))).map(k => nm(ABILITIES, k)); };   // in the check fight: what was used there
  A.unused = function(s){
    let want = ['SOLDIER', 'SCOUNDREL'].filter(k => G.squad.some(m => m.spec === k)); if (META.leader && !want.includes(META.leader.spec)) want.push(META.leader.spec);
    if (!s.check && !s.ringOn) want = want.filter(k => k === 'SOLDIER' ? s.bashCard : (META.leader && k === META.leader.spec) ? s.cmd : true);   // N1: only a lesson already taught
    const used = s.check ? ((G.t45 && G.t45.used) || {}) : s.use; const k = want.find(x => !used[x]); return k ? nm(ABILITIES, k) : '';
  };
  A.debrief = function(result, s, squad, hurt, leaderDown){
    const d = FD().debrief; if (!d) return;
    const el = document.getElementById('debrief-inner'); if (!el) return;
    const e2 = typeof esc === 'function' ? esc : (x => x), won = result === 'victory', L = META.leader || (G.leader && G.leader.p);
    const row = (n, h) => `<p>${e2(n)}: <b${h ? ' class="bad"' : ''}>${e2(h ? (won ? String(d.hurt).replace(/^hurt: /i, 'hurt, ') : 'hurt') : d.unhurt)}</b></p>`;
    let h = `<p>${e2(won ? d.won : d.lost)}</p>`;
    if (L) h += row(L.name, leaderDown || (G.leader && G.leader.wounds < G.leader.maxWounds));
    for (const m of squad) h += row(m.p.name, hurt.has(m.p.id));
    const used = A.usedNames(s), miss = A.unused(s);
    if (used.length) h += `<p>${e2(T.fill(d.used, {n:used.join(', ')}))}</p>`;
    if (!won) h += `<p><b>${e2(miss ? T.fill(d.retry, {lesson:miss}) : W2('again'))}</b></p>`;
    try { G.msgs = []; } catch (e) {}
    el.innerHTML = `<span class="d31-head" style="display:none"></span><div class="tag" style="font-size:14px">${e2((FD().acts || [])[0] || 'The Road')}</div><h1 style="font-size:40px">${e2(W2(won ? 'won' : 'lost'))}</h1>
      <div class="log">${h}</div><div><button class="btn gold" onclick="leaveDebrief()">${e2(d.button || 'NEXT')}</button></div>`;
  };

  /* ---- self-test (pure parts: no fight, no save) ---------------------------------------------- */
  A.selfTest = function(){
    const out = []; let bad = 0; const ok = (n, v) => { out.push((v ? 'ok   ' : 'FAIL ') + n); if (!v) bad++; };
    const M0 = typeof MAP !== 'undefined' ? MAP : null;
    try {
      ok('every step in the order has a script', A.ORDER.every(k => typeof A.STEPS[k] === 'function'));
      if (window.F33 && F33.clicksOn && window.F34){ const a0 = F34.active, c0 = F33.clicks, b0 = window.BOT; F33.clicks = true; window.BOT = undefined;
        try { F34.active = () => true; ok('Founding: the click rule holds (Q52: nobody attacks on their own)', F33.clicksOn() === true);
          F34.active = () => false; ok('outside the Founding the clicks stay on', F33.clicksOn() === true); }
        finally { F34.active = a0; F33.clicks = c0; window.BOT = b0; } }
      const L = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.lessons) || {};
      const words = ['move', 'fight', 'objective', 'wounds', 'cage', 'command', 'soldier', 'ring', 'scoundrel', 'trap', 'you', 'momentum', 'commander'];
      ok('every lesson has words in CAMPAIGN_LINES.lessons', words.every(k => L[k] && L[k].title && (L[k].text || []).length));
      ok('no lesson card has more than three lines', words.every(k => !L[k] || (L[k].text || []).length <= 3));
      { const LT = {sprung:1, sprungMate:2, sprungPinch:3}; ok('17d: the trap line follows who sprang it (Leader, mate, Pinch, nobody)', A.trapLine({leader:true}, LT) === 1 && A.trapLine({spec:'SOLDIER', name:'Hal'}, LT) === 2 && A.trapLine({spec:'SCOUNDREL'}, LT) === 3 && A.trapLine(null, LT) === 1); }
      ok('the opening card and the debrief have words', !!(FD().s1 && FD().s1.caption && FD().debrief && FD().debrief.won && FD().debrief.lost));
      const M = X.buildMap({seed:45}), w = M.w, open = (cx, dy) => { const t = M.g[(X.RY + (dy || 0)) * w + cx]; return t === T_GRASS() || t === T_ROAD(); };
      ok('the ring, the sleeper, the sergeant, the trap and the outer guards stand on open ground', open(A.K.ring) && open(A.K.sleeper) && open(A.K.sergeant) && open(A.K.trap[0], A.K.trap[1]) && open(A.K.outer) && open(A.K.outer + 1));
      ok('the sleeper is out of waking reach of the ring (430 px)', (A.K.sleeper - A.K.ring) * CELL > 430);
      ok('in order along the road: ring, sleeper, cage 1, cage 2, sergeant, trap, cage 3, outer guards, camp',
        A.K.ring < A.K.sleeper && A.K.sleeper < X.AT.cages[0][0] && X.AT.cages[1][0] < A.K.sergeant && A.K.sergeant < A.K.trap[0] && A.K.trap[0] < X.AT.cages[2][0] && X.AT.cages[2][0] < A.K.outer && A.K.outer + 1 < X.AT.camp - 5);
      const sw = T.sw.move; T.sw.move = false; ok('one step off: T45.sw.move = false', !A.is('move') && A.is('fight') === A.ok()); if (sw === undefined) delete T.sw.move; else T.sw.move = sw;
      ok('the guard call is capped: ' + A.K.guards + ' guards, once', A.K.guards === 2);
    } catch (e) { ok('self-test ran: ' + e.message, false); }
    if (M0) MAP = M0;
    return {pass:out.length - bad, fail:bad, total:out.length, out};
  };
  const T_GRASS = () => globalT().GRASS, T_ROAD = () => globalT().ROAD;
  function globalT(){ return (0, eval)('T'); }                     // the game's tile table is the global lexical T (not this file's T45 alias)
})();
