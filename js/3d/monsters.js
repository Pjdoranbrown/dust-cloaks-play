/* Index MON3D-1  Monsters as 3D figures for VO-2 (Fable, 2026-11-11). Contract: docs/vo2-design.md, notes audits/fable/vo2-monsters.md.
   WHAT   Every enemy kind that can stand on the field draws through the figure ray-caster in the same style and light as the
          people: own recipes for the undead (skeleton as a true bone rig, ghoul as a hunched brute), the Outrider Slaver (mount
          rig) and the Ram Crew (prop rig); every other kind reuses the recipe it already has (r3dEnemyRecipe, R3D_SPECIAL,
          r3qRecipe). The hook wraps drawSprite after the Index 56/57 wrappers: foes draw lit, at the VO2 figure scale, with a
          small synchronous render budget per game frame so first sight is not a pixel sprite, and fall back to the pixel art
          on any throw. Loads after js/3d/world.js and before js/3d/vo2.js.
   KNOBS  MON3D.on (follows VO2.on; MON3D.on = true or false forces it, null follows again), MON3D.budget (sync render ms per
          game frame, 12), MON3D.EXCEPT (kinds left on their sprite, with the reason).
   TEST   MON3D.selfTest(); MON3D.sheet() draws one of every kind beside a human figure and returns a PNG data URL;
          MON3D.sheet({post:true}) also POSTs it to the scratchpad saver on port 8769; MON3D.pump(ms) drains the frame queue. */
(function(){
  'use strict';
  if (window.MON3D) return;
  const M = window.MON3D = {force:null, budget:12, spent:0, last:-1, R:{}, stats:{drawn:0, sync:0, fell:0}, BUILD:{},
    EXCEPT:{}};   // kind -> reason (filled below if a kind has no rig)
  Object.defineProperty(M, 'on', {get(){ return M.force !== null ? M.force : !!(window.VO2 && VO2.on); }, set(v){ M.force = v === null || v === undefined ? null : !!v; }});
  const has = f => { try { return (0, eval)('typeof ' + f) === 'function'; } catch (e) { return false; } };   // top-level let/const are not window properties
  const def = n => { try { return (0, eval)('typeof ' + n) !== 'undefined'; } catch (e) { return false; } };
  const need = ['r3dEnemyRecipe', 'r3dSkeleton', 'r3dBuild54', 'r3dMute', 'r3qRecipe', 'r3qMountRecipe', 'r3dFrames', 'r3dFramesAsync', 'r3dDraw', 'r3qDraw', 'r3dChoose', 'r3qChoose', 'r3dUnitAt', 'r3dPumpTick', 'r3dPump', 'r3dUseStyle', 'r3dScaleRec', 'hash', 'shade'];
  const ready = () => need.every(has) && ['R3D', 'R3D_STYLES', 'R3D_CLIPS', 'BESTIARY', 'R3DQ'].every(def);

  /* ----------------------------------------------------------------------- palette (docs/art-direction.md: bone, mud, steel, ash) --- */
  const PAL = {bone:'#d8ccae', boneD:'#8a7e66', void:'#241c14', rag:'#5e5646', ragD:'#3e382c', rust:'#6b4a2e', rustL:'#8a6a44', flesh:'#8a9080', fleshD:'#5a6050', claw:'#c8bca0',
    wood:'#6a4a2a', woodD:'#3e2a16', iron:'#5d6670', rope:'#a8946c'};

  /* --------------------------------------------------------------------------------------------------------------- own recipes --- */
  const copy = rec => ({rig:rec.rig, skel:{order:rec.skel.order.slice(), bones:JSON.parse(JSON.stringify(rec.skel.bones))}, parts:rec.parts.map(q => Object.assign({}, q)), zones:Object.assign({}, rec.zones), grip:rec.grip});

  // Skeleton: the base recipe gives the bones and the weapon; the body is rebuilt as bone with a dark void behind the ribs
  M.BUILD.skeleton = function(){
    const base = r3dEnemyRecipe('skeleton'), rec = copy(base);
    const D = r3dSkeleton({h:1, w:1, hk:1}, false).dims, s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, torso = D.torso, thigh = D.thigh, shin = D.shin;
    const STRIP = new Set(['skin', 'cloth', 'clothD', 'top', 'legs', 'boots', 'leather', 'hair', 'mouth', 'eye', 'eyeglow', 'robe', 'tabard', 'trim', 'capc', 'cape', 'capeTrim', 'hood', 'hat', 'helm', 'mail', 'plate', 'strap', 'shield', 'mask', 'fur', 'glow']);
    rec.parts = rec.parts.filter(q => !STRIP.has(q.z));   // keeps the weapon (metal, gold, wood)
    const add = (b, list) => { for (const q of list) rec.parts.push(Object.assign({b}, q)); };
    add('pelvis', [{t:'ell', c:[0, 0, 0], r:[5.2 * w, 2.4 * s, 3 * w], z:'bone'}, {t:'box', c:[0, -4 * s, 0], r:[5 * w, 4.5 * s, 2.6 * w], z:'rag'}]);
    add('chest', [{t:'cap', a:[0, 0, 0], p:[0, torso, 0], r:1.3, z:'bone'}, {t:'ell', c:[0, 9 * s, 0], r:[5.4 * w, 7.5 * s, 3.2 * w], z:'void'},
      {t:'cap', a:[-9 * w, torso - 2.5 * s, 0.5], p:[9 * w, torso - 2.5 * s, 0.5], r:0.9, z:'bone'}]);
    for (let i = 0; i < 4; i++) add('chest', [{t:'ell', c:[0, 4.5 * s + i * 3.3 * s, 0.4], r:[(7.4 - i * 0.5) * w, 1.05 * s, 5.2 * w], z:'bone'}]);
    for (const [u, l, h, sx] of [['upL', 'loL', 'hdL', 1], ['upR', 'loR', 'hdR', -1]]){
      add(u, [{t:'ell', c:[0, 0.5, 0], r:[2.2 * w, 2 * s, 2.2 * w], z:'bone'}, {t:'cap', a:[0, 0, 0], p:[0, -13 * s, 0], r:1.35 * w, z:'bone'}]);
      add(l, [{t:'ell', c:[0, 0, 0], r:[1.9 * w, 1.9 * s, 1.9 * w], z:'bone'}, {t:'cap', a:[0, 0, 0], p:[0, -11.5 * s, 0], r:1.15 * w, z:'bone'}]);
      add(h, [{t:'ell', c:[0, -1, 0.6], r:[1.8 * w, 2.3, 1.5], z:'bone'}, {t:'cap', a:[sx * 0.6, -2.5, 1], p:[sx * 1.2, -4.8, 1.6], r:0.5, z:'bone'}]);
    }
    for (const [t, sh] of [['thL', 'shL'], ['thR', 'shR']]){
      add(t, [{t:'ell', c:[0, 0, 0], r:[2.4 * w, 2.2 * s, 2.4 * w], z:'bone'}, {t:'cap', a:[0, 0, 0], p:[0, -thigh, 0], r:1.7 * w, z:'bone'}]);
      add(sh, [{t:'ell', c:[0, 0, 0.3], r:[2.3 * w, 2.3 * s, 2.3 * w], z:'bone'}, {t:'cap', a:[0, 0, 0], p:[0, -shin, 0], r:1.4 * w, z:'bone'}, {t:'ell', c:[0, -shin, 1.8], r:[1.9 * w, 1.3 * s, 3.6 * s], z:'bone'}]);
    }
    add('head', [{t:'ell', c:[0, hy, 0], r:[5.6 * hk, 6.1 * hk, 5.7 * hk], z:'bone'}, {t:'ell', c:[0, hy - 3.6 * hk, 2 * hk], r:[3.8 * hk, 2.4 * hk, 3.4 * hk], z:'bone'},
      {t:'box', c:[0, hy - 2.2 * hk, 4.6 * hk], r:[3.2 * hk, 0.5, 1.2], z:'void'}, {t:'ell', c:[0, hy - 0.8 * hk, 5.6 * hk], r:[0.9, 1.3, 0.8], z:'void'},
      {t:'box', c:[0, hy + 3.4 * hk, 0], r:[6 * hk, 1.3 * hk, 6 * hk], z:'rust'}]);
    for (const sx of [1, -1]) add('head', [{t:'ell', c:[sx * 2.3 * hk, hy + 0.6 * hk, 5 * hk], r:[1.8, 2, 1], z:'void'}, {t:'ell', c:[sx * 2.3 * hk, hy + 0.5 * hk, 5.4 * hk], r:[1, 1, 0.6], z:'eyeglow'}]);
    add('cape', [{t:'box', c:[0, -6 * s, 0], r:[5 * w, 7 * s, 0.6], z:'ragD'}]);
    add('cape2', [{t:'box', c:[1.5 * w, -5 * s, 0], r:[2.6 * w, 6 * s, 0.5], z:'rag'}]);
    Object.assign(rec.zones, {bone:PAL.bone, void:PAL.void, rag:PAL.rag, ragD:PAL.ragD, rust:PAL.rust, eyeglow:'#ff6a3a', metal:PAL.rustL, gold:'#8a7a50', wood:PAL.woodD, cape:PAL.ragD, capeTrim:PAL.ragD, glass:'#9fb8c8'});
    return rec;
  };

  // Ghoul: the base figure hunched on the brute rig, grey flesh, no weapon, claws
  M.BUILD.ghoul = function(){
    const base = r3dEnemyRecipe('ghoul'), rec = copy(base);
    const D = r3dSkeleton({h:1, w:1.22, hk:1}, false).dims, w = D.w, hk = D.hk, hy = 6.2 * hk;
    const STRIP = new Set(['hair', 'gold', 'metal', 'wood', 'hat', 'helm', 'hood', 'shield', 'cape', 'capeTrim', 'capc']);
    rec.parts = rec.parts.filter(q => !STRIP.has(q.z) && !(q.b === 'head' && q.z === 'mouth'));
    const add = (b, list) => { for (const q of list) rec.parts.push(Object.assign({b}, q)); };
    for (const [h, sx] of [['hdL', 1], ['hdR', -1]]) for (const k of [-1, 0, 1]) add(h, [{t:'cap', a:[sx * k * 1.1, -1.5, 1.2], p:[sx * k * 1.8, -6, 2.6], r:0.55, z:'claw'}]);
    add('head', [{t:'box', c:[0, hy - 2.6 * hk, 5.2 * hk], r:[2.6 * hk, 0.7, 0.8], z:'void'}]);
    for (const sx of [1, -1]) for (const k of [0, 1, 2]) add('head', [{t:'cap', a:[sx * (0.6 + k * 0.9) * hk, hy - 2.4 * hk, 5.4 * hk], p:[sx * (0.6 + k * 0.9) * hk, hy - 3.6 * hk, 5.6 * hk], r:0.3, z:'claw'}]);
    add('chest', [{t:'ell', c:[0, 15 * D.s, -2 * w], r:[6 * w, 4 * D.s, 3 * w], z:'skin'}]);   // the hump
    rec.rig = 'brute'; rec.poseAdd = {chest:[0.5, 0, 0], head:[-0.55, 0, 0], upL:[-0.35, 0, 0.3], upR:[-0.35, 0, -0.3], loL:[-0.5, 0, 0], loR:[-0.5, 0, 0]};
    rec.grip = 'swing';
    Object.assign(rec.zones, {skin:PAL.flesh, top:PAL.ragD, cloth:PAL.ragD, clothD:'#2e2a24', legs:'#34302a', boots:'#2a241e', leather:'#3a3028', claw:PAL.claw, void:PAL.void, eyeglow:'#e8f060', mouth:PAL.void});
    return rec;
  };

  // Outrider Slaver: a chain-armoured rider with a spear on a warhorse (the pixel sprite is the Overseer look on a warhorse)
  M.BUILD.slaver = function(){
    const look = Object.assign({hairStyle:'short'}, ENEMY_LOOK.overseer, {weapon:'spear', cape:null});
    const p = {name:'enemy:slaver', race:'HUMAN', spec:'SOLDIER', sex:'m', id:'E', injuries:[]};
    const rider = r3dBuild54(p, false, {kit:'ENEMY', look, race3d:{h:1, w:1, hk:1, ears:'elf'}, weight:'medium', material:'chain'});
    rider.zones.cloth = look.top; rider.zones.clothD = shade(look.top, 0.72); rider.zones.capc = look.acc; rider.zones.hat = look.acc;
    r3dMute(rider); rider.zones.glass = '#9fb8c8';
    rider.key = 'r3dslv' + hash(JSON.stringify(rider));
    return r3qMountRecipe(rider, 'horse:warhorses');
  };

  // Ram Crew: a wheeled frame, a slung log with an iron head, a hide roof (prop rig like the siege engine)
  M.BUILD.ram = function(){
    const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    add('root', [{t:'box', c:[9, 5, 0], r:[1.6, 1.6, 24], z:'wood'}, {t:'box', c:[-9, 5, 0], r:[1.6, 1.6, 24], z:'wood'},
      {t:'box', c:[0, 5, 20], r:[10, 1.5, 1.5], z:'woodD'}, {t:'box', c:[0, 5, -20], r:[10, 1.5, 1.5], z:'woodD'}]);
    for (const [x, z] of [[11, 16], [-11, 16], [11, -16], [-11, -16]]) add('root', [{t:'ell', c:[x, 5.5, z], r:[1.2, 5.5, 5.5], z:'woodD'}, {t:'ell', c:[x + Math.sign(x), 5.5, z], r:[0.6, 1.4, 1.4], z:'iron'}]);
    for (const z of [14, 0, -14]) for (const x of [8, -8]) add('root', [{t:'box', c:[x, 16, z], r:[1.3, 10, 1.3], z:'wood'}]);
    add('root', [{t:'box', c:[0, 27, 0], r:[11, 1.2, 23], z:'hide'}, {t:'box', c:[0, 28.5, 0], r:[1.4, 1.4, 24], z:'woodD'},
      {t:'box', c:[9, 26, 0], r:[1.2, 1.2, 23], z:'woodD'}, {t:'box', c:[-9, 26, 0], r:[1.2, 1.2, 23], z:'woodD'}]);
    for (const z of [10, -10]) add('root', [{t:'cap', a:[0, 26, z], p:[0, 14, z], r:0.6, z:'rope'}]);
    add('top', [{t:'cap', a:[0, 0, -22], p:[0, 0, 24], r:3.2, z:'wood'}, {t:'ell', c:[0, 0, 25], r:[4, 4, 3], z:'iron'}, {t:'box', c:[0, 0, 24], r:[4.4, 4.4, 1], z:'iron'},
      {t:'ell', c:[0, 0, -6], r:[3.6, 3.6, 1.2], z:'rope'}, {t:'ell', c:[0, 0, 8], r:[3.6, 3.6, 1.2], z:'rope'}]);
    const rec = {rig:'prop', skel:{order:['root', 'top'], bones:{root:{parent:null, off:[0, 0, 0]}, top:{parent:'root', off:[0, 13, 0]}}}, parts:P,
      zones:{wood:PAL.wood, woodD:PAL.woodD, iron:PAL.iron, rope:PAL.rope, hide:'#5a4a36'}, feetOff:4, shadowW:16, frame:{W:150, H:110, FEET:90, CX:75}};
    r3dScaleRec(rec, 1.4); rec.frame = {W:210, H:154, FEET:126, CX:105};
    return rec;
  };

  M.recipe = function(kind){
    if (M.R[kind] !== undefined) return M.R[kind];
    let rec = null;
    try {
      if (M.BUILD[kind]){ rec = M.BUILD[kind](); if (!rec.key) rec.key = 'mon3d' + hash(JSON.stringify(rec)); if (BESTIARY[kind] && BESTIARY[kind].boss && !rec.halo) rec.halo = def('HALO_DEFAULT') ? HALO_DEFAULT : rec.halo; }
      else if (kind === 'wyrm' && has('r3wBuild')){ if (!R3QR.wyrm || R3QR.wyrm.rig !== 'wyrm') R3QR.wyrm = r3wBuild(); rec = R3QR.wyrm; if (!rec.key) rec.key = 'r3w' + hash(JSON.stringify(rec)); }   // Index 98 clears R3QR after the wyrm was built; r3qBuild('wyrm') then makes a blank quad
      else if (def('QUAD_KINDS') && QUAD_KINDS.has(kind)) rec = r3qRecipe(kind);
      else { const spr = enemySprite(kind); if (spr && spr.e3d) rec = r3dEnemyRecipe(kind); }
    } catch (e) { rec = null; M.EXCEPT[kind] = 'recipe threw: ' + e.message; }
    if (!rec && !M.EXCEPT[kind]) M.EXCEPT[kind] = 'no rig';
    return M.R[kind] = rec;
  };
  M.reset = function(){ for (const k in M.R) delete M.R[k]; };

  /* ------------------------------------------------------------------------------------------------------------------- draw --- */
  const HUMAN = {humanoid:1, brute:1, mount:1, prop:1};
  const cached = (rec, clip, dir, St) => { const C = R3D.cache[rec.key + ':' + St.id]; return !!(C && C[clip] && C[clip][dir]); };
  M.tick = function(){ const t = G ? G.frame : (def('CAMP') ? CAMP.t : 0); if (t !== M.last){ M.last = t; M.spent = 0; } r3dPumpTick(); };
  M.drawUnit = function(rec, u, x, y, s, frame, tick, flash){
    if (window.VO2 && VO2.on) s *= VO2.figure || 1;
    const c = HUMAN[rec.rig] ? r3dChoose(rec, u, frame, tick) : r3qChoose(u, frame, tick, true, rec.rig);
    const clips = R3D_CLIPS[rec.rig]; if (clips && !clips[c.clip]){ c.clip = 'idle'; c.i = 0; }
    const St = R3D_STYLES[r3dStyleId() || 'crisp'];
    if (!cached(rec, c.clip, c.dir, St) && M.spent < M.budget){ const t0 = performance.now(); r3dFrames(rec, c.clip, c.dir, St); M.spent += performance.now() - t0; M.stats.sync++; }
    const o = Object.assign(c, {flash, async:true, light:true});
    return rec.frame && !HUMAN[rec.rig] ? r3qDraw(rec, x, y + 7 * s, s, Object.assign(o, {shadowW:rec.shadowW || (rec.rig === 'quad' && u.k === 'alpha' ? 10 : 8)})) : r3dDraw(rec, u, x, y, s, o);
  };

  function hook(){
    const prevDraw = drawSprite;
    drawSprite = function(spr, x, y, s, frame, left, flash){
      if (M.on && spr && (spr.mon3d || spr.e3d || spr.q3d)){
        try {
          M.tick();
          const kind = spr.mon3d || spr.e3d || spr.q3d, [u, tick] = r3dUnitAt(x, y);
          if (u){ const rec = M.recipe(kind);
            if (rec){ if (!spr.q3d) u.e3d = true; if (M.drawUnit(rec, u, x, y, s, frame, tick, flash)){ M.stats.drawn++; return; } } }
        } catch (e) { M.stats.fell++; (typeof r3dWarnOnce === 'function' ? r3dWarnOnce('MON3D', e) : console.warn('3D MON3D drew the placeholder:', e)); /* S6-C note 10: no pixel fallback; once per kind */ }
      }
      return prevDraw(spr, x, y, s, frame, left, flash);
    };
    // the two kinds with no 3D tag yet
    const prevSpr = enemySprite;
    enemySprite = function(kind){ const spr = prevSpr(kind); if (spr && (kind === 'slaver' || kind === 'ram') && !spr.e3d && !spr.q3d) spr.mon3d = kind; return spr; };
    // deaths with the new recipes: every rig has a death clip (the mount rig's is maps.js R3D_CLIPS.mount.death), so no pixel corpse (PL-1 item 6, LE probe 22 Nov)
    if (has('r3dCorpse')){ const prevC = r3dCorpse;
      r3dCorpse = function(x){
        if (M.on && M.BUILD[x.k]){ try { const rec = M.recipe(x.k), clips = rec && R3D_CLIPS[rec.rig];
          if (rec && clips && clips.death){ const s = BESTIARY[x.k].sc * 1.2 * ((window.VO2 && VO2.on) ? (VO2.figure || 1) : 1); if (x.born === undefined) x.born = G.frame;
            if (r3dDraw(rec, x, x.x, x.y, s, {clip:'death', i:Math.min(5, Math.floor((G.frame - x.born) / 5)), dir:x.dir !== undefined ? x.dir : (x.left ? 4 : 0), alpha:Math.min(1, x.life / 40) * 0.95, shadow:false, async:true})) return true; } } catch (e) {} }
        return prevC(x);
      }; }
    // warm the queue when a contract starts: idle and walk for every kind the host can field
    if (has('startDeployment')){ const prevS = startDeployment;
      startDeployment = function(c, ids){
        const r = prevS(c, ids);
        try { if (G && M.on) M.warm(c); } catch (e) {}
        return r;
      }; }
  }
  M.warm = function(c){
    const St = R3D_STYLES[r3dStyleId() || 'crisp'], kinds = new Set(G.enemies.map(e => e.k));
    try { const H = hostOf(); for (const t in H.pools) for (const k of H.pools[t]) kinds.add(k); for (const k of (H.bosses[(c && c.tier) || 1] || [])) kinds.add(k); } catch (e) {}
    for (const k of kinds){ const rec = M.recipe(k); if (!rec) continue; const clips = HUMAN[rec.rig] ? ['idle', 'walk'] : ['idle', 'walk', 'run'];
      for (const clip of clips) if (R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig][clip]) for (let d = 0; d < 8; d++) r3dFramesAsync(rec, clip, d, St, true); }
  };
  M.pump = function(ms){ const t0 = performance.now(); let n = 0; while (R3DQ.q.length && performance.now() - t0 < (ms || 2000)){ r3dPump(50); n++; } return {left:R3DQ.q.length, ms:Math.round(performance.now() - t0), rounds:n}; };

  /* ------------------------------------------------------------------------------------------------------------------ sheet --- */
  M.kinds = function(){ return Object.keys(BESTIARY).filter(k => BESTIARY[k].sc).sort(); };
  M.sheet = function(opt){
    opt = opt || {};
    const St = R3D_STYLES.painted, kinds = M.kinds(), cols = 8, cw = 150, ch = 190, rows = Math.ceil((kinds.length + 1) / cols);
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch + 30; const g = c.getContext('2d');
    g.fillStyle = '#3a2c20'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#efe3c8'; g.font = 'bold 14px Georgia'; g.textAlign = 'left'; g.fillText('MON3D sheet: every kind, idle, facing the camera, painted style, beside a human (40 px at 1x)', 10, 20);
    const fig = (window.VO2 && VO2.figure) || 1;
    const place = (i, label, draw) => { const x = (i % cols) * cw, y = 30 + Math.floor(i / cols) * ch, base = y + ch - 34;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4, y + 4, cw - 8, ch - 8); g.strokeStyle = 'rgba(239,227,200,.25)'; g.strokeRect(x + 4.5, y + 4.5, cw - 8, ch - 8);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + cw / 2, base, 26, 7, 0, 0, Math.PI * 2); g.fill();
      try { draw(x + cw / 2, base); } catch (e) { g.fillStyle = '#ff8a7a'; g.font = '11px Georgia'; g.textAlign = 'center'; g.fillText('threw', x + cw / 2, base - 40); }
      g.fillStyle = '#efe3c8'; g.font = '12px Georgia'; g.textAlign = 'center'; g.fillText(label, x + cw / 2, y + ch - 14); };
    const img = (rec, clip, dir) => { r3dUseStyle(St); const fr = r3dFrames(rec, clip, dir, St); return fr[0]; };
    const drawRec = (rec, s) => (cx, base) => { const im = img(rec, 'idle', 2), k = St.res, sc = s / R3D.K / k;
      const FEET = rec.frame ? Math.round(rec.frame.FEET * k) : R3D.FEET, CX = rec.frame ? Math.round(rec.frame.CX * k) : R3D.CX;
      g.imageSmoothingEnabled = false; g.drawImage(im, cx - CX * sc, base - FEET * sc, im.width * sc, im.height * sc); };
    let human = null; try { human = def('META') && META && META.leader ? r3dLeaderRecipe() : r3dEnemyRecipe('levy'); } catch (e) {}
    if (human) place(0, 'human (ref)', drawRec(human, 2.4 * fig));
    kinds.forEach((k, i) => { const rec = M.recipe(k), s = BESTIARY[k].sc * 1.2 * fig;
      if (rec) place(i + 1, k + (M.BUILD[k] ? ' *' : ''), drawRec(rec, s));
      else place(i + 1, k + ' (sprite: ' + (M.EXCEPT[k] || 'no rig') + ')', (cx, base) => { const spr = enemySprite(k), f = spr.frames && spr.frames[0];
        if (f){ g.imageSmoothingEnabled = false; g.drawImage(f, cx - spr.ax * s, base - spr.ay * s, f.width * s, f.height * s); }
        else { g.fillStyle = 'rgba(200,180,140,.28)'; g.beginPath(); g.ellipse(cx, base - (spr.h || 18) * s * 0.45, (spr.w || 14) * s * 0.35, (spr.h || 18) * s * 0.4, 0, 0, Math.PI * 2); g.fill(); } }); });
    try { r3dUseStyle(R3D_STYLES[r3dStyleId() || 'crisp']); } catch (e) {}
    const url = c.toDataURL('image/png');
    if (opt.post) return fetch('http://localhost:8769/save?name=' + encodeURIComponent(opt.name || 'monsters.png'), {method:'POST', body:url}).then(r => r.text());
    return url;
  };

  /* --------------------------------------------------------------------------------------------------------------- self test --- */
  M.selfTest = function(){
    const details = []; let pass = 0, fail = 0;
    const ok = (name, v) => { if (v) pass++; else fail++; details.push((v ? 'ok   ' : 'FAIL ') + name); };
    ok('renderer present', ready());
    const kinds = M.kinds(), covered = [], excepted = [];
    for (const k of kinds){ const rec = M.recipe(k); if (rec) covered.push(k); else excepted.push(k + ': ' + M.EXCEPT[k]); }
    ok('every kind has a recipe or a declared exception (' + covered.length + ' covered, ' + excepted.length + ' excepted)', kinds.every(k => M.recipe(k) || M.EXCEPT[k]));
    ok('own recipes build (skeleton, ghoul, slaver, ram)', ['skeleton', 'ghoul', 'slaver', 'ram'].every(k => M.recipe(k) && M.recipe(k).key));
    let threw = null; const St = R3D_STYLES.painted;
    try { for (const k of covered){ const rec = M.recipe(k); r3dFrames(rec, 'idle', 2, St); } } catch (e) { threw = e.message; } finally { try { r3dUseStyle(R3D_STYLES[r3dStyleId() || 'crisp']); } catch (e) {} }
    ok('painted idle frames render for every covered kind without a throw' + (threw ? ' (' + threw + ')' : ''), !threw);
    ok('skeleton is a bone rig (no skin zone, ribs on the chest)', (() => { const r = M.recipe('skeleton'); return r && !r.parts.some(q => q.z === 'skin') && r.parts.filter(q => q.b === 'chest' && q.z === 'bone').length >= 5; })());
    ok('ghoul is a hunched brute with claws', (() => { const r = M.recipe('ghoul'); return r && r.rig === 'brute' && r.poseAdd && r.parts.some(q => q.z === 'claw'); })());
    ok('slaver is a mount rig, ram a prop rig', M.recipe('slaver').rig === 'mount' && M.recipe('ram').rig === 'prop');
    ok('switch off: MON3D.on is false when VO2 is off and nothing is forced', (() => { const was = M.force; M.force = null; const v = M.on === !!(window.VO2 && VO2.on); M.force = was; return v; })());
    ok('switch off: a tagged sprite does not reach the 3D path', (() => { const was = M.force, d0 = M.stats.drawn; M.force = false;
      try { const spr = enemySprite('skeleton'); const cv = document.createElement('canvas'); cv.width = cv.height = 8; const keep = ctx; ctx = cv.getContext('2d'); try { drawSprite(spr, -9999, -9999, 1, 0, false, false); } finally { ctx = keep; } }
      catch (e) { return false; } finally { M.force = was; } return M.stats.drawn === d0; })());
    ok('no per-frame allocation in the hot path: recipes are cached', M.recipe('skeleton') === M.recipe('skeleton'));
    const r = {pass, fail, details, covered, excepted};
    console.log('MON3D selfTest: ' + pass + ' pass, ' + fail + ' fail\n' + details.join('\n')); return r;
  };

  if (ready()) hook(); else console.warn('MON3D: figure renderer not found; monsters stay on their sprites');
})();
