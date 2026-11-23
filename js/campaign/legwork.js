/* js/campaign/legwork.js (INT-1 step 2, 2026-11-16): NEW (injury dice, finales, prisoners), OFFICERS' LEGWORK, STANDING DOWN, SALVAGE.
   Cut unchanged from the inline script in index.html (old lines 9289 to 10107). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   NEW - injury dice, the Charter Finales, prisoners worth taking, Cleric
   Favour and Deity Tenets, chain lightning, moving on after a collapse, and
   sharing Squad Mates and Leaders between campaigns.
============================================================================ */

/* ---------------------------------------------------------------------------
   INJURY CHECKS ON THE TABLE: every check in the debrief is thrown as a die
--------------------------------------------------------------------------- */
injuryCheck = function(maxCon, who, lines){
  const sk = clampSkill(maxCon + (has('hospital') ? 1 : 0));
  let f = rollDie(sk), reroll = '';
  if (f < 5 && mastery('hospital') && !G.hospitalReroll){ G.hospitalReroll = true; const f2 = rollDie(clampSkill(maxCon + 1));
    lines.push(`<p>The veteran in the Field Hospital re-rolls ${esc(who)}'s injury check: ${f} becomes ${f2}.</p>`); reroll = ` (re-rolled from ${f})`; f = f2; }
  const rec = (text, col) => { if (G && G.injDice) G.injDice.push({face:f, skill:sk, label:who, text:text + reroll, col}); };
  if (f > 5){ lines.push(`<p class="good">${esc(who)} recovers fully (injury roll ${f}).</p>`); rec('RECOVERS', '#8fd39a'); return null; }
  if (f === 5){ lines.push(`<p>${esc(who)} is battered and rests for one contract (injury roll ${f}).</p>`); rec('RESTS A CONTRACT', '#f0c96a'); return 'rest'; }
  const inj = INJURIES[d6() - 1];
  lines.push(`<p class="bad">${esc(who)} is maimed: <b>${inj.name}</b>: ${inj.eff} (injury roll ${f}).</p>`);
  rec(inj.name.toUpperCase(), '#ff8a7a');
  return inj.id;
};

/* ---------------------------------------------------------------------------
   THE CHARTER FINALES (Table 4.1, Milestone 10). When the ninth milestone is
   taken, the finale contract waits on the planning table until it is won.
--------------------------------------------------------------------------- */
const FINALES = {
  wealth:{title:"The Dragon's Vault Heist", obj:'extract', host:'monsters', patron:'Dwarven Syndicate Factor', place:'the extinct volcano',
          brief:"Seize the hoard in the extinct volcano where Zenif and Gorrath killed a dragon. A new wyrm has moved into its halls and sleeps on the three vaults. Crack them, then get out by the road you came in on.",
          boss:{k:'wyrm', name:'Kethrax, the Hoard-Wyrm'}},
  fame:{title:'Siege of the World Temple', obj:'hold', host:'hollow', patron:'Mendorian Order Prelate', place:'the World Temple of Mendor', minutes:10,
          brief:'A planar and undead legion marches on Mendor. Hold the World Temple until the relief column arrives. Two of its masters will come for the gate.',
          boss:{k:'devil', name:'The Herald of the Legion'}},
  liberation:{title:'The Chains of Cois Abhann', obj:'rescue', host:'bandits', patron:'Suderian Freeman Merchant', place:'Cois Abhann', hostFaction:'suderia',
          brief:"Storm the Porcelain-Masked Lord's citadel at Cois Abhann. His fleet is loading chained captives for the slave markets. Break every cage and get the freed to the road.",
          boss:{k:'vane', name:'The Porcelain-Masked Lord'}},
  dominion:{title:'Battle of the Grey Keep', obj:'hunt', host:'deserters', patron:'Minor Imperial Noble', place:'the Grey Keep',
          brief:'A rival company has taken the ruin of the Grey Keep as a stronghold. Find their camps and break every one of their captains to win the right to lead the merged bands.',
          boss:{k:'ilvaryn', name:'The Captain of the Grey Keep'}}
};
for (const k in FINALES){ const F = FINALES[k], m = AMBITIONS[k].ms[9];
  m.t = `Finale, ${F.title}: win the Charter Finale when it appears on the planning table.`;
  m.ok = c => !!(c && c.won && c.finale); }
function makeFinale(track){
  const F = FINALES[track], c = makeContract(F.obj, 3);
  Object.assign(c, {finale:true, title:F.title, host:F.host, place:F.place, patron:F.patron, faction:factionOfPatron(F.patron), edges:[], council:null, picks:0});
  if (F.minutes) c.minutes = F.minutes;
  if (F.hostFaction){ c.hostFaction = F.hostFaction; c.town = F.place; }
  c.pay = Math.round(c.pay * 2 / 5) * 5; c.brief = F.brief;
  return c;
}
const finaleDue = () => !!(META && META.ambition && META.ambition.done === 9 && META.leader);
function ensureFinale(){
  if (!finaleDue() || !META.board || META.board.some(c => c.finale)) return;
  META.board[0] = makeFinale(META.ambition.track); saveMeta();
}
{ const f = rollBoard; rollBoard = function(){ f(); ensureFinale(); }; }
{ const f = ensureMuster; ensureMuster = function(){ if (META.board) ensureFinale(); f(); }; }
{ const f = checkMilestones; checkMilestones = function(ctx, lines){ if (ctx && G && G.contract && G.contract.finale) ctx.finale = true; f(ctx, lines); }; }
// The finale's master waits on the field, harder than any commander before.
{ const f = setupContract; setupContract = function(c){
    f(c);
    if (!c.finale) return;
    const F = FINALES[META.ambition ? META.ambition.track : 'wealth'] || FINALES.wealth;
    for (const e of G.enemies) if (BESTIARY[e.k].boss){ e.con = e.maxCon = Math.round(e.maxCon * 1.4); }
    let at = G.vaults && G.vaults.length ? G.vaults[G.vaults.length - 1] : MAP.town || (G.camps && G.camps[0]) || null;
    if (c.obj === 'hold') G.finaleBoss = F.boss;                   // arrives with the second wave of commanders
    else if (at){ const e = spawnEnemy(F.boss.k, at.x + 60, at.y + 40, {dormant:true, group:GROUP++, noNem:true});
      if (e){ e.name = F.boss.name; e.con = e.maxCon = Math.round(e.maxCon * 1.6); e.parleyed = true; e.finale = true; } }
    note(`${F.title}. This is what the Chapter was chartered for.`);
  }; }
{ const f = spawnEnemy; spawnEnemy = function(k, x, y, o){
    const e = f(k, x, y, o);
    if (e && G && G.finaleBoss && BESTIARY[k].boss && G.bossesDone && G.bossesDone[1] === true && !G.finaleBossOut){
      G.finaleBossOut = true; e.name = G.finaleBoss.name; e.con = e.maxCon = Math.round(e.maxCon * 1.6); e.parleyed = true; e.finale = true; }
    return e;
  }; }

/* ---------------------------------------------------------------------------
   PRISONERS (Section 4.8, Tables 4.9 and 4.10)
--------------------------------------------------------------------------- */
const NOBLE_KINDS = ['inquisitor', 'ilvaryn'];
const NOBLE_ROWS = {1:['Disowned. Nobody wants them back.', 0], 2:['A younger child of a minor house.', 150], 3:['A younger child of a minor house.', 150],
  4:['A landed heir.', 300], 5:['A landed heir.', 300], 6:['A favoured heir, and the family knows it.', 500]};
function prDesc(pr){
  if (pr.kind === 'noble') return `<b style="color:var(--blood)">Noble:</b> ${NOBLE_ROWS[pr.roll][0]}`;
  if (pr.kind === 'commander') return pr.nemesis ? `Commander, <b style="color:#9a2a14">your nemesis</b> (escaped you ${pr.nemesis} time${pr.nemesis > 1 ? 's' : ''})` : 'Commander';
  return pr.specialist ? 'Specialist' : 'Common soldier';
}
const prRansomLabel = pr => pr.kind === 'noble' ? `Ransom ${pr.value}gp (haggle)` : `Ransom ${pr.value}gp`;
{ const f = commanderGone; commanderGone = function(e, mode){
    const n0 = G.prisoners.length; f(e, mode);
    if (mode !== 'surrender') return;
    const pr = G.prisoners[n0]; if (!pr) return;
    pr.faction = COMMANDER_FACTION[e.k] || G.contract.faction || null;
    if (e.nemesis){ pr.nemesis = e.nemesis.grudge; pr.value = 100 * (1 + e.nemesis.grudge); }
    if (NOBLE_KINDS.includes(e.k)){ pr.kind = 'noble'; pr.roll = d6(); pr.value = NOBLE_ROWS[pr.roll][1];
      showDice('Who Have You Caught?', [{face:pr.roll, skill:'1d6', label:pr.name, text:NOBLE_ROWS[pr.roll][0].split('.')[0].toUpperCase(), col:pr.roll >= 4 ? '#8fd39a' : pr.roll === 1 ? '#ff8a7a' : '#f0c96a'}], {sub:'Table 4.10: Noble Prisoners'}); }
    for (let i = n0 + 1; i < G.prisoners.length; i++){ const g = G.prisoners[i], B = BESTIARY[e.k], kinds = B.guards || [];
      const k = kinds[(i - n0 - 1) % Math.max(1, kinds.length)]; if (k && RANGED_ARCH(BESTIARY[k].arch)){ g.specialist = true; g.value = 40; g.name = 'Captured ' + BESTIARY[k].name; } }
  }; }
// Enemies who Break and are run down give themselves up: 1 prisoner for every 3 routed and cut down, up to 3.
{ const f = killEnemy; killEnemy = function(e){
    const routed = e && !e.dead && e.broken && !BESTIARY[e.k].boss, melee = G && G._melee;
    f(e);
    if (!G || !e || !e.dead) return;
    if (routed) G.routKills = (G.routKills || 0) + 1;
    if (melee) G.meleeKills = (G.meleeKills || 0) + 1; else G.otherKills = (G.otherKills || 0) + 1;
  }; }
{ const f = prisonerAct; prisonerAct = function(i, act){
    const pr = META.prisoners[i]; if (!pr) return;
    if (act === 'execute'){
      if (!gate(`Execute ${esc(pr.name)}? Standing with their faction falls by 1.`, () => prisonerAct(i, act))) return;
      META.prisoners.splice(i, 1);
      let msg = `${esc(pr.name)} is executed at dawn.`;
      if (pr.faction){ shiftStanding(pr.faction, -1, null); msg += ` Standing with ${facName(pr.faction)} falls by 1.`; }
      const sil = allClerics().filter(p => deityOf(p) === 'silean');
      if (sil.length){ META.favourDebt = (META.favourDebt || 0) + 2 * sil.length; msg += ` ${sil.map(p => esc(p.name)).join(' and ')} ${sil.length > 1 ? 'have' : 'has'} broken Silean's tenet: 2 Favour lost on the next contract.`; }
      CH_MSG = msg; SFX.play('down'); saveMeta(); renderChapter(); return;
    }
    if (act === 'ransom' && pr.kind === 'noble'){
      /* 2j: a Freeman Leader haggles a noble's ransom one step lower (Lowborn); the Skill rolled is shown so the step can be seen */
      const cut = window.CATCH2J ? CATCH2J.haggle(META.leader.cls, pr) : null, per = clampSkill(leaderStats(META.leader).per - (cut ? cut.step : 0)), r = attackDie(per, 5), full = r.out === 'solid' || r.out === 'crit', miss = r.out === 'miss';
      const row = Math.max(1, Math.min(6, pr.roll + (full ? 1 : miss ? -1 : 0))), [who, v] = NOBLE_ROWS[row];
      META.prisoners.splice(i, 1); META.treasury += v;
      let msg = `Haggling roll ${r.face} (Skill ${per}${cut ? ': ' + esc(cut.text) : ''}): ${full ? 'the family pays more than they meant to' : miss ? 'the family drives a hard bargain' : 'the family pays what was asked'}. ${who} ${esc(pr.name)} goes home${v ? ` for ${v}gp` : ', and nobody pays a penny'}.`;
      if (row === 6 && pr.faction){ shiftStanding(pr.faction, 1, null); msg += ` +1 Standing with ${facName(pr.faction)}.`; }
      CH_MSG = msg;
      showDice(`Haggling over ${esc(pr.name)}`, [{face:r.face, skill:clampSkill(per), out:r.out, ac:5, label:META.leader.name + "'s Personality"}], {result:`${who} ${v ? v + 'gp' : 'No ransom'}`, sfx:v ? 'coin' : 'nope'});
      SFX.play('pick'); checkMilestones(null); saveMeta(); renderChapter(); return;
    }
    f(i, act);
  }; }

/* ---------------------------------------------------------------------------
   CLERIC FAVOUR AND DEITY TENETS (Sections 8.3 and 9.2)
   Each Cleric serves a deity. The squad's Favour pool is 2 x Magic for every
   deployed Cleric (minimum 2 each), plus the best bonus (+1 Devout Chapter
   Master, +2 Allied with Mendor, maximum +2). Each Cure Wounds cast with
   Favour costs 1 and comes back in 8 seconds instead of 18; with nobody hurt,
   it spends 2 on a Divine Barrier (+2 Ward Tokens, +1 step for 4 seconds).
   Breaking a tenet costs 2 Favour on the next contract.
--------------------------------------------------------------------------- */
const DEITIES = {
  kai:      {name:'Kai, the Overgod', tenet:'Destroy undead abominations: never flee from the Hollow dead.'},
  ramus:    {name:'Ramus', tenet:'Never break a sworn contract or attack an enemy who has raised a white flag of Parley.'},
  silean:   {name:'Silean', tenet:'Never execute surrendering prisoners.'},
  marakyr:  {name:'Marakyr', tenet:'Never retreat in the first round.'},
  ariyan:   {name:'Ariyan', tenet:'Fight beneath the open sky: never hold a fort or a town.'},
  jasena:   {name:'Jasena', tenet:'Defend the wild from fire: never burn the field.'},
  bromos:   {name:'Bromos', tenet:'Never leave a comrade behind on the field.'},
  gilzo:    {name:'Gilzo & Rimazo', tenet:'Use munitions, traps or contraptions in every engagement.'},
  karas:    {name:'Karas', tenet:'Face enemies eye-to-eye: more kills in melee than at range.'},
  tarasha:  {name:'Tarasha the Wayfarer', tenet:'Never abandon a traveller: lose no hostage and no caravan.'},
  neleasha: {name:'Neleasha & the Veil-Mother', tenet:'Destroy the undead: never flee from the Hollow dead.'},
  valdris:  {name:'Valdris & Ixmara', tenet:'Seek hoard wealth: carry at least 25 coin home from every contract.'},
  sorvaine: {name:'Sorvaine', tenet:'Recover lost lore: open at least one chest on every contract.'}
};
const DEITY_KEYS = Object.keys(DEITIES);
function deityOf(p){ if (!p || p.spec !== 'CLERIC') return null; if (!p.deity || !DEITIES[p.deity]) p.deity = pickOf(DEITY_KEYS); return p.deity; }
const allClerics = () => [META.leader].concat(META.roster, officers()).filter(p => p && p.spec === 'CLERIC');
function personKeyOf(p){ return p === META.leader ? "'L'" : p.id; }
function deityLine(p){
  const d = deityOf(p); if (!d) return '';
  return `<div class="desc" style="text-align:left;color:#5a4a2a;font-size:14px"><b>Deity:</b> <select onclick="event.stopPropagation()" onchange="setDeity(${personKeyOf(p)},this.value)">${DEITY_KEYS.map(k => `<option value="${k}" ${k === d ? 'selected' : ''}>${DEITIES[k].name}</option>`).join('')}</select>${deityBadge(p, d)}<br><i>${DEITIES[d].tenet}</i></div>`;
}
// INT-1 stage 3 group 7: from world-depth.js, the Cleric's Devotion Rank and Covenant badge (its tables live there)
function deityBadge(p, d){
  if (typeof DEVOTION_RANK !== 'function' || typeof COVENANT === 'undefined') return '';
  const dev = p.devotion || 0, cov = COVENANT[d] || 'solar';
  const col = dev < 0 ? '#8b0000' : dev >= 2 ? '#b8860b' : dev === 1 ? '#1e6a24' : '#5a4a2a';
  return ` <span style="font-size:14px;color:${col};font-weight:bold">[${DEVOTION_RANK(dev)} · ${COVENANT_NAME[cov]}]</span>`;
}
function setDeity(key, v){
  const p = key === 'L' ? META.leader : META.roster.find(x => x.id === key) || officers().find(x => x.id === key);
  if (!p || !DEITIES[v]) return;
  if (p.deity && p.deity !== v){ META.favourDebt = (META.favourDebt || 0) + 2; }
  p.deity = v; SFX.play('pick'); saveMeta(); refreshUI();
}
{ const f = mateCardHTML; mateCardHTML = (p, extra = '') => f(p, extra + deityLine(p)); }
// Favour at the start of a contract
{ const f = startDeployment; startDeployment = function(c, ids){
    f(c, ids);
    if (!G) return;
    const cl = [];
    if (G.leader.spec === 'CLERIC') cl.push({p:META.leader, mg:G.leader.s.magic});
    for (const m of G.squad) if (m.spec === 'CLERIC') cl.push({p:m.p, mg:m.s.magic});
    G.deployedClerics = cl.map(x => x.p);
    if (!cl.length){ G.favour = G.favourMax = 0; return; }
    const bonus = Math.min(2, Math.max(cmIs('DEVOUT') ? 1 : 0, allied('mendor') ? 2 : 0, mastery('fortresschurch') ? 2 : 0));   /* Index 37 */
    G.favourMax = cl.reduce((a, x) => a + 2 * Math.max(1, x.mg || 0), 0) + bonus;
    const debt = META.favourDebt || 0; META.favourDebt = 0;
    G.favour = Math.max(0, G.favourMax - debt);
    if (debt) note(`Broken tenets weigh on the Clerics: ${Math.min(debt, G.favourMax)} Favour lost.`);
    G.injDice = [];
  }; }
{ const f = useAbility; useAbility = function(spec){
    if (spec !== 'CLERIC' || !G || !G.abil || !G.abil.CLERIC) return f(spec);
    const a = G.abil.CLERIC, before = a.cd, fav = G.favour > 0;
    G.favourCast = fav && before <= 0;
    f(spec);
    if (before <= 0 && a.cd > 0 && fav){ G.favour--; a.cd = a.max = Math.round(8 * 60 * (1 - 0.15 * (G.quicken || 0))); }
  }; }
function anyoneHurt(){
  const L = G.leader;
  if (L.down || L.con < L.maxCon || L.wounds < L.maxWounds) return true;
  return G.squad.some(m => m.state !== 'dead' && (m.state !== 'up' || m.con < m.maxCon));
}
{ const f = ABIL_FX.CLERIC; ABIL_FX.CLERIC = function(u){
    if (G.favourCast && !anyoneHurt() && G.favour >= 1){
      G.favourCast = false; G.favour--;
      addWard(2); G.blessT = Math.max(G.blessT || 0, 240);
      G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:G.mod.radius, life:22, c:'#ffe680'});
      pop(u.x, u.y - 46, 'DIVINE BARRIER', '#ffe680'); return;
    }
    G.favourCast = false; f(u);
  }; }
// Tenets broken during the contract
{ const f = parlayChoice; parlayChoice = function(ch){
    if (ch === 'fight' && G){ if ((G.deployedClerics || []).some(p => deityOf(p) === 'ramus')) G.tenet = Object.assign(G.tenet || {}, {ramus:'refused a white flag'}); if ((G.deployedClerics || []).some(p => deityOf(p) === 'silean')) G.tenet = Object.assign(G.tenet || {}, {silean:'refused mercy to a surrendering foe'}); }
    f(ch);
  }; }
{ const f = applyLoot; applyLoot = function(kind, at){ G.chests = (G.chests || 0) + 1; if (['cusser','smoke','scroll','storm'].includes(kind)) G.contrapt = true; f(kind, at); }; }
{ const f = raidSetTrap; raidSetTrap = function(){ const n = G && G.traps ? G.traps.length : 0; f(); if (G && G.traps && G.traps.length > n) G.contrapt = true; }; }
function tenetBreaches(withdrew){
  const c = G.contract, out = {}, won = G.result === 'victory';
  const fled = !won && G.result !== 'withdrawn';
  if (withdrew) out.ramus = 'broke a sworn contract by withdrawing';
  if (withdrew && G.sec < 7) out.marakyr = 'retreated in the first round';
  if (c.host === 'hollow' && (withdrew || fled)){ out.kai = 'fled from the Hollow dead'; out.neleasha = 'fled from the Hollow dead'; }
  if (['hold', 'siege'].includes(c.obj)) out.ariyan = 'fought behind walls';
  if (G.burned) out.jasena = 'burned the field';
  if (G.squad.some(m => m.diedAtEnd)) out.bromos = 'left a comrade behind';
  if (!(G.contrapt || G.mod.sharpers || G.mod.stakes || G.kits.some(k => k.id === 'satchel'))) out.gilzo = 'fought without munitions or traps';
  if ((G.otherKills || 0) > (G.meleeKills || 0)) out.karas = 'killed more at range than in melee';
  if ((G.hostagesLost || 0) > 0 || (c.obj === 'escort' && G.wagon && G.wagon.hp <= 0)) out.tarasha = 'abandoned travellers';
  if ((G.coin || 0) < 25) out.valdris = 'came home with almost no coin';
  if (!(G.chests > 0) && G.sec > 60) out.sorvaine = 'opened no chest';
  return Object.assign(out, G.tenet || {});
}

/* ---------------------------------------------------------------------------
   AFTER A CONTRACT: prisoners from the rout, tenets, injury dice, the finale
--------------------------------------------------------------------------- */
{ const f = endDeployment; endDeployment = function(result){
    if (!G || G.over || ['drill', 'brawl'].includes(G.obj)) return f(result);
    if ((result === 'victory' || result === 'withdrawn') && (G.routKills || 0) >= 3){
      const pool = hostPool().filter(k => !['beast', 'fixed'].includes(BESTIARY[k].arch) && !BESTIARY[k].frenzy), n = pool.length ? Math.min(3, Math.floor(G.routKills / 3)) : 0;
      for (let i = 0; i < n; i++){ const k = pickOf(pool), sp = RANGED_ARCH(BESTIARY[k].arch);
        G.prisoners.push({kind:'common', name:'Captured ' + BESTIARY[k].name, tier:G.contract.tier, value:sp ? 40 : 15, specialist:sp}); }
      if (n) note(`${n} of the routed enemy ${n > 1 ? 'give themselves' : 'gives themself'} up.`);
    }
    G.injDice = G.injDice || [];
    const clerics = (G.deployedClerics || []).filter(p => p === META.leader || G.squad.some(m => m.p === p && m.state !== 'dead'));
    f(result);
    if (!G) return;
    const withdrew = G.result === 'withdrawn' || (G.result === 'fled' && !G.failHead && !G.leaderSlain);
    const extra = [];
    if (clerics.length && !inStoryNow()){
      const br = tenetBreaches(withdrew);
      for (const p of clerics){ const d = deityOf(p); if (br[d]){ META.favourDebt = (META.favourDebt || 0) + 2;
        extra.push(`<p class="bad">${esc(p.name)} ${br[d]}, against the tenet of ${DEITIES[d].name}: 2 Favour lost on the next contract.</p>`); } }
    }
    if (G.contract.finale && G.result === 'victory'){
      const F = G.contract.title;
      META.charterFulfilled = META.ambition ? META.ambition.track : true;
      extra.unshift(`<div class="advbox" style="border-color:#8a1a1a;text-align:center"><h3 style="margin:0;font-variant:small-caps;font-size:24px">${esc(F)}</h3>
        <p style="margin:6px 0">The charter is fulfilled. ${esc(ensureMaster().name)} has the Chapter's name carved over the gate, and the company's ledger closes its first great book: ${META.deployments} contracts, ${(META.memorial || []).length} fallen, ${st().commanders || 0} commanders defeated.</p>
        <p style="margin:0;font-size:14px">The Scribe has written the Epilogue: read it from the top bar. The Chapter may go on, and keeps every perk its Ambition earned, or retire and leave a legacy.</p></div>`);
    }
    if (extra.length && renderDebrief.last){ renderDebrief.last.lines.push(...extra); saveMeta(); renderDebrief(renderDebrief.last.head, renderDebrief.last.lines); }
    if (G.injDice && G.injDice.length) showDice('Injury Checks', G.injDice, {sub:'Above 5: recovers. 5: rests a contract. Below 5: maimed.', hold:1600});
  }; }
const inStoryNow = () => typeof inStory === 'function' && inStory();

/* ---------------------------------------------------------------------------
   LIGHTNING BOLT: strikes the nearest enemy in sight and bounces to the next,
   twice, each bounce a step weaker. Forked Lightning (a Momentum order) adds
   a bounce.
--------------------------------------------------------------------------- */
ABILITIES.MAGE.text = 'Lightning strikes the nearest enemy in sight, then bounces to the next enemy, twice (three times at Magic 3, four at Magic 5). Each bounce rolls a Base Damage Die one step lower (4, 3, 2...), and the bolt ignores 1 step of armour.';
ABIL_FX.MAGE = function(u){
  const hops = 3 + ((u.s.magic || 0) >= 3 ? 1 : 0) + ((u.s.magic || 0) >= 5 ? 1 : 0), hit = new Set(), skill = (u.s.magic || 1) + 1 + G.mod.precision;
  let from = u, dmg = 4;
  for (let k = 0; k < hops; k++){
    let best = null, bd = k === 0 ? 400 : 230;
    for (const e of liveFoes()){ if (hit.has(e)) continue; const d = dist(from, e); if (d < bd && losLine(from, e)){ bd = d; best = e; } }
    if (!best){ if (k === 0) pop(u.x, u.y - 46, 'NO TARGET', '#999'); break; }
    hit.add(best);
    G.fx.push({bolt:true, x:from.x, y:from.y - 8, tx:best.x, ty:best.y - 8, life:16 + k * 3, seed:Math.random() * 1000});
    const at = {x:best.x, y:best.y};
    strike(best, skill, Math.max(1, dmg), {crush:1});
    dmg--; from = at;
  }
  G.shake = Math.max(G.shake, 6);
};

/* ---------------------------------------------------------------------------
   PACK UP AND MOVE ON: when every Squad Mate is gone and the Treasury cannot
   pay for a single recruit, the Chapter Master offers to start again
   somewhere else. The Chapter Master, the graves and the Leader (if alive)
   go with you; everything else is left behind.
--------------------------------------------------------------------------- */
const collapseDue = () => !inStoryNow() && founded() && META.deployments > 0 && !META.roster.length && !officers().length
  && META.treasury < hireGP(null) && META.collapseDeclined !== META.deployments;
function offerCollapse(){
  const m = ensureMaster(), L = META.leader;
  startCamp(); centreCamOn(HUB.fire.x, HUB.fire.y - 60);
  hideAll(); $('screen-title').classList.remove('hidden');
  $('title-inner').innerHTML = `<h1 style="font-size:54px">The Fire Burns Low</h1>
    <div class="log" style="max-width:640px;margin-top:10px;text-align:left">
      <div class="council"><div class="master"><img src="${masterBustURL()}">${esc(m.name)}<br>Chapter Master</div>
      <div style="flex:1"><div class="speech">"Look at us. ${META.memorial.length} graves by the treeline, ${META.treasury}gp in the strongbox, and nobody left to sign a contract${L ? ` but ${esc(L.name)}` : ''}. This place is finished. I say we load what we can carry, take the names of the dead with us, and try our luck somewhere they have not heard of us."</div></div></div>
      <p style="font-size:14px;color:#6a5a44">Pack up: choose a new holding and banner, and start again with 200gp. ${esc(m.name)}${L ? ` and ${esc(L.name)}` : ''} come with you, with the roll of the fallen and the rivals who remember you. Facilities, gear, standing and prisoners are left behind.</p></div>
    <button class="btn gold" onclick="packUp()">PACK UP AND MOVE ON</button>
    <button class="btn small" onclick="META.collapseDeclined=META.deployments;saveMeta();META.leader?renderTitle():openCreate()">STAY AND STRUGGLE ON</button>`;
}
function packUp(){
  const m = ensureMaster();
  BED = null;
  FD = {step:'holding', holding:holding(), fromCollapse:true, race:m.race, cls:m.cls, spec:m.spec, sex:sexOf(m), name:m.name};
  renderFound(); hideAll(); $('screen-create').classList.remove('hidden');
}
{ const f = finishFound; finishFound = function(){
    if (!(FD && FD.fromCollapse)) return f();
    const keep = {annals:META.annals, bequests:META.bequests, chapterName:META.chapterName, bard:META.bard, scribe:META.scribe, chron:META.chron, customPortraits:META.customPortraits, master:META.master,   /* Index 30 */ memorial:META.memorial, settings:META.settings, nemeses:META.nemeses, usedNames:META.usedNames, nextId:META.nextId,
      tipsSeen:META.tipsSeen, leader:META.leader, pendingPicks:META.pendingPicks, fallenLevel:META.fallenLevel, moves:(META.moves || 0) + 1};
    META = Object.assign(freshMeta(), keep, {founded:true, holding:FD.holding, banner:Object.assign({}, BED), bannerSet:true, deployments:0});
    BED = null; FD = null; MU = null;
    applySkin(); saveMeta(); CAMP.people = []; CAMP.dirty = true; SFX.play('horn');
    if (META.leader){ renderTitle(); centreCamOn(HUB.house.x, HUB.house.y); } else openCreate();
  }; }
{ const f = leaveDebrief; leaveDebrief = function(){ if (!inStoryNow() && collapseDue()){ G = null; offerCollapse(); return; } f(); }; }

/* ---------------------------------------------------------------------------
   SHARING SQUAD MATES AND LEADERS
   Export writes one person to a file. Import reads one in: a Squad Mate
   costs the hiring price plus 25gp per Advancement; a Leader joins as the
   Squad Leader (if you have none) or as an officer, for 30gp plus 60gp per
   Level above 1.
--------------------------------------------------------------------------- */
const IMPORT_COST = {perAdv:25, leaderBase:30, perLevel:60};
let IMPORT_MSG = '';
function cleanPerson(p){
  const o = JSON.parse(JSON.stringify(p));
  for (const k of ['bond', 'resting', 'trainingAt', 'trainingLabel', 'facility', 'newHire', 'pendingPicks']) delete o[k];
  return o;
}
function exportPerson(kind, id){
  const p = kind === 'mate' ? META.roster.find(x => x.id === id) : (id === 'L' ? META.leader : officers().find(x => String(x.id) === String(id)));
  if (!p) return;
  const blob = new Blob([JSON.stringify({game:'dust-cloaks-person', kind, exported:new Date().toISOString(), person:cleanPerson(p)}, null, 1)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `DustCloaks_${kind === 'mate' ? 'SquadMate' : 'Leader'}_${String(p.name).replace(/[^A-Za-z0-9]/g, '')}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  SFX.play('pick');
}
function importBlockHTML(){
  return `<div class="line"><div class="grow"><b>Import a Squad Mate or Leader</b><br><span style="font-size:14px">From a file exported from any Dust Cloaks campaign. A Squad Mate costs the hiring price (${hireGP(null)}gp) plus ${IMPORT_COST.perAdv}gp per Advancement. A Leader joins as Squad Leader (if you have none) or as an officer, for ${IMPORT_COST.leaderBase}gp plus ${IMPORT_COST.perLevel}gp per Level above 1.</span>
    ${IMPORT_MSG ? `<br><span style="font-size:14px;color:var(--blood)"><b>${IMPORT_MSG}</b></span>` : ''}</div><button onclick="importPerson()">Import</button></div>`;
}
const clampN = (v, lo, hi, d) => { v = +v; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d; };
function importPerson(){
  if (inStoryNow()){ IMPORT_MSG = 'Imports are not allowed in the prologue.'; return refreshUI(); }
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const fl = inp.files[0]; if (!fl) return; const rd = new FileReader();
    rd.onload = () => { try { takeImport(JSON.parse(rd.result)); } catch(e){ IMPORT_MSG = 'That file is not a Dust Cloaks Squad Mate or Leader (' + e.message + ').'; refreshUI(); } };
    rd.readAsText(fl); };
  inp.click();
}
function takeImport(d){
  const p = d && d.person;
  if (!d || d.game !== 'dust-cloaks-person' || !p || !RACES[p.race] || !SPECS[p.spec] || !CLASSES[p.cls] || typeof p.name !== 'string') throw new Error('missing or unknown details');
  const name = p.name.slice(0, 30), sex = p.sex === 'f' ? 'f' : 'm';
  const injuries = (Array.isArray(p.injuries) ? p.injuries : []).filter(i => INJURIES.some(x => x.id === i)).slice(0, 6);
  const picks = (Array.isArray(p.picks) ? p.picks : []).filter(id => CARDS.some(c => c.id === id));
  const deity = p.spec === 'CLERIC' && DEITIES[p.deity] ? p.deity : undefined;
  if (d.kind === 'mate'){
    if (META.roster.length >= rosterCap()){ IMPORT_MSG = 'The roster is full.'; return refreshUI(); }
    const adv = clampN(p.adv, 0, 10, 0), base = makeMate(p.race, p.cls, p.spec, name);
    const m = Object.assign(base, {sex, adv, injuries, picks, deity, baseM:clampN(p.baseM, 0, 6, base.baseM), baseR:clampN(p.baseR, 0, 6, base.baseR),
      modM:clampN(p.modM, -3, 3, base.modM), modR:clampN(p.modR, -3, 3, base.modR), startCon:clampN(p.startCon, 2, 7, base.startCon),
      conTrained:clampN(p.conTrained, 0, 2, 0), magic:SPECS[p.spec].caster ? clampN(p.magic, 0, 5, base.magic) : 0,
      deployments:clampN(p.deployments, 0, 9999, 0), kills:clampN(p.kills, 0, 1e6, 0), xM:clampN(p.xM, 0, 7, 0), xR:clampN(p.xR, 0, 7, 0), devotion:clampN(p.devotion, -1, 3, 0), scarsHealed:!!p.scarsHealed});   /* Index 35 */
    const cost = hireGP(m) + IMPORT_COST.perAdv * adv;
    if (META.treasury < cost){ META.nextId--; IMPORT_MSG = `${name} would cost ${cost}gp; the Treasury holds ${META.treasury}gp.`; return refreshUI(); }
    if (!gate(`Take on ${esc(name)}, a ${RACES[p.race].name} ${SPECS[p.spec].name} with ${adv} Advancement${adv === 1 ? '' : 's'}, for ${cost}gp?`, () => takeImport(d))){ META.nextId--; return; }
    META.treasury -= cost; META.roster.push(m);
    IMPORT_MSG = `${name} joins the roster for ${cost}gp.${adv > advCap() ? ` They hold more Advancements than your cap of ${advCap()}, so they cannot advance further until your Leader levels up.` : ''}`;
  } else {
    const level = clampN(p.level, 1, 11, 1), cost = IMPORT_COST.leaderBase + IMPORT_COST.perLevel * (level - 1);
    const asLeader = !META.leader;
    if (!asLeader && officers().length >= OFFICER_CAP){ IMPORT_MSG = 'The officers are full.'; return refreshUI(); }
    if (!asLeader && !has('command')){ IMPORT_MSG = 'Build the Command Tent to take on an imported Leader as an officer.'; return refreshUI(); }
    if (META.treasury < cost){ IMPORT_MSG = `${name} would cost ${cost}gp; the Treasury holds ${META.treasury}gp.`; return refreshUI(); }
    if (!gate(`Take on ${esc(name)}, a Level ${level} ${RACES[p.race].name} ${SPECS[p.spec].name}, as ${asLeader ? 'Squad Leader' : 'an officer'} for ${cost}gp?`, () => takeImport(d))) return;
    let pk = 0; for (let l = 1; l <= level; l++) if (rowFor(p.spec, l)[2] === 'pick') pk++;
    const L = {name, race:p.race, cls:p.cls, spec:p.spec, sex, id:META.nextId++, level, ticks:0, burnt:clampN(p.burnt, 0, 6, 0), injuries,
      picks:picks.filter(id => CARDS.find(c => c.id === id && c.spec === p.spec)).slice(0, pk), kills:clampN(p.kills, 0, 1e6, 0), deployments:clampN(p.deployments, 0, 9999, 0), deity, xM:clampN(p.xM, 0, 7, 0), xR:clampN(p.xR, 0, 7, 0), devotion:clampN(p.devotion, -1, 3, 0), magic:SPECS[p.spec].caster ? clampN(p.magic, 0, 5, 0) : 0};   /* Index 35 */
    META.treasury -= cost;
    if (asLeader){ META.leader = L; META.pendingPicks = Math.max(0, pk - L.picks.length); }
    else { L.pendingPicks = Math.max(0, pk - L.picks.length); officers().push(L); }
    IMPORT_MSG = `${name} joins as ${asLeader ? 'Squad Leader' : 'an officer'} for ${cost}gp.`;
  }
  SFX.play('coin'); saveMeta(); CAMP.dirty = true; refreshUI();
}
// Importing a Leader on the Leader-creation screen
{ const f = renderCreate; renderCreate = function(){ f();
    if (false && CR && CR.step === 'race' && !inStoryNow()) $('create-inner').insertAdjacentHTML   /* Index 46: the import link now sits on the first step only */('beforeend', `<div class="sub" style="margin-top:8px">Or bring in a Leader exported from another campaign (${IMPORT_COST.leaderBase}gp plus ${IMPORT_COST.perLevel}gp per Level above 1): <button class="btn small" onclick="importPerson()">IMPORT A LEADER</button>${IMPORT_MSG ? `<br><b>${IMPORT_MSG}</b>` : ''}</div>`); }; }
{ const f = refreshUI; refreshUI = function(){ f(); if (!$('screen-create').classList.contains('hidden') && CR && !FD){ if (META.leader){ renderTitle(); } else renderCreate(); } }; }

/* ============================================================================
   OFFICERS' LEGWORK, STANDING DOWN, DETAILED SALVAGE
   Player's Manual Sections 5.4, 4.7 and 4.8.
============================================================================ */

/* ---------------------------------------------------------------------------
   OFFICERS' LEGWORK: A NIGHT AT THE TAVERN (Section 5.4)
   The Leader and one Squad Mate walk into a tavern and the tavern fights
   back. Fists only: no spells, no bows, no abilities. The regulars come in
   waves without end. Every wave put down pays out in turn: gold, then
   intelligence, then Standing. Ale knocked off the tables heals whoever
   drinks it. Get knocked out and you keep what you have won so far. Leaving
   early is a Parley with the barkeep. Nobody dies; it is a bar fight.
--------------------------------------------------------------------------- */
OBJECTIVES.brawl = {name:"Officers' Legwork", brief:'A bar fight.'};
Object.assign(BESTIARY, {
  drunk:  {name:'Tavern Drunk',  arch:'brute', tier:1, con:2,  ac:3, shift:0, dmg:1, skill:0, speed:0.78, r:9,  colour:'#8a6a4a', xp:1, coin:1, sc:2},
  docker: {name:'Dock Hand',     arch:'brute', tier:1, con:3,  ac:3, shift:0, dmg:2, skill:1, speed:0.9,  r:10, colour:'#5a6a7a', xp:2, coin:1, sc:2},
  bruiser:{name:'Pit Fighter',   arch:'brute', tier:1, con:5,  ac:4, shift:0, dmg:2, skill:2, speed:0.85, r:11, colour:'#8a3a2a', xp:3, coin:2, sc:2.1},
  bouncer:{name:'The Bouncer',   arch:'brute', tier:1, con:10, ac:4, shift:1, dmg:3, skill:3, speed:0.72, r:13, colour:'#3a3a40', xp:8, coin:4, sc:2.5}
});
Object.assign(ENEMY_LOOK, {
  drunk:  {skin:'#e8a888', hair:'#5a3a1e', hairStyle:'messy', top:'#8a6a4a', legs:'#4a3a2a', weapon:'fist', eye:'#a03030'},
  docker: {skin:'#c98d5f', hair:'#1a1a14', head:'bandana', acc:'#3a5a7a', top:'#5a6a7a', legs:'#3a3226', weapon:'fist', beard:true},
  bruiser:{skin:'#d9a07a', hair:'#2b1d12', hairStyle:'bald', top:'#8a3a2a', legs:'#3a2a1c', weapon:'fist', bulky:true},
  bouncer:{skin:'#9aa067', hair:'#1a1a14', hairStyle:'bald', top:'#3a3a40', acc:'#5a5a62', legs:'#2a2a30', weapon:'fist', bulky:true, tall:true, tusks:true}
});
const TAVERNS = ['the Broken Tankard', 'the Drowned Rat', 'the Gilded Goose', 'the Hanged Man', 'the Crooked Spur', 'the Last Lantern'];
const isBrawl = () => !!(G && G.obj === 'brawl');
const legworkDone = () => META.legworkAt === META.deployments;
function legworkHTML(){
  if (inStoryNow() || !META.leader) return '';
  const mates = META.roster.filter(p => !(p.resting > 0));
  let h = `<div class="desc" style="text-align:left;margin-top:10px;border-top:1px solid #c9bba4;padding-top:6px"><b>Officers' Legwork: a night in town.</b> ${esc(META.leader.name)} and one Squad Mate go drinking, and it ends in a bar fight. Fists only: no spells, no bows, no abilities. The regulars keep coming. Each wave you put down pays out in turn: gold, then intelligence for your next contract, then Standing. Ale knocked off the tables heals whoever drinks it. Get knocked out and you keep what you have won. To leave early, talk the barkeep round (Personality). Nobody dies. Once per downtime.</div>`;
  if (legworkDone()) return h + '<div class="desc" style="text-align:left;color:#8b0000">You have already been into town this downtime.</div>';
  if (!mates.length) return h + '<div class="desc" style="text-align:left">Nobody is fit to go with the Leader.</div>';
  return h + mates.map(p => `<div class="line"><img src="${portraitURL(p, false)}"><div class="grow"><b>${esc(p.name)}</b><br><span style="font-size:14px">${SPECS[p.spec].name} \u00b7 Melee ${mateStats(p).melee}</span></div><button onclick="startBrawl(${p.id})">Take ${esc(p.name)}</button></div>`).join('');
}
function startBrawl(id){
  if (!META.leader || legworkDone() || inStoryNow()) return;
  closePanel();
  const place = pickOf(TAVERNS);
  startDeployment({obj:'brawl', tier:1, host:'bandits', place, edges:[], council:null, picks:0, minutes:0, pay:0, patron:'nobody', faction:null, seed:11,
    brief:`A night at ${place}. It was always going to end like this.`}, [id]);
  if (G){ G.noTick = true; G.noAdv = true; }
}
function generateBrawlMap(){
  const w = 26, h = 18, g = new Uint8Array(w * h);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? T.WALL : T.FLOOR);
  const tables = [];
  for (let x = 6; x <= 19; x++) set(x, 2, T.WAGON);                       // the bar counter
  for (const [x, y] of [[5, 6], [11, 6], [17, 6], [5, 12], [17, 12], [11, 13]]){ set(x, y, T.WAGON); set(x + 1, y, T.WAGON); tables.push({x, y}); }
  const M = {w, h, g, seed:11, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:{x:13, y:9}, exit:null, cages:[], nests:[], engines:[], beacons:[], tables,
    doors:[{x:1.5 * CELL, y:8.5 * CELL}, {x:(w - 1.5) * CELL, y:9.5 * CELL}, {x:12.5 * CELL, y:(h - 1.5) * CELL}]};
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
  MAP = M; M.reach = bfsFrom(13.5 * CELL, 9.5 * CELL); return M;
}
function setupBrawl(c){
  G.enemies = []; G.caches.length = 0; G.blips.length = 0; G.traps = [];
  G.armour = {id:'clothes', name:'Tavern clothes', slot:'armour', ac:3, shift:0, mv:0, light:true};
  G.melee = {id:'fists', name:'Fists', slot:'melee', dmg:2, reach:0, cd:0.8};
  G.ranged = {id:'none', name:'Nothing', slot:'ranged', dmg:0, range:-9999};
  G.kits = []; G.mount = gear('nomount'); G.mounted = false; G.mountPool = G.mountMax = 0;
  G.shieldPool = G.shieldMax = 0; G.wards = 0; G.ranks = {}; G.reachBonus = 0; recompute();
  G.brawl = {wave:0, t:60, gold:0, intel:0, standing:[], log:[]};
  G.ales = [];
  note(`${c.brief} Fists only. Ale on the floor heals. ESC to talk your way out.`);
}
function brawlReward(w){
  const B = G.brawl, kind = w % 3 === 1 ? 'gold' : w % 3 === 2 ? 'intel' : 'standing';
  let txt;
  if (kind === 'standing' && B.standing.length < 3){
    const fo = Object.keys(FACTIONS).filter(k => standing(k) < 3), f = pickOf(fo.length ? fo : ['skulk']);
    B.standing.push(f); txt = `A regular from ${facName(f)} likes your style: +1 Standing`;
  } else if (kind === 'intel'){
    B.intel++; txt = B.intel >= 2 ? 'A loose tongue: your next contract starts with the whole map known' : 'A loose tongue: every Blip Token on your next contract starts known';
  } else { const g = 10 + 5 * w; B.gold += g; txt = `+${g}gp won on the side`; }
  B.log.push(`Wave ${w}: ${txt}.`);
  pop(G.leader.x, G.leader.y - 64, txt.split(':')[0].toUpperCase(), '#ffd860'); note(txt + '.'); SFX.play('coin');
}
function brawlWave(){
  const B = G.brawl, w = ++B.wave, n = Math.min(24, 3 + Math.floor(w * 1.5));
  const pool = ['drunk', 'drunk'].concat(w >= 2 ? ['docker'] : [], w >= 4 ? ['bruiser'] : [], w >= 7 ? ['bruiser', 'docker'] : []);
  for (let i = 0; i < n; i++){ const d = MAP.doors[i % MAP.doors.length], e = spawnEnemy(pickOf(pool), d.x + rnd(-14, 14), d.y + rnd(-14, 14), {noNem:true});
    if (e){ e.seen = true; e.con = e.maxCon = Math.round(e.maxCon * (1 + 0.08 * w)); } }
  if (w % 5 === 0){ const d = pickOf(MAP.doors), e = spawnEnemy('bouncer', d.x, d.y, {noNem:true}); if (e){ e.seen = true; e.con = e.maxCon = Math.round(e.maxCon * (1 + 0.1 * w)); note('The bouncer wades in.'); } }
  pop(G.leader.x, G.leader.y - 60, 'WAVE ' + w, '#ffe9b0'); SFX.play('horn');
}
function updateBrawl(){
  const B = G.brawl, L = G.leader;
  // a knocked-out Squad Mate gets up again after a while; nobody bleeds out in a bar fight
  for (const m of G.squad){
    if (m.state === 'bleeding'){ m.state = 'stable'; m.koT = 0; pop(m.x, m.y - 24, 'KNOCKED OUT', '#ff8a7a'); }
    if (m.state === 'stable' && ++m.koT > 720){ m.koT = 0; standUp(m, 'BACK ON THEIR FEET'); }
  }
  // ale
  for (const a of G.ales){ a.life--;
    const u = squadUnits().find(v => dist(v, a) < 24); if (!u) continue;
    a.life = 0; SFX.play('heal');
    if (u === L){ if (L.con < L.maxCon) L.con++; else L.wounds = Math.min(L.maxWounds, L.wounds + 1); }
    else u.con = Math.min(u.maxCon, u.con + 1);
    pop(u.x, u.y - 24, '+1 ALE', '#ffd860'); }
  G.ales = G.ales.filter(a => a.life > 0);
  // waves
  if (!G.enemies.some(e => !e.dead)){
    if (B.wave > 0 && !B.paid){ B.paid = true; brawlReward(B.wave); B.t = 150; }
    if (--B.t <= 0){ B.paid = false; brawlWave(); }
  }
}
const barkeepSprite = () => { const s = humanoidSprite('barkeep', {skin:'#e0aa84', hair:'#3a2a1a', hairStyle:'bald', top:'#ece4cf', acc:'#7a3e26', legs:'#4a3a2a', beard:true, bulky:true, weapon:'fist'}); if (!s.p3d){ s.p3d = BARKEEP_P; s.p3dL = false; } return s; };   /* Index 74 */
function brawlBodies(bodies, onScreen){
  const tblDraw = (x, y, w2) => { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 4, y + 6, w2, 40);
    ctx.fillStyle = '#6a4422'; ctx.fillRect(x, y, w2, 40); ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x, y, w2, 6); ctx.fillStyle = '#3a2410'; ctx.fillRect(x, y + 36, w2, 4); };
  bodies.push({y:2.9 * CELL, custom:() => { const x = 6 * CELL, y = 2 * CELL;
    tblDraw(x, y, 14 * CELL);
    for (let i = 0; i < 9; i++) PROPS3D.box(x + 30 + i * 60, y + 2, 2, 9, 10, 4, 9, '#c8a040');
    const bk = barkeepSprite(); drawStub(BARKEEP_OWN, 0, bk, 12.5 * CELL, 1.6 * CELL, 2.5, 0, false, false); }});   /* Index 74 */
  for (const t of MAP.tables) bodies.push({y:(t.y + 0.9) * CELL, custom:() => { tblDraw(t.x * CELL, t.y * CELL, 2 * CELL); PROPS3D.box(t.x * CELL + 24, t.y * CELL + 10, 2, 9, 10, 4, 9, '#c8a040'); PROPS3D.box(t.x * CELL + 52, t.y * CELL + 12, 2, 9, 10, 4, 9, '#c8a040'); }});
  for (const a of G.ales) if (onScreen(a)) bodies.push({y:a.y, custom:() => { ctx.fillStyle = 'rgba(255,220,120,' + (0.18 + Math.sin(G.frame / 8) * 0.08) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, TAU); ctx.fill(); PROPS3D.box(a.x, a.y, 2.4, 9, 10, 4, 9, '#c8a040'); }});
  for (const d of MAP.doors) bodies.push({y:d.y - 30, custom:() => { ctx.fillStyle = '#3a2410'; ctx.fillRect(d.x - 18, d.y - 22, 36, 40); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(d.x - 15, d.y - 19, 30, 34); }});
}
function brawlLine(){
  const B = G.brawl, next = (B.wave + 1) % 3 === 1 ? 'gold' : (B.wave + 1) % 3 === 2 ? 'intel' : 'Standing';
  /* the HUD box holds about 48 letters: the tally and the next prize, and every fourth beat the way out */
  if ((Date.now() / 3000 | 0) % 4 === 3) return [`WAVE ${B.wave}`, 'ESC TO LEAVE WITH YOUR WINNINGS'];
  return [`WAVE ${B.wave}`, `${B.gold}GP \u00b7 ${B.intel} INTEL \u00b7 ${B.standing.length} STANDING \u00b7 NEXT: ${next.toUpperCase()}`];
}
function brawlEnd(result, damages){
  if (G.over) return; G.over = true; G.paused = true;
  $('overlay-pause').classList.add('hidden');
  const B = G.brawl, L = META.leader, lines = [];
  META.legworkAt = META.deployments;
  const head = result === 'fallen' ? 'OUT COLD' : damages ? 'SHOWN THE DOOR' : 'A NIGHT TO REMEMBER';
  lines.push(`<p>${esc(L.name)} lasted <b>${B.wave} wave${B.wave === 1 ? '' : 's'}</b> at ${esc(G.contract.place)} and put ${G.kills} regulars on the floor.${result === 'fallen' ? ' Then someone broke a stool over their head.' : ''}</p>`);
  for (const t of B.log) lines.push(`<p>${t}</p>`);
  let gold = B.gold + G.coin;
  if (damages && gold){ const d = Math.ceil(gold / 2); gold -= d; lines.push(`<p class="bad">The barkeep takes ${d}gp for the damage before letting you out.</p>`); }
  if (gold){ META.treasury += gold; lines.push(`<p class="good"><b>Treasury +${gold}gp</b>${G.coin ? ` (including ${G.coin} coin picked up off the floor)` : ''}.</p>`); }
  if (B.intel){ META.intel = B.intel >= 2 || META.intel === 'full' ? 'full' : 'blips'; lines.push(`<p class="good">${META.intel === 'full' ? 'Your next contract starts with the whole map known and every Blip Token known.' : 'Every Blip Token on your next contract starts known.'}</p>`); }
  for (const f of B.standing) shiftStanding(f, 1, lines);
  if (result === 'withdrawn' && !damages && (L.burnt || 0) > 0){ L.burnt--; lines.push(`<p class="good">Walking out of that on your own feet does wonders: ${esc(L.name)} recovers 1 burnt Luck (Section 5.4).</p>`); }
  lines.push('<p>Bruises only. Nobody is hurt badly enough to miss a contract.</p>');
  if (!B.wave && !G.kills) lines.length = 1;
  saveMeta(); SFX.play(result === 'fallen' ? 'down' : 'win');
  renderDebrief(head, lines);
}
function barkeepParlay(){
  if (!G || G.over) return;
  if ((G.wdT || 0) > G.frame){ SFX.play('nope'); return; }
  const live = G.enemies.filter(e => !e.dead).length, d = Math.min(6, 4 + (live >= 3 ? 1 : 0) + (G.brawl.wave >= 8 ? 1 : 0));
  const per = G.leader.down ? 1 : G.leader.s.per, r = attackDie(per, d), res = (r.out === 'solid' || r.out === 'crit') ? 'full' : r.out === 'graze' ? 'partial' : 'miss';
  $('overlay-pause').classList.add('hidden');
  showDice('Parley with the Barkeep', [{face:r.face, skill:clampSkill(per), out:r.out, ac:d, label:META.leader.name + "'s Personality"}], {
    sub:`Against ${d}${live >= 3 ? ', with fists still flying' : ''}`,
    result: res === 'full' ? 'The barkeep laughs, and waves you out with everything you won.' : res === 'partial' ? 'You can go, once you pay for the furniture.' : 'The barkeep bolts the door. Keep swinging.',
    sfx: res === 'miss' ? 'nope' : 'horn',
    then(){
      if (!G || G.over) return;
      if (res === 'miss'){ G.wdT = G.frame + 20 * 60; G.paused = false; note('The door stays bolted. Try again in 20 seconds.'); return; }
      brawlEnd('withdrawn', res === 'partial');
    }});
}
// hooks
{ const f = generateMap; generateMap = c => c.obj === 'brawl' ? generateBrawlMap() : f(c); }
{ const f = setupContract; setupContract = c => c.obj === 'brawl' ? setupBrawl(c) : f(c); }
{ const f = updateContract; updateContract = () => isBrawl() ? updateBrawl() : f(); }
{ const f = spawn; spawn = () => isBrawl() ? null : f(); }
{ const f = contractCheck; contractCheck = () => isBrawl() ? false : f(); }
{ const f = contractProgress; contractProgress = () => isBrawl() ? 0 : f(); }
{ const f = contractLine; contractLine = t => isBrawl() ? brawlLine() : f(t); }
{ const f = contractBodies; contractBodies = (b, o) => isBrawl() ? brawlBodies(b, o) : f(b, o); }
{ const f = contractMarkers; contractMarkers = out => isBrawl() ? null : f(out); }
{ const f = offerParlay; offerParlay = e => isBrawl() ? null : f(e); }
{ const f = placeTraps; placeTraps = c => c.obj === 'brawl' ? (G.traps = []) : f(c); }
{ const f = specPassive; specPassive = (u, l) => isBrawl() ? null : f(u, l); }
{ const f = runSpells; runSpells = () => isBrawl() ? null : f(); }
{ const f = useAbility; useAbility = s => isBrawl() ? SFX.play('nope') : f(s); }
{ const f = rollMomentum; rollMomentum = () => isBrawl() ? f().filter(x => !(x.o && ['gifts', 'quicken', 'spoils', 'supplies'].includes(x.o.id))) : f(); }
{ const f = leaderFalls; leaderFalls = function(){ if (!isBrawl()) return f(); const L = G.leader; L.con = 0; L.down = true; G.shake = 20; SFX.play('down'); brawlEnd('fallen'); }; }
{ const f = killEnemy; killEnemy = function(e){ const was = e.dead; f(e); if (isBrawl() && !was && e.dead && Math.random() < 0.28) G.ales.push({x:e.x, y:e.y, life:1500}); }; }
{ const f = askWithdraw; askWithdraw = () => isBrawl() ? barkeepParlay() : f(); }
{ const f = withdrawNote; withdrawNote = () => isBrawl() ? `<div class="sub" style="color:#c8b890;font-size:13px">Leaving is a Parley with the barkeep: Personality against 4, 5 while three or more regulars are still swinging, 6 after wave 8. Full Success: out with everything. Partial: out, but half the gold pays for the furniture. Miss: the door stays bolted for 20 seconds.</div>` : f(); }
{ const f = togglePause; togglePause = function(){ f(); if (isBrawl() && G.paused){ const p = $('pause-inner'); if (p) p.innerHTML = p.innerHTML.replace(/Withdraw now and the patron pays nothing\.|Enough of the job is done to withdraw on half pay\./, 'Knocked out, you keep what you have won.').replace('>WITHDRAW<', '>TALK TO THE BARKEEP<'); } }; }
{ const f = renderPanel; renderPanel = function(){ f(); const P = CAMP.panel; if (!P || inStoryNow()) return;
    if (P.kind === 'fire' || (P.kind === 'building' && P.id === 'tavern' && has('tavern'))) $('camp-panel').insertAdjacentHTML('beforeend', legworkHTML()); }; }

/* ---------------------------------------------------------------------------
   STANDING DOWN AND THE LEGACY ROLES (Section 4.7)
--------------------------------------------------------------------------- */
const PRICE = {
  DEVOUT: {text:'Build a Chapel or Shrine. (Sacred Oaths are not in the game yet.)', met:L => has('chapel')},
  EDELOS: {text:'Pay 400gp for a caravan of their own.', pay:400},
  FREEMAN:{text:'Found a workshop: build any Workshop facility, then pay 250gp.', pay:250, need:() => ['blacksmith', 'carpentry', 'leather', 'engineering'].some(has), needText:'build a Workshop first'},
  NOBLE:  {text:'Satisfy the family name: defeat 4 enemy commanders while leading.', met:L => (L.slain || 0) >= 4, tally:L => `${L.slain || 0} of 4`},
  OUTCAST:{text:'Reach +2 Standing with any one faction.', met:L => Object.keys(FACTIONS).some(f => standing(f) >= 2)},
  SLAVE:  {text:'Buy the writ for 300gp, or win a Hostage Rescue (a Liberation deed).', pay:300, met:L => (st().rescueWins || 0) >= 1}
};
const SEATS = {
  quartermaster:{name:'Quartermaster', text:'All Squad Standard gear costs 10% less. Does not stack with a Veteran Blacksmith on metal gear.'},
  spymaster:    {name:'Spymaster',     text:'At the start of every contract, one hidden Blip Token and one hidden trap are revealed.'},
  drillmaster:  {name:'Drillmaster',   text:'After every contract, give 3 Advancements instead of 2.'},
  archivist:    {name:'Archivist',     text:'Magic study costs 25% less.'}
};
const BACKGROUND_FACTION = {NOBLE:'empire', EDELOS:'empire', FREEMAN:'suderia', SLAVE:'suderia', DEVOUT:'mendor', OUTCAST:'skulk'};
const hasSeat = s => (META.council || []).some(x => x.seat === s);
function priceMet(L){ const P = PRICE[L.cls]; if (!P) return false; if (L.pricePaid) return true; if (P.met && P.met(L)) return true; return false; }
function payPrice(){
  const L = META.leader, P = PRICE[L.cls]; if (!L || !P.pay || L.pricePaid) return;
  if (P.need && !P.need()) return SFX.play('nope');
  if (META.treasury < P.pay) return SFX.play('nope');
  META.treasury -= P.pay; L.pricePaid = true; SFX.play('coin'); saveMeta(); refreshUI();
}
let SD = null;
function standDownHTML(){
  const L = META.leader; if (!L || inStoryNow()) return '';
  const P = PRICE[L.cls] || PRICE.FREEMAN, met = priceMet(L), lvl = L.level >= 7, ren = L.renown || 0;
  if (met && !L.pricePaid){ L.pricePaid = true; saveMeta(); }
  let h = `<div class="advbox"><h3 style="margin:0 0 4px">Standing Down</h3>
    <div class="desc" style="text-align:left">A Squad Leader of Level 7 or higher whose Price is paid may Stand Down into a Legacy Role. Serve on instead, and every contract won earns 1 Renown, but the years start collecting: a Condition roll against 5 after each one, and a Miss means a Permanent Injury.</div>
    <div class="line"><div class="grow"><b>Level ${L.level} of 7</b> ${lvl ? '\u2713' : ''}<br><b>The ${CLASSES[L.cls].name}'s Price:</b> ${P.text}${P.tally ? ` (${P.tally(L)})` : ''} ${met ? '<b style="color:#226b2a">Paid.</b>' : ''}<br><b>Renown:</b> ${ren}${ren >= 6 ? ' (a Legacy role, two Council Seats and a Charter Milestone)' : ren >= 3 ? ' (a Legacy role and one Council Seat)' : ' (a Legacy role)'}</div>
    ${!met && P.pay ? `<button ${META.treasury >= P.pay && (!P.need || P.need()) ? '' : 'disabled'} title="${P.need && !P.need() ? P.needText : ''}" onclick="payPrice()">Pay ${P.pay}gp</button>` : ''}</div>`;
  if (lvl && met){
    if (!SD) h += `<button class="btn gold" onclick="SD={};refreshUI()">STAND DOWN</button>`;
    else {
      const fac = BACKGROUND_FACTION[L.cls] === 'empire' && ['DWARF', 'GNOME'].includes(L.race) ? 'dwarves' : BACKGROUND_FACTION[L.cls] || 'skulk';
      const roles = [['replace', 'Chapter Master (replace)', `${esc(L.name)} becomes Chapter Master and sets the camp bonus (${CLASSES[L.cls].name}: ${CM_BONUS[L.cls].game}). ${esc(ensureMaster().name)} retires to a Council Seat.`],
        ['alongside', 'Chapter Master (alongside)', `${esc(L.name)} sits beside ${esc(ensureMaster().name)}. Both camp bonuses apply.`],
        ['patron', 'Patron', `Once every 8 contracts, ${esc(L.name)} offers a contract at +20% pay with no Patron Resistance roll. +1 Standing with ${facName(fac)} now.`]]
        .concat(Object.entries(SEATS).filter(([k]) => !hasSeat(k)).map(([k, S]) => [k, 'Council Seat: ' + S.name, S.text]));
      h += `<div class="desc" style="text-align:left;margin-top:6px"><b>Choose ${esc(L.name)}'s Legacy role.</b> Then a new Squad Leader is chosen.</div>` +
        roles.map(([k, n, t]) => `<div class="line"><div class="grow"><b>${n}</b><br><span style="font-size:14px">${t}</span></div><button onclick="askConfirm('Stand down?', '${esc(L.name).replace(/'/g, "\\'")} stands down for good.', () => standDown('${k}','${fac}'))">Choose</button></div>`).join('') +
        `<button class="btn small" onclick="SD=null;refreshUI()">NOT YET: SERVE ON</button>`;
    }
  }
  return h + seatPickerHTML() + '</div>';
}
function seatPickerHTML(){
  const q = META.pendingSeats || []; if (!q.length) return '';
  const free = Object.entries(SEATS).filter(([k]) => !hasSeat(k));
  if (!free.length){ META.pendingSeats = []; return ''; }
  return `<div class="desc" style="text-align:left;margin-top:8px;color:#226b2a"><b>${esc(q[0])} takes a Council Seat.</b> Choose which:</div><div class="mini" style="justify-content:flex-start">${free.map(([k, S]) => `<button title="${S.text}" onclick="takeSeat('${k}')">${S.name}</button>`).join('')}</div>`;
}
function takeSeat(k){
  const q = META.pendingSeats || []; if (!q.length || hasSeat(k)) return;
  (META.council = META.council || []).push({seat:k, name:q.shift()}); SFX.play('win'); saveMeta(); refreshUI();
  if (!$('screen-debrief').classList.contains('hidden') && renderDebrief.last) renderDebrief(renderDebrief.last.head, renderDebrief.last.lines);
}
function standDown(role, fac){
  const L = META.leader; if (!L || !priceMet(L) || L.level < 7) return;
  const ren = L.renown || 0, lines = [], seats = [];
  const who = {name:L.name, race:L.race, cls:L.cls, spec:L.spec, sex:sexOf(L), id:L.id || ('L' + Date.now()), level:L.level, picks:(L.picks || []).slice(), injuries:L.injuries.slice(), deployments:L.deployments, kills:L.kills};
  lines.push(`<p><b>${esc(L.name)} stands down</b> after ${L.deployments || 0} contracts, at Level ${L.level}, with ${ren} Renown. They leave whole, with their name intact and their knees working.</p>`);
  if (role === 'replace'){ const old = ensureMaster(); seats.push(old.name);
    META.master = {id:'CM', name:L.name, race:L.race, cls:L.cls, spec:L.spec, sex:sexOf(L), chosen:true};
    lines.push(`<p class="good">${esc(L.name)} is the new Chapter Master. Camp bonus: ${CM_BONUS[L.cls].game} ${esc(old.name)} retires to a Council Seat.</p>`); }
  else if (role === 'alongside'){ META.coMaster = {name:L.name, race:L.race, cls:L.cls, spec:L.spec, sex:sexOf(L)};
    lines.push(`<p class="good">${esc(L.name)} sits beside the Chapter Master. Both camp bonuses apply: ${CM_BONUS[L.cls].game}</p>`); }
  else if (role === 'patron'){ META.patronLegacy = {name:L.name, faction:fac, usedAt:-99}; shiftStanding(fac, 1, lines);
    lines.push(`<p class="good">${esc(L.name)} becomes a Patron of the Chapter, and will offer contracts of their own on the planning table.</p>`); }
  else if (SEATS[role]){ (META.council = META.council || []).push({seat:role, name:L.name}); lines.push(`<p class="good">${esc(L.name)} takes the Council Seat of ${SEATS[role].name}: ${SEATS[role].text}</p>`); }
  const extra = ren >= 6 ? 2 : ren >= 3 ? 1 : 0;
  for (let i = 0; i < extra; i++) seats.push(L.name);
  if (seats.length){ META.pendingSeats = (META.pendingSeats || []).concat(seats); lines.push(`<p class="good">Renown ${ren}: ${seats.length} Council Seat${seats.length > 1 ? 's' : ''} to fill. Choose ${seats.length > 1 ? 'them' : 'it'} below.</p>`); }
  if (ren >= 6 && META.ambition && META.ambition.done < 10){ META.ambition.done++; lines.push('<p class="good">They are the story the recruiters tell at the gate: one Charter Milestone is checked off.</p>'); }
  (META.legacies = META.legacies || []).push(Object.assign(who, {role, renown:ren, season:seasonName()}));
  META.fallenLevel = L.level; META.leader = null; META.pendingPicks = 0; META.board = null; SD = null; MU = null;
  saveMeta(); SFX.play('horn'); CAMP.dirty = true;
  renderDebrief('A LEADER STANDS DOWN', lines);
}
// the rules that change with the Legacy
{ const f = gearPrice; gearPrice = function(g){ const p = f(g); return hasSeat('quartermaster') && p > 0 && !(mastery('blacksmith') && g.req.includes('blacksmith')) ? Math.round(p * 0.9) : p; }; }
{ const f = trainingFor; trainingFor = function(fid, p){ const o = f(fid, p); if (hasSeat('archivist')) for (const t of o) if (t.k === 'magic'){ t.cost = Math.round(t.cost * 0.75); t.ok = t.ok || (t.why === 'not enough gold' && META.treasury >= t.cost); } return o; }; }
{ const f = grantAdvancements; grantAdvancements = function(lines){ f(lines); if (hasSeat('drillmaster') && META.advRound){ META.advRound.left++; if (lines) lines.push('<p class="good">The Drillmaster has them at it before dawn: one more Advancement to give.</p>'); } }; }
{ const f = leadershipHTML; leadershipHTML = () => f() + (META.leader ? standDownHTML() : seatPickerHTML() ? `<div class="advbox">${seatPickerHTML()}</div>` : ''); }
{ const f = renderDebrief; renderDebrief = function(h, l){ f(h, l); const q = seatPickerHTML(), lg = $('debrief-inner').querySelector('.log'); if (q && lg) lg.insertAdjacentHTML('afterend', `<div class="advbox">${q}</div>`); }; }
{ const f = renderTable; renderTable = function(){ f(); if (inStoryNow() || !META.patronLegacy) return;
    const P = META.patronLegacy, ready = META.deployments - P.usedAt >= 8, grid = $('table-inner').querySelector('.table-grid'); if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `<div class="scroll" style="max-width:1300px;margin:10px auto"><h3>A Letter from ${esc(P.name)}</h3><div class="sub" style="font-size:14px">${ready ? `${esc(P.name)} has work for the Chapter: a contract of your Tier at +20% pay, and no haggling needed.` : `${esc(P.name)} will have more work in ${8 - (META.deployments - P.usedAt)} contract${8 - (META.deployments - P.usedAt) === 1 ? '' : 's'}.`}</div>${ready ? '<button class="btn small" onclick="callPatron()">ACCEPT THE COMMISSION</button>' : ''}</div>`); }; }
function callPatron(){
  const P = META.patronLegacy; if (!P || META.deployments - P.usedAt < 8) return;
  const lvl = META.leader ? META.leader.level : 1, tier = lvl >= 5 ? 3 : lvl >= 3 ? 2 : 1;
  const c = makeContract(pickOf(CONTRACT_KEYS), tier);
  c.pay = Math.round(c.pay * 1.2 / 5) * 5; c.patron = P.name; c.faction = P.faction; c.council = []; c.picks = 0; c.title = `${P.name}'s Commission`;
  META.board = [c].concat(META.board || []).slice(0, 4); P.usedAt = META.deployments; MU = null; saveMeta(); SFX.play('horn'); renderTable();
}
// the retired Leaders walk the camp
const LEG_PEOPLE = {};
{ const f = campSync; campSync = function(){ f(); if (inStoryNow()) return;
    for (const p of META.legacies || []){ const id = 'lg' + p.id; let q = LEG_PEOPLE[id];
      if (!q){ const s = {x:HUB.house.x + rnd(-60, 60), y:HUB.house.y + 40}; q = LEG_PEOPLE[id] = {id, kind:'legacy', p, x:s.x, y:s.y, tx:s.x, ty:s.y, wait:rnd(0, 200), left:false, moving:false, seed:Math.random() * 10 | 0}; }
      if (!CAMP.people.includes(q)) CAMP.people.push(q); } }; }
{ const f = renderPanel; renderPanel = function(){ const P = CAMP.panel;
    if (P && P.kind === 'person' && String(P.id).startsWith('lg')){ const p = (META.legacies || []).find(x => 'lg' + x.id === P.id); if (!p) return closePanel();
      const role = p.role === 'replace' ? 'Chapter Master' : p.role === 'alongside' ? 'Chapter Master, alongside' : p.role === 'patron' ? 'Patron of the Chapter' : 'Council Seat: ' + SEATS[p.role].name;
      $('camp-panel').innerHTML = `<button class="x" onclick="closePanel()">&#215;</button><h2>${esc(p.name)}</h2><img class="pimg" src="${portraitURL(p, true)}"><div class="tag">Legacy: ${role}</div>
        <div class="role">${RACES[p.race].name} ${CLASSES[p.cls].name} ${SPECS[p.spec].name}, Level ${p.level}</div><div class="desc">Stood down in ${esc(p.season)} after ${p.deployments || 0} contracts, with ${p.renown} Renown.</div>`; return; }
    if (P && P.kind === 'trophies'){ $('camp-panel').innerHTML = '<button class="x" onclick="closePanel()">&#215;</button>' + trophyPanelHTML(); return; }
    f();
    if (P && P.kind === 'house' && !inStoryNow() && ((META.council || []).length || META.coMaster || META.patronLegacy))
      $('camp-panel').insertAdjacentHTML('beforeend', `<div class="desc" style="text-align:left;margin-top:8px;border-top:1px solid #c9bba4;padding-top:6px"><b>The Council.</b> ${[META.coMaster ? `${esc(META.coMaster.name)}, Chapter Master alongside` : '', META.patronLegacy ? `${esc(META.patronLegacy.name)}, Patron` : ''].concat((META.council || []).map(x => `${esc(x.name)}, ${SEATS[x.seat].name}`)).filter(Boolean).join('; ')}.</div>`); }; }

/* ---------------------------------------------------------------------------
   DETAILED SALVAGE (Section 4.8, Table 4.11) AND THE TROPHY RACK
   After a contract that is won or withdrawn from, one roll per defeated enemy
   squad on the Shifted d6 for the contract's Tier. Curiosities come home as
   trophies on a rack by the Chapter House: captured company banners, monster
   skulls, war totems and relics. Sell one for 150gp, or give it to a Witch to
   raise her Magic.
--------------------------------------------------------------------------- */
const salvageMode = () => (META && META.salvageMode) || 'detailed';
const CURIO = {
  bandits:   {kind:'banner', names:['Captured Company Banner', "A Brigand Captain's Colours", 'The Cutthroats\u2019 Standard']},
  deserters: {kind:'banner', names:['Frost-Vault Legion Standard', 'A Phalanx Eagle', 'Deserter Company Colours']},
  monsters:  {kind:'skull',  names:['Dire Wolf Skull', 'Ogre Jawbone', 'Cave Bear Skull', 'A Young Wyrm\u2019s Horn']},
  greenskins:{kind:'totem',  names:['Warren Totem', 'Goblin Fetish Mask', 'Hobgoblin War-Drum']},
  hollow:    {kind:'relic',  names:['Weeping Reliquary', 'A Hollow Reeve\u2019s Bell', 'Barrow-Candle']}
};
const trophySprite = t => t.kind === 'legend' ? legendSprite(t.legend) : t.kind === 'banner' ?   /* Index 42 */ bannerSprite(t.col || '#8a1a1a') : t.kind === 'relic' ? relicSprite() : simpleSprite('tro:' + t.kind, 12, 13, P => {
  if (t.kind === 'skull'){ P(2, 1, 8, 6, C.bone); P(1, 3, 10, 3, C.bone); P(3, 7, 6, 3, C.bone); P(3, 3, 2, 2, '#2a2520'); P(7, 3, 2, 2, '#2a2520'); P(4, 10, 1, 2, C.bone); P(7, 10, 1, 2, C.bone); P(0, 0, 2, 3, '#c8b890'); P(10, 0, 2, 3, '#c8b890'); }
  else { P(5, 5, 2, 8, C.wood); P(2, 0, 8, 6, '#7a3e26'); P(3, 2, 2, 1, '#ffe060'); P(7, 2, 2, 1, '#ffe060'); P(4, 4, 4, 1, '#2a2520'); P(0, 1, 2, 4, '#8db04a'); P(10, 1, 2, 4, '#8db04a'); }
});
const trophyURL = t => toURL('trophy:' + t.kind + (t.legend || '') + (t.col || ''), () => trophySprite(t), 4);
function detailedSalvage(c, lines){
  const tier = c.tier || 1, n = Math.min(8, Math.max(1, Math.floor(G.kills / 12) + G.bossKills)), dice = [];
  let gold = 0;
  const C2 = CURIO[c.host] || CURIO.bandits;
  for (let i = 0; i < n; i++){
    const face = rollDie(tier), natMax = face === tier + 5;
    let text, col = '#f0c96a';
    if (face >= 9 || (tier === 3 && natMax)){
      const t = legendRoll(c) || {kind:C2.kind, name:pickOf(C2.names), from:`${OBJECTIVES[c.obj] ? OBJECTIVES[c.obj].name : 'a contract'} at ${c.place || 'the field'}`, season:seasonName(), col:pickOf(['#8a1a1a', '#2e4a6a', '#3a5a2a', '#5a2a6a', '#2a2520'])};
      (META.trophies = META.trophies || []).push(t); if (t.legend) try { chron(); chronAdd('legend', {name:t.name, lore:t.from}, true); } catch (x) {} text = t.legend ? 'LEGENDARY' : 'CURIOSITY'; col = t.legend ? '#ff9a3a' : '#ffd860';   /* Index 42 */
      lines.push(t.legend ? `<p class="good"><b>A Legend:</b> ${esc(t.name)}. It takes its place on the legends shelf of the Trophy Rack.</p>` : `<p class="good"><b>A Curiosity:</b> ${esc(t.name)}. It goes up on the Trophy Rack by the Chapter House.</p>`);
    } else if (face >= 7){
      const pool = GEAR.filter(g => g.cost > 0 && g.cost <= 150 && g.slot !== 'mount' && !g.noLoot);   /* Index 37 */
      const fresh = pool.filter(g => !META.gear.owned.includes(g.id)), g = pickOf(fresh.length ? fresh : pool);
      if (fresh.length && ARM.room()){ ARM.add(g.id); lines.push(`<p class="good"><b>Fine gear:</b> the enemy's own ${g.name}, now in the ${ARM.built() ? 'Armoury' : "Quartermaster's wagon"}.</p>`); }   /* INDEX A31 */
      else { const v = ARM.price(g.id); gold += v; lines.push(`<p><b>Fine gear:</b> ${g.name}${fresh.length ? ', which the wagon cannot carry,' : ' the company already has,'} sold for ${v}gp.</p>`); }
      text = 'FINE GEAR'; col = '#8fd39a';
    } else if (face >= 5){ gold += 40; (META.munitions = META.munitions || []).push('cusser'); text = 'GOOD HAUL'; }
    else if (face >= 3){ gold += 20; (META.munitions = META.munitions || []).push('smoke'); text = 'COIN AND KIT'; }
    else { gold += 10; text = 'SCRAP'; col = '#c8b890'; }
    dice.push({face, skill:tier, label:`Squad ${i + 1}`, text, col});
  }
  if (hasDoc('plunder')) gold = Math.ceil(gold * 1.25);
  META.treasury += gold;
  const mun = (META.munitions || []).length;
  lines.unshift(`<p><b>Detailed Salvage:</b> ${n} enemy squad${n > 1 ? 's' : ''} picked over at Tier ${tier}. <b>+${gold}gp</b>${hasDoc('plunder') ? ' (Plunder Management +25%)' : ''}${mun ? `; ${mun} munition${mun > 1 ? 's' : ''} wait for the next contract` : ''}.</p>`);
  showDice('Detailed Salvage', dice, {sub:'0-2 scrap \u00b7 3-4 coin and kit \u00b7 5-6 a good haul \u00b7 7-8 fine gear \u00b7 9+ a Curiosity', hold:1800});
}
// one wrapper for everything that happens after a normal contract
{ const f = endDeployment; endDeployment = function(result){
    if (!G || G.over) return f(result);
    if (G.obj === 'brawl') return brawlEnd(result === 'withdrawn' ? 'withdrawn' : 'fallen');
    const ok = !inStoryNow() && !['drill', 'siege', 'night', 'sortie'].includes(G.obj), L = META.leader, c = G.contract;
    if (ok && L) L.slain = (L.slain || 0) + G.commandersDefeated.length;
    f(result);
    if (!G || !ok) return;
    const lines = [];
    if (L && META.leader === L && G.result === 'victory' && L.level >= 7 && priceMet(L)){
      L.renown = (L.renown || 0) + 1;
      const s = leaderStats(L), r = attackDie(s.con, 5);
      lines.push(`<p>${esc(L.name)} serves on: <b>+1 Renown</b> (now ${L.renown}). The years roll against them: Condition ${s.con} against 5, face ${r.face}.</p>`);
      if (r.out === 'miss'){ const inj = INJURIES[d6() - 1]; L.injuries.push(inj.id); lines.push(`<p class="bad">The years collect what the war did not: <b>${inj.name}</b> (${inj.eff}).</p>`); }
    }
    if ((G.result === 'victory' || G.result === 'withdrawn') && salvageMode() === 'detailed'){
      const q = Math.round(c.pay * 0.10); META.treasury -= q;
      const sl = []; detailedSalvage(c, sl); sl.push(`<p style="font-size:14px">Detailed Salvage replaces the ${q}gp Quick Salvage shown above.</p>`); lines.push(...sl);
    }
    if (lines.length && renderDebrief.last){ renderDebrief.last.lines.push(...lines); saveMeta(); renderDebrief(renderDebrief.last.head, renderDebrief.last.lines); }
  }; }
// munitions from salvage, and the Spymaster's work, at the start of a contract
{ const f = startDeployment; startDeployment = function(c, ids){
    f(c, ids);
    if (!G || inStoryNow() || ['brawl', 'drill'].includes(G.obj)) return;
    const mun = META.munitions || [];
    if (mun.length){ mun.forEach((k, i) => G.caches.push({x:G.leader.x - 70 + i * 28, y:G.leader.y + 70, kind:k, opened:false, starter:true})); note(`${mun.length} salvaged munition${mun.length > 1 ? 's' : ''} brought along.`); META.munitions = []; saveMeta(); }
    if (hasSeat('spymaster')){ const b = G.blips.find(x => !x.known); if (b) b.known = d6(); const tr = (G.traps || []).find(x => !x.seen); if (tr) tr.seen = true; if (b || tr) note('The Spymaster\u2019s people marked the field for you.'); }
  }; }
// the Trophy Rack
const TROPHY = {x:730, y:600};
function trophyPanelHTML(){
  const T = META.trophies || [], witches = META.roster.filter(p => p.spec === 'WITCH' && p.magic < 5);
  return `<h2>The Trophy Rack</h2><div class="desc" style="text-align:left">Curiosities brought home from Detailed Salvage. Each one sells for 150gp, or a Witch can spend one to raise her Magic by 1 without the usual harvest.</div>` +
    (T.length ? T.map((t, i) => `<div class="line"><img src="${trophyURL(t)}"><div class="grow"><b>${esc(t.name)}</b><br><span style="font-size:14px">From ${esc(t.from)}, ${esc(t.season)}</span></div><div class="mini" style="flex-direction:column"><button onclick="sellTrophy(${i})">Sell, 150gp</button>${witches.map(w => `<button onclick="witchTrophy(${i},${w.id})">${esc(w.name)}: +1 Magic</button>`).join('')}</div></div>`).join('')
      : '<div class="desc">Empty. Roll a 9 or more on Detailed Salvage to bring something home.</div>') +
    `<div class="desc" style="text-align:left;margin-top:6px">Salvage mode: <b>${salvageMode() === 'detailed' ? 'Detailed' : 'Quick'}</b>. <a href="#" onclick="META.salvageMode=salvageMode()==='detailed'?'quick':'detailed';saveMeta();renderPanel();return false">Switch</a></div>`;
}
function sellTrophy(i){ const T = META.trophies || []; if (!T[i]) return; T.splice(i, 1); META.treasury += 150; SFX.play('coin'); saveMeta(); refreshUI(); }
function witchTrophy(i, id){ const T = META.trophies || [], w = META.roster.find(p => p.id === id); if (!T[i] || !w || w.magic >= 5) return; T.splice(i, 1); w.magic++; SFX.play('level'); saveMeta(); refreshUI(); }
{ const f = holdingProps; holdingProps = () => inStoryNow() ? f() : f().concat([{x:TROPHY.x, y:TROPHY.y, k:'trophies'}]); }
{ const f = drawHoldingProp; drawHoldingProp = function(p){
    if (p.k !== 'trophies') return f(p);
    const T = (META.trophies || []).filter(t => !t.legend).slice(-8), x = p.x, y = p.y, hot   /* Index 42 */ = CAMP.hover && CAMP.hover.kind === 'trophies';
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 80, 10, 0, 0, TAU); ctx.fill();
    if (!(typeof w3dRack === 'function' && w3dRack(x, y))){ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 74, y - 84, 7, 88); ctx.fillRect(x + 67, y - 84, 7, 88); ctx.fillRect(x - 78, y - 88, 156, 9);
    ctx.fillStyle = hot ? '#b08a5a' : '#8a6a3a'; ctx.fillRect(x - 78, y - 88, 156, 3); }   /* Index 65 */
    T.forEach((t, i) => { const s = trophySprite(t), ix = x - 60 + i * 17; ctx.fillStyle = '#c8b890'; ctx.fillRect(ix, y - 80, 1, 4); blit(s, ix, y - 76, 2.2, false, s.width / 2, 0); });
    if (!(META.trophies || []).length){ ctx.fillStyle = 'rgba(240,230,210,.55)'; ctx.font = `italic ${typeof hudPx === 'function' ? hudPx(12) : 14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('No trophies yet', x, y - 40); }
    if (hot) campLabel(x, y - 92, 'The Trophy Rack', `${(META.trophies || []).length} curiosit${(META.trophies || []).length === 1 ? 'y' : 'ies'}`);
  }; }
{ const f = campHit; campHit = function(wx, wy){ const h = f(wx, wy); if (h || inStoryNow()) return h;
    return Math.abs(wx - TROPHY.x) < 82 && wy > TROPHY.y - 92 && wy < TROPHY.y + 10 ? {kind:'trophies', id:'trophies'} : null; }; }
// settings and manual
{ const f = settingsHTML; settingsHTML = function(dark){ const s = f(dark);
    return s.replace(/<\/div>\s*$/, `<label>Salvage <select onchange="META.salvageMode=this.value;saveMeta()"><option value="detailed" ${salvageMode() === 'detailed' ? 'selected' : ''}>Detailed (dice)</option><option value="quick" ${salvageMode() === 'quick' ? 'selected' : ''}>Quick (10%)</option></select></label></div>`); }; }
{ const f = openManual; openManual = function(){ f(); const lg = $('manual-inner').querySelector('.log'); if (!lg) return;
    lg.insertAdjacentHTML('beforeend', `<p><b>Officers' Legwork.</b> Once per downtime, from the campfire or the Camp Tavern, the Leader and one Squad Mate go into town and start a bar fight. Fists only. Waves of regulars come without end; each wave put down pays gold, then intelligence, then Standing, in turn. Spilled ale heals. Knocked out, you keep your winnings; leaving early is a Parley with the barkeep.</p>
      <p><b>Standing Down.</b> A Leader of Level 7 or more who has paid the Price of their Social Class may Stand Down from the Roster into a Legacy role: Chapter Master (replacing the current one, or alongside), Patron, or a Council Seat (Quartermaster, Spymaster, Drillmaster, Archivist). Serve on instead and every contract won adds 1 Renown, but a Condition roll against 5 after each risks a Permanent Injury. Renown 3 adds a Council Seat, 6 adds two and checks off a Charter Milestone.</p>
      <p><b>Detailed Salvage.</b> After a contract won or withdrawn from, one die per defeated enemy squad at the contract's Tier: scrap, coin and kit, a good haul, the enemy's own gear, or on 9+ a Curiosity for the Trophy Rack. Switch to Quick Salvage in Settings.</p>`); }; }

window.LEGWORK_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      const cleaned = cleanPerson({id: 1, name: 'A', bond: 2, resting: 1, trainingAt: 'barracks', trainingLabel: 'x', facility: 'y', newHire: true, pendingPicks: 1});
      ok('cleanPerson strips transient camp fields', cleaned.name === 'A' && !('bond' in cleaned) && !('resting' in cleaned) && !('trainingAt' in cleaned) && !('newHire' in cleaned) && !('pendingPicks' in cleaned));
      ok('clampN clamps and handles NaN', clampN(99, 0, 10, 5) === 10 && clampN(-5, 0, 10, 5) === 0 && clampN('bad', 0, 10, 5) === 5);
      let threw = false; try { takeImport({game: 'wrong'}); } catch (e) { threw = true; }
      ok('takeImport rejects non-matching game tag', threw);
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};

