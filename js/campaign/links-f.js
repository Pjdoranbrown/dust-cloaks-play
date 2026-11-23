/* INDEX L35f: F-29 Camp links, build step 4: allied factions give a signature card (link 3).
   Scope: audits/links-f29.md section 3, with the Director's change (Patrick, 2026-11-13): the card is the faction's gift,
   free and one copy, never sold, so the Dwarven 20% armour discount never touches it.
   - The first time standing with Mendor, the Suderian Freemen or the Dwarves reaches Allied (+2), one copy of their card
     goes into the camp's stock (ARM.add) with a debrief or camp line. Once per faction per campaign (META.factionGifts).
     A save that is already Allied gets it at the next planning table. If the wagon is full, the gift waits until there is room.
   - The cards stay in GEAR even when the flag is off, so a deck that holds one keeps it. Their req carries '#gift', which is
     never met, so no shop or officer can buy another copy; a held copy is worn and swapped like any card.
   - Reliquary Shield: Shield Pool 4 and +1 Ward Token at the start of each contract (setupContract wrapper).
   Cards and numbers are drafts for Systems [S]: cost is only the sell value. No switches (removed in INT-1, 2026-11-15). */
(function(){
  const L = window.LINKS35; if (!L || typeof GEAR === 'undefined' || typeof shiftStanding !== 'function') return;
  const CARDS = [
    {id:'reliquary', fac:'mendor', slot:'shield', name:'Reliquary Shield', cost:140, pool:4, ward:1, req:['@mendor', '#gift'],
     note:'A gift of the Mendorian Order. Shield Pool 4, and +1 Ward Token at the start of each contract.'},
    {id:'freemanxbow', fac:'suderia', slot:'ranged', name:"Freeman's Crossbows", cost:150, dmg:3, range:260, cd:1.0, close:130, req:['@suderia', '#gift'],
     note:'A gift of the Suderian Freemen. +1 step at short range (130px), and they reload as fast as a bow.'},
    {id:'kragganplate', fac:'dwarves', slot:'armour', name:'Kraggan Plate', cost:600, ac:6, shift:2, mv:-1, req:['@dwarves', '#gift'],
     note:'A gift of the Dwarven Syndicates. Heavy plate from the Kraggan forges.'}
  ];
  for (const c of CARDS) if (!GEAR.some(g => g.id === c.id)){ const x = Object.assign({}, c); delete x.fac; x.gift = c.fac; GEAR.push(x); }
  try { if (typeof ARMOUR_LOOK !== 'undefined') ARMOUR_LOOK.kragganplate = ARMOUR_LOOK.kragganplate || ['#9aa3a8', 'plate']; } catch (e) {}
  try { if (typeof RANGED_ART !== 'undefined') RANGED_ART.freemanxbow = 'xbow'; } catch (e) {}
  try { if (typeof B2_RANGED !== 'undefined' && !B2_RANGED.includes('freemanxbow')) B2_RANGED.push('freemanxbow'); } catch (e) {}
  L.giftCards = CARDS.map(c => c.id);
  const LN = () => Object.assign({giftLine: '{fac} send a gift to seal the alliance: {card}. It is {where}.'}, window.LINKS35_LINES || {});
  const fillL = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);

  /* '#gift' reads as a plain label in the shop, never as a veteran post */
  if (typeof reqPseudo === 'function'){ const f = reqPseudo; reqPseudo = function(id){ return id === '#gift' ? {id, name: 'a faction gift (not for sale)'} : f.apply(this, arguments); }; }

  /* ---- the gift ---- */
  L.storyNow = () => typeof inStoryNow === 'function' && inStoryNow();   // the prologue's charter gives no gifts
  L.gifts = () => (META.factionGifts = META.factionGifts && typeof META.factionGifts === 'object' ? META.factionGifts : {});
  L.giftCheck = function(lines){   // gives every gift now due; returns the lines it made
    const made = [];
    if (!META || L.storyNow()) return made;
    for (const c of CARDS){
      if (L.gifts()[c.fac] || !allied(c.fac)) continue;
      if (window.ARM && ARM.room && !ARM.room(META)) continue;              // the wagon is full: it waits
      if (window.ARM && ARM.add) ARM.add(c.id); else if (META.gear && !META.gear.owned.includes(c.id)) META.gear.owned.push(c.id);
      L.gifts()[c.fac] = true;
      const where = window.ARM && ARM.built && ARM.built(META) ? 'in the Armoury' : 'on the wagon';
      made.push(`<p class="good">${esc(fillL(LN().giftLine, {fac: cap(facName(c.fac)), card: c.name, where}))}</p>`);
    }
    if (lines && Array.isArray(lines)) lines.push(...made);
    return made;
  };
  { const f = shiftStanding;
    shiftStanding = function(fac, n, lines){
      const out = f.apply(this, arguments);
      try { const m = L.giftCheck(lines); if (m.length && !lines) CH_MSG = m.map(x => x.replace(/<[^>]+>/g, '')).join(' '); } catch (e) { console.warn('LINKS35 gift', e); }
      return out;
    };
  }
  if (typeof renderTable === 'function'){ const f = renderTable;
    renderTable = function(){
      try { const m = L.giftCheck(null); if (m.length){ CH_MSG = m.map(x => x.replace(/<[^>]+>/g, '')).join(' '); saveMeta(); } } catch (e) { console.warn('LINKS35 gift', e); }
      return f.apply(this, arguments);
    };
  }
  /* never bought: every buy path (gearClick, the officer's OC.buy, the prologue kit day) refuses an unmet req, and '#gift' is never met */
  /* the Reliquary Shield's Ward Token */
  if (typeof setupContract === 'function'){ const f = setupContract;
    setupContract = function(){
      const r = f.apply(this, arguments);
      try { if (G && G.shield && G.shield.id === 'reliquary' && G.shield.ward) G.wards = Math.min(4, (G.wards || 0) + G.shield.ward); } catch (e) {}
      return r;
    };
  }

  /* ---- self-test ---- */
  L.selfTestF = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const sv = {st: META.standing, fg: META.factionGifts, sm: saveMeta, add: window.ARM && ARM.add, room: window.ARM && ARM.room, msg: CH_MSG, sn: L.storyNow};
    const added = [];
    try {
      saveMeta = () => {}; L.storyNow = () => false;
      if (window.ARM){ ARM.add = id => added.push(id); ARM.room = () => true; }
      META.standing = {mendor: 1, suderia: 0, dwarves: 0}; META.factionGifts = {};
      ok('each card is in GEAR with a slot, a cost and the gift lock', CARDS.every(c => { const g = gear(c.id); return g && g.slot === c.slot && g.cost > 0 && g.req.includes('#gift'); }));
      ok('the gift lock is never met, and reads as a plain label', !has('#gift') && /gift/.test(facility('#gift').name));
      ok('standing +1: no gift', !L.giftCheck(null).length && !added.length);
      const lines = []; shiftStanding('mendor', 1, lines);
      ok('reaching Allied gives one Reliquary Shield and a line', added.length === 1 && added[0] === 'reliquary' && lines.some(x => /Reliquary/.test(x)), added.join());
      shiftStanding('mendor', -1, []); shiftStanding('mendor', 1, []);
      ok('only once per campaign', added.length === 1);
      shiftStanding('mendor', -2, []); ok('standing falls: the card is kept (nothing taken back)', added.length === 1);
      META.standing.dwarves = 2; if (window.ARM) ARM.room = () => false; L.giftCheck(null);
      ok('a full wagon: the gift waits', added.length === 1 && !META.factionGifts.dwarves);
      if (window.ARM) ARM.room = () => true; L.giftCheck(null);
      ok('then arrives when there is room', added.length === 2 && added[1] === 'kragganplate' && META.factionGifts.dwarves);
      ok('never for sale, so the dwarf discount never applies', CARDS.every(c => gear(c.id).req.some(r => !has(r))));
    } catch (e) { ok('threw', false, e && e.message); }
    finally {
      META.standing = sv.st; META.factionGifts = sv.fg; saveMeta = sv.sm; CH_MSG = sv.msg; L.storyNow = sv.sn;
      if (window.ARM){ ARM.add = sv.add; ARM.room = sv.room; }
      if (META.factionGifts === undefined) delete META.factionGifts;
    }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
