/* INDEX TR28: F-28 terrain, elevation and range match the tabletop (Players Manual Tables 6.1, 6.4, 15.3; audits/terrain-f28.md).
   - Cover counts against ranged attacks only. The squad already had no cover in melee; walls, palisades and the laager's wagons now
     count in melee too, as the tabletop says ("low walls, wagons and barricades").
   - Higher ground: the attacker is on high ground and the target is not. Both sides, melee and ranged, +1 step. Replaces the old
     "+1 for the squad on any hill" in stepBonus. TERRAIN.high(u) is the one elevation test; F-30 adds wall walks and towers with
     TERRAIN.highs.push(u => ...).
   - Range bands: past the normal band a shot takes -1 step. Squad weapons from the table; enemy shooters max(4 hexes, 60% of range).
   - Fog and night: a ranged attack beyond 3 hexes takes -1 step, both sides. The old fog ward (enemy shots -1 at any range under
     G.fogT) is trimmed to this rule (Patrick 2026-11-14). Enemy spells and
     blasts have no range, so in fog they no longer take a step.
     Split (Patrick 2026-11-14): bought fog (the Council's Approach, the Frost-Vault alliance) also sets G.fogWard. While that
     runs, enemies pay the old flat ward instead (shots and spells, any range) and the squad still takes the beyond-3-hex step.
     Night, weather and contract fog keep the tabletop rule.
   - Hill rims (lit north and west, shaded south and east) and modifier chips over the shooter ("HIGH +1", "LONG -1", "DARK -1").
   No switch (TERRAIN.on, chips, rims, wallMelee and fogTrim were removed in INT-1, 2026-11-15). */
(function(){
  if (typeof strike !== 'function' || typeof stepBonus !== 'function' || typeof cellAt !== 'function' || typeof T === 'undefined') return;
  const HX = typeof HEX_PX !== 'undefined' ? HEX_PX : 39;
  const TR = window.TERRAIN = {v: 1, hx: HX,
    fogPx: 3 * HX,                                                                   // fog and night: beyond 3 hexes
    band: {shortbows: 4 * HX, longbows: 6 * HX, crossbows: 5 * HX, arbalest: 8 * HX}, // last hex of the normal band, in px
    highs: [],                                                                       // F-30: more high ground, f(u) -> bool
    lift: 'rgba(255,240,200,0.07)', lit: 'rgba(255,236,190,0.30)', shade: 'rgba(0,0,0,0.42)',   // hill rim paint
    seen: new WeakMap()};

  /* ---- the rules (pure; the wrappers below only feed them) ---- */
  TR.high = u => { if (!u) return false; try { if (cellAt(u.x, u.y) === T.HILL) return true; for (const f of TR.highs) if (f(u)) return true; } catch (e) {} return false; };
  TR.higher = (a, b) => TR.high(a) && !TR.high(b);
  TR.dark = () => !!(G && (G.fogT > 0 || G.nightTint));
  TR.flatWard = () => !!(G && G.fogT > 0 && G.fogWard > 0);   // enemies pay the old flat fog ward
  TR.squadBand = () => { const id = G && G.ranged && G.ranged.id; return TR.band[id] || 0; };
  TR.enemyBand = e => { const B = e && typeof BESTIARY !== 'undefined' && BESTIARY[e.k]; return B && B.rng ? Math.max(4 * HX, Math.round(B.rng * 0.6)) : 4 * HX; };
  // a ranged attack: {s: total step, tags: [...]}; enemy = true for enemy shooters
  TR.ranged = (a, t, band, enemy) => {
    const out = {s: 0, tags: []}; if (!a || !t) return out;
    const d = Math.hypot(t.x - a.x, t.y - a.y);
    if (TR.higher(a, t)){ out.s += 1; out.tags.push('high'); }
    if (band && d > band){ out.s -= 1; out.tags.push('long'); }
    if (TR.dark() && d > TR.fogPx && !(enemy && TR.flatWard())){ out.s -= 1; out.tags.push('dark'); }
    return out; };
  TR.melee = (a, t) => { const out = {s: 0, tags: []}; if (TR.higher(a, t)){ out.s = 1; out.tags.push('high'); } return out; };
  TR.eMelee = (e, v) => TR.melee(e, v).s;   // index.html enemy contact attack: + TERRAIN.eMelee(e, v)
  // hard cover in melee: a wall or palisade next to the defender (siege), or inside the laager's wagon ring (the Long Road)
  TR.meleeCover = v => {
    if (!G || !v) return 0;
    try {
      if (G.obj === 'siege' && MAP){ const cx = Math.floor(v.x / CELL), cy = Math.floor(v.y / CELL);
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++){ const t = MAP.g[(cy + oy) * MAP.w + cx + ox]; if (t === T.PALISADE || t === T.WALL) return 1; } }
      if (G.obj === 'night' && G.column && G.contract && G.contract.formation === 'laager' && Math.hypot(v.x - G.column.x, v.y - G.column.y) < 6.5 * CELL) return 1;
    } catch (e) {}
    return 0; };

  /* ---- chips: a short label over the attacker, at most one per unit per 1.5 s; the first of each kind also goes to the log ---- */
  const TXT = {high: ['HIGH GROUND +1', '#e8d27a'], long: ['LONG RANGE -1', '#c8b8a0'], dark: ['DARK -1', '#a8b8d8']};
  const LOG = {high: 'Higher ground: +1 step to attacks from a hill at a target below (both sides).',
               long: 'Long range: -1 step past the weapon\'s normal band.',
               dark: 'Fog and night: -1 step to shots beyond 3 hexes.'};
  TR.chip = (a, m, enemy) => {
    if (m && m.tags && m.tags.includes('long') && window.T45 && T45.holdLong && T45.holdLong()) m = Object.assign({}, m, {tags: m.tags.filter(k => k !== 'long')});   // s6-1i: no range-band chip or log line on the road, lessons on
    if (!m || !m.tags.length || !G || !G.fx || typeof pop !== 'function') return;
    try {
      const f = G.frame || 0, last = TR.seen.get(a);
      if (last == null || f - last >= 90 || f < last){ TR.seen.set(a, f);
        const t = m.tags[0], s = m.tags.map(k => TXT[k][0]).join('  ');
        const P = TR._pops = (TR._pops || []).filter(q => f - q.f < 90 && f >= q.f);   // one chip per label within 130px each 1.5 s (a wall of archers printed it three times over each other)
        if (!P.some(q => q.s === s && Math.hypot(q.x - a.x, q.y - a.y) < 130)){ P.push({f, s, x: a.x, y: a.y}); pop(a.x, a.y - (enemy ? 34 : 40), s, TXT[t][1]); } }
      G._tr28 = G._tr28 || {};
      for (const k of m.tags) if (!G._tr28[k]){ G._tr28[k] = 1; if (typeof note === 'function') note(LOG[k]); }
    } catch (e) {} };

  /* ---- wrappers ---- */
  const fStep = stepBonus;
  stepBonus = function(u, isMelee){ let s = fStep(u, isMelee); if (u && cellAt(u.x, u.y) === T.HILL) s -= 1; return s; };   // the old flat hill bonus out; strike adds higher ground
  TR._fStep = fStep;

  const fStrike = strike;
  strike = function(e, skill, baseDmg, o){
    o = o || {};
    try { if (G && e && !e.dead && !o.piercing){ const a = o.by || o.from;
      if (a && typeof a.x === 'number'){ const m = o.ranged ? TR.ranged(a, e, o.by ? TR.squadBand() : TR.band.arbalest) : TR.melee(a, e);
        if (m.s) skill += m.s; TR.chip(a, m); } } } catch (err) {}
    return fStrike.call(this, e, skill, baseDmg, o); };

  if (typeof enemyFire === 'function'){
    const fFire = enemyFire;
    enemyFire = function(e, tgt){ const n0 = G && G.eshots ? G.eshots.length : 0; const r = fFire.apply(this, arguments);
      try { if (G && G.eshots) for (let i = n0; i < G.eshots.length; i++){ const s = G.eshots[i]; if (s.kind === 'bolt' && !s.src){ s.src = e; s.ox = e.x; s.oy = e.y; } } } catch (err) {}
      return r; };
  }
  if (typeof enemyHitsUnit === 'function'){
    const fHit = enemyHitsUnit;
    enemyHitsUnit = function(v, skill, dmgDie, opts){
      try { if (G && G.fogT > 0 && !TR.flatWard()) skill += 1; } catch (err) {}   // cancel enemyHitsUnit's flat fog -1 unless the fog was bought (G.fogWard); the range rule below is the fog then
      try { if (opts && opts.src && opts.kind === 'bolt'){ const a = {x: opts.ox, y: opts.oy}, m = TR.ranged(a, v, TR.enemyBand(opts.src), true);
        if (m.s){ skill += m.s; TR.chip(opts.src, m, true); } } } catch (err) {}
      return fHit.call(this, v, skill, dmgDie, opts); };
  }

  /* ---- hill rims: lit north and west, shaded south and east, so a hill reads as height ---- */
  if (typeof drawTerrain === 'function'){
    const fTer = drawTerrain;
    drawTerrain = function(cx, cy){
      const r = fTer.apply(this, arguments);
      try { if (G && G.leader && MAP && MAP.g) TR.drawRims(cx, cy); } catch (err) {}
      return r; };
  }
  /* F-44 (d) (LP, 2026-11-15): Patrick's "red blocks at the bottom of the screen" on the escort were these rims: hard 4-6 px lines and a
     flat lighter square on every hill cell, so a small hill at the screen edge read as outlined blocks on the hill's red earth. The rims
     are now soft bands that fade inward (pre-drawn strips), with no square fill, and a hill of fewer than TR.rimMin cells gets none
     (the ground painting already lights its edges). ROLLBACK: TERRAIN.rimSoft = false (the old hard rims). */
  TR.rimSoft = true; TR.rimMin = 4; TR.rimW = 12; TR.rimLitA = 0.20; TR.rimShadeA = 0.34;
  let rimStrips = null, rimSize = null;
  function strips(){
    const key = CELL + '|' + TR.rimW + '|' + TR.rimLitA + '|' + TR.rimShadeA;
    if (rimStrips && rimStrips.key === key) return rimStrips;
    const mk = (w, h, x1, y1, x2, y2, rgb, a) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), gr = g.createLinearGradient(x1, y1, x2, y2);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); return c; };
    const W = TR.rimW, lit = '255,236,190', sh = '0,0,0';
    rimStrips = {key, n: mk(CELL, W, 0, 0, 0, W, lit, TR.rimLitA), w: mk(W, CELL, 0, 0, W, 0, lit, TR.rimLitA), s: mk(CELL, W, 0, W, 0, 0, sh, TR.rimShadeA), e: mk(W, CELL, W, 0, 0, 0, sh, TR.rimShadeA)};
    return rimStrips; }
  function hillSizes(){   // cells in each connected hill, cached per map
    if (rimSize && rimSize.g === MAP.g) return rimSize.n;
    const g = MAP.g, w = MAP.w, h = MAP.h, H = T.HILL, n = new Uint16Array(w * h), seen = new Uint8Array(w * h), st = [];
    for (let i = 0; i < g.length; i++){ if (g[i] !== H || seen[i]) continue; const cells = [i]; seen[i] = 1; st.push(i);
      while (st.length){ const c = st.pop(), x = c % w, y = (c / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (g[j] === H && !seen[j]){ seen[j] = 1; st.push(j); cells.push(j); } } }
      const k = Math.min(65535, cells.length); for (const c of cells) n[c] = k; }
    rimSize = {g, n}; return n; }
  TR.drawRimsSoft = function(cx, cy){
    const g = MAP.g, w = MAP.w, h = MAP.h, H = T.HILL, S = strips(), N = hillSizes(), W = TR.rimW;
    const x0 = Math.max(0, Math.floor(cx / CELL) - 1), x1 = Math.min(w - 1, Math.floor((cx + VW) / CELL) + 1);
    const y0 = Math.max(0, Math.floor(cy / CELL) - 1), y1 = Math.min(h - 1, Math.floor((cy + VH) / CELL) + 1);
    const hill = (x, y) => x >= 0 && y >= 0 && x < w && y < h && g[y * w + x] === H;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
      const i = y * w + x; if (g[i] !== H || N[i] < TR.rimMin) continue;
      const px = x * CELL, py = y * CELL;
      if (!hill(x, y - 1)) ctx.drawImage(S.n, px, py);
      if (!hill(x - 1, y)) ctx.drawImage(S.w, px, py);
      if (!hill(x + 1, y)) ctx.drawImage(S.e, px + CELL - W, py);
      if (!hill(x, y + 1)) ctx.drawImage(S.s, px, py + CELL - W);
    } };
  TR.drawRims = function(cx, cy){
    if (TR.rimSoft) return TR.drawRimsSoft(cx, cy);
    const g = MAP.g, w = MAP.w, h = MAP.h, H = T.HILL;
    const x0 = Math.max(0, Math.floor(cx / CELL) - 1), x1 = Math.min(w - 1, Math.floor((cx + VW) / CELL) + 1);
    const y0 = Math.max(0, Math.floor(cy / CELL) - 1), y1 = Math.min(h - 1, Math.floor((cy + VH) / CELL) + 1);
    const hill = (x, y) => x >= 0 && y >= 0 && x < w && y < h && g[y * w + x] === H;
    ctx.save();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
      if (g[y * w + x] !== H) continue;
      const px = x * CELL, py = y * CELL;
      ctx.fillStyle = TR.lift; ctx.fillRect(px, py, CELL, CELL);                      // the whole hill a shade lighter than the flat
      ctx.fillStyle = TR.lit;
      if (!hill(x, y - 1)) ctx.fillRect(px, py, CELL, 4);
      if (!hill(x - 1, y)) ctx.fillRect(px, py, 4, CELL);
      ctx.fillStyle = TR.shade;
      if (!hill(x + 1, y)) ctx.fillRect(px + CELL - 6, py, 6, CELL);
      if (!hill(x, y + 1)) ctx.fillRect(px, py + CELL - 5, CELL, 5);
    }
    ctx.restore(); };

  /* ---- self-test: one row per rule (REG addons gate) ---- */
  TR.selfTest = function(){
    let n = 0; const fails = [], ok = (c, m) => { n++; if (!c) fails.push(m); };
    const G0 = G, M0 = MAP, pops0 = TR._pops; TR._pops = [];   // chip pops from an earlier run made the chips row red
    try {
      const W = 12, Hh = 12, grid = new Array(W * Hh).fill(T.GRASS);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) grid[y * W + x] = T.HILL;   // hill in the top-left 4x4 cells
      grid[6 * W + 6] = T.FOREST;
      MAP = {w: W, h: Hh, g: grid};
      const at = (cx, cy) => ({x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2});
      const hillA = at(1, 1), hillB = at(2, 2), flat = at(8, 8), forest = at(6, 6);
      G = {frame: 0, fx: [], msgs: [], fogT: 0, nightTint: false, ranged: {id: 'shortbows'}, eshots: [], mod: {vanguard: 0}, squad: []};
      // 1. cover is for ranged attacks: the squad in forest gets no melee cover; walls and wagons do
      ok(TR.meleeCover(forest) === 0, 'cover: a mate in forest has no melee cover');
      G.obj = 'night'; G.column = {x: flat.x, y: flat.y}; G.contract = {formation: 'laager'};
      ok(TR.meleeCover(at(9, 8)) === 1 && TR.meleeCover(at(0, 11)) === 0, 'cover: inside the laager wagon ring counts in melee, outside does not');
      G.obj = null; G.column = null; G.contract = null;
      ok([...document.scripts].some(sc => { let x = sc.text;   /* INT-1 step 2: strike() now lives in js/combat/deployment.js, so read the file */
        if (!x && /\/js\/combat\//.test(sc.src)) { try { const r = new XMLHttpRequest(); r.open('GET', sc.src, false); r.send(); x = r.responseText; } catch (e) {} }
        return x && x.indexOf('const cover = o.ranged && (cellAt(e.x, e.y) === T.FOREST') >= 0; }), 'cover: the squad\'s arrows into forest or rubble still meet Light Cover');
      // 2. higher ground, both sides
      ok(TR.melee(hillA, flat).s === 1 && TR.melee(flat, hillA).s === 0, 'higher ground: hill to flat +1, flat to hill 0');
      ok(TR.melee(hillA, hillB).s === 0, 'higher ground: hill to hill, no bonus');
      ok(TR.eMelee(hillA, flat) === 1, 'higher ground: an enemy on a hill gets +1 against the squad below');
      ok(TR.ranged(hillA, at(4, 3), 0).s === 1, 'higher ground: shooting down from a hill +1');
      { const u = Object.assign({}, hillA); const a = stepBonus.call(null, u, true), b = fStep.call(null, u, true);
        ok(b - a === 1, 'the old flat +1 for standing on a hill is gone from stepBonus'); }
      TR.highs.push(u => u.wall === true);
      ok(TR.high({x: flat.x, y: flat.y, wall: true}) && TR.higher({x: flat.x, y: flat.y, wall: true}, flat), 'TERRAIN.highs: F-30 can add wall walks as high ground');
      TR.highs.pop();
      // 3. range bands
      const o = {x: 8 * CELL, y: 8 * CELL}, px = d => ({x: o.x + d, y: o.y});
      ok(TR.ranged(o, px(150), TR.band.shortbows).s === 0 && TR.ranged(o, px(170), TR.band.shortbows).s === -1, 'range: shortbow normal to 4 hexes, -1 beyond');
      ok(TR.ranged(o, px(230), TR.band.longbows).s === 0 && TR.ranged(o, px(240), TR.band.longbows).s === -1, 'range: longbow normal to 6 hexes, -1 beyond');
      ok(TR.ranged(o, px(190), TR.band.crossbows).s === 0 && TR.ranged(o, px(200), TR.band.crossbows).s === -1, 'range: crossbow normal to 5 hexes, -1 beyond');
      ok(TR.enemyBand({k: 'crossbow'}) === 180 && TR.enemyBand({k: 'chaingang'}) === 4 * HX, 'range: an enemy shooter\'s band is 60% of its range, at least 4 hexes');
      G.ranged = {id: 'longbows'}; ok(TR.squadBand() === TR.band.longbows, 'range: the squad band follows the Squad Standard ranged weapon'); G.ranged = {id: 'shortbows'};
      // 4. fog and night
      ok(TR.ranged(o, px(130), 0).s === 0, 'dark: no step in clear weather');
      G.nightTint = true;
      ok(TR.ranged(o, px(110), 0).s === 0 && TR.ranged(o, px(130), 0).s === -1, 'dark: at night, -1 beyond 3 hexes only');
      G.nightTint = false; G.fogT = 100;
      ok(TR.ranged(o, px(130), 0).s === -1 && TR.ranged(o, px(130), 0, true).s === -1 && TR.ranged(o, px(110), 0, true).s === 0, 'dark: in fog both sides take -1 beyond 3 hexes, none inside (fog ward trimmed)');
      G.fogWard = 100;
      ok(TR.flatWard() && TR.ranged(o, px(130), 0, true).s === 0 && TR.ranged(o, px(130), 0).s === -1, 'bought fog (G.fogWard): enemies pay the flat ward, no range step; the squad still -1 beyond 3 hexes');
      G.fogWard = 0; ok(!TR.flatWard(), 'the bought fog ends: back to the tabletop rule');
      G.fogT = 0;
      // 5. chips and the log
      { const a = Object.assign({}, hillA); TR.chip(a, {s: 1, tags: ['high']}); TR.chip(a, {s: 1, tags: ['high']});
        ok(G.fx.filter(f => f.text).length === 1 && G.msgs.length === 1, 'chips: one chip per unit per 1.5 s, the first of a kind in the log'); }
      // 6. strike applies it (wrapper feeds the rules)
      ok(String(strike).indexOf('TR.ranged') >= 0 && String(enemyHitsUnit).indexOf('TR.ranged') >= 0, 'strike and enemyHitsUnit carry the terrain step');
    } catch (e) { fails.push('threw: ' + (e && e.message || e)); }
    G = G0; MAP = M0; TR._pops = pops0;
    return {ok: fails.length === 0, n, pass: n - fails.length, fails}; };
  TR.unwrapped = {strike: fStrike, stepBonus: fStep};
})();
