/* INDEX L35c: F-29 Camp links, build step 5: a gear card as a Crepitus wager (link 7).
   Scope: audits/links-f29.md section 7, with the Director's change: the card leaves the camp when you sit down and comes
   back only on a win, so a reload never duplicates it.
   - At the High table only (single player: the online table never calls TAVERN.crepitus), the Crepitus spot in the tavern
     hub offers "Stake a card" with the camp's spare cards (not free, not worn, not a faction gift).
   - Sitting down: ARM.remove(id), and the card's coins (ARM.price / 20, whole High-table coins) go into the Treasury, so
     the Crepitus purse counts them with no change to js/camp/crepitus.js. META.cardStake = {id, gp, t0} is saved first.
   - Leaving (TAVERN.returnFromGame): diff = Treasury now - (t0 + gp).
       diff >= half the stake (card coins at 150%+): the card comes back, plus a prize card from GEAR costing up to diff
         (not free, not a mount, not a gift, its req met); the gold won stays.
       0 <= diff: the card comes back; the gold won stays.
       diff < 0: the card is lost; its coins soak the loss first (Treasury = t0 + min(0, diff + gp)).
     The card's own coins always leave the Treasury, so gold results are what they would have been without the stake.
   - A cardStake found with no table open (a closed tab, a reload) is settled as a loss.
   Numbers are drafts for Systems: LINKS35.K.wagerWin (1.5). No switches (removed in INT-1, 2026-11-15). */
(function(){
  const L = window.LINKS35, TV = window.TAVERN; if (!L || !TV || typeof TV.crepitus !== 'function') return;
  L.K.wagerWin = 1.5; L.K.wagerUnit = 20;   // [S] draft; 20gp = one High-table coin
  const LN = () => Object.assign({
    wagerPick: 'Stake a card', wagerNone: 'no card',
    wagerSit: '{card} goes on the table as {coins} coins.',
    wagerWon: 'The table was kind: {card} comes back, and you take {prize} off a sore loser.',
    wagerBack: '{card} comes back to the wagon.',
    wagerLost: '{card} is gone: it paid for the night.'
  }, window.LINKS35_LINES || {});
  const fillL = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const gifts = () => L.giftCards || [];
  L.wagerPick = '';

  L.wagerCards = () => !window.ARM || !META ? [] : GEAR.filter(x => x.cost > 0 && !ARM.free(x.id) && !gifts().includes(x.id) && ARM.spare(x.id, META) > 0);
  L.coinsOf = id => Math.floor((ARM.price ? ARM.price(id, META) : gear(id).cost) / L.K.wagerUnit);
  L.stake = function(id){   // sit down with a card on the table; true if staked
    if (!window.ARM || TV.stake !== 'high' || !id || META.cardStake) return false;
    if (!L.wagerCards().some(x => x.id === id)) return false;
    const coins = L.coinsOf(id); if (coins < 1) return false;
    if (!ARM.remove(id, META)) return false;
    const gp = coins * L.K.wagerUnit;
    META.cardStake = {id, gp, t0: META.treasury};
    META.treasury += gp;
    try { saveMeta(); } catch (e) {}
    return true;
  };
  L.prizeFor = function(diff){
    const ok = GEAR.filter(x => x.cost > 0 && x.cost <= diff && x.slot !== 'mount' && !ARM.free(x.id) && !gifts().includes(x.id) && (x.req || []).every(r => has(r)));
    return ok.length ? pickOf(ok) : null;
  };
  L.settle = function(lost){   // returns {out, card, prize} or null
    const S = META && META.cardStake; if (!S) return null;
    const x = gear(S.id), diff = META.treasury - (S.t0 + S.gp), T = LN(), r = {card: x ? x.name : S.id, prize: null};
    delete META.cardStake;
    if (!lost && diff >= 0){
      META.treasury -= S.gp; ARM.add(S.id, 1, META);
      if (diff >= S.gp * (L.K.wagerWin - 1)){ const p = L.prizeFor(diff); if (p){ ARM.add(p.id, 1, META); r.prize = p.name; } }
      r.out = r.prize ? 'won' : 'back';
    } else {
      META.treasury = META.treasury - S.gp + Math.min(S.gp, Math.max(0, -diff));   // the card's coins soak the loss first
      r.out = 'lost';
    }
    r.line = fillL(r.out === 'won' ? T.wagerWon : r.out === 'back' ? T.wagerBack : T.wagerLost, r);
    try { saveMeta(); } catch (e) {}
    return r;
  };
  const tableOpen = () => !!(window.CREPITUS && CREPITUS.table);
  L.wagerCleanup = () => { try { if (META && META.cardStake && !tableOpen()) return L.settle(true); } catch (e) { console.warn('LINKS35 wager cleanup', e); } return null; };

  /* ---- the picker in the tavern hub ---- */
  const paint = () => { try {
    const spot = document.querySelector('#tavern-hub .spot[onclick="TAVERN.crepitus()"]'); if (!spot || spot.querySelector('.wager35')) return;
    const C = L.wagerCards(); if (!C.length || TV.stake !== 'high') { L.wagerPick = ''; return; }
    if (!C.some(x => x.id === L.wagerPick)) L.wagerPick = '';
    const T = LN();
    spot.insertAdjacentHTML('beforeend', `<div class="wager35" onclick="event.stopPropagation()" style="margin-top:6px">${esc(T.wagerPick)}:
      <select onchange="LINKS35.wagerPick=this.value"><option value="">${esc(T.wagerNone)}</option>${C.map(x => `<option value="${x.id}"${x.id === L.wagerPick ? ' selected' : ''}>${esc(x.name)} (${L.coinsOf(x.id)} coins)</option>`).join('')}</select></div>`);
  } catch (e) { console.warn('LINKS35 wager UI', e); } };
  for (const k of ['enter', 'setStake', 'back', 'go']) if (typeof TV[k] === 'function'){ const f = TV[k];
    TV[k] = function(){ if (k === 'enter') L.wagerCleanup(); const r = f.apply(this, arguments); paint(); return r; }; }

  /* ---- sit down, then settle on the way out ---- */
  { const f = TV.crepitus;
    TV.crepitus = function(){
      let staked = null;
      try { if (L.wagerPick && L.stake(L.wagerPick)){ staked = L.wagerPick; } } catch (e) { console.warn('LINKS35 wager stake', e); }
      L.wagerPick = '';
      const r = f.apply(this, arguments);
      if (staked && !tableOpen()){ L.settle(false); }   // the table did not open: hand the card straight back
      return r;
    };
  }
  if (typeof TV.returnFromGame === 'function'){ const f = TV.returnFromGame;
    TV.returnFromGame = function(){
      let r = null; try { r = META && META.cardStake ? L.settle(false) : null; } catch (e) { console.warn('LINKS35 wager settle', e); }
      const out = f.apply(this, arguments);
      try { const t = r && r.line && document.querySelector('#tavern-hub .tsub'); if (t) t.textContent = r.line; } catch (e) {}   // the hub's subtitle line
      return out;
    };
  }
  if (typeof renderTable === 'function'){ const f = renderTable; renderTable = function(){ const r = L.wagerCleanup(); if (r && r.line) CH_MSG = esc(r.line); return f.apply(this, arguments); }; }

  /* ---- self-test ---- */
  L.selfTestC = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass:!!pass, info:info || ''});
    const sv = {tr: META.treasury, cs: META.cardStake, sm: saveMeta, stake: TV.stake, add: ARM.add, rem: ARM.remove, spare: ARM.spare, price: ARM.price, pick: L.wagerPick, pr: L.prizeFor};
    let stock = {}, log = [];
    try {
      saveMeta = () => {};
      ARM.spare = id => stock[id] | 0; ARM.remove = id => (stock[id] | 0) > 0 ? (stock[id]--, log.push('-' + id), true) : false;
      ARM.add = id => { stock[id] = (stock[id] | 0) + 1; log.push('+' + id); }; ARM.price = () => 100;
      const setup = () => { stock = {greatswords: 1}; log = []; delete META.cardStake; META.treasury = 2000; TV.stake = 'high'; };
      setup();
      ok('a spare card is offered', L.wagerCards().some(x => x.id === 'greatswords'));
      stock = {}; ok('a worn card (no spare) is not offered', !L.wagerCards().some(x => x.id === 'greatswords'));
      ok('faction gifts are never offered', !L.wagerCards().some(x => gifts().includes(x.id)));
      setup(); TV.stake = 'table'; ok('only at the High table', !L.stake('greatswords') && stock.greatswords === 1);
      setup(); ok('staking takes the card and adds its coins', L.stake('greatswords') && !stock.greatswords && META.treasury === 2100 && META.cardStake && META.cardStake.t0 === 2000);
      META.treasury -= 60; let r = L.settle(false);   // lost 60 of the card's 100
      ok('a loss: the card is gone, its coins soak the loss', r.out === 'lost' && !stock.greatswords && META.treasury === 2000 && !META.cardStake, META.treasury + '');
      setup(); L.stake('greatswords'); META.treasury -= 250; r = L.settle(false);
      ok('a loss past the card: the rest comes from the Treasury', r.out === 'lost' && META.treasury === 1850, META.treasury + '');
      setup(); L.stake('greatswords'); META.treasury += 20; r = L.settle(false);
      ok('a small win: the card comes back, the gold stays', r.out === 'back' && stock.greatswords === 1 && META.treasury === 2020, META.treasury + '');
      setup(); L.prizeFor = () => gear('shortswords'); L.stake('greatswords'); META.treasury += 80; r = L.settle(false); L.prizeFor = sv.pr;
      ok('a big win: the card back plus a prize card', r.out === 'won' && stock.greatswords === 1 && stock.shortswords === 1 && META.treasury === 2080, META.treasury + '');
      ok('a prize is never free, a mount or dearer than the win', (() => { for (let k = 0; k < 20; k++){ const p = L.prizeFor(200); if (p && (p.cost > 200 || p.cost <= 0 || p.slot === 'mount')) return false; } return true; })());
      setup(); L.stake('greatswords'); META.treasury += 500; r = L.wagerCleanup();
      ok('a stake found with no table open counts as lost', r && r.out === 'lost' && !stock.greatswords && META.treasury === 2500, META.treasury + '');
    } catch (e) { ok('threw', false, e && e.message); }
    finally {
      META.treasury = sv.tr; if (sv.cs) META.cardStake = sv.cs; else delete META.cardStake; saveMeta = sv.sm; TV.stake = sv.stake;
      ARM.add = sv.add; ARM.remove = sv.rem; ARM.spare = sv.spare; ARM.price = sv.price; L.wagerPick = sv.pick; L.prizeFor = sv.pr;
    }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok:!fails.length, n:out.length, pass:out.length - fails.length, fails, out};
  };
})();
