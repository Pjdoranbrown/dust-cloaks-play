/* ===== INDEX A32: F-24.3 officers wear their own cards (audits/loadouts-f24.md, Patrick 2026-11-12) =====
   Builds on A30/A31 (js/camp/armoury-1.js, js/camp/armoury-2.js). Loads last.
   - Odds: DETACH's calcPower (js/campaign/detachments.js) adds ARM.power(officer): a gear term from the officer's own loadout,
     weighted so a kit of about 350 gp moves the band about one step and Half-Plate about two (ARM.W; Systems tunes it,
     the balance grid is packet 19).
   - The field: an officer's squad beside the Leader (js/combat/ally.js mkUnit) takes armour, melee and ranged from the officer's
     loadout (ARM.kitOf(officer): the GEAR rows in the shape of G.armour/G.melee/G.ranged), not the Leader's.
   - The send panel (js/ui/detachments-ui.js) shows the officer's six slots and the odds the kit adds; rags get a warning,
     never a block.
   - Loss: an officer who dies on a detachment, or in captivity, takes the squad's cards with them (ARM.lose per card,
     a debrief line). A captive's cards stay away (counted as worn) until the rescue brings them home. An officer who
     falls on the field beside the Leader keeps nothing, but the squad's cards come home with the company.
   - The story campaign keeps the old behaviour (officers borrow the Leader's kit, no gear term): the Wagon page is not
     shown there (A31), so nobody could dress them.
   No switch (ARM.on and ARM.oc.on were removed in INT-1, 2026-11-15). */
(function(){
  'use strict';
  if (!window.ARM) return;
  const A = ARM;
  const M0 = () => (typeof META !== 'undefined' && META) ? META : null;
  const g = id => (typeof gear === 'function' ? gear(id) : null);
  const story = M => { M = M || M0(); return !!(M && M.cp && M.cp.part !== 'done'); };
  const live = M => !story(M);
  const esc = s => (typeof window.esc === 'function') ? window.esc(s) : String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const SLOTS = ['armour', 'shield', 'melee', 'ranged', 'mount'];

  /* ---- the gear term (Systems: one band is about 6.7 power at Even; LOGISTIC_SLOPE 0.12 in detachments.js) ---- */
  A.W = {ac: 3.0,   /* Director 2026-11-14 (Patrick left it to him): OLD 2.0, NEW 3.0, odds only. Leather and Padded behave far worse than Brigandine in 42-run bot grids; every armour keeps its order, AC 4 cards +1, AC 5 +2, AC 6 +3 (Half-Plate 13 to 16). A first step: Leather is still a little overrated. ROLLBACK: set ac back to 2.0 (one number). Revisit once detachments are played. */
     shift: 2.0, graze0: 1.0, pool: 0.6, mdmg: 2.0, reach: 1.0, crush: 1.0, quick: 0.8, rdmg: 1.5, range: 0.005, kit: 1.0, towershield: 1.5, mountSpd: 8, mountPool: 0.2,
    rags: -4};   /* Patrick 2026-11-14: a first real kit is worth about 2.4x the survival of rags (24-run bot grid, archive-notes/systems.md), more than the 8 or so the term gave; rags now score -4 (OLD 0). Set A.W.rags = 0 to roll back. */
  A.kitOf = (p, M) => {                          /* the squad's cards as GEAR rows: {armour, shield, melee, ranged, mount, kits} */
    M = M || M0(); if (!live(M) || !M || !M.gear) return null;
    const lo = A.loadoutOf(p, M), r = {kits: (lo.kits || []).map(g).filter(Boolean)};
    for (const s of SLOTS) r[s] = g(lo[s]) || g(A.bare()[s]);
    return r;
  };
  A.powerOf = kit => {                           /* pure: the gear term for a kit of GEAR rows; the bare kit scores 0 */
    if (!kit) return 0; const W = A.W, a = kit.armour || {}, sh = kit.shield || {}, me = kit.melee || {}, ra = kit.ranged || {}, mo = kit.mount || {};
    let p = (a.id === 'rags' ? W.rags : 0) + Math.max(0, (a.ac || 3) - 3) * W.ac + (a.shift || 0) * W.shift + (a.graze0 ? W.graze0 : 0)
      + (sh.pool || 0) * W.pool
      + Math.max(0, (me.dmg || 3) - 3) * W.mdmg + (me.reach ? W.reach : 0) + (me.crush || 0) * W.crush + (me.cd && me.cd < 1 ? W.quick : 0)
      + Math.max(0, (ra.dmg || 2) - 2) * W.rdmg + Math.max(0, (ra.range || 280) - 280) * W.range
      + Math.max(0, (mo.spd || 1) - 1) * W.mountSpd + (mo.pool || 0) * W.mountPool;
    for (const k of (kit.kits || [])) p += k.id === 'towershield' ? W.towershield : W.kit;
    return Math.round(p * 100) / 100;
  };
  A.power = (p, M) => A.powerOf(A.kitOf(p, M));

  /* ---- the send panel block ---- */
  const slotName = {armour: 'Armour', shield: 'Shield', melee: 'Melee', ranged: 'Ranged', mount: 'Mount'};
  A.kitLine = (p, M) => { const k = A.kitOf(p, M); if (!k) return '';
    const parts = SLOTS.map(s => slotName[s] + ': ' + (k[s] ? k[s].name : '-'));
    parts.push('Kits: ' + (k.kits.length ? k.kits.map(x => x.name).join(', ') : 'none')); return parts.join(' · '); };
  A.sendPanelHTML = (p, M) => { M = M || M0(); const k = A.kitOf(p, M); if (!k) return '';
    const name = esc(p && p.name || 'The officer'), pw = A.powerOf(k), rags = k.armour && k.armour.id === 'rags';
    let h = '<div><div class="det-sec-label">Kit</div><div class="det-sub">' + esc(A.kitLine(p, M)) + '</div>';
    h += '<div class="det-sub">' + (pw > 0 ? 'The kit adds ' + pw + ' to the odds.' : pw < 0 ? 'Rags take ' + (-pw) + ' off the odds.' : 'A bare kit adds nothing to the odds.') + '</div>';
    if (rags) h += '<div class="det-gate-reason">' + name + ' would ride out in rags. Dress them on the Wagon page of the Quartermaster.</div>';
    return h + '</div>'; };

  /* ---- loss: the officers gone after a debrief take their cards with them ---- */
  A.snapshot = M => { M = M || M0(); const r = []; if (!live(M) || !M) return r;
    for (const o of (M.officers || [])) if (o) r.push({o, id: o.id, ids: A.ids(A.loadoutOf(o, M)).concat(A.loadoutOf(o, M).kits || []).filter(id => !A.free(id))});
    return r; };
  A.loseOfficer = (o, lines, M, ids) => {        /* a dead officer takes every paid card they wore; returns the ids lost */
    M = M || M0(); if (!live(M) || !M || !o) return [];
    if (!ids){ const lo = o.loadout && typeof o.loadout === 'object' ? A.fix(o.loadout) : null; ids = lo ? A.ids(lo).concat(lo.kits || []).filter(id => !A.free(id)) : []; }
    if (!ids.length) return ids;
    const names = []; for (const id of ids){ A.lose(id, o, M); const x = g(id); names.push(x ? x.name : id); }
    if (M.gear) A.sync(M);
    if (lines) lines.push('<p class="bad">' + esc(o.name) + '\'s cards are lost with them: ' + esc(names.join(', ')) + '.</p>');
    return ids; };
  A.settleLost = (before, lines, M) => {         /* officers in `before` no longer on the roll lose every paid card they wore */
    M = M || M0(); const lost = []; if (!live(M) || !M) return lost;
    const alive = new Set((M.officers || []).filter(Boolean).map(o => o.id));
    for (const b of before){ if (alive.has(b.id) || !b.ids.length) continue;
      A.loseOfficer(b.o, lines, M, b.ids); lost.push({id: b.id, name: b.o.name, ids: b.ids}); }
    return lost; };
  if (window.DETACH && typeof DETACH.resolveAll === 'function' && !DETACH.resolveAll.__a32){
    const f = DETACH.resolveAll;
    DETACH.resolveAll = function(lines){ const before = A.snapshot(); const r = f.apply(this, arguments); A.settleLost(before, lines); return r; };
    DETACH.resolveAll.__a32 = true;
  }

  /* ---- self-test ---- */
  A.selfTest3 = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      const fx = () => ({treasury: 100, cp: null, leader: {name: 'Aldric', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1, injuries: [], picks: [], ticks: 0},
        gear: {armour: 'padded', shield: 'bucklers', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount', owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount', 'leather', 'heavyshield', 'shortswords', 'crossbows', 'halfplate']},
        officers: [{name: 'Mira', id: 7, level: 2, injuries: [], picks: []}, {name: 'Tam', id: 8, level: 2, injuries: [], picks: []}], roster: [], facilities: {}});
      const M = migrateMeta(fx()), mira = M.officers[0], tam = M.officers[1];
      ok(A.power(mira, M) === A.W.rags && A.kitOf(mira, M).armour.id === 'rags', 'a bare officer: kit rags, gear term ' + A.W.rags);
      const kit = id => ({armour: g('rags'), shield: g('none'), melee: g('spears'), ranged: g('shortbows'), mount: g('nomount'), kits: [], ...id});
      const p = {};
      for (const id of ['rags', 'padded', 'leather', 'brigandine', 'scale', 'cuirass', 'halfplate']) p[id] = A.powerOf(kit({armour: g(id)}));
      ok(p.rags === A.W.rags && p.padded < p.leather && p.leather < p.brigandine && p.brigandine < p.scale && p.scale < p.cuirass && p.cuirass < p.halfplate, 'armour scores climb with the card');
      const kit350 = A.powerOf(kit({armour: g('leather'), shield: g('heavyshield'), melee: g('shortswords'), ranged: g('crossbows')}));
      ok(kit350 >= 5 && kit350 <= 10, 'a 350 gp kit is worth about one band (5 to 10): ' + kit350);
      ok(p.halfplate >= 11 && p.halfplate <= 16, 'Half-Plate is worth about two bands (11 to 16): ' + p.halfplate);
      ok(A.powerOf(kit({shield: g('heavyshield')})) > A.powerOf(kit({shield: g('bucklers')})) && A.powerOf(kit({melee: g('greatswords')})) > A.powerOf(kit({melee: g('pikes')})) && A.powerOf(kit({ranged: g('longbows')})) > A.powerOf(kit({ranged: g('crossbows')})) && A.powerOf(kit({mount: g('warhorses')})) > A.powerOf(kit({mount: g('riding')})), 'shields, melee, ranged and mounts rank');
      ok(A.take('leather', mira, M) && A.take('crossbows', mira, M) && A.kitOf(mira, M).armour.id === 'leather' && A.kitOf(mira, M).ranged.id === 'crossbows', 'an officer takes cards and the kit follows');
      ok(A.power(mira, M) === A.powerOf(kit({armour: g('leather'), ranged: g('crossbows')})), 'ARM.power reads the loadout');
      ok(/Armour: Hardened Leather/.test(A.kitLine(mira, M)) && /Ranged: Light Crossbows/.test(A.kitLine(mira, M)), 'the kit line names the cards');
      const h1 = A.sendPanelHTML(tam, M), h2 = A.sendPanelHTML(mira, M);
      ok(/ride out in rags/.test(h1) && /det-sec-label">Kit/.test(h1) && !/ride out in rags/.test(h2) && /adds [0-9.]+ to the odds/.test(h2), 'the send panel block: rags warn, a kit shows its odds');
      ok(A.kitOf(M.leader, M).armour.id === 'padded' && A.kitOf(M.leader, M).shield.id === 'bucklers', 'the Leader\'s kit is META.gear');
      if (window.DETACH && DETACH.odds){
        const c = {tier: 1, host: 'bandits', obj: 'hunt', pay: 280};
        const R = M0(); if (R){ const keep = {}; for (const k of Object.keys(R)) keep[k] = R[k]; for (const k of Object.keys(R)) delete R[k]; Object.assign(R, M);
          try {
            const r0 = DETACH.odds(tam, [], c, 'normal'), r1 = DETACH.odds(mira, [], c, 'normal');
            const s = r => r && r.p ? (r.p.win + r.p.costly) : (r && r.pct !== undefined ? r.pct / 100 : 0);
            ok(s(r1) > s(r0), 'the odds rise with the kit (hook in calcPower): ' + s(r0).toFixed(2) + ' -> ' + s(r1).toFixed(2));
          } finally { for (const k of Object.keys(R)) delete R[k]; Object.assign(R, keep); } }
      }
      const before = A.snapshot(M);
      ok(before.length === 2 && before[0].ids.length === 2 && before[1].ids.length === 0, 'the snapshot lists each officer\'s paid cards');
      const t0 = A.total('leather', M), c0 = A.total('crossbows', M), lines = [];
      ok(A.settleLost(before, lines, M).length === 0 && A.total('leather', M) === t0 && lines.length === 0, 'nobody lost: nothing changes');
      mira.away = 'captive';
      ok(A.settleLost(before, lines, M).length === 0 && A.away('leather', M) === 1 && A.spare('leather', M) === t0 - 1, 'a captive keeps the cards away, not spare');
      M.officers.splice(0, 1);
      const lost = A.settleLost(before, lines, M);
      ok(lost.length === 1 && lost[0].name === 'Mira' && A.total('leather', M) === t0 - 1 && A.total('crossbows', M) === c0 - 1 && /Mira's cards are lost with them: Hardened Leather, Light Crossbows/.test(lines[0]), 'a dead officer takes the cards: stock falls, a debrief line');
      ok(A.audit(M).ok, 'the audit balances after the loss');
      A.take('heavyshield', tam, M); M.officers.splice(0, 1); const l2 = [];
      ok(A.loseOfficer(tam, l2, M).length === 1 && A.total('heavyshield', M) === 0 && /Tam's cards are lost with them: Heavy Infantry Shields/.test(l2[0]) && A.audit(M).ok, 'an officer who falls beside the Leader loses the cards too (ally.js hook)');
      M.officers.push(tam);
      ok(!!(window.DETACH && DETACH.resolveAll && DETACH.resolveAll.__a32), 'DETACH.resolveAll is wrapped');
      M.cp = {part: 'command'};
      ok(A.kitOf(tam, M) === null && A.power(tam, M) === 0 && A.sendPanelHTML(tam, M) === '', 'the story campaign: no kit, no term, no block');
      M.cp = null;
    } catch (e) { fails.push('threw: ' + (e && e.message || e)); }
    const n = 21;
    return {ok: fails.length === 0, n, pass: n - fails.length, fails};
  };
})();
