/* ============================================================================
   INDEX SO45 - F-45 sign-off blockers B3 to B6 (Backlog Worker, 2026-11-16)
   Source: audits/f45-signoff.md (Campaign Planner). Wrappers only: campaign34,
   fix45, teach45 and act45b are not edited.
   B3 b10 won after the gate fell: the report said the gate held. Now it says
      the gate broke, the Keep held, and Varnholt is lost; "The gate holds" goes.
   B4 at a gate breach three tips showed in one frame. Now the S37 `fallBack`
      card shows at the breach, and on b10 the S38 `withdraw` card follows
      K.withdrawAfter frames later. With lessons off, the old tips stand.
   B5 Founding reports (every fight and night while the Founding runs):
      one money line, "Coin home: N gp." (the change in the Treasury); no
      Tithe, Upkeep, salvage table, Comrades, Death Averted, Trophy Rack,
      prisoner escape or raid lines; no camp raid is rolled; Standing moves
      only for the Sun Elf Exiles and Varnholt. Words: CAMPAIGN_LINES.ux48.b5.
      UX re-check (16 Nov): the pay lands before contractDebrief and more lines
      come after it, so the trim now runs in renderDebrief: Coin home is the
      Treasury change over the whole report, redraws keep one line, the
      Pay/Treasury/Spoils header is hidden, no nemesis line, no "Luck burned"
      on a card, and "the gate held" is said once.
      The Cleric card's {n} is filled from the hire's Magic; "each of one"
      reads as the Planner's advOne / advMany.
   B6 b8: the `caltrop` card at the start of the Prepare round, with its goal:
      one trap set with F (the Prepare round ending also passes it).
   K49 (UX F-48) a Leader who fell after b3 could die and end the Founding
      with no Leader. In the Founding a fallen Leader is now always dragged
      clear: no Bleeding Out rolls on the field, 'fallen' becomes 'fled'
      (as A45 does for the first fight) and the report says so.
   B1 the signed Leader kept Cayde's ab33 loadout and cooldown, the 'you' card
      said to press the Specialty's old bar key (1 for a Soldier, which is
      Hal's key), and any caster of that Specialty passed the gate. Now the
      Leader's ab33 is cleared on signing, the card and legend name the
      Leader's key (E), the field freeze zeroes that Specialty's ab33
      cooldowns, and in the 'you' step only the Leader's own press counts.
   R1 (Planner re-check, b8c5932): the b10 win report after the gate fell had
      the Scribe write "A clean return". Now it says the town is lost ([N]
      SO45.TXT.scribeLost). Wraps DEBRIEF31UI.scribe; flag G.so45lost set in endDeployment.
   R2 (Planner): keepLines took the space before every tag out of the whole
      report ("from the contract:give 1 Advancement"). Now only the lines that
      held "The gate holds." are changed. No switch (a bug fix).
   N9 (Planner): at the Founding's breach the general defence note "The
      raiders are through the gate. Fall back and save the buildings..." sat
      beside the fallBack card. It is dropped when that card will show.
      Wraps note; switch SO45.n9.
   N11 (Planner third re-check): the Leader going down after the b10 breach
      ends the fight 'fled', and the Scribe wrote "Half a job at Varnholt".
      The town is lost on every b10 ending, so any b10 Founding ending the
      company survives (won or fled) gets SO45.TXT.scribeLost. Switch SO45.n11.
   Words marked [N] are drafts for the Planner. Numbers [S]: SO45.K.
   No switches (INT-1 group 5): git is the history. The tutorial parts live in their bases:
   T45.lessonVars and T45.keyOf (lessons.js), A45.need and A45.onUse (act1.js). Self-test: SO45.selfTest().
============================================================================ */
(function(){
  'use strict';
  const X = window.SO45 = {K: {withdrawAfter: 240}};
  X.TXT = {                                                         // [N] drafts
    keepHow: 'The North Gate broke, after {t}. You held the Keep to the end, but Varnholt is lost.',
    dragged: '{name} went down, but the squad dragged them clear, alive.',
    scribeLost: 'The company marched out alive. Varnholt is not ours any more.'
  };
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] != null ? o[k] : m));
  const W5 = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.ux48 && CAMPAIGN_LINES.ux48.b5) || {};
  // QA 2026-11-16: after Kalloon (b11 logged 'done') the founded Chapter is the open game, not the Founding
  X.b11done = () => { try { const st = F34.state(); return !!(st && (st.log || []).some(l => l && l.id === 'b11' && l.r === 'done')); } catch (e) { return false; } };
  X.founding = () => { try { return !!(window.F34 && F34.active() && !X.b11done()); } catch (e) { return false; } };
  const wrap = (n, mk) => { const f = gl(n); if (typeof f !== 'function') return false;
    X['_' + n] = mk(f); (0, eval)(n + ' = window.SO45._' + n); return true; };

  /* ---- B3: b10 won after the gate fell --------------------------------------- */
  X.keepWon = (c, result) => { const G = gl('G');
    return !!(c && c.f34gate && c.f34 === 'b10' && result === 'victory' && G && G.def30 && G.def30.breach); };
  wrap('contractHow', f => function(c, result){
    try { if (X.keepWon(c, result)){ const G = gl('G'); return fill(X.TXT.keepHow, {t: `${G.sec / 60 | 0}m ${G.sec % 60}s`}); } } catch (e) { console.warn('SO45 how', e); }
    return f.apply(this, arguments);
  });
  X.keepLines = function(lines){
    const holds = window.FIX45 && FIX45.TXT && FIX45.TXT.holds;
    for (let i = lines.length - 1; i >= 0; i--){
      let s = lines[i]; if (typeof s !== 'string') continue;
      if (holds && s.includes(holds)) s = s.split(holds + ' ').join('').split(holds).join('').replace(/\s+<\//g, '</');   // R2: only the lines that held it, and only the space it leaves
      if (/The (gate|camp) holds|was thrown back/.test(s)) s = s.replace(/[^.>]*(The (gate|camp) holds|was thrown back)[^.<]*\.?/g, '');
      if (!s.replace(/<[^>]+>/g, '').trim()) lines.splice(i, 1); else lines[i] = s;
    }
    return lines;
  };

  /* ---- B5: the Founding's report ---------------------------------------------- */
  X.DROP = [/Hazard Upkeep/, /Detailed Salvage/, /Masters(’|') Tithe/, /have become Comrades|has lost their Comrade/, /Death Averted|Luck burns away/,
            /Trophy Rack/, /escapes: nobody has the cells/, /<b>A nemesis:<\/b>/, /Riders on the road behind you|means to burn your camp/, /^<p><b>Treasury [+-]/,
            /Devotion rises to|devotion to [^<]* slips to/, /<b>Fine gear:<\/b>/];   // R1 (checklist R, stage 4): Devotion and Fine gear are not taught in the Founding
  /* R1: a rival company's line (rivals-fog.js: "<b>Velvet Knives:</b> ..."); rivals are not met in the Founding */
  X.rivalLine = function(s){ try { const D = typeof RIVAL_DEFS !== 'undefined' ? RIVAL_DEFS : [];
    return D.some(r => r && r.name && s.indexOf('<b>' + r.name) >= 0); } catch (e) { return false; } };
  X.COIN = '<p data-so45="coin">';
  /* the first line that says the gate (or camp) held stays; the same words go from any later line */
  X.oneGate = function(lines){
    const re = /The (gate|camp) (held|holds)/, cut = /\s*The (gate|camp) (held|holds)[^.<]*\.?\s*/g; let seen = false;
    for (let i = 0; i < lines.length; i++){ const s = lines[i]; if (typeof s !== 'string' || !re.test(s)) continue;
      if (!seen){ seen = true; continue; }
      const t = s.replace(cut, ' ').replace(/>\s+/g, '>').replace(/\s+</g, '<').replace(/\s{2,}/g, ' '); if (!t.replace(/<[^>]+>/g, '').trim()){ lines.splice(i, 1); i--; } else lines[i] = t; }
    return lines;
  };
  X.allowed = () => { const s = W5().standingOnly || ['exiles', 'varnholt'], out = new Set(['varnholt']);
    for (const k of s) out.add(k === 'exiles' ? ((window.F34 && F34.SUN) || 'sunelves') : k); return out; };
  X.reportLines = function(lines, coin, c){
    const w = W5(), drill = !!(c && (c.obj === 'drill' || c.drill));   // R1: the drill pays nothing, so no money line
    for (let i = lines.length - 1; i >= 0; i--){
      let s = lines[i]; if (typeof s !== 'string') continue;
      if (X.DROP.some(r => r.test(s)) || X.rivalLine(s)){ lines.splice(i, 1); continue; }
      s = s.replace(/Deal with them on the Chapter screen\./, () => w.prisoners ? fill(w.prisoners.replace(/^\{n\} prisoners are held/, 'They are held'), {}) : 'Cayde will deal with them.');
      s = s.replace(/give 1 Advancement to each of (one Squad Mate|(\d+) different Squad Mates)<\/b>/, (m, a, n) => {
        const t = n ? (w.advMany ? fill(w.advMany, {n}) : m) : (w.advOne || m);
        return String(t).replace(/^The company learns from the contract: /, '').replace(/\.$/, '') + '</b>'; });
      lines[i] = s;
    }
    X.oneGate(lines);
    for (let i = lines.length - 1; i >= 0; i--) if (typeof lines[i] === 'string' && lines[i].indexOf(X.COIN) === 0) lines.splice(i, 1);
    if (!drill) lines.unshift(`${X.COIN}<b>${fill(w.coin || 'Coin home: {n} gp.', {n: coin | 0})}</b></p>`);
    if (!drill && c && c.rushed && (c.pay | 0) > 0 && (coin | 0) >= (c.pay | 0)) lines.splice(1, 0, `<p>${fill(w.paidRushed || 'The rushed job paid {n} gp, half.', {n: c.pay | 0})}</p>`);   // QA G2: the debrief shows the half the player was told; ND to word w.paidRushed
    return lines;
  };
  wrap('contractDebrief', f => function(c, result, lines){
    const on5 = X.founding(), M = gl('META'), t0 = M ? M.treasury | 0 : 0, S = window.SINKS, tithe = S && S.ON && S.ON.tithe;
    if (on5 && S && S.ON) S.ON.tithe = false;                       // no Tithe in the Founding: the line and the cut go together
    let r;
    try { r = f.apply(this, arguments); } finally { if (on5 && S && S.ON) S.ON.tithe = tithe; }
    try {
      if (lines && X.keepWon(c, result)) X.keepLines(lines);
    } catch (e) { console.warn('SO45 report', e); }
    try { const G = gl('G'); if (G && G.so45drag && lines){ G.so45drag = false; lines.unshift('<p>' + fill(X.TXT.dragged, {name: X.leader()}) + '</p>'); } } catch (e) {}   // K49: the Leader was dragged clear
    return r;
  });
  wrap('rollRaid', f => function(){ if (X.founding()) return; return f.apply(this, arguments); });
  wrap('shiftStanding', f => function(fac){ if (X.founding() && !X.allowed().has(fac)) return; return f.apply(this, arguments); });
  /* the Cleric card's {n} and the 'you' card's {key}: T45.lessonVars (lessons.js) */

  /* ---- B4 and B6: the gate cards ------------------------------------------------ */
  X.lessonOn = id => !!(window.T45 && T45.is(id));
  X.leader = () => { try { const M = gl('META'); return (M && M.leader && M.leader.name) || ''; } catch (e) { return ''; } };
  if (window.DEF30){
    const f = DEF30.onEvent; X._onEvent0 = f;
    DEF30.onEvent = function(k, c){
      try {
        if (k === 'breach' && c && c.f34gate && window.F34 && F34.active() && X.lessonOn('fallBack')){
          if (!c.f34lines){ c.f34lines = true; F34.breachLines(c).forEach(x => gl('note')(x)); }
          if (!c.so45fb){ c.so45fb = true; const G = gl('G');
            T45.lesson('fallBack', {vars: {leader: X.leader()}});
            if (c.f34 === 'b10' && X.lessonOn('withdraw') && G) G.so45w = G.frame + X.K.withdrawAfter; }
          return;
        }
        if (k === 'start' && c && c.f34gate && c.f34 === 'b8' && window.F34 && F34.active() && X.lessonOn('caltrop')){ const G = gl('G'); if (G) G.so45c = true; }
      } catch (e) { console.warn('SO45 event', e); }
      return typeof f === 'function' ? f.apply(this, arguments) : undefined;
    };
  }
  /* N9: DEF30 writes its general breach note just before D.ev('breach'); drop it when the fallBack card will show */
  X.n9drop = function(t){
    if (typeof t !== 'string' || !/^The raiders are through the gate\. Fall back/.test(t)) return false;
    const G = gl('G'), c = G && G.contract;
    return !!(c && c.f34gate && !c.so45fb && window.F34 && F34.active() && X.lessonOn('fallBack'));
  };
  wrap('note', f => function(t){ try { if (X.n9drop(t)) return; } catch (e) {} return f.apply(this, arguments); });
  /* one check a frame (the card waits for the first frame of the fight, so the screen is up) */
  X.tick = function(){
    const G = gl('G'); if (!G || G.over || !window.T45) return;
    if (G.so45c === true && !T45.cur){ G.so45c = 'shown';
      const n0 = (G.traps || []).filter(t => !t.enemy).length;
      T45.lesson('caltrop', {vars: {leader: X.leader()}, then(){ T45.gate('caltrop', () => (G.traps || []).filter(t => !t.enemy).length > n0 || !(G.prepT > 0), {vars: {leader: X.leader()}}); }}); }
    if (G.so45w && G.frame >= G.so45w && !T45.cur){ G.so45w = 0; { const d = (gl('G') && gl('G').def30 && gl('G').def30.sallyDir) || ''; const v = {leader: X.leader(), DIR: d, dir: d.toLowerCase()}; T45.lesson('withdraw', {vars: v, then(){ T45.gate('withdraw', () => { const g = gl('G'); return !g || g.over; }, {vars: v}); }}); } }
  };
  wrap('updateContract', f => function(){ const r = f.apply(this, arguments); try { X.tick(); } catch (e) {} try { X.unfreeze(); } catch (e) {} return r; });   // X.unfreeze: B1, below

  /* ---- B5 (UX re-check): the pay lands before contractDebrief and lines come after it, so the trim runs where the report is drawn */
  X.on5r = () => { const G = gl('G'); return !!(G && G.so45t0 != null && X.founding()); };
  wrap('renderDebrief', f => function(head, lines){
    try { if (X.on5r() && Array.isArray(lines)){ const M = gl('META'); X.reportLines(lines, (M.treasury | 0) - gl('G').so45t0, gl('G').contract); } } catch (e) { console.warn('SO45 render', e); }
    return f.apply(this, arguments); });
  if (window.DEBRIEF31UI){ const U = DEBRIEF31UI, h0 = U.headHTML, html0 = U.html;
    U.headHTML = function(){ if (X.on5r()) return '<div class="d31-head" style="display:none"></div>'; return h0.apply(this, arguments); };   // the body's Coin home is the one money line
    U.html = function(d){ try { if (X.on5r() && d && d.cards) d = Object.assign({}, d, {cards: d.cards.map(c => Object.assign({}, c, {gains: Object.assign({}, c.gains, {luckBurned: 0})}))}); } catch (e) {}
      return html0.call(this, d); };
    /* R1 (Planner, b8c5932): the Scribe opened a b10 win after the gate fell with "A clean return"; the town is lost */
    const sc0 = U.scribe; if (typeof sc0 === 'function') U.scribe = function(){ try { const G = gl('G'); if (G && G.so45lost) return X.TXT.scribeLost; } catch (e) {} return sc0.apply(this, arguments); }; }

  /* ---- K49: no Leader dies in the Founding ---------------------------------------- */
  X.k49on = () => X.founding();
  wrap('updateLeaderDown', f => function(){                         // skip the 8 s Bleeding Out roll
    try { const G = gl('G'), L = G && G.leader; if (X.k49on() && L && ((L.bleedT | 0) + 1) % 480 === 0) L.bleedT = (L.bleedT | 0) + 1; } catch (e) {}
    return f.apply(this, arguments); });
  wrap('endDeployment', f => function(result){
    try { const G = gl('G'), M = gl('META'); if (X.founding() && G && !G.over && M) G.so45t0 = M.treasury | 0; } catch (e) {}   // B5: Coin home is the whole report's change
    try { arguments[0] = X.k49map(gl('G'), result); } catch (e) {}
    try { const G = gl('G'); if (G && !G.over) G.so45lost = !!(X.keepWon(G.contract, arguments[0]) || X.b10out(G.contract, arguments[0])); } catch (e) {}   // R1 and N11: read by the Scribe line
    return f.apply(this, arguments); });
  X.b10out = (c, result) => !!(c && c.f34gate && c.f34 === 'b10' && X.founding() && (result === 'victory' || result === 'fled'));   // N11: the company lives, the town is lost
  X.k49map = (G, result) => { if (X.k49on() && G && result === 'fallen' && !G.over){ G.k49slain = !!G.leaderSlain; G.leaderSlain = false; G.so45drag = true; G.k49fallen = true; return 'fled'; } return result; };   // k49fallen: QA pass3, a road night still costs the column

  /* ---- B1: the signed Leader's own ability ----------------------------------------- */
  X.youStep = () => { const G = gl('G'); return !!(G && G.f45 && G.f45.a && G.f45.a.step === 'you'); };
  if (window.F45 && typeof F45.swap === 'function'){ const f = F45.swap;
    F45.swap = function(){ const r = f.apply(this, arguments);
      try { const G = gl('G'); if (G && G.leader){ delete G.leader.ab33; delete G.leader.lo33; delete G.leader.aim33; } } catch (e) { console.warn('SO45 swap', e); }
      return r; }; }
  /* A45.need records X.needSpec and A45.onUse counts only the Leader's own press (act1.js) */
  if (window.ABIL33 && typeof ABIL33.use === 'function'){ const f = ABIL33.use;
    ABIL33.use = function(u, opt){
      const c0 = X.caster, a0 = X.casterAuto; X.caster = u; X.casterAuto = !!(opt && opt.auto); X.counted = false;
      let r; try { r = f.apply(this, arguments); } finally { X.caster = c0; X.casterAuto = a0; }
      try { const G = gl('G'), M = gl('META');                       // a book ability on the Leader's key does not go through useAbility: count it here
        if (r && !X.counted && u === G.leader && !(opt && opt.auto) && X.youStep() && M && M.leader) A45.onUse(M.leader.spec); } catch (e) {}
      return r; }; }
  /* the field freeze resets G.abil[spec].cd; the ab33 cooldowns of that Specialty go too, once per freeze */
  X.unfreeze = function(){
    const G = gl('G'), s = G && G.f45 && G.f45.a; if (!s || !s.freeze || s.freeze === X._fz || !window.ABIL33) return;
    X._fz = s.freeze; const sp = X.needSpec;
    for (const u of ABIL33.units()){ const m = u.ab33; if (!m) continue;
      for (const id in m){ const R = ABIL33.REG[id]; if (R && R.spec === sp) m[id].cd = 0; } }
  };
  /* the legend line the 'you' card adds names the Leader's key: T45.legendYou, T45.keysOf (lessons.js, S6 1c) */
  /* F34.selfTest checks the old breach tips (the lessons-off path): it runs with the Founding's cards off; SO45.selfTest covers the cards */
  if (window.F34 && typeof F34.selfTest === 'function'){ const f = F34.selfTest;
    F34.selfTest = function(){ const lo = X.lessonOn; X.lessonOn = () => false; try { return f.apply(this, arguments); } finally { X.lessonOn = lo; } }; }

  /* ---- self-test (stubs; G, META and the switches are put back) ----------------- */
  X.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const G0 = gl('G'), act = window.F34 && F34.active, les = T45 && T45.lesson, gate = T45 && T45.gate, isf = T45 && T45.is, noteF = gl('note');
    const shown = [], notes = [];
    try {
      F34.active = () => true; T45.is = () => true;
      T45.lesson = function(id, o){ shown.push(id); if (o && o.then) o.then(true); return true; };
      T45.gate = function(id, test){ shown.push('gate ' + id); X._gt = test; return {}; };
      window.__so45n = s => notes.push(s); (0, eval)('note = window.__so45n');
      const TG = {frame: 100, over: false, sec: 200, def30: {breach: true, ko: new Set()}, traps: [], prepT: 600, contract: null};
      window.__so45g = TG; (0, eval)('G = window.__so45g');
      // B3
      const c10 = {f34gate: true, f34: 'b10', obj: 'defence'};
      ok('B3: b10 won after the breach: the gate broke, the Keep held, the town is lost', /broke, after 3m 20s.*Keep.*Varnholt is lost/.test(gl('contractHow')(c10, 'victory')));
      const L3 = ['<p>The assault on the North Gate was thrown back, in 3m 20s.</p>', '<p class="good">The gate holds.</p>', '<p>Hal is hurt.</p>'];
      X.keepLines(L3); ok('B3: "The gate holds" and "thrown back" go; other lines stay', L3.length === 1 && /Hal/.test(L3[0]), L3.join('|'));
      { const L2 = ['<p>The company learns from the contract: <b>give 1 Advancement</b>.</p>', '<p class="good">The gate holds. <b>Hal</b> stood <i>firm</i>.</p>', '<p>The walls are battered. The gate holds.</p>']; X.keepLines(L2);
        ok('R2: a line without "The gate holds." keeps its spaces', L2[0] === '<p>The company learns from the contract: <b>give 1 Advancement</b>.</p>', L2[0]);
        ok('R2: a line that held it loses only that sentence', L2[1] === '<p class="good"><b>Hal</b> stood <i>firm</i>.</p>' && L2[2] === '<p>The walls are battered.</p>', L2[1] + ' | ' + L2[2]); }
      ok('B3: a gate never breached is not touched', (TG.def30.breach = false, !X.keepWon(c10, 'victory')) && (TG.def30.breach = true, X.keepWon(c10, 'victory')) && !X.keepWon(c10, 'defeat') && !X.keepWon({f34gate: true, f34: 'b9'}, 'victory'));
      ok('N11: a b10 Founding the company flees or wins is a lost town', X.b10out(c10, 'fled') && X.b10out(c10, 'victory') && !X.b10out(c10, 'defeat') && !X.b10out({f34gate: true, f34: 'b9'}, 'fled'));
      if (window.DEBRIEF31UI){ const h = {result: 'victory', title: 'Hold the North Gate', place: 'Varnholt', chronicle: {outcome: 'win', title: 'Hold the North Gate', place: 'Varnholt', host: 'the enemy', dead: 0}};
        TG.so45lost = true; ok('R1: the Scribe line on a b10 win after the breach says the town is lost', DEBRIEF31UI.scribe(h) === X.TXT.scribeLost && !/clean return/i.test(DEBRIEF31UI.scribe(h)));
        TG.so45lost = false; ok('R1: other wins keep their Scribe line', DEBRIEF31UI.scribe(h) !== X.TXT.scribeLost); delete TG.so45lost; }
      // N9
      { const BR = 'The raiders are through the gate. Fall back and save the buildings. If they stay inside long enough they will find the Vault.';
        TG.contract = c10; ok('N9: the general breach note is dropped when the fallBack card will show', X.n9drop(BR));
        ok('N9: other notes stay', !X.n9drop('The gate gives way. Its timbers were cracked by every ram before this one.'));
        TG.contract = {obj: 'defence'}; ok('N9: outside the Founding gate fights the note stays', !X.n9drop(BR));
        TG.contract = null; }
      // B4
      DEF30.onEvent('breach', c10);
      ok('B4: the breach shows the fallBack card and none of the three tips', shown.includes('fallBack') && !notes.some(s => /^Tip: /.test(s)), shown.join() + ' / ' + notes.join('|'));
      ok('B4: on b10 the withdraw card is set for K.withdrawAfter frames later', TG.so45w === 100 + X.K.withdrawAfter);
      T45.cur = null; X.tick(); ok('B4: not before', !shown.includes('withdraw'));
      TG.frame = 100 + X.K.withdrawAfter; X.tick(); ok('B4: then the withdraw card', shown.includes('withdraw') && !TG.so45w);
      DEF30.onEvent('breach', c10); ok('B4: once a fight', shown.filter(x => x === 'fallBack').length === 1);
      const c9 = {f34gate: true, f34: 'b9', obj: 'defence'}; DEF30.onEvent('breach', c9);
      ok('B4: a b9 breach gets the fallBack card, no withdraw', shown.filter(x => x === 'fallBack').length === 2 && !TG.so45w);
      // B6
      const c8 = {f34gate: true, f34: 'b8', obj: 'defence'}; shown.length = 0;
      DEF30.onEvent('start', c8); ok('B6: b8 start marks the caltrop card for the first frame', TG.so45c === true && !shown.length);
      X.tick(); ok('B6: the caltrop card, then its gate', shown.join() === 'caltrop,gate caltrop', shown.join());
      ok('B6: the gate waits for a trap', X._gt && !X._gt()); TG.traps.push({kind: 'caltrops', enemy: false}); ok('B6: one trap set passes it', X._gt());
      TG.traps.length = 0; TG.prepT = 0; ok('B6: the Prepare round ending passes it too', X._gt());
      shown.length = 0; TG.so45c = undefined; DEF30.onEvent('start', c9); X.tick(); ok('B6: not on b9', !shown.length);
      // B5
      const w = W5(), L5 = ['<p><b>Treasury +120gp</b>: Contract: 100gp · Hazard Upkeep: -20gp. Now 300gp.</p>', '<p class="good">Hal and Ves have become Comrades: +1 step when they fight side by side.</p>',
        '<p>The Masters\' Tithe: <b>-12gp</b>, a fifth of the pay.</p>', '<p class="bad">Captured Skulk Crossbowman escapes: nobody has the cells to hold them.</p>',
        '<p class="good">The company learns from the contract: <b>give 1 Advancement to each of one Squad Mate</b>. Squad Mates may hold up to 2.</p>',
        '<p class="good">Prisoners brought home: Bo. Deal with them on the Chapter screen.</p>', '<p>Hal is hurt.</p>'];
      X.reportLines(L5, 108);
      ok('B5: one money line, first', L5[0] === `${X.COIN}<b>${fill(w.coin || 'Coin home: {n} gp.', {n: 108})}</b></p>` && L5.filter(s => /gp/.test(s)).length === 1, L5[0]);
      ok('B5: a loss shows as the real figure, not 0', (() => { const Lx = ['<p>x</p>']; X.reportLines(Lx, -12); return /-12 gp/.test(Lx[0]); })());
      ok('K49: a Leader bled out with mates up is no wipe (k49slain)', (() => { const g = {over: false, leaderSlain: true}; X.k49map(g, 'fallen'); return g.k49slain === true; })());
      ok('B5: no Upkeep, Tithe, Comrades or prisoner escape', !L5.some(s => /Upkeep|Tithe|Comrades|escapes/.test(s)));
      ok('B5: "each of one" reads right', L5.some(s => /<b>give 1 Advancement to a Squad Mate<\/b>/.test(s)) || (!w.advOne && L5.some(s => /each of one/.test(s))), L5.find(s => /Advancement/.test(s)));
      ok('B5: prisoners: Cayde deals with them', L5.some(s => /Cayde will deal with them/.test(s)) && !L5.some(s => /Chapter screen/.test(s)));
      ok('B5: other lines stay', L5.includes('<p>Hal is hurt.</p>'));
      { const L = ['<p><b>Treasury +196gp</b>: Contract: 160gp. Now 400gp.</p>', '<p class="good">The gate held. Not one of them got inside the walls.</p>', '<p class="bad"><b>A nemesis:</b> Ulric got away, and will remember the Chapter.</p>',
          '<p><b>Detailed Salvage:</b> 8 enemy squads picked over at Tier 1. <b>+110gp</b>.</p>', '<p class="good"><i>The gate held. Varnholt gets another day.</i></p>', '<p class="good">The gate holds.</p>'];
        X.reportLines(L, 306); X.reportLines(L, 366);
        ok('B5 re-check: run twice (a redraw), still one Coin home line, the new sum', L.filter(x => x.indexOf(X.COIN) === 0).length === 1 && /366/.test(L[0]) && L.filter(s => /gp/.test(s)).length === 1, L[0]);
        ok('B5 re-check: no nemesis or Detailed Salvage line', !L.some(x => /nemesis|Salvage/.test(x)));
        ok('B5 re-check: the gate held is said once', L.filter(x => /The gate (held|holds)/.test(x)).length === 1 && L.some(x => /Not one of them/.test(x)) && L.some(x => /^<p class="good"><i>Varnholt gets another day/.test(x)), L.join('|')); }
      if (window.DEBRIEF31UI){ TG.so45t0 = 0; F34.active = () => true;
        ok('B5 re-check: the Pay, Treasury and Spoils header is hidden in the Founding', /display:none/.test(DEBRIEF31UI.headHTML({pay: 5, spoils: []})));
        const h = DEBRIEF31UI.html({header: {pay: 5, spoils: []}, cards: [{id: 'x', name: 'Hal', kills: 1, outcome: 'unhurt', gains: {luckBurned: 1}}]});
        ok('B5 re-check: no "Luck burned" on a card', !/Luck burned/.test(h));
        delete TG.so45t0; ok('B5 re-check: outside the Founding report the header is back', /Pay/.test(DEBRIEF31UI.headHTML({pay: 5, spoils: []}))); }
      ok('B5: Standing moves only for the Exiles and Varnholt', X.allowed().has((window.F34 && F34.SUN) || 'sunelves') && X.allowed().has('varnholt') && !X.allowed().has('mendor'));
      { const M = gl('META'), st0 = M.standing; M.standing = {}; const out = [];
        gl('shiftStanding')('mendor', -1, out); const a = !M.standing.mendor && !out.length;
        F34.active = () => false; gl('shiftStanding')('mendor', -1, out); const b = M.standing.mendor === -1;
        F34.active = () => true; M.standing = st0;
        ok('B5: in the Founding an unmet faction does not move; outside it, it does', a && b); }
      ok('B5: no raid is rolled in the Founding', (() => { const M = gl('META'), r0 = M.raid; M.raid = null; gl('rollRaid')({obj: 'hunt'}, []); const a = !M.raid; M.raid = r0; return a; })());
      { const ms = gl('mateStats');
        try { window.__so45ms = () => ({magic: 3}); (0, eval)('mateStats = window.__so45ms');
          const o = {face: {}, vars: {name: 'Maud'}}; T45.lessonVars('cleric', o); const seen = o.vars;
          ok('B5: the Cleric card gets {n} from the hire', seen && seen.n === 3 && seen.name === 'Maud', JSON.stringify(seen)); }
        finally { window.__so45ms = ms; (0, eval)('mateStats = window.__so45ms'); delete window.__so45ms; } }
      /* K49 */
      { const L = {x: 0, y: 0, bleedT: 479, helpT: 0, helpNeed: 99, s: {luck: 0}}, TG2 = {frame: 0, leader: L, squad: [{state: 'up', x: 900, y: 900, p: {name: 'Hal'}}], over: false};
        window.__so45g2 = TG2; (0, eval)('G = window.__so45g2'); F34.active = () => true; notes.length = 0;
        gl('updateLeaderDown')(); ok('K49: no Bleeding Out roll in the Founding', L.bleedT === 481 && !notes.length, L.bleedT);
        const g = {over: false, leaderSlain: true}; ok('K49: fallen becomes fled, the Leader lives', X.k49map(g, 'fallen') === 'fled' && !g.leaderSlain && g.so45drag && g.k49fallen);
        ok('K49: other results stand', X.k49map({}, 'victory') === 'victory');
        F34.active = () => false; ok('K49: outside the Founding no change', X.k49map({over: false}, 'fallen') === 'fallen');
        delete window.__so45g2; }
      /* B1 */
      { const M = gl('META'), ld0 = M.leader, L = {x: 0, y: 0, spec: 'SOLDIER', ab33: {bash: {cd: 50}}}, hal = {x: 10, y: 0, spec: 'SOLDIER', state: 'up', p: {name: 'Hal'}, ab33: {bash: {cd: 30}}},
          ves = {spec: 'SCOUNDREL', state: 'up', p: {name: 'Ves'}, ab33: {called: {cd: 40}}}, a = {step: 'you', use: {}};
        const TG3 = {frame: 0, over: false, contract: {f45: true}, f45: {a}, leader: L, squad: [hal, ves], enemies: []};
        window.__so45g3 = TG3; (0, eval)('G = window.__so45g3'); M.leader = {name: 'Ana', spec: 'SOLDIER'};
        try {
          X.caster = hal; X.casterAuto = false; A45.onUse('SOLDIER'); ok("B1: a mate's press does not pass the 'you' gate", !a.use.SOLDIER);
          X.caster = L; X.casterAuto = true; A45.onUse('SOLDIER'); ok('B1: nor the Leader on auto', !a.use.SOLDIER);
          X.casterAuto = false; A45.onUse('SOLDIER'); ok("B1: the Leader's own press does", a.use.SOLDIER === 1);
          a.step = 'soldier'; X.caster = hal; A45.onUse('SOLDIER'); ok('B1: other steps count as before', a.use.SOLDIER === 2);
          X.caster = undefined; a.step = 'you';
          a.freeze = {}; X.needSpec = 'SOLDIER'; X.unfreeze();
          ok('B1: the freeze zeroes that Specialty ab33 cooldowns only', L.ab33.bash.cd === 0 && hal.ab33.bash.cd === 0 && ves.ab33.called.cd === 40);
          L.ab33.bash.cd = 9; X.unfreeze(); ok('B1: once per freeze', L.ab33.bash.cd === 9);
          const v = {key: '1'}, o = {vars: v}; T45.lessonVars('you', o); const seen = o.vars;
          ok("B1: the 'you' card names the Leader's key", seen === v && v.key === 'E', v.key);
          const st = T45.st(), lg0 = st.legend.slice(); T45.legend('{key} ' + ABILITIES.SOLDIER.name, 'SOLDIER');
          TG3.abil = {SOLDIER: {cd: 0}}; const ll = T45.legendList(), nmS = ABILITIES.SOLDIER.name, liveK = !!(window.ABIL33 && ABIL33.live());
          ok('B1: the legend reads E for the Leader (S6 1c: and 1 for Hal, read when drawn, never stored)', !liveK || (ll.includes('E ' + nmS) && ll.includes('1 ' + nmS) && !st.legend.includes('E ' + nmS)), ll.join(' | '));
          st.legend.length = 0; st.legend.push(...lg0);
        } finally { M.leader = ld0; delete window.__so45g3; }
      }
      { const st0 = F34.state, ac0 = F34.active; try {
          F34.active = () => true;
          F34.state = () => ({beat: 10, log: [{id: 'b10', r: 'victory'}]}); const a = X.founding();
          F34.state = () => ({beat: 11, log: [{id: 'b10', r: 'victory'}, {id: 'b11', r: 'done'}]}); const b = X.founding();
          ok('QA: after Kalloon (b11 done) it is the open game, not the Founding', a && !b, a + ' ' + b);
        } finally { F34.state = st0; F34.active = ac0; } }
      ok('wrappers in place', typeof X._contractHow === 'function' && typeof X._contractDebrief === 'function' && typeof X._updateContract === 'function' && typeof X._rollRaid === 'function' && typeof X._note === 'function');
    } catch (e) { ok('no throw', false, e.message + ' ' + (e.stack || '').split('\n')[1]); }
    finally {
      window.__so45g = G0; (0, eval)('G = window.__so45g'); delete window.__so45g;
      window.__so45n = noteF; (0, eval)('note = window.__so45n'); delete window.__so45n;
      if (window.F34) F34.active = act; if (window.T45){ T45.lesson = les; T45.gate = gate; T45.is = isf; T45.cur = null; } delete X._gt;
    }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
