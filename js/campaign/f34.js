/* ============================================================================
   F34: F-34, the Founding as a teaching campaign (Lead Programmer).
   The Founding is the start (Patrick 2026-11-14; its on switch and ?f34=0 were removed in INT-1, 2026-11-15).
   Step 1 (this file so far): the beat runner, its own save slot, META.f34 state,
   `teach` contract dials [T] (contract overrides only, never board numbers),
   the title-screen entry, and skip = the normal guided New Chapter start.
   Beats and numbers: audits/campaign-teach.md (beat table). Words: js/lines/campaign.js.
   Later steps fill in the beats marked step > F34.BUILT (they show a placeholder card).
   Step 1b: the Sun Elf Exiles faction (key 'sunelves', Systems Scope (2) in campaign-teach.md), added to the
   faction tables in a Founding save; names from CAMPAIGN_LINES.sunElves. Allied perk Sunlit Rally [G]; Hostile:
   Sun and Grey Elves leave the hire line (patron jobs already stop at -2 in makeContract; Parley in step 5).
   Step 2: beats 1-3. Cayde is the Leader for b1-b2 (F.cast); b2's two cages free Hal and Pinch (CAMPAIGN_LINES.hal/pinch)
   straight into the squad (updateContract wrapper, F.release); b3 opens the real Leader screen (F.buildLeader), then
   Cayde moves to the chair (META.master, hero 'cayde') and the new Leader marches with Hal and Pinch.
   Step 3: beats 4-7. b4 Varnholt issues the charter kit (F.issueKit: Brigandine and Heavy Shields onto the Leader's squad, the
   purse 850 -> 650 [T]) and can open the real camp (F.visit, a BACK TO THE FOUNDING button); b5 the Escort (pay 300); b6 Leads,
   round 1 (F.leadContract: free the captives = Rescue, Sun Elf Standing through the real rescue rule; raid the camp = Hunt,
   -1 Sun Elf Standing and one fixed spoils card [S], F.SPOILS); b7 the level card (the real debrief gives the XP ticks) and one
   free drill (F.freeDrill: 0 gp, no sit-out [T], once).
   Step 4: beats 8-10, the three gate defences (F.gateContract: the real makeRaidContract against the Hollow, T1/T2/T3,
   2/3/4 min, on DEF30's gate map through c.force30, two gate towers, F.WALL = 12 of the town watch on the wall [S]).
   Hold until one is lost (loseTo: a loss or a breached gate goes straight to the Keep); b9 runs Leads round 2 first (same two
   offers, pay 300); b10's gate gives way at 80% of the clock (c.script30.breachAt, defence30), and losing the Keep moves
   on (loseOk). Militia knocked off the wall are lost to the next defence [S] (F.gateDebrief). A held gate: +1 with the
   Exiles through DEF30.heldGate (c.patron30) [S].
   Step 5: beat 11, the Long Road, on the real story road (META.cp in this slot, the Full Chronicle's 12 nights,
   CARAVAN30 folk and Parley, LR34 bands). F.startRoad opens the existing retreat screen (Varnholt fell: column 16,
   Supply 8, fit three wagon slots). The road reads "Day N of 21": the 7 nights spread over 21 days (F.roadDay);
   the days between are quiet (a day-counter skip and one line; no Work Orders, Director 2026-11-14). Night 2: the first
   Parley is a sure success [T]. Night 3: Strategos Sigrún (sigrun34, Captain Vane's numbers [S]) leads, and raises the
   real white flag when hurt. Night 5: a hedge-mage joins, a Mage at Magic 1. Kalloon: the story's ending and founding;
   when the Chapter is founded the beat is done. Exiles Hostile: the Parley brings no offers (step 1b's rule).
   Not built: sending the band alone (no road contracts to send it on).
   Step 6: tips and Field Notes. CAMPAIGN_LINES.tips joins the game's own TIPS (a key the game has keeps its text), so
   tip(id) and META.tipsSeen serve the Founding and a New Chapter alike. Card tips ("Tip:" on beat cards and the road
   letters) follow Settings > Tips and count as seen; fight tips use the real tip() (once ever, the ux.js queue),
   fired at fight start (startDeployment), on DEF30.onEvent (start, ladder, ram, breach: as note lines, since
   DEF30 keeps the tip box off the gate), on road nights and at the
   white flag. Field Notes: a third tab in the Scribe's book (CHRONICLE25.pages) lists every tip seen, in order.
   Not wired (nothing to hang them on yet): officerPromote, detachment, prisoner, ally, book, and the keys the game's
   own TIPS already teach (firstMove, levelUp in fights, trap, luck). Off: Settings, Tips.
   Self-test: F34.selfTest()
   ============================================================================ */
(function(){
  'use strict';
  const F = window.F34 = {};
  F.DEFAULT = true;
  F.BUILT = 6;
  F.SLOT = 'dust_cloaks_found34';           // its own save slot, like the prologue's
  F.home = null;                             // the slot to go back to
  const LINES = () => window.CAMPAIGN_LINES || {};
  F.families = () => { const C = typeof META !== 'undefined' && META && META.cp; return C && C.siegeWon ? 20 : 16; };   // P23-VOICE F18 (GD rulings 2): 20 families, 16 after a lost siege (F34 always loses Varnholt, F.startRoad)
  const cap = id => { const s = ((LINES().captions || {})[id]) || ''; return typeof s === 'string' ? s.replace(/\{families\}/g, F.families()) : s; };

  /* kind: fight (a real contract), camp, leads, level, road. step: the build step that wires it.
     teach [T]: cages, camps, enemyCap, traps (counts kept), noAmbient (no ambient respawn).
     loseOk: losing still moves the story on (beat 10). loseTo: a loss (or a breached gate) jumps to that beat.
     leads: a beat that runs a Leads round (at that pay) before its fight (unused since G2).
     G2 (GD 22 Nov): the rhythm is C, D, C, D, C, D: b1-b5 (C1 Escort), b8 (D1 Hold the gate), b5b (C2 the Hunt), b9 (D2 the second
     assault), b6 (C3 Leads), b7 (Level 2 and the free drill), b10 (D3 the Keep), b11 (the Long Road). The ids keep their old names. A lost
     defence never skips a contract: the story moves on, and the next contract (b5b or b6) is rushed and pays half (F.RUSH, on by default). */
  F.BEATS = [
    {id:'b1',  name:'Cold open',            kind:'fight', step:2, obj:'hunt',    tier:1, solo:true, teach:{camps:0, enemyCap:5, noAmbient:true, traps:0}},
    {id:'b2',  name:'Free two prisoners',   kind:'fight', step:2, obj:'rescue',  tier:1, solo:true, teach:{cages:2, enemyCap:9, noAmbient:true, traps:1}},
    {id:'b3',  name:'Small camp',           kind:'fight', step:2, obj:'hunt',    tier:1, teach:{camps:1, enemyCap:8, noAmbient:true}, pay:0},
    {id:'b4',  name:'Varnholt',             kind:'camp',  step:3},
    {id:'b5',  name:'First job',            kind:'fight', step:3, obj:'escort',  tier:1, teach:{}, pay:300},
    {id:'b8',  name:'Hold the gate',        kind:'fight', step:4, obj:'defence', tier:1, teach:{}, loseOk:true},
    {id:'b5b', name:'The Hunt',             kind:'fight', step:3, obj:'hunt',    tier:1, teach:{}, pay:300, host:'deserters'},
    {id:'b9',  name:'The second assault',   kind:'fight', step:4, obj:'defence', tier:2, teach:{}, loseOk:true},
    {id:'b6',  name:'Leads',                kind:'leads', step:3},
    {id:'b7',  name:'Three jobs done',      kind:'level', step:3},
    {id:'b10', name:'The Keep',             kind:'fight', step:4, obj:'defence', tier:3, teach:{breachAt:0.8}, loseOk:true},
    {id:'b11', name:'The Long Road',        kind:'road',  step:5}
  ];
  F.beat = i => F.BEATS[i];
  /* G2 (Producer, Q100 not yet ruled): after a lost defence the next contract is rushed (half a day to prepare) and pays half.
     F34.RUSH = false turns it off. */
  F.RUSH = true;
  F.rushed = b => { const st = F.state(); return !!(F.RUSH && st && st.rush && b && (b.id === 'b5b' || b.id === 'b6')); };
  F.rushPay = (b, pay) => F.rushed(b) ? Math.round((pay | 0) / 2) : pay;
  F.TXT_RUSH = 'The gate fell, so you had only half a day to prepare. This job pays half.';
  // Act III items 6, 10 (Planner 48d0354): b7 after a lost lead or a death, b10 after the gate is lost
  F.actTwoHurt = function(){ const st = F.state() || {};
    return (st.log || []).some(x => x.id === 'b6' && x.r !== 'victory') || (META.memorial || []).some(g => !g.leader); };
  F.hasText = v => Array.isArray(v) ? v.some(x => x && String(x).trim()) : !!(v && String(v).trim());   // gate 2 L4: [] and [""] hold no words
  F.capKey = function(b){
    const C = LINES().captions || {}, CY = LINES().cayde || {}, T = F.hasText;   // gate FAIL H2: P23-VOICE moved these into cayde.*
    if (b.id === 'b7' && (T(C.b7lost) || T(CY.b7lost)) && F.actTwoHurt()) return 'b7lost';
    if (b.id === 'b10' && (T(C.b10keep) || T(CY.b10keep)) && F.gateLost()) return 'b10keep';
    return b.id;
  };
  F.caydeLine = function(b){
    const k = F.capKey(b), CY = LINES().cayde || {};
    if (b.id === 'b7' && Array.isArray(CY[k]) && !advLeft()){ const f = CY[k].find(x => x && String(x).trim()); return f ? String(f).replace(/\{families\}/g, F.families()) : ''; }   // item 5: "Spend those Advancements" only when some are owed
    const st = F.state();   // P23-VOICE F13a (ND): every later visit to the Varnholt card gets cayde.b4again
    if (b.id === 'b4' && F.hasText(CY.b4again) && st && (st.seen || []).includes('b4')) return say('cayde', 'b4again');
    return say('cayde', F.hasText(CY[k]) ? k : b.id);
  };
  F.state = () => (typeof META !== "undefined" && META && META.f34) || null;
  // QA (K45 S57): once b11 is logged done the Founding is over; the founded Chapter plays by the main rules (Tithe, raids, Standing)
  F.over = () => { const st = F.state(); return !!(st && (st.beat | 0) >= F.BEATS.length); };
  F.active = () => !!(F.state() && SAVE_KEY === F.slotNow && !F.over());
  F.inSlot = () => !!(F.state() && SAVE_KEY === F.slotNow);   // Neon R6 H1: the Founding's save is open, finished or not (the Menu keeps LEAVE and NEW CHAPTER on the finished card)
  F.slotNow = null;

  /* The pure step rule: a win or a fighting withdrawal moves on; a loss replays the beat
     unless the beat says losing is part of the story. Non-fight beats always move on. */
  F.step = function(st, result){
    const b = F.BEATS[st.beat]; if (!b) return st;
    st.log = st.log || []; st.log.push({id:b.id, r:result || 'done'});
    const gate = b.obj === 'defence' && b.id !== 'b10', adv0 = st.beat;
    const won = b.loseTo ? (!result || result === 'victory' || result === 'stub')
                         : (!result || result === 'victory' || result === 'withdrawn' || result === 'done' || result === 'stub');
    if (won || b.loseOk || b.kind !== 'fight') st.beat++;
    else if (b.loseTo){ const i = F.BEATS.findIndex(x => x.id === b.loseTo); st.beat = i > st.beat ? i : st.beat + 1; }   // hold until you lose one
    else st.tries = (st.tries || 0) + 1;
    if (gate && result !== 'victory' && result !== 'stub') st.rush = true;                 // G2: a lost defence rushes the next contract
    else if (!gate && st.beat !== adv0 && (b.id === 'b5b' || b.id === 'b6')) st.rush = false;
    return st;
  };

  /* A beat's contract: the real makeContract, then the [T] dials on c.teach. */
  F.contract = function(b){
    if (b.obj === 'defence') return F.gateContract(b);
    /* R4 (checklist R, stage 4): a retry rolled a new job (host, place, patron) unlike the War Table card. The first roll for a
       beat is kept in the Founding's state and every later call returns a fresh copy of it. */
    const st = F.state(), jobs = st && (st.jobs = st.jobs || {});
    const rush = c => { if (F.rushed(b)){ c.pay = F.rushPay(b, c.pay); c.rushed = true; } return c; };   // G2: not cached, so a retried job after a held gate pays in full
    if (jobs && jobs[b.id]) try { return rush(JSON.parse(JSON.stringify(jobs[b.id]))); } catch (e) {}
    const c = makeContract(b.obj, b.tier);
    c.teach = Object.assign({}, b.teach || {}); c.f34 = b.id;
    if (b.pay !== undefined) c.pay = b.pay;
    if (b.host && typeof HOSTS !== 'undefined' && HOSTS[b.host]) c.host = b.host;
    /* ND (22 Nov): b5 and b5b are pinned jobs, Lessons on or off: place, host, cargo, direction, patron and brief from the lines. The Reeve is no faction, so no Standing moves. */
    const pin = ((window.CAMPAIGN_LINES && CAMPAIGN_LINES.jobs) || {})[b.id];
    if (pin){
      if (pin.place) c.place = pin.place;
      if (pin.host && typeof HOSTS !== 'undefined' && HOSTS[pin.host]) c.host = pin.host;
      if (pin.cargo && c.obj === 'escort') c.cargo = pin.cargo;
      if (pin.dir && c.obj === 'escort') c.dir = pin.dir;
      if (pin.patron){ c.patron = pin.patron; c.faction = null; }
      if (pin.brief) c.brief = pin.brief;
      c.title = pin.title || (b.id === 'b5b' && window.B45 && B45.TXT.job2) || b.name;
    }
    if (jobs) try { jobs[b.id] = JSON.parse(JSON.stringify(c)); } catch (e) {}
    return rush(c);
  };

  /* ---- teach dials ------------------------------------------------------- */
  const T = () => (G && G.contract && G.contract.teach) || null;
  const _gen = generateMap;
  generateMap = function(contract){
    const M = _gen.apply(this, arguments), t = contract && contract.teach;
    if (t){
      if (t.cages !== undefined && M.cages) M.cages = M.cages.slice(0, t.cages);
      if (t.camps !== undefined && M.camps) M.camps = M.camps.slice(0, t.camps);
    }
    return M;
  };
  const _spawn = spawn;
  spawn = function(){ const t = T(); if (t && t.noAmbient) return; return _spawn.apply(this, arguments); };
  F.applyTeach = function(){
    const t = T(); if (!t || !G) return;
    if (t.enemyCap !== undefined && G.enemies){
      const boss = e => BESTIARY[e.k] && BESTIARY[e.k].boss;
      let keep = Math.max(0, t.enemyCap - G.enemies.filter(boss).length);
      G.enemies = G.enemies.filter(e => boss(e) || keep-- > 0);
    }
    if (t.traps !== undefined && G.traps) G.traps = G.traps.filter(x => !x.enemy).concat(G.traps.filter(x => x.enemy).slice(0, t.traps));
    // t.breachAt goes onto the contract as c.script30 (F.gateContract); defence30 reads it in setupRaid
  };
  const _start = startDeployment;
  startDeployment = function(contract){
    const r = _start.apply(this, arguments);
    if (contract && contract.teach) F.applyTeach();
    if (typeof G !== 'undefined' && G){ G.sunRally = F.sunAllied(); G.sunRallyUsed = false; }   // step 1b, Sunlit Rally [G]
    return r;
  };

  // Act III item 5 (Planner 48d0354): never owe more Advancements than mates who can take one; no "(Section 4.6)"
  F.advCan = () => META.roster.filter(p => (p.adv | 0) < advCap()).length;
  F.advOwed = () => { const R = META.advRound; return !!(R && R.left > 0 && META.roster.some(p => !(R.given || []).includes(p.id) && advChoices(p).some(o => o.ok))); };
  /* P23-BUG-5 (GD ruling, gd-p23-rulings.md 1): the ones no mate can take now are kept (R.held), not dropped; they join the next round as carried */
  { const f = grantAdvancements; grantAdvancements = function(lines){
      try { const R0 = META.advRound; if (R0 && R0.held > 0){ R0.left = (R0.left | 0) + R0.held; R0.held = 0; } } catch (e) {}
      const n0 = lines ? lines.length : 0, r = f.apply(this, arguments);
      try { if (F.active() && META.advRound){ const R = META.advRound, can = F.advCan(); if (R.left > can){ R.held = (R.held | 0) + R.left - can; R.left = can; }
          if (lines && lines.length > n0) lines[n0] = R.left ? `<p class="good">The company learns from the contract: <b>give 1 Advancement to each of ${R.left > 1 ? R.left + ' different Squad Mates' : 'one Squad Mate'}</b>. Squad Mates may hold up to ${advCap()}.</p>` : ''; } }
      catch (e){ console.warn('F34 advancements', e); }
      return r; }; }
  // the Founding's report: RETURN TO CAMP waits for the Advancements that can be given (item 5); section references go (item 14)
  { const f = renderDebrief; renderDebrief = function(head, lines){
      if (F.active() && Array.isArray(lines)) arguments[1] = lines.map(x => String(x).replace(/ \((?:Sections?|Tables?) [^)]*\)/g, ''));
      const r = f.apply(this, arguments);
      try { if (F.active() && META.leader && F.advOwed()){ const el = $('debrief-inner'), btn = el && [...el.querySelectorAll('button')].find(x => /RETURN TO CAMP/.test(x.textContent));
          if (btn) btn.outerHTML = '<div class="note">Give the Advancements first.</div>'; } } catch (e){}
      return r; }; }
  // Act III item 17 [S]: the date holds still in the Founding: Spring in Act I, Summer at Varnholt (b4-b10), Autumn on the road
  { const f = seasonName; seasonName = function(){ const st = F.active() && F.state(); if (!st) return f.apply(this, arguments);
      return F.seasonOf(st.beat | 0) + ', Year 616'; }; }
  /* by beat id, not index (G2 put b5b into F.BEATS and moved b10 to index 10): Spring before b4, Summer b4 to b10, Autumn from b11 */
  F.seasonOf = i => { const at = id => F.BEATS.findIndex(x => x.id === id); return i < at('b4') ? 'Spring' : i <= at('b10') ? 'Summer' : 'Autumn'; };

  /* ---- the runner ---------------------------------------------------------- */
  const _leave = leaveDebrief;
  leaveDebrief = function(){
    const c = G && G.contract;
    if (c && c.f34 && F.active()){
      let r = G.result; const st = F.state(), b = st && F.BEATS[st.beat];
      if (c.f34gate && G.def30 && G.def30.breach && r === 'victory') r = 'breached';   // cleared the town, but the gate fell
      G = null;
      if (c.f34lead && b && b.kind === 'fight'){ st.leads = b.id; saveMeta(); return F.go(); }   // b9: the lead first, then the defence
      F.next(r); return; }
    return _leave.apply(this, arguments);
  };
  F.exists = function(){ try { const d = JSON.parse(localStorage.getItem(F.SLOT) || 'null'); return !!(d && d.f34); } catch (e){ return false; } };
  F.finishedSlot = function(){ try { const d = JSON.parse(localStorage.getItem(F.SLOT) || 'null'); return !!(d && d.f34 && (d.f34.beat | 0) >= F.BEATS.length); } catch (e){ return false; } };   // S6 1f: read off the slot, as F.exists does (the title has another save loaded)
  F.start = function(o){
    o = o || {};
    F.home = o.home || SAVE_KEY;
    const slot = o.slot || F.SLOT;
    const keepSet = META && META.settings;   // the player's title-screen settings (Lessons, volume, speed, text size) go with them into the fresh Founding save
    if (slot !== SAVE_KEY) switchSlot(slot);
    F.slotNow = slot;
    if (!META.f34){ if (!o.keep){ META = freshMeta(); if (keepSet) META.settings = JSON.parse(JSON.stringify(keepSet)); } META.f34 = {beat:0, log:[], at:Date.now()}; saveMeta(); }
    F.go();
  };
  F.next = function(result){
    if (META.memorial) META.memorial = META.memorial.filter(g => !(g.leader && g.name === 'Cayde'));   // Cayde does not die in the cold open
    F.step(META.f34, result); saveMeta(); F.go();
  };
  F.leave = function(){
    { const bt = document.getElementById('f34-back'); if (bt) bt.remove(); }
    if (F.home && F.home !== SAVE_KEY) switchSlot(F.home);
    F.slotNow = null; showSplash();
  };
  F.skip = function(){
    { const bt = document.getElementById('f34-back'); if (bt) bt.remove(); }   // Neon R6 M6: New Chapter from the Menu during F34.visit
    if (F.home && F.home !== SAVE_KEY) switchSlot(F.home);
    F.slotNow = null; GUIDE = null;
    if (META.leader) return showSplash();
    openFound();                              // the guided New Chapter start
  };
  /* K52 (F-48 UX): SKIP sat one tap under MARCH and asked nothing. Now it stands apart, bottom right, and asks first.
     F34.K52 = false: the old row. Words [N]. */
  F.K52 = true;
  F.TXT52 = {title: 'Skip the Founding?', body: 'You leave Cayde’s company here and found a Chapter of your own. The Founding keeps its save: CONTINUE THE FOUNDING on the title brings you back.', ok: 'SKIP IT', cancel: 'STAY'};
  // UX b33fc7d: STAY is the gold default. The ux.js danger mode makes ENTER and ESC stay and focuses STAY; the yes button is the red one.
  // One asker for every choice here that gives something up (SKIP, START AGAIN): txt = {title, body, ok, cancel}.
  F.askDanger = function(txt, yes){
    if (typeof askConfirm !== 'function') return yes();
    askConfirm(txt.title, txt.body, yes, {ok: txt.ok, cancel: txt.cancel, danger: true});
    try { const box = document.getElementById('askbox'), bs = box ? box.querySelectorAll('button') : [];
      if (bs[1]) bs[1].classList.add('gold'); if (bs[0]) bs[0].classList.remove('gold'); } catch (e) {}
  };
  F.askSkip = function(){ F.askDanger(F.TXT52, () => F.skip()); };
  /* S6 1i E (audits/specs/s6-1-layout.md): story cards and the lock card. A text-only card (and the Varnholt hub) is 640 px wide at
     1280 and 760 at 1920; the speaker's portrait (96 / 128 px) sits left of the text with the name under it; one button row, the
     quiet LEAVE and SKIP from the left, the gold primary at the right. The marker <i class="f34-sc"> scopes the styles: #create-inner
     is shared with the creator. Nothing else is wrapped, so '#create-inner > .note' still finds the notes. ROLLBACK: L1I = false. */
  F.NARROW = () => true;   // UX 1i-03: every story card takes the card width, the ones with choices too
  F.css1i = function(){ if (document.getElementById('f34-1i')) return; const st = document.createElement('style'); st.id = 'f34-1i';
    const v = (a, b) => `clamp(${a}px,calc(${a}px + (100vw - 1280px)*${(b - a) / 640}),${b}px)`;
    st.textContent = `.sheet:has(#create-inner > .f34-sc.n){max-width:${v(640, 760)};padding:${v(16, 24)}}`
      + `#create-inner:has(> .f34-sc) > .note{text-align:left;align-self:stretch}`
      + `.f34-sp{display:flex;gap:${v(16, 24)};align-items:flex-start;text-align:left;width:100%;box-sizing:border-box;margin:8px 0}`
      + `.f34-face{flex:none;width:${v(96, 128)};text-align:center}.f34-face img{display:block;width:100%;aspect-ratio:1;object-fit:cover;object-position:top;border:2px solid #3a2a1a;box-sizing:border-box}`
      + `.f34-face span{display:block;margin-top:4px;font-variant:small-caps;font-size:${v(14, 14)}}`
      + `#create-inner .note.bad{color:#8b0000;font-weight:700}`   // QA G2: the rushed line is red on the card, Lessons on or off
      + `.f34-ch{font-weight:700;margin:${v(12,16)} 0 ${v(6,8)}}`   // UX B7-2: 12/16 between choice groups, 6/8 from a heading to its own buttons
      + `.f34-plain{border:0!important;background:none!important;box-shadow:none!important;padding:0!important;margin:0!important;max-width:none!important;align-self:stretch;text-align:left}`
      + `[data-pd38="join"]{max-width:none!important;margin:0!important}[data-pd38="join"] .log{border:0!important;background:none!important;box-shadow:none!important;padding:0!important;margin:0!important}[data-pd38="join"] .log img{width:${v(40, 48)}!important;height:${v(46, 55)}!important}`
      + `#create-inner:has(> .f34-sc.n) .log{font-size:${v(15, 17)};margin-left:0!important;margin-right:0!important;max-width:none!important;align-self:stretch}.f34-sp .log{flex:1;margin:0!important}`
      + `.f34-row{display:flex;flex-wrap:wrap;align-items:stretch;gap:16px;margin-top:16px;width:100%;box-sizing:border-box}.f34-pri{margin-left:auto;display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:stretch;gap:16px}.f34-pri > .gold{order:9}`   /* the primary (or the first of several) is pushed to the right inner edge; when the row is too narrow it wraps to a second line, still at the right */
      + `.f34-row:not(:has(.gold)) .btn{height:${v(32, 40)};min-height:0;box-sizing:border-box;padding-top:0;padding-bottom:0}`
      + `.f34-row .btn{margin:0;text-transform:uppercase;font-size:${v(14, 16)}}.f34-row .btn.gold{font-size:${v(18, 20)};padding-left:16px;padding-right:16px;white-space:nowrap}`
      /* UX 1i-03, 1i-04, 1i-08, 1i-02: one left edge for every block; no second face in the line box; the hub's four places in a 2 x 2 grid of equal buttons; the slot a lesson card sits in */
      + `#create-inner:has(> .f34-sc) > div:not(.f34-row):not(.f34-sp){text-align:left;align-self:stretch;margin-left:0!important;margin-right:0!important;max-width:none!important;box-sizing:border-box}`
      + `.f34-sp img.cf-face{display:none}#create-inner:has(> .f34-sc) #b45-hub{display:grid;grid-template-columns:1fr 1fr;gap:16px}#create-inner:has(> .f34-sc) #b45-hub .btn{min-width:0!important;margin:0!important}`
      + `#t45-slot{align-self:stretch;flex:none;margin-top:16px;scroll-margin-bottom:96px}`
      /* UX 1i-09: a tall card is capped at the screen; its body scrolls inside it and the button row stays in view at the card's bottom. The card keeps its top (66 px, under the top bar). */
      + `#screen-create:has(#create-inner > .f34-sc){padding-bottom:${v(32, 48)};overflow:hidden}`
      + `.sheet:has(#create-inner > .f34-sc){display:flex;flex-direction:column;max-height:calc(100vh - 66px - ${v(32, 48)})}`
      + `#create-inner:has(> .f34-sc){flex:1 1 auto;min-height:0;overflow-y:auto;justify-content:flex-start}#create-inner:has(> .f34-sc) > *{flex:none}`
      + `#create-inner:has(> .f34-sc) > .f34-row{position:sticky;bottom:0;z-index:3;margin-top:0;padding-top:16px;background:var(--parch,#d8c9a8);background-size:256px}`
      /* UX bug (QA f3f832e8): at 1280 a lesson card makes the story card scroll and the heading went off the top; it is pinned at the top as the row is at the bottom. margin:0 + padding 6/8 keeps the unscrolled layout to the pixel */
      + `#create-inner:has(> .f34-sc) > h1{position:sticky;top:0;z-index:3;align-self:stretch;width:auto!important;display:block;text-align:center;margin:0!important;padding:6px 0 8px;background:var(--parch,#d8c9a8);background-size:256px;box-shadow:0 6px 6px -6px rgba(40,25,10,.45)}`
      /* UX 2f N1 / 2g F5: while a Founding card or the Campfire is up the camp's places (War Table, Build, Armoury, Barracks, Chronicle) are hidden; Menu and the figures stay */
      + `body:has(#screen-create:not(.hidden) .f34-sc) #topbar .c31-word{display:none}`
      + `.f34-dr{display:grid;grid-template-columns:1fr 1fr;gap:16px}.f34-dr .btn{margin:0!important;min-width:0!important}`
      + `#create-inner:has(> .f34-sc) .log > .note{margin-top:12px}`
      /* U-slice 6: zone labels, the Gained box, the Tips rule and rows. One left edge, one right edge; gaps 12/16 between zones, 8/12 between speaker boxes */
      + `.f34-sp{margin:0 0 ${v(8, 12)}!important}.f34-zl{align-self:stretch;margin:${v(12, 16)} 0 4px;font-variant:small-caps;font-weight:bold;font-size:${v(14, 15)};color:#6b4a20;letter-spacing:.04em}`
      + `.f34-gain{margin:0!important}.f34-gain p{margin:0 0 6px}.f34-gain p:last-child{margin-bottom:0}.f34-gain > div:not(:first-child){margin-top:8px}`
      + `.f34-rule{align-self:stretch;height:1px;background:#b9a06a;margin:${v(12, 16)} 0 0}.f34-rule + .f34-zl{margin-top:6px}`
      + `.f34-tip{align-self:stretch;display:flex;gap:8px;align-items:flex-start;font-size:${v(14, 15)};color:#4a3418;line-height:1.35;margin:0 0 6px}.f34-tg{flex:none;margin-top:1px;width:${v(16, 18)};height:${v(16, 18)}}`
      /* P23-CARD §2, §3: the Scene line (no box, the face's left edge; not italic: Patrick 13 Nov, no italics in game text, voice.js); GOT IT on the right edge under the box; a person's paragraphs 6 px apart */
      + `#create-inner .f34-scene{align-self:stretch;font-size:${v(15, 16)};color:#4a3418;line-height:1.35;margin:0 0 ${v(8, 12)}!important;padding:0;border:0;background:none}`
      + `#create-inner .f34-gotrow{display:flex;justify-content:flex-end;margin:0 0 ${v(8, 12)}!important}.f34-gotrow .btn{margin:0;text-transform:uppercase}`
      + `.f34-sp .log p{margin:0 0 6px}.f34-sp .log p:last-child{margin-bottom:0}`
      + `#f34-menu1{position:fixed;left:6px;top:6px;z-index:60;font-family:inherit;font-size:14px;cursor:pointer;border:1px solid #8a6d3a;background:#3a2a1a;color:#efe3c8;border-radius:4px;padding:3px 12px;line-height:1.15;min-height:36px}#f34-menu1:hover{background:#55401f}`
      + `body:not(:has(#screen-create:not(.hidden) .f34-sc)) #f34-menu1,body:has(#topbar:not(.hidden) #c31-menubtn) #f34-menu1{display:none}`;   /* §4: the lone Menu goes with the card, and when the top bar shows its own */   /* UX 1i-10: the lesson's ring round this line (6 px out) stays clear of the paragraph above */
    document.head.appendChild(st); };
  // UX 1i-01: the quiet labels are short so the row fits on one line; the full sense is in the hover text and in SKIP's own question. Words [N].
  F.TXT1I = {leave: 'LEAVE', leaveTip: 'Leave the Founding. Your progress is kept.', skip: 'NEW CHAPTER', skipTip: 'Skip the Founding and start a new Chapter. It asks first.'};
  F.faceOf = function(n){ try { if (n === 'Cayde') return heroPortraitURL('cayde'); if (n === 'Zenif') return (window.HERO_PORT && HERO_PORT.zenif) || heroPortraitURL('zenif') || '';
    const p = ((META && META.roster) || []).find(x => x && (x.name === n || String(x.name).split(' ')[0] === n)); if (p && typeof portraitURL === 'function') return portraitURL(p, false) || ''; } catch (e) {} return ''; };
  /* U-slice 6 (audits/specs/u-slice-22nov.md): every Founding card has the same zones in the same order: Title, Speakers (one box each),
     Now (situation), Gained (one box), Choices, Tips (at most 2, a glyph row, no "Tip:" word), then the button row. Builders tag a block
     with data-z="sit|gain|choice|tip|narr|title"; a few are told by their look. A block with no tag and no look goes to Now and is counted
     in F.zoneLoose, so a later wrapper cannot slip a loose line in unseen. Words [N]: the labels are stand-ins. */
  F.TXT6 = {now: 'Now', gained: 'Gained', tips: 'Tips'};
  F.ZRANK = {narr: 1, spk: 2, sit: 3, gain: 4, choice: 5, tip: 6};   // P23-CARD §2: narr is the Scene line, zone 1b (with CARD23 off, narr never reaches the sorter)
  F.TXT23 = {gotIt: 'GOT IT', menuLeave: 'Leave the Founding', menuSkip: 'New Chapter', menu: 'Menu ▾'};   // P23-CARD words (ND may change; the Menu items are the ND's [N])
  /* P23-CARD §1 (audits/specs/story-card-one-layout.md): a face, and beside it only that person's own words. One box per person per
     card (a person who speaks again adds a paragraph to their own box); no "Name:" prefix and no quote marks; a line in the story box
     that is not a face's speech leaves it: before the first speaker it is the Scene line (zone 1b), after it a Now line. A quote
     from someone with no portrait is not a box: it goes to the Scene line as written. A card whose story box has no speaker at all
     keeps it as it is. Kill switch: CARD23 = false (U-slice 6 as it was). */
  F.unquote = function(q){ q.innerHTML = q.innerHTML.replace(/^\s*[A-Z][^:<“]{1,24}: “/, '').replace(/”\s*$/, ''); };
  F.speak23 = function(h, body, SP, mk){
    const boxes = new Map(), ref = () => h.querySelector(':scope > #t45-slot') || h.querySelector(':scope > .f34-row'); let lastW = null; const who = p => { const q = p.querySelector(':scope > i'), m = q && SP.exec(q.textContent), f = m && F.faceOf(m[1]); return {q, m, f}; };
    const out = (html, z) => { const d = document.createElement('div'); d.className = 'note'; d.dataset.z = z; d.innerHTML = html; h.insertBefore(d, ref()); };
    const say = (name, face, p, q) => { q.dataset.cf = '1'; F.unquote(q);
      if (boxes.has(name)){ boxes.get(name).appendChild(p); return; }
      let lg; if (!boxes.size && body && p.parentNode === body){ lg = body; } else { lg = document.createElement('div'); lg.className = 'log'; lg.appendChild(p); }
      const w = mk(name, face, document.createElement('div')); w.removeChild(w.lastChild);
      if (lastW) lastW.after(w); else h.insertBefore(w, body && body.parentNode === h ? body : ref());
      w.appendChild(lg); boxes.set(name, lg); lastW = w; };
    if (body && [...body.querySelectorAll(':scope > p')].some(p => who(p).f)){
      for (const p of [...body.querySelectorAll(':scope > p')]){ const {q, m, f} = who(p);
        if (f){ say(m[1], f, p, q); continue; }
        out(p.innerHTML, boxes.size && !m ? 'sit' : 'narr'); p.remove(); }
      if (body.parentNode === h && !body.children.length) body.remove(); }
    else if (body && body.children.length && [...body.children].every(p => p.tagName === 'P' && !p.querySelector('i,b,div'))){   // Neon R6 M5: no speaker: plain lines are the Scene line (§2), not a Now box
      for (const p of [...body.children]){ out(p.innerHTML, 'narr'); p.remove(); }
      if (body.parentNode === h) body.remove(); }
    for (const p of [...h.querySelectorAll(':scope > p')]){ const {q, m, f} = who(p); if (f) say(m[1], f, p, q); }   // Neon R6 M4: a line straight on the card (the Varnholt hub's Sister Maud) gets her box
    for (const q of h.querySelectorAll(':scope > .f34-sp > .log > p > i')) if (SP.exec(q.textContent)){ q.dataset.cf = '1'; F.unquote(q); }   // Neon R6 H2: a box built elsewhere (PD38 Zenif on b9) loses the name and the quote marks too const q = n.children.length === 1 && n.firstElementChild.tagName === 'I' && n.firstElementChild, m = q && SP.exec(q.textContent), f = m && F.faceOf(m[1]);
    for (const n of [...h.querySelectorAll(':scope > .note')]){ const q = n.children.length === 1 && n.firstElementChild.tagName === 'I' && n.firstElementChild, m = q && SP.exec(q.textContent), f = m && F.faceOf(m[1]);
      if (!f) continue; const p = document.createElement('p'); p.appendChild(q); say(m[1], f, p, q); n.remove(); }
    for (const n of h.querySelectorAll(':scope > .log[data-cap]')) n.classList.add('f34-plain');
    F.boxes23 = boxes; };
  /* P23-CARD §3: help tips are a person speaking (Cayde), one at a time, GOT IT shows the next. If Cayde already speaks on the card
     the tip takes his box until the last GOT IT, then his own words come back; otherwise he gets his own face row in the Tips zone,
     which goes with the last GOT IT. No gold title, no "Tip:" word. */
  F.tips23 = function(h, list, put, lab, mk){
    const face = F.faceOf('Cayde'); if (!list.length || !face) return false;
    const own = F.boxes23 && F.boxes23.get('Cayde'); let lg, w, keep = null, rule = null, label = null;
    if (own){ lg = own; w = own.parentNode; keep = [...own.childNodes]; }
    else { rule = document.createElement('div'); rule.className = 'f34-rule'; put(rule); label = lab(F.TXT6.tips); put(label);
      lg = document.createElement('div'); lg.className = 'log'; w = mk('Cayde', face, lg); w.classList.add('f34-tipsp'); put(w); }
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'btn small f34-got'; bt.textContent = F.TXT23.gotIt;
    const row = document.createElement('div'); row.className = 'f34-gotrow'; row.appendChild(bt); w.after(row);
    let i = 0; const show = () => { lg.innerHTML = ''; const p = document.createElement('p'); p.dataset.tip23 = String(i); p.innerHTML = list[i]; lg.appendChild(p); };
    bt.onclick = () => { if (++i < list.length) return show();
      row.remove(); if (keep){ lg.innerHTML = ''; keep.forEach(n => lg.appendChild(n)); } else { w.remove(); rule && rule.remove(); label && label.remove(); } };
    show(); return true; };
  F.zoneLoose = 0;
  F.zones = function(h){
    const SP = /^([A-Z][^:\u201c]{1,24}): \u201c/, mk = (name, face, logEl) => { const w = document.createElement('div'); w.className = 'f34-sp';
      w.innerHTML = '<div class="f34-face"><img src="' + face + '" alt=""><span>' + esc(name) + '</span></div>'; w.appendChild(logEl); return w; };
    const C23 = window.CARD23 !== false, body = h.querySelector(':scope > .log');
    if (C23) F.speak23(h, body, SP, mk);
    else if (body){ let cur = null, last = null;   // one box per speaker, in the order they speak (a speaker with no face stays in the box above)
      for (const p of [...body.querySelectorAll(':scope > p')]){ const q = p.querySelector(':scope > i'), m = q && SP.exec(q.textContent), f = m && F.faceOf(m[1]); if (q) q.dataset.cf = '1';   // UX 1i-04: the ux.js watcher adds no second face
        if (!f){ if (last && last.log !== body) last.log.appendChild(p); continue; }
        if (!cur){ cur = m[1]; const w = mk(m[1], f, document.createElement('div')); w.removeChild(w.lastChild); h.insertBefore(w, body); w.appendChild(body); last = {log: body, w}; continue; }
        if (m[1] !== cur){ cur = m[1]; const lg = document.createElement('div'); lg.className = 'log'; lg.appendChild(p); const w = mk(m[1], f, lg); last.w.after(w); last = {log: lg, w}; } } }
    if (!C23) for (const n of [...h.querySelectorAll(':scope > .note')]){ const q = n.children.length === 1 && n.firstElementChild.tagName === 'I' && n.firstElementChild, m = q && SP.exec(q.textContent), f = m && F.faceOf(m[1]);
      if (!f) continue; q.dataset.cf = '1'; const lg = document.createElement('div'); lg.className = 'log'; const p = document.createElement('p'); p.appendChild(q); lg.appendChild(p); n.replaceWith(mk(m[1], f, lg)); }
    const sp1 = h.querySelector(':scope > .f34-sp > .log');
    if (!C23) for (const n of [...h.querySelectorAll(':scope > [data-z="narr"]')]){ if (!sp1){ n.dataset.z = 'sit'; continue; }   // narration goes in the first speaker's box, above the first quote
      const p = document.createElement('p'); p.innerHTML = n.innerHTML; const qp = [...sp1.querySelectorAll(':scope > p')].find(x => x.querySelector(':scope > i'));
      if (qp) sp1.insertBefore(p, qp); else sp1.appendChild(p); n.remove(); }
    for (const n of h.querySelectorAll(':scope > .log[data-cap]')) n.classList.add('f34-plain');   /* UX U6-2: a caption with no speaker is plain text, not a box */
    const row = h.querySelector(':scope > .f34-row'), slot = h.querySelector(':scope > #t45-slot'), anchor = slot || row, items = [];
    const zone = el => { const z = el.dataset && el.dataset.z; if (z) return z; if (el.classList.contains('f34-sp')) return 'spk';
      if (el.id === 'b45-hub' || el.querySelector('#b45-hub') || el.classList.contains('f34-dr')) return 'choice';
      if (el.matches('.note.good,[data-pd38="join"],[data-pd38="training"]')) return 'gain';
      const tx = el.textContent.trim(); if (/^Tip:/.test(tx)) return 'tip'; if (el.classList.contains('log') && /^Kind\b/.test(tx)) return 'choice';
      F.zoneLoose++; return 'sit'; };
    for (const el of [...h.children]){ if (el === row || el === slot || el.tagName === 'H1' || el.classList.contains('f34-sc') || el.dataset.z === 'title' || /^Beat \d+ of/.test(el.textContent)) continue; const z = zone(el); items.push([F.ZRANK[z] || 3, z, el]); }
    items.sort((a, b) => a[0] - b[0]);
    const put = el => h.insertBefore(el, anchor), lab = (t, c) => { const d = document.createElement('div'); d.className = 'f34-zl' + (c ? ' ' + c : ''); d.textContent = t; return d; };
    let cur = '', gain = null, tips = 0; const tl23 = [];
    for (const [, z, el] of items){
      if (C23 && z === 'narr'){ el.className = 'f34-scene'; put(el); continue; }   // P23-CARD §2: the Scene line, no box, no label
      if (C23 && z === 'tip'){ tl23.push(el.innerHTML.replace(/^\s*Tip:\s*/, '')); el.remove(); continue; }   // §3: gathered, then one at a time
      if (z !== cur){ cur = z;
        if (z === 'sit') put(lab(F.TXT6.now)); else if (z === 'gain'){ put(lab(F.TXT6.gained)); gain = document.createElement('div'); gain.className = 'log f34-gain'; put(gain); }
        else if (z === 'tip'){ const r = document.createElement('div'); r.className = 'f34-rule'; put(r); put(lab(F.TXT6.tips)); } }
      if (z === 'gain'){ if (el.classList.contains('log')) while (el.firstChild) gain.appendChild(el.firstChild);
        else if (el.classList.contains('note') || el.tagName === 'P'){ const p = document.createElement('p'); p.innerHTML = el.innerHTML; gain.appendChild(p); } else gain.appendChild(el); if (el.parentNode === h) el.remove(); continue; }
      if (z === 'tip'){ if (++tips > 2){ el.remove(); continue; } const r = document.createElement('div'); r.className = 'f34-tip';
        r.innerHTML = '<svg class="f34-tg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M11.4 .8c1.7 1.9 2.5 3.4 2.5 4.6a2.5 2.5 0 0 1-5 0c0-1.2.8-2.7 2.5-4.6z" fill="#d9962a"/><ellipse cx="11.4" cy="5.6" rx="1" ry="1.5" fill="#f6dc84"/><path d="M.9 8.4h10c1.3 0 2.8-.4 3.9-1.4-.3 3.1-2.8 5.3-6 5.3H5.4C3 12.3 1.3 10.7.9 8.4z" fill="#7a5426"/><path d="M2 8.4h8.9c1 0 2-.2 2.9-.7" stroke="#c99a3a" stroke-width="1" fill="none"/><circle cx="2.1" cy="7.1" r="1.6" stroke="#7a5426" stroke-width="1.3" fill="none"/><rect x="4.6" y="12.3" width="5.2" height="2.2" rx=".5" fill="#4a3418"/></svg><span></span>';
        r.lastChild.innerHTML = el.innerHTML.replace(/^\s*Tip:\s*/, ''); el.remove(); put(r); continue; }
      put(el); }
    if (tl23.length && !F.tips23(h, tl23, put, lab, mk)){   // no Cayde portrait: the old glyph row, one tip
      const r = document.createElement('div'); r.className = 'f34-rule'; put(r); put(lab(F.TXT6.tips)); const t = document.createElement('div'); t.className = 'f34-tip'; t.innerHTML = '<span></span>'; t.lastChild.innerHTML = tl23[0]; put(t); }
  };
  F.card1i = function(title, body, buttons){
    F.css1i();
    const h = $('create-inner');
    const C23 = window.CARD23 !== false;   // P23-CARD §4: LEAVE and NEW CHAPTER are in the Menu, not on the card
    h.innerHTML = `<i class="f34-sc${F.NARROW(body) ? ' n' : ''}" hidden></i><h1 style="font-size:36px">${title}</h1>${body}<div class="f34-row">${C23 ? '' : `<button class="btn small" title="${esc(F.TXT1I.leaveTip)}" onclick="F34.leave()">${esc(F.TXT1I.leave)}</button><button class="btn small" title="${esc(F.TXT1I.skipTip)}" onclick="F34.askSkip()">${esc(F.TXT1I.skip)}</button>`}<span class="f34-pri">${buttons}</span></div>`;
    try { F.zoneLoose = 0; if (window.ZONES6 !== false) F.zones(h); } catch (e) { console.warn('F34 zones', e); }   // U-slice 6
    show('screen-create');
    if (C23) F.menu23(); else { const m1 = document.getElementById('f34-menu1'); if (m1) m1.remove(); }   // Neon R6 M3: CARD23 = false at run time drops the lone Menu
  };
  F.menu23 = function(){   // §4: on a screen with no top bar the same Menu button stands alone at 6, 6
    let b = document.getElementById('f34-menu1');   // the top bar is shown or hidden after the card is drawn, so CSS decides (css1i), not this
    if (!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'f34-menu1'; b.className = 'c31-menubtn'; b.textContent = F.TXT23.menu; b.onclick = function(){ CAMP31.menu(this); }; document.body.appendChild(b); }
    return b; };
  F.card = function(title, body, buttons){
    if (window.L1I !== false) return F.card1i(title, body, buttons);
    $('create-inner').innerHTML = `<h1 style="font-size:36px">${title}</h1>${body}<div style="margin-top:12px">${buttons}</div>
      <div style="margin-top:10px"><button class="btn small" onclick="F34.leave()">LEAVE (progress kept)</button>${F.K52 ? '' : ' <button class="btn small" onclick="F34.skip()">SKIP: START A NEW CHAPTER</button>'}</div>${F.K52
        ? '<div style="margin-top:28px;text-align:right;align-self:stretch;width:100%;box-sizing:border-box"><button class="btn small" style="opacity:.8" onclick="F34.askSkip()">SKIP: START A NEW CHAPTER</button></div>' : ''}`;
    show('screen-create');
  };
  F.go = function(){
    const st = F.state(), b = st && F.BEATS[st.beat];
    if (!b) return F.finish();
    if (b.id === 'b3' && st.leader && !META.leader) st.leader = false;   // the new Leader fell: build again
    if (b.step <= F.BUILT) F.cast(b);
    const n = st.beat + 1, retry = st.log.length && st.log[st.log.length - 1].id === b.id, line = F.caydeLine(b), pre = F.b9bPre(b);
    if (!(st.seen = st.seen || []).includes(b.id)) st.seen.push(b.id);   // P23-VOICE F13a: the beat cards seen (b4again)
    const U48 = LINES().ux48 || {}, keep = b.id === 'b10' && U48.k51 && U48.k51.keepWaves;   // K51 (Planner ux48.k51): the b10 Keep card says the waves do not end
    const body = `<div class="note" data-z="title">Beat ${n} of ${F.BEATS.length}${retry ? ' · again' : ''}</div><div class="log" data-cap="1" style="max-width:640px;margin:8px auto;text-align:left">${(cap(F.capKey(b)) || cap(b.id)) ? `<p>${esc(cap(F.capKey(b)) || cap(b.id))}</p>` : ''}${pre ? `<p><i>Cayde: \u201c${esc(pre)}\u201d</i></p>` : ''}${line ? `<p><i>Cayde: \u201c${esc(line)}\u201d</i></p>` : ''}</div>${keep ? `<div class="note" data-z="sit"><b>${esc(keep)}</b></div>` : ''}`;   // U6: the waves warning is Now, not Cayde's words
    if (b.id === 'b3' && !st.leader && b.step <= F.BUILT)
      return F.card(esc(b.name), body + `<div class="note" data-z="tip">Build the Leader you will play from here on: any race, class and Specialty.</div>`, `<button class="btn gold" onclick="F34.buildLeader()">OPEN THE CAGE: BUILD YOUR LEADER</button>`);
    if (b.step <= F.BUILT && META.leader && b.obj === 'defence') return F.gateCard(b, body);
    if (b.step <= F.BUILT && META.leader && b.kind === 'road') return F.roadCard(b, body);
    if (b.step <= F.BUILT && META.leader && F.STEP3[b.kind]) return F.STEP3[b.kind](b, body);
    if (b.step > F.BUILT || (b.kind === 'fight' && !META.leader))
      return F.card(esc(b.name), body + `<div class="note">Not built yet (F-34 step ${b.step}).</div>`, `<button class="btn gold" onclick="F34.next('stub')">CONTINUE</button>`);
    if (b.kind === 'fight') return F.card(esc(b.name), body + (F.rushed(b) ? `<div class="note bad">${esc(GL().rushed || F.TXT_RUSH)} (${F.rushPay(b, b.pay)} gp)</div>` : '') + (b.obj === 'escort' ? tipHTML('escort') : ''), `<button class="btn gold" onclick="F34.play()">MARCH</button>`);
    return F.card(esc(b.name), body, `<button class="btn gold" onclick="F34.next('done')">CONTINUE</button>`);
  };
  F.squad = () => META.roster.filter(p => !p.resting).slice(0, 4).map(p => p.id);
  F.play = function(){
    const st = F.state(), b = F.BEATS[st.beat];
    if (b && (b.kind === 'leads' || (b.leads && st.leads !== b.id)) && st.lead) return startDeployment(F.leadContract(st.lead, b), F.squad());
    if (!b || b.kind !== 'fight') return F.go();
    startDeployment(F.contract(b), b.solo ? [] : F.squad());
  };
  F.finish = function(){
    F.card('The Founding', `<div class="log" data-cap="1" style="max-width:640px;margin:8px auto;text-align:left"><p>${esc(((LINES().captions || {}).ending || {}).agree || 'The road ends in Artemis\u2019s lands.')}</p></div>${tipHTML('kalloonEnd')}`, `<button class="btn${window.L1I !== false ? ' gold' : ''}" id="f34-restart" onclick="F34.askRestart()">${esc(F.TXTS6.btn)}</button>`);   // S6 1i E: the card's one gold primary (it still asks first, in danger mode)
  };
  /* S6-A note 2 (Patrick): a finished Founding save offered only LEAVE or SKIP, so the Founding could not be played again.
     START THE FOUNDING AGAIN clears this slot (F.SLOT) only and starts at beat 1; the Chapter save is another slot. Words [S]. */
  F.TXTS6 = {btn: 'START THE FOUNDING AGAIN', title: 'Start the Founding again?', body: 'This Founding save is cleared and Cayde’s story starts again from the first beat. Your Chapter save is not touched.', ok: 'START AGAIN', cancel: 'STAY'};
  /* S6 row 1a (review of 387874a): the new save goes in through switchSlot, the one path every save change takes, so the old run's
     camp people, map, skin, faces and Chronicle mode are all reset with it. The player's settings (volume, text size, speed) stay. */
  F.restart = function(){
    if (SAVE_KEY !== F.SLOT) switchSlot(F.SLOT);
    const M = freshMeta(); if (META && META.settings) M.settings = META.settings;
    M.f34 = {beat:0, log:[], at:Date.now()};
    G = null; META = M; saveMeta();
    switchSlot(F.SLOT);                       // load the save just written: every per-save reset runs
    if (!META || !META.f34 || META.f34.at !== M.f34.at) META = M;   // the stamp just written did not come back: saving is off in this tab (the save is open in another tab), so the load brought the old run back: play the new one unsaved, as that tab does everything
    F.slotNow = F.SLOT; F.go();
  };
  F.askRestart = function(){ F.askDanger(F.TXTS6, () => F.restart()); };

  /* ---- step 1b: the Sun Elf Exiles faction ---------------------------------
     Old saves need nothing: standing() reads a missing key as 0. FACTION_HOST and COMMANDER_FACTION
     get no entry (never raiders, no commander). Glyph and colour are a placeholder for Art. */
  F.SUN = 'sunelves';
  F.ELVES = ['SUN_ELF', 'GREY_ELF'];
  F.sunLines = () => LINES().sunElves || {};
  F.addSunElves = function(){
    if (FACTIONS[F.SUN]) return false;
    const L = F.sunLines(), pk = L.perk || {};
    FACTIONS[F.SUN] = {name: L.name || 'Sun Elf Exiles', patron: L.patron || 'Speaker of the Exiles',
      perk: (pk.name || 'Sunlit Rally') + ': ' + (pk.line || 'Once a contract, the first Squad Mate to fall stands up at once with 1 Condition.')};
    if (!PATRONS.includes(FACTIONS[F.SUN].patron)) PATRONS.push(FACTIONS[F.SUN].patron);
    HOSTAGE_FOLK[F.SUN] = L.folk || 'Sun Elf refugees';
    FACTION_LOOK[F.SUN] = {glyph:'bow', col:'#8a9a3a', at:[38, 56.5]};   // near Tarim (js/campaign/places.js)
    FACTION_RIVAL[F.SUN] = 'frostvault';                                  // one way: frostvault keeps rivalling mendor
    if (!NO_RAIDERS.includes(F.SUN)) NO_RAIDERS.push(F.SUN);              // refugees cannot pay raiders
    for (const r of ['marches', 'freelands']) if (REGIONS[r] && !REGIONS[r].factions.includes(F.SUN)) REGIONS[r].factions.push(F.SUN);
    return true;
  };
  /* The Exiles sit in the faction tables only in a Founding save (META.f34, the Founding slot, or a save that already has Exile
     Standing), so a sandbox Chapter's board, map and rivals are as they were before the Founding became the default. */
  F.removeSunElves = function(){
    const fx = FACTIONS[F.SUN]; if (!fx) return false;
    const pi = PATRONS.indexOf(fx.patron); if (pi >= 0) PATRONS.splice(pi, 1);
    delete FACTIONS[F.SUN]; delete HOSTAGE_FOLK[F.SUN]; delete FACTION_LOOK[F.SUN]; delete FACTION_RIVAL[F.SUN];
    const ni = NO_RAIDERS.indexOf(F.SUN); if (ni >= 0) NO_RAIDERS.splice(ni, 1);
    for (const r of ['marches', 'freelands']) if (REGIONS[r]){ const i = REGIONS[r].factions.indexOf(F.SUN); if (i >= 0) REGIONS[r].factions.splice(i, 1); }
    return true;
  };
  F.wantSun = function(){
    try { if (typeof SAVE_KEY !== 'undefined' && SAVE_KEY === F.SLOT) return true;
      return !!(typeof META !== 'undefined' && META && (META.f34 || (META.standing && META.standing[F.SUN] != null))); } catch (e){ return true; }
  };
  F.syncSun = function(){ try { if (F.wantSun()) F.addSunElves(); else F.removeSunElves(); } catch (e){ console.warn('F34 sun sync', e); } };
  {
    F.syncSun(); window.addEventListener('load', () => F.syncSun());
    { const f = loadMeta; loadMeta = function(){ const r = f.apply(this, arguments); F.syncSun(); return r; }; }   // every slot switch and load
    { const f = saveMeta; saveMeta = function(){ if (!FACTIONS[F.SUN] && F.wantSun()) F.addSunElves(); return f.apply(this, arguments); }; }
  }
  F.sunAllied = () => !!(FACTIONS[F.SUN] && allied(F.SUN));
  F.sunHostile = () => !!(FACTIONS[F.SUN] && standing(F.SUN) <= -2);
  // Sunlit Rally [G]: once a contract the first Squad Mate who would fall stays up at 1 Condition (a free Get Back in the Fight).
  const _drop = dropMate;
  dropMate = function(m, n){
    if (typeof G !== 'undefined' && G && G.sunRally && !G.sunRallyUsed && m && m.state === 'up' && n >= m.con){
      G.sunRallyUsed = true; m.con = 1; m.flash = 10;
      pop(m.x, m.y - 18, 'SUNLIT RALLY', '#f0d070');
      if (typeof note === 'function') note(`${m.p.name} goes down and stands straight back up (Sunlit Rally).`);
      return;
    }
    return _drop.apply(this, arguments);
  };
  // Hostile: the Exiles will not speak for you, so Sun and Grey Elves leave the hire line (forced classes, e.g. freed slaves, keep their roll).
  const _recruit = rollRecruit;
  rollRecruit = function(forcedCls){
    let m = _recruit.apply(this, arguments);
    if (F.sunHostile() && !CLASSES[forcedCls]) for (let i = 0; i < 30 && F.ELVES.includes(m.race); i++) m = _recruit.apply(this, arguments);
    return m;
  };

  /* ---- step 2: beats 1-3 ------------------------------------------------- */
  const say = (who, id) => { const a = (LINES()[who] || {})[id]; return String(Array.isArray(a) ? a.join(' ') : (a || '')).replace(/\{families\}/g, F.families()); };   // a line set is spoken in order; gate FAIL H1: {families} fills in spoken lines too
  F.FRIENDS = [{key:'hal', spec:'SOLDIER', cls:'FREEMAN'}, {key:'pinch', spec:'SCOUNDREL', cls:'FREEMAN'}];
  F.friend = k => META.roster.find(p => p.f34 === k);
  // Cayde leads until the player's Leader is built; Hal and Pinch wait in the roster from b2 (their cages free them).
  F.cast = function(b){
    const st = F.state();
    if (!META.leader && !(st && st.leader)){ const L = makeLeader('HUMAN', 'EDELOS', 'FOLK_HERO', 'Cayde'); L.sex = 'm'; L.f34cayde = true; L.hero = 'cayde'; META.leader = L; }   /* S6-C note 13 (Art Director): hero:'cayde' gives the Founding's Cayde his own painted face (HERO_PORT), not the Folk Hero sheet face */
    if (b && (b.id === 'b2' || b.id === 'b3')) for (const f of F.FRIENDS) if (!F.friend(f.key)){
      const p = makeMate('HUMAN', f.cls, f.spec, (LINES()[f.key] || {}).name || f.key); p.sex = 'm'; p.f34 = f.key; META.roster.push(p);
    }
  };
  // b2: an opened cage frees the next friend into the squad instead of hostages; with no hostages the Rescue wins once both cages are open.
  const _upd = updateContract;
  updateContract = function(){
    const rel = typeof G !== 'undefined' && G && G.contract && G.contract.f34 === 'b2' && G.cages && G.hostages;
    const shut = rel ? G.cages.filter(x => !x.open) : null, nH = rel ? G.hostages.length : 0;
    const r = _upd.apply(this, arguments);
    if (rel && G && G.cages) for (const cg of shut) if (cg.open){
      G.hostages.length = nH;
      G.fx = (G.fx || []).filter(x => !(x.text && /FREED/.test(x.text)));
      G.msgs = (G.msgs || []).filter(x => !/^The cage is open/.test(x.t || ''));
      F.release(cg);
    }
    return r;
  };
  // F-34 step 7 (found by BOT.chain): b1 is a Hunt with no camps, and checkObjective only wins a Hunt when it has camps, so the cold open
  // could never be won. A Founding Hunt with no camps is won when every foe on the field is dead [S line].
  F.clearWin = function(){
    if (typeof G === 'undefined' || !G || G.over || G.winT || G.obj !== 'hunt' || !G.contract || !G.contract.f34 || (G.camps && G.camps.length)) return false;
    if (!(G.kills > 0) || G.enemies.some(e => !e.dead)) return false;   // the dead leave G.enemies
    G.winT = 150; note('The last of them is down. The road is clear.'); return true;
  };
  { const f = checkObjective; checkObjective = function(){ F.clearWin(); return f.apply(this, arguments); }; }
  F.release = function(cg){
    const f = F.FRIENDS.find(x => { const p = F.friend(x.key); return p && !G.squad.some(m => m.p === p); });
    if (!f) return null;
    const p = F.friend(f.key), m = runMate(p, G.squad.length); m.x = cg.x; m.y = cg.y + 16;
    G.squad.push(m);
    for (const id of (p.picks || [])) G.ranks[id] = Math.max(G.ranks[id] || 0, 1);
    buildAbilities(); recompute();
    pop(cg.x, cg.y - 52, p.name.toUpperCase() + ' JOINS THE SQUAD', '#8fd39a');
    const ln = say(f.key, 'intro'); if (ln) note(`${p.name}: \u201c${ln}\u201d`);
    return m;
  };
  // b3: the real Leader screen; when it is signed, Cayde takes the chair and the new Leader leads.
  F.buildLeader = function(){
    F.making = true; if (typeof GUIDE !== 'undefined') GUIDE = null;
    CR = {step:'spec', sex:Math.random() < .5 ? 'f' : 'm'}; if (typeof LV !== 'undefined') LV.hov = null;
    renderCreate(); show('screen-create');
  };
  F.crown = function(L){
    META.master = {id:'CM', name:'Cayde', race:'HUMAN', cls:'EDELOS', spec:'FOLK_HERO', sex:'m', hero:'cayde'};
    META.leader = L; META.board = null;
    const st = F.state(); if (st) st.leader = true;
  };
  const _fc = finishCreate;
  finishCreate = function(){
    if (!F.making) return _fc.apply(this, arguments);
    F.making = false;
    const el = $('cr-name'), name = ((el && el.value) || CR.name || '').trim() || randomName(CR.race, CR.sex);
    const L = makeLeader(CR.race, CR.cls, CR.spec, name); if (CR.sex) L.sex = CR.sex; if (CR.pick) L.picks.push(CR.pick);
    F.crown(L); CR = null; saveMeta(); F.go();
  };
  const _lb = ldrBack;
  ldrBack = function(){
    if (F.making && CR && ldrSteps().indexOf(CR.step) <= 0){ F.making = false; CR = null; return F.go(); }
    return _lb.apply(this, arguments);
  };

  /* ---- step 3: beats 4-7 -------------------------------------------------- */
  F.KIT = ['brigandine', 'heavyshield'];                     // + the free Spears and Shortbows: 200 gp of the 350 cap (Systems beat table)
  F.PURSE = 850;                                             // [T] newStory's purse: 200 Chapter + 300 town works + 350 kit
  F.SPOILS = ['crossbows', 'shortswords', 'leather', 'heavyshield'];   // [S] fixed list, the first the camp lacks (no roll)
  F.LEAD_PAY = 280;
  const tip = k => ((LINES().tips || {})[k]) || '';
  const tipShow = k => !!tip(k) && F.seeTip(k);   // step 6: Settings > Tips, and the card tip counts as seen
  const tipHTML = k => tipShow(k) ? `<div class="note" data-z="tip">Tip: ${esc(tip(k))}</div>` : '';
  const tipInk = k => tipShow(k) ? `<div class="ink small" data-f34tip="${k}"><b>Tip:</b> ${esc(tip(k))}</div>` : '';
  const SUN = () => FACTIONS[F.SUN] ? F.SUN : 'suderia';
  // b4: the quartermaster who owes Cayde: the kit goes onto the Leader's squad (Hal and Pinch leave their Rags), once
  F.issueKit = function(){
    const st = F.state(); if (!st || st.kit) return false;
    st.kit = true;
    let cost = 0;
    for (const id of F.KIT){ const x = gear(id); if (!x) continue; cost += x.cost | 0;
      if (window.ARM){ ARM.add(id, 1); ARM.take(id, META.leader); }
      else { if (!META.gear.owned.includes(id)) META.gear.owned.push(id); META.gear[x.slot] = id; } }
    META.treasury = Math.max(META.treasury | 0, F.PURSE) - cost;
    return true;
  };
  F.hireLine = () => (LINES().leads || {}).hire || 'Hire at the Campfire: Barracks, then HIRE.';   // [N] Planner's words; leads.hire overrides
  F.visit = function(){
    if (typeof openCamp !== 'function') return;
    try { openCamp(); } catch (e){ console.warn('F34 visit', e); return F.go(); }
    let bt = document.getElementById('f34-back');
    if (!bt){ bt = document.createElement('button'); bt.id = 'f34-back'; bt.className = 'btn gold';
      bt.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:60'; bt.textContent = 'BACK TO THE FOUNDING';
      bt.onclick = () => F.back(); document.body.appendChild(bt); }
  };
  F.back = function(){ const bt = document.getElementById('f34-back'); if (bt) bt.remove(); if (typeof closePanel === 'function') try { closePanel(); } catch (e) {} F.go(); };
  // Act III blocker 3: round 2 (b9) has its own words in campaign-lines leads.round2; a missing key falls back to round 1.
  // {card} is the gear card the raid will give (the first spoils card the camp lacks).
  F.round2 = id => !!id && id !== 'b6';
  F.leadLines = function(kind, id){
    const LL = LINES().leads || {}, r2 = (F.round2(id) && LL.round2) || {}, o = Object.assign({}, LL[kind] || {}, r2[kind] || {});
    const sc = F.spoilCard(), nm = sc && gear(sc) ? gear(sc).name : 'a gear card';
    for (const k of Object.keys(o)) if (typeof o[k] === 'string') o[k] = o[k].replace(/\{card\}/g, nm);
    return o;
  };
  // b6: the two offers, round 1 = one of each (Systems: no round may take the Exiles below -1)
  F.leadPay = b => F.rushPay(b || {id: 'b6'}, (b && b.leads) || F.LEAD_PAY);
  F.leadContract = function(kind, b){
    const c = makeContract(kind === 'rescue' ? 'rescue' : 'hunt', 1), L = F.leadLines(kind, b ? b.id : 'b6');
    c.f34 = b ? b.id : 'b6'; c.f34lead = kind; c.teach = {}; c.pay = F.leadPay(b); if (F.rushed(b || {id: 'b6'})) c.rushed = true; c.faction = null;   // only the Exiles' Standing moves
    if (kind === 'rescue'){ c.hostFaction = SUN(); if (FACTIONS[SUN()]) c.patron = FACTIONS[SUN()].patron; }
    if (kind === 'rescue' || F.round2(c.f34)){ c.host = F.GATE_HOST; c.place = 'Varnholt'; if (c.town) c.town = 'Varnholt'; }   // Act III item 18
    if (L.title) c.title = L.title;
    if (L.brief) c.brief = L.brief;
    return c;
  };
  F.pickLead = function(kind){ const st = F.state(); if (!st || (kind !== 'rescue' && kind !== 'raid')) return; st.lead = kind; saveMeta(); F.play(); };
  F.spoilCard = () => F.SPOILS.find(id => gear(id) && !(window.ARM ? ARM.has(id) : META.gear.owned.includes(id))) || null;
  F.leadDebrief = function(c, result, lines){
    const kind = c.f34lead, L = F.leadLines(kind, c.f34), won = result === 'victory';
    const ln = won ? L.win : (result === 'withdrawn' || result === 'fled') ? L.withdrew : L.loss;
    if (ln) lines.push(`<p><i>${esc(ln)}</i></p>`);
    if (!won && ln === L.loss){ const cy = say('cayde', 'leadLost'); if (cy) lines.push(`<p><i>Cayde: \u201c${esc(cy)}\u201d</i></p>`); }   // Act III item 9
    if (kind === 'raid' && won){
      shiftStanding(SUN(), -1, lines);
      const id = F.spoilCard();
      if (id){ ARM.add(id, 1); lines.push(`<p class="good"><b>Spoils:</b> ${esc(gear(id).name)} go into the wagon.</p>`);
        try { if (window.DEBRIEF31 && DEBRIEF31.addSpoils) DEBRIEF31.addSpoils({name: gear(id).name, kind: 'gear', value: gear(id).cost | 0}); } catch (e) {} }
    }
    const st = F.state(); if (st) st.lead = null;
  };
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      const r = f.apply(this, arguments);
      if (c && c.f34lead && lines) try { F.leadDebrief(c, result, lines); } catch (e){ console.warn('F34 lead debrief', e); }
      return r; }; }
  // Act III blocker 4 (plan): the Leader is set to Level 2 at b7, once, with Level 2's row bonus as a real level-up gives it
  F.levelTwo = function(L){
    const st = F.state(); L.level = 2; L.ticks = 0; let label = '';
    try { const b = rowFor(L.spec, 2)[2];
      label = b.startsWith('text:') ? capLabel(b.slice(5)) : (BONUS_LABEL[b] || '');
      if (b === 'pick') META.pendingPicks = (META.pendingPicks | 0) + 1;
      if (b === 'luck' && leaderStats(L).rawLuck > 6) META.treasury += 60; } catch (e){ console.warn('F34 level 2', e); }
    if (st) st.lv2label = label;
    return label;
  };
  F.pickRow = L => { const o = leaderOpts(L); return o.length ? `<div class="note" data-z="choice"><div class="f34-ch">Pick a Talent</div><div class="f34-dr">${o.map(c => `<button class="btn" title="${esc(c.text(1))}" onclick="leaderPick('${c.id}');F34.go()">${esc(c.name)}</button>`).join('')}</div></div>` : ''; };
  // b7: the free drill (F-33 drills), 0 gp and no sit-out [T], once
  F.drillsOn = () => !!(window.F33 && F33.DRILLS);
  // Q16/Q17 (Patrick 2026-11-16): the Planner's drill words in campaign-lines `drills` ({does, desc} per drill; levelCard, levelDone)
  F.drillWords = () => { const C = LINES(); return (C.founding45 && C.founding45.drills) || C.drills || {}; };   // QA 22 Nov: the words live at founding45.drills (as in drills.js:205)
  F.drillDesc = d => { const w = (F.drillWords())[d && d.key]; return (w && w.desc) || (d && d.desc) || ''; };
  F.drillFill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  F.freeDrill = function(pid, key){
    const st = F.state(); if (!st || st.drill || !F.drillsOn()) return false;
    const p = META.roster.find(x => x.id === pid), d = F33.DRILLS.find(x => x.key === key);
    if (!p || !d || (p.drills && p.drills[key])) return false;
    p.drills = Object.assign({}, p.drills, {[key]: true});
    st.drill = {pid, key}; saveMeta(); F.go(); return true;
  };
  F.STEP3 = {
    camp(b, body){
      F.issueKit(); saveMeta();
      const kit = F.KIT.map(id => gear(id) && gear(id).name).filter(Boolean).join(' and ');
      return F.card(esc(b.name), body + `<div class="note" data-z="gain">The quartermaster issues ${esc(kit)} (with the Spears and Shortbows) to your squad. Treasury: ${META.treasury | 0} gp.</div>${tipHTML('armoury')}${tipHTML('board')}`,
        `<button class="btn gold" onclick="F34.next('done')">CONTINUE</button> <button class="btn" onclick="F34.visit()">LOOK ROUND THE CAMP</button>`);
    },
    leads(b, body){
      const st = F.state(), LL = LINES().leads || {}, L2 = F.round2(b.id), o = k => F.leadLines(k, b.id);
      const frame = (L2 && LL.round2 && LL.round2.frame) || LL.frame;
      if (st.lead) return F.card(esc(b.name), body, `<button class="btn gold" onclick="F34.play()">MARCH (${esc(o(st.lead).title || st.lead)})</button>`);
      const offer = (k, cost) => `<div class="log" data-z="choice" style="max-width:640px;margin:8px auto;text-align:left"><p><b>${esc(o(k).title || k)}</b> (${F.leadPay(b)} gp). ${esc(o(k).brief || '')}</p><div class="note">${cost}</div><button class="btn${window.L1I !== false ? '' : ' gold'}" onclick="F34.pickLead('${k}')">TAKE IT</button></div>`;
      const sun = FACTIONS[SUN()] ? FACTIONS[SUN()].name : 'the Sun Elves';
      const mk = (LL.market ? `<div class="note" data-z="sit">${esc(LL.market)} Treasury: ${META.treasury | 0} gp.</div>` : '') + (LL.spend && F.tipsOn() ? `<div class="note" data-z="tip">Tip: ${esc(LL.spend)}</div>` : '')
        + (LL.spend && F.tipsOn() ? '' : `<div class="note" data-z="tip">${esc(F.hireLine())}</div>`);   // GD 22 Nov: the hire line only when the spend tip is not shown, so the 2-tip cap keeps sunStanding   // Planner Act III (a): the Hiring Line is two clicks deep; say where
      return F.card(esc(b.name), body + (F.rushed(b) ? `<div class="note bad" data-z="sit">${esc((window.CAMPAIGN_LINES && CAMPAIGN_LINES.gate && CAMPAIGN_LINES.gate.rushed) || F.TXT_RUSH)} (${F.leadPay(b)} gp)</div>` : '') + (frame ? `<div class="note" data-z="sit">${esc(frame)}</div>` : '') + mk
        + offer('rescue', `Win: Standing with ${esc(sun)} rises. No gear.`) + offer('raid', `Win: one gear card for the wagon. Standing with ${esc(sun)} falls by 1.`) + tipHTML('sunStanding'),
        `<button class="btn" onclick="F34.visit()">THE MARKET AND THE HIRING LINE</button>`);
    },
    level(b, body){
      const st = F.state(), L = META.leader;
      if ((L.level | 0) < 2 && !st.lv2){ st.lv2 = true; F.levelTwo(L); saveMeta(); }   // Act III blocker 4
      const lv = L.level | 0;
      let h = (st.lv2 && st.lv2label !== undefined ? `<div class="note good" data-z="gain"><b>${esc(L.name)} reaches Level 2.</b>${st.lv2label ? ' ' + esc(st.lv2label) + '.' : ''}</div>` : '')
        + (META.pendingPicks > 0 && typeof leaderOpts === 'function' ? F.pickRow(L) : '') + `<div class="note" data-z="gain">${lv >= 2 ? (st.lv2 && st.lv2label !== undefined ? `<b>Advancements:</b> Squad Mates may now hold ${lv + 1}.` : `${esc(L.name)} is Level ${lv}. Squad Mates may hold ${lv + 1} Advancements.`) : `${esc(L.name)}: ${L.ticks | 0} of 3 XP ticks to Level 2.`}</div>${tipHTML('levelUp')}`;
      if (st.drill){ const p = META.roster.find(x => x.id === st.drill.pid), d = F.drillsOn() && F33.DRILLS.find(x => x.key === st.drill.key);
        if (p && d){ const DL = F.drillWords();   // Q16/Q17 words (campaign-lines drills.levelDone; {drill} goes in bold)
          h += DL.levelDone ? `<div class="note" data-z="gain">${esc(F.drillFill(DL.levelDone, {leader: L.name, mate: p.name, drill: '\u0001', desc: F.drillDesc(d)})).replace('\u0001', '<b>' + esc(d.name) + '</b>')}</div>`
                            : `<div class="note" data-z="gain">${esc(p.name)} has the drill <b>${esc(d.name)}</b>: ${esc(F.drillDesc(d))}</div>`; } }
      else if (F.drillsOn()){
        const rows = META.roster.filter(p => !p.resting).map(p => F33.DRILLS.filter(d => !(p.drills && p.drills[d.key]))
          .map(d => `<button class="btn" title="${esc(F.drillDesc(d))}" onclick="F34.freeDrill(${p.id},'${d.key}')">${esc(p.name)}: ${esc(d.name)}</button>`).join(window.L1I !== false ? '' : ' ')).filter(Boolean);
        const DLs = F.drillWords(), lc = DLs.levelHead, lt = DLs.levelTip;   // ND 22 Nov: a short heading and a second tip replace the four-sentence levelCard
        if (rows.length) h += `<div class="note f34-ch" data-z="choice">${esc(lc ? F.drillFill(lc, {leader: L.name}) : 'A free drill from Cayde: choose a Squad Mate and a drill')}</div>${window.L1I !== false ? `<div class="f34-dr">${rows.join('')}</div>` : `<div>${rows.join('<br>')}</div>`}${lt && F.tipsOn() ? `<div class="note" data-z="tip">Tip: ${esc(F.drillFill(lt, {leader: L.name}))}</div>` : ''}`;   // UX 1i-11: equal buttons on the card's left inner edge
      }
      return F.card(esc(b.name), body + h, `<button class="btn gold" onclick="F34.next('done')">CONTINUE</button>`);
    }
  };

  /* ---- step 4: the three gate defences (b8-b10) ---------------------------- */
  F.WALL = 12;                                               // [S] the town watch on Varnholt's wall at the first defence
  F.GATE_HOST = 'hollow';                                    // the old siege prologue's enemy at Varnholt
  const GL = () => LINES().gate || {};
  F.gateContract = function(b){
    const st = F.state() || {}, c = makeRaidContract({tier:b.tier, host:F.GATE_HOST, faction:null});
    c.f34 = b.id; c.f34gate = true; c.teach = {}; c.force30 = true; c.towers30 = true;
    c.wall30 = Math.max(window.DEF30 ? DEF30.K.militia : 3, st.wall === undefined ? F.WALL : st.wall);
    c.patron30 = SUN(); c.place = 'Varnholt'; c.patron = 'the Reeve of Varnholt'; c.title = GL().title || 'Hold the North Gate';
    if (b.teach && b.teach.breachAt) c.script30 = {breachAt: b.teach.breachAt};
    const keep = b.id === 'b10' && F.gateLost();             // the gate was lost or left: this fight is at the Keep
    if (keep){ c.f34keep = true; c.title = GL().keepTitle || F.KEEP.TXT.title; c.script30 = {breachAt: F.KEEP.breachAt}; }
    c.brief = ((keep ? (GL().keepBrief || F.KEEP.TXT.brief) : GL().brief) || 'The Hollow come down the north road. Hold the North Gate for {m} minutes; if it falls, save the town and clear them out. {w} of the town watch stand on the wall.')
      .replace('{m}', c.minutes).replace('{w}', c.wall30);
    return c;
  };
  /* The Keep (Patrick 2026-11-14): leaving the wall in b8 or b9 loses the gate, as a lost defence does, and the next fight
     defends the Reeve's Keep: the gate gives way almost at once [S] and the fight is inside the walls. Campaign only;
     camp raids are untouched. No switch (its on switch and ?keep34=0 were removed in INT-1, 2026-11-15). Words are [N] drafts for Narrative. */
  F.KEEP = {breachAt: 0.1,   // [S] share of the clock before the gate goes at the Keep
    TXT: {title: 'Hold the Reeve’s Keep',
          brief: 'The North Gate is lost and the Hollow are coming through it. Fall back on the Reeve’s Keep, hold them off it for {m} minutes and clear the town. {w} of the town watch stand with you.',
          btn: 'TO THE KEEP', head: 'THE GATE IS LOST',
          warn: 'Leave the wall and the North Gate is lost. The next fight is at the Reeve’s Keep.',
          left: 'You left the wall. The Hollow hold the North Gate; the fight falls back to the Reeve’s Keep.'}};
  F.gateLost = function(){ const st = F.state(); if (!st) return false;
    const last = (st.log || []).filter(x => x.id === 'b8' || x.id === 'b9').pop(); return !!(last && last.r !== 'victory'); };
  F.onWall = () => !!(typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.f34gate && G.contract.f34 !== 'b10' && F.active());
  { const f = withdrawNote; withdrawNote = function(){
      const h = f.apply(this, arguments);
      return F.onWall() ? h + `<div class="sub" style="color:var(--bad-dark);font-size:13px"><b>${esc(GL().leaveWarn || F.KEEP.TXT.warn)}</b></div>` : h; }; }
  { const f = endDeployment; endDeployment = function(result){
      if (result === 'withdrawn' && F.onWall()){ G.failHead = GL().leaveHead || F.KEEP.TXT.head; G.f34left = true; arguments[0] = 'fled'; }
      return f.apply(this, arguments); }; }
  /* D2 (audits/f45-founding-plan.md): Hal and Pinch cannot die before Kalloon, in any Founding fight (Act I's road had it
     as a lesson step; the replay of Act III lost both). In the fight their Bleeding Out roll never comes; they stay down
     until stood up. A lost fight carries them off wounded instead of leaving them, and they rest for one beat.
     Hired mates (Sister Maud included) die as normal. */
  F.d2 = p => !!(p && (p.f34 === 'hal' || p.f34 === 'pinch') && F.active());
  { const f = updateMates; updateMates = function(){
      try { if (typeof G !== 'undefined' && G && G.squad) for (const m of G.squad) if (m.state === 'bleeding' && F.d2(m.p)) m.bleedT = 1; } catch (e) {}
      return f.apply(this, arguments); }; }
  { const f = endDeployment; endDeployment = function(){
      const kept = [];
      try { if (typeof G !== 'undefined' && G && G.squad) for (const m of G.squad)
        if ((m.state === 'bleeding' || m.state === 'dead') && F.d2(m.p)){ m.state = 'stable'; m.diedAtEnd = false; kept.push(m.p);
          if (G.downedIds && G.downedIds.add) G.downedIds.add(m.p.id); } } catch (e) {}
      // Planner Act III (b): a kept mate rests a beat, so the report must not say "recovers fully"
      const ic = injuryCheck, names = kept.map(p => p.name);
      if (kept.length) injuryCheck = function(maxCon, who, lines){ const n = lines ? lines.length : 0, r = ic.apply(this, arguments);
        try { if (r === null && names.includes(who)) F.d2Line(who, lines, n); } catch (e) {}
        return r; };
      let r; try { r = f.apply(this, arguments); } finally { injuryCheck = ic; }
      for (const p of kept) p.resting = Math.max(p.resting | 0, 1);
      return r; }; }
  F.d2Line = function(who, lines, n){
    if (lines && lines.length > n){ const i = lines.length - 1;
      lines[i] = String(lines[i]).replace(' recovers fully', ' comes home and rests one beat'); }
    const d = typeof G !== 'undefined' && G && G.injDice && G.injDice[G.injDice.length - 1];
    if (d && d.label === who) d.text = String(d.text).replace('RECOVERS', 'RESTS A BEAT');
  };
  F.b9bPre = b => (b && b.id === 'b10' && F.gateHeld('b9') && !cap('b9b')) ? say('cayde', 'b9b') : '';   // gate 2 M2: b9b is a Cayde line now; it comes before cayde.b10
  F.gateHeld = id => (F.state().log || []).some(x => x.id === id && x.r === 'victory');
  F.gateCard = function(b, body){
    const st = F.state();
    if (b.id === 'b8'){ const d = cap('b8dusk'), z = say('zenif', 'b8');   // Act III item 8
      if (d) body += `<div class="note" data-z="narr">${esc(d)}</div>`; if (z) body += `<div class="note"><i>Zenif: \u201c${esc(z)}\u201d</i></div>`; }
    if (b.id === 'b10' && F.gateHeld('b9') && cap('b9b')) body += `<div class="note" data-z="narr">${esc(cap('b9b'))}</div>`;   // a Cayde b9b line goes first in his own box instead (F.b9bPre, F.go)
    const c = F.gateContract(b), lastGate = (st.log || []).filter(x => x.id === 'b8' || x.id === 'b9').pop();
    // FIX45 B2: after a lost gate the card must not say "You held the gate"
    const held = (lastGate && lastGate.r !== 'victory') ? 0 : ['b8', 'b9'].filter(F.gateHeld).length;
    let h = `<div class="note" data-z="sit">Tier ${c.tier} defence, ${c.minutes} minutes${c.f34keep ? '' : ', two gate towers'}. ${esc(c.brief)}</div>`;
    if (b.id === 'b8') h += tipHTML('gate');
    if (b.id === 'b8') h += `<div class="note" data-z="tip">${esc(GL().rule || (F.RUSH ? 'Hold the gate and you have the day to prepare for the next job. Lose it and you get half a day, and the next job pays half.' : 'Varnholt’s gate may fall. Hold it if you can.'))}</div>`;
    if (b.id === 'b10') h += `<div class="note" data-z="tip">${esc(held ? (GL().keepHeld || 'You held {n}. This one cannot be held: when the gate goes, save what you can and clear the town.').replace('{n}', held === 2 ? 'both gates' : 'the gate') : (GL().keep || 'The gate is lost. Fall back to the Keep and clear the town.'))}</div>`;
    return F.card(esc(b.name), body + h, `<button class="btn gold" onclick="F34.play()">${c.f34keep ? esc(F.KEEP.TXT.btn) : 'MAN THE GATE'}</button>`);
  };
  F.gateDebrief = function(c, result, lines){
    const st = F.state(), S = G && G.def30; if (!st || !S) return;
    const lost = [...S.ko].filter(a => a.kind === 'militia').length, min = window.DEF30 ? DEF30.K.militia : 3;
    st.wall = Math.max(min, (c.wall30 | 0) - lost);
    if (lost) lines.push(`<p>${lost} of the town watch ${lost > 1 ? 'were' : 'was'} carried off the wall. ${st.wall} will stand at the next assault.</p>`);
    if (result !== 'victory' || S.breach) for (let i = lines.length - 1; i >= 0; i--)   // Act III item 12: nothing that reads as a held gate
      if (/Not a plank out of place|never reached the (Reeve|Vault)|Not one of them got inside/.test(lines[i])) lines.splice(i, 1);
    if (c.f34keep) for (let i = 0; i < lines.length; i++) lines[i] = String(lines[i]).replace('The assault on the North Gate', 'The assault on the Reeve\u2019s Keep');
    if (c.f34 === 'b10') return;
    const held = result === 'victory' && !S.breach;
    lines.push(held ? `<p class="good"><i>${esc(GL().held || 'The gate held. You have the day to prepare, and the job pays in full.')}</i></p>`
                    : G.f34left ? `<p class="bad"><i>${esc(GL().left || F.KEEP.TXT.left)}</i></p>`
                    : `<p class="bad"><i>${esc(GL().fell || 'The North Gate is lost. The fight falls back to the Reeve’s Keep.')}</i></p>`);
    if (!held && F.RUSH) lines.push(`<p class="bad"><i>${esc(GL().rushedAfter || 'The gate fell. We get only half a day to get ready, so the next job pays half.')}</i></p>`);
  };
  // b10: when the scripted breach fires at 80%, the fall of the gate (Narrative split it from the siege caption)
  F.breachLines = function(c){
    if (!c || c.f34 !== 'b10') return [];
    const out = [], b = cap('b10breach'), cy = say('cayde', 'b10breach');
    if (b) out.push(b); if (cy) out.push('Cayde: ' + cy);
    return out;
  };
  // QA F-34 A: shown from DEF30.onEvent('breach') below, so a gate that falls before the 80% script gets them too
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      const r = f.apply(this, arguments);
      if (c && c.f34gate && lines) try { F.gateDebrief(c, result, lines); } catch (e){ console.warn('F34 gate debrief', e); }
      return r; }; }

  /* ---- step 5: the Long Road (b11) on the real story road ------------------ */
  F.ROAD_DAYS = 21;                                          // R-114: about three weeks
  const RL = () => ((LINES().captions || {}).road) || {};
  F.roadOn = () => !!(F.active() && typeof META !== 'undefined' && META && META.cp && META.cp.f34road);
  F.roadDay = n => 1 + Math.round((Math.max(1, n) - 1) * (F.ROAD_DAYS - 1) / Math.max(1, NIGHTS.length - 1));
  F.roadCard = function(b, body){
    if (META.cp && META.cp.f34road && inStory()) return F.roadResume();
    return F.card(esc(b.name), body + `<div class="note" data-z="sit">${F.ROAD_DAYS} days on the road to Artemis\u2019s lands, and ${NIGHTS.length} nights under attack. The column, the wagon and the other companies are yours to keep alive.</div>`,
      `<button class="btn gold" onclick="F34.startRoad()">TO THE WAGONS</button>`);
  };
  F.roadResume = function(){ setChronicle(true); renderTitle(); };
  // Varnholt fell (the third gate always does), so the road starts from the story's lost-siege numbers
  F.startRoad = function(){
    META.cp = {part:'retreat', f34road:true, full:true, caravan30:true, siegeWon:false, day:0, supply:8, orders:0, aux:[], log:[], st:{}, district:{},
      intelRev:[0, 0, 0, 0, 0, 0], assault:0, fort:{stakes:0, firepits:0, barricades:0, murder:false}, orsolt:'alive', fallback:true};
    for (const k in STRUCTS) META.cp.st[k] = {hp:0, max:STRUCTS[k].max * HPX};   // the town's gates and walls are down
    setChronicle(true); saveMeta(); F.roadResume();
  };
  { const f = switchSlot; switchSlot = function(){ const r = f.apply(this, arguments);
      try { if (META && META.f34 && META.cp && META.cp.f34road) setChronicle(true); } catch (e){} return r; }; }
  /* INT-1 stage 3 group 7: the leaveStory wrapper is folded into founding-story.js leaveStory */
  // the retreat screen: no Dust Cloaks recruiter yet in 616 (hindsight only); the b11 caption instead
  { const f = retreatHTML; retreatHTML = function(){ const h = f.apply(this, arguments);
      if (!F.roadOn()) return h;
      return h.replace(/Then a Dust Cloaks recruiter[^<]*/, esc(cap('b11') || 'The road to Artemis\u2019s lands is about three weeks long.')); }; }
  // the header: Day N of 21
  const nightTag = C => `Night ${C.night} of ${NIGHTS.length}`, dayTag = C => `Day ${F.roadDay(C.night)} of ${F.ROAD_DAYS}`;
  { const f = storyDayHTML; storyDayHTML = function(){ const h = f.apply(this, arguments), C = CP();
      if (!F.roadOn() || C.part !== 'road') return h;
      return h.replace(`<h2>${nightTag(C)}</h2>`, `<h2>${nightTag(C)}</h2>` + tipHTML('nightChoice')); }; }   // GD N3(b): the road counts nights only, no Day x of 21
  { const f = renderTopbar; renderTopbar = function(){ const r = f.apply(this, arguments);
      try { const C = CP(), el = $('topbar');
        if (F.roadOn() && C.part === 'retreat' && el) el.innerHTML = el.innerHTML.replace(`Day <b>${C.day} / ${lastDay()}</b>`, `Night <b>0 / ${NIGHTS.length}</b>`);
        if (F.roadOn() && C.part !== 'retreat' && C.part !== 'road' && el)   // QA F-34 C: Kalloon read 'Day 21 / 14'; GD 22 Nov: after arrival it reads the road's nights, never a Day count
          el.innerHTML = el.innerHTML.replace(`Day <b>${C.day} / ${lastDay()}</b>`, `Night <b>${NIGHTS.length} / ${NIGHTS.length}</b>`);
        /* GD N3(b): on the road the top bar shows the Night only; the Day stat is not added */ } catch (e){}
      return r; }; }
  { const f = renderWorkBoard; renderWorkBoard = function(){ const r = f.apply(this, arguments);
      try { const C = CP(), root = document.getElementById('table-inner');
        if (F.roadOn() && C.part === 'road' && root){
          /* GD N3(b): no Day count on the road board */
          if (F.sunHostile()) for (const c of root.querySelectorAll('.wcard')){ const t = c.querySelector('.wt');
            if (t && t.textContent === 'Recruit a band'){ c.style.opacity = '.45'; c.removeAttribute('onclick'); const d = c.querySelector('.wd'); if (d) d.textContent = F.parleyShut(); } }
        } } catch (e){ console.warn('F34 road board', e); }
      return r; }; }
  // the day's lines: week captions, the sub-beat captions, and the quiet days between nights
  F.roadNews = function(C, n0){
    const L = RL(), out = [], d0 = n0 ? F.roadDay(n0) : 0, d1 = F.roadDay(C.night);
    const NR = NIGHTS[C.night - 1] || {};
    if (d1 - d0 > 1) out.push(NR.gap ? esc(NR.gap) : `${d1 - d0 > 2 ? 'Quiet days' : 'A quiet day'} on the road. The column walks, and nothing comes out of the trees.`);   // [S]; Long Road pass 1: each night's own gap line (ND), the quiet day is the fallback
    for (const [w, at] of [['week1', 1], ['week2', 8], ['week3', 15]]) if (d0 < at && d1 >= at && L[w]) out.push(`<i>${esc(L[w])}</i>`);
    const sub = NR.sub || null;
    if (sub && L[sub]) out.push(`<i>${esc(L[sub])}</i>`);
    return out;
  };
  F.MAGE = {race:'HUMAN', cls:'FREEMAN', spec:'MAGE', sex:'f', magic:1};   // Systems: one Mage recruit at Magic 1; she joins at b7 (PD-38, pd38.js), not on Night 5
  F.roadDayNews = function(C, n0){
    const out = F.roadNews(C, n0);
    C.day = F.roadDay(C.night); C.dayNews = out.concat(C.dayNews || []);
  };
  { const f = startRoad; startRoad = function(){ const r = f.apply(this, arguments);
      try { if (F.roadOn()){ F.roadDayNews(CP(), 0); saveMeta(); try { refreshUI(); } catch (e){} } } catch (e){ console.warn('F34 road start', e); } return r; }; }
  /* INT-1 stage 3 group 7: the storyAfterFight wrapper (road day news) is folded into founding-story.js storyAfterFight */
  // the Parley: a sure success the first time on Night 2 [T]; no offers at all while the Exiles are Hostile
  F.parleyShut = () => (F.sunLines().parleyShut || 'The Elders will not speak for the Grey Cloaks. No company will walk beside you.');   // [S]
  { const f = workOrder; workOrder = function(id){
      if (id !== 'parley' || !(window.CARAVAN30 && CARAVAN30.applies())) return f.apply(this, arguments);
      const C = CP();
      if (F.sunHostile()){ C.offer30 = null; cpLog('Recruit a band: ' + F.parleyShut()); SFX.play('nope'); saveMeta(); try { refreshUI(); } catch (e){} return; }
      if (F.roadOn() && (NIGHTS[C.night - 1] || {}).sub === 'ally' && !C.f34parley && C.orders > 0 && !C.hired){
        const r0 = cpRoll; cpRoll = () => 'full'; C.f34parley = true;
        try { return f.apply(this, arguments); } finally { cpRoll = r0; } }
      return f.apply(this, arguments);
    }; }
  // Night 3: Strategos Sigrún comes with the Renegades and raises the white flag when hurt (the real Parley)
  F.SIGRUN = 'sigrun34';
  F.addSigrun = function(){
    if (BESTIARY[F.SIGRUN]) return false;
    const S = LINES().sigrun || {};
    BESTIARY[F.SIGRUN] = Object.assign({}, BESTIARY.vane, {name:S.name || 'Strategos Sigrún', colour:'#2e3a4e', guards:['renegade', 'renegade']});   // [S] Vane's numbers
    delete BESTIARY[F.SIGRUN].summons;
    ENEMY_LOOK[F.SIGRUN] = Object.assign({}, ENEMY_LOOK.ilvaryn, {tall:false, shield:true, beard:false});
    if (!PARLEY_COMMANDERS.includes(F.SIGRUN)) PARLEY_COMMANDERS.push(F.SIGRUN);
    return true;
  };
  F.addSigrun();
  { const f = setupStory; setupStory = function(c){ const r = f.apply(this, arguments);
      try { if (F.roadOn() && c && c.obj === 'night' && (NIGHTS[c.night - 1] || {}).sub === 'whiteFlag' && BESTIARY[F.SIGRUN]){
        const e = spawnEnemy(F.SIGRUN, undefined, undefined, {noNem:true});
        if (e){ e.f34 = true; note(`${e.name} rides with the host tonight.`); } } } catch (e){ console.warn('F34 Sigrun', e); }
      return r; }; }
  // QA F-34 B: she died in the 40 s Preparation to a hired band. No harm before the fight starts; no blow kills her before her parley
  F.sigrunGuard = function(e, n){
    if (!e || e.k !== F.SIGRUN || e.parleyed || e.dead || typeof G === 'undefined' || !G) return n;
    if (G.prepT > 0) return null;
    return n >= e.con ? Math.max(0, e.con - 1) : n;
  };
  { const f = hurtEnemy; hurtEnemy = function(e, n){ const m = F.sigrunGuard(e, n); if (m === null) return; return f.call(this, e, m); }; }
  { const f = offerParlay; offerParlay = function(e){ const r = f.apply(this, arguments);
      try { const S = LINES().sigrun || {}; if (e && e.k === F.SIGRUN && S.approach) note(`${e.name}: ${S.approach}`); } catch (er){} return r; }; }
  // QA F-34 F: the prologue's founding moves the save to MAIN_SLOT and deletes STORY_SLOT. From any other slot (the Founding's own,
  // a sim or a test) the real saves are neither read for the 'already has a Chapter' prompt, written, nor deleted; the result stays in the slot.
  F.foundSandboxed = () => typeof FD !== 'undefined' && !!(FD && FD.fromStory) && SAVE_KEY !== STORY_SLOT;
  { const f = finishFound; finishFound = function(){
      if (!F.foundSandboxed()) return f.apply(this, arguments);
      const slot = SAVE_KEY, P = Storage.prototype, gi = P.getItem, ri = P.removeItem, si = P.setItem, real = k => k === MAIN_SLOT || k === STORY_SLOT;
      const seen = META.tipsSeen;
      P.getItem = function(k){ return this === localStorage && real(k) ? null : gi.apply(this, arguments); };
      P.removeItem = function(k){ if (this === localStorage && real(k)) return; return ri.apply(this, arguments); };
      P.setItem = function(k){ if (this === localStorage && real(k)) return; return si.apply(this, arguments); };
      try { return f.apply(this, arguments); }
      finally { P.getItem = gi; P.removeItem = ri; P.setItem = si; SAVE_KEY = slot;
        if (F.active() && seen) META.tipsSeen = Object.assign({}, seen, META.tipsSeen);   // the Founding keeps its Field Notes
        try { saveMeta(); renderTitle(); } catch (e){} }
    }; }
  // Kalloon: when the story's founding is done, the road beat is done
  { const f = finishFound; finishFound = function(){
      const road = !!(F.active() && META.cp && META.cp.f34road && typeof FD !== 'undefined' && FD && FD.fromStory);
      const r = f.apply(this, arguments);
      try { const st = F.state(), b = st && F.BEATS[st.beat]; if (road && b && b.id === 'b11'){ F.step(st, 'done'); saveMeta(); } } catch (e){ console.warn('F34 Kalloon', e); }
      return r; }; }
  /* INT-1 stage 3 group 7: the F.leave self-wrap (removes #f34-back) is folded into F.leave above */

  /* ---- step 6: tips and Field Notes ------------------------------------------ */
  F.mergeTips = function(){
    if (typeof TIPS === 'undefined') return 0;
    const T = LINES().tips || {}; let n = 0;
    for (const k in T) if (T[k] && !(k in TIPS)){ TIPS[k] = T[k]; n++; }
    return n;
  };
  F.tipsOn = () => !!(typeof settings === 'function' && settings().tips);
  F.seeTip = function(k){
    if (!F.tipsOn() || typeof TIPS === 'undefined' || !TIPS[k]) return false;
    META.tipsSeen = META.tipsSeen || {};
    if (!META.tipsSeen[k]){ META.tipsSeen[k] = true; saveMeta(); }
    return true;
  };
  F.fightTip = function(){ if (!F.active() || typeof window.tip !== 'function') return; for (const k of arguments) if (TIPS[k]) window.tip(k); };
  // at the gate the tip box would cover the wall (DEF30, Director 2026-11-13): the tip goes to the note log instead, once ever
  F.noteTip = function(){ if (!F.active()) return; for (const k of arguments) if (F.tipsOn() && TIPS[k] && !(META.tipsSeen || {})[k] && F.seeTip(k)) note('Tip: ' + TIPS[k]); };
  F.FIGHT_TIPS = {b1:['firstEnemy', 'outOfReach'], b2:['cage'], b3:['commandRadius', 'hurtMate'], b5:['escort']};
  {
    F.mergeTips();
    { const f = startDeployment; startDeployment = function(c){ const r = f.apply(this, arguments);
        try { if (c && c.f34 && !c.f34gate && F.FIGHT_TIPS[c.f34]) F.fightTip(...F.FIGHT_TIPS[c.f34]); } catch (e){ console.warn('F34 tips', e); }
        return r; }; }
    if (window.DEF30) DEF30.onEvent = function(k, c){
      if (!c || !c.f34gate) return;
      if (k === 'start') F.noteTip('defenceStart', 'wallArchers');
      else if (k === 'ladder') F.noteTip('ladders');
      else if (k === 'ram') F.noteTip('ram');
      else if (k === 'breach'){ if (!c.f34lines){ c.f34lines = true; F.breachLines(c).forEach(x => note(x)); } F.noteTip(...['gateFalls', 'keepFight'].concat(c.f34 === 'b10' ? ['sallyGate'] : [])); }
    };
    { const f = setupStory; setupStory = function(c){ const r = f.apply(this, arguments);
        try { if (F.roadOn() && c && c.obj === 'night') F.fightTip('longRoad', 'columnStrength'); } catch (e){}
        return r; }; }
    { const f = offerParlay; offerParlay = function(){ const r = f.apply(this, arguments);
        try { F.fightTip('parleyOffer', 'whiteFlag', 'parleyDemand'); } catch (e){} return r; }; }
    { const f = offerParlay; offerParlay = function(e){   // Act III item 13
        if (e && F.active() && !F.roadOn() && typeof G !== 'undefined' && G && G.contract && G.contract.f34){ e.parleyed = true; return; }
        return f.apply(this, arguments); }; }
    if (window.LR34){
      const into = (h, t) => { const i = h.lastIndexOf('</div>'); return t && i >= 0 ? h.slice(0, i) + t + h.slice(i) : h; };
      { const f = LR34.offerHTML; LR34.offerHTML = function(){ const h = f.apply(this, arguments); return F.roadOn() ? into(h, tipInk('bandHire')) : h; }; }
      { const f = LR34.bandHTML; LR34.bandHTML = function(){ const h = f.apply(this, arguments); return F.roadOn() ? into(h, tipInk('bandShare') + tipInk('bandEquip')) : h; }; }
    }
  }
  // Field Notes: every tip seen, in the order seen (META.tipsSeen keeps insertion order)
  F.fieldNotes = function(){
    const seen = (typeof META !== 'undefined' && META && META.tipsSeen) || {}, T = typeof TIPS !== 'undefined' ? TIPS : {};
    return {list: Object.keys(seen).filter(k => seen[k] && T[k]).map(k => ({k, text: T[k]})), total: Object.keys(T).filter(k => T[k]).length};
  };
  F.fieldNotesHTML = function(){
    const FN = LINES().fieldNotes || {}, N = F.fieldNotes(), C25 = window.CHRONICLE25;
    const body = N.list.length
      ? N.list.map((x, i) => `<div data-fn="${x.k}" style="font:14px/1.45 Georgia;margin:5px 0 5px 8px;display:flex;gap:8px"><span style="min-width:26px;font:bold 14px Georgia;color:#8a6d3a;text-align:right">${i + 1}.</span><span>${esc(x.text)}</span></div>`).join('')
      : `<div style="font:italic 14px Georgia;margin:18px 6px">${esc(FN.empty || 'Nothing here yet.')}</div>`;
    const seen = (FN.seen || 'Seen {n} of {total}.').replace('{n}', N.list.length).replace('{total}', N.total);
    const bar = r => `<div style="height:16px;background:linear-gradient(#8a6d3a,#c9a85a 50%,#8a6d3a);border-radius:${r}"></div>`;
    return `<div data-f34="fieldnotes" style="background:#efe3c8;color:#2a2218;border:3px solid #8a6d3a;border-radius:6px;box-shadow:0 0 30px rgba(0,0,0,.6);width:min(760px,96vw)">${bar('4px 4px 0 0')}`
      + (C25 && C25.strip ? C25.strip('fieldnotes', false) : '')
      + `<div style="padding:14px 22px 6px;display:flex;gap:14px;align-items:center;border-bottom:1px solid #b89a5a"><div style="flex:1;text-align:left"><div style="font:bold 24px Georgia">${esc(FN.title || 'Field Notes')}</div>`
      + `<div style="font:14px Georgia">${esc(FN.intro || '')}</div><div style="font:italic 14px Georgia;color:#5a4a2a">${esc(seen)}</div></div><button class="btn" onclick="closeChronicle()">CLOSE</button></div>`
      + `<div style="padding:6px 22px 14px;max-height:calc(100vh - 230px);min-height:120px;overflow-y:auto;text-align:left">${body}</div>${bar('0 0 4px 4px')}</div>`;
  };
  if (window.CHRONICLE25 && CHRONICLE25.pages)
    CHRONICLE25.pages.fieldnotes = {label: (LINES().fieldNotes || {}).title || 'Field Notes', html: () => F.fieldNotesHTML()};

  /* ---- title screen ------------------------------------------------------- */
  F.K45T = true;
  const _splash = showSplash;
  showSplash = function(){
    const r = _splash.apply(this, arguments);
    const el = $('title-inner'); if (!el) return r;
    // the Founding takes the old prologue's place on the title: same box, same order; the skip button now skips the Founding
    // S6 1f (UX-E1-02): the note and the button go by the Founding save. Finished wins over under way. Words: audits/narrative/s6-1c-1f-words.md.
    const fresh = typeof META !== 'undefined' && META && !META.leader && !(typeof founded === 'function' && founded()), has = F.exists(), fin = has && F.finishedSlot();
    const label = fin ? 'PLAY THE FOUNDING AGAIN' : `${has ? 'CONTINUE' : fresh ? 'START HERE:' : 'PLAY'} THE FOUNDING`;
    const say = fin ? 'You have finished the Founding. You can play it again from the start.'
      : has ? 'Carry on where you left off. The Founding keeps its own save.'
      : fresh ? 'New here? The Founding teaches the game as you play: Cayde’s company, from the first fight to the end of the Long Road. It keeps its own save.'
      : 'Or play the Founding: Cayde’s company, from the first fight to the end of the Long Road. It keeps its own save.';
    const old = el.querySelector('button[onclick^="openStory"]');
    const btn = document.createElement('button'); btn.className = 'btn gold'; btn.setAttribute('onclick', 'F34.start()'); btn.textContent = label;
    if (old){ const box = old.parentNode; box.dataset.f34 = 'title'; old.replaceWith(btn);
      const n = box.querySelector('.note'); if (n) n.textContent = say;
      for (const b of box.querySelectorAll('button')) if (/skip the prologue/i.test(b.textContent)) b.textContent = 'Skip the Founding: found a Chapter'; }
    else { const d = document.createElement('div'); d.dataset.f34 = 'title'; d.style.cssText = 'margin-top:12px;border-top:1px solid rgba(232,216,176,.35);padding-top:10px';
      d.innerHTML = `<div class="note" style="margin:0 0 6px"></div>`; d.firstChild.textContent = say; d.appendChild(btn); el.appendChild(d); }
    // K45 (F-48 UX): on a fresh profile START HERE: THE FOUNDING comes first; RECRUIT A SQUAD LEADER (a chapter founded,
    // no leader yet) moves under it and is no longer gold. F34.K45T = false: the old order.
    if (F.K45T && fresh) try {
      const box = el.querySelector('[data-f34="title"]'), first = [...el.querySelectorAll('button.btn.gold')].find(b => !box || !box.contains(b));
      if (box && first && (box.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING)){
        first.parentNode.insertBefore(box, first); first.classList.remove('gold');
        box.style.borderTop = 'none'; box.style.borderBottom = '1px solid rgba(232,216,176,.35)'; box.style.paddingBottom = '12px'; box.style.marginBottom = '12px'; box.style.marginTop = '6px';
      }
    } catch (e) { console.warn('K45 title', e); }
    return r;
  };

  /* ---- self-test ---------------------------------------------------------- */
  F.selfTest = function(){
    const rows = [], ok = (n, c) => rows.push((c ? 'PASS ' : 'FAIL ') + n);
    ok('Season by beat id: b3 Spring, b4 and b10 Summer, b11 Autumn', ['b3', 'b4', 'b10', 'b11'].map(id => F.seasonOf(F.BEATS.findIndex(x => x.id === id))).join() === 'Spring,Summer,Summer,Autumn');
    /* P23-BUG-5 (GD ruling 1): after b9 two mates at the cap of 2 and one under it: 1 to give now, 1 kept; the box says why; the kept one joins the round after b7 */
    { const s0 = {r: META.roster, a: META.advRound, l: META.leader, act: F.active};
      try { F.active = () => true; META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Wulf'); META.leader.level = 1; META.advRound = null;
        const h = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'Hal'), p = makeMate('HUMAN', 'FREEMAN', 'SCOUNDREL', 'Pinch'), m = makeMate('HUMAN', 'FREEMAN', 'MAGE', 'Ysolde');
        h.id = 9001; p.id = 9002; m.id = 9003; h.adv = 2; p.adv = 2; m.adv = 0; META.roster = [h, p, m];
        grantAdvancements([]); const R = META.advRound;
        ok('P23-BUG-5: with one mate under the cap, 1 is given now and 1 is kept (not dropped)', R.left === 1 && R.held === 1);
        if (typeof advKept === 'function'){ const b = advanceBlock();
          ok('P23-BUG-5: the box names the cap on a capped row, when it rises (Three jobs done) and the kept count', advKept() === 1 && b.includes(advFill(ADV_WHY().atCap, {n: 2, cap: 2})) && b.includes(advFill(ADV_WHY().risesAt, {next: 3, leader: 'Wulf', lv: 2, beat: 'Three jobs done'})) && b.includes(ADV_WHY().kept)); }   // the words are the ND's (CAMPAIGN_LINES.advCapWhy); the row checks the filled lines, not fixed text
        R.left = 0; R.given = []; META.leader.level = 2; grantAdvancements([]);
        ok('P23-BUG-5: after the Leader levels, the kept one joins the next round (1 + 2, carried 1)', META.advRound.left === 3 && !META.advRound.held && META.advRound.carried === 1);
      } catch (e) { ok('P23-BUG-5: rows ran (' + e.message + ')', false); }
      finally { META.roster = s0.r; META.advRound = s0.a; META.leader = s0.l; F.active = s0.act; } }
    /* Q100 (Patrick, GD 99a20363): while Founding lessons are still to come a lost defence rushes the next contract; none left, it starts the Long Road. Counted by beat, the same with Lessons on or off */
    { const at = id => F.BEATS.findIndex(x => x.id === id), run = id => F.step({beat: at(id), log: []}, 'fallen');
      const l8 = run('b8'), l9 = run('b9'), l10 = run('b10');
      ok('Q100: a lost b8 rushes the next contract', !!l8.rush && l8.beat === at('b8') + 1);
      ok('Q100: a lost b9 rushes the next contract', !!l9.rush && l9.beat === at('b9') + 1);
      ok('Q100: a lost b10 does not rush and goes to b11 (the Long Road)', !l10.rush && F.BEATS[l10.beat] && F.BEATS[l10.beat].id === 'b11'); }
    /* U-slice 6: the zone sorter on a built card (detached; no screen is touched) */
    { const h = document.createElement('div'); const z0 = F.zoneLoose;
      h.innerHTML = '<i class="f34-sc"></i><h1>T</h1><div class="note" data-z="title">Beat 1 of 12</div>'
        + '<div class="note" data-z="tip">Tip: first tip</div><div class="note" data-z="tip">Tip: second tip</div><div class="note" data-z="tip">Tip: third tip</div>'
        + '<div class="f34-dr" data-z="choice"><button>A</button></div><div class="note good" data-z="gain">Wulf reaches Level 2.</div><div class="note" data-z="sit">Tier 1 defence.</div>'
        + '<div class="note" data-z="narr">Dusk.</div><div class="log"><p>Caption.</p><p><i>Cayde: \u201cGo.\u201d</i></p></div>'
        + '<div class="note"><i>Zenif: \u201cEast wall.\u201d</i></div><div class="note">loose line</div><div class="f34-row"></div>';
      F.zones(h);
      const k = [...h.children].map(e => e.className.split(' ')[0] || e.tagName), at = c => k.indexOf(c);
      if (window.CARD23 !== false){ const sp = h.querySelectorAll(':scope > .f34-sp'), cay = sp[0] && sp[0].querySelector('.log'), got = h.querySelector('.f34-got'), sc = h.querySelectorAll(':scope > .f34-scene');
        ok('P23-CARD: zones in order Scene, Speakers, Now, Gained, Choices, button row', at('f34-scene') > -1 && at('f34-scene') < at('f34-sp') && at('f34-sp') < at('f34-zl') && h.querySelectorAll('.f34-zl')[0].textContent === F.TXT6.now
          && at('f34-gain') < at('f34-dr') && k[k.length - 1] === 'f34-row' && at('f34-rule') === -1);
        ok('P23-CARD: two Scene lines (no box, no label), one box per person, Cayde first, no "Name:" and no quote marks', sc.length === 2 && /Dusk/.test(sc[0].textContent) && /Caption/.test(sc[1].textContent)
          && sp.length === 2 && /Cayde/.test(sp[0].textContent) && /Zenif/.test(sp[1].textContent) && /^East wall\.$/.test(sp[1].querySelector('.log').textContent.trim()) && !/[“”]|Cayde:|Zenif:/.test(sp[0].querySelector('.log').textContent + sp[1].querySelector('.log').textContent));
        const t0 = cay && cay.textContent.trim(); got && got.onclick(); const t1 = cay && cay.textContent.trim(); got && got.onclick(); const t2 = cay && cay.textContent.trim(); got && got.onclick();
        ok('P23-CARD: Cayde speaks on the card, so the tips take his box one at a time (GOT IT shows the next, no "Tip:"), then his words come back and GOT IT goes',
          !!got && got.textContent === F.TXT23.gotIt && t0 === 'first tip' && t1 === 'second tip' && t2 === 'third tip' && cay.textContent.trim() === 'Go.' && !h.querySelector('.f34-got') && !/Tip:/.test(h.textContent));
        const g = document.createElement('div'); g.innerHTML = '<i class="f34-sc"></i><h1>T</h1><div class="note" data-z="tip">Tip: only tip</div><div class="note" data-z="sit">Now line.</div><div class="f34-row"></div>'; F.zones(g);
        const gk = [...g.children].map(e => e.className.split(' ')[0]), tsp = g.querySelector('.f34-tipsp'), gb = g.querySelector('.f34-got'); gb && gb.onclick();
        ok('P23-CARD: no Cayde on the card: the tip is his own face row in Tips (rule, label, box, GOT IT), and the last GOT IT takes it all away',
          !!tsp && /Cayde/.test(tsp.textContent) && /only tip/.test(tsp.textContent) && gk.indexOf('f34-zl') < gk.indexOf('f34-rule') && gk.indexOf('f34-rule') < gk.lastIndexOf('f34-zl') && gk.lastIndexOf('f34-zl') < gk.indexOf('f34-sp') && gk.indexOf('f34-gotrow') === gk.indexOf('f34-sp') + 1 &&!g.querySelector('.f34-tipsp,.f34-rule,.f34-got') && /Now line/.test(g.textContent));
        { const a0 = F.active, i0 = F.inSlot, m0 = document.getElementById('c31-menu'); if (m0) m0.remove(); const fb = document.createElement('button'); document.body.appendChild(fb); let it = [];
          try { F.active = F.inSlot = () => true; CAMP31.menu(fb); const m = document.getElementById('c31-menu'); it = m ? [...m.children].map(e => e.dataset.p23 || e.textContent || 'rule') : []; }
          finally { const m = document.getElementById('c31-menu'); if (m) m.remove(); fb.remove(); F.active = a0; F.inSlot = i0; }
          ok('P23-CARD: while a Founding runs the Menu holds Leave the Founding and New Chapter, then a rule, then Settings', it[0] === 'leave' && it[1] === 'skip' && it[2] === 'rule' && it[3] === 'Settings'); }
        F.zoneLoose = z0; }
      else {
      ok('U6: zones in order Speakers, Now, Gained, Choices, Tips, button row', at('f34-sp') < at('f34-zl') && h.querySelectorAll('.f34-zl')[0].textContent === F.TXT6.now
        && k.lastIndexOf('f34-zl') > at('f34-gain') && at('f34-gain') < at('f34-dr') && at('f34-dr') < at('f34-rule') && at('f34-rule') < at('f34-tip') && k[k.length - 1] === 'f34-row');
      ok('U6: tips capped at 2, no "Tip:" word, a glyph on each row', h.querySelectorAll('.f34-tip').length === 2 && !/Tip:/.test(h.textContent) && h.querySelectorAll('.f34-tip svg').length === 2);
      ok('U6: Cayde and Zenif each have a box, Cayde first; the narration sits inside the first box above the quote', h.querySelectorAll('.f34-sp').length === 2 && /Dusk./.test(h.querySelector('.f34-sp .log').innerHTML.split('<i')[0]) && /Zenif/.test(h.querySelectorAll('.f34-sp')[1].textContent));
      ok('U6: a block with no tag and no look is counted, and goes to Now', F.zoneLoose - z0 === 1 && /loose line/.test(h.querySelector('.f34-zl').parentNode.querySelectorAll('.note')[0].textContent + h.textContent));
      F.zoneLoose = z0; } }
    /* GD 22 Nov: round-2 Leads card, Tips on: spend + sunStanding, no hire line; Tips off: the hire line */
    { const sv = {card: F.card, tips: F.tipsOn, M: META}; let cb = '', cbb = ''; F.card = (t, b2, b3) => { cb = b2; cbb = b3; };
      try { META = Object.assign({}, META, {leader: META.leader || {name: 'L', level: 1}, f34: {beat: 0, log: []}}); const st = F.state(), b6 = F.BEATS.find(x => x.id === 'b6'), b2 = b6, LL = (LINES().leads || {});
        if (st && LL.spend){ F.tipsOn = () => true; F.STEP3.leads(b2, ''); const on = cb, onB = cbb; F.tipsOn = () => false; F.STEP3.leads(b2, ''); const off = cb, offB = cbb;
          ok('GD: b6 Leads card shows the market button', (onB || '').includes('F34.visit()') && (offB || '').includes('F34.visit()'));
          ok('GD: b6 Leads, Tips on: spend tip shown, hire line not', on.includes(esc(LL.spend)) && !on.includes(esc(F.hireLine())));
          ok('GD: b6 Leads, Tips off: the hire line is shown', off.includes(esc(F.hireLine())) && !off.includes(esc(LL.spend))); } }
      catch (e) { ok('GD: round-2 Leads card builds (' + e.message + ')', false); } finally { F.card = sv.card; F.tipsOn = sv.tips; META = sv.M; } }
    ok('12 beats: b1..b11 with b5b after b8 (G2)', F.BEATS.length === 12 && F.BEATS.map(b => b.id).join() === 'b1,b2,b3,b4,b5,b8,b5b,b9,b6,b7,b10,b11');
    { const ac = window.askConfirm, sk = F.skip; let asked = 0, skipped = 0; window.askConfirm = (t, b, y) => { asked++; y(); }; F.skip = () => { skipped++; };
      try { F.askSkip(); ok('K52: SKIP asks first, then skips on yes', asked === 1 && skipped === 1); } finally { window.askConfirm = ac; F.skip = sk; } }
    /* S6 row 1a: a finished Founding can be started again. Nothing is written: saveMeta and switchSlot are stubbed. */
    { const sv = {M: META, G: typeof G !== 'undefined' ? G : null, slot: F.slotNow, save: saveMeta, sw: switchSlot, card: F.card, ac: window.askConfirm};
      try {
        const slots = []; let shown = null, opts = null, saves = 0;
        saveMeta = () => { saves++; }; switchSlot = k => { slots.push(k); }; F.card = (t, b, btn) => { shown = {t, b, btn}; };
        META = freshMeta(); META.settings = {volume: 0, speed: 80}; META.treasury = 999; META.leader = {name: 'Old'}; META.roster = [{id: 1}];
        META.f34 = {beat: F.BEATS.length, log: [{id: 'b11', r: 'done'}]}; F.slotNow = SAVE_KEY;
        F.go();
        ok('1a: a finished Founding card offers START THE FOUNDING AGAIN as its one gold button (S6 1i E)', !!shown && /F34\.askRestart\(\)/.test(shown.btn) && (shown.btn.match(/btn gold/g) || []).length === 1);
        ok('1a: no builder\'s note on the finished card', !!shown && !/later step|Not built yet/i.test(shown.b));
        window.askConfirm = (t, b, y, o) => { opts = o; };
        const s0 = saves; F.askRestart();
        ok('1a: START AGAIN asks first, in danger mode (ENTER does not confirm), and clears nothing until yes', !!opts && opts.danger === true && META.f34.beat === F.BEATS.length && saves === s0);
        window.askConfirm = (t, b, y) => { y(); };
        shown = null; F.askRestart();
        ok('1a: on yes the Founding is at beat 1 with a clean save', META.f34.beat === 0 && META.f34.log.length === 0 && META.treasury === freshMeta().treasury && !META.roster.some(p => p.id === 1) && saves > s0);
        ok('1a: the player\'s settings are kept', !!META.settings && META.settings.volume === 0 && META.settings.speed === 80);
        ok('1a: the new save is loaded through switchSlot (per-save resets), into the Founding slot only', slots.length >= 1 && slots.every(k => k === F.SLOT));
        { const M2 = META; switchSlot = k => { slots.push(k); META = {f34: {beat: 3, log: [], at: 1}, roster: [], settings: {}}; };   // saving off: the load brings back another tab's unfinished run
          F.restart(); ok('1a: saving off in this tab: the fresh Founding still plays, not the stored run', META.f34.beat === 0 && META.f34.at !== 1 && META.treasury === freshMeta().treasury); META = M2; switchSlot = k => { slots.push(k); }; shown = null; F.go(); }
        ok('1a: a first-beat card shows, not the finished card', !!shown && !/F34\.askRestart\(\)/.test(shown.btn) && META.f34.beat === 0 && F.slotNow === F.SLOT);
      } catch (e) { ok('1a: restart self-test ran: ' + e.message, false); }
      finally { META = sv.M; G = sv.G; F.slotNow = sv.slot; saveMeta = sv.save; switchSlot = sv.sw; F.card = sv.card; window.askConfirm = sv.ac; } }
    ok('every beat has a caption or a Cayde line in CAMPAIGN_LINES (P23-VOICE folds most captions into the box of Cayde; b5b falls back to the beat name)', F.BEATS.every(b => cap(b.id) || F.caydeLine(b) || b.id === 'b5b'));
    let st = {beat:0, log:[]};
    F.step(st, 'victory'); ok('a win moves on', st.beat === 1);
    F.step(st, 'fallen'); ok('a loss replays the beat', st.beat === 1 && st.tries === 1);
    F.step(st, 'withdrawn'); ok('a fighting withdrawal moves on', st.beat === 2);
    st = {beat:10, log:[]}; F.step(st, 'fallen'); ok('losing the Keep moves on (loseOk)', st.beat === 11);
    st = {beat:3, log:[]}; F.step(st); ok('a camp beat moves on', st.beat === 4);
    const sv = {G, MAP};
    try {
      const c = F.contract(F.BEATS[4]);
      ok('beat contract carries teach and f34', c.teach && c.f34 === 'b5' && c.pay === 300 && c.obj === 'escort');
      { const m0 = META.f34; META.f34 = {beat: 4, log: []};
        try { const a = F.contract(F.BEATS[4]), b2 = F.contract(F.BEATS[4]); a.place = 'x';
          ok('R4: a retry marches the same job (host, place, patron), as a fresh copy', b2.host === META.f34.jobs.b5.host && b2.place === META.f34.jobs.b5.place && b2.patron === META.f34.jobs.b5.patron && F.contract(F.BEATS[4]).place !== 'x'); }
        finally { META.f34 = m0; } }
      const r0 = makeContract('rescue', 1); r0.seed = 4242;
      const m0 = generateMap(r0), r1 = Object.assign({}, r0, {teach:{cages:2}}), m1 = generateMap(r1);
      ok('teach.cages trims the cages (' + m0.cages.length + ' -> ' + m1.cages.length + ')', m0.cages.length > 2 && m1.cages.length === 2);
      let calls = 0; const se = spawnEnemy; spawnEnemy = () => { calls++; return null; };
      try {
        G = {contract:{teach:{noAmbient:true}, tier:1}, enemies:[], obj:'hunt', spawnClock:0, sec:0, alarm:0, frame:0};
        spawn(); ok('teach.noAmbient stops ambient spawns', calls === 0);
        const nt = note; let said = 0; note = () => { said++; };
        try {
          G = {obj:'hunt', contract:{f34:'b1'}, camps:[], enemies:[{dead:true}, {dead:false}], kills:4, over:false};
          const a = F.clearWin(); G.enemies = []; const b = F.clearWin(), w = G.winT;
          G = {obj:'hunt', contract:{f34:'b3'}, camps:[{done:false}], enemies:[], kills:5, over:false}; const c = F.clearWin();
          G = {obj:'hunt', contract:{}, camps:[], enemies:[], kills:5, over:false}; const d = F.clearWin();
          ok('b1: a Founding Hunt with no camps is won when every foe is dead; camps or a normal contract keep the old rule', !a && b && w === 150 && said === 1 && !c && !d);
        } finally { note = nt; }
      } finally { spawnEnemy = se; }
      const bk = Object.keys(BESTIARY).find(k => BESTIARY[k].boss), nk = Object.keys(BESTIARY).find(k => !BESTIARY[k].boss);
      G = {contract:{teach:{enemyCap:3, traps:1}}, enemies:[{k:bk}, {k:nk}, {k:nk}, {k:nk}, {k:nk}], traps:[{enemy:true}, {enemy:true}, {enemy:false}]};
      F.applyTeach();
      ok('teach.enemyCap keeps the boss and cuts the rest', G.enemies.length === 3 && G.enemies[0].k === bk);
      ok('teach.traps keeps own traps, cuts enemy ones', G.traps.length === 2 && G.traps.filter(x => x.enemy).length === 1);
    } catch (e){ ok('no throw: ' + e.message, false); }
    finally { G = sv.G; MAP = sv.MAP; }
    // step 1b, the Sun Elf Exiles (in the tables only in a Founding save)
    { const had = !!FACTIONS[F.SUN], w = F.wantSun;
      try { F.wantSun = () => false; F.syncSun(); const a = !FACTIONS[F.SUN] && !NO_RAIDERS.includes(F.SUN) && !Object.values(REGIONS).some(r => r.factions.includes(F.SUN));
        F.wantSun = () => true; F.syncSun(); const b = !!FACTIONS[F.SUN] && NO_RAIDERS.includes(F.SUN);
        ok('the Exiles leave the tables outside a Founding save and come back in one', a && b); }
      finally { F.wantSun = w; if (had) F.addSunElves(); } }
    {
      const sm = typeof META !== 'undefined' ? META.standing : undefined, sG = G;
      try {
        const L = F.sunLines();
        ok('Sun Elf Exiles: names read from CAMPAIGN_LINES.sunElves', FACTIONS[F.SUN].name === L.name && FACTIONS[F.SUN].patron === L.patron && PATRONS.includes(L.patron) && HOSTAGE_FOLK[F.SUN] === L.folk);
        ok('Sun Elf Exiles: rival frostvault one way, never raiders, in the Marches and Freelands', FACTION_RIVAL[F.SUN] === 'frostvault' && FACTION_RIVAL.frostvault === 'mendor' && NO_RAIDERS.includes(F.SUN) && REGIONS.marches.factions.includes(F.SUN) && REGIONS.freelands.factions.includes(F.SUN));
        ok('every faction has a FACTION_LOOK seal', Object.keys(FACTIONS).every(k => FACTION_LOOK[k] && FACTION_LOOK[k].at));
        ok('the patron title maps back to the faction', factionOfPatron(L.patron) === F.SUN);
        ok('adding twice changes nothing', !F.addSunElves() && PATRONS.filter(x => x === L.patron).length === 1);
        META.standing = {};
        ok('a missing key reads 0, no perk, no Hostile', standing(F.SUN) === 0 && !F.sunAllied() && !F.sunHostile());
        META.standing = {sunelves: 2}; ok('+2 turns the perk on', F.sunAllied());
        const m = {state:'up', con:2, x:0, y:0, p:{name:'Test', id:'t1'}};
        G = {sunRally:true, sunRallyUsed:false, flash:0, downedIds:new Set(), squad:[], fx:[], msgs:[]};
        dropMate(m, 5);
        ok('Sunlit Rally: the first mate to fall stays up at 1 Condition', m.state === 'up' && m.con === 1 && G.sunRallyUsed);
        G.shake = 0; G.moraleCd = 9; dropMate(m, 5);
        ok('Sunlit Rally: once a contract (the second falls)', m.state === 'bleeding');
        META.standing = {sunelves: -2};
        const rr = Array.from({length:60}, () => rollRecruit());
        ok('Hostile (-2): no Sun or Grey Elf in the hire line (60 rolls)', F.sunHostile() && rr.every(x => !F.ELVES.includes(x.race)));
      } catch (e){ ok('Sun Elf rows, no throw: ' + e.message, false); }
      finally { if (typeof META !== 'undefined') META.standing = sm; G = sG; }
    }
    // step 2, beats 1-3 (on a scratch META, never saved)
    { const sm = META;
      try {
        META = freshMeta(); META.f34 = {beat:0, log:[]};
        F.cast(F.BEATS[0]);
        ok('b1: Cayde leads alone (Human Edelos Folk Hero)', META.leader && META.leader.name === 'Cayde' && META.leader.spec === 'FOLK_HERO' && META.leader.f34cayde && !META.roster.length);
        F.cast(F.BEATS[1]); const h = F.friend('hal'), pn = F.friend('pinch');
        ok('b2: Hal (Soldier) and Pinch (Scoundrel) wait in the roster', h && pn && h.spec === 'SOLDIER' && pn.spec === 'SCOUNDREL' && h.name === (LINES().hal || {}).name);
        F.cast(F.BEATS[1]); ok('b2 again: no second Hal or Pinch', META.roster.length === 2);
        const L = makeLeader('DWARF', 'FREEMAN', 'SOLDIER', 'Test'); F.crown(L);
        ok('b3: the built Leader leads, Cayde takes the chair', META.leader === L && META.master.hero === 'cayde' && META.f34.leader === true);
        ok('b3: the squad is Hal and Pinch', F.squad().length === 2);
        META.leader = null; META.f34.beat = 2; const sc = F.card; F.card = () => {}; try { F.go(); } finally { F.card = sc; }
        ok('b3: a fallen Leader is built again', META.f34.leader === false && META.leader && META.leader.f34cayde);
      } catch (e){ ok('step 2 rows, no throw: ' + e.message, false); }
      finally { META = sm; }
    }
    // step 3, beats 4-7 (scratch META, saveMeta and the card stubbed; nothing saved, nothing launched)
    { const sm = META, sv = {save: saveMeta, card: F.card, sd: startDeployment, G, MAP}; let shown = null, launched = null;
      try {
        META = freshMeta(); META.f34 = {beat:3, log:[]};
        saveMeta = () => {}; F.card = (t, b, btn) => { shown = {t, b, btn}; }; startDeployment = (c, ids) => { launched = {c, ids}; };
        META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); F.crown(META.leader); F.cast(F.BEATS[2]);
        const sw0 = window.T45 && T45.sw && T45.sw.hub; if (window.T45 && T45.sw) T45.sw.hub = false;   // these three rows are F34's own b4 card (shown when the hub step is switched off); Lessons off now opens the Campfire hub too (s6-15b 13); Act II (B45) has its own rows
        F.go();
        const lo = window.ARM ? ARM.loadoutOf(META.leader) : META.gear;
        ok('b4: the charter kit is worn (Brigandine, Heavy Shields) and the purse is 850 - 200', lo.armour === 'brigandine' && lo.shield === 'heavyshield' && META.treasury === 650);
        ok('b4: the card offers CONTINUE and a look round the camp', shown && /F34\.next\('done'\)/.test(shown.btn) && /F34\.visit\(\)/.test(shown.btn));
        F.go(); ok('b4 again: the kit is issued once', META.treasury === 650 && (!window.ARM || ARM.total('brigandine') === 1));
        if (window.T45 && T45.sw){ if (sw0 === undefined) delete T45.sw.hub; else T45.sw.hub = sw0; }
        F.next('done'); ok('b5: the Escort marches (pay 300, the Leader plus Hal and Pinch)', META.f34.beat === 4 && /F34\.play\(\)/.test(shown.btn));
        F.play(); ok('b5: startDeployment gets the escort, f34 b5, two mates', launched && launched.c.obj === 'escort' && launched.c.f34 === 'b5' && launched.c.pay === 300 && launched.ids.length === 2);
        F.next('victory'); ok('b8: the gate card (MAN THE GATE) comes straight after the escort (G2)', META.f34.beat === 5 && /MAN THE GATE/.test(shown.btn) && /12 of the town watch/.test(shown.b));
        // step 4, the gate beats
        launched = null; F.play(); const c1 = launched && launched.c;
        ok('b8: a T1 gate raid, 2 min, the Hollow, Varnholt gate map, 12 on the wall', c1 && c1.obj === OBJ_DEFEND && c1.tier === 1 && c1.minutes === 2 && c1.host === F.GATE_HOST
           && c1.f34 === 'b8' && c1.f34gate && c1.force30 && c1.towers30 && c1.wall30 === 12 && !c1.script30 && launched.ids.length === 2);
        if (window.DEF30){
          const M = generateMap(Object.assign({}, c1, {seed:5}));
          ok('b8: DEF30 builds the gate map with two towers and no palisade facility', !!M.def30 && M.towers.length === 2 && !has('palisade'));
          ok('b8: twelve stand on the wall (militia fill the gap)', DEF30.pickArchers(c1.wall30, c1.wall30).length === 12);
        }
        { const IB = i => F.BEATS.findIndex(x => x.id === i);
          ok('G2: the order is C, D, C, D, C, D (b5, b8, b5b, b9, b6, b7, b10, b11)', F.BEATS.map(x => x.id).join() === 'b1,b2,b3,b4,b5,b8,b5b,b9,b6,b7,b10,b11' && IB('b8') === 5 && IB('b5b') === 6 && IB('b9') === 7);
          let s2 = {beat:IB('b8'), log:[]}; F.step(s2, 'breached'); ok('b8: a breached gate moves on to the next job (b5b), rushed (G2: a lost defence never skips a contract)', s2.beat === IB('b5b') && s2.rush === true);
          s2 = {beat:IB('b9'), log:[]}; F.step(s2, 'fallen'); ok('b9: a lost defence moves on to b6, rushed', s2.beat === IB('b6') && s2.rush === true);
          s2 = {beat:IB('b8'), log:[]}; F.step(s2, 'withdrawn'); ok('b8: leaving the gate is a lost defence, not a held one', s2.beat === IB('b5b') && s2.rush === true);
          s2 = {beat:IB('b8'), log:[]}; F.step(s2, 'victory'); ok('b8: a held gate does not rush the next job', s2.beat === IB('b5b') && !s2.rush);
          { const sv = META.f34, sr = F.RUSH;
            try { META.f34 = {beat:IB('b5b'), log:[{id:'b8', r:'fled'}], rush:true}; const bb = F.BEATS[IB('b5b')], cc = F.contract(bb);
              ok('rushed: the b5b job pays half (300 -> 150) and says so', cc.pay === 150 && cc.rushed && F.rushed(bb) && F.leadPay(F.BEATS[IB('b6')]) === 140);
              F.RUSH = false; ok('F34.RUSH = false: the next job pays in full', F.contract(bb).pay === 300 && !F.rushed(bb)); F.RUSH = true;
              F.step(META.f34, 'fallen'); ok('a lost rushed job is replayed and stays rushed', META.f34.beat === IB('b5b') && META.f34.rush === true);
              F.step(META.f34, 'victory'); ok('winning the rushed job clears the rush', META.f34.beat === IB('b9') && !META.f34.rush);
            } finally { META.f34 = sv; F.RUSH = sr; } }
        }
        { const sv = META.f34, b10 = F.BEATS.find(x => x.id === 'b10'), g0 = G, sn = F.slotNow;
          try {
            META.f34 = {beat:10, log:[{id:'b8', r:'fled'}]}; let k = F.gateContract(b10);
            ok('Keep: a lost or abandoned gate makes b10 the Keep fight (early breach)', F.gateLost() && k.f34keep && k.script30.breachAt === F.KEEP.breachAt && /Keep/.test(k.title) && !/\{[mw]\}/.test(k.brief));
            META.f34 = {beat:10, log:[{id:'b8', r:'victory'}, {id:'b9', r:'victory'}]}; k = F.gateContract(b10);
            ok('Keep: two held gates keep the scripted breach at 80%', !F.gateLost() && !k.f34keep && k.script30.breachAt === 0.8);
            F.slotNow = SAVE_KEY; G = {contract:{f34gate:true, f34:'b8'}, obj:'drill'};
            ok('Keep: the withdraw box warns on the wall, not at the Keep or in a camp raid', F.onWall() && (G.contract.f34 = 'b10', !F.onWall()) && (G.contract = {obj:'defence'}, !F.onWall()));
          } finally { META.f34 = sv; G = g0; F.slotNow = sn; }
        }
        F.next('victory'); ok('b5b: the Hunt follows the held gate (MARCH, the next job)', META.f34.beat === 6 && F.BEATS[META.f34.beat].id === 'b5b');
        launched = null; F.play(); const j2 = launched && launched.c;
        ok('b5b: a T1 Hunt for 300 gp against the deserters, tagged b5b, two mates', j2 && j2.obj === 'hunt' && j2.f34 === 'b5b' && j2.pay === 300 && j2.tier === 1 && !j2.rushed && launched.ids.length === 2);
        F.next('victory'); ok('b9: the second assault card (no Leads round before it)', META.f34.beat === 7 && /MAN THE GATE/.test(shown.btn) && !/pickLead/.test(shown.b));
        const slot0 = F.slotNow; F.slotNow = SAVE_KEY;
        try {
          launched = null; F.play(); const c2 = launched && launched.c;
          ok('b9: a T2 gate raid, 3 min', c2 && c2.obj === OBJ_DEFEND && c2.tier === 2 && c2.minutes === 3 && c2.f34 === 'b9');
          let ln2 = []; G = {def30:{ko:new Set([{kind:'militia'}, {kind:'militia'}, {kind:'mate'}]), breach:true}};
          F.gateDebrief(c2, 'victory', ln2);
          ok('b9: militia knocked off the wall are lost to the next defence (12 -> 10)', META.f34.wall === 10 && ln2.some(x => /carried off the wall/.test(x)) && ln2.some(x => /Keep/.test(x)));
          ok('b9: a breached gate says the next job is rushed (half pay)', ln2.some(x => /half a day/.test(x)) || !F.RUSH);
          G = {contract:c2, result:'victory', def30:{breach:false}}; leaveDebrief();
          ok('b6: Leads follows the second assault, two offers', META.f34.beat === 8 && /pickLead\('rescue'\)/.test(shown.b) && /pickLead\('raid'\)/.test(shown.b) && /280 gp/.test(shown.b));
          launched = null; F.pickLead('rescue');
          ok('b6 rescue: a T1 Rescue for the Exiles, pay 280, no patron faction', launched && launched.c.obj === 'rescue' && launched.c.f34lead === 'rescue' && launched.c.hostFaction === (FACTIONS[F.SUN] ? F.SUN : 'suderia') && launched.c.pay === 280 && !launched.c.faction);
          const lc = F.leadContract('raid'); ok('b6 raid: a T1 Hunt, pay 280', lc.obj === 'hunt' && lc.pay === 280 && lc.f34lead === 'raid' && !lc.faction);
          const sun = FACTIONS[F.SUN] ? F.SUN : 'suderia'; META.standing = {}; let ln = [];
          F.leadDebrief(lc, 'victory', ln);
          ok('b6 raid won: -1 with the Exiles and the first spoils card the camp lacks', standing(sun) === -1 && ln.some(x => /Spoils/.test(x)) && (window.ARM ? ARM.has(F.SPOILS[0]) : true));
          META.standing = {}; ln = []; F.leadDebrief(lc, 'fled', ln);
          ok('b6 raid fled: the withdrew line, no Standing, no card', standing(sun) === 0 && ln.length === 1 && !ln.some(x => /Spoils/.test(x)));
          { const LL = LINES().leads || {}; ok('b6 card: the frame shows', (!LL.frame || shown.b.includes(esc(LL.frame)))); }
          META.f34.lead = 'rescue'; F.next('fallen'); ok('b6: a lost lead still moves on (the story goes on)', META.f34.beat === 9);
          META.leader.level = 2;
          const hal = F.friend('hal'); if (hal) hal.drills = {};
          const drillsOn = F.drillsOn(); F.go();
          ok('b7: the level card names Level 2' + (drillsOn ? ' and offers free drills' : ''), /Level 2/.test(shown.b) && (!drillsOn || /freeDrill\(/.test(shown.b)));
          if (drillsOn){
            const tr = META.treasury, key = F33.DRILLS[0].key;
            ok('b7: one free drill, no gold, no sit-out', F.freeDrill(hal.id, key) && hal.drills[key] && META.treasury === tr && !(hal.resting > 0));
            ok('b7: only once', !F.freeDrill(F.friend('pinch').id, key) && /has the drill/.test(shown.b));
            ok('b7: the Leader is Level 2 (Act III blocker 4)', (META.leader.level | 0) >= 2 && META.f34.lv2 && /Level 2/.test(shown.b));
            { const DL = F.drillWords(); ok('b7: the Q16/Q17 words, the Leader still needs the click, no {token} left', (!DL.levelDone || (/only when you click/.test(shown.b) && !/\{\w+\}/.test(shown.b))) && (!DL[key] || shown.b.includes(esc(DL[key].desc)))); }
          }
          F.next('done'); ok('b10: the Keep card follows Level 2', META.f34.beat === 10 && /MAN THE GATE/.test(shown.btn));
          launched = null; F.play(); const c3 = launched && launched.c;
          ok('b10: a T3 gate raid, 4 min, 10 on the wall, the breach scripted at 0.8 (both gates held)', c3 && c3.tier === 3 && c3.minutes === 4 && c3.script30 && c3.script30.breachAt === 0.8 && !c3.f34keep && c3.wall30 === 10);
          ok('b10: a breach shows the fall of the gate (captions and Cayde b10breach)', !(cap('b10breach') || say('cayde', 'b10breach')) || (F.breachLines(c3).length >= 1 && F.breachLines(c3)[0] === (cap('b10breach') || 'Cayde: ' + say('cayde', 'b10breach')) && !F.breachLines(c2).length && (!window.DEF30 || typeof DEF30.onEvent === 'function')));
          G = {contract:c3, result:'fallen', def30:{breach:true}}; leaveDebrief();
          ok('b10: losing the Keep moves on to the Long Road', META.f34.beat === 11);
        } finally { F.slotNow = slot0; }
      } catch (e){ ok('step 3-4 rows, no throw: ' + e.message, false); }
      finally { META = sm; saveMeta = sv.save; F.card = sv.card; startDeployment = sv.sd; G = sv.G; MAP = sv.MAP; }
    }
    // step 5, the Long Road (scratch META, never saved; NIGHTS put back after)
    { const sm = META, N0 = NIGHTS.slice(), slot0 = F.slotNow,
        sv = {save: saveMeta, card: F.card, rt: renderTitle, ru: refreshUI, rw: renderWorkBoard, roll: cpRoll, sfx: SFX.play};
      try {
        META = freshMeta(); META.f34 = {beat:11, log:[]}; META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Test'); META.standing = {};
        saveMeta = () => {}; renderTitle = () => {}; refreshUI = () => {}; renderWorkBoard = () => {}; SFX.play = () => {}; F.slotNow = SAVE_KEY;
        let shown = null; F.card = (t, b, btn) => { shown = {t, b, btn}; }; F.go();
        ok('b11: the road card (TO THE WAGONS)', shown && /TO THE WAGONS/.test(shown.btn) && /21 days/.test(shown.b));
        F.startRoad(); const C = META.cp;
        ok('b11: the retreat screen on the Full Chronicle (7 nights), Varnholt fell', C.part === 'retreat' && C.f34road && C.caravan30 && NIGHTS.length === 7 && !C.siegeWon && F.roadOn());
        { const el = document.getElementById('topbar'), h0 = el && el.innerHTML, tb = () => { renderTopbar(); return el ? el.innerText.replace(/\s+/g, ' ') : ''; };
          try { C.day = 0; const a = tb(); C.part = 'kalloon'; C.day = 25; const k = tb(); C.part = 'lost'; const l = tb(); C.part = 'retreat'; C.day = 0;
            ok('GD: top bar from the Work Orders camp to Kalloon: Night 0 / 7, then Night 7 / 7, never a Day or / 21', !el || (/Night 0 \/ 7/.test(a) && /Night 7 \/ 7/.test(k) && /Night 7 \/ 7/.test(l) && ![a, k, l].some(t => /Day |\/ 21/.test(t)))); }
          finally { if (el) el.innerHTML = h0; } }
        ok('b11: the town map behind the retreat screen builds (every gate and wall down)', Object.keys(STRUCTS).every(k => C.st[k] && C.st[k].hp === 0) && (() => { try { return !!generateVarnholt({assault:0}); } catch (e){ return false; } })());
        ok('b11: no Dust Cloaks recruiter on the retreat screen in 616', !/Dust Cloaks recruiter/.test(retreatHTML()) && retreatHTML().includes(esc(cap('b11') || 'The road to Artemis')));
        ok('the 7 nights spread over 21 days', F.roadDay(1) === 1 && F.roadDay(7) === 21 && F.roadDay(2) === 4 && [1, 2, 3, 4, 5, 6, 7].map(F.roadDay).join() === '1,4,8,11,14,18,21');
        C.slotPick = ['larder', 'infirmary', Object.keys(WAGON_SLOTS).find(k => k !== 'larder' && k !== 'infirmary')]; startRoad();
        ok('the road starts: Night 1, Day 1, column 16 (a day-1 road event may move it by 1), the first week caption', C.part === 'road' && C.night === 1 && C.day === 1 && Math.abs(C.column - 16) <= 1 && !!RL().week1 && C.dayNews.some(x => x.includes(esc(RL().week1))));   // P23-VOICE: the key, not the ND's wording
        ok('the header reads Night 1 of 7 and no Day count (GD N3b)', /Night 1 of 7/.test(storyDayHTML()) && !/Day \d+ of 21/.test(storyDayHTML()));
        C.lastFight = 'night'; storyAfterFight();
        ok('Night 2 is Day 4; the gap before it is its own line (ND), the quiet day only a fallback', C.night === 2 && C.day === 4 && /^Two days in the trees/.test(C.dayNews[0]) && C.dayNews.some(x => /Rust-Pikes/.test(x)));
        C.orders = 2; C.hired = false; cpRoll = () => 'miss'; workOrder('parley');
        ok('Night 2: the first Parley is a sure success', (C.offer30 || []).length === 2 && C.f34parley);
        C.offer30 = null; C.orders = 2; workOrder('parley');
        ok('Night 2: a second Parley rolls as usual', !(C.offer30 || []).length);
        {
        META.standing = {sunelves: -2}; C.orders = 2; cpRoll = () => 'full'; workOrder('parley');
        ok('Exiles Hostile: the Parley brings no offers and costs no order', !(C.offer30 || []).length && C.orders === 2 && C.log.some(x => /Elders will not speak/.test(x.t || x)));
        META.standing = {};
        ok('Night 3: Sigrún is a Parley commander', BESTIARY[F.SIGRUN] && PARLEY_COMMANDERS.includes(F.SIGRUN) && !BESTIARY[F.SIGRUN].summons && BESTIARY[F.SIGRUN].boss);
        }
        C.night = 4; C.lastFight = 'night'; const n0 = META.roster.filter(p => !p.f45witch).length; storyAfterFight();
        const mg = META.roster.find(p => p.f34caster);
        ok('Night 5: Day 14, nobody joins (PD-38: the Mage joins at b7)', C.night === 5 && C.day === 14 && !mg && META.roster.filter(p => !p.f45witch).length === n0);   // Long Road pass 1: the Witch row is Night 4, so the Witch (D45) may join here; the Mage may not
      } catch (e){ ok('step 5 rows, no throw: ' + e.message, false); }
      finally { META = sm; NIGHTS.length = 0; NIGHTS.push(...N0); F.slotNow = slot0; saveMeta = sv.save; F.card = sv.card; renderTitle = sv.rt; refreshUI = sv.ru; renderWorkBoard = sv.rw; cpRoll = sv.roll; SFX.play = sv.sfx; }
    }
    // step 6: tips and Field Notes
    { const sm = META, sv6 = {save: saveMeta, tip: window.tip, slot: F.slotNow, note: note};
      try {
        META = freshMeta(); saveMeta = () => {}; META.settings = {tips: true}; META.tipsSeen = {};
        const T = LINES().tips || {};
        {
          ok('every Narrative tip is in the one TIPS table; a key the game has keeps its own text',
            Object.keys(T).every(k => TIPS[k]) && (!T.trap || TIPS.trap !== T.trap) && TIPS.longRoad === T.longRoad);
          ok('Field Notes is a tab in the Scribe\'s book', !!(window.__c25ready && /data-c25="fieldnotes"/.test(CHRONICLE25.strip('chronicle', false))));
        }
        META.tipsSeen = {};
        ok('Field Notes, empty: the empty line', F.fieldNotes().list.length === 0 && F.fieldNotesHTML().includes(esc((LINES().fieldNotes || {}).empty || 'Nothing here yet.')));
        const tot = Object.keys(TIPS).filter(k => TIPS[k]).length;
        F.seeTip('gate'); F.seeTip('armoury'); F.seeTip('gate');
        const N = F.fieldNotes(), h = F.fieldNotesHTML();
        ok('card tips count once, in the order seen; Seen 2 of ' + tot, N.list.map(x => x.k).join() === 'gate,armoury' && N.total === tot
          && h.includes('Seen 2 of ' + tot + '.') && h.indexOf('data-fn="gate"') < h.indexOf('data-fn="armoury"'));
        META.settings.tips = false;
        ok('Settings > Tips off: no card tip, nothing marked', !F.seeTip('sallyGate') && !META.tipsSeen.sallyGate);
        META.settings.tips = true;
        if (window.DEF30 && DEF30.onEvent){
          const got = [], sn = note; note = t => got.push(t); META.f34 = {beat:10, log:[]}; F.slotNow = SAVE_KEY;
          const cB = {f34gate:true, f34:'b10'}, bl = F.breachLines(cB);
          DEF30.onEvent('breach', cB); DEF30.onEvent('ram', {f34:'b5'});
          DEF30.onEvent('breach', cB);
          ok('gate defence: any b10 breach notes the fall of the gate, then gateFalls and keepFight, once; a normal raid notes nothing (QA A)',
            got.join('|') === bl.concat(['Tip: ' + TIPS.gateFalls, 'Tip: ' + TIPS.keepFight].concat(TIPS.sallyGate ? ['Tip: ' + TIPS.sallyGate] : [])).join('|') && META.tipsSeen.keepFight);
          got.length = 0; F.slotNow = 'elsewhere'; DEF30.onEvent('start', {f34gate:true});
          ok('outside the Founding slot no fight tip fires', got.length === 0); note = sn;
        }
      } catch (e){ ok('step 6 rows, no throw: ' + e.message, false); }
      finally { META = sm; saveMeta = sv6.save; window.tip = sv6.tip; F.slotNow = sv6.slot; note = sv6.note; }
    }
    // D2: Hal and Pinch cannot die in the Founding; a hire can
    { const sv = {G: window.G, act: F.active};
      try {
        const hal = {id: 1, f34: 'hal', name: 'Hal'}, maud = {id: 3, f34: 'maud', name: 'Maud'};
        F.active = () => true;
        ok('D2: Hal is kept, Maud is not', F.d2(hal) && F.d2({f34: 'pinch'}) && !F.d2(maud) && !F.d2(null));
        F.active = () => false; ok('D2: outside the Founding Hal can die', !F.d2(hal)); F.active = () => true;
        const mh = {p: hal, state: 'bleeding', bleedT: 479, x: 0, y: 0}, mm = {p: maud, state: 'bleeding', bleedT: 5, x: 0, y: 0};
        G = {squad: [mh, mm], over: true};
        try { updateMates(false); } catch (e) {}
        ok('D2: in the fight Hal\'s Bleeding Out clock is held back', mh.bleedT < 480 && mm.bleedT !== 1);
        { const ln = ['<p class="good">Hal recovers fully (injury roll 6).</p>']; G = {injDice: [{label: 'Hal', text: 'RECOVERS'}]};
          F.d2Line('Hal', ln, 0);
          ok('D2: the report says Hal rests a beat, not "recovers fully"', /rests one beat/.test(ln[0]) && !/recovers fully/.test(ln[0]) && G.injDice[0].text === 'RESTS A BEAT'); }
      } catch (er){ ok('D2 rows, no throw: ' + er.message, false); }
      finally { G = sv.G; F.active = sv.act; }
    }
    // QA F-34 live test (audits/f34-live-test.md): B Sigrun, C topbar, F founding sandbox
    { const g0 = window.G;
      try {
        G = {prepT: 100}; const e = {k: F.SIGRUN, con: 55, maxCon: 55};
        ok('QA B: Sigrun takes no harm in Preparation', F.sigrunGuard(e, 20) === null);
        G = {prepT: 0};
        ok('QA B: no blow kills Sigrun before her parley; after it, she can die', F.sigrunGuard(e, 99) === 54 && F.sigrunGuard(e, 5) === 5
          && F.sigrunGuard(Object.assign({}, e, {parleyed: true}), 99) === 99 && F.sigrunGuard({k: 'renegade', con: 5}, 99) === 99);
      } catch (er){ ok('QA B rows, no throw: ' + er.message, false); }
      finally { G = g0; }
      const k0 = SAVE_KEY, fd = typeof FD !== 'undefined' ? FD : undefined;
      try {
        FD = {fromStory: true}; SAVE_KEY = STORY_SLOT; const a = F.foundSandboxed();
        SAVE_KEY = 'sim_bot'; const b = F.foundSandboxed();
        FD = {fromStory: false}; const c = F.foundSandboxed();
        ok('QA F: only the real story slot hands the founding to the main save; a sim or Founding slot is sandboxed', !a && b && !c);
      } catch (er){ ok('QA F row, no throw: ' + er.message, false); }
      finally { SAVE_KEY = k0; FD = fd; }
    }
    { const M0 = META, CY = (LINES().cayde = LINES().cayde || {}), a0 = CY.b4again, b4 = F.BEATS.find(x => x.id === 'b4');   // P23-VOICE F13a
      try { if (!CY.b4again) CY.b4again = ['again-test'];
        META = Object.assign({}, M0, {f34: {beat: 3, log: []}}); const first = F.caydeLine(b4);
        META.f34.seen = ['b4']; const later = F.caydeLine(b4);
        ok('P23-VOICE F13a: the first Varnholt card gives cayde.b4, every later visit cayde.b4again', first === say('cayde', 'b4') && later === say('cayde', 'b4again') && first !== later);
      } catch (er){ ok('P23-VOICE F13a row, no throw: ' + er.message, false); }
      try { const bt = id => F.BEATS.find(x => x.id === id), CY = LINES().cayde || {};   // gate FAIL H1: the real cayde.b11 line, no faked caption
        META = Object.assign({}, M0, {cp: {siegeWon: true}, f34: {beat: 10, log: []}}); const won = F.caydeLine(bt('b11')), tw = window.T45 && T45.fill ? T45.fill('{families}') : '20';
        META.cp = {siegeWon: false}; const lost = F.caydeLine(bt('b11')); META.cp = null; const none = F.caydeLine(bt('b11'));
        const hasF = /\{families\}/.test([].concat(CY.b11 || []).join(' '));
        ok('P23-VOICE F18: cayde.b11 fills {families} (20 after a won siege, 16 after a lost one or before the road), no raw token; lessons fill it too', !/\{families\}/.test(won + lost + none) && (!hasF || (/ 20 fam/.test(won) && / 16 fam/.test(lost) && / 16 fam/.test(none))) && String(tw) === '20');
        // gate FAIL H2: b7lost, b10keep and b9b live in cayde.* now; the keys still pick them
        const T = F.hasText, first = a => [].concat(a || []).find(x => x && String(x).trim()) || '';
        META = Object.assign({}, M0, {memorial: [], advRound: null, f34: {beat: 6, log: [{id: 'b6', r: 'defeat'}]}});
        const k7 = F.capKey(bt('b7')), y7 = F.caydeLine(bt('b7')); META.advRound = {left: 1, given: []}; const y7b = F.caydeLine(bt('b7'));
        META.advRound = null; META.f34 = {beat: 9, log: [{id: 'b8', r: 'victory'}, {id: 'b9', r: 'defeat'}]}; const k10 = F.capKey(bt('b10')), y10 = F.caydeLine(bt('b10'));
        META.f34 = {beat: 9, log: [{id: 'b8', r: 'victory'}, {id: 'b9', r: 'victory'}]}; const pre = F.b9bPre(bt('b10'));
        let g10 = ''; const fc = F.card; try { F.card = (t, bd) => { g10 = bd; }; F.gateCard(bt('b10'), ''); } finally { F.card = fc; }
        ok('gate H2: a lost lead gives b7 the b7lost line (first line when no Advancements are owed, all of it when some are); a lost gate gives b10 cayde.b10keep; a held b9 puts cayde.b9b first in Cayde’s box, not as a second box',
          (!T(CY.b7lost) || (k7 === 'b7lost' && y7 === first(CY.b7lost) && y7b === say('cayde', 'b7lost'))) && (!T(CY.b10keep) || (k10 === 'b10keep' && y10 === say('cayde', 'b10keep')))
          && (!T(CY.b9b) || cap('b9b') || (pre === say('cayde', 'b9b') && !/Cayde:/.test(g10))));
        const C9 = LINES().cayde, s0 = C9.b7lost; try { C9.b7lost = ['']; META.f34 = {beat: 6, log: [{id: 'b6', r: 'defeat'}]};   // gate 2 L4
          ok('gate 2: an emptied cayde.b7lost ([""]) falls back to b7, never "undefined"', F.capKey(bt('b7')) === 'b7' && !/undefined/.test(F.caydeLine(bt('b7')))); } finally { C9.b7lost = s0; }
      } catch (er){ ok('P23-VOICE F18 row, no throw: ' + er.message, false); }
      finally { META = M0; if (a0 === undefined) delete CY.b4again; } }
    const fail = rows.filter(r => r.startsWith('FAIL')).length;
    return {pass:rows.length - fail, fail, rows};
  };
  { const f = F.selfTest; F.selfTest = function(){ const full0 = typeof ASSAULTS !== 'undefined' && typeof FULL_ASSAULTS !== 'undefined' && ASSAULTS.length === FULL_ASSAULTS.length && ASSAULTS[0] === FULL_ASSAULTS[0];
    try { return f.apply(this, arguments); } finally { F.syncSun(); try { setChronicle(full0); } catch (e){} } }; }   // QA 57d1bd8: roadResume sets the FULL chronicle; put back what the save had (TOWN30 reads ASSAULTS)   // the test adds the Exiles; put the tables back for this save
})();
