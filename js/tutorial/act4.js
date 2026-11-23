/* ============================================================================
   INDEX D45 - F-45 teaching, Act IV: the Long Road (audits/f45-act4-5-spec.md, S40 to S52;
   sign-off rows in audits/f45-act4-5-checklist.md). Lead Programmer, 2026-11-16.
   Slice 1 (this file so far):
     b11   the retreat card: no fittings yet (they move to Night 4), the hurt mates rejoin, the
           Act III dead named once, a freed captive fills the squad if Hal and Pinch are both lost.
     Day 1 the muster card (six companies, Cayde, MARCH EAST), once.
     every morning a card: the day, last night's cost, the hurt, the dead, what opens today, the
           story line for the night just fought (morning.after), a quiet line on quiet days, the
           Recruit nudge after a wrecked night; TODAY clears it.
     actions open by night (D45.OPEN): until then they read "Night N" and do nothing.
     Night 1: lessons column, day (NIGHTFALL waits for Forage or Scout), night. First road death:
           death. Night 2: bands (the terms, the button). Night 3: parlay (no white flag on the road
           before Night 3), Sound the Retreat opens, prisoners on the first prisoner.
     Night 4: the fittings card with Cayde's three pre-picked (changeable), then the stakes table.
     rolls: "Personality 4 against 5: Partial" under each day-action result.
     the column bar label: "Your stretch of the column: {n} families".
   Words: CAMPAIGN_LINES.act45 and .lessons (the Campaign Planner's). Numbers [S]: D45.K.
   Off: Settings "Lessons: off" opens every action and keeps the old fittings pick on the retreat
   card (the muster and morning cards stay: they are the road's news, not lessons).
   Test hooks (memory only): D45.roadJump(day), F34.roadLog (one record per road day).
   Self-test: R45.selfTest() (stubs; META, G and the globals are put back).
   ============================================================================ */
(function(){
  'use strict';
  if (typeof F34 === 'undefined' || !window.T45) return;
  const F = F34, T = window.T45, D = window.D45 = {};
  D.K = {retreatShut: 'Sound the Retreat opens on Night 3.', wrecked: 0.25, rollWords: {full: 'Full Success', partial: 'Partial Success', miss: 'Miss'}};   // [S] a night that costs a quarter of the column lights Recruit
  D.CAYDE_FIT = ['infirmary', 'larder', 'armoury'];   // W: fittings.why keys, Cayde's pick
  D.OPEN = {forage: 1, scout: 1, recruit: 1, parley: 2, retreat: 3, tend: 4, repair: 4, pray: 4, craft: 4, camps: 4};   // PD-34: no detachment or officer step on the road (both teach on the main board, js/campaign/pd34.js)
  D.NEW = {1: ['forage', 'scout', 'recruit'], 2: ['parley'], 3: ['retreat'], 4: ['camp']};   // morning "New today" lines (opens.<key>)
  const W = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45) || {};
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fill = (s, v) => T.fill(s, v);
  const names = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const verb = a => a.length === 1 ? 'is' : 'are';
  const C_ = () => (typeof META !== 'undefined' && META && META.cp) || null;
  D.road = () => { try { return F.roadOn(); } catch (e) { return false; } };
  D.on = () => D.road() && T.lessonsOn();
  D.locked = id => { const C = C_(); return !!(D.on() && C && C.part === 'road' && D.OPEN[id] && C.night < D.OPEN[id]); };
  D.seen = id => { const C = C_(); return !!(C && C.d45seen && C.d45seen[id]); };
  D.mark = id => { const C = C_(); if (C){ C.d45seen = C.d45seen || {}; C.d45seen[id] = true; } };
  // a road lesson, once per Founding (on the save: a fight's T45 state is thrown away after the fight)
  D.lesson = function(id, o){
    if (D.seen(id)) return false; D.mark(id);
    if (!T.is(id)) return false;
    D.shown.push(id);
    return T.lesson(id, o || {});
  };
  D.shown = [];   // lesson ids shown since the last roadLog record
  const later = fn => setTimeout(() => { try { fn(); } catch (e) { console.warn('D45', e); } }, 0);
  const byId = id => document.getElementById(id);

  /* ---- F34.roadLog: one record per road day (memory only) ------------------------- */
  F.roadLog = F.roadLog || [];
  D.rec = function(){ const C = C_(); if (!C) return null; const L = F.roadLog; let r = L[L.length - 1];
    if (!r || r.night !== C.night){ r = {day: F.roadDay(C.night), night: C.night, lessons: [], opened: [], morning: false, cost: null, dead: [], column: C.column, supply: C.supply, gold: META.treasury | 0, report: []}; L.push(r); }
    return r; };
  const logLessons = () => { const r = D.rec(); if (r && D.shown.length){ r.lessons.push(...D.shown); D.shown = []; } };

  /* ---- b11: the retreat card ---------------------------------------------------- */
  D.b11 = function(){
    const R = META.roster || [], hurt = R.filter(p => p.resting > 0).map(p => p.name), dead = (META.memorial || []).map(m => m.name);
    const out = [], B = W().b11 || {};
    if (hurt.length && B.rejoin) out.push(fill(B.rejoin, {names: names(hurt), verb: verb(hurt)}));
    if (dead.length && B.dead) out.push(fill(B.dead, {names: names(dead)}) + ((B.deadCayde || [])[0] ? ` Cayde: “${B.deadCayde[0]}”` : ''));
    if (D.floorDue() && B.floorRecruit) out.push(fill(B.floorRecruit, {lost: T.who('hal')}));
    return out;
  };
  D.floorDue = () => { try { return !F.friend('hal') && !F.friend('pinch'); } catch (e) { return false; } };
  { const f = retreatHTML; retreatHTML = function(){ const h = f.apply(this, arguments);
      try {
        if (!D.on() || C_().part !== 'retreat') return h;
        const at = h.indexOf('<h3 style="margin:10px 0 4px">Fit the Ledger Wagon');
        const body = at >= 0 ? h.slice(0, at) : h;
        return body + D.b11().map(t => `<div class="desc" style="text-align:left;margin-top:6px">${E(t)}</div>`).join('') +
          `<button class="btn gold" onclick="D45.toRoad()">TO THE WAGONS</button>`;
      } catch (e) { console.warn('D45 b11', e); return h; } }; }
  // the road starts with no fittings (Night 4), the hurt walk again, and the squad floor
  D.toRoad = function(){
    const C = C_(); if (!C) return;
    D.mark('b11dead');
    for (const p of META.roster || []) if (p.resting > 0) p.resting = 0;
    C.slotPick = [];
    startRoad();
  };
  // A5: a freed captive fills the squad when Hal and Pinch are both lost (a rule: lessons on or off)
  D.floor = function(){
    if (!D.floorDue() || META.roster.length >= rosterCap() || (META.roster || []).some(p => p.d45floor)) return null;
    let nm = 'Tamsin'; try { nm = randomName('HUMAN', 'f'); } catch (e) {}
    const m = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', nm); m.d45floor = true; META.roster.push(m); return m;
  };
  { const f = startRoad; startRoad = function(){
      try { const C = C_(); if (C && C.f34road && C.part === 'retreat') D.floor(); } catch (e) { console.warn('D45 floor', e); }
      return f.apply(this, arguments); }; }

  /* ---- the column label --------------------------------------------------------- */
  D.colLabel = n => fill((W().b11 || {}).columnLabel || 'Column Strength {n}', {n});

  /* ---- the cards on the day screen: muster, morning, fittings, stakes -------------- */
  D.musterHTML = function(){
    const M = W().muster || {}, co = M.companies || {};
    /* P23-VOICE F20 (ND): once the ND empties muster.intro, the narration and the six company rows go (the company keys stay for the
       ending, act5 K.company) and Cayde speaks every line of muster.cayde in one box beside his face, his name under it, no "Cayde:" and no quote marks. */
    const voice = !M.intro, cy = (Array.isArray(M.cayde) ? M.cayde : (M.cayde ? [M.cayde] : [])).filter(l => l && String(l).trim());   // gate M6: one string is one line; gate 2 L5: blank lines drop
    let face = ''; try { face = (window.F34 && F34.faceOf) ? F34.faceOf('Cayde') : ''; } catch (e) {}
    return `<h2>${E(M.title || 'The column')}</h2>` + (voice ? '' : `<div class="desc" style="text-align:left">${E(M.intro)}</div>` +
      Object.keys(co).map(k => `<div class="line" data-d45co="${k}"><div class="grow" style="font-size:14px">${E(co[k])}</div></div>`).join('')) +
      (!cy.length ? '' : voice
        ? `<div class="desc" data-d45cay="1" style="display:flex;gap:12px;align-items:flex-start;text-align:left;margin-top:6px"><div style="flex:none;width:72px;text-align:center">${face ? `<img src="${face}" alt="" style="display:block;width:64px;height:64px;margin:0 auto;border:2px solid #8a6d3a;border-radius:3px;object-fit:cover;object-position:top">` : ''}<span data-d45cayn="1" style="display:block;margin-top:4px;font-variant:small-caps;font-size:14px">Cayde</span></div><div>${cy.map((l, i) => `<p style="margin:0 0 ${i === cy.length - 1 ? 0 : 6}px">${E(l)}</p>`).join('')}</div></div>`
        : `<div class="desc" style="text-align:left;margin-top:6px"><i>Cayde: “${E(cy[0])}”</i></div>`) +
      `<button class="btn gold" id="d45-muster" onclick="D45.close('muster')">${E(M.button || 'MARCH EAST')}</button>`;
  };
  D.morningHTML = function(){
    const C = C_(), M = W().morning || {}, m = C.d45m || {}, out = [];
    if (m.after) out.push(`<i>${E(m.after)}</i>`);
    if (m.quiet) out.push(E(m.quiet));
    if (m.cost) out.push(E(m.cost));
    if (m.hurt && m.hurt.length) out.push(E(fill(M.wounded, {names: names(m.hurt), verb: verb(m.hurt)})));
    if (m.dead && m.dead.length) out.push(`<b>${E(fill(M.dead, {names: names(m.dead)}))}</b>`);
    const op = W().opens || {};
    for (const k of D.NEW[C.night] || []) if (T.lessonsOn() && op[k]) out.push(E(fill(M.newThing, {thing: String(op[k]).replace(/\.$/, '')})));
    if (m.witch) out.push(D.joinHTML(D.byId(m.witchId), m.witch));
    if (m.nudge && M.recruitNudge) out.push(`<b>${E(M.recruitNudge)}</b>`);
    return `<h2>${E(fill(M.head || 'Night {d} of {n}', {d: C.night, n: NIGHTS.length}))}</h2>` +
      out.map(t => `<div class="desc" style="text-align:left;margin-top:4px">${t}</div>`).join('') +
      `<button class="btn gold" id="d45-today" onclick="D45.close('morning')">${E(M.button || 'TODAY')}</button>`;
  };
  /* PD-36 (Patrick Q36, 2026-11-16): the Mage and the Witch join with a card and portrait, as the Fire's recruits do */
  D.byId = id => id == null ? null : (META.roster || []).find(p => p && p.id === id) || null;
  D.joinHTML = function(p, t){
    if (!p || !SPECS[p.spec]) return `<b>${E(t)}</b>`;
    let pic = '', ab = (ABILITIES[p.spec] || {}).name || ''; try { pic = portraitURL(p, false); } catch (e) {}
    try { const id = window.BOOK33 && BOOK33.loadout(p).active, R = id && window.ABIL33 && ABIL33.REG[id]; if (R && R.name) ab = R.name; } catch (e) {}   // her own key (the Mage: Burning Hands)
    return `<div class="log" data-d45join="${E(p.spec)}" style="text-align:left;margin:6px 0;overflow:hidden">`
      + (pic ? `<img src="${pic}" alt="" style="float:left;width:56px;height:64px;object-fit:cover;margin:0 10px 4px 0;image-rendering:pixelated;border:1px solid #8a6a2a">` : '')
      + `<b>${E(t)}</b><br><span style="color:${SPECS[p.spec].color}">${E(p.name)}: ${E((RACES[p.race] || {}).name)} ${E((CLASSES[p.cls] || {}).name)} ${E(SPECS[p.spec].name)}</span>`
      + `<div class="note" style="margin-top:2px">Ability: ${E(ab)}</div></div>`;
  };
  D.fitHTML = function(){
    const C = C_(), X = W().fittings || {}, why = X.why || {}, pick = C.slotPick || [];
    return `<h2>${E(X.title || 'Fit the Ledger Wagon')}</h2><div class="desc" style="text-align:left">${E(X.intro || '')}</div>` +
      ((X.cayde || [])[0] ? `<div class="desc" style="text-align:left"><i>Cayde: “${E(X.cayde[0])}”</i></div>` : '') +
      Object.entries(WAGON_SLOTS).map(([k, S]) => `<div class="line" data-d45fit="${k}"><div class="grow"><b>${E(S.name)}</b><br><span style="font-size:14px">${E(why[k] || S.text)}</span></div><button data-d45take="${pick.includes(k) ? 1 : 0}" style="min-height:40px;min-width:76px;${pick.includes(k) ? 'background:var(--ink-soft);color:#fff' : ''}" onclick="pickSlot('${k}')">${pick.includes(k) ? '✓ ' + E((W().fittings || {}).taken || 'Taken') : E((W().fittings || {}).take || 'Take')}</button></div>`).join('') +
      (D.fitFull ? `<div class="desc" id="d45-fitfull" style="color:#8a2a14;font-weight:bold">${E(X.full || 'Three fittings is all the wagon carries. Take one off first.')}</div>` : '') +
      `<button class="btn gold" id="d45-fit" ${pick.length === 3 ? '' : 'disabled'} onclick="D45.close('fit')">${E(X.button || 'FIT THE WAGON')}</button>`;
  };
  D.stakesHTML = function(){
    const S = W().stakes || {};
    return `<h2>${E(S.title || 'What a night costs')}</h2>` + (S.rows || []).map(t => `<div class="line"><div class="grow" style="font-size:14px">${E(t)}</div></div>`).join('') +
      (S.note ? `<div class="desc" style="text-align:left;margin-top:6px"><i>${E(S.note)}</i></div>` : '') +
      `<button class="btn gold" id="d45-stakes" onclick="D45.close('stakes')">${E((W().morning || {}).button || 'TODAY')}</button>`;
  };
  // which card is up (null = the day screen itself)
  D.card = function(){
    const C = C_(); if (D.off || !D.road() || !C || C.part !== 'road') return null;
    if (C.night === 1 && !C.d45muster) return 'muster';
    if (C.d45morning !== C.night) return 'morning';
    if (D.on() && C.night >= 4 && !C.d45fit){
      if (!C.d45fitSeed){ C.d45fitSeed = true; C.slotPick = D.CAYDE_FIT.filter(k => WAGON_SLOTS[k]).slice(0, 3); }
      return 'fit'; }
    if (D.on() && C.d45fit && !C.d45stakes) return 'stakes';
    return null;
  };
  D.close = function(k){
    const C = C_(); if (!C) return;
    if (k === 'muster') C.d45muster = true;
    if (k === 'morning'){ C.d45morning = C.night; const r = D.rec(); if (r) r.morning = true; }
    if (k === 'fit'){ if ((C.slotPick || []).length !== 3) return SFX.play('nope'); C.slots = C.slotPick.slice(); C.slotPick = null; C.d45fit = true; }
    if (k === 'stakes') C.d45stakes = true;
    try { SFX.play('pick'); } catch (e) {}
    saveMeta(); try { refreshUI(); } catch (e) {} try { renderPanel(); } catch (e) {}
  };

  /* ---- the day screen ------------------------------------------------------------- */
  D.greyed = id => fill((W().morning || {}).greyed || 'Night {n}', {n: D.OPEN[id]});
  D.dayHTML = function(h){
    const C = C_();
    // the column bar label
    h = h.replace(`<b>Column Strength ${C.column}</b>`, `<b id="d45-col">${E(D.colLabel(C.column))}</b>`);
    // actions not open yet read "Night N" and are dead
    for (const id of Object.keys(D.OPEN)) if (D.locked(id)){
      h = h.replace(new RegExp(`<button[^>]*onclick="workOrder\\('${id}'\\)">Act</button>`), `<button disabled data-d45lock="${id}">${E(D.greyed(id))}</button>`);
    }
    if (D.locked('craft')) h = h.replace(/<button[^>]*onclick="openCamp\(\)">Craft<\/button>/, `<button disabled data-d45lock="craft">${E(D.greyed('craft'))}</button>`);
    if (D.locked('camps')) h = h.replace(/<button([^>]*)onclick="CP\(\)\.formation='(woodland|square)'[^"]*">[^<]*<\/button>/g, `<button disabled data-d45lock="camps">${E(D.greyed('camps'))}</button>`);
    // the Recruit nudge after a wrecked night
    if (C.d45m && C.d45m.nudge && !D.locked('recruit')) h = h.replace(/<button([^>]*)onclick="workOrder\('recruit'\)">Act<\/button>/, `<button class="gold" data-d45nudge="1"$1onclick="workOrder('recruit')">Act</button>`);
    // Night 1: NIGHTFALL waits for Forage or Scout
    if (D.dayGate()){
      const goal = T.text('day').gate || 'CHOOSE: FORAGE OR SCOUT';
      h = h.replace(/<button class="btn gold" onclick="launchNight\(\)">/, `<div class="desc" id="d45-goal" style="color:#8a6a10;font-weight:bold;text-align:left">${E(goal)}</div><button class="btn gold" disabled data-d45gate="day" onclick="launchNight()">`);
    }
    return h;
  };
  D.dayGate = () => { const C = C_(); return !!(D.on() && T.is('day') && C && C.part === 'road' && C.night === 1 && C.orders > 0 && !(C.d45did || []).some(x => x === 'forage' || x === 'scout')); };
  { const f = storyDayHTML; storyDayHTML = function(){
      try {
        const k = D.card();   // a card takes the whole panel
        if (k === 'muster') return D.musterHTML();
        if (k === 'morning') return D.morningHTML();
        if (k === 'fit') return D.fitHTML();
        if (k === 'stakes') return D.stakesHTML();
      } catch (e) { console.warn('D45 card', e); }
      const h = f.apply(this, arguments);
      try {
        const C = C_(); if (!D.road() || !C || C.part !== 'road') return h;
        if (C.night === 1 && !D.seen('column')) later(D.night1);
        return D.dayHTML(C.night === NIGHTS.length ? D.noIlvaryn(h) : h);
      } catch (e) { console.warn('D45 day', e); return h; } }; }
  // Night 1 lessons on the day screen: column, then day (beside Forage); night comes in the fight
  D.night1 = function(){
    if (!D.on() || D.seen('column') || !byId('d45-col')) return;
    D.lesson('column', {el: byId('d45-col')});
    const fb = document.querySelector('#camp-panel button[onclick="workOrder(\'forage\')"]') || document.querySelector('#table-inner .wcard[onclick="boardDo(\'forage\')"]');
    D.lesson('day', {el: fb || byId('d45-goal')});
    logLessons();
  };
  { const f = launchNight; launchNight = function(){
      try {
        const C = C_();
        if (D.road() && C && C.part === 'road'){
          if (D.card() || D.dayGate()) return SFX.play('nope');
          C.d45snap = {night: C.night, column: C.column, supply: C.supply, wagon: C.wagonHp, dead: (META.memorial || []).length, gold: META.treasury | 0, band: (C.hired && C.band30 && C.band30.id) || null};
        }
      } catch (e) { console.warn('D45 snap', e); }
      return f.apply(this, arguments); }; }

  /* ---- K57: the same cards, locks and gate on the Ledger Wagon table (feel.js renderWorkBoard) --
     In play the road day opens the board, not storyDayHTML. A card takes the table; locked actions
     are stamped "Night N"; NIGHTFALL waits on Night 1; the column chip reads families. */
  D.boardOpen = () => { const s = byId('screen-table'); return !!(s && !s.classList.contains('hidden')); };
  D.CARDS = {muster: () => D.musterHTML(), morning: () => D.morningHTML(), fit: () => D.fitHTML(), stakes: () => D.stakesHTML()};
  D.boardCard = (root, k) => { root.innerHTML = `<div class="scroll letter" id="d45-board-card" style="max-width:640px;margin:28px auto;padding:14px 18px;text-align:center">${D.CARDS[k]()}</div>`; };
  // UX K57 replay: the story bell (#bell85) is dead while a card is up or the Night 1 gate holds.
  // A card: the bell steps aside (no dead button over the card's rod). The gate: the bell dims and carries the gate line.
  D.bell = function(why){
    const b = byId('bell85'), scr = byId('screen-table'); if (!b) return;
    if (why === 'card'){ b.style.display = 'none'; if (scr) scr.classList.remove('has-bell85'); return; }
    if (why === 'gate'){ b.disabled = true; b.classList.remove('ready'); b.style.opacity = '.6'; b.setAttribute('data-d45gate', 'day');
      const sm = b.querySelector('small'); if (sm) sm.textContent = T.text('day').gate || 'CHOOSE: FORAGE OR SCOUT'; }
    // UX K59: story.js redraws the bell's words but not these, so undo the gate on every board draw that has no gate
    if (why === 'open' && b.hasAttribute('data-d45gate')){ b.disabled = false; b.style.opacity = ''; b.removeAttribute('data-d45gate'); }
  };
  D.boardLock = function(root){
    const C = C_(); if (root === byId('table-inner')) D.bell('open');
    const stamp = (el, id) => { el.classList.add('off'); el.removeAttribute('onclick'); el.setAttribute('data-d45lock', id);
      el.querySelectorAll('.wstamp').forEach(x => x.remove()); el.insertAdjacentHTML('beforeend', `<div class="wstamp">${E(D.greyed(id))}</div>`); };
    // Planner replay 1, 2: a card is known by its title too, since an unusable card (Tend: nobody hurt; Pray: no Cleric)
    // has no onclick, and every camp card is a camp (the Laager is lit on any ground and was CHOSEN on Night 1)
    const BY = {Forage: 'forage', Scout: 'scout', Recruit: 'recruit', Tend: 'tend', Pray: 'pray', 'Recruit a band': 'parley', Parley: 'parley', 'Repair the Wagon': 'repair', Craft: 'craft'};
    for (const el of root.querySelectorAll('.wcard')){
      const a = el.getAttribute('onclick') || '', wt = el.querySelector('.wt'), t = wt ? wt.textContent.trim() : '';
      const id = (a.match(/boardDo\('(\w+)'\)/) || [])[1] || BY[t], camp = /CP\(\)\.formation=/.test(a) || !!el.closest('.wcards.one');
      if (camp){ if (D.locked('camps')){ el.classList.remove('chosen'); stamp(el, 'camps'); } }
      else if (id && D.locked(id)) stamp(el, id);
      else if (/openCamp\(\)/.test(a) && D.locked('craft')) stamp(el, 'craft');
      else if (id === 'recruit' && C.d45m && C.d45m.nudge){ el.setAttribute('data-d45nudge', '1'); el.style.boxShadow = '0 0 0 3px #d4af37'; }
    }
    // Planner replay 3: the old Sergeant's Advice (Repair, Tend...) talks about actions that are shut before Night 4
    if (D.on() && C && C.part === 'road' && C.night < D.OPEN.repair) root.querySelectorAll('.scroll.coach').forEach(x => x.remove());
    // K65: the bare '1' on a card is one day action; say so
    try { const oi = ICON.order(); root.querySelectorAll('.wc .chip').forEach(c => { const im = c.querySelector('img'); if (!im || c.querySelector('.d45-act')) return; const src = im.getAttribute('src');
        if (src === oi) c.insertAdjacentHTML('beforeend', `<span class="d45-act" style="font-size:14px;margin-left:2px"> action</span>`);
        else if (src === ICON.supply()) c.insertAdjacentHTML('beforeend', `<span class="d45-act" style="font-size:14px;margin-left:2px"> Supply</span>`); }); } catch (e) {}   // K67: the '1' on Repair is a Supply
    // the column chip: families
    const res = root.querySelector('.table-head .res');
    if (res && !res.title) res.title = D.colLabel(C.column);   // UX R8-1: the label leaves the header row (it was a 12 px monospace .stat that squeezed the title); the chip's hover carries it
    // Night 1: NIGHTFALL waits for Forage or Scout
    const seal = root.querySelector('.sealbtn[onclick="launchNight()"]');
    if (seal && D.dayGate() && !root.querySelector('#d45-goal')){
      seal.disabled = true; seal.setAttribute('data-d45gate', 'day'); seal.style.opacity = '.5'; D.bell('gate');
      seal.insertAdjacentHTML('beforebegin', `<div class="desc" id="d45-goal" style="color:#8a6a10;font-weight:bold;text-align:center">${E(T.text('day').gate || 'CHOOSE: FORAGE OR SCOUT')}</div>`);
    }
    if (C.night === NIGHTS.length) root.innerHTML = D.noIlvaryn(root.innerHTML);
  };
  if (typeof renderWorkBoard === 'function'){ const f = renderWorkBoard; renderWorkBoard = function(){
      const r = f.apply(this, arguments);
      try {
        const C = C_(), root = byId('table-inner');
        if (D.road() && C && C.part === 'road' && root){
          const k = D.card();
          if (k){ D.boardCard(root, k); D.bell('card'); }
          else { D.boardLock(root); if (C.night === 1 && !D.seen('column')) later(D.night1); }
        }
      } catch (e) { console.warn('D45 board', e); }
      return r; }; }
  // the card buttons and pickSlot redraw the panel; redraw the table too when it is up
  { const f = D.close; D.close = function(){ const r = f.apply(this, arguments); try { if (D.boardOpen()) renderWorkBoard(); } catch (e) {} return r; }; }
  // K65: there is no camp on the road; the report's last button goes back to the wagons
  if (typeof renderDebrief === 'function'){ const f = renderDebrief; renderDebrief = function(){ const r = f.apply(this, arguments);
      try { const C = C_(); if (D.road() && C && C.part === 'road'){ const el = byId('debrief-inner'); if (el) for (const x of el.querySelectorAll('button')) if (/^RETURN TO CAMP/.test(x.textContent)) x.firstChild.nodeValue = 'BACK TO THE WAGONS'; } } catch (e) {}   /* P23-BUG-5: the kept count rides in a span after the words */
      return r; }; }
  if (typeof pickSlot === 'function'){ const f = pickSlot; pickSlot = function(k){ try { const p = (C_() || {}).slotPick || []; D.fitFull = D.road() && !p.includes(k) && p.length >= 3; } catch (e) {} const r = f.apply(this, arguments); try { if (D.boardOpen() && D.card() === 'fit') renderWorkBoard(); } catch (e) {} return r; }; }

  /* ---- day actions: locked ones refuse, the roll line, the opened log -------------- */
  D.lastRoll = null;
  // Planner replay 5: the die face too ({face} in opens.roll), caught from attackDie while a Work Order rolls
  let faceCap = null;
  if (typeof attackDie === 'function'){ const f = attackDie; attackDie = function(){ const x = f.apply(this, arguments); if (faceCap && x) faceCap.face = x.face; return x; }; }
  { const f = cpRoll; cpRoll = function(skill, diff){ const was = faceCap, cap = faceCap = {face: null}; let r;
      try { r = f.apply(this, arguments); } finally { faceCap = was; }
      D.lastRoll = {a: skill, b: diff, r, face: cap.face}; return r; }; }
  // the stat is read from the skill the order rolled (Personality, or bestSkill's Ranged when that is higher)
  D.statName = a => { try { const s = leaderStats(META.leader); return a === s.per ? 'Personality' : a === s.ranged ? 'Ranged' : 'Personality'; } catch (e) { return 'Personality'; } };
  D.rollLine = (id, R) => { let t = (W().opens || {}).roll || '{stat} {a}: rolled {face} against {b}, {result}';
    if (R.face == null) t = t.replace(/:? rolled \{face\}/, '');
    return fill(t, {stat: R.stat || D.statName(R.a), a: R.a, b: R.b, face: R.face, result: D.K.rollWords[R.r] || R.r}); };
  D.tapNote = function(rect, html){
    if (!rect || !html) return; const old = byId('d45-tap'); if (old) old.remove();
    const d = document.createElement('div'); d.id = 'd45-tap'; d.innerHTML = html;
    const W0 = Math.min(320, window.innerWidth - 20), x = Math.max(10, Math.min(rect.left + rect.width / 2 - W0 / 2, window.innerWidth - W0 - 10)), y = Math.max(10, Math.min(rect.top, window.innerHeight - 120));
    d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${W0}px;box-sizing:border-box;z-index:9500;background:#efe3c8;color:#2a2218;border:2px solid #8a6d3a;border-radius:6px;padding:8px 10px;font:14px Georgia;box-shadow:0 3px 10px #0008;pointer-events:none;transition:opacity .4s`;
    document.body.appendChild(d); setTimeout(() => { d.style.opacity = '0'; }, 3200); setTimeout(() => d.remove(), 3700);
  };
  { const f = workOrder; workOrder = function(id){
      const C = C_(), road = D.road() && C && C.part === 'road';
      if (road && D.locked(id)){ try { SFX.play('nope'); } catch (e) {} return; }
      if (road && D.card()) return SFX.play('nope');
      const o0 = road ? C.orders : 0, n0 = road ? C.log.length : 0, h0 = road ? C.log[0] : null; D.lastRoll = null;
      let tapAt = null; try { const ev = window.event, w = road && ev && ev.target && ev.target.closest && ev.target.closest('.wcard'); if (w) tapAt = w.getBoundingClientRect(); } catch (e) {}
      const r = f.apply(this, arguments);
      try {
        if (road && C.orders < o0){
          (C.d45did = C.d45did || []).push(id);
          const rec = D.rec(); if (rec) rec.opened.push(id);
          // Planner replay 6: the roll goes on the order's own result line (the oldest new line), not on a cost line logged after it
          const grew = C.log.length - n0, kNew = grew > 0 ? grew : h0 == null ? C.log.length : (C.log.indexOf(h0) < 0 ? C.log.length : C.log.indexOf(h0)), at = Math.max(0, kNew - 1);
          if (D.lastRoll && C.log.length && (C.log.length > n0 || C.log[0] !== h0)) C.log[at] += ` <span class="d45-roll" style="color:#6b5a3a">(${E(D.rollLine(id, D.lastRoll))})</span>`;
          if (id === 'parley' && (C.offer30 || []).length) later(D.bandsLesson);
          saveMeta(); try { refreshUI(); } catch (e) {}
          try { const k = Math.max(1, C.log.length - n0); D.tapNote(tapAt, C.log.slice(0, Math.min(k, 2)).reverse().join(' ')); } catch (e) {}   // K65: the answer shows where you tapped, not only in the TODAY log
        }
      } catch (e) { console.warn('D45 order', e); }
      return r; }; }
  if (typeof openCamp === 'function'){ const f = openCamp; openCamp = function(){ const C = C_();
      if (D.road() && C && C.part === 'road' && (D.locked('craft') || D.card())){ try { SFX.play('nope'); } catch (e) {} return; }
      return f.apply(this, arguments); }; }

  /* ---- the morning: what last night cost, the dead, the nudge ------------------------ */
  D.morning = function(C){
    const s = C.d45snap, M = W().morning || {}, m = {night: C.night};
    const quiet = M.quiet || [];
    if (C.night > 1 && F.roadDay(C.night) - F.roadDay(C.night - 1) > 1 && quiet.length){ const u = C.d45qu || (C.d45qu = []); if (u.indexOf(C.night) < 0) u.push(C.night); m.quiet = quiet[u.indexOf(C.night) % quiet.length]; }   /* L14: each quiet morning takes the next line, not one by night number */
    if (s && s.night === C.night - 1){
      // Planner replay 8: a band that marched last night has its own line (morning.afterBand.<band id>.<night>), else the night's line
      const ab = s.band && M.afterBand && M.afterBand[s.band] && M.afterBand[s.band][s.night];
      let at = ab || (M.after || {})[s.night] || ''; if (!C.d45witch && at.indexOf('{witch}') >= 0) at = at.slice(0, at.indexOf('{witch}')).trim();   // Long Road pass 1: no Witch in the squad, no Witch in the morning
      m.after = fill(at, {witch: D.WITCH()}) || null;
      const dc = C.column - s.column, ds = C.supply - s.supply, dw = C.wagonHp - s.wagon;
      m.cost = dc || ds || dw ? fill(M.cost, {col: dc < 0 ? 'lost ' + (-dc) : dc > 0 ? 'grew by ' + dc : 'held', dc: String(C.column), s: ds ? (ds > 0 ? '+' : '') + ds : 'held', w: dw < 0 ? `took ${-dw} damage (${C.wagonHp} / ${C.wagonMax} left)` : C.wagonHp <= 0 ? `still a wreck (0 / ${C.wagonMax})` : 'held'}) : M.costNone;
      m.dead = (META.memorial || []).slice(s.dead).map(x => x.name);
      m.nudge = -dc >= Math.max(1, Math.ceil(s.column * D.K.wrecked));
      m.lost = -dc;
    }
    m.hurt = (META.roster || []).filter(p => p.resting > 0).map(p => p.name);
    C.d45m = m; C.d45did = [];
    if (m.dead && m.dead.length && !D.seen('death')) later(() => D.lesson('death', {vars: {name: m.dead[0]}, el: byId('d45-today')}));
    return m;
  };
  { const f = startRoadDay; startRoadDay = function(){
      // the night's numbers before the column eats
      const C = C_(), road = D.road() && C, pre = road ? {column: C.column, supply: C.supply, wagon: C.wagonHp} : null;
      const r = f.apply(this, arguments);
      try {
        if (road){
          const now = {column: C.column, supply: C.supply, wagon: C.wagonHp};
          Object.assign(C, pre); D.morning(C); Object.assign(C, now);   // the cost line is the night's, not the day's eating
          // L6: the HUD shows the day's count; when the morning changed it, the cost line says so
          if (C.d45m && C.d45m.cost && now.column !== pre.column) C.d45m.cost += ' ' + fill((W().morning || {}).costMorning || 'By morning the column counts {n} families.', {n: String(now.column)});
          const rec = D.rec(); if (rec){ rec.cost = C.d45m.cost || null; rec.dead = C.d45m.dead || []; rec.column = C.column; rec.supply = C.supply; rec.gold = META.treasury | 0; }
        }
      } catch (e) { console.warn('D45 morning', e); }
      try {   // the witch joins on the morning card (D.witchJoins: below); the Mage joins at b7 and Zenif trains her at b8 (PD-38, pd38.js)
        if (D.road() && C && C.part === 'road' && C.d45m){
          const w = D.witchJoins(C);
          if (w){ C.d45m.witch = w; const wi = (META.roster || []).find(p => p && p.f45witch); C.d45m.witchId = wi ? wi.id : null; }
        }
      } catch (e) { console.warn('D45 casters', e); }
      return r; }; }

  /* ---- Night 1 in the field: the night lesson; Night 3: parlay; the retreat opens ---- */
  { const f = startDeployment; startDeployment = function(c){
      const r = f.apply(this, arguments);
      try {
        const C = C_();
        if (D.road() && c && c.obj === 'night'){
          if (c.night === 1) later(() => { D.lesson('night'); logLessons(); });
        }
      } catch (e) { console.warn('D45 field', e); }
      try { if (D.road() && c && c.obj === 'night') later(() => { if (!D.casterLesson('mage', 'MAGE', 'f34caster')) D.casterLesson('witch', 'WITCH', 'f45witch'); }); } catch (e) { console.warn('D45 casters field', e); }   // D.casterLesson: below
      return r; }; }
  // no white flag on the road before Night 3 (the Parley lesson is Night 3's)
  { const f = offerParlay; offerParlay = function(e){
      try {
        const C = C_();
        if (D.on() && C && C.part === 'road' && typeof G !== 'undefined' && G && G.obj === 'night' && (G.contract.night | 0) < 3){ if (e) e.parleyed = true; return; }
      } catch (er) {}
      const r = f.apply(this, arguments);
      try { if (D.road() && C_().part === 'road' && e && PARLAY && PARLAY.e === e) D.lesson('parlay', {el: byId('parlay-inner')}); } catch (er) {}
      return r; }; }
  // Sound the Retreat opens on Night 3
  if (typeof askWithdraw === 'function'){ const f = askWithdraw; askWithdraw = function(){
      try {
        const C = C_();
        if (D.locked('retreat') && typeof G !== 'undefined' && G && G.obj === 'night' && (G.contract.night | 0) < D.OPEN.retreat){
          SFX.play('nope'); if (typeof note === 'function') note(D.K.retreatShut); return;
        }
      } catch (e) {}
      return f.apply(this, arguments); }; }
  // prisoners: the first one taken on the road
  if (typeof commanderGone === 'function'){ const f = commanderGone; commanderGone = function(e, mode){
      const r = f.apply(this, arguments);
      try { if (mode === 'surrender' && D.road() && C_().part === 'road') later(() => D.lesson('prisoners')); } catch (er) {}
      return r; }; }

  /* ---- Night 2: the band terms ------------------------------------------------------- */
  D.bandsLesson = function(){
    if (!D.on()) return;
    const el = document.querySelector('[data-lr34="offer"]');
    D.lesson('bands', {el}); logLessons();
  };
  // the lesson's extra line (W8) after its second line
  { const f = T.text; T.text = function(id, vars){ const t = f.apply(this, arguments);
      try { if (id === 'bands' && D.road() && t && t.lines && (W().bands || {}).lessonAdd && t.lines.indexOf(W().bands.lessonAdd) < 0) t.lines.splice(2, 0, W().bands.lessonAdd); } catch (e) {}
      return t; }; }

  /* ---- slice 2: the casters, the gift, Night 12 ------------------------------------- */
  D.K.witchNight = 4;   // Long Road pass 1: unused now (witchJoins reads the row flag); kept for the old readers
  // presses of each ability key in this fight (the mage and witch gates count her key only)
  { const f = useAbility; useAbility = function(spec){
      const a = typeof G !== 'undefined' && G && G.abil && G.abil[spec], cd0 = a ? a.cd : 1;
      const r = f.apply(this, arguments);
      try { if (a && cd0 <= 0 && a.cd > 0){ G.d45use = G.d45use || {}; G.d45use[spec] = (G.d45use[spec] | 0) + 1; } } catch (e) {}
      return r; }; }
  // an own key (Burning Hands, ABIL33.useOwn) never goes through useAbility: count it when ABIL33.use fires it (checklist N 1)
  if (window.ABIL33 && typeof ABIL33.use === 'function'){ const f = ABIL33.use; ABIL33.use = function(u, opt){
      const r = f.apply(this, arguments);
      try { const id = r && ((opt && opt.id) || ABIL33.lo(u).active), R = id && ABIL33.REG[id];
        if (R && R.own && G){ G.d45use = G.d45use || {}; G.d45use[R.spec] = (G.d45use[R.spec] | 0) + 1; } } catch (e) {}
      return r; }; }
  // the key the bar shows for this caster (ABIL33.keyOf, the squad place), as the 'you' card reads it (checklist N 3)
  D.key = (spec, u) => { try { if (u && window.ABIL33 && G) return ABIL33.keyOf(u); return ABILITIES[spec].key; } catch (e) { return '?'; } };
  // Night 7: the Witch walks in (CAMPAIGN_LINES.cast45.wenna: a placeholder until Narrative names her)
  D.witchCast = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.cast45 && CAMPAIGN_LINES.cast45.wenna) || {name: 'Wenna', race: 'HUMAN', cls: 'OUTCAST'};
  D.WITCH = () => D.witchCast().name || 'The Witch';
  D.witchJoins = function(C){
    const wn = NIGHTS.findIndex(n => n.witch) + 1;   // Long Road pass 1: the night that carries the Witch flag; no such night (Quick), no Witch
    if (!wn || C.night < wn || C.d45witch) return null;
    const X = D.witchCast(), Wl = W().witch || {};
    if (META.roster.length >= rosterCap()){   // L1 [S]: no room: she walks with the column until a place opens; told once
      if (C.d45witchWait) return null;
      C.d45witchWait = true;
      return fill(Wl.noRoom || '{witch} walks with the column tonight. The squad is full; when a place opens, she will take it.', {witch: X.name || 'The Witch'});   // [S] words: Planner (witch.noRoom)
    }
    C.d45witch = true;
    let m; try { m = makeMate(X.race || 'HUMAN', X.cls || 'OUTCAST', 'WITCH', X.name || 'Wenna'); } catch (e) { m = makeMate('HUMAN', 'FREEMAN', 'WITCH', X.name || 'Wenna'); }
    m.sex = 'f'; m.f45witch = true; META.roster.push(m);
    return fill(Wl.joins || '{witch} joins the squad: a Witch.', {witch: m.name});
  };
  D.mage = () => (META.roster || []).find(p => p && p.f34caster);
  // the lessons in the field: mage on her first road night in the squad, then witch; each gates on her key only
  D.casterLesson = function(id, spec, flag){
    if (!D.on() || D.seen(id) || typeof G === 'undefined' || !G) return false;
    const u = (G.squad || []).find(s => s && s.p && s.p[flag] && s.state === 'up'); if (!u) return false;
    const vars = {name: u.p.name, key: D.key(spec, u)}, u0 = (G.d45use || {})[spec] | 0;
    D.lesson(id, {vars, world: u, then(){ T.gate(id, () => ((G.d45use || {})[spec] | 0) > u0, {vars}); }});
    logLessons(); return true;
  };
  // spells: the first time her card is drawn on the road
  { const f = mateCardHTML; mateCardHTML = function(p, extra){
      // L4: a caster's card on the road lists her spells (her join line says they are on her sheet)
      let x = extra;
      try { if (p && (p.f34caster || p.f45witch) && D.road() && window.BOOK33 && window.ABIL33){ const nm = BOOK33.book(p).map(id => BOOK33.name(id)).filter(Boolean); if (nm.length) x = (extra || '') + `<div class="desc" data-d45spells="1"><b>Spells:</b> ${E(nm.join(', '))}</div>`; } } catch (e) {}
      let h = f.call(this, p, x);
      try { if (D.road() && C_().part === 'road' && typeof h === 'string') h = h.replace(/ Drills are bought in the [^.<]*\./, ''); } catch (e) {}   // K67/L4: no Barracks on the road
      try { if (p && p.f34caster && D.on() && C_().part === 'road' && !D.seen('spells')) later(() => { D.lesson('spells', {vars: {name: p.name}}); logLessons(); }); } catch (e) {}
      return h; }; }
  // L4: the roster on the road is the column's, not a camp's: no retiring to staff, no camp training, no Hiring Line (Recruit is a day order)
  if (typeof renderRoster === 'function'){ const f = renderRoster; renderRoster = function(){ const r = f.apply(this, arguments);
      try { const C = C_(), ri = byId('roster-inner'); if (D.road() && C && C.part === 'road' && ri){
        ri.querySelectorAll('button').forEach(b => { if (/^(Retire to camp|Officer training)/.test(b.textContent)) b.remove(); });
        ri.querySelectorAll('.sub').forEach(d => { d.innerHTML = d.innerHTML.replace(/ Train them at camp facilities[^<]*can retire to staff a facility\./, '').replace(/, Tents add 2\)/, ')')
          .replace(/ Officers are Squad Mates[^<]*retire to staff a facility\./, ''); });   // K67/L4: no officer training, Command Tent or Tents on the road
        ri.querySelectorAll('.card.static').forEach(d => { const t = d.querySelector('.ttl'); if (t && t.textContent === 'No officers') d.remove(); });   // K67 leftover: no empty officers card
        ri.querySelectorAll('h2.sec').forEach(h => { h.innerHTML = h.innerHTML.replace(/^Squad Leader and Officers/, 'Squad Leader'); });   // K67 [S] leftover: no officers on the road, so the page and its tab say Squad Leader
        ri.querySelectorAll('.folio-tabs button').forEach(t => { t.textContent = t.textContent.replace(/^(\w+\. )Squad Leader and Officers$/, '$1Squad Leader'); });
        ri.querySelectorAll('.dsrow span').forEach(s => { if (/^\d+ Squad Mates?, 0 officers$/.test(s.textContent)) s.textContent = s.textContent.replace(/, 0 officers$/, ''); });   // nor '0 officers'
        ri.querySelectorAll('.desc').forEach(d => { if (/^Promote an officer to be able to hand over command\.$/.test(d.textContent)) d.remove(); });   // nor the hand-over line
        ri.querySelectorAll('h2.sec').forEach(h => { if (!/^Hiring Line/.test(h.textContent)) return;
          const pg = h.closest('.folio-page');   // fixes16 folios: drop the page and its tab
          if (pg){ const pages = [...ri.querySelectorAll('.folio-page')], i = pages.indexOf(pg), bar = ri.querySelector('.folio-tabs'), b = bar && bar.children[i]; if (b) b.style.display = 'none'; pg.innerHTML = ''; if (b && b.classList.contains('on') && bar.children[0] && bar.children[0] !== b) bar.children[0].click(); }   // keep the folio's indexes: hide the tab, empty the page
          else { const n = h.nextElementSibling; if (n && n.classList.contains('advbox')) n.remove(); h.remove(); } });
      } } catch (e) { console.warn('D45 roster', e); }
      return r; }; }
  // Night 12: the Planner's brief (no Ilvaryn: the Strategos does not show her banner)
  { const f = storyContract; storyContract = function(obj, extra){
      const c = f.apply(this, arguments);
      try { if (obj === 'night' && D.road() && c && c.night === NIGHTS.length && (W().night12 || {}).brief) c.brief = W().night12.brief; } catch (e) {}
      return c; }; }
  D.noIlvaryn = h => typeof h === 'string' ? h.replace(/Strategos Ilvaryn/g, 'a Strategos').replace(/Ilvaryn/g, 'the Strategos') : h;

  /* ---- roadJump(day): a scratch road at that day's night (test aid) ------------------ */
  D.roadJump = function(day){
    let n = 1; for (let i = 1; i <= NIGHTS.length; i++) if (F.roadDay(i) <= day) n = i;
    let C = C_();
    if (!C || !C.f34road){ F.startRoad(); C = C_(); }
    if (C.part === 'retreat'){ if (D.on()) D.toRoad(); else { C.slotPick = Object.keys(WAGON_SLOTS).slice(0, 3); startRoad(); } C = C_(); }
    C.d45muster = true;
    while (C.part === 'road' && C.night < n){ C.d45snap = {night: C.night, column: C.column, supply: C.supply, wagon: C.wagonHp, dead: (META.memorial || []).length, gold: META.treasury | 0, band: (C.hired && C.band30 && C.band30.id) || null}; C.night++; startRoadDay(); try { F.roadDayNews(C, C.night - 1); } catch (e) {} }
    try { refreshUI(); storyOpenMain(); } catch (e) {}
    return {night: C.night, day: F.roadDay(C.night), card: D.card()};
  };

  /* ---- the night report lines go on the day's record -------------------------------- */
  if (typeof storyDebrief === 'function'){ const f = storyDebrief; storyDebrief = function(c, result, lines){
      const r = f.apply(this, arguments);
      try { if (D.road() && c && c.obj === 'night'){ const rec = D.rec(); if (rec) rec.report = (lines || []).map(x => String(x).replace(/<[^>]+>/g, '').trim()).filter(Boolean); } } catch (e) {}
      return r; }; }

  /* R6 (checklist R): the camp hint 'Click buildings, plots and people' showed over the road, the retreat and 'The Column Is Lost',
     where there are no buildings to click. hint81 runs each camp frame (late-fixes.js); after it, the hint is hidden on those parts. */
  D.noHint = (C, story) => !!(story && C && (C.part === 'road' || C.part === 'retreat' || C.part === 'lost'));
  if (typeof hint81 === 'function'){ const f = hint81; D._hint = hint81 = function(){
      const r = f.apply(this, arguments);
      try { const h = byId('camp-hint'); if (h) h.classList.toggle('d45-nohint', D.noHint(C_(), typeof inStoryNow === 'function' && inStoryNow())); } catch (e) {}
      return r; };
    const st = document.createElement('style'); st.textContent = '#camp-hint.d45-nohint{display:none!important}'; document.head.appendChild(st); }

  // F34's own self-test drives the day screen and the orders as they were before these cards: no cards, nothing locked while it runs
  D.off = false;
  { const f = F.selfTest; F.selfTest = function(){ const o = D.off, lo = D.locked; D.off = true; D.locked = () => false; try { return f.apply(this, arguments); } finally { D.off = o; D.locked = lo; } }; }

  /* ---- self-test: R45.selfTest() (stubs; nothing saved) ------------------------------ */
  const R = window.R45 = {};
  R.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const g = n => { try { return eval(n); } catch (e) { return undefined; } };
    const sv = {META: META, G: g('G'), save: saveMeta, ref: g('refreshUI'), rp: g('renderPanel'), rt: g('renderTitle'), road: F.roadOn, les: T.lesson, lon: T.lessonsOn, SK: SAVE_KEY, later: null, N: NIGHTS.slice(), AS: ASSAULTS.slice(), sfx: SFX.play, log: F.roadLog.slice(), shown: D.shown.slice(), note: g('note')};
    const shown = [];
    try {
      SAVE_KEY = '__r45'; META = freshMeta(); G = null;
      saveMeta = () => {}; refreshUI = () => {}; renderPanel = () => {}; renderTitle = () => {}; SFX.play = () => {};
      F.roadOn = () => !!(META.cp && META.cp.f34road); T.lessonsOn = () => true;
      T.lesson = (id, o) => { shown.push(id); T.st().done[id] = true; if (o && o.then) o.then(true); return true; };
      META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); setChronicle(true);
      const hal = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Hal'); hal.f34 = 'hal'; hal.resting = 2;
      const pin = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Pinch'); pin.f34 = 'pinch';
      META.roster = [hal, pin]; META.memorial = [{name: 'Old Brann'}];
      META.cp = {part: 'retreat', f34road: true, full: true, siegeWon: false, supply: 8, aux: [], log: [], st: {}, district: {}, fort: {}, fallback: true};
      // b11
      let h = retreatHTML();
      ok('b11: the retreat card has no fittings pick', h.indexOf('Fit the Ledger Wagon') < 0 && /D45\.toRoad/.test(h));
      ok('b11: resting mates rejoin on Day 1', h.indexOf('Hal is hurt') >= 0 || h.indexOf(E(fill(W().b11.rejoin, {names: 'Hal', verb: 'is'}))) >= 0);
      D.toRoad(); const C = META.cp;
      ok('b11: resting mates rejoin on Day 1 (in the squad)', hal.resting === 0 && C.part === 'road' && C.night === 1);
      ok('b11: Act III dead named, death lesson not fired', h.indexOf('Old Brann') >= 0 && shown.indexOf('death') < 0);
      ok('b11: the column label', D.colLabel(15) === 'Your stretch of the column: 15 families');
      ok('b11: no fittings on the road until Night 4', (C.slots || []).length === 0);
      // the floor recruit
      { const m0 = META.roster; META.roster = []; const C0 = META.cp; META.cp = {part: 'retreat', f34road: true, aux: [], log: [], st: {}, district: {}, fort: {}, siegeWon: false};
        const t = D.b11().join(' '); const n0 = META.roster.length; D.toRoad();
        ok('b11: floor recruit when both named mates are lost', t.indexOf('freed captives') >= 0 && META.roster.length === n0 + 1 && META.roster[META.roster.length - 1].d45floor);
        META.roster = m0; META.cp = C0; }
      // muster
      ok('muster: shown once; six company lines while it has an intro, none once the ND cuts it (P23-VOICE F20)', D.card() === 'muster' && (D.musterHTML().match(/data-d45co=/g) || []).length === ((W().muster || {}).intro ? 6 : 0) && D.musterHTML().includes(E((W().muster || {}).button || 'MARCH EAST')));
      { const Mu = W().muster; if (Mu){ const i0 = Mu.intro, c0 = Mu.cayde; try { Mu.intro = ''; Mu.cayde = ['one <x>', 'two', 'three']; const h = D.musterHTML();   // P23-VOICE F20
          const b = E(Mu.button || 'MARCH EAST'); Mu.cayde = 'solo'; const h1 = D.musterHTML(); Mu.intro = 'intro <i>'; Mu.cayde = ['one']; const h2 = D.musterHTML();   // gate M7
          ok('P23-VOICE F20: an empty muster intro drops the company rows; every Cayde line in one box, escaped, the name only under the face, no "Cayde:" or quote marks; one string works; a non-empty intro keeps the six rows', !/data-d45co=/.test(h) && (h.match(/data-d45cay=/g) || []).length === 1 && /one &lt;x&gt;/.test(h) && /three/.test(h) && !/Cayde: /.test(h) && !/[“”]/.test(h) && /data-d45cayn="1"[^>]*>Cayde</.test(h) && h.includes(b) && /<p[^>]*>solo<\/p>/.test(h1) && (h2.match(/data-d45co=/g) || []).length === Object.keys(Mu.companies || {}).length && h2.includes('intro &lt;i&gt;') && h2.includes(b));
        } finally { Mu.intro = i0; Mu.cayde = c0; } } }
      D.close('muster'); ok('muster: six lines, once (closed stays closed)', D.card() === 'morning');
      // morning
      ok('morning: Night 1 card first, TODAY', storyDayHTML().indexOf(E(W().morning.button)) >= 0 && /Night 1 of 7/.test(storyDayHTML()));
      D.close('morning'); ok('morning: TODAY cleared', D.card() === null && C.orders === 3 && !(C.d45did || []).length);
      // greyed actions, Night 1
      h = storyDayHTML();
      ok('opens: greyed until its night', /data-d45lock="parley"[^>]*>Night 2</.test(h) && /data-d45lock="tend"[^>]*>Night 4</.test(h) && /data-d45lock="craft"/.test(h) && h.indexOf(`workOrder('forage')`) >= 0);
      const o0 = C.orders; workOrder('parley'); ok('opens: greyed until its night (no effect)', C.orders === o0);
      ok('b11: the column label (on the day screen)', h.indexOf('Your stretch of the column:') >= 0);
      ok('N1: day gate waits for Forage or Scout', /data-d45gate="day"/.test(h) && D.dayGate());
      // K57: the Ledger Wagon table gets the same locks, label and gate
      { const R = document.createElement('div');
        R.innerHTML = `<div class="table-head"><div class="res"><span class="chip">17</span></div></div><div class="wcard" onclick="boardDo('forage')"></div><div class="wcard" onclick="boardDo('parley')"></div><div class="wcard" onclick="openCamp()"></div><button class="sealbtn big" onclick="launchNight()">N</button>`;
        D.boardLock(R); const wc = R.querySelectorAll('.wcard'), sl = R.querySelector('.sealbtn');
        ok('K57: board locks, column label, Night 1 gate', wc[0].getAttribute('onclick') && wc[1].getAttribute('data-d45lock') === 'parley' && !wc[1].getAttribute('onclick') && /Night 2/.test(wc[1].textContent) && wc[2].getAttribute('data-d45lock') === 'craft' && /Your stretch of the column/.test(R.querySelector('.res').title) && sl.disabled && !!R.querySelector('#d45-goal'));
        C.d45muster = false; D.boardCard(R, D.card()); ok('K57: a card takes the table', !!R.querySelector('#d45-muster')); C.d45muster = true;
        // UX K57 replay: the bell dims with the gate line, and steps aside for a card
        const had = byId('bell85'), bb = had || document.createElement('button'); if (!had){ bb.id = 'bell85'; bb.innerHTML = 'N<small>3 of 3 actions left</small>'; document.body.appendChild(bb); }
        const d0 = bb.disabled, s0 = bb.style.display, txt = bb.innerHTML;
        D.bell('gate'); const g1 = bb.disabled && /FORAGE OR SCOUT|Forage|Scout/i.test(bb.textContent);
        D.bell('card'); const g2 = bb.style.display === 'none';
        D.bell('gate'); D.bell('open'); const g3 = !bb.disabled && !bb.style.opacity && !bb.hasAttribute('data-d45gate');
        if (had){ bb.disabled = d0; bb.style.display = s0; bb.innerHTML = txt; bb.style.opacity = ''; bb.removeAttribute('data-d45gate'); } else bb.remove();
        ok('K57: the bell dims with the gate line, steps aside for a card', g1 && g2);
        ok('K59: the bell comes back on once the gate opens', g3);
        // Planner replay 1-3: Tend with no onclick, the Laager CHOSEN, the Sergeant's Advice
        const Q = document.createElement('div');
        Q.innerHTML = `<div class="table-head"><div class="res"><span class="chip">17</span></div></div><div class="scroll letter coach">Repair</div><div class="wcards"><div class="wcard off"><div class="wt">Tend</div><div class="wstamp">Nobody hurt</div></div></div><div class="wcards one"><div class="wcard chosen" onclick="CP().formation='laager'"><div class="wt">Wagon Laager</div><div class="wstamp good">Chosen</div></div></div>`;
        D.boardLock(Q); const qc = Q.querySelectorAll('.wcard');
        ok('Replay 1-3: Tend stamped Night 4, camps stamped, no Sergeant before Night 4', qc[0].getAttribute('data-d45lock') === 'tend' && /Night 4/.test(qc[0].textContent) && qc[1].getAttribute('data-d45lock') === 'camps' && !/Chosen/.test(qc[1].textContent) && !Q.querySelector('.coach')); }
      C.d45did = ['scout']; ok('N1: day gate waits for Forage or Scout (opens after)', !D.dayGate() && !/data-d45gate/.test(storyDayHTML())); C.d45did = [];
      // N1 lesson order (column and day on the day screen, night in the field)
      { const s0 = C.d45seen; C.d45seen = {}; shown.length = 0; D.lesson('column'); D.lesson('day'); D.lesson('night'); D.lesson('column');
        ok('N1: lesson order', shown.join(',') === 'column,day,night'); C.d45seen = Object.assign(s0 || {}, C.d45seen); }
      // the roll line
      ok('opens.roll format: the die face', D.rollLine('recruit', {a: 4, b: 5, r: 'partial', face: 4}) === 'Personality 4: rolled 4 against 5, Partial Success', D.rollLine('recruit', {a: 4, b: 5, r: 'partial', face: 4}));
      ok('opens.roll: no face, no "rolled ?"', D.rollLine('recruit', {a: 4, b: 5, r: 'partial'}) === 'Personality 4 against 5, Partial Success', D.rollLine('recruit', {a: 4, b: 5, r: 'partial'}));
      // lessons off: everything open
      T.lessonsOn = () => false; h = storyDayHTML();
      ok('lessons off: actions still open', !/data-d45lock/.test(h) && !D.dayGate() && h.indexOf(`workOrder('parley')`) >= 0);
      { const R0 = META.cp; META.cp = {part: 'retreat', f34road: true, aux: [], log: [], st: {}, district: {}, fort: {}, siegeWon: false};
        ok('lessons off: the old fittings pick on the retreat card', retreatHTML().indexOf('Fit the Ledger Wagon') >= 0); META.cp = R0; }
      T.lessonsOn = () => true;
      // a wrecked night: the cost, the nudge, the first road death
      C.d45snap = {night: 1, column: 16, supply: 8, wagon: 100, dead: META.memorial.length, gold: 0};
      C.column = 11; META.memorial.push({name: 'Pinch'}); C.night = 2; shown.length = 0;
      { const lt = later; D.morning(C); }
      ok('wrecked night: Recruit lit', C.d45m.nudge && C.d45m.lost === 5);
      C.d45morning = 2; h = storyDayHTML();
      ok('wrecked night: Recruit lit (gold button)', /data-d45nudge="1"/.test(h));
      ok('morning: the story line for the night fought', C.d45m.after === W().morning.after[1] && /lost 5/.test(C.d45m.cost));
      // N2 bands words
      ok('N2: bands terms words', /quarter of the gold/.test(W().bands.terms) && (!window.LR34 || (LR34.offerHTML({offer30: ['rowan']}).indexOf(E(W().bands.button)) >= 0 && LR34.offerHTML({offer30: ['rowan']}).indexOf('half the loot') < 0)));
      ok('bands: 25% gold, half Supply', !!(window.SHARE34 && SHARE34.rate.band === 0.25 && window.LR34 && LR34.K.supplyShare === 0.5));
      const tb = T.text('bands'); ok('N2: bands lesson adds the salvage line', tb.lines[2] === W().bands.lessonAdd);
      // N3: parlay off before Night 3
      { const P0 = g('PARLAY'), ov = document.getElementById('overlay-parlay'), was = ov && ov.className;
        G = {obj: 'night', contract: {night: 2}, paused: false}; let called = false; const rp = renderParlay; renderParlay = () => { called = true; };
        try { offerParlay({k: 'vane'}); ok('N3: Parley off before Night 3', !called); G.contract.night = 3; offerParlay({k: 'vane'}); ok('N3: Parley on at Night 3', called); }
        finally { renderParlay = rp; PARLAY = P0; if (ov) ov.className = was; G = null; } }
      // N4: the fittings, then the stakes
      C.night = 4; C.d45morning = 4; C.slotPick = [];
      ok("N4: Cayde's three pre-picked", D.card() === 'fit' && (D.fitHTML().match(/data-d45take="1"/g) || []).length === 3 && JSON.stringify(W().fittings.why && Object.keys(W().fittings.why)) === JSON.stringify(['infirmary', 'larder', 'armoury']));
      D.close('fit'); ok('N4: stakes after fittings', D.card() === 'stakes' && C.slots.length === 3 && /What a night costs/.test(storyDayHTML()));
      D.close('stakes'); ok('N4: the day screen after the stakes', D.card() === null && !/data-d45lock="tend"/.test(storyDayHTML()));
      // the Night 1 gate opens when the orders run out (three Recruits)
      { const n0 = C.night, o0 = C.orders, d0 = C.d45did; C.night = 1; C.d45did = ['recruit', 'recruit', 'recruit']; C.orders = 0;
        ok('N1: day gate opens when the orders run out', !D.dayGate()); C.night = n0; C.orders = o0; C.d45did = d0; }
      // the floor recruit with lessons off too
      { const m0 = META.roster, C0 = META.cp; META.roster = []; META.cp = {part: 'retreat', f34road: true, aux: [], log: [], st: {}, district: {}, fort: {}, siegeWon: false};
        T.lessonsOn = () => false; META.cp.slotPick = ['infirmary', 'larder', 'armoury']; startRoad(); T.lessonsOn = () => true;
        ok('b11: floor recruit with lessons off', META.roster.length === 1 && META.roster[0].d45floor);
        META.roster = m0; META.cp = C0; }
      // the casters
      const mg = makeMate('HUMAN', 'FREEMAN', 'MAGE', 'Ysolde'); mg.f34caster = true; META.roster.push(mg);
      let gate = null; const tg = T.gate; T.gate = (id, test) => { gate = {id, test}; return {}; };
      try {
        G = {squad: [{p: mg, state: 'up'}, {p: hal, state: 'up'}], abil: {MAGE: {cd: 0}, SOLDIER: {cd: 0}, WITCH: {cd: 0}}, d45use: {}};
        D.casterLesson('mage', 'MAGE', 'f34caster');
        G.d45use.SOLDIER = 1; const a = gate && gate.id === 'mage' && !gate.test();
        G.d45use.MAGE = 1; ok('N5: mage gate on her key only', a && gate.test() && shown.includes('mage'));
        C.night = 4; C.d45witch = false; const wl = D.witchJoins(C), wi = META.roster.find(p => p.f45witch);
        G.squad.push({p: wi, state: 'up'}); gate = null; D.casterLesson('witch', 'WITCH', 'f45witch');
        G.d45use.MAGE = 2; const b = gate && gate.id === 'witch' && !gate.test(); G.d45use.WITCH = 1;
        ok('N4: witch gate', !!wi && wi.spec === 'WITCH' && wl.indexOf(wi.name) >= 0 && b && gate.test());
        // L1: a full squad holds the Witch until a place opens, and says so once
        { const r0 = META.roster.slice(); META.roster = META.roster.filter(p => !p.f45witch); C.d45witch = false; C.d45witchWait = false;
          const cap = rosterCap(); while (META.roster.length < cap) META.roster.push(makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Filler'));
          const w1 = D.witchJoins(C), w2 = D.witchJoins(C), held = !META.roster.some(p => p.f45witch) && !!w1 && w2 === null;
          META.roster.pop(); const w3 = D.witchJoins(C);
          ok('L1: no room holds the Witch, told once, joins when a place opens', held && META.roster.some(p => p.f45witch) && !!w3 && C.d45witch);
          META.roster = r0; }
      } finally { T.gate = tg; G = null; }
      ok('R6: no camp click hint on the road, the retreat or the lost page; it stays in camp and outside the Founding', D.noHint({part: 'road'}, true) && D.noHint({part: 'lost'}, true) && D.noHint({part: 'retreat'}, true) && !D.noHint({part: 'siege'}, true) && !D.noHint({part: 'road'}, false) && (typeof hint81 !== 'function' || hint81 === D._hint));
      // the last night
      { const c12 = storyContract('night', {night: NIGHTS.length}); C.night = NIGHTS.length; C.d45morning = C.night; C.d45fit = C.d45stakes = true;
        ok('N12: no Ilvaryn', c12.brief === W().night12.brief && !/Ilvaryn/.test(c12.brief) && !/Ilvaryn/.test(storyDayHTML())); }
    } catch (e) { ok('no throw: ' + e.message, false, e.stack); }
    finally {
      META = sv.META; G = sv.G; saveMeta = sv.save; refreshUI = sv.ref; renderPanel = sv.rp; renderTitle = sv.rt; F.roadOn = sv.road; T.lesson = sv.les; T.lessonsOn = sv.lon;
      SAVE_KEY = sv.SK; SFX.play = sv.sfx; F.roadLog.length = 0; F.roadLog.push(...sv.log); D.shown = sv.shown;
      NIGHTS.length = 0; NIGHTS.push(...sv.N); ASSAULTS.length = 0; ASSAULTS.push(...sv.AS);
    }
    return {rows};
  };
})();
