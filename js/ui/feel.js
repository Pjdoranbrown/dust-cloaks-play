/* js/ui/feel.js (INT-1 step 2, 2026-11-16): FEEL, MORE (the prologue as a tutorial).
   Cut unchanged from the inline script in index.html (old lines 8339 to 8899). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   FEEL - the campaign's day screens as places in the world (the Reeve's Hall,
   the Ledger Wagon), battle alerts, and a game-like finish on every control:
   brass-and-leather buttons, parchment tooltips, a pixel cursor.
============================================================================ */

/* ---------------------------------------------------------------------------
   THE GATEHOUSE: posts, a lintel and two leaves standing open for the Chapter
--------------------------------------------------------------------------- */
function drawGateHouse(k, flash, frac){
  const S = STRUCTS[k], [x0, y0] = S.cells[0], len = S.cells.length * CELL, X = x0 * CELL, Y = y0 * CELL;
  const wood = flash ? '#ffffff' : '#5a3a1a', dark = flash ? '#ffffff' : '#3a2410';
  // posts and a lintel
  for (const px of [X - 10, X + len]){ ctx.fillStyle = dark; ctx.fillRect(px, Y - 34, 10, CELL + 34); ctx.fillStyle = '#7a5230'; ctx.fillRect(px, Y - 34, 3, CELL + 34); }
  ctx.fillStyle = dark; ctx.fillRect(X - 14, Y - 40, len + 28, 9); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(X - 14, Y - 40, len + 28, 2);
  if (!S.keep){ const b = banner(); ctx.fillStyle = b.c1; ctx.fillRect(X + len / 2 - 9, Y - 31, 18, 16); ctx.fillStyle = b.c2; ctx.fillRect(X + len / 2 - 9, Y - 31, 18, 3); }
  // two leaves swung open against the posts, scarred as the gate is battered
  const leaf = len / 2 - 6;
  for (const [lx, dir] of [[X, 1], [X + len, -1]]){
    ctx.fillStyle = wood; ctx.beginPath(); ctx.moveTo(lx, Y - 6); ctx.lineTo(lx + dir * 12, Y + 6); ctx.lineTo(lx + dir * 12, Y + CELL + 2); ctx.lineTo(lx, Y + CELL - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke();
  }
  if (frac < 0.6){ ctx.fillStyle = 'rgba(30,20,10,.7)'; for (let i = 0; i < (1 - frac) * 10; i++) ctx.fillRect(X - 8 + (i * 37 % (len + 10)), Y - 30 + (i * 13 % 30), 4, 2); }
}

/* ---------------------------------------------------------------------------
   ALERTS: a wall or gate under attack somewhere else
--------------------------------------------------------------------------- */
{ const f = damageObjective; damageObjective = (t, d) => {
    f(t, d);
    if (!G || !t.struct) return;
    t.attackedT = G.frame;
    if (!t.warnT || G.frame - t.warnT > 420){ t.warnT = G.frame;
      const L = G.leader, far = dist(L, t) > Math.min(VW, VH) * 0.42;
      if (far){ G.alert = {text:`${t.name.toUpperCase()} IS UNDER ATTACK`, t, life:280}; SFX.play('horn'); }
    }
  }; }
function dirName(d){ return {N:'the north', S:'the south', E:'the east', W:'the west', NE:'the north-east', EIN:'over the east wall'}[d] || 'the road'; }
function announceWave(dirs){
  const D = [...new Set(dirs)].map(dirName);
  const text = 'THEY COME FROM ' + (D.length > 1 ? D.slice(0, -1).join(', ') + ' AND ' + D.slice(-1) : D[0]).toUpperCase();
  G.alert = {text, life:220, dirs:[...new Set(dirs)]}; SFX.play('horn'); note(text.charAt(0) + text.slice(1).toLowerCase() + '!');
}
function edgePointer(x, y, col, label, pulse){
  const L = G.leader, zk = typeof camK === 'function' ? camK() : 1, dx = (x - L.x) * zk, dy = (y - L.y) * zk;   /* A2: world offset in drawing units */
  if (Math.abs(dx) < VW / 2 - 40 && Math.abs(dy) < VH / 2 - 40) return false;
  const a = Math.atan2(dy, dx), r = Math.min((VW / 2 - 56) / Math.abs(Math.cos(a) || 1e-6), (VH / 2 - 70) / Math.abs(Math.sin(a) || 1e-6));
  const ax = VW / 2 + Math.cos(a) * r, ay = VH / 2 + Math.sin(a) * r, s = 1 + (pulse ? Math.sin(G.frame / 5) * 0.25 : 0);
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.scale(s * 1.5, s * 1.5);
  ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  if (label){ ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; const tx = ax - Math.cos(a) * 34, ty = ay - Math.sin(a) * 28 + 4, w = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(20,10,6,.85)'; ctx.fillRect(tx - w / 2, ty - 13, w, 18); ctx.fillStyle = col; ctx.fillText(label, tx, ty); }
  return true;
}
function drawAlerts(){
  if (!G || !isS()) return;
  // every wall or gate struck in the last few seconds points the way, in red
  if (G.structs) for (const k in G.structs){ const s = G.structs[k]; if (s.hp > 0 && s.attackedT && G.frame - s.attackedT < 240) edgePointer(s.x, s.y, '#ff5a3a', s.name, true); }
  if (G.ledger && G.ledger.attackedT && G.frame - G.ledger.attackedT < 240) edgePointer(G.ledger.x, G.ledger.y, '#ff5a3a', 'The Ledger Wagon', true);
  const A = G.alert; if (!A) return;
  if (--A.life <= 0){ G.alert = null; return; }
  const k = Math.min(1, A.life / 30, (300 - A.life) / 12), y = 112;
  ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.font = 'bold 24px Georgia';
  const w = ctx.measureText(A.text).width + 70;
  ctx.fillStyle = 'rgba(70,10,6,.88)'; ctx.fillRect(VW / 2 - w / 2, y - 26, w, 40);
  ctx.strokeStyle = '#ff8a5a'; ctx.lineWidth = 2; ctx.strokeRect(VW / 2 - w / 2 + 2, y - 24, w - 4, 36);
  ctx.fillStyle = '#ffe9c8'; ctx.fillText(A.text, VW / 2, y + 2); ctx.globalAlpha = 1;
}
{ const f = drawHUD; drawHUD = function(){ f(); drawAlerts(); }; }
{ const f = storyMarkers; storyMarkers = function(out){
    if (G.obj === 'siege'){ for (const k in G.structs){ const s = G.structs[k]; if (s.hp > 0 && s.attackedT && G.frame - s.attackedT < 300) out.push({x:s.x, y:s.y, kind:'boss', sp:'vault'}); }
      if (G.obj === 'night'){} for (const a of G.allies) if (a.state === 'up') out.push({x:a.x, y:a.y, kind:'ally'}); return; }
    f(out); }; }
// Where the auxiliaries should be: at the wall or gate under attack, or with the squad.
function threatened(){
  if (!G || !G.structs) return null;
  let best = null, bt = -1e9; for (const k in G.structs){ const s = G.structs[k]; if (s.hp > 0 && s.attackedT && G.frame - s.attackedT < 400 && s.attackedT > bt){ bt = s.attackedT; best = s; } }
  return best;
}
{ const f = storyLine; storyLine = function(t){ const r = f(t); if (G.trapStock > 0 && G.prepT <= 0 && G.obj === 'siege') r[1] += `  \u00b7  [F] TRAP (${G.trapStock})`; return r; }; }

/* ---------------------------------------------------------------------------
   SMALL ICONS for costs and tokens
--------------------------------------------------------------------------- */
const ICON = {
  supply:() => toURL('ic:sack', () => { const c = newCanvas(11, 11), P = painter(c.getContext('2d')); P(2, 3, 7, 7, '#c8b48a'); P(1, 5, 9, 4, '#c8b48a'); P(4, 1, 3, 2, '#a89470'); P(3, 3, 5, 1, '#8a7650'); P(3, 6, 2, 2, '#e0d0a8'); return outline(c); }, 3),
  gold:  () => toURL('ic:coin', () => { const c = newCanvas(11, 11), P = painter(c.getContext('2d')); P(3, 1, 5, 9, '#e8c040'); P(1, 3, 9, 5, '#e8c040'); P(2, 2, 7, 7, '#e8c040'); P(3, 3, 5, 1, '#fff2a0'); P(5, 3, 1, 5, '#a07818'); return outline(c); }, 3),
  order: () => toURL('ic:candle', () => { const c = newCanvas(9, 13), P = painter(c.getContext('2d')); P(2, 5, 5, 7, '#ece4cf'); P(2, 5, 2, 7, '#fff8e8'); P(4, 3, 1, 2, '#2a2520'); P(3, 0, 3, 3, '#ffb030'); P(4, 0, 1, 2, '#ffe060'); P(1, 11, 7, 2, '#8a6a2a'); return outline(c); }, 3),
  spent: () => toURL('ic:candle0', () => { const c = newCanvas(9, 13), P = painter(c.getContext('2d')); P(2, 9, 5, 3, '#c8c0a8'); P(4, 7, 1, 2, '#2a2520'); P(1, 11, 7, 2, '#8a6a2a'); return outline(c); }, 3),
  column:() => toURL('ic:folk', () => { const c = newCanvas(13, 11), P = painter(c.getContext('2d')); for (const [x, col] of [[1, '#7a6a8a'], [5, '#5a6a8a'], [9, '#8a6a5a']]){ P(x + 1, 1, 2, 2, '#e8c8a0'); P(x, 3, 4, 6, col); } return outline(c); }, 3)
};
const chip = (kind, n) => `<span class="chip"><img src="${ICON[kind]()}">${n}</span>`;

/* ---------------------------------------------------------------------------
   THE WORK BOARD - the Reeve's Hall in Varnholt, the Ledger Wagon on the road
--------------------------------------------------------------------------- */
let BOARD = {sel:null};
function wcard(o){
  const ok = o.ok !== false && CP().orders >= (o.orders === 0 ? 0 : 1);
  return `<div class="wcard ${ok ? '' : 'off'}" ${ok ? `onclick="${o.act}" tabindex="0" role="button" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();this.click()}"` : ''} data-tip="${esc(o.tip || o.desc)}">
    <img class="wg" src="${badgeURL(o.glyph, o.col || '#7a3e26')}"><div class="wt">${o.name}</div><div class="wd">${o.desc}</div>
    <div class="wc">${o.orders === 0 ? '' : chip('order', 1)}${o.supply ? chip('supply', o.supply) : ''}${o.gold ? chip('gold', o.gold) : ''}</div>
    ${!ok && o.why ? `<div class="wstamp">${o.why}</div>` : ''}</div>`;
}
function siegeCards(){
  const C = CP(), hasCleric = META.leader.spec === 'CLERIC' || META.roster.some(p => p.spec === 'CLERIC'), mkt = C.district.market === 'held' && !C.fallback;
  return [
    {glyph:'horn', name:'Rally the Town', desc:`Call for volunteers. Full: 6 Levy and a veteran. Partial: 3 Levy.`, tip:`Leader's Personality against ${mkt ? 4 : 6}. 1 Supply per 3 recruits fed.`, act:"boardDo('rally')"},
    {glyph:'shield', name:'Train', desc:'Drill a Levy squad into Militia.', supply:1, act:"boardDo('train')", ok:C.aux.some(a => a.type === 'levy') && C.supply >= 1, why:'No Levy'},
    {glyph:'sun', name:'Pray', desc:'The next fight starts Blessed.', tip:'+2 Ward Tokens and +1 step for 30 seconds. Needs a Cleric.', act:"boardDo('pray')", ok:hasCleric, why:'No Cleric'},
    {glyph:'boot', name:'Scrounge', desc:'Search the farms. Full: +4 Supply. Partial: +2, someone hurt.', act:"boardDo('scrounge')"},
    {glyph:'eye', name:'Scout', desc:'Reveal lines of the next Intelligence Card.', act:"boardDo('scout')"},
    {glyph:'heart', name:'Tend the Wounded', desc:'Every resting Squad Mate is fit to fight.', act:"boardDo('tend')", ok:META.roster.some(p => p.resting > 0), why:'Nobody hurt'},
    {glyph:'bomb', name:'Craft Munitions', desc:'3 Burners and Smoke Pots for the next fight.', gold:30, act:"boardDo('munitions')", ok:META.treasury >= 30, why:'No gold'},
    {glyph:'anvil', name:'The Forge', desc:'Metal armour and weapons: one order per 100gp.', orders:0, act:'openCamp()', ok:C.district.smithy === 'held' && !C.fallback, why:'Smithy lost'},
    {glyph:'sword', name:'Sortie', desc:'Fight the foragers outside the walls. Prisoners give intelligence.', act:"boardDo('sortie')", ok:CP().day >= 2, why:'From Day 2'}
  ];
}
function worksCards(){
  const C = CP(), F = id => FORTIFY.find(f => f.id === id);
  return [
    {glyph:'stake', name:'Ditch and Stakes', desc:`Stake lines outside the North Gate (${C.fort.stakes} / 3).`, supply:1, act:"boardFort('stakes')", ok:C.fort.stakes < 3 && C.supply >= 1, why:C.fort.stakes >= 3 ? 'Done' : 'No Supply'},
    {glyph:'flame', name:'Fire Pits', desc:`Buried fire beyond the gate (${C.fort.firepits} / 3).`, gold:25, act:"boardFort('firepits')", ok:C.fort.firepits < 3 && META.treasury >= 25, why:C.fort.firepits >= 3 ? 'Done' : 'No gold'},
    {glyph:'bars', name:'Barricade the Lanes', desc:'Enemies inside the walls move slower, and you get one more trap.', supply:1, act:"boardFort('barricade')", ok:!C.fort.barricades && C.supply >= 1, why:C.fort.barricades ? 'Done' : 'No Supply'},
    {glyph:'arrows', name:'Murder Holes', desc:'The squad shoots harder from inside the Keep.', supply:2, act:"boardFort('murder')", ok:!C.fort.murder && C.supply >= 2 && (C.fallback || C.assault >= 5), why:C.fort.murder ? 'Done' : 'Keep only'}
  ];
}
function townPlanHTML(){
  const C = CP(), M = storyCampMap(), W = M.w, H = M.h;
  const url = M.mini.toDataURL();
  const pins = Object.entries(STRUCTS).map(([k, S]) => { const s = C.st[k], fr = Math.max(0, s.hp / s.max), sel = BOARD.sel === k;
    return `<div class="pin ${s.hp <= 0 ? 'down' : fr < .5 ? 'hurt' : ''} ${sel ? 'sel' : ''}" style="left:${S.face[0] / W * 100}%;top:${S.face[1] / H * 100}%" onclick="BOARD.sel=BOARD.sel==='${k}'?null:'${k}';SFX.play('pick');renderWorkBoard()" data-tip="${S.name}: ${Math.round(s.hp)} / ${s.max}">
      <div class="pbar"><div style="width:${fr * 100}%"></div></div></div>`; }).join('');
  const labs = Object.entries(DISTRICTS).map(([k, D]) => { const over = C.district[k] === 'overrun' || (C.fallback && k !== 'keep');
    return `<div class="dlab ${over ? 'over' : ''}" style="left:${D.at[0] / W * 100}%;top:${D.at[1] / H * 100}%" data-tip="${esc(D.name)}: ${over ? 'OVERRUN. ' + D.lost : 'Held. ' + D.held}">${D.name.replace('Ore Yard and South Gate', 'Ore Yard').replace("The Reeve's Keep", 'The Keep')}</div>`; }).join('');
  let act = '';
  if (BOARD.sel){ const k = BOARD.sel, S = STRUCTS[k], s = C.st[k], base = S.max * HPX, can = id => FORTIFY.find(f => f.id === id).cost.supply <= C.supply && C.orders > 0;
    const opts = [];
    if (s.hp > 0 && s.hp < s.max && (!S.keep || C.fallback || C.assault >= 5)) opts.push(['repair', 'Repair +48', 1]);
    if (s.hp <= 0 && !S.gate) opts.push(['rebuild', 'Raise again', 2]);
    if (S.gate && s.hp > 0 && s.max < base + 8 * HPX) opts.push(['reinforce', 'Reinforce +48', 2]);
    act = `<div class="plaque"><b>${S.name}</b> \u00b7 ${Math.round(s.hp)} / ${s.max}${opts.length ? '' : ' \u00b7 <i>nothing to do</i>'}<div class="mini">${opts.map(([id, l, sup]) => `<button ${can(id) ? '' : 'disabled'} onclick="boardFort('${id}','${k}')">${l} ${chip('order', 1)}${chip('supply', sup)}</button>`).join('')}</div></div>`; }
  return `<div class="plan"><img src="${url}">${labs}${pins}</div>${act || '<div class="plaque dim">Click a wall or gate on the plan to repair or reinforce it.</div>'}`;
}
function intelScroll(){
  const C = CP(), i = C.assault, A = ASSAULTS[i]; if (!A) return '';
  const lab = ['From', 'Strength', 'Target', 'Surprise'], n = C.intelRev[i];
  return `<div class="scroll letter"><h3>Intelligence</h3><div class="sub" style="font-size:14px">Assault ${i + 1}: <b>${A.name}</b>, ${A.when}.</div>` +
    lab.map((l, j) => `<div class="iline"><span class="il">${l}</span>${j < n ? `<span class="iv">${A.intel[j]}</span>` : `<span class="redact" data-tip="Scout, or take prisoners on a Sortie">${'\u2588'.repeat(8 + (j * 5) % 9)}</span>`}</div>`).join('') +
    `<div class="sub" style="font-size:14px;color:var(--blood);margin-top:6px">${A.rule}</div><img class="seal" src="${sealURL('eye', '#3a3a40')}"></div>`;
}
function reportScroll(){
  const C = CP();
  return `<div class="scroll"><h3>${C.part === 'road' ? 'The Road' : 'Morning Report'}</h3>${(C.dayNews || []).map(t => `<div class="ink">${t}</div>`).join('')}
    ${C.log.length ? '<div class="inkhead">Today</div>' + C.log.slice(0, 5).map(t => `<div class="ink small">${t}</div>`).join('') : ''}</div>`;
}
function auxLine(){ const C = CP(); return C.aux.length ? C.aux.map(a => `${a.n} ${AUX[a.type].name}`).join(', ') : 'none'; }
function boardHeader(title, sub){
  const C = CP(), o = [];
  for (let i = 0; i < ordersPerDay(); i++) o.push(`<img src="${i < C.orders ? ICON.order() : ICON.spent()}" class="cand">`);
  return `<div class="table-head"><div style="flex:1"><h1>${title}</h1><div class="hsub">${String(sub).replace(/ \u00b7 /g, '<span class="sep"> \u00b7 </span>')}</div></div>
    <div class="res">${C.part === 'road' ? chip('column', C.column) : ''}${chip('supply', C.supply)}${chip('gold', META.treasury + 'gp')}<span class="cands" data-tip="${C.part === 'road' ? 'Day actions' : 'Work Orders'} left today">${o.join('')}</span></div>
    <button class="btn small" onclick="lookAround()">LOOK AROUND</button></div>`;
}
function renderWorkBoard(){
  const C = CP(); if (!C || (C.part !== 'siege' && C.part !== 'road')) return;
  let h;
  if (C.part === 'siege'){
    const A = nextAssault(), today = A && A.day === C.day;
    h = boardHeader("The Reeve's Hall", `Day ${C.day} of ${lastDay()} \u00b7 ${today ? `<b style="color:#ff8a6a">the assault comes today</b>` : A ? `next assault on Day ${A.day}` : ''} \u00b7 Auxiliaries: ${auxLine()}`);
    h += `<div class="wgrid"><div>${coachScroll()}${reportScroll()}${intelScroll()}
      ${C.canFallBack && !C.fallback ? `<div class="scroll" style="border:2px solid #9a2a14"><h3>Fall Back?</h3><div class="sub" style="font-size:14px">Two districts are lost or the North Gate is down. Fall back to the Keep: every later assault is fought from its walls.</div>
        <div class="mini"><button onclick="CP().fallback=true;CP().canFallBack=false;for (const k in CP().district) if (k!=='keep') CP().district[k]='overrun';CAMP.cpMap=null;syncStoryFacilities();saveMeta();renderWorkBoard()">Fall back</button><button onclick="CP().canFallBack=false;renderWorkBoard()">Hold the town</button></div></div>` : ''}</div>
      <div><div class="scroll"><h3>Work Orders</h3><div class="wcards">${siegeCards().map(wcard).join('')}</div>
        ${C.aux.some(a => a.n < 6) ? (() => { const need = C.aux.reduce((s, a) => s + (6 - a.n), 0), cost = Math.ceil(need / 3); return `<div class="mini" style="justify-content:flex-start;margin-top:6px"><button ${C.supply >= cost ? '' : 'disabled'} onclick="for (const a of CP().aux) a.n=6; CP().supply-=${cost}; saveMeta(); renderWorkBoard()">Refill the auxiliaries ${chip('supply', cost)}</button></div>`; })() : ''}</div></div>
      <div><div class="scroll"><h3>The Town</h3>${townPlanHTML()}<div class="wcards two">${worksCards().map(wcard).join('')}</div></div></div></div>
      <button class="sealbtn big" onclick="endDay()"><img src="${sealURL(today ? 'sword' : 'sun', '#8a1a1a')}">${today ? 'MAN THE WALLS: FACE THE ASSAULT' : 'RING THE BELL: END THE DAY'}</button>`;
  } else {
    const N = NIGHTS[C.night - 1], hasCleric = META.leader.spec === 'CLERIC' || META.roster.some(p => p.spec === 'CLERIC'), diff = N.ground === 'forest' ? 4 : N.ground === 'foothills' ? 5 : 6;
    h = boardHeader('The Ledger Wagon', `Night ${C.night} of ${NIGHTS.length} \u00b7 ${N.place.toLowerCase().indexOf(N.ground) >= 0 ? N.place : N.place + " (" + N.ground + ")"} \u00b7 Wagon ${C.wagonHp} / ${C.wagonMax} \u00b7 Auxiliaries: ${auxLine()}${C.hired ? ', hired sellswords' : ''}`);
    const ev = C.event;
    const evScroll = ev ? `<div class="scroll letter"><h3>On the Road</h3><div class="ink"><b>${ev.t}</b></div><div class="ink small">${ev.text}</div>
      ${ev.res ? `<div class="ink small"><i>${ev.res}</i></div>` : ev.choice ? `<div class="mini" style="justify-content:flex-start"><button ${C.orders > 0 ? '' : 'disabled'} onclick="roadEventChoice(true);renderWorkBoard()">${ev.choice}</button><button onclick="roadEventChoice(false);renderWorkBoard()">Let it go</button></div>` : ''}</div>` : '';
    const tonight = `<div class="scroll letter"><h3>Tonight</h3><div class="iline"><span class="il">Ground</span><span class="iv">${N.place}, ${N.ground}</span></div>
      <div class="iline"><span class="il">Force</span>${C.scouted >= 2 ? `<span class="iv">${N.force.map(f => GROUPS[f[0]].n + ' ' + BESTIARY[GROUPS[f[0]].k].name).join(', ')}</span>` : C.scouted === 1 ? `<span class="iv">${BESTIARY[GROUPS[N.force[0][0]].k].name}, and more</span>` : `<span class="redact" data-tip="Scout to find out">${'\u2588'.repeat(14)}</span>`}</div>
      <div class="iline"><span class="il">Trouble</span>${C.scouted >= 2 ? `<span class="iv">${N.comp}</span>` : `<span class="redact" data-tip="A full Scout reveals it">${'\u2588'.repeat(18)}</span>`}</div><img class="seal" src="${sealURL('horse', '#2e3a4a')}"></div>`;
    const acts = [
      {glyph:'boot', name:'Forage', desc:`Full: +3 Supply. Partial: +1, someone hurt.`, tip:`Against ${diff} on this ground. ${typeof firstCinderNight === 'function' && firstCinderNight() ? 'From Night ' + firstCinderNight() + ', a' : 'A'} miss brings Cinderlings.`, act:"boardDo('forage')"},
      {glyph:'eye', name:'Scout', desc:"Learn tonight's force, and gain an extra Preparation Round.", act:"boardDo('scout')"},
      {glyph:'horn', name:'Recruit', desc:'Refugees take up arms: auxiliaries, and Squad Mates on a Full Success.', tip:'1 Supply each to equip.', act:"boardDo('recruit')"},
      {glyph:'heart', name:'Tend', desc:'Every resting Squad Mate is fit to fight.', act:"boardDo('tend')", ok:META.roster.some(p => p.resting > 0), why:'Nobody hurt'},
      {glyph:'sun', name:'Pray', desc:'Tonight starts Blessed.', act:"boardDo('pray')", ok:hasCleric, why:'No Cleric'},
      {glyph:'coin', name:'Recruit a band', desc:'Hire passing sellswords for tonight.', tip:'Personality against 5. 3 Supply and 40gp, or 5 Supply.', act:"boardDo('parley')", ok:!C.hired, why:'Hired'},
      {glyph:'anvil', name:'Repair the Wagon', desc:'+40 to the Ledger Wagon.', supply:1, act:"boardDo('repair')", ok:C.wagonHp < C.wagonMax && C.supply >= 1, why:'Not needed'},
      {glyph:'saw', name:'Craft', desc:`${(C.slots || []).includes('forge') ? 'The Forge Cart: metal gear too.' : 'Light gear from salvage.'} One action per 100gp.`, orders:0, act:'openCamp()'}
    ];
    const forms = N.fordHold ? [['ford', 'The Ford', 'The wagons start across when the fight begins. Before then, the squad can cross and set traps on the east bank.', true, 'wagon']] : [['laager', 'Wagon Laager', 'Any ground. The wagon ring gives cover to the squad inside it.', true, 'wagon'], ['woodland', 'Woodland Redoubt', 'Forest only. Everyone has cover; nobody sees far.', N.ground === 'forest', 'thorn'], ['square', 'Open Square', 'Plains only. No cover, but the squad shoots harder.', N.ground === 'plain', 'arrows']];
    h += `<div class="wgrid"><div>${coachScroll()}${evScroll}${tonight}${reportScroll()}</div>
      <div><div class="scroll"><h3>Day Actions</h3><div class="wcards">${acts.map(wcard).join('')}</div></div></div>
      <div><div class="scroll"><h3>Make Camp</h3><div class="wcards one">${forms.map(([k, n, t, ok, gl]) => `<div class="wcard ${ok ? '' : 'off'} ${C.formation === k ? 'chosen' : ''}" ${ok ? `tabindex="0" role="button" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();this.click()}" onclick="CP().formation='${k}';CAMP.cpMap=null;SFX.play('pick');saveMeta();renderWorkBoard()"` : ''}>
        <img class="wg" src="${badgeURL(gl === 'wagon' ? 'shield' : gl, '#4e6b2c')}"><div class="wt">${n}</div><div class="wd">${t}</div>${!ok ? `<div class="wstamp">${k === 'woodland' ? 'Forest only' : 'Plains only'}</div>` : C.formation === k ? '<div class="wstamp good">Chosen</div>' : ''}</div>`).join('')}</div>
        <div class="ink small" style="margin-top:6px">Fitted: ${(C.slots || []).map(s => WAGON_SLOTS[s].name).join(', ')}</div></div></div></div>
      <button class="sealbtn big" onclick="launchNight()"><img src="${sealURL('horse', '#2e3a4a')}">NIGHTFALL: DEFEND THE COLUMN</button>`;
  }
  $('table-inner').style.backgroundImage = `url(${tableWoodURL()})`;
  $('table-inner').innerHTML = `<img class="prop" src="${propURL.candle()}" style="left:0.6%;top:46%;width:52px"><img class="prop" src="${propURL.ink()}" style="left:2%;bottom:40px;width:70px"><img class="prop" src="${propURL.dice()}" style="right:2%;bottom:60px;width:88px">` + h;
}
function boardDo(id){ workOrder(id); if (!G) renderWorkBoard(); }
function boardFort(id, k){ fortify(id, k); renderWorkBoard(); }
function lookAround(){ $('screen-table').classList.add('hidden'); $('camp-hint').classList.remove('hidden'); }
function openBoard(){ closePanel(); renderWorkBoard(); hideAll(); $('screen-table').classList.remove('hidden'); $('topbar').classList.remove('hidden'); renderTopbar(); }
{ const f = storyOpenMain; storyOpenMain = function(){ const C = CP(); if (C.part === 'siege' || C.part === 'road') return openBoard(); f(); }; }
{ const f = renderTable; renderTable = function(){ if (inStory()) return renderWorkBoard(); f(); }; }
{ const f = endDay; endDay = function(){ f(); if (!G && inStory() && CP().part === 'siege'){ closePanel(); openBoard(); } }; }
{ const f = refreshUI; refreshUI = function(){ f(); if (inStory() && !$('screen-table').classList.contains('hidden')) renderWorkBoard(); }; }

/* ---------------------------------------------------------------------------
   ADVANCEMENT as cards and tokens, not a form
--------------------------------------------------------------------------- */
const ADV_ICON = {con:['heart', '#c84040'], melee:['sword', '#c8a24a'], ranged:['bow', '#5f8f4e'], magic:['star', '#3f5ea8']};
/* P23-BUG-5 (GD ruling, audits/specs/gd-p23-rulings.md 1): the box says who is at the cap, when the cap rises, and how many are kept.
   Words: CAMPAIGN_LINES.advCapWhy (the ND's); the defaults below stand until then. */
const ADV_WHY = () => Object.assign({atCap: 'At the cap: {n} of {cap}', risesAt: 'The cap rises to {next} when {leader} reaches Level {lv}, at {beat}.',
  rises: 'The cap rises to {next} when {leader} next levels up.', kept: '1 Advancement is kept for later.', keptN: '{n} Advancements are kept for later.', btn: '{n} kept'},
  (window.CAMPAIGN_LINES && CAMPAIGN_LINES.advCapWhy) || {});
const advFill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const advKept = () => { const R = META.advRound; if (!R) return 0; const able = META.roster.filter(p => !(R.given || []).includes(p.id) && (p.adv | 0) < advCap()).length;
  return (R.held | 0) + Math.max(0, (R.left | 0) - able); };
const advRises = () => { const L = META.leader, lv = ((L && +L.level) || 1) + 1, W = ADV_WHY(), v = {next: advCap() + 1, leader: esc((L && L.name) || 'your Leader'), lv};
  let beat = ''; try { if (window.F34 && F34.active() && lv === 2){ const b = (F34.BEATS || []).find(x => x.kind === 'level'); beat = b ? b.name : ''; } } catch (e) {}
  return beat ? advFill(W.risesAt, Object.assign(v, {beat: esc(beat)})) : advFill(W.rises, v); };
advanceBlock = function(){
  const R = META.advRound, left = advLeft();
  if (!left){   /* Neon R6 BUG-5 H2: none to give now but some kept (all at the cap, or the last one just given): the box stays and says why */
    const kn = R ? advKept() : 0; if (!kn) return '';
    const W = ADV_WHY(), full = META.roster.filter(p => p.adv >= advCap());
    return `<div class="advbox" data-advkeptbox="1"><h3 style="margin:0 0 2px">Advancements: ${esc(advFill(W.btn, {n: kn}))}</h3>
    <div class="desc" data-advwhy="1" style="text-align:left;font-size:14px">${full.length ? advRises() + ' ' : ''}${advFill(kn > 1 ? W.keptN : W.kept, {n: kn})}</div>${ADVMSG ? `<div class="desc" style="color:#226b2a;text-align:left"><b>${esc(ADVMSG)}</b></div>` : ''}
    ${full.length ? `<div class="advrow">${full.map(p => `<div class="advcard off"><img class="ap" src="${portraitURL(p, false)}"><div class="an">${esc(p.name)}</div><div class="as">${SPECS[p.spec].name} · ${'◆'.repeat(p.adv)}</div><div class="toks"><i style="font-size:14px">${esc(advFill(W.atCap, {n: p.adv, cap: advCap()}))}</i></div></div>`).join('')}</div>` : ''}</div>`; }
  const cands = META.roster.filter(p => !R.given.includes(p.id)), W = ADV_WHY(), kept = advKept(), capped = cands.some(p => p.adv >= advCap());
  const why = (capped || kept) ? `<div class="desc" data-advwhy="1" style="text-align:left;font-size:14px">${capped ? advRises() : ''}${kept ? (capped ? ' ' : '') + advFill(kept > 1 ? W.keptN : W.kept, {n: kept}) : ''}</div>` : '';
  const tokens = p => advChoices(p).map(o => { const ab = o.k.startsWith('ab:'), ic = ab ? [o.ability.glyph, SPECS[o.ability.spec].color] : ADV_ICON[o.k];
    return `<button class="tok ${o.ok ? '' : 'off'}" ${o.ok ? `onclick="giveAdvancement(${p.id},'${o.k}')"` : 'disabled'} data-tip="${esc(o.ok ? (ab ? o.ability.name + ': ' + o.ability.text(1) : o.label) : o.label + ': ' + o.why)}">
      <img src="${badgeURL(ic[0], ic[1])}"><span>${ab ? o.ability.name : o.label.replace('+1 ', '+1\u00a0')}</span></button>`; }).join('');
  return `<div class="advbox"><h3 style="margin:0 0 2px">Advancements to give: ${'\u2605'.repeat(left)}${advCarried() ? ' (' + esc(advFill(W.carried || '{n} carried over', {n: advCarried()})) + ')' : ''}</h3>
    <div class="desc" style="text-align:left;font-size:14px">${advPickLine(left)}. Up to ${advCap()} each (Leader Level + 1). Hover a token for what it does.</div>
    ${why}${ADVMSG ? `<div class="desc" style="color:#226b2a;text-align:left"><b>${esc(ADVMSG)}</b></div>` : ''}
    <div class="advrow">${cands.map(p => `<div class="advcard ${p.adv >= advCap() ? 'off' : ''}"><img class="ap" src="${portraitURL(p, false)}"><div class="an">${esc(p.name)}</div>
      <div class="as">${SPECS[p.spec].name} \u00b7 ${'\u25c6'.repeat(p.adv)}${'\u25c7'.repeat(Math.max(0, advCap() - p.adv))}</div><div class="toks">${p.adv >= advCap() ? `<i style="font-size:14px">${esc(advFill(W.atCap, {n: p.adv, cap: advCap()}))}</i>` : tokens(p)}</div></div>`).join('') || '<div class="desc">Nobody on the roster can take it yet.</div>'}</div></div>`;
};
/* P23-BUG-5: the button that closes the report names the kept count, e.g. RETURN TO CAMP (1 kept) */
{ const f = renderDebrief; renderDebrief = function(){
    const r = f.apply(this, arguments);
    try { const n = META.leader ? advKept() : 0, el = $('debrief-inner'), b = n && el && el.querySelector('button[onclick^="leaveDebrief"]');
      if (b && !b.querySelector('[data-advkept]')) b.insertAdjacentHTML('beforeend', ` <span data-advkept="1">(${esc(advFill(ADV_WHY().btn, {n}))})</span>`); } catch (e) {}
    return r; }; }

/* ---------------------------------------------------------------------------
   THE FINISH: controls, tooltips and the cursor
--------------------------------------------------------------------------- */
(function(){
  const css = `
  .mini button, .line button, .ledger button, .advbox button:not(.tok), #camp-panel .line button, .plaque button, select, .btn.small{
    font:600 14px Georgia,serif; color:#f5ead2; background:linear-gradient(#6e4e2c,#4a3018); border:2px solid #24160a; border-radius:3px;
    box-shadow:inset 0 1px 0 rgba(255,220,160,.35), 0 2px 0 var(--wood-night); padding:4px 10px; text-shadow:0 1px 0 #000; transition:transform .08s, filter .12s; margin:2px }
  .mini button:hover, .line button:hover, .ledger button:hover, .advbox button:not(.tok):hover, #camp-panel .line button:hover, .plaque button:hover, select:hover, .btn.small:hover{
    filter:brightness(1.18); transform:translateY(-1px); border-color:#8a6a1a; background:linear-gradient(#7e5a32,#563a1c) }
  .mini button:active, .line button:active, .ledger button:active, .plaque button:active{ transform:translateY(1px); box-shadow:inset 0 1px 0 rgba(0,0,0,.4) }
  .mini button:disabled, .line button:disabled, .ledger button:disabled, .plaque button:disabled{ filter:grayscale(.8) brightness(.8); opacity:.55; transform:none }
  .btn{ box-shadow:inset 0 2px 0 rgba(255,220,160,.25), inset 0 -3px 0 rgba(0,0,0,.35), 0 4px 0 #160c04, 0 6px 12px rgba(0,0,0,.4); text-shadow:0 2px 0 #000; letter-spacing:.5px }
  .btn:hover{ transform:translateY(-2px); filter:brightness(1.12); background:inherit }
  .btn.gold:hover{ background:#8a6414 } .btn:active{ transform:translateY(2px); box-shadow:inset 0 2px 0 rgba(0,0,0,.4), 0 1px 0 #160c04 }
  .card{ background:var(--parch,#efe3c8); background-size:256px; border:3px double var(--ink-soft); box-shadow:0 3px 0 rgba(0,0,0,.25), 0 6px 10px rgba(0,0,0,.2) }
  .card:hover{ transform:translateY(-3px); background:var(--parch,#efe3c8); background-size:256px; border-color:#8a6a1a; box-shadow:0 0 0 2px var(--gold), 0 8px 16px rgba(0,0,0,.35) }
  .card.static:hover{ background:var(--parch,#efe3c8); background-size:256px; border-color:var(--ink-soft); box-shadow:0 3px 0 rgba(0,0,0,.25), 0 6px 10px rgba(0,0,0,.2) }
  .card.sel{ border:3px double #226b2a; background:var(--parch,#efe3c8); background-size:256px; box-shadow:0 0 0 2px #6fa37a, 0 6px 10px rgba(0,0,0,.25) }
  input.name, #camp-panel input{ background:rgba(255,250,235,.8); border:2px solid var(--ink-soft); border-radius:2px; box-shadow:inset 0 2px 4px rgba(0,0,0,.25); font-family:Georgia }
  select{ padding:3px 6px; color:#f5ead2 } select option{ background:#3a2814 }
  #camp-panel a, .sheet a{ color:var(--blood); text-decoration:none; border-bottom:1px dotted var(--blood) } #camp-panel a:hover, .sheet a:hover{ color:#a0501a }
  ::-webkit-scrollbar{ width:11px; height:11px } ::-webkit-scrollbar-track{ background:rgba(40,26,12,.35) }
  ::-webkit-scrollbar-thumb{ background:linear-gradient(90deg,#6e4e2c,#4a3018); border:2px solid #24160a; border-radius:4px }
  #tip{ position:fixed; z-index:99; max-width:280px; pointer-events:none; padding:7px 10px; font:14px Georgia; color:var(--ink); background:var(--parch,#efe3c8); background-size:256px;
    border:2px solid #3a2a1a; box-shadow:0 0 0 1px #8a6a3a inset, 0 6px 14px rgba(0,0,0,.5); border-radius:2px; line-height:1.35 }
  #tip.hidden{ display:none }
  /* the work board */
  /* UX §8 (N3a): the status line is a dark plaque, so it reads on the wood */
  .table-head .hsub{ display:inline-block; max-width:100%; box-sizing:border-box; color:#f2e4c0; font-size:clamp(15px, calc(15px + (100vw - 1280px) / 320), 17px); padding:clamp(4px, calc(4px + (100vw - 1280px) / 320), 6px) clamp(10px, calc(10px + (100vw - 1280px) / 160), 14px); background:rgba(20,12,6,.80); border:1px solid rgba(217,180,90,.45); border-radius:4px; text-shadow:none }
  .table-head .hsub .sep{ opacity:.7 }
  .table-head h1{ white-space:nowrap }   /* UX R8-1: the title column never shrinks below its h1 on one line; the plaque wraps inside its own width */
  .res{ display:flex; align-items:center; gap:8px } .res .chip{ font-size:17px; background:rgba(20,12,6,.6); color:#ffe9b0; border-color:#8a6a3a; padding:4px 10px }
  .res .chip img{ height:24px } .cands img{ height:34px; image-rendering:pixelated; margin:0 1px; filter:drop-shadow(0 0 4px rgba(255,190,90,.6)) }
  .chip{ display:inline-flex; align-items:center; gap:3px; font:bold 14px Georgia; color:#3a2a1a; background:rgba(255,248,230,.75); border:1px solid #8a7a5a; border-radius:10px; padding:1px 7px 1px 3px; margin:1px }
  .chip img{ height:16px; image-rendering:pixelated }
  .wgrid{ display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.35fr) minmax(0,1.05fr); gap:6px 22px; max-width:1500px; margin:0 auto; position:relative; z-index:1 }
  /* K101 (UX f48): at 1000-1100 px keep two columns (reports | actions, with The Town or Make Camp under the actions) so Work Orders and Day Actions start on the first screen; one column only below 1000 */
  @media (max-width:1100px){ .wgrid{ grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr) } .wgrid > div:nth-child(3){ grid-column:2 } }
  @media (max-width:999px){ .wgrid{ grid-template-columns:1fr } .wgrid > div:nth-child(3){ grid-column:auto } }
  .wcards{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px } .wcards.two{ grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:10px } .wcards.one{ grid-template-columns:1fr }
  .wcard{ position:relative; background:linear-gradient(rgba(255,250,232,.85),rgba(236,222,190,.85)); border:2px solid #7a5a2a; border-radius:3px; padding:8px 8px 6px 50px; min-height:66px;
    box-shadow:0 2px 0 #4a3418, 0 4px 8px rgba(0,0,0,.25); cursor:pointer; transition:transform .1s, box-shadow .1s }
  .wcard:hover{ transform:translateY(-3px) rotate(-.4deg); box-shadow:0 0 0 2px var(--gold), 0 8px 14px rgba(0,0,0,.35) }
  .wcard:active{ transform:translateY(0) }
  .wcard .wg{ position:absolute; left:6px; top:9px; width:38px; image-rendering:pixelated }
  .wcard .wt{ font:bold 14px Georgia; color:#2a1a0a; font-variant:small-caps } .wcard .wd{ font-size:14px; color:#4a3a2a; line-height:1.3; margin:2px 0 4px }
  .wcard .wc{ display:flex; flex-wrap:wrap }
  .wcard.off{ cursor:default; filter:grayscale(.7); opacity:.62 } .wcard.off:hover{ transform:none; box-shadow:0 2px 0 #4a3418 }
  .wcard.chosen{ border-color:#226b2a; box-shadow:0 0 0 2px #6fa37a, 0 4px 8px rgba(0,0,0,.25) }
  .wstamp{ position:absolute; right:6px; bottom:6px; transform:rotate(-8deg); font:bold 14px Georgia; color:#9a2a14; border:2px solid #9a2a14; padding:0 5px; border-radius:2px; text-transform:uppercase; background:rgba(255,240,220,.6) }
  .wstamp.good{ color:#226b2a; border-color:#226b2a }
  .plan{ position:relative; margin:4px 0 6px } .plan > img{ width:100%; image-rendering:pixelated; display:block; border:3px solid var(--ink-soft); box-shadow:inset 0 0 0 2px #c8b890 }
  .pin{ position:absolute; width:22px; height:22px; margin:-11px 0 0 -11px; border-radius:50%; background:#6a4a2a; border:2px solid #f0e2bf; box-shadow:0 2px 4px rgba(0,0,0,.5); cursor:pointer }
  .pin:hover, .pin.sel{ background:var(--gold); transform:scale(1.2) } .pin.hurt{ background:#c86a2a } .pin.down{ background:#5a1a14; border-color:var(--bad-light) }
  .pin .pbar{ position:absolute; left:-8px; top:24px; width:34px; height:5px; background:rgba(0,0,0,.7) } .pin .pbar div{ height:100%; background:#c8a070 }
  .pin.down .pbar div{ background:#ff5a3a }
  .dlab{ position:absolute; transform:translate(-50%,-50%); font:bold 14px Georgia; color:#2a1a0a; background:rgba(255,245,215,.85); padding:0 4px; border-radius:2px; white-space:nowrap; pointer-events:auto }
  .dlab.over{ color:#fff; background:rgba(150,30,20,.85) }
  .plaque{ background:rgba(255,248,230,.7); border:1px solid #8a7a5a; padding:6px 8px; font-size:14px; border-radius:2px } .plaque.dim{ color:#6a5a44; font-style:italic; font-size:14px }
  .scroll.letter .seal{ position:absolute; right:10px; bottom:8px; width:42px; image-rendering:pixelated; opacity:.9 }
  .iline{ display:flex; gap:8px; align-items:baseline; margin:4px 0; font-size:14px } .iline .il{ width:100px; flex:none; font:bold 14px Georgia; text-transform:uppercase; color:#7a5a2a }
  .iline .iv{ color:#2a1a0a } .redact{ color:#1a1410; letter-spacing:-1px; font-size:14px; cursor:help }
  .ink{ font-size:14px; margin:3px 0; color:#2a1a0a } .ink.small{ font-size:14px; color:#4a3a2a } .inkhead{ font:bold 14px Georgia; text-transform:uppercase; color:#7a5a2a; margin-top:8px; border-top:1px solid rgba(74,59,42,.35); padding-top:4px }
  .sealbtn.big{ font-size:24px; margin:14px auto 30px; color:#ffe9b0; text-shadow:0 2px 0 var(--wood-night), 0 0 10px rgba(0,0,0,.8) } .sealbtn.big:hover{ color:#fff6d8 } .sealbtn.big img{ width:84px }
  /* advancement */
  .advrow{ display:flex; flex-wrap:wrap; gap:10px; margin-top:6px }
  .advcard{ width:190px; background:linear-gradient(rgba(255,250,232,.9),rgba(236,222,190,.9)); border:2px solid #7a5a2a; border-radius:3px; padding:6px; text-align:center; box-shadow:0 2px 0 #4a3418 }
  .advcard.off{ opacity:.55 } .advcard .ap{ height:52px; image-rendering:pixelated } .advcard .an{ font:bold 14px Georgia } .advcard .as{ font-size:14px; color:#6a5a44; letter-spacing:1px }
  .toks{ display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:5px }
  .tok{ display:flex; flex-direction:column; align-items:center; width:auto; min-width:0; padding:3px 2px; background:rgba(255,248,230,.8); border:2px solid #8a6a3a; border-radius:3px; cursor:pointer;
    font:bold 14px Georgia; color:#3a2a1a; box-shadow:0 2px 0 #5a4428; transition:transform .08s }
  .tok img{ width:30px; image-rendering:pixelated } .tok span{ line-height:1.1; margin-top:2px }
  .tok:hover{ transform:translateY(-2px); border-color:var(--gold); box-shadow:0 0 0 2px var(--gold), 0 4px 8px rgba(0,0,0,.3) }
  .tok.off{ opacity:.4; filter:grayscale(1); cursor:default } .tok.off:hover{ transform:none; box-shadow:0 2px 0 #5a4428; border-color:#8a6a3a }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
// A parchment tooltip in place of the browser's: any title or data-tip.
function tipInputs(){
  const tip = document.createElement('div'); tip.id = 'tip'; tip.className = 'hidden'; document.body.appendChild(tip);
  let cur = null;
  document.addEventListener('mouseover', e => {
    let el = e.target; while (el && el !== document.body && !(el.dataset && (el.dataset.tip || el.title))) el = el.parentElement;
    if (!el || el === document.body){ cur = null; tip.classList.add('hidden'); return; }
    if (el.title){ el.dataset.tip = el.title; el.removeAttribute('title'); }
    if (!el.dataset.tip){ tip.classList.add('hidden'); return; }
    cur = el; tip.textContent = el.dataset.tip; tip.classList.remove('hidden');
  });
  document.addEventListener('mousemove', e => { if (!cur) return; const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 8, e.clientX + 16) + 'px'; tip.style.top = Math.min(window.innerHeight - h - 8, e.clientY + 18) + 'px'; });
  document.addEventListener('mousedown', () => { tip.classList.add('hidden'); cur = null; });
}
// A vector gauntlet for a cursor: two tones, 1 px edge rgba(12,8,4,.9), baked at 2x (56x64 device px) for a 28x32 cursor.
function gauntletVec(){
  const c = document.createElement('canvas'); c.width = 56; c.height = 64; const g = c.getContext('2d'); g.scale(2, 2); g.lineJoin = 'round';
  /* P23 CUR (AD 23 Nov, Patrick: "tilt it like a mouse pointer"): the hand leans back about the fingertip, so the finger points up-left
     and the fist trails down-right, like an arrow pointer. CURSOR_TILT (degrees, 0 to 40) sets it live; 0 = upright.
     Review R4 (23 Nov): the hand is shifted so solid steel half a px inside the fingertip sits on the centre of the hotspot pixel (3 2),
     at every tilt (it was 0.9 to 1.4 CSS px off the old hotspot 2 0, on air). */
  const tilt = cursorTilt() * Math.PI / 180, sn = Math.sin(tilt), cs = Math.cos(tilt);
  g.translate(CURSOR_HOT[0] + 0.5 - (3.4 - 0.3 * sn), CURSOR_HOT[1] + 0.5 - (1.4 - 0.3 * cs));   // the tip's inner point (fill apex 0.5 px in) to the hotspot centre
  if (tilt){ g.translate(3.4, 1.4); g.rotate(-tilt); g.translate(-3.4, -1.4); }
  const LI = '#d3d9de', SH = '#8f98a3', EDGE = 'rgba(12,8,4,.9)', rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  const part = (p, f) => { g.fillStyle = f; g.fill(p); g.strokeStyle = EDGE; g.lineWidth = 1; g.stroke(p); };
  part(rr(2.2, 9.6, 10.6, 9.2, 1.2), SH);                                   // fist
  for (const x of [4.9, 7.5, 10.1]) part(rr(x, 7.8, 2.6, 4.6, 1.3), SH);    // the three folded fingers
  part(rr(2, .6, 2.8, 10.4, 1.4), LI);                                       // index finger: one width, tip to knuckle
  g.strokeStyle = SH; g.lineWidth = 1; g.beginPath(); g.moveTo(2.4, 9.6); g.lineTo(4.4, 9.6); g.stroke();   // knuckle line
  part(rr(2.6, 12.4, 7.4, 3.4, 1.7), LI);                                    // thumb folded across the fist
  part(rr(2.6, 18.8, 10.2, 4.6, 1.2), SH);                                   // cuff, in the shade tone
  return c;
}

const CURSOR_HOT = [3, 2];   // CSS px; gauntletVec puts the fingertip on this pixel's centre
/* Review R5: the hand clears the 28x32 canvas only between about -4 and 45 degrees, so the clamp is 0..40. Anything that is not
   a number or a numeric string (null, '', false, Symbol) means the default 25. */
function cursorTilt(){ const v = window.__cursorTilt; let t = NaN;
  if (typeof v === 'number') t = v; else if (typeof v === 'string' && v.trim() !== '') t = Number(v);
  return Number.isFinite(t) ? Math.max(0, Math.min(40, t)) : 25; }
/* CURSOR_TILT is live (review R4): setting it repaints the cursor. A value set before this script loads is kept. */
{ let v = window.CURSOR_TILT; try { delete window.CURSOR_TILT; } catch (e) {} window.__cursorTilt = v;
  try { Object.defineProperty(window, 'CURSOR_TILT', {configurable:true, get(){ return cursorTilt(); }, set(x){ window.__cursorTilt = x; if (document.body) setCursor(); }}); } catch (e) {} }
function setCursor(){
  try {
    const c = gauntletVec(), u = c.toDataURL(), h = CURSOR_HOT.join(' ');   // PL-1 item 1 (AD 23 Nov): a vector gauntlet baked at 2x, 28x32 CSS px
    let st = document.getElementById('gauntlet-cursor');   // one style tag, reused on every repaint (review R4: it leaked one a call)
    if (!st){ st = document.createElement('style'); st.id = 'gauntlet-cursor'; document.head.appendChild(st); }
    st.textContent = `body, #gameCanvas, #gameCanvas.campview{ cursor:image-set(url(${u}) 2x) ${h}, auto } button, .card, .wcard, .tok, .pin, .cscroll, .edge, .marcher, a, [onclick], #gameCanvas.campview.point{ cursor:image-set(url(${u}) 2x) ${h}, pointer }`;
  } catch(e){}
}
{ const f = window.onload; window.onload = function(){ f(); tipInputs(); setCursor(); }; }

/* ============================================================================
   MORE - the prologue as a tutorial, melee and casting that pay off, the
   1-2-3 controls everywhere, practice bouts in the drill yard.
============================================================================ */

/* ---------------------------------------------------------------------------
   THE PROLOGUE: two days at Varnholt, three nights on the road, and the
   squad that survives becomes the Chapter.
--------------------------------------------------------------------------- */
const FULL_ASSAULTS = ASSAULTS.slice(), FULL_NIGHTS = NIGHTS.slice();
ASSAULTS.length = 0;
ASSAULTS.push(
  {day:2, name:'The First Wave', when:'Day 2, dusk', rounds:5, win:'gate', prep:1,
   waves:[[0, [['mob', 'N']]], [2, [['mob', 'N']]], [3, [['mob', 'N']]]],
   intel:['North road', '3 Hollow Levy Mobs', 'The North Gate', 'Nothing. They are exactly what they look like.'],
   rule:'Hold the North Gate. If it falls, the Market is overrun.'},
  {day:3, name:'The Last Day of Varnholt', when:'Day 3, dawn to dusk', rounds:6, win:'survive', prep:1,
   waves:[[0, [['mob', 'N'], ['mob', 'S']]], [1, [['orsolt', 'W']]], [2, [['renegade', 'E']]], [4, [['mob', 'N'], ['mob', 'W']]]],
   intel:['Three sides', 'Hollow Levy Mobs, Orsolt the Hollow Reeve, a Renegade squad', 'Every gate', 'The town cannot hold. Survive the day, and the wagons are waiting.'],
   rule:'Survive the day. Then the town must be abandoned.'}
);
NIGHTS.length = 0;
NIGHTS.push(
  {ground:'forest', place:'Qloria Edge', force:[['chain', 'W'], ['chain', 'N']], comp:'The column is still bunched: the Column Zone is bigger.', bigZone:true, tier:1, trickle:'chaingang', noTick:true},
  {ground:'forest', place:'Deep Forest', force:[['raider', 'W'], ['raider', 'E'], ['cinder', 'N']], comp:'The Raiders go for the Ledger Wagon first.', wagonFirst:true, sub:'ally', tier:1, trickle:'chaingang', noTick:false},
  {ground:'plain', place:'Thornwater Ford', force:[['renegade', 'W'], ['renegade', 'N'], ['priest', 'W'], ['slaver', 'S']], comp:'At the end of Round 5 Artemis\u2019s knights cross the ford. Survive Round 6.', river:true, kalloon:true, sub:'kalloon', tier:1, trickle:'chaingang', noTick:true}
);
const QUICK_ASSAULTS = ASSAULTS.slice(), QUICK_NIGHTS = NIGHTS.slice();
function setChronicle(full){ ASSAULTS.length = 0; ASSAULTS.push(...(full ? FULL_ASSAULTS : QUICK_ASSAULTS)); NIGHTS.length = 0; NIGHTS.push(...(full ? FULL_NIGHTS : QUICK_NIGHTS)); }
const isFull = () => !!(META && META.cp && META.cp.full !== false && (META.cp.full === true || META.cp.part !== 'create' || META.cp.day > 0));   /* Index 89/91: a save with no flag is a pre-split (14 day) prologue, unless it is a brand-new one still on the intro screen */
const lastDay = () => ASSAULTS[ASSAULTS.length - 1].day;
{ const f = newStory; newStory = function(){ f(); META.settings.tips = true; META.tipsSeen = {}; saveMeta(); }; }
// The intro, the retreat and the ending, told for the shorter prologue
{ const f = openStoryIntro; openStoryIntro = function(){ f(); if (isFull()) return;
    $('title-inner').innerHTML = $('title-inner').innerHTML
      .replace(/Part One: fourteen days[^<]*/, 'The prologue: three days holding Varnholt (two assaults), then three nights on the road with the refugees. It teaches the game as it goes, and the squad that survives becomes your Chapter. It has its own save; your main game is untouched.')
      .replace('<h1 style="font-size:54px">The Founding of the Dust Cloaks</h1>', '<div class="tag" style="font-size:14px">Prologue</div><h1 style="font-size:54px">The Founding of the Dust Cloaks</h1>'); }; }
{ const f = retreatHTML; retreatHTML = function(){ if (isFull()) return f(); return f()
    .replace('<h2>Varnholt Stands</h2>', '<h2>The Wagons Roll</h2>').replace('<h2>Varnholt Falls</h2>', '<h2>Varnholt Falls</h2>')
    .replace('At the end of the last assault the Keep still stands, and the host draws back to lick its wounds. The Reeve pays what he promised.',
             'The company holds to the end of the day, and the host draws back to wait for its siege engines. Varnholt cannot take another. The Reeve pays what he promised and orders the town onto the carts.')
    .replace("three weeks' road to the south-east", 'three nights to the south-east'); }; }
// P23-ARTEMIS: endingHTML (founding-story.js) now owns the tiers (13/9/5 full, 15/11/7 short prologue), the speech and the carry-on line.
// Founding at the end of the prologue writes the survivors into the main game's save.
{ const f = finishFound; finishFound = function(){
    if (!(FD && FD.fromStory)) return f();
    const gold = FD.gold || 0;
    let ok = true; try { const m = JSON.parse(localStorage.getItem(MAIN_SLOT) || 'null'); if (m && m.leader) ok = gate(`Your main game already has a Chapter led by ${esc(m.leader.name)}. Replace it with the Dust Cloaks from the prologue?`, () => finishFound()); } catch(e){}
    if (!ok) return;
    f();
    delete META.cp; META.treasury = 200 + gold; META.raid = null; META.board = null; META.hireLine = null; { const R = META.advRound, n = R ? (R.held | 0) + Math.max(0, R.left | 0) : 0; META.advRound = n > 0 ? {left: 0, held: n, given: []} : null; }   /* Neon R6 BUG-5 H1 (GD 1b): a kept Advancement is never lost at the hand-over; the first main-game round takes it as carried */
    META.tipsSeen = {}; META.deployments = 1;
    SAVE_KEY = MAIN_SLOT; saveMeta(); try { if (!(window.UX && UX.stopped)) localStorage.removeItem(STORY_SLOT); } catch(e){}   /* Fable job 4: a tab that lost the lock must not delete the other tab's prologue */
    applySkin(); CAMP.cpMap = null; CAMP.people = []; CAMP.dirty = true; renderTitle();
    centreCamOn(HUB.house.x, HUB.house.y); openPanel('house', 'house');
  }; }
{ const f = foundAfterStory; foundAfterStory = function(gold){ f(gold); if (FD){ FD.gold = gold; } META.treasury -= gold; saveMeta(); }; }
// The Sergeant's advice: what to do, at each step of the prologue
function coachLines(){
  const C = CP(), out = [];
  if (C.part === 'siege'){
    if (C.day === 1) out.push('The candles are your Work Orders: three a day. <b>Rally the Town</b> for levies, <b>Train</b> them into militia, <b>Scout</b> to read the enemy\u2019s plan.',
      'Tomorrow the first wave comes from the north. <b>Ditch and Stakes</b> outside the North Gate pay for themselves.', 'When you are done, ring the bell to end the day.');
    if (C.day === 2) out.push('The assault comes today. In the fight: <b>WASD</b> moves, and the squad attacks on its own. <b>1, 2, 3...</b> fire your abilities. <b>SPACE</b> forms a Shield Wall.',
      'Your own gates open for you. Walk out and press <b>F</b> to set traps before the horn.', 'Melee hits stagger the enemy and fill Momentum twice as fast. Spell-casters grow stronger as the fight goes on.');
    if (C.day === 3) out.push('The town cannot hold. Survive the day; then the wagons are waiting.', 'A red banner and a red arrow tell you when a wall is under attack somewhere else. Your levies run there first.',
      'Kills fill the Momentum bar. At each rank the fight pauses: press <b>1, 2 or 3</b> to choose.');
  }
  if (C.part === 'road'){
    if (C.night === 1) out.push('On the road there is no market and no Hiring Line. <b>Recruit</b> among the refugees, <b>Forage</b> for Supply, and choose how to make camp.',
      'Tonight, guard the column. Any enemy that reaches it costs Column Strength.');
    if (NIGHTS[C.night - 1].wagonFirst) out.push(NIGHTS[C.night - 1].wagonStake ? 'Tonight\u2019s raiders go for the Ledger Wagon first. If they wreck it, we lose a fitting, or 2 Supply if it has none.' : 'Tonight\u2019s raiders go for the Ledger Wagon. If they wreck it, we lose one of its fittings.', '<b>Repairing the Wagon</b> costs a day action and 1 Supply.');
    if (C.night === NIGHTS.length) out.push('The last night: Artemis\u2019s lands are across the ford. Hold until his knights come.', 'Afterwards, this squad becomes your Chapter.');
  }
  return out;
}
function coachScroll(){
  if (!inStory()) return '';
  const L = coachLines(); if (!L.length) return '';
  return `<div class="scroll letter coach"><h3>The Sergeant\u2019s Advice</h3>${L.map(t => `<div class="ink">\u2022 ${t}</div>`).join('')}<img class="seal" src="${sealURL('flag', '#5a5a56')}"></div>`;
}

/* ---------------------------------------------------------------------------
   MELEE AND CASTING THAT PAY OFF (ranged is not touched)
   Melee: every hit staggers its target (it cannot attack for a moment and is
     knocked back), melee kills fill Momentum twice as fast, and a model who
     kills in melee steadies the line (a Ward Token, now and then).
   Casting: Specialty passives come 30% faster and grow with Magic: Magic
     Missile darts hit harder, Withering Hex spreads to the victim's
     neighbours when it dies, and Mending Prayer heals more and wards.
--------------------------------------------------------------------------- */
{ const f = strike; strike = function(e, skill, baseDmg, o = {}){
    const melee = !!(o.from && !o.ranged && !o.piercing);
    const prev = G._melee; G._melee = melee;
    f(e, skill, baseDmg, o);
    if (melee && !e.dead && !BESTIARY[e.k].boss && BESTIARY[e.k].arch !== 'fixed'){
      e.stagger = Math.max(e.stagger || 0, 26); e.hitCd = Math.max(e.hitCd || 0, 18);
      const a = Math.atan2(e.y - o.from.y, e.x - o.from.x); e.x += Math.cos(a) * 6; e.y += Math.sin(a) * 6; collide(e, e.r * .7);
    }
    G._melee = prev;
  }; }
{ const f = killReward; killReward = function(e, B){
    if (G._melee){ f(e, B); gainXP(Math.max(1, Math.round(B.xp * G.mod.loot * 0.4)));   /* Index 35 */ G.fx.push({spark:true, x:e.x, y:e.y - 10, life:28, c:'#ffb04a'});
      if (Math.random() < 0.12) addWard(1); }
    else f(e, B);
    if (e.hexT > 0) for (const o of G.enemies) if (!o.dead && o !== e && dist(o, e) < 80){ o.hexT = Math.max(o.hexT || 0, 180); o.poison = 1; }
  }; }
{ const f = specPassive; specPassive = function(u, isLeader){
    if (u.passT > 0) u.passT -= 0.3;                // casters: 30% faster
    const before = u.passT; f(u, isLeader);
    const mg = (u.s && u.s.magic) || 0;
    if (u.spec === 'CLERIC' && before <= 0 && u.passT >= 400 && mg >= 2){ addWard(1); }
    if (u.spec === 'MAGE' && before <= 0 && u.passT >= 200 && mg >= 3) for (const s of G.shots) if (s.kind === 'missile' && !s.boost){ s.boost = true; s.bonus = Math.floor(mg / 3); }
  }; }
{ const f = hurtEnemy; hurtEnemy = function(e, n){ f(e, n); }; }
// Magic Missile bonus damage from Magic 3 and 6
{ const f = updateShots; updateShots = function(){
    for (const s of G.shots) if (s.kind === 'missile' && s.bonus && s.target && !s.target.dead && dist(s, s.target) < s.target.r + 8){ hurtEnemy(s.target, s.bonus); s.bonus = 0; }
    f(); }; }

/* ---------------------------------------------------------------------------
   1, 2, 3 EVERYWHERE
   Abilities take the number keys in the order they sit on the bar (no gaps),
   and every pick screen (Momentum, Parley) answers to 1, 2 and 3.
--------------------------------------------------------------------------- */
const ABIL_HOME = {}; for (const s in ABILITIES) ABIL_HOME[s] = ABILITIES[s].key;
function packAbilityKeys(){
  if (!G) return;
  for (const k in ABIL_KEYS) delete ABIL_KEYS[k];
  squadSpecs().forEach((s, i) => { ABILITIES[s].key = String(i + 1); ABIL_KEYS[String(i + 1)] = s; });
}
{ const f = buildAbilities; buildAbilities = function(){ f(); packAbilityKeys(); }; }
{ const f = leaveDebrief; leaveDebrief = function(){ for (const s in ABIL_HOME){ ABILITIES[s].key = ABIL_HOME[s]; } f(); }; }
window.addEventListener('keydown', e => {
  const k = e.key;
  if (!/^[1-3]$/.test(k) || e.repeat) return;
  if (PARLAY && !PARLAY.rolled){ e.stopImmediatePropagation(); parlayChoice(['surrender', 'withdraw', 'fight'][+k - 1]); return; }
}, true);
{ const f = renderParlay; renderParlay = function(){ f();
    const cards = document.querySelectorAll('#parlay-inner .card'); cards.forEach((c, i) => { const t = c.querySelector('.ttl'); if (t && !/\[\d\]/.test(t.textContent)) t.innerHTML = `<span class="kbd">${i + 1}</span> ` + t.innerHTML; }); }; }
// F-41 (2026-11-14): the Momentum cards keep their own keys, 7 8 9 (1 to 6 are the abilities), shown on each card; the field runs on
TIPS.levelup = 'Momentum rank! Kills fill the bar at the top. The fight goes on: press 7, 8 or 9 (or click a card) when you are clear, or TAB to hide the cards for later.';
TIPS.abilities = 'Each Specialty in the squad adds an ability to the bar at the bottom, numbered 1, 2, 3 in order. Two of the same Specialty fire it twice.';

/* ---------------------------------------------------------------------------
   THE DRILL YARD: practice bouts and sparring
   With Training Grounds or Barracks, the squad can spar against any host at
   any tier. Nobody dies, nobody is hurt, nothing is earned: it is for testing
   a squad's make-up. Off duty, Squad Mates spar in the yard on their own.
--------------------------------------------------------------------------- */
OBJECTIVES.drill = {name:'Practice Bout', brief:'Sparring in the drill yard.'};
let DRILL = {host:'bandits', tier:1, ids:null};
function drillHTML(){
  const ids = DRILL.ids || (DRILL.ids = META.roster.filter(p => !p.resting).slice(0, 5).map(p => p.id));
  const body = `<div class="desc" style="text-align:left;margin-top:8px"><b>Practice Bout.</b> Spar against any foe, as long as you like. Nobody dies, nobody is hurt, and nothing is earned: try out a squad before you risk it.</div>
    <div class="mini" style="justify-content:flex-start">${HOST_KEYS.map(h => `<button style="${DRILL.host === h ? 'background:#8a6414' : ''}" onclick="DRILL.host='${h}';renderPanel()">${HOSTS[h].name}</button>`).join('')}</div>
    <div class="mini" style="justify-content:flex-start">${[1, 2, 3].map(t => `<button style="${DRILL.tier === t ? 'background:#8a6414' : ''}" onclick="DRILL.tier=${t};renderPanel()">Tier ${t}</button>`).join('')}</div>
    <div class="mini" style="justify-content:flex-start">${META.roster.map(p => `<button style="${ids.includes(p.id) ? 'background:#3a6a2a' : ''}" onclick="drillToggle(${p.id})" data-tip="${esc(RACES[p.race].name + ' ' + SPECS[p.spec].name)}">${esc(p.name)}</button>`).join('')}</div>
    <button class="btn gold" onclick="startDrill()">START THE BOUT (${ids.length} / 5)</button>`;
  /* UX K96: the bout folds into one closed section; its header says what is set */
  return typeof sec96 === 'function' ? sec96('bout', `<b>Practice Bout</b> <span style="opacity:.8">\u00b7 ${esc(HOSTS[DRILL.host].name)}, Tier ${DRILL.tier}, ${ids.length} of 5 mates</span>`, body) : body;
}
function drillToggle(id){ const a = DRILL.ids, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else if (a.length < 5) a.push(id); SFX.play('pick'); renderPanel(); }
function startDrill(){
  if (!META.leader) return;
  closePanel();
  startDeployment({obj:'drill', tier:DRILL.tier, host:DRILL.host, place:'the drill yard', edges:[], council:null, picks:0, minutes:0, pay:0, patron:'nobody', faction:null, seed:7}, (DRILL.ids || META.roster.filter(p => !p.resting).slice(0, 5).map(p => p.id)).slice());   /* Index 49 audit */
}
function generateDrillMap(){
  const w = 40, h = 32, g = new Uint8Array(w * h), r = rng(77);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  const M = {w, h, g, seed:7, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:{x:20, y:16}, exit:null, cages:[], nests:[], engines:[], beacons:[]};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const d = Math.hypot((x - 20) / 1.25, y - 16); if (d > 14) set(x, y, T.FOREST); else if (d < 11 && r() < 0.6) set(x, y, T.ROAD); }
  for (let a = 0; a < 200; a++){ const t = a / 200 * TAU, x = Math.round(20 + Math.cos(t) * 17), y = Math.round(16 + Math.sin(t) * 13.5); if (a % 25 > 2) set(x, y, T.PALISADE); }
  for (let x = 0; x < w; x++){ set(x, 0, T.STONE); set(x, h - 1, T.STONE); } for (let y = 0; y < h; y++){ set(0, y, T.STONE); set(w - 1, y, T.STONE); }
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d'); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h); M.seen.fill(1);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y * w + x] === T.FOREST && r() < 0.5) M.trees.push({x:(x + .3 + r() * .4) * CELL, y:(y + .4 + r() * .5) * CELL, v:r() * 3 | 0});
  MAP = M; M.reach = bfsFrom(20.5 * CELL, 16.5 * CELL); return M;
}
{ const f = generateMap; generateMap = c => c.obj === 'drill' ? generateDrillMap() : f(c); }
{ const f = setupContract; setupContract = c => { if (c.obj !== 'drill') return f(c); G.drillWave = 0; G.drillT = 0; G.caches.length = 0; G.blips.length = 0;
    note(`Practice bout: ${HOSTS[c.host].name}, Tier ${c.tier}. Nobody dies. ESC and Withdraw ends the bout.`); }; }
{ const f = placeTraps; placeTraps = c => c.obj === 'drill' ? (G.traps = []) : f(c); }
{ const f = updateContract; updateContract = function(){
    if (G.obj !== 'drill') return f();
    // nobody bleeds out and nobody stays down for long
    for (const m of G.squad) if (m.state === 'bleeding' || m.state === 'stable'){ m.bleedT = 0; m.yieldT = (m.yieldT || 0) + 1; if (m.yieldT > 360){ m.yieldT = 0; standUp(m, 'BACK IN'); } }
    if (G.leader.down){ G.leader.bleedT = 0; G.leader.yieldT = (G.leader.yieldT || 0) + 1; if (G.leader.yieldT > 360){ G.leader.yieldT = 0; standLeader('BACK IN'); } }
    // waves, a little stronger each time the yard is cleared
    const live = G.enemies.filter(e => !e.dead).length;
    if (live === 0 && ++G.drillT > 90){ G.drillT = 0; G.drillWave++;
      const pool = HOSTS[G.contract.host].pools[G.contract.tier], n = 6 + G.drillWave * 3;
      for (let i = 0; i < n; i++){ const a = i / n * TAU, e = spawnEnemy(pool[i % pool.length], (20.5 + Math.cos(a) * 12) * CELL, (16.5 + Math.sin(a) * 9.5) * CELL, {noNem:true}); if (e) e.seen = true; }
      if (G.drillWave % 3 === 0){ const e = spawnEnemy(pickOf(HOSTS[G.contract.host].bosses[G.contract.tier]), 20.5 * CELL, 4 * CELL, {noNem:true}); if (e){ e.seen = true; e.parleyed = true; } }
      pop(G.leader.x, G.leader.y - 60, 'ROUND ' + G.drillWave, '#ffe9b0'); SFX.play('horn'); }
  }; }
{ const f = spawn; spawn = () => G.obj === 'drill' ? null : f(); }
{ const f = contractCheck; contractCheck = () => G.obj === 'drill' ? false : f(); }
{ const f = contractProgress; contractProgress = () => G.obj === 'drill' ? 0 : f(); }
{ const f = contractLine; contractLine = t => G.obj === 'drill' ? [`ROUND ${G.drillWave}`, `PRACTICE BOUT \u00b7 ${HOSTS[G.contract.host].name.toUpperCase()} \u00b7 TIER ${G.contract.tier} \u00b7 ${G.kills} DOWN \u00b7 ESC TO END`] : f(t); }
{ const f = contractBodies; contractBodies = (b, o) => G.obj === 'drill' ? null : f(b, o); }
{ const f = contractMarkers; contractMarkers = out => G.obj === 'drill' ? null : f(out); }
{ const f = offerParlay; offerParlay = e => G.obj === 'drill' ? null : f(e); }
{ const f = endDeployment; endDeployment = function(result){
    if (!G || G.obj !== 'drill') return f(result);
    if (G.over) return; G.over = true; G.paused = true;
    $('overlay-pause').classList.add('hidden');
    const lines = [`<p>The bout lasted <b>${G.sec / 60 | 0}m ${G.sec % 60}s</b>: ${G.drillWave} round${G.drillWave === 1 ? '' : 's'} against ${HOSTS[G.contract.host].name} (Tier ${G.contract.tier}). ${G.kills} put down, best streak ${G.bestStreak || 0}, Momentum rank ${G.lvl}.</p>`,
      `<p>The squad went down ${G.downedIds.size} time${G.downedIds.size === 1 ? '' : 's'}${G.leaderDowns ? `, and the Leader ${G.leaderDowns}` : ''}. Bruises only: nobody is hurt, nothing is earned.</p>`];
    for (const m of G.squad) if (m.state === 'dead') m.state = 'up';
    renderDebrief('PRACTICE OVER', lines);
  }; }
{ const f = startDeployment; startDeployment = function(c, ids){ f(c, ids); if (G && c.obj === 'drill'){ G.noTick = true; G.noAdv = true; } }; }
// The ESC menu in a bout: "Withdraw" ends it with no penalty.
{ const f = togglePause; togglePause = function(){ f(); if (G && G.obj === 'drill' && G.paused){ const p = $('pause-inner'); if (p) p.innerHTML = p.innerHTML.replace(/Withdraw now and the patron pays nothing\.|Enough of the job is done to withdraw on half pay\./, 'End the bout whenever you like.').replace('>WITHDRAW<', '>END THE BOUT<'); } }; }
// The panel buttons
{ const f = trainingHTML; trainingHTML = function(fid){ const h = f(fid); return (fid === 'training' || (fid === 'barracks' && !has('training'))) && has(fid) ? h + drillHTML() : h; }; }
// Off-duty sparring in the yard: pairs of idle Squad Mates trade blows
{ const f = campSync; campSync = function(){ f(); if (inStory && inStory()) return;
    const idle = CAMP.people.filter(q => q.kind === 'mate' && !(q.p.resting > 0));
    idle.forEach((q, i) => { q.sparring = i < 4 && (i % 2 === 0 ? i + 1 < idle.length : true) && (q.p.id % 3 !== 0 || i < 2); q.sparSide = i % 2; }); }; }
// RK_ART is loaded from assets/rankn-art.js
