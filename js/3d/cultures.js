/* js/3d/cultures.js (INT-1 step 2, 2026-11-16): INDEX 58 to 60 (3D race cultures, sweep).
   Cut unchanged from the inline script in index.html (old lines 20981 to 21282). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 58 - 3D RACE CULTURES, BATCH 1: HUMAN, SUN ELF, GREY ELF, DARK ELF,
   ORC, GOBLIN, HOBGOBLIN, DWARF (MALE AND FEMALE)
   Each race now dresses and looks like its portraits, on top of whatever
   armour and kit its specialty wears:
     Human      the baseline: varied skin, plain practical dress
     Sun Elf    honey-gold skin, golden hair and eyes, a gold filigree circlet
                (when bare-headed) and a gold collar; cream and gold cloth
     Grey Elf   ash-grey skin, silver hair tied back (bun or tail), a tall stiff
                silver-trimmed collar, clean slate and charcoal cloth
     Dark Elf   charcoal skin, white hair in thick braids, a white fur mantle
                over the shoulders, fur cuffs at wrists and boots
     Orc        skin from flesh tones to green (PD-31), tusks, steppe clan dress: a blue deel coat with
                a gold-trimmed front and a red sash, a fur-rimmed felt hat (when
                bare-headed), a bone necklace, topknot or braids
     Goblin     olive skin, big ears and nose, big bright eyes, an oversized
                floppy hat with a feather (when bare-headed), a mustard scarf
                and a patched jacket: crafty and charming, not evil
     Hobgoblin  cat-like: tawny fur with dark stripes, cat ears and muzzle,
                whiskers, amber slit eyes and a striped tail
     Dwarf      ruddy, blocky, big nose, square jaw and heavy brow; men's beards
                ringed with iron; women have no beard, coiled braids with iron
                rings and a rune tattoo on the cheek
   Headgear from armour or kit always wins: hats and circlets only appear on
   bare heads. Armour colours still come from the Quartermaster; the culture
   colours the underclothes, trims and extras (and the whole outfit on
   townsfolk). Enemies and bosses are unaffected.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 58.

   3D DESIGN NOTE, ADDENDUM
     RACE_CULTURE[race] = {look(look, fem) -> tweak the pixel look before the
     head is built (hair colour, hairStyle, beard), zones(fem) -> colour
     overrides, plainCloth -> outfit colour for townsfolk, parts(D, x) ->
     extra parts, where x = {fem, bare (no headgear), weight, spec}}.
     Extra parts use their own zones (cult1, cult2, cfur, silver, sash, deel,
     stripe, whisker, iron, rune, eyew, patch, scarf, gobhat, feather).
     Prompt 5 (Gnome, Halfling, Half-Elf, Half-Orc, Firbolg, Cambion,
     Nephilim, Zuhri) adds entries to the same table.
============================================================================ */
const RACE_CULTURE = {
  HUMAN:{look:() => {}, zones:() => ({}), parts:() => []},
  SUN_ELF:{
    look:(L, fem) => { L.hair = '#f4e4a8'; L.skin = '#d4a066'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'long' : (L.hairStyle === 'short' ? 'long' : L.hairStyle); },
    zones:() => ({eye:'#b08420', cult1:'#d4af37', cult2:'#e8dcc0', orb:'#f0d070'}), plainCloth:'#d8ccaa',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [{b:'chest', t:'ell', c:[0, 18.8 * s, 0.4], r:[5.6 * w, 1.1 * s, 5 * w], z:'cult1'}];
      if (x.bare) P.push({b:'head', t:'ell', c:[0, hy + 2.6 * hk, 0], r:[6.5 * hk, 0.6, 6.5 * hk], z:'cult1'}, {b:'head', t:'ell', c:[0, hy + 3.2 * hk, 6.3 * hk], r:[1, 1.2, 0.6], z:'orb'},
        {b:'head', t:'ell', c:[0, hy + 4 * hk, 6.1 * hk], r:[2.2, 0.5, 0.4], z:'cult1'});
      P.push({b:'pelvis', t:'box', c:[0, -0.2 * D.s, 6.3 * w], r:[1.3, 1.3, 0.5], z:'cult1'});
      return P; }},
  GREY_ELF:{
    look:(L, fem) => { L.hair = '#c8c8d0'; L.skin = '#c4c2bc'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'bun' : 'ponytail'; },
    zones:() => ({legs:'#3e424a', boots:'#26262c', top:'#55606e', silver:'#c8ccd4', cult1:'#4a5260', eye:'#4a5a6a'}), plainCloth:'#5a6472',
    parts:(D, x) => { const s = D.s, w = D.w;
      return [{b:'chest', t:'ell', c:[0, 19.2 * s, -0.6], r:[5.2 * w, 2.6 * s, 4.8 * w], z:'cult1'}, {b:'chest', t:'ell', c:[0, 20.6 * s, -0.8], r:[5.3 * w, 0.5, 4.9 * w], z:'silver'},
        {b:'chest', t:'box', c:[0, 11 * s, 6.4 * w], r:[0.4, 7 * s, 0.4], z:'silver'}]; }},
  DARK_ELF:{
    look:(L, fem) => { L.hair = '#ececf4'; L.skin = '#4e4a5e'; if (L.hairStyle !== 'bald') L.hairStyle = 'braids'; },
    zones:() => ({cfur:'#d8d4cc', cult1:'#3a3a48', eye:'#a8c8e8', legs:'#2e2e38', boots:'#26242a'}), plainCloth:'#3e3e4c',
    parts:(D, x) => { const s = D.s, w = D.w, P = [{b:'chest', t:'ell', c:[0, 17.6 * s, -0.8], r:[11.4 * w, 3.6 * s, 7.6 * w], z:'cfur'}, {b:'chest', t:'ell', c:[0, 15.6 * s, 4.6 * w], r:[6.6 * w, 2.6 * s, 2.8 * w], z:'cfur'}];
      for (const b of ['loL', 'loR']) P.push({b, t:'ell', c:[0, -9.4 * s, 0], r:[3.2 * w, 1.8 * s, 3.2 * w], z:'cfur'});
      for (const b of ['shL', 'shR']) P.push({b, t:'ell', c:[0, -10.4 * s, 0.4], r:[3.6 * w, 2.4 * s, 3.8 * w], z:'cfur'});
      return P; }},
  ORC:{
    look:(L, fem) => { L.hair = '#14140e'; L.skin = ['#a88660', '#8f8a52', '#74903f', '#5e8a3a'][hash(String(L.skin) + fem) % 4]; /* PD-31: flesh to green */ if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'braids' : 'topknot'; },
    zones:() => ({deel:'#34507a', cult1:'#c9a440', sash:'#9a2a24', bone:'#e0d6bc', cfur:'#6a5038', gobhat:'#5a3424', eye:'#2a1a0e'}), plainCloth:'#34507a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      if (x.weight !== 'heavy' && !x.robe) P.push({b:'pelvis', t:'ell', c:[0, -9 * s, 0.4], r:[9.6 * w, 11 * s, 7.2 * w], z:'deel'}, {b:'chest', t:'box', c:[2.4 * w, 10 * s, 6.3 * w], r:[0.6, 8.4 * s, 0.5], rot:[0, 0, 0.32], z:'cult1'});
      P.push({b:'pelvis', t:'box', c:[0, 0.6 * s, 0], r:[8.9 * w, 1.6 * s, 6.6 * w], z:'sash'}, {b:'pelvis', t:'box', c:[-6 * w, -3 * s, 5 * w], r:[1.2, 3.4 * s, 0.6], z:'sash'});
      for (let i = 0; i < 5; i++){ const a = (i - 2) * 0.34; P.push({b:'chest', t:'ell', c:[Math.sin(a) * 5.6 * w, 17.2 * s - Math.cos(a) * 1.4 * s, 5 * w * Math.cos(a)], r:[0.6, 1.3, 0.6], rot:[0, 0, a], z:'bone'}); }
      if (x.bare) P.push({b:'head', t:'ell', c:[0, hy + 3.4 * hk, -0.6], r:[7 * hk, 1.8 * hk, 7 * hk], z:'cfur'}, {b:'head', t:'ell', c:[0, hy + 6 * hk, -0.8], r:[5 * hk, 3.6 * hk, 5 * hk], z:'gobhat'},
        {b:'head', t:'ell', c:[0, hy + 9 * hk, -1.2], r:[1.4 * hk, 1.6 * hk, 1.4 * hk], z:'sash'});
      return P; }},
  GOBLIN:{
    look:(L, fem) => { L.skin = '#8aa84a'; L.hair = '#2a2414'; },
    zones:() => ({eyew:'#f4eedc', eye:'#2a1a0e', scarf:'#c89a30', patch:'#7a4a2a', gobhat:'#6a3a2a', feather:'#d84a2a', cult1:'#4a6a3a'}), plainCloth:'#4a6a3a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 2.4 * hk, hy + 0.5 * hk, 5.15 * hk], r:[1.75, 1.85, 0.9], z:'eyew'}, {b:'head', t:'ell', c:[sx * 2.3 * hk, hy + 0.4 * hk, 5.55 * hk], r:[1.05, 1.2, 0.8], z:'eye'});
      P.push({b:'chest', t:'ell', c:[0, 18.2 * s, 0.4], r:[6.2 * w, 2 * s, 5.6 * w], z:'scarf'}, {b:'chest', t:'cap', a:[3 * w, 17 * s, 4.8 * w], p:[4.4 * w, 9 * s, 5.8 * w], r:1.3, z:'scarf'});
      if (x.weight === 'light' && !x.robe) P.push({b:'chest', t:'box', c:[3 * w, 8 * s, 6.1 * w], r:[2, 2.2, 0.5], z:'patch'}, {b:'chest', t:'box', c:[-3.6 * w, 13 * s, 6 * w], r:[1.6, 1.6, 0.5], rot:[0, 0, 0.3], z:'patch'});
      if (x.bare) P.push({b:'head', t:'ell', c:[0.6, hy + 4 * hk, -0.6], r:[9 * hk, 1.3 * hk, 8.6 * hk], rot:[0.1, 0, -0.12], z:'gobhat'}, {b:'head', t:'ell', c:[0.2, hy + 6.4 * hk, -1.2], r:[5.2 * hk, 3.4 * hk, 5.2 * hk], rot:[-0.25, 0, 0.2], z:'gobhat'},
        {b:'head', t:'cap', a:[-4 * hk, hy + 6 * hk, -1], p:[-7 * hk, hy + 13 * hk, -6 * hk], r:0.9, z:'feather'});
      return P; }},
  HOBGOBLIN:{
    look:(L, fem) => { L.skin = '#c08a48'; L.hair = '#3a2414'; L.beard = false; },
    zones:() => ({stripe:'#5a3a1e', whisker:'#f0e6d2', eye:'#e0a020', slit:'#120c08'}), plainCloth:'#5e6e4a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      for (const sx of [1, -1]){
        P.push({b:'head', t:'box', c:[sx * 2.3 * hk, hy + 0.4 * hk, 5.75 * hk], r:[0.3, 0.95, 0.3], z:'slit'});
        for (const k of [-1, 0, 1]) P.push({b:'head', t:'cap', a:[sx * 2.6 * hk, hy - 1.6 * hk + k * 0.7, 6.6 * hk], p:[sx * 7.6 * hk, hy - 1.2 * hk + k * 1.6, 5.2 * hk], r:0.18, z:'whisker'});
        P.push({b:'head', t:'box', c:[sx * 1.6 * hk, hy + 4.4 * hk, 4.6 * hk], r:[0.5, 1.6 * hk, 0.4], rot:[0, 0, sx * 0.3], z:'stripe'});
      }
      P.push({b:'head', t:'box', c:[0, hy + 5 * hk, 3.6 * hk], r:[0.5, 2 * hk, 0.4], z:'stripe'});
      for (const b of ['upL', 'upR', 'thL', 'thR']) for (const y of [-4, -8]) P.push({b, t:'ell', c:[0, y * s, 0], r:[3.1 * w, 0.6, 3.1 * w], z:'stripe'});
      P.push({b:'pelvis', t:'cap', a:[0, -2 * s, -5 * w], p:[0, -9 * s, -10 * w], r:1.5, z:'skin'}, {b:'pelvis', t:'cap', a:[0, -9 * s, -10 * w], p:[1.5, -17 * s, -11 * w], r:1.3, z:'skin'},
        {b:'pelvis', t:'cap', a:[1.5, -17 * s, -11 * w], p:[3, -21 * s, -9 * w], r:1.2, z:'stripe'}, {b:'pelvis', t:'ell', c:[0, -6 * s, -7.6 * w], r:[1.7, 0.6, 1.7], z:'stripe'}, {b:'pelvis', t:'ell', c:[0.8, -13 * s, -10.6 * w], r:[1.5, 0.6, 1.5], z:'stripe'});
      return P; }},
  DWARF:{
    look:(L, fem) => { L.skin = '#c8805a'; if (fem){ L.beard = false; if (L.hairStyle !== 'bald') L.hairStyle = 'braids'; } else L.beard = true; },
    zones:() => ({iron:'#6a6e74', rune:'#2a4a7a', cult1:'#7a3a24', eye:'#2a1a10'}), plainCloth:'#7a3a24',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      P.push({b:'head', t:'box', c:[0, hy - 3.6 * hk, 2.6 * hk], r:[5.4 * hk, 2.6 * hk, 3.4 * hk], z:'skin'}, {b:'head', t:'box', c:[0, hy + 1.9 * hk, 5.1 * hk], r:[4.8 * hk, 0.9, 1.3], z:'skin'});
      if (x.fem){ for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 4.5 * hk, hy - 10 * hk, 3.3 * hk], r:[1.8, 1.4, 1.8], z:'iron'}, {b:'head', t:'ell', c:[sx * 4.5 * hk, hy - 5.5 * hk, 2.7 * hk], r:[1.7, 1.2, 1.7], z:'iron'});
        P.push({b:'head', t:'box', c:[2.6 * hk, hy - 1.6 * hk, 5.5 * hk], r:[0.35, 1.2, 0.3], z:'rune'}, {b:'head', t:'box', c:[3.2 * hk, hy - 1 * hk, 5.35 * hk], r:[0.9, 0.3, 0.3], z:'rune'},
          {b:'head', t:'ell', c:[0, hy + 5 * hk, -4.2 * hk], r:[3.2 * hk, 2.4 * hk, 2.4 * hk], z:'hair'}); }
      else P.push({b:'head', t:'ell', c:[0, hy - 10.6 * hk, 4.6 * hk], r:[2.2, 1.5, 2.2], z:'iron'}, {b:'head', t:'ell', c:[-2 * hk, hy - 7.6 * hk, 6.2 * hk], r:[1.6, 1.1, 1.6], z:'iron'}, {b:'head', t:'ell', c:[2 * hk, hy - 7.6 * hk, 6.2 * hk], r:[1.6, 1.1, 1.6], z:'iron'});
      return P; }}
};
R3D_MUTE_SKIP.add('eyew'); R3D_MUTE_SKIP.add('whisker');
r3dBuild54 = (function(prev){
  return function(p, isLeader, opt){
    opt = opt || {};
    const C = p && RACE_CULTURE[p.race];
    if (!C || opt.race3d || ['ENEMY', 'OGRE', 'DEVIL'].includes(opt.kit)) return prev(p, isLeader, opt);
    const fem = sexOf(p) === 'f', look = Object.assign({}, opt.look || personLook(p, isLeader));
    C.look(look, fem);
    const rec = prev(p, isLeader, Object.assign({}, opt, {look}));
    const headgear = rec.parts.some(q => q.b === 'head' && ['helm', 'hat', 'hood', 'capc', 'gold'].includes(q.z) && q.z !== 'gold') || rec.parts.some(q => q.b === 'head' && q.z === 'gold' && q.t === 'box');
    const R = RACE3D[p.race] || RACE3D.HUMAN, D = r3dSkeleton(R, fem).dims;
    let weight = 'light'; if (rec.parts.some(q => q.z === 'plate')) weight = 'heavy'; else if (rec.parts.some(q => q.z === 'mail')) weight = 'medium';
    const robe = rec.parts.some(q => q.z === 'robe' && q.b === 'pelvis');
    for (const q of C.parts(D, {fem, bare:!headgear, weight, robe, spec:p.spec})) rec.parts.push(q);
    Object.assign(rec.zones, C.zones(fem), {skin:look.skin, hair:look.hair || rec.zones.hair});
    if (p.spec === 'PLAIN' && C.plainCloth){ rec.zones.cloth = C.plainCloth; rec.zones.clothD = shade(C.plainCloth, 0.72); rec.zones.top = C.plainCloth; }
    if (C.post) C.post(rec);   // a culture's last touch (the cults' glowing eyes, below)
    return rec;
  };
})(r3dBuild54);
for (const k in R3DP) delete R3DP[k];
R3DM.recs.clear(); R3DL.recKey = ''; for (const k in R3DR) if (k.indexOf('m:') === 0) delete R3DR[k];
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx58')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx58"><b>3D peoples.</b> Sun Elves wear gold, Grey Elves dress plain and clean, Dark Elves wear the furs of the frozen north, Orcs the coats of the steppe clans; Goblins are crafty in floppy hats, Hobgoblins are striped and cat-like, and Dwarves are blocky and iron-ringed.</p>`);
  };
}
/* ===== END INDEX 58 ======================================================= */

/* ============================================================================
   INDEX 59 - 3D RACE CULTURES, BATCH 2: GNOME, HALFLING, HALF-ELF, HALF-ORC,
   FIRBOLG, CAMBION, NEPHILIM, ZUHRI (MALE AND FEMALE)
     Gnome      big round nose, wild hair, brass goggles pushed up on the brow,
                a copper-trimmed vest with tiny cut gems, a tool roll
     Halfling   rosy cheeks, curly hair, a green waistcoat over a linen shirt,
                a mustard neckerchief, a wildflower (or a flower crown) on
                bare heads, big hairy bare feet
     Half-Elf   softly pointed ears, warm skin, loose hair, a teal and rust
                patterned shawl, a beaded braid
     Half-Orc   lighter skin than Orcs (PD-31), small tusks, a broken nose and a scar, a
                studded leather collar, a red neck scarf, shaved sides
     Firbolg    tall Highlanders: ruddy skin with a blue-grey cast, ginger or
                grey hair; men with big moustaches and bushy sideburns; a
                tartan kilt and a plaid sash over the shoulder, a sporran and a
                Celtic brooch, knee socks
     Cambion    deep red skin, curved horns, ember eyes, black clothes with gold
                chains and a red sash
     Nephilim   gold-sheened skin, a soft halo glow (no wings, no elf ears),
                gold jewellery: circlet, earrings, a torc, ivory and gold dress
     Zuhri      dark skin, pale glowing eyes, gold glyphs across face and hands,
                tiny storm sparks in the hair, indigo and sand robes
   Rules as Index 58: headgear from kit wins over culture hats; armour keeps its
   Quartermaster colours; enemies are unaffected.
   Nothing new is saved. Rollback: delete from this comment to END INDEX 59.

   3D DESIGN NOTE, ADDENDUM
     RACE_CULTURE entries may now carry post(rec, x): a last pass over the
     finished recipe (for example to turn the eyes into a glowing zone).
     Glowing zones added: glyph, spark, haloG. New colour zones: goggle, gem,
     vest, kilt, kiltL, kiltD, sock, ruff, shawl, shawl2, bead, collarS,
     scar, chain, torc, foot, flower.
============================================================================ */
for (const z of ['glyph', 'spark', 'haloG']){ R3D.EMIT.add(z); R3D_MUTE_SKIP.add(z); }
for (const z of ['gem', 'goggle', 'flower', 'kiltD', 'kiltL']) R3D_MUTE_SKIP.add(z);
const tartan = (b, c, r, rot, sx, sy) => { const out = [{b, t:'box', c, r, rot, z:'kilt'}];   // a check: two light bands each way and a dark band
  for (const k of [-0.5, 0.5]) out.push({b, t:'box', c:[c[0] + k * r[0] * (sx || 1), c[1], c[2] + 0.06], r:[0.35, r[1], r[2] + 0.06], rot, z:'kiltL'});
  for (const k of [-0.45, 0.35]) out.push({b, t:'box', c:[c[0], c[1] + k * r[1] * (sy || 1), c[2] + 0.07], r:[r[0], 0.3, r[2] + 0.07], rot, z:'kiltL'});
  out.push({b, t:'box', c:[c[0], c[1], c[2] + 0.08], r:[0.55, r[1], r[2] + 0.08], rot, z:'kiltD'}); return out; };
Object.assign(RACE_CULTURE, {
  GNOME:{
    look:(L, fem) => { L.skin = '#e8b890'; L.hair = fem ? '#c0562a' : '#e8e4dc'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'bun' : (L.hairStyle === 'bald' ? 'bald' : 'messy'); if (!fem) L.beard = true; },
    zones:() => ({goggle:'#c8a050', gem:'#70d0e8', vest:'#7a5a2a', cult1:'#c07a3a', leather:'#5a3a22', eye:'#2a1a10'}), plainCloth:'#6a5a3a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      if (x.bare){ P.push({b:'head', t:'ell', c:[0, hy + 3.6 * hk, -0.6 * hk], r:[6.9 * hk, 0.8, 6.9 * hk], z:'leather'});
        for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 2.5 * hk, hy + 3.9 * hk, 6.1 * hk], r:[2.1, 2.1, 1.3], z:'goggle'}, {b:'head', t:'ell', c:[sx * 2.5 * hk, hy + 3.9 * hk, 6.9 * hk], r:[1.35, 1.35, 0.6], z:'gem'}); }
      for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 5.4 * hk, hy + 2 * hk, -0.6 * hk], r:[2.6 * hk, 2.8 * hk, 3 * hk], z:'hair'});
      if (x.weight === 'light' && !x.robe){ P.push({b:'chest', t:'ell', c:[0, 10.6 * s, 1.2], r:[8.6 * w, 7.4 * s, 6.3 * w], z:'vest'}, {b:'chest', t:'box', c:[0, 10.6 * s, 6.4 * w], r:[0.5, 7 * s, 0.5], z:'cult1'});
        for (const [dx, dy] of [[2.4, 13], [-2.6, 9], [2.2, 6]]) P.push({b:'chest', t:'ell', c:[dx * w, dy * s, 6.5 * w], r:[0.7, 0.8, 0.5], z:'gem'}); }
      P.push({b:'pelvis', t:'box', c:[-6.8 * w, -1.6 * s, 3.4 * w], r:[1.4, 3, 1.6], z:'leather'}, {b:'pelvis', t:'cap', a:[-6.8 * w, 0, 5.2 * w], p:[-6.4 * w, -4 * s, 5.4 * w], r:0.35, z:'metal'});
      return P; }},
  HALFLING:{
    look:(L, fem) => { L.skin = '#e2a888'; L.hair = ['#6a4222', '#8a5a2b', '#c9a050', '#3a2414'][hash(String(L.skin + fem)) % 4]; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'long' : 'short'; L.beard = false; },
    zones:() => ({vest:'#4e6b2c', cult1:'#e8dcc0', scarf:'#c89a30', foot:'#c08a68', flower:'#e86a8a', gem:'#f0e060', cheek:'#d87a6a', eye:'#2a1a10'}), plainCloth:'#e0d4b4',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 3.4 * hk, hy - 1.6 * hk, 4.8 * hk], r:[1.6, 1.1, 0.6], z:'cheek'});
      for (const [x0, y0, z0] of [[3, 3.5, 1], [-3, 3.8, 0], [0, 5.8, -1], [4.6, 1.2, -1.6], [-4.6, 1.6, -1.6], [2, 4.6, -4], [-2, 4.4, -4]]) P.push({b:'head', t:'ell', c:[x0 * hk, hy + y0 * hk, z0 * hk], r:[2.2 * hk, 2.2 * hk, 2.2 * hk], z:'hair'});
      P.push({b:'chest', t:'ell', c:[0, 18.2 * s, 1], r:[5.6 * w, 1.6 * s, 5.2 * w], z:'scarf'});
      if (x.weight === 'light' && !x.robe) P.push({b:'chest', t:'ell', c:[0, 10.6 * s, 1.1], r:[8.6 * w, 7.6 * s, 6.3 * w], z:'vest'}, {b:'chest', t:'box', c:[0, 12 * s, 6.5 * w], r:[1.6 * w, 6 * s, 0.4], z:'cult1'},
        {b:'chest', t:'ell', c:[1.4 * w, 13 * s, 6.8 * w], r:[0.5, 0.5, 0.4], z:'gem'}, {b:'chest', t:'ell', c:[1.4 * w, 9 * s, 6.8 * w], r:[0.5, 0.5, 0.4], z:'gem'});
      for (const b of ['shL', 'shR']) P.push({b, t:'ell', c:[0, -15 * s, 2.4], r:[3.2 * w, 2.2 * s, 5.4 * s], z:'foot'}, {b, t:'ell', c:[0, -13.6 * s, 2.6], r:[2.6 * w, 1, 3.6 * s], z:'hair'});
      if (x.bare){ if (x.fem) for (let i = 0; i < 7; i++){ const a = i / 7 * TAU; P.push({b:'head', t:'ell', c:[Math.cos(a) * 6.2 * hk, hy + 4.2 * hk, Math.sin(a) * 6.2 * hk], r:[1.3, 1.3, 1.3], z:i % 2 ? 'flower' : 'gem'}); }
        else P.push({b:'head', t:'ell', c:[5.6 * hk, hy + 3 * hk, 2 * hk], r:[1.4, 1.4, 1.4], z:'flower'}); }
      return P; },
    post:rec => { for (const q of rec.parts) if (q.z === 'boots') q.z = 'foot'; }},
  HALF_ELF:{
    look:(L, fem) => { L.skin = ['#e6b993', '#c8916a', '#9a6a48'][hash(String(L.hair) + fem) % 3]; if (L.hairStyle !== 'bald') L.hairStyle = 'long'; L.hair = fem ? '#a8502a' : L.hair; },
    zones:() => ({shawl:'#3a7a7a', shawl2:'#a85a30', bead:'#d8c070', eye:'#3a5a3a'}), plainCloth:'#6a5a4a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [{b:'chest', t:'ell', c:[0, 16.6 * s, -0.4], r:[10.4 * w, 3.4 * s, 7.2 * w], z:'shawl'},
        {b:'chest', t:'box', c:[0, 17 * s, 6.2 * w], r:[5 * w, 0.5, 0.5], z:'shawl2'}, {b:'chest', t:'box', c:[0, 15.4 * s, 6.6 * w], r:[6 * w, 0.4, 0.4], z:'shawl2'},
        {b:'chest', t:'cap', a:[5 * w, 16 * s, 5 * w], p:[6 * w, 7 * s, 6 * w], r:1.6, z:'shawl'}];
      P.push({b:'head', t:'cap', a:[-5 * hk, hy, 3 * hk], p:[-5.2 * hk, hy - 9 * hk, 3.6 * hk], r:0.9, z:'hair'});
      for (let i = 0; i < 3; i++) P.push({b:'head', t:'ell', c:[-5.1 * hk, hy - (3 + i * 2.6) * hk, 3.3 * hk], r:[1, 0.9, 1], z:'bead'});
      return P; }},
  HALF_ORC:{
    look:(L, fem) => { L.skin = ['#d0a27e', '#c09a74', '#b09a72'][hash(String(L.skin) + fem) % 3]; /* PD-31: lighter than Orcs */ L.hair = '#1a1a14'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'topknot' : (L.hairStyle === 'long' ? 'topknot' : 'short'); },
    zones:() => ({collarS:'#3a2a1e', metal:'#a8a8a8', scarf:'#9a2a24', scar:'#c4a088', eye:'#3a2a1a'}), plainCloth:'#5a4a3a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      P.push({b:'head', t:'box', c:[2.8 * hk, hy + 1.4 * hk, 5.6 * hk], r:[0.35, 2.6 * hk, 0.3], rot:[0, 0, 0.35], z:'scar'}, {b:'head', t:'ell', c:[0.6, hy - 0.8 * hk, 6.4 * hk], r:[1.3, 1.1, 1.3], z:'skin'});
      P.push({b:'chest', t:'ell', c:[0, 19.6 * s, 0.4], r:[4.8 * w, 1.5 * s, 4.4 * w], z:'collarS'});
      for (let i = 0; i < 6; i++){ const a = i / 6 * TAU; P.push({b:'chest', t:'ell', c:[Math.sin(a) * 4.9 * w, 19.6 * s, Math.cos(a) * 4.5 * w], r:[0.5, 0.5, 0.5], z:'metal'}); }
      P.push({b:'chest', t:'ell', c:[0, 17.8 * s, 1.2], r:[6.4 * w, 1.5 * s, 5.8 * w], z:'scarf'}, {b:'chest', t:'cap', a:[-3 * w, 17 * s, 5.4 * w], p:[-4 * w, 11 * s, 6.2 * w], r:1.1, z:'scarf'});
      return P; }},
  FIRBOLG:{
    look:(L, fem) => { L.skin = '#b88a7a'; L.hair = ['#b0582a', '#c86a30', '#8a8a8a', '#a04a2a'][hash(String(L.hair) + fem) % 4]; L.beard = false; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'braids' : 'messy'; },
    zones:() => ({kilt:'#2e5a3a', kiltL:'#3a4a8a', kiltD:'#9a2a24', sock:'#d8d0bc', cult1:'#c9a440', leather:'#4a301c', ruff:'#7a6a5a', eye:'#2a3a4a'}), plainCloth:'#7a6a5a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      if (!x.fem){ for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 2.6 * hk, hy - 1.9 * hk, 5.5 * hk], r:[2.6 * hk, 0.9 * hk, 1.3 * hk], rot:[0, 0, sx * -0.35], z:'hair'},
        {b:'head', t:'ell', c:[sx * 5.2 * hk, hy - 1.2 * hk, 2.6 * hk], r:[1.3 * hk, 3.4 * hk, 2.2 * hk], z:'hair'}); }
      if (!x.robe && x.weight !== 'heavy') P.push(...tartan('pelvis', [0, -7.5 * s, 6.1 * w], [8.8 * w, 6.5 * s, 0.6], undefined, 1, 1), ...tartan('pelvis', [0, -7.5 * s, -6.1 * w], [8.8 * w, 6.5 * s, 0.6], undefined, 1, 1),
        {b:'pelvis', t:'ell', c:[0, -7.5 * s, 0], r:[9.4 * w, 7 * s, 6.6 * w], z:'kilt'}, {b:'pelvis', t:'box', c:[0, -4 * s, 6.9 * w], r:[2 * w, 2.4 * s, 0.6], z:'leather'}, {b:'pelvis', t:'ell', c:[0, -2.2 * s, 7.4 * w], r:[1, 1, 0.5], z:'cult1'});
      P.push(...tartan('chest', [0, 12 * s, 6.3 * w], [2.4 * w, 10 * s, 0.6], [0, 0, 0.62], 1, 1), ...tartan('chest', [0, 12 * s, -6.4 * w], [2.4 * w, 10 * s, 0.6], [0, 0, -0.62], 1, 1),
        {b:'chest', t:'ell', c:[5.6 * w, 18 * s, 4 * w], r:[1.8, 1.8, 0.7], z:'cult1'});
      if (!x.robe) for (const b of ['shL', 'shR']) P.push({b, t:'cap', a:[0, -1, 0.2], p:[0, -9.5 * s, 0.2], r:2.8 * w, z:'sock'}, {b, t:'ell', c:[0, -1.4, 0.2], r:[3 * w, 1.2, 3 * w], z:'kiltD'});
      return P; }},
  CAMBION:{
    look:(L, fem) => { L.skin = '#8a2a2a'; L.hair = '#141018'; },
    zones:() => ({chain:'#d4af37', sash:'#b02a2a', cult1:'#1e1a20', eyeglow:'#ffa040'}), plainCloth:'#241e26',
    parts:(D, x) => { const s = D.s, w = D.w, P = [];
      for (let i = 0; i < 7; i++){ const a = (i - 3) * 0.28; P.push({b:'chest', t:'ell', c:[Math.sin(a) * 5.4 * w, 16.6 * s - Math.cos(a) * 2.6 * s, 5.4 * w * Math.cos(a)], r:[0.7, 0.7, 0.5], z:'chain'}); }
      for (let i = 0; i < 6; i++) P.push({b:'chest', t:'ell', c:[(-4 + i * 1.6) * w, (6 + i * 1.6) * s, 6.4 * w], r:[0.6, 0.6, 0.45], z:'chain'});
      P.push({b:'pelvis', t:'box', c:[0, 0.6 * s, 0], r:[8.9 * w, 1.6 * s, 6.6 * w], z:'sash'}, {b:'pelvis', t:'box', c:[5 * w, -3.6 * s, 5.4 * w], r:[1.2, 3.6 * s, 0.6], z:'sash'});
      return P; },
    post:rec => { for (const q of rec.parts) if (q.z === 'eye') q.z = 'eyeglow'; }},
  NEPHILIM:{
    look:(L, fem) => { L.skin = '#e6c69a'; L.hair = fem ? '#3a2418' : '#f0e0a8'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'long' : 'topknot'; L.beard = false; },
    zones:() => ({cult1:'#d4af37', torc:'#e0c050', cult2:'#ece4d0', haloG:'#fff0b0', eye:'#6a4a20'}), plainCloth:'#ece4d0',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      P.push({b:'chest', t:'ell', c:[0, 19 * s, 0.4], r:[5.4 * w, 1.1 * s, 4.9 * w], z:'torc'});
      for (const sx of [1, -1]) P.push({b:'head', t:'ell', c:[sx * 6.2 * hk, hy - 1.6 * hk, 0], r:[0.7, 1.4, 0.7], z:'cult1'});
      if (x.bare) P.push({b:'head', t:'ell', c:[0, hy + 3 * hk, 0], r:[6.5 * hk, 0.6, 6.5 * hk], z:'cult1'}, {b:'head', t:'box', c:[0, hy + 4.4 * hk, 6 * hk], r:[0.5, 1.6, 0.4], z:'cult1'});
      P.push({b:'head', t:'ell', c:[0, hy + 10.5 * hk, -1], r:[5.2 * hk, 0.7, 5.2 * hk], z:'haloG'});
      return P; },
    post:rec => { rec.parts = rec.parts.filter(q => !(q.z === 'glow' && q.b === 'head')); for (const q of rec.parts) if (q.z === 'gold') q.z = 'cult1'; }},
  ZUHRI:{
    look:(L, fem) => { L.skin = '#3e2a22'; L.hair = '#141018'; if (L.hairStyle !== 'bald') L.hairStyle = fem ? 'braids' : (L.hairStyle === 'long' ? 'braids' : 'short'); },
    zones:() => ({glyph:'#f0c860', spark:'#bfe6ff', eyeglow:'#e0f4ff', cult1:'#2a3a6a', cult2:'#c8b088'}), plainCloth:'#2a3a6a',
    parts:(D, x) => { const s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk, P = [];
      for (const [gx, gy, gr] of [[3.6, -1.4, 0.4], [-3.6, -1.2, -0.4], [0, 3, 0], [2.8, 2.6, 0.9], [-2.8, 2.6, -0.9]]) P.push({b:'head', t:'box', c:[gx * hk, hy + gy * hk, 5.75 * hk - Math.abs(gx) * 0.2], r:[0.2, 0.9, 0.2], rot:[0, 0, gr], z:'glyph'});
      P.push({b:'head', t:'box', c:[0, hy + 3 * hk, 6 * hk], r:[0.9, 0.2, 0.2], z:'glyph'});
      for (const b of ['hdL', 'hdR', 'loL', 'loR']) P.push({b, t:'box', c:[0, b[0] === 'h' ? 0.6 : -5 * s, 2.2 * w], r:[0.3, 1.4, 0.3], rot:[0, 0, 0.5], z:'glyph'});
      for (const [sx, sy, sz] of [[4, 6, -3], [-4.4, 4.6, -4.6], [1.4, 7.4, -2], [-2, 6.6, -5.2]]) P.push({b:'head', t:'box', c:[sx * hk, hy + sy * hk, sz * hk], r:[0.3, 1.1, 0.3], rot:[0, 0, sx > 0 ? 0.7 : -0.7], z:'spark'});
      if (!x.robe && x.weight === 'light') P.push({b:'chest', t:'ell', c:[0, 11 * s, 0.6], r:[9.4 * w, 8.4 * s, 6.4 * w], z:'cult1'}, {b:'chest', t:'box', c:[0, 18.6 * s, 5.2 * w], r:[2.6 * w, 0.35, 0.4], z:'glyph'}, {b:'chest', t:'box', c:[0, 10 * s, 6.4 * w], r:[0.3, 5 * s, 0.3], z:'cult2'},
        {b:'pelvis', t:'ell', c:[0, -6 * s, 0.3], r:[8.6 * w, 7.4 * s, 6.5 * w], z:'cult2'});
      return P; },
    post:rec => { for (const q of rec.parts) if (q.z === 'eye') q.z = 'eyeglow'; }}
});
for (const k in R3DP) delete R3DP[k];
R3DM.recs.clear(); R3DL.recKey = ''; for (const k in R3DR) if (k.indexOf('m:') === 0) delete R3DR[k];
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx59')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx59"><b>More 3D peoples.</b> Gnomes in goggles, Halflings in waistcoats and bare feet, Half-Elves in patterned shawls, scarred Half-Orcs, tartan-clad Firbolg Highlanders, horned Cambions in gold chains, haloed Nephilim and storm-marked Zuhri with glowing eyes and gold glyphs.</p>`);
  };
}
/* ===== END INDEX 59 ======================================================= */

/* ============================================================================
   INDEX 60 - SWEEP AND FIX (3D ON)
   Played every contract type (Tier 1 and Tier 3), the bar fight, a faction raid,
   a rival raid, the drill, a mounted contract and the three prologue fights in
   Retro and Crisp, and pressed every button in every camp panel and screen.
   Fixed:
     - A Squad Mate walking to the Field Hospital was drawn lying on a cot that
       slid across the camp. They now walk there and lie down on arrival.
     - The dice tray from a debrief (Detailed Salvage and the like) could still
       be on screen over the next contract if you deployed quickly. Starting a
       contract now clears it.
   Rollback: delete from this comment to END INDEX 60 and undo the patch marked
   "Index 60" in the camp person drawing.
============================================================================ */
{ const f = startDeployment;
  startDeployment = function(c, ids){
    try { DICE_Q.length = 0; DICE_ON = false; const el = $('dice-tray'); if (el){ el.className = ''; el.innerHTML = ''; } } catch (e) {}
    return f(c, ids);
  };
}
/* ===== END INDEX 60 ======================================================= */

