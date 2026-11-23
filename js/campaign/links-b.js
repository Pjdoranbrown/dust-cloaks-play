/* INDEX L35b: F-29 Camp links, build step 3: the prisoner links. Prisoner exchange (link 1) and the lead contract (link 6).
   Scope: audits/links-f29.md (Patrick accepted every recommended answer, 2026-11-13; build GO 2026-11-14).
   - Exchange: with the Cells built, a held enemy commander whose host matches the captor of an officer in
     META.detachCaptives gets an "Offer in exchange" button on the prisoner row. Haggle roll attackDie(Per, 5), +1 step with
     Propaganda & Parley: solid or crit, a clean swap; graze, the swap happens but the officer comes home with one injury;
     miss, no swap and the commander stays held (one try per commander until the next contract ends). The commander is gone:
     no ransom, no recruit, no Liberation deed. It costs no rescue board slot.
   - Lead: a Full Success interrogation of a commander also queues a lead ({kind:'lead'} in META.detachPending). The next two
     boards carry a contract of the prisoner's host and tier (assassinate or hunt) at +25% pay, never beside a Charter Finale.
     Winning it pays a bounty line (the revenge path's 50 x tier).
   Prisoners now carry the host of the contract they were taken on (pr.host); older prisoners have none and cannot be swapped.
   Numbers are drafts for Systems: LINKS35.K. No switches (removed in INT-1, 2026-11-15).
   Lines: window.LINKS35_LINES (swap*, leadBrief, leadPaid) or the placeholders below. */
(function(){
  const L = window.LINKS35; if (!L || typeof prisonerAct !== 'function') return;
  Object.assign(L.K, {leadPay: 1.25, leadBoards: 2, leadBounty: 50});   // [S] drafts
  const LN = () => Object.assign({
    swapBtn: 'Offer in exchange for {officer}',
    swapClean: 'Haggling roll {face}: {officer} walks back into camp. {name} goes the other way.',
    swapHurt: 'Haggling roll {face}: the swap is made, but {officer} comes home hurt: {injury}.',
    swapMiss: 'Haggling roll {face}: they will not trade. {name} stays in the cells.',
    leadBrief: '{name} told you where {the} hide at {place}.',
    leadTag: 'A lead from {name}',
    leadPaid: 'The lead from {name} paid off: +{gp}gp bounty.'
  }, window.LINKS35_LINES || {});
  const fillL = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const pend = () => (META.detachPending = Array.isArray(META.detachPending) ? META.detachPending : []);
  const caps = () => Array.isArray(META.detachCaptives) ? META.detachCaptives : [];
  const oidOf = ce => ce.officerId != null ? ce.officerId : (ce.officer && ce.officer.id);

  /* ---- prisoners remember their host ---- */
  { const f = endDeployment;
    endDeployment = function(){
      try { if (G && G.contract && Array.isArray(G.prisoners)) for (const pr of G.prisoners) if (pr && !pr.host) pr.host = G.contract.host; } catch (e) {}
      const out = f.apply(this, arguments);
      try { if (META && Array.isArray(META.prisoners)) for (const pr of META.prisoners) delete pr.swapTried; } catch (e) {}   // a fresh try each camp visit
      return out;
    };
  }

  /* ---- 1. prisoner exchange ---- */
  L.swapsFor = function(pr){
    if (!pr || pr.kind !== 'commander' || !pr.host || pr.swapTried || !has('cells')) return [];
    return caps().filter(ce => ce.host === pr.host && (ce.boardsLeft == null || ce.boardsLeft > 0));
  };
  L.roll = (sk, t) => attackDie(sk, t);
  L.swap = function(i, oid){
    const pr = META.prisoners[i], ce = L.swapsFor(pr).find(c => oidOf(c) === oid); if (!ce) return null;
    const o = officers().find(x => x.id === oid) || ce.officer, T = LN();
    const sk = leaderStats(META.leader).per + (hasDoc('propaganda') ? 1 : 0), r = L.roll(sk, 5);
    const v = {face: r.face, officer: o ? o.name : 'the officer', name: pr.name};
    if (r.out === 'miss'){ pr.swapTried = true; CH_MSG = esc(fillL(T.swapMiss, v)); }
    else {
      META.detachCaptives = caps().filter(c => c !== ce);
      META.detachPending = pend().filter(p => !(p.kind === 'rescue' && p.officerId === oid));
      META.prisoners.splice(i, 1);
      if (o){ delete o.away;
        if (r.out === 'graze'){ const inj = INJURIES[d6() - 1]; o.injuries = Array.isArray(o.injuries) ? o.injuries : []; o.injuries.push(inj.id); v.injury = inj.name; } }
      CH_MSG = esc(fillL(r.out === 'graze' ? T.swapHurt : T.swapClean, v));
    }
    try { SFX.play('pick'); } catch (e) {}
    saveMeta(); renderChapter();
    return r.out;
  };
  { const f = renderTable;
    renderTable = function(){
      const out = f.apply(this, arguments);
      try { (META.prisoners || []).forEach((pr, i) => {
        const S = L.swapsFor(pr); if (!S.length) return;
        const b = document.querySelector(`#table-inner button[onclick="prisonerAct(${i},'ransom')"]`); if (!b) return;
        b.parentNode.insertAdjacentHTML('beforeend', S.map(ce => { const id = oidOf(ce), o = officers().find(x => x.id === id) || ce.officer;
          return `<button onclick="LINKS35.swap(${i},${JSON.stringify(id).replace(/"/g, '&quot;')})">${esc(fillL(LN().swapBtn, {officer: o ? o.name : 'your officer'}))}</button>`; }).join(''));
      }); } catch (e) { console.warn('LINKS35 swap UI', e); }
      return out;
    };
  }

  /* ---- 6. interrogation opens a lead contract ---- */
  L.lead = function(pr){
    if (!pr || pr.kind !== 'commander') return null;
    const host = pr.host || pickOf(HOST_KEYS);
    let obj = Math.random() < 0.5 ? 'assassinate' : 'hunt';
    if (typeof hostsFor === 'function' && hostsFor(obj, [host])[0] !== host) obj = 'hunt';   // PD-29: a beast host's lead is a hunt
    const p = {kind: 'lead', obj, tier: pr.tier || 1, host,
               name: pr.name, boardsLeft: L.K.leadBoards, id: 'L' + Date.now().toString(36) + (Math.random() * 1e4 | 0)};
    pend().push(p); return p;
  };
  { const f = prisonerAct;
    prisonerAct = function(i, act){
      if (act !== 'interrogate') return f.apply(this, arguments);
      const pr = META.prisoners[i], before = META.intel; META.intel = null;
      let out; try { out = f.apply(this, arguments); } finally {
        const full = META.intel === 'full'; if (META.intel == null) META.intel = before;
        try { if (full && L.lead(pr)) saveMeta(); } catch (e) {}
      }
      return out;
    };
  }
  L.leadContract = function(p){
    const rc = makeContract(p.obj, p.tier); rc.host = p.host;
    rc.pay = Math.round(rc.pay * L.K.leadPay / 5) * 5; rc.lead = p.name; rc.leadId = p.id;
    const T = LN(); rc.brief = fillL(T.leadBrief, {name: p.name, the: HOSTS[rc.host] ? HOSTS[rc.host].the : 'they', place: rc.place}) + ' ' + CONTRACTS[p.obj].desc(rc);
    rc.leadTag = fillL(T.leadTag, {name: p.name});
    return rc;
  };
  { const f = rollBoard;
    rollBoard = function(){
      const out = f.apply(this, arguments);
      try { if (L.leadPass()) saveMeta(); } catch (e) { console.warn('LINKS35 lead board', e); }
      return out;
    };
  }
  L.leadPass = function(){   // puts each waiting lead on the board; true if anything changed
        if (!META || !Array.isArray(META.detachPending)) return false;
        META.board = META.board || []; let ch = false;
        for (const p of META.detachPending.filter(p => p && p.kind === 'lead')){
          if (META.board.some(c => c.finale)) continue;                         // never beside a Charter Finale; the lead waits
          META.board.push(L.leadContract(p)); p.boardsLeft--; ch = true;
        }
        const n0 = META.detachPending.length; META.detachPending = META.detachPending.filter(p => !(p && p.kind === 'lead' && p.boardsLeft <= 0));
        return ch || n0 !== META.detachPending.length;
  };
  { const f = renderDebrief;
    renderDebrief = function(head, lines){
      try { const c = G && G.over && G.contract;
        if (c && c.leadId && !G.leadDone && Array.isArray(lines)){ G.leadDone = true;
          META.detachPending = pend().filter(p => p.id !== c.leadId);
          if (G.result === 'victory'){ const gp = L.K.leadBounty * (c.tier || 1); META.treasury += gp;
            lines.push(`<p class="good">${esc(fillL(LN().leadPaid, {name: c.lead, gp}))}</p>`); }
          saveMeta(); } } catch (e) { console.warn('LINKS35 lead debrief', e); }
      return f.apply(this, arguments);
    };
  }

  /* ---- self-test ---- */
  L.selfTestB = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const sv = {ld: META.leader, pr: META.prisoners, dc: META.detachCaptives, dp: META.detachPending, of: META.officers, fac: META.facilities, intel: META.intel,
                board: META.board, tr: META.treasury, msg: CH_MSG, roll: L.roll, sm: saveMeta, rc: renderChapter, cm: checkMilestones, ls: leaderStats};
    try {
      saveMeta = () => {}; renderChapter = () => {}; checkMilestones = () => {}; leaderStats = () => ({per: 3});   // a save with no Leader still tests
      if (!META.leader) META.leader = {name: 'Test'};   // the dice panel names the Leader
      const setup = () => {
        META.officers = [{id: 7001, name: 'Ser Hal', away: 'captive', injuries: []}];
        META.detachCaptives = [{officer: META.officers[0], officerId: 7001, host: 'bandits', tier: 1, boardsLeft: 2}];
        META.detachPending = [{kind: 'rescue', obj: 'rescue', tier: 1, host: 'bandits', officerId: 7001}];
        META.prisoners = [{kind: 'commander', name: 'Grell', host: 'bandits', tier: 1, value: 100, age: 0}];
        META.facilities = Object.assign({}, sv.fac, {cells: 1});
      };
      setup(); L.roll = () => ({out: 'solid', face: 6});
      ok('a commander of the captor\'s host offers a swap', L.swapsFor(META.prisoners[0]).length === 1);
      L.swap(0, 7001);
      ok('a clean swap: captive, pending and prisoner gone, officer home', !META.detachCaptives.length && !META.detachPending.length && !META.prisoners.length && !META.officers[0].away);
      setup(); L.roll = () => ({out: 'graze', face: 4}); L.swap(0, 7001);
      ok('a graze: swapped, the officer has one injury', !META.prisoners.length && META.officers[0].injuries.length === 1 && !META.officers[0].away);
      setup(); L.roll = () => ({out: 'miss', face: 1}); L.swap(0, 7001);
      ok('a miss keeps all three and spends the try', META.detachCaptives.length === 1 && META.detachPending.length === 1 && META.prisoners.length === 1 && META.officers[0].away && !L.swapsFor(META.prisoners[0]).length);
      setup(); delete META.facilities.cells; ok('no cells: no swap', !L.swapsFor(META.prisoners[0]).length);
      setup(); META.prisoners[0].host = 'undead'; ok('another host: no swap', !L.swapsFor(META.prisoners[0]).length);
      setup(); META.prisoners[0].kind = 'common'; ok('a common prisoner: no swap', !L.swapsFor(META.prisoners[0]).length);
      // lead
      setup(); META.detachPending = [];
      ok('a commander lead goes to the pending list', L.lead(META.prisoners[0]) && META.detachPending.length === 1 && META.detachPending[0].kind === 'lead');
      ok('a common prisoner gives no lead', !L.lead({kind: 'common', name: 'x'}) && META.detachPending.length === 1);
      { let hunt = true; for (let i = 0; i < 20; i++){ const q = L.lead({kind: 'commander', host: 'monsters', name: 'x'}); hunt = hunt && q.obj === 'hunt' && q.host === 'monsters'; } META.detachPending.length = 1;
        ok('a lead against a beast host is always a hunt (PD-29)', hunt); }
      const rc = L.leadContract(META.detachPending[0]), base = makeContract(rc.obj, 1);
      ok('the lead contract: host, name in the brief, +25% pay', rc.host === 'bandits' && rc.brief.indexOf('Grell') === 0 && rc.lead === 'Grell' && rc.pay === Math.round(base.pay * L.K.leadPay / 5) * 5, rc.pay + ' vs ' + base.pay);
      ok('it sits on two boards, then expires', (() => { const p = META.detachPending[0]; p.boardsLeft = 2; let seen = 0;
        for (let k = 0; k < 3; k++){ META.board = []; L.leadPass(); if (META.board.some(c => c.leadId === p.id)) seen++; } return seen === 2 && !META.detachPending.some(q => q.id === p.id); })());
      META.detachPending = [{kind: 'lead', obj: 'hunt', tier: 1, host: 'bandits', name: 'Grell', boardsLeft: 2, id: 'Ltest'}];
      META.board = [{finale: true}]; L.leadPass();
      ok('never beside a Charter Finale: the lead waits', META.board.length === 1 && META.detachPending[0].boardsLeft === 2);
      // interrogation wrapper: full success queues a lead, partial does not
      META.board = []; META.detachPending = []; META.intel = 'blips'; META.prisoners = [{kind: 'commander', name: 'Grell', host: 'bandits', tier: 1, value: 100}];
      const ad = attackDie; let face = {out: 'solid', face: 6};
      attackDie = () => face;
      try {
        prisonerAct(0, 'interrogate');
        ok('a Full Success interrogation adds one lead', META.intel === 'full' && META.detachPending.filter(p => p.kind === 'lead').length === 1);
        META.detachPending = []; META.intel = 'full'; META.prisoners = [{kind: 'commander', name: 'Mox', host: 'bandits', tier: 1, value: 100}];
        face = {out: 'miss', face: 1}; const cells = !!(typeof mastery === 'function' && mastery('cells'));
        prisonerAct(0, 'interrogate');
        ok('a failed one adds none and keeps the old intel', cells || (!META.detachPending.length && META.intel === 'full'));
      } finally { attackDie = ad; }
    } catch (e) { ok('threw', false, e && e.message); }
    finally {
      META.prisoners = sv.pr; META.detachCaptives = sv.dc; META.detachPending = sv.dp; META.officers = sv.of; META.facilities = sv.fac; META.intel = sv.intel;
      META.board = sv.board; META.treasury = sv.tr; CH_MSG = sv.msg; L.roll = sv.roll; saveMeta = sv.sm; renderChapter = sv.rc; checkMilestones = sv.cm; leaderStats = sv.ls; META.leader = sv.ld;
    }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
