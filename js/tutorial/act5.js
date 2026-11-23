/* ============================================================================
   INDEX K45 - F-45 teaching, Act V: Kalloon and the hand-over (audits/f45-act4-5-spec.md
   section 5, S52 to S57; sign-off rows E1 to E8 in audits/f45-act4-5-checklist.md).
   Lead Programmer, 2026-11-16. Runs only on a Founding that took the Long Road (D45.road()).
     E1 the Kalloon card: the tier heading, then captions.ending.agree, then Cayde (kalloon.cayde),
        then one Cayde line per teaching row not proved (kalloon.notProved), the Zenif line, and
        FOUND THE CHAPTER.
     E2 the proof record: META.cp.d45proof (road nights) plus what the save already shows. The
        row tests are K45.PROOF: drafts for the Planner to confirm [P].
     E3 carry-over: each company hired on the road sends one named recruit to the first Hiring
        Line (K45.K.carry = 'recruit' [S]); 'standing' gives a Standing step to the company's
        faction in K45.K.bandFaction (empty: no company has a faction yet).
     E4 the wizard: no "then your Squad Leader", Cayde alone on the chair step (CG1's card),
        Holding then Ambition (the story path skipped Ambition), lessons chapter, chair, holding,
        ambition, once each.
     E5 S56, the first morning: the carried card (W11), the building lesson; building one
        building opens campStaff and elevation. CG1's beat 2 runs as before (META.caydeGuide).
     E6 S57, the first own contract: seasons at the start of the fight, tithe and upkeep on
        their ledger rows, then Cayde's farewell (founding45.s57). Lessons end (stage 'done').
   Save: META.d45k = {stage: 's56' | 's57' | 'done', seen: {}, n0, carry: {recruits, due}}.
   Off: Settings "Lessons: off" skips the lessons; the card, the carry-over and the wizard fixes stay.
   Self-test: K45.selfTest() (stubs; META, FD and G are put back).
   ============================================================================ */
(function(){
  'use strict';
  if (typeof F34 === 'undefined' || !window.T45 || !window.D45) return;
  const T = window.T45, D = window.D45, K = window.K45 = {};
  K.K = {carry: 'recruit', bandFaction: {}, npCap: 3};   // [S]
  const CL = () => window.CAMPAIGN_LINES || {};
  const W = () => CL().act45 || {};
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fill = (s, v) => T.fill(s, v);
  const C_ = () => (typeof META !== 'undefined' && META && META.cp) || null;
  const fd = () => (typeof FD !== 'undefined' ? FD : null);
  const story = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };
  K.road = () => D.road();
  K.st = () => (typeof META !== 'undefined' && META && META.d45k) || null;
  // a lesson once per save (the wizard on META.cp, the camp on META.d45k)
  K.lesson = function(id, o){
    const S = K.st() || C_(); if (!S) return false;
    const seen = S.d45seen || (S.d45seen = {}); if (seen[id]) return false; seen[id] = true;
    if (!T.is(id)) { if (o && o.then) o.then(false); return false; }
    return T.lesson(id, o || {});
  };

  /* ---- E2: what the player proved by Kalloon (teaching plan section 6) -------------- */
  K.ROWS = ['move', 'abilities', 'downed', 'build', 'hire', 'contract', 'standing', 'defend', 'allies'];
  const pf = () => { const C = C_(); return C ? (C.d45proof || (C.d45proof = {})) : {}; };
  K.prove = row => { const C = C_(); if (C) pf()[row] = true; };
  const mine = p => p && !p.f34 && !p.f34caster && !p.f45witch && !p.d45floor;
  K.PROOF = {   // [P] drafts: the record rows are set on the road, the rest read the save
    move: () => !!pf().move,                                                     // any road night won (Planner J.1)
    abilities: () => { const C = C_() || {}, bar = Object.keys(C.d45bar || {}); return bar.length > 0 && bar.every(s => (C.d45used || {})[s]); },   // every bar ability used on some night
    downed: () => !!pf().downed,                                                 // a fallen mate stood up again
    build: () => !!((META.leader && META.leader.d45hand) || (META.f34 && META.f34.b45 && META.f34.b45.check)),   // a Leader built by hand, or the S18 stat-block hire (Planner J.1)
    hire: () => (META.roster || []).some(mine),                                  // a mate the player hired
    contract: () => !!(META.f34 && META.f34.d45signed),                          // S34: read the terms and signed a lead (Planner J.1)
    standing: () => Object.values(META.standing || {}).some(v => v > 0),         // some Standing earned
    defend: () => !!pf().defend,                                                 // Night 12 won without a wrecked night
    allies: () => { const C = C_() || {}; return (C.d45hired || []).length > 0 || !!pf().allies; }   // a company hired or a Parley won
  };
  K.proved = r => { try { return !!(K.PROOF[r] && K.PROOF[r]()); } catch (e) { return false; } };
  K.notProved = () => K.ROWS.filter(r => !K.proved(r));

  // the record: the night fights' bar and uses, Night 12, the companies hired, a mate stood up
  if (typeof storyDebrief === 'function'){ const f = storyDebrief; storyDebrief = function(c, result){
      try {
        const C = C_();
        if (K.road() && C && c && c.obj === 'night' && typeof G !== 'undefined' && G){
          C.d45bar = C.d45bar || {}; C.d45used = C.d45used || {};
          for (const s of Object.keys(G.abil || {})) C.d45bar[s] = 1;
          for (const s of Object.keys(G.d45use || {})) if (G.d45use[s] > 0) C.d45used[s] = 1;
          if (result === 'victory') K.prove('move');
          if ((c.night | 0) >= NIGHTS.length && result === 'victory'){
            const s = C.d45snap, lost = s && s.column ? (s.column - C.column) / s.column : 0;
            if (lost < D.K.wrecked) K.prove('defend');
          }
          if ((G.enemies || []).some(e => e && e.parleyed && e.surrendered)) K.prove('allies');
        }
      } catch (e) { console.warn('K45 record', e); }
      return f.apply(this, arguments);
    }; }
  // build: a Leader made by hand (not a ready-made card, not 'let fate choose'); contract: S34, a lead signed at b6
  if (typeof ldrArch === 'function'){ const f = ldrArch; ldrArch = function(){ const r = f.apply(this, arguments); try { if (CR) CR.d45fate = false; } catch (e) {} return r; }; }
  if (typeof ldrSurprise === 'function'){ const f = ldrSurprise; ldrSurprise = function(){ const r = f.apply(this, arguments); try { if (CR) CR.d45fate = true; } catch (e) {} return r; }; }
  if (typeof ldrSel === 'function'){ const f = ldrSel; ldrSel = function(){ try { if (CR) CR.d45fate = false; } catch (e) {} return f.apply(this, arguments); }; }
  if (typeof finishCreate === 'function'){ const f = finishCreate; finishCreate = function(){
      const hand = !!(CR && !CR.arch && !CR.d45fate), L0 = META && META.leader;
      const r = f.apply(this, arguments);
      try { if (hand && META && META.leader && META.leader !== L0 && META.f34) { META.leader.d45hand = true; saveMeta(); } } catch (e) {}
      return r; }; }
  if (window.F34 && typeof F34.pickLead === 'function'){ const f = F34.pickLead; F34.pickLead = function(kind){
      const st = F34.state(), b = st && F34.BEATS[st.beat];
      const r = f.apply(this, arguments);
      try { if (st && st.lead && b && b.id === 'b6'){ st.d45signed = true; saveMeta(); } } catch (e) {}
      return r; }; }
  if (window.LR34 && typeof LR34.persuade === 'function'){ const f = LR34.persuade; LR34.persuade = function(id){
      const r = f.apply(this, arguments);
      try { const C = C_(); if (r === true && C){ C.d45hired = C.d45hired || []; if (!C.d45hired.includes(id)) C.d45hired.push(id); } } catch (e) {}
      return r; }; }
  if (typeof standUp === 'function'){ const f = standUp; standUp = function(m){
      const r = f.apply(this, arguments);
      try { if (C_() && typeof G !== 'undefined' && G && G.contract && m && m.p) K.prove('downed'); } catch (e) {}
      return r; }; }

  /* ---- E3: the carry-over -------------------------------------------------------------- */
  K.company = id => { const t = ((W().muster || {}).companies || {})[id]; return t ? String(t).split(':')[0] : id; };
  K.carry = function(){
    const C = C_() || {}, out = {recruits: [], standing: [], due: true};
    for (const id of C.d45hired || []){
      const fac = K.K.bandFaction[id];
      if (K.K.carry === 'standing' && fac) out.standing.push({id, company: K.company(id), faction: fac});
      else out.recruits.push({id, company: K.company(id)});
    }
    return out;
  };
  // the first Hiring Line of the new Chapter: one named recruit per company
  if (typeof hireLine === 'function'){ const f = hireLine; hireLine = function(){
      const H = f.apply(this, arguments);
      try {
        const S = K.st(), cr = S && S.carry;
        if (cr && cr.due && !story() && H && H.recruits){
          cr.due = false;
          cr.recruits.forEach((x, i) => { if (i >= H.recruits.length) return; const r = H.recruits[i] = rollRecruit(); r.d45of = x.company; x.name = r.name; });
          saveMeta();
        }
      } catch (e) { console.warn('K45 hire line', e); }
      return H;
    }; }

  /* ---- E1: the Kalloon card ------------------------------------------------------------- */
  K.ending = function(h){
    const L = W(), k = L.kalloon || {}, F45 = CL().founding45 || {};
    const agree = ((((CL().captions || {}).ending) || {}).agree) || '';
    const trim = window.ARTEMIS23 !== false;   // UX ruling 23 Nov (P23-ARTEMIS): Cayde's lines, the not-proved lines (Field Notes) and Zenif's line leave the ending card so it fits without scrolling; Cayde's turn moves to the Marlborough arrival
    const np = trim ? [] : K.notProved().map(r => (k.notProved || {})[r]).filter(Boolean).slice(0, K.K.npCap);   // Planner J.2: three on the card, the rest on Field Notes
    const say = trim ? [] : (k.cayde || []).concat(np.length && k.bridge ? [k.bridge] : [], np);   // Planner L10: the turn before the not-proved lines
    // K63 (Planner M): Kalloon's money is a grant to the companies, not the charter; the road's purse stays with the families (explains L7)
    h = h.replace(/<b>\+(\d+)gp<\/b> from Lord Artemis, to keep the companies at the ford\./, (m, n) => k.grant ? fill(E(k.grant), {n}) : m).replace('No charter money.', E(k.noGrant || 'No charter money.'));
    { const pz = (typeof META !== 'undefined' && META && META.treasury) | 0; if (pz > 0 && k.purse) h = h.replace(/(Everyone who marched)/, fill(E(k.purse), {n: String(pz)}) + ' $1'); }
    const cr = K.carry(), carry = cr.recruits.map(x => fill(k.carry || '{company} send one of their own to your Hiring Line.', {company: x.company})).concat(cr.standing.map(x => fill(k.carryStanding || '{company}: one step of Standing.', {company: x.company})));
    const block = `<div class="log k45-end" style="margin-top:8px;text-align:left">${agree ? `<p data-k45="agree">${E(agree)}</p>` : ''}`
      + (say.length ? `<p data-k45="cayde"><i>Cayde: “${say.map(E).join(' ')}”</i></p>` : '')
      + (k.zenif && !trim ? `<p data-k45="zenif">${E(k.zenif)}</p>` : '')
      + (carry.length ? `<p data-k45="carry">${carry.map(E).join(' ')}</p>` : '') + `</div>`;
    const at = h.indexOf('<button class="btn gold" onclick="foundAfterStory');
    h = at >= 0 ? h.slice(0, at) + block + h.slice(at) : h + block;
    return h.replace(/(onclick="foundAfterStory\(\d+\)">)[^<]*/, '$1' + E(k.button || 'FOUND THE CHAPTER'));
  };
  if (typeof endingHTML === 'function'){ const f = endingHTML; endingHTML = function(){
      let h = f.apply(this, arguments);
      try { if (K.road()) h = K.ending(h); } catch (e) { console.warn('K45 ending', e); }
      return h; }; }
  if (typeof foundAfterStory === 'function'){ const f = foundAfterStory; foundAfterStory = function(){
      const road = K.road(), cr = road ? K.carry() : null;
      const r = f.apply(this, arguments);
      try { if (road){ const F = fd(); if (F) F.d45 = true; META.d45carry = cr; renderFound(); } } catch (e) { console.warn('K45 found', e); }
      return r; }; }

  /* ---- E4: the wizard -------------------------------------------------------------------- */
  if (typeof heroStepHTML === 'function'){ const f = heroStepHTML; heroStepHTML = function(){
      const F = fd(); if (!(F && F.d45) || F.cgSkip) return f.apply(this, arguments);
      const g = F.guided; F.guided = true;   // CG1's card: Cayde alone in the chair, plus the small skip button
      try { return f.apply(this, arguments); } finally { F.guided = g; }
    }; }
  K.fixFound = function(html, F){
    let h = html.replace(/ › then your Squad Leader/, '')
      .replace(/RAISE THE BANNER, THEN RECRUIT YOUR SQUAD LEADER/, 'RAISE THE BANNER');
    if (F.step === 'holding') h = h.replace(/FD\.step=FD\.fromStory\?'banner':'charter'/, "FD.step='charter'").replace(/NEXT: THE BANNER<\/button>/, 'NEXT: THE CHARTER AMBITION</button>');
    // the crumbs: the story path dropped Ambition; put it back between Holding and Banner
    if (!/Ambition/.test((h.match(/Founding the Chapter:[^<]*(<b>[^<]*<\/b>[^<]*)*/) || [''])[0])) h = h.replace(/(Holding(?:<\/b>)?) › (<b>)?Banner/, (m, a, b) => `${a} › ${F.step === 'charter' ? '<b>Ambition</b>' : 'Ambition'} › ${b || ''}Banner`);
    // L11: Cayde holds the chair, so his trail has no Social Class, Specialty or Name to choose
    if (F.hero === 'cayde' && !F.cgSkip && F.step !== 'hero') h = h.replace(/Chapter Master › Social Class › Specialty › Name ›/, 'Chapter Master: Cayde ›');
    // L11: NEXT: THE BANNER waits for an ambition; say so on the button
    if (F.step === 'charter' && !F.ambition) h = h.replace(/(<button[^>]*disabled[^>]*>)NEXT: THE BANNER<\/button>/, (m, a) => a.replace(/class="btn gold"/, 'class="btn" style="opacity:.55"') + 'PICK AN AMBITION FIRST</button>');
    return h;
  };
  K.FOUND_LESSON = {hero: ['chapter', 'chair'], holding: ['holding'], charter: ['ambition']};
  if (typeof renderFound === 'function'){ const f = renderFound; renderFound = function(){
      const r = f.apply(this, arguments);
      try {
        const F = fd(), el = document.getElementById('create-inner');
        if (F && F.d45 && el){
          el.innerHTML = K.fixFound(el.innerHTML, F);
          for (const id of K.FOUND_LESSON[F.step] || []) K.lesson(id);
        }
      } catch (e) { console.warn('K45 wizard', e); }
      return r; }; }
  if (typeof finishFound === 'function'){ const f = finishFound; finishFound = function(){
      const F = fd(), d45 = !!(F && F.d45), amb = d45 ? F.ambition : null, hero = d45 ? F.hero : null, carry = d45 ? (META.d45carry || null) : null;
      const r = f.apply(this, arguments);
      try {
        if (d45 && fd() === null && META){
          if (amb && !META.ambition){ META.ambition = {track: amb, done: 0}; try { checkMilestones(null); } catch (e) {} }
          if (hero === 'cayde' && !META.caydeGuide) META.caydeGuide = 'guide';
          META.d45k = {stage: 's56', d45seen: {}, n0: K.built(), carry};
          delete META.d45carry; saveMeta();
          setTimeout(() => { try { K.camp(); } catch (e) { console.warn('K45 camp', e); } }, 0);
        }
      } catch (e) { console.warn('K45 finish', e); }
      return r; }; }

  /* ---- E5: S56, the first morning ---------------------------------------------------------- */
  // Planner L1: a build started counts (META.build), so S56 passes on the first morning, not when a contract finishes it
  K.built = () => { try { return Object.keys(META.facilities || {}).filter(k => META.facilities[k]).length + Object.keys(META.build || {}).length; } catch (e) { return 0; } };
  K.carriedLines = function(){
    const S = K.st(), w = W().carried || {}, cr = (S && S.carry) || {recruits: [], standing: []}, out = [];
    out.push(fill(w.gold || '{n} gp in the Treasury', {n: META.treasury | 0}));
    for (const x of cr.standing || []) out.push(fill(w.standing || '{company}: one step of Standing', {company: x.company}));
    for (const x of cr.recruits || []) out.push(x.name ? fill(w.recruit || '{name} of {company}, waiting in the Hiring Line', {name: x.name, company: x.company}) : fill(w.recruitDue || '{company}: one recruit, waiting in the Hiring Line', {company: x.company}));
    const n = (META.roster || []).filter(p => p && !p.dead).length; if (n) out.push(fill(w.roster || '{n} Squad Mates who walked the whole road', {n}));
    const pz = (META.prisoners || []).length; if (pz) out.push(fill(pz === 1 ? (w.prisoner || 'A prisoner from the road, in chains') : (w.prisoners || '{n} prisoners from the road, in chains'), {n: pz}));   // Planner L8 [S] words: carried.prisoner / prisoners
    return out;
  };
  K.carriedHTML = () => { const w = W().carried || {}; return `<b>${E(w.head || 'What came with you from the road:')}</b><ul style="margin:4px 0 0 18px;padding:0">${K.carriedLines().map(l => `<li>${E(l)}</li>`).join('')}</ul>`; };
  K.card = function(){
    if (document.getElementById('k45-carried')) return;
    const d = document.createElement('div'); d.id = 'k45-carried';
    d.style.cssText = 'position:fixed;right:14px;top:64px;z-index:14;max-width:300px;background:#f3ead8;border:2px solid var(--ink-soft);border-radius:6px;padding:8px 12px 8px;box-shadow:0 4px 14px rgba(0,0,0,.4);color:var(--ink);font:14px Georgia;text-align:left';
    d.innerHTML = K.carriedHTML() + `<div style="text-align:right;margin-top:6px"><button class="btn small" onclick="this.parentNode.parentNode.remove()">OK</button></div>`;
    document.body.appendChild(d);
  };
  K.camp = function(){
    const S = K.st(); if (!S || story()) return;
    if (S.stage === 's56'){
      if (!S.cardSeen){ S.cardSeen = true; K.card(); saveMeta(); }
      if (K.built() > (S.n0 | 0)){ S.stage = 's57'; K.lesson('campStaff'); K.lesson('elevation'); saveMeta(); }
      else K.lesson('building');
    }
  };
  if (typeof renderTitle === 'function'){ const f = renderTitle; renderTitle = function(){
      const r = f.apply(this, arguments); try { K.camp(); } catch (e) { console.warn('K45 camp', e); } return r; }; }
  if (typeof refreshUI === 'function'){ const f = refreshUI; refreshUI = function(){
      const r = f.apply(this, arguments); try { const S = K.st(); if (S && S.stage === 's56') K.camp(); } catch (e) {} return r; }; }

  /* ---- E6: S57, the first own contract --------------------------------------------------- */
  if (typeof startDeployment === 'function'){ const f = startDeployment; startDeployment = function(){
      const r = f.apply(this, arguments);
      try { const S = K.st();
        // Planner L2: a contract marched before anything was built still gets S57's lessons (the stage moves on here)
        if (S && S.stage === 's56' && !story() && typeof G !== 'undefined' && G){ S.stage = 's57'; saveMeta(); }
        if (S && S.stage === 's57' && !story() && typeof G !== 'undefined' && G){ G.d45k = true; K.lesson('seasons'); } } catch (e) { console.warn('K45 seasons', e); }
      return r; }; }
  K.rowEl = (root, re) => { const ps = root ? root.querySelectorAll('.log p') : []; for (const p of ps) if (re.test(p.textContent)) return p; return null; };
  K.ledger = function(root){
    const S = K.st(); if (!S || S.stage !== 's57') return false;
    S.stage = 'done'; saveMeta();
    /* R9 (checklist R, stage 4): while the report has one money line ("Coin home") there is no Tithe or Upkeep row; both cards point at it */
    const coin = (root && root.querySelector('p[data-so45="coin"]')) || K.rowEl(root, /Coin home/);
    /* QA 22 Nov: the ledger (ledger.js) drops the old .log, so the Treasury line is gone; the cards then point at the Coin row of the ledger */
    const crow = root && (root.querySelector('.u4-led [data-sec="coin"]') || root.querySelector('[data-sec="coin"]')), live = e => (e && e.isConnected) ? e : null;
    const fig = k => root && root.querySelector('.u4-led [data-fig="' + k + '"]'), t = live(K.rowEl(root, /Tithe/)) || fig('tithe') || crow || coin, u = live(K.rowEl(root, /Hazard Upkeep|Upkeep/)) || fig('upkeep') || crow || coin;   // UX 6313b396: each card rings its own figure on the Coin strip
    let n = 0; const end = () => { if (--n <= 0) K.farewell(); };
    for (const [id, el] of [['tithe', t], ['upkeep', u]]){ n++; if (!K.lesson(id, {el: el || undefined, pad: 2, then: end})) end(); }
    return true;
  };
  K.farewell = function(){
    const S = K.st(); if (S && S.bye) return; if (S){ S.bye = true; saveMeta(); }
    const lines = ((CL().founding45 || {}).s57 || {}).cayde || ['That is everything I know.', 'The rest is in the Chronicle, under Field Notes. The table is yours.'];
    try { if (window.CAYDE_GUIDE) CAYDE_GUIDE.closeBox(); } catch (e) {}
    const d = document.createElement('div'); d.className = 'cg-box'; d.id = 'cg-box';
    d.innerHTML = `<div><div class="gname">Cayde Hallinan</div><div class="speech">${lines.map(l => `<p>${E(l)}</p>`).join('')}</div></div><button class="cg-close" title="Close" aria-label="Close" onclick="this.parentNode.remove()">×</button>`;
    document.body.appendChild(d);
    K.said = lines;
  };
  if (typeof renderDebrief === 'function'){ const f = renderDebrief; renderDebrief = function(){
      const r = f.apply(this, arguments);
      try { if (typeof G !== 'undefined' && G && G.d45k && !story()){ const run = () => { try { K.ledger(document.getElementById('debrief-inner')); } catch (e) { console.warn('K45 ledger', e); } };
        /* the ledger pass (ledger.js) runs after this wrapper and rebuilds the rows: wait for it, so the cards ring the live Coin row */
        if (window.__u4led && typeof LEDGER !== 'undefined' && LEDGER.on !== false) setTimeout(run, 0); else run(); } } catch (e) { console.warn('K45 ledger', e); }
      return r; }; }

  /* ---- self-test: K45.selfTest() (stubs; nothing saved) --------------------------------- */
  K.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const g = n => { try { return eval(n); } catch (e) { return undefined; } };
    const sv = {META: META, FD: fd(), G: g('G'), save: saveMeta, road: D.road, les: T.lesson, lon: T.lessonsOn, SK: SAVE_KEY, st: g('inStoryNow')};
    const shown = [], thens = [];
    try {
      SAVE_KEY = '__k45'; META = freshMeta(); G = null; saveMeta = () => {};
      D.road = () => true; T.lessonsOn = () => true;
      T.lesson = (id, o) => { shown.push(id); if (o && o.then) thens.push(o.then); return true; };
      META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); META.leader.d45hand = true;
      const hal = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Hal'); hal.f34 = 'hal';
      META.roster = [hal]; META.standing = {}; META.f34 = {beat: 0, log: []};
      META.cp = {part: 'kalloon', f34road: true, column: 12, d45hired: ['rustpikes', 'ridge'], d45bar: {SOLDIER: 1, SCOUNDREL: 1}, d45used: {SOLDIER: 1}, d45proof: {move: true, defend: true}};
      // E2
      const np = K.notProved();
      ok('kalloon: not-proved rows match the record', np.join() === 'abilities,downed,hire,contract,standing', np.join());
      // E1
      const k = W().kalloon || {};
      const h = K.ending('<h2>Artemis\u2019s Lands: Survival</h2><div class="desc">x</div><button class="btn gold" onclick="foundAfterStory(250)">FOUND THE DUST CLOAKS</button>');
      const at = s => h.indexOf(s);
      const agree = E(((CL().captions || {}).ending || {}).agree || '');
      ok('kalloon: card order (heading, agree, button); Cayde, Zenif and the not-proved lines are off the card (P23-ARTEMIS)', at('Artemis’s Lands: Survival') < at(agree) && at(agree) < at(E(k.button || 'FOUND THE CHAPTER')) && at('data-k45="cayde"') < 0 && at('data-k45="zenif"') < 0 && at('FOUND THE DUST CLOAKS') < 0);
      ok('kalloon: no not-proved line on the card (they are on Field Notes)', np.concat(['move', 'defend', 'build', 'allies']).every(r => h.indexOf(E(k.notProved[r])) < 0));
      { // Planner J.1: build, contract, move read flags, not the save's shape
        const p0 = META.cp.d45proof; META.leader.d45hand = false; const b0 = K.proved('build');
        META.f34.b45 = {check: true}; const b1 = K.proved('build'); delete META.f34.b45; META.leader.d45hand = true;
        META.f34.lead = 'rescue'; const c0 = K.proved('contract'); META.f34.d45signed = true; const c1 = K.proved('contract'); delete META.f34.lead; delete META.f34.d45signed;
        ok('J.1: build needs a hand-made Leader or the S18 stat check; contract needs the S34 signing', !b0 && b1 && !c0 && c1);
        META.cp.d45proof = p0; }
      ok('J.2: carry line read from kalloon.carry', h.indexOf(E(fill(k.carry, {company: 'The Rust-Pikes'}))) >= 0);
      // E3
      const cr = K.carry();
      ok('S52: carry-over per hired company', cr.recruits.length === 2 && cr.recruits[0].company === 'The Rust-Pikes' && cr.recruits[1].company === 'The Ridge-Striders' && h.indexOf('The Rust-Pikes send one') >= 0);
      delete META.cp;   // the Founding ends the story save
      META.d45k = {stage: 's56', d45seen: {}, n0: 0, carry: cr}; META.hireLine = null;
      const HL = hireLine();
      ok('S52: the first Hiring Line holds the named recruits, once', HL.recruits[0].d45of === 'The Rust-Pikes' && HL.recruits[1].d45of === 'The Ridge-Striders' && cr.due === false && !!cr.recruits[0].name);
      // E5
      const lines = K.carriedLines().join(' | ');
      ok('S56: carried list', lines.indexOf(cr.recruits[0].name + ' of The Rust-Pikes') >= 0 && /gp in the Treasury/.test(lines) && /Squad Mates who (walked|reached)/.test(lines), lines);
      META.facilities = {}; K.camp();
      ok('S56: building lesson, and the carried card once', shown.includes('building') && !!document.getElementById('k45-carried') && META.d45k.stage === 's56');
      { const c = document.getElementById('k45-carried'); if (c) c.remove(); }
      META.facilities = {forge: 1}; K.camp();
      ok('S56: one building opens campStaff and elevation', shown.includes('campStaff') && shown.includes('elevation') && META.d45k.stage === 's57' && !document.getElementById('k45-carried'));
      // E4
      FD = {step: 'hero', d45: true, fromStory: true, hero: null};
      const hs = heroStepHTML();
      ok('wizard: Cayde in the chair', /CAYDE TAKES THE CHAIR/.test(hs) && FD.guided === undefined);
      const crumbs = '<div class="sub">Founding the Chapter: Chapter Master › Social Class › Specialty › Name › <b>Holding</b> › Banner › then your Squad Leader</div>';
      FD.step = 'holding';
      const fx = K.fixFound(crumbs + `<button class="btn gold" onclick="FD.step=FD.fromStory?'banner':'charter';renderFound()">NEXT: THE BANNER</button>`, FD);
      ok('wizard: no Leader step; Holding then Ambition', fx.indexOf('then your Squad Leader') < 0 && /<b>Holding<\/b> › Ambition › Banner/.test(fx) && /FD\.step='charter'/.test(fx) && /NEXT: THE CHARTER AMBITION/.test(fx), fx);
      ok('wizard: the banner button', K.fixFound('RAISE THE BANNER, THEN RECRUIT YOUR SQUAD LEADER', {step: 'banner'}) === 'RAISE THE BANNER');
      ok('L11: Cayde in the chair drops the trail he skipped', /Chapter Master: Cayde › <b>Holding/.test(K.fixFound('Founding the Chapter: Chapter Master › Social Class › Specialty › Name › <b>Holding</b> › Banner', {step: 'holding', hero: 'cayde'})));
      ok('L11: the banner button says it waits for an ambition', /PICK AN AMBITION FIRST/.test(K.fixFound('<button class="btn gold" disabled="" onclick="x">NEXT: THE BANNER</button>', {step: 'charter'})));
      ok('K63: the Kalloon grant line, not the charter', K.ending('<p><b>+250gp</b> from Lord Artemis, to keep the companies at the ford. Everyone who marched comes</p><button class="btn gold" onclick="foundAfterStory(250)">X</button>').indexOf(E(fill(W().kalloon.grant, {n: '250'}))) >= 0 || !(W().kalloon || {}).grant);
      FD = null;
      // after Kalloon the Founding is over: the main rules come back (QA: no Tithe on the first own contract)
      { const f0 = META.f34, sn = F34.slotNow; META.f34 = {beat: F34.BEATS.length, log: [{id: 'b11', r: 'done'}]}; F34.slotNow = SAVE_KEY;
        const off = !F34.active() && !(window.SO45 && SO45.founding && SO45.founding()); META.f34.beat = F34.BEATS.length - 1; const on = F34.active();
        META.f34 = f0; F34.slotNow = sn;
        ok('after Kalloon: the Founding rules are off (Tithe back)', off && on); }
      // E6
      shown.length = 0; thens.length = 0;
      const root = document.createElement('div'); root.innerHTML = '<div class="log"><p>Contract: 100gp</p><p>The Masters\' Tithe: <b>-10gp</b></p><p>Hazard Upkeep: -20gp</p></div>';
      K.ledger(root);
      const once = shown.join() === 'tithe,upkeep' && !K.said;
      thens.forEach(t => t(true));
      ok('S57: ledger lessons once, then farewell', once && !!K.said && META.d45k.stage === 'done' && (K.ledger(root), shown.length === 2), shown.join());
      { const b = document.getElementById('cg-box'); if (b) b.remove(); }
      // Lessons off: no lesson, the farewell still comes
      T.lessonsOn = () => false;
      META.d45k = {stage: 's57', d45seen: {}}; K.said = null;
      K.ledger(root);
      ok('S57: lessons off still ends with the farewell', !!K.said && shown.length === 2);
      { const b = document.getElementById('cg-box'); if (b) b.remove(); }
      // R9: one money line: both cards point at Coin home
      { T.lessonsOn = () => true; const els = [], l0 = T.lesson; T.lesson = (id, o) => { els.push(o && o.el); return true; };
        META.d45k = {stage: 's57', d45seen: {}}; K.said = null; const r2 = document.createElement('div');
        r2.innerHTML = '<div class="log"><p data-so45="coin"><b>Coin home: 40 gp.</b></p><p>Hal is hurt.</p></div>';
        try { K.ledger(r2); } finally { T.lesson = l0; }
        const cp = r2.querySelector('p[data-so45="coin"]'); ok('R9: with one money line the tithe and upkeep cards point at Coin home', els.length === 2 && els.every(e => e === cp)); }
    } catch (e) { ok('threw: ' + (e && e.message), false, e && e.stack); }
    finally {
      META = sv.META; FD = sv.FD; G = sv.G; saveMeta = sv.save; D.road = sv.road; T.lesson = sv.les; T.lessonsOn = sv.lon; SAVE_KEY = sv.SK; K.said = null;
      try { localStorage.removeItem('__k45'); } catch (e) {}
    }
    const fail = rows.filter(r => !r.pass).length;
    return {pass: rows.length - fail, fail, rows};
  };
})();
