/* js/tutorial/act2.js (INT-1 stage 1, 2026-11-16): teaching Act II, Varnholt (B45).
   Was js/act45b.js, moved unchanged. Classic script; the globals keep their names. */
/* ============================================================================
   INDEX B45 - F-45 teaching, Act II: Varnholt (audits/f45-teaching-plan.md, S17 to S34).
   Built so far: S17 the camp as four buildings, S18 the Hiring Line and the stat check,
   S19 Sister Maud the Cleric, S20 to S22 the drill yard (Bleeding Out, Cure Wounds, Shield Wall),
   S23 the Quartermaster (the kit comes unworn), S24 the Treasury and a second hire, S25 the War Table
   (one contract, read and signed; SIGN starts beat b5), S26 the Escort and S27 the ground (cover, a Charge,
   a chest, a Blip) in the b5 fight.
   S29 the first job's debrief (Rest, the first two Advancements: RETURN TO CAMP waits for both).
   S30 to S33 the second Varnholt job, between beats b5 and b6 (the War Table with three cards, the War Council
   with one sure Edge, Luck in the fight, then Standing, the Advancement check and Comrade Bonds in the report).
   S34 the choice (the b6 leads card: lesson `price` on the Standing line).
   Words: CAMPAIGN_LINES.lessons, coach, cast45 (the Campaign Planner's). B45.TXT holds my drafts [N].
   Numbers: B45.K, drafts [S].
   Off: "Lessons: off" in Settings gives the old b4 card (the B45.on switch and ?b45=0 were removed in INT-1, 2026-11-15); one step T45.sw.<key> = false
   (keys: hub, statCheck, qm, table, job, chestPut, adv, job2, council, price, and every lesson id). "Lessons: off" turns all of it off.
   Self-test: B45.selfTest().
   ============================================================================ */
(function(){
  'use strict';
  if (typeof F34 === 'undefined' || !window.T45) return;
  const F = F34, T = window.T45, B = window.B45 = {};
  B.K = {                                                           // [S] drafts
    dummies: 3, dummyAt: 300,                                       // the bout: how many, and px east of the Leader
    fallIn: 90, fallAfter: 420,                                     // Pinch falls when a dummy is this close (px), or after this many frames
    wall: 180,                                                      // frames the Shield Wall is held
    hits: 3, hint: 1200, cap: 10800,                                // G1: hits to fell a dummy; frames before Hal says the key (20 s); frames before the bout counts as done (3 min)
    endHold: 150,                                                   // P23-BUG-4 (GD b9398cf1): frames the field holds after the last dummy falls, before the report (2.5 s)
    hire2: 5,                                                       // gp: the second hire, half price (D3)
    job2: 'hunt', host2: 'deserters', pay2: 300, luckWait: 90,                 // the second job: kind, enemy, pay
    cart: 200,                                                      // px the cart moves to pass the Escort gate ("10 paces")
    see: 320, chestAhead: 5, chestKind: 'purse'                     // px at which a thing counts as seen; the placed chest: route points ahead, and what is in it
  };
  B.TXT = {                                                         // [N] drafts
    advLeft: '{n} to give',
    reeve: 'the Reeve of Varnholt', place2: 'the east road', job2: 'Run down the slavers', notYet: 'Another day.', councilHead: 'The War Council',
    res: 'Patron Resistance', die: 'Leader Personality', won: 'beats it: one Contract Edge', march: 'MARCH', stand: 'Standing with Varnholt: {a} to {b}.',
    fire: 'CAMPFIRE', yard: 'BARRACKS', qm: 'QUARTERMASTER', table: 'WAR TABLE', soon: 'soon', done: 'done',
    fireHead: 'The Campfire', whyHire: 'Click her Condition first.', whyHire2: 'Not enough gp: {short} gp short.', backV: 'BACK TO VARNHOLT', hired: 'HIRED', cayde: 'Cayde', free: 'HIRE (free)', later: '10 gp', laterWhy: 'Not yet: the first hire is free.',
    yardHead: 'THE DRILL YARD', yardSub: 'A PRACTICE BOUT WITH HAL', yardDone: 'Hal calls the bout. Nobody is hurt.', yardSkip: 'You left the yard early. Not practised: {list}.', yardEnd: 'LAST STEP: ONE STRIKE ON EACH DUMMY. LEFT CLICK SHOOTS, RIGHT CLICK SWINGS',
    back: 'BACK TO THE CAMP', hire2: 'HIRE ({n} gp)', gold: 'Treasury: {n} gp',
    qmHead: 'The Quartermaster', equip: 'EQUIP', worn: 'worn', squadKit: 'The squad now:', noKit: 'Equip the squad before you sign.',
    tableHead: 'The War Table', sign: 'SIGN', faceDown: 'not yet',
    card: {kind: 'Kind', enemy: 'Against', pay: 'Pay', patron: 'Patron', squad: 'Marching'},
    stats: {con: 'Condition', move: 'Move', m: 'Melee', r: 'Ranged', mg: 'Magic'}
  };
  B.ok = () => T.lessonsOn();
  B.is = k => B.ok() && T.sw[k] !== false;
  const CL = () => window.CAMPAIGN_LINES || {};
  const CAST = k => (CL().cast45 || {})[k] || {};
  const e2 = x => (typeof esc === 'function' ? esc(x) : String(x == null ? '' : x));
  const ST = () => { const st = F.state(); if (!st) return null; return st.b45 || (st.b45 = {}); };
  const S = () => (typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.b45 && G.b45) || null;
  const key = spec => T.keyOf(spec);                               // S6 1c: the badge's own rule (lessons.js)
  const leaderName = () => (META.leader && META.leader.name) || '';
  const alive = list => (list || []).filter(e => e && !e.dead && !e.broken && G.enemies.includes(e));

  /* ---- S17: the camp is four buildings -------------------------------------------- */
  B.hub = function(b, body){
    const s = ST();
    if (s.yard && !s.qm && !B.is('qm')){ F.issueKit(); s.qm = true; saveMeta(); }   // the step is off: the kit arrives worn, as before
    const order = ['fire', 'yard', 'qm', 'table'], did = {fire: !!s.hired, yard: !!s.yard, qm: !!s.qm, table: false};
    const lit = order.find(k => !did[k]), tableOff = lit === 'table' && !B.is('table');
    const btn = k => { const on = lit === k && !(k === 'table' && tableOff), live = on || (k === 'fire' && s.gold && s.line && s.line[1]);
      return `<button class="btn${on ? ' gold' : ''}" id="b45-${k}" style="min-width:150px;margin:4px${live ? '' : ';opacity:.55'}" ${live ? `onclick="B45.${k}()"` : 'disabled'}>${e2(B.TXT[k])}<br><small>${did[k] ? e2(B.TXT.done + (k === 'yard' && s.yardSkip && s.yardSkip.length ? ': ' + T.fill(B.TXT.yardSkip, {list: s.yardSkip.join(', ')}) : '')) : on ? '&nbsp;' : e2(B.TXT.soon)}</small></button>`; };
    const goal = lit === 'fire' && T.is && T.is('camp') ? String((T.text('camp', {leader: leaderName()}) || {}).gate || '') : '';   // the ND's gold goal line at the hub (6808a0f9), the gold line style of the Quartermaster card
    let h = body + (goal ? `<div class="note" id="b45-goal" data-z="choice" style="color:var(--gold-ink,#634a00);font-weight:bold">${e2(goal)}</div>` : '') + `<div id="b45-hub" data-z="choice" style="margin:10px auto">${order.map(btn).join('')}</div>`;
    if (s.qm) h += `<div class="note"><span id="b45-gold" style="padding:2px 8px">${e2(T.fill(B.TXT.gold, {n: META.treasury | 0}))}</span></div>`;
    if (s.said && !s.yard) h = h.replace('<div id="b45-hub"', `<p><i>${e2(s.said)}</i></p><div id="b45-hub"`);
    let buttons = '';
    if (tableOff) buttons = `<button class="btn gold" onclick="F34.next('done')">CONTINUE</button> <button class="btn" onclick="F34.visit()">LOOK ROUND THE CAMP</button>`;   // the War Table step is off: the old way on
    F.card(e2(((CL().founding45 || {}).acts || [])[1] || b.name), h, buttons);
    if (!s.camp) T.lesson('camp', {sel: '#b45-fire', vars: {leader: leaderName()}, then(){ s.camp = true; saveMeta(); }});
    else if (s.qm && !s.gold) T.lesson('treasury', {sel: '#b45-gold', vars: {price: B.K.hire2 + ' gp'}, then(){ s.gold = true; saveMeta(); F.go(); }});   // S24: then a second hire is on offer, not forced
    if (s.qm && typeof renderTopbar === 'function') { try { renderTopbar(); } catch (e) {} }   // the Treasury joins the top bar with its lesson, or already is there (s6-15a 7); the lesson card, once up, redraws it too
  };

  /* ---- S23: the Quartermaster: the kit comes in a crate, not worn ------------------ */
  B.kit = function(){
    const st = F.state(); if (!st || st.kit) return;
    st.kit = true; let cost = 0;
    for (const id of F.KIT){ const x = gear(id); if (!x) continue; cost += x.cost | 0;
      if (window.ARM) ARM.add(id, 1); else if (!META.gear.owned.includes(id)) META.gear.owned.push(id); }
    META.treasury = Math.max(META.treasury | 0, F.PURSE) - cost;
  };
  B.wornId = id => { const x = gear(id); return !!x && META.gear[x.slot] === id; };
  B.bare = () => F.KIT.map(id => gear(id)).find(x => x && META.gear[x.slot] !== x.id) || null;
  B.qm = function(){
    const s = ST(); if (!s || !s.yard) return;
    B.kit(); saveMeta();
    const all = !B.bare(), tx = T.text('gear', {leader: leaderName()});
    const card = id => { const x = gear(id); if (!x) return '';
      return `<div class="log b45-gear" id="b45-g-${id}" style="display:inline-block;vertical-align:top;width:230px;margin:6px;text-align:left"><b>${e2(x.name)}</b><br><span class="note">${x.slot === 'armour' ? 'AC ' + x.ac : 'Shield Pool ' + x.pool}</span><br>${B.wornId(id) ? `<span class="good">${e2(B.TXT.worn)}</span>` : `<button class="btn gold" onclick="B45.equip('${id}')">${e2(B.TXT.equip)}</button>`}</div>`; };
    const now = `${e2(B.TXT.squadKit)} AC <b>${(gear(META.gear.armour) || {}).ac | 0}</b> · Shield Pool <b>${(gear(META.gear.shield) || {}).pool | 0}</b>`;
    if (all && !s.qm){ s.qm = true; saveMeta(); }
    F.card(e2(B.TXT.qmHead), `<div class="note" style="color:var(--gold-ink,#634a00);font-weight:bold;min-height:20px">${all ? '' : e2(tx.gate || '')}</div><div class="note"><span id="b45-ac" style="padding:2px 8px">${now}</span></div><div id="b45-crate">${F.KIT.map(card).join('')}</div>`,
      `<button class="btn${all ? ' gold' : ''}" onclick="F34.go()">${e2(B.TXT.back)}</button>`);
    if (!s.gear) T.lesson('gear', {sel: '#b45-crate', vars: {leader: leaderName()}, then(){ s.gear = true; saveMeta(); }});
  };
  B.equip = function(id){
    const s = ST(), x = gear(id); if (!s || !x || T.cur || B.wornId(id)) return;
    const a = (gear(META.gear[x.slot]) || {}).ac | 0;
    if (window.ARM) ARM.take(id, META.leader); else META.gear[x.slot] = id;
    try { SFX.play('pick'); } catch (e) {}
    saveMeta(); B.qm();
    if (x.slot === 'armour' && !s.ac){ s.ac = true; saveMeta(); const hal = F.friend('hal');
      T.lesson('armour', {sel: '#b45-ac', vars: {name: (hal && hal.name) || leaderName(), a, b: x.ac | 0}}); }
  };

  // S6 row 1h: every Founding card prints the reason under each greyed button (data-why), through the one helper in ux.js
  { const f = F.card; if (!f.__why){ F.card = function(){ const r = f.apply(this, arguments);
      try { const u = window.UX83; if (u && u.why) u.why(document.getElementById('create-inner')); } catch (e) {} return r; }; F.card.__why = true; } }

  /* ---- S25: the War Table: one contract, read and signed --------------------------- */
  B.job = function(){ if (!B._job){ const b = F.BEATS.find(x => x.id === 'b5'); B._job = F.contract(b); } return B._job; };
  B.table = function(){
    const s = ST(); if (!s || !s.qm) return;
    const c = B.job(), bare = B.bare(), hal = F.friend('hal');
    const kind = ((typeof OBJECTIVES !== 'undefined' && OBJECTIVES[c.obj]) || {}).name || c.obj;
    const row = (k, v) => `<div id="b45-t-${k}" style="padding:3px 8px"><span class="note">${e2(B.TXT.card[k])}</span> <b>${e2(v)}</b></div>`;
    const squad = [leaderName()].concat(F.squad().map(id => (META.roster.find(p => p.id === id) || {}).name)).filter(Boolean).join(', ');
    const why = bare ? T.fill(((CL().coach || {}).noShield) || B.TXT.noKit, {name: (hal && hal.name) || leaderName()}) : '';
    const down = `<div class="log" style="box-sizing:border-box;height:40px;margin:0;opacity:.35;text-align:center;line-height:34px">${e2(B.TXT.faceDown)}</div>`;   // UX 22 Nov: one slim 40 px row, permanent at every size
    F.card(e2(B.TXT.tableHead), `<div class="log" id="b45-job" style="display:block;box-sizing:border-box;width:calc(100% - 12px);margin:6px;text-align:left">
        <div style="display:grid;grid-template-columns:1fr 1fr">${row('kind', kind)}${row('enemy', (HOSTS[c.host] || {}).name || c.host)}${row('pay', (c.pay | 0) + ' gp')}${row('patron', c.patron)}</div>
        <p class="note" style="margin:6px 8px">${e2(c.brief || '')}</p>${row('squad', squad)}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 6px 6px">${down}${down}</div>
        `,
      `<button class="btn gold" id="b45-sign" ${bare ? 'disabled data-why="' + e2(why) + '"' : ''} onclick="B45.sign()">${e2(B.TXT.sign)}</button> <button class="btn" onclick="F34.go()">${e2(B.TXT.back)}</button>`);
    if (!s.table) T.coach('warTable', [{sel: '#b45-job', pad: 4}], {then(){ s.table = true; saveMeta(); }});
  };
  B.sign = function(){
    const s = ST(); if (!s || T.cur || B.bare() || typeof startDeployment !== 'function') return;
    const c = B.job(); B._job = null;
    F.step(META.f34, 'done'); saveMeta();                           // b4 is done; the job on the card is the job that is marched (b5)
    startDeployment(c, F.squad());
  };

  /* ---- S18, S19: the Hiring Line, the stat check, Sister Maud --------------------- */
  B.line = function(){
    const s = ST();
    if (!s.line){
      const c = CAST('maud'), a = makeMate(c.race || 'HUMAN', c.cls || 'DEVOUT', c.spec || 'CLERIC', c.name || 'Sister Maud'); a.sex = 'f'; a.f34 = 'maud';
      let o = null; for (let i = 0; i < 20 && !(o && !SPECS[o.spec].caster); i++) o = rollRecruit('FREEMAN');   // the other captive: no second caster yet
      s.line = [a, o]; saveMeta();
    }
    return s.line;
  };
  /* S6 2g (s6-15b): the Campfire shows one recruit, Maud, with Cayde's box beside her. The question lives in Cayde's box; a ring sits
     round her Condition chip; HIRE says why it is shut; the paid recruit appears only after the Treasury lesson. The old card is in git before this commit. */
  B.css = function(){ if (document.getElementById('b45-css')) return; const st = document.createElement('style'); st.id = 'b45-css';
    const v = (a, b) => `clamp(${a}px,calc(${a}px + (100vw - 1280px)*${(b - a) / 640}),${b}px)`;
    st.textContent = `.b45-fx{display:flex;gap:${v(24, 32)};justify-content:center;align-items:flex-start;width:100%;margin:${v(16, 24)} 0 0;text-align:left}`
      + `.b45-fx .b45-card{box-sizing:border-box;width:${v(493, 587)};flex:none;margin:0!important;padding:${v(16, 24)};position:relative;display:flex;flex-direction:column;gap:${v(16, 24)}}`
      + `.b45-top{display:flex;gap:${v(16, 24)};align-items:flex-start}.b45-top img{flex:none;width:${v(96, 128)};height:${v(96, 128)};object-fit:cover;object-position:top;border:2px solid #8a6a2a;box-sizing:border-box}`
      + `.b45-top b{display:block;font-size:${v(20, 24)}}.b45-top span{font-size:${v(15, 17)}}`
      + `.b45-chips{display:flex;gap:12px}.b45-chips .b45-stat{flex:1 1 0;min-width:0;margin:0!important;padding:6px 2px!important;text-align:center;position:relative;box-sizing:border-box;display:block!important;font-size:${v(13, 14)}}`
      + `.b45-chips .b45-stat b{display:block;font-size:${v(20, 24)}}`
      + `.b45-ring::after{content:'';position:absolute;inset:-4px;border:2px solid #d9b45a;border-radius:6px;pointer-events:none;animation:b45p 1.2s ease-in-out infinite alternate}@keyframes b45p{from{opacity:.6}to{opacity:1}}`
      + `.b45-ab b{font-size:${v(17, 20)};display:block}.b45-ab{font-size:${v(15, 17)}}`
      + `.b45-fx .b45-card .btn.gold{width:100%;height:${v(48, 56)};white-space:nowrap;margin:0!important;padding:0 8px;font-size:${v(18, 20)}}`
      + `.b45-ba{display:flex;flex-direction:column;gap:8px}.b45-why{height:22px;overflow:hidden;font:${v(15, 17)}/1.3 var(--f-body,Georgia,serif);color:#5a4a34}.b45-card .ux-why{display:none!important}`
      + `.b45-ab span{display:block;margin-top:4px}`
      /* 2g-03, 2g-06, 2g-07: one group width; title on the card edge; the sheet capped to the screen, the body scrolls and the button row stays in view (the 1i-09 pattern) */
      + `#create-inner:has(.b45-fx){--b45w:calc(${v(493, 587)}*2 + ${v(24, 32)});display:flex;flex-direction:column;align-items:center;min-height:0;overflow:hidden}`
      + `.sheet:has(#create-inner .b45-fx){max-width:none;width:fit-content;max-height:calc(100vh - 106px);padding-top:calc(${v(80, 96)} - 69px);display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box}`
      + `#create-inner:has(.b45-fx) > h1{width:var(--b45w);max-width:100%;box-sizing:border-box;text-align:left;font-size:${v(32, 40)}!important;line-height:${v(40, 56)}px;margin:0 0 ${v(32, 48)}!important;flex:none}`
      + `#create-inner:has(.b45-fx) > .b45-sc{flex:1 1 auto;min-height:0}.b45-bs{height:${v(48, 56)}}#create-inner:has(.b45-fx) .f34-pri:empty{display:none}`   /* 2g-03: the body shrinks and scrolls (the 1i-09 rule had set flex:none); 2g-12: the quiet buttons keep their size and edge after the hire */
      + `.b45-sc{width:var(--b45w);max-width:100%;flex:1 1 auto;min-height:0;overflow-y:auto}`
      + `.b45-sc{overflow-x:hidden}.b45-sc .b45-fx{justify-content:flex-start;margin-top:0}.b45-sc .b45-fx .b45-card,.b45-sc .b45-fx .b45-cay{flex:1 1 0;min-width:0}`
      + `#create-inner:has(.b45-fx) .f34-row{width:var(--b45w);max-width:100%;flex:none;margin-top:${v(16, 24)}}#create-inner:has(.b45-fx) .f34-pri{order:-1;margin-left:0}`
      + `.b45-tag{position:absolute;top:8px;right:8px;padding:2px 10px;border:2px solid #4a7a3a;color:#2e5a24;font-weight:bold;font-size:14px;letter-spacing:.06em}`
      + `.b45-cay{box-sizing:border-box;width:${v(493, 587)};flex:none;display:flex;gap:${v(16, 24)};padding:${v(16, 24)};align-items:flex-start;margin:0!important}`
      + `.b45-cay .cf{flex:none;width:${v(96, 128)};text-align:center}.b45-cay img{display:block;width:100%;aspect-ratio:1;object-fit:cover;object-position:top;border:2px solid #3a2a1a;box-sizing:border-box}`
      + `.b45-cay .cf span{display:block;margin-top:8px;font-variant:small-caps;font-size:14px}.b45-cay p{margin:0;flex:1;font-size:${v(15, 17)};line-height:1.4;color:#2a1f12}`
    document.head.appendChild(st); };
  { const n0 = F.NARROW; F.NARROW = function(body){ return /class="b45-fx/.test(body || '') ? false : n0.apply(this, arguments); }; }
  B.statRow = function(p, i, ring){
    const st = mateStats(p), rows = [['con', st.con], ['move', st.move], ['m', st.melee], ['r', st.ranged]];
    if (SPECS[p.spec].caster) rows.push(['mg', st.magic]);
    return rows.map(([k, val]) => `<span class="b45-stat${ring && k === 'con' ? ' b45-ring' : ''}" data-stat="${k}" onclick="B45.stat('${k}', ${i})" style="border:1px solid #8a6a2a;border-radius:3px;cursor:pointer">${e2(B.TXT.stats[k])}<b>${val}</b></span>`).join('');
  };
  B.cayLine = function(){
    const s = ST(), ask = (CL().coach || {}).statCheck || {};
    if (s.check){ const p = B.line()[0] || B.maud(); const tx = p && T.text('hireCard', {n: mateStats(p).con}), r = tx && tx[1]; return r && r.lines ? r.lines.join(' ') : ''; }
    return s.miss ? (ask.wrong || '') : (ask.ask || '');
  };
  B.fire = function(){
    B.css();
    const s = ST(), line = B.line(), ask = (CL().coach || {}).statCheck || {};
    const asking = !!(B.is('statCheck') && !s.check && ask.ask);
    const maud = line[0] || B.maud(), cleric = !!(B.noBack || (T.cur && T.cur.id === 'cleric'));
    const card = (p, i) => { let pic = ''; try { pic = portraitURL(p, false); } catch (e) {}
      const first = i === 0, hired = first && s.hired;
      let why = '', btn = '';   // the reason line sits 8 px above the button and keeps its height when empty (UX 2g-04)
      if (hired) btn = cleric ? '<div class="b45-bs"></div>' : `<button class="btn gold" id="b45-back" onclick="F34.go()">${e2(B.TXT.backV)}</button>`;   // the way back takes HIRE's place (2g-02); not while the lesson's own button shows (2g-01)
      else if (first){ if (asking) why = B.TXT.whyHire; btn = `<button class="btn gold" id="b45-hire" ${asking ? 'disabled data-why="' + e2(why) + '"' : ''} onclick="B45.hire()">${e2(B.TXT.free)}</button>`; }
      else { const short = B.K.hire2 - (META.treasury | 0); if (short > 0) why = T.fill(B.TXT.whyHire2, {short});
        btn = `<button class="btn gold" id="b45-hire2" ${short > 0 ? 'disabled data-why="' + e2(why) + '"' : ''} onclick="B45.hire2()">${e2(T.fill(B.TXT.hire2, {n: B.K.hire2}))}</button>`; }
      const hire = `<div class="b45-ba"><div class="b45-why">${e2(why)}</div>${btn}</div>`;
      return `<div class="log b45-card" id="b45-card${i}">${hired ? `<span class="b45-tag">${e2(B.TXT.hired)}</span>` : ''}
        <div class="b45-top"><img src="${pic}" alt=""><div><b>${e2(p.name)}</b><span style="color:${SPECS[p.spec].color}">${e2(RACES[p.race].name)} ${e2(CLASSES[p.cls].name)} ${e2(SPECS[p.spec].name)}</span></div></div>
        <div class="b45-chips">${B.statRow(p, i, first && asking)}</div>
        <div class="b45-ab"><b>${e2(ABILITIES[p.spec].name)}</b><span>${e2(ABILITIES[p.spec].text || '')}</span></div>${hire}</div>`; };
    const cards = [];
    if (maud && (s.hired || line[0])) cards.push(card(maud, 0));
    if (s.gold && line[1]) cards.push(card(line[1], 1));
    let cf = ''; try { cf = heroPortraitURL('cayde'); } catch (e) {}
    const showBox = asking || s.hired || (s.check && B.is('statCheck'));   // the box stays after the hire, with his answered line, so the card keeps its place (2g-02)
    const sayB = s.hired && s.said && !cleric ? `<p id="b45-say" style="margin-top:8px">${e2(s.said)}</p>` : '', line1 = s.hired ? B.cayLine().replace(/\s*Now you can hire her\.?/, '') : B.cayLine();
    const box = showBox ? `<div class="log b45-cay" id="b45-cayb"><div class="cf">${cf ? `<img src="${cf}" alt="">` : ''}<span>${e2(B.TXT.cayde)}</span></div><div style="flex:1;min-width:0"><p id="b45-ask">${e2(line1)}</p>${sayB}</div></div>` : '';
    F.card(e2(B.TXT.fireHead), `<div class="b45-sc"><div class="b45-fx" id="b45-line">${cards.join('')}${box}</div></div>`,
      s.hired ? '' : `<button class="btn" onclick="F34.go()">${e2(B.TXT.backV)}</button>`);   // before the hire: the quiet way back, bottom left on the card's edge (2g-07)
    if (!s.fire) T.lesson('hiring', {sel: '#b45-line', then(){ s.fire = true; saveMeta(); }});
  };
  // the check for S12: one click on the stat that is health; a wrong click changes Cayde's line and keeps the ring on Condition, no penalty
  B.stat = function(k, i){
    const s = ST(), ask = (CL().coach || {}).statCheck || {};
    if (!s || s.check || !B.is('statCheck') || T.cur) return;
    const right = ask.right || 'con', el = document.querySelector('#b45-card0 .b45-stat[data-stat="' + right + '"]');
    if (k !== right || i !== 0){
      s.miss = (s.miss | 0) + 1; const a = document.getElementById('b45-ask'); if (a) a.textContent = B.cayLine();
      return; }
    s.check = true; saveMeta();
    const tx = T.text('hireCard', {n: mateStats(B.line()[0]).con})[1];
    const done = () => B.fire();
    if (tx && (tx.title || tx.lines.length)){ T.DRAFT.b45con = {title: tx.title, text: tx.lines}; T.lesson('b45con', {el, then: done}); }
    else done();
  };
  B.hire = function(){
    const s = ST(); if (!s || s.hired) return;
    const p = B.line()[0]; p.id = META.nextId++; META.roster.push(p); s.line[0] = null; s.hired = true;
    const c = CAST('maud'); s.said = c.intro && c.intro.length ? (c.name || p.name) + ': “' + c.intro.join(' ') + '”' : '';
    try { SFX.play('coin'); } catch (e) {}
    saveMeta();
    B.noBack = true; B.fire();
    T.lesson('cleric', {sel: '#b45-card0', vars: {name: p.name}, face: p, then(){ B.noBack = false; if (document.getElementById('b45-line')) B.fire(); }});
  };
  B.hire2 = function(){
    const s = ST(), p = s && s.line && s.line[1]; if (!p || !s.gold || T.cur || (META.treasury | 0) < B.K.hire2) return;
    META.treasury -= B.K.hire2; p.id = META.nextId++; META.roster.push(p); s.line[1] = null; s.hired2 = true;
    try { SFX.play('coin'); } catch (e) {}
    saveMeta(); F.go();
  };
  B.drawGoal = function(){                                           // U-slice §11: the goal is in the objective panel (contractLine); the Shield Wall bar is drawn in the panel's spare line
    const y = S(); if (!y || y.done || G.over || typeof ctx === 'undefined' || y.step !== 'wall') return;
    const D1 = window.DECK, a = D1 && D1.objAt; if (!a || !a.lines) return;
    const k = (window.UX83 && UX83.k) || 1, w = Math.round((a.w - 20) * k), h = Math.round(8 * k), x = Math.round((a.x + 10) * k), by = Math.round((a.y + a.h - 19) * k), f = Math.min(1, (y.wallT | 0) / B.K.wall);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x, by, w, h); ctx.fillStyle = '#d9b45a'; ctx.fillRect(x, by, Math.round(w * f), h);
    ctx.lineWidth = 1; ctx.strokeStyle = '#6a5a3a'; ctx.strokeRect(x + .5, by + .5, w - 1, h - 1); ctx.restore();
  };
  B.flash = function(hud){                                           // GD rule 5: the 20 s hint flashes the button it names, once
    try { const r = T.rectOf({hud}); if (!r) return; let d = document.getElementById('b45-flash');
      if (!d){ d = document.createElement('div'); d.id = 'b45-flash'; d.style.cssText = 'position:fixed;pointer-events:none;z-index:9998;border:3px solid #ffd860;border-radius:6px;box-shadow:0 0 14px 4px rgba(255,216,96,.8);transition:opacity .25s'; document.body.appendChild(d); }
      Object.assign(d.style, {display: 'block', opacity: '1', left: (r.x - 4) + 'px', top: (r.y - 4) + 'px', width: (r.w + 8) + 'px', height: (r.h + 8) + 'px'});
      let n = 0; const iv = setInterval(() => { n++; d.style.opacity = n % 2 ? '0.15' : '1'; if (n >= 7){ clearInterval(iv); d.style.display = 'none'; } }, 350); } catch (e) {} };
  B.FLASH = {cure: {kind: 'ability', spec: 'CLERIC'}, wall: {kind: 'formation'}};
  B.maud = () => META.roster.find(p => p.f34 === 'maud') || null;

  /* ---- S20 to S22: the drill yard ------------------------------------------------- */
  B.yard = function(){
    const s = ST(); if (!s || !s.hired || typeof startDeployment !== 'function') return;
    const host = HOSTS.bandits ? 'bandits' : DRILL.host;
    startDeployment({obj: 'drill', tier: 1, host, place: 'the drill yard', edges: [], council: null, picks: 0, minutes: 0, pay: 0, patron: 'nobody', faction: null, seed: 7, b45: 'yard'}, F.squad());
    if (typeof G === 'undefined' || !G) return;
    T.reset();
    const y = G.b45 = {step: null, use: {}, foes: [], sleep: false, noHeal: true, wallT: 0, done: false, f0: G.frame, did: {}, hinted: {}, stepF: G.frame};
    G.msgs = [];
    T.quiet(['matedown', 'hurtMate', 'firstEnemy', 'outOfReach', 'firstActive', 'mateActive', 'commandRadius', 'levelup']);
    try {                                                           // the legend the road taught
      T.legend(T.text('move').legend);
      for (const [id, sp] of [['soldier', 'SOLDIER'], ['scoundrel', 'SCOUNDREL']]){
        const raw = T.text(id).legendRaw; if (raw && sp && G.abil[sp]) T.legend(raw, sp); }
      T.legendYou(META.leader && META.leader.spec);
    } catch (e) {}
    const L = G.leader, k = (HOSTS[host] || HOSTS[DRILL.host]).pools[1][0], g2 = GROUP++;
    for (let i = 0; i < B.K.dummies; i++){ const e = spawnEnemy(k, L.x + B.K.dummyAt, L.y + (i - (B.K.dummies - 1) / 2) * 44, {noNem: true, group: g2}); if (e){ e.seen = true; e.dormant = true; y.foes.push(e); } }
    G.enemies = G.enemies.filter(e => y.foes.includes(e));          // G1: the bout is the three dummies; the drill's own opening group is not part of it
    y.sleep = true;                                                 // G1: the dummies wait for Hal's word from the first frame, and the squad holds fire
    B.enter('fall');
  };
  /* G1 (GD 22 Nov): one goal line, always on; abilities a step does not use are dimmed with a reason; Hal speaks the key after 20 s; the bout counts as done at 3 min or on leaving */
  B.ORDER = ['fall', 'bleeding', 'cure', 'wall', 'finish'];
  Object.assign(B.TXT, {
    big: {fall: 'Walk up to the dummies', bleeding: 'Stand by Pinch', cure: '[{key}] Cure Wounds', wall: '[{kWall}] Shield Wall', finish: 'Strike the dummies'},
    stepOf: {fall: 1, bleeding: 1, cure: 1, wall: 2, finish: 3}, later: 'Later',
    goal: {fall: 'They do not move. Walk right up to them.', bleeding: 'Pinch is bleeding out. Stand next to him until the bleeding stops.', cure: 'It closes Pinch\'s wound and stands him up.', wall: 'One press locks shields. Keep them up 3 seconds, and the wall drops by itself.', finish: 'Last step: one strike on each dummy ends the drill. Left click shoots, right click swings.'},   /* ND words, 22 Nov (3d1e0bf7); finish: ND p23-bug4-words.md */
    hint: {fall: 'Hal: “Walk up to them, {leader}. They will not bite.”', bleeding: 'Hal: “Walk over to Pinch.”', cure: 'Hal: “Cure Wounds, {leader}. Press {key}.”', wall: 'Hal: “Shield Wall. Press {kWall}.”', finish: 'Hal: “Hit them. Left click shoots, right click swings.”'},
    wallDown: 'Shield Wall down: strike!', waiting: 'WAITING FOR YOU', dimNot: 'Not yet: {step} first.', dimYet: 'Not yet: {step} first.',
    dimStep: {fall: 'walk up to the dummies', bleeding: 'stabilise Pinch', cure: 'Cure Wounds', wall: 'Shield Wall'},
    cleared: 'YARD CLEARED', clearedBark: 'Hal: “That is the drill. Back to camp.”',   // P23-BUG-4: ND checked, audits/narrative/p23-bug4-words.md
    cap: 'Hal: “Enough for today. The road will teach you the rest.”', yardCap: 'Enough for today. The road will teach you the rest.',
    skipName: {fall: 'the walk to the dummies', bleeding: 'Bleeding Out', cure: 'Cure Wounds', wall: 'the Shield Wall', finish: 'the finish'}});
  B.skipped = y => B.ORDER.filter(k => !(y && y.did && y.did[k])).map(k => B.TXT.skipName[k]);
  B.goalBig = function(){ const y = S(); if (!y || y.done || !y.step) return ''; return T.fill(B.TXT.big[y.step] || '', {key: key('CLERIC')}); };
  B.title = function(){ const y = S(); return y && y.step ? 'THE DRILL YARD \u00b7 STEP ' + (B.TXT.stepOf[y.step] || 1) + ' OF 3' : B.TXT.yardHead; };
  B.say = function(u){                                               // a pressed dimmed key says why, at most once per 2 s
    const y = S(), why = y && B.dim(u); if (!why || G.frame - (y.sayF || -1e6) < 120) return; y.sayF = G.frame;
    try { pop(G.leader.x, G.leader.y - 34, why, '#ffd860'); } catch (e) {} };
  B.bark = function(t){                                              // UX G8: Hal's hint is a bark over Hal (a floating line), not a log note; the log line stays as the record
    try { const h = G.squad.find(m => m.p && m.p.f34 === 'hal' && m.state === 'up') || G.leader, w = String(t).replace(/^Hal: *[“"]?/, '').replace(/[”"]$/, '');
      pop(h.x, h.y - 40, w, '#e8dcc0'); } catch (e) {}
    try { note(t); } catch (e) {} };
  B.holdFire = function(wx, wy){                                    // GD 22 Nov: while a dummy waits the Leader holds fire; a click on it shows the reason, at most once per 2 s
    const y = S(); if (!y || y.done || !y.sleep || !window.F33 || !F33.foeAt) return false;
    const m = F33.foeAt(wx, wy); if (!m || !m.b45wait) return false;
    if (G.frame - (y.sayF || -1e6) >= 120){ y.sayF = G.frame; try { pop(G.leader.x, G.leader.y - 34, T.fill(B.TXT.dimNot, {step: B.TXT.dimStep[y.step] || ''}), '#ffd860'); } catch (e) {} }
    return true; };
  B.goalText = function(){ const y = S(); if (!y || y.done || !y.step) return ''; return T.fill(B.TXT.goal[y.step] || '', {key: key('CLERIC')}); };
  B.dim = function(u){                                              // the reason an ability is dimmed this step, or ''
    const y = S(); if (!y || y.done || !u || T.cur) return '';
    const spec = u.spec || (u.p && u.p.spec);
    const why = (y.step === 'cure' && spec === 'CLERIC') ? '' : (B.TXT.dimStep[y.step] ? T.fill(B.TXT.dimNot, {step: B.TXT.dimStep[y.step]}) : '');
    return why;
  };
  B.enter = function(step){ const y = S(); if (!y) return; const i = B.ORDER.indexOf(step); B.ORDER.forEach((k, j) => { if (j < i) y.did[k] = true; }); y.step = step; y.stepF = G.frame; T.log.push('B45 ' + step); try { B.STEPS[step](y); } catch (e) { console.warn('B45 step', step, e); } };
  B.fallen = y => y.down || null;
  B.STEPS = {
    // the first exchange: Pinch goes down (scripted), and the dummies stand off while the lesson runs
    fall(y){
      const who = () => G.squad.find(m => m.p && m.p.f34 === 'pinch' && m.state === 'up') || G.squad.find(m => m.state === 'up' && m.spec !== 'CLERIC') || G.squad.find(m => m.state === 'up');
      T.gate('b45fall', () => {
        const units = [G.leader].concat(G.squad.filter(m => m.state === 'up'));
        return G.frame - y.f0 > B.K.fallAfter || alive(y.foes).some(e => units.some(u => dist(e, u) < B.K.fallIn)); },
        {then(){ const m = who(); if (!m) return B.enter('wall');
          y.down = m; y.sleep = true;
          for (const e of alive(y.foes)){ e.dormant = true; e.vx = e.vy = 0; }
          dropMate(m, Math.max(1, m.con)); G.msgs = [];
          B.enter('bleeding'); }});
    },
    bleeding(y){
      const m = y.down;
      T.lesson('bleeding', {world: m, r: 40, then(){ T.gate('bleeding', () => m.state !== 'bleeding', {vars: {leader: leaderName()}, then(){ B.enter('cure'); }}); }});
    },
    cure(y){
      const m = y.down, mp = B.maud(), vars = {name: (mp && mp.name) || CAST('maud').name || 'The Cleric', key: key('CLERIC'), leader: leaderName()};
      if (!G.abil.CLERIC){ y.noHeal = false; if (m.state !== 'up') standUp(m, 'BACK IN'); return B.enter('wall'); }   // no Cleric marched: nothing to teach
      T.lesson('cureWounds', {hud: {kind: 'ability', spec: 'CLERIC'}, vars, then(){
        const u0 = y.use.CLERIC | 0; G.abil.CLERIC.cd = 0;
        T.gate('cureWounds', () => (y.use.CLERIC | 0) > u0 && m.state === 'up', {vars, spec: 'CLERIC', then(){ y.noHeal = false; B.enter('wall'); }}); }});
    },
    wall(y){
      y.noHeal = false; y.prevForm = G.formation;
      T.lesson('shieldWall', {hud: {kind: 'formation'}, then(){
        y.sleep = false; for (const e of alive(y.foes)){ e.dormant = false; e.seen = true; }
        T.gate('shieldWall', () => y.wallDone || y.wallT >= B.K.wall, {then(){ B.enter('finish'); }}); }});
    },
    finish(y){
      T.DRAFT.b45end = {gate: B.TXT.yardEnd};                       // a braced squad does not attack: say so, or the bout never ends
      T.gate('b45end', () => !alive(y.foes).length, {then(){ y.did.finish = true; y.done = true; B.endBeat(y); }});
    }
  };
  /* P23-BUG-4 (GD b9398cf1): the last dummy falls, the field holds B.K.endHold frames, then the report opens. During the hold: the
     YARD CLEARED pop over the Leader, the win sting and Hal's closing line, and no input reaches the field (B.holding). */
  B.holding = () => { const y = S(); return !!(y && y.endF != null); };
  B.endBeat = function(y){
    if (G.over || y.endF != null) return;                           // Neon: the 3 min count may have opened the report on this frame
    y.endF = G.frame; B.still(); B.sting();
    const n0 = G.fx.length;
    try { pop(G.leader.x, G.leader.y - 30, B.TXT.cleared, '#ffd860'); } catch (e) {}
    B.bark(B.TXT.clearedBark);
    y.endFx = G.fx.slice(n0).filter(f => f && f.text);              // the two words stay up for the whole hold (B.pin)
    for (const f of y.endFx) f.y0 = f.y;
  };
  B.sting = function(){                                             // the victory stinger plays only when G.over (synth.js 'stinger'), and the drill report plays none (feel.js): raise G.over for this one call
    const o = G.over; G.over = true;
    try { SFX.play('win'); } catch (e) {} finally { G.over = o; }
  };
  B.pin = function(y){                                              // render fades a word under 25 life; a 4th word near it (coin pops) fades and shifts the oldest (pop, pop1i): put them back
    for (const f of (y.endFx || [])){ f.life = 26; if (f.y0 != null) f.y = f.y0; if (G.fx.indexOf(f) < 0) G.fx.push(f); }
  };
  B.still = function(){                                             // drop held keys, a held mouse button, a charge and queued casts, so nothing carries into the report
    try { for (const k in keys) keys[k] = false; } catch (e) {}
    try { if (window.F33){ if (F33.charge && F33.stopCharge) F33.stopCharge(); if (F33.mouse) F33.mouse.held = 0; F33.rush = null; F33.q = null; } } catch (e) {}
    try { if (G.abilQ && G.abilQ.length) G.abilQ.length = 0; } catch (e) {}
  };
  B.endNow = function(y){                                           // the drill report (feel.js) plays no sting, so the hold's sting is the only one
    try { endDeployment('victory'); } finally { if (G.over) y.endF = null; }
  };
  B.heal = function(y){                                             // "Nobody is hurt": practice blades. The bout cannot be lost; only the scripted fall (y.down) lies there until the lesson is done.
    const L = G.leader;
    if (L.down && typeof standLeader === 'function') standLeader('ON YOUR FEET');
    L.wounds = L.maxWounds; G.woundsGone = false; if (L.con < L.maxCon) L.con = L.maxCon;
    for (const m of G.squad){
      if (m === y.down && m.state !== 'up') continue;
      if (m.state !== 'up' && typeof standUp === 'function') standUp(m, 'ON YOUR FEET');
      if (m.state === 'up' && m.con < m.maxCon) m.con = m.maxCon; }
  };
  B.tick = function(){
    const y = S(); if (!y) return;
    G.drillT = -1e6;                                                // no waves: the bout is the three dummies
    if (y.endF != null){ B.still(); B.pin(y); B.heal(y); if (G.frame - y.endF >= B.K.endHold) B.endNow(y); return; }
    if (y.noHeal){                                                  // nobody stands the fallen up before the lesson does
      for (const m of G.squad){ if (m.spec === 'CLERIC') m.healCd = Math.max(m.healCd | 0, 600); if (m === y.down) m.yieldT = 0; }
      if (G.leader.healCd !== undefined) G.leader.healCd = Math.max(G.leader.healCd | 0, 600);
    }
    if (y.step === 'wall' && !T.cur && !y.wallDone){
      y.wallT = G.formation === 'SHIELD' ? y.wallT + 1 : y.wallT;   // the bar holds its level when the wall drops
      if (y.wallT >= B.K.wall){ y.wallDone = true; G.formation = y.prevForm === 'SHIELD' || !y.prevForm ? 'OPEN' : y.prevForm; try { pop(G.leader.x, G.leader.y - 30, B.TXT.wallDown, '#ffd860'); SFX.play('brace'); } catch (e) {} } }   // G1: the game drops the wall itself
    for (const e of (y.foes || [])) e.b45wait = !!y.sleep && !e.dead;
    if (!y.done && !T.cur && !G.paused){
      if (G.frame - y.stepF >= B.K.hint && !y.hinted[y.step] && B.TXT.hint[y.step]){ y.hinted[y.step] = true; try { B.bark(T.fill(B.TXT.hint[y.step], {key: key('CLERIC'), leader: leaderName()})); if (B.FLASH[y.step]) B.flash(B.FLASH[y.step]); } catch (e) {} }
      if (G.frame - y.f0 >= B.K.cap){ y.done = true; y.capped = true; try { note(B.TXT.cap); } catch (e) {} endDeployment('victory'); } }
    B.heal(y);
  };

  /* ---- S26, S27: the first job (beat b5): the Escort, then the ground --------------- */
  const J = () => (typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.f34 === 'b5' && G.wagon && B.is('job')) ? (G.b45j || B.jobStart()) : null;
  B.jobStart = function(){
    const j = G.b45j = {x0: G.wagon.x, y0: G.wagon.y, step: 'escort', seen: {}};
    T.coverGaveUp = false;
    T.quiet(['escort', 'charge', 'chest', 'matedown', 'hurtMate', 'firstEnemy', 'outOfReach', 'firstActive', 'mateActive', 'commandRadius']);
    B.legendSoFar();                                                // the road's keys, Cure Wounds, the Shield Wall
    const vars = {leader: leaderName()};
    T.lesson('escort', {world: G.wagon, r: 60, vars, then(){
      T.gate('escort', () => dist(G.wagon, {x: j.x0, y: j.y0}) >= B.K.cart, {vars, then(){
        j.step = 'ground';
        B.coverTree();                                                // s6-1i N1: Cover must always show; a tree near the route is guaranteed
        if (B.is('chestPut')){                                       // a chest beside the road ahead: the map's own lie far off it
          const r = (typeof MAP !== 'undefined' && MAP.route) || [], q = r[Math.min(r.length - 1, (G.wagon.idx | 0) + B.K.chestAhead)];
          if (q) G.caches.push({x: q.x + 40, y: q.y + 70, kind: B.K.chestKind, opened: false, b45: true}); }
      }}); }});
    return j;
  };
  // s6-1i N1 (GD 311a84c6): if no tree lies within 160 px of the route ahead of the cart, plant one beside the road (the chest's method:
  // a route point a few ahead, offset to the side). A planted tree is a FOREST cell (cover) plus a MAP.trees entry (drawn 2D and 3D).
  B.coverTree = function(){
    try {
      const r = (typeof MAP !== 'undefined' && MAP.route) || [], i0 = (G.wagon.idx | 0); if (!r.length || !MAP.trees || !MAP.g) return false;
      const ahead = r.slice(i0, i0 + 14); if (!ahead.length) return false;
      if (MAP.trees.some(t => ahead.some(p => dist(t, p) < B.K.see * 0.5))) return false;
      const ch = (G.caches || []).filter(c => c.b45), C = MAP.cell || (typeof CELL !== 'undefined' ? CELL : 40);
      const okCell = (x, y) => { const cx = Math.floor(x / C), cy = Math.floor(y / C); return cx > 1 && cy > 1 && cx < MAP.w - 2 && cy < MAP.h - 2 && MAP.g[cy * MAP.w + cx] === 0; };   /* terrain GRASS (act2's T is the lessons object) */
      for (let k = 3; k < ahead.length; k++) for (const o of [[-70, -60], [70, -60], [-70, 60], [70, 60], [-100, 0], [100, 0], [0, -90], [0, 90]]) {
        const p = ahead[k], x = (Math.floor((p.x + o[0]) / C) + 0.5) * C, y = (Math.floor((p.y + o[1]) / C) + 0.5) * C;
        if (!okCell(x, y) || r.some(q => dist(q, {x, y}) < 56) || ch.some(c => dist(c, {x, y}) < 70)) continue;
        if (dist({x, y}, ahead[0]) > 400) continue;
        MAP.g[Math.floor(y / C) * MAP.w + Math.floor(x / C)] = 1; MAP.trees.push({x, y, v: 0, b45: true});
        if (window.VO2) VO2.built = null; if (window.GROUND && GROUND.invalidate) GROUND.invalidate(); if (window.STRUCT && STRUCT.invalidate) STRUCT.invalidate();   /* the full rebuild V.set does: STRUCT alone leaves the 3D list empty (LE 1aaca4db) */
        T.log.push('B45 coverTree'); return true; }
    } catch (e) {}
    return false;
  };
  // S27: four short lessons, each the first time the thing is near, after the cart has moved
  B.jobTick = function(){
    const j = J(); if (!j || j.step !== 'ground' || T.cur || (T.g && T.g.id !== 'chest')) return;
    const L = G.leader, see = B.K.see;
    const once = (k, test, go) => { if (j.seen[k]) return false; const x = test(); if (!x) return false; j.seen[k] = true; T.log.push('B45 ' + k); go(x); return true; };
    once('cover', () => ((typeof MAP !== 'undefined' && MAP.trees) || []).find(t => dist(t, L) < see * 0.5), t => T.lesson('cover', {world: t, r: 44}))
    || once('charge', () => G.chargeT > 0 && G.enemies.some(e => !e.dead && !e.dormant && dist(e, L) < see), () => T.lesson('charge', {hud: {kind: 'leader'}}))
    || once('chest', () => !T.g && (G.caches || []).find(c => !c.opened && !c.small && dist(c, L) < see), c => T.lesson('chest', {world: c, r: 34, then(){ T.gate('chest', () => c.opened, {}); }}))
    || once('blip', () => (G.blips || []).find(b => !b.known && !b.revealed && dist(b, L) < see && (typeof visNow !== 'function' || visNow(b))), b => T.lesson('blip', {world: b, r: 40}));
  };

  /* ---- S29: the first job's debrief: Rest, then the first Advancements --------------- */
  // The game's own report already holds the "Advancements to give" box. Here: two lessons, and RETURN TO CAMP waits for both.
  B.deb5 = function(c){
    if (c && c.f34 === 'b5' && !T.seen('cover') && !T.coverGaveUp){ T.coverGaveUp = true; T.log.push('B45 coverMissed'); }   // s6-1i N1 backstop: the hold ends with the first job; QA logs this as a bug
    if (!c || c.f34 !== 'b5' || !F.active() || !B.is('adv') || typeof advLeft !== 'function') return;
    const d = G.b45d = G.b45d || {}, el = document.getElementById('debrief-inner'); if (!el) return;
    const R = META.advRound || {given: []}, can = META.roster.some(p => !(R.given || []).includes(p.id) && (p.adv | 0) < advCap());
    const left = can ? advLeft() : 0;
    if (!d.seen){
      d.seen = true; d.need = left > 0;
      if (!d.need) return;
      T.quiet(['levelUp', 'levelup', 'hurtMate']);
      const hurt = META.roster.find(p => p.resting > 0 && !p.trainingAt);
      if (hurt && B.is('rest')) T.lesson('rest', {sel: '#debrief-inner .log', vars: {name: hurt.name}});
      T.lesson('advancement', {sel: '#debrief-inner .advbox', vars: {leader: leaderName()}});
    }
    if (!d.need) return;
    if (B.is('bonds')) for (const x of el.querySelectorAll('.log p')) if (/have become Comrades/.test(x.textContent)) x.style.display = 'none';   // taught at S33
    const go = el.querySelector('button[onclick="leaveDebrief()"]'), tx = T.text('advancement');
    if (left > 0){
      if (go){ go.disabled = true; go.style.opacity = '.45';
        go.insertAdjacentHTML('beforebegin', `<div id="b45-advgoal" class="sub" style="color:#8a6a1c;font-weight:bold;letter-spacing:1px">${e2(tx.gate || '')}${left < 2 ? ' · ' + e2(T.fill(B.TXT.advLeft, {n: left})) : ''}</div>`); }
    } else {
      d.given = true;
      const after = [].concat(tx.after || []).join(' ');
      if (go && after) go.insertAdjacentHTML('beforebegin', `<div id="b45-advafter" class="sub" style="color:#226b2a"><b>${e2(after)}</b></div>`);
    }
  };

  /* ---- S30 to S33: the second Varnholt job (between beats b5 and b6) ------------------ */
  // F34 has no beat for it: the b5 debrief leads here (s.j1), and this job's debrief moves the story on to b6 (s.j2).
  B.job2 = function(){
    if (B._job2) return B._job2;
    const c = makeContract(B.K.job2, 1);
    c.f34 = 'b5b'; c.b45 = 'job2'; c.teach = {}; c.faction = null; c.pay = F.rushPay({id: 'b5b'}, B.K.pay2); if (c.pay !== B.K.pay2) c.rushed = true; c.edges = []; c.council = null; c.picks = 0;
    if (HOSTS[B.K.host2]) c.host = B.K.host2;
    c.patron = B.TXT.reeve; c.place = B.TXT.place2; c.title = B.TXT.job2;
    try { if (CONTRACTS[c.obj] && CONTRACTS[c.obj].desc) c.brief = CONTRACTS[c.obj].desc(c); } catch (e) {}
    const others = ['escort', 'rescue', 'relic', 'hold'].filter(o => o !== c.obj && CONTRACTS[o]).slice(0, 2).map(o => makeContract(o, 1));
    return B._job2 = {c, others};
  };
  const jobCard = (c, id, foot) => { const kind = ((typeof OBJECTIVES !== 'undefined' && OBJECTIVES[c.obj]) || {}).name || c.obj;
    const row = (k, v) => `<div style="padding:2px 8px"><span class="note">${e2(B.TXT.card[k])}</span> <b>${e2(v)}</b></div>`;
    return `<div class="log" id="${id}" style="display:inline-block;vertical-align:top;width:250px;margin:6px;text-align:left">${row('kind', kind)}${row('enemy', (HOSTS[c.host] || {}).name || c.host)}${row('pay', (c.pay | 0) + ' gp')}${row('patron', c.patron)}
      <p class="note" style="margin:6px 8px;font-size:14px">${e2(c.brief || '')}</p><div style="text-align:center;padding:4px">${foot}</div></div>`; };
  B.table2 = function(){
    const j = B.job2();
    F.card(e2(B.TXT.tableHead), (j.c.rushed ? `<div class="note bad" style="text-align:center">${e2(((window.CAMPAIGN_LINES || {}).gate || {}).rushed || F.TXT_RUSH)} (${j.c.pay} gp)</div>` : '') + jobCard(j.c, 'b45-j2', `<button class="btn gold" id="b45-sign2" onclick="B45.council()">${e2(B.TXT.sign)}</button>`)
      + j.others.map((c, i) => jobCard(c, 'b45-o' + i, `<button class="btn" disabled>${e2(B.TXT.sign)}</button><div class="note">${e2(B.TXT.notYet)}</div>`)).join(''), '');
  };
  // S30: the War Council. The first roll in the Founding always wins one Edge [S].
  B.council = function(pick){
    const s = ST(); if (!s || T.cur) return;
    const j = B.job2(), c = j.c, diff = typeof councilDiff === 'function' ? councilDiff(c) : 4;
    if (!B.is('council')) return B.march2();
    if (!c.council){
      const sk = Math.max(1, leaderStats(META.leader).per | 0); let r = null;
      for (let i = 0; i < 60 && !(r && (r.out === 'solid' || r.out === 'crit')); i++) r = attackDie(sk, diff);
      c.council = [{label: B.TXT.die, skill: typeof clampSkill === 'function' ? clampSkill(sk) : sk, face: (r.out === 'solid' || r.out === 'crit') ? r.face : 6, res: 'success'}]; c.picks = 1;
    }
    if (pick && !c.edges.length && EDGES.some(e => e.id === pick)){ c.edges.push(pick); c.picks = 0; if (typeof SFX !== 'undefined') try { SFX.play('pick'); } catch (e) {} }
    const d = c.council[0], got = c.edges[0], tx = T.text('warCouncil', {leader: leaderName()});
    F.card(e2(tx.title || B.TXT.councilHead), `<div class="log" style="max-width:640px;margin:8px auto;text-align:left">
        <div id="b45-res" style="display:inline-block;padding:4px 10px"><span class="note">${e2(B.TXT.res)}</span> <b style="font-size:22px">${diff}</b></div>
        <div id="b45-die" style="display:inline-block;padding:4px 10px"><span class="note">${e2(d.label)}</span> <b style="font-size:22px;color:#226b2a">${d.face}</b> <span class="note">${e2(B.TXT.won)}</span></div>
        <div class="edges" id="b45-edges" style="margin-top:8px">${EDGES.map(e => `<div class="edge ${got === e.id ? 'on' : ''}" style="${got && got !== e.id ? 'opacity:.4' : ''}" ${got ? '' : `onclick="B45.council('${e.id}')"`}><b>${e2(e.name)}</b><br><span style="font-size:14px">${e2(e.text)}</span></div>`).join('')}</div></div>
        <div class="sub" style="color:#8a6a1c;font-weight:bold;letter-spacing:1px;min-height:20px">${got ? '' : e2(tx.gate || '')}</div>`,
      `<button class="btn gold" id="b45-march2" ${got ? '' : 'disabled'} onclick="B45.march2()">${e2(B.TXT.march)}</button>`);
    if (!s.council){ s.council = true; saveMeta(); T.lesson('warCouncil', {sel: '#b45-res', sel2: '#b45-die', after: '#b45-die', vars: {leader: leaderName()}}); }
  };
  B.march2 = function(){
    if (T.cur || typeof startDeployment !== 'function') return;
    const c = B.job2().c; B._job2 = null;
    startDeployment(c, F.squad());
  };
  // S31: Luck, when the first enemy is near
  const J2 = () => (typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.b45 === 'job2' && B.is('luck')) ? (G.b45k || (G.b45k = {step: 'wait'})) : null;
  B.luckTick = function(){
    const k = J2(); if (!k || k.step !== 'wait' || T.cur || T.g) return;
    if (!k.leg){ k.leg = true; B.legendSoFar(); }
    const L = G.leader;
    if (!G.enemies.some(e => !e.dead && !e.dormant && dist(e, L) < B.K.see)) return;
    if ((k.n = (k.n | 0) + 1) < B.K.luckWait) return;               // a breath after the enemy shows
    k.step = 'luck'; T.quiet(['luck']);
    if (G.luck < 1) G.luck = 1;                                     // the lesson needs one point to spend
    T.lesson('luck', {hud: {kind: 'leader'}, vars: {leader: leaderName()}, then(){ T.gate('luck', () => G.nudge > 0, {then(){ k.step = 'done'; }}); }});
  };
  // S31a Standing, S32 the Advancement check, S33 Comrade Bonds: this job's debrief
  B.deb2 = function(c){
    if (!c || c.b45 !== 'job2' || !F.active()) return;
    const s = ST(), el = document.getElementById('debrief-inner'), log = el && el.querySelector('.log'); if (!s || !log) return;
    const d = G.b45d = G.b45d || {};
    if (G.result === 'victory' && B.is('standing')){
      if (!d.st){ d.st = true; d.from = s.varn | 0; s.varn = Math.min(3, d.from + 1); saveMeta(); }
      const f = n => (n > 0 ? '+' : '') + n;
      log.insertAdjacentHTML('beforeend', `<p class="good" id="b45-stand">${e2(T.fill(B.TXT.stand, {a: f(d.from), b: f(s.varn)}))}</p>`);
      if (!s.standSeen){ s.standSeen = true; saveMeta(); T.lesson('standing', {sel: '#b45-stand'}); }
    }
    if (B.is('bonds') && !s.bondSeen && window.BOND_ASKED !== G){   /* LE D2: a debrief re-render asks once per deployment */
      window.BOND_ASKED = G;
      const a = META.roster.find(p => p.bond && META.roster.some(q => q.id === p.bond)), b = a && META.roster.find(q => q.id === a.bond);
      if (a && b) T.lesson('bonds', {sel: '#debrief-inner .u4-r[data-sec="squad"], #debrief-inner .log', vars: {name: a.name, leader: b.name, name2: b.name}, then: ok => { if (ok){ s.bondSeen = true; saveMeta(); } }});   /* LE: marked seen only once GOT IT is pressed, so a card skipped for want of a target teaches next time */
    }
    if (d.rem){ const go = el.querySelector('button[onclick="leaveDebrief()"]'), tx = T.text('advancement');
      if (go && advLeft() > 0) go.insertAdjacentHTML('beforebegin', `<div id="b45-advrem" class="sub" style="color:#8a6a1c"><b>${e2(tx.remind || '')}</b></div>`); }
  };
  B.legendSoFar = function(){
    try {
      T.legend(T.text('move').legend);
      const had = {};
      for (const [id, sp] of [['soldier', 'SOLDIER'], ['scoundrel', 'SCOUNDREL'], ['cureWounds', 'CLERIC']]){
        const raw = T.text(id).legendRaw;
        if (raw && sp && G.abil[sp] && !had[sp]){ had[sp] = true; T.legend(raw, sp); } }
      T.legendYou(META.leader && META.leader.spec);
      T.legend(T.text('shieldWall').legend);
    } catch (e) {}
  };

  /* ---- hooks ---------------------------------------------------------------------- */
  { const f = F.STEP3.camp; F.STEP3.camp = function(b, body){ if (B.ok() && !B.is('hub')) return f.apply(this, arguments);   /* s6-15b 13 (F2): Lessons off removes the teaching, never the Campfire */ return B.hub(b, body); }; }
  { const f = F.STEP3.leads; if (f) F.STEP3.leads = function(b, body){   // S34: the choice (the b6 leads): read the Standing line
      const s = ST(), st = F.state(), on = b && b.id === 'b6' && s && !st.lead && B.is('price');
      if (on) T.quiet(['sunStanding']);
      const r = f.apply(this, arguments);
      try { if (on){
        const notes = [...document.querySelectorAll('#create-inner .log > .note')]; notes.forEach((x, i) => { x.id = 'b45-p' + i; });
        if (notes[0]) notes[0].style.marginBottom = ((parseFloat(getComputedStyle(notes[0]).marginBottom) || 0) + 8) + 'px';   // UX 1i-12: 8 px more under the ringed line, so the ring's glow does not touch TAKE IT
        for (const x of document.querySelectorAll('#create-inner > .note')) if (/^Tip:/.test(x.textContent)) x.style.display = 'none';   // the lesson replaces tip sunStanding
        if (notes.length && !s.price){ s.price = true; saveMeta(); T.lesson('price', {sel: '#b45-p0', vars: {leader: leaderName()}}); } } } catch (e) { console.warn('B45 price', e); }
      return r; }; }
  { const f = F.go; F.go = function(){                                // between b5 and b6: the second job's War Table
      const st = F.state(), b = st && F.BEATS[st.beat], s = st && st.b45;
      if (b && b.id === 'b5b' && s && META.leader && B.is('job2')){ if (B._job2 && !!B._job2.c.rushed !== F.rushed(b)) B._job2 = null; return B.table2(); }   // G2: a rushed job pays half
      return f.apply(this, arguments); }; }
  B.hookLate = function(){
    if (B.hooked) return; B.hooked = true;
    /* P23-BUG-4: nothing reaches the field in the end beat. Every key press and every click on the canvas is swallowed first
       (Esc and M pause, Space formation, Q and R Luck, Tab and 7-9 Momentum, 1-5 and E abilities, WASD, the Deck and Momentum cards);
       the wrappers below cover the paths a capture listener cannot reach (drills.js listens in capture too, the auto casts, the pause menu). */
    { const eat = e => { if (!B.holding() || (e.type === 'keydown' && /^F\d+$/.test(e.key))) return; e.stopImmediatePropagation(); e.preventDefault(); };
      window.addEventListener('keydown', eat, true);
      for (const t of ['mousedown', 'click', 'dblclick', 'contextmenu']) window.addEventListener(t, e => { if (e.target && e.target.tagName === 'CANVAS') eat(e); }, true); }
    if (window.F33 && typeof F33.fieldOK === 'function'){ const f = F33.fieldOK; F33.fieldOK = function(){ return !B.holding() && f.apply(this, arguments); }; }
    if (window.F33 && typeof F33.onKey === 'function'){ const f = F33.onKey; F33.onKey = function(){ if (B.holding()) return; return f.apply(this, arguments); }; }
    if (window.ABIL33) for (const k of ['use', 'useOwn', 'press', 'toggle']) if (typeof ABIL33[k] === 'function'){ const f = ABIL33[k]; ABIL33[k] = function(){ return B.holding() ? false : f.apply(this, arguments); }; }
    if (typeof togglePause === 'function'){ const f = togglePause; togglePause = function(){ if (B.holding() && !G.paused) return; return f.apply(this, arguments); }; }
    if (typeof askWithdraw === 'function'){ const f = askWithdraw; askWithdraw = function(){ if (B.holding()) return; return f.apply(this, arguments); }; }
    if (typeof useAbility === 'function'){ const f = useAbility; useAbility = function(spec){
        const y = S(), a = y && G.abil && G.abil[spec], cd0 = a ? a.cd : 0;
        if (y && y.endF != null) return;                            // P23-BUG-4: the end beat ignores input
        if (y && B.dim({spec})){ B.say({spec}); return; }
        const r = f.apply(this, arguments);
        try { if (y && a && cd0 <= 0 && a.cd > 0) y.use[spec] = (y.use[spec] | 0) + 1; } catch (e) {}
        return r; }; }
    const held = e => { const y = S(); return !!(y && y.sleep && y.foes.includes(e)); };
    const safe = e => { const y = S(); return !!(y && y.foes.includes(e) && y.sleep); };   // asleep dummies take nothing
    const wallLive = e => { const y = S(); return !!(y && y.foes.includes(e) && y.step === 'wall' && !y.wallDone); };   // GD rule 2: awake in the wall step, hits land but a dummy stays on 1 Condition
    if (typeof hurtEnemy === 'function'){ const f = hurtEnemy; hurtEnemy = function(e, n){ if (safe(e)) return;
        if (wallLive(e) && !e.dead){ const m = Math.min(n | 0, Math.max(0, (e.con | 0) - 1)); if (m <= 0) return; return f.call(this, e, m); }
        const y = S(); if (y && y.foes.includes(e) && !e.dead){ e.b45hits = (e.b45hits | 0) + 1; if (e.b45hits >= B.K.hits) return f.call(this, e, Math.max(n | 0, e.con + 1)); }   // G1: a dummy falls in three hits
        return f.apply(this, arguments); }; }
    if (typeof nearest === 'function'){ const f = nearest; nearest = function(from, reach, skip, los){                     // G1: the squad holds fire while the dummies wait
        const y = S(); if (y && y.sleep){ skip = new Set(skip || []); for (const e of y.foes) skip.add(e); }
        return f.call(this, from, reach, skip, los); }; }
    if (typeof draw === 'function'){ const f = draw; draw = function(){ const r = f.apply(this, arguments); try { B.drawGoal(); } catch (e) {} return r; }; }
    if (typeof killEnemy === 'function'){ const f = killEnemy; killEnemy = function(e){ if (safe(e) || wallLive(e)) return; return f.apply(this, arguments); }; }
    if (typeof wake === 'function'){ const f = wake; wake = function(e){ if (held(e)) return; return f.apply(this, arguments); }; }
    if (typeof contractEnemyAI === 'function'){ const f = contractEnemyAI; contractEnemyAI = function(e){ if (held(e)){ e.vx = e.vy = 0; return true; } return f.apply(this, arguments); }; }   // a held dummy does nothing at all
    if (typeof updateContract === 'function'){ const f = updateContract; updateContract = function(){
        try { B.tick(); B.jobTick(); B.luckTick(); } catch (e) { console.warn('B45 tick', e); }
        return f.apply(this, arguments); }; }
    if (typeof contractLine === 'function'){ const f = contractLine; contractLine = function(){ const y = S(); if (!y) return f.apply(this, arguments);
        if (G.contract) G.contract.title = B.title();
        return [B.goalBig() || B.TXT.yardHead, (B.goalText() || B.TXT.yardSub) + (y.step === 'wall' && !y.wallDone ? ' \u00b7 \u200b' : '')]; }; }
    if (typeof renderDebrief === 'function'){ const f = renderDebrief; renderDebrief = function(head, lines){
        const c = typeof G !== 'undefined' && G && G.contract;
        if (c && c.b45 === 'yard' && G.b45) return f.call(this, B.TXT.yardHead, [`<span class="d31-head" style="display:none"></span><p>${e2(G.b45.capped ? B.TXT.yardCap : B.TXT.yardDone)}</p>` + (B.skipped(G.b45).length ? `<p>${e2(T.fill(B.TXT.yardSkip, {list: B.skipped(G.b45).join(', ')}))}</p>` : '')]);
        const r = f.apply(this, arguments);
        try { B.deb5(c); B.deb2(c); } catch (e) { console.warn('B45 debrief', e); }
        return r; }; renderDebrief.last = f.last; }
    if (typeof leaveDebrief === 'function'){ const f = leaveDebrief; leaveDebrief = function(){
        const c = typeof G !== 'undefined' && G && G.contract;
        if (c && F.active() && ST() && B.is('job2')){
          const s = ST(), won = G.result === 'victory' || G.result === 'withdrawn';
          if (c.b45 === 'job2'){
            const d = G.b45d || (G.b45d = {}), R = META.advRound || {given: []};
            if (won && B.is('adv') && !d.rem && advLeft() > 0 && META.roster.some(p => !(R.given || []).includes(p.id) && (p.adv | 0) < advCap())){   // S32: the check
              d.rem = true; return renderDebrief(renderDebrief.last.head, renderDebrief.last.lines); }
            const r = G.result; G = null; T.reset();
            if (won){ s.j2 = true; saveMeta(); return F.next(r); }
            saveMeta(); return F.go(); } }
        if (c && c.b45 === 'yard' && F.active()){
          const sk = G.b45 ? B.skipped(G.b45) : [], s = ST();                 // G1: leaving counts as done; the camp says what was skipped
          G = null; T.reset();
          if (s){ s.yard = true; s.yardSkip = sk; saveMeta(); }
          return F.go(); }
        return f.apply(this, arguments); }; }
  };
  if (document.readyState === 'complete') B.hookLate(); else window.addEventListener('load', B.hookLate);

  /* ---- self-test -------------------------------------------------------------------- */
  B.selfTest = function(){
    const rows = []; let pass = 0, fail = 0;
    const ok = (name, v) => { rows.push([name, !!v]); if (v) pass++; else fail++; };
    const L = (CL().lessons) || {};
    for (const id of ['camp', 'hiring', 'cleric', 'bleeding', 'cureWounds', 'shieldWall']) ok('words: lessons.' + id, L[id] && L[id].title && (L[id].text || []).length);
    { const G0 = G, cur = T.cur;                                      // the yard cannot be lost
      try { T.cur = null;
        G = {over: false, contract: {b45: 'yard'}, formation: 'OPEN', leader: {wounds: 0, maxWounds: 5, con: 1, maxCon: 6, down: false},
          squad: [{state: 'up', con: 1, maxCon: 4, spec: 'SOLDIER'}], b45: {step: 'wall', noHeal: false, down: null, wallT: 0}};
        B.tick();
        ok('the drill yard: nobody is hurt (Wounds and Condition are made good every frame)', G.leader.wounds === 5 && G.leader.con === 6 && G.squad[0].con === 4);
      } catch (e) { ok('the drill yard: nobody is hurt: ' + e.message, false); }
      finally { G = G0; T.cur = cur; } }
    { const G0 = G, cur = T.cur;                                      // G1: the yard's goal line, dimming, wall drop and skipped list
      try { T.cur = null;
        const y = {step: 'cure', foes: [], did: {fall: true, bleeding: true}, wallT: 0, done: false, f0: 0, hinted: {}, stepF: 0, use: {}};
        G = {over: false, frame: 0, contract: {b45: 'yard'}, formation: 'OPEN', leader: {x: 0, y: 0, wounds: 0, maxWounds: 5, con: 1, maxCon: 6, down: false}, squad: [], b45: y, fx: [], msgs: []};
        ok('G1: Cure Wounds step dims every key but the Cleric key, with a reason', B.dim({spec: 'CLERIC'}) === '' && !!B.dim({spec: 'SOLDIER'}));
        ok('G1: a goal line for every step', B.ORDER.every(k => !!B.TXT.goal[k]));
        ok('G1: the skipped list names the steps not done', B.skipped(y).length === 3 && B.skipped({did: {}}).length === 5);
        y.step = 'wall'; G.formation = 'SHIELD'; y.wallT = B.K.wall - 1; B.tick();
        ok('G1: the game drops the Shield Wall after the hold', G.formation === 'OPEN' && y.wallDone);
        { const d = {x: 50, y: 0, r: 10, con: 3, b45wait: true}; G.enemies = [d]; G.mark33 = null; y.sleep = true; y.step = 'fall';
          const pop0 = pop; let said = ''; pop = (x, yy, t) => { said = t; };
          let held; try { held = B.holdFire(50, 0); } finally { pop = pop0; }
          ok('GD: a left click on a waiting dummy holds fire (no arrow, no mark), and says why', held === true && G.mark33 === null && said === 'Not yet: walk up to the dummies first.');
          { const q0 = F33.q, pop1 = pop, fo0 = F33.fieldOK; F33.fieldOK = () => true; let said2 = 0; pop = () => { said2++; };   // GD: the real order path, left (shoot) and right (swing), each held and each says "Not yet" at most once per 2 s
            G.frame = 500; y.sayF = -1e6; G.mark33 = null; F33.q = null; let r1, r2, r3; try { r1 = F33.order('shoot', 50, 0); r2 = F33.order('swing', 50, 0); r3 = F33.order('swing', 52, 0); } finally { pop = pop1; F33.fieldOK = fo0; }
            ok('GD: F33.order shoot and swing on a waiting dummy are held (no arrow, no swing, no mark), and the reason shows once in 2 s', r1 === true && r2 === true && r3 === true && !F33.q && G.mark33 === null && said2 === 1); F33.q = q0; }
          y.sleep = false; d.b45wait = false; ok('GD: at the finish a click on a dummy is not held', B.holdFire(50, 0) === false); }
        ok('G1: three hits fell a dummy; Hal speaks after 20 s; the bout counts at 3 min', B.K.hits === 3 && B.K.hint === 1200 && B.K.cap === 10800);
      } catch (e) { ok('G1: yard checks: ' + e.message, false); }
      finally { G = G0; T.cur = cur; } }
    { const G0 = G, cur = T.cur, ed0 = endDeployment, sp0 = SFX.play, k0 = Object.assign({}, keys), n0 = note;   // P23-BUG-4: the end beat
      const F0 = window.F33 ? {held: F33.mouse && F33.mouse.held, rush: F33.rush, q: F33.q, charge: F33.charge, sc: F33.stopCharge} : null;
      const ends = [], sfx = [], logged = [], heard = [], spy = e => heard.push(e.type + ':' + (e.key || e.button)), cv = document.createElement('canvas');
      try { T.cur = null; endDeployment = r => { ends.push(r); G.over = true; }; SFX.play = k => { sfx.push(k + (G.over ? '@over' : '')); }; note = t => { logged.push(t); };
        const y = {step: 'finish', foes: [], did: {}, done: true, f0: 0, hinted: {}, stepF: 0, use: {}};
        G = {over: false, paused: false, frame: 1000, contract: {b45: 'yard'}, formation: 'OPEN', leader: {x: 0, y: 0, wounds: 5, maxWounds: 5, con: 6, maxCon: 6, down: false}, squad: [], enemies: [], b45: y, fx: [], msgs: [], abilQ: [{spec: 'MAGE'}], abil: {SOLDIER: {cd: 0}}};
        let stopped = 0; if (window.F33){ F33.charge = {k: 'd'}; F33.stopCharge = () => { stopped++; F33.charge = null; }; }
        keys.d = true; B.endBeat(y);
        const words = y.endFx.map(f => f.text);
        ok('BUG-4: the last dummy starts the hold: YARD CLEARED over the Leader, Hal’s line over Hal and in the log, the victory sting once, keys, charge and queued casts dropped',
          words.includes(B.TXT.cleared) && words.some(w => w && B.TXT.clearedBark.includes(w)) && logged.includes(B.TXT.clearedBark) && sfx.join() === 'win@over' && G.over === false
          && !keys.d && !G.abilQ.length && (!window.F33 || (stopped === 1 && !F33.charge)) && !ends.length);
        document.body.appendChild(cv); window.addEventListener('keydown', spy); cv.addEventListener('mousedown', spy); cv.addEventListener('contextmenu', spy);
        for (const k of ['Escape', 'm', ' ', 'q', 'r', 'Tab', '7', '1', 'e', 'w']) document.body.dispatchEvent(new KeyboardEvent('keydown', {key: k, bubbles: true, cancelable: true}));
        cv.dispatchEvent(new MouseEvent('mousedown', {button: 0, bubbles: true, cancelable: true})); cv.dispatchEvent(new MouseEvent('contextmenu', {button: 2, bubbles: true, cancelable: true}));
        const direct = [useAbility('SOLDIER'), window.ABIL33 ? ABIL33.use({}, {id: 'x'}) : false, window.ABIL33 ? ABIL33.toggle({}) : false, window.F33 && F33.onKey ? F33.onKey({key: 'x'}) : undefined, togglePause(), askWithdraw()];
        ok('BUG-4: in the hold no key press or canvas click gets through, and pause, withdraw, abilities and the field orders refuse',
          !heard.length && direct.every(v => !v) && !G.paused && !ends.length && G.abil.SOLDIER.cd === 0 && (!window.F33 || !F33.fieldOK()) && B.holding());
        y.endFx[0].life = 12; y.endFx[0].y += 9; G.fx.splice(G.fx.indexOf(y.endFx[y.endFx.length - 1]), 1);   // a 4th word faded and shifted one, and one went
        let up = true; for (let i = 1; i < B.K.endHold; i++){ G.frame++; for (const f of G.fx) f.life--; B.tick(); up = up && y.endFx.every(f => f.life >= 25 && f.y === f.y0 && G.fx.includes(f)); }
        ok('BUG-4: the field holds ' + B.K.endHold + ' frames (2.5 s) and both words stay up, unmoved, while the game ages them', !ends.length && up && B.K.endHold === 150);
        for (let i = 0; i < 30; i++){ G.frame++; B.tick(); }
        ok('BUG-4: then the report opens once, as a victory, with no second sting', ends.join() === 'victory' && sfx.join() === 'win@over' && !B.holding());
        G = {over: true, frame: 5, b45: y, fx: [], msgs: [], leader: {x: 0, y: 0}, squad: []}; y.endF = null; B.endBeat(y);
        ok('BUG-4: if the 3 min count opened the report first, no hold and no late sting', y.endF == null && sfx.length === 1);
      } catch (e) { ok('BUG-4: end beat: ' + e.message, false); }
      finally { G = G0; T.cur = cur; endDeployment = ed0; SFX.play = sp0; note = n0; for (const k in keys) delete keys[k]; Object.assign(keys, k0);
        window.removeEventListener('keydown', spy); cv.remove();
        if (F0){ if (F33.mouse) F33.mouse.held = F0.held; F33.rush = F0.rush; F33.q = F0.q; F33.charge = F0.charge; F33.stopCharge = F0.sc; } } }
    ok('words: lessons.hireCard has the question and the answer', Array.isArray(L.hireCard) && L.hireCard.length >= 2);
    ok('words: coach.statCheck', (CL().coach || {}).statCheck && CL().coach.statCheck.ask && CL().coach.statCheck.right === 'con');
    ok('cast: Sister Maud is a Cleric', CAST('maud').spec === 'CLERIC' && SPECS[CAST('maud').spec] && RACES[CAST('maud').race] && CLASSES[CAST('maud').cls]);
    ok('the camp beat is b4', F.BEATS.some(b => b.id === 'b4' && b.kind === 'camp') && typeof F.STEP3.camp === 'function');
    ok('the drill mode is there', typeof startDrill === 'function' && typeof DRILL === 'object' && !!HOSTS[DRILL.host]);
    for (const id of ['gear', 'armour', 'treasury']) ok('words: lessons.' + id, L[id] && L[id].title && (L[id].text || []).length);
    ok('words: lessons.warTable is one card (U1)', Array.isArray(L.warTable) && L.warTable.length === 1 && L.warTable[0].mark === 'job');
    ok('words: coach.noShield', !!(CL().coach || {}).noShield);
    ok('the kit: armour with an AC, and a shield', F.KIT.length === 2 && gear(F.KIT[0]) && gear(F.KIT[0]).ac > gear('rags').ac && gear(F.KIT[1]) && gear(F.KIT[1]).slot === 'shield');
    ok('the first job is b5, an escort', F.BEATS.some(b => b.id === 'b5' && b.kind === 'fight' && b.obj === 'escort') && typeof F.contract === 'function' && typeof F.step === 'function');
    for (const id of ['escort', 'cover', 'charge', 'chest', 'blip']) ok('words: lessons.' + id, L[id] && L[id].title && (L[id].text || []).length);
    for (const id of ['rest', 'advancement']) ok('words: lessons.' + id, L[id] && L[id].title && (L[id].text || []).length);
    ok('words: lessons.advancement has a goal', !!(L.advancement && L.advancement.goal));
    ok('the game has the Advancement round', typeof advLeft === 'function' && typeof giveAdvancement === 'function' && typeof advCap === 'function');
    for (const id of ['warCouncil', 'luck', 'standing', 'bonds']) ok('words: lessons.' + id, L[id] && L[id].title && (L[id].text || []).length);
    ok('the second job: a kind, an enemy and four Contract Edges', !!CONTRACTS[B.K.job2] && !!HOSTS[B.K.host2] && EDGES.length >= 3 && typeof councilDiff === 'function' && typeof attackDie === 'function');
    ok('words: lessons.price', L.price && L.price.title && (L.price.text || []).length);
    ok('the leads beat is b6', F.BEATS.some(b => b.id === 'b6' && b.kind === 'leads') && typeof F.STEP3.leads === 'function');
    ok('Luck: Q spends it', typeof spendLuck === 'function');
    ok('steps: fall, bleeding, cure, wall, finish', ['fall', 'bleeding', 'cure', 'wall', 'finish'].every(k => typeof B.STEPS[k] === 'function'));
    return {pass, fail, rows};
  };
})();
