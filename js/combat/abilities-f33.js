/* F-33 step 4 (audits/drills-books.md): one active per character, auto slots.
   Always on (ABIL33.on was removed in INT-1, 2026-11-15). The old per-Specialty bar runs only in a brawl.
   - ABIL33.REG[id] = {id, spec, cd, aimed, fx(u), when(u)}: the six abilities, unchanged (fx is ABIL_FX[spec]).
   - Keys 1-5 = the first five mates in squad order, E = the Leader; Shift + the key toggles that character's auto.
   - Each character has its own cooldown per ability (u.ab33[id]); the loadout (A.lo) names the key's active and the auto slots. A cast runs through useAbility with abilityCasters narrowed to that one
     character, so Favour, Voice of the God, Overchannel, the shout and the duel wrappers still apply.
   - Aimed actives (Lightning Bolt, Called Shot) aim at the cursor.
   - Auto: fires when when(u) holds; the cooldown is x ABIL33.K.autoMul. Slots: ABIL33.slotsFor(p) (also F33.slotsFor). autoMul and the foe/heal dials approved by Patrick 2026-11-14 (Systems' set); fighterAt is still a draft [S]. */
(function(){
  'use strict';
  const A = window.ABIL33 = {inner: false};
  A.K = {autoMul: 1.5, healBelow: 0.6, bashFoes: 2, boltFoes: 2, boltLen: 380, hornFoes: 3, hornR: 200, hexFoes: 3, hexR: 250, shotR: 400, aimR: 60,
         fighterAt: [2, 4], retry: 30};   // approved 2026-11-14 (Systems' set), except fighterAt [S]
  const F = () => window.F33;
  A.live = () => !!(F() && typeof G !== 'undefined' && G && !(typeof isBrawl === 'function' && isBrawl()));

  /* ---- slots (drills-books.md, Patrick round 3): casters one per point of Magic; fighters 1, +1 at 2 and at 4 Advancements
     (the Leader: level - 1). The starting auto (the Specialty attack; Magic Missile etc. from step 6) holds the first slot,
     so the key's active can go on auto only with a spare one: A.slots(u) = spare slots = total - 1. ---- */
  A.slotsFor = function(p){
    if (!p) return 0;
    const S = typeof SPECS !== 'undefined' && SPECS[p.spec];
    if (S && S.caster){   // the Leader keeps no p.magic: theirs comes from leaderStats (bug: a caster Leader had no slots at all)
      let mg = p.magic; if (mg == null && p.level != null && typeof leaderStats === 'function'){ try { mg = leaderStats(p).magic; } catch (e) {} }
      return Math.max(0, mg | 0);
    }
    const adv = p.adv != null ? (p.adv | 0) : Math.max(0, (p.level | 0) - 1);
    return 1 + A.K.fighterAt.filter(n => adv >= n).length;
  };
  if (window.F33) F33.slotsFor = p => A.slotsFor(p);
  A.pOf = u => !u ? null : (u === G.leader || u.isLeader) ? (typeof META !== 'undefined' && META.leader) || null : u.p || null;
  A.slots = u => { const p = A.pOf(u); return p ? Math.max(0, A.slotsFor(Object.assign({spec: u.spec}, p)) - 1) : 0; };

  /* ---- the registry ---- */
  const foes = () => (typeof liveFoes === 'function' ? liveFoes() : (G.enemies || []).filter(e => !e.dead));
  const near = (u, R) => foes().filter(e => Math.hypot(e.x - u.x, e.y - u.y) <= R);
  const nearestFoe = (u, R) => { let b = null, bd = R; for (const e of foes()){ const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd){ bd = d; b = e; } } return b; };
  A.onLine = function(u, ang, len){ let n = 0;
    for (const e of foes()){ const rx = e.x - u.x, ry = e.y - u.y, t = rx * Math.cos(ang) + ry * Math.sin(ang);
      if (t >= 0 && t <= len && Math.abs(-rx * Math.sin(ang) + ry * Math.cos(ang)) <= (e.r || 0) + 16) n++; }
    return n; };
  const hurt = v => v.maxCon && v.con / v.maxCon < A.K.healBelow;
  const REG = A.REG = {};
  function def(id, spec, aimed, when){ REG[id] = {id, spec, aimed, when, get cd(){ return ABILITIES[spec].cd; }, fx: u => ABIL_FX[spec](u)}; }
  def('bash', 'SOLDIER', false, u => near(u, G.mod.radius).length >= A.K.bashFoes);
  def('command', 'FOLK_HERO', false, () => near(G.leader, A.K.hornR).length >= A.K.hornFoes);
  def('called', 'SCOUNDREL', true, u => { const e = foes().find(e => Math.hypot(e.x - u.x, e.y - u.y) <= A.K.shotR && clearLine(u, e)); return e ? {x: e.x, y: e.y} : false; });
  def('cure', 'CLERIC', false, () => { const L = G.leader; if (L.down || hurt(L)) return true;
    return G.squad.some(m => m.state !== 'dead' && (m.state !== 'up' || hurt(m))); });
  def('bolt', 'MAGE', true, u => { const e = nearestFoe(u, A.K.boltLen); if (!e) return false;
    return A.onLine(u, Math.atan2(e.y - u.y, e.x - u.x), A.K.boltLen) >= A.K.boltFoes ? {x: e.x, y: e.y} : false; });
  def('illusion', 'WITCH', false, u => !((G.illusionT | 0) > 0) && near(u, A.K.hexR).length >= A.K.hexFoes);
  /* step 6 (js/camp/books.js): ladder entries with their own effect. o = {id, spec, name, cdS (seconds, [S]), aimed, when(u), fx(u, aim) -> true if it went off,
     minMagic, favour, max (ranks), src}. They do not go through useAbility; A.use runs fx and sets the cooldown itself. */
  A.def2 = o => { const R = Object.assign({own: true}, o); Object.defineProperty(R, 'cd', {get(){ return R.cdS; }, enumerable: true}); REG[o.id] = R; return R; };
  A.nameOf = id => { const R = REG[id]; return !R ? id : R.name || (typeof ABILITIES !== 'undefined' && ABILITIES[R.spec] ? ABILITIES[R.spec].name : id); };
  A.reg = u => { for (const id in REG) if (REG[id].spec === (u && u.spec)) return REG[id]; return null; };

  /* ---- per-character state ---- */
  A.units = () => [G.leader].concat(G.squad || []).filter(Boolean);
  A.byKey = k => k === 'e' ? G.leader : /^[1-5]$/.test(k) ? (G.squad || [])[+k - 1] || null : null;
  A.keyOf = u => u === G.leader ? 'E' : String((G.squad || []).indexOf(u) + 1);
  A.able = u => !!u && (u === G.leader ? !u.down : u.state === 'up' && !u.seatAlly && (G.squad || []).includes(u));   // step 8: host squad only
  A.idOf = spec => { for (const id in REG) if (REG[id].spec === spec) return id; return null; };
  /* the loadout: {active: id or null, auto: [ids]}. With the books on (js/camp/books.js) it is read once per contract (fixed at march);
     without them it is the Specialty's ability on the key, also on auto while p.auto33 (step 4's Shift toggle). */
  A.lo = u => { if (!u) return {active: null, auto: []}; if (u.lo33) return u.lo33;
    const p = A.pOf(u), R = A.reg(u);
    if (window.BOOK33 && BOOK33.live() && R) return (u.lo33 = BOOK33.loadout(p, u.spec));
    return {active: R ? R.id : null, auto: R && p && p.auto33 && A.slots(u) >= 1 ? [R.id] : []}; };
  A.keyId = u => { const lo = A.lo(u); return lo.active || lo.auto[0] || null; };
  A.ab = (u, id) => {                                            // one cooldown per character per ability
    id = id || A.keyId(u); if (!u || !id) return {cd: 0, max: 0, flash: 0, auto: false};
    const m = u.ab33 || (u.ab33 = {}), st = m[id] || (m[id] = {cd: 0, max: 0, flash: 0});
    st.auto = A.lo(u).auto.includes(id); return st; };

  A.locked = () => false;                                       // Q81: the Founding road sets this: a key the lesson has not named yet is off the bar and does nothing (js/tutorial/act1.js)
  A.use = function(u, opt){
    opt = opt || {};
    if (!A.live() || !u || !G.abil || !G.abilQ) return false;
    if (A.locked(u)) return false;
    try { if (window.B45 && B45.dim && B45.dim(u)){ if (B45.say) B45.say(u); return false; } } catch (e) {}   // G1: the drill yard dims what the step does not use; a press says why
    if (u !== G.leader && (u.seatAlly || !(G.squad || []).includes(u))) return false;   // step 8: host squad only
    const id = opt.id || A.lo(u).active, R = id && REG[id]; if (!R) return false;
    const spec = R.spec, ab = A.ab(u, id);
    if (R.own) return A.useOwn(u, R, ab, opt);
    if (!G.abil[spec]) G.abil[spec] = {cd: 0};
    const g = G.abil[spec], save = {cd: g.cd, max: g.max, flash: g.flash}, qn = G.abilQ.length, orig = abilityCasters;
    g.cd = ab.cd; g.max = ab.max;
    if (R.aimed && opt.aim) u.aim33 = {x: opt.aim.x, y: opt.aim.y}; else delete u.aim33;
    A.inner = true;
    abilityCasters = s => s === spec ? (A.able(u) ? [u] : []) : orig(s);
    try { useAbility(spec); } finally { A.inner = false; abilityCasters = orig; }
    const fired = G.abilQ.length > qn;
    ab.cd = g.cd | 0; ab.max = g.max || ab.cd;
    if (fired){ ab.flash = 20; if (opt.auto && ab.cd > 0){ ab.cd = Math.round(ab.cd * A.K.autoMul); ab.max = ab.cd; } }
    else delete u.aim33;
    g.cd = save.cd; g.max = save.max; g.flash = save.flash;
    return fired;
  };
  A.useOwn = function(u, R, ab, opt){
    const say = (t, c) => { if (typeof pop === 'function') pop(u.x, u.y - 46, t, c || '#999'); };
    if (ab.cd > 0 || !A.able(u)) return false;
    if (R.minMagic && ((u.s && u.s.magic) | 0) < R.minMagic){ if (!opt.auto) say('NEEDS MAGIC ' + R.minMagic); return false; }
    if (R.favour && (G.favour | 0) < R.favour){ if (!opt.auto) say('NEEDS ' + R.favour + ' FAVOUR'); return false; }
    let went = false;
    try { went = !!R.fx(u, opt.aim || null, opt); } catch (e){ if (!A._err){ A._err = 1; console.log('ABIL33 ' + R.id, e && e.message); } }
    if (!went) return false;
    if (R.favour) G.favour -= R.favour;
    ab.cd = Math.round(R.cdS * 60 * (opt.auto ? A.K.autoMul : 1)); ab.max = ab.cd; ab.flash = 20;
    return true;
  };
  A.aim = () => { const f = F(); if (!f || !f.toWorld || !f.mouse || f.mouse.x < 0) return null; return f.toWorld(f.mouse.x, f.mouse.y); };
  A.press = function(u){ if (!u) return false; const id = A.lo(u).active, R = id && REG[id];
    if (!R){ if (typeof pop === 'function' && A.reg(u)) pop(u.x, u.y - 34, 'NOTHING ON THE KEY', '#999'); return false; }
    return A.use(u, {id, aim: R.aimed ? A.aim() : null}); };
  A.toggle = function(u){
    if (!u) return false;
    if (window.BOOK33 && BOOK33.live()){ if (typeof pop === 'function') pop(u.x, u.y - 34, 'LOADOUT IS SET IN CAMP', '#999'); return false; }
    if (A.slots(u) < 1){ if (typeof pop === 'function') pop(u.x, u.y - 34, 'NO AUTO SLOT', '#999'); return false; }
    const p = A.pOf(u); if (!p) return false; p.auto33 = !p.auto33; const on = p.auto33;
    if (typeof pop === 'function') pop(u.x, u.y - 34, on ? 'AUTO' : 'MANUAL', on ? '#ffe9a8' : '#fff');
    return true; };

  /* ---- hooks (installed once the page's own wrappers are in) ---- */
  function hook(){
    if (A.hooked || typeof useAbility !== 'function' || typeof updateAbilities !== 'function' || typeof ABIL_FX === 'undefined') return;
    A.hooked = true;
    const baseUse = useAbility;
    useAbility = function(spec){                                 // a stray call (the bot, a button) goes to the first ready caster
      if (A.inner || !A.live()) return baseUse.apply(this, arguments);
      const id = A.idOf(spec), u = id && abilityCasters(spec).find(v => A.lo(v).active === id && A.ab(v, id).cd <= 0);
      if (!u){ if (typeof SFX !== 'undefined') SFX.play('nope'); return; }
      A.use(u, {id});
    };
    const baseUpd = updateAbilities;
    updateAbilities = function(){
      const r = baseUpd.apply(this, arguments);
      if (!A.live()) return r;
      const us = A.units();
      for (const u of us){ const m = u.ab33; if (m) for (const id in m){ const st = m[id]; if (st.cd > 0 && --st.cd === 0) st.flash = 20; if (st.flash > 0) st.flash--; } }
      if (G.over || G.paused) return r;
      for (const u of us){ if (!A.able(u) || A.slots(u) < 1) continue;
        for (const id of A.lo(u).auto){ const R = REG[id], st = A.ab(u, id); if (!R || st.cd > 0) continue;
          const w = R.when(u); if (!w) continue;
          if (!A.use(u, {id, auto: true, aim: typeof w === 'object' ? w : null})) st.cd = Math.max(st.cd, A.K.retry); } }
      return r;
    };
    ABIL_FX.MAGE = A.mageWrap(ABIL_FX.MAGE);
    const knife = ABIL_FX.SCOUNDREL;
    ABIL_FX.SCOUNDREL = function(u){
      const a = u && u.aim33; if (!a) return knife.apply(this, arguments);
      delete u.aim33;
      const f = F(), t = f && f.foeAt ? f.foeAt(a.x, a.y, A.K.aimR) : null, cl = clearLine;
      if (!t || Math.hypot(t.x - u.x, t.y - u.y) > A.K.shotR || !cl(u, t)) return knife.apply(this, arguments);
      clearLine = function(p, q){ return p === u && q !== t ? false : cl.apply(this, arguments); };
      try { return knife.apply(this, arguments); } finally { clearLine = cl; } };
  }
  A.mageWrap = mage => function(u){                             // an aimed Bolt: G.facing points at the aim for this one cast
    const a = u && u.aim33; if (!a) return mage.apply(this, arguments);
    delete u.aim33; const f = G.facing; G.facing = Math.atan2(a.y - u.y, a.x - u.x);
    try { return mage.apply(this, arguments); } finally { G.facing = f; } };
  A.hook = hook;
  hook(); window.addEventListener('load', hook);

  A.onKey = function(e){
    if (!A.live() || e.repeat || G.paused || G.over) return;   // F-41: works while the Momentum cards are open
    if (document.querySelector('#screen-create:not(.hidden) .cr2')) return;   // QA 2a 21b: the Founding Creator is open over the fight; its keys are not the fight's
    const c = e.code || '', k = /^Digit[1-5]$/.test(c) ? c.slice(5) : c === 'KeyE' ? 'e' : String(e.key || '').toLowerCase();
    const u = A.byKey(k); if (!u) return;
    if (e.shiftKey) A.toggle(u); else A.press(u);
  };
  window.addEventListener('keydown', e => A.onKey(e));

  /* ---- the HUD: a badge on each card (key, cooldown ring, auto pips); hud-deck.js calls it ---- */
  A.drawCard = function(ctx, u, x, y, w){
    if (!u || !A.reg(u) || A.locked(u)) return null;
    const lo = A.lo(u), R = lo.active ? REG[lo.active] : A.reg(u), ab = lo.active ? A.ab(u, lo.active) : {cd: 0, max: 0, flash: 0}, s = Math.max(18, Math.min(24, Math.round(w * 0.26))), bx = x + w - s - 3, by = y + 3, cx = bx + s / 2, cy = by + s / 2, r = s / 2;
    const col = (SPECS[R.spec] && SPECS[R.spec].color) || '#d9b45a', ready = !!lo.active && ab.cd <= 0 && A.able(u), slots = A.slots(u);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = ready ? col : '#2a2018'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = ab.flash > 0 ? '#ffffff' : ready ? '#1a1208' : 'rgba(255,255,255,.18)'; ctx.stroke();
    if (ab.cd > 0){ const q = Math.max(0, Math.min(1, ab.cd / (ab.max || 1)));   // the ring: the lit part is the time still to run
      ctx.beginPath(); ctx.arc(cx, cy, r - 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = ready ? '#1a1208' : '#c8b890'; ctx.font = 'bold ' + Math.round(s * 0.5) + 'px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(A.keyOf(u), cx, cy + 1);
    const rk = lo.active && window.BOOK33 && BOOK33.pips ? BOOK33.pips(u, lo.active) : null;   // ranks (step 6)
    if (rk && rk.max > 1) for (let i = 0; i < rk.max; i++){ ctx.fillStyle = i < rk.n ? col : 'rgba(255,255,255,.2)'; ctx.fillRect(bx - 5, by + 2 + i * 5, 3, 3); }
    const ps = 6, py = by + s + 3;   // auto pips 6 px (Art: 4 px was hard to read at 1x)
    for (let i = 0; i < slots; i++){ const px = cx - (slots * (ps + 2) - 2) / 2 + i * (ps + 2);
      ctx.fillStyle = i < lo.auto.length ? '#ffd860' : 'rgba(255,216,96,.3)'; ctx.fillRect(px, py, ps, ps); }
    try { if (u === G.leader && window.T45 && T45.gateOn && T45.gateOn()){ ctx.globalAlpha = 0.55 + 0.45 * Math.sin(performance.now() / 1000 * Math.PI * 2); ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd860'; ctx.stroke(); } } catch (e) {}   // N1 (UX): while the gate waits for this key, the badge pulses gold, 2 px, one second a cycle
    ctx.restore();
    return {x: bx, y: by, w: s, h: s + (slots ? ps + 4 : 0)};
  };
  /* Q94 B (audits/specs/q94-ability-row.md): one ability card in the row beside the squad cards. Deck logical units.
     o = {art(spec, x, y, S, col), face(u, cx, cy, d, col), hov, wide}. Returns the card's rect. Locked, Down, nothing on the key, Recovering, Ready: first that holds wins. */
  A.statusWord = (u, lo, ab) => A.locked(u) ? 'Locked' : !A.able(u) ? 'Down' : !lo.active ? 'Auto' : ab.cd > 0 ? Math.ceil(ab.cd / 60) + 's' : 'Ready';
  A.drawAbilCard = function(ctx, u, x, y, w, h, o){
    o = o || {}; const R0 = u && A.reg(u); if (!R0) return null;
    const wide = !!o.wide, locked = !!A.locked(u), lo = A.lo(u), R = lo.active ? REG[lo.active] : R0, ab = lo.active ? A.ab(u, lo.active) : {cd: 0, max: 0, flash: 0};
    const col = (SPECS[R.spec] && SPECS[R.spec].color) || '#d9b45a', able = A.able(u), noKey = !locked && !lo.active, ready = !locked && !!lo.active && ab.cd <= 0 && able, slots = A.slots(u);
    const rec = !locked && able && !noKey && ab.cd > 0, down = !locked && !able, wh = A.statusWord(u, lo, ab);
    const hex = (c, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '')); if (!m) return 'rgba(217,180,90,' + a + ')'; const v = parseInt(m[1], 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; };
    const rrp = (px, py, pw, ph, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, r); else ctx.rect(px, py, pw, ph); };
    const y0 = y; if (o.hov) y -= 2;
    ctx.save();
    rrp(x, y, w, h, 4); ctx.fillStyle = locked ? '#1a140c' : hex(col, ready ? 0.30 : 0.12); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#5a4728';
    if (!locked){ if (ab.flash > 0){ ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; } else if (ready){ ctx.strokeStyle = col; ctx.lineWidth = 2; } else if (down){ ctx.strokeStyle = '#a04a3a'; } }
    rrp(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth, 4); ctx.stroke();
    const fB = 'bold ' + (typeof hudPx === 'function' ? hudPx(13.5) : 13.5) + 'px Georgia', fR = fB.slice(5);   /* UX text floor (text-floor-1280-ruling.md): the card's words at 14 screen px at least; 1920 unchanged */
    if (locked){   // the padlock: body and shackle
      const px = x + w / 2, py = y + 34; ctx.strokeStyle = '#a89878'; ctx.fillStyle = '#a89878'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py + 11, 8.5, Math.PI, 0); ctx.lineTo(px + 8.5, py + 16); ctx.moveTo(px - 8.5, py + 11); ctx.lineTo(px - 8.5, py + 16); ctx.stroke();
      rrp(px - 13, py + 15, 26, 19, 3); ctx.fill(); ctx.fillStyle = '#1a140c'; ctx.beginPath(); ctx.arc(px, py + 23, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(px - 1.2, py + 24, 2.4, 5);
    } else if (o.art){ ctx.globalAlpha = down ? 0.35 : noKey ? 0.5 : 1; try { o.art(R.spec, x + (w - 42) / 2, y + 30, 42, ready ? '#ffffff' : col); } catch (e) {} ctx.globalAlpha = 1; }
    if (rec && ab.max > 0){ const sh = h * Math.max(0, Math.min(1, ab.cd / ab.max)); ctx.save(); rrp(x, y, w, h, 4); ctx.clip(); ctx.fillStyle = 'rgba(8,6,4,.72)'; ctx.fillRect(x, y, w, sh); ctx.restore(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const shadowText = (t, tx, ty, font, c) => { ctx.font = font; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(t, tx + 1, ty + 1); ctx.fillStyle = c; ctx.fillText(t, tx, ty); };
    if (locked){
      if (wide){ shadowText(A.nameOf(R0.id), x + w / 2, y + 74, fB, '#a89878'); shadowText('after its lesson', x + w / 2, y + 91, fR, '#a89878'); }
      else shadowText('Locked', x + w / 2, y + 86, fB, '#a89878');
    } else if (down){ shadowText('Down', x + w / 2, wide ? y + 42 : y + 86, fB, '#e07a6a'); if (wide) shadowText(A.nameOf(R.id), x + w / 2, y + 86, fB, '#efe2c4'); }
    else if (rec){ if (wide){ shadowText(Math.ceil(ab.cd / 60) + 's', x + w / 2, y + 38, 'bold 18px Georgia', '#ffffff'); shadowText(A.nameOf(R.id), x + w / 2, y + 86, fB, '#efe2c4'); }
      else shadowText(Math.ceil(ab.cd / 60) + 's', x + w / 2, y + 86, fB, '#e0904a'); }
    else if (noKey){ const auto = lo.auto && lo.auto[0] ? A.nameOf(lo.auto[0]) : A.nameOf(R.id); shadowText(wide ? auto : 'Auto', x + w / 2, y + 86, fB, wide ? '#efe2c4' : '#ffd860'); }
    else if (!(!wide && !locked && window.B45 && B45.dim && B45.dim(u))) shadowText(wide ? A.nameOf(R.id) : 'Ready', x + w / 2, y + 86, fB, wide ? '#efe2c4' : '#8fd39a');   /* UX R3: no "Ready" under "Later" */
    if (!locked && slots > 0){ const ps = 6, tot = slots * (ps + 2) - 2, ax = x + (w - tot) / 2;   // auto pips, top 76
      for (let i = 0; i < slots; i++){ ctx.fillStyle = i < lo.auto.length ? '#ffd860' : 'rgba(255,216,96,.3)'; ctx.fillRect(Math.round(ax + i * (ps + 2)), y + 76, ps, ps); } }
    if (!locked && !noKey){   // key cap
      ctx.font = 'bold 13.5px Georgia'; const kt = A.keyOf(u), kw = Math.max(20, Math.ceil(ctx.measureText(kt).width) + 8);
      rrp(x + 5, y + 5, kw, 20, 3); ctx.fillStyle = '#120e09'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#d9b45a'; ctx.stroke();
      ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd860'; ctx.fillText(kt, x + 5 + kw / 2, y + 16); ctx.textBaseline = 'top';
      const rk = window.BOOK33 && BOOK33.pips ? BOOK33.pips(u, lo.active) : null;
      if (rk && rk.max > 1) for (let i = 0; i < rk.max; i++){ ctx.fillStyle = i < rk.n ? col : 'rgba(255,255,255,.2)'; ctx.fillRect(x + 8, y + 30 + i * 5, 3, 3); } }
    try { const dm = !locked && window.B45 && B45.dim && B45.dim(u); if (dm){ rrp(x, y, w, h, 4); ctx.fillStyle = 'rgba(12,9,5,.55)'; ctx.fill(); shadowText((B45.TXT && B45.TXT.later) || 'Later', x + w / 2, y + Math.round(h / 2) - 8, 'bold 14px Georgia', '#e8dcc0');
      if (o.hov){ ctx.font = 'bold 14px Georgia'; const tw = Math.ceil(ctx.measureText(dm).width) + 12; rrp(Math.round(x + w / 2 - tw / 2), y - 26, tw, 22, 4); ctx.fillStyle = 'rgba(10,12,14,.92)'; ctx.fill(); shadowText(dm, x + w / 2, y - 22, 'bold 14px Georgia', '#ffd860'); } } } catch (e) {}   // G1: dimmed, with the reason
    if (o.face) try { o.face(u, x + w - 5 - 11, y + 5 + 11, 22, locked ? '#5a4728' : col); } catch (e) {}   // last: the cooldown shade never covers the face
    try { if (!locked && u === G.leader && window.T45 && T45.gateOn && T45.gateOn()){ ctx.globalAlpha = 0.55 + 0.45 * Math.sin(performance.now() / 1000 * Math.PI * 2); rrp(x + 1, y + 1, w - 2, h - 2, 4); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd860'; ctx.stroke(); ctx.globalAlpha = 1; } } catch (e) {}   // N1: the gold pulse moves to the card's border
    if (o.hov){ rrp(x - 1, y - 1, w + 2, h + 2, 5); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd860'; ctx.stroke(); }
    ctx.restore();
    return {x, y: y0, w, h};
  };
  A.panel = function(u){
    const R0 = A.reg(u); if (!R0) return null; const lo = A.lo(u), n = A.slots(u), key = A.keyOf(u), who = u.p ? u.p.name : 'Leader';
    if (A.locked(u)) return [[`[${key}] ${A.nameOf(R0.id)}`, '#a89878', 1], ['After its lesson', '#a89878'], ['Not yet', '#9a8a70']];   // Q94 §4
    const nm = A.nameOf, book = !!(window.BOOK33 && BOOK33.live()), out = [];
    if (lo.active){ const R = REG[lo.active], Ab = {name: nm(lo.active), cd: R.cd}, ab = A.ab(u, lo.active);
      const rk = window.BOOK33 && BOOK33.pips ? BOOK33.pips(u, lo.active) : null;
      out.push([`[${key}] ${Ab.name}${rk && rk.max > 1 ? ' (rank ' + rk.n + ')' : ''}`, (SPECS[R.spec] && SPECS[R.spec].color) || '#d9b45a', 1],
        [`${who} \u00b7 cooldown ${Ab.cd}s${R.aimed ? ' \u00b7 aims at the cursor' : ''}`, '#9a8a70'],
        [!A.able(u) ? 'Down: cannot cast' : ab.cd > 0 ? `Recovering: ${Math.ceil(ab.cd / 60)}s` : 'Ready', ab.cd > 0 || !A.able(u) ? '#e0904a' : '#8fd39a']);
    } else out.push([`[${key}] nothing on the key`, '#9a8a70', 1], [who, '#9a8a70']);
    const autos = lo.auto.map(id => { const st = A.ab(u, id); return nm(id) + (st.cd > 0 ? ` (${Math.ceil(st.cd / 60)}s)` : ' (ready)'); }).join(', ');
    out.push([(!n ? 'No spare auto slot yet' : (lo.auto.length ? `Auto: ${autos}; cooldown x${A.K.autoMul}` : `${n} spare auto slot${n > 1 ? 's' : ''}, empty`))
      + (n ? (book ? ' (set in camp)' : ` (Shift+${key})`) : ''), n ? '#ffd860' : '#9a8a70']);
    return out; };
  A.legend = () => '[1-5] mates, [E] Leader, or click a card badge: abilities' + (window.BOOK33 && BOOK33.live() ? ' \u00b7 loadouts are set in camp' : ' \u00b7 [Shift+key] auto');

  /* ---- self-test (a stub field; nothing is saved) ---- */
  A.selfTest = function(){
    const res = [], ok = (c, m) => res.push({ok: !!c, m});
    const done = () => { const fails = res.filter(r => !r.ok).map(r => r.m); return {ok: !fails.length, n: res.length, fails, res}; };
    const f = F(); if (!f){ ok(false, 'F33 loaded'); return done(); }
    hook();
    const sv = {G: typeof G !== 'undefined' ? G : undefined, ac: abilityCasters, pop: typeof pop === 'function' ? pop : null, sfx: SFX.play,
                fx: Object.assign({}, ABIL_FX), META: META.leader, mouse: Object.assign({}, f.mouse), tw: f.toWorld, bk: window.BOOK33 ? BOOK33.live : null};
    if (window.BOOK33) BOOK33.live = () => false;   // test only: step 4's own rules; BOOK33.selfTest covers the loadout
    const fired = [];
    try {
      pop = () => {}; SFX.play = () => {};
      const rec = s => function(u){ fired.push({s, u, facing: G.facing}); };
      for (const s of Object.keys(sv.fx)) ABIL_FX[s] = rec(s);
      const mk = (spec, extra) => Object.assign({spec, state: 'up', x: 100, y: 100, r: 10, con: 4, maxCon: 4, s: {magic: 2}, p: {name: spec, spec, adv: 0, magic: 0}}, extra || {});
      const L = {spec: 'SOLDIER', isLeader: true, x: 100, y: 100, r: 10, con: 5, maxCon: 5, wounds: 3, maxWounds: 3, down: false, s: {magic: 0}};
      const sq = [mk('MAGE', {p: {name: 'M1', spec: 'MAGE', magic: 2}}), mk('MAGE', {p: {name: 'M2', spec: 'MAGE', magic: 1}}), mk('CLERIC'), mk('SCOUNDREL'), mk('WITCH'), mk('SOLDIER')];
      META.leader = {spec: 'SOLDIER', level: 1};
      G = {leader: L, squad: sq, enemies: [], abil: {SOLDIER: {cd: 0}, MAGE: {cd: 0}, CLERIC: {cd: 0}, SCOUNDREL: {cd: 0}, WITCH: {cd: 0}}, abilQ: [], frame: 0, quicken: 0,
           facing: 0, mod: {radius: 120, precision: 0}, fx: [], shots: [], illusionT: 0, over: false, paused: false, mode: 'contract'};
      ok(A.live(), 'live in a contract');
      ok(A.byKey('1') === sq[0] && A.byKey('5') === sq[4] && A.byKey('e') === L && A.byKey('6') === null, 'keys 1-5 and E map to the first five mates and the Leader');
      A.onKey({code: 'Digit2', key: '2'}); updateAbilities();
      ok(G.abilQ.length === 0 && fired.length === 1 && fired[0].u === sq[1], 'one press fires one character (mate 2), not every Mage');
      ok(A.ab(sq[1]).cd > 0 && !(A.ab(sq[0]).cd > 0) && (G.abil.MAGE.cd | 0) === 0, 'the cooldown is that character\'s own; the Specialty pool is untouched');
      fired.length = 0; A.onKey({code: 'Digit2', key: '2'}); updateAbilities(); ok(fired.length === 0, 'a second press while cooling does nothing');
      A.onKey({code: 'Digit1', key: '1'}); updateAbilities(); ok(fired.length === 1 && fired[0].u === sq[0], 'mate 1 still casts while mate 2 cools');
      // aimed Bolt: the cursor sets the line
      f.toWorld = (x, y) => ({x, y}); f.mouse.x = 100; f.mouse.y = 300; A.ab(sq[0]).cd = 0; fired.length = 0;
      let seen = null; ABIL_FX.MAGE = A.mageWrap(function(u){ seen = G.facing; });
      A.press(sq[0]); updateAbilities(); ok(seen != null && Math.abs(seen - Math.PI / 2) < 1e-6 && G.facing === 0, 'an aimed Bolt follows the cursor (and G.facing is put back)');
      ABIL_FX.MAGE = rec('MAGE');
      // auto: x1.5
      const base = Math.round(ABILITIES.CLERIC.cd * 60); const cl = sq[2]; cl.p.magic = 1; delete cl.ab33; const one = A.slots(cl); cl.p.magic = 2;
      ok(one === 0 && A.slots(cl) === 1 && A.slots(sq[3]) === 0 && A.slotsFor({spec: 'SOLDIER', adv: 4}) === 3 && A.slotsFor({spec: 'SOLDIER', level: 3}) === 2 && A.slotsFor({spec: 'MAGE', magic: 2}) === 2, 'slots: Magic for casters; fighters 1, +1 at 2 and 4 Advancements; the active needs a spare one');
      ok(A.toggle(cl) && A.ab(cl).auto && cl.p.auto33 === true, 'Shift toggles auto when there is a slot');
      ok(!A.toggle(sq[3]) && !A.ab(sq[3]).auto, 'no slot, no auto');
      L.con = 2; fired.length = 0; updateAbilities(); updateAbilities();
      ok(fired.some(q => q.s === 'CLERIC' && q.u === cl) && Math.abs(A.ab(cl).cd - Math.round(base * 1.5)) <= 1, 'auto fires when someone is under 60%, cooldown x1.5');
      L.con = 5; A.ab(cl).cd = 0; fired.length = 0; updateAbilities(); ok(!fired.some(q => q.s === 'CLERIC'), 'auto holds when nobody is hurt');
      // stray useAbility (the bot) goes to one ready caster
      sq[3].ab33 = {}; fired.length = 0; useAbility('SCOUNDREL'); updateAbilities();
      ok(fired.length === 1 && fired[0].u === sq[3] && A.ab(sq[3]).cd > 0, 'a stray useAbility(spec) casts one ready character');
      // Q94 criterion 5: the white border flashes when the ability becomes ready again (cd reaches 0), not only at a cast
      { const e = A.ab(sq[3]); e.cd = 2; e.max = 600; e.flash = 0; const was = fired.length; updateAbilities(); const mid = [e.cd, e.flash]; updateAbilities();
        ok(mid[0] === 1 && mid[1] === 0 && (e.flash > 0 || fired.length > was), 'the ready flash is set when cd reaches 0 (cd 2 -> 1 no flash, then flash)'); }
      // the badge draws
      const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120; const c2 = cv.getContext('2d');
      const rr = A.drawCard(c2, cl, 0, 0, 88); ok(rr && rr.w >= 18 && rr.h > rr.w, 'the card badge draws (key, ring, auto pips)');
      ok(/Auto: /.test(A.panel(cl).map(l => l[0]).join(' ')), 'the hover panel names the auto state');
      // Q94 (specs/q94-ability-row.md §7): drawAbilCard returns the whole card in every state, wide and compact
      { const u = sq[2], able0 = A.able, locked0 = A.locked, lo0 = A.lo, ab0 = A.ab, st = {};
        const draw = (name, wide) => { try { const r = A.drawAbilCard(c2, u, 3, 5, wide ? 112 : 82, 100, {wide, art: () => {}, face: () => {}}); ok(r && r.x === 3 && r.y === 5 && r.w === (wide ? 112 : 82) && r.h === 100, 'drawAbilCard ' + name + (wide ? ' wide' : ' compact') + ' returns the full card: ' + JSON.stringify(r)); } catch (e) { ok(false, 'drawAbilCard ' + name + ' threw: ' + e.message); } };
        try {
          for (const wide of [true, false]){ A.able = () => true; A.locked = () => false; draw('Ready', wide);
            A.ab = (x, k) => Object.assign({}, ab0(x, k), {cd: 300, max: 600}); draw('Recovering', wide); A.ab = ab0;
            A.able = () => false; draw('Down', wide); A.able = () => true;
            A.lo = x => Object.assign({}, lo0(x), {active: null}); draw('auto only', wide); A.lo = lo0;
            A.locked = () => true; draw('Locked', wide); A.locked = () => false; }
        } finally { A.able = able0; A.locked = locked0; A.lo = lo0; A.ab = ab0; } }
    } catch (err){ ok(false, 'threw: ' + err.message); }
    finally {
      G = sv.G; abilityCasters = sv.ac; if (sv.pop) pop = sv.pop; SFX.play = sv.sfx; META.leader = sv.META;
      for (const s of Object.keys(sv.fx)) ABIL_FX[s] = sv.fx[s]; Object.assign(f.mouse, sv.mouse); f.toWorld = sv.tw; if (window.BOOK33) BOOK33.live = sv.bk;
    }
    return done();
  };
})();
