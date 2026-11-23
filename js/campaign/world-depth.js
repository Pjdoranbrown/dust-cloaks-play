/* js/campaign/world-depth.js (INT-1 step 2, 2026-11-16): INDEX 19 (world depth, factions, contract rebalance).
   Cut unchanged from the inline script in index.html (old lines 11387 to 12134). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 19 - WORLD DEPTH (6 ARCADIA REGIONS & 10 FACTIONS), CONTRACT REBALANCE,
   4 NEW LORE SCENARIOS (AMBUSH, BREACH, QUARRY, PLAGUE), AND CLERIC DEVOTION
============================================================================ */

/* ---- 1. Ten Canonical Factions of Arcadia & Two New Enemy Hosts ---------- */
Object.assign(FACTIONS, {
  frostvault:{name:'Frost-Vault Houses',   patron:'Hrimheim House Envoy',  perk:'Hrimheim Shadow-Silk: deploy under Favourable Approach fog for 45s and +1 Ward Token.'},
  orcs:      {name:'Steppe Orc Clans',     patron:'Steppe Clan Outrider',  perk:"Khan Duruk's Blood-Oath: +2 Mount Pool, and melee swings on a Charge deal +1 flat damage."},
  arcana:    {name:'Imperial Arcana Guild',patron:'Arcana Guild Magister', perk:'Sanctioned Seal: Mages and Witches bring a free Scroll of Fireball in Carried Supplies.'},
  greycloaks:{name:'The Dust Cloaks Council', patron:'Dust Cloaks Arbiter',    perk:'Even Hand: +1 Max Luck on every contract, and rival factions never dock Standing.'}
});
for (const fk of ['frostvault', 'orcs', 'arcana', 'greycloaks']){
  const pat = FACTIONS[fk].patron;
  if (!PATRONS.includes(pat)) PATRONS.push(pat);
}
Object.assign(HOSTAGE_FOLK, {
  frostvault:'Hrimheim noble envoys',
  orcs:'Steppe Orc outriders',
  arcana:'Arcana Guild scholars',
  greycloaks:'Dust Cloak chroniclers'
});
Object.assign(FACTION_LOOK, {
  empire:    {glyph:'sun',    col:'#b8963a', at:[18, 42]},
  skulk:     {glyph:'eye',    col:'#3a3a44', at:[30, 56]},
  mendor:    {glyph:'cross',  col:'#c8c0a8', at:[26, 83]},
  dwarves:   {glyph:'anvil',  col:'#7a6a5a', at:[51, 44]},
  frostvault:{glyph:'shield', col:'#4a5a7a', at:[54, 15]},
  greycloaks:{glyph:'star',   col:'#6a7278', at:[53, 66]},
  arcana:    {glyph:'star',   col:'#3a6a9a', at:[34, 30]},
  suderia:   {glyph:'horn',   col:'#3a7a4a', at:[75, 42]},
  reprobates:{glyph:'potion', col:'#6a3a8a', at:[72, 66]},
  orcs:      {glyph:'sword',  col:'#9a3a24', at:[86, 56]}
});
Object.assign(FACTION_HOST, {
  frostvault:'deserters', orcs:'orcs', arcana:'arcana', greycloaks:'bandits'
});
Object.assign(COMMANDER_FACTION, {
  ilvaryn:'frostvault', ogre:'orcs', alpha:'orcs', orsolt:'mendor'
});
Object.assign(HOSTS, {
  orcs:  {name:'Steppe Orc warbands', the:'a Steppe Orc warband', den:'Orc War-Tent',
          pools:{1:['hobgob','wolf','goblinsniper','hobgob'], 2:['hobgob','raider','sapper','wolf'], 3:['raider','warden','sapper','hobgob']},
          bosses:{1:['alpha'], 2:['ogre','alpha'], 3:['ogre','wyrm']}},
  arcana:{name:'Arcana Guild enforcers', the:'Arcana Guild enforcers', den:'Arcane Pylon',
          pools:{1:['crossbow','enforcer','hedgewitch'], 2:['arbalest','hedgewitch','battlemage','enforcer'], 3:['battlemage','warden','arbalest','inquisitor']},
          bosses:{1:['vane'], 2:['inquisitor','vane'], 3:['inquisitor','devil']}}
});
for (const hk of ['orcs', 'arcana']) if (!HOST_KEYS.includes(hk)) HOST_KEYS.push(hk);

// Rival factions: earning Allied (+2) or completing a Tier 3 job for a superpower creates friction with its rival (unless allied with the Dust Cloaks Council; the key 'greycloaks' is the old name of the same company).
const FACTION_RIVAL = {
  empire:'suderia', suderia:'empire',
  arcana:'reprobates', reprobates:'arcana',
  mendor:'frostvault', frostvault:'mendor',
  dwarves:'orcs', orcs:'dwarves',
  skulk:'mendor'
};

/* ---- 2. The Six Canonical Regions of Arcadia (Manual Ch. 8-9 & Encyclopedia) ---- */
const REGIONS = {
  heartland:{
    id:'heartland', name:'Western Imperial Heartland',
    towns:['Terados', 'Zenbos', 'Trilshan', 'Low Arden'],
    places:['the Teradosian Crown-Road', 'the Zenbos Canal-Wards', 'Trilshan Downs', 'the Imperial Coast'],
    factions:['empire', 'skulk', 'arcana'],
    hosts:['bandits', 'deserters', 'hollow'],
    coords:[[16, 40], [27, 54], [14, 62], [23, 32]]
  },
  marches:{
    id:'marches', name:'Contested Frontier Marches',
    towns:["Ban'Ra", 'Cois Abhann', 'Aberdine', 'Dunmorrow', 'Levoria'],
    places:["the Ban'Ra Quarantine Fen", 'Cois Abhann Ford', 'the Bloody Field', 'the Aberdine Timber-Road', 'Levoria Vale'],
    factions:['skulk', 'empire', 'mendor', 'greycloaks'],
    hosts:['hollow', 'bandits', 'monsters', 'deserters'],
    coords:[[38, 46], [41, 60], [36, 34], [44, 52], [39, 70]]
  },
  mendor:{
    id:'mendor', name:'Island Citadel of Mendor',
    towns:['Mendor Citadel', 'Saint Ivo', 'Sun-Havens'],
    places:['the White Cliffs of Mendor', 'Saint Ivo Reliquary', 'the Solar Causeway'],
    factions:['mendor', 'empire'],
    hosts:['hollow', 'monsters', 'deserters'],
    coords:[[28, 82], [22, 85], [34, 80]]
  },
  spine:{
    id:'spine', name:'Central Spine & Qloria Ruins',
    towns:['Kraggan', 'Solis', 'Tarim', 'Varnholt'],
    places:['the Kraggan Iron-Pass', 'the Ruins of Qloria', 'the Solis Road', 'Tarim Gorge', 'Varnholt Valley'],
    factions:['dwarves', 'greycloaks', 'arcana', 'reprobates'],
    hosts:['greenskins', 'monsters', 'arcana', 'orcs'],
    coords:[[52, 42], [54, 64], [49, 54], [56, 34], [48, 38]]
  },
  frost:{
    id:'frost', name:'Northern Frost-Vaults',
    towns:['Hrimheim', 'Coldwater', 'Rime-Gate'],
    places:['the Hrimheim Under-Gate', 'the Geothermal Vents', 'the Frost-Vault Marches', 'Coldwater Glacier'],
    factions:['frostvault', 'dwarves', 'mendor'],
    hosts:['deserters', 'monsters', 'hollow'],
    coords:[[55, 14], [45, 18], [64, 16], [50, 22]]
  },
  freelands:{
    id:'freelands', name:'Free Lands of Suderia & Steppe',
    towns:['Kalloon', 'Terios', 'Pasan', 'Duruk\u2019s Hold'],
    places:['the Kalloon Trade-Road', 'the Terios Outlaw Fen', 'the Pasan Borderlands', 'the Eastern Blood-Steppe'],
    factions:['suderia', 'reprobates', 'orcs', 'greycloaks'],
    hosts:['orcs', 'greenskins', 'bandits', 'arcana'],
    coords:[[74, 42], [71, 64], [80, 50], [88, 58]]
  }
};
const REGION_KEYS = Object.keys(REGIONS);

// Enhanced Arcadia Map showing the 6 Regions, Central Spine, Northern Frost-Vaults, Mendor, and the Great River
mapURL = function(){
  return toURL('arcadia:v19', () => {
    const W = 180, H = 104, c = newCanvas(W, H), g = c.getContext('2d'), P = painter(g), r = rng(616);
    const n = valueNoise(W, H, 15, r), n2 = valueNoise(W, H, 5, r);
    const land = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const ex = (x - W * 0.52) / (W * 0.49), ey = (y - H * 0.47) / (H * 0.50);
      let v = n(x, y) * 0.75 + n2(x, y) * 0.25 - (ex * ex + ey * ey) * 0.52;
      if (Math.hypot(x - W * 0.27, y - H * 0.83) < 8) v = 1;               // Island of Mendor
      if (Math.hypot(x - W * 0.27, y - H * 0.83) < 11 && Math.hypot(x - W * 0.27, y - H * 0.83) >= 8) v = -1;
      land[y * W + x] = v > 0.20 ? 1 : 0;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const L = land[y * W + x];
      if (!L){ P(x, y, 1, 1, (x + y * 2) % 6 === 0 ? '#8fa6a4' : '#a8bebc'); continue; }
      // Regional biome tinting: Frost-Vaults (north), Central Spine (mid), Free Lands & Steppe (east), Southern Waste (south-east), Heartland (west)
      let col = (x * 7 + y * 3) % 11 === 0 ? '#cfbc92' : '#dccba4';
      if (y < H * 0.24 && x > W * 0.35 && x < W * 0.72) col = (x + y) % 5 === 0 ? '#c4d2dc' : '#d6e2ea'; // Frost-Vaults
      else if (x > W * 0.65 && y > H * 0.28 && y < H * 0.76) col = (x + y) % 7 === 0 ? '#c8b878' : '#d6c68a'; // Suderia & Steppe
      else if (x > W * 0.45 && x <= W * 0.65) col = (x + y) % 6 === 0 ? '#b8aa8c' : '#c6b89a'; // Central Spine
      P(x, y, 1, 1, col);
      const edge = !land[y * W + x - 1] || !land[y * W + x + 1] || !land[(y - 1) * W + x] || !land[(y + 1) * W + x];
      if (edge) P(x, y, 1, 1, '#4a3b2a');
    }
    // Central Mountain Spine (Kraggan to Solis)
    for (let i = 0; i < 14; i++){ const x = 86 + (i % 3) * 3 + (r() * 4 | 0), y = 14 + i * 5; if (y < H - 10){ P(x, y + 2, 5, 1, '#4a3b2a'); P(x + 1, y + 1, 3, 1, '#4a3b2a'); P(x + 2, y, 1, 1, '#6a5a46'); } }
    // Western & Frontier Forests
    for (let i = 0; i < 55; i++){ const x = 18 + r() * 64 | 0, y = 20 + r() * 52 | 0; if (land[y * W + x]) P(x, y, 1, 1, '#557438'); }
    // Cois Abhann / Ban'Ra Frontier River & Suderian River
    for (let startX of [68, 128]){
      let rx = startX, ry = 18;
      for (let i = 0; i < 72; i++){ rx += (r() - .48) * 1.6; ry += 1; if (ry >= H || !land[(ry | 0) * W + (rx | 0)]) break; P(rx | 0, ry | 0, 1, 1, '#4e7294'); }
    }
    // Compass rose
    P(164, 84, 1, 13, '#4a3b2a'); P(158, 90, 13, 1, '#4a3b2a'); P(163, 82, 3, 2, '#8b0000');
    return c;
  }, 4);
};

/* ---- 3. Rebalance Existing Contracts & Add 4 New Lore Scenarios ---------- */
// Remove 'hold' from the 0.45x XP penalty (give it 0.78x so players earn normal Momentum ranks!)
WAVE_FIGHTS.delete('hold');
{ const f = gainXP; gainXP = n => f(G && G.obj === 'hold' ? n * 0.78 : n); }

Object.assign(OBJECTIVES, {
  ambush: {name:'Supply Line Ambush',     brief:'Intercept and wreck or capture the three enemy supply wagons before they cross the valley.'},
  breach: {name:'Breach & Seize',         brief:'Storm the enemy fort, slay its castellan, and hold the courtyard banner for 20 seconds.'},
  quarry: {name:'Mana-Quarry Heist',      brief:'Harvest three Raw Mana Cores from the unstable crystal seams, then escape by the road.'},
  plague: {name:'Plague-Gem Containment', brief:'Smash all three Necrotic Obelisks before the townsfolk turn into Hollow dead.'}
});

Object.assign(CONTRACTS, {
  ambush: {name:'Supply Line Ambush',     pay:310, desc:c => `A prize convoy of ${c.cargo} guarded by ${HOSTS[c.host].the} is marching ${DIRS[c.dir]} through ${c.place}. Ambush and wreck all three wagons before they escape the valley.`},
  breach: {name:'Breach & Seize',         pay:340, desc:c => `${cap(HOSTS[c.host].the)} ${typeof hostBe === 'function' ? hostBe(c.host, 'have', 'has') : 'have'} fortified a border keep at ${c.place}. Storm the gates, kill their commander, and hold the courtyard for 20 seconds.`},
  quarry: {name:'Mana-Quarry Heist',      pay:310, desc:c => `Unstable raw-mana veins have been uncovered at ${c.place}, worked by ${HOSTS[c.host].the}. Crack three crystal seams while dodging arcane lightning, then get out.`},
  plague: {name:'Plague-Gem Containment', pay:310, desc:c => `Necrotic Plague-Gems have been planted in ${c.town} by ${HOSTS[c.host].the}. Smash all three obelisks before the sickness turns the townsfolk into Hollow dead.`}
});
for (const ck of ['ambush', 'breach', 'quarry', 'plague']) if (!CONTRACT_KEYS.includes(ck)) CONTRACT_KEYS.push(ck);

// Override makeContract to use the 6 Canonical Regions of Arcadia and rebalanced Hold durations/pay
makeContract = function(obj, tier){
  tier = Math.max(1, Math.min(typeof CONTRACT_TIER_MAX === 'number' ? CONTRACT_TIER_MAX : 3, Math.round(+tier) || 1));   /* QA bugs-r2: tier 4+ threw in startDeployment (the boss and Resistance tables stop at 3) */
  const regKey = pickOf(REGION_KEYS), R = REGIONS[regKey];
  const openFacs = R.factions.filter(fk => standing(fk) > -2);
  const fac = pickOf(openFacs.length ? openFacs : R.factions);
  let patron = FACTIONS[fac].patron;
  const host = obj === 'plague' ? 'hollow' : pickOf(typeof hostsFor === 'function' ? hostsFor(obj, R.hosts) : R.hosts);   // PD-29
  const place = pickOf(R.places), town = pickOf(R.towns);
  const ptCoord = pickOf(R.coords);
  const c = {
    obj, tier, host, place, town, region:regKey, regionName:R.name,
    mapAt:[ptCoord[0] + ((Math.random() * 6 | 0) - 3), ptCoord[1] + ((Math.random() * 6 | 0) - 3)],
    edges:[], council:null, picks:0, minutes:0
  };
  // Rebalanced Hold the Redoubt: 2, 3, or 4 minutes (instead of 6, 8, 10!) with fair pay
  if (obj === 'hold') c.minutes = [2, 3, 4][Math.random() * 3 | 0];
  if (obj === 'escort' || obj === 'ambush'){ c.dir = pickOf(Object.keys(DIRS)); c.cargo = pickOf(CARGO); }
  if (obj === 'rescue'){
    c.hostFaction = pickOf(R.factions);
    if (Math.random() < 0.7 && standing(c.hostFaction) > -2) patron = FACTIONS[c.hostFaction].patron;
  }
  if (obj === 'relic') c.relic = pickOf(RELICS);
  const base = obj === 'hold' ? {2:260, 3:310, 4:360}[c.minutes] : obj === 'hunt' && tier > 1 ? 360 : CONTRACTS[obj].pay;
  c.pay = Math.round(base * TIER_PAY[tier] / 5) * 5;
  c.patron = patron; c.faction = factionOfPatron(patron);
  c.brief = CONTRACTS[obj].desc(c);
  return c;
};

// Map generation support for ambush, breach, quarry, and plague
{ const prevGenMap = generateMap; generateMap = function(contract){
    const origObj = contract.obj;
    // Map proxy: ambush uses escort road map; breach uses sabotage keep map; quarry uses extract vein map; plague uses rescue town map
    const proxy = {ambush:'escort', breach:'sabotage', quarry:'extract', plague:'rescue'}[origObj];
    if (proxy) contract.obj = proxy;
    const M = prevGenMap(contract);
    contract.obj = origObj;
    if (origObj === 'ambush' && M.route && M.route.length > 10){
      // Squad starts in a forest ambush clearing near the middle of the road!
      const mid = M.route[(M.route.length * 0.45) | 0];
      M.start = {x:Math.max(4, Math.min(M.w - 5, Math.floor(mid.x / CELL))), y:Math.max(4, Math.min(M.h - 5, Math.floor(mid.y / CELL) - 5))};
      M.exit = {x:(M.start.x + .5) * CELL, y:(M.start.y + .5) * CELL};
    }
    if (origObj === 'plague'){
      // Place 3 Necrotic Obelisk nests in the town
      const cx = M.w >> 1, cy = M.h >> 1;
      M.nests = [{x:(cx - 8.5) * CELL, y:(cy - 4.5) * CELL}, {x:(cx + 8.5) * CELL, y:(cy - 4.5) * CELL}, {x:(cx + 0.5) * CELL, y:(cy + 5.5) * CELL}];
    }
    return M;
  }; }

// Setup support for rebalanced contracts + 4 new scenarios + Faction Allied perks
{ const prevSetup = setupContract; setupContract = function(c){
    prevSetup(c);
    const tier = c.tier, H = HOSTS[c.host] || HOSTS.bandits;
    const guards = () => H.pools[tier][Math.random() * H.pools[tier].length | 0];
    const boss = () => pickOf(H.bosses[tier]);

    // Assassination rebalance: restore 100% full boss HP on the Mark and require extraction after kill
    if (c.obj === 'assassinate' && G.mark){
      const B = BESTIARY[G.mark.k];
      const up = (c.tier || 1) - (B.tier || 1);
      G.mark.con = G.mark.maxCon = Math.round(B.con * (1 + (up > 0 ? 0.6 * up : 0)));
      MAP.exit = {x:(MAP.start.x + .5) * CELL, y:(MAP.start.y + .5) * CELL};
    }

    // 1. Supply Line Ambush (ambush)
    if (c.obj === 'ambush'){
      G.convoy = [0, 1, 2].map(i => {
        const idx = Math.max(0, 6 - i * 3), p = MAP.route[idx];
        return {x:p.x, y:p.y, idx, hp:55 + 25 * tier, maxHp:55 + 25 * tier, r:26, ac:5, shift:1, objHp:true, left:false, flash:0, dead:false, escaped:false};
      });
      // Escort guards and commander marching with the convoy
      const leadP = MAP.route[4], grp = GROUP++;
      const b = spawnEnemy(boss(), leadP.x, leadP.y, {group:grp}); if (b) b.seen = true;
      for (let i = 0; i < 5 + tier * 2; i++){
        const wp = MAP.route[Math.max(0, 6 - (i % 3) * 3)];
        const g = spawnEnemy(guards(), wp.x + rnd(-45, 45), wp.y + rnd(-45, 45), {group:grp});
        if (g) g.seen = true;
      }
      G.carry = G.carry || {}; G.carry.cusser = (G.carry.cusser || 0) + 1;
      note('The enemy prize-train is rolling down the road! Wreck all three wagons before they cross the valley.');
    }

    // 2. Breach & Seize (breach)
    if (c.obj === 'breach'){
      G.engines = []; G.breachHold = 0;
      const grp = GROUP++;
      const b = spawnEnemy(boss(), MAP.siege.x, MAP.siege.y, {dormant:true, group:grp});
      if (b) G.castellan = b;
      for (let i = 0; i < 7 + tier * 2; i++){
        const a = Math.random() * TAU, d = rnd(30, 120);
        spawnEnemy(guards(), MAP.siege.x + Math.cos(a) * d, MAP.siege.y + Math.sin(a) * d, {dormant:true, group:grp});
      }
      for (const p of MAP.engines.slice(0, 2)){
        const n = spawnEnemy('engine', p.x, p.y, {dormant:true, group:grp});
        n.name = 'Rampart Ballista'; n.con = n.maxCon = 20 + 8 * tier; n.ax = p.x; n.ay = p.y; G.engines.push(n);
      }
      G.carry = G.carry || {}; G.carry.cusser = (G.carry.cusser || 0) + 1;
    }

    // 3. Mana-Quarry Heist (quarry)
    if (c.obj === 'quarry'){
      for (const v of G.vaults){ v.vein = true; }
      note('Unstable Mana-Quarry: crack all three crystal veins, watch for arcane discharges, then escape by the road.');
    }

    // 4. Plague-Gem Containment (plague)
    if (c.obj === 'plague'){
      G.nests = []; G.villagers = []; G.savedVillagers = 0;
      for (const p of MAP.nests){
        const n = spawnEnemy('nest', p.x, p.y, {group:GROUP++});
        n.name = 'Plague Obelisk'; n.con = n.maxCon = 24 + 14 * tier; n.spawnEvery = 320 - tier * 35; n.ax = p.x; n.ay = p.y; G.nests.push(n);
        for (let i = 0; i < 2 + tier; i++) spawnEnemy(guards(), p.x + rnd(-70, 70), p.y + rnd(-70, 70), {dormant:true, group:n.group});
      }
      if (MAP.town){
        const b = spawnEnemy(boss(), MAP.town.x, MAP.town.y, {dormant:true, group:GROUP++});
        for (const p of (MAP.cages || []).slice(0, 6)){
          const race = rollRace(), sex = Math.random() < .5 ? 'f' : 'm';
          G.villagers.push({x:p.x, y:p.y, rot:0, maxRot:65 * 60, state:'sick', p:{race, spec:'PLAIN', name:randomName(race, sex), id:'v' + G.villagers.length, sex}});
        }
      }
    }

    // New Faction Allied Perks on deployment:
    if (allied('frostvault')){ G.fogT = Math.max(G.fogT || 0, 45 * 60); G.fogWard = Math.max(G.fogWard || 0, 45 * 60); addWard(1); }
    if (allied('orcs') && G.mountMax > 0){ G.mountMax += 2; G.mountPool += 2; }
    if (allied('arcana') && [G.leader, ...G.squad].some(u => u.spec === 'MAGE' || u.spec === 'WITCH')){
      G.carry = G.carry || {}; G.carry.scroll = (G.carry.scroll || 0) + 1;
    }
    /* Index 35: the Grey Cloaks Luck is in leaderStats now */
    // Hostile Arcana Guild dispatches Inquisitors if you field an unlicensed Mage/Witch in Regions I, II or IV!
    if (standing('arcana') <= -2 && ['heartland','marches','spine'].includes(c.region) && [G.leader, ...G.squad].some(u => u.spec === 'MAGE' || u.spec === 'WITCH')){
      for (let i = 0; i < 2 + c.tier; i++) spawnEnemy(i === 0 ? 'inquisitor' : 'battlemage');
      note('Inquisitors have come for your unlicensed casters. The Arcana Guild gave them your names.');
    }
  }; }

// Active Siege Engines fire mortar telegraphs during approach (Sabotage & Breach) + Convoy targetable by squad
{ const prevContractAI = contractEnemyAI; contractEnemyAI = function(e, B, sp){
    const handled = prevContractAI(e, B, sp);
    if (B.arch === 'fixed' && e.k === 'engine' && !e.dead && !e.dormant && dist(e, G.leader) < 620 && G.frame % 260 === (e.seed * 13) % 260){
      const L = G.leader, tx = L.x + rnd(-45, 45), ty = L.y + rnd(-45, 45);
      G.hazards.push({x:tx, y:ty, r:56, t:95, max:95, skill:2 + (G.contract.tier || 1), dmg:3, kind:'mortar'});
      G.fx.push({ring:true, x:e.x, y:e.y, r:38, life:14, c:'#ffb060'});
      SFX.play('bow');
    }
    return handled;
  }; }

// Steppe Orc Allied bonus: +1 flat damage on Charge melee swings
{ const prevStrike = strike; strike = function(e, skill, baseDmg, o = {}){
    if (!o.ranged && G && G.chargeT > 0 && allied('orcs')) o = Object.assign({}, o, {flat:(o.flat || 0) + 1});
    return prevStrike(e, skill, baseDmg, o);
  }; }

// Hold the Redoubt Sortie Horn [H]: call next wave early, advance timer by +20s, and earn +15gp
window.addEventListener('keydown', e => {
  if (!G || G.over || G.paused || G.obj !== 'hold') return;
  if (e.key === 'h' || e.key === 'H'){
    if ((G.hornCd || 0) > G.frame) return pop(G.leader.x, G.leader.y - 30, 'HORN COOLING DOWN', '#999');
    G.hornCd = G.frame + 15 * 60;
    G.sec += 20; G.coin += 15; G.spawnClock = 1;
    SFX.play('horn'); G.shake = 10;
    pop(G.leader.x, G.leader.y - 40, 'SORTIE HORN: +20s & +15 COIN!', '#ffd860');
    note('You sound the Sortie Horn! The next wave charges early (+20s advanced, +15gp bounty).');
  }
});

// Update loop extensions for Escort leash/speed, Relic auras, Beacons hold climax, Assassination signet extraction, and the 4 new scenarios
{ const prevUpdateContract = updateContract; updateContract = function(){
    const L = G.leader, o = G.obj;
    // Escort improvement: wider 520px leash + faster wagon pace when Leader is near
    if (o === 'escort' && G.wagon && G.wagon.hp > 0){
      const w = G.wagon, route = MAP.route;
      const blocked = w.stall > 0 || G.enemies.some(e => !e.dead && !e.dormant && dist(e, w) < w.r + e.r + 6);
      const dL = dist(L, w);
      if (!blocked && !L.down && dL <= 520 && w.idx < route.length - 1){
        const nx = route[w.idx + 1], dx = nx.x - w.x, dy = nx.y - w.y, d = Math.hypot(dx, dy);
        const extraSp = dL > 300 ? 0.78 : (!contested(w, 200) && dL < 130 ? 0.36 : 0.16);
        if (d > extraSp){ w.x += dx / d * extraSp; w.y += dy / d * extraSp; } else { w.x = nx.x; w.y = nx.y; w.idx++; }   /* Index 35: step on to the next waypoint */
      }
    }
    prevUpdateContract();

    // Carried Relic unique field auras
    if (o === 'relic' && G.carrying && G.relic && G.frame % 600 === 0){
      const rn = G.relic.name || '';
      if (/Chalice/i.test(rn)){ if (L.con < L.maxCon) L.con++; for (const m of G.squad) if (m.state === 'up' && m.con < m.maxCon) m.con++; pop(L.x, L.y - 36, 'WEEPING CHALICE: +1 CON', '#8fd39a'); }
      else if (/Psalter|Runestone/i.test(rn)){ addWard(1); G.shieldPool = Math.min(G.shieldMax, G.shieldPool + 1); pop(L.x, L.y - 36, 'RELIC WARD: +1 WARD', '#87ceeb'); }
      else if (/Wyrm-egg|Crown/i.test(rn)){ G.fx.push({ring:true, x:L.x, y:L.y, r:110, life:18, c:'#ff8a3a'}); for (const e of G.enemies) if (!e.dead && !e.dormant && dist(e, L) < 110) hurtEnemy(e, 2); pop(L.x, L.y - 36, 'RELIC PULSE', '#ffb060'); }
      else { G.blessT = Math.max(G.blessT || 0, 240); pop(L.x, L.y - 36, 'SAINT IVO\u2019S GRACE', '#ffe680'); }
    }

    // 1. Ambush update: enemy convoy wagons roll along MAP.route; squad attacks them when within melee/ranged reach
    if (o === 'ambush' && G.convoy){
      const route = MAP.route;
      for (const w of G.convoy){
        if (w.dead || w.escaped) continue;
        if (w.flash > 0) w.flash--;
        // Squad members within 110px automatically strike the enemy wagon
        if (G.frame % 30 === 0){
          for (const u of squadUnits()){
            if (dist(u, w) < 95 && contested(w, 170)){
              const dmg = Math.max(1, damageRoll(G.melee.dmg, 0));
              w.hp -= dmg; w.flash = 6; pop(w.x + rnd(-12, 12), w.y - 26, '-' + dmg, '#ffd860');
              if (w.hp <= 0 && !w.dead){
                w.dead = true; G.coin += 45 * G.contract.tier; G.shake = 14; SFX.play('blast');
                G.fx.push({blast:true, x:w.x, y:w.y, r:0, max:70, life:22, c:'#ff8a3a'});
                pop(w.x, w.y - 44, 'PRIZE WAGON WRECKED (+' + (45 * G.contract.tier) + ' COIN)', '#ffd700');
                huntingParty(); break;
              }
            }
          }
        }
        if (w.dead) continue;
        // Wagon slows down if squad blocks the road in front of it
        const blocked = squadUnits().some(u => dist(u, w) < 42) || (!L.down && dist(L, w) < 64 && !contested(w, 170));   /* Index 35: the whole capture ring slows it */
        const sp = w.stall > 0 ? 0 : (!L.down && dist(L, w) < 64 && !contested(w, 170)) ? 0.04 : blocked ? 0.18 : 0.68;   /* Index 36: being boarded, it nearly stops */
        if (w.idx < route.length - 1){
          const nx = route[w.idx + 1], dx = nx.x - w.x, dy = nx.y - w.y, d = Math.hypot(dx, dy);
          if (d <= sp){ w.x = nx.x; w.y = nx.y; w.idx++; } else { w.x += dx / d * sp; w.y += dy / d * sp; if (Math.abs(dx) > 0.1) w.left = dx < 0; }
        } else { w.escaped = true; note('An enemy prize-wagon has escaped down the road!'); }
      }
    }

    // 2. Breach & Seize update: once Castellan is slain, hold the keep courtyard for 20s (1200 frames)
    if (o === 'breach' && MAP.siege){
      const casDead = !G.castellan || G.castellan.dead;
      const inKeep = dist(L, MAP.siege) < 190 && !L.down;
      if (casDead && inKeep){
        G.breachHold = (G.breachHold || 0) + 1;
        if (G.breachHold === 60 || G.breachHold === 600){ huntingParty(); note('Hold the keep courtyard against the counter-attack!'); }
      }
    }

    // 3. Mana-Quarry Heist update: periodic crystal lightning hazards near unharvested veins
    if (o === 'quarry'){
      const cracked = G.vaults.filter(v => v.done).length;
      if (G.frame % Math.max(90, 240 - cracked * 50) === 0){
        const activeVein = G.vaults.find(v => !v.done && dist(v, L) < 380) || (cracked > 0 && dist(L, MAP.exit) > 120 ? L : null);
        if (activeVein){
          const tx = L.x + rnd(-70, 70), ty = L.y + rnd(-70, 70);
          G.hazards.push({x:tx, y:ty, r:52, t:80, max:80, skill:3 + G.contract.tier, dmg:3, kind:'mortar'});
        }
      }
    }

    // 4. Plague-Gem Containment update: villagers tick toward transformation unless cleansed or all obelisks smashed
    if (o === 'plague' && G.villagers){
      const obelisksAlive = G.nests.some(n => !n.dead);
      for (const v of G.villagers){
        if (v.state !== 'sick') continue;
        // Standing close to Leader or when all Obelisks are destroyed purges the plague
        if (!obelisksAlive || v.cured){
          v.state = 'saved'; G.savedVillagers = (G.savedVillagers || 0) + 1; G.coin += 20;
          pop(v.x, v.y - 24, 'PLAGUE PURGED (+20 COIN)', '#8fd39a'); SFX.play('stand'); continue;
        }
        v.rot += obelisksAlive ? 1 : 0;
        if (v.rot >= v.maxRot){
          v.state = 'turned';
          const lv = spawnEnemy('levy', v.x, v.y); if (lv) lv.seen = true;
          pop(v.x, v.y - 24, 'TURNED TO HOLLOW!', '#b22222');
        }
      }
    }
  }; }

// Assassination, Beacons, and the 4 new scenarios objective checks, progress, HUD lines, markers, bodies, and debrief
{ const prevCheck = contractCheck; contractCheck = function(){
    const o = G.obj, L = G.leader;
    if (o === 'assassinate'){
      if (G.mark.dead && !G.exitOpen){
        G.exitOpen = true; G.alarm += 2; huntingParty();
        note(`You have ${ename(G.mark)}'s signet! Fight your way back to the green banner.`);
      }
      if (G.mark.dead && G.exitOpen && dist(L, MAP.exit) < 75){ endDeployment('victory'); return true; }
      if (G.markEscaped && !G.mark.dead){ recordNemesis(G.mark); return contractFail('THE MARK ESCAPES', `${ename(G.mark)} slips away.`); }
      return false;
    }
    if (o === 'beacons'){
      if (G.beacons.every(b => b.burning) && !G.beaconHoldStarted){
        G.beaconHoldStarted = true; G.winT = 20 * 60; G.alarm += 2; huntingParty();
        const bk = pickOf(hostBosses()), e = spawnEnemy(bk);
        if (e){ e.seen = true; note(`All three beacons burn! ${ename(e)} leads a final assault—hold the hill for 20 seconds!`); }
      }
      return false;
    }
    if (o === 'ambush' && G.convoy){
      const wrecked = G.convoy.filter(w => w.dead).length, esc = G.convoy.filter(w => w.escaped).length;
      if (esc >= 2) return contractFail('THE CONVOY ESCAPED', 'Too many prize wagons escaped down the valley road.');
      if (wrecked + esc >= G.convoy.length && wrecked >= 2 && !G.winT){ G.winT = 120; note('The prize-train is wrecked! The spoils are yours.'); }
      return false;
    }
    if (o === 'breach'){
      if ((G.breachHold || 0) >= 20 * 60 && !G.winT){ G.winT = 90; note('The Chapter Banner flies over the keep! The fortress is yours.'); }
      return false;
    }
    if (o === 'quarry'){
      if (!G.exitOpen && G.vaults.length && G.vaults.every(v => v.done)){ G.exitOpen = true; huntingParty(); }
      if (G.exitOpen && dist(L, MAP.exit) < 75){ endDeployment('victory'); return true; }
      return false;
    }
    if (o === 'plague'){
      if (G.nests.every(n => n.dead) && !G.winT){ G.winT = 120; note('Every Plague Obelisk is shattered! The rot lifts from the town.'); }
      return false;
    }
    return prevCheck();
  }; }

{ const prevProg = contractProgress; contractProgress = function(){
    const o = G.obj;
    if (o === 'assassinate') return G.mark.dead ? 0.75 : 0;
    if (o === 'beacons') return G.beaconHoldStarted ? 0.75 + 0.25 * (1 - (G.winT || 0) / (20 * 60)) : G.beacons.filter(b => b.burning).length / 4;
    if (o === 'ambush' && G.convoy) return G.convoy.filter(w => w.dead).length / G.convoy.length;
    if (o === 'breach') return ((!G.castellan || G.castellan.dead) ? 0.5 : 0) + Math.min(0.5, (G.breachHold || 0) / (40 * 60));
    if (o === 'quarry'){ const v = G.vaults.filter(x => x.done).length / Math.max(1, G.vaults.length); return G.exitOpen ? 0.9 : v * 0.9; }
    if (o === 'plague') return G.nests.filter(n => n.dead).length / Math.max(1, G.nests.length);
    return prevProg();
  }; }

{ const prevObjLine = objectiveLine; objectiveLine = function(){
    if (G && G.obj === "hold"){
      const left = Math.max(0, G.contract.minutes * 60 - G.sec);
      return [`${String(left / 60 | 0).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`, "HOLD THE REDOUBT  \u00b7  [H] SOUND SORTIE HORN (+20s)"];
    }
    return prevObjLine();
  }; }
{ const prevLine = contractLine; contractLine = function(t){
    const o = G.obj;
    if (o === 'hold'){
      const left = Math.max(0, G.contract.minutes * 60 - G.sec);
      return [`${String(left / 60 | 0).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`, `HOLD THE REDOUBT  \u00b7  [H] SOUND SORTIE HORN (+20s)`];
    }
    if (o === 'assassinate' && G.mark.dead) return ['GET OUT', `CARRY SIGNET TO GREEN BANNER  \u00b7  ${t}`];
    if (o === 'beacons' && G.beaconHoldStarted) return [`HOLD ${Math.ceil((G.winT || 0) / 60)}S`, `DEFEND THE SIGNAL HILL  \u00b7  ${t}`];
    if (o === 'ambush' && G.convoy) return [`${G.convoy.filter(w => w.dead).length} / ${G.convoy.length} WRECKED`, `INTERCEPT PRIZE WAGONS  \u00b7  ${t}`];
    if (o === 'breach'){
      const casDead = !G.castellan || G.castellan.dead;
      return casDead ? [`HOLD ${Math.min(20, Math.floor((G.breachHold || 0) / 60))} / 20S`, `HOLD THE KEEP COURTYARD  \u00b7  ${t}`] : ['STORM THE KEEP', `SLAY ${ename(G.castellan).toUpperCase()}  \u00b7  ${t}`];
    }
    if (o === 'quarry') return G.exitOpen ? ['GET OUT', `REACH THE GREEN BANNER  \u00b7  ${t}`] : [`${G.vaults.filter(v => v.done).length} / ${G.vaults.length} CORES`, `MANA VEINS HARVESTED  \u00b7  ${t}`];
    if (o === 'plague') return [`${G.nests.filter(n => n.dead).length} / ${G.nests.length} OBELISKS`, `TOWNSFOLK SAVED: ${G.savedVillagers || 0}  \u00b7  ${t}`];
    return prevLine(t);
  }; }

{ const prevMarkers = contractMarkers; contractMarkers = function(out){
    prevMarkers(out);
    const o = G.obj;
    if (o === 'ambush' && G.convoy) for (const w of G.convoy) if (!w.dead && !w.escaped) out.push({x:w.x, y:w.y, kind:'boss', sp:'wagon'});
    if (o === 'breach' && MAP.siege){
      if (G.castellan && !G.castellan.dead) out.push({x:G.castellan.x, y:G.castellan.y, kind:'boss', k:G.castellan.k});
      else out.push({x:MAP.siege.x, y:MAP.siege.y, kind:'beacon', sp:'beacon'});
    }
    if (o === 'quarry') for (const v of G.vaults) out.push({x:v.x, y:v.y, kind:v.done ? 'done' : 'vault', sp:'relic'});
    if (o === 'plague'){
      for (const n of G.nests) out.push({x:n.x, y:n.y, kind:n.dead ? 'done' : 'boss', sp:'nest'});
      for (const v of (G.villagers || [])) if (v.state === 'sick') out.push({x:v.x, y:v.y, kind:'ally'});
    }
  }; }

{ const prevBodies = contractBodies; contractBodies = function(bodies, onScreen){
    prevBodies(bodies, onScreen);
    const o = G.obj;
    if (o === 'ambush' && G.convoy){
      for (const w of G.convoy) if (!w.dead && !w.escaped && onScreen(w, 80)) bodies.push({y:w.y, custom:() => {
        if (!(typeof w3dCaravan === 'function' && w3dCaravan(w))){   /* Index 74 */
        const fwd = w.left ? -1 : 1; /* S6-C note 10: non-pixel stand-in */
        figPlaceholder(w.x + fwd * 62, w.y + 4 - 7 * 2.4, 2.4, {h:20, w:8, horse:true, shadowW:8});
        figPlaceholder(w.x, w.y - 18, 3, {h:24, w:30, box:true, shadowW:13}); }
        const bw = 76, top = w.y - 82;
        ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(w.x - bw / 2 - 1, top - 1, bw + 2, 7);
        ctx.fillStyle = '#e0503a'; ctx.fillRect(w.x - bw / 2, top, bw * Math.max(0, w.hp / w.maxHp), 5);
        ctx.fillStyle = '#ffd860'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('PRIZE WAGON', w.x, top - 4);
      }});
    }
    if (o === 'breach' && MAP.siege && onScreen(MAP.siege, 200)){
      bodies.push({y:MAP.siege.y - 10, custom:() => {
        ctx.strokeStyle = (!G.castellan || G.castellan.dead) ? '#5ee07a' : '#ff6a5a';
        ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(MAP.siege.x, MAP.siege.y, 180, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }});
    }
    if (o === 'plague' && G.villagers){
      for (const v of G.villagers) if (v.state === 'sick' && onScreen(v)) bodies.push({y:v.y, custom:() => {
        const spr = personSpriteK('villager:' + v.p.race + v.p.name + v.p.sex, v.p);   /* Index 74 */
        drawUnit3(v, spr, v.x, v.y, 2.2, 0, false, false);
        const frac = Math.max(0, 1 - v.rot / v.maxRot);
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(v.x - 16, v.y - 32, 32, 4);
        ctx.fillStyle = '#a855f7'; ctx.fillRect(v.x - 16, v.y - 32, 32 * frac, 4);
      }});
    }
  }; }

{ const prevHow = contractHow; contractHow = function(c, result){
    const t = `${G.sec / 60 | 0}m ${G.sec % 60}s`;
    if (c.obj === 'ambush' && G.convoy) return `<b>${G.convoy.filter(w => w.dead).length} of ${G.convoy.length}</b> enemy prize wagons wrecked in ${t}.`;
    if (c.obj === 'breach') return `The border keep at ${c.place} was ${result === 'victory' ? 'stormed and held' : 'not taken'} in ${t}.`;
    if (c.obj === 'quarry') return `<b>${G.vaults.filter(v => v.done).length} of ${G.vaults.length}</b> Raw Mana Cores harvested in ${t}.`;
    if (c.obj === 'plague') return `<b>${G.nests.filter(n => n.dead).length} of ${G.nests.length}</b> Plague Obelisks shattered (${G.savedVillagers || 0} townsfolk cured) in ${t}.`;
    return prevHow(c, result);
  }; }

/* ---- 4. Cleric Personal Devotion (-1 to +3) & 3 Pantheon Covenants ------ */
const COVENANT = {
  kai:'solar', ramus:'solar', silean:'solar', tarasha:'solar',
  bromos:'wild', karas:'wild', ariyan:'wild', jasena:'wild', gilzo:'wild',
  marakyr:'veil', neleasha:'veil', sorvaine:'veil', valdris:'veil'
};
const COVENANT_NAME = {solar:'Solar Prelacy', wild:'Iron & Wild Covenant', veil:'Veil Conclave'};
const DEVOTION_RANK = d => d < 0 ? 'Forsaken (-1)' : d === 0 ? 'Initiate (0)' : d === 1 ? 'Anointed (+1)' : `Avatar\u2019s Vessel (+${d})`;

// INT-1 stage 3 group 7: the Devotion Rank and Covenant badge is drawn by legwork.js deityLine (deityBadge)

// Devotion modifies starting Max Favour (+1 per rank, -1 if Forsaken)
{ const prevStartFav = startDeployment; startDeployment = function(c, ids){
    prevStartFav(c, ids);
    if (!G || !G.deployedClerics || !G.deployedClerics.length) return;
    const devBonus = G.deployedClerics.reduce((a, p) => a + (p.devotion || 0), 0);
    G.favourMax = Math.max(1, G.favourMax + devBonus);
    G.favour = Math.max(0, Math.min(G.favourMax, G.favour + devBonus));
  }; }

// Covenant Domain Riders when an Anointed (devotion >= 1) Cleric casts [2], plus plague villager cleansing!
{ const prevClericCast = ABIL_FX.CLERIC; ABIL_FX.CLERIC = function(u){
    const usedFav = G.favourCast;
    prevClericCast(u);
    const L = G.leader;
    // Cleansing plague villagers on Plague-Gem Containment
    if (G.obj === 'plague' && G.villagers){
      for (const v of G.villagers) if (v.state === 'sick' && dist(v, L) < G.mod.radius + 40){
        v.state = 'saved'; G.savedVillagers = (G.savedVillagers || 0) + 1; G.coin += 25;
        pop(v.x, v.y - 24, 'PURIFIED (+25 COIN)', '#ffe680');
      }
    }
    const p = u.p || META.leader, dev = (p && p.devotion) || 0;
    if (!usedFav || dev < 1 || !p || !p.deity) return;
    const cov = COVENANT[p.deity] || 'solar';
    if (cov === 'solar'){
      for (const e of G.enemies) if (!e.dead && ['levy','orsolt','tithepriest','devil','cinder'].includes(e.k) && dist(e, L) < G.mod.radius + 50) hurtEnemy(e, 2);
      G.witherT = 0; G.baneT = 0;
      pop(u.x, u.y - 60, 'SOLAR CONSECRATION', '#ffe680');
    } else if (cov === 'wild'){
      G.blessT = Math.max(G.blessT || 0, 240);
      pop(u.x, u.y - 60, 'WAR-CHANT OF IRON', '#8fd39a');
    } else if (cov === 'veil'){
      for (const e of G.enemies) if (!e.dead && dist(e, L) < 190) e.shakenT = Math.max(e.shakenT || 0, 240);
      G.illusionEvadeT = Math.max(G.illusionEvadeT || 0, 150);
      pop(u.x, u.y - 60, 'SHROUD OF THE VEIL', '#d0a8ff');
    }
  }; }

// Avatar's Vessel (devotion >= 2): once per contract, automatic Divine Intervention when the Leader falls!
{ const prevLeaderFalls = leaderFalls; leaderFalls = function(){
    prevLeaderFalls();
    if (!G || !G.leader.down || G.divineIntervened) return;
    const vessel = (G.deployedClerics || []).find(p => (p.devotion || 0) >= 2 && (p === META.leader || G.squad.some(m => m.p === p && m.state === 'up')));
    if (vessel && G.favour > 0){
      G.divineIntervened = true; G.favour = 0;
      standLeader(`${DEITIES[vessel.deity].name.split(',')[0].toUpperCase()} INTERVENES!`);
      G.leader.con = Math.min(G.leader.maxCon, 2); addWard(2);
      G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:160, life:30, c:'#ffe680'});
      note(`${vessel.name}'s high devotion calls down Divine Intervention! ${META.leader.name} rises in golden light.`);
    }
  }; }

// Active Tenet Fulfilment & Breach Devotion tracking + Rival Faction Spillover at contract end
function tenetFulfilled(d){
  const c = G.contract;
  if (d === 'kai' || d === 'neleasha') return c.host === 'hollow' || c.obj === 'plague' || G.bossKills > 0;
  if (d === 'ramus') return G.prisoners.some(pr => pr.kind === 'commander');
  if (d === 'silean') return G.captivesFreed > 0 || (G.saved || 0) > 0 || (G.savedVillagers || 0) > 0;
  if (d === 'marakyr') return G.kills >= 10 && !G.leaderWasDown;
  if (d === 'ariyan') return !['hold', 'siege', 'breach'].includes(c.obj) && G.result === 'victory';
  if (d === 'jasena') return !G.burned && G.result === 'victory';
  if (d === 'bromos') return !G.squad.some(m => m.state === 'dead') && G.squad.length > 0;
  if (d === 'gilzo') return !!G.contrapt;
  if (d === 'karas') return (G.meleeKills || 0) >= (G.otherKills || 0) + 5;
  if (d === 'tarasha') return (c.obj === 'escort' || c.obj === 'rescue') && !(G.hostagesLost > 0);
  if (d === 'valdris') return (G.coin || 0) >= 60;
  if (d === 'sorvaine') return (G.chests || 0) >= 2;
  return false;
}

{ const prevEndDev = endDeployment; endDeployment = function(result){
    const wasOver = G && G.over;
    prevEndDev(result);
    if (!G || wasOver || inStoryNow() || ['drill', 'brawl', 'defend'].includes(G.obj)) return;
    const lines = [];
    const withdrew = G.result === 'withdrawn' || (G.result === 'fled' && !G.failHead && !G.leaderSlain);
    const br = tenetBreaches(withdrew);
    const clerics = (G.deployedClerics || []).filter(p => p === META.leader || G.squad.some(m => m.p === p && m.state !== 'dead'));
    for (const p of clerics){
      const d = deityOf(p), before = p.devotion || 0;
      if (br[d]){
        p.devotion = Math.max(-1, before - 1);
        lines.push(`<p class="bad"><b>${esc(p.name)}</b>'s devotion to ${DEITIES[d].name} slips to <b>${DEVOTION_RANK(p.devotion)}</b>.</p>`);
      } else if (G.result === 'victory' && tenetFulfilled(d) && before < 3){
        p.devotion = Math.min(3, before + 1);
        lines.push(`<p class="good"><b>${esc(p.name)}</b> upheld the sacred charge of ${DEITIES[d].name}: Devotion rises to <b>${DEVOTION_RANK(p.devotion)}</b>!</p>`);
      }
    }
    // Rival Faction spillover when completing Tier 2/3 contracts (unless allied with the Dust Cloaks Council)
    if (G.result === 'victory' && G.contract.faction && !allied('greycloaks')){
      const riv = FACTION_RIVAL[G.contract.faction];
      if (riv && (G.contract.tier >= 3 || standing(G.contract.faction) >= 2) && Math.random() < 0.65){
        shiftStanding(riv, -1, lines);
      }
    }
    if (lines.length && renderDebrief.last){
      renderDebrief.last.lines.push(...lines);
      saveMeta();
      renderDebrief(renderDebrief.last.head, renderDebrief.last.lines);
    }
  }; }

/* ---- 5. Planning Table UI Enhancements: Regional Tags, Map Contract Pins & Ration Cost ---- */
{ const prevRenderTable = renderTable; renderTable = function(){
    prevRenderTable();
    if (!META.leader || (typeof inStory === 'function' && inStory())) return;
    // 1. Add Region badge to each contract scroll
    const scrolls = document.querySelectorAll('#screen-table .cscrolls .cscroll');
    scrolls.forEach((el, i) => {
      const c = META.board[i]; if (!c) return;
      const regName = c.regionName || (c.region && REGIONS[c.region] && REGIONS[c.region].name) || 'The Frontier Marches';
      const tag = el.querySelector('.tag');
      if (tag && !el.querySelector('.regtag')){
        tag.insertAdjacentHTML('afterend', `<div class="tag regtag" style="background:#3a4a3a;color:#e8dfc8;margin-left:4px;display:inline-block">${esc(regName)}</div>`);
      }
    });
    // 2. Add clickable Contract Pins (I, II, III) onto the Arcadia Map
    const mapWrap = document.querySelector('#tbl-factions .mapwrap');
    if (mapWrap && META.board){
      META.board.forEach((c, i) => {
        const at = c.mapAt || [35 + i * 18, 48];
        const pin = document.createElement('div');
        pin.className = 'cpin' + (MU.contract === i ? ' on' : '');
        pin.style.cssText = `position:absolute;left:${at[0]}%;top:${at[1]}%;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:${MU.contract === i ? '#d4af37' : '#8a1a1a'};color:#fff;font:bold 14px Georgia;display:flex;align-items:center;justify-content:center;border:2px solid #fff8e0;cursor:pointer;z-index:6;box-shadow:0 2px 5px rgba(0,0,0,.65)`;
        pin.textContent = ['I', 'II', 'III'][i] || (i + 1);
        pin.title = `Contract ${pin.textContent}: ${OBJECTIVES[c.obj].name} at ${c.place} (${c.regionName || 'Arcadia'}) — Click to select`;
        pin.onclick = ev => { ev.stopPropagation(); MU.contract = i; SFX.play('pick'); renderTable(); };
        mapWrap.appendChild(pin);
      });
    }
    // 3. Show Muster Ration cost clearly on #tbl-march for Tier 2 and Tier 3 contracts
    const sel = META.board[MU.contract], marchBox = $('tbl-march');
    if (sel && marchBox && sel.tier >= 2){
      const rCost = (sel.tier === 2 ? 5 : 10) * MU.ids.length;
      const sub = marchBox.querySelector('.sub');
      if (sub && !marchBox.querySelector('.ration-note')){
        sub.insertAdjacentHTML('afterend', `<div class="sub ration-note" style="font-size:14px;color:var(--blood)"><b>Muster Rations (Tier ${sel.tier}):</b> ${rCost}gp deducted on march (${sel.tier === 2 ? 5 : 10}gp per Squad Mate).</div>`);
      }
    }
  }; }

// Show CARRIED_WHEN trigger tooltips in the Pause screen when the squad has Carried Supplies
{ const prevPause = togglePause; togglePause = function(){
    prevPause();
    if (!G || !G.paused || !G.carry) return;
    const items = Object.entries(G.carry).filter(([, v]) => v > 0);
    if (!items.length) return;
    const p = $('pause-inner'); if (!p || p.querySelector('.carry-help')) return;
    const desc = items.map(([k, v]) => `<b>${v}\u00d7 ${LOOT[k].name}</b> (<i>${CARRY_WHEN[k] || 'auto-used when needed'}</i>)`).join(' \u00b7 ');
    const sub = p.querySelector('.sub');
    if (sub) sub.insertAdjacentHTML('afterend', `<div class="sub carry-help" style="color:var(--gold-bright);font-size:12.5px;margin-top:4px">Carried Supplies: ${desc}</div>`);
  }; }



window.WORLDDEPTH_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      ok('DEITIES defines pantheon entries', typeof DEITIES === 'object' && Object.keys(DEITIES).length >= 3);
      ok('LOOT defines carried supply entries', typeof LOOT === 'object' && Object.keys(LOOT).length >= 3);
      ok('tenetFulfilled is a function', typeof tenetFulfilled === 'function');
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
