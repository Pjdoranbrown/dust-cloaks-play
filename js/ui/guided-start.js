/* js/ui/guided-start.js (INT-1 step 2, 2026-11-16): INDEX 42 to 48 (trophies, guided start, Leader card, livelier camp, to-do list).
   Cut unchanged from the inline script in index.html (old lines 16944 to 18196). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 42 - LEGENDARY ARTEFACTS ON THE TROPHY RACK
   Six legendary artefacts from the campaign can now come home as Curiosities.
     - On any Curiosity from Detailed Salvage there is a 1 in 5 chance
       (LEGEND_CHANCE) that it is a legend instead of an ordinary trophy.
     - Each legend drops once only. Once all six are home, Curiosities go back
       to the ordinary pool.
     - Legends sit on their own shelf at the foot of the Trophy Rack, each in a
       fixed slot with a faint outline until it is found. They never push the
       ordinary trophies off the rack.
     - Legends cannot be sold and a Witch cannot spend them. They are the
       Chapter's, for good.
   Saves: legends are ordinary entries in the existing trophy list, so every
   existing campaign carries over. Old builds ignore them safely.
   To roll back, delete from this comment to END INDEX 42 and undo the small
   patches marked "Index 42" in the Detailed Salvage and Trophy Rack code.
============================================================================ */
const LEGEND_CHANCE = 0.2;
const LEGENDS = [
  {id:'gaxx',     name:"Sethric Vael's Shattered Plague-Gem Shard",             lore:"Year 614 Ban'Ra"},
  {id:'grimgor',  name:"A Scorched Link from Gorrath Cinderhand's Locked Gauntlet", lore:'Year 603'},
  {id:'zenif',    name:'An Unlicensed "Silverglade" Illusion Prism',     lore:"Year 606, Zenif's infamous prank across the Free Lands"},
  {id:'marakyr',  name:'A Whittled Wooden Icon of Marakyr',              lore:'Book 1, Ch. 7: the icon Cayde whittled for Nef\u00fdr on the road'},
  {id:'artemis',  name:"Artemis's River-Lost Bastard Sword",             lore:'Year 606, lost wrestling a crocodile on the river ferry without ever being swung'},
  {id:'keltaras', name:"A Fragment of Keltaras's Obsidian Blade",        lore:'Year 602'}
];
const legendsHome = () => (META.trophies || []).filter(t => t.legend).map(t => t.legend);
function legendRoll(c){
  const have = legendsHome(), left = LEGENDS.filter(l => !have.includes(l.id));
  if (!left.length || Math.random() >= LEGEND_CHANCE) return null;
  const l = pickOf(left);
  return {kind:'legend', legend:l.id, name:l.name, from:l.lore, season:seasonName(), found:`${OBJECTIVES[c.obj] ? OBJECTIVES[c.obj].name : 'a contract'} at ${c.place || 'the field'}`};
}
function legendSprite(id){
  return simpleSprite('legend:' + id, 12, 13, P => {
    if (id === 'gaxx'){                                                      // a jagged shard of green gem, dark flecks of plague
      P(5, 1, 2, 1, '#b8f070'); P(4, 2, 4, 2, '#7ac83a'); P(3, 4, 6, 3, '#4f9a2a'); P(3, 7, 5, 2, '#3a7a22'); P(4, 9, 3, 1, '#2a5a1a'); P(5, 10, 1, 1, '#2a5a1a');
      P(5, 2, 1, 3, '#d8ffa0'); P(6, 5, 1, 3, '#1f3a10'); P(8, 5, 1, 2, '#4f9a2a'); P(2, 6, 1, 1, '#3a7a22'); P(4, 7, 1, 1, '#2a3a10'); P(7, 3, 1, 1, '#2a3a10');
    } else if (id === 'grimgor'){                                            // one link of a blackened chain, still glowing at the edges
      P(4, 1, 4, 1, '#3a3a42'); P(3, 2, 6, 1, '#4a4a54');
      for (let y = 3; y <= 8; y++){ P(2, y, 2, 1, '#4a4a54'); P(8, y, 2, 1, '#3a3a42'); }
      P(3, 9, 6, 1, '#3a3a42'); P(4, 10, 4, 1, '#2a2a30');
      P(3, 2, 2, 1, '#8a8a94'); P(2, 4, 1, 2, '#7a7a84'); P(3, 8, 1, 1, '#1a1410'); P(7, 2, 1, 1, '#1a1410');
      P(8, 4, 1, 1, '#e8742a'); P(9, 6, 1, 1, '#f0a040'); P(5, 10, 1, 1, '#c8501c'); P(8, 8, 1, 1, '#c8501c');
    } else if (id === 'zenif'){                                              // a glass prism splitting a ray of light
      const w = [[5,2],[5,2],[4,4],[4,4],[3,6],[3,6],[2,8],[2,8],[1,10],[1,10]];
      w.forEach(([x, n], i) => { const y = 1 + i, h = n >> 1; P(x, y, h, 1, '#dff0ff'); P(x + h, y, n - h, 1, '#9fc8f0'); });
      P(5, 1, 2, 1, '#ffffff'); P(5, 3, 1, 4, '#ffffff'); P(1, 11, 10, 1, '#6a8ab0');
      P(11, 6, 1, 1, '#ff6a6a'); P(11, 7, 1, 1, '#ffd860'); P(11, 8, 1, 1, '#6aff9a'); P(11, 9, 1, 1, '#6ad0ff'); P(0, 5, 2, 1, '#ffffff');
    } else if (id === 'marakyr'){                                            // a small carved wooden plaque with a figure in relief
      P(4, 1, 4, 1, C.wood); P(3, 2, 6, 1, C.wood); P(2, 3, 8, 8, C.wood); P(2, 3, 1, 8, C.woodD); P(9, 3, 1, 8, C.woodD); P(2, 11, 8, 1, C.woodD);
      P(5, 4, 2, 2, '#d8b070'); P(4, 6, 4, 3, '#d8b070'); P(4, 3, 4, 1, '#e8c890'); P(3, 8, 1, 2, C.woodD); P(8, 9, 1, 1, C.woodD); P(5, 9, 2, 1, '#b08848');
    } else if (id === 'artemis'){                                            // a bastard sword that has never been swung
      P(5, 1, 2, 1, '#ffffff'); P(5, 2, 2, 5, '#e6ecf0'); P(6, 2, 1, 5, C.steel); P(4, 7, 4, 1, C.steelL);
      P(2, 7, 8, 1, C.gold); P(2, 8, 1, 1, C.goldD); P(9, 8, 1, 1, C.goldD);
      P(5, 8, 2, 3, '#6a3e1c'); P(5, 9, 2, 1, '#8a5a2b'); P(5, 11, 2, 1, C.gold);
      P(5, 3, 1, 1, '#bfe0ff'); P(4, 5, 1, 1, '#3a7a4a'); P(7, 9, 1, 1, '#3a7a4a'); P(7, 10, 1, 1, '#3a7a4a');
    } else {                                                                 // an obsidian shard, black glass with a violet edge
      P(6, 1, 2, 2, '#2a2438'); P(4, 3, 5, 2, '#1a1626'); P(3, 5, 6, 3, '#14101e'); P(4, 8, 5, 2, '#1a1626'); P(5, 10, 3, 1, '#2a2438');
      P(5, 3, 1, 3, '#7a5ab0'); P(7, 2, 1, 1, '#a98ae0'); P(4, 7, 1, 1, '#5a3a8a'); P(8, 6, 2, 1, '#2a2438'); P(7, 8, 1, 1, '#7a5ab0');
    }
  });
}
// the panel: legends are listed first, with their lore, and cannot be sold or spent
trophyPanelHTML = function(){
  const T = META.trophies || [], witches = META.roster.filter(p => p.spec === 'WITCH' && p.magic < 5), have = legendsHome();
  const row = (t, i) => t.legend
    ? `<div class="line" style="border-left:3px solid var(--gold);padding-left:6px"><img src="${trophyURL(t)}"><div class="grow"><b>${esc(t.name)}</b><br><span style="font-size:14px">${esc(t.from)}</span><br><span style="font-size:14px;font-style:italic">Brought home from ${esc(t.found || 'the field')}, ${esc(t.season)}. Legendary: not for sale.</span></div></div>`
    : `<div class="line"><img src="${trophyURL(t)}"><div class="grow"><b>${esc(t.name)}</b><br><span style="font-size:14px">From ${esc(t.from)}, ${esc(t.season)}</span></div><div class="mini" style="flex-direction:column"><button onclick="sellTrophy(${i})">Sell, 150gp</button>${witches.map(w => `<button onclick="witchTrophy(${i},${w.id})">${esc(w.name)}: +1 Magic</button>`).join('')}</div></div>`;
  const idx = T.map((t, i) => [t, i]), legs = idx.filter(([t]) => t.legend), rest = idx.filter(([t]) => !t.legend);
  return `<h2>The Trophy Rack</h2><div class="desc" style="text-align:left">Curiosities brought home from Detailed Salvage. Each one sells for 150gp, or a Witch can spend one to raise her Magic by 1 without the usual harvest.</div>` +
    `<div class="desc" style="text-align:left;margin-top:6px"><b>Legends: ${have.length} of ${LEGENDS.length}.</b> One in five Curiosities is a legendary artefact until all ${LEGENDS.length} are home. They stay on the shelf at the foot of the rack.</div>` +
    legs.map(([t, i]) => row(t, i)).join('') +
    (rest.length ? rest.map(([t, i]) => row(t, i)).join('') : (legs.length ? '' : '<div class="desc">Empty. Roll a 9 or more on Detailed Salvage to bring something home.</div>')) +
    `<div class="desc" style="text-align:left;margin-top:6px">Salvage mode: <b>${salvageMode() === 'detailed' ? 'Detailed' : 'Quick'}</b>. <a href="#" onclick="META.salvageMode=salvageMode()==='detailed'?'quick':'detailed';saveMeta();renderPanel();return false">Switch</a></div>`;
};
{ const f = sellTrophy;  sellTrophy  = function(i){ const t = (META.trophies || [])[i]; if (t && t.legend) return; f(i); }; }
{ const f = witchTrophy; witchTrophy = function(i, id){ const t = (META.trophies || [])[i]; if (t && t.legend) return; f(i, id); }; }
// the legends shelf, drawn over the foot of the rack
{ const f = drawHoldingProp; drawHoldingProp = function(p){
    f(p);
    if (p.k !== 'trophies') return;
    const x = p.x, y = p.y, have = new Set(legendsHome());
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 67, y - 10, 134, 6); ctx.fillStyle = '#a07a44'; ctx.fillRect(x - 67, y - 10, 134, 2);
    LEGENDS.forEach((l, i) => {
      const ix = x - 52 + i * 21;
      if (!have.has(l.id)){ ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(ix - 5, y - 15, 10, 5); return; }
      const s = legendSprite(l.id), tw = 0.35 + 0.35 * Math.sin((CAMP.t || 0) / 22 + i * 1.7);
      ctx.fillStyle = `rgba(255,224,130,${tw * 0.35})`; ctx.beginPath(); ctx.ellipse(ix, y - 24, 15, 17, 0, 0, TAU); ctx.fill();
      blit(s, ix, y - 11, 2.2, false, s.width / 2, s.height);
      ctx.fillStyle = `rgba(255,244,190,${tw + 0.25})`; const sx = ix + 8, sy = y - 36 + (i % 2) * 4; ctx.fillRect(sx, sy - 2, 1, 5); ctx.fillRect(sx - 2, sy, 5, 1);
    });
  }; }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx42')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx42"><b>Legendary artefacts.</b> One Curiosity in five is a legend of the campaign: ${LEGENDS.map(l => esc(l.name)).join('; ')}. Each can be found once. They take their own shelf at the foot of the Trophy Rack and cannot be sold or spent.</p>`);
  };
}
/* ===== END INDEX 42 ======================================================= */

/* ============================================================================
   INDEX 43 - PORTRAITS FOR THE CAMP BARD AND THE CHAPTER SCRIBE
   Every one of the 16 races now has a painted Bard and a painted Scribe (the
   librarian), one man and one woman each: 64 portraits in all.
     - The portrait is picked by race, role and sex, so every existing Bard and
       Scribe picks theirs up the next time the game loads.
     - They go through the same custom-portrait path as the Portrait Studio, so
       they show everywhere a person's face is shown (panels, chronicle, frames).
     - A portrait you load yourself in the Portrait Studio always wins. Resetting
       it brings the built-in painting back.
     - The paintings are built into the game and are NOT written to the save,
       so saves stay the same size and carry over from Index 42.
   To roll back, delete from this comment to END INDEX 43. The Bard and Scribe
   go back to their robed painted portraits.
============================================================================ */
// NPC_PORT is loaded from assets/npc-portraits.js
const npcPortKey = p => (p && (p.bard || p.scribe) && p.race) ? p.race + '|' + (p.bard ? 'bard' : 'scribe') + '|' + (sexOf(p) === 'f' ? 'f' : 'm') : null;
const NPC_SEEN = {};   // built-in entries handed out so far, by the game's own portrait key (name|race)
{ const f = customOf;
  customOf = function(p){
    const e = f(p); if (e) return e;
    const k = npcPortKey(p); if (!k || !NPC_PORT[k]) return null;
    return NPC_SEEN[ckey(p)] = {d:NPC_PORT[k], v:'npc43'};
  };
}
// the game decodes a custom portrait by key from the save; built-in ones are not in the save, so decode those here
{ const f = portCustomDecode;
  portCustomDecode = function(k){
    if (META && META.customPortraits && META.customPortraits[k]) return f(k);
    const e = NPC_SEEN[k]; if (!e) return;
    const cur = PORT.cust[k]; if (cur && (cur.v === e.v || cur.pending === e.v)) return;
    PORT.cust[k] = {v:-1, pending:e.v};
    const im = new Image();
    im.onload = () => { try { const c = newCanvas(PORT_W, PORT_H), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, PORT_W, PORT_H); PORT.cust[k] = {v:e.v, cv:c};
      try { CAMP.dirty = true; refreshUI(); } catch (x) {}
      try { const ch = $('chronicle'); if (ch && ch.style.display !== 'none' && typeof chronicleRender === 'function') chronicleRender(); } catch (x) {} } catch (x) { delete PORT.cust[k]; } };
    im.onerror = () => { delete PORT.cust[k]; };
    im.src = e.d;
  };
}
// keep the Bard's and the Scribe's paintings decoded and ready, so they are there the moment a panel opens
setInterval(() => { try { if (typeof META !== 'undefined' && META) for (const p of [META.scribe, META.bard, META.master]) if (p) portCustomFig(p);   /* Index 44: and the Chapter Master */ } catch (e) {} }, 1000);
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx43')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx43"><b>Faces for the Bard and the Scribe.</b> Every race has its own painted Bard and Scribe, a man and a woman each. A portrait you load yourself in the Portrait Studio takes their place, and resetting it brings the painting back.</p>`);
  };
}
/* ===== END INDEX 43 ======================================================= */

/* ============================================================================
   INDEX 44 - CAYDE AND ZENIF: THE ONLY PREMADE CHAPTER MASTERS
   Cayde and Zenif now have their own painted portraits, and they are the only
   two ready-made Chapter Masters on the first founding screen. "Build your own"
   and "Surprise me" are still there beside them.
     - The portraits belong to the hero, not to the name, so they show wherever
       the Chapter Master's painted face is shown (the gold-framed portrait, the
       Chapter Master's panel, the Chronicle, and so on).
     - A portrait you load yourself in the Portrait Studio still wins, and
       resetting it brings the hero's painting back.
     - Krusk and Ana stay in the HEROES table, so any campaign that already
       founded with one of them keeps their line and lore. They are simply no
       longer offered at the start. To offer them again, put them back in
       HERO_ORDER.
     - Nothing new is saved, so every campaign carries over from Index 43.
   To roll back, delete from this comment to END INDEX 44 and undo the two small
   patches marked "Index 44".
============================================================================ */
// HERO_PORT is loaded from assets/hero-portraits.js
HERO_ORDER.length = 0; HERO_ORDER.push('cayde');   /* CLARKE-1: Cayde is the only founding chair */
{ const f = customOf;
  customOf = function(p){
    const e = f(p); if (e) return e;
    if (p && p.hero && HERO_PORT[p.hero]) return NPC_SEEN[ckey(p)] = {d:HERO_PORT[p.hero], v:'hero44'};
    return null;
  };
}
/* S6-C note 13 (Art Director, 2026-11-17): decode each hero's painted face at load, so the first card or bar portrait
   that shows a hero never gets the sheet face while the painting is still decoding. */
window.addEventListener('load', () => { try { for (const k of Object.keys(HERO_PORT)){ const H = HEROES[k];
  if (H) portCustomFig({id:'HERO-' + k, name:H.name, race:H.race, spec:H.spec, cls:H.cls, sex:H.sex, hero:k}); } } catch (e) {} });
// the two cards are bigger now there are only two, and show the whole painting
heroStepHTML = function(){
  const note = (typeof legNoteHTML === 'function') ? legNoteHTML() : '';   // the "old Chapter is in the Annals" note sits above the cards
  const heroes = HERO_ORDER.map(k => {
    const H = HEROES[k], img = HERO_PORT[k]
      ? `<img src="${HERO_PORT[k]}" style="height:230px;border:3px solid var(--gold);box-shadow:0 0 0 2px #5a4318,0 3px 10px rgba(0,0,0,.5);margin-bottom:6px">`
      : `<img src="${heroPortraitURL(k)}" style="height:170px;margin-bottom:4px">`;
    return `<div class="card" style="width:340px" onclick="heroPick('${k}')">
      ${img}
      <div class="ttl">${esc(H.full)}</div><div class="role">${esc(H.title)}</div>
      <div class="desc" style="font-size:14px;text-align:left"><b>${RACES[H.race].name} ${CLASSES[H.cls].name}, once a ${SPECS[H.spec].name}.</b></div>
      <div class="desc" style="font-size:14px;text-align:left"><i>${esc(H.lore)}</i></div>
      <div class="desc" style="font-size:14px;text-align:left"><b>Camp bonus:</b> ${cmGame(H.cls, {hero:k})}</div>
      <div class="fl">Patrons' circle: ${heroCircle(H)}.</div></div>`;
  }).join('');
  return note + `<div class="row">${heroes}
      <div style="display:flex;flex-direction:column;gap:10px;justify-content:center">
        <div class="card" style="width:262px" onclick="heroCustom()"><div class="ttl">Build your own</div>
          <div class="desc" style="font-size:14px">Choose the Race, Social Class, Specialty and Name yourself.</div></div>
        <div class="card" style="width:262px" onclick="heroSurprise()"><div class="ttl">Surprise me</div>
          <div class="desc" style="font-size:14px">Roll a stranger. You can still rename them before you go on.</div></div>
      </div></div>`;
};
/* ===== END INDEX 44 ======================================================= */

/* ============================================================================
   INDEX 45 - A GUIDED START, A LIVE LEADER CARD, AND ELEVATING A SUCCESSOR
   1. THE LEADER CARD. Making a Squad Leader now shows a live card beside the
      choices, in the same style as the Squad Leader Dashboard on the Roster
      screen. It fills in as you hover over a Specialty, Class or Race, and
      small green and red numbers show what each choice changes.
        - The order is now Specialty, Class, Race, opening ability, Name: what
          they do in a fight first, the 16 races last.
        - Races are grouped into tabs, and each race shows only how it differs
          from a Human, so a Human card has no chips at all.
        - A click selects, a double click (or CONTINUE) moves on.
        - Three ready-made Leaders and "Surprise me" for anyone who wants to
          start fast.
   2. THE GUIDED START. A brand new Chapter now begins with your Camp Bard, who
      walks you through five jobs: Squad Leader, who holds the chair, Holding,
      Ambition, Banner. Nothing is saved until the banner goes up. "Skip the
      guide" gives the old order. The prologue and moving house are unchanged.
   3. THE FOUNDER. Whoever you pick from the hero cards (Cayde) holds
      the chair for now. Once a Squad Mate with 2 or more Advancements, or an
      officer, is ready, the Chapter Master's panel offers to elevate them. The
      old hand steps down as a council Elder and leaves ELDER_GIFT gold. To
      elevate a former Squad Leader, hand command to an officer first.
   Saves: the Elder is stored as META.elder, and an elevated Chapter Master
   is an ordinary Chapter Master. Campaigns carry over from Index 44.
   To roll back, delete from this comment to END INDEX 45 and undo the small
   patch marked "Index 45" near the hero cards.
============================================================================ */
const ELDER_GIFT = 100, ELEVATE_ADV = 2;
const LV = {hov:null, grp:'ALL'};
let GUIDE = null;
const GUIDE_STAGES = ['Squad Leader', 'The chair', 'Holding', 'Ambition', 'Banner'];
const RACE_GROUPS = [['ALL', 'All'], ['HUMAN', 'Human'], ['ELVES', 'Elves'], ['GREENSKINS', 'Greenskins'], ['SHORTFOLK', 'Shortfolk'], ['MUDDLED', 'Mixed blood'], ['OUTSIDER', 'Outsiders']];
const STARTERS = [
  {id:'shield', name:'The Shield', race:'DWARF', cls:'FREEMAN', spec:'SOLDIER'},
  {id:'bow',    name:'The Bow',    race:'HUMAN', cls:'OUTCAST', spec:'FOLK_HERO'},
  {id:'medic',  name:'The Medic',  race:'HUMAN', cls:'DEVOUT',  spec:'CLERIC'}
];
const guideLines = () => {
  const B = ensureBard();
  return {
    intro:   `I'm ${esc(B.name)}. Every company needs someone to sing about it, and I was the only one who put a hand up. Five short jobs, in any order you can manage, and you can go back at any point.`, /* Index 85 */
    spec:    `First, your Squad Leader, the one who marches. Choose how they fight. Not sure? Click Surprise me.`,
    cls:     `Now, who were they before the company? Each Social Class gives a bonus, and some carry a catch.`,
    race:    `Now their people. The chips compare each with a Human: green is better, red is worse. A Human is a safe pick.`,
    pick:    `One more choice: a talent, always on. They earn more as they level up.`,
    name:    `Every legend starts with a name. Take the one I've suggested or write your own. Then we'll sort out who sits in the chair.`,
    hero:    `Now, who sits in the Chapter Master's chair? The Chapter Master runs the camp and does the haggling at the War Council, but never marches. Cayde will hold the chair for now. When one of your own is ready, you can elevate them, and he steps down to sit on the council as an Elder. Or build your own, or roll a stranger.`,
    custom:  `Build your Chapter Master here: their people, class, specialty and name. They hold the chair for good.`,
    holding: `Where do we hang the banner? Every holding can build everything. This one decides how the camp looks.`,
    charter: `What's this Chapter for? Pick one aim, and every contract, perk and milestone pulls the same way.`,
    banner:  `Last job: the banner. Pick the colours and a charge. Raise it and the road is open.`
  };
};
const bardSays = line => { const B = ensureBard(); return `<div class="gbard"><img src="${framedURL(B, false, {})}"><div><div class="gname">${esc(B.name)}, the Chapter's bard</div><div class="speech">${line}</div></div></div>`; };
const guideBarHTML = stage => `<div class="gprog">${GUIDE_STAGES.map((n, i) => `<span class="${i + 1 < stage ? 'done' : i + 1 === stage ? 'cur' : ''}">${i + 1}. ${n}</span>`).join('')}</div>`;
document.head.appendChild(Object.assign(document.createElement('style'), {textContent: `
  #ldr-wrap{display:flex;gap:16px;align-items:flex-start;width:100%;margin-top:8px}
  #ldr-left{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center}
  #ldr-live{width:350px;flex:none;position:sticky;top:6px}
  @media (max-width:980px){#ldr-wrap{flex-direction:column;align-items:stretch}#ldr-live{width:100%;position:static}}
  .ldr-card{background:#f3ead8;border:2px solid #6a4428;border-radius:4px;padding:10px 12px;box-shadow:0 4px 10px rgba(0,0,0,.25);color:var(--ink);text-align:left}
  .ldr-head{display:flex;gap:10px;align-items:center;border-bottom:3px double #6a4428;padding-bottom:6px;margin-bottom:4px}
  .ldr-head img,.ldr-q{height:84px;width:84px;flex:none} .ldr-q{border:3px double #8a6a3a;display:flex;align-items:center;justify-content:center;font:bold 40px Georgia;color:#b8a888}
  .ldr-head b{font:bold 17px Georgia;color:var(--blood);display:block} .ldr-head i.q{color:#9a8a70}
  .ldr-card .dbt2{font:bold 14px Georgia;letter-spacing:1.5px;color:var(--blood);margin:6px 0 1px}
  .ldr-card .how{font-size:14px;margin:3px 0;line-height:1.3} .ldr-card .how b{color:var(--ink-soft)}
  .ldr-card details{font-size:14px;margin-top:6px} .ldr-card summary{cursor:pointer;font-weight:bold;color:var(--blood)}
  .ldr-card details p{margin:3px 0}
  .dl-up,.dl-dn{font:bold 14px Georgia;margin-left:4px;text-decoration:none} .dl-up{color:#226b2a} .dl-dn{color:#8b0000}
  .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;justify-content:center} .chips u{text-decoration:none;font:bold 14px Georgia;padding:1px 6px;border-radius:9px;border:1px solid}
  .chips .dl-up{background:#e4f2e0;border-color:#6fa37a;margin:0} .chips .dl-dn{background:#f6e0dc;border-color:#c98a80;margin:0}
  .ldr-tabs{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:2px 0 8px} .ldr-tabs button{font-size:14px}
  .ldr-crumbs{font-size:14px;color:#6a5a44;margin:2px 0 4px} .ldr-crumbs a{color:#226b2a;cursor:pointer;text-decoration:underline} .ldr-crumbs b{color:var(--ink)}
  .ldr-badge{font:bold 14px Georgia;background:#226b2a;color:#fff;border-radius:8px;padding:1px 7px;margin-left:5px;vertical-align:middle}
  .gprog{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:6px 0;font:14px Georgia} .gprog span{padding:2px 9px;border:1px solid #8a6a3a;border-radius:10px;color:#6a5a44;background:rgba(255,255,255,.35)}
  .gprog .cur{background:var(--blood);color:#f5efe3;border-color:var(--blood);font-weight:bold} .gprog .done{background:#e4f2e0;border-color:#228b22;color:#226b2a}
  .gbard{display:flex;gap:12px;align-items:flex-start;max-width:900px;margin:6px auto 8px;text-align:left} .gbard img{height:96px;flex:none;border:3px double var(--ink-soft)}
  .gbard .gname{font:bold 14px Georgia;color:var(--blood);margin-bottom:3px} .gbard .speech{margin:0 0 0 10px;font-size:14.5px}
`}));

/* ---- the live Leader card ------------------------------------------------ */
function ldrStats(race, cls, spec){ try { return leaderStats({race, cls, spec, level:1, injuries:[], burnt:0, picks:[]}); } catch (e) { return null; } }
/* B2 (sign-off, 2026-11-16): one ability name for the Leader on the ready-made cards, the sign screen and the
   Leader sheet: the ability the Leader uses in the field (ABILITIES[spec]) on the Leader's own key (ABIL33: E).
   Words: CAMPAIGN_LINES.b2 (the Planner's file). */
function leaderAbility(spec){ const A = ABILITIES[spec] || {}; return {key: window.ABIL33 ? 'E' : (A.key || ''), ability: A.name || ''}; }
function b2Line(k, spec, o){
  const W = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.b2) || {card: 'Opens with {ability}.', sign: '{name} opens with {ability}.', sheet: 'Ability [{key}] {ability}'};
  const v = Object.assign(leaderAbility(spec), o || {});
  return String(W[k] || '').replace(/\{(\w+)\}/g, (m, n) => v[n] != null ? esc(String(v[n])) : m);
}
function ldrLiveHTML(){
  const hv = LV.hov || {};
  const spec = hv.spec || CR.spec || null, cls = hv.cls || CR.cls || null, race = hv.race || CR.race || null;
  const eff = {race:race || 'HUMAN', cls:cls || 'FREEMAN'}, S = spec ? ldrStats(eff.race, eff.cls, spec) : null;
  const refK = CR.step === 'race' ? 'race' : CR.step === 'cls' ? 'cls' : null;
  const Rf = (S && refK) ? ldrStats(refK === 'race' ? 'HUMAN' : eff.race, refK === 'cls' ? 'FREEMAN' : eff.cls, spec) : null;
  const d = k => (S && Rf && S[k] !== Rf[k]) ? `<u class="${S[k] > Rf[k] ? 'dl-up' : 'dl-dn'}">${S[k] > Rf[k] ? '+' : ''}${S[k] - Rf[k]}</u>` : '';
  const q = t => `<i class="q">${t}</i>`, caster = spec && SPECS[spec].caster;
  const sex = CR.sex || 'm', portrait = spec ? `<img src="${previewBustURL(eff.race, sex, spec, eff.cls)}">` : '<div class="ldr-q">?</div>';
  const dice = (n, off) => [0, 1, 2, 3, 4, 5, 6].map(k => `<i class="dsd ${!off && S && k === n ? 'cur' : ''}" style="${dieStyle(k)}">${k}</i>`).join('');
  const bxs = (n, max, c) => `<span class="bxs">${boxes(S ? n : 0, max, c)}</span>`;
  const tip = t => `data-tip="${t}"`;
  const assumed = spec && (!cls || !race) ? `<div class="dsnote" data-k="as" style="font-size:14px;color:#9a8a70;margin-top:3px">Numbers use a ${!race ? 'Human' : ''}${!race && !cls ? ' ' : ''}${!cls ? 'Freeman' : ''} until you choose.</div>` : '';
  const how = spec ? `<div class="how" data-k="spec">${SPECS[spec].role ? `<b>${SPECS[spec].role}.</b> ` : ''}${SPECS[spec].attack}</div><div class="how" data-k="spec"><b>${b2Line('sheet', spec)}:</b> ${ABILITIES[spec].text}</div>` : '';
  const hc = cls ? `<div class="how" data-k="cls"><b>${CLASSES[cls].name}:</b> ${CLASSES[cls].perk} <i>Catch: ${CLASSES[cls].draw}</i></div>` : '';
  const hr = race ? `<div class="how" data-k="race"><b>${RACES[race].name}:</b> ${RACES[race].tag}</div>` : '';
  const cmp = refK && S && Rf && ['con', 'maxWounds', 'luck', 'move', 'melee', 'ranged', 'magic', 'per'].some(k => S[k] !== Rf[k]) ? `<div class="dsnote" style="font-size:14px;color:#6a5a44;margin-top:2px">Green and red numbers: compared with a ${refK === 'race' ? 'Human' : 'Freeman'}.</div>` : '';
  const ready = CR.step === 'spec' ? !!CR.spec : CR.step === 'cls' ? !!CR.cls : CR.step === 'race' ? !!CR.race : CR.step === 'pick' ? !!CR.pick : true;
  return `<div class="ldr-card"><div class="ldr-head">${portrait}<div><b>Squad Leader</b><span style="font-size:14px;font-style:italic">${race ? RACES[race].name : q('Race?')} ${cls ? CLASSES[cls].name : q('Class?')} ${spec ? SPECS[spec].name : q('Specialty?')}</span></div></div>
    <div class="dsrow"><b ${tip('How much punishment the Leader can take. Bigger is sturdier.')}>CONDITION</b>${bxs(S ? S.con : 0, 12)}${d('con')}</div>
    <div class="dsrow"><b ${tip('Wounds: the Leader\'s reserve of hits. Bigger is sturdier.')}>WOUNDS</b>${bxs(S ? S.maxWounds : 0, 12)}${d('maxWounds')}</div>
    <div class="dsrow"><b ${tip('Spend 1 for +1 to every die for 4 seconds (Q), or burn it for good for a Natural Maximum on every die for 6 seconds (R).')}>LUCK</b>${bxs(S ? S.luck : 0, 6, 'rnd')}${d('luck')}</div>
    <div class="dsrow"><b ${tip('How fast the Leader walks. Squad Mates walk at their own racial Move.')}>MOVE</b>${S ? `<span class="lvhex sm">${S.move}</span>` : q('?')}${d('move')}</div>
    <div class="dbt2">SKILL DICE</div>
    <div class="dsrow"><b ${tip('Close combat. A Skill n die rolls faces n to n+5, so higher is better.')}>MELEE</b><span>${dice(S ? clampSkill(S.melee) : -1)}</span>${d('melee')}</div>
    <div class="dsrow"><b ${tip('Bows and thrown weapons. A Skill n die rolls faces n to n+5.')}>RANGED</b><span>${dice(S ? clampSkill(S.ranged) : -1)}</span>${d('ranged')}</div>
    <div class="dsrow" style="${spec && !caster ? 'opacity:.4' : ''}"><b ${tip('Only casters use Magic.')}>MAGIC</b><span>${dice(S ? clampSkill(S.magic) : -1, !caster)}</span>${caster ? d('magic') : ''}</div>
    <div class="dsrow"><b ${tip('Used in Parley: your Personality die against a commander\'s Morale die.')}>PERSONALITY</b><span>${dice(S ? clampSkill(S.per) : -1)}</span>${d('per')}</div>
    ${assumed}${cmp}${how}${hc}${hr}
    <details><summary>What do these mean?</summary>
      <p><b>Condition and Wounds:</b> how much punishment the Leader can take. Bigger is sturdier.</p>
      <p><b>Luck:</b> press Q in a fight to spend 1 for +1 to every die for 4 seconds. R burns 1 for good: every die a Natural Maximum for 6 seconds.</p>
      <p><b>Move:</b> how fast they walk. Squad Mates walk at their own racial Move, so a Dwarf falls behind an Elf.</p>
      <p><b>Skill dice:</b> a die of Skill n rolls faces n to n+5. Higher is better.</p>
      <p><b>Personality:</b> used in Parley, against a commander's Morale.</p></details>
    <div style="text-align:center;margin-top:8px"><button class="btn gold" ${ready ? '' : 'disabled'} onclick="ldrNext()">${ldrNextLabel()}</button></div></div>`;
}
// the Founding's ability choices: with the built progression every Specialty's Level 1 Leader gets one pick from PROG.leaderOpts
// (one rule for all six, so a Scoundrel no longer reaches the roster owing 'Pick 1 trait': checklist N 4)
const ldrPickOpts = spec => { try { return PROG.room(1) > 0 ? PROG.leaderOpts({spec, level:1, picks:[], injuries:[]}) : []; } catch (e) { return []; } };
const ldrSteps = () => ['spec', 'cls', 'race'].concat((CR.spec && ldrPickOpts(CR.spec).length) ? ['pick'] : [], ['name']);
function ldrNextLabel(){
  const st = CR.step;
  if (st === 'name') return GUIDE && GUIDE.on ? 'CONTINUE: WHO SITS IN THE CHAIR' : 'SIGN CONTRACT';
  const nx = ldrSteps()[ldrSteps().indexOf(st) + 1];
  return 'CONTINUE: ' + ({cls:'CHOOSE A CLASS', race:'CHOOSE A RACE', pick:'PICK A TALENT', name:'NAME THEM'}[nx] || 'NEXT');
}
function ldrHov(kind, key){ LV.hov = kind ? {[kind]:key} : null; const el = $('ldr-live'); if (el) el.innerHTML = ldrLiveHTML(); }
function ldrSel(kind, key){ CR[kind] = key; LV.hov = null; if (kind === 'spec' && CR.pick && !ldrPickOpts(key).some(c => c.id === CR.pick)) delete CR.pick; renderCreate(); }
function ldrGo(step){ if (ldrSteps().includes(step)){ CR.step = step; LV.hov = null; renderCreate(); } }
function ldrNext(){
  const st = CR.step; if (!CR[st] && st !== 'name') return;
  if (st === 'name') return ldrFinish();
  CR.step = ldrSteps()[ldrSteps().indexOf(st) + 1] || 'name'; LV.hov = null; renderCreate();
  if (CR.step === 'name'){ const el = $('cr-name'); if (el) el.focus(); }
}
function ldrBack(){
  const i = ldrSteps().indexOf(CR.step);
  if (i > 0){ CR.step = ldrSteps()[i - 1]; LV.hov = null; return renderCreate(); }
  if (GUIDE && GUIDE.on) return guideIntro();
  if (inStory() && !META.leader) return openStoryIntro();   /* PL-4.1: prologue renderTitle re-opens create; Cancel goes back to the intro */
  renderTitle();
}
function ldrStarter(i){ const s = STARTERS[i]; if (!s) return; Object.assign(CR, {race:s.race, cls:s.cls, spec:s.spec}); delete CR.pick; CR.name = ''; CR.step = ldrSteps().includes('pick') ? 'pick' : 'name'; LV.hov = null; renderCreate(); }
function ldrSurprise(){ const race = rollRace(), cls = CLASS_ORDER[d6() - 1], spec = SPEC_ORDER[d6() - 1]; Object.assign(CR, {race, cls, spec}); delete CR.pick; CR.name = ''; CR.step = ldrSteps().includes('pick') ? 'pick' : 'name'; LV.hov = null; renderCreate(); }
function ldrSex(x){
  const el = $('cr-name'), typed = el && el.value;
  CR.name = (!typed || FEMALE_NAMES.has(typed) || Object.values(NAMES).some(g => g.m.includes(typed))) ? randomName(CR.race, x) : typed;
  CR.sex = x; renderCreate();
}
function ldrGrp(g){ LV.grp = g; renderCreate(); }
function ldrFinish(){
  const el = $('cr-name'); CR.name = ((el && el.value) || '').trim() || randomName(CR.race, CR.sex);
  if (GUIDE && GUIDE.on) return guideLeaderDone();
  finishCreate();
}
function raceChips(k){
  const r = RACES[k], H = RACES.HUMAN, caster = CR.spec && SPECS[CR.spec].caster, c = [];
  const add = (lab, v) => { if (v) c.push(`<u class="${v > 0 ? 'dl-up' : 'dl-dn'}">${lab} ${v > 0 ? '+' : ''}${v}</u>`); };
  add('Con', r.con - H.con); add('Move', r.move - H.move);
  add('Melee', (r.m + (r.adapt ? 1 : 0)) - (H.m + 1)); add('Ranged', (r.r + (r.adapt ? 1 : 0)) - (H.r + 1));
  if (caster) add('Magic', r.mg - H.mg);
  add('Luck', r.luck - H.luck); add('Per', r.per - H.per);
  return c.length ? c.join('') : '<u class="dl-up">No strengths or weaknesses</u>';
}
function renderCreate(){
  const h = $('create-inner'); if (!h || !CR) return;
  const guided = !!(GUIDE && GUIDE.on), st = CR.step, L = guided ? guideLines() : null;
  if (!CR.sex) CR.sex = Math.random() < .5 ? 'f' : 'm';
  let body = '', title = '';
  const hov = (k, v) => `onmouseenter="ldrHov('${k}','${v}')" onmouseleave="ldrHov()" onclick="ldrSel('${k}','${v}')" ondblclick="ldrSel('${k}','${v}');ldrNext()"`;
  if (st === 'spec'){
    title = 'Choose a Specialty';
    const quick = STARTERS.map((q, n) => `<button class="qpill" onmouseenter="LV.hov={spec:'${q.spec}',cls:'${q.cls}',race:'${q.race}'};ldrHovRaw()" onmouseleave="ldrHov()" onclick="ldrStarter(${n})">${q.name}</button>`).join('');
    body = `<div class="qbar"><span>Quick start</span>${quick}<button class="qpill dice" onclick="ldrSurprise()" data-tip="A random race, class and specialty. You can still rename them.">Surprise me</button></div>
      <div class="row">${SPEC_ORDER.map(k => { const s = SPECS[k]; return `<div class="card scard ${CR.spec === k ? 'sel' : ''}" ${hov('spec', k)}>
        ${img(portraitURL({race:CR.race || 'HUMAN', spec:k, name:'preview', id:9}, true))}<div class="ttl" style="color:${s.color}">${s.name}</div><div class="role">${s.role}</div><div class="desc">${s.attack.split('. ')[0].replace(/\.$/, '')}.</div></div>`; }).join('')}</div>`;
  } else if (st === 'cls'){
    title = 'Choose a Social Class';
    body = `<div class="row">${CLASS_ORDER.map(k => { const c = CLASSES[k]; return `<div class="card ${CR.cls === k ? 'sel' : ''}" style="width:225px" ${hov('cls', k)}><div class="ttl">${c.name}</div><div class="desc">${c.perk}</div><div class="fl">The catch: ${c.draw}</div></div>`; }).join('')}</div>`;
  } else if (st === 'race'){
    title = 'Choose a Race';
    const list = Object.entries(RACES).filter(([, r]) => LV.grp === 'ALL' || r.grp === LV.grp);
    body = `<div class="ldr-tabs">${RACE_GROUPS.map(([g, n]) => `<button class="btn small ${LV.grp === g ? 'gold' : ''}" onclick="ldrGrp('${g}')">${n}</button>`).join('')}</div>
      <div class="sub" style="font-size:14px;margin:0 0 6px">The chips show how each people compares with a Human.</div>
      <div class="row">${list.map(([k, r]) => `<div class="card ${CR.race === k ? 'sel' : ''}" style="width:160px;padding:10px" ${hov('race', k)}>${img(raceIconURL(k))}<div class="ttl">${r.name}</div><div class="desc" style="font-size:14px">${r.tag}</div><div class="chips">${raceChips(k)}</div></div>`).join('')}</div>`;
  } else if (st === 'pick'){
    title = 'Pick 1 Talent';
    body = `<div class="row">${ldrPickOpts(CR.spec).map(c => `<div class="card ${CR.pick === c.id ? 'sel' : ''}" style="width:225px" onclick="CR.pick='${c.id}';renderCreate()" ondblclick="CR.pick='${c.id}';ldrNext()">${img(badgeURL(c.glyph, SPECS[c.spec].color), 'ic sm')}<div class="tag">${c.tag}</div><div class="ttl">${c.name}</div><div class="desc">${c.text(1)}</div><div class="fl">Starts every contract at rank 1.</div></div>`).join('')}</div>`;
  } else {
    title = 'Sign the Charter';
    if (!CR.name) CR.name = randomName(CR.race, CR.sex);
    body = `<div style="display:flex;flex-direction:column;align-items:center">
      ${img(portraitURL({race:CR.race, spec:CR.spec, name:'preview' + CR.sex, sex:CR.sex, id:9}, true))}
      <div style="display:flex;gap:8px;margin:6px"><button class="btn small ${CR.sex === 'f' ? 'gold' : ''}" onclick="ldrSex('f')">WOMAN</button><button class="btn small ${CR.sex === 'm' ? 'gold' : ''}" onclick="ldrSex('m')">MAN</button></div>
      <div style="display:flex;gap:10px;margin:10px"><input class="name" id="cr-name" value="${esc(CR.name)}" oninput="CR.name=this.value"><button class="btn small" onclick="CR.name=randomName(CR.race, CR.sex);renderCreate()">Randomise</button></div></div>`;
  }
  const steps = ldrSteps(), names = {spec:'Specialty', cls:'Class', race:'Race', pick:'Talent', name:'Name'}   /* B2a: the pick is a passive talent; the ability is named on the card */;
  const val = k => k === 'spec' && CR.spec ? SPECS[CR.spec].name : k === 'cls' && CR.cls ? CLASSES[CR.cls].name : k === 'race' && CR.race ? RACES[CR.race].name : k === 'pick' && CR.pick ? (CARDS.find(c => c.id === CR.pick) || {}).name : '';
  const crumbs = `<div class="ldr-crumbs">${steps.map((k, i) => k === st ? `<b>${names[k]}</b>` : (i < steps.indexOf(st) || (k !== 'name' && CR[k])) ? `<a onclick="ldrGo('${k}')">${names[k]}${val(k) ? ': ' + esc(val(k)) : ''}</a>` : names[k]).join(' \u203a ')}</div>`;
  const first = steps.indexOf(st) === 0;
  h.innerHTML = `<h1 style="font-size:40px">${title}</h1>${guided ? guideBarHTML(1) + bardSays(L[st]) : ''}${crumbs}
    <div id="ldr-wrap"><div id="ldr-left">${body}<div style="margin-top:10px"><button class="btn small" onclick="ldrBack()">${first && !guided ? 'CANCEL' : 'BACK'}</button></div></div><div id="ldr-live">${ldrLiveHTML()}</div></div>
    ${(st === 'spec' && !guided && !inStoryNow()) ? `<div class="sub" style="margin-top:8px">Or bring in a Leader exported from another campaign (${IMPORT_COST.leaderBase}gp plus ${IMPORT_COST.perLevel}gp per Level above 1): <button class="btn small" onclick="importPerson()">IMPORT A LEADER</button>${IMPORT_MSG ? `<br><b>${IMPORT_MSG}</b>` : ''}</div>` : ''}`;
}
function ldrHovRaw(){ const el = $('ldr-live'); if (el) el.innerHTML = ldrLiveHTML(); }
openCreate = function(){ CR = {step:'spec', sex:Math.random() < .5 ? 'f' : 'm'}; LV.hov = null; renderCreate(); show('screen-create'); };

/* ---- the guided start ----------------------------------------------------- */
const _openFound = openFound;
openFound = function(){
  if (META.leader || founded() || (typeof inStoryNow === 'function' && inStoryNow())) return _openFound();
  guideStart();
};
function guideWarm(cb){
  const B = ensureBard(); let n = 0;
  const go = () => { try { portCustomFig(B); const c = PORT.cust[ckey(B)], e = customOf(B); if ((c && e && c.v === e.v) || ++n > 24) return cb(); } catch (x) { return cb(); } setTimeout(go, 50); };
  go();
}
function guideStart(){ GUIDE = {on:true, leader:null}; FD = null; CR = null; LV.hov = null; guideWarm(guideIntro); }
function guideIntro(){
  GUIDE = GUIDE || {on:true, leader:null}; FD = null; CR = null;
  const L = guideLines(), B = ensureBard();
  $('create-inner').innerHTML = `<h1 style="font-size:40px">Found the Chapter</h1>${bardSays(L.intro)}
    <div class="log" style="max-width:640px;margin:6px auto;text-align:left"><p><b>The five jobs</b></p><p>1. Your Squad Leader: who marches with the squad.<br>2. Who sits in the Chapter Master's chair.<br>3. Where the Chapter makes its home.<br>4. What the Chapter is for: its Charter Ambition.<br>5. The banner.</p></div>
    <button class="btn gold" onclick="guideBegin()">BEGIN</button>
    <div style="margin-top:8px"><button class="btn small" onclick="GUIDE=null;showSplash()">CANCEL</button> <button class="btn small" onclick="GUIDE=null;_openFound()">SKIP THE GUIDE</button></div>`;
  show('screen-create');
}
function guideBegin(){ GUIDE.on = true; CR = {step:'spec', sex:Math.random() < .5 ? 'f' : 'm'}; LV.hov = null; renderCreate(); show('screen-create'); }
function guideLeaderDone(){
  const p = {race:CR.race, cls:CR.cls, spec:CR.spec, sex:CR.sex, name:CR.name, pick:CR.pick};
  GUIDE.leader = p;
  FD = {step:'hero', hero:null, sex:Math.random() < .5 ? 'f' : 'm', race:null, cls:null, spec:null, name:'', holding:'fort', guided:true};
  renderFound(); show('screen-create');
}
function guideBackToLeader(){ FD = null; CR = CR || {sex:'m'}; CR.step = 'name'; renderCreate(); show('screen-create'); }
{ const f = renderFound;
  renderFound = function(){ f(); if (FD && FD.guided) guideDecorate(); };
}
function guideDecorate(){
  const h = $('create-inner'); if (!h || !FD) return;
  const L = guideLines(), step = FD.step;
  const subs = [...h.children].filter(e => e.classList && e.classList.contains('sub'));
  if (subs[0] && /Founding the Chapter/.test(subs[0].textContent)) subs[0].remove();
  const h1 = h.querySelector('h1');
  if (step === 'hero'){ h1.textContent = 'Who Sits in the Chair?'; const s2 = [...h.children].find(e => e.classList && e.classList.contains('sub')); if (s2) s2.remove(); }
  const stage = step === 'holding' ? 3 : step === 'charter' ? 4 : step === 'banner' ? 5 : 2;
  const key = step === 'hero' ? 'hero' : (step === 'holding' || step === 'charter' || step === 'banner') ? step : 'custom';
  h1.insertAdjacentHTML('afterend', guideBarHTML(stage) + bardSays(L[key]));
  const back = h.lastElementChild && h.lastElementChild.querySelector('button');
  if (step === 'hero' && back){ back.textContent = 'BACK'; back.setAttribute('onclick', 'guideBackToLeader()'); }
  for (const b of h.querySelectorAll('button')) if (/finishFound\(\)/.test(b.getAttribute('onclick') || '')) b.textContent = 'RAISE THE BANNER AND BEGIN';
}
// when the banner goes up, the Leader is made and the Chapter is open
{ const f = finishFound;
  finishFound = function(){
    if (!(FD && FD.guided && GUIDE && GUIDE.leader)) return f();
    const D = GUIDE.leader, oc = openCreate;
    openCreate = function(){};                         // the old ending would open the Leader screen
    try { f(); } finally { openCreate = oc; }
    const L = makeLeader(D.race, D.cls, D.spec, D.name); L.sex = D.sex; if (D.pick) L.picks.push(D.pick);
    META.leader = L; META.board = null; GUIDE = null; CR = null;
    saveMeta(); SFX.play('horn');
    renderTitle(); centreCamOn(HUB.house.x, HUB.house.y); openPanel('house', 'house');
  };
}
{ const f = showSplash; showSplash = function(){ if (GUIDE && !(FD && FD.guided)) GUIDE = null; f(); }; }

/* ---- the Founder steps down: elevating a successor ------------------------ */
let elevCandidates = () => {
  const M = META.master, out = [];
  if (!M || !M.hero) return out;
  for (const p of META.roster) if (p.adv >= ELEVATE_ADV && !busy(p)) out.push({kind:'mate', p, note:p.adv + ' Advancements'});
  for (const o of officers()) if (!(o.resting > 0)) out.push({kind:'officer', p:o, note:'officer, Level ' + o.level});
  return out;
};
function elevateTo(kind, id){
  const M = META.master; if (!M || !M.hero) return;
  const list = kind === 'officer' ? officers() : META.roster, i = list.findIndex(x => String(x.id) === String(id)), p = list[i]; if (!p) return;
  const H = HEROES[M.hero];
  if (!gate(`Elevate ${p.name} to Chapter Master? ${H.name} steps down as Elder. This is permanent, ${p.name} will no longer march, and the camp bonus becomes: ${CM_BONUS[p.cls].game}`, () => elevateTo(kind, id))) return;
  list.splice(i, 1); try { unbond(p); } catch (e) {}
  META.elder = {hero:M.hero, name:H.name, full:H.full, title:H.title, at:META.deployments || 0};
  META.master = {id:'CM', name:p.name, race:p.race, cls:p.cls, spec:p.spec, sex:sexOf(p), chosen:true, elevated:true};
  if (p.deity) META.master.deity = p.deity;
  META.treasury += ELDER_GIFT;
  try { chron(); chronAdd('elevate', {name:p.name, race:p.race, cls:p.cls, elder:H.full, gift:ELDER_GIFT}, true); } catch (e) {}
  SFX.play('horn'); saveMeta(); try { CAMP.dirty = true; closePanel(); } catch (e) {} refreshUI();
}
const elevateHTML = () => {
  const c = elevCandidates();
  const rows = c.map(x => `<button style="display:block;width:100%;margin:2px 0;font-size:14px;text-align:left" onclick="elevateTo('${x.kind}','${x.p.id}')">${esc(x.p.name)}: ${RACES[x.p.race].name} ${CLASSES[x.p.cls].name} ${SPECS[x.p.spec].name} (${x.note}). Camp bonus: ${CM_BONUS[x.p.cls].game}</button>`).join('');
  return `<details style="text-align:left;margin:6px 0"><summary style="cursor:pointer;font-weight:bold;color:var(--blood)">Elevate a successor</summary>
    <div class="desc" style="text-align:left;font-size:14px">${esc(META.master.name)} holds the chair until one of your own is ready. Pick a Squad Mate with ${ELEVATE_ADV} or more Advancements, or an officer. They stop marching, ${esc(META.master.name)} steps down as a council Elder and leaves ${ELDER_GIFT}gp in the strongbox. It is permanent. To elevate a former Squad Leader, hand command to an officer first.</div>
    ${rows || '<div class="desc" style="font-size:14px"><i>Nobody is ready yet.</i></div>'}</details>`;
};
let elderHTML = () => { const E = META.elder; if (!E) return ''; return `<div class="desc" style="text-align:left;margin:6px 0;display:flex;gap:8px;align-items:center">${HERO_PORT[E.hero] ? `<img src="${HERO_PORT[E.hero]}" style="height:54px;border:2px solid var(--gold)">` : ''}<span><b>Council Elder: ${esc(E.full)}, ${esc(E.title)}.</b> ${esc(E.name)} gave up the chair and sits at the council fire.</span></div>`; };
{ const f = heroLine;
  heroLine = function(p){
    let h = f(p);
    if (p && p.id === 'CM' && p.hero && HEROES[p.hero]) h += elevateHTML();
    else if (p && p.id === 'CM' && META.elder) h += elderHTML();
    return h;
  };
}
{ const f = chronText;
  chronText = function(e){
    if (e.k === 'elevate'){ const B = s => `<b>${esc(s)}</b>`; return `${B(e.elder)} steps down as Chapter Master and ${B(e.name)}, ${RACES[e.race] ? RACES[e.race].name : ''} ${CLASSES[e.cls] ? CLASSES[e.cls].name : ''}, takes the chair. ${esc(e.elder)} stays on as a council Elder and leaves ${e.gift}gp in the strongbox.`; }
    return f(e);
  };
}
// the hero cards say what happens next
{ const f = heroStepHTML;
  heroStepHTML = function(){ return f() + `<div class="sub" style="font-size:14px;margin-top:8px;text-align:center">Cayde holds the chair until you elevate one of your own. Then he steps down and stays on as a council Elder.</div>`; };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx45')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx45"><b>Founding, and the chair.</b> A new Chapter starts with your Camp Bard, who walks you through the Squad Leader, the Chapter Master's chair, the holding, the Ambition and the banner. When you make a Squad Leader, the card on the right shows what each choice changes. Cayde holds the chair until you elevate a Squad Mate with ${ELEVATE_ADV} or more Advancements, or an officer, from the Chapter Master's panel. He steps down as a council Elder and leaves ${ELDER_GIFT}gp.</p>`);
  };
}
/* ===== END INDEX 45 ======================================================= */

/* ============================================================================
   INDEX 46 - CAYDE AND ZENIF TURN AWAY, AND TWO CALMER CHOICE SCREENS
   1. Cayde's portrait is mirrored so he looks left and Zenif looks right. On the
      chair screen they now face away from each other: not seeing eye to eye.
   2. THE CHAIR SCREEN. One row of two big cards. Click one to read their story,
      then press TAKE THE CHAIR (or double click). "Build your own" and "Roll a
      stranger" are now two quiet text links under the cards, not cards.
   3. THE SPECIALTY SCREEN. The three ready-made leaders and "Surprise me" are one
      slim "Quick start" bar. The six specialty cards are shorter, because the
      Leader card on the right already shows the detail for whatever you hover.
   4. The "bring in a Leader from another campaign" link shows on the first
      Squad Leader step only. It had also appeared on the Race step.
   Saves: nothing new is saved, so campaigns carry over from Index 45.
   To roll back, delete from this comment to END INDEX 46 and undo the small
   patches marked "Index 46".
============================================================================ */
document.head.appendChild(Object.assign(document.createElement('style'), {textContent: `
  .hrow{display:flex;gap:26px;justify-content:center;flex-wrap:wrap;margin:10px 0 6px;width:100%}
  .hcard{width:260px;background:rgba(245,235,215,.55);border:2px solid #6a5a44;border-radius:4px;padding:12px 10px 10px;cursor:pointer;text-align:center;
    transition:transform .12s,border-color .12s,box-shadow .12s,background .12s;outline:none}
  .hcard:hover,.hcard:focus-visible{transform:translateY(-3px);border-color:#b8963a;background:rgba(245,235,215,.9)}
  .hcard img{height:210px;border:3px solid #b8963a;box-shadow:0 0 0 2px #5a4318,0 3px 10px rgba(0,0,0,.45);display:block;margin:0 auto 10px}
  .hcard.sel{border-color:#226b2a;border-width:3px;background:#e4f2e0;box-shadow:0 0 0 3px #6fa37a,0 8px 16px rgba(0,0,0,.3);transform:translateY(-3px)}
  .hcard .hn{font:bold 21px Georgia;color:var(--ink)} .hcard .ht{font:italic 14px Georgia;color:var(--blood);margin:1px 0 6px}
  .hcard .hr{font:14px Georgia;color:var(--ink-soft)}
  .hdetail{width:100%;max-width:640px;box-sizing:border-box;min-height:96px;margin:8px auto 4px;padding:10px 16px;background:rgba(255,250,235,.75);border:1px solid #8a6a3a;border-radius:4px;text-align:left;font-size:14px;line-height:1.4}
  .hdetail.empty{display:flex;align-items:center;justify-content:center;color:#8a7a5e;font-style:italic;background:transparent;border:1px dashed #b8a888}
  .hdetail p{margin:3px 0} .hdetail .hl{font-style:italic;color:#3a3226} .hdetail .hb b{color:var(--blood)}
  .hgo{margin:6px 0 2px;width:100%;text-align:center} .hmore{margin-top:10px;font-size:14px;color:#6a5a44;text-align:center;width:100%}
  .hmore a{color:#226b2a;cursor:pointer;text-decoration:underline;margin:0 4px} .hmore a:hover{color:var(--blood)}
  .qbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin:0 0 10px;font-size:14px;color:#6a5a44}
  .qbar > span{font:bold 14px Georgia;letter-spacing:1.5px;text-transform:uppercase;margin-right:4px}
  .qpill{font:14px Georgia;padding:4px 12px;border:1px solid #8a6a3a;border-radius:14px;background:rgba(255,255,255,.5);color:var(--ink);cursor:pointer}
  .qpill:hover{background:#fff6dc;border-color:#b8963a} .qpill.dice{border-style:dashed}
  .scard{width:196px !important;padding:10px !important} .scard .desc{font-size:14px}
`}));
function heroSel(k){ if (!FD || !HEROES[k]) return; FD.hsel = k; renderFound(); }
heroStepHTML = function(){
  const note = (typeof legNoteHTML === 'function') ? legNoteHTML() : '';   // the "old Chapter is in the Annals" note stays above the cards
  const sel = FD && FD.hsel && HEROES[FD.hsel] ? FD.hsel : null;
  const cards = HERO_ORDER.map(k => { const H = HEROES[k];
    return `<div class="hcard ${sel === k ? 'sel' : ''}" tabindex="0" role="button" aria-pressed="${sel === k}" onclick="heroSel('${k}')" ondblclick="heroPick('${k}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();heroSel('${k}')}">
      <img src="${HERO_PORT[k] || heroPortraitURL(k)}"><div class="hn">${esc(H.full)}</div><div class="ht">${esc(H.title)}</div>
      <div class="hr">${RACES[H.race].name} ${CLASSES[H.cls].name}, once a ${SPECS[H.spec].name}</div></div>`; }).join('');
  const H = sel ? HEROES[sel] : null;
  const detail = H ? `<div class="hdetail"><p class="hl">${esc(H.lore)}</p><p class="hb"><b>Camp bonus:</b> ${cmGame(H.cls, {hero:sel})}</p><p class="hb"><b>Patrons' circle:</b> ${heroCircle(H)}.</p></div>`
                   : `<div class="hdetail empty">Pick Cayde to read his story.</div>`;
  return note + `<div class="hrow">${cards}</div>${detail}
    <div class="hgo"><button class="btn gold" ${H ? '' : 'disabled'} onclick="heroPick('${sel || ''}')">${H ? 'TAKE THE CHAIR: ' + esc(H.name).toUpperCase() : 'TAKE THE CHAIR'}</button></div>
    <div class="hmore">Cayde holds the chair until you elevate one of your own.<br>Rather not? <a onclick="heroCustom()">Build your own</a> or <a onclick="heroSurprise()">roll a stranger</a>.</div>`;
};
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx46')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx46"><b>Choosing quickly.</b> On the Specialty step, the Quick start bar offers three ready-made Leaders and a random one. On the Chapter Master step, click Cayde to read his story, then give him the chair, or build your own or roll a stranger from the links underneath.</p>`);
  };
}
/* ===== END INDEX 46 ======================================================= */

/* ============================================================================
   INDEX 47 - A LIVELIER CAMP
   1. WALK THE LEADER. In the camp, WASD or the arrow keys walk your Squad
      Leader (hold Shift to run) and the view follows him. Dragging the map no
      longer pans it. Before you have a Leader, WASD and dragging still pan.
      He walks round buildings, the wagon and the fire, not through them, and
      the others get out of his way.
   2. PEOPLE HAVE ELBOW ROOM. Squad Mates, the Chapter Master and the Leader no
      longer stack up. They keep a small gap, and anyone who stops walking is
      nudged clear, so each one can be clicked.
   3. THE BARD SITS ON THE FIRE LOGS. He no longer brings his own log: he sits on
      the front log by the fire, in every holding.
   4. QUIETER NOTES. The bard's music notes are smaller, thinner, see-through
      and fewer. The bar-fight bard's notes got the same treatment.
   Saves: nothing new is saved, so campaigns carry over from Index 46.
   To roll back, delete from this comment to END INDEX 47 and undo the small
   patches marked "Index 47".
============================================================================ */
const LEAD_WALK = 2.5, LEAD_RUN = 4.2;
function leaderCtrl(){
  try {
    if (G || !CAMP.on || !META || !META.leader || (typeof inStoryNow === 'function' && inStoryNow())) return false;
    if (!$('screen-title').classList.contains('hidden') || campOverlayOpen()) return false;
    const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
    return CAMP.people.some(q => q.kind === 'leader');
  } catch (e) { return false; }
}
// the ground he cannot walk on: the base of each building, the wagon, the fire
function leaderBlocked(x, y){
  for (const o of campObjects()){
    if (o.kind === 'plot') continue;
    const r = objRect(o), x0 = o.kind === 'wagon' ? o.x - 46 : r.x + r.w * 0.1, x1 = o.kind === 'wagon' ? o.x + 46 : r.x + r.w * 0.9;
    if (x > x0 && x < x1 && y > o.y - 40 && y < o.y + 2) return true;
  }
  const dx = (x - HUB.fire.x) / 28, dy = (y - (HUB.fire.y + 10)) / 16;
  return dx * dx + dy * dy < 1;
}
function moveLeader(q){
  const kx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), ky = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  q.moving = !!(kx || ky);
  if (!q.moving) return;
  const n = Math.hypot(kx, ky), sp = keys.shift ? LEAD_RUN : LEAD_WALK, vx = kx / n * sp, vy = ky / n * sp;
  let nx = Math.max(30, Math.min(CAMP_W - 30, q.x + vx)), ny = Math.max(70, Math.min(CAMP_H - 30, q.y + vy));
  if (!leaderBlocked(nx, q.y)) q.x = nx;
  if (!leaderBlocked(q.x, ny)) q.y = ny;
  if (kx) q.left = kx < 0;
  q.tx = q.x; q.ty = q.y;
  CAMP.cam.x += (q.x - VW / 2 - CAMP.cam.x) * 0.14; CAMP.cam.y += (q.y - VH / 2 - camDY() - CAMP.cam.y) * 0.14;
  clampCam();
}
// nobody stands on anybody
function separatePeople(Lq){
  const P = CAMP.people, R = 17;
  const pinned = q => q === Lq || q.kind === 'bard' || (q.role && q.role !== 'wander' && !q.moving);
  for (const q of P) q.pushed = false;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++){
    const a = P[i], b = P[j], pa = pinned(a), pb = pinned(b); if (pa && pb) continue;
    let dx = b.x - a.x, dy = (b.y - a.y) * 1.5, d = Math.hypot(dx, dy);
    if (d >= R) continue;
    if (d < 0.01){ dx = (i % 2 ? 1 : -1); dy = 0.3; d = Math.hypot(dx, dy); }
    const push = (R - d) * 0.4, mx = dx / d * push, my = dy / d * push / 1.5;
    if (!pa && !pb){ a.x -= mx / 2; a.y -= my / 2; b.x += mx / 2; b.y += my / 2; a.pushed = b.pushed = true; }
    else if (pa){ b.x += mx; b.y += my; b.pushed = true; }
    else { a.x -= mx; a.y -= my; a.pushed = true; }
  }
  for (const q of P){
    if (!q.pushed || pinned(q)) continue;
    if (Math.hypot(q.tx - q.x, q.ty - q.y) < 30){ q.tx = q.x; q.ty = q.y; }   // close enough: they have arrived, just not on the same spot
  }
}
{ const f = personRole; personRole = q => { if (q.kind === 'bard') q.left = false; return (q.kind === 'leader' && CAMP.ctrl) ? 'player' : f(q); }; }   // the bard always faces the fire
{ const f = updatePeople;
  updatePeople = function(){
    const Lq = CAMP.people.find(q => q.kind === 'leader'), on = !!(Lq && leaderCtrl());
    CAMP.ctrl = on;
    if (on){ Lq.tx = Lq.x; Lq.ty = Lq.y; Lq.wait = 120; }
    f();
    if (on) moveLeader(Lq);
    separatePeople(on ? Lq : null);
  };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx47')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx47"><b>Walking the camp.</b> WASD or the arrow keys walk your Squad Leader round the camp (Shift to run) and the view follows. Click a person or building to talk or build. The Bard sits on a log by the fire.</p>`);
  };
}
/* ===== END INDEX 47 ======================================================= */

/* ============================================================================
   INDEX 48 - THE DEFINITE TO-DO LIST
   RAIDS     The raid map is condensed (48 x 40 cells, was 70 x 60). With a
             Palisade, its four gaps are real gates with health: raiders must
             break one to get in. Built facilities stand inside the walls with
             health bars, and raiders who get in go for them. Damage turns into
             a repair bill (capped at RAID_REPAIR_CAP x Tier gp per raid). A
             damaged facility's bonus is off until it is repaired from its panel.
             PARLAY: once per raid, from the raid warning. Your Leader's
             Personality die against the raiders' Morale die. Win: they walk
             away. Tie: they go for a small bribe. Lose: they want a big bribe,
             or you fight. "Let them loot it" is still there.
   FIELD     Fog of war now covers the main view, not just the minimap, so a
             bigger window or zooming out shows nothing new. Ground you have
             explored stays visible; ground out of sight is dimmed.
             KENNELS (new facility): two dogs go out on every contract, sniff
             out hidden traps, Blip Tokens, sleeping enemy camps and caches,
             and lift the fog round them. An enemy that reaches a dog sends it
             running off the map, safe and sound.
             DARRYL: a 1 in 20 chance on Hollow, greenskin and Frost-Vault
             contracts. A friendly skeleton in an Akubra hat stands guard;
             walk up to him and he marks the nearest trap and cache.
   CAMP      Tents, Huts and Bunks are one building with three tiers: upgrade
             it from its panel. The camp chatter has lines by race, class and
             the region of the last contract. The Ruined Waystation is the
             fourth holding. Wanderers walk round buildings, not through them.
   PEOPLE    Squad Mates keep their own kill count, shown on their card, kept
             on promotion, in exports and on their grave. Nine races get the
             passive their tag promises. The council Elder rolls an extra die in
             the War Council. A Squad Leader of Level 3+ can be elevated to the
             chair directly. The Bard also guides the prologue and moving
             house. The "Build your own" Chapter Master screens get a live card.
   POLISH    Legend finds go in the Chronicle. Race chips show the change to the
             final numbers. On narrow screens the Leader card sits at the top.
   Saves: old saves are allowed to break from here on.
============================================================================ */
const RAID_REPAIR_CAP = 90, RAID_BRIBE_SMALL = 40, RAID_BRIBE_BIG = 100, GATE_HP = 60;
const RAID_SPARE = ['tents', 'huts', 'bunks', 'palisade', 'watchtower', 'trapyard'];   // never placed in a raid, never damaged

/* ---------------------------------------------------------------- KILLS --- */
function creditKill(e){
  const u = e.lastBy, p = u && u.p;
  if (p && p !== META.leader && META.roster.includes(p)) p.kills = (p.kills || 0) + 1;
  else if (META.leader) META.leader.kills = (META.leader.kills || 0) + 1;
}
{ const f = chronText;
  chronText = function(e){
    if (e.k === 'legend') return `<b>A legend comes home:</b> ${esc(e.name)}. ${esc(e.lore || '')}. It goes on the legends shelf of the Trophy Rack.`;
    const t = f(e);
    return (e.k === 'death' && e.kills) ? t + ` ${e.kills} slain in the Chapter's service.` : t;
  };
}

/* ------------------------------------------------------- RACIAL PASSIVES --- */
const raceUp = r => !!G && ((G.leader && !G.leader.down && G.leader.p && G.leader.p.race === r) || (G.squad || []).some(m => m.state === 'up' && m.p && m.p.race === r));
const leadRace = r => !!(META && META.leader && META.leader.race === r);
canBrace = function(){ return G.stagger <= 0 || raceUp('DWARF'); };
{ const f = parlayMods; parlayMods = function(e){ const out = f(e); if (leadRace('GREY_ELF')) out.push('+1 Grey Elf mediator'); return out; }; }
{ const f = spendLuck;
  spendLuck = function(){
    const free = leadRace('HALFLING') && !G.freeLuck && G.luck >= 1 && !(G.nudge > 0);
    f(); if (free && G.nudge > 0){ G.luck++; G.freeLuck = true; pop(G.leader.x, G.leader.y - 46, 'PASTORAL LUCK: FREE', '#8fd39a'); }
  };
}
{ const f = killEnemy;
  killEnemy = function(e){
    const was = e.dead; f(e); if (was || !G || !G.leader) return;
    const L = G.leader, boss = BESTIARY[e.k] && BESTIARY[e.k].boss;
    if (boss && leadRace('HALF_ORC') && L.con < L.maxCon){ L.con = Math.min(L.maxCon, L.con + 2); pop(L.x, L.y - 46, 'BLOODIED GRIT +2', '#8fd39a'); }
    if (leadRace('CAMBION') && G.kills % 15 === 0 && L.con < L.maxCon){ L.con++; pop(L.x, L.y - 46, 'BLOODLUST +1', '#d47a6a'); }
  };
}

/* ------------------------------------------------------------- KENNELS --- */
FACILITIES.push({id:'kennels', cat:'Military', name:'Kennels', cost:160, x:92, baseName:'Kennels',
  desc:'Two hounds go out on every contract. They sniff out hidden traps, Blip Tokens, sleeping enemy camps and caches, and clear the fog round them. If an enemy reaches a hound, it runs off home.'});
PLOTS.kennels = [1470, 1070]; BASE_PLOTS.kennels = [1470, 1070];
FAC_LOOK.kennels = {type:'house', wall:'log', roof:'#6a5236', glyph:'boot'};
if (FAC_SKIN_NAMES.barge) FAC_SKIN_NAMES.barge.kennels = 'Hound Pen';
if (FAC_SKIN_NAMES.warehouse) FAC_SKIN_NAMES.warehouse.kennels = 'Dog Yard';
function houndSprite(){
  return simpleSprite('hound48', 16, 10, P => {
    const b = '#8a6a44', d = '#5a4228', l = '#b8946a';
    P(3, 3, 9, 4, b); P(3, 3, 9, 1, l); P(11, 1, 4, 4, b); P(14, 3, 2, 2, d); P(11, 0, 2, 2, d); P(1, 2, 2, 2, b); P(0, 1, 1, 2, b);
    P(3, 7, 2, 3, d); P(6, 7, 1, 3, d); P(9, 7, 2, 3, d); P(11, 7, 1, 3, d); P(12, 2, 1, 1, '#1a1410');
  });
}
const DOG_SKIP = ['brawl', 'drill', 'defend', 'siege', 'night', 'sortie'];
function dogTargets(){
  const out = [];
  for (const t of (G.traps || [])) if (t.enemy && t.armed && !t.seen) out.push({o:t, kind:'trap'});
  for (const b of (G.blips || [])) if (!b.revealed && !b.known) out.push({o:b, kind:'blip'});
  for (const e of G.enemies) if (!e.dead && e.dormant && !e.seen) out.push({o:e, kind:'camp'});
  for (const c of (G.caches || [])) if (!c.opened && !c.small && !c.sniffed && !seenXY(c.x, c.y)) out.push({o:c, kind:'cache'});
  return out;
}
function setupDogs(){
  G.dogs = [];
  if (!has('kennels') || DOG_SKIP.includes(G.obj) || inStoryNow()) return;
  for (let i = 0; i < 2; i++) G.dogs.push({x:G.leader.x + (i ? 18 : -18), y:G.leader.y + 14, tgt:null, state:'hunt', left:false, t:i * 7, fled:false});
  note('The hounds are off, noses down.');
}
function updateDogs(){
  if (!G.dogs || !G.dogs.length) return;
  const L = G.leader;
  for (const d of G.dogs){
    if (d.state === 'gone') continue;
    d.t++;
    if (d.state === 'flee'){ const a = Math.atan2(d.y - d.fy, d.x - d.fx); d.x += Math.cos(a) * 5; d.y += Math.sin(a) * 5; d.left = Math.cos(a) < 0;
      if (!inMap(Math.floor(d.x / CELL), Math.floor(d.y / CELL)) || d.t > 240) d.state = 'gone'; continue; }
    const foe = G.enemies.find(e => !e.dead && !e.dormant && dist(e, d) < 30);
    if (foe){ d.state = 'flee'; d.fx = foe.x; d.fy = foe.y; d.t = 0; pop(d.x, d.y - 16, 'YELP! THE HOUND RUNS HOME', '#c8b890'); continue; }
    if (!d.tgt || d.tgt.done || d.t % 120 === 0){
      const list = dogTargets().filter(x => !G.dogs.some(o => o !== d && o.tgt && o.tgt.o === x.o));
      let best = null, bd = 1e9; for (const x of list){ const dd = dist(x.o, d); if (dd < bd){ bd = dd; best = x; } }
      d.tgt = best;
    }
    let tx = L.x + (d === G.dogs[0] ? -26 : 26), ty = L.y + 18;
    if (d.tgt){ tx = d.tgt.o.x; ty = d.tgt.o.y; }
    const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy), sp = d.tgt ? 2.9 : Math.min(3.2, Math.max(0, dd - 10) * 0.08);
    if (dd > 2){ const nx = d.x + dx / dd * sp, ny = d.y + dy / dd * sp; if (!blockedXY(nx, ny)){ d.x = nx; d.y = ny; } else { d.x += dy / dd * sp; d.y -= dx / dd * sp; } d.left = dx < 0; }
    if (d.t % 10 === 0) revealAround(d.x, d.y, 3);
    if (d.tgt && dd < 34){
      const x = d.tgt, o = x.o;
      if (x.kind === 'trap') o.seen = true;
      if (x.kind === 'blip') o.known = o.known || d6();
      if (x.kind === 'camp') for (const e of G.enemies) if (!e.dead && e.group === o.group) e.seen = true;
      if (x.kind === 'cache'){ o.sniffed = true; revealAround(o.x, o.y, 3); }
      o.seen = o.seen || x.kind !== 'cache';
      pop(o.x, o.y - 24, {trap:'HOUND: A TRAP', blip:'HOUND: SNIFFED OUT', camp:'HOUND: ENEMY CAMP', cache:'HOUND: A CACHE'}[x.kind], '#ffd860');
      SFX.play('pick'); x.done = true; d.tgt = null;
    }
  }
}
function drawDogs(bodies, onScreen){
  for (const d of (G.dogs || [])) if (d.state !== 'gone' && onScreen(d)) bodies.push({y:d.y, custom:() => {
    figPlaceholder(d.x, d.y + 3, 2.4, {h:9, w:5, horse:true, shadowW:3.8}); /* S6-C note 10: non-pixel stand-in */
  }});
}

/* -------------------------------------------------------------- DARRYL --- */
const DARRYL_HOSTS = ['hollow', 'greenskins', 'deserters'];
function setupDarryl(){
  G.darryl = null;
  if (DOG_SKIP.includes(G.obj) || inStoryNow() || !G.contract || !DARRYL_HOSTS.includes(G.contract.host) || Math.random() >= 0.05) return;
  const spots = (G.caches || []).filter(c => !c.small && dist(c, G.leader) > 500);
  const at = spots.length ? pickOf(spots) : null; if (!at) return;
  for (let i = 0; i < 20; i++){ const x = at.x + rnd(-70, 70), y = at.y + rnd(30, 70); if (!blockedXY(x, y)){ G.darryl = {x, y, met:false, wave:0}; return; } }
}
function updateDarryl(){
  const D = G.darryl; if (!D) return;
  if (D.wave > 0) D.wave--;
  if (D.met || dist(D, G.leader) > 110) return;
  D.met = true; D.wave = 240;
  const tr = (G.traps || []).filter(t => t.enemy && t.armed && !t.seen).sort((a, b) => dist(a, D) - dist(b, D))[0];
  const ca = (G.caches || []).filter(c => !c.opened && !c.small).sort((a, b) => dist(a, D) - dist(b, D))[0];
  if (tr) tr.seen = true; if (ca){ ca.sniffed = true; revealAround(ca.x, ca.y, 4); }
  pop(D.x, D.y - 60, "G'DAY. MIND THE TRAP.", '#f0e6d2');
  note(`Darryl the skeleton tips his hat and waves you past.${tr ? ' He points out a trap.' : ''}${ca ? ' He nods at a cache.' : ''}`);
  SFX.play('pick');
}
function drawDarryl(bodies, onScreen){
  const D = G.darryl; if (!D || !onScreen(D)) return;
  bodies.push({y:D.y, custom:() => {
    const spr = enemySprite('levy'), s = 2.4, wave = D.wave > 0 && (D.wave / 12 | 0) % 2;
    drawSprite(spr, D.x, D.y, s, 0, true, false);
    const hx = D.x - 2, hy = D.y - spr.ay * s + 4;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(hx - 15, hy + 4, 30, 4); ctx.fillStyle = '#7a5a34'; ctx.fillRect(hx - 8, hy - 4, 16, 9);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(hx - 8, hy + 2, 16, 2);
    if (wave){ ctx.fillStyle = '#e8e0cc'; ctx.fillRect(D.x + 12, D.y - 34, 4, 10); }
    ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('DARRYL (1 HP)', D.x, D.y + 26);
  }});
}

/* ---------------------------------------------------------- FIELD HOOKS --- */
{ const f = setupContract; setupContract = function(c){ const r = f(c); try { setupDogs(); setupDarryl(); } catch (e) {} return r; }; }
{ const f = updateContract;
  updateContract = function(){
    const prev = G._shPrev === undefined ? (G.shaken || 0) : G._shPrev;
    if ((G.shaken || 0) > prev + 1 && G.shaken < 99999 && raceUp('HOBGOBLIN')) G.shaken = Math.ceil(prev + (G.shaken - prev) / 2);   // Iron Discipline
    const r = f();
    try { if (G.obj === OBJ_DEFEND) updateRaidDefences(); else { updateDogs(); updateDarryl(); } } catch (e) {}
    G._shPrev = G.shaken || 0;
    return r;
  };
}
{ const f = contractBodies; contractBodies = function(b, o){ f(b, o); try { if (G.obj !== OBJ_DEFEND){ drawDogs(b, o); drawDarryl(b, o); } } catch (e) {} }; }
{ const f = startDeployment; startDeployment = function(c, ids){ if (c && c.region && META) META.lastRegion = c.region; return f(c, ids); }; }

/* ---------------------------------------------------------- FOG OF WAR --- */

/* ------------------------------------------------------------------ RAIDS --- */
const isDamaged = id => !!(META && META.damaged && META.damaged[id]);
function raidRing(){ const cx = MAP.w >> 1, cy = MAP.h >> 1; return {x:(cx + .5) * CELL, y:(cy + .5) * CELL, rx:13 * 1.25 * CELL, ry:13 * CELL}; }
const insideRing = (o, k = 1) => { const R = raidRing(), dx = (o.x - R.x) / (R.rx * k), dy = (o.y - R.y) / (R.ry * k); return dx * dx + dy * dy < 1; };
function setupRaidDefences(){
  G.gates = []; G.facs = [];
  const R = raidRing();
  if (has('palisade')) for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5])
    G.gates.push({x:R.x + Math.cos(a) * R.rx, y:R.y + Math.sin(a) * R.ry, nx:Math.cos(a), ny:Math.sin(a), hp:GATE_HP + 20 * G.contract.tier, maxHp:GATE_HP + 20 * G.contract.tier, r:30, ac:6, shift:2, objHp:true, gate:true, flash:0});
  const built = FACILITIES.filter(f => META.facilities[f.id] && !RAID_SPARE.includes(f.id)).sort((a, b) => facCost(b) - facCost(a)).slice(0, 8);
  built.forEach((f, i) => {
    const a = (i + 0.5) / Math.max(1, built.length) * TAU + 0.35;
    let x = R.x + Math.cos(a) * R.rx * 0.6, y = R.y + Math.sin(a) * R.ry * 0.6;
    for (let k = 0; k < 12 && blockedXY(x, y); k++){ x += rnd(-30, 30); y += rnd(-30, 30); }
    const hp = 30 + Math.round(facCost(f) / 10);
    G.facs.push({id:f.id, x, y, hp, maxHp:hp, r:28, ac:6, shift:2, objHp:true, fac:true, flash:0});
  });
}
{ const f = setupRaid; setupRaid = function(c){ f(c); setupRaidDefences(); }; }
function updateRaidDefences(){
  for (const t of (G.gates || []).concat(G.facs || [])) if (t.flash > 0) t.flash--;
  for (const g of (G.gates || [])){
    if (g.hp <= 0){ if (!g.broken){ g.broken = true; pop(g.x, g.y - 40, 'THE GATE IS DOWN', '#ff6a5a'); note('A gate is down. The raiders are inside the walls.'); SFX.play('down'); G.shake = 14; } continue; }
    for (const e of G.enemies){
      if (e.dead) continue;
      const dx = e.x - g.x, dy = e.y - g.y; if (dx * dx + dy * dy > 58 * 58) continue;
      const along = dx * g.nx + dy * g.ny;
      if (along < 34){ const side = dx * -g.ny + dy * g.nx; e.x = g.x + g.nx * 34 + -g.ny * side; e.y = g.y + g.ny * 34 + g.nx * side; }
    }
  }
}
{ const f = raidTarget;
  raidTarget = function(e){
    const gates = (G.gates || []).filter(g => g.hp > 0);
    if (gates.length && !insideRing(e, 0.92)){
      let best = null, bd = 1e9; for (const g of gates){ const d = dist(e, g); if (d < bd){ bd = d; best = g; } }
      const ally = G.allies.find(a => a.state === 'up' && dist(e, a) < 120); if (ally) return ally;
      return best;
    }
    const facs = (G.facs || []).filter(t => t.hp > 0);
    if (facs.length && e.seed % 2 === 0){ let best = null, bd = 260; for (const t of facs){ const d = dist(e, t); if (d < bd){ bd = d; best = t; } } if (best) return best; }
    return f(e);
  };
}
{ const f = shotHitsObjective;
  shotHitsObjective = function(s){
    if (G && G.obj === OBJ_DEFEND) for (const t of (G.gates || []).concat(G.facs || [])) if (s.at === t && t.hp > 0 && Math.hypot(t.x - s.x, t.y - s.y) < 44){ damageObjective(t, Math.max(1, damageRoll(s.dmg || 2, t.shift) - 1)); return true; }
    return f(s);
  };
}
{ const f = raidBodies;
  raidBodies = function(bodies, onScreen){
    f(bodies, onScreen);
    const bar = (t, w, col) => { ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(t.x - w / 2 - 1, t.y - 52, w + 2, 7); ctx.fillStyle = t.hp > t.maxHp * 0.35 ? col : '#e0503a'; ctx.fillRect(t.x - w / 2, t.y - 51, w * Math.max(0, t.hp / t.maxHp), 5); };
    for (const g of (G.gates || [])) if (onScreen(g, 80)) bodies.push({y:g.y + 10, custom:() => {
      if (g.hp <= 0){ ctx.fillStyle = '#5a3a1a'; for (let i = 0; i < 6; i++) ctx.fillRect(g.x - 30 + i * 11, g.y + (i % 2) * 6, 9, 4); return; }
      ctx.save(); if (g.flash > 0) ctx.filter = 'brightness(1.7)';
      const vert = Math.abs(g.nx) > 0.5;
      ctx.fillStyle = '#6a4a28'; if (vert) ctx.fillRect(g.x - 9, g.y - 44, 18, 72); else ctx.fillRect(g.x - 40, g.y - 24, 80, 30);
      ctx.fillStyle = '#4a3020'; if (vert){ for (let y = -40; y < 26; y += 10) ctx.fillRect(g.x - 9, g.y + y, 18, 2); } else { for (let x = -38; x < 40; x += 10) ctx.fillRect(g.x + x, g.y - 24, 2, 30); }
      ctx.fillStyle = '#9a9aa0'; if (vert) ctx.fillRect(g.x - 9, g.y - 6, 18, 4); else ctx.fillRect(g.x - 4, g.y - 24, 4, 30);
      ctx.restore(); bar(g, 60, '#d4af37');
      ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('GATE', g.x, g.y - 56);
    }});
    for (const t of (G.facs || [])) if (onScreen(t, 80)) bodies.push({y:t.y + 8, custom:() => {
      const img = facilityCanvas(t.id), s = 2.1, w = img.width * s, h = img.height * s;
      ctx.save(); if (t.flash > 0) ctx.filter = 'brightness(1.7)'; if (t.hp <= 0) ctx.filter = 'grayscale(1) brightness(.55)';
      ctx.drawImage(img, t.x - w / 2, t.y - h + 14, w, h); ctx.restore();
      if (t.hp < t.maxHp * 0.5 && G.frame % 9 === 0) G.fx.push({x:t.x + rnd(-18, 18), y:t.y - 30, vx:rnd(-.3, .3), vy:-1.1, life:36, c:'#9a8a7a', px:3});
      bar(t, 56, '#6fd37a');
      ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText(facility(t.id).name.toUpperCase(), t.x, t.y - 56);
    }});
  };
}
function raidRepairs(){
  const facs = G.facs || [], bill = {}; let total = 0;
  for (const t of facs){ if (t.hp >= t.maxHp) continue; const c = Math.max(5, Math.round((1 - Math.max(0, t.hp) / t.maxHp) * facCost(facility(t.id)) * 0.6)); bill[t.id] = c; total += c; }
  const cap = RAID_REPAIR_CAP * G.contract.tier;
  if (total > cap){ const k = cap / total; total = 0; for (const id in bill){ bill[id] = Math.max(5, Math.floor(bill[id] * k)); total += bill[id]; } }
  return {bill, total};
}
{ const f = raidDebrief;
  raidDebrief = function(c, result, lines){
    f(c, result, lines);
    const {bill, total} = raidRepairs(); if (!total) { lines.push('<p class="good">Not a plank out of place: no repairs needed.</p>'); return; }
    META.damaged = META.damaged || {};
    for (const id in bill) META.damaged[id] = (META.damaged[id] || 0) + bill[id];
    lines.push(`<p class="bad"><b>Repairs:</b> ${Object.entries(bill).map(([id, v]) => `${facility(id).name} ${v}gp`).join(', ')} (${total}gp in all). A damaged facility's bonus is off until you repair it from its panel in camp.</p>`);
  };
}
function repairFacility(id){
  const c = META.damaged && META.damaged[id]; if (!c || META.treasury < c) return SFX.play('nope');
  META.treasury -= c; delete META.damaged[id]; try { chron(); chronSpend('Repairs', c); } catch (e) {}
  SFX.play('coin'); saveMeta(); refreshUI(); renderPanel();
}
// a damaged facility gives no bonus until repaired; drawing, building and its own panel still see it (HAS_RAW)
for (const n of ['campObjects', 'buyFacility', 'drawCamp', 'renderPanel']){
  const f = window[n]; if (typeof f !== 'function') continue;
  window[n] = function(){ HAS_RAW++; try { return f.apply(this, arguments); } finally { HAS_RAW--; } };
}

/* --------------------------------------------- DAMAGED FACILITY PANELS --- */
{ const f = renderPanel;
  renderPanel = function(){
    f();
    const P = CAMP.panel; if (!P || P.kind !== 'building' || !isDamaged(P.id)) return;
    const c = META.damaged[P.id], F = facility(P.id);
    $('camp-panel').innerHTML = `<button class="x" onclick="closePanel()">&#215;</button><h2>${esc(F.name)}</h2><img class="pimg" src="${toURL('fac:' + P.id, () => facilityCanvas(P.id), 4)}" style="filter:grayscale(.6)">
      <div class="tag" style="background:#8b2a1a">Damaged in the raid</div>
      <div class="desc" style="text-align:left">Raiders got inside the walls and wrecked part of it. Until it is repaired, its bonus is off: <i>${esc(F.desc)}</i></div>
      <button class="btn gold" ${META.treasury >= c ? '' : 'disabled'} onclick="repairFacility('${P.id}')">REPAIR (${c}gp)</button>`;
  };
}
{ const f = drawCamp;
  drawCamp = function(){
    f(); if (G || !META.damaged) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const id in META.damaged){ const pl = PLOTS[id]; if (!pl || CAMP.t % 10) continue;
      CAMP.puffs.push({x:pl[0] + rnd(-20, 20), y:pl[1] - 60, vx:rnd(-.2, .2), vy:-0.7, life:70, c:'#8a8078'}); }
  };
}

/* ------------------------------------------------------------- RAID PARLAY --- */
function raidParlay(){
  const R = META.raid; if (!R || R.parlay || RAID_NO_PARLEY.includes(R.host)) return;
  const L = META.leader, s = leaderStats(L), fac = R.faction;
  let step = 0; const mods = [];
  if (hasDoc('propaganda')){ step++; mods.push('+1 Propaganda & Parley'); }
  if (leadRace('GREY_ELF')){ step++; mods.push('+1 Grey Elf mediator'); }
  if (fac && standing(fac) <= -2){ step--; mods.push('-1 Hostile with ' + facName(fac)); }
  const mine = rollDie(s.per + step), theirs = rollDie(commanderMorale(R.tier));
  R.parlay = {mine, theirs, mods, res:mine > theirs ? 'walk' : mine === theirs ? 'small' : 'big'};
  SFX.play(mine > theirs ? 'win' : mine === theirs ? 'pick' : 'nope');
  if (R.parlay.res === 'walk'){ R.parlay.done = true; try { chron(); chronAdd('parlay', {host:R.host, res:'walk'}, true); } catch (e) {} }
  saveMeta(); renderPanel();
}
function raidBribe(){
  const R = META.raid; if (!R || !R.parlay) return;
  const cost = (R.parlay.res === 'small' ? RAID_BRIBE_SMALL : RAID_BRIBE_BIG) * R.tier;
  if (META.treasury < cost) return SFX.play('nope');
  META.treasury -= cost; try { chron(); chronSpend('Raid bribe', cost); } catch (e) {}
  raidGone();
}
function raidGone(){ META.raid = null; META.lastRaid = META.deployments; SFX.play('coin'); saveMeta(); closePanel(); refreshUI(); }
{ const f = raidPanelHTML;
  raidPanelHTML = function(){
    const R = META.raid, P = R.parlay;
    if (!P && RAID_NO_PARLEY.includes(R.host)) return f();   /* K40 */
    if (!P) return f() + `<button class="btn small" onclick="raidParlay()" data-tip="Your Leader's Personality die against the raiders' Morale die. Win: they walk away. Tie: they go for a small bribe. Lose: they want a big one.">PARLEY</button>
      <div class="desc" style="font-size:14px;margin-top:4px">Parley: win and they walk away. Tie and they go for ${RAID_BRIBE_SMALL * R.tier} gp. Lose and they want ${RAID_BRIBE_BIG * R.tier} gp.</div>`;
    const H = HOSTS[R.host], head = `<h2>Parley</h2><div class="row" style="gap:10px"><div class="card static" style="width:110px"><div class="tag">You</div><div class="ttl" style="font-size:28px">${P.mine}</div></div><div class="card static" style="width:110px"><div class="tag">${esc(H.name)}</div><div class="ttl" style="font-size:28px">${P.theirs}</div></div></div>
      <div class="desc" style="font-size:14px">Modifiers: ${P.mods.join(', ') || 'none'}.</div>`;
    if (P.res === 'walk') return head + `<div class="desc" style="color:#226b2a;font-size:15px"><b>They walk away.</b> Not a coin spent.</div><button class="btn gold" onclick="raidGone()">GOOD RIDDANCE</button>`;
    const cost = (P.res === 'small' ? RAID_BRIBE_SMALL : RAID_BRIBE_BIG) * R.tier;
    return head + `<div class="desc" style="font-size:15px">${P.res === 'small' ? '<b>Close.</b> They will go, for a little something.' : '<b>They laugh.</b> It will cost you to make them leave.'}</div>
      <button class="btn gold" ${META.treasury >= cost ? '' : 'disabled'} onclick="raidBribe()">PAY ${cost}gp</button>
      <button class="btn" onclick="startRaid()">DEFEND THE CAMP</button>
      <button class="btn small" onclick="payOffRaid()">LET THEM LOOT IT (lose ${Math.round(META.treasury * 0.3)}gp)</button>`;
  };
}
{ const f = chronText; chronText = function(e){ if (e.k === 'parlay') return `Raiders from ${esc(HOSTS[e.host] ? HOSTS[e.host].the : 'the road')} are talked out of attacking the camp.`; return f(e); }; }

/* --------------------------------------------------------- TENTS TIERS --- */
const tentTier = () => has('bunks') ? 3 : has('huts') ? 2 : has('tents') ? 1 : 0;
{ const f = facilityCanvas;
  facilityCanvas = function(id){ if (id === 'tents'){ const raw = HAS_RAW; HAS_RAW = 1; try { const t = META && META.facilities.bunks ? 'bunks' : META && META.facilities.huts ? 'huts' : null; if (t) return f(t); } finally { HAS_RAW = raw; } } return f(id); };
}
{ const f = applySkin;
  applySkin = function(){ f(); const T = FACILITIES.find(x => x.id === 'tents'), N = FAC_SKIN_NAMES[holdKey()] || {};
    if (T && META && META.facilities){ T.name = META.facilities.bunks ? (N.bunks || 'Bunks') : META.facilities.huts ? (N.huts || 'Huts') : (N.tents || 'Tents'); } };
}
function upgradeTents(){
  const id = !META.facilities.huts ? 'huts' : !META.facilities.bunks ? 'bunks' : null; if (!id) return;
  buyFacility(id); applySkin(); delete SPR['tents']; for (const k in SPR) if (k.indexOf('tents') >= 0) delete SPR[k]; CAMP.dirty = true; renderPanel();
}
{ const f = renderPanel;
  renderPanel = function(){
    f();
    const P = CAMP.panel; if (!P || P.kind !== 'building' || P.id !== 'tents' || !META.facilities.tents || isDamaged('tents')) return;
    const nx = !META.facilities.huts ? facility('huts') : !META.facilities.bunks ? facility('bunks') : null;
    $('camp-panel').insertAdjacentHTML('beforeend', `<div class="desc" style="text-align:left;margin-top:8px;border-top:1px solid #c9bba4;padding-top:6px"><b>Quarters, tier ${tentTier()} of 3.</b> The Reserve Bench holds ${benchCap()} places.
      ${nx ? `<br>Upgrade to <b>${esc(nx.name)}</b>: ${esc(nx.desc)}<br><button class="btn gold" ${META.treasury >= facCost(nx) ? '' : 'disabled'} onclick="upgradeTents()">UPGRADE (${facCost(nx)}gp)</button>` : '<br>Fully built.'}</div>`);
  };
}

/* ---------------------------------------------------------- CAMP CHATTER --- */
const BARK_RACE = {
  HUMAN:['Same as any war. Mud, waiting, then a lot of shouting.', 'My mother wanted me to be a cooper.'],
  SUN_ELF:['The light here is so grey. How do you live like this?', 'I give this camp... a modest six.'],
  GREY_ELF:['If everyone would just sit down and talk, half these contracts would vanish.', 'Someone is wrong about something. I can feel it.'],
  DARK_ELF:['Mud-men and their noisy boots...', 'You call this cold?'],
  ORC:['Back on the steppe we would be riding by now.', 'A horse, a sky and a fight. That is a good day.'],
  GOBLIN:['I did not take it. I borrowed it. Different thing.', 'Big folk never look down. That is where the good stuff is.'],
  HOBGOBLIN:['Boots polished. Blades oiled. Who is slacking?', 'Discipline wins wars. And claws.'],
  DWARF:['That gate would not last a winter in the Hold.', 'Good beer is a craft. This is not good beer.'],
  GNOME:['If I just had one more gear...', 'Do not touch that. It is nearly finished. Probably.'],
  HALFLING:['Second breakfast is a right, not a privilege.', 'Lucky? No. Just careful where I stand.'],
  HALF_ELF:['Too elf for the village, too human for the grove. The company does not mind.', 'Both my parents would hate this place. I love it.'],
  HALF_ORC:['They stare. Let them.', 'Bruises heal. Mostly.'],
  FIRBOLG:['Mind your head on the doorframe. Oh, that was me.', 'The trees here are young and loud.'],
  CAMBION:['Smells like smoke. I like it.', 'Do not look at the horns. Everyone looks at the horns.'],
  NEPHILIM:['Is there a mirror in this camp? Asking for a friend.', 'Try not to bleed on me, darling.'],
  ZUHRI:['Storm coming. I can taste it.', 'The sky talks, if you listen.']
};
const BARK_CLS = {
  FREEMAN:["Séamasína's girls at the Cracked Keg owe me a song.", 'Honest work, honest pay. Mostly honest.'],
  OUTCAST:["If the watch comes asking, tell 'em we're on rota at Grey Keep.", 'Nobody asks where you came from here. I like that.'],
  NOBLE:['Father would faint if he saw me eating off a plank.', 'Someone fetch my... no. Right. I fetch my own.'],
  SLAVE:['Nobody owns me now. Not even the company.', 'I sleep better in a tent than I ever did in chains.'],
  DEVOUT:['Say a word before we march. It costs nothing.', 'The gods keep a ledger too.'],
  EDELOS:['The Empire remembers everything. So do I.', 'Stand straight. Someone is always watching.']
};
const BARK_REGION = {
  heartland:['The Heartland roads are too well kept. Makes me nervous.'],
  marches:['Every village on the Marches flies a different flag every month.'],
  mendor:['The Mendor ferry still makes my stomach turn.'],
  spine:['Something old was buried in those Qloria ruins. Leave it buried.'],
  frost:['My fingers still have not thawed from the Frost-Vaults.'],
  freelands:['Suderia was kind to us. Mostly.']
};
const BARK_VET = ["Saw the crater where that fire-orc's sword levelled Artemis's old keep."];
{ const f = barkFor;
  barkFor = function(p){
    const extra = [].concat(BARK_RACE[p.race] || [], BARK_CLS[p.cls] || [], (META.lastRegion && BARK_REGION[META.lastRegion]) || [], (p.adv >= 3 || p.level >= 3) ? BARK_VET : []);
    return (extra.length && Math.random() < 0.6) ? pickOf(extra) : f(p);
  };
}

/* ---------------------------------------------------- RUINED WAYSTATION --- */
HOLDINGS.waystation = {name:'Ruined Waystation', short:'Waystation', blurb:'An old imperial waystation on a crossroads, half fallen in. Broken walls, a cracked waystone and a well that still draws. Every facility is built into the ruins.',
  house:'The Waystone Hall', houseSub:'The planning table', qm:"Quartermaster's Wagon", fire:'The Hearth Ruin', fireSub:'Travellers stop to listen', grave:'The Old Cairns'};
FAC_SKIN_NAMES.waystation = {tents:'Lean-tos', huts:'Patched Rooms', bunks:'Restored Dormitory', kitchen:'Waystation Kitchen', tavern:'Taproom Ruin', command:'Postmaster\u2019s Office',
  merchant:'Crossroads Stalls', cells:'Old Cells', barracks:'Garrison Ruin', training:'Courtyard Drill', armoury:'Arms Vault', stables:'Post Stables', ranger:'Signal Tower',
  hospital:'Infirmary', blacksmith:'Waystation Forge', carpentry:'Wheelwright', leather:'Saddlery', engineering:'Siege Yard', alchemy:'Herbalist\u2019s Cellar',
  magetower:'Broken Tower', chapel:'Wayshrine', palisade:'Patched Walls & Gates', watchtower:'Ruined Turrets', trapyard:'Rubble Traps', kennels:'Post Hounds'};
const WAY_RUINS = [[150, 200, 90], [1560, 180, 120], [130, 1050, 110], [1640, 960, 80], [700, 170, 70], [1180, 1110, 90]];
{ const f = drawCamp;
  drawCamp = function(){
    f(); if (G || holdKey() !== 'waystation') return;
    const cx = Math.round(CAMP.cam.x), cy = Math.round(CAMP.cam.y);
    ctx.setTransform(1, 0, 0, 1, -cx, -cy);
    for (const [x, y, w] of WAY_RUINS){
      ctx.fillStyle = '#7a756a'; ctx.fillRect(x, y - 18, w, 18); ctx.fillStyle = '#9a958a'; ctx.fillRect(x, y - 18, w, 4);
      for (let i = 0; i < w; i += 14){ const h = 6 + ((x + i) * 7 % 13); ctx.fillStyle = '#8a857a'; ctx.fillRect(x + i, y - 18 - h, 10, h); }
      ctx.fillStyle = '#5a564c'; ctx.fillRect(x + w * 0.3, y - 4, 8, 4); ctx.fillRect(x + w + 6, y - 3, 6, 3);
    }
    ctx.fillStyle = '#8a857a'; ctx.fillRect(HUB.house.x + 170, HUB.house.y - 90, 14, 46); ctx.fillStyle = '#a8a396'; ctx.fillRect(HUB.house.x + 170, HUB.house.y - 90, 14, 6);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}

/* ------------------------------------------- WANDERERS GO ROUND BUILDINGS --- */
// buildings and the wagon only: people are meant to gather round the fire (Index 49 audit)
function buildingBlocked(x, y){ const H = HUB.fire; HUB.fire = {x:-9999, y:-9999}; try { return leaderBlocked(x, y); } finally { HUB.fire = H; } }
{ const f = updatePeople;
  updatePeople = function(){
    const prev = new Map(CAMP.people.map(q => [q, [q.x, q.y]]));
    f();
    for (const q of CAMP.people){
      if (q.kind === 'bard' || (q.kind === 'leader' && CAMP.ctrl)) continue;
      const pv = prev.get(q); if (!pv || !buildingBlocked(q.x, q.y) || buildingBlocked(pv[0], pv[1])) continue;
      if (!buildingBlocked(q.x, pv[1])) q.y = pv[1];
      else if (!buildingBlocked(pv[0], q.y)) q.x = pv[0];
      else { q.x = pv[0]; q.y = pv[1] + 1.2; q.wait = 0; }
    }
  };
}

/* ---------------------------------------------- ELEVATE A SQUAD LEADER --- */
const ELEVATE_LEADER_LVL = 3;
{ const f = elevCandidates;
  elevCandidates = function(){
    const out = f();
    if (META.master && META.master.hero && META.leader && META.leader.level >= ELEVATE_LEADER_LVL) out.unshift({kind:'leader', p:META.leader, note:'your Squad Leader, Level ' + META.leader.level});
    return out;
  };
}
{ const f = elevateTo;
  elevateTo = function(kind, id){
    if (kind !== 'leader') return f(kind, id);
    const M = META.master, p = META.leader; if (!M || !M.hero || !p) return;
    const H = HEROES[M.hero], ro = readyOfficers()[0];
    if (!gate(`Elevate ${p.name}, your Squad Leader, to Chapter Master? ${H.name} steps down as Elder. ${p.name} will no longer march: ${ro ? ro.name + ' takes command of the squad.' : 'you will recruit a new Squad Leader.'} The camp bonus becomes: ${CM_BONUS[p.cls].game}`, () => elevateTo(kind, id))) return;
    META.elder = {hero:M.hero, name:H.name, full:H.full, title:H.title, at:META.deployments || 0};
    META.master = {id:'CM', name:p.name, race:p.race, cls:p.cls, spec:p.spec, sex:sexOf(p), chosen:true, elevated:true};
    if (p.deity) META.master.deity = p.deity;
    META.treasury += ELDER_GIFT; META.leader = null; META.pendingPicks = 0; META.board = null;
    try { chron(); chronAdd('elevate', {name:p.name, race:p.race, cls:p.cls, elder:H.full, gift:ELDER_GIFT}, true); } catch (e) {}
    SFX.play('horn');
    if (ro){ officers().push({}); officers().pop(); takeCommand(officers().indexOf(ro)); saveMeta(); try { CAMP.dirty = true; closePanel(); } catch (e) {} refreshUI(); }
    else { saveMeta(); try { CAMP.dirty = true; closePanel(); } catch (e) {} openCreate(); }
  };
}
{ const f = elderHTML; elderHTML = function(){ const h = f(); return h ? h.replace('sits at the council fire.</span>', 'sits at the council fire, and rolls an extra die for the Chapter in every War Council.</span>') : h; }; }

/* ---------------------------------- THE BARD GUIDES THE PROLOGUE AND MOVES --- */
const SOFT_LINES = {
  story:{spec:"Before the road, a Leader. Pick what they do in a fight, and watch the card fill in.", cls:'Who were they before? Every Class has a bonus and a catch.', race:'Their people. The chips show how each compares with a Human.', pick:'One ability to start with. More come with levels.', name:'A name for the songs. Then the road.'},
  holding:'A new home, then. Every holding can build everything; this decides how the camp looks.',
  charter:'And what is the Chapter for this time?',
  banner:'New walls, new banner. Make it a good one.',
  storyHolding:'We made it. Now where do we hang the banner?'
};
{ const f = renderCreate;
  renderCreate = function(){
    f();
    try {
      if (!(CR && inStoryNow() && !(GUIDE && GUIDE.on))) return;
      const h = $('create-inner'), h1 = h && h.querySelector('h1'), line = SOFT_LINES.story[CR.step]; if (!h1 || !line) return;
      h1.insertAdjacentHTML('afterend', bardSays(line));
    } catch (e) {}
  };
}
{ const f = renderFound;
  renderFound = function(){
    f();
    try {
      if (!FD || FD.guided || !(FD.fromCollapse || FD.fromStory)) return;
      const h = $('create-inner'), h1 = h && h.querySelector('h1'); if (!h1) return;
      const line = FD.step === 'holding' ? (FD.fromStory ? SOFT_LINES.storyHolding : SOFT_LINES.holding) : SOFT_LINES[FD.step]; if (!line) return;
      h1.insertAdjacentHTML('afterend', bardSays(line));
    } catch (e) {}
  };
}

/* --------------------------------- LIVE CARD ON "BUILD YOUR OWN" MASTER --- */
const CMV = {hov:null};
function cmCardHTML(){
  const h = CMV.hov || {}, race = h.race || FD.race, cls = h.cls || FD.cls, spec = h.spec || FD.spec;
  const circ = Object.entries(PATRON_CIRCLE).filter(([, c]) => c.includes(race) || c.includes(cls) || c.includes(spec)).map(([p]) => p);
  return `<div class="ldr-card"><div class="ldr-head">${race ? `<img src="${previewBustURL(race, FD.sex, spec || 'CLERIC', cls || 'FREEMAN')}">` : '<div class="ldr-q">?</div>'}<div><b>Chapter Master</b>
    <span style="font-size:14px;font-style:italic">${race ? RACES[race].name : '<i class="q">Race?</i>'} ${cls ? CLASSES[cls].name : '<i class="q">Class?</i>'}${spec ? ', once a ' + SPECS[spec].name : ''}</span></div></div>
    <div class="how"><b>Camp bonus:</b> ${cls ? CM_BONUS[cls].game : '<i>set by their Social Class</i>'}</div>
    <div class="how"><b>Patrons' circle:</b> ${race || cls || spec ? (circ.join(', ') || 'none') : '<i>set by Race, Class and Specialty</i>'}</div>
    <div class="how" style="color:#6a5a44">The Chapter Master never marches, so fighting stats do not matter. The Class sets the camp bonus, and matching a patron's circle helps in the War Council.</div></div>`;
}
{ const f = renderFound;
  renderFound = function(){
    f();
    try {
      if (!FD || FD.hero || !['race', 'cls', 'spec', 'name'].includes(FD.step)) return;
      const h = $('create-inner'), row = h && (h.querySelector('.row') || h.querySelector('.log')); if (!row) return;
      const host = FD.step === 'name' ? row.parentElement : row;
      const wrap = document.createElement('div'); wrap.id = 'ldr-wrap';
      const left = document.createElement('div'); left.id = 'ldr-left';
      const live = document.createElement('div'); live.id = 'ldr-live'; live.innerHTML = cmCardHTML();
      host.parentElement.insertBefore(wrap, host); left.appendChild(host); wrap.appendChild(left); wrap.appendChild(live);
      for (const c of left.querySelectorAll('.card')){
        const m = /FD\.(race|cls|spec)='([A-Z_]+)'/.exec(c.getAttribute('onclick') || ''); if (!m) continue;
        c.addEventListener('mouseenter', () => { CMV.hov = {[m[1]]:m[2]}; live.innerHTML = cmCardHTML(); });
        c.addEventListener('mouseleave', () => { CMV.hov = null; live.innerHTML = cmCardHTML(); });
      }
    } catch (e) {}
  };
}

/* ----------------------------------------------------- RACE CHIPS, NARROW --- */
{ const f = raceChips;
  raceChips = function(k){
    if (!CR || !CR.spec) return f(k);
    const cls = CR.cls || 'FREEMAN', a = ldrStats(k, cls, CR.spec), b = ldrStats('HUMAN', cls, CR.spec); if (!a || !b) return f(k);
    const caster = SPECS[CR.spec].caster, c = [], add = (lab, v) => { if (v) c.push(`<u class="${v > 0 ? 'dl-up' : 'dl-dn'}">${lab} ${v > 0 ? '+' : ''}${v}</u>`); };
    add('Con', a.con - b.con); add('Wounds', a.maxWounds - b.maxWounds); add('Move', a.move - b.move);
    add('Melee', clampSkill(a.melee) - clampSkill(b.melee)); add('Ranged', clampSkill(a.ranged) - clampSkill(b.ranged));
    if (caster) add('Magic', clampSkill(a.magic) - clampSkill(b.magic));
    add('Luck', a.luck - b.luck); add('Per', clampSkill(a.per) - clampSkill(b.per));
    return c.length ? c.join('') : '<u class="dl-up">Same as a Human</u>';
  };
}
document.head.appendChild(Object.assign(document.createElement('style'), {textContent: `
  @media (max-width:980px){
    #ldr-wrap{flex-direction:column-reverse !important}
    #ldr-live{position:sticky !important;top:0;z-index:5;width:100% !important}
    #ldr-live .how,#ldr-live details,#ldr-live .dsnote{display:none}
    #ldr-live .ldr-card{padding:6px 10px;box-shadow:0 6px 14px rgba(0,0,0,.35)}
    #ldr-live .ldr-head img,#ldr-live .ldr-q{height:54px;width:54px}
  }`}));

{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx48')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx48"><b>Raids.</b> Behind a Palisade, raiders must break a gate to get in, and then they go for your buildings. Damage becomes a repair bill; a damaged facility gives no bonus until it is repaired from its panel. From the raid warning you can Parley once: win and they walk away, tie and they take ${RAID_BRIBE_SMALL}gp per Tier, lose and they want ${RAID_BRIBE_BIG}gp per Tier.</p>
      <p class="idx48"><b>Fog of war.</b> You only see ground you have explored. <b>Kennels:</b> two hounds sniff out traps, Blip Tokens, sleeping camps and caches; an enemy that reaches one sends it home. <b>Quarters:</b> Tents upgrade to Huts and Bunks from the Tents panel.</p>`);
  };
}

/* K45 (F-48 UX): a new chapter with no Squad Mates had nothing pointing to hiring, and the Planning Table listed
   contracts as if a squad stood ready. Now, with 0 mates: after SIGN CONTRACT (once the banner panel closes) a card
   points to the Hiring Line, and the Planning Table shows the same line and button over the contracts.
   Words: CAMPAIGN_LINES.ux48.k45 [N]. K45H.on = false: off. */
(function(){
  const K = window.K45H = {on: true, due: false};
  K.w = () => Object.assign({noMates: 'No one to send yet. Hire a Squad Mate at the Hiring Line first.', noMatesButton: 'GO TO THE HIRING LINE'},
    ((window.CAMPAIGN_LINES || {}).ux48 || {}).k45 || {});
  K.need = () => !!(K.on && typeof META !== 'undefined' && META && META.leader && !(META.roster || []).length && !(window.F34 && F34.active && F34.active()));
  K.go = function(){
    try { if (typeof closePanel === 'function') closePanel(); } catch (e) {}
    // UX b33fc7d: the hiring list is the Campfire panel (CAMP31.hire), not the Barracks
    if (window.CAMP31 && typeof CAMP31.hire === 'function') return CAMP31.hire();
    openRoster();
  };
  K.html = () => K.need() ? `<div data-k45="nomates" style="margin:4px 0 10px;padding:8px 10px;border:2px solid #8a6d3a;border-radius:4px;background:rgba(232,216,176,.5)"><div style="font:bold 14px Georgia;margin-bottom:6px">${esc(K.w().noMates)}</div><button class="btn small gold" onclick="K45H.go()">${esc(K.w().noMatesButton)}</button></div>` : '';
  K.ask = function(){
    if (!K.due || !K.need()) return; K.due = false;
    askConfirm(K.w().noMatesButton.replace(/^GO TO THE /, 'The ').replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()), K.w().noMates, () => K.go(), {ok: K.w().noMatesButton, cancel: 'LATER'});
  };
  { const f = finishCreate; finishCreate = function(){ const r = f.apply(this, arguments);
      try { if (K.need()){ K.due = true; const bp = document.querySelector('#camp-panel:not(.hidden)'); if (!bp) K.ask(); } } catch (e) { console.warn('K45H', e); }
      return r; }; }
  if (typeof closePanel === 'function'){ const f = closePanel; closePanel = function(){ const r = f.apply(this, arguments); try { if (K.due) setTimeout(K.ask, 0); } catch (e) {} return r; }; }
  { const f = renderTable; renderTable = function(){ const r = f.apply(this, arguments);
      try { const h = K.html(); if (h){ const t = [...document.querySelectorAll('#table-inner h3')].find(x => /Contracts on Offer/.test(x.textContent)); if (t) t.insertAdjacentHTML('afterend', h); } } catch (e) { console.warn('K45H table', e); }
      return r; }; }
})();
/* ===== END INDEX 48 ======================================================= */

