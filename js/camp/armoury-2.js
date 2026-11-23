/* ===== INDEX A31: F-24.2 and .2b the Armoury page, the wagon cap, selling (audits/loadouts-f24.md, Patrick 2026-11-12) ====
   Builds on A30 (js/camp/armoury-1.js). Loads last.
   - The Quartermaster screen's folio gets a seventh page: "Wagon" until the Armoury building stands, "Armoury" after. A row
     of Squad Leaders (the Leader, then the officers) across the top; the chosen squad's six slots below, each with its worn
     card and the spare cards of that slot as the picker (click a spare to wear it, click the worn card to put it back).
     A squad away on a detachment (or captive) is read-only.
   - The wagon: before the Armoury the camp keeps at most ARM.CAP (4) spare cards. A swap at the Quartermaster or loot past
     the cap is sold on the spot and the page says so; putting a card back when the wagon is full is refused ("sell a spare
     first"). The Armoury removes the cap. The cap is off in the story campaign (its kit day has its own economy).
   - Selling: ARM.sell(id) removes one spare copy and pays ARM.price(id) = cost x ARM.rate(): half with the Merchant Stalls,
     a quarter without. A Sell button under every spare card on every page, two clicks (the first asks "Sure?").
   - The six Quartermaster pages get a line on every card the camp holds: "2 in stock, worn by Aldric and Mira".
   No switch (ARM.on and ARM.oc.on were removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  if (!window.ARM) return;
  const A = ARM, U = A.ui = {sq: 0, confirm: null, note: ''};
  const M0 = () => (typeof META !== 'undefined' && META) ? META : null;
  const g = id => (typeof gear === 'function' ? gear(id) : null);
  const fac = (id, M) => { M = M || M0(); return !!(M && M.facilities && M.facilities[id] && !(M.damaged && M.damaged[id])); };
  const story = M => { M = M || M0(); return !!(M && M.cp && M.cp.part !== 'done'); };   /* the story campaign (inStory() on this META) */

  /* ---- the wagon cap and the sale rate ---- */
  A.CAP = 4;
  A.built = M => fac('armoury', M);
  A.capOn = M => !story(M);
  A.cap = M => A.built(M) ? Infinity : A.CAP;
  A.spareMap = M => { const r = {}; for (const id of Object.keys(A.deck(M).stock)){ const n = A.spare(id, M); if (n > 0) r[id] = n; } return r; };
  A.spares = M => { let n = 0; const m = A.spareMap(M); for (const id in m) n += m[id]; return n; };
  A.room = M => !A.capOn(M) || A.spares(M) < A.cap(M);
  A.rate = M => fac('merchant', M) ? 0.5 : 0.25;
  A.shop = (x, M) => { try { return M === META && typeof gearPrice === 'function' ? gearPrice(x) | 0 : x.cost; } catch (e) { return x.cost; } };   /* the price the shop shows now, after discounts (GD 8c926c73) */
  A.price = (id, M) => { const x = g(id); if (!x || !(x.cost > 0)) return 0; const p = A.shop(x, M); return p > 0 ? Math.max(1, Math.min(p, Math.round(p * A.rate(M)))) : 1; };   /* a free shop price still pays 1gp: a spare is always sellable (F-24, GD 417ae101) */
  A.sell = (id, M) => { M = M || M0(); if (!M) return 0; const v = A.price(id, M); if (!v || A.spare(id, M) <= 0 || !A.remove(id, M)) return 0; M.treasury = (M.treasury | 0) + v; return v; };
  A.overflow = (M, prefer) => {                                       /* sells spares past the cap: the ones just put back first, then the cheapest */
    M = M || M0(); const sold = []; prefer = prefer || []; if (!M || !A.capOn(M)) return sold;
    let guard = 60;
    while (A.spares(M) > A.cap(M) && guard--){
      const ids = Object.keys(A.spareMap(M)); if (!ids.length) break;
      ids.sort((a, b) => ((prefer.includes(b) ? 1 : 0) - (prefer.includes(a) ? 1 : 0)) || (g(a).cost - g(b).cost));
      const id = ids[0], v = A.sell(id, M); if (!v) break; sold.push({id, v});
    }
    return sold; };
  const soldLine = sold => sold.map(s => `${g(s.id).name} sold for ${s.v}gp`).join(', ');

  /* ---- the page ---- */
  const squads = M => A.squads(M);
  const cur = M => { const s = squads(M); if (!s.length) return null; U.sq = Math.max(0, Math.min(U.sq | 0, s.length - 1)); return s[U.sq]; };
  const state = sq => sq.away ? (sq.away === 'captive' ? 'captive' : 'away on a detachment') : sq.resting > 0 ? 'resting' : 'in camp';
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const whoLine = (id, M) => { const w = A.who(id, M).map(sq => E(sq.name)); return w.length ? 'worn by ' + (w.length > 2 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w.join(' and ')) : ''; };
  A.stockLine = (id, M) => { if (A.free(id)) return ''; const t = A.total(id, M); if (!t) return ''; const n = A.spare(id, M), w = whoLine(id, M);
    return `${t} in stock${n > 0 ? ', ' + n + ' spare' : ''}${w ? ', ' + w : ''}`; };
  const sellBtn = (id, M) => { const v = A.price(id, M); if (!v || A.spare(id, M) <= 0) return '';
    return `<button class="btn small aq-sell${U.confirm === id ? ' sure' : ''}" onclick="event.stopPropagation();ARM.ui.sell('${id}')">${U.confirm === id ? 'Sure? ' + v + 'gp' : 'Sell ' + v + 'gp'}</button>`; };
  const mini = (x, o) => (typeof gearCardHTML === 'function' ? gearCardHTML(x, Object.assign({mini: true}, o)) : `<div class="gcard mini" onclick="${o.click || ''}">${x.name}</div>`);
  A.rateLine = M => A.rate(M) >= 0.5 ? 'The Merchant Stalls pay half price for a spare card.' : 'The Quartermaster pays a quarter of the price for a spare card; the Merchant Stalls would pay half.';
  A.capLine = M => A.built(M) ? `The Armoury holds every spare card (${A.spares(M)} spare).`
    : `The Quartermaster's wagon carries ${A.CAP} spare cards (${A.spares(M)} aboard); past that, a card put back is sold. Build the Armoury to keep more.`;
  A.pageHTML = M => { M = M || M0(); if (!M || !M.gear) return '';
    const sqs = squads(M), sq = cur(M); if (!sq) return '<div class="sub">No Squad Leader.</div>';
    const ro = !!sq.away, lo = A.loadoutOf(sq, M);
    let h = U.note ? `<div class="aq-note">${U.note}</div>` : '';   /* the cap and the rate are in the screen's header */
    h += '<div class="aq-row">' + sqs.map((s, i) => `<div class="aq-sq${s === sq ? ' on' : ''}${s.away ? ' away' : ''}" onclick="ARM.ui.pick(${i})">${typeof portraitURL === 'function' && typeof img === 'function' ? img(portraitURL(s, true), 'ic sm') : ''}<div class="ttl">${E(s.name)}</div><div class="role">${i ? 'Officer' : 'Squad Leader'} · ${state(s)}</div></div>`).join('') + '</div>';
    if (ro) h += `<div class="aq-note">${E(sq.name)}'s squad is ${state(sq)}: their cards come back with them.</div>`;
    const slots = [['armour', 'Armour'], ['shield', 'Shield'], ['melee', 'Melee Weapon'], ['ranged', 'Ranged Weapon'], ['kit', 'Specialist Kits (up to two)'], ['mount', 'Squad Asset: Mount']];
    for (const [slot, label] of slots){
      const worn = slot === 'kit' ? (lo.kits || []).slice() : [lo[slot]].filter(Boolean);
      const spare = GEAR.filter(x => x.slot === slot && !A.free(x.id) && A.spare(x.id, M) > 0 && !worn.includes(x.id));
      h += `<div class="aq-slot"><div class="aq-label">${label}</div><div class="row gdeck aq-cards">`;
      for (const id of worn){ const x = g(id); if (!x) continue; const free = A.free(id);
        h += `<div class="aq-card">${mini(x, {eq: true, off: ro || free, click: ro || free ? '' : `ARM.ui.put('${id}')`})}<div class="aq-under">${free ? '' : A.stockLine(id, M)}${ro || free ? '' : '<span class="aq-hint">click to put back</span>'}${free ? '' : sellBtn(id, M)}</div></div>`; }
      for (const x of spare){ const n = A.spare(x.id, M);
        h += `<div class="aq-card">${mini(x, {owned: true, off: ro, click: ro ? '' : `ARM.ui.take('${x.id}')`})}<div class="aq-under">${n} spare${A.who(x.id, M).length ? ', ' + whoLine(x.id, M) : ''}${sellBtn(x.id, M)}</div></div>`; }
      if (!spare.length && worn.every(id => A.free(id))) h += `<div class="aq-empty">Nothing spare. Buy at the Quartermaster${sqs.length > 1 ? ' and put it back for ' + E(sq.name) : ''}.</div>`;
      h += '</div></div>';
    }
    return h; };

  /* ---- clicks ---- */
  const redraw = () => { try { saveMeta(); } catch (e) {} try { renderCamp(); } catch (e) {} };
  const nope = () => { try { SFX.play('nope'); } catch (e) {} };
  U.pick = i => { U.sq = i | 0; U.confirm = null; try { SFX.play('pick'); } catch (e) {} try { renderCamp(); } catch (e) {} };
  U.take = id => { const M = M0(), sq = cur(M); if (!M || !sq || sq.away) return nope();
    if (!A.take(id, sq, M)) return nope(); U.confirm = null; try { SFX.play('pick'); } catch (e) {} redraw(); };
  U.put = id => { const M = M0(), sq = cur(M); if (!M || !sq || sq.away || A.free(id)) return nope();
    if (!A.room(M)){ U.note = 'The wagon is full: sell a spare card first.'; nope(); return redraw(); }
    if (!A.put(id, sq, M)) return nope(); U.confirm = null; try { SFX.play('pick'); } catch (e) {} redraw(); };
  U.sell = id => { const M = M0(); if (!M) return;
    if (U.confirm !== id){ U.confirm = id; try { SFX.play('pick'); } catch (e) {} return redraw(); }
    const v = A.sell(id, M); U.confirm = null; if (!v) return nope();
    U.note = `${g(id).name} sold for ${v}gp.`; U.soldId = id; try { SFX.play('coin'); } catch (e) {} redraw(); };

  /* ---- the Quartermaster screen: the seventh page and the stock lines ---- */
  if (typeof folioize === 'function'){ const f = folioize; folioize = function(inner, heads, key){
    if (key !== 'camp' || !M0() || !M0().gear || story()) return f.apply(this, arguments);
    try {
      const M = M0();
      for (const c of inner.querySelectorAll('.gcard')){ const m = /gearClick\('([a-z0-9_]+)'\)/.exec(c.getAttribute('onclick') || ''); if (!m) continue;
        const line = A.stockLine(m[1], M); const foot = c.querySelector('.gc-foot'); let last = null;
        if (line){ const d = document.createElement('div'); d.className = 'aq-line'; d.innerHTML = line + sellBtn(m[1], M);
          if (foot) foot.before(d); else c.appendChild(d); last = d; }
        if (U.soldId === m[1] && U.note){ const s = document.createElement('div'); s.className = 'aq-sold'; s.textContent = U.note;
          if (last) last.after(s); else if (foot) foot.before(s); else c.appendChild(s); } }
      const sub = inner.querySelector('.sub'); if (sub) sub.insertAdjacentHTML('beforeend', ' ' + A.capLine(M) + ' ' + A.rateLine(M));
      const tail = [...inner.children].find(d => d.classList && d.classList.contains('folio-tail')) || inner.lastElementChild;
      const h = document.createElement('h2'); h.className = 'sec aq-head'; h.textContent = A.built(M) ? 'Armoury' : 'Wagon';
      const body = document.createElement('div'); body.className = 'aq-page'; body.innerHTML = A.pageHTML(M);
      if (tail){ tail.before(h); tail.before(body); } else { inner.appendChild(h); inner.appendChild(body); }
      heads = heads.concat(h);
      U.note = ''; U.soldId = null;
    } catch (e) { console.error('A31 page', e); }
    return f.call(this, inner, heads, key); }; }

  /* ---- the wagon cap at the Quartermaster: a swap past the cap is sold on the spot ---- */
  if (typeof gearClick === 'function'){ const f = gearClick; gearClick = function(id){ const M = M0(); if (!M || !A.capOn(M)) return f.apply(this, arguments);
    const before = A.spareMap(M), r = f.apply(this, arguments);
    try { const after = A.spareMap(M), grew = Object.keys(after).filter(k => (after[k] | 0) > (before[k] | 0));
      const sold = A.overflow(M, grew); if (sold.length){ U.note = 'The wagon is full: ' + soldLine(sold) + '.'; try { SFX.play('coin'); } catch (e) {} redraw(); } } catch (e) { console.error('A31 cap', e); }
    return r; }; }

  /* ---- look ---- */
  try { const st = document.createElement('style'); st.textContent = `
  .aq-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:8px 0 12px}
  .aq-sq{width:150px;padding:8px;background:rgba(245,235,215,.94);border:2px solid var(--ink-soft);border-radius:6px;text-align:center;cursor:pointer}
  .aq-sq.on{box-shadow:0 0 0 3px var(--gold)} .aq-sq.away{opacity:.6} .aq-sq .ttl{font:bold 14px Georgia} .aq-sq .role{font-size:14px;color:#5a4a2a}
  .aq-slot{width:100%} .aq-label{text-align:center;font-weight:bold;color:var(--ink-soft);margin:10px 0 4px} .aq-cards{justify-content:center}
  .aq-card{display:flex;flex-direction:column;align-items:center;gap:4px} .aq-under{font-size:14px;color:#3a2a1a;text-align:center;max-width:158px;line-height:1.3}
  .aq-hint{display:block;font-style:italic;color:#7a6a54} .aq-empty{font-size:14px;color:#7a6a54;font-style:italic;padding:8px}
  .aq-line{font-size:14px;color:#2e4a6a;padding:3px 8px;border-top:1px solid #e0d2b4;line-height:1.3}
  .aq-sell{font-size:14px;padding:2px 8px;margin:2px 0 0;display:inline-block} .aq-sell.sure{background:#8b2a14}
  .aq-note{width:100%;text-align:center;font-size:14px;color:var(--blood);margin:4px 0}`; document.head.appendChild(st); } catch (e) {}

  /* ---- self-test (REG addons gate) ---- */
  A.selfTest2 = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      const fx = () => ({treasury: 100, leader: {name: 'Aldric', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1, injuries: [], picks: [], ticks: 0},
        gear: {armour: 'padded', shield: 'bucklers', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount', owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount', 'leather', 'brigandine']},
        officers: [{name: 'Mira', id: 7, level: 2, injuries: [], picks: []}, {name: 'Tam', id: 8, level: 2, away: 'd1', injuries: [], picks: []}], roster: [], facilities: {}});
      const M = migrateMeta(fx()), lth = g('leather').cost, brg = g('brigandine').cost;
      ok(A.cap(M) === 4 && A.rate(M) === 0.25 && A.spares(M) === 2 && A.room(M), 'no Armoury: cap 4, a quarter, two spares');
      ok(A.price('leather', M) === Math.max(1, Math.round(lth * 0.25)) && A.price('rags', M) === 0, 'price: a quarter of the cost; free cards never sell');
      ok(A.sell('padded', M) === 0 && A.total('padded', M) === 1, 'a worn card does not sell');
      const t0 = M.treasury, v = A.sell('leather', M); ok(v > 0 && M.treasury === t0 + v && A.total('leather', M) === 0 && A.spares(M) === 1, 'a spare sells for its price into the treasury');
      M.facilities.merchant = true; ok(A.rate(M) === 0.5 && A.price('brigandine', M) === Math.round(brg * 0.5), 'the Merchant Stalls pay half');
      A.add('leather', 5, M); ok(A.spares(M) === 6, 'six spares over the cap');
      const sold = A.overflow(M, ['brigandine']); ok(sold.length === 2 && sold[0].id === 'brigandine' && A.spares(M) === 4, 'overflow sells the preferred card first, then the cheapest, down to the cap');
      M.facilities.armoury = true; ok(A.cap(M) === Infinity && A.room(M) && A.overflow(M).length === 0 && A.capLine(M).includes('Armoury'), 'the Armoury removes the cap');
      M.damaged = {armoury: true}; ok(A.cap(M) === 4, 'a damaged Armoury does not hold the deck'); delete M.damaged;
      ok(A.take('leather', M.officers[0], M) && A.stockLine('leather', M).includes('worn by Mira') && A.stockLine('leather', M).includes('in stock'), 'the stock line names who wears it');
      U.sq = 0; const h = A.pageHTML(M);
      ok(h.includes('Mira') && h.includes('Tam') && h.includes("ARM.ui.take('leather')") && h.includes('Sell ') && h.includes("ARM.ui.put('padded')"), 'the page: the squads, a spare to take, a Sell button, the worn card to put back');
      U.sq = 1; const h1 = A.pageHTML(M); ok(h1.includes("ARM.ui.put('leather')") && !h1.includes("ARM.ui.take('leather')") && h1.includes('Sell '), 'an officer wearing a card can put it back or sell a spare copy, not take another');
      U.sq = 2; const h2 = A.pageHTML(M); ok(h2.includes('away on a detachment') && !h2.includes('ARM.ui.take('), 'an away squad is read-only');
      U.sq = 0;
      ok(A.audit(M).ok, 'the audit still balances');
    } catch (e) { fails.push('threw: ' + (e && e.message)); }
    return {ok: !fails.length, fails, n: 14};
  };
})();
