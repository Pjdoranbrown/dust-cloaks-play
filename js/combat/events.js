/* INDEX EVT39 - F-39 regional creature encounters, phase 1: shape A, the mid-fight arrival (Lead Programmer, 2026-11-14).
   Scope: audits/encounters-f39.md and audits/f39-hosting-systems.md; Patrick's answers in the bible (2026-11-14).
   - makeContract may roll ONE event: c.event = {id, shape, region}. Chance by tier K.chance [S] (20/27/33%), region and
     contract type must fit the creature, the last creature never comes twice in a row, a creature not met yet weighs x2.
   - Never on the story, campaign, teaching, trial or Charter Finale contracts: checked again when the field starts
     (META.cp, inStoryNow, c.teach, c.force30, c.f34, c.finale, obj 'trial'); an excluded contract simply has no event.
   - Shape A: the creature walks in 45 to 90 s [S] after the start, or at 35% [S] of a Hold's clock, from the field's
     edge (spawnPoint), on top of the contract's own enemies (adds, never replaces). Body: an existing enemy def, Condition
     scaled by tier x0.6/1.0/1.4 and x0.85 [S] (Systems), no Nemesis.
   - Win (every event body down) and the contract won: +25% [S] of the pay. A line on the debrief.
   - The table's contract card names the encounter and its bonus only when the contract is scouted (EVT39.scouted).
   - Phase 2, shape B (2026-11-14): the Hidden Folk (Hedge Sprite) and the Hob. When no hostile event rolls, a fitting
     neutral one rolls at K.neutral [S] (1 in 6); never both. Shortly after the start the field pauses on a card with
     ACCEPT and REFUSE; refusing costs nothing (Patrick). Sprite: a path (the map revealed). Hob: a small job waits at the
     top of the next board (pay x0.6 [S], no Standing, no event of its own). No d6 roll for these two: accepting has no risk.
   - Shape A, the rest (2026-11-14): Ridge Giant (frost; one ogre at Condition x2.0 [S]), Bronze Sentinel (spine; four
     Vault-Wardens), Cliff Shrike (spine; two Cinderlings, fast). Their special acts (boulders, the keyword ring, the
     carry-off) are not built: the bodies and lines come first (f39-hosting-systems.md for the rest).
   - Shape C (2026-11-14): a side objective. Ogre Matriarch, Wagon-Breaker, Mire-Hag, Labyrinth Warder, Furnace Smith.
     A hostile roll picks shape A or C. At the start a site is placed K.siteMin..siteMax cells of walking away, its
     guards asleep at it (they wake as any camp does); with the guards down, standing on it K.siteHold frames takes it.
     A won contract with the site taken pays K.reward (the Matriarch K.siteReward 35%); untaken, the loss line. The
     Furnace Smith lays fire as it walks. Every draft per-creature number is in K (lead, hp, site*) [S].
   - The special acts (2026-11-14), E.ACTS, numbers in K [S]: Ridge Giant boulders (the engine's mortar at the squad);
     Bronze Sentinel keyword (a ring a few cells away; held, it stops the pack); Cliff Shrike carry-off (a mate on a
     ledge, out of the fight until the Leader stands by them; still there at a loss = the Bleeding Out roll);
     Wagon-Breaker charge (wind up, straight dash, rest); Mire-Hag pull-under (a near mate held at her side).
   - The other shape B creatures (2026-11-14), cards with their own buttons, Narrative's lines from F39_LINES, numbers in
     K [S]: Ford-Horse (a ride toward the objective, or the escort wagon +25%; a promise: not won = one mate into the
     water, the Bleeding Out roll); Green Hound (a lost patrol ring, its purse 10% of the pay); Antlered Warden (the
     first mate down is lifted, once); Raven-Seer (hunt the bird before it flies home; killed = the next march is blind,
     its first alarm cancelled; let go or flown = +1 alarm); Hearth-Wight (the oath-stone sells for 10% of the pay).
   Lines: encounters-f39.md sections 4 and 4b (Narrative drafts). Numbers marked [S] are drafts; dials on EVT39.K are [T].
   INT-1 group 10: no switch (EVT39.on and K.rewardOn baked in). */
(function(){
'use strict';
const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
const E = window.EVT39 = {log: []};
const K = E.K = {
  chance: [0, 0.20, 0.27, 0.33],     // [S] by tier (Patrick OK'd the odds)
  tierScale: [0, 0.6, 1.0, 1.4],     // [S] Condition by tier (Systems)
  soften: 0.85,                      // [S] until the Tier 2 and 3 softening lands
  arriveMin: 45, arriveMax: 90,      // [S] seconds after the start
  holdAt: 0.35,                      // [S] share of a Hold's clock
  arriveAt: 0.40,                    // [S] or this share of the objective done, if sooner (Patrick 2026-11-14)
  reward: 0.25,                      // [S] share of the pay on a win
  unseenWeight: 2,                   // [S] a creature not met yet is favoured
  neutral: 1 / 6,                    // [S] a Hidden Folk or Hob, when no hostile event rolled
  sceneAt: 2,                        // [S] seconds after the start the choice card comes up
  hobPay: 0.6,                       // [S] the Hob's small job pays this share of a fresh contract
  // per creature [S] (Systems to review): the first body's Condition multiplier, and a non-boss body's (x tier scale)
  lead: {rimewalker: 2.5, ridgeGiant: 2.0},
  hp: {bronzeSentinel: 3, cliffShrike: 9, mireHag: 8, labyrinthWarder: 8, furnaceSmith: 8},
  // shape C, the side objective [S]: a site this many cells of walking from the start, held this many frames once its
  // guards are down; the share of pay paid (K.reward unless named here)
  siteMin: 12, siteMax: 24, siteHold: 180,
  siteHp: [0, 8, 10, 12],            // a side body's multiplier by tier, in place of its K.hp (Patrick 2026-11-14)
  siteReward: {ogreMatriarch: 0.35},
  // the special acts [S] (frames: 60 = 1 s)
  boulderEvery: 240, boulderRange: 520,            // Ridge Giant: a mortar at the squad every 4 s within this range
  ringMin: 4, ringMax: 10, ringHold: 300,          // Bronze Sentinel: the keyword ring, cells away; held 5 s stops the pack
  carryMin: 6, carryMax: 14, freeHold: 90,         // Cliff Shrike: the ledge, cells away; stand 1.5 s by the mate to free them
  chargeEvery: 300, chargeWind: 40, chargeSpeed: 7, chargeTime: 50, chargeRest: 60, chargeDmg: 2,   // Wagon-Breaker
  pullEvery: 480, pullRange: 160, pullHold: 180,   // Mire-Hag: every 8 s a mate this close is held at her side 3 s
  // the other shape B creatures [S]
  fordMin: 4, fordMax: 14, fordWagon: 0.25,        // Ford-Horse: carried up to 14 cells toward the nearest objective; on an escort the wagon +25% hp
  houndMin: 10, houndMax: 22, houndHold: 120, houndLoot: 0.10,   // Green Hound: the lost patrol, cells away; stand 2 s; its purse = 10% of the pay
  ravenHp: 5, ravenFlee: 1200, ravenAlarm: 1,      // Raven-Seer: a cinder body x5; flies home after 20 s; flown or let go = +1 alarm now
  wightStone: 0.10                                 // Hearth-Wight: the oath-stone sells for 10% of the pay
};
/* the shape A creatures of phase 1 (regions and types: encounters-f39.md section 1) */
const C = E.CREATURES = {
  roadOgre:   {name: 'Road Ogre', regions: ['heartland', 'marches'], types: ['escort', 'extract', 'ambush', 'hold'],
               body: [['ogre', 1]], shape: 'A',
               event: 'A shape stands in the ditch ahead, bigger than a haystack and about as patient.',
               win: "The ogre goes down and its hoard rolls out: lost wheels, lost casks, someone's boots.",
               loss: 'The ogre took the cart and the cook, and was gone before the dust settled.',
               hint: 'Scouts report an ogre on the road. Its hoard is there for the taking.'},
  ogreBros:   {name: 'Ogre Brothers', regions: ['heartland', 'marches'], types: ['escort', 'extract'],
               body: [['ogre', 2]], shape: 'A',
               event: 'Two ogres step out of the trees. They do not talk. They do not stop.',
               win: 'The brothers are down. Their cart is stacked with the goods of a dozen robbed wagons.',
               loss: 'The brothers chased the squad to the border of the map. They are still chasing.',
               hint: 'Scouts report two ogres chasing wagons. Their cart is full of stolen goods.'},
  rimeWolf:   {name: 'Rime Wolf', regions: ['frost'], types: ['escort', 'hunt', 'purge'],
               body: [['alpha', 1], ['wolf', 3]], shape: 'A',
               event: 'A white wolf watches from the ridge. Behind it, more.',
               win: "The Mother falls and the pack scatters. Her pelt is worth a season's wages.",
               loss: 'The pack took the stragglers.',
               hint: "Scouts report a white wolf with a pack. Her pelt is worth a season's wages."},
  rimewalker: {name: 'Rimewalker', regions: ['frost'], types: ['purge', 'hold', 'seal', 'relic'],
               body: [['phalanx', 3]], shape: 'A',   // the first walker is the barrow-warrior (K.lead)
               event: 'The barrow door stands open. Something in ice-mail has walked out.',
               win: 'The barrow-warrior falls into rime and silence. Its grave-goods lie where it stood.',
               loss: "The cold took the squad's strength. The warrior walks on.",
               hint: 'Scouts report a barrow open on the road. Its grave-goods are still inside.'},
  ridgeGiant: {name: 'Ridge Giant', regions: ['frost'], types: ['escort', 'extract', 'breach'],
               body: [['ogre', 1]], shape: 'A',   // very high health (K.lead)
               event: 'A giant sits on the pass and weighs a boulder in its hand.',
               win: 'The giant is down and the pass is open.',
               loss: 'Boulders came down on the line. The pass stays closed.',
               hint: 'Scouts report a giant on the pass. A barrel or a blade will open it.'},
  bronzeSentinel: {name: 'Bronze Sentinel', regions: ['spine'], types: ['breach', 'hold', 'seal'],
               body: [['warden', 4]], shape: 'A', label: 'Bronze Sentinel',   // bronze (K.hp)
               event: 'Bronze figures stand in a vault, still as statues.',
               win: 'The keyword stops them. The vault is yours.',
               loss: 'The line marched, and did not tire.',
               hint: 'Scouts report bronze figures in a vault. There is a keyword that stops them.'},
  cliffShrike: {name: 'Cliff Shrike', regions: ['spine'], types: ['escort', 'rescue', 'beacons'],
               body: [['cinder', 2]], shape: 'A', label: 'Cliff Shrike',   // a great bird, not a cinderling (K.hp)
               event: 'A shriek from the cliff, and a shadow takes a mate.',
               win: 'The shrike is driven off. The mate is carried down, whole.',
               loss: 'The shrike nested higher than anyone could climb.',
               hint: "Scouts report a shrike on the ledge. It carries off what it can reach."},
  /* shape C: a side objective. A site on the map, its guards asleep at it; clear them, stand on the site, and the
     bonus is paid on a won contract. Untried or unfinished, the bonus is unearned. */
  ogreMatriarch: {name: 'Ogre Matriarch', regions: ['heartland', 'marches'], types: ['hunt', 'rescue', 'assassinate', 'purge'],
               body: [['ogre', 1], ['brigand', 3]], shape: 'C', site: 'the inn',
               event: 'A crossroads inn has a new landlady, and she is eight feet tall.',
               win: "The matriarch falls. Her sons run, and the inn's cellar yields a strongbox and three shaken travellers.",
               loss: 'The inn keeps its landlady and its secrets.',
               hint: 'Scouts report an ogre landlady at a crossroads inn. Her strongbox is under the stairs.'},
  wagonBreaker: {name: 'Wagon-Breaker', regions: ['heartland', 'marches', 'freelands'], types: ['escort', 'ambush'],
               body: [['alpha', 1]], shape: 'C', site: 'the carts',
               event: "A great bull-beast has broken free of a drover's rope and is smashing carts for sport.",
               win: 'The beast is turned, and the cargo is saved.',
               loss: 'The beast wrecked three carts before it stopped.',
               hint: 'Scouts report a bull-beast loose among the carts. Turn it, and the cargo is safe.'},
  mireHag:    {name: 'Mire-Hag', regions: ['freelands'], types: ['rescue', 'hunt', 'plague'],
               body: [['enforcer', 1]], shape: 'C', site: 'the fen', label: 'the Mire-Hag',
               event: 'A child is missing from the fen, and the mist is wrong.',
               win: 'The hag is driven under and the child comes up, blue and breathing.',
               loss: 'The mist closed over the child. The fen keeps what it takes.',
               hint: 'Scouts report a missing child in the fen. Something drags at the bog.'},
  labyrinthWarder: {name: 'Labyrinth Warder', regions: ['spine'], types: ['breach', 'extract', 'relic'],
               body: [['warden', 1]], shape: 'C', site: 'the side vault', label: 'the Labyrinth Warder',
               event: 'A corridor turns, and turns again. A horned shape waits in the dark.',
               win: 'The Warder falls at the heart of the maze. A vault stands open behind it.',
               loss: 'The maze closed on the squad and the Warder bellowed.',
               hint: 'Scouts report a horned guardian in the maze. A vault stands open behind it.'},
  furnaceSmith: {name: 'Furnace Smith', regions: ['spine'], types: ['sabotage', 'breach', 'quarry'],
               body: [['warden', 1]], shape: 'C', site: 'the forge', label: 'the Furnace Smith', fire: false,   // no fire (Patrick 2026-11-14: the fire, not the x8, broke it)
               event: 'A forge is roaring under the mountain. A one-eyed smith-giant tends it.',
               win: 'The forge is wrecked, and a bronze plan lies on the anvil.',
               loss: 'The heat drove the squad out. The smith went on hammering.',
               hint: 'Scouts report a forge running under the mountain. A bronze plan lies on the anvil.'},
  /* shape B: neutral, a choice before the fight, free to refuse (types: any for the sprite) */
  hedgeSprite:{name: 'Hedge Sprite', regions: ['freelands'], types: null, shape: 'B',
               event: 'A hawthorn hedge rustles. A hand-high Hidden Folk wants something shiny for a path.',
               accept: 'The sprite takes a trinket and shows a path through the thicket. It returns your boot laces, tied in a bow.',
               refuse: 'The sprite shrugs. The hedge is thicker than it looked.',
               hint: 'Scouts report a Hidden Folk in the hedge. It trades paths for shiny things.'},
  hob:        {name: 'Hob', regions: ['freelands'], types: ['rescue', 'hold', 'relic'], shape: 'B',
               event: 'A hearth-spirit sits in the ashes and asks a favour.',
               accept: 'The hob names a small job, and a loaf waiting at the end of it.',
               refuse: 'The hob nods, unoffended, and turns back to its ashes. The door stays open if you change your mind.',   // Narrative, final; refusal is free
               hint: 'Scouts report a hearth-spirit with a favour to ask. A loaf waits at the end.'},
  fordHorse:  {name: 'Ford-Horse', regions: ['freelands'], types: ['escort', 'hunt', 'extract'], shape: 'B', yes: 'TAKE THE RIDE', no: 'WADE',
               terms: 'Refusing costs nothing. Taking the ride is a promise: see the job through, or the horse takes its due.',
               event: 'A grey horse stands in the ford and offers a ride.',
               accept: 'The horse carries the squad across, dry.', refuse: 'The squad wades the ford.',
               broken: 'The horse remembers. Someone is dragged under, and let go at the far bank, blue.',
               hint: 'Scouts report a grey horse at the ford. Keep your word and you cross dry.'},
  greenHound: {name: 'Green Hound', regions: ['freelands'], types: ['rescue', 'hunt', 'relic'], shape: 'B', yes: 'FOLLOW', no: 'IGNORE',
               event: 'A white hound with red ears runs ahead at dusk, and looks back.',
               accept: 'The hound leads the squad to a lost patrol, three days cold.', refuse: 'The hound watches, then runs on.',
               missed: 'The hound waited by the lost patrol, but the squad never stopped for them.',   // Narrative, final
               hint: 'Scouts report a white hound with red ears. Follow it to a lost patrol.'},
  antleredWarden: {name: 'Antlered Warden', regions: ['freelands'], types: ['hold', 'purge', 'hunt'], shape: 'B', yes: 'GUARD THE GROVE', no: 'PASS BY',
               event: 'An antlered warden stands in the wood, watching a grove.',
               accept: 'The warden bows its head. Roots lift a wounded mate to safety.', refuse: 'The squad passes the grove by.',
               hint: 'Scouts report an antlered warden at a grove. Defend it and it will bless the squad.'},
  ravenSeer:  {name: 'Raven-Seer', regions: ['frost'], types: ['assassinate', 'ambush', 'sabotage', 'beacons'], shape: 'B', yes: 'HUNT THE BIRD', no: 'LET IT BE',
               terms: 'Let it go, and it flies home with your name.', later: true,   // the accept line waits for the kill
               event: 'A black raven watches the camp from a dead branch. It has seen you.',
               accept: 'The bird falls. The Strategos will be blind to your march for a day.', refuse: 'The raven flies north with your name.',
               loss: 'The raven flew home with your name.',
               hint: 'Scouts report a black raven watching the road. Kill it, and the host marches blind.'},
  hearthWight: {name: 'Hearth-Wight', regions: ['frost'], types: ['relic', 'rescue', 'hold'], shape: 'B', yes: 'SPEAK THE OATH', no: 'LEAVE',
               event: "The hall's fire burns cold, and a voice asks for an oath nobody owes.",
               accept: 'The oath is spoken, and the fire warms. A priest will want the stone.', refuse: 'The squad leaves the cold hall.',
               hint: 'Scouts report a cold fire in a hall. A priest would pay for the oath-stone.'}
};
E.NAMES = {roadOgre: 'Road Ogre', ogreBros: 'Ogre Brother', rimeWolf: 'the Rime Wolf Mother', rimewalker: 'the Rimewalker', ridgeGiant: 'the Ridge Giant',
  ogreMatriarch: 'the Ogre Matriarch', wagonBreaker: 'the Wagon-Breaker', ravenSeer: 'the Raven-Seer'};
const LN = id => (window.F39_LINES || {})[id] || {};   // Narrative's lines win over the fallbacks above

/* ---------------------------------------------------------------- the roll --- */
E.excluded = function(c, M){
  M = M === undefined ? gl('META') : M;
  if (!c) return true;
  if (c.teach || c.teach30 || c.force30 || c.f34 || c.finale || c.obj === 'trial' || c.harness || c.drill) return true;
  if (c.arc) return true;   // story arcs (F-11): no F-39 events for now (Patrick 2026-11-14)
  if (M && M.cp) return true;
  try { if (typeof inStoryNow === 'function' && inStoryNow()) return true; } catch (e) {}
  return false;
};
E.fits = (id, c) => { const k = C[id]; return !!(k && c && k.regions.includes(c.region) && (!k.types || k.types.includes(c.obj))); };
E.pick = function(c, rand, M, shape){
  rand = rand || Math.random; M = M === undefined ? gl('META') : M; shape = shape || 'A';
  const mem = (M && M.ev39) || {}, seen = mem.seen || {};
  const ids = Object.keys(C).filter(id => shape.includes(C[id].shape) && E.fits(id, c) && id !== mem.last);
  if (!ids.length) return null;
  const w = ids.map(id => seen[id] ? 1 : K.unseenWeight), tot = w.reduce((a, b) => a + b, 0);
  let r = rand() * tot;
  for (let i = 0; i < ids.length; i++){ r -= w[i]; if (r < 0) return ids[i]; }
  return ids[ids.length - 1];
};
E.roll = function(c, rand, M){
  rand = rand || Math.random;
  if (!c || c.event || c.hob39 || E.excluded(c, M)) return null;
  let id = null;
  if (rand() < (K.chance[c.tier] || 0)) id = E.pick(c, rand, M, 'AC');   // hostile: an arrival (A) or a side objective (C)
  if (!id && rand() < K.neutral) id = E.pick(c, rand, M, 'B');   // never both: the neutral only when no hostile came
  if (!id) return null;
  c.event = {id, shape: C[id].shape, region: c.region};
  return c.event;
};
if (typeof makeContract === 'function'){
  const f = makeContract;
  makeContract = function(obj, tier){ const c = f.apply(this, arguments); try { E.roll(c); } catch (e) { console.warn('EVT39 roll', e); } return c; };
}

/* ---------------------------------------------------------------- scouting and the card --- */
// A contract counts as scouted when the company has intel on it: a prisoner's tip for the next contract (META.intel),
// the Deep Reconnaissance edge, or c.scouted39 (for the board's own scouting when it lands).
E.scouted = function(c, M){
  M = M === undefined ? gl('META') : M;
  return !!(c && (c.scouted39 || (c.edges || []).includes('recon') || (M && (M.intel === 'full' || M.intel === 'blips'))));
};
// Bug fixed 2026-11-14 (QA): makeFinale and arcs' A.make call makeContract (which may roll c.event) and set the finale
// flag afterwards, so a scouted finale card hinted at an encounter that never spawns. The hint now obeys E.excluded,
// and a finale contract drops its rolled event at birth.
E.cardHint = (c, M) => (c && c.event && C[c.event.id] && E.scouted(c, M) && !E.excluded(c, M)) ? C[c.event.id].hint : '';
if (typeof makeFinale === 'function'){ const f = makeFinale; makeFinale = function(){ const c = f.apply(this, arguments); if (c && c.finale) delete c.event; return c; }; }
if (typeof renderTable === 'function'){
  const f = renderTable;
  renderTable = function(){ const r = f.apply(this, arguments);
    try { const M = gl('META'); if (M && M.board){ const cards = document.querySelectorAll('.cscroll');
      cards.forEach((el, i) => { const h = E.cardHint(M.board[i]); if (h && !el.querySelector('.ev39'))
        el.querySelector('.cost') ? el.querySelector('.cost').insertAdjacentHTML('beforebegin', `<div class="desc ev39" style="font-size:14px;color:#2a4a6a"><b>Scouts:</b> ${h.replace(/^Scouts report /, '')}</div>`) : null; }); } } catch (e) {}
    return r; };
}

/* ---------------------------------------------------------------- the field --- */
E.live = () => { const g = gl('G'); return g && g.ev39 ? g.ev39 : null; };
if (typeof startDeployment === 'function'){
  const f = startDeployment;
  startDeployment = function(c){
    let sc = false; try { sc = E.scouted(c); E.clearCard(); } catch (e) {}   // before the field clears a prisoner's tip
    const r = f.apply(this, arguments);
    try {
      const g = gl('G'), M = gl('META');
      if (g && M && M.blind39){ M.blind39 = false; g.blind39 = true; note('The raven is dead. The host will not see this march.'); }
      if (g && c && c.event && C[c.event.id] && !E.excluded(c, M)){
        const at = K.arriveMin + Math.random() * (K.arriveMax - K.arriveMin);
        g.ev39 = {id: c.event.id, shape: C[c.event.id].shape, at: Math.round(at), out: false, ids: [], won: false, lost: false, paid: false};
        if (M){ const m = M.ev39 = M.ev39 || {seen: {}}; m.last = c.event.id; m.seen = m.seen || {}; }
        if (sc || E.scouted(c, M)) note('Scouts: ' + C[c.event.id].hint.replace(/^Scouts report /, ''));
        if (g.ev39.shape === 'C') E.place(g);
      }
    } catch (e) { console.warn('EVT39 start', e); }
    return r;
  };
}
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
E.due = function(g){
  if (!g || !g.ev39 || g.ev39.out || g.ev39.shape === 'B' || g.ev39.shape === 'C') return false;
  if (g.obj === 'hold' && g.contract && g.contract.minutes) return g.sec / (g.contract.minutes * 60) >= K.holdAt;
  if (g.sec >= g.ev39.at) return true;
  const pr = E.progress(g); return pr !== null && pr >= K.arriveAt;
};
// the share of the objective done: the contract's own measure (cages opened on a rescue), else camps and vaults cleared
E.progress = function(g){
  try {
    if (g.obj === 'rescue' && g.cages && g.cages.length) return g.cages.filter(c => c.open).length / g.cages.length;
    if (g === gl('G') && typeof contractProgress === 'function'){ const p = contractProgress(); if (typeof p === 'number' && isFinite(p)) return p; }
    const all = (g.camps || []).concat(g.vaults || []); if (!all.length) return null;
    return all.filter(o => o.done).length / all.length;
  } catch (e) { return null; }
};
/* shape C: a reachable cell K.siteMin..siteMax cells of walking from the start, the guards asleep around it */
E.siteSpot = function(g, lo, hi){
  lo = lo === undefined ? K.siteMin : lo; hi = hi === undefined ? K.siteMax : hi;
  const flow = g.flow, MP = gl('MAP'), CL = gl('CELL') || 40; if (!flow || !MP) return null;
  const cand = [];
  for (let i = 0; i < flow.length; i++){ const d = flow[i]; if (d >= lo && d <= hi) cand.push(i); }
  if (!cand.length) return null;
  const i = cand[Math.random() * cand.length | 0];
  return {x: (i % MP.w + 0.5) * CL, y: ((i / MP.w | 0) + 0.5) * CL};
};
E.place = function(g, at){
  const v = g.ev39; at = at || E.siteSpot(g); if (!at) return 0;
  v.site = {x: at.x, y: at.y, claim: 0, done: false};
  let grp = 0; try { grp = GROUP++; } catch (e) { grp = 9e5 + (Math.random() * 1e4 | 0); }
  return E.arrive(g, {x: at.x, y: at.y, grp});
};
E.arrive = function(g, site){
  const v = g.ev39, k = C[v.id]; if (!k) return 0;
  const tier = (g.contract && g.contract.tier) || 1, BEST = gl('BESTIARY');
  let n = 0, first = true, grp = 0;
  // a group keeps the bodies from being culled when far away (the engine culls ungrouped plain bodies); not asleep, so it
  // changes nothing else
  if (!site) try { grp = GROUP++; } catch (er) { grp = 9e5 + (Math.random() * 1e4 | 0); }
  for (const [body, count] of k.body) for (let i = 0; i < count; i++){
    // an explicit edge point: BAL35 thins plain wave spawns (x undefined) at Tier 2+, and an event body must not be thinned
    let p = null, o = {noNem: true, group: grp};
    if (site){ const a = Math.random() * 6.283, d = first ? 0 : 40 + Math.random() * 60;
      p = {x: site.x + Math.cos(a) * d, y: site.y + Math.sin(a) * d}; o = {noNem: true, dormant: true, group: site.grp}; }
    else try { p = spawnPoint(); } catch (er) {}
    const e = p ? spawnEnemy(body, p.x, p.y, o) : spawnEnemy(body, undefined, undefined, o); if (!e) continue;
    const B = BEST[body], ts = (K.tierScale[tier] || 1) * K.soften;
    const hp = K.hp[v.id] && k.shape === 'C' ? (K.siteHp[tier] || K.hp[v.id]) : K.hp[v.id], lead = first && K.lead[v.id];
    const scale = (B.boss ? ts : hp ? hp * ts : 1) * (lead || 1);
    if (B.boss || hp || lead){ e.con = e.maxCon = Math.max(1, Math.round(B.con * scale)); }
    if (B.boss || lead) e.name = v.id === 'ogreBros' ? `${E.NAMES[v.id]} ${n + 1}` : (E.NAMES[v.id] || k.name);
    else if (k.label) e.name = k.label;
    e.seen = true; e.ev39 = v.id; v.ids.push(e); n++; first = false;
  }
  if (!n) return 0;
  v.out = true; v.n = n;
  if (!site){ try { SFX.play('boss'); } catch (e) {} g.shake = Math.max(g.shake || 0, 16); }
  note(k.event + (site ? ` ${cap1(k.site)} is marked on the map.` : ''));
  E.log.push({id: v.id, at: g.sec, n});
  return n;
};
E.tick = function(g){
  const v = g && g.ev39; if (!v) return;
  if (v.shape === 'B'){ if (v.choice && document.getElementById('ev39-card')) E.clearCard();
    if (!v.out && !g.paused && g.sec >= K.sceneAt && !(window.BRIEFING && BRIEFING.up)) E.scene(g);
    else if (v.choice === 'accept' && E.ACTS[v.id]) try { E.ACTS[v.id](g, v); } catch (er) { console.warn('EVT39 act', er); }
    return; }
  if (!v.out){ if (E.due(g)) E.arrive(g); return; }
  if (E.ACTS[v.id]) try { E.ACTS[v.id](g, v); } catch (er) { console.warn('EVT39 act', er); }
  if (v.shape === 'C') return E.siteTick(g);
  if (!v.won && !v.lost && v.ids.length && v.ids.every(e => e.dead)){
    v.won = true; note(C[v.id].win); try { SFX.play('level'); } catch (e) {}
  }
};
/* ---------------------------------------------------------------- the special acts --- */
// Draft lines [S] for Narrative (the acts need a word on the field; none were written for these moments).
E.ACT_LINES = {   // Narrative, final: short enough for a field toast
  keyword: 'A word is cut into the floor. Stand on it and read it aloud.',
  keywordDone: 'THE BRONZE STOPS',
  carried: n => `The shrike has ${n} on a ledge. Climb up and bring them down.`,
  pulled: n => `The bog takes ${n}. Pull them out.`
};
const alive = v => v.ids.filter(e => !e.dead);
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pp = (x, y, t, c) => { try { pop(x, y, t, c); } catch (er) {} };
E.ACTS = {
  ridgeGiant(g, v){   // boulders: the engine's own mortar, aimed at the squad
    const e = alive(v)[0], L = g.leader; if (!e || e.dormant || !L || !g.hazards) return;
    v.bT = (v.bT || 0) + 1; if (v.bT < K.boulderEvery) return;
    const d = dst(e, L); if (d > K.boulderRange || d < 90) return;
    v.bT = 0; const c = squadCentre(), tier = (g.contract && g.contract.tier) || 1;
    g.hazards.push({x: c.x + Math.random() * 60 - 30, y: c.y + Math.random() * 60 - 30, r: 56, t: 95, max: 95, skill: 2 + tier, dmg: 3, kind: 'mortar', ev39: true});
    pp(e.x, e.y - 40, 'BOULDER', '#e8c890');
  },
  bronzeSentinel(g, v){   // the keyword: a held ring that stops the whole pack
    const L = g.leader; if (!L) return;
    if (!v.ring){ const p = E.siteSpot(g, K.ringMin, K.ringMax) || {x: L.x, y: L.y};
      v.ring = {x: p.x, y: p.y, claim: 0, done: false}; note(E.ACT_LINES.keyword); return; }
    const R = v.ring; if (R.done) return;
    const up = alive(v); if (!up.length){ R.done = true; return; }
    R.claim = dst(L, R) < 60 ? R.claim + 1 : Math.max(0, R.claim - 1);
    if (R.claim >= K.ringHold){ R.done = true; pp(R.x, R.y - 30, E.ACT_LINES.keywordDone, '#ffd860');
      for (const e of up){ try { hurtEnemy(e, 9999); } catch (er) {} if (!e.dead) e.dead = true; } }
  },
  cliffShrike(g, v){   // the carry-off: a mate is left on a ledge, out of the fight, until someone stands by them
    const L = g.leader; if (!L || !g.squad) return;
    if (!v.carried){ v.carried = true;
      const ups = g.squad.filter(m => m.state === 'up'); if (!ups.length) return;
      const p = E.siteSpot(g, K.carryMin, K.carryMax); if (!p) return;
      const m = ups[Math.random() * ups.length | 0];
      m.state = 'stable'; m.stabT = 0; m.x = p.x; m.y = p.y; m.taken39 = true; m.freeT = 0; v.taken = m;
      pp(p.x, p.y - 24, 'CARRIED OFF', '#ff8a7a'); note(E.ACT_LINES.carried(m.p ? m.p.name : 'a mate')); return; }
    const m = v.taken; if (!m || !m.taken39) return;
    if (m.state === 'up' || m.state === 'dead'){ m.taken39 = false; return; }
    m.freeT = dst(L, m) < 50 ? (m.freeT || 0) + 1 : 0;
    if (m.freeT >= K.freeHold){ m.taken39 = false; try { standUp(m, 'FREED'); } catch (er) { m.state = 'up'; } }
  },
  wagonBreaker(g, v){   // the charge: wind up, a straight dash at where the Leader stood, a pause to recover
    const e = alive(v)[0], L = g.leader; if (!e || e.dormant || !L) return;
    const c = v.ch = v.ch || {s: 'wait', t: 0}; c.t++;
    if (c.s === 'wait'){ if (c.t >= K.chargeEvery && dst(e, L) < 420){ c.s = 'wind'; c.t = 0; c.x = e.x; c.y = e.y; pp(e.x, e.y - 40, 'CHARGE!', '#ff6a5a'); } return; }
    if (c.s === 'wind'){ e.x = c.x; e.y = c.y;
      if (c.t >= K.chargeWind){ const a = Math.atan2(L.y - e.y, L.x - e.x); c.dx = Math.cos(a) * K.chargeSpeed; c.dy = Math.sin(a) * K.chargeSpeed; c.s = 'run'; c.t = 0; c.hit = []; } return; }
    if (c.s === 'run'){ const nx = e.x + c.dx, ny = e.y + c.dy;
      if (c.t > K.chargeTime || blockedXY(nx, ny)){ c.s = 'rest'; c.t = 0; c.x = e.x; c.y = e.y; return; }
      e.x = nx; e.y = ny; const B = gl('BESTIARY')[e.k];
      for (const u of squadUnits()) if (!c.hit.includes(u) && dst(u, e) < (e.r || 18) + 12){ c.hit.push(u);
        const d = enemyHitsUnit(u, B.skill + 1, B.dmg + K.chargeDmg, {});
        if (d){ pp(u.x, u.y - 18, '-' + d, '#d47a6a'); hurtSquad(d, u === g.leader ? null : u); if (g.over) return; } }
      return; }
    if (c.s === 'rest'){ e.x = c.x; e.y = c.y; if (c.t >= K.chargeRest){ c.s = 'wait'; c.t = 0; } }
  },
  mireHag(g, v){   // the pull-under: a mate close to her is dragged to her side and held there
    const e = alive(v)[0], L = g.leader, h = v.held;
    if (h){ if (!e || e.dormant || h.m.state !== 'up' || --h.t <= 0){ v.held = null; if (h.m.state === 'up') pp(h.m.x, h.m.y - 18, 'FREE OF THE BOG', '#8fd39a'); }
      else { h.m.x = e.x + 16; h.m.y = e.y + 4; } return; }
    if (!e || e.dormant || !L) return;
    v.pT = (v.pT || 0) + 1; if (v.pT < K.pullEvery) return;
    const ms = (g.squad || []).filter(m => m.state === 'up' && dst(m, e) < K.pullRange); if (!ms.length) return;
    v.pT = 0; const m = ms[Math.random() * ms.length | 0]; v.held = {m, t: K.pullHold};
    pp(m.x, m.y - 18, 'PULLED UNDER', '#7aa0c8'); note(E.ACT_LINES.pulled(m.p ? m.p.name : 'a mate'));
  },
  greenHound(g, v){   // the lost patrol: stand by it and its purse is the squad's
    const S = v.spot, L = g.leader; if (!S || S.done || !L) return;
    S.claim = dst(L, S) < 60 ? S.claim + 1 : Math.max(0, S.claim - 1);
    if (S.claim >= K.houndHold){ S.done = true; v.found = true; pp(S.x, S.y - 30, 'THE LOST PATROL', '#ffd860'); try { SFX.play('chest'); } catch (e) {} }
  },
  antleredWarden(g, v){   // the blessing: the first mate down is lifted by roots, once
    if (v.blessed || !g.squad) return; const m = g.squad.find(x => x.state === 'bleeding'); if (!m) return;
    v.blessed = true; try { standUp(m, 'ROOTS'); } catch (e) { m.state = 'up'; }
  },
  ravenSeer(g, v){   // the bird: kill it before it flies home
    const e = v.ids[0]; if (!e || v.won || v.lost) return;
    if (e.dead){ v.won = true; note(LN(v.id).accept || C[v.id].accept); try { const M = gl('META'); if (M) M.blind39 = true; } catch (er) {} return; }
    v.fT = (v.fT || 0) + 1;
    if (v.fT >= K.ravenFlee){ v.lost = true; e.dead = true; pp(e.x, e.y - 30, 'IT FLIES HOME', '#ff8a7a'); g.alarm = (g.alarm || 0) + K.ravenAlarm; note(C[v.id].loss); }
  }
};
// the Ford-Horse's ride: toward the nearest objective, never further from it
E.carry = function(g){
  const L = g.leader, flow = g.flow, MP = gl('MAP'), CL = gl('CELL') || 40; if (!L || !flow || !MP) return false;
  let ms = []; try { ms = objectiveMarkers().filter(m => m.kind !== 'done'); } catch (e) {}
  if (!ms.length) return false;
  const T = ms.reduce((a, b) => dst(a, L) < dst(b, L) ? a : b);
  let best = null, bd = dst(L, T) - CL;
  for (let i = 0; i < flow.length; i++){ const d = flow[i]; if (d < K.fordMin || d > K.fordMax) continue;
    const p = {x: (i % MP.w + 0.5) * CL, y: ((i / MP.w | 0) + 0.5) * CL}, q = dst(p, T); if (q < bd){ bd = q; best = p; } }
  if (!best) return false;
  for (const u of [L].concat((g.squad || []).filter(m => m.state !== 'dead'))){ u.x = best.x + (u === L ? 0 : Math.random() * 20 - 10); u.y = best.y + (u === L ? 0 : Math.random() * 20 - 10); }
  pp(best.x, best.y - 30, 'ACROSS, DRY', '#8fd39a'); return true;
};
E.siteTick = function(g){
  const v = g.ev39, S = v.site, k = C[v.id], L = g.leader; if (!S || S.done) return;
  const up = v.ids.filter(e => !e.dead);
  if (k.fire && (g.frame || 0) % 40 === 0) for (const e of up) if (!e.dormant && g.fires) g.fires.push({x: e.x, y: e.y + 10, r: 26, life: 300, enemy: true});
  if (!L) return;
  const near = Math.hypot(L.x - S.x, L.y - S.y) < 60;
  if (up.length){ if (near && (g.frame || 0) % 60 === 0) try { pop(S.x, S.y - 30, 'DEAL WITH THE GUARDS FIRST', '#ff8a7a'); } catch (e) {} return; }
  if (!v.cleared){ v.cleared = true; try { pop(S.x, S.y - 30, 'STAND ON ' + k.site.toUpperCase(), '#ffd860'); } catch (e) {} }
  S.claim = near ? S.claim + 1 : Math.max(0, S.claim - 1);
  if (S.claim >= K.siteHold){ S.done = true; v.won = true; note(k.win); try { SFX.play('level'); } catch (e) {}
    try { pop(S.x, S.y - 30, cap1(k.site).toUpperCase() + ': TAKEN', '#ffd860'); } catch (e) {} }
};
// the site on the field (a ring, gold while it is taken) and on the maps
E.rings = v => { const out = [];
  if (v.site && !v.site.done) out.push([v.site, K.siteHold]);
  if (v.ring && !v.ring.done) out.push([v.ring, K.ringHold]);
  if (v.spot && !v.spot.done) out.push([v.spot, K.houndHold]);
  const m = v.taken; if (m && m.taken39) out.push([{x: m.x, y: m.y, claim: m.freeT || 0}, K.freeHold]);
  return out; };
if (typeof draw === 'function'){
  const f = draw;
  draw = function(){ const r = f.apply(this, arguments);
    try { const g = gl('G'), v = g && g.ev39; if (v && g.leader && !g.over) for (const [S, hold] of E.rings(v)){
      const cv = camView(), cx = cv.x, cy = cv.y, lz = 1 / cv.z;   /* A2: the zoomed world; line widths keep their screen px */
      if (S.x > cx - 80 && S.x < cx + cv.w + 80 && S.y > cy - 80 && S.y < cy + cv.h + 80){
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(cv.z, cv.z); ctx.translate(-cx, -cy);
        ctx.strokeStyle = 'rgba(255,216,96,.75)'; ctx.lineWidth = 2 * lz; ctx.setLineDash([8 * lz, 6 * lz]);
        ctx.beginPath(); ctx.arc(S.x, S.y, 44 + Math.sin((g.frame || 0) / 12) * 3, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
        if (S.claim > 0){ ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 5 * lz; ctx.beginPath();
          ctx.arc(S.x, S.y, 34, -Math.PI / 2, -Math.PI / 2 + 6.2832 * Math.min(1, S.claim / hold)); ctx.stroke(); }
        ctx.restore(); } } } catch (e) {}
    return r; };
}
if (typeof objectiveMarkers === 'function'){
  const f = objectiveMarkers;
  objectiveMarkers = function(){ const out = f.apply(this, arguments);
    try { const g = gl('G'), v = g && g.ev39; if (v && Array.isArray(out)){
      if (v.site) out.push({x: v.site.x, y: v.site.y, kind: v.site.done ? 'done' : 'vault', sp: 'vault'});
      for (const [R] of E.rings(v)) if (R !== v.site) out.push({x: R.x, y: R.y, kind: 'vault', sp: 'vault'}); } } catch (e) {}
    return out; };
}
if (typeof updateContract === 'function'){
  const f = updateContract;
  updateContract = function(){ const r = f.apply(this, arguments); try { const g = gl('G'); if (g && !g.over){ E.tick(g);
    if (g.blind39 && g.alarm > 0){ g.alarm--; g.blind39 = false; pp(g.leader.x, g.leader.y - 30, 'THE HOST IS BLIND', '#8fd39a'); } } } catch (e) { console.warn('EVT39 tick', e); } return r; };
}
/* shape B: the choice card. The field pauses; ACCEPT or REFUSE; refusing costs nothing. */
E.scene = function(g){
  const v = g.ev39, k = C[v.id]; if (!k || v.out) return false;
  v.out = true; g.paused = true; try { for (const x in keys) keys[x] = false; } catch (e) {}
  let el = document.getElementById('ev39-card'); if (el) el.remove();
  el = document.createElement('div'); el.id = 'ev39-card';
  el.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(10,6,2,.55)';
  el.innerHTML = `<div style="max-width:440px;margin:16px;padding:18px 20px;background:#f3e6c4;color:#2a1c0c;border:2px solid #6b4a22;border-radius:6px;font:15px Georgia;box-shadow:0 6px 24px rgba(0,0,0,.5)">
    <h3 style="margin:0 0 8px">${k.name}</h3><p style="margin:0 0 14px">${LN(v.id).event || k.event}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button data-ev39="refuse" style="padding:6px 14px">${k.no || 'REFUSE'}</button><button data-ev39="accept" style="padding:6px 14px;font-weight:bold">${k.yes || 'ACCEPT'}</button></div>
    <div style="font-size:12px;color:#5a4428;margin-top:8px">${k.terms || 'Refusing costs nothing.'}</div></div>`;
  el.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-ev39]'); if (b) E.choose(b.getAttribute('data-ev39')); });
  document.body.appendChild(el);
  E.log.push({id: v.id, at: g.sec, scene: true});
  return true;
};
// Esc would unpause the field under the card: swallow it while the card is up
// (the field's key handler registers before this file, so togglePause itself is held while the card is up)
E.cardUp = () => { const g = gl('G'), v = g && g.ev39; return !!(v && v.shape === 'B' && v.out && !v.choice && !g.over); };
// the card belongs to one field: any card left over (the field ended or a new one began without an answer) is removed
E.clearCard = () => { const el = document.getElementById('ev39-card'); if (el) el.remove(); };
if (typeof togglePause === 'function'){ const f = togglePause; togglePause = function(){
  if (document.getElementById('ev39-card')){ if (E.cardUp()) return; E.clearCard(); } return f.apply(this, arguments); }; }
if (typeof endDeployment === 'function'){ const f = endDeployment; endDeployment = function(result){ E.clearCard();
  try { const g = gl('G'), m = g && g.ev39 && g.ev39.taken; if (m && m.taken39){ m.taken39 = false; if (result !== 'victory' && m.state === 'stable') m.state = 'bleeding'; } } catch (e) {}
  try { E.due39(gl('G'), result); } catch (e) {}
  return f.apply(this, arguments); }; }
E.due39 = function(g, result){   // the horse takes its due: one standing mate goes into the water (the Bleeding Out roll)
  const v = g && g.ev39; if (!v || v.id !== 'fordHorse' || !v.word || v.broken !== undefined) return;
  v.broken = result !== 'victory'; if (!v.broken) return;
  const ups = (g.squad || []).filter(m => m.state === 'up'); if (!ups.length) return;
  ups[Math.random() * ups.length | 0].state = 'bleeding';
};
E.effects = {
  hedgeSprite: () => { try { revealAll(); } catch (e) {} },
  hob: (g, M) => { if (M) M.hob39 = {from: (g.contract && g.contract.region) || 'freelands'}; },
  fordHorse: g => { const w = g.wagon; g.ev39.word = true;
    if (w && w.maxHp){ const add = Math.round(w.maxHp * K.fordWagon); w.maxHp += add; w.hp += add; } else E.carry(g); },
  greenHound: g => { const p = E.siteSpot(g, K.houndMin, K.houndMax); if (p) g.ev39.spot = {x: p.x, y: p.y, claim: 0, done: false}; },
  antleredWarden: () => {},
  ravenSeer: g => { const L = g.leader; if (!L) return; let grp = 0; try { grp = GROUP++; } catch (e) {}
    const a = Math.random() * 6.283, B = gl('BESTIARY').cinder, tier = (g.contract && g.contract.tier) || 1;
    const e = spawnEnemy('cinder', L.x + Math.cos(a) * 220, L.y + Math.sin(a) * 220, {noNem: true, group: grp}); if (!e) return;
    e.con = e.maxCon = Math.max(1, Math.round(B.con * K.ravenHp * (K.tierScale[tier] || 1))); e.name = E.NAMES.ravenSeer; e.seen = true; e.ev39 = 'ravenSeer'; g.ev39.ids.push(e); },
  hearthWight: g => { g.ev39.stone = true; }
};
// refusing is free, except the raven: let go, it flies home with your name [S]
E.refuseCost = { ravenSeer: g => { g.alarm = (g.alarm || 0) + K.ravenAlarm; } };
E.choose = function(choice, g, M){
  g = g || gl('G'); M = M === undefined ? gl('META') : M;
  const el = document.getElementById('ev39-card'); if (el) el.remove();
  const v = g && g.ev39; if (!v || v.shape !== 'B' || v.choice) return null;
  const k = C[v.id]; v.choice = choice === 'accept' ? 'accept' : 'refuse';
  if (v.choice === 'accept' && E.effects[v.id]) E.effects[v.id](g, M);
  if (v.choice === 'refuse' && E.refuseCost[v.id]) E.refuseCost[v.id](g, M);
  g.paused = false;
  const X = LN(v.id);
  try { if (!(v.choice === 'accept' && k.later)) note(v.choice === 'accept' ? (X.accept || k.accept) : (X.refuse || k.refuse)); } catch (e) {}
  return v.choice;
};
/* the Hob's small job: first on the next board, lower pay, no Standing, no event of its own */
E.hobJob = function(M){
  M = M === undefined ? gl('META') : M; if (!M || !M.hob39) return null;
  const c = makeContract(pickOf(['rescue', 'hold', 'relic']), 1);
  c.event = null; c.hob39 = true; c.title = "The Hob's Small Job"; c.patron = 'a hearth-spirit'; c.council = [];
  c.pay = Math.max(5, Math.round((c.pay || 0) * K.hobPay / 5) * 5);
  const X = (window.F39_LINES || {}).hob || {}; if (X.jobBrief) c.brief = X.jobBrief + (c.brief ? ' ' + c.brief : '');
  M.hob39 = null; return c;
};
if (typeof rollBoard === 'function'){
  const f = rollBoard;
  rollBoard = function(){ const r = f.apply(this, arguments);
    try { const M = gl('META'); if (M && M.hob39 && M.board && !E.excluded({}, M)){ const c = E.hobJob(M); if (c){ M.board = [c].concat(M.board).slice(0, 4); if (typeof saveMeta === 'function') saveMeta(); } } } catch (e) { console.warn('EVT39 hob', e); }
    return r; };
}
if (typeof shiftStanding === 'function'){
  const f = shiftStanding;
  shiftStanding = function(){ try { const g = gl('G'); if (g && g.contract && g.contract.hob39) return; } catch (e) {} return f.apply(this, arguments); };
}
/* the debrief: the bonus on a win, the loss line otherwise; shape B: the choice */
E.settle = function(g, result, M){
  const v = g && g.ev39; if (!v || !v.out || v.paid) return null;
  v.paid = true; const k = C[v.id], c = g.contract || {};
  if (v.shape === 'B'){ const X = LN(v.id), acc = v.choice === 'accept';
    let line = acc ? (X.debriefAccept || k.accept) : (X.debriefRefuse || k.refuse), share = 0, cls = '';
    if (acc && v.id === 'fordHorse' && v.broken) { line = k.broken; cls = 'bad'; }
    if (acc && v.id === 'greenHound'){ if (v.found) share = K.houndLoot; else line = k.missed; }
    if (acc && v.id === 'ravenSeer' && !v.won){ line = k.loss; cls = 'bad'; }
    if (acc && v.id === 'hearthWight' && v.stone) share = K.wightStone;
    const bonus = share ? Math.round((c.pay || 0) * share / 5) * 5 : 0;
    if (bonus && M) M.treasury = (M.treasury || 0) + bonus;
    return {bonus, html: `<p${bonus ? ' class="good"' : cls ? ` class="${cls}"` : ''}>${line}${bonus ? ` +${bonus}gp.` : ''}</p>`}; }
  if (v.won && result === 'victory'){
    const share = (K.siteReward && K.siteReward[v.id]) || K.reward;
    const bonus = Math.round((c.pay || 0) * share / 5) * 5;
    if (M) M.treasury = (M.treasury || 0) + bonus;
    return {bonus, html: `<p class="good">${k.win} +${bonus}gp.</p>`};
  }
  if (!v.won) return {bonus: 0, html: `<p class="bad">${k.loss}</p>`};
  return {bonus: 0, html: `<p>${k.win}</p>`};
};
// endDeployment pays the contract, then draws the report with renderDebrief(head, lines); the line goes into that lines
// array, so every later redraw (DEBRIEF31's cards, a level-up pick) keeps it.
if (typeof renderDebrief === 'function'){
  const f = renderDebrief;
  renderDebrief = function(head, lines){
    try { const g = gl('G'); if (g && g.over && g.ev39 && g.ev39.out && !g.ev39.paid && Array.isArray(lines)){
      const M = gl('META'), s = E.settle(g, g.result, M);
      if (s){ lines.push(s.html); if (s.bonus && typeof saveMeta === 'function') saveMeta(); } }
      if (g && g.over && g.contract && g.contract.hob39 && !g.hob39said && Array.isArray(lines)){ g.hob39said = true;
        const X = (window.F39_LINES || {}).hob || {}, t = g.result === 'victory' ? X.jobWin : X.jobLoss;
        if (t) lines.push(`<p>${t}</p>`); } } catch (e) { console.warn('EVT39 debrief', e); }
    return f.apply(this, arguments);
  };
}

/* ---------------------------------------------------------------- self-test --- */
E.selfTest = function(){
  const fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const seq = a => { let i = 0; return () => a[i++ % a.length]; };
  try {
    const M = {ev39: {seen: {}}};
    // the roll: odds by tier, fit, exclusions
    const c1 = {obj: 'escort', tier: 1, region: 'heartland', edges: []};
    ok('a roll under the Tier 1 chance gives a fitting event', E.roll(c1, seq([0.19, 0.1]), M) && ['roadOgre', 'ogreBros'].includes(c1.event.id) && c1.event.shape === 'A');
    const c2 = {obj: 'escort', tier: 1, region: 'heartland', edges: []};
    ok('a roll over the Tier 1 chance gives none', !E.roll(c2, seq([0.21]), M) && !c2.event);
    const c3 = {obj: 'escort', tier: 3, region: 'heartland', edges: []};
    ok('Tier 3 rolls at 33%', !!E.roll(c3, seq([0.32, 0.5]), M));
    ok('no creature fits a heartland seal', !E.roll({obj: 'seal', tier: 3, region: 'heartland', edges: []}, seq([0]), M));
    ok('spine breach brings a Bronze Sentinel', (E.roll({obj: 'breach', tier: 2, region: 'spine', edges: []}, seq([0, 0]), M) || {}).id === 'bronzeSentinel');
    ok('frost extract can bring the Ridge Giant', ['ridgeGiant', 'roadOgre', 'ogreBros'].includes((E.roll({obj: 'extract', tier: 2, region: 'frost', edges: []}, seq([0, 0]), M) || {}).id));
    { const cs = {obj: 'sabotage', tier: 2, region: 'spine', edges: []}; const r = E.roll(cs, seq([0, 0]), {ev39: {seen: {}}});
      ok('spine sabotage brings the Furnace Smith (shape C)', r && r.id === 'furnaceSmith' && r.shape === 'C'); }
    ok('frost purge can bring a Rime Wolf or a Rimewalker', ['rimeWolf', 'rimewalker'].includes((E.roll({obj: 'purge', tier: 2, region: 'frost', edges: []}, seq([0, 0.5]), M) || {}).id));
    for (const x of [{teach: {}}, {force30: true}, {finale: true}, {obj: 'trial'}, {f34: 'b1'}])
      ok('excluded: ' + Object.keys(x)[0], !E.roll(Object.assign({obj: 'escort', tier: 3, region: 'heartland', edges: []}, x), seq([0]), M));
    ok('excluded: a campaign in progress', !E.roll({obj: 'escort', tier: 3, region: 'heartland', edges: []}, seq([0]), {cp: {}}));
    // the repeat guard and the unseen weight
    ok('the last creature never comes twice in a row', E.pick({obj: 'escort', region: 'heartland'}, seq([0]), {ev39: {last: 'roadOgre', seen: {}}}) === 'ogreBros');
    ok('a lone fitting creature that came last gives no event', E.pick({obj: 'hold', region: 'heartland'}, seq([0]), {ev39: {last: 'roadOgre', seen: {}}}) === null);
    ok('an unseen creature weighs double', E.pick({obj: 'escort', region: 'heartland'}, seq([0.6]), {ev39: {seen: {roadOgre: 1}}}) === 'ogreBros');
    // the card hint only when scouted
    const cc = {obj: 'escort', tier: 1, region: 'heartland', edges: [], event: {id: 'roadOgre', shape: 'A'}};
    ok('no hint on an unscouted card', !E.scouted(cc, {}));
    ok('a prisoner tip shows the hint', E.scouted(cc, {intel: 'full'}) && !E.scouted(cc, {}));
    ok('the recon edge shows the hint', E.scouted(Object.assign({}, cc, {edges: ['recon']}), {}));
    ok('no hint on a scouted finale (excluded) card', !E.cardHint(Object.assign({}, cc, {finale: true}), {intel: 'full'}) && !!E.cardHint(cc, {intel: 'full'}));
    if (typeof makeFinale === 'function' && typeof FINALES !== 'undefined'){ const t = Object.keys(FINALES)[0]; let bad = 0;
      for (let i = 0; i < 40; i++) if (makeFinale(t).event) bad++; ok('a finale contract carries no rolled event', bad === 0); }
    // arrival, the win and the bonus, on a stub field
    const g = {obj: 'escort', sec: 0, contract: {tier: 2, pay: 400}, ev39: {id: 'ogreBros', at: 60, out: false, ids: [], won: false, lost: false, paid: false}};
    ok('not due before its time', !E.due(g)); g.sec = 60; ok('due at its time', E.due(g));
    const gh = {obj: 'hold', sec: 0, contract: {tier: 1, minutes: 4}, ev39: {id: 'roadOgre', at: 999, out: false, ids: []}};
    gh.sec = 83; ok('a Hold is not due before 35%', !E.due(gh)); gh.sec = 84; ok('a Hold is due at 35%', E.due(gh));
    { const gp = {obj: 'hunt', sec: 5, camps: [{done: true}, {done: false}, {done: false}], vaults: [], contract: {tier: 1}, ev39: {id: 'roadOgre', at: 80, out: false, ids: []}};
      ok('arrival: not due under 40% of the objective', !E.due(gp)); gp.camps[1].done = true; ok('arrival: due at 40% of the objective, before the timer', E.due(gp));
      const gr = {obj: 'rescue', sec: 5, cages: [{open: true}, {open: false}], camps: [], vaults: [], ev39: {id: 'roadOgre', at: 80, out: false, ids: []}};
      ok('arrival: a rescue counts cages opened', E.due(gr)); }
    ok('excluded: a story arc contract (F-11)', !E.roll({obj: 'escort', tier: 3, region: 'heartland', edges: [], arc: 'mendor'}, seq([0]), M));
    ok('the Furnace Smith lays no fire', !C.furnaceSmith.fire);
    const spawned = [], sv = {se: window.spawnEnemy, note: window.note, sfx: window.SFX && SFX.play};
    try {
      spawnEnemy = (k, x, y, o) => { const e = {k, con: 1, maxCon: 1, x, y, dormant: !!(o && o.dormant), group: o && o.group}; spawned.push(e); return e; }; note = () => {}; if (window.SFX) SFX.play = () => {};
      const n = E.arrive(g);
      ok('the Ogre Brothers bring two ogres', n === 2 && spawned.every(e => e.k === 'ogre' && e.seen && e.ev39 === 'ogreBros'));
      ok('Tier 2 ogre Condition 70 x1.0 x0.85', spawned[0].con === Math.round(70 * 0.85));
      E.tick(g); ok('not won while one stands', !g.ev39.won);
      spawned.forEach(e => e.dead = true); E.tick(g); ok('won when both are down', g.ev39.won);
      const M2 = {treasury: 100}, s = E.settle(g, 'victory', M2);
      ok('a won event and a won contract pay 25%', s && s.bonus === 100 && M2.treasury === 200 && s.html.indexOf('+100gp') >= 0);
      ok('paid once', E.settle(g, 'victory', M2) === null && M2.treasury === 200);
      const g2 = {obj: 'escort', sec: 0, contract: {tier: 1, pay: 200}, ev39: {id: 'roadOgre', out: true, ids: [{}], won: false, paid: false}};
      const s2 = E.settle(g2, 'victory', M2); ok('an unbeaten creature: the loss line, no bonus', s2 && !s2.bonus && M2.treasury === 200 && s2.html.indexOf('took the cart') >= 0);
      spawned.length = 0; const gt = {obj: 'escort', sec: 0, contract: {tier: 1, pay: 200}, ev39: {id: 'rimewalker', at: 0, out: false, ids: []}};
      E.arrive(gt); ok('Tier 1 Rimewalker: three walkers, the first stronger', spawned.length === 3 && spawned[0].con > spawned[1].con);
      spawned.length = 0; E.arrive({obj: 'escort', sec: 0, contract: {tier: 2}, ev39: {id: 'ridgeGiant', out: false, ids: []}});
      ok('Ridge Giant: one ogre at x2.0', spawned.length === 1 && spawned[0].con === Math.round(70 * 0.85 * 2) && spawned[0].name === 'the Ridge Giant');
      spawned.length = 0; E.arrive({obj: 'hold', sec: 0, contract: {tier: 3}, ev39: {id: 'bronzeSentinel', out: false, ids: []}});
      ok('Bronze Sentinel: four wardens, named, Condition x3 x1.4 x0.85', spawned.length === 4 && spawned.every(e => e.k === 'warden' && e.name === 'Bronze Sentinel' && e.con === Math.round(5 * 3 * 1.4 * 0.85)));
      spawned.length = 0; E.arrive({obj: 'rescue', sec: 0, contract: {tier: 1}, ev39: {id: 'cliffShrike', out: false, ids: []}});
      ok('Cliff Shrike: two cinderlings at x9', spawned.length === 2 && spawned.every(e => e.k === 'cinder' && e.con === Math.max(1, Math.round(BESTIARY.cinder.con * 9 * 0.6 * 0.85))));
      for (const t of [1, 2, 3]){ spawned.length = 0; E.place({obj: 'breach', sec: 0, frame: 1, contract: {tier: t}, ev39: {id: 'labyrinthWarder', shape: 'C', out: false, ids: []}}, {x: 100, y: 100});
        ok('C: the Warder at Tier ' + t + ' is x' + K.siteHp[t], spawned[0] && spawned[0].con === Math.max(1, Math.round(BESTIARY.warden.con * K.siteHp[t] * K.tierScale[t] * K.soften))); }
      // shape C: the site, its sleeping guards, the claim, the bonus
      spawned.length = 0; const gc = {obj: 'hunt', sec: 0, frame: 1, contract: {tier: 2, pay: 200}, leader: {x: 0, y: 0},
        ev39: {id: 'ogreMatriarch', shape: 'C', out: false, ids: [], won: false, paid: false}};
      ok('C: the Matriarch is placed with her crew, asleep at the inn', E.place(gc, {x: 500, y: 500}) === 4 && gc.ev39.site && gc.ev39.out
        && spawned.every(e => e.dormant && e.group === spawned[0].group) && spawned[0].name === 'the Ogre Matriarch' && spawned[0].x === 500);
      ok('C: no arrival timer for a side objective', !E.due(Object.assign({}, gc, {sec: 999, ev39: Object.assign({}, gc.ev39, {out: false})})));
      gc.leader = {x: 500, y: 500}; for (let i = 0; i < 10; i++) E.tick(gc);
      ok('C: the site cannot be taken while a guard stands', gc.ev39.site.claim === 0 && !gc.ev39.won);
      spawned.forEach(e => e.dead = true); for (let i = 0; i < K.siteHold; i++) E.tick(gc);
      ok('C: guards down and the site held: taken', gc.ev39.site.done && gc.ev39.won);
      const M3 = {treasury: 0}; const s3 = E.settle(gc, 'victory', M3);
      ok('C: the Matriarch pays 35% on a win', s3.bonus === 70 && M3.treasury === 70);
      spawned.length = 0; const gw = {obj: 'breach', sec: 0, frame: 1, contract: {tier: 2, pay: 200}, leader: {x: 0, y: 0},
        ev39: {id: 'labyrinthWarder', shape: 'C', out: false, ids: [], won: false, paid: false}};
      E.place(gw, {x: 100, y: 100});
      ok('C: the Labyrinth Warder, one warden at Condition x10 at Tier 2', spawned.length === 1 && spawned[0].con === Math.round(5 * 10 * 0.85) && spawned[0].name === 'the Labyrinth Warder');
      const s4 = E.settle(gw, 'victory', {treasury: 0});
      ok('C: an untaken site: no bonus, the loss line', s4.bonus === 0 && s4.html.includes(C.labyrinthWarder.loss));
      // the special acts (the charge is live-tested: it needs a real map)
      const st = {sc: window.squadCentre, he: window.hurtEnemy, ss: E.siteSpot};
      try {
        squadCentre = () => ({x: 0, y: 0}); hurtEnemy = e => { e.dead = true; };
        const gg = {leader: {x: 0, y: 0}, hazards: [], contract: {tier: 2}, ev39: {id: 'ridgeGiant', ids: [{x: 300, y: 0}]}};
        for (let i = 0; i < K.boulderEvery; i++) E.ACTS.ridgeGiant(gg, gg.ev39);
        ok('act: the Ridge Giant throws a boulder (a mortar) at the squad', gg.hazards.length === 1 && gg.hazards[0].kind === 'mortar');
        const gs = {leader: {x: 0, y: 0}, ev39: {id: 'bronzeSentinel', ids: [{x: 200, y: 0}, {x: 220, y: 0}]}};
        E.ACTS.bronzeSentinel(gs, gs.ev39); for (let i = 0; i < K.ringHold; i++) E.ACTS.bronzeSentinel(gs, gs.ev39);
        ok('act: the keyword ring held stops every Sentinel', gs.ev39.ring && gs.ev39.ring.done && gs.ev39.ids.every(e => e.dead));
        E.siteSpot = () => ({x: 500, y: 0});
        const mate = {state: 'up', p: {name: 'Tam'}, x: 0, y: 0}, gr = {leader: {x: 0, y: 0}, squad: [mate], ev39: {id: 'cliffShrike', ids: []}};
        E.ACTS.cliffShrike(gr, gr.ev39);
        ok('act: the Shrike carries a mate to the ledge, out of the fight', mate.state === 'stable' && mate.x === 500 && mate.taken39 && E.rings(gr.ev39).length === 1);
        gr.leader = {x: 500, y: 10}; for (let i = 0; i < K.freeHold; i++) E.ACTS.cliffShrike(gr, gr.ev39);
        ok('act: standing by the mate frees them', mate.state === 'up' && !mate.taken39);
        const m2 = {state: 'up', p: {name: 'Bel'}, x: 100, y: 0}, hag = {x: 0, y: 0}, gh2 = {leader: {x: 300, y: 0}, squad: [m2], ev39: {id: 'mireHag', ids: [hag]}};
        for (let i = 0; i < K.pullEvery; i++) E.ACTS.mireHag(gh2, gh2.ev39);
        E.ACTS.mireHag(gh2, gh2.ev39);
        ok('act: the Mire-Hag pulls a near mate to her side', gh2.ev39.held && m2.x === 16);
        for (let i = 0; i < K.pullHold; i++) E.ACTS.mireHag(gh2, gh2.ev39);
        ok('act: the hold ends', !gh2.ev39.held);
      } finally { squadCentre = st.sc; hurtEnemy = st.he; E.siteSpot = st.ss; }
    } finally { spawnEnemy = sv.se; note = sv.note; if (window.SFX && sv.sfx) SFX.play = sv.sfx; }
    // shape B: the neutral roll, the card, free refusal, the Hob's job
    const cn = {obj: 'escort', tier: 1, region: 'freelands', edges: []};
    ok('B: no hostile fits, the neutral rolls at 1 in 6', E.roll(cn, seq([0.5, 0.1, 0]), M) && cn.event.id === 'hedgeSprite' && cn.event.shape === 'B');
    ok('B: over 1 in 6 gives none', !E.roll({obj: 'escort', tier: 1, region: 'freelands', edges: []}, seq([0.5, 0.17]), M));
    ok('B: never in the heartland', !E.roll({obj: 'escort', tier: 1, region: 'heartland', edges: []}, seq([0.5, 0]), M));
    ok('B: a hostile pick never gives a neutral', E.pick({obj: 'rescue', region: 'freelands'}, seq([0]), {}, 'A') === null);
    ok('B: a Hob job has no event', !E.roll({obj: 'rescue', tier: 1, region: 'freelands', edges: [], hob39: true}, seq([0, 0, 0]), M));
    const gb = {sec: 5, paused: false, contract: {tier: 1, pay: 300, region: 'freelands'}, ev39: {id: 'hedgeSprite', shape: 'B', out: false, ids: [], paid: false}};
    ok('B: never due as an arrival', !E.due(gb));
    const sv2 = {note: window.note, ra: window.revealAll}; let rev = 0;
    try {
      note = () => {}; revealAll = () => { rev++; };
      E.tick(gb); ok('B: the card pauses the field', gb.paused && gb.ev39.out && !!document.getElementById('ev39-card'));
      const Mb = {treasury: 500, hob39: null}, w0 = 2;
      ok('B: refusing costs nothing', E.choose('refuse', gb, Mb) === 'refuse' && !gb.paused && Mb.treasury === 500 && !Mb.hob39 && gb.contract.pay === 300 && rev === 0 && !document.getElementById('ev39-card'));
      ok('B: a second choice is ignored', E.choose('accept', gb, Mb) === null && rev === 0);
      { const st = document.createElement('div'); st.id = 'ev39-card'; document.body.appendChild(st); const G0 = gl('G');
        try { G = null; ok('B: a stale card is not held up', !E.cardUp()); } finally { G = G0; }
        E.clearCard(); ok('B: the card clears', !document.getElementById('ev39-card')); }
      const sb = E.settle(gb, 'victory', Mb); ok('B: the debrief line, no bonus', sb && !sb.bonus && Mb.treasury === 500 && sb.html.indexOf('thick') >= 0);
      const gs = {sec: 5, contract: {}, ev39: {id: 'hedgeSprite', shape: 'B', out: true, ids: []}};
      ok('B: the sprite shows a path', E.choose('accept', gs, Mb) === 'accept' && rev === 1);
      const gh2 = {sec: 5, contract: {region: 'freelands'}, ev39: {id: 'hob', shape: 'B', out: true, ids: []}};
      E.choose('accept', gh2, Mb); ok('B: the Hob queues a job', !!Mb.hob39);
      const job = E.hobJob(Mb); ok('B: the job is small, Hob-marked, no event', job && job.hob39 && !job.event && ['rescue', 'hold', 'relic'].includes(job.obj) && job.title === "The Hob's Small Job" && !Mb.hob39);
      // the other five
      ok('B: frost can bring a Raven-Seer or a Hearth-Wight', E.pick({obj: 'relic', region: 'frost'}, seq([0]), {}, 'B') === 'hearthWight' && E.pick({obj: 'ambush', region: 'frost'}, seq([0]), {}, 'B') === 'ravenSeer');
      const sq = [{state: 'up', p: {name: 'A'}}, {state: 'up', p: {name: 'B'}}];
      const gf = {sec: 5, contract: {pay: 200}, squad: sq, wagon: {hp: 100, maxHp: 100}, ev39: {id: 'fordHorse', shape: 'B', out: true, ids: []}};
      E.choose('accept', gf, Mb); ok('B: the Ford-Horse on an escort: the wagon +25%', gf.wagon.maxHp === 125 && gf.wagon.hp === 125 && gf.ev39.word);
      E.due39(gf, 'fled'); ok('B: a broken word: one mate goes into the water', sq.filter(m => m.state === 'bleeding').length === 1 && gf.ev39.broken);
      ok('B: the broken word on the debrief', E.settle(gf, 'fled', Mb).html.includes(C.fordHorse.broken));
      const gk = {sec: 5, contract: {pay: 200}, squad: [], ev39: {id: 'fordHorse', shape: 'B', out: true, ids: []}};
      E.choose('accept', gk, Mb); E.due39(gk, 'victory'); ok('B: the word kept: nobody taken', gk.ev39.broken === false);
      const ss0 = E.siteSpot; E.siteSpot = () => ({x: 400, y: 0});
      try {
        const gg = {sec: 5, leader: {x: 0, y: 0}, contract: {pay: 200}, ev39: {id: 'greenHound', shape: 'B', out: true, ids: []}};
        E.choose('accept', gg, Mb); gg.leader = {x: 400, y: 10}; for (let i = 0; i < K.houndHold; i++) E.tick(gg);
        const t0 = Mb.treasury, sg = E.settle(gg, 'fled', Mb);
        ok('B: the hound leads to the lost patrol: its purse, win or not', gg.ev39.found && sg.bonus === 20 && Mb.treasury === t0 + 20);
      } finally { E.siteSpot = ss0; }
      const gu = {sec: 5, contract: {pay: 200}, ev39: {id: 'greenHound', shape: 'B', out: true, ids: []}, leader: {x: 0, y: 0}};
      gu.ev39.choice = 'accept'; ok('B: followed but never reached: the missed line, no purse', E.settle(gu, 'victory', Mb).html.includes(C.greenHound.missed));
      const mw = {state: 'up', x: 0, y: 0}, ga = {sec: 5, squad: [mw], contract: {}, ev39: {id: 'antleredWarden', shape: 'B', out: true, ids: []}};
      E.choose('accept', ga, Mb); mw.state = 'bleeding'; E.tick(ga); const st1 = mw.state; mw.state = 'bleeding'; E.tick(ga);
      ok('B: the warden lifts the first mate down, once', st1 === 'up' && mw.state === 'bleeding');
      const gw2 = {sec: 5, contract: {pay: 300}, ev39: {id: 'hearthWight', shape: 'B', out: true, ids: []}};
      E.choose('accept', gw2, Mb); ok('B: the oath-stone sells for 10%', E.settle(gw2, 'fled', Mb).bonus === 30);
      const gr0 = {sec: 5, alarm: 0, contract: {}, ev39: {id: 'ravenSeer', shape: 'B', out: true, ids: []}};
      E.choose('refuse', gr0, Mb); ok('B: the raven let go: +1 alarm', gr0.alarm === 1);
      const se0 = window.spawnEnemy; let bird = null;
      try {
        spawnEnemy = (k, x, y) => (bird = {k, x, y, con: 1, maxCon: 1});
        const gr = {sec: 5, alarm: 0, leader: {x: 0, y: 0}, contract: {tier: 2}, ev39: {id: 'ravenSeer', shape: 'B', out: true, ids: []}};
        E.choose('accept', gr, Mb); ok('B: hunting the raven brings the bird', bird && bird.k === 'cinder' && bird.name === 'the Raven-Seer' && gr.ev39.ids[0] === bird);
        for (let i = 0; i < K.ravenFlee; i++) E.tick(gr); ok('B: not killed in time, it flies home: +1 alarm, the loss line', gr.ev39.lost && gr.alarm === 1 && E.settle(gr, 'victory', Mb).html.includes(C.ravenSeer.loss));
        const gr2 = {sec: 5, alarm: 0, leader: {x: 0, y: 0}, contract: {tier: 2}, ev39: {id: 'ravenSeer', shape: 'B', out: true, ids: []}};
        const M0 = gl('META'), bl0 = M0 && M0.blind39;
        E.choose('accept', gr2, Mb); bird.dead = true; E.tick(gr2);
        ok('B: the raven killed: the next march is blind', gr2.ev39.won && M0 && M0.blind39 === true);
        if (M0) M0.blind39 = bl0;
      } finally { spawnEnemy = se0; }
    } finally { note = sv2.note; revealAll = sv2.ra; const el = document.getElementById('ev39-card'); if (el) el.remove(); }
  } catch (e) { fails.push('threw: ' + e.message); }
  return fails.length ? {ok: false, info: 'EVT39 FAIL: ' + fails.join(', ')} : {ok: true, info: 'EVT39: roll by tier, fit, exclusions, repeat guard, scouted hint, arrival, scaling, win bonus; 7 shape A creatures; 5 shape C side objectives (site, guards, claim, 35% Matriarch); acts (boulders, keyword, carry-off, pull-under); shape B roll, card, free refusal, sprite path, Hob job, Ford-Horse word, the hound patrol, the warden roots, raven, oath-stone; kill switch'};
};
})();
