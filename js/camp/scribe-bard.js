/* js/camp/scribe-bard.js (INT-1 step 2, 2026-11-16): INDEX 30 (the Scribe, the Chronicle), 31 (the camp bard).
   Cut unchanged from the inline script in index.html (old lines 14211 to 14660). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 30 - THE CHAPTER SCRIBE AND THE CHRONICLE
   A randomly generated Scribe, Librarian and Historian joins the camp with the
   Chapter Master. Click him (he wanders, and wears a gold ring so he is easy to
   find) and a scroll opens with everything he has written down, dated.
     RECORDED  contracts (objective, place, patron, result, kills, net gold),
               the fallen, hiring, spending, nemeses made, met again and
               struck down, the founding and every move of the Chapter.
     CALENDAR  one deployment is one season, four a year, starting in Spring,
               Year 617 (K99; the Founding is 616, prologue entries at t -3, -2). The date on the top bar and every chronicle entry use
               this calendar. It has its own counter, so moving the Chapter
               does not wind the clock back.
     SAVES     the Scribe and the Chronicle live in the save, and they move
               with the Chapter when it packs up. Older saves get a Scribe on
               first load; the Chronicle opens on that day and says earlier
               years were not kept. The date does not change for older saves.
     PORTRAIT  the Scribe has a painted portrait like everyone else, and the
               Portrait Studio can give him your own picture.
   To roll back, delete from this comment to END INDEX 30 and undo the small
   patches marked "Index 30" elsewhere in the file.
============================================================================ */
const CHR = {filter:'all', oldest:false, DEPTH:0, CAP:1200};
const CHR_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
SPECS.SCRIBE = {name:'Chapter Scribe', role:'Historian', color:'#5a4a8a', con:3, mg:0, luck:1, per:3, caster:false, attack:''};

/* ---- the calendar -------------------------------------------------------- */
function chron(opening){
  if (!META.chron){
    META.chron = {turn:Math.floor((META.deployments || 0) / 2), seq:0, log:[]};   // older saves keep their date: two deployments used to be a season
    const running = !!(META.founded || META.leader || META.deployments > 0);
    if (opening) chronAdd(opening.k, opening, true);
    else if (running) chronAdd('open', {earlier:true, n0:META.deployments || 0}, true);
  }
  return META.chron;
}
function chronDate(t){ return CHR_SEASONS[((t % 4) + 4) % 4] + ', Year ' + (617 + Math.floor(t / 4)); }
{ const f = seasonName;
  seasonName = function(){ return (typeof META !== 'undefined' && META && !inStoryNow()) ? chronDate(chron().turn) : f(); };
}
function chronAdd(kind, data, defer){
  const C = META.chron; C.seq++;
  C.log.push(Object.assign({k:kind, t:C.turn, n:C.seq}, data));
  if (C.log.length > CHR.CAP){          // keep the big events: drop the oldest spending, then the oldest of anything
    let i = C.log.findIndex(e => e.k === 'spend'); if (i < 0) i = 0; C.log.splice(i, 1);
  }
  if (!defer) saveMeta();
}
function chronSpend(label, amount){
  const C = chron(), last = C.log[C.log.length - 1];
  if (last && last.k === 'spend' && last.label === label && last.t === C.turn){ last.amt += amount; last.cnt = (last.cnt || 1) + 1; return; }
  chronAdd('spend', {label, amt:amount, cnt:1}, true);
}

/* ---- the Scribe ---------------------------------------------------------- */
const SCRIBE_EPITHETS = ['the Lettered', 'Inkfingers', 'the Patient', 'Ledger-hand', 'of the Long Memory', 'the Footnoted', 'Quillwright', 'the Careful'];
function ensureScribe(){
  if (META.scribe) return META.scribe;
  const race = rollRace(), sex = Math.random() < .5 ? 'f' : 'm';
  META.scribe = {id:'SCR', name:randomName(race, sex) + ' ' + pickOf(SCRIBE_EPITHETS), race, cls:'FREEMAN', spec:'SCRIBE', portSpec:pickOf(['MAGE', 'CLERIC']), sex, scribe:true, injuries:[]};
  saveMeta(); return META.scribe;
}
{ const f = personLook;
  personLook = function(p, isLeader){
    if (p && p.spec === 'SCRIBE'){
      const look = f(Object.assign({}, p, {spec:'PLAIN'}), false), fem = sexOf(p) === 'f';
      return Object.assign(look, {top:'#4a3a62', acc:'#d4af37', robe:true, robeCol:'#4a3a62', head:'cap', cape:null, capeTrim:null, legs:'#2e2638', weapon:null, armour:null, expr:'calm', hair:'#cfcabc', hairStyle:fem ? 'bun' : 'short', beard:!fem});
    }
    return f(p, isLeader);
  };
}
{ const f = personRole; personRole = q => q.kind === 'scribe' ? 'wander' : f(q); }
{ const f = campSync;
  campSync = function(){
    f();
    if (inStoryNow() || !META || !META.master) return;
    const S = ensureScribe();
    if (!CAMP.scribeQ){
      const m = CAMP.people.find(q => q.kind === 'master'); let x = m ? m.x + 34 : HUB.house.x + 40, y = m ? m.y + 10 : HUB.house.y + 40;
      if (m) for (const [dx, dy] of [[34, 10], [-34, 10], [0, -40], [0, 44], [-40, -30], [44, -30]]){ x = m.x + dx; y = m.y + dy; if (Math.hypot(x - (HUB.fire.x + 48), y - (HUB.fire.y + 32)) >= 50) break; }   /* Index 32: not on the bard's log */
      CAMP.scribeQ = {id:'scribe', kind:'scribe', p:S, x, y, tx:x, ty:y, wait:90, left:true, moving:false, seed:5};
    }
    CAMP.scribeQ.p = S;
    if (!CAMP.people.includes(CAMP.scribeQ)) CAMP.people.push(CAMP.scribeQ);
  };
}
const SCRIBE_LINES = ['Mark the day, mark the name.', 'Every coin in the ledger, every grave in the book.', 'History is mostly paperwork and funerals.', 'Spell the dead correctly. They are taken more seriously.', 'Another season, another page.', 'I do not forget. It is a flaw.'];
{ const f = drawCamp;
  drawCamp = function(){
    const S = CAMP.scribeQ;
    if (S && !G && CAMP.people.includes(S) && !(S.barkLife > 0) && Math.random() < 1 / 1100){
      const N = (META.nemeses || []);
      S.bark = N.length && Math.random() < .4 ? `${pickOf(N).name} is still out there. I have kept a page open.` : pickOf(SCRIBE_LINES); S.barkLife = 250;
    }
    f();
  };
}

/* ---- what gets written down ---------------------------------------------- */
// Deaths
{ const f = graveEntry;
  graveEntry = function(p, leader, cause, c){
    const r = f(p, leader, cause, c);
    try { if (!inStoryNow()){ chron(); chronAdd('death', {name:p.name, race:p.race, spec:p.spec, leader:!!leader, kills:p.kills || 0, cause, obj:c.obj, place:c.place}, true); } } catch (e) {}
    return r;
  };
}
// Contracts: one deployment is one season
{ const f = endDeployment;
  endDeployment = function(result){
    if (inStoryNow() || !META) return f(result);
    const d0 = META.deployments, t0 = META.treasury, ids = new Set(META.roster.map(p => p.id)), C0 = chron();
    f(result);
    try {
      if (typeof G === 'undefined' || !G || !(META.deployments > d0)) return;
      const c = G.contract, C = chron();
      for (const p of META.roster.filter(p => !ids.has(p.id))) chronAdd('hire', {name:p.name, race:p.race, spec:p.spec, cls:p.cls, cost:0, src:'after the contract'}, true);
      chronAdd('contract', {obj:c.obj, title:c.title || null, place:c.place, patron:c.patron, tier:c.tier, host:c.host, result:G.result, kills:G.kills || 0, bosses:G.bossKills || 0, gold:META.treasury - t0}, true);
      C.turn += (META.deployments - d0);
      saveMeta();
    } catch (e) {}
  };
}
// Hiring and spending: every place the game takes gold from the Treasury, and every way a person joins the roster
function chronWrap(name, labelFn, hireNote){
  const f = window[name]; if (typeof f !== 'function') return;
  window[name] = function(...a){
    if (CHR.DEPTH > 0 || inStoryNow() || !META) return f.apply(this, a);
    let label = ''; try { label = labelFn ? labelFn(a) : ''; } catch (e) {}
    const t0 = META.treasury, ids = new Set(META.roster.map(p => p.id)); CHR.DEPTH++;
    let r; try { r = f.apply(this, a); } finally { CHR.DEPTH--; }
    try {
      chron();
      const spent = t0 - META.treasury, added = META.roster.filter(p => !ids.has(p.id));
      for (const p of added) chronAdd('hire', {name:p.name, race:p.race, spec:p.spec, cls:p.cls, cost:added.length === 1 ? Math.max(0, spent) : 0, src:hireNote || ''}, true);
      if (!added.length && spent > 0) chronSpend(label || name, spent);
      if (added.length || spent > 0) saveMeta();
    } catch (e) {}
    return r;
  };
}
const chrNm = (list, id) => { const x = (list || []).find(y => y.id === id); return x ? x.name : null; };
chronWrap('hireCamp', null, '');
chronWrap('takeImport', a => 'Imported ' + ((a[0] && a[0].person && a[0].person.name) || 'a Squad Mate'), 'imported from a file');
chronWrap('prisonerAct', null, 'a freed prisoner');
chronWrap('rerollCamp', () => 'Re-rolled the recruits at the fire');
chronWrap('buyFacility', a => 'Built the ' + facility(a[0]).name);
chronWrap('gearClick', a => 'Bought ' + gear(a[0]).name);
chronWrap('trainAt', a => { const n = chrNm(META.roster, a[0]); return 'Training at the ' + facility(a[1]).name + (n ? ' for ' + n : ''); });
chronWrap('promoteOfficer', a => 'Promoted ' + (chrNm(META.roster, a[0]) || 'a Squad Mate') + ' to officer');
chronWrap('takeCommand', a => { const o = officers()[a[0]]; return 'Gave ' + (o ? o.name : 'an officer') + ' command of the squad'; });
chronWrap('buyDoctrine', a => { const d = DOCTRINES.find(x => x.id === a[0]); return 'Adopted the doctrine of ' + (d ? d.name : a[0]); });
chronWrap('payOffRaid', () => 'Paid off raiders');
chronWrap('raidDebrief', () => 'Lost to raiders');
/* Index 35: Rank'n stakes are written down as a result when the game ends (see the end of the file) */
chronWrap('payPrice', () => 'Paid the price of the old life');
chronWrap('buyCosm', a => 'Bought ' + (a[0] === 'dye' ? 'a rare banner dye' : a[0] === 'charge' ? 'a banner charge' : a[0] === 'trim' ? 'gold-thread trim' : 'a cosmetic') + ' from the Edel\u014ds Factor');
// Nemeses: made, met again, struck down
{ const f = recordNemesis;
  recordNemesis = function(e){
    if (inStoryNow() || !META || !e || !e.name) return f(e);
    const was = nemeses().find(n => n.name === e.name), g0 = was ? was.grudge : 0;
    f(e);
    try {
      const now = nemeses().find(n => n.name === e.name); if (!now) return;
      chron();
      if (!was) chronAdd('nemesis', {name:e.name, host:G.contract.host, grudge:1}, true);
      else if (now.grudge > g0) chronAdd('nemesis', {name:e.name, host:G.contract.host, grudge:now.grudge, again:true}, true);
    } catch (x) {}
  };
}
{ const f = pickNemesis;
  pickNemesis = function(k){
    const n = f(k);
    try { if (n && !inStoryNow()){ chron(); chronAdd('nemmet', {name:n.name, host:n.host, grudge:n.grudge}, true); } } catch (e) {}
    return n;
  };
}
{ const f = nemesisSlain;
  nemesisSlain = function(e, how){
    const was = nemeses().find(n => n.name === e.name);
    f(e, how);
    try { if (was && !inStoryNow()){ chron(); chronAdd('nemslain', {name:e.name, host:was.host, how:how || 'slain', grudge:was.grudge}, true); } } catch (x) {}
  };
}
// The founding and moving house
{ const f = finishFound;
  finishFound = function(){
    const moving = !!(FD && FD.fromCollapse), story = !!(FD && FD.fromStory);
    f();
    if (story || !META) return;
    try {
      ensureScribe();
      const C = chron();
      if (moving) chronAdd('move', {holding:META.holding}, false);
      else if (!C.log.some(e => e.k === 'found')) chronAdd('found', {holding:META.holding, master:META.master ? META.master.name : '', hero:META.master ? META.master.hero || null : null, ambition:META.ambition ? META.ambition.track : null}, false);
      CAMP.dirty = true;
    } catch (e) {}
  };
}

/* ---- the scroll ---------------------------------------------------------- */
const chrLc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const chrRace = p => (RACES[p.race] ? RACES[p.race].name : p.race) + ' ' + (SPECS[p.spec] ? SPECS[p.spec].name : p.spec);
function chronText(e){
  const B = s => `<b>${esc(s)}</b>`, host = HOSTS[e.host] ? HOSTS[e.host].name.replace(/^The /, 'the ') : null;
  if (e.k === 'open') return e.earlier ? `${B(META.scribe ? META.scribe.name : 'The Scribe')} opens the Chronicle. The Chapter had by now served ${e.n0} contract${e.n0 === 1 ? '' : 's'}, and the earlier years were not kept.` : `${B(META.scribe ? META.scribe.name : 'The Scribe')} opens the Chronicle.`;
  if (e.k === 'found'){ const H = HOLDINGS[e.holding], A = e.ambition && AMBITIONS[e.ambition];
    return `The Chapter is founded at the ${H ? H.name : 'holding'}${e.master ? `, under ${B(e.master)}, Chapter Master` : ''}.${A ? ` Charter Ambition: ${esc(A.name)}.` : ''}`; }
  if (e.k === 'move'){ const H = HOLDINGS[e.holding]; return `The Chapter packs up and moves to the ${H ? H.name : 'new holding'}.`; }
  if (e.k === 'contract'){
    const O = OBJECTIVES[e.obj] ? OBJECTIVES[e.obj].name : 'A contract', res = {victory:'Victory', withdrawn:'A fighting withdrawal', fled:'The company fled', fallen:'The squad was overrun'}[e.result] || e.result;
    return `${B(e.title || O)}${e.title ? ' (' + esc(O) + ')' : ''} at ${esc(e.place || 'the field')}, for ${esc(e.patron || 'a patron')}${host ? ` against ${esc(host)}` : ''}, Tier ${e.tier || 1}. ${res}: ${e.kills} slain${e.bosses ? `, ${e.bosses} commander${e.bosses === 1 ? '' : 's'}` : ''}.${e.gold ? ` Treasury ${e.gold > 0 ? '+' : ''}${e.gold}gp.` : ''}`; }
  if (e.k === 'death') return `${B(e.name)}, ${chrRace(e)}${e.leader ? ', Squad Leader' : ''}: ${chrLc(esc(e.cause || 'fell'))}${OBJECTIVES[e.obj] ? `, on ${esc(OBJECTIVES[e.obj].name)} at ${esc(e.place || 'the field')}` : ''}.`;
  if (e.k === 'hire') return `${B(e.name)}, ${chrRace(e)}, joins the roster${e.cost ? ` for ${e.cost}gp` : ''}${e.src ? ` (${esc(e.src)})` : ''}.`;
  if (e.k === 'spend') return `${esc(e.label)}${e.cnt > 1 ? ` (x${e.cnt})` : ''}: ${e.amt}gp.`;
  if (e.k === 'nemesis') return e.again ? `${B(e.name)}${host ? ` (${esc(host)})` : ''} escapes again. Grudge ${e.grudge}.` : `${B(e.name)}${host ? ` (${esc(host)})` : ''} escapes the Chapter. A nemesis is made.`;
  if (e.k === 'nemmet') return `${B(e.name)}, nemesis of the Chapter, takes the field${host ? ` with ${esc(host)}` : ''}. Grudge ${e.grudge}.`;
  if (e.k === 'nemslain') return `${B(e.name)}, nemesis, ${e.how === 'surrender' ? 'is taken in chains' : 'is struck down'}${host ? ` (${esc(host)})` : ''}.`;
  return '';
}
const CHR_TAG = {contract:['Contract', '#5a3a1a'], death:['Fallen', '#8a1a1a'], hire:['Hired', '#2a5a2a'], spend:['Spent', '#6a5a1a'], nemesis:['Nemesis', '#6a1a6a'], nemmet:['Nemesis', '#6a1a6a'], nemslain:['Nemesis', '#6a1a6a'], found:['Founded', '#1a4a6a'], move:['Moved', '#1a4a6a'], open:['Opened', '#1a4a6a']};
const CHR_FILTERS = [['all', 'All'], ['contract', 'Contracts'], ['death', 'The Fallen'], ['hire', 'Hiring'], ['spend', 'Spending'], ['nemesis', 'Nemeses']];
const chrIn = (f, k) => f === 'all' || k === f || (f === 'nemesis' && (k === 'nemmet' || k === 'nemslain')) || (f === 'spend' && k === 'wager');
function chronStats(log){
  const n = k => log.filter(e => e.k === k).length, K = log.filter(e => e.k === 'contract');
  return {contracts:K.length, won:K.filter(e => e.result === 'victory').length, fallen:n('death'), hired:n('hire'), spent:log.filter(e => e.k === 'spend').reduce((s, e) => s + e.amt, 0) + log.filter(e => e.k === 'hire').reduce((s, e) => s + (e.cost || 0), 0)
            + log.filter(e => e.k === 'works').reduce((a, e) => a + (e.act === 'start' || e.act === 'move' ? (e.cost || 0) : e.act === 'stop' ? -(e.back || 0) : 0), 0),   /* INT-1 stage 3 group 4: the Works spending, folded in from qol.js */
          made:log.filter(e => e.k === 'nemesis' && !e.again).length, slain:n('nemslain')};
}
function chronicleHTML(){
  const C = chron(), S = ensureScribe(), st = chronStats(C.log), fil = CHR.filter;
  const dir = CHR.oldest ? 1 : -1;     // true order of events: what happened first is written first
  const list = C.log.filter(e => chrIn(fil, e.k)).slice().sort((a, b) => dir * ((a.t - b.t) || (a.n - b.n)));
  let body = '', lastT = null, lastY = null;
  for (const e of list){
    if (e.t !== lastT){
      const y = 617 + Math.floor(e.t / 4);
      if (y !== lastY){ body += `<div style="font:bold 20px Georgia;color:var(--wood);border-bottom:2px solid #8a6d3a;margin:14px 0 2px">Year ${y}</div>`; lastY = y; }
      body += `<div style="font:bold 14px Georgia;color:var(--blood);margin:8px 0 2px;font-variant:small-caps">${CHR_SEASONS[((e.t % 4) + 4) % 4]}</div>`; lastT = e.t;
    }
    const tg = CHR_TAG[e.k] || ['', '#444'];
    body += `<div style="font:14px/1.45 Georgia;margin:3px 0 3px 8px"><span style="display:inline-block;min-width:64px;margin-right:8px;font:bold 14px Georgia;letter-spacing:.5px;color:${tg[1]};text-transform:uppercase">${tg[0]}</span>${chronText(e)}</div>`;
  }
  if (!list.length) body = `<div style="font:italic 14px Georgia;margin:18px 6px">Nothing of that kind has been written down yet.</div>`;
  const stat = `${st.contracts} contract${st.contracts === 1 ? '' : 's'} (${st.won} won) \u00b7 ${st.fallen} fallen \u00b7 ${st.hired} hired \u00b7 ${st.spent}gp spent \u00b7 ${st.made} nemes${st.made === 1 ? 'is' : 'es'} made, ${st.slain} slain`;
  const tabs = CHR_FILTERS.map(([k, n]) => `<button class="btn small ${fil === k ? 'gold' : ''}" style="font-size:14px;padding:3px 9px" onclick="CHR.filter='${k}';chronicleRender()">${n}</button>`).join('');
  return `<div style="background:#efe3c8;color:#2a2218;border:3px solid #8a6d3a;border-radius:6px;box-shadow:0 0 30px rgba(0,0,0,.6);width:min(760px,96vw)">
    <div style="height:16px;background:linear-gradient(#8a6d3a,#c9a85a 50%,#8a6d3a);border-radius:4px 4px 0 0"></div>
    <div style="padding:14px 22px 6px;display:flex;gap:14px;align-items:center;border-bottom:1px solid #b89a5a">
      <img src="${portraitURL(S, false)}" style="height:96px;width:auto;border:2px solid #8a6d3a;background:#3a3226">
      <div style="flex:1;text-align:left"><div style="font:bold 24px Georgia">The Chronicle of the Chapter</div>
        <div style="font:14px Georgia">${esc(S.name)}, Chapter Scribe, Librarian and Historian</div>
        <div style="font:italic 14px Georgia;color:#5a4a2a">Now: ${chronDate(C.turn)}</div></div>
      <button class="btn" onclick="closeChronicle()">CLOSE</button></div>
    <div style="padding:6px 22px;font:14px Georgia;color:#4a3a1a;text-align:left">${stat}</div>
    <div style="padding:2px 22px 6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${tabs}<span style="flex:1"></span>
      <button class="btn small" style="font-size:14px;padding:3px 9px" onclick="CHR.oldest=!CHR.oldest;chronicleRender()">${CHR.oldest ? 'Oldest first' : 'Newest first'}</button></div>
    <div id="chr-body" style="padding:0 22px 14px;max-height:calc(100vh - 290px);min-height:120px;overflow-y:auto;text-align:left">${body}</div>
    <div style="height:16px;background:linear-gradient(#8a6d3a,#c9a85a 50%,#8a6d3a);border-radius:0 0 4px 4px"></div></div>`;
}
function chronicleRender(){ const el = $('chronicle'); if (el) el.innerHTML = chronicleHTML(); }
function openChronicle(){
  let el = $('chronicle');
  if (!el){
    el = document.createElement('div'); el.id = 'chronicle';
    el.style.cssText = 'position:fixed;inset:0;z-index:41;background:rgba(10,8,6,.82);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 10px';
    el.addEventListener('click', ev => { if (ev.target === el) closeChronicle(); });
    document.body.appendChild(el);
  }
  el.style.display = 'flex'; chronicleRender(); SFX.play('pick');
}
function closeChronicle(){ const el = $('chronicle'); if (el) el.style.display = 'none'; }
window.addEventListener('keydown', e => { const el = $('chronicle'); if (e.key === 'Escape' && el && el.style.display !== 'none') closeChronicle(); });
// Clicking the Scribe opens the scroll.
{ const f = renderPanel;
  renderPanel = function(){
    const P = CAMP.panel;
    if (P && P.kind === 'person' && P.id === 'scribe' && !inStoryNow()){ CAMP.panel = null; $('camp-panel').classList.add('hidden'); openChronicle(); return; }
    f();
  };
}
/* ===== END INDEX 30 ======================================================= */


/* ============================================================================
   INDEX 31 - THE CAMP BARD
   A little bard sits on a log by the campfire with his lute. While the music
   plays, notes drift up from the lute in time with the tune. Click him to pick
   what he plays: The Campfire Jig, Embers (slow and mellow), The Full Tankard
   (a fast fiddle reel), Shuffle, or Quiet. The choice is kept in Settings and
   goes with the Chapter when it moves. His panel also has the Music volume.
     - Random like the Scribe: any race, either sex, a name and an epithet.
       Older saves get a bard on first load.
     - He wears a feathered tricorn, plays a lute and taps his boot.
     - If the music is off in Settings he still sits there, and says so.
   To roll back, delete from this comment to END INDEX 31 and undo the small
   patches marked "Index 31" elsewhere in the file.
============================================================================ */
SPECS.BARD = {name:'Camp Bard', role:'Troubadour', color:'#7a2a3a', con:3, mg:0, luck:2, per:3, caster:false, attack:''};
const BARD_EPITHETS = ['Sweet-String', 'Three-Chords', 'of the Cracked Lute', 'Merrypenny', 'the Off-Key', 'Fireside', 'Tuneful', 'Gold-Throat'];
const BARD_FEATHERED = ['DWARF', 'HALFLING', 'GOBLIN', 'FIRBOLG'];      // races whose painted Folk Hero wears a feathered cap
const BARD_LINES = ['A tune for tired boots?', 'Nobody tips a quiet bard.', 'This lute has outlived three bards.', 'Request what you like. I know four songs.', 'The fire likes the minor key.', 'Mind the strings. And the gold.'];
function ensureBard(){
  if (META.bard) return META.bard;
  const race = rollRace(), sex = Math.random() < .5 ? 'f' : 'm';
  META.bard = {id:'BRD', name:randomName(race, sex) + ' ' + pickOf(BARD_EPITHETS), race, cls:'FREEMAN', spec:'BARD', portSpec:BARD_FEATHERED.includes(race) ? 'FOLK_HERO' : 'CLERIC', sex, bard:true, injuries:[]};
  saveMeta(); return META.bard;
}
{ const f = personLook;
  personLook = function(p, isLeader){
    if (p && p.spec === 'BARD'){
      const look = f(Object.assign({}, p, {spec:'PLAIN'}), false), fem = sexOf(p) === 'f', h = hash(String(p.name));
      return Object.assign(look, {top:'#7a2a3a', acc:'#e0b040', legs:'#3a4a6a', cape:null, capeTrim:null, head:'tricorn', hair:['#6a4222', '#8a4a22', '#2a2018', '#c9a050', '#a0603a'][h % 5], hairStyle:fem ? 'long' : 'short', beard:false, weapon:null, armour:null, expr:'smirk'});
    }
    return f(p, isLeader);
  };
}

/* ---- the seated bard: size record only (step 5 phase B; 3D/soft figure draws him) ---- */
function bardSprite(p){
  const key = 'bard:' + p.race + p.sex + p.name;
  if (SPR[key]) return SPR[key];
  return SPR[key] = {frames:[], white:[], ax:15, ay:19, w:30, h:28, bard:true};
}
{ const f = personSprite; personSprite = function(p, isLeader){ return (p && p.spec === 'BARD') ? bardSprite(p) : f(p, isLeader); }; }
// he strums and taps with the tune, and sits still when it is quiet
function bardFrame(){ if (!MUS.playing()) return 2; const per = Math.max(8, Math.round(MUS.beat() * 60)); return ((CAMP.t / per) | 0) % 2; }
{ const f = drawSprite; drawSprite = function(spr, x, y, s, frame, left, flash){ return f(spr, x, y, s, (spr && spr.bard) ? bardFrame() : frame, left, flash); }; }

/* ---- in the camp ------------------------------------------------------------ */
{ const f = personRole; personRole = q => q.kind === 'bard' ? 'sit' : f(q); }
{ const f = anchorFor; anchorFor = function(q, role){ return role === 'sit' ? {x:q.sx, y:q.sy} : f(q, role); }; }
{ const f = campSync;
  campSync = function(){
    f();
    if (inStoryNow() || !META || !META.master) return;
    const B = ensureBard(), x = HUB.fire.x - 58, y = HUB.fire.y - 8;   /* Index 72 */   /* Index 47: the west log, facing the fire */
    if (!CAMP.bardQ) CAMP.bardQ = {id:'bard', kind:'bard', p:B, x, y, tx:x, ty:y, sx:x, sy:y, wait:0, left:false, moving:false, seed:7};
    CAMP.bardQ.p = B; Object.assign(CAMP.bardQ, {sx:x, sy:y, tx:x, ty:y}); if (Math.hypot(CAMP.bardQ.x - x, CAMP.bardQ.y - y) > 4){ CAMP.bardQ.x = x; CAMP.bardQ.y = y; }   /* Index 47 */
    if (!CAMP.people.includes(CAMP.bardQ)) CAMP.people.push(CAMP.bardQ);
  };
}
// He arrives with the Chapter Master and the Scribe.
{ const f = finishFound;
  finishFound = function(){
    const story = !!(FD && FD.fromStory);
    f();
    if (story || !META || !META.master) return;
    try { ensureBard(); CAMP.dirty = true; } catch (e) {}
  };
}
const BN = {list:[], last:-99};
const BARD_COL = {jig:'#ffd860', embers:'#bcd0ff', party:'#ff9a5a', iron:'#d8dff0', march:'#ff7a6a'};   /* Index 34 */
function drawNote(g, x, y, sz, col, kind, a){
  g.save(); g.globalAlpha = a; g.lineCap = 'round';
  for (const pass of [0, 1]){
    const o = pass ? 0 : 1.4; g.fillStyle = g.strokeStyle = pass ? col : 'rgba(24,14,6,.7)'; g.lineWidth = 1.1 + o * .6;
    const head = (hx, hy) => { g.beginPath(); g.ellipse(hx, hy, sz * .42 + o * .5, sz * .3 + o * .5, -.45, 0, 7); g.fill(); };
    if (kind === 0){
      head(x, y); const sx = x + sz * .36;
      g.beginPath(); g.moveTo(sx, y - 1); g.lineTo(sx, y - sz * 1.15); g.stroke();
      g.beginPath(); g.moveTo(sx, y - sz * 1.15); g.quadraticCurveTo(x + sz * .95, y - sz * .85, x + sz * .66, y - sz * .38); g.stroke();
    } else {
      const x2 = x + sz * .85, s1 = x + sz * .36, s2 = x2 + sz * .36;
      head(x, y); head(x2, y - sz * .12);
      g.beginPath(); g.moveTo(s1, y - 1); g.lineTo(s1, y - sz * 1.1); g.moveTo(s2, y - sz * .13); g.lineTo(s2, y - sz * 1.22); g.stroke();
      g.lineWidth = 1.8 + o * .6; g.beginPath(); g.moveTo(s1, y - sz * 1.1); g.lineTo(s2, y - sz * 1.22); g.stroke();
    }
  }
  g.restore();
}
function bardNotes(B){
  const due = MUS.takeNotes(), song = MUS.state().song, t = CAMP.t;
  for (const n of due){
    if (BN.list.length >= 6 || t - BN.last < 14) continue;   /* Index 47: fewer notes */
    BN.last = t; const dir = B.left ? -1 : 1;
    BN.list.push({x:B.x + dir * 30 + rnd(-4, 4), y:B.y - 17 + rnd(-3, 3), vx:dir * rnd(.05, .3) + rnd(-.12, .12), vy:-rnd(.5, .85), age:0, life:rnd(120, 170), ph:rnd(0, 6.3), sz:rnd(5.2, 6.8), kind:n.d >= 0.3 ? 0 : (Math.random() < .5 ? 1 : 0)});
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const col = BARD_COL[song] || '#ffd860';
  BN.list = BN.list.filter(n => n.age++ < n.life);
  for (const n of BN.list){
    n.x += n.vx + Math.sin(n.age / 16 + n.ph) * .35; n.y += n.vy;
    const x = n.x - CAMP.cam.x, y = n.y - CAMP.cam.y; if (x < -40 || x > VW + 40 || y < -40 || y > VH + 40) continue;
    drawNote(ctx, x, y, n.sz * (0.8 + Math.min(1, n.age / 30) * .3), col, n.kind, 0.5 * Math.min(1, n.age / 12, (n.life - n.age) / 40));   /* Index 47: see-through */
  }
}
{ const f = drawCamp;
  drawCamp = function(){
    const B = CAMP.bardQ;
    if (B && !G && CAMP.people.includes(B) && !(B.barkLife > 0) && Math.random() < 1 / 1300){ B.bark = pickOf(BARD_LINES); B.barkLife = 250; }
    f();
    if (G || !B || !CAMP.people.includes(B)){ BN.list.length = 0; return; }
    bardNotes(B);
  };
}

/* ---- his panel -------------------------------------------------------------- */
function bardPick(id){
  MUS.start(); MUS.setSong(id);
  const B = CAMP.bardQ; if (B){ B.bark = id === 'off' ? 'Fine. I will tune the lute.' : id === 'party' ? 'Now we are talking!' : id === 'embers' ? 'Aye. Low and slow.' : id === 'shuffle' ? 'Whatever the fire wants.' : id === 'iron' ? 'The war song, played gently. It suits it.' : id === 'march' ? 'Boots in step. Slowly, this time.' : 'The old one. Good.'; B.barkLife = 220; }
  if (CAMP.panel) renderPanel();
}
function bardPanelHTML(){   // GD 22 Nov (U-slice 9b): music is off, so the panel keeps only close, name, portrait, tag and one speech line
  const B = ensureBard();
  return `<button class="x" onclick="closePanel()" title="Close">&#215;</button><h2>${esc(B.name)}</h2><img class="pimg" src="${portraitURL(B, false)}"><div class="tag">Camp Bard</div>
    <div class="speech">"${pickOf(BARD_LINES)}"</div>`;
}
const SONG_NAME = {}; for (const id of MUS.SONG_IDS) SONG_NAME[id] = MUS.SONGS[id].name;   /* Index 34 */
{ const f = renderPanel;
  renderPanel = function(){
    const P = CAMP.panel;
    if (P && P.kind === 'person' && P.id === 'bard' && !inStoryNow()){ $('camp-panel').innerHTML = bardPanelHTML(); return; }
    f();
  };
}
/* ===== END INDEX 31 ======================================================= */


