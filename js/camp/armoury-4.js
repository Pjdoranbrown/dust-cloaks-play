/* js/camp/armoury-4.js — INDEX A33: F-24.4 co-op guests wear their own cards (Fable, 2026-11-12).
   A guest Leader's loadout lives in the guest's own save (META.gear, their deck in META.armoury). It rides to
   the host inside `hello` (MPCOOP.snapshotPerson adds `loadout` for the guest's own Leader), the host checks it
   (MPCOOP.sanitizePerson: known cards of the right slot, at most two kits, anything else the bare card) and keeps
   the copy in the seat record (MPCOOP.seats[n].captain.loadout). From there A32 does the rest: COOP.odds ->
   DETACH.odds -> calcPower reads ARM.power(captain); ALLY.spawn -> mkUnit reads ARM.kitOf(captain), so the guest
   squad fights in the guest's cards. The host's deck is never touched: the captain is not in META.officers, so
   ARM.worn/away/audit ignore them, nothing is lent, and ARM.loseOfficer returns [] for a guest (a Leader "falls"
   in co-op, never dies; the cards go home with them). A guest whose game sends no loadout rides in the host's
   kit as before F-24 (an older client, or ARM off on their side).
   Hooks (one line each, marked INDEX A33) in js/mp/coop.js: lobbyPayload seats carry `kit`; the host's seat
   panel and the guest's lobby view print the kit lines. Purchases in the host's camp wait for F-23.3.
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
  const KITS_MAX = 2;

  /* ---- the wire ---- */
  A.packLoadout = lo => {                        /* the guest's own loadout as plain ids: what rides in `hello` */
    const b = A.bare(), o = {}; lo = lo && typeof lo === 'object' ? lo : b;
    for (const s of SLOTS) o[s] = String(lo[s] || b[s]);
    o.kits = (Array.isArray(lo.kits) ? lo.kits : []).slice(0, KITS_MAX).map(String);
    return o; };
  A.sanitizeLoadout = lo => {                    /* the host's check: known cards of the right slot, else the bare card; never a copy from the host's deck */
    const out = A.bare(); if (!lo || typeof lo !== 'object') return out;
    for (const s of SLOTS){ const id = lo[s], x = typeof id === 'string' ? g(id) : null; if (x && x.slot === s) out[s] = id; }
    for (const id of (Array.isArray(lo.kits) ? lo.kits : [])){ const x = typeof id === 'string' ? g(id) : null;
      if (x && x.slot === 'kit' && !out.kits.includes(id) && out.kits.length < KITS_MAX) out.kits.push(id); }
    return out; };
  A.isGuest = p => !!(p && (p.guestCaptain || p.guestMate));

  /* ---- the lines ---- */
  A.guestKitLine = (p, M) => {                   /* "Armour: Half-Plate · ... (adds 13 to the odds)", '' when the guest sent no loadout */
    if (!live(M) || !p || !p.loadout) return ''; const k = A.kitOf(p, M); if (!k) return '';
    return A.kitLine(p, M) + ' (adds ' + A.powerOf(k) + ' to the odds)'; };
  A.seatKit = info => (info && info.captain) ? (A.guestKitLine(info.captain) || null) : null;
  A.hostSeatHTML = captain => {                  /* the host's seat panel, under the captain line */
    if (!live() || !captain) return '';
    const s = A.guestKitLine(captain);
    return '<div class="sub" style="font-size:14px">Kit: ' + (s ? esc(s) : 'the Leader\'s (their game sent no loadout)') + '.</div>'; };
  A.guestLobbyHTML = (lb, seat) => {             /* the guest's lobby view, after the seats */
    if (!lb || !Array.isArray(lb.seats)) return ''; let h = '';
    for (const s of lb.seats){ if (s.status !== 'connected' || !s.kit) continue;
      h += '<div class="mpco-sub">' + (s.seat === seat ? 'Your kit' : esc(s.captain || s.name) + '\'s kit') + ': ' + esc(s.kit) + '.</div>'; }
    return h; };

  /* ---- the wraps ---- */
  if (window.MPCOOP){
    if (typeof MPCOOP.snapshotPerson === 'function' && !MPCOOP.snapshotPerson.__a33){
      const f = MPCOOP.snapshotPerson;
      MPCOOP.snapshotPerson = function(p){ const o = f.apply(this, arguments); const M = M0();
        if (M && live(M) && p && p === M.leader && M.gear) o.loadout = A.packLoadout(M.gear); return o; };
      MPCOOP.snapshotPerson.__a33 = true; }
    if (typeof MPCOOP.sanitizePerson === 'function' && !MPCOOP.sanitizePerson.__a33){
      const f = MPCOOP.sanitizePerson;
      MPCOOP.sanitizePerson = function(p, isLeader){ const o = f.apply(this, arguments);
        if (isLeader && live() && p && typeof p === 'object' && p.loadout && typeof p.loadout === 'object') o.loadout = A.sanitizeLoadout(p.loadout); return o; };
      MPCOOP.sanitizePerson.__a33 = true; }
  }
  /* a guest never takes from or puts into the host's deck (QA .5: no UI path leads here, the functions refuse too) */
  for (const fn of ['take', 'put']) if (typeof A[fn] === 'function' && !A[fn].__a33){ const f = A[fn]; A[fn] = function(id, p){ return A.isGuest(p) ? false : f.apply(this, arguments); }; A[fn].__a33 = true; }
  if (typeof A.loseOfficer === 'function' && !A.loseOfficer.__a33){
    const f = A.loseOfficer;
    A.loseOfficer = function(o){ return A.isGuest(o) ? [] : f.apply(this, arguments); };
    A.loseOfficer.__a33 = true; }

  /* ---- self-test ---- */
  A.selfTest4 = function(){
    const fails = [], ok = (c, name) => { if (!c) fails.push(name); };
    const withMeta = (M, fn) => { const R = M0(); if (!R) return fn(); const keep = {}; for (const k of Object.keys(R)) keep[k] = R[k];
      for (const k of Object.keys(R)) delete R[k]; Object.assign(R, M);
      try { return fn(); } finally { for (const k of Object.keys(R)) delete R[k]; Object.assign(R, keep); } };
    try {
      const fx = () => ({treasury: 100, cp: null, leader: {name: 'Aldric', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1, injuries: [], picks: [], ticks: 0},
        gear: {armour: 'padded', shield: 'bucklers', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount', owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount', 'halfplate']},
        officers: [{name: 'Mira', id: 7, level: 2, injuries: [], picks: []}], roster: [], facilities: {}});
      const M = migrateMeta(fx());
      const hp = g('halfplate'), hpName = hp ? hp.name : 'halfplate';
      /* the guest's side: the pack and the snapshot */
      const guestGear = {armour: 'halfplate', shield: 'heavyshield', melee: 'shortswords', ranged: 'crossbows', kits: ['towershield', 'focus', 'satchel'], mount: 'riding', owned: ['x']};
      const packed = A.packLoadout(guestGear);
      ok(packed.armour === 'halfplate' && packed.kits.length === 2 && packed.owned === undefined, 'packLoadout: the six slots as ids, two kits, no deck');
      ok(A.packLoadout(null).armour === 'rags' && A.packLoadout({}).kits.length === 0, 'packLoadout: nothing packs as the bare loadout');
      if (window.MPCOOP && MPCOOP.snapshotPerson){
        const GM = migrateMeta(fx()); GM.gear.armour = 'halfplate';
        withMeta(GM, () => {
          const s = MPCOOP.snapshotPerson(META.leader), m = MPCOOP.snapshotPerson({name: 'Mate', id: 5});
          ok(s.loadout && s.loadout.armour === 'halfplate' && s.loadout.owned === undefined, 'snapshotPerson: the guest Leader\'s hello carries their loadout');
          ok(m.loadout === undefined, 'snapshotPerson: a mate carries none');
        });
      } else { ok(true, 'no MPCOOP'); ok(true, 'no MPCOOP'); }
      /* the host's side: the check */
      const bad = {armour: 'halfplate', shield: 'halfplate', melee: {id: 'x'}, ranged: 'nope', mount: 'rags', kits: ['towershield', 'towershield', 'nope', 'focus', 'satchel', 'rags']};
      const san = A.sanitizeLoadout(bad);
      ok(san.armour === 'halfplate' && san.shield === 'none' && san.melee === 'spears' && san.ranged === 'shortbows' && san.mount === 'nomount', 'sanitizeLoadout: known cards of the right slot stay, the rest fall to the bare card');
      ok(san.kits.length === 2 && san.kits[0] === 'towershield' && san.kits[1] === 'focus', 'sanitizeLoadout: kits unique, known, two at most');
      ok(A.sanitizeLoadout('halfplate').armour === 'rags' && A.sanitizeLoadout(null).mount === 'nomount', 'sanitizeLoadout: junk is the bare loadout');
      let cap = null, c2 = null;
      if (window.MPCOOP && MPCOOP.sanitizePerson) withMeta(M, () => {   /* the host's own save may be in the story: the check runs on the fixture */
        cap = MPCOOP.sanitizePerson({name: 'Pat', spec: 'FIGHTER', race: 'HUMAN', level: 3, loadout: packed}, true, 'g2');
        c2 = MPCOOP.sanitizePerson({name: 'Old', spec: 'FIGHTER', race: 'HUMAN', level: 3}, true, 'g3');
        ok(cap.guestCaptain && cap.loadout && cap.loadout.armour === 'halfplate' && cap.loadout !== packed, 'sanitizePerson: the captain keeps a checked copy of the loadout');
        ok(c2.guestCaptain && c2.loadout === undefined, 'sanitizePerson: a guest who sent none gets none');
        ok(MPCOOP.sanitizePerson({name: 'M', loadout: packed}, false, 'g2m0').loadout === undefined, 'sanitizePerson: a mate never carries one');
      }); else { cap = {name: 'Pat', id: 'g2', guestCaptain: true, loadout: A.sanitizeLoadout(packed)}; c2 = {name: 'Old', id: 'g3', guestCaptain: true}; ok(true, 'no MPCOOP'); ok(true, 'no MPCOOP'); ok(true, 'no MPCOOP'); }
      /* the field and the odds read the guest's cards, not the host's */
      const k = A.kitOf(cap, M);
      ok(k && k.armour.id === 'halfplate' && k.ranged.id === 'crossbows' && M.gear.armour === 'padded', 'kitOf: a guest captain\'s kit is their own, not the host\'s gear');
      ok(A.power(cap, M) > A.power(M.leader, M) && A.power(cap, M) > 13, 'power: the guest\'s Half-Plate counts in the odds');
      ok(A.kitOf(c2, M).armour.id === 'padded', 'a guest who sent no loadout rides in the host\'s kit as before');
      /* the host's deck is untouched */
      ok(A.total('halfplate', M) === 1 && A.spare('halfplate', M) === 1 && A.worn('halfplate', M) === 0 && A.audit(M).ok, 'the host\'s stock: the guest\'s Half-Plate is not the host\'s copy (one spare, none worn)');
      ok(A.total('heavyshield', M) === 0 && A.audit(M).ok, 'the host\'s stock: a card the host never owned stays at zero');
      const lines = [];
      ok(A.loseOfficer(cap, lines, M).length === 0 && lines.length === 0 && A.total('halfplate', M) === 1, 'loseOfficer: a fallen guest captain loses nothing from the host\'s deck, no line');
      ok(A.loseOfficer(M.officers[0], [], M).length === 0, 'loseOfficer: officers still go through A32 (a bare officer loses nothing)');
      ok(A.take('halfplate', cap, M) === false && A.put('halfplate', cap, M) === false && A.total('halfplate', M) === 1 && cap.loadout.armour === 'halfplate' && A.take('halfplate', M.officers[0], M) === true && A.put('halfplate', M.officers[0], M) === true && A.audit(M).ok, 'take/put: a guest is refused the host\'s deck, an officer is not');
      /* the lines (hostSeatHTML reads the live save, so under the fixture) */
      const kl = A.guestKitLine(cap, M);
      const lb = {seats: [{seat: 1, status: 'connected', name: 'Pat', captain: 'Pat', kit: kl}, {seat: 2, status: 'open'}, {seat: 3, status: 'connected', name: 'Jo', captain: 'Jo', kit: 'Armour: Rags'}]};
      withMeta(M, () => {
      ok(kl.indexOf(hpName) >= 0 && /adds [0-9.]+ to the odds/.test(kl), 'guestKitLine: names the cards and the term');
      ok(A.guestKitLine(c2, M) === '', 'guestKitLine: nothing for a guest without a loadout');
      ok(/Kit: .*Half-Plate/.test(A.hostSeatHTML(cap)) && /sent no loadout/.test(A.hostSeatHTML(c2)), 'hostSeatHTML: the kit under the captain line, or the note');
      const gl = A.guestLobbyHTML(lb, 1);
      ok(/Your kit: /.test(gl) && /Jo's kit: Armour: Rags/.test(gl) && (gl.match(/mpco-sub/g) || []).length === 2, 'guestLobbyHTML: "Your kit" and the others, open seats skipped');
      ok(A.seatKit({captain: cap}) === kl && A.seatKit({captain: c2}) === null && A.seatKit(null) === null, 'seatKit: the lobby payload line');
      });
      /* the odds through the engine */
      if (window.DETACH && DETACH.odds){
        const c = {tier: 1, host: 'bandits', obj: 'hunt', pay: 280};
        withMeta(M, () => {
          try {
            const r0 = DETACH.odds(c2, [], c, 'normal'), r1 = DETACH.odds(cap, [], c, 'normal');
            const s = r => r && r.p ? (r.p.win + r.p.costly) : (r && r.pct !== undefined ? r.pct / 100 : 0);
            ok(s(r1) > s(r0), 'DETACH.odds: a guest in Half-Plate beats one in the host\'s kit: ' + s(r0).toFixed(2) + ' -> ' + s(r1).toFixed(2));
          } catch (e) { ok(false, 'DETACH.odds threw: ' + (e && e.message || e)); }
        });
      } else ok(true, 'no DETACH');
      /* the story and off mode */
      withMeta(Object.assign(migrateMeta(fx()), {cp: {part: 'command'}}), () => {
        const s = window.MPCOOP && MPCOOP.snapshotPerson ? MPCOOP.snapshotPerson(META.leader) : {};
        const h = window.MPCOOP && MPCOOP.sanitizePerson ? MPCOOP.sanitizePerson({name: 'Pat', loadout: packed}, true, 'g2') : {};
        ok(s.loadout === undefined && h.loadout === undefined && A.hostSeatHTML(cap) === '', 'the story campaign: nothing sent, nothing attached, no lines');
      });
    } catch (e) { fails.push('threw: ' + (e && e.message || e)); }
    const n = 26;
    return {ok: fails.length === 0, n, pass: n - fails.length, fails};
  };
})();
