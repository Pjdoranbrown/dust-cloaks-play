/* INDEX BR2 - The War Council sits in the briefing (F-26, Patrick, 2026-11-12). The council used to be a panel on the planning
   table, rolled before the job was signed, and its Edges were read once when the field started. Now the table only names the
   Chapter Master and takes the doctrine declarations and the decline; SIGN AND MARCH opens the briefing (BR1) as before, and the
   briefing holds the council while the field's clips build behind it: the roll (rollCouncil, with the Luck re-roll and Hard
   Bargainers as on the table), then the Edge picks. CONTINUE shows once the picks are spent and the core clips are built. The
   Edges apply when the briefing closes (BRIEFING.go): recon reveals the map and turns the Blip Tokens, asset drops the two
   poultices, approach starts the 90 s fog and the two Wards then, terms is read at the debrief from c.edges as before. Only a
   contract from the board (META.board[MU.contract]) gets the council; the drill, the brawl, raids, the story and the harness do not.
   Wrapper only: BRIEFING.show/tick/go/hide, startDeployment and renderTable are wrapped, nothing in index.html is edited.
   Rollback: BRIEFING.wc.on = false (the table's roll button and the old flow come back on the next render). */
(function(){
  'use strict';
  const B = window.BRIEFING; if (!B) return;
  const W = B.wc = {on: true, up: false};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const has = n => typeof gl(n) === 'function';
  const E = s => has('esc') ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
  const $ = id => document.getElementById(id);

  /* ---------------------------------------------------------------- when --- */
  // Only the contract the table signed (MU.contract on META.board) has a Chapter Master to talk for it.
  W.boardContract = function(c, mu, M){ mu = mu === undefined ? gl('MU') : mu; M = M === undefined ? gl('META') : M; return !!(c && mu && M && M.board && M.board[mu.contract] === c); };
  W.applies = function(c, mu, M){ return W.on && W.boardContract(c, mu, M) && !B.skip(c); };
  W.done = c => !!(c && c.council && (c.picks || 0) <= 0);
  W.canGo = (c, ready) => !!ready && (!W.up || W.done(c));

  /* ---------------------------------------------------------------- the block --- */
  W.html = function(c){
    const EDGES = gl('EDGES') || [], diff = has('councilDiff') ? councilDiff(c) : '?';
    let h = `<div class="speech" style="margin:0 0 8px">"${E(has('councilLine') ? councilLine(c) : '')}"</div>`;
    if (!c.council){
      const opts = [['hardbargain', 'Hard Bargainers'], ['quartered', 'Quartered in Advance']].filter(([id]) => has('hasDoc') && hasDoc(id));
      if (opts.length) h += `<div class="sub" style="font-size:14px;text-align:left"><b>Declare a War Council doctrine</b> (one a contract):<br>${opts.map(([id, n]) => `<button class="btn small ${c.declared === id ? 'gold' : ''}" onclick="wcDeclare('${id}')">${n}${c.declared === id ? ' (declared)' : ''}</button>`).join('')}</div>`;
      h += `<div style="text-align:center;margin:6px 0"><button class="btn gold" onclick="rollCouncil()">ROLL THE WAR COUNCIL</button></div>
        <div class="sub" style="font-size:14px">Each die that beats ${diff} (how hard this patron bargains) wins one Contract Edge: a head start on the field. Luck can re-roll the Leader's die.</div>`;
      return h;
    }
    h += `<div class="dice">${c.council.map(d => `<div class="die ${d.res}"><b style="${has('dieStyle') ? dieStyle(d.skill) : ''}">${d.face}</b>${E(d.label)}<br>Skill ${d.skill}</div>`).join('')}</div>`;
    const hb = has('hbHTML') ? hbHTML(c) : ''; h += hb;
    const picks = c.picks || 0, on = EDGES.filter(e => (c.edges || []).includes(e.id));
    if (picks > 0) h += `<div class="sub" style="font-size:14px"><b>Choose ${picks} Contract Edge${picks > 1 ? 's' : ''}:</b></div>`;
    else h += `<div class="sub wc-out" style="font-size:14px"><b>${on.length ? 'Won: ' + E(on.map(e => e.name).join(', ')) + '.' : 'No Contract Edge this time.'}</b>${/hbReroll\(/.test(hb) ? '' : ' The squad marches as soon as it is ready.'}</div>`;
    h += `<div class="edges">${EDGES.map(e => { const got = (c.edges || []).includes(e.id);
      return (picks > 0 || got) ? `<div class="edge ${got ? 'on' : ''}" onclick='${got ? '' : 'pickEdge("' + e.id + '")'}'><b>${e.name}</b><br><span style="font-size:14px">${e.text}</span></div>` : ''; }).join('')}</div>`;
    return h;
  };
  W.render = function(){
    const el = $('brief-wc'); if (!el || !B.up || !B.contract) return false;
    el.innerHTML = W.html(B.contract); W.gate(); W.k94(B.contract); return true;
  };
  /* K94 (UX f48): after the roll the Contract Edge cards sat below the fold at 1024 x 768 and nothing said a pick was waiting.
     Once per roll, while a pick is owed, the Edge row is scrolled to the middle of the screen (as K87 does for Talents). */
  W.k94 = function(c){
    try { if (!c || !c.council || !(c.picks > 0) || W._k94 === c.council) return null;
      const row = document.querySelector('#brief-wc .edges'); if (!row) return null;
      W._k94 = c.council; row.scrollIntoView({block: 'center'}); return row; } catch (e) { return null; }
  };
  // The CONTINUE button and the progress line wait for the picks as well as the clips.
  W.gate = function(){
    const c = B.contract, go = $('brief-go'), p = $('brief-prog'); if (!W.up) return;
    if (go) go.style.visibility = W.canGo(c, B.ready) ? 'visible' : 'hidden';
    if (p && B.ready) p.textContent = W.done(c) ? ((typeof R3DQ !== 'undefined' && R3DQ.q && R3DQ.q.length) ? 'Ready. The rest of the drill fills in behind the lines.' : 'Ready.') : c.council ? 'The squad is ready. Choose the Contract Edges.' : 'The squad is ready. The War Council is still sitting.';
  };
  // The table keeps the Chapter Master, the declarations and the decline; the roll moves to the briefing.
  W.slim = function(root){
    root = root || $('tbl-council'); if (!W.on || !root) return false;
    const b = root.querySelector('button[onclick="rollCouncil()"]'); if (!b) return false;
    const s = b.nextElementSibling, n = document.createElement('div');
    n.className = 'sub'; n.style.fontSize = '14px';
    n.innerHTML = '<b>The Council sits once the job is signed</b>, while the squad musters: the roll, any Luck and the Contract Edges come then.';
    b.replaceWith(n); if (s && s.classList && s.classList.contains('sub')) s.remove();
    return true;
  };

  /* ---------------------------------------------------------------- the Edges --- */
  // Applies the Edges of c that the field has not had yet (g.wcApplied, set when the field started). fx is for the self-test.
  W.apply = function(c, g, fx){
    g = g || gl('G'); if (!c || !g) return [];
    fx = fx || {reveal: () => revealAll(), d6: () => d6(), ward: n => addWard(n)};
    const had = g.wcApplied = g.wcApplied || [], out = [];
    if (c.edges && g.edges !== c.edges) g.edges = c.edges;   // the debrief and the minimap read G.edges
    for (const id of (c.edges || [])){
      if (had.includes(id)) continue;
      had.push(id); out.push(id);
      try {
        if (id === 'recon'){ fx.reveal(); for (const b of (g.blips || [])) b.known = fx.d6(); }
        else if (id === 'asset'){ const L = g.leader || {x: 0, y: 0}; for (let i = 0; i < 2; i++) (g.caches = g.caches || []).push({x: L.x + (i ? 50 : -50), y: L.y - 40, kind: 'poultice', opened: false}); }
        else if (id === 'approach'){ g.fogT = g.fogWard = 90 * 60; fx.ward(2); }   // fogWard: bought fog keeps the flat ward (js/combat/terrain.js)
        // terms: the debrief reads c.edges
      } catch (e) { console.warn('BR2 edge ' + id + ': ', e); }
    }
    return out;
  };

  /* ---------------------------------------------------------------- wrappers --- */
  { const f = B.show;
    B.show = function(c){
      f.apply(this, arguments);
      W.up = false;
      try {
        if (!W.applies(c)) return;
        const p = $('brief-prog'); if (!p) return;
        const el = document.createElement('div'); el.id = 'brief-wc';
        el.style.cssText = 'background:#f3ead8;color:var(--ink);border:2px solid var(--ink-soft);border-radius:6px;padding:10px 14px;width:100%;max-width:720px;box-sizing:border-box;text-align:left';
        p.parentNode.insertBefore(el, p);
        W.up = true; W.render();
      } catch (e) { console.warn('BR2: ', e); W.up = false; }
    };
  }
  /* INT-1 stage 3 group 2: the B.tick, B.go and B.hide wrappers are folded into js/ui/briefing.js (they read B.wc) */
  if (has('startDeployment')){
    const f = startDeployment;
    startDeployment = function(contract, mateIds){   // BRIEFING.wc (BR2): remembers the Edges the field had at the start; BR1's wrap (B.hide) is inside f
      const r = f.apply(this, arguments);
      try { const g = gl('G'); if (g && g.contract === contract && !g.wcApplied) g.wcApplied = (contract.edges || []).slice(); } catch (e) {}
      return r;
    };  W._sd = startDeployment;
  }
  if (has('renderTable')){
    const f = renderTable;
    renderTable = function(){
      const r = f.apply(this, arguments);
      try { W.slim(); if (W.up && B.up) W.render(); } catch (e) { console.warn('BR2 table: ', e); }
      return r;
    };  W._rt = renderTable;
  }

  /* ---------------------------------------------------------------- self-test --- */
  W.selfTest = function(){
    const fails = [], ok = (n, c) => { if (!c) fails.push(n); };
    const on0 = W.on, up0 = W.up; W.on = true; W.up = false;
    try {
      const c = {obj: 'hunt', tier: 1, host: 'bandits', place: 'Test Ford', edges: [], council: null, picks: 0, pay: 300, patron: 'a test patron', faction: Object.keys(FACTIONS)[0]};
      const mu = {contract: 0}, M = {board: [c]};
      ok('BR2: the board contract gets the council, another object does not (the harness skips the briefing)', W.boardContract(c, mu, M) && !W.boardContract({obj: 'hunt', edges: []}, mu, M) && !W.boardContract(c, null, M) && (window.SELFTEST ? !W.applies(c, mu, M) : W.applies(c, mu, M)));
      const dr = {obj: 'drill', edges: []}; ok('BR2: the drill and the brawl skip it even from the board', !W.applies(dr, mu, {board: [dr]}) && !W.applies({obj: 'brawl', edges: []}, {contract: 0}, {board: [{obj: 'brawl', edges: []}]}));
      ok('BR2: done needs a roll and no pick left', !W.done(c) && !W.done({council: [{}], picks: 1}) && W.done({council: [{}], picks: 0}));
      const h0 = W.html(c);
      ok('BR2: before the roll the block offers the roll and the Resistance', h0.indexOf('rollCouncil()') >= 0 && h0.indexOf('how hard this patron bargains') >= 0 && h0.indexOf('pickEdge') < 0);
      const c2 = Object.assign({}, c, {council: [{label: 'Leader Personality', skill: 4, face: 7, res: 'success'}, {label: 'Chapter Master', skill: 3, face: 2, res: 'miss'}], picks: 1, edges: []});
      const h1 = W.html(c2);
      ok('BR2: after the roll the dice and the pickable Edges show', h1.indexOf('class="die success"') >= 0 && h1.indexOf('pickEdge("recon")') >= 0 && h1.indexOf('Choose 1 Contract Edge') >= 0);
      const c3 = Object.assign({}, c2, {picks: 0, edges: ['recon']});
      const h2 = W.html(c3);
      ok('BR2: with the picks spent the block names the Edge won and offers none', h2.indexOf('Won: Deep Reconnaissance') >= 0 && h2.indexOf('pickEdge') < 0 && h2.indexOf('class="edge on"') >= 0);
      ok('BR2: CONTINUE waits for both the clips and the picks', !W.canGo(c3, false) && W.canGo(c3, true) && (W.up = true, !W.canGo(c2, true) && W.canGo(c3, true)));
      W.up = false;
      const root = document.createElement('div');
      root.innerHTML = '<h3>War Council</h3><div class="council"><div style="flex:1"><div class="speech">"x"</div><div class="sub"><button class="btn small" onclick="wcDeclare(\'quartered\')">Quartered</button></div><div class="sub"><button class="btn small" onclick="wcDecline()">Decline</button></div><button class="btn" onclick="rollCouncil()">ROLL</button><div class="sub">Each die…</div></div></div>';
      ok('BR2: the table loses the roll button and its line, keeps the declarations and the decline', W.slim(root) && !root.querySelector('button[onclick="rollCouncil()"]') && root.innerHTML.indexOf('Each die') < 0 && !!root.querySelector('button[onclick="wcDecline()"]') && root.innerHTML.indexOf('wcDeclare') >= 0 && root.innerHTML.indexOf('once the job is signed') >= 0);
      ok('BR2: a table already rolled is left alone', !W.slim(document.createElement('div')));
      let reveals = 0, wards = 0;
      const g = {contract: c, edges: [], blips: [{known: 0}, {known: 0}], caches: [], leader: {x: 100, y: 200}, fogT: 0, wcApplied: ['terms']};
      const fx = {reveal: () => reveals++, d6: () => 4, ward: n => wards += n};
      const c4 = Object.assign({}, c, {edges: ['terms', 'recon', 'asset', 'approach']});
      const a1 = W.apply(c4, g, fx);
      ok('BR2: closing applies recon (map and Blips), asset (two poultices), approach (90 s fog, two Wards) and not terms twice', a1.join() === 'recon,asset,approach' && reveals === 1 && g.blips.every(b => b.known === 4) && g.caches.length === 2 && g.caches.every(x => x.kind === 'poultice') && g.fogT === 90 * 60 && wards === 2 && g.edges === c4.edges);
      const a2 = W.apply(c4, g, fx);
      ok('BR2: a second close applies nothing', a2.length === 0 && reveals === 1 && g.caches.length === 2 && wards === 2);
      ok('BR2: show, tick, go, hide, startDeployment and renderTable are wrapped', /W\.applies|brief-wc/.test(B.show.toString()) && /W\.gate/.test(B.tick.toString()) && /W\.done/.test(B.go.toString()) && /W\.up|B\.wc\.up = false/.test(B.hide.toString()) && /wcApplied/.test((W._sd || startDeployment).toString()) && /W\.slim/.test((W._rt || renderTable).toString()));
      W.on = false; const root2 = document.createElement('div'); root2.innerHTML = '<button class="btn" onclick="rollCouncil()">ROLL</button>';
      ok('BR2: off, the board contract gets no council block and the table keeps its roll button', !W.applies(c, mu, M) && !W.slim(root2) && !!root2.querySelector('button[onclick="rollCouncil()"]'));
    } catch (e) { fails.push('BR2: threw ' + (e && e.message)); }
    finally { W.on = on0; W.up = up0; }
    const n = 13;
    return {ok: fails.length === 0, n, fails};
  };
})();
