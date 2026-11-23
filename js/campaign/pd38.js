/* INDEX PD38: PD-38 Zenif trains the Mage in Varnholt (audits/f45-pd-specs.md section 2; Patrick's OK via the Director, 2026-11-16).
   - The Mage (F34.MAGE, Human Freeman Mage, Magic 1, p.f34caster) joins at b5b "The Hunt" (G2 option B, GD 22 Nov) with a join card (PD-36's
     D45.joinHTML), not on road Night 5 (F34.roadMage is gone; Night 5 keeps its caster caption). Full roster: the "no room"
     line, no Mage and no training.
   - b9 "The second assault": Zenif takes her up on the east wall. The gate card shows the Training card; she is out of the squad
     (F34.squad) and off the wall (DEF30.pickArchers).
   - The b9 debrief: +1 Magic (1 to 2), so one spare slot (BOOK33.spare), and Ray of Frost in her book and auto slot. The Night 9
     road gift (D45.gift) is gone.
   - The Witch offer in the same debrief, only if a Witch is on the roster (today she joins on Night 7, so it is skipped):
     SEND HER takes her out of the next fight; she comes back with +1 Magic and Briar Thicket. KEEP HER: nothing lost.
   Words: [T] defaults in DEF; CAMPAIGN_LINES.pd38 overrides any key. State: META.f34.pd38 = {id, t, room, trained, w}.
   Self-test: PD38.selfTest(). */
(function(){
  'use strict';
  if (!window.F34) return;
  const F = F34, P = window.PD38 = {};
  const DEF = {
    joins: '{name} has come in with the refugees: a hedge-mage, Magic 1. Zenif has his eye on her.',
    noRoom: 'The hedge-mage looks at the crowded wagons and walks on with the refugees: the squad has no room.',
    title: 'Training',
    training: '{name} spends this assault on the east wall with Zenif, training. She is out of the squad for this fight.',
    zenifAsk: 'Give me {name} for this assault. On the east wall she can watch me cast. A Mage grows by Magic, not by fighting, and each point of Magic is one more spell she can carry.',
    away: 'Training with Zenif',
    back: '{name} is back from the wall: Magic 2. She can carry a second spell now, and Zenif taught her one: Ray of Frost. It fires on its own.',
    witch: '‘The other one, the hedge-witch. I can do the same for her, if you can spare her a day.’',
    send: 'SEND HER', keep: 'KEEP HER',
    sent: '{name} goes up on the wall with Zenif and misses the next fight.',
    kept: '{name} stays with the squad.',
    witchBack: '{name} is back from the wall: Magic {n}. Zenif taught her Briar Thicket. It fires on its own.'
  };
  P.W = k => { const L = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd38) || {}; return L[k] != null ? L[k] : DEF[k]; };
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const E = t => typeof esc === 'function' ? esc(t) : String(t);
  const S = () => { const st = F.state(); return st ? (st.pd38 = st.pd38 || {}) : null; };
  const byId = id => id == null ? null : (META.roster || []).find(p => p && p.id === id) || null;
  const idx = id => F.BEATS.findIndex(b => b.id === id);
  P.mage = () => { const s = S(); return s ? byId(s.id) : null; };
  // she is training while the Founding stands at b8 and the b8 debrief has not run
  P.training = () => { const st = F.active() && F.state(), s = st && st.pd38; return !!(s && s.id != null && !s.trained && (st.beat | 0) === idx('b9') && P.mage()); };
  P.witchAway = () => { const st = F.active() && F.state(), w = st && st.pd38 && st.pd38.w; return !!(w && w.sent && !w.done && byId(w.id)); };
  P.out = id => (P.training() && S().id === id) || (P.witchAway() && S().w.id === id);

  /* b5b: the Mage joins, once */
  P.join = function(){
    const s = S(); if (!s || s.t) return s;
    if (META.roster.length >= rosterCap()){ s.room = false; s.t = P.W('noRoom'); return s; }
    let nm = 'Ysolde'; try { nm = randomName(F.MAGE.race, F.MAGE.sex); } catch (e) {}
    const m = makeMate(F.MAGE.race, F.MAGE.cls, F.MAGE.spec, nm); m.sex = F.MAGE.sex; m.magic = F.MAGE.magic; m.f34caster = true;
    META.roster.push(m); s.id = m.id; s.room = true; s.t = fill(P.W('joins'), {name: m.name});
    return s;
  };
  P.joinHTML = function(){
    const s = S(); if (!s || !s.t) return '';
    const m = P.mage(), h = m && window.D45 && D45.joinHTML ? D45.joinHTML(m, s.t) : `<div class="note"><b>${E(s.t)}</b></div>`;
    return `<div data-pd38="join" style="max-width:640px;margin:8px auto">${h}</div>`;
  };
  // the b5b card (the plain job card, or act2's War Table when Lessons are on): the join card rides on whichever F.card it makes
  { const f = F.go; F.go = function(){
      let c0 = null;
      try { const st = F.state(), b = st && F.BEATS[st.beat];
        if (F.active() && b && b.id === 'b5b'){ P.join(); if (typeof saveMeta === 'function') saveMeta(); const jh = P.joinHTML(); c0 = F.card;
          F.card = function(t, body, foot){ F.card = c0; return c0.call(this, t, (body || '') + jh, foot); }; } } catch (e) { console.warn('PD38 join', e); }
      try { return f.apply(this, arguments); } finally { if (c0) F.card = c0; } }; }

  /* b8: the Training card on the gate card; out of the squad and off the wall */
  P.trainingHTML = function(){
    const m = P.mage(); if (!m) return '';
    let face = ''; try { face = (window.HERO_PORT && HERO_PORT.zenif) || (typeof heroPortraitURL === 'function' ? heroPortraitURL('zenif') : ''); } catch (e) {}
    // N2 (U-slice §7): Zenif is a speaker: his own box (the .f34-sp the story cards use), directly under the narration, holding only his words
    const zen = `<div class="f34-sp" data-pd38="zenif" style="margin-top:0"><div class="f34-face">${face ? `<img src="${face}" alt="">` : ''}<span>Zenif</span></div><div class="log"><p><i>Zenif: “${E(fill(P.W('zenifAsk'), {name: m.name}))}”</i></p></div></div>`;
    return zen + `<div class="log" data-pd38="training" style="max-width:640px;margin:8px auto;text-align:left"><p><b>${E(P.W('title'))}</b></p><p>${E(fill(P.W('training'), {name: m.name}))}</p>`
      + `<div class="note">${E(m.name)}: ${E(P.W('away'))}</div></div>`;
  };
  { const f = F.gateCard; F.gateCard = function(b, body){
      try { if (b && b.id === 'b9' && P.training()) body = (body || '') + P.trainingHTML(); } catch (e) { console.warn('PD38 card', e); }
      return f.call(this, b, body); }; }
  { const f = F.squad; F.squad = function(){
      try { if (P.training() || P.witchAway()) return META.roster.filter(p => !p.resting && !P.out(p.id)).slice(0, 4).map(p => p.id); } catch (e) { console.warn('PD38 squad', e); }
      const r = f.apply(this, arguments);
      try { const st = F.active() && F.state(), m = st && (st.beat | 0) === idx('b5b') && P.mage();      // GD 22 Nov: the Mage is guaranteed a b5b place (the 4th slot; never Hal or Pinch; only the Hunt)
        if (m && !r.includes(m.id) && r.length >= 4){ let k = r.length - 1; while (k > 0 && F.d2(META.roster.find(p => p.id === r[k]))) k--; if (!F.d2(META.roster.find(p => p.id === r[k]))) r[k] = m.id; } } catch (e) { console.warn('PD38 b5b squad', e); }
      return r; }; }
  if (window.DEF30 && typeof DEF30.pickArchers === 'function'){ const f = DEF30.pickArchers; DEF30.pickArchers = function(){
      const r = f.apply(this, arguments);
      try { if (P.training() || P.witchAway()){
          const out = r.filter(a => !(a && a.p && P.out(a.p.id)));
          if (out.length < r.length && (arguments[1] | 0)){   // the town watch fill the gap, as DEF30 does
            const ms = typeof AUX !== 'undefined' && AUX.militia ? {ranged: AUX.militia.r, con: AUX.militia.con} : {ranged: 1, con: 3};
            while (out.length < r.length) out.push({p: {name: 'Militia', id: null}, s: Object.assign({}, ms), kind: 'militia', i: out.length}); }
          return out; } } catch (e) { console.warn('PD38 wall', e); }
      return r; }; }

  /* the b8 debrief: Magic 2 and Ray of Frost; the Witch offer. The next fight's debrief: the Witch comes back. */
  P.teach = function(p, id){   // into her book and the first spare auto slot
    p.book = Array.isArray(p.book) ? p.book : [];
    if (!p.book.includes(id)) p.book.push(id);
    try { if (window.BOOK33){ const lo = BOOK33.loadout(p); p.slots = {active: lo.active, auto: [id].concat(lo.auto.filter(x => x !== id))}; p.slots = BOOK33.loadout(p); } } catch (e) { console.warn('PD38 slots', e); }
  };
  P.witchOf = () => (META.roster || []).find(p => p && p.spec === 'WITCH' && !p.dead);
  P.back = function(lines){
    const s = S(), m = P.mage(); if (!s || s.trained || !m) return;
    s.trained = true; m.magic = (m.magic | 0) + 1; P.teach(m, 'frost');
    lines.push(`<p class="good" data-pd38="back">${E(fill(P.W('back'), {name: m.name, n: m.magic}))}</p>`);
    const w = P.witchOf();
    if (w && !s.w){ s.w = {id: w.id};
      lines.push(`<div class="log" data-pd38="witch" style="text-align:left"><p><i>Zenif: ${E(P.W('witch'))}</i></p>`
        + `<button class="btn gold" onclick="PD38.witch(true)">${E(P.W('send'))}</button> <button class="btn" onclick="PD38.witch(false)">${E(P.W('keep'))}</button></div>`); }
  };
  P.witch = function(send){
    const s = S(), w = s && s.w && byId(s.w.id); if (!w || s.w.sent != null) return false;
    s.w.sent = !!send; if (typeof saveMeta === 'function') saveMeta();
    try { const el = document.querySelector('[data-pd38="witch"]'); if (el) el.innerHTML = `<p><i>${E(fill(P.W(send ? 'sent' : 'kept'), {name: w.name}))}</i></p>`; } catch (e) {}
    return true;
  };
  P.witchBack = function(lines){
    const s = S(), w = s && s.w && byId(s.w.id); if (!w) return;
    s.w.done = true; w.magic = (w.magic | 0) + 1; P.teach(w, 'briar');
    lines.push(`<p class="good" data-pd38="witchBack">${E(fill(P.W('witchBack'), {name: w.name, n: w.magic}))}</p>`);
  };
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      const away = P.witchAway(), r = f.apply(this, arguments);
      try { if (c && c.f34 && lines && F.active()){
          if (c.f34 === 'b9') P.back(lines);
          else if (away) P.witchBack(lines); } } catch (e) { console.warn('PD38 debrief', e); }
      return r; }; }

  /* ---- self-test: PD38.selfTest() (stubs; META, G and the globals are put back) ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, c, x) => rows.push({n, ok: !!c, x});
    const sv = {M: META, G: typeof G !== 'undefined' ? G : null, slot: F.slotNow, card: F.card, save: saveMeta};
    let shown = '';
    try {
      META = freshMeta(); F.slotNow = SAVE_KEY; saveMeta = () => {}; F.card = (t, b) => { shown = t + b; };
      META.leader = {name: 'Hal', level: 2, ticks: 0, spec: 'SOLDIER', race: 'HUMAN', cls: 'FREEMAN'};
      META.f34 = {beat: idx('b5b'), log: [], lv2: true};
      META.roster = [makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Ana'), makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Bo')];
      F.go();
      const m = P.mage();
      ok('b5b: the Mage joins (Mage, Magic 1, f34caster)', m && m.spec === 'MAGE' && m.magic === 1 && m.f34caster && META.roster.length === 3);
      ok('b5b: the join card with her name and the words', /data-pd38="join"/.test(shown) && shown.includes(E(m.name)) && /hedge-mage, Magic 1|Zenif has his eye on her|joins the squad: a Mage/.test(shown));
      F.go();
      ok('b5b: once only', META.roster.filter(p => p.f34caster).length === 1);
      { const keep = META.roster.slice(), mk = (n, t) => { const p = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', n); if (t) p.f34 = t; return p; };
        META.roster = [mk('Hal', 'hal'), mk('Pinch', 'pinch'), mk('Ana'), mk('Bo'), mk('Cy'), m];
        const sq = F.squad(); ok('b5b: the Mage has a place even behind four mates; Hal and Pinch stay; four march', sq.includes(m.id) && sq.includes(META.roster[0].id) && sq.includes(META.roster[1].id) && sq.length === 4);
        META.f34.beat = idx('b6'); ok('after b5b the order is as before', !F.squad().includes(m.id)); META.f34.beat = idx('b5b'); META.roster = keep; }
      ok('no Night 5 join, no Night 9 gift', !F.roadMage && !(window.D45 && D45.gift));
      META.f34.beat = idx('b6');
      ok('b6: she is in the squad (no training yet)', !P.training() && F.squad().includes(m.id));
      META.f34.beat = idx('b9');
      ok('b9: training, out of the squad', P.training() && !F.squad().includes(m.id) && F.squad().length === 2);
      F.gateCard(F.BEATS[idx('b9')], '');
      ok('b9: the Training card on the gate card', /data-pd38="training"/.test(shown) && /east wall/.test(shown) && /Training with Zenif/.test(shown));
      ok('b9: Zenif speaks in his own box (portrait, name, only his words)', /data-pd38="zenif"/.test(shown) && /f34-face/.test(shown) && /Zenif: “Give me /.test(shown) && !/Training with Zenif[^]*Zenif: “[^]*goes up on the wall/.test(shown));
      if (window.DEF30){ G = {squad: [], contract: {f34: 'b9'}}; const ar = DEF30.pickArchers(12, 12);
        ok('b9: off the wall, the watch fill her place', !ar.some(a => a.p === m) && ar.length === 12); }
      const ln = []; contractDebrief({f34: 'b9', obj: 'defence'}, 'victory', ln);
      const lo = window.BOOK33 ? BOOK33.loadout(m) : {auto: []};
      ok('b9 debrief: Magic 2, Ray of Frost in her book and auto slot', m.magic === 2 && m.book.includes('frost') && lo.auto.includes('frost') && (!window.BOOK33 || BOOK33.spare(m) === 1));
      ok('b9 debrief: the back line; no Witch, no offer', ln.some(x => /Magic 2/.test(x) && /Ray of Frost/.test(x)) && !ln.some(x => /data-pd38="witch"/.test(x)));
      ok('after b9: back in the squad', !P.training() && F.squad().includes(m.id));
      contractDebrief({f34: 'b9', obj: 'defence'}, 'victory', []); ok('b9 debrief: once only', m.magic === 2);
      // the Witch offer
      META.f34 = {beat: idx('b9'), log: [], pd38: {id: m.id, t: 'x', room: true}}; m.magic = 1;
      const w = makeMate('HUMAN', 'OUTCAST', 'WITCH', 'Wenna'); w.magic = 1; META.roster.push(w);
      const l2 = []; contractDebrief({f34: 'b9', obj: 'defence'}, 'fled', l2);
      ok('Witch in Varnholt: the offer with SEND HER and KEEP HER', l2.some(x => /data-pd38="witch"/.test(x) && /SEND HER/.test(x) && /KEEP HER/.test(x)));
      P.witch(true); META.f34.beat = idx('b6');
      ok('sent: she misses the next fight', P.witchAway() && !F.squad().includes(w.id) && P.witch(false) === false);
      const l3 = []; contractDebrief({f34: 'b6', f34lead: true, obj: 'hunt'}, 'victory', l3);
      ok('back: +1 Magic and Briar Thicket', w.magic === 2 && w.book.includes('briar') && l3.some(x => /Briar Thicket/.test(x)) && !P.witchAway() && F.squad().includes(w.id));
      // a full roster: no Mage, no training
      META.f34 = {beat: idx('b5b'), log: [], lv2: true}; META.roster = META.roster.filter(p => !p.f34caster); while (META.roster.length < rosterCap()) META.roster.push(makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Cy'));
      F.go();
      META.f34.beat = idx('b9');
      ok('full roster: the no-room line, no Mage, no training', /no room/.test(shown) && !META.roster.some(p => p.f34caster) && !P.training());
    } catch (e) { ok('no throw: ' + e.message, false, String(e.stack).slice(0, 300)); }
    finally { META = sv.M; G = sv.G; F.slotNow = sv.slot; F.card = sv.card; saveMeta = sv.save; }
    const pass = rows.filter(r => r.ok).length;
    return {pass, total: rows.length, rows: rows.filter(r => !r.ok)};
  };
})();
