/* js/campaign/founding-story.js (INT-1 step 2, 2026-11-16): CAMPAIGN: THE FOUNDING OF THE DUST CLOAKS.
   Cut unchanged from the inline script in index.html (old lines 7151 to 8338). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   CAMPAIGN: THE FOUNDING OF THE DUST CLOAKS
   Player's Manual Chapters 13 and 14, adapted for the video game.
   Part One, The Siege of Varnholt: fourteen days, six assaults on a town
   whose walls, gates and districts carry their damage from fight to fight.
   Part Two, The Long Road South-East: seven nights guarding the refugee
   column from the Ledger Wagon. The company keeps its people and gear from
   one part to the next, and from the end of the march into the open game.
   Runs in its own save slot: the main game's Chapter is never touched.
============================================================================ */
const MAIN_SLOT = 'dust_cloaks_v4', STORY_SLOT = 'dust_cloaks_story1';
const ROUNDF = 1200;                 // one campaign round: 20 seconds
const HPX = 12;                      // tabletop Structural HP x 12
const inStory = () => !!(META && META.cp && META.cp.part !== 'done');
const CP = () => META.cp;

/* ---------------------------------------------------------------------------
   NEW ENEMIES AND ALLIES
--------------------------------------------------------------------------- */
Object.assign(BESTIARY, {
  chaingang:{name:'Chain-Gang Skirmisher', arch:'skirm', tier:1, con:2, ac:3, shift:0, dmg:2, skill:0, rskill:1, speed:0.9, r:9, colour:'#6b5a42', xp:1, coin:0, sc:2, rng:220, cd:220, keep:170},
  overseer: {name:'Overseer',             arch:'brute', tier:1, con:8, ac:5, shift:1, dmg:3, skill:3, speed:0.85, r:12, colour:'#2e3a4a', xp:6, coin:4, sc:2.3},
  slaver:   {name:'Outrider Slaver',      arch:'brute', tier:2, con:5, ac:5, shift:1, dmg:3, skill:3, speed:1.6, r:13, colour:'#2e3a4a', xp:6, coin:3, sc:2.1},
  ram:      {name:'Ram Crew',             arch:'brute', tier:1, con:40, ac:6, shift:2, dmg:4, skill:2, speed:0.36, r:24, colour:'#6a4a2a', xp:24, coin:12, sc:2.6, frenzy:true, ram:true}
});
Object.assign(ENEMY_LOOK, {
  chaingang:{skin:'#c98d5f', hair:'#3a2a1a', hairStyle:'messy', top:'#6b5a42', acc:'#8f98a2', head:'bandana', legs:'#4a3e2e', weapon:'dagger'},
  overseer: {skin:'#6f6a86', hair:'#eeeeff', ears:'elf', top:'#2e3a4a', acc:'#9fd0f0', head:'cap', weapon:'club', cape:'#1e2430', legs:'#1e2430'}
});
Object.assign(ENEMY_ARMOUR, {overseer:'studs', slaver:'chain', chaingang:'quilt'});
const _customES = customEnemySprite;
customEnemySprite = function(kind){
  if (kind === 'slaver'){
    if (SPR['b:slaver']) return SPR['b:slaver'];
    return SPR['b:slaver'] = {frames:[], white:[], ax:14, ay:20, w:28, h:30};
  }
  if (kind === 'ram'){
    if (SPR['b:ram']) return SPR['b:ram'];
    return SPR['b:ram'] = {frames:[], white:[], ax:17, ay:15, w:34, h:22};
  }
  return _customES(kind);
};
// Townsfolk and refugee auxiliaries (Tables 13.4 and 14.6)
const AUX = {
  levy:      {name:'Levy',               con:3, ac:3, m:0, r:0, shoot:false, look:{race:'HUMAN', weapon:'pitchfork', top:'#7a6a4e'}},
  militia:   {name:'Militia',            con:3, ac:4, m:1, r:1, shoot:true,  look:{race:'HUMAN', weapon:'spear', top:'#c9b48a', armour:'quilt'}},
  volunteers:{name:'Refugee Volunteers', con:2, ac:3, m:0, r:1, shoot:true,  look:{race:'SUN_ELF', weapon:'bow', top:'#7a6a8a'}},
  woodelf:   {name:'Sun Elf Skirmishers',con:3, ac:4, m:1, r:3, shoot:true, look:{race:'SUN_ELF', weapon:'bow', top:'#9a7440'}},
  hedgemage: {name:'Sun Elf Hedge-Mages',con:3, ac:3, m:0, r:1, magic:true, look:{race:'SUN_ELF', weapon:'staff', orb:'#f0d070', top:'#b4a47c', robe:true}},
  sellswords:{name:'Free Company Sellswords', con:4, ac:5, m:3, r:1, shoot:false, look:{race:'HUMAN', weapon:'sword', top:'#6a5a44', armour:'chain', head:'helmet'}}
};
function auxSprite(type, i){
  const A = AUX[type], key = 'aux:' + type + (i % 4);
  if (SPR[key]) return SPR[key];
  const p = {race:A.look.race, spec:'PLAIN', name:'aux' + type + i, id:'a' + i, sex:i % 2 ? 'f' : 'm'};
  return humanoidSprite(key, Object.assign(personLook(p, false), A.look, {cape:null}));
}

/* ---------------------------------------------------------------------------
   PART ONE DATA - Varnholt (Tables 13.1, 13.5, 13.6)
--------------------------------------------------------------------------- */
const DISTRICTS = {
  market:{name:'Market Square',      at:[24, 20], r:5, held:'Buy gear at the Market. Rallying the town is easier.', lost:'The Market closes: no purchases, and rallying the town is harder.'},
  mill:  {name:'The Mill',           at:[12, 18], r:4, held:'+2 Supply every day. The millrace ford gives Light Cover.', lost:'-4 Supply at once, and no more Supply from the Mill.'},
  smithy:{name:'Smithy Row',         at:[36, 15], r:4, held:'A working forge: Craft metal armour and weapons with Work Orders.', lost:'The forge is lost. No more metal gear.'},
  common:{name:'The Common House',   at:[22, 32], r:4, held:'Infirmary beds: the wounded are back on their feet in a day.', lost:'Healing slows: the wounded take two days.'},
  ore:   {name:'Ore Yard and South Gate', at:[13, 35], r:4, held:'The Silver Pit pays +40gp every day.', lost:'The South Gate stands open: raiders may come from the south. No more silver.'},
  keep:  {name:"The Reeve's Keep",   at:[36, 33], r:5, held:'Shelters 300 townsfolk. Never overrun before the last assault.', lost:'The siege is lost.'}
};
const PAL = {x0:6, x1:43, y0:9, y1:40};
const STRUCTS = {
  ngate:{name:'North Gate',      max:12, ac:4, cells:[[23,9],[24,9],[25,9]], face:[24.5, 8.3], gate:true, dir:'north'},
  nw:   {name:'West Palisade',   max:8,  ac:4, cells:[[10,9],[11,9],[12,9]], face:[11.5, 8.3], dir:'north-west'},
  ne:   {name:'East Palisade',   max:8,  ac:4, cells:[[36,9],[37,9],[38,9]], face:[37.5, 8.3], dir:'north-east'},
  ep:   {name:'East Wall',       max:8,  ac:4, cells:[[43,17],[43,18],[43,19]], face:[44.3, 18.5], dir:'east'},
  sgate:{name:'South Gate',      max:12, ac:4, cells:[[12,40],[13,40],[14,40]], face:[13.5, 41.4], gate:true, dir:'south'},
  kgate:{name:'Keep Gate',       max:12, ac:5, cells:[[35,28],[36,28],[37,28]], face:[36.5, 27.3], gate:true, keep:true, dir:'the Keep'},
  kw:   {name:'Keep West Wall',  max:10, ac:5, cells:[[31,32],[31,33],[31,34]], face:[30.3, 33.5], keep:true, dir:'the Keep'},
  ks:   {name:'Keep South Wall', max:10, ac:5, cells:[[35,38],[36,38],[37,38]], face:[36.5, 39.2], keep:true, dir:'the Keep'}
};
const ASSAULTS = [
  {day:3,  name:'The First Wave',     when:'Day 3, dusk',  rounds:6, win:'gate', prep:1,
   waves:[[0, [['mob', 'N']]], [2, [['mob', 'N']]], [4, [['mob', 'N']]]],
   intel:['North road', '3 Hollow Levy Mobs', 'The North Gate', 'Nothing. They are exactly what they look like.'],
   rule:'Hold the North Gate. If it falls, the Market is overrun.'},
  {day:5,  name:"The Reeve's Tithe",  when:'Day 5, dawn',  rounds:6, win:'gate', prep:1,
   waves:[[0, [['mob', 'N'], ['mob', 'S']]], [1, [['orsolt', 'W']]], [3, [['mob', 'N'], ['mob', 'S']]]],
   intel:['North and south', '4 Hollow Levy Mobs and Orsolt the Hollow Reeve with his Guard', 'The North and South Gates', 'Orsolt hangs back near the mill road and flees when badly hurt.'],
   rule:'Hold the North Gate. Kill Orsolt and every later levy loses its frenzy; let him escape and he returns.'},
  {day:8,  name:'The Hired Line',     when:'Day 8, morning', rounds:7, win:'gate', prep:1,
   waves:[[0, [['renegade', 'N'], ['ram', 'N']]], [1, [['cinder', 'N']]], [3, [['renegade', 'N']]], [5, [['mob', 'N']]]],
   intel:['North road', '2 Free Company Renegade squads, a Ram Crew and its Overseer, Cinderlings', 'The North Gate', 'Shadow-Hunters watch from the ridge and do not yet fire.'],
   rule:'Hold the North Gate against the ram.'},
  {day:10, name:'Over the Wall',      when:'Day 10, night', rounds:6, win:'districts', prep:1, night:true,
   waves:[[0, [['raider', 'EIN'], ['cinder', 'E']]], [1, [['priest', 'EIN']]], [2, [['raider', 'EIN'], ['cinder', 'E']]], [4, [['mob', 'N']]]],
   intel:['The east palisade, at night', '2 Cambion Raider squads, Cinderlings and a Tithe-Priest', 'Smithy Row and the Mill', 'The Tithe-Priest restores the raiders\u2019 wounds.'],
   rule:'Night: enemy ranged attacks are weaker. Win if no more than one district is overrun at the end.'},
  {day:12, name:'The Tithe Is Called', when:'Day 12, dawn to dusk', rounds:7, win:'survive', prep:1,
   waves:[[0, [['mob', 'N'], ['mob', 'W'], ['mob', 'S']]], [1, [['chain', 'N']]], [2, [['orsolt?', 'W'], ['renegade', 'E']]], [4, [['mob', 'N'], ['mob', 'W']]]],
   intel:['Three sides', '5 Hollow Levy Mobs, a Chain-Gang with its Overseer, a Renegade squad', 'The North Gate and the Market', 'Orsolt returns, if he fled.'],
   rule:'Survive in the town to the end, or hold the Keep Gate if you have fallen back.'},
  {day:14, name:'The Last Wall',      when:'Day 14',       rounds:8, win:'keep', prep:2, keep:true,
   waves:[[0, [['mob', 'N'], ['mob', 'W']]], [1, [['ilvaryn', 'N'], ['devil', 'E']]], [2, [['mob', 'S']]], [4, [['renegade', 'N'], ['cinder', 'E']]], [6, [['renegade', 'W']]]],
   intel:['All sides, then the Keep', 'A Frost-Vault Guard-Captain and his Guard, a Devil-Knight, Hollow Levy Mobs', 'The Keep Gate', 'Khan Duruk\u2019s orc riders arrive at the end of Round 3.'],
   rule:'Fought at the Keep. Be inside the Keep at the end of Round 8.'}
];
// Unit groups, as the video game fields them
const GROUPS = {
  mob:{k:'levy', n:18}, guard:{k:'skeleton', n:5}, renegade:{k:'renegade', n:6}, cinder:{k:'cinder', n:7}, raider:{k:'raider', n:5},
  chain:{k:'chaingang', n:7, lead:'overseer'}, ram:{k:'ram', n:1, lead:'overseer'}, priest:{k:'tithepriest', n:1}, hunters:{k:'shadowhunter', n:3},
  slaver:{k:'slaver', n:5}, phalanx:{k:'phalanx', n:6}, devil:{k:'devil', n:1}, orsolt:{k:'orsolt', n:1, guard:'guard'}, ilvaryn:{k:'ilvaryn', n:1, guard:'phalanx'}
};

/* ---------------------------------------------------------------------------
   PART TWO DATA - the road (Tables 14.1, 14.2, 14.4, 14.5)
--------------------------------------------------------------------------- */
const WAGON_SLOTS = {
  armoury: {name:'Armoury Rack',  text:'The squad begins every night with +1 Ward Token.'},
  infirmary:{name:'Infirmary Bed', text:'The wounded are back on their feet after one day, and injury checks are kinder.'},
  larder:  {name:'Larder',        text:'+1 Supply every day.'},
  forge:   {name:'Forge Cart',    text:'Craft metal armour and weapons with day actions. Supply can stand in for gold (1 Supply = 25gp).'},
  chapel:  {name:'Chapel Shrine', text:'Counts as a Chapel: the squad starts every night Blessed (+1 step for 30 seconds).'},
  scribe:  {name:"Scribe's Table", text:'Once a day, a failed Scout roll is rolled again.'}
};
const NIGHTS = [   // Long Road pass 1: seven nights. `stake` keys the debrief line in CAMPAIGN_LINES.act45.stake; tier/trickle/noTick/cinderForage replace the old night-number tests
  {ground:'forest',   place:'Qloria Edge',     force:[['chain', 'W'], ['chain', 'N']], comp:'The first night. Foes left alone at the column cost Column Strength, so keep them off it. The column is still bunched: the Column Zone is bigger.', bigZone:true, tier:1, trickle:'chaingang', noTick:true, stake:'column'},
  {ground:'forest',   place:'The Burning Wood',force:[['raider', 'W'], ['raider', 'E'], ['cinder', 'N']], comp:'The forest burns in from the edges, and smoke gives cover. Raiders come for the Ledger Wagon first. If it is wrecked tonight, it costs a wagon fitting, or 2 Supply if it has none.', fire:true, wagonFirst:true, wagonStake:true, sub:'ally', tier:1, trickle:'chaingang', noTick:false, stake:'wagon', gap:'Two days in the trees. Axles break, and the smiths mend them by firelight.'},
  {ground:'forest',   place:'River Ford',      force:[['raider', 'E'], ['renegade', 'NE'], ['cinder', 'E']], comp:'A ford splits the field.', river:true, fordHold:true, wagonStake:true, tier:1, trickle:'chaingang', noTick:true, stake:'ford', gap:'Three days of rain. The road is mud to the axles, and the river ahead is running high.'},
  {ground:'forest',   place:'Forest Edge',     force:[['raider', 'W'], ['cinder', 'N']], comp:'Fog, and nobody sees far. Four hidden markers round the wagons each hide a knot of cutthroats. Check every marker by the end of Round 3. Each one left unchecked costs 1 Supply, and three cutthroats come out of it.', fog:true, knives:true, sub:'whiteFlag', witch:true, cinderForage:true, tier:2, trickle:'cinder', noTick:false, stake:'knives', gap:'Two days on the far bank. The trees thin out, and the fog comes up off the ground at dusk.'},
  {ground:'plain',    place:'The Plain',       force:[['phalanx', 'W'], ['slaver', 'N'], ['slaver', 'S']], comp:'The Phalanx cannot be killed, only slowed. Keep it off the column: while it stands there, it costs the column double. It leaves at dawn. Slavers ride at anything in the open.', phalanx:true, sub:'caster', cinderForage:true, tier:3, trickle:'cinder', noTick:true, stake:'phalanx', gap:'The trees end. Two days across open grass, with dust on the skyline behind.'},
  {ground:'plain',    place:'The Plain',       force:[['raider', 'W'], ['raider', 'E'], ['devil', 'N'], ['cinder', 'S'], ['cinder', 'W']], comp:'The Devil-Knight leads tonight. Kill it and every Cinderling on the field breaks. If it lives to dawn, it costs 2 more Column Strength.', devilLeads:true, devilOnce:true, cinderForage:true, tier:3, trickle:'cinder', noTick:false, stake:'devil', gap:'Three days on the Plain. Cinderling tracks cross the road, and something heavier walks with them.'},
  {ground:'plain',    place:'Thornwater Ford', force:[['renegade', 'W'], ['renegade', 'N'], ['priest', 'W'], ['slaver', 'S']], comp:'At the end of Round 5 Artemis\u2019s knights cross the ford. Survive Round 6.', river:true, kalloon:true, sub:'kalloon', cinderForage:true, tier:3, trickle:'cinder', noTick:true, stake:'kalloon', gap:'Two days to the Ford. The column walks faster now. Nobody wants to stop.'}
];
const ROAD_EVENTS = [
  {t:'A washed-out ford.', text:'Lose 1 Supply, unless the squad spends a day action getting the carts across.', choice:'Get the carts across (1 action)', yes(){ }, no(){ CP().supply--; }},
  {t:'A band of lost children.', text:'+1 Column Strength and -1 Supply as they join.', auto(){ CP().column++; CP().supply--; }},
  {t:'Panic in the column.', text:'Your Leader steadies them (Personality against 5), or Column Strength falls by 1.', auto(){ const r = cpRoll(leaderStats(META.leader).per, 5); if (r === 'miss'){ CP().column--; return 'They would not listen: Column Strength -1.'; } return 'They listen: the column steadies.'; }},
  {t:'Sun Elf scouts share what they have seen.', text:"Tonight's enemy force and complication are revealed.", auto(){ CP().scouted = 2; }},
  {t:'Wounded stragglers on the road.', text:'Spend a day action to save them: +1 Column Strength and a free Recruit roll.', choice:'Save them (1 action)', yes(){ CP().column++; cpRecruit(true); }, no(){ }},
  {t:'A clear road and a good camp.', text:'+1 Supply.', auto(){ CP().supply++; }}
];

/* ---------------------------------------------------------------------------
   SAVE SLOTS AND STARTING THE CAMPAIGN
--------------------------------------------------------------------------- */
function switchSlot(key){
  if (META) saveMeta();
  SAVE_KEY = key; loadMeta(); applySkin();
  CAMP.people = []; CAMP.dirty = true; CAMP.cpMap = null; MU = null;
}
function storyExists(){ try { const d = JSON.parse(localStorage.getItem(STORY_SLOT) || 'null'); return !!(d && d.cp); } catch(e){ return false; } }
function openStory(){
  switchSlot(STORY_SLOT);
  if (!META.cp){ newStory(); return; }
  renderTitle();
}
function newStory(){
  META = freshMeta();
  META.cp = {part:'create', day:0, supply:20, orders:0, district:{market:'held', mill:'held', smithy:'held', common:'held', ore:'held', keep:'held'},
             st:{}, aux:[], intelRev:[0, 0, 0, 0, 0, 0], assault:0, log:[], fort:{stakes:0, firepits:0, barricades:0, murder:false}, orsolt:'alive', fallback:false};
  for (const k in STRUCTS) META.cp.st[k] = {hp:STRUCTS[k].max * HPX, max:STRUCTS[k].max * HPX};
  META.treasury = 850;      // 200 Chapter + 300 the Reeve's town works + the 350gp Standard Charter Kit
  META.banner = {div:'plain', c1:'#7a7a74', c2:'#c8c0a8', charge:'#3a3a40', glyph:'eye'}; META.bannerSet = true;
  META.master = {id:'CM', name:'Reeve Aldous Harl', race:'HUMAN', cls:'NOBLE', spec:'SOLDIER', sex:'m', chosen:true, npc:true};
  META.holding = 'fort'; META.founded = true; META.settings = Object.assign({}, META.settings || {});
  saveMeta(); applySkin();
  openStoryIntro();
}
function leaveStory(){ if (window.F34 && F34.active && F34.active()) return F34.leave();   // INT-1 stage 3 group 7: from campaign34 (the F34 run leaves by its own way)
  closePanel(); switchSlot(MAIN_SLOT); showSplash(); }
function openStoryIntro(){
  hideAll(); $('screen-title').classList.remove('hidden');
  $('title-inner').innerHTML = `<h1 style="font-size:54px">The Founding of the Dust Cloaks</h1>
    <div class="sub"><i>"The Reeve asked how many soldiers he had bought. I told him enough to be buried with honour, and not nearly enough to be sensible."</i></div>
    <div class="log" style="max-width:640px;margin-top:12px;text-align:left">
      <p><b>Year 616.</b> The Frost-Vault legions have crossed the northern passes, and the first town on their road is <b>Varnholt</b>: a silver town of eight hundred souls with a palisade, a north gate, and a small keep built for a reeve and never for a war.</p>
      <p>The garrison marched for Kalloon. What Varnholt has is a Reeve with a purse, a mine, three hundred townsfolk who can hold a spear, and whichever free company happened to be camped by the mill when the smoke rose in the north.</p>
      <p>That company is yours. You wear the grey cloak of the <b>Grey Cloaks</b>, the company that would become the Dust Cloaks. If any of you live to the end of this campaign, you will be among the first to wear a cloak the colour of the road.</p>
      <p style="font-size:14px;color:#6a5a44">Part One: fourteen days and six assaults on Varnholt. Part Two: seven nights on the road with the refugees. Your people and gear carry through. This campaign has its own save; your main Chapter is untouched.</p></div>
    <button class="btn gold" onclick="CP().part='create';openCreate()">RECRUIT YOUR SQUAD LEADER</button>
    <button class="btn small" onclick="leaveStory()">BACK</button>`;
}
// After the Leader is made: choose four Squad Mates (two companions and two hires, Section 13.3)
function storyMusterHTML(){
  const C = CP(); if (!C.offer) C.offer = Array.from({length:6}, rollRecruit);
  const pick = C.pick || (C.pick = []);
  return `<h2>Your First Squad</h2><div class="desc" style="text-align:left">Choose four Squad Mates to march with you: two companions and two hires, camped by the mill when the smoke rose.</div>` +
    C.offer.map((r, i) => `<div class="line"><img src="${portraitURL(r, false)}"><div class="grow"><b>${esc(r.name)}</b><br>${RACES[r.race].name} ${CLASSES[r.cls].name} ${SPECS[r.spec].name}<br><span style="font-size:14px">${mateLine(r)}</span></div>
      <button style="${pick.includes(i) ? 'background:var(--ink-soft);color:#fff' : ''}" onclick="storyPick(${i})">${pick.includes(i) ? 'Chosen' : 'Choose'}</button></div>`).join('') +
    `<button class="btn small" onclick="CP().offer=null;CP().pick=[];renderPanel()">OTHER FACES</button>
     <button class="btn gold" ${pick.length === 4 ? '' : 'disabled'} onclick="storyMusterDone()">THESE FOUR (${pick.length} / 4)</button>`;
}
function storyPick(i){ const p = CP().pick, j = p.indexOf(i); if (j >= 0) p.splice(j, 1); else if (p.length < 4) p.push(i); SFX.play('pick'); renderPanel(); }
function storyMusterDone(){
  const C = CP();
  for (const i of C.pick){ const r = C.offer[i]; r.id = META.nextId++; META.roster.push(r); }
  C.offer = null; C.pick = null; C.part = 'kit'; saveMeta(); CAMP.dirty = true;
  openPanel('cpkit', 'cpkit');
}

/* ---------------------------------------------------------------------------
   WHAT THE TOWN GIVES: facilities follow the districts and the wagon slots
--------------------------------------------------------------------------- */
function syncStoryFacilities(){
  const C = CP(); if (!C) return;
  META.facilities = {};
  if (C.part === 'siege' || C.part === 'kit'){
    if (C.district.smithy === 'held') META.facilities.blacksmith = true;
    if (C.district.common === 'held') META.facilities.hospital = true;
  }
  if (C.part === 'road'){
    for (const s of C.slots || []){ if (s === 'forge') META.facilities.blacksmith = true; if (s === 'armoury') META.facilities.armoury = true;
      if (s === 'infirmary') META.facilities.hospital = true; if (s === 'chapel') META.facilities.chapel = true; }
  }
}
const marketOpen = () => { const C = CP(); return C.part === 'kit' || (C.part === 'siege' && C.district.market === 'held' && !C.fallback); };
function cpRoll(skill, diff){ const r = attackDie(skill, diff); return (r.out === 'solid' || r.out === 'crit') ? 'full' : r.out === 'graze' ? 'partial' : 'miss'; }
const bestSkill = () => { const s = leaderStats(META.leader); return Math.max(s.per, s.ranged); };
function cpLog(t){ const C = CP(); C.log.unshift(t); C.log = C.log.slice(0, 8); }
const ordersPerDay = () => 3;

/* ---------------------------------------------------------------------------
   THE DAY PHASE - Part One
--------------------------------------------------------------------------- */
const nextAssault = () => ASSAULTS[CP().assault] || null;
function startSiege(){
  const C = CP(); C.part = 'siege'; C.day = 0; nextDay(); saveMeta(); renderTitle();
}
function nextDay(){
  const C = CP(); C.day++; C.orders = ordersPerDay(); C.scrounged = false;
  const lines = [];
  // the town eats
  const eat = 2 + C.aux.length; C.supply -= eat; lines.push(`The town eats: -${eat} Supply.`);
  if (C.district.mill === 'held'){ C.supply += 2; lines.push('The Mill: +2 Supply.'); }
  if (C.district.ore === 'held'){ META.treasury += 40; lines.push('The Silver Pit: +40gp.'); }
  if (C.supply <= 0){
    C.supply = 0; C.starving = true;
    if (C.aux.length){ C.aux = []; lines.push('<b>The town is starving.</b> The auxiliaries desert.'); } else lines.push('<b>The town is starving.</b> The squad will begin the next assault Shaken.');
  } else C.starving = false;
  // the wounded heal
  for (const p of META.roster) if (p.resting > 0 && !p.trainingAt){ if (C.district.common === 'held' || C.day % 2 === 0) p.resting--; }
  C.dayNews = lines; syncStoryFacilities(); saveMeta();
}
function endDay(){
  const C = CP(), A = nextAssault();
  if (A && A.day === C.day) return launchAssault();
  nextDay(); SFX.play('horn'); refreshUI(); openPanel('cpday', 'cpday');
}
function useOrder(n = 1){ const C = CP(); if (C.orders < n) return false; C.orders -= n; return true; }
const FORTIFY = [
  {id:'repair',    name:'Repair Palisade',     text:'Restore 48 Structural HP to one wall section or gate.', cost:{supply:1}, pick:'damaged'},
  {id:'rebuild',   name:'New Palisade Line',   text:'Raise a fallen wall section again, at full strength.', cost:{supply:2}, pick:'fallen'},
  {id:'reinforce', name:'Reinforce the Gate',  text:'+48 Structural HP to a gate, to a maximum of +96.', cost:{supply:2}, pick:'gate'},
  {id:'stakes',    name:'Ditch and Stakes',    text:'Stake lines outside the North Gate at every assault (up to 3).', cost:{supply:1}},
  {id:'barricade', name:'Barricade the Lanes', text:'Enemies inside the walls move 30% slower.', cost:{supply:1}},
  {id:'firepits',  name:'Fire Pits',           text:'Fire pots buried outside the gates at every assault (up to 3).', cost:{gold:25}},
  {id:'murder',    name:'Murder Holes',        text:'Keep only: the squad shoots +1 step from inside the Keep.', cost:{supply:2}}
];
function fortify(id, target){
  const C = CP(), F = FORTIFY.find(f => f.id === id);
  if (F.cost.supply && C.supply < F.cost.supply) return SFX.play('nope');
  if (F.cost.gold && META.treasury < F.cost.gold) return SFX.play('nope');
  if (!useOrder()) return SFX.play('nope');
  if (F.cost.supply) C.supply -= F.cost.supply; if (F.cost.gold) META.treasury -= F.cost.gold;
  const S = target && C.st[target];
  if (id === 'repair') S.hp = Math.min(S.max, S.hp + 4 * HPX);
  if (id === 'rebuild') S.hp = S.max;
  if (id === 'reinforce'){ const base = STRUCTS[target].max * HPX; S.max = Math.min(base + 8 * HPX, S.max + 4 * HPX); S.hp += 4 * HPX; }
  if (id === 'stakes') C.fort.stakes = Math.min(3, C.fort.stakes + 1);
  if (id === 'firepits') C.fort.firepits = Math.min(3, C.fort.firepits + 1);
  if (id === 'barricade') C.fort.barricades = 1;
  if (id === 'murder') C.fort.murder = true;
  cpLog(`Fortify: ${F.name}${target ? ' (' + STRUCTS[target].name + ')' : ''}.`); SFX.play('brace'); saveMeta(); refreshUI();
}
function workOrder(id){
  const C = CP(); if (C.orders <= 0) return SFX.play('nope');
  const L = META.leader, s = leaderStats(L);
  if (id === 'rally'){
    const diff = C.district.market === 'held' && !C.fallback ? 4 : 6, r = cpRoll(s.per, diff);
    useOrder();
    if (r === 'miss'){ cpLog(`Rally the Town (Difficulty ${diff}): nobody comes forward.`); }
    else { const n = r === 'full' ? 6 : 3, feed = Math.ceil(n / 3); C.supply -= feed;
      addAux('levy', n);
      let t = `Rally the Town (Difficulty ${diff}): ${r === 'full' ? 'Full Success' : 'Partial Success'}. ${n} Levy recruits (-${feed} Supply).`;
      if (r === 'full' && META.roster.length < rosterCap()){ const m = makeMilitiaman(); META.roster.push(m); t += ` ${m.name}, a Veteran Militiaman, joins the squad.`; }
      cpLog(t); }
  }
  if (id === 'train'){ const a = C.aux.find(x => x.type === 'levy'); if (!a || C.supply < 1) return SFX.play('nope'); useOrder(); C.supply--; a.type = 'militia'; cpLog('Train: a Levy squad is drilled into Militia.'); }
  if (id === 'pray'){ useOrder(); C.blessed = true; cpLog('Pray: the squad will begin the next fight Blessed (+2 Ward Tokens, +1 step for 30 seconds).'); }
  if (id === 'scrounge'){
    useOrder(); const r = cpRoll(bestSkill(), 5);
    if (r === 'full'){ C.supply += 4; cpLog('Scrounge: Full Success. +4 Supply from the outlying farms.'); }
    else if (r === 'partial'){ C.supply += 2; const m = META.roster.find(p => !p.resting); if (m) m.resting = 1; cpLog(`Scrounge: Partial Success. +2 Supply${m ? `, but ${m.name} comes back hurt and rests a day` : ''}.`); }
    else { const m = C.assault >= 2 && META.roster.find(p => !p.resting); if (m) m.resting = 1; cpLog(`Scrounge: nothing.${m ? ` Cinderlings found the foragers: ${m.name} is hurt.` : ''}`); }
  }
  if (id === 'scout'){
    useOrder(); let r = cpRoll(bestSkill(), 5);
    if (C.part === 'road' && r === 'miss' && (C.slots || []).includes('scribe') && !C.rerolled){ C.rerolled = true; r = cpRoll(bestSkill(), 5); }
    if (C.part === 'siege'){ const i = C.assault; if (i < 6){ C.intelRev[i] = Math.min(4, C.intelRev[i] + (r === 'full' ? 2 : r === 'partial' ? 1 : 0)); }
      cpLog(`Scout: ${r === 'full' ? 'two lines' : r === 'partial' ? 'one line' : 'nothing'} of the next Intelligence Card.`); }
    else { C.scouted = Math.max(C.scouted || 0, r === 'full' ? 2 : r === 'partial' ? 1 : 0); cpLog(`Scout: ${r === 'full' ? "tonight's whole force and complication" : r === 'partial' ? 'the first enemy unit' : 'nothing'}.${r !== 'miss' ? ' An extra Preparation Round tonight.' : ''}`); }
  }
  if (id === 'tend'){ useOrder(); for (const p of META.roster) if (p.resting > 0 && !p.trainingAt) p.resting = 0; if (C.part === 'road' && C.wagonHp < 100) {} cpLog('Tend the Wounded: every resting Squad Mate is fit to fight.'); }
  if (id === 'munitions'){ if (META.treasury < 30) return SFX.play('nope'); useOrder(); META.treasury -= 30; C.munitions = (C.munitions || 0) + 3; cpLog('Craft: 3 Burners and Smoke Pots, waiting at the start of the next fight.'); }
  if (id === 'sortie'){ useOrder(); saveMeta(); return launchSortie(); }
  // Part Two
  if (id === 'forage'){
    useOrder(); const g = NIGHTS[C.night - 1].ground, diff = g === 'forest' ? 4 : g === 'foothills' ? 5 : 6, r = cpRoll(bestSkill(), diff);
    if (r === 'full'){ C.supply += 3; cpLog(`Forage (Difficulty ${diff}): +3 Supply.`); }
    else if (r === 'partial'){ C.supply += 1; const m = META.roster.find(p => !p.resting); if (m) m.resting = 1; cpLog(`Forage: +1 Supply${m ? `, and ${m.name} is hurt` : ''}.`); }
    else { const cf = !!NIGHTS[C.night - 1].cinderForage; if (cf) C.extraCinder = true; cpLog(`Forage: nothing.${cf ? ' Cinderlings followed the foragers back: they join tonight\u2019s attack.' : ''}`); }
  }
  if (id === 'recruit'){ useOrder(); cpRecruit(false); }
  if (id === 'parley'){
    useOrder(); const r = cpRoll(s.per, 5);
    if (r === 'full'){ const pay = META.treasury >= 40 && C.supply >= 3 ? 'gold' : C.supply >= 5 ? 'supply' : null;
      if (pay === 'gold'){ META.treasury -= 40; C.supply -= 3; } if (pay === 'supply') C.supply -= 5;
      if (pay){ C.hired = true; cpLog('Recruit a band: a band of Free Company sellswords will fight for you tonight.'); } else cpLog('Recruit a band: they would come, but you cannot pay them.'); }
    else cpLog('Recruit a band: the sellswords ride on.');
  }
  if (id === 'repair'){ if (C.supply < 1 || C.wagonHp >= C.wagonMax) return SFX.play('nope'); useOrder(); C.supply--; C.wagonHp = Math.min(C.wagonMax, C.wagonHp + 40); cpLog('Repair the Ledger Wagon: +40.'); }
  SFX.play('pick'); saveMeta(); refreshUI();
}
function addAux(type, n){
  const C = CP();
  let a = C.aux.find(x => x.type === type && x.n < 6);
  while (n > 0){ if (!a){ a = {type, n:0}; C.aux.push(a); } const k = Math.min(n, 6 - a.n); a.n += k; n -= k; a = null; }
}
function makeMilitiaman(){
  const race = 'HUMAN', m = makeMate(race, 'FREEMAN', 'SOLDIER', randomName(race));
  Object.assign(m, {startCon:3, baseM:1, baseR:1, modM:0, modR:0, militia:true}); return m;
}
function cpRecruit(free){
  const C = CP(), r = free ? 'full' : cpRoll(leaderStats(META.leader).per, 5);
  if (r === 'miss') return cpLog('Recruit: nobody among the refugees will take up arms.');
  const roll = Math.random(), type = r === 'partial' ? 'volunteers' : roll < .6 ? 'volunteers' : roll < .85 ? 'woodelf' : 'hedgemage';
  const n = r === 'partial' ? 3 : AUX[type].name.includes('Hedge') ? 3 : type === 'woodelf' ? 4 : 6;
  addAux(type, n); let cost = 1, t = `Recruit: ${n} ${AUX[type].name}`;
  if (r === 'full'){
    const vet = rollRecruit(); vet.id = META.nextId++; vet.adv = 3; vet.conTrained = 1; vet.baseM = Math.min(rowFor(vet.spec, 4)[0], vet.baseM + 1); vet.baseR = Math.min(rowFor(vet.spec, 4)[1], vet.baseR + 1);
    const l1 = rollRecruit(); l1.id = META.nextId++;
    for (const p of [vet, l1]) if (META.roster.length < rosterCap()){ META.roster.push(p); cost++; }
    t += `, and two Squad Mates: ${vet.name} (a veteran) and ${l1.name}`;
  }
  C.supply -= cost; cpLog(t + ` (-${cost} Supply).`);
}

/* ---------------------------------------------------------------------------
   THE MAPS
--------------------------------------------------------------------------- */
function generateVarnholt(contract){
  const C = CP(), w = 50, h = 48, r = rng(616), g = new Uint8Array(w * h);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  const M = {w, h, g, seed:616, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null, cages:[], nests:[], engines:[], beacons:[]};
  const nf = valueNoise(w, h, 6, r), inside = (x, y) => x > PAL.x0 && x < PAL.x1 && y > PAL.y0 && y < PAL.y1;
  // the fields and woods outside the walls: open enough to fight in
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ if (inside(x, y) || (x >= PAL.x0 && x <= PAL.x1 && y >= PAL.y0 && y <= PAL.y1)) continue;
    const v = nf(x, y), far = Math.min(x, y, w - 1 - x, h - 1 - y) <= 2; if (far && v > 0.4) set(x, y, T.FOREST); else if (v > 0.72) set(x, y, T.FOREST); else if (v < 0.18) set(x, y, T.HILL); }
  // roads in: north to the North Gate, south from the South Gate
  for (let y = 0; y < PAL.y0; y++) for (let k = 23; k <= 25; k++) set(k, y, T.ROAD);
  for (let y = PAL.y1 + 1; y < h; y++) for (let k = 12; k <= 14; k++) set(k, y, T.ROAD);
  for (let x = PAL.x1 + 1; x < w; x++) set(x, 18, T.ROAD);
  // the palisade ring
  for (let x = PAL.x0; x <= PAL.x1; x++){ set(x, PAL.y0, T.PALISADE); set(x, PAL.y1, T.PALISADE); }
  for (let y = PAL.y0; y <= PAL.y1; y++){ set(PAL.x0, y, T.PALISADE); set(PAL.x1, y, T.PALISADE); }
  // streets: a north-south high street, a cross street to the mill and smithies, a lane to the South Gate and one to the Keep
  for (let y = PAL.y0 + 1; y < PAL.y1; y++){ set(24, y, T.ROAD); set(25, y, T.ROAD); }
  for (let x = PAL.x0 + 1; x < PAL.x1; x++){ set(x, 25, T.ROAD); set(x, 26, T.ROAD); }
  for (let y = 26; y < PAL.y1; y++){ set(13, y, T.ROAD); }
  for (let x = 25; x < 38; x++) set(x, 27, T.ROAD);
  // the Market Square
  for (let y = 16; y <= 23; y++) for (let x = 19; x <= 29; x++) set(x, y, T.FLOOR);
  // the millrace and the Mill
  for (let y = PAL.y0 + 1; y < PAL.y1; y++){ set(8, y, T.WATER); }
  for (const y of [17, 18, 25, 26]) set(8, y, T.ROAD);
  const house = (x, y, bw, bh, v) => { for (let yy = y; yy < y + bh; yy++) for (let xx = x; xx < x + bw; xx++) set(xx, yy, T.ROOF); M.structures.push({kind:'house', x:x + (bw >> 1), y:y + (bh >> 1), v}); };
  house(10, 13, 4, 3, 1); house(14, 21, 3, 2, 0);
  // Smithy Row
  house(32, 12, 3, 2, 2); house(37, 12, 3, 2, 2); house(34, 17, 3, 2, 2); house(39, 16, 2, 2, 2);
  // the Common House and a few homes
  house(19, 30, 6, 3, 0);
  for (const [x, y] of [[16, 11], [29, 11], [18, 28], [27, 30], [27, 35], [19, 36], [38, 22], [32, 21], [10, 29]]) house(x, y, 3, 2, (x + y) % 3);
  // the Ore Yard and the Silver Pit
  for (let y = 32; y <= 38; y++) for (let x = 9; x <= 17; x++) if (!g[y * w + x]) set(x, y, r() < .3 ? T.RUBBLE : T.FLOOR);
  for (let y = 34; y <= 35; y++) for (let x = 16; x <= 17; x++) set(x, y, T.STONE);
  // the Reeve's Keep
  for (let y = 28; y <= 38; y++) for (let x = 31; x <= 41; x++){ const edge = x === 31 || x === 41 || y === 28 || y === 38; set(x, y, edge ? T.WALL : T.FLOOR); }
  for (let y = 32; y <= 34; y++) for (let x = 35; x <= 37; x++) set(x, y, T.STONE);
  // gates and wall sections: gates the defenders walk through, until they fall
  for (const k in STRUCTS){ const S = STRUCTS[k], down = C.st[k].hp <= 0 || (k === 'sgate' && C.district.ore === 'overrun');
    for (const [x, y] of S.cells) set(x, y, down ? (S.gate ? T.ROAD : T.RUBBLE) : S.gate ? T.GATE : (S.keep ? T.WALL : T.PALISADE)); }
  const fall = C.fallback || (contract && ASSAULTS[contract.assault] && ASSAULTS[contract.assault].keep);
  M.start = fall ? {x:36, y:30} : {x:24, y:13};
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y * w + x] === T.FOREST && r() < 0.5) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
  MAP = M; M.reach = bfsFrom((M.start.x + .5) * CELL, (M.start.y + .5) * CELL, null, true);
  return M;
}
const outsideWalls = e => { const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL); return cx <= PAL.x0 || cx >= PAL.x1 || cy <= PAL.y0 || cy >= PAL.y1; };
function generateNightMap(night, formation){
  const N = NIGHTS[night - 1], w = 48, h = 48, r = rng(1000 + night * 17), g = new Uint8Array(w * h);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  const M = {w, h, g, seed:night, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null, cages:[], nests:[], engines:[], beacons:[]};
  const cx = 24, cy = 24, nf = valueNoise(w, h, 7, r), nr = valueNoise(w, h, 4, r);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const d = Math.hypot(x - cx, y - cy), v = nf(x, y);
    if (N.ground === 'forest'){ if (d > 7 && v > 0.42) set(x, y, T.FOREST); }
    else if (N.ground === 'foothills'){ if (v > 0.55) set(x, y, T.HILL); if (nr(x, y) > 0.55 && d > 4) set(x, y, T.RUBBLE); }
    else { if (d > 9 && v > 0.78) set(x, y, T.FOREST); }
  }
  // the road the column came along, from the north-west
  for (let i = 0; i < 26; i++){ const x = Math.round(i * 0.95), y = Math.round(i * 0.95); for (let k = -1; k <= 1; k++){ set(x + k, y, T.ROAD); } }
  for (let i = 0; i < 26; i++){ const x = cx + i, y = cy + Math.round(i * 0.7); for (let k = -1; k <= 1; k++) set(x, y + k, T.ROAD); }
  if (N.river) for (let y = 0; y < h; y++){ const x = 34 + Math.round(Math.sin(y / 6) * 2); for (let k = 0; k < 3; k++) set(x + k, y, Math.abs(y - (cy + 7)) <= 1 ? T.ROAD : T.WATER); }
  M.column = {x:(cx + .5) * CELL, y:(cy + .5) * CELL, r:(N.bigZone ? 5 : 3.6) * CELL};
  M.wagons = [];
  if (N.fordHold){   // Long Road pass 1, Night 3: the wagons wait on the west bank; the Column Zone is on the east bank
    const fy = cy + 7, x0 = 34 + Math.round(Math.sin(fy / 6) * 2), ax = x0 + 3, headX = x0 - 2;
    for (let y = fy - 1; y <= fy + 1; y++) for (let x = headX - 12; x <= ax + 6; x++) set(x, y, T.ROAD);
    M.ford = {x0, ax, fy, headX, cx:(x0 + 1.5) * CELL, cy:(fy + .5) * CELL};
    M.column = {x:(ax + 5.5) * CELL, y:(fy + .5) * CELL, r:3.6 * CELL};
    M.camp = {x:(headX - 6) * CELL, y:(fy - 4) * CELL, r:3.6 * CELL};
  }
  if (formation === 'laager' && !N.fordHold){
    const R = N.bigZone ? 8 : 6.5;
    for (let a = 0; a < 14; a++){ if (a % 7 === 3) continue; const t = a / 14 * TAU, x = Math.round(cx + Math.cos(t) * R), y = Math.round(cy + Math.sin(t) * R * 0.85);
      set(x, y, T.WAGON); set(x + 1, y, T.WAGON); M.wagons.push({x:(x + 1) * CELL, y:(y + .7) * CELL}); }
  }
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (g[y * w + x] === T.FOREST) set(x, y, T.GRASS);
  M.start = M.ford ? {x:M.ford.headX - 3, y:M.ford.fy + 2} : {x:cx, y:cy + 2};
  M.ledger = M.ford ? {x:(M.ford.headX - 10 + .5) * CELL, y:(M.ford.fy + .5) * CELL} : {x:(cx + .5) * CELL, y:(cy - 1) * CELL};
  for (let x = 0; x < w; x++){ set(x, 0, T.STONE); set(x, h - 1, T.STONE); }
  for (let y = 0; y < h; y++){ set(0, y, T.STONE); set(w - 1, y, T.STONE); }
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y * w + x] === T.FOREST && r() < 0.55) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
  // refugees huddled in the Column Zone
  M.refugees = []; const races = ['SUN_ELF','GREY_ELF','DARK_ELF','HALF_ELF'];
  const RZ = M.camp || M.column;
  for (let i = 0; i < 18; i++){ const a = r() * TAU, d = r() * M.column.r * 0.8; M.refugees.push({x:RZ.x + Math.cos(a) * d, y:RZ.y + Math.sin(a) * d * 0.8 + 20, p:{race:races[i % 4], spec:'PLAIN', name:'ref' + i, id:'r' + i, sex:i % 2 ? 'f' : 'm'}, left:r() < .5}); }
  MAP = M; M.reach = bfsFrom((M.start.x + .5) * CELL, (M.start.y + .5) * CELL);
  return M;
}

/* ---------------------------------------------------------------------------
   LAUNCHING FIGHTS
--------------------------------------------------------------------------- */
function storyContract(obj, extra){
  return Object.assign({obj, tier:1, host:'deserters', place:'Varnholt', edges:[], council:null, picks:0, minutes:0, pay:0, patron:'the Reeve', faction:null, seed:1 + (Math.random() * 1e6 | 0)}, extra || {});
}
const storySquad = () => META.roster.filter(p => !p.resting).slice(0, 5).map(p => p.id);
/* K98 (UX, 16 Nov): every siege fight said "against Frost-Vault deserters" and listed that host's pool, while the Intelligence
   card and the waves are Hollow Levy. The brief now lists the assault's own wave units (assaultKinds, read by BRIEFING.kinds),
   and the host follows the first wave: Hollow Levy mobs make it the Hollow, anything else stays the Frost-Vault. */
function assaultKinds(i){
  const A = ASSAULTS[i], ks = [], add = k => { if (k && typeof BESTIARY !== 'undefined' && BESTIARY[k] && !ks.includes(k)) ks.push(k); };
  if (!A) return ks;
  for (const w of A.waves) for (const g of w[1]){ const G0 = GROUPS[String(g[0]).replace('?', '')]; if (!G0) continue; add(G0.k); add(G0.lead); if (G0.guard && GROUPS[G0.guard]) add(GROUPS[G0.guard].k); }
  return ks;
}
const assaultHost = i => { const A = ASSAULTS[i]; return A && A.waves[0][1].every(g => g[0] === 'mob') && typeof HOSTS !== 'undefined' && HOSTS.hollow ? 'hollow' : 'deserters'; };
function launchAssault(){
  const C = CP(), A = ASSAULTS[C.assault];
  closePanel(); saveMeta();
  startDeployment(storyContract('siege', {assault:C.assault, host:assaultHost(C.assault), tier:C.assault < 2 ? 1 : C.assault < 4 ? 2 : 3, name:A.name, brief:A.rule}), storySquad());
}
function launchSortie(){
  closePanel(); saveMeta();
  startDeployment(storyContract('sortie', {brief:'A sortie outside the walls to take prisoners.'}), storySquad());
}
function firstCinderNight(){ const i = NIGHTS.findIndex(n => n.cinderForage); return i < 0 ? 0 : i + 1; }
function launchNight(){
  const C = CP(); closePanel(); saveMeta();
  const N = NIGHTS[C.night - 1];
  startDeployment(storyContract('night', {night:C.night, formation:N.fordHold ? 'ford' : C.formation, tier:N.tier || 1, place:N.place, brief:N.comp}), storySquad());
}

/* ---------------------------------------------------------------------------
   IN THE FIELD
--------------------------------------------------------------------------- */
function spawnGroup(key, dir, inside){
  const Gp = GROUPS[key.replace('?', '')], C = CP();
  if (key === 'orsolt?' && C.orsolt !== 'fled') return;
  if (key.startsWith('orsolt') && C.orsolt === 'slain') return;
  const p = edgePointDir(dir); if (!p) return;
  const nrow = G.contract && G.contract.obj === 'night' ? NIGHTS[G.contract.night - 1] : null;
  if (key === 'devil' && nrow && nrow.devilOnce && G.devilRef) return;   // Long Road pass 1: one Devil-Knight on the field, however many waves name it
  const make = (k, n, spread) => { for (let i = 0; i < n; i++){ const e = spawnEnemy(k, p.x + rnd(-spread, spread), p.y + rnd(-spread, spread), {noNem:true});
    if (e){ e.seen = true; if (k === 'levy' && C.orsolt === 'slain') e.noFrenzy = true;
      if (k === 'phalanx' && nrow && nrow.phalanx){ e.con = e.maxCon = e.maxCon * 3; e.undying = true; }
      if (k === 'devil' && nrow && nrow.devilLeads){ e.con = e.maxCon = 80; G.devilRef = e; }
      if (k === 'cinder' && G.devilSlain){ e.broken = true; e.fleeing = true; }   /* Neon: a later wave after the Devil-Knight has fallen arrives already broken */
      if (k === 'orsolt'){ e.parleyed = true; e.flees = true; } } } };
  make(Gp.k, Gp.n, Gp.n > 4 ? 70 : 40);
  if (Gp.lead) make(Gp.lead, 1, 20);
  if (Gp.guard) make(GROUPS[Gp.guard].k, GROUPS[Gp.guard].n, 50);
}
function edgePointDir(dir){
  const W = MAP.w * CELL, H = MAP.h * CELL, m = 2.5 * CELL;
  if (dir === 'NE'){ for (let i = 0; i < 30; i++){ const p = MAP.ford ? {x:rnd(MAP.ford.ax + 4, W / CELL - 2.5) * CELL, y:m + rnd(0, 1) * CELL} : {x:W - m - rnd(0, 2) * CELL, y:m + rnd(0, 4) * CELL}; if (!blockedXY(p.x, p.y)) return p; } return {x:W - m, y:m + CELL}; }
  if (dir === 'EIN') return {x:(38 + rnd(-2, 2)) * CELL, y:(19 + rnd(-2, 2)) * CELL};
  for (let i = 0; i < 30; i++){
    const t = rnd(0.25, 0.75), p = dir === 'N' ? {x:W * t, y:m} : dir === 'S' ? {x:W * t, y:H - m} : dir === 'E' ? {x:W - m, y:H * t} : {x:m, y:H * t};
    if (!blockedXY(p.x, p.y)) return p;
  }
  return {x:W / 2, y:m};
}
function setupStory(c){
  const C = CP(), L = G.leader;
  G.storyR = 0; G.reachBonus = 24; G.allies = []; G.trapStock = 2; G.trapKind = 0; G.traps = [];
  G.prepT = ROUNDF * (c.obj === 'night' ? 1 + ((C.scouted || 0) > 0 ? 1 : 0) : c.obj === 'siege' ? ASSAULTS[c.assault].prep : 0);
  if (C.starving){ G.shaken = 999999; note('The town is starving: the squad begins Shaken.'); }
  if (C.blessed || (c.obj === 'night' && (C.slots || []).includes('chapel'))){ addWard(2); G.blessT = 30 * 60; C.blessed = false; note('Blessed: +2 Ward Tokens and +1 step for 30 seconds.'); }
  if (c.obj === 'night' && (C.slots || []).includes('armoury')) addWard(1);
  if (C.munitions){ for (let i = 0; i < C.munitions; i++) G.caches.push({x:L.x - 60 + i * 30, y:L.y + 46, kind:i % 2 ? 'smoke' : 'cusser', opened:false}); C.munitions = 0; }
  // auxiliaries: up to two squads take the field
  const deploy = C.aux.slice(0, 2).concat(c.obj === 'night' && C.hired ? [{type:'sellswords', n:4, hired:true}] : []);
  deploy.forEach((a, ai) => { for (let i = 0; i < a.n; i++){ const A = AUX[a.type], ang = (ai * 3 + i) * 0.7;
    G.allies.push({aux:a, type:a.type, x:L.x + Math.cos(ang) * 70, y:L.y + Math.sin(ang) * 50, hp:A.con, maxHp:A.con, ac:A.ac, shift:0, r:9, objHp:true, auxUnit:true, state:'up',
      timer:30 + i * 7, atkT:0, left:false, flash:0, spr:auxSprite(a.type, i), slot:ai * 6 + i}); } });
  if (c.obj === 'siege'){
    const A = ASSAULTS[c.assault];
    G.structs = {}; for (const k in STRUCTS){ const S = STRUCTS[k], s = C.st[k]; if (s.hp <= 0) continue;
      G.structs[k] = {k, x:S.face[0] * CELL, y:S.face[1] * CELL, hp:s.hp, maxHp:s.max, ac:S.ac + (S.keep && C.fort.murder ? 0 : 0), shift:1, r:34, objHp:true, struct:true, name:S.name}; }
    G.districts = {}; for (const k in DISTRICTS){ const D = DISTRICTS[k]; G.districts[k] = {k, x:(D.at[0] + .5) * CELL, y:(D.at[1] + .5) * CELL, r:D.r * CELL, state:C.district[k]}; }
    if (A.night){ G.fogT = A.rounds * ROUNDF + G.prepT; G.nightTint = true; }
    // the town's own works: stakes and fire pits outside the gates
    for (let i = 0; i < C.fort.stakes; i++) G.traps.push({x:(21 + i * 3) * CELL, y:6.5 * CELL, kind:'stakes', armed:true, enemy:false, seen:true, uses:10});
    for (let i = 0; i < C.fort.firepits; i++){ G.traps.push({x:(22.5 + i * 2) * CELL, y:4.5 * CELL, kind:'firepot', armed:true, enemy:false, seen:true, uses:1}); }
    G.trapStock = 3 + (C.fort.barricades ? 1 : 0);
    if (C.fallback || A.keep) note('The company holds the Keep. Every district beyond its walls is lost.');
    G.timeLimit = A.rounds * ROUNDF; G.waves = A.waves.map(w => ({at:w[0], groups:w[1], done:false}));
    G.trickle = {k:c.assault === 3 ? 'cinder' : c.assault === 2 ? 'renegade' : 'levy', dirs:[...new Set(A.waves.flatMap(w => w[1].map(g => g[1])))].filter(d => d !== 'EIN'), every:c.assault === 2 ? 420 : 180};
    if (!G.trickle.dirs.length) G.trickle.dirs = ['E'];
    note(`Assault ${c.assault + 1}: ${A.name}. ${A.rule}`);
    if (A.keep) G.duruk = true;
  }
  if (c.obj === 'night'){
    const N = NIGHTS[c.night - 1];
    G.column = MAP.column; G.colLoss = 0;
    G.ledger = {x:MAP.ledger.x, y:MAP.ledger.y, hp:C.wagonHp, maxHp:C.wagonMax, ac:4, shift:0, r:30, objHp:true, name:'The Ledger Wagon'};
    G.camp = MAP.camp || null;
    G.timeLimit = 6 * ROUNDF; G.waves = [{at:0, groups:N.force, done:false}, {at:2, groups:N.force, done:false}, {at:4, groups:N.force.slice(0, 2), done:false}];
    G.trickle = {k:N.trickle || 'chaingang', dirs:N.force.map(f => f[1]), every:300};
    if (N.fordHold) fordSetup();   // after the waves and trickle exist, so F34.fordNoFoes can clear them
    if (C.extraCinder){ G.waves[0].groups = G.waves[0].groups.concat([['cinder', 'N']]); C.extraCinder = false; }
    if (N.fog){ G.fogT = 9 * ROUNDF; G.sightK = 0.6; }
    if (N.fire) G.smokeT = 9 * ROUNDF;
    if (c.formation === 'woodland'){ G.sightK = 0.6; }
    if (c.formation === 'square'){ G.squareFire = true; }
    if (N.knives){ for (let i = 0; i < 4; i++){ const a = i / 4 * TAU + 0.4; G.blips.push({x:G.column.x + Math.cos(a) * 170, y:G.column.y + Math.sin(a) * 140, revealed:false}); } }
    if (N.kalloon) G.kalloon = true;
    note(`Night ${c.night}: ${N.place}. ${N.comp}`);
  }
  if (c.obj === 'sortie'){
    G.timeLimit = 4 * ROUNDF; G.prepT = 0; G.trapStock = undefined; G.reachBonus = 0;
    const L2 = G.leader, a = Math.random() * TAU;
    for (const key of [C.assault >= 2 ? 'cinder' : 'chain', 'chain']){ const p = {x:L2.x + Math.cos(a) * 520, y:L2.y + Math.sin(a) * 420};
      const Gp = GROUPS[key]; for (let i = 0; i < Gp.n; i++){ const e = spawnEnemy(Gp.k, p.x + rnd(-60, 60), p.y + rnd(-60, 60), {noNem:true}); if (e){ e.seen = true; e.sortie = true; } }
      if (Gp.lead){ const e = spawnEnemy(Gp.lead, p.x, p.y, {noNem:true}); if (e){ e.seen = true; e.sortie = true; } } }
    note('Sortie: break the enemy foragers and take prisoners. Every enemy that falls near you may yield one.');
  }
  if (G.prepT > 0) note(`Preparation: ${Math.round(G.prepT / 60)} seconds. [F] sets a trap, [G] picks the kind, [ENTER] starts the fight.`);
}
/* PD-43 (Patrick Q43, 2026-11-16, road stakes draft S1-S3 live [S]): a foe at the column costs a family only after
   ROAD43.unengaged s there with no squad member near; the dawn toll is halved on a win; a wrecked wagon is patched to
   ROAD43.patch and loses a fitting only when the night was fled or fallen */
const ROAD43 = {unengaged: 5, dawnWin: 20, dawnLost: 10, patch: 70};
const atColumn43 = e => !e.dead && !e.dormant && !e.broken && BESTIARY[e.k].arch !== 'fixed' && !RANGED_ARCH(BESTIARY[e.k].arch) && dist(e, G.column) < G.column.r + 40 && !squadUnits().some(u => dist(u, e) < 70);
/* ---- Long Road pass 1, Night 3: the ford hold (audits/specs/long-road-pass1.md, "The ford hold") ----
   Six wagons wait in a file on the west bank. One starts across every 15 s once the fight begins, at one cell a second.
   While a foe is within 80 px of the ford every wagon not yet across stops, and the start timer pauses.
   A foe within 120 px of any wagon goes for the wagon. Column wagons have 40 HP; one destroyed costs 1 Column Strength.
   At dawn each column wagon not across costs 1; a Ledger Wagon not across counts as wrecked (the wagon stake). [S] numbers. */
const FORD = {count:6, gap:900, speed:40 / 60, halt:80, notice:120, hp:40, ac:4};
function fordSetup(){
  const F = MAP.ford; G.fordWagons = []; G.fordT = 0; G.fordAcross = 0; G.fordHalt = false; G.fordDead = 0; G.fordMissed = 0;
  for (let i = 0; i < FORD.count; i++){
    const w = i === FORD.count - 1 ? G.ledger : {hp:FORD.hp, maxHp:FORD.hp, ac:FORD.ac, shift:0, r:22, objHp:true, name:'Column wagon', flash:0};
    w.fi = i; w.fs = 'wait'; w.x = (F.headX - 2 * i + .5) * CELL; w.y = (F.fy + .5) * CELL; G.fordWagons.push(w);
  }
  note('The wagons start across when the fight begins. Before then, the squad can cross and set traps on the east bank.');
  if (typeof F34 !== 'undefined' && F34.fordNoFoes){ G.waves = []; G.trickle = null; }
}
function fordTarget(e){
  if (!G || !G.fordWagons || e.fleeing) return null;
  let b = null, bd = FORD.notice;
  for (const w of G.fordWagons) if (w.hp > 0 && w.fs !== 'dead'){ const d = dist(e, w); if (d < bd){ bd = d; b = w; } }
  return b;
}
function fordTick(){
  const F = MAP.ford, W = G.fordWagons, Z = G.column;
  if (!W || G.prepT > 0) return;
  for (const w of W){   // a wagon at 0 HP is gone; only a column wagon costs Column Strength, and costs it at once
    if (w.fs !== 'dead' && w.hp <= 0){ w.fs = 'dead';
      if (w === G.ledger) pop(w.x, w.y - 40, 'LEDGER WAGON WRECKED', '#ff5a4a');
      else { G.fordDead++; G.colLoss += 1; pop(w.x, w.y - 40, 'WAGON LOST: -1 COLUMN', '#ff5a4a'); note('A column wagon is lost at the ford: Column Strength -1.'); SFX.play('down'); } }
    if (w.flash > 0 && w !== G.ledger) w.flash--;
  }
  const live = W.filter(w => w.fs === 'wait' || w.fs === 'roll');
  const near = G.enemies.some(e => !e.dead && !e.dormant && !e.broken && Math.hypot(e.x - F.cx, e.y - F.cy) < FORD.halt);
  const halted = near && live.length > 0;
  if (halted && !G.fordHalt) pop(F.cx, F.cy - 56, 'WAGONS HALTED: CLEAR THE FORD', '#ffd860');
  G.fordHalt = halted;
  const waiting = W.filter(w => w.fs === 'wait');
  if (!halted){
    G.fordT++;
    const nx = waiting[0];
    if (nx && G.fordT >= nx.fi * FORD.gap){ nx.fs = 'roll'; const k = G.fordAcross++; nx.tx = Z.x - Z.r + .5 * CELL + (k % 2) * 1.2 * CELL; nx.ty = Z.y + (((k >> 1) % 3) - 1) * 1.1 * CELL; }
    for (const w of W) if (w.fs === 'roll'){
      const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
      if (d <= FORD.speed){ w.x = w.tx; w.y = w.ty; w.fs = 'across';
        pop(w.x, w.y - 40, w === G.ledger ? 'LEDGER WAGON ACROSS' : 'ACROSS', '#9be08a');
        if (W.every(q => q.fs === 'across')) pop(Z.x, Z.y - 70, 'ALL ACROSS', '#9be08a'); }
      else { w.x += dx / d * FORD.speed; w.y += dy / d * FORD.speed; }
    }
  }
  let slot = 0;   // the file closes up behind the one that left
  for (const w of W) if (w.fs === 'wait'){ const tx = (F.headX - 2 * slot + .5) * CELL; w.x += Math.max(-1.5, Math.min(1.5, tx - w.x)); slot++; }
}
const fordAcrossCount = () => (G.fordWagons || []).filter(w => w.fs === 'across').length;
function fordLines(lines){   // words are the EN's placeholders until the ND writes them
  const n = fordAcrossCount(), d = G.fordDead || 0, m = G.fordMissed || 0;
  lines.push(`<p>${n === FORD.count ? 'All six wagons are across the ford.' : n + ' of ' + FORD.count + ' wagons are across.'}${d ? ` ${d} wrecked on the way: Column Strength -${d}.` : ''}${m ? ` ${m} not across at dawn: Column Strength -${m}.` : ''}</p>`);
  if (G.fordLedgerLeft) lines.push('<p>The Ledger Wagon was not across at dawn. Dragged over in a hurry, it was wrecked.</p>');
}
function updateStory(){
  const C = CP(), L = G.leader;
  if (G.prepT > 0){ G.prepT--; if (G.prepT === 0){ note('Here they come!'); SFX.play('horn'); } }
  else {
    if (G.fordWagons) fordTick();
    G.storyT = (G.storyT || 0) + 1;
    if (G.obj === 'night' && G.column){ let n = 0; for (const e of G.enemies){ if (atColumn43(e)){ e.col43 = (e.col43 || 0) + 1; n++; } else e.col43 = 0; } G.col43 = n; }   // PD-43 S1
    const round = Math.floor(G.storyT / ROUNDF);
    for (const w of G.waves || []) if (!w.done && round >= w.at){ w.done = true; for (const [k, d] of w.groups) spawnGroup(k, d); announceWave(w.groups.map(g => g[1])); }
    if (G.storyT % ROUNDF === 0) storyRoundEnd(round);
    // the host keeps coming: a steady trickle between the waves
    if (G.trickle && G.storyT % G.trickle.every === 0 && G.storyT < G.timeLimit - 600){ const p = edgePointDir(pickOf(G.trickle.dirs)); for (let i = 0; i < 2 + (G.contract.tier || 1); i++){ const e = spawnEnemy(G.trickle.k, p.x + rnd(-50, 50), p.y + rnd(-50, 50), {noNem:true}); if (e){ e.seen = true; if (G.trickle.k === 'levy' && CP().orsolt === 'slain') e.noFrenzy = true; } } }
  }
  // barricaded lanes slow anything inside the walls
  if (G.obj === 'siege' && C.fort.barricades) for (const e of G.enemies) if (!e.dead && !outsideWalls(e)) e.slow = Math.max(e.slow || 0, 2);
  // walls and gates that fall open their gaps
  if (G.structs) for (const k in G.structs){ const s = G.structs[k]; if (s.flash > 0) s.flash--;
    if (s.hp <= 0 && !s.down){ s.down = true; for (const [x, y] of STRUCTS[k].cells) MAP.g[y * MAP.w + x] = STRUCTS[k].gate ? T.ROAD : T.RUBBLE;
      G.flow = bfsFrom(L.x, L.y, G.flow); G.shake = 20; SFX.play('blast'); pop(s.x, s.y - 40, s.name.toUpperCase() + ' HAS FALLEN', '#ff5a4a'); note(`${s.name} has fallen!`);
      G.fx.push({blast:true, x:s.x, y:s.y, r:0, max:90, life:24, c:'#c8a070'}); } }
  // auxiliaries fight
  for (const a of G.allies){
    if (a.state !== 'up') continue; if (a.flash > 0) a.flash--; if (a.atkT > 0) a.atkT--;
    const A = AUX[a.type];
    let tgt = null, bd = 300; for (const e of G.enemies){ if (e.dead || e.dormant || BESTIARY[e.k].arch === 'fixed') continue; const d = dist(e, a); if (d < bd){ bd = d; tgt = e; } }
    const ang = (a.slot / 12) * TAU + G.facing, th = threatened(), inward = th && th.y < MAP.h * CELL / 2 ? 1 : -1;
    const home = G.column ? {x:G.column.x + Math.cos(ang) * 120, y:G.column.y + Math.sin(ang) * 90} : th ? {x:th.x + Math.cos(ang) * 60, y:th.y + inward * (70 + (a.slot % 3) * 18)} : {x:L.x + Math.cos(ang) * 90, y:L.y + Math.sin(ang) * 70};
    const keep = A.shoot || A.magic ? 160 : 34, goal = tgt && (bd < 220 || !A.shoot) ? tgt : home, dx = goal.x - a.x, dy = goal.y - a.y, d = Math.hypot(dx, dy);
    const want = goal === tgt ? keep : 6;
    if (d > want){ const far = d > 140 && !losLine(a, goal) ? flowDir(G.fflow || G.flow, a.x, a.y) : null, sp = goal === home && d > 200 ? 1.5 : 0.95;
      if (far && goal === home){ a.x += far.x * sp; a.y += far.y * sp; } else { a.x += dx / d * sp; a.y += dy / d * sp; } a.left = dx < 0; a.moving = true; } else a.moving = false;
    collide(a, 8, true);
    if (tgt && --a.timer <= 0){
      a.left = tgt.x < a.x; a.atkT = 12;
      if (bd < 46 + G.reachBonus){ strike(tgt, A.m + (G.blessT > 0 ? 1 : 0), 2, {from:a}); a.timer = 60; fxArc(a, tgt); }
      else if ((A.shoot || A.magic) && bd < 300 && losLine(a, tgt)){ const an = Math.atan2(tgt.y - a.y, tgt.x - a.x);
        G.shots.push({x:a.x, y:a.y - 6, vx:Math.cos(an) * 9, vy:Math.sin(an) * 9, life:60, kind:A.magic ? 'missile' : 'arrow', target:tgt, skill:A.r + (a.type === 'volunteers' && cellAt(a.x, a.y) === T.FOREST ? 1 : 0), dmg:2, flat:0}); a.timer = A.magic ? 120 : 70; }
      else a.timer = 12;
    }
  }
  // Long Road pass 1, Night 6: kill the Devil-Knight and every Cinderling on the field breaks and runs; no more follow
  if (G.obj === 'night' && G.devilRef && G.devilRef.dead && !G.devilSlain){ G.devilSlain = true; G.trickle = null;
    for (const e of G.enemies) if (!e.dead && e.k === 'cinder'){ e.broken = true; e.fleeing = true; }
    pop(G.devilRef.x, G.devilRef.y - 60, 'THE DEVIL-KNIGHT FALLS: THE CINDERLINGS BREAK', '#ffd860'); note('The Devil-Knight falls, and its Cinderlings break.'); }
  // Orsolt flees when badly hurt (Assault 2)
  for (const e of G.enemies) if (e.flees && !e.dead && !e.fleeing && e.con <= e.maxCon * 0.4){ e.fleeing = true; note(`${ename(e)} has had enough and flees for the mill road!`); pop(e.x, e.y - 50, 'FLEEING', '#ffd860'); }
  // the Ledger Wagon
  if (G.ledger && G.ledger.flash > 0) G.ledger.flash--;
  // Night 8: Blip Tokens left unturned
  // orc riders and the riders of Kalloon
  if (G.riders){ for (const rd of G.riders){ rd.x += rd.vx; for (const e of G.enemies) if (!e.dead && Math.abs(e.x - rd.x) < 30 && Math.abs(e.y - rd.y) < 60 && (rd.only ? rd.only.includes(e.k) : !BESTIARY[e.k].boss)) killEnemy(e); }
    G.riders = G.riders.filter(rd => rd.x > -200 && rd.x < MAP.w * CELL + 200); }
}
function sweepRiders(only, label, col, fixedDir){
  const H = MAP.h * CELL, W = MAP.w * CELL, dir = fixedDir || (Math.random() < .5 ? 1 : -1);
  G.riders = G.riders || [];
  for (let i = 0; i < 16; i++) G.riders.push({x:dir > 0 ? -60 - (i % 4) * 40 : W + 60 + (i % 4) * 40, y:H * (0.12 + 0.76 * i / 15), vx:dir * 9, only, col});
  SFX.play('horn'); G.shake = 18; note(label); pop(G.leader.x, G.leader.y - 70, label.toUpperCase().split(':')[0], col);
}
function storyRoundEnd(round){
  const C = CP(), L = G.leader;
  if (G.obj === 'siege'){
    const A = ASSAULTS[G.contract.assault];
    // districts are overrun or retaken (Section 13.4)
    for (const k in G.districts){ const D = G.districts[k]; if (k === 'keep' && !A.keep) continue;
      if (C.fallback && k !== 'keep') continue;
      const en = G.enemies.filter(e => !e.dead && !e.dormant && dist(e, D) < D.r).length;
      const fr = squadUnits().filter(u => dist(u, D) < D.r).length + G.allies.filter(a => a.state === 'up' && dist(a, D) < D.r).length;
      const leaderIn = !L.down && dist(L, D) < D.r;
      if (D.state === 'held' && en >= 3 && en > fr && !leaderIn){ D.state = 'overrun'; note(`${DISTRICTS[k].name} is overrun!`); SFX.play('down'); pop(D.x, D.y - 40, 'OVERRUN', '#ff5a4a'); }
      else if (D.state === 'overrun' && leaderIn && en === 0){ D.state = 'held'; note(`${DISTRICTS[k].name} is retaken.`); SFX.play('stand'); pop(D.x, D.y - 40, 'RETAKEN', '#8fd39a'); }
    }
    if (G.duruk && round === 3){ sweepRiders(['levy'], "Khan Duruk's orc riders hit the host from behind!", '#9ae070'); G.disarray = (G.disarray || 0) + 1; }
    if (G.duruk && (round === 4 || round === 5)){ let n = 0; for (const e of G.enemies) if (!e.dead && e.k === 'levy' && n < 12){ killEnemy(e); n++; } if (n) note("Duruk's riders cut down a Levy Mob."); }
  }
  if (G.obj === 'night'){
    const N = NIGHTS[G.contract.night - 1];
    // enemies at the Column Zone take their toll (Section 14.6)
    const at = G.enemies.filter(e => atColumn43(e) && (e.col43 || 0) >= ROAD43.unengaged * 60);   // PD-43 S1: only foes left alone at the column for 5 s
    const weight = at.reduce((s, e) => s + (BESTIARY[e.k].tier >= 2 ? 2 : 1) * (e.k === 'phalanx' ? 2 : 1), 0), loss = Math.ceil(weight / 6);
    if (at.some(e => e.k === 'phalanx')) G.phalanxAt = true;   // Long Road pass 1: the Night 5 debrief says whether it reached the column
    if (loss){ G.colLoss += loss; pop(G.column.x, G.column.y - 60, `-${loss} COLUMN`, '#ff5a4a'); note(`The enemy reached the column: Column Strength -${loss}.`); SFX.play('hurt'); }
    if (N.knives && round === 3){ const left = G.blips.filter(b => !b.revealed).length; G.knivesLeft = left; if (left){ C.supply -= left; note(`${left} knife${left > 1 ? 's' : ''} in the dark: -${left} Supply.`); for (const b of G.blips) if (!b.revealed){ b.revealed = true; for (let i = 0; i < 3; i++){ const e = spawnEnemy('cutthroat', b.x + rnd(-30, 30), b.y + rnd(-30, 30)); if (e) e.seen = true; } } } }
    if (N.fire){ const rr = (MAP.w * CELL / 2) - round * 3 * CELL; for (let i = 0; i < 10; i++){ const a = Math.random() * TAU; G.fires.push({x:G.column.x + Math.cos(a) * rr, y:G.column.y + Math.sin(a) * rr, r:42, life:ROUNDF * 3, enemy:true, friendly:true}); } note('The fire spreads inward.'); }
    if (G.kalloon && round === 4 && window.ARTEMIS23 !== false){ const A = artemisLines(); if (A.horn){ note(A.horn); G.hornT = G.frame; setTimeout(() => { try { if (G && G.kalloon && !G.over) SFX.play('horn'); } catch (e) {} }, 600);   /* 0.6 s late: SGAP.horn drops a horn within 120 ms of the wave horns (LE/QA) */ } try { w3dKnightWarm(); } catch (e) {} }   // P23-ARTEMIS: the horn at the end of round 4 (Hal's shout, the existing caption line); bake the knights' run frames now
    if (G.kalloon && round === 5){ const A = artemisLines(); G.knArrived = true; sweepRiders(null, (window.ARTEMIS23 !== false && A.relief) || 'Artemis\u2019s knights cross the ford!', '#ffd860', window.ARTEMIS23 !== false ? -1 : 0); G.disarray = (G.disarray || 0) + 1; }   // the knights ride in from the east (the road); the sweep still kills what it always killed
  }
}
function storyCheck(){
  const C = CP(), L = G.leader;
  if (G.obj === 'sortie'){
    if (G.enemies.filter(e => e.sortie && !e.dead).length === 0 && !G.winT){ G.winT = 90; note('The foragers are broken.'); }
    if (G.winT && --G.winT <= 0){ endDeployment('victory'); return true; }
    if ((G.storyT || 0) >= G.timeLimit){ endDeployment('withdrawn'); return true; }
    return false;
  }
  if (G.prepT > 0 || (G.storyT || 0) < G.timeLimit){
    if (G.obj === 'siege' && G.structs.kgate && G.structs.kgate.hp <= 0 && (C.fallback || ASSAULTS[G.contract.assault].keep)){
      const K = G.districts.keep, en = G.enemies.filter(e => !e.dead && dist(e, K) < K.r).length, fr = squadUnits().filter(u => dist(u, K) < K.r).length;
      if (en > fr + 4 && !(dist(L, K) < K.r)) return contractFail('THE KEEP HAS FALLEN', 'The Keep is overrun.');
    }
    return false;
  }
  // time is up: was it won?
  if (G.obj === 'siege'){
    const A = ASSAULTS[G.contract.assault], ok =
      A.win === 'gate' ? (G.structs.ngate && G.structs.ngate.hp > 0) :
      A.win === 'districts' ? Object.values(G.districts).filter(d => d.state === 'overrun' && d.k !== 'keep').length - Object.values(CP().district).filter(s => s === 'overrun').length <= 1 :
      A.win === 'keep' ? (!L.down && dist(L, G.districts.keep) < G.districts.keep.r + 40) :
      (C.fallback ? !!(G.structs.kgate && G.structs.kgate.hp > 0) : true);
    if (ok){ endDeployment('victory'); return true; }
    return contractFail(A.win === 'gate' ? 'THE GATE IS DOWN' : A.win === 'keep' ? 'VARNHOLT FALLS' : 'THE TOWN IS BROKEN', 'The assault is lost.');
  }
  if (G.obj === 'night'){
    // dawn: anything still standing takes a last toll as it withdraws
    const left = G.enemies.filter(e => !e.dead && !e.dormant && !e.undying && !e.broken && BESTIARY[e.k].arch !== 'fixed').length, loss = Math.ceil(left / ROAD43.dawnWin);   // PD-43 S2: a win (time up) halves the dawn toll
    if (G.fordWagons){   // the ford hold: wagons not across cost 1 each; a Ledger Wagon not across is wrecked
      const m = G.fordWagons.filter(w => w !== G.ledger && w.fs !== 'across' && w.fs !== 'dead').length; G.fordMissed = m;
      if (m){ G.colLoss += m; note(`Dawn. ${m} of the wagons are not across: Column Strength -${m}.`); }
      if (G.ledger.fs !== 'across' && G.ledger.hp > 0){ G.ledger.hp = 0; G.fordLedgerLeft = true; note('Dawn. The Ledger Wagon is not across, and is wrecked.'); }
    }
    if (loss){ G.colLoss += loss; note(`Dawn. The enemy withdraws with what it can carry: Column Strength -${loss}.`); }
    if (G.devilRef && !G.devilRef.dead){ G.colLoss += 2; G.devilLived = true; note('The Devil-Knight lives to dawn: Column Strength -2.'); }   // Long Road pass 1, Night 6
    endDeployment('victory'); return true;
  }
  return false;
}
function storyProgress(){ return G.prepT > 0 ? 0 : Math.min(1, (G.storyT || 0) / G.timeLimit); }
function storyLine(t){
  if (G.prepT > 0) return [`PREPARE  ${Math.ceil(G.prepT / 60)}s`, `[F] SET ${TRAPS[RAID_TRAPS[G.trapKind]].name.toUpperCase()} (${G.trapStock} LEFT)  \u00b7  [G] NEXT TRAP  \u00b7  [ENTER] START`];
  const round = Math.min(Math.floor((G.storyT || 0) / ROUNDF) + 1, G.timeLimit / ROUNDF), left = Math.max(0, Math.ceil((G.timeLimit - (G.storyT || 0)) / 60));
  if (G.obj === 'siege'){ const s = G.structs[ASSAULTS[G.contract.assault].keep || CP().fallback ? 'kgate' : 'ngate'];
    return [`ROUND ${round} / ${G.timeLimit / ROUNDF}`, `${s ? s.name.toUpperCase() + ' ' + Math.max(0, Math.round(s.hp)) + ' / ' + s.maxHp : 'THE GATE IS DOWN'}  \u00b7  ${left}s LEFT`]; }
  if (G.obj === 'night') return [`ROUND ${round} / 6`, `${G.fordWagons ? 'ACROSS ' + fordAcrossCount() + ' / 6  ' + String.fromCharCode(183) + '  ' : ''}COLUMN ${Math.max(0, CP().column - (G.colApplied ? 0 : G.colLoss))}  \u00b7  WAGON ${Math.max(0, G.ledger.hp)}  \u00b7  DAWN IN ${left}s`];
  return ['SORTIE', `${G.enemies.filter(e => e.sortie && !e.dead).length} LEFT  \u00b7  ${left}s`];
}
function storyTarget(e){
  const B = BESTIARY[e.k], L = G.leader;
  if (e.fleeing) return null;
  // the nearest auxiliary, if closer than the squad
  let best = null, bd = 160; for (const a of G.allies) if (a.state === 'up'){ const d = dist(e, a); if (d < bd){ bd = d; best = a; } }
  if (best && bd < dist(e, L) - 20) return best;
  if (G.obj === 'siege'){
    const outside = outsideWalls(e), L = G.leader, chase = !L.down && dist(e, L) < 200 && outsideWalls(L);
    if ((outside && !chase && !RANGED_ARCH(B.arch)) || B.ram){
      let tg = null, td = 1e9; const A = ASSAULTS[G.contract.assault];
      for (const k in G.structs){ const s = G.structs[k]; if (s.hp <= 0) continue; if (B.ram && !STRUCTS[k].gate) continue;
        if (!(A.keep || CP().fallback) && STRUCTS[k].keep) continue;
        const d = dist(e, s) * (STRUCTS[k].gate ? 0.8 : 1); if (d < td){ td = d; tg = s; } }
      if (tg) return tg;
    }
    if (e.seed % 3 === 0){ const ds = Object.values(G.districts).filter(d => d.k !== 'keep' || ASSAULTS[G.contract.assault].keep); const d = ds[e.seed % ds.length]; return {x:d.x + (e.seed % 5 - 2) * 20, y:d.y}; }
    return null;
  }
  if (G.obj === 'night'){
    const N = NIGHTS[G.contract.night - 1];
    if (N.wagonFirst && e.k === 'raider' && G.ledger.hp > 0) return G.ledger;
    if (e.seed % 5 === 0 && G.ledger.hp > 0) return G.ledger;
    if (e.seed % 2 === 0) return {x:G.column.x + (e.seed % 7 - 3) * 14, y:G.column.y + (e.seed % 3 - 1) * 14};
    return null;
  }
  return null;
}
function storyEnemyAI(e, B){
  if (e.fleeing){
    const W = MAP.w * CELL, tx = e.x < W / 2 ? 0 : W, dx = tx - e.x, d = Math.abs(dx) || 1; e.x += dx / d * B.speed * 1.4; e.left = dx < 0; collide(e, e.r * .7);
    if (e.x < 60 || e.x > W - 60){ e.dead = true; e.gone = 'fled'; if (!e.broken){ CP().orsolt = 'fled'; note(`${ename(e)} escapes. He will be back.`); } }
    return true;
  }
  if (B.ram){
    const t = storyTarget(e); if (!t){ return false; }
    const dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy);
    if (d > e.r + t.r){ e.x += dx / d * B.speed; e.y += dy / d * B.speed; e.left = dx < 0; collide(e, e.r * .7); }
    else if (--e.hitCd <= 0){ e.hitCd = 150; e.atkT = 14; damageObjective(t, 22 + d6() * 4); G.shake = 10; SFX.play('bash'); }
    return true;
  }
  return false;
}
function storyBodies(bodies, onScreen){
  try { w3dRiderWarms(); } catch (e) {}   // P23-BUG-9: bake Duruk's riders and the knights ahead of their sweep (Neon R20)
  if (G.obj === 'siege'){
    for (const k in G.structs){ const s = G.structs[k]; if (!onScreen(s, 80)) continue;
      bodies.push({y:s.y - 30, custom:() => {
        if (s.hp > 0 && STRUCTS[k].gate) drawGateHouse(k, s.flash > 0, s.hp / s.maxHp);
        if (s.hp > 0){ const bw = 70, top = s.y - (k[0] === 'k' ? 30 : 26);
          ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(s.x - bw / 2 - 1, top - 1, bw + 2, 7);
          ctx.fillStyle = s.hp > s.maxHp * 0.35 ? '#c8a070' : '#e0503a'; ctx.fillRect(s.x - bw / 2, top, bw * Math.max(0, s.hp / s.maxHp), 5);
          ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 10) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(s.name.toUpperCase(), s.x, top - 3); } }});
    }
    for (const k in G.districts){ const D = G.districts[k]; if (!onScreen(D, 200)) continue;
      bodies.push({y:-1e9, custom:() => { ctx.globalAlpha = 0.18; ctx.fillStyle = D.state === 'overrun' ? '#c03020' : '#d4af37'; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = D.state === 'overrun' ? 'rgba(255,90,60,.6)' : 'rgba(240,210,110,.35)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = D.state === 'overrun' ? '#ff8a7a' : '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 12) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(DISTRICTS[k].name.toUpperCase() + (D.state === 'overrun' ? ' (OVERRUN)' : ''), D.x, D.y - D.r + 14); }});
    }
  }
  if (G.obj === 'night'){
    bodies.push({y:-1e9, custom:() => { const Cz = G.column; ctx.fillStyle = 'rgba(240,220,160,.10)'; ctx.beginPath(); ctx.arc(Cz.x, Cz.y, Cz.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = G.col43 ? `rgba(255,90,74,${(0.55 + 0.35 * Math.sin((G.storyT || 0) / 6)).toFixed(2)})` : 'rgba(240,220,160,.45)'; ctx.setLineDash([6, 8]); ctx.lineWidth = G.col43 ? 3 : 2; ctx.beginPath(); ctx.arc(Cz.x, Cz.y, Cz.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);   // PD-43: the ring pulses red while a foe stands at the column unanswered
      ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 12) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText('THE COLUMN', Cz.x, Cz.y + Cz.r - 8); }});   /* the label sits at the foot of the ring so it never meets THE LEDGER WAGON at the top */
    for (const rf of MAP.refugees || []) if (onScreen(rf)) bodies.push({y:rf.y, custom:() => { try { ctx.save(); ctx.beginPath(); ctx.ellipse(rf.x, rf.y + 14, 11, 3.6, 0, 0, TAU); ctx.fillStyle = 'rgba(255,225,160,.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,225,160,.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore(); } catch (e) {}   /* unarmed folk: a faint warm ring (armed folk have the blue one) */
      drawUnit3(rf, personSpriteK('ref:' + rf.p.name + rf.p.race, rf.p), rf.x, rf.y, 2, 0, rf.left, false); }});   /* Index 74 */
    for (const wg of MAP.wagons || []) if (onScreen(wg, 80)) bodies.push({y:wg.y, custom:() => { if (!w3dWagon(wg.x, wg.y, wg.x < G.column.x, 2.6, false)) figPlaceholder(wg.x, wg.y - 16, 2.6, {h:24, w:30, box:true, shadowW:13}); }}); /* S6-C note 10: non-pixel stand-in */   /* Index 74 */
    if (G.fordWagons) for (const w of G.fordWagons) if (w !== G.ledger && w.hp > 0 && onScreen(w, 80)) bodies.push({y:w.y, custom:() => { if (!w3dWagon(w.x, w.y, false, 2.6, w.flash > 0)) figPlaceholder(w.x, w.y - 16, 2.6, {h:24, w:30, box:true, shadowW:13});
      const bw = 44, top = w.y - 62; ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(w.x - bw / 2 - 1, top - 1, bw + 2, 6); ctx.fillStyle = w.fs === 'across' ? '#9be08a' : '#c8a070'; ctx.fillRect(w.x - bw / 2, top, bw * Math.max(0, w.hp / w.maxHp), 4); }});
    if (G.ledger.hp > 0) bodies.push({y:G.ledger.y, custom:() => { const w = G.ledger; if (!w3dWagon(w.x, w.y, false, 3.2, w.flash > 0)) figPlaceholder(w.x, w.y - 20, 3.2, {h:24, w:30, box:true, shadowW:13}); /* S6-C note 10: non-pixel stand-in */   /* Index 74 */
      const bw = 80, top = w.y - 84; ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(w.x - bw / 2 - 1, top - 1, bw + 2, 7); ctx.fillStyle = '#c8a070'; ctx.fillRect(w.x - bw / 2, top, bw * Math.max(0, w.hp / w.maxHp), 5);
      ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 11) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText('THE LEDGER WAGON', w.x, top - 4); }});
  }
  for (const a of G.allies) if (onScreen(a)) bodies.push({y:a.y, custom:() => {
    if (a.state !== 'up') return;
    ctx.beginPath(); ctx.ellipse(a.x, a.y + 15, 12, 4, 0, 0, TAU); ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 1.5; ctx.stroke();
    drawSprite(a.spr, a.x, a.y, 2.1, a.atkT > 0 ? 3 : a.moving ? 1 + ((G.frame / 9 | 0) % 2) : 0, a.left, a.flash > 0);
    for (let i = 0; i < a.maxHp; i++){ ctx.fillStyle = i < a.hp ? '#9fe0ff' : 'rgba(0,0,0,.45)'; ctx.fillRect(a.x - a.maxHp * 2 + i * 4, a.y + 19, 3, 3); } }});
  for (const rd of G.riders || []) bodies.push({y:rd.y, custom:() => { if (!w3dRider(rd)){ figPlaceholder(rd.x, rd.y - 7 * 2.6, 2.6, {h:22, w:7, mount:true, shadowW:10}); /* S6-C note 10: non-pixel stand-in */   /* Index 74 */
      ctx.fillStyle = rd.col; ctx.fillRect(rd.x - 4, rd.y - 46, 8, 12); } }});   /* QA: the flat pennant square only goes with the stand-in; the 3D riders carry their own livery */
}
function storyMarkers(out){
  if (G.obj === 'siege'){ for (const k in G.structs){ const s = G.structs[k]; if (s.hp > 0) out.push({x:s.x, y:s.y, kind:'vault', sp:'vault'}); } }
  if (G.obj === 'night'){ out.push({x:G.column.x, y:G.column.y, kind:'ally', sp:'wagon'}); }
  for (const a of G.allies) if (a.state === 'up') out.push({x:a.x, y:a.y, kind:'ally'});
}
function storyDamage(t, d){
  if (t.auxUnit && t.hp <= 0 && t.state === 'up'){ t.state = 'dead'; t.aux.n = Math.max(0, t.aux.n - 1); pop(t.x, t.y - 20, AUX[t.type].name.toUpperCase().split(' ').pop() + ' FALLS', '#ff8a7a'); }
}
function storyShot(s){
  for (const a of G.allies) if (a.state === 'up' && Math.hypot(a.x - s.x, a.y - 6 - s.y) < 12){ damageObjective(a, Math.max(1, damageRoll(s.dmg || 2, 0) - 1)); return true; }
  if (G.ledger && G.ledger.hp > 0 && Math.hypot(G.ledger.x - s.x, G.ledger.y - 10 - s.y) < 28 && s.at === G.ledger){ damageObjective(G.ledger, Math.max(1, damageRoll(s.dmg || 2, 0) - 1)); return true; }
  if (G.fordWagons && s.at && s.at !== G.ledger && G.fordWagons.includes(s.at) && s.at.hp > 0 && Math.hypot(s.at.x - s.x, s.at.y - 10 - s.y) < 28){ damageObjective(s.at, Math.max(1, damageRoll(s.dmg || 2, 0) - 1)); return true; }
  return false;
}
function extraCover(u){
  if (!G) return false;
  if (G.obj === 'siege'){ const cx = Math.floor(u.x / CELL), cy = Math.floor(u.y / CELL);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++){ const t = MAP.g[(cy + oy) * MAP.w + cx + ox]; if (t === T.PALISADE || t === T.WALL) return true; } }
  if (G.obj === 'night' && G.column){ if (G.contract.formation === 'woodland') return true; if (G.contract.formation === 'laager' && dist(u, G.column) < 6.5 * CELL) return true; if (G.smokeT > 0) return true; }
  return false;
}

/* ---------------------------------------------------------------------------
   AFTER A FIGHT
--------------------------------------------------------------------------- */
function storyDebrief(c, result, lines){
  const C = CP(), L = META.leader;
  // auxiliaries who fell are gone; empty squads disband
  C.aux = C.aux.filter(a => a.n > 0);
  // salvage, paid in Supply (Section 4.8, Quick Salvage in the campaign)
  const salv = Math.min(4, 1 + Math.floor(G.kills / 45));
  if (c.obj !== 'sortie'){ C.supply += salv; lines.push(`<p>Salvage: +${salv} Supply from the field.</p>`); }
  // the campaign advances the company after every fight survived (13.7, 14.9)
  if (result === 'fled' && L){ grantAdvancements(lines); if (c.obj === 'siege'){ L.ticks++; lines.push(`<p>${esc(L.name)} earns an XP tick even so (${L.ticks} / 3).</p>`); if (L.ticks >= 3){ L.ticks = 0; L.level = Math.min(11, L.level + 1); if (rowFor(L.spec, L.level)[2] === 'pick') META.pendingPicks++; lines.push(`<p class="good"><b>${esc(L.name)} reaches Level ${L.level}.</b></p>`); } } }   /* Index 35 */
  if (c.obj === 'sortie'){
    if (result === 'victory'){ const i = C.assault; C.intelRev[i] = Math.min(4, C.intelRev[i] + 2); C.supply += 1;
      lines.push(`<p class="good">Prisoners are brought in. Under questioning they give two lines of the next Intelligence Card. +1 Supply from their packs.</p>`); }
    C.lastFight = 'sortie'; return;
  }
  if (c.obj === 'siege'){
    for (const k in G.structs){ C.st[k].hp = Math.max(0, Math.round(G.structs[k].hp)); }
    for (const k in G.districts){ const was = C.district[k], now = G.districts[k].state;
      if (was !== now){ C.district[k] = now; lines.push(`<p class="${now === 'overrun' ? 'bad' : 'good'}"><b>${DISTRICTS[k].name}</b> is ${now === 'overrun' ? 'overrun: ' + DISTRICTS[k].lost : 'retaken.'}</p>`);
        if (k === 'mill' && now === 'overrun'){ C.supply -= 4; if (C.day < 8 && !C.cellar){ C.cellar = true; C.supply += 6; lines.push('<p>The Reeve opens his private cellar: +6 Supply. He will not do it twice, and he will mention it at every opportunity.</p>'); } } } }
    if (ASSAULTS[c.assault].win === 'gate' && C.st.ngate.hp <= 0 && C.district.market === 'held'){ C.district.market = 'overrun'; lines.push('<p class="bad">With the North Gate down, the enemy pours into the Market Square.</p>'); }
    const orsolt = G.enemies.find(e => e.k === 'orsolt' && !e.dead);
    if (orsolt && C.orsolt !== 'slain'){ C.orsolt = 'fled'; lines.push('<p class="bad">Orsolt the Hollow Reeve is still standing when the host draws off. He will be back.</p>'); }
    if (G.commandersDefeated.length && ASSAULTS[c.assault].waves.some(w => w[1].some(g => g[0].startsWith('orsolt'))) && C.orsolt !== 'fled') { C.orsolt = 'slain'; lines.push('<p class="good">Orsolt the Hollow Reeve is dead. Every levy that comes after will lose its frenzy.</p>'); }
    C.assault++; C.lastFight = 'assault';
    lines.push(`<p><b>Assault ${c.assault + 1} is over:</b> ${result === 'victory' ? (c.assault >= ASSAULTS.length - 1 || C.fallback || ASSAULTS[c.assault].keep ? 'the Keep holds.' : 'the town holds.') : 'the assault was lost.'}</p>`);
    if (C.assault >= ASSAULTS.length || C.st.kgate.hp <= 0 && (C.fallback || ASSAULTS[c.assault].keep)){ C.part = 'retreat'; C.siegeWon = result === 'victory' && C.st.kgate.hp > 0; }
    else if (!C.fallback && (C.st.ngate.hp <= 0 || Object.values(C.district).filter(s => s === 'overrun').length >= 2)) C.canFallBack = true;
  }
  if (c.obj === 'night'){
    if (result === 'fallen' || G.k49fallen){ G.colLoss += 3;   // QA pass3: K49 turns a Founding overrun into 'fled' (the Leader lives), but the column still pays
      lines.push('<p class="bad">The squad was overrun, and the column paid for it: Column Strength -3.</p>'); }
    G.colLoss = Math.min(G.colLoss || 0, Math.max(0, C.column | 0));   // Planner P5: the column can't lose more families than it has left
    C.column -= G.colLoss; G.colApplied = true; C.wagonHp = Math.max(0, Math.round(G.ledger.hp));
    lines.push(`<p><b>Night ${c.night}:</b> the column ${G.colLoss ? `lost ${G.colLoss}` : 'lost nobody'}. Column Strength is <b>${Math.max(0, C.column)}</b>.</p>`);
    if (G.fordWagons) fordLines(lines);
    const wrecked0 = C.wagonHp <= 0, NW = NIGHTS[c.night - 1];
    if (wrecked0 && NW.wagonStake){ G.wagonWrecked = true; for (const t of wreckWagon(C)) lines.push(t); }   // Long Road pass 1: a wreck on a stake night always costs, win or not
    else if (C.wagonHp <= 0 && result === 'victory'){ C.wagonHp = ROAD43.patch; lines.push(`<p class="bad">The Ledger Wagon was wrecked, but the night was won: it is patched together (${ROAD43.patch} of ${C.wagonMax || 100}) and nothing is lost.</p>`); }   // PD-43 S3
    if (C.wagonHp <= 0 && (C.slots || []).length){ const lost = C.slots.splice(Math.random() * C.slots.length | 0, 1)[0]; C.wagonHp = ROAD43.patch; lines.push(`<p class="bad">The Ledger Wagon is wrecked: the <b>${WAGON_SLOTS[lost].name}</b> is lost for good. The rest is patched together.</p>`); }
    { const st = stakeLines(c, C, result); for (const t of st) lines.push(`<p>${t}</p>`); }   // Long Road pass 1: what each night put at stake
    C.hired = false; C.lastFight = 'night';
    if (C.column <= 0) C.part = 'lost';
    else if (c.night >= NIGHTS.length) C.part = 'kalloon';
    if (!G.k49slain && !(result === 'fallen' && G.leaderSlain) && wipe48(C, result, G.k49fallen)) lines.push('<p class="bad">The whole squad went down. With nobody left to guard it, the column cannot go on: the Long Road ends here.</p>');
  }
}
/* Patrick Q48 (2026-11-16): the Leader stays safe on the whole road (K49 turns 'fallen' into 'fled'), but if the whole squad goes
   down on a road night the Long Road ends in the column-lost Parley (PD35), even on the last night. The column still pays its
   -3 and its ordinary losses first. Q48.on = false: the old retreat-and-continue. */
var Q48 = {on: true};
function wipe48(C, result, k49){
  if (Q48.on === false || !C || !(result === 'fallen' || k49)) return false;
  C.part = 'lost'; C.wiped48 = true; return true;
}
function retreatHTML(){
  const C = CP(), won = C.siegeWon, aux = C.aux.reduce((s, a) => s + a.n, 0), room = Math.max(0, rosterCap() - META.roster.length);
  return `<h2>${won ? 'Varnholt Stands' : 'Varnholt Falls'}</h2>
    <div class="desc" style="text-align:left">${won ? 'At the end of the last assault the Keep still stands, and the host draws back to lick its wounds. The Reeve pays what he promised.' : 'The Keep could not hold. In the smoke and the screaming the company gets the townsfolk out through the sally gate and onto the carts.'}</div>
    <div class="desc" style="text-align:left;margin-top:6px">Then a Dust Cloaks recruiter steps out of a teleportation circle with orders. Tarim has fallen. Forty thousand refugees are on the forest road to the Empire\u2019s lands, three weeks' road to the south-east, and the host follows a night behind. The company is wanted at the forest's edge by tomorrow night.</div>
    <div class="log" style="margin-top:8px"><p>${won ? '<b>+300gp</b> from the Reeve. <b>+1 Standing</b> with the Suderian Freemen.' : 'No pay. The column starts weaker: Column Strength 16 and Supply 8.'}</p>
    <p>Your Squad Leader, Squad Mates and gear come with you.${aux ? ` ${Math.min(aux, room)} of the ${aux} surviving townsfolk ${Math.min(aux, room) === 1 ? 'joins' : 'join'} the squad as Level 1 Squad Mates${aux > room ? ' (the rest stay with the refugees)' : ''}.` : ''}</p>
    <p>On the road there are no facilities and no Hiring Line. Recruits come from the refugees; gear comes from salvage and the Forge Cart.</p></div>
    <h3 style="margin:10px 0 4px">Fit the Ledger Wagon: choose three</h3>` +
    Object.entries(WAGON_SLOTS).map(([k, S]) => `<div class="line"><div class="grow"><b>${S.name}</b><br><span style="font-size:14px">${S.text}</span></div><button style="${(C.slotPick || []).includes(k) ? 'background:var(--ink-soft);color:#fff' : ''}" onclick="pickSlot('${k}')">${(C.slotPick || []).includes(k) ? 'Fitted' : 'Fit'}</button></div>`).join('') +
    `<button class="btn gold" ${(C.slotPick || []).length === 3 ? '' : 'disabled'} onclick="startRoad()">TO THE WAGONS</button>`;
}
function pickSlot(k){ const C = CP(); C.slotPick = C.slotPick || []; const i = C.slotPick.indexOf(k); if (i >= 0) C.slotPick.splice(i, 1); else if (C.slotPick.length < 3) C.slotPick.push(k); SFX.play('pick'); renderPanel(); }
function startRoad(){
  const C = CP(), won = C.siegeWon;
  if (won){ META.treasury += 300; shiftStanding('suderia', 1, null); }
  let aux = C.aux.reduce((s, a) => s + a.n, 0);
  while (aux-- > 0 && META.roster.length < rosterCap()) META.roster.push(makeMilitiaman());
  C.log = [];
  Object.assign(C, {part:'road', night:1, column:won ? 20 : 16, supply:won ? 12 : 8, aux:[], slots:C.slotPick, slotPick:null, wagonHp:100, wagonMax:100, formation:'laager', fallback:false, scouted:0});
  CAMP.cpMap = null; startRoadDay(); saveMeta(); SFX.play('horn'); renderTitle();
}
function startRoadDay(){
  const C = CP(); C.orders = ordersPerDay(); C.rerolled = false; C.scouted = 0;
  const eat = 2; C.supply -= eat; let news = [`The column eats: -${eat} Supply.`];
  if ((C.slots || []).includes('larder')){ C.supply++; news.push('The Larder: +1 Supply.'); }
  if (C.supply < 0){ C.column += C.supply; news.push(`<b>Hunger:</b> Column Strength ${C.supply}.`); C.supply = 0; }
  for (const p of META.roster) if (p.resting > 0) p.resting = (C.slots || []).includes('infirmary') ? 0 : p.resting - 1;
  const ev = ROAD_EVENTS[d6() - 1]; C.event = {t:ev.t, text:ev.text, choice:ev.choice || null, res:null, idx:ROAD_EVENTS.indexOf(ev)};
  if (ev.auto){ const r = ev.auto(); C.event.res = r || 'Done.'; }
  const g = NIGHTS[C.night - 1].ground; if (C.formation === 'woodland' && g !== 'forest') C.formation = 'laager'; if (C.formation === 'square' && g !== 'plain') C.formation = 'laager'; if (NIGHTS[C.night - 1].fordHold) C.formation = 'ford'; else if (C.formation === 'ford') C.formation = 'laager';
  C.dayNews = news; syncStoryFacilities();
}
function roadEventChoice(yes){
  const C = CP(), ev = ROAD_EVENTS[C.event.idx];
  if (yes){ if (!useOrder()) return SFX.play('nope'); ev.yes(); C.event.res = 'Done.'; } else { ev.no(); C.event.res = 'You let it go.'; }
  saveMeta(); refreshUI();
}
function storyAfterFight(){
  const C = CP(); if (!C) return;
  const n0 = C.night, was = C.part;
  if (C.lastFight === 'assault' && C.part === 'siege'){ C.lastFight = null; nextDay(); }
  else if (C.lastFight === 'night' && C.part === 'road'){ C.lastFight = null; C.night++; startRoadDay(); }
  else C.lastFight = null;
  // INT-1 stage 3 group 7: from campaign34, the F34 road day news after a road night
  try { const F = window.F34; if (F && F.roadOn && F.roadOn() && was === 'road' && C.part === 'road' && C.night === n0 + 1) F.roadDayNews(C, n0); } catch (e){ console.warn('F34 road day', e); }
  syncStoryFacilities(); saveMeta();
}
/* Long Road pass 1: one line per night's stake, from CAMPAIGN_LINES.stake (ND). No words for a key: no line, so Quick plays as before. */
function stakeLines(c, C, result){
  const N = NIGHTS[c.night - 1], T = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.stake) || {}, out = [], fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (m, k) => k in o ? o[k] : m), add = (k, o) => { if (T[k]) out.push(fill(T[k], o || {})); };
  const lost = G.colLoss || 0;
  if (N.stake === 'column') add(lost ? 'columnLost' : 'columnWhole', {n:lost});
  if (N.stake === 'knives'){ const n = G.knivesLeft | 0; add(n === 0 ? 'knivesAll' : n === 1 ? 'knives1' : 'knivesN', {n}); }
  if (N.stake === 'wagon' && !G.wagonWrecked && C.wagonHp > 0) add('wagonWhole', {hp:Math.round(C.wagonHp), max:C.wagonMax || 100});
  if (N.stake === 'devil' && G.devilRef) add(G.devilSlain ? 'devilFell' : 'devilLives');
  if (N.stake === 'phalanx') add(G.phalanxAt ? 'phalanxYes' : 'phalanxNo');
  if (N.stake === 'kalloon'){ const b = endingBand(Math.max(0, C.column)); add('kalloon', {cs:Math.max(0, C.column), band:b[0]}); }
  return out;
}
/* Long Road pass 1: a wrecked Ledger Wagon on a stake night costs a fitting, or 2 Supply when it has none; either way it is patched. Returns the debrief lines. */
function wreckWagon(C){
  const out = [], T = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.stake) || {};
  if ((C.slots || []).length){ const lost = C.slots.splice(Math.random() * C.slots.length | 0, 1)[0]; out.push(`<p class="bad">The Ledger Wagon is wrecked: the <b>${WAGON_SLOTS[lost].name}</b> is lost for good. The rest is patched together.</p>`); }
  else { C.supply = Math.max(0, C.supply - 2); out.push(`<p class="bad">${T.wagonNone || 'The Ledger Wagon is wrecked. It had no fitting to lose, so the repairs cost 2 Supply.'}</p>`); }
  C.wagonHp = ROAD43.patch; return out;
}
const artemisLines = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.artemis) || {};
function endingBand(cs){   // P23-ARTEMIS: tier words from CAMPAIGN_LINES.act45.artemis.tiers; the short prologue keeps its own thresholds (15 / 11 / 7)
  const T = artemisLines().tiers || {}, th = (typeof isFull === 'function' && !isFull()) ? [15, 11, 7] : [13, 9, 5];
  return cs >= th[0] ? ['Triumph', T.triumph || 'The column is whole. Lord Artemis thanks the company and rewards it richly.', 400] :
         cs >= th[1] ? ['Survival', T.survival || 'The column is smaller but whole. Lord Artemis thanks the company and rewards it fairly.', 250] :
         cs >= th[2] ? ['A Remnant', T.remnant || 'Lord Artemis rewards the company as he can.', 100] :
                       ['Ruin', T.ruin || 'A handful survive. Lord Artemis thanks the company, but coldly.', 0];
}
function endingHTML(){
  const C = CP(), cs = Math.max(0, C.column), E = endingBand(cs), A = artemisLines(), N = window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.stake || {};
  const sp = (E[2] ? A.speech : A.speechRuin) || A.speech || [];
  let face = ''; try { face = (typeof HERO_PORT !== 'undefined' && HERO_PORT.artemis) || (typeof heroPortraitURL === 'function' ? heroPortraitURL('artemis') : ''); } catch (e) {}
  try { if (window.F34 && F34.css1i) F34.css1i(); } catch (e) {}   // the speaker-row styles (.f34-sp) live with the story cards
  if (!document.getElementById('p23-art-css')){ const st = document.createElement('style'); st.id = 'p23-art-css';   // UX p23-artemis-layout: the ending takes the story-card width (640 at 1280, 760 at 1920) so the speech row and the band fit without scrolling
    st.textContent = '#camp-panel:has(.f34-sp[data-p23]){width:clamp(640px,calc(640px + (100vw - 1280px)*.1875),760px)}#camp-panel:has(.f34-sp[data-p23]) .log{font-size:clamp(15px,calc(15px + (100vw - 1280px)*.0031),17px)}#camp-panel:has(.f34-sp[data-p23]) .log{padding:6px 10px!important}#camp-panel:has(.f34-sp[data-p23]) .log p{margin:0 0 4px}#camp-panel:has(.f34-sp[data-p23]) .log p:last-child{margin-bottom:0}#camp-panel:has(.f34-sp[data-p23]) .f34-sp{margin:4px 0!important}#camp-panel:has(.f34-sp[data-p23]) .desc{margin-top:4px!important}#camp-panel:has(.f34-sp[data-p23]) .btn{margin:4px 0 0;min-height:44px!important;font-size:16px}'; document.head.appendChild(st); }
  const row = sp.length ? `<div class="f34-sp" data-p23="artemis"><div class="f34-face"><img src="${face}" alt=""><span>Artemis</span></div><div class="log sp">${sp.map(s => `<p><i>${esc(s)}</i></p>`).join('')}</div></div>` : '';
  return `<h2>Artemis\u2019s Lands: ${E[0]}</h2><div class="desc" style="text-align:left">Column Strength at the ford: <b>${cs}</b>.</div>${row}
    <div class="log" style="margin-top:8px"><p>${E[1]} ${E[2] ? `<b>+${E[2]} gp</b>.` : '<b>No pay</b>.'}</p>
    <p>${A.carryOn || 'Everyone who marched becomes your Chapter: your Leader, your Squad Mates and your gear.'}</p></div>
    <button class="btn gold" onclick="foundAfterStory(${E[2]})">${N.button || 'RIDE TO MARLBOROUGH'}</button>`;
}
function foundAfterStory(gold){
  const C = CP(); META.treasury += gold; C.part = 'founding'; saveMeta();
  openFound(); FD.fromStory = true;
}
const _finishFound = finishFound;
finishFound = function(){
  if (!(FD && FD.fromStory)) return _finishFound();
  META.master = {id:'CM', name:FD.name, race:FD.race, cls:FD.cls, spec:FD.spec, sex:FD.sex, chosen:true};
  META.holding = FD.holding; META.banner = Object.assign({}, BED); META.bannerSet = true; BED = null; FD = null;
  META.cp.part = 'done'; META.facilities = {}; META.deployments = Math.max(META.deployments, 1); META.board = null;
  applySkin(); saveMeta(); CAMP.cpMap = null; CAMP.dirty = true; renderTitle();
  centreCamOn(HUB.house.x, HUB.house.y); f51Pend = true; openPanel('house', 'house');
};
/* P23-ARTEMIS (ND f51open): Cayde speaks on the arrival at Marlborough Keep: the house panel opens with his box under the heading. f51open is an array of
   paragraphs (a string is still read). It shows once, on the founding hand-over only; closing or re-rendering the panel drops it. */
let f51Pend = false;   // set by the founding hand-over; the house panel shows the box on each render until it is closed
function f51openBox(){
  try {
    const P0 = $('camp-panel'); if (P0 && P0.querySelector('[data-p23="f51open"]')) return;
    const L = window.CAMPAIGN_LINES && CAMPAIGN_LINES.act45 && CAMPAIGN_LINES.act45.artemis, t = L && L.f51open, ps = (Array.isArray(t) ? t : (t ? [t] : [])).filter(Boolean), P = $('camp-panel'), h2 = P && P.querySelector('h2');
    if (!ps.length || !h2) return;
    try { if (window.F34 && F34.css1i) F34.css1i(); } catch (e) {}
    let face = ''; try { face = (window.F34 && F34.faceOf) ? F34.faceOf('Cayde') : ''; } catch (e) {}
    const box = document.createElement('div'); box.className = 'f34-sp'; box.setAttribute('data-p23', 'f51open');
    box.innerHTML = (face ? `<div class="f34-face"><img src="${face}" alt=""><span>Cayde</span></div>` : '') + '<div class="log sp">' + ps.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>';
    h2.insertAdjacentElement('afterend', box);
  } catch (e) { console.warn('f51open', e); }
}
{ const _rp = renderPanel, _cp = closePanel;
  renderPanel = function(){ const r = _rp.apply(this, arguments); if (f51Pend && CAMP.panel && CAMP.panel.kind === 'house') f51openBox(); else f51Pend = false; return r; };
  closePanel = function(){ f51Pend = false; return _cp.apply(this, arguments); }; }

/* ---------------------------------------------------------------------------
   THE CAMP SCREENS: Varnholt by day, the laager on the road
--------------------------------------------------------------------------- */
function storyCampMap(){
  const C = CP(), key = C.part + JSON.stringify(C.st) + JSON.stringify(C.district) + (C.night || 0) + (C.formation || '');
  if (CAMP.cpMap && CAMP.cpKey === key) return CAMP.cpMap;
  CAMP.cpKey = key;
  CAMP.cpMap = (C.part === 'road' || C.part === 'kalloon' || C.part === 'lost' || C.part === 'founding') ? generateNightMap(Math.min(NIGHTS.length, C.night || NIGHTS.length), C.formation || 'laager') : generateVarnholt({assault:C.assault});
  return CAMP.cpMap;
}
function storyPeople(){
  const C = CP(), M = MAP, out = [];
  const pts = C.part === 'road' ? [{x:M.column.x, y:M.column.y + 60}, {x:M.column.x - 120, y:M.column.y}, {x:M.column.x + 120, y:M.column.y + 20}, {x:M.ledger.x, y:M.ledger.y + 60}]
    : Object.values(DISTRICTS).filter((d, i) => d && C.district[Object.keys(DISTRICTS)[i]] === 'held').map(d => ({x:(d.at[0] + .5) * CELL, y:(d.at[1] + 2.5) * CELL}));
  return pts.length ? pts : [{x:(M.start.x + .5) * CELL, y:(M.start.y + .5) * CELL}];
}
const _campSync = campSync;
campSync = function(){
  if (!inStory()) return _campSync();
  storyCampMap();
  CAMP.dirty = false;
  const want = [{id:'master', kind:'master', p:ensureMaster()}];
  if (META.leader) want.push({id:'L', kind:'leader', p:META.leader});
  for (const p of META.roster) want.push({id:'m' + p.id, kind:'mate', p});
  const C = CP(), folkN = C.part === 'road' ? 8 : 10;
  for (let i = 0; i < folkN; i++) want.push({id:'f' + i, kind:'folk', p:{race:C.part === 'road' ? ['SUN_ELF','GREY_ELF','HALF_ELF','DARK_ELF'][i % 4] : ['HUMAN','HUMAN','DWARF','HALFLING','HALF_ORC'][i % 5], spec:'PLAIN', name:'folk' + i, id:'fk' + i, sex:i % 2 ? 'f' : 'm'}});
  const old = new Map(CAMP.people.map(q => [q.id, q])), wp = storyPeople();
  CAMP.people = want.map(w => { const o = old.get(w.id); if (o && o.cpPart === C.part){ o.p = w.p; o.kind = w.kind; return o; }
    const s = wp[Math.random() * wp.length | 0]; return Object.assign(w, {x:s.x + rnd(-40, 40), y:s.y + rnd(-30, 30), tx:s.x, ty:s.y, wait:rnd(0, 200), left:false, moving:false, seed:Math.random() * 10 | 0, cpPart:C.part}); });
};
const _updatePeople = updatePeople;
updatePeople = function(){
  if (!inStory()) return _updatePeople();
  storyCampMap(); MAP = CAMP.cpMap;
  if (CAMP.dirty) campSync();
  const wp = storyPeople();
  for (const q of CAMP.people){
    q.role = q.p.resting > 0 ? 'rest' : 'wander';
    if (Math.hypot(q.tx - q.x, q.ty - q.y) < 3 && --q.wait <= 0){ const s = wp[Math.random() * wp.length | 0]; q.tx = s.x + rnd(-50, 50); q.ty = s.y + rnd(-30, 30); q.wait = rnd(90, 300); }
    const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy), sp = q.kind === 'folk' ? 0.6 : 0.8;
    q.moving = d > 2.5; if (q.moving){ q.x += dx / d * Math.min(sp, d); q.y += dy / d * Math.min(sp, d); if (Math.abs(dx) > 0.3) q.left = dx < 0; }
    collide(q, 8, true);
    /* QA5 2026-11-14: folk walk straight at a far waypoint and have no pathing, so a roof corner or wall traps them for good (3000 frames pressed in the story camp). Moved under 4 px in 60 frames while walking: pick a new waypoint. */
    if ((q.stuck = (q.stuck || 0) + 1) >= 60){ q.stuck = 0; if (q.moving && q.sxy && Math.hypot(q.x - q.sxy[0], q.y - q.sxy[1]) < 4){ const s = wp[Math.random() * wp.length | 0]; q.tx = s.x + rnd(-50, 50); q.ty = s.y + rnd(-30, 30); q.wait = rnd(90, 300); } q.sxy = [q.x, q.y]; }
  }
};
const _clampCam = clampCam;
clampCam = function(){
  if (!inStory()) return _clampCam();
  const M = CAMP.cpMap; if (!M) return;
  const W = M.w * CELL, H = M.h * CELL;
  CAMP.cam.x = Math.max(-40, Math.min(W - VW + 40, CAMP.cam.x)); CAMP.cam.y = Math.max(-60, Math.min(H - VH + 40, CAMP.cam.y));
};
const _drawCamp = drawCamp;
drawCamp = function(){
  if (!inStory()) return _drawCamp();
  const M = storyCampMap(); MAP = M;
  const cx = Math.round(CAMP.cam.x), cy = Math.round(CAMP.cam.y), C = CP(), t = CAMP.t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#16130f'; ctx.fillRect(0, 0, VW, VH);
  ctx.save(); ctx.translate(-cx, -cy);
  const keep = G; G = {frame:t, bgPat:CAMP.cpPat}; try { drawTerrain(cx, cy); } finally { CAMP.cpPat = G.bgPat; G = keep; }
  const L = [], hv = CAMP.hover;
  for (const tr of M.trees) if (tr.x > cx - 60 && tr.x < cx + VW + 60 && tr.y > cy - 20 && tr.y < cy + VH + 90) L.push({y:tr.y, tr});
  for (const q of CAMP.people) L.push({y:q.y, q});
  if (window.VO2 && VO2.campItems) for (const it of VO2.campItems(cx, cy)) L.push({y:it.y, vo2:it});   /* VO2-CAMP: 3D buildings, walls, tents and trees (js/3d/vo2.js) */
  if (C.part === 'road' || M.column){
    ctx.fillStyle = 'rgba(240,220,160,.12)'; ctx.beginPath(); ctx.arc(M.column.x, M.column.y, M.column.r, 0, TAU); ctx.fill();
    for (const rf of M.refugees) L.push({y:rf.y, rf});
    for (const wg of M.wagons) L.push({y:wg.y, wg});
    L.push({y:M.ledger.y, ledger:true}); L.push({y:(M.camp || M.column).y + 40, fire:true});
  } else {
    for (const k in STRUCTS){ const S = STRUCTS[k], s = C.st[k]; L.push({y:S.face[1] * CELL, st:k}); }
    for (const k in DISTRICTS){ L.push({y:-1e9, dist:k, area:true}); L.push({y:1e9, dist:k}); }
    L.push({y:23.5 * CELL, fire:true, at:{x:28 * CELL, y:23.5 * CELL}});
  }
  L.sort((a, b) => a.y - b.y);
  for (const it of L){
    if (it.vo2){ VO2.drawCampItem(it.vo2); continue; }   /* VO2-CAMP */
    if (it.tr){ if (!(typeof w3dTree === 'function' && w3dTree(it.tr, CAMP.t))) PROPS3D.campTree(it.tr, CAMP.t); continue; }   /* Index 67 */
    if (it.rf){ drawUnit3(it.rf, personSpriteK('ref:' + it.rf.p.name + it.rf.p.race, it.rf.p), it.rf.x, it.rf.y, 2, 0, it.rf.left, false); continue; }   /* Index 74 */
    if (it.wg){ if (!w3dWagon(it.wg.x, it.wg.y, it.wg.x < M.column.x, 2.6, false)) PROPS3D.wagonAt(it.wg.x, it.wg.y, it.wg.x < M.column.x, 2.6); continue; }   /* Index 74 */
    if (it.ledger){ const hot = hv && hv.kind === 'ledger'; if (hot){ ctx.save(); ctx.filter = 'brightness(1.25)'; } if (!w3dWagon(M.ledger.x, M.ledger.y, false, 3.4, false)) PROPS3D.wagonAt(M.ledger.x, M.ledger.y, false, 3.4); if (hot) ctx.restore();   /* Index 74 */
      if (!w3dChBanner(M.ledger.x + 46, M.ledger.y - 7, 2.6)) PROPS3D.campBanner(M.ledger.x + 46, M.ledger.y - 7, 2.6);
      if (hot) campLabel(M.ledger.x, M.ledger.y - 80, 'The Ledger Wagon', (C.slots || []).map(s => WAGON_SLOTS[s].name).join(', ') || 'The Treasury and the ledger'); continue; }
    if (it.fire){ const at = it.at || {x:M.column.x, y:M.column.y + 40}; if (!(typeof w3dDraw === 'function' && w3dDraw('campfire', at.x, at.y + 12, {t}))) PROPS3D.campFire(at.x, at.y, t); continue; }   /* Index 76 */
    if (it.st){ const k = it.st, S = STRUCTS[k], s = C.st[k], x = S.face[0] * CELL, y = S.face[1] * CELL;
      if (s.hp > 0 && S.gate) drawGateHouse(k, false, s.hp / s.max);
      const bw = 70, top = y - 26; ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x - bw / 2 - 1, top - 1, bw + 2, 7);
      ctx.fillStyle = s.hp <= 0 ? '#5a2a2a' : s.hp > s.max * 0.35 ? '#c8a070' : '#e0503a'; ctx.fillRect(x - bw / 2, top, bw * Math.max(0, s.hp / s.max), 5);
      ctx.fillStyle = s.hp <= 0 ? '#ff8a7a' : '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 10) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(S.name.toUpperCase() + (s.hp <= 0 ? ' (FALLEN)' : ''), x, top - 3); continue; }
    if (it.dist){ const k = it.dist, D = DISTRICTS[k], x = (D.at[0] + .5) * CELL, y = (D.at[1] + .5) * CELL, r = D.r * CELL, over = C.district[k] === 'overrun' || (C.fallback && k !== 'keep'), hot = hv && hv.kind === 'district' && hv.id === k;
      if (it.area){ ctx.globalAlpha = window.VO3 && VO3.on && VO3.hazeAlpha ? VO3.hazeAlpha(over, hot) : hot ? 0.3 : (window.VO2 && VO2.campNow && VO2.campNow() ? 0.08 : 0.16);   /* VO3: no gold disc over a held district */ ctx.fillStyle = over ? '#c03020' : '#d4af37';   /* VO2-COLOUR: a fainter gold haze over the painted town */ ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; continue; }
      if (over) for (let i = 0; i < 4; i++){ const fx = x + Math.cos(i * 1.7) * r * 0.5, fy = y + Math.sin(i * 2.3) * r * 0.4;   /* Index 76 */
        if (!(typeof w3dFlames === 'function' && w3dFlames(fx, fy, t + i * 17))) PROPS3D.flame(fx, fy); }
      ctx.fillStyle = 'rgba(20,14,8,.7)'; const dp = window.canvasPx106 ? canvasPx106(ctx, 14) : 14; ctx.font = 'bold ' + dp.toFixed(1) + 'px Georgia'; const lab = D.name.toUpperCase(), lw = ctx.measureText(lab).width + 16; ctx.fillRect(x - lw / 2, y + 8 - dp - 4, lw, dp + 6);
      ctx.fillStyle = over ? '#ff8a7a' : '#ffe9b0'; ctx.textAlign = 'center'; ctx.fillText(lab, x, y + 3);
      { const hp = window.canvasPx106 ? canvasPx106(ctx, 11) : 14; ctx.font = hp.toFixed(1) + 'px Georgia'; ctx.fillStyle = over ? '#ff8a7a' : '#c8e8b0'; ctx.fillText(over ? 'OVERRUN' : 'HELD', x, y + 9 + hp); } continue; }
    const q = it.q, spr = q.kind === 'master' ? masterSprite() : personSprite(q.p, q.kind === 'leader'), hot = hv && hv.kind === 'person' && hv.id === q.id;
    if (q.kind === 'folk'){ drawSprite(personSpriteK('folk:' + q.p.name + q.p.race, q.p), q.x, q.y, 2.2, q.moving ? 1 + ((t + q.seed * 7) / 9 | 0) % 2 : 0, q.left, false); continue; }
    if (q.kind === 'master' || q.kind === 'scribe' || hot){ ctx.beginPath(); ctx.ellipse(q.x, q.y + 17, 15, 5, 0, 0, TAU);   /* Index 30 */ ctx.strokeStyle = q.kind === 'master' ? '#5aa0e0' : '#ffd860'; ctx.lineWidth = 2; ctx.stroke(); }
    drawSprite(spr, q.x, q.y, 2.4, q.moving ? 1 + ((t + q.seed * 7) / 9 | 0) % 2 : 0, q.left, false);
    if (hot) campLabel(q.x, q.y - 40, q.p.name, q.kind === 'master' ? (C.part === 'road' ? 'The Dust Cloaks recruiter' : 'The Reeve of Varnholt') : q.kind === 'leader' ? 'Squad Leader' : SPECS[q.p.spec].name);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, C.part === 'road' ? 'rgba(0,0,20,.55)' : 'rgba(20,10,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
};
const _campHit = campHit;
campHit = function(wx, wy){
  if (!inStory()) return _campHit(wx, wy);
  for (const q of CAMP.people.slice().sort((a, b) => b.y - a.y)) if (q.kind !== 'folk' && Math.hypot(q.x - wx, q.y - 6 - wy) < 22) return {kind:'person', id:q.id, q};
  const M = CAMP.cpMap, C = CP();
  if (M.ledger && Math.hypot(M.ledger.x - wx, M.ledger.y - 30 - wy) < 60) return {kind:'ledger', id:'ledger'};
  if (C.part === 'siege') for (const k in DISTRICTS){ const D = DISTRICTS[k]; if (Math.hypot((D.at[0] + .5) * CELL - wx, (D.at[1] + .5) * CELL - wy) < D.r * CELL) return {kind:'district', id:k}; }
  return null;
};

/* ---------------------------------------------------------------------------
   PANELS AND THE TOP BAR
--------------------------------------------------------------------------- */
function intelHTML(){
  const C = CP(), i = C.assault, A = ASSAULTS[i]; if (!A) return '';
  const lab = ['Direction', 'Strength', 'Target', 'Surprise'], n = C.intelRev[i];
  return `<div class="advbox" style="margin:6px 0"><b>Intelligence Card, Assault ${i + 1}: ${A.name}</b> (${A.when})<br>` +
    lab.map((l, j) => `<span style="font-size:14px">${l}: ${j < n ? `<b>${A.intel[j]}</b>` : '<i style="color:#8a7a62">unknown, scout or take prisoners</i>'}</span>`).join('<br>') +
    `<br><span style="font-size:14px;color:var(--blood)">${A.rule}</span></div>`;
}
function storyDayHTML(){
  const C = CP(), A = nextAssault(), assaultToday = A && A.day === C.day;
  let h = `<h2>${C.part === 'siege' ? `Day ${C.day} of ${lastDay()}` : `Night ${C.night} of ${NIGHTS.length}`}</h2>`;
  if (C.dayNews) h += `<div class="desc" style="text-align:left">${C.dayNews.join(' ')}</div>`;
  if (C.part === 'siege'){
    h += `<div class="desc" style="text-align:left"><b>Supply ${C.supply}</b> \u00b7 Treasury ${META.treasury}gp \u00b7 Auxiliaries: ${C.aux.map(a => `${a.n} ${AUX[a.type].name}`).join(', ') || 'none'}</div>`;
    h += A ? (assaultToday ? `<div class="desc" style="color:#9a2a14;text-align:left;margin-top:4px"><b>The assault comes today, ${A.when.split(', ')[1] || ''}.</b></div>` : `<div class="desc" style="text-align:left">Next assault: <b>${A.name}</b>, ${A.when}.</div>`) : '';
    h += intelHTML();
    if (C.canFallBack && !C.fallback) h += `<div class="advbox" style="border-color:#9a2a14"><b>Fall back to the Keep?</b> Two districts are lost or the North Gate is down. Fall back, and every assault from now is fought from the Keep, with every district outside it lost.<br><button onclick="CP().fallback=true;CP().canFallBack=false;for (const k in CP().district) if (k!=='keep') CP().district[k]='overrun';syncStoryFacilities();saveMeta();refreshUI()">Fall back to the Keep</button> <button onclick="CP().canFallBack=false;refreshUI()">Hold the town</button></div>`;
    h += `<h3 style="margin:8px 0 2px">Work Orders: ${C.orders} left today</h3>`;
    const btn = (id, name, text, ok = true, why = '') => `<div class="line"><div class="grow"><b>${name}</b><br><span style="font-size:14px">${text}${!ok && why ? ` <i style="color:#8b0000">(${why})</i>` : ''}</span></div><button ${ok && C.orders > 0 ? '' : 'disabled'} onclick="workOrder('${id}')">Order</button></div>`;
    const hasCleric = META.leader.spec === 'CLERIC' || META.roster.some(p => p.spec === 'CLERIC');
    h += btn('rally', 'Rally the Town', `Personality against ${C.district.market === 'held' && !C.fallback ? 4 : 6}. Full: 6 Levy and a Veteran Militiaman. Partial: 3 Levy. 1 Supply per 3 fed.`);
    h += btn('train', 'Train', 'Drill a Levy squad into Militia. 1 Supply.', C.aux.some(a => a.type === 'levy') && C.supply >= 1, 'needs a Levy squad and 1 Supply');
    h += btn('pray', 'Pray', 'A Cleric leads the prayers: the next fight starts Blessed (+2 Ward Tokens, +1 step for 30 seconds).', hasCleric, 'needs a Cleric');
    h += btn('scrounge', 'Scrounge', 'Ranged or Personality against 5. Full: +4 Supply. Partial: +2 and a Squad Mate hurt.');
    h += btn('scout', 'Scout', 'Against 5. Full: two lines of the Intelligence Card. Partial: one.');
    h += btn('tend', 'Tend the Wounded', 'Every resting Squad Mate is fit to fight.');
    h += btn('munitions', 'Craft Munitions', '3 Burners and Smoke Pots for the next fight. 30gp.', META.treasury >= 30, 'needs 30gp');
    h += `<div class="line"><div class="grow"><b>Craft Gear at the Forge</b><br><span style="font-size:14px">Metal armour and weapons from the Quartermaster: one Work Order per 100gp.${C.district.smithy !== 'held' || C.fallback ? ' <i style="color:#8b0000">(Smithy Row is lost)</i>' : ''}</span></div><button ${C.district.smithy === 'held' && !C.fallback ? '' : 'disabled'} onclick="openCamp()">Forge</button></div>`;
    h += btn('sortie', 'Sortie', 'Fight a band of enemy foragers outside the walls. Prisoners give two lines of intelligence.', C.day >= 2, 'from Day 2');
    h += `<div class="desc" style="text-align:left;margin-top:6px"><b>Fortify</b> (one Work Order each)</div>`;
    for (const F of FORTIFY){
      const cost = F.cost.supply ? F.cost.supply + ' Supply' : F.cost.gold + 'gp';
      let targets = [];
      if (F.pick === 'damaged') targets = Object.keys(STRUCTS).filter(k => C.st[k].hp > 0 && C.st[k].hp < C.st[k].max && (!STRUCTS[k].keep || C.fallback || C.assault >= 5));
      if (F.pick === 'fallen') targets = Object.keys(STRUCTS).filter(k => C.st[k].hp <= 0 && !STRUCTS[k].gate);
      if (F.pick === 'gate') targets = Object.keys(STRUCTS).filter(k => STRUCTS[k].gate && C.st[k].hp > 0 && C.st[k].max < (STRUCTS[k].max + 8) * HPX);
      const ok = (F.id !== 'murder' || C.fallback || C.assault >= 5) && (!F.pick || targets.length) && C.orders > 0 && (F.cost.supply ? C.supply >= F.cost.supply : META.treasury >= F.cost.gold);
      h += `<div class="line"><div class="grow"><b>${F.name}</b> (${cost})<br><span style="font-size:14px">${F.text}</span></div><div class="mini" style="flex-direction:column">${F.pick ? targets.map(k => `<button ${ok ? '' : 'disabled'} onclick="fortify('${F.id}','${k}')">${STRUCTS[k].name}</button>`).join('') || '<span style="font-size:14px">nothing to do</span>' : `<button ${ok ? '' : 'disabled'} onclick="fortify('${F.id}')">Order</button>`}</div></div>`;
    }
    if (C.aux.some(a => a.n < 6)){ const need = C.aux.reduce((s, a) => s + (6 - a.n), 0), cost = Math.ceil(need / 3);
      h += `<div class="line"><div class="grow"><b>Refill the Auxiliaries</b> (no Work Order)<br><span style="font-size:14px">${need} places, ${cost} Supply.</span></div><button ${C.supply >= cost ? '' : 'disabled'} onclick="for (const a of CP().aux) a.n=6; CP().supply-=${cost}; saveMeta(); refreshUI()">Refill</button></div>`; }
    h += `<button class="btn gold" onclick="endDay()">${assaultToday ? 'FACE THE ASSAULT' : 'END THE DAY'}</button>`;
  } else {
    const N = NIGHTS[C.night - 1];
    h += `<div class="desc" style="text-align:left"><b>Column Strength ${C.column}</b> \u00b7 <b>Supply ${C.supply}</b> \u00b7 Treasury ${META.treasury}gp \u00b7 Ledger Wagon ${C.wagonHp} / ${C.wagonMax}<br>Auxiliaries: ${C.aux.map(a => `${a.n} ${AUX[a.type].name}`).join(', ') || 'none'}${C.hired ? ', and hired sellswords for tonight' : ''}</div>`;
    if (C.event) h += `<div class="advbox"><b>On the road: ${C.event.t}</b><br><span style="font-size:14px">${C.event.text}</span>${C.event.res ? `<br><i style="font-size:14px">${C.event.res}</i>` : C.event.choice ? `<br><button onclick="roadEventChoice(true)" ${C.orders > 0 ? '' : 'disabled'}>${C.event.choice}</button> <button onclick="roadEventChoice(false)">Let it go</button>` : ''}</div>`;
    h += `<div class="advbox"><b>Tonight: ${N.place}</b> (${N.ground})<br><span style="font-size:14px">${C.scouted >= 2 ? `<b>Force:</b> ${N.force.map(f => GROUPS[f[0]].n + ' ' + BESTIARY[GROUPS[f[0]].k].name).join(', ')}.<br><b>Complication:</b> ${N.comp}` : C.scouted === 1 ? `<b>Seen on the road:</b> ${BESTIARY[GROUPS[N.force[0][0]].k].name}. The rest is unknown.` : '<i>Unknown: Scout to find out.</i>'}</span></div>`;
    h += `<h3 style="margin:8px 0 2px">Day Actions: ${C.orders} left</h3>`;
    const btn = (id, name, text, ok = true, why = '') => `<div class="line"><div class="grow"><b>${name}</b><br><span style="font-size:14px">${text}${!ok && why ? ` <i style="color:#8b0000">(${why})</i>` : ''}</span></div><button ${ok && C.orders > 0 ? '' : 'disabled'} onclick="workOrder('${id}')">Act</button></div>`;
    const diff = N.ground === 'forest' ? 4 : N.ground === 'foothills' ? 5 : 6, hasCleric = META.leader.spec === 'CLERIC' || META.roster.some(p => p.spec === 'CLERIC');
    h += btn('forage', 'Forage', `Against ${diff} here. Full: +3 Supply. Partial: +1 and a Squad Mate hurt. Miss: ${firstCinderNight() ? `from Night ${firstCinderNight()}, ` : ''}Cinderlings follow you back.`);
    h += btn('scout', 'Scout', "Against 5. Full: tonight's whole force and complication. Partial: the first unit. Either way, an extra Preparation Round.");
    h += btn('recruit', 'Recruit', 'Personality against 5 among the refugees. Full: an auxiliary squad and two Squad Mates. Partial: 3 Volunteers. 1 Supply each.');
    h += btn('tend', 'Tend', 'Every resting Squad Mate is fit to fight.');
    h += btn('pray', 'Pray', 'A Cleric leads the prayers: tonight starts Blessed.', hasCleric, 'needs a Cleric');
    h += btn('parley', 'Recruit a band', 'Personality against 5: hire passing sellswords for tonight (3 Supply and 40gp, or 5 Supply).');
    h += btn('repair', 'Repair the Wagon', '1 Supply: +40.', C.wagonHp < C.wagonMax && C.supply >= 1, 'not needed');
    h += `<div class="line"><div class="grow"><b>Craft</b><br><span style="font-size:14px">${(C.slots || []).includes('forge') ? 'The Forge Cart: metal gear too.' : 'Salvaged materials: light gear only.'} One action per 100gp; Supply may stand in for gold.</span></div><button ${C.orders > 0 ? '' : 'disabled'} onclick="openCamp()">Craft</button></div>`;
    h += `<h3 style="margin:8px 0 2px">Make Camp</h3>` + (N.fordHold ? [['ford', 'The Ford', 'The wagons start across when the fight begins. Before then, the squad can cross and set traps on the east bank.', true]] : [['laager', 'Wagon Laager', 'Any ground. The wagon ring gives cover to the squad inside it.', true], ['woodland', 'Woodland Redoubt', 'Forest only. Everyone has cover, and nobody sees far.', N.ground === 'forest'], ['square', 'Open Square', 'Plains only. No cover, but the squad shoots further and harder.', N.ground === 'plain']])
      .map(([k, n, t, ok]) => `<div class="line"><div class="grow"><b>${n}</b><br><span style="font-size:14px">${t}</span></div><button ${ok ? '' : 'disabled'} style="${C.formation === k ? 'background:var(--ink-soft);color:#fff' : ''}" onclick="CP().formation='${k}';CAMP.cpMap=null;saveMeta();refreshUI()">${C.formation === k ? 'Chosen' : 'Choose'}</button></div>`).join('');
    h += `<button class="btn gold" onclick="launchNight()">NIGHTFALL: DEFEND THE COLUMN</button>`;
  }
  if (C.log.length) h += `<div class="desc" style="text-align:left;margin-top:8px;border-top:1px solid #c9bba4;padding-top:4px">${C.log.map(t => `<div style="font-size:14px;margin:2px 0">${t}</div>`).join('')}</div>`;
  return h;
}
function districtHTML(k){
  const C = CP(), D = DISTRICTS[k], over = C.district[k] === 'overrun' || (C.fallback && k !== 'keep');
  return `<h2>${D.name}</h2><div class="tag">${over ? 'Overrun' : 'Held'}</div><div class="desc" style="text-align:left;margin-top:6px"><b>While held:</b> ${D.held}</div><div class="desc" style="text-align:left"><b>If overrun:</b> ${D.lost}</div>
    ${over ? '<div class="desc" style="text-align:left;color:#8b0000">Retake it in an assault: end a round inside it, In Formation, with no enemy present.</div>' : ''}
    ${k === 'market' && marketOpen() ? '<button class="btn gold" onclick="openCamp()">THE MARKET</button>' : ''}`;
}
const _renderPanel = renderPanel;
renderPanel = function(){
  const P = CAMP.panel; if (!P) return;
  const own = {cpday:storyDayHTML, cpmuster:storyMusterHTML, cpkit:() => `<h2>The Charter Kit</h2><div class="desc" style="text-align:left">The Reeve has opened the town's purse: <b>${META.treasury}gp</b> between the Chapter, the Reeve's town works and your Standard Charter Kit. Arm the squad at the Market first. Gear bought now ignores facility requirements; after today, metal must be forged at Smithy Row.</div><button class="btn" onclick="openCamp()">THE MARKET</button><button class="btn gold" onclick="startSiege()">BEGIN THE SIEGE</button>`,
    district:() => districtHTML(P.id), cpretreat:retreatHTML, cpend:endingHTML,
    cplost:() => `<h2>The Column Is Lost</h2><div class="desc" style="text-align:left">The last of the refugees are ridden down short of the ford. The campaign ends here.</div><button class="btn gold" onclick="newStory()">BEGIN AGAIN</button><button class="btn small" onclick="leaveStory()">MAIN MENU</button>`,
    ledger:() => `<h2>The Ledger Wagon</h2><div class="desc" style="text-align:left">It carries the Treasury and the ledger, and travels with the column. ${CP().wagonHp} / ${CP().wagonMax}. If it is wrecked on a night you flee or fall, one fitting is lost for good; on a won night it is only patched.</div>` + (CP().slots || []).map(s => `<div class="line"><div class="grow"><b>${WAGON_SLOTS[s].name}</b><br><span style="font-size:14px">${WAGON_SLOTS[s].text}</span></div></div>`).join('')};
  if (!inStory() || !own[P.kind]) return _renderPanel();
  $('camp-panel').innerHTML = '<button class="x" onclick="closePanel()" title="Close">&#215;</button>' + own[P.kind]();
};
const _renderTopbar = renderTopbar;
renderTopbar = function(){
  if (!inStory()) return _renderTopbar();
  const C = CP();
  $('topbar').innerHTML = `<span class="brand">Grey Cloaks</span>
    ${C.part === 'road' ? `<span class="stat">Night <b>${C.night} / ${NIGHTS.length}</b></span><span class="stat">Column <b>${C.column}</b></span>` : `<span class="stat">Day <b>${C.day} / ${lastDay()}</b></span>`}
    <span class="stat">Supply <b>${C.supply}</b></span><span class="stat">Treasury <b>${META.treasury}gp</b></span>
    <span class="grow"></span>
    <button class="tb gold" onclick="storyOpenMain()">${C.part === 'road' ? 'THE ROAD' : 'WORK ORDERS'}</button>
    <button class="tb" onclick="openRoster()" ${META.leader ? '' : 'disabled'}>ROSTER</button>
    ${marketOpen() || C.part === 'road' ? `<button class="tb" onclick="openCamp()">${C.part === 'road' ? 'CRAFT' : 'MARKET'}</button>` : ''}
    <button class="tb" onclick="openScribeBook()" title="The Chronicle: the Scribe's book of history and rules (M)">CHRONICLE</button>
    <button class="tb" onclick="openPortraitStudio()">PORTRAITS</button>
    <button class="tb" onclick="toggleSettings()">SETTINGS</button>
    <button class="tb" onclick="leaveStory()">MAIN MENU</button>`;
};
function storyOpenMain(){
  const C = CP(), M = storyCampMap();
  const k = {create:null, kit:'cpkit', muster:'cpmuster', siege:'cpday', road:'cpday', retreat:'cpretreat', kalloon:'cpend', lost:'cplost'}[C.part];
  if (k) openPanel(k, k);
}
const _renderTitle = renderTitle;
renderTitle = function(){
  if (!inStory()) return _renderTitle();
  const C = CP();
  if (!META.leader){ if (C.part === 'create' || C.part === 'muster' || C.part === 'kit'){ openCreate(); return; } }
  if (C.part === 'create' && META.leader){ C.part = 'muster'; saveMeta(); }
  if ($('tb-settings')) $('tb-settings').remove();
  hideAll(); closePanel();
  $('topbar').classList.remove('hidden'); $('camp-hint').classList.remove('hidden');
  storyCampMap(); MAP = CAMP.cpMap; CAMP.dirty = true;
  renderTopbar(); startCamp();
  const M = CAMP.cpMap; centreCamOn(M.column ? M.column.x : 24.5 * CELL, M.column ? M.column.y : 22 * CELL);
  storyOpenMain();
};
const _openTable = openTable; openTable = f => inStory() ? storyOpenMain() : _openTable(f);
const _hiringHTML = hiringHTML; hiringHTML = () => inStory() ? '<div class="desc" style="text-align:left">No sellswords for hire here. Recruits come from Rally the Town in Varnholt and from the refugees on the road.</div>' : _hiringHTML();
const _rollRaid = rollRaid; rollRaid = (c, l) => inStory() || (META.cp && META.cp.part === 'done' && META.deployments < 3) ? null : _rollRaid(c, l);
const _leaveDebrief = leaveDebrief; leaveDebrief = function(){ if (inStory()){ G = null; storyAfterFight(); if (!META.leader && !META.roster.length){ CP().part = 'lost'; } renderTitle(); return; } _leaveDebrief(); };
// The Quartermaster in the campaign: the Market for ordinary gear, the Forge for metal, Work Orders for crafting.
const _gearClick = gearClick;
gearClick = function(id){
  if (!inStory()) return _gearClick(id);
  const C = CP(), g = gear(id);
  if (META.gear.owned.includes(id)) return _gearClick(id);
  if (C.part === 'kit'){ const keep = META.facilities; META.facilities = {blacksmith:true, carpentry:true, leather:true, stables:true, barracks:true, magetower:true, engineering:true}; _gearClick(id); META.facilities = keep; syncStoryFacilities(); saveMeta(); renderCamp(); return; }
  const metal = g.req.includes('blacksmith'), other = g.req.some(r => r !== 'blacksmith');
  if (other) return SFX.play('nope');
  if (C.part === 'siege'){
    if (!metal && !marketOpen()) return SFX.play('nope');
    if (metal){ const n = Math.max(1, Math.ceil(gearPrice(g) / 100)); if (C.district.smithy !== 'held' || C.fallback || C.orders < n || META.treasury < gearPrice(g)) return SFX.play('nope'); C.orders -= n; cpLog(`Forge: ${g.name} (${n} Work Order${n > 1 ? 's' : ''}).`); }
    return _gearClick(id);
  }
  if (C.part === 'road'){
    if (metal && !(C.slots || []).includes('forge')) return SFX.play('nope');
    const price = gearPrice(g), n = Math.max(1, Math.ceil(price / 100));
    if (C.orders < n) return SFX.play('nope');
    let gold = Math.min(META.treasury, price), sup = Math.ceil((price - gold) / 25);
    if (sup > C.supply) return SFX.play('nope');
    C.orders -= n; C.supply -= sup; META.treasury -= gold; ARM.add(id);   /* INDEX A30 */
    if (g.slot === 'kit'){ if (META.gear.kits.length >= 2) META.gear.kits.shift(); META.gear.kits.push(id); } else META.gear[g.slot] = id;
    cpLog(`Craft: ${g.name}${sup ? ` (${sup} Supply in place of gold)` : ''}.`); saveMeta(); renderCamp(); return;
  }
};
const _gearPrice = gearPrice; gearPrice = g => inStory() && CP().part === 'kit' ? g.cost : _gearPrice(g);
const _renderCamp = renderCamp;
renderCamp = function(){
  if (!inStory()) return _renderCamp();
  const C = CP(), keep = META.facilities; if (C.part === 'kit') META.facilities = {blacksmith:true, carpentry:true, leather:true, stables:true, barracks:true, magetower:true, engineering:true};
  _renderCamp(); META.facilities = keep; syncStoryFacilities();
  const note2 = C.part === 'kit' ? 'Founding purchases: every card is open to you today.' : C.part === 'siege' ? `${marketOpen() ? 'The Market sells ordinary gear.' : 'The Market is closed.'} ${C.district.smithy === 'held' && !C.fallback ? `Metal is forged at Smithy Row: one Work Order per 100gp (${C.orders} left today).` : 'Smithy Row is lost.'}` : `On the road: ${(C.slots || []).includes('forge') ? 'the Forge Cart can make metal gear.' : 'light gear only, from salvage.'} One day action per 100gp (${C.orders} left); Supply stands in for gold at 25gp each (${C.supply} Supply).`;
  $('camp-inner').innerHTML = $('camp-inner').innerHTML.replace('<h1 style="font-size:40px">Quartermaster</h1>', `<h1 style="font-size:40px">${C.part === 'road' ? 'Craft' : 'The Market of Varnholt'}</h1><div class="sub" style="color:var(--blood)"><b>${note2}</b></div>`);
};

/* ---------------------------------------------------------------------------
   HOOKS into the contract machinery
--------------------------------------------------------------------------- */
const STORY_OBJS = ['siege', 'night', 'sortie'];
const isS = () => G && STORY_OBJS.includes(G.obj);
OBJECTIVES.siege = {name:'The Siege of Varnholt', brief:''}; OBJECTIVES.night = {name:'The Long Road', brief:''}; OBJECTIVES.sortie = {name:'Sortie', brief:''};
{ const f = generateMap; generateMap = c => c.obj === 'siege' ? generateVarnholt(c) : c.obj === 'night' ? generateNightMap(c.night, c.formation) : f(c); }
{ const f = setupContract; setupContract = c => STORY_OBJS.includes(c.obj) ? setupStory(c) : f(c); }
{ const f = updateContract; updateContract = () => isS() ? updateStory() : f(); }
{ const f = contractCheck; contractCheck = () => isS() ? storyCheck() : f(); }
{ const f = contractProgress; contractProgress = () => isS() ? storyProgress() : f(); }
{ const f = contractLine; contractLine = t => isS() ? storyLine(t) : f(t); }
{ const f = contractBodies; contractBodies = (b, o) => isS() ? storyBodies(b, o) : f(b, o); }
{ const f = contractMarkers; contractMarkers = out => isS() ? storyMarkers(out) : f(out); }
{ const f = contractHow; contractHow = (c, r) => STORY_OBJS.includes(c.obj) ? (c.obj === 'siege' ? `Assault ${c.assault + 1}, ${ASSAULTS[c.assault].name}.` : c.obj === 'night' ? `Night ${c.night}, ${NIGHTS[c.night - 1].place}.` : 'A sortie beyond the walls.') : f(c, r); }
{ const f = contractDebrief; contractDebrief = (c, r, l) => STORY_OBJS.includes(c.obj) ? storyDebrief(c, r, l) : f(c, r, l); }
{ const f = objTarget; objTarget = e => isS() ? storyTarget(e) : f(e); }
{ const f = spawn; spawn = () => isS() ? null : f(); }
{ const f = contractEnemyAI; contractEnemyAI = (e, B) => (isS() && storyEnemyAI(e, B)) || f(e, B); }
{ const f = damageObjective; damageObjective = (t, d) => { if (t.struct && dist(t, G.leader) <= G.mod.radius) d = Math.max(1, Math.floor(d * 0.7)); f(t, d); if (isS()) storyDamage(t, d); }; }
{ const f = shotHitsObjective; shotHitsObjective = s => isS() ? storyShot(s) : f(s); }
{ const f = placeTraps; placeTraps = c => STORY_OBJS.includes(c.obj) ? null : f(c); }
{ const f = stepBonus; stepBonus = (u, m) => f(u, m) + (G && !m && ((G.squareFire) || (G.obj === 'siege' && CP().fort.murder && G.districts && dist(u, G.districts.keep) < G.districts.keep.r)) ? 1 : 0); }
{ const f = startDeployment; startDeployment = (c, ids) => { f(c, ids); if (G && STORY_OBJS.includes(c.obj)){ G.noTick = c.obj === 'sortie' || (c.obj === 'night' && !!NIGHTS[c.night - 1].noTick); G.noAdv = c.obj === 'sortie'; } }; }
{ const f = resetSave; resetSave = () => { if (inStory() || SAVE_KEY === STORY_SLOT){ if (gate('Start the campaign again from the beginning?', () => resetSave())) newStory(); return; } f(); }; }
// the town's walls and the laager let defenders shoot over them; enemies see less at night or in fog


window.FOUNDSTORY_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    try {
      META = freshMeta();
      ok('inStory is false on fresh non-story META', inStory() === false);
      META.cp = {part: 'fort', pick: []};
      ok('inStory is true while cp.part !== done', inStory() === true);
      storyPick(2);
      ok('storyPick adds index to CP().pick', CP().pick.includes(2));
      storyPick(2);
      ok('storyPick toggles index off when picked again', !CP().pick.includes(2));
      META.cp.part = 'done';
      ok('inStory is false when cp.part === done', inStory() === false);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { META = svM; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
