/* js/camp/armoury-5.js — INDEX A34: one-click officer kitting at the Quartermaster (Fable, 2026-11-12; Patrick "Yes, one click").
   Buying a card on the six shop pages kits the squad picked on the Wagon/Armoury page (ARM.ui.sq; the Leader by
   default, so the Leader's shop is exactly as before). For an officer's squad: the click buys a copy when none is
   spare, then wears it when the slot is empty (a free card) or holds a cheaper card; a bought card that is no
   better stays spare. The card it replaces is spare again and goes to the wagon or the Armoury under A31's cap
   (a spare past the cap is sold on the spot, as any swap is). If the picked squad is away or captive the click
   buys for the Leader instead. The Quartermaster header says who: "Buying for: Mira's squad".
   No switch (ARM.on and ARM.oc.on were removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  if (!window.ARM) return;
  const A = ARM, OC = A.oc = {note: ''};
  const M0 = () => (typeof META !== 'undefined' && META) ? META : null;
  const g = id => (typeof gear === 'function' ? gear(id) : null);
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const SLOTS = ['armour', 'shield', 'melee', 'ranged', 'mount'];

  /* ---- who the click buys for ---- */
  OC.picked = M => { M = M || M0(); const s = A.squads(M); if (!s.length) return null;
    const i = A.ui ? Math.max(0, Math.min(A.ui.sq | 0, s.length - 1)) : 0; return s[i]; };
  OC.target = M => { M = M || M0(); const s = A.squads(M); if (!s.length) return null;
    const p = OC.picked(M); return (!p || p.away) ? s[0] : p; };
  OC.isLeader = (sq, M) => { M = M || M0(); return !sq || !M || sq === M.leader; };
  OC.name = (sq, M) => OC.isLeader(sq, M) ? "the Leader's squad" : `${E(sq.name || 'the officer')}'s squad`;
  OC.line = M => { M = M || M0(); if (!M) return '';
    const p = OC.picked(M), t = OC.target(M);
    if (!t) return '';
    let s = `Buying for: <b>${OC.name(t, M)}</b>`;
    if (p && t !== p) s += ` (${E(p.name || 'the officer')}'s squad is ${p.away === 'captive' ? 'captive' : 'away'})`;
    if (!OC.isLeader(t, M)) s += '. A card no better than the one worn stays spare';
    return s + '. Pick another squad on the Wagon page.'; };

  /* ---- is the bought card an improvement for this squad? ---- */
  OC.better = (id, sq, M) => { M = M || M0(); const x = g(id); if (!M || !x) return false;
    const lo = A.loadoutOf(sq, M);
    if (x.slot === 'kit') return !(lo.kits || []).includes(id) && (lo.kits || []).length < 2;
    if (lo[x.slot] === id) return false;
    const cur = g(lo[x.slot]); return !cur || A.free(cur.id) || (cur.cost | 0) < (x.cost | 0); };

  /* ---- the officer's click: buy a copy if none is spare, then wear it when better ---- */
  OC.buy = (id, sq, M) => { M = M || M0(); const x = g(id); if (!M || !x) return 'no';
    const lo = A.loadoutOf(sq, M);
    if (x.slot === 'kit' ? (lo.kits || []).includes(id) : lo[x.slot] === id) return 'worn';
    if (A.spare(id, M) <= 0){
      const price = typeof gearPrice === 'function' ? gearPrice(x) : x.cost;
      const lack = r => (M === M0() && typeof has === 'function') ? !has(r) : !(M.facilities && M.facilities[r]);
      if ((x.req || []).some(lack) || (M.treasury | 0) < price) return 'no';
      if (price === 0 && typeof edelosFreeOK === 'function' && edelosFreeOK(x)) M.edFree = M.deployments;
      M.treasury -= price; A.add(id, 1, M); if (M.halfMount === id) M.halfMount = null; }
    if (!OC.better(id, sq, M)) return 'spare';
    const old = x.slot === 'kit' ? ((lo.kits || []).length >= 2 ? lo.kits[0] : null) : lo[x.slot];
    if (!A.take(id, sq, M)) return 'no';
    if (old && !A.free(old) && A.capOn && A.capOn(M)){ const sold = A.overflow(M, [old]);
      if (sold.length) OC.note = 'The wagon is full: ' + sold.map(s => `${g(s.id).name} sold for ${s.v}gp`).join(', ') + '.'; }
    return 'worn'; };

  if (typeof gearClick === 'function'){ const f = gearClick; gearClick = function(id){
    const M = M0(); if (!M) return f.apply(this, arguments);
    const sq = OC.target(M); if (OC.isLeader(sq, M)) return f.apply(this, arguments);
    OC.note = '';
    const r = OC.buy(id, sq, M);
    if (r === 'no') { try { SFX.play('nope'); } catch (e) {} return; }
    if (r === 'spare') OC.note = `${g(id).name} is in the wagon: ${E(sq.name)} wears something as good.`;
    try { SFX.play(r === 'worn' ? 'pick' : 'coin'); } catch (e) {}
    if (A.ui && OC.note) A.ui.note = OC.note;
    try { saveMeta(); } catch (e) {} try { renderCamp(); } catch (e) {} }; }

  /* ---- the header line ---- */
  if (typeof renderCamp === 'function'){ const f = renderCamp; renderCamp = function(){ const r = f.apply(this, arguments);
    try { const M = M0(); if (!M) return r;
      const inner = document.getElementById('camp-inner'); if (!inner) return r;
      const h1 = [...inner.querySelectorAll('h1')].find(h => /Quartermaster/.test(h.textContent)); if (!h1) return r;
      const line = OC.line(M); if (!line) return r;
      const d = document.createElement('div'); d.className = 'sub aq-buying'; d.innerHTML = line;
      const money = h1.nextElementSibling && h1.nextElementSibling.classList.contains('money') ? h1.nextElementSibling : h1;
      money.after(d);
    } catch (e) { console.error('A34 header', e); }
    return r; }; }
  try { const st = document.createElement('style'); st.textContent = `.aq-buying{color:#2e4a6a;font-size:14px;margin:2px 0 6px}`; document.head.appendChild(st); } catch (e) {}

  /* ---- self-test (REG addons gate) ---- */
  A.selfTest5 = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    const sq0 = A.ui ? A.ui.sq : 0;
    try {
      const fx = () => ({treasury: 5000, leader: {name: 'Aldric', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1, injuries: [], picks: [], ticks: 0},
        gear: {armour: 'padded', shield: 'bucklers', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount', owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount']},
        officers: [{name: 'Mira', id: 7, level: 2, injuries: [], picks: []}, {name: 'Tam', id: 8, level: 2, away: 'd1', injuries: [], picks: []}, {name: 'Jo', id: 9, level: 2, away: 'captive', injuries: [], picks: []}], roster: [], facilities: {leather: true, blacksmith: true}});
      const M = migrateMeta(fx()), mira = M.officers[0], tam = M.officers[1], jo = M.officers[2];
      if (A.ui) A.ui.sq = 0;
      ok(OC.target(M) === M.leader && /Leader/.test(OC.line(M)), 'default: the Leader is the target and the header says so');
      if (A.ui) A.ui.sq = 1;
      ok(OC.target(M) === mira && /Mira/.test(OC.line(M)), 'the squad picked on the Wagon page is the target');
      if (A.ui) A.ui.sq = 2;
      ok(OC.target(M) === M.leader && /Tam.*away/.test(OC.line(M)), 'an away squad: the Leader instead, the header says why');
      if (A.ui) A.ui.sq = 3;
      ok(OC.target(M) === M.leader && /captive/.test(OC.line(M)), 'a captive squad: the Leader instead');
      ok(OC.better('leather', mira, M) && OC.better('padded', mira, M), 'an empty slot (the free card) takes anything paid');
      const t0 = M.treasury; let r = OC.buy('leather', mira, M);
      ok(r === 'worn' && A.loadoutOf(mira, M).armour === 'leather' && A.total('leather', M) === 1 && A.spare('leather', M) === 0 && M.treasury < t0, 'buy: a copy is bought and worn, the treasury pays');
      ok(!OC.better('padded', mira, M) && OC.better('brigandine', mira, M), 'a cheaper card is no better, a dearer one is');
      r = OC.buy('padded', mira, M);
      ok(r === 'spare' && A.loadoutOf(mira, M).armour === 'leather' && A.spare('padded', M) === 1, 'a card no better is bought into the wagon, the slot is kept');
      r = OC.buy('brigandine', mira, M);
      ok(r === 'worn' && A.loadoutOf(mira, M).armour === 'brigandine' && A.spare('leather', M) === 1, 'a better card is worn and the old one is spare again');
      ok(OC.buy('brigandine', mira, M) === 'worn' && A.total('brigandine', M) === 1, 'a card already worn buys nothing');
      ok(A.loadoutOf(null, M).armour === 'padded' && M.gear.armour === 'padded', "the Leader's own slots are untouched");
      M.treasury = 0; ok(OC.buy('halfplate', mira, M) === 'no' && A.total('halfplate', M) === 0, 'no money: refused, nothing bought');
      M.treasury = 5000; A.add('leather', 3, M); const sold = (OC.buy('halfplate', mira, M), OC.note);
      ok(A.loadoutOf(mira, M).armour === 'halfplate' && A.spares(M) <= A.cap(M) && /sold/.test(sold), 'the replaced card past the cap is sold and the note says so');
      ok(A.audit(M).ok !== false, 'the deck balances');
      ok(/OC\.target/.test(gearClick.toString()) && /OC\.line/.test(renderCamp.toString()), 'gearClick and renderCamp are wrapped');
    } catch (e) { fails.push('threw: ' + (e && e.message || e)); }
    if (A.ui) A.ui.sq = sq0;
    return {ok: fails.length === 0, n: 15, fails};
  };
})();
