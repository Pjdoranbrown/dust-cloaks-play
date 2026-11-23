/* js/camp/rankn-dice.js (INT-1 step 2, 2026-11-16): RANK'N, DICE ON THE TABLE.
   Cut unchanged from the inline script in index.html (old lines 8900 to 9288). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   RANK'N - the tavern game (Legend Lore Studios). Copper Spears beat Gold
   Knights, Silver Bows beat Spears, Knights beat Bows. Play a Squad Mate for
   real gold from the Treasury: you stake every coin you put on the board, and
   at the end you keep your surviving coins and every coin you captured.
============================================================================ */
const RK_TYPES = {S:{name:'Spear', metal:'copper', beats:'K', key:'1'}, B:{name:'Bow', metal:'silver', beats:'S', key:'2'}, K:{name:'Knight', metal:'gold', beats:'B', key:'3'}};
const RK_ORDER = ['S', 'B', 'K'];
const RK_STAKES = {low:{name:'Penny table', mult:1}, table:{name:'Soldier\u2019s table', mult:5}, high:{name:'High table', mult:20}};
const RK_BASE = {S:1, B:2, K:4};
let RK = null;
const rkVal = t => RK_BASE[t] * RK_STAKES[RK.stake].mult;
const rkCoinURL = (side, t) => RK_ART[(side === 'P' ? 't' : 'h') + {S:'c', B:'s', K:'g'}[t]];
const dark = (r, c) => (r + c) % 2 === 1;
function rkCanCap(att, def){ return att.types.some(a => def.types.some(d => RK_TYPES[a].beats === d)); }
function rkMoves(b, side){
  const out = [], fwd = side === 'P' ? -1 : 1;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++){
    const p = b[r][c]; if (!p || p.side !== side) continue;
    const dirs = [[fwd, -1], [fwd, 1]].concat(p.types.length > 1 ? [[-fwd, -1], [-fwd, 1]] : []);
    for (const [dr, dc] of dirs){ const r2 = r + dr, c2 = c + dc; if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && !b[r2][c2]) out.push({from:[r, c], path:[[r2, c2]], caps:[]}); }
    const jump = (r0, c0, path, caps, seen) => {
      for (const [dr, dc] of dirs){ const mr = r0 + dr, mc = c0 + dc, lr = r0 + 2 * dr, lc = c0 + 2 * dc;
        if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
        const v = b[mr][mc]; if (!v || v.side === side || seen.has(mr * 8 + mc) || !rkCanCap(p, v)) continue;
        if (b[lr][lc] && !(lr === r && lc === c)) continue;
        const np = path.concat([[lr, lc]]), nc = caps.concat([[mr, mc]]), ns = new Set(seen); ns.add(mr * 8 + mc);
        out.push({from:[r, c], path:np, caps:nc}); jump(lr, lc, np, nc, ns); }
    };
    jump(r, c, [], [], new Set());
  }
  return out;
}
function rkApply(b, m, promoteTo){
  const nb = b.map(row => row.map(x => x ? {side:x.side, types:x.types.slice()} : null)), [r, c] = m.from, p = nb[r][c];
  nb[r][c] = null; const caps = [];
  for (const [cr, cc] of m.caps){ caps.push(nb[cr][cc]); nb[cr][cc] = null; }
  const [er, ec] = m.path[m.path.length - 1]; nb[er][ec] = p;
  const far = p.side === 'P' ? 0 : 7; let promoted = false;
  if (er === far && p.types.length === 1 && promoteTo){ p.types.push(promoteTo); promoted = true; }
  return {b:nb, caps, promoted, piece:p, at:[er, ec]};
}
const rkPV = {S:1, B:1.3, K:1.6};
function rkEval(b, side){
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++){ const p = b[r][c]; if (!p) continue;
    let v = p.types.reduce((a, t) => a + rkPV[t] * 3, 0) + (p.types.length > 1 ? 2 : 0) + (p.side === 'P' ? (7 - r) : r) * 0.08;
    s += p.side === side ? v : -v; }
  return s;
}
function rkBestPromo(b, side){
  const opp = {S:0, B:0, K:0}; for (const row of b) for (const p of row) if (p && p.side !== side) for (const t of p.types) opp[t]++;
  return RK_ORDER.slice().sort((x, y) => opp[RK_TYPES[y].beats] - opp[RK_TYPES[x].beats])[0];
}
function rkSearch(b, side, depth, alpha, beta){
  const ms = rkMoves(b, side), other = side === 'P' ? 'A' : 'P';
  if (!ms.length) return {score:-999 - depth};
  if (depth === 0) return {score:rkEval(b, side)};
  ms.sort((x, y) => y.caps.length - x.caps.length);
  let best = {score:-1e9, move:ms[0]};
  for (const m of ms){
    const far = side === 'P' ? 0 : 7, end = m.path[m.path.length - 1];
    const res = rkApply(b, m, end[0] === far ? rkBestPromo(b, side) : null);
    const sc = -rkSearch(res.b, other, depth - 1, -beta, -alpha).score;
    if (sc > best.score){ best = {score:sc, move:m}; }
    alpha = Math.max(alpha, sc); if (alpha >= beta) break;
  }
  return best;
}

/* ---------------------------------------------------------------------------
   THE TABLE
--------------------------------------------------------------------------- */
function rkDepth(p){ return p.spec === 'SCOUNDREL' || p.spec === 'MAGE' ? 4 : ['ORC', 'GOBLIN', 'HALF_ORC'].includes(p.race) ? 2 : 3; }
function rkNew(oppId, stake){
  const opp = META.roster.find(p => p.id === oppId) || (META.officers || []).find(o => o.id === oppId); if (!opp) return;
  const b = Array.from({length:8}, () => Array(8).fill(null));
  RK = {opp, stake, b, phase:'flip', turn:null, sel:null, chain:null, paid:0, capP:[], capA:[], ply:0, msg:'', draftType:'S', draftLeft:{P:4, A:4}, promo:null, last:null};
  const need = 4 * rkVal('S') + 4 * rkVal('K');
  if (META.treasury < need){ RK = null; SFX.play('nope'); return askAlert('Not enough gold', `The ${RK_STAKES[stake].name} needs ${need}gp in the Treasury to sit down.`); }
  for (let c = 0; c < 8; c++){ if (dark(6, c)) b[6][c] = {side:'P', types:['S']}; if (dark(1, c)) b[1][c] = {side:'A', types:['S']}; }
  rkPay(4 * rkVal('S'));
  RK.first = Math.random() < .5 ? 'P' : 'A'; RK.turn = RK.first; RK.phase = 'draft';
  RK.msg = `The coin spins... <b>${RK.first === 'P' ? 'You place first, and move first' : esc(opp.name) + ' places first, and moves first'}.</b>`;
  closePanel(); rkOpen(); if (RK.turn === 'A') setTimeout(rkAI, 700);
  if (RK) showDice('The Coin Spins', [{face:RK.first === 'P' ? 'H' : 'T', skill:'?', label:RK.first === 'P' ? 'You go first' : esc(RK.opp.name) + ' goes first', win:RK.first === 'P'}], {hold:500});   /* INT-1 stage 3 group 4: the coin dice, folded in from the wrapper below */
}
/* PD-40 (Patrick Q40, 2026-11-16): the stake leaves the Treasury on the first move; until then it is only held, and leaving is free */
function rkPay(n){ RK.paid += n; if (RK.moved){ META.treasury -= n; saveMeta(); } }
function rkStake(){ if (RK && !RK.moved){ RK.moved = true; META.treasury -= RK.paid; saveMeta(); } }
function rkFree(){ return META.treasury - (RK && !RK.moved ? RK.paid : 0); }
function rkOpen(){
  let el = $('screen-rankn');
  if (!el){ el = document.createElement('div'); el.id = 'screen-rankn'; el.className = 'screen'; document.body.appendChild(el); SCREENS.push('screen-rankn'); }
  hideAll(); el.classList.remove('hidden'); rkRender();
}
function rkClose(){ const el = $('screen-rankn'); if (el) el.classList.add('hidden'); RK = null; renderTitle(); }
function rkPieces(side){ let n = 0; for (const row of RK.b) for (const p of row) if (p && p.side === side) n++; return n; }
function rkValueOf(p){ return p.types.reduce((a, t) => a + rkVal(t), 0); }
function rkSurvivors(side){ let v = 0; for (const row of RK.b) for (const p of row) if (p && p.side === side) v += rkValueOf(p); return v; }
function rkCoinHTML(p, small){
  const s = small ? 26 : 50;
  return p.types.map((t, i) => `<img src="${rkCoinURL(p.side, t)}" style="width:${s}px;height:${s}px;position:absolute;left:50%;top:50%;transform:translate(${-50 + i * 14}%,${-50 - i * 22}%);filter:drop-shadow(0 ${2 + i * 2}px 2px rgba(0,0,0,.7))">`).join('');
}
function rkRender(){
  const el = $('screen-rankn'); if (!el || !RK) return;
  const legal = RK.phase === 'play' && RK.turn === 'P' ? (RK.chain ? RK.chain.next : rkMoves(RK.b, 'P')) : [];
  const fromSel = RK.sel ? legal.filter(m => m.from[0] === RK.sel[0] && m.from[1] === RK.sel[1] && (RK.chain ? true : true)) : [];
  const targets = new Map(); for (const m of fromSel){ const step = RK.chain ? m.path[RK.chain.steps] : m.path[0]; if (step) targets.set(step[0] * 8 + step[1], m); }
  let cells = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++){
    const p = RK.b[r][c], dk = dark(r, c), sel = RK.sel && RK.sel[0] === r && RK.sel[1] === c, tg = targets.has(r * 8 + c);
    const can = p && p.side === 'P' && legal.some(m => m.from[0] === r && m.from[1] === c);
    const draftSpot = RK.phase === 'draft' && RK.turn === 'P' && r === 7 && dk && !p;
    const last = RK.last && RK.last.some(([lr, lc]) => lr === r && lc === c);
    cells += `<div class="rkc ${dk ? 'dk' : 'lt'} ${sel ? 'sel' : ''} ${tg ? 'tg' : ''} ${can ? 'can' : (p && p.side === 'P' && RK.phase === 'play' && RK.turn === 'P' ? 'nomv' : '')} ${draftSpot ? 'tg' : ''} ${last ? 'last' : ''}" onclick="rkClick(${r},${c})">${p ? rkCoinHTML(p) : ''}${tg || draftSpot ? '<span class="dot"></span>' : ''}</div>`;
  }
  const purse = (list, side) => list.length ? list.map(p => `<span class="rkp">${rkCoinHTML(p, true)}</span>`).join('') : '<i style="opacity:.6">none yet</i>';
  const net = RK.phase === 'over' ? RK.result : null;
  const typeBtns = (act) => RK_ORDER.map(t => `<button class="rkt ${RK.draftType === t && act === 'draft' ? 'on' : ''}" onclick="${act === 'draft' ? `RK.draftType='${t}';rkRender()` : `rkPromote('${t}')`}" ${act === 'promo' && RK.promo && RK.promo.base === t ? 'disabled' : ''}>
      <img src="${rkCoinURL('P', t)}"><b>${RK_TYPES[t].key}</b> ${RK_TYPES[t].name} <span>${rkVal(t)}gp</span><small>beats ${RK_TYPES[RK_TYPES[t].beats].name}s</small></button>`).join('');
  let side = '';
  if (RK.phase === 'draft') side = `<div class="rkbox"><h3>The Draft</h3><div class="ink">Take turns placing four coins in your back row. Pick a coin, then a lit square. Each coin is staked from the Treasury. Nothing is taken until the first move: you may leave free until then.</div><div class="rkts">${typeBtns('draft')}</div>
    <div class="ink small">You have ${RK.draftLeft.P} to place; ${esc(RK.opp.name)} has ${RK.draftLeft.A}.</div></div>`;
  else if (RK.promo) side = `<div class="rkbox"><h3>A Veteran!</h3><div class="ink">Your coin reached the far row. Stack a second coin on it: it may now strike as either, move backwards, and is worth both if taken.</div><div class="rkts">${typeBtns('promo')}</div></div>`;
  else if (RK.phase === 'play') side = `<div class="rkbox"><h3>${RK.turn === 'P' ? 'Your move' : esc(RK.opp.name) + ' is thinking...'}</h3><div class="ink small">Move a coin one square diagonally forward, or jump an adjacent enemy coin yours beats. You may keep jumping.</div>
    ${RK.chain ? `<button class="btn small" onclick="rkEndChain()">STOP JUMPING</button>` : ''}<div class="rkrule"><img src="${rkCoinURL('P', 'S')}">beats<img src="${rkCoinURL('P', 'K')}">beats<img src="${rkCoinURL('P', 'B')}">beats<img src="${rkCoinURL('P', 'S')}"></div></div>`;
  else if (RK.phase === 'over') side = `<div class="rkbox"><h3>${net.head}</h3><div class="ink">${net.text}</div><div class="ink" style="font-size:20px;margin:8px 0">${net.delta >= 0 ? '<b style="color:#226b2a">+' + net.delta + 'gp</b>' : '<b style="color:#9a2a14">' + net.delta + 'gp</b>'} to the Treasury</div>
    <button class="btn gold" onclick="rkNew(${RK.opp.id},'${RK.stake}')">PLAY AGAIN</button><button class="btn small" onclick="rkClose()">LEAVE THE TABLE</button></div>`;
  el.innerHTML = `<div class="rkwrap" style="background-image:linear-gradient(rgba(20,10,4,.72),rgba(20,10,4,.85)),url(${RK_ART.bg})">
    <div class="rkhead"><h1>Rank\u2019n</h1><div class="hsub">${RK_STAKES[RK.stake].name}: Spear ${rkVal('S')}gp \u00b7 Bow ${rkVal('B')}gp \u00b7 Knight ${rkVal('K')}gp \u00b7 Treasury ${rkFree()}gp \u00b7 Staked ${RK.paid}gp${RK.moved ? '' : ' (taken on the first move)'}</div></div>
    <div class="rkgrid">
      <div class="rkside"><div class="rkwho"><img src="${portraitURL(RK.opp, false)}"><div><b>${esc(RK.opp.name)}</b><br><span>${RACES[RK.opp.race].name} ${SPECS[RK.opp.spec].name}</span></div></div>
        <div class="rkpurse"><img src="${RK_ART.purse}"><div><b>${esc(RK.opp.name)} has taken</b><br>${purse(RK.capA)}</div></div>
        <div class="ink small" style="color:#e8d8b0">${RK.msg}</div></div>
      <div class="rkboard">${cells}</div>
      <div class="rkside">${side}<div class="rkpurse"><img src="${RK_ART.purse}"><div><b>You have taken</b><br>${purse(RK.capP)}</div></div>
        ${RK.phase !== 'over' && !RK.moved ? `<button class="btn small" onclick="rkClose()">LEAVE THE TABLE</button>` : ''}${RK.phase !== 'over' && RK.moved ? `<button class="btn small" onclick="askConfirm('Concede?', 'Every coin of yours on the board goes to ' + esc(RK.opp.name) + '.', () => rkEnd('A', 'You concede.'))">CONCEDE</button>` : ''}</div>
    </div></div>`;
}
function rkClick(r, c){
  if (!RK) return;
  if (RK.phase === 'draft'){ if (RK.turn !== 'P' || r !== 7 || !dark(r, c) || RK.b[r][c]) return;
    if (rkFree() < rkVal(RK.draftType)) return SFX.play('nope');
    RK.b[r][c] = {side:'P', types:[RK.draftType]}; rkPay(rkVal(RK.draftType)); RK.draftLeft.P--; SFX.play('coin'); rkDraftNext(); return; }
  if (RK.phase !== 'play' || RK.turn !== 'P' || RK.promo) return;
  const legal = RK.chain ? RK.chain.next : rkMoves(RK.b, 'P');
  const p = RK.b[r][c];
  if (!RK.chain && p && p.side === 'P'){ RK.sel = legal.some(m => m.from[0] === r && m.from[1] === c) ? [r, c] : null; SFX.play('pick'); return rkRender(); }
  if (!RK.sel) return;
  const step = RK.chain ? RK.chain.steps : 0;
  const ms = legal.filter(m => m.from[0] === RK.sel[0] && m.from[1] === RK.sel[1] && m.path[step] && m.path[step][0] === r && m.path[step][1] === c);
  if (!ms.length) return;
  // take one step of the move: a plain move, or one jump (more jumps may follow)
  const m0 = ms[0];
  if (!m0.caps.length){ rkDoMove(m0); return; }
  rkStake(); const single = {from:RK.chain ? RK.chain.at : m0.from, path:[m0.path[step]], caps:[m0.caps[step]]};
  const res = rkApply(RK.b, single, null); RK.b = res.b; for (const x of res.caps) RK.capP.push(x); SFX.play('coin');
  RK.last = [single.from, m0.path[step]];
  const more = legal.filter(m => m.path.length > step + 1 && m.from[0] === RK.sel[0] && m.from[1] === RK.sel[1] && m.path[step][0] === r && m.path[step][1] === c);
  if (more.length){ RK.chain = {steps:step + 1, at:[r, c], next:more}; RK.sel = RK.sel; rkRender(); }
  else rkFinishTurn([r, c]);
}
function rkEndChain(){ if (RK && RK.chain) rkFinishTurn(RK.chain.at); }
function rkDoMove(m){ rkStake(); const res = rkApply(RK.b, m, null); RK.b = res.b; RK.last = [m.from, m.path[m.path.length - 1]]; SFX.play('pick'); rkFinishTurn(m.path[m.path.length - 1]); }
function rkFinishTurn(at){
  RK.chain = null; RK.sel = null;
  const p = RK.b[at[0]][at[1]];
  if (p && p.side === 'P' && at[0] === 0 && p.types.length === 1){ RK.promo = {at, base:p.types[0]}; rkRender(); return; }
  rkNextTurn();
}
function rkPromote(t){
  const P = RK.promo; if (!P || t === P.base) return;
  if (META.treasury < rkVal(t)) return SFX.play('nope');
  RK.b[P.at[0]][P.at[1]].types.push(t); rkPay(rkVal(t)); RK.promo = null; SFX.play('level'); rkNextTurn();
}
function rkDraftNext(){
  if (RK.draftLeft.P === 0 && RK.draftLeft.A === 0){ RK.phase = 'play'; RK.turn = RK.first; RK.msg = 'The coins are set. ' + (RK.turn === 'P' ? '<b>Your move.</b>' : `<b>${esc(RK.opp.name)} moves first.</b>`); rkRender(); if (RK.turn === 'A') setTimeout(rkAI, 700); return; }
  RK.turn = RK.turn === 'P' ? (RK.draftLeft.A ? 'A' : 'P') : (RK.draftLeft.P ? 'P' : 'A');
  rkRender(); if (RK.turn === 'A') setTimeout(rkAI, 500);
}
function rkNextTurn(){
  RK.ply++;
  const next = RK.turn === 'P' ? 'A' : 'P';
  if (!rkPieces(next)) return rkEnd(RK.turn, `${next === 'P' ? 'You have' : esc(RK.opp.name) + ' has'} no coins left.`);
  if (!rkMoves(RK.b, next).length) return rkEnd(RK.turn, `${next === 'P' ? 'You have' : esc(RK.opp.name) + ' has'} no legal move.`);
  if (RK.ply >= 160) return rkEnd(null, 'The candle burns down: a draw. Everyone keeps what they hold.');
  RK.turn = next; rkRender(); if (next === 'A') setTimeout(rkAI, 450);
}
function rkAI(){
  if (!RK || RK.turn !== 'A') return;
  if (RK.phase === 'draft'){
    const mine = RK.b[7].filter(Boolean).map(p => p.types[0]), cnt = {S:0, B:0, K:0}; for (const t of mine) cnt[t]++;
    let t = RK_ORDER.slice().sort((x, y) => cnt[RK_TYPES[y].beats] - cnt[RK_TYPES[x].beats])[0];
    if (Math.random() < 0.35) t = pickOf(RK_ORDER);
    const spots = [0, 1, 2, 3, 4, 5, 6, 7].filter(c => dark(0, c) && !RK.b[0][c]);
    RK.b[0][pickOf(spots)] = {side:'A', types:[t]}; RK.draftLeft.A--; SFX.play('coin');
    RK.msg = `${esc(RK.opp.name)} places a ${RK_TYPES[t].name}.`; rkDraftNext(); return;
  }
  const best = rkSearch(RK.b, 'A', rkDepth(RK.opp), -1e9, 1e9).move;
  if (!best) return rkNextTurn();
  const end = best.path[best.path.length - 1], promo = end[0] === 7 && RK.b[best.from[0]][best.from[1]].types.length === 1 ? rkBestPromo(RK.b, 'A') : null;
  rkStake(); const res = rkApply(RK.b, best, promo); RK.b = res.b; for (const x of res.caps) RK.capA.push(x);
  RK.last = [best.from].concat(best.path);
  RK.msg = res.caps.length ? `<b>${esc(RK.opp.name)} takes ${res.caps.length > 1 ? res.caps.length + ' coins' : 'your ' + RK_TYPES[res.caps[0].types[0]].name}!</b>${promo ? ' And makes a Veteran.' : ''}` : promo ? `${esc(RK.opp.name)} makes a Veteran.` : `${esc(RK.opp.name)} moves.`;
  SFX.play(res.caps.length ? 'hurt' : 'pick');
  rkNextTurn();
}
function rkEnd(winner, why){
  // you keep your surviving coins and every coin you captured
  const back = (winner === 'A' && why === 'You concede.' ? 0 : rkSurvivors('P')) + RK.capP.reduce((a, p) => a + rkValueOf(p), 0);
  META.treasury += back; const delta = back - RK.paid;
  const st2 = st(); st2.rankn = (st2.rankn || 0) + 1; if (winner === 'P') st2.ranknWins = (st2.ranknWins || 0) + 1; saveMeta();
  RK.phase = 'over'; RK.promo = null; RK.chain = null;
  RK.result = {delta, head:winner === 'P' ? 'You win!' : winner === 'A' ? esc(RK.opp.name) + ' wins' : 'A draw', text:why + ' You keep your surviving coins and every coin you took.'};
  SFX.play(winner === 'P' ? 'win' : winner === 'A' ? 'down' : 'pick'); rkRender();
}
window.addEventListener('keydown', e => {
  if (!RK || $('screen-rankn').classList.contains('hidden') || !/^[1-3]$/.test(e.key)) return;
  const t = RK_ORDER[+e.key - 1];
  if (RK.promo){ e.stopImmediatePropagation(); rkPromote(t); }
  else if (RK.phase === 'draft'){ e.stopImmediatePropagation(); RK.draftType = t; rkRender(); }
}, true);
// In the tavern
function ranknHTML(){
  const opps = META.roster.filter(p => !p.resting).concat((META.officers || []).filter(o => !(o.resting > 0)));
  return `<div class="desc" style="text-align:left;margin-top:10px;border-top:1px solid #c9bba4;padding-top:6px"><b>Rank\u2019n.</b> A Squad Mate will play you for real gold. Copper Spears beat Gold Knights, Silver Bows beat Spears, Knights beat Bows. You keep every coin you capture.</div>
    <img src="${RK_ART.splash}" style="width:100%;border:2px solid var(--ink-soft);margin:4px 0">
    <div class="mini" style="justify-content:flex-start">${Object.entries(RK_STAKES).map(([k, S]) => `<button style="${(RK_PICK.stake || 'table') === k ? 'background:#8a6414' : ''}" onclick="RK_PICK.stake='${k}';renderPanel()" data-tip="Spear ${RK_BASE.S * S.mult}gp, Bow ${RK_BASE.B * S.mult}gp, Knight ${RK_BASE.K * S.mult}gp">${S.name}</button>`).join('')}</div>` +
    (opps.length ? opps.map(p => `<div class="line"><img src="${portraitURL(p, false)}"><div class="grow"><b>${esc(p.name)}</b><br><span style="font-size:14px">${['ORC', 'GOBLIN', 'HALF_ORC'].includes(p.race) ? 'Plays fast and loose' : p.spec === 'SCOUNDREL' || p.spec === 'MAGE' ? 'A sharp player' : 'A steady player'}</span></div><button onclick="rkNew(${p.id},'${RK_PICK.stake || 'table'}')">Sit down</button></div>`).join('') : '<div class="desc">Nobody in camp to play.</div>');
}
const RK_PICK = {};
{ const f = renderPanel; renderPanel = function(){ f(); const P = CAMP.panel; if (P && P.kind === 'building' && P.id === 'tavern' && has('tavern') && !(typeof inStory === 'function' && inStory())) $('camp-panel').insertAdjacentHTML('beforeend', ranknHTML()); }; }
(function(){
  const st3 = document.createElement('style'); st3.textContent = `
  #screen-rankn{ padding:0; background:var(--wood-night); justify-content:stretch; align-items:stretch }
  .rkwrap{ min-height:100%; width:100%; background-size:cover; background-position:center; padding:56px 20px 30px; box-sizing:border-box }
  .rkhead{ text-align:center } .rkhead h1{ font-size:64px; color:#f0d890; text-decoration:none; margin:0; text-shadow:0 4px 0 #2a1406, 0 0 24px rgba(0,0,0,.8) }
  .rkhead .hsub{ color:#e8d8b0; text-shadow:0 1px 2px #000 }
  .rkgrid{ display:grid; grid-template-columns:minmax(220px,1fr) auto minmax(220px,1fr); gap:20px; max-width:1200px; margin:14px auto 0; align-items:start }
  @media (max-width:980px){ .rkgrid{ grid-template-columns:1fr } }
  .rkboard{ display:grid; grid-template-columns:repeat(8,62px); grid-template-rows:repeat(8,62px); border:10px solid var(--wood); box-shadow:0 0 0 3px #2a1406, 0 14px 30px rgba(0,0,0,.7); background:#7a5a32 }
  .rkc{ position:relative } .rkc.lt{ background:#c8a878 } .rkc.dk{ background:#6a4a2a; box-shadow:inset 0 0 0 1px rgba(0,0,0,.25) }
  .rkc.can{ cursor:pointer } .rkc.can:hover{ background:#7e5a32 } .rkc.sel{ background:#9a7a3a; box-shadow:inset 0 0 0 3px #f0d890 }
  .rkc.tg{ cursor:pointer } .rkc.last{ box-shadow:inset 0 0 0 2px rgba(255,200,120,.55) }
  .rkc .dot{ position:absolute; left:50%; top:50%; width:16px; height:16px; margin:-8px; border-radius:50%; background:rgba(255,230,140,.75); box-shadow:0 0 10px var(--gold-bright) }
  .rkside{ display:flex; flex-direction:column; gap:10px }
  .rkwho{ display:flex; gap:10px; align-items:center; background:rgba(20,10,4,.75); border:2px solid #8a6a3a; padding:8px; color:var(--parchment) } .rkwho img{ height:62px } .rkwho span{ font-size:14px; color:#c8b890 }
  .rkpurse{ display:flex; gap:8px; align-items:flex-start; background:rgba(245,235,215,.92); border:2px solid var(--ink-soft); padding:8px; font-size:14px } .rkpurse > img{ width:42px }
  .rkp{ display:inline-block; position:relative; width:30px; height:30px }
  .rkbox{ background:var(--parch,#efe3c8); background-size:256px; border:3px solid #3a2a1a; box-shadow:0 0 0 2px #8a6a3a inset; padding:10px 12px } .rkbox h3{ margin:0 0 6px; font-variant:small-caps; font-size:22px }
  .rkts{ display:flex; flex-direction:column; gap:6px; margin:8px 0 }
  .rkt{ display:grid; grid-template-columns:36px 18px 1fr auto; grid-template-rows:auto auto; align-items:center; gap:0 6px; text-align:left; padding:4px 8px; background:rgba(255,248,230,.85); border:2px solid #8a6a3a; border-radius:3px; cursor:pointer; font:13px Georgia; color:#2a1a0a }
  .rkt img{ width:34px; grid-row:span 2 } .rkt b{ grid-row:span 2; background:var(--ink); color:var(--parchment); text-align:center; border-radius:2px; font:bold 14px monospace }
  .rkt span{ font-weight:bold; color:var(--blood) } .rkt small{ grid-column:3 / 5; font-size:14px; color:#6a5a44 }
  .rkt.on, .rkt:hover{ border-color:var(--gold); box-shadow:0 0 0 2px var(--gold) } .rkt:disabled{ opacity:.4 }
  .rkrule{ display:flex; align-items:center; gap:4px; font-size:14px; margin-top:6px } .rkrule img{ width:28px }`;
  document.head.appendChild(st3);
})();

/* ============================================================================
   DICE ON THE TABLE - every roll that decides something big is thrown across
   the screen: the War Council, Parley, withdrawing from a fight, prisoners,
   the day's Work Orders. And withdrawing is now a roll of its own.
============================================================================ */
// Record every attackDie rolled inside fn, then throw them on screen.
let DICE_REC = null;
{ const f = attackDie; attackDie = function(skill, ac, l){ const r = f(skill, ac, l);
    if (DICE_REC) DICE_REC.push({skill:clampSkill(skill), face:r.face, out:r.out, ac, natMin:r.natMin, natMax:r.natMax}); return r; }; }
function withDice(title, fn, labels){
  const outer = DICE_REC; DICE_REC = [];
  let r; try { r = fn(); } finally { const rec = DICE_REC; DICE_REC = outer;
    if (rec.length && !outer) showDice(title, rec.map((d, i) => Object.assign(d, {label:(labels && labels[i]) || d.label || ''}))); }
  return r;
}
const OUT_TXT = {crit:'NATURAL MAXIMUM', solid:'FULL SUCCESS', graze:'PARTIAL', miss:'MISS'};
const OUT_COL = {crit:'#ffd860', solid:'#8fd39a', graze:'#f0c96a', miss:'#ff8a7a'};
let DICE_Q = [], DICE_ON = false;
// dice: [{face, skill, out?, ac?, label, side?:'you'|'them', win?}]
function showDice(title, dice, opts = {}){ DICE_Q.push({title, dice, opts}); if (!DICE_ON) diceNext(); }
function diceNext(){
  const job = DICE_Q.shift(); if (!job){ DICE_ON = false; return; }
  DICE_ON = true;
  let el = $('dice-tray'); if (!el){ el = document.createElement('div'); el.id = 'dice-tray'; document.body.appendChild(el); }
  const {title, dice, opts} = job, n = dice.length;
  el.innerHTML = `<div class="dt-title">${title}</div><div class="dt-row">${dice.map((d, i) => `<div class="dt-slot" style="--i:${i}">
      <div class="dt-die" id="dd${i}" style="animation-delay:${i * 0.12}s;${dieStyle(d.skill)}"><span>${d.skill}</span></div>
      <div class="dt-lab">${esc(d.label || '')}</div><div class="dt-res" id="dr${i}"></div></div>`).join('')}</div>
    <div class="dt-foot" id="dt-foot">${opts.sub || ''}</div>`;
  el.className = 'show'; el.onclick = () => diceDone(job, true);
  // the faces tumble, then settle on the real roll
  const spin = setInterval(() => dice.forEach((d, i) => { const s = $('dd' + i); if (s && !s.dataset.done) s.firstChild.textContent = d.skill + (Math.random() * 6 | 0); }), 70);
  dice.forEach((d, i) => setTimeout(() => { const s = $('dd' + i); if (!s) return; s.dataset.done = 1; s.firstChild.textContent = d.face; SFX.play('bash');
    const out = d.out, col = d.col ? d.col : d.win !== undefined ? (d.win ? '#8fd39a' : '#ff8a7a') : OUT_COL[out];
    s.style.borderColor = col; s.style.boxShadow = `0 0 0 3px ${col}, 0 8px 18px rgba(0,0,0,.6)`;
    const r = $('dr' + i); if (r){ r.style.color = col; r.textContent = d.text ? d.text : d.win !== undefined ? (d.win ? 'WINS' : 'LOSES') : OUT_TXT[out] + (d.ac !== undefined && d.ac < 50 ? ` (vs ${d.ac})` : ''); } }, 650 + i * 160));
  const total = 650 + n * 160 + 900;
  job.spin = spin;
  setTimeout(() => { const f = $('dt-foot'); if (f && opts.result) f.innerHTML = opts.result; if (opts.sfx) SFX.play(opts.sfx); }, 650 + n * 160 + 100);
  job.timer = setTimeout(() => diceDone(job), total + (opts.hold || 1100));
}
function diceDone(job, clicked){
  if (job.closed) return; job.closed = true; clearInterval(job.spin); clearTimeout(job.timer);
  const el = $('dice-tray'); if (el) el.className = '';
  if (job.opts.then) job.opts.then();
  setTimeout(diceNext, 120);
}

/* ---------------------------------------------------------------------------
   WITHDRAWING: the Leader tries to get the squad off the field.
   Personality against the enemy's grip: 4 with nobody close, 5 in contact,
   6 with an enemy commander awake nearby. Miss: keep fighting (and wait 20
   seconds to try again). Partial: get out, but drop the coin carried.
   Full: get out with everything.
--------------------------------------------------------------------------- */
function withdrawDiff(){
  const L = G.leader, close = G.enemies.filter(e => !e.dead && !e.dormant && dist(e, L) < 220).length;
  const boss = G.enemies.some(e => !e.dead && !e.dormant && BESTIARY[e.k].boss && dist(e, L) < 420);
  return boss ? [6, 'an enemy commander is close'] : close >= 3 ? [5, 'the enemy is on you'] : [4, 'nobody is close'];
}
function withdrawNote(){
  if (!G || G.obj === 'drill') return '';
  const [d, why] = withdrawDiff(), per = G.leader.down ? 1 : G.leader.s.per, cd = Math.max(0, Math.ceil(((G.wdT || 0) - G.frame) / 60));
  return `<div class="sub" style="color:#c8b890;font-size:13px">Withdrawing is a roll: your Leader\u2019s Personality (Skill ${per}) against ${d}, because ${why}. Full Success: out, with the ${G.coin} coin carried. Partial: out, but the coin is dropped. Miss: you are pinned and fight on.${cd ? ` <b style="color:var(--bad-dark)">Pinned: try again in ${cd}s.</b>` : ''}</div>`;
}
function askWithdraw(){
  if (!G || G.over) return;
  if (G.obj === 'drill'){ $('overlay-pause').classList.add('hidden'); return endDeployment('withdrawn'); }
  if ((G.wdT || 0) > G.frame){ SFX.play('nope'); return; }
  const [d] = withdrawDiff(), per = G.leader.down ? 1 : G.leader.s.per;
  const r = attackDie(per, d), res = (r.out === 'solid' || r.out === 'crit') ? 'full' : r.out === 'graze' ? 'partial' : 'miss';
  $('overlay-pause').classList.add('hidden');
  showDice('Sound the Retreat', [{face:r.face, skill:clampSkill(per), out:r.out, ac:d, label:META.leader.name + "'s Personality"}], {
    sub:`Against ${d}`,
    result: res === 'full' ? `The squad slips away in good order, coin and all.` : res === 'partial' ? `You get out, but the coin is dropped in the scramble.` : `The enemy has you pinned. Fight on!`,
    sfx: res === 'miss' ? 'nope' : 'horn',
    then(){
      if (!G || G.over) return;
      if (res === 'miss'){ G.wdT = G.frame + 20 * 60; G.paused = false; note('The retreat fails: the squad is pinned. Try again in 20 seconds.'); pop(G.leader.x, G.leader.y - 50, 'PINNED', '#ff8a7a'); return; }
      if (res === 'partial'){ if (G.coin) note(`${G.coin} coin dropped in the retreat.`); G.coin = 0; }
      endDeployment('withdrawn');
    }});
}

/* ---------------------------------------------------------------------------
   PARLAY: both dice on the table
--------------------------------------------------------------------------- */
{ const f = parlayChoice; parlayChoice = function(ch){
    if (!PARLAY || ch !== 'surrender' || PARLAY.rolled) return f(ch);
    const e = PARLAY.e; f(ch);
    const R = PARLAY && PARLAY.rolled; if (!R) return;
    showDice('Demand Surrender', [
      {face:R.mine, skill:R.per || clampSkill(G.leader.s.per + parlayStep()), label:'Your Leader', win:R.win},
      {face:R.theirs, skill:commanderMorale(BESTIARY[e.k].tier), label:ename(e), win:!R.win}],
      {sub:'Higher face wins; ties go to you.', result:R.win ? `${esc(ename(e))} lays down arms.` : `${esc(ename(e))} refuses.`, sfx:R.win ? 'win' : 'nope'});
  }; }

/* ---------------------------------------------------------------------------
   THE WAR COUNCIL, PRISONERS AND THE DAY'S WORK
--------------------------------------------------------------------------- */
{ const f = rollCouncil; rollCouncil = function(){
    f();
    const c = META.board[MU.contract]; if (!c || !c.council) return;
    showDice('The War Council', c.council.map(d => ({face:d.face, skill:d.skill, out:d.res === 'success' ? 'solid' : d.res === 'partial' ? 'graze' : 'miss', ac:councilDiff(c), label:d.label})),
      {sub:`Against Patron Resistance ${councilDiff(c)}`, result:`${c.picks} Contract Edge${c.picks === 1 ? '' : 's'} won.`, sfx:c.picks ? 'win' : 'nope'});
  }; }
{ const f = prisonerAct; prisonerAct = function(i, act){
    const pr = META.prisoners[i]; if (!pr || (act !== 'ransom' && act !== 'interrogate')) return f(i, act);
    withDice(act === 'ransom' ? `Haggling over ${esc(pr.name)}` : `Questioning ${esc(pr.name)}`, () => f(i, act), [META.leader.name + "'s Personality"]);
  }; }
if (typeof workOrder === 'function'){
  const NAMES_WO = {rally:'Rally the Town', scrounge:'Scrounge', scout:'Scout', forage:'Forage', recruit:'Recruit among the refugees', parley:'Recruit a band'};  /* K77: matches the road card (PD-33) */
  const f = workOrder; workOrder = function(id){ if (!NAMES_WO[id]) return f(id); return withDice(NAMES_WO[id], () => f(id), ['Your Leader']); };
}
/* INT-1 stage 3 group 4: the rkNew coin dice are folded into rkNew */

(function(){
  const st = document.createElement('style'); st.textContent = `
  #dice-tray{ position:fixed; inset:0; z-index:80; display:none; flex-direction:column; align-items:center; justify-content:center; background:radial-gradient(ellipse at center, rgba(20,10,4,.55), rgba(10,5,2,.82)); cursor:pointer }
  #dice-tray.show{ display:flex }
  .dt-title{ font:900 40px Georgia; font-variant:small-caps; color:#f0d890; text-shadow:0 3px 0 var(--wood-night), 0 0 18px rgba(0,0,0,.9); margin-bottom:20px }
  .dt-row{ display:flex; gap:30px; flex-wrap:wrap; justify-content:center; max-width:94vw }
  .dt-slot{ display:flex; flex-direction:column; align-items:center; width:130px }
  .dt-die{ width:84px; height:84px; display:flex; align-items:center; justify-content:center; background:linear-gradient(145deg,#fbf3dc,#d8c8a0); border:4px solid var(--ink); border-radius:14px;
    box-shadow:0 8px 18px rgba(0,0,0,.6); font:900 40px Georgia; color:#2a1a0a; animation:dt-throw .75s cubic-bezier(.2,.8,.3,1) both }
  .dt-lab{ margin-top:12px; font:bold 14px Georgia; color:#e8d8b0; text-align:center; text-shadow:0 1px 2px #000 }
  .dt-res{ margin-top:4px; font:900 14px Georgia; letter-spacing:1px; text-align:center; text-shadow:0 1px 2px #000; min-height:18px }
  .dt-foot{ margin-top:22px; font:16px Georgia; color:var(--parchment); text-shadow:0 1px 2px #000; min-height:22px; text-align:center; max-width:640px }
  @keyframes dt-throw{ 0%{ transform:translate(-62vw, -18vh) rotate(-540deg) scale(.6); opacity:0 } 55%{ transform:translate(4vw, 3vh) rotate(25deg) scale(1.08); opacity:1 }
    75%{ transform:translate(-1vw, -1vh) rotate(-8deg) } 100%{ transform:none } }`;
  document.head.appendChild(st);
})();


window.RANKN_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      ok('rkCanCap: Spear beats Knight, Bow beats Spear, Knight beats Bow',
        rkCanCap({types: ['S']}, {types: ['K']}) === true &&
        rkCanCap({types: ['B']}, {types: ['S']}) === true &&
        rkCanCap({types: ['K']}, {types: ['B']}) === true &&
        rkCanCap({types: ['S']}, {types: ['B']}) === false);
      ok('rkDepth returns higher search depth for Scoundrel/Mage', rkDepth({spec: 'MAGE', race: 'HUMAN'}) === 4);
      ok('dark checkerboard parity alternates', dark(0, 1) === true && dark(0, 0) === false);
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
