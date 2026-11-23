/* ============================================================================
   INDEX FIRST48 - F-48 D1 and T3 (Patrick 2026-11-15; audits/f48-ux-review.md)
   D1. A new chapter's first board offers one easy job that is not Hold, with a
       small enemy count, marked as a fair bet. After the first contract the
       normal board returns. The job is slot 1 of the board (the default pick).
       It uses the campaign's teach dials (js/campaign/f34.js): fewer cages, an
       enemy cap at the start, no enemies arriving later, fewer enemy traps.
       Three dials are new here, because the bot test showed each one adds
       enemies after the start: noBoss (the tier 1 commander has 55 Condition
       and calls 3 more every 5 seconds), blips (hidden tokens that turn into
       an ambush or a sniper nest), noHunt (the hunting party a cage calls).
   T3. The briefing gains one line for each Cleric in the squad who keeps a
       Deity tenet, so the Favour penalty in the field report is not a surprise.
   [S] tunables: FIRST48.obj, FIRST48.host, FIRST48.teach (values below).
   INT-1 group 10: FIRST48.on and FIRST48.tenets baked in (no switch).
   K11 (Q15, Patrick 2026-11-16): the board after the prologue's Founding also
   leads with the easy job. The Founding sets META.deployments = 1, so a flag on
   the save (META.first48due) marks that first board. Off: FIRST48.afterFound = false.
============================================================================ */
(function(){
  const F = window.FIRST48 = {
    afterFound: true,   // K11 switch
    obj: 'rescue', host: 'bandits',                                   // [S]
    teach: {cages: 2, enemyCap: 9, noAmbient: true, traps: 1,         // [S] the campaign's dials
            noBoss: true, blips: 0, noHunt: true},                    // [S] the three dials added here
    label: 'A fair bet. A small job to start the chapter: few enemies, and no more arrive.'
  };
  const has = n => { try { return typeof eval(n) !== 'undefined'; } catch (e) { return false; } };
  const E = s => String(s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));

  /* ---- D1: the first board ------------------------------------------------ */
  F.isFirst = function(){
    try {
      if (!META || !META.leader) return false;
      if (META.deployments > 0 && !(F.afterFound && META.first48due && META.deployments === 1)) return false;   // K11
      if (has('inStoryNow') && inStoryNow()) return false;
      return true;
    } catch (e) { return false; }
  };
  F.make = function(){
    const c = makeContract(F.obj, 1);
    if (F.host && HOSTS[F.host]){ c.host = F.host; try { c.brief = CONTRACTS[F.obj].desc(c); } catch (e) {} }
    c.teach = Object.assign({}, F.teach); c.first48 = true;
    return c;
  };
  if (typeof rollBoard === 'function'){ const f = rollBoard;
    rollBoard = function(){
      const first = F.isFirst(), r = f.apply(this, arguments);
      try {
        if (first && META.board && META.board.length && !META.board.some(c => c && c.first48)){
          const rest = META.board.filter(c => c && c.obj !== F.obj);
          META.board = [F.make()].concat(rest).slice(0, META.board.length);
          saveMeta();
        }
      } catch (e) {}
      return r;
    };
  }
  // K11: the prologue's Founding flags the save, so its first board leads with the easy job
  if (typeof finishFound === 'function'){ const f = finishFound;
    finishFound = function(){
      const story = !!(typeof FD !== 'undefined' && FD && FD.fromStory), r = f.apply(this, arguments);
      try { if (story && FD === null && META){ META.first48due = true; saveMeta(); } } catch (e) {}
      return r;
    };
  }
  // the three extra dials: applied after the campaign's own (its startDeployment wrapper runs inside this one)
  F.live = () => { try { const c = G && G.contract; return c && c.first48 && c.teach ? c.teach : null; } catch (e) { return null; } };
  if (typeof startDeployment === 'function'){ const f = startDeployment;
    startDeployment = function(contract){
      const r = f.apply(this, arguments);
      try {
        const t = contract && contract.first48 && contract.teach;
        if (t && G){
          if (t.noBoss && G.enemies) G.enemies = G.enemies.filter(e => !(BESTIARY[e.k] && BESTIARY[e.k].boss));
          if (t.blips !== undefined && G.blips) G.blips = G.blips.slice(0, t.blips);
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof huntingParty === 'function'){ const f = huntingParty;
    huntingParty = function(){ const t = F.live(); if (t && t.noHunt) return; return f.apply(this, arguments); };
  }
  // the card on the Planning Table: say it is a fair bet, in place of the squad forecast
  if (typeof renderTable === 'function'){ const f = renderTable;
    renderTable = function(){
      const r = f.apply(this, arguments);
      try {
        if (META && META.board) document.querySelectorAll('.cscroll').forEach((el, i) => {
          const c = META.board[i]; if (!c || !c.first48) return;
          let d = el.querySelector('.fc35');
          if (!d){ d = document.createElement('div'); d.className = 'desc fc35'; d.style.cssText = 'font-size:14px';
            const cost = el.querySelector('.cost'); if (cost && cost.parentNode) cost.parentNode.insertBefore(d, cost); else el.appendChild(d); }
          d.innerHTML = '<b>Forecast for your squad:</b> ' + E(F.label);
        });
      } catch (e) {}
      return r;
    };
  }

  /* ---- T3: tenet lines on the briefing ------------------------------------ */
  F.tenetLines = function(){
    const out = [];
    try {
      if (!has('deityOf') || !has('DEITIES')) return out;
      const people = [];
      if (META && META.leader) people.push(META.leader);
      ((typeof G !== 'undefined' && G && G.squad) || []).forEach(m => { if (m && m.p) people.push(m.p); });
      people.forEach(p => {
        if (!p || p.spec !== 'CLERIC') return;
        const d = deityOf(p), D = d && DEITIES[d]; if (!D) return;
        out.push(`${p.name} keeps the tenet of ${D.name}. ${D.tenet} Breaking it costs 2 Favour on the next contract.`);
      });
    } catch (e) {}
    return out;
  };
  if (window.BRIEFING && typeof BRIEFING.html === 'function'){ const f = BRIEFING.html;
    BRIEFING.html = function(c){
      let h = f.apply(this, arguments);
      try {
        // the first job has no commander, so the briefing must not name one
        if (c && c.first48 && c.teach && c.teach.noBoss) h = h.replace(/\. Led by [^.<]*\./, '.');
        const lines = F.tenetLines();
        if (lines.length){
          const block = lines.map(t => `<div class="sub first48-tenet" style="color:#c8b8e0;font-size:14px;max-width:680px">${E(t)}</div>`).join('');
          const at = h.indexOf('<div id="brief-prog"');
          h = at >= 0 ? h.slice(0, at) + block + h.slice(at) : h + block;
        }
      } catch (e) {}
      return h;
    };
  }

  /* ---- self-test: FIRST48.selfTest() (restores META, G and the switches) --- */
  F.selfTest = function(){
    const fails = [], ok = (m, c) => { if (!c) fails.push(m); };
    const bak = {meta: META, g: (typeof G !== 'undefined' ? G : null), key: SAVE_KEY};
    try {
      SAVE_KEY = 'sim_first48'; META = freshMeta();
      META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); META.deployments = 0;
      rollBoard();
      const c = META.board[0];
      ok('the first board leads with the easy job', !!(c && c.first48 && c.obj === F.obj && c.tier === 1));
      ok('the easy job is not Hold', c && c.obj !== 'hold');
      ok('it carries the teach dials', !!(c && c.teach && c.teach.noAmbient && c.teach.enemyCap === F.teach.enemyCap));
      ok('it carries the three extra dials', !!(c && c.teach && c.teach.noBoss && c.teach.blips === 0 && c.teach.noHunt));
      ok('only one job of that kind is on the board', META.board.filter(x => x.obj === F.obj).length === 1);
      META.deployments = 1; META.board = null; rollBoard();
      ok('the second board is the normal one', !META.board.some(x => x.first48 || (x.teach && !x.f03)));   /* an F03 Garrison Bait job carries teach.noAmbient on a normal board (QA) */
      META.deployments = 1; META.first48due = true; META.board = null; rollBoard();
      ok('K11: the first board after the Founding leads with the easy job', !!(META.board[0] && META.board[0].first48));
      F.afterFound = false; META.board = null; rollBoard();
      ok('K11: afterFound off gives the normal board', !META.board.some(x => x.first48)); F.afterFound = true;
      META.deployments = 2; META.board = null; rollBoard();
      ok('K11: once that job is played the board is normal', !META.board.some(x => x.first48)); delete META.first48due;
      const cl = makeMate('HUMAN', 'FREEMAN', 'CLERIC', 'Cleric'); cl.deity = 'sorvaine';
      G = {squad: [{p: cl}, {p: makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Sword')}]};
      const t = F.tenetLines();
      ok('one tenet line for the one Cleric', t.length === 1 && t[0].indexOf('Sorvaine') >= 0 && t[0].indexOf('2 Favour') >= 0);
    } catch (e) { fails.push('ERR ' + e.message); }
    finally {
      META = bak.meta; G = bak.g; SAVE_KEY = bak.key;
      try { localStorage.removeItem('sim_first48'); } catch (e) {}
    }
    return {pass: !fails.length, fails};
  };
})();
