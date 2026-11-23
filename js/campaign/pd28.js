/* INDEX PD28: PD-28 the Leader levels every 3 deployments in the Founding (audits/f45-pd-specs.md section 3; closes Acts I-III B7).
   - While the Founding runs (F34.active(), through Kalloon) the Leader earns no XP ticks (G.noTick on every Founding fight).
   - META.f34.pd28 = {n}: +1 on every fight the built Leader deploys in (st.leader set at b3; Cayde's cold open does not count),
     any result. Counted once per fight in contractDebrief.
   - Level = 1 + floor(n / P.K.per). Level 2 stays on the b7 card (F34.levelTwo, as written): today b3, b5 and the b6 lead make
     3 there. From Level 3 the Leader gains one level on the debrief where the count reaches the next multiple, with the
     level's row bonus as a real level-up gives it (a Talent pick, a Luck windfall).
     The first level that owes a Talent pick (Level 3 at b9's second fight for a Soldier or Folk Hero; Level 4 for a Scoundrel)
     shows the 'talent' lesson card over the debrief's Talent pick, once.
     Road levels (Nights 2, 5, 8, 11 at counts 9 to 18): one line on the next morning card, with the martial library gate (Q13:
     L2 entries at Level 3, scrolls at Level 5) when one opens.
   - After the hand-over the Founding is over and the normal XP rules run from the Leader's level (ticks stay 0 in the Founding).
   Words [T]: DEF; CAMPAIGN_LINES.pd28 overrides; the lesson card is T45 'talent' (CAMPAIGN_LINES.lessons.talent over T45.DRAFT).
   Self-test: PD28.selfTest(). */
(function(){
  'use strict';
  if (!window.F34) return;
  const F = F34, P = window.PD28 = {K: {per: 3}};
  const DEF = {
    level: '{leader} is Level {n}.',
    gate: 'Level {n} opens new entries at the {building}.',
    scrolls: 'Scrolls can be read now.',
    learned: '{leader} learns {talent}.'
  };
  P.W = k => { const L = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd28) || {}; return L[k] != null ? L[k] : DEF[k]; };
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const E = t => typeof esc === 'function' ? esc(t) : String(t);
  if (window.T45) T45.DRAFT.talent = {title: 'A Talent', lines: ['Level {n}. {leader} can learn a Talent: always on, no key. Pick one.', 'PICK 1 TALENT'], goal: 'PICK 1 TALENT'};

  P.st = () => { const st = F.state(); return st ? (st.pd28 = st.pd28 || {n: 0}) : null; };
  P.counts = () => { const st = F.active() && F.state(), L = typeof META !== 'undefined' && META && META.leader; return !!(st && st.leader && L && !L.f34cayde); };
  P.target = n => 1 + Math.floor((n | 0) / P.K.per);

  // the martial library gate the new level opens (Q13); casters gate by Magic, so none
  P.gateLines = function(L, n){
    const out = [], S = typeof SPECS !== 'undefined' && SPECS[L.spec];
    if (!S || S.caster) return out;
    if (n === 5) out.push(P.W('scrolls'));
    try { if (window.PROG1){ const bs = [...new Set(PROG1.techniques(L.spec).filter(e => e.gate === n && (e.src === 'L1' || e.src === 'L2') && e.building).map(e => e.building))];
        for (const b of bs){ const k = String(b).replace(/^[#@]/, ''); let nm = k; try { const f = FACILITIES.find(x => x.id === k); if (f && f.name) nm = f.name; } catch (e) {} out.push(fill(P.W('gate'), {n, building: nm})); } } } catch (e) { console.warn('PD28 gate', e); }
    return out;
  };
  // one level, with that level's row bonus (as the debrief's level-up gives it)
  P.levelUp = function(L, lines){
    L.level = Math.min(11, (L.level | 0) + 1); L.ticks = 0;
    let label = '';
    try { const b = rowFor(L.spec, L.level)[2];
      label = b.startsWith('text:') ? capLabel(b.slice(5)) : (BONUS_LABEL[b] || '');
      if (b === 'pick') META.pendingPicks = (META.pendingPicks | 0) + 1;
      if (b === 'luck' && leaderStats(L).rawLuck > 6){ META.treasury += 60; if (lines) lines.push('<p>Luck is already at 6: the excess becomes a 60gp Windfall.</p>'); } } catch (e) { console.warn('PD28 level', e); }
    if (lines) lines.push(`<p class="good" data-pd28="level"><b>${E(L.name)} reaches Level ${L.level}.</b>${label ? ' ' + E(label) + '.' : ''} Squad Mates may now hold ${L.level + 1} Advancements.</p>`
      + P.gateLines(L, L.level).map(t => `<p data-pd28="gate">${E(t)}</p>`).join(''));
    return L.level;
  };
  // the count, once per fight; a level from 3 on when the count reaches the next multiple
  P.count = function(lines){
    const s = P.st(), L = META.leader; if (!s || !L) return null;
    s.n = (s.n | 0) + 1;
    if ((L.level | 0) < 2 || P.target(s.n) <= (L.level | 0)) return null;   // Level 2 is the b7 card's
    const p0 = META.pendingPicks | 0, n = P.levelUp(L, lines);
    let C = null; try { C = typeof CP === 'function' ? CP() : null; } catch (e) {}
    if (C && C.part === 'road') s.road = {night: C.night, n};
    if ((META.pendingPicks | 0) > p0 && !s.taught) s.talent = n;   // the first Talent pick (Level 3 for a Soldier or Folk Hero; Level 4 for a Scoundrel)
    return n;
  };

  { const f = startDeployment; startDeployment = function(c, ids){
      const r = f.apply(this, arguments);
      try { if (P.counts() && typeof G !== 'undefined' && G && !G.over){ G.noTick = true; G.pd28 = true; } } catch (e) { console.warn('PD28 start', e); }
      return r; }; }
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      const r = f.apply(this, arguments);
      try { if (typeof G !== 'undefined' && G && G.pd28 && !G.pd28done && P.counts()){ G.pd28done = true; P.count(lines); } } catch (e) { console.warn('PD28 count', e); }
      return r; }; }
  // Level 3: the 'talent' lesson over the debrief's Talent pick, once
  { const f = renderDebrief; renderDebrief = function(){
      const r = f.apply(this, arguments);
      try { const s = F.active() && P.st();
        if (s && s.talent && META.leader && META.pendingPicks > 0 && window.T45){ const n = s.talent; s.talent = false; s.taught = true;
          T45.lesson('talent', {vars: {leader: META.leader.name, n}, el: P.pickRow()}); } } catch (e) { console.warn('PD28 talent', e); }
      return r; }; }
  /* K87 (UX f48): at 1280 x 800 the Talent cards sat below the fold, a screen from the lesson card. The row is scrolled to the
     middle of the screen and the card points at it. After a pick, one line in the report says what was learned. */
  P.pickRow = function(){
    const c = document.querySelector('#debrief-inner .k74'), row = c && c.parentElement;
    if (!row) return null;
    try { row.scrollIntoView({block: 'center'}); } catch (e) {}
    return row;
  };
  if (typeof leaderPick === 'function'){ const f = leaderPick; leaderPick = function(id){
      try { const L = META.leader, D = renderDebrief.last, o = L && leaderOpts(L).find(x => x.id === id);
        if (o && D && Array.isArray(D.lines) && !$('screen-debrief').classList.contains('hidden'))
          D.lines.push(`<p class="good" data-pd28="learned">${E(fill(P.W('learned'), {leader: L.name, talent: o.name}))}</p>`); } catch (e) { console.warn('PD28 learned', e); }
      return f.apply(this, arguments); };
    window.leaderPick = leaderPick; }
  // road levels: one line on the next morning card
  P.roadHTML = function(){
    const s = F.active() && P.st(), L = META.leader; let C = null; try { C = CP(); } catch (e) {}
    if (!s || !s.road || !L || !C || s.road.night !== C.night) return '';
    const t = [fill(P.W('level'), {leader: L.name, n: s.road.n})].concat(P.gateLines(L, s.road.n));
    return t.map(x => `<div class="desc" data-pd28="morning" style="text-align:left;margin-top:4px">${E(x)}</div>`).join('');
  };
  if (window.D45 && typeof D45.morningHTML === 'function'){ const f = D45.morningHTML; D45.morningHTML = function(){
      const h = f.apply(this, arguments);
      try { const x = P.roadHTML(); if (x){ const i = h.lastIndexOf('<button'); return i < 0 ? h + x : h.slice(0, i) + x + h.slice(i); } } catch (e) { console.warn('PD28 morning', e); }
      return h; }; }

  /* ---- self-test: PD28.selfTest() (stubs; META and the globals are put back) ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, c, x) => rows.push({n, ok: !!c, x});
    const sv = {M: META, G: typeof G !== 'undefined' ? G : null, slot: F.slotNow, save: saveMeta, les: window.T45 && T45.lesson};
    try {
      META = freshMeta(); F.slotNow = SAVE_KEY; saveMeta = () => {};
      META.leader = {name: 'Hal', level: 1, ticks: 0, spec: 'SOLDIER', race: 'HUMAN', cls: 'FREEMAN', picks: []};
      META.f34 = {beat: 2, log: [], leader: true}; META.pendingPicks = 0;
      ok('counts the built Leader, not Cayde', P.counts() && (META.leader.f34cayde = true, !P.counts()) && (delete META.leader.f34cayde, true));
      const ln = []; P.count(ln); P.count(ln); P.count(ln);
      ok('count 3: no level on the debrief (Level 2 is the b7 card)', META.leader.level === 1 && P.st().n === 3 && !ln.length);
      F.levelTwo(META.leader);
      ok('the b7 card sets Level 2', META.leader.level === 2);
      P.count(ln); P.count(ln); const l6 = []; P.count(l6);
      const pickAt3 = rowFor('SOLDIER', 3)[2] === 'pick';
      ok('count 6: Level 3 on that debrief' + (pickAt3 ? ', a Talent pick owed' : ''), META.leader.level === 3 && l6.some(x => /reaches Level 3/.test(x)) && (!pickAt3 || (META.pendingPicks === 1 && P.st().talent === 3)));
      ok('Level 3 names the Soldier’s L2 library gate, by its short name', l6.some(x => /Level 3 opens new entries at the [^.(]+\.<\/p>/.test(x)) && !l6.some(x => /run by a veteran/.test(x)));
      let les = null; if (window.T45) T45.lesson = (id, o) => { les = {id, o}; return true; };
      const tx = window.T45 ? T45.text('talent', {leader: 'Hal', n: 3}) : null;
      ok('the talent card: words and goal', !tx || (/Level 3\. Hal can learn a Talent: always on, no key\. Pick one\./.test(tx.lines.join(' ')) && tx.gate === 'PICK 1 TALENT'));
      { const sr = renderDebrief, sd = renderDebrief.last, scr = $('screen-debrief'), hid = scr.classList.contains('hidden'); let got = null;
        try { META.pendingPicks = 1; const o = leaderOpts(META.leader)[0];
          renderDebrief = (h, l) => { got = l; }; renderDebrief.last = {head: 'T', lines: []}; scr.classList.remove('hidden');
          if (o) leaderPick(o.id);
          ok('K87: a pick adds one line, "Hal learns <talent>."', !o || (got && got.length === 1 && got[0].includes('data-pd28="learned"') && got[0].includes('Hal learns ' + E(o.name) + '.') && META.leader.picks.includes(o.id))); }
        finally { renderDebrief = sr; renderDebrief.last = sd; if (hid) scr.classList.add('hidden'); META.pendingPicks = 0; } }
      // road: Night 2 is count 9
      META.cp = {part: 'road', night: 2, log: []}; META.leader.level = 3; P.st().n = 8; const l9 = []; P.count(l9);
      ok('count 9 on the road: Level 4, the morning line', META.leader.level === 4 && P.st().road.night === 2 && /Hal is Level 4\./.test(P.roadHTML()));
      P.st().n = 11; META.cp.night = 5; P.count([]);
      ok('count 12: Level 5, scrolls can be read', META.leader.level === 5 && /Scrolls can be read now\./.test(P.roadHTML()));
      META.cp.night = 6; ok('the morning line is that night’s only', P.roadHTML() === '');
      P.st().n = 13; P.count([]); ok('no level between multiples', META.leader.level === 5);
      META.leader.spec = 'MAGE'; ok('casters: no library line (Magic gates)', !P.gateLines(META.leader, 3).length);
      META.f34.beat = F.BEATS.length; ok('after the hand-over: no count', !F.active() && !P.counts());
    } catch (e) { ok('no throw: ' + e.message, false, String(e.stack).slice(0, 300)); }
    finally { META = sv.M; F.slotNow = sv.slot; saveMeta = sv.save; if (sv.les) T45.lesson = sv.les; G = sv.G; }
    const pass = rows.filter(r => r.ok).length;
    return {pass, total: rows.length, rows: rows.filter(r => !r.ok)};
  };
})();

/* UX K91 (f48), Planner words CAMPAIGN_LINES.manual (2927ca4): the Manual gains a Talents entry after Advancement; the two
   Withdrawing entries become one plus "Big rolls"; the second "The map." heading reads "Scouted marks."; six rulebook Section
   and Table numbers become player words; the button word comes from the key. Installed at window load, outside every other
   openManual wrapper, then the contents are rebuilt (manualReindex). Self-test: MAN91.selfTest(). */
(function(){
  const M = window.MAN91 = {};
  const W = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.manual) || null;
  const head = p => { const b = p.querySelector('b'); return b ? b.textContent.trim() : ''; };
  M.apply = function(inner){
    const K = W(), lg = inner && inner.querySelector('.log'); if (!K || !lg || lg.dataset.man91) return false;
    const ps = () => [...lg.querySelectorAll('p')];
    // 4. Section and Table numbers to player words, each pair once, inside the paragraph that holds it
    for (const [a, b] of K.swap || []){ const p = ps().find(x => x.innerHTML.includes(a)); if (p) p.innerHTML = p.innerHTML.replace(a, b); }
    // 2. Withdrawing: the first entry becomes `withdraw`; the second goes, `bigRolls` in its place
    const wd = ps().filter(p => /^Withdrawing\b/.test(head(p)));
    if (wd[0] && K.withdraw) wd[0].innerHTML = K.withdraw;
    if (wd[1]){ if (K.bigRolls){ const n = document.createElement('p'); n.innerHTML = K.bigRolls; wd[1].replaceWith(n); } else wd[1].remove(); }
    // 1. Talents straight after Advancement
    const adv = ps().find(p => head(p) === 'Advancement.');
    if (adv && K.talents){ const n = document.createElement('p'); n.innerHTML = K.talents; adv.after(n); }
    // 3. the second "The map." entry is the scouted marks
    const mp = ps().filter(p => head(p) === 'The map.');
    if (mp[1] && K.mapMarks) mp[1].querySelector('b').textContent = K.mapMarks;
    // 5. the button word
    if (K.close) inner.querySelectorAll('button[onclick^="renderTitle"]').forEach(b => { b.textContent = K.close; });
    lg.dataset.man91 = '1';
    try { if (typeof manualReindex === 'function') manualReindex(inner); } catch (e) {}
    return true;
  };
  window.addEventListener('load', () => {
    if (typeof openManual !== 'function' || openManual.__man91) return;
    const f = openManual;
    openManual = function(){ const r = f.apply(this, arguments); try { M.apply($('manual-inner')); } catch (e) { console.warn('MAN91', e); } return r; };
    openManual.__man91 = true;
  });
  M.selfTest = function(){
    const rows = [], ok = (n, c, d) => rows.push({n, ok: !!c, d}), K = W();
    try {
      openManual(); const inner = $('manual-inner'), lg = inner.querySelector('.log'), ps = [...lg.querySelectorAll('p')], hs = ps.map(head);
      ok('Talents entry straight after Advancement', K && hs[hs.indexOf('Advancement.') + 1] === 'Talents.');
      ok('one Withdrawing entry, then Big rolls in the old second place', hs.filter(h => /^Withdrawing/.test(h)).length === 1 && hs.includes('Big rolls.') && lg.innerHTML.includes('6 (an enemy commander is near)'), hs.filter(h => /Withdraw|Big/.test(h)).join('/'));
      ok('one "The map." and a Scouted marks entry', hs.filter(h => h === 'The map.').length === 1 && hs.includes(K.mapMarks));
      ok('no rulebook Section or Table numbers left', !/Section \d|Table \d/.test(lg.innerHTML), (lg.innerHTML.match(/.{30}(Section|Table) \d.{10}/) || [''])[0]);
      const toc = inner.querySelector('.mantoc'), tl = toc ? [...toc.querySelectorAll('a')].map(a => a.textContent) : [];
      ok('contents list Talents, once Withdrawing, once The map', !toc || (tl.includes('Talents') && tl.filter(t => t === 'Withdrawing').length === 1 && tl.filter(t => t === 'The map').length === 1), tl.length);
      ok('button word from the key', [...inner.querySelectorAll('button[onclick^="renderTitle"]')].every(b => b.textContent === K.close));
      openManual(); ok('opening twice adds nothing twice', [...$('manual-inner').querySelectorAll('.log p')].map(head).filter(h => h === 'Talents.').length === 1);
    } catch (e) { ok('no throw: ' + e.message, false); }
    try { renderTitle(); } catch (e) {}
    const pass = rows.filter(r => r.ok).length;
    return {pass, fail: rows.length - pass, rows: rows.filter(r => !r.ok)};
  };
})();
