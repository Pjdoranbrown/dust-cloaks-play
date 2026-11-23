/* INDEX F33: F-33 Drills and books, build step 1: the pointer and the manual Leader.
   Scope: audits/drills-books.md (Scope, step 1).
   - Left click on the field: the Leader shoots one volley at the cursor (the squad ranged weapon, unitAttack's own numbers,
     its timer as the cooldown). Hold the button to keep shooting at the cursor.
   - Right click (or Ctrl+click, or the X key at the cursor): the Leader swings at the enemy nearest the cursor in reach.
     An enemy out of reach is a Charge: the Leader runs at it (WASD cancels), swings on arrival with the +1 Charge step.
   - The browser's context menu is suppressed on the game canvas while a contract runs.
   - Clicks on the Command Deck band, the Momentum cards, Parley or the pause screen are not field clicks.
   - While manual, the Leader never attacks on their own; passives (Magic Missile, Mending Prayer...) go on.
   Hook: index.html, the Leader's unitAttack call in update(). No master switch (F33.all, F33.setAll and ?f33 were removed in INT-1, 2026-11-15).
   Step 2: a click on an enemy marks it (G.mark33, a ring under it; K37); undrilled mates attack only the mark and otherwise
   defend themselves; drilled mates (p.drills.cut / .fire) attack on their own, the mark first. See F.pick below.
   Step 8 (co-op seats): the host's mark, keys and drills reach the host's own squad only (F.host). ALLY1 squads and online
   guest squads (G.allies, u.seatAlly) keep their own AI and targeting, so they count as drilled and a guest is never weaker.
   The guest mark (Patrick OK 2026-11-14): a guest's click on an enemy in its field glass sends {t:'mark', id} (js/mp/coop.js);
   the host sets sq.mark on that guest's squad only (F.seatMarkSet) and its units go for it first (F.seatMark, js/combat/ally.js).
   THE WHOLE SET IS ON BY DEFAULT (Patrick 2026-11-15, "the squad mates attack only the enemies you mark, as the auto
   attacks were scoped as upgrades to get"): all of it is on, so the manual Leader, the mark, the Barracks drills, the
   per-character keys (js/combat/abilities-f33.js), the books (js/camp/books.js) and the guest mark all run. The test bots play it too
   (.claude/bot.js B.f33). The clicks and the mark: F33.setClicks(false) or ?clicks=0 gives the automatic Leader back. No part switches (F33.on.manual, mark, coopMark, drills and the K16 to K21 lines were removed in INT-1, 2026-11-15). */
(function(){
  const F = window.F33 = window.F33 || {};
  F.K = Object.assign({seatMarkR: 560, pickR: 40, chargeMax: 420, chargeFrames: 240, chargeBarkCd: 90, holdFrames: 30, contactPad: 6, rushFrames: 24}, F.K || {});
  F.clicks = F.clicks !== false && !/[?&]clicks=0/.test(location.search);
  F.clicksOn = () => !!F.clicks;
  F.MOVE_TIP_ALL = 'WASD moves the Leader. Left click shoots and right click swings. Click an enemy to mark it: your Squad Mates attack the mark. The dashed ring is the Command Radius.';
  F.setClicks = function(on){   // the kill switch; also keeps the first field tip true
    F.clicks = !!on;
    try { if (typeof TIPS !== 'undefined' && TIPS.move){ if (F.move0 == null) F.move0 = TIPS.move; TIPS.move = !F.clicks ? F.move0 : F.MOVE_TIP_ALL; } } catch (e) {}
    return F.clicks;
  };
  F.manual = () => !!(F.clicksOn() && typeof G !== 'undefined' && G && !(typeof isBrawl === 'function' && isBrawl()));
  F.mouse = {x: -1, y: -1, held: 0, since: null};
  F.q = null; F.charge = null;

  /* ---- screen <-> world (the camera follows the Leader; index.html draw() and js/3d/vo2.js use the same sums) ---- */
  const camOff = () => { if (typeof camView === 'function') return camView();   /* A2: the zoomed camera (js/combat/deployment.js) */
    const L = G.leader; return {x: Math.round(L.x - VW / 2), y: Math.round(L.y - VH / 2 - (typeof camDY === 'function' ? camDY() : 0)), z: 1}; };
  const rect = () => (typeof canvas !== 'undefined' && canvas && canvas.getBoundingClientRect) ? canvas.getBoundingClientRect() : {left: 0, top: 0};
  F.toWorld = (cx, cy) => { const c = camOff(), r = rect(); return {x: (cx - r.left) / c.z + c.x, y: (cy - r.top) / c.z + c.y}; };
  F.toScreen = (wx, wy) => { const c = camOff(), r = rect(); return {x: (wx - c.x) * c.z + r.left, y: (wy - c.y) * c.z + r.top}; };

  /* ---- what counts as a field click ---- */
  const hudK = () => { const u = window.UX83 || window.UX; return u && u.hudK ? u.hudK() : 1; };
  F.inBand = cy => !!(window.DECK && DECK.H && cy - rect().top >= VH - DECK.H * hudK());
  F.fieldOK = () => F.manual() && !G.over && !G.paused && !(typeof PARLAY !== 'undefined' && PARLAY) && !F.onCard() && !G.leader.down && !(window.F34 && F34.making) && !(G.f45 && G.f45.making);   // Q52 note N2: no click or X reaches the field while the Founding Creator is open
  // F-41: the field runs while the Momentum cards are open; only a click on a card itself is not an order
  F.onCard = () => { const ch = G.momChoice; return !!(ch && !G.momHidden && ch.rects && ch.rects.some(r => F.mouse.x >= r.x && F.mouse.x <= r.x + r.w && F.mouse.y >= r.y && F.mouse.y <= r.y + r.h)); };
  F.kindOf = e => (e.button === 2 || (e.button === 0 && (e.ctrlKey || e.metaKey))) ? 'swing' : e.button === 0 ? 'shoot' : null;

  const reachOf = () => 46 + (G.melee.reach || 0) + (G.reachBonus || 0);
  const live = e => e && !e.dead && !(e.dormant && !e.seen);
  F.foeAt = function(wx, wy, r){   // the live enemy nearest the point, within r
    let best = null, bd = r == null ? F.K.pickR : r;
    for (const e of G.enemies) if (live(e)){ const d = Math.hypot(e.x - wx, e.y - wy) - (e.r || 0) * 0.5; if (d < bd){ bd = d; best = e; } }
    return best;
  };
  F.swingTarget = function(wx, wy){   // {e, inReach}: under the cursor first, else the foe in reach nearest the cursor
    const L = G.leader, R = reachOf(), e = F.foeAt(wx, wy);
    if (e) return {e, inReach: dist(L, e) < R};
    let best = null, bd = 1e9;
    for (const o of G.enemies) if (live(o) && dist(L, o) < R){ const d = Math.hypot(o.x - wx, o.y - wy); if (d < bd){ bd = d; best = o; } }
    return best ? {e: best, inReach: true} : null;
  };

  /* ---- orders ---- */
  F.order = function(kind, wx, wy, rep){   // rep: a held button re-firing; it may swing in reach but never starts a charge (GD E1: one press, one charge)
    if (!F.fieldOK()) return false;
    if ((kind === 'shoot' || kind === 'swing') && window.B45 && B45.holdFire && B45.holdFire(wx, wy)) return true;   // GD 22 Nov: a click (left or right) on a waiting yard dummy fires or swings nothing and marks nothing; it says why
    if (F.markOn()){ const m = F.foeAt(wx, wy); if (m) F.setMark(m); }   // a click on an enemy marks it (step 2)
    if (kind === 'shoot'){ F.stopCharge(); F.q = {kind, x: wx, y: wy, t: G.frame}; return true; }
    if (kind !== 'swing') return false;
    const t = F.swingTarget(wx, wy);
    if (t && t.e && window.B45 && B45.holdFire && B45.holdFire(t.e.x, t.e.y)) return true;   // GD 22 Nov: a swing that would land on a waiting dummy is held too
    if (t && t.inReach){ F.stopCharge(); F.q = {kind, e: t.e, t: G.frame}; return true; }
    if (t && !rep && dist(G.leader, t.e) <= F.K.chargeMax){ F.startCharge(t.e); return true; }
    if (!rep) F.stopCharge();   // a right click on empty ground cancels a charge
    F.q = null; return false;
  };
  const held = {};   // the movement keys a charge is pressing for the Leader
  const release = () => { for (const k in held){ keys[k] = false; delete held[k]; } };
  F.startCharge = function(e){
    if (F.charge && F.charge.e === e) return;
    release(); F.q = null; F.charge = {e, t0: G.frame, w0: (typeof performance !== 'undefined' ? performance.now() : Date.now())};
    if (G.frame - (G._chargeBarkF == null ? -999 : G._chargeBarkF) >= F.K.chargeBarkCd){ G._chargeBarkF = G.frame; pop(G.leader.x, G.leader.y - 30, 'CHARGE!', '#ffd860'); }
  };
  F.stopCharge = function(){ F.charge = null; release(); };
  F.steer = function(){
    const C = F.charge, L = G.leader; if (!C) return;
    if (G.formation === 'SHIELD'){ F.stopCharge(); return; }   // Brace / Shield Wall cancels (GD E1)
    { const d0 = dist(L, C.e); if (C.dm === undefined || d0 < C.dm) C.dm = d0; else if (d0 > C.dm + 8){ F.stopCharge(); return; } }   // the distance began to grow: never overrun
    if (!live(C.e) || L.down || G.frame - C.t0 > F.K.chargeFrames || (C.w0 && (typeof performance !== 'undefined' ? performance.now() : Date.now()) - C.w0 > (F.K.chargeMs || 2500))){ F.stopCharge(); return; }   // F-43: also a wall-clock cap, so a 1 fps field cannot run a charge for two minutes
    if (dist(L, C.e) < reachOf()){
      F.stopCharge();
      if (G.formation !== 'SHIELD'){ G.chargeT = Math.max(G.chargeT || 0, 30); G.chargeAnnounce = true; }
      F.q = {kind: 'swing', e: C.e, t: G.frame}; return;
    }
    release();
    const a = Math.atan2(C.e.y - L.y, C.e.x - L.x), cx = Math.cos(a), cy = Math.sin(a);
    if (cx > 0.38) held.d = 1; else if (cx < -0.38) held.a = 1;
    if (cy > 0.38) held.s = 1; else if (cy < -0.38) held.w = 1;
    for (const k in held) keys[k] = true;
  };

  /* fire one order through unitAttack itself, steering its target choice, so every weapon rule stays in one place */
  F.fire = function(q, L, shieldWall){
    const orig = nearest, sp = specPassive; let firstLos = true;
    const R = reachOf();
    nearest = function(from, reach, skip, los){
      if (from !== L) return orig.apply(this, arguments);
      if (q.kind === 'shoot'){
        if (!los) return null;                                              // never the melee branch
        if (firstLos){ firstLos = false; return {x: q.x, y: q.y, k: 'point'}; }   // the first arrow flies at the cursor
        return orig.apply(this, arguments);                                 // volley extras: the usual nearest
      }
      if (!los && !(skip && skip.size)) return live(q.e) && dist(L, q.e) < R ? q.e : null;
      if (los){ if (firstLos && live(q.e)){ firstLos = false; return q.e; } return null; }   // point-blank Folk Heroes shoot their target
      return orig.apply(this, arguments);                                   // Sweep's extra targets
    };
    specPassive = function(){};
    try { unitAttack(L, true, shieldWall); } finally { nearest = orig; specPassive = sp; }
  };

  /* ---- step 2: the mark and the mate AI ----
     Undrilled mates attack only the mark when it is in range (melee reach first, then the ranged weapon). With no mark in
     range they defend themselves: they swing at an enemy in contact (inside that enemy's own reach + contactPad) and never
     shoot on their own. Drilled mates (p.drills.cut = melee, p.drills.fire = ranged) attack on their own as before, but a
     mark in range always comes first. Only the host's own squad (G.squad) is touched; the Leader, allied and guest squads
     keep their own targeting. Hook: index.html unitAttack, the melee and ranged picks call F33.pick. */
  F.markOn = () => !!(F.clicksOn() && typeof G !== 'undefined' && G && !(typeof isBrawl === 'function' && isBrawl()));
  /* K37 (UX 2026-11-16): the click mark has its own field, G.mark33. G.mark is the Assassinate target (index.html), and
     sharing it let a click replace the target and a dead mark crash contractCheck. Off: F33.ownMark = false (shared, as before). */
  F.ownMark = true;   // K37 switch on its own line
  F.MF = () => F.ownMark ? 'mark33' : 'mark';
  F.setMark = function(e){ const k = F.MF(); if (G[k] !== e){ G[k] = e; if (G.fx) G.fx.push({ring: true, x: e.x, y: e.y, r: (e.r || 10) + 26, life: 14, c: '#ff5a3a'}); F.markTip(e); } };
  F.markTip = function(e){   // Narrative section 5: the tip once ever (TIPS.mark33 via tip()), the short HUD line on the first mark of each contract
    try { if (typeof TIPS !== 'undefined') TIPS.mark33 = F.TXT.mark; if (typeof tip === 'function') tip('mark33');
          if (!G.mark33said){ G.mark33said = true; if (typeof pop === 'function') pop(e.x, e.y - 30, F.TXT.markHud, '#ff9a7a'); } } catch (err) {}
  };
  F.mark = function(){ const k = F.MF(), m = G && G[k]; if (m && !live(m)) G[k] = null; return G && G[k] || null; };
  F.host = u => !!u && typeof G !== 'undefined' && !!G && !u.seatAlly && !u.ally && !u.auxUnit
    && (u === G.leader || (Array.isArray(G.squad) && G.squad.includes(u)));   // step 8: the host's own Leader and squad
  F.drillsOf = u => (u && u.p && u.p.drills) || {};
  F.inContact = (u, e) => { const B = typeof BESTIARY !== 'undefined' && BESTIARY[e.k]; return dist(u, e) <= (e.r || 10) + (B && B.sweep ? 22 : 9) + F.K.contactPad; };
  F.pick = function(u, reach, skip, los, isLeader){
    if (isLeader || !F.markOn() || !F.host(u) || u === G.leader) return nearest(u, reach, skip, los);
    if (F.rushOn(u)){ if (los) return null; const rt = F.rush.e; return live(rt) && dist(u, rt) < reach && !(skip && skip.has(rt)) ? rt : null; }   // P23-E3: the order swings at the target, never shoots
    const m = F.mark(), d = F.drillsOf(u);
    if (m && !(skip && skip.has(m)) && dist(u, m) < reach && (!los || losLine(u, m))) return m;   // the mark first
    if (!los){
      if (d.cut) return nearest(u, reach, skip);
      let best = null, bd = 1e9;                                                                  // self-defence
      for (const e of G.enemies) if (live(e) && !(skip && skip.has(e)) && F.inContact(u, e)){ const dd = dist(u, e); if (dd < reach && dd < bd){ bd = dd; best = e; } }
      return best;
    }
    return d.fire ? nearest(u, reach, skip, los) : null;
  };
  /* ---- P23-E3 (GD ruling 3): the right button held 0.4 s in melee sends every free Squad Mate at the Leader's target ----
     F.rush = {e: the target}. Mates walk to it (deployment.js updateMates asks F.rushPoint) and swing their melee attack (F.pick above).
     Ends on release, Brace, the Leader down, or no target. No new numbers: no Charge bonus for the Mates. */
  F.rush = null;
  F.rushOn = u => !!(F.rush && u && u !== G.leader && u.state === 'up' && !u.job && F.host(u) && Array.isArray(G.squad) && G.squad.includes(u));
  F.rushPoint = function(u){ const e = F.rush.e, a = Math.atan2(u.y - e.y, u.x - e.x), d = (e.r || 10) + 14; return {x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d}; };
  F.rushTick = function(){
    if (!F.markOn() || !F.fieldOK() || G.formation === 'SHIELD' || F.mouse.held !== 2){ F.rush = null; return; }
    const w = F.toWorld(F.mouse.x, F.mouse.y), st = F.swingTarget(w.x, w.y);
    if (F.rush){
      if (live(F.rush.e)) return;
      if (st && st.inReach){ F.setMark(st.e); F.rush = {e: st.e}; } else F.rush = null;   // the next foe the Leader swings at, else the order ends
      return; }
    if (F.mouse.since == null || G.frame - F.mouse.since < F.K.rushFrames || !(st && st.inReach)) return;
    F.rush = {e: st.e}; F.setMark(st.e);
    if (G._rushBarkSince !== F.mouse.since){ G._rushBarkSince = F.mouse.since; pop(G.leader.x, G.leader.y - 30, 'SQUAD, ON HIM!', '#ff9a7a'); }
  };
  F.drawMark = function(ctx){   // in world space, under the bodies
    if (!ctx) return;
    const ring = (m, col) => { const r = (m.r || 10) + 8, k = 0.55 + 0.25 * Math.sin((G.frame || 0) * 0.15);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -(G.frame || 0) * 0.4;
      ctx.beginPath(); ctx.ellipse(m.x, m.y + 4, r, r * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
    const m = F.markOn() && F.mark(); if (m) ring(m, '#ff5a3a');
    if (F.rush) for (const u of (G.squad || [])) if (F.rushOn(u)){ ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(u.x, u.y + 6, 12, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }   // P23-E3: the mark's colour at each charging Mate's feet
    if (F.coopMarkOn()) for (const sq of (G.allies || [])) if (sq.mark && live(sq.mark)) ring(sq.mark, window.ALLY && ALLY.colour ? ALLY.colour(sq.seat) : '#8fd3ff');
  };
  /* ---- step 8, the guest mark: a guest marks an enemy for its own squad from the field glass ----
     Enemies get a small id (e.mid) only when a snapshot or a mark needs one. Only a squad whose seat is a live guest can hold
     a mark; a dropped seat (controller 'ai' or 'ai_takeover') drops it. Range F.K.seatMarkR [S] (twice ALLY.ENGAGE). */
  F.coopMarkOn = () => !!(typeof G !== 'undefined' && G && !(typeof isBrawl === 'function' && isBrawl()));
  F.mid = e => e.mid || (e.mid = (G.midN = (G.midN || 0) + 1));
  F.seatMarkSet = function(sq, id){
    if (!F.coopMarkOn() || !sq || sq.controller !== 'guest' || !id) return false;
    const e = (G.enemies || []).find(x => x.mid === id && live(x)); if (!e) return false;
    sq.mark = e;
    if (G.fx) G.fx.push({ring: true, x: e.x, y: e.y, r: (e.r || 10) + 26, life: 14, c: window.ALLY && ALLY.colour ? ALLY.colour(sq.seat) : '#8fd3ff'});
    return true;
  };
  F.seatMark = function(sq, u){
    const m = sq && sq.mark; if (!m) return null;
    if (!live(m) || sq.controller !== 'guest' || !F.coopMarkOn()){ sq.mark = null; return null; }
    return Math.hypot(m.x - u.x, m.y - u.y) < F.K.seatMarkR ? m : null;
  };

  /* ---- step 3: Barracks drills ----
     Two rows in TRAINING.barracks:
     Cut them down (p.drills.cut: swings on their own) and Fire at will (p.drills.fire: shoots on their own).
     They go through the normal Training path (trainingFor / trainAt): gold, the Mentor's cut, and the mate sits out
     the next contract (p.resting = 1). Approved 2026-11-14 (Systems' set): F33.K.drillCost (40) each, not an Advancement (free: true
     skips the cap). Later drills (Pick your targets, Guard the Leader) are more rows in F.DRILLS. The mate card lists them. */
  F.K.drillCost = F.K.drillCost || 40;
  F.DRILLS = [
    {k: 'drillcut', key: 'cut', name: 'Cut them down', does: 'swings on their own', desc: 'Swings at any foe in reach, without being told.'},
    {k: 'drillfire', key: 'fire', name: 'Fire at will', does: 'shoots on their own', desc: 'Shoots their ranged weapon at the nearest foe, without being told. Your mark comes first. Spells and techniques are not part of it.'}
  ];   // Narrative section 2; Pick your targets / Guard the Leader are worded there but not built
  F.TXT = {   // Narrative sections 1, 2 and 5 (audits/drills-books.md, Narrative text)
    adv: 'Advancements raise a Squad Mate\'s stats and count toward the cap (Leader Level + 1).',
    drill: 'Drills teach a habit. They cost gold, they are <b>not</b> Advancements, and they do not count toward the cap. The Squad Mate sits out the next contract.',
    help: 'A drilled Squad Mate acts on their own. Your mark still comes first.',
    undrilled: 'Not drilled. Attacks only what you mark.',
    mark: 'Click an enemy to mark it. Your Squad Mates attack the mark. Drilled mates also act on their own.',
    markHud: 'Marked. Your mates attack it.'};
  /* Q17 Barracks words (UX re-check 2026-11-16): the Planner's words from CAMPAIGN_LINES.founding45.drills when loaded.
     The row tooltip is the drill's own desc (no second "mark comes first"); the blurb adds the Leader line.
     Off: F33.q17words = false (the words before). */
  F.q17words = true;   // switch on its own line
  F.LINE = () => { const C = F.q17words && window.CAMPAIGN_LINES; return (C && ((C.founding45 && C.founding45.drills) || C.drills)) || {}; };
  F.descOf = d => { const w = F.LINE()[d.key]; return (w && w.desc) || d.desc; };
  F.drillRow = d => ({k: d.k, drill: d.key, free: true, label: `Drill: ${d.name} (${d.does}; not an Advancement)`, desc: F.descOf(d),
    cost: () => F.K.drillCost, ok: p => !(p.drills && p.drills[d.key]), why: 'already drilled'});
  F.syncDrills = function(){
    if (typeof TRAINING === 'undefined' || !TRAINING.barracks) return;
    const T = TRAINING.barracks, has = T.some(t => t.drill);
    if (!has) for (const d of F.DRILLS) T.push(F.drillRow(d));
  };
  F.drillNames = p => F.DRILLS.filter(d => p && p.drills && p.drills[d.key]).map(d => d.name);
  /* Narrative section 1 on the Barracks panel (only where drill rows show): the Advancement line, the drill line and help line,
     a drilled / not drilled line under each mate, and the drill buttons' tooltips */
  /* K15 (Planner dc513b4): the drill building is always named in full; the card says where drills are bought */
  /* K25: a drill still being taught reads "Learning", not "Drilled" */
  F.drillLine = function(p, n){
    const lab = p && p.resting > 0 && p.trainingAt ? String(p.trainingLabel || '') : '';
    const learn = n.filter(x => lab.indexOf(x) >= 0), done = n.filter(x => lab.indexOf(x) < 0);
    return (done.length ? 'Drilled: ' + done.join(', ') + '.' : '') + (learn.length ? (done.length ? ' ' : '') + 'Learning: ' + learn.join(', ') + '.' : '');
  };
  F.buildingLine = function(){ try { const f = typeof facility === 'function' ? facility('barracks') : null; return f && f.name ? ' Drills are bought in the ' + f.name + '.' : ''; } catch (e) { return ''; } };
  F.barracksText = function(fid, h){
    const T = typeof TRAINING !== 'undefined' && TRAINING[fid]; if (!h || !T || !T.some(t => t.drill)) return h;
    h = h.replace('Each counts as an Advancement (cap: Leader Level + 1).', F.TXT.adv);
    h = h.replace('Choose an option, then confirm.</div>', `Choose an option, then confirm.</div><div class="desc" style="text-align:left">${F.TXT.drill} ${F.LINE().barracks ? F.LINE().barracks : '<i>' + F.TXT.help + '</i>'}</div>`);
    for (const d of F.DRILLS) h = h.split(`data-tip="Drill: ${d.name} (${d.does}; not an Advancement). `).join(`data-tip="${F.descOf(d)}${F.LINE().barracks ? '' : ' ' + F.TXT.help} `);
    const cands = ((typeof META !== 'undefined' && META.roster) || []).filter(p => T.some(t => !t.spec || t.spec === p.spec));
    let i = 0;
    /* K17: a button that cannot be bought shows why on its face, not only in the tooltip */
    /* K21: the Confirm line says what is bought, for whom, the cost and the sit-out, in that order */
    h = h.replace(/<b>([^<]*)<\/b> Drill: ([^<]*?) for <b>(\d+)gp<\/b>, and sits out the next contract\./, (m, nm, what, c) => `Drill <b>${nm}</b>: ${what}. <b>${c}gp</b>. ${nm} sits out the next contract.`);
    h = h.replace(/(<button disabled data-tip="[^"]*?: ([^"]*)"[^>]*>)([^<]*)(<\/button>)/g, (m, a, why, label, z) => why ? `${a}${label}<br><span style="font-size:14px;opacity:.8">${why}</span>${z}` : m);
    return h.replace(/(<div class="grow"(?: data-pid="(\d+)")?><b>[^<]*<\/b><br>)/g, (m, a, pid) => { const p = pid ? cands.find(x => String(x.id) === pid) : cands[i++]; if (!p) return m;   // PD-42: by id (the lines are grouped by Specialty)
      const n = F.drillNames(p); return m + `<span style="color:${n.length ? '#226b2a' : '#8a7a62'}">${n.length ? F.drillLine(p, n) : F.TXT.undrilled}</span><br>`; });
  };
  (function hookDrills(){
    if (typeof TRAINING === 'undefined' || typeof trainingFor !== 'function') return;
    if (typeof TRN_SHORT !== 'undefined') for (const d of F.DRILLS) TRN_SHORT[d.k] = 'Drill: ' + d.name;
    if (typeof ADV_LABEL !== 'undefined') for (const d of F.DRILLS) ADV_LABEL[d.k] = 'Drill: ' + d.name;
    { const f = trainingFor; trainingFor = function(){ F.syncDrills(); return f.apply(this, arguments); }; }
    { const f = trainingHTML; trainingHTML = function(fid){ F.syncDrills(); const h = f.apply(this, arguments); return F.barracksText(fid, h); }; }
    { const f = applyAdvance; applyAdvance = function(p, k){   // trainAt lands here for a drill: no Advancement, no stat
        const d = F.DRILLS.find(x => x.k === k); if (!d) return f.apply(this, arguments);
        p.drills = Object.assign({}, p.drills, {[d.key]: true});
      }; }
    if (typeof mateCardHTML === 'function'){ const f = mateCardHTML;
      mateCardHTML = function(p, extra = ''){
        const n = F.drillNames(p);
        /* K16 (F-48 review): an undrilled roster mate's card says so too, so the rule is written in camp without the Barracks */
        const un = !n.length && typeof META !== 'undefined' && META && (META.roster || []).includes(p);
        return f.call(this, p, extra + (n.length ? `<div class="desc" style="color:#226b2a">Drilled: ${n.join(', ')}</div>` : un ? `<div class="desc" style="color:#8a7a62">${F.TXT.undrilled}${F.buildingLine()}</div>` : ''));
      }; }
    F.syncDrills();
  })();

  /* the Leader's turn while manual: passives, the cooldown, a charge, then any order that is due */
  F.leaderTick = function(L, shieldWall){
    wire();
    specPassive(L, true);
    F.steer();
    F.rushTick();
    if (L.timer > 0){ L.timer--; return; }
    if (!F.q && F.mouse.held && F.fieldOK()){ const w = F.toWorld(F.mouse.x, F.mouse.y); F.order(F.mouse.held === 2 ? 'swing' : 'shoot', w.x, w.y, true); }
    const q = F.q; if (!q) return;
    F.q = null;
    if (G.frame - q.t > F.K.holdFrames && !F.mouse.held) return;   // a stale click is dropped
    if (q.kind === 'swing' && !live(q.e)) return;
    F.fire(q, L, shieldWall);
  };

  /* ---- the inputs ---- */
  function wire(){
    const cv = (typeof canvas !== 'undefined' && canvas) || document.getElementById('gameCanvas'); if (!cv || cv.__f33) return; cv.__f33 = true;
    /* S6-A note 4 (review f375e2b): one window-level capture listener, so every HTML layer over the field (bar cards, legend, lesson cards, highlight, Deck band) is covered, not only the canvas.
       It blocks the browser menu while a fight is on screen (G set, no full screen such as the title, camp sheet or debrief showing); text fields keep their menu. */
    if (!window.__f33ctx){ window.__f33ctx = true;
      window.addEventListener('contextmenu', e => {
        if (!(e.buttons & 2)) F.mouse.held = 0;   // E2: an opened menu eats the mouseup, so a held right click would re-fire the charge every frame. P23-E3: Firefox on some systems opens it on mousedown with the button still down; that hold is real
        if (typeof G === 'undefined' || !G) return;
        const t = e.target; if (t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) return;
        if (document.querySelector('.screen:not(.hidden)')) return;
        e.preventDefault();
      }, true);
    }
    cv.addEventListener('mousemove', e => { F.mouse.x = e.clientX; F.mouse.y = e.clientY; });
    cv.addEventListener('mousedown', e => {
      F.mouse.x = e.clientX; F.mouse.y = e.clientY;
      if (!F.fieldOK() || F.inBand(e.clientY)) return;
      const kind = F.kindOf(e); if (!kind) return;
      const w = F.toWorld(e.clientX, e.clientY);
      F.mouse.held = kind === 'swing' ? 2 : 1; F.mouse.since = G.frame;
      if (F.order(kind, w.x, w.y)) e.preventDefault();
    });
    window.addEventListener('mouseup', () => { F.mouse.held = 0; F.rush = null; });
    window.addEventListener('blur', () => { F.mouse.held = 0; F.stopCharge(); });
  }
  F.onKey = function(e){
    if (!F.manual() || e.repeat) return;
    const k = e.key.toLowerCase();
    if (F.charge && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { F.stopCharge(); if (F.mouse.held === 2) F.mouse.held = 0; }   // the player takes the reins (E1: a held right click would restart the charge next tick)
    if (k === 'x' && !e.ctrlKey && !e.metaKey && !e.altKey && F.fieldOK()){ const w = F.toWorld(F.mouse.x, F.mouse.y); F.order('swing', w.x, w.y); }
  };
  window.addEventListener('keydown', e => F.onKey(e), true);
  window.addEventListener('keyup', e => { if (F.charge && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())){ F.stopCharge(); if (F.mouse.held === 2) F.mouse.held = 0; } }, true);   // a change in the held movement keys hands control back
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.addEventListener('load', () => setTimeout(wire, 0));
  F.wire = wire;
  F.setClicks(F.clicks);

  /* ---- self-test (a stub field; nothing is saved) ---- */
  F.selfTest = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const sv = {G, cl: F.clicks, bot: window.BOT, ua: unitAttack, pop, sp: specPassive, keys: Object.assign({}, keys), q: F.q, ch: F.charge, held: F.mouse.held};
    const scr = [...document.querySelectorAll('.screen:not(.hidden)')];   // a full screen showing (the title) would rightly leave the menu alone: hide it for the test, restore after
    try {
      scr.forEach(s => s.classList.add('hidden')); wire(); pop = () => {}; specPassive = () => {}; F.clicks = true; F.q = null; F.charge = null; F.mouse.held = 0;
      const foe = (x, y) => ({x, y, r: 10, k: 'bandit', dead: false});
      const L = {x: 1000, y: 1000, timer: 0, down: false, s: {}, spec: 'SOLDIER', p: {}};
      const E = [foe(1030, 1000), foe(1300, 1000), foe(2000, 2000)];
      G = {leader: L, enemies: E, frame: 100, over: false, paused: false, melee: {}, formation: 'OPEN', chargeT: 0, momChoice: null};
      for (const k of ['w', 'a', 's', 'd']) keys[k] = false;
      const s = F.toScreen(1234, 987), w = F.toWorld(s.x, s.y);
      ok('toWorld undoes toScreen', Math.abs(w.x - 1234) < 1e-6 && Math.abs(w.y - 987) < 1e-6, JSON.stringify(w));
      ok('the Leader is in the middle of the view', (() => { const c = F.toScreen(L.x, L.y), r = rect(); return Math.abs(c.x - r.left - VW / 2) <= 1; })());
      ok('left = shoot, right = swing, Ctrl+left = swing', F.kindOf({button: 0}) === 'shoot' && F.kindOf({button: 2}) === 'swing' && F.kindOf({button: 0, ctrlKey: true}) === 'swing' && F.kindOf({button: 1}) === null);
      const ev = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); canvas.dispatchEvent(ev);
      ok('the context menu is suppressed on the field', ev.defaultPrevented);
      F.clicks = false; const ev2 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); canvas.dispatchEvent(ev2); F.clicks = true;
      ok('clicks off: still no browser menu on the field (S6-A note 4)', ev2.defaultPrevented);
      ok('the Command Deck band is not the field', !window.DECK || F.inBand(rect().top + VH - 2));
      let got = null; unitAttack = (u) => { got = {melee: nearest(u, 46), shot: nearest(u, 300, new Set(), true)}; };
      F.order('shoot', 1100, 800); F.leaderTick(L, false);
      ok('a left click shoots at the cursor, never swings', got && got.melee === null && got.shot && got.shot.x === 1100 && got.shot.y === 800, JSON.stringify(got && got.shot));
      got = null; F.order('swing', 1032, 1004); F.leaderTick(L, false);
      ok('a right click swings at the enemy under the cursor', got && got.melee === E[0]);
      got = null; F.order('swing', 1300, 1000);
      ok('an enemy out of reach starts a Charge', F.charge && F.charge.e === E[1] && !F.q);
      F.leaderTick(L, false); ok('the charge runs at it', keys.d === true && !keys.a, JSON.stringify(keys));
      F.onKey({key: 'a'});
      ok('WASD cancels the charge', !F.charge && !keys.d);
      F.order('swing', 1300, 1000); L.x = 1260; F.leaderTick(L, false);
      ok('arriving swings with the Charge step', !F.charge && G.chargeT >= 30 && got && got.melee === E[1]);
      got = null; F.order('swing', 2000, 2000); ok('too far to charge: nothing', !F.charge && !F.q);
      L.timer = 5; F.order('shoot', 900, 900); F.leaderTick(L, false); ok('a click waits for the cooldown', got === null && F.q && L.timer === 4);
      F.q = null; G.paused = true; ok('paused: no field clicks', !F.order('shoot', 1, 1)); G.paused = false;
      F.clicks = false; ok('clicks off: not manual, no mark', !F.manual() && !F.markOn());
      F.clicks = true; window.BOT = undefined;
      G.over = true; const ev3 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); canvas.dispatchEvent(ev3); G.over = false;
      ok('no browser menu on the field, also when the contract is over', ev3.defaultPrevented);
      /* S6-A note 4 (review f375e2b): the block is one window-level listener, so HTML layers over the field are covered; outside a fight the menu is left alone */
      {
        const lay = document.createElement('div'); lay.id = 'f33-ctx-probe'; lay.style.cssText = 'position:fixed;left:0;top:0;width:10px;height:10px'; document.body.appendChild(lay);
        const ev4 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); lay.dispatchEvent(ev4);
        ok('no browser menu on an HTML layer over the field during a fight', ev4.defaultPrevented);
        const inp = document.createElement('input'); document.body.appendChild(inp);
        const ev5 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); inp.dispatchEvent(ev5); inp.remove();
        ok('a text field keeps its menu during a fight', !ev5.defaultPrevented);
        const g0 = G; G = null; const ev6 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); lay.dispatchEvent(ev6); G = g0;
        ok('outside a fight (G null, the title) the browser menu is left alone', !ev6.defaultPrevented);
        scr.forEach(s => s.classList.remove('hidden'));
        const ev7 = new MouseEvent('contextmenu', {cancelable: true, bubbles: true}); if (scr.length){ lay.dispatchEvent(ev7); scr.forEach(s => s.classList.add('hidden')); ok('a full screen over the field (title, camp sheet): the menu is left alone', !ev7.defaultPrevented); }
        lay.remove(); }
      window.BOT = {}; ok('a test bot plays the manual Leader too', F.manual()); window.BOT = sv.bot;
    } catch (e) { ok('threw', false, e && e.message); }
    finally {
      scr.forEach(s => s.classList.remove('hidden')); G = sv.G; F.clicks = sv.cl; window.BOT = sv.bot; unitAttack = sv.ua; pop = sv.pop; specPassive = sv.sp; F.q = sv.q; F.charge = sv.ch; F.mouse.held = sv.held; release();
      for (const k in sv.keys) keys[k] = sv.keys[k];
    }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  };

  F.selfTestDrills = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const sv = {M: META, sm: saveMeta, rp: refreshProgression, sfx: SFX.play, n: TRAINING.barracks.length};
    try {
      F.syncDrills();
      const n0 = TRAINING.barracks.filter(t => !t.drill).length;
      saveMeta = () => {}; refreshProgression = () => {}; SFX.play = () => {};
      META = freshMeta(); META.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'T'); META.treasury = 100; META.facilities.barracks = true; META.damaged = {};
      const p = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'D'); p.id = 7; META.roster = [p];
      const o = trainingFor('barracks', p), cut = o.find(t => t.k === 'drillcut'), fire = o.find(t => t.k === 'drillfire');
      ok('both drills are offered at the Barracks', cut && fire && TRAINING.barracks.length === n0 + 2);
      ok('each costs the draft price (less any Mentor cut)', cut.cost > 0 && cut.cost <= F.K.drillCost && cut.ok, JSON.stringify({c: cut.cost, ok: cut.ok, why: cut.why}));
      const adv0 = p.adv;
      trainAt(7, 'barracks', 'drillcut');
      ok('training a drill sets it, costs gold, is not an Advancement', p.drills && p.drills.cut && !p.drills.fire && p.adv === adv0 && META.treasury === 100 - cut.cost, JSON.stringify({d: p.drills, adv: p.adv, t: META.treasury}));
      ok('the mate sits out the next contract', p.resting === 1 && p.trainingAt === 'barracks' && /Cut them down/.test(p.trainingLabel || ''));
      ok('one drill at a time (resting)', !trainingFor('barracks', p).find(t => t.k === 'drillfire').ok);
      p.resting = 0; p.trainingAt = null;
      ok('a drill is learnt once', !trainingFor('barracks', p).find(t => t.k === 'drillcut').ok);
      p.adv = 99; ok('the Advancement cap does not block a drill', trainingFor('barracks', p).find(t => t.k === 'drillfire').ok); p.adv = adv0;
      META.treasury = 1; ok('not enough gold: no drill', !trainingFor('barracks', p).find(t => t.k === 'drillfire').ok); META.treasury = 100;
      ok('the mate card lists the drills', /Drilled: Cut them down/.test(mateCardHTML(p)));
      { const u = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'U'); u.id = 9; const st = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'X');
        META.roster.push(u); const hu = mateCardHTML(u), hs = mateCardHTML(st), hp = mateCardHTML(p);
        META.roster.pop();
        ok('K16: an undrilled roster mate card says Not drilled; a drilled one, and a stranger do not', hu.includes(F.TXT.undrilled) && !hp.includes(F.TXT.undrilled) && !hs.includes(F.TXT.undrilled)); }
      ok('the field reads it: a drilled mate swings on its own', F.drillsOf({p}).cut === true && !F.drillsOf({p}).fire);
      const q = makeMate('HUMAN', 'FREEMAN', 'SOLDIER', 'E'); q.id = 8; META.roster.push(q);
      const bh = trainingHTML('barracks');
      ok('Narrative section 1: the Barracks blurb (Advancements line, drill line, help line)', bh.includes(F.TXT.adv) && !/Each counts as an Advancement/.test(bh) && bh.includes('they do not count toward the cap') && (F.LINE().barracks ? bh.includes(F.LINE().barracks) : bh.includes(F.TXT.help)));
      ok('a line under each mate: drilled / not drilled', bh.includes('Drilled: Cut them down.') && bh.includes(F.TXT.undrilled));
      ok('K17: a dead button shows its reason on its face', !/<button disabled/.test(bh) || /<button disabled[^>]*>[^<]*<br><span[^>]*>[^<]+<\/span><\/button>/.test(bh));
      ok('drill buttons: Narrative row labels and descriptions', bh.includes('Drill: Fire at will (shoots on their own; not an Advancement)') && bh.includes(F.descOf(F.DRILLS[1])));
      ok('Q17: the Barracks says the Leader needs the click, and the mark is not said twice', !F.LINE().barracks || (bh.includes(F.LINE().barracks) && bh.split(F.TXT.help).length === 1 && bh.includes(F.LINE().fire.desc)));
      { const g0 = G, t0 = tip, p0 = typeof pop === 'function' ? pop : null, seen = [], pops = [];
        try { tip = id => seen.push(id); pop = (x, y, t) => pops.push(t); G = {fx: []};
              const e1 = {x: 0, y: 0, r: 10}, e2 = {x: 50, y: 0, r: 10}; F.setMark(e1); F.setMark(e2);
              ok('Narrative section 5: the first mark asks for the tip once; the HUD line shows once a contract', seen[0] === 'mark33' && TIPS.mark33 === F.TXT.mark && pops.length === 1 && pops[0] === F.TXT.markHud && G.mark33 === e2);
        } finally { G = g0; tip = t0; if (p0) pop = p0; } }
    } catch (e) { ok('threw', false, e && e.message); }
    finally {
      META = sv.M; saveMeta = sv.sm; refreshProgression = sv.rp; SFX.play = sv.sfx; F.syncDrills();
    }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  };

  F.selfTestRush = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const sv = {G, cl: F.clicks, pop, los: losLine, q: F.q, ch: F.charge, held: F.mouse.held, since: F.mouse.since, rush: F.rush};
    try {
      pop = () => {}; losLine = () => true; F.clicks = true; F.q = null; F.charge = null; F.rush = null;
      const foe = (x, y) => ({x, y, r: 10, k: 'bandit', dead: false});
      const L = {x: 1000, y: 1000, timer: 0, down: false, s: {}, spec: 'SOLDIER', p: {}};
      const mate = (x, y, o) => Object.assign({x, y, s: {}, spec: 'SOLDIER', p: {}, state: 'up'}, o || {});
      const near = foe(1030, 1000), second = foe(1040, 1005), A = mate(900, 1000), B = mate(900, 1040), J = mate(900, 1080, {job: {}}), Dn = mate(900, 1100, {state: 'bleeding'});
      G = {leader: L, enemies: [near, second], squad: [A, B, J, Dn], frame: 100, over: false, paused: false, melee: {}, formation: 'OPEN', fx: [], momChoice: null};
      const aim = F.toScreen(near.x, near.y); F.mouse.x = aim.x; F.mouse.y = aim.y; F.mouse.held = 2;
      F.mouse.since = G.frame - 5; F.rushTick(); ok('1: held under 0.4 s: no squad charge', !F.rush);
      F.mouse.since = G.frame - F.K.rushFrames; F.rushTick(); ok('1: held 0.4 s with the Leader in melee: the squad charges the target', F.rush && F.rush.e === near);
      ok('2: free Mates are in the order', F.rushOn(A) && F.rushOn(B));
      ok('2: a trap-job Mate, a downed Mate and the Leader are not', !F.rushOn(J) && !F.rushOn(Dn) && !F.rushOn(L));
      ok('3: a rushing Mate never shoots', F.pick(A, 300, new Set(), true) === null);
      ok('3: it swings only when the target is in reach', F.pick(A, 46, null, false) === null && (A.x = 1000, F.pick(A, 46, null, false) === near) && (A.x = 900, true));
      { const p = F.rushPoint(A); ok('3: it walks to the target, not to its place', Math.hypot(p.x - near.x, p.y - near.y) < 30); }
      near.dead = true; F.rushTick();
      ok('4: the target dies with the button held: the order moves to the next foe the Leader swings at', F.rush && F.rush.e === second);
      second.dead = true; F.rushTick(); ok('4: no target left: the order ends', !F.rush);
      near.dead = false; second.dead = false; F.mouse.since = G.frame - F.K.rushFrames; F.rushTick(); ok('4: re-armed', !!F.rush);
      F.mouse.held = 0; F.rushTick(); ok('4: release ends it', !F.rush);
      F.mouse.held = 2; F.rushTick(); G.formation = 'SHIELD'; F.rushTick(); ok('4: Brace ends it', !F.rush); G.formation = 'OPEN';
      F.rushTick(); G.leader.down = true; F.rushTick(); ok('4: the Leader down ends it', !F.rush); G.leader.down = false;
      F.rushTick(); F.clicks = false; F.rushTick(); ok('7: clicks off: no order', !F.rush); F.clicks = true;
    } catch (e) { ok('threw', false, e && e.message); }
    finally { G = sv.G; F.clicks = sv.cl; pop = sv.pop; losLine = sv.los; F.q = sv.q; F.charge = sv.ch; F.mouse.held = sv.held; F.mouse.since = sv.since; F.rush = sv.rush; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  };

  F.selfTestMark = function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const sv = {G, cl: F.clicks, pop, los: losLine, q: F.q, ch: F.charge};
    try {
      pop = () => {}; losLine = () => true; F.clicks = true; F.q = null; F.charge = null;
      const foe = (x, y) => ({x, y, r: 10, k: 'bandit', dead: false});
      const L = {x: 1000, y: 1000, timer: 0, down: false, s: {}, spec: 'SOLDIER', p: {}};
      const mate = (x, y, drills) => ({x, y, s: {}, spec: 'SOLDIER', p: drills ? {drills} : {}});
      const near = foe(1040, 1000), mid = foe(1200, 1000), far2 = foe(1400, 1000);
      const A = mate(1000, 1000), D = mate(1000, 1000, {cut: true, fire: true}), ally = mate(1000, 1000);
      G = {leader: L, enemies: [near, mid, far2], squad: [A, D], frame: 100, over: false, paused: false, melee: {}, formation: 'OPEN', fx: [], momChoice: null};
      ok('no mark: an undrilled mate never shoots on its own', F.pick(A, 300, new Set(), true) === null);
      ok('no mark, nothing in contact: no swing either', F.pick(A, 46, null, false) === null);
      near.x = 1018; ok('an enemy in contact: it defends itself', F.pick(A, 46, null, false) === near); near.x = 1040;
      F.order('shoot', 1202, 1003);
      ok('a click on an enemy marks it (with a ring)', G.mark33 === mid && G.fx.some(x => x.ring));
      ok('the mark in range: undrilled shoots it', F.pick(A, 300, new Set(), true) === mid);
      ok('the volley extras do not spill onto other foes', F.pick(A, 300, new Set([mid]), true) === null);
      ok('the mark out of reach: no swing at a foe not in contact', F.pick(A, 46, null, false) === null);
      mid.x = 1030; ok('the mark in reach: undrilled swings at it', F.pick(A, 46, null, false) === mid); mid.x = 1200;
      ok('drilled: the mark in range comes first', F.pick(D, 300, new Set(), true) === mid);
      ok('drilled: Cut them down swings on its own', F.pick(D, 46, null, false) === near);
      { const t0 = {x: 0, y: 0, k: 'target'}; G.mark = t0; F.setMark(far2); ok('K37: a click mark leaves the Assassinate target (G.mark) alone', G.mark === t0 && G.mark33 === far2 && F.mark() === far2);
        F.ownMark = false; ok('K37 off: the shared field as before', F.mark() === t0); F.ownMark = true; delete G.mark; }
      G.mark33 = far2; ok('drilled: Fire at will shoots the nearest when the mark is out of range', F.pick(D, 300, new Set(), true) === near);
      D.p.drills = {cut: true}; ok('Cut them down alone: no shooting on its own', F.pick(D, 300, new Set(), true) === null);
      ok('a mate outside the host squad keeps its own targeting', F.pick(ally, 300, new Set(), true) === near);
      ok('the Leader keeps its own targeting', F.pick(L, 300, new Set(), true, true) === near);
      // step 8: co-op seats. An ALLY1 or guest unit (seatAlly) in G.allies, even an undrilled roster mate, keeps its own AI
      const gu = Object.assign(mate(1000, 1000), {seatAlly: true, state: 'up'}); G.allies = [{units: [gu], controller: 'guest'}];
      ok('step 8: a guest-squad mate is not the host\'s (F33.host)', !F.host(gu) && F.host(A) && F.host(L));
      ok('step 8: with a mark set, a guest-squad mate still picks its own target (counts as drilled)', (G.mark33 = mid) && F.pick(A, 300, new Set(), true) === mid && F.pick(gu, 300, new Set(), true) === near && F.pick(gu, 46, null, false) === near);
      ok('step 8: a seat-ally unit slipped into G.squad is still not the host\'s', (G.squad.push(gu), !F.host(gu) && F.pick(gu, 300, new Set(), true) === near) && (G.squad.pop(), true));
      if (window.ABIL33){ G.abil = {}; G.abilQ = []; gu.spec = 'SOLDIER';
        ok('step 8: host keys never reach a guest unit', !ABIL33.able(gu) && ![1, 2, 3, 4, 5, 'e'].some(k => ABIL33.byKey(String(k)) === gu) && !ABIL33.use(gu, {}));
        ok('step 8: the host\'s own mate can still use its key', ABIL33.able(Object.assign(A, {state: 'up'}))); }
      { // step 8, the guest mark
        const sqG = {seat: 1, controller: 'guest', units: [gu]}, sqA = {seat: 2, controller: 'ai', units: []};
        const id = F.mid(mid);
        ok('guest mark: an enemy gets a small id once', id > 0 && F.mid(mid) === id);
        ok('guest mark: a guest seat can mark an enemy by id (ring in its colour)', F.seatMarkSet(sqG, id) && sqG.mark === mid && G.fx.some(x => x.ring && x.x === mid.x));
        ok('guest mark: a seat run by the AI cannot', !F.seatMarkSet(sqA, id) && !sqA.mark);
        ok('guest mark: an unknown id is refused, the old mark kept', !F.seatMarkSet(sqG, 99999) && sqG.mark === mid);
        ok('guest mark: the squad goes for its mark in range', F.seatMark(sqG, gu) === mid);
        ok('guest mark: out of range it fights as before', (mid.x = 1000 + F.K.seatMarkR + 50, F.seatMark(sqG, gu) === null) && sqG.mark === mid && (mid.x = 1200, true));
        ok('guest mark: the host\'s targeting is untouched', G.mark33 === mid && F.pick(gu, 300, new Set(), true) === near);
        sqG.controller = 'ai_takeover'; ok('guest mark: a dropped seat drops its mark', F.seatMark(sqG, gu) === null && sqG.mark === null); sqG.controller = 'guest';
        F.seatMarkSet(sqG, id); mid.dead = true; ok('guest mark: clears when the enemy dies', F.seatMark(sqG, gu) === null && sqG.mark === null); mid.dead = false;
      }
      G.mark33 = far2; G.allies = [];
      far2.dead = true; ok('the mark clears when the enemy dies', F.mark() === null && G.mark33 === null);
      G.obj = 'brawl'; ok('a brawl: no mark', !F.markOn());
    } catch (e) { ok('threw', false, e && e.message); }
    finally { G = sv.G; F.clicks = sv.cl; pop = sv.pop; losLine = sv.los; F.q = sv.q; F.charge = sv.ch; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  };
})();
