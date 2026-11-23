/* Index ARCS1: patron and faction story arcs (Fable job 10, wishlist Narrative 3; audits/fable/arcs.md).
   Four three-contract arcs, one per faction (mendor, reprobates, skulk, suderia). An arc opens by itself (Patrick,
   2026-11-11) when standing with the faction is +1 or better and the leader is level 3 or more; one arc is live at a
   time and its next step sits on the planning table as a real contract of an existing kind. Each step's result
   (win / loss / withdrew) picks the next: a win leads to the warm step, a loss or withdrawal to the cold one
   (s1 -> s2w|s2c -> s3ww|s3wc|s3cw|s3cc). The third step pays double and ends the arc warm (standing +1 and a lasting
   reward) or cold (the reward line only).

   DATA   META.arcs = {live: faction|null, [faction]: {step, path, done: 'warm'|'cold'|null, at}}; created on first use.
          An arc contract carries c.arc (faction), c.arcStep, c.arcTitle; its brief and title are filled when it is made,
          so a save keeps playing it even if the lines file goes missing.
   LINES  window.ARC_LINES (Narrative's js/lines/arc.js) or the placeholders below. ARC_LINES[f] = {title, steps:{s1, s2w,
          s2c, s3ww, s3wc, s3cw, s3cc}, reward:{warm, cold}}; STEP = {title, obj, host, place, brief, result:{win, loss, withdrew}}.
          Tokens {P} patron, {F} faction, {L} leader, {C} the place in a brief and the step's title in a result line.
   HOOKS  rollBoard and ensureMuster (the step goes on the board, never beside a Charter Finale), renderTable (the tag),
          renderDebrief (the record and the result line), setupContract (the lasting rewards).
   KNOBS  ARCS.minStanding (1), ARCS.minLevel (3), ARCS.order (which faction opens first when several qualify). No switch (removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  const A = window.ARCS = {minStanding: 1, minLevel: 3, order: ['mendor', 'reprobates', 'skulk', 'suderia']};
  const STEPS = ['s1', 's2w', 's2c', 's3ww', 's3wc', 's3cw', 's3cc'];
  const stub = (f, name) => { const S = {}; for (const k of STEPS) S[k] = {title: name + ' ' + k, obj: 'hunt', host: 'bandits', place: 'Thornwood', brief: '{P} has work for {L} near {C}. (' + k + ')', result: {win: '{C}: done, and {P} is pleased.', loss: '{C}: lost. {P} is not.', withdrew: '{C}: {L} pulled back.'}}; return {title: name, steps: S, reward: {warm: '{F} remember {L}.', cold: '{F} send a small apology.'}}; };
  A.STUB = {mendor: stub('mendor', "The Order's Errand"), reprobates: stub('reprobates', "The Collective's Debt"), skulk: stub('skulk', "The Skulk's Errand"), suderia: stub('suderia', "The Free Lands' Charter")};
  const lines = () => (typeof window.ARC_LINES === 'object' && window.ARC_LINES) || A.STUB;
  A.usingStub = () => lines() === A.STUB;
  const arcOf = f => { const L = lines(); return L[f] && L[f].steps ? L[f] : A.STUB[f]; };

  const state = () => { if (!META.arcs || typeof META.arcs !== 'object') META.arcs = {live: null}; return META.arcs; };
  const rec = f => { const S = state(); if (!S[f] || typeof S[f] !== 'object') S[f] = {step: 's1', path: '', done: null, at: META.deployments || 0}; return S[f]; };
  const stepOf = r => r.path.length === 0 ? 's1' : r.path.length === 1 ? 's2' + r.path : 's3' + r.path;
  const fill = (s, t) => String(s).replace(/\{([PFLC])\}/g, (m, k) => t[k] != null ? t[k] : m);
  const tokens = (f, place) => ({P: FACTIONS[f].patron, F: typeof facName === 'function' ? facName(f) : FACTIONS[f].name, L: META.leader ? META.leader.name : 'the leader', C: place});
  const safeHost = h => (typeof HOSTS !== 'undefined' && HOSTS[h]) ? h : null;

  /* ---- making a step's contract ---- */
  A.make = function(f){
    const r = rec(f), key = stepOf(r), st = arcOf(f).steps[key] || A.STUB[f].steps[key];
    const lvl = META.leader ? META.leader.level : 1, last = key.length === 4;
    const obj = CONTRACTS[st.obj] ? st.obj : 'hunt', tier = last ? (lvl >= 5 ? 3 : 2) : (lvl >= 3 ? 2 : 1);
    const c = makeContract(obj, tier);
    const host = safeHost(st.host) || c.host, place = st.place || c.place;
    Object.assign(c, {host, place, patron: FACTIONS[f].patron, faction: f, arc: f, arcStep: key, arcTitle: arcOf(f).title, title: st.title, edges: [], council: null, picks: 0});
    if (obj === 'rescue'){ c.hostFaction = f; c.town = place; }
    c.brief = fill(st.brief, tokens(f, place));
    if (last) c.pay = Math.round(c.pay * 2 / 5) * 5;
    return c;
  };
  A.stepNo = c => c.arcStep === 's1' ? 1 : c.arcStep.length === 3 ? 2 : 3;

  /* ---- opening and placing ---- */
  A.qualifies = f => !rec(f).done && standing(f) >= A.minStanding && !!META.leader && META.leader.level >= A.minLevel;
  A.ensure = function(){
    if (!META || !META.leader || !META.board || !META.board.length) return false;
    if (META.board.some(c => c.finale) || META.board.some(c => c.arc)) return false;
    const S = state();
    if (S.live && (rec(S.live).done || !FACTIONS[S.live])) S.live = null;
    if (!S.live){ const f = A.order.find(A.qualifies); if (!f) return false; S.live = f; rec(f); }
    const i = META.board.length > 1 ? 1 : 0;
    META.board[i] = A.make(S.live);
    saveMeta();
    return true;
  };
  if (typeof rollBoard === 'function'){ const f = rollBoard; rollBoard = function(){ const r = f.apply(this, arguments); try { A.ensure(); } catch (e) { console.warn('ARCS ensure', e); } return r; }; }
  if (typeof ensureMuster === 'function'){ const f = ensureMuster; ensureMuster = function(){ try { if (META && META.board) A.ensure(); } catch (e) { console.warn('ARCS ensure', e); } return f.apply(this, arguments); }; }

  /* ---- the tag on the planning table ---- */
  if (typeof renderTable === 'function'){ const f = renderTable; renderTable = function(){ const r = f.apply(this, arguments); try {
    if (!META.board) return r; const els = document.querySelectorAll('.cscroll');
    META.board.forEach((c, i) => { const el = els[i]; if (!c.arc || !el || el.querySelector('.arc-tag')) return;
      const t = document.createElement('div'); t.className = 'tag arc-tag'; t.style.background = '#4a3270'; t.textContent = (c.arcTitle || FACTIONS[c.arc].name) + ' · ' + A.stepNo(c) + ' of 3';
      const ttl = el.querySelector('.ttl'); if (ttl) el.insertBefore(t, ttl); else el.appendChild(t); });
  } catch (e) {} return r; }; }

  /* ---- the record at the debrief ---- */
  A.record = function(c, result, out){
    const f = c.arc, r = rec(f), key = c.arcStep || stepOf(r), st = arcOf(f).steps[key] || A.STUB[f].steps[key];
    const o = result === 'victory' ? 'win' : result === 'withdrawn' ? 'withdrew' : 'loss', t = tokens(f, st.title || c.title);
    out.push('<p class="' + (o === 'win' ? 'good' : 'bad') + '"><b>' + esc(arcOf(f).title) + ':</b> ' + esc(fill(st.result[o] || '', t)) + '</p>');
    if (key.length < 4){ r.path += (o === 'win' ? 'w' : 'c'); r.step = stepOf(r); return 'next'; }
    r.done = o === 'win' ? 'warm' : 'cold'; r.step = 'done'; if (state().live === f) state().live = null;
    const R = arcOf(f).reward || A.STUB[f].reward;
    out.push('<p class="' + (r.done === 'warm' ? 'good' : '') + '">' + esc(fill(R[r.done] || '', t)) + '</p>');
    if (r.done === 'warm'){
      if (typeof shiftStanding === 'function') shiftStanding(f, 1, out);
      if (f === 'suderia' && typeof rollRecruit === 'function' && META.roster.length < rosterCap()){ const p = rollRecruit('FREEMAN'); p.id = META.nextId++; p.conTrained = 1; META.roster.push(p); out.push('<p class="good">' + esc(p.name) + ', a ' + esc(RACES[p.race].name + ' ' + SPECS[p.spec].name) + ' of the Free Lands, joins the roster.</p>'); }
    }
    return r.done;
  };
  if (typeof renderDebrief === 'function'){ const f = renderDebrief; renderDebrief = function(head, out){
    try { if (G && G.over && G.contract && G.contract.arc && !G.arcDone && Array.isArray(out)){ G.arcDone = true; A.record(G.contract, G.result, out); saveMeta(); } } catch (e) { console.warn('ARCS record', e); }
    return f.apply(this, arguments); }; }

  /* ---- lasting rewards, at the start of every later contract ---- */
  A.rewards = () => { const S = META && META.arcs; return S ? A.order.filter(f => S[f] && S[f].done === 'warm') : []; };
  if (typeof setupContract === 'function'){ const f = setupContract; setupContract = function(c){ const r = f.apply(this, arguments); try {
    if (!G) return r; const R = A.rewards();
    if (R.includes('mendor')) G.wards = Math.min(4, (G.wards || 0) + 1);
    if (R.includes('reprobates') && G.caches && G.leader) G.caches.push({x: G.leader.x + 60, y: G.leader.y + 50, kind: 'cusser', opened: false});
    if (R.includes('skulk') && G.blips && G.blips.length){ const b = G.blips.find(x => !x.known); if (b) b.known = d6(); }
  } catch (e) { console.warn('ARCS rewards', e); } return r; }; }

  A.selfTest = function(){
    const out = [], ok = (n, c) => out.push((c ? 'ok   ' : 'FAIL ') + n);
    const was = META, G0 = G, sv0 = saveMeta;
    try {
      saveMeta = () => {};                                          // the test works on a copy; nothing may reach the save (a leaderless save got the stub Leader 'Testa')
      META = JSON.parse(JSON.stringify(was)); META.leader = Object.assign({}, META.leader || {}, {name: 'Testa', level: 5}); META.standing = {mendor: 1}; META.arcs = undefined; META.deployments = 3;
      META.roster = (META.roster || []).slice(0, 2); META.board = ['hunt', 'extract', 'escort'].map(o => makeContract(o, 1));
      ok('old save: no META.arcs, qualifies by standing and level', A.qualifies('mendor') && !A.qualifies('skulk'));
      ok('ensure opens the Mendor arc into slot 1', A.ensure() && META.board[1].arc === 'mendor' && META.board[1].arcStep === 's1' && META.arcs.live === 'mendor');
      const c1 = META.board[1];
      ok('step 1 is a real contract with the lines filled', CONTRACTS[c1.obj] && HOSTS[c1.host] && c1.title && !/\{[PFLC]\}/.test(c1.brief) && c1.faction === 'mendor');
      ok('a second ensure leaves the board alone', !A.ensure() && META.board.filter(c => c.arc).length === 1);
      META.board[0].finale = true; META.board[1] = makeContract('hunt', 1);
      ok('never beside a Charter Finale', !A.ensure() && !META.board.some(c => c.arc)); delete META.board[0].finale;
      let L = []; ok('step 1 win leads to s2w', A.record(c1, 'victory', L) === 'next' && META.arcs.mendor.step === 's2w' && L.length === 1 && /good/.test(L[0]) && !/\{[PFLC]\}/.test(L[0]));
      META.board = ['hunt'].map(o => makeContract(o, 1)); A.ensure(); const c2 = META.board[0];
      ok('step 2 goes on a one-slot board, tier 2, step 2 of 3', c2.arc === 'mendor' && c2.arcStep === 's2w' && c2.tier === 2 && A.stepNo(c2) === 2);
      L = []; ok('step 2 withdrawal leads to s3wc', A.record(c2, 'withdrawn', L) === 'next' && META.arcs.mendor.step === 's3wc');
      META.board = ['hunt', 'hunt'].map(o => makeContract(o, 1));
      { const mk = makeContract; makeContract = function(){ return Object.assign(mk.apply(this, arguments), {pay: 100}); };   // fixed base pay: a random plain contract made this row flaky
        try { A.ensure(); } finally { makeContract = mk; } }
      const c3 = META.board[1];
      ok('step 3 is tier 3 and pays double', c3.arcStep === 's3wc' && c3.tier === 3 && c3.pay === 200);
      const s0 = standing('mendor'); L = [];
      ok('step 3 win ends warm: standing +1, reward line, arc closed', A.record(c3, 'victory', L) === 'warm' && standing('mendor') === s0 + 1 && META.arcs.mendor.done === 'warm' && META.arcs.live === null && L.length >= 3);
      ok('a done arc never reopens', !A.qualifies('mendor') && A.rewards().includes('mendor'));
      META.standing = {suderia: 2}; META.board = ['hunt', 'hunt'].map(o => makeContract(o, 1)); A.ensure(); const s1 = META.board[1];
      ok('the next qualifying faction opens (suderia)', s1.arc === 'suderia' && META.arcs.live === 'suderia');
      const r2 = rec('suderia'); r2.path = 'cc'; r2.step = 's3cc'; META.board = ['hunt', 'hunt'].map(o => makeContract(o, 1)); A.ensure(); L = [];
      const n0 = META.roster.length; ok('cold ending: no standing shift, no recruit', A.record(META.board[1], 'fled', L) === 'cold' && standing('suderia') === 2 && META.roster.length === n0 && META.arcs.suderia.done === 'cold');
      META.arcs.suderia = undefined; META.arcs.live = null; const r3 = rec('suderia'); r3.path = 'ww'; r3.step = 's3ww'; META.board = ['hunt', 'hunt'].map(o => makeContract(o, 1)); A.ensure(); L = [];
      ok('warm suderia ending recruits a Freeman', A.record(META.board[1], 'victory', L) === 'warm' && META.roster.length === n0 + 1 && META.roster[n0].conTrained === 1);
      for (const f of A.order){ const a = arcOf(f); ok('lines ' + f + ': 7 steps, real keys', STEPS.every(k => a.steps[k] && CONTRACTS[a.steps[k].obj] && HOSTS[a.steps[k].host] && a.steps[k].brief && a.steps[k].result && a.steps[k].result.win && a.steps[k].result.loss && a.steps[k].result.withdrew) && a.reward && a.reward.warm && a.reward.cold); }
      ok('lines source: ' + (A.usingStub() ? 'placeholders (js/lines/arc.js not loaded)' : 'ARC_LINES'), true);
    } catch (e) { out.push('FAIL threw ' + (e && e.message)); }
    finally { META = was; G = G0; saveMeta = sv0; }
    const fails = out.filter(l => l.startsWith('FAIL')).length; console.log('ARCS selfTest\n' + out.join('\n')); return {pass: out.length - fails, fail: fails, lines: out, ok: fails === 0};
  };
})();
