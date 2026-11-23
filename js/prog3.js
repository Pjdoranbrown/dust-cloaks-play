/* ============================================================================
   INDEX PROG3 - PROG-1 step 3: TRAIT ROOM AND THE TRAIN ROW
   Plan: audits/progression-plan.md sections 2.5 and 4 (step 3).
   PROG-1 is the game (step 4, 2026-11-16, deleted the off path):
   - Trait room, all six Specialties: 1 trait at Level 1, then 2 / 3 / 4 / 5 at
     Levels 3 / 5 / 7 / 9 [S] (PROG.K.room). It replaces firstPickLevel in
     learnable (mates) and the 'pick' rows for the Leader (META.pendingPicks
     follows room minus traits held). A character over room keeps what they have.
   - Traits are the PROG1 sheet's 'trait' rows (js/prog1-data.js). The five
     doubled cards (rally, assist, highlight, poisoned, armourbreak) are cut from
     the trait lists and from Leader creation. Spells are not picked as traits.
   - "Train a trait" sits at each Specialty's own building, 80 gp [S]
     (PROG.K.train), an Advancement, one contract out. The Command Tent row and
     the three 'Learn a spell' rows are removed.
   Q13 and Q14 (martial gates, Prepared tier) are steps 2 and 4: the sheet
   holds them as [S]; nothing here reads them.
   Hooks: learnable, leaderOpts, leaderPick, mateToLeader, renderDebrief,
   refreshUI, renderCreate (index.html); TRAINING rows swapped in place.
   PROG.init() (the end of js/prog5.js) swaps the rows once. Self-test: PROG.selfTest().
============================================================================ */
(function(){
  'use strict';
  const P = window.PROG = window.PROG || {};
  P.K = {room: [1, 3, 5, 7, 9], train: 80};
  P.on = true;   // a fact, not a switch: PROG-1 step 4 (2026-11-16) deleted the off path; PROG.init() at the end of js/prog5.js swaps the rows in
  P.CUT = ['rally', 'assist', 'highlight', 'poisoned', 'armourbreak'];
  P.TRAIN_AT = {training: 'SOLDIER', ranger: 'FOLK_HERO', tavern: 'SCOUNDREL', chapel: 'CLERIC', magetower: 'MAGE', alchemy: 'WITCH'};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const S1 = () => window.PROG1;

  P.room = lvl => P.K.room.filter(l => (lvl || 1) >= l).length;
  P.isTrait = id => !!(S1() && S1().BY[id] && S1().BY[id].kind === 'trait');
  P.held = who => ((who && who.picks) || []).filter(id => P.isTrait(id) || P.CUT.includes(id)).length;
  P.traitsFor = (spec, who) => gl('CARDS').filter(c => c.spec === spec && P.isTrait(c.id) && !((who && who.picks) || []).includes(c.id));

  /* ---- the Train row: one per Specialty building ---- */
  const trainRow = spec => ({k: 'ability', label: 'Train a Talent', spec, prog3: 1, cost: () => P.K.train,
    ok: p => gl('learnable')(p).length > 0, why: 'no Talent room at their next Level, or nothing left'});
  P.swapRows = function(){   // once: the spell rows and the Command Tent ability row go, a Train row joins each Specialty building
    const T = gl('TRAINING'); if (!T || P._swapped) return;
    P._swapped = true;
    for (const fid of Object.keys(T)){
      const keep = T[fid].filter(t => t.k !== 'spell' && !(fid === 'command' && t.k === 'ability'));
      if (keep.length !== T[fid].length){ T[fid] = keep; if (!keep.length) delete T[fid]; }
    }
    for (const fid of Object.keys(P.TRAIN_AT)) T[fid] = (T[fid] || []).concat([trainRow(P.TRAIN_AT[fid])]);
  };

  /* ---- the Leader's picks follow room ---- */
  P.sync = function(){
    const M = gl('META'); if (!M || !M.leader) return;
    M.pendingPicks = Math.max(0, P.room(M.leader.level) - P.held(M.leader));
  };

  P.init = function(){ P.swapRows(); P.sync(); return true; };   // js/prog24.js and js/prog5.js add their own once-only steps

  /* ---- hooks ---- */
  P.o = {};
  const wrap = (name, make) => { try { const f = gl(name); if (typeof f !== 'function') return; P.o[name] = f; P['_' + name] = make(f); (0, eval)(name + ' = window.PROG._' + name); } catch (e) { console.warn('PROG3 wrap ' + name, e); } };

  wrap('learnable', f => function(p){
    if (P.held(p) >= P.room(1 + (p.adv || 0) + 1)) return [];
    return P.traitsFor(p.spec, p);
  });
  wrap('leaderOpts', f => function(L){
    return P.held(L) >= P.room(L.level) ? [] : P.traitsFor(L.spec, L);
  });
  wrap('leaderPick', f => function(id){
    const M = gl('META'); if (!M.leader || !P.leaderOpts(M.leader).some(c => c.id === id)) return; P.sync();
    return f.apply(this, arguments);
  });
  wrap('mateToLeader', f => function(p, cap){
    const L = f.apply(this, arguments);
    if (L){ L.picks = ((p && p.picks) || []).slice(); L.pendingPicks = Math.max(0, P.room(L.level) - P.held(L)); }
    return L;
  });
  wrap('renderDebrief', f => function(){ P.sync(); return f.apply(this, arguments); });
  wrap('refreshUI', f => function(){ P.sync(); return f.apply(this, arguments); });
  wrap('renderCreate', f => function(){
    const r = f.apply(this, arguments);
    try {
      const CR = gl('CR'), box = document.getElementById('create-inner');
      if (CR && CR.step === 'pick' && box){
        if (P.CUT.includes(CR.pick)) CR.pick = null;
        box.querySelectorAll('.card[onclick]').forEach(el => { const m = /CR\.pick='([a-z_]+)'/.exec(el.getAttribute('onclick')); if (m && P.CUT.includes(m[1])) el.remove(); });
      }
    } catch (e) {}
    return r;
  });
  P.leaderOpts = L => P._leaderOpts ? P._leaderOpts(L) : [];

  /* ---- for the bot (PROG-1 step 2): what the chapter may research and who may train a trait now, read only.
     Act with BOOK33.research(id, 'camp') and trainAt(pid, fid, 'ability', id), the camp's own calls. ---- */
  P.options = function(){
    const out = {research: [], train: []}, M = gl('META'), B = window.BOOK33, has = gl('has'), tf = gl('trainingFor'), ln = gl('learnable');
    if (!M) return out;
    const people = (M.roster || []).concat(M.leader ? [M.leader] : []), specs = [...new Set(people.map(p => p && p.spec).filter(Boolean))];
    if (B && B.LAD && typeof B.library === 'function'){
      const lib = typeof P.lib === 'function' ? P.lib() : [];
      for (const spec of specs) for (const id of B.library(spec)) if (!lib.includes(id)){
        const cost = typeof P.researchCost === 'function' ? P.researchCost(id) : 0;
        out.research.push({id, spec, name: B.LAD[id].name, cost, ok: (M.treasury | 0) >= cost}); }
    }
    if (typeof tf === 'function' && typeof ln === 'function') for (const fid in P.TRAIN_AT){
      if (typeof has === 'function' && !has(fid)) continue;
      for (const p of M.roster || []){ if (p.spec !== P.TRAIN_AT[fid]) continue;
        const t = tf(fid, p).find(x => x.prog3); if (!t || !t.ok) continue;
        out.train.push({pid: p.id, name: p.name, fid, cost: t.cost, traits: ln(p).map(c => c.id)}); }
    }
    return out;
  };

  /* ---- self-test: run against a sandbox META, the real one put back after ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    if (!S1()){ ok('PROG1 sheet loaded', false); return {pass: 0, total: 1, rows}; }
    const M0 = gl('META'), K0 = JSON.parse(JSON.stringify(P.K)), T = gl('TRAINING');
    window.__p3m = {treasury: 1000, roster: [], officers: [], leader: null, pendingPicks: 0, facilities: {magetower: 1}, damaged: {}};
    /* nothing may reach the save: saveMeta, refreshProgression and SFX are stubbed for the run */
    const sv0 = gl('saveMeta'), rp0 = gl('refreshProgression'), SFX = gl('SFX'), sp0 = SFX && SFX.play;
    window.__p3f = () => {};
    try {
      (0, eval)('META = window.__p3m; saveMeta = window.__p3f; refreshProgression = window.__p3f');
      if (SFX) SFX.play = () => {};
      P.K.room = [1, 3, 5, 7, 9]; P.K.train = 80;
      ok('room: 1 at Level 1, 2 at 3, 3 at 5, 5 at 9', P.room(1) === 1 && P.room(2) === 1 && P.room(3) === 2 && P.room(5) === 3 && P.room(9) === 5 && P.room(11) === 5);
      const RC = {race: Object.keys(gl('RACES'))[0], cls: Object.keys(gl('CLASSES'))[0], startCon: 3, modM: 0, modR: 0, xM: 0, xR: 0};
      const C = gl('CARDS'), specs = ['SOLDIER', 'FOLK_HERO', 'SCOUNDREL', 'CLERIC', 'MAGE', 'WITCH'];
      ok('no id is both trait and technique', !S1().ENTRIES.some(e => e.kind === 'trait' && S1().ENTRIES.some(x => x !== e && x.id === e.id)));
      ok('every trait is a card', S1().traits().every(e => C.some(c => c.id === e.id)), S1().traits().filter(e => !C.some(c => c.id === e.id)).map(e => e.id).join(','));
      ok('the five doubled cards are not traits', P.CUT.every(id => !P.isTrait(id)));
      const nT = JSON.stringify(T); P.init();
      ok('PROG.init swaps the rows once (a second call changes nothing)', P._swapped && JSON.stringify(T) === nT);
      const mate = {...RC, id: 901, name: 'Ash', spec: 'SOLDIER', adv: 0, picks: [], conTrained: 0, baseM: 1, baseR: 1, magic: 0, injuries: []};
      const l0 = gl('learnable')(mate);
      ok('a fresh mate may learn a trait (room 1 at Level 2)', l0.length > 0 && l0.every(c => P.isTrait(c.id)), l0.map(c => c.id).join(','));
      ok('the trait list has no cut card', specs.every(s => !P.traitsFor(s).some(c => P.CUT.includes(c.id))));
      ok('the trait list has no spell', specs.every(s => !P.traitsFor(s).some(c => gl('SPELL_IDS').includes(c.id) && c.id !== 'hex')));
      mate.picks = ['vanguard']; mate.adv = 1;
      ok('Level 2 with one trait: room 2 at Level 3, so one more', gl('learnable')(mate).length > 0);
      mate.picks = ['vanguard', 'taunt']; mate.adv = 1;
      ok('a mate without room is refused', gl('learnable')(mate).length === 0 && !gl('advChoices')(mate).some(o => o.k.startsWith('ab:')));
      mate.picks = ['vanguard', 'taunt', 'disarm']; mate.adv = 0;
      ok('a mate over room keeps what they have', mate.picks.length === 3 && gl('learnable')(mate).length === 0);
      const L = {name: 'Vel', spec: 'CLERIC', level: 3, picks: ['litany'], injuries: []};
      META.leader = L; P.sync();
      ok('a Level 3 Cleric Leader gets a pick', META.pendingPicks === 1 && P.leaderOpts(L).length > 0 && P.leaderOpts(L).every(c => P.isTrait(c.id) && c.spec === 'CLERIC'));
      ok('a caster Leader is offered no spell', !P.leaderOpts(L).some(c => gl('SPELL_IDS').includes(c.id) && c.id !== 'hex'));
      L.level = 2; P.sync(); ok('Level 2 with one trait: no pick', META.pendingPicks === 0);
      const Sc = {name: 'Rook', spec: 'SCOUNDREL', level: 1, picks: [], injuries: []}; META.leader = Sc; P.sync();
      ok('a Level 1 Scoundrel Leader gets a pick (one rule for all six)', META.pendingPicks === 1);
      ok('the Scoundrel list is four traits', P.leaderOpts(Sc).length === 4, P.leaderOpts(Sc).map(c => c.id).join(','));
      const Fh = {name: 'Wren', spec: 'FOLK_HERO', level: 1, picks: [], injuries: []};
      ok('the Folk Hero list is three traits', P.leaderOpts(Fh).length === 3, P.leaderOpts(Fh).map(c => c.id).join(','));
      ok('Train a trait at the six buildings, 80 gp', Object.keys(P.TRAIN_AT).every(fid => (T[fid] || []).some(t => t.prog3 && t.spec === P.TRAIN_AT[fid] && t.cost() === 80)));
      ok('the Command Tent ability row is gone', !(T.command || []).some(t => t.k === 'ability'));
      ok('the spell rows are gone', !Object.keys(T).some(fid => T[fid].some(t => t.k === 'spell')));
      const p2 = {...RC, id: 902, name: 'Iva', spec: 'MAGE', adv: 0, picks: [], conTrained: 0, baseM: 1, baseR: 1, magic: 1, injuries: [], resting: 0};
      META.roster = [p2]; META.leader = {name: 'Vel', spec: 'CLERIC', level: 3, picks: [], injuries: []};
      const opt = gl('trainingFor')('magetower', p2).find(t => t.prog3);
      ok('the Mage Tower trains a Mage a trait', opt && opt.ok, opt && opt.why);
      gl('trainAt')(902, 'magetower', 'ability', 'warded');
      ok('training takes an Advancement, 80 gp and one contract', p2.picks.includes('warded') && p2.adv === 1 && p2.resting === 1 && META.treasury === 920, [p2.adv, p2.resting, META.treasury].join('/'));
      const promo = gl('mateToLeader')({...RC, id: 903, name: 'Oak', spec: 'SOLDIER', adv: 2, picks: ['vanguard', 'taunt', 'disarm'], injuries: []}, 5);
      ok('a promoted mate keeps every trait', promo.picks.length === 3 && promo.pendingPicks === 0);
    } catch (e) { ok('no throw', false, e.message); }
    finally {
      window.__p3m = M0; window.__p3s = [sv0, rp0]; (0, eval)('META = window.__p3m; saveMeta = window.__p3s[0]; refreshProgression = window.__p3s[1]');
      if (SFX) SFX.play = sp0; delete window.__p3m; delete window.__p3s; delete window.__p3f;
      Object.assign(P.K, K0);
    }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
