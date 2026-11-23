/* js/3d/figures-2.js (INT-1 step 2, 2026-11-16): INDEX 55 to 57 (every humanoid, four-legged rigs, monsters).
   Cut unchanged from the inline script in index.html (old lines 19864 to 20980). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 55 - EVERY HUMANOID IN 3D, AND THE FULL CLIP SET
   WHO        The whole Chapter (Leader, Squad Mates, officers, veterans, raid
              allies), the Chapter Master, the Bard (seated on his log, and
              dancing at the bar fight), the Scribe, the prologue's townsfolk,
              and every humanoid enemy and commander, the bar-fight crowd
              included. Beasts, horses, nests and siege engines stay pixel art.
   CLIPS      idle 4, walk 8, run 8, melee 8, shoot 6, cast 6, hit 3, downed 2,
              death 6, mounted 4, sit 4, play 4.
                run      when charging (the Leader's Charge, a charging enemy)
                         or holding Shift in camp
                cast     casters' ranged attacks (Mage, Witch, Cleric, enemy
                         casters); archers still shoot
                hit      a recoil while the hit flash is on
                downed   Leader down, a Squad Mate bleeding out or stable, a
                         knocked-out ally, and anyone resting on a camp cot
                death    humanoid enemies fall where they die
                mounted  riding, with the horse still drawn as before
                sit/play the Bard on his log and at the bar fight
   INJURIES   Show on the model: an eye patch (lost eye), a bandaged arm in a
              sling (broken arm), a chest binding (crushed lung) and a knee
              brace (bad knee).
   SPEED      The Chapter renders as before (on first sight). Enemies and
              townsfolk render in the background, a few milliseconds a frame,
              and show their pixel sprite until their 3D frames are ready.
              The host's troops are queued as a contract starts.
   FIXED      The Scribe was wearing Soldier kit in 3D; the Bard was standing
              in mid-air over his log.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 55
   and undo the four small patches marked "Index 55".

   3D DESIGN NOTE, ADDENDUM (read with Index 50, 51, 53 and 54)
     DRAWING   r3dDraw(rec, u, x, y, s, o) draws any recipe at a pixel sprite's
               anchor (x, y, scale s; feet on y + 7 * s). o = {clip, i, dir,
               flash, alpha, async, light, shadow}. If clip is omitted,
               r3dChoose(rec, u, frame) picks it from the unit's state.
               Returns false if the frames are not ready (async) so the caller
               can fall back to the pixel sprite.
     FACING    r3dDirFor(u): the Leader faces G.facing; everyone else faces the
               way they moved since the last frame, or e.left when striking.
     SOURCES   personSprite results are tagged p3d (any spec with an R3D_KITS
               entry), masterSprite m3d, enemySprite e3d (ENEMY_LOOK kinds that
               are drawn as humanoids). The drawSprite, drawDowned and
               drawMounted wrappers below route tagged sprites to r3dDraw.
     ENEMIES   r3dEnemyRecipe(kind) reads ENEMY_LOOK: head -> R3D_HELMS (helmet
               nasal, cap, bandana, tricorn, hood, wizard, witch, circlet),
               weapon -> WEAPON3D (pitchfork, hammer, flame, bomb, fist, twin
               = two swords), shield true|'big', robe, cape, mask, eye (eyes
               glow), tall|short|bulky, ears, tusks, horns, nose, beard.
               ENEMY_ARMOUR sets the weight. To add an enemy: add an ENEMY_LOOK
               entry; nothing else is needed.
     KITS      New: MASTER, SCRIBE, PLAIN, ENEMY.
     CLIPS     downed, death and sit place the body with bob computed from the
               skeleton: hip = rec.skel.bones.pelvis.off[1], thigh =
               -rec.skel.bones.shL.off[1]. Keep that pattern for new lying or
               seated poses so they work for every race height.
     QUEUE     r3dFramesAsync(rec, clip, dir, st) returns frames or null and
               queues the job; r3dPump(ms) renders queued jobs within a budget.
============================================================================ */
R3D.EMIT.add('eyeglow'); R3D_MUTE_SKIP.add('eyeglow');

/* ---------------------------------------------------------------- kits --- */
Object.assign(R3D_HELMS, {
  cap:(hk, hy) => [{t:'ell', c:[0, hy + 3.4 * hk, -0.4], r:[6.5 * hk, 3.6 * hk, 6.6 * hk], z:'capc'}, {t:'ell', c:[0, hy + 2.4 * hk, 5 * hk], r:[4.6 * hk, 0.7, 3 * hk], z:'capc'}],
  bandana:(hk, hy) => [{t:'ell', c:[0, hy + 2.2 * hk, -0.9 * hk], r:[6.65 * hk, 5.2 * hk, 6.7 * hk], z:'capc'}, {t:'ell', c:[-1.5, hy + 1.6 * hk, -7 * hk], r:[1.6, 1.4, 1.2], z:'capc'},
                       {t:'cap', a:[-1.5, hy + 1.4 * hk, -7.3 * hk], p:[-2.6, hy - 3 * hk, -8 * hk], r:0.8, z:'capc'}],
  tricorn:(hk, hy) => [{t:'ell', c:[0, hy + 4.4 * hk, -0.4], r:[9.4 * hk, 1.5, 9.4 * hk], z:'capc'}, {t:'ell', c:[0, hy + 6 * hk, -0.4], r:[5.4 * hk, 3 * hk, 5.4 * hk], z:'capc'},
                       {t:'ell', c:[0, hy + 6 * hk, 7.4 * hk], r:[3.6 * hk, 2.2, 1.2], z:'capc'}, {t:'ell', c:[6.6 * hk, hy + 6 * hk, -4.4 * hk], r:[1.2, 2.2, 3.6 * hk], rot:[0, 0.7, 0], z:'capc'},
                       {t:'ell', c:[-6.6 * hk, hy + 6 * hk, -4.4 * hk], r:[1.2, 2.2, 3.6 * hk], rot:[0, -0.7, 0], z:'capc'}, {t:'box', c:[0, hy + 4.6 * hk, 0], r:[5.6 * hk, 0.5, 5.6 * hk], z:'gold'}],
  spectacles:(hk, hy) => { const out = []; for (const sx of [1, -1]) out.push({t:'ell', c:[sx * 2.4 * hk, hy + 0.4 * hk, 6 * hk], r:[1.7, 1.5, 0.35], z:'gold'}, {t:'ell', c:[sx * 2.4 * hk, hy + 0.4 * hk, 6.15 * hk], r:[1.2, 1, 0.35], z:'glass'}); return out; }
});
Object.assign(WEAPON3D, {
  fist:() => [],
  pitchfork:() => [{t:'cap', a:[0, 0, -10], p:[0, 0, 22], r:0.8, z:'wood'}, {t:'box', c:[0, 0, 22.6], r:[3, 0.5, 0.5], z:'metal'},
                   {t:'cap', a:[-2.8, 0, 22.6], p:[-2.8, 0, 28], r:0.45, z:'metal'}, {t:'cap', a:[0, 0, 22.6], p:[0, 0, 28.6], r:0.45, z:'metal'}, {t:'cap', a:[2.8, 0, 22.6], p:[2.8, 0, 28], r:0.45, z:'metal'}],
  hammer:() => [{t:'cap', a:[0, 0, -2], p:[0, 0, 13], r:0.9, z:'wood'}, {t:'box', c:[0, 0, 13.6], r:[1.9, 4.6, 2], z:'metal'}],
  flame:() => [{t:'box', c:[0, 0, 13], r:[0.7, 1.8, 10.5], z:'metal'}, {t:'box', c:[0, 0, 14], r:[0.9, 2.4, 9.5], z:'eyeglow'}, {t:'box', c:[0, 0, 2.6], r:[1, 3.6, 0.9], z:'horn'}],
  bomb:() => [{t:'ell', c:[0, 0, 2.6], r:[3, 3, 3], z:'mask'}, {t:'cap', a:[0, 2.4, 2.6], p:[0.6, 4.6, 2.6], r:0.4, z:'string'}, {t:'ell', c:[0.7, 5, 2.6], r:[0.7, 0.7, 0.7], z:'eyeglow'}],
  sword2:() => WEAPON3D.sword(),
  quill:() => [{t:'cap', a:[0, 0, 0], p:[0, 0, 6], r:0.3, z:'paper'}, {t:'ell', c:[0, 0.4, 5], r:[0.4, 1.4, 3], z:'paper'}],
  book:() => [{t:'box', c:[0, 0.6, 3.2], r:[3.4, 0.5, 2.6], z:'leather'}, {t:'box', c:[0, 1.2, 3.2], r:[3.2, 0.3, 2.4], z:'paper'}, {t:'box', c:[0, 1.5, 3.2], r:[0.25, 0.4, 2.4], z:'leather'}]
});
Object.assign(R3D_KITS, {
  MASTER:(D, x) => { const s = D.s, w = D.w;
    return {helm:null, hair:'keep', main:'staff', robe:true, parts:[{b:'pelvis', t:'box', c:[0, -0.6 * s, 0], r:[8.4 * w, 1.1 * s, 6.3 * w], z:'trim'},
      {b:'chest', t:'ell', c:[0, 16.5 * s, 0.3], r:[10.2 * w, 3.4 * s, 7 * w], z:'fur'}, {b:'chest', t:'ell', c:[0, 12 * s, 6.6 * w], r:[1.4, 1.4, 0.6], z:'gold'}]}; },
  SCRIBE:(D, x) => { const s = D.s, w = D.w;
    return {helm:'spectacles', hair:'keep', main:'quill', off:'book', robe:true, parts:[{b:'pelvis', t:'box', c:[-7.4 * w, -3 * s, 0.4], r:[1.4, 3.4, 3], z:'leather'},
      {b:'chest', t:'cap', a:[7 * w, 17 * s, 5.8 * w], p:[-7.4 * w, 0, 6 * w], r:0.8, z:'leather'}, {b:'pelvis', t:'box', c:[0, -0.6 * s, 0], r:[8.4 * w, 1.1 * s, 6.3 * w], z:'trim'},
      {b:'pelvis', t:'cap', a:[6.6 * w, 0, 3], p:[6.8 * w, -6 * s, 4], r:0.7, z:'paper'}]}; },
  PLAIN:(D, x) => ({helm:null, hair:'keep', main:'fist', parts:[{b:'pelvis', t:'ell', c:[5.8 * D.w, -1 * D.s, 4.2 * D.w], r:[1.7, 2, 1.3], z:'leather'}]}),
  ENEMY:(D, x) => {
    const L = x.look, s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
    const helm = {helmet:x.weight === 'heavy' ? 'great' : 'nasal', hood:'hood', wizard:'wizard', witch:'witch', circlet:'circlet', cap:'cap', bandana:'bandana', tricorn:'tricorn'}[L.head] || null;
    const main = {pitchfork:'pitchfork', club:'club', sword:'sword', spear:'spear', twin:'sword', hammer:'hammer', flame:'flame', bow:'bow', xbow:'xbow', staff:'staff', bomb:'bomb', dagger:'dagger', mace:'mace', pike:'pike', fist:'fist'}[L.weapon] || 'fist';
    if (L.mask) P.push({b:'head', t:'box', c:[0, hy - 2.4 * hk, 5.6 * hk], r:[5 * hk, 2.6 * hk, 1], z:'mask'});
    return {helm, hair:helm === 'nasal' || helm === 'great' ? 'hide' : 'keep', main, off:L.weapon === 'twin' ? 'sword2' : null,
      shield:L.shield === 'big' ? 'tower' : L.shield ? 'heater' : null, robe:!!L.robe, parts:P}; }
});
WEAPON_GRIP.pitchfork = 'thrust'; WEAPON_GRIP.bomb = 'swing'; WEAPON_GRIP.fist = 'swing';

/* ---- injuries on the model ---- */
function r3dInjuryParts(p, D){
  const inj = (p && p.injuries) || [], s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
  if (inj.includes('eye')) P.push({b:'head', t:'ell', c:[-2.3 * hk, hy + 0.4 * hk, 5.7 * hk], r:[1.9, 1.7, 0.7], z:'mask'}, {b:'head', t:'ell', c:[0, hy + 1.4 * hk, -0.4 * hk], r:[6.35 * hk, 0.5, 6.35 * hk], rot:[0.25, 0, 0], z:'mask'});
  if (inj.includes('arm')) P.push({b:'loL', t:'cap', a:[0, -1.5 * s, 0], p:[0, -9 * s, 0], r:2.9 * w, z:'paper'}, {b:'chest', t:'cap', a:[-5 * w, 18 * s, 4 * w], p:[7 * w, 6 * s, 6.6 * w], r:1, z:'paper'});
  if (inj.includes('lung')) P.push({b:'chest', t:'ell', c:[0, 9 * s, 0.6], r:[(9.4 + 1.6) * w, 1.5 * s, 7.4 * w], z:'paper'});
  if (inj.includes('knee')) P.push({b:'shR', t:'ell', c:[0, -0.5 * s, 0.8], r:[3.4 * w, 2.6 * s, 3.5 * w], z:'leather'}, {b:'shR', t:'box', c:[0, -0.5 * s, 3.6 * w], r:[1.2, 3 * s, 0.6], z:'metal'});
  return P;
}
{ const f = r3dRecipeFor;
  r3dRecipeFor = function(p, isLeader, opt){
    const rec = f(p, isLeader, opt);
    const inj = (p && p.injuries) || [];
    if (inj.some(i => ['eye', 'arm', 'lung', 'knee'].includes(i))){
      const R = (opt && opt.race3d) || RACE3D[p.race] || RACE3D.HUMAN, D = r3dSkeleton(R, sexOf(p) === 'f').dims;
      rec.parts.push(...r3dInjuryParts(p, D)); rec.zones.paper = rec.zones.paper || '#c8c0aa'; rec.zones.mask = rec.zones.mask || '#22222a';
      rec.key = 'r3d55' + hash(JSON.stringify(rec));
    }
    if (!rec.zones.glass) rec.zones.glass = '#9fb8c8';
    return rec;
  };
}

/* ------------------------------------------------------- special recipes --- */
const R3DR = {};
function r3dMasterRecipe(){
  const m = ensureMaster(), key = 'm:' + m.name + m.race + (m.hero || '') + (m.sex || '') + bannerSig();
  if (R3DR[key]) return R3DR[key];
  const look = Object.assign({}, personLook(Object.assign({}, m, {spec:'MAGE'}), false), {hair:m.hero === 'cayde' ? '#a0482a' : m.hero === 'zenif' ? '#e8e8f0' : '#cfcac0',
    robeCol:'#34404c', top:'#34404c', orb:'#ffd860', acc:'#d4af37', beard:sexOf(m) !== 'f' && m.hero !== 'zenif', hairStyle:sexOf(m) === 'f' ? 'bun' : 'short', head:null});
  const bn = banner(); look.cape = bn.c1; look.capeTrim = bn.c2;
  const rec = r3dRecipeFor(Object.assign({}, m, {injuries:[]}), false, {kit:'MASTER', look, weight:'light'});
  return R3DR[key] = rec;
}
function r3dEnemyRecipe(kind){
  const key = 'e:' + kind + bannerSig(); if (R3DR[key]) return R3DR[key];
  const L = Object.assign({hairStyle:'short'}, enemyLook(kind));
  const ap = ENEMY_ARMOUR[kind], wm = {rag:['light', 'rags'], quilt:['light', 'padded'], studs:['medium', 'brigandine'], scale:['medium', 'scale'], chain:['medium', 'chain'], plate:['heavy', 'plate']}[ap] || ['light', 'own'];
  const race3d = {h:L.tall ? 1.14 : L.short ? 0.78 : 1, w:L.bulky ? 1.22 : 1, hk:L.short ? 1.1 : 1, ears:L.ears === 'big' ? 'big' : L.ears === 'elf' ? 'elf' : null,
    tusks:!!L.tusks, horns:!!L.horns, nose:L.nose ? 'big' : null, beard:L.short && L.beard ? 'long' : null};
  const p = {name:'enemy:' + kind, race:'HUMAN', spec:'SOLDIER', sex:L.sex || 'm', id:'E', injuries:[]};
  const rec = r3dBuild54(p, false, {kit:'ENEMY', look:L, race3d, weight:wm[0], material:wm[1]});   // muted once, below
  rec.zones.cloth = L.top || rec.zones.cloth; rec.zones.clothD = shade(rec.zones.cloth, 0.72);
  rec.zones.capc = L.acc || shade(L.top || '#6a5a44', 0.8); rec.zones.hood = L.hood || rec.zones.hood; rec.zones.hat = L.hat || rec.zones.hat;
  if (L.eye){ for (const q of rec.parts) if (q.z === 'eye') q.z = 'eyeglow'; rec.zones.eyeglow = L.eye; }
  const orig = Object.assign({}, rec.zones); r3dMute(rec);
  for (const z in rec.zones){ if (!orig[z] || R3D_MUTE_SKIP.has(z)) continue; const a = hex3(orig[z]), b = hex3(rec.zones[z]); rec.zones[z] = '#' + a.map((v, i) => Math.round(v * 0.45 + b[i] * 0.55).toString(16).padStart(2, '0')).join(''); }
  if (L.eye) rec.zones.eyeglow = L.eye; rec.zones.glass = '#9fb8c8';
  rec.key = 'r3de' + hash(JSON.stringify(rec));
  return R3DR[key] = rec;
}

/* ---------------------------------------------------------------- clips --- */
const r3dHip = rec => rec.skel.bones.pelvis.off[1];
const r3dThigh = rec => -rec.skel.bones.shL.off[1];
function r3dDownPose(rec, b){
  return {bob:-r3dHip(rec) + 5.5, pelvis:[-Math.PI / 2, 0, 0], chest:[0.05 + 0.02 * b, 0, 0], head:[0.25, 0.35, 0],
    upL:[0.1, 0, 0.35], loL:[-0.3, 0, 0], upR:[0.15, 0, -0.45], loR:[-0.5, 0, 0], thL:[-0.05, 0, 0.12], shL:[0.1, 0, 0], thR:[-0.35, 0, -0.08], shR:[0.6, 0, 0],
    cape:[-0.05, 0, 0], cape2:[0.02, 0, 0], cape3:[0, 0, 0], hdR:Z3, hdL:Z3};
}
Object.assign(R3D_CLIPS.humanoid, {
  run:{n:8, fn:(t, rec) => {
    const ph = t * Math.PI * 2, sn = Math.sin(ph), cs = Math.cos(ph), A = ARMS_REST(rec), lift = x => 0.2 + 1.5 * Math.pow(Math.max(0, x), 1.4), keep = rec.grip === 'staff' || rec.grip === 'bow';
    return {bob:1.6 * Math.cos(2 * ph) - 1.2, pelvis:[0.16, 0.12 * sn, 0.04 * sn], chest:[0.14, -0.2 * sn, -0.04 * sn], head:[-0.18, 0.08 * sn, 0],
      thL:[-0.95 * sn - 0.15, 0, 0.03], thR:[0.95 * sn - 0.15, 0, -0.03], shL:[lift(cs), 0, 0], shR:[lift(-cs), 0, 0],
      upL:[keep ? A.upL[0] + 0.3 * sn : 0.75 * sn, 0, (A.upL[2] || 0) + 0.06], loL:[keep ? A.loL[0] : -1.3, 0, 0],
      upR:[keep ? A.upR[0] - 0.25 * sn : -0.75 * sn, 0, (A.upR[2] || 0) - 0.06], loR:[keep ? A.loR[0] : -1.3, 0, 0], hdR:A.hdR || Z3, hdL:A.hdL || Z3,
      cape:[0.42 + 0.06 * Math.cos(2 * ph), 0, 0.05 * sn], cape2:[0.12 + 0.1 * Math.sin(2 * ph - 1.1), 0, 0.07 * Math.sin(ph - 0.9)], cape3:[0.1 + 0.12 * Math.sin(2 * ph - 2.2), 0, 0.09 * Math.sin(ph - 1.8)]}; }},
  cast:{n:6, fn:(t, rec) => {
    const base = {bob:-0.4, pelvis:Z3, head:Z3, chest:Z3, thL:[-0.25, 0, 0.06], thR:[0.22, 0, -0.06], shL:[0.12, 0, 0], shR:[0.16, 0, 0], cape:[0.12, 0, 0], cape2:[-0.02, 0, 0], cape3:Z3, hdL:Z3};
    const mk = o => { const p = Object.assign({}, base, o); p.hdR = rec.grip === 'staff' ? [-(p.upR[0] + p.loR[0]) - (o.tilt || 0), 0, 0] : Z3; return p; };
    return keyedT([
      [0, mk({upR:[-0.25, 0, -0.1], loR:[-0.9, 0, 0], upL:[0.05, 0, 0.14], loL:[-0.2, 0, 0]})],
      [0.35, mk({upR:[-2.5, 0, -0.25], loR:[-0.35, 0, 0], upL:[-0.7, 0, 0.35], loL:[-1.1, 0, 0], chest:[-0.12, 0.2, 0], head:[-0.15, 0, 0], bob:-0.1})],
      [0.55, mk({upR:[-1.55, 0, -0.1], loR:[-0.15, 0, 0], upL:[-1.55, 0, 0.12], loL:[-0.05, 0, 0], chest:[0.16, -0.12, 0], bob:-0.9, tilt:0.6, cape:[0.3, 0, 0], cape2:[0.1, 0, 0]})],
      [0.8, mk({upR:[-1.5, 0, -0.1], loR:[-0.2, 0, 0], upL:[-1.45, 0, 0.12], loL:[-0.1, 0, 0], chest:[0.12, -0.1, 0], bob:-0.8, tilt:0.5, cape:[0.22, 0, 0], cape2:[0.14, 0, 0], cape3:[0.08, 0, 0]})],
      [1, mk({upR:[-0.25, 0, -0.1], loR:[-0.9, 0, 0], upL:[0.05, 0, 0.14], loL:[-0.2, 0, 0]})]], t); }},
  hit:{n:3, fn:(t, rec) => {
    const A = ARMS_REST(rec), k = [1, 0.7, 0.3][Math.min(2, Math.round(t * 3))];
    return Object.assign({}, A, {bob:-0.8 * k, pelvis:[-0.1 * k, 0, 0], chest:[-0.38 * k, 0.12 * k, 0], head:[-0.3 * k, 0, 0.1 * k],
      upL:[A.upL[0] - 0.5 * k, 0, A.upL[2] + 0.35 * k], upR:[A.upR[0] - 0.4 * k, 0, A.upR[2] - 0.3 * k], thL:[0.2 * k, 0, 0.05], thR:[-0.1 * k, 0, -0.05], shL:[0.2 * k, 0, 0], shR:[0.1, 0, 0],
      hdR:A.hdR || Z3, hdL:A.hdL || Z3, cape:[0.05, 0, 0], cape2:[-0.1 * k, 0, 0], cape3:[-0.12 * k, 0, 0]}); }},
  downed:{n:2, fn:(t, rec) => r3dDownPose(rec, Math.sin(t * Math.PI * 2))},
  death:{n:6, fn:(t, rec) => { const D = r3dDownPose(rec, 0), A = ARMS_REST(rec), hip = r3dHip(rec);
    return keyedT([
      [0, Object.assign({}, A, {bob:0, pelvis:[-0.15, 0, 0], chest:[-0.4, 0, 0], head:[-0.35, 0, 0], upL:[-0.6, 0, 0.5], upR:[-0.5, 0, -0.5], thL:[0.15, 0, 0], thR:[-0.15, 0, 0], shL:[0.3, 0, 0], shR:[0.2, 0, 0], hdR:A.hdR || Z3, hdL:Z3, cape:[0.05, 0, 0], cape2:Z3, cape3:Z3})],
      [0.35, Object.assign({}, A, {bob:-hip * 0.3, pelvis:[-0.55, 0, 0], chest:[-0.35, 0.2, 0], head:[-0.2, 0.2, 0], upL:[-1.1, 0, 0.7], upR:[-0.9, 0, -0.7], thL:[-0.9, 0, 0.1], shL:[1.2, 0, 0], thR:[-0.6, 0, -0.1], shR:[0.9, 0, 0], hdR:Z3, hdL:Z3, cape:[0.3, 0, 0], cape2:[0.2, 0, 0], cape3:[0.1, 0, 0]})],
      [0.62, Object.assign({}, D, {bob:-hip * 0.7, pelvis:[-1.2, 0, 0], upL:[-0.9, 0, 0.8], upR:[-0.7, 0, -0.8], cape:[0.2, 0, 0]})],
      [0.83, D]], t); }},
  mounted:{n:4, fn:(t, rec) => { const ph = t * Math.PI * 2, b = Math.sin(ph);
    return {bob:0.8 * Math.abs(b), pelvis:[0.06, 0, 0], chest:[0.08 + 0.04 * b, 0, 0], head:[-0.08, 0, 0], thL:[-1.35, 0, 0.42], shL:[1.25, 0, 0], thR:[-1.35, 0, -0.42], shR:[1.25, 0, 0],
      upL:[-0.55, 0, 0.12], loL:[-0.95, 0, 0], upR:[-0.55, 0, -0.12], loR:[-0.95, 0, 0], hdR:rec.grip === 'staff' ? [1.5, 0, 0] : Z3, hdL:rec.grip === 'bow' ? [1.2, 0, 0] : Z3,
      cape:[0.35 + 0.1 * b, 0, 0], cape2:[0.25 + 0.1 * Math.sin(ph - 1), 0, 0], cape3:[0.2 + 0.12 * Math.sin(ph - 2), 0, 0]}; }},
  sit:{n:4, fn:(t, rec) => { const ph = t * Math.PI * 2, b = Math.sin(ph), th = r3dThigh(rec);
    return {bob:-th - 1, pelvis:[0, 0, 0], chest:[0.12, 0, 0], head:[0.1 + 0.05 * Math.sin(ph * 2), 0.05 * b, 0.04 * b], thL:[-1.5, 0, 0.18], shL:[1.45, 0, 0], thR:[-1.5, 0, -0.18], shR:[1.45 - 0.15 * Math.max(0, b), 0, 0],
      upL:[-0.95, 0, -0.15], loL:[-1.15, 0, 0], upR:[-0.4, 0, 0.32], loR:[-1.5 + 0.22 * b, 0, 0], hdR:Z3, hdL:Z3, cape:[-0.35, 0, 0], cape2:[-0.6, 0, 0], cape3:[-0.3, 0, 0]}; }},
  play:{n:4, fn:(t, rec) => { const ph = t * Math.PI * 2, b = Math.sin(ph);
    return {bob:-0.3 + 0.4 * b, pelvis:[0, 0.06 * b, 0.03 * b], chest:[0.06, -0.08 * b, 0], head:[0.08, 0.1 * b, 0], thL:[-0.1 * b, 0, 0.06], shL:[0.1 + 0.1 * Math.max(0, b), 0, 0], thR:[0.1 * b, 0, -0.06], shR:[0.1 + 0.1 * Math.max(0, -b), 0, 0],
      upL:[-0.95, 0, -0.15], loL:[-1.15, 0, 0], upR:[-0.4, 0, 0.32], loR:[-1.5 + 0.22 * b, 0, 0], hdR:Z3, hdL:Z3, cape:[0.15, 0, 0], cape2:[0.05 * b, 0, 0], cape3:[0.08 * b, 0, 0]}; }}
});
R3D.CLIPS_FOR.humanoid = ['idle', 'walk', 'melee', 'shoot', 'cast', 'run', 'hit'];

/* -------------------------------------------------------- async frames --- */
const R3DQ = {q:[], keys:new Set(), last:-1};
/* S6-C note 10 (Art Director; LE condition 3): a hook or bake that throws draws the non-pixel placeholder and says so once per kind, not every frame */
const R3D_WARNED = new Set();
function r3dWarnOnce(tag, e){ const k = tag + '|' + String(e && e.message || e); if (R3D_WARNED.has(k)) return; R3D_WARNED.add(k); console.warn('3D ' + tag + ' drew the placeholder:', e); }
/* LE condition 4: a queued bake must finish and the real figure then draw (no placeholder for good). Run: R3D.selfTestBake() */
R3D.selfTestBake = function(kind){
  kind = kind || 'enforcer'; const out = {kind, pass:false};
  try {
    const rec = r3dEnemyRecipe(kind), st = R3D_STYLES[r3dStyleId() || 'crisp'], key = rec.key + ':' + st.id, keep = R3D.cache[key];
    delete R3D.cache[key];
    out.coldGivesNull = r3dFramesAsync(rec, 'walk', 2, st) === null;
    let n = 0; while (n < 200 && !(R3D.cache[key] && R3D.cache[key].walk && R3D.cache[key].walk[2])){ r3dPump(20); n++; }
    out.pumps = n; const fr = r3dFramesAsync(rec, 'walk', 2, st); out.baked = !!(fr && fr.length && fr[0] && fr[0].width);   // a clip is a list of frame canvases
    out.otherFacingIsNull = r3dFramesAsync(rec, 'walk', 5, st) === null;   // LE F1: frames or null, for every caller
    out.otherFacingUsesBaked = !!r3dStandIn(rec, 'walk', 5, st);           // the draws' stand-in: a frame of the same figure
    out.pass = out.coldGivesNull && out.baked && out.otherFacingIsNull && out.otherFacingUsesBaked;
    if (keep){ const nw = R3D.cache[key]; R3D.cache[key] = keep; if (nw) for (const c in nw) { if (!keep[c]) { keep[c] = nw[c]; continue; } for (const d in nw[c]) if (nw[c][d] && !keep[c][d]) keep[c][d] = nw[c][d]; } }   // LE F2: put the kind's cache back
  } catch (e){ out.error = String(e); }
  console.log('R3D selfTestBake: ' + (out.pass ? 'pass' : 'FAIL'), out); return out;
};
function r3dFramesAsync(rec, clip, dir, st, warm){
  const key = rec.key + ':' + st.id, C = R3D.cache[key];
  if (C && C[clip] && C[clip][dir]) return C[clip][dir];
  const jk = key + '|' + clip + '|' + dir;
  if (!R3DQ.keys.has(jk)){ R3DQ.keys.add(jk); R3DQ.q[warm ? 'push' : 'unshift']({rec, clip, dir, st, jk}); }
  else if (!warm){ const i = R3DQ.q.findIndex(j => j.jk === jk); if (i > 0) R3DQ.q.unshift(R3DQ.q.splice(i, 1)[0]); }
  return null;
}
/* S6-C note 10 (Art Director): while a clip/facing bakes, r3dDraw and r3qDraw show a frame of the same figure that is
   already baked (same clip in the nearest facing, then idle, then any clip) rather than declining, which used to drop to
   pixel art. LE F1: a helper only those two call, so r3dFramesAsync keeps its "frames or null" contract for every other caller. */
function r3dStandIn(rec, clip, dir, st){
  const C = R3D.cache[rec.key + ':' + st.id]; if (!C) return null;
  const near = cl => { if (!cl) return null; for (const d of [dir, (dir + 1) % 8, (dir + 7) % 8, (dir + 2) % 8, (dir + 6) % 8, (dir + 4) % 8, (dir + 3) % 8, (dir + 5) % 8]) if (cl[d]) return cl[d]; return null; };
  return near(C[clip]) || near(C.idle) || (() => { for (const k in C) { const f = near(C[k]); if (f) return f; } return null; })();
}
function r3dPump(ms){
  const t0 = performance.now(), cur = R3D_STYLES[r3dStyleId() || 'crisp'];
  while (R3DQ.q.length && performance.now() - t0 < ms){
    const j = R3DQ.q.shift(); R3DQ.keys.delete(j.jk);
    if (j.st !== cur) continue;
    try { r3dFrames(j.rec, j.clip, j.dir, j.st); } catch (e) { r3dWarnOnce('bake ' + j.rec.key, e); }
  }
  r3dUseStyle(cur);
}
function r3dPumpTick(){ const t = G ? G.frame : CAMP.t; if (t !== R3DQ.last){ R3DQ.last = t; if (R3DQ.q.length) r3dPump(7); } }

/* -------------------------------------------------------- facing and clip --- */
function r3dDirFor(u){
  if (G && u === G.leader){
    const st = u._r3d = u._r3d || {dir:2};
    let a = G.facing;
    if (u.faceT > 0 && !u.moving && typeof a === 'number' && (Math.cos(a) < 0) !== !!u.anim.left) a = Math.PI - a;
    if (typeof a === 'number') st.dir = r3dDirOf(a);
    st.mv = !!u.moving; return st;
  }
  const st = u._r3d = u._r3d || {dir:u.left || (u.anim && u.anim.left) ? 4 : 2, px:u.x, py:u.y, mvT:0};
  if (st.px === undefined){ st.px = u.x; st.py = u.y; }
  const dx = u.x - st.px, dy = u.y - st.py; st.px = u.x; st.py = u.y;
  const moved = Math.hypot(dx, dy) > 0.2;
  if (moved) st.dir = r3dDirOf(Math.atan2(dy, dx));
  st.mvT = moved ? 6 : Math.max(0, (st.mvT || 0) - 1);
  st.mv = st.mvT > 0 || (u.moving && u.kind !== undefined && moved);
  if ((u.atkT || 0) > 0 && !moved){ const left = u.anim ? !!u.anim.left : !!u.left, dl = st.dir >= 3 && st.dir <= 5; if (left !== dl) st.dir = left ? 4 : 0; }
  return st;
}
function r3dChoosePose(rec, u, frame, tick){
  const st = r3dDirFor(u), caster = rec.grip === 'staff' || (u.p && ['MAGE', 'WITCH', 'CLERIC'].includes(u.p.spec));
  if (frame === 3 || frame === 4){
    const clip = frame === 4 || (u.e3d && rec.grip !== 'thrust' && rec.grip !== 'swing') ? (caster ? 'cast' : 'shoot') : 'melee';
    const n = ((R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig][clip]) || R3D_CLIPS.humanoid[clip]).n, len = u.e3d ? 14 : 12;
    return {clip, i:Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / len) * n)), dir:st.dir};
  }
  if (rec.rig === 'mount'){   // AD look call: a mount shows the hit's peak frames at once (2 then 1, 2 ticks each), moving or standing, then the gait or idle again (no second flinch); foot units unchanged
    const fl = u.flash || 0; if (fl > (st.hitFl || 0)) st.hitT0 = tick; st.hitFl = fl;
    if (fl > 0){ const e = tick - (st.hitT0 === undefined ? tick : st.hitT0);
      if (e < 4) return {clip:'hit', i:e < 2 ? 2 : 1, dir:st.dir, mountPeak:true};
    }
  }
  if ((u.flash || 0) > 0 && !st.mv && rec.rig !== 'mount') return {clip:'hit', i:u.flash > 4 ? 0 : u.flash > 2 ? 1 : 2, dir:st.dir};
  if (st.mv){
    const running = u.charging || (G && (u === G.leader || (G.squad || []).includes(u)) && G.chargeT > 0) || (!G && keys.shift && u.kind === 'leader');
    return running ? {clip:'run', i:Math.floor(tick / 4) % 8, dir:st.dir} : {clip:'walk', i:Math.floor(tick / 6) % 8, dir:st.dir};
  }
  return {clip:'idle', i:Math.floor(tick / 14) % 4, dir:st.dir};
}

/* Index 75: the feet step per distance walked (FEEL.walkPx, runPx), a walk starts on a stride pose and a stop plays on to a passing pose */
const FEEL = {walkPx:9, runPx:8.5, startI:1, settleMax:6, creep:0.1,
  /* P23 ANIM (AD 23 Nov, Patrick: "slow motion, floaty, puppet legs"): people (humanoid clips) step per their own stride. Measured at field
     scale (2.72, a 55 px figure): a walk step reaches about 27 px, so a 12-frame cycle plants at about 54 px, but walkPx 9 made it 108 px:
     the legs cycled at half the body's pace and the feet slid. hum: null restores walkPx 9 for people. The run is unchanged for everyone (review R5). */
  hum:{walkPx:4.6}};
/* Review R5: the walk only (the run keeps runPx 8.5 for everyone), one people test shared with graphics.js GFX-01, and a missing
   or bad hum value falls back to the old pace instead of NaN. */
function feelHum(rec){ return !!(FEEL.hum && rec && (rec.rig === 'humanoid' || rec.rig === 'human')); }
function feelPx(rec, clip){ if (clip === 'run') return FEEL.runPx; const v = feelHum(rec) ? +FEEL.hum.walkPx : NaN; return v > 0 ? v : FEEL.walkPx; }
function r3dChoose(rec, u, frame, tick){
  let c = r3dChoosePose(rec, u, frame, tick); const st = u._r3d; if (!st) return c;
  const f = st.f75 || (st.f75 = {x:u.x, y:u.y, t:-1, ph:0, on:false, set:0, clip:'walk', out:null});
  if (f.t === tick && f.out){ return Object.assign({}, f.out, {dir:c.dir}); }
  f.t = tick; let d = Math.hypot(u.x - f.x, u.y - f.y); f.x = u.x; f.y = u.y; if (d > 14) d = 0;
  const gait = c.clip === 'walk' || c.clip === 'run';
  if (gait){
    const n = ((R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig][c.clip]) || R3D_CLIPS.humanoid[c.clip]).n;   // read each rig's own clip count (mount, prop, etc.)
    if (!f.on) f.ph = FEEL.startI;
    f.on = true; f.clip = c.clip; f.set = FEEL.settleMax;
    f.ph += d > 0.2 ? d / feelPx(rec, c.clip) : FEEL.creep;
    c = {clip:c.clip, i:Math.floor(f.ph) % n, dir:c.dir};
  } else if (c.clip === 'idle' && f.on){
    const n = ((R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig][f.clip]) || R3D_CLIPS.humanoid[f.clip]).n;
    if (f.set > 0 && Math.floor(f.ph) % 4 !== 0){ f.ph += 0.5; f.set--; c = {clip:f.clip, i:Math.floor(f.ph) % n, dir:c.dir}; }
    else f.on = false;
  } else if (c.clip === 'hit' && c.mountPeak && st.mv && f.on){   // a moving mount keeps its stride phase under the flinch
    f.ph += d > 0.2 ? d / feelPx(rec, f.clip) : FEEL.creep;
  } else if (c.clip !== 'idle') f.on = false;
  f.out = c; return c;
}
/* ---------------------------------------------------------------- draw --- */
/* PERF (QA 2026-11-15, audits/perf-pass.md): the white hit flash. It used to repaint one scratch canvas for every
   flashing figure every frame (and remake it when two figures differed in size): about 0.6 ms a figure, 75 ms a
   frame when a whole host is hit at once. The flashed copy of a frame image is now made once and kept (same pixels).
   At most 400 copies, then the store is emptied. Rollback: R3DL.flashKeep = false. */
const R3D_FLASH = new Map();
function r3dFlashOf(img){
  let c = R3D_FLASH.get(img); if (c) return c;
  if (R3D_FLASH.size >= 400) R3D_FLASH.clear();
  c = newCanvas(img.width, img.height); const g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, c.width, c.height);
  R3D_FLASH.set(img, c); return c;
}
/* PL-1L row 2: smooth enlarged 3D sprites (> 1.45x on screen) without blurring figures near 1x; false restores today's behaviour. */
if (window.PL1L_SMOOTH === undefined) window.PL1L_SMOOTH = true;
if (window.PL1L_SMOOTH_AT === undefined) window.PL1L_SMOOTH_AT = 1.45;
function r3dSmooth(w, W){
  if (window.PL1L_SMOOTH === false || !(W > 0)) return false;
  const a = typeof ctx.getTransform === 'function' ? Math.abs(ctx.getTransform().a) : 1;
  const at = typeof window.PL1L_SMOOTH_AT === 'number' ? window.PL1L_SMOOTH_AT : 1.45;
  return a * w / W > at;
}
function r3dDraw(rec, u, x, y, s, o){
  if (rec && rec.frame) return r3qDraw(rec, x, y + (rec.feetOff !== undefined ? rec.feetOff : 7) * s, s, Object.assign({shadowW:rec.shadowW || 9}, o));   // recipes with their own canvas
  const St = R3D_STYLES[r3dStyleId() || 'crisp'];
  const fr = o.async ? (r3dFramesAsync(rec, o.clip, o.dir, St) || r3dStandIn(rec, o.clip, o.dir, St)) : r3dFrames(rec, o.clip, o.dir, St);
  if (!fr) return false;
  r3dUseStyle(St);
  const img = fr[Math.min(fr.length - 1, o.i || 0)], sc = s / R3D.K / St.res;
  const W = img.width, H = img.height, dx = x - R3D.CX * sc, dy = y + 7 * s - R3D.FEET * sc, w = W * sc, h = H * sc;
  if (o.shadow !== false) shadow(x, y + 7 * s, 4.5 * s);
  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.save(); ctx.imageSmoothingEnabled = r3dSmooth(w, W); if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.flash && R3DL.flashKeep !== false) ctx.drawImage(r3dFlashOf(img), dx, dy, w, h);
  else if (o.flash){
    if (!R3DL.flash || R3DL.flash.width !== W || R3DL.flash.height !== H) R3DL.flash = newCanvas(W, H);
    const g = R3DL.flash.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, W, H);
    ctx.drawImage(R3DL.flash, dx, dy, w, h);
  } else ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();
  ctx.imageSmoothingEnabled = prevSmooth;
  if (o.light && !o.flash) try { r3dLightUp(img, dx, dy, w, h, r3dLights(x, y), St.hard); } catch (e) {}
  return true;
}
r3dDrawUnit = function(rec, u, x, y, s, frame, flash, tick){
  const c = r3dChoose(rec, u, frame, tick);
  return r3dDraw(rec, u, x, y, s, Object.assign(c, {flash, light:true}));
};
function r3dUnitAt(x, y){
  const at = u => u && Math.abs(u.x - x) < 0.5 && Math.abs(u.y - y) < 0.5;
  if (G){ if (at(G.leader)) return [G.leader, G.frame]; for (const m of (G.squad || [])) if (at(m)) return [m, G.frame]; for (const a of (G.allies || [])) if (at(a)) return [a, G.frame];
    for (const e of G.enemies) if (at(e)) return [e, G.frame]; }
  for (const q of (CAMP.people || [])) if (at(q)) return [q, CAMP.t];
  return [null, 0];
}
function r3dRecipeForSprite(spr){
  if (spr.lead3d) return r3dLeaderRecipe();
  if (spr.m3d) return r3dMasterRecipe();
  if (spr.e3d) return r3dEnemyRecipe(spr.e3d);
  if (spr.p3d) return r3dRecipeOf(spr.p3d, spr.p3dL);
  return null;
}
const r3dTagged = spr => !!(spr && (spr.lead3d || spr.m3d || spr.e3d || spr.p3d));

/* ------------------------------------------------------------ wrappers --- */
{ const f = masterSprite; masterSprite = function(){ const spr = f(); spr.m3d = true; return spr; }; }
{ const f = enemySprite;
  enemySprite = function(kind){
    const spr = f(kind);
    if (spr && !spr.e3d && ENEMY_LOOK[kind] && !['wolf', 'cinder', 'alpha', 'wyrm', 'nest', 'engine'].includes(kind) && !customEnemySprite(kind)) spr.e3d = kind;
    return spr;
  };
}
// F-42b/F-44a: the 3D bard's lute, drawn as smooth shaded vector shapes (no pixel art) across his lap, bobbing with each pluck.
// window.BARD_LUTE = false removes it; window.BARD_LUTE_PIXEL = true brings back the old pixel-art lute.
let _bardLuteCv = null;
function bardLutePixel(x, y, s, tick){
  if (!_bardLuteCv){
    const c = newCanvas(30, 28), g = c.getContext('2d'), P = painter(g), OX = 3, wood = '#a06a30', rim = '#5a3418';
    P(OX + 11, 18, 5, 1, rim); P(OX + 10, 19, 7, 1, rim); P(OX + 10, 20, 7, 3, wood); P(OX + 10, 20, 1, 3, rim); P(OX + 16, 20, 1, 3, rim); P(OX + 11, 23, 5, 1, rim); P(OX + 11, 19, 5, 1, '#c08a48'); P(OX + 13, 20, 2, 2, '#2a1608');
    for (let i = 0; i <= 8; i++){ const px = OX + 16 + i, py = 19 - Math.round(i * 0.75); P(px, py, 1, 1, '#4a2c12'); P(px, py + 1, 1, 1, '#2e1a0a'); }
    P(OX + 24, 12, 3, 2, '#3a2410'); P(OX + 24, 11, 1, 1, '#e8dcb0'); P(OX + 26, 14, 1, 1, '#e8dcb0');
    _bardLuteCv = outline(c);
  }
  const pl = (Math.floor(tick / 6) % 4 === 1 || Math.floor(tick / 6) % 4 === 3) ? 0.6 * s : 0;
  const g = ctx; g.save(); g.imageSmoothingEnabled = false; g.drawImage(_bardLuteCv, x - 15 * s, y - 19 * s + pl, 30 * s, 28 * s); g.restore();
}
function bardLute(x, y, s, tick){
  if (window.BARD_LUTE_PIXEL === true) return bardLutePixel(x, y, s, tick);
  const ph = Math.floor(tick / 6) % 4, bob = (ph === 1 || ph === 3) ? 0.4 * s : 0, u = s * 0.3;
  const g = ctx; g.save(); g.translate(x + 1.2 * s, y - 0.6 * s + bob); if (window.BARD_LUTE_FLIP === false) g.rotate(-0.45); else { g.scale(-1, 1); g.rotate(0.4); }   // P23-BUG-8 (AD 23 Nov): he faces right, so the body sits on his lap and the neck rises forward to his reaching hand (it pointed back behind him); BARD_LUTE_FLIP = false restores the old way
  const bodyG = g.createRadialGradient(-2 * u, -2 * u, 1 * u, 0, 0, 10 * u); bodyG.addColorStop(0, '#c58a4a'); bodyG.addColorStop(0.6, '#9a6232'); bodyG.addColorStop(1, '#5e3a1c');
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(1.2 * u, 2.2 * u, 8.4 * u, 6.2 * u, 0, 0, 7); g.fill();   // soft contact shadow on the lap
  g.fillStyle = bodyG; g.beginPath(); g.ellipse(0, 0, 8 * u, 6 * u, 0, 0, 7); g.fill();   // the round belly
  g.lineWidth = 0.8 * u; g.strokeStyle = 'rgba(60,34,14,.55)'; g.stroke();
  g.fillStyle = '#2b1a0c'; g.beginPath(); g.ellipse(-1 * u, 0, 2.1 * u, 1.9 * u, 0, 0, 7); g.fill();   // sound hole
  g.strokeStyle = 'rgba(255,225,170,.5)'; g.lineWidth = 0.7 * u; g.beginPath(); g.ellipse(-1 * u, 0, 3 * u, 2.8 * u, 0, 0, 7); g.stroke();   // its rosette
  g.fillStyle = '#4a2e16'; g.fillRect(-8.5 * u, -1.1 * u, 5 * u, 2.2 * u);   // the neck, behind the belly edge
  g.fillStyle = '#3a2410'; g.beginPath(); g.moveTo(-17 * u, -1.8 * u); g.lineTo(-12 * u, -1.5 * u); g.lineTo(-12 * u, 1.5 * u); g.lineTo(-16.6 * u, 2.6 * u); g.closePath(); g.fill();   // the bent peg-head
  g.fillStyle = '#e8dcb0'; g.fillRect(-15.2 * u, -2.2 * u, 0.9 * u, 0.9 * u); g.fillRect(-13.4 * u, 1.3 * u, 0.9 * u, 0.9 * u);   // two pegs
  g.strokeStyle = 'rgba(240,230,200,.55)'; g.lineWidth = 0.35 * u; g.beginPath(); g.moveTo(-15 * u, 0); g.lineTo(5 * u, 0); g.stroke();   // strings
  g.restore();
}
drawSprite = (function(prev){
  return function(spr, x, y, s, frame, left, flash){
    if (r3dTagged(spr)){
      try {
        r3dPumpTick();
        const [u, tick] = r3dUnitAt(x, y), rec = r3dRecipeForSprite(spr);
        if (u && rec){
          if (spr.bard){ if (!r3dDraw(rec, u, x, y, s, {clip:'sit', i:Math.floor(tick / (window.BARD_SWORD === true ? 9 : 6)) % 4, dir:1, light:true, shadow:false})) return void ((typeof PROPS3D !== 'undefined' && PROPS3D.figure(ctx, x, y + 9.5 * s, 17 * s, true)) || prev(spr, x, y, s, frame, left, flash));   /* S6-C 3a P15: never the pixel bard while 3D is on */ if (window.BARD_LUTE !== false) bardLute(x, y, s, tick); return; } /* F-42b: lute overlay; window.BARD_LUTE = false removes it */
          if (spr.e3d) u.e3d = true;
          const c = r3dChoose(rec, u, frame, tick), async = !!spr.e3d || (u.kind === 'folk');
          if (r3dDraw(rec, u, x, y, s, Object.assign(c, {flash, async, light:!spr.e3d}))) return;
        }
      } catch (e) { r3dWarnOnce('figure', e); }
    }
    return prev(spr, x, y, s, frame, left, flash);
  };
})(drawSprite);
{ const f = drawDowned;
  drawDowned = function(spr, x, y, s, alpha){
    if (r3dTagged(spr)){
      try {
        const [u, tick] = r3dUnitAt(x, y), rec = r3dRecipeForSprite(spr);
        if (u && rec){
          ctx.fillStyle = 'rgba(120,10,10,.45)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 9 * s / 2, 3 * s / 2, 0, 0, TAU); ctx.fill();
          const st = u._r3d = u._r3d || {dir:2};
          if (r3dDraw(rec, u, x, y - 4 * s, s, {clip:'downed', i:Math.floor(tick / 40) % 2, dir:st.dir, alpha, shadow:false, async:!!spr.e3d})) return;
        }
      } catch (e) { r3dWarnOnce('downed', e); }
    }
    return f(spr, x, y, s, alpha);
  };
}
{ const f = drawMounted;
  drawMounted = function(spr, x, y, s, frame, left, flash, moving, seed){
    if (r3dTagged(spr) && G && G.mount){
      try {
        const [u, tick] = r3dUnitAt(x, y), rec = r3dRecipeForSprite(spr);
        if (u && rec){
          const hf = moving ? ((G.frame + seed * 5) / 6 | 0) % 3 : 0, hsc = s * 1.05;
          /* S6-C note 10: no pixel horse under the 3D rider; a non-pixel stand-in until the 3D horse is baked */
          figPlaceholder(x, y, hsc, {h:20, w:8, horse:true, shadowW:10});
          const st = r3dDirFor(u), dir = left ? (st.dir === 5 || st.dir === 3 ? st.dir : 4) : (st.dir === 7 || st.dir === 1 ? st.dir : 0);
          let c = {clip:'mounted', i:Math.floor(tick / 6) % 4, dir};
          if (frame === 3 || frame === 4){ const k = r3dChoose(rec, u, frame, tick); c = {clip:k.clip, i:k.i, dir}; }
          if (r3dDraw(rec, u, x - (left ? -1 : 1) * s, y - 2.5 * s + (moving && hf === 1 ? -s : 0), s, Object.assign(c, {flash, light:true, shadow:false}))) return;
        }
      } catch (e) { r3dWarnOnce('rider', e); }
    }
    return f(spr, x, y, s, frame, left, flash, moving, seed);
  };
}
function r3dRest(spr, q){
  if (!r3dTagged(spr)) return false;
  try { const rec = r3dRecipeForSprite(spr); if (!rec) return false;
    return r3dDraw(rec, q, q.x - 6, q.y - 10, 2.4, {clip:'downed', i:0, dir:0, shadow:false}); } catch (e) { return false; }
}
/* a 3D death pose (folded: the new kinds R3D_SPECIAL, the four-legged QUAD_KINDS, then the humanoid enemies) */
function r3dCorpse(x){
  if (R3D_SPECIAL[x.k] && x.k !== 'ogre' && x.k !== 'devil'){
    try { const rec = r3dEnemyRecipe(x.k), s = BESTIARY[x.k].sc * 1.2; if (x.born === undefined) x.born = G.frame;
      return r3dDraw(rec, x, x.x, x.y, s, {clip:'death', i:Math.min(5, Math.floor((G.frame - x.born) / 6)), dir:x.dir !== undefined ? x.dir : (x.left ? 4 : 0),
        alpha:Math.min(1, x.life / 40) * 0.95, shadow:false, async:true}); } catch (e) { return false; }
  }
  if (QUAD_KINDS.has(x.k)){
    try { const s = BESTIARY[x.k].sc * 1.2; if (x.born === undefined) x.born = G.frame;
      return r3qDraw(r3qRecipe(x.k), x.x, x.y + 7 * s, s, {clip:'death', i:Math.min(5, Math.floor((G.frame - x.born) / 5)), dir:x.dir !== undefined ? x.dir : (x.left ? 4 : 0),
        alpha:Math.min(1, x.life / 40) * 0.95, shadow:false, async:true}); } catch (e) { return false; }
  }
  if (!ENEMY_LOOK[x.k] || ['wolf', 'cinder', 'alpha', 'wyrm', 'nest', 'engine'].includes(x.k) || customEnemySprite(x.k)) return false;
  try {
    const rec = r3dEnemyRecipe(x.k), s = BESTIARY[x.k].sc * 1.2;
    if (x.born === undefined) x.born = G.frame;
    const i = Math.min(5, Math.floor((G.frame - x.born) / 5));
    return r3dDraw(rec, x, x.x, x.y, s, {clip:'death', i, dir:x.dir !== undefined ? x.dir : (x.left ? 4 : 0), alpha:Math.min(1, x.life / 40) * 0.95, shadow:false, async:true});
  } catch (e) { return false; }
}
function r3dCorpseDir(e){   // called from the killEnemy wrapper (nests and engines, below)
    for (let k = G.fx.length - 1, n = 0; k >= 0 && n < 60; k--, n++){ const c = G.fx[k]; if (c.corpse && c.k === e.k && c.dir === undefined && Math.abs(c.x - e.x) < 1){ c.dir = e._r3d ? (e._r3d.qdir !== undefined ? e._r3d.qdir : e._r3d.dir) : (e.left ? 4 : 0);   /* beasts: the facing they were drawn with (S6-ANIM) */ c.born = G.frame; break; } }
}
function r3dDanceDraw(B, x, y, s, frame, left){
  if (!B) return false;
  try { const rec = r3dRecipeOf(B, false); return r3dDraw(rec, null, x, y, s, {clip:'play', i:frame % 4, dir:left ? 3 : 1, shadow:false, light:true}); } catch (e) { return false; }
}
// queue the host's troops when a contract starts, so they turn 3D within a second or two (called from the startDeployment wrapper below)
function r3dWarmHost(c){
    try { if (G){ const St = R3D_STYLES[r3dStyleId()], H = hostOf(), kinds = new Set();
      for (const t in H.pools) for (const k of H.pools[t]) kinds.add(k);
      for (const k of (H.bosses[c.tier] || [])) kinds.add(k);
      for (const e of G.enemies) kinds.add(e.k);
      for (const k of kinds){ const spr = enemySprite(k); if (!spr || !spr.e3d) continue; const rec = r3dEnemyRecipe(k); for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) r3dFramesAsync(rec, 'idle', d, St, true); for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) r3dFramesAsync(rec, 'walk', d, St, true); }
    } } catch (e) {}
}
for (const k in R3DP) delete R3DP[k];
R3DM.recs.clear(); R3DL.recKey = '';
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx55')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx55"><b>3D for everyone.</b> With a 3D look on, the whole Chapter, the Chapter Master, the Bard and the Scribe, townsfolk and every humanoid enemy are drawn in 3D: they run, cast, flinch when hit, fall when downed, die where they stand and ride. Injuries show as eye patches, slings, bindings and braces. Beasts and horses are still pixel art.</p>`);
  };
}
/* ===== END INDEX 55 ======================================================= */

/* ============================================================================
   INDEX 56 - FOUR-LEGGED RIGS: WOLVES, THE ALPHA, HORSES AND HOUNDS
   A new rig, 'quad', with its own skeleton and clips: idle, walk, run (a
   gallop), attack and death. Built from data in QUAD3D:
     wolf        Timber Wolf: grey, ruff, brush tail, bites with an open jaw
     alpha       Alpha Dire Wolf: bigger, near black, heavier ruff, red eyes
     hound       the Kennels' hounds: brown, floppy ears, red collar
     horse:<id>  riding / lighthorse / warhorses, coloured from HORSE_LOOK,
                 saddle and blanket; warhorses wear a red barding. A horse's
                 attack is a rear.
   MOUNTED     Rider and horse are one model ('mount' rig): the rider's pelvis
               is a child of the horse's saddle bone and both are rendered
               together, so the horse hides the far leg and the rider rocks
               with the gait. Clips: idle, walk, run, melee, shoot, cast. The
               horse walks, gallops when charging, and stands for attacks.
   WHERE       wolves and the Alpha in every contract (and they fall dead in
               3D), the Kennels' hounds, mounted squads, the stable paddock in
               camp, and a riderless horse bolting after its rider is thrown.
               The caravan's draught horse and story riders stay pixel art.
   SPEED       New models render in the background and show the pixel sprite
               until ready; a mounted squad's walk and idle are queued when a
               contract starts.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 56
   and undo the two small patches marked "Index 56".

   3D DESIGN NOTE, ADDENDUM (read with Index 50, 51, 53, 54 and 55)
     QUAD BONES  qHips (root, at the hind hips) qSpine (mid back) qWith
                 (withers) qNeck qHead qJaw qTail qTail2, legs qFLu qFLl
                 qFLp (front left: upper, lower, paw/hoof), qFR*, qBL*, qBR*,
                 and qSad (saddle, horses). Legs hang along -y, the neck points
                 along +y and leans forward by rest.qNeck, the head and jaw
                 point along +z. rx > 0 swings a leg backward, opens the jaw
                 and tips the neck forward. A rotation of qHips pitches or
                 rolls the whole animal about its hind hips (rearing, falling).
     REST POSE   recipe.qrest holds the standing angles; clips add to it
                 through qPose(rec, delta).
     FRAMES      A recipe may carry frame:{W, H, FEET, CX} (base pixels) for a
                 bigger canvas than the humanoid 96 x 100; r3dFrames applies it,
                 and r3qDraw places the result. Humanoid code is untouched.
     ADD A BEAST Add a QUAD3D entry (sizes and colours); give it ears, tail,
                 paw or hoof; tag its sprite q3d in the enemySprite wrapper.
     MOUNT RIG   r3qMountRecipe(riderRec, horseKind) merges two recipes;
                 horse bones and zones use names that never clash with the
                 humanoid's (coat, belly, mane, hoof, saddleC, barding, tack,
                 qeye, qnose, collar).
============================================================================ */
const QUAD3D = {
  wolf:{hh:22, sh:24, L:26, bw:6.4, bh:7.4, neck:9, neckR:3.7, neckRx:1.05, headL:13, headR:4.3, tail:17, legU:2.3, legL:1.6, ears:'wolf', tailT:'brush', foot:'paw', ruff:1,
        coat:'#7a7e80', belly:'#b8b4a8', dark:'#3e4044', qeye:'#e8d060', qnose:'#141214'},
  alpha:{hh:23, sh:26, L:28, bw:7.4, bh:8.4, neck:9, neckR:4.4, neckRx:1.05, headL:14, headR:4.9, tail:18, legU:2.6, legL:1.8, ears:'wolf', tailT:'brush', foot:'paw', ruff:1.35,
        coat:'#3c3e44', belly:'#6a6a6e', dark:'#1e1e22', qeye:'#ff3a2a', qnose:'#0a0a0a', glowEye:true},
  hound:{hh:18, sh:19.5, L:21, bw:5.2, bh:6, neck:7, neckR:3, neckRx:0.95, headL:11, headR:3.7, tail:12, legU:1.9, legL:1.35, ears:'flop', tailT:'thin', foot:'paw', ruff:0,
        coat:'#8a6a44', belly:'#c8aa80', dark:'#4a3220', qeye:'#2a1a10', qnose:'#141214', collar:'#8a2a24'},
  horse:{hh:40, sh:42, L:34, bw:10, bh:12, neck:17, neckR:5.6, neckRx:0.88, headL:16, headR:5.4, tail:22, legU:3, legL:1.9, ears:'horse', tailT:'hair', foot:'hoof', ruff:0,
        coat:'#8a5a2b', belly:'#8a5a2b', dark:'#3a2414', qeye:'#141010', qnose:'#2a1a14', horse:true}
};
const QUAD_FRAME = {small:{W:120, H:96, FEET:84, CX:60}, horse:{W:160, H:130, FEET:118, CX:80}};
function r3qSkel(Q){
  const L = Q.L, hh = Q.hh, sh = Q.sh, fU = (sh - 2) * 0.5, fL = (sh - 2) * 0.5, bU = (hh - 1) * 0.48, bL = (hh - 1) * 0.52, w = Q.bw;
  const bones = {
    qHips:{parent:null, off:[0, hh, -L / 2]},
    qSpine:{parent:'qHips', off:[0, 0, L / 2]},
    qWith:{parent:'qSpine', off:[0, sh - hh, L / 2]},
    qNeck:{parent:'qWith', off:[0, Q.bh * 0.25, Q.bw * 0.2]},
    qHead:{parent:'qNeck', off:[0, Q.neck, 0]},
    qJaw:{parent:'qHead', off:[0, -Q.headR * 0.42, Q.headR * 0.2]},
    qFLu:{parent:'qWith', off:[w * 0.62, -Q.bh * 0.35, 1]}, qFLl:{parent:'qFLu', off:[0, -fU + Q.bh * 0.35, 0]}, qFLp:{parent:'qFLl', off:[0, -fL, 0]},
    qFRu:{parent:'qWith', off:[-w * 0.62, -Q.bh * 0.35, 1]}, qFRl:{parent:'qFRu', off:[0, -fU + Q.bh * 0.35, 0]}, qFRp:{parent:'qFRl', off:[0, -fL, 0]},
    qBLu:{parent:'qHips', off:[w * 0.66, -1, 0]}, qBLl:{parent:'qBLu', off:[0, -bU, 0]}, qBLp:{parent:'qBLl', off:[0, -bL, 0]},
    qBRu:{parent:'qHips', off:[-w * 0.66, -1, 0]}, qBRl:{parent:'qBRu', off:[0, -bU, 0]}, qBRp:{parent:'qBRl', off:[0, -bL, 0]},
    qTail:{parent:'qHips', off:[0, Q.bh * 0.45, -Q.bw * 0.7]}, qTail2:{parent:'qTail', off:[0, 0, -Q.tail * 0.5]}
  };
  if (Q.horse) bones.qSad = {parent:'qSpine', off:[0, Q.bh * 0.92, -2]};
  const order = ['qHips', 'qSpine', 'qWith', 'qNeck', 'qHead', 'qJaw', 'qFLu', 'qFLl', 'qFLp', 'qFRu', 'qFRl', 'qFRp', 'qBLu', 'qBLl', 'qBLp', 'qBRu', 'qBRl', 'qBRp', 'qTail', 'qTail2'].concat(Q.horse ? ['qSad'] : []);
  return {order, bones, fU, fL, bU, bL};
}
function r3qBuild(kind){
  const base = kind.indexOf('horse:') === 0 ? 'horse' : kind, Q = Object.assign({}, QUAD3D[base]);
  if (base === 'horse'){ const H = HORSE_LOOK[kind.slice(6)] || HORSE_LOOK.riding; Q.coat = H.coat; Q.belly = shade(H.coat, 1.12); Q.mane = H.mane; Q.saddle = H.saddle; Q.barding = !!H.barding; Q.dark = shade(H.coat, 0.6); }
  const S = r3qSkel(Q), P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); }, L = Q.L, w = Q.bw, h = Q.bh, hr = Q.headR, hl = Q.headL;
  // body: haunch, barrel, chest, a lighter belly
  add('qHips', [{t:'ell', c:[0, 0, L * 0.12], r:[w, h * 0.95, L * 0.36], z:'coat'}]);
  add('qSpine', [{t:'ell', c:[0, -h * 0.05, 0], r:[w * 0.95, h * 0.92, L * 0.42], z:'coat'}, {t:'ell', c:[0, -h * 0.62, 0], r:[w * 0.72, h * 0.4, L * 0.36], z:'belly'}]);
  add('qWith', [{t:'ell', c:[0, -h * 0.45, -1.5], r:[w * 1.05, h * 1.08, L * 0.3], z:'coat'}]);
  if (Q.ruff) add('qWith', [{t:'ell', c:[0, -h * 0.1, 1.5], r:[w * 1.12 * Q.ruff, h * 1.05 * Q.ruff, L * 0.22], z:'coat'}, {t:'ell', c:[0, -h * 0.75, 2.5], r:[w * 0.7, h * 0.5 * Q.ruff, L * 0.16], z:'belly'}]);
  // neck and head
  add('qNeck', [{t:'cap', a:[0, -1, 0], p:[0, Q.neck, 0], r:Q.neckR, z:'coat'}]);
  if (Q.horse) add('qNeck', [{t:'box', c:[0, Q.neck * 0.52, -Q.neckR * 0.85], r:[1.3, Q.neck * 0.58, Q.neckR * 0.45], z:'mane'}]);
  if (Q.collar) add('qNeck', [{t:'ell', c:[0, 1.5, 0], r:[Q.neckR * 1.15, 1.1, Q.neckR * 1.15], z:'collar'}]);
  add('qHead', [{t:'ell', c:[0, 0, hl * 0.12], r:[hr, hr * (Q.horse ? 1.05 : 0.95), hr * 1.1], z:'coat'},
    {t:'ell', c:[0, -hr * (Q.horse ? 0.18 : 0.22), hl * 0.62], r:[hr * (Q.horse ? 0.62 : 0.5), hr * (Q.horse ? 0.62 : 0.48), hl * 0.42], z:'coat'},
    {t:'ell', c:[0, -hr * 0.05, hl * 0.98], r:[hr * 0.3, hr * 0.26, hr * 0.26], z:'qnose'}]);
  for (const sx of [1, -1]){
    add('qHead', [{t:'ell', c:[sx * hr * 0.62, hr * 0.28, hl * 0.32], r:[0.7, 0.8, 0.7], z:'qeye'}]);
    if (Q.ears === 'wolf') add('qHead', [{t:'ell', c:[sx * hr * 0.55, hr * 1.05, -hr * 0.1], r:[1.2, hr * 0.62, 0.8], rot:[-0.25, 0, -sx * 0.22], z:'coat'}]);
    if (Q.ears === 'flop') add('qHead', [{t:'ell', c:[sx * hr * 0.95, -hr * 0.1, -hr * 0.1], r:[0.7, hr * 0.62, hr * 0.42], rot:[0.1, 0, sx * 0.25], z:'dark'}]);
    if (Q.ears === 'horse') add('qHead', [{t:'ell', c:[sx * hr * 0.5, hr * 1.05, -hr * 0.45], r:[0.9, hr * 0.42, 0.7], rot:[-0.2, 0, -sx * 0.15], z:'coat'}]);
  }
  if (Q.horse) add('qHead', [{t:'box', c:[0, hr * 0.85, -hr * 0.4], r:[1.2, hr * 0.35, hr * 0.6], z:'mane'}, {t:'box', c:[0, -hr * 0.1, hl * 0.45], r:[hr * 0.66, 0.5, 0.5], z:'tack'}]);
  add('qJaw', [{t:'ell', c:[0, 0, hl * 0.42], r:[hr * (Q.horse ? 0.5 : 0.4), hr * 0.2, hl * 0.36], z:Q.horse ? 'coat' : 'dark'}]);
  // legs
  const legs = [['qFLu', 'qFLl', 'qFLp', S.fU, S.fL, 1], ['qFRu', 'qFRl', 'qFRp', S.fU, S.fL, -1], ['qBLu', 'qBLl', 'qBLp', S.bU, S.bL, 1], ['qBRu', 'qBRl', 'qBRp', S.bU, S.bL, -1]];
  legs.forEach(([u, l, p, U, Lo], i) => {
    const hind = i >= 2;
    add(u, [{t:'cap', a:[0, 0, 0], p:[0, -U + (hind ? 0 : h * 0.35), 0], r:Q.legU * (hind ? 1.25 : 1), z:'coat'}]);
    add(l, [{t:'cap', a:[0, 0, 0], p:[0, -Lo, 0], r:Q.legL, z:'coat'}]);
    if (Q.foot === 'hoof') add(p, [{t:'cap', a:[0, 1.6, 0.2], p:[0, -0.6, 0.6], r:Q.legL * 1.25, z:'hoof'}]);
    else add(p, [{t:'ell', c:[0, 0.2, 1.1], r:[Q.legL * 1.1, Q.legL * 0.75, Q.legL * 1.5], z:'dark'}]);
  });
  // tail
  if (Q.tailT === 'brush') add('qTail', [{t:'ell', c:[0, 0, -Q.tail * 0.3], r:[2.4, 2.6, Q.tail * 0.32], z:'coat'}]), add('qTail2', [{t:'ell', c:[0, 0, -Q.tail * 0.18], r:[2.8, 3, Q.tail * 0.3], z:'coat'}, {t:'ell', c:[0, 0, -Q.tail * 0.42], r:[1.6, 1.8, 2.4], z:'dark'}]);
  else if (Q.tailT === 'thin') add('qTail', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.5], r:1.1, z:'coat'}]), add('qTail2', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.5], r:0.85, z:'coat'}]);
  else add('qTail', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.5], r:2.6, z:'mane'}]), add('qTail2', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.55], r:3, z:'mane'}]);
  // saddle and barding
  if (Q.horse){
    add('qSad', [{t:'box', c:[0, -1.2, 0], r:[w * 1.08, 1.2, 7.5], z:'barding'}, {t:'ell', c:[0, 0.3, 0], r:[w * 0.75, 2, 6.2], z:'saddleC'}, {t:'ell', c:[0, 2, -5.2], r:[w * 0.55, 2.4, 1.4], z:'saddleC'},
      {t:'ell', c:[0, 1.5, 5.4], r:[w * 0.4, 2.2, 1.3], z:'saddleC'}]);
    for (const sx of [1, -1]) add('qSad', [{t:'cap', a:[sx * w * 0.95, -1, 0], p:[sx * w * 0.98, -h * 0.9, 0], r:0.5, z:'tack'}]);
    if (Q.barding) add('qSpine', [{t:'ell', c:[0, -h * 0.12, 1], r:[w * 1.12, h * 0.85, L * 0.5], z:'barding'}]), add('qNeck', [{t:'box', c:[0, Q.neck * 0.5, Q.neckR * 0.4], r:[Q.neckR * 1.05, Q.neck * 0.45, Q.neckR * 0.8], z:'barding'}]);
  }
  const zones = {coat:Q.coat, belly:Q.belly, dark:Q.dark, qeye:Q.qeye, qnose:Q.qnose, mane:Q.mane || Q.dark, hoof:'#2a2420', saddleC:Q.saddle || '#5a3a22', tack:'#3a2616',
    barding:Q.barding ? '#6a1a1a' : (Q.saddle ? shade(Q.saddle, 0.85) : '#5a3a22'), collar:Q.collar || '#8a2a24'};
  const rest = {qNeck:[Q.neckRx, 0, 0], qHead:[Q.horse ? 0.2 - Q.neckRx + 0.45 : -Q.neckRx + 0.1, 0, 0], qTail:[Q.tailT === 'hair' ? -0.95 : Q.tailT === 'brush' ? -0.55 : -0.35, 0, 0], qTail2:[Q.tailT === 'hair' ? -0.25 : Q.tailT === 'brush' ? -0.3 : -0.3, 0, 0],
    qBLu:[-0.12, 0, 0], qBLl:[0.32, 0, 0], qBLp:[-0.2, 0, 0], qBRu:[-0.12, 0, 0], qBRl:[0.32, 0, 0], qBRp:[-0.2, 0, 0], qFLl:[0.02, 0, 0], qFRl:[0.02, 0, 0]};
  const rec = {rig:'quad', skel:{order:S.order, bones:S.bones}, parts:P, zones, qrest:rest, frame:Q.horse ? QUAD_FRAME.horse : QUAD_FRAME.small, Q};
  if (Q.glowEye){ for (const q of P) if (q.z === 'qeye') q.z = 'eyeglow'; zones.eyeglow = Q.qeye; }
  const orig = Object.assign({}, zones); r3dMute(rec);
  for (const z in zones){ const a = hex3(orig[z]), b = hex3(zones[z]); zones[z] = '#' + a.map((v, i) => Math.round(v * 0.35 + b[i] * 0.65).toString(16).padStart(2, '0')).join(''); }
  if (Q.glowEye) zones.eyeglow = Q.qeye;
  rec.key = 'r3q' + hash(JSON.stringify(rec));
  return rec;
}
const R3QR = {};
let r3qRecipe = kind => R3QR[kind] || (R3QR[kind] = r3qHaloed(kind, r3qBuild(kind)));
/* the alpha wolf's boss edge rides on its recipe, so a cache clear (late-fixes) keeps it (QA Low, 0e3652d) */
function r3qHaloed(kind, rec){ if (kind === 'alpha' && rec && !rec.halo) rec.halo = HALO_DEFAULT; return rec; }
R3D_MUTE_SKIP.add('qeye');

/* ---------------------------------------------------------------- clips --- */
function qPose(rec, d){
  const r = rec.qrest || {}, out = {bob:d.bob || 0};
  for (const b of new Set(Object.keys(r).concat(Object.keys(d)))){ if (b === 'bob') continue;
    const x = r[b] || Z3, y = d[b] || Z3; out[b] = [x[0] + y[0], x[1] + y[1], x[2] + y[2]]; }
  return out;
}
const legSwing = (ph, A, lift, back) => { const sw = Math.sin(ph), up = Math.max(0, Math.cos(ph)); return [[-A * sw, 0, 0], [lift * up * (back ? 1 : 1), 0, 0], [-lift * 0.5 * up, 0, 0]]; };
function quadGait(rec, t, phases, A, lift, extra){
  const d = Object.assign({}, extra), T = t * Math.PI * 2;
  [['qFL', phases[0], 0], ['qFR', phases[1], 0], ['qBL', phases[2], 1], ['qBR', phases[3], 1]].forEach(([n, ph, hind]) => {
    const [u, l, p] = legSwing(T + ph * Math.PI * 2, A * (hind ? 0.9 : 1), lift, hind);
    d[n + 'u'] = u; d[n + 'l'] = hind ? [l[0] * 0.6, 0, 0] : l; d[n + 'p'] = p;
  });
  return qPose(rec, d);
}
R3D_CLIPS.quad = {
  idle:{n:4, fn:(t, rec) => { const b = Math.sin(t * Math.PI * 2);
    return qPose(rec, {bob:0.25 * b, qSpine:[0.01 * b, 0, 0], qNeck:[-0.04 * b, 0, 0], qHead:[0.06 * b, 0.12 * Math.sin(t * Math.PI * 2 + 1), 0], qTail:[0, 0.18 * Math.sin(t * Math.PI * 2), 0], qTail2:[0, 0.22 * Math.sin(t * Math.PI * 2 - 1), 0], qJaw:[rec.Q && !rec.Q.horse ? 0.12 + 0.08 * b : 0, 0, 0]}); }},
  walk:{n:8, fn:(t, rec) => { const T = t * Math.PI * 2;
    return quadGait(rec, t, [0.25, 0.75, 0, 0.5], 0.42, 0.7, {bob:0.5 * Math.cos(2 * T), qHips:[0, 0.04 * Math.sin(T), 0.03 * Math.sin(T)], qNeck:[0.05 * Math.cos(2 * T), 0, 0], qHead:[-0.05 * Math.cos(2 * T), -0.05 * Math.sin(T), 0],
      qTail:[0, 0.2 * Math.sin(T), 0], qTail2:[0, 0.25 * Math.sin(T - 1), 0]}); }},
  run:{n:8, fn:(t, rec) => { const T = t * Math.PI * 2, s2 = Math.sin(T);
    return quadGait(rec, t, [0.5, 0.58, 0, 0.08], 0.8, 1.15, {bob:1.6 * Math.max(0, Math.sin(T + 0.6)) - 0.8, qHips:[0.1 * s2, 0, 0], qWith:[-0.12 * s2, 0, 0], qNeck:[-0.18 + 0.12 * s2, 0, 0], qHead:[0.2 - 0.1 * s2, 0, 0],
      qTail:[-0.2 + 0.15 * s2, 0, 0], qTail2:[-0.15 + 0.2 * Math.sin(T - 1), 0, 0], qJaw:[rec.Q && !rec.Q.horse ? 0.25 : 0, 0, 0]}); }},
  attack:{n:6, fn:(t, rec) => {
    if (rec.Q && rec.Q.horse) return keyedT([
      [0, qPose(rec, {})],
      [0.4, qPose(rec, {bob:2, qHips:[-0.62, 0, 0], qBLu:[0.48, 0, 0], qBRu:[0.52, 0, 0], qBLl:[0.15, 0, 0], qBRl:[0.15, 0, 0], qFLu:[-0.9, 0, 0], qFLl:[1.6, 0, 0], qFRu:[-0.6, 0, 0], qFRl:[1.3, 0, 0], qNeck:[-0.35, 0, 0], qHead:[0.3, 0, 0], qJaw:[0.25, 0, 0], qTail:[0.4, 0, 0]})],
      [0.7, qPose(rec, {bob:2, qHips:[-0.6, 0, 0], qBLu:[0.48, 0, 0], qBRu:[0.5, 0, 0], qFLu:[-0.5, 0, 0], qFLl:[1.2, 0, 0], qFRu:[-1.0, 0, 0], qFRl:[1.7, 0, 0], qNeck:[-0.3, 0, 0], qHead:[0.25, 0, 0], qTail:[0.4, 0, 0]})],
      [1, qPose(rec, {})]], t);
    return keyedT([
      [0, qPose(rec, {})],
      [0.32, qPose(rec, {bob:-3, qHips:[0.1, 0, 0], qBLu:[-0.5, 0, 0], qBRu:[-0.5, 0, 0], qBLl:[0.75, 0, 0], qBRl:[0.75, 0, 0], qFLu:[0.3, 0, 0], qFRu:[0.3, 0, 0], qFLl:[0.5, 0, 0], qFRl:[0.5, 0, 0], qNeck:[0.25, 0, 0], qHead:[-0.1, 0, 0], qTail:[-0.4, 0, 0]})],
      [0.55, qPose(rec, {bob:3, qHips:[-0.2, 0, 0], qBLu:[0.6, 0, 0], qBRu:[0.65, 0, 0], qFLu:[-1.0, 0, 0], qFRu:[-1.1, 0, 0], qFLl:[0.5, 0, 0], qFRl:[0.6, 0, 0], qNeck:[0.15, 0, 0], qHead:[0.05, 0, 0], qJaw:[0.75, 0, 0], qTail:[0.2, 0, 0]})],
      [0.75, qPose(rec, {bob:0, qHips:[0.08, 0, 0], qFLu:[-0.6, 0, 0], qFRu:[-0.5, 0, 0], qNeck:[0.35, 0, 0], qHead:[0.25, 0.2, 0], qJaw:[0.1, 0, 0]})],
      [1, qPose(rec, {})]], t); }},
  death:{n:6, fn:(t, rec) => { const Q = rec.Q || {hh:22, bw:6}, down = -Q.hh + Q.bw * 1.05;
    return keyedT([
      [0, qPose(rec, {bob:0, qNeck:[-0.3, 0, 0], qHead:[0.3, 0, 0], qJaw:[0.5, 0, 0]})],
      [0.3, qPose(rec, {bob:down * 0.3, qHips:[0, 0, 0.35], qBLu:[0.3, 0, 0], qFLu:[-0.3, 0, 0], qFLl:[0.6, 0, 0], qNeck:[0.2, 0, 0], qJaw:[0.3, 0, 0]})],
      [0.7, qPose(rec, {bob:down, qHips:[0, 0, 1.45], qBLu:[-0.2, 0, -0.3], qBRu:[0.3, 0, -0.1], qFLu:[-0.5, 0, -0.3], qFRu:[-0.2, 0, -0.1], qFLl:[0.3, 0, 0], qNeck:[-0.4, 0, 0.1], qHead:[0.5, 0, 0.1], qTail:[-0.8, 0, 0]})],
      [1, qPose(rec, {bob:down, qHips:[0, 0, 1.5], qBLu:[-0.25, 0, -0.35], qBRu:[0.3, 0, -0.1], qFLu:[-0.55, 0, -0.35], qFRu:[-0.2, 0, -0.1], qFLl:[0.3, 0, 0], qNeck:[-0.45, 0, 0.1], qHead:[0.55, 0, 0.1], qTail:[-0.9, 0, 0]})]], t); }}
};

/* ---------------------------------------------------------- the mount rig --- */
function r3qMountRecipe(rider, kind){
  const key = rider.key + '|' + kind; if (R3QR[key]) return R3QR[key];
  const horse = r3qRecipe(kind), Q = horse.Q;
  const bones = Object.assign({}, horse.skel.bones);
  for (const n of rider.skel.order){ const b = rider.skel.bones[n]; bones[n] = n === 'pelvis' ? {parent:'qSad', off:[0, 3.2, -0.5]} : b; }
  const rec = {rig:'mount', skel:{order:horse.skel.order.concat(rider.skel.order), bones}, parts:horse.parts.concat(rider.parts), zones:Object.assign({}, rider.zones, horse.zones),
    qrest:horse.qrest, Q, frame:QUAD_FRAME.horse, rider, grip:rider.grip};
  rec.key = 'r3m' + hash(key);
  return R3QR[key] = rec;
}
const SEAT = {pelvis:[0.05, 0, 0], thL:[-1.05, 0, 0.62], shL:[1.25, 0, 0], thR:[-1.05, 0, -0.62], shR:[1.25, 0, 0]};
function seatPose(rider, clip, t, gait){
  const p = clip === 'ride' ? {chest:[0.06 + 0.05 * Math.sin(t * Math.PI * 4), 0, 0], head:[-0.06, 0, 0], upL:[-0.5, 0, 0.12], loL:[-1.0, 0, 0], upR:[-0.5, 0, -0.12], loR:[-1.0, 0, 0],
      hdR:rider.grip === 'staff' ? [1.5, 0, 0] : Z3, hdL:rider.grip === 'bow' ? [1.2, 0, 0] : Z3, cape:[0.25 + (gait === 'run' ? 0.3 : 0.1) + 0.06 * Math.sin(t * Math.PI * 4), 0, 0], cape2:[0.12 + 0.08 * Math.sin(t * Math.PI * 4 - 1), 0, 0], cape3:[0.1, 0, 0]}
    : Object.assign({}, R3D_CLIPS.humanoid[clip].fn(t, rider));
  delete p.bob;
  return Object.assign(p, SEAT);
}
R3D_CLIPS.mount = {};
for (const [clip, n, gait, act] of [['idle', 4, 'idle', 'ride'], ['walk', 8, 'walk', 'ride'], ['run', 8, 'run', 'ride'], ['melee', 8, 'idle', 'melee'], ['shoot', 6, 'idle', 'shoot'], ['cast', 6, 'idle', 'cast']])
  R3D_CLIPS.mount[clip] = {n, fn:(t, rec) => Object.assign(R3D_CLIPS.quad[gait].fn(t, rec), seatPose(rec.rider, act, t, gait))};

/* ------------------------------------------------- frames on a bigger canvas --- */
function r3qDraw(rec, x, y, s, o){
  if (rec && rec.shadowW && o && o.shadow !== false) o = Object.assign({}, o, {shadowW:rec.shadowW});   /* a recipe's own shadow width (was a wrapper; INT-1 step 3) */
  const St = R3D_STYLES[r3dStyleId() || 'crisp'];
  const fr = o.async ? (r3dFramesAsync(rec, o.clip, o.dir, St) || r3dStandIn(rec, o.clip, o.dir, St)) : r3dFrames(rec, o.clip, o.dir, St);
  if (!fr) return false;
  const img = fr[Math.min(fr.length - 1, o.i || 0)], F = rec.frame, k = St.res, sc = s / R3D.K / k;
  const W = img.width, H = img.height, dx = x - Math.round(F.CX * k) * sc, dy = y - Math.round(F.FEET * k) * sc, w = W * sc, h = H * sc;
  if (o.shadow !== false) shadow(x, y, (o.shadowW || 9) * s / 2.4);
  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.save(); ctx.imageSmoothingEnabled = r3dSmooth(w, W); if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.flash && R3DL.flashKeep !== false) ctx.drawImage(r3dFlashOf(img), dx, dy, w, h);
  else if (o.flash){
    if (!R3DL.flashQ || R3DL.flashQ.width !== W || R3DL.flashQ.height !== H) R3DL.flashQ = newCanvas(W, H);
    const g = R3DL.flashQ.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, W, H); ctx.drawImage(R3DL.flashQ, dx, dy, w, h);
  } else ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();
  ctx.imageSmoothingEnabled = prevSmooth;
  if (o.light && !o.flash) try { r3dLightUp(img, dx, dy, w, h, r3dLights(x, y), St.hard); } catch (e) {}
  return true;
}
const QUAD_KINDS = new Set(['wolf', 'alpha']);
function r3qChoose(u, frame, tick, runner, rig){
  const st = r3dDirFor(u), clips = (rig && R3D_CLIPS[rig]) ? R3D_CLIPS[rig] : R3D_CLIPS.quad;
  /* S6-ANIM (AD 23 Nov): beasts step by distance, not by the clock. A leash point trails the beast 2.5 px behind: the 1 px
     shuffle a wyrm or spider makes while it holds on its target never pulls the leash, so it idles instead of running on the
     spot; real travel pulls the leash 1:1. One frame per 4 px run (6 px walk) is the old cadence at 1 px a tick, the beasts'
     base speed. Facing follows the beast's raw travel while it shows a moving clip: the travel off its heading adds up as a vector and
     it turns once that vector is 4 px (one octant off) or 6 px (more) long; travel that sums to the heading clears it, a rest clears
     it, and back-and-forth jitter cancels in it, so a holding beast's 2-3 px drift never turns it (QA 042142c7). At most 3 px
     counts a call. A call where the beast was shoved (stagger or atkT came back up, or a J-08 knock-back ran) adds nothing
     (Neon R13-R15). The vector clears after 15 idle ticks. The first move
     after spawn turns at once; during a strike it turns to the
     target's side once, as the strike starts (as r3dDirFor does for a still unit). The leash runs on every call, strikes
     included. A jump of more than 30 px in one call (knockback, placement, fog re-entry) moves the leash without a stride or
     a turn; a fast real gait (a charge, a flee, a low frame rate) still strides, at most 8 px of phase a call. Safe to call
     twice in one frame: the second call finds the leash slack. st.qph is the phase in frames (anim.js reads it).
     window.QUAD_STRIDE = false: the old clock-driven gait (Neon R9 and R10 fixes: strike path, toggle, knockback, corpse,
     strike-facing strobe, fast gaits; QA: spider facing drift). */
  const old = window.QUAD_STRIDE === false;
  if (old){ st.qph = undefined; st.ax = undefined; st.qdir = undefined; st.qatk = false; }
  else {
    if (st.ax === undefined || !(st.qph >= 0)){ st.ax = u.x; st.ay = u.y; st.qpx = u.x; st.qpy = u.y; st.qmT = 0; st.qrT = 0; st.qdir = st.dir; st.qph = 0; st.qatk = false; st.vx = 0; st.vy = 0; st.qnew = true; st.qtm = {}; st.qkb = 0; }
    const lx = u.x - st.ax, ly = u.y - st.ay, ld = Math.hypot(lx, ly); let step = 0;
    const rx = u.x - st.qpx, ry = u.y - st.qpy, rd = Math.hypot(rx, ry); st.qpx = u.x; st.qpy = u.y;   // raw travel since the last call (0 on a same-frame second call); not st.px, which r3dDirFor owns
    const el = tick === st.qtk ? 0 : tick > (st.qtk || 0) ? Math.min(6, tick - (st.qtk || 0)) : 1;   // ticks since the last call (fractional for camp dogs)
    let knocked = false;   // a shove this call: a timer that counts down every tick came back up (stagger: a melee hit or miss; atkT: Disengage), or a J-08 knock-back ran. Not hitCd: it freezes on a broken or contract-AI beast (Neon R15)
    for (const k of ['stagger', 'atkT']){ const v = u[k] || 0, pv = st.qtm[k]; if (el && pv !== undefined && v > Math.max(0, pv - el)) knocked = true; if (el) st.qtm[k] = v; }
    const kbt = u.kb84 ? u.kb84.t || 0 : 0; if (kbt > 0 || st.qkb > 0) knocked = true; st.qkb = kbt;   // the last knock-back tick lands after t reaches 0
    if (ld > 2.5){ const mv = ld - 2.5; st.ax += lx * mv / ld; st.ay += ly * mv / ld; if (mv <= 30) step = Math.min(mv, 8); }
    if (step > 0.05 && st.qnew && !knocked){ st.qdir = r3dDirOf(Math.atan2(ly, lx)); st.qnew = false; st.vx = st.vy = 0; }   // the first move after spawn turns at once
    if (step > 0.05) st.qmT = 6; else st.qmT = Math.max(0, (st.qmT || 0) - el);   // hold 6 ticks, by ticks not calls
    st.qrT = st.qmT > 0 ? 0 : (st.qrT || 0) + el;
    st.qtk = tick; st.qstep = step;
    if (rd > 30 || knocked){ st.vx = st.vy = 0; }   // a big jump, a hit's shove or a knock-back never turns the beast
    else if (st.qmT > 0 && rd > 0.05){   // facing: only while the beast shows a moving clip, from its raw travel
      const c = Math.min(1, 3 / rd); st.vx += rx * c; st.vy += ry * c;   // at most 3 px a call: an undetected shove (Push Back) never turns it alone
      const vd = Math.hypot(st.vx, st.vy), nd = r3dDirOf(Math.atan2(st.vy, st.vx)), far = Math.min((nd - st.qdir + 8) % 8, (st.qdir - nd + 8) % 8) > 1;
      if (nd === st.qdir) st.vx = st.vy = 0;   // the summed travel points along the heading: nothing to turn to (one wobbly step does not clear it)
      else if (vd >= (far ? 6 : 4) - 0.05){ st.qdir = nd; st.vx = st.vy = 0; } }
    if (st.qrT >= 15) st.vx = st.vy = 0;   // drift separated by a 15-tick rest never adds up; back-and-forth jitter cancels in the vector
    if ((u.atkT || 0) > 0){ if (!st.qatk){ st.qatk = true; st.qnew = false; st.vx = st.vy = 0; const left = u.anim ? !!u.anim.left : !!u.left, dl = st.qdir >= 3 && st.qdir <= 5; if (left !== dl) st.qdir = left ? 4 : 0; } }
    else st.qatk = false;   // turn once per strike: u.left flips every tick on the melee overshoot
  }
  const dir = old ? st.dir : st.qdir;
  if (frame === 3 || frame === 4){ const n = (clips && clips.attack && clips.attack.n) || 6; return {clip:'attack', i:Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / 14) * n)), dir}; }
  const moving = old ? st.mv : st.qmT > 0;
  if (moving){ const cl = runner && !(u.slow > 0 || u.hexT > 0) ? 'run' : 'walk', n = (clips && clips[cl] && clips[cl].n) || 8;
    if (old) return {clip:cl, i:Math.floor(tick / (cl === 'run' ? 4 : 6)) % n, dir};
    st.qph += st.qstep / (cl === 'run' ? 4 : 6); return {clip:cl, i:Math.floor(st.qph) % n, dir}; }
  const n = (clips && clips.idle && clips.idle.n) || 4;
  return {clip:'idle', i:Math.floor(tick / 14) % n, dir};
}

/* ------------------------------------------------------------- wolves --- */
{ const f = enemySprite; enemySprite = function(kind){ const spr = f(kind); if (spr && QUAD_KINDS.has(kind)) spr.q3d = kind; return spr; }; }
drawSprite = (function(prev){
  return function(spr, x, y, s, frame, left, flash){
    if (spr && spr.q3d){
      try { r3dPumpTick();
        const [u, tick] = r3dUnitAt(x, y);
        if (u){ const rec = r3qRecipe(spr.q3d), c = r3qChoose(u, frame, tick, true, rec && rec.rig);
          if (r3qDraw(rec, x, y + 7 * s, s, Object.assign(c, {flash, async:true, shadowW:spr.q3d === 'alpha' ? 10 : 8}))) return; }
      } catch (e) { r3dWarnOnce('beast', e); }
    }
    return prev(spr, x, y, s, frame, left, flash);
  };
})(drawSprite);

/* -------------------------------------------------------------- hounds --- */
drawDogs = (function(prev){
  return function(bodies, onScreen){
    const n0 = bodies.length; prev(bodies, onScreen);
    const mine = bodies.splice(n0);
    for (const d of (G.dogs || [])){ if (d.state === 'gone' || !onScreen(d)) continue;
      bodies.push({y:d.y, custom:() => {
        r3dPumpTick();
        const run = d.state === 'flee' || (d.tgt && Math.hypot((d.tgt.o.x || 0) - d.x, (d.tgt.o.y || 0) - d.y) > 60);
        const c = r3qChoose(d, 0, d.t, run);
        if (!r3qDraw(r3qRecipe('hound'), d.x, d.y + 10, 2.4, Object.assign(c, {async:true, light:true, shadowW:7}))){
          figPlaceholder(d.x, d.y + 3, 2.4, {h:9, w:5, horse:true, shadowW:3.8});   /* S6-C note 10: no pixel hound */
        }
      }});
    }
    void mine;
  };
})(drawDogs);

/* ------------------------------------------------------- mounted riders --- */
drawMounted = (function(prev){
  return function(spr, x, y, s, frame, left, flash, moving, seed){
    if (r3dTagged(spr) && G && G.mount){
      try { r3dPumpTick();
        const [u, tick] = r3dUnitAt(x, y), rider = r3dRecipeForSprite(spr);
        if (u && rider){
          const rec = r3qMountRecipe(rider, 'horse:' + G.mount.id), st = r3dDirFor(u), caster = rider.grip === 'staff' || (u.p && ['MAGE', 'WITCH', 'CLERIC'].includes(u.p.spec));
          let c;
          if (frame === 3 || frame === 4){ const clip = frame === 4 ? (caster ? 'cast' : 'shoot') : 'melee', n = R3D_CLIPS.mount[clip].n; c = {clip, i:Math.min(n - 1, Math.floor(Math.max(0, 1 - (u.atkT || 0) / 12) * n))}; }
          else if (st.mv || moving) c = G.chargeT > 0 ? {clip:'run', i:Math.floor(tick / 4) % 8} : {clip:'walk', i:Math.floor(tick / 5) % 8};
          else c = {clip:'idle', i:Math.floor(tick / 14) % 4};
          c.dir = st.dir;
          if (r3qDraw(rec, x, y + 7.4 * s, s, Object.assign(c, {flash, light:true, async:true, shadowW:14}))) return;
        }
      } catch (e) { r3dWarnOnce('mount', e); }
    }
    return prev(spr, x, y, s, frame, left, flash, moving, seed);
  };
})(drawMounted);
function r3qPaddock(k, px, py){
  r3dPumpTick();
  const rec = r3qRecipe('horse:' + k), t = CAMP.t || 0;
  const a = r3qDraw(rec, px - 24, py - 12 + 8 * 2.6, 2.6, {clip:'idle', i:Math.floor(t / 18) % 4, dir:1, async:true, light:true, shadowW:12});
  const b = r3qDraw(rec, px + 22, py - 18 + 8 * 2.6, 2.6, {clip:'idle', i:Math.floor(t / 18 + 2) % 4, dir:4, async:true, light:true, shadowW:12});
  return a && b;
}
function r3qBolt(x){
  try { r3dPumpTick();
    return r3qDraw(r3qRecipe('horse:' + x.k), x.x, x.y + 8 * 2.4, 2.4, {clip:'run', i:Math.floor(G.frame / 4) % 8, dir:r3dDirOf(Math.atan2(x.vy || 0, x.vx || 1)), async:true, alpha:Math.min(1, x.life / 30), shadowW:12}); } catch (e) { return false; }
}
// a mounted squad's walk and idle are queued when the contract starts (called from the startDeployment wrapper below)
function r3dWarmMounts(c){
    try { if (G){ const St = R3D_STYLES[r3dStyleId()];
      for (const k of ['wolf', 'alpha']) if (G.enemies.some(e => e.k === k) || (hostOf().pools[c.tier] || []).includes(k)) for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) r3dFramesAsync(r3qRecipe(k), 'run', d, St, true);
      if (G.mounted && G.mount){
        const units = [G.leader].concat(G.squad || []);
        for (const clip of ['walk', 'idle']) for (const u of units){ const spr = u === G.leader ? personSprite(META.leader, true) : personSprite(u.p, false), rider = r3dRecipeForSprite(spr); if (!rider) continue;
          const rec = r3qMountRecipe(rider, 'horse:' + G.mount.id); for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) r3dFramesAsync(rec, clip, d, St, true); }
      }
      if (G.dogs && G.dogs.length) for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) r3dFramesAsync(r3qRecipe('hound'), 'run', d, St, true);
    } } catch (e) {}
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx56')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx56"><b>3D beasts and horses.</b> Wolves, the Alpha Dire Wolf, the Kennels' hounds and the Chapter's horses are 3D: they walk, gallop, bite or rear, and wolves fall where they die. Riders sit on their horses.</p>`);
  };
}
/* ===== END INDEX 56 ======================================================= */

/* ============================================================================
   INDEX 57 - 3D MONSTERS AND BOSSES: OGRE, WYRM, DEVIL-KNIGHT, CINDERLINGS,
   NESTS AND SIEGE ENGINES
   CAVE OGRE      a hulking, hunched brute (rig 'brute': the humanoid clips
                  with a forward hunch): bare grey-green hide, pot belly, small
                  head with a heavy brow, underbite and tusks, loincloth, bone
                  necklace, fur on one shoulder, and a spiked greatclub.
   DEVIL-KNIGHT   black-crimson plate with ember cracks, a great helm with a
                  burning visor, big ivory horns, folded bat wings, shoulder
                  spikes and a flaming greatsword.
   YOUNG WYRM     a new 'wyrm' rig: the four-legged skeleton with a long neck,
                  a three-part tail, horns, a dorsal ridge of spines and two
                  jointed wings. Idle (breathing, wings settling), walk, run
                  (a wing-beating rush), attack (rears its neck, wings flared,
                  jaws open: the breath and the bite) and death.
   CINDERLINGS    small coal-black imps with glowing cracks, burning hands and
                  a flame for a head. They use the full humanoid clip set.
   NESTS          a mound of twigs and bones with a dark burrow, eyes in the
                  dark and eggs that stir. They shudder when hit and collapse
                  into a smoking heap when destroyed.
   SIEGE ENGINES  a wheeled mangonel: frame, uprights, padded crossbar, rope
                  skein, a cocked arm with a loaded bucket and a pile of shot.
                  It creaks, shakes when hit, and breaks apart when burnt.
   BOSSES READ AS BOSSES
                  Every boss (these, the Alpha Dire Wolf and the human
                  commanders) gets a coloured edge around its silhouette (amber,
                  or fire-orange for the Devil-Knight and acid-green for the
                  Wyrm) and keeps more of its colour than ordinary enemies. On
                  screen: Cave Ogre about 2.3x a normal enemy's height, the
                  Devil-Knight about 2.1x, the Wyrm about 4x the length of a
                  wolf, commanders about 1.6x.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 57.

   3D DESIGN NOTE, ADDENDUM (read with Index 50 to 56)
     SPECIAL RECIPES  R3D_SPECIAL[kind]() builds a recipe for an enemy kind
                      that is not a plain ENEMY_LOOK humanoid. r3dEnemyRecipe
                      checks it first. Tag the sprite e3d in the enemySprite
                      wrapper below (or q3d for four-legged rigs).
     RECIPE EXTRAS    frame:{W,H,FEET,CX}  a bigger canvas (any rig)
                      feetOff               sprite cells from the unit's y to
                                            the ground (default 7; props use 4)
                      halo:'#rrggbb'        boss edge colour
                      shadowW               ground shadow width
                      poseAdd               (rig 'brute') angles added to the
                                            standing and fighting humanoid clips
     NEW RIGS         brute  humanoid bones, humanoid clip names
                      wyrm   quad bones + qTail3, qWL qWL2, qWR qWR2 (wings).
                             Wing rz > 0 lifts the left wing, rz < 0 the right;
                             ry > 0 sweeps the left wing back, ry < 0 the right.
                      prop   bones root, top (nest) or root, arm (engine).
                             Clips idle, hit, death; every other clip name
                             falls back to idle.
     ARMOUR           R3D_ARMOUR.none (bare skin; set zones.top to the skin).
============================================================================ */
R3D_ARMOUR.none = () => [];
for (const z of ['ember', 'flame', 'flame2']){ R3D.EMIT.add(z); R3D_MUTE_SKIP.add(z); }
const BOSS_HALO = {devil:'#ff7a2a', wyrm:'#c8e050'}, HALO_DEFAULT = '#e8b040';
function r3dBossColours(rec, keep){   // mute less than ordinary enemies: keep this much of the original colour
  const orig = Object.assign({}, rec.zones); r3dMute(rec);
  for (const z in rec.zones){ if (!orig[z] || R3D_MUTE_SKIP.has(z) || R3D.EMIT.has(z)) continue;
    const a = hex3(orig[z]), b = hex3(rec.zones[z]); rec.zones[z] = '#' + a.map((v, i) => Math.round(v * keep + b[i] * (1 - keep)).toString(16).padStart(2, '0')).join(''); }
  for (const z in orig) if (R3D.EMIT.has(z) || z === 'eyeglow') rec.zones[z] = orig[z];
  return rec;
}
const BOSS_FRAME = {W:150, H:165, FEET:146, CX:75};

/* ---------------------------------------------------------- weapons --- */
Object.assign(WEAPON3D, {
  greatclub:() => { const out = [{t:'cap', a:[0, 0, -4], p:[0, 0, 22], r:2, z:'clubwood'}, {t:'ell', c:[0, 0, 27], r:[6, 6, 9], z:'clubwood'}, {t:'cap', a:[0, 0, -3], p:[0, 0, 3], r:2.5, z:'leather'}];
    for (const [x, y, z] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0.7, 0.7, 0.5], [-0.7, -0.7, -0.5], [0.7, -0.7, 0.8], [-0.7, 0.7, -0.8]]) out.push({t:'cap', a:[x * 5, y * 5, 27 + z * 4.5], p:[x * 9, y * 9, 27 + z * 6.5], r:0.8, z:'metal'});
    return out; },
  hellblade:() => [{t:'box', c:[0, 0, 17], r:[0.6, 2.3, 14.5], z:'ember'}, {t:'box', c:[0, 0, 17], r:[0.95, 0.9, 14.2], z:'metal'}, {t:'box', c:[0, 0, 32], r:[0.6, 1.4, 1.4], rot:[0.78, 0, 0], z:'ember'},
    {t:'box', c:[0, 0, 2.6], r:[1, 4.6, 1], z:'bone'}, {t:'cap', a:[0, -4.6, 2.6], p:[0, -6, 5], r:0.7, z:'bone'}, {t:'cap', a:[0, 4.6, 2.6], p:[0, 6, 5], r:0.7, z:'bone'}, {t:'cap', a:[0, 0, -4], p:[0, 0, 1.5], r:1, z:'leather'}]
});

/* ------------------------------------------------------------ kits --- */
Object.assign(R3D_KITS, {
  OGRE:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
    P.push({b:'chest', t:'ell', c:[0, 5 * s, 3.8 * w], r:[8.4 * w, 8.4 * s, 6.6 * w], z:'skin'}, {b:'chest', t:'ell', c:[0, 13.5 * s, 2 * w], r:[10.6 * w, 7.4 * s, 6.6 * w], z:'skin'},
           {b:'pelvis', t:'box', c:[0, -6 * s, 5.4 * w], r:[4.6 * w, 6.5 * s, 0.8], rot:[-0.12, 0, 0], z:'cloth'}, {b:'pelvis', t:'box', c:[0, -6 * s, -5.4 * w], r:[4.6 * w, 6 * s, 0.8], rot:[0.12, 0, 0], z:'cloth'},
           {b:'pelvis', t:'box', c:[0, 0.2 * s, 0], r:[8.6 * w, 1.6 * s, 6.4 * w], z:'leather'}, {b:'chest', t:'ell', c:[-9.4 * w, 18.4 * s, 0], r:[6.4 * w, 4.6 * s, 6.4 * w], z:'fur'});
    for (let i = 0; i < 7; i++){ const a = (i - 3) * 0.32; P.push({b:'chest', t:'ell', c:[Math.sin(a) * 7.4 * w, 17.2 * s - Math.cos(a) * 2.2 * s, 5.6 * w * Math.cos(a)], r:[0.9, 1.6, 0.9], rot:[0, 0, a], z:'bone'}); }
    for (const b of ['upL', 'upR']) P.push({b, t:'cap', a:[0, -1, 0], p:[0, -11 * s, 0], r:3.7 * w, z:'skin'});
    for (const b of ['loL', 'loR']) P.push({b, t:'cap', a:[0, -1, 0], p:[0, -9.5 * s, 0], r:3.3 * w, z:'skin'});
    for (const b of ['hdL', 'hdR']) P.push({b, t:'ell', c:[0, -0.4, 0.6], r:[3.4 * w, 3.6, 3.4], z:'skin'});
    P.push({b:'head', t:'ell', c:[0, hy + 2.6 * hk, 4.6 * hk], r:[6 * hk, 1.7, 2.4], z:'skin'}, {b:'head', t:'ell', c:[0, hy - 3.6 * hk, 3.6 * hk], r:[5.2 * hk, 3 * hk, 3.8 * hk], z:'skin'});
    return {helm:null, hair:'hide', main:'greatclub', parts:P}; },
  DEVIL:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
    for (const sx of [1, -1]){
      P.push({b:'head', t:'cap', a:[sx * 5 * hk, hy + 5 * hk, 0], p:[sx * 10.5 * hk, hy + 8.5 * hk, -2], r:2.1, z:'bone'}, {b:'head', t:'cap', a:[sx * 10.5 * hk, hy + 8.5 * hk, -2], p:[sx * 12 * hk, hy + 14.5 * hk, 1], r:1.4, z:'bone'},
             {b:'head', t:'cap', a:[sx * 12 * hk, hy + 14.5 * hk, 1], p:[sx * 11 * hk, hy + 18 * hk, 3.5], r:0.75, z:'bone'});
      P.push({b:sx > 0 ? 'upL' : 'upR', t:'cap', a:[sx * 2, 1.5, -1], p:[sx * 6, 7, -2.5], r:1.2, z:'plate'}, {b:sx > 0 ? 'upL' : 'upR', t:'cap', a:[sx * 0.5, 2, 1.5], p:[sx * 3, 8, 1], r:1, z:'plate'});
      // folded bat wings
      P.push({b:'chest', t:'cap', a:[sx * 4.5 * w, 18 * s, -5.6 * w], p:[sx * 13 * w, 33 * s, -8.5 * w], r:1.3, z:'horn'}, {b:'chest', t:'cap', a:[sx * 13 * w, 33 * s, -8.5 * w], p:[sx * 15.5 * w, 9 * s, -9.5 * w], r:1, z:'horn'},
             {b:'chest', t:'ell', c:[sx * 11 * w, 20 * s, -8.6 * w], r:[5 * w, 12 * s, 0.8], rot:[0, -sx * 0.25, sx * 0.3], z:'membrane'});
    }
    P.push({b:'head', t:'box', c:[0, hy + 0.9 * hk, 7.1 * hk], r:[4.3 * hk, 0.75, 0.45], z:'eyeglow'});
    for (const [b, c, r, rot] of [['chest', [2.2 * w, 12 * s, 7.6 * w], [0.5, 3.6 * s, 0.4], [0, 0, 0.5]], ['chest', [-3 * w, 6 * s, 7 * w], [0.5, 2.6 * s, 0.4], [0, 0, -0.4]],
      ['thL', [0, -5 * s, 3.4 * w], [0.5, 2.6 * s, 0.4], [0, 0, 0.3]], ['shR', [0, -6 * s, 3.4 * w], [0.5, 2.4 * s, 0.4], [0, 0, -0.3]]]) P.push({b, t:'box', c, r, rot, z:'ember'});
    return {helm:'great', hair:'hide', main:'hellblade', parts:P}; }
});

/* --------------------------------------------------------- brute rig --- */
R3D_CLIPS.brute = {};
for (const c of Object.keys(R3D_CLIPS.humanoid)){
  const lie = ['downed', 'death', 'sit', 'play', 'mounted'].includes(c);
  R3D_CLIPS.brute[c] = {n:R3D_CLIPS.humanoid[c].n, fn:(t, rec) => { const p = R3D_CLIPS.humanoid[c].fn(t, rec); if (lie || !rec.poseAdd) return p;
    for (const b in rec.poseAdd){ const a = p[b] || Z3, d = rec.poseAdd[b]; p[b] = [a[0] + d[0], a[1] + d[1], a[2] + d[2]]; } return p; }};
}
R3D.CLIPS_FOR.brute = R3D.CLIPS_FOR.humanoid;

/* ------------------------------------------------- special recipes --- */
const R3D_SPECIAL = {
  ogre:() => {
    const look = Object.assign({}, ENEMY_LOOK.ogre, {cape:null, beard:false, hairStyle:'bald', head:null});
    const rec = r3dBuild54({name:'enemy:ogre', race:'HUMAN', spec:'SOLDIER', sex:'m', id:'E', injuries:[]}, false,
      {kit:'OGRE', look, weight:'none', race3d:{h:1.32, w:1.7, hk:0.82, tusks:true, ears:'small', nose:'big'}});
    Object.assign(rec.zones, {clubwood:'#8a6a44', top:look.skin, skin:look.skin, cloth:'#5a4630', legs:'#4e3c28', fur:'#6a5a44', bone:'#ddd4be', eye:'#f0c040', leather:'#4a301c'});
    for (const q of rec.parts) if (q.z === 'eye') q.z = 'eyeglow'; rec.zones.eyeglow = '#f0c040';
    rec.rig = 'brute'; rec.poseAdd = {chest:[0.3, 0, 0], head:[-0.34, 0, 0], upL:[0, 0, 0.14], upR:[0, 0, -0.14]};
    r3dBossColours(rec, 0.7);
    return Object.assign(rec, {frame:BOSS_FRAME, halo:HALO_DEFAULT, shadowW:14});
  },
  devil:() => {
    const look = Object.assign({}, ENEMY_LOOK.devil, {cape:null, head:null, hairStyle:'bald', beard:false});
    const rec = r3dBuild54({name:'enemy:devil', race:'HUMAN', spec:'SOLDIER', sex:'m', id:'E', injuries:[]}, false,
      {kit:'DEVIL', look, weight:'heavy', material:'plate', race3d:{h:1.18, w:1.28, hk:0.95}});
    Object.assign(rec.zones, {plate:'#4a2430', mail:'#2a1418', helm:'#3a2026', trim:'#7a1a1a', bone:'#d8c8a8', horn:'#2a1a1e', membrane:'#5a1a24', ember:'#ff7a2a', eyeglow:'#ffb040',
      metal:'#3a3438', top:'#2a1418', legs:'#2a1418', boots:'#1e1012', leather:'#2a1a14', skin:'#5a2436'});
    r3dBossColours(rec, 0.75);
    return Object.assign(rec, {frame:BOSS_FRAME, halo:BOSS_HALO.devil, shadowW:13});
  },
  cinder:() => {
    const sk = r3dSkeleton({h:0.62, w:1.05, hk:1.3}, false), D = sk.dims, s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
    const add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    add('pelvis', [{t:'ell', c:[0, 0, 0], r:[6 * w, 4.6 * s, 5 * w], z:'coal'}]);
    add('chest', [{t:'ell', c:[0, 9 * s, 0.4], r:[7.2 * w, 10 * s, 5.8 * w], z:'coal'}, {t:'ell', c:[0, 7 * s, 4.4 * w], r:[3.2 * w, 3.4 * s, 1.6 * w], z:'ember'},
      {t:'box', c:[2 * w, 12 * s, 5.2 * w], r:[0.6, 4 * s, 0.5], rot:[0, 0, 0.45], z:'ember'}, {t:'box', c:[-2.6 * w, 13 * s, 5 * w], r:[0.6, 3.4 * s, 0.5], rot:[0, 0, -0.5], z:'ember'},
      {t:'box', c:[0, 12 * s, -5.4 * w], r:[0.6, 5 * s, 0.5], rot:[0, 0, 0.2], z:'ember'}]);
    for (const [u, l, h] of [['upL', 'loL', 'hdL'], ['upR', 'loR', 'hdR']]){ add(u, [{t:'cap', a:[0, 0, 0], p:[0, -11 * s, 0], r:2.4 * w, z:'coal'}]); add(l, [{t:'cap', a:[0, 0, 0], p:[0, -10 * s, 0], r:2.1 * w, z:'coal'}]);
      add(h, [{t:'ell', c:[0, 0, 0.6], r:[2.4 * w, 2.6, 2.4], z:'ember'}, {t:'cap', a:[0, -1, 1.5], p:[0, -2, 4.5], r:0.6, z:'flame2'}]); }
    for (const [t, sh] of [['thL', 'shL'], ['thR', 'shR']]){ add(t, [{t:'cap', a:[0, 0, 0], p:[0, -15 * s, 0], r:2.6 * w, z:'coal'}]);
      add(sh, [{t:'cap', a:[0, 0, 0], p:[0, -13.5 * s, 0.2], r:2.2 * w, z:'coal'}, {t:'ell', c:[0, -14.5 * s, 1.4], r:[2.6 * w, 2.2 * s, 3.6 * s], z:'coal'}]); }
    add('head', [{t:'ell', c:[0, hy, 0], r:[5.4 * hk, 5.6 * hk, 5.4 * hk], z:'coal'}, {t:'ell', c:[2.1 * hk, hy + 0.6 * hk, 4.8 * hk], r:[1.3, 1.5, 0.8], z:'eyeglow'},
      {t:'ell', c:[-2.1 * hk, hy + 0.6 * hk, 4.8 * hk], r:[1.3, 1.5, 0.8], z:'eyeglow'}, {t:'box', c:[0, hy - 2.4 * hk, 5 * hk], r:[2.2 * hk, 0.6, 0.6], z:'ember'},
      {t:'ell', c:[0, hy + 5.6 * hk, -0.8], r:[4.8 * hk, 5.6 * hk, 4.4 * hk], z:'flame'}, {t:'ell', c:[0.6, hy + 9.4 * hk, -1.8], r:[3.1 * hk, 5 * hk, 2.8 * hk], z:'flame2'},
      {t:'ell', c:[-1, hy + 13.4 * hk, -2.8], r:[1.5 * hk, 3.2 * hk, 1.4 * hk], z:'flame2'}, {t:'ell', c:[2.6 * hk, hy + 10 * hk, -3], r:[1.2 * hk, 2.6 * hk, 1.2 * hk], z:'flame'}]);
    const rec = {rig:'humanoid', skel:{order:sk.order, bones:sk.bones}, parts:P, grip:'swing',
      zones:{coal:'#3a2420', ember:'#ff7a2a', flame:'#ff9a30', flame2:'#ffd860', eyeglow:'#fff0a0', cape:'#3a2420', capeTrim:'#3a2420'}};
    return rec;
  },
  nest:() => {
    const r = rng(41), P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    add('root', [{t:'ell', c:[0, 6, 0], r:[30, 9, 24], z:'twigD'}, {t:'ell', c:[0, 14, -2], r:[23, 10, 18], z:'twig'}, {t:'ell', c:[0, 22, -4], r:[14, 6, 11], z:'twigL'},
      {t:'ell', c:[0, 11, 17.5], r:[8.5, 7.5, 4], z:'hole'}, {t:'ell', c:[3.2, 12.5, 20.6], r:[1.3, 1.3, 0.6], z:'eyeglow'}, {t:'ell', c:[-3.2, 12.5, 20.6], r:[1.3, 1.3, 0.6], z:'eyeglow'}]);
    for (let i = 0; i < 16; i++){ const a = r() * TAU, rad = 16 + r() * 10, y = 6 + r() * 14, x = Math.cos(a) * rad, z = Math.sin(a) * rad * 0.8;
      add('root', [{t:'cap', a:[x, y, z], p:[x * 1.35 + (r() - 0.5) * 8, y + 4 + r() * 8, z * 1.3], r:0.8, z:i % 3 ? 'twigL' : 'twigD'}]); }
    for (let i = 0; i < 5; i++){ const a = r() * TAU, x = Math.cos(a) * (30 + r() * 8), z = Math.sin(a) * (24 + r() * 6);
      add('root', [{t:'cap', a:[x, 1.2, z], p:[x + (r() - 0.5) * 9, 1.2, z + (r() - 0.5) * 9], r:1, z:'bone'}, {t:'ell', c:[x, 1.4, z], r:[1.6, 1.4, 1.6], z:'bone'}]); }
    add('top', [{t:'ell', c:[0, 2.5, 0], r:[4.2, 5, 4.2], z:'egg'}, {t:'ell', c:[5, 1.8, 2], r:[3.4, 4.2, 3.4], rot:[0, 0, -0.3], z:'egg'}, {t:'ell', c:[-4.6, 1.6, -1], r:[3.2, 4, 3.2], rot:[0, 0, 0.35], z:'egg'}]);
    return {rig:'prop', skel:{order:['root', 'top'], bones:{root:{parent:null, off:[0, 0, 0]}, top:{parent:'root', off:[0, 26, -4]}}}, parts:P,
      zones:{twigD:'#3a2e22', twig:'#5a4a36', twigL:'#7a6a4e', hole:'#120c08', eyeglow:'#e04030', bone:'#ddd4be', egg:'#c8c0a0'}, feetOff:4, shadowW:16, frame:{W:140, H:110, FEET:92, CX:70}};
  },
  engine:() => {
    const P = [], add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
    add('root', [{t:'box', c:[12, 4.5, 0], r:[1.9, 1.9, 26], z:'wood'}, {t:'box', c:[-12, 4.5, 0], r:[1.9, 1.9, 26], z:'wood'},
      {t:'box', c:[0, 4.5, 20], r:[13.5, 1.7, 1.7], z:'woodD'}, {t:'box', c:[0, 4.5, -20], r:[13.5, 1.7, 1.7], z:'woodD'}, {t:'box', c:[0, 4.5, -6], r:[13.5, 1.5, 1.5], z:'woodD'}]);
    for (const [x, z] of [[15, 18], [-15, 18], [15, -18], [-15, -18]]) add('root', [{t:'ell', c:[x, 5.5, z], r:[1.3, 5.5, 5.5], z:'woodD'}, {t:'ell', c:[x + Math.sign(x) * 1.2, 5.5, z], r:[0.6, 1.5, 1.5], z:'metal'}]);
    for (const x of [9, -9]) add('root', [{t:'box', c:[x, 17, 5], r:[1.7, 13, 1.7], z:'wood'}, {t:'box', c:[x, 9, 5], r:[1.9, 0.6, 1.9], z:'metal'}, {t:'box', c:[x, 22, 5], r:[1.9, 0.6, 1.9], z:'metal'},
      {t:'cap', a:[x, 6, 14], p:[x, 26, 6], r:1, z:'woodD'}]);
    add('root', [{t:'box', c:[0, 29, 5], r:[11, 1.9, 1.9], z:'woodD'}, {t:'ell', c:[0, 29, 3.2], r:[5, 2.6, 1.4], z:'leather'}, {t:'ell', c:[0, 6, -6], r:[8.4, 2.6, 2.6], z:'rope'},
      {t:'ell', c:[18, 2.4, -12], r:[3, 2.6, 3], z:'stone'}, {t:'ell', c:[21, 2.2, -8], r:[2.6, 2.3, 2.6], z:'stone'}, {t:'ell', c:[19.5, 5.4, -10], r:[2.4, 2.2, 2.4], z:'stone'}]);
    add('arm', [{t:'box', c:[0, 14, 0], r:[1.5, 15, 1.5], z:'wood'}, {t:'box', c:[0, 2, 0], r:[1.8, 2, 1.8], z:'metal'}, {t:'ell', c:[0, 29.5, 0], r:[4.4, 2.2, 4.4], z:'leather'}, {t:'ell', c:[0, 31.5, 0], r:[3.1, 3.1, 3.1], z:'stone'}]);
    return {rig:'prop', skel:{order:['root', 'arm'], bones:{root:{parent:null, off:[0, 0, 0]}, arm:{parent:'root', off:[0, 6, -6]}}}, parts:P,
      zones:{wood:'#8a5a2b', woodD:'#5a3a1c', metal:'#7a7f86', leather:'#5a3a22', rope:'#a8946c', stone:'#8a8680'}, feetOff:4, shadowW:16, frame:{W:150, H:130, FEET:108, CX:75}};
  }
};
// props are built at a convenient size and scaled to match the pixel sprites they replace
function r3dScaleRec(rec, k){
  const v = a => a.map(x => x * k);
  for (const q of rec.parts){ if (q.c) q.c = v(q.c); if (q.a) q.a = v(q.a); if (q.p) q.p = v(q.p); q.r = Array.isArray(q.r) ? v(q.r) : q.r * k; if (q.r2 !== undefined) q.r2 *= k; if (q.R !== undefined) q.R *= k; if (q.Rz !== undefined) q.Rz *= k; }   /* Index 98 */
  for (const b in rec.skel.bones) rec.skel.bones[b].off = v(rec.skel.bones[b].off);
  return rec;
}
for (const [k, f] of [['nest', 1.2], ['engine', 1.4]]){ const b = R3D_SPECIAL[k]; R3D_SPECIAL[k] = () => { const r = r3dScaleRec(b(), f); r.frame = {W:Math.round(r.frame.W * f), H:Math.round(r.frame.H * f), FEET:Math.round(r.frame.FEET * f), CX:Math.round(r.frame.CX * f)}; return r; }; }
// the prop rig
R3D_CLIPS.prop = {
  idle:{n:4, fn:(t, rec) => { const b = Math.sin(t * Math.PI * 2);
    return rec.skel.bones.arm ? {bob:0, root:Z3, arm:[-1.18 + 0.02 * b, 0, 0]} : {bob:0.25 * b, root:Z3, top:[0.05 * b, 0, 0.06 * Math.cos(t * Math.PI * 2)]}; }},
  hit:{n:3, fn:(t, rec) => { const k = [1, 0.5, 0.15][Math.min(2, Math.round(t * 3))];
    return rec.skel.bones.arm ? {bob:-0.5 * k, root:[0, 0, 0.05 * k], arm:[-1.18 + 0.12 * k, 0, 0.05 * k]} : {bob:-1.2 * k, root:[0, 0, 0.04 * k], top:[0.25 * k, 0, -0.15 * k]}; }},
  death:{n:6, fn:(t, rec) => { const k = r3dEase(Math.min(1, t * 1.25));
    return rec.skel.bones.arm ? {bob:-4 * k, root:[0.06 * k, 0, 0.42 * k], arm:[-1.18 + 1.6 * k, 0.4 * k, 0.5 * k]} : {bob:-14 * k, root:[0.05 * k, 0, 0.12 * k], top:[0.9 * k, 0, 0.5 * k]}; }}
};
for (const c of ['walk', 'run', 'melee', 'shoot', 'cast', 'downed', 'sit', 'play', 'mounted']) R3D_CLIPS.prop[c] = R3D_CLIPS.prop.idle;

/* ---------------------------------------------------------- the wyrm --- */
function r3wBuild(){
  const Q = {hh:20, sh:22, L:42, bw:9.5, bh:9.5, neck:19, neckR:4.6, neckRx:0.9, headL:18, headR:6, tail:36, legU:3.4, legL:2.6};
  const S = r3qSkel(Q), Lw = 30, w = Q.bw, h = Q.bh, hr = Q.headR, hl = Q.headL, P = [];
  Object.assign(S.bones, {qTail3:{parent:'qTail2', off:[0, 0, -Q.tail * 0.45]},
    qWL:{parent:'qWith', off:[w * 0.6, h * 0.55, -2]}, qWL2:{parent:'qWL', off:[Lw, 1, -5]}, qWR:{parent:'qWith', off:[-w * 0.6, h * 0.55, -2]}, qWR2:{parent:'qWR', off:[-Lw, 1, -5]}});
  S.order.push('qTail3', 'qWL', 'qWL2', 'qWR', 'qWR2');
  const add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  add('qHips', [{t:'ell', c:[0, 0, Q.L * 0.12], r:[w, h * 0.95, Q.L * 0.36], z:'scale'}]);
  add('qSpine', [{t:'ell', c:[0, -h * 0.05, 0], r:[w * 0.98, h * 0.95, Q.L * 0.44], z:'scale'}, {t:'ell', c:[0, -h * 0.62, 0], r:[w * 0.74, h * 0.42, Q.L * 0.4], z:'belly'}]);
  add('qWith', [{t:'ell', c:[0, -h * 0.4, -1.5], r:[w * 1.05, h * 1.05, Q.L * 0.28], z:'scale'}, {t:'ell', c:[0, -h * 0.9, 1], r:[w * 0.7, h * 0.5, Q.L * 0.2], z:'belly'}]);
  for (const [b, zs] of [['qHips', [-6, 4]], ['qSpine', [-10, -2, 6, 13]], ['qWith', [-6, 1]]]) for (const z of zs) add(b, [{t:'cap', a:[0, h * 0.85, z], p:[0, h * 0.85 + 3.4, z - 2.2], r:0.95, z:'spine'}]);
  add('qNeck', [{t:'cap', a:[0, -1, 0], p:[0, Q.neck, 0], r:Q.neckR, z:'scale'}, {t:'cap', a:[0, 0, Q.neckR * 0.55], p:[0, Q.neck - 1, Q.neckR * 0.55], r:Q.neckR * 0.62, z:'belly'}]);
  for (const y of [4, 9, 14]) add('qNeck', [{t:'cap', a:[0, y, -Q.neckR * 0.8], p:[0, y + 1.4, -Q.neckR * 0.8 - 2.6], r:0.8, z:'spine'}]);
  add('qHead', [{t:'ell', c:[0, 0, hl * 0.15], r:[hr, hr * 0.85, hr * 1.15], z:'scale'}, {t:'ell', c:[0, -hr * 0.15, hl * 0.62], r:[hr * 0.62, hr * 0.5, hl * 0.45], z:'scale'},
    {t:'ell', c:[0, hr * 0.15, hl * 0.95], r:[hr * 0.36, hr * 0.26, hr * 0.3], z:'dark'}]);
  for (const sx of [1, -1]) add('qHead', [{t:'ell', c:[sx * hr * 0.62, hr * 0.32, hl * 0.32], r:[0.9, 0.9, 0.8], z:'eyeglow'}, {t:'ell', c:[sx * hr * 0.55, hr * 0.62, hl * 0.32], r:[1.4, 0.7, 2.4], z:'spine'},
    {t:'cap', a:[sx * hr * 0.5, hr * 0.6, -hr * 0.3], p:[sx * hr * 0.95, hr * 1.4, -hr * 1.6], r:1.2, z:'horn'}, {t:'cap', a:[sx * hr * 0.95, hr * 1.4, -hr * 1.6], p:[sx * hr * 0.7, hr * 1.7, -hr * 2.8], r:0.75, z:'horn'}]);
  add('qJaw', [{t:'ell', c:[0, 0, hl * 0.42], r:[hr * 0.52, hr * 0.24, hl * 0.4], z:'belly'}]);
  for (const sx of [1, -1]) for (const z of [0.55, 0.75]) add('qJaw', [{t:'box', c:[sx * hr * 0.38, hr * 0.28, hl * z], r:[0.35, 0.8, 0.35], z:'bone'}]);
  [['qFLu', 'qFLl', 'qFLp', S.fU, S.fL, 0], ['qFRu', 'qFRl', 'qFRp', S.fU, S.fL, 0], ['qBLu', 'qBLl', 'qBLp', S.bU, S.bL, 1], ['qBRu', 'qBRl', 'qBRp', S.bU, S.bL, 1]].forEach(([u, l, p, U, Lo, hind]) => {
    add(u, [{t:'cap', a:[0, 0, 0], p:[0, -U + (hind ? 0 : h * 0.35), 0], r:Q.legU * (hind ? 1.35 : 1.05), z:'scale'}]);
    add(l, [{t:'cap', a:[0, 0, 0], p:[0, -Lo, 0], r:Q.legL, z:'scale'}]);
    add(p, [{t:'ell', c:[0, 0.4, 1.2], r:[Q.legL * 1.25, Q.legL * 0.8, Q.legL * 1.6], z:'scale'}]);
    for (const x of [-1.4, 0, 1.4]) add(p, [{t:'cap', a:[x, 0.2, 2.6], p:[x * 1.2, -0.4, 5], r:0.45, z:'horn'}]);
  });
  add('qTail', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.5], r:3.6, z:'scale'}]);
  add('qTail2', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.45], r:2.5, z:'scale'}]);
  add('qTail3', [{t:'cap', a:[0, 0, 0], p:[0, 0, -Q.tail * 0.38], r:1.5, z:'scale'}, {t:'ell', c:[0, 0, -Q.tail * 0.42], r:[3.4, 0.7, 2.8], z:'membrane'}]);
  for (const [b, zs] of [['qTail', [-4, -11]], ['qTail2', [-3, -9]], ['qTail3', [-3]]]) for (const z of zs) add(b, [{t:'cap', a:[0, 2.2, z], p:[0, 4.6, z - 2], r:0.7, z:'spine'}]);
  for (const sx of [1, -1]){
    const W1 = sx > 0 ? 'qWL' : 'qWR', W2 = sx > 0 ? 'qWL2' : 'qWR2';
    add(W1, [{t:'cap', a:[0, 0, 0], p:[sx * Lw, 1, -5], r:1.4, z:'scale'}, {t:'ell', c:[sx * Lw * 0.45, -0.5, -Lw * 0.42], r:[Lw * 0.55, 0.55, Lw * 0.45], rot:[0, -sx * 0.15, 0], z:'membrane'}]);
    add(W2, [{t:'cap', a:[0, 0, 0], p:[sx * Lw * 0.75, -2, -Lw * 0.55], r:0.95, z:'scale'}, {t:'cap', a:[0, 0, 0], p:[sx * Lw * 0.25, -2, -Lw * 0.85], r:0.8, z:'scale'},
      {t:'ell', c:[sx * Lw * 0.36, -1, -Lw * 0.45], r:[Lw * 0.45, 0.5, Lw * 0.42], z:'membrane'}, {t:'cap', a:[0, 0, 0], p:[sx * 2, 2.5, 1.5], r:0.6, z:'horn'}]);
  }
  const rec = {rig:'wyrm', skel:{order:S.order, bones:S.bones}, parts:P, Q, frame:{W:250, H:190, FEET:150, CX:125}, halo:BOSS_HALO.wyrm, shadowW:22,
    zones:{scale:'#3a6a4a', belly:'#c8b878', spine:'#24442e', dark:'#141010', membrane:'#6a2a3a', horn:'#d8cfb4', bone:'#ece4cf', eyeglow:'#ffd040'},
    qrest:{qNeck:[Q.neckRx, 0, 0], qHead:[-Q.neckRx + 0.15, 0, 0], qTail:[-0.22, 0, 0], qTail2:[-0.12, 0, 0], qTail3:[0.08, 0, 0],
      qBLu:[-0.12, 0, 0], qBLl:[0.32, 0, 0], qBLp:[-0.2, 0, 0], qBRu:[-0.12, 0, 0], qBRl:[0.32, 0, 0], qBRp:[-0.2, 0, 0], qFLl:[0.02, 0, 0], qFRl:[0.02, 0, 0],
      qWL:[0, 0.6, 0.3], qWL2:[0, 0.45, -0.35], qWR:[0, -0.6, -0.3], qWR2:[0, -0.45, 0.35]}};
  r3dBossColours(rec, 0.72);
  rec.key = 'r3w' + hash(JSON.stringify(rec));
  return rec;
}
const wingAdd = (p, L1, L2) => { const add = (b, d) => { const a = p[b] || Z3; p[b] = [a[0] + d[0], a[1] + d[1], a[2] + d[2]]; };
  add('qWL', L1); add('qWR', [L1[0], -L1[1], -L1[2]]); add('qWL2', L2); add('qWR2', [L2[0], -L2[1], -L2[2]]); return p; };
R3D_CLIPS.wyrm = {
  idle:{n:4, fn:(t, rec) => { const b = Math.sin(t * Math.PI * 2); return wingAdd(R3D_CLIPS.quad.idle.fn(t, rec), [0, 0, 0.06 * b], [0, 0, -0.04 * b]); }},
  walk:{n:8, fn:(t, rec) => { const b = Math.sin(t * Math.PI * 4); return wingAdd(R3D_CLIPS.quad.walk.fn(t, rec), [0, 0, 0.05 * b], [0, 0, 0.04 * b]); }},
  run:{n:8, fn:(t, rec) => { const T = t * Math.PI * 2, f = Math.sin(T * 2);
    const p = R3D_CLIPS.quad.walk.fn(t, rec); p.qNeck[0] -= 0.12; return wingAdd(p, [0, -0.25, 0.55 + 0.45 * f], [0, -0.35, 0.5 + 0.35 * Math.sin(T * 2 - 0.8)]); }},
  attack:{n:6, fn:(t, rec) => { const k = Math.sin(Math.min(1, t * 1.4) * Math.PI);
    const p = R3D_CLIPS.quad.attack.fn(t, rec); p.qJaw = [0.85 * k, 0, 0]; p.qNeck = [p.qNeck[0] - 0.35 * k, 0, 0]; p.qHead = [p.qHead[0] + 0.25 * k, 0, 0];
    return wingAdd(p, [0, -0.55 * k, 0.75 * k], [0, -0.45 * k, 0.75 * k]); }},
  death:{n:6, fn:(t, rec) => wingAdd(R3D_CLIPS.quad.death.fn(t, rec), [0, 0, -0.6 * t], [0, 0.3 * t, -0.4 * t])}
};
R3QR.wyrm = r3wBuild();
QUAD_KINDS.add('wyrm');

/* ------------------------------------------------- hooks and drawing --- */
{ const f = r3dEnemyRecipe;
  r3dEnemyRecipe = function(kind){
    const key = 's:' + kind;
    if (R3D_SPECIAL[kind]){ if (R3DR[key]) return R3DR[key]; const rec = R3D_SPECIAL[kind](); if (!rec.halo && BESTIARY[kind] && BESTIARY[kind].boss) rec.halo = HALO_DEFAULT;
      rec.key = 'r3s' + hash(JSON.stringify(rec)); return R3DR[key] = rec; }
    const rec = f(kind);
    if (BESTIARY[kind] && BESTIARY[kind].boss && !rec.halo){ rec.halo = BOSS_HALO[kind] || HALO_DEFAULT; }
    return rec;
  };
}
{ const f = enemySprite; enemySprite = function(kind){ const spr = f(kind); if (spr && (kind === 'cinder' || kind === 'nest' || kind === 'engine')) spr.e3d = kind; return spr; }; }
// boss edges: a coloured line round the silhouette, painted once into each cached frame
const R3DH = new WeakSet();
function r3dHalo(fr, halo){   // r3dFrames calls it
  if (!R3DH.has(fr)){
    R3DH.add(fr); const [hr, hg, hb] = hex3(halo);
    for (const c of fr){
      const g = c.getContext('2d', {willReadFrequently:true}), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), a = im.data, src = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) src[i] = a[i * 4 + 3] > 0 ? 1 : 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ const i = y * W + x; if (src[i]) continue;
        if ((x > 0 && src[i - 1]) || (x < W - 1 && src[i + 1]) || (y > 0 && src[i - W]) || (y < H - 1 && src[i + W])){ a[i * 4] = hr; a[i * 4 + 1] = hg; a[i * 4 + 2] = hb; a[i * 4 + 3] = 225; } }
      g.putImageData(im, 0, 0);
    }
  }
  return fr;
}
// nests and engines leave a wreck (their deaths are in r3dCorpse)
{ const f = killEnemy;
  killEnemy = function(e){
    const was = e.dead; f(e); if (was || !G) return;
    try { r3dCorpseDir(e); } catch (x) {}   // the corpse turns the way the enemy faced
    if (BESTIARY[e.k] && BESTIARY[e.k].arch === 'fixed') G.fx.push({corpse:true, k:e.k, x:e.x, y:e.y, left:e.left, life:420, dir:e._r3d ? e._r3d.dir : 2, born:G.frame});
  };
}
// queue the host's troops, a mounted squad, the wyrm and the special kinds when a contract starts (one layer, INT-1 group 9)
{ const f = startDeployment;
  startDeployment = function(c, ids){
    const r = f(c, ids);
    r3dWarmHost(c); r3dWarmMounts(c);
    try { if (G){ const St = R3D_STYLES[r3dStyleId()], H = hostOf(), kinds = new Set(G.enemies.map(e => e.k).concat(H.bosses[c.tier] || []));
      if (kinds.has('wyrm')) for (const clip of ['idle', 'walk']) for (let d = 0; d < 8; d++) r3dFramesAsync(R3QR.wyrm, clip, d, St, true);
      for (const k of kinds) if (R3D_SPECIAL[k]) for (const clip of ['idle', 'walk']) for (let d = 0; d < 8; d++) r3dFramesAsync(r3dEnemyRecipe(k), clip, d, St, true);
    } } catch (e) {}
    return r;
  };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx57')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx57"><b>3D monsters.</b> The Cave Ogre, the Devil-Knight, the Young Wyrm, Cinderlings, nests and siege engines are 3D. Bosses stand much larger than their troops and are edged in colour so you can find them in a crowd.</p>`);
  };
}
/* ===== END INDEX 57 ======================================================= */

