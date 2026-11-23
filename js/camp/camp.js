/* js/camp/camp.js (INT-1 step 2, 2026-11-16): THE CAMP, CAMP RAIDS.
   Cut unchanged from the inline script in index.html (old lines 5618 to 6626). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   THE CAMP - the main menu is the Chapter's camp, drawn like the battlefield.
   Facilities are built on staked plots and appear on the map. Squad Mates
   between contracts walk the paths; the resting lie in the Field Hospital,
   the trained drill at the Training Grounds, retired veterans staff their
   buildings, and the Chapter Master wanders the camp. Click anything.
============================================================================ */
let CAMP_W = 1760, CAMP_H = 1180;   /* VO-3 sizes the fort to its layout (js/3d/vo3.js, V.hubSize) */
const CAMP = {on:false, running:false, t:0, cam:{x:240, y:160}, people:[], puffs:[], fx:[], drag:null,
              mouse:{x:-1, y:-1, wx:-1, wy:-1}, hover:null, panel:null, dirty:true, trees:null, decor:null, drift:false};
const PLOTS = {
  tents:[640,470], kitchen:[760,760], tavern:[1000,790], command:[880,350], merchant:[1160,700], cells:[1450,430],
  barracks:[420,520], training:[380,760], armoury:[560,330], stables:[300,330], ranger:[1480,860], hospital:[560,880],
  blacksmith:[1200,400], carpentry:[1330,560], leather:[1330,300], engineering:[1290,860], alchemy:[760,960],
  magetower:[1040,980], chapel:[420,980]
};
const HUB = {house:{x:880, y:540}, wagon:{x:1010, y:630}, fire:{x:880, y:680}};
const GRAVE = {x:1590, y:650, w:190, h:120};
const BSCALE = 3.3;

/* ---------------------------------------------------------------------------
   ART for the camp
--------------------------------------------------------------------------- */
function lookCanvas(key, look){
  if (SPR['bc:' + key]) return SPR['bc:' + key];
  const c = newCanvas(34, 36), g = c.getContext('2d'); g.translate(1, 3);
  drawBuilding(painter(g), look); g.setTransform(1, 0, 0, 1, 0, 0);
  return SPR['bc:' + key] = outline(c);
}
let facilityCanvas = id => skinFacilityCanvas(id);
const houseCanvas = () => skinHouseCanvas();
const wagonSprite = () => simpleSprite('qmwagon', 34, 24, P => {
  P(5, 3, 22, 10, '#e8dcc0'); P(5, 3, 22, 2, '#fff6e0'); for (let x = 8; x < 26; x += 5) P(x, 3, 2, 10, '#c8b890');
  P(4, 12, 25, 6, C.wood); P(4, 12, 25, 1, '#b08a5a'); P(4, 17, 25, 1, C.woodD);
  for (const wx of [7, 21]){ P(wx, 16, 7, 7, '#3a2a1c'); P(wx + 1, 17, 5, 5, '#6a4a2a'); P(wx + 3, 19, 1, 1, C.gold); }
  P(29, 15, 5, 2, C.woodD); P(13, 7, 6, 4, '#7a3e26'); glyph(P, 'coin', 26, 4, '#e8c040');
});
// The Chapter Master: an old veteran with a grey beard, a blue cloak and a staff.
function ensureMaster(){
  if (META.master) return META.master;
  const race = rollRace(), spec = ['SOLDIER','FOLK_HERO','CLERIC','SCOUNDREL'][Math.random() * 4 | 0];
  META.master = {id:'CM', name:randomName(race), race, cls:CLASS_ORDER[d6() - 1], spec};
  saveMeta(); return META.master;
}
function masterSprite(){
  const m = ensureMaster(), key = 'cm2:' + m.name + m.race + m.spec;
  if (SPR[key]) return SPR[key];
  const fem = sexOf(m) === 'f';
  const look = Object.assign({}, personLook(m, false), {hair:'#d8d4c8', hairStyle:fem ? 'bun' : 'short', beard:!fem, cape:'#2e4a6a', capeTrim:C.gold, back:null, hip:null, armour:null, rweapon:null, legs:'#2e3a44',
    head:undefined, weapon:'staff', orb:'#ffd860', top:'#3a4a5a', acc:'#d4af37', robe:true});
  return humanoidSprite(key, look);
}
const masterPortraitURL = () => masterBustURL();
// Planning-table art: wood, wax seals, the map of Arcadia and a few props.
/* PL-1 (AD ruling, 22 Nov): the table wood is painted like the 3D tavern boards (ground.js 'boards'), not pixel planks: planks 48 px high
   with staggered joins, a tone per plank, soft lengthwise grain in two octaves, a dark seam and a lit top edge, two soft nail heads at each
   join. One 288 px tile drawn smooth at 1x; the result is scaled to the old pixel planks' mean colour (WOOD_MEAN), so the table's tone stays put. */
const WOOD_MEAN = [100.08, 66.27, 39.19];
function tableWoodURL(){
  return toURL('wood', () => {
    const N = 288, PH = 48, c = newCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
    const tones = ['#6a4426', '#5e3c22', '#734a2a', '#64401f'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    const A = softNorm(softNoise(N, 3, 48, 4242)), B = softNorm(softNoise(N, 12, 144, 4243)), Cn = softNorm(softNoise(N, 6, 6, 4244));
    const joint = row => (row * 7 * 3) % N, sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    for (let y = 0; y < N; y++){ const row = (y / PH) | 0, my = y - row * PH, jx = joint(row), base = tones[row % 4];
      for (let x = 0; x < N; x++){ const i = y * N + x;
        let k = 1 + 0.07 * A[i] + 0.045 * B[i] + 0.03 * Cn[i];                                       // grain, long and fine, and a slow cloud
        k *= 1 - 0.5 * (1 - sm(0, 3, my)) - 0.45 * sm(PH - 4, PH, my);                              // the seam: dark under the plank above, dark at its own foot
        k *= 1 + 0.16 * sm(5, 3, my) * sm(0, 3, my);                                                // the lit top edge
        const dx = Math.min(Math.abs(x - jx), N - Math.abs(x - jx)); k *= 1 - 0.45 * (1 - sm(0.5, 2.5, dx));   // the butt join
        d[i * 4] = base[0] * k; d[i * 4 + 1] = base[1] * k; d[i * 4 + 2] = base[2] * k; d[i * 4 + 3] = 255; } }
    // scale to the old mean, channel by channel
    const m = [0, 0, 0]; for (let i = 0; i < d.length; i += 4){ m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; }
    const f = m.map((v, j) => WOOD_MEAN[j] / (v / (N * N)));
    for (let i = 0; i < d.length; i += 4){ d[i] = d[i] * f[0]; d[i + 1] = d[i + 1] * f[1]; d[i + 2] = d[i + 2] * f[2]; }
    g.putImageData(im, 0, 0);
    // nail heads: soft round, at each join, as the old ones were
    for (let row = 0; row < N / PH; row++){ const jx = joint(row);
      for (const ny of [9, 36]){ const x = (jx + 18) % N, y = row * PH + ny, gr = g.createRadialGradient(x - 0.6, y - 0.6, 0.2, x, y, 2.4);
        gr.addColorStop(0, '#b4b4aa'); gr.addColorStop(0.6, '#7a7a72'); gr.addColorStop(1, 'rgba(46,28,14,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); } }
    return c;
  }, 1);
}
function sealURL(glyphName, col){
  return toURL('seal:' + glyphName + col, () => {
    const c = newCanvas(18, 18), P = painter(c.getContext('2d')), d = shade(col, .65), l = shade(col, 1.25);
    P(4, 1, 10, 16, col); P(1, 4, 16, 10, col); P(2, 2, 14, 14, col); P(0, 7, 2, 4, col); P(16, 6, 2, 5, col); P(7, 0, 4, 2, col); P(6, 16, 5, 2, col);
    P(3, 3, 12, 12, d); P(4, 4, 10, 10, col); P(4, 4, 4, 2, l);
    glyph(P, glyphName, 5, 5, d);
    return outline(c);
  }, 3);
}
const FACTION_LOOK = {
  empire:{glyph:'sun', col:'#b8963a', at:[22, 46]}, suderia:{glyph:'horn', col:'#3a7a4a', at:[80, 44]},
  mendor:{glyph:'cross', col:'#c8c0a8', at:[34, 82]}, dwarves:{glyph:'anvil', col:'#6a6a7a', at:[52, 28]},
  reprobates:{glyph:'potion', col:'#6a3a8a', at:[70, 70]}, skulk:{glyph:'eye', col:'#3a3a40', at:[46, 58]}
};
function mapURL(){
  return toURL('arcadia', () => {
    const W = 160, H = 96, c = newCanvas(W, H), g = c.getContext('2d'), P = painter(g), r = rng(616);
    const n = valueNoise(W, H, 14, r), n2 = valueNoise(W, H, 5, r);
    const land = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const ex = (x - W / 2) / (W * 0.5), ey = (y - H * 0.48) / (H * 0.52);
      let v = n(x, y) * 0.75 + n2(x, y) * 0.25 - (ex * ex + ey * ey) * 0.55;
      if (Math.hypot(x - W * 0.34, y - H * 0.83) < 6) v = 1;               // Mendor
      if (Math.hypot(x - W * 0.34, y - H * 0.83) < 9 && Math.hypot(x - W * 0.34, y - H * 0.83) >= 6) v = -1;
      land[y * W + x] = v > 0.22 ? 1 : 0;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const L = land[y * W + x];
      P(x, y, 1, 1, L ? ((x * 7 + y * 3) % 11 === 0 ? '#cfbc92' : '#dccba4') : ((x + y * 2) % 6 === 0 ? '#9fb4b0' : '#b8c8c0'));
      if (L){ const edge = !land[y * W + x - 1] || !land[y * W + x + 1] || !land[(y - 1) * W + x] || !land[(y + 1) * W + x]; if (edge) P(x, y, 1, 1, '#4a3b2a'); }
    }
    // mountains down the spine, forests, a river
    for (let i = 0; i < 9; i++){ const x = 70 + i * 3 + (r() * 4 | 0), y = 18 + i * 4; P(x, y + 2, 5, 1, '#4a3b2a'); P(x + 1, y + 1, 3, 1, '#4a3b2a'); P(x + 2, y, 1, 1, '#4a3b2a'); }
    for (let i = 0; i < 40; i++){ const x = 20 + r() * 50 | 0, y = 20 + r() * 40 | 0; if (land[y * W + x]) P(x, y, 1, 1, '#5f7e3e'); }
    let rx = 112, ry = 18; for (let i = 0; i < 70; i++){ rx += (r() - .5) * 2; ry += 1; if (ry >= H || !land[(ry | 0) * W + (rx | 0)]) break; P(rx | 0, ry | 0, 1, 1, '#5a7a9a'); }
    // a compass rose
    P(146, 78, 1, 13, '#4a3b2a'); P(140, 84, 13, 1, '#4a3b2a'); P(145, 76, 3, 2, '#8b0000');
    return c;
  }, 4);
}
const propURL = {
  candle: () => toURL('p:candle', () => { const c = newCanvas(14, 30), P = painter(c.getContext('2d'));
    P(1, 25, 12, 4, '#8a6a2a'); P(0, 27, 14, 2, '#6a4a1a'); P(4, 9, 6, 17, '#ece4cf'); P(4, 9, 2, 17, '#fff8e8'); P(6, 6, 1, 3, '#2a2520');
    P(5, 1, 3, 5, '#ffb030'); P(6, 0, 1, 3, '#ffe060'); P(9, 14, 2, 4, '#ece4cf'); return outline(c); }, 4),
  dice: () => toURL('p:dice', () => { const c = newCanvas(22, 12), P = painter(c.getContext('2d'));
    P(0, 2, 9, 9, '#f0e8d8'); P(0, 10, 9, 1, '#a89878'); for (const [x, y] of [[2, 4], [6, 8], [4, 6]]) P(x, y, 1, 1, '#1a1a1a');
    P(11, 0, 9, 9, '#c84a3a'); P(11, 8, 9, 1, '#7a2a20'); for (const [x, y] of [[13, 2], [17, 2], [13, 6], [17, 6]]) P(x, y, 1, 1, '#fff'); return outline(c); }, 4),
  dagger: () => toURL('p:dagger', () => { const c = newCanvas(30, 8), P = painter(c.getContext('2d'));
    P(1, 3, 6, 2, C.woodD); P(0, 3, 1, 2, C.gold); P(7, 1, 2, 6, C.gold); P(9, 3, 18, 2, C.steelL); P(9, 3, 18, 1, '#ffffff'); P(27, 4, 2, 1, C.steelL); return outline(c); }, 4),
  ink: () => toURL('p:ink', () => { const c = newCanvas(18, 26), P = painter(c.getContext('2d'));
    P(2, 16, 10, 9, '#2a2a3a'); P(4, 14, 6, 2, '#3a3a4a'); P(3, 17, 2, 6, '#4a4a6a');
    for (let i = 0; i < 14; i++) P(8 + (i >> 2), 15 - i, 2, 1, '#ece4cf'); P(11, 1, 4, 4, '#ece4cf'); P(12, 0, 3, 2, '#d8d0c0'); return outline(c); }, 4),
  coins: () => toURL('p:coins', () => { const c = newCanvas(16, 12), P = painter(c.getContext('2d'));
    for (let i = 0; i < 4; i++){ P(2, 8 - i * 2, 9, 2, '#e8c040'); P(2, 8 - i * 2, 9, 1, '#fff2a0'); } P(9, 9, 6, 2, '#e8c040'); P(9, 9, 6, 1, '#fff2a0'); return outline(c); }, 4)
};

/* ---------------------------------------------------------------------------
   SCENERY: trees around the clearing and a little clutter inside it
--------------------------------------------------------------------------- */
function campScenery(){
  if (CAMP.trees) return;
  const r = rng(77), trees = [], decor = [];
  const near = (x, y, d) => Object.values(PLOTS).some(([px, py]) => Math.hypot(px - x, py - y) < d) ||
    Object.values(HUB).some(h => Math.hypot(h.x - x, h.y - y) < d) || Math.hypot(GRAVE.x - x, GRAVE.y - y) < d + 60;
  for (let y = 10; y < CAMP_H + 40; y += 46) for (let x = 0; x < CAMP_W + 30; x += 52){
    const tx = x + (r() - .5) * 30, ty = y + (r() - .5) * 26, ex = (tx - 880) / 790, ey = (ty - 660) / 520;
    if (ex * ex + ey * ey > 1 && r() < 0.8) trees.push({x:tx, y:ty, v:r() * 3 | 0});
  }
  for (let i = 0; i < 70; i++){
    const x = 140 + r() * (CAMP_W - 280), y = 140 + r() * (CAMP_H - 260), ex = (x - 880) / 760, ey = (y - 660) / 500;
    if (ex * ex + ey * ey > 0.95 || near(x, y, 95)) continue;
    const roll = r(); decor.push({x, y, k:roll < .35 ? 'tuft' : roll < .55 ? 'flowers' : roll < .7 ? 'rock' : roll < .82 ? 'bush' : roll < .92 ? 'stump' : 'bones'});
  }
  CAMP.trees = trees; CAMP.decor = decor;
}

/* ---------------------------------------------------------------------------
   PEOPLE
--------------------------------------------------------------------------- */
const plotFront = id => ({x:PLOTS[id][0], y:PLOTS[id][1] + 24});
function waypoints(){
  const w = [{x:HUB.house.x, y:HUB.house.y + 26}, {x:HUB.wagon.x - 20, y:HUB.wagon.y + 22}];
  for (let i = 0; i < 5; i++){ const a = i / 5 * TAU; w.push({x:HUB.fire.x + Math.cos(a) * 46, y:HUB.fire.y + 4 + Math.sin(a) * 28}); }
  for (const f of FACILITIES) if (has(f.id) && PLOTS[f.id]) w.push(plotFront(f.id));
  return w;
}
function campSync(){
  CAMP.dirty = false;
  const want = [{id:'master', kind:'master', p:ensureMaster()}];
  if (META.leader) want.push({id:'L', kind:'leader', p:META.leader});
  for (const o of META.officers || []) if (!o.away) want.push({id:'o' + o.name + o.id, kind:'officer', p:o});   /* Index DET1: away on detachment */
  for (const p of META.roster) if (!p.away) want.push({id:'m' + p.id, kind:'mate', p});
  for (const p of META.retired || []) if (has(p.facility) && PLOTS[p.facility]) want.push({id:'v' + p.id, kind:'vet', p});
  const old = new Map(CAMP.people.map(q => [q.id, q])), wp = waypoints();
  CAMP.people = want.map(w => {
    const o = old.get(w.id); if (o){ o.p = w.p; o.kind = w.kind; return o; }
    const s = wp[Math.random() * wp.length | 0];
    return Object.assign(w, {x:s.x + rnd(-30, 30), y:s.y + rnd(-20, 20), tx:s.x, ty:s.y, wait:rnd(0, 200), left:false, moving:false, seed:Math.random() * 10 | 0});
  });
}
function personRole(q){
  const p = q.p;
  if (q.kind === 'vet') return 'vet';
  if (q.kind === 'master') return 'wander';
  if (p.resting > 0 && p.trainingAt && has(p.trainingAt) && PLOTS[p.trainingAt]) return 'train';
  if (p.resting > 0) return 'rest';
  if (q.kind === 'mate' && (has('training') || has('barracks')) && q.sparring) return 'spar';
  return 'wander';
}
function anchorFor(q, role){
  const h = (typeof q.p.id === 'number' ? q.p.id : 3) * 37 % 60 - 30;
  if (role === 'vet') return {x:PLOTS[q.p.facility][0] + (h > 0 ? 34 : -34), y:PLOTS[q.p.facility][1] + 20};
  if (role === 'train') return {x:PLOTS[q.p.trainingAt][0] + h, y:PLOTS[q.p.trainingAt][1] + 30};
  if (role === 'spar'){ const at = PLOTS[has('training') ? 'training' : 'barracks'], side = (q.sparSide || 0); return {x:at[0] - 20 + side * 34 + (h % 3) * 4, y:at[1] + 34 + (Math.abs(h) % 5) * 6}; }
  if (role === 'rest'){ const at = has('hospital') ? PLOTS.hospital : has('tents') ? PLOTS.tents : [HUB.house.x - 110, HUB.house.y - 4];
    return {x:at[0] + h, y:at[1] + 34}; }
  return null;
}
function updatePeople(){
  if (CAMP.dirty) campSync();
  const wp = waypoints();
  for (const q of CAMP.people){
    q.role = personRole(q);
    const anchor = anchorFor(q, q.role);
    if (anchor){ q.tx = anchor.x; q.ty = anchor.y; }
    else {
      const partner = q.kind === 'mate' && q.p.bond && q.p.id > q.p.bond && CAMP.people.find(o => o.p.id === q.p.bond && o.role === 'wander');
      if (partner){ q.tx = partner.x + 22; q.ty = partner.y + 6; }
      else if (Math.hypot(q.tx - q.x, q.ty - q.y) < 3 && --q.wait <= 0){
        const s = wp[Math.random() * wp.length | 0]; q.tx = s.x + rnd(-24, 24); q.ty = s.y + rnd(-12, 12); q.wait = rnd(90, q.kind === 'master' ? 420 : 300);
      }
    }
    const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy), sp = q.kind === 'master' ? 0.55 : 0.8;
    q.moving = d > 2.5;
    if (q.moving){ q.x += dx / d * Math.min(sp, d); q.y += dy / d * Math.min(sp, d); if (Math.abs(dx) > 0.3) q.left = dx < 0; }
  }
}

/* ---------------------------------------------------------------------------
   THE LOOP
--------------------------------------------------------------------------- */
function startCamp(){
  if (G) return;
  ensureMaster(); campScenery(); CAMP.on = true; CAMP.dirty = true;
  canvas.classList.add('campview');
  if (!CAMP.running){ CAMP.running = true; requestAnimationFrame(campLoop); }
}
function stopCamp(){ CAMP.on = false; canvas.classList.remove('campview'); }
const campOverlayOpen = () => SCREENS.some(id => id !== 'screen-title' && !$(id).classList.contains('hidden'));
function campLoop(){
  if (G || !CAMP.on){ CAMP.running = false; canvas.classList.remove('campview'); return; }
  CAMP.t++;
  if (!campOverlayOpen()){
    const sp = 9, kx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), ky = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (!leaderCtrl()){ CAMP.cam.x += kx * sp; CAMP.cam.y += ky * sp; }   /* Index 47: with a Leader, WASD walks him instead */
  }
  if (!$('screen-title').classList.contains('hidden')) CAMP.cam.x += Math.sin(CAMP.t / 400) * 0.35;
  clampCam();
  updatePeople();
  for (const p of CAMP.puffs){ p.x += p.vx; p.y += p.vy; p.life--; }
  CAMP.puffs = CAMP.puffs.filter(p => p.life > 0);
  for (const f of CAMP.fx) f.life--; CAMP.fx = CAMP.fx.filter(f => f.life > 0);
  if (CAMP.t % 14 === 0) for (const id of ['blacksmith','engineering','alchemy']) if (has(id)){ const ch = typeof w3dChimney === 'function' ? w3dChimney(id) : false;   /* VO3 (js/3d/vo3.js) names the painted chimney; null = no chimney on that sprite */
    if (ch !== null) CAMP.puffs.push({x:(ch ? ch.x : PLOTS[id][0] + 30) + rnd(-3, 3), y:ch ? ch.y : PLOTS[id][1] - 100, vx:rnd(-.1, .25), vy:-0.45, life:110, c:id === 'alchemy' ? '#bfe8a0' : '#d8d8d0'}); }
  if (CAMP.t % 18 === 0){ const ch = typeof w3dChimney === 'function' ? w3dChimney('house') : false;
    if (ch !== null) CAMP.puffs.push({x:(ch ? ch.x : HUB.house.x + 26) + rnd(-2, 2), y:ch ? ch.y : HUB.house.y - 110, vx:rnd(-.1, .2), vy:-0.4, life:100, c:'#d8d8d0'}); }
  if (CAMP.t % 8 === 0) CAMP.puffs.push({x:HUB.fire.x + rnd(-6, 6), y:HUB.fire.y - 20, vx:rnd(-.15, .15), vy:-0.6, life:60, c:'#ffb050', ember:true});
  drawCamp();
  requestAnimationFrame(campLoop);
}
function clampCam(){
  CAMP.cam.x = Math.max(-40, Math.min(CAMP_W - VW + 40, CAMP.cam.x));
  CAMP.cam.y = Math.max(-60, Math.min(CAMP_H - VH + 40, CAMP.cam.y));
  if (VW > CAMP_W) CAMP.cam.x = (CAMP_W - VW) / 2;
  if (VH > CAMP_H) CAMP.cam.y = (CAMP_H - VH) / 2;
}
function centreCamOn(x, y){ CAMP.cam.x = x - VW / 2; CAMP.cam.y = y - VH / 2; clampCam(); }

/* ---------------------------------------------------------------------------
   DRAWING
--------------------------------------------------------------------------- */
function campObjects(){
  const out = [];
  for (const f of FACILITIES){ const pl = PLOTS[f.id]; if (!pl) continue;
    out.push(has(f.id) ? {kind:'building', id:f.id, x:pl[0], y:pl[1], img:facilityCanvas(f.id)} : {kind:'plot', id:f.id, x:pl[0], y:pl[1]}); }
  out.push({kind:'house', id:'house', x:HUB.house.x, y:HUB.house.y, img:houseCanvas(), s:3.9});
  out.push({kind:'wagon', id:'wagon', x:HUB.wagon.x, y:HUB.wagon.y});
  return out;
}
function objRect(o){
  if (o.kind === 'plot') return {x:o.x - 54, y:o.y - 50, w:108, h:62};
  if (o.kind === 'wagon') return {x:o.x - 51, y:o.y - 66, w:102, h:72};
  const s = o.s || BSCALE, w = o.img.width * s, h = o.img.height * s;
  return {x:o.x - w / 2, y:o.y - h + 8, w, h};
}
function drawCamp(){
  const cx = Math.round(CAMP.cam.x), cy = Math.round(CAMP.cam.y), t = CAMP.t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1e2414'; ctx.fillRect(0, 0, VW, VH);
  ctx.save(); ctx.translate(-cx, -cy);
  if (!drawHoldingBackdrop(cx, cy, t)){
  if (!CAMP.pat) CAMP.pat = ctx.createPattern(groundPattern(), 'repeat');
  ctx.fillStyle = CAMP.pat; ctx.fillRect(-60, -60, CAMP_W + 120, CAMP_H + 120);
  // a trampled clearing
  const gcx = HUB.fire.x, gcy = HUB.fire.y - 100, gr = ctx.createRadialGradient(gcx, gcy, 60, gcx, gcy, Math.max(620, CAMP_W * 0.35));   /* VO-3: the clearing follows the fire and the map's size */
  gr.addColorStop(0, 'rgba(140,118,72,.42)'); gr.addColorStop(0.75, 'rgba(120,100,60,.16)'); gr.addColorStop(1, 'rgba(120,100,60,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, CAMP_W, CAMP_H);
  // paths: worn roads to every building, faint trails to the empty plots
  if (!CAMP.road) CAMP.road = ctx.createPattern(TILE.road(1), 'repeat');
  const from = {x:HUB.house.x, y:HUB.house.y + 30};
  const lane = (x, y, built) => {
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo((from.x + x) / 2, from.y + 40, x, y);
    if (built){ ctx.strokeStyle = 'rgba(60,44,24,.35)'; ctx.lineWidth = 30; ctx.stroke(); ctx.strokeStyle = CAMP.road; ctx.lineWidth = 24; ctx.stroke(); }
    else { ctx.setLineDash([4, 10]); ctx.strokeStyle = 'rgba(80,60,36,.45)'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]); }
  };
  if (!(typeof drawCampRoads === 'function' && drawCampRoads())){   /* Index 69: planned streets */
  for (const f of FACILITIES){ const pl = PLOTS[f.id]; if (pl) lane(pl[0], pl[1] + 22, has(f.id)); }
  lane(HUB.wagon.x, HUB.wagon.y + 10, true); lane(HUB.fire.x, HUB.fire.y, true); lane(GRAVE.x - GRAVE.w / 2, GRAVE.y + 20, false);
  }
  // the palisade round the camp, with its gates
  if (has('palisade') && !(typeof drawPalisadeRing === 'function' && drawPalisadeRing())){   /* Index 72 */
    for (let a = 0; a < 200; a++){ const t = a / 200 * TAU, x = 880 + Math.cos(t) * 760, y = 640 + Math.sin(t) * 470;
      if ([0, Math.PI / 2, Math.PI, Math.PI * 1.5].some(gt => Math.abs(((t - gt + Math.PI * 3) % TAU) - Math.PI) < 0.07)) continue;
      if (!(typeof w3dStake === 'function' && w3dStake(x, y))){ ctx.fillStyle = '#6a4a28'; ctx.fillRect(x - 3, y - 22, 7, 24); ctx.fillStyle = '#b08a5a'; ctx.fillRect(x - 3, y - 24, 7, 3); } }   /* Index 65 */
  }
  }
  // the fire ring and its bench logs
  ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.beginPath(); ctx.ellipse(HUB.fire.x, HUB.fire.y + 6, 70, 34, 0, 0, TAU); ctx.fill();
  const flick = 0.5 + Math.sin(t / 5) * 0.08 + Math.random() * 0.05;
  const fg = ctx.createRadialGradient(HUB.fire.x, HUB.fire.y, 4, HUB.fire.x, HUB.fire.y, 120);
  fg.addColorStop(0, `rgba(255,170,60,${flick * 0.45})`); fg.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(HUB.fire.x, HUB.fire.y, 120, 0, TAU); ctx.fill();
  // y-sorted scene
  const L = [];
  for (const o of campObjects()) L.push({y:o.y, o});
  for (const q of CAMP.people) L.push({y:q.y, q});
  for (const tr of CAMP.trees) if (tr.x > cx - 60 && tr.x < cx + VW + 60 && tr.y > cy - 20 && tr.y < cy + VH + 90) L.push({y:tr.y, tr});
  for (const d of CAMP.decor) L.push({y:d.y, d});
  L.push({y:HUB.fire.y, fire:true});
  if (typeof benchLogBodies === 'function') for (const b of benchLogBodies()) L.push(b);   /* Index 77: each bench log sorts on its own */
  for (const p of holdingProps()) L.push({y:p.y, prop:p});
  L.push({y:GRAVE.y + GRAVE.h / 2, grave:true});
  if (has('stables') && holding() === 'fort') L.push({y:(typeof paddockAt === 'function' ? paddockAt()[1] : PLOTS.stables[1] + 46), paddock:true});   /* Index 69 */
  L.sort((a, b) => a.y - b.y);
  if (window.P24) P24.drawRunPuffs();   /* Index P24: the leader's running dust, under the figures */
  const hv = CAMP.hover;
  for (const it of L){ ctx.save(); try {   /* Index 80: one bad object hides only itself */
    if (it.tr){ if (!(typeof w3dTree === 'function' && w3dTree(it.tr, t))) PROPS3D.campTree(it.tr, t); continue; }   /* Index 61 */
    if (it.prop){ drawHoldingProp(it.prop); continue; }
    if (it.d){ if (!(typeof w3dDecor === 'function' && w3dDecor(it.d))) PROPS3D.campDecor(it.d); continue; }   /* Index 67 */
    if (it.paddock){ const pk = typeof paddockAt === 'function' ? paddockAt() : [PLOTS.stables[0] + 70, PLOTS.stables[1] + 46], px = pk[0], py = pk[1],   /* Index 69 */ k = META.gear.owned.filter(id => gear(id).slot === 'mount').pop();
      if (!(typeof w3dPaddock === 'function' && w3dPaddock(px, py))) PROPS3D.paddock(px, py);   /* Index 64 */
      if (k && !(typeof r3qPaddock === 'function' && r3qPaddock(k, px, py))){ figPlaceholder(px - 24, py - 12 - 18, 2.6, {h:20, w:8, horse:true, shadowW:8}); figPlaceholder(px + 22, py - 18 - 18, 2.6, {h:20, w:8, horse:true, shadowW:8}); } /* S6-C note 10: non-pixel stand-in */   /* Index 56 */
      continue; }
    if (it.grave){ drawGraveyard(hv && hv.kind === 'grave'); continue; }
    if (it.blog){ drawBenchLog(it.blog); continue; }   /* Index 77 */
    if (it.fire){ if (!(typeof w3dFire === 'function' && w3dFire(HUB.fire.x, HUB.fire.y, t))) PROPS3D.campFire(HUB.fire.x, HUB.fire.y, t);   /* Index 61 */
      if (!(typeof benchLogBodies === 'function'))   /* Index 77: the logs are their own bodies now */
      for (const [lx, ly, w] of [[-72, 4, 28], [36, 6, 26], [-12, 34, 30]]){   /* Index 47: every holding has its fire logs */ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(HUB.fire.x + lx, HUB.fire.y + ly, w, 8); ctx.fillStyle = '#7a5230'; ctx.fillRect(HUB.fire.x + lx, HUB.fire.y + ly, w, 3); }
      continue; }
    if (it.o){ const o = it.o, hot = hv && hv.kind === o.kind && hv.id === o.id;
      if (o.kind === 'plot'){
        ctx.fillStyle = hot ? 'rgba(150,120,70,.55)' : 'rgba(110,88,52,.4)'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 10, 54, 24, 0, 0, TAU); ctx.fill();
        if (!(typeof w3dPlot === 'function' && w3dPlot(o))) PROPS3D.campPlot(o);   /* Index 76 */
        if (hot) campLabel(o.x, o.y - 70, typeof plotLabel === 'function' ? plotLabel(o)[0] : facility(o.id).name, typeof plotLabel === 'function' ? plotLabel(o)[1] : `Plot: ${facCost(facility(o.id))}gp`);   /* Index 77 */
        continue; }
      if (o.kind === 'site'){ drawSite(o, hot); continue; }   /* Index 77 */
      if (o.kind === 'wagon'){ shadowAt(o.x, o.y + 4, 46); if (!(typeof w3dDrawObj === 'function' && w3dDrawObj(o))) PROPS3D.campWagon(o);   /* Index 72 */ if (hot) campLabel(o.x, o.y - 80, HS().qm, 'Squad gear'); continue; }
      const s = o.s || BSCALE, w = o.img.width * s, h = o.img.height * s;
      shadowAt(o.x, o.y + 4, w * 0.42);
      if (hot){ ctx.save(); ctx.filter = 'brightness(1.18)'; }
      if (!(typeof w3dDrawObj === 'function' && w3dDrawObj(o, w, h))) PROPS3D.campBuilding(o, w, h);   /* Index 61 */
      if (hot) ctx.restore();
      if (o.kind === 'house' && !w3dChBanner(o.x + w / 2 - 4, o.y + 7, 3.4)) PROPS3D.campBanner(o.x + w / 2 - 4, o.y + 7, 3.4);   /* Index 74 */
      if (o.kind === 'building' && mastery(o.id)){ ctx.fillStyle = '#ffd860'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'center'; ctx.fillText('\u2605', o.x + w / 2 - 10, o.y - h + 28); }
      if (hot) campLabel(o.x, o.y - h, o.kind === 'house' ? HS().house : facility(o.id).name, o.kind === 'house' ? HS().houseSub : staffOf(o.id) ? 'Staffed by ' + staffOf(o.id).name : upkeepLabel(o.id));
      continue; }
    const q = it.q, spr = q.kind === 'master' ? masterSprite() : q.kind === 'worker' ? personSpriteK('wk:' + q.p.name + q.p.race, q.p) : q.kind === 'elf35' && window.REF35 && REF35.on ? personSpriteK('ref35:' + q.p.name + q.p.race, REF35.person(q)) : personSprite(q.p, q.kind === 'leader'), s = 2.4, hot = hv && hv.kind === 'person' && hv.id === q.id;   /* Index 77: builders */
    if (q.role === 'rest' && !(q.tx !== undefined && Math.hypot(q.tx - q.x, q.ty - q.y) > 8)){   /* Index 60: only lie down once at the bed */
      ctx.fillStyle = 'rgba(230,220,200,.9)'; ctx.fillRect(q.x - 22, q.y - 4, 44, 12); ctx.fillStyle = '#8a3a2a'; ctx.fillRect(q.x - 22, q.y + 4, 44, 4);
      if (!(typeof r3dRest === 'function' && r3dRest(spr, q))) figPlaceholder(q.x, q.y - 5 * s, s, Object.assign(figSize(spr), {down:true, shadow:false})); /* S6-C note 10: non-pixel stand-in */   /* Index 55 */
      if ((t >> 5) % 3 === 0){ ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.fillText('z', q.x + 18, q.y - 14 - (t % 32) / 4); }
    } else {
      if (q.role === 'spar' && !q.moving) q.left = q.sparSide === 1;
      if (q.role === 'build' && !q.moving && q.face !== undefined) q.left = q.face;   /* Index 77: builders face their work */
      const fr = (q.role === 'train' || ((q.role === 'spar' || q.role === 'build') && !q.moving)) ? ((t + q.seed * 9) % (q.role === 'build' ? 34 : 50) < 12 ? 3 : 0) : q.moving ? 1 + ((t + q.seed * 7) / 9 | 0) % 2 : 0;
      if (q.kind === 'master' || q.kind === 'scribe' || hot){ ctx.beginPath(); ctx.ellipse(q.x, q.y + 17, 15, 5, 0, 0, TAU);   /* Index 30 */ ctx.strokeStyle = q.kind === 'master' ? '#5aa0e0' : '#ffd860'; ctx.lineWidth = 2; ctx.stroke(); }
      drawSprite(spr, q.x, q.y, s, fr, q.left, false);
    }
    if (hot){ const sub = q.kind === 'master' ? 'Chapter Master' : q.kind === 'elf35' ? 'Long Road survivor' : q.kind === 'vet' ? 'Veteran: ' + facility(q.p.facility).name : q.kind === 'leader' ? 'Squad Leader' : q.kind === 'officer' ? (q.role === 'train' ? 'Officer, in training' : 'Officer') : q.role === 'rest' ? 'Resting' : q.role === 'train' ? 'Training: ' + (q.p.trainingLabel || '') : q.kind === 'worker' ? 'Builder: ' + (facility(q.site) ? facility(q.site).name : 'a new building') + (typeof inBuild === 'function' && inBuild(q.site) ? ', ' + leftText(q.site) + ' left' : '') : (SPECS[q.p.spec] ? SPECS[q.p.spec].name : 'Townsfolk');   /* Index 80: builders (and anyone without a specialty) have a label */
      campLabel(q.x, q.y - 40, q.p.name, sub); }
  } catch (e) { campDrawError(e, it); } finally { ctx.restore(); } }   /* Index 80 */
  for (const p of CAMP.puffs){ if (p.run) continue;   /* Index P24 */ ctx.globalAlpha = Math.min(1, p.life / 40) * (p.ember ? 1 : 0.55);
    if (p.ember){ ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2, 2); } else PROPS3D.puff(p.x, p.y, 3 + (110 - p.life) / 40); }   /* S6-C 3a: soft smoke */
  ctx.globalAlpha = 1;
  for (const f of CAMP.fx){ ctx.globalAlpha = f.life / 70; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y - 40, 40 + (70 - f.life) * 1.5, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++){ const a = i / 6 * TAU + f.life / 20; const px = f.x + Math.cos(a) * (70 - f.life) * 1.2, py = f.y + Math.sin(a) * (70 - f.life) * 0.6; PROPS3D.puff(px, py, 4); } }
  ctx.globalAlpha = 1;
  ctx.restore();
  // warm evening vignette
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
}
const crossSprite = big => simpleSprite('cross' + big, 12, 16, P => {
  P(5, 0, 2, 13, '#8a8a84'); P(1, 3, 10, 2, '#8a8a84'); P(5, 0, 1, 13, '#b0b0a8'); P(1, 3, 10, 1, '#b0b0a8');
  P(2, 13, 8, 3, '#4a3a24'); if (big){ P(4, 7, 4, 1, '#6a6a64'); }
});
// The graveyard: a fenced plot by the trees, one marker per fallen member
// of the Chapter. Leaders get stone; Squad Mates get wood.
function drawGraveyard(hot){
  const g = GRAVE, x0 = g.x - g.w / 2, y0 = g.y - g.h / 2, dead = META.memorial || [];
  ctx.fillStyle = hot ? 'rgba(90,80,60,.55)' : 'rgba(70,62,46,.45)'; ctx.fillRect(x0, y0, g.w, g.h);
  const cols = 6, rows = Math.max(1, Math.ceil(Math.min(dead.length, 18) / cols));
  dead.slice(-18).forEach((d, i) => {
    const cx = x0 + 22 + (i % cols) * ((g.w - 44) / (cols - 1)), cy = y0 + 34 + Math.floor(i / cols) * 34;
    ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.ellipse(cx, cy + 14, 11, 5, 0, 0, TAU); ctx.fill();
    PROPS3D.grave(typeof d === 'object' && d.leader, cx, cy + 16);   /* S6-C 3a: 3D marker */
  });
  if (!dead.length){ ctx.fillStyle = 'rgba(240,230,210,.6)'; ctx.font = `italic ${typeof hudPx === 'function' ? hudPx(12) : 14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('No graves yet', g.x, g.y + 6); }
  // fence
  PROPS3D.graveFence(g, x0, y0);   /* S6-C 3a: 3D fence and oak */
  if (hot) campLabel(g.x, y0 - 12, 'The Graveyard', dead.length ? `${dead.length} fallen` : 'Empty, for now');
}
function shadowAt(x, y, w){ ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, TAU); ctx.fill(); }
function campLabel(x, y, title, sub){
  const subPx = typeof hudPx === 'function' ? hudPx(12) : 14, titlePx = Math.max(15, subPx + 1);
  const extra = Math.max(0, subPx - 12), h = 40 + Math.ceil(extra * 2), ty = y - 22 - Math.ceil(extra * 1.2);
  ctx.font = `bold ${titlePx}px Georgia`; const w1 = ctx.measureText(title).width; ctx.font = `${subPx}px Georgia`; const w2 = ctx.measureText(sub).width;
  const w = Math.max(w1, w2) + 20;
  ctx.fillStyle = 'rgba(30,20,10,.88)'; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.5; ctx.strokeRect(x - w / 2 + .5, y - h + .5, w - 1, h - 1);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9b0'; ctx.font = `bold ${titlePx}px Georgia`; ctx.fillText(title, x, ty);
  ctx.fillStyle = '#cdbf9f'; ctx.font = `${subPx}px Georgia`; ctx.fillText(sub, x, y - 7);
}

/* ---------------------------------------------------------------------------
   INPUT: drag to pan, click to inspect
--------------------------------------------------------------------------- */
function campHit(wx, wy){
  for (const q of CAMP.people.slice().sort((a, b) => b.y - a.y)) if (Math.hypot(q.x - wx, q.y - 6 - wy) < 22) return {kind:'person', id:q.id, q};
  const objs = campObjects().sort((a, b) => b.y - a.y);
  for (const o of objs){ const r = objRect(o); if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) return {kind:o.kind, id:o.id}; }
  if (Math.hypot(wx - HUB.fire.x, wy - HUB.fire.y) < 50) return {kind:'fire', id:'fire'};
  if (Math.abs(wx - GRAVE.x) < GRAVE.w / 2 + 10 && wy > GRAVE.y - GRAVE.h / 2 - 40 && wy < GRAVE.y + GRAVE.h / 2 + 10) return {kind:'grave', id:'grave'};
  return null;
}
function campInputs(){
  canvas.addEventListener('mousedown', e => { if (G || e.button !== 0) return; CAMP.drag = {x:e.clientX, y:e.clientY, cx:CAMP.cam.x, cy:CAMP.cam.y, moved:false}; SFX.unlock(); });
  window.addEventListener('mousemove', e => {
    CAMP.mouse.x = e.clientX; CAMP.mouse.y = e.clientY;
    if (G) return;
    const d = CAMP.drag;
    if (d){ const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
      if (d.moved && !leaderCtrl()){ CAMP.cam.x = d.cx - dx; CAMP.cam.y = d.cy - dy; clampCam(); } }   /* Index 47 */
    if (e.target === canvas){ CAMP.hover = campHit(e.clientX + CAMP.cam.x, e.clientY + CAMP.cam.y); canvas.classList.toggle('point', !!CAMP.hover); }
    else CAMP.hover = null;
  });
  window.addEventListener('mouseup', e => {
    const d = CAMP.drag; CAMP.drag = null;
    if (G || !d || d.moved || e.target !== canvas) return;
    const hit = campHit(e.clientX + CAMP.cam.x, e.clientY + CAMP.cam.y);
    if (hit){ SFX.play('pick'); openPanel(hit.kind, hit.id); } else closePanel();
  });
  window.addEventListener('keydown', e => {
    if (G || e.key !== 'Escape') return;
    if ($('tb-settings')){ $('tb-settings').remove(); return; }
    if (!$('camp-panel').classList.contains('hidden')) return closePanel();
    if (campOverlayOpen() && $('screen-debrief').classList.contains('hidden') && $('screen-create').classList.contains('hidden')) renderTitle();
  });
}

/* ---------------------------------------------------------------------------
   THE SIDE PANEL: whatever you clicked on
--------------------------------------------------------------------------- */
function openPanel(kind, id){ CAMP.panel = {kind, id}; renderPanel(); $('camp-panel').classList.remove('hidden'); }
function closePanel(){ CAMP.panel = null; $('camp-panel').classList.add('hidden'); }
function renderPanel(){
  const P = CAMP.panel; if (!P) return;
  let h = '<button class="x" onclick="closePanel()" title="Close">&#215;</button>';
  if (P.kind === 'house'){
    h += `<h2>${HS().house}</h2><img class="pimg" src="${toURL('housepanel' + holdKey(), () => houseCanvas(), 3)}">
      <div class="desc" style="text-align:left">The Chapter's first holding. The planning table inside is where contracts are chosen, the War Council haggles with patrons, and the Chapter's ambitions, allies and prisoners are kept.</div>
      ${META.leader ? `<button class="btn gold" onclick="closePanel();openTable()">GO TO THE PLANNING TABLE</button>` : `<button class="btn gold" onclick="closePanel();openCreate()">RECRUIT A SQUAD LEADER</button>`}
      <div class="line"><img src="${bannerURL(banner())}"><div class="grow"><b>The Chapter Banner</b><br>Flies over the house; every Squad Mate's cloak is in its colours.</div><button onclick="BED=null;openPanel('banner','banner')">Redesign</button></div>
      <div class="line"><img src="${masterBustURL()}"><div class="grow"><b>${esc(ensureMaster().name)}</b>, Chapter Master<br><span style="font-size:14px">${cmGame(ensureMaster().cls, ensureMaster())}</span></div>${META.master.chosen ? '' : `<button onclick="openPanel('elect','elect')">Elect</button>`}</div>
      <div class="line"><div class="grow"><b>${HS().name}</b><br><span style="font-size:14px">The Chapter's holding.</span></div><button onclick="openPanel('holding','holding')">Move</button></div>`;
  }
  else if (P.kind === 'banner'){ h += bannerEditorHTML(); }
  else if (P.kind === 'elect'){ h += electHTML(); }
  else if (P.kind === 'holding'){ h += holdingHTML(); }
  else if (P.kind === 'raid'){ if (!META.raid) return closePanel(); h += raidPanelHTML(); }
  else if (P.kind === 'wagon'){
    const g = META.gear, kit = [g.armour, g.shield, g.melee, g.ranged, ...g.kits, g.mount].map(i => `<img src="${gearURL(gear(i))}" title="${gear(i).name}" style="height:40px;margin:2px">`).join('');
    h += `<h2>${HS().qm}</h2><img class="pimg" src="${toURL('wagonpanel' + holding(), () => qmSprite(), 3)}">
      <div class="desc" style="text-align:left">Squad Standard gear arms the whole squad. Currently issued:</div><div style="text-align:center;margin:6px 0">${kit}</div>
      <button class="btn gold" onclick="closePanel();openCamp()">OPEN THE QUARTERMASTER</button>`;
  }
  else if (P.kind === 'grave'){
    const dead = (META.memorial || []).slice().reverse();
    h += `<h2>${HS().grave}</h2><img class="pimg" src="${toURL('gravepanel', () => crossSprite(true), 4)}" style="height:72px">
      <div class="desc" style="text-align:left;margin-bottom:6px">${dead.length ? `${dead.length} of the Chapter rest here. The newest graves are at the top.` : 'Nobody rests here yet. Keep it that way.'}</div>`;
    for (const d of dead){
      if (typeof d === 'string'){ h += `<div class="line"><img src="${toURL('gravecross', () => crossSprite(false), 3)}" style="height:calc(16px + .625vw)"><div class="grow"><b>${esc(d)}</b></div></div>`; continue; }
      const who = {race:d.race, spec:d.spec, name:d.name, id:d.id, sex:d.sex};
      h += `<div class="line" style="align-items:flex-start"><img src="${portraitURL(who, d.leader)}" style="filter:grayscale(.85) brightness(.9)">
        <div class="grow"><b>${esc(d.name)}</b>${d.leader ? ' <span class="tag" style="font-size:14px">Squad Leader</span>' : ''}<br>
        ${RACES[d.race].name} ${CLASSES[d.cls] ? CLASSES[d.cls].name : ''} ${SPECS[d.spec].name}, ${d.leader ? 'Level' : 'effective Level'} ${d.level}<br>
        ${esc(d.cause)}: ${esc(d.contract)}, Tier ${d.tier}, ${esc(forPatron(d.patron))}. ${esc(d.season)}.<br>
        Served ${d.contracts} contract${d.contracts === 1 ? '' : 's'}${d.kills != null ? `, ${d.kills} enemies slain` : ''}${d.comrade ? `. Mourned by ${esc(d.comrade)}, their Comrade` : ''}${d.injuries.length ? `. Scars: ${d.injuries.map(i => INJURIES.find(x => x.id === i).name).join(', ')}` : ''}.${typeof LINKS35 === 'object' && LINKS35.graveLine ? LINKS35.graveLine(d) : ''}</div></div>`;
    }
  }
  else if (P.kind === 'fire'){
    h += `<h2>${HS().fire}</h2><div class="desc" style="text-align:left">Where the company eats, argues and tells the same three stories, and where sellswords come looking for work.</div><h3 style="margin:8px 0 0">Hiring Line</h3>${hiringHTML()}`;
  }
  else if (P.kind === 'plot' || P.kind === 'building'){
    const f = facility(P.id), built = has(f.id), V = VETERANS[f.id], staff = staffOf(f.id);
    h += `<h2>${f.name}</h2><img class="pimg" src="${buildingURL(f.id)}" style="${built ? '' : 'opacity:.55;filter:grayscale(.6)'}">
      <div class="tag">${f.cat}${built ? ' \u00b7 Built' : ' \u00b7 Empty plot'}</div>
      <div class="desc" style="text-align:left;margin:6px 0">${f.desc}</div>`;
    if (V) h += `<div class="fl" style="text-align:left">Veteran Mastery (${V.match.map(matchName).join(' or ')}, 3+ Advancements): ${V.text}</div>`;
    if (!built && f.req && !has(f.req)) h += `<div class="desc" style="color:#8b0000">Build the ${facility(f.req).name} first.</div>`;
    else if (!built) h += `<button class="btn gold" ${META.treasury >= facCost(f) ? '' : 'disabled'} onclick="campBuild('${f.id}')">BUILD FOR ${facCost(f)}GP</button>${facCost(f) < f.cost ? `<div class="desc" style="color:#226b2a">${f.cost - facCost(f)}gp off: the Chapter Master's bonus.</div>` : ''}
      ${META.treasury < facCost(f) ? `<div class="desc" style="color:#8b0000">The Treasury holds ${META.treasury}gp.</div>` : ''}`;
    else {
      if (V){
        if (staff) h += `<div class="line"><img src="${portraitURL(staff, false)}"><div class="grow"><b>${esc(staff.name)}</b><br>${RACES[staff.race].name} ${CLASSES[staff.cls].name} ${SPECS[staff.spec].name}<br>${mastery(f.id) ? '<b style="color:#226b2a">Veteran Mastery active</b>' : 'Staffs the building, no Mastery'}</div></div>`;
        else {
          const cands = META.roster.filter(canRetire);
          h += `<div class="desc" style="text-align:left;margin-top:6px"><b>No veteran staff.</b> ${cands.length ? 'Retire someone here:' : 'A Squad Mate who is maimed or has 3+ Advancements can retire here.'}</div>` +
            cands.map(p => `<div class="line"><img src="${portraitURL(p, false)}"><div class="grow"><b>${esc(p.name)}</b> ${vetMatches(p, f.id) ? '<b style="color:#226b2a">(Mastery)</b>' : ''}<br>${SPECS[p.spec].name}, ${p.adv} Advancements</div><button onclick="retireMate(${META.roster.indexOf(p)},'${f.id}')">Retire here</button></div>`).join('');
        }
      }
      h += trainingHTML(f.id);
      if (f.id === 'hospital' || (f.id === 'tents' && !has('hospital'))){
        const rest = META.roster.filter(p => p.resting > 0 && !p.trainingAt);
        h += `<div class="desc" style="text-align:left;margin-top:8px"><b>Resting here:</b> ${rest.length ? rest.map(p => esc(p.name)).join(', ') + '. They sit out the next contract.' : 'nobody.'}</div>`;
      }
      if (f.id === 'cells') h += `<div class="desc" style="text-align:left;margin-top:8px"><b>Prisoners held:</b> ${(META.prisoners || []).length}.</div><button class="btn" onclick="closePanel();openTable('ledger')">OPEN THE PRISONER LEDGER</button>`;
      if (f.id === 'command') h += `<div class="desc" style="text-align:left;margin-top:8px"><b>Officers:</b> with the Command Tent built, promote a Squad Mate with 2 or more Advancements on the Roster, and send the Leader to officer training there.</div><button class="btn" onclick="closePanel();openRoster()">OPEN THE ROSTER</button><button class="btn" onclick="closePanel();openTable()">GO TO THE PLANNING TABLE</button>`;
    }
  }
  else if (P.kind === 'person'){
    const q = CAMP.people.find(x => x.id === P.id); if (!q) return closePanel();
    const p = q.p;
    if (q.kind === 'master'){
      h += `<h2>${esc(p.name)}</h2><img class="pimg" src="${masterPortraitURL()}" style="height:130px"><div class="tag">Chapter Master</div>
        <div class="desc" style="text-align:left"><b>Camp bonus (${CLASSES[p.cls].name}):</b> ${cmGame(p.cls, p)}</div>${heroLine(p)}
        <div class="desc" style="text-align:left;margin:6px 0">${RACES[p.race].name} ${CLASSES[p.cls].name}, once a ${SPECS[p.spec].name}. Too old and too broken to march, ${esc(p.name)} runs the camp, brokers contracts and does the haggling in the War Council (Section 4.1).</div>
        <div class="speech" style="margin-left:10px">"${masterLine()}"</div>
        ${META.leader ? `<button class="btn gold" onclick="closePanel();openTable()">TALK CONTRACTS</button>` : `<button class="btn gold" onclick="closePanel();openCreate()">RECRUIT A SQUAD LEADER</button>`}`;
    } else if (q.kind === 'leader' || q.kind === 'officer'){
      h += `<h2>${esc(p.name)}</h2><div class="card static" style="margin:6px 0"><div class="tag">${q.kind === 'leader' ? 'Squad Leader' : 'Officer'}</div>${leaderCardHTML(p, p.resting > 0 ? '<div class="desc" style="color:#226b2a">In officer training</div>' : '')}</div>
        <button class="btn" onclick="closePanel();openRoster()">OPEN THE ROSTER</button>`;
    } else if (q.kind === 'vet'){
      h += `<h2>${esc(p.name)}</h2><img class="pimg" src="${portraitURL(p, false)}"><div class="tag">Retired Veteran</div>
        <div class="role">${RACES[p.race].name} ${CLASSES[p.cls].name} ${SPECS[p.spec].name}</div>
        <div class="desc">Staffs the ${facility(p.facility).name}. ${mastery(p.facility) ? '<b style="color:#226b2a">Veteran Mastery active:</b> ' + VETERANS[p.facility].text : 'No Mastery: needs 3+ Advancements and a matching Race, Class or Specialty.'}</div>
        ${p.injuries.length ? `<div class="desc" style="color:#8b0000">${p.injuries.map(i => INJURIES.find(x => x.id === i).name).join(', ')}</div>` : ''}`;
    } else {
      const i = META.roster.indexOf(p), role = q.role;
      h += `<h2>${esc(p.name)}</h2><div class="card static" style="margin:6px 0">${mateCardHTML(p, role === 'rest' ? '<div class="desc" style="color:#8b0000">Resting: sits out the next contract</div>' : role === 'train' ? '<div class="desc" style="color:#226b2a">Drilled this downtime</div>' : '')}
        <div class="desc">${RACES[p.race].tag}</div></div>`;
      const tf = Object.keys(TRAINING).filter(fid => has(fid) && TRAINING[fid].some(t => !t.spec || t.spec === p.spec));
      if (tf.length) h += `<div class="desc" style="text-align:left;margin-top:6px"><b>Train at:</b> ${tf.map(fid => `<a href="#" onclick="openPanel('building','${fid}');return false">${facility(fid).name}</a>`).join(', ')}</div>`;
      if (advLeft() > 0 && !META.advRound.given.includes(p.id)) h += `<div class="desc" style="text-align:left;margin-top:6px"><b>Give an Advancement:</b></div><div class="mini">${advChoices(p).map(o => `<button ${o.ok ? '' : 'disabled'} title="${o.ok ? '' : o.why}" onclick="giveAdvancement(${p.id},'${o.k}')">${o.label}</button>`).join('')}</div>`;
      if (canPromote(p)) h += `<button class="btn small" ${META.treasury >= 100 ? '' : 'disabled'} onclick="promoteOfficer(${p.id});closePanel()">PROMOTE TO OFFICER (100GP)</button>`;
      if (canRetire(p)){
        const open = FACILITIES.filter(f => has(f.id) && VETERANS[f.id] && !staffOf(f.id));
        h += open.length ? `<div class="desc" style="text-align:left;margin-top:6px"><b>Retire to staff a facility:</b></div>` +
          open.map(f => `<div class="line"><img src="${buildingURL(f.id)}"><div class="grow">${f.name}${vetMatches(p, f.id) ? ' <b style="color:#226b2a">(Mastery)</b>' : ''}</div><button onclick="retireMate(${i},'${f.id}');closePanel()">Retire</button></div>`).join('')
          : `<div class="desc">Eligible to retire, but no built facility needs staff.</div>`;
      }
      h += `<button class="btn small" onclick="releaseMate(${i});closePanel()">RELEASE FROM THE COMPANY</button>`;
    }
  }
  $('camp-panel').innerHTML = h;
}
function campBuild(id){
  const f = facility(id); if (has(id) || META.treasury < facCost(f) || (f.req && !has(f.req))) return;
  buyFacility(id);
  CAMP.fx.push({x:PLOTS[id][0], y:PLOTS[id][1], life:70}); SFX.play('win'); CAMP.dirty = true;
  openPanel('building', id);
}
function masterLine(){
  if (!META.leader) return 'A Chapter with no Squad Leader is a camp full of opinions. Find me someone to sign the charter.';
  if (!META.roster.length) return 'You cannot hold a road alone. There are sellswords by the fire: hire some.';
  if (!META.ambition) return 'We need to decide what this Chapter is for. Come to the planning table and choose an Ambition.';
  const lines = ['The roads are full of work for anyone with a sharp blade and a short memory.', 'Keep the ledger clean and the squad cards dry.',
    `Our coffers hold ${META.treasury}gp. Spend it before someone steals it.`, 'I have three patrons waiting in the tent. One of them is lying.',
    (META.prisoners || []).length ? 'Those prisoners are eating our bread. Ransom them or put them to work.' : 'A quiet camp makes me nervous.'];
  return lines[(CAMP.t / 600 | 0) % lines.length];
}

/* ---------------------------------------------------------------------------
   TOP BAR
--------------------------------------------------------------------------- */
function seasonName(){ const n = META.deployments || 0; return ['Spring','Summer','Autumn','Winter'][(n >> 1) % 4] + ', Year ' + (625 + (n >> 3)); }
function renderTopbar(){
  const L = META.leader, A = META.ambition;
  $('topbar').innerHTML = `<span class="brand">Dust Cloaks</span>
    <span class="stat">Treasury <b>${META.treasury}gp</b></span>
    <span class="stat">${seasonName()}</span>
    <span class="stat" title="${A ? AMBITIONS[A.track].ms[Math.min(9, A.done)].t : 'Choose on the planning table'}">${A ? `${AMBITIONS[A.track].name} <b>${A.done} / 10</b>` : 'No Ambition yet'}</span>
    <span class="grow"></span>
    ${L ? `<button class="tb gold" onclick="openTable()">PLANNING TABLE</button><button class="tb" onclick="centreCamOn(HUB.fire.x, HUB.fire.y);openPanel('fire','fire')">HIRE</button>` : `<button class="tb gold" onclick="openCreate()">RECRUIT SQUAD LEADER</button>`}
    <button class="tb" onclick="openRoster()" ${L ? '' : 'disabled'}>ROSTER</button>
    <button class="tb" onclick="openCamp()">QUARTERMASTER</button>
    <button class="tb" onclick="openScribeBook()" title="The Chronicle: the Scribe's book of history and rules (M)">CHRONICLE</button>
    <button class="tb" onclick="openPortraitStudio()">PORTRAITS</button>
    <button class="tb" onclick="toggleSettings()">SETTINGS</button>`;
}
function toggleSettings(){
  if ($('tb-settings')) return $('tb-settings').remove();
  const d = document.createElement('div'); d.id = 'tb-settings';
  d.innerHTML = settingsHTML(false) + `<div style="text-align:center;margin-top:10px"><button class="btn small" onclick="resetSave()">NEW CAMPAIGN</button></div>`;
  document.body.appendChild(d);
}
function refreshUI(){
  if (G) return;
  CAMP.dirty = true;
  if (CAMP.panel && !$('camp-panel').classList.contains('hidden')) renderPanel();
  if (!$('screen-table').classList.contains('hidden')) renderTable();
  if (!$('screen-roster').classList.contains('hidden')) renderRoster();
  if (!$('screen-camp').classList.contains('hidden')) renderCamp();
  if (!$('topbar').classList.contains('hidden')) renderTopbar();
}
function renderCampVisuals(){ refreshUI(); }

/* ---------------------------------------------------------------------------
   MENU FLOW: splash, the camp, and back
--------------------------------------------------------------------------- */
function renderTitle(){
  if ($('tb-settings')) $('tb-settings').remove();
  hideAll(); closePanel();
  $('topbar').classList.remove('hidden'); $('camp-hint').classList.remove('hidden');
  renderTopbar(); startCamp(); refreshUI();
  if (META.raid && META.leader){ centreCamOn(HUB.house.x, HUB.house.y + 200); openPanel('raid', 'raid'); SFX.play('horn'); }
}
function showSplash(){
  startCamp(); centreCamOn(HUB.fire.x, HUB.fire.y - 60);
  hideAll(); $('screen-title').classList.remove('hidden');
  const L = META.leader;
  $('title-inner').innerHTML = `<h1>Dust Cloaks</h1>
    <div class="sub"><i>Mercenary Companies of Arcadia</i></div>
    <div class="note">${L ? `${esc(L.name)}, ${(RACES[L.race] || {name: 'Unknown'}).name} ${(SPECS[L.spec] || {name: 'Mercenary'}).name}, Level ${L.level} \u00b7 ${META.treasury}gp in the Treasury \u00b7 ${seasonName()}` : (typeof founded === 'function' && founded() ? 'Your Chapter stands and its camp is waiting. It needs a Squad Leader.' /* 1g placeholder words: Narrative Designer to own */ : 'A charter, a muddy clearing and two hundred gold. Everything else you will have to build.')}</div>
    <button class="btn gold" onclick="${L ? 'renderTitle()' : founded() ? 'openCreate()' : 'openFound()'}">${L ? 'ENTER THE CAMP' : founded() ? 'RECRUIT A SQUAD LEADER' : 'FOUND YOUR CHAPTER'}</button>
    ${L ? '<button class="btn small" onclick="resetSave()">NEW CAMPAIGN</button>' : ''}
    <div style="margin-top:14px;border-top:1px solid rgba(232,216,176,.35);padding-top:10px"><div class="note" style="margin:0 0 6px">${L ? 'Or play the prologue: a short story that builds a squad of its own.' : 'New here? The prologue teaches the game in a short story, and the squad that survives becomes your Chapter. Or skip straight to founding.'}</div><button class="btn ${L ? '' : 'gold'}" onclick="openStory()">${storyExists() ? 'CONTINUE' : 'PLAY'} THE PROLOGUE: THE FOUNDING OF THE DUST CLOAKS</button></div>
    <div style="margin-top:16px;color:#e8d8b0">${settingsHTML(true)}</div>`;
}

/* ---------------------------------------------------------------------------
   THE PLANNING TABLE - contracts, the War Council, who marches, the Charter
   Ambition, Faction Standing, Doctrines and the prisoner ledger, laid out as
   scrolls on the table in the Chapter House.
--------------------------------------------------------------------------- */
function openTable(focus){
  if (!META.leader) return openCreate();
  renderTable(); show('screen-table');
  if (focus){ const el = $('tbl-' + focus); if (el) el.scrollIntoView({block:'center'}); }
}
function renderMuster(){ renderTable(); }
function openChapter(){ openTable('ambition'); }
function renderChapter(){ renderTable(); }
function councilLine(sel){
  const diff = councilDiff(sel), pat = sel.patron, aPat = /^(an?|the) /i.test(String(pat || '')) ? pat : (/^[aeiou]/i.test(String(pat || '')) ? 'An ' : 'A ') + pat;   /* R4: 'A Arcana Guild Magister' */   /* checklist M: 'A A Shadowy Broker' */
  if (!sel.council) return `${aPat}. ${diff >= 6 ? 'A hard one: Resistance ' + diff + '.' : diff <= 4 ? 'They are desperate. Resistance ' + diff + '.' : 'Resistance ' + diff + '. Fair, for now.'} Let me do the talking, ${META.leader.name}.`;
  const n = sel.council.filter(d => d.res === 'success').length;
  return n === 0 ? 'They gave us nothing. We take the job as it stands, or leave it.' : n === 1 ? 'One concession. Choose it well.' : n === 2 ? 'Two concessions. Not bad for an afternoon.' : 'They folded like wet parchment. Take what you want.';
}
function ensureMuster(){
  if (!META.board) rollBoard();
  if (!MU || MU.board !== META.board){
    const ready = META.roster.filter(p => !p.resting && !p.away);
    MU = {contract:0, ids:ready.slice(0, 5).map(p => p.id), board:META.board};
  }
  MU.ids = MU.ids.filter(id => META.roster.some(p => p.id === id && !p.resting && !p.away));
}
function renderTable(){
  if (!META.leader) return;
  ensureMuster();
  const sel = META.board[MU.contract], over = META.roster.length > rosterCap();
  const props = `<img class="prop" src="${propURL.candle()}" style="left:0.6%;top:46%;width:52px">
    <img class="prop" src="${propURL.ink()}" style="left:2%;bottom:40px;width:70px">
    <img class="prop" src="${propURL.dice()}" style="right:2%;bottom:60px;width:88px">
    <img class="prop" src="${propURL.dagger()}" style="right:1%;top:44%;width:120px;transform:rotate(-20deg)">
    <img class="prop" src="${propURL.coins()}" style="right:3%;top:80px;width:64px">`;
  // contracts
  const cons = META.board.map((c, i) => `<div class="scroll cscroll ${MU.contract === i ? 'sel' : ''}" onclick="MU.contract=${i};SFX.play('pick');renderTable()">
      <div class="tag" style="align-self:flex-start;display:inline-block">Tier ${c.tier}${c.obj === 'hold' ? ' \u00b7 ' + c.minutes + ' minutes' : ''}</div>
      ${c.finale ? '<div class="tag" style="background:#8a1a1a">Charter Finale</div>' : ''}<div class="ttl">${c.title || OBJECTIVES[c.obj].name}</div><div class="role" style="text-align:left">${forPatron(c.patron)}</div>
      <div class="desc">${briefOf(c)}</div>
      <div class="desc" style="font-size:14px;color:var(--blood)"><b>Enemy:</b> ${HOSTS[c.host].name}</div>${nemesisFor(c.host).length ? `<div class="desc" style="font-size:14px;color:#9a2a14"><b>Rumour:</b> ${esc(nemesisFor(c.host)[0].name)} rides with them.</div>` : ''}
      <div class="cost" style="text-align:left">${c.pay}gp${c.edges.includes('terms') ? ' +20%' : ''}</div>
      <div class="desc" style="font-size:14px">${FACTIONS[c.faction].name}: ${fmtStanding(standing(c.faction))}</div>
      <img class="seal" src="${sealURL(FACTION_LOOK[c.faction].glyph, FACTION_LOOK[c.faction].col)}"></div>`).join('');
  // war council
  let council;
  if (!sel.council) council = `${wcPreRollHTML(sel)}<button class="btn" onclick="rollCouncil()">ROLL THE WAR COUNCIL</button>
    <div class="sub" style="font-size:14px">Each die that beats ${councilDiff(sel)} (how hard this patron bargains) wins one Contract Edge: a head start on the field.</div>`;
  else {
    council = `<div class="dice">${sel.council.map(d => `<div class="die ${d.res}"><b style="${dieStyle(d.skill)}">${d.face}</b>${d.label}<br>Skill ${d.skill}</div>`).join('')}</div>`;
    council += hbHTML(sel); council += sel.picks > 0 ? `<div class="sub"><b>Choose ${sel.picks} Contract Edge${sel.picks > 1 ? 's' : ''}:</b></div>` : '';
    council += `<div class="edges">${EDGES.map(e => { const on = sel.edges.includes(e.id);
      return (sel.picks > 0 || on) ? `<div class="edge ${on ? 'on' : ''}" onclick="${on ? '' : 'pickEdge(\'' + e.id + '\')'}"><b>${e.name}</b><br><span style="font-size:14px">${e.text}</span></div>` : ''; }).join('')}</div>`;
  }
  // who marches
  const marchers = META.roster.map(p => `<div class="marcher ${MU.ids.includes(p.id) ? 'on' : ''} ${p.resting || p.away ? 'off' : ''}" onclick="toggleMuster(${p.id})" title="${RACES[p.race].name} ${SPECS[p.spec].name}: ${mateLine(p)}">
      <img src="${portraitURL(p, false)}"><b>${esc(p.name)}</b>${SPECS[p.spec].name}<br>${ABILITIES[p.spec].name}${p.away ? '<br><span style="color:#8b0000">Away</span>' : p.resting ? '<br><span style="color:#8b0000">Resting</span>' : ''}</div>`).join('')
    || '<div class="sub">Your Leader marches alone. Hire Squad Mates at the campfire.</div>';
  const g = META.gear, kit = [g.armour, g.shield, g.melee, g.ranged, ...g.kits, g.mount].map(i => `<img src="${gearURL(gear(i))}" title="${gear(i).name}" style="height:36px">`).join('');
  // ambition
  let amb;
  if (!META.ambition) amb = `<div class="sub">What is this Chapter for? Choose once. Milestones are taken in order; 3, 6 and 9 grant a perk, and 10 fulfils the charter.</div><div class="amb">` +
    Object.entries(AMBITIONS).map(([k, A]) => `<div class="scroll cscroll" onclick="chooseAmbition('${k}')"><div class="ttl">${A.name}</div><div class="role" style="text-align:left">${A.sub}</div>
      <div class="desc" style="font-size:14px">${A.ms.filter(m => m.perk).map(m => m.perk).join('<br>')}</div><img class="seal" src="${sealURL('star', '#8a1a1a')}"></div>`).join('') + '</div>';
  else { const A = META.ambition, T = AMBITIONS[A.track];
    amb = `<div class="sub"><b>${T.name}</b>: ${T.sub}. ${A.done} of 10.</div><div class="miles">` +
      T.ms.map((m, i) => `<p class="${i < A.done ? 'done' : i === A.done ? 'next' : ''}">${i < A.done ? '&#10003;' : i === A.done ? '&#10148;' : '&middot;'} ${i + 1}. ${m.t}${m.perk ? ` <i style="color:var(--blood)">Perk: ${m.perk}</i>` : ''}</p>`).join('') + '</div>'; }
  // factions
  const seals = Object.entries(FACTIONS).map(([k, F]) => { const n = standing(k), FL = FACTION_LOOK[k];
    return `<div class="fseal ${n >= 2 ? 'ally' : n <= -2 ? 'host' : ''}" style="left:${FL.at[0]}%;top:${FL.at[1]}%" title="${F.name} (${standingLabel(n)}). At +2: ${F.perk}">
      <img src="${sealURL(FL.glyph, n <= -2 ? '#5a2a2a' : FL.col)}">${F.name}<div class="n">${fmtStanding(n)}</div></div>`; }).join('');
  const flist = Object.entries(FACTIONS).map(([k, F]) => { const n = standing(k);
    return n >= 2 || n <= -2 ? `<p><b>${F.name}</b>: ${n >= 2 ? '<span style="color:#1e6a24">Allied.</span> ' + F.perk : '<span style="color:#9a0000">Hostile: no contracts.</span>'}</p>` : ''; }).join('');
  // doctrines
  const docs = DOCTRINES.map(d => { const own = hasDoc(d.id), ok = docReqMet(d);
    return `<div class="line"><div class="grow"><b>${d.name}</b>${own ? ' <span style="color:#226b2a">(learnt)</span>' : ''}<br><span style="font-size:14px">${d.text}</span>
      ${!own && !ok ? `<br><span style="font-size:14px;color:#8b0000">Needs ${d.req.map(r => r.split('|').map(x => facility(x).name).join(' or ')).join(' + ')}</span>` : ''}</div>
      ${own ? '' : `<button ${ok && META.treasury >= d.cost ? '' : 'disabled'} onclick="buyDoctrine('${d.id}')">${d.cost}gp</button>`}</div>`; }).join('');
  // prisoners
  const Pz = META.prisoners || [];
  const ledger = Pz.length ? Pz.map((pr, i) => `<div class="line">${pr.k ? `<img src="${enemyIconURL(pr.k)}">` : ''}<div class="grow"><b>${esc(pr.name)}</b><br>${prDesc(pr)}, held ${pr.age || 0} contract${pr.age === 1 ? '' : 's'}</div>
      <div><button onclick="prisonerAct(${i},'ransom')">${prRansomLabel(pr)}</button>${(pr.kind === 'commander' || pr.kind === 'noble') && !pr.asked ? `<button onclick="prisonerAct(${i},'interrogate')">Interrogate</button>` : ''}
      ${pr.kind === 'common' ? `<button onclick="prisonerAct(${i},'recruit')" ${META.roster.length >= rosterCap() ? 'disabled' : ''}>Recruit</button>` : ''}<button onclick="prisonerAct(${i},'execute')" data-tip="-1 Standing with their faction. A Cleric of Silean loses 2 Favour.">Execute</button><button onclick="prisonerAct(${i},'release')">Release</button></div></div>`).join('')
    : '<div class="sub">No prisoners. Commanders who surrender at a Parley come home here.</div>';

  $('table-inner').style.backgroundImage = `url(${tableWoodURL()})`;
  $('table-inner').innerHTML = `${props}
    <div class="table-head"><h1>The Planning Table</h1><button class="btn small" onclick="renderTitle()">BACK TO THE CAMP</button></div>
    <div class="table-grid">
      <div>
        <div class="scroll"><h3>Contracts on Offer</h3><div class="cscrolls">${cons}</div></div>
        <div class="scroll" id="tbl-council"><h3>War Council</h3>
          <div class="council"><div class="master"><img src="${masterPortraitURL()}">${esc(ensureMaster().name)}<br>Chapter Master<br><span style="font-style:normal;font-size:14px">${CLASSES[ensureMaster().cls].name}${cmMatches(sel.patron) ? '<br><b style="color:#226b2a">One of their own: +1 step</b>' : ''}</span></div>
          <div style="flex:1"><div class="speech">"${councilLine(sel)}"</div>${council}</div></div></div>
        <div class="scroll" id="tbl-march"><h3>Who Marches (${MU.ids.length} / 5)</h3>
          <div class="sub" style="font-size:14px">Hazard Upkeep: 10gp per Squad Mate standing at the end of a paid contract. Click to add or remove.</div>
          <div class="marchers">${marchers}</div>
          <div style="margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="font-size:14px">Squad kit:</b> ${kit}</div>
          ${over ? `<div class="sub" style="color:#8b0000;font-weight:bold">The roster is over capacity (${META.roster.length} / ${rosterCap()}). Release someone first.</div>` : ''}
          <button class="sealbtn" ${over ? 'disabled' : ''} onclick="deploy()"><img src="${sealURL('sword', '#8a1a1a')}">SIGN AND MARCH: ${OBJECTIVES[sel.obj].name}</button></div>
      </div>
      <div>
        <div class="scroll" id="tbl-ambition"><h3>Charter Ambition</h3>${amb}</div>
        <div class="scroll" id="tbl-factions"><h3>Arcadia: Faction Standing</h3>
          <div class="mapwrap"><img src="${mapURL()}">${seals}</div>
          <div class="sub" style="font-size:14px;margin-top:6px">A completed contract raises Standing with the patron's faction; fleeing lowers it. Killing a faction's commander costs 1; a surrender does not. At +2 Allied, at -2 Hostile.</div>
          <div class="flist">${flist}</div></div>
        <div class="scroll" id="tbl-doctrines"><h3>Book of Doctrines</h3><div class="ledger">${docs}</div></div>
        <div class="scroll ledger" id="tbl-rivals"><h3>Rivals</h3>${rivalsHTML()}${nemeses().length ? nemeses().map(n => `<div class="line"><img src="${enemyIconURL(n.k)}"><div class="grow"><b>${esc(n.name)}</b><br>${HOSTS[n.host].name}. Has escaped you ${n.grudge} time${n.grudge > 1 ? 's' : ''}; ${25 * n.grudge}% tougher for it.</div></div>`).join('') : '<div class="sub">Commanders who get away from you will be written here. They remember.</div>'}</div>
        <div class="scroll ledger" id="tbl-ledger"><h3>Prisoner Ledger</h3><div class="sub" style="font-size:14px">${has('cells') ? 'The Prisoner Cells hold up to six for free.' : 'Without Prisoner Cells each prisoner costs 5gp a contract and escapes after two.'}</div>${ledger}
          ${CH_MSG ? `<div class="speech" style="margin:10px 0 0 10px">${CH_MSG}</div>` : ''}</div>
      </div>
    </div>`;
}


/* ============================================================================
   CAMP RAIDS - between contracts, raiders may come for the camp: more often
   when a faction is Hostile. The squad defends the Chapter House on a map of
   the camp. Defences built in camp (palisade, watchtowers, the Sapper's Yard)
   are there, the squad gets time to set its own traps, and retired veterans
   and officers fight beside it. They can be knocked out, but never die.
============================================================================ */
FACILITIES.push(
  {id:'palisade',  cat:'Defences', name:'Palisade & Gatehouse', cost:180, x:50, desc:'A stake wall round the camp with four gates. In a raid, raiders must come through the gates.'},
  {id:'watchtower',cat:'Defences', name:'Watchtowers',          cost:220, x:60, desc:'Four archer towers. In a raid they shoot at anything in range. Needs the Palisade.', req:'palisade'},
  {id:'trapyard',  cat:'Defences', name:"Sapper's Yard",        cost:140, x:70, desc:'+4 traps to set before a raid, and the squad spots enemy traps on contracts from further away.'}
);
Object.assign(FAC_LOOK, {palisade:{type:'gate'}, watchtower:{type:'watch'}, trapyard:{type:'house', wall:'log', roof:'#5a4a3a', glyph:'stake'}});
Object.assign(PLOTS, {palisade:[880, 1088], watchtower:[1170, 215], trapyard:[610, 1075]});
const OBJ_DEFEND = 'defend';
OBJECTIVES.defend = {name:'Defend the Camp', brief:'Hold the Chapter House against the raiders.'};
const FACTION_HOST = {empire:'deserters', suderia:'bandits', mendor:'hollow', dwarves:'greenskins', reprobates:'bandits', skulk:'bandits'};

// Gatehouse and watchtower art for the camp map (drawBuilding types)
const _drawBuilding = drawBuilding;
drawBuilding = function(P, look){
  if (look.type === 'gate'){
    for (let x = 0; x < 32; x += 3){ if (x > 9 && x < 21) continue; P(x, 12, 3, 19, C.wood); P(x, 11, 3, 2, '#b08a5a'); P(x + 2, 14, 1, 17, C.woodD); }
    P(8, 4, 4, 27, '#7a5230'); P(20, 4, 4, 27, '#7a5230'); P(7, 3, 18, 3, C.woodD); P(7, 2, 18, 1, '#b08a5a');
    P(12, 9, 8, 22, '#4a3020'); for (let y = 11; y < 30; y += 4) P(12, y, 8, 1, '#2a1a10');
    drawBannerArt(P, banner(), 10, -10);
    return;
  }
  if (look.type === 'watch'){
    P(10, 12, 2, 19, C.woodD); P(20, 12, 2, 19, C.woodD); for (let y = 16; y < 30; y += 5){ P(12, y, 8, 1, C.wood); }
    P(7, 6, 18, 7, C.wood); P(7, 6, 18, 1, '#b08a5a'); for (let x = 8; x < 25; x += 4) P(x, 3, 2, 3, C.wood);
    roof(P, 6, 26, -2, 3, '#5a4a3a'); P(14, 8, 4, 3, '#2a2a2a');
    return;
  }
  return _drawBuilding(P, look);
};

/* ---------------------------------------------------------------------------
   WHEN DO RAIDS COME
--------------------------------------------------------------------------- */
function rollRaid(c, lines){
  if (c.obj === OBJ_DEFEND || META.deployments < 3 || META.raid || META.lastRaid === META.deployments - 1) return;
  const hostile = Object.keys(FACTIONS).filter(f => standing(f) <= -2 && !NO_RAIDERS.includes(f));   /* Index 49 */
  const chance = Math.min(0.55, 0.12 + 0.2 * hostile.length);
  if (Math.random() > chance) return;
  const fac = hostile.length && Math.random() < 0.8 ? pickOf(hostile) : null;
  const lvl = META.leader ? META.leader.level : 1;
  META.raid = {host:fac ? FACTION_HOST[fac] : pickOf(HOST_KEYS), tier:Math.min(3, 1 + Math.floor((lvl - 1) / 3)), faction:fac};
  if (lines) lines.push(`<p class="bad"><b>Riders on the road behind you.</b> ${fac ? `${cap(facName(fac))} have paid ${HOSTS[META.raid.host].the} to burn your camp.` : `${cap(HOSTS[META.raid.host].the)} ${hostBe(META.raid.host, 'have', 'has')} found your camp.`} They will be there when you get back.</p>`);
}
function makeRaidContract(R){
  const c = {obj:OBJ_DEFEND, tier:R.tier, host:R.host, place:'the Chapter camp', edges:[], council:null, picks:0, minutes:1 + R.tier,
             pay:60 * R.tier, patron:'the Chapter itself', faction:null, raidFaction:R.faction};
  c.brief = `${cap(HOSTS[c.host].the)} ${hostBe(c.host, 'are', 'is')} coming for the camp. Hold the Chapter House for ${c.minutes} minutes. Retired veterans and officers fight beside you.`;
  return c;
}
function startRaid(){
  const R = META.raid; if (!R) return;
  META.raid = null; META.lastRaid = META.deployments; saveMeta(); closePanel();
  const ids = META.roster.filter(p => !p.resting && !p.away).slice(0, 5).map(p => p.id);
  startDeployment(makeRaidContract(R), ids);
}
function payOffRaid(){
  const loss = Math.round(META.treasury * 0.3);
  META.treasury -= loss; META.raid = null; META.lastRaid = META.deployments; saveMeta(); closePanel(); refreshUI();
  SFX.play('nope');
}
/* K40 (F-48 UX): one gang 'is', plural hosts 'are'; the line opens with a capital when nobody pays. Parley is for hosts that talk. */
const raidVerb = H => /^an? /.test(H.the) ? 'is' : 'are';
function hostBe(h, pl, sg){ try { return /^an? /.test(HOSTS[h].the) ? sg : pl; } catch (e) { return pl; } }   /* K40: hostBe(c.host, 'are', 'is') */
const raidCap = t => t.charAt(0).toUpperCase() + t.slice(1);
const RAID_NO_PARLEY = ['hollow', 'monsters'];   /* the Hollow dead and beasts do not bargain */
function raidPanelHTML(){
  const R = META.raid, H = HOSTS[R.host];
  return `<h2>Raiders!</h2><img class="pimg" src="${enemyIconURL(H.pools[R.tier][0])}">
    <div class="desc" style="text-align:left">${R.faction ? `Paid by ${facName(R.faction)}, ${H.the} ${raidVerb(H)}` : `${raidCap(H.the)} ${raidVerb(H)}`} at the edge of the camp: a Tier ${R.tier} raid. Hold the Chapter House for ${1 + R.tier} minutes.</div>
    <div class="desc" style="text-align:left;margin-top:6px"><b>On your side:</b> ${[has('palisade') ? 'the palisade' : '', has('watchtower') ? 'four watchtowers' : '', `${raidTrapStock()} traps to set`].filter(Boolean).join(', ')}${(META.retired || []).length + officers().length ? `, and ${(META.retired || []).length + officers().length} veterans and officers who will fight` : ''}.</div>
    <button class="btn gold" onclick="startRaid()">DEFEND THE CAMP</button>
    <button class="btn small" onclick="payOffRaid()">LET THEM LOOT IT (lose ${Math.round(META.treasury * 0.3)}gp)</button>`;
}
const raidTrapStock = () => 3 + (has('trapyard') ? 4 : 0) + (has('engineering') ? 2 : 0);

/* ---------------------------------------------------------------------------
   THE CAMP AS A BATTLEFIELD
--------------------------------------------------------------------------- */
function generateRaidMap(contract){
  const w = 48, h = 40,   /* Index 48 */ r = rng(contract.seed || 7), g = new Uint8Array(w * h);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  const M = {w, h, g, seed:contract.seed, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null, cages:[], nests:[], engines:[], beacons:[]};
  const cx = w >> 1, cy = h >> 1;
  const nf = valueNoise(w, h, 8, r);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const d = Math.hypot((x - cx) / 1.2, y - cy); if (d > 20 && nf(x, y) > 0.55) set(x, y, T.FOREST); else if (d < 14) set(x, y, r() < .1 ? T.ROAD : T.GRASS); }
  for (let k = -16; k <= 16; k++){ set(cx + k, cy + 3, T.ROAD); set(cx, cy + k, T.ROAD); set(cx + k, cy + 4, T.ROAD); }
  // the Chapter House, in the middle
  for (let y = cy - 3; y <= cy - 1; y++) for (let x = cx - 1; x <= cx + 1; x++) set(x, y, T.STONE);
  // tents and huts round it
  for (const [ox, oy] of [[-8,-6],[8,-6],[-9,6],[9,6],[-5,8],[5,-9]]) if (r() < .85){ set(cx + ox, cy + oy, T.TENT); set(cx + ox + 1, cy + oy, T.TENT); }
  if (has('palisade')){
    const R = 13;
    for (let a = 0; a < 720; a++){ const t = a / 720 * TAU, x = Math.round(cx + Math.cos(t) * R * 1.25), y = Math.round(cy + Math.sin(t) * R);
      const gate = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].some(gt => Math.abs(((t - gt + Math.PI * 3) % TAU) - Math.PI) < 0.13);
      if (!gate) set(x, y, T.PALISADE); }
    M.towers = has('watchtower') ? [[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sy]) => ({x:(cx + sx * R * 0.82 + .5) * CELL, y:(cy + sy * R * 0.62 + .5) * CELL, timer:0})) : [];
  } else M.towers = [];
  for (let x = 0; x < w; x++){ set(x, 0, T.STONE); set(x, h - 1, T.STONE); }
  for (let y = 0; y < h; y++){ set(0, y, T.STONE); set(w - 1, y, T.STONE); }
  M.start = {x:cx, y:cy + 2};
  M.house = {x:(cx + .5) * CELL, y:(cy - 1.5) * CELL};
  MAP = M;
  M.reach = bfsFrom((cx + .5) * CELL, (cy + 2.5) * CELL);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y * w + x] === T.FOREST && r() < 0.55) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); M.seen = new Uint8Array(w * h);
  M.seen.fill(1);
  return M;
}
function setupRaid(c){
  G.house = {x:MAP.house.x, y:MAP.house.y, hp:110 + 40 * c.tier, maxHp:110 + 40 * c.tier, r:66, ac:7, shift:3, objHp:true, flash:0};
  G.towers = MAP.towers;
  G.prepT = 25 * 60; G.raidT = 0; G.trapStock = raidTrapStock(); G.trapKind = 0; G.traps = [];
  // retired veterans and officers fight as allies
  G.allies = [];
  const who = (META.retired || []).map(p => ({p, s:mateStats(p), vet:true})).concat(officers().filter(o => !(o.resting > 0) && !o.away).map(o => ({p:o, s:leaderStats(o), vet:false})));
  who.forEach((a, i) => {
    const ang = i / Math.max(1, who.length) * TAU, hx = G.house.x + Math.cos(ang) * 110, hy = G.house.y + 90 + Math.sin(ang) * 60;
    G.allies.push({p:a.p, s:a.s, spec:a.p.spec, x:hx, y:hy, hx, hy, hp:a.s.con * 2, maxHp:a.s.con * 2, ac:G.armour.ac, shift:G.armour.shift, r:10, objHp:true, ally:true,
      state:'up', koT:0, timer:30 + i * 9, atkT:0, left:false, flash:0, vet:a.vet, spr:personSprite(a.p, !a.vet)});
  });
  note(`Raiders are coming. You have 25 seconds: [F] sets a trap where the Leader stands, [G] picks the kind, [ENTER] sounds the horn early.`);
}
const RAID_TRAPS = ['caltrops','beartrap','firepot','stakes'];
function raidSetTrap(){
  if (!G || G.trapStock === undefined || G.trapStock <= 0) return SFX.play('nope');
  const k = RAID_TRAPS[G.trapKind], L = G.leader;
  if (G.traps.some(t => dist(t, L) < 30)) return pop(L.x, L.y - 30, 'TOO CLOSE TO ANOTHER TRAP', '#999');
  G.traps.push({x:L.x, y:L.y + 14, kind:k, armed:true, enemy:false, seen:true, uses:k === 'stakes' ? 8 : 1});
  G.trapStock--; pop(L.x, L.y - 30, TRAPS[k].name.toUpperCase() + ' SET', '#8fd39a'); SFX.play('brace');
}
function raidCycleTrap(){ if (G && G.trapStock !== undefined){ G.trapKind = (G.trapKind + 1) % RAID_TRAPS.length; SFX.play('pick'); } }
function raidStart(){ if (G && G.prepT > 0){ G.prepT = 1; SFX.play('horn'); } }

function raidEdgePoint(){
  for (let i = 0; i < 40; i++){
    const side = Math.random() * 4 | 0, t = Math.random();
    const cx = side < 2 ? 2 + t * (MAP.w - 4) : side === 2 ? 2 : MAP.w - 3, cy = side >= 2 ? 2 + t * (MAP.h - 4) : side === 0 ? 2 : MAP.h - 3;
    const x = (cx + .5) * CELL, y = (cy + .5) * CELL, i2 = cellIdx(x, y);
    if (MAP.reach[i2] >= 0) return {x, y};
  }
  return null;
}
function raidSpawn(){
  if (G.prepT > 0) return;
  const prog = G.raidT / (G.contract.minutes * 3600), w = hostWave(Math.floor(prog * 6) + TIER_WAVE_OFFSET[G.contract.tier]);
  const awake = G.enemies.length;
  if (--G.spawnClock <= 0){
    G.spawnClock = Math.round(w.rate * 2.3);
    const n = Math.min(MAX_ENEMIES - awake, Math.max(2, w.burst - 1) + Math.floor(G.raidT / 6000)), p = raidEdgePoint();
    if (p) for (let i = 0; i < n; i++){ const e = spawnEnemy(pickKind(w.pool), p.x + rnd(-60, 60), p.y + rnd(-60, 60)); if (e) e.seen = true; }
  }
  [0.5, 0.92].forEach((at, i) => {
    if (!G.bossesDone[i] && prog >= at){ const p = raidEdgePoint(); if (!p) return; G.bossesDone[i] = true;
      const e = spawnEnemy(pickOf(hostBosses()), p.x, p.y); if (e){ e.seen = true; SFX.play('boss'); note(`${ename(e)} leads the raid.`); G.shake = 16; } }
  });
}
function updateRaid(){
  if (G.prepT > 0){ if (--G.prepT === 0){ note('The raiders are here!'); SFX.play('horn'); G.spawnClock = 1; } }
  else G.raidT++;
  if (G.house.flash > 0) G.house.flash--;
  // watchtowers
  for (const t of G.towers){ if (--t.timer > 0) continue;
    const e = nearest(t, 340, null, false); if (!e){ t.timer = 20; continue; }
    const a = Math.atan2(e.y - t.y + 30, e.x - t.x);
    G.shots.push({x:t.x, y:t.y - 30, vx:Math.cos(a) * 9, vy:Math.sin(a) * 9, life:60, kind:'arrow', skill:3, dmg:3, flat:0}); t.timer = 55; }
  // allies
  for (const a of G.allies){
    if (a.flash > 0) a.flash--; if (a.atkT > 0) a.atkT--;
    if (a.state === 'ko'){ if (--a.koT <= 0){ a.state = 'up'; a.hp = Math.ceil(a.maxHp / 2); pop(a.x, a.y - 20, 'BACK UP', '#8fd39a'); } continue; }
    let tgt = null, bd = 280;
    for (const e of G.enemies){ if (e.dead) continue; const d = Math.min(dist(e, a), dist(e, {x:a.hx, y:a.hy}) + 40); if (d < bd){ bd = d; tgt = e; } }
    const goal = tgt ? {x:tgt.x, y:tgt.y} : {x:a.hx, y:a.hy}, dx = goal.x - a.x, dy = goal.y - a.y, d = Math.hypot(dx, dy);
    const ranged = a.spec === 'FOLK_HERO' || a.spec === 'MAGE' || a.spec === 'WITCH', want = tgt ? (ranged ? 180 : 38) : 4;
    if (d > want){ a.x += dx / d * 0.95; a.y += dy / d * 0.95; a.left = dx < 0; a.moving = true; } else a.moving = false;
    collide(a, 9);
    if (tgt && --a.timer <= 0){
      a.left = tgt.x < a.x; a.atkT = 12;
      if (dist(a, tgt) < 50){ strike(tgt, a.s.melee + 1, G.melee.dmg, {from:a}); a.timer = 52; fxArc(a, tgt); }
      else if (ranged && dist(a, tgt) < 300){ const ang = Math.atan2(tgt.y - a.y, tgt.x - a.x);
        G.shots.push({x:a.x, y:a.y - 6, vx:Math.cos(ang) * 9, vy:Math.sin(ang) * 9, life:60, kind:a.spec === 'FOLK_HERO' ? 'arrow' : 'missile', target:tgt, skill:a.s.ranged + 1, dmg:G.ranged.dmg, flat:0}); a.timer = 60; }
      else a.timer = 10;
    }
  }
}
function raidTarget(e){
  let best = null, bd = 200;
  for (const a of G.allies) if (a.state === 'up'){ const d = dist(e, a); if (d < bd){ bd = d; best = a; } }
  if (best && bd < dist(e, G.leader)) return best;
  if (G.house.hp > 0 && (e.seed % 3 === 0 || dist(e, G.house) < 140)) return G.house;
  return null;
}
function raidKO(a){
  if (!a.ally || a.state !== 'up' || a.hp > 0) return;
  a.state = 'ko'; a.koT = 600; a.hp = 0; pop(a.x, a.y - 20, a.p.name.toUpperCase() + ' KNOCKED OUT', '#ff8a7a'); SFX.play('down');
}
function raidCheck(){
  if (G.house.hp <= 0) return contractFail('THE CAMP IS SACKED', 'The Chapter House is burning.');
  if (G.raidT >= G.contract.minutes * 3600){ endDeployment('victory'); return true; }
  return false;
}
function raidLine(t){
  if (G.prepT > 0) return [`PREPARE  ${Math.ceil(G.prepT / 60)}s`, `[F] SET ${TRAPS[RAID_TRAPS[G.trapKind]].name.toUpperCase()} (${G.trapStock} LEFT)  \u00b7  [G] NEXT TRAP  \u00b7  [ENTER] SOUND THE HORN`];
  const left = Math.max(0, G.contract.minutes * 60 - Math.floor(G.raidT / 60));
  return [`${String(left / 60 | 0).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`, `CHAPTER HOUSE ${Math.max(0, G.house.hp)} / ${G.house.maxHp}  \u00b7  ${G.trapStock} TRAPS LEFT [F]`];
}
function raidBodies(bodies, onScreen){
  bodies.push({y:G.house.y + 30, custom:() => {
    const H = G.house, img = houseCanvas(), s = 3.6, w = img.width * s, hh = img.height * s;
    ctx.save(); if (H.flash > 0) ctx.filter = 'brightness(1.6)'; ctx.drawImage(img, H.x - w / 2, H.y - hh + 66, w, hh); ctx.restore();
    if (!w3dChBanner(H.x + w / 2 - 6, H.y + 63, 3)) PROPS3D.blob(H.x + w / 2 + 6, H.y + 30, 6, 22, '#8a1a1a');   /* S6-C 3a step 4: 3D Chapter banner */
    if (H.hp < H.maxHp * 0.5 && G.frame % 6 === 0) G.fx.push({x:H.x + rnd(-40, 40), y:H.y - 40, vx:rnd(-.3, .3), vy:-1.2, life:40, c:'#ff8a2a', px:3});
    const bw = 140, top = H.y - hh + 52;
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(H.x - bw / 2 - 1, top - 1, bw + 2, 8);
    ctx.fillStyle = H.hp > H.maxHp * 0.3 ? '#6fd37a' : '#e0503a'; ctx.fillRect(H.x - bw / 2, top, bw * Math.max(0, H.hp / H.maxHp), 6);
    ctx.fillStyle = '#f0e6d2'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 12) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(HS().house.toUpperCase(), H.x, top - 5); }});
  for (const t of G.towers) if (onScreen(t, 80)) bodies.push({y:t.y, custom:() => { const img = facilityCanvas('watchtower'); ctx.drawImage(img, t.x - img.width * 1.4, t.y - img.height * 2.8 + 10, img.width * 2.8, img.height * 2.8); }});
  for (const a of G.allies) if (onScreen(a)) bodies.push({y:a.y, custom:() => {
    if (a.state === 'ko'){ drawDowned(a.spr, a.x, a.y, 2.4, 0.8); ctx.fillStyle = '#9fe0ff'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 10) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText('KNOCKED OUT ' + Math.ceil(a.koT / 60) + 's', a.x, a.y + 26); return; }
    ctx.beginPath(); ctx.ellipse(a.x, a.y + 17, 14, 5, 0, 0, TAU); ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 2; ctx.stroke();
    drawSprite(a.spr, a.x, a.y, 2.4, a.atkT > 0 ? 3 : a.moving ? 1 + ((G.frame / 9 | 0) % 2) : 0, a.left, a.flash > 0);
    for (let i = 0; i < a.maxHp; i++){ ctx.fillStyle = i < a.hp ? '#9fe0ff' : 'rgba(0,0,0,.45)'; ctx.fillRect(a.x - a.maxHp * 2 + i * 4, a.y + 22, 3, 3); }
    ctx.fillStyle = '#9fe0ff'; ctx.font = 'bold ' + (window.canvasPx106 ? canvasPx106(ctx, 10) : 14).toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.fillText(a.p.name + (a.vet ? ' (veteran)' : ' (officer)'), a.x, a.y - 30); }});
}
function raidDebrief(c, result, lines){
  if (result === 'victory') lines.push(`<p class="good">The camp holds. ${G.allies.length ? 'The veterans patch each other up and are back at work by morning.' : ''}</p>`);
  else { const loss = Math.round(META.treasury * 0.3); META.treasury -= loss;
    lines.push(`<p class="bad">The raiders loot the camp and carry off ${loss}gp from the Treasury before they go.</p>`); }
}

/* ---------------------------------------------------------------------------
   HOOKS into the contract machinery
--------------------------------------------------------------------------- */
const _gen = generateMap; generateMap = c => c.obj === OBJ_DEFEND ? generateRaidMap(c) : _gen(c);
const _setup = setupContract; setupContract = c => c.obj === OBJ_DEFEND ? setupRaid(c) : _setup(c);
const _update = updateContract; updateContract = () => G.obj === OBJ_DEFEND ? updateRaid() : _update();
const _check = contractCheck; contractCheck = () => G.obj === OBJ_DEFEND ? raidCheck() : _check();
const _prog = contractProgress; contractProgress = () => G.obj === OBJ_DEFEND ? (G.prepT > 0 ? 0 : Math.min(1, G.raidT / (G.contract.minutes * 3600))) : _prog();
const _line = contractLine; contractLine = t => G.obj === OBJ_DEFEND ? raidLine(t) : _line(t);
const _bodies = contractBodies; contractBodies = (b, o) => G.obj === OBJ_DEFEND ? raidBodies(b, o) : _bodies(b, o);
const _marks = contractMarkers; contractMarkers = out => { if (G.obj === OBJ_DEFEND){ out.push({x:G.house.x, y:G.house.y, kind:'ally', sp:'wagon'}); for (const a of G.allies) out.push({x:a.x, y:a.y, kind:'ally'}); return; } _marks(out); };
const _how = contractHow; contractHow = (c, r) => c.obj === OBJ_DEFEND ? `The raid on the camp ${r === 'victory' ? 'was beaten off' : 'broke through'}; the Chapter House stands at ${Math.max(0, G.house.hp)} of ${G.house.maxHp}.` : _how(c, r);
const _deb = contractDebrief; contractDebrief = (c, r, l) => c.obj === OBJ_DEFEND ? raidDebrief(c, r, l) : _deb(c, r, l);
const _ot = objTarget; objTarget = e => G.obj === OBJ_DEFEND ? raidTarget(e) : _ot(e);
const _spawn = spawn; spawn = () => G.obj === OBJ_DEFEND ? raidSpawn() : _spawn();
const _dmg = damageObjective; damageObjective = (t, d) => { _dmg(t, d); if (t.ally) raidKO(t); };
const _shot = shotHitsObjective; shotHitsObjective = s => {
  if (G.obj === OBJ_DEFEND){
    if (s.at === G.house && G.house.hp > 0 && Math.hypot(G.house.x - s.x, G.house.y - s.y) < 60){ damageObjective(G.house, Math.max(1, damageRoll(s.dmg || 2, 2) - 1)); return true; }
    for (const a of G.allies) if (a.state === 'up' && Math.hypot(a.x - s.x, a.y - 6 - s.y) < 12){ damageObjective(a, Math.max(1, damageRoll(s.dmg || 2, a.shift) - 1)); return true; }
    return false;
  }
  return _shot(s);
};


window.CAMP_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    const svCam = {x: CAMP.cam.x, y: CAMP.cam.y}, svSave = saveMeta;
    try {
      saveMeta = function(){};   // LE: ensureMaster saves; the test's fresh META must never reach the real save
      META = freshMeta();
      const m = ensureMaster();
      ok('ensureMaster creates Chapter Master with name and cls', !!m && typeof m.name === 'string' && !!m.cls);
      const wps = waypoints();
      ok('waypoints returns non-empty camp waypoint list', Array.isArray(wps) && wps.length > 0);
      centreCamOn(500, 400);
      ok('centreCamOn sets finite CAMP.cam coordinates', Number.isFinite(CAMP.cam.x) && Number.isFinite(CAMP.cam.y));
    } catch (e) { ok('threw', false, e && e.message); }
    finally { saveMeta = svSave; META = svM; CAMP.cam.x = svCam.x; CAMP.cam.y = svCam.y; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
