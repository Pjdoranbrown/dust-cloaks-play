/* ============================================================================
   INDEX LR34 - the Long Road band loop: persuade, equip, split loot (Lead Programmer, 2026-11-13)
   Design: audits/campaign-teach.md Scope (3). Patrick 2026-11-13 on the guard band: "turn it on".
   Runs while CARAVAN30 applies (new story saves). Over CARAVAN30's Parley:
   1. Persuade. The Parley roll is unchanged (Personality against 5, one a night, two captains on a success). There is
      no price: the terms are three nights, a quarter of the gold, half the Supply salvage (F-45 words, CAMPAIGN_LINES.act45.bands). A refusal costs nothing.
   2. The band. A captain (an officer record, level 4, never killed: knocked out and carried off) and four mates take the
      field as an ALLY squad on the guard-the-column order (SHARE34.guard: hold the Column Zone, fight within 220 px).
      Base kit: Studded Brigandine, Heavy Infantry Shields, spears, shortbows [S]. Traits, one dial each [S]:
      Faithful +1 Ward Token; Deepshaft +1 armour step on the mates; Rowan Watch archers, +30 px reach on the shot;
      Rust-Pikes +22 px melee reach (the pike value); Ridge-Striders +10% move and sight.
   3. Equip. Any card the company owns and the Leader is not wearing can be lent from the band's letter on the board,
      one per slot (armour, shield, melee, ranged); it replaces the base card and returns to the wagon when the band leaves.
   4. Split loot. Gold: SHARE34's loot dividend (50% of the band's size-share) on coin carried home. Supply salvage, the
      night's only loot: the band takes half, rounded down (Patrick 2026-11-14, K.supplyShare; 0 = none).
   5. Walk away: a band that has lost more than half its mates leaves at dawn; the cards come back.
   Text: CAMPAIGN_LINES.persuade (Narrative); lines marked [S] in code are drafts.
   Not built yet: the captain made an officer after three nights (share 25%), first pick of fine gear, a second band.
   No switch (removed in INT-1, 2026-11-15); delete this file and its tag to bring CARAVAN30's paid hire back.
============================================================================ */
(function(){
  'use strict';
  const CV = window.CARAVAN30, SH = window.SHARE34;
  if (!CV || !SH) return;
  const LR = window.LR34 = {log: []};
  const K = LR.K = {mates: 4, nights: 3, supplyShare: 0.5, base: {armour: 'brigandine', shield: 'heavyshield', melee: 'spears', ranged: 'shortbows', mount: 'nomount', kits: []},
    ward: 1, armourStep: 1, rangeX: 30, reachX: 22, ridgeK: 1.1};   // [S] all
  const SLOTS = ['armour', 'shield', 'melee', 'ranged'];
  LR.live = () => !!CV.applies();
  const P = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.persuade) || {frame: {}, traits: {}, bands: {}, loot: {}};
  const fill = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const NAME = {faithful: 'The Emperor’s Faithful', deepshaft: 'The Deepshaft Company', rowan: 'The Rowan Watch', rustpikes: 'The Rust-Pikes', ridge: 'The Ridge-Striders'};
  const RACE = {faithful: 'HUMAN', deepshaft: 'DWARF', rowan: 'HALF_ELF', rustpikes: 'HUMAN', ridge: 'HUMAN'};
  const bName = id => NAME[id] || id;
  const g = id => (typeof gear === 'function' ? gear(id) : null);
  LR.isBand = H => !!(H && H.lr34);

  /* ---- the wagon: what can be lent ---- */
  const worn = () => { try { const G0 = META.gear || {}; return [G0.armour, G0.shield, G0.melee, G0.ranged, G0.mount].concat(G0.kits || []); } catch (e) { return []; } };
  LR.lendable = function(H){
    const lent = Object.values(H.lent || {}), w = worn();
    return ((META.gear && META.gear.owned) || []).filter(id => { const x = g(id); return x && x.cost > 0 && SLOTS.includes(x.slot) && !w.includes(id) && !lent.includes(id); });
  };
  LR.kit = H => { const k = Object.assign({}, K.base, {kits: []}); for (const s of SLOTS) if (H.lent && H.lent[s]) k[s] = H.lent[s]; return k; };
  LR.lend = function(id){
    const C = CP(), H = C.band30; if (!LR.live() || !LR.isBand(H) || !LR.lendable(H).includes(id)) return SFX.play('nope');
    const x = g(id); H.lent = H.lent || {}; H.lent[x.slot] = id;
    const B = P().bands[H.id] || {}; cpLog(fill(P().loot.lent || '{card} is lent to {band}.', {card: x.name, band: bName(H.id)}) + (B.lent ? ' ' + B.lent : ''));
    SFX.play('pick'); saveMeta(); renderWorkBoard(); return true;
  };
  LR.takeBack = function(slot){
    const C = CP(), H = C.band30; if (!LR.isBand(H) || !H.lent || !H.lent[slot]) return SFX.play('nope');
    const x = g(H.lent[slot]); delete H.lent[slot];
    cpLog(fill(P().loot.returned || '{card} returns to the wagon.', {card: x ? x.name : 'The card'}));
    SFX.play('pick'); saveMeta(); renderWorkBoard(); return true;
  };
  // the cards come home: one line per card
  LR.recall = function(H, lines){
    const out = [];
    for (const s of SLOTS) if (H.lent && H.lent[s]){ const x = g(H.lent[s]); out.push(x ? x.name : H.lent[s]); }
    if (out.length && lines){ const B = P().bands[H.id] || {}; lines.push(`<p>${out.map(n => E(fill(P().loot.returned || '{card} returns to the wagon.', {card: n}))).join(' ')}${B.returned ? ' ' + E(B.returned) : ''}</p>`); }
    H.lent = {}; return out;
  };

  /* ---- persuade ---- */
  LR.persuade = function(id){
    const C = CP(); if (!LR.live() || C.hired || !(C.offer30 || []).includes(id)) return SFX.play('nope');
    C.band30 = {id, nights: K.nights, n: K.mates, n0: K.mates, lr34: true, lent: {}}; C.hired = true; C.offer30 = null;
    const B = P().bands[id] || {}; cpLog(`Recruit a band: ${bName(id)} march with you for three nights, for a quarter of the gold and half the Supply salvage. ${B.accept || ''}`);   // [S]
    LR.log.push({persuade: id}); SFX.play('pick'); saveMeta(); renderWorkBoard(); return true;
  };
  { const f = CV.decline; CV.decline = function(){
      if (!LR.live()) return f.apply(this, arguments);
      const C = CP(), o = C.offer30 || []; C.offer30 = null;
      if (o[0]){ const B = P().bands[o[0]] || {}; cpLog('Recruit a band: ' + (B.refuse || P().frame.refuse || 'the captains walk away.')); }
      saveMeta(); renderWorkBoard(); }; }

  /* ---- the board: the offer letter and the band's letter ---- */
  const R45w = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.report) || {};   // the Planner's night-report words
  const A45b = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.bands) || {};   // the Planner's band words
  LR.offerHTML = function(C){
    const F = P().frame, T = P().traits;
    return `<div class="scroll letter" data-cv30="offer" data-lr34="offer"><h3>Other companies on the road</h3><div class="ink small">${E(F.intro || '')} ${E(C.offer30.length > 1 ? F.offerTwo || '' : F.offerOne || '')}</div><div class="ink small"><i>${E(A45b().terms || F.terms || '')}</i></div>` +
      C.offer30.map(id => { const B = P().bands[id] || {}, t = T[id] || {};
        return `<div class="ink" style="margin-top:6px"><b>${E(bName(id))}</b></div><div class="ink small">${E(B.approach || '')}</div>` +
          (t.name ? `<div class="ink small"><b>${E(t.name)}:</b> ${E(t.line || '')}</div>` : '') +
          `<div class="mini" style="justify-content:flex-start"><button onclick="LR34.persuade('${id}')">${E(A45b().button || 'Take them on (three nights, a quarter of the gold, half the salvage)')}</button></div>`; }).join('') +
      `<div class="mini" style="justify-content:flex-start"><button onclick="CARAVAN30.decline()">Send them away</button></div></div>`;
  };
  LR.bandHTML = function(C){
    const H = C.band30, t = P().traits[H.id] || {}, F = P().frame, k = LR.kit(H);
    const left = fill(H.nights === 1 ? F.nightLeftOne || '{band} march with you for one more night.' : F.nightLeft || '{band} march with you for {n} more nights.', {band: bName(H.id), n: H.nights});
    const kitLine = SLOTS.map(s => { const x = g(k[s]); return (x ? x.name : k[s]) + (H.lent && H.lent[s] ? ' (lent)' : ''); }).join(', ');
    const back = SLOTS.filter(s => H.lent && H.lent[s]).map(s => `<button onclick="LR34.takeBack('${s}')">Take back ${E((g(H.lent[s]) || {}).name || H.lent[s])}</button>`).join('');
    const can = LR.lendable(H).map(id => `<button onclick="LR34.lend('${id}')">Lend ${E(g(id).name)}</button>`).join('');
    return `<div class="scroll letter" data-cv30="band" data-lr34="band"><h3>${E(bName(H.id))}</h3><div class="ink small">${E(left)} ${H.n} mates and their captain hold the column. ${E(F.termsShort || '')}</div>` +
      (t.name ? `<div class="ink small"><b>${E(t.name)}:</b> ${E(t.line || '')}</div>` : '') +
      `<div class="ink small">Kit: ${E(kitLine)}.</div>` +
      (can || back ? `<div class="ink small" style="margin-top:4px">Lend them a card from the wagon; it comes back when they leave.</div><div class="mini" style="justify-content:flex-start;flex-wrap:wrap">${back}${can}</div>` : '') + '</div>';   // [S]
  };
  { const f = CV.board; CV.board = function(){
      const r = f.apply(this, arguments);
      try {
        if (!LR.live()) return r;
        const C = CP(), root = document.getElementById('table-inner'); if (!root) return r;
        for (const c of root.querySelectorAll('.wcard')){ const t = c.querySelector('.wt'); if (t && t.textContent === 'Recruit a band'){ const d = c.querySelector('.wd'); if (d) d.textContent = 'Persuade a band from one of the other companies.'; } }   // [S]
        const o = root.querySelector('[data-cv30="offer"]'), b = root.querySelector('[data-cv30="band"]');
        if (o && C.offer30 && C.offer30.length) o.outerHTML = LR.offerHTML(C);
        if (b && LR.isBand(C.band30) && C.hired) b.outerHTML = LR.bandHTML(C);
      } catch (e) { console.warn('LR34 board', e); }
      return r; }; }
  // a paid hire is not offered while the bands are on
  { const f = CV.hire; CV.hire = function(){ if (LR.live()) return SFX.play('nope'); return f.apply(this, arguments); }; }

  /* ---- the night: the band takes the field as a squad on the guard order ---- */
  LR.spawn = function(H){
    const tr = META.treasury, nid = META.nextId, race = RACE[H.id] || 'HUMAN', names = [];
    for (let i = 0; i < H.n; i++){ let n = bName(H.id).replace(/^The /, '') + ' ' + (i + 1); try { n = randomName(race, Math.random() < .5 ? 'f' : 'm'); } catch (e) {} names.push(n); }
    let b; try { b = SH.band(H.id, LR.kit(H), H.nights, {race, n: H.n, names, name: 'Captain of ' + bName(H.id).replace(/^The /, 'the '), spec: H.id === 'rowan' ? 'FOLK_HERO' : 'SOLDIER'}); }   // [S] the captain's name
    finally { META.treasury = tr; META.nextId = nid; }   // makeLeader's Windfall and makeMate's ids are not the company's
    b.officer.guestCaptain = true;   // knocked out and carried off, never killed; the lent cards always come back
    const sq = SH.spawnBand(b, {seat: 2}); SH.guard(sq); sq.lr34 = H.id;
    for (const u of sq.units){ u.band30 = H.id;
      if (H.id === 'deepshaft' && !u.officer) u.shift = (u.shift || 0) + K.armourStep;
      if (H.id === 'rowan') u.rangeX = K.rangeX;
      if (H.id === 'rustpikes') u.reachX = K.reachX;
      if (H.id === 'ridge'){ u.spdK = K.ridgeK; u.seeK = K.ridgeK; } }
    if (H.id === 'faithful' && typeof addWard === 'function') addWard(K.ward);
    try { if (window.ALLY && ALLY.seatsSync) ALLY.seatsSync(); } catch (e) {}
    return sq;
  };
  { const f = CV.setupNight; CV.setupNight = function(c){
      const r = f.apply(this, arguments);
      try {
        const C = CP(), H = C.band30;
        if (LR.live() && LR.isBand(H) && C.hired){
          G.allies = G.allies.filter(u => u.units || !(u.band30 === H.id || u.type === 'sellswords'));   // the old sellsword slot goes; the squad comes
          const w = worn(); for (const s of SLOTS) if (H.lent && w.includes(H.lent[s])) delete H.lent[s];   // the Leader wears it now: not lent twice
          G.lr34Due = H;   // spawned once startDeployment is done: ALLY's wrapper clears squads made during setup
        }
      } catch (e) { console.warn('LR34 night', e); }
      return r; }; }
  LR.afterStart = function(){ try { if (typeof G !== 'undefined' && G && G.lr34Due){ const H = G.lr34Due; G.lr34Due = null; if (LR.live() && !bandSq()) return LR.spawn(H); } } catch (e) { console.warn('LR34 spawn', e); } return null; };
  { const f = startDeployment; startDeployment = function(){ const r = f.apply(this, arguments); LR.afterStart(); return r; }; }

  /* ---- the debrief: losses, the Supply share, walk away, the cards home ---- */
  const bandSq = () => (typeof G !== 'undefined' && G && G.allies || []).find(u => u && u.units && u.lr34);
  { const f = storyDebrief; storyDebrief = function(c, result, lines){
      const C = CP(), H = C && C.band30, mine = !!(LR.live() && c && c.obj === 'night' && LR.isBand(H) && C.hired), sq = mine ? bandSq() : null;
      if (mine) C.band30 = null;   // CARAVAN30's own band block reads the old sellsword units: keep it out
      let r;
      try { r = f.apply(this, arguments); } finally { if (mine) C.band30 = H; }
      if (!mine) return r;
      try {
        const left = sq ? sq.units.filter(u => !u.officer && u.state === 'up').length : H.n, lost = Math.max(0, H.n - left), B = P().bands[H.id] || {};
        if (sq) sq.lines = [];   // ALLY's guest lines do not fit a band
        lines.push(`<p>${E(bName(H.id))}: ${sq ? sq.kills : 0} kills${lost ? `; ${lost} of ${H.n} fell` : ''}.</p>`);   // [S]
        H.n = left; H.nights--; (C.met30 = C.met30 || []).includes(H.id) || C.met30.push(H.id);
        // half the night's salvage (the base debrief paid it in Supply)
        const salv = Math.min(4, 1 + Math.floor((G.kills || 0) / 45)), cut = Math.floor(salv * K.supplyShare);
        if (cut > 0){ C.supply -= cut; lines.push(`<p>${E(bName(H.id))} take ${cut} Supply, their half of the salvage.</p>`); }   // [S]
        LR.log.push({night: c.night, band: H.id, lost, left, cut});
        if (H.n0 - H.n > H.n0 / 2){
          lines.push(`<p class="bad">${E(fill(R45w().bandLeft || P().walkAway || '{band} have lost too many to go on. They walk away at dawn.', {band: bName(H.id)}))}${B.walk ? ' ' + E(B.walk) : ''}</p>`);
          LR.recall(H, lines); C.band30 = null; C.hired = false;
        } else if (H.nights > 0 && C.part === 'road'){
          C.hired = true; const F = P().frame;
          lines.push(`<p>${E(fill(H.nights === 1 ? F.nightLeftOne || '{band} march with you for one more night.' : F.nightLeft || '{band} march with you for {n} more nights.', {band: bName(H.id), n: H.nights}))}</p>`);
        } else {
          const cl = window.CARAVAN_LINES && CARAVAN_LINES.bands && CARAVAN_LINES.bands[H.id];
          lines.push(`<p>${E(R45w().bandDone ? fill(R45w().bandDone, {band: bName(H.id)}) : (cl && cl.leave) || `${bName(H.id)} go back to their own banner.`)}</p>`);
          LR.recall(H, lines); C.band30 = null; C.hired = false;
        }
      } catch (e) { console.warn('LR34 debrief', e); }
      return r; }; }

  /* ---- self-test ---- */
  // CARAVAN30's own test pins the paid hire: run it with LR34.live stubbed false, test only (this test covers the loop)
  { const f = CV.selfTest; if (f) CV.selfTest = function(){ const lv = LR.live; LR.live = () => false; try { return f.apply(this, arguments); } finally { LR.live = lv; } }; }
  LR.selfTest = function(){
    const out = [], ok = (n, c, info) => out.push({name: n, pass: !!c, info: info || ''});
    const sv = {G, MAP, cp: META.cp, tr: META.treasury, nid: META.nextId, sk: SAVE_KEY, save: saveMeta, rw: renderWorkBoard, note, roll: cpRoll, gear: META.gear, sfx: SFX.play, aw: window.addWard};
    try {
      SAVE_KEY = '__lr34_test'; saveMeta = () => {}; renderWorkBoard = () => {}; note = () => {}; SFX.play = () => {};
      META.gear = Object.assign({}, sv.gear || {}, {armour: 'leather', shield: 'none', melee: 'spears', ranged: 'shortbows', mount: 'nomount', kits: [], owned: ['rags', 'leather', 'cuirass', 'longbows', 'pikes', 'heavyshield', 'spears', 'shortbows']});
      META.cp = {part: 'road', night: 2, column: 20, supply: 12, orders: 3, aux: [], log: [], hired: false, caravan30: true, wagonHp: 100, wagonMax: 100, formation: 'laager', slots: []};
      const C = META.cp;
      ok('live on a new story save', LR.live());
      cpRoll = () => 'full'; workOrder('parley');
      ok('the Parley roll still brings two captains', (C.offer30 || []).length === 2);
      const tr0 = META.treasury, s0 = C.supply, id = C.offer30[0];
      ok('no paid hire while the bands are on', CV.hire(id, 3) !== true && !C.hired);
      LR.persuade(id);
      ok('persuaded: three nights, no gold, no Supply', C.hired && C.band30 && C.band30.lr34 && C.band30.nights === 3 && C.band30.n === 4 && META.treasury === tr0 && C.supply === s0);
      const H = C.band30;
      ok('the wagon cards the Leader is not wearing can be lent', LR.lendable(H).includes('cuirass') && !LR.lendable(H).includes('leather') && !LR.lendable(H).includes('spears'));
      LR.lend('cuirass'); LR.lend('longbows');
      ok('lent cards replace the base kit', LR.kit(H).armour === 'cuirass' && LR.kit(H).ranged === 'longbows' && LR.kit(H).shield === 'heavyshield' && !LR.lendable(H).includes('cuirass'));
      LR.takeBack('ranged'); ok('a card can be taken back', !H.lent.ranged && LR.kit(H).ranged === 'shortbows');
      // the night, for each band's trait
      MAP = generateNightMap(2, 'laager');
      const mkG = () => ({obj: 'night', allies: [{type: 'sellswords', aux: {type: 'sellswords', n: 4}, state: 'up'}], column: MAP.column, colLoss: 0, contract: {obj: 'night', night: 2, seed: 1}, floats: [], fx: [], pops: [], texts: [], leader: {x: MAP.column.x, y: MAP.column.y}, squad: [], enemies: [], shots: [], kills: 0, wards: 0, frame: 0, sec: 0});
      const traits = {};
      for (const b of CV.BANDS){ G = mkG(); H.id = b; let ward = 0; addWard = n => { ward += n; };
        CV.setupNight({obj: 'night'}); LR.afterStart(); const sq = bandSq();
        traits[b] = {sq, ward, mate: sq && sq.units.find(u => !u.officer), cap: sq && sq.units.find(u => u.officer)}; }
      const T = traits.deepshaft;
      ok('the band takes the field as a squad: captain and four mates, the sellswords gone', T.sq && T.sq.units.length === 5 && T.sq.band && !G.allies.some(u => u.type === 'sellswords'));
      ok('it guards the column', T.sq.guard === true);
      ok('the captain wears the lent card through ARM', T.cap.kit && T.cap.kit.armour && T.cap.kit.armour.id === 'cuirass', T.cap.kit && T.cap.kit.armour && T.cap.kit.armour.id);
      ok('the captain is never killed (carried off)', T.cap.p.guestCaptain && T.sq.mates.every(m => m.guestMate));
      ok('spawning costs the company nothing (no Windfall gold, no ids)', META.treasury === tr0 && META.nextId === sv.nid);
      ok('Faithful: +1 Ward Token', traits.faithful.ward === K.ward && traits.rowan.ward === 0);
      ok('Deepshaft: +1 armour step on the mates', traits.deepshaft.mate.shift === traits.rowan.mate.shift + K.armourStep);
      ok('Rowan Watch: archers, +30 px reach on the shot', traits.rowan.mate.spec === 'FOLK_HERO' && traits.rowan.mate.rangeX === K.rangeX);
      ok('Rust-Pikes: +22 px melee reach', traits.rustpikes.mate.reachX === K.reachX && !traits.ridge.mate.reachX);
      ok('Ridge-Striders: +10% move and sight', traits.ridge.mate.spdK === K.ridgeK && traits.ridge.mate.seeK === K.ridgeK);
      // the guard order holds the Column Zone
      G = mkG(); H.id = 'rustpikes'; CV.setupNight({obj: 'night'}); LR.afterStart(); const gs = bandSq(); gs.orders = 'follow'; G.leader.x += 600;
      { const us = updateStory, au = ALLY.update; updateStory = () => {}; ALLY.update = () => {}; try { updateContract(); } catch (e) {} finally { updateStory = us; ALLY.update = au; } }
      ok('the guard order holds at the column', gs.orders === 'hold' && Math.abs(gs.anchor.x - G.column.x) < 1 && Math.abs(gs.anchor.y - (G.column.y + 20)) < 1);
      // the debrief: one mate lost, the Supply share, the band stays
      const debrief = (lostN, kills) => { const sq = bandSq(); sq.units.filter(u => !u.officer).slice(0, lostN).forEach(u => { u.state = 'down'; }); G.kills = kills; G.ledger = {hp: 100}; const L = []; C.supply = 12; storyDebrief({obj: 'night', night: C.night}, 'victory', L); return L.join(' '); };
      let txt = debrief(1, 90);
      ok('a night: the band counts its dead and stays', C.band30 === H && H.n === 3 && H.nights === 2 && C.hired && /1 of 4 fell/.test(txt), txt.slice(0, 120));
      ok('the band takes half the salvage in Supply', /take 1 Supply/.test(txt) && C.supply === 12 + 3 - 1, C.supply + '');
      ok('no paid-band lines from CARAVAN30', !/None of|lost \d of \d\./.test(txt));
      // walk away: more than half the mates lost
      G = mkG(); CV.setupNight({obj: 'night'}); LR.afterStart(); txt = debrief(2, 0);
      ok('more than half lost: the band walks away, the cards come home', !C.band30 && !C.hired && /walk(ed)? away/.test(txt) && /Cuirass|returns to the wagon|came back to the wagon/.test(txt), txt.slice(0, 160));
      // three nights served
      C.offer30 = ['ridge']; LR.persuade('ridge'); C.band30.nights = 1; G = mkG(); CV.setupNight({obj: 'night'}); LR.afterStart(); txt = debrief(0, 0);
      ok('the third night: the band goes home', !C.band30 && !C.hired);
      ok('band text comes from Narrative', !window.CAMPAIGN_LINES || LR.offerHTML({offer30: ['rowan']}).indexOf(E(CAMPAIGN_LINES.persuade.bands.rowan.approach)) >= 0);
    } catch (e) { ok('selfTest ran', false, String(e && e.stack || e).slice(0, 220)); }
    finally { G = sv.G; MAP = sv.MAP; META.cp = sv.cp; META.treasury = sv.tr; META.nextId = sv.nid; SAVE_KEY = sv.sk; saveMeta = sv.save; renderWorkBoard = sv.rw; note = sv.note; cpRoll = sv.roll; META.gear = sv.gear; SFX.play = sv.sfx; addWard = sv.aw; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  };
})();
