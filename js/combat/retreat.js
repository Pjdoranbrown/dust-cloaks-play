/* ---------------------------------------------------------------------------
   INDEX RT45 - F-45 (i)(j): the organised retreat of the wagons, and a stake on
   every Long Road night (Lead Programmer, 2026-11-15)
   Design: audits/f45-retreat-wagons.md, Patrick's answers in the bible (2026-11-15).

   (i) On a Long Road night, Sound the Retreat is one Personality roll:
       against 4, 5 or 6 as Withdraw; +1 if the Ledger Wagon is damaged; one
       step easier if a band is hired (the rearguard).
       Full:    the wagons get away. Nobody lost. Half a day of progress lost.
       Partial: Column -1, one mate rests, the coin is dropped, the wagon is hit.
       Miss:    Column -2, a fitting lost, the coin dropped, a mate captured,
                the band walks away, no second try that night. The fight goes on.
       A captured mate is rescued by winning the next night's fight; a second
       miss in a row loses them for good.
   (j) Stakes: the Parley costs Supply whatever the roll and gold to take a band
       on; a defended night wears the wagon; the same choice two nights running
       gets harder.

   Every number in RT45.K is a draft [S]. Words in RT45.TXT are Narrative's.
   No switch: the organised retreat and its stakes are the rule on a Long Road night (RT45.on, RT45.stakes and
   their URL flags were removed in INT-1, 2026-11-15).
   Self-test: RT45.selfTest() (starts no fight, writes no save).
--------------------------------------------------------------------------- */
(function(){
  'use strict';
  const RT = window.RT45 = {log: [], force: null, _t: false};

  const K = RT.K = {                    // all [S]
    damaged: 1,        // + difficulty when the Ledger Wagon is below full
    band: -1,          // a hired band as rearguard
    repeat: 1,         // + difficulty when last night was a retreat too
    partCol: 1, missCol: 2,
    partWagon: 25,     // Ledger Wagon damage on a ragged retreat
    missWagon: 40,     // on a rout, when there is no fitting to lose
    rest: 1,           // nights the hurt mate sits out
    halfSupply: 1,     // half a day's food
    halves: 2,         // half-days that add one night to the road
    scene: 240,        // frames (about 4 s)
    wear: 10,          // wagon wear on any defended night
    wearRepeat: 10,    // extra wear when last night was defended too
    parleySupply: 1,   // the Parley order, whatever the roll
    parleyGold: 20     // taking a band on
  };
  const T = RT.TXT = {
    title: 'Sound the Retreat: wagons away',
    button: 'SOUND THE RETREAT',
    noBand: 'No rearguard today. The wagons go alone.',
    parley: 'today’s parley, {band} hold the rear.',
    full: ['The wagons turn in order, one after another, and the dark folds behind them. Nobody is left on the road.', 'The rearguard holds the road for the count of a hundred. Then the wagons are gone, and so are you.'],
    partial: ['The wagons get away, but a wheel goes and a cart is left in the ditch. Someone is limping.', 'The retreat is ragged. The wagons clear the bend, and the coin carried is left behind.'],
    miss: ['The rear is cut. The last wagon is lost in the dark, and some of the column with it.', 'The wagons were not ready. The raiders were.'],
    hud: {full: 'THE WAGONS ARE AWAY', partial: 'THE WAGONS ARE AWAY, ROUGHLY', miss: 'THE REAR IS CUT'},
    band: {
      faithful: 'The Faithful hold the rear in a shield line, and give ground a step at a time.',
      deepshaft: 'The Deepshaft sappers drop a bank behind the last wagon, and the raiders stop.',
      rowan: 'The Rowan riders swing wide round the raiders and call them off the road.',
      rustpikes: 'The Rust-Pikes close ranks on the road and let the wagons pass behind the lances.',
      ridge: 'The Ridge-Striders take the ridge and shoot down at the raiders until the wagons clear.'
    },
    // drafts [N] below: not in the audit
    noRetry: 'The rear is cut. There is no second retreat tonight.',
    halfDay: 'The column gives up half a day of road: -{n} Supply.',
    extraNight: 'Two half-days make a day. The column camps short again: Night {n} is still ahead.',
    hurt: '{name} is hurt in the scramble and rests the next night.',
    wagonHit: 'The Ledger Wagon takes {n} damage.',
    fitting: 'A wagon is lost at the rear, and the {name} with it, for good.',
    wagonLost: 'A wagon is lost at the rear. The Ledger Wagon takes {n} damage.',
    captured: '{name} is cut off with the rearguard and taken alive. Win tomorrow night’s fight to bring them back. A second rout loses them for good.',
    rescued: '{name} is found tied behind the raiders’ line and cut loose. They rest the next night.',
    held: '{name} is still held by the raiders.',
    lost: '{name} was not seen again after the second rout.',
    home: '{name} walks in behind the column, thin and silent, and rests.',
    bandLoss: '{band} lose one of their own holding the rear.',
    bandWalk: '{band} are cut off and do not come back. Their share of tonight is void.',
    wear: 'A night of fighting round the Ledger Wagon wears it: -{n}.',
    wearRepeat: 'The raiders have learned where the wagon stands. It takes the worst of a second night: -{n}.',
    parleySupply: 'Recruit a band: bread and beer for the talk, whatever the answer: -{n} Supply.',
    parleyGold: 'A purse up front seals it: -{n}gp.',
    purse: 'A purse up front seals it: {n}gp.'   // shown under the offer; the button keeps the band words
  };

  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] != null ? o[k] : m));
  const pick = a => a[Math.random() * a.length | 0];
  const C_ = () => (typeof CP === 'function' ? CP() : null);
  const testKey = () => !RT._t && typeof SAVE_KEY === 'string' && SAVE_KEY.indexOf('__') === 0;   // other modules' self-tests see the old rules
  const road = () => { const C = C_(); return !!(C && C.part === 'road' && !testKey()); };
  RT.live = () => !!(road() && typeof G !== 'undefined' && G && G.obj === 'night');
  const LR = () => window.LR34;
  const bandOf = C => (C && C.hired && C.band30 && LR() && LR().isBand(C.band30)) ? C.band30 : null;
  const bandName = id => { try { const n = {faithful: 'The Emperor’s Faithful', deepshaft: 'The Deepshaft Company', rowan: 'The Rowan Watch', rustpikes: 'The Rust-Pikes', ridge: 'The Ridge-Striders'}[id]; return n || id; } catch (e) { return id; } };
  const bandSq = () => (G && G.allies || []).find(u => u && u.units && u.lr34);

  /* ---- the roll ---------------------------------------------------------------------- */
  RT.diff = function(){
    const C = C_(), base = withdrawDiff(), why = [base[1]]; let d = base[0];
    if (G.ledger && G.ledger.hp < G.ledger.maxHp){ d += K.damaged; why.push('the Ledger Wagon is damaged'); }
    const H = bandOf(C) || (C.hired ? {id: null} : null);
    if (H){ d += K.band; why.push('a hired band holds the rear'); }
    if (C.ch45 === 'retreat'){ d += K.repeat; why.push('the raiders saw you run last night'); }
    return {d: Math.max(2, Math.min(6, d)), why, band: H ? H.id || 'hired' : null};
  };
  RT.note = function(){
    const s = G.rt45 || {}, D = RT.diff(), per = G.leader.down ? 1 : G.leader.s.per;
    if (s.res === 'miss') return `<div class="sub" style="color:#c8b890;font-size:13px"><b style="color:var(--bad-dark)">${E(T.noRetry)}</b></div>`;
    return `<div class="sub" style="color:#c8b890;font-size:13px">The wagons pull back under your cover. One roll: your Leader’s Personality (Skill ${per}) against ${D.d}, because ${E(D.why.join(', '))}. Full Success: nobody lost, half a day of road given up. Partial: Column Strength -${K.partCol}, a mate hurt, the coin dropped, the wagon hit. Miss: Column Strength -${K.missCol}, a wagon lost, a mate taken, and you fight on with no second try.</div>`;
  };
  { const f = withdrawNote; withdrawNote = function(){ try { if (RT.live()) return RT.note(); } catch (e) { console.warn('RT45 note', e); } return f.apply(this, arguments); }; }
  { const f = togglePause; togglePause = function(){ const r = f.apply(this, arguments);
      try { if (RT.live()){ const b = document.querySelector('#overlay-pause button[onclick="askWithdraw()"]'); if (b) b.textContent = T.button; } } catch (e) {}
      return r; }; }

  { const f = askWithdraw; askWithdraw = function(){
      let live = false; try { live = RT.live() && !G.over; } catch (e) {}
      if (!live) return f.apply(this, arguments);
      const s = G.rt45 = G.rt45 || {};
      if (s.scene) return;
      if (s.res === 'miss'){ SFX.play('nope'); note(T.noRetry); return; }
      const D = RT.diff(), per = G.leader.down ? 1 : G.leader.s.per;
      let r = attackDie(per, D.d), res = (r.out === 'solid' || r.out === 'crit') ? 'full' : r.out === 'graze' ? 'partial' : 'miss';
      if (RT.force) res = RT.force;
      $('overlay-pause').classList.add('hidden');
      const cap = D.band && D.band !== 'hired' ? fill(T.parley, {band: bandName(D.band)}) : D.band ? 'the hired swords hold the rear.' : T.noBand;
      showDice(T.title, [{face: r.face, skill: clampSkill(per), out: r.out, ac: D.d, label: META.leader.name + "'s Personality"}], {
        sub: D.band ? `Against ${D.d}: ${cap}` : `Against ${D.d}. ${cap}`,
        result: pick(T[res]),
        sfx: res === 'miss' ? 'nope' : 'horn',
        then(){ try { RT.resolve(res, D); } catch (e) { console.warn('RT45 resolve', e); if (G && !G.over) endDeployment('withdrawn'); } }});
    }; }

  RT.resolve = function(res, D){
    if (!G || G.over) return;
    const s = G.rt45 = G.rt45 || {};
    s.res = res; s.band = D.band; s.d = D.d;
    if (res !== 'full'){ if (G.coin) note(`${G.coin} coin dropped in the retreat.`); G.coin = 0; }
    if (res === 'miss'){
      G.colLoss = (G.colLoss || 0) + K.missCol; G.paused = false;
      note(T.hud.miss + ': Column Strength -' + K.missCol + '. ' + T.noRetry); pop(G.leader.x, G.leader.y - 50, T.hud.miss, '#ff8a7a');
      return;
    }
    if (res === 'partial'){ G.colLoss = (G.colLoss || 0) + K.partCol; if (G.ledger){ s.wagon = Math.min(K.partWagon, Math.max(0, G.ledger.hp - 1)); G.ledger.hp -= s.wagon; } }
    s.scene = {t: 0}; G.paused = true; note(T.hud[res]);
    setTimeout(() => { try { if (G && G.rt45 === s && s.scene) RT.finish(); } catch (e) {} }, Math.round(K.scene / 60 * 1000) + 2500);   // if the draw loop is not running
  };
  RT.finish = function(){
    const s = G && G.rt45; if (!s || !s.scene || G.over) return;
    s.scene = null; s.done = true;
    for (const m of G.squad || []) if (m.state === 'bleeding') m.state = 'stable';   // carried off on the wagons
    G.failHead = T.hud[s.res];
    endDeployment('withdrawn');
  };

  /* ---- the scene: the wagon rolls west, the squad behind it ------------------------------ */
  { const f = drawHUD; drawHUD = function(){
      const r = f.apply(this, arguments);
      try {
        const s = G && G.rt45;
        if (s && s.scene && !G.over){
          const sc = s.scene; sc.t++;
          if (G.ledger) G.ledger.x -= 1.5;
          if (G.column && G.column !== G.ledger && typeof G.column.x === 'number') G.column.x -= 1.5;
          for (const m of (G.squad || []).concat(G.leader ? [G.leader] : [])) if (m && m.state !== 'dead' && typeof m.x === 'number') m.x -= 0.9;
          const a = Math.min(1, sc.t / 20), txt = T.hud[s.res];
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);   // the main ctx applies the render scale itself (INDEX hookMainCtx)
          ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#000'; ctx.fillRect(0, VH * 0.2 - 30, VW, 60);
          ctx.globalAlpha = a; ctx.font = 'bold 30px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = s.res === 'full' ? '#ffd860' : '#ffb070'; ctx.fillText(txt, VW / 2, VH * 0.2);
          ctx.restore();
          if (sc.t >= K.scene) RT.finish();
        }
      } catch (e) { console.warn('RT45 scene', e); try { ctx.restore(); } catch (e2) {} }
      return r; }; }

  /* ---- the debrief --------------------------------------------------------------------- */
  const P = (lines, cls, s) => lines.push(`<p${cls ? ` class="${cls}"` : ''}>${E(s)}</p>`);
  RT.before = function(c, result){
    const C = C_(), s = (G.rt45 = G.rt45 || {});
    const ran = s.done && (s.res === 'full' || s.res === 'partial');
    if (!ran && G.ledger){
      const rep = C.ch45 === 'defend', w = Math.min(K.wear + (rep ? K.wearRepeat : 0), Math.max(0, Math.round(G.ledger.hp) - 1));
      if (w > 0){ G.ledger.hp -= w; s.wear = w; s.wearRep = rep; }
    }
    if (s.res === 'partial' && s.done){ const sq = bandSq(); if (sq){ const u = sq.units.find(x => !x.officer && x.state === 'up'); if (u){ u.state = 'dead'; s.bandLoss = true; } } }
  };
  RT.after = function(c, result, lines){
    const C = C_(), s = G.rt45 || {}, res = s.res, ran = s.done && (res === 'full' || res === 'partial');
    const H0 = C.band30 && LR() && LR().isBand(C.band30) ? C.band30 : null, bn = s.band && s.band !== 'hired' ? bandName(s.band) : null;
    if (res){
      const ln = res === 'miss' ? T.miss[1] : pick(T[res]);   // miss[0] repeats the heading
      lines.push(`<p><b>${E(T.hud[res])}.</b> ${E(ln)}${ran && bn && T.band[s.band] ? ' ' + E(T.band[s.band]) : ''}</p>`);
    }
    if (ran && res === 'full'){
      const n = Math.min(K.halfSupply, Math.max(0, C.supply)); C.supply -= n; C.half45 = (C.half45 || 0) + 1;
      P(lines, '', fill(T.halfDay, {n}));
      if (C.half45 >= K.halves && C.part === 'road' && c.night < NIGHTS.length){ C.half45 = 0; C.night--; P(lines, 'bad', fill(T.extraNight, {n: c.night})); }
    }
    if (ran && res === 'partial'){
      if (s.wagon) P(lines, 'bad', fill(T.wagonHit, {n: s.wagon}));
      const ids = new Set((G.squad || []).filter(m => m.state !== 'dead').map(m => m.p && m.p.id)), cand = META.roster.filter(p => ids.has(p.id) && !(p.resting > 0));
      if (cand.length){ const p = pick(cand); p.resting = K.rest + 1; P(lines, 'bad', fill(T.hurt, {name: p.name})); }   // +1: the road day takes one off before the next night
      if (s.bandLoss && bn) P(lines, 'bad', fill(T.bandLoss, {band: bn}));
    }
    if (res === 'miss'){
      if ((C.slots || []).length){ const lost = C.slots.splice(Math.random() * C.slots.length | 0, 1)[0]; P(lines, 'bad', fill(T.fitting, {name: (typeof WAGON_SLOTS !== 'undefined' && WAGON_SLOTS[lost] || {}).name || lost})); }
      else { const n = Math.min(K.missWagon, Math.max(0, C.wagonHp - 1)); C.wagonHp -= n; P(lines, 'bad', fill(T.wagonLost, {n})); }
      if (H0 && s.band === H0.id && C.band30 === H0){
        const lg = LR().log[LR().log.length - 1]; if (lg && lg.band === H0.id && lg.night === c.night && lg.cut > 0) C.supply += lg.cut;
        P(lines, 'bad', fill(T.bandWalk, {band: bn})); LR().recall(H0, lines); C.band30 = null; C.hired = false;
      }
    }
    /* R7 (checklist R): the 'second night' line came every road morning; it is said once a Founding, then the plain wear line */
    if (s.wear){ const rep = s.wearRep && !C.wear45said; if (rep) C.wear45said = true; P(lines, '', fill(rep ? T.wearRepeat : T.wear, {n: s.wear})); }
    // the captive
    const cap = C.cap45;
    if (cap && res === 'miss'){ C.cap45 = null; P(lines, 'bad', fill(T.lost, {name: cap.p.name})); try { META.memorial.push(graveEntry(cap.p, false, 'Taken on the Long Road', c)); } catch (e) { console.warn('RT45 grave', e); } }
    else if (cap && result === 'victory'){ C.cap45 = null; cap.p.resting = K.rest + 1; META.roster.push(cap.p); P(lines, 'good', fill(T.rescued, {name: cap.p.name})); }
    else if (cap && C.part !== 'road'){ C.cap45 = null; cap.p.resting = K.rest + 1; META.roster.push(cap.p); P(lines, '', fill(T.home, {name: cap.p.name})); }
    else if (cap) P(lines, 'bad', fill(T.held, {name: cap.p.name}));
    else if (res === 'miss'){
      const ids = new Set((G.squad || []).filter(m => m.state !== 'dead').map(m => m.p && m.p.id)), cand = META.roster.filter(p => ids.has(p.id));
      if (cand.length && META.roster.length > 1){ const p = pick(cand); META.roster = META.roster.filter(x => x !== p); C.cap45 = {p, night: c.night}; P(lines, 'bad', fill(T.captured, {name: p.name})); }
    }
    C.ch45 = res ? 'retreat' : 'defend';
    RT.log.push({night: c.night, res: res || null, result, band: s.band || null, wear: s.wear || 0, cap: C.cap45 ? C.cap45.p.name : null});
  };
  { const f = storyDebrief; storyDebrief = function(c, result, lines){
      let mine = false; try { mine = !!(RT.live() && c && c.obj === 'night'); } catch (e) {}
      if (mine) try { RT.before(c, result); } catch (e) { console.warn('RT45 before', e); }
      const r = f.apply(this, arguments);
      if (mine) try { RT.after(c, result, lines); } catch (e) { console.warn('RT45 after', e); }
      return r; }; }

  /* ---- (j) the Parley costs something ---------------------------------------------------- */
  const stakes = () => road();
  { const f = workOrder; workOrder = function(id){
      let on = false, o0 = 0; try { on = id === 'parley' && stakes(); o0 = on ? C_().orders : 0; } catch (e) {}
      const r = f.apply(this, arguments);
      try { if (on){ const C = C_(); if (C.orders < o0){ const n = Math.min(K.parleySupply, Math.max(0, C.supply)); if (n > 0){ C.supply -= n; cpLog(fill(T.parleySupply, {n})); saveMeta(); refreshUI(); } } } } catch (e) { console.warn('RT45 parley', e); }
      return r; }; }
  if (window.LR34){
    const L = window.LR34;
    { const f = L.persuade; L.persuade = function(id){
        let on = false; try { on = stakes(); } catch (e) {}
        const r = f.apply(this, arguments);
        try { if (on && r === true){ const n = Math.min(K.parleyGold, Math.max(0, META.treasury)); if (n > 0){ META.treasury -= n; cpLog(fill(T.parleyGold, {n})); saveMeta(); renderWorkBoard(); } } } catch (e) { console.warn('RT45 purse', e); }
        return r; }; }
    { const f = L.offerHTML; L.offerHTML = function(){
        let h = f.apply(this, arguments);
        try { if (stakes() && typeof h === 'string') h = h.replace(/(<div class="mini"[^>]*><button onclick="CARAVAN30\.decline\(\)">)/, `<div class="ink small" data-rt45purse="1">${E(fill(T.purse, {n: K.parleyGold}))}</div>$1`);
          // Planner replay 6: the purse is on each Take button too, so taking a band is the choice that pays it
          if (stakes() && typeof h === 'string' && K.parleyGold > 0) h = h.replace(/(onclick="LR34\.persuade\('\w+'\)">)([^<]*)(<\/button>)/g, (m, a, t, z) => `${a}${t} (${K.parleyGold}gp)${z}`); } catch (e) {}
        return h; }; }
  }

  /* ---- self-test -------------------------------------------------------------------------- */
  RT.selfTest = function(){
    const out = [], ok = (n, c, info) => out.push({name: n, pass: !!c, info: info || ''});
    const sv = {G: typeof G !== 'undefined' ? G : null, cp: META.cp, roster: META.roster, mem: META.memorial, tr: META.treasury, sk: SAVE_KEY, save: saveMeta, note, t: RT._t, log: RT.log, rw: renderWorkBoard, ru: refreshUI, sfx: SFX.play};
    try {
      SAVE_KEY = '__rt45_test'; saveMeta = () => {}; note = () => {}; renderWorkBoard = () => {}; refreshUI = () => {}; SFX.play = () => {};
      RT.log = [];
      const mk = n => ({id: 9000 + n, name: 'Mate ' + n, resting: 0});
      const fresh = () => { META.cp = {part: 'road', night: 1, column: 20, supply: 12, orders: 3, aux: [], log: [], hired: false, wagonHp: 100, wagonMax: 100, formation: 'laager', slots: []};
        META.roster = [mk(1), mk(2), mk(3)]; META.memorial = [];
        G = {obj: 'night', over: true, squad: META.roster.map(p => ({p, state: 'up', x: 0, y: 0})), allies: [], ledger: {hp: 100, maxHp: 100}, colLoss: 0, coin: 0, kills: 0, leader: {x: 0, y: 0, s: {per: 3}}, enemies: [], rt45: {}};
        return META.cp; };
      const c = {obj: 'night', night: 1};
      let C = fresh();
      ok('off under another module’s test save', !RT.live());
      RT._t = true;
      ok('live on a road night', RT.live());
      ok('difficulty: 4 with nobody close', RT.diff().d === 4);
      G.ledger.hp = 60; ok('a damaged wagon: +1', RT.diff().d === 5);
      C.hired = true; ok('a hired band: one step easier', RT.diff().d === 4 && RT.diff().band === 'hired');
      C.ch45 = 'retreat'; ok('a second retreat in a row: +1', RT.diff().d === 5);
      // full
      C = fresh(); G.rt45 = {res: 'full', done: true}; let L = []; RT.before(c, 'fled'); RT.after(c, 'fled', L);
      ok('full: half a day, 1 Supply, nobody hurt, no wear', C.supply === 11 && C.half45 === 1 && C.night === 1 && G.ledger.hp === 100 && META.roster.every(p => !p.resting) && C.ch45 === 'retreat');
      G.rt45 = {res: 'full', done: true}; L = []; RT.before(c, 'fled'); RT.after(c, 'fled', L);
      ok('two half-days: the night is fought again', C.night === 0 && C.half45 === 0 && /Night 1/.test(L.join('')));
      // partial
      C = fresh(); G.rt45 = {res: 'partial', done: true, wagon: 25}; L = []; RT.before(c, 'fled'); RT.after(c, 'fled', L);
      ok('partial: one mate rests the next night', META.roster.filter(p => p.resting === K.rest + 1).length === 1 && /Ledger Wagon takes 25/.test(L.join('')));
      // miss: capture, then rescue
      C = fresh(); G.rt45 = {res: 'miss'}; L = []; RT.before(c, 'victory'); RT.after(c, 'victory', L);
      ok('miss: a mate is taken alive, the wagon is hit (no fitting to lose), the fight wore the wagon', META.roster.length === 2 && C.cap45 && C.wagonHp === 60 && G.ledger.hp === 90);
      const capN = C.cap45.p.name;
      G.rt45 = {}; G.squad = META.roster.map(p => ({p, state: 'up'})); L = []; RT.before(c, 'victory'); RT.after(c, 'victory', L);
      ok('a win the next night brings them back, resting', META.roster.length === 3 && !C.cap45 && META.roster.find(p => p.name === capN).resting === K.rest + 1 && C.ch45 === 'defend');
      // miss twice
      C = fresh(); C.slots = ['larder']; G.rt45 = {res: 'miss'}; L = []; RT.before(c, 'fallen'); RT.after(c, 'fallen', L);
      ok('miss with a fitting: the fitting is lost, not wagon HP', C.slots.length === 0 && C.wagonHp === 100 && C.cap45);
      const sg = typeof graveEntry === 'function' ? graveEntry : null; if (sg) graveEntry = p => ({name: p.name});
      G.rt45 = {res: 'miss'}; G.squad = META.roster.map(p => ({p, state: 'up'})); L = []; RT.before(c, 'fallen'); RT.after(c, 'fallen', L);
      if (sg) graveEntry = sg;
      ok('a second miss in a row loses the captive for good, and takes nobody new', !C.cap45 && META.roster.length === 2 && META.memorial.length === 1);
      // defend twice
      C = fresh(); G.rt45 = {}; L = []; RT.before(c, 'victory'); RT.after(c, 'victory', L);
      const h1 = G.ledger.hp; G.rt45 = {}; RT.before(c, 'victory'); RT.after(c, 'victory', L);
      ok('defending wears the wagon; twice running wears it more', h1 === 100 - K.wear && G.ledger.hp === h1 - K.wear - K.wearRepeat);
      { const said = L.filter(x => /second night/.test(x)).length; G.rt45 = {}; RT.before(c, 'victory'); RT.after(c, 'victory', L);
        ok('R7: the "second night" line is said once, not every morning', said === 1 && L.filter(x => /second night/.test(x)).length === 1, said); }
      // parley
      if (META.leader){ C = fresh(); const o0 = C.orders, r0 = cpRoll; cpRoll = () => 'miss';
        try { workOrder('parley'); } finally { cpRoll = r0; }
        ok('a failed Parley still costs the Supply', C.orders === o0 - 1 && C.supply === 12 - K.parleySupply); }
    } catch (e) { ok('no exception', false, String(e && e.stack || e)); }
    finally { G = sv.G; META.cp = sv.cp; META.roster = sv.roster; META.memorial = sv.mem; META.treasury = sv.tr; SAVE_KEY = sv.sk; saveMeta = sv.save; note = sv.note; renderWorkBoard = sv.rw; refreshUI = sv.ru; SFX.play = sv.sfx; RT._t = sv.t; RT.log = sv.log; }
    const fails = out.filter(x => !x.pass);
    return {pass: out.length - fails.length, fail: fails.length, fails, all: out};
  };
})();
