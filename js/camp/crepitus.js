/* ============================================================================
   CREPITUS - the tavern dice game (T-01, Systems Designer).
   Rules: audits/crepitus-rules.md.  Defaults chosen where the rules are silent:
   see "T-01" in audits/balance-r2.md.

   window.CREPITUS.open(seats, opts)
     seats: three squad mates / NPCs  {name, race?, spec?, id?}  (portraitURL is used when it can)
     opts:  {stake:'low'|'table'|'high', onClose:fn}
   window.CREPITUS.engine  - the pure rules (no DOM), used by the tests.

   Money: the Treasury is gold pieces. One bid "coin" is one table unit (1gp at the Penny table,
   5gp at the Soldier's table, 20gp at the High table: the Rank'n stakes). Copper = 1 unit, Silver = 2,
   Gold = 4 (the Rank'n coin values), so a bid is any whole number of units. Buy-in = 2 units.
   Squad mates and NPCs play from a table purse of 30 units; their winnings and losses never touch the
   Treasury. Only the Leader's seat pays or wins real gold.
============================================================================ */
(function(){
'use strict';

/* ---------------------------------------------------------------- ENGINE --- */
const E = {};
const rnd = () => Math.random();
E.rollDie = lvl => lvl + (rnd() * 6 | 0);                 // a die of level N rolls N..N+5
const B12 = [1, 12, 144, 1728, 20736, 248832];
const CAT = ['High Die', 'One Pair', 'Two Pair', 'Three of a Kind', '5-Dice Straight', 'Full House', 'Four of a Kind', 'Five of a Kind', 'Seven of a Kind'];
E.CAT = CAT;

// score one set of exactly 5 faces; bigger is better
function score5(f){
  const c = {}; for (const v of f) c[v] = (c[v] || 0) + 1;
  const g = Object.keys(c).map(k => [c[k], +k]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const shape = g.map(x => x[0]).join('');
  const faces = []; for (const [n, v] of g) for (let i = 0; i < n; i++) faces.push(v);   // grouped, biggest group first
  let cat;
  const sorted = f.slice().sort((a, b) => b - a), straight = g.length === 5 && sorted[0] - sorted[4] === 4;
  if (shape === '5') cat = 7; else if (shape === '41') cat = 6; else if (shape === '32') cat = 5;
  else if (straight) cat = 4; else if (shape === '311') cat = 3; else if (shape === '221') cat = 2; else if (shape === '2111') cat = 1; else cat = 0;
  let key = 0; for (let i = 0; i < 5; i++) key += faces[i] * B12[4 - i];
  return cat * 248832 * 12 + key;
}
// the best hand from 7 faces (5 hidden + 2 community): any 5, or all 7 if they match
E.best = function(faces){
  const n = faces.length;
  if (n === 7 && faces.every(v => v === faces[0])) return 8 * 248832 * 12 + faces[0];
  let best = -1;
  if (n <= 5) return score5(faces.concat(Array(5 - n).fill(-5)));
  const idx = []; (function rec(s, k){ if (k === 5){ const s5 = score5(idx.map(i => faces[i])); if (s5 > best) best = s5; return; }
    for (let i = s; i <= n - (5 - k); i++){ idx[k] = i; rec(i + 1, k + 1); } })(0, 0);
  return best;
};
E.catOf = sc => Math.floor(sc / (248832 * 12));
E.name = sc => CAT[E.catOf(sc)];

/* ---- the table ----------------------------------------------------------- */
// seat: {name, human, purse (units), out (sat out this hand), hid:[{lvl,v}], kept:[faces], paid}
E.newTable = function(seats, unit, o){
  o = o || {};
  return {unit, seats, dealer: seats.length - 1, pot: 0, phase: 'idle', pool: [], cup: [], removed: [], hunt: 0, round: 0,
    bounty: null, turn: -1, passes: 0, lastBidder: -1, lockout: !!o.lockout, buyin: o.buyin || 2, rerollMax: o.rerollMax == null ? 1 : o.rerollMax,
    hand: 0, log: [], skipRoll: false};
};
const alive = T => T.seats.filter(s => !s.out);
E.fund = (s, n) => s.purse >= n;
E.pay = function(T, s, n){ s.purse -= n; s.paid = (s.paid || 0) + n; T.pot += n; if (s.onPay) s.onPay(n); };
E.deal = function(T){
  T.hand++; T.pot = 0; T.pool = []; T.cup = []; T.removed = []; T.bounty = null; T.hunt = 0; T.log = [];
  T.dealer = (T.dealer + 1) % T.seats.length;
  for (const s of T.seats){ s.paid = 0; s.out = false; s.discarded = false; s.lock = false; s.rerolls = 0; s.hid = null; s.kept = null; s.bid = 0; s.said = null; s.state = ''; }
  for (let i = 0; i < T.seats.length; i++){ const s = T.seats[i];
    if (i === T.dealer) continue;                                              // the dealer pays no buy-in
    if (!E.fund(s, T.buyin)){ s.out = true; s.state = 'sits out'; continue; }
    E.pay(T, s, T.buyin); }
  for (const s of alive(T)) E.roll(s);
  T.phase = 'discard';
  return T;
};
E.roll = function(s){ s.hid = [0, 1, 2, 3, 4, 5, 6].map(l => ({lvl: l, v: E.rollDie(l)})); };
// pay the buy-in again to reroll the whole hand (before discarding)
E.reroll = function(T, s){
  if (T.phase !== 'discard' || s.discarded || (s.rerolls || 0) >= T.rerollMax || !E.fund(s, T.buyin)) return false;
  E.pay(T, s, T.buyin); s.rerolls = (s.rerolls || 0) + 1; E.roll(s); return true;
};
E.discard = function(T, s, i, j){
  if (s.discarded || i === j) return false;
  const a = s.hid[i], b = s.hid[j]; if (!a || !b) return false;
  s.hid = s.hid.filter((d, k) => k !== i && k !== j); s.kept = s.hid.map(d => d.v);
  T.cup.push({lvl: a.lvl}, {lvl: b.lvl}); s.discarded = true; return true;
};
E.allDiscarded = T => alive(T).every(s => s.discarded);
let DIEID = 1;
E.startHunts = function(T){
  T.pool = T.cup.map(d => ({id: DIEID++, lvl: d.lvl, v: E.rollDie(d.lvl)})); T.cup = [];
  T.hunt = 1; T.phase = 'hunt'; E.startRound(T, T.dealer, true);
};
function nextAlive(T, i){ const n = T.seats.length; for (let k = 0; k < n; k++){ const j = (i + k) % n; if (!T.seats[j].out && !T.seats[j].lock) return j; } return -1; }
// first round of a hunt starts with the dealer; later rounds with the player after the last bidder
E.startRound = function(T, from, first){
  T.round = first ? 0 : T.round + 1; T.bounty = null; T.passes = 0; T.lastBidder = -1;
  for (const s of T.seats) s.lock = false;
  T.turn = nextAlive(T, from);
};
E.canBid = (T, s, die, total) => {
  const b = T.bounty;
  if (!T.pool.some(d => d.id === die)) return false;
  if (!b) return total >= 1 && total <= s.purse;
  if (b.die === die) return total >= 1 && total <= s.purse;                    // reinforce: total = coins added
  return total >= b.total + 1 && total <= s.purse;                             // outbid on another die: full new total
};
E.act = function(T, si, a){
  const s = T.seats[si]; if (T.turn !== si) return {ok: false};
  if (a.type === 'pass'){
    T.passes++; s.state = 'passed'; if (T.lockout) s.lock = true;
  } else {
    if (!E.canBid(T, s, a.die, a.total)) return {ok: false};
    const b = T.bounty;
    if (!b){ T.bounty = {die: a.die, total: a.total, owner: si}; s.said = 'bid'; E.pay(T, s, a.total); }
    else if (b.die === a.die){ b.total += a.total; E.pay(T, s, a.total); b.owner = si; }
    else { T.bounty = {die: a.die, total: a.total, owner: si}; E.pay(T, s, a.total); }   // the old coins stay in the pot
    T.passes = 0; T.lastBidder = si; for (const x of T.seats) if (x !== s) x.state = x.state === 'passed' ? '' : x.state;
    s.state = 'bid ' + T.bounty.total;
  }
  return E.advance(T, si);
};
function removeDie(T, id){ const k = T.pool.findIndex(d => d.id === id); if (k >= 0){ T.removed.push(T.pool[k]); T.pool.splice(k, 1); } }
E.advance = function(T, si){
  const live = alive(T).length, ev = {};
  const need = T.bounty ? live - 1 : live;                                     // everyone else passes after a bid
  if (T.passes >= need || nextAlive(T, 0) === -1){
    if (T.bounty){
      ev.removed = T.bounty.die; ev.bounty = T.bounty.total; ev.by = T.bounty.owner;
      removeDie(T, T.bounty.die); const from = T.lastBidder + 1; E.afterRemoval(T, from, ev);
    } else {
      // everyone passed with no bounty
      if (T.hunt === 1 && T.round === 0){                                       // First Hunt Pass Rule: reroll the pool, go to the Second Hunt
        for (const d of T.pool) d.v = E.rollDie(d.lvl);
        ev.passRule = 'reroll'; T.skipRoll = true; E.toHunt2(T, ev);
      } else if (T.hunt === 2){                                                 // Second Phase Pass Rule: keep the 2 lowest
        T.pool.sort((a, b) => a.v - b.v || a.lvl - b.lvl); T.removed.push(...T.pool.splice(2)); ev.passRule = 'low2'; E.finishHunts(T, ev);
      } else {                                                                  // default: a dead round in Hunt 1 drops the highest die
        T.pool.sort((a, b) => b.v - a.v || b.lvl - a.lvl); const d = T.pool.shift(); T.removed.push(d); ev.passRule = 'high'; ev.removed = d.id;
        E.afterRemoval(T, T.dealer + 1, ev, true);
      }
    }
  } else T.turn = nextAlive(T, si + 1);
  return {ok: true, ev};
};
E.afterRemoval = function(T, from, ev, noCheck){
  if (T.pool.length <= 2){ if (T.hunt === 1) E.toHunt2(T, ev); else E.finishHunts(T, ev); return; }
  E.startRound(T, from, false);
};
E.toHunt2 = function(T, ev){
  // the dice removed in Hunt 1 are rerolled and merged with the 2 survivors
  if (!T.skipRoll) { for (const d of T.removed) d.v = E.rollDie(d.lvl); }
  T.pool = T.pool.concat(T.removed); T.removed = []; T.skipRoll = false; T.hunt = 2;
  if (T.pool.length <= 2) return E.finishHunts(T, ev);
  ev.hunt2 = true; E.startRound(T, T.dealer, true);
};
E.finishHunts = function(T, ev){ T.phase = 'show'; T.turn = -1; ev.show = true; };
// showdown: returns {results:[{seat,score,name}], winners:[seat], share, odd}
E.showdown = function(T){
  const com = T.pool.map(d => d.v), res = [];
  T.seats.forEach((s, i) => { if (s.out) return; const sc = E.best(s.kept.concat(com)); res.push({seat: i, score: sc, name: E.name(sc)}); });
  const top = Math.max(...res.map(r => r.score)), win = res.filter(r => r.score === top).map(r => r.seat);
  const share = Math.floor(T.pot / win.length), odd = T.pot - share * win.length;      // ties split the pot; odd units go to the winner nearest left of the dealer
  win.sort((a, b) => ((a - T.dealer - 1 + 8) % 4) - ((b - T.dealer - 1 + 8) % 4));
  for (const w of win) T.seats[w].purse += share; T.seats[win[0]].purse += odd;
  T.phase = 'done';
  return {results: res, winners: win, share, odd, pot: T.pot, com};
};

/* ---- the AI ---------------------------------------------------------------- */
const LOOSE = ['ORC', 'GOBLIN', 'HALF_ORC'], SHARP = ['SCOUNDREL', 'MAGE', 'WITCH'];
E.style = function(p){
  if (p && LOOSE.includes(p.race)) return {name: 'loose', K: 4, bluff: .3, noise: .5, rebuy: .3};
  if (p && SHARP.includes(p.spec)) return {name: 'sharp', K: 3, bluff: .2, noise: .12, rebuy: .1};
  return {name: 'steady', K: 2.5, bluff: .08, noise: .3, rebuy: .1};
};
const val = sc => sc / (248832 * 12);                                          // hand strength in "categories" (0..8.x)
function meanPairs(kept, dice){
  let t = 0, n = 0;
  for (let i = 0; i < dice.length; i++) for (let j = i + 1; j < dice.length; j++){ t += val(E.best(kept.concat([dice[i].v, dice[j].v]))); n++; }
  return n ? t / n : val(E.best(kept.concat(dice.map(d => d.v))));
}
function gauss(){ return (rnd() + rnd() + rnd() - 1.5) / 0.5; }
// which 2 of the 7 to throw into the cup: keep the 5 with the best average against random community pairs
E.aiDiscard = function(s, st){
  let best = null;
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++){
    const kept = s.hid.filter((d, k) => k !== i && k !== j).map(d => d.v);
    let t = 0; for (let r = 0; r < 14; r++){ const a = E.rollDie(rnd() * 7 | 0), b = E.rollDie(rnd() * 7 | 0); t += val(E.best(kept.concat([a, b]))); }
    t = t / 14 + gauss() * st.noise * .15;
    if (!best || t > best.t) best = {i, j, t};
  }
  return best;
};
E.aiMove = function(T, si, st){
  const s = T.seats[si], b = T.bounty, P = T.pool, cap = Math.max(0, s.purse);
  if (!cap) return {type: 'pass'};
  const base = meanPairs(s.kept, P);
  const gains = P.map(d => ({die: d.id, g: meanPairs(s.kept, P.filter(x => x.id !== d.id)) - base + gauss() * st.noise * .05}));
  gains.sort((a, b) => b.g - a.g);
  const top = gains[0], pot = T.pot;
  const want = g => Math.max(0, Math.round(g * st.K * 1.2));                    // how many units a gain is worth
  let w = Math.min(cap, want(top.g), Math.max(2, Math.ceil(pot * .6)));
  const bluffing = rnd() < st.bluff * (b ? .4 : 1);
  if (!b){
    if (top.g > .04 && w >= 1) return {type: 'bid', die: top.die, total: Math.max(1, Math.min(cap, w)), thought: 'real'};
    if (bluffing && cap >= 2){                                                // a bluff: a loud bid on a die that does me no harm
      const safe = gains.filter(x => x.g > -.02); if (safe.length) return {type: 'bid', die: pickRnd(safe).die, total: Math.min(cap, 1 + (rnd() * 2 | 0)), thought: 'bluff'}; }
    return {type: 'pass'};
  }
  const gb = (gains.find(x => x.die === b.die) || {g: 0}).g;
  if (b.owner === si) return {type: 'pass'};
  if (b.die === top.die && gb > .04){ const add = Math.min(cap, Math.max(1, w - b.total)); if (w > b.total && add >= 1) return {type: 'bid', die: b.die, total: add, thought: 'real'}; return {type: 'pass'}; }
  if (gb < -.04){                                                             // the bounty hurts me: outbid it on my own die
    const need = b.total + 1;
    if (top.g > 0 && cap >= need && (need <= Math.max(w, Math.ceil(-gb * st.K * 1.2)) + 1)) return {type: 'bid', die: top.die, total: need, thought: 'real'};
    return {type: 'pass'};
  }
  if (bluffing && gb > -.02 && cap >= 1) return {type: 'bid', die: b.die, total: 1, thought: 'bluff'};
  return {type: 'pass'};
};
function pickRnd(a){ return a[rnd() * a.length | 0]; }
E.aiRebuy = (T, s, st) => !s.discarded && (s.rerolls || 0) < T.rerollMax && E.fund(s, T.buyin + 4) && meanPairs(s.hid.map(d => d.v).sort((a, b) => b - a).slice(0, 5), [{v: 3}, {v: 6}]) < 1.0 && rnd() < st.rebuy;

/* ---------------------------------------------------------------- SCREEN --- */
const UNITS = {copper: 1, silver: 2, gold: 4};
const STAKES = {low: 1, table: 5, high: 20};
let T = null, UI = null;
const g = n => (typeof window[n] !== 'undefined' ? window[n] : undefined);
const sfx = (n, fb) => { try { if (typeof SFX !== 'undefined' && SFX.play) SFX.play(n); } catch (e) { try { if (fb) SFX.play(fb); } catch (e2) {} } };
const E_ = s => (typeof esc === 'function' ? esc(s) : String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])));
const lines = k => { try { const L = window.TAVERN_LINES && window.TAVERN_LINES[k]; return Array.isArray(L) && L.length ? L : null; } catch (e) { return null; } };
const FALL = {
  crepChat: ['Dice love me tonight.', 'Your move.', 'Careful, now.', 'I have seen worse hands.', 'Mind the pot.'],
  crepBluff: ['I would not touch that die if I were you.', 'Strong enough for you?', 'Ha. You wish.'],
  crepWin: ['Pay up.', 'Sweet as honey.', 'Luck, or skill? Yes.'],
  crepLose: ['Next hand, then.', 'The dice are cursed.', 'Well played.']
};
function say(seat, kind){
  const L = lines(kind) || FALL[kind]; let t = pickRnd(L);
  t = String(t).replace(/\{name\}/g, UI && UI.me ? UI.me.name : 'friend'); seat.said = t; return t;
}
function playerIsTreasury(){ return typeof META !== 'undefined' && META && typeof META.treasury === 'number'; }
function portrait(p){ try { if (p && p.npc && typeof PATRON_ART !== 'undefined'){ const u = PATRON_ART.portraitURL(p); if (u) return u; } if (typeof portraitURL === 'function' && p && p.race && p.spec && p.cls !== undefined) return portraitURL(p, false); } catch (e) {} return ''; }

function open(seats, opts){
  opts = opts || {};
  if (!seats || !seats.length) seats = [{name: 'Wat'}, {name: 'Maud'}, {name: 'Old Brannoch'}];
  seats = seats.slice(0, 3);
  while (seats.length < 3) seats.push({name: ['Wat', 'Maud', 'Brannoch'][seats.length]});
  const unit = STAKES[opts.stake] || STAKES.low;
  const meName = (typeof META !== 'undefined' && META && META.leader && META.leader.name) || 'You';
  const hasT = playerIsTreasury();
  const startTreasury = hasT ? META.treasury : 100;
  const me = {name: meName, human: true, purse: hasT ? Math.floor(META.treasury / unit) : 40, pidx: 0,
    onPay(n){ if (hasT){ META.treasury -= n * unit; if (typeof saveMeta === 'function') try { saveMeta(); } catch (e) {} } }};
  const ai = seats.map(p => ({name: p.name || 'Stranger', p, human: false, purse: 30, st: E.style(p)}));
  T = E.newTable([me].concat(ai), unit, {});
  T.dealer = 0;                                                               // the first deal passes to the seat on the Leader's left
  UI = {me, opts, sel: null, discards: [], pending: 0, startTreasury, hasT, busy: false, showdown: null, closed: false, bid: 0, msg: 'Take a seat. The dealer is about to throw the dice.', result: null, hands: 0, net: 0};
  const el = ensureScreen();
  if (typeof hideAll === 'function') try { hideAll(); } catch (e) {}
  el.classList.remove('hidden');
  newHand();
}
function ensureScreen(){
  let el = document.getElementById('screen-crepitus');
  if (!el){ el = document.createElement('div'); el.id = 'screen-crepitus'; el.className = 'screen'; document.body.appendChild(el);
    try { if (typeof SCREENS !== 'undefined' && !SCREENS.includes('screen-crepitus')) SCREENS.push('screen-crepitus'); } catch (e) {}
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  return el;
}
function close(){
  if (!UI || UI.closed) return; UI.closed = true;
  const el = document.getElementById('screen-crepitus'); if (el) el.classList.add('hidden');
  const cb = UI.opts && UI.opts.onClose; T = null;
  try { if (cb) return cb(); } catch (e) {}
  try {
    const H = window.TAVERN;
    for (const n of ['back', 'show', 'reopen', 'open', 'enter']) if (H && typeof H[n] === 'function') return H[n]();
  } catch (e) {}
  try { if (typeof renderTitle === 'function') renderTitle(); } catch (e) {}
}
function newHand(){
  UI.busy = false; UI.discards = []; UI.bid = 0; UI.showdown = null; UI.msg = '';
  for (const s of T.seats) if (!s.human && s.purse < T.buyin + 6) s.purse = 20;           // a regular who is cleaned out buys back in, so the table stays full
  E.deal(T); UI.hands++;
  const dealer = T.seats[T.dealer];
  UI.msg = `${E_(dealer.name)} deals${dealer.human ? ' (no buy-in for the dealer)' : ''}. Buy-in ${T.buyin} coin${T.buyin === 1 ? '' : 's'}. Pick 2 dice to throw into the community cup.`;
  sfx('diceCup', 'pick'); setTimeout(() => sfx('diceRoll', 'bash'), 250);
  if (T.seats[0].out){ UI.msg = 'You cannot cover the buy-in. Leave the table.'; }
  render();
  setTimeout(aiDiscards, 500);
}
function aiDiscards(){
  if (!T || T.phase !== 'discard') return;
  for (let i = 1; i < T.seats.length; i++){ const s = T.seats[i]; if (s.out || s.discarded) continue;
    if (E.aiRebuy(T, s, s.st)) { E.reroll(T, s); s.said = 'Again!'; }
    const d = E.aiDiscard(s, s.st); E.discard(T, s, d.i, d.j); }
  if (T.seats[0].out) { E.discard(T, T.seats[0], 0, 1); }
  maybeStartHunt(); render();
}
function maybeStartHunt(){
  if (!T || T.phase !== 'discard' || !E.allDiscarded(T)) return;
  E.startHunts(T); sfx('diceRoll', 'bash'); UI.msg = 'The community dice are thrown: bid to drop the dice you do not want, until two remain.'; step();
}
function step(){
  render();
  if (!T) return;
  if (T.phase === 'show') return showdown();
  if (T.phase !== 'hunt') return;
  if (T.turn === 0 || UI.busy) return;
  UI.busy = true;
  setTimeout(() => { UI.busy = false; if (!T || T.phase !== 'hunt' || T.turn === 0) return;
    const si = T.turn, s = T.seats[si], mv = E.aiMove(T, si, s.st);
    doAct(si, mv); }, 650);
}
function doAct(si, mv){
  const s = T.seats[si], pot0 = T.pot;
  const r = E.act(T, si, mv); if (!r.ok) { if (si === 0) sfx('nope'); return render(); }
  const ev = r.ev;
  if (mv.type === 'bid'){ sfx('coin'); if (!s.human && (mv.thought === 'bluff' ? rnd() < .7 : rnd() < .25)) say(s, mv.thought === 'bluff' ? 'crepBluff' : 'crepChat'); UI.msg = `${E_(s.name)} ${T.bounty && T.bounty.owner === si && T.bounty.total === mv.total ? 'bids' : 'adds to the bounty'}, ${T.bounty ? T.bounty.total : mv.total} on the ${dieName(T.bounty ? T.bounty.die : mv.die)}.`; }
  else { UI.msg = `${E_(s.name)} passes.`; }
  if (ev.removed){ const d = T.removed[T.removed.length - 1]; UI.msg = `The bounty (${ev.bounty || 0}) is paid: the ${d ? 'level ' + d.lvl + ' die showing ' + d.v : 'die'} is removed.`; sfx('pick'); }
  if (ev.passRule === 'reroll') UI.msg = 'Nobody bid in the First Hunt: the dealer rerolls the whole pool and the Second Hunt begins.';
  if (ev.passRule === 'low2') UI.msg = 'Nobody bid at the start of the Second Hunt: only the 2 lowest dice stay.';
  if (ev.passRule === 'high') UI.msg = 'Nobody bid: the highest die is dropped.';
  if (ev.hunt2) UI.msg += ' The Second Hunt begins: the dropped dice are rerolled and merged back.';
  UI.bid = 0; step();
}
const dieName = id => { const d = (T.pool.find(x => x.id === id) || T.removed.find(x => x.id === id)); return d ? `level ${d.lvl} die (${d.v})` : 'die'; };
function showdown(){
  const r = E.showdown(T); UI.showdown = r;
  const w = r.winners.map(i => T.seats[i]), me = T.seats[0];
  const mine = r.winners.includes(0);
  const net = (me.paid ? 0 : 0);
  UI.msg = (mine ? 'You win the pot' : E_(w[0].name) + ' takes the pot') + ` (${T.pot} coins = ${T.pot * T.unit}gp)${r.winners.length > 1 ? ', split ' + r.winners.length + ' ways' : ''}.`;
  for (const s of T.seats) if (!s.human && !s.out) { if (r.winners.includes(T.seats.indexOf(s))) say(s, 'crepWin'); else if (rnd() < .5) say(s, 'crepLose'); }
  if (UI.hasT){
    // Treasury was debited on every bid; credit the player's share
    const sh = r.winners.includes(0) ? r.share + (r.winners[0] === 0 ? r.odd : 0) : 0;
    if (sh){ META.treasury += sh * T.unit; try { if (typeof saveMeta === 'function') saveMeta(); } catch (e) {} }
    me.purse = Math.floor(META.treasury / T.unit);
    try { const S = (typeof st === 'function') ? st() : null; if (S){ S.crepitus = (S.crepitus || 0) + 1; if (mine) S.crepitusWins = (S.crepitusWins || 0) + 1; if (typeof saveMeta === 'function') saveMeta(); } } catch (e) {}
  } else if (r.winners.includes(0)) {}
  sfx(mine ? 'win' : 'down'); sfx('coin');
  render();
}
/* ---- actions from the buttons ---- */
const A = {
  die(id){ if (!T || T.phase !== 'hunt' || T.turn !== 0) return; UI.sel = id; render(); },
  add(n){ UI.bid = Math.max(0, (UI.bid || 0) + n); render(); },
  clear(){ UI.bid = 0; render(); },
  bid(){
    if (!T || T.phase !== 'hunt' || T.turn !== 0) return;
    const b = T.bounty, die = UI.sel || (b && b.die);
    if (!die) { UI.msg = 'Click a community die first, then choose coins.'; return render(); }
    let total = UI.bid; if (!total) total = b ? (b.die === die ? 1 : b.total + 1) : 1;
    doAct(0, {type: 'bid', die, total});
  },
  pass(){ if (!T || T.phase !== 'hunt' || T.turn !== 0) return; doAct(0, {type: 'pass'}); },
  disc(i){
    if (!T || T.phase !== 'discard' || T.seats[0].discarded) return;
    const k = UI.discards.indexOf(i); if (k >= 0) UI.discards.splice(k, 1); else { UI.discards.push(i); if (UI.discards.length > 2) UI.discards.shift(); }
    render();
  },
  throwIn(){
    if (!T || T.phase !== 'discard' || UI.discards.length !== 2) return;
    E.discard(T, T.seats[0], UI.discards[0], UI.discards[1]); UI.discards = []; sfx('diceCup', 'pick');
    UI.msg = 'Waiting for the others...'; maybeStartHunt(); render();
  },
  rebuy(){ if (E.reroll(T, T.seats[0])){ UI.discards = []; sfx('diceRoll', 'bash'); UI.msg = 'You pay the buy-in again and throw a fresh hand.'; render(); } else sfx('nope'); },
  next(){ newHand(); },
  leave(){ close(); }
};

/* ---- drawing ---- */
const LC = ['#8a6a4a', '#8a8a8a', '#5f8f4e', '#3f5ea8', '#7a4a9a', '#9a3a2a', '#c8a24a'];
function dieHTML(d, o){
  o = o || {};
  return `<div class="cpd ${o.cls || ''}" ${o.click ? `onclick="${o.click}"` : ''} style="--c:${LC[d.lvl % 7]}" title="Level ${d.lvl}: rolls ${d.lvl} to ${d.lvl + 5}"><b>${o.hide ? '?' : d.v}</b><i>L${d.lvl}</i></div>`;
}
function coinsHTML(n){
  if (!n) return '<span class="cpcoin">0</span>';
  let g_ = Math.floor(n / 4), r = n % 4, s_ = Math.floor(r / 2), c_ = r % 2, h = '';
  if (g_) h += `<span class="cpcoin gold">${g_}×G</span>`; if (s_) h += `<span class="cpcoin silver">${s_}×S</span>`; if (c_) h += `<span class="cpcoin copper">${c_}×C</span>`;
  return h;
}
function render(){
  const el = document.getElementById('screen-crepitus'); if (!el || !T || !UI) return;
  const me = T.seats[0], hunt = T.phase === 'hunt', myTurn = hunt && T.turn === 0, sd = UI.showdown;
  const bg = (typeof RK_ART !== 'undefined' && RK_ART.bg) ? `,url(${RK_ART.bg})` : '';
  const opp = T.seats.slice(1).map((s, k) => {
    const i = k + 1, p = s.p || {}, img = portrait(p);
    const hand = sd && !s.out ? sd.results.find(r => r.seat === i) : null;
    return `<div class="cpseat ${T.turn === i ? 'turn' : ''} ${s.out ? 'out' : ''} ${sd && sd.winners.includes(i) ? 'won' : ''}">
      <div class="rkwho">${img ? `<img src="${img}">` : ''}<div><b>${E_(s.name)}</b>${T.dealer === i ? ' <em>(dealer)</em>' : ''}<br><span>${p.race && typeof RACES !== 'undefined' && RACES[p.race] ? RACES[p.race].name + ' ' + (typeof SPECS !== 'undefined' && SPECS[p.spec] ? SPECS[p.spec].name : '') : 'Regular'} · ${s.st.name}</span></div></div>
      <div class="cprow">${s.out ? '<i>sits out</i>' : sd ? s.kept.map(v => dieHTML({lvl: 0, v}, {cls: 'sm'})).join('') : (s.hid || []).slice(0, 5).map(d => `<div class="cpd sm back"><b>?</b></div>`).join('')}</div>
      <div class="ink small" style="color:#e8d8b0">Purse ${s.purse} coins ${s.state ? '· ' + E_(s.state) : ''}${hand ? ' · <b>' + hand.name + '</b>' : ''}</div>
      ${s.said ? `<div class="cpsay">“${E_(s.said)}”</div>` : ''}</div>`;
  }).join('');
  const poolHTML = (T.pool || []).map(d => {
    const b = T.bounty && T.bounty.die === d.id;
    return `<div class="cpslot ${UI.sel === d.id && myTurn ? 'sel' : ''}">${dieHTML(d, {click: myTurn ? `CREPITUS.ui.die(${d.id})` : '', cls: (b ? 'mark ' : '') + (myTurn ? 'can' : '')})}${b ? `<div class="cptag">${T.bounty.total}</div>` : ''}</div>`;
  }).join('') || '<i style="color:#e8d8b0">The cup is still being filled.</i>';
  const com = sd ? `<div class="ink small" style="color:#e8d8b0">Final community dice: ${sd.com.map(v => `<b>${v}</b>`).join(', ')}</div>` : '';
  const myHand = (me.hid || []).map((d, i) => {
    const gone = me.discarded; const picked = UI.discards.includes(i);
    return dieHTML(d, {click: (T.phase === 'discard' && !gone) ? `CREPITUS.ui.disc(${i})` : '', cls: (picked ? 'picked ' : '') + (T.phase === 'discard' && !gone ? 'can' : '')});
  }).join('');
  const b = T.bounty;
  let side = '';
  if (T.phase === 'discard' && !me.out && !me.discarded)
    side = `<div class="rkbox"><h3>Your hand</h3><div class="ink small">Click 2 dice to throw into the community cup. Keep 5. Buy-in ${T.buyin} coins (${T.buyin * T.unit}gp).</div>
      <button class="btn gold" ${UI.discards.length === 2 ? '' : 'disabled'} onclick="CREPITUS.ui.throwIn()">THROW IN 2 DICE</button>
      <button class="btn small" ${E.fund(me, T.buyin) && (me.rerolls || 0) < T.rerollMax ? '' : 'disabled'} onclick="CREPITUS.ui.rebuy()">PAY ${T.buyin} AGAIN, REROLL HAND</button></div>`;
  else if (hunt)
    side = `<div class="rkbox"><h3>${myTurn ? 'Your bid' : E_(T.seats[T.turn] ? T.seats[T.turn].name : '') + ' is thinking...'}</h3>
      <div class="ink small">Hunt ${T.hunt} of 2 · ${T.pool.length} dice to drop ${T.pool.length > 2 ? 'to 2' : ''}. ${b ? `Bounty: <b>${b.total}</b> on a die, by ${E_(T.seats[b.owner].name)}.` : 'No bounty yet.'}</div>
      ${myTurn ? `<div class="ink small">Click a die to aim at it. ${b ? (UI.sel && UI.sel !== b.die ? 'A different die needs more than ' + b.total + ' in all.' : 'Same die: add coins to reinforce.') : ''}</div>
        <div class="cpbtns"><button class="btn small" onclick="CREPITUS.ui.add(1)">+ Copper (1)</button><button class="btn small" onclick="CREPITUS.ui.add(2)">+ Silver (2)</button><button class="btn small" onclick="CREPITUS.ui.add(4)">+ Gold (4)</button><button class="btn small" onclick="CREPITUS.ui.clear()">Clear</button></div>
        <div class="ink small">Coins: <b>${UI.bid || 0}</b> (${(UI.bid || 0) * T.unit}gp) ${coinsHTML(UI.bid || 0)}</div>
        <button class="btn gold" onclick="CREPITUS.ui.bid()">${b ? (UI.sel && UI.sel !== b.die ? 'OUTBID ON THIS DIE' : 'REINFORCE') : 'START A BOUNTY'}</button>
        <button class="btn small" onclick="CREPITUS.ui.pass()">PASS</button>` : ''}</div>`;
  else if (T.phase === 'done' && sd)
    side = `<div class="rkbox"><h3>${sd.winners.includes(0) ? 'You win!' : E_(T.seats[sd.winners[0]].name) + ' wins'}</h3>
      <div class="ink">${sd.results.map(r => `${E_(T.seats[r.seat].name)}: <b>${r.name}</b>`).join('<br>')}</div>
      <div class="ink" style="margin:8px 0">Pot ${sd.pot} coins (${sd.pot * T.unit}gp). ${UI.hasT ? 'Treasury ' + META.treasury + 'gp.' : ''}</div>
      <button class="btn gold" onclick="CREPITUS.ui.next()">DEAL AGAIN</button></div>`;
  else if (me.out) side = `<div class="rkbox"><h3>Out of coins</h3><div class="ink">You cannot cover the ${T.buyin}-coin buy-in.</div></div>`;
  else side = `<div class="rkbox"><h3>Waiting</h3><div class="ink small">The others are choosing their dice.</div></div>`;
  el.innerHTML = `<div class="rkwrap" style="background-image:linear-gradient(rgba(20,10,4,.72),rgba(20,10,4,.85))${bg}">
    <div class="rkhead"><h1>Crepitus</h1><div class="hsub">Hand ${T.hand} · 1 coin = ${T.unit}gp (Copper 1, Silver 2, Gold 4) · Pot ${T.pot} coins (${T.pot * T.unit}gp) · ${UI.hasT ? 'Treasury ' + META.treasury + 'gp' : 'Purse ' + me.purse + ' coins'} · Dealer ${E_(T.seats[T.dealer].name)}</div></div>
    <div class="rkgrid cpgrid">
      <div class="rkside">${opp}</div>
      <div class="cpcenter">
        <div class="cptable"><h3>Community pool</h3><div class="cprow big">${poolHTML}</div>${com}</div>
        <div class="cptable"><h3>${E_(me.name)}${T.dealer === 0 ? ' <em>(dealer)</em>' : ''}${me.state ? ' · ' + E_(me.state) : ''}</h3><div class="cprow big">${myHand}</div>
          ${sd ? `<div class="ink small" style="color:#e8d8b0">Your hand: <b>${(sd.results.find(r => r.seat === 0) || {}).name || '-'}</b></div>` : ''}</div>
        <div class="ink small cpmsg">${UI.msg || ''}</div>
      </div>
      <div class="rkside">${side}<button class="btn small" onclick="CREPITUS.ui.leave()">LEAVE THE TABLE</button></div>
    </div></div>`;
}
const CSS = `
#screen-crepitus{ padding:0; background:var(--wood-night); justify-content:stretch; align-items:stretch; overflow:auto }
.cpgrid{ grid-template-columns:minmax(220px,1fr) minmax(360px,2fr) minmax(220px,1fr) }
@media (max-width:980px){ .cpgrid{ grid-template-columns:1fr } }
.cpseat{ background:rgba(20,10,4,.6); border:2px solid var(--wood); padding:6px; margin-bottom:8px } .cpseat.turn{ border-color:var(--gold); box-shadow:0 0 10px var(--gold) } .cpseat.out{ opacity:.45 } .cpseat.won{ border-color:var(--good-light) }
.cprow{ display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 } .cprow.big{ gap:10px }
.cpd{ position:relative; width:46px; height:46px; border-radius:8px; background:var(--c); border:3px solid #2a1406; color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 0 #1a0c04; user-select:none }
.cpd b{ font:bold 22px Georgia; text-shadow:0 1px 2px #000 } .cpd i{ position:absolute; right:2px; bottom:0; font:14px monospace; opacity:.8; font-style:normal }
.cpd.sm{ width:30px; height:30px } .cpd.sm b{ font-size:14px } .cpd.sm i{ display:none } .cpd.back{ background:var(--ink-soft) }
.cpd.can{ cursor:pointer } .cpd.can:hover{ transform:translateY(-3px); border-color:#f0d890 }
.cpd.picked{ transform:translateY(-8px); border-color:var(--gold-bright); box-shadow:0 0 12px var(--gold-bright) } .cpd.mark{ border-color:var(--gold-bright) }
.cpslot{ position:relative } .cpslot.sel .cpd{ border-color:var(--good-light); box-shadow:0 0 12px var(--good-light) }
.cptag{ position:absolute; top:-10px; right:-8px; background:var(--gold-bright); color:#2a1406; font:bold 14px Georgia; border-radius:10px; padding:1px 7px; border:2px solid #2a1406 }
.cptable{ background:rgba(20,10,4,.55); border:2px solid var(--wood); padding:10px 12px; margin-bottom:10px; color:var(--parchment) } .cptable h3{ margin:0 0 6px; font-variant:small-caps; font-size:20px; color:#f0d890 }
.cpmsg{ color:#e8d8b0; min-height:36px; font-size:14px }
.cpsay{ font-style:italic; color:#f0d890; font-size:14px; margin-top:3px }
.cpbtns{ display:flex; flex-wrap:wrap; gap:4px; margin:6px 0 }
.cpcoin{ display:inline-block; margin:0 3px; padding:0 6px; border-radius:9px; font:bold 14px monospace; border:1px solid #2a1406 } .cpcoin.gold{ background:#e8c040 } .cpcoin.silver{ background:#c8ccd4 } .cpcoin.copper{ background:#c07840; color:#2a1406 }
`;

function selfTest(){
  const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
  try {
    const five = score5([6, 6, 6, 6, 6]), junk = score5([1, 2, 3, 4, 6]);
    ok('score5 ranks five-of-a-kind above high-card', five > junk && E.catOf(five) === 7 && E.catOf(junk) === 0);
    const pair = score5([4, 4, 1, 2, 5]), twoPair = score5([4, 4, 2, 2, 5]);
    ok('score5 ranks two-pair above one-pair', twoPair > pair && E.catOf(twoPair) === 2 && E.catOf(pair) === 1);
    const alive = nextAlive({seats: [{out: true}, {out: false}, {out: false}]}, 0);
    ok('nextAlive skips eliminated seats', alive === 1);
  } catch (e) { ok('threw', false, e && e.message); }
  const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
  return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
}

window.CREPITUS = {open, close, engine: E, ui: A, get table(){ return T; }, stakes: STAKES, units: UNITS, selfTest};
})();
