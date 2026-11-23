/* js/combat/luck-epilogue.js (INT-1 step 2, 2026-11-16): INDEX 32 (Shield Bash, Luck), 33 (epilogue, legacy), 35 (beta fixes).
   Cut unchanged from the inline script in index.html (old lines 14661 to 15312). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 32 - SHIELD BASH, LUCK AT THE TABLE, AND DEATH AVERTED
     1. SHIELD BASH now reaches as far as the Command Radius, the ring drawn
        round the Leader. Hold the Line (+22 px a rank) and a mounted squad
        widen the ring, and the bash with it. A gold shockwave now sweeps out
        to the full reach, so the player can see exactly who was caught. The
        bash is centred on each Soldier that casts it.
     2. LUCK ON FAILED ROLLS. When the Leader's own roll fails or is only
        partial, the dice tray offers a choice before the result counts:
          SPEND 1 LUCK   roll again (Q). The new result stands unless you pay again.
          BURN 1 LUCK    an automatic success (R). Permanent: maximum Luck falls.
          ACCEPT         keep the roll (Enter).
        It covers the retreat, the Barkeep parlay, Demand Surrender, the
        Leader's die at the War Council, and haggling over or questioning a
        prisoner. In the field, spending takes Luck from the contract's pool.
        In camp, Luck spent is taken off your Luck at the start of the next
        contract (META.luckOwed). Settings has a switch to turn the offer off.
        The existing Q and R keys during a fight (+1 to every die for 4 s, and
        every die a natural maximum for 6 s) are unchanged.
     3. DEATH AVERTED. A Leader who fails a Bleeding Out roll already burns a
        point of Luck to live, if any is left. That is now announced: in the
        field the game pauses on a notice (Enter to carry on) with the new
        maximum Luck and a warning when none is left, and the debrief shows the
        same as a boxed notice instead of a single line.
   To roll back, delete from this comment to END INDEX 32 and undo the small
   patches marked "Index 32" elsewhere in the file.
============================================================================ */
const LKS = {force:0, flow:null, job:null, saved:null};
const lkOn = () => !(typeof settings === 'function' && settings().luckPrompt === false);
const lkLive = () => !!(typeof G !== 'undefined' && G && !G.over && G.leader && G.leader.s);
function lkMax(){ if (lkLive()) return G.leader.s.luck; const L = META && META.leader; return L ? leaderStats(L).luck : 0; }
function lkCur(){
  if (lkLive()) return Math.max(0, G.luck | 0);
  const L = META && META.leader; return L ? Math.max(0, leaderStats(L).luck - (META.luckOwed || 0)) : 0;
}
function lkSpend(){
  if (lkLive()){ G.luck = Math.max(0, G.luck - 1); pop(G.leader.x, G.leader.y - 34, 'LUCK SPENT: ROLL AGAIN', '#f0c96a'); }
  else { META.luckOwed = (META.luckOwed || 0) + 1; saveMeta(); }
}
function lkBurn(){
  const L = META.leader, cur0 = lkCur(); L.burnt = (L.burnt || 0) + 1; const max = leaderStats(L).luck;
  if (lkLive()){
    G.leader.s = leaderStats(L); G.luck = luckAfterBurn(G.luck, 1, G.leader.s.luck);   /* INDEX LK1 */ G.shake = Math.max(G.shake, 12);
    pop(G.leader.x, G.leader.y - 34, 'LUCK BURNT: AUTOMATIC SUCCESS', '#ff6a3a');
    note(`${L.name} burns 1 Luck for good. Maximum Luck is now ${G.leader.s.luck}.`);
  } else { META.luckOwed = LUCK_SOLID.on ? Math.max(0, max - luckAfterBurn(cur0, 1, max)) : Math.min(META.luckOwed || 0, max); saveMeta(); }   /* INDEX LK1: owed = max - what is left solid */
}
// Luck spent at the table is carried into the next contract.
// and the Chronicle notices the Muster rations gold go (the rations are taken inside the game's own wrapper)
{ const f = startDeployment;
  startDeployment = function(c, ids){
    const t0 = META.treasury, r = f(c, ids);
    try { const owed = META.luckOwed || 0; if (owed && G){ G.luck = Math.max(0, G.luck - owed); META.luckOwed = 0; saveMeta(); note(`Luck spent at the table comes off the start: ${G.luck} Luck to begin.`); } } catch (e) {}
    try { if (!inStoryNow() && G && c && c.tier >= 2){ const spent = t0 - META.treasury; if (spent > 0){ chron(); chronSpend('Muster rations', spent); saveMeta(); } } } catch (x) {}
    return r;
  };
}

/* ---- the offer: a flow marks the next dice job as luck-able --------------- */
function luckFlow(spec, fn){
  const prev = LKS.flow; LKS.flow = prev || Object.assign({used:false}, spec);
  try { return fn(); } finally { LKS.flow = prev; }
}
{ const f = attackDie;     // a burnt Luck makes the Leader's die an automatic success
  attackDie = function(skill, ac, l){
    const r = f(skill, ac, l);
    if (LKS.force > 0){
      LKS.force--; const sk = clampSkill(skill), r2 = {face:sk + 5, out:'crit', natMin:false, natMax:true};
      if (typeof DICE_REC !== 'undefined' && DICE_REC && DICE_REC.length){ const d = DICE_REC[DICE_REC.length - 1]; d.face = r2.face; d.out = 'crit'; d.natMin = false; d.natMax = true; }
      return r2;
    }
    return r;
  };
}
{ const f = showDice;
  showDice = function(title, dice, opts){
    opts = opts || {};
    const fl = LKS.flow;
    if (fl && !fl.used){
      fl.used = true;
      const head = lkOn() ? fl.fail(dice) : null;
      if (head && (lkCur() >= 1 || lkMax() >= 1)) opts = Object.assign({}, opts, {luck:{head, redo:fl.redo}});
    }
    return f(title, dice, opts);
  };
}
{ const f = diceNext;
  diceNext = function(){
    const job = DICE_Q[0];
    f();
    if (!job || !job.opts || !job.opts.luck) return;
    clearTimeout(job.timer);
    const el = $('dice-tray'); if (!el) return;
    el.onclick = () => { if (!job.offer) luckShow(job); };
    job.offerTimer = setTimeout(() => luckShow(job), 650 + job.dice.length * 160 + 300);
  };
}
function luckPanelHTML(job){
  const cur = lkCur(), max = lkMax(), live = lkLive();
  const pips = Array.from({length:Math.max(max, cur)}, (_, i) => `<span class="dt-pip ${i < cur ? 'on' : ''}"></span>`).join('');
  const note = live ? 'Spent Luck comes back through Momentum and rest. Burnt Luck never does.' : 'Luck spent here comes off your Luck at the start of the next contract. Burnt Luck never comes back.';
  return `<div class="dt-luck" onclick="event.stopPropagation()">
    <div class="dt-lhead">${job.opts.luck.head}</div>
    <div class="dt-lpips">Your Leader's Luck ${pips} <span style="opacity:.8">${cur} of ${max}</span></div>
    <div class="dt-lrow">
      <button class="dt-lbtn" id="dl-spend" ${cur < 1 ? 'disabled' : ''} onclick="event.stopPropagation();luckPick('reroll')">SPEND 1 LUCK: ROLL AGAIN [Q]</button>
      <button class="dt-lbtn burn" id="dl-burn" ${max < 1 ? 'disabled' : ''} onclick="event.stopPropagation();luckPick('burn')">BURN 1 LUCK: AUTOMATIC SUCCESS [R]</button>
      <button class="dt-lbtn keep" id="dl-keep" onclick="event.stopPropagation();luckPick('keep')">ACCEPT THE ROLL [Enter]</button>
    </div>
    <div class="dt-lnote">${note} Burning lowers your maximum Luck from ${max} to ${Math.max(0, max - 1)}.</div></div>`;
}
function luckShow(job){
  if (!job || job.closed || job.offer) return;
  clearInterval(job.spin); clearTimeout(job.offerTimer);
  const el = $('dice-tray'); if (!el) return;
  job.offer = true; LKS.job = job;
  el.insertAdjacentHTML('beforeend', luckPanelHTML(job));
}
function luckPick(mode){
  const job = LKS.job; if (!job || job.closed || !job.offer) return;
  if (mode === 'keep'){ LKS.job = null; return diceDone(job, true); }
  if (mode === 'reroll'){ if (lkCur() < 1){ SFX.play('nope'); return; } lkSpend(); }
  else if (mode === 'burn'){ if (lkMax() < 1){ SFX.play('nope'); return; } lkBurn(); }
  else return;
  job.closed = true; LKS.job = null; clearInterval(job.spin); clearTimeout(job.timer); clearTimeout(job.offerTimer);
  const el = $('dice-tray'); if (el) el.className = '';
  SFX.play(mode === 'burn' ? 'bash' : 'pick');
  setTimeout(() => {
    let ok = true;
    try { LKS.force = mode === 'burn' ? 1 : 0; job.opts.luck.redo(mode); } catch (e) { ok = false; console.log('luck redo failed', e && e.message); } finally { LKS.force = 0; }
    if (!ok && job.opts.then){ try { job.opts.then(); } catch (e) {} }
    setTimeout(diceNext, 120);
  }, 60);
}
// Keys while a choice is open: Q rolls again, R burns, Enter or Space accepts. Escape is held so it cannot unpause the game behind.
function luckKey(e){
  const k = String(e.key || '').toLowerCase();
  if (LKS.saved){ if (k === 'enter' || k === ' ' || k === 'escape'){ e.stopImmediatePropagation(); e.preventDefault(); if (k !== 'escape') luckSavedClose(); return true; } return false; }
  const job = LKS.job; if (!job || job.closed || !job.offer) return false;
  if (k === 'q' || k === 'r' || k === 'enter' || k === ' ' || k === 'escape'){
    e.stopImmediatePropagation(); e.preventDefault();
    if (k === 'q') luckPick('reroll'); else if (k === 'r') luckPick('burn'); else if (k !== 'escape') luckPick('keep');
    return true;
  }
  return false;
}
window.addEventListener('keydown', luckKey, true);

/* ---- the rolls that offer Luck ----------------------------------------------- */
const lkHead = (out, partial, miss) => out === 'miss' ? miss : (out === 'graze' ? partial : null);
const lkFailDie = d => d && d[0] ? lkHead(d[0].out, 'Only a partial success.', 'The roll missed.') : null;
// Sound the Retreat, and the Barkeep parlay (the same button during a brawl)
{ const f = askWithdraw;
  askWithdraw = function(){ return luckFlow({fail:lkFailDie, redo:() => askWithdraw()}, () => f()); };
}
{ const f = barkeepParlay;
  barkeepParlay = function(){ return luckFlow({fail:lkFailDie, redo:() => barkeepParlay()}, () => f()); };
}
// Demand Surrender: only a lost roll offers Luck, and a lost roll has changed nothing yet.
{ const f = parlayChoice;
  parlayChoice = function(ch){
    if (!PARLAY || ch !== 'surrender' || PARLAY.rolled) return f(ch);
    const e = PARLAY.e;
    return luckFlow({
      fail:d => (d[0] && d[0].win === false) ? 'The talks failed.' : null,
      redo:mode => {
        if (!PARLAY) return; const R = PARLAY.rolled; PARLAY.rolled = null;
        if (mode !== 'burn') return parlayChoice('surrender');
        const B = BESTIARY[e.k], per = clampSkill(G.leader.s.per + parlayStep()), mor = commanderMorale(B.tier), theirs = R ? R.theirs : mor;
        PARLAY.rolled = {mine:per + 5, theirs, win:true, per}; SFX.play('win'); commanderGone(e, 'surrender'); renderParlay();
        showDice('Demand Surrender', [
          {face:per + 5, skill:per, label:'Your Leader (Luck burnt)', win:true, text:'AUTOMATIC SUCCESS'},
          {face:theirs, skill:mor, label:ename(e), win:false}], {sub:'Burnt Luck: an automatic success.', result:`${esc(ename(e))} lays down arms.`, sfx:'win'});
      }}, () => f(ch));
  };
}
// The War Council: Luck is the Leader's, so it works on the Leader's die (the first one).
const lkCouncilFail = d => d && d[0] ? lkHead(d[0].out, "The Leader's die was only a partial success.", "The Leader's die missed.") : null;
function lkCouncilShow(c){
  luckFlow({fail:lkCouncilFail, redo:lkCouncilRedo}, () => showDice('The War Council', c.council.map(d => ({face:d.face, skill:d.skill, out:d.res === 'success' ? 'solid' : d.res === 'partial' ? 'graze' : 'miss', ac:councilDiff(c), label:d.label})),
    {sub:`Against Patron Resistance ${councilDiff(c)}`, result:`${c.picks} Contract Edge${c.picks === 1 ? '' : 's'} won.`, sfx:c.picks ? 'win' : 'nope'}));
}
function lkCouncilRedo(mode){
  const c = META.board && MU && META.board[MU.contract]; if (!c || !c.council || !c.council[0]) return;
  const s = leaderStats(META.leader), r = attackDie(s.per, councilDiff(c));
  c.council[0] = {label:c.council[0].label, skill:clampSkill(s.per), face:r.face, res:(r.out === 'solid' || r.out === 'crit') ? 'success' : r.out === 'graze' ? 'partial' : 'miss'};
  c.picks = c.council.filter(d => d.res === 'success').length + (perk('dominion', 9) ? 1 : 0);
  st().bestCouncil = Math.max(st().bestCouncil || 0, c.picks);
  checkMilestones(null); saveMeta(); renderMuster(); lkCouncilShow(c);
}
{ const f = rollCouncil; rollCouncil = function(){ return luckFlow({fail:lkCouncilFail, redo:lkCouncilRedo}, () => f()); }; }
// Prisoners: haggling and questioning. A reroll first puts back what the failed roll changed.
{ const f = prisonerAct;
  prisonerAct = function(i, act){
    const pr = META.prisoners && META.prisoners[i];
    if (!pr || (act !== 'ransom' && act !== 'interrogate') || inStoryNow() || (act === 'interrogate' && mastery('cells'))) return f(i, act);
    const snap = {treasury:META.treasury, intel:META.intel, value:pr.value, asked:pr.asked, msg:CH_MSG, standing:JSON.stringify(META.standing || {}), ambition:JSON.stringify(META.ambition === undefined ? null : META.ambition), notes:JSON.stringify(META.pendingNotes || [])};   /* Index 35 */
    return luckFlow({fail:lkFailDie, redo:() => {
      META.treasury = snap.treasury; META.intel = snap.intel; pr.value = snap.value; pr.asked = snap.asked; CH_MSG = snap.msg; META.standing = JSON.parse(snap.standing); META.ambition = JSON.parse(snap.ambition); META.pendingNotes = JSON.parse(snap.notes);
      if (act === 'ransom' && !META.prisoners.includes(pr)) META.prisoners.splice(Math.min(i, META.prisoners.length), 0, pr);
      prisonerAct(META.prisoners.indexOf(pr), act);
    }}, () => f(i, act));
  };
}

/* ---- death averted --------------------------------------------------------------- */
function luckSaved(roll){
  const L = META.leader, max = G.leader.s.luck;
  G.paused = true; LKS.saved = {roll, max};
  let el = $('luck-saved');
  if (!el){ el = document.createElement('div'); el.id = 'luck-saved'; el.style.cssText = 'position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:rgba(10,4,2,.72)'; document.body.appendChild(el); }
  el.innerHTML = `<div style="background:#efe3c8;color:#2a2218;border:4px solid #c8742a;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,.7);max-width:min(520px,92vw);padding:18px 24px;text-align:center;font-family:Georgia">
    <div style="font:900 30px Georgia;color:#8a3a10;font-variant:small-caps;letter-spacing:1px">Death Averted</div>
    <div style="font:bold 18px Georgia;margin:8px 0 6px">${esc(L.name)} should be dead.</div>
    <div style="font:15px/1.45 Georgia">The Bleeding Out roll was ${roll}, and a 1 to 3 is fatal. ${esc(L.name)} burns a point of Luck, for good, and clings on.</div>
    <div style="font:bold 16px Georgia;margin:10px 0 4px;color:var(--blood)">Maximum Luck: ${max + 1} to ${max}</div>
    ${max < 1 ? '<div style="font:bold 15px Georgia;color:#9a1a1a;margin:4px 0 6px">No Luck is left to burn. The next failed Bleeding Out roll is fatal.</div>' : '<div style="font:13px Georgia;color:#5a4a2a;margin:4px 0 6px">Get a Squad Mate to the Leader, or a Cleric to cure them, before the next roll in 8 seconds.</div>'}
    <button class="btn gold" style="margin-top:6px" onclick="luckSavedClose()">CARRY ON [Enter]</button></div>`;
  el.style.display = 'flex'; SFX.play('down');
}
function luckSavedClose(){
  const el = $('luck-saved'); if (el) el.style.display = 'none'; LKS.saved = null;
  if (G && !G.over && !PARLAY && !DICE_ON) G.paused = false;
}

/* ---- the Manual and Settings -------------------------------------------------------- */
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx32')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx32"><b>Luck on a failed roll.</b> When your Leader's own roll fails or is only partial (withdrawing, a parlay, the Leader's die at the War Council, haggling over or questioning a prisoner), you can spend 1 Luck to roll again, or burn 1 Luck for an automatic success. Burnt Luck lowers your maximum for good. In the field, spent Luck comes back through Momentum; at the table, it comes off your Luck at the start of the next contract. The offer can be turned off in Settings.</p>
      <p class="idx32"><b>Shield Bash</b> now reaches as far as the Command Radius, the ring round the Leader. Hold the Line widens both. <b>Death averted:</b> a Leader who fails a Bleeding Out roll burns a point of Luck to live, if any is left.</p>`);
  };
}
{ const f = settingsHTML;
  settingsHTML = function(dark){
    const s = f(dark), on = settings().luckPrompt !== false;
    const ctl = `<label title="When your Leader's own roll fails, offer to spend or burn Luck."><input type="checkbox" ${on ? 'checked' : ''} onchange="setSetting('luckPrompt', this.checked)"> Offer Luck on failed rolls</label>`;
    const i = s.lastIndexOf('</div>');
    return i < 0 ? s + ctl : s.slice(0, i) + ctl + s.slice(i);
  };
}
{ const st = document.createElement('style');
  st.textContent = `.dt-luck{margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:default;background:rgba(20,12,6,.78);border:2px solid #8a6d3a;border-radius:8px;padding:12px 16px;max-width:680px}
    .dt-lhead{font:900 20px Georgia;color:#ffd9a0;font-variant:small-caps}.dt-lpips{font:bold 14px Georgia;color:#f0c96a;display:flex;gap:6px;align-items:center}
    .dt-pip{display:inline-block;width:13px;height:13px;border-radius:50%;border:2px solid #f0c96a;background:transparent}.dt-pip.on{background:#f0c96a}
    .dt-lrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
    .dt-lbtn{font:bold 14px Georgia;padding:10px 14px;border:3px solid var(--ink);border-radius:8px;background:linear-gradient(#f6e7b8,#d8b860);color:#2a1a0a;cursor:pointer}
    .dt-lbtn.burn{background:linear-gradient(#b8561e,#a44818);color:#fff}.dt-lbtn.keep{background:linear-gradient(#d8d0c0,#a89c84)}
    .dt-lbtn[disabled]{opacity:.4;cursor:not-allowed}.dt-lnote{font:14px Georgia;color:#e8d8b0;max-width:600px;text-align:center}`;
  document.head.appendChild(st); }
// The bard sits still, so a click near his log is his, even when someone is walking past.
{ const f = campHit;
  campHit = function(wx, wy){
    const B = CAMP.bardQ;
    if (B && CAMP.people.includes(B) && !inStoryNow() && Math.hypot(B.x - wx, B.y - 6 - wy) < 22) return {kind:'person', id:B.id, q:B};
    return f(wx, wy);
  };
}
/* ===== END INDEX 32 ======================================================= */


/* ============================================================================
   INDEX 33 - THE EPILOGUE AND THE LEGACY
   When the Charter Ambition's final contract is won, the Scribe writes the
   Chapter's Epilogue. It opens after the debrief, and any time after that from
   the EPILOGUE button on the top bar or the Scribe's scroll.
     THE EPILOGUE  the dates, the contracts, the fallen with their faces, the
                   nemeses made and settled, the Chapter Master and the Leader,
                   and a few paragraphs in the Scribe's own voice. You can name
                   the Chapter here.
     CARRY ON      nothing changes. The Epilogue stays on the top bar.
     RETIRE        the company disbands with honour. The Chronicle is closed
                   and kept in the Annals, and a new Chapter is founded the next
                   Spring. The Scribe, the bard, your portraits and your
                   settings come with you, and so does the legacy.
     THE LEGACY    each Ambition fulfilled leaves one small perk to every later
                   Chapter (held once each; fulfilling the same Ambition again
                   adds a page to the Annals but no second perk):
                     Wealth      Old Money: +150gp in the Treasury at the start
                     Fame        A Name in Every Tavern: +1 Standing with the
                                 Mendorian Order at the start
                     Liberation  Debt of the Freed: a free Ex-Slave Squad Mate
                     Dominion    Old Walls: the Tents already raised
     THE ANNALS    every retired Chapter: its banner, dates, Master, Leader,
                   figures, the fallen, and its Chronicle (about 200 of its
                   main entries), plus the four legacies and which you hold.
   Not carried over: gold, buildings, gear, the roster, the Leader, standing,
   doctrines, prisoners, nemeses and milestone progress. A NEW CAMPAIGN from the
   title screen still wipes everything, the Annals included.
   To roll back, delete from this comment to END INDEX 33 and undo the small
   patches marked "Index 33" elsewhere in the file.
============================================================================ */
const LEG_PERKS = {
  wealth:    {name:'Old Money',              short:'+150gp at the start',          text:'every later Chapter starts with 150gp more in the Treasury.'},
  fame:      {name:'A Name in Every Tavern', short:'+1 Standing with Mendor',      text:'every later Chapter starts at +1 Standing with the Mendorian Order.'},
  liberation:{name:'Debt of the Freed',      short:'a free Ex-Slave Squad Mate',   text:'every later Chapter starts with a free Ex-Slave Squad Mate, one of the freed come to serve.'},
  dominion:  {name:'Old Walls',              short:'the Tents already raised',     text:'every later Chapter starts with the Tents already raised.'}
};
const LEG_GOLD = 150;
const ANN = {view:null};
const legFaction = () => factionOfPatron(FINALES.fame.patron);
const legTrack = () => (META && typeof META.charterFulfilled === 'string') ? META.charterFulfilled : null;
const legReady = () => !!(META && META.charterFulfilled && !inStoryNow());
const legName = () => ((META.chapterName || '').trim() || (ensureMaster().name + "'s Chapter")).slice(0, 40);
function legSetName(v){ META.chapterName = String(v || '').slice(0, 40); }
const legPlural = (n, w, pl) => n + ' ' + (n === 1 ? w : (pl || w + 's'));
const legFallenList = mem => (mem || []).slice().sort((a, b) => (b.leader ? 1 : 0) - (a.leader ? 1 : 0) || (b.contracts || 0) - (a.contracts || 0));
function legSpan(years, seasons){ return years ? legPlural(years, 'year') + (seasons ? ' and ' + legPlural(seasons, 'season') : '') : legPlural(seasons, 'season'); }

/* ---- what this Chapter did ------------------------------------------------- */
function legSummary(){
  const C = chron(), log = C.log, st = chronStats(log), found = log.find(e => e.k === 'found'), first = log[0];
  const t0 = found ? found.t : (first ? first.t : C.turn), t1 = Math.max(t0, C.turn), span = t1 - t0;
  const K = log.filter(e => e.k === 'contract'), open = log.find(e => e.k === 'open');
  const mem = (META.memorial || []).slice(), track = legTrack();
  return {name:legName(), t0, t1, years:Math.floor(span / 4), seasons:span % 4, dateStart:chronDate(t0), dateEnd:chronDate(t1), track,
    A:track ? AMBITIONS[track] : null, F:track ? FINALES[track] : null, master:META.master, leader:META.leader, banner:Object.assign({}, banner()), holding:META.holding || 'fort',
    contracts:st.contracts, won:st.won, bosses:K.reduce((s, e) => s + (e.bosses || 0), 0), fallen:Math.max(st.fallen, mem.length), hired:st.hired, spent:st.spent, made:st.made, slain:st.slain,
    openNem:(META.nemeses || []).map(n => n.name), treasury:META.treasury, facilities:Object.keys(META.facilities || {}).length, earlier:!!(open && open.earlier), mem};
}
// The Scribe's closing words. Plain text; chosen by the Chapter's name so they do not change when the page is reopened.
function legWords(s){
  const h = hash(String(s.name) + '|' + s.t1), pick = (a, sh) => a[((h >>> (sh || 0)) % a.length)];
  const sc = META.scribe ? META.scribe.name : 'The Scribe', span = legSpan(s.years, s.seasons), n = s.contracts;
  const out = [];
  out.push(pick([
    `The Chapter's ledger closes on ${s.dateEnd}. In ${span} it took ${legPlural(n, 'contract')} and won ${s.won}. ${sc} has checked the sums twice and does not round up.`,
    `It took ${span} and ${legPlural(n, 'contract')} to finish the charter, and ${s.won} of them ended in victory. The rest ended as well, which is all a contract has to do.`,
    `${legPlural(n, 'contract')}, ${span}, ${s.won} won. That is the whole of it, and ${sc} has set it down without adjectives.`]));
  const mem = s.mem || [], f0 = mem[0], f1 = mem[mem.length - 1];
  if (!s.fallen) out.push(`Nobody was lost. ${sc} has counted three times and remains suspicious.`);
  else out.push(`${s.fallen === 1 ? 'One name is' : s.fallen + ' names are'} cut into the graveyard stone${f0 && f1 && f0.name !== f1.name ? `, from ${f0.name}, the first, to ${f1.name}, the last` : f0 ? `, and it is ${f0.name}'s` : ''}. ` +
    pick([`${sc} has spelled every one of them correctly.`, `Each has a line in the book, and the line is longer than the one the patrons wrote.`, `None of them is a footnote.`], 3));
  if (!s.made) out.push('No enemy ever earned a page of their own.');
  else out.push(`The Chapter made ${legPlural(s.made, 'enemy', 'enemies')} worth a page of ${s.made === 1 ? 'their' : 'their'} own and settled ${s.slain}. ` +
    (s.openNem.length ? `${s.openNem.length === 1 ? 'One still walks' : s.openNem.length + ' still walk'} free${s.openNem.length <= 2 ? ' (' + s.openNem.join(' and ') + ')' : ''}, and ${sc} has left a page open for ${s.openNem.length === 1 ? 'it' : 'each'}.` : 'The book has no unfinished pages.'));
  const m = s.master, L = s.leader, A = s.A, F = s.F;
  out.push((A && F ? `The charter was ${A.name}, and it is done: ${F.title}, at ${F.place}. ` : 'The charter is fulfilled. ') +
    `${m ? m.name : 'The Chapter Master'} kept the camp, and ${L ? L.name + ' led the squad to the last day, at Level ' + L.level : 'the squad finished without a Leader'}.` + (s.earlier ? ' The first years were not written down, so this book begins late.' : ''));
  out.push(pick(['Mind the ink.', 'Whoever opens this book next may add to it.', 'It is a good book, and mostly other people\u2019s courage.'], 7));
  return out;
}
function legGrantParts(g){
  const out = [];
  if (g.gold) out.push(`${g.gold}gp for the Treasury`);
  if (g.standing) out.push(`a place in the ledgers of the ${g.standing} (+1 Standing)`);
  if (g.mate) out.push(`${g.mate.name}, a ${RACES[g.mate.race] ? RACES[g.mate.race].name : g.mate.race} ${SPECS[g.mate.spec] ? SPECS[g.mate.spec].name : g.mate.spec}, freed and sworn to the new Chapter`);
  if (g.tents) out.push('the Tents already raised');
  return out;
}
function legPerkText(track){
  const P = LEG_PERKS[track]; if (!P) return '';
  return track === 'fame' ? `${P.name}: every later Chapter starts at +1 Standing with ${facName(legFaction())}.` : `${P.name}: ${P.text}`;
}
function legPerkLine(s){
  const t = s.track, held = (META.bequests || []).includes(t);
  if (!t || !LEG_PERKS[t]) return 'This charter leaves no legacy of its own. The Chapter still goes into the Annals.';
  return held ? `You already hold <b>${esc(LEG_PERKS[t].name)}</b> from an earlier Chapter. This Chapter will be written into the Annals, but it leaves nothing new.`
              : `Retiring leaves a legacy: <b>${esc(legPerkText(t))}</b>`;
}

/* ---- the Epilogue ------------------------------------------------------------ */
const LEG_BOX = 'background:#efe3c8;color:#2a2218;border:3px solid #8a6d3a;border-radius:6px;box-shadow:0 0 30px rgba(0,0,0,.6);width:min(800px,96vw)';
const LEG_BAR = '<div style="height:16px;background:linear-gradient(#8a6d3a,#c9a85a 50%,#8a6d3a)"></div>';
function legOverlay(id, z){
  let el = $(id);
  if (!el){
    el = document.createElement('div'); el.id = id;
    el.style.cssText = `position:fixed;inset:0;z-index:${z};background:rgba(10,8,6,.84);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 10px`;
    document.body.appendChild(el);
  }
  el.style.display = 'flex'; return el;
}
const legFace = (url, w, h, name, sub, dim) => `<div style="width:${w + 18}px;text-align:center"><img src="${url}" style="height:${h}px;width:${w}px;object-fit:cover;object-position:top;border:2px solid #8a6d3a;background:#3a3226${dim ? ';filter:grayscale(.55) brightness(.92)' : ''}"><div style="font:bold 14px/1.2 Georgia;margin-top:3px">${esc(name)}</div>${sub ? `<div style="font:14px/1.2 Georgia;color:#6a5a3a">${esc(sub)}</div>` : ''}</div>`;
const legStat = (n, l) => `<div style="text-align:center;min-width:86px;margin:2px 6px"><div style="font:bold 26px Georgia;color:var(--wood)">${n}</div><div style="font:14px Georgia;letter-spacing:.5px;text-transform:uppercase;color:#6a5a3a">${l}</div></div>`;
function epilogueHTML(){
  const S = ensureScribe(), s = legSummary(), words = legWords(s), mem = legFallenList(s.mem);
  const m = s.master, L = s.leader, H = m && m.hero && HEROES[m.hero];
  const faces = [];
  if (m) faces.push(legFace(masterBustURL(), 96, 96, m.name, H ? H.title : 'Chapter Master'));
  if (L) faces.push(legFace(portraitURL(L, true), 96, 96, L.name, `Leader, Level ${L.level}`));
  const memb = mem.slice(0, 14).map(p => legFace(portraitURL(p, !!p.leader), 62, 70, p.name, p.leader ? 'Leader' : '', true)).join('');
  const tail = mem.length > 14 ? `<div style="align-self:center;font:italic 14px Georgia;margin-left:8px">and ${mem.length - 14} more</div>` : '';
  const stats = legStat(s.contracts, 'Contracts') + legStat(s.won, 'Won') + legStat(s.fallen, 'Fallen') + legStat(s.hired, 'Hired') + legStat(s.bosses, 'Commanders') + legStat(s.made + '/' + s.slain, 'Nemeses made / settled') + legStat(s.facilities, 'Buildings');
  const sec = t => `<div style="font:bold 14px Georgia;letter-spacing:1px;text-transform:uppercase;color:var(--blood);border-bottom:1px solid #b89a5a;margin:12px 0 6px;padding-bottom:2px">${t}</div>`;
  return `<div style="${LEG_BOX}">${LEG_BAR}
    <div style="padding:14px 22px 4px;display:flex;gap:14px;align-items:center">
      <img src="${portraitURL(S, false)}" style="height:80px;width:auto;border:2px solid #8a6d3a;background:#3a3226">
      <div style="flex:1;text-align:left"><div style="font:bold 14px Georgia;letter-spacing:1px;text-transform:uppercase;color:var(--blood)">Epilogue, written by ${esc(S.name)}</div>
        <input id="epi-name" value="${esc(legName())}" maxlength="40" oninput="legSetName(this.value)" onchange="saveMeta()" onkeydown="event.stopPropagation()" onkeyup="event.stopPropagation()" style="font:bold 26px Georgia;width:100%;box-sizing:border-box;background:transparent;border:0;border-bottom:2px dashed #b89a5a;color:#2a2218;padding:2px 0" title="Name the Chapter. It is kept in the Annals.">
        <div style="font:italic 14px Georgia;color:#5a4a2a">${esc(s.dateStart)} to ${esc(s.dateEnd)}, ${esc(legSpan(s.years, s.seasons))}${s.A ? ' \u00b7 Charter Ambition: ' + esc(s.A.name) : ''}</div></div></div>
    <div style="padding:0 22px 10px;text-align:left">
      ${sec('The Scribe writes')}<div style="font:14.5px/1.5 Georgia">${words.map(p => `<p style="margin:0 0 8px">${esc(p)}</p>`).join('')}</div>
      ${sec('The ledger')}<div style="display:flex;flex-wrap:wrap;justify-content:center">${stats}</div>
      ${faces.length ? sec('Who ran it') + `<div style="display:flex;gap:14px;justify-content:center">${faces.join('')}</div>` : ''}
      ${sec(s.fallen ? 'In memoriam' : 'In memoriam: nobody')}${s.fallen ? `<div style="display:flex;flex-wrap:wrap;gap:6px 4px">${memb}${tail}</div>` : ''}
      ${sec('The legacy')}<div style="font:14px/1.45 Georgia">${legPerkLine(s)}</div>
      ${(META.bequests || []).length ? `<div style="font:14px/1.4 Georgia;color:#5a4a2a;margin-top:4px">Already held: ${(META.bequests || []).map(t => esc(LEG_PERKS[t].name)).join(', ')}.</div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:16px 0 6px">
        <button class="btn" onclick="legCarryOn()">CARRY ON</button>
        <button class="btn gold" style="white-space:normal;max-width:100%;font-size:17px" onclick="legRetire()">RETIRE THE CHAPTER AND FOUND A NEW ONE</button>
        <button class="btn small" style="white-space:normal;max-width:100%" onclick="exportSave()">EXPORT THIS CHAPTER'S SAVE</button></div>
      <div style="font:14px/1.4 Georgia;color:#5a4a2a;text-align:center"><b>Carry on:</b> nothing changes, and the Epilogue waits on the top bar. <b>Retire:</b> the Chronicle goes into the Annals and a new Chapter is founded next Spring. The Treasury, roster, buildings and gear do not come with you; the legacy, the Annals, your portraits and your settings do.</div>
    </div>${LEG_BAR}</div>`;
}
function openEpilogue(auto){
  if (!legReady()) return;
  META.epilogueSeen = true; saveMeta();
  legOverlay('epilogue', 42).innerHTML = epilogueHTML();
  SFX.play(auto ? 'win' : 'pick');
}
function closeEpilogue(){ const el = $('epilogue'); if (el) el.style.display = 'none'; try { renderTopbar(); } catch (e) {} }
function legCarryOn(){ closeEpilogue(); SFX.play('pick'); }

/* ---- retiring the Chapter and founding the next ------------------------------------ */
function legArchive(s){
  const C = chron(), keep = {found:1, move:1, contract:1, death:1, nemesis:1, nemmet:1, nemslain:1, legacy:1, retire:1, open:1};
  let log = C.log.filter(e => keep[e.k]); if (log.length > 220) log = log.slice(0, 1).concat(log.slice(-219));
  const m = s.master, L = s.leader;
  return {id:(META.annals || []).length + 1, name:s.name, t0:s.t0, t1:s.t1, track:s.track, ambition:s.A ? s.A.name : null, finale:s.F ? {title:s.F.title, place:s.F.place} : null,
    master:m ? {name:m.name, race:m.race, cls:m.cls, spec:m.spec, sex:sexOf(m), hero:m.hero || null, id:m.id || 'CM'} : null,
    leader:L ? {name:L.name, race:L.race, cls:L.cls, spec:L.spec, sex:sexOf(L), level:L.level, id:L.id || 'L'} : null,
    banner:s.banner, holding:s.holding,
    stats:{contracts:s.contracts, won:s.won, bosses:s.bosses, fallen:s.fallen, hired:s.hired, spent:s.spent, made:s.made, slain:s.slain, treasury:s.treasury, facilities:s.facilities},
    fallen:legFallenList(s.mem).slice(0, 14).map(p => ({name:p.name, race:p.race, cls:p.cls, spec:p.spec, sex:p.sex, id:p.id, leader:!!p.leader, level:p.level, cause:p.cause})),
    nemOpen:s.openNem.slice(0, 12), closing:legWords(s), log};
}
// Apply every legacy held to a brand new Chapter. Returns what was given, for the Chronicle and the founding screen.
function legApplyPerks(){
  const g = {perks:[], gold:0, standing:null, mate:null, tents:false};
  for (const t of (META.bequests || [])){
    if (!LEG_PERKS[t]) continue; g.perks.push(t);
    if (t === 'wealth'){ META.treasury += LEG_GOLD; g.gold += LEG_GOLD; }
    if (t === 'fame'){ const f = legFaction(); META.standing = META.standing || {}; META.standing[f] = Math.max(standing(f), 1); g.standing = FACTIONS[f].name; }
    if (t === 'liberation'){ const race = rollRace(), spec = pickOf(SPEC_ORDER), m = makeMate(race, 'SLAVE', spec, randomName(race)); META.roster.push(m); g.mate = {name:m.name, race:m.race, spec:m.spec}; }
    if (t === 'dominion'){ META.facilities = META.facilities || {}; META.facilities.tents = true; g.tents = true; }
  }
  return g;
}
function legRetire(){
  if (!legReady()) return;
  if (!gate(`Retire the Chapter? The company disbands with honour and the Chronicle goes into the Annals. The Leader, roster, Treasury, buildings and gear are lost. The legacy, the Annals, your portraits and your settings are kept, and a new Chapter is founded next Spring.`, () => legRetire())) return;
  const old = META, s = legSummary(), track = legTrack(), bequests = (old.bequests || []).slice();
  chron(); chronAdd('retire', {name:s.name, track}, true);
  const annal = legArchive(s); let newPerk = null;
  if (track && LEG_PERKS[track] && !bequests.includes(track)){ bequests.push(track); newPerk = track; }
  annal.newPerk = newPerk;
  const t = old.chron.turn, turn = t - (((t % 4) + 4) % 4) + 4;
  const carry = {settings:old.settings, tipsSeen:old.tipsSeen, customPortraits:old.customPortraits, scribe:old.scribe, bard:old.bard, usedNames:old.usedNames, nextId:old.nextId, cosm:old.cosm,
    annals:(old.annals || []).concat([annal]), bequests, chron:{turn, seq:0, log:[]}};
  for (const k in carry) if (carry[k] === undefined) delete carry[k];
  META = Object.assign(freshMeta(), carry);
  const grant = legApplyPerks(); if (grant.perks.length) META.legacyGrant = grant;
  saveMeta();
  BED = null; FD = null; MU = null; PARLAY = null; CAMP.people = []; CAMP.dirty = true; ANN.view = null;
  applySkin(); closeEpilogue(); closeChronicle(); SFX.play('horn');
  openFound();
}
const legNoteHTML = () => {
  const g = META.legacyGrant; if (!g) return '';
  const n = (META.annals || []).length;
  return `<div class="log" style="max-width:640px;margin:6px auto 10px;text-align:left;font-size:14px"><p style="margin:0 0 4px"><b>The old Chapter is in the Annals${n > 1 ? ' with ' + (n - 1) + ' before it' : ''}.</b> Its legacy comes with this one:</p>
    <p style="margin:0">${legGrantParts(g).map(x => esc(x)).join('; ')}.</p></div>`;
};
{ const f = heroStepHTML; heroStepHTML = function(){ return legNoteHTML() + f(); }; }
{ const f = charterStepHTML;
  charterStepHTML = function(){
    const held = META.bequests || [];
    const note = held.length ? `<div class="sub" style="font-size:14px;margin:6px 0">Ambitions already fulfilled by past Chapters: ${held.map(t => esc(AMBITIONS[t].name + ' (' + LEG_PERKS[t].name + ')')).join(', ')}. Fulfilling a different one leaves a new legacy.</div>` : '';
    return f() + note;
  };
}
// The new Chapter's Chronicle opens with the legacy it was given.
{ const f = finishFound;
  finishFound = function(){
    const g = META ? META.legacyGrant : null, story = !!(FD && FD.fromStory);
    f();
    if (!g || story || !META) return;
    try { chron(); chronAdd('legacy', Object.assign({}, g), false); delete META.legacyGrant; saveMeta(); } catch (e) {}
  };
}
CHR_TAG.legacy = ['Legacy', '#1a4a6a']; CHR_TAG.retire = ['Retired', '#1a4a6a'];
{ const f = chronText;
  chronText = function(e){
    if (e.k === 'legacy'){ const p = legGrantParts(e); return p.length ? `The legacy of the past Chapters comes with this one: ${esc(p.join('; '))}.` : 'The legacy of the past Chapters comes with this one.'; }
    if (e.k === 'retire') return `${esc(e.name || 'The Chapter')} is retired with honour. The Chronicle is closed and sent to the Annals.`;
    return f(e);
  };
}

/* ---- the Annals ---------------------------------------------------------------------- */
function annalLogHTML(log){
  let body = '', lastT = null, lastY = null;
  for (const e of log.slice().sort((a, b) => (a.t - b.t) || (a.n - b.n))){
    if (e.t !== lastT){
      const y = 617 + Math.floor(e.t / 4);
      if (y !== lastY){ body += `<div style="font:bold 18px Georgia;color:var(--wood);border-bottom:2px solid #8a6d3a;margin:12px 0 2px">Year ${y}</div>`; lastY = y; }
      body += `<div style="font:bold 14px Georgia;color:var(--blood);margin:6px 0 2px;font-variant:small-caps">${CHR_SEASONS[((e.t % 4) + 4) % 4]}</div>`; lastT = e.t;
    }
    const tg = CHR_TAG[e.k] || ['', '#444'], tx = chronText(e); if (!tx) continue;
    body += `<div style="font:14px/1.4 Georgia;margin:2px 0 2px 8px"><span style="display:inline-block;min-width:72px;margin-right:8px;font:bold 14px Georgia;letter-spacing:.5px;color:${tg[1]};text-transform:uppercase">${tg[0]}</span>${tx}</div>`;
  }
  return body;
}
function annalCardHTML(a, i){
  const st = a.stats || {}, M = a.master, L = a.leader, b = a.banner || {c1:'#7a3e26', c2:'#d4af37'};
  const mface = M ? legFace(portraitURL(Object.assign({}, M), false), 64, 64, M.name, M.hero && HEROES[M.hero] ? HEROES[M.hero].title : 'Chapter Master') : '';
  const lface = L ? legFace(portraitURL(Object.assign({}, L), true), 64, 64, L.name, 'Leader, Level ' + L.level) : '';
  const shownF = (a.fallen || []).slice(0, 8), moreF = Math.max(0, (st.fallen || 0) - shownF.length);
  const fall = shownF.map(p => legFace(portraitURL(Object.assign({}, p), !!p.leader), 38, 44, p.name, '', true)).join('') + (moreF ? `<div style="align-self:center;font:italic 14px Georgia;margin-left:6px">and ${moreF} more</div>` : '');
  const perk = a.newPerk && LEG_PERKS[a.newPerk] ? `Left the legacy <b>${esc(LEG_PERKS[a.newPerk].name)}</b>.` : (a.track && LEG_PERKS[a.track] ? 'Its legacy was already held.' : 'Left no legacy.');
  return `<div style="border:2px solid #b89a5a;border-radius:5px;padding:10px 12px;margin:10px 0;background:rgba(255,248,230,.5)">
    <div style="display:flex;gap:12px;align-items:center"><span style="display:inline-block;width:20px;height:30px;background:${esc(b.c1)};border:3px solid ${esc(b.c2)};flex:none"></span>
      <div style="flex:1;text-align:left"><div style="font:bold 20px Georgia">${esc(a.name)}</div>
        <div style="font:italic 14px Georgia;color:#5a4a2a">${esc(chronDate(a.t0))} to ${esc(chronDate(a.t1))}${a.ambition ? ' \u00b7 ' + esc(a.ambition) : ''}${a.finale ? ' \u00b7 ' + esc(a.finale.title) : ''}</div></div>
      <button class="btn small" onclick="annalRead(${i})">READ THE CHRONICLE</button></div>
    <div style="display:flex;gap:14px;margin:8px 0 4px;flex-wrap:wrap;align-items:flex-start">${mface}${lface}
      <div style="flex:1;min-width:200px;font:14px/1.5 Georgia;text-align:left">${legPlural(st.contracts || 0, 'contract')} (${st.won || 0} won) \u00b7 ${st.fallen || 0} fallen \u00b7 ${legPlural(st.hired || 0, 'hire')} \u00b7 ${st.made || 0} nemeses made, ${st.slain || 0} settled \u00b7 ${st.bosses || 0} commanders<br>${perk}</div></div>
    ${fall ? `<div style="display:flex;flex-wrap:wrap;gap:2px">${fall}</div>` : ''}</div>`;
}
function annalsHTML(){
  const S = ensureScribe(), A = META.annals || [], held = META.bequests || [];
  const head = (sub) => `<div style="padding:14px 22px 6px;display:flex;gap:14px;align-items:center;border-bottom:1px solid #b89a5a">
      <img src="${portraitURL(S, false)}" style="height:72px;width:auto;border:2px solid #8a6d3a;background:#3a3226">
      <div style="flex:1;text-align:left"><div style="font:bold 24px Georgia">The Annals of the Chapters</div><div style="font:14px Georgia">Kept by ${esc(S.name)}</div><div style="font:italic 14px Georgia;color:#5a4a2a">${sub}</div></div>
      <button class="btn" onclick="closeAnnals()">CLOSE</button></div>`;
  if (ANN.view !== null && A[ANN.view]){
    const a = A[ANN.view];
    return `<div style="${LEG_BOX}">${LEG_BAR}${head(esc(a.name))}
      <div style="padding:8px 22px 14px;text-align:left"><button class="btn small" onclick="annalBack()">BACK TO THE ANNALS</button>
        <div style="font:italic 14px Georgia;color:#5a4a2a;margin:8px 0">${esc(chronDate(a.t0))} to ${esc(chronDate(a.t1))}</div>
        <div style="font:14px/1.5 Georgia">${(a.closing || []).map(p => `<p style="margin:0 0 7px">${esc(p)}</p>`).join('')}</div>
        <div style="max-height:calc(100vh - 340px);min-height:100px;overflow-y:auto;margin-top:6px">${annalLogHTML(a.log || [])}</div></div>${LEG_BAR}</div>`;
  }
  const slots = Object.keys(LEG_PERKS).map(t => {
    const on = held.includes(t), by = A.find(a => a.newPerk === t);
    return `<div style="flex:1 1 150px;min-width:150px;border:2px solid ${on ? '#8a6d3a' : '#c8b88a'};border-radius:5px;padding:6px 8px;background:${on ? 'rgba(212,175,55,.22)' : 'rgba(0,0,0,.04)'};opacity:${on ? 1 : .6};text-align:left">
      <div style="font:bold 14px Georgia">${esc(LEG_PERKS[t].name)} <span style="font:14px Georgia;color:var(--blood)">(${esc(AMBITIONS[t].name)})</span></div>
      <div style="font:14px/1.35 Georgia">${esc(on ? LEG_PERKS[t].short : 'Not held yet')}</div>
      <div style="font:italic 14px Georgia;color:#5a4a2a">${on ? (by ? 'Left by ' + esc(by.name) : 'Held') : 'Fulfil the ' + esc(AMBITIONS[t].name) + ' ambition, then retire the Chapter.'}</div></div>`;
  }).join('');
  const list = A.length ? A.map((a, i) => annalCardHTML(a, i)).reverse().join('') : `<div style="font:italic 14px/1.5 Georgia;margin:16px 4px;text-align:left">No Chapter has been retired yet. When a Chapter's final contract is won, the Scribe writes its Epilogue and you may retire it. It is kept here, and leaves a legacy for the Chapters that follow.</div>`;
  return `<div style="${LEG_BOX}">${LEG_BAR}${head(A.length ? legPlural(A.length, 'Chapter') + ' on the shelf' : 'The shelf is empty')}
    <div style="padding:8px 22px 14px"><div style="font:bold 14px Georgia;letter-spacing:1px;text-transform:uppercase;color:var(--blood);text-align:left;margin:4px 0">Legacies</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${slots}</div>
      <div style="max-height:calc(100vh - 380px);min-height:80px;overflow-y:auto;margin-top:6px">${list}</div></div>${LEG_BAR}</div>`;
}
function annalsRender(){ const el = $('annals'); if (el) el.innerHTML = annalsHTML(); }
function openAnnals(){ ANN.view = null; legOverlay('annals', 43).innerHTML = annalsHTML(); SFX.play('pick'); }
function closeAnnals(){ const el = $('annals'); if (el) el.style.display = 'none'; ANN.view = null; }
function annalRead(i){ ANN.view = i; annalsRender(); const el = $('annals'); if (el) el.scrollTop = 0; }
function annalBack(){ ANN.view = null; annalsRender(); }
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || (typeof ASK !== 'undefined' && ASK)) return;
  const a = $('annals'), p = $('epilogue');
  if (a && a.style.display !== 'none'){ if (ANN.view !== null) annalBack(); else closeAnnals(); }
  else if (p && p.style.display !== 'none') legCarryOn();
});

/* ---- where the player finds them ---------------------------------------------------------- */
{ const f = leaveDebrief;    // the Epilogue opens once, after the finale's debrief
  leaveDebrief = function(){
    const fin = !!(G && G.contract && G.contract.finale && G.result === 'victory') && !inStoryNow();
    f();
    try { if (fin && META.charterFulfilled && !META.epilogueSeen && !(typeof collapseDue === 'function' && collapseDue())) openEpilogue(true); } catch (e) {}
  };
}
{ const f = chronicleHTML;   // the Scribe's scroll: an Epilogue button and an Annals button
  chronicleHTML = function(){
    const h = f(), n = (META.annals || []).length;
    const btns = `${legReady() ? '<button class="btn small gold" style="font-size:14px;padding:3px 9px" onclick="closeChronicle();openEpilogue()">Epilogue</button>' : ''}<button class="btn small" style="font-size:14px;padding:3px 9px" onclick="openAnnals()">Annals${n ? ' (' + n + ')' : ''}</button>`;
    return h.replace('<span style="flex:1"></span>', btns + '<span style="flex:1"></span>');
  };
}
{ const f = renderTopbar;
  renderTopbar = function(){
    f();
    try { if (legReady()) $('topbar').insertAdjacentHTML('beforeend', '<button class="tb gold" onclick="openEpilogue()" title="The Scribe has written your Chapter\u2019s Epilogue.">EPILOGUE</button>'); } catch (e) {}
  };
}
{ const f = showSplash;
  showSplash = function(){
    f();
    try { const n = (META.annals || []).length; if (n) $('title-inner').insertAdjacentHTML('beforeend', `<div style="margin-top:12px"><button class="btn small" onclick="openAnnals()">THE ANNALS OF THE CHAPTERS (${n})</button></div>`); } catch (e) {}
  };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx33')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx33"><b>Epilogue and legacy.</b> When the final contract of your Charter Ambition is won, the Scribe writes the Chapter's Epilogue. You can carry on, or retire the Chapter: its Chronicle goes into the Annals and a new Chapter is founded the next Spring. Each Ambition fulfilled leaves one small legacy to every later Chapter: Old Money (Wealth, +${LEG_GOLD}gp), A Name in Every Tavern (Fame, +1 Standing with the Mendorian Order), Debt of the Freed (Liberation, a free Ex-Slave Squad Mate) and Old Walls (Dominion, the Tents already raised). Each is held once. Click the Scribe, then Annals, to read the old Chapters.</p>`);
  };
}
/* ===== END INDEX 33 ======================================================= */


/* ============================================================================
   INDEX 35 - BETA TEST FIXES
   Fixes for the confirmed bugs in the beta test report (the reproductions and
   the tests are listed in the notes). Most are one-line patches to the code
   they belong to, marked "Index 35". This block holds the three that needed
   code of their own:
     - the Manual contents and search now include every section (B-11)
     - the Chronicle writes down Rank'n results and Muster Rations, and no
       longer calls a tavern stake "Paid in the War Council" (B-12)
     - carried supplies no longer count as chests opened (B-15)
   To roll back, delete from this comment to END INDEX 35 and undo the patches
   marked "Index 35".
============================================================================ */

/* ---- B-11: the Manual's contents and search see every paragraph ------------ */
function manualReindex(inner){
  const lg = inner && inner.querySelector('.log'), toc = inner && inner.querySelector('.mantoc'), s = inner && inner.querySelector('.mansearch');
  if (!lg || !toc || !s) return 0;
  const ps = [...lg.querySelectorAll('p')]; toc.innerHTML = ''; let n = 0;
  ps.forEach((p, i) => {
    const b = p.querySelector('b'); if (!b) return; p.id = 'manp' + i;
    const a = document.createElement('a'); a.textContent = b.textContent.replace(/[.:]\s*$/, ''); a.onclick = () => p.scrollIntoView({block:'center'}); toc.appendChild(a); n++;
  });
  s.oninput = () => { const q = s.value.toLowerCase(); ps.forEach(p => p.style.display = !q || p.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  return n;
}
{ const f = openManual;     // runs last, after every section has been added
  openManual = function(){ f(); try { manualReindex($('manual-inner')); } catch (e) {} };
}

/* ---- B-12: Rank'n and Muster Rations in the Chronicle ---------------------- */
CHR_TAG.wager = ['Rank\u2019n', '#6a5a1a'];
{ const f = chronText;
  chronText = function(e){
    if (e.k === 'wager'){ const d = e.delta | 0; return `Played Rank'n in the tavern against <b>${esc(e.opp)}</b>: ${d > 0 ? 'won ' + d + 'gp' : d < 0 ? 'lost ' + (-d) + 'gp' : 'broke even'}.`; }
    return f(e);
  };
}
{ const f = rkEnd;
  rkEnd = function(winner, why){
    f(winner, why);
    try { if (!inStoryNow() && RK && RK.result && !RK.logged){ RK.logged = true; chron(); chronAdd('wager', {opp:RK.opp.name, delta:RK.result.delta}, false); } } catch (x) {}
  };
}
/* the Chronicle's Muster rations line is in the startDeployment wrapper above (Luck spent at the table) */

/* ---- B-15: using a carried supply is not opening a chest --------------------- */
{ const f = carryUse;
  carryUse = function(k){ const c0 = G.chests || 0; f(k); G.chests = c0; };
}
/* ===== END INDEX 35 ======================================================= */



window.LUCK_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    const svG = typeof G !== 'undefined' ? G : undefined;
    try {
      META = freshMeta();
      META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Hal');
      G = null;
      ok('lkLive is false outside field', lkLive() === false);
      ok('lkMax reads META.leader luck', lkMax() === leaderStats(META.leader).luck);
      ok('lkHead maps miss/graze/full', lkHead('miss', 'P', 'M') === 'M' && lkHead('graze', 'P', 'M') === 'P' && lkHead('full', 'P', 'M') === null);
      G = {over: false, luck: 3, leader: {s: {luck: 4}}};
      ok('lkLive true in active field and lkMax reads G.leader.s.luck', lkLive() === true && lkMax() === 4);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { META = svM; G = svG; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
