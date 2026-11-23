/* F-23 live co-op, step .1 (Lead Programmer, 2026-11-14; scope audits/coop-live-scope.md).
   The guest plays their own Leader (their squad's officer) directly; the mates stay on AI orders. The host stays the referee:
   the guest sends inputs, the host moves the officer on its own field and the snapshot carries the result back.
   ON by default (Patrick 2026-11-15). Kill switch: LIVE23.on = false, or index.html?live23=0. With it off nothing here changes play.
     guest  -> host  {t:'in', mx, my, s}     mx, my in -1, 0, 1 (WASD / arrows); s a sequence number. Sent on change and as a keepalive
                                             every KEEP_MS while a key is held: at most SEND_HZ a second, under MPNET's 20/s cap.
     host            sq.input = {mx, my, s, f: G.frame}. While the input is fresh (DRIVE_S) the squad is 'driven': its anchor sits on the
                     officer, so the mates ring their own Leader, and the officer walks by the input, not by AI. Attacks stay automatic.
                     Input older than STOP_F frames stops the officer; after DRIVE_S seconds without input the squad goes back to its orders.
   LIVE23.snapStats: size of each snapshot as JSON (n, mean, max chars) while on; LIVE23.selfTest() for REG addons. */
(function(){
const LIVE23 = window.LIVE23 = {
  on: !/[?&]live23=0/.test(location.search),   // ON by default (Patrick 2026-11-15); rollback LIVE23.on = false or ?live23=0
  SEND_HZ: 12,          // [T] most inputs a second the guest sends (MPNET caps a guest at 20 including heartbeats)
  KEEP_MS: 400,         // [T] keepalive while a key is held, so a lost message cannot freeze a Leader for long
  STOP_F: 30,           // [T] frames: input older than this stops the guest's Leader
  DRIVE_S: 3,           // [T] seconds without input before the squad goes back to its orders
  SPD_K: 1.05,          // the same walk factor as the AI squads (ally.js updateSquad)
  snapStats: {n: 0, sum: 0, max: 0, mean: 0},
  keys: {}, last: null, sentAt: 0, seq: 0, sent: 0, timer: null
};
const clamp1 = v => { v = Math.round(+v || 0); return v > 0 ? 1 : v < 0 ? -1 : 0; };
LIVE23.clean = m => ({mx: clamp1(m && m.mx), my: clamp1(m && m.my), s: (m && m.s) >>> 0});

/* ---- host: take the input --------------------------------------------------------------------------- */
LIVE23.take = function(seat, m){
  if (LIVE23.camp && LIVE23.camp.inCamp && LIVE23.camp.inCamp()) return LIVE23.camp.take(seat, m);   /* INT-1 stage 3 group 6: outside a fight the seat's camp figure takes the keys (folded in from the camp block) */
  if (typeof G === 'undefined' || !G || !G.allies || !window.ALLY) return false;
  const sq = ALLY.bySeat(seat); if (!sq || sq.controller !== 'guest') return false;
  const i = LIVE23.clean(m);
  if (sq.input && sq.input.s > i.s && sq.input.s - i.s < 1e6) return false;   // an old message arriving late
  sq.input = Object.assign(i, {f: G.frame | 0});
  sq.lastOrder = G.sec; sq.aiNow = false;   // input counts as an order: no AI takeover while a guest is playing
  return true;
};
if (window.MPNET && MPNET.host){
  const f = MPNET.host;
  MPNET.host = function(cb, o){
    if (cb && cb.onMessage){ const g = cb.onMessage; cb = Object.assign({}, cb, {onMessage: (seat, m) => { if (m && m.t === 'in'){ if (LIVE23.on) LIVE23.take(seat, m); return; } return g(seat, m); }}); }
    return f.call(this, cb, o);
  };
}
LIVE23.driven = sq => !!(LIVE23.on && sq && sq.controller === 'guest' && sq.input && G && (G.frame - sq.input.f) < LIVE23.DRIVE_S * 60);

/* ---- host: walk the officer by the input ------------------------------------------------------------ */
LIVE23.walk = function(u, mx, my){
  if (!u || u.state !== 'up' || (!mx && !my)){ if (u) u.moving = false; return; }
  const n = Math.hypot(mx, my) || 1, sx = mx / n, sy = my / n;
  let terr = 1; try { if (!LIVE23._fake && typeof SLOW !== 'undefined' && typeof cellAt === 'function') terr = SLOW[cellAt(u.x, u.y)] || 1; } catch (e) {}
  const mv = (u.s && u.s.move) || 4, arm = ((u.kit || G).armour || {}).mv || 0;
  const spd = Math.max(3, mv + arm) * (typeof PX_PER_MOVE !== 'undefined' ? PX_PER_MOVE : 1) * LIVE23.SPD_K * terr * (u.spdK || 1);
  const bx = u.x, by = u.y;
  u.x += sx * spd; u.y += sy * spd; u.moving = true; if (sx) u.left = sx < 0;
  const blk = (x, y) => { try { return !LIVE23._fake && typeof blockedXY === 'function' && blockedXY(x, y); } catch (e) { return false; } };
  if (blk(u.x, u.y)){
    u.x = bx + sx * spd; u.y = by;                                    // slide along a wall
    if (blk(u.x, u.y)){ u.x = bx; u.y = by + sy * spd; if (blk(u.x, u.y)){ u.x = bx; u.y = by; u.moving = false; } }
  }
  try { if (!LIVE23._fake && typeof collide === 'function') collide(u, 9); } catch (e) {}
};
if (window.ALLY && ALLY.update){
  const f = ALLY.update;
  ALLY.update = function(){
    const held = [];
    try {
      if (LIVE23.on && G && G.allies) for (const sq of G.allies){
        if (!sq.units || !LIVE23.driven(sq)) continue;
        const o = sq.units[0]; if (!o) continue;
        held.push({sq, o, x: o.x, y: o.y, orders: sq.orders});
        sq.orders = 'hold'; sq.anchor = {x: o.x, y: o.y};             // 'hold' leaves the anchor where we put it: on their own Leader
      }
    } catch (e) {}
    const r = f.apply(this, arguments);
    for (const h of held){
      h.sq.orders = h.orders;
      const i = h.sq.input, fresh = G.frame - i.f < LIVE23.STOP_F;
      h.o.x = h.x; h.o.y = h.y;                                           // the AI's step for the officer is undone; the guest walks instead
      LIVE23.walk(h.o, fresh ? i.mx : 0, fresh ? i.my : 0);
    }
    return r;
  };
}

/* ---- Systems' co-op drafts (audits/coop-live-balance.md; Patrick 2026-11-14), live only with ?live23=1 ------------------
   COOP.EFF guest 0.65 / AI 0.60 (the odds band). The leash: a mate with no enemy within LEASH.foe px and more than LEASH.far px
   from its officer walks x LEASH.k until back inside LEASH.near; beyond LEASH.regroup px and out of every player's sight it steps
   to the officer's ring (never on screen); a guest squad's officer is always on screen, so its mate steps to just off that view. */
LIVE23.EFF = {guest: 0.65, ai: 0.60};
LIVE23.LEASH = {foe: 120, far: 300, near: 150, k: 1.5, regroup: 700, ring: 40};
LIVE23.effOn = !!(LIVE23.on && window.COOP && COOP.EFF); if (LIVE23.effOn) Object.assign(COOP.EFF, LIVE23.EFF);   // applied once at load, with the flag
LIVE23.views = function(g){   // the players' view rectangles: the host's (on its Leader) and each guest officer's
  const w = (typeof VW !== 'undefined' ? VW : 1280) / 2 + 60, h = (typeof VH !== 'undefined' ? VH : 720) / 2 + 60, out = [];
  if (g.leader) out.push({x: g.leader.x, y: g.leader.y, w, h});
  for (const sq of g.allies || []) if (sq && sq.units && sq.controller === 'guest' && sq.units[0]) out.push({x: sq.units[0].x, y: sq.units[0].y, w, h});
  return out;
};
LIVE23.leash = function(g, before){
  const K = LIVE23.LEASH, foes = (g.enemies || []).filter(e => !e.dead && !e.dormant), views = LIVE23.views(g), n = {fast: 0, regroup: 0};
  const seen = u => views.some(v => Math.abs(u.x - v.x) < v.w && Math.abs(u.y - v.y) < v.h);
  const blk = (x, y) => { try { return !LIVE23._fake && typeof blockedXY === 'function' && blockedXY(x, y); } catch (e) { return false; } };
  for (const sq of g.allies || []){
    if (!sq || !sq.units || !sq.units[0]) continue;
    const o = sq.units[0];
    for (const m of sq.units.slice(1)){
      if (m.state !== 'up') continue;
      const d = Math.hypot(m.x - o.x, m.y - o.y);
      if (d > K.regroup && !seen(m)){
        if (!seen(o)){ const a = Math.random() * 6.2832, x = o.x + Math.cos(a) * K.ring, y = o.y + Math.sin(a) * K.ring;
          if (!blk(x, y)){ m.x = x; m.y = y; m.leash23 = false; n.regroup++; continue; } }
        else {   // a guest's officer is always on its own screen: step to the nearest point just off every view, on the line in
          const ux = (m.x - o.x) / d, uy = (m.y - o.y) / d; let t = d;
          for (let r = K.far; r < d; r += 20){ const x = o.x + ux * r, y = o.y + uy * r; if (!seen({x, y})){ t = r; break; } }
          const x = o.x + ux * t, y = o.y + uy * t;
          if (t < d - 1 && !blk(x, y)){ m.x = x; m.y = y; m.leash23 = true; n.regroup++; continue; } } }
      if (d < K.near) m.leash23 = false;
      else if (d > K.far && !foes.some(e => Math.hypot(e.x - m.x, e.y - m.y) < K.foe)) m.leash23 = true;
      const b = before && before.get(m);
      if (m.leash23 && b){ const dx = (m.x - b.x) * (K.k - 1), dy = (m.y - b.y) * (K.k - 1);   // the extra half of its own step
        if ((dx || dy) && !blk(m.x + dx, m.y + dy)){ m.x += dx; m.y += dy; n.fast++; } }
    }
  }
  return n;
};
if (window.ALLY && ALLY.update){
  const f = ALLY.update;
  ALLY.update = function(){
    let before = null;
    try { if (LIVE23.on && G && G.allies){ before = new Map(); for (const sq of G.allies) if (sq && sq.units) for (const u of sq.units) before.set(u, {x: u.x, y: u.y}); } } catch (e) {}
    const r = f.apply(this, arguments);
    if (before) try { LIVE23.leash(G, before); } catch (e) {}
    return r;
  };
}

/* ---- host: snapshot size: measured in the F-23.2 wrapper below, so the extras count ---------------- */
LIVE23.meter = function(s){ try { const n = JSON.stringify(s).length, S = LIVE23.snapStats; S.n++; S.sum += n; S.max = Math.max(S.max, n); S.mean = Math.round(S.sum / S.n); } catch (e) {} };

/* ---- guest: send the input ------------------------------------------------------------------------- */
const KEYMAP = {KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0]};
LIVE23.vec = function(keys){ let mx = 0, my = 0; for (const k in keys) if (keys[k] && KEYMAP[k]){ mx += KEYMAP[k][0]; my += KEYMAP[k][1]; } return {mx: clamp1(mx), my: clamp1(my)}; };
LIVE23.guestLive = () => !!(LIVE23.on && window.MPCOOP && MPCOOP.role === 'guest' && MPCOOP.view === 'field' && MPCOOP.guest);
// decide whether to send now; returns the message or null (pure, for the self-test)
LIVE23.due = function(v, last, now, sentAt){
  if (now - sentAt < 1000 / LIVE23.SEND_HZ) return null;
  const changed = !last || last.mx !== v.mx || last.my !== v.my, moving = v.mx || v.my;
  if (changed || (moving && now - sentAt >= LIVE23.KEEP_MS)) return {t: 'in', mx: v.mx, my: v.my};
  return null;
};
LIVE23.pump = function(now){
  if (!LIVE23.guestLive()) return null;
  now = now || Date.now();
  const v = LIVE23.vec(LIVE23.keys), m = LIVE23.due(v, LIVE23.last, now, LIVE23.sentAt);
  if (!m) return null;
  m.s = ++LIVE23.seq;
  if (MPCOOP.guest.send(m)){ LIVE23.last = v; LIVE23.sentAt = now; LIVE23.sent++; }
  return m;
};
const onKey = down => e => {
  if (!LIVE23.guestLive() || !KEYMAP[e.code]) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  LIVE23.keys[e.code] = down; e.preventDefault(); LIVE23.pump();
};
window.addEventListener('keydown', onKey(true), true);
window.addEventListener('keyup', onKey(false), true);
window.addEventListener('blur', () => { LIVE23.keys = {}; LIVE23.pump(); });
LIVE23.timer = setInterval(() => { try { LIVE23.pump(); } catch (e) {} }, 50);

/* ---- self-test (REG addons) ------------------------------------------------------------------------ */
LIVE23.selfTest = function(){
  const fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const on0 = LIVE23.on, g0 = typeof G !== 'undefined' ? G : undefined, by0 = ALLY.bySeat;
  try {
    ok('clean clamps and drops junk', JSON.stringify(LIVE23.clean({mx: 9, my: -0.7, s: 'x', evil: 1})) === '{"mx":1,"my":-1,"s":0}');
    ok('keys to a vector; opposite keys cancel', JSON.stringify(LIVE23.vec({KeyW: true, KeyD: true})) === '{"mx":1,"my":-1}' && JSON.stringify(LIVE23.vec({KeyA: true, KeyD: true})) === '{"mx":0,"my":0}');
    const v = {mx: 1, my: 0};
    ok('send pacing: first and changed inputs go, a held key keeps alive, never above SEND_HZ',
      !!LIVE23.due(v, null, 1000, 0) && !LIVE23.due(v, v, 1010, 1000) && !LIVE23.due(v, v, 1200, 1000) && !!LIVE23.due(v, v, 1000 + LIVE23.KEEP_MS, 1000)
      && !LIVE23.due({mx: 0, my: 0}, {mx: 0, my: 0}, 9000, 1000) && !LIVE23.due({mx: 0, my: 1}, v, 1000 + 1000 / LIVE23.SEND_HZ - 1, 1000));
    ok('worst case under the 20/s cap with heartbeats', LIVE23.SEND_HZ + 0.5 < 20);
    // host side, on a fake field
    LIVE23.on = true;
    const sq = {seat: 2, controller: 'guest', orders: 'follow', units: [{x: 100, y: 100, state: 'up', s: {move: 4}}], lastOrder: 0, aiNow: true};
    G = {frame: 600, sec: 10, allies: [sq], armour: {mv: 0}}; ALLY.bySeat = s => s === 2 ? sq : null;
    ok('host takes a guest input; it counts as an order', LIVE23.take(2, {t: 'in', mx: 1, my: 0, s: 5}) && sq.input.mx === 1 && sq.input.f === 600 && sq.lastOrder === 10 && sq.aiNow === false);
    ok('a late older input is dropped', !LIVE23.take(2, {mx: -1, my: 0, s: 4}) && sq.input.mx === 1);
    ok('no input for an AI or empty seat', !LIVE23.take(3, {mx: 1}) && (sq.controller = 'ai_takeover', !LIVE23.take(2, {mx: 1, s: 9})));
    sq.controller = 'guest';
    ok('driven while fresh, not after DRIVE_S', LIVE23.driven(sq) && (G.frame = 600 + LIVE23.DRIVE_S * 60, !LIVE23.driven(sq)));
    LIVE23.on = false; G.frame = 600;
    ok('kill switch: off means never driven and no input taken', !LIVE23.driven(sq));
    LIVE23.on = true; LIVE23._fake = true;   // a fake field has no map: no walls, terrain or crowding
    const u = {x: 100, y: 100, state: 'up', s: {move: 4}}; LIVE23.walk(u, 1, 0);
    ok('walk moves the officer the way the guest pushes', u.x > 100 && Math.abs(u.y - 100) < 10 && u.moving);
    const x1 = u.x; LIVE23.walk(u, 0, 0); ok('no input, no walk', u.x === x1 && !u.moving);
    const dn = {x: 5, y: 5, state: 'down', s: {move: 4}}; LIVE23.walk(dn, 1, 1); ok('a downed Leader does not walk', dn.x === 5);
    // the MPNET hook routes 'in' to LIVE23 and everything else to the old handler
    let seen = 0; const H = MPNET.host({onMessage: () => seen++}, {fake: true});
    H.slots[1].status = 'connected'; H._text(H.slots[1], JSON.stringify({t: 'in', mx: -1, my: 0, s: 6})); H._text(H.slots[1], JSON.stringify({t: 'ready', on: true}));
    ok('the host hook takes inputs and passes other messages on', seen === 1 && sq.input.mx === -1); H.close();
    // snapshot size of a fake full field: 3 squads of 5 and 40 enemies
    if (window.MPCOOP && MPCOOP.snapshot){
      const unit = i => ({x: 100 + i * 13.37, y: 200 + i * 7.11, hp: 6, maxHp: 9, state: 'up', p: {name: 'N' + i}});
      const fg = {sec: 300, frame: 18000, obj: 'hold', prog: 0.5, over: false, leader: {x: 400.5, y: 300.25}, squad: [0, 1, 2, 3, 4].map(unit), msgs: [{t: 'A line of news.'}],
        allies: [1, 2, 3].map(s => ({seat: s, orders: 'follow', controller: 'guest', status: 'live', kills: 3, name: 'Guest ' + s, officer: {name: 'Cap ' + s}, units: [0, 1, 2, 3, 4].map(unit)})),
        enemies: Array.from({length: 40}, (_, i) => ({x: 1000 + i * 17.3, y: 900 + i * 3.9, id: i}))};
      const n = JSON.stringify(MPCOOP.snapshot(fg)).length; LIVE23.fullSnap = n;
      ok('a full snapshot (3 squads, 40 enemies) fits one message: ' + n + ' chars', n < MPNET.MAX_MSG_CHARS && n < 8000);
    }
    { const sv = LIVE23._fake, svW = VW, svH = VH; LIVE23._fake = true; VW = 1280; VH = 720;   // the leash rows assume a full-size view (a small or hidden pane made 'just off the screen' fail: the leash steps out from 300 px)
      const o = {x: 0, y: 0, state: 'up'}, far = {x: 400, y: 0, state: 'up'}, lost = {x: 5000, y: 0, state: 'up'}, busy = {x: 0, y: 400, state: 'up'};
      const g = {leader: {x: -9000, y: 0}, enemies: [{x: 0, y: 450}], allies: [{controller: 'ai', units: [o, far, lost, busy]}]};
      const bef = new Map([[far, {x: 410, y: 0}], [busy, {x: 0, y: 410}]]);
      const n = LIVE23.leash(g, bef);
      ok('leash: a far idle mate walks x1.5 (its step plus half)', far.leash23 && Math.abs(far.x - 395) < 0.01);
      ok('leash: a mate with a foe near does not', !busy.leash23 && busy.y === 400);
      ok('leash: beyond 700 px out of sight, the mate regroups to the ring', Math.abs(Math.hypot(lost.x, lost.y) - LIVE23.LEASH.ring) < 0.01 && n.regroup === 1);
      const seenM = {x: 900, y: 0, state: 'up'}; LIVE23.leash({leader: {x: 900, y: 0}, enemies: [], allies: [{controller: 'ai', units: [{x: 0, y: 0, state: 'up'}, seenM]}]}, new Map());
      ok('leash: never a regroup on screen', seenM.x === 900);
      const gO = {x: 0, y: 0, state: 'up'}, gM = {x: 3000, y: 0, state: 'up'};
      LIVE23.leash({leader: {x: -9000, y: 0}, enemies: [], allies: [{controller: 'guest', units: [gO, gM]}]}, new Map());
      const vw = LIVE23.views({allies: [{controller: 'guest', units: [gO]}]})[0].w;
      ok('leash: a lost guest mate steps to just off the guest screen', gM.x >= vw && gM.x < vw + 21 && gM.leash23);
      LIVE23._fake = sv; VW = svW; VH = svH; }
    ok('co-op EFF drafts guest 0.65 / AI 0.60' + (LIVE23.effOn ? ' (live)' : ' (off: table unchanged)'), LIVE23.EFF.guest === 0.65 && LIVE23.EFF.ai === 0.60 && (!window.COOP || (LIVE23.effOn ? COOP.EFF.guest === 0.65 && COOP.EFF.ai === 0.60 : COOP.EFF.guest === 0.95 && COOP.EFF.ai === 0.85)));
  } catch (e) { fails.push('threw: ' + e.message); }
  finally { LIVE23._fake = false; LIVE23.on = on0; G = g0; ALLY.bySeat = by0; LIVE23.snapStats = {n: 0, sum: 0, max: 0, mean: 0}; }
  return {ok: !fails.length, fails, info: 'input clean, pacing, host take, drive, walk, hook, kill switch, snapshot ' + (LIVE23.fullSnap || '?') + ' chars'};
};
})();

/* ==== F-23.2 the guest's field view (Lead Programmer, 2026-11-14) ======================================================
   The host's 'start' carries the contract (for the map seed), a map signature and the cast (who looks like what). The guest
   rebuilds the map from the seed with the real generateMap and checks the signature; if it matches, the glass draws the real
   terrain tiles and sprites (drawTerrain, drawSprite, personSprite, enemySprite), smoothed between snapshots (DELAY_MS behind,
   so there are two to blend), with the guest's own Leader predicted from their keys and pulled back to the host's word.
   No match, no cast, or any error: the old dot map (MPCOOP.drawGlass) stays. The guest runs no game rule: G is a drawing stub
   only for the length of one draw call, then put back. Snapshots gain enemy ids and kinds (e23, k23, kd23) while LIVE23 is on. */
(function(){
const L23 = window.LIVE23; if (!L23) return;
Object.assign(L23, {DELAY_MS: 120, PRED_SPD: 2.4, PRED_PULL: 0.12, PRED_SNAP: 140, VIEW_K: 0.8, BUF: 8});   // [T]
L23.mapSig = M => { if (!M || !M.g) return 0; let h = 2166136261 ^ M.w ^ (M.h << 8); const g = M.g; for (let i = 0; i < g.length; i++){ h ^= g[i]; h = Math.imul(h, 16777619); } return h >>> 0; };
L23.castOf = p => p ? {id: p.id, name: String(p.name || '').slice(0, 24), race: p.race, spec: p.spec, sex: p.sex} : null;
L23.mapContract = c => { try { const s = JSON.stringify(c, (k, v) => typeof v === 'function' || (v && v.nodeType) ? undefined : v); return s.length < 30000 ? JSON.parse(s) : null; } catch (e) { return null; } };

/* host: the extras on 'start' and in each snapshot */
if (window.MPCOOP && MPCOOP.contractInfo){
  const f = MPCOOP.contractInfo;
  MPCOOP.contractInfo = function(c){
    const o = f.apply(this, arguments);
    if (o && L23.on && typeof G !== 'undefined' && G && G.contract === c){ try {
      o.live23 = {map: L23.mapContract(c), sig: L23.mapSig(MAP), cast: {host: L23.castOf(META.leader), squad: (G.squad || []).map(m => L23.castOf(m.p)),
        seats: (G.allies || []).filter(q => q.units).map(q => ({seat: q.seat, units: q.units.map(u => L23.castOf(u.p))}))}};
    } catch (e) {} }
    return o;
  };
}
let nid = 0;
if (window.MPCOOP && MPCOOP.snapshot){
  const f = MPCOOP.snapshot;
  MPCOOP.snapshot = function(g){
    const s = f.apply(this, arguments);
    if (!L23.on) return s;
    try {
      g = g || G; const L = g.leader, near = [];
      for (const en of (g.enemies || [])) if (!en.dead && !en.dormant) near.push(en);
      near.sort((a, b) => Math.hypot(a.x - L.x, a.y - L.y) - Math.hypot(b.x - L.x, b.y - L.y));
      const kd = [], ki = {}; s.e23 = []; s.k23 = [];
      near.slice(0, MPCOOP.ENEMY_CAP).forEach(en => { if (!en.l23) en.l23 = ++nid; s.e23.push(en.l23);
        if (!(en.k in ki)){ ki[en.k] = kd.length; kd.push(en.k); } s.k23.push(ki[en.k]); });
      s.kd23 = kd; s.lf = [L.anim && L.anim.left ? 1 : 0];
    } catch (e) {}
    L23.meter(s);
    return s;
  };
}

/* guest: keep the field and the snapshots */
L23.field = null;
L23.fieldStart = function(info){
  L23.field = null;
  if (!info || !info.map || !info.cast) return null;
  const F = {sig: info.sig >>> 0, cast: info.cast, buf: [], pred: null, spr: {}, ok: false, err: ''};
  const m0 = MAP;
  try { F.map = generateMap(Object.assign({}, info.map)); F.ok = !!F.map && L23.mapSig(F.map) === F.sig; if (!F.ok) F.err = 'map signature differs'; }
  catch (e) { F.err = 'map: ' + e.message; }
  finally { MAP = m0; }
  return L23.field = F;
};
L23.addSnap = function(s, now){ const F = L23.field; if (!F) return; F.buf.push({t: now || performance.now(), s}); if (F.buf.length > L23.BUF) F.buf.shift(); };
if (window.MPNET && MPNET.guest){
  const f = MPNET.guest;
  MPNET.guest = function(cb, o){
    if (cb && cb.onMessage){ const g = cb.onMessage; cb = Object.assign({}, cb, {onMessage: m => {
      if (L23.on && m){ try { if (m.t === 'start') L23.fieldStart(m.contract && m.contract.live23); else if (m.t === 'snap') L23.addSnap(m); } catch (e) {} }
      return g(m); }}); }
    return f.call(this, cb, o);
  };
}

/* guest: what to draw at time 'now': two snapshots blended */
const lerp = (a, b, k) => a + (b - a) * k;
L23.frameAt = function(now){
  const F = L23.field; if (!F || !F.buf.length) return null;
  const rt = now - L23.DELAY_MS, B = F.buf;
  let i = B.length - 1; while (i > 0 && B[i - 1].t > rt) i--;
  const b = B[i], a = i > 0 ? B[i - 1] : b, s0 = a.s, s1 = b.s;
  const k = b === a ? 1 : Math.max(0, Math.min(1, (rt - a.t) / Math.max(1, b.t - a.t)));
  const P = (p, q) => q ? [lerp(p[0], q[0], k), lerp(p[1], q[1], k)] : [p[0], p[1]];
  const out = {s: s1, k, leader: P(s0.leader, s1.leader).concat([s1.leader[2]]), squad: s1.squad.map((m, j) => P(s0.squad[j] || m, m)), squads: [], enemies: []};
  for (const q of s1.squads){ const q0 = s0.squads.find(x => x.seat === q.seat) || q;
    out.squads.push({q, units: q.units.map((u, j) => { const u0 = q0.units[j] || u, p = P(u0, u); return {x: p[0], y: p[1], sx: u[0], sy: u[1], hp: u[2], maxHp: u[3], up: !!u[4], left: u[0] < u0[0], moving: Math.abs(u[0] - u0[0]) + Math.abs(u[1] - u0[1]) > 0.5}; })}); }
  const prev = {}; if (s0.e23) s0.e23.forEach((id, j) => prev[id] = s0.enemies[j]);
  s1.enemies.forEach((en, j) => { const id = s1.e23 ? s1.e23[j] : null, e0 = id !== null && prev[id] || en, p = P(e0, en);
    out.enemies.push({x: p[0], y: p[1], boss: !!en[2], id: en[3] || 0, k: s1.kd23 && s1.k23 ? s1.kd23[s1.k23[j]] : null, left: en[0] < e0[0], moving: Math.abs(en[0] - e0[0]) + Math.abs(en[1] - e0[1]) > 0.5}); });
  return out;
};
/* guest: the own Leader, predicted from the keys and pulled back to the host's word */
L23.predict = function(server, dtF){
  const F = L23.field; if (!F || !server) return server;
  if (!F.pred || Math.hypot(F.pred.x - server[0], F.pred.y - server[1]) > L23.PRED_SNAP) F.pred = {x: server[0], y: server[1]};
  const v = L23.vec(L23.keys), n = Math.hypot(v.mx, v.my) || 1;
  F.pred.x += v.mx / n * L23.PRED_SPD * dtF; F.pred.y += v.my / n * L23.PRED_SPD * dtF;
  const pull = 1 - Math.pow(1 - L23.PRED_PULL, dtF);
  F.pred.x += (server[0] - F.pred.x) * pull; F.pred.y += (server[1] - F.pred.y) * pull;
  return [F.pred.x, F.pred.y];
};
const sprOf = (F, key, p, lead) => { if (key in F.spr) return F.spr[key];
  let s = null; try { if (p && typeof personSprite === 'function') s = personSprite(MPCOOP.sanitizePerson(p, lead, p.id), lead); } catch (e) {}
  return F.spr[key] = s; };

/* guest: draw one frame of the field on the glass with the game's own renderer */
L23.drawField = function(now){
  const F = L23.field, g = MPCOOP.G, cv = document.getElementById('mpco-glass');
  if (!F || !F.ok || !cv || !g) return false;
  now = now || performance.now();
  const fr = L23.frameAt(now); if (!fr) return false;
  const dtF = F.lastNow ? Math.max(0, Math.min(6, (now - F.lastNow) / (1000 / 60))) : 1; F.lastNow = now;
  const mine = fr.squads.find(x => x.q.seat === g.seat), me = mine && mine.units[0];
  if (me && me.up){ const p = L23.predict([me.sx, me.sy], dtF); me.x = p[0]; me.y = p[1]; }
  const W = cv.width, H = cv.height, K = L23.VIEW_K, vw = W / K, vh = H / K;
  const c0 = me || {x: fr.leader[0], y: fr.leader[1]}, cx = Math.round(c0.x - vw / 2), cy = Math.round(c0.y - vh / 2);
  const save = {ctx, VW, VH, G, MAP}, c2 = cv.getContext('2d'), frame = (fr.s.frame | 0);
  try {
    ctx = c2; VW = vw; VH = vh; MAP = F.map;
    G = {frame, bgPat: F.bgPat || null, leader: {x: c0.x, y: c0.y}, mounted: false, ghost23: true};
    ctx.setTransform(K, 0, 0, K, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(-cx, -cy);
    drawTerrain(cx, cy); F.bgPat = G.bgPat;
    const on = (x, y) => x > cx - 80 && x < cx + vw + 80 && y > cy - 80 && y < cy + vh + 80, bodies = [];
    const anim = mv => mv ? 1 + ((frame / 9 | 0) % 2) : 0;
    for (const e of fr.enemies) if (on(e.x, e.y)) bodies.push({y: e.y, f: () => {
      let spr = null, sc = 1.2; try { if (e.k && BESTIARY[e.k]){ spr = enemySprite(e.k); sc = BESTIARY[e.k].sc * 1.2; } } catch (x) {}
      if (spr) drawSprite(spr, e.x, e.y, sc, anim(e.moving), e.left, false);
      else { ctx.fillStyle = e.boss ? '#ff5a3a' : '#c84a3a'; ctx.beginPath(); ctx.arc(e.x, e.y, e.boss ? 14 : 9, 0, TAU); ctx.fill(); } }});
    const person = (spr, x, y, s, up, mv, left) => { if (!spr){ ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); return; }
      if (up) drawSprite(spr, x, y, s, anim(mv), left, false); else drawDowned(spr, x, y, s, 0.85); };
    { const lx = fr.leader[0], ly = fr.leader[1], up = fr.leader[2]; if (on(lx, ly)) bodies.push({y: ly, f: () => { person(sprOf(F, 'host', F.cast.host, true), lx, ly, 2.7, up, false, !!(fr.s.lf && fr.s.lf[0]));
      ctx.fillStyle = '#f3e6c8'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText(g.host || 'host', lx, ly - 34); }}); }
    fr.squad.forEach((m, j) => { if (on(m[0], m[1])) bodies.push({y: m[1], f: () => person(sprOf(F, 'h' + j, F.cast.squad[j], false), m[0], m[1], 2.4, true, false, false)}); });
    for (const sq of fr.squads){
      const cs = (F.cast.seats || []).find(x => x.seat === sq.q.seat), col = ALLY.colour(sq.q.seat), own = sq.q.seat === g.seat;
      sq.units.forEach((u, j) => { if (!on(u.x, u.y)) return; bodies.push({y: u.y, f: () => {
        if (u.up){ ctx.beginPath(); ctx.ellipse(u.x, u.y + 17, own && !j ? 17 : 14, own && !j ? 6 : 5, 0, 0, TAU); ctx.strokeStyle = col; ctx.lineWidth = own && !j ? 3 : 2; ctx.stroke(); }
        person(sprOf(F, 's' + sq.q.seat + ':' + j, cs && cs.units[j], !j), u.x, u.y, 2.4, u.up, u.moving, u.left);
        if (u.up) for (let i = 0; i < u.maxHp; i++){ ctx.fillStyle = i < u.hp ? col : 'rgba(0,0,0,.45)'; ctx.fillRect(u.x - u.maxHp * 2 + i * 4, u.y + 22, 3, 3); }
        if (!j){ ctx.fillStyle = col; ctx.font = (own ? 'bold ' : '') + '10px Georgia'; ctx.textAlign = 'center'; ctx.fillText(sq.q.name || sq.q.officer, u.x, u.y - 30); } }}); });
    }
    bodies.sort((a, b) => a.y - b.y).forEach(b => { try { b.f(); } catch (x) {} });
    if (fr.s.mk){ const mq = mine && mine.q.mark, mk = mq && fr.enemies.find(e => e.id === mq);
      if (mk){ ctx.strokeStyle = ALLY.colour(g.seat); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(mk.x, mk.y, 20, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the guest's HUD: clock, own Leader, squad, orders
    const s = fr.s, q = mine && mine.q;
    ctx.fillStyle = 'rgba(15,12,8,.72)'; ctx.fillRect(0, 0, W, 22); ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = '#f3e6c8'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(s.sec / 60)}:${String(s.sec % 60).padStart(2, '0')}  ·  progress ${Math.round(s.prog * 100)}%`, 8, 15);
    if (q){ const o = q.units[0];
      ctx.fillText(`${q.officer.toUpperCase()}  ${o && o[4] ? o[2] + ' / ' + o[3] + ' hp' : 'DOWN'}  ·  ${ALLY.LABEL[q.orders]}  ·  ${q.units.filter(u => u[4]).length} / ${q.units.length} UP  ·  ${q.kills} kills`, 8, H - 8);
      ctx.textAlign = 'right'; ctx.fillText('WASD: your Leader', W - 8, 15); }
    F.drawn = (F.drawn || 0) + 1;
  } catch (e) { F.err = 'draw: ' + e.message; F.ok = false; }
  finally { try { c2.setTransform(1, 0, 0, 1, 0, 0); } catch (x) {} ctx = save.ctx; VW = save.VW; VH = save.VH; G = save.G; MAP = save.MAP; }
  g.glassPx = (x, y) => [(x - cx) * K, (y - cy) * K];   // marks: clicks map through this view now
  return F.ok;
};
if (window.MPCOOP && MPCOOP.drawGlass){
  const f = MPCOOP.drawGlass;
  MPCOOP.drawGlass = function(){ const r = f.apply(this, arguments); if (L23.on && L23.field && L23.field.ok) L23.drawField(); return r; };
}
// a steady redraw while the guest looks at the field (snapshots come 10 a second; this smooths between them)
L23.raf = function(now){ try { if (L23.guestLive() && L23.field && L23.field.ok) L23.drawField(now); } catch (e) {} requestAnimationFrame(L23.raf); };
if (typeof requestAnimationFrame === 'function') requestAnimationFrame(L23.raf);

// self-test rows for .2, added to LIVE23.selfTest
{ const f = L23.selfTest;
  L23.selfTest = function(){
    const r = f.apply(this, arguments), fails = r.fails, ok = (n, c) => { if (!c) fails.push(n); };
    const F0 = L23.field, k0 = L23.keys, on0 = L23.on;
    try {
      ok('.2 map signature: same grid same number, one cell changed a different one', (() => { const a = {w: 3, h: 2, g: new Uint8Array([1, 2, 3, 4, 5, 6])}, b = {w: 3, h: 2, g: new Uint8Array([1, 2, 3, 4, 5, 7])}; return L23.mapSig(a) === L23.mapSig({w: 3, h: 2, g: a.g.slice()}) && L23.mapSig(a) !== L23.mapSig(b); })());
      ok('.2 no live map or cast: no field, the dot map stays', L23.fieldStart(null) === null && L23.fieldStart({map: {obj: 'hunt'}}) === null);
      const snap = (x, ex, id) => ({t: 'snap', sec: 1, frame: 60, prog: 0, leader: [x, 0, 1], squad: [[x, 10]], squads: [{seat: 2, orders: 'follow', officer: 'C', kills: 0, units: [[x, 20, 5, 6, 1]]}], enemies: [[ex, 50, 0]], e23: [id], k23: [0], kd23: ['brigand'], msgs: []});
      L23.field = {ok: true, buf: [], cast: {host: null, squad: [], seats: []}, spr: {}};
      L23.addSnap(snap(0, 100, 7), 1000); L23.addSnap(snap(100, 200, 7), 1100);
      const fr = L23.frameAt(1050 + L23.DELAY_MS);
      ok('.2 smoothing: halfway between two snapshots draws halfway', Math.abs(fr.leader[0] - 50) < 1 && Math.abs(fr.squads[0].units[0].x - 50) < 1 && Math.abs(fr.enemies[0].x - 150) < 1 && fr.enemies[0].k === 'brigand');
      L23.addSnap(snap(200, 999, 8), 1200);
      const fr2 = L23.frameAt(1150 + L23.DELAY_MS);
      ok('.2 smoothing: a new enemy id is not slid from another', Math.abs(fr2.enemies[0].x - 999) < 1);
      L23.field.pred = null; L23.keys = {KeyD: true};
      const p1 = L23.predict([0, 0], 1), p2 = L23.predict([0, 0], 1);
      L23.keys = {}; let p3 = p2; for (let i = 0; i < 60; i++) p3 = L23.predict([0, 0], 1);
      ok('.2 prediction: keys move the Leader at once; let go and the host\'s place pulls it back', p1[0] > 0 && p2[0] > p1[0] && Math.abs(p3[0]) < 0.1);
      L23.field.pred = {x: 0, y: 0}; const p4 = L23.predict([500, 0], 1);
      ok('.2 prediction: far off the host\'s place, it jumps there', p4[0] === 500);
      L23.on = false; const ci = MPCOOP.contractInfo({obj: 'hunt', tier: 1});
      ok('.2 kill switch: no map, cast or ids sent while off', ci && !ci.live23);
    } catch (e) { fails.push('.2 threw: ' + e.message); }
    finally { L23.field = F0; L23.keys = k0; L23.on = on0; }
    r.ok = r.ok !== false && !fails.length; r.info += '; .2 map signature, smoothing, prediction';
    return r;
  };
}
})();

/* F-23.3a guests walk the host's camp (Lead Programmer, 2026-11-14). Off unless ?live23=1 (LIVE23.on).
   host  -> each guest  {t:'c23i', v, W, H, meta, trees, decor, cast}   when the camp's look or its people change (checked every CHECK_F frames)
                        {t:'c23', v, f, p:[[x, y, flags, role], ...]}   every CSNAP_F camp frames, in cast order
   guest -> host        {t:'in', mx, my, s} as in the field (the same keys). Outside a fight the host walks the seat's visiting figure.
   The host's camp gets one visiting figure per connected seat (kind 'guest23'); it walks like the host's own Leader (leaderBlocked,
   LEAD_WALK). The guest draws the host's camp with the base camp painter (_drawCamp) on a ghost META built from the host's slice, so
   the guest's own save is never read for it and never written. E looks at the nearest person. Building, the treasury and the roster
   stay the host's: the guest sends nothing but keys. Trade, kit, bard and tavern are F-23.3b. */
(function(){
const L = window.LIVE23; if (!L) return;
const C = L.camp = {
  CSNAP_F: 6,       // [T] camp frames between camp snapshots (10 a second at 60 fps)
  CHECK_F: 60,      // [T] camp frames between checks of the camp's look and people
  DELAY_MS: 120,    // [T] the guest draws this far behind the host, blending two snapshots
  PRED_PULL: 0.12, PRED_SNAP: 140,   // [T] own-figure prediction: pull to the host's spot each frame; jump if further off
  LOOK_R: 70,       // [T] px: E looks at the nearest person within this
  META_MAX: 40000,  // chars: a bigger slice is not sent (the guest keeps the plain lobby)
  figs: {}, sent: {}, v: 0, sig: '', stats: {n: 0, max: 0, mean: 0, sum: 0, info: 0},
  G: {info: null, snaps: [], meta: null, people: null, me: null, raf: 0, say: ''}
};
const ROLES = ['', 'wander', 'rest', 'train', 'spar', 'build', 'vet', 'sit', 'player'];
const SKIP = ['roster', 'retired', 'chron', 'folk30', 'rivals', 'usedNames', 'nemeses', 'stats', 'tipsSeen', 'mapSeen', 'f34', 'board',
  'prologueChron', 'detachLog', 'settings', 'detachCaptives', 'detachPending', 'pendingPicks', 'prisoners'];
const hostOn = () => !!(L.on && window.MPCOOP && MPCOOP.role === 'host' && MPCOOP.host);
const inCamp = () => typeof G !== 'undefined' && !G && typeof CAMP !== 'undefined' && CAMP.on && !(typeof inStoryNow === 'function' && inStoryNow());

/* ---- host: the visiting figures ----------------------------------------------------------------- */
C.seatsNow = function(){
  const out = []; try { for (const s of MPCOOP.host.connected()){ const info = MPCOOP.seats[s.seat]; if (info && info.captain) out.push({seat: s.seat, info}); } } catch (e) {}
  return out;
};
C.ensureFigs = function(){
  const want = hostOn() ? C.seatsNow() : [], keep = {};
  for (const w of want){
    let q = C.figs[w.seat];
    if (!q){ const a = (w.seat * 1.7) % (Math.PI * 2);
      q = {id: 'g23_' + w.seat, kind: 'guest23', seat: w.seat, x: HUB.fire.x + Math.cos(a) * 110, y: HUB.fire.y + 70 + Math.sin(a) * 40,
        left: false, moving: false, seed: w.seat, wait: 120}; q.tx = q.x; q.ty = q.y; }
    q.p = w.info.captain; q.name = w.info.name; keep[w.seat] = q;
  }
  C.figs = keep;
  const figs = Object.values(keep);
  if (typeof CAMP !== 'undefined'){
    CAMP.people = CAMP.people.filter(q => q.kind !== 'guest23' || figs.includes(q));
    for (const q of figs) if (!CAMP.people.includes(q)) CAMP.people.push(q);
  }
  return figs;
};
C.take = function(seat, m){
  const q = C.figs[seat]; if (!q) return false;
  const i = L.clean(m);
  if (q.input && q.input.s > i.s && q.input.s - i.s < 1e6) return false;
  q.input = Object.assign(i, {f: CAMP.t | 0});
  return true;
};
C.inCamp = inCamp;   /* INT-1 stage 3 group 6: the L.take camp wrapper is folded into LIVE23.take, which reads this */
C.walk = function(q, mx, my){
  q.moving = !!(mx || my); if (!q.moving) return;
  const n = Math.hypot(mx, my), sp = typeof LEAD_WALK !== 'undefined' ? LEAD_WALK : 2.5, vx = mx / n * sp, vy = my / n * sp;
  const blk = (x, y) => { try { return typeof leaderBlocked === 'function' && leaderBlocked(x, y); } catch (e) { return false; } };
  const nx = Math.max(30, Math.min(CAMP_W - 30, q.x + vx)), ny = Math.max(70, Math.min(CAMP_H - 30, q.y + vy));
  if (!blk(nx, q.y)) q.x = nx;
  if (!blk(q.x, ny)) q.y = ny;
  if (mx) q.left = mx < 0;
  q.tx = q.x; q.ty = q.y;
};
if (typeof personRole === 'function'){ const f = personRole; personRole = q => q.kind === 'guest23' ? 'player' : f(q); }
if (typeof campSync === 'function'){ const f = campSync; campSync = function(){ const r = f.apply(this, arguments); try { if (hostOn() && inCamp()) C.ensureFigs(); } catch (e) {} return r; }; }
if (typeof updatePeople === 'function'){
  const f = updatePeople;
  updatePeople = function(){
    let figs = [];
    try { if (hostOn() && inCamp()){ figs = C.ensureFigs(); for (const q of figs){ q.tx = q.x; q.ty = q.y; q.wait = 120; } } } catch (e) { figs = []; }
    const r = f.apply(this, arguments);
    try {
      for (const q of figs){ const i = q.input, fresh = i && (CAMP.t - i.f) < L.STOP_F; C.walk(q, fresh ? i.mx : 0, fresh ? i.my : 0); }
      if (figs.length) C.broadcast();
    } catch (e) { console.warn('LIVE23 camp', e); }
    return r;
  };
}
/* the host clicks a visiting figure: a small panel of its own (the person panel expects a roster mate and would throw) */
if (typeof renderPanel === 'function'){ const f = renderPanel; renderPanel = function(){
  const P = typeof CAMP !== 'undefined' && CAMP.panel;
  if (P && P.kind === 'person' && String(P.id).indexOf('g23_') === 0){
    const q = CAMP.people.find(x => x.id === P.id), el = document.getElementById('camp-panel'); if (!q || !el) return closePanel();
    const e = v => String(v == null ? '' : v).replace(/[<>&"]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c]));
    el.innerHTML = `<button class="x" onclick="closePanel()" title="Close">&#215;</button><h2>${e(q.p && q.p.name)}</h2><div class="tag">Visiting captain: ${e(q.name || 'a friend')}, seat ${(q.seat | 0) + 1}</div>`
      + `<div class="desc" style="text-align:left">A friend's Squad Leader, visiting your camp. They walk and look round; your buildings, treasury and roster stay yours.</div>`;
    return; }
  return f.apply(this, arguments); }; }
/* the host-side cast and look of the camp */
const personOf = q => { const p = q.p || {}; const o = {id: p.id, name: p.name, race: p.race, spec: p.spec, sex: p.sex};
  for (const k of ['facility', 'trainingAt', 'resting', 'cls', 'look', 'gear', 'hair', 'skin']) if (p[k] !== undefined && typeof p[k] !== 'function') o[k] = p[k];
  return o; };
C.metaSlice = function(M){
  M = M || META; const o = {};
  for (const k in M) if (!SKIP.includes(k) && typeof M[k] !== 'function') o[k] = M[k];
  if (Array.isArray(o.memorial)) o.memorial = o.memorial.slice(-18);
  return JSON.parse(JSON.stringify(o));
};
C.info = function(){
  const people = CAMP.people.filter(q => q && q.p);
  const cast = people.map(q => ({i: q.id, k: q.kind, s: q.seat || 0, n: q.name || null, p: personOf(q)}));
  const trees = [], decor = [];
  for (const t of CAMP.trees || []) trees.push(Math.round(t.x), Math.round(t.y), t.v | 0);
  for (const d of CAMP.decor || []) decor.push([Math.round(d.x), Math.round(d.y), d.k]);
  const meta = C.metaSlice();
  return {t: 'c23i', W: CAMP_W, H: CAMP_H, meta, trees, decor, cast, people};
};
C.broadcast = function(force){
  if (!hostOn() || !inCamp()) return;
  const t = CAMP.t | 0, seats = C.seatsNow(); if (!seats.length) return;
  if (force || t % C.CHECK_F === 0 || !C.cur || seats.some(s => C.sent[s.seat] !== C.v)){
    const inf = C.info(), sig = JSON.stringify([inf.W, inf.H, inf.cast.map(c => c.i + c.k), inf.meta.facilities, inf.meta.holding, inf.meta.damaged, inf.meta.build, inf.meta.sites, (inf.meta.memorial || []).length, inf.trees.length]);
    if (sig !== C.sig || !C.cur){ C.sig = sig; C.v++; C.cur = inf; }
    C.cur.people = inf.people;
    const msg = Object.assign({}, C.cur, {v: C.v}); delete msg.people;
    const json = JSON.stringify(msg);
    for (const s of seats) if (C.sent[s.seat] !== C.v){
      if (json.length > C.META_MAX){ C.sent[s.seat] = C.v; C.stats.big = json.length; continue; }   // too big for one message: the guest keeps the plain lobby
      if (MPCOOP.host.send(s.seat, msg)){ C.sent[s.seat] = C.v; C.stats.info = json.length; }
    }
  }
  if (t % C.CSNAP_F) return;
  const snap = C.snap(C.cur.people);
  for (const s of seats) if (C.sent[s.seat] === C.v) MPCOOP.host.send(s.seat, snap);
};
C.isReady = seat => !!(window.MPCOOP && MPCOOP.seats && MPCOOP.seats[seat] && MPCOOP.seats[seat].ready);
C.snap = function(people){
  const p = people.map(q => [Math.round(q.x), Math.round(q.y), (q.left ? 1 : 0) | (q.moving ? 2 : 0) | (q.sparSide === 1 ? 4 : 0) | (q.face ? 8 : 0) | (q.kind === 'guest23' && C.isReady(q.seat) ? 16 : 0),
    Math.max(0, ROLES.indexOf(q.role || 'wander'))]);
  const s = {t: 'c23', v: C.v, f: CAMP.t | 0, p};
  try { const n = JSON.stringify(s).length, S = C.stats; S.n++; S.sum += n; S.max = Math.max(S.max, n); S.mean = Math.round(S.sum / S.n); } catch (e) {}
  return s;
};

/* ---- guest: take the camp ----------------------------------------------------------------------- */
const GG = C.G;
C.guestCamp = () => !!(L.on && window.MPCOOP && MPCOOP.role === 'guest' && MPCOOP.view === 'lobby' && GG.info);
{ const f = L.guestLive; L.guestLive = () => f() || (C.guestCamp() && !!MPCOOP.guest); }
C.setInfo = function(m){
  if (!m || !Array.isArray(m.cast) || !m.meta) return false;
  const M = Object.assign(typeof freshMeta === 'function' ? freshMeta() : {}, m.meta, {roster: [], retired: [], officers: m.meta.officers || []});
  const trees = []; for (let i = 0; i + 2 < (m.trees || []).length; i += 3) trees.push({x: m.trees[i], y: m.trees[i + 1], v: m.trees[i + 2]});
  const decor = (m.decor || []).map(d => ({x: d[0], y: d[1], k: d[2]}));
  const people = m.cast.map(c => ({id: c.i, kind: c.k, seat: c.s, name: c.n, p: c.p, x: 0, y: 0, tx: 0, ty: 0, left: false, moving: false, seed: (String(c.i).length * 7) % 10, role: 'wander'}));
  GG.info = m; GG.meta = M; GG.trees = trees; GG.decor = decor; GG.people = people; GG.snaps = []; GG.me = null;
  return true;
};
C.addSnap = function(s, now){
  if (!GG.info || !s || s.v !== GG.info.v || !Array.isArray(s.p)) return false;
  GG.snaps.push({at: now || performance.now(), s}); if (GG.snaps.length > 8) GG.snaps.shift();
  return true;
};
if (window.MPNET && MPNET.guest){
  const f = MPNET.guest;
  MPNET.guest = function(cb, o){
    if (cb && cb.onMessage){ const g = cb.onMessage; cb = Object.assign({}, cb, {onMessage: m => {
      if (m && m.t === 'c23i'){ if (L.on && C.setInfo(m) && MPCOOP.view === 'lobby') MPCOOP.renderGuest(); return; }
      if (m && m.t === 'c23'){ if (L.on) C.addSnap(m); return; }
      return g(m);
    }}); }
    return f.call(this, cb, o);
  };
}
/* place the ghost people at time now - DELAY, blending the two snapshots round it */
C.place = function(now){
  const S = GG.snaps; if (!S.length || !GG.people) return false;
  const at = now - C.DELAY_MS; let a = S[0], b = S[0];
  for (let i = 0; i < S.length; i++){ if (S[i].at <= at) a = S[i]; if (S[i].at >= at){ b = S[i]; break; } b = S[i]; }
  const k = b.at > a.at ? Math.max(0, Math.min(1, (at - a.at) / (b.at - a.at))) : 1;
  GG.people.forEach((q, i) => {
    const pa = a.s.p[i], pb = b.s.p[i] || pa; if (!pa) return;
    q.x = pa[0] + (pb[0] - pa[0]) * k; q.y = pa[1] + (pb[1] - pa[1]) * k;
    const fl = (k < 0.5 ? pa : pb)[2]; q.left = !!(fl & 1); q.moving = !!(fl & 2); q.sparSide = fl & 4 ? 1 : 0; q.face = !!(fl & 8); q.ready = !!(fl & 16);
    q.role = ROLES[(k < 0.5 ? pa : pb)[3]] || 'wander'; q.tx = q.x; q.ty = q.y;
  });
  GG.frame = Math.round(a.s.f + (b.s.f - a.s.f) * k);
  return true;
};
/* the guest's own figure: drawn where its own keys put it, pulled back to where the host has it */
C.predict = function(server, dtF){
  const g = GG; if (!server) return null;
  if (!g.me || Math.hypot(g.me.x - server.x, g.me.y - server.y) > C.PRED_SNAP){ g.me = {x: server.x, y: server.y}; return g.me; }
  const v = L.vec(L.keys);
  if (v.mx || v.my){ const n = Math.hypot(v.mx, v.my), sp = (typeof LEAD_WALK !== 'undefined' ? LEAD_WALK : 2.5) * dtF;
    const blk = (x, y) => { try { return typeof leaderBlocked === 'function' && leaderBlocked(x, y); } catch (e) { return false; } };
    const nx = g.me.x + v.mx / n * sp, ny = g.me.y + v.my / n * sp;
    if (!blk(nx, g.me.y)) g.me.x = nx; if (!blk(g.me.x, ny)) g.me.y = ny; }
  g.me.x += (server.x - g.me.x) * C.PRED_PULL; g.me.y += (server.y - g.me.y) * C.PRED_PULL;
  return g.me;
};
const CK = ['cam', 'people', 'trees', 'decor', 'puffs', 'fx', 'hover', 't', 'drag', 'mouse', 'ctrl'];
C.draw = function(now, cv){
  cv = cv || document.getElementById('mpco-camp23');
  if (!cv || !GG.info || typeof _drawCamp !== 'function') return false;
  now = now || performance.now();
  if (!C.place(now)) return false;
  const keep = {ctx, VW, VH, META, W: CAMP_W, H: CAMP_H, G}, ck = {}; for (const k of CK) ck[k] = CAMP[k];
  const meId = 'g23_' + (MPCOOP.G ? MPCOOP.G.seat : 0), mine = GG.people.find(q => q.id === meId);
  let ok = false;
  try {
    ctx = cv.getContext('2d'); VW = cv.width; VH = cv.height; META = GG.meta; CAMP_W = GG.info.W; CAMP_H = GG.info.H; G = null;
    const dtF = GG.lastAt ? Math.min(4, (now - GG.lastAt) / (1000 / 60)) : 1; GG.lastAt = now;
    if (mine){ const p = C.predict({x: mine.x, y: mine.y}, dtF); mine.x = p.x; mine.y = p.y; mine.moving = mine.moving || !!(L.vec(L.keys).mx || L.vec(L.keys).my); }
    const c = mine || {x: GG.info.W / 2, y: GG.info.H / 2};
    Object.assign(CAMP, {cam: {x: Math.round(c.x - VW / 2), y: Math.round(c.y - VH / 2)}, people: GG.people, trees: GG.trees, decor: GG.decor,
      puffs: [], fx: [], hover: null, t: GG.frame || 0, drag: null, mouse: {x: -1, y: -1, wx: -1, wy: -1}, ctrl: false});
    try { if (typeof w3dTileReset === 'function') w3dTileReset(); } catch (e) {}
    _drawCamp();
    // the seats' names over the visiting figures, and the HUD
    const cx = CAMP.cam.x, cy = CAMP.cam.y, x = ctx;
    x.setTransform(1, 0, 0, 1, 0, 0); x.textAlign = 'center'; x.font = 'bold 12px Georgia';
    for (const q of GG.people) if (q.kind === 'guest23'){
      const col = window.ALLY && ALLY.colour ? ALLY.colour(q.seat) : '#ffd860';
      x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.ellipse(q.x - cx, q.y - cy + 17, 15, 5, 0, 0, Math.PI * 2); x.stroke();
      x.fillStyle = col; x.fillText((q.name || 'Guest') + (q.id === meId ? ' (you)' : '') + (q.ready ? ' · READY' : ''), q.x - cx, q.y - cy - 34);
    }
    try { if (C.overlay) C.overlay(x, cx, cy, now); } catch (e) {}
    x.textAlign = 'left'; x.fillStyle = 'rgba(20,12,4,.7)'; x.fillRect(0, VH - 22, VW, 22); x.fillStyle = '#f3e6c8'; x.font = '12px Georgia';
    x.fillText(`${(MPCOOP.G && MPCOOP.G.host) || 'The host'}'s camp  ·  WASD: walk  ·  E: talk, bard, tavern  ·  Q: Quartermaster  ·  R: ready`, 8, VH - 7);
    ok = true;
  } catch (e) { console.warn('LIVE23 camp draw', e); }
  finally {
    ctx = keep.ctx; VW = keep.VW; VH = keep.VH; META = keep.META; CAMP_W = keep.W; CAMP_H = keep.H; G = keep.G;
    for (const k of CK) CAMP[k] = ck[k];
  }
  return ok;
};
/* E: look at the nearest person (guest-side only; nothing is sent) */
C.look = function(){
  const meId = 'g23_' + (MPCOOP.G ? MPCOOP.G.seat : 0), me = GG.me || (GG.people || []).find(q => q.id === meId); if (!me || !GG.people) return null;
  let best = null, bd = C.LOOK_R;
  for (const q of GG.people){ if (q.id === meId) continue; const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd){ bd = d; best = q; } }
  const what = q => q.kind === 'master' ? 'the Chapter Master' : q.kind === 'leader' ? 'the host\'s Squad Leader' : q.kind === 'officer' ? 'an officer'
    : q.kind === 'guest23' ? 'a visiting captain' : q.kind === 'vet' ? 'a veteran' : q.role === 'rest' ? 'resting' : q.role === 'train' ? 'in training'
    : q.role === 'spar' ? 'sparring' : q.role === 'build' ? 'building' : q.kind === 'bard' ? 'the bard' : 'a Squad Mate';
  GG.say = best ? `${(best.kind === 'guest23' ? best.name : best.p && best.p.name) || 'Someone'}: ${what(best)}.` : 'Nobody close enough to look at.';
  const el = document.getElementById('mpco-camp23-say'); if (el) el.textContent = GG.say;
  return GG.say;
};
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || !C.guestCamp()) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  e.preventDefault(); C.look();
}, true);
/* the lobby gets the camp view while the host sends one */
if (window.MPCOOP && MPCOOP.renderGuest){
  const f = MPCOOP.renderGuest;
  MPCOOP.renderGuest = function(){
    const r = f.apply(this, arguments);
    try {
      if (C.guestCamp() && !document.getElementById('mpco-camp23')){
        const h1 = document.querySelector('#mpco-root .mpco-in h1');
        if (h1) h1.insertAdjacentHTML('afterend', `<canvas id="mpco-camp23" width="640" height="360" style="display:block;width:100%;max-width:640px;margin:6px 0;background:#000;border:1px solid #6a5a3a"></canvas><div id="mpco-camp23-say" class="mpco-sub">${GG.say ? GG.say.replace(/[<>&]/g, '') : 'You are visiting the host\'s camp.'}</div>`);
      }
    } catch (e) {}
    return r;
  };
}
C.loop = function(){ try { if (C.guestCamp()) C.draw(); } catch (e) {} C.G.raf = requestAnimationFrame(C.loop); };
if (L.on) C.G.raf = requestAnimationFrame(C.loop);

/* ---- self-test rows ----------------------------------------------------------------------------- */
{ const f = L.selfTest; L.selfTest = function(){
  const r = f.apply(this, arguments), fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const on0 = L.on, role0 = window.MPCOOP && MPCOOP.role, host0 = MPCOOP.host, seats0 = MPCOOP.seats, G0 = G, people0 = CAMP.people, on0c = CAMP.on, t0 = CAMP.t;
  const figs0 = C.figs, sent0 = C.sent, v0 = C.v, sig0 = C.sig, cur0 = C.cur, GG0 = Object.assign({}, GG), stats0 = C.stats;
  try {
    L.on = true; const out = [];
    MPCOOP.role = 'host'; MPCOOP.seats = {2: {name: 'Pat', captain: {id: 'g2', name: 'Cap', race: 'HUMAN', spec: 'SOLDIER', sex: 'm'}}};
    MPCOOP.host = {connected: () => [{seat: 2}], send: (s, m) => { out.push([s, m]); return true; }};
    G = null; CAMP.on = true; CAMP.t = 600; CAMP.people = [{id: 'L', kind: 'leader', p: {id: 1, name: 'Host'}, x: 500, y: 500, role: 'wander'}];
    C.figs = {}; C.sent = {}; C.v = 0; C.sig = ''; C.cur = null; C.stats = {n: 0, max: 0, mean: 0, sum: 0, info: 0};
    const figs = C.ensureFigs();
    ok('camp: one visiting figure per connected seat', figs.length === 1 && CAMP.people.filter(q => q.kind === 'guest23').length === 1 && figs[0].p.name === 'Cap');
    ok('camp: host takes the keys outside a fight', L.take(2, {mx: 1, my: 0, s: 3}) && figs[0].input.mx === 1 && !L.take(2, {mx: -1, s: 2}));
    const x0 = figs[0].x; C.walk(figs[0], 1, 0);
    ok('camp: the figure walks', figs[0].x > x0 && figs[0].moving);
    { const P0 = CAMP.panel, el = document.getElementById('camp-panel'), h0 = el ? el.innerHTML : ''; let thrown = false;
      try { CAMP.panel = {kind: 'person', id: figs[0].id}; renderPanel(); } catch (e) { thrown = true; }
      ok('camp: the host panel for a visiting figure', !thrown && (!el || /Visiting captain/.test(el.innerHTML))); CAMP.panel = P0; if (el) el.innerHTML = h0; }
    C.broadcast();
    const inf = out.find(o => o[1].t === 'c23i'), sn = out.find(o => o[1].t === 'c23');
    ok('camp: info then snapshot to the seat', inf && sn && inf[0] === 2 && inf[1].cast.length === 2 && sn[1].p.length === 2 && sn[1].v === inf[1].v);
    ok('camp: the slice leaves the roster and chronicle out', inf && !inf[1].meta.roster && !inf[1].meta.chron && (!META || !META.facilities || inf[1].meta.facilities !== undefined));
    out.length = 0; CAMP.t = 606; C.broadcast();
    ok('camp: no resend of an unchanged camp', !out.some(o => o[1].t === 'c23i') && out.some(o => o[1].t === 'c23'));
    // guest side: take the info and two snapshots, place halfway
    MPCOOP.role = 'guest'; const keepG = MPCOOP.G; MPCOOP.G = Object.assign({}, keepG || {}, {seat: 2});
    ok('camp: the guest takes the info', C.setInfo(inf[1]) && GG.people.length === 2 && GG.meta && GG.meta.roster.length === 0);
    const s1 = {t: 'c23', v: inf[1].v, f: 600, p: [[100, 100, 0, 1], [200, 200, 2, 8]]}, s2 = {t: 'c23', v: inf[1].v, f: 606, p: [[110, 100, 0, 1], [220, 200, 3, 8]]};
    C.addSnap(s1, 1000); C.addSnap(s2, 1100);
    ok('camp: a snapshot of another version is dropped', !C.addSnap({t: 'c23', v: 999, p: []}, 1150));
    C.place(1050 + C.DELAY_MS);
    ok('camp: people blend between snapshots', Math.abs(GG.people[0].x - 105) < 0.01 && Math.abs(GG.people[1].x - 210) < 0.01 && GG.people[1].role === 'player');
    MPCOOP.G = keepG;
    L.on = false; MPCOOP.role = 'host';
    ok('camp: kill switch: no figures when off', C.ensureFigs().length === 0 && !CAMP.people.some(q => q.kind === 'guest23'));
  } catch (e) { fails.push('camp threw: ' + e.message); }
  finally {
    L.on = on0; MPCOOP.role = role0; MPCOOP.host = host0; MPCOOP.seats = seats0; G = G0; CAMP.people = people0; CAMP.on = on0c; CAMP.t = t0;
    C.figs = figs0; C.sent = sent0; C.v = v0; C.sig = sig0; C.cur = cur0; Object.assign(GG, GG0); C.stats = stats0;
  }
  if (fails.length) return {ok: false, info: ((r && r.info) || '') + '; camp FAIL: ' + fails.join(', ')};
  return r && r.ok === false ? r : {ok: true, info: ((r && r.info) || '') + '; .3a camp figures, keys, info/snapshot, blending, kill switch'};
}; }
})();

/* ===== F-23.3b: the guest talks, sits with the bard, plays at the tavern, and kits out their own squad (Lead Programmer, 2026-11-14) =====
   Behind ?live23=1 like the rest. Messages:
   guest -> host  {t:'t23', i}         talk to camp person i (the host's figure id). The host answers only when the visiting
                                       figure stands within TALK_R of them, at most once per TALK_GAP frames per seat.
   host -> guest  {t:'t23r', i, line}  the line; the host's camp shows it as a bark over that person too.
   guest -> host  {t:'kit23', loadout} the guest's Leader's loadout after a purchase or a swap (ARM.packLoadout). The host keeps
                                       ARM.sanitizeLoadout of it in the seat's captain (as on hello), only in camp, then re-sends the lobby.
   E near a person: talk (the bard: his song list). E near the host's tavern: the tavern (Crepitus at the host's table, your own
   purse and your own mates). Q: your own Quartermaster: your treasury, your deck, the host's camp's buildings as the unlocks.
   The guest's purchases go through the game's own gearClick on the guest's own save; for that one call META.facilities and
   META.damaged read the host's (the unlocks and the workshop discounts), and saving and the camp redraw are held until they are
   put back, so the host's buildings never reach the guest's save. The host's treasury and buildings are never touched.
   ROLLBACK: LIVE23.on = false (no talk, no panel, no kit message). */
(function(){
const L = window.LIVE23; if (!L || !L.camp) return;
const C = L.camp, GG = C.G;
Object.assign(C, {TALK_R: 90, TALK_GAP: 30, TAVERN_R: 120, BUBBLE_MS: 4500});   // [T]
const hostOn = () => !!(L.on && window.MPCOOP && MPCOOP.role === 'host' && MPCOOP.host);
const inCamp = () => typeof G !== 'undefined' && !G && typeof CAMP !== 'undefined' && CAMP.on && !(typeof inStoryNow === 'function' && inStoryNow());
const E = v => String(v == null ? '' : v).replace(/[<>&"]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c]));
const pick = a => a && a.length ? a[Math.random() * a.length | 0] : '';
const snd = n => { try { SFX.play(n); } catch (e) {} };

/* ---- host: talk and kit ---- */
C.lineFor = function(q){
  if (!q) return '';
  if (q.kind === 'guest23') return 'Good to see a friendly face.';
  if (q.kind === 'bard' || (q.p && q.p.spec === 'BARD')) return pick(typeof BARD_LINES !== 'undefined' ? BARD_LINES : []) || 'Requests? I take coin.';
  if (q.p && typeof barkFor === 'function'){ try { return barkFor(q.p); } catch (e) {} }
  return 'Welcome to our fire.';
};
C.talk = function(seat, m){
  if (!hostOn() || !inCamp() || !m) return false;
  const me = C.figs[seat]; if (!me) return false;
  const q = CAMP.people.find(x => String(x.id) === String(m.i)); if (!q || q === me) return false;
  if (Math.hypot(q.x - me.x, q.y - me.y) > C.TALK_R) return false;
  const t = CAMP.t | 0; if (me.talkF != null && t - me.talkF < C.TALK_GAP && t >= me.talkF) return false;
  me.talkF = t;
  const line = String(C.lineFor(q) || '').slice(0, 160); if (!line) return false;
  q.bark = line; q.barkLife = 260;
  try { if (window.VOICE15 && VOICE15.free) VOICE15.free.set(line, (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 6000); } catch (e) {}   // F-42: a guest's click-to-talk answer is asked for, like the host's: it skips the bark budget
  try { MPCOOP.host.send(seat, {t: 't23r', i: q.id, line}); } catch (e) {}
  return true;
};
C.kit = function(seat, m){
  if (!hostOn() || !inCamp() || !m || !window.ARM || typeof ARM.sanitizeLoadout !== 'function') return false;
  const s = MPCOOP.seats && MPCOOP.seats[seat]; if (!s || !s.captain) return false;
  s.captain.loadout = ARM.sanitizeLoadout(m.loadout);
  try { MPCOOP.sendLobby(); } catch (e) {} try { MPCOOP.refresh(); } catch (e) {}
  return true;
};
if (window.MPNET && MPNET.host){
  const f = MPNET.host;
  MPNET.host = function(cb, o){
    if (cb && cb.onMessage){ const g = cb.onMessage; cb = Object.assign({}, cb, {onMessage: (seat, m) => {
      if (m && m.t === 't23'){ if (L.on) C.talk(seat, m); return; }
      if (m && m.t === 'kit23'){ if (L.on) C.kit(seat, m); return; }
      return g(seat, m); }}); }
    return f.call(this, cb, o);
  };
}

/* ---- guest: the person or place in reach ---- */
const meId = () => 'g23_' + (MPCOOP.G ? MPCOOP.G.seat : 0);
C.meFig = () => GG.me || (GG.people || []).find(q => q.id === meId()) || null;
C.nearest = function(){
  const me = C.meFig(); if (!me || !GG.people) return null;
  let best = null, bd = C.LOOK_R;
  for (const q of GG.people){ if (q.id === meId()) continue; const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd){ bd = d; best = q; } }
  return best;
};
C.hostHas = id => !!(GG.meta && GG.meta.facilities && GG.meta.facilities[id] && !(GG.meta.damaged && GG.meta.damaged[id]));
C.atTavern = function(){
  const me = C.meFig(); if (!me || !C.hostHas('tavern') || typeof PLOTS === 'undefined' || !PLOTS.tavern) return false;
  return Math.hypot(PLOTS.tavern[0] - me.x, PLOTS.tavern[1] + 40 - me.y) < C.TAVERN_R;
};
C.say = function(s){ GG.say = s; const el = document.getElementById('mpco-camp23-say'); if (el) el.textContent = s; return s; };
C.lookOnly = C.look;
C.look = function(){            /* E (the .3a key handler calls C.look) */
  if (!L.on) return null;
  const q = C.nearest();
  if (q && (q.kind === 'bard' || (q.p && q.p.spec === 'BARD'))) return C.open('bard');
  if (q){ const nm = (q.kind === 'guest23' ? q.name : q.p && q.p.name) || 'Someone';
    try { MPCOOP.guest.send({t: 't23', i: q.id}); } catch (e) {}
    GG.talkTo = q.id; return C.say(nm + ' turns to you...'); }
  if (C.atTavern()) return C.open('tavern');
  return C.lookOnly();
};
C.heard = function(m, now){
  if (!m || !GG.people) return false;
  const q = GG.people.find(x => String(x.id) === String(m.i)); if (!q) return false;
  const line = String(m.line || '').slice(0, 160);
  GG.bub = {i: q.id, line, until: (now || performance.now()) + C.BUBBLE_MS};
  C.say(((q.kind === 'guest23' ? q.name : q.p && q.p.name) || 'Someone') + ': "' + line + '"');
  return true;
};
if (window.MPNET && MPNET.guest){
  const f = MPNET.guest;
  MPNET.guest = function(cb, o){
    if (cb && cb.onMessage){ const g = cb.onMessage; cb = Object.assign({}, cb, {onMessage: m => {
      if (m && m.t === 't23r'){ if (L.on) C.heard(m); return; }
      return g(m); }}); }
    return f.call(this, cb, o);
  };
}
/* the bubble over the person who answered (called from C.draw with the camp camera) */
C.overlay = function(x, cx, cy, now){
  const b = GG.bub; if (!b || now > b.until || !GG.people) return;
  const q = GG.people.find(p => p.id === b.i); if (!q) return;
  const px = q.x - cx, py = q.y - cy - 62;
  const bPx = typeof hudPx === 'function' ? hudPx(13, x) : 14, bh = Math.max(24, Math.ceil(bPx * 1.85)), by = py - bh + 6;
  x.font = `italic ${bPx}px Georgia`; const w = Math.min(300, x.measureText(b.line).width + 16);
  x.globalAlpha = Math.min(1, (b.until - now) / 400);
  x.fillStyle = 'rgba(255,248,230,.95)'; x.fillRect(px - w / 2, by, w, bh); x.strokeStyle = '#4a3b2a'; x.lineWidth = 2; x.strokeRect(px - w / 2, by, w, bh);
  x.fillStyle = '#2a1a0a'; x.textAlign = 'center'; x.fillText(b.line.length > 44 ? b.line.slice(0, 42) + '...' : b.line, px, py - 1); x.globalAlpha = 1;
};

/* ---- guest: the panels (bard, tavern, Quartermaster) under the camp view ---- */
GG.ui = null;
C.open = function(k){ GG.ui = k; snd('pick'); C.paint(); return k; };
C.close = function(){ GG.ui = null; C.paint(); };
C.paint = function(){
  const el = document.getElementById('mpco-c23p'); if (!el) return false;
  let h = ''; try { h = GG.ui === 'bard' ? C.bardHTML() : GG.ui === 'tavern' ? C.tavernHTML() : GG.ui === 'shop' ? C.shopHTML() : ''; } catch (e) { console.warn('LIVE23 panel', e); h = ''; }
  el.innerHTML = h; el.style.display = h ? 'block' : 'none';
  return !!h;
};
const X = '<button class="mpco-btn" style="float:right" onclick="LIVE23.camp.close()">Close</button>';
C.bardHTML = function(){
  const B = GG.meta && GG.meta.bard; if (!B || typeof bardPanelHTML !== 'function' || typeof META === 'undefined' || !META) return '';
  const real = META.bard; let h = '';
  META.bard = B; try { h = bardPanelHTML(); } finally { META.bard = real; }
  return X + '<div class="c23-bard">' + h.replace(/bardPick\(/g, 'LIVE23.camp.bardPick(').replace(/closePanel\(\)/g, 'LIVE23.camp.close()') + '</div>'
    + '<div class="mpco-sub">The host\'s bard plays what you pick, for you: your own music settings.</div>';
};
C.bardPick = function(id){ try { MUS.start(); MUS.setSong(id); } catch (e) {} snd('pick'); C.paint(); };
C.tavernHTML = function(){
  const host = (MPCOOP.G && MPCOOP.G.host) || 'The host';
  const chat = pick(window.TAVERN_LINES && TAVERN_LINES.crepChat) || 'Lamplight, woodsmoke and the clink of cups.';
  const tre = (typeof META !== 'undefined' && META && META.treasury) | 0;
  const can = window.CREPITUS && typeof CREPITUS.open === 'function' && window.TAVERN && typeof TAVERN.seats === 'function';
  return X + `<h3 style="margin:0 0 4px">${E(host)}'s tavern</h3><div class="mpco-sub"><i>"${E(chat)}"</i></div>`
    + (can ? `<p>Crepitus at the dice table: your own mates sit in, and you stake from your own purse (${tre}gp).</p><button class="mpco-btn" onclick="LIVE23.camp.crep()">PLAY CREPITUS</button>`
           : '<p>The dice table is busy.</p>');
};
C.crep = function(){
  if (!window.CREPITUS || !window.TAVERN) return false;
  const root = document.getElementById('mpco-root');
  const back = () => { GG.crep = false; if (root) root.style.display = ''; try { if (window.TAVERN && TAVERN.restoreChrome) TAVERN.restoreChrome(); } catch (e) {}
    try { if (typeof hideAll === 'function') hideAll(); } catch (e) {} try { MPCOOP.renderGuest(); } catch (e) {} };
  GG.crep = true; if (root) root.style.display = 'none';
  try { CREPITUS.open(TAVERN.seats().crep, {stake: 'low', onClose: back}); } catch (e) { console.warn('LIVE23 crepitus', e); back(); return false; }
  return true;
};
/* the march or a lost link while the guest is at the dice: back to the co-op screen at once */
C.crepGuard = function(){
  if (!GG.crep) return;
  if (!(window.MPCOOP && MPCOOP.view === 'lobby')){ try { CREPITUS.close(); } catch (e) {} if (GG.crep){ GG.crep = false; const r = document.getElementById('mpco-root'); if (r) r.style.display = ''; } }
};
setInterval(() => { try { C.crepGuard(); } catch (e) {} }, 500);

/* the Quartermaster: the guest's own purse and deck, the host's camp's buildings */
C.withHost = function(fn){
  const M = typeof META !== 'undefined' ? META : null; if (!M || !GG.meta) return undefined;
  const fac = M.facilities, dmg = M.damaged, sv = window.saveMeta, rc = window.renderCamp, sq = window.ARM && ARM.ui ? ARM.ui.sq : 0;
  let held = 0;
  M.facilities = Object.assign({}, GG.meta.facilities || {}); M.damaged = GG.meta.damaged ? Object.assign({}, GG.meta.damaged) : undefined;
  saveMeta = function(){ held++; }; renderCamp = function(){};
  if (window.ARM && ARM.ui) ARM.ui.sq = 0;
  try { return fn(); }
  finally { M.facilities = fac; if (dmg === undefined) delete M.damaged; else M.damaged = dmg; saveMeta = sv; renderCamp = rc; if (window.ARM && ARM.ui) ARM.ui.sq = sq; C.held = held; }
};
C.packed = () => (window.ARM && ARM.packLoadout && typeof META !== 'undefined' && META) ? ARM.packLoadout(META.gear) : null;
C.sendKit = function(){ const lo = C.packed(); if (!lo || !L.on) return false; try { return !!MPCOOP.guest.send({t: 'kit23', loadout: lo}); } catch (e) { return false; } };
C.buy = function(id){
  if (!L.on || typeof META === 'undefined' || !META || !META.gear || typeof gearClick !== 'function' || !GG.meta) return 'no';
  const t0 = META.treasury, g0 = JSON.stringify(META.gear), d0 = JSON.stringify(META.armoury || null);
  C.withHost(() => gearClick(id));
  const paid = META.treasury !== t0, changed = paid || JSON.stringify(META.gear) !== g0 || JSON.stringify(META.armoury || null) !== d0;
  if (!changed){ snd('nope'); C.paint(); return 'no'; }
  try { saveMeta(); } catch (e) {}
  C.sendKit(); snd(paid ? 'coin' : 'pick'); C.paint();
  try { MPCOOP.renderGuest(); } catch (e) {}
  return paid ? 'bought' : 'worn';
};
C.shopHTML = function(){
  if (typeof META === 'undefined' || !META || !META.gear || typeof GEAR === 'undefined') return '';
  const slots = [['armour', 'Armour'], ['shield', 'Shield'], ['melee', 'Melee'], ['ranged', 'Ranged'], ['kit', 'Kits (two)'], ['mount', 'Mount']];
  return C.withHost(() => {
    let h = X + `<h3 style="margin:0 0 2px">Your Quartermaster</h3><div class="mpco-sub">Your purse: <b>${META.treasury | 0}gp</b>. What ${E((MPCOOP.G && MPCOOP.G.host) || 'the host')}'s camp has built is what is on sale. Your Leader's squad wears it into the fight.</div>`;
    for (const [slot, label] of slots){
      h += `<div style="font-weight:bold;margin:6px 0 2px">${label}</div><div style="display:flex;flex-wrap:wrap;gap:4px">`;
      for (const g of GEAR.filter(x => x.slot === slot)){
        const owned = (META.gear.owned || []).includes(g.id), eq = slot === 'kit' ? (META.gear.kits || []).includes(g.id) : META.gear[slot] === g.id;
        const locked = (g.req || []).filter(r => !has(r)), price = typeof gearPrice === 'function' ? gearPrice(g) : g.cost;
        const st = eq ? 'WORN' : owned ? 'yours: wear' : locked.length ? 'needs ' + locked.map(r => { try { return facility(r).name; } catch (e) { return r; } }).join(' + ') : price + 'gp';
        const can = eq ? slot === 'kit' : owned || (!locked.length && META.treasury >= price);
        h += `<button class="mpco-btn c23-card${eq ? ' on' : ''}" ${can || eq ? '' : 'disabled'} onclick="LIVE23.camp.buy('${g.id}')" style="font-size:14px;padding:3px 6px">${E(g.name)}<br><span style="font-size:14px">${E(st)}</span></button>`;
      }
      h += '</div>';
    }
    return h;
  }) || '';
};
/* Q opens the Quartermaster; the panel and its buttons sit under the camp view */
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyQ' || !C.guestCamp() || GG.crep) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  e.preventDefault(); GG.ui === 'shop' ? C.close() : C.open('shop');
}, true);
if (window.MPCOOP && MPCOOP.renderGuest){
  const f = MPCOOP.renderGuest;
  MPCOOP.renderGuest = function(){
    const r = f.apply(this, arguments);
    try {
      const say = document.getElementById('mpco-camp23-say');
      if (say && !document.getElementById('mpco-c23p')){
        say.insertAdjacentHTML('afterend', `<div style="margin:2px 0 6px"><button class="mpco-btn" onclick="LIVE23.camp.open('shop')">QUARTERMASTER (Q)</button></div>`
          + `<div id="mpco-c23p" style="display:none;background:rgba(40,28,16,.92);border:1px solid #6a5a3a;padding:8px;margin:4px 0;max-width:640px;color:#f3e6c8"></div>`);
        C.paint();
      }
    } catch (e) {}
    return r;
  };
}
try { const st = document.createElement('style'); st.textContent = `#mpco-c23p .c23-card.on{outline:2px solid #ffd860} #mpco-c23p .c23-card[disabled]{opacity:.5}
  #mpco-c23p .c23-bard .card{background:#f3e6c8;color:#2a1a0a} #mpco-c23p .c23-bard .x{display:none} #mpco-c23p .c23-bard img.pimg{max-height:90px}`; document.head.appendChild(st); } catch (e) {}

/* ---- self-test rows ---- */
{ const f = L.selfTest; L.selfTest = function(){
  const r = f.apply(this, arguments), fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const on0 = L.on, role0 = MPCOOP.role, host0 = MPCOOP.host, seats0 = MPCOOP.seats, G0 = G, people0 = CAMP.people, on0c = CAMP.on, t0 = CAMP.t;
  const figs0 = C.figs, GG0 = Object.assign({}, GG), M0 = META, keepG = MPCOOP.G, guest0 = MPCOOP.guest, sv0 = window.saveMeta;
  let saves = 0; const rg0 = MPCOOP.renderGuest, sl1 = MPCOOP.sendLobby, rf1 = MPCOOP.refresh;
  MPCOOP.renderGuest = () => {}; MPCOOP.sendLobby = () => {}; MPCOOP.refresh = () => {};
  try {
    L.on = true; const out = [];
    MPCOOP.role = 'host'; MPCOOP.seats = {2: {name: 'Pat', captain: {id: 'g2', name: 'Cap', race: 'HUMAN', spec: 'SOLDIER', sex: 'm'}}};
    MPCOOP.host = {connected: () => [{seat: 2}], send: (s, m) => { out.push([s, m]); return true; }, broadcast: () => true};
    G = null; CAMP.on = true; CAMP.t = 900;
    const mate = {id: 'm1', kind: 'mate', p: {id: 11, name: 'Bo', race: 'HUMAN', spec: 'SOLDIER', injuries: []}, x: 520, y: 500, role: 'wander'};
    CAMP.people = [mate]; C.figs = {};
    const fig = C.ensureFigs()[0]; fig.x = 500; fig.y = 500;
    ok('.3b talk: the host answers a guest in reach', C.talk(2, {i: 'm1'}) && out.some(o => o[1].t === 't23r' && o[1].i === 'm1' && o[1].line) && mate.bark);
    ok('.3b talk: not twice inside the gap', !C.talk(2, {i: 'm1'}));
    CAMP.t = 990; fig.x = 900;
    ok('.3b talk: not out of reach', !C.talk(2, {i: 'm1'}));
    const sl0 = MPCOOP.sendLobby, rf0 = MPCOOP.refresh; MPCOOP.sendLobby = () => {}; MPCOOP.refresh = () => {};
    try { ok('.3b kit: the host keeps a checked loadout', C.kit(2, {loadout: {armour: 'halfplate', melee: 'nonsense', kits: []}}) && MPCOOP.seats[2].captain.loadout.armour === 'halfplate' && MPCOOP.seats[2].captain.loadout.melee !== 'nonsense');
    G = {}; ok('.3b kit: ignored during a fight', !C.kit(2, {loadout: {armour: 'padded'}}) && MPCOOP.seats[2].captain.loadout.armour === 'halfplate'); G = null; } finally { MPCOOP.sendLobby = sl0; MPCOOP.refresh = rf0; G = null; }
    // guest side: buy from the guest's own purse with the host's buildings as the unlocks
    MPCOOP.role = 'guest'; MPCOOP.G = Object.assign({}, keepG || {}, {seat: 2, host: 'Host'});
    const sent = []; MPCOOP.guest = {send: m => { sent.push(m); return true; }};
    const lockedG = GEAR.find(g => g.slot === 'armour' && (g.req || []).length === 1 && g.req[0][0] !== '@' && g.req[0][0] !== '#' && g.cost > 0);
    META = migrateMeta({treasury: 5000, leader: {name: 'Al', race: 'HUMAN', cls: 'FIGHTER', spec: 'VETERAN', level: 3, id: 1, injuries: [], picks: []},
      gear: {armour: 'padded', shield: 'bucklers', melee: 'spears', ranged: 'shortbows', kits: [], mount: 'nomount', owned: ['rags', 'padded', 'none', 'bucklers', 'spears', 'shortbows', 'nomount']},
      officers: [], roster: [], facilities: {}});
    saveMeta = function(){ saves++; };
    GG.meta = {facilities: {}, damaged: null}; GG.info = GG.info || {v: 1};
    ok('.3b buy: refused when the host has not built it', lockedG && C.buy(lockedG.id) === 'no' && META.treasury === 5000 && !sent.length);
    GG.meta = {facilities: {[lockedG.req[0]]: true}};
    const r1 = C.buy(lockedG.id);
    ok('.3b buy: bought from the guest purse and worn', r1 === 'bought' && META.treasury < 5000 && META.gear.armour === lockedG.id);
    ok('.3b buy: the host buildings never stay in the guest save', !META.facilities[lockedG.req[0]] && saves === 1);
    ok('.3b buy: the new loadout goes to the host', sent.some(m => m.t === 'kit23' && m.loadout && m.loadout.armour === lockedG.id));
    ok('.3b shop: the page lists the host unlocks', /Your Quartermaster/.test(C.shopHTML()) && !META.facilities[lockedG.req[0]]);
    GG.people = [{id: 'm1', kind: 'mate', p: {name: 'Bo'}, x: 0, y: 0}];
    ok('.3b talk: the guest shows the answer', C.heard({i: 'm1', line: 'When do we march?'}, 1000) && GG.bub && GG.bub.line === 'When do we march?');
    L.on = false; sent.length = 0;
    ok('.3b kill switch: nothing bought or sent while off', C.buy(lockedG.id) === 'no' && !sent.length);
  } catch (e) { fails.push('.3b threw: ' + e.message); }
  finally { MPCOOP.renderGuest = rg0; MPCOOP.sendLobby = sl1; MPCOOP.refresh = rf1;
    L.on = on0; MPCOOP.role = role0; MPCOOP.host = host0; MPCOOP.seats = seats0; G = G0; CAMP.people = people0; CAMP.on = on0c; CAMP.t = t0;
    C.figs = figs0; Object.assign(GG, GG0); META = M0; MPCOOP.G = keepG; MPCOOP.guest = guest0; saveMeta = sv0;
  }
  if (fails.length) return {ok: false, info: ((r && r.info) || '') + '; .3b FAIL: ' + fails.join(', ')};
  return r && r.ok === false ? r : {ok: true, info: ((r && r.info) || '') + '; .3b talk, kit, own-purse buy'};
}; }
})();

/* ===== F-23.4: ready-up in the camp, one march (Lead Programmer, 2026-11-14) =====
   The guest presses R in the host's camp (or the lobby's READY button, as before): MPCOOP.guestReady sends {t:'ready'}.
   The host's camp shows each visiting captain's name with READY or "not ready" over their figure; the camp snapshot carries
   the flag (bit 16) so every guest sees who is ready too. The host's table already lists who is ready and SIGN AND MARCH
   takes everyone (or goes without the unready after MARCH_WAIT_S): that is the one march. On 'start' the guest's view leaves
   the camp for the field and the camp panel closes. ROLLBACK: LIVE23.on = false. */
(function(){
const L = window.LIVE23; if (!L || !L.camp) return;
const C = L.camp, GG = C.G;
const hostOn = () => !!(L.on && window.MPCOOP && MPCOOP.role === 'host' && MPCOOP.host);
const inCamp = () => typeof G !== 'undefined' && !G && typeof CAMP !== 'undefined' && CAMP.on && !(typeof inStoryNow === 'function' && inStoryNow());
C.toggleReady = function(){
  if (!L.on || !C.guestCamp() || typeof MPCOOP.guestReady !== 'function') return null;
  MPCOOP.guestReady(); return !!(MPCOOP.G && MPCOOP.G.ready);
};
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyR' || !C.guestCamp() || GG.crep) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  e.preventDefault(); C.toggleReady();
}, true);
/* the host's camp: names and ready flags over the visiting figures */
C.hostLabels = function(){
  if (!hostOn() || !inCamp() || typeof ctx === 'undefined') return 0;
  let n = 0; const x = ctx;
  for (const q of CAMP.people){ if (q.kind !== 'guest23') continue;
    const s = MPCOOP.seats && MPCOOP.seats[q.seat], ready = C.isReady(q.seat), col = window.ALLY && ALLY.colour ? ALLY.colour(q.seat) : '#ffd860';
    const px = q.x - CAMP.cam.x, py = q.y - CAMP.cam.y; if (px < -80 || px > VW + 80 || py < -60 || py > VH + 60) continue;
    x.setTransform(1, 0, 0, 1, 0, 0); x.textAlign = 'center'; x.font = 'bold 12px Georgia';
    x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.ellipse(px, py + 17, 15, 5, 0, 0, Math.PI * 2); x.stroke();
    const label = ((s && s.name) || 'Guest') + (ready ? ' · READY' : ' · not ready');
    x.lineWidth = 3; x.strokeStyle = 'rgba(20,12,4,.85)'; x.strokeText(label, px, py - 40); x.fillStyle = ready ? '#9be37a' : col; x.fillText(label, px, py - 40);
    n++; }
  x.textAlign = 'left';
  return n;
};
if (typeof drawCamp === 'function'){ const f = drawCamp; drawCamp = function(){ const r = f.apply(this, arguments); try { C.hostLabels(); } catch (e) {} return r; }; }
/* the host's panel for a visiting figure says whether they are ready */
if (typeof renderPanel === 'function'){ const f = renderPanel; renderPanel = function(){ const r = f.apply(this, arguments);
  try { const P = typeof CAMP !== 'undefined' && CAMP.panel;
    if (P && P.kind === 'person' && String(P.id).indexOf('g23_') === 0){ const el = document.getElementById('camp-panel'), seat = +String(P.id).slice(4);
      if (el) el.insertAdjacentHTML('beforeend', `<div class="desc" style="text-align:left"><b>${C.isReady(seat) ? 'Ready to march.' : 'Not ready yet.'}</b> SIGN AND MARCH at the planning table takes every ready friend.</div>`); } } catch (e) {}
  return r; }; }
/* leaving the camp for the field: close the panel */
{ const f = MPCOOP.renderGuest; if (f) MPCOOP.renderGuest = function(){ if (MPCOOP.view !== 'lobby') GG.ui = null; return f.apply(this, arguments); }; }

/* ---- self-test rows ---- */
{ const f = L.selfTest; L.selfTest = function(){
  const r = f.apply(this, arguments), fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const on0 = L.on, role0 = MPCOOP.role, host0 = MPCOOP.host, seats0 = MPCOOP.seats, G0 = G, people0 = CAMP.people, on0c = CAMP.on, figs0 = C.figs, GG0 = Object.assign({}, GG);
  try {
    L.on = true; MPCOOP.role = 'host'; MPCOOP.seats = {2: {name: 'Pat', ready: true, captain: {id: 'g2', name: 'Cap'}}, 3: {name: 'Sam', ready: false, captain: {id: 'g3', name: 'Cap2'}}};
    MPCOOP.host = {connected: () => [{seat: 2}, {seat: 3}], send: () => true};
    G = null; CAMP.on = true; CAMP.people = []; C.figs = {};
    const figs = C.ensureFigs(), sn = C.snap(CAMP.people);
    const f2 = CAMP.people.indexOf(figs.find(q => q.seat === 2)), f3 = CAMP.people.indexOf(figs.find(q => q.seat === 3));
    ok('.4 the snapshot carries the ready flag', (sn.p[f2][2] & 16) && !(sn.p[f3][2] & 16));
    GG.people = [{id: 'a'}, {id: 'b'}]; GG.snaps = [{at: 0, s: {f: 1, p: [[0, 0, 16, 8], [0, 0, 0, 8]]}}];
    C.place(1000);
    ok('.4 the guest reads the ready flag', GG.people[0].ready === true && GG.people[1].ready === false);
    L.on = false; ok('.4 kill switch: R does nothing while off', C.toggleReady() === null);
  } catch (e) { fails.push('.4 threw: ' + e.message); }
  finally { L.on = on0; MPCOOP.role = role0; MPCOOP.host = host0; MPCOOP.seats = seats0; G = G0; CAMP.people = people0; CAMP.on = on0c; C.figs = figs0; Object.assign(GG, GG0); }
  if (fails.length) return {ok: false, info: ((r && r.info) || '') + '; .4 FAIL: ' + fails.join(', ')};
  return r && r.ok === false ? r : {ok: true, info: ((r && r.info) || '') + '; .4 ready flags'};
}; }
})();
