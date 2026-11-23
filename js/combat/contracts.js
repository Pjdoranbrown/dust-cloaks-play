/* js/combat/contracts.js (INT-1 step 2, 2026-11-16): CONTRACTS, MOMENTUM, the banner, enemy kit, new enemies, NEMESES, TRAPS.
   Cut unchanged from the inline script in index.html (old lines 3031 to 3951). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   CONTRACTS - ten kinds of job, each rolled with its own enemy host, place
   and details, so no two look the same. Three are offered on the planning
   table at a time. Built on the Scenario Objectives of Chapter 11.
============================================================================ */
const HOSTS = {
  bandits:   {name:'Bandits', the:'a bandit gang', den:'Bandit Hideout',
              pools:{1:['brigand','brigand','crossbow','enforcer'], 2:['enforcer','renegade','crossbow','hedgewitch','arbalest'], 3:['renegade','arbalest','battlemage','shadowhunter','warden']},
              bosses:{1:['vane'], 2:['vane','inquisitor'], 3:['ilvaryn','vane']}},
  greenskins:{name:'Greenskin raiders', the:'greenskin raiders', den:'Goblin Warren',
              pools:{1:['goblinsniper','goblinsniper','wolf','hobgob'], 2:['hobgob','goblinsniper','sapper','wolf'], 3:['hobgob','sapper','raider','warden']},
              bosses:{1:['alpha'], 2:['ogre'], 3:['ogre','wyrm']}},
  monsters:  {name:'Beasts and monsters', the:'beasts and monsters', den:'Monster Lair',
              pools:{1:['wolf','cinder','levy','wolf'], 2:['wolf','cinder','raider','hedgewitch'], 3:['cinder','raider','warden','phalanx']},
              bosses:{1:['alpha'], 2:['ogre','alpha'], 3:['devil','wyrm']}},
  hollow:    {name:'The Hollow dead', the:'the Hollow dead', den:'Hollow Barrow',
              pools:{1:['levy','levy','levy','hedgewitch'], 2:['levy','enforcer','tithepriest','crossbow'], 3:['levy','phalanx','tithepriest','warden']},
              bosses:{1:['orsolt'], 2:['orsolt','inquisitor'], 3:['devil','orsolt']}},
  deserters: {name:'Frost-Vault deserters', the:'Frost-Vault deserters', den:'Deserter Camp',
              pools:{1:['crossbow','enforcer','brigand'], 2:['renegade','arbalest','tithepriest','hobgob'], 3:['phalanx','shadowhunter','warden','tithepriest']},
              bosses:{1:['vane'], 2:['inquisitor','vane'], 3:['ilvaryn']}}
};
const HOST_KEYS = Object.keys(HOSTS);
const PLACES = ['Thornwood','Blackmire','the Gloamwald','Ravensreach','the Ashen Vale','Hollowmere','Greyfen','the Dunmarch','Wyrmhollow','the Saltmarsh','Kettle Ford','Harrowgate','Brackenridge','the Mournwood','Coldwater','the Gallows Hills'];
const TOWNS = ['Millbrook','Hesketh','Low Arden','Saint Ivo','Dunholt','Wether','Copperfield','Marrowby','Ashcombe','Fennick'];
const CARGO = ['Dwarven ore','grain for the winter','Imperial silver','temple relics','lamp oil and black powder',"a merchant's whole fortune",'wounded soldiers','a bishop and his tithe'];
const DIRS = {we:'west to east', ew:'east to west', ns:'north to south', sn:'south to north'};
const HOSTAGE_FOLK = {empire:'Imperial tax-men', suderia:'Suderian traders', mendor:'Mendorian pilgrims', dwarves:'Dwarven factors', reprobates:'Reprobate alchemists', skulk:"the Skulk's informants"};
const RELICS = ['the Weeping Chalice','the Iron Psalter','the Bones of Saint Ivo','a Dwarven Runestone','the Ashen Crown','a Wyrm-egg in a lead box'];
const pickOf = a => a[Math.random() * a.length | 0];

// The ten contract kinds. pay is Tier 1 base pay.
const CONTRACTS = {
  hold:       {name:'Hold the Redoubt',      pay:0,   desc:c => `Hold the old fort at ${c.place} until the relief column arrives. ${cap(HOSTS[c.host].the)} will throw everything at it, and two of their commanders will come.`},
  hunt:       {name:'Headhunter Clash',      pay:280, desc:c => `${cap(HOSTS[c.host].the)} have dug in at ${c.place}. Find their camps and kill every commander.`},
  extract:    {name:'High-Value Extraction', pay:300, desc:c => `Crack three strongboxes in the ruins of ${c.place}, then leave by the road you came in on. ${cap(HOSTS[c.host].the)} are already picking over the place.`},
  escort:     {name:'Caravan Escort',        pay:300, desc:c => `Guard a caravan of ${c.cargo} travelling ${DIRS[c.dir]} through ${c.place}. ${cap(HOSTS[c.host].the)} are in the trees. If the wagon burns, the job is lost.`},
  rescue:     {name:'Hostage Rescue',        pay:280, desc:c => `${c.town} has been overrun by ${HOSTS[c.host].the}. ${cap(HOSTAGE_FOLK[c.hostFaction])} are caged in the ruins. Break the cages and get them back to the road. Saving them earns the thanks of ${facName(c.hostFaction)}.`},
  assassinate:{name:'Assassination',         pay:320, desc:c => `A commander of ${HOSTS[c.host].the} is travelling through ${c.place} with a bodyguard. Kill them before they reach the edge of the map. Once they see you, they run.`},
  purge:      {name:'Purge the Nests',       pay:290, desc:c => `${cap(HOSTS[c.host].the)} are breeding in ${c.place}. Every ${HOSTS[c.host].den} keeps sending more until it is destroyed. Destroy them all.`},
  sabotage:   {name:'Sabotage',              pay:300, desc:c => `${cap(HOSTS[c.host].the)} are building siege engines at ${c.place}. Break into the camp, burn every engine, then get out.`},
  beacons:    {name:'Light the Beacons',     pay:270, desc:c => `Light the three signal beacons above ${c.place}. ${cap(HOSTS[c.host].the)} hold the hills and will fight you for every one, but once a beacon is lit it stays lit.`},
  relic:      {name:'Relic Recovery',        pay:300, desc:c => `${cap(c.relic)} lies in a ruin at ${c.place}, guarded by ${HOSTS[c.host].the}. Take it and carry it home. It is heavy, and they will follow.`}
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const CONTRACT_KEYS = Object.keys(CONTRACTS);

/* PD-29 (Patrick Q29, 2026-11-16): beasts and monsters roll only on the contract types that suit them; the other briefs are written for people */
const BEAST_OBJS = ['hold', 'hunt', 'purge', 'relic', 'beacons', 'escort', 'extract'];
const hostsFor = (obj, list) => { const l = BEAST_OBJS.includes(obj) ? list : list.filter(h => h !== 'monsters'); return l.length ? l : ['bandits']; };
const CONTRACT_TIER_MAX = 3;   // [S] the highest contract tier the host, boss and Resistance tables cover
function makeContract(obj, tier){
  tier = Math.max(1, Math.min(CONTRACT_TIER_MAX, Math.round(+tier) || 1));   /* QA bugs-r2: tier 4+ threw in startDeployment (HOSTS bosses, RESISTANCE and the rest stop at 3) */
  const open = PATRONS.filter(pt => standing(factionOfPatron(pt)) > -2);
  let patron = pickOf(open.length ? open : PATRONS);
  const c = {obj, tier, host:pickOf(hostsFor(obj, HOST_KEYS)), place:pickOf(PLACES), edges:[], council:null, picks:0, minutes:0};
  if (obj === 'hold') c.minutes = [6, 8, 10][Math.random() * 3 | 0];
  if (obj === 'escort'){ c.dir = pickOf(Object.keys(DIRS)); c.cargo = pickOf(CARGO); }
  if (obj === 'rescue'){
    c.town = pickOf(TOWNS);
    c.hostFaction = pickOf(Object.keys(FACTIONS));
    if (Math.random() < 0.7 && standing(c.hostFaction) > -2) patron = FACTIONS[c.hostFaction].patron;
    if (c.host === 'deserters' && Math.random() < .5) c.host = 'bandits';
  }
  if (obj === 'relic') c.relic = pickOf(RELICS);
  const base = obj === 'hold' ? {6:200, 8:260, 10:320}[c.minutes] : obj === 'hunt' && tier > 1 ? 360 : CONTRACTS[obj].pay;
  c.pay = Math.round(base * TIER_PAY[tier] / 5) * 5;
  c.patron = patron; c.faction = factionOfPatron(patron);
  c.brief = CONTRACTS[obj].desc(c);
  return c;
}
const briefOf = c => c.brief || (OBJECTIVES[c.obj] || {}).brief || '';
const hostOf = () => HOSTS[(G && G.contract.host) || 'bandits'] || HOSTS.bandits;
const hostPool = tier => hostOf().pools[tier || G.contract.tier];
const hostBosses = () => hostOf().bosses[G.contract.tier];
// A wave from the contract's host. Low levels use its Tier 1 troops; higher
// levels mix in stronger ones, as the old fixed waves did.
function hostWave(level){
  const H = hostOf(), w = WAVES[Math.max(0, Math.min(9, level))];
  const tiers = level < 4 ? [1] : level < 7 ? [1, 2] : [2, 3];
  return {pool:tiers.flatMap(t => H.pools[t]), rate:w.rate, burst:w.burst};
}

/* ---------------------------------------------------------------------------
   COMMANDER NAMES - every commander gets a name of their own, never reused
   in a campaign.
--------------------------------------------------------------------------- */
const SURNAMES = ['Vane','Blackmoor','Crowley','Harrow','Kettle','Marrow','Ashby','Thorne','Grieve','Locke','Rook','Stroud','Cinder','Mallory','Hask','Dunmore','Quill','Sallow','Burke','Wrexley'];
const NAME_RULES = {
  vane:      () => `Captain ${pickOf(NAMES.HUMAN[Math.random() < .3 ? 'f' : 'm'])} ${pickOf(SURNAMES)}`,
  orsolt:    () => `${pickOf(['Orsolt','Wendel','Mabry','Corvin','Ulric','Haskel','Benedek','Grisel','Aldwyn','Morrow','Edda','Sibyl'])} the Hollow ${pickOf(['Reeve','Abbot','Warden','Bailiff','Sexton'])}`,
  alpha:     () => `${pickOf(['Greyfang','Ashpelt','Old Scar','Rimehowl','Blackmuzzle','Tatterear','Frostjaw','Bloodtooth','Mudpaw','Longshadow','Hollowbelly','Redruff'])}, Alpha of the Pack`,
  ogre:      () => `${pickOf(['Gorm','Bulga','Thudd','Mawk','Grumbel','Skarn','Hrolg','Brakka','Ugrot','Dagga','Lumm','Krog'])} the ${pickOf(['Cave Ogre','Bone-Chewer','Gut-Ripper','Hill Ogre','Mountain'])}`,
  inquisitor:() => `Inquisitor-Apprentice ${pickOf(NAMES.HUMAN[Math.random() < .4 ? 'f' : 'm'])} ${pickOf(SURNAMES)}`,
  devil:     () => `${pickOf(['Malphas','Vexor','Azgoth','Karnash','Belloch','Sythra','Morrax','Ilsabet','Orobas','Naberia'])}, ${pickOf(['Devil-Knight','Knight of Cinders','the Brimstone Lord','Hell-Marshal'])}`,
  wyrm:      () => `${pickOf(['Ssarith','Vorlaxx','Thessyr','Ignathra','Kaul','Rhazzik','Ombrys','Vyrnax','Szelra'])} the ${pickOf(['Young Wyrm','Ash-Wing','Green','Marsh-Wyrm','Hatchling Tyrant'])}`,
  ilvaryn:   () => `Strategos ${pickOf(NAMES.ELVES[Math.random() < .4 ? 'f' : 'm'])}`
};
function commanderName(k){
  const rule = NAME_RULES[k]; if (!rule) return BESTIARY[k].name;
  META.usedNames = META.usedNames || [];
  for (let i = 0; i < 40; i++){ const n = rule(); if (!META.usedNames.includes(n)){ META.usedNames.push(n); if (META.usedNames.length > 600) META.usedNames.shift(); return n; } }
  const n = rule() + ' the Younger'; META.usedNames.push(n); return n;
}
const ename = e => e.name || BESTIARY[e.k].name;

/* ---------------------------------------------------------------------------
   SETTING UP THE OBJECTIVE when the squad marches
--------------------------------------------------------------------------- */
function setupContract(c){
  const tier = c.tier, H = HOSTS[c.host] || HOSTS.bandits, guards = () => H.pools[tier][Math.random() * H.pools[tier].length | 0];
  const garrison = (x, y, n, boss) => { const grp = GROUP++;
    if (boss){ const b = spawnEnemy(boss, x, y, {dormant:true, group:grp}); }
    for (let i = 0; i < n; i++){ const a = Math.random() * TAU, d = rnd(30, 110); spawnEnemy(guards(), x + Math.cos(a) * d, y + Math.sin(a) * d, {dormant:true, group:grp}); }
    return grp; };
  const boss = () => pickOf(H.bosses[tier]);
  if (c.obj === 'escort'){
    const p = MAP.route[0];
    G.wagon = {x:p.x, y:p.y, idx:0, hp:70 + 30 * tier, maxHp:70 + 30 * tier, r:26, ac:6, shift:1, objHp:true, left:false, flash:0, ambush:[0.18, 0.4, 0.62, 0.82], bossAt:0.55};
    G.exitOpen = true;
  }
  if (c.obj === 'rescue'){
    G.cages = MAP.cages.map(p => ({x:p.x, y:p.y, prog:0, open:false}));
    G.hostages = []; G.saved = 0; G.exitOpen = true;
    for (const cg of G.cages) garrison(cg.x, cg.y, 2 + tier, null);
    garrison(MAP.town.x, MAP.town.y, 4, boss());
    G.exitFlow = bfsFrom(MAP.exit.x, MAP.exit.y);
  }
  if (c.obj === 'assassinate'){
    const p = MAP.markRoute[0], k = boss();
    const m = spawnEnemy(k, p.x, p.y, {group:GROUP++});
    m.mark = true; m.parleyed = true; m.seen = true; m.ri = 1; m.con = m.maxCon = Math.round(m.maxCon * 0.75); m.stuck = 0;
    G.mark = m;
    for (let i = 0; i < 4 + tier * 2; i++){ const g = spawnEnemy(guards(), p.x + rnd(-50, 50), p.y + rnd(-50, 50), {group:m.group}); if (g){ g.escort = m; g.seen = true; } }
    G.escFlow = bfsFrom(MAP.escape.x, MAP.escape.y);
  }
  if (c.obj === 'purge'){
    G.nests = [];
    for (const p of MAP.nests){ const n = spawnEnemy('nest', p.x, p.y, {group:GROUP++}); n.name = H.den; n.con = n.maxCon = 26 + 16 * tier; n.spawnEvery = 330 - tier * 40; n.ax = p.x; n.ay = p.y; G.nests.push(n);
      for (let i = 0; i < 2 + tier; i++) spawnEnemy(guards(), p.x + rnd(-80, 80), p.y + rnd(-80, 80), {dormant:true, group:n.group}); }
  }
  if (c.obj === 'sabotage'){
    G.engines = [];
    const grp = garrison(MAP.siege.x, MAP.siege.y, 6 + tier * 2, boss());
    for (const p of MAP.engines){ const n = spawnEnemy('engine', p.x, p.y, {dormant:true, group:grp}); n.name = pickOf(['Mangonel','Ballista','Siege Tower','Trebuchet','Battering Ram']);
      n.con = n.maxCon = 18 + 8 * tier; n.ax = p.x; n.ay = p.y; G.engines.push(n); }
  }
  if (c.obj === 'beacons'){
    G.beacons = MAP.beacons.map(p => ({x:p.x, y:p.y, prog:0, burning:false, douse:0}));
    for (const b of G.beacons) garrison(b.x, b.y, 2 + tier, null);
  }
  if (c.obj === 'relic'){
    G.relic = {x:MAP.relic.x, y:MAP.relic.y, prog:0, taken:false, name:c.relic};
    garrison(MAP.relic.x, MAP.relic.y, 4 + tier * 2, boss());
  }
}

/* ---------------------------------------------------------------------------
   ENEMY BEHAVIOUR for objectives
--------------------------------------------------------------------------- */
// Returns true when it has handled this enemy's turn.
function contractEnemyAI(e, B, sp){
  if (B.arch === 'fixed'){
    e.x = e.ax; e.y = e.ay;
    if (B.spawner && !e.dormant && dist(e, G.leader) < 950 && G.frame % (e.spawnEvery || 300) === 0){
      for (let i = 0; i < 1 + G.contract.tier; i++){ const a = Math.random() * TAU, m = spawnEnemy(pickOf(hostPool()), e.x + Math.cos(a) * 46, e.y + Math.sin(a) * 46); if (m) m.seen = true; }
      G.fx.push({ring:true, x:e.x, y:e.y, r:70, life:14, c:'#a07040'});
    }
    return true;
  }
  if (e.mark){
    const L = G.leader;
    if (!G.markAlarm && (e.con < e.maxCon || (dist(e, L) < 300 && clearLine(e, L)))){
      G.markAlarm = true; SFX.play('horn'); note(`${ename(e)} has seen you and runs for the edge of the map.`); pop(e.x, e.y - 50, 'THE MARK RUNS', '#ff8a7a'); }
    let tx, ty, spd;
    if (!G.markAlarm){ const wp = MAP.markRoute[Math.min(e.ri, MAP.markRoute.length - 1)]; tx = wp.x; ty = wp.y; spd = 0.42;
      if (dist(e, wp) < 20){ e.ri++; if (e.ri >= MAP.markRoute.length) G.markEscaped = true; } }
    else { const fd = flowDir(G.escFlow, e.x, e.y); spd = 0.82; if (fd){ tx = e.x + fd.x * 40; ty = e.y + fd.y * 40; } else { tx = MAP.escape.x; ty = MAP.escape.y; } }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1, ox = e.x, oy = e.y;
    e.x += dx / d * spd * (e.slow > 0 || e.hexT > 0 ? 0.7 : 1); e.y += dy / d * spd * (e.slow > 0 || e.hexT > 0 ? 0.7 : 1); e.left = dx < 0;
    collide(e, e.r * .7);
    if (Math.hypot(e.x - ox, e.y - oy) < 0.1 && !G.markAlarm && ++e.stuck > 90){ e.ri++; e.stuck = 0; }
    if (dist(e, MAP.escape) < 40) G.markEscaped = true;
    return true;
  }
  if (e.escort && !G.markAlarm && !e.escort.dead){
    const a = (e.seed / 20) * TAU, tx = e.escort.x + Math.cos(a) * 46, ty = e.escort.y + Math.sin(a) * 34, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 4){ e.x += dx / d * Math.min(0.6, d); e.y += dy / d * Math.min(0.6, d); e.left = dx < 0; }
    collide(e, e.r * .7);
    return true;
  }
  return false;
}
// The wagon, a fleeing hostage, or a burning beacon can draw enemies off the squad.
function objTarget(e){
  if (e.mark || e.escort) return null;
  if (G.wagon && G.wagon.hp > 0){ const d = dist(e, G.wagon); if (d < 380 && (e.seed % 2 === 0 || d < dist(e, G.leader) - 40)) return G.wagon; }
  if (G.hostages && e.seed % 3 === 0){ let best = null, bd = 240; for (const h of G.hostages) if (h.state === 'walk'){ const d = dist(e, h); if (d < bd){ bd = d; best = h; } } if (best) return best; }
  if (G.beacons && e.seed % 2 === 0){ let best = null, bd = 760; for (const b of G.beacons) if (b.burning){ const d = dist(e, b); if (d < bd){ bd = d; best = b; } } if (best) return best; }
  return null;
}
function hitObjective(e, t){
  const B = BESTIARY[e.k], {out} = attackDie(B.skill, t.ac || 4);
  if (out === 'miss') return;
  const d = out === 'graze' ? 1 : damageRoll(B.dmg, t.shift || 0) + (out === 'crit' ? 1 : 0);
  damageObjective(t, d);
}
function damageObjective(t, d){
  if ((t.state === 'walk' || t === G.wagon || t === G.house) && dist(t, G.leader) <= G.mod.radius + (t === G.house ? 60 : 0)) d = Math.max(1, Math.floor(d / 2));   // the squad covers what is inside the Command Radius
  t.hp -= d; t.flash = 8; pop(t.x, t.y - 30, '-' + d, '#ff9a6a');
  if (t === G.wagon){ if (t.hp <= Math.ceil(t.maxHp * 0.3) && !G.wagonWarn){ G.wagonWarn = true; note('The caravan is burning. Get the enemy off it.'); } }
  else if (t.hp <= 0 && t.state === 'walk'){ t.state = 'dead'; G.hostagesLost = (G.hostagesLost || 0) + 1; pop(t.x, t.y - 20, 'HOSTAGE KILLED', '#ff5a4a'); note('A hostage has been cut down.'); SFX.play('down'); }
}
function shotHitsObjective(s){
  const hitT = t => { const d = Math.max(1, damageRoll(s.dmg || 2, t.shift || 0) - 1); damageObjective(t, d); return true; };
  if (G.wagon && G.wagon.hp > 0 && Math.hypot(G.wagon.x - s.x, G.wagon.y - 10 - s.y) < 26) return hitT(G.wagon);
  if (G.hostages) for (const h of G.hostages) if (h.state === 'walk' && Math.hypot(h.x - s.x, h.y - 6 - s.y) < 12) return hitT(h);
  return false;
}

/* ---------------------------------------------------------------------------
   EACH FRAME
--------------------------------------------------------------------------- */
const contested = (p, r) => G.enemies.some(e => !e.dead && !e.dormant && BESTIARY[e.k].arch !== 'fixed' && dist(e, p) < r);
function updateContract(){
  const L = G.leader, o = G.obj;
  if (o === 'escort' && G.wagon.hp > 0){
    const w = G.wagon, route = MAP.route; if (w.flash > 0) w.flash--;
    if (w.stall > 0) w.stall--;
    const blocked = w.stall > 0 || G.enemies.some(e => !e.dead && !e.dormant && dist(e, w) < w.r + e.r + 6);
    const waits = L.down ? true : dist(L, w) > 300;
    if (!blocked && !waits && w.idx < route.length - 1){
      const nx = route[w.idx + 1], dx = nx.x - w.x, dy = nx.y - w.y, d = Math.hypot(dx, dy);
      const sp = 0.62; if (d <= sp){ w.x = nx.x; w.y = nx.y; w.idx++; } else { w.x += dx / d * sp; w.y += dy / d * sp; if (Math.abs(dx) > 0.1) w.left = dx < 0; }
    }
    if (waits && (L.down || dist(L, w) > 520) && G.frame % 300 === 0) pop(w.x, w.y - 50, 'THE CARAVAN WAITS FOR YOU', '#f0e6d2');   /* Index 35: only when it really is waiting */
    // the drovers patch the wagon whenever nothing is close
    if (G.frame % 240 === 0 && w.hp < w.maxHp && !contested(w, 140)){ w.hp++; pop(w.x, w.y - 44, '+1 REPAIRED', '#8fd39a'); }
    const prog = w.idx / (route.length - 1);
    if (w.ambush.length && prog >= w.ambush[0]){ w.ambush.shift(); escortAmbush(); }
    if (w.bossAt && prog >= w.bossAt){ w.bossAt = 0; const e = spawnEnemy(pickOf(hostBosses())); if (e){ e.seen = true; SFX.play('boss'); note(`${ename(e)} leads an attack on the caravan.`); G.shake = 16; } }
  }
  if (o === 'rescue'){
    for (const c of G.cages){
      if (c.open) continue;
      const near = dist(L, c) < 46 && !L.down, cont = contested(c, 90);
      if (near && !cont) c.prog++; else if (!near && c.prog > 0) c.prog = Math.max(0, c.prog - 0.5);
      if (near && cont && !c.sealed && G.frame % 60 === 0) { pop(c.x, c.y - 34, 'CLEAR THE ENEMY OFF IT', '#ff8a7a'); contestRing(c.x, c.y, 30); }
      if (c.prog >= 110){
        c.open = true; SFX.play('chest'); const n = 1 + (Math.random() * 2 | 0);
        for (let i = 0; i < n; i++){ const race = rollRace(), sex = Math.random() < .5 ? 'f' : 'm';
          G.hostages.push({x:c.x + rnd(-14, 14), y:c.y + 10, hp:6, maxHp:6, ac:4, r:10, objHp:true, state:'walk', flash:0, left:false,
            p:{race, spec:'PLAIN', name:randomName(race, sex), id:'h' + G.hostages.length, sex}}); }
        pop(c.x, c.y - 40, n > 1 ? n + ' HOSTAGES FREED' : 'HOSTAGE FREED', '#8fd39a');
        note('The cage is open. The freed follow you: lead them to the green banner.'); G.alarm++;
        if (G.cages.filter(x => x.open).length % 2 === 1) huntingParty();
      }
    }
    for (const h of G.hostages){
      if (h.flash > 0) h.flash--;
      if (h.state !== 'walk') continue;
      // Freed hostages follow the Leader, trailing the squad, until they reach the road.
      const i = G.hostages.indexOf(h), a = G.facing + Math.PI + (i % 5 - 2) * 0.35, rr = 70 + (i / 5 | 0) * 22;
      const tx = L.x + Math.cos(a) * rr, ty = L.y + Math.sin(a) * rr, dx = tx - h.x, dy = ty - h.y, d = Math.hypot(dx, dy);
      h.cower = dist(h, L) > 420 || L.down;
      if (!h.cower && d > 6){ const fd = d > 120 && !clearLine(h, L) ? flowDir(G.flow, h.x, h.y) : null, sp = 0.95 * (G.mounted ? G.mount.spd : 1);
        if (fd){ h.x += fd.x * sp; h.y += fd.y * sp; } else { h.x += dx / d * Math.min(sp, d); h.y += dy / d * Math.min(sp, d); } h.left = dx < 0; h.moving = true; } else h.moving = false;
      collide(h, 8);
      // QA pass 3 (UX): the freed trail 70 to 92 px behind the Leader, so a Leader standing on the banner left them just short;
      // a following hostage now counts once the Leader is on the banner and the hostage is close behind
      if (dist(h, MAP.exit) < 70 || (!h.cower && !L.down && dist(L, MAP.exit) < 70 && dist(h, L) < 140)){ h.state = 'saved'; G.saved++; G.captivesFreed++; liberationDeed(1); pop(h.x, h.y - 20, 'SAVED', '#8fd39a'); SFX.play('stand'); }
    }
  }
  if (o === 'beacons'){
    for (const b of G.beacons){
      const sq = squadUnits().some(u => dist(u, b) < 74), en = contested(b, 84);
      if (!b.burning){
        if (sq && !en) b.prog += 1 / 240; else if (!sq) b.prog = Math.max(0, b.prog - 1 / 900);
        if (sq && en && G.frame % 60 === 0) { pop(b.x, b.y - 50, 'CLEAR THE ENEMY OFF IT', '#ff8a7a'); contestRing(b.x, b.y - 10, 40); }
        if (b.prog >= 1){ b.burning = true; b.douse = 1; SFX.play('blast'); pop(b.x, b.y - 54, 'BEACON LIT', '#ffd860'); G.alarm++; huntingParty();
          note(`A beacon burns (${G.beacons.filter(x => x.burning).length} of 3). Once lit, it stays lit.`); }
      }
    }
  }
  if (o === 'sabotage' && !G.exitOpen && G.engines.every(e => e.dead)){
    G.exitOpen = true; note('Every engine is burning. Get back to the road you came in on.'); huntingParty();
  }
  if (o === 'relic' && !G.relic.taken){
    const r = G.relic, near = dist(L, r) < 40 && !L.down, cont = contested(r, 90);
    if (near && !cont) r.prog++; else if (!near && r.prog > 0) r.prog = Math.max(0, r.prog - 1);
    if (near && cont && G.frame % 60 === 0) { pop(r.x, r.y - 34, 'CLEAR THE ENEMY OFF IT', '#ff8a7a'); contestRing(r.x, r.y, 32); }
    if (r.prog >= 150){ r.taken = true; G.carrying = true; G.exitOpen = true; SFX.play('chest'); G.alarm += 2;
      note(`You have ${r.name}. Carry it to the green banner. The squad moves slower under the weight.`); huntingParty();
      const e = spawnEnemy(pickOf(hostBosses())); if (e){ e.seen = true; note(`${ename(e)} comes after the relic.`); } }
  }
}
function escortAmbush(){
  const w = G.wagon, route = MAP.route, ahead = route[Math.min(route.length - 1, w.idx + 6)];
  const dx = ahead.x - w.x, dy = ahead.y - w.y, d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d;
  const pool = hostWave(TIER_WAVE_OFFSET[G.contract.tier] + 2 + G.alarm).pool, n = 4 + G.contract.tier * 2;
  for (let i = 0; i < n; i++){ const side = i % 2 ? 1 : -1, along = rnd(-60, 160), off = rnd(200, 300);
    const x = w.x + dx / d * along + px * side * off, y = w.y + dy / d * along + py * side * off;
    if (!blockedXY(x, y)){ const e = spawnEnemy(pickKind(pool), x, y); if (e) e.seen = true; } }
  pop(w.x, w.y - 56, 'AMBUSH', '#ff6a5a'); note('Ambush! They are coming out of the trees.'); G.shake = 10; SFX.play('horn');
}

/* ---------------------------------------------------------------------------
   OBJECTIVES, PROGRESS AND THE HUD
--------------------------------------------------------------------------- */
function contractFail(head, why){ if (G.over) return true; G.failHead = head; note(why); endDeployment('fled'); return true; }
function contractCheck(){
  const o = G.obj, L = G.leader;
  if (o === 'escort'){
    if (G.wagon.hp <= 0) return contractFail('THE CARAVAN IS LOST', 'The caravan burns.');
    if (G.wagon.idx >= MAP.route.length - 1){ endDeployment('victory'); return true; }
  }
  if (o === 'rescue'){
    const walking = G.hostages.filter(h => h.state === 'walk').length, total = G.hostages.length;
    if (G.cages.every(c => c.open) && walking === 0){
      if (G.saved >= Math.ceil(total * 0.5)){ endDeployment('victory'); return true; }
      return contractFail('THE HOSTAGES ARE LOST', 'Too many of the hostages are dead.');
    }
  }
  if (o === 'assassinate'){
    if (G.mark.dead && !G.winT){ G.winT = 120; note(`${ename(G.mark)} is dead. The job is done.`); }
    if (G.markEscaped && !G.mark.dead){ recordNemesis(G.mark); } if (G.markEscaped && !G.mark.dead) return contractFail('THE MARK ESCAPES', `${ename(G.mark)} slips away.`);
  }
  if (o === 'purge' && G.nests.every(n => n.dead) && !G.winT){ G.winT = 120; note('The last nest is destroyed.'); }
  if (o === 'sabotage' && G.exitOpen && dist(L, MAP.exit) < 70){ endDeployment('victory'); return true; }
  if (o === 'beacons' && G.beacons.every(b => b.burning) && !G.winT){ G.winT = 90; note('All three beacons burn together. The signal is seen.'); }
  if (o === 'relic' && G.carrying && dist(L, MAP.exit) < 70){ endDeployment('victory'); return true; }
  return false;
}
function contractProgress(){
  const o = G.obj;
  if (o === 'escort') return G.wagon.idx / (MAP.route.length - 1);
  if (o === 'rescue') return G.saved / Math.max(1, G.cages.length);
  if (o === 'assassinate') return G.mark.dead ? 1 : 0;
  if (o === 'purge') return G.nests.filter(n => n.dead).length / G.nests.length;
  if (o === 'sabotage') return G.engines.filter(n => n.dead).length / G.engines.length * 0.9 + (G.exitOpen ? 0.1 : 0);
  if (o === 'beacons') return G.beacons.filter(b => b.burning).length / 3;
  if (o === 'relic') return G.relic.taken ? 0.6 : 0;
  return null;
}
function contractLine(t){
  const o = G.obj;
  if (o === 'escort') return [`${Math.round(contractProgress() * 100)}%`, `CARAVAN ${Math.max(0, G.wagon.hp)} / ${G.wagon.maxHp}  \u00b7  ${t}  \u00b7  ALARM ${G.alarm}`];
  if (o === 'rescue') return [`${G.saved} SAVED`, `${/WAIT/.test(hostageCount()) ? 'CAGES' : 'CAGES OPEN'} ${G.cages.filter(c => c.open).length}/${G.cages.length}  \u00b7  ${hostageCount()}  \u00b7  ${t}`];
  if (o === 'assassinate') return [G.mark.dead ? 'MARK DOWN' : G.markAlarm ? 'RUNNING' : 'UNAWARE', `${ename(G.mark).toUpperCase()}  \u00b7  ${t}`];
  if (o === 'purge') return [`${G.nests.filter(n => n.dead).length} / ${G.nests.length}`, `${hostOf().den.toUpperCase()}S DESTROYED  \u00b7  ${t}`];
  if (o === 'sabotage') return G.exitOpen ? ['GET OUT', `REACH THE GREEN BANNER  \u00b7  ${t}`] : [`${G.engines.filter(n => n.dead).length} / ${G.engines.length}`, `SIEGE ENGINES BURNED  \u00b7  ${t}  \u00b7  ALARM ${G.alarm}`];
  if (o === 'beacons') return [`${G.beacons.filter(b => b.burning).length} / 3`, `BEACONS BURNING  \u00b7  ${t}  \u00b7  ALARM ${G.alarm}`];
  if (o === 'relic') return G.relic.taken ? ['CARRY IT HOME', `REACH THE GREEN BANNER  \u00b7  ${t}`] : ['FIND THE RELIC', `${G.relic.name.toUpperCase()}  \u00b7  ${t}`];
  return null;
}
function contractMarkers(out){
  const o = G.obj;
  if (o === 'escort' && G.wagon.hp > 0) out.push({x:G.wagon.x, y:G.wagon.y, kind:'ally', sp:'wagon'});
  if (o === 'rescue'){ for (const c of G.cages) out.push({x:c.x, y:c.y, kind:c.open ? 'done' : 'vault', sp:'cage'}); for (const h of G.hostages) if (h.state === 'walk') out.push({x:h.x, y:h.y, kind:'ally'}); }
  if (o === 'assassinate' && !G.mark.dead){ out.push({x:G.mark.x, y:G.mark.y, kind:'boss', k:G.mark.k}); }
  if (o === 'purge') for (const n of G.nests) out.push({x:n.x, y:n.y, kind:n.dead ? 'done' : 'boss', sp:'nest'});
  if (o === 'sabotage') for (const n of G.engines) out.push({x:n.x, y:n.y, kind:n.dead ? 'done' : 'vault', sp:'engine'});
  if (o === 'beacons') for (const b of G.beacons) out.push({x:b.x, y:b.y, kind:b.burning ? 'lit' : 'beacon', sp:'beacon'});
  if (o === 'relic' && !G.relic.taken) out.push({x:G.relic.x, y:G.relic.y, kind:'vault', sp:'relic'});
}
function contractHow(c, result){
  const t = `${G.sec / 60 | 0}m ${G.sec % 60}s`;
  if (c.obj === 'escort') return `The caravan of ${c.cargo} ${G.wagon.hp > 0 && result === 'victory' ? 'came through' : G.wagon.hp > 0 ? 'got ' + Math.round(contractProgress() * 100) + '% of the way' : 'was lost'} (${Math.max(0, G.wagon.hp)} of ${G.wagon.maxHp} left) in ${t}.`;
  if (c.obj === 'rescue') return `<b>${G.saved}</b> of ${G.hostages.length} freed hostages were led to the road${G.hostagesLost ? `; ${G.hostagesLost} died` : ''}, in ${t}.`;
  if (c.obj === 'assassinate') return `${esc(ename(G.mark))} ${G.mark.dead ? 'is dead' : 'got away'}, after ${t}.`;
  if (c.obj === 'purge') return `<b>${G.nests.filter(n => n.dead).length} of ${G.nests.length}</b> ${HOSTS[c.host].den}s destroyed in ${t}.`;
  if (c.obj === 'sabotage') return `<b>${G.engines.filter(n => n.dead).length} of ${G.engines.length}</b> siege engines burned in ${t}.`;
  if (c.obj === 'beacons') return `${G.beacons.filter(b => b.burning).length} of 3 beacons burning at the end, after ${t}.`;
  if (c.obj === 'relic') return `${cap(c.relic)} ${G.relic.taken ? (result === 'victory' ? 'came home' : 'was taken but not brought home') : 'was never reached'}, in ${t}.`;
  return null;
}
function contractDebrief(c, result, lines){
  if (c.obj === 'rescue' && result === 'victory'){
    const all = G.saved === G.hostages.length && G.cages.every(x => x.open);
    lines.push(`<p class="good">${cap(HOSTAGE_FOLK[c.hostFaction])} owe you their lives.</p>`);
    shiftStanding(c.hostFaction, all ? 2 : 1, lines);
  }
}

/* ---------------------------------------------------------------------------
   DRAWING the objective pieces
--------------------------------------------------------------------------- */
const nestSprite = () => simpleSprite('nest', 24, 18, P => {
  P(2, 8, 20, 9, '#5a4a36'); P(4, 5, 16, 5, '#6a5a42'); P(7, 3, 10, 3, '#7a6a4e'); P(1, 15, 22, 3, '#3a2e22');
  P(8, 8, 8, 7, '#140e0a'); P(9, 7, 6, 1, '#140e0a'); P(10, 10, 1, 1, '#e04030'); P(13, 10, 1, 1, '#e04030');
  P(3, 13, 3, 1, C.bone); P(19, 12, 3, 1, C.bone); P(5, 11, 1, 2, C.bone); P(18, 6, 2, 1, C.bone);
});
const engineSprite = () => simpleSprite('engine', 26, 20, P => {
  P(2, 14, 22, 3, C.woodD); P(2, 14, 22, 1, C.wood); for (const x of [4, 19]){ P(x, 16, 4, 4, '#3a2a1c'); P(x + 1, 17, 2, 2, C.wood); }
  P(5, 6, 2, 9, C.wood); P(19, 6, 2, 9, C.wood); P(4, 5, 18, 2, C.woodD);
  for (let i = 0; i < 12; i++) P(8 + i, 12 - i, 1, 1, C.wood); P(18, 1, 4, 3, '#5a5a56'); P(8, 12, 3, 2, C.steel);
});
const relicSprite = () => simpleSprite('relic', 14, 14, P => {
  P(2, 6, 10, 7, '#c8a040'); P(2, 6, 10, 1, '#ffe080'); P(1, 12, 12, 2, '#8a6a20'); P(4, 2, 6, 4, '#d4b050'); P(6, 0, 2, 2, '#ffe080');
  P(6, 8, 2, 3, '#9fd0ff'); P(4, 4, 1, 1, '#fff6c0');
});
function fixedSprite(kind){
  if (SPR['fx:' + kind]) return SPR['fx:' + kind];
  const base = kind === 'nest' ? nestSprite() : engineSprite(), frames = [base, base, base, base];
  return SPR['fx:' + kind] = {frames, white:frames.map(whiteOf), ax:base.width / 2, ay:base.height - 4, w:base.width, h:base.height};
}
function contractBodies(bodies, onScreen){
  const o = G.obj;
  if (o === 'escort' && G.wagon.hp > 0 && onScreen(G.wagon, 80)) bodies.push({y:G.wagon.y, custom:drawWagon});
  if (o === 'rescue'){
    for (const c of G.cages) if (onScreen(c) && (typeof wSeen !== 'function' || wSeen(c))) bodies.push({y:c.y, custom:() => {
      if (!c.open && c.prog > 0){ ctx.strokeStyle = '#8fd39a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(c.x, c.y, 30, -Math.PI / 2, -Math.PI / 2 + TAU * c.prog / 110); ctx.stroke(); }
      if (!c.open){ ctx.fillStyle = 'rgba(255,230,120,' + (0.15 + Math.sin(G.frame / 12) * 0.1) + ')'; ctx.beginPath(); ctx.arc(c.x, c.y, 22, 0, TAU); ctx.fill(); }
      if (!(typeof w3dMapProp === 'function' && w3dMapProp(c.open ? 'm_cage_open' : 'm_cage', c.x, c.y + 15))) PROPS3D.box(c.x, c.y, 2.6, 14, 16, 7, 10, '#5f6870'); }});   /* Index 70 */
    for (const h of G.hostages) if (h.state === 'walk' && onScreen(h)) bodies.push({y:h.y, custom:() => {
      const spr = personSpriteK('hostage:' + h.p.race + h.p.name + h.p.sex, h.p);   /* Index 74 */
      drawUnit3(h, spr, h.x, h.y, 2.2, h.moving ? 1 + ((G.frame / 8 | 0) % 2) : 0, h.left, h.flash > 0);
      if (h.cower){ ctx.fillStyle = W2COL; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('WAITING', h.x, h.y - 26); }
      for (let i = 0; i < h.maxHp; i++){ ctx.fillStyle = i < h.hp ? '#9fe0ff' : 'rgba(0,0,0,.45)'; ctx.fillRect(h.x - h.maxHp * 2.5 + i * 5, h.y + 20, 4, 3); } }});
  }
  if (o === 'beacons') for (const b of G.beacons) if (onScreen(b, 80) && (typeof wSeen !== 'function' || wSeen(b))) bodies.push({y:b.y, custom:() => {
    if (!b.burning && b.prog > 0){ ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.x, b.y - 10, 40, -Math.PI / 2, -Math.PI / 2 + TAU * b.prog); ctx.stroke(); }
    if (b.burning && b.douse < 1){ ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.x, b.y - 10, 40, -Math.PI / 2, -Math.PI / 2 + TAU * b.douse); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,216,96,.35)'; ctx.lineWidth = 2; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(b.x, b.y, 74, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const b3 = typeof w3dMapProp === 'function' && w3dMapProp(b.burning ? 'm_beacon_lit' : 'm_beacon', b.x, b.y + 6, {t:G.frame});   /* Index 70 */
    if (!b3) PROPS3D.box(b.x, b.y, 3, 18, 22, 9, 20, '#6a5a48');
    if (b.burning){ const gl = ctx.createRadialGradient(b.x, b.y - 50, 4, b.x, b.y - 50, 90); gl.addColorStop(0, 'rgba(255,170,60,.45)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y - 50, 90, 0, TAU); ctx.fill();
      if (!b3) PROPS3D.box(b.x, b.y - 52, 3.4, 12, 12, 6, 9, '#f0a040', 0.85); } }});
  if (o === 'relic' && !G.relic.taken && onScreen(G.relic) && (typeof wSeen !== 'function' || wSeen(G.relic))) bodies.push({y:G.relic.y, custom:() => {
    const r = G.relic; ctx.fillStyle = 'rgba(255,230,120,' + (0.2 + Math.sin(G.frame / 10) * 0.12) + ')'; ctx.beginPath(); ctx.arc(r.x, r.y, 26, 0, TAU); ctx.fill();
    if (r.prog > 0){ ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(r.x, r.y, 32, -Math.PI / 2, -Math.PI / 2 + TAU * r.prog / 150); ctx.stroke(); }
    if (!(typeof w3dMapProp === 'function' && w3dMapProp('m_relic', r.x, r.y + 10))) PROPS3D.box(r.x, r.y, 2.6, 14, 14, 7, 10, '#c8a040'); }});   /* Index 70 */
  if (o === 'relic' && G.relic.taken && !G.leader.down) bodies.push({y:G.leader.y + 0.5, custom:() => { const ry = G.leader.y - 44 + Math.sin(G.frame / 10) * 2;   /* Index 76 */
    if (!(typeof w3dMapProp === 'function' && w3dMapProp('m_relic_held', G.leader.x, ry + 5))) PROPS3D.box(G.leader.x, ry, 1.8, 14, 14, 7, 10, '#c8a040'); }});
}
function drawWagon(){
  const w = G.wagon, moving = w.flash >= 0 && G.frame % 1 === 0;
  const fwd = w.left ? -1 : 1;
  if (!(typeof w3dCaravan === 'function' && w3dCaravan(w))){   /* Index 70 */
  figPlaceholder(w.x + fwd * 62, w.y + 4 - 7 * 2.4, 2.4, {h:20, w:8, horse:true, shadowW:8}); /* S6-C note 10: non-pixel stand-in */
  figPlaceholder(w.x, w.y - 18, 3, {h:24, w:30, box:true, shadowW:13}); }
  const bw = 80, top = w.y - 82;
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(w.x - bw / 2 - 1, top - 1, bw + 2, 7);
  ctx.fillStyle = w.hp > w.maxHp * 0.3 ? '#6fd37a' : '#e0503a'; ctx.fillRect(w.x - bw / 2, top, bw * Math.max(0, w.hp / w.maxHp), 5);
  ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('THE CARAVAN', w.x, top - 4);
}

/* ============================================================================
   MOMENTUM - power that builds inside a contract and fades after it.
   Nothing is learnt in the field. Everything a model knows (abilities,
   spells, prayers, doctrines, stats) is earned in camp and kept. In the field
   every kill feeds the Momentum bar (Section 6.7); each rank lets the squad
   push harder with what it already knows, or issue a field order. When the
   contract ends the squad's blood cools and the ranks are gone; what was
   learnt in camp is not.
============================================================================ */
const FIELD_ORDERS = [
  {id:'bloodup',   name:'Blood Up',          glyph:'sword',  max:2,  text:'Every Base Damage Die shifts up 1 step.', apply(){ G.ranks.veteran = rank('veteran') + 1; recompute(); }},
  {id:'holdline',  name:'Hold the Line',     glyph:'flag',   max:3,  text:'Command Radius +22px.', apply(){ G.ranks.radius = rank('radius') + 1; recompute(); }},
  {id:'secondwind',name:'Second Wind',       glyph:'heart',  max:99, text:'Every Squad Mate regains 2 Condition and the Leader 2 Wounds. Anyone Bleeding Out gets up.', apply(){
     const L = G.leader;
     for (const m of G.squad){ if (m.state === 'up') m.con = Math.min(m.maxCon, m.con + 2); else if (m.state !== 'dead') standUp(m, 'SECOND WIND'); }
     if (L.down) standLeader('SECOND WIND'); L.wounds = Math.min(L.maxWounds, L.wounds + 2); L.con = Math.min(L.maxCon, L.con + 2); }},
  {id:'supplies',  name:'Captured Supplies', glyph:'shield', max:99, text:'Ward Tokens to 4 and the Shield Pool refilled.', apply(){ G.wards = 4; G.shieldPool = G.shieldMax; G.wardFx = 30; }},
  {id:'disarray',  name:'Enemy in Disarray', glyph:'skull',  max:2,  text:'Every enemy Morale check rolls 1 step lower.', apply(){ G.disarray = (G.disarray || 0) + 1; }},
  {id:'spoils',    name:'Spoils of War',     glyph:'coin',   max:3,  text:'Coin drops are worth 25% more for the rest of the contract.', apply(){ G.spoils = (G.spoils || 0) + 1; recompute(); }},
  {id:'quicken',   name:'Quick Hands',       glyph:'boot',   max:2,  text:'Ability cooldowns are 15% shorter.', apply(){ G.quicken = (G.quicken || 0) + 1; }},
  {id:'gifts',     name:'Sharpened Gifts',   glyph:'star',   max:2,  text:'Specialty passives (Magic Missile, Withering Hex, Mending Prayer) come 25% more often.', apply(){ G.gifts = (G.gifts || 0) + 1; }},
  {id:'fortune',   name:'Fortune Favours',   glyph:'heart',  max:99, text:'Regain 1 spent Luck.', ok:() => G.luck < G.leader.s.luck, apply(){ G.luck++; }}
];
const orderCount = id => (G.orders && G.orders[id]) || 0;

// Three choices: empower something the squad already knows, or a field order.
function rollMomentum(){
  const known = CARDS.filter(c => rank(c.id) >= 1 && rank(c.id) < c.max && (!c.req || has(c.req)) && c.id !== 'veteran' && c.id !== 'radius')
    .map(c => ({kind:'card', c, name:c.name, glyph:c.glyph, tag:'Empower: rank ' + (rank(c.id) + 1), text:c.text(rank(c.id) + 1), col:c.spec ? SPECS[c.spec].color : '#7a3e26'}));
  const orders = FIELD_ORDERS.filter(o => orderCount(o.id) < o.max && (!o.ok || o.ok()))
    .map(o => ({kind:'order', o, name:o.name, glyph:o.glyph, tag:'Field Order', text:o.text, col:'#7a3e26'}));
  const pool = known.concat(known, orders), out = [];
  while (out.length < 3 && pool.length){ const x = pool.splice(Math.random() * pool.length | 0, 1)[0]; if (!out.some(y => y.name === x.name)) out.push(x); }
  return out;
}
function openMomentum(){
  if (!G || G.over || G.momChoice || G.levelQueue <= 0) return;
  G.levelQueue--; G.momChoice = {opts:rollMomentum(), t:0}; G.momHidden = false;
  if (!G.momChoice.opts.length){ G.momChoice = null; return; }
}
function pickMomentum(i){
  const ch = G && G.momChoice; if (!ch || G.momHidden) return;
  const x = ch.opts[i]; if (!x) return;
  if (x.kind === 'card'){ G.ranks[x.c.id] = rank(x.c.id) + 1; recompute(); }
  else { (G.orders = G.orders || {})[x.o.id] = orderCount(x.o.id) + 1; x.o.apply(); }
  if (has('kitchen') && G.luck < G.leader.s.luck) G.luck++;
  pop(G.leader.x, G.leader.y - 50, x.name.toUpperCase(), '#9fc8ff'); SFX.play('pick');
  G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:G.mod.radius, life:18, c:'#9fc8ff'});
  G.momChoice = null;
  if (G.levelQueue > 0) openMomentum();
}
// TAB hides the choices (the game runs at full speed) or brings them back.
function toggleMomentum(){
  if (!G || G.over) return;
  if (G.momChoice){ G.momHidden = !G.momHidden; return; }
  if (G.levelQueue > 0) openMomentum();
}
const momentumSlow = () => 1;   // F-41 (Patrick 2026-11-14): the field never pauses for the Momentum choice, in any mode; pick with 7 8 9 when clear

// Every kill pays out straight away: no gems to walk over.
function gainXP(n){
  G.xp += n;
  while (G.xp >= G.xpNext){
    G.xp -= G.xpNext; G.lvl++; G.xpNext = Math.round(G.xpNext * 1.25 + 20); G.levelQueue++;
    SFX.play('level'); G.momFlash = 40; pop(G.leader.x, G.leader.y - 46, 'MOMENTUM RANK ' + G.lvl, '#9fc8ff'); tip('levelup');
  }
  if (G.levelQueue > 0 && !G.momChoice) openMomentum();
}
function killReward(e, B){
  const xp = Math.max(1, Math.round(B.xp * G.mod.loot * (1 + Math.min(1, (G.streak || 0) / 40))));
  G.streak = (G.streak || 0) + 1; G.streakT = 150;
  if (G.streak > (G.bestStreak || 0)) G.bestStreak = G.streak;
  if (G.streak % 25 === 0){ pop(G.leader.x, G.leader.y - 60, G.streak + ' KILL STREAK', '#ffb04a'); SFX.play('coin'); }
  G.fx.push({spark:true, x:e.x, y:e.y - 10, life:28, c:B.boss ? '#ffd860' : '#9fc8ff'});
  gainXP(xp);
}

// The choice strip: bottom-centre, above the ability bar.
// UX W2 (Art 16 Nov): freed hostages more than 420 px behind stop and wait. The HUD counts them apart, and a gold arrow at the
// screen edge points back to them while they are off screen (window.W2ARROW = false: old line, no arrow).
function hostageCount(){
  const walk = G.hostages.filter(h => h.state === 'walk'), wait = walk.filter(h => h.cower).length;
  if (!wait || window.W2ARROW === false || (G.leader && G.leader.down)) return walk.length + ' FOLLOWING YOU';
  return (walk.length - wait) + ' WITH YOU, ' + wait + ' WAITING';
}
/* UX 561ca24 (Art 16 Nov): waiting hostages are violet, so they never read as the gold vault pointer or the cyan ally one */
var W2COL = '#e2a6ff';
function hostageArrow(){
  if (window.W2ARROW === false || G.obj !== 'rescue' || !G.hostages || !G.leader || G.leader.down || G.momChoice) return;
  const w = G.hostages.filter(h => h.state === 'walk' && h.cower); if (!w.length) return;
  let mx = 0, my = 0; for (const h of w){ mx += h.x; my += h.y; } mx /= w.length; my /= w.length;
  const zk = typeof camK === 'function' ? camK() : 1;   /* A2: world offset in drawing units */
  const ox = VW / 2, oy = VH / 2 + (typeof camDY === 'function' ? camDY() : 0), dx = (mx - G.leader.x) * zk, dy = (my - G.leader.y) * zk;
  const top = 64, bot = VH - (window.DECK && DECK.on !== false ? 190 : 70), side = 26;
  if (Math.abs(dx) < VW / 2 - 20 && oy + dy > top && oy + dy < bot) return;   // on screen: the WAITING label shows
  const a = Math.atan2(dy, dx), c = Math.cos(a), s = Math.sin(a);
  let t = Infinity;
  if (c > 0) t = Math.min(t, (VW - side - ox) / c); if (c < 0) t = Math.min(t, (side - ox) / c);
  if (s > 0) t = Math.min(t, (bot - oy) / s); if (s < 0) t = Math.min(t, (top - oy) / s);
  const x = ox + c * t, y = oy + s * t, p = 0.75 + Math.sin(G.frame / 8) * 0.25;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(20,12,4,.7)'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(226,166,255,' + p + ')'; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -9); ctx.lineTo(-3, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
  const lx = Math.max(44, Math.min(VW - 44, x - c * 50)), ly = Math.max(top + 4, Math.min(bot - 4, y - s * 30 + (Math.abs(s) < 0.5 ? -18 : 0)));
  ctx.textAlign = 'center'; ctx.font = 'bold 11px Georgia'; ctx.fillStyle = '#000'; ctx.fillText(w.length + ' WAITING', lx + 1, ly + 5);
  ctx.fillStyle = W2COL; ctx.fillText(w.length + ' WAITING', lx, ly + 4); ctx.textAlign = 'left';
}
function drawMomentum(){
  try { hostageArrow(); } catch (e) {}
  // Momentum bar along the top of the screen
  const k = Math.min(1, G.xp / G.xpNext);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, 9);
  ctx.fillStyle = G.momFlash > 0 ? '#ffffff' : '#5a8ae8'; ctx.fillRect(0, 0, VW * k, 9);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, VW * k, 2);
  if (G.momFlash > 0) G.momFlash--;
  if (G.streakT > 0){ G.streakT--; if (!G.streakT) G.streak = 0; }
  if (G.streak >= 5){ ctx.textAlign = 'right'; ctx.font = 'bold 16px Georgia'; ctx.fillStyle = '#000'; ctx.fillText(`x${G.streak}`, VW - 241, 35); ctx.fillStyle = G.streak >= 25 ? '#ffb04a' : '#ffe9b0'; ctx.fillText(`x${G.streak}`, VW - 242, 34);
    ctx.font = '10px Georgia'; ctx.fillStyle = '#c8bca8'; ctx.fillText('STREAK', VW - 242, 46); ctx.textAlign = 'left'; }
  const ch = G.momChoice;
  if (!ch){ return; }
  if (G.momHidden){
    ctx.textAlign = 'center'; panel(VW/2 - 170, VH - 200, 340, 34);
    ctx.globalAlpha = 0.75 + Math.sin(G.frame / 8) * 0.25; ctx.fillStyle = '#9fc8ff'; ctx.font = 'bold 15px Georgia';
    ctx.fillText(`MOMENTUM READY (${G.levelQueue + 1}): PRESS TAB`, VW/2, VH - 178); ctx.globalAlpha = 1; ctx.textAlign = 'left'; return;
  }
  ch.t++;
  const n = ch.opts.length, CW = Math.min(250, (VW - 60) / 3 - 10), CH = (VW < 640 && window.K56 !== false ? 134 : 112), gap = 12, w = n * CW + (n - 1) * gap, x0 = VW / 2 - w / 2, y0 = VH - 160 - CH - Math.max(0, 20 - ch.t) * 3 - (VW < 640 && window.K56 !== false ? 100 : 0);   // UX K56: clear of the phone stance strip and the contract line
  const ph56 = VW < 640 && window.K56 !== false;
  ch.rects = [];
  const ttl56 = ph56 ? (G.lvl > 0 ? 'MOMENTUM RANK ' + G.lvl : 'MOMENTUM CARD') + ': TAP ONE' : `PAUSED \u00b7 ${G.lvl > 0 ? "MOMENTUM RANK " + G.lvl : "MOMENTUM CARD"}: CHOOSE  [7] [8] [9] or click  \u00b7  TAB to save for later`;
  ctx.textAlign = 'center'; ctx.font = 'bold 15px Georgia'; ctx.fillStyle = '#000'; ctx.fillText(ttl56, VW/2 + 1, y0 - 9);
  ctx.fillStyle = '#ffe9b0'; ctx.fillText(ttl56, VW/2, y0 - 10);
  ch.opts.forEach((o, i) => {
    const x = x0 + i * (CW + gap), hover = CAMP.mouse.x >= x && CAMP.mouse.x <= x + CW && CAMP.mouse.y >= y0 && CAMP.mouse.y <= y0 + CH;
    ch.rects.push({x, y:y0, w:CW, h:CH});
    ctx.fillStyle = hover ? 'rgba(60,46,30,.97)' : 'rgba(28,22,16,.94)'; ctx.fillRect(x, y0, CW, CH);
    ctx.strokeStyle = hover ? '#ffe9b0' : '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y0 + 1, CW - 2, CH - 2);
    abilIconAt(o.glyph, o.col, x + 8, y0 + 10, 36); ctx.imageSmoothingEnabled = false;   // PL-1 item 2: the vector badge, smooth (the false stays for what is drawn after)
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd860'; ctx.font = 'bold 13px Georgia'; if (!ph56) ctx.fillText('[' + (7 + i) + ']', x + CW - 30, y0 + 20);
    ctx.fillStyle = o.kind === 'card' ? '#9fe0ff' : '#e8b080'; ctx.font = 'bold 9.5px Georgia'; ctx.fillText(o.tag.toUpperCase(), x + 52, y0 + 18);
    ctx.fillStyle = '#fff'; { let fs = 14; ctx.font = 'bold 14px Georgia'; while (fs > 10 && ctx.measureText(o.name).width > CW - 58){ fs -= 0.5; ctx.font = 'bold ' + fs + 'px Georgia'; } ctx.fillText(o.name, x + 52, y0 + 36, CW - 58); }   // UX K56: the name fits its card
    ctx.fillStyle = '#d8ccb4'; ctx.font = ph56 ? '10.5px Georgia' : '11.5px Georgia'; wrapText(o.text, x + 10, y0 + (ph56 ? 58 : 62), CW - 20, ph56 ? 12.5 : 14);   // UX K56: five lines clear the rarity tag
  });
  ctx.textAlign = 'left';
}
function wrapText(t, x, y, maxW, lh){
  const words = t.split(' '); let line = '';
  for (const w of words){ const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line){ ctx.fillText(line, x, y); y += lh; line = w; } else line = test; }
  if (line) ctx.fillText(line, x, y);
}
const MOM_CLICK_DELAY = 30;   // [S] frames a Momentum card is shown before a click can pick it
function momInputs(){
  canvas.addEventListener('mousedown', e => {
    if (!G || !G.momChoice || G.momHidden || !G.momChoice.rects) return;
    // UX K2 (2026-11-15): with click-to-shoot a card opened under the pointer and was picked by the shot. Left button only,
    // and not in the first MOM_CLICK_DELAY frames the cards are shown (30 frames [S], UI timing). Keys 1, 2, 3 are not held back.
    if (e.button !== 0 || (G.momChoice.t | 0) < MOM_CLICK_DELAY) return;
    G.momChoice.rects.forEach((r, i) => { if (e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h) pickMomentum(i); });
  });
}

/* ---------------------------------------------------------------------------
   THE HIRING LINE - recruits wait by the campfire between contracts.
   Rolled on Tables 2.1 and 2.2. Paid from the Treasury.
--------------------------------------------------------------------------- */
const hireLineSize = () => 3 + (META.leader && META.leader.race === 'HALF_ELF' ? 1 : 0) + (has('tavern') ? 1 : 0) + (has('barracks') ? 2 : 0) + (mastery('tavern') ? 1 : 0);
const hireGP = r => (r && r.hireGP != null) ? r.hireGP : (r && r.cls === 'SLAVE' && perk('liberation', 6)) ? 0 : (META.leader && META.leader.cls === 'NOBLE' ? 20 : 30);
function hireLine(){
  const H = META.hireLine;
  if (!H || H.size !== hireLineSize()) META.hireLine = {size:hireLineSize(), recruits:Array.from({length:hireLineSize()}, rollRecruit), freeReroll:has('tavern')};
  return META.hireLine;
}
function hireCamp(i){
  const H = hireLine(), r = H.recruits[i];
  if (!r || META.roster.length >= rosterCap() || META.treasury < hireGP(r)) return;
  META.treasury -= hireGP(r); r.id = META.nextId++; delete r.newHire; META.roster.push(r); H.recruits[i] = null;
  SFX.play('coin'); saveMeta(); refreshUI();
}
function rerollCamp(){
  const H = hireLine();
  if (H.freeReroll) H.freeReroll = false; else { if (META.treasury < 15) return; META.treasury -= 15; }
  H.recruits = Array.from({length:H.size}, rollRecruit); SFX.play('pick'); saveMeta(); refreshUI();
}
function hiringHTML(){
  const H = hireLine(), full = META.roster.length >= rosterCap();
  return `<div class="desc" style="text-align:left;margin:6px 0">${esc((window.CAMPAIGN_LINES && CAMPAIGN_LINES.hiring && CAMPAIGN_LINES.hiring.intro) || 'Sellswords waiting by the fire. A new line arrives after every contract.')}${full ? ' <b style="color:#8b0000">The roster is full.</b>' : ''}</div>` +
    H.recruits.map((r, i) => r ? `<div class="line"><img src="${portraitURL(r, false)}"><div class="grow"><b>${esc(r.name)}</b><br>${RACES[r.race].name} ${CLASSES[r.cls].name} ${SPECS[r.spec].name}<br><span style="font-size:14px">${mateLine(r)}</span></div>
      <button ${!full && META.treasury >= hireGP(r) ? '' : 'disabled'} onclick="hireCamp(${i})">Hire, ${hireGP(r) ? hireGP(r) + 'gp' : 'free'}</button></div>`
      : `<div class="line"><div class="grow" style="color:#8a7a62"><i>Signed on.</i></div></div>`).join('') +
    `<button class="btn small" ${H.freeReroll || META.treasury >= 15 ? '' : 'disabled'} onclick="rerollCamp()">NEW FACES (${H.freeReroll ? 'free' : '15gp'})</button>`;
}

/* ---------------------------------------------------------------------------
   MAP ICONS - things on the map look like what they are
--------------------------------------------------------------------------- */
// Draw one sprite as a map icon on a dark disc.
function mapIcon(g, img, x, y, size, ring){
  const s = size / Math.max(img.width, img.height);
  g.fillStyle = 'rgba(20,16,12,.72)'; g.beginPath(); g.arc(x, y, size * 0.62, 0, TAU); g.fill();
  if (ring){ g.strokeStyle = ring; g.lineWidth = 1.5; g.stroke(); }
  g.imageSmoothingEnabled = false; g.drawImage(img, x - img.width * s / 2, y - img.height * s / 2, img.width * s, img.height * s);
}
// S6-C note 10: the foe's painted card (FOE49 via enemyIconURL), shrunk to a map token; a plain silhouette until it loads.
const iconOfEnemy = k => { const key = 'icon:' + k; if (SPR[key]) return SPR[key];
  const c = SPR[key] = faceStandIn(14, 14), u = enemyIconURL(k);
  if (u){ const im = new Image(); im.onload = () => { const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(im, 0, 0, 14, 14); }; im.src = u; }
  return c; };
// The sniper and ambush troops a Blip Token hides, from the contract's own host.
function blipTroops(){
  const pool = hostPool();
  return {sk:pool.filter(k => RANGED_ARCH(BESTIARY[k].arch)), br:pool.filter(k => !RANGED_ARCH(BESTIARY[k].arch))};
}
function blipImage(r){
  if (r <= 2 || r === 5) return PROPS3D.mapBlip(r);   /* S6-C 3a step 5: the model icon, never the pixel token */
  const t = blipTroops(), list = r <= 4 ? (t.sk.length ? t.sk : ['goblinsniper']) : (t.br.length ? t.br : ['brigand']);
  return iconOfEnemy(list[0]);
}
const BLIP_LABEL = r => r <= 2 ? 'Decoy: only tracks' : r <= 4 ? 'Sniper nest' : r === 5 ? 'Pit trap' : 'Ambush';
// A known Blip Token in the field: shown as the thing itself.
function drawKnownBlip(b){
  const r = b.known;
  const tok = (k, y) => typeof w3dToken === 'function' && w3dToken(k, b.x, y);   /* Index 76 */
  if (r <= 2){ if (!tok('m_tracks', b.y + 2)) PROPS3D.knownStandIn(b, 'tracks'); }
  else if (r === 5){ if (!tok('m_pit', b.y + 2)) PROPS3D.knownStandIn(b, 'pit'); }
  else {
    const t = blipTroops(), list = r <= 4 ? (t.sk.length ? t.sk : ['goblinsniper']) : (t.br.length ? t.br : ['brigand']);
    for (let i = 0; i < (r <= 4 ? 2 : 3); i++){ const k = list[i % list.length], spr = enemySprite(k), ox = (i - 1) * 18;
      ctx.globalAlpha = 0.85; drawStub(b, i, spr, b.x + ox, b.y - 6 + (i % 2) * 6, BESTIARY[k].sc * 1.1, 0, i % 2 === 0, false); ctx.globalAlpha = 1; }   /* Index 74 */
    if (!tok('m_hide', b.y + 22)) PROPS3D.knownStandIn(b, 'hide');   /* Index 76 */
  }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
  const lab = BLIP_LABEL(r).toUpperCase(); const w = ctx.measureText(lab).width + 8;
  ctx.fillRect(b.x - w / 2, b.y - 46, w, 13); ctx.fillStyle = r <= 2 ? '#c8a878' : r === 5 ? '#e8c060' : '#ff8a7a'; ctx.fillText(lab, b.x, b.y - 36);
}
// Icons for the objective markers, on the minimap and the full map.
function markerIcon(m){
  if (m.k) return iconOfEnemy(m.k);
  const I = PROPS3D.mapIcon;   /* S6-C 3a step 5: model icons (a soft disc while one bakes), never the pixel sprites */
  return {vault:() => I('m_vault', '#6a6a70'), exit:() => I('m_banner_exit', '#3a8a4a'), fort:() => SPR['icon:fort'] || (SPR['icon:fort'] = TILE.stone()),
    cage:() => I('m_cage', '#5f6870'), wagon:() => I('w_wagon', '#6a5038'), relic:() => I('m_relic', '#c8a040'), nest:() => I('m_nest', '#5a4a2a'), engine:() => I('m_engine', '#6a5038'), beacon:() => I('m_beacon', '#6a5a48'),
    hostage:() => null}[m.sp]?.() || null;
}

/* ============================================================================
   THE CHAPTER BANNER - a simple heraldic banner, designed by the player. Every
   Squad Mate wears a cloak in its colours, it flies over the Chapter House,
   and no enemy is ever dressed in them.
============================================================================ */
const BANNER_COLOURS = ['#7a3e26','#9b2d24','#c8a24a','#d4af37','#3a5a2a','#4e6b2c','#2e4a6a','#3f5ea8','#5a2a6a','#2a2520','#e8e0d0','#8a8a86','#b06a2a','#2a6a6a'];
const BANNER_DIVS = {plain:'Plain', pale:'Per pale', fess:'Per fess', bend:'Per bend', chevron:'Chevron', quarterly:'Quarterly', saltire:'Saltire', bordure:'Bordure'};
const BANNER_GLYPHS = ['sword','shield','star','sun','skull','horn','eye','flame','anvil','bow','heart','cross','thorn','snow','book','horse'];
const banner = () => (META && META.banner && META.banner.c1) ? META.banner : {div:'plain', c1:'#7a3e26', c2:'#d4af37', charge:'#d4af37', glyph:'sword'};   /* Index 35 */
const bannerSig = () => { const b = banner(); return b.div + b.c1 + b.c2 + b.charge + b.glyph; };
function drawBannerArt(P, b, x0, y0){
  // a hanging banner, 12 wide by 15 tall, swallow-tailed at the foot
  const W = 12, H = 13, c1 = b.c1, c2 = b.c2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    let c = c1;
    if (b.div === 'pale' && x >= W / 2) c = c2;
    if (b.div === 'fess' && y >= H / 2) c = c2;
    if (b.div === 'bend' && x > y * W / H) c = c2;
    if (b.div === 'chevron' && y > H - 4 - Math.abs(x - W / 2 + .5) * 0.9 && y > 4) c = c2;
    if (b.div === 'quarterly' && ((x < W / 2) !== (y < H / 2))) c = c2;
    if (b.div === 'saltire' && (Math.abs(x - y * W / H) < 1.4 || Math.abs((W - 1 - x) - y * W / H) < 1.4)) c = c2;
    if (b.div === 'bordure' && (x < 1 || x > W - 2 || y < 1)) c = c2;
    P(x0 + x, y0 + y, 1, 1, c);
  }
  for (let x = 0; x < W; x++) if (x < 4 || x > 7) P(x0 + x, y0 + H, 1, 1, x < 6 ? c1 : (b.div === 'pale' ? c2 : c1));
  for (let x = 0; x < W; x++) if (x < 2 || x > 9) P(x0 + x, y0 + H + 1, 1, 1, x < 6 ? c1 : (b.div === 'pale' ? c2 : c1));
  glyph(P, b.glyph, x0 + 2, y0 + 3, b.charge);
}
function bannerCanvas(b, withPole){
  const c = newCanvas(withPole ? 16 : 14, withPole ? 22 : 17), P = painter(c.getContext('2d'));
  if (withPole){ P(1, 0, 1, 22, C.woodD); P(1, 0, 14, 1, C.wood); P(0, 0, 3, 1, C.gold); drawBannerArt(P, b, 2, 1); }
  else drawBannerArt(P, b, 1, 1);
  return outline(c);
}
const bannerURL = (b, big) => toURL('bn:' + (b.div + b.c1 + b.c2 + b.charge + b.glyph) + (big ? 'B' : ''), () => bannerCanvas(b, false), big ? 8 : 4);
let BED = null;   // the banner being designed
function bannerEditorHTML(){
  if (!BED) BED = Object.assign({}, banner());
  const sw = (key) => BANNER_COLOURS.map(c => `<button title="${c}" onclick="BED.${key}='${c}';renderPanel()" style="width:22px;height:22px;margin:1px;border:${BED[key] === c ? '3px solid #fff;outline:2px solid var(--ink)' : '1px solid #2a2520'};background:${c};cursor:pointer;padding:0"></button>`).join('');
  return `<h2>The Chapter Banner</h2>
    <div style="text-align:center"><img src="${bannerURL(BED, true)}" style="height:150px;image-rendering:pixelated"></div>
    <div class="desc" style="text-align:left">Every Squad Mate wears a cloak in the field colour, the Leader's trimmed with the second colour. It flies over the Chapter House. No enemy will ever wear these colours.</div>
    <div class="desc" style="text-align:left;margin-top:6px"><b>Field</b></div><div>${sw('c1')}</div>
    <div class="desc" style="text-align:left;margin-top:4px"><b>Second colour</b></div><div>${sw('c2')}</div>
    <div class="desc" style="text-align:left;margin-top:4px"><b>Division</b></div><div class="mini" style="justify-content:flex-start">${Object.entries(BANNER_DIVS).map(([k, n]) => `<button style="${BED.div === k ? 'background:var(--ink-soft);color:#fff' : ''}" onclick="BED.div='${k}';renderPanel()">${n}</button>`).join('')}</div>
    <div class="desc" style="text-align:left;margin-top:4px"><b>Charge</b></div><div class="mini" style="justify-content:flex-start">${BANNER_GLYPHS.map(gl => `<button style="padding:2px;${BED.glyph === gl ? 'background:var(--ink-soft)' : ''}" onclick="BED.glyph='${gl}';renderPanel()"><img src="${toURL('gl:' + gl, () => { const c = newCanvas(9, 9); glyph(painter(c.getContext('2d')), gl, 1, 1, '#2a2520'); return c; }, 3)}" style="height:22px;image-rendering:pixelated;display:block"></button>`).join('')}</div>
    <div class="desc" style="text-align:left;margin-top:4px"><b>Charge colour</b></div><div>${sw('charge')}</div>
    <button class="btn gold" onclick="saveBanner()">RAISE THE BANNER</button>`;
}
function saveBanner(){ delete SPR['bc:palisade']; META.banner = Object.assign({}, BED); META.bannerSet = true; BED = null; saveMeta(); CAMP.dirty = true; SFX.play('win'); closePanel(); refreshUI(); }
// Colour distance in RGB: enemies never wear the Chapter's colours.
function colDist(a, b){ const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return Math.hypot((x >> 16) - (y >> 16), (x >> 8 & 255) - (y >> 8 & 255), (x & 255) - (y & 255)); }
const ENEMY_SAFE = ['#5a4a3a','#4a4450','#6a5a44','#3c3c48','#6b5a42','#4a3a2a','#5e6e4a','#7a6a4e'];
function unBanner(look){
  const b = banner(), out = Object.assign({}, look);
  for (const k of ['cape','capeTrim','top','acc','hood','hat','shieldCol','helm','legs','robeCol'])
    if (out[k] && out[k][0] === '#' && out[k].length === 7 && (colDist(out[k], b.c1) < 60 || colDist(out[k], b.c2) < 60))
      out[k] = ENEMY_SAFE.find(s => colDist(s, b.c1) >= 60 && colDist(s, b.c2) >= 60) || '#5a4a3a';
  return out;
}

/* ============================================================================
   ENEMY KIT - the enemy wears the same kinds of armour as the Chapter does,
   heavier as the tier rises. Casters keep their robes.
============================================================================ */
const ENEMY_ARMOUR = {levy:'rag', brigand:'quilt', enforcer:'studs', hobgob:'scale', renegade:'chain', raider:'studs', phalanx:'plate', warden:'plate',
  crossbow:'quilt', arbalest:'studs', shadowhunter:'chain', vane:'studs', ilvaryn:'plate', devil:'plate', cutthroat:'quilt', pikeman:'chain', skeleton:'bands', ghoul:'rag'};
function enemyLook(kind){
  const look = Object.assign({}, ENEMY_LOOK[kind]);
  const ap = ENEMY_ARMOUR[kind]; if (ap){ look.armour = ap === 'rag' ? 'quilt' : ap; }
  return unBanner(look);
}

/* ============================================================================
   NEW ENEMIES - each force gets troops of its own.
============================================================================ */
Object.assign(BESTIARY, {
  cutthroat:{name:'Cutthroat',            arch:'brute', tier:1, con:3, ac:4, shift:0, dmg:2, skill:2, speed:1.1,  r:9,  colour:'#4a3a2a', xp:2, coin:2, sc:2},
  pikeman:  {name:'Deserter Pikeman',     arch:'brute', tier:1, con:4, ac:5, shift:1, dmg:3, skill:1, speed:0.78, r:10, colour:'#5a6470', xp:3, coin:2, sc:2},
  skeleton: {name:'Hollow Bones',         arch:'brute', tier:1, con:2, ac:4, shift:1, dmg:2, skill:1, speed:0.8,  r:9,  colour:'#d8d0c0', xp:2, coin:1, sc:2, frenzy:true},
  ghoul:    {name:'Barrow Ghoul',         arch:'beast', tier:2, con:4, ac:4, shift:0, dmg:3, skill:3, speed:1.35, r:10, colour:'#7a8a6a', xp:4, coin:1, sc:2, frenzy:true},
  wolfrider:{name:'Goblin Wolf-Rider',    arch:'brute', tier:1, con:4, ac:4, shift:0, dmg:2, skill:2, speed:1.5,  r:11, colour:'#8db04a', xp:4, coin:2, sc:2},
  spider:   {name:'Giant Spider',         arch:'beast', tier:1, con:2, ac:4, shift:0, dmg:2, skill:2, speed:1.25, r:9,  colour:'#3a3036', xp:2, coin:1, sc:2},
  bear:     {name:'Cave Bear',            arch:'beast', tier:2, con:9, ac:5, shift:1, dmg:4, skill:3, speed:0.95, r:15, colour:'#5a3a22', xp:7, coin:2, sc:2.4}
});
Object.assign(ENEMY_LOOK, {
  cutthroat:{skin:'#c98d5f', hair:'#2a1a12', top:'#4a3a2a', head:'hood', hood:'#3a2e22', mask:true, weapon:'dagger', legs:'#2a2420'},
  pikeman:  {skin:'#e0aa84', hair:'#3a2a1a', top:'#6a7078', acc:'#5a4030', head:'helmet', helm:'#8f98a2', weapon:'pike', legs:'#3a3226', beard:true},
  skeleton: {skin:'#e8e0cc', hair:'#e8e0cc', hairStyle:'bald', top:'#c8c0a8', acc:'#8a8270', legs:'#c8c0a8', weapon:'sword', eye:'#ff6a3a'},
  ghoul:    {skin:'#8a9a7a', hair:'#3a3a2a', hairStyle:'messy', top:'#4a4a3a', legs:'#3a3a2a', weapon:'twin', eye:'#e8f060', bulky:true}
});
// Size records only (step 5 phase B): spider, bear, wolfrider draw in 3D or via figPlaceholder.
function customEnemySprite(kind){
  if (kind === 'spider' || kind === 'bear'){
    const key = 'b:' + kind; if (SPR[key]) return SPR[key];
    const W = kind === 'bear' ? 26 : 21, H = kind === 'bear' ? 19 : 15;
    return SPR[key] = {frames:[], white:[], ax:W >> 1, ay:H - 6, w:W, h:H};
  }
  if (kind === 'wolfrider'){
    if (SPR['b:wolfrider']) return SPR['b:wolfrider'];
    return SPR['b:wolfrider'] = {frames:[], white:[], ax:13, ay:16, w:26, h:26};
  }
  return null;
}
// Each force fields its own troops (replaces the shared pools).
Object.assign(HOSTS.bandits.pools,    {1:['brigand','cutthroat','crossbow','brigand'], 2:['enforcer','cutthroat','renegade','crossbow','hedgewitch','arbalest'], 3:['renegade','arbalest','battlemage','shadowhunter','warden','cutthroat']});
Object.assign(HOSTS.greenskins.pools, {1:['goblinsniper','wolfrider','wolf','goblinsniper'], 2:['hobgob','wolfrider','goblinsniper','sapper'], 3:['hobgob','sapper','wolfrider','warden']});
Object.assign(HOSTS.monsters.pools,   {1:['wolf','spider','cinder','spider'], 2:['wolf','bear','spider','cinder','hedgewitch'], 3:['bear','cinder','raider','warden','spider']});
Object.assign(HOSTS.hollow.pools,     {1:['skeleton','levy','skeleton','hedgewitch'], 2:['skeleton','ghoul','tithepriest','levy'], 3:['ghoul','skeleton','tithepriest','phalanx']});
Object.assign(HOSTS.deserters.pools,  {1:['pikeman','crossbow','enforcer'], 2:['pikeman','renegade','arbalest','tithepriest'], 3:['phalanx','pikeman','shadowhunter','warden','tithepriest']});

/* ============================================================================
   NEMESES - named commanders who get away (a withdrawal at a Parley, an
   Assassination mark who escapes, or anyone left standing when a contract
   ends) remember the Chapter. They come back on later contracts against the
   same force, a little stronger for every escape.
============================================================================ */
const nemeses = () => (META.nemeses = META.nemeses || []);
function recordNemesis(e){
  if (!e || !e.name || !BESTIARY[e.k].boss || e.nemRecorded) return;
  e.nemRecorded = true;
  const N = nemeses(), old = N.find(n => n.name === e.name);
  if (old){ old.grudge++; old.since = META.deployments; G.newNemesis = (G.newNemesis || []).concat(old.name + ' (grudge ' + old.grudge + ')'); return; }
  N.push({name:e.name, k:e.k, host:G.contract.host, grudge:1, since:META.deployments, met:1});
  if (N.length > 6) N.shift();
  G.newNemesis = (G.newNemesis || []).concat(e.name);
}
// When a commander spawns, a nemesis from this force may take their place.
function pickNemesis(k){
  if (G && !G.nemUsed && G.contract && G.contract.detNemesis){ const t = nemeses().find(n => n.name === G.contract.detNemesis); if (t){ G.nemUsed = true; return t; } }   /* Index DET1: revenge target */
  if (!G || G.nemUsed || G.obj === 'defend' && Math.random() < .5) return null;
  const N = nemeses().filter(n => n.host === G.contract.host && n.since < META.deployments);
  if (!N.length || Math.random() > 0.45 + 0.1 * N.length) return null;
  G.nemUsed = true; return N[Math.random() * N.length | 0];
}
function nemesisSlain(e, how){
  const N = nemeses(), i = N.findIndex(n => n.name === e.name); if (i < 0) return;
  N.splice(i, 1); st().nemesesSlain = (st().nemesesSlain || 0) + 1;
  const bounty = 40 * (e.nemesis ? e.nemesis.grudge : 1) * (G.contract.tier || 1); G.coin += bounty;
  note(how === 'surrender' ? `${e.name}, your nemesis, is in chains at last.` : `${e.name}, your nemesis, will trouble the Chapter no more. +${bounty} coin.`);
  pop(e.x, e.y - 70, 'NEMESIS DEFEATED', '#ffb04a'); G.slowmo = 60;
}
const nemesisFor = host => nemeses().filter(n => n.host === host);

/* ============================================================================
   TRAPS - the enemy sets traps on its roads and around what it guards. They
   are hidden until someone gets close (further with a Sapper's Yard, a
   Ranger's veteran, or Deep Reconnaissance); a Scoundrel standing near a
   spotted trap disarms it. In a camp raid the Chapter sets its own.
============================================================================ */
const TRAPS = {
  caltrops:{name:'Caltrops',       text:'A scatter of iron spikes: anyone crossing takes 1 damage and is slowed for 4 seconds.'},
  beartrap:{name:'Snare',          text:'A toothed snare: the victim is held for 3 seconds and wounded.'},
  tripwire:{name:'Tripwire',       text:'A bell on a line: it raises the alarm and brings an ambush down on you.'},
  deadfall:{name:'Deadfall',       text:'Logs strung in the trees: a blast of falling timber 2 seconds after it is tripped.'},
  firepot: {name:'Fire Pots',      text:'Buried pots of oil: the ground bursts into flame for 8 seconds.'},
  stakes:  {name:'Stake Line',     text:'Sharpened stakes: 2 damage a second to anything pushing through.'}
};
const ENEMY_TRAP_KINDS = ['caltrops','beartrap','tripwire','deadfall','firepot'];
const trapSight = () => 110 + (has('trapyard') ? 70 : 0) + (mastery('ranger') ? 50 : 0);
function placeTraps(c){
  G.traps = []; if (c.obj === 'defend' || c.obj === 'hold') return;
  const n = 2 + c.tier * 2 + (c.obj === 'escort' ? 3 : 0), r = rng((c.seed || 1) + 99), recon = (c.edges || []).includes('recon');
  const spots = [];
  if (c.obj === 'escort'){ const R = MAP.route; for (let i = 0; i < n; i++){ const p = R[Math.floor(R.length * (0.12 + 0.82 * (i + r()) / n))]; spots.push({x:p.x + (r() - .5) * 40, y:p.y + (r() - .5) * 40}); } }
  else {
    const anchors = [].concat(G.vaults || [], G.cages || [], G.beacons || [], MAP.nests || [], MAP.engines || [], G.camps || [], MAP.relic ? [MAP.relic] : [], MAP.markRoute || []);
    for (let i = 0; i < n * 3 && spots.length < n; i++){
      const a = anchors.length && r() < 0.7 ? anchors[r() * anchors.length | 0] : {x:(2 + r() * (MAP.w - 4)) * CELL, y:(2 + r() * (MAP.h - 4)) * CELL};
      const ang = r() * TAU, d = 90 + r() * 120, p = {x:a.x + Math.cos(ang) * d, y:a.y + Math.sin(ang) * d};
      if (blockedXY(p.x, p.y) || dist(p, G.leader) < 300) continue; spots.push(p);
    }
  }
  for (const p of spots) if (!blockedXY(p.x, p.y)) G.traps.push({x:p.x, y:p.y, kind:ENEMY_TRAP_KINDS[r() * ENEMY_TRAP_KINDS.length | 0], armed:true, seen:recon, enemy:true, dis:0});
}
function trapEffect(t, victim){
  t.armed = false; t.sprungBy = victim ? {leader: victim === G.leader, wagon: victim === G.wagon, spec: victim.spec || null, name: (victim.p && victim.p.name) || victim.name || ''} : null;   /* a plain record, not a live unit (LE 58040a75) */ const k = t.kind, L = G.leader;
  pop(t.x, t.y - 30, TRAPS[k].name.toUpperCase() + '!', '#ff8a5a'); G.shake = Math.max(G.shake, 8);
  if (t.enemy){
    if (victim === G.wagon || victim === G.house){ damageObjective(victim, k === 'deadfall' ? 6 : k === 'caltrops' ? 2 : 4); if (victim === G.wagon && k !== 'tripwire') victim.stall = 180; }
    if (k === 'caltrops'){ G.trapSlow = 240; for (const u of squadUnits()) if (dist(u, t) < 60){ pop(u.x, u.y - 18, '-1', '#ff8a6a'); hurtSquad(1, u === L ? null : u, true); } }
    if (k === 'beartrap' && victim && victim !== G.wagon){ let d = damageRoll(3, 0); if (t.lesson && victim !== L && typeof victim.con === 'number') d = Math.max(0, Math.min(d, victim.con - 1));   /* 17e (GD 2182bf45): the lesson trap never downs a mate, 1 health at least */ pop(victim.x, victim.y - 18, '-' + d, '#ff8a6a');
      if (t.lesson && victim !== L && typeof victim.con === 'number'){ victim.con -= d; victim.flash = 10; }   /* 17f (GD b8281eec): the mate takes it himself; hurtSquad would draw the Leader's Wounds first */
      else hurtSquad(d, victim === L ? null : victim);
      if (victim === L) G.snareT = 180; else victim.hold = 180; pop(victim.x, victim.y - 30, 'SNARED', '#ff8a5a'); }
    if (k === 'tripwire'){ SFX.play('horn'); G.alarm++; const pool = hostPool(); for (let i = 0; i < 3 + G.contract.tier; i++){ const a = Math.random() * TAU, e = spawnEnemy(pickOf(pool), t.x + Math.cos(a) * 220, t.y + Math.sin(a) * 220); if (e) e.seen = true; } note('A tripwire bell! They are coming.'); }
    if (k === 'deadfall') G.hazards.push({x:t.x, y:t.y, r:66, t:110, max:110, kind:'deadfall', skill:4, dmg:4});
    if (k === 'firepot'){ G.fires.push({x:t.x, y:t.y, r:46, life:480, enemy:true}); SFX.play('blast'); }
  } else {
    // the Chapter's own traps, sprung by the enemy
    const near = G.enemies.filter(e => !e.dead && dist(e, t) < (k === 'firepot' ? 60 : 40));
    if (k === 'caltrops') for (const e of near){ hurtEnemy(e, 1); e.slow = Math.max(e.slow || 0, 240); }
    if (k === 'beartrap' && victim){ victim.stagger = Math.max(victim.stagger || 0, 240); hurtEnemy(victim, damageRoll(3, victim.shift)); }
    if (k === 'firepot'){ G.burned = true; G.fires.push({x:t.x, y:t.y, r:50, life:480, friendly:true}); for (const e of near) hurtEnemy(e, 2); SFX.play('blast'); }
    if (k === 'stakes'){ t.armed = true; t.uses = (t.uses || 6) - 1; if (t.uses <= 0) t.armed = false; if (victim) hurtEnemy(victim, 2); }
  }
}
function updateTraps(){
  if (!G.traps) return;
  const L = G.leader, sight = trapSight(), units = squadUnits(), scoundrels = units.filter(u => u.spec === 'SCOUNDREL'), t2e = (window.TRAP2E && TRAP2E.live());
  if (t2e) TRAP2E.tick();   /* S6-11 (2e): stand still and the Scoundrel goes to it (js/combat/disarm.js) */
  for (const t of G.traps){
    if (!t.armed) continue;
    if (t.enemy){
      if (!t.seen && units.some(u => dist(u, t) < sight * (u === L ? 1 : 0.6) * (u.p && u.p.race === 'GOBLIN' ? 1.4 : 1))){ t.seen = true; pop(t.x, t.y - 26, 'TRAP SPOTTED', '#ffd860'); tip('trap'); }
      if (t2e && !t.armed) continue;   /* disarmed this frame by TRAP2E.tick */
      if (!t2e && t.seen && scoundrels.some(u => dist(u, t) < 70)){ if (++t.dis > 90){ t.armed = false; pop(t.x, t.y - 26, 'DISARMED', '#8fd39a'); SFX.play('knife'); continue; } }
      const v = units.find(u => dist(u, t) < 18 && !(t2e && TRAP2E.spares(t, u))) || (G.wagon && G.wagon.hp > 0 && dist(G.wagon, t) < 30 ? G.wagon : null);
      if (v) trapEffect(t, v);
    } else if (G.frame % (t.kind === 'stakes' ? 60 : 1) === 0){
      const v = G.enemies.find(e => !e.dead && !e.dormant && BESTIARY[e.k].arch !== 'fixed' && dist(e, t) < (t.kind === 'stakes' ? 36 : 22));
      if (v) trapEffect(t, v);
    }
  }
  if (G.trapSlow > 0) G.trapSlow--;
  if (G.snareT > 0) G.snareT--;
}
function drawTraps(onScreen){
  if (!G.traps) return;
  if (window.TRAP2E && TRAP2E.live()) TRAP2E.ground(onScreen);   /* S6-11: the tick where a trap was made safe */
  for (const t of G.traps){
    if (!t.armed || (t.enemy && !t.seen) || !onScreen(t)) continue;
    if (t.enemy && !(window.TRAP2E && TRAP2E.live())){ ctx.strokeStyle = 'rgba(255,90,60,' + (0.45 + Math.sin(G.frame / 8) * 0.25) + ')'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (!(typeof w3dTrap === 'function' && w3dTrap(t.kind, t.x, t.y))) PROPS3D.trapStandIn(t);   /* Index 76 */
    if (t.enemy && t.dis > 0 && !(window.TRAP2E && TRAP2E.live())){ ctx.strokeStyle = '#8fd39a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, 28, -Math.PI / 2, -Math.PI / 2 + TAU * t.dis / 90); ctx.stroke(); }
  }
}

window.CONTRACTS_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      ok('HOSTS has all 5 base hosts', ['bandits', 'greenskins', 'monsters', 'hollow', 'deserters'].every(k => !!HOSTS[k]));
      ok('CONTRACT_TIER_MAX is 3', CONTRACT_TIER_MAX === 3);
      const c1 = makeContract('hunt', 1), c3 = makeContract('escort', 3), cHi = makeContract('rescue', 99);
      ok('makeContract builds valid T1 hunt', c1 && c1.obj === 'hunt' && c1.tier === 1 && !!HOSTS[c1.host] && c1.pay > 0);
      ok('makeContract clamps tier to CONTRACT_TIER_MAX', cHi && cHi.tier === CONTRACT_TIER_MAX);
      ok('T3 escort pays more than T1 hunt', c3 && c3.pay > c1.pay, c3.pay + ' vs ' + c1.pay);
      ok('TRAPS defines all 6 trap kinds', ['caltrops', 'beartrap', 'tripwire', 'deadfall', 'firepot', 'stakes'].every(k => !!TRAPS[k]));
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};

