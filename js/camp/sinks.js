/* Index SINKS1: gold sinks (Fable, 2026-11-11; Patrick's answers to the job 8 questions, audits/fable/economy.md "Sinks").
   1. Destriers cost SINKS.DESTRIER (1,800gp) instead of 900gp: two contracts' pay when they unlock.
   2. The Masters' Tithe: a tenth of the contract's pay goes back to the Dust Cloaks masters on every paid contract;
      a Chapter holding SINKS.RICH (2,000gp) or more after the pay sends a fifth.
   3. Greasing the talks: at a Parley, a purse from the Treasury buys +1 step on the Leader's roll, up to SINKS.BRIBE_MAX
      steps; each step costs SINKS.BRIBE_SHARE (a fifth) of the contract's pay times the steps already bought plus one,
      so the price climbs with the contract's tier and with every purse.
   4. Chapter finery at the Edelos factor: four dear portrait frames (300 to 1,200gp) and four royal dyes (150gp each).
   Switches: SINKS.ON.destrier / tithe / bribe / finery (all on; SINKS.apply() after a change). ROLLBACK: remove the script tag.
   Test: SINKS.selfTest(). */
(function(){
  'use strict';
  const S = window.SINKS = {
    ON: {destrier: true, tithe: true, bribe: true, finery: true},
    DESTRIER: 1800, DESTRIER_WAS: 900,
    TITHE: 0.10, TITHE_RICH: 0.20, RICH: 2000,
    BRIBE_SHARE: 0.20, BRIBE_MAX: 3,
    FRAMES: {
      wyrm:     {name: 'Wyrm Scale',          cost: 300,  o: '#1a3a2a', i: '#3aa06a', stud: '#e0ffb0'},
      obsidian: {name: 'Obsidian and Gold',   cost: 500,  o: '#080808', i: '#2a2a30', stud: '#d4af37'},
      sunburst: {name: 'Sunburst',            cost: 800,  o: '#7a3a00', i: '#f0b030', stud: '#fff8c0'},
      masters:  {name: "The Masters' Grey",   cost: 1200, o: '#2a2a2e', i: '#8a8a92', stud: '#d4af37'}
    },
    DYES: [['#d4af37', 'Old Gold'], ['#f8f4e8', 'Ivory'], ['#8a0a1a', 'Imperial Scarlet'], ['#0a3a6a', 'Lapis']],
    DYE_COST: 150
  };

  /* 1. Destriers */
  S.apply = function(){
    if (typeof GEAR !== 'undefined'){ const d = GEAR.find(g => g.id === 'destrier'); if (d) d.cost = S.ON.destrier ? S.DESTRIER : S.DESTRIER_WAS; }
    if (typeof FRAMES !== 'undefined'){ for (const id in S.FRAMES){ if (S.ON.finery) FRAMES[id] = S.FRAMES[id]; else delete FRAMES[id]; } }
  };
  S.apply();

  /* 2. The Masters' Tithe: pay is the contract pay the ledger credited (full or half), held is the Treasury after it */
  S.titheRate = held => held >= S.RICH ? S.TITHE_RICH : S.TITHE;
  S.titheOf = (pay, held) => S.ON.tithe && pay > 0 ? Math.round(pay * S.titheRate(held)) : 0;
  S.paidBase = (c, result) => {
    if (!(result === 'victory' || result === 'withdrawn')) return 0;
    const full = Math.round(c.pay * (c.edges && c.edges.includes('terms') ? 1.2 : 1));
    return (result === 'victory' || (typeof hasDoc === 'function' && hasDoc('ledgerseal'))) ? full : Math.round(full / 2);
  };
  if (typeof contractDebrief === 'function'){
    const f = contractDebrief;
    contractDebrief = function(c, result, lines){
      f(c, result, lines);
      if (!G || G.sinksDone) return; G.sinksDone = true;
      if (G.bribeGold) lines.push(`<p>Gold greased the talks at the Parley: <b>-${G.bribeGold}gp</b> from the Treasury (+${G.bribe} on the roll).</p>`);
      if (!S.ON.tithe) return;
      const t = Math.min(Math.max(0, META.treasury), S.titheOf(S.paidBase(c, result), META.treasury));
      if (!t) return;
      const fifth = S.titheRate(META.treasury) === S.TITHE_RICH;
      META.treasury -= t; G.tithe = t;
      for (let i = 0; i < lines.length; i++) lines[i] = String(lines[i]).replace(/(Now|Treasury now) -?\d+gp/, '$1 ' + META.treasury + 'gp');   /* the debrief's earlier "Now N" was printed before the tithe: bring it to the figure after it */
      lines.push(`<p>The Masters' Tithe: <b>-${t}gp</b>, ${fifth ? 'a fifth of the pay (a Chapter this rich sends more)' : 'a tenth of the pay'} to the Dust Cloaks masters${window.CATCH2J ? CATCH2J.fill((window.CAMPAIGN_LINES && CAMPAIGN_LINES.catches && CAMPAIGN_LINES.catches.masters) || CATCH2J.W.masters) : ''}. Treasury now ${META.treasury}gp.</p>`);
    };
  }

  /* 3. Greasing the talks */
  S.bribeCost = (n, c) => { c = c || (G && G.contract); return c ? Math.round(c.pay * S.BRIBE_SHARE * (n + 1) / 5) * 5 : 0; };
  S.bribe = function(){
    if (!S.ON.bribe || typeof PARLAY === 'undefined' || !PARLAY || PARLAY.rolled || !G) return;
    const n = G.bribe || 0, cost = S.bribeCost(n);
    if (n >= S.BRIBE_MAX || META.treasury < cost) return SFX.play('nope');
    META.treasury -= cost; G.bribe = n + 1; G.bribeGold = (G.bribeGold || 0) + cost;
    SFX.play('coin'); saveMeta(); renderParlay();
  };
  if (typeof parlayMods === 'function'){
    const f = parlayMods;
    parlayMods = function(e){ const out = f(e); if (G && G.bribe) out.push(`+${G.bribe} gold changed hands`); return out; };
  }
  if (typeof renderParlay === 'function'){
    const f = renderParlay;
    renderParlay = function(){
      f();
      if (!S.ON.bribe || !PARLAY || PARLAY.rolled || !G) return;
      const row = $('parlay-inner').querySelector('.row'); if (!row) return;
      const n = G.bribe || 0, cost = S.bribeCost(n), full = n >= S.BRIBE_MAX, can = !full && META.treasury >= cost;
      if (!n && !cost) return;   // Planner replay 7: a contract that pays nothing (the road nights) has no purse to grease with
      const desc = full ? `They will take no more. Paid so far: +${n}.`
        : `A purse from the Treasury: +1 step on your roll for ${cost}gp (${META.treasury}gp held).${n ? ` Paid so far: +${n}.` : ''}${can ? '' : ' Not enough gold.'}`;
      row.insertAdjacentHTML('beforeend', `<div class="card${can ? '' : ' static'}" style="width:230px${can ? '' : ';opacity:.6'}" ${can ? 'onclick="SINKS.bribe()"' : ''}><div class="ttl">Grease the Talks</div><div class="desc">${desc}</div></div>`);
    };
  }

  /* 4. Chapter finery: frames join FRAMES (the factor lists every frame); the royal dyes get their own block */
  if (typeof traderShopHTML === 'function'){
    const f = traderShopHTML;
    traderShopHTML = function(){
      let h = f();
      if (!S.ON.finery) return h;
      const C2 = cosm(), tr = META.treasury;
      const block0 = `<div class="desc" style="text-align:left;margin-top:6px"><b>Royal dyes</b> (${S.DYE_COST}gp each; the colours of courts and cathedrals):</div><div class="mini" style="justify-content:flex-start">` +
        S.DYES.map(([c, n]) => C2.dyes.includes(c) ? `<button disabled style="background:${c};color:${c === '#f8f4e8' || c === '#d4af37' ? '#222' : '#fff'}">${n} ✓</button>`
          : `<button ${tr >= S.DYE_COST ? '' : 'disabled'} style="border-left:10px solid ${c}" onclick="buyCosm('dye','${c}',${S.DYE_COST})">${n}</button>`).join('') + '</div>';
      const own96 = S.DYES.filter(([c]) => C2.dyes.includes(c)).length;   // UX K96: a closed section like the other wares
      const block = typeof sec96 === 'function' ? sec96('ware:royal', `<b>Royal dyes</b> <span style="opacity:.8">· ${S.DYE_COST}gp each, ${own96} of ${S.DYES.length} owned</span>`, block0) : block0;
      const mark = '<div class="desc" style="font-size:14px;color:#6a5a44;margin-top:4px">Cosmetics change';
      const i = h.indexOf(mark);
      return i < 0 ? h + block : h.slice(0, i) + block + h.slice(i);
    };
  }

  S.selfTest = function(){
    const details = []; let pass = 0, fail = 0;
    const ok = (name, cond) => { if (cond) pass++; else fail++; details.push((cond ? 'ok ' : 'FAIL ') + name); };
    const d = typeof GEAR !== 'undefined' && GEAR.find(g => g.id === 'destrier');
    ok('Destriers cost 1800', d && d.cost === 1800);
    ok('tithe: a tenth of 300 is 30, a fifth when 2000gp is held', S.titheOf(300, 500) === 30 && S.titheOf(300, 2000) === 60 && S.titheOf(0, 2000) === 0);
    ok('paid base: full on a win, half on a withdrawal, terms x1.2', S.paidBase({pay: 300}, 'victory') === 300 && S.paidBase({pay: 300}, 'fled') === 0 && S.paidBase({pay: 300, edges: ['terms']}, 'victory') === 360);
    ok('bribe: 600gp contract costs 120 / 240 / 360', S.bribeCost(0, {pay: 600}) === 120 && S.bribeCost(1, {pay: 600}) === 240 && S.bribeCost(2, {pay: 600}) === 360);
    ok('finery: four frames in FRAMES, four royal dyes', typeof FRAMES !== 'undefined' && ['wyrm', 'obsidian', 'sunburst', 'masters'].every(id => FRAMES[id] && FRAMES[id].cost >= 300) && S.DYES.length === 4);
    const on = S.ON.destrier; S.ON.destrier = false; S.apply(); const back = d && d.cost === 900; S.ON.destrier = on; S.apply();
    ok('switch off restores 900gp', back && d.cost === 1800);
    return {pass, fail, details};
  };
})();
