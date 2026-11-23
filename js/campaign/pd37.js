/* ============================================================================
   INDEX PD37 - Cayde after Kalloon (Patrick Q37 / PD-37, 16 Nov 2026; spec audits/f45-pd-specs.md section 5).
   Backlog Worker, 2026-11-16. The camp purse stays 200 gp; Cayde teaches three things instead:
     1 Roster: while fewer than K.mates living Squad Mates stand in the roster (the Leader makes six).
     2 The free item (new): each season the Quartermaster gives the first item priced at or under
       K.cap gp free, "Supplies from Lord Artemis". The card shows FREE; it resets on the season turn
       (F03.seasonKey, else seasonName). Ignored while the Chapter Master's own free item (EDELOS) applies.
     3 Cheaper first build: names the cheapest Specialty building not yet built (BOOK33.LIB, L1).
   When: the main game after Kalloon (META.d45k or META.f45end), never in the story. The lines show in one
   box in the walk camp (after ENTER THE CAMP; K83: not the splash), after the K45 carried card is closed:
   roster and crate once a season while they apply, the build line once.
   K84: the stamp on a free card reads "FREE: one this season"; once taken, that card keeps FREE and a
   "Supplies from Lord Artemis" stamp for the rest of the season (META.pd37.item). Lessons off (Settings): no box; the free item still works.
   Save: META.pd37 = {free: seasonKey used, item: gear id taken, seen: {roster: key, crate: key, build: true}}.
   Words: CAMPAIGN_LINES.pd37 overrides DEF (the Planner's [T] words from the spec).
   Numbers [S]: PD37.K.cap (50), K.mates (5). Self-test: PD37.selfTest() (META and saveMeta put back).
   ============================================================================ */
(function(){
  'use strict';
  const P = window.PD37 = {};
  P.K = {cap: 50, mates: 5};   // [S]
  const DEF = {
    roster: 'Six in the squad is what a Chapter needs. Fill the Hiring Line before the first job.',
    crate: 'Artemis sends a crate each season. Take one thing from it, up to {cap} gp, and it costs us nothing. Do not leave it in the crate.',
    build: 'Build small first. A {cheapest} costs {n} gp and opens a Specialty; the big halls can wait.',
    free: 'FREE', tag: 'FREE: one this season', taken: 'Supplies from Lord Artemis', who: 'Cayde',   // K84 [S] tag
    ownTag: "FREE: {name}'s pick, one each downtime", ownTaken: "{name}'s pick", crateUsed: "Lord Artemis's crate: taken. The next crate comes with the new season.",
    ownUsed: "{name}'s pick: taken. Another at the next downtime.", both: "Two free items are yours: {name}'s pick and Lord Artemis's crate. They are separate: you can take both."
  };
  const W = () => Object.assign({}, DEF, (window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd37) || {});
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fillW = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => o[k] != null ? o[k] : m);
  const M = () => (typeof META !== 'undefined' && META) || null;
  const story = () => { try { return P.story(); } catch (e) { return false; } };
  P.story = () => typeof inStoryNow === 'function' && inStoryNow();
  const save = () => { try { saveMeta(); } catch (e) {} };
  /* self-tests elsewhere read a wrapper's source (ARM.selfTest5 looks for OC.target in gearClick): each wrapper here shows the one it wraps */
  const thru = (w, f) => { try { w.toString = () => Function.prototype.toString.call(f); } catch (e) {} return w; };

  P.on = () => { const m = M(); return !!(m && (m.d45k || m.f45end) && !story()); };
  P.key = () => { try { if (window.F03 && typeof F03.seasonKey === 'function') return F03.seasonKey(); return String(seasonName()); } catch (e) { return ''; } };
  P.st = () => { const m = M(); if (!m) return null; m.pd37 = m.pd37 || {free: null, seen: {}}; m.pd37.seen = m.pd37.seen || {}; return m.pd37; };
  P.unused = () => P.on() && (P.st() || {}).free !== P.key();
  const edelos = g => { try { return typeof edelosFreeOK === 'function' && edelosFreeOK(g); } catch (e) { return false; } };

  /* ---- 2: the free item ---- */
  if (typeof gearPrice === 'function'){ const f = gearPrice; P._price0 = f; gearPrice = function(g){
      const p = f.apply(this, arguments);
      try { if (g && p > 0 && p <= P.K.cap && P.unused() && !(M().gear && M().gear.owned || []).includes(g.id)) return 0; } catch (e) {}
      return p; }; thru(gearPrice, f); }
  /* Q50: the crate and the Chapter Master's own free purchase (a player-named Edelos Master or co-Master; never Cayde) are separate. Both are SHOWN at once; spending takes the Master's own first, then the crate. */
  P.freeFor = g => { let ef; try { const m = M(); ef = m.edFree; m.edFree = m.deployments;   /* the price without the Master's own free purchase */
      const p = P._price0 ? P._price0(g) : g.cost; return !!(g && p > 0 && p <= P.K.cap && P.unused()); } catch (e) { return false; } finally { try { M().edFree = ef; } catch (e) {} } };
  P.useCrate = g => P.freeFor(g) && !edelos(g);
  P.ownName = () => { const m = M(); if (!m) return ''; const c = m.master && m.master.cls === 'EDELOS' && !(m.master.hero === 'cayde') ? m.master : (m.coMaster && m.coMaster.cls === 'EDELOS' ? m.coMaster : null); return (c && c.name) || ''; };
  P.ownUsed = () => { const m = M(), S = P.st(); return !!(m && S && S.own && S.own.key === m.deployments && P.ownName()); };
  P.take = id => { const S = P.st(); if (S){ S.free = P.key(); S.item = id || null; delete S.seen.crate; } };
  P.takeOwn = id => { const S = P.st(), m = M(); if (S && m) S.own = {key: m.deployments, item: id}; };
  if (typeof gearClick === 'function'){ const f = gearClick; gearClick = function(id){
      let fr = false, own = false, had = true;
      try { const g = gear(id); had = M().gear.owned.includes(id); fr = !had && P.useCrate(g); own = !had && P.on() && edelos(g); } catch (e) {}
      const r = f.apply(this, arguments);
      try { let took = false;
        if (own && M().gear.owned.includes(id)){ P.takeOwn(id); save(); took = true; }
        if (fr && M().gear.owned.includes(id)){ P.take(id); save(); took = true; }
        if (took && document.getElementById('camp-inner')) renderCamp(); } catch (e) { console.warn('PD37 gearClick', e); }   // the original re-drew before the crate was used
      return r; }; thru(gearClick, f); }
  try {
    const OC = window.ARM && ARM.oc;
    if (OC && typeof OC.buy === 'function'){ const f = OC.buy; OC.buy = function(id, sq, Mx){
        const mine = !Mx || Mx === M(); let fr = false, own = false;
        try { fr = mine && ARM.spare(id, M()) <= 0 && P.useCrate(gear(id)); own = mine && P.on() && ARM.spare(id, M()) <= 0 && edelos(gear(id)); } catch (e) {}
        const t0 = mine ? (M().treasury | 0) : 0, r = f.apply(this, arguments);
        try { if (own && r !== 'no' && r !== 'worn' && (M().treasury | 0) === t0){ P.takeOwn(id); save(); }
          if (fr && r !== 'no' && r !== 'worn' && (M().treasury | 0) === t0){ P.take(id); save(); } } catch (e) { console.warn('PD37 oc.buy', e); }
        return r; }; thru(OC.buy, f); }
  } catch (e) { console.warn('PD37 oc', e); }
  /* the FREE tag on the Quartermaster card (renderCamp and its re-draws write "0gp") */
  P.tagCamp = function(){
    const inner = document.getElementById('camp-inner'); if (!inner || !P.on() || typeof GEAR === 'undefined') return 0;
    const S = P.st() || {}, took = S.free === P.key() && S.item, owned = (M().gear && M().gear.owned) || [], w = W(), nm = P.ownName(), fw = s => fillW(s, {name: nm});
    const ownTook = P.ownUsed() && S.own.item;
    let n = 0, first = null;
    for (const g of GEAR){
      const has = owned.includes(g.id), cr = !has && P.freeFor(g), ow = !has && edelos(g), isFree = cr || ow;
      const isTaken = has && (took === g.id || ownTook === g.id);
      if (!isFree && !isTaken) continue;
      const card = inner.querySelector(`[onclick="gearClick('${g.id}')"]`); if (!card) continue;
      const stamps = isFree ? [ow ? fw(w.ownTag) : null, cr ? w.tag : null].filter(Boolean) : [ownTook === g.id ? fw(w.ownTaken) : null, took === g.id ? w.taken : null].filter(Boolean);
      const c = card.querySelector('.cost'), ft = card.querySelector('.gc-foot span');   // the plain card, or the gear card (cards-portraits.js gearCardHTML: COST 0gp <s>cost</s>)
      if (c && (isTaken || /^0\s*gp$/.test(c.textContent.trim()))){ c.textContent = isFree ? stamps[0] : w.free + ': ' + stamps[0]; c.setAttribute('data-pd37', isFree ? 'free' : 'taken');
        for (const t of stamps.slice(1)) c.insertAdjacentHTML('afterend', `<div class="cost" data-pd37="tag2">${E(t)}</div>`); n++; first = first || card; }
      else if (ft && (isTaken || /^COST\s*0\s*gp/.test(ft.textContent.trim()))){ ft.innerHTML = `<b>COST</b>${E(w.free)} <s>${E(g.cost)}gp</s>`; ft.setAttribute('data-pd37', isFree ? 'free' : 'taken');
        ft.parentNode.insertAdjacentHTML('afterend', stamps.map(t => `<div class="gc-st own" data-pd37="tag">${E(t)}</div>`).join('')); n++; first = first || card; } }   // late-fixes.js flows every .gc-st in the card, so it sits above EQUIPPED/OWNED; ux.js sizes it (11 px)
    // Q50: one plain note above the cards: what is free, from where, and what has been used
    inner.querySelectorAll('[data-pd37="note"]').forEach(x => x.remove());
    const crateLeft = P.unused(), notes = [];
    if (nm && crateLeft && !P.ownUsed()) notes.push(fw(w.both));
    else { if (nm && P.ownUsed()) notes.push(fw(w.ownUsed)); if (!crateLeft && S.free === P.key()) notes.push(w.crateUsed); }
    // UX: under the "Buying for" line (the ledger position), so it shows on every tab
    const h1 = [...inner.querySelectorAll('h1')].find(h => /Quartermaster/.test(h.textContent)), bl = inner.querySelector('.aq-buying');
    const anchor = bl || (h1 && (h1.nextElementSibling && h1.nextElementSibling.classList.contains('money') ? h1.nextElementSibling : h1));
    if (anchor && notes.length) anchor.insertAdjacentHTML('afterend', `<p data-pd37="note" style="margin:2px 0 6px;font-size:14px;text-align:left;align-self:flex-start">${notes.map(E).join(' ')}</p>`);
    return n;
  };
  if (typeof renderCamp === 'function'){ const f = renderCamp; renderCamp = function(){
      const r = f.apply(this, arguments); try { P.tagCamp(); } catch (e) { console.warn('PD37 tag', e); } return r; }; thru(renderCamp, f); }

  /* ---- 1 and 3: Cayde's lines on the camp board ---- */
  P.mates = () => { try { return (M().roster || []).filter(p => p && !p.dead).length; } catch (e) { return 0; } };
  P.cheapest = function(){
    try { const L = (window.BOOK33 && BOOK33.LIB) || {}, out = [];
      for (const k in L){ const id = String(L[k][0] || '').replace(/^#/, ''), f = typeof facility === 'function' && facility(id);
        if (f && !(M().facilities || {})[id] && !(M().build || {})[id]) out.push({f, n: typeof facCost === 'function' ? facCost(f) : f.cost}); }
      out.sort((a, b) => a.n - b.n); return out[0] || null; } catch (e) { return null; }
  };
  P.lines = function(){
    const S = P.st(), w = W(), k = P.key(), out = []; if (!S || !P.on()) return out;
    if (P.mates() < P.K.mates && S.seen.roster !== k) out.push(['roster', w.roster]);
    if (P.unused() && S.seen.crate !== k) out.push(['crate', fillW(w.crate, {cap: P.K.cap})]);
    const c = !S.seen.build && P.cheapest(); if (c) out.push(['build', fillW(w.build, {cheapest: c.f.name, n: c.n})]);
    return out;
  };
  const lessonsOn = () => { try { return !window.T45 || typeof T45.lessonsOn !== 'function' || T45.lessonsOn(); } catch (e) { return true; } };
  /* K83: the walk camp (renderTitle: topbar shown, every screen hidden); the splash (screen-title) is not it */
  P.inCamp = () => { try { const tb = document.getElementById('topbar'); if (!tb || tb.classList.contains('hidden')) return false;
      return !(window.SCREENS || (typeof SCREENS !== 'undefined' ? SCREENS : [])).some(id => document.getElementById(id) && !document.getElementById(id).classList.contains('hidden')); } catch (e) { return false; } };
  P.show = function(){
    if (document.getElementById('pd37-cayde') || document.getElementById('k45-carried') || document.getElementById('cg-box')) return false;
    if (!P.on() || !lessonsOn() || !P.inCamp()) return false;
    const L = P.lines(); if (!L.length) return false;
    const S = P.st(), k = P.key(), d = document.createElement('div'); d.id = 'pd37-cayde';
    d.style.cssText = 'position:fixed;right:14px;top:64px;z-index:14;max-width:320px;background:#f3ead8;border:2px solid var(--ink-soft);border-radius:6px;padding:8px 12px 8px;box-shadow:0 4px 14px rgba(0,0,0,.4);color:var(--ink);font:14px Georgia;text-align:left';
    d.innerHTML = `<b>${E(W().who)}:</b>` + L.map(([id, t]) => `<p data-pd37="${id}" style="margin:6px 0 0"><i>"${E(t)}"</i></p>`).join('')
      + `<div style="text-align:right;margin-top:6px"><button class="btn small">OK</button></div>`;
    d.querySelector('button').onclick = () => { for (const [id] of L) S.seen[id] = id === 'build' ? true : k; save(); d.remove(); };
    document.body.appendChild(d); return true;
  };
  if (typeof renderTitle === 'function'){ const f = renderTitle; renderTitle = function(){
      const r = f.apply(this, arguments); setTimeout(() => { try { P.show(); } catch (e) { console.warn('PD37 show', e); } }, 0); return r; }; thru(renderTitle, f); }
  /* the K45 carried card's OK leaves the board bare: offer the lines then */
  document.addEventListener('click', e => { try { if (e.target && e.target.closest && e.target.closest('#k45-carried button')) setTimeout(() => { try { P.show(); } catch (x) {} }, 0); } catch (x) {} });

  /* ---- self-test ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const M0 = M(), sv = {save: window.saveMeta, key: P.key, story: P.story};
    const g = (typeof GEAR !== 'undefined' ? GEAR : []).find(x => x.cost > 0 && x.cost <= P.K.cap && !(x.req || []).length);
    const big = (typeof GEAR !== 'undefined' ? GEAR : []).find(x => x.cost > P.K.cap && !(x.req || []).length);
    if (!g || !big){ ok('a gear card at or under the cap and one over it', false); return {pass: 0, fail: 1, rows}; }
    try {
      const T = JSON.parse(JSON.stringify(M0 || {})); T.gear = {owned: [], kits: []}; T.treasury = 500; T.roster = [{name: 'A'}, {name: 'B'}]; T.facilities = {}; T.build = {};
      T.d45k = {stage: 's57'}; delete T.pd37; T.deployments = 3;
      window.__pd37m = T; (0, eval)('META = window.__pd37m'); (0, eval)('saveMeta = function(){}');
      let season = 'Spring1'; P.key = () => season;
      T.master = {id: 'CM', name: 'Cayde', cls: 'EDELOS', hero: 'cayde'}; delete T.coMaster;   // Q50: Cayde's chair gives no free purchase of its own
      ok('Q50: Cayde in the chair: no own free purchase', !edelosFreeOK(g));
      ok('before Kalloon (no d45k or f45end): full price', (delete T.d45k, gearPrice(g) === Math.round(P._price0(g)) && gearPrice(g) > 0)); T.d45k = {stage: 's57'};
      ok('after Kalloon: an item at or under 50 gp is free', gearPrice(g) === 0, gearPrice(g));
      ok('an item over 50 gp is full price', gearPrice(big) === P._price0(big) && gearPrice(big) > 0);
      const t0 = T.treasury; gearClick(g.id);
      ok('buying it costs nothing and uses the season\'s crate', T.treasury === t0 && T.gear.owned.includes(g.id) && T.pd37.free === 'Spring1', T.treasury);
      ok('K84: the item taken is kept for its stamp', T.pd37.item === g.id, T.pd37.item);
      const g2 = GEAR.find(x => x !== g && x.cost > 0 && x.cost <= P.K.cap && !(x.req || []).length && !(T.gear.owned || []).includes(x.id));
      ok('a second cheap item the same season: full price', !g2 || gearPrice(g2) === P._price0(g2));
      season = 'Summer1'; ok('the season turns: the crate is back', !g2 || gearPrice(g2) === 0, g2 && [g2.id, gearPrice(g2), P.unused(), JSON.stringify(T.pd37), (T.gear.owned || []).join()].join(' '));
      ok('lines: roster (2 of 5 mates), crate, build, in that order', P.lines().map(l => l[0]).join() === 'roster,crate,build', P.lines().map(l => l[0]).join());
      const c = P.cheapest(); ok('the build line names the cheapest Specialty building', c && P.lines()[2][1].includes(c.f.name) && P.lines()[2][1].includes(c.n + ' gp'), c && c.f.name + ' ' + c.n);
      T.roster = [1, 2, 3, 4, 5].map(i => ({name: 'm' + i})); ok('a full roster: no roster line', !P.lines().some(l => l[0] === 'roster'));
      T.pd37.seen = {crate: 'Summer1', build: true}; ok('seen this season: no lines', P.lines().length === 0);
      season = 'Autumn1'; ok('next season: the crate line again, not the build line', P.lines().map(l => l[0]).join() === 'crate');
      // Q50: a player-named Edelos Master: the own purchase and the crate are separate, own first, then the crate
      T.pd37 = {free: null, seen: {}}; T.edFree = null; T.master = {id: 'CM', name: 'Mira', cls: 'EDELOS', chosen: true}; season = 'Spring2'; T.deployments = 5; T.d45k = {stage: 's57'};
      T.gear = {owned: [], kits: []}; T.facilities = Object.fromEntries(FACILITIES.map(f => [f.id, true])); const cheap = GEAR.filter(x => x.cost > 0 && x.cost <= P.K.cap && !(T.gear.owned || []).includes(x.id)).slice(0, 12);
      if (cheap.length >= 4){
        ok('Q50: Edelos Master (not Cayde): both free items show at once', edelosFreeOK(cheap[0]) && P.freeFor(cheap[0]) && P.ownName() === 'Mira');
        const t1 = T.treasury; gearClick(cheap[0].id); ok('Q50: first free item is the Master own; the crate is not used', T.treasury === t1 && T.edFree === 5 && T.pd37.free === null && T.pd37.own && T.pd37.own.item === cheap[0].id, JSON.stringify(T.pd37));
        const rest = cheap.filter(x => !(T.gear.owned || []).includes(x.id)); cheap[1] = rest[0]; cheap[2] = rest[1]; gearClick(cheap[1].id); ok('Q50: second free item is the crate', T.treasury === t1 && T.pd37.free === 'Spring2' && T.pd37.item === cheap[1].id, [T.treasury, t1, JSON.stringify(T.pd37), cheap.map(x => x.id + ':' + x.cost + ':' + (x.req || []).join('+')).join(' '), T.gear.owned.join()].join(' | '));
        ok('Q50: a third item the same downtime is full price', gearPrice(cheap[2]) === P._price0(cheap[2]) && gearPrice(cheap[2]) > 0);
        ok('Q50 G1: two free items a season, one from each source: the Master own is used up too', !edelosFreeOK(cheap[2]) && !P.freeFor(cheap[2]));
        T.deployments = 6; season = 'Summer2'; ok('Q50 G1: the next season: both free items are back', edelosFreeOK(cheap[2]) && P.freeFor(cheap[2]));
      }
      T.master = {id: 'CM', name: 'Cayde', cls: 'EDELOS', hero: 'cayde'}; T.coMaster = {name: 'Ro', cls: 'EDELOS'}; T.edFree = null;
      ok('Q50: Edelos co-Master beside Cayde: the co-Master own purchase works', cheap.length >= 4 && edelosFreeOK(cheap[2]) && P.ownName() === 'Ro', [cheap.length, cheap[2] && edelosFreeOK(cheap[2]), P.ownName(), T.edFree, T.deployments].join()); delete T.coMaster;
      P.story = () => true; ok('in the story: nothing is free', gearPrice(g2 || big) === P._price0(g2 || big) && !P.on());
    } catch (e) { ok('no throw', false, e.message); }
    finally { window.__pd37m = M0; (0, eval)('META = window.__pd37m'); delete window.__pd37m;
      window.__pd37s = sv.save; (0, eval)('saveMeta = window.__pd37s'); delete window.__pd37s;
      P.story = sv.story; P.key = sv.key; }
    const pass = rows.filter(r => r.pass).length; return {pass, fail: rows.length - pass, rows};
  };
})();
