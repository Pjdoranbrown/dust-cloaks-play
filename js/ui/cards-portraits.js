/* js/ui/cards-portraits.js (INT-1 step 2, 2026-11-16): DICE, CARDS AND PORTRAITS; CARRIED SUPPLIES, FREED CAPTIVES.
   Cut unchanged from the inline script in index.html (old lines 10108 to 10852). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   DICE, CARDS AND PORTRAITS
   The skill dice in the Print Pack's colours, a second die beyond Skill 6,
   Momentum in blue, purple and gold, cards drawn like the Print Pack sheets,
   the Squad Leader Dashboard, and portraits painted at a higher resolution.
============================================================================ */

/* ---------------------------------------------------------------------------
   SKILL DICE COLOURS (Print Pack, Squad Leader Dashboard)
   0 white, 1 yellow, 2 orange, 3 red, 4 purple, 5 blue, 6 black
--------------------------------------------------------------------------- */
const DIE_COL = ['#ffffff', '#e8c446', '#df892d', '#b8312a', '#6b3fa0', '#2f5d9a', '#1d1d1d'];
const DIE_INK = ['#1d1d1d', '#1d1d1d', '#1d1d1d', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
function dieStyle(skill){
  const n = typeof skill === 'number' ? Math.max(0, Math.min(6, skill | 0)) : -1;
  if (n < 0) return '';
  return `background:${DIE_COL[n]};color:${DIE_INK[n]};`;
}
const dieBox = (n, cls = '') => n < 0 ? '' : `<span class="dbx ${cls}" style="${dieStyle(n)}" data-tip="Skill ${n}: faces ${n} to ${n + 5}">${n}</span>`;

/* ---------------------------------------------------------------------------
   THE SECOND DIE: past Skill 6, more training adds a second die that starts
   at Skill 0 (a second swing, or a second arrow) and grows as the skill does.
--------------------------------------------------------------------------- */
function splitDice(s, extraM, extraR){
  const m = s.melee + (extraM || 0), r = s.ranged + (extraR || 0);
  s.melee = Math.min(6, m); s.melee2 = m >= 7 ? Math.min(6, m - 7) : -1;
  s.ranged = Math.min(6, r); s.ranged2 = r >= 7 ? Math.min(6, r - 7) : -1;
  return s;
}
{ const f = mateStats; mateStats = p => splitDice(f(p), p.xM, p.xR); }
{ const f = leaderStats; leaderStats = L => splitDice(f(L), L.xM, L.xR); }
const secondOK = (p, k) => { const s = mateStats(p); return k === 'melee' ? s.melee >= 6 && s.melee2 < 6 : s.ranged >= 6 && s.ranged2 < 6; };
{ const f = advChoices; advChoices = function(p, wm){
    const out = f(p, wm), capOK = p.adv < advCap();
    for (const o of out) if ((o.k === 'melee' || o.k === 'ranged') && capOK && secondOK(p, o.k)){
      const s = mateStats(p), sec = o.k === 'melee' ? s.melee2 : s.ranged2;
      o.ok = true; o.label = sec < 0 ? `Second ${o.k === 'melee' ? 'Melee' : 'Ranged'} die` : `+1 second ${o.k === 'melee' ? 'Melee' : 'Ranged'} die`; o.why = '';
    }
    return out;
  }; }
{ const f = applyAdvance; applyAdvance = function(p, k){
    if ((k === 'melee' || k === 'ranged') && secondOK(p, k)){ if (k === 'melee') p.xM = (p.xM || 0) + 1; else p.xR = (p.xR || 0) + 1; p.adv++; return; }
    f(p, k);
  }; }
TRAINING.barracks[0].ok = p => p.baseM + 1 <= rowFor(p.spec, 2 + p.adv)[0] || secondOK(p, 'melee');
TRAINING.ranger[0].ok = p => p.baseR + 1 <= rowFor(p.spec, 2 + p.adv)[1] || secondOK(p, 'ranged');
mateLine = function(p){
  const s = mateStats(p), mg = SPECS[p.spec].caster ? ` \u00b7 Mg ${s.magic}` : '';
  return `Con ${s.con} \u00b7 Mv ${s.move} \u00b7 M ${s.melee}${s.melee2 >= 0 ? '+' + s.melee2 : ''} \u00b7 R ${s.ranged}${s.ranged2 >= 0 ? '+' + s.ranged2 : ''}${mg}`;
};

/* ---------------------------------------------------------------------------
   MOMENTUM: slower, and in three grades. Field orders roll blue, purple or
   gold; anything that shifts the squad's dice to hit or to damage is gold.
   Nothing in the field adds a die: extra arrows, darts and bounces are
   earned in camp.
--------------------------------------------------------------------------- */
const RARITY = [{k:'blue', c:'#4a8fe0', n:'Blue'}, {k:'purple', c:'#a865e8', n:'Purple'}, {k:'gold', c:'#e8b830', n:'Gold'}];
const ADDS_DICE = new Set(['volley', 'margin']);
const DICE_SHIFT = new Set(['vanguard', 'precision', 'bless', 'hex', 'veteran']);
const TIERED = [
  {id:'spoils', name:'Spoils of War', glyph:'coin', v:[0.05, 0.10, 0.15], text:v => `Coin drops are worth ${Math.round(v * 100)}% more for the rest of the contract.`,
   apply:v => { G.spoils = (G.spoils || 0) + v / 0.25; }},
  {id:'holdline', name:'Hold the Line', glyph:'flag', v:[11, 22, 33], text:v => `Command Radius +${v}px.`, apply:v => { G.radiusBonus = (G.radiusBonus || 0) + v; recompute(); }},
  {id:'secondwind', name:'Second Wind', glyph:'heart', v:[1, 2, 3], text:v => `Every Squad Mate regains ${v} Condition and the Leader ${v} Wounds.${v >= 2 ? ' Anyone Bleeding Out gets up.' : ''}`,
   apply:v => { const L = G.leader;
     for (const m of G.squad){ if (m.state === 'up') m.con = Math.min(m.maxCon, m.con + v); else if (m.state !== 'dead' && v >= 2) standUp(m, 'SECOND WIND'); }
     if (L.down && v >= 2) standLeader('SECOND WIND'); L.wounds = Math.min(L.maxWounds, L.wounds + v); if (!L.down) L.con = Math.min(L.maxCon, L.con + v); }},
  {id:'supplies', name:'Captured Supplies', glyph:'shield', v:[1, 2, 4], text:v => v >= 4 ? 'Ward Tokens to 4 and the Shield Pool refilled.' : `+${v} Ward Token${v > 1 ? 's' : ''} and ${v} Shield Pool back.`,
   apply:v => { addWard(v); G.shieldPool = Math.min(G.shieldMax, G.shieldPool + (v >= 4 ? 99 : v)); }},
  {id:'quicken', name:'Quick Hands', glyph:'boot', v:[0.08, 0.15, 0.25], text:v => `Ability cooldowns are ${Math.round(v * 100)}% shorter.`, apply:v => { G.quicken = (G.quicken || 0) + v / 0.15; }},
  {id:'gifts', name:'Sharpened Gifts', glyph:'star', v:[0.15, 0.25, 0.40], text:v => `Magic Missile, Withering Hex and Mending Prayer come ${Math.round(v * 100)}% more often.`,
   ok:() => squadSpecs().some(s => SPECS[s].caster), apply:v => { G.gifts = (G.gifts || 0) + v / 0.33; }},
  {id:'fortune', name:'Fortune Favours', glyph:'heart', v:[1, 2, 6], text:v => v >= 6 ? 'Regain all spent Luck.' : `Regain ${v} spent Luck.`,
   ok:() => G.luck < G.leader.s.luck, apply:v => { G.luck = Math.min(G.leader.s.luck, G.luck + v); }}
];
const GOLD_ORDERS = [
  {id:'bloodup', name:'Blood Up', glyph:'sword', max:2, text:'Every Base Damage Die shifts up 1 step.', apply(){ G.ranks.veteran = rank('veteran') + 1; recompute(); }},
  {id:'disarray', name:'Enemy in Disarray', glyph:'skull', max:2, text:'Every enemy Morale check rolls 1 step lower.', apply(){ G.disarray = (G.disarray || 0) + 1; }}
];
function rollRarity(){ const r = Math.random(); return r < 0.62 ? 0 : r < 0.92 ? 1 : 2; }
rollMomentum = function(){
  const pool = [];
  for (const T of TIERED){ if (orderCount(T.id) >= 3 || (T.ok && !T.ok())) continue;
    if (isBrawl() && ['gifts', 'quicken', 'spoils', 'supplies'].includes(T.id)) continue;
    const t = rollRarity(), v = T.v[t];
    pool.push({kind:'order', o:{id:T.id, apply:() => T.apply(v)}, name:T.name, glyph:T.glyph, tag:'Field Order', text:T.text(v), rar:t, w:3}); }
  for (const O of GOLD_ORDERS) if (orderCount(O.id) < O.max && Math.random() < 0.3)
    pool.push({kind:'order', o:O, name:O.name, glyph:O.glyph, tag:'Field Order', text:O.text, rar:2, w:O.w || 1});   /* Q104: an order may carry its own weight (Focus Fire: MOM41.K.focusW) */
  for (const c of CARDS){
    if (ADDS_DICE.has(c.id) || c.id === 'radius' || c.id === 'veteran') continue;
    if (!(rank(c.id) >= 1 && rank(c.id) < c.max && (!c.req || has(c.req)))) continue;
    const gold = DICE_SHIFT.has(c.id); if (gold && Math.random() > 0.35) continue;
    pool.push({kind:'card', c, name:c.name, glyph:c.glyph, tag:'Empower: rank ' + (rank(c.id) + 1), text:c.text(rank(c.id) + 1), rar:gold ? 2 : 1, w:2});
  }
  const out = [], bag = pool.flatMap(x => Array(x.w).fill(x));
  while (out.length < 3 && bag.length){ const x = bag.splice(Math.random() * bag.length | 0, 1)[0]; if (!out.some(y => y.name === x.name)) out.push(x); }
  for (const x of out) x.col = RARITY[x.rar].c;
  return out;
};
// Wave fights (holding a fort, a camp, a town or a column) throw far more bodies at the squad: their kills count for a fifth.
const WAVE_FIGHTS = new Set(['hold', 'defend', 'siege', 'night', 'drill']);
{ const f = gainXP; gainXP = n => f(G && WAVE_FIGHTS.has(G.obj) ? n * 0.45 : n); }
{ const f = recompute; recompute = function(){ f(); if (G && G.mod) G.mod.radius += (G.radiusBonus || 0); }; }
// A breather between ranks: never two choices within 12 seconds.
{ const f = openMomentum; openMomentum = function(){ if (G && G.frame < (G.momWait || 0)) return; f(); }; }
{ const f = pickMomentum; pickMomentum = function(i){
    const ch = G && G.momChoice; if (ch && !G.momHidden && ch.opts[i]) G.momWait = G.frame + 6 * 60;
    f(i);
  }; }
{ const f = update; update = function(){ f(); if (G && !G.over && G.levelQueue > 0 && !G.momChoice && G.frame >= (G.momWait || 0)) openMomentum(); }; }
// The choice strip, framed in its grade's colour
{ const f = drawMomentum; drawMomentum = function(){
    f();
    const ch = G && G.momChoice; if (!ch || G.momHidden || !ch.rects) return;
    ch.rects.forEach((r, i) => { const o = ch.opts[i]; if (!o || o.rar === undefined) return; const R = RARITY[o.rar];
      ctx.strokeStyle = R.c; ctx.lineWidth = 3; ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
      ctx.fillStyle = R.c; ctx.fillRect(r.x, r.y + r.h - 5, r.w, 5);
      ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'right'; ctx.fillText(R.n.toUpperCase(), r.x + r.w - 8, r.y + r.h - 10); ctx.textAlign = 'left'; });
  }; }

/* ---------------------------------------------------------------------------
   PORTRAITS: a head-and-shoulders painting at 40 x 44 pixels, from the same
   look as the model in the field (race, sex, hair, armour, headgear).
--------------------------------------------------------------------------- */
function drawPortrait(o, bg){
  const W = 40, H = 44, c = newCanvas(W, H), g = c.getContext('2d'), P = painter(g);
  const skin = o.skin || '#e8b48a', skD = shade(skin, .8), skL = shade(skin, 1.12), hair = o.hair || '#3a2a1a', hairD = shade(hair, .78);
  const fem = o.sex === 'f', top = o.robe ? (o.robeCol || o.top || '#6a5a44') : (o.top || '#7a6a4e'), topD = shade(top, .72), topL = shade(top, 1.2);
  const B = bg || '#3a3226';
  // background: a darkened field with a soft vignette
  P(0, 0, W, H, shade(B, .9)); for (let y = 0; y < H; y += 2) P(0, y, W, 1, shade(B, .82));
  P(0, 0, W, 2, shade(B, .6)); P(0, 0, 2, H, shade(B, .6)); P(W - 2, 0, 2, H, shade(B, .6));
  const hx = 20, cy = 20, big = o.bulky ? 1 : 0;
  // long hair falls behind the shoulders
  const longHair = (fem && o.hairStyle !== 'bun') || o.hairStyle === 'long' || o.hairStyle === 'braids';
  const covered = ['helmet', 'hood', 'wizard', 'witch'].includes(o.head);
  if (longHair && o.hairStyle !== 'bald'){ P(10, 16, 20, 18, hairD); P(9, 20, 22, 12, hairD); }
  // shoulders and torso
  const sw = o.bulky ? 36 : 32, sx = (W - sw) / 2 | 0;
  for (let y = 33; y < H; y++){ const inset = Math.max(0, 36 - y); P(sx + inset, y, sw - inset * 2, 1, top); }
  P(sx + 3, 35, sw - 6, 1, topL);
  if (o.cape){ P(sx, 34, 5, H - 34, o.cape); P(sx + sw - 5, 34, 5, H - 34, o.cape); if (o.capeTrim){ P(sx + 4, 34, 1, H - 34, o.capeTrim); P(sx + sw - 5, 34, 1, H - 34, o.capeTrim); } }
  const ap = o.armour;
  if (ap === 'chain' || ap === 'scale') for (let y = 36; y < H; y++) for (let x = sx + 6 + (y % 2); x < sx + sw - 6; x += 2) P(x, y, 1, 1, topD);
  if (ap === 'studs') for (let y = 37; y < H; y += 3) for (let x = sx + 7; x < sx + sw - 6; x += 3) P(x, y, 1, 1, C.gold);
  if (ap === 'quilt' || ap === 'bands') for (let y = 37; y < H; y += 3) P(sx + 6, y, sw - 12, 1, topD);
  if (ap === 'plate'){ P(sx + 3, 33, 8, 5, topL); P(sx + sw - 11, 33, 8, 5, topL); P(hx - 1, 37, 2, H - 37, topL); }
  if (ap === 'fur'){ P(sx + 2, 32, sw - 4, 4, '#c8b090'); P(sx + 4, 31, sw - 8, 1, '#d8c8a8'); }
  if (o.acc && !o.robe) P(hx - 2, 36, 4, H - 36, o.acc);
  if (o.robe && o.acc){ P(hx - 6, 34, 2, H - 34, o.acc); P(hx + 4, 34, 2, H - 34, o.acc); }
  // neck
  P(hx - 3, 28, 7, 6, skD); P(hx - 3, 33, 7, 1, shade(skD, .85));
  // head: a rounded block, shaded on the right
  const rows = [[10, 6], [11, 9], [12, 11], [13, 12], [14, 13], [15, 13], [16, 13], [17, 14], [18, 14], [19, 14], [20, 14], [21, 14], [22, 13], [23, 13], [24, 12], [25, 11], [26, 10], [27, 8], [28, 6]];
  for (const [y, hw] of rows){ const w = hw + big; P(hx - (w >> 1), y, w, 1, skin); P(hx + (w >> 1) - 2, y, 2, 1, skD); P(hx - (w >> 1), y, 1, 1, skL); }
  // ears
  if (o.ears === 'elf'){ P(12, 18, 2, 4, skin); P(11, 16, 2, 3, skin); P(10, 14, 1, 3, skin); P(27, 18, 2, 4, skD); P(28, 16, 2, 3, skD); P(29, 14, 1, 3, skD); }
  else if (o.ears === 'big'){ P(9, 15, 4, 7, skin); P(7, 13, 3, 5, skin); P(27, 15, 4, 7, skD); P(30, 13, 3, 5, skD); P(10, 17, 2, 3, skD); }
  else { P(12, 19, 2, 4, skin); P(27, 19, 2, 4, skD); }
  // eyes, brows, nose, mouth
  const eye = o.eye || '#2a1a10';
  for (const ex of [15, 22]){ P(ex, 19, 3, 2, '#f4efe4'); P(ex + 1, 19, 1, 2, eye); P(ex, 18, 3, 1, skD); }
  if (o.eye){ P(16, 19, 1, 2, o.eye); P(23, 19, 1, 2, o.eye); }
  P(14, 17, 4, 1, hairD); P(22, 17, 4, 1, hairD); if (!fem){ P(14, 16, 1, 1, hairD); P(25, 16, 1, 1, hairD); }
  P(19, 21, 2, 3, skD); P(19, 24, 3, 1, shade(skD, .85)); if (o.nose){ P(18, 21, 4, 4, skL); P(19, 24, 3, 1, skD); }
  P(17, 26, 6, 1, fem ? '#b05a5a' : shade(skD, .8)); if (fem) P(18, 27, 4, 1, '#c87070');
  if (o.marks){ P(14, 22, 1, 1, '#bff6ff'); P(25, 23, 1, 1, '#bff6ff'); P(15, 24, 1, 1, '#bff6ff'); }
  // hair
  const hs = o.hairStyle || 'short';
  if (!covered && hs !== 'bald'){
    P(13, 9, 14, 3, hair); P(12, 11, 16, 3, hair); P(11, 13, 3, 5, hair); P(26, 13, 3, 5, hairD); P(15, 9, 8, 1, shade(hair, 1.25));
    if (hs === 'messy'){ P(13, 7, 2, 2, hair); P(18, 6, 2, 3, hair); P(23, 7, 2, 2, hair); }
    if (hs === 'topknot'){ P(17, 5, 6, 4, hair); P(18, 4, 4, 1, hair); }
    if (hs === 'bun'){ P(26, 8, 6, 6, hair); P(27, 9, 2, 2, shade(hair, 1.3)); }
    if (hs === 'ponytail'){ P(27, 12, 3, 14, hairD); }
    if (longHair){ P(10, 14, 3, 18, hair); P(27, 14, 3, 18, hairD); }
    if (hs === 'braids'){ for (let y = 26; y < 36; y += 2){ P(10, y, 3, 1, hairD); P(27, y, 3, 1, shade(hairD, .8)); } }
  }
  if (hs === 'bald' && !covered){ P(15, 11, 4, 1, skL); }
  // beard, tusks, horns, halo, mask
  if (o.beard){ P(13, 22, 14, 6, hair); P(14, 28, 12, 3, hair); P(16, 31, 8, 2, hairD); P(17, 26, 6, 1, shade(skD, .7)); P(16, 24, 8, 2, hair); }
  if (o.tusks){ P(16, 24, 1, 3, C.bone); P(23, 24, 1, 3, C.bone); }
  if (o.horns){ P(13, 6, 2, 4, C.bone); P(12, 3, 2, 4, C.bone); P(11, 1, 2, 3, '#d8ccb0'); P(25, 6, 2, 4, C.bone); P(26, 3, 2, 4, C.bone); P(27, 1, 2, 3, '#d8ccb0'); }
  if (o.halo){ P(13, 3, 14, 1, '#ffe680'); P(12, 4, 2, 1, '#ffe680'); P(26, 4, 2, 1, '#ffe680'); P(13, 5, 14, 1, '#d8b850'); }
  if (o.mask) P(13, 22, 14, 6, '#1e1e24');
  // headgear
  const helm = o.helm || C.steel, hat = o.hat || '#333';
  if (o.head === 'helmet'){ P(12, 6, 16, 9, helm); P(11, 9, 18, 6, helm); P(13, 6, 14, 1, shade(helm, 1.3)); P(25, 7, 3, 8, shade(helm, .7));
    P(19, 14, 2, 8, helm); P(11, 14, 3, 6, shade(helm, .85)); P(26, 14, 3, 6, shade(helm, .7)); if (o.acc) P(18, 3, 4, 4, o.acc); }
  if (o.head === 'hood'){ const h = o.hood || '#4e6b2c', hd = shade(h, .7); P(10, 6, 20, 8, h); P(9, 10, 4, 24, h); P(27, 10, 4, 24, hd); P(12, 5, 16, 2, h); P(11, 30, 18, 4, h); P(13, 7, 14, 1, shade(h, 1.2)); }
  if (o.head === 'circlet'){ P(12, 13, 16, 2, C.gold); P(19, 12, 2, 3, '#87ceeb'); }
  if (o.head === 'bandana'){ P(11, 10, 18, 4, o.acc || '#9b2d24'); P(28, 12, 3, 4, o.acc || '#9b2d24'); P(29, 15, 2, 3, shade(o.acc || '#9b2d24', .7)); }
  if (o.head === 'cap'){ P(12, 7, 16, 6, '#2a2a30'); P(24, 11, 8, 2, '#2a2a30'); P(13, 7, 14, 1, '#4a4a50'); }
  if (o.head === 'tricorn'){ P(6, 10, 28, 3, '#1a1414'); P(11, 4, 18, 7, '#1a1414'); P(13, 9, 14, 1, C.gold); P(8, 1, 2, 9, '#f0f0f0'); }
  if (o.head === 'wizard'){ const d = shade(hat, .75); P(5, 11, 30, 3, d); P(11, 9, 18, 3, hat); P(13, 6, 14, 3, hat); P(15, 3, 10, 3, hat); P(18, 0, 6, 3, hat); P(11, 10, 18, 1, C.gold); P(17, 5, 2, 2, '#ffe680'); }
  if (o.head === 'witch'){ const d = shade(hat, .75); P(3, 11, 34, 3, d); P(11, 8, 18, 4, hat); P(13, 5, 13, 3, hat); P(12, 2, 9, 3, hat); P(8, 0, 6, 3, hat); P(11, 10, 18, 1, o.acc || '#7ac05a'); }
  // frame
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.strokeRect(.5, .5, W - 1, H - 1);
  return c;
}
const portraitBg = (p, isLeader) => p.spec && SPECS[p.spec] ? shade(SPECS[p.spec].color, .45) : '#3a3226';
portraitURL = function(p, isLeader){
  return toURL('por3:' + personKey(p, isLeader), () => drawPortrait(personLook(p, isLeader), portraitBg(p, isLeader)), 3);
};
bustCanvas = (spr, bg, look) => drawPortrait(look || {}, bg);

/* ---------------------------------------------------------------------------
   CARDS, as on the Print Pack sheets
--------------------------------------------------------------------------- */
const hexStat = (label, n) => `<div class="hxs"><div class="hx"><i>${n}</i></div><span>${label}</span></div>`;
const diceStat = (label, n, n2, off) => `<div class="hxs"><div class="dstk">${off ? '<span class="dbx off">-</span>' : dieBox(n) + (n2 >= 0 ? dieBox(n2, 'sm') : '')}</div><span>${label}</span></div>`;
const boxes = (n, max, cls = '') => Array.from({length:max}, (_, i) => `<i class="bx ${cls} ${i < n ? 'on' : ''}"></i>`).join('');
function mcLine(label, val){ return val ? `<div class="mcl"><b>${label}</b><span>${val}</span></div>` : ''; }
mateCardHTML = function(p, extra = ''){
  const s = mateStats(p), A = ABILITIES[p.spec], cap = advCap(), caster = SPECS[p.spec].caster;
  const bondP = p.bond && (META.roster.find(x => x.id === p.bond) || (G && G.squad.map(m => m.p).find(x => x.id === p.bond)));
  const learnt = (p.picks || []).map(id => (CARDS.find(c => c.id === id) || {}).name).filter(Boolean);
  const exp = META.roster.includes(p) ? `<button class="mc-exp" onclick="event.stopPropagation();exportPerson('mate',${p.id})" data-tip="Save this Squad Mate to a file to share, or import into another campaign.">EXPORT</button>` : '';
  return `<div class="mcard"><div class="mc-head"><span>SQUAD MATE</span>${exp}</div>
    <div class="mc-top"><img class="mc-por" src="${portraitURL(p, false)}"><div class="mc-id"><div class="mc-name">${esc(p.name)}</div>
      <div class="mc-rcs">${RACES[p.race].name} \u00b7 ${CLASSES[p.cls].name}<br><b style="color:${shade(SPECS[p.spec].color, .8)}">${SPECS[p.spec].name}</b></div>
      <div class="mc-lv">Effective Level ${1 + p.adv}</div></div></div>
    <div class="mc-stats">${hexStat('CON', s.con)}${hexStat('MOVE', s.move)}${diceStat('MELEE', s.melee, s.melee2)}${diceStat('RANGED', s.ranged, s.ranged2)}${diceStat('MAGIC', s.magic, -1, !caster)}</div>
    <div class="mcl"><b>CONDITION</b><span class="bxs">${boxes(s.con, 7)}</span></div>
    ${mcLine('RACIAL TAG', RACES[p.race].tag)}${mcLine('CLASS PERK', CLASSES[p.cls].perk)}
    ${mcLine('BOND', bondP ? esc(bondP.name) : '')}
    ${mcLine('ABILITY', `${A.name}${learnt.length ? '; ' + learnt.join(', ') : ''}`)}
    <div class="mcl"><b>ADVANCEMENTS</b><span class="bxs">${boxes(p.adv, Math.max(cap, p.adv), 'adv')}</span><em>max Leader Lv + 1</em></div>
    ${p.injuries.length ? mcLine('INJURIES', `<span style="color:#8b0000">${p.injuries.map(i => INJURIES.find(x => x.id === i).name).join(', ')}</span>`) : ''}
    ${p.trainingAt && p.resting ? `<div class="mc-note good">Training at the ${facility(p.trainingAt).name}: ${esc(p.trainingLabel || '')}</div>` : ''}
    ${deityLine(p)}${extra ? `<div class="mc-extra">${extra}</div>` : ''}</div>`;
};
leaderCardHTML = function(L, extra = ''){
  const s = leaderStats(L), caster = SPECS[L.spec].caster, me = L === META.leader;
  return `<div class="mcard lead"><div class="mc-head"><span>${me ? 'SQUAD LEADER' : 'OFFICER'}</span><button class="mc-exp" onclick="event.stopPropagation();exportPerson('leader','${me ? 'L' : L.id}')" data-tip="Save to a file to share, or import into another campaign.">EXPORT</button></div>
    <div class="mc-top"><img class="mc-por" src="${portraitURL(L, true)}"><div class="mc-id"><div class="mc-name">${esc(L.name)}</div>
      <div class="mc-rcs">${RACES[L.race].name} \u00b7 ${CLASSES[L.cls].name}<br><b style="color:${shade(SPECS[L.spec].color, .8)}">${SPECS[L.spec].name}</b></div>
      <div class="mc-lv" data-tip="3 XP ticks make a level.">Level ${L.level} ${SPECS[L.spec].name} \u00b7 ${L.ticks | 0} XP ${boxes(L.ticks, 3, 'xp')}</div></div></div>
    <div class="mc-stats">${hexStat('CON', s.con)}${hexStat('WOUNDS', s.maxWounds)}${hexStat('LUCK', s.luck)}${hexStat('MOVE', s.move)}</div>
    <div class="mc-stats">${diceStat('MELEE', s.melee, s.melee2)}${diceStat('RANGED', s.ranged, s.ranged2)}${diceStat('MAGIC', s.magic, -1, !caster)}${diceStat('PERSONALITY', clampSkill(s.per), -1)}</div>
    ${mcLine('TALENTS', (L.picks || []).map(id => (CARDS.find(c => c.id === id) || {}).name).join(', ') || 'none yet')}
    ${mcLine('RECORD', `${L.deployments || 0} contracts, ${L.kills || 0} slain${L.renown ? ', ' + L.renown + ' Renown' : ''}`)}
    ${L.injuries.length ? mcLine('INJURIES', `<span style="color:#8b0000">${L.injuries.map(i => INJURIES.find(x => x.id === i).name).join(', ')}</span>`) : ''}
    ${deityLine(L)}${extra ? `<div class="mc-extra">${extra}</div>` : ''}</div>`;
};
// Gear cards: the Gear Deck layout
const ARMOUR_TIER = {rags:'Rags', padded:'Light (Tier 1)', leather:'Light (Tier 2)', brigandine:'Light (Tier 3)', chainshirt:'Light (Tier 4)', hide:'Medium (Tier 1)', scale:'Medium (Tier 2)',
  heavychain:'Medium (Tier 3)', cuirass:'Medium (Tier 4)', splint:'Heavy (Tier 1)', lamellar:'Heavy (Tier 2)', halfplate:'Heavy (Tier 3)'};
const GEAR_RANGE = {spears:'Melee / Throw 3', shortswords:'Melee / Throw 2', pikes:'Reach 2', greatswords:'Melee', shortbows:'Opt 1\u20134 / Max 7', longbows:'Opt 1\u20136 / Max 10', crossbows:'Opt 1\u20135 / Max 8'};
const SLOT_HEAD = {armour:['SQUAD STANDARD ARMOUR', '#5a3a24'], melee:['SQUAD STANDARD WEAPON', '#2a2520'], ranged:['SQUAD STANDARD WEAPON', '#2a2520'],
  shield:['SQUAD STANDARD SHIELD', '#4e5a3a'], kit:['SPECIALIST KIT', '#6a3a2a'], mount:['SQUAD ASSET \u00b7 MOUNT', '#2e3a4a']};
function gearCardHTML(g, o = {}){
  const [head, hc] = SLOT_HEAD[g.slot], src = g.req.length ? g.req.map(r => facility(r).name).join(' + ') : (g.cost ? 'Town Market' : 'Charter kit');
  let sub = '', big = '';
  if (g.slot === 'armour'){ sub = ARMOUR_TIER[g.id] || ''; big = `${hexStat('TARGET AC', g.ac)}${hexStat('DMG SHIFT', g.shift ? '-' + g.shift : 0)}${hexStat('MOVE', g.mv || 0)}`; }
  if (g.slot === 'melee' || g.slot === 'ranged'){ sub = g.slot === 'melee' ? (g.id === 'greatswords' ? 'Squad Standard Melee, two-handed' : 'Standard Melee') : 'Standard Ranged';
    big = `<div class="hxs"><div class="dstk">${dieBox(g.dmg, 'lg')}</div><span>BASE DMG</span></div>`; }
  if (g.slot === 'shield'){ sub = g.id === 'none' ? 'No shield' : 'Squad Standard Shield'; big = `${hexStat('SHIELD POOL', g.pool)}${g.pool ? hexStat('SHIELD WALL AC', '+1') : ''}`; }
  if (g.slot === 'mount'){ sub = g.id === 'nomount' ? 'The squad marches' : g.pool ? 'Mount, fights mounted' : 'Mount, rides to the fight'; big = g.id === 'nomount' ? '' : `${hexStat('SPEED', '+' + Math.round((g.spd - 1) * 100) + '%')}${hexStat('MOUNT POOL', g.pool || 0)}`; }
  if (g.slot === 'kit') sub = 'Carried by one Squad Mate';
  const stats = g.slot === 'armour' ? [g.ward ? '+1 Ward Token each contract.' : '', g.graze0 ? 'Grazing = 0 unless Natural Max Face.' : '', g.mv ? 'Armour never drags a squad below Move 3.' : ''].filter(Boolean).join(' ') : '';
  const status = o.eq ? '<div class="gc-st eq">EQUIPPED</div>' : o.owned ? '<div class="gc-st own">OWNED: click to equip</div>' : o.locked ? `<div class="gc-st lock">Needs ${o.locked}</div>` : o.price !== undefined ? '' : '';
  return `<div class="gcard ${o.eq ? 'eq' : ''} ${o.off ? 'off' : ''} ${o.mini ? 'mini' : ''}" ${o.click ? `onclick="${o.click}"` : ''}>
    <div class="gc-head" style="background:${hc}"><span>${head}</span></div>
    <div class="gc-name">${g.name}</div><div class="gc-sub">${sub}</div>
    <div class="gc-mid"><img src="${gearURL(g)}"><div class="gc-big">${big}</div></div>
    ${GEAR_RANGE[g.id] ? `<div class="gc-range"><b>RANGE</b> ${GEAR_RANGE[g.id]}</div>` : ''}
    ${o.mini ? '' : `<div class="gc-text">${[g.note, stats].filter(Boolean).join(' ')}</div>`}
    <div class="gc-foot"><span><b>COST</b>${o.price !== undefined && o.price !== g.cost ? o.price + 'gp <s>' + g.cost + '</s>' : g.cost + 'gp'}</span><span><b>SOURCE</b>${src}</span></div>${status}</div>`;
}
// The Quartermaster, laid out as the Gear Deck
{ const f = renderCamp; renderCamp = function(){
    f();
    const inner = $('camp-inner'); if (!inner) return;
    for (const el of Array.from(inner.querySelectorAll('.row'))){ const prev = el.previousElementSibling; if (prev && prev.tagName === 'DIV' && !prev.className) prev.remove(); el.remove(); }
    const slots = [['armour', 'Armour'], ['shield', 'Shield'], ['melee', 'Melee Weapon'], ['ranged', 'Ranged Weapon'], ['kit', 'Specialist Kits (up to two)'], ['mount', 'Squad Asset: Mount']];
    let h = '';
    for (const [slot, label] of slots){
      h += `<h2 class="sec" style="margin:16px 0 8px">${label}</h2><div class="row gdeck">`;
      for (const g of GEAR.filter(x => x.slot === slot)){
        const owned = META.gear.owned.includes(g.id), eq = slot === 'kit' ? META.gear.kits.includes(g.id) : META.gear[slot] === g.id;
        const kitDay = typeof inStory === 'function' && inStory() && CP().part === 'kit';
        const locked = kitDay ? [] : g.req.filter(r => !has(r)), price = kitDay ? g.cost : gearPrice(g), can = eq ? slot === 'kit' : (owned || (!locked.length && META.treasury >= price));
        h += gearCardHTML(g, {eq, owned:owned && !eq, locked:locked.length ? locked.map(r => facility(r).name).join(' + ') : '', price, off:!(can || eq), click:`gearClick('${g.id}')`});
      }
      h += '</div>';
    }
    const back = inner.lastElementChild; back.insertAdjacentHTML('beforebegin', h);
  }; }

/* ---------------------------------------------------------------------------
   THE SQUAD LEADER DASHBOARD
--------------------------------------------------------------------------- */
function dashboardHTML(){
  const L = META.leader; if (!L) return '';
  const s = leaderStats(L), g = META.gear, gr = id => gear(id), caster = SPECS[L.spec].caster;
  const shield = gr(g.shield), mount = gr(g.mount), kits = g.kits.map(gr), armour = gr(g.armour);
  const shieldMax = Math.min(7, shield.pool + (kits.some(k => k.id === 'towershield') ? 3 : 0) + (mastery('carpentry') ? 2 : 0));
  const wards = Math.min(4, s.wards + (has('armoury') ? 1 : 0) + (armour.ward || 0) + (kits.some(k => k.id === 'focus') ? 1 : 0) + (mastery('kitchen') ? 1 : 0) + (mastery('armoury') ? 1 : 0) + (allied('mendor') ? 1 : 0));
  const row = (label, n, n2, off) => `<div class="dsrow"><b>${label}</b><span>${[0, 1, 2, 3, 4, 5, 6].map(k => `<i class="dsd ${!off && k === n ? 'cur' : ''} ${!off && k === n2 ? 'sec' : ''}" style="${dieStyle(k)}">${k}</i>`).join('')}</span></div>`;
  const slot = (label, gg) => `<div class="dslot"><div class="dslab">${label}</div>${gg ? gearCardHTML(gg, {mini:true, click:'openCamp()'}) : '<div class="dsempty">Empty</div>'}</div>`;
  return `<div class="dash"><div class="dash-head"><div><b>Squad Leader Dashboard</b><br><span>${esc(L.name)}, ${RACES[L.race].name} ${CLASSES[L.cls].name} ${SPECS[L.spec].name}</span></div>
      <div class="dlv"><span class="lvhex">${L.level}</span><span>LEVEL</span></div><div class="dxp"><b>XP TICKS</b><br>${boxes(L.ticks, 3, 'xp')}</div><div class="dxp"><b>VAULT</b><br>${META.treasury}gp</div></div>
    <div class="dash-grid">
      <div class="dbox"><div class="dbt">THE LEADER</div>
        <div class="dsrow"><b>CONDITION</b><span class="bxs">${boxes(s.con, 12)}</span></div>
        <div class="dsrow"><b>WOUNDS</b><span class="bxs">${boxes(s.maxWounds, 12)}</span></div>
        <div class="dsrow"><b>LUCK</b><span class="bxs">${boxes(s.luck, 6, 'rnd')}</span><em>${L.burnt ? L.burnt + ' burnt' : ''}</em></div>
        <div class="dsrow"><b>MOVE</b><span class="lvhex sm">${s.move + armour.mv < 3 ? 3 : s.move + (armour.mv || 0)}</span><em>with ${armour.name}</em></div></div>
      <div class="dbox"><div class="dbt">SKILL DICE</div>${row('MELEE', s.melee, s.melee2)}${row('RANGED', s.ranged, s.ranged2)}${row('MAGIC', s.magic, -1, !caster)}${row('PERSONALITY', clampSkill(s.per), -1)}
        <div class="dsnote">Ringed: the die you roll. Dashed: the second die, past Skill 6.</div></div>
      <div class="dbox"><div class="dbt">SQUAD COHESION</div>
        <div class="dsrow"><b>WARD TOKENS</b><span class="bxs">${boxes(wards, 4, 'rnd blue')}</span><em>at the start</em></div>
        <div class="dsrow"><b>SHIELD POOL</b><span class="bxs">${boxes(shieldMax, 7)}</span><em>max 7</em></div>
        <div class="dsrow"><b>MOUNT POOL</b><span class="bxs">${boxes(mount.pool || 0, 8)}</span><em>${mount.id === 'nomount' ? 'on foot' : ''}</em></div>
        <div class="dsrow"><b>SQUAD</b><span>${META.roster.length} Squad Mates, ${officers().length} officer${officers().length === 1 ? '' : 's'}</span></div></div>
    </div>
    <div class="dslots">${slot('ARMOUR', armour)}${slot('MELEE WEAPON', gr(g.melee))}${slot('RANGED WEAPON', gr(g.ranged))}${slot('SHIELD', shield)}${slot('SQUAD ASSET', mount)}${kits.length ? kits.map((k, i) => slot('KIT ' + (i + 1), k)).join('') : slot('KITS', null)}</div></div>`;
}
{ const f = leadershipHTML; leadershipHTML = () => dashboardHTML() + f(); }

/* ---------------------------------------------------------------------------
   STYLES
--------------------------------------------------------------------------- */
(function(){
  const css = `
  .dbx{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid #1d1d1d;border-radius:4px;font:bold 12px Georgia;box-shadow:inset 0 -2px 0 rgba(0,0,0,.2)}
  .dbx.sm{width:16px;height:16px;font-size:10px;margin-left:2px;border-style:dashed} .dbx.lg{width:38px;height:38px;font-size:22px;border-radius:5px} .dbx.off{background:#e8e0d0;color:var(--off-dark);border-color:var(--off-dark)}
  .card:has(> .mcard), .card.static:has(> .mcard){width:262px;padding:0;background:none !important;border:none;box-shadow:none}
  .card:has(> .mcard) > .tag{display:none}
  .mcard{width:262px;box-sizing:border-box;background:#f3ead8;border:2px solid #6a4428;border-radius:7px;box-shadow:0 0 0 2px #f3ead8, 0 0 0 3px #6a4428, 0 6px 12px rgba(0,0,0,.3);text-align:left;color:var(--ink);font-family:Georgia;overflow:hidden;margin:3px}
  .mcard.lead{border-color:#7a2a1a;box-shadow:0 0 0 2px #f3ead8, 0 0 0 3px #b8902a, 0 6px 12px rgba(0,0,0,.3)}
  .mc-head{display:flex;align-items:center;justify-content:space-between;background:var(--blood);color:#f5efe3;font:bold 14px Georgia;letter-spacing:1.5px;padding:4px 8px}
  .mcard.lead .mc-head{background:linear-gradient(90deg,#7a2a1a,#9a6a1a)}
  .mc-exp{font:bold 14px Georgia !important;letter-spacing:1px;padding:2px 6px !important;margin:0 !important;background:#f5efe3 !important;color:#5a2a14 !important;border:1px solid #2a1a0a !important;box-shadow:none !important;text-shadow:none !important}
  .mc-top{display:flex;gap:8px;padding:6px 8px 2px} .mc-por{width:66px;height:72px;image-rendering:pixelated;border:2px solid var(--ink-soft);border-radius:3px;flex:none}
  .mc-name{font:bold 16px Georgia;border-bottom:1px solid #b8a88a;margin-bottom:2px} .mc-rcs{font-size:14px;line-height:1.3} .mc-lv{font-size:14px;color:#6a5a44;margin-top:2px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
  .mc-stats{display:flex;flex-wrap:wrap;justify-content:space-around;gap:2px 0;padding:4px 4px;border-top:1px solid #d8c8a8}
  .hxs{display:flex;flex-direction:column;align-items:center;gap:1px;font:bold 14px Georgia;letter-spacing:.5px;color:var(--ink-soft);min-width:40px}
  .hx{width:30px;height:26px;display:flex;align-items:center;justify-content:center;background:var(--ink);clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
  .hx i{width:25px;height:21px;display:flex;align-items:center;justify-content:center;background:#fffaf0;font:bold 14px Georgia;font-style:normal;color:var(--ink);clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
  .dstk{display:flex;align-items:flex-end;min-height:24px}
  .mcl{display:flex;gap:6px;align-items:baseline;padding:2px 8px;border-top:1px solid #e0d2b4;font-size:14px;line-height:1.3;flex-wrap:wrap} .mcl > b{font:bold 14px Georgia;letter-spacing:.8px;color:#7a5a2a;flex:none;min-width:70px}
  .mcl em{font-size:14px;color:#9a8a70;margin-left:auto}
  .bxs{display:inline-flex;gap:2px;flex-wrap:wrap} .bx{display:inline-block;width:9px;height:9px;border:1.5px solid var(--ink-soft);background:#fffaf0}
  .bx.on{background:#6fa37a} .bx.adv.on{background:var(--gold)} .bx.xp.on{background:var(--blood)} .bx.rnd{border-radius:50%} .bx.rnd.on{background:#f0c96a} .bx.blue.on{background:#87ceeb}
  .mc-note{font-size:14px;padding:2px 8px} .mc-note.good{color:#226b2a} .mc-extra{padding:2px 8px 6px;font-size:14px}
  .mc-extra .desc{text-align:left}
  .lvhex{display:inline-flex;width:22px;height:20px;align-items:center;justify-content:center;background:var(--ink);color:#f0d890;font:bold 14px Georgia;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)} .lvhex.sm{width:20px;height:18px;font-size:14px}
  /* gear cards */
  .gdeck{gap:12px}
  .gcard{position:relative;width:210px;background:#f6eedd;border:2px solid var(--ink-soft);border-radius:7px;box-shadow:0 0 0 2px #f6eedd, 0 0 0 3px var(--ink-soft), 0 5px 10px rgba(0,0,0,.25);overflow:hidden;cursor:pointer;color:var(--ink);text-align:left;font-family:Georgia;transition:transform .12s;margin:3px}
  .gcard:hover{transform:translateY(-3px);box-shadow:0 0 0 2px #f6eedd, 0 0 0 4px var(--gold), 0 8px 14px rgba(0,0,0,.35)}
  .gcard.eq{box-shadow:0 0 0 2px #f6eedd, 0 0 0 4px #226b2a, 0 5px 10px rgba(0,0,0,.25)} .gcard.off{filter:grayscale(.7);opacity:.6;cursor:default} .gcard.off:hover{transform:none}
  .gc-head{color:#f5efe3;font:bold 14px Georgia;letter-spacing:1.5px;padding:4px 8px}
  .gc-name{font:bold 15px Georgia;padding:5px 8px 0} .gc-sub{font:italic 14px Georgia;color:#7a6a54;padding:0 8px 2px}
  .gc-mid{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px;padding:4px 8px;border-top:1px solid #e0d2b4;border-bottom:1px solid #e0d2b4;background:rgba(255,255,255,.35)}
  .gc-mid img{width:40px;image-rendering:pixelated} .gc-big{display:flex;gap:2px;flex:1;justify-content:space-around}
  .gc-range{font-size:14px;padding:3px 8px;border-bottom:1px solid #e0d2b4} .gc-range b{font:bold 14px Georgia;letter-spacing:1px;color:#7a5a2a;margin-right:4px}
  .gc-text{font-size:14px;padding:4px 8px;line-height:1.35;min-height:30px;color:#3a2a1a}
  .gc-foot{display:flex;justify-content:space-between;padding:4px 8px 6px;font-size:14px;border-top:1px solid #e0d2b4} .gc-foot span{display:flex;flex-direction:column} .gc-foot span:last-child{text-align:right}
  .gc-foot b{font:bold 14px Georgia;letter-spacing:1px;color:#7a5a2a} .gc-foot s{color:#9a8a70;font-size:14px}
  .gc-st{position:absolute;bottom:40px;right:4px;transform:rotate(8deg);font:bold 14px Georgia;padding:1px 6px;border:2px solid;background:rgba(255,248,230,.9);text-transform:uppercase}
  .gc-st.eq{color:#226b2a;border-color:#226b2a} .gc-st.own{color:#2e4a6a;border-color:#2e4a6a;font-size:14px} .gc-st.lock{color:#9a2a14;border-color:#9a2a14;font-size:14px}
  .gcard.mini{width:168px;cursor:pointer} .gc-foot{gap:8px} .gcard.mini .gc-name{font-size:14px} .gcard.mini .gc-sub{font-size:14px} .gcard.mini .gc-mid img{width:28px} .gcard.mini .gc-mid{padding:4px 3px} .gcard.mini .gc-foot{font-size:14px}
  .gcard.mini .hxs{min-width:30px;font-size:14px} .gcard.mini .hx{width:24px;height:21px} .gcard.mini .hx i{width:20px;height:17px;font-size:14px} .gcard.mini .gc-head{font-size:14px;letter-spacing:1px;white-space:nowrap;overflow:hidden}
  /* dashboard */
  .dash{width:100%;max-width:1160px;background:#f3ead8;border:2px solid #6a4428;border-radius:4px;padding:10px 14px;box-sizing:border-box;margin:8px 0 4px;box-shadow:0 4px 10px rgba(0,0,0,.25);color:var(--ink)}
  .dash-head{display:flex;align-items:center;gap:18px;border-bottom:3px double #6a4428;padding-bottom:6px;margin-bottom:8px} .dash-head > div:first-child{flex:1} .dash-head b{font:bold 20px Georgia;color:var(--blood)} .dash-head span{font-size:14px;font-style:italic}
  .dlv{display:flex;flex-direction:column;align-items:center;font:bold 14px Georgia} .dlv .lvhex{width:34px;height:30px;font-size:16px}
  .dxp{font-size:14px;text-align:center} .dxp b{font:bold 14px Georgia !important;color:var(--ink-soft) !important;letter-spacing:1px}
  .dash-grid{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:10px} @media (max-width:900px){.dash-grid{grid-template-columns:1fr}}
  .dbox{border:1.5px solid #8a6a3a;border-radius:3px;padding:20px 8px 6px;position:relative;background:rgba(255,255,255,.3)}
  .dbt{position:absolute;top:-1px;left:8px;background:var(--blood);color:#f5efe3;font:bold 14px Georgia;letter-spacing:1.5px;padding:3px 8px;border-radius:0 0 3px 3px}
  .dsrow{display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid #e0d2b4;font-size:14px} .dsrow > b{font:bold 14px Georgia;letter-spacing:.3px;width:116px;flex:none;color:var(--ink-soft)} .dsrow em{margin-left:auto;font-size:14px;color:#9a8a70}
  .dsd{display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;border:1.5px solid #1d1d1d;border-radius:3px;font:bold 10px Georgia;font-style:normal;margin-right:2px;opacity:.55}
  .dsd.cur{opacity:1;outline:3px solid var(--gold);outline-offset:1px} .dsd.sec{opacity:1;outline:2px dashed var(--ink);outline-offset:1px}
  .dsnote{font-size:14px;color:#7a6a54;margin-top:4px}
  .dslots{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center} .dslot{display:flex;flex-direction:column;align-items:center} .dslab{font:bold 14px Georgia;letter-spacing:1px;color:#7a5a2a;margin-bottom:2px}
  .dsempty{width:158px;height:120px;border:2px dashed #b8a88a;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#9a8a70;font-style:italic;font-size:14px}
  .dt-die{border-width:4px}
  .die.success b{outline:3px solid #2e8a3a} .die.partial b{outline:3px solid #c8a024} .die.miss b{outline:3px solid #a02a1a;opacity:.85}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
{ const f = openManual; openManual = function(){ f(); const lg = $('manual-inner').querySelector('.log'); if (!lg) return;
    lg.insertAdjacentHTML('beforeend', `<p><b>The skill dice</b> are coloured as on the Print Pack: Skill 0 white, 1 yellow, 2 orange, 3 red, 4 purple, 5 blue, 6 black. Every roll thrown on screen uses them.</p>
      <p><b>Past Skill 6.</b> A Squad Mate whose Melee or Ranged is already at Skill 6 can keep training it: the next Advancement adds a second die at Skill 0 (a second swing, or a second arrow), and each one after raises it, up to Skill 6. A Leader whose dice would pass 6 gets the second die the same way.</p>
      <p><b>Momentum in three grades.</b> Field orders roll blue, purple or gold, and the grade sets the size (Spoils of War: 5%, 10% or 15% more coin). Anything that shifts the squad's dice to hit or to damage is gold. Nothing in the field adds a die: extra arrows, darts and lightning bounces are earned in camp (Lightning Bolt bounces once more at Magic 3, and again at Magic 5). Ranks come slower, and never twice within 12 seconds.</p>`); }; }

/* ============================================================================
   CARRIED SUPPLIES, FREED CAPTIVES, AND PAINTED PORTRAITS
============================================================================ */

/* ---------------------------------------------------------------------------
   CARRIED SUPPLIES: munitions, poultices and scrolls the squad starts a
   contract with (salvage, veteran staff, allies, Logistical Asset, the
   prologue's workshops) are carried, not dropped as a row of chests. Each is
   used on its own the moment it is worth using, and shows on the HUD.
--------------------------------------------------------------------------- */
const CARRY_KINDS = ['cusser', 'smoke', 'scroll', 'poultice', 'ward', 'storm', 'wafer'];
const CARRY_WHEN = {
  poultice:'when someone is down or the squad is badly hurt', cusser:'when 7 or more enemies close on the Leader', smoke:'when 3 or more enemy archers or casters are in range',
  scroll:'when 10 or more enemies are near', ward:'when the Wards and Shield Pool are gone in a fight', storm:'when 6 or more enemies are close', wafer:'when Luck is spent'
};
{ const f = startDeployment; startDeployment = function(c, ids){
    f(c, ids);
    if (!G) return;
    const L = G.leader; G.carry = {};
    G.caches = G.caches.filter(k => {
      if (k.opened || k.small || k.wild || !CARRY_KINDS.includes(k.kind) || (!k.starter && dist(k, L) > 160)) return true;
      G.carry[k.kind] = (G.carry[k.kind] || 0) + 1; return false;
    });
    MAP.caches = G.caches;
    const n = Object.values(G.carry).reduce((a, b) => a + b, 0);
    if (n) note(`The squad carries ${Object.entries(G.carry).map(([k, v]) => `${v} ${v === 1 ? LOOT[k].one : LOOT[k].many}`).join(', ')}. Each is used when it is needed.`);
  }; }
function carryUse(k){ G.carry[k]--; G.carryFx = {k, t:60}; applyLoot(k, {x:G.leader.x, y:G.leader.y}); }
{ const f = update; update = function(){
    f();
    if (!G || G.over || !G.carry || G.frame % 20 || G.leader.down && !G.carry.poultice) return;
    const L = G.leader, C = G.carry, foes = G.enemies.filter(e => !e.dead && !e.dormant && BESTIARY[e.k].arch !== 'fixed');
    const near = r => foes.filter(e => dist(e, L) < r).length;
    if (C.poultice > 0){ const hurt = (L.maxCon - L.con) + G.squad.reduce((a, m) => a + (m.state === 'up' ? m.maxCon - m.con : m.state !== 'dead' ? 4 : 0), 0);
      if (L.down || G.squad.some(m => m.state === 'bleeding') || hurt >= 6) return carryUse('poultice'); }
    if (C.cusser > 0 && near(150) >= 7) return carryUse('cusser');
    if (C.scroll > 0 && near(420) >= 10) return carryUse('scroll');
    if (C.smoke > 0 && !G.smokeT && foes.filter(e => RANGED_ARCH(BESTIARY[e.k].arch) && dist(e, L) < 380).length >= 3) return carryUse('smoke');
    if (C.storm > 0 && !G.stormT && near(200) >= 6) return carryUse('storm');
    if (C.ward > 0 && G.wards === 0 && G.shieldPool === 0 && G.frame - G.lastContact < 60) return carryUse('ward');
    if (C.wafer > 0 && G.luck < L.s.luck) return carryUse('wafer');
  }; }
{ const f = drawHUD; drawHUD = function(){
    f();
    if (!G || !G.carry) return;
    /* U-slice 3: the icons are drawn in the Deck's right column now (hud-deck.js D.carried); only the flash timer runs here */
    if (G.carryFx && --G.carryFx.t <= 0) G.carryFx = null;
    ctx.textAlign = 'left';
  }; }

/* ---------------------------------------------------------------------------
   FREED CAPTIVES: most thank you with coin (85%); some ask to join (13%):
   at once if there is room in the squad, otherwise they walk to the camp and
   join the roster after the contract. Very rarely (2%) the captive is a
   specialist who goes to the camp and runs an unstaffed building, with its
   Veteran Mastery.
--------------------------------------------------------------------------- */
const THANKS = ['"Gods keep you. Here, it is all I have."', '"I thought I would die in there. Take this."', '"My family will hear your name. For your trouble."',
  '"They took everything but this. It is yours."', '"Bless the Chapter. Bless all of you."'];
function specialistFor(){
  const open = FACILITIES.filter(f => has(f.id) && VETERANS[f.id] && !staffOf(f.id) && PLOTS[f.id]);
  if (!open.length) return null;
  const f = pickOf(open), key = pickOf(VETERANS[f.id].match);
  const race = RACES[key] ? key : rollRace(), cls = CLASSES[key] ? key : CLASS_ORDER[d6() - 1], spec = SPECS[key] ? key : pickOf(SPEC_ORDER);
  const m = makeMate(race, cls, spec, randomName(race)); m.id = META.nextId++; m.adv = 3; m.conTrained = 1; m.facility = f.id;
  return {m, f};
}
{ const f = applyLoot; applyLoot = function(kind, at){
    if (kind !== 'captive' || !G) return f(kind, at);
    const D = LOOT.captive; SFX.play('chest');
    for (let i = 0; i < 14; i++) G.fx.push({x:at.x, y:at.y - 6, vx:rnd(-2, 2), vy:rnd(-3, -.5), life:rnd(18, 34), c:D.col, px:2});
    G.captivesFreed++; liberationDeed(1);
    const r = Math.random(), story = inStoryNow();
    G.campBound = G.campBound || [];
    if (r < 0.02 && !story){
      const sp = specialistFor();
      if (sp){ G.campBound.push({m:sp.m, vet:sp.f.id}); SFX.play('win'); G.slowmo = 40;
        pop(at.x, at.y - 30, 'A SPECIALIST!', '#ffd860');
        note(`${sp.m.name}, a ${RACES[sp.m.race].name} ${SPECS[sp.m.spec].name}, owes you their life. They will go to your camp and run the ${sp.f.name}.`); return; }
    }
    if (r < 0.15){
      const m = rollRecruit('SLAVE'); m.id = META.nextId++; if (allied('suderia')) m.conTrained = 1;
      if (G.squad.filter(x => x.state !== 'dead').length < 5){
        m.newHire = true; const u = runMate(m, G.squad.length); u.x = at.x; u.y = at.y; G.squad.push(u); G.hired.push(m); buildAbilities();
        pop(at.x, at.y - 30, 'JOINS THE SQUAD', '#8fd39a'); note(`${m.name}, a ${RACES[m.race].name} ${SPECS[m.spec].name}, picks up a weapon and joins the squad.`);
      } else { G.campBound.push({m}); pop(at.x, at.y - 30, 'HEADS FOR YOUR CAMP', '#8fd39a');
        note(`${m.name}, a ${RACES[m.race].name} ${SPECS[m.spec].name}, wants to join. The squad is full, so they will wait for you at camp.`); }
      return;
    }
    const gold = 10 + d6() * 5 + (G.contract.tier || 1) * 10; G.coin += gold;
    pop(at.x, at.y - 30, '+' + gold + ' COIN', '#ffd700'); note(`${pickOf(THANKS)} The freed captive gives you ${gold} coin.`);
  }; }
{ const f = endDeployment; endDeployment = function(result){
    const was = G && G.over;
    f(result);
    if (!G || was || !G.campBound || !G.campBound.length) return;
    const lines = [];
    for (const c of G.campBound){
      if (c.vet && has(c.vet) && !staffOf(c.vet)){ (META.retired = META.retired || []).push(c.m);
        lines.push(`<p class="good"><b>${esc(c.m.name)}</b>, the ${SPECS[c.m.spec].name} you freed, has taken charge of the ${facility(c.vet).name}${vetMatches(c.m, c.vet) ? ': <b>Veteran Mastery</b> is active' : ''}.</p>`); }
      else { delete c.m.facility; META.roster.push(c.m);
        lines.push(`<p class="good"><b>${esc(c.m.name)}</b>, a captive you freed, is waiting at camp and joins the roster.${META.roster.length > rosterCap() ? ' The roster is over capacity: release someone before the next muster.' : ''}</p>`); }
    }
    G.campBound = [];
    CAMP.dirty = true; saveMeta();
    if (renderDebrief.last){ renderDebrief.last.lines.push(...lines); renderDebrief(renderDebrief.last.head, renderDebrief.last.lines); }
  }; }

/* ---------------------------------------------------------------------------
   PAINTED PORTRAITS: 48 x 56 pixels, lit from the upper left, in the spirit
   of old painted RPG portraits. Every person gets a pose, an expression, a
   slight turn of the head, and details of their own; scars and a missing eye
   show; the light catches the edge of the figure against a coloured ground.
--------------------------------------------------------------------------- */
function drawPortrait2(o, bg, who){
  const W = 48, H = 56, c = newCanvas(W, H), g = c.getContext('2d');
  const seed = hash((who && (who.name + ':' + (who.id || 'L'))) || JSON.stringify([o.skin, o.hair, o.hairStyle, o.head])), R = rng(seed);
  const pick = a => a[R() * a.length | 0];
  const buf = new Array(W * H).fill(null);
  const put = (x, y, col) => { x = x | 0; y = y | 0; if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = col; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? buf[y * W + x] : null;
  const ramp = base => [shade(base, .42), shade(base, .6), shade(base, .78), shade(base, .92), base, shade(base, 1.16), shade(base, 1.32)];
  const LX = -0.55, LY = -0.62, LZ = 0.56;
  const lit = (rp, nx, ny, nz, x, y, bias = 0) => {
    let d = LX * nx + LY * ny + LZ * nz; d = (d + 1) / 2 + bias;
    const v = d * 6.2 + (((x + y) & 1) ? 0.22 : -0.22) + ((hash(x * 31 + y * 17 + seed) & 7) - 3.5) * 0.04;
    return rp[Math.max(0, Math.min(6, Math.floor(v)))];
  };
  const fem = o.sex === 'f';
  const skin = o.skin || '#e8b48a', SK = ramp(skin), hair = o.hair || '#3a2a1a', HR = ramp(hair);
  const top = o.robe ? (o.robeCol || o.top || '#6a5a44') : (o.top || '#7a6a4e'), TP = ramp(top);
  // who this is: pose and face
  const turn = pick([-1, 0, 0, 1]), tilt = pick([-1, 0, 0, 0, 1]);
  const pose = pick(['neutral', 'neutral', 'weapon', 'weapon', 'weapon']);
  const mood = pick(fem ? ['calm', 'smirk', 'stern', 'smile', 'wry', 'fierce'] : ['stern', 'smirk', 'grin', 'calm', 'fierce', 'wry']);
  const injuries = (who && who.injuries) || [];
  const scar = injuries.length > 0 || R() < 0.18, patch = injuries.includes('eye');
  const earring = R() < (fem ? 0.45 : 0.18), necklace = R() < 0.3;
  const paint = (who && ['ORC', 'HALF_ORC', 'GOBLIN'].includes(who.race) && R() < 0.5) || (o.robe && o.head === 'witch' && R() < 0.5);
  // ---- background: a lit ground with a vignette
  const B = bg || '#3a3226', BR = ramp(B);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const d = Math.hypot((x - 16) / W, (y - 14) / H) * 2.2, v = 5 - d * 4.2 + (((x + y) & 1) ? 0.3 : -0.3);
    g.fillStyle = BR[Math.max(0, Math.min(5, Math.floor(v)))]; g.fillRect(x, y, 1, 1);
  }
  // geometry
  const big = o.bulky ? 1 : 0, hx = 23 + turn, hy = 23 + (o.short ? 1 : 0), rx = 11.5 + big + (fem ? -0.7 : 0), ry = 14.5;
  const taper = fem ? 0.42 : o.bulky ? 0.18 : 0.3;
  const cxAt = y => hx + tilt * (hy - y) / 12;
  const headN = (x, y) => { const dy = (y - hy) / ry, w = rx * (dy > 0 ? 1 - taper * dy * dy : 1), dx = (x - cxAt(y)) / w; const r2 = dx * dx + dy * dy; return r2 <= 1 ? [dx, dy, Math.sqrt(1 - r2)] : null; };
  const fx = hx + turn * 3;          // the centre line of the face
  // ---- cape behind the shoulders
  if (o.cape){ const CP = ramp(o.cape);
    for (let y = 38; y < H; y++) for (let x = 0; x < W; x++){ const dx = (x - 24) / 25, dy = (y - 64) / 25; if (dx * dx + dy * dy <= 1) put(x, y, lit(CP, dx, dy, .4, x, y, -.08)); } }
  // ---- long hair behind
  const hs = o.hairStyle || 'short', covered = ['helmet', 'wizard', 'witch'].includes(o.head);
  const longHair = hs !== 'bald' && (hs === 'long' || hs === 'braids' || (fem && hs !== 'bun'));
  if (longHair && o.head !== 'hood') for (let y = hy - 6; y < hy + ry + 12; y++) for (let x = 0; x < W; x++){
    const dx = (x - cxAt(y)) / (rx + 3.5), dy = (y - hy - 2) / (ry + 9); if (dx * dx + dy * dy > 1 || Math.abs(dx) < 0.55 && y > hy + 2) continue;
    put(x, y, lit(HR, dx * .8, dy * .5, .5, x, y, ((x * 3 + y) % 5 === 0) ? -.12 : 0)); }
  if (hs === 'ponytail' && !covered) for (let y = hy - 4; y < hy + 16; y++){ const x0 = cxAt(y) - rx - 2 + Math.sin(y / 4); for (let k = 0; k < 4; k++) put(x0 + k, y, HR[(k + (y & 1)) % 2 ? 3 : 2]); }
  if (hs === 'bun' && !covered) for (let y = hy - ry - 2; y < hy - ry + 6; y++) for (let x = hx - 13; x < hx - 3; x++){ const dx = (x - (hx - 8)) / 5, dy = (y - (hy - ry + 2)) / 4; if (dx * dx + dy * dy <= 1) put(x, y, lit(HR, dx, dy, .6, x, y)); }
  // ---- halo behind the head
  if (o.halo) for (let a = 0; a < 80; a++){ const t = a / 80 * TAU; put(hx + Math.cos(t) * 12, hy - ry - 1 + Math.sin(t) * 3, a % 3 ? '#ffe680' : '#fff4c0'); }
  // ---- shoulders and chest
  const sw = 21 + big;
  for (let y = 38; y < H; y++) for (let x = 0; x < W; x++){
    const dx = (x - 24) / sw, dy = (y - 64) / 24; if (dx * dx + dy * dy > 1) continue;
    const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    let col = lit(TP, dx, dy, nz, x, y);
    const ap = o.armour;
    if (ap === 'chain' && (x + y) % 2 === 0) col = shade(col, .9);
    if (ap === 'scale' && y % 3 === 0 && (x + (y >> 1)) % 3 !== 0) col = shade(col, .88);
    if (ap === 'studs' && y % 3 === 1 && x % 3 === 1) col = '#d4af37';
    if ((ap === 'quilt' || ap === 'bands') && y % 4 === 0 && (x % 6)) col = shade(col, .9);
    if (ap === 'plate' && Math.abs(x - 24) < 2 && y > 40) col = shade(col, 1.25);
    if (ap === 'fur' && y < 44) col = lit(ramp('#c8b090'), dx, dy, nz, x, y, (hash(x * 7 + y) & 3) * .03);
    put(x, y, col);
  }
  if (o.armour === 'plate') for (const s of [-1, 1]) for (let y = 39; y < 50; y++) for (let x = 0; x < W; x++){ const dx = (x - (24 + s * 15)) / 8, dy = (y - 44) / 5; if (dx * dx + dy * dy <= 1) put(x, y, lit(ramp(shade(top, 1.1)), dx, dy, .6, x, y)); }
  if (o.robe && o.acc){ for (let y = 45; y < H; y++){ put(22, y, o.acc); put(26, y, o.acc); } }
  else if (o.acc) for (let y = 46; y < H; y++) for (let k = -2; k <= 2; k++) put(24 + k, y, shade(o.acc, k < 0 ? 1.1 : .9));
  if (o.cape && o.capeTrim) for (let y = 41; y < H; y++){ const dx = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 64) / 24) ** 2)) * sw); put(24 - dx + 1, y, o.capeTrim); put(24 + dx - 1, y, o.capeTrim); }
  if (o.cape){ put(14, 43, C.gold); put(15, 43, '#fff2a0'); put(33, 43, C.gold); put(32, 43, '#fff2a0'); }
  // ---- neck
  for (let y = hy + 9; y < 45; y++) for (let x = hx - 5; x <= hx + 5; x++){ const nx = (x - hx) / 5.5; put(x, y, lit(SK, nx, .2, Math.sqrt(1 - nx * nx * .9), x, y, y < hy + 15 ? -.16 : -.05)); }
  if (necklace) for (let x = hx - 5; x <= hx + 5; x++) put(x, 43 + Math.round(Math.abs(x - hx) / 3), x === hx ? '#87ceeb' : C.gold);
  // ---- the head
  for (let y = hy - ry - 1; y <= hy + ry + 1; y++) for (let x = 0; x < W; x++){
    const n = headN(x, y); if (!n) continue;
    let col = lit(SK, n[0] - turn * .15, n[1], n[2], x, y);
    if (n[1] > .55 && Math.abs(n[0]) < .5) col = lit(SK, n[0], n[1] + .3, n[2], x, y);     // under the chin
    put(x, y, col);
  }
  // cheeks, jaw shadow
  for (let y = hy + 2; y < hy + 7; y++){ put(fx + 7, y, SK[2]); put(fx + 8, y, SK[1]); if (fem){ put(fx - 6, y, '#d89080'); put(fx - 7, y, shade(skin, .95)); } }
  // ---- ears
  const ear = (side) => { const ex = Math.round(cxAt(hy) + side * (rx + .5)), col = side < 0 ? SK[4] : SK[2];
    if (o.ears === 'elf'){ for (let k = 0; k < 7; k++){ put(ex + side * Math.floor(k / 2), hy + 1 - k, col); put(ex + side * Math.floor(k / 2), hy + 2 - k, SK[3]); } }
    else if (o.ears === 'big'){ for (let k = 0; k < 6; k++) for (let j = 0; j < 4 - (k >> 1); j++) put(ex + side * (k), hy - 2 + j, col); }
    else { put(ex, hy, col); put(ex, hy + 1, col); put(ex, hy + 2, SK[2]); put(ex + side, hy + 1, SK[1]); }
    if (earring && side === -1) { put(ex, hy + 4, C.gold); put(ex, hy + 5, '#fff2a0'); }
  };
  if (o.head !== 'hood') { ear(-1); ear(1); }
  // ---- hair on top
  if (!covered && hs !== 'bald' && o.head !== 'hood'){
    for (let y = hy - ry - 3; y < hy + 4; y++) for (let x = 0; x < W; x++){
      const n = headN(x, y), dy = (y - hy) / ry, dx = (x - cxAt(y)) / rx, line = -0.42 + Math.sin(x * 1.3 + seed) * 0.05 + (hs === 'messy' ? Math.sin(x * 2.1) * .08 : 0);
      const cap = n && dy < line, side = n && Math.abs(dx) > 0.84 && dy < 0.2 && !longHair, over = !n && dy < -0.65 && Math.abs(dx) < 1.05 && dx * dx + (dy + .05) * (dy + .05) < 1.25;
      if (cap || side || over) put(x, y, lit(HR, dx, dy, .55, x, y, ((x * 5 + y * 3) % 7 === 0) ? -.15 : 0));
    }
    if (hs === 'messy') for (let k = 0; k < 6; k++){ const x = hx - 7 + k * 3; put(x, hy - ry - 3, HR[3]); put(x + 1, hy - ry - 4, HR[4]); }
    if (hs === 'topknot') for (let y = hy - ry - 6; y < hy - ry; y++) for (let x = hx - 2; x <= hx + 2; x++) put(x, y, lit(HR, (x - hx) / 3, (y - hy + ry + 3) / 3, .6, x, y));
    if (longHair) for (let y = hy - 6; y < hy + 8; y++){ put(cxAt(y) - rx + 1, y, HR[3]); put(cxAt(y) + rx - 1, y, HR[2]); }
  }
  if (hs === 'bald' && !covered){ put(hx - 3, hy - ry + 2, SK[6]); put(hx - 2, hy - ry + 2, SK[6]); put(hx - 3, hy - ry + 3, SK[5]); }
  // ---- beard and moustache
  const beard = o.beard && !fem, mouthY = hy + 9 + (o.nose ? 2 : 0);
  if (beard){
    for (let y = hy + 1; y < hy + ry + 5; y++) for (let x = 0; x < W; x++){
      const n = headN(x, y), dy = (y - hy) / ry, below = !n && y > hy + 6 && Math.abs(x - cxAt(y)) < rx * (1 - (y - hy - ry) / 8) * .9 && y <= hy + ry + 4;
      if ((n && dy > 0.12 && Math.abs(n[0]) > 0.15 - (dy > .5 ? 1 : 0)) || below){ if (Math.abs(x - fx) < 4 && y >= mouthY - 1 && y <= mouthY + 2) continue;
        put(x, y, lit(HR, (x - hx) / rx, .3, .6, x, y, ((x + y * 2) % 4 === 0) ? -.15 : 0)); }
    }
  }
  // ---- warpaint and marks
  if (paint) for (let k = 0; k < 5; k++){ put(fx - 8 + k, hy + 3 + (k >> 1), o.acc || '#7a1a1a'); put(fx + 4 + k, hy + 3 + (k >> 1), o.acc || '#7a1a1a'); put(fx - 8 + k, hy + 5 + (k >> 1), o.acc || '#7a1a1a'); }
  if (o.marks) for (const [x, y] of [[fx - 5, hy + 2], [fx + 5, hy + 3], [fx - 4, hy + 4], [fx, hy - 6]]) put(x, y, '#bff6ff');
  // ---- eyes and brows
  const eyeY = hy, eyeC = o.eye || pick(['#3a6a9a', '#4a7a3a', '#5a3a1a', '#2a2a2a', '#6a5a3a', '#7a5a9a']);
  const browT = {stern:[2, 0], fierce:[3, 0], calm:[0, 0], smirk:[0, 2], wry:[1, -1], grin:[-1, 0], smile:[-1, 0]}[mood];
  const browC = shade(o.head === 'helmet' || hs === 'bald' ? '#3a2a1a' : hair, .75);
  for (const side of [-1, 1]){
    const ex = side < 0 ? fx - 7 : fx + 2;           // left edge of a 5-pixel eye
    if (patch && side === 1){ for (let y = eyeY - 3; y <= eyeY + 2; y++) for (let x = ex - 1; x <= ex + 5; x++) if (Math.hypot((x - ex - 2) / 3.6, (y - eyeY) / 2.8) <= 1) put(x, y, (x + y) % 3 ? '#1a1410' : '#2a2420'); continue; }
    // socket shadow, white, iris, pupil, highlight, lids
    for (let k = -1; k <= 5; k++) put(ex + k, eyeY - 2, SK[2]);
    put(ex, eyeY, '#e8e0d4'); put(ex + 4, eyeY, '#cfc6b8');
    put(ex + 1, eyeY, shade(eyeC, .7)); put(ex + 2, eyeY, eyeC); put(ex + 3, eyeY, shade(eyeC, .7));
    put(ex + 2, eyeY, '#140e0a'); put(ex + 1, eyeY - 1 + 1, shade(eyeC, .85)); put(ex + 3, eyeY - 1 + 1, shade(eyeC, .6)); put(ex + 1, eyeY, '#fff');
    for (let k = 0; k < 5; k++) put(ex + k, eyeY - 1, k === 0 || k === 4 ? '#3a2418' : '#1e120c');
    for (let k = 1; k < 4; k++) put(ex + k, eyeY + 1, SK[3]);
    if (fem){ put(ex + (side < 0 ? -1 : 5), eyeY - 1, '#1e120c'); put(ex + (side < 0 ? -1 : 5), eyeY - 2, '#1e120c'); }
    // brows: thick, angled by mood (inner end lower when stern)
    const by = eyeY - 4, t = browT[0], raise = side > 0 ? browT[1] : 0;
    for (let k = 0; k < 6; k++){ const innerness = side < 0 ? k / 5 : (5 - k) / 5, yy = by + Math.round(innerness * t * .6) - raise + (k === (side < 0 ? 0 : 5) ? 1 : 0);
      put(ex - (side < 0 ? 1 : 0) + k, yy, browC); if (!fem) put(ex - (side < 0 ? 1 : 0) + k, yy - 1, shade(browC, 1.15)); }
  }
  if (o.mask){ for (let y = hy + 3; y < hy + ry + 1; y++) for (let x = 0; x < W; x++){ const n = headN(x, y); if (n && (y - hy) / ry > .18) put(x, y, lit(ramp('#24242c'), n[0], n[1], n[2], x, y)); } }
  else {
    // ---- nose: a lit bridge, a shadowed side, nostrils
    const nl = o.nose ? 8 : 6;
    for (let y = eyeY - 1; y < eyeY + nl; y++){ put(fx - 1, y, SK[5]); put(fx, y, SK[4]); put(fx + 1, y, SK[2]); if (y > eyeY + 2) put(fx + 2, y, SK[1]); }
    const ny = eyeY + nl; put(fx - 2, ny, SK[2]); put(fx - 1, ny, SK[1]); put(fx, ny, SK[3]); put(fx + 1, ny, SK[1]); put(fx + 2, ny, SK[1]); put(fx - 1, ny - 1, SK[4]); put(fx + 2, ny + 1, SK[2]);
    if (o.nose) for (let y = eyeY + 3; y < ny; y++){ put(fx - 2, y, SK[5]); put(fx + 3, y, SK[2]); }
    // ---- mouth
    const my = ny + 3, lip = fem ? '#a84850' : shade(skin, .5), lipL = fem ? '#c86870' : shade(skin, .72);
    const M = {stern:[0, 0, 0, 0, 0, 0, 0], calm:[0, 0, 0, 0, 0, 0, 0], smirk:[0, 0, 0, 0, 0, -1, -1], wry:[-1, 0, 0, 0, 0, 0, 1], grin:[-1, 0, 0, 0, 0, 0, -1], smile:[-1, 0, 0, 0, 0, 0, -1], fierce:[1, 0, 0, 0, 0, 0, 1]}[mood];
    for (let k = 0; k < 7; k++) put(fx - 3 + k, my + M[k], lip);
    if (mood === 'grin' || mood === 'fierce'){ for (let k = 1; k < 6; k++) put(fx - 3 + k, my + 1, k === 3 ? '#d8d0c4' : '#f4efe4'); for (let k = 1; k < 6; k++) put(fx - 3 + k, my + 2, lip); }
    else for (let k = 1; k < 6; k++) put(fx - 3 + k, my + 1, fem ? lipL : SK[2]);
    for (let k = -1; k <= 1; k++) put(fx + k, my + 3 + (mood === 'grin' ? 1 : 0), SK[2]);
    if (beard){ for (let k = -4; k <= 4; k++){ put(fx + k, my - 1, HR[k < 0 ? 4 : 3]); put(fx + k, my - 2, HR[k < 0 ? 3 : 2]); } put(fx - 5, my, HR[3]); put(fx + 5, my, HR[2]); }
    if (o.tusks){ for (const sx of [-3, 3]){ put(fx + sx, my - 1, C.bone); put(fx + sx, my - 2, '#fff8e8'); put(fx + sx, my - 3, C.bone); } }
  }
  if (scar) for (let k = 0; k < 8; k++) put(fx - 9 + k, eyeY - 4 + k + (k > 3 ? 1 : 0), k % 2 ? '#d8a0a0' : '#b87070');
  if (patch) for (let k = 0; k < 14; k++) put(fx - 6 + k, eyeY - 7 + Math.floor(k / 3), '#1a1410');
  // ---- horns
  if (o.horns) for (const s of [-1, 1]) for (let k = 0; k < 9; k++){ const x = hx + s * (5 + Math.floor(k / 2)), y = hy - ry - k + 3 + Math.floor(k * k / 14); put(x, y, k < 3 ? '#d8ccb0' : C.bone); put(x + s, y, '#b8ac90'); }
  // ---- headgear
  const helm = o.helm || C.steel, HM = ramp(helm);
  if (o.head === 'helmet'){
    for (let y = hy - ry - 2; y < hy + 3; y++) for (let x = 0; x < W; x++){
      const dx = (x - cxAt(y)) / (rx + 1.3), dy = (y - hy) / (ry + 1.3); if (dx * dx + dy * dy > 1) continue;
      const face = Math.abs(x - fx) < 6 && y > eyeY - 3 && Math.abs(x - fx) > 0;
      if (dy < -0.28 || (Math.abs(dx) > 0.7 && dy < 0.25) || (!face && y > eyeY - 3 && Math.abs(dx) > .62)){ put(x, y, lit(HM, dx, dy, Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)), x, y)); }
    }
    for (let y = hy - ry - 2; y < eyeY - 3; y++) put(hx - 1, y, HM[6]);
    for (let y = eyeY - 4; y < eyeY + 4; y++){ put(fx, y, HM[5]); put(fx + 1, y, HM[3]); }
    for (let x = hx - 9; x <= hx + 9; x++) put(x, eyeY - 4, HM[2]);
    if (o.acc) for (let k = 0; k < 14; k++){ const x = hx - 6 + k, y = hy - ry - 2 - Math.round(Math.sin(k / 13 * Math.PI) * 4); for (let j = 0; j < 3; j++) put(x, y + j, shade(o.acc === '#7a3e26' ? '#9b2d24' : o.acc, 1.1 - j * .15)); }
  }
  if (o.head === 'hood'){ const hd = o.hood || '#4e6b2c', HD = ramp(hd);
    for (let y = hy - ry - 4; y < H; y++) for (let x = 0; x < W; x++){
      const dx = (x - cxAt(y)) / (rx + 4.5), dy = (y - hy - 1) / (ry + 5); if (dx * dx + dy * dy > 1 && !(y > hy + 6 && Math.abs(x - 24) < rx + 7 - (y - hy - 6) * 0)) continue;
      if (y > hy + 14) { if (Math.abs(x - 24) > 12) continue; }
      const n = headN(x, y), inFace = n && (y - hy) / ry > -0.55 && Math.abs(n[0]) < 0.9;
      if (inFace) { const dy2 = (y - hy) / ry; if (dy2 < -0.38 || Math.abs(n[0]) > .78) put(x, y, shade(get(x, y) || skin, .62)); continue; }
      put(x, y, lit(HD, dx, dy, .5, x, y));
    } }
  if (o.head === 'circlet'){ for (let x = hx - rx; x <= hx + rx; x++) put(x, eyeY - 5, x % 2 ? C.gold : '#fff2a0'); put(fx, eyeY - 5, '#87ceeb'); put(fx, eyeY - 6, '#cfefff'); }
  if (o.head === 'bandana'){ const ac = o.acc || '#9b2d24'; for (let y = eyeY - 7; y < eyeY - 3; y++) for (let x = hx - rx - 1; x <= hx + rx + 1; x++) if (headN(x, y) || Math.abs(x - hx) <= rx + 1) put(x, y, lit(ramp(ac), (x - hx) / rx, -.3, .7, x, y));
    for (let k = 0; k < 6; k++){ put(hx + rx + 1 + (k >> 1), eyeY - 4 + k, ac); } }
  if (o.head === 'cap'){ for (let y = hy - ry - 2; y < eyeY - 3; y++) for (let x = 0; x < W; x++){ const n = headN(x, y + 1); if (n || Math.abs(x - hx) < rx) put(x, y, lit(ramp('#2a2a30'), (x - hx) / rx, -.5, .6, x, y)); }
    for (let x = hx; x < hx + rx + 6; x++) put(x, eyeY - 3, '#1a1a20'); }
  if (o.head === 'tricorn'){ for (let y = hy - ry - 4; y < eyeY - 3; y++) for (let x = 2; x < W - 2; x++){ const dx = (x - hx) / 17, dy = (y - (eyeY - 4)) / 9; if (dx * dx + dy * dy <= 1 && (y > eyeY - 7 || Math.abs(x - hx) < 9)) put(x, y, lit(ramp('#1a1414'), dx, dy, .5, x, y)); }
    for (let x = hx - 9; x <= hx + 9; x++) put(x, eyeY - 6, C.gold); for (let y = hy - ry - 8; y < hy - ry; y++) put(hx - 10 + (y & 1), y, '#f0f0f0'); }
  if (o.head === 'wizard' || o.head === 'witch'){ const hat = o.hat || '#333', HT = ramp(hat), witch = o.head === 'witch', by = eyeY - 4;
    for (let y = by - 2; y <= by + 2; y++) for (let x = 0; x < W; x++){ const dx = (x - hx) / (witch ? 21 : 18), dy = (y - by) / 2.5; if (dx * dx + dy * dy <= 1) put(x, y, lit(HT, dx, dy * .3, .6, x, y, -.05)); }
    for (let y = 0; y < by - 1; y++){ const t = (by - 1 - y) / (by - 1), w = (1 - t) * 9 + 1, cx2 = hx + (witch ? -t * t * 10 : t * 3); for (let x = Math.floor(cx2 - w); x <= cx2 + w; x++) put(x, y, lit(HT, (x - cx2) / (w + .5), -.2, .6, x, y)); }
    for (let x = hx - 9; x <= hx + 9; x++) put(x, by - 2, witch ? (o.acc || '#7ac05a') : C.gold);
    if (!witch){ put(hx + 2, by - 9, '#ffe680'); put(hx + 1, by - 8, '#ffe680'); put(hx + 3, by - 8, '#ffe680'); put(hx + 2, by - 7, '#ffe680'); } }
  // ---- hands and weapons
  const skinHand = (cx, cy) => { for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 4; x <= cx + 4; x++){ const dx = (x - cx) / 4.5, dy = (y - cy) / 3.6; if (dx * dx + dy * dy <= 1) put(x, y, lit(SK, dx, dy, .6, x, y)); }
    for (let k = -2; k <= 2; k += 2) put(cx + k, cy - 1, SK[1]); };
  const w = o.weapon;
  if (pose === 'weapon' && w){
    const X = 40;
    if (w === 'staff'){ for (let y = 2; y < H; y++){ put(X, y, '#6a4422'); put(X + 1, y, '#8a5a2b'); } const orb = o.orb || '#9fe0ff';
      for (let y = 0; y < 7; y++) for (let x = X - 3; x <= X + 4; x++){ const dx = (x - X - .5) / 3.5, dy = (y - 3) / 3.2; if (dx * dx + dy * dy <= 1) put(x, y, lit(ramp(orb), dx, dy, .7, x, y, .1)); } }
    else if (w === 'bow'){ for (let y = 4; y < H; y++){ const x = X + Math.round(Math.sin((y - 4) / (H - 4) * Math.PI) * 5); put(x, y, '#8a5a2b'); put(x + 1, y, '#5a3a1a'); } for (let y = 4; y < H; y++) put(X - 1, y, '#e8e0d0'); }
    else if (['spear', 'pike', 'pitchfork'].includes(w)){ for (let y = 0; y < H; y++){ put(X, y, '#6a4422'); put(X + 1, y, '#8a5a2b'); } for (let y = 0; y < 6; y++) for (let x = X - 1 - (y >> 1); x <= X + 2 + (y >> 1) && y < 6; x++) if (Math.abs(x - X - .5) <= (5 - y) / 2 + 1) put(x, y, x <= X ? C.steelL : C.steel); }
    else if (w === 'mace' || w === 'hammer' || w === 'club'){ for (let y = 12; y < H; y++){ put(X, y, '#6a4422'); put(X + 1, y, '#8a5a2b'); } for (let y = 5; y < 13; y++) for (let x = X - 3; x <= X + 4; x++) put(x, y, lit(HM, (x - X) / 4, (y - 9) / 4, .6, x, y)); }
    else { const long = w === 'greatsword'; for (let y = long ? 0 : 8; y < 40; y++){ put(X, y, C.steelL); put(X + 1, y, C.steel); put(X + 2, y, C.steelD); } put(X + 1, long ? 0 : 7, C.steelL);
      for (let x = X - 4; x <= X + 6; x++){ put(x, 40, C.gold); put(x, 41, C.goldD); } for (let y = 42; y < 47; y++){ put(X, y, '#5a3a1a'); put(X + 1, y, '#3a2410'); } }
  }
  if (pose === 'chin' && !o.mask){ const cx = fx - 3, cy = hy + ry + 2;
    for (let y = cy + 2; y < H; y++) for (let x = cx - 4 - Math.floor((y - cy) / 3); x <= cx + 4 - Math.floor((y - cy) / 3); x++) put(x, y, lit(TP, (x - cx) / 6, .3, .6, x, y));
    skinHand(cx, cy); }
  if (pose === 'arms') for (let y = 47; y < 54; y++) for (let x = 7; x < 41; x++){ const dy = (y - 50.5) / 3.5; put(x, y, lit(TP, (x - 24) / 20, dy, .7, x, y, .05)); }
  if (pose === 'arms'){ skinHand(9, 50); skinHand(39, 49); }
  // ---- rim light and outline
  const filled = (x, y) => !!get(x, y);
  const lightRim = shade(B, 1.45);
  const out = new Array(W * H).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const col = get(x, y);
    if (col){ out[y * W + x] = (!filled(x + 1, y) && x + 1 < W) ? shade(col, 1.18) : col; continue; }
    if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) out[y * W + x] = filled(x - 1, y) && x > 24 ? lightRim : '#140e0a';
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[y * W + x]){ g.fillStyle = out[y * W + x]; g.fillRect(x, y, 1, 1); }
  // frame
  g.fillStyle = '#140e0a'; g.fillRect(0, 0, W, 1); g.fillRect(0, H - 1, W, 1); g.fillRect(0, 0, 1, H); g.fillRect(W - 1, 0, 1, H);
  return c;
}
drawPortrait = (o, bg) => drawPortrait2(o, bg, null);
portraitURL = function(p, isLeader){
  return toURL('por5:' + personKey(p, isLeader), () => drawPortrait2(personLook(p, isLeader), portraitBg(p, isLeader), p), 3);
};
(function(){
  const st = document.createElement('style');
  st.textContent = `.mc-por{width:80px !important;height:93px !important} .advcard .ap{height:70px} #camp-panel .pimg{height:130px}`;
  document.head.appendChild(st);
})();
{ const f = openManual; openManual = function(){ f(); const lg = $('manual-inner').querySelector('.log'); if (!lg) return;
    lg.insertAdjacentHTML('beforeend', `<p><b>Carried supplies.</b> Munitions, poultices and scrolls the squad starts a contract with (from salvage, veteran staff, allies or a Logistical Asset) are carried, shown top right, and used on their own when they are worth using: a Poultice ${CARRY_WHEN.poultice}, a Concussion Charge ${CARRY_WHEN.cusser}, Smoke Pots ${CARRY_WHEN.smoke}, a Fireball scroll ${CARRY_WHEN.scroll}.</p>
      <p><b>Freed captives.</b> Most thank you with coin. Some ask to join: at once if there is room, or they wait for you at camp. Very rarely, the captive is a specialist who goes to your camp and runs a building that has no veteran.</p>`); }; }
