/* ===== INDEX A30: F-24.1 the Armoury deck (audits/loadouts-f24.md, Patrick 2026-11-12) ==========================
   A counted stock of gear cards and a loadout per Squad Leader.
   - META.armoury = {stock: {id: total copies the camp owns}, v: 1}. A copy is worn by a squad, away with a
     detachment, or spare. spare(id) = total - worn (worn counts the squads away). Nothing is ever "taken out" of
     the stock: equipping only needs a spare copy, so a slot written by old code can never leak a card; ARM.audit()
     reports any id worn by more squads than the camp owns and migrate() heals it.
   - The Leader's loadout is META.gear itself (its slot fields, as every old read site expects). Each officer gets
     o.loadout = {armour, shield, melee, ranged, kits, mount}, bare (the free cards) until the camp buys for them.
     ARM.loadoutOf(person) is the one reader; gearLook(person) uses it.
   - META.gear.owned stays in the save as a mirror for the old read sites and old builds: the free cards, every id
     with a spare copy, and what the Leader wears. ARM.sync() rebuilds it after every change and before every save.
   - Old saves: each id in the old owned list becomes one copy; the Leader's slots are what they were; officers
     start bare. A save the old build touched after migration (ids pushed to owned) gets one copy of each on load.
   - Free cards (cost 0: rags, none, spears, shortbows, nomount) are never counted.
   Load last. No switch (ARM.on and ARM.oc.on were removed in INT-1, 2026-11-15).
   The edited lines in index.html and balance.js call ARM.
   F-24.2 (the Armoury tab, the wagon cap, selling) builds on ARM.take/put/count/sell. */
(function(){
  'use strict';
  const A = window.ARM = {v: 1};
  const SLOTS = ['armour', 'shield', 'melee', 'ranged', 'mount'];
  const FALLBACK = {armour: 'rags', shield: 'none', melee: 'spears', ranged: 'shortbows', mount: 'nomount'};
  const g = id => (typeof gear === 'function' ? gear(id) : null);
  A.free = id => { const x = g(id); return !x || !(x.cost > 0); };
  A.bare = () => ({armour: 'rags', shield: 'none', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount'});
  A.ids = lo => lo ? [lo.armour, lo.shield, lo.melee, lo.ranged, lo.mount].concat(lo.kits || []).filter(Boolean) : [];
  const M0 = () => (typeof META !== 'undefined' && META) ? META : null;

  /* ---- the deck ---- */
  A.deck = M => { M = M || M0(); if (!M) return {stock: {}, v: 1};
    if (!M.armoury || typeof M.armoury !== 'object') M.armoury = {stock: {}, v: 1};
    if (!M.armoury.stock || typeof M.armoury.stock !== 'object') M.armoury.stock = {};
    return M.armoury; };
  A.squads = M => { M = M || M0(); const s = []; if (!M) return s; if (M.leader) s.push(M.leader); for (const o of (M.officers || [])) if (o) s.push(o); return s; };
  A.loadoutOf = (p, M) => { M = M || M0(); if (!M) return A.bare();
    if (!p || p === M.leader) return M.gear;
    if (p.loadout && typeof p.loadout === 'object') return A.fix(p.loadout);
    const off = (M.officers || []).find(o => o === p || (o && p.id !== undefined && o.id === p.id));
    if (off){ if (!off.loadout) off.loadout = A.bare(); return A.fix(off.loadout); }
    return M.gear;   /* a Squad Mate, or anyone else: the Leader's squad */ };
  A.fix = lo => { for (const s of SLOTS) if (!lo[s] || !g(lo[s])) lo[s] = FALLBACK[s]; if (!Array.isArray(lo.kits)) lo.kits = []; return lo; };
  A.total = (id, M) => (A.deck(M).stock[id] | 0);
  A.worn = (id, M) => { let n = 0; for (const sq of A.squads(M)) for (const x of A.ids(A.loadoutOf(sq, M))) if (x === id) n++; return n; };
  A.away = (id, M) => { M = M || M0(); let n = 0; for (const o of (M && M.officers || [])) if (o && o.away) for (const x of A.ids(A.loadoutOf(o, M))) if (x === id) n++; return n; };
  A.spare = (id, M) => A.free(id) ? Infinity : A.total(id, M) - A.worn(id, M);
  A.count = (id, M) => A.free(id) ? Infinity : Math.max(0, A.spare(id, M));
  A.has = (id, M) => A.free(id) || A.total(id, M) > 0;
  A.ownedIds = M => GEAR.filter(x => A.has(x.id, M)).map(x => x.id);                       /* every card the camp holds, worn by anyone or spare */
  A.mirror = M => { M = M || M0(); const L = M && M.gear ? A.ids(M.gear) : [];
    return GEAR.filter(x => A.free(x.id) || A.spare(x.id, M) > 0 || L.includes(x.id)).map(x => x.id); };
  A.sync = M => { M = M || M0(); if (!M || !M.gear) return; M.gear.owned = A.mirror(M); return M.gear.owned; };
  A.who = (id, M) => A.squads(M).filter(sq => A.ids(A.loadoutOf(sq, M)).includes(id));

  /* ---- changes ---- */
  A.add = (id, n, M) => { M = M || M0(); n = n || 1; if (!M || !g(id)) return;
    if (A.free(id)) return; const st = A.deck(M).stock; st[id] = (st[id] | 0) + n; A.sync(M); };
  A.remove = (id, M) => { M = M || M0(); if (!M) return false;                            /* one spare copy leaves the camp (handed back, sold) */
    if (A.free(id) || A.spare(id, M) <= 0) return false;
    const st = A.deck(M).stock; st[id] = (st[id] | 0) - 1; if (st[id] <= 0) delete st[id]; A.sync(M); return true; };
  A.lose = (id, sq, M) => { M = M || M0(); if (!M) return;                                /* the squad's own copy is gone (horses bolted) */
    const lo = A.loadoutOf(sq, M), x = g(id); if (x && x.slot !== 'kit' && lo[x.slot] === id) lo[x.slot] = FALLBACK[x.slot];
    else if (x && x.slot === 'kit') lo.kits = (lo.kits || []).filter(k => k !== id);
    if (!A.free(id)){ const st = A.deck(M).stock; st[id] = (st[id] | 0) - 1; if (st[id] <= 0) delete st[id]; }
    A.sync(M); };
  A.take = (id, sq, M) => { M = M || M0(); const x = g(id); if (!M || !x) return false;    /* equip from the spares */
    const lo = A.loadoutOf(sq, M);
    if (x.slot === 'kit'){ if (lo.kits.includes(id)) return true; if (A.spare(id, M) <= 0) return false; if (lo.kits.length >= 2) lo.kits.shift(); lo.kits.push(id); A.sync(M); return true; }
    if (lo[x.slot] === id) return true;
    if (A.spare(id, M) <= 0) return false;
    lo[x.slot] = id; A.sync(M); return true; };
  A.put = (id, sq, M) => { M = M || M0(); const x = g(id); if (!M || !x) return false;    /* unequip: the copy is spare again */
    const lo = A.loadoutOf(sq, M);
    if (x.slot === 'kit'){ const n = lo.kits.length; lo.kits = lo.kits.filter(k => k !== id); A.sync(M); return lo.kits.length < n; }
    if (lo[x.slot] !== id) return false; lo[x.slot] = FALLBACK[x.slot]; A.sync(M); return true; };

  /* ---- the balance: total = spare + worn in camp + away, nothing negative ---- */
  A.audit = M => { M = M || M0(); const rows = [], neg = [], unknown = [];
    if (!M) return {ok: false, rows, neg, unknown};
    const seen = new Set(Object.keys(A.deck(M).stock));
    for (const sq of A.squads(M)) for (const id of A.ids(A.loadoutOf(sq, M))){ if (!g(id)) unknown.push(id); else if (!A.free(id)) seen.add(id); }
    for (const id of seen){ const total = A.total(id, M), worn = A.worn(id, M), away = A.away(id, M), spare = total - worn;
      rows.push({id, total, spare, worn: worn - away, away}); if (spare < 0) neg.push(id); }
    return {ok: !neg.length && !unknown.length, rows, neg, unknown}; };

  /* ---- migration: idempotent, run on every load and on a fresh company ---- */
  A.migrate = M => { if (!M || !M.gear) return M;
    const d = A.deck(M), raw = Array.isArray(M.gear.owned) ? M.gear.owned : [];
    for (const o of (M.officers || [])) if (o && !o.loadout) o.loadout = A.bare();
    A.fix(M.gear);
    for (const id of raw) if (g(id) && !A.free(id) && A.total(id, M) === 0 && A.worn(id, M) === 0) d.stock[id] = 1;   /* the old owned list, or an old build's purchases */
    const a = A.audit(M); for (const id of a.neg) d.stock[id] = (d.stock[id] | 0) + (A.worn(id, M) - A.total(id, M));   /* worn by more squads than owned: heal */
    d.v = 1; A.sync(M); return M; };
  if (typeof migrateMeta === 'function'){ const f = migrateMeta; migrateMeta = function(d){ const M = f.apply(this, arguments); if (M && !(d && d.armoury)) A.deck(M).stock = {}; return A.migrate(M); }; }   /* an unmigrated save: the deck comes from its owned list, not the fresh kit */
  if (typeof freshMeta === 'function'){ const f = freshMeta; freshMeta = function(){ return A.migrate(f.apply(this, arguments)); }; }
  if (typeof saveMeta === 'function'){ const f = saveMeta; saveMeta = function(){ try { A.sync(); } catch (e) {} return f.apply(this, arguments); }; }
  try { if (M0() && M0().gear) A.migrate(M0()); } catch (e) { console.error('A30 migrate', e); }

  /* ---- the old Quartermaster: a slot it writes must have a spare copy, or the click is refused ---- */
  const snap = lo => ({armour: lo.armour, shield: lo.shield, melee: lo.melee, ranged: lo.ranged, mount: lo.mount, kits: (lo.kits || []).slice()});
  A.settle = (before, sq, M) => { M = M || M0(); if (!M) return true; const lo = A.loadoutOf(sq, M); let ok = true;
    for (const s of SLOTS) if (lo[s] !== before[s] && !A.free(lo[s]) && A.spare(lo[s], M) < 0){ lo[s] = before[s]; ok = false; }
    for (const k of lo.kits.slice()) if (!before.kits.includes(k) && A.spare(k, M) < 0){ lo.kits = lo.kits.filter(x => x !== k); ok = false; }
    if (!ok) try { SFX.play('nope'); } catch (e) {}
    A.sync(M); return ok; };
  if (typeof gearClick === 'function'){ const f = gearClick; gearClick = function(id){ if (!M0()) return f.apply(this, arguments);
    const before = snap(META.gear), r = f.apply(this, arguments); if (!A.settle(before, null)) try { saveMeta(); renderCamp(); } catch (e) {} return r; }; }

  /* ---- self-test (REG addons gate) ---- */
  A.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      const old = {treasury: 500, leader: {name: 'Aldric', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1},
        gear: {armour: 'brigandine', shield: 'heavyshield', melee: 'spears', ranged: 'shortbows', kits: ['towershield'], mount: 'riding',
          owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount', 'brigandine', 'heavyshield', 'towershield', 'riding', 'leather']},
        officers: [{name: 'Mira', id: 7, level: 2}, {name: 'Tam', id: 8, level: 2, away: 'd1'}], roster: [], facilities: {}};
      const M = migrateMeta(JSON.parse(JSON.stringify(old)));
      ok(M.armoury && M.armoury.v === 1, 'armoury made');
      ok(A.total('brigandine', M) === 1 && A.total('leather', M) === 1 && A.total('rags', M) === 0 && A.total('spears', M) === 0, 'one copy per paid card, none for the free ones');
      ok(A.spare('brigandine', M) === 0 && A.spare('leather', M) === 1 && A.spare('padded', M) === 1, 'worn cards are not spare');
      ok(M.gear.armour === 'brigandine' && M.gear.kits[0] === 'towershield' && M.gear.mount === 'riding', 'the Leader wears what the save said');
      ok(M.officers[0].loadout && M.officers[0].loadout.armour === 'rags' && M.officers[0].loadout.melee === 'spears', 'officers start bare');
      ok(A.loadoutOf(M.leader, M) === M.gear && A.loadoutOf(M.officers[1], M) === M.officers[1].loadout && A.loadoutOf(null, M) === M.gear, 'loadoutOf');
      const mir = M.gear.owned; ok(mir.includes('leather') && mir.includes('brigandine') && mir.includes('rags') && !mir.includes('halfplate'), 'owned mirror: free, spare, worn by the Leader');
      ok(!A.take('brigandine', M.officers[0], M) && M.officers[0].loadout.armour === 'rags', 'no spare: an officer cannot wear the Leader\'s only Brigandine');
      ok(A.take('leather', M.officers[0], M) && M.officers[0].loadout.armour === 'leather' && A.spare('leather', M) === 0 && !M.gear.owned.includes('leather'), 'take the spare; the mirror drops it');
      A.add('brigandine', 1, M); ok(A.total('brigandine', M) === 2 && A.take('brigandine', M.officers[1], M) && A.spare('brigandine', M) === 0, 'buy a second copy, the away officer wears it');
      ok(A.away('brigandine', M) === 1 && A.worn('brigandine', M) === 2, 'away copies count as worn');
      const au = A.audit(M); ok(au.ok && au.rows.every(r => r.total === r.spare + r.worn + r.away), 'audit balances: total = spare + worn + away');
      ok(A.put('brigandine', M.officers[1], M) && A.spare('brigandine', M) === 1 && M.officers[1].loadout.armour === 'rags', 'put returns the copy');
      ok(A.remove('brigandine', M) && A.total('brigandine', M) === 1 && !A.remove('brigandine', M), 'remove a spare, never a worn one');
      A.lose('riding', M.leader, M); ok(M.gear.mount === 'nomount' && A.total('riding', M) === 0, 'horses lost: the squad\'s copy goes');
      M.officers[0].loadout.armour = 'halfplate'; const bad = A.audit(M); ok(!bad.ok && bad.neg.includes('halfplate'), 'audit catches a card nobody bought');
      A.migrate(M); ok(A.audit(M).ok && A.total('halfplate', M) === 1, 'migrate heals it with a copy');
      const M2 = migrateMeta(JSON.parse(JSON.stringify(M))); ok(A.audit(M2).ok && A.total('brigandine', M2) === 1 && A.total('halfplate', M2) === 1 && M2.officers[0].loadout.armour === 'halfplate', 'a migrated save reloads unchanged');
      const F = freshMeta(); ok(A.total('padded', F) === 1 && A.total('bucklers', F) === 1 && Object.keys(F.armoury.stock).length === 2 && F.gear.owned.includes('padded'), 'a fresh company: one copy of each paid starter card');
      const b = snap(M.gear); M.gear.armour = 'cuirass'; ok(!A.settle(b, null, M) && M.gear.armour === 'brigandine', 'settle refuses a slot with no copy');
    } catch (e) { fails.push('threw: ' + (e && e.message)); }
    return {ok: !fails.length, fails, n: 20};
  };
})();
