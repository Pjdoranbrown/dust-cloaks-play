/* js/core/boot.js (INT-1 step 2, 2026-11-16): start-up: storage guard, canvas, constants.
   Cut unchanged from the inline script in index.html (old lines 194 to 578). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
try { window.localStorage && window.localStorage.getItem("__dc_test"); } catch (e) {
  const _mem = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: k => Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null,
      setItem: (k, v) => { _mem[k] = String(v); },
      removeItem: k => { delete _mem[k]; },
      clear: () => { for (const k in _mem) delete _mem[k]; }
    }
  });
}

/* ============================================================================
   DUST CLOAKS - squad survivor
   The original game's campaign loop (Leader carries over, rolled recruits,
   coin in the field, camp between deployments) running on the Dust Cloaks
   Core Rules 1.0 combat engine. Every graphic is drawn in code: no image
   files are needed.
============================================================================ */

/* ---------------------------------------------------------------------------
   NAMES
--------------------------------------------------------------------------- */
const NAMES = {
  ELVES:     {m:["Aelrindel","Faenor","Silaqui","Erendil","Thandor","Galion","Varis","Elrion"],
              f:["Lyra","Thalia","Ilyndra","Caelith","Elowen","Nimriel","Faelis","Seraphine"]},
  GREENSKINS:{m:["Grok","Mog","Snagga","Kruel","Boz","Griznut","Krusk","Ushnag"],
              f:["Shagra","Ugla","Murza","Grisha","Bolga","Yazra","Snikka","Krenna"]},
  HUMAN:     {m:["Baldric","Osric","Wulf","Godfrey","Rowan","Berrick","Aldous","Cedric"],
              f:["Edith","Maud","Rowena","Isolde","Agnes","Brenna","Hild","Matilda"]},
  MUDDLED:   {m:["Half-Jack","Cross","Twain","Brannoc","Corran","Dacey","Mingle","Blur"],
              f:["Sorrel","Tamsin","Wren","Briar","Linnet","Mira","Ysolde","Nell"]},
  OUTSIDER:  {m:["Xol","Vex","Uriel","Kaos","Seraph","Azir","Malach","Zeph"],
              f:["Ana","Void","Entropy","Lilit","Nyx","Zara","Ishtel","Sable"]},
  SHORTFOLK: {m:["Bramble","Took","Pip","Knub","Dunstan","Fumble","Borin","Gruff"],
              f:["Hilda","Tilly","Marigold","Brunhild","Pansy","Dagna","Rosie","Nim"]}
};
const FEMALE_NAMES = new Set(Object.values(NAMES).flatMap(g => g.f));
const sexOf = p => p.sex || (FEMALE_NAMES.has(p.name) ? 'f' : 'm');

/* ---------------------------------------------------------------------------
   RACES - Core Rules Table 2.3
--------------------------------------------------------------------------- */
const RACES = {
  HUMAN:    {name:'Human',     grp:'HUMAN',     con:0, move:4, m:0, r:0, mg:0, luck:0, per:1, adapt:true,
             tag:'Adaptable: +1 Melee and +1 Ranged at creation.'},
  SUN_ELF:  {name:'Sun Elf',   grp:'ELVES',     con:-1,move:5, m:0, r:1, mg:1, luck:1, per:1, tag:'Luminous Grace: +1 Magic.'},
  GREY_ELF: {name:'Grey Elf',  grp:'ELVES',     con:-1,move:5, m:1, r:1, mg:0, luck:1, per:1, tag:'Poised Mediator: a Grey Elf Leader gets +1 step on every Parley.'},
  DARK_ELF: {name:'Dark Elf',  grp:'ELVES',     con:1, move:5, m:0, r:1, mg:0, luck:-1,per:-1,tag:'Frost-Vault Spartan: never slowed by Winter mud.'},
  ORC:      {name:'Orc',       grp:'GREENSKINS',con:2, move:5, m:2, r:-2,mg:0, luck:-1,per:-1,tag:'Steppe Fury: -2 Ranged.'},
  GOBLIN:   {name:'Goblin',    grp:'GREENSKINS',con:-1,move:3, m:-1,r:1, mg:0, luck:0, per:0, tag:'Tunnel Skirmisher: spots hidden traps from 40% further away.'},
  HOBGOBLIN:{name:'Hobgoblin', grp:'GREENSKINS',con:1, move:4, m:1, r:0, mg:0, luck:-1,per:1, tag:'Iron Discipline: with a Hobgoblin in the squad, being Shaken wears off twice as fast.'},
  DWARF:    {name:'Dwarf',     grp:'SHORTFOLK', con:2, move:3, m:1, r:-1,mg:0, luck:0, per:-1,tag:'Unyielding Stone: with a Dwarf in the squad, it can form a Shield Wall even while Staggered.'},
  GNOME:    {name:'Gnome',     grp:'SHORTFOLK', con:0, move:3, m:-1,r:1, mg:0, luck:-1,per:0, tag:'Gem-Tinker: tosses Flash-Caltrops every 14 seconds, slowing anything close.'},
  HALFLING: {name:'Halfling',  grp:'SHORTFOLK', con:-1,move:3, m:-1,r:0, mg:0, luck:2, per:1, tag:'Pastoral Luck: a Halfling Leader\'s first spent Luck each contract is free.'},
  HALF_ELF: {name:'Half-Elf',  grp:'MUDDLED',   con:-1,move:4, m:0, r:1, mg:0, luck:1, per:1, tag:'Between Worlds: a Half-Elf Leader adds a recruit to the Hiring Line.'},
  HALF_ORC: {name:'Half-Orc',  grp:'MUDDLED',   con:1, move:4, m:1, r:-1,mg:0, luck:-1,per:0, tag:'Bloodied Grit: a Half-Orc Leader regains 2 Condition whenever a commander falls.'},
  FIRBOLG:  {name:'Firbolg',   grp:'MUDDLED',   con:2, move:4, m:1, r:0, mg:0, luck:0, per:1, noMount:true,
             brace3:true,
             tag:'Gentle Titan: in a Shield Wall, the squad recovers 3 Shield Pool a round instead of 2. Cannot ride.'},
  CAMBION:  {name:'Cambion',   grp:'OUTSIDER',  con:1, move:4, m:2, r:0, mg:0, luck:-1,per:1, tag:'Bloodlust: a Cambion Leader regains 1 Condition every 15 kills.'},
  NEPHILIM: {name:'Nephilim',  grp:'OUTSIDER',  con:1, move:4, m:-1,r:0, mg:1, luck:1, per:1, tag:'Celestial Aegis: +1 Magic.'},
  ZUHRI:    {name:'Zuhri',     grp:'OUTSIDER',  con:1, move:4, m:0, r:1, mg:1, luck:0, per:-1,tag:'Storm-Born: +1 Magic. Ignores mud and weather penalties.'}
};
const RACE_GROUP_ROLL = ['SHORT','ELVES','MUDDLED','HUMAN','GREEN','OUTSIDER'];
const HERITAGE = {
  SHORT:   ['DWARF','DWARF','GNOME','GNOME','HALFLING','HALFLING'],
  ELVES:   ['SUN_ELF','GREY_ELF','GREY_ELF','DARK_ELF','DARK_ELF',null],
  MUDDLED: ['HALF_ELF','HALF_ORC','HALF_ORC','FIRBOLG','FIRBOLG','FIRBOLG'],
  GREEN:   ['ORC','ORC','HOBGOBLIN','HOBGOBLIN','GOBLIN','GOBLIN'],
  OUTSIDER:['CAMBION','NEPHILIM','NEPHILIM','ZUHRI','ZUHRI',null]
};

/* ---------------------------------------------------------------------------
   SOCIAL CLASS - Core Rules Table 2.4
--------------------------------------------------------------------------- */
const CLASS_ORDER = ['DEVOUT','EDELOS','FREEMAN','NOBLE','OUTCAST','SLAVE'];
const FREEMAN_MATE_CON_CAP = 5;   /* Patrick, Q65: a Freeman Squad Mate's starting Condition stops here; the class card prints this same value */
const CLASSES = {
  DEVOUT: {name:'Devout',  sl:{mg:1}, mate:{mg:1}, perk:'+1 Magic (Divine).', draw:'Tithe Bound.'},
  EDELOS: {name:'Edel\u014ds',  sl:{luck:1}, mate:{}, perk:'Leader: +1 Luck.', draw:'Imperial Suspicion.'},
  FREEMAN:{name:'Freeman', sl:{con:1}, mate:{con:1}, perk:`+1 Condition (Squad Mates maximum ${FREEMAN_MATE_CON_CAP}).`, draw:'Lowborn.'},
  NOBLE:  {name:'Noble',   sl:{con:1}, mate:{con:1}, perk:'+1 Condition. Well-Bred: hiring costs 20 gp, not 30, while a Noble leads.', draw:'High Ransom Target.'},
  OUTCAST:{name:'Outcast', sl:{skill:1}, mate:{skill:1}, perk:'+1 Melee or Ranged, whichever the Specialty uses.', draw:'Shunned.'},
  SLAVE:  {name:'Ex-Slave',sl:{con:-1, luck:2}, mate:{con:-1}, perk:'Pay Dues: once per contract, an Ex-Slave Squad Mate takes a hit meant for the Leader.', draw:'Scars of Servitude: -1 Condition.'}
};

/* ---------------------------------------------------------------------------
   SPECIALTIES - Table 2.5 base stats, Tables 2.6 and 2.7 rows.
--------------------------------------------------------------------------- */
const SPEC_ORDER = ['CLERIC','FOLK_HERO','MAGE','SCOUNDREL','SOLDIER','WITCH'];
const SPECS = {
  SOLDIER:  {name:'Soldier',   role:'Vanguard',  color:'#c8a24a', con:4, mg:0, luck:1, per:0, caster:false,
             attack:'Sweep: a melee swing hits up to three enemies in reach. Best Melee and Ranged dice of any Specialty.'},
  FOLK_HERO:{name:'Folk Hero', role:'Archer',    color:'#5f8f4e', con:3, mg:0, luck:1, per:1, caster:false,
             attack:'Marksman: shoots 30% faster and 40px further. A good shot, a poor swordsman.'},
  SCOUNDREL:{name:'Scoundrel', role:'Knife',     color:'#8a8a8a', con:3, mg:0, luck:2, per:0, caster:false,
             attack:'Soft Spot: +1 damage on every Solid Hit, +2 against a foe that is engaged with an ally, Slowed, Staggered or hexed. Quick with a blade.'},
  CLERIC:   {name:'Cleric',    role:'Support',   color:'#b8963a', con:4, mg:1, luck:1, per:0, caster:true,
             attack:'Mending Prayer: about every 5 seconds the most hurt person nearby regains 1. Healing Word lifts anyone Bleeding Out.'},
  MAGE:     {name:'Mage',      role:'Artillery', color:'#3f5ea8', con:3, mg:1, luck:1, per:0, caster:true,
             attack:'Magic Missile: about every 4 seconds, one unerring Piercing dart per point of Magic.'},
  WITCH:    {name:'Witch',     role:'Debuffer',  color:'#7a4a9a', con:3, mg:1, luck:1, per:0, caster:true,
             attack:'Withering Hex: about every 4 seconds a bolt that poisons, slows and weakens its target.'}
};
const ROWS = {
  SOLDIER:  [[1,1,'pick'],[1,1,'ward'],[2,2,'pick'],[2,2,'con'],[3,3,'pick'],[3,3,'shift'],[4,4,'pick'],[4,4,'con'],[5,5,'pick'],[5,5,'text:Unbreakable Line'],[6,6,'text:Living Bastion']],
  FOLK_HERO:[[1,1,'pick'],[1,1,'wounds'],[2,1,'pick'],[2,2,'per'],[3,2,'pick'],[3,3,'luck'],[4,3,'pick'],[4,4,'per'],[5,4,'pick'],[5,5,'text:Legendary Inspiration'],[6,5,'text:Hero of the Marches']],
  SCOUNDREL:[[1,0,'text:Soft Spot'],[1,1,'pick'],[2,1,'text:Evade'],[2,2,'pick'],[3,2,'soft2'],[3,3,'shift'],[4,3,'pick'],[4,4,'luck'],[5,4,'text:Assassinate'],[5,5,'text:Master of Shadows'],[6,5,'text:Phantom Blade']],
  CLERIC:   [[0,0,'pick'],[1,0,'ward'],[1,1,'text:Consecrated Ground'],[2,1,'wounds'],[2,2,'text:Divine Intervention'],[3,2,'shift'],[3,3,'text:Improved Prayers'],[4,3,'con'],[4,4,"text:Avatar's Grace"],[5,4,'text:Miracle Worker'],[5,5,'text:Voice of the God']],
  MAGE:     [[0,0,'pick'],[0,1,'ward'],[1,1,'focus'],[1,1,'text:Counter-Ward'],[1,2,'text:Twin Cantrip'],[2,2,'ward'],[2,2,'text:Improved Casting'],[2,3,'text:Overchannel'],[3,3,'text:High Arcanist'],[3,4,'text:Archmage Sigil'],[4,4,'text:Living Grimoire']],
  WITCH:    [[0,0,'pick'],[0,1,'text:Potent Brews'],[1,1,'focus'],[1,1,'text:Deep Fetish'],[1,2,'text:Greater Curses'],[2,2,'luck'],[2,2,'text:Improved Hexes'],[2,3,'text:Blood Brew'],[3,3,'text:Dread Sovereign'],[3,4,'text:Master of the Unseen'],[4,4,'text:Elder Conduit']]
};
// K71, PD-32: an always-on pick is a Talent; 'ability' is only the one on a key. Plurals for 'Soldiers only' and the like.
const SPEC_PLURAL = {SOLDIER:'Soldiers', FOLK_HERO:'Folk Heroes', SCOUNDREL:'Scoundrels', CLERIC:'Clerics', MAGE:'Mages', WITCH:'Witches'};
function specPlural(k){ return SPEC_PLURAL[k] || (SPECS[k] ? SPECS[k].name + 's' : k); }
const BONUS_LABEL = {pick:'Pick 1 Talent', con:'+1 Condition', wounds:'+1 Wounds', luck:'+1 Luck', per:'+1 Personality step',
  ward:'+1 Ward Token each contract', shift:'-1 step to damage taken', soft2:'Soft Spot +2 / +3', focus:'+60 spell range'};

/* ---------------------------------------------------------------------------
   PERMANENT INJURIES - Table 6.6
--------------------------------------------------------------------------- */
const INJURIES = [
  {id:'eye',   name:'Missing Eye',       eff:'-1 Ranged step'},
  {id:'knee',  name:'Shattered Knee',    eff:'Move capped at 3'},
  {id:'arm',   name:'Maimed Sword-Arm',  eff:'-1 Melee step'},
  {id:'lung',  name:'Crushed Lung',      eff:'-1 maximum Condition (min 2)'},
  {id:'shell', name:'Shell-Shocked',     eff:'Leader: -1 step on Morale checks'},
  {id:'mana',  name:'Mana-Scorched',     eff:'Scars only: no lasting harm'}
];

/* ---------------------------------------------------------------------------
   CAMP FACILITIES - Table 4.3. x = position on the title-screen skyline.
--------------------------------------------------------------------------- */
const FACILITIES = [
  {id:'tents',     cat:'Holding',   name:'Tents',                cost:50,  x:6,  desc:'The Reserve Bench grows from 2 places to 4, so more Squad Mates can wait in camp.'},
  {id:'kitchen',   cat:'Holding',   name:'Kitchen & Mess Hall',  cost:100, x:50, desc:'Hot meals: every Momentum rank restores 1 spent Luck.'},
  {id:'tavern',    cat:'Holding',   name:'Camp Tavern',          cost:150, x:56, desc:'One more recruit on the Hiring Line by the fire, and one free set of new faces each downtime.'},
  {id:'command',   cat:'Command',   name:'Command Tent',         cost:200, x:44, desc:'+1 maximum Luck for the Squad Leader (cap 6). Promote officers, officer training, and Tactics instruction (learn an ability, 80gp).'},
  {id:'merchant',  cat:'Command',   name:'Merchant Stalls',      cost:140, x:62, desc:'+15gp trade income after every paid contract.'},
  {id:'cells',     cat:'Command',   name:'Prisoner Cells',       cost:140, x:94, desc:'Holds up to six prisoners for free. Without it, each prisoner costs 5gp a contract and escapes after two.'},
  {id:'barracks',  cat:'Military',  name:'Barracks & Drill Yard',cost:200, x:18, desc:'Two extra recruits on the Hiring Line. Unlocks Warhorses. Weapons drill: +1 Melee for 60gp.'},
  {id:'training',  cat:'Military',  name:'Training Grounds',     cost:250, x:24, desc:'Endurance drill: a Squad Mate trains +1 Condition for 50gp (maximum +2), sitting out the next contract.'},
  {id:'armoury',   cat:'Military',  name:'Armoury',              cost:180, x:30, desc:'The squad starts every contract with +1 Ward Token.'},
  {id:'stables',   cat:'Military',  name:'Stables',              cost:200, x:12, desc:'Unlocks Mount cards in the Quartermaster. With a veteran on staff, lost horses are replaced for free.'},
  {id:'ranger',    cat:'Military',  name:"Ranger's Hut",         cost:160, x:88, desc:'Unlocks Skirmisher Drill and Volley Fire. Fieldcraft: +1 Ranged for 60gp.'},
  {id:'hospital',  cat:'Medical',   name:'Field Hospital',       cost:220, x:38, desc:'Injury checks shift up 1 step. Unlocks Field Medicine. Resting Squad Mates lie here; Ex-Slaves can have their scars healed (50gp).'},
  {id:'blacksmith',cat:'Workshops', name:'Blacksmith Forge',     cost:250, x:68, desc:'Unlocks metal armour and Heavy Greatswords.'},
  {id:'carpentry', cat:'Workshops', name:'Carpentry Shop',       cost:150, x:74, desc:'Unlocks Longbows, Pikes and the Siege Tower Shield.'},
  {id:'leather',   cat:'Workshops', name:'Leatherworking Shop',  cost:120, x:80, desc:'Unlocks Studded Brigandine. Light armour costs 20% less.'},
  {id:'engineering',cat:'Workshops',name:'Engineering Workshop', cost:300, x:84, desc:'Unlocks Stake Lines, Sharpers and the Sapper Satchel.'},
  {id:'alchemy',   cat:'Arcane',    name:'Alchemy Lab',          cost:250, x:98, desc:'Unlocks Occult tactics. Witches study +1 Magic (75gp \u00d7 the new Magic).'},
  {id:'magetower', cat:'Arcane',    name:'Mage Tower',           cost:350, x:2,  desc:'Unlocks Fireball and the Caster Focus. Mages study +1 Magic (100gp \u00d7 the new Magic).'},
  {id:'chapel',    cat:'Arcane',    name:'Chapel / Shrine',      cost:150, x:34, desc:'Unlocks Divine tactics. Clerics study +1 Magic to 2 (50gp \u00d7 the new Magic).'}
];
const facility = id => (typeof id === 'string' && (id[0] === '@' || id[0] === '#')) ? reqPseudo(id) : FACILITIES.find(f => f.id === id);   /* Index 37 */

/* ---------------------------------------------------------------------------
   QUARTERMASTER - Squad Standard cards, Chapter 3
--------------------------------------------------------------------------- */
const GEAR = [
  {id:'rags',      slot:'armour', name:'Rags',                 cost:0,    ac:3, shift:0, mv:0,  req:[], light:true},
  {id:'padded',    slot:'armour', name:'Padded Gambeson',      cost:30,   ac:4, shift:0, mv:0,  req:[], light:true},
  {id:'leather',   slot:'armour', name:'Hardened Leather',     cost:70,   ac:4, shift:1, mv:0,  req:[], light:true},
  {id:'brigandine',slot:'armour', name:'Studded Brigandine',   cost:150,  ac:5, shift:1, mv:0,  req:['leather'], light:true},
  {id:'chainshirt',slot:'armour', name:'Chain Shirt',          cost:240,  ac:5, shift:1, mv:0,  req:['blacksmith'], light:true, ward:1},
  {id:'hide',      slot:'armour', name:'Thick Hide & Furs',    cost:95,   ac:5, shift:1, mv:-1, req:[]},
  {id:'scale',     slot:'armour', name:'Scale Hauberk',        cost:320,  ac:5, shift:2, mv:-1, req:['blacksmith']},
  {id:'heavychain',slot:'armour', name:'Heavy Chainmail',      cost:520,  ac:6, shift:1, mv:-1, req:['blacksmith']},
  {id:'cuirass',   slot:'armour', name:'Cuirass / Breastplate',cost:950,  ac:6, shift:2, mv:-1, req:['blacksmith']},
  {id:'splint',    slot:'armour', name:'Splint Mail',          cost:750,  ac:6, shift:2, mv:-2, req:['blacksmith']},
  {id:'lamellar',  slot:'armour', name:'Banded Lamellar',      cost:1350, ac:6, shift:2, mv:-2, req:['blacksmith'], graze0:true},
  {id:'halfplate', slot:'armour', name:'Half-Plate',           cost:2200, ac:6, shift:3, mv:-2, req:['blacksmith'], graze0:true},
  {id:'none',      slot:'shield', name:'No shield',            cost:0,   pool:0, req:[]},
  {id:'bucklers',  slot:'shield', name:'Light Bucklers',       cost:25,  pool:2, req:[]},
  {id:'heavyshield',slot:'shield',name:'Heavy Infantry Shields',cost:50, pool:4, req:[]},
  {id:'spears',    slot:'melee',  name:'Infantry Spears',      cost:0,   dmg:3, reach:0,  req:[], note:'Set Spearwall: in a Shield Wall, each enemy that closes takes one Grazing Hit.'},
  {id:'shortswords',slot:'melee', name:'Shortswords & Handaxes',cost:60, dmg:3, reach:0,  cd:0.85, req:[], note:'Quick hands: melee attacks 15% faster.'},
  {id:'pikes',     slot:'melee',  name:'Long Spears / Pikes',  cost:65,  dmg:3, reach:22, req:['carpentry'], note:'Reach: melee attacks land from further out.'},
  {id:'greatswords',slot:'melee', name:'Heavy Greatswords',    cost:160, dmg:4, reach:0,  crush:1, req:['blacksmith'], note:'Armour-crushing: strips 1 step of armour on every hit.'},
  {id:'shortbows', slot:'ranged', name:'Shortbows',            cost:0,   dmg:2, range:280, req:[]},
  {id:'crossbows', slot:'ranged', name:'Light Crossbows',      cost:130, dmg:3, range:250, cd:1.3, close:130, req:['carpentry'], note:'+1 step at short range (130px). Slow to reload.'},
  {id:'longbows',  slot:'ranged', name:'Longbows',             cost:160, dmg:3, range:370, req:['carpentry'], note:'On a Critical, ignores 1 step of armour.'},
  {id:'towershield',slot:'kit',   name:'Siege Tower Shield',   cost:60,  req:['carpentry'], note:'+3 Shield Pool (cap 7).'},
  {id:'focus',     slot:'kit',    name:'Caster Focus',         cost:65,  req:['magetower'], note:'Casters +60 range. +1 Ward Token each contract.'},
  {id:'satchel',   slot:'kit',    name:'Sapper Satchel',       cost:30,  req:['engineering'], note:'A Sharper is thrown at the thickest crowd every 10 seconds.'},
  {id:'nomount',   slot:'mount',  name:'On foot',              cost:0,   req:[]},
  {id:'riding',    slot:'mount',  name:'Riding Horses',        cost:120, spd:1.18, pool:0, req:['stables'], note:'Faster. No Mount Pool.'},
  {id:'lighthorse',slot:'mount',  name:'Light Horse',          cost:220, spd:1.26, pool:4, req:['stables'], note:'Faster. Mount Pool 4 soaks hits after the Shield Pool. Command Radius +1 hex.'},
  {id:'warhorses', slot:'mount',  name:'Warhorses',            cost:480, spd:1.18, pool:8, req:['stables','barracks'], note:'Mount Pool 8. Command Radius +1 hex.'}
];
const gear = id => GEAR.find(g => g.id === id);

/* ---------------------------------------------------------------------------
   BESTIARY - Player's Manual 1.6, Sections 12.4 and 12.5.
   arch follows the Enemy Behaviour table (10.1):
     brute  = Melee Bruisers       skirm = Ranged Skirmishers
     caster = Enemy Caster         beast = Beasts / Monsters
     boss   = Enemy Commander / Boss
   sc = sprite scale. rng/cd/keep = ranged reach, reload frames, preferred distance.
--------------------------------------------------------------------------- */
const BESTIARY = {
  // Melee Bruisers
  levy:    {name:'Hollow Levy',          arch:'brute', tier:1, con:2, ac:3, shift:0, dmg:2, skill:0, speed:0.74, r:9,  colour:'#6e6757', xp:1, coin:1, frenzy:true, sc:2},
  brigand: {name:'Highway Brigand',      arch:'brute', tier:1, con:3, ac:4, shift:0, dmg:2, skill:1, speed:0.86, r:10, colour:'#8c6a3a', xp:2, coin:1, sc:2},
  enforcer:{name:'Skulk Enforcer',       arch:'brute', tier:1, con:4, ac:4, shift:1, dmg:3, skill:2, speed:0.92, r:11, colour:'#8c3a2e', xp:3, coin:2, sc:2, bully:true},
  hobgob:  {name:'Hobgoblin Shock Line', arch:'brute', tier:2, con:4, ac:5, shift:1, dmg:3, skill:3, speed:0.84, r:12, colour:'#5e6e4a', xp:4, coin:2, sc:2.1},
  renegade:{name:'Free Company Renegade',arch:'brute', tier:2, con:4, ac:5, shift:1, dmg:3, skill:3, speed:0.88, r:11, colour:'#6a5a44', xp:4, coin:3, sc:2},
  raider:  {name:'Cambion Raider',       arch:'brute', tier:2, con:4, ac:5, shift:1, dmg:3, skill:3, speed:1.22, r:11, colour:'#a03a5e', xp:5, coin:2, sc:2},
  phalanx: {name:'Frost-Vault Phalanx',  arch:'brute', tier:3, con:4, ac:6, shift:2, dmg:4, skill:4, speed:0.74, r:12, colour:'#4e7a8c', xp:7, coin:3, sc:2.1, critPierce:true},
  warden:  {name:'Kraggan Vault-Warden', arch:'brute', tier:3, con:5, ac:6, shift:3, dmg:4, skill:4, speed:0.62, r:13, colour:'#6e5a3a', xp:8, coin:3, sc:2.3, grazeImmune:true},
  // Beasts
  wolf:    {name:'Timber Wolf',          arch:'beast', tier:1, con:3, ac:4, shift:0, dmg:2, skill:2, speed:1.42, r:9,  colour:'#7a8188', xp:2, coin:1, sc:2},
  cinder:  {name:'Cinderling',           arch:'beast', tier:1, con:2, ac:4, shift:0, dmg:2, skill:2, speed:1.55, r:8,  colour:'#c4622e', xp:3, coin:1, sc:2, hellspark:true},
  // Ranged Skirmishers
  goblinsniper:{name:'Goblin Tunnel-Sniper', arch:'skirm', tier:1, con:2, ac:4, shift:0, dmg:2, skill:0, rskill:2, speed:0.85, r:8,  colour:'#8db04a', xp:3, coin:2, sc:1.9, rng:270, cd:190, keep:220},
  crossbow:{name:'Skulk Crossbowman',    arch:'skirm', tier:1, con:3, ac:4, shift:0, dmg:3, skill:0, rskill:3, speed:0.9,  r:10, colour:'#4a4450', xp:3, coin:2, sc:2, rng:300, cd:250, keep:240, critPierce:true},
  arbalest:{name:'Suderian Rebel Arbalest', arch:'skirm', tier:2, con:3, ac:5, shift:1, dmg:4, skill:1, rskill:3, speed:0.85, r:10, colour:'#6a5a3a', xp:5, coin:3, sc:2, rng:380, cd:270, keep:300, ignoreShift:1},
  shadowhunter:{name:'Frost-Vault Shadow-Hunter', arch:'skirm', tier:3, con:4, ac:5, shift:2, dmg:4, skill:3, rskill:4, speed:1.05, r:10, colour:'#3e4a5a', xp:7, coin:3, sc:2, rng:380, cd:200, keep:280, critPierce:true, scoot:true},
  // Enemy Casters
  hedgewitch:{name:'Outlaw Hedge-Witch',  arch:'caster', tier:1, con:3, ac:4, shift:0, dmg:2, skill:1, mg:2, speed:0.8, r:10, colour:'#4a6a3a', xp:4, coin:3, sc:2, rng:300, cd:300, keep:260, spells:['hex']},
  battlemage:{name:'Arcana Guild Battle-Mage', arch:'caster', tier:2, con:3, ac:5, shift:1, dmg:2, skill:1, mg:3, speed:0.8, r:10, colour:'#8a2a2a', xp:6, coin:4, sc:2, rng:320, cd:140, keep:270, spells:['orb','orb','fireball']},
  sapper:  {name:'Gnome Sapper',         arch:'caster', tier:2, con:4, ac:5, shift:1, dmg:2, skill:1, mg:3, speed:0.75, r:9,  colour:'#6a4a2a', xp:5, coin:4, sc:1.9, rng:300, cd:330, keep:240, spells:['sharper']},
  tithepriest:{name:'Frost-Vault Tithe-Priest', arch:'caster', tier:2, con:4, ac:5, shift:1, dmg:3, skill:1, mg:3, speed:0.8, r:10, colour:'#5a4a6a', xp:6, coin:4, sc:2, rng:300, cd:300, keep:280, spells:['bane','rime']},
  // Objective structures: they never move or attack
  nest:    {name:'Nest',                 arch:'fixed', tier:1, con:30, ac:3, shift:0, dmg:0, skill:0, speed:0, r:22, colour:'#5a4a36', xp:14, coin:10, sc:2.6, frenzy:true, spawner:true},
  engine:  {name:'Siege Engine',         arch:'fixed', tier:1, con:20, ac:3, shift:1, dmg:0, skill:0, speed:0, r:22, colour:'#8a5a2b', xp:10, coin:8, sc:2.6, frenzy:true},
  // Commanders and Bosses
  orsolt:  {name:'Orsolt the Hollow Reeve', arch:'boss', tier:1, con:40, ac:4, shift:1, dmg:3, skill:2, mg:2, speed:0.8, r:20, colour:'#5a5a4a', xp:40, coin:25, boss:true, sc:3, rallies:'levy', guards:['levy','levy','levy','levy','levy','levy','brigand','brigand']},
  vane:    {name:'Captain Vane',         arch:'boss', tier:1, con:55, ac:5, shift:1, dmg:3, skill:3, speed:0.98, r:20, colour:'#b4463a', xp:60, coin:30, boss:true, sc:3.1, summons:'enforcer', guards:['enforcer','enforcer','enforcer','crossbow','crossbow']},
  alpha:   {name:'Alpha Dire Wolf',      arch:'boss', tier:1, con:40, ac:5, shift:1, dmg:3, skill:3, speed:1.45, r:18, colour:'#4a4e54', xp:40, coin:20, boss:true, sc:3.4, wolfish:true, howl:true, guards:['wolf','wolf','wolf','wolf','wolf']},
  ogre:    {name:'Cave Ogre Brute',      arch:'boss', tier:2, con:70, ac:5, shift:1, dmg:4, skill:3, speed:0.70, r:24, colour:'#7e6a4e', xp:60, coin:30, boss:true, sc:3.6, sweep:true, guards:['hobgob','hobgob','hobgob','goblinsniper','goblinsniper']},
  inquisitor:{name:'Inquisitor-Apprentice', arch:'boss', tier:2, con:70, ac:5, shift:2, dmg:3, skill:3, mg:2, speed:0.9, r:20, colour:'#7a1e1e', xp:70, coin:35, boss:true, sc:3.1, spells:['bane','ray'], cd:240, guards:['renegade','renegade','crossbow','crossbow']},
  devil:   {name:'Devil-Knight',         arch:'boss', tier:3, con:150,ac:6, shift:2, dmg:4, skill:4, speed:0.88, r:28, colour:'#5a2436', xp:120,coin:50, boss:true, sc:3.8, grazeImmune:true, sweep:true, brimstone:true, guards:['cinder','cinder','cinder','cinder','cinder','cinder']},
  wyrm:    {name:'Young Wyrm',           arch:'boss', tier:3, con:160,ac:6, shift:2, dmg:4, skill:4, speed:1.0,  r:28, colour:'#3a6a4a', xp:130,coin:55, boss:true, sc:3.4, sweep:true, breath:true, cd:300, guards:['raider','raider','cinder','cinder']},
  ilvaryn: {name:'Strategos Ilvaryn',    arch:'boss', tier:3, con:140,ac:6, shift:3, dmg:5, skill:5, speed:1.0,  r:22, colour:'#2e3a4e', xp:140,coin:60, boss:true, sc:3.2, twice:true, rallies:'*', guards:['phalanx','phalanx','phalanx','phalanx','shadowhunter','shadowhunter']}
};
const RANGED_ARCH = a => a === 'skirm' || a === 'caster';
const WAVES = [
  {pool:['levy','levy','levy','goblinsniper'],                       rate:60, burst:2},
  {pool:['levy','brigand','brigand','goblinsniper'],                 rate:50, burst:3},
  {pool:['levy','brigand','wolf','goblinsniper'],                    rate:40, burst:3},
  {pool:['brigand','wolf','enforcer','crossbow','hedgewitch'],       rate:34, burst:4},
  {pool:['levy','enforcer','cinder','crossbow','goblinsniper'],      rate:30, burst:5},
  {pool:['enforcer','cinder','hobgob','renegade','battlemage','sapper'], rate:26, burst:5},
  {pool:['hobgob','raider','wolf','arbalest','tithepriest'],         rate:22, burst:6},
  {pool:['raider','phalanx','cinder','arbalest','battlemage'],       rate:20, burst:6},
  {pool:['phalanx','warden','raider','shadowhunter','sapper'],       rate:18, burst:7},
  {pool:['phalanx','warden','renegade','shadowhunter','battlemage'], rate:15, burst:8}
];
const TIER_WAVE_OFFSET = { 1:0, 2:3, 3:5 };

/* ---------------------------------------------------------------------------
   CONTRACTS - Chapter 11. Three of the Six Scenario Objectives (Table 11.3)
   are playable: Hold the Redoubt, Headhunter Clash, High-Value Extraction.
--------------------------------------------------------------------------- */
/* QA: 'for a A street boss' fix: patrons may already carry an article (F-34, F-03, 'A Shadowy Broker'). */
const forPatron = p => { p = String(p || ''); return /^the /i.test(p) ? 'for the ' + p.slice(4) : /^an? /i.test(p) ? 'for ' + p.replace(/^(an?) /i, (m, a) => a.toLowerCase() + ' ') : (/^[aeiou]/i.test(p) ? 'for an ' : 'for a ') + p; };
const PATRONS = ['Minor Imperial Noble','Suderian Freeman Merchant','Mendorian Order Prelate','Dwarven Syndicate Factor','Reprobate Collective','A Shadowy Broker'];
const OBJECTIVES = {
  hold:   {name:'Hold the Redoubt',       brief:'Hold the old fort until the relief column arrives. Two commanders will come for it.'},
  hunt:   {name:'Headhunter Clash',       brief:'Find the enemy camps and kill every commander.'},
  extract:{name:'High-Value Extraction',  brief:'Crack three strongboxes in the ruins, then leave by the road you came in on.'},
  escort:{name:'Caravan Escort', brief:'Guard the caravan through the forest.'},
  rescue:{name:'Hostage Rescue', brief:'Free the hostages and get them to the road.'},
  assassinate:{name:'Assassination', brief:'Kill the mark before they escape.'},
  purge:{name:'Purge the Nests', brief:'Destroy every nest.'},
  sabotage:{name:'Sabotage', brief:'Burn the siege engines, then get out.'},
  beacons:{name:'Light the Beacons', brief:'Keep all three beacons burning at once.'},
  relic:{name:'Relic Recovery', brief:'Take the relic and carry it home.'}
};
const TIER_PAY = {1:1, 2:2.25, 3:4.5};
const RESISTANCE = {1:4, 2:5, 3:6};          // Patron Resistance Difficulty by tier (11.1)

/* ---------------------------------------------------------------------------
   CONTRACT EDGES - Table 4.2, bought with War Council successes (4.3)
--------------------------------------------------------------------------- */
const EDGES = [
  {id:'terms', name:'Better Terms',          text:'+20% contract pay.'},
  {id:'recon', name:'Deep Reconnaissance',   text:'The whole map is revealed, and every Blip Token starts face up.'},
  {id:'asset', name:'Logistical Asset',      text:'Two Field Medicine Poultices wait where you deploy.'},
  {id:'approach', name:'Favourable Approach',text:'Deploy under fog: enemy ranged attacks shift down 1 step for the first 90 seconds, and the squad starts with 2 Ward Tokens.'}
];

/* ---------------------------------------------------------------------------
   MAP LOOT - caches, kit and salvage left on the field. Walk over to open.
   Everything here is a consumable, munition or ritual from the Gear Deck.
--------------------------------------------------------------------------- */
const LOOT = {
  poultice:{name:'Field Medicine Poultices', one:'Field Medicine Poultice', many:'Field Medicine Poultices', glyph:'cross',  col:'#d04050', w:5, text:'Every Squad Mate regains 2 Condition and the Leader 2 Wounds. Anyone Bleeding Out stands at 1 Condition.'},
  veteran: {name:"Quartermaster's War Chest",one:'Quartermaster\'s War Chest', many:'Quartermaster\'s War Chests', glyph:'star',   col:'#ffd040', w:3, text:'A Momentum rank, at once.'},
  ward:    {name:'Stoneskin Scroll',         one:'Stoneskin Scroll', many:'Stoneskin Scrolls', glyph:'shield', col:'#87ceeb', w:4, text:'Ward Tokens to 4 and the Shield Pool refilled.'},
  purse:   {name:'Dead Man\u2019s Purse',     one:'Dead Man\u2019s Purse', many:'Dead Men\u2019s Purses', glyph:'coin',   col:'#e8c040', w:5, text:'Coin.'},
  wafer:   {name:'Wishing Wafer',            one:'Wishing Wafer', many:'Wishing Wafers', glyph:'heart',  col:'#f0c96a', w:2, text:'+1 spent Luck.'},
  storm:   {name:'Stormroot Brew',           one:'Stormroot Brew', many:'Stormroot Brews', glyph:'flame',  col:'#9ae070', w:3, text:'Every attack die shifts up 1 step for 15 seconds.'},
  cusser:  {name:'Concussion Charge',        one:'Concussion Charge', many:'Concussion Charges', glyph:'bomb',   col:'#b8b0a0', w:3, text:'A black-powder blast around the Leader. Everything caught tests Morale.'},
  smoke:   {name:'Smoke Pots',               one:'Smoke Pot', many:'Smoke Pots', glyph:'eye',    col:'#a0a0a0', w:2, text:'Enemy ranged attacks shift down 1 step for 15 seconds.'},
  scroll:  {name:'Spell Scroll: Fireball',   one:'Spell Scroll: Fireball', many:'Spell Scrolls: Fireball', glyph:'book',   col:'#e07a32', w:2, text:'Three Fireballs land on the three thickest crowds.'},
  mules:   {name:'Pack Mule',                one:'Pack Mule', many:'Pack Mules', glyph:'horse',  col:'#8a5a2b', w:2, text:'Every coin and gem on the field comes to you.'},
  captive: {name:'Chained Captive',          one:'Chained Captive', many:'Chained Captives', glyph:'bars',   col:'#c8c0b0', w:2, text:'Most freed captives thank you with what coin they have. A few ask to join, and once in a long while one goes to your camp to run a building.'}
};
const LOOT_KEYS = Object.keys(LOOT);
function rollLoot(r){
  const tot = LOOT_KEYS.reduce((a,k) => a + LOOT[k].w, 0);
  let x = r() * tot;
  for (const k of LOOT_KEYS){ x -= LOOT[k].w; if (x <= 0) return k; }
  return 'purse';
}

/* ---------------------------------------------------------------------------
   TACTICS CARDS - in-field level-up pool. Every one is an ability, spell,
   prayer, working or doctrine from the Core Rules.
--------------------------------------------------------------------------- */
const CARDS = [
  {id:'vanguard',   spec:'SOLDIER', ability:true, max:2, tag:'Soldier Talent', name:'Vanguard', glyph:'sword',
   text:r=>`Every melee attack die shifts up ${r} step${r>1?'s':''}.`},
  {id:'armourbreak',spec:'SOLDIER', ability:true, max:2, tag:'Soldier Talent', name:'Armour Break', glyph:'anvil',
   text:r=>`A Solid Hit strips ${r} step${r>1?'s':''} of the target's armour for the rest of the contract.`},
  {id:'bleeding',   spec:'SOLDIER', ability:true, max:3, tag:'Soldier Talent', name:'Bleeding Wound', glyph:'drop',
   text:r=>`A Solid Hit causes ${r} persistent damage a second.`},
  {id:'taunt',      spec:'SOLDIER', ability:true, max:2, tag:'Soldier Talent', name:'Taunt', glyph:'flag',
   text:r=>`Soldiers draw enemies within ${90+r*50}px onto themselves.`},
  {id:'shieldwall', spec:'SOLDIER', ability:true, max:1, tag:'Soldier Talent', name:'Shield Wall Mastery', glyph:'shield',
   text:()=>'In a Shield Wall, Soldiers keep attacking and the squad gains 1 Ward Token every 4 seconds.'},
  {id:'scout',      spec:'FOLK_HERO', ability:true, max:3, tag:'Folk Hero Talent', name:'Scout', glyph:'boot',
   text:r=>`The squad moves ${r*9}% faster, sees ${r*15}% further, and ignores forest and rubble.`},
  {id:'rally',      spec:'FOLK_HERO', ability:true, max:3, tag:'Folk Hero Talent', name:'Rallying Cry', glyph:'horn',
   text:r=>`Every ${36-r*8} seconds the squad gains 2 Ward Tokens.`},
  {id:'getback',    spec:'FOLK_HERO', ability:true, max:1, tag:'Folk Hero Talent', name:'Get Back in the Fight', glyph:'heart',
   text:()=>'Reaching a Squad Mate who is Bleeding Out stands them up at once, at 1 Condition.'},
  {id:'softspot',   spec:'SCOUNDREL', ability:true, max:3, tag:'Scoundrel Talent', name:'Sharpen the Soft Spot', glyph:'dagger',
   text:r=>`A Scoundrel Solid Hit deals +${r} flat damage.`},
  {id:'poisoned',   spec:'SCOUNDREL', ability:true, max:1, tag:'Scoundrel Talent', name:'Poisoned Edge', glyph:'potion',
   text:()=>'A Scoundrel Solid Hit weakens the target: its attack dice shift down 1 step and it slows.'},
  {id:'highlight',  spec:'SCOUNDREL', ability:true, max:1, tag:'Scoundrel Talent', name:'Highlight Weakness', glyph:'eye',
   text:()=>'A Scoundrel Solid Hit exposes the target: every attack against it shifts up 1 step for 3 seconds.'},
  {id:'cutpurse',   spec:'SCOUNDREL', ability:true, max:3, tag:'Scoundrel Talent', name:'Cut Purse', glyph:'coin',
   text:r=>`Coin drops ${r*6}% more often.`},
  {id:'litany',     spec:'CLERIC', ability:true, max:3, tag:'Cleric Talent', name:'Litany of the Shield', glyph:'shield',
   text:r=>`The squad gains 1 Ward Token every ${12-r*3} seconds.`},
  {id:'warden',     spec:'CLERIC', ability:true, max:1, tag:'Cleric Talent', name:'Warden of the Line', glyph:'bars',
   text:()=>'A Shield Wall gives +1 more AC.'},
  {id:'chaplain',   spec:'CLERIC', ability:true, max:1, tag:'Cleric Talent', name:'Field Chaplain', glyph:'cross',
   text:()=>'Squad Morale checks roll twice and keep the better.'},
  {id:'masscure',   spec:'CLERIC', req:'chapel', max:2, tag:'Divine Prayer', name:'Mass Cure', glyph:'heart',
   text:r=>`Every ${12-r*3} seconds every standing Squad Mate regains 1 Condition.`},
  {id:'bless',      spec:'CLERIC', req:'chapel', max:2, tag:'Continuous Prayer', name:'Bless the Line', glyph:'sun',
   text:r=>`Every 20 seconds the squad's attack dice shift up 1 step for ${r*4+2} seconds.`},
  {id:'warded',     spec:'MAGE', ability:true, max:1, tag:'Mage Talent', name:'Warded Robes', glyph:'star',
   text:()=>'+1 Ward Token at the start, and another every 20 seconds.'},
  {id:'precision',  spec:'MAGE', ability:true, max:1, tag:'Mage Talent', name:'Arcane Precision', glyph:'eye',
   text:()=>'Spell attack dice shift up 1 step.'},
  {id:'margin',     spec:'MAGE', ability:true, max:2, tag:'Mage Talent', name:'Grimoire Margin', glyph:'book',
   text:r=>`Every Mage fires ${r} extra dart${r>1?'s':''} per cast.`},
  {id:'burning',    spec:'MAGE', max:3, tag:'Arcane: Once per Scenario', name:'Burning Hands', glyph:'flame',
   text:r=>`A cone of Piercing fire sweeps ahead of the squad every ${(4.5-r*0.7).toFixed(1)} seconds.`},
  {id:'frost',      spec:'MAGE', max:3, tag:'Arcane Cantrip', name:'Ray of Frost', glyph:'snow',
   text:r=>`Enemies close to the Leader (${110+r*40}px) move ${15+r*12}% slower.`},
  {id:'fireball',   spec:'MAGE', req:'magetower', max:3, tag:'Arcane: Once per Scenario', name:'Fireball', glyph:'flame',
   text:r=>`Every ${(9-r*1.5).toFixed(1)} seconds a 7-hex blast lands on the thickest crowd.`},
  {id:'thornwise',  spec:'WITCH', ability:true, max:1, tag:'Witch Talent', name:'Thorn-Wise', glyph:'thorn',
   text:()=>'Briar Thicket sprouts behind the Leader, and every thorn bites 1 harder.'},
  {id:'lingering',  spec:'WITCH', ability:true, max:1, tag:'Witch Talent', name:'Lingering Hex', glyph:'skull',
   text:()=>'Withering Hex lasts twice as long.'},
  {id:'evileye',    spec:'WITCH', ability:true, max:1, tag:'Witch Talent', name:'Evil Eye', glyph:'eye',
   text:()=>'Enemies test Morale at 75% Condition and roll 1 step lower.'},
  {id:'briar',      spec:'WITCH', req:'alchemy', max:3, tag:'Occult Foci', name:'Briar Thicket', glyph:'thorn',
   text:r=>`Thorns sprout behind the Leader: ${r} Piercing damage a second to anything in them.`},
  {id:'hex',        spec:'WITCH', req:'alchemy', max:2, tag:'Occult Foci', name:'Withering Aura', glyph:'potion',
   text:r=>`Enemies close to the Leader (160px) shift their attack dice down ${r} step${r>1?'s':''}.`},
  {id:'veteran',    max:2, tag:'Veteran Damage Mastery', name:"Veteran's Edge", glyph:'sword',
   text:r=>`Every Base Damage Die shifts up ${r} step${r>1?'s':''}.`},
  {id:'radius',     max:3, tag:'Command Radius', name:'Hold the Line', glyph:'flag',
   text:r=>`Command Radius +${r*22}px.`},
  {id:'plunder',    req:'command', max:3, tag:'Doctrine', name:'Plunder Management', glyph:'coin',
   text:r=>`Coin and experience +${r*30}%.`},
  {id:'fieldmed',   req:'hospital', max:3, tag:'Doctrine', name:'Field Medicine', glyph:'cross',
   text:r=>`The Leader regains 1 spent Wound every ${10-r*2} seconds.`},
  {id:'stakes',     req:'engineering', max:3, tag:'Preparation Work', name:'Stake Line', glyph:'stake',
   text:r=>`Stakes are set behind the Leader every ${5-r} seconds: ${r} damage to anything crossing.`},
  {id:'sharpers',   req:'engineering', max:3, tag:'Munition', name:'Sharpers', glyph:'bomb',
   text:r=>`Every ${(9-r*1.5).toFixed(1)} seconds a Sharper bursts in the thickest crowd: 1 Piercing damage to each, and they are Staggered.`},
  {id:'skirmisher', spec:'FOLK_HERO', req:'ranger', max:3, tag:'Doctrine', name:'Skirmisher Drill', glyph:'bow',
   text:r=>`Archers loose ${r*20}% faster and reach ${r*35}px further.`},
  {id:'volley',     spec:'FOLK_HERO', req:'ranger', max:2, tag:'Doctrine', name:'Volley Fire', glyph:'arrows',
   text:r=>`Every archer looses ${r} extra arrow${r>1?'s':''} at another target.`}
];
const card = id => CARDS.find(c => c.id === id);

