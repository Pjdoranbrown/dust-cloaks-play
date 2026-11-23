/* ============================================================================
   INDEX 86 - BALANCE (from audits/balance.md and the user's decisions D-01, D-02)
   Loaded after the main game script in index.html. Wrap game functions or
   adjust game data the same way the Index sections do.
   Each change: a short note here (what, why, the old and new numbers) and a
   ROLLBACK line.
============================================================================ */

/* J-14 (D-01), revised: Tier 1 of the four hardest hosts, softened without changing who fights.
   Bot sim (same squad and gear, avg survival in seconds): Greenskins 35, Orcs 30, Monsters 27,
   Arcana 27 against Bandits 68 and Hollow 90+, at the same pay. Re-weighting each pool with the
   host's own troops, fewer spawns and lower Condition each moved the numbers by only 0-15s.
   What worked: on a Tier 1 contract against these four hosts, every ordinary troop moves 10%
   slower and fights at -1 Skill (melee and ranged). The pools, bosses, nests, Tier 2/3 and pay
   are untouched. Done with getters on the shared BESTIARY entries that only answer differently
   while that kind of contract is running.
   OLD: speed and skill as in BESTIARY.  NEW: speed x0.9, skill and rskill -1 (min 0).
   ROLLBACK: delete this block. */
{
  const SOFT_HOSTS = ['greenskins', 'monsters', 'orcs', 'arcana'];
  const soft = () => { try { return !!(G && G.contract && G.contract.tier === 1 && SOFT_HOSTS.includes(G.contract.host)); } catch (e) { return false; } };
  for (const k of Object.keys(BESTIARY)){
    const B = BESTIARY[k], d = Object.getOwnPropertyDescriptor(B, 'speed');
    if (B.boss || B.arch === 'fixed' || (d && d.get)) continue;
    const sp = B.speed, sk = B.skill, rs = B.rskill;
    Object.defineProperty(B, 'speed', {configurable:true, enumerable:true, get(){ return soft() ? sp * 0.9 : sp; }});
    Object.defineProperty(B, 'skill', {configurable:true, enumerable:true, get(){ return soft() ? Math.max(0, sk - 1) : sk; }});
    if (rs !== undefined) Object.defineProperty(B, 'rskill', {configurable:true, enumerable:true, get(){ return soft() ? Math.max(0, rs - 1) : rs; }});
  }
}

/* ---- J-15 (D-02): late gold sinks ----------------------------------------------------------
   Masterwork Full Plate (4,000gp) and Runed Deep-Iron Plate already exist (Index 37). Added
   here, as Quartermaster cards (they show wherever GEAR is sold), priced against the income
   model (about 530gp net a contract at contract 7-12, about 860 from 13):
     Masterwork Greatswords   650gp  Dmg 4, strips 2 armour steps (Greatswords: 160gp, strips 1)
     Masterwork Longbows      600gp  Dmg 4, range 400 (Longbows: 160gp, Dmg 3, range 370)
     Bastion Shields          400gp  Shield Pool 6 (Heavy Infantry Shields: 50gp, pool 4)
     Elven Mail              1100gp  AC 5, shift -2, Move 0, +1 Ward Token, light armour
     Destriers               900gp   speed x1.22, Mount Pool 12 (Warhorses: 480gp, pool 8)
   Facility upgrades were NOT added: every building is tied to plots, art in four holdings and
   the 3D set, which is too heavy for this pass (see audits/balance.md).
   ROLLBACK: delete the GEAR.push block. */
if (typeof GEAR !== 'undefined' && !GEAR.some(g => g.id === 'mwgreatswords')){
  if (typeof ARMOUR_LOOK !== 'undefined') ARMOUR_LOOK.elvenmail = ['#b8d0c8', 'bands'];
  if (typeof MELEE_ART !== 'undefined') MELEE_ART.mwgreatswords = 'greatsword';
  if (typeof RANGED_ART !== 'undefined') RANGED_ART.mwlongbows = 'bow';
  if (typeof B2_RANGED !== 'undefined') B2_RANGED.push('mwlongbows');
  GEAR.push(
    {id:'mwgreatswords', slot:'melee', name:'Masterwork Greatswords', cost:650, dmg:4, reach:0, crush:2, req:['blacksmith', '#blacksmith'],
     note:'Dwarf-forged blades: strip 2 steps of armour on every hit. Needs a Blacksmith run by a veteran.'},
    {id:'mwlongbows', slot:'ranged', name:'Masterwork Longbows', cost:600, dmg:4, range:400, req:['carpentry', 'blacksmith'],
     note:'Seasoned yew with steel limbs: heavier shafts and 400px range.'},
    {id:'bastion', slot:'shield', name:'Bastion Shields', cost:400, pool:6, req:['blacksmith'],
     note:'Iron-faced tower shields: Shield Pool 6.'},
    {id:'elvenmail', slot:'armour', name:'Elven Mail', cost:1100, ac:5, shift:2, mv:0, req:['blacksmith', 'leather'], light:true, ward:1,
     note:'Light mail with no Move penalty, and a Ward Token each contract.'},
    {id:'destrier', slot:'mount', name:'Destriers', cost:900, spd:1.22, pool:12, req:['stables', 'barracks'],
     note:'Armoured chargers. Faster than Warhorses, with a Mount Pool of 12 that soaks hits after the Shield Pool.'}
  );
}

/* ============================================================================
   INDEX 86b - J-01: THE NEW-PLAYER START (from audits/balance.md BAL-02, BAL-03, UX-07, UX-09)
   1. Three ready-made Leaders (The Shield, The Bow, The Medic) as large cards at the start of
      Leader creation, in the prologue and in the founding. One click sets race, class,
      specialty and opening ability, rolls a name, and lands on the signing step with
      SIGN CONTRACT and "Change anything...". They replace the three quick-start pills of
      Index 45 (same STARTERS list); "Surprise me" stays.
      OLD pills: Dwarf Freeman Soldier / Human Outcast Folk Hero / Human Devout Cleric, no ability.
      NEW: Human Freeman Soldier + Shield Wall Mastery, Human Freeman Folk Hero + Rallying Cry,
      Human Devout Cleric + Litany of the Shield (the audit's three builds).
   2. The Soldier's role label "Vanguard" clashed with the Soldier ability of the same name.
      OLD role 'Vanguard'. NEW role 'Front-liner'.
   3. Prologue charter kit: the squad is issued Studded Brigandine, Heavy Infantry Shields,
      Spears and Shortbows (200gp, taken from the 350gp kit allowance: treasury 850 -> 650).
      Gear in the kit may total at most 350gp; changing an issued piece refunds it.
      OLD: nothing issued, the whole 350gp had to be spent from the shop, with no cap.
   4. UX-07: in the prologue the top bar shows only WORK ORDERS, MANUAL, SETTINGS and MAIN MENU
      until Day 1 ends. MARKET joins on the kit day and from Day 2; ROSTER and PORTRAITS after the first assault.
   ROLLBACK: delete this section (to END INDEX 86b).
============================================================================ */
{
  SPECS.SOLDIER.role = 'Front-liner';
  const ARCH = [
    {id:'shield', name:'The Shield', race:'HUMAN', cls:'FREEMAN', spec:'SOLDIER', pick:'shieldwall', tag:'Good first pick',
     line:"Stands in front and does not move. The tough one: soaks the hits so the rest of the squad can work."},
    {id:'bow', name:'The Bow', race:'HUMAN', cls:'FREEMAN', spec:'FOLK_HERO', pick:'rally', tag:'Easy to read',
     line:"Shoots from behind the line and keeps the squad's nerve up. Quick, and good at being everywhere."},
    {id:'medic', name:'The Medic', race:'HUMAN', cls:'DEVOUT', spec:'CLERIC', pick:'litany', tag:'Keeps people alive',
     line:"Shields the line and mends the wounded. Less to look at, more to look after."}
  ];
  STARTERS.splice(0, STARTERS.length, ...ARCH);
  document.head.appendChild(Object.assign(document.createElement('style'), {textContent: `
    .arch-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:4px 0 8px;width:100%}
    .arch-card{display:flex;flex-direction:column;align-items:center;width:196px;box-sizing:border-box;background:#f3ead8;border:3px solid #6a4428;border-radius:5px;padding:8px 9px;cursor:pointer;text-align:center;color:var(--ink);box-shadow:0 4px 10px rgba(0,0,0,.25)}
    .arch-card:hover,.arch-card:focus{border-color:#b8902a;background:#fbf3df;outline:none}
    .arch-card img{height:96px;image-rendering:pixelated}
    .arch-card .ttl{font:bold 20px Georgia;color:var(--blood);margin-top:2px}
    .arch-card .who{font:italic 14px Georgia;color:var(--ink-soft)}
    .arch-card .ln{font-size:14px;line-height:1.35;margin:6px 0 8px}
    .arch-card .ab{font:bold 14px Georgia;color:#226b2a}
    .arch-card .go{margin-top:auto;font-size:14px;padding:6px 8px;width:100%}
    .arch-or{font:italic 14px Georgia;color:#6a5a44;margin:6px 0 2px;text-align:center}
    .arch-sum{background:#fff3c4;border:2px solid #b8902a;border-radius:5px;padding:10px 14px;margin:0 0 10px;max-width:520px;text-align:center;color:#3a2a10;font:14px/1.4 Georgia}
    .arch-sum b{font-size:18px;color:var(--blood)}
  `}));
  const archWho = s => `${RACES[s.race].name} ${CLASSES[s.cls].name}`;   /* F-46: the card title is the Specialty */
  const archCards = () => `<div class="arch-or" style="font-size:15px;font-style:normal;font-weight:bold;color:var(--ink-soft)">Start with a ready-made Leader</div><div class="arch-row">${STARTERS.map((s, n) => `
    <div class="arch-card" tabindex="0" role="button" onmouseenter="LV.hov={spec:'${s.spec}',cls:'${s.cls}',race:'${s.race}'};ldrHovRaw()" onmouseleave="ldrHov()" onfocus="LV.hov={spec:'${s.spec}',cls:'${s.cls}',race:'${s.race}'};ldrHovRaw()" onclick="ldrArch(${n})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();ldrArch(${n})}">
      ${img(portraitURL({race:s.race, spec:s.spec, name:'preview' + (CR.sex || 'm'), sex:CR.sex || 'm', id:9}, true))}
      <div class="ttl">${s.name}</div><div class="who">${archWho(s)}</div>
      ${s.tag ? `<span class="ldr-badge" style="margin:4px 0 0">${s.tag}</span>` : ''}
      <div class="ln">${s.line}</div><div class="ab">${b2Line('card', s.spec)}</div>
      <button class="btn gold go" tabindex="-1">CHOOSE</button></div>`).join('')}</div>
    <div class="arch-or">Or build your own, or let fate choose:</div>`;
  window.ldrArch = function(i){
    const s = STARTERS[i]; if (!s) return;
    const sex = CR.sex || (Math.random() < .5 ? 'f' : 'm');
    Object.assign(CR, {race:s.race, cls:s.cls, spec:s.spec, pick:s.pick, sex, name:randomName(s.race, sex), arch:s.id, step:'name'});
    LV.hov = null; renderCreate();
  };
  window.archChange = function(){ CR.arch = null; CR.step = 'spec'; LV.hov = null; renderCreate(); };
  { const f = ldrSel; ldrSel = function(kind){ CR.arch = null; return f.apply(this, arguments); }; }
  { const f = ldrGo; ldrGo = function(step){ if (step !== 'name') CR.arch = null; return f.apply(this, arguments); }; }
  { const f = ldrSurprise; ldrSurprise = function(){ const r = f.apply(this, arguments); CR.arch = null; return r; }; }
  { const f = renderCreate;
    renderCreate = function(){
      const r = f.apply(this, arguments);
      try {
        if (!CR) return r;
        const left = document.getElementById('ldr-left'); if (!left) return r;
        if (CR.step === 'spec' && !CR.arch){
          const bar = left.querySelector('.qbar');
          if (bar){ bar.querySelectorAll('button.qpill:not(.dice)').forEach(b => b.remove()); const sp = bar.querySelector('span'); if (sp) sp.remove(); bar.insertAdjacentHTML('beforebegin', archCards()); }
        } else if (CR.step === 'name' && CR.arch){
          const s = STARTERS.find(a => a.id === CR.arch);
          if (s) left.insertAdjacentHTML('afterbegin', `<div class="arch-sum"><b>${s.name}</b><br>${archWho(s)}. ${b2Line('sign', s.spec, {name: CR.name || s.name})}<br>Happy with that? Rename them below if you like.
            <div style="margin-top:8px"><button class="btn gold" onclick="ldrNext()">${ldrNextLabel()}</button> <button class="btn small" onclick="archChange()">Change anything…</button></div></div>`);
        }
      } catch (e) { console.error('Index 86b cards', e); }
      return r;
    };
  }

  /* ---- the prologue charter kit ---- */
  const KIT_CAP = 350, KIT_ISSUE = {armour:'brigandine', shield:'heavyshield', melee:'spears', ranged:'shortbows'};
  const kitValue = (gearObj, swap) => {
    const g = Object.assign({}, gearObj, {kits:(gearObj.kits || []).slice()});
    if (swap){ if (swap.slot === 'kit'){ g.kits = g.kits.includes(swap.id) ? g.kits.filter(x => x !== swap.id) : g.kits.concat(swap.id).slice(-2); /* 86d: a click on an equipped Specialist Kit takes it off */ } else g[swap.slot] = swap.id; }
    return [g.armour, g.shield, g.melee, g.ranged, ...g.kits, g.mount].reduce((s, id) => { const x = id && gear(id); return s + (x ? (x.cost || 0) : 0); }, 0);
  };
  const kitStage = () => { try { return inStory() && CP().part === 'kit'; } catch (e) { return false; } };
  const issueKit = () => {
    const C = CP(); if (C.kitIssued) return;
    const own = META.gear.owned; let cost = 0;
    for (const slot in KIT_ISSUE){ const id = KIT_ISSUE[slot]; if (!own.includes(id)) ARM.add(id); META.gear[slot] = id; cost += gear(id).cost; }   /* INDEX A30 */
    META.treasury -= cost; C.kitIssued = {armour:'brigandine', shield:'heavyshield'}; saveMeta();
  };
  { const f = storyMusterDone;
    storyMusterDone = function(){
      const r = f.apply(this, arguments);
      try { issueKit(); renderPanel(); renderTopbar(); } catch (e) { console.error('Index 86b kit', e); }
      return r;
    };
  }
  { const f = gearClick;
    gearClick = function(id){
      if (!kitStage()) return f.apply(this, arguments);
      const g = gear(id), C = CP(), before = META.gear.owned.includes(id);
      if (g && kitValue(META.gear, g) > KIT_CAP){
        SFX.play('nope'); try { campNote(`The Charter Kit holds at most ${KIT_CAP}gp of gear (it holds ${kitValue(META.gear)}gp now).`, 'bad'); } catch (e) {}
        return;
      }
      const old = C.kitIssued && C.kitIssued[g.slot];
      const r = f.apply(this, arguments);
      try {
        if (old && old !== id && META.gear[g.slot] === id && META.gear.owned.includes(id) && META.gear.owned.includes(old)){
          ARM.remove(old); META.treasury += gear(old).cost; delete C.kitIssued[g.slot];   /* INDEX A30 */
          saveMeta(); renderCamp(); renderTopbar();
          campNote(`${gear(old).name} handed back: +${gear(old).cost}gp.`, 'good');
        }
      } catch (e) { console.error('Index 86b refund', e); }
      return r;
    };
  }
  { const f = renderPanel;
    renderPanel = function(){
      const r = f.apply(this, arguments);
      try {
        const P = CAMP.panel; if (!P || P.kind !== 'cpkit' || !inStory()) return r;
        const d = document.querySelector('#camp-panel .desc'); if (!d) return r;
        d.innerHTML = `The Reeve has opened the town's purse for the Chapter and his town works. Your company has been issued the <b>Standard Charter Kit</b>: Studded Brigandine, Heavy Infantry Shields, Spears and Shortbows. That is a sound kit; you can begin the siege with it as it stands. The kit (200gp) is paid from the charter money; <b>${META.treasury}gp</b> is left.<br><br>You may change it at the Market today, up to <b>${KIT_CAP}gp</b> of gear (it holds ${kitValue(META.gear)}gp now). Handing back an issued piece refunds it. After today, metal must be forged at Smithy Row.`;
      } catch (e) { console.error('Index 86b kit panel', e); }
      return r;
    };
  }
  { const f = renderCamp;
    renderCamp = function(){
      const r = f.apply(this, arguments);
      try { if (kitStage()){ const ci = document.getElementById('camp-inner'); if (ci){ const w = document.createTreeWalker(ci, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes('Founding purchases: every card is open to you today.')){ n.nodeValue = n.nodeValue.replace('Founding purchases: every card is open to you today.', `Founding purchases: every card is open to you today, but the kit holds at most ${KIT_CAP}gp of gear (${kitValue(META.gear)}gp now). The issued kit's 200gp was taken from the charter money; handing a piece back refunds it.`); break; } } }   /* PL-2.3: edit the text node, not innerHTML: innerHTML rebuilt the folio tabs and killed their click handlers */ } catch (e) {}
      return r;
    };
  }

  /* ---- UX-07: the prologue's top bar, a little at a time ---- */
  { const f = renderTopbar;
    renderTopbar = function(){
      const r = f.apply(this, arguments);
      try {
        if (!inStory()) return r;
        const C = CP(); if (!['create', 'muster', 'kit', 'siege'].includes(C.part)) return r;
        const tb = document.getElementById('topbar'); if (!tb) return r;
        const roster = C.part === 'siege' && (C.assault || 0) >= 1;
        const market = C.part === 'kit' || (C.part === 'siege' && (C.day >= 2 || (C.assault || 0) >= 1) && marketOpen());
        const drop = t => (/^ROSTER$/.test(t) && !roster) || (/^PORTRAITS$/.test(t) && !roster) || (/^(MARKET|CRAFT)$/.test(t) && !market);
        tb.querySelectorAll('button.tb').forEach(b => { if (drop(b.textContent.trim())) b.remove(); });
        if (window.UX83 && UX83.folded) UX83.folded = UX83.folded.filter(b => !drop(b.textContent.trim()));
      } catch (e) { console.error('Index 86b topbar', e); }
      return r;
    };
  }
}
/* END INDEX 86b */

/* ============================================================================
   INDEX 86c - fixes from audits/balance-r2.md
   BAL2-01  Elven Mail was a trap: AC 5, shift 2, Ward 1 for 1,100gp, against the Chain Shirt
            (AC 5, shift 1, Ward 1, 240gp). OLD: AC 5, shift 2.  NEW: AC 6, shift 2, Move 0,
            Ward 1, light, still 1,100gp. It beats the Cuirass (950gp, AC 6, shift 2, Move -1) by
            Move and Ward, and stays under Half-Plate (AC 6, shift 3, Move -2, 2,200gp).
   BAL2-02  Kept the 200gp charge for the prologue kit (it is bought with the 350gp charter
            money, as the founding always was) and said so in the Market and kit text (Index 86b).
   ROLLBACK: delete this section; restore ac:5 on Elven Mail.
============================================================================ */
{
  const em = typeof GEAR !== 'undefined' && GEAR.find(g => g.id === 'elvenmail');
  if (em){ em.ac = 6; em.note = 'Light mail with no Move penalty, and a Ward Token each contract. AC 6.'; }
}
/* END INDEX 86c */

/* ============================================================================
   INDEX 86d - fixes from audits/leads/argon-beta-r3.md (R3-06)
   Confirmed real. (1) kitValue treated a click on an equipped Specialist Kit as adding it, but
   gearClick takes it off. (2) Only the issued armour and shield were refunded, so gold spent on
   an intermediate swap (Leather 70gp, then Chain Shirt) stayed spent.
   FIX: (1) edited in kitValue (Index 86b). (2) Every piece bought during the kit day is
   recorded; after each click, any such piece that is no longer equipped is handed back for
   its price. Players can try loadouts under the 350gp cap and end up paying only for what
   they wear. OLD: gold lost on every unissued swap.  NEW: none lost.
   ROLLBACK: delete this section and the one-line kitValue edit.
============================================================================ */
{
  const kitDay = () => { try { return inStory() && CP().part === 'kit'; } catch (e) { return false; } };
  const worn = id => { const g = META.gear, x = gear(id); return !!x && (x.slot === 'kit' ? g.kits.includes(id) : g[x.slot] === id); };
  const f = gearClick;
  gearClick = function(id){
    if (!kitDay()) return f.apply(this, arguments);
    const C = CP(), had = META.gear.owned.includes(id);
    const r = f.apply(this, arguments);
    try {
      C.kitBought = C.kitBought || [];
      if (!had && META.gear.owned.includes(id) && !C.kitBought.includes(id)) C.kitBought.push(id);
      const back = C.kitBought.filter(x => META.gear.owned.includes(x) && !worn(x));
      if (back.length){
        let gold = 0; for (const x of back){ ARM.remove(x); gold += gear(x).cost; }   /* INDEX A30 */
        C.kitBought = C.kitBought.filter(x => !back.includes(x));
        META.treasury += gold; saveMeta(); renderCamp(); renderTopbar();
        campNote(`${back.map(x => gear(x).name).join(', ')} handed back: +${gold}gp.`, 'good');
      }
    } catch (e) { console.error('Index 86d kit refund', e); }
    return r;
  };
}
/* END INDEX 86d */

/* ============================================================================
   INDEX 86e - SW-9: halve the Hold the Redoubt waves (Patrick, 2026-11-13: "Halve the waves")
   Bot runs (audits in archive-notes/systems.md) showed Hold spawns about 390 enemies a minute at
   Tier 1 and 860 at Tier 2 whatever the clock length, and the bot never lived to the first commander.
   OLD: every Hold wave spawned WAVES[level].burst enemies (2 to 8).
   NEW: Hold waves spawn ceil(burst x 0.5), at least 1 (1 to 4), so about 190 a minute at Tier 1.
   The gap between waves, the pool, the commanders, the clock and the pay are unchanged.
   Hold only (G.obj === 'hold'); hunts, raids, the camp defence and the story keep their waves.
   KNOB: BAL86E.k is the factor (1 = the old waves). No switch (removed in INT-1, 2026-11-15).
============================================================================ */
{
  window.BAL86E = {k: 0.5,
    selfTest(){
      const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
      const g = G, k = BAL86E.k;
      try {
        G = {obj:'hold', contract:{tier:1, host:'bandits', minutes:3}, sec:0, frame:0};
        const a = hostWave(0), b = hostWave(9);
        BAL86E.k = 1; const a0 = hostWave(0), b0 = hostWave(9);
        BAL86E.k = k; G.obj = 'hunt'; const h = hostWave(9);
        ok(a.burst === Math.max(1, Math.ceil(a0.burst * BAL86E.k)) && b.burst === Math.max(1, Math.ceil(b0.burst * BAL86E.k)), 'Hold bursts are halved: ' + [a0.burst, a.burst, b0.burst, b.burst]);
        ok(a.rate === a0.rate && b.rate === b0.rate && a.pool.length === a0.pool.length, 'gap and pool unchanged');
        ok(h.burst === b0.burst, 'a hunt keeps its full wave');
      } catch (e) { fails.push('error ' + e.message); }
      finally { G = g; BAL86E.k = k; }
      return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'Hold bursts halved, other objectives untouched'};
    }};
  if (typeof hostWave === 'function'){ const f = hostWave;
    hostWave = function(level){
      const w = f.apply(this, arguments);
      try { if (G && G.obj === 'hold' && w && w.burst) w.burst = Math.max(1, Math.ceil(w.burst * BAL86E.k)); } catch (e) {}
      return w;
    };
  }
}
/* END INDEX 86e */

/* ============================================================================
   INDEX 86f - F-30 "Hold the gate": fewer raiders at the gate (Patrick, 2026-11-13: "Yes, cut it")
   The gate raid (js/camp/defence.js) reuses the camp raid's spawn (raidSpawn: hostWave rate x 2.3, then
   burst), so about 300 raiders crowded the gate by 2.5 minutes.
   OLD: one wave every 2.3 x WAVES[level].rate frames.
   NEW: the gap between waves is divided by BAL86F.k (0.5 = twice as long a gap, half as many raiders), only for the
   gate raid (G.obj === 'defend' && G.def30). Bursts, pools, rams, ladders, bosses and the old ring raid unchanged.
   KNOB: BAL86F.k is the factor (1 = the old rate). No switch (removed in INT-1, 2026-11-15).
============================================================================ */
{
  window.BAL86F = {k: 0.5,
    selfTest(){
      const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
      const g = G, k = BAL86F.k;
      try {
        G = {obj: OBJ_DEFEND, def30: {}, contract: {tier: 1, host: 'bandits', minutes: 2}, sec: 0, frame: 0};
        BAL86F.k = 1; const a0 = hostWave(2); BAL86F.k = k; const a = hostWave(2);
        ok(a.rate === Math.round(a0.rate / BAL86F.k) && a.burst === a0.burst && a.pool.length === a0.pool.length, 'gate raid gap divided by k: ' + [a0.rate, a.rate]);
        G.def30 = null; const o = hostWave(2); ok(o.rate === a0.rate, 'the old ring raid keeps its rate');
        G.obj = 'hunt'; G.def30 = {}; const h = hostWave(2); ok(h.rate === a0.rate, 'other objectives keep their rate');
      } catch (e) { fails.push('error ' + e.message); }
      finally { G = g; BAL86F.k = k; }
      return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'gate raid spawn gap scaled, others untouched'};
    }};
  if (typeof hostWave === 'function'){ const f = hostWave;
    hostWave = function(level){
      const w = f.apply(this, arguments);
      try { if (G && G.obj === OBJ_DEFEND && G.def30 && w && w.rate) w.rate = Math.max(1, Math.round(w.rate / BAL86F.k)); } catch (e) {}
      return w;
    };
  }
}
/* END INDEX 86f */

/* ============================================================================
   INDEX 86g - SW-2: camp people stand in view, off the fire, and stop jittering (Patrick 2026-11-12, in play)
   Measured (6,000 camp frames, 5 mates, master, scribe, Leader): people stood inside the fire ellipse for hundreds of frames
   (waypoints on the fire ring plus a jitter of +-24 px landed inside it), idle people could end up inside a building's or the
   wagon's drawn rectangle, behind its base (hidden), and crowded stand points made people shuffle without arriving.
   OLD: any target, no checks (the wanderers' building deflection only slides a mover).
   NEW (camp only, never a Leader under WASD, the Bard or builders): (1) a person inside the fire ellipse, or aiming at it, is
   moved to the ring just outside; (2) an idle person (or target) hidden behind a building or the wagon is moved to a free
   spot in front of it; (3) a person pushed apart for 40 frames running picks a new stand point. Targets only: no stat,
   timer or number of the game changes.
   (4) 2026-11-14 (QA SW-2 recheck 077fc0e): seated people (OPENBAR35 role 'sit') walked straight through the fire to their
   seats. SW2.detour(q, t) gives a stand-in target on the ring beside the fire while the straight line crosses it, so they walk
   round; openbar35's seat anchor calls it. Stateless: once the line is clear the seat is the target again.
   No switch (removed in INT-1, 2026-11-15). Test: SW2.selfTest().
============================================================================ */
{
  const SW2 = window.SW2 = {fireK: 1.25, push: 40, fixed: 0};
  const fireIn = (x, y, k) => { const dx = (x - HUB.fire.x) / (28 * (k || 1)), dy = (y - (HUB.fire.y + 10)) / (16 * (k || 1)); return dx * dx + dy * dy < 1; };
  const hidden = (x, y) => {
    for (const o of campObjects()){
      if (o.kind === 'plot') continue;
      const r = objRect(o); if (x > r.x + r.w * 0.08 && x < r.x + r.w * 0.92 && y > r.y + r.h * 0.18 && y < o.y - 40) return true;
    }
    return false;
  };
  const bad = (x, y) => fireIn(x, y, SW2.fireK) || buildingBlocked(x, y) || hidden(x, y) || x < 40 || y < 80 || x > CAMP_W - 40 || y > CAMP_H - 40;
  // the nearest free spot to (x, y), looking outward and preferring the front (larger y)
  const freeSpot = (x, y) => {
    if (!bad(x, y)) return {x, y};
    for (let r = 14; r <= 140; r += 14) for (let i = 0; i < 12; i++){
      const a = Math.PI / 2 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 6), px = x + Math.cos(a) * r * 1.4, py = y + Math.sin(a) * r;
      if (!bad(px, py)) return {x: px, y: py};
    }
    return null;
  };
  SW2.free = freeSpot;
  // the walk round the fire: in the fire's own ellipse space, if the line from q to t passes inside (k 1.15), aim for a point on
  // the ring (radius 1.45) a sixth of a turn round from q, on the shorter way towards t
  SW2.detourK = 1.15;
  SW2.detour = function(q, t){
    if (!t || typeof HUB === 'undefined') return t;
    const cx = HUB.fire.x, cy = HUB.fire.y + 10, ax = 28 * SW2.detourK, ay = 16 * SW2.detourK;
    const px = (q.x - cx) / ax, py = (q.y - cy) / ay, tx = (t.x - cx) / ax, ty = (t.y - cy) / ay;
    if (tx * tx + ty * ty < 1) return t;                                     // a seat inside the ring: nothing to walk round
    const vx = tx - px, vy = ty - py, L2 = vx * vx + vy * vy; if (L2 < 1e-6) return t;
    const u = Math.max(0, Math.min(1, -(px * vx + py * vy) / L2)), mx = px + u * vx, my = py + u * vy;
    if (mx * mx + my * my >= 1) return t;                                    // the line is clear
    const a0 = Math.atan2(py, px), a1 = Math.atan2(ty, tx); let da = a1 - a0;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const a = a0 + Math.sign(da || 1) * Math.min(Math.abs(da), Math.PI / 3), r = 1.45;
    return {x: cx + Math.cos(a) * r * ax, y: cy + Math.sin(a) * r * ay};
  };
  if (typeof updatePeople === 'function'){ const f = updatePeople;
    updatePeople = function(){
      f.apply(this, arguments);
      if ((typeof G !== 'undefined' && G) || typeof inStoryNow === 'function' && inStoryNow()) return;
      try {
        for (const q of CAMP.people){
          if (q.kind === 'bard' || q.kind === 'worker' || (q.kind === 'leader' && CAMP.ctrl) || q.role === 'sit' || q.role === 'build') continue;
          if (q.tx != null && bad(q.tx, q.ty)){ const s = freeSpot(q.tx, q.ty); if (s){ q.tx = s.x; q.ty = s.y; SW2.fixed++; } }
          if (fireIn(q.x, q.y, 1) || buildingBlocked(q.x, q.y) || (!q.moving && hidden(q.x, q.y))){ const s = freeSpot(q.x, q.y); if (s){ q.x = s.x; q.y = s.y; q.tx = s.x; q.ty = s.y; SW2.fixed++; } }
          q.sw2Push = q.pushed ? (q.sw2Push || 0) + 1 : 0;
          if (q.sw2Push > SW2.push){ q.sw2Push = 0; const wp = waypoints(), w = wp[Math.random() * wp.length | 0], s = freeSpot(w.x + rnd(-30, 30), w.y + rnd(-14, 14)); if (s){ q.tx = s.x; q.ty = s.y; q.wait = rnd(90, 240); SW2.fixed++; } }
        }
      } catch (e) { console.warn('SW2', e); }
    };
  }
  SW2.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      ok(typeof HUB !== 'undefined' && typeof campObjects === 'function', 'camp globals present');
      const fx = {x: HUB.fire.x, y: HUB.fire.y + 10}; ok(bad(fx.x, fx.y), 'the middle of the fire is not a stand point');
      const s = freeSpot(fx.x, fx.y); ok(s && !bad(s.x, s.y) && Math.hypot(s.x - fx.x, s.y - fx.y) < 160, 'a free spot is found beside the fire');
      const w = campObjects().find(o => o.kind === 'wagon'); ok(bad(w.x, w.y - 20), 'the wagon base is blocked');
      const r = objRect(w), behind = {x: w.x, y: Math.max(r.y + r.h * 0.3, w.y - 56)}; ok(hidden(behind.x, behind.y) || behind.y >= w.y - 40, 'behind the wagon counts as hidden');
      { const a = {x: fx.x - 120, y: fx.y}, t = {x: fx.x + 120, y: fx.y}, d = SW2.detour(a, t);
        ok(d !== t && !fireIn(d.x, d.y, 1.2), 'a seat across the fire: the walker aims round it, not through it');
        const up = {x: fx.x + 120, y: fx.y - 80}; ok(SW2.detour(t, up) === up, 'a clear line: the seat itself is the target'); }
    } catch (e) { fails.push('error ' + e.message); }
    return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'fire, hidden spots and free spots'};
  };
}
/* END INDEX 86g */

/* ============================================================================
   INDEX 86h - SW-11(c): the camp's collision boxes follow what is drawn (bug fix, no number changes)
   SW-3 (2026-11-13) made camp buildings, plots and gate towers draw at one scale at every screen row, but the Leader's
   collision (leaderBlocked) still used the old 2D canvas width: a fixed 126 px strip (149 for the house) for every building,
   while the drawn buildings are 210 to 300 px wide (fort), so the Leader walked through the sides of every one of them.
   OLD: base strip = old canvas width x 0.8 (x 0.1 to 0.9 of objRect), 40 px deep, no collision for gate towers.
   NEW: when a building (or the wagon, or a gate tower) has been drawn, its box is the drawn sprite's rectangle: the x range is
   the drawn width less 14% each side (shadow, roof overhang), the depth is 30% of the drawn height (40 to 90 px). The rectangle is
   measured while the building is drawn (w3dDrawObj, VO3.drawProp), so it is right in the fort, the barge, the warehouse and the
   waystation. Before a building has been drawn once the old box is used. Gate towers get a 30 px deep box.
   F-42(f), 2026-11-14: the camp bard (CAMP.bardQ, on the west log at the fire) is also a body, an ellipse 20 x 12 px under his seat (SW11C.bard), so mates and the Leader
   walk round him instead of through him. No switch (removed in INT-1, 2026-11-15). Test: SW11C.selfTest().
============================================================================ */
{
  const S = window.SW11C = {box: {}, towers: {}, inset: 0.14, depthK: 0.3, dMin: 40, dMax: 90, towerDepth: 30, bard: {rx: 20, ry: 12, dy: 2}};
  // run fn() and return the destination rectangles of the images it drew (shadows, drawn 'multiply', are skipped)
  const capture = fn => {
    const c = ctx, own = Object.prototype.hasOwnProperty.call(c, 'drawImage'), proto = CanvasRenderingContext2D.prototype, orig = own ? c.drawImage : proto.drawImage, rec = [];
    const hook = function(im, ...a){
      try {
        if (this.globalCompositeOperation !== 'multiply'){
          let dx, dy, dw, dh;
          if (a.length >= 8){ dx = a[4]; dy = a[5]; dw = a[6]; dh = a[7]; } else if (a.length >= 4){ dx = a[0]; dy = a[1]; dw = a[2]; dh = a[3]; } else { dx = a[0]; dy = a[1]; dw = im.width; dh = im.height; }
          if (dw > 40 && dh > 30) rec.push([dx, dy, dw, dh]);
        }
      } catch (e) {}
      return orig.apply(this, [im, ...a]);
    };
    if (own) c.drawImage = hook; else proto.drawImage = hook;
    let res; try { res = fn(); } finally { if (own) c.drawImage = orig; else proto.drawImage = orig; }
    rec.sort((p, q) => q[2] * q[3] - p[2] * p[3]);
    return {res, big: rec[0] || null};
  };
  if (typeof w3dDrawObj === 'function'){ const f = w3dDrawObj;
    w3dDrawObj = function(o){
      if (!o || o.kind === 'plot') return f.apply(this, arguments);
      const cp = capture(() => f.apply(this, arguments));
      if (cp.res && cp.big){ const b = cp.big; S.box[holdKey() + ':' + o.id] = {l: b[0] - o.x, r: b[0] + b[2] - o.x, t: b[1] - o.y, h: b[3]}; }
      return cp.res;
    };
  }
  // js/3d/vo3.js loads after this file, so the gate-tower hook is put in when VO3 exists (now, or on load)
  const hookTowers = () => {
    if (!window.VO3 || !VO3.drawProp || VO3.drawProp.__sw11c) return;
    const f = VO3.drawProp;
    VO3.drawProp = function(kind, x, gl, o){
      if (!/gatetower/.test(String(kind))) return f.apply(this, arguments);
      const cp = capture(() => f.apply(this, arguments));
      if (cp.res && cp.big){ const b = cp.big; S.towers[holdKey() + ':' + Math.round(x) + ':' + Math.round(gl)] = {x, gl, l: b[0] - x, r: b[0] + b[2] - x, t: b[1] - gl, h: b[3]}; }
      return cp.res;
    };
    VO3.drawProp.__sw11c = true;
  };
  hookTowers(); window.addEventListener('load', hookTowers); S.hookTowers = hookTowers;
  // one rule: the base strip under a drawn rectangle
  S.strip = (ox, oy, b) => { const w = b.r - b.l, d = Math.max(S.dMin, Math.min(S.dMax, b.h * S.depthK)); return {x0: ox + b.l + w * S.inset, x1: ox + b.r - w * S.inset, y0: oy - d, y1: oy + 2}; };
  if (typeof leaderBlocked === 'function'){ const old = leaderBlocked;
    leaderBlocked = function(x, y){
      const hk = holdKey();
      for (const o of campObjects()){
        if (o.kind === 'plot') continue;
        const b = S.box[hk + ':' + o.id];
        let x0, x1, y0, y1;
        if (b){ const s = S.strip(o.x, o.y, b); x0 = s.x0; x1 = s.x1; y0 = s.y0; y1 = s.y1; }
        else { const r = objRect(o); x0 = o.kind === 'wagon' ? o.x - 46 : r.x + r.w * 0.1; x1 = o.kind === 'wagon' ? o.x + 46 : r.x + r.w * 0.9; y0 = o.y - 40; y1 = o.y + 2; }
        if (x > x0 && x < x1 && y > y0 && y < y1) return true;
      }
      for (const k in S.towers){
        if (k.indexOf(hk + ':') !== 0) continue;
        const t = S.towers[k], w = t.r - t.l;
        if (x > t.x + t.l + w * S.inset && x < t.x + t.r - w * S.inset && y > t.gl - S.towerDepth && y < t.gl + 2) return true;
      }
      // F-42(f): the camp bard sits on the west log and is a body: mates and the Leader walk round him (an ellipse under his seat)
      { try { const b = typeof CAMP !== 'undefined' && CAMP.bardQ; if (b && CAMP.people && CAMP.people.includes(b)){ const bx = (x - b.x) / S.bard.rx, by = (y - (b.y + S.bard.dy)) / S.bard.ry; if (bx * bx + by * by < 1) return true; } } catch (e) {} }
      const dx = (x - HUB.fire.x) / 28, dy = (y - (HUB.fire.y + 10)) / 16;
      return dx * dx + dy * dy < 1;
    };
  }
  // F-44(h): walking round the bard, not into him. The ellipse stops a body; this steers it: a walker whose target lies past the bard slides along
  // the ellipse's edge toward the side its target is on, and one that has not moved for 40 frames picks a new spot away from him.
  if (typeof updatePeople === 'function'){ const f = updatePeople;
    updatePeople = function(){
      let prev = null;
      try { if (typeof CAMP !== 'undefined' && CAMP.bardQ && CAMP.people && CAMP.people.includes(CAMP.bardQ)) prev = new Map(CAMP.people.map(q => [q, [q.x, q.y]])); } catch (e) {}
      const r = f.apply(this, arguments);
      if (!prev) return r;
      try {
        const b = CAMP.bardQ, cx = b.x, cy = b.y + S.bard.dy, Rx = S.bard.rx + 12, Ry = S.bard.ry + 9;
        for (const q of CAMP.people){
          if (q === b || (q.kind === 'leader' && CAMP.ctrl)) continue;
          const pv = prev.get(q); if (!pv) continue;
          const moved = Math.hypot(q.x - pv[0], q.y - pv[1]);
          const dx = q.x - cx, dy = q.y - cy, e = (dx / Rx) * (dx / Rx) + (dy / Ry) * (dy / Ry);
          const heading = q.moving !== false && (q.tx !== q.x || q.ty !== q.y);
          if (e < 1.7 && heading){
            // slide along the edge toward the target's side
            const tx = q.tx - cx, ty = q.ty - cy, cross = dx * ty - dy * tx;
            const px = -dy / Ry, py = dx / Rx, pm = Math.hypot(px, py) || 1, sgn = cross >= 0 ? 1 : -1;
            const nx = q.x + sgn * px / pm * 1.6, ny = q.y + sgn * py / pm * 1.6 * 0.7;
            const blocked = typeof leaderBlocked === 'function' && leaderBlocked(nx, ny);
            if (!blocked){ q.x = nx; q.y = ny; }
          }
          if (heading && e < 2.6 && moved < 0.15){ q._bs = (q._bs || 0) + 1; if (q._bs > 40){ q._bs = 0; const m = Math.hypot(dx, dy) || 1; q.tx = q.x + dx / m * 110 + (Math.random() - .5) * 60; q.ty = q.y + dy / m * 70 + (Math.random() - .5) * 40; q.wait = 0; } }
          else q._bs = 0;
        }
      } catch (e) {}
      return r;
    };
  }
  S.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    try {
      ok(typeof leaderBlocked === 'function' && typeof w3dDrawObj === 'function', 'hooks present');
      const b = {l: -150, r: 150, t: -200, h: 200}, s = S.strip(1000, 900, b);
      ok(Math.abs((s.x1 - s.x0) - 300 * (1 - 2 * S.inset)) < 0.01 && s.x0 < 1000 && s.x1 > 1000, 'strip is the drawn width less the inset, round the sprite: ' + JSON.stringify(s));
      ok(s.y1 - s.y0 === Math.max(S.dMin, Math.min(S.dMax, 200 * S.depthK)) + 2, 'strip depth follows the drawn height');
      const keep = S.box['__test:x']; S.box['__test:x'] = b; delete S.box['__test:x'];
    } catch (e) { fails.push('error ' + e.message); }
    return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'strip and depth'};
  };
}
/* END INDEX 86h */

/* ============================================================================
   INDEX 87e - BRAWL44 [S]: in a bar fight the squad mates attack only inside the Leader's Command Radius (F-44 m; Patrick's ruling 2026-11-14)
   Before: a mate swung or shot at any enemy in reach anywhere in the room, so the whole bar was fought by the squad whatever the Leader did.
   Now: while isBrawl() (the bar fight, the camp brawl and the Officers' Legwork brawl), a Squad Mate's target choice skips an enemy that is farther
   from the Leader than the Command Radius (G.mod.radius x BRAWL44.k). The Leader's own attacks and every other contract are untouched.
   No switch (removed in INT-1, 2026-11-15). Test: BRAWL44.selfTest().
============================================================================ */
{
  const B = window.BRAWL44 = {k: 1.0};
  if (typeof nearest === 'function'){ const f = nearest;
    nearest = function(from, reach, skip, los){
      try {
        if (typeof G !== 'undefined' && G && G.leader && typeof isBrawl === 'function' && isBrawl() && from !== G.leader && Array.isArray(G.squad) && G.squad.includes(from) && G.mod){
          const R = (G.mod.radius || 0) * B.k, L = G.leader, sk = new Set(skip || []);
          for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - L.x, e.y - L.y) > R) sk.add(e);
          return f.call(this, from, reach, sk, los);
        }
      } catch (e) {}
      return f.apply(this, arguments);
    };
  }
  B.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); }, g0 = G;
    try {
      const L = {x: 0, y: 0}, m = {x: 10, y: 0}, near = {x: 60, y: 0, dead: false}, far = {x: 400, y: 0, dead: false};
      G = {leader: L, squad: [m], enemies: [far, near], mod: {radius: 120}, contract: {obj: 'brawl'}, obj: 'brawl'};
      ok(nearest(m, 999) === near, 'a mate takes the enemy inside the radius');
      G.enemies = [far]; ok(nearest(m, 999) === null, 'a mate ignores the enemy outside the radius');
      ok(nearest(L, 999) === far, 'the Leader is not limited');
      G.obj = 'hunt'; ok(nearest(m, 999) === far, 'outside a brawl nothing changes');
    } catch (e) { fails.push('error ' + e.message); }
    finally { G = g0; }
    return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'inside the radius only, Leader free'};
  };
}
/* END INDEX 87e */

