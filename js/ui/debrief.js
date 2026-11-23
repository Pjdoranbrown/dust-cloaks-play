/* ============================================================================
   INDEX DEBRIEF31: "After the contract" data (F-31.3, Systems, 2026-11-13)
   Plain data for one debrief card per deployed mate (and one for the Leader), for Art to draw and
   Narrative to write moment lines for. No markup, no numbers changed, nothing drawn.

   DEBRIEF31.cards()  ->  null before any contract has ended, otherwise a copy of
     { ok:true, at:<ms>, header:{ result, obj, title, place, tier, host, minutes, sec, kills, bossKills,
         pay,        // gold the Treasury gained from this contract (ledger total, coin carried home included)
         contractPay,// the contract's listed pay (c.pay)
         treasury,   // Treasury after
         spoils:[],  // F-29 hook
         chronicle:{...}  // ctx for STORY.chronicleLine(ctx): outcome win|loss|withdrew, title, place, host ("the Hollow dead"), dead (mates lost)
         // (spoils hook:: DEBRIEF31.addSpoils({name, kind, value}) during endDeployment, or set later
       },
       cards:[{ id, name, race, spec, leader:bool,
         kills,                       // kills this contract (p.kills at the end minus at startDeployment)
         down:bool,                   // went down at least once
         outcome:'unhurt'|'recovered'|'rests'|'maimed'|'dead',
         injury:null | {id,name,eff}, // the new injury when outcome is 'maimed'
         gains:{ adv, level, ticks, luckBurned },   // Advancements gained, Leader levels gained, Leader XP ticks gained, Luck burned
         moment:'fell'|'killingBlow'|'gotUp'|'mostKills'|'fallback',  // the ONE key for STORY.momentLine(p, {moment, foe, salt})
         moments:[...],               // every key that applies, in priority order
         foe:null | 'Name'            // the named foe, for 'killingBlow'
       }] }

   Moment keys (Narrative's), in priority order: fell (a mate who died: outcome 'dead'), killingBlow (struck the last blow on a named foe: a commander,
   nemesis or rival), gotUp (went down and came home alive), mostKills (most kills of the squad, at least 3, no tie),
   fallback. A dead mate's moment is always 'fell', with the other keys after it in moments[].
   header.chronicle = {outcome:'win'|'loss'|'withdrew', title, place, host, dead} is the ctx for STORY.chronicleLine.

   Wrapped: startDeployment (snapshot after it runs), killEnemy (named kills), endDeployment (compute after it
   runs). Load it LAST among the scripts that wrap endDeployment, so the pay it reads is final.
   No switch (removed in INT-1, 2026-11-15). Delete the file and its tag to record nothing.
   selfTest(): DEBRIEF31.selfTest() -> {ok, fails, info}; it calls the internals directly, so later wrappers
   of startDeployment/endDeployment cannot fool it (see BR2, b141e27).
============================================================================ */
(function(){
'use strict';
const D = window.DEBRIEF31 = {last: null, snap: null, named: [], spoils: []};
const copy = o => JSON.parse(JSON.stringify(o));
const priority = ['fell', 'killingBlow', 'gotUp', 'mostKills', 'fallback'];   /* Narrative's keys (STORY.momentLine, js/campaign/story.js 85p) */

/* ---- internals (also used by the self-test) ---------------------------------------------- */
D._begin = function(g, meta){
  const snap = {leader: null, mates: [], named: [], t0: Date.now()};
  const L = meta.leader;
  if (L) snap.leader = {p: L, kills: L.kills || 0, ticks: L.ticks || 0, level: L.level || 1, burnt: L.burnt || 0, inj: (L.injuries || []).length};
  for (const m of (g.squad || [])){ const p = m.p; snap.mates.push({m, p, id: p.id, kills: p.kills || 0, adv: p.adv || 0, inj: (p.injuries || []).length, resting: p.resting || 0}); }
  D.named = snap.named; D.spoils = []; D.salvage = 0;
  return snap;
};
D._pre = function(g, meta){ return {treasury: meta.treasury, L: meta.leader ? {ticks: meta.leader.ticks || 0, level: meta.leader.level || 1, burnt: meta.leader.burnt || 0, inj: (meta.leader.injuries || []).length} : null}; };
D._build = function(g, meta, snap, pre, injuries){
  const c = g.contract || {}, cards = [], killsOf = [];
  const inj = id => (injuries || []).find(x => x.id === id) || null;
  for (const s of snap.mates){
    const p = s.p, m = s.m, dead = m.state === 'dead', down = !!(g.downedIds && g.downedIds.has(p.id));
    const dk = Math.max(0, (p.kills || 0) - s.kills), newInj = (p.injuries || []).slice(s.inj);
    let outcome = 'unhurt', injury = null;
    if (dead) outcome = 'dead';
    else if (newInj.length){ outcome = 'maimed'; const i = inj(newInj[0]); injury = i ? {id: i.id, name: i.name, eff: i.eff} : {id: newInj[0], name: String(newInj[0]), eff: ''}; }
    else if ((p.resting || 0) > s.resting) outcome = 'rests';
    else if (down) outcome = 'recovered';
    killsOf.push(dk);
    cards.push({id: p.id, name: p.name, race: p.race, spec: p.spec, leader: false, kills: dk, down, outcome, injury,
      gains: {adv: Math.max(0, (p.adv || 0) - s.adv), level: 0, ticks: 0, luckBurned: 0}, moment: 'fallback', moments: [], foe: null});
  }
  const L = snap.leader;
  if (L){
    const p = L.p, dead = g.result === 'fallen' && !!g.leaderSlain || meta.leader == null, newInj = (p.injuries || []).slice(L.inj);
    let outcome = 'unhurt', injury = null;
    if (dead) outcome = 'dead';
    else if (newInj.length){ outcome = 'maimed'; const i = inj(newInj[0]); injury = i ? {id: i.id, name: i.name, eff: i.eff} : {id: newInj[0], name: String(newInj[0]), eff: ''}; }
    else if (g.leaderWasDown) outcome = 'recovered';
    cards.unshift({id: p.id == null ? 'leader' : p.id, name: p.name, race: p.race, spec: p.spec, leader: true, kills: Math.max(0, (p.kills || 0) - L.kills), down: !!(g.leaderWasDown || g.leaderDowns), outcome, injury,
      gains: {adv: 0, level: dead ? 0 : Math.max(0, (p.level || 1) - L.level), ticks: dead ? 0 : (p.level > L.level ? 1 : Math.max(0, (p.ticks || 0) - L.ticks)), luckBurned: Math.max(0, (p.burnt || 0) - L.burnt)},
      moment: 'fallback', moments: [], foe: null});
  }
  // moments
  const maxK = Math.max(0, ...cards.map(x => x.kills)), top = cards.filter(x => x.kills === maxK);
  const blows = {}; for (const n of snap.named) if (n.pid != null && !blows[n.pid]) blows[n.pid] = n.foe;
  for (const k of cards){
    const ms = [];
    if (k.outcome === 'dead') ms.push('fell');
    if (blows[k.id] != null || (k.leader && blows.leader != null)){ ms.push('killingBlow'); k.foe = blows[k.id] != null ? blows[k.id] : blows.leader; }
    if (k.down && k.outcome !== 'dead') ms.push('gotUp');
    if (maxK >= 3 && top.length === 1 && top[0] === k) ms.push('mostKills');
    ms.push('fallback');
    k.moments = priority.filter(x => ms.includes(x)); k.moment = k.moments[0];
  }
  const t1 = meta.treasury, deadN = cards.filter(x => x.outcome === 'dead').length;
  const hostName = (() => { try { const H = HOSTS[c.host]; return H ? (H.the || H.name) : (c.host || ''); } catch (e) { return c.host || ''; } })();
  const titleOf = (() => { if (c.title) return c.title; try { return CONTRACTS[c.obj].name; } catch (e) { return c.obj || ''; } })();
  const chronicle = {outcome: D._outcome(g), title: titleOf, place: c.place || '', host: hostName, dead: deadN};
  return {ok: true, at: Date.now(), header: {result: g.result || null, obj: c.obj || null, title: c.title || null, place: c.place || null, tier: c.tier || null, host: c.host || null,
    minutes: c.minutes || 0, sec: g.sec || 0, kills: g.kills || 0, bossKills: g.bossKills || 0, pay: t1 - pre.treasury + (g.tithe2j || 0) + (g.ransom2j || 0), tithe2j: g.tithe2j || 0, ransom2j: g.ransom2j || 0, contractPay: c.pay || 0, treasury: t1, spoils: D.spoils.slice(), tithe: g.tithe || 0, salvage: D.salvage || 0, chronicle}, cards};
};
/* F-29 hook: call during a contract's end (or before cards() is read) to add spoils to the header */
/* How a contract ended, for STORY.chronicleLine. 'fled' covers two cases (index.html ~9646): a lost objective
   (contractFail sets G.failHead, e.g. "THE GATE IS DOWN", the story assault lost) is a loss; a company that pulled out
   with no failHead and a living Leader is a withdrawal. */
D._outcome = function(g){
  const r = g.result;
  if (r === 'victory') return 'win';
  if (r === 'withdrawn') return 'withdrew';
  if (r === 'fled') return (g.failHead || g.leaderSlain) ? 'loss' : 'withdrew';
  return 'loss';
};
D.addSpoils = function(item){ D.spoils.push(copy(item)); if (!D.snap && D.last) D.last.header.spoils = D.spoils.slice(); };   // while a contract is ending (snap set) only the list grows; cards are built after it
/* Detailed Salvage (index.html detailedSalvage) runs inside endDeployment, after the Quick Salvage and the Masters' Tithe, and
   changes the Treasury again; the header is read after all of that, so header.treasury is the FINAL figure and header.pay is the Treasury difference less the 2j temple tithe and ransom (named on their own, header.tithe2j and ransom2j).
   The log's "Treasury now N" line (sinks.js) is printed mid-way and is stale after the salvage swap. Salvage is recorded here as spoils. */
if (typeof detailedSalvage === 'function'){ const f = detailedSalvage;
  detailedSalvage = function(c, lines){
    const t0 = (META && META.treasury) || 0, m0 = ((META && META.munitions) || []).slice(), tr0 = ((META && META.trophies) || []).length;
    const n0 = Array.isArray(lines) ? lines.length : 0;
    const r = f.apply(this, arguments);
    try {   // the log's "Now N" / "Treasury now N" figures were printed before the Quick Salvage swap: bring them to the final Treasury
      const L = typeof renderDebrief !== 'undefined' && renderDebrief.last && renderDebrief.last.lines;
      if (L) for (let i = 0; i < L.length; i++) L[i] = String(L[i]).replace(/(Now|Treasury now) -?\d+gp/, '$1 ' + META.treasury + 'gp');
    } catch (e) {}
    try {
      if (D.snap){
        const gold = (META.treasury || 0) - t0; D.salvage = gold;
        if (gold) D.addSpoils({name: 'Detailed Salvage', kind: 'coin', value: gold});
        const m1 = (META.munitions || []).slice(); for (let i = m0.length; i < m1.length; i++) D.addSpoils({name: String(m1[i]), kind: 'munition', value: 0});
        const tr = (META.trophies || []).slice(tr0); for (const t of tr) D.addSpoils({name: t.name || 'A curiosity', kind: t.legend ? 'legend' : 'curiosity', value: 0});
        const txt = Array.isArray(lines) ? lines.slice(n0).join(' ') : '';
        const re = /Fine gear:<\/b> the enemy's own ([^<]+?), now in/g; let mm; while ((mm = re.exec(txt))) D.addSpoils({name: mm[1], kind: 'gear', value: 0});
      }
    } catch (e) { console.warn('DEBRIEF31 salvage', e); }
    return r;
  };
}
D.cards = function(){ return D.last ? copy(D.last) : null; };

/* ---- wrappers ------------------------------------------------------------------------------ */
if (typeof startDeployment === 'function'){ const f = startDeployment;
  startDeployment = function(){
    const r = f.apply(this, arguments);
    try { if (typeof G !== 'undefined' && G && typeof META !== 'undefined' && META) D.snap = D._begin(G, META); } catch (e) { console.warn('DEBRIEF31 begin', e); }
    return r;
  };
}
if (typeof killEnemy === 'function'){ const f = killEnemy;
  killEnemy = function(e){
    const was = e && e.dead, by = e && e.lastBy;
    const r = f.apply(this, arguments);
    try {
      if (D.snap && e && !was && e.dead && e.name && by){
        const p = by.p; let pid = null;
        if (p && typeof META !== 'undefined' && META && p === META.leader) pid = 'leader';
        else if (p) pid = p.id;
        if (pid != null && (typeof BESTIARY === 'undefined' || (BESTIARY[e.k] && (BESTIARY[e.k].boss || e.nemesis || e.rivalId)))) D.snap.named.push({pid, foe: e.name});
      }
    } catch (err) {}
    return r;
  };
}
if (typeof endDeployment === 'function'){ const f = endDeployment;
  endDeployment = function(){
    const live = D.snap && typeof G !== 'undefined' && G && !G.over;
    let pre = null; try { if (live) pre = D._pre(G, META); } catch (e) {}
    const r = f.apply(this, arguments);
    try {   // everything has run (pay, tithe, salvage): make every "Now N" / "Treasury now N" in the log the final Treasury
      const L = live && typeof renderDebrief !== 'undefined' && renderDebrief.last && renderDebrief.last.lines;
      if (L) for (let i = 0; i < L.length; i++) L[i] = String(L[i]).replace(/(Now|Treasury now) -?\d+gp/, '$1 ' + META.treasury + 'gp');
    } catch (e) {}
    try { if (live && pre){ D.last = D._build(G, META, D.snap, pre, typeof INJURIES !== 'undefined' ? INJURIES : []); D.snap = null; } } catch (e) { console.warn('DEBRIEF31 build', e); }
    return r;
  };
}

/* ---- self-test: calls the internals with a made-up game, so later wrappers cannot change the result ----- */
D.selfTest = function(){
  const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
  const keepState = {spoils: D.spoils, named: D.named, salvage: D.salvage, snap: D.snap, last: D.last};   // the test must not disturb a contract in progress or the last card set
  try {
    const P = (id, kills, adv) => ({id, name: 'M' + id, race: 'HUMAN', spec: 'SOLDIER', kills, adv, injuries: [], resting: 0});
    const a = P(1, 10, 0), b = P(2, 5, 1), c = P(3, 0, 0), d = P(4, 7, 2), L = {id: 99, name: 'Lead', race: 'HUMAN', spec: 'SOLDIER', kills: 20, ticks: 1, level: 3, burnt: 0, injuries: []};
    const meta = {treasury: 100, leader: L};
    const g = {squad: [{p: a, state: 'up'}, {p: b, state: 'up'}, {p: c, state: 'up'}, {p: d, state: 'up'}], downedIds: new Set(), contract: {obj: 'hunt', tier: 1, place: 'Hask', host: 'bandits', pay: 280}, sec: 90, kills: 12, bossKills: 1, result: 'victory'};
    const snap = D._begin(g, meta), pre = D._pre(g, meta);
    // play: a kills 6 (most), b goes down and is maimed, c dies, d strikes the killing blow on a named foe, the Leader gets a tick and burns Luck
    a.kills += 6; b.kills += 1; d.kills += 2; L.kills += 2; L.ticks = 2; L.burnt = 1;
    g.downedIds.add(2); g.downedIds.add(3); g.squad[2].state = 'dead'; b.injuries.push('lame'); snap.named.push({pid: 4, foe: 'Captain Vane'});
    meta.treasury = 460;
    const out = D._build(g, meta, snap, pre, [{id: 'lame', name: 'Lame', eff: 'Move -1'}]);
    const by = id => out.cards.find(x => x.id === id);
    ok(out.cards.length === 5 && out.cards[0].leader, 'one card per deployed mate plus the Leader first: ' + out.cards.length);
    ok(by(1).kills === 6 && by(2).kills === 1 && by(3).kills === 0 && by(4).kills === 2, 'kills are the difference from the start');
    ok(by(1).moment === 'mostKills' && by(1).moments.join() === 'mostKills,fallback', 'most kills: ' + by(1).moments);
    ok(by(2).outcome === 'maimed' && by(2).injury && by(2).injury.name === 'Lame' && by(2).down && by(2).moment === 'gotUp', 'maimed and got up: ' + JSON.stringify([by(2).outcome, by(2).moment]));
    ok(by(3).outcome === 'dead' && by(3).moment === 'fell' && by(3).moments.join() === 'fell,fallback' && out.header.chronicle.dead === 1, 'the fallen, counted in the chronicle ctx');
    ok(by(4).moment === 'killingBlow' && by(4).foe === 'Captain Vane', 'killing blow on a named foe');
    ok(out.cards[0].gains.luckBurned === 1 && out.cards[0].gains.ticks === 1 && out.cards[0].kills === 2, 'Leader gains: ' + JSON.stringify(out.cards[0].gains));
    ok(out.header.pay === 360 && out.header.contractPay === 280 && Array.isArray(out.header.spoils) && out.header.result === 'victory', 'header pay is the Treasury difference (no catch charged here)');
    ok(JSON.stringify(out).indexOf('<') < 0, 'plain data, no markup');
    ok(D._outcome({result: 'fled', failHead: 'THE GATE IS DOWN'}) === 'loss' && D._outcome({result: 'fled'}) === 'withdrew' && D._outcome({result: 'withdrawn'}) === 'withdrew' && D._outcome({result: 'fallen'}) === 'loss' && D._outcome({result: 'victory'}) === 'win' && D._outcome({result: 'fled', leaderSlain: true}) === 'loss', 'a lost story assault (fled with a failHead) is a loss, a plain retreat a withdrawal');
    { const g2 = Object.assign({}, g, {result: 'fled', failHead: 'THE GATE IS DOWN'}), o2 = D._build(g2, meta, snap, pre, []); ok(o2.header.chronicle.outcome === 'loss', 'chronicle outcome for a lost assault: ' + o2.header.chronicle.outcome); }
    ok(out.header.chronicle.outcome === 'win' && out.header.chronicle.place === 'Hask' && typeof out.header.chronicle.title === 'string' && typeof out.header.chronicle.host === 'string', 'chronicle ctx: ' + JSON.stringify(out.header.chronicle));
    if (window.STORY && STORY.momentLine){ const fb = new Set(); for (let i = 0; i < 12; i++) fb.add(STORY.momentLine(by(3), {moment: 'fallback', salt: i})); let bad = 0; for (let i = 0; i < 12; i++) if (fb.has(STORY.momentLine(by(3), {moment: by(3).moment, salt: i}))) bad++; ok(bad === 0, 'a dead cards momentLine is not a fallback line (' + bad + ' of 12 clash)'); }
    ok(out.header.tithe === 0 && out.header.salvage === 0, 'header carries tithe and salvage (0 here)');
    const keep = D.last; D.snap = null; D.spoils = []; D.last = out; D.addSpoils({name: 'Iron helm', kind: 'gear', value: 40}); const sp = D.cards().header.spoils; D.last = keep;
    ok(sp.length === 1 && sp[0].name === 'Iron helm', 'spoils hook');
    D.last = null; ok(D.cards() === null, 'cards() is null with nothing recorded'); D.last = keep;
  } catch (e) { fails.push('error ' + e.message); }
  finally { D.spoils = keepState.spoils; D.named = keepState.named; D.salvage = keepState.salvage; D.snap = keepState.snap; D.last = keepState.last; }
  return {ok: fails.length === 0, fails, info: fails.length ? fails.join('; ') : 'cards, moments, gains, pay header, spoils hook'};
};
})();
