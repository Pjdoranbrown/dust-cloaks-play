/* INDEX L35: F-29 Camp links, build steps 1-2: detachment spoils (link 2), the veteran mentor (link 5), the vigil (link 4).
   Scope: audits/links-f29.md (Patrick accepted every recommended answer, 2026-11-13; build GO 2026-11-14).
   - Spoils: a detachment win has a 25% chance (a costly win 10%) of one gear card, cost up to 120 x tier, never free, never a horse,
     never a faction card. It goes to the Armoury (or the wagon); a full wagon sells it on the spot. Hook: DETACH.onOutcome
     (one line in js/campaign/detachments.js).
   - Mentor: a facility's retired staff teach mates who match its veteran list (race, class or spec) for a quarter less
     (rounded up, never below 1). Cost only; rest is unchanged (recommended answer 2). Mastery is untouched.
   - Vigil: a mate or officer (not the Leader) who dies with 3+ memories (p.mem) gets an inscription on the grave and a vigil:
     two camp exchanges about them (CAMP_LINES.vigil if Narrative adds it, else the grief lines; they replace the one grief
     exchange camp-life would queue), then the grave is marked "a vigil was kept". With a Chapel, the first Morale roll of the
     next contract rolls twice (META.vigilBlessing, taken when the contract starts). Lines: window.LINKS35_LINES.
   Numbers are drafts for Systems: LINKS35.K. No switches (removed in INT-1, 2026-11-15). */
(function(){
  if (typeof GEAR === 'undefined' || !window.ARM) return;
  const L = window.LINKS35 = window.LINKS35 || {};
  L.K = {spoilWin:0.25, spoilCostly:0.10, spoilCostPerTier:120, mentorCut:0.25, vigilMem:3, vigilTalks:2};   // [S] drafts
  L.rng = () => Math.random();
  const gx = id => GEAR.find(x => x.id === id);

  /* ---- 2. detachment spoils ---- */
  L.spoilPool = tier => GEAR.filter(x => x.cost > 0 && x.cost <= L.K.spoilCostPerTier * Math.max(1, tier | 0) && x.slot !== 'mount' && !(x.req || []).some(r => String(r)[0] === '@'));
  L.spoils = function(outcome, c, lines){
    if ((outcome !== 'win' && outcome !== 'costly')) return null;
    if (L.rng() >= (outcome === 'win' ? L.K.spoilWin : L.K.spoilCostly)) return null;
    const pool = L.spoilPool(c && c.tier); if (!pool.length) return null;
    const x = pool[Math.floor(L.rng() * pool.length) % pool.length];
    if (ARM.room ? ARM.room(META) : true){
      ARM.add(x.id);
      lines.push(`<p class="good">${esc(fillL(LN().spoils, {card: x.name, where: ARM.built && ARM.built(META) ? 'in the Armoury' : 'on the wagon'}))}</p>`);
      return {id:x.id, sold:0};
    }
    const v = ARM.price ? ARM.price(x.id, META) : 0; META.treasury = (META.treasury | 0) + v;
    lines.push(`<p class="good">${esc(fillL(LN().spoilsSold, {card: x.name, gp: v}))}</p>`);
    return {id:x.id, sold:v};
  };
  if (window.DETACH){ const f = DETACH.onOutcome;
    DETACH.onOutcome = function(outcome, c, o, lines){ if (f) try { f.apply(this, arguments); } catch (e) {} L.spoils(outcome, c, lines); };
  }

  /* ---- 5. veteran mentor ---- */
  L.mentorFor = (fid, p) => { if (!p || typeof staffOf !== 'function') return null;
    const s = staffOf(fid), v = typeof VETERANS !== 'undefined' && VETERANS[fid];
    return s && v && v.match.some(k => k === p.race || k === p.cls || k === p.spec) ? s : null; };
  { const f = trainingFor;
    trainingFor = function(fid, p){
      const out = f.apply(this, arguments), s = L.mentorFor(fid, p); if (!s) return out;
      return out.map(t => { if (!(t.cost > 0)) return t;
        const cost = Math.max(1, Math.ceil(t.cost * (1 - L.K.mentorCut)));
        const ok = t.ok || (t.why === 'not enough gold' && META.treasury >= cost);
        return Object.assign({}, t, {cost, ok, mentor:s.name}); });
    };
  }
  { const f = trainAt;
    trainAt = function(pid, fid){
      const p = META.roster.find(x => x.id === pid), s = L.mentorFor(fid, p);
      const r = f.apply(this, arguments);
      try { if (r && p && s){ p.mentored = s.name; saveMeta(); } } catch (e) {}
      return r;
    };
  }
  { const f = trainingHTML;
    trainingHTML = function(fid){
      const h = f.apply(this, arguments);
      try { if (!h) return h; const s = staffOf(fid); if (!s) return h;
        const who = META.roster.filter(p => L.mentorFor(fid, p)).map(p => esc(p.name));
        if (who.length) return h + `<div class="desc" style="text-align:left;color:#226b2a"><b>Mentor: ${esc(s.name)}</b> teaches ${who.join(', ')} for a quarter less.</div>`;
      } catch (e) {}
      return h;
    };
  }

  /* ---- 4. a vigil for the fallen ---- */
  const LN = () => Object.assign({
    spoils: 'They brought back {card}. It is now {where}.',
    spoilsSold: 'They brought back {card}, but the wagon was full. It sold on the spot for {gp}gp.',
    ins: 'Stood through {n} contracts. Last: {c} ({out}).',
    out: {win:'won', loss:'lost', withdrew:'withdrew'},
    kept: 'A vigil was kept.',
    blessed: 'VIGIL BLESSING'
  }, window.LINKS35_LINES || {});
  const fillL = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const campQ = () => { if (!META.campLife || typeof META.campLife !== 'object') META.campLife = {queue: [], said: 0};
    if (!Array.isArray(META.campLife.queue)) META.campLife.queue = []; return META.campLife.queue; };
  L.vigilNames = new Set();   // names given a vigil inside the current endDeployment call
  L.onGrave = function(p, leader, r){
    if (!p || !r || typeof r !== 'object') return false;
    if (leader && META.leader && p === META.leader) return false;             // the Leader's fall is already an ending
    const mem = Array.isArray(p.mem) ? p.mem : []; if (mem.length < L.K.vigilMem) return false;
    const last = mem[mem.length - 1], T = LN();
    r.ins = fillL(T.ins, {n: Math.max(p.deployments || 0, mem.length), c: last.c || 'the last contract', out: (T.out || {})[last.out] || last.out || ''});
    const bond = p.bond != null && META.roster.find(q => q.id === p.bond), Q = campQ(), id = 'v' + Date.now().toString(36) + (Math.random() * 1e4 | 0);
    for (let i = 0; i < L.K.vigilTalks; i++) Q.push({kind: 'vigil', name: p.name, comrade: bond ? bond.id : null, t: Date.now(), vid: id, last: i === L.K.vigilTalks - 1});
    while (Q.length > 8) Q.shift();
    r.vid = id; L.vigilNames.add(p.name);
    if (has('chapel')) META.vigilBlessing = true;
    return true;
  };
  { const f = graveEntry;
    graveEntry = function(p, leader){
      const r = f.apply(this, arguments);
      try { if (!(typeof inStoryNow === 'function' && inStoryNow())) L.onGrave(p, leader, r); } catch (e) { console.warn('LINKS35 vigil', e); }
      return r;
    };
  }
  { const f = endDeployment;   // camp-life queues one grief exchange per death; a vigil's two exchanges replace it
    endDeployment = function(){
      L.vigilNames.clear();
      const out = f.apply(this, arguments);
      try { if (L.vigilNames.size && META.campLife && Array.isArray(META.campLife.queue))
        META.campLife.queue = META.campLife.queue.filter(q => !(q.kind === 'grief' && L.vigilNames.has(q.name))); } catch (e) {}
      L.vigilNames.clear();
      return out;
    };
  }
  if (window.CAMPLIFE && CAMPLIFE.choose){ const f = CAMPLIFE.choose;
    CAMPLIFE.choose = function(){
      const Q = META.campLife && META.campLife.queue, q = Q && Q[0];
      const x = f.apply(this, arguments);
      try { if (x && q && q.kind === 'vigil' && x.kind === 'vigil'){
        const V = window.CAMP_LINES && CAMP_LINES.vigil; if (Array.isArray(V) && V.length) x.ex = V[Math.random() * V.length | 0];
        if (q.last){ const g = (META.memorial || []).find(d => d && d.vid === q.vid); if (g){ g.vig = true; saveMeta(); } } } } catch (e) {}
      return x;
    };
  }
  L.graveLine = d => (d && d.ins) ? `<br><i>${esc(d.ins)}</i>${d.vig ? ' ' + esc(LN().kept) : ''}` : '';
  L.takeBlessing = function(){ if (!META.vigilBlessing) return false; delete META.vigilBlessing; return true; };
  { const f = startDeployment;
    startDeployment = function(){
      const out = f.apply(this, arguments);
      try { if (G && !(typeof inStoryNow === 'function' && inStoryNow()) && L.takeBlessing()){ G.vigil35 = true; saveMeta(); } } catch (e) {}
      return out;
    };
  }
  L.blessedRoll = g => !!(g && g.vigil35 && !g.firstMorale && !(g.moraleCd > 0));
  { const f = squadMorale;
    squadMorale = function(){
      if (!L.blessedRoll(G)) return f.apply(this, arguments);
      const had = G.mod.chaplain; G.mod.chaplain = true;
      try { pop(G.leader.x, G.leader.y - 62, LN().blessed, '#e8d9a0'); } catch (e) {}
      try { return f.apply(this, arguments); } finally { G.mod.chaplain = had; G.vigil35 = false; }
    };
  }

  /* ---- self-test ---- */
  L.selfTest = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const rng = L.rng, tr = META.treasury, room = ARM.room, add = ARM.add, price = ARM.price; let added = [];
    try {
      ARM.add = id => added.push(id); ARM.price = () => 40;
      const pool = L.spoilPool(1);
      ok('spoils pool: paid cards up to 120 x tier, no horses, no faction cards', pool.length && pool.every(x => x.cost > 0 && x.cost <= 120 && x.slot !== 'mount'), pool.length + '');
      ok('a higher tier opens dearer cards', L.spoilPool(3).length > pool.length);
      ARM.room = () => true; L.rng = () => 0.2; let lines = [];
      const w = L.spoils('win', {tier:1}, lines); ok('a win at under 25% adds one card and a line', w && added.length === 1 && /brought back/.test(lines[0]) && !/\{/.test(lines[0]), lines[0]);
      added = []; lines = []; const cw = L.spoils('costly', {tier:1}, lines); ok('a costly win rolls at the lower 10%', !cw && !added.length);
      L.rng = () => 0.05; ok('a costly win under 10% adds one', L.spoils('costly', {tier:1}, []) && added.length === 1);
      added = []; ok('fail, captured and lost never add', ['fail', 'captured', 'lostMate', 'officerDead', 'parlay'].every(k => !L.spoils(k, {tier:1}, [])) && !added.length);
      ARM.room = () => false; META.treasury = 100; lines = [];
      const s = L.spoils('win', {tier:1}, lines); ok('a full wagon sells the card on the spot', s && s.sold === 40 && META.treasury === 140 && !added.length && /sold/.test(lines[0]));
    } finally { L.rng = rng; META.treasury = tr; ARM.room = room; ARM.add = add; ARM.price = price; }
    // mentor
    const ret = META.retired, ros = META.roster, fac = META.facilities, tr2 = META.treasury;
    try {
      const fid = Object.keys(TRAINING).find(k => VETERANS[k] && TRAINING[k].some(t => !t.free && !t.spec));
      if (!fid){ ok('mentor: a facility with training and a veteran list', false, 'none found'); }
      else {
        const v = VETERANS[fid], m = v.match[0];
        const p = {id:-9901, name:'Pupil', race:m, cls:m, spec:m, adv:0, startCon:3};
        const q = {id:-9902, name:'Other', race:'__', cls:'__', spec:'__', adv:0, startCon:3};
        META.roster = [p, q]; META.treasury = 10000;
        META.retired = []; const base = trainingFor(fid, p).filter(t => t.cost > 0);
        ok('no staff: no mentor, prices as before', base.length && base.every(t => !t.mentor));
        META.retired = [{name:'Old Hand', facility:fid}];
        const cut = trainingFor(fid, p).filter(t => t.cost > 0 || t.mentor);
        ok('staff and a matching mate: a quarter off, rounded up', cut.length && cut.every((t, i) => t.mentor === 'Old Hand' && t.cost === Math.max(1, Math.ceil(base[i].cost * 0.75))), cut.map(t => t.cost).join('/') + ' vs ' + base.map(t => t.cost).join('/'));
        ok('a mate who does not match pays in full', trainingFor(fid, q).filter(t => t.cost > 0).every(t => !t.mentor));
        const c0 = base[0].cost, c1 = Math.max(1, Math.ceil(c0 * 0.75)); META.treasury = c1;
        const t1 = trainingFor(fid, p).find(t => t.k === base[0].k); ok('the gold check uses the cut price', c1 < c0 ? (t1.ok || t1.why !== 'not enough gold') : true);
      }
    } finally { META.retired = ret; META.roster = ros; META.facilities = fac; META.treasury = tr2; }
    // vigil
    const cl = META.campLife, vb = META.vigilBlessing, fac2 = META.facilities, mem0 = META.memorial, sm = saveMeta;
    try {
      saveMeta = () => {}; META.campLife = {queue: [], said: 0}; delete META.vigilBlessing; META.facilities = Object.assign({}, fac2); delete META.facilities.chapel;
      const rec = n => Array.from({length: n}, (_, i) => ({c: 'Job ' + i, out: 'win', stood: [], fell: []}));
      const two = {name: 'Two', mem: rec(2)}, r2 = {};
      ok('a mate with 2 memories gets no vigil', !L.onGrave(two, false, r2) && !r2.ins && !META.campLife.queue.length);
      const three = {name: 'Three', mem: rec(3), deployments: 4}, r3 = {};
      ok('3 memories: an inscription and two vigil talks', L.onGrave(three, false, r3) && /4 contracts/.test(r3.ins) && /Job 2/.test(r3.ins) && META.campLife.queue.filter(q => q.kind === 'vigil').length === 2, r3.ins);
      ok('no chapel: no blessing', !META.vigilBlessing);
      ok('the Leader gets no vigil', !L.onGrave(META.leader || three, true, {}) || !META.leader);
      META.facilities.chapel = 1; META.campLife.queue = [];
      L.onGrave({name: 'Four', mem: rec(3)}, false, {});
      ok('with a chapel: a blessing, taken once then cleared', META.vigilBlessing === true && L.takeBlessing() === true && !META.vigilBlessing && L.takeBlessing() === false);
      ok('the blessing doubles the first Morale roll only', L.blessedRoll({vigil35: true}) && !L.blessedRoll({vigil35: true, firstMorale: true}) && !L.blessedRoll({}));
      META.memorial = [Object.assign({}, r3)]; META.campLife.queue = META.campLife.queue.slice(0, 2);
      let x = null; if (window.CAMPLIFE && typeof CAMP !== 'undefined'){ const pp = CAMP.people;
        CAMP.people = [{kind: 'mate', p: {id: -1, name: 'A'}}, {kind: 'mate', p: {id: -2, name: 'B'}}];
        try { META.campLife.queue = [{kind: 'vigil', name: 'Three', comrade: null, vid: r3.vid, last: true}]; x = CAMPLIFE.choose(); } finally { CAMP.people = pp; } }
      ok('the last vigil talk marks the grave', !window.CAMPLIFE || (x && x.kind === 'vigil' && META.memorial[0].vig === true), x ? x.kind : 'none');
      ok('an old grave draws as before', L.graveLine({name: 'Old'}) === '' && /vigil was kept/.test(L.graveLine(META.memorial[0])));
    } finally { META.campLife = cl; if (vb === undefined) delete META.vigilBlessing; else META.vigilBlessing = vb; META.facilities = fac2; META.memorial = mem0; saveMeta = sm; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
