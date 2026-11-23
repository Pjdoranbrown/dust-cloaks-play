/* js/ui/screens.js (INT-1 step 2, 2026-11-16): SCREENS, DEBRIEF, BOOT.
   Cut unchanged from the inline script in index.html (old lines 5103 to 5617). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   SCREENS
============================================================================ */
const $ = id => document.getElementById(id);
const SCREENS = ['screen-title','screen-create','screen-roster','screen-camp','screen-table','screen-manual','screen-debrief','overlay-pause','overlay-parlay'];
function hideAll(){ for (const s of SCREENS) $(s).classList.add('hidden'); for (const s of ['topbar','camp-panel','camp-hint']) $(s).classList.add('hidden'); }
function show(id){ hideAll(); $(id).classList.remove('hidden'); if (!G){ $('topbar').classList.remove('hidden'); renderTopbar(); startCamp(); } }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img = (src, cls = 'ic') => src ? `<img class="${cls}" src="${src}">` : '';

function mateLine(p){
  const s = mateStats(p), mg = SPECS[p.spec].caster ? ` \u00b7 Mg ${s.magic}` : '';
  return `Con ${s.con} \u00b7 Mv ${s.move} \u00b7 M ${s.melee} \u00b7 R ${s.ranged}${mg}`;
}
/* the key on a mate card is the bar's (ABIL33.keyOf, the squad place) in a fight; outside one there is no place yet, so no number (checklist N 3) */
function abilKeyTag(p){
  try { if (window.ABIL33 && typeof G !== 'undefined' && G){ const u = (G.squad || []).find(s => s && s.p === p) || (G.leader && G.leader.p === p ? G.leader : null); if (u && ABIL33.live() && !G.over) return '[' + ABIL33.keyOf(u) + '] ';
      } } catch (e) {}
  return '';                                                        // S6 1c criterion 9a: a card outside a fight names the ability and prints no key
}
function mateCardHTML(p, extra = ''){
  const inj = p.injuries.length ? `<div class="desc" style="color:#8b0000">${p.injuries.map(i => INJURIES.find(x=>x.id===i).name).join(', ')}</div>` : '';
  return `${img(portraitURL(p, false))}<div class="ttl">${esc(p.name)}</div>
    <div class="role" style="color:${SPECS[p.spec].color}">${RACES[p.race].name} ${CLASSES[p.cls].name} ${SPECS[p.spec].name}</div>
    <div class="stat">${mateLine(p)}</div>
    <div class="desc" style="color:#5a4a2a">Ability ${abilKeyTag(p)}${ABILITIES[p.spec].name}</div>
    <div class="desc">Advancements ${p.adv} / ${advCap()} \u00b7 Effective Level ${1+p.adv}${p.kills ? ' \u00b7 ' + p.kills + ' slain' : ''}</div>${(p.picks||[]).length ? `<div class="desc" style="color:#5a4a2a">Learnt: ${p.picks.map(id => (CARDS.find(c => c.id === id) || {}).name).join(', ')}</div>` : ''}${p.trainingAt && p.resting ? `<div class="desc" style="color:#226b2a">Training at the ${facility(p.trainingAt).name}: ${esc(p.trainingLabel || '')}</div>` : ''}${bondLine(p)}${inj}${extra}`;
}

/* ---------------------------------------------------------------------------
   TITLE
--------------------------------------------------------------------------- */
function resetSave(){
  if (!gate('Start a new campaign? The Leader, roster, Treasury and camp will all be lost.' + ((META.annals || []).length ? ' So will the Annals of past Chapters and the legacies they left.' : ''), () => resetSave())) return;
  META = freshMeta(); saveMeta(); applySkin(); showSplash();
}

/* ---------------------------------------------------------------------------
   LEADER CREATION
--------------------------------------------------------------------------- */
let CR = null;
function openCreate(){ CR = {step:'race'}; renderCreate(); show('screen-create'); }
function crPreview(){
  if (!CR.race || !CR.cls || !CR.spec) return '';
  const s = leaderStats({race:CR.race, cls:CR.cls, spec:CR.spec, level:1, injuries:[], burnt:0});
  const wf = s.rawLuck > 6 ? ` (Luck over 6: ${s.rawLuck-6} becomes a Windfall of ${(s.rawLuck-6)*60}gp)` : '';
  return `<div class="stat" style="max-width:520px;background:rgba(255,255,255,.6)">
    Con ${s.con} \u00b7 Wounds ${s.maxWounds} \u00b7 Move ${s.move} \u00b7 Melee ${s.melee} \u00b7 Ranged ${s.ranged}${SPECS[CR.spec].caster?' \u00b7 Magic '+s.magic:''} \u00b7 Luck ${s.luck} \u00b7 Personality ${s.per}${wf}</div>`;
}
function renderCreate(){
  const h = $('create-inner'); let body = '', title = '';
  if (CR.step === 'race'){
    title = 'Choose a Race';
    body = Object.entries(RACES).map(([k, r]) => `<div class="card" onclick="CR.race='${k}';CR.step='cls';renderCreate()">
      ${img(raceIconURL(k))}<div class="ttl">${r.name}</div><div class="stat">Con ${r.con>=0?'+':''}${r.con} \u00b7 Move ${r.move}<br>M ${r.m>=0?'+':''}${r.m} \u00b7 R ${r.r>=0?'+':''}${r.r} \u00b7 Luck ${r.luck>=0?'+':''}${r.luck}</div>
      <div class="desc">${r.tag}</div></div>`).join('');
  } else if (CR.step === 'cls'){
    title = 'Choose a Social Class';
    body = CLASS_ORDER.map(k => { const c = CLASSES[k]; return `<div class="card" onclick="CR.cls='${k}';CR.step='spec';renderCreate()">
      <div class="ttl">${c.name}</div><div class="desc">${c.perk}</div><div class="fl">${c.draw}</div></div>`; }).join('');
  } else if (CR.step === 'spec'){
    title = 'Choose a Specialty';
    body = SPEC_ORDER.map(k => { const s = SPECS[k]; return `<div class="card" onclick="chooseSpec('${k}')">
      ${img(portraitURL({race:CR.race, spec:k, name:'preview', id:9}, true))}<div class="ttl" style="color:${s.color}">${s.name}</div><div class="role">${s.role}</div><div class="desc">${s.attack}</div><div class="fl">Ability [${ABILITIES[k].key}] ${ABILITIES[k].name}: ${ABILITIES[k].text}</div></div>`; }).join('');
  } else if (CR.step === 'pick'){
    title = 'Pick 1 Talent';
    body = crPickOpts(CR.spec).map(c => `<div class="card" onclick="CR.pick='${c.id}';CR.step='name';renderCreate()">
      ${img(badgeURL(c.glyph, SPECS[c.spec].color), 'ic sm')}<div class="tag">${c.tag}</div><div class="ttl">${c.name}</div><div class="desc">${c.text(1)}</div>
      <div class="fl">Starts every contract at rank 1.</div></div>`).join('');
  } else {
    title = 'Sign the Charter';
    if (!CR.sex) CR.sex = Math.random() < .5 ? 'f' : 'm';
    if (!CR.name) CR.name = randomName(CR.race, CR.sex);
    body = `<div style="display:flex;flex-direction:column;align-items:center">
      ${img(portraitURL({race:CR.race, spec:CR.spec, name:'preview' + CR.sex, sex:CR.sex, id:9}, true))}
      <div style="display:flex;gap:8px;margin:6px">
        <button class="btn small ${CR.sex === 'f' ? 'gold' : ''}" onclick="crSex('f')">WOMAN</button>
        <button class="btn small ${CR.sex === 'm' ? 'gold' : ''}" onclick="crSex('m')">MAN</button></div>
      <div style="display:flex;gap:10px;margin:10px"><input class="name" id="cr-name" value="${esc(CR.name)}">
      <button class="btn small" onclick="CR.name=randomName(CR.race, CR.sex);renderCreate()">Randomise</button></div>
      <button class="btn gold" onclick="finishCreate()">SIGN CONTRACT</button></div>`;
  }
  h.innerHTML = `<h1 style="font-size:44px">${title}</h1>${crPreview()}<div class="row" style="margin-top:10px">${body}</div>
    <div><button class="btn small" onclick="${CR.step==='race'?'renderTitle()':'CR={step:\'race\'};renderCreate()'}">${CR.step==='race'?'CANCEL':'START OVER'}</button></div>`;
}
function crSex(x){ const el = $('cr-name'), typed = el && el.value; if (!typed || FEMALE_NAMES.has(typed) || Object.values(NAMES).some(g => g.m.includes(typed))) CR.name = randomName(CR.race, x); else CR.name = typed; CR.sex = x; renderCreate(); }
function crPickOpts(k){ return typeof ldrPickOpts === 'function' ? ldrPickOpts(k) : CARDS.filter(c => c.ability && c.spec === k); }
function chooseSpec(k){
  CR.spec = k;
  CR.step = crPickOpts(k).length ? 'pick' : 'name';   // K76: the same Level 1 picks as the live Leader screen (guided-start.js ldrPickOpts)
  renderCreate();
}
function finishCreate(){
  const el = $('cr-name'), name = ((el && el.value) || '').trim() || randomName(CR.race);
  const L = makeLeader(CR.race, CR.cls, CR.spec, name); if (CR.sex) L.sex = CR.sex;
  if (CR.pick) L.picks.push(CR.pick);
  META.leader = L; META.board = null; saveMeta();
  renderTitle();
  if (!META.bannerSet){ centreCamOn(HUB.house.x, HUB.house.y); openPanel('banner', 'banner'); }
}

/* ---------------------------------------------------------------------------
   ROSTER
--------------------------------------------------------------------------- */
function openRoster(){ renderRoster(); show('screen-roster'); }
function renderRoster(){
  const over = META.roster.length > rosterCap();
  const cards = META.roster.map((p, i) => {
    const rest = p.away ? `<div class="desc" style="color:#8b0000">On detachment: sits out this contract</div>` : p.resting && !p.trainingAt ? `<div class="desc" style="color:#8b0000">Resting: sits out the next contract</div>` : '';
    const prom = has('command') && p.adv >= 2 ? `<button ${canPromote(p) && META.treasury >= 100 ? '' : 'disabled'} title="${officers().length >= OFFICER_CAP ? 'The officers are full' : ''}" onclick="promoteOfficer(${p.id})">Promote to officer (100gp)</button>` : '';
    return `<div class="card static">${mateCardHTML(p, rest)}${typeof trainOptsHTML === 'function' ? trainOptsHTML(p) : ''}
      <div class="mini">${prom}${canRetire(p) ? `<button onclick="RET=${i};renderRoster()">Retire to camp</button>` : ''}<button onclick="releaseMate(${i})">Release</button></div>
      ${RET === i ? retirePicker(p, i) : ''}</div>`;
  }).join('') || '<p class="sub">No Squad Mates yet. Hire them below, or at the campfire.</p>';
  const fallen = META.memorial.length ? `<h2 class="sec">The Fallen</h2><div class="sub">${META.memorial.length} of the Chapter rest in the graveyard on the camp map. <a href="#" onclick="renderTitle();openPanel('grave','grave');return false">Visit the graves</a>.</div>` : '';
  $('roster-inner').innerHTML = `<h1 style="font-size:44px">Roster</h1>
    <div class="money">Treasury: ${META.treasury}gp</div>
    ${leadershipHTML()}
    ${advanceBlock()}
    <h2 class="sec">Squad Mates (${META.roster.length} / ${rosterCap()})</h2>
    <div class="sub">Five deploy; the rest wait on the Reserve Bench (${benchCap()} places${has('tents')?'':', Tents add 2'}). Train them at camp facilities: click a building on the camp map. A Squad Mate who is maimed, or has 3 or more Advancements, can retire to staff a facility.</div>
    ${over ? `<div class="sub" style="color:#8b0000;font-weight:bold">Over capacity. Release someone before the next muster.</div>` : ''}
    <div class="row">${cards}</div>
    <h2 class="sec">Hiring Line</h2><div class="advbox" style="max-width:760px">${hiringHTML()}${importBlockHTML()}</div>${retiredHTML()}${fallen}
    <div><button class="btn small" onclick="renderTitle()">BACK</button></div>`;
}
function releaseMate(i){ if (!gate(`Release ${esc(META.roster[i].name)} from the company?`, () => releaseMate(i))) return; unbond(META.roster[i]); META.roster.splice(i,1); saveMeta(); renderRoster(); refreshUI(); }
let RET = -1;
function retirePicker(p, i){
  const open = FACILITIES.filter(f => has(f.id) && VETERANS[f.id] && !staffOf(f.id));
  if (!open.length) return '<div class="desc" style="color:#8b0000">No built facility needs staff.</div>';
  return '<div class="mini" style="flex-direction:column">' + open.map(f => `<button onclick="retireMate(${i},'${f.id}')">${f.name}${vetMatches(p, f.id) ? ' (Mastery)' : ''}</button>`).join('') + '<button onclick="RET=-1;renderRoster()">Cancel</button></div>';
}
function retireMate(i, fid){
  const p = META.roster[i]; unbond(p);
  META.roster.splice(i, 1); p.facility = fid; (META.retired = META.retired || []).push(p);
  RET = -1; checkMilestones(null); saveMeta(); SFX.play('pick'); renderRoster(); refreshUI();
}
function retiredHTML(){
  const r = META.retired || []; if (!r.length) return '';
  return '<h2 class="sec">Retired Veterans</h2><div class="row">' + r.map(p => `<div class="card static" style="width:190px">${img(portraitURL(p, false), 'ic sm')}<div class="ttl" style="font-size:15px">${esc(p.name)}</div>
    <div class="role">${RACES[p.race].name} ${CLASSES[p.cls].name} ${SPECS[p.spec].name}</div><div class="desc">Staffs the ${facility(p.facility).name}${vetMatches(p, p.facility) ? ': <b>Veteran Mastery</b>' : ''}</div></div>`).join('') + '</div>';
}
function unbond(p){ if (!p.bond) return; for (const q of META.roster) if (q.bond === p.id) q.bond = null; p.bond = null; }
function bondLine(p){ if (!p.bond) return ''; const q = (META.roster || []).find(x => x.id === p.bond) || (G && G.squad.map(m => m.p).find(x => x.id === p.bond)); return q ? `<div class="desc" style="color:var(--blood)">Comrade Bond: ${esc(q.name)}</div>` : ''; }

/* ---------------------------------------------------------------------------
   CAMP & QUARTERMASTER
--------------------------------------------------------------------------- */
function openCamp(){ renderCamp(); show('screen-camp'); }
function gearPrice(g){
  let k = 1;
  if (has('leather') && g.slot === 'armour' && g.light) k *= 0.8;
  if (mastery('blacksmith') && g.req.includes('blacksmith')) k *= 0.75;
  if (allied('dwarves') && g.slot === 'armour' && !g.light) k *= 0.8;
  if (perk('wealth', 6)) k *= 0.8;
  if (META.halfMount === g.id) k *= 0.5;
  if (edelosFreeOK(g)) return 0;
  return Math.round(g.cost * k);
}
function buyDoctrine(id){
  const d = DOCTRINES.find(x => x.id === id);
  if (hasDoc(id) || !docReqMet(d) || META.treasury < d.cost) return;
  META.treasury -= d.cost; (META.doctrines = META.doctrines || {})[id] = true; SFX.play('pick'); saveMeta(); refreshUI();
}
function renderCamp(){
  let html = `<h1 style="font-size:40px">Quartermaster</h1><div class="money">Treasury: ${META.treasury}gp</div>
    <div class="sub">Squad Standard cards: one card per slot arms the whole squad. Up to two Specialist Kits. Facilities are built on the camp map; Doctrines are on the planning table.</div>`;
  const slots = [['armour','Armour'],['shield','Shield'],['melee','Melee Weapon'],['ranged','Ranged Weapon'],['kit','Specialist Kits'],['mount','Squad Asset: Mount']];
  for (const [slot, label] of slots){
    html += `<div style="width:100%;text-align:center;font-weight:bold;color:var(--ink-soft);margin:12px 0 4px">${label}</div><div class="row">`;
    for (const g of GEAR.filter(x => x.slot === slot)){
      const owned = META.gear.owned.includes(g.id);
      const eq = slot === 'kit' ? META.gear.kits.includes(g.id) : META.gear[slot] === g.id;
      const locked = g.req.filter(r => !has(r)), price = gearPrice(g);
      let stats = '';
      if (slot === 'armour') stats = `AC ${g.ac} \u00b7 Shift -${g.shift} \u00b7 Move ${g.mv}${g.ward?' \u00b7 +1 Ward Token':''}${g.graze0?' \u00b7 Grazes = 0':''}`;
      if (slot === 'shield') stats = `Shield Pool ${g.pool}`;
      if (slot === 'melee') stats = `Base Damage Skill ${g.dmg}`;
      if (slot === 'ranged') stats = `Base Damage Skill ${g.dmg} \u00b7 Range ${g.range}`;
      const status = eq ? '<div class="owned">EQUIPPED</div>' : owned ? '<div class="owned">OWNED: click to equip</div>'
        : locked.length ? `<div class="cost">Needs ${locked.map(r=>facility(r).name).join(' + ')}</div>` : `<div class="cost">${price}gp</div>`;
      const can = eq ? (slot === 'kit') : (owned || (!locked.length && META.treasury >= price));
      html += `<div class="card ${eq?'sel':''} ${can||eq?'':'off'}" style="width:180px" onclick="gearClick('${g.id}')">
        ${img(gearURL(g), 'ic sm')}<div class="ttl" style="font-size:15px">${g.name}</div>${stats?`<div class="stat">${stats}</div>`:''}
        ${g.note?`<div class="desc">${g.note}</div>`:''}${status}</div>`;
    }
    html += `</div>`;
  }
  html += `<div><button class="btn small" onclick="renderTitle()">BACK</button></div>`;
  $('camp-inner').innerHTML = html;
}
function buyFacility(id){
  const f = facility(id);
  if (has(id) || META.treasury < facCost(f) || (f.req && !has(f.req))) return;
  META.treasury -= facCost(f); META.facilities[id] = true;
  if (id === 'command' && META.leader && leaderStats(META.leader).rawLuck > 6) META.treasury += 60;
  checkMilestones(null); saveMeta(); renderCamp(); renderCampVisuals();
}
function gearClick(id){
  const g = gear(id), G2 = META.gear;
  if (!G2.owned.includes(id)){
    const price = gearPrice(g);
    if (g.req.some(r => !has(r)) || META.treasury < price) return;
    if (price === 0 && edelosFreeOK(g)) META.edFree = META.deployments;
    META.treasury -= price; ARM.add(id); if (META.halfMount === id) META.halfMount = null;   /* INDEX A30 */
  }
  if (g.slot === 'kit'){ const i = G2.kits.indexOf(id); if (i >= 0) G2.kits.splice(i,1); else { if (G2.kits.length >= 2) G2.kits.shift(); G2.kits.push(id); } }
  else G2[g.slot] = id;
  saveMeta(); renderCamp();
}

/* ---------------------------------------------------------------------------
   MUSTER
--------------------------------------------------------------------------- */
let MU = null;
function toggleMuster(id){ const i = MU.ids.indexOf(id); const q = META.roster.find(p => p.id === id); if (i < 0 && q && (q.away || q.resting)) return;   /* Index DET1: away/resting cards can't be picked */
  if (i >= 0) MU.ids.splice(i,1); else if (MU.ids.length < 5) MU.ids.push(id); renderMuster(); }
function deploy(){ startDeployment(META.board[MU.contract], MU.ids.slice()); }
function rollCouncil(){
  const c = META.board[MU.contract], L = META.leader, s = leaderStats(L), diff = councilDiff(c);
  const pool = [{label:'Leader Personality', skill:s.per}, {label:'Chapter Master (Charter Rank)' + (cmMatches(c.patron) ? ', one of their own' : ''), skill:Math.min(6, L.level) + (cmMatches(c.patron) ? 1 : 0)}];
  if (has('command')) pool.push({label:'Command Tent', skill:2});
  if (META.elder) pool.push({label:'Council Elder: ' + META.elder.name, skill:2});   /* Index 48 */
  if (mastery('command')) pool.push({label:'Veteran in the Command Tent', skill:2});
  if (perk('fame', 3)) pool.push({label:'Fame', skill:2});
  if (allied('empire')) pool.push({label:'Letter of Marque', skill:2});
  c.council = pool.map(d => { const r = attackDie(d.skill, diff);
    return {label:d.label, skill:clampSkill(d.skill), face:r.face, res:(r.out === 'solid' || r.out === 'crit') ? 'success' : r.out === 'graze' ? 'partial' : 'miss'}; });
  c.picks = c.council.filter(d => d.res === 'success').length + (perk('dominion', 9) ? 1 : 0);
  st().bestCouncil = Math.max(st().bestCouncil || 0, c.picks);
  checkMilestones(null); saveMeta(); renderMuster();
}
function pickEdge(id){
  const c = META.board[MU.contract];
  if (c.picks <= 0 || c.edges.includes(id)) return;
  c.edges.push(id); c.picks--; saveMeta(); renderMuster();
}

/* ---------------------------------------------------------------------------
   PAUSE / WITHDRAW
--------------------------------------------------------------------------- */
function togglePause(){
  if (!G || G.over || PARLAY) return;
  G.paused = !G.paused;
  if (!G.paused){ $('overlay-pause').classList.add('hidden'); return; }
  const half = progress() >= 0.5;
  const mw = Math.min(900, window.innerWidth - 60), mh = Math.round(Math.min(window.innerHeight - 290, mw * MAP.h / MAP.w));
  const cw = Math.round(mh * MAP.w / MAP.h);
  const [big, small] = objectiveLine();
  $('pause-inner').innerHTML = `<h1 style="font-size:28px;margin:0">${OBJECTIVES[G.obj].name}</h1>
    <div class="sub" style="color:#ddd">${big} \u00b7 ${small.toLowerCase()}</div>
    <canvas id="pause-map" width="${cw}" height="${mh}" style="image-rendering:pixelated;margin:6px 0;max-width:96vw"></canvas>
    <div class="sub" style="color:#ddd">${esc(briefOf(G.contract))}</div><div class="sub" style="color:#bbb;font-size:13px">Everything is drawn as what it is: commanders, strongboxes, cages, chests, nests, beacons and the turned Blip Tokens. ? is an unscouted Blip Token. Dark ground is not yet scouted.</div>
    <div class="sub" style="color:#ccc">${half ? (hasDoc('ledgerseal') ? 'Enough of the job is done to withdraw on full pay (Ledger and Seal).' : 'Enough of the job is done to withdraw on half pay.') : 'Withdraw now and the patron pays nothing.'}</div>
    <div><button class="btn" onclick="togglePause()">RESUME</button>
    <button class="btn" onclick="askWithdraw()" data-tip="Your Leader talks the squad out: Personality against the enemy's grip on the field.">WITHDRAW</button></div>${withdrawNote()}
    <div id="pause-settings">${settingsHTML(true)}</div>`;
  $('overlay-pause').classList.remove('hidden');
  drawPauseMap($('pause-map'));
}

/* ============================================================================
   DEBRIEF - pay, injuries, the dead, and the Leader's progress
============================================================================ */
function injuryCheck(maxCon, who, lines){
  let f = rollDie(maxCon + (has('hospital') ? 1 : 0));
  if (f < 5 && mastery('hospital') && !G.hospitalReroll){ G.hospitalReroll = true; const f2 = rollDie(maxCon + 1);
    lines.push(`<p>The veteran in the Field Hospital re-rolls ${esc(who)}'s injury check: ${f} becomes ${f2}.</p>`); f = f2; }
  if (f > 5){ lines.push(`<p class="good">${esc(who)} recovers fully (injury roll ${f}).</p>`); return null; }
  if (f === 5){ lines.push(`<p>${esc(who)} is battered and rests for one contract (injury roll ${f}).</p>`); return 'rest'; }
  const inj = INJURIES[d6()-1];
  lines.push(`<p class="bad">${esc(who)} is maimed: <b>${inj.name}</b>: ${inj.eff} (injury roll ${f}).</p>`);
  return inj.id;
}
var Q44 = {on: true, share: 0.5};   // Patrick Q44 A: the share of field coin dropped when a job is fled
function endDeployment(result){
  if (G.over) return;
  G.over = true; G.paused = true;
  $('overlay-pause').classList.add('hidden');
  const L = META.leader, c = G.contract, lines = [];
  if (result === 'withdrawn' && progress() < 0.5 && !G.sallyExit) result = 'fled';   /* GD 6b: the sally gate is the field's planned exit and always ends 'withdrawn' */
  G.result = result;
  const head = {victory:'CONTRACT COMPLETE', withdrawn:'A FIGHTING WITHDRAWAL', fled:G.failHead || 'THE COMPANY FLEES', fallen:G.leaderSlain ? 'THE LEADER IS DEAD' : 'THE SQUAD IS OVERRUN'}[result];
  SFX.play(result === 'victory' ? 'win' : result === 'withdrawn' ? 'level' : 'down');
  const how = contractHow(c, result) || (c.obj === 'hold' ? `Held the field for <b>${G.sec/60|0}m ${G.sec%60}s</b> of ${c.minutes}m.`
    : c.obj === 'hunt' ? `<b>${G.camps.filter(x => x.done).length} of ${G.camps.length}</b> commanders slain in ${G.sec/60|0}m ${G.sec%60}s.`
    : `<b>${G.vaults.filter(x => x.done).length} of ${G.vaults.length}</b> strongboxes cracked${G.exitOpen && result === 'victory' ? ', and out by the road' : ''}.`);
  lines.push(`<p>${how} ${G.kills} enemies slain, ${G.bossKills} commander${G.bossKills===1?'':'s'}.</p>`);

  const survivors = [];
  for (const m of G.squad){
    const p = m.p;
    if (m.state === 'bleeding'){
      if (result === 'victory' || result === 'withdrawn'){ m.state = 'stable'; lines.push(`<p>${esc(p.name)} is carried off the field.</p>`); }
      else { const r = d6(); if (r >= 4){ m.state = 'stable'; lines.push(`<p>${esc(p.name)} crawls out of the mud alive (Bleeding Out roll ${r}).</p>`); }
             else { m.state = 'dead'; m.diedAtEnd = true; lines.push(`<p class="bad">${esc(p.name)} is left behind and does not come home (Bleeding Out roll ${r}).</p>`); } }
    }
    if (m.state === 'dead'){
      if (!m.diedAtEnd) lines.push(`<p class="bad">${esc(p.name)} died in the field.</p>`);
      META.memorial.push(graveEntry(p, false, m.diedAtEnd ? 'Left behind on the field' : 'Bled out on the field', c));
      continue;
    }
    p.deployments++;
    if (G.downedIds.has(p.id)){ const r = injuryCheck(mateStats(p).con, p.name, lines); if (r === 'rest') p.resting = 1; else if (r) p.injuries.push(r); }
    survivors.push(p);
  }
  const deployedIds = new Set(G.squad.map(m => m.p.id));
  for (const p of META.roster) if (!deployedIds.has(p.id) && p.resting > 0){ p.resting--; if (!p.resting) delete p.restWhy;
    if (!p.resting && p.trainingAt){ lines.push(`<p class="good">${esc(p.name)} finishes training at the ${facility(p.trainingAt).name}: ${esc(p.trainingLabel || '')}.</p>`); delete p.trainingAt; delete p.trainingLabel; } }
  for (const o of officers()) if (o.resting > 0){ o.resting--; if (!o.resting){ lines.push(`<p class="good">${esc(o.name)} returns from officer training: ${esc(o.trainingLabel || '')}.</p>`); delete o.trainingAt; delete o.trainingLabel; } }
  META.roster = META.roster.filter(p => !deployedIds.has(p.id)).concat(survivors);
  const newHires = survivors.filter(p => p.newHire); newHires.forEach(p => delete p.newHire);
  if (newHires.length) lines.push(`<p class="good">Joining the roster: ${newHires.map(p => esc(p.name)).join(', ')}.</p>`);

  // Comrade Bonds (Section 1.3): a dead partner leaves the survivor unbonded;
  // two unbonded Squad Mates who survive a contract together may bond.
  const ids = new Set(META.roster.map(p => p.id));
  for (const p of META.roster) if (p.bond && !ids.has(p.bond)){ p.bond = null; lines.push(`<p>${esc(p.name)} has lost their Comrade.</p>`); }
  const free = survivors.filter(p => !p.bond).sort(() => Math.random() - .5);
  for (let i = 0; i + 1 < free.length; i += 2){ free[i].bond = free[i + 1].id; free[i + 1].bond = free[i].id;
    lines.push(`<p class="good">${esc(free[i].name)} and ${esc(free[i + 1].name)} have become Comrades: +1 step when they fight side by side.</p>`); }

  // Prisoners (Section 4.8)
  META.prisoners = META.prisoners || [];
  const kept = [];
  for (const pr of META.prisoners){ pr.age = (pr.age || 0) + 1; if (!has('cells') && pr.age >= 2) lines.push(`<p class="bad">${esc(pr.name)} escapes: nobody has the cells to hold them.</p>`); else kept.push(pr); }
  META.prisoners = kept;
  if (G.prisoners.length){
    if (result === 'victory' || result === 'withdrawn'){ for (const pr of G.prisoners) META.prisoners.push(Object.assign({age:0}, pr));
      lines.push(`<p class="good">Prisoners brought home: ${G.prisoners.map(pr => esc(pr.name)).join(', ')}. Deal with them on the Chapter screen.</p>`); }
    else lines.push(`<p class="bad">The prisoners are lost in the rout.</p>`);
  }

  // Pay: the Treasury is the camp currency. Coin is the field currency.
  let pay = 0; const ledger = [];
  if (result === 'victory' || result === 'withdrawn'){
    const full = Math.round(c.pay * (c.edges && c.edges.includes('terms') ? 1.2 : 1));
    const base = (result === 'victory' || hasDoc('ledgerseal')) ? full : Math.round(full/2);   /* Index 37: Ledger and Seal */
    pay += base; ledger.push(`Contract${result === 'victory' ? '' : hasDoc('ledgerseal') ? ' (Ledger and Seal: full pay)' : ' (half pay)'}: ${base}gp`);
    const charter = (perk('wealth', 3) ? 0.1 : 0) + (perk('wealth', 9) ? 0.1 : 0);
    if (charter){ const b2 = Math.round(base * charter); pay += b2; ledger.push(`Charter perks: ${b2}gp`); }
    const salv = Math.round(c.pay * 0.10); pay += salv; ledger.push(`Quick Salvage: ${salv}gp`);
    if (has('merchant')){ const t = mastery('merchant') ? 30 : 15; pay += t; ledger.push(`Merchant Stalls: ${t}gp`); }
    const upkeep = Math.min(pay, Math.round(survivors.length * 10 * (perk('dominion', 6) ? 0.5 : 1)));
    if (upkeep){ pay -= upkeep; ledger.push(`Hazard Upkeep: -${upkeep}gp`); }
  }
  if (!has('cells') && META.prisoners.length){ const pu = Math.min(pay + META.treasury, META.prisoners.length * 5); pay -= pu; ledger.push(`Prisoner upkeep: -${pu}gp`); }
  /* Patrick Q44 A (2026-11-16): on a fled job half the coin carried in the field is dropped in the rout (Q44.share; Q44.on = false: all of it comes home) */
  let cut = G.coin;
  if (cut && result === 'fled' && Q44.on !== false){ const drop = Math.round(cut * Q44.share); cut -= drop;
    if (drop){ ledger.push(`Coin carried home: ${cut}gp (${drop}gp, half the ${G.coin}gp carried, dropped in the rout)`);
      lines.push(`<p class="bad">In the rout the squad drops half the coin it carried: ${drop}gp lost.</p>`); pay += cut; cut = 0; } }
  if (cut){ pay += cut; ledger.push(`Coin carried home: ${cut}gp`); }
  META.treasury += pay;
  lines.unshift(`<p><b>Treasury ${pay < 0 ? '−' + (-pay) : '+' + pay}gp</b>${ledger.length ? ': ' + ledger.join(' \u00b7 ') : ''}. Now ${META.treasury}gp.</p>`);

  let leaderDead = false;
  L.deployments++;
  if (result === 'fallen' && G.leaderSlain){
    leaderDead = true; lines.push(`<p class="bad"><b>${esc(L.name)} bled out on the field.</b> A Leader killed in the field leaves no Legacy.</p>`);
  } else if (result === 'fallen'){
    const r = d6();
    if (r >= 4) lines.push(`<p>${esc(L.name)} is dragged clear, alive. (Bleeding Out ${r})</p>`);
    else if (leaderStats(L).luck >= 1){ L.burnt = (L.burnt||0) + 1;
      lines.push(`<div class="advbox" style="border-color:#c8742a"><h3 style="margin:0;color:#8a3a10;font-variant:small-caps">Death Averted</h3><p style="margin:4px 0">${esc(L.name)} should have died (Bleeding Out roll ${r}; a 1 to 3 is fatal). A point of Luck burns away for good, and they live.</p><p style="margin:0">Maximum Luck is now <b>${leaderStats(L).luck}</b>.${leaderStats(L).luck < 1 ? ' <b>No Luck is left to burn: the next time this happens, they die.</b>' : ''}</p></div>`); }   /* Index 32 */
    else { leaderDead = true; lines.push(`<p class="bad"><b>${esc(L.name)} dies on the field.</b> A Leader killed in the field leaves no Legacy at all. (Bleeding Out ${r})</p>`); }
    if (!leaderDead){ const ir = injuryCheck(leaderStats(L).con, L.name, lines); if (ir && ir !== 'rest') L.injuries.push(ir); }
  }
  if (!leaderDead && G.leaderWasDown && result !== 'fallen'){ const ir = injuryCheck(leaderStats(L).con, L.name, lines); if (ir && ir !== 'rest') L.injuries.push(ir); }
  if (result !== 'fled' && result !== 'fallen' && !G.noAdv) grantAdvancements(lines);
  if (!leaderDead && result !== 'fled' && result !== 'fallen' && !G.noTick){
    L.ticks++;
    lines.push(`<p>${esc(L.name)} earns an XP tick (${L.ticks} / 3).</p>`);
    if (L.ticks >= 3){
      L.ticks = 0; L.level = Math.min(11, L.level + 1);
      const b = rowFor(L.spec, L.level)[2];
      const label = b.startsWith('text:') ? capLabel(b.slice(5)) : BONUS_LABEL[b];   /* Index 36 */
      lines.push(`<p class="good"><b>${esc(L.name)} reaches Level ${L.level}.</b> ${label}. Squad Mates may now hold ${L.level+1} Advancements.</p>`);
      if (b === 'pick') META.pendingPicks++;
      if (b === 'luck' && leaderStats(L).rawLuck > 6){ META.treasury += 60; lines.push('<p>Luck is already at 6: the excess becomes a 60gp Windfall.</p>'); }
    }
  }
  // Faction Standing (Section 8.5) and the campaign record
  // Lost horses (Section 3.5): a staffed Stables replaces them; otherwise they are gone, and the Quartermaster sells replacements at half price.
  if (G.unhorsed){
    if (mastery('stables')) lines.push(`<p>The horses bolted, but the Stables' veteran rounds them up. ${gear(G.unhorsed).name} are ready again.</p>`);
    else { const id = G.unhorsed; ARM.lose(id, META.leader); META.halfMount = id;   /* INDEX A30 */
      lines.push(`<p class="bad">The ${gear(id).name} bolted and are lost. The Quartermaster can replace them at half price.</p>`); }
  }
  // commanders still standing get away, and remember
  for (const e of G.enemies) if (!e.dead && e.name && BESTIARY[e.k].boss && !e.dormant && e.seen) recordNemesis(e);
  if (G.newNemesis) lines.push(`<p class="bad"><b>A nemesis:</b> ${G.newNemesis.map(esc).join(', ')} got away, and will remember the Chapter.</p>`);
  if (result === 'victory' && c.faction) shiftStanding(c.faction, 1, lines);
  contractDebrief(c, result, lines);
  if (result === 'fled' && c.faction) shiftStanding(c.faction, -1, lines);
  for (const f of new Set(G.slainFactions)) shiftStanding(f, -1, lines);
  const S = st(), won = result === 'victory';
  if (won){ S.wins = (S.wins||0) + 1; S[c.obj + 'Wins'] = (S[c.obj + 'Wins']||0) + 1; }
  S.commanders = (S.commanders||0) + G.commandersDefeated.length;
  S.bigCommanders = (S.bigCommanders||0) + G.commandersDefeated.filter(t => t >= 2).length;
  S.freed = (S.freed||0) + G.captivesFreed;
  checkMilestones({won, tier:c.tier, obj:c.obj, faction:c.faction, deaths:G.squad.some(m => m.state === 'dead'), edges:(c.edges||[]).length,
                   commanders:G.commandersDefeated.length, leaderDowns:G.leaderDowns || 0}, lines);
  if (leaderDead){ META.memorial.push(graveEntry(L, true, G.leaderSlain ? 'Bled out leading the squad' : 'Fell leading the squad', c)); META.fallenLevel = L.level; META.leader = null; }
  if (window.DETACH) DETACH.resolveAll(lines);   /* Index DET1: detachment reports */
  META.deployments++;
  META.board = null; META.hireLine = null;
  rollRaid(c, lines);
  saveMeta();
  renderDebrief(head, lines);
}
function renderDebrief(head, lines){
  renderDebrief.last = {head, lines};
  let extra = '';
  if (META.leader && META.pendingPicks > 0){
    const L = META.leader, opts = leaderOpts(L);
    if (opts.length){
      // K74 (UX, 16 Nov): RETURN TO CAMP waits for the pick, so say so; the cards are buttons (keyboard and screen readers)
      extra = `<h2 class="sec">Pick 1 ${SPECS[L.spec].name} Talent</h2><div class="sub">Pick one to go on. It starts every future contract at rank 1.</div><div class="row">` +
        opts.map(c => `<button type="button" class="card k74" style="font:inherit;color:inherit;text-align:inherit" onclick="leaderPick('${c.id}')">${img(badgeURL(c.glyph, SPECS[c.spec].color), 'ic sm')}<div class="tag">${c.tag}</div><div class="ttl">${c.name}</div><div class="desc">${c.text(1)}</div></button>`).join('') + '</div>';
    } else META.pendingPicks = 0;
  }
  if (META.leader && (advLeft() > 0 || (typeof advKept === 'function' && META.advRound && advKept() > 0))) extra += advanceBlock() + (advLeft() > 0 ? '<div class="sub" style="font-size:14px">Unspent Advancements wait for you in the Barracks.</div>' : '');   // Neon R7 M2: kept ones are not in the Barracks; the kept box says why
  if (!META.leader && readyOfficers().length){
    extra = `<h2 class="sec">An Officer Takes Command</h2><div class="sub">Choose which officer leads the Chapter now.</div><div class="row">` +
      readyOfficers().map((o, i) => `<div class="card" onclick="officerFromDebrief(${i})"><div class="tag">Officer</div>${leaderCardHTML(o)}</div>`).join('') + '</div>' +
      `<div class="sub">Or promote a Squad Mate in the field instead:</div><div class="row">` + META.roster.map((p, i) => `<div class="card" onclick="fieldPromote(${i})">${mateCardHTML(p)}</div>`).join('') + '</div>';
  } else if (!META.leader){
    extra = `<h2 class="sec">Field Promotion</h2>` + (META.roster.length
      ? `<div class="sub">Choose a Squad Mate to lead the squad. They keep their own Level, but no higher than the fallen Leader's.</div><div class="row">` +
        META.roster.map((p, i) => `<div class="card" onclick="fieldPromote(${i})">${mateCardHTML(p)}</div>`).join('') + '</div>'
      : `<div class="sub">Nobody is left to promote. The Chapter keeps its camp and Treasury, and recruits a new Leader.</div>`);
  }
  const canGo = !(META.leader && META.pendingPicks > 0) && (META.leader || (!META.roster.length && !readyOfficers().length));
  $('debrief-inner').innerHTML = `<div class="tag" style="font-size:14px">Field Report</div><h1 style="font-size:40px">${head}</h1><div class="log">${lines.join('')}</div>${extra}
    <div>${canGo ? `<button class="btn gold" onclick="leaveDebrief()">RETURN TO CAMP</button>` : ''}</div>`;
  show('screen-debrief');
}
// A grave on the camp map (and the Roster's roll of the fallen).
function graveEntry(p, leader, cause, c){
  const bond = !leader && p.bond && (G.squad.map(m => m.p).concat(META.roster).find(q => q.id === p.bond));
  return {name:p.name, race:p.race, cls:p.cls, spec:p.spec, sex:sexOf(p), id:p.id, leader,
          level: leader ? p.level : 1 + (p.adv || 0), contracts: p.deployments || 0, kills: p.kills || 0,   /* Index 48 */
          injuries:(p.injuries || []).slice(), cause, contract:OBJECTIVES[c.obj].name, patron:c.patron, tier:c.tier,
          season:seasonName(), comrade: bond ? bond.name : null};
}
function leaderOpts(L){ return CARDS.filter(c => c.spec === L.spec && !L.picks.includes(c.id) && (c.ability || ((!c.req || has(c.req)) && SPELL_IDS.includes(c.id) && (!c.minMagic || leaderStats(L).magic >= c.minMagic)))); }   /* Index 39 */
function leaderPick(id){ META.leader.picks.push(id); META.pendingPicks--; saveMeta(); if (!$('screen-debrief').classList.contains('hidden')) { renderDebrief(renderDebrief.last.head, renderDebrief.last.lines); const go = [...$('debrief-inner').querySelectorAll('button')].find(x => /RETURN TO CAMP/.test(x.textContent)); if (go && go.scrollIntoView) go.scrollIntoView({ block: 'nearest' }); /* UX 19c661a0: the button the pick unlocks must not sit below the fold */ } else refreshUI(); }
function fieldPromote(i){   /* Index 35: the same promotion as the camp, and the Comrade Bond is let go */
  const p = META.roster[i]; if (!p) return;
  unbond(p); META.roster.splice(i, 1);
  const L = mateToLeader(p, Math.max(1, META.fallenLevel || 1));
  META.leader = L; META.pendingPicks = L.pendingPicks || 0; delete L.pendingPicks; saveMeta();
  renderDebrief(renderDebrief.last.head, renderDebrief.last.lines.concat([`<p class="good"><b>${esc(L.name)} takes command</b> at Level ${L.level}.</p>`]));
}
function leaveDebrief(){ G = null; if (!META.leader) openCreate(); else renderTitle(); }

/* ---------------------------------------------------------------------------
   MANUAL
--------------------------------------------------------------------------- */
function openManual(){
  const races = Object.entries(RACES).map(([k, r]) => `<tr><td>${img(raceIconURL(k),'')}</td><td><b>${r.name}</b></td><td>${r.con}</td><td>${r.move}</td><td>${r.m}</td><td>${r.r}</td><td>${r.mg}</td><td>${r.luck}</td><td>${r.per}</td><td>${r.tag}</td></tr>`).join('');
  const specs = SPEC_ORDER.map(k => { const s = SPECS[k], A = ABILITIES[k]; return `<tr><td>${img(specIconURL(k),'')}</td><td><b>${s.name}</b></td><td>${s.con}</td><td>${s.mg}</td><td>${s.attack}</td><td><span class="kbd">${A.key}</span></td><td><b>${A.name}</b>: ${A.text}</td><td>${A.cd} seconds</td></tr>`; }).join('');
  const foes = Object.entries(BESTIARY).map(([k, b]) => `<tr><td>${img(enemyIconURL(k),'')}</td><td><b>${b.name}</b>${b.boss?' (commander)':''}</td><td>${b.con}</td><td>${b.ac}</td><td>-${b.shift}</td><td>${b.skill}</td><td>${b.dmg}</td></tr>`).join('');
  $('manual-inner').innerHTML = `<h1 style="font-size:44px">Player's Manual</h1>
  <div class="log">
   <p><b>The loop.</b> Your Squad Leader carries over from contract to contract. Everything the company knows (stats, abilities, spells, prayers and doctrines) is earned in camp and kept for good. In the field, every kill fills the <b>Momentum</b> bar at the top of the screen; each rank lets the squad push harder with what it already knows, or issue a field order, for that contract only. All the coin the squad picks up goes home to the <b>Treasury</b>, which builds the camp, hires Squad Mates at the campfire and buys squad gear.</p>
   <p><b>The camp</b> is the Chapter's home and the main menu. Walk your Squad Leader with WASD or the arrow keys (Shift to run); the view follows. Click an empty plot to build a facility there; click a building to see its bonuses, its veteran staff and anything you can do there. Squad Mates between contracts walk the camp; those resting lie in the Field Hospital (or the Tents), those drilled this downtime stay at the Training Grounds, and retired veterans stand at the building they staff. Click anyone to train, retire or release them. The Chapter Master wanders the camp and does the haggling at the planning table.</p>
   <p><b>The planning table</b> in the Chapter House holds the contracts on offer, the War Council, who marches, the Charter Ambition, the map of Faction Standing, the Book of Doctrines and the Prisoner Ledger. Sign a contract there to march.</p>
   <p><b>Controls.</b> <span class="kbd">WASD</span> move \u00b7 <span class="kbd">1</span> to <span class="kbd">6</span> abilities \u00b7 <span class="kbd">SPACE</span> Shield Wall, or back to Open Order \u00b7 <span class="kbd">Q</span> spend 1 Luck: +1 to every die for 4 seconds \u00b7 <span class="kbd">R</span> burn 1 Luck for good: every die a Natural Maximum for 6 seconds \u00b7 <span class="kbd">TAB</span> level up \u00b7 <span class="kbd">M</span> minimap \u00b7 <span class="kbd">ESC</span> full map, settings and Withdraw.</p>
   <p><b>Attacks, passives and abilities.</b> Everyone fights with the squad's weapons, as the tabletop does: the Squad Standard melee weapon when an enemy is in reach, otherwise the Squad Standard ranged weapon. Each model rolls their own Melee or Ranged die, so raising a Soldier's Ranged or a Folk Hero's Melee with an Advancement really does make them better at it. Soldiers have the best dice, Folk Heroes shoot well and swing badly, and casters do both badly. Every Specialty also has a passive (Soldier Sweep, Folk Hero Marksman, Scoundrel Soft Spot, Cleric Mending Prayer, Mage Magic Missile, Witch Withering Hex) and adds one ability to the bar on its number key. Two of the same Specialty fire it twice.</p>
   <p><b>The Command Radius</b> is the dashed ring around the Leader. Inside it, damage is absorbed in order: Ward Tokens, then the Shield Pool, then the Mount Pool, then the Leader's Wounds, and only then anyone's Condition. A Squad Mate outside it takes every hit on their own Condition, and enemies hunt them first. Squad Mates walk at their racial Move, so a Dwarf will fall behind an Elf.</p>
   <p><b>Dice.</b> Every attack is a Shifted d6 against Target AC. A Natural Minimum always misses and a Natural Maximum always hits. Beat the AC for a Solid Hit and roll damage; match it for a Grazing Hit and deal 1.</p>
   <p><b>Open Order and Shield Wall.</b> In Open Order the squad spreads loosely through the Command Radius, as the rulebook advises against blasts (Section 6.11): a Fireball or Sharper catches one or two models rather than all of them. A Shield Wall uses the squad's attack: +1 AC and 2 Shield Pool back each round (6 seconds) while no enemy is in contact, but only casters, and Soldiers with Shield Wall Mastery, keep attacking. With Infantry Spears, each enemy that closes on the wall takes one Grazing Hit. A Sharper Staggers the squad, and a Staggered squad cannot form a Shield Wall.</p>
   <p><b>Why standing still fails.</b> Crossbowmen and snipers keep their distance and shoot. Battle-Mages and Sappers drop Fireballs and Sharpers wherever the squad is bunched; the circle on the ground is your warning. Devils and Cinderlings set the ground alight. Run in a straight line on open ground and the squad Charges: +1 step on melee.</p>
   <p><b>Contracts.</b> Three of ten kinds are on the planning table at a time, each with its own enemy (bandits, greenskins, monsters, the Hollow dead or Frost-Vault deserters), place and details: <i>Hold the Redoubt</i> (survive the clock), <i>Headhunter Clash</i> (kill every commander), <i>High-Value Extraction</i> (crack three strongboxes and get out), <i>Caravan Escort</i> (the wagon only moves while the Leader is close; if it burns, the job is lost), <i>Hostage Rescue</i> (break the cages; the freed run for the road and must be covered; saving them raises Standing with their faction), <i>Assassination</i> (kill the mark before they reach the edge; once they see you they run), <i>Purge the Nests</i> (every nest keeps spawning until destroyed), <i>Sabotage</i> (burn the siege engines and get out), <i>Light the Beacons</i> (keep all three burning at once while the enemy tries to put them out) and <i>Relic Recovery</i> (carry it home; the squad is slower under the weight). Every commander has a name of their own. Before you sign, hold the War Council: each die that beats the patron's Resistance buys a Contract Edge.</p>
   <p><b>The map.</b> Forest and rubble slow the squad (Scout ignores them) and give Light Cover against arrows. Hills give +1 step to anyone attacking from them. Walls, palisades, buildings and water block movement and arrows. Chests hold Poultices, War Chests (a free level-up), Scrolls, Brews, munitions and freed captives. Blip Tokens turn over as you get close: a decoy, a sniper nest, a trap or an ambush. Enemy camps sleep until you get close.</p>
   <p><b>Commanders.</b> Kill a commander and every enemy nearby tests Morale; some will Break and run. Kill Orsolt and his levies lose their frenzy.</p>
   <p><b>Bleeding Out.</b> A Squad Mate at 0 Condition rolls a d6 every 10 seconds: 1 to 3 and they die. Stand on them to Stabilise. A Cleric's Healing Word or Cure Wounds stands them back up.</p>
   <p><b>When the Leader goes down</b> the contract is not over. The Leader Bleeds Out like anyone else, and the nearest Squad Mate runs to help: 3 seconds beside them the first time, 6 the second, 9 the third, gets the Leader up at 1 Condition. Healing Word and Cure Wounds do it at once. <span class="kbd">R</span> burns 2 Luck for good to stand straight away. On a Bleeding Out roll of 1 to 3, a point of Luck burns to hold on; with no Luck left, the Leader dies. The contract is lost if the Leader dies or every Squad Mate is down.</p>
   <p><b>The Chapter screen</b> holds the campaign. Choose a <b>Charter Ambition</b> (Wealth, Fame, Liberation or Dominion): ten milestones taken in order, with a perk at 3, 6 and 9 and the charter fulfilled at 10. <b>Faction Standing</b> runs from -3 to +3: a completed contract raises it with the patron's faction, fleeing lowers it, and killing a faction's commander costs 1 with them. At +2 a faction is Allied: Patron Resistance drops by 1 and their perk is yours. At -2 they offer no more contracts.</p>
   <p><b>Parley.</b> Some commanders raise a white flag when badly hurt. Demand surrender (your Leader's Personality die against their Morale die; ties go to you), let them withdraw, or fight on. A surrender counts as defeating them and brings them home as a prisoner with some of their guard. Prisoners can be ransomed, interrogated for your next contract, recruited (common soldiers only) or released.</p>
   <p><b>Comrade Bonds.</b> Two unbonded Squad Mates who survive a contract together become Comrades: +1 step on attacks while they fight side by side, shown by a gold thread. If one goes down, the squad tests Morale 1 step lower.</p>
   <p><b>Retiring veterans.</b> A Squad Mate who is maimed, or has 3 or more Advancements, can retire from the Roster to staff a facility. A veteran with 3 or more Advancements who matches the facility's Race, Class or Specialty gives its Veteran Mastery bonus. <b>Tactical Doctrines</b> are bought once from the Treasury on the Camp screen.</p>
   <p><b>Momentum.</b> Kills fill the bar straight away (no gems to collect), faster on a kill streak; commanders, nests and objectives give big chunks. At each rank three choices appear above the ability bar and the fight keeps running: press <span class="kbd">7</span>, <span class="kbd">8</span> or <span class="kbd">9</span> when it is clear, or click. <span class="kbd">TAB</span> saves the choice for later. <i>Empower</i> raises the rank of an ability, spell or doctrine the squad already knows (Vanguard 1 becomes Vanguard 2); <i>field orders</i> are Blood Up, Hold the Line, Second Wind, Captured Supplies, Enemy in Disarray, Spoils of War, Quick Hands, Sharpened Gifts and Fortune Favours. Momentum fades when the contract ends.</p><p><b>Red arrows.</b> A red arrow at the edge of the screen points to an enemy commander who is off screen.</p><p><b>Withdrawing.</b> Press <span class="kbd">ESC</span> and choose Withdraw. It is a roll on your Leader’s Personality. With at least half the job done a withdrawal pays half; with less, it pays nothing and your standing with the patron falls.</p><p><b>Advancement.</b> After every contract the company survives, the Leader marks an XP tick (a Level every 3), and you give 1 Advancement to each of 2 different Squad Mates: +1 Condition, +1 Melee, +1 Ranged or a Specialty ability. Dice cannot pass the Specialty row for their effective Level, and nobody holds more than Leader Level + 1 Advancements. Camp facilities train Squad Mates for gold under the same rules: the Mage Tower, Chapel and Alchemy Lab teach Magic and spells, the Command Tent teaches abilities. Trainees sit out the next contract. Officers, promoted at the Command Tent, can take command whenever you need them to.</p><p><b>The prologue: The Founding of the Dust Cloaks</b> teaches the game in a short story: three days holding Varnholt (two assaults), then three nights on the road with the refugees. The Sergeant\u2019s Advice on the table tells you what to try next. The squad that survives becomes your Chapter in the main game; or skip it and found a Chapter straight away.</p><p><b>Melee and casting.</b> Every melee hit staggers its target and knocks it back, melee kills fill Momentum twice as fast, and they sometimes earn a Ward Token. Casters\u2019 passives come 30% faster: Magic Missile hits harder from Magic 3, Mending Prayer adds a Ward Token from Magic 2, and Withering Hex spreads to the neighbours of anything it kills.</p><p><b>Withdrawing</b> (ESC) is a roll: your Leader\u2019s Personality against 4 (nobody close), 5 (the enemy is on you) or 6 (an enemy commander is near). Full Success: out with the coin you carry. Partial: out, but the coin is dropped. Miss: pinned, fight on, and wait 20 seconds to try again. Contract pay is unchanged: half pay if half the job is done, otherwise nothing. Big rolls (the War Council, Parley, withdrawing, prisoners, Work Orders) are thrown across the screen; click to skip.</p><p><b>Lightning Bolt</b> strikes the nearest enemy in sight and bounces to the next, twice; each bounce rolls a weaker damage die. Magic 3 adds a bounce, and Magic 5 another.</p><p><b>Injury checks</b> after a contract are thrown on screen, one die per Squad Mate who went down.</p><p><b>Charter Finales.</b> When the ninth milestone of your Ambition is taken, its finale (The Dragon\u2019s Vault Heist, Siege of the World Temple, The Chains of Cois Abhann or Battle of the Grey Keep) appears on the planning table as a Tier 3 contract at double pay, with a master of its own. Win it to fulfil the charter.</p><p><b>Prisoners.</b> Enemies who Break and are run down give themselves up (one for every three routed and cut down, up to three). Specialists ransom for 40gp. Captured nobles roll on Table 4.10 (Disowned, a younger child 150gp, a landed heir 300gp, a favoured heir 500gp and +1 Standing); haggling moves them a row up or down. A captured nemesis ransoms for more. Executing a prisoner costs 1 Standing with their faction.</p><p><b>Favour and tenets.</b> Every Cleric serves a deity (chosen on their card). Deployed Clerics bring 2 \u00d7 Magic Favour each, plus the best bonus (Devout Chapter Master +1, Allied with Mendor +2). Cure Wounds cast with Favour costs 1 and recovers in 8 seconds instead of 18; with nobody hurt it spends 2 on a Divine Barrier (+2 Ward Tokens, +1 step). Breaking a tenet, or changing faith, costs 2 Favour on the next contract.</p><p><b>Moving on.</b> If every Squad Mate is gone and the Treasury cannot pay for a recruit, the Chapter Master offers to pack up and start again at a new holding, with the graves, the Leader and the rivals coming along.</p><p><b>Sharing people.</b> Export any Squad Mate or Leader from the Roster to a file. Import one from the Roster (a Squad Mate costs the hiring price plus 25gp per Advancement) or from the Leader screen (30gp plus 60gp per Level above 1).</p><p><b>Keys.</b> Abilities are numbered 1, 2, 3... in the order they sit on the bar. Every pick screen (Momentum, Parley, Rank\u2019n) answers to 1, 2 and 3.</p><p><b>The drill yard.</b> With Training Grounds or Barracks, start a Practice Bout from the building: any enemy, any tier, as long as you like. Nobody dies or is hurt and nothing is earned. Off duty, Squad Mates spar in the yard.</p><p><b>Rank\u2019n</b> is played in the Camp Tavern against a Squad Mate, for real gold. Copper Spears beat Gold Knights, Silver Bows beat Spears, Knights beat Bows. Place four Spears, then draft four coins into your back row; move diagonally forward, jump coins yours beat, and keep jumping. A coin that reaches the far row becomes a Veteran: stack a second coin, strike as either, move backwards. Win by taking every coin or leaving your opponent no move. You keep your surviving coins and every coin you took.</p><p><b>Founding the Chapter</b> (Section 1.7, Step 1). Elect the Chapter Master: Race, Social Class and Specialty. Their Social Class sets the camp bonus (Table 4.8): Devout (Clerics heal more and recover Healing Word faster), Edel\u014ds (Merchant Stalls 70gp cheaper and one Quartermaster buy of up to 50gp free each downtime), Freeman (Workshops 10% cheaper), Noble (Patron Resistance 1 lower against Imperial patrons), Outcast (one hidden Blip Token and one trap revealed every contract), Ex-Slave (every captive or hostage freed adds 25gp). When the Chapter Master's Race, Class or Specialty matches a patron's circle, their War Council die shifts up a step. Then choose the Starting Holding: the Frontier Timber Fort, the Dockside Cog-Barge or the Abandoned City Warehouse. Every holding can build every facility, dressed to suit it, and you can move house from the Chapter House at any time.</p><p><b>The Chapter banner.</b> Design it at the Chapter House. Every Squad Mate wears a cloak in its colours, it flies over the house and the gatehouse, and no enemy ever wears them.</p><p><b>Traps.</b> The enemy sets Caltrops, Snares, Tripwires, Deadfalls and Fire Pots on its roads and round what it guards. They stay hidden until someone gets close (further with a Sapper's Yard or a Ranger's veteran, or all of them with Deep Reconnaissance). A Scoundrel standing near a spotted trap disarms it.</p><p><b>Nemeses.</b> A named commander who gets away (a withdrawal at a Parley, an escaped mark, or anyone still standing when a contract ends) becomes a Rival on the planning table. They come back on later contracts against the same force, 25% tougher for every escape. Killing one pays a bounty.</p><p><b>Camp raids.</b> From the fourth contract, raiders may come for the camp, far more often when a faction is Hostile. Defend the Chapter House, or let them loot 30% of the Treasury. You get 25 seconds to set traps (<span class="kbd">F</span> set, <span class="kbd">G</span> next kind, <span class="kbd">ENTER</span> sound the horn). The Palisade makes raiders come through the gates, Watchtowers shoot, the Sapper's Yard gives more traps, and retired veterans and officers fight beside you: they can be knocked out, but never die.</p><p><b>Saves.</b> Export save and Import save are in Settings. Export now and then: the campaign lives in this browser's storage.</p><p><b>The map.</b> Chests, cages and Blip Tokens you have scouted or had reported are drawn on the minimap and the full map as what they are; a known Blip Token shows its tracks, sniper nest, pit trap or ambush in the field too.</p><p><b>Horses.</b> Mounts make the squad faster and widen the Command Radius. The Mount Pool soaks hits after the Shield Pool; when it breaks (or on the first hit through, for Riding Horses) everyone is thrown and the horses bolt. Lost horses are gone unless a veteran staffs the Stables; the Quartermaster replaces them at half price.</p>
  </div>
  <h2 class="sec">Races</h2><table class="man"><tr><th></th><th>Race</th><th>Con</th><th>Move</th><th>M</th><th>R</th><th>Mg</th><th>Luck</th><th>Per</th><th>Tag</th></tr>${races}</table>
  <h2 class="sec">Specialties</h2><table class="man"><tr><th></th><th>Specialty</th><th>Con</th><th>Magic</th><th>Passive</th><th>Key</th><th>Ability</th><th>Cooldown</th></tr>${specs}</table>
  <h2 class="sec">Bestiary</h2><table class="man"><tr><th></th><th>Enemy</th><th>Con</th><th>AC</th><th>Shift</th><th>Skill</th><th>Dmg</th></tr>${foes}</table>
  <div><button class="btn small" onclick="renderTitle()">BACK</button></div>`;
  show('screen-manual');
}

/* ============================================================================
   BOOT
============================================================================ */
function resize(){ canvas.width = VW = window.innerWidth; canvas.height = VH = window.innerHeight; if (G) G.bgPat = null; }
const KEYMAP = {arrowup:'w', arrowdown:'s', arrowleft:'a', arrowright:'d'};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (G && document.querySelector('#screen-create:not(.hidden) .cr2')) return;   // the Creator is open over a live Act I fight: no game key reaches the fight (Esc pause, Space Brace, abilities, Luck, WASD) and the name keeps its spaces (QA 2a)
  if (k === ' ' && G && !G.paused){ e.preventDefault();
    if (typeof isBrawl === 'function' && isBrawl()){ G.formation = 'OPEN'; pop(G.leader.x, G.leader.y-30, 'NO SHIELDS IN A BAR FIGHT', '#c8b890'); }
    else     if (G.formation === 'OPEN' && !canBrace()) pop(G.leader.x, G.leader.y-30, 'STAGGERED: NO SHIELD WALL', '#ff8a7a');
    else { G.formation = G.formation === 'OPEN' ? 'SHIELD' : 'OPEN'; pop(G.leader.x, G.leader.y-30, G.formation === 'SHIELD' ? 'SHIELD WALL' : 'OPEN ORDER', '#fff'); } }
  if (k === 'm' && G) G.showMini = !G.showMini;
  if (k === 'tab'){ e.preventDefault(); if (G && !G.over && !PARLAY && !G.paused) toggleMomentum(); }
  if (G && !G.paused && !e.repeat && (k === '7' || k === '8' || k === '9')) pickMomentum(+k - 7);
  if (G && !G.paused && !e.repeat && ABIL_KEYS[k] && !(window.ABIL33 && ABIL33.live())) useAbility(ABIL_KEYS[k]);   /* F-41: abilities work while the Momentum cards are open */   // INDEX F33: js/combat/abilities-f33.js owns 1-5 and E while live
  SFX.unlock();
  if (G && !G.paused && G.trapStock !== undefined){ if (k === 'f') raidSetTrap(); if (k === 'g') raidCycleTrap(); if (k === 'enter') raidStart(); }
  if (k === 'q' && G && !G.paused) spendLuck();
  if (k === 'r' && G && !G.paused) burnLuck();
  if (k === 'escape') togglePause();
  keys[KEYMAP[k] || k] = true;
});
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[KEYMAP[k] || k] = false; });
window.addEventListener('resize', resize);
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

window.onload = function(){
  canvas = $('gameCanvas'); ctx = canvas.getContext('2d');
  campInputs(); momInputs();
  resize(); loadMeta(); applySkin();
  document.documentElement.style.setProperty('--parch', `url(${parchmentURL()})`);
  showSplash();
};

