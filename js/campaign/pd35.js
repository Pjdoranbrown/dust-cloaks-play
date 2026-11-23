/* ============================================================================
   INDEX PD35 - the Long Road outcomes (Patrick PD-35, 16 Nov 2026; spec audits/f45-pd-specs.md section 1).
   Lead Programmer, 2026-11-16. No path goes back to Act I.
     1a Win: the column's survivors (CARAVAN30 META.folk30) are cut to one per K.per families, at most
        K.max; they stand at the camp as figures and wait on every Hiring Line (not once a season) as
        Freeman recruits at K.fee of the fee until hired. Kalloon card: one line under the grant.
     1b Loss: 'cplost' is The Parley (the Leader's Personality die against a Tier K.tier Morale die,
        the field Parley's roll). Good (wins by K.good or more): +K.bonus gp. Even: Treasury 0. Bad:
        every mate starts resting one job, Treasury 200, a Chronicle line. Then FOUND THE CHAPTER: the
        hand-over as a win (foundAfterStory(0)).
     K78 (UX): no close x on the Parley (THE ROAD brings it back); the stakes line before PARLEY; the cards say
        "{name} rolls {n}"; one Kalloon line by band after the result; the Hiring Line keeps K.strangers stranger slot.
     META.f45end = {kind: 'win' | 'good' | 'even' | 'bad', n, mine, theirs}; the K45 carried card
     (the first main board) adds one Cayde line by kind.
   Words: CAMPAIGN_LINES.pd35 overrides the defaults below (Planner's [T] words from the spec).
   No leader at all: the old card stays; nobody is left to parley.
   Q48 (Patrick): a road-night wipe (founding-story.js wipe48) also lands here, with C.wiped48 and the bodyWipe words.
   Self-test: PD35.selfTest() (stubs; META and saveMeta put back).
   ============================================================================ */
(function(){
  'use strict';
  const P = window.PD35 = {};
  P.K = {per: 4, max: 4, fee: 0.5, tier: 2, good: 3, bonus: 100, strangers: 1};   // [S]
  const DEF = {
    stay: '{n} of the column stay with the Chapter. They will sign on for less than a stranger would.',
    tag: 'Long Road survivor: walked the road with you. Signs on at half the fee.',
    head: 'The Column Is Lost',
    body: 'The last of the refugees are ridden down short of the ford. The Frost-Vault captain rides up under a white rag. He wants the elves; he will talk about the rest.',
    bodyWipe: 'The squad is down in the mud and the column scatters into the trees. By morning the Frost-Vault holds the road. Their captain rides up under a white rag. He wants the elves; he will talk about the rest.',   // Q48: the whole squad went down
    button: 'PARLEY', onward: 'ON TO THE FOUNDING',
    stakes: 'Your Leader rolls Personality against the captain’s Morale. Beat him by 3 or more: you walk, and he pays you to go. Beat or match him: you walk, but the Treasury stays. Roll under him: he takes you as well.',
    rollMine: '{name} rolls {n}', rollTheirs: 'The captain rolls {n}',
    kalloon: {good: 'The company rides on to Artemis\u2019s lands.', even: 'The company walks on to Artemis\u2019s lands.', bad: 'In the spring the ransomed company reaches Artemis\u2019s lands.'},
    good: 'He lets the Dust Cloaks walk, with their arms and their kit. The elves are taken north in chains.',
    goodGold: 'He paid you to go. Nobody will thank you for it.',
    even: 'He lets you walk, but the Treasury wagon stays with him.',
    bad: 'He takes you as well.',
    bad2: 'Eleven weeks later, Lord Artemis and the Empire pay your ransom. The Chapter starts in his debt.',
    chron: 'Ransomed by Lord Artemis.',
    cayde: {win: 'You brought them across. Some of them will fight for us now.', good: 'We walked. I will not pretend I liked the price.',
      even: 'Empty wagon, full company. We have started with less.', bad: 'Artemis paid for us. He will want it back in work, not gold.'}
  };
  const W = () => Object.assign({}, DEF, (window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd35) || {});
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const CV = () => window.CARAVAN30 || null;
  const story = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };

  /* ---- 1a: the survivors ---- */
  P.count = families => Math.min(P.K.max, Math.floor(Math.max(0, families | 0) / P.K.per));
  const cv = CV();
  if (cv){
    { const f = cv.settle; cv.settle = function(list){ return f.call(this, (list || []).slice(0, P.count((list || []).length))); }; }
    cv.poolOpen = () => !!(typeof META !== 'undefined' && META && META.folk30 && META.folk30.length);   // every Hiring Line until hired
    { const f = cv.poolMate; cv.poolMate = function(fk){
        if (!fk.m35){ const m = f.call(this, fk), cls = CLASSES.FREEMAN ? 'FREEMAN' : m.cls;
          fk.m35 = cls === m.cls ? m : Object.assign(makeMate(m.race, cls, m.spec, m.name), {sex: m.sex, id: m.id, folk30: m.folk30}); }
        return JSON.parse(JSON.stringify(fk.m35)); }; }
    const fee = r => Math.round(hireGP(Object.assign({}, r, {hireGP: null})) * P.K.fee);
    /* K85 (UX f48): hireCamp redraws the line (refreshUI) before CARAVAN30 takes the hired survivor out of META.folk30, so the
       redraw put them back over a stranger and they could be hired twice. A survivor already on the roster (m.folk30) leaves
       META.folk30 here, before the line is built. */
    P.prune = function(){
      if (!META.folk30 || !META.folk30.length || !META.roster) return;
      const hired = new Set(META.roster.filter(m => m && m.folk30 != null).map(m => m.folk30));
      if (META.folk30.some(fk => hired.has(fk.id))) META.folk30 = META.folk30.filter(fk => !hired.has(fk.id));
    };
    { const f = hireLine; hireLine = function(){
        try { P.prune(); } catch (e) { console.warn('PD35 prune', e); }
        const H = f.apply(this, arguments);
        try {
          if (!story() && H && H.recruits && META.folk30 && META.folk30.length){
            const on = new Set(H.recruits.filter(r => r && r.folk30).map(r => r.folk30));
            for (const fk of META.folk30){
              if (on.has(fk.id)) continue;
              if (H.recruits.filter(r => r && !r.folk30).length <= P.K.strangers) break;   // K78d: strangers keep a slot
              const at = H.recruits.findIndex(r => r && !r.folk30 && !r.d45of); if (at < 0) break;
              H.recruits[at] = cv.poolMate(fk); on.add(fk.id);
            }
            for (const r of H.recruits) if (r && r.folk30) r.hireGP = fee(r);
          }
        } catch (e) { console.warn('PD35 hire line', e); }
        return H; }; }
    { const f = hiringHTML; hiringHTML = function(){
        let h = f.apply(this, arguments);
        try {
          if (!story()){
            const rs = hireLine().recruits.filter(r => r && r.folk30);
            if (rs.length){
              h = h.replace(/^<div class="desc" style="text-align:left;margin:6px 0">[^<]*<\/div>(?=<div class="desc")/, '');   // CARAVAN30's one-a-season note gives way to the tag
              const re = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              for (const r of rs) h = h.replace(new RegExp('(<b>' + re(esc(r.name)) + '</b>[^]*?<br>)'), `$1<i data-pd35="tag">${E(P.hireLine())}</i><br>`);
            }
          }
        } catch (e) { console.warn('PD35 hiring', e); }
        return h; }; }
  }
  // the survivors stand at the camp until hired
  if (typeof campSync === 'function'){ const f = campSync; campSync = function(){
      const r = f.apply(this, arguments);
      try {
        if (!story() && META.folk30 && META.folk30.length && CV()){
          const keep = new Set();
          for (const fk of META.folk30.slice(0, P.K.max)){
            const id = 'el35' + fk.id; keep.add(id);
            let q = CAMP.people.find(x => x.id === id);
            if (!q){ const s = {x: HUB.fire.x + rnd(-90, 90), y: HUB.fire.y + rnd(30, 70)};
              q = {id, kind: 'elf35', p: CV().poolMate(fk), x: s.x, y: s.y, tx: s.x, ty: s.y, wait: rnd(0, 200), left: false, moving: false, seed: Math.random() * 10 | 0};
              CAMP.people.push(q); }
          }
          CAMP.people = CAMP.people.filter(q => q.kind !== 'elf35' || keep.has(q.id));
        } else if (CAMP.people.some(q => q.kind === 'elf35')) CAMP.people = CAMP.people.filter(q => q.kind !== 'elf35');
      } catch (e) { console.warn('PD35 camp', e); }
      return r; }; }
  if (typeof hireCamp === 'function'){ const f = hireCamp; hireCamp = function(){ const r = f.apply(this, arguments); try { CAMP.dirty = true; } catch (e) {} return r; }; }
  /* K78(e): the panel's tag already says 'Long Road survivor', so its line drops that lead-in */
  /* QA 55d4c61: the Hiring Line has no tag of its own, so its line always leads with 'Long Road survivor:' whichever words are set */
  P.hireLine = () => { const t = P.panelLine(); return 'Long Road survivor: ' + t.charAt(0).toLowerCase() + t.slice(1); };
  P.panelLine = () => { const t = String(W().tag || '').replace(/^\s*Long Road survivor\s*[:,.-]\s*/i, ''); return t.charAt(0).toUpperCase() + t.slice(1); };
  { const f = renderPanel; renderPanel = function(){
      const Q = CAMP.panel;
      if (Q && Q.kind === 'person' && String(Q.id).startsWith('el35')){
        const q = CAMP.people.find(x => x.id === Q.id); if (!q) return closePanel(); const p = q.p;
        $('camp-panel').innerHTML = `<button class="x" onclick="closePanel()">&#215;</button><h2>${E(p.name)}</h2><img class="pimg" src="${portraitURL(p, false)}"><div class="tag">Long Road survivor</div>
          <div class="role">${RACES[p.race].name} ${CLASSES[p.cls].name} ${SPECS[p.spec].name}</div><div class="desc">${E(P.panelLine())}</div>`;
        return;
      }
      // 1b: The Parley replaces the restart
      if (Q && Q.kind === 'cplost' && story() && META.leader){ $('camp-panel').innerHTML = P.parleyHTML(); return; }   // K78a: no close x, as on the other end cards
      return f.apply(this, arguments); }; }
  // the Kalloon card: one line under the grant
  if (typeof endingHTML === 'function'){ const f = endingHTML; endingHTML = function(){
      let h = f.apply(this, arguments);
      try {
        const C = META.cp, n = (C && CV() && CV().applies()) ? P.count(CV().survivors(C).length) : 0;
        if (n && !(window.ARTEMIS23 !== false && ((C.d45hired || []).length >= 2))){ const at = h.indexOf('</p>', h.indexOf('<div class="log"'));   // UX ruling (P23-ARTEMIS): carry + stay at most 3 lines on the ending card, so stay drops when two or more companies sent recruits
         if (at >= 0) h = h.slice(0, at + 4) + `<p data-pd35="stay">${E(W().stay.replace('{n}', n))}</p>` + h.slice(at + 4); }
      } catch (e) { console.warn('PD35 ending', e); }
      return h; }; }
  { const f = foundAfterStory; foundAfterStory = function(){
      try { const C = META.cp; if (C && C.part === 'kalloon') META.f45end = {kind: 'win', n: CV() && CV().applies() ? P.count(CV().survivors(C).length) : 0}; } catch (e) {}
      return f.apply(this, arguments); }; }

  /* ---- 1b: The Parley ---- */
  P.band = (mine, theirs) => mine - theirs >= P.K.good ? 'good' : mine >= theirs ? 'even' : 'bad';
  P.parleyHTML = function(){
    const C = META.cp, w = W(), R = C.parley35;
    let h = `<h2>${E(w.head)}</h2><div class="desc" style="text-align:left">${E(C.wiped48 && w.bodyWipe ? w.bodyWipe : w.body)}</div>`;
    if (!R) return h + `<div class="desc" data-pd35="stakes" style="text-align:left">${E(w.stakes)}</div><button class="btn gold" onclick="PD35.parley()">${E(w.button)}</button>`;
    const txt = R.band === 'good' ? `<p>${E(w.good)}</p><p><b>+${P.K.bonus}gp.</b> ${E(w.goodGold)}</p>` : R.band === 'even' ? `<p>${E(w.even)}</p>` : `<p>${E(w.bad)}</p><p>${E(w.bad2)}</p>`;
    return h + `<div class="row" style="justify-content:flex-start"><div class="card static" style="width:140px"><div class="ttl" style="font-size:20px">${E(w.rollMine.replace('{name}', META.leader.name).replace('{n}', R.mine))}</div><div class="desc">Personality ${R.per}</div></div>
      <div class="card static" style="width:140px"><div class="ttl" style="font-size:20px">${E(w.rollTheirs.replace('{n}', R.theirs))}</div><div class="desc">Morale ${R.mor}</div></div></div>
      <div class="log" data-pd35="${R.band}" style="margin-top:8px">${txt}<p data-pd35="kalloon"><i>${E((w.kalloon || {})[R.band] || '')}</i></p></div><button class="btn gold" onclick="PD35.onward()">${E(w.onward)}</button>`;
  };
  P.parley = function(){
    const C = META.cp; if (!C || C.part !== 'lost' || C.parley35 || !META.leader) return null;
    const per = clampSkill(leaderStats(META.leader).per), mor = commanderMorale(P.K.tier), mine = rollDie(per), theirs = rollDie(mor);
    C.parley35 = {per, mor, mine, theirs, band: P.band(mine, theirs)};
    try { SFX.play(C.parley35.band === 'bad' ? 'nope' : 'win'); } catch (e) {}
    saveMeta(); try { renderPanel(); } catch (e) {}
    return C.parley35;
  };
  P.onward = function(){
    const C = META.cp, R = C && C.parley35; if (!R) return;
    META.f45end = {kind: R.band, mine: R.mine, theirs: R.theirs};
    try { closePanel(); } catch (e) {}
    foundAfterStory(0);
  };
  // the terms land after every other hand-over layer (this file loads last)
  P.terms = function(){
    const T = META.f45end; if (!T) return;
    if (T.kind === 'good') META.treasury += P.K.bonus;
    else if (T.kind === 'even') META.treasury = 0;
    else if (T.kind === 'bad'){
      for (const p of META.roster || []) if (p && !p.dead){ p.resting = Math.max(p.resting || 0, 1); p.restWhy = 'ransom'; }   // K102f: the Barracks says why
      try { chron(); chronAdd('scribe', {text: W().chron}, true); } catch (e) {}
    }
    if (T.kind !== 'win') META.folk30 = [];
    T.done = true;
  };
  { const f = finishFound; finishFound = function(){
      const go = !!(typeof FD !== 'undefined' && FD && FD.fromStory && META.f45end && !META.f45end.done);
      const r = f.apply(this, arguments);
      try { if (go && !META.cp && (typeof FD === 'undefined' || !FD)){ P.terms(); saveMeta(); } } catch (e) { console.warn('PD35 terms', e); }
      return r; }; }
  // the first main board: Cayde's line on the K45 carried card
  if (window.K45 && K45.carriedHTML){ const f = K45.carriedHTML; K45.carriedHTML = function(){
      const h = f.apply(this, arguments), T = META.f45end, l = T && W().cayde[T.kind];
      return l ? h + `<p data-pd35="cayde" style="margin:6px 0 0"><i>Cayde: “${E(l)}”</i></p>` : h; }; }

  /* ---- self-test ---- */
  P.selfTest = function(){
    const rows = [], ok = (name, pass, info) => rows.push({name, pass: !!pass, info: info || ''});
    const keys = ['cp', 'leader', 'roster', 'treasury', 'folk30', 'f45end', 'hireLine', 'chron', 'pool30At'], saved = {};
    for (const k of keys) saved[k] = META[k];
    const sm = saveMeta, rp = renderPanel, fas = foundAfterStory; let founded = null;
    saveMeta = () => {}; renderPanel = () => {}; foundAfterStory = g => { founded = g; };
    try {
      ok('one figure per 4 families, at most 4 (9 gives 2, 3 gives 0, 30 gives 4)', P.count(9) === 2 && P.count(3) === 0 && P.count(30) === 4);
      ok('bands: +3 good, 0 to +2 even, behind bad', P.band(7, 4) === 'good' && P.band(4, 4) === 'even' && P.band(6, 4) === 'even' && P.band(3, 4) === 'bad');
      const L = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Test Leader'); L.level = 1;
      META.leader = L; META.roster = [makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Mate One')]; META.cp = {part: 'lost'};
      const R = P.parley();
      ok('PARLEY rolls once and stores the band', R && ['good', 'even', 'bad'].includes(R.band) && P.parley() === null && META.cp.parley35 === R, JSON.stringify(R));
      ok('the lost page is The Parley, not BEGIN AGAIN', /PD35\.onward/.test(P.parleyHTML()) && !/newStory/.test(P.parleyHTML()));
      ok('K78: the numbers are rolls, the Kalloon line', P.parleyHTML().includes(E(W().rollMine.replace('{name}', L.name).replace('{n}', R.mine))) && /data-pd35="kalloon"/.test(P.parleyHTML()));
      { const C0 = META.cp.parley35; META.cp.parley35 = null; ok('K78: the stakes before PARLEY', /data-pd35="stakes"/.test(P.parleyHTML())); META.cp.parley35 = C0; }
      if (typeof wipe48 === 'function'){ const q = (0, eval)('Q48'), on = q.on, a = {part: 'road', column: 9}, b = {part: 'road', column: 9}, d = {part: 'road', column: 9};
        const r = [wipe48(a, 'fled', true), wipe48(b, 'fled', false)]; q.on = false; r.push(wipe48(d, 'fallen', true)); q.on = on;
        ok('Q48: a road-night wipe (K49 fled) ends the road in the Parley; a plain retreat or Q48 off goes on', r.join() === 'true,false,false' && a.part === 'lost' && a.wiped48 && b.part === 'road' && d.part === 'road', r.join());
        META.cp.wiped48 = true; ok('Q48: the Parley tells of the wipe', P.parleyHTML().includes(E(W().bodyWipe))); delete META.cp.wiped48; }
      P.onward(); ok('ON TO KALLOON: the hand-over with no grant, the result kept', founded === 0 && META.f45end.kind === R.band);
      for (const [kind, tr] of [['good', 300], ['even', 0], ['bad', 200]]){
        META.treasury = 200; META.f45end = {kind}; META.roster = [makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Mate Two')]; META.folk30 = [{id: 1, name: 'X'}];
        let logged = null; const ca = window.chronAdd, ch = window.chron; chronAdd = (k, d) => { logged = d.text; }; chron = () => ({});
        try { P.terms(); } finally { chronAdd = ca; chron = ch; }
        ok(kind + ': Treasury ' + tr + (kind === 'bad' ? ', every mate resting, the Chronicle line' : '') + ', no elves', META.treasury === tr && !META.folk30.length && (kind !== 'bad' || (META.roster[0].resting === 1 && logged === W().chron)), META.treasury + ' ' + logged);
      }
      if (CV()){
        let got = null; META.folk30 = null; delete META.cp;   // the main game, not the story
        const ca = window.chronAdd, ch = window.chron; chronAdd = () => {}; chron = () => ({});
        try { CV().settle(Array.from({length: 9}, (x, i) => ({id: 'f' + i, name: 'Elf' + i, race: 'GREY_ELF'}))); got = META.folk30.map(f => f.name); } finally { chronAdd = ca; chron = ch; }
        ok('a win with 9 families: 2 survivors stay, named from the column', got && got.join() === 'Elf0,Elf1', String(got));
        META.hireLine = null; META.pool30At = seasonName();
        const H = hireLine(), rs = H.recruits.filter(r => r && r.folk30);
        ok('both wait on the Hiring Line (season used or not; one stranger slot kept), Freeman, at half the fee', rs.length === Math.min(2, H.recruits.length - 1) && H.recruits.some(r => r && !r.folk30) && rs.every(r => r.cls === 'FREEMAN' && r.hireGP === Math.round(hireGP(Object.assign({}, r, {hireGP: null})) * .5)), rs.map(r => r.name + ':' + r.cls + ':' + r.hireGP).join());
        ok('the same face each line until hired', (META.hireLine = null, hireLine().recruits.filter(r => r && r.folk30).map(r => r.spec).join()) === rs.map(r => r.spec).join());
        ok('the Hiring Line tag', (hiringHTML().match(/data-pd35="tag"/g) || []).length === rs.length);
        { const ru = window.refreshUI, sv5 = {r: META.roster, t: META.treasury, n: META.nextId};
          try { refreshUI = () => { hiringHTML(); }; META.roster = []; META.treasury = 500;
            const H5 = hireLine(), i5 = H5.recruits.findIndex(r => r && r.folk30), nm = H5.recruits[i5].name, fid = H5.recruits[i5].folk30;
            hireCamp(i5); const H6 = hireLine();
            ok('K85: a hired survivor leaves the line and cannot be hired twice', META.roster.filter(m => m.name === nm).length === 1 && !H6.recruits.some(r => r && r.folk30 === fid) && !META.folk30.some(fk => fk.id === fid)); }
          finally { refreshUI = ru; META.roster = sv5.r; META.treasury = sv5.t; META.nextId = sv5.n; } }
      }
    } catch (e) { ok('no throw', false, String(e && e.stack || e).slice(0, 200)); }
    finally { saveMeta = sm; renderPanel = rp; foundAfterStory = fas; for (const k of keys){ if (saved[k] === undefined) delete META[k]; else META[k] = saved[k]; } }
    const pass = rows.filter(r => r.pass).length; return {pass, total: rows.length, rows};
  };
})();
