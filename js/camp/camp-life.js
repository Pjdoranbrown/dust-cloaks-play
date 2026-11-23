/* Index CAMPLIFE1: the living camp (Fable job 9, wishlist Narrative 2; audits/fable/camp-life.md).
   Squad Mates remember the contracts they stood through together and talk about them in camp as two-speaker
   exchanges: a line, then a reply from the mate it was said to. Deaths and promotions are remembered first.

   DATA   each mate carries p.mem: the last MEM_CAP contract records {t, c (contract name), host, out (win|loss|withdrew),
          stood [ids who came home beside them], fell [names], ldr (leader's name if the leader fell)}.
          META.campLife = {queue: [{kind:'grief'|'promoted', name, comrade, t}], said: n} (queue capped at QUEUE_CAP).
          Old saves: every field is guarded, nothing is written to a save until a contract ends or a promotion happens.
   LINES  window.CAMP_LINES (Narrative's js/lines/camp.js) or the placeholders below. Shape, one exchange = [line, reply]:
          shared[host|any][win|loss|withdrew|any], grief.bond / grief.plain, promoted, pair[raceA|raceB] (either order), cls[clsA|clsB].
          Tokens: {A} speaker, {B} the mate replied to, {C} contract, {D} the fallen or the promoted.
   HOOKS  endDeployment (records, grief queue), promoteOfficer (promotion queue), drawCamp (the exchange on the camp bark timer;
          falls through to the solo bark in index.html when nothing is shared). Nothing in the BARK tables is touched.
   KNOBS  CAMPLIFE.replyGap (frames before the reply, 90), CAMPLIFE.life (frames a line stays, 260). No switch (removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  const MEM_CAP = 12, QUEUE_CAP = 8;
  const CL = window.CAMPLIFE = {replyGap: 90, life: 260, ex: null, frame: 0, lastEx: null};

  /* ---- placeholder lines: replaced by Narrative's CAMP_LINES the moment js/lines/camp.js loads ---- */
  CL.STUB = {
    shared: {any: {win: [['{B}. {C}. We walked out of that one.', 'We did, {A}. Some of us.']],
                   loss: [['Do you still think about {C}, {B}?', 'Every night, {A}. Every night.']],
                   withdrew: [['We were right to pull back at {C}.', 'Tell that to the ones who stayed, {A}.']],
                   any: [['You were there at {C}, {B}.', 'I was. I remember.']]}},
    grief: {bond: [['{B}. You and {D} were close.', 'Say the name again and I will walk off, {A}.']],
            plain: [['{D} should be at this fire.', 'Aye. Pour one out, {A}.']]},
    promoted: [['{D} gives orders now.', 'They earned the tent, {A}. We did not.']],
    pair: {}, cls: {}
  };
  const lines = () => (typeof window.CAMP_LINES === 'object' && window.CAMP_LINES) || CL.STUB;
  CL.usingStub = () => lines() === CL.STUB;

  const outOf = r => r === 'victory' ? 'win' : r === 'withdrawn' ? 'withdrew' : 'loss';
  const cname = c => (c && (c.title || (typeof OBJECTIVES !== 'undefined' && OBJECTIVES[c.obj] && OBJECTIVES[c.obj].name))) || 'the last contract';
  const memOf = p => { if (!Array.isArray(p.mem)) p.mem = []; return p.mem; };
  const life = () => { if (!META.campLife || typeof META.campLife !== 'object') META.campLife = {queue: [], said: 0}; if (!Array.isArray(META.campLife.queue)) META.campLife.queue = []; return META.campLife; };
  const pick = a => a[Math.random() * a.length | 0];
  const fill = (s, t) => String(s).replace(/\{([ABCD])\}/g, (m, k) => t[k] != null ? t[k] : m);

  /* ---- records at contract end ---- */
  CL.record = function(c, result, squad, leaderName){
    const dead = squad.filter(m => m.state === 'dead'), home = squad.filter(m => m.state !== 'dead');
    const rec = {t: Date.now(), c: cname(c), host: c && c.host || 'any', out: outOf(result),
                 stood: home.map(m => m.p.id), fell: dead.map(m => m.p.name), ldr: leaderName || null};
    for (const m of home){ const M = memOf(m.p); M.push(rec); while (M.length > MEM_CAP) M.shift(); }
    const Q = life().queue;
    for (const d of dead){ const bond = home.find(m => m.p.id === d.p.bond || d.p.id === m.p.bond);
      Q.push({kind: 'grief', name: d.p.name, comrade: bond ? bond.p.id : null, t: rec.t}); }
    if (leaderName) Q.push({kind: 'grief', name: leaderName, comrade: null, t: rec.t});
    while (Q.length > QUEUE_CAP) Q.shift();
    return rec;
  };
  if (typeof endDeployment === 'function'){ const f = endDeployment; endDeployment = function(result){
    const g = G, pre = g && !g.over ? {c: g.contract, squad: g.squad.slice(), leader: META.leader && META.leader.name} : null;
    const r = f(result);
    try { if (pre && g.over) CL.record(pre.c, g.result, pre.squad, META.leader ? null : pre.leader); } catch (e) { console.warn('CAMPLIFE record', e); }
    return r; }; }
  if (typeof promoteOfficer === 'function'){ const f = promoteOfficer; promoteOfficer = function(pid){
    const p = META.roster.find(x => x.id === pid); const r = f(pid);
    if (p && !META.roster.includes(p)){ const Q = life().queue; Q.push({kind: 'promoted', name: p.name, t: Date.now()}); while (Q.length > QUEUE_CAP) Q.shift(); }
    return r; }; }

  /* ---- choosing an exchange ---- */
  const mates = () => CAMP.people.filter(q => q.p && (q.kind === 'mate' || q.kind === 'officer' || q.kind === 'leader') && !(q.barkLife > 0));
  const shared = (a, b) => memOf(a.p).filter(r => r.stood.includes(b.p.id));
  CL.choose = function(){
    const L = lines(), M = mates(); if (M.length < 2) return null;
    const Q = life().queue;
    if (Q.length){ const q = Q[0];
      const A = q.comrade != null && M.find(x => x.p.id !== q.comrade) || pick(M), Bs = M.filter(x => x !== A);
      const B = q.comrade != null && Bs.find(x => x.p.id === q.comrade) || pick(Bs);
      const pool = q.kind === 'promoted' ? L.promoted : (L.grief && (B.p.id === q.comrade ? L.grief.bond : L.grief.plain));
      if (pool && pool.length){ Q.shift(); return {A, B, ex: pick(pool), t: {D: q.name}, kind: q.kind}; }
    }
    const order = M.slice().sort(() => Math.random() - .5);
    for (const A of order){ for (const B of order){ if (A === B) continue; const S = shared(A, B); if (!S.length) continue;
      const r = S[S.length - 1], H = L.shared && (L.shared[r.host] || L.shared.any); if (!H) continue;
      const pool = H[r.out] || H.any; if (!pool || !pool.length) continue;
      return {A, B, ex: pick(pool), t: {C: r.c}, kind: 'shared'}; } }
    const [A, B] = order;
    const key2 = (a, b, T) => T && (T[a + '|' + b] || T[b + '|' + a]);
    const pr = key2(A.p.race, B.p.race, L.pair); if (pr && pr.length) return {A, B, ex: pick(pr), t: {}, kind: 'pair'};
    const cl = key2(A.p.cls, B.p.cls, L.cls); if (cl && cl.length) return {A, B, ex: pick(cl), t: {}, kind: 'cls'};
    return null;
  };
  CL.start = function(x){
    const ex = Array.isArray(x.ex) ? x.ex : [x.ex.a || x.ex[0], x.ex.b || x.ex[1]];
    const t = Object.assign({A: x.A.p.name, B: x.B.p.name}, x.t);
    x.A.bark = fill(ex[0], t); x.A.barkLife = CL.life;
    CL.ex = {B: x.B, line: fill(ex[1], t), at: CL.replyGap}; CL.lastEx = {kind: x.kind, a: x.A.bark, b: CL.ex.line}; life().said++;
  };
  CL.tick = function(){
    CL.frame++;
    if (CL.ex && --CL.ex.at <= 0){ const e = CL.ex; CL.ex = null; if (CAMP.people.includes(e.B)){ e.B.bark = e.line; e.B.barkLife = CL.life; } }
    if (CL.ex || !((CAMP.barkT || 0) - 1 <= 0)) return;
    const x = CL.choose(); if (!x) return;            /* nothing shared: the solo bark in index.html fires as before */
    CL.start(x); CAMP.barkT = 320 + Math.random() * 300;
  };
  if (typeof drawCamp === 'function'){ const f = drawCamp; drawCamp = function(){ if (!G){ try { CL.tick(); } catch (e) { console.warn('CAMPLIFE', e); } } return f(); }; }

  CL.selfTest = function(){
    const out = [], ok = (n, c) => out.push((c ? 'ok   ' : 'FAIL ') + n);
    const mk = (id, name, race, cls, bond) => ({id, name, race, cls, spec: 'WARRIOR', bond});
    const a = mk(9001, 'Ada', 'HUMAN', 'FREEMAN', 9002), b = mk(9002, 'Bron', 'DWARF', 'NOBLE', 9001), d = mk(9003, 'Cael', 'ORC', 'OUTCAST');
    const saveQ = META.campLife; META.campLife = null;
    const rec = CL.record({title: 'Test Hunt', host: 'hollow', obj: 'hunt'}, 'victory', [{p: a, state: 'stable'}, {p: b, state: 'stable'}, {p: d, state: 'dead'}], null);
    ok('record on both who came home, none on the fallen', a.mem.length === 1 && b.mem[0] === rec && !d.mem);
    ok('record shape', rec.out === 'win' && rec.host === 'hollow' && rec.c === 'Test Hunt' && rec.stood.length === 2 && rec.fell[0] === 'Cael');
    for (let i = 0; i < 20; i++) CL.record({title: 'x' + i, host: 'bandits'}, 'fled', [{p: a, state: 'stable'}], null);
    ok('memory capped at ' + MEM_CAP, a.mem.length === MEM_CAP && a.mem[0].c === 'x8');
    ok('grief queued for the fallen', META.campLife.queue.length === 1 && META.campLife.queue[0].kind === 'grief' && META.campLife.queue[0].name === 'Cael');
    const peopleWas = CAMP.people; CAMP.people = [{kind: 'mate', p: a}, {kind: 'mate', p: b}];
    const x1 = CL.choose(); ok('grief exchange chosen first', x1 && x1.kind === 'grief' && x1.t.D === 'Cael');
    const x2 = CL.choose(); ok('then the shared contract', x2 && x2.kind === 'shared' && x2.t.C === 'Test Hunt');
    CL.start(x2); ok('line set on A, reply waiting ' + CL.replyGap + ' frames', x2.A.bark && CL.ex && CL.ex.B === x2.B && !CL.ex.line.includes('{'));
    for (let i = 0; i < CL.replyGap; i++) CL.tick(); ok('reply lands on B', !CL.ex && x2.B.bark === CL.lastEx.b);
    CAMP.people = [{kind: 'mate', p: d}, {kind: 'mate', p: {id: 9004, name: 'Eo', race: 'CAMBION', cls: 'SLAVE'}}]; ok('no shared past, no pair line: falls through to the solo bark', CL.choose() === null);
    ok('old save: mate without mem and META without campLife are safe', (() => { META.campLife = undefined; const q = {id: 1, name: 'Old', race: 'HUMAN', cls: 'FREEMAN'}; return shared({p: q}, {p: q}).length === 0 && life().queue.length === 0; })());
    ok('lines source: ' + (CL.usingStub() ? 'placeholders (js/lines/camp.js not loaded)' : 'CAMP_LINES'), !!lines().shared);
    CAMP.people = peopleWas; META.campLife = saveQ; CL.ex = null;
    const fails = out.filter(l => l.startsWith('FAIL')).length; console.log('CAMPLIFE selfTest\n' + out.join('\n')); return {pass: out.length - fails, fail: fails, lines: out};
  };
})();
