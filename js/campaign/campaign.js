/* js/campaign/campaign.js (INT-1 step 2, 2026-11-16): THE CAMPAIGN LAYER, PROGRESSION.
   Cut unchanged from the inline script in index.html (old lines 4588 to 5102). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   THE CAMPAIGN LAYER - Player's Manual 1.6, Chapters 4 and 8.
   Veterans retired into facilities (4.4), Comrade Bonds (1.3), Tactical
   Doctrines (4.5), prisoners and Parley (4.8, 6.4), Faction Standing (8.5)
   and the Charter Ambition (4.1).
============================================================================ */

/* ---------------------------------------------------------------------------
   VETERAN STAFF - Table 4.3. A retired Squad Mate with 3 or more Advancements
   who matches one of the listed Races, Social Classes or Specialties gives
   the facility its Veteran Mastery bonus.
--------------------------------------------------------------------------- */
const VETERANS = {
  kitchen:    {match:['HALFLING','EDELOS'],        text:'+1 Ward Token at the start of every contract.'},
  tavern:     {match:['SCOUNDREL','HALFLING'],     text:'One more recruit on every Hiring Line.'},
  command:    {match:['NOBLE','SOLDIER'],          text:'The War Council rolls an extra Skill 2 die.'},
  merchant:   {match:['HALF_ELF','FREEMAN'],       text:'Trade income rises to 30gp a contract.'},
  cells:      {match:['CAMBION','SCOUNDREL'],      text:'Every interrogation is a Full Success.'},
  barracks:   {match:['SOLDIER','DARK_ELF'],       text:'New recruits start with +1 Melee (or +1 Ranged for a Folk Hero).'},
  training:   {match:['ORC','FOLK_HERO'],          text:'The squad moves 15% faster for the first round (6 seconds) of every contract.'},
  armoury:    {match:['HOBGOBLIN','DWARF'],        text:'1 more Ward Token at the start of every contract.'},
  stables:    {match:['ORC','EDELOS'],             text:'Mount cards give +2 Mount Pool.'},
  ranger:     {match:['HALF_ELF','FOLK_HERO'],     text:'Every Blip Token starts known.'},
  hospital:   {match:['CLERIC','DEVOUT'],          text:'Re-roll one failed injury check after every contract.'},
  blacksmith: {match:['DWARF','FREEMAN'],          text:'Metal armour and weapons cost 25% less.'},
  carpentry:  {match:['FIRBOLG','FREEMAN'],        text:'Two portable pavises: +2 Shield Pool (maximum 7).'},
  leather:    {match:['FREEMAN','OUTCAST'],        text:'In light armour the squad moves 5% faster.'},
  engineering:{match:['GNOME','GOBLIN'],           text:'A free Concussion Charge waits at the start of every contract.'},
  alchemy:    {match:['WITCH','ZUHRI'],            text:'Free Smoke Pots wait at the start of every contract.'},
  magetower:  {match:['MAGE','GREY_ELF'],          text:'A free Spell Scroll waits at the start of every contract.'},
  chapel:     {match:['DEVOUT'],                   text:"The squad's first Morale check each contract rolls twice and keeps the better."}
};
const matchName = k => (RACES[k] && RACES[k].name) || (CLASSES[k] && CLASSES[k].name) || (SPECS[k] && SPECS[k].name) || k;
const canRetire = p => p.injuries.length > 0 || p.adv >= 3;
const staffOf = fid => (META.retired || []).find(r => r.facility === fid);
function vetMatches(p, fid){ const v = VETERANS[fid]; return !!v && p.adv >= 3 && v.match.some(k => k === p.race || k === p.cls || k === p.spec); }
const mastery = fid => { const s = staffOf(fid); return !!(s && has(fid) && vetMatches(s, fid)); };

/* ---------------------------------------------------------------------------
   TACTICAL DOCTRINES - Table 4.4. Bought once from the Treasury.
--------------------------------------------------------------------------- */
const DOCTRINES = [
  {id:'concealment', name:'Concealment',          cost:100, req:['ranger'],   text:'Sleeping enemy camps and strongbox guards notice the squad at a little over half the usual distance.'},
  {id:'earthworks',  name:'Earthworks & Traps',   cost:100, req:['barracks|engineering'], text:'Stake Line starts every contract at rank 1.', card:'stakes'},
  {id:'spearwall',   name:'Spear Wall Mastery',   cost:120, req:['barracks'], text:'With Infantry Spears, a Shield Wall gets +1 AC against charging enemies.'},
  {id:'shieldlock',  name:'Shield Wall Lock',     cost:120, req:['barracks'], text:'Each round in a Shield Wall gives +1 Ward Token, and melee damage dice against a Shield Wall shift down 1 extra step.'},
  {id:'pushthrough', name:'Push Through',         cost:120, req:['barracks'], text:'A melee Solid Hit during a Charge forces the target to test Morale.'},
  {id:'skirmisher',  name:'Skirmisher Drill',     cost:140, req:['ranger'],   text:'Skirmisher Drill starts every contract at rank 1.', card:'skirmisher'},
  {id:'volley',      name:'Volley Fire',          cost:160, req:['ranger'],   text:'Volley Fire starts every contract at rank 1.', card:'volley'},
  {id:'feigned',     name:'Feigned Retreat',      cost:150, req:['command'],  text:'An enemy that catches the squad from behind while it is moving is exposed: attacks against it shift up 1 step for 3 seconds.'},
  {id:'fieldmed',    name:'Field Medicine',       cost:180, req:['hospital'], text:'Field Medicine starts every contract at rank 1, and Stabilising takes half the time.', card:'fieldmed'},
  {id:'plunder',     name:'Plunder Management',   cost:100, req:['command'],  text:'Plunder Management starts every contract at rank 1.', card:'plunder'},
  {id:'munitions',   name:'Munitions Drill',      cost:140, req:['engineering'], text:'Sharpers start every contract at rank 1.', card:'sharpers'},
  {id:'propaganda',  name:'Propaganda & Parley',  cost:120, req:['command'],  text:'+1 step on every Parley roll.'}
];
const hasDoc = id => !!(META && META.doctrines && META.doctrines[id]);
const docReqMet = d => d.req.every(r => r.split('|').some(has));

/* ---------------------------------------------------------------------------
   FACTIONS - Section 8.5. Standing runs from -3 to +3.
--------------------------------------------------------------------------- */
const FACTIONS = {
  empire:    {name:'Teradosian Empire',     patron:'Minor Imperial Noble',      perk:'Imperial Letter of Marque: the War Council rolls an extra Skill 2 die.'},
  suderia:   {name:'Suderian Freemen',      patron:'Suderian Freeman Merchant', perk:"Chain-Breaker's Haven: freed captives and recruited prisoners join with +1 Condition."},
  mendor:    {name:'Mendorian Order',       patron:'Mendorian Order Prelate',   perk:'Solar Reliquary: Cure Wounds heals 1 more, and +1 Ward Token at the start of every contract.'},
  dwarves:   {name:'Dwarven Syndicates',    patron:'Dwarven Syndicate Factor',  perk:'Kraggan Masterwork Steel: medium and heavy armour costs 20% less.'},
  reprobates:{name:'Reprobate Collective',  patron:'Reprobate Collective',      perk:'Outlaw Alchemist Formulas: a free Concussion Charge waits at the start of every contract.'},
  skulk:     {name:"The Skulk",       patron:'A Shadowy Broker',          perk:'The Whisper Network: one Blip Token starts known on every contract.'}
};
const factionOfPatron = pat => Object.keys(FACTIONS).find(k => FACTIONS[k].patron === pat) || 'skulk';
const COMMANDER_FACTION = {vane:'skulk', inquisitor:'empire'};
const standing = f => (META.standing && META.standing[f]) || 0;
const allied = f => standing(f) >= 2;
function shiftStanding(f, n, lines){
  META.standing = META.standing || {};
  const before = standing(f), after = Math.max(-3, Math.min(3, before + n));
  if (after === before) return;
  META.standing[f] = after;
  if (lines) lines.push(`<p class="${n > 0 ? 'good' : 'bad'}">Standing with ${facName(f)}: ${fmtStanding(before)} to ${fmtStanding(after)}${after >= 2 && before < 2 ? '. <b>Allied:</b> ' + String(FACTIONS[f].perk).replace(/\.$/, '') : after <= -2 && before > -2 ? '. <b>Hostile:</b> they will offer no more contracts' : ''}.</p>`);
}
const facName = f => (/^The /.test(FACTIONS[f].name) ? '' : 'the ') + FACTIONS[f].name;   /* K50: a name with its own 'The' gets no second one */
const fmtStanding = n => (n > 0 ? '+' : '') + n;
const standingLabel = n => n >= 3 ? 'Sworn Champion' : n >= 2 ? 'Allied' : n <= -3 ? 'Blood Enemy' : n <= -2 ? 'Hostile' : 'Professional';

/* ---------------------------------------------------------------------------
   PRISONERS - Section 4.8. Commanders who surrender at a Parley come home
   with 1d3 of their guard. Prisoner Cells hold six for free; without them
   each prisoner costs 5gp a contract, and any held for two contracts escape.
--------------------------------------------------------------------------- */
const PARLEY_COMMANDERS = ['vane','orsolt','inquisitor','ilvaryn'];
const commanderMorale = tier => tier + 1;          // Skill 2 / 3 / 4 (Section 6.8)

/* ---------------------------------------------------------------------------
   CHARTER AMBITION - Table 4.1, adapted to what the game can track.
   Milestones are taken in order. 3, 6 and 9 grant a perk; 10 is the finale.
--------------------------------------------------------------------------- */
const st = () => META.stats || (META.stats = {});
const AMBITIONS = {
  wealth:{name:'Wealth', sub:'The Golden Syndicate', ms:[
    {t:'Hold 300gp in the Treasury.',                         ok:() => META.treasury >= 300},
    {t:'Build Merchant Stalls, or two Workshops.',            ok:() => has('merchant') || ['blacksmith','carpentry','leather','engineering'].filter(has).length >= 2},
    {t:'Win 3 contracts.',                                    ok:() => (st().wins||0) >= 3, perk:'Trade Charter: +10% on every contract payout.'},
    {t:'Own armour with AC 5 or better.',                     ok:() => (window.ARM ? ARM.ownedIds() : META.gear.owned).some(id => gear(id).slot === 'armour' && gear(id).ac >= 5)},
    {t:'Hold 1,000gp in the Treasury.',                       ok:() => META.treasury >= 1000},
    {t:'Win 6 contracts.',                                    ok:() => (st().wins||0) >= 6, perk:'Syndicate Credit: all Quartermaster gear costs 20% less.'},
    {t:'Build 6 facilities.',                                 ok:() => Object.keys(META.facilities).length >= 6},
    {t:'Own Half-Plate.',                                     ok:() => (window.ARM ? ARM.ownedIds() : META.gear.owned).includes('halfplate')},
    {t:'Hold 2,000gp in the Treasury.',                       ok:() => META.treasury >= 2000, perk:'Master Mint: a further +10% on every contract payout.'},
    {t:"Finale, The Dragon's Vault Heist: win a Tier 3 contract.", ok:c => c && c.won && c.tier === 3}
  ]},
  fame:{name:'Fame', sub:'Legends of the Marches', ms:[
    {t:'Win a contract without losing a Squad Mate.',          ok:c => c && c.won && !c.deaths},
    {t:'Defeat a commander.',                                 ok:() => (st().commanders||0) >= 1},
    {t:'Defeat 3 commanders in total.',                       ok:() => (st().commanders||0) >= 3, perk:'The War Council rolls an extra Skill 2 die.'},
    {t:'Earn 3 Contract Edges from one War Council.',         ok:() => (st().bestCouncil||0) >= 3},
    {t:'Defeat a Tier 2 or Tier 3 commander.',                ok:() => (st().bigCommanders||0) >= 1},
    {t:'Win a contract with no Contract Edges.',              ok:c => c && c.won && !c.edges, perk:'Enemies test Morale 1 step lower while the squad Charges.'},
    {t:'Win a Tier 3 contract.',                              ok:c => c && c.won && c.tier === 3},
    {t:'Defeat two commanders in one contract without the Leader going down.', ok:c => c && c.commanders >= 2 && !c.leaderDowns},
    {t:'Defeat 10 commanders in total.',                      ok:() => (st().commanders||0) >= 10, perk:'Living Legends: every enemy Morale check rolls 1 step lower.'},
    {t:'Finale, Siege of the World Temple: win a Tier 3 Headhunter Clash.', ok:c => c && c.won && c.tier === 3 && c.obj === 'hunt'}
  ]},
  liberation:{name:'Liberation', sub:'Chain-Breakers', ms:[
    {t:'Free a captive.',                                     ok:() => (st().freed||0) >= 1},
    {t:'Build a Field Hospital.',                             ok:() => has('hospital')},
    {t:'Reach +1 Standing with the Suderian Freemen.',        ok:() => standing('suderia') >= 1, perk:'Squad Morale checks roll 1 step higher.'},
    {t:'Free 3 captives in total.',                           ok:() => (st().freed||0) >= 3},
    {t:'Retire 3 veterans into camp facilities.',             ok:() => (META.retired||[]).length >= 3},
    {t:'Free 5 captives in total.',                           ok:() => (st().freed||0) >= 5, perk:'Underground Railroad: Ex-Slave recruits on the Hiring Line cost nothing.'},
    {t:'Reach +3 Standing with the Suderian Freemen.',        ok:() => standing('suderia') >= 3},
    {t:'Free 8 captives in total.',                           ok:() => (st().freed||0) >= 8},
    {t:'Win 10 contracts.',                                   ok:() => (st().wins||0) >= 10, perk:'Voice of the Free: +2 Ward Tokens at the start of every contract.'},
    {t:'Finale, The Chains of Cois Abhann: win a Tier 3 High-Value Extraction.', ok:c => c && c.won && c.tier === 3 && c.obj === 'extract'}
  ]},
  dominion:{name:'Dominion', sub:'Frontier Warlords', ms:[
    {t:'Complete a contract for a Minor Imperial Noble.',     ok:c => c && c.won && c.faction === 'empire'},
    {t:'Build Barracks & Drill Yard.',                        ok:() => has('barracks')},
    {t:'Win a Hold the Redoubt contract.',                    ok:() => (st().holdWins||0) >= 1, perk:'+1 maximum Luck for the Leader (cap 6).'},
    {t:'Reach +2 Standing with any faction.',                 ok:() => Object.keys(FACTIONS).some(f => standing(f) >= 2)},
    {t:'Win a Headhunter Clash.',                             ok:() => (st().huntWins||0) >= 1},
    {t:'Win 5 contracts.',                                    ok:() => (st().wins||0) >= 5, perk:"Warlord's Levy: Hazard Upkeep is halved, and the civilian staff of one facility is free."},
    {t:'Win 2 Hold the Redoubt contracts and build 3 of: Barracks, Training Grounds, Armoury, Stables.', ok:() => (st().holdWins||0) >= 2 && ['barracks','training','armoury','stables'].filter(has).length >= 3},
    {t:'Reach +2 Standing with two factions at once.',        ok:() => Object.keys(FACTIONS).filter(f => standing(f) >= 2).length >= 2},
    {t:'Win 10 contracts.',                                   ok:() => (st().wins||0) >= 10, perk:'Iron Hegemony: one free Contract Edge on every contract.'},
    {t:'Finale, Battle of the Grey Keep: win a Tier 3 Hold the Redoubt.', ok:c => c && c.won && c.tier === 3 && c.obj === 'hold'}
  ]}
};
const perk = (track, n) => !!(META && META.ambition && META.ambition.track === track && META.ambition.done >= n);
function checkMilestones(ctx, lines){
  const A = META.ambition; if (!A) return;
  const ms = AMBITIONS[A.track].ms;
  while (A.done < ms.length && ms[A.done].ok(ctx)){
    const m = ms[A.done]; A.done++;
    const msg = A.done === 10 ? `<b>Charter fulfilled.</b> ${m.t.replace(/:.*/, '')}. The Chapter's name will be told in every tavern in Arcadia.`
      : `<b>Milestone ${A.done}:</b> ${m.t}${m.perk ? ` <b>Perk:</b> ${m.perk}` : ''}`;
    if (lines) lines.push(`<p class="good">${msg}</p>`);
    else (META.pendingNotes = META.pendingNotes || []).push(msg);
    if (A.done === 3 && A.track === 'dominion' && META.leader && leaderStats(META.leader).rawLuck > 6) META.treasury += 60;
  }
}
function chooseAmbition(k){ META.ambition = {track:k, done:0}; checkMilestones(null); saveMeta(); openChapter(); }

/* ---------------------------------------------------------------------------
   PARLAY - Section 6.4. A commander below a third of their Condition raises
   a white flag. Demand surrender (opposed roll), let them withdraw, or fight.
--------------------------------------------------------------------------- */
let PARLAY = null;
function offerParlay(e){
  e.parleyed = true;
  const B = BESTIARY[e.k];
  if (e.mark) return;
  PARLAY = {e, rolled:null};
  G.paused = true; for (const k in keys) keys[k] = false;
  SFX.play('horn');
  renderParlay();
  $('overlay-parlay').classList.remove('hidden');
}
// Parley modifiers (Section 6.4): broken enemy forces, Standing, and Propaganda & Parley.
function parlayMods(e){
  const fac = COMMANDER_FACTION[e.k], out = [];
  if (hasDoc('propaganda')) out.push('+1 Propaganda & Parley');
  if (G.bossKills > 0) out.push('+1 a commander already defeated');
  if (fac && allied(fac)) out.push(`+1 Allied with ${facName(fac)}`);
  if (fac && standing(fac) <= -2) out.push(`-1 Hostile with ${facName(fac)}`);
  if (G.leader.down) out.push('-2 the Leader is down');
  return out;
}
const parlayStep = () => parlayMods(PARLAY.e).reduce((a, t) => a + parseInt(t), 0);
function renderParlay(){
  const e = PARLAY.e, B = BESTIARY[e.k], step = parlayStep(), per = clampSkill(G.leader.s.per + step), mor = commanderMorale(B.tier);
  let body;
  if (!PARLAY.rolled){
    body = `<div class="sub" style="color:#ddd">${esc(ename(e))} is hurt and raises a white flag. Talks are opposed: your Leader's Personality die (Skill ${per}) against their Morale die (Skill ${mor}). Higher face wins; ties go to you.</div>
      <div class="sub" style="color:#aaa;font-size:13px">Modifiers: ${parlayMods(e).join(', ') || 'none'}.</div>
      <div class="row" style="margin-top:10px">
        <div class="card" style="width:230px" onclick="parlayChoice('surrender')"><div class="ttl">Demand Surrender</div><div class="desc">Roll. Win: they lay down arms and come home as prisoners with some of their guard. Lose: talks collapse and the fight goes on.</div></div>
        <div class="card" style="width:230px" onclick="parlayChoice('withdraw')"><div class="ttl">Let Them Withdraw</div><div class="desc">No roll. They leave the field with their guard. The objective counts, but there is no War Chest, no ransom and no Momentum.</div></div>
        <div class="card" style="width:230px" onclick="parlayChoice('fight')"><div class="ttl">Fight On</div><div class="desc">Refuse. They will not offer again.</div></div>
      </div>`;
  } else {
    const r = PARLAY.rolled;
    body = `<div class="row"><div class="card static" style="width:160px"><div class="tag">Your Leader</div><div class="ttl" style="font-size:30px">${r.mine}</div><div class="desc">Skill ${r.per || per}</div></div>
      <div class="card static" style="width:160px"><div class="tag">${esc(ename(e))}</div><div class="ttl" style="font-size:30px">${r.theirs}</div><div class="desc">Skill ${mor}</div></div></div>
      <div class="sub" style="color:${r.win ? '#8fd39a' : '#ff8a7a'};font-size:18px;margin-top:8px">${r.win ? `${esc(ename(e))} lays down arms.` : `${esc(ename(e))} refuses. The fight goes on.`}</div>
      <button class="btn gold" onclick="closeParlay()">BACK TO THE FIELD</button>`;
  }
  $('parlay-inner').innerHTML = `<h1>Parley</h1>${img(enemyIconURL(e.k))}${body}`;
}
function parlayChoice(ch){
  const e = PARLAY.e, B = BESTIARY[e.k];
  if (ch === 'fight'){ note(`You refuse ${ename(e)}'s white flag.`); return closeParlay(); }
  if (ch === 'withdraw'){ commanderGone(e, 'withdraw'); return closeParlay(); }
  // per: the skill rolled, kept, so the result does not count this commander's own surrender as a modifier (Planner replay)
  const per = clampSkill(G.leader.s.per + parlayStep()), mine = rollDie(per), theirs = rollDie(commanderMorale(B.tier)), win = mine >= theirs;
  PARLAY.rolled = {mine, theirs, win, per};
  SFX.play(win ? 'win' : 'nope');
  if (win) commanderGone(e, 'surrender');
  renderParlay();
}
function closeParlay(){ $('overlay-parlay').classList.add('hidden'); PARLAY = null; if (G && !G.over) G.paused = false; }

// A commander leaves the field without dying: surrender or withdrawal.
function commanderGone(e, mode){
  const B = BESTIARY[e.k];
  e.dead = true; e.gone = mode;
  G.bossKills++; G.commandersDefeated.push(B.tier);
  if (e.home){ e.home.done = true; G.alarm++; }
  G.fx.push({ring:true, x:e.x, y:e.y, r:120, life:20, c:'#ffffff'});
  if (mode === 'surrender'){
    const common = 1 + (Math.random() * 3 | 0);
    G.prisoners.push({kind:'commander', k:e.k, name:ename(e), tier:B.tier, value:COMMANDER_PRISONER_VALUE});
    for (let i = 0; i < common; i++) G.prisoners.push({kind:'common', name:'Captured ' + (B.guards ? BESTIARY[B.guards[i % B.guards.length]].name : 'soldier'), tier:B.tier, value:15});
    note(`${ename(e)} surrenders with ${common} of their guard. They come home as prisoners if the contract is not lost.`);
    if (e.nemesis) nemesisSlain(e, 'surrender');
    momentum();
  } else { note(`${ename(e)} withdraws from the field, and will remember you.`); recordNemesis(e); }
  // their guard leaves too; everyone else nearby tests Morale
  for (const o of G.enemies){
    if (o.dead || o === e) continue;
    if ((e.group && o.group === e.group) || dist(o, e) < 220){ o.dead = true; o.gone = mode; continue; }
    if (dist(o, e) < 520 && !BESTIARY[o.k].boss) enemyMorale(o, true, 1);
  }
  if (e.home && G.obj === 'hunt') huntingParty();
}

/* ---------------------------------------------------------------------------
   THE CHAPTER SCREEN - Charter Ambition, Faction Standing, prisoners
--------------------------------------------------------------------------- */
const councilDiff = c => RESISTANCE[c.tier] - (c.faction && allied(c.faction) ? 1 : 0) - (cmIs('NOBLE') && c.faction === 'empire' ? 1 : 0);
let CH_MSG = '';
const COMMANDER_PRISONER_VALUE = 100;   // [T] a surrendered commander's ransom at the standard price (the Class step's surrender note quotes it: catches.js)
function prisonerAct(i, act){
  const pr = META.prisoners[i], L = META.leader, per = leaderStats(L).per;
  if (act === 'ransom'){
    const r = attackDie(per, 5), full = r.out === 'solid' || r.out === 'crit', miss = r.out === 'miss';
    const v = Math.round(pr.value * (full ? 1.25 : miss ? 0.75 : 1));
    META.treasury += v; META.prisoners.splice(i, 1);
    CH_MSG = `Haggling roll ${r.face}: ${full ? 'a hard bargain, +25%' : miss ? 'a poor bargain, -25%' : 'the standard price'}. ${esc(pr.name)} is ransomed for ${v}gp.`;
  }
  if (act === 'interrogate'){
    pr.asked = true;
    const r = attackDie(per, 5), full = mastery('cells') || r.out === 'solid' || r.out === 'crit', part = r.out === 'graze';
    if (full){ META.intel = 'full'; CH_MSG = `${mastery('cells') ? 'The veteran in the cells does the asking.' : `Interrogation roll ${r.face}: Full Success.`} ${esc(pr.name)} talks: your next contract starts with the whole map revealed and every Blip Token known.`; }
    else if (part){ META.intel = 'blips'; pr.value = Math.round(pr.value / 2); CH_MSG = `Interrogation roll ${r.face}: Partial Success. Every Blip Token on your next contract starts known, but the prisoner is too damaged to fetch full ransom.`; }
    else CH_MSG = `Interrogation roll ${r.face}: ${esc(pr.name)} tells you nothing true.`;
  }
  if (act === 'recruit'){
    if (META.roster.length >= rosterCap()) return;
    const m = rollRecruit('OUTCAST'); m.id = META.nextId++; if (allied('suderia')) m.conTrained = 1;
    META.roster.push(m); META.prisoners.splice(i, 1); st().freed = (st().freed || 0) + 1;
    CH_MSG = `${esc(m.name)}, a ${RACES[m.race].name} ${SPECS[m.spec].name}, swears to the Chapter and joins the roster.`;
  }
  if (act === 'recruit' || act === 'release') liberationDeed(1);
  if (act === 'release'){ META.prisoners.splice(i, 1); st().freed = (st().freed || 0) + 1; CH_MSG = `${esc(pr.name)} is set free.`; }
  SFX.play('pick'); checkMilestones(null); saveMeta(); renderChapter();
}

/* ============================================================================
   PROGRESSION - Player's Manual 1.6, Section 4.6, 4.4 and 7.1.
   After every contract the company survives (a win or a fighting
   withdrawal), the Leader marks 1 XP tick (Level up every 3) and the player
   gives 1 Advancement to each of 2 different Squad Mates, benched mates
   included. A Squad Mate may hold at most Leader Level + 1 Advancements.
   Camp facilities can also train a Squad Mate for gold: the same cap, the
   same Specialty limits, and they sit out the next contract while they train.
   Officers are Squad Mates promoted ready to lead; any of them can take
   command if the Leader dies, stands down, or goes to officer training.
============================================================================ */
const OFFICER_CAP = 2;
const ADV_LABEL = {con:'+1 Condition', melee:'+1 Melee', ranged:'+1 Ranged', magic:'+1 Magic'};
// Spells, prayers and workings (Chapter 7): studied at the Mage Tower, Chapel
// or Alchemy Lab, kept for good, and starting every contract at rank 1.
const SPELL_IDS = ['burning','frost','fireball','masscure','bless','briar','hex'];
const SPELL_HOME = {burning:'magetower', frost:'magetower', fireball:'magetower', masscure:'chapel', bless:'chapel', briar:'alchemy', hex:'alchemy'};
const spellsFor = (p, fid) => CARDS.filter(c => SPELL_IDS.includes(c.id) && SPELL_HOME[c.id] === fid && c.spec === p.spec && !(p.picks || []).includes(c.id) && (!c.minMagic || (p.magic || 0) >= c.minMagic));   /* Index 39 */
function firstPickLevel(spec){ for (let l = 1; l <= 11; l++) if (rowFor(spec, l)[2] === 'pick') return l; return 99; }
function learnable(p){
  if ((1 + p.adv + 1) < firstPickLevel(p.spec)) return [];
  return CARDS.filter(c => c.ability && c.spec === p.spec && !(p.picks || []).includes(c.id));
}
// Options for one Advancement. Magic is only ever raised by study at a camp
// facility (Section 7.1), never in the field.
function advChoices(p, withMagic){
  const capOK = p.adv < advCap(), row = rowFor(p.spec, 2 + p.adv), out = [];
  out.push({k:'con',    label:'+1 Condition', ok:capOK && p.conTrained < 2, why:!capOK ? 'at the cap' : 'already +2'});
  out.push({k:'melee',  label:'+1 Melee',     ok:capOK && p.baseM + 1 <= row[0], why:!capOK ? 'at the cap' : 'Specialty limit for their Level'});
  out.push({k:'ranged', label:'+1 Ranged',    ok:capOK && p.baseR + 1 <= row[1], why:!capOK ? 'at the cap' : 'Specialty limit for their Level'});
  for (const c of learnable(p)) out.push({k:'ab:' + c.id, label:'Learn ' + c.name, ok:capOK, why:'at the cap', ability:c});
  return out;
}
function doAdvance(p, k){
  if (k.startsWith('ab:')){ (p.picks = p.picks || []).push(k.slice(3)); p.adv++; return CARDS.find(c => c.id === k.slice(3)).name; }
  applyAdvance(p, k); return ADV_LABEL[k];
}

/* ---------------------------------------------------------------------------
   THE TWO ADVANCEMENTS AFTER A CONTRACT
--------------------------------------------------------------------------- */
function grantAdvancements(lines){
  const R = META.advRound = META.advRound || {left:0, given:[]};
  R.carried = R.left | 0; R.left += 2; R.given = [];   // K102b: R.carried = left over from the last round, shown in the picker
  if (lines) lines.push(`<p class="good">The company learns from the contract: <b>give 1 Advancement to each of 2 different Squad Mates</b>. Squad Mates may hold up to ${advCap()}.</p>`);
}
const advLeft = () => (META.advRound ? META.advRound.left : 0);
const advCarried = () => { const R = META.advRound; return R ? Math.max(0, Math.min(R.left | 0, (R.carried | 0) - (R.given || []).length)) : 0; };   // K102b: carried-over picks are spent first
const advPickLine = left => (left > 1 ? 'One each to ' + left + ' different Squad Mates' : 'One to one Squad Mate');   // the carried count sits on the heading (UX K102b)
function giveAdvancement(pid, k){
  const R = META.advRound, p = META.roster.find(x => x.id === pid);
  if (!R || R.left <= 0 || !p || R.given.includes(pid)) return;
  const o = advChoices(p).find(x => x.k === k); if (!o || !o.ok) return;
  const label = doAdvance(p, k);
  R.left--; R.given.push(pid); if (R.left <= 0) R.given = [];
  ADVMSG = `${p.name}: ${label}.${featureNote(p.spec, 1 + p.adv) ? ' ' + featureNote(p.spec, 1 + p.adv) + '.' : ''}`;
  SFX.play('level'); saveMeta(); refreshProgression();
}
let ADVMSG = '', ADVOPEN = null;
function advanceBlock(){
  const R = META.advRound, left = advLeft();
  if (!left) return '';
  const cands = META.roster.filter(p => !R.given.includes(p.id));
  const rows = cands.map(p => {
    const open = ADVOPEN === p.id, ch = advChoices(p);
    return `<div class="line"><img src="${portraitURL(p, false)}"><div class="grow"><b>${esc(p.name)}</b> \u00b7 ${SPECS[p.spec].name} \u00b7 ${mateLine(p)}<br>
      <span style="font-size:14px">Advancements ${p.adv} / ${advCap()}${p.adv >= advCap() ? ' (at the cap)' : ''}</span>
      ${open ? '<div class="mini" style="justify-content:flex-start">' + ch.map(o => `<button ${o.ok ? '' : 'disabled'} title="${o.ok ? (o.ability ? o.ability.text(1) : '') : o.why}" onclick="giveAdvancement(${p.id},'${o.k}')">${o.label}</button>`).join('') + '</div>' : ''}</div>
      <button onclick="ADVOPEN=${open ? 'null' : p.id};refreshProgression()" ${p.adv >= advCap() ? 'disabled' : ''}>${open ? 'Close' : 'Advance'}</button></div>`;
  }).join('') || '<div class="desc">Nobody on the roster can take it. It waits for a new recruit.</div>';
  return `<div class="advbox"><h3 style="margin:0 0 4px">Advancements to give: ${left}${advCarried() ? ' (' + esc(((window.CAMPAIGN_LINES && CAMPAIGN_LINES.advCapWhy && CAMPAIGN_LINES.advCapWhy.carried) || '{n} carried over').replace(/\{n\}/g, advCarried())) + ')' : ''}</h3>
    <div class="desc" style="text-align:left">${advPickLine(left)}, benched mates included. Choose +1 Condition, +1 Melee, +1 Ranged, or a Specialty ability. A Squad Mate's dice cannot pass the Specialty row for their effective Level, and they may hold at most Leader Level + 1 (${advCap()}) Advancements.</div>
    ${ADVMSG ? `<div class="desc" style="color:#226b2a;text-align:left"><b>${esc(ADVMSG)}</b></div>` : ''}${rows}</div>`;
}
function refreshProgression(){
  if (!$('screen-debrief').classList.contains('hidden') && renderDebrief.last) renderDebrief(renderDebrief.last.head, renderDebrief.last.lines);
  if (typeof refreshUI === 'function') refreshUI();
}

/* ---------------------------------------------------------------------------
   TRAINING AT CAMP FACILITIES (Sections 4.4 and 7.1)
   Each counts as an Advancement (same cap, same Specialty limits), costs
   gold, and the Squad Mate sits out the next contract at the facility.
--------------------------------------------------------------------------- */
const TRAINING = {
  training:  [{k:'con',    label:'Endurance drill: +1 Condition', cost:() => 50,  ok:p => p.conTrained < 2, why:'already +2 Condition'}],
  barracks:  [{k:'melee',  label:'Weapons drill: +1 Melee',       cost:() => 60,  ok:p => p.baseM + 1 <= rowFor(p.spec, 2 + p.adv)[0], why:'Specialty limit for their Level'}],
  ranger:    [{k:'ranged', label:'Fieldcraft: +1 Ranged',         cost:() => 60,  ok:p => p.baseR + 1 <= rowFor(p.spec, 2 + p.adv)[1], why:'Specialty limit for their Level'}],
  magetower: [{k:'magic',  label:'Arcane study: +1 Magic',        spec:'MAGE',   cost:p => 100 * (p.magic + 1), ok:p => p.magic < 5, why:'Magic 5 is the limit'},
              {k:'spell',  label:'Learn a spell',                 spec:'MAGE',   cost:() => 90, ok:p => spellsFor(p, 'magetower').length > 0, why:'no spell left to learn here'}],
  chapel:    [{k:'magic',  label:'Devotions: +1 Magic',           spec:'CLERIC', cost:p => 50 * (p.magic + 1),  ok:p => p.magic < (has('fortresschurch') ? 5 : 2), get why(){ return has('fortresschurch') ? 'Magic 5 is the limit' : 'a Chapel teaches Divine Magic to 2; the Fortress Church teaches 3 to 5'; }}   /* Index 37 */,
              {k:'spell',  label:'Learn a prayer',                spec:'CLERIC', cost:() => 90, ok:p => spellsFor(p, 'chapel').length > 0, why:'no prayer left to learn here'}],
  alchemy:   [{k:'magic',  label:'Fetish-craft: +1 Magic',        spec:'WITCH',  cost:p => 75 * (p.magic + 1),  ok:p => p.magic < 5, why:'Magic 5 is the limit'},
              {k:'spell',  label:'Learn a working',               spec:'WITCH',  cost:() => 90, ok:p => spellsFor(p, 'alchemy').length > 0, why:'nothing left to learn here'}],
  command:   [{k:'ability',label:'Tactics instruction: learn a Specialty ability', cost:() => 80, ok:p => learnable(p).length > 0, why:'nothing left to learn at their Level'}],
  hospital:  [{k:'scars',  label:'Heal Scars of Servitude: remove the -1 Condition', cost:() => 50, free:true, ok:p => p.cls === 'SLAVE' && !p.scarsHealed, why:'only for Ex-Slaves with scars'}]
};
const busy = p => p.resting > 0;
function trainingFor(fid, p){
  return (TRAINING[fid] || []).filter(t => !t.spec || t.spec === p.spec).map(t => {
    const capOK = t.free || p.adv < advCap(), cost = t.cost(p);
    const ok = !busy(p) && capOK && t.ok(p) && META.treasury >= cost;
    return Object.assign({}, t, {cost, ok, why: ok ? '' : busy(p) ? 'already resting or training' : !capOK ? 'at the Advancement cap (Leader Level + 1)' : !t.ok(p) ? t.why : 'not enough gold'});
  });
}
function trainAt(pid, fid, k, abId){
  const p = META.roster.find(x => x.id === pid); if (!p || !has(fid)) return;
  const t = trainingFor(fid, p).find(x => x.k === k); if (!t || !t.ok) return;
  META.treasury -= t.cost;
  let what;
  if (k === 'scars'){ p.scarsHealed = true; p.startCon += 1; what = 'Scars of Servitude healed: +1 Condition'; }
  else if (k === 'ability' || k === 'spell'){ const c = abId ? CARDS.find(x => x.id === abId) : (k === 'spell' ? spellsFor(p, fid) : learnable(p))[0]; (p.picks = p.picks || []).push(c.id); p.adv++; what = 'learnt ' + c.name; }
  else { applyAdvance(p, k); what = ADV_LABEL[k]; }
  p.resting = 1; p.trainingAt = fid; p.trainingLabel = what;
  SFX.play('brace'); saveMeta(); refreshProgression();
  return what;
}
let TRN = null;   // a training choice waiting to be confirmed
const TRN_SHORT = {con:'+1 Condition', melee:'+1 Melee', ranged:'+1 Ranged', scars:'Heal the scars'};
function trainAsk(pid, fid, k, ab){ TRN = {pid, fid, k, ab:ab || null}; SFX.play('pick'); refreshProgression(); }
function trainConfirm(){ const t = TRN; TRN = null; if (t) trainAt(t.pid, t.fid, t.k, t.ab || undefined); else refreshProgression(); }
function trainWhat(p, fid, k, ab){
  if (k === 'magic') return `+1 Magic (${p.magic} \u2192 ${p.magic + 1})`;
  if (k === 'spell' || k === 'ability') return 'learns ' + (CARDS.find(c => c.id === ab) || {}).name;
  return TRN_SHORT[k] || k;
}
function trainingHTML(fid){
  const T = TRAINING[fid]; if (!T || !has(fid)) return '';
  const inHere = META.roster.filter(p => p.trainingAt === fid && p.resting > 0);
  let h = `<div class="desc" style="text-align:left;margin-top:8px"><b>Training here:</b> ${T.map(t => t.label + (t.spec ? ` (${specPlural(t.spec)} only)` : '')).join('; ')}.
    ${T[0].free ? '' : 'Each counts as an Advancement (cap: Leader Level + 1).'} <b>Only the Squad Mate you choose trains, and they sit out the next contract.</b> Choose an option, then confirm.</div>`;
  if (inHere.length) h += `<div class="desc" style="text-align:left;color:#226b2a"><b>In training now:</b> ${inHere.map(p => `${esc(p.name)} (${esc(p.trainingLabel || '')})`).join(', ')}.</div>`;
  const cands = META.roster.filter(p => T.some(t => !t.spec || t.spec === p.spec));
  const line = p => {
    const opts = trainingFor(fid, p);
    // the option waiting on Confirm carries class "picked" (and aria-pressed) so CSS can mark it (Art, PROG-1 note)
    const picked = (t, ab) => !!(TRN && TRN.pid === p.id && TRN.fid === fid && TRN.k === t.k && (TRN.ab || null) === (ab || null));
    const btn = (t, ab, label, tip) => `<button ${t.ok ? '' : 'disabled'} data-tip="${esc(t.ok ? tip : label + ': ' + t.why)}"${picked(t, ab) ? ' class="on picked" aria-pressed="true"' : ''} onclick="trainAsk(${p.id},'${fid}','${t.k}'${ab ? `,'${ab}'` : ''})">${label}, ${t.cost}gp</button>`;
    const btns = opts.map(t => (t.k === 'ability' || t.k === 'spell') && t.ok
      ? (t.k === 'spell' ? spellsFor(p, fid) : learnable(p)).map(c => btn(t, c.id, 'Learn ' + c.name, c.text(1))).join('')
      : btn(t, null, t.k === 'magic' ? `+1 Magic (${p.magic} \u2192 ${p.magic + 1})` : TRN_SHORT[t.k] || t.label, t.label + '. ' + p.name + ' sits out the next contract.')).join('');
    const ask = TRN && TRN.pid === p.id && TRN.fid === fid ? (() => { const t = opts.find(x => x.k === TRN.k) || {};
      return `<div class="plaque" style="margin-top:4px"><b>${esc(p.name)}</b> ${trainWhat(p, fid, TRN.k, TRN.ab)} for <b>${t.cost}gp</b>, and sits out the next contract.<div class="mini" style="justify-content:flex-start"><button onclick="trainConfirm()">Confirm</button><button onclick="TRN=null;refreshProgression()">Cancel</button></div></div>`; })() : '';
    return `<div class="line" style="flex-wrap:wrap"><img src="${portraitURL(p, false)}"><div class="grow" data-pid="${p.id}"><b>${esc(p.name)}</b><br>${mateLine(p)} \u00b7 Adv ${p.adv}/${advCap()}${busy(p) ? '<br><i>' + (p.trainingAt ? 'In training' : 'Resting') + '</i>' : ''}</div><div class="mini" style="flex-direction:column">${btns}</div>${ask ? `<div style="flex-basis:100%">${ask}</div>` : ''}</div>`;
  };
  /* PD-42 (Patrick Q42, 2026-11-16): the mates sit in closed sections by Specialty; a section opens on a click and stays open
     on a redraw (TRN_OPEN); the one with an option waiting on Confirm opens itself. The Roster card has the same options. */
  const groups = {}; for (const p of cands) (groups[p.spec] = groups[p.spec] || []).push(p);
  h += !cands.length ? '<div class="desc">Nobody on the roster can train here.</div>' : Object.keys(groups).map(sp => {
    const k = fid + ':' + sp, ps = groups[sp], open = TRN_OPEN[k] || (TRN && TRN.fid === fid && ps.some(p => p.id === TRN.pid));
    return `<details class="trn42" data-spec42="${sp}"${open ? ' open' : ''} ontoggle="TRN_OPEN['${k}']=this.open" style="text-align:left;margin:4px 0">`
      + `<summary style="cursor:pointer;padding:4px 0"><b style="color:${SPECS[sp].color}">${specPlural(sp)}</b> (${ps.length}): ${ps.map(p => esc(p.name)).join(', ')}</summary>${ps.map(line).join('')}</details>`;
  }).join('');
  return h;
}
const TRN_OPEN = {};   // PD-42: which Specialty sections are open, per building
/* UX K96 (K47's pattern): a closed section for a long block in a building panel; open state kept per key in TRN_OPEN.
   K96 = false draws the blocks open, as before. */
var K96;
function sec96(key, sum, body, open){
  if (K96 === false) return body;
  return `<details class="k96" data-k96="${key}"${TRN_OPEN['k96:' + key] || open ? ' open' : ''} ontoggle="TRN_OPEN['k96:${key}']=this.open" style="text-align:left;margin:6px 0">`
    + `<summary style="cursor:pointer;padding:4px 0">${sum}</summary>${body}</details>`;
}
/* PD-42: a mate's own training options, for the Roster card: each built building, its options in one closed section;
   an option opens that building with the Confirm line waiting (the same trainAsk/trainConfirm flow) */
function trainOptsHTML(p){
  if (!p || typeof FACILITIES === 'undefined') return '';
  const rows = FACILITIES.filter(f => TRAINING[f.id] && has(f.id) && TRAINING[f.id].some(t => !t.spec || t.spec === p.spec)).map(f => {
    const opts = trainingFor(f.id, p).filter(t => t.ok);
    const btns = opts.flatMap(t => (t.k === 'ability' || t.k === 'spell') ? (t.k === 'spell' ? spellsFor(p, f.id) : learnable(p)).map(c => [t, c.id, 'Learn ' + c.name]) : [[t, null, t.k === 'magic' ? `+1 Magic (${p.magic} → ${p.magic + 1})` : TRN_SHORT[t.k] || t.label]])
      .map(([t, ab, lab]) => `<button onclick="trainFromRoster(${p.id},'${f.id}','${t.k}'${ab ? `,'${ab}'` : ''})">${esc(lab)}, ${t.cost}gp</button>`).join('');
    return btns ? `<div style="margin:3px 0"><b>${esc(f.name)}:</b><div class="mini" style="justify-content:flex-start;flex-wrap:wrap">${btns}</div></div>` : '';
  }).filter(Boolean);
  if (!rows.length) return '';
  const n = (rows.join('').match(/<button/g) || []).length;
  return `<details class="trn42r" style="text-align:left;margin-top:4px"><summary style="cursor:pointer"><b>Train</b> (${n} option${n === 1 ? '' : 's'})</summary>${rows.join('')}</details>`;
}
function trainFromRoster(pid, fid, k, ab){
  const p = META.roster.find(x => x.id === pid); if (!p) return;
  TRN = {pid, fid, k, ab: ab || null}; TRN_OPEN[fid + ':' + p.spec] = true; SFX.play('pick');
  renderTitle(); openPanel('building', fid);
  try { const el = document.querySelector('#camp-panel [data-pid="' + pid + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({block: 'center'}); } catch (e) {}
}

/* ---------------------------------------------------------------------------
   OFFICERS AND THE LEADER
--------------------------------------------------------------------------- */
const officers = () => (META.officers = META.officers || []);
const readyOfficers = () => officers().filter(o => !(o.resting > 0) && !o.away);
// Section 4.6, Field Promotion: Level is the mate's effective Level, capped
// at the current (or fallen) Leader's. Their Leader stats come from the row.
function mateToLeader(p, cap){   /* Index 35: nothing the Squad Mate trained is thrown away */
  const L = {name:p.name, race:p.race, cls:p.cls, spec:p.spec, sex:sexOf(p), id:p.id,
    level:Math.max(1, Math.min(1 + p.adv, cap)), ticks:0, burnt:0, picks:[], injuries:p.injuries.slice(),
    kills:p.kills || 0, deployments:p.deployments || 0,
    magic:p.magic || 0, xM:p.xM || 0, xR:p.xR || 0, deity:p.deity, devotion:p.devotion || 0, scars:p.scars || 0, scarsHealed:!!p.scarsHealed};
  let picks = 0; for (let l = 1; l <= L.level; l++) if (rowFor(L.spec, l)[2] === 'pick') picks++;
  const abils = (p.picks || []).filter(id => CARDS.find(c => c.id === id && c.ability)).slice(0, picks);
  L.picks = abils.concat((p.picks || []).filter(id => SPELL_IDS.includes(id) && !abils.includes(id)));   // spells and prayers were paid for at the Tower or Chapel
  L.pendingPicks = picks - abils.length;
  return L;
}
const canPromote = p => p.adv >= 2 && officers().length < OFFICER_CAP && has('command') && !busy(p) && !p.away;
function promoteOfficer(pid){
  const i = META.roster.findIndex(x => x.id === pid), p = META.roster[i];
  if (!p || !canPromote(p) || META.treasury < 100) return;
  META.treasury -= 100; unbond(p); META.roster.splice(i, 1);
  officers().push(mateToLeader(p, META.leader ? META.leader.level : META.fallenLevel || 1));
  SFX.play('win'); saveMeta(); refreshProgression();
}
// Swap the Leader for an officer. mode: 'swap' (old Leader joins the officers),
// 'train' (old Leader joins them in officer training), 'retire' (staffs fid).
function takeCommand(oi, mode = 'swap', fid){
  const o = officers()[oi]; if (!o || o.resting > 0) return;
  const old = META.leader;
  officers().splice(oi, 1);
  if (old){
    old.pendingPicks = META.pendingPicks || 0;
    if (mode === 'train'){
      const cost = 100 * old.level; if (META.treasury < cost){ officers().splice(oi, 0, o); return; }
      META.treasury -= cost; old.resting = 1; old.trainingAt = 'command'; old.ticks++;
      old.trainingLabel = '+1 XP tick';
      if (old.ticks >= 3){ old.ticks = 0; old.level = Math.min(11, old.level + 1); old.trainingLabel = 'reached Level ' + old.level;
        if (rowFor(old.spec, old.level)[2] === 'pick') old.pendingPicks++; }
      officers().push(old);
    } else if (mode === 'retire'){
      const v = {id:old.id || ('L' + Date.now()), name:old.name, race:old.race, cls:old.cls, spec:old.spec, sex:old.sex, adv:old.level - 1,
                 injuries:old.injuries.slice(), facility:fid, startCon:3, conTrained:0, baseM:1, baseR:1, modM:0, modR:0, magic:0, deployments:old.deployments};
      (META.retired = META.retired || []).push(v);
    } else officers().push(old);
  }
  META.leader = o; META.pendingPicks = o.pendingPicks || 0; delete o.pendingPicks;
  META.board = null; SFX.play('horn'); saveMeta(); refreshProgression();
}
function officerFromDebrief(oi){
  const o = readyOfficers()[oi] || officers()[oi]; if (!o) return;
  takeCommand(officers().indexOf(o));
  renderDebrief(renderDebrief.last.head, renderDebrief.last.lines.concat([`<p class="good"><b>${esc(o.name)} takes command</b> at Level ${o.level}.</p>`]));
}
function leaderCardHTML(L, extra = ''){
  const s = leaderStats(L);
  return `${img(portraitURL(L, true))}<div class="ttl">${esc(L.name)}</div>
    <div class="role" style="color:${SPECS[L.spec].color}">${RACES[L.race].name} ${CLASSES[L.cls].name} ${SPECS[L.spec].name} \u00b7 Level ${L.level}</div>
    <div class="stat">Con ${s.con} \u00b7 Wounds ${s.maxWounds} \u00b7 Luck ${s.luck} \u00b7 Per ${s.per}<br>Melee ${s.melee} \u00b7 Ranged ${s.ranged}${SPECS[L.spec].caster ? ' \u00b7 Magic ' + s.magic : ''} \u00b7 Move ${s.move}</div>
    <div class="desc">XP ticks ${L.ticks} / 3 \u00b7 ${L.deployments || 0} contracts</div>
    <div class="desc" style="color:#5a4a2a">Talents: ${(L.picks || []).map(id => (CARDS.find(c => c.id === id) || {}).name).join(', ') || 'none yet'}</div>
    ${L.injuries.length ? `<div class="desc" style="color:#8b0000">${L.injuries.map(i => INJURIES.find(x => x.id === i).name).join(', ')}</div>` : ''}${deityLine(L)}${extra}<div class="mini"><button onclick="event.stopPropagation();exportPerson('leader','${L === META.leader ? 'L' : L.id}')" data-tip="Save to a file to share, or import into another campaign.">Export</button></div>`;
}
let LDR = null;   // which Leader action is being chosen in the Roster
function leadershipHTML(){
  const L = META.leader, O = officers(), ready = readyOfficers();
  let h = '<h2 class="sec">Squad Leader and Officers</h2><div class="sub">The Leader levels up every 3 contracts the company survives. Officers are Squad Mates with 2 or more Advancements promoted ready to lead (100gp, needs the Command Tent, up to ' + OFFICER_CAP + '). Any ready officer can take command; the Leader can join the officers, go to officer training (100gp \u00d7 Level for an XP tick, sitting out a contract), or retire to staff a facility.</div><div class="row">';
  if (L){
    let acts = '';
    if (ready.length){
      acts = `<div class="mini"><button onclick="LDR=LDR==='swap'?null:'swap';refreshUI()">Hand over command</button>
        ${has('command') ? `<button onclick="LDR=LDR==='train'?null:'train';refreshUI()" ${META.treasury < 100 * L.level ? 'disabled' : ''}>Officer training (${100 * L.level}gp)</button>` : ''}
        <button onclick="LDR=LDR==='retire'?null:'retire';refreshUI()">Retire to camp</button></div>`;
      if (LDR){
        const facs = FACILITIES.filter(f => has(f.id) && VETERANS[f.id] && !staffOf(f.id));
        acts += `<div class="desc" style="text-align:left"><b>${LDR === 'retire' ? 'Choose a facility, then who takes command:' : 'Who takes command?'}</b></div>`;
        if (LDR === 'retire'){
          if (!facs.length) acts += '<div class="desc">No built facility needs staff.</div>';
          else acts += facs.map(f => ready.map(o => `<button style="display:block;width:100%;margin:2px 0;font-size:14px" onclick="takeCommand(${O.indexOf(o)},'retire','${f.id}');LDR=null">${f.name}, ${esc(o.name)} leads</button>`).join('')).join('');
        } else acts += ready.map(o => `<button style="display:block;width:100%;margin:2px 0;font-size:14px" onclick="takeCommand(${O.indexOf(o)},'${LDR}');LDR=null">${esc(o.name)} takes command</button>`).join('');
      }
    } else acts = '<div class="desc" style="font-size:14px">Promote an officer to be able to hand over command.</div>';
    let picks = '';
    if (META.pendingPicks > 0){
      const opts = leaderOpts(L);
      if (opts.length) picks = `<div class="desc" style="text-align:left;color:#226b2a"><b>Pick 1 Talent:</b></div><div class="mini">${opts.map(c => `<button title="${c.text(1)}" onclick="leaderPick('${c.id}')">${c.name}</button>`).join('')}</div>`;
    }
    h += `<div class="card static sel" style="width:260px"><div class="tag">Squad Leader</div>${leaderCardHTML(L, picks)}${acts}</div>`;
  }
  for (const o of O) h += `<div class="card static" style="width:230px"><div class="tag">Officer</div>${leaderCardHTML(o, o.resting > 0 ? `<div class="desc" style="color:#226b2a">In officer training (${esc(o.trainingLabel || '')}): ready after the next contract</div>` : '')}
      ${o.resting > 0 ? '' : `<div class="mini"><button onclick="takeCommand(${O.indexOf(o)})">Take command</button></div>`}</div>`;
  if (!O.length) h += `<div class="card static" style="width:230px;opacity:.75"><div class="ttl">No officers</div><div class="desc">${has('command') ? 'Promote a Squad Mate with 2+ Advancements below.' : 'Build the Command Tent to promote officers.'}</div></div>`;
  return h + '</div>';
}


window.CAMPAIGN_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    try {
      META = freshMeta();
      const s0 = META.standing.imperial || 0;
      shiftStanding('imperial', 2);
      ok('shiftStanding raises faction standing', (META.standing.imperial || 0) === Math.min(3, s0 + 2));
      shiftStanding('imperial', 10);
      ok('shiftStanding clamps at +3', META.standing.imperial === 3);
      shiftStanding('imperial', -20);
      ok('shiftStanding clamps at -3', META.standing.imperial === -3);
      META.ambition = {track: 'wealth', done: 4};
      ok('perk returns true at or below done', perk('wealth', 3) === true && perk('wealth', 6) === false);
      ok('vetMatches requires adv >= 3', vetMatches({adv: 2, race: 'HUMAN', cls: 'FREEMAN', spec: 'SOLDIER'}, 'barracks') === false);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { META = svM; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
