/* js/core/rules-save-map.js (INT-1 step 2, 2026-11-16): the shifted d6 ladder, SAVE DATA, THE MAP (battlefield generation).
   Cut unchanged from the inline script in index.html (old lines 1373 to 1958). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   THE SHIFTED d6 LADDER - Core Rules 1.4, 1.5, 3.3
============================================================================ */
const clampSkill = s => Math.max(0, Math.min(6, s|0));
const d6 = () => 1 + (Math.random()*6|0);
const rollDie = s => clampSkill(s) + (Math.random()*6|0);

// Luck changes numbers, never status (6.7). Nudge adds +1 to the face but
// cannot rescue a Natural Minimum or create a Natural Max. Burning Luck turns
// the die into its Natural Maximum Face.
function attackDie(skill, targetAC, luckFx){
  skill = clampSkill(skill);
  const lo = skill, hi = skill + 5;
  let face = rollDie(skill);
  let natMin = face === lo, natMax = face === hi;
  if (luckFx && luckFx.burn){ face = hi; natMin = false; natMax = true; }
  else if (luckFx && luckFx.nudge && !natMin && !natMax) face += 1;
  let out;
  if (natMin) out = 'miss';
  else if (natMax) out = face >= targetAC ? 'crit' : 'graze';
  else if (face > targetAC) out = 'solid';
  else if (face === targetAC) out = 'graze';
  else out = 'miss';
  return {face, out, natMin, natMax};
}
// Damage mapping: 0-2 = 1, 3-4 = 2, 5-6 = 3, 7+ = 4. Minimum 1.
function damageRoll(baseSkill, armourShift){
  const f = rollDie(clampSkill(baseSkill - armourShift));
  return Math.max(1, f <= 2 ? 1 : f <= 4 ? 2 : f <= 6 ? 3 : 4);
}

/* ============================================================================
   SAVE DATA - the campaign
============================================================================ */
let SAVE_KEY = 'dust_cloaks_v4';
let META = null;
function freshMeta(){
  return {
    treasury:200,                 // Section 1.7: 200gp to build a first facility
    leader:null, roster:[], facilities:{},
    gear:{armour:'padded', shield:'bucklers', melee:'spears', ranged:'shortbows', kits:[], mount:'nomount',
          owned:['rags','padded','none','bucklers','spears','shortbows','nomount']},   // charter starting kit
    board:null, memorial:[], deployments:0, nextId:1, pendingPicks:0, fallenLevel:1,
    retired:[], prisoners:[], standing:{}, doctrines:{}, stats:{}, ambition:null, intel:null
  };
}
/* A Leader saved in a Squad Mate's shape (no level; Art's ?f33=1 save showed 'Advancements 0 / NaN') becomes a Leader again: mateToLeader,
   keeping the F-33 book, loadout, ranks and drills. */
function fixLeaderShape(L, M){
  if (!L || typeof L !== 'object' || Number.isFinite(L.level)) return L;
  try { const N = mateToLeader(Object.assign({injuries: []}, L, {adv: L.adv | 0}), 11);
        for (const k of ['book', 'slots', 'rank', 'book33m', 'study33At', 'drills', 'mem', 'cosmetic', 'portrait']) if (L[k] !== undefined) N[k] = L[k];
        if (M) M.pendingPicks = Math.max(M.pendingPicks | 0, N.pendingPicks | 0); delete N.pendingPicks; return N; }
  catch (e){ L.level = Math.max(1, (L.adv | 0) + 1); L.ticks = L.ticks | 0; L.burnt = L.burnt | 0; if (!Array.isArray(L.picks)) L.picks = []; return L; }
}
function migrateMeta(d){   /* Fable job 4 (audits/fable/saves.md): the one load path for the save slot, an imported file and a restored backup */
  const F = freshMeta(), M = Object.assign(F, d || {});
  M.gear = Object.assign(freshMeta().gear, (M.gear && typeof M.gear === 'object') ? M.gear : {});
  if (!Array.isArray(M.gear.owned)) M.gear.owned = freshMeta().gear.owned;
  if (!Array.isArray(M.gear.kits)) M.gear.kits = [];
  for (const k of ['roster', 'memorial', 'retired', 'prisoners']) if (!Array.isArray(M[k])) M[k] = [];
  for (const k of ['facilities', 'standing', 'doctrines', 'stats']) if (!M[k] || typeof M[k] !== 'object') M[k] = {};
  if (M.board && (!Array.isArray(M.board) || M.board.some(c => !c || !c.obj || !c.faction || !c.host))) M.board = null;     // contracts from an older version
  M.leader = fixLeaderShape(M.leader, M);
  return M;
}
function loadMeta(){
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); META = d ? migrateMeta(d) : freshMeta(); }
  catch(e){ META = freshMeta(); }
}
function saveMeta(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(META)); } catch(e){} }
var HAS_RAW = 0;
const has = id => (typeof id === 'string' && (id[0] === '@' || id[0] === '#')) ? (id[0] === '@' ? allied(id.slice(1)) : mastery(id.slice(1))) : !!(META && META.facilities[id] && !(META.damaged && META.damaged[id] && !HAS_RAW));   /* Index 37, Index 48: damaged facilities */

/* INDEX NU1 (2026-11-13, Director): no recruit shares a name with the Leader or anyone in the company. randomName skips the
   names in use (Leader, Master, scribe, bard, roster, officers, hiring line, story offer) and the names it handed out in this
   same task (a batch such as six offers at once). Rollback: NAME_UNIQUE.on = false. */
const NAME_UNIQUE = {on: true, recent: new Set()};
function namesInUse(){
  const s = new Set(NAME_UNIQUE.recent), add = p => { if (p && p.name){ s.add(p.name); s.add(String(p.name).split(' ')[0]); } };
  try { if (typeof META !== 'undefined' && META){ [META.leader, META.master, META.scribe, META.bard].forEach(add); [META.roster, META.officers, META.hireLine && META.hireLine.recruits, META.cp && META.cp.offer, META.cp && META.cp.comp,
    META.cp && META.cp.folk, META.memorial, META.folk30].forEach(l => (l || []).forEach(add)); ((META.cp && META.cp.gone) || []).forEach(n => add({name: n})); } } catch (e) {}   /* R8 (checklist R): families, the families lost on the road and the dead share the one list */
  try { [typeof CR !== 'undefined' && CR, typeof FD !== 'undefined' && FD].forEach(add); } catch (e) {}   /* NU1.1 (2026-11-13): the Quick muster companions (cp.comp) and the Leader and Master still being made */
  return s; }
function randomName(raceKey, sex){ const g = NAMES[RACES[raceKey].grp] || NAMES.HUMAN, s = sex || (Math.random() < .5 ? 'f' : 'm');
  if (!NAME_UNIQUE.on){ const list = g[s]; return list[Math.random()*list.length|0]; }
  const used = namesInUse(), free = l => l.filter(n => !used.has(n));
  let list = free(g[s]); if (!list.length && !sex) list = free(g[s === 'f' ? 'm' : 'f']); if (!list.length) list = g[s];
  const n = list[Math.random()*list.length|0], R = NAME_UNIQUE.recent; if (!R.size) Promise.resolve().then(() => R.clear()); R.add(n); return n; }
NAME_UNIQUE.selfTest = function(){
  const fails = [], ok = (c, m) => { if (!c) fails.push(m); }, M0 = META, R0 = new Set(NAME_UNIQUE.recent), g = NAMES.HUMAN;
  try {
    META = {leader: {name: g.f[0]}, roster: g.f.slice(1, -2).map(name => ({name})), officers: [], hireLine: null, cp: null}; NAME_UNIQUE.recent.clear();
    const a = randomName('HUMAN', 'f'), b = randomName('HUMAN', 'f');
    ok(g.f.slice(-2).includes(a) && g.f.slice(-2).includes(b) && a !== b, 'with all but two names taken, two draws give the two free names: ' + a + ', ' + b);
    const c = randomName('HUMAN', 'f'); ok(g.f.includes(c), 'with every name taken it still names someone');
    NAME_UNIQUE.recent.clear(); META = {leader: {name: 'Zed'}, roster: []};
    const six = Array.from({length: Math.min(6, g.f.length + g.m.length)}, () => randomName('HUMAN')); ok(new Set(six).size === six.length, 'a batch of six draws has no repeats: ' + six.join());
    NAME_UNIQUE.recent.clear(); META = {leader: null, roster: [], cp: {comp: g.f.slice(0, -1).map(name => ({name})), offer: null}};
    const d = randomName('HUMAN', 'f'); ok(d === g.f[g.f.length - 1], 'NU1.1: the Quick muster companions count as taken: ' + d);
    NAME_UNIQUE.recent.clear(); const fl = g.f.slice(0, -1), th = Math.ceil(fl.length / 3);
    META = {leader: null, roster: [], memorial: fl.slice(0, th).map(name => ({name})), cp: {folk: fl.slice(th, 2 * th).map(name => ({name})), gone: fl.slice(2 * th)}};
    const e = randomName('HUMAN', 'f'); ok(e === g.f[g.f.length - 1], 'R8: families, families lost on the road and the dead count as taken: ' + e);
  } finally { META = M0; NAME_UNIQUE.recent.clear(); R0.forEach(n => NAME_UNIQUE.recent.add(n)); }
  return {ok: !fails.length, n: 5, fails}; };
const rowFor = (spec, lvl) => ROWS[spec][Math.max(1, Math.min(11, lvl)) - 1];

function classMods(clsKey, specKey, leader){
  const c = Object.assign({}, leader ? CLASSES[clsKey].sl : CLASSES[clsKey].mate);
  if (c.skill){ if (specKey === 'FOLK_HERO') c.r = (c.r||0) + 1; else c.m = (c.m||0) + 1; delete c.skill; }
  return c;
}
function applyInjuries(s, injuries){
  for (const i of injuries || []){
    if (i === 'eye')  s.ranged -= 1;
    if (i === 'arm')  s.melee  -= 1;
    if (i === 'lung') s.con    -= 1;
    if (i === 'knee') s.move = Math.min(s.move, 3);
    if (i === 'shell') s.per  -= 1;
  }
}

/* ---------------------------------------------------------------------------
   THE SQUAD LEADER - Section 1.7, Tables 2.6 / 2.7
--------------------------------------------------------------------------- */
function leaderStats(L){
  const S = SPECS[L.spec], R = RACES[L.race], C = classMods(L.cls, L.spec, true);
  const row = rowFor(L.spec, L.level);
  const s = {
    con:   S.con + R.con + (C.con||0) + 1,
    melee: row[0] + R.m + (C.m||0) + (R.adapt ? 1 : 0),
    ranged:row[1] + R.r + (C.r||0) + (R.adapt ? 1 : 0),
    magic: S.caster ? Math.min(5, Math.max(S.mg + R.mg + (C.mg||0), L.magic || 0)) : 0,   /* Index 35: Magic carried over from a promoted Squad Mate */
    luck:  S.luck + R.luck + (C.luck||0) + 1,
    per:   S.per + R.per + (C.per||0) + 1,
    move:  R.move, wounds:0, wards:0, shift:0, soft2:false, focus:false
  };
  for (let l = 2; l <= L.level; l++){
    const b = rowFor(L.spec, l)[2];
    if (b === 'con') s.con++; else if (b === 'wounds') s.wounds++;
    else if (b === 'luck') s.luck++; else if (b === 'per') s.per++;
    else if (b === 'ward') s.wards++; else if (b === 'shift') s.shift++;
    else if (b === 'soft2') s.soft2 = true; else if (b === 'focus') s.focus = true;
  }
  applyInjuries(s, L.injuries);
  s.con = Math.max(2, s.con);
  s.melee = Math.max(0, s.melee); s.ranged = Math.max(0, s.ranged);
  s.magic = Math.max(0, s.magic); s.per = Math.max(0, s.per);
  s.rawLuck = s.luck + (has('command') ? 1 : 0) + (perk('dominion', 3) ? 1 : 0);
  s.luck = Math.max(0, Math.min(6, s.rawLuck) - (L.burnt||0)) + (allied('greycloaks') ? 1 : 0);   /* Index 35: Even Hand */
  s.maxWounds = s.con + s.wounds;
  return s;
}
function makeLeader(race, cls, spec, name){
  const L = {name, race, cls, spec, sex: FEMALE_NAMES.has(name) ? 'f' : 'm', level:1, ticks:0, burnt:0, picks:[], injuries:[], kills:0, deployments:0};
  const s = leaderStats(L);
  if (s.rawLuck > 6) META.treasury += (s.rawLuck - 6) * 60;          // Windfall: Purse
  return L;
}

/* ---------------------------------------------------------------------------
   SQUAD MATES - Section 1.7 step 5, Advancement in 4.6
--------------------------------------------------------------------------- */
function makeMate(race, cls, spec, name){
  const S = SPECS[spec], R = RACES[race], C = classMods(cls, spec, false);
  const row = rowFor(spec, 1);
  let startCon = S.con + R.con + (C.con||0);
  if (cls === 'FREEMAN') startCon = Math.min(FREEMAN_MATE_CON_CAP, startCon);
  return {
    id: META.nextId++, name, race, cls, spec, sex: FEMALE_NAMES.has(name) ? 'f' : 'm',
    baseM: row[0], baseR: row[1],
    modM: R.m + (C.m||0) + (R.adapt ? 1 : 0),
    modR: R.r + (C.r||0) + (R.adapt ? 1 : 0),
    startCon: Math.max(2, startCon), conTrained: 0,
    magic: S.caster ? Math.max(0, S.mg + R.mg + (C.mg||0)) : 0,
    adv: 0, injuries: [], deployments: 0, resting: 0, kills: 0
  };
}
function mateStats(p){
  const s = {con: p.startCon + p.conTrained, melee: p.baseM + p.modM, ranged: p.baseR + p.modR,
             magic: p.magic, move: RACES[p.race].move, per:0, eff: 1 + p.adv};
  applyInjuries(s, p.injuries);
  s.con = Math.max(2, s.con); s.melee = Math.max(0, s.melee); s.ranged = Math.max(0, s.ranged); s.magic = Math.max(0, s.magic);
  return s;
}
function mateFeatures(p){
  const e = 1 + p.adv, f = {ward:0, evade:false, soft2:false, focus:false};
  if (e >= 2 && ['SOLDIER','CLERIC','MAGE'].includes(p.spec)) f.ward = 1;
  if (p.spec === 'SCOUNDREL' && e >= 3) f.evade = true;
  if (p.spec === 'SCOUNDREL' && e >= 5) f.soft2 = true;
  if ((p.spec === 'MAGE' || p.spec === 'WITCH') && e >= 3) f.focus = true;
  return f;
}
function featureNote(spec, newEff){
  if (newEff === 2 && ['SOLDIER','CLERIC','MAGE'].includes(spec)) return {SOLDIER:'Iron Guard',CLERIC:'Battle Chaplain',MAGE:'Arcane Ward'}[spec] + ': +1 Ward';
  if (newEff === 3 && spec === 'SCOUNDREL') return 'Evade: +1 AC Out of Formation';
  if (newEff === 3 && (spec === 'MAGE' || spec === 'WITCH')) return (spec==='MAGE'?'Spell Focus':'Hex Weaver') + ': +60 range';
  if (newEff === 5 && spec === 'SCOUNDREL') return 'Soft Spot +2 / +3';
  return '';
}
const advCap = () => ((META.leader && +META.leader.level) || 1) + 1;

function applyAdvance(p, k){
  if (k === 'con') p.conTrained++; if (k === 'melee') p.baseM++;
  if (k === 'ranged') p.baseR++;   if (k === 'magic') p.magic++;
  p.adv++;
}

/* ---------------------------------------------------------------------------
   THE HIRING LINE - Tables 2.1 and 2.2
--------------------------------------------------------------------------- */
function rollRace(){
  const g = RACE_GROUP_ROLL[d6()-1];
  if (g === 'HUMAN') return 'HUMAN';
  for (;;){ const r = HERITAGE[g][d6()-1]; if (r) return r; }
}
function rollRecruit(forcedCls){   /* Index 35: a forced class is built in, not stuck on afterwards */
  const race = rollRace(), cls = CLASSES[forcedCls] ? forcedCls : CLASS_ORDER[d6()-1], spec = SPEC_ORDER[d6()-1];
  const m = makeMate(race, cls, spec, randomName(race));
  if (mastery('barracks')){ if (spec === 'FOLK_HERO') m.modR++; else m.modM++; }
  m.id = -(Math.random()*1e9|0);            // temporary id until hired
  return m;
}
const benchCap = () => 2 + (has('bunks') ? 6 : has('huts') ? 4 : has('tents') ? 2 : 0);   /* Index 37 */
const rosterCap = () => 5 + benchCap();

/* ---------------------------------------------------------------------------
   JOB BOARD
--------------------------------------------------------------------------- */
function rollBoard(){
  const lvl = META.leader ? META.leader.level : 1;
  const tiers = [1]; if (lvl >= 3) tiers.push(2); if (lvl >= 5) tiers.push(3);
  // Three of the ten contract kinds, each rolled with its own host, place and details.
  const objs = CONTRACT_KEYS.slice().sort(() => Math.random() - .5).slice(0, 3 + (hasDoc('courier') ? 1 : 0));   /* Index 37: The Courier Net */
  META.board = objs.map(obj => makeContract(obj, tiers[(Math.random()*tiers.length)|0]));
  saveMeta();
}

/* ============================================================================
   THE MAP - procedurally generated battlefields (Section 6.1 terrain)
   One cell is 40px, roughly one hex. Every map is bounded.
============================================================================ */
const CELL = 40;
const T = {GRASS:0, FOREST:1, STONE:2, WATER:3, HILL:4, ROAD:5, FLOOR:6, PALISADE:7, ROOF:8, TENT:9, RUBBLE:10, WALL:11, WAGON:12, GATE:13};
const BLOCKS = new Set([T.STONE, T.WATER, T.PALISADE, T.ROOF, T.TENT, T.WALL, T.WAGON, T.GATE]);
// The Chapter's own gates open for the Chapter: defenders pass, the enemy must break them.
const passable = (t, friend) => !BLOCKS.has(t) || (friend && t === T.GATE);
// Walls, palisades and wagons stop feet, not arrows: shots fly over them (cover, not a barrier).
const SHOT_PASS = new Set([T.PALISADE, T.WALL, T.WAGON, T.GATE]);
const shotBlocked = (x, y) => { const c = cellAt(x, y); return BLOCKS.has(c) && !SHOT_PASS.has(c); };
function losLine(a, b, step = 18){ const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / step);
  for (let i = 1; i < n; i++){ const t = i / n; if (shotBlocked(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false; } return true; }
const SLOW = {[T.FOREST]:0.62, [T.RUBBLE]:0.62, [T.HILL]:0.85};
const MINI_COL = {0:'#5f6d3e',1:'#2f4424',2:'#8a8a86',3:'#2e5a7a',4:'#8a9a52',5:'#9a865c',6:'#7a7468',7:'#8a5a2b',8:'#8a3a2a',9:'#c9b48a',10:'#6a6a58',11:'#9a9a96',12:'#8a5a2b',13:'#6a4a2a'};
let MAP = null;

const cellAt = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  if (!MAP || cx < 0 || cy < 0 || cx >= MAP.w || cy >= MAP.h) return T.STONE; return MAP.g[cy * MAP.w + cx]; };
const blockedXY = (x, y) => BLOCKS.has(cellAt(x, y));
const cellIdx = (x, y) => Math.floor(y / CELL) * MAP.w + Math.floor(x / CELL);
const inMap = (cx, cy) => cx >= 0 && cy >= 0 && cx < MAP.w && cy < MAP.h;

// Line of sight / clear path: walls and water block, forest does not.
function clearLine(a, b, step = 18){
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / step);
  for (let i = 1; i < n; i++){ const t = i / n; if (blockedXY(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false; }
  return true;
}

// Push a circle out of any blocking cell it overlaps, and keep it on the map.
function collide(e, r, friend){
  const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++){
    const gx = cx + ox, gy = cy + oy;
    if (inMap(gx, gy) && passable(MAP.g[gy * MAP.w + gx], friend)) continue;
    const x0 = gx * CELL, y0 = gy * CELL;
    const nx = Math.max(x0, Math.min(e.x, x0 + CELL)), ny = Math.max(y0, Math.min(e.y, y0 + CELL));
    let dx = e.x - nx, dy = e.y - ny, d2 = dx*dx + dy*dy;
    if (d2 >= r*r) continue;
    if (d2 < 0.0001){ // centre inside the block: push out along the shortest side
      const l = e.x - x0, rr = x0 + CELL - e.x, t = e.y - y0, b = y0 + CELL - e.y, m = Math.min(l, rr, t, b);
      if (m === l) e.x = x0 - r; else if (m === rr) e.x = x0 + CELL + r; else if (m === t) e.y = y0 - r; else e.y = y0 + CELL + r;
      continue;
    }
    const d = Math.sqrt(d2), push = (r - d) / d; e.x += dx * push; e.y += dy * push;
  }
  e.x = Math.max(r, Math.min(MAP.w * CELL - r, e.x)); e.y = Math.max(r, Math.min(MAP.h * CELL - r, e.y));
}

/* ---------------------------------------------------------------------------
   FLOW FIELD - one breadth-first search from the Leader, shared by every
   enemy, so the host walks around walls and through gaps instead of
   piling up against palisades.
--------------------------------------------------------------------------- */
function bfsFrom(x, y, out, friend){
  const w = MAP.w, h = MAP.h, g = MAP.g, D = out || new Int32Array(w * h);
  D.fill(-1);
  let sx = Math.floor(x / CELL), sy = Math.floor(y / CELL);
  if (!inMap(sx, sy)) return D;
  const q = new Int32Array(w * h); let qh = 0, qt = 0;
  D[sy * w + sx] = 0; q[qt++] = sy * w + sx;
  while (qh < qt){
    const i = q[qh++], cx = i % w, cy = (i / w) | 0, nd = D[i] + 1;
    if (cx > 0     && D[i-1] < 0 && passable(g[i-1], friend)){ D[i-1] = nd; q[qt++] = i-1; }
    if (cx < w-1   && D[i+1] < 0 && passable(g[i+1], friend)){ D[i+1] = nd; q[qt++] = i+1; }
    if (cy > 0     && D[i-w] < 0 && passable(g[i-w], friend)){ D[i-w] = nd; q[qt++] = i-w; }
    if (cy < h-1   && D[i+w] < 0 && passable(g[i+w], friend)){ D[i+w] = nd; q[qt++] = i+w; }
  }
  return D;
}
// Direction down the field from a position. Diagonals only when both sides are open.
function flowDir(D, x, y){
  const w = MAP.w, cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  if (!inMap(cx, cy)) return null;
  const here = D[cy * w + cx]; if (here <= 0) return null;
  let best = here, bx = 0, by = 0;
  for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const nx = cx + ox, ny = cy + oy; if (!inMap(nx, ny)) continue;
    const v = D[ny * w + nx]; if (v < 0) continue;
    if (ox && oy && (D[cy * w + nx] < 0 || D[ny * w + cx] < 0)) continue;
    if (v < best){ best = v; bx = ox; by = oy; }
  }
  if (!bx && !by) return null;
  const tx = (cx + bx + 0.5) * CELL, ty = (cy + by + 0.5) * CELL, dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
  return {x: dx / d, y: dy / d};
}

/* ---------------------------------------------------------------------------
   GENERATION
--------------------------------------------------------------------------- */
function valueNoise(w, h, scale, r){
  const gw = Math.ceil(w / scale) + 2, gh = Math.ceil(h / scale) + 2, grid = [];
  for (let i = 0; i < gw * gh; i++) grid.push(r());
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => { const fx = x / scale, fy = y / scale, ix = fx | 0, iy = fy | 0, tx = sm(fx - ix), ty = sm(fy - iy);
    const a = grid[iy*gw+ix], b = grid[iy*gw+ix+1], c = grid[(iy+1)*gw+ix], d = grid[(iy+1)*gw+ix+1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; };
}

function generateMap(contract){
  const obj = contract.obj, seed = contract.seed || (Math.random() * 1e9 | 0), dir = contract.dir || 'we';
  const r = rng(seed);
  let w = 84, h = 66;
  if (obj === 'hold'){ w = 64; h = 64; }
  if (obj === 'escort'){ if (dir === 'we' || dir === 'ew'){ w = 112; h = 46; } else { w = 46; h = 112; } }
  if (obj === 'rescue'){ w = 78; h = 64; }
  const g = new Uint8Array(w * h);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = t; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? g[y * w + x] : T.STONE;
  const M = {w, h, g, seed, camps:[], vaults:[], caches:[], blips:[], trees:[], structures:[], start:null, exit:null,
             route:null, cages:[], nests:[], engines:[], beacons:[], relic:null, markRoute:null, escape:null, town:null, siege:null};
  const C2P = p => ({x:(p.x + .5) * CELL, y:(p.y + .5) * CELL});
  // 1. Forest and hills from noise. The caravan road runs through thick forest.
  const fth = obj === 'escort' ? 0.48 : obj === 'purge' ? 0.6 : 0.66;
  const nf = valueNoise(w, h, 9, r), nh = valueNoise(w, h, 13, r), nr = valueNoise(w, h, 4, r);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const f = nf(x, y), hh = nh(x, y);
    if (f > fth) set(x, y, T.FOREST); else if (hh > 0.72) set(x, y, T.HILL);
    if (nr(x, y) > 0.9 && get(x, y) === T.GRASS) set(x, y, T.RUBBLE);
  }
  // 2. A river with two fords
  if (!['hold','escort','rescue'].includes(obj) && r() < 0.6){
    const horiz = r() < 0.5, len = horiz ? w : h, across = horiz ? h : w;
    let c = across * (0.35 + r() * 0.3);
    const fords = [len * (0.2 + r() * 0.2) | 0, len * (0.6 + r() * 0.2) | 0];
    for (let i = 0; i < len; i++){
      c += (r() - 0.5) * 1.4; c = Math.max(6, Math.min(across - 7, c));
      for (let k = -1; k <= 1; k++){
        const ford = fords.some(fp => Math.abs(fp - i) <= 1);
        if (horiz) set(i, (c | 0) + k, ford ? T.ROAD : T.WATER); else set((c | 0) + k, i, ford ? T.ROAD : T.WATER);
      }
    }
  }
  const clear = (x0, y0, x1, y1, t = T.GRASS) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  const footprintFree = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const t = get(x, y); if (t === T.WATER || t === T.STONE || t === T.PALISADE || t === T.ROOF || t === T.TENT || t === T.FLOOR) return false; } return x0 > 2 && y0 > 2 && x1 < w - 3 && y1 < h - 3; };
  const place = (rad, avoid, minGap, tries = 200) => {
    for (let i = 0; i < tries; i++){
      const x = 4 + rad + (r() * (w - 8 - rad * 2) | 0), y = 4 + rad + (r() * (h - 8 - rad * 2) | 0);
      if (!footprintFree(x - rad, y - rad, x + rad, y + rad)) continue;
      if (avoid.some(p => Math.hypot(p.x - x, p.y - y) < minGap)) continue;
      return {x, y};
    }
    return null;
  };
  const placeAny = (rad, avoid, gaps) => { for (const gp of gaps){ const p = place(rad, avoid, gp); if (p) return p; } return null; };
  const ring = (p, R, keep = 0.75, wall = T.STONE) => { for (let k = -R; k <= R; k++){ if (r() < keep) set(p.x + k, p.y - R, wall); if (r() < keep) set(p.x + k, p.y + R, wall); if (r() < keep) set(p.x - R, p.y + k, wall); if (r() < keep) set(p.x + R, p.y + k, wall); } };
  const palisadeCamp = (p, R) => {
    clear(p.x - R - 1, p.y - R - 1, p.x + R + 1, p.y + R + 1, T.GRASS); clear(p.x - R + 1, p.y - R + 1, p.x + R - 1, p.y + R - 1, T.ROAD);
    for (let k = -R; k <= R; k++){ set(p.x + k, p.y - R, T.PALISADE); set(p.x + k, p.y + R, T.PALISADE); set(p.x - R, p.y + k, T.PALISADE); set(p.x + R, p.y + k, T.PALISADE); }
    const gates = [[0,-1],[0,1],[-1,0],[1,0]].sort(() => r() - 0.5).slice(0, 2);
    for (const [gx, gy] of gates) for (let k = -1; k <= 1; k++) set(p.x + gx * R + (gx ? 0 : k), p.y + gy * R + (gy ? 0 : k), T.ROAD);
  };
  // 3. Start point
  if (obj === 'hold'){
    const cx = w >> 1, cy = h >> 1, R = 7;
    clear(cx - R - 2, cy - R - 2, cx + R + 2, cy + R + 2);
    clear(cx - R + 1, cy - R + 1, cx + R - 1, cy + R - 1, T.FLOOR);
    for (let i = -R; i <= R; i++){ set(cx + i, cy - R, T.STONE); set(cx + i, cy + R, T.STONE); set(cx - R, cy + i, T.STONE); set(cx + R, cy + i, T.STONE); }
    for (const [x, y] of [[cx, cy - R],[cx, cy + R],[cx - R, cy],[cx + R, cy]]) for (let k = -1; k <= 1; k++){ set(x + (x === cx ? k : 0), y + (y === cy ? k : 0), T.FLOOR); }
    for (let i = 0; i < 6; i++){ const side = r()*4|0, k = -R + 2 + (r() * (R * 2 - 4) | 0);
      const [x, y] = side === 0 ? [cx + k, cy - R] : side === 1 ? [cx + k, cy + R] : side === 2 ? [cx - R, cy + k] : [cx + R, cy + k]; set(x, y, T.RUBBLE); }
    for (const [sx, sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) clear(cx + sx * R - 1, cy + sy * R - 1, cx + sx * R + 1, cy + sy * R + 1, T.STONE);
    M.start = {x: cx, y: cy + 2};
    M.structures.push({kind:'fort', x:cx, y:cy, r:R});
  } else if (obj === 'escort'){
    // The road: edge to edge through the trees, in the contract's direction.
    const horiz = dir === 'we' || dir === 'ew', len = horiz ? w : h, across = horiz ? h : w, pts = [];
    let c = across / 2;
    for (let i = 2; i < len - 2; i++){
      c += (r() - 0.5) * 1.3; c = Math.max(9, Math.min(across - 10, c));
      for (let k = -3; k <= 3; k++){ const t = Math.abs(k) <= 1 ? T.ROAD : (r() < 0.55 ? T.GRASS : null);
        if (t === null) continue; if (horiz) set(i, (c | 0) + k, t); else set((c | 0) + k, i, t); }
      pts.push(horiz ? {x:i, y:c | 0} : {x:c | 0, y:i});
    }
    if (dir === 'ew' || dir === 'sn') pts.reverse();
    M.route = pts.map(C2P);
    M.start = {x:pts[4].x, y:pts[4].y};
    M.exit = M.route[M.route.length - 1];
    // a few clearings by the road for caches and ruins
    for (const f of [0.3, 0.55, 0.8]){ const p = pts[(pts.length * f) | 0], side = r() < .5 ? -1 : 1, q = horiz ? {x:p.x, y:p.y + side * 6} : {x:p.x + side * 6, y:p.y};
      clear(q.x - 2, q.y - 2, q.x + 2, q.y + 2, T.GRASS); if (r() < .6) ring(q, 2, 0.45); M.structures.push({kind:'ruin', x:q.x, y:q.y, r:2}); }
  } else {
    const corner = r() * 4 | 0, sx = corner % 2 ? w - 7 : 6, sy = corner < 2 ? 6 : h - 7;
    clear(sx - 3, sy - 3, sx + 3, sy + 3, T.GRASS);
    M.start = {x: sx, y: sy};
  }
  // 4. Objective features
  const avoid = [M.start];
  const bossCount = obj === 'hunt' ? (contract.tier === 1 ? 2 : 3) : 0;
  for (let i = 0; i < bossCount; i++){
    const p = placeAny(5, avoid, [22, 14, 8]); if (!p) continue;
    avoid.push(p); palisadeCamp(p, 5);
    for (const [tx, ty] of [[-3,-3],[3,-3],[-3,3],[3,3]]) if (r() < 0.8){ set(p.x + tx, p.y + ty, T.TENT); set(p.x + tx + (tx > 0 ? 1 : -1), p.y + ty, T.TENT); }
    M.camps.push({cx:p.x, cy:p.y, x:(p.x + .5) * CELL, y:(p.y + .5) * CELL, boss:null, done:false, idx:i});
    M.structures.push({kind:'camp', x:p.x, y:p.y, r:5});
  }
  if (obj === 'extract') for (let i = 0; i < 3; i++){
    const p = placeAny(4, avoid, [20, 12, 7]); if (!p) continue;
    avoid.push(p);
    const R = 4; clear(p.x - R, p.y - R, p.x + R, p.y + R, T.FLOOR); ring(p, R);
    for (let k = 0; k < 5; k++) set(p.x - R + 1 + (r() * (R * 2 - 1) | 0), p.y - R + 1 + (r() * (R * 2 - 1) | 0), T.RUBBLE);
    set(p.x, p.y, T.FLOOR); set(p.x + 1, p.y, T.FLOOR); set(p.x, p.y - R, T.FLOOR); set(p.x, p.y + R, T.FLOOR);
    M.vaults.push({x:(p.x + .5) * CELL, y:(p.y + .5) * CELL, claimed:0, done:false, guarded:false});
    M.structures.push({kind:'ruin', x:p.x, y:p.y, r:R});
  }
  if (obj === 'rescue'){
    // A ruined town in the middle: a street grid, houses, broken walls and rubble.
    const cx = w >> 1, cy = h >> 1, TW = 14, TH = 10;
    clear(cx - TW, cy - TH, cx + TW, cy + TH, T.GRASS);
    for (let x = cx - TW; x <= cx + TW; x++){ set(x, cy, T.ROAD); set(x, cy + 1, T.ROAD); }
    for (const sx of [cx - 8, cx, cx + 8]) for (let y = cy - TH; y <= cy + TH; y++) set(sx, y, T.ROAD);
    for (const bx of [cx - 12, cx - 5, cx + 3, cx + 10]) for (const by of [cy - 7, cy - 3, cy + 4, cy + 7]){
      if (r() < 0.25) continue;
      if (r() < 0.65){ clear(bx - 1, by - 1, bx + 1, by, T.ROOF); M.structures.push({kind:'house', x:bx, y:by, v:r() * 3 | 0}); }
      else { ring({x:bx, y:by}, 1, 0.55); set(bx, by, T.RUBBLE); }
    }
    for (let k = 0; k < 24; k++){ const x = cx - TW + (r() * TW * 2 | 0), y = cy - TH + (r() * TH * 2 | 0); if (get(x, y) === T.GRASS) set(x, y, T.RUBBLE); }
    M.town = C2P({x:cx, y:cy}); avoid.push({x:cx, y:cy}); avoid.push({x:cx - 9, y:cy}); avoid.push({x:cx + 9, y:cy});
  }
  if (obj === 'purge') for (let i = 0; i < 2 + contract.tier; i++){
    const p = placeAny(3, avoid, [18, 12, 7]); if (!p) continue;
    avoid.push(p); clear(p.x - 3, p.y - 3, p.x + 3, p.y + 3, T.GRASS);
    for (let k = 0; k < 10; k++){ const a = r() * TAU; set(p.x + Math.round(Math.cos(a) * 3), p.y + Math.round(Math.sin(a) * 3), r() < .5 ? T.RUBBLE : T.HILL); }
    M.nests.push(C2P(p)); M.structures.push({kind:'ruin', x:p.x, y:p.y, r:3});
  }
  if (obj === 'sabotage'){
    let p = null; for (const gp of [34, 28, 22, 14]){ p = place(8, avoid, gp, 300); if (p) break; }
    if (!p) p = {x:w >> 1, y:h >> 1};
    avoid.push(p); palisadeCamp(p, 8);
    for (const [tx, ty] of [[-5,-5],[5,-5],[-5,5],[5,5]]) if (r() < 0.8){ set(p.x + tx, p.y + ty, T.TENT); set(p.x + tx + (tx > 0 ? 1 : -1), p.y + ty, T.TENT); }
    M.siege = C2P(p);
    const spots = [[-3,-2],[3,-2],[0,3],[-4,3],[4,3],[0,-4]].sort(() => r() - 0.5).slice(0, 2 + contract.tier);
    for (const [ox, oy] of spots){ set(p.x + ox, p.y + oy, T.ROAD); M.engines.push(C2P({x:p.x + ox, y:p.y + oy})); }
    M.structures.push({kind:'camp', x:p.x, y:p.y, r:8});
  }
  if (obj === 'beacons') for (let i = 0; i < 3; i++){
    const p = placeAny(3, avoid, [24, 16, 9]); if (!p) continue;
    avoid.push(p);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) set(p.x + x, p.y + y, x * x + y * y <= 2 ? T.FLOOR : T.HILL);
    M.beacons.push(C2P(p));
  }
  if (obj === 'relic'){
    const p = placeAny(4, avoid, [40, 30, 20, 10]) || {x:w - M.start.x, y:h - M.start.y};
    avoid.push(p); clear(p.x - 4, p.y - 4, p.x + 4, p.y + 4, T.FLOOR); ring(p, 4, 0.7);
    for (let k = 0; k < 6; k++) set(p.x - 3 + (r() * 7 | 0), p.y - 3 + (r() * 7 | 0), T.RUBBLE);
    set(p.x, p.y, T.FLOOR); set(p.x, p.y - 4, T.FLOOR); set(p.x, p.y + 4, T.FLOOR); set(p.x - 4, p.y, T.FLOOR); set(p.x + 4, p.y, T.FLOOR);
    M.relic = C2P(p); M.structures.push({kind:'ruin', x:p.x, y:p.y, r:4});
  }
  let markPts = null;
  if (obj === 'assassinate'){
    // The mark's road: from the far corner, through the map, out at an edge.
    const fx = w - 1 - M.start.x, fy = h - 1 - M.start.y;
    markPts = [{x:fx, y:fy}];
    for (let i = 0; i < 4; i++){ const p = place(2, [M.start], 12) || {x:8 + (r() * (w - 16) | 0), y:8 + (r() * (h - 16) | 0)}; markPts.push(p); }
    const edges = [{x:2, y:h >> 1}, {x:w - 3, y:h >> 1}, {x:w >> 1, y:2}, {x:w >> 1, y:h - 3}]
      .sort((a, b) => Math.hypot(b.x - M.start.x, b.y - M.start.y) - Math.hypot(a.x - M.start.x, a.y - M.start.y));
    markPts.push(edges[r() < .5 ? 0 : 1]);
    clear(fx - 2, fy - 2, fx + 2, fy + 2, T.GRASS);
  }
  // 5. Farmsteads and ruins for cover and loot
  const extras = obj === 'hold' ? 4 : obj === 'rescue' ? 3 : obj === 'escort' ? 0 : 7;
  for (let i = 0; i < extras; i++){
    const p = place(3, avoid, 9); if (!p) continue; avoid.push(p);
    if (r() < 0.5){
      const bw = 2 + (r() * 2 | 0), bh = 2;
      clear(p.x - bw - 1, p.y - bh - 1, p.x + bw + 1, p.y + bh + 2, T.GRASS);
      clear(p.x - bw, p.y - bh, p.x + bw, p.y + bh - 1, T.ROOF);
      M.structures.push({kind:'house', x:p.x, y:p.y, v:r() * 3 | 0});
    } else {
      const R = 3;
      for (let k = -R; k <= R; k++){ if (r() < 0.55) set(p.x + k, p.y - R, T.STONE); if (r() < 0.55) set(p.x - R, p.y + k, T.STONE); if (r() < 0.4) set(p.x + R, p.y + k, T.STONE); }
      for (let k = 0; k < 4; k++) set(p.x - 2 + (r() * 5 | 0), p.y - 2 + (r() * 5 | 0), T.RUBBLE);
      M.structures.push({kind:'ruin', x:p.x, y:p.y, r:R});
    }
  }
  // 6. Roads from the start to every objective, so every one can be reached
  const road = (a, b) => { let x = a.x, y = a.y; let n = 0;
    while ((x !== b.x || y !== b.y) && n++ < 700){
      if (r() < 0.5 && x !== b.x) x += Math.sign(b.x - x); else if (y !== b.y) y += Math.sign(b.y - y); else x += Math.sign(b.x - x);
      const t = get(x, y);
      if (t === T.PALISADE || t === T.TENT || t === T.ROOF) continue;
      if (t !== T.FLOOR) set(x, y, T.ROAD);
      if (t === T.WATER){ set(x + 1, y, T.ROAD); set(x, y + 1, T.ROAD); }
    } };
  const cellOf = p => ({x:Math.floor(p.x / CELL), y:Math.floor(p.y / CELL)});
  for (const c of M.camps) road(M.start, {x:c.cx, y:c.cy});
  for (const v of M.vaults) road(M.start, cellOf(v));
  for (const p of M.nests) road(M.start, cellOf(p));
  for (const p of M.beacons) road(M.start, cellOf(p));
  if (M.siege) road(M.start, cellOf(M.siege));
  if (M.relic) road(M.start, cellOf(M.relic));
  if (M.town) road(M.start, cellOf(M.town));
  if (markPts){ for (let i = 0; i + 1 < markPts.length; i++) road(markPts[i], markPts[i + 1]); road(M.start, markPts[2]);
    M.markRoute = markPts.map(C2P); M.escape = M.markRoute[M.markRoute.length - 1]; }
  // the map edge is a wall nobody walks through (but the mark's escape gap stays open)
  for (let x = 0; x < w; x++){ set(x, 0, T.STONE); set(x, h - 1, T.STONE); }
  for (let y = 0; y < h; y++){ set(0, y, T.STONE); set(w - 1, y, T.STONE); }
  // 7. Reachability
  MAP = M;
  const D = bfsFrom((M.start.x + .5) * CELL, (M.start.y + .5) * CELL);
  M.reach = D;
  const reachable = (cx, cy) => inMap(cx, cy) && D[cy * w + cx] >= 0;
  // hostages' cages, on open ground in the town
  if (obj === 'rescue'){
    const n = 3 + contract.tier, cx = w >> 1, cy = h >> 1, got = [];
    for (let i = 0; i < 600 && got.length < n; i++){
      const x = cx - 13 + (r() * 27 | 0), y = cy - 9 + (r() * 19 | 0);
      if (!reachable(x, y) || BLOCKS.has(g[y * w + x]) || got.some(p => Math.hypot(p.x - x, p.y - y) < 5)) continue;
      got.push({x, y});
    }
    M.cages = got.map(C2P);
  }
  // 8. Trees, loot caches and Blip Tokens
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
    if (g[y * w + x] === T.FOREST && r() < 0.55) M.trees.push({x:(x + .2 + r() * .6) * CELL, y:(y + .3 + r() * .6) * CELL, v:r() * 3 | 0});
  const free = (minFromStart) => { for (let i = 0; i < 300; i++){ const cx = 2 + (r() * (w - 4) | 0), cy = 2 + (r() * (h - 4) | 0);
    if (!reachable(cx, cy) || BLOCKS.has(g[cy * w + cx])) continue;
    if (Math.hypot(cx - M.start.x, cy - M.start.y) < minFromStart) continue;
    return {x:(cx + .5) * CELL, y:(cy + .5) * CELL}; } return null; };
  const nCaches = obj === 'hold' ? 9 : obj === 'escort' ? 8 : 14;
  for (let i = 0; i < nCaches; i++){
    let p = null;
    const st = M.structures[r() * M.structures.length | 0];
    if (st && r() < 0.5) for (let k = 0; k < 20 && !p; k++){ const cx = st.x - 2 + (r() * 5 | 0), cy = st.y - 2 + (r() * 5 | 0);
      if (reachable(cx, cy) && !BLOCKS.has(g[cy * w + cx])) p = {x:(cx + .5) * CELL, y:(cy + .5) * CELL}; }
    if (!p) p = free(5);
    if (p) M.caches.push({x:p.x, y:p.y, kind:rollLoot(r), opened:false, wild:true});
  }
  const nBlips = obj === 'hold' ? 5 : obj === 'escort' ? 4 : 8;
  for (let i = 0; i < nBlips; i++){ const p = free(10); if (p) M.blips.push({x:p.x, y:p.y, revealed:false}); }
  if (['extract','rescue','sabotage','relic'].includes(obj)) M.exit = C2P(M.start);
  // 9. Minimap and fog
  M.mini = newCanvas(w, h); const mg = M.mini.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ mg.fillStyle = MINI_COL[g[y * w + x]]; mg.fillRect(x, y, 1, 1); }
  M.fog = newCanvas(w, h); const fg = M.fog.getContext('2d'); fg.fillStyle = '#1b1712'; fg.fillRect(0, 0, w, h);
  M.seen = new Uint8Array(w * h);
  return M;
}
function revealAround(x, y, rad){
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), fg = MAP.fog.getContext('2d');
  for (let oy = -rad; oy <= rad; oy++) for (let ox = -rad; ox <= rad; ox++){
    if (ox*ox + oy*oy > rad*rad) continue;
    const gx = cx + ox, gy = cy + oy; if (!inMap(gx, gy)) continue;
    const i = gy * MAP.w + gx; if (MAP.seen[i]) continue;
    MAP.seen[i] = 1; fg.clearRect(gx, gy, 1, 1); if (typeof FOGK !== 'undefined') FOGK.dirty = true;   /* Index 71 */
  }
}
function revealAll(){ MAP.seen.fill(1); MAP.fog.getContext('2d').clearRect(0, 0, MAP.w, MAP.h); }
const seenXY = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return inMap(cx, cy) && MAP.seen[cy * MAP.w + cx] === 1; };

