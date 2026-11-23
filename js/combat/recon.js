/* ============================================================================
   INDEX RECON1 - Deep Reconnaissance gives the scouts' count before the march
   (Patrick, bible 2026-11-14: "when picked it shows the enemy count, the
   anomaly/creature count and similar intel before the contract starts";
   answers the F-39 card-hint question).
   The War Council sits in the briefing (BR2, js/ui/briefing-council.js) while the
   field is already built behind it, so the count is read from the real field:
   - enemies on the map by kind, named commanders and a nemesis;
   - the hidden Blip Tokens, rolled face up now (ambushes, sniper nests, pit
     traps, decoys), and the enemies they hide; the same rolls stand in the field;
   - the F-39 creature event, if one is rolled and not excluded (EVT39);
   - enemy traps, strongboxes/caches and captives; waves on Hold the Redoubt.
   Bug fixed with it: since F-26 moved the Edge pick after the field is built,
   recon no longer showed the enemy traps (placeTraps reads c.edges at the
   start). The Edge now marks them seen when it applies.
   Wrapper only (BRIEFING.wc.html and .apply); nothing in index.html is edited.
   INT-1 group 11: no switch.
============================================================================ */
(function(){
  'use strict';
  const B = window.BRIEFING, W = B && B.wc; if (!W) return;
  const R = window.RECON1 = {};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const SHAPE = {A: 'it will come at you mid-fight', B: 'a meeting; yours to take or refuse', C: 'a site held by sleeping guards'};

  // The Blip Tokens are rolled once, now; the field keeps the same faces (W.apply below keeps them).
  R.rollBlips = function(g, d6){
    d6 = d6 || gl('d6'); if (!g || typeof d6 !== 'function') return;
    for (const b of (g.blips || [])) if (!b.revealed && !b.known) b.known = d6();
  };

  R.intel = function(c, g){
    g = g || gl('G'); if (!c || !g) return null;
    const BEST = gl('BESTIARY') || {}, kinds = {}, bosses = [];
    let foes = 0, nem = null;
    for (const e of (g.enemies || [])){
      if (!e || e.dead || e.left) continue;
      foes++; const nm = (BEST[e.k] && BEST[e.k].name) || e.k; kinds[nm] = (kinds[nm] || 0) + 1;
      if (BEST[e.k] && BEST[e.k].boss) bosses.push(e.name || nm);
      if (e.nemesis) nem = e.name || nm;
    }
    const posts = {ambush: 0, sniper: 0, pit: 0, decoy: 0};
    for (const b of (g.blips || [])){
      if (b.revealed) continue; const r = b.known;
      if (!r) continue;
      if (r <= 2) posts.decoy++; else if (r <= 4) posts.sniper++; else if (r === 5) posts.pit++; else posts.ambush++;
    }
    const hidden = posts.ambush * 4 + posts.sniper * 3;
    const traps = (g.traps || []).filter(t => t.enemy && t.armed).length;
    const caches = (g.caches || []).filter(x => !x.opened && x.kind !== 'captive' && x.kind !== 'poultice').length;
    const captives = (g.cages || []).filter(x => !x.open && !x.freed).length;
    let creature = null;
    try {
      const EV = window.EVT39, M = gl('META');
      if (EV && c.event && EV.CREATURES[c.event.id] && !(EV.excluded && EV.excluded(c, M))){
        const k = EV.CREATURES[c.event.id];
        creature = {name: k.name, shape: k.shape, hint: (k.hint || '').replace(/^Scouts report /, '')};
      }
    } catch (e) {}
    return {foes, kinds: Object.entries(kinds).sort((a, b) => b[1] - a[1]), bosses, nem, posts, hidden, traps, caches, captives,
            creature, waves: c.obj === 'hold' || c.obj === 'defend' || c.obj === 'beacons'};
  };

  R.html = function(c, g){
    const I = R.intel(c, g); if (!I) return '';
    const li = [];
    const top = I.kinds.slice(0, 4).map(([n, k]) => `${k} ${E(n)}`).join(', ') + (I.kinds.length > 4 ? ', and others' : '');
    li.push(`<b>Enemies on the ground: ${I.foes}</b>${I.foes ? ' (' + top + ')' : ''}.` + (I.waves ? ' More will come in waves.' : ''));
    if (I.bosses.length) li.push(`<b>Commanders:</b> ${E(I.bosses.join(', '))}.` + (I.nem ? ` ${E(I.nem)} is your nemesis.` : ''));
    const p = I.posts, parts = [];
    if (p.ambush) parts.push(plural(p.ambush, 'ambush', 'ambushes'));
    if (p.sniper) parts.push(plural(p.sniper, 'sniper nest'));
    if (p.pit) parts.push(plural(p.pit, 'pit trap'));
    if (p.decoy) parts.push(plural(p.decoy, 'decoy'));
    if (parts.length) li.push(`<b>Hidden posts:</b> ${parts.join(', ')}` + (I.hidden ? `, hiding about ${I.hidden} more.` : '.'));
    li.push(I.creature ? `<b>Creatures: 1.</b> ${E(I.creature.name)}: ${E(I.creature.hint)} (${SHAPE[I.creature.shape] || 'out there somewhere'})` : '<b>Creatures: none</b> seen on this ground.');
    const ex = [];
    if (I.traps) ex.push(plural(I.traps, 'enemy trap'));
    if (I.captives) ex.push(plural(I.captives, 'captive'));
    if (I.caches) ex.push(plural(I.caches, 'cache', 'caches') + ' to loot');
    if (ex.length) li.push(`<b>Also:</b> ${ex.join(', ')}. All marked on the map.`);
    return `<div class="recon1" style="margin-top:8px;padding:8px 10px;background:#e8efe2;border:2px solid #4a6a3a;border-radius:5px;font-size:14px;line-height:1.45">
      <div style="font:bold 14px Georgia;color:#2a4a1a;margin-bottom:3px">The scouts' count</div>${li.map(x => `<div>${x}</div>`).join('')}</div>`;
  };

  const hasRecon = c => !!(c && (c.edges || []).includes('recon'));
  { const f = W.html;
    W.html = function(c){
      let h = f.apply(this, arguments);
      try {
        const g = gl('G');
        if (hasRecon(c) && g && g.contract === c){ R.rollBlips(g); h += R.html(c, g); }
      } catch (e) { console.warn('RECON1: ', e); }
      return h;
    };
  }
  { const f = W.apply;
    W.apply = function(c, g, fx){
      g = g || gl('G');
      const keep = (g && g.blips) ? g.blips.map(b => b.known) : null;
      const out = f.call(this, c, g, fx);
      try {
        if (g && out.includes('recon')){
          if (keep) g.blips.forEach((b, i) => { if (keep[i]) b.known = keep[i]; });
          for (const t of (g.traps || [])) if (t.enemy) t.seen = true;
        }
      } catch (e) { console.warn('RECON1 apply: ', e); }
      return out;
    };
  }

  // Edge text says what it now buys.
  const EDG = gl('EDGES'), rec = EDG && EDG.find(e => e.id === 'recon'), text0 = rec && rec.text;
  if (rec && text0.indexOf('scouts give their count') < 0) rec.text = text0 + ' The scouts give their count before you march.';

  R.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i || ''});
    try {
      const BEST = gl('BESTIARY'), boss = Object.keys(BEST).find(k => BEST[k].boss) || 'brigand';
      let n = 0; const d6 = () => [6, 3, 5, 1][n++ % 4];
      const g = {contract: null, enemies: [{k: 'brigand'}, {k: 'brigand'}, {k: 'crossbow'}, {k: boss, name: 'Test Chief'}, {k: 'brigand', dead: true}],
                 blips: [{}, {}, {}, {}, {revealed: true}], traps: [{enemy: true, armed: true, seen: false}, {enemy: false, armed: true, seen: true}],
                 caches: [{kind: 'purse'}, {kind: 'captive'}, {kind: 'gem', opened: true}], cages: [{}, {open: true}]};
      const c = {obj: 'hunt', edges: ['recon']}; g.contract = c;
      R.rollBlips(g, d6);
      ok('blips rolled face up, revealed ones left', g.blips.slice(0, 4).map(b => b.known).join() === '6,3,5,1' && !g.blips[4].known);
      const I = R.intel(c, g);
      ok('enemy count skips the dead', I.foes === 4, I.foes);
      ok('commander named', I.bosses.includes('Test Chief'), I.bosses.join());
      ok('posts counted', I.posts.ambush === 1 && I.posts.sniper === 1 && I.posts.pit === 1 && I.posts.decoy === 1 && I.hidden === 7, JSON.stringify(I.posts));
      ok('traps, caches, captives', I.traps === 1 && I.caches === 1 && I.captives === 1, [I.traps, I.caches, I.captives].join());
      const h = R.html(c, g);
      ok('block says the count', h.indexOf('Enemies on the ground: 4') >= 0 && h.indexOf('1 ambush') >= 0 && h.indexOf('Creatures') >= 0);
      ok('hold says waves', R.intel({obj: 'hold', edges: ['recon']}, g).waves);
      // apply keeps the faces and marks the traps
      const fx = {reveal: () => {}, d6: () => 2, ward: () => {}};
      W.apply(c, g, fx);
      ok('apply keeps the briefing faces', g.blips.slice(0, 4).map(b => b.known).join() === '6,3,5,1', g.blips.map(b => b.known).join());
      ok('apply marks enemy traps seen', g.traps[0].seen === true);
      // no recon, no block
      const c2 = {obj: 'hunt', edges: [], council: [{}], picks: 0}; g.contract = c2;
      ok('no block without the Edge', W.html(c2).indexOf('recon1') < 0);
      // creature line from EVT39
      if (window.EVT39 && EVT39.CREATURES.roadOgre){
        const c3 = {obj: 'escort', edges: ['recon'], event: {id: 'roadOgre', shape: 'A'}};
        const ex0 = EVT39.excluded; EVT39.excluded = () => false;
        try { const I3 = R.intel(c3, g); ok('creature named from EVT39', I3.creature && I3.creature.name === 'Road Ogre', I3.creature && I3.creature.name); }
        finally { EVT39.excluded = ex0; }
      }
      ok('Edge text extended', !rec || rec.text.indexOf('scouts give their count') >= 0);
    } catch (e) { ok('no throw', false, e.message); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
