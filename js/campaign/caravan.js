/* ============================================================================
   INDEX CARAVAN30 - F-30 part C: the caravan (Lead Programmer, 2026-11-13)
   The Long Road (story Part Two), new story saves only (META.cp.caravan30, stamped by newStory).
   1. Folk: Column Strength is now a roster of named refugees (C.folk). C.column stays the number
      every rule reads (the night toll, hunger, events, the ending bands); the roster follows it.
   2. On the night map the huddled refugees are the roster. The column toll (unchanged) now kills
      named folk where they stand. Some folk are armed (short bows, Refugee Volunteer stats) and
      stand at the column's edge as units; if one is cut down, that is one less in the column.
   3. Parley: a success brings an offer from two of the five other founding companies (Lore Wiki
      R-121; the player is the Grey Cloaks). Hire one for a night at today's price, or three nights
      at double. Their dead are lost for good; the band walks back when its nights run out.
   Text: window.CARAVAN_LINES (js/campaign/story.js INDEX 85r, Narrative), read at call time.
   Numbers marked [S] are interim for Systems. Stats of every band = the old sellswords.
   No switch (CARAVAN30.on and reward were removed in INT-1, 2026-11-15). Old saves (no caravan30 flag) keep the number column.
============================================================================ */
(function(){
  if (typeof META === 'undefined' || typeof AUX === 'undefined') return;
  const CV = window.CARAVAN30 = {};
  const K = CV.K = {armedShare:0.15, armedCap:4, folkHp:3, bandN:4, offer:2};   // Systems' set, Patrick 2026-11-14
  CV.applies = () => !!(META && META.cp && META.cp.caravan30);
  const live = () => !!(CV.applies() && typeof G !== 'undefined' && G && G.obj === 'night' && G.cv30);
  const CL = () => window.CARAVAN_LINES || {};
  const andList = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];   // 'Ann, Bo and Cy' (Narrative: no Oxford comma)
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);   // Narrative's {placeholders}
  const BANDS = ['faithful', 'deepshaft', 'rowan', 'rustpikes', 'ridge'];
  const BAND_NAME = {faithful:'The Emperor’s Faithful', deepshaft:'The Deepshaft Company', rowan:'The Rowan Watch', rustpikes:'The Rust-Pikes', ridge:'The Ridge-Striders'};
  const band = id => Object.assign({name:BAND_NAME[id]}, (CL().bands || {})[id] || {});
  CV.BANDS = BANDS;

  /* ---------------------------------------------------------------- units --- */
  const sw = AUX.sellswords;
  AUX.folk30 = Object.assign({}, AUX.volunteers, {name:'Armed Refugees', look:Object.assign({}, AUX.volunteers.look)});
  const LOOK = {
    faithful: {race:'HUMAN', weapon:'sword', top:'#8a2a24', armour:'chain', head:'helmet'},
    deepshaft:{race:'DWARF', weapon:'hammer', top:'#5a5048', armour:'chain', head:'helmet'},
    rowan:    {race:'HALF_ELF', weapon:'spear', top:'#3e5a34', head:'hood', hood:'#2e4a24'},
    rustpikes:{race:'HUMAN', weapon:'pike', top:'#8a5a2a', armour:'chain', head:'helmet'},
    ridge:    {race:'HUMAN', weapon:'sword', top:'#6a6a4a', head:'hood', hood:'#4a4a34'}
  };
  for (const id of BANDS) AUX['band30_' + id] = Object.assign({}, sw, {name:BAND_NAME[id], look:LOOK[id]});

  /* ---------------------------------------------------------------- roster --- */
  const RACES4 = ['SUN_ELF', 'GREY_ELF', 'DARK_ELF', 'HALF_ELF'];
  const newFolk = C => { C.folkId = (C.folkId || 0) + 1; const race = RACES4[C.folkId % 4]; let sex = Math.random() < .5 ? 'f' : 'm';
    let name = 'Refugee'; const used = new Set((C.folk || []).map(f => f.name));   // Planner P5: no two folk share a name
    try { namesInUse().forEach(n => used.add(n)); } catch (e) {}   // R8: nor a squad mate, a Hiring Line face, the dead or the lost
    /* the four elf lists share about 32 names (8 per list): after 12 tries on its own list, a newcomer draws from all of them, either sex */
    try { for (let k = 0; k < 200 && (name === 'Refugee' || used.has(name)); k++){ const sx = k < 12 ? sex : (k & 1 ? 'f' : 'm'), n = randomName(k < 12 ? race : RACES4[k % 4], sx); if (!used.has(n)){ name = n; sex = sx; } else if (name === 'Refugee' && k === 199) name = n; } } catch (e) {}
    return {id:'f' + C.folkId, name, race, sex, armed:false}; };
  // the roster follows C.column: the dead go first, then the unarmed at random; new folk join when it grows
  CV.fit = function(C){
    C = C || CP(); if (!C || C.part !== 'road' && C.part !== 'kalloon' && C.part !== 'lost') return;
    const gone = f => { (C.gone = C.gone || []).push(f.name); if (C.gone.length > 300) C.gone.shift(); };   // R8: a lost family's name is not given again
    C.folk = (C.folk || []).filter(f => { if (f.dead) gone(f); return !f.dead; });
    const want = Math.max(0, C.column | 0);
    while (C.folk.length < want) C.folk.push(newFolk(C));
    while (C.folk.length > want){ const un = C.folk.filter(f => !f.armed), pool = un.length ? un : C.folk; gone(C.folk.splice(C.folk.indexOf(pool[Math.random() * pool.length | 0]), 1)[0]); }
    const armed = C.folk.filter(f => f.armed).length, goal = Math.min(K.armedCap, Math.round(C.folk.length * K.armedShare));
    for (const f of C.folk) if (armed < goal && !f.armed && C.folk.filter(x => x.armed).length < goal) f.armed = true;
    return C.folk;
  };

  /* ---------------------------------------------------------------- hooks --- */
  { const f = newStory; newStory = function(){ const r = f.apply(this, arguments); try { if (META && META.cp){ META.cp.caravan30 = true; saveMeta(); } } catch (e) {} return r; }; }
  if (typeof renderWorkBoard === 'function'){ const f = renderWorkBoard; renderWorkBoard = function(){
    try { if (CV.applies()) CV.fit(); } catch (e) { console.warn('CARAVAN30 fit', e); }
    const r = f.apply(this, arguments);
    try { if (CV.applies() && CP().part === 'road') CV.board(); } catch (e) { console.warn('CARAVAN30 board', e); }
    return r; }; }

  // the night: folk on the map, armed folk at the edge, the hired band in its colours
  { const f = setupStory; setupStory = function(c){
      const r = f.apply(this, arguments);
      try { if (CV.applies() && c && c.obj === 'night') CV.setupNight(c); } catch (e) { console.warn('CARAVAN30 night', e); }
      return r; }; }
  CV.setupNight = function(c){
    const C = CP(); CV.fit(C);
    const Z = G.camp || G.column, alive = C.folk;
    G.cv30 = {seen:G.colLoss || 0, dead:[], armed:[]};
    MAP.refugees = [];
    alive.filter(f => !f.armed).forEach((fk, i) => { const a = Math.random() * TAU, d = Math.random() * Z.r * 0.8;
      MAP.refugees.push({x:Z.x + Math.cos(a) * d, y:Z.y + Math.sin(a) * d * 0.8 + 20, p:{race:fk.race, spec:'PLAIN', name:fk.name, id:fk.id, sex:fk.sex}, left:Math.random() < .5, folk:fk}); });
    const armed = alive.filter(f => f.armed), A = AUX.folk30, grp = {type:'folk30', n:armed.length, folk30:true};
    armed.forEach((fk, i) => { const ang = i / Math.max(1, armed.length) * TAU;
      const u = {aux:grp, type:'folk30', x:Z.x + Math.cos(ang) * Z.r * 0.9, y:Z.y + Math.sin(ang) * Z.r * 0.7, hp:K.folkHp, maxHp:K.folkHp, ac:A.ac, shift:0, r:9, objHp:true, auxUnit:true, state:'up',
        timer:40 + i * 9, atkT:0, left:false, flash:0, spr:auxSprite('volunteers', i), slot:12 + i, folk30:fk, name:fk.name};
      G.allies.push(u); G.cv30.armed.push(u); });
    // the hired band: the old sellswords' slot, in the band's colours and at its own strength
    const H = C.band30;
    if (H && C.hired){ const type = 'band30_' + H.id, mine = G.allies.filter(u => u.type === 'sellswords');
      mine.forEach((u, i) => { u.type = type; u.spr = auxSprite(type, i); u.band30 = H.id; if (i >= H.n) u.state = 'gone'; });
      G.allies = G.allies.filter(u => u.state !== 'gone');
      if (mine[0]) mine[0].aux.n = Math.min(mine[0].aux.n, H.n);
      note(`${band(H.id).name} stand with the column tonight (${H.n}).`); }
    if (alive.length) note(`${alive.length} refugees in the column tonight${armed.length ? `, ${armed.length} of them with bows` : ''}.`);
  };
  // each point of column loss is one of the folk: the huddled first, then the armed
  CV.tick = function(){
    const S = G.cv30; if (!S) return;
    for (const u of S.armed) if (u.state === 'dead' && !u.cvDone){ u.cvDone = true; u.folk30.dead = true; S.dead.push(u.folk30.name); G.colLoss = (G.colLoss || 0) + 1; S.seen++; }
    while ((G.colLoss || 0) > S.seen){ S.seen++;
      const R = MAP.refugees || [], i = R.length ? (Math.random() * R.length | 0) : -1;
      if (i >= 0){ const rf = R.splice(i, 1)[0]; rf.folk.dead = true; S.dead.push(rf.folk.name); pop(rf.x, rf.y - 24, fill(CL().falls || '{NAME} FALLS', {NAME:rf.folk.name.toUpperCase()}), '#ff8a7a'); continue; }
      const u = S.armed.find(x => x.state === 'up'); if (u){ u.state = 'dead'; u.cvDone = true; u.folk30.dead = true; S.dead.push(u.folk30.name); pop(u.x, u.y - 24, fill(CL().falls || '{NAME} FALLS', {NAME:u.folk30.name.toUpperCase()}), '#ff8a7a'); }
    }
  };
  { const f = storyCheck; storyCheck = function(){ const r = f.apply(this, arguments); try { if (live()) CV.tick(); } catch (e) { console.warn('CARAVAN30 tick', e); } return r; }; }

  // the debrief: who fell, the roster follows the count, the band counts its dead
  { const f = storyDebrief; storyDebrief = function(c, result, lines){
      const S = G && G.cv30, C = CP(), H = C.band30;
      let bandLeft = null;
      if (S && c && c.obj === 'night' && H && C.hired) bandLeft = G.allies.filter(u => u.band30 === H.id && u.state === 'up').length;
      const r = f.apply(this, arguments);
      try { if (S && c && c.obj === 'night' && CV.applies()){
        try { CV.tick(); } catch (e) {}
        S.dead = [...new Set(S.dead)];   // a name is said once
        if (S.dead.length){ const n = S.dead.length, names = S.dead.slice(0, 4).join(', ');
          lines.push(`<p class="bad">${fill(n > 4 ? (CL().fallen || 'Lost on the road: {names}, and {n} more.') : (CL().fallenFew || 'Lost on the road: {names}.'), {names:n > 4 ? names : andList(S.dead), n:n - 4})}</p>`); }
        CV.fit(C);
        if (H && bandLeft !== null){ const B = band(H.id), lost = H.n - bandLeft;
          if (lost > 0) lines.push(`<p class="bad">${B.fell ? `${B.fell} (${lost} of ${H.n} fell.)` : `${B.name} lost ${lost} of ${H.n}.`}</p>`);
          H.n = bandLeft; H.nights--; (C.met30 = C.met30 || []).includes(H.id) || C.met30.push(H.id);
          if (H.nights > 0 && H.n > 0 && C.part === 'road'){ C.hired = true; lines.push(`<p>${fill(H.nights === 1 ? (CL().staysOne || '{band} stay one more night.') : (CL().stays || '{band} stay for {n} more nights.'), {band:B.name, n:H.nights})}</p>`); }
          else { lines.push(bandLeft > 0 ? `<p>${B.leave || `${B.name} go back to their own banner.`}</p>` : `<p class="bad">${B.allDead || `None of ${B.name.replace(/^The /, 'the ')} came back. Their contract dies with them.`}</p>`); C.band30 = null; C.hired = false; } }
        const O = CL().outcome; if (O && (C.part === 'kalloon' || C.part === 'lost')) lines.push(`<p>${C.part === 'lost' ? O.broken : (C.column | 0) >= 11 ? O.held : (O.thin || 'The column reached the ford, thinner than anyone hoped.')}</p>`);   // Planner L9: held only at Survival (11) and above; [S] words outcome.thin
      } } catch (e) { console.warn('CARAVAN30 debrief', e); }
      return r; }; }

  /* ---------------------------------------------------------------- parley --- */
  const price = n => { const C = CP(), g = 40 * n, s1 = 3 * n, s2 = 5 * n;
    return META.treasury >= g && C.supply >= s1 ? {gold:g, supply:s1, text:`${g}gp and ${s1} Supply`} : C.supply >= s2 ? {gold:0, supply:s2, text:`${s2} Supply`} : null; };
  CV.price = price;
  { const f = workOrder; workOrder = function(id){
      if (id !== 'parley' || !CV.applies()) return f.apply(this, arguments);
      const C = CP(); if (C.orders <= 0 || C.hired) return SFX.play('nope');
      useOrder(); let per = 0; try { per = leaderStats(META.leader).per; } catch (e) {} const r = cpRoll(per, 5), B = CL().briefing || {};
      if (r === 'full'){ const pool = BANDS.slice().sort(() => Math.random() - .5); C.offer30 = pool.slice(0, K.offer);
        cpLog('Recruit a band: two captains come to the wagon with an offer.'); }
      else { C.offer30 = null; cpLog('Recruit a band: ' + (B.none || 'nobody will walk beside you tonight.')); }
      SFX.play('pick'); saveMeta(); try { refreshUI(); } catch (e) {} }; }
  CV.hire = function(id, nights){
    const C = CP(), p = price(nights === 3 ? 2 : 1); if (!p || !(C.offer30 || []).includes(id)) return SFX.play('nope');
    META.treasury -= p.gold; C.supply -= p.supply;
    C.band30 = {id, nights, n:K.bandN}; C.hired = true; C.offer30 = null;
    const B = band(id); cpLog(`Recruit a band: ${B.name} for ${nights === 3 ? 'three nights' : 'tonight'} (${p.text}). ${B.yes || ''}`);
    SFX.play('pick'); saveMeta(); renderWorkBoard(); };
  CV.decline = function(){ const C = CP(), o = C.offer30 || []; C.offer30 = null;
    if (o[0]) cpLog('Recruit a band: ' + (band(o[0]).no || 'the captains walk away.')); saveMeta(); renderWorkBoard(); };
  CV.board = function(){
    const C = CP(), root = document.getElementById('table-inner'); if (!root) return;
    // the Parley card's words
    for (const c of root.querySelectorAll('.wcard')){ const t = c.querySelector('.wt'); if (t && t.textContent === 'Recruit a band'){ const d = c.querySelector('.wd'); if (d) d.textContent = 'Hire a band from one of the other companies.'; } }
    const col = root.querySelector('.wgrid > div'); if (!col) return;
    const B = CL().briefing || {}, H = C.band30;
    let h = '';
    if (C.offer30 && C.offer30.length){
      const p1 = price(1), p3 = price(2);
      h = `<div class="scroll letter" data-cv30="offer"><h3>${B.title || 'Other companies on the road'}</h3><div class="ink small">${B.intro || ''}</div><div class="ink small"><i>${B.price || ''}</i></div>` +
        C.offer30.map(id => { const b = band(id), pitch = (b.pitch || '').replace('{price}', p1 ? p1.text : 'more than you have');
          return `<div class="ink" style="margin-top:6px"><b>${b.name}</b></div><div class="ink small">${b.who || ''}</div><div class="ink small">${pitch}</div>
            <div class="mini" style="justify-content:flex-start"><button ${p1 ? '' : 'disabled'} onclick="CARAVAN30.hire('${id}',1)">Tonight${p1 ? ' (' + p1.text + ')' : ''}</button><button ${p3 ? '' : 'disabled'} onclick="CARAVAN30.hire('${id}',3)">Three nights${p3 ? ' (' + p3.text + ')' : ''}</button></div>`; }).join('') +
        `<div class="mini" style="justify-content:flex-start"><button onclick="CARAVAN30.decline()">Send them away</button></div></div>`;
    } else if (H && C.hired){ const b = band(H.id);
      h = `<div class="scroll letter" data-cv30="band"><h3>${b.name}</h3><div class="ink small">${b.who || ''}</div><div class="ink small">${H.n} with the column, ${H.nights === 1 ? 'for tonight' : 'for ' + H.nights + ' nights'}.${B.note ? ' ' + B.note : ''}</div></div>`; }
    const folk = C.folk || [], armed = folk.filter(f => f.armed).length;
    h += `<div class="scroll letter" data-cv30="folk"><h3>${esc(CL().boardTitle || 'The Column')}</h3><div class="ink small">${folk.length} refugees walk with the wagons${armed ? `, ${armed} of them with bows` : ''}. Every one the enemy reaches is lost for good.</div>` +
      (folk.length ? `<div class="ink small" style="opacity:.8">${folk.slice(0, 12).map(f => f.name + (f.armed ? ' (bow)' : '')).join(', ')}${folk.length > 12 ? ', …' : ''}</div>` : '') + '</div>';
    col.insertAdjacentHTML('afterbegin', h);
    const hdr = root.innerHTML.indexOf('hired sellswords'); if (hdr >= 0 && H) root.innerHTML = root.innerHTML.replace('hired sellswords', esc(band(H.id).name));
  };

  /* ---------------------------------------------------------------- self-test --- */
  /* ---- survivors into the main game: a recruit pool (Patrick 2026-11-14, question 9) ----
     Founding the Chapter from the prologue copies the living folk to META.folk30 and writes a Chronicle line.
     Each season the first slot on the Hiring Line is a survivor at a cheaper price, until one is hired that season.
     K.poolPrice (share of the usual price): half, Patrick 2026-11-14; one a season is interim [S]. */
  K.poolPrice = 0.5;   // Patrick 2026-11-14: half price
  CV.survivors = C => ((C && C.folk) || []).filter(f => !f.dead).map(f => ({id:f.id, name:f.name, race:f.race, sex:f.sex, armed:!!f.armed}));
  CV.settle = function(list){
    META.folk30 = list.slice();
    try { if (list.length){ chron(); chronAdd('folk30', {count:list.length, names:list.slice(0, 5).map(f => f.name)}, true); } } catch (e) {}
    saveMeta(); return META.folk30.length;
  };
  CV.takeRecruit = () => (META.folk30 && META.folk30.length) ? META.folk30.shift() : null;
  CV.poolOpen = () => !!(META && META.folk30 && META.folk30.length && META.pool30At !== seasonName());
  CV.poolMate = function(f){
    const race = RACES[f.race] ? f.race : rollRace(), m = makeMate(race, CLASS_ORDER[d6() - 1], SPEC_ORDER[d6() - 1], f.name);
    if (f.sex) m.sex = f.sex; m.id = -(Math.random() * 1e9 | 0); m.folk30 = f.id; return m;
  };
  const poolPrice = m => Math.round(hireGP(Object.assign({}, m, {hireGP:null})) * K.poolPrice);
  { const f = hireLine;
    hireLine = function(){
      const H = f.apply(this, arguments);
      try {
        const at = H.recruits.findIndex(r => r && r.folk30);
        if (at >= 0 && !CV.poolOpen()){ delete H.recruits[at].hireGP; delete H.recruits[at].folk30; }   // a new season or the pool switched off: an ordinary sellsword
        else if (at < 0 && CV.poolOpen() && H.recruits.length){ H.recruits[0] = CV.poolMate(META.folk30[0]); }
        const r = H.recruits.find(r => r && r.folk30); if (r) r.hireGP = poolPrice(r);
      } catch (e) {}
      return H;
    };
  }
  { const f = hireCamp;
    hireCamp = function(i){
      const H = hireLine(), r = H.recruits[i];
      const out = f.apply(this, arguments);
      try { if (r && r.folk30 && H.recruits[i] === null){
        META.folk30 = META.folk30.filter(x => x.id !== r.folk30); META.pool30At = seasonName(); delete r.hireGP; saveMeta(); } } catch (e) {}
      return out;
    };
  }
  { const f = hiringHTML;
    hiringHTML = function(){
      const h = f.apply(this, arguments);
      try { const r = hireLine().recruits.find(r => r && r.folk30);
        if (r) return `<div class="desc" style="text-align:left;margin:6px 0">${esc(fill(CL().poolNote || '{name} walked with the column out of Varnholt and asks to sign on, for less than a sellsword.', {name:r.name}))}</div>` + h; } catch (e) {}
      return h;
    };
  }
  { const f = finishFound;
    finishFound = function(){
      let keep = null;
      try { const C = META.cp;   // QA fable pass3: a lost road (wipe, column at 0, or the Parley) brings nobody home, so no 'column comes home' line
        if (typeof FD !== 'undefined' && FD && FD.fromStory && CV.applies() && C && C.part !== 'lost' && !C.parley35) keep = CV.survivors(C); } catch (e) {}
      const r = f.apply(this, arguments);
      try { if (keep && !META.cp) CV.settle(keep); } catch (e) {}
      return r;
    };
  }
  { const f = chronText;
    chronText = function(e){
      if (e && e.k === 'folk30'){ const one = e.count === 1;   // QA fable pass3: '1 ... settle' read wrong; one survivor gets its own sentence
        return fill((one ? CL().chronicle1 : CL().chronicle) || (one ? 'The column comes home. One of the Varnholt folk settles beside the camp: {names}.' : 'The column comes home. {n} of the Varnholt folk settle beside the camp, {names} among them.'), {n:e.count, names:andList((e.names || []).map(n => esc(n))) || 'none named'}); }
      return f.apply(this, arguments);
    };
  }

  CV.selfTest = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const sv = {G, MAP, cp:META.cp, tr:META.treasury, sk:SAVE_KEY, cpLog:window.cpLog, save:saveMeta, rw:renderWorkBoard, note, roll:cpRoll};
    try {
      SAVE_KEY = '__caravan30_test'; saveMeta = () => {}; renderWorkBoard = () => {};
      META.cp = {part:'road', night:2, column:20, supply:12, orders:3, aux:[], log:[], hired:false, caravan30:true, wagonHp:100, wagonMax:100, formation:'laager', slots:[]};
      const C = META.cp;
      CV.fit(C);
      ok('the column is a roster of named folk', C.folk.length === 20 && C.folk.every(f => f.name && f.race), C.folk.length + '');
      ok('a share of them are armed', C.folk.filter(f => f.armed).length === Math.min(K.armedCap, Math.round(20 * K.armedShare)), C.folk.filter(f => f.armed).length + '');
      C.column = 17; CV.fit(C);
      ok('the roster follows Column Strength (hunger, events)', C.folk.length === 17);
      const armedBefore = C.folk.filter(f => f.armed).length; C.column = 22; CV.fit(C);
      ok('new folk join when it grows', C.folk.length === 22 && C.folk.filter(f => f.armed).length >= armedBefore);
      // the night: map refugees are the folk; the toll kills them
      C.column = 20; CV.fit(C);
      MAP = generateNightMap(2, 'laager');
      G = {obj:'night', allies:[{type:'sellswords', aux:{type:'sellswords', n:4}, state:'up'}, {type:'sellswords', aux:{type:'sellswords', n:4}, state:'up'}], column:MAP.column, colLoss:0, contract:{obj:'night', night:2}, floats:[], fx:[], pops:[], texts:[]};
      note = () => {};
      C.band30 = {id:'rowan', nights:3, n:1}; C.hired = true;
      CV.setupNight({obj:'night'});
      const un = C.folk.filter(f => !f.armed).length, ar = C.folk.filter(f => f.armed).length;
      ok('the huddled refugees on the map are the folk', MAP.refugees.length === un && MAP.refugees.every(r => r.folk && r.p.name === r.folk.name), MAP.refugees.length + '/' + un);
      ok('armed folk stand as units at the column', G.allies.filter(u => u.folk30).length === ar && G.allies.filter(u => u.folk30).every(u => AUX[u.type].shoot));
      ok('the hired band wears its colours, at its own strength', G.allies.filter(u => u.band30 === 'rowan').length === 1 && !G.allies.some(u => u.type === 'sellswords'));
      G.colLoss = 3; CV.tick();
      ok('each point of column loss is one named refugee', G.cv30.dead.length === 3 && MAP.refugees.length === un - 3 && C.folk.filter(f => f.dead).length === 3);
      const u = G.allies.find(x => x.folk30); u.state = 'dead'; CV.tick();
      ok('an armed refugee cut down costs the column one', G.colLoss === 4 && G.cv30.dead.length === 4 && G.cv30.seen === 4);
      C.column -= G.colLoss; CV.fit(C);
      ok('the dead leave the roster', C.folk.length === 16 && !C.folk.some(f => f.dead));
      // parley
      C.hired = false; C.band30 = null; META.treasury = 500; C.supply = 12; C.orders = 2;
      cpRoll = () => 'full'; workOrder('parley');
      ok('a Parley success brings two founding companies', (C.offer30 || []).length === 2 && C.offer30.every(id => BANDS.includes(id)) && C.orders === 1);
      const pick = C.offer30[0]; CV.hire(pick, 3);
      ok('three nights at double pay', C.band30 && C.band30.nights === 3 && C.hired && META.treasury === 420 && C.supply === 6, META.treasury + '/' + C.supply);
      cpRoll = () => 'miss'; C.hired = false; C.offer30 = null; workOrder('parley');
      ok('a failed Parley brings nobody', !C.offer30);
      ok('band text comes from Narrative', !window.CARAVAN_LINES || band('ridge').pitch === CARAVAN_LINES.bands.ridge.pitch);
      { const f30 = META.folk30, ch = window.chronAdd; let logged = null; chronAdd = (k, d) => { logged = {k, d}; };
        try {
          C.folk = [{id:'a', name:'Ann', race:'HUMAN', sex:'f', armed:true}, {id:'b', name:'Bo', race:'HUMAN', sex:'m', dead:true}, {id:'c', name:'Cal', race:'SUN_ELF', sex:'m'}];
          const sv3 = CV.survivors(C); ok('survivors: the living folk, plain copies', sv3.length === 2 && sv3[0].name === 'Ann' && sv3[0].armed && !sv3[1].armed);
          { const P35 = window.PD35, per = P35 && P35.K.per; if (P35) P35.K.per = 1; try { CV.settle(sv3); } finally { if (P35) P35.K.per = per; } }   // PD-35 keeps one per 4 families; 1 here so both stay
          ok('settle: META.folk30 and a Chronicle line', META.folk30.length === 2 && logged && logged.k === 'folk30' && logged.d.count === 2);
          const t = CV.takeRecruit(); ok('takeRecruit hands out one survivor', t && t.name === 'Ann' && META.folk30.length === 1);
          { const hl = META.hireLine, pa = META.pool30At, tr = META.treasury, ro = META.roster.slice(), ni = META.nextId, sm = saveMeta, rf = refreshUI; saveMeta = () => {}; refreshUI = () => {};
            try {
              META.hireLine = null; META.pool30At = null; META.treasury = 1000;
              const H = hireLine(), r0 = H.recruits[0];
              ok('a survivor waits first on the Hiring Line, cheaper', r0 && r0.folk30 === 'c' && r0.name === 'Cal' && hireGP(r0) < hireGP(H.recruits[1]), r0 && hireGP(r0) + '/' + hireGP(H.recruits[1]));
              const roomy = META.roster.length < rosterCap(); if (roomy) hireCamp(0);
              ok('hired: gone from the pool, none more this season', !roomy || (!META.folk30.some(f => f.id === 'c') && META.pool30At === seasonName() && !hireLine().recruits.some(r => r && r.folk30)));
            } finally { META.hireLine = hl; META.pool30At = pa; META.treasury = tr; META.roster = ro; META.nextId = ni; saveMeta = sm; refreshUI = rf; } }
          ok('Chronicle text for the column', /The column comes home/.test(chronText({k:'folk30', count:2, names:['Ann']})));
          ok('names join as Ann, Bo and Cy', /Ann, Bo and Cy among/.test(chronText({k:'folk30', count:3, names:['Ann', 'Bo', 'Cy']})) && /Ann and Bo among/.test(chronText({k:'folk30', count:2, names:['Ann', 'Bo']})));
          ok('one survivor: "One of the Varnholt folk settles" (QA fable pass3)', /One of the Varnholt folk settles beside the camp: Ann\./.test(chronText({k:'folk30', count:1, names:['Ann']})));
        } finally { META.folk30 = f30; chronAdd = ch; } }
      META.cp.caravan30 = false;
      ok('an old save (no caravan30 flag): Parley and the column as before', !CV.applies());
    } catch (e) { ok('selfTest ran', false, String(e && e.stack || e).slice(0, 200)); }
    finally { G = sv.G; MAP = sv.MAP; META.cp = sv.cp; META.treasury = sv.tr; SAVE_KEY = sv.sk; saveMeta = sv.save; renderWorkBoard = sv.rw; note = sv.note; cpRoll = sv.roll; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
