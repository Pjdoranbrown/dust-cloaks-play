/* ============================================================================
   INDEX 104 - MOOD AUDIO (Fable job 6, audits/fable/mood.md): Witcher 3 mood
   direction alongside VO-1. Three things, all over the tune the bard is already
   playing and 87b's one continuous theme, nothing replaced:
   1. Scene: MOOD.scene() reads region (contract, else META.lastRegion), season,
      hour (LOOK.time, shared with the visual grade), place and a bright/grim score
      (region base, season, hour, forest share, place name). Each region has a
      colour voice: heartland pipe, mendor and freelands fiddle, marches hurdy-gurdy,
      spine low drone, frost bell.
   2. Layers, added per bar as plain events through MUS voices (Music slider,
      Volume, ducking and fades all apply): a grim low drone bed where it is dark
      (grim > 0.45), a brighter counter-line in the colour voice plus a high lute
      arpeggio where it is colourful (bright > 0.55). Both fade over FADE_BARS bars.
   3. States on bar lines: explore, tension (enemies closing, contact recent, a
      hold in its last fifth), fight (87b's level 1-2 layers; this file adds nothing),
      victory (a 4-bar lift in two voices after endDeployment('victory')).
   Regional beds: AMBIENCE.pick (hook in js/audio/ambience.js fieldBed) chooses the
   ambience bed per region and place (spine ruins cave, trade roads murmur, frost
   wind, the marches fen rain in autumn and winter).
   Knobs: MOOD.on, MOOD.force = {bright, state, region} pins for tests, MOOD.vol,
   MOOD.log (last bars). ROLLBACK: remove this script tag (MOOD.on = false at runtime).
============================================================================ */
(function(){
'use strict';
if (typeof MUS === 'undefined' || !MUS._V || !MUS._M || !MUS.SONGS) return;
const M = MUS._M, V = MUS._V, SONGS = MUS.SONGS;
const MOOD = window.MOOD = {
  on: true, force: null, log: [],
  vol: {drone:0.36, bright:0.42, arp:0.3, tension:0.4, victory:0.8},
  FADE_BARS: 2, VICTORY_BARS: 4, VICTORY_S: 14, TENSION_UP_S: 2, TENSION_DOWN_S: 8, MAX_ADD: 9,
  region: {   // base light (0 grim .. 1 bright) and the colour voice
    heartland:{light:0.7, voice:'pipe'}, mendor:{light:0.8, voice:'fiddle'}, freelands:{light:0.55, voice:'fiddle'},
    marches:{light:0.35, voice:'gurdy'}, spine:{light:0.25, voice:'drone'}, frost:{light:0.15, voice:'bell'}
  },
  season: {spring:0.1, summer:0.15, autumn:0, winter:-0.15},
  hour: {dawn:0.05, day:0.15, dusk:-0.1, night:-0.3},
  placeUp: /Downs|Vale|Coast|Causeway|Trade-Road|Crown-Road|Sun-Havens|Valley/i,
  placeDown: /Fen|Ruins|Gorge|Under-Gate|Glacier|Vents|Quarantine|Blood|Iron-Pass|Cliffs/i,
  bed: {frost:'wind', marches:'rain', spine:/Ruins|Gorge|Pass|Temple|Under/i, murmur:/Trade-Road|Crown-Road|Canal/i}
};
const clamp = (a, b, x) => Math.max(a, Math.min(b, x));
const gOK = () => (typeof G !== 'undefined' && G) ? G : null;
const season = () => { try { return String(typeof seasonOf === 'function' ? seasonOf() : '').toLowerCase(); } catch (e) { return ''; } };
const titleOpen = () => { const el = document.getElementById('screen-title'); return !!(el && !el.classList.contains('hidden')); };

/* ---- 1. the scene ------------------------------------------------------- */
MOOD.scene = function(){
  const g = gOK(), F = MOOD.force || {};
  let place = 'camp';
  if (titleOpen()) place = 'title';
  else if (g && g.obj === 'brawl') place = 'brawl';
  else if (window.TAVERN && typeof TAVERN.open === 'function' && TAVERN.open()) place = 'tavern';
  else if (g) place = g.over ? 'debrief' : 'field';
  const c = g && g.contract;
  const region = F.region || (c && c.region) || (typeof META !== 'undefined' && META && META.lastRegion) || 'heartland';
  const R = MOOD.region[region] || MOOD.region.heartland;
  const seasonNow = season();
  const hour = (window.LOOK && LOOK.time) ? LOOK.time() : 'dusk';
  let bright = R.light + (MOOD.season[seasonNow] || 0) + (MOOD.hour[hour] || 0);
  if (g && g.lookForest) bright -= 0.25 * g.lookForest;
  const pname = c && c.place || '';
  if (MOOD.placeUp.test(pname)) bright += 0.1;
  if (MOOD.placeDown.test(pname)) bright -= 0.15;
  if (place === 'camp') bright = bright * 0.7 + 0.15;           // the evening camp: never the full field extremes
  if (F.bright !== undefined) bright = F.bright;
  bright = clamp(0, 1, bright);
  return {place, region, season:seasonNow, hour, bright, grim:1 - bright, voice:R.voice, placeName:pname};
};

/* ---- regional ambience beds (hook in js/audio/ambience.js) --------------- */
if (window.AMBIENCE){
  AMBIENCE.pick = function(g){
    if (!MOOD.on || !g || !g.contract) return null;
    const r = g.contract.region, p = g.contract.place || '', B = MOOD.bed;
    if (r === 'spine' && B.spine.test(p)) return 'cave';
    if (B.murmur.test(p)) return 'murmur';
    if (r === 'frost') return B.frost;
    if (r === 'marches' && g.obj !== 'escort' && /autumn|winter/.test(season())) return B.marches;   // the fen rains in the wet half of the year
    return null;
  };
}

/* ---- new voices on the music bus ---------------------------------------- */
function osc(type, f, t){ const o = M.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
function filt(type, f, q){ const b = M.ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; }
function env(g, t, a, peak, hold, rel){
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.setValueAtTime(Math.max(0.0002, peak), t + Math.max(a, hold));
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, hold) + rel);
}
function stopAll(os, t){ for (const o of os) o.stop(t); }
// a bowed low drone: two detuned saws under a slow lowpass, slow in, slow out
V.drone = function(t, e){
  const ac = M.ac, f = MUS.hz(e.m), d = Math.max(0.5, e.d), g = ac.createGain(), lp = filt('lowpass', 260, 0.8);
  const o1 = osc('sawtooth', f, t), o2 = osc('sawtooth', f, t), o3 = osc('sine', f / 2, t); o2.detune.setValueAtTime(7, t);
  const g3 = ac.createGain(); g3.gain.value = 0.6;
  o1.connect(lp); o2.connect(lp); o3.connect(g3); g3.connect(lp); lp.connect(g); g.connect(M.bus.g);
  env(g, t, Math.min(0.6, d * 0.4), 0.16 * e.v, d - 0.2, 0.7);
  o1.start(t); o2.start(t); o3.start(t); stopAll([o1, o2, o3], t + d + 0.9);
};
// hurdy-gurdy: a buzzing saw with the fifth under it, a touch of vibrato, nasal bandpass
V.gurdy = function(t, e){
  const ac = M.ac, f = MUS.hz(e.m), d = Math.max(0.15, e.d), g = ac.createGain(), bp = filt('bandpass', 900, 1.6), lp = filt('lowpass', 2600, 0.6);
  const o1 = osc('sawtooth', f, t), o2 = osc('sawtooth', f * 0.75, t), g2 = ac.createGain(); g2.gain.value = 0.35;
  const l = osc('sine', 6.5, t), lg = ac.createGain(); lg.gain.value = 5; l.connect(lg); lg.connect(o1.detune);
  o1.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(lp); lp.connect(g); g.connect(M.bus.g);
  env(g, t, 0.06, 0.26 * e.v, d - 0.04, 0.12);
  o1.start(t); o2.start(t); l.start(t); stopAll([o1, o2, l], t + d + 0.3);
};
// bowed: the mood fiddle, a saw with a slow vibrato through a body resonance. Named 'bowed' so it does not replace
// the engine's own V.fiddle (the party reel's fiddle, which Patrick approved); BOW maps the region voice to it.
const BOW = v => v === 'fiddle' ? 'bowed' : v;
V.bowed = function(t, e){
  const ac = M.ac, f = MUS.hz(e.m), d = Math.max(0.1, e.d), g = ac.createGain(), bp = filt('bandpass', 1400, 1.1), lp = filt('lowpass', 3800, 0.5);
  const o1 = osc('sawtooth', f, t), o2 = osc('triangle', f, t), g2 = ac.createGain(); g2.gain.value = 0.5;
  const l = osc('sine', 5.6, t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(9, t + Math.min(0.3, d * 0.6));
  l.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
  o1.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(lp); lp.connect(g); g.connect(M.bus.g);
  env(g, t, 0.05, 0.22 * e.v, d - 0.03, 0.14);
  o1.start(t); o2.start(t); l.start(t); stopAll([o1, o2, l], t + d + 0.3);
};
// bell: sine with a bright inharmonic partial, long decay
V.bell = function(t, e){
  const ac = M.ac, f = MUS.hz(e.m), d = Math.max(0.3, e.d), g = ac.createGain(), g2 = ac.createGain();
  const o1 = osc('sine', f, t), o2 = osc('sine', f * 2.76, t); g2.gain.setValueAtTime(0.22, t); g2.gain.exponentialRampToValueAtTime(0.002, t + d * 0.5);
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(M.bus.g);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3 * e.v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o1.start(t); o2.start(t); stopAll([o1, o2], t + d + 0.05);
};

/* ---- 3. the state, read once per bar ------------------------------------ */
const ST = MOOD.st = {state:'camp', since:0, bars:0, tUp:-1, tDown:-1, overAt:0, victoryBars:0};
const nowS = () => (M.ac ? M.ac.currentTime : performance.now() / 1000);
function rawState(sc){
  const g = gOK();
  if (sc.place === 'title' || sc.place === 'tavern' || sc.place === 'brawl') return 'quiet';
  if (!g) return 'camp';
  if (g.over){
    if (g.result === 'victory'){ if (!ST.overAt) ST.overAt = nowS(); if (nowS() - ST.overAt < MOOD.VICTORY_S) return 'victory'; }
    return 'quiet';
  }
  ST.overAt = 0;
  if (M.level >= 1) return 'fight';
  const L = g.leader; if (!L) return 'explore';
  let near = 0;
  for (const e of g.enemies || []){ if (e.dormant || e.broken) continue; if (Math.hypot(e.x - L.x, e.y - L.y) < 700) near++; }
  const recent = (g.frame - (g.lastContact || -9999)) < 600;
  const lateHold = g.obj === 'hold' && g.contract && g.contract.minutes && g.sec > g.contract.minutes * 60 * 0.8;
  return (near > 0 || recent || lateHold) ? 'tension' : 'explore';
}
function stepState(sc){
  const raw = MOOD.force && MOOD.force.state ? MOOD.force.state : rawState(sc), t = nowS();
  let next = ST.state;
  if (raw === 'tension' && ST.state !== 'tension'){ ST.tDown = -1; if (ST.tUp < 0) ST.tUp = t; if (t - ST.tUp >= MOOD.TENSION_UP_S || ST.state === 'fight') next = 'tension'; }
  else if (raw !== 'tension' && ST.state === 'tension' && (raw === 'explore' || raw === 'camp')){ ST.tUp = -1; if (ST.tDown < 0) ST.tDown = t; if (t - ST.tDown >= MOOD.TENSION_DOWN_S) next = raw; }
  else { ST.tUp = ST.tDown = -1; next = raw; }
  if (next === 'victory' && ST.state !== 'victory') ST.victoryBars = 0;
  if (next !== ST.state){ ST.state = next; ST.since = t; ST.bars = 0; } else ST.bars++;
  return ST.state;
}

/* ---- 2. the layers ------------------------------------------------------ */
const isNum = x => typeof x === 'number' && isFinite(x);
const place = (pc, lo) => lo + ((pc - lo) % 12 + 12) % 12;
function chord(ev){
  // root and chord tones from what the bar already plays: bass first, then on-beat lute notes
  const bass = ev.filter(e => e.k === 'bass' && isNum(e.m)).sort((a, b) => a.t - b.t);
  const pl = ev.filter(e => (e.k === 'pluck' || e.k === 'lute') && isNum(e.m)).sort((a, b) => a.t - b.t);
  const mel = ev.filter(e => e.k === 'pipe' && isNum(e.m) && e.d !== undefined).sort((a, b) => a.t - b.t);
  const root = bass.length ? bass[0].m % 12 : pl.length ? pl[0].m % 12 : mel.length ? mel[0].m % 12 : null;
  const pcs = []; for (const e of pl.concat(bass)){ const p = e.m % 12; if (pcs.indexOf(p) < 0) pcs.push(p); }
  return {root, pcs: pcs.length ? pcs : (root === null ? [] : [root]), mel};
}
function layers(sc, state, len, ch){
  const add = [], fade = Math.min(1, 0.35 + 0.65 * ST.bars / MOOD.FADE_BARS), VOL = MOOD.vol;
  if (ch.root === null || state === 'quiet') return add;
  const quiet = state === 'camp' || state === 'explore' || state === 'tension';
  // grim bed
  const gr = sc.grim;
  if (quiet && gr > 0.45){
    const v = clamp(0, 1, (gr - 0.45) * 1.8) * VOL.drone * fade * (state === 'tension' ? 1.3 : 1);
    add.push({t:0, k:'drone', m:place(ch.root, 36), d:len * 0.98, v});
    if (sc.voice === 'drone' || sc.voice === 'gurdy' || state === 'tension') add.push({t:0, k:'drone', m:place(ch.root + 7, 40), d:len * 0.98, v:v * 0.45});
  }
  // tension: a pedal on the fifth and a sparse pulse
  if (state === 'tension'){
    const v = VOL.tension * fade;
    add.push({t:len * 0.5, k:'bass', m:place(ch.root + 7, 33), d:len * 0.45, v:v * 0.8});
    add.push({t:len * 0.25, k:'tick', v:v * 0.6}, {t:len * 0.75, k:'tick', v:v * 0.45});
  }
  // bright layer: the colour voice answers the melody, a high lute arpeggio over the chord
  const br = sc.bright;
  if ((state === 'camp' || state === 'explore') && br > 0.55){
    const k = clamp(0, 1, (br - 0.55) * 2.2) * fade, voice = BOW(sc.voice === 'drone' ? 'pipe' : sc.voice);
    const up = (voice === 'pipe' || voice === 'bell') ? 12 : 0;
    let n = 0;
    for (const e of ch.mel){ if ((n++ & 1) || e.d < 0.15) continue; add.push({t:e.t, k:voice, m:e.m + up, d:e.d * 0.9, v:k * VOL.bright * 0.9}); if (add.length >= MOOD.MAX_ADD - 2) break; }
    if (!ch.mel.length) for (let i = 0; i < 2; i++) add.push({t:len * (0.25 + 0.5 * i), k:voice, m:place(ch.pcs[(i * 2) % ch.pcs.length], 72 - up), d:len * 0.22, v:k * VOL.bright * 0.7});
    // P23-BUG-1: on story cards and the camp (no contract) the high lute plinks read as coin sounds; keep them to the field
    const gg = gOK();
    if (gg && gg.contract) add.push({t:len * 0.25, k:'pluck', m:place(ch.pcs[1 % ch.pcs.length], 72), v:k * VOL.arp}, {t:len * 0.75, k:'pluck', m:place(ch.pcs[2 % ch.pcs.length], 72), v:k * VOL.arp * 0.8});
  }
  // victory: a 4-bar lift in two voices, 1-3-5-8 rising, then the tune carries on
  if (state === 'victory' && ST.victoryBars < MOOD.VICTORY_BARS){
    const steps = [0, 4, 7, 12], b = ST.victoryBars++, v = VOL.victory;
    const voice = BOW((sc.voice === 'drone' || sc.voice === 'gurdy') ? 'pipe' : sc.voice);
    for (let i = 0; i < 4; i++){
      const m = place(ch.root, 60) + steps[(i + b) % 4] + (b >= 2 ? 12 : 0);
      add.push({t:len * i / 4, k:voice, m, d:len * 0.23, v:v * (0.8 + 0.05 * i)});
      if (i % 2 === 0) add.push({t:len * i / 4, k:'pipe', m:m + (voice === 'pipe' ? 7 : 0), d:len * 0.23, v:v * 0.55});
    }
  }
  return add.slice(0, MOOD.MAX_ADD + 2);
}

function wrapCamp(id, orig){
  return function(bi, variant){
    const b = orig(bi, variant);
    if (!MOOD.on || !b || !b.ev || !M.ac) return b;
    try {
      const sc = MOOD.scene(), state = stepState(sc), ch = chord(b.ev), add = layers(sc, state, b.len, ch);
      if (MOOD.log.length > 60) MOOD.log.shift();
      MOOD.log.push({id, bi, state, place:sc.place, region:sc.region, hour:sc.hour, bright:+sc.bright.toFixed(2), root:ch.root, added:add.length, keys:add.map(e => e.k).join(' ')});
      if (!add.length) return b;
      return Object.assign({}, b, {ev:b.ev.concat(add)});
    } catch (e) { return b; }
  };
}
let wrapped = false;
MOOD.init = function(){
  if (wrapped) return; wrapped = true;
  for (const id of Object.keys(SONGS)){
    const s = SONGS[id]; if (!s || !s.camp || typeof s.camp.fn !== 'function') continue;
    const o = s.camp.fn, w = wrapCamp(id, o); s.camp.fn = w;
    if (s.fn === o) s.fn = w; else if (typeof s.fn === 'function') s.fn = wrapCamp(id, s.fn);
  }
};
MOOD.init();
})();
