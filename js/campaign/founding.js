/* js/campaign/founding.js (INT-1 step 2, 2026-11-16): FOUNDING THE CHAPTER.
   Cut unchanged from the inline script in index.html (old lines 6627 to 7150). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   FOUNDING THE CHAPTER - Player's Manual Section 1.7, Step 1.
   Elect the Chapter Master (Race, Social Class, Specialty), whose Social
   Class sets the camp's passive bonus (Table 4.8). Then choose the Starting
   Holding. The holding is cosmetic for now: every facility exists in every
   holding, dressed to suit it (bunks instead of tents on a barge, and so on).
============================================================================ */

/* ---------------------------------------------------------------------------
   THE CHAPTER MASTER'S CAMP BONUS - Table 4.8, as the game plays it
--------------------------------------------------------------------------- */
const CM_BONUS = {
  DEVOUT: {rule:'Deployed Clerics begin each battle with +1 Favour.',
           game:"Deployed Clerics: Cure Wounds heals 1 more, and Healing Word recovers twice as fast."},
  EDELOS: {rule:'Merchant Stalls cost 70gp less to build, and one Town Market purchase of up to 50gp per Downtime is free.',
           game:'Merchant Stalls cost 70gp less, and one Quartermaster purchase of up to 50gp is free each downtime.'},
  FREEMAN:{rule:'Workshop facilities cost 10% less to build.',
           game:'Workshops (Blacksmith, Carpentry, Leatherworking, Engineering) cost 10% less to build.'},
  NOBLE:  {rule:'Patron Resistance Difficulty is reduced by 1 against Imperial and noble patrons.',
           game:'Patron Resistance is 1 lower against Imperial patrons.'},
  OUTCAST:{rule:'Once per battle, reveal one hidden Blip or trap token.',
           game:'At the start of every contract, one hidden Blip Token and one hidden trap are revealed.'},
  SLAVE:  {rule:'Freed captives may be recruited at no cost, and each Liberation deed adds 25gp to the Treasury.',
           game:'Freed captives join at no cost, and every captive or hostage freed adds 25gp to the Treasury.'}
};
const cmClass = () => (META && META.master ? META.master.cls : null);
const cmIs = cls => cmClass() === cls || !!(META && META.coMaster && META.coMaster.cls === cls);
// Patron circles (Section 4.3): the Charter Rank die shifts +1 step when the
// Chapter Master's Race, Social Class or Specialty matches the patron's circle.
const PATRON_CIRCLE = {
  'Minor Imperial Noble':['NOBLE','EDELOS','HUMAN'], 'Suderian Freeman Merchant':['FREEMAN','SLAVE','HALF_ELF'],
  'Mendorian Order Prelate':['DEVOUT','CLERIC','NEPHILIM'], 'Dwarven Syndicate Factor':['DWARF','GNOME','FREEMAN'],
  'Reprobate Collective':['OUTCAST','WITCH','GOBLIN','HALF_ORC'], 'A Shadowy Broker':['SCOUNDREL','OUTCAST','CAMBION','DARK_ELF']
};
function cmMatches(patron){
  const m = META.master, c = PATRON_CIRCLE[patron] || [];
  return !!m && (c.includes(m.race) || c.includes(m.cls) || c.includes(m.spec));
}
// Facility prices after the Chapter Master's bonus
function facCost(f){
  let c = f.cost;
  if (cmIs('EDELOS') && f.id === 'merchant') c -= 70;
  if (cmIs('FREEMAN') && ['blacksmith','carpentry','leather','engineering'].includes(f.id)) c = Math.round(c * 0.9);
  return Math.max(0, c);
}
// Q50: Cayde's chair gives no free purchase of its own (his gift is Lord Artemis's crate, pd37.js); a player-named Edelos Master or co-Master does
const cmCayde = () => !!(META && META.master && META.master.hero === 'cayde');
const cmOwnEdelos = () => !!(META && ((META.master && META.master.cls === 'EDELOS' && !cmCayde()) || (META.coMaster && META.coMaster.cls === 'EDELOS')));
const edelosFreeOK = g => cmOwnEdelos() && META.edFree !== META.deployments && g.cost > 0 && g.cost <= 50 && !((META.gear && META.gear.owned) || []).includes(g.id);   // Q50: an item already owned is never the free one
// the camp-bonus words: Cayde's card names the crate (CAMPAIGN_LINES.pd37.caydeBonus); every other Master keeps CM_BONUS
function cmGame(cls, m){
  const L = window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd37;
  if (cls === 'EDELOS' && m && m.hero === 'cayde' && L && L.caydeBonus) return L.caydeBonus.replace('{discount}', 70).replace('{cap}', (window.PD37 && PD37.K.cap) || 50);
  return CM_BONUS[cls].game;
}
function liberationDeed(n, why){
  if (!cmIs('SLAVE') || n <= 0) return;
  META.treasury += 25 * n; if (G) note(`${n > 1 ? n + ' freed' : 'Freed'}: +${25 * n}gp to the Treasury (the Chapter Master's oath).`);
}

/* ---------------------------------------------------------------------------
   THE CHAPTER MASTER'S LOOK: an older veteran, by race and sex, in the
   Chapter's colours. And a framed bust portrait for menus and the War Council.
--------------------------------------------------------------------------- */
function masterLook(m){
  const fem = sexOf(m) === 'f', look = Object.assign({}, personLook(m, true));
  look.hair = m.race === 'NEPHILIM' ? '#f8f0d8' : m.race === 'ZUHRI' ? '#e8f4ff' : '#cfcbc0';
  if (!fem && !['GOBLIN','HOBGOBLIN','SUN_ELF','GREY_ELF','DARK_ELF','HALF_ELF','ZUHRI','NEPHILIM'].includes(m.race)) look.beard = true;
  if (fem && look.hairStyle === 'long') look.hairStyle = 'bun';
  const b = banner(); look.cape = shade(b.c1, 0.8); look.capeTrim = C.gold; look.back = null;
  return look;
}
masterSprite = function(){
  const m = ensureMaster(), key = 'cm3:' + m.name + m.race + m.spec + m.cls + sexOf(m) + bannerSig() + gearLook().armour;
  return SPR[key] || humanoidSprite(key, masterLook(m));
};
// A head-and-shoulders portrait in a gilt frame.
function bustCanvas(spr, bg, look){
  const src = spr && spr.frames && spr.frames[0], c = newCanvas(24, 24), g = c.getContext('2d'), P = painter(g);
  const sy = 9 + (look && look.short ? 2 : 0) - (look && look.tall ? 1 : 0);
  P(0, 0, 24, 24, C.goldD); P(1, 1, 22, 22, C.gold); P(2, 2, 20, 20, bg || '#2e3a44');
  for (let y = 3; y < 21; y += 3) P(2, y, 20, 1, shade(bg || '#2e3a44', 0.9));
  if (src){ g.save(); g.beginPath(); g.rect(2, 2, 20, 20); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(src, 4, sy, 13, 11, -1, 2, 26, 22); g.restore(); }
  P(1, 22, 22, 1, C.goldD);
  return c;
}
const masterBustURL = () => { const m = ensureMaster();
  return toURL('cmb3:' + m.name + m.race + m.spec + m.cls + sexOf(m) + bannerSig() + gearLook().armour, () => bustCanvas(masterSprite(), shade(banner().c1, 0.55), masterLook(m)), 6); };
function previewBustURL(race, sex, spec, cls){
  const m = {id:'CMP', name:'preview' + race + sex, race, sex, spec:spec || 'CLERIC', cls:cls || 'FREEMAN'};
  const key = 'cmpv3:' + race + sex + m.spec + bannerSig();
  return toURL(key, () => bustCanvas(SPR['cmpvs:' + key] || (SPR['cmpvs:' + key] = humanoidSprite('cmpvs:' + key, masterLook(m))), shade(banner().c1, 0.55), masterLook(m)), 4);
}

/* ---------------------------------------------------------------------------
   HOLDINGS - the same facilities, dressed for each home
--------------------------------------------------------------------------- */
const HOLDINGS = {
  fort:     {name:'Frontier Timber Fort', short:'Fort', blurb:'A stockade clearing in the forest: room to build, timber to hand, and a long way from anyone who might help.',
             house:'Chapter House', houseSub:'The planning table', qm:'Quartermaster', fire:'The Campfire', fireSub:'Hiring and stories', grave:'The Graveyard'},
  barge:    {name:'Dockside Cog-Barge', short:'Barge', blurb:'A broad river cog moored at a busy quay. Every facility is a deck, a hold or a cabin, and the whole Chapter can cast off at dawn.',
             house:'The Great Cabin', houseSub:'The chart table', qm:"Purser's Hatch", fire:'The Gangplank Brazier', fireSub:'Sellswords come aboard here', grave:'The Memorial Rail'},
  warehouse:{name:'Abandoned City Warehouse', short:'Warehouse', blurb:'A gutted merchant warehouse in the city. Every facility is a room, a loft or a corner of the great floor, and the street door is never far.',
             house:"The Foreman's Office", houseSub:'The planning table', qm:'The Quartermaster Counter', fire:'The Barrel Fire', fireSub:'Sellswords come in off the street', grave:'The Memorial Wall'}
};
const FAC_SKIN_NAMES = {
  barge:{tents:'Crew Bunks', kitchen:'Galley', tavern:'Grog Deck', command:"Captain's Cabin", merchant:'Trade Hold', cells:'The Brig', barracks:'Fighting Deck',
         training:'Rigging & Drill Deck', armoury:'Arms Locker', stables:'Horse Hold', ranger:"Crow's Nest", hospital:'Sickbay', blacksmith:'Forge Hold',
         carpentry:"Shipwright's Bench", leather:"Sailmaker's Loft", engineering:'Bombard Deck', alchemy:"Apothecary's Cabin", magetower:'Star-Mast Sanctum',
         chapel:'Prow Shrine', palisade:'Boarding Nets & Gangway', watchtower:'Fighting Tops', trapyard:"Bilge Sapper's Bench"},
  warehouse:{tents:'Hammock Loft', kitchen:'Soup Kitchen', tavern:'Back-Room Tavern', command:'Counting Room', merchant:'Street-Front Stalls', cells:'Cellar Lock-Up',
         barracks:'Bunkroom & Drill Floor', training:'Sparring Pit', armoury:'Weapons Cage', stables:'Carriage Bay', ranger:'Rooftop Lookout', hospital:'Infirmary Ward',
         blacksmith:'Foundry Corner', carpentry:"Joiner's Shop", leather:'Tannery Vats', engineering:'Machine Shop', alchemy:"Alchemist's Cellar", magetower:'Attic Observatory',
         chapel:'Chapel Nook', palisade:'Barricaded Doors', watchtower:"Roof Snipers' Nests", trapyard:"Trapmaker's Bench"}
};
const holding = () => (META && HOLDINGS[META.holding]) ? (META.holding === 'waystation' ? 'fort' : META.holding) : 'fort';   /* Index 48: the Waystation uses the fort's art */
const holdKey = () => (META && HOLDINGS[META.holding]) ? META.holding : 'fort';
const HS = () => HOLDINGS[holdKey()];
const BASE_PLOTS = JSON.parse(JSON.stringify(PLOTS)), BASE_HUB = JSON.parse(JSON.stringify(HUB)), BASE_GRAVE = Object.assign({}, GRAVE);
for (const f of FACILITIES) f.baseName = f.baseName || f.name;
function applySkin(){
  const k = holding(), N = FAC_SKIN_NAMES[holdKey()] || {};
  for (const f of FACILITIES) f.name = N[f.id] || f.baseName;
  for (const id in BASE_PLOTS){ const [x, y] = BASE_PLOTS[id]; PLOTS[id] = k === 'barge' ? [x, Math.round(650 + (y - 650) * 0.85)] : [x, y]; }
  for (const id in BASE_HUB){ const p = BASE_HUB[id]; HUB[id] = {x:p.x, y:k === 'barge' ? Math.round(650 + (p.y - 650) * 0.85) : p.y}; }
  Object.assign(GRAVE, BASE_GRAVE, k === 'barge' ? {x:215, y:650} : k === 'warehouse' ? {x:1590, y:600} : {});
  CAMP.trees = null; CAMP.decor = null; CAMP.pat = null; CAMP.dirty = true;
  if (typeof campScenery === 'function' && CAMP.on) campScenery();
}

/* ---------------------------------------------------------------------------
   HOLDING ART - every facility redrawn for the barge and the warehouse.
   Canvas 34 x 36, drawn at an offset of (1, 3), like the fort buildings.
--------------------------------------------------------------------------- */
const BARGE_LOOK = {
  tents:{t:'tarp', c:'#c9b48a'}, kitchen:{t:'galley'}, tavern:{t:'cabin', roof:'#8a3a2a', g:'mug'}, command:{t:'cabin', roof:'#7a3e26', g:'flag', big:1},
  merchant:{t:'hatch', g:'coin'}, cells:{t:'hatch', g:'bars', dark:1}, barracks:{t:'cabin', roof:'#5a4a3a', g:'shield', big:1}, training:{t:'rigging'},
  armoury:{t:'hatch', g:'shield'}, stables:{t:'hatch', g:'horse'}, ranger:{t:'mast', g:'bow'}, hospital:{t:'tarp', c:'#ece4cf', cross:1},
  blacksmith:{t:'hatch', g:'anvil', smoke:1}, carpentry:{t:'bench', g:'saw'}, leather:{t:'tarp', c:'#a07a4a', g:'hide'}, engineering:{t:'cannon'},
  alchemy:{t:'cabin', roof:'#4a6a3a', g:'potion'}, magetower:{t:'mast', g:'star', orb:1}, chapel:{t:'shrine'}, palisade:{t:'nets'},
  watchtower:{t:'mast', g:'flag'}, trapyard:{t:'bench', g:'stake'}
};
const WARE_LOOK = {
  tents:{t:'loft'}, kitchen:{t:'galley'}, tavern:{t:'room', c:'#8a3a2a', g:'mug'}, command:{t:'room', c:'#7a3e26', g:'flag', big:1}, merchant:{t:'stall'},
  cells:{t:'cage', dark:1}, barracks:{t:'room', c:'#5a4a3a', g:'shield', big:1}, training:{t:'pit'}, armoury:{t:'cage', g:'shield'},
  stables:{t:'room', c:'#6a4a2a', g:'horse'}, ranger:{t:'ladder', g:'bow'}, hospital:{t:'room', c:'#ece4cf', g:'cross'}, blacksmith:{t:'furnace', g:'anvil'},
  carpentry:{t:'bench', g:'saw'}, leather:{t:'vat'}, engineering:{t:'furnace', g:'gear'}, alchemy:{t:'room', c:'#4a6a3a', g:'potion'},
  magetower:{t:'ladder', g:'star', orb:1}, chapel:{t:'room', c:'#5a5a6a', g:'cross'}, palisade:{t:'barricade'}, watchtower:{t:'ladder', g:'flag'},
  trapyard:{t:'bench', g:'stake'}
};
function drawSkinBuilding(P, L){
  const t = L.t, plank = (x, y, w, h, c) => { P(x, y, w, h, c); for (let i = x + 2; i < x + w; i += 3) P(i, y, 1, h, shade(c, .78)); P(x, y + h - 1, w, 1, shade(c, .6)); };
  if (t === 'cabin'){
    const x0 = L.big ? 1 : 4, x1 = L.big ? 31 : 28, w = x1 - x0;
    plank(x0, 13, w, 18, '#8a5a2b'); P(x0 - 1, 9, w + 2, 5, L.roof); P(x0 - 1, 9, w + 2, 1, shade(L.roof, 1.3)); P(x0 - 1, 13, w + 2, 1, shade(L.roof, .6));
    const dx = ((x0 + x1) >> 1) - 2; P(dx, 21, 5, 10, '#4a3020'); P(dx + 3, 26, 1, 1, C.gold);
    P(x0 + 3, 17, 4, 4, '#2a2a40'); P(x0 + 4, 18, 2, 2, '#ffe0a0'); P(x0 + 3, 16, 4, 1, C.woodD);
    P(x1 - 4, 15, 2, 3, '#ffb030'); P(x1 - 4, 14, 2, 1, '#3a3a3a');
    if (L.g) signBoard(P, x1 - 12, 17, L.g);
    return;
  }
  if (t === 'tarp'){
    for (const x of [3, 28]){ P(x, 8, 1, 23, C.woodD); }
    for (let y = 0; y < 7; y++) P(2, 7 + y, 28, 1, y % 2 ? L.c : shade(L.c, .85)); P(2, 14, 28, 1, shade(L.c, .6));
    for (const y of [19, 25]){ for (let x = 5; x < 27; x++) P(x, y + Math.round(Math.sin((x - 5) / 21 * Math.PI) * 2), 1, 1, '#c8b890'); P(5, y, 1, 1, '#5a3a1a'); P(26, y, 1, 1, '#5a3a1a'); }
    P(9, 19, 6, 2, '#7a5a3a'); P(17, 26, 6, 2, '#5a4a6a');
    if (L.cross){ P(14, 8, 4, 1, '#c03030'); P(15, 7, 2, 6, '#c03030'); P(13, 9, 6, 2, '#c03030'); }
    if (L.g) glyph(P, L.g, 12, 22, '#3a2a1c');
    return;
  }
  if (t === 'galley'){
    P(5, 14, 22, 3, '#5a5a56'); P(7, 17, 2, 13, '#3a3a3a'); P(23, 17, 2, 13, '#3a3a3a'); P(6, 28, 20, 2, '#3a3a3a');
    P(9, 8, 14, 7, '#3a3a3a'); P(9, 8, 14, 1, '#6a6a6a'); P(11, 6, 10, 2, '#4a4a4a');
    P(10, 17, 12, 4, '#e8602a'); P(12, 17, 8, 2, '#ffd040');
    P(24, 0, 3, 14, '#5a5a56'); P(23, 0, 5, 2, '#3a3a3a'); P(13, 2, 1, 3, 'rgba(230,230,230,.6)'); P(17, 0, 1, 4, 'rgba(230,230,230,.6)');
    P(1, 22, 5, 8, C.wood); P(1, 22, 5, 1, '#b08a5a'); P(27, 24, 4, 6, C.woodD);
    return;
  }
  if (t === 'hatch'){
    P(3, 19, 18, 11, '#5a3a1a'); for (let x = 4; x < 20; x += 3) P(x, 20, 2, 9, L.dark ? '#140e0a' : '#2a1a10'); P(3, 19, 18, 1, '#8a6a3a');
    if (L.dark) for (let x = 4; x < 20; x += 3) P(x + 1, 20, 1, 9, C.steel);
    P(21, 16, 9, 9, C.wood); P(21, 16, 9, 1, '#b08a5a'); P(21, 20, 9, 1, C.woodD); P(23, 9, 7, 7, '#9a6a3a'); P(23, 9, 7, 1, '#c09a6a');
    P(4, 13, 6, 6, C.wood); P(5, 14, 4, 4, '#b08a5a');
    if (L.g) signBoard(P, 21, 3, L.g);
    if (L.smoke){ P(14, 6, 3, 13, '#5a5a56'); P(13, 5, 5, 2, '#3a3a3a'); P(15, 17, 2, 2, '#ff8a2a'); }
    return;
  }
  if (t === 'rigging'){
    P(3, 4, 1, 27, C.woodD); P(28, 4, 1, 27, C.woodD); P(3, 4, 26, 1, C.wood);
    for (let i = 0; i < 26; i += 4) for (let y = 5; y < 30; y++) P(3 + ((i + y) % 26), y, 1, 1, (y % 4) ? '#c8b890' : '#a89870');
    P(14, 18, 3, 13, C.woodD); P(11, 21, 9, 2, C.woodD); P(12, 14, 7, 6, '#c8b48a'); P(13, 10, 5, 4, '#c8b48a');
    return;
  }
  if (t === 'mast'){
    P(15, -3, 2, 34, C.woodD); P(15, -3, 1, 34, C.wood); P(7, 4, 18, 2, C.wood); P(10, 0, 12, 4, '#7a5a32'); P(10, 0, 12, 1, '#a07a4a');
    for (let y = 6; y < 30; y += 3){ P(7 + (y >> 2), y, 1, 1, '#c8b890'); P(24 - (y >> 2), y, 1, 1, '#c8b890'); }
    P(17, -3, 6, 3, banner().c1); if (L.g) glyph(P, L.g, 4, 22, '#f0e6d2');
    if (L.orb){ P(14, -3, 4, 3, '#87ceeb'); P(15, -3, 1, 1, '#ffffff'); }
    P(11, 28, 10, 3, '#5a3a1a');
    return;
  }
  if (t === 'bench'){
    P(3, 16, 26, 3, C.wood); P(3, 16, 26, 1, '#b08a5a'); P(5, 19, 2, 11, C.woodD); P(25, 19, 2, 11, C.woodD); P(4, 26, 24, 1, C.woodD);
    P(8, 13, 6, 3, C.steel); P(17, 12, 2, 4, C.woodD); P(16, 11, 4, 1, C.steelL); P(22, 14, 4, 2, '#7a5a3a');
    if (L.g) signBoard(P, 12, 2, L.g);
    return;
  }
  if (t === 'cannon'){
    P(6, 22, 20, 5, C.woodD); P(6, 22, 20, 1, C.wood); for (const x of [8, 20]){ P(x, 26, 5, 5, '#3a2a1c'); P(x + 1, 27, 3, 3, C.wood); }
    P(4, 15, 22, 7, '#4a4a4e'); P(4, 15, 22, 2, '#7a7a80'); P(2, 16, 3, 5, '#2a2a2e'); P(26, 17, 3, 3, '#3a3a3e');
    P(27, 8, 4, 6, '#6a4a2a'); P(27, 8, 4, 1, '#8a6a3a'); P(28, 6, 2, 2, '#3a3a3a');
    return;
  }
  if (t === 'shrine'){
    P(8, 26, 16, 5, '#8a8a86'); P(8, 26, 16, 1, '#b0b0aa'); P(12, 10, 8, 16, '#c8a040'); P(13, 6, 6, 5, '#d4b050'); P(14, 7, 1, 1, '#2a2520'); P(17, 7, 1, 1, '#2a2520');
    P(10, 14, 2, 6, '#c8a040'); P(20, 14, 2, 6, '#c8a040'); P(15, 3, 2, 3, '#ffe080');
    for (const x of [6, 25]){ P(x, 22, 2, 4, '#ece4cf'); P(x, 20, 2, 2, '#ffb030'); }
    return;
  }
  if (t === 'nets'){
    P(1, 26, 30, 3, C.woodD); P(1, 26, 30, 1, C.wood); for (let x = 1; x < 31; x += 6) P(x, 12, 2, 15, C.woodD);
    for (let y = 12; y < 26; y++) for (let x = 1; x < 31; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) P(x, y, 1, 1, '#c8b890');
    P(1, 12, 30, 1, '#a89870');
    return;
  }
  if (t === 'loft'){
    P(3, 12, 26, 3, C.wood); P(3, 12, 26, 1, '#b08a5a'); for (const x of [4, 15, 27]) P(x, 15, 2, 16, C.woodD);
    for (const y of [5, 9]){ for (let x = 6; x < 26; x++) P(x, y + Math.round(Math.sin((x - 6) / 20 * Math.PI) * 2), 1, 1, '#c8b890'); }
    P(9, 6, 7, 2, '#7a5a3a'); P(17, 10, 6, 2, '#5a4a6a');
    for (let y = 15; y < 31; y += 3) P(22, y, 4, 1, C.wood); P(22, 15, 1, 16, C.woodD); P(25, 15, 1, 16, C.woodD);
    return;
  }
  if (t === 'room'){
    const x0 = L.big ? 1 : 3, x1 = L.big ? 31 : 29;
    for (let y = 6; y < 26; y += 2) for (let x = x0 + (y % 4 ? 0 : 2); x < x1; x += 4) P(x, y, 3, 1, '#8a4a3a');
    P(x0, 6, x1 - x0, 20, 'rgba(0,0,0,0)');
    for (let y = 6; y < 26; y++){ P(x0, y, 2, 1, '#7a3a2a'); P(x1 - 2, y, 2, 1, '#7a3a2a'); }
    for (let x = x0; x < x1; x++){ P(x, 6, 1, 2, '#7a3a2a'); }
    for (let y = 8; y < 26; y += 2) for (let x = x0 + 2; x < x1 - 2; x += 4) P(x + (y % 4 ? 0 : 2), y, 3, 1, '#9a5a44');
    P(x0, 26, x1 - x0, 5, '#5a3a24'); P(x0 + 2, 8, x1 - x0 - 4, 4, L.c); P(x0 + 2, 11, x1 - x0 - 4, 1, shade(L.c, .6));
    P(((x0 + x1) >> 1) - 5, 18, 10, 4, C.wood); P(((x0 + x1) >> 1) - 4, 22, 2, 4, C.woodD); P(((x0 + x1) >> 1) + 2, 22, 2, 4, C.woodD);
    if (L.g) signBoard(P, ((x0 + x1) >> 1) - 4, 13, L.g);
    return;
  }
  if (t === 'cage'){
    P(3, 28, 26, 3, '#3a3a3a'); for (let x = 3; x < 30; x += 3) P(x, 8, 1, 21, L.dark ? '#5f6870' : '#8f98a2'); for (let y = 8; y < 29; y += 5) P(3, y, 27, 1, '#8f98a2');
    if (L.dark){ P(10, 17, 4, 5, '#d9a07a'); P(10, 22, 4, 6, '#6b5a42'); P(19, 18, 4, 4, '#c98d5f'); P(19, 22, 4, 6, '#5a4a3a'); }
    else { P(8, 13, 2, 14, C.steel); P(7, 12, 4, 2, C.steelL); P(14, 15, 7, 8, '#7a3e26'); P(16, 17, 3, 4, C.gold); P(23, 12, 2, 15, C.wood); P(22, 10, 4, 3, C.steelL); }
    if (L.g) signBoard(P, 12, -1, L.g);
    return;
  }
  if (t === 'pit'){
    P(2, 14, 28, 16, '#c8b078'); for (let i = 0; i < 30; i++) P(3 + (i * 7) % 26, 15 + (i * 5) % 14, 1, 1, '#b09a68');
    for (const [x, y] of [[2, 12], [29, 12], [2, 29], [29, 29]]) P(x, y - 4, 2, 6, C.woodD);
    P(2, 10, 29, 1, '#c03030'); P(2, 26, 29, 1, '#c03030'); P(14, 12, 3, 14, C.woodD); P(11, 15, 9, 2, C.woodD); P(12, 10, 7, 6, '#c8b48a');
    return;
  }
  if (t === 'ladder'){
    P(6, -3, 1, 34, C.woodD); P(11, -3, 1, 34, C.woodD); for (let y = -2; y < 31; y += 3) P(6, y, 6, 1, C.wood);
    P(13, -3, 16, 4, '#5a5a56'); P(13, -3, 16, 1, '#7a7a76'); P(15, 1, 2, 30, C.woodD); P(26, 1, 2, 30, C.woodD);
    if (L.orb){ P(19, -2, 6, 3, '#87ceeb'); P(20, -2, 2, 1, '#fff'); P(18, 1, 2, 4, '#b08a5a'); }
    if (L.g) signBoard(P, 17, 10, L.g);
    return;
  }
  if (t === 'furnace'){
    for (let y = 8; y < 30; y += 2) for (let x = 4 + (y % 4 ? 0 : 2); x < 24; x += 4) P(x, y, 3, 1, '#8a4a3a');
    P(4, 8, 20, 22, 'rgba(0,0,0,0)'); P(4, 8, 2, 22, '#6a3a2a'); P(22, 8, 2, 22, '#6a3a2a'); P(4, 8, 20, 2, '#6a3a2a');
    P(9, 18, 10, 8, '#2a1a10'); P(10, 20, 8, 6, '#e8602a'); P(12, 21, 4, 3, '#ffd040'); P(17, -3, 4, 11, '#5a5a56'); P(16, -3, 6, 2, '#3a3a3a');
    P(25, 22, 6, 8, C.steel); P(25, 22, 6, 1, C.steelL); if (L.g) signBoard(P, 23, 10, L.g);
    return;
  }
  if (t === 'vat'){
    for (const x of [2, 17]){ P(x, 16, 13, 14, '#7a5a3a'); P(x, 16, 13, 2, '#5a3a1a'); P(x + 1, 18, 11, 3, '#6a4a1a'); P(x, 23, 13, 1, '#5a3a1a'); P(x, 28, 13, 1, '#5a3a1a'); }
    P(1, 4, 30, 1, C.woodD); for (const x of [4, 12, 20, 26]){ P(x, 5, 4, 8, '#b08a5a'); P(x + 1, 6, 2, 6, '#9a7a4a'); }
    return;
  }
  if (t === 'barricade'){
    P(1, 20, 9, 10, C.wood); P(1, 20, 9, 1, '#b08a5a'); P(22, 18, 9, 12, C.wood); P(22, 18, 9, 1, '#b08a5a'); P(9, 14, 14, 6, '#9a6a3a');
    for (let i = 0; i < 16; i++) P(5 + i * 1.5 | 0, 28 - i, 3, 1, C.woodD); for (let i = 0; i < 16; i++) P(26 - i * 1.5 | 0, 28 - i, 3, 1, C.woodD);
    P(10, 24, 12, 6, '#7a5a3a'); P(12, 26, 2, 2, C.steel); P(18, 26, 2, 2, C.steel);
    return;
  }
  if (t === 'stall') return drawBuilding(P, {type:'stall', col:'#c8a24a', stripe:'#8c3a2e'});
}
function skinLook(id){ const k = holding(); return k === 'barge' ? BARGE_LOOK[id] : k === 'warehouse' ? WARE_LOOK[id] : null; }
function skinFacilityCanvas(id){
  const L = skinLook(id), key = 'bc2:' + holding() + id + (id === 'palisade' ? bannerSig() : '');
  if (!L) return lookCanvas(id + (id === 'palisade' ? bannerSig() : ''), FAC_LOOK[id]);
  if (SPR[key]) return SPR[key];
  const c = newCanvas(34, 36), g = c.getContext('2d'); g.translate(1, 3); drawSkinBuilding(painter(g), L); g.setTransform(1, 0, 0, 1, 0, 0);
  return SPR[key] = outline(c);
}
function skinHouseCanvas(){
  const k = holding(); if (k === 'fort') return lookCanvas('house', {type:'house', wall:'stone', roof:'#7a3e26', glyph:'flag', wide:true, chimney:true});
  const key = 'bc2:house' + k; if (SPR[key]) return SPR[key];
  const c = newCanvas(34, 36), g = c.getContext('2d'), P = painter(g); g.translate(1, 3);
  if (k === 'barge'){
    P(0, 12, 32, 19, '#8a5a2b'); for (let x = 2; x < 32; x += 3) P(x, 12, 1, 19, '#6a4422'); P(-1, 7, 34, 6, '#7a3e26'); P(-1, 7, 34, 1, '#a05a3a');
    P(1, 3, 30, 4, C.woodD); for (let x = 1; x < 31; x += 4) P(x, 1, 2, 3, C.wood);
    for (const x of [3, 10, 19, 26]){ P(x, 16, 4, 5, '#2a2a40'); P(x + 1, 17, 2, 3, '#ffe0a0'); P(x, 15, 4, 1, C.gold); }
    P(13, 22, 6, 9, '#4a3020'); P(13, 22, 6, 1, C.gold); P(17, 26, 1, 1, C.gold);
    P(0, 14, 2, 3, '#ffb030'); P(30, 14, 2, 3, '#ffb030');
  } else {
    P(1, 8, 30, 23, '#7a4a32'); for (let y = 9; y < 31; y += 2) for (let x = 1 + (y % 4 ? 0 : 2); x < 31; x += 4) P(x, y, 3, 1, '#8a5a40');
    P(0, 6, 32, 3, '#4a3020'); P(4, 11, 24, 9, '#2a2a40'); for (let x = 4; x < 28; x += 4) P(x, 11, 1, 9, '#4a3020'); P(4, 15, 24, 1, '#4a3020');
    P(5, 12, 22, 3, '#ffe0a0'); P(12, 22, 8, 9, '#4a3020'); P(12, 22, 8, 1, C.gold);
    for (let i = 0; i < 6; i++) P(20 + i * 2, 25 + i, 3, 1, C.woodD);
    signBoard(P, 3, 21, 'book');
  }
  g.setTransform(1, 0, 0, 1, 0, 0); return SPR[key] = outline(c);
}
const qmSprite = () => { const k = holding(); if (k === 'fort') return wagonSprite();
  return simpleSprite('qm:' + k, 34, 24, P => {
    if (k === 'barge'){ P(3, 10, 14, 12, '#7a4a22'); P(3, 10, 14, 2, '#a06a3a'); P(9, 14, 2, 3, C.gold); P(3, 15, 14, 1, C.gold);
      P(19, 6, 12, 16, C.wood); P(19, 6, 12, 1, '#b08a5a'); P(19, 13, 12, 1, C.woodD); P(21, 2, 8, 4, '#6a4a2a'); glyph(P, 'coin', 22, 8, '#e8c040'); }
    else { P(1, 10, 32, 4, C.wood); P(1, 10, 32, 1, '#b08a5a'); P(2, 14, 30, 9, '#6a4422'); for (let x = 4; x < 32; x += 6) P(x, 14, 1, 9, '#4a2a14');
      P(5, 6, 8, 4, '#ece4cf'); P(5, 6, 8, 1, '#c8b890'); P(9, 6, 1, 4, '#a89878'); P(20, 5, 6, 5, '#e8c040'); P(20, 5, 6, 1, '#fff2a0'); P(28, 3, 3, 7, C.woodD); }
  });
};

/* ---------------------------------------------------------------------------
   HOLDING BACKDROPS - drawn before the y-sorted scene
--------------------------------------------------------------------------- */
function hullPath(g, inset){
  const top = 235 + inset, bot = 1065 - inset, sx = 100 + inset, bowX = 1720 - inset * 2, mid = 650;
  g.beginPath(); g.moveTo(sx + 60, top); g.lineTo(1300, top); g.quadraticCurveTo(1600, top + 30, bowX, mid);
  g.quadraticCurveTo(1600, bot - 30, 1300, bot); g.lineTo(sx + 60, bot); g.quadraticCurveTo(sx, bot, sx, bot - 60); g.lineTo(sx, top + 60); g.quadraticCurveTo(sx, top, sx + 60, top); g.closePath();
}
function plankPattern(col, h, seed){
  const c = newCanvas(64, h * 4), P = painter(c.getContext('2d')), r = rng(seed);
  for (let y = 0; y < 4; y++){ const base = shade(col, 0.92 + r() * 0.16); P(0, y * h, 64, h, base); P(0, y * h + h - 1, 64, 1, shade(col, .6));
    const j = (y * 23 + 11) % 64; P(j, y * h, 1, h, shade(col, .55)); for (let i = 0; i < 10; i++) P(r() * 64 | 0, y * h + 1 + (r() * (h - 2) | 0), 3 + (r() * 6 | 0), 1, shade(base, r() < .5 ? .88 : 1.08)); }
  return scaled(c, 3);
}
function drawHoldingBackdrop(cx, cy, t){
  const k = holding();
  if (k === 'barge'){
    ctx.fillStyle = seasonWaterBase(); ctx.fillRect(-60, -60, CAMP_W + 120, CAMP_H + 120);   /* Index 40: the river changes with the season */
    ctx.strokeStyle = 'rgba(120,170,200,.35)'; ctx.lineWidth = 3;
    for (let y = -40; y < CAMP_H + 60; y += 34) for (let x = -60 + ((y / 34 | 0) % 2) * 60; x < CAMP_W + 60; x += 120){
      const o = Math.sin((t + x + y) / 40) * 10; ctx.beginPath(); ctx.moveTo(x + o, y); ctx.quadraticCurveTo(x + o + 15, y - 5, x + o + 30, y); ctx.stroke(); }
    // the quay
    ctx.fillStyle = '#7a7a74'; ctx.fillRect(-60, 1100, CAMP_W + 120, 200);
    for (let y = 1100; y < 1300; y += 24) for (let x = -60 + ((y / 24 | 0) % 2) * 30; x < CAMP_W + 60; x += 60){ ctx.fillStyle = '#8a8a84'; ctx.fillRect(x, y, 56, 20); ctx.fillStyle = '#9a9a94'; ctx.fillRect(x, y, 56, 3); }
    ctx.fillStyle = '#5a5a56'; ctx.fillRect(-60, 1096, CAMP_W + 120, 8);
    for (const x of [300, 880, 1400]){ ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x - 10, 1112, 20, 22); ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x - 12, 1108, 24, 6);
      ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 1112); ctx.quadraticCurveTo(x + 20, 1090, x + 30, 1060); ctx.stroke(); }
    // hull side, deck and rail
    ctx.save(); ctx.translate(0, 18); hullPath(ctx, 0); ctx.fillStyle = '#4a2c16'; ctx.fill(); ctx.restore();
    hullPath(ctx, 0); ctx.fillStyle = '#6a4222'; ctx.fill();
    if (!CAMP.deck) CAMP.deck = ctx.createPattern(plankPattern('#a07a4a', 7, 11), 'repeat');
    hullPath(ctx, 16); ctx.fillStyle = CAMP.deck; ctx.fill();
    hullPath(ctx, 16); ctx.strokeStyle = '#4a2c16'; ctx.lineWidth = 6; ctx.stroke();
    hullPath(ctx, 8); ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 8; ctx.stroke();
    // nets along the rail when the Boarding Nets are built
    if (has('palisade')){ ctx.strokeStyle = 'rgba(200,184,144,.8)'; ctx.lineWidth = 2; for (let x = 200; x < 1320; x += 18){ for (const y of [240, 1046]){ ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 9, y + (y < 600 ? -18 : 18)); ctx.lineTo(x + 18, y); ctx.stroke(); } } }
    // a ship's wake of light
    return true;
  }
  if (k === 'warehouse'){
    if (!CAMP.cobble) CAMP.cobble = ctx.createPattern(TILE.floor(0), 'repeat');
    ctx.fillStyle = CAMP.cobble; ctx.fillRect(-60, -60, CAMP_W + 120, CAMP_H + 120);
    if (!CAMP.floor) CAMP.floor = ctx.createPattern(plankPattern('#7a5a3a', 6, 23), 'repeat');
    ctx.fillStyle = CAMP.floor; ctx.fillRect(70, 150, 1620, 960);
    // the back wall, with high windows; side walls; the street wall with its great doors
    const brick = (x, y, w, h) => { ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x, y, w, h);
      for (let yy = y; yy < y + h; yy += 10) for (let xx = x + ((yy / 10 | 0) % 2) * 15; xx < x + w; xx += 30){ ctx.fillStyle = '#8a4a36'; ctx.fillRect(xx, yy, 27, 7); } };
    brick(40, 40, 1680, 110); brick(40, 150, 30, 990); brick(1690, 150, 30, 990); brick(40, 1110, 700, 40); brick(1020, 1110, 700, 40);
    for (let x = 140; x < 1680; x += 210){ ctx.fillStyle = '#2a2a40'; ctx.fillRect(x, 62, 80, 50); ctx.fillStyle = 'rgba(255,230,160,.55)'; ctx.fillRect(x + 4, 66, 72, 42); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 38, 62, 4, 50); ctx.fillRect(x, 84, 80, 4); }
    ctx.fillStyle = '#4a3020'; ctx.fillRect(740, 1104, 40, 46); ctx.fillRect(980, 1104, 40, 46);
    if (has('palisade')){ ctx.fillStyle = '#7a5a3a'; for (let x = 790; x < 975; x += 30){ ctx.fillRect(x, 1090 + (x % 60 ? 0 : 8), 26, 26); ctx.fillStyle = '#9a7a4a'; ctx.fillRect(x, 1090 + (x % 60 ? 0 : 8), 26, 4); ctx.fillStyle = '#7a5a3a'; } }
    // light through the windows
    for (let x = 140; x < 1680; x += 210){ ctx.fillStyle = 'rgba(255,235,180,.07)'; ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + 80, 150); ctx.lineTo(x + 240, 700); ctx.lineTo(x + 140, 700); ctx.closePath(); ctx.fill(); }
    return true;
  }
  return false;
}
// Masts and pillars, sorted with everything else
function holdingProps(){
  const k = holding();
  if (k === 'barge') return [{x:620, y:650, k:'mast'}, {x:1150, y:650, k:'mast'}];
  if (k === 'warehouse'){ const out = []; for (const x of [230, 650, 1110, 1530]) for (const y of [470, 830]) out.push({x, y, k:'pillar'}); return out; }
  return [];
}
function drawHoldingProp(p){
  if (p.k === 'mast'){
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 22, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(p.x - 7, p.y - 600, 14, 604); ctx.fillStyle = '#7a5230'; ctx.fillRect(p.x - 7, p.y - 600, 4, 604);
    for (const yy of [p.y - 260, p.y - 470]){ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(p.x - 130, yy, 260, 9); ctx.globalAlpha = 0.55; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(p.x - 120, yy + 9, 240, 16);
      ctx.fillStyle = '#c8b890'; for (let x = p.x - 120; x < p.x + 120; x += 20) ctx.fillRect(x, yy + 9, 2, 16); ctx.globalAlpha = 1; }
    const b = banner(); ctx.fillStyle = b.c1; ctx.fillRect(p.x + 7, p.y - 600, 46, 22); ctx.fillStyle = b.c2; ctx.fillRect(p.x + 7, p.y - 590, 46, 4);
    ctx.strokeStyle = 'rgba(200,184,144,.55)'; ctx.lineWidth = 2;
    for (const s of [-1, 1]){ ctx.beginPath(); ctx.moveTo(p.x, p.y - 560); ctx.lineTo(p.x + s * 250, p.y - 20); ctx.stroke(); }
    return;
  }
  if (p.k === 'pillar'){
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 18, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(p.x - 9, p.y - 300, 18, 304); ctx.fillStyle = '#7a5230'; ctx.fillRect(p.x - 9, p.y - 300, 5, 304);
    ctx.fillStyle = '#4a2a14'; ctx.fillRect(p.x - 14, p.y - 6, 28, 8); ctx.fillRect(p.x - 14, p.y - 300, 28, 8);
  }
}
const _campScenery = campScenery;
campScenery = function(){
  if (CAMP.trees) return;
  const k = holding();
  if (k === 'fort') return _campScenery();
  const r = rng(k === 'barge' ? 31 : 53), decor = [], keys = k === 'barge' ? ['crate','barrel','rope','barrel','anchor'] : ['crate','sacks','barrel','crate','sacks'];
  const near = (x, y, d) => Object.values(PLOTS).some(([px, py]) => Math.hypot(px - x, py - y) < d) || Object.values(HUB).some(h => Math.hypot(h.x - x, h.y - y) < d) || Math.hypot(GRAVE.x - x, GRAVE.y - y) < d + 50;
  for (let i = 0; i < 90 && decor.length < 34; i++){
    const x = 180 + r() * 1400, y = k === 'barge' ? 300 + r() * 700 : 200 + r() * 860;
    if (near(x, y, 90)) continue;
    decor.push({x, y, k:keys[r() * keys.length | 0]});
  }
  CAMP.trees = []; CAMP.decor = decor;
};
// The graveyard, dressed for the holding: a carved rail on the barge, a chalked wall in the warehouse.
const _drawGraveyard = drawGraveyard;
drawGraveyard = function(hot){
  const k = holding(); if (k === 'fort') return _drawGraveyard(hot);
  const g = GRAVE, x0 = g.x - g.w / 2, y0 = g.y - g.h / 2, dead = META.memorial || [];
  if (k === 'barge'){ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x0, y0 + 20, g.w, 70); ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x0 + 6, y0 + 26, g.w - 12, 58); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x0, y0 + 90, 8, 30); ctx.fillRect(x0 + g.w - 8, y0 + 90, 8, 30); }
  else { ctx.fillStyle = '#6a3a2a'; ctx.fillRect(x0, y0, g.w, 100); ctx.fillStyle = '#7a4a36'; for (let yy = y0; yy < y0 + 100; yy += 10) for (let xx = x0 + ((yy / 10 | 0) % 2) * 15; xx < x0 + g.w; xx += 30) ctx.fillRect(xx, yy, 27, 7); }
  dead.slice(-18).forEach((d, i) => { const cx = x0 + 18 + (i % 9) * ((g.w - 30) / 8), cy = y0 + (k === 'barge' ? 40 : 22) + Math.floor(i / 9) * 30;
    ctx.fillStyle = k === 'barge' ? '#2a1a0a' : '#e8e0d0'; ctx.fillRect(cx - 1, cy, 3, 16); ctx.fillRect(cx - 5, cy + 4, 11, 3); });
  if (!dead.length){ ctx.fillStyle = 'rgba(240,230,210,.7)'; ctx.font = `italic ${typeof hudPx === 'function' ? hudPx(12) : 14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('No names yet', g.x, y0 + 60); }
  if (hot) campLabel(g.x, y0 - 6, HS().grave, dead.length ? `${dead.length} fallen` : 'Empty, for now');
};

/* ---------------------------------------------------------------------------
   THE FOUNDING SCREENS
--------------------------------------------------------------------------- */
let FD = null;
const founded = () => !!(META.founded || META.deployments > 0 || META.leader);
function openFound(){
  FD = {step:'hero', hero:null, sex:Math.random() < .5 ? 'f' : 'm', race:null, cls:null, spec:null, name:'', holding:'fort'};   /* Index 28: heroes first */
  renderFound(); show('screen-create');
}
function renderFound(){
  const h = $('create-inner'); let title = '', sub = '', body = '';
  const steps = ['race','cls','spec','name','holding','charter','banner'], si = FD.step === 'hero' ? 0 : steps.indexOf(FD.step);
  const crumbs = `<div class="sub" style="font-size:14px;color:#6a5a44">Founding the Chapter: ${['Chapter Master','Social Class','Specialty','Name','Holding','Ambition','Banner'].map((s, i) => i === si ? `<b>${s}</b>` : s).filter((s, i) => !(FD.fromStory && i === 5)).join(' \u203a ')} \u203a then your Squad Leader</div>`;
  const sexBtns = `<div style="margin:4px"><button class="btn small ${FD.sex === 'f' ? 'gold' : ''}" onclick="FD.sex='f';FD.name='';renderFound()">WOMAN</button><button class="btn small ${FD.sex === 'm' ? 'gold' : ''}" onclick="FD.sex='m';FD.name='';renderFound()">MAN</button></div>`;
  if (FD.step === 'hero'){
    title = 'Who Founds the Chapter?';
    sub = 'The Chapter Master runs the camp, brokers contracts and speaks for the Chapter in the War Council. Cayde, a legend of the Dust Cloaks, holds the chair until you can name your own.';
    body = heroStepHTML();
  } else if (FD.step === 'race'){
    title = 'Elect the Chapter Master';
    sub = 'The Chapter Master runs the holding, brokers contracts and speaks for the Chapter in the War Council (Section 4.1). Too old to march, too stubborn to quit. First, who are they?';
    body = sexBtns + '<div class="row">' + Object.entries(RACES).map(([k, r]) => `<div class="card" style="width:150px" onclick="FD.race='${k}';FD.step='cls';renderFound()">
      <img src="${previewBustURL(k, FD.sex)}" style="height:96px;image-rendering:pixelated"><div class="ttl">${r.name}</div><div class="desc" style="font-size:14px">${r.tag}</div></div>`).join('') + '</div>';
  } else if (FD.step === 'cls'){
    title = 'Their Social Class';
    sub = "The Chapter Master's Social Class sets the camp's passive bonus (Table 4.8).";
    body = '<div class="row">' + CLASS_ORDER.map(k => `<div class="card" style="width:240px" onclick="FD.cls='${k}';FD.step='spec';renderFound()">
      <div class="ttl">${CLASSES[k].name}</div><div class="desc"><b>Camp bonus:</b> ${CM_BONUS[k].game}</div><div class="fl">Rulebook: ${CM_BONUS[k].rule}</div></div>`).join('') + '</div>';
  } else if (FD.step === 'spec'){
    title = 'What They Were';
    sub = "Before they ran the Chapter, they fought in it. Race, Class and Specialty decide which patrons treat the Chapter Master as one of their own: when they match a patron's circle, the Charter Rank die in the War Council shifts up a step.";
    const circ = s => Object.entries(PATRON_CIRCLE).filter(([, c]) => c.includes(s) || c.includes(FD.race) || c.includes(FD.cls)).map(([p]) => p);
    body = '<div class="row">' + SPEC_ORDER.map(k => `<div class="card" style="width:170px" onclick="FD.spec='${k}';FD.step='name';renderFound()">
      <img src="${previewBustURL(FD.race, FD.sex, k, FD.cls)}" style="height:96px;image-rendering:pixelated"><div class="ttl" style="color:${SPECS[k].color}">${SPECS[k].name}</div>
      <div class="desc" style="font-size:14px">Patrons who will see one of their own: ${circ(k).join(', ') || 'none'}</div></div>`).join('') + '</div>';
  } else if (FD.step === 'name'){
    title = 'Name the Chapter Master';
    if (!FD.name) FD.name = randomName(FD.race, FD.sex);
    body = `<div style="display:flex;flex-direction:column;align-items:center">
      <img src="${previewBustURL(FD.race, FD.sex, FD.spec, FD.cls)}" style="height:150px;image-rendering:pixelated">${sexBtns}
      <div style="display:flex;gap:10px;margin:8px"><input class="name" id="fd-name" value="${esc(FD.name)}" oninput="FD.name=this.value"><button class="btn small" onclick="FD.name=randomName(FD.race, FD.sex);renderFound()">Randomise</button></div>
      <div class="log" style="max-width:560px"><p><b>${RACES[FD.race].name} ${CLASSES[FD.cls].name}, once a ${SPECS[FD.spec].name}.</b></p><p><b>Camp bonus:</b> ${CM_BONUS[FD.cls].game}</p>
      <p><b>Patrons' circle:</b> ${Object.entries(PATRON_CIRCLE).filter(([, c]) => c.includes(FD.race) || c.includes(FD.cls) || c.includes(FD.spec)).map(([p]) => p).join(', ') || 'none: the Chapter Master is no one\u2019s kin'}.</p></div>
      <button class="btn gold" onclick="FD.name=($('fd-name').value||'').trim()||FD.name;FD.step='holding';renderFound()">NEXT: CHOOSE A HOLDING</button></div>`;
  } else if (FD.step === 'holding'){
    title = 'Choose the Starting Holding';
    sub = 'Where does the Chapter hang its banner? Every holding can build every facility; each is dressed to suit it.';
    body = '<div class="row">' + Object.entries(HOLDINGS).map(([k, H]) => { const prev = META.holding; META.holding = k; const url = toURL('holdprev:' + holding(), () => skinHouseCanvas(), 5); META.holding = prev;
      const N = FAC_SKIN_NAMES[k] || {};
      return `<div class="card ${FD.holding === k ? 'sel' : ''}" style="width:300px" onclick="FD.holding='${k}';renderFound()"><img src="${url}" style="height:130px;image-rendering:pixelated">
        <div class="ttl">${H.name}</div><div class="desc">${H.blurb}</div>
        <div class="fl">${k === 'fort' || !FAC_SKIN_NAMES[k] ? 'Tents, Kitchen, Command Tent, Field Hospital, Palisade...' : [N.tents, N.kitchen, N.command, N.hospital, N.palisade].join(', ') + '...'}</div></div>`; }).join('') +
      `</div><button class="btn gold" onclick="FD.step=FD.fromStory?'banner':'charter';META.holding=FD.holding;applySkin();BED=null;renderFound()">${FD.fromStory ? 'NEXT: THE BANNER' : 'NEXT: THE CHARTER AMBITION'}</button>`;
  } else if (FD.step === 'charter'){
    title = 'The Charter Ambition';
    sub = 'What is this Chapter for? Choose now, and every contract, perk and milestone points the same way. Ten milestones, a perk at 3, 6 and 9, and a final contract that fulfils the charter.';
    body = charterStepHTML();
  } else if (FD.step === 'banner'){
    title = 'Raise the Banner';
    body = `<div style="max-width:440px;margin:0 auto;text-align:left">${bannerEditorHTML().replace('<h2>The Chapter Banner</h2>', '').replace(/onclick="saveBanner\(\)">RAISE THE BANNER/, 'onclick="finishFound()">RAISE THE BANNER, THEN RECRUIT YOUR SQUAD LEADER')}</div>`;
  }
  h.innerHTML = `<h1 style="font-size:40px">${title}</h1>${crumbs}${sub ? `<div class="sub">${sub}</div>` : ''}<div style="margin-top:8px;width:100%">${body}</div>
    <div>${(si > 0 || FD.step === 'race') ? `<button class="btn small" onclick="FD.step='${heroBack(si)}';renderFound()">BACK</button>` : `<button class="btn small" onclick="showSplash()">CANCEL</button>`}</div>`;
}
function finishFound(){
  META.master = {id:'CM', name:FD.name, race:FD.race, cls:FD.cls, spec:FD.spec, sex:FD.sex, chosen:true};
  META.holding = FD.holding; META.banner = Object.assign({}, BED); META.bannerSet = true; META.founded = true; BED = null;
  applySkin(); saveMeta(); FD = null; openCreate();
}
// The banner editor re-renders whichever screen it lives on.
renderPanel = (function(orig){ return function(){ if (FD && FD.step === 'banner' && !$('screen-create').classList.contains('hidden')) return renderFound(); return orig(); }; })(renderPanel);
// Existing campaigns: elect a Chapter Master once, and move house any time.
let ELECT = null;
function electHTML(){
  if (!ELECT) ELECT = {race:META.master.race, cls:META.master.cls, spec:META.master.spec, sex:sexOf(META.master), name:META.master.name};
  const sel = (key, opts) => `<select onchange="ELECT.${key}=this.value;renderPanel()">${opts.map(([v, n]) => `<option value="${v}" ${ELECT[key] === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  return `<h2>Elect the Chapter Master</h2><div style="text-align:center"><img src="${previewBustURL(ELECT.race, ELECT.sex, ELECT.spec, ELECT.cls)}" style="height:120px;image-rendering:pixelated"></div>
    <div class="desc" style="text-align:left">This campaign began before the Chapter could elect its Master. Choose once; the choice is permanent.</div>
    <div class="desc" style="text-align:left;line-height:2">Race ${sel('race', Object.entries(RACES).map(([k, r]) => [k, r.name]))} Sex ${sel('sex', [['f', 'Woman'], ['m', 'Man']])}<br>
      Class ${sel('cls', CLASS_ORDER.map(k => [k, CLASSES[k].name]))} Specialty ${sel('spec', SPEC_ORDER.map(k => [k, SPECS[k].name]))}<br>
      Name <input id="el-name" value="${esc(ELECT.name)}" oninput="ELECT.name=this.value" style="width:160px"></div>
    <div class="desc" style="text-align:left"><b>Camp bonus:</b> ${CM_BONUS[ELECT.cls].game}</div>
    <button class="btn gold" onclick="META.master={id:'CM',name:ELECT.name||'Unnamed',race:ELECT.race,cls:ELECT.cls,spec:ELECT.spec,sex:ELECT.sex,chosen:true};ELECT=null;saveMeta();CAMP.dirty=true;SFX.play('win');openPanel('person','master')">ELECT</button>`;
}
function holdingHTML(){
  return `<h2>Move the Chapter</h2><div class="desc" style="text-align:left">Cosmetic for now: every facility comes with you, dressed for the new home.</div>` +
    Object.entries(HOLDINGS).map(([k, H]) => `<div class="line"><div class="grow"><b>${H.name}</b>${holdKey() === k ? ' (here now)' : ''}<br><span style="font-size:14px">${H.blurb}</span></div>${holdKey() === k ? '' : `<button onclick="META.holding='${k}';applySkin();saveMeta();closePanel();SFX.play('horn');refreshUI()">Move here</button>`}</div>`).join('');
}
buildingURL = id => toURL('bld2:' + holding() + id + (id === 'palisade' ? bannerSig() : ''), () => skinFacilityCanvas(id), 4);

window.FOUNDING_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svH = META && META.holding;
    try {
      ok('HOLDINGS defines fort, barge, warehouse', ['fort', 'barge', 'warehouse'].every(k => !!HOLDINGS[k]));
      if (META){
        META.holding = 'fort'; ok('holdKey returns fort', holdKey() === 'fort' && holding() === 'fort');
        META.holding = 'barge'; ok('holdKey returns barge', holdKey() === 'barge' && holding() === 'barge');
        META.holding = 'nonexistent'; ok('unknown holding falls back to fort', holdKey() === 'fort');
      }
      ok('holdingHTML lists all HOLDINGS entries', Object.values(HOLDINGS).every(H => holdingHTML().includes(H.name)));
    } catch (e) { ok('threw', false, e && e.message); }
    finally { if (META) META.holding = svH; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};

