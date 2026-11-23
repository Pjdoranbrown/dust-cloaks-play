/* js/combat/rivals-fog.js (INT-1 step 2, 2026-11-16): INDEX 49 (rival companies, fog of war, code audit).
   Cut unchanged from the inline script in index.html (old lines 18197 to 18475). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 49 - RIVAL MERCENARY COMPANIES, RTS FOG OF WAR, AND A CODE AUDIT
   RIVALS    Three rival companies want the Chapter's work. Two are fronts for
             factions: a Skulk crew (The Skulk, the thieves' guild) and a
             Reprobate cabal (the Reprobate Collective, the outlaw mages). One is
             an independent free company. Names are in RIVAL_DEFS below.
             How angry they are ("heat") comes from what you do and from your
             Standing with the faction behind them:
               - working for their sponsor's enemy raises heat; working for
                 their sponsor lowers it
               - the free company gets angrier each time you win a Tier 2+ job
               - their sponsor's Standing counts: Hostile makes them bolder,
                 Allied stands them down completely
               - with Cayde in the chair or on the council, the Skulk
                 crew holds back (the Iron Fists answer to nobody)
             Angry rivals raid the camp (their captain leads the raid) or turn
             up on your contracts, paid by the other side. Beat their captain
             twice and the company breaks: its banner goes on the Trophy Rack,
             their sponsor's Standing drops by 1 and the sponsor's enemy's rises
             by 1. The Planning Table's Rivals scroll shows them all.
             The Empire, the Suderian Freemen and the Dust Cloaks Council never
             send raiders.
   NAMES     The Grey Cloaks were one of many mercenary bands that merged to
             form the Dust Cloaks (R-004, R-026). The faction is now shown as
             the Dust Cloaks Council, and Cayde, once Master of the Grey
             Cloaks, is one of the masters of the Dust Cloaks (R-027). The
             prologue keeps the old name on purpose: it is set before the merger.
   FOG       RTS fog of war. Ground nobody has seen is black. Ground in sight is
             clear. Ground you have seen but are away from is dimmed, and shows
             terrain only: no enemies, coin or tokens. Vision is VISION_K times
             the Command Radius, so anything that widens the Command Radius
             widens vision. Scout widens it 15% a rank, hounds see for
             themselves, and every Squad Mate sees a little.
   Saves: rivals are created the first time they are needed.
============================================================================ */
const NO_RAIDERS = ['empire', 'suderia', 'greycloaks'];
const VISION_K = 3, VISION_MAX = 800;   /* Q103: 640 to 800 */
const RIVAL_DEFS = [
  {id:'knives', name:'The Velvet Knives', sponsor:'skulk',      host:'skulkcrew',   k:'vane',       hero:'cayde', col:'#3a3a44',
   why:"The Skulk pays them. Work for the Mendorian Order angers them; work for the Skulk calms them."},
  {id:'ashen',  name:'The Ashen Circle',  sponsor:'reprobates', host:'cabal',       k:'inquisitor', col:'#6a3a8a', title:'Magus',   /* SW-11(d): no hero hold, Zenif is dead by 616 (bible 2026-11-09) */
   why:'The Reprobate Collective pays them. Work for the Imperial Arcana Guild angers them; work for the Collective calms them.'},
  {id:'fists',  name:'The Iron Fists',    sponsor:null,         host:'freecompany', k:'vane',       col:'#8a6a3a',   /* CLARKE-1: no named hero */
   why:'A free company after the same contracts. Every Tier 2 or 3 job you win is one they did not.'}
];
Object.assign(HOSTS, {
  skulkcrew:  {name:'Skulk cutthroats', the:'a Skulk crew', den:'Skulk Safehouse',
               pools:{1:['brigand','enforcer','crossbow'], 2:['enforcer','crossbow','renegade','hedgewitch'], 3:['renegade','arbalest','enforcer','shadowhunter']},
               bosses:{1:['vane'], 2:['vane'], 3:['vane']}},
  cabal:      {name:'Reprobate cabalists', the:'a Reprobate cabal', den:'Cabal Hideaway',
               pools:{1:['hedgewitch','cinder','brigand'], 2:['hedgewitch','cinder','raider','battlemage'], 3:['battlemage','raider','cinder','hedgewitch']},
               bosses:{1:['inquisitor'], 2:['inquisitor'], 3:['inquisitor','devil']}},
  freecompany:{name:'Free Company sellswords', the:'a rival free company', den:'Sellsword Camp',
               pools:{1:['renegade','brigand','crossbow'], 2:['renegade','arbalest','hobgob','enforcer'], 3:['renegade','arbalest','warden','hobgob']},
               bosses:{1:['vane'], 2:['vane','ogre'], 3:['ogre','vane']}}
});

/* -------------------------------------------------------------- RIVALS --- */
function ensureRivals(){
  if (!META) return [];
  if (!META.rivals){
    META.rivals = RIVAL_DEFS.map(d => ({id:d.id, name:d.name, sponsor:d.sponsor, host:d.host, heat:0, strength:1, beaten:0, status:'active',
      captain:{k:d.k, name:rivalCaptainName(d)}}));
  }
  return META.rivals;
}
function rivalCaptainName(d){ const t = (d && d.title) || 'Captain'; return t + ' ' + String(commanderName('vane')).replace(/^\S+\s+/, ''); }
const rivalById = id => ensureRivals().find(r => r.id === id);
const rivalDef = r => RIVAL_DEFS.find(d => d.id === r.id) || {};
const rivalHeroHolds = r => { const h = rivalDef(r).hero; return !!h && ((META.master && META.master.hero === h) || (META.elder && META.elder.hero === h)); };
function rivalHostility(r){
  if (!r || r.status !== 'active') return -99;
  if (r.sponsor && standing(r.sponsor) >= 2) return -99;           // their paymasters are your friends: they stand down
  return r.heat - (r.sponsor ? standing(r.sponsor) : 0) - (rivalHeroHolds(r) ? 2 : 0);
}
const rivalMood = h => h <= -99 ? 'Standing down' : h <= 0 ? 'Keeping their distance' : h === 1 ? 'Watching you' : h === 2 ? 'Spoiling for a fight' : 'Out for blood';
function rivalHeat(r, n, why){
  if (!r || r.status !== 'active' || !n) return;
  r.heat = Math.max(0, Math.min(6, r.heat + n));
  if (why && G) (G.rivalLines = G.rivalLines || []).push(`<p class="${n > 0 ? 'bad' : 'good'}"><b>${esc(r.name)}:</b> ${why}</p>`);
}
function rivalsHTML(){
  const R = ensureRivals(); if (!R.length) return '';
  return `<div class="sub" style="font-size:14px;text-align:left;margin-bottom:4px"><b>Rival companies.</b> Angry rivals raid the camp or turn up on your contracts. Beat a captain twice and the company breaks.</div>` +
    R.map(r => { const h = rivalHostility(r), d = rivalDef(r), broken = r.status !== 'active';
      return `<div class="line"><img src="${enemyIconURL(r.captain.k)}" style="${broken ? 'filter:grayscale(1)' : ''}"><div class="grow"><b>${esc(r.name)}</b>${broken ? ' (broken)' : ''}<br>
        <span style="font-size:14px">${r.sponsor ? 'Paid by ' + esc(facName(r.sponsor)) + ' (Standing ' + (standing(r.sponsor) > 0 ? '+' : '') + standing(r.sponsor) + ')' : 'A free company'}.
        ${broken ? 'Their banner hangs on your Trophy Rack.' : `${esc(r.captain.name)}. Beaten ${r.beaten} of 2. <b>${rivalMood(h)}</b>.`}</span>
        ${broken ? '' : `<br><span style="font-size:14px;font-style:italic">${esc(d.why || '')}${rivalHeroHolds(r) ? ` ${esc(HEROES[d.hero].name)}'s word keeps them in check.` : ''}</span>`}</div></div>`; }).join('');
}
// after every ordinary contract: who did you work for?
function rivalsAfterContract(c, result){
  if (!c || inStoryNow() || ['brawl', 'drill', 'defend'].includes(c.obj)) return;
  const won = result === 'victory';
  for (const r of ensureRivals()){
    if (r.status !== 'active') continue;
    if (r.sponsor){
      if (c.faction && c.faction === FACTION_RIVAL[r.sponsor]) rivalHeat(r, 1, `You took ${facName(c.faction)}'s coin. Their enemies noticed.`);
      else if (c.faction === r.sponsor && won) rivalHeat(r, -1, `Work for their paymasters cools them off.`);
    } else if (won && c.tier >= 2) rivalHeat(r, 1, 'That was a job they wanted.');
  }
}
function rivalCaptainDown(r, how){
  if (!r || r.status !== 'active') return;
  r.beaten++; r.heat = 0;
  const old = r.captain.name, lines = (G.rivalLines = G.rivalLines || []);
  try { chron(); chronAdd('rival', {what:how, name:r.name, captain:old}, true); } catch (e) {}
  if (r.beaten >= 2) return breakRival(r);
  r.captain = {k:r.captain.k, name:rivalCaptainName(rivalDef(r))};
  lines.push(`<p class="good"><b>${esc(r.name)}:</b> ${esc(old)} is ${how === 'captured' ? 'in chains' : 'dead'}. ${esc(r.captain.name)} takes over what is left. Beat them once more and the company breaks.</p>`);
}
function breakRival(r){
  r.status = 'broken';
  const lines = (G && (G.rivalLines = G.rivalLines || [])) || [];
  (META.trophies = META.trophies || []).push({kind:'banner', col:rivalDef(r).col || '#5a3a2a', name:`The banner of ${r.name}`, from:'a broken rival company', season:seasonName()});
  lines.push(`<p class="good"><b>${esc(r.name)} are finished.</b> Their banner goes up on the Trophy Rack.</p>`);
  if (r.sponsor){ shiftStanding(r.sponsor, -1, lines); const foe = FACTION_RIVAL[r.sponsor]; if (foe) shiftStanding(foe, 1, lines); }
  try { chron(); chronAdd('rival', {what:'broken', name:r.name}, true); } catch (e) {}
}
function markCaptain(e, r){
  e.name = r.captain.name; e.rivalId = r.id; e.seenNote = true;
  e.con = e.maxCon = Math.round(e.maxCon * (1 + 0.2 * (r.strength - 1) + 0.15 * r.beaten));
}
{ const f = spawnEnemy;
  spawnEnemy = function(k, x, y, o = {}){
    const r = (G && G.contract && G.contract.rival && !G.rivalSpawned && BESTIARY[k] && BESTIARY[k].boss) ? rivalById(G.contract.rival) : null;
    if (r){ G.rivalSpawned = true; k = r.captain.k; o = Object.assign({}, o, {noNem:true}); }
    const e = f(k, x, y, o);
    if (e && r){ markCaptain(e, r); note(`${e.name} of ${r.name} leads the raid.`); }
    return e;
  };
}
{ const f = recordNemesis; recordNemesis = function(e){ if (e && e.rivalId) return; return f(e); }; }
{ const f = killEnemy; killEnemy = function(e){ const was = e.dead; f(e); if (!was && e.rivalId) rivalCaptainDown(rivalById(e.rivalId), 'slain'); }; }
{ const f = commanderGone; commanderGone = function(e, mode){ f(e, mode); if (e.rivalId && mode === 'surrender') rivalCaptainDown(rivalById(e.rivalId), 'captured'); }; }
// rivals turn up on contracts, paid by the other side
{ const f = setupContract;
  setupContract = function(c){
    const r0 = f(c);
    try {
      if (inStoryNow() || ['brawl', 'drill', 'defend', 'siege', 'night', 'sortie'].includes(c.obj)) return r0;
      const r = ensureRivals().filter(r => rivalHostility(r) >= 3 && (r.sponsor ? c.faction === FACTION_RIVAL[r.sponsor] : c.tier >= 2)).sort((a, b) => rivalHostility(b) - rivalHostility(a))[0];
      if (!r || Math.random() >= 0.35) return r0;
      const camp = G.enemies.filter(e => !e.dead && e.dormant && dist(e, G.leader) > 600).sort(() => Math.random() - 0.5)[0];
      if (!camp) return r0;
      const e = spawnEnemy(r.captain.k, camp.x + 40, camp.y + 10, {noNem:true, dormant:true, group:camp.group, home:camp.home});
      if (e){ markCaptain(e, r); G.rivalField = r.id; note(`Word in camp: ${r.name} were paid to see this contract fail. ${e.name} is out there.`); }
    } catch (e) {}
    return r0;
  };
}
// rival raids, ahead of faction raids
{ const f = makeRaidContract; makeRaidContract = function(R){ const c = f(R); if (R.rival){ const r = rivalById(R.rival); c.rival = R.rival; if (r) c.brief = `${r.name} are coming for the camp, ${r.captain.name} at their head. Hold the Chapter House for ${c.minutes} minutes.`; } return c; }; }
{ const f = rollRaid;
  rollRaid = function(c, lines){
    if (c.obj === OBJ_DEFEND || META.deployments < 3 || META.raid || META.lastRaid === META.deployments - 1 || inStoryNow()) return f(c, lines);
    const r = ensureRivals().filter(r => rivalHostility(r) >= 2).sort((a, b) => rivalHostility(b) - rivalHostility(a))[0];
    if (r && Math.random() < Math.min(0.6, 0.15 * rivalHostility(r))){
      const lvl = META.leader ? META.leader.level : 1;
      META.raid = {host:r.host, tier:Math.min(3, Math.max(r.strength, 1 + Math.floor((lvl - 1) / 3))), faction:r.sponsor, rival:r.id};
      if (lines) lines.push(`<p class="bad"><b>${esc(r.name)} are on the road behind you.</b> ${esc(r.captain.name)} means to burn your camp. They will be there when you get back.</p>`);
      return;
    }
    return f(c, lines);
  };
}
{ const f = raidPanelHTML;
  raidPanelHTML = function(){
    let h = f(); const R = META.raid, r = R && R.rival && rivalById(R.rival); if (!r) return h;
    return h.replace(/<h2>[^<]*<\/h2>/, `<h2>${esc(r.name)}</h2><div class="tag">${esc(r.captain.name)}</div>${rivalHeroHolds(r) ? `<div class="desc" style="font-size:14px">${esc(HEROES[rivalDef(r).hero].name)} knows these people. Parley gets +1 step.</div>` : ''}`);
  };
}
{ const f = raidParlay;
  raidParlay = function(){
    const R = META.raid, r = R && R.rival && rivalById(R.rival), boost = r && rivalHeroHolds(r);
    if (boost && META.leader) META.leader._parlayBoost = 1;
    f();
    if (META.leader) delete META.leader._parlayBoost;
    if (boost && R.parlay && !R.parlay.mods.some(m => /word/.test(m))){ R.parlay.mods.push('+1 ' + HEROES[rivalDef(r).hero].name + "'s word"); renderPanel(); }
    if (r && R.parlay && R.parlay.res === 'walk'){ r.heat = Math.max(0, r.heat - 1); saveMeta(); }
  };
}
{ const f = leaderStats; leaderStats = function(L){ const s = f(L); if (L && L._parlayBoost) s.per += 1; return s; }; }
{ const f = contractDebrief;
  contractDebrief = function(c, result, lines){
    f(c, result, lines);
    try {
      if (c.obj === OBJ_DEFEND && c.rival){
        const r = rivalById(c.rival);
        if (r && r.status === 'active'){
          if (result === 'victory' && !G.enemies.some(e => e.rivalId && e.dead)) rivalHeat(r, -1, 'Beaten off. They will think twice.');
          else if (result !== 'victory'){ r.strength = Math.min(3, r.strength + 1); rivalHeat(r, 1, 'They sacked your camp, and they are bolder for it.'); }
        }
      } else rivalsAfterContract(c, result);
      if (G.rivalField && !G.enemies.some(e => e.rivalId === G.rivalField && e.dead)) rivalHeat(rivalById(G.rivalField), 1, 'Their captain got away.');
      for (const l of (G.rivalLines || [])) lines.push(l);
      G.rivalLines = [];
    } catch (e) {}
  };
}
{ const f = chronText;
  chronText = function(e){
    if (e.k !== 'rival') return f(e);
    if (e.what === 'broken') return `<b>${esc(e.name)}</b> are broken. Their banner hangs on the Trophy Rack.`;
    return `<b>${esc(e.captain)}</b> of ${esc(e.name)} is ${e.what === 'captured' ? 'taken prisoner' : 'slain'}.`;
  };
}

/* ------------------------------------------------------------ RTS FOG ---- */
function visionR(){
  if (!G || !G.mod) return 360;
  return Math.min(VISION_MAX, G.mod.radius * VISION_K * (1 + 0.15 * rank('scout')));
}
function rtsFogOn(){ return !!(G && G.rtsFog); }
function visSources(){
  if (!G) return [];
  if (G.visT === G.frame && G.visS) return G.visS;
  const R = visionR(), S = [{x:G.leader.x, y:G.leader.y, r:R}];
  for (const m of (G.squad || [])) if (m.state === 'up') S.push({x:m.x, y:m.y, r:R * 0.4});
  for (const d of (G.dogs || [])) if (d.state === 'hunt') S.push({x:d.x, y:d.y, r:R * 0.55});
  G.visT = G.frame; G.visS = S; return S;
}
function visNow(o){
  if (!rtsFogOn() || !o) return true;
  for (const s of visSources()){ const dx = o.x - s.x, dy = o.y - s.y; if (dx * dx + dy * dy < s.r * s.r) return true; }
  return false;
}
{ const f = setupContract;
  setupContract = function(c){
    const r = f(c);
    try { G.rtsFog = !!(MAP.seen && MAP.seen.indexOf(0) >= 0) && !['brawl', 'drill', 'defend'].includes(c.obj) && !inStoryNow(); } catch (e) { G.rtsFog = false; }
    return r;
  };
}
{ const f = updateContract;
  updateContract = function(){
    const r = f();
    try { if (G.rtsFog && G.frame % 6 === 3) for (const s of visSources()) if (s !== G.visS[0]) revealAround(s.x, s.y, Math.max(1, Math.round(s.r / CELL))); } catch (e) {}
    return r;
  };
}
const FOGV = {c:null};
let drawFieldFog = function(cx, cy){
  if (!rtsFogOn() || !MAP || !MAP.fog) return;
  // 1. explored but out of sight: dimmed, with soft holes where someone can see
  if (!FOGV.c || FOGV.c.width !== VW || FOGV.c.height !== VH){ FOGV.c = newCanvas(VW, VH); }
  const g = FOGV.c.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, VW, VH);
  g.fillStyle = 'rgba(8,6,4,.62)'; g.fillRect(0, 0, VW, VH);
  g.globalCompositeOperation = 'destination-out';
  for (const s of visSources()){
    const x = s.x - cx, y = s.y - cy; if (x < -s.r || y < -s.r || x > VW + s.r || y > VH + s.r) continue;
    const gr = g.createRadialGradient(x, y, s.r * (window.FOG_CORE ?? 0.6), x, y, s.r)   /* Q103: the clear core to 0.6 R, a wider softer rim */;
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, s.r, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(FOGV.c, cx, cy);
  // 2. never seen: black
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.filter = 'brightness(0)';
  ctx.drawImage(MAP.fog, 0, 0, MAP.w * CELL, MAP.h * CELL);
  ctx.restore();
};
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx49')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx49"><b>Rival companies.</b> ${RIVAL_DEFS.map(d => d.name).join(', ')} want your work. Working for their sponsor's enemies angers them, Standing with their sponsor counts, and angry rivals raid the camp or turn up on your contracts. Beat a captain twice and the company breaks. The Planning Table's Rivals scroll shows how they feel. The Empire, the Suderian Freemen and the Dust Cloaks Council never send raiders.</p>
      <p class="idx49"><b>Fog of war.</b> Black ground is unexplored. Dimmed ground has been seen, but nobody is there to watch it: you see the land, not who is on it. Vision is ${VISION_K} times the Command Radius; Scout, hounds and Squad Mates add to it.</p>`);
  };
}

/* ---- Index 49 audit fixes ------------------------------------------------ */
// The Bard's guide could stay switched on after the player left it another way, and a later
// prologue or replacement Leader then took the guided path and never created a Leader.
{ const f = newStory; newStory = function(){ GUIDE = null; return f.apply(this, arguments); }; }
{ const f = openCreate; openCreate = function(){ if (GUIDE && (founded() || inStoryNow() || META.leader)) GUIDE = null; return f.apply(this, arguments); }; }
{ const f = ldrFinish; ldrFinish = function(){ if (GUIDE && GUIDE.on && (inStoryNow() || founded())) GUIDE = null; return f.apply(this, arguments); }; }
/* ===== END INDEX 49 ======================================================= */


window.RIVALS_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    const svG = typeof G !== 'undefined' ? G : undefined;
    try {
      META = freshMeta();
      const rv = ensureRivals();
      ok('ensureRivals returns array', Array.isArray(rv));
      const r = {status: 'active', name: 'Test', heat: 0, host: 'bandits'};
      rivalHeat(r, 2, 'test');
      ok('rivalHeat increments heat on active rival', r.heat === 2);
      G = {rtsFog: true, leader: {x: 100, y: 120, dead: false}, squad: [{x: 150, y: 120, state: 'up'}]};
      ok('rtsFogOn reflects G.rtsFog', rtsFogOn() === true);
      const vs = visSources();
      ok('visSources includes leader and up squad mate', Array.isArray(vs) && vs.length >= 2 && vs[0].x === 100 && vs[0].r === visionR());
    } catch (e) { ok('threw', false, e && e.message); }
    finally { META = svM; G = svG; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
