// js/audio/songs.js
// INDEX 88c - MUSIC VARIETY
// What it does:
//  - Second camp arrangement for each song in VARIANT_SONGS. It is built by transforming
//    the original bar output (re-voice, octave shift, thinned accompaniment, held pad,
//    countermelody from the bar's own chord tones, lighter drums), so it stays in step
//    with the original. Arrangement B plays on alternate passes ((MUS._M.variant & 1) === 1).
//  - Boss motif: a 4-bar menacing layer added to the battle bar while a boss is within
//    BOSS_RANGE of the Leader, or for BOSS_ARRIVAL_HOLD_S after SFX 'boss' (cleared on 'bossdie').
//  - Danger rising cue: a short stinger added to the battle bar when the fight level rises
//    (0->1, 1->2), at most once per CUE_GAP_S.
//  All additions are plain events returned from wrapped bar functions, so they play through
//  MUS voices on the music bus (Music slider, Volume, ducking, fades all apply).
//  Transport (schedule, tick, switchTo, bus, fight level, tempo easing) is untouched.
// ROLLBACK: delete this file and its <script> tag
(function(){
  'use strict';

  // ---- Tunables ----
  const VARIANT_SONGS = [];            // arrangement B binned by Patrick after listening (2026-11-09); was ['jig','embers','party','march']
  const VARIANT_PARITY = 1;            // arrangement B plays when (variant & 1) === this
  const BOSS_RANGE = 700;              // px from the Leader that counts as "boss near" (matches fightLevel)
  const BOSS_ARRIVAL_HOLD_S = 10;      // motif plays this long after SFX 'boss' even if the boss is far away
  const MOTIF_VOL = 0.55;              // boss motif velocity scale
  const MOTIF_BARS = 4;                // motif phrase length in battle bars
  const MOTIF_ROOT_LO = 52;            // motif root sits in E3..D#4
  const COMPOUND_SONGS = ['jig'];      // battle bars counted in 6 units (6/8); others 8
  const CUE_GAP_S = 45;                // minimum seconds between danger cues
  const CUE_VOL = 0.8;                 // danger cue velocity scale
  const PAD_VOL = 0.4;                 // added pad velocity (arrangement B)
  const PAD_LO = 52;                   // added pad voiced in E3..D#4
  const MEL_LO = 50, MEL_HI = 96;      // melody octave shifts fold back inside this range
  const MAX_ADD_PER_BAR = 6;           // most events arrangement B may add to one bar
  const STRONG_EPS = 0.03;             // fraction of a bar that counts as "on the beat"
  const REPEAT_PENALTY = 4;           // countermelody prefers moving to a new chord tone over repeating
  const LONG_AGO = -1e9;

  // Per-song second arrangement. mel: melody voice (null = guess per bar), to: new melody voice,
  // shift: semitones, thin: thin pluck/lute accompaniment to beats 1 and the half bar,
  // pad: true | 'root' | false, counter: {k, lo, hi, per, v} or null, drums: keep|sparse|heart|none.
  const RECIPES = {
    jig:    {mel:'pipe',   to:'fiddle', shift:0,   thin:true,  pad:true,   counter:null, drums:'keep'},
    embers: {mel:'pipe',   to:'fiddle', shift:-12, thin:true,  pad:false,  counter:{k:'pipe', lo:76, hi:88, per:2, v:.3}, drums:'heart'},
    party:  {mel:'fiddle', to:'pipe',   shift:0,   thin:false, pad:false,  counter:{k:'lute', lo:55, hi:67, per:4, v:.45}, drums:'sparse'},
    march:  {mel:null,     to:null,     shift:0,   thin:true,  pad:true,   counter:{k:'lute', lo:55, hi:67, per:2, v:.4}, drums:'sparse'},
    iron:   {mel:null,     to:null,     shift:0,   thin:false, pad:'root', counter:null, drums:'heart'}
  };

  // Boss motif per bar: [position, semitones from root, duration (fraction of bar), velocity].
  // position is a bar fraction, or 'p' = pickup (last unit of the bar). Root/fifth/octave plus a
  // short leading-tone crawl, so it sits on the song's tonic without fighting the drone.
  const MOTIF = [
    [[0, 0, .45, 1], [0, -12, .45, .5], [.5, 0, .3, .8], ['p', -1, 1, .7]],
    [[0, 0, .45, .9], [.5, 7, .4, .8]],
    [[0, 0, .45, 1], [0, -12, .45, .5], [.5, 0, .3, .8], ['p', -1, 1, .7]],
    [[0, 12, .45, .9], [.5, 7, .3, .8], ['p', -1, 1, .7], ['p', 'taiko', 0, .7]]
  ];

  const MEL_VOICES = ['pipe', 'fiddle', 'lute'];
  const DRUMS = ['thump', 'tick', 'kick', 'snare', 'hat', 'taiko', 'clap'];
  const THIN_VOICES = ['pluck', 'lute'];

  // ---- small helpers (private copies; the engine's are inside its closure) ----
  const classic = () => { try { return !!window.AUDIO_CLASSIC; } catch (x){ return false; } };
  const nowS = () => { try { return performance.now() / 1000; } catch (x){ return Date.now() / 1000; } };
  const pc = m => ((Math.round(m) % 12) + 12) % 12;
  const place = (p, lo) => lo + ((p - (lo % 12) + 12) % 12);
  const isNum = x => typeof x === 'number' && isFinite(x);
  function onBeat(t, L){ const x = (+t || 0) / L; return Math.abs(x) < STRONG_EPS || Math.abs(x - .5) < STRONG_EPS; }
  function fold(m){ let n = m; while (n < MEL_LO) n += 12; while (n > MEL_HI) n -= 12; return n; }
  function hasVoice(e){
    try { const V = MUS._V; return !V || typeof V[e.k] === 'function'; } catch (x){ return false; }
  }
  function guessMel(src){
    const s = {};
    for (const e of src) if (MEL_VOICES.indexOf(e.k) >= 0 && isNum(e.m)){ const a = s[e.k] || (s[e.k] = [0, 0]); a[0] += e.m; a[1]++; }
    let best = null, hi = -1;
    for (const k in s){ const mean = s[k][0] / s[k][1]; if (mean > hi){ hi = mean; best = k; } }
    return best;
  }
  function keepDrum(mode, e, L){
    if (mode === 'none') return false;
    if (mode === 'sparse') return onBeat(e.t, L);
    if (mode === 'heart') return (e.k === 'thump' || e.k === 'kick') && onBeat(e.t, L);
    return true;
  }
  function chordPCs(list){
    const out = [], sorted = list.slice().sort((a, b) => a.m - b.m);
    for (const e of sorted){ const p = pc(e.m); if (out.indexOf(p) < 0) out.push(p); }
    return out;                                         // lowest note's pitch class first
  }

  // ---- 1. second camp arrangement ----
  function arrangeB(id, b, bi, st){
    const R = RECIPES[id], L = +b.len;
    if (!R || !(L > 0)) return b;
    if (bi === 0) st.prev = null;
    const src = b.ev.filter(e => e && typeof e.k === 'string');
    const melK = R.mel || guessMel(src);
    const out = [], acc = [], mel = [], melOrig = [];
    for (const e0 of src){
      const e = Object.assign({}, e0);
      if (DRUMS.indexOf(e.k) >= 0){ if (keepDrum(R.drums, e, L)) out.push(e); continue; }
      if (e.k === 'cut'){ if (!R.shift && (!R.to || R.to === 'pipe')) out.push(e); continue; }
      if (!isNum(e.m)){ out.push(e); continue; }
      if (e.k === melK){
        melOrig.push(e0);
        if (R.to) e.k = R.to;
        if (R.shift) e.m = fold(e.m + R.shift);
        mel.push(e); out.push(e); continue;
      }
      acc.push(e0);
      if (R.thin && THIN_VOICES.indexOf(e.k) >= 0 && !onBeat(e.t, L)) continue;
      out.push(e);
    }
    // chord tones come from what the bar already plays over the drone, so nothing new can clash
    const basis = acc.length ? acc : melOrig.filter(e => onBeat(e.t, L));
    const pcs = chordPCs(basis);
    let added = 0;
    if (R.pad && pcs.length){
      const use = R.pad === 'root' ? pcs.slice(0, 1) : pcs.slice(0, 3);
      for (const p of use){
        if (added >= MAX_ADD_PER_BAR) break;
        out.push({t:0, k:'pad', m:place(p, PAD_LO), d:L * .98, v:PAD_VOL}); added++;
      }
    }
    const C = R.counter;
    if (C && pcs.length){
      const step = L / C.per;
      for (let i = 0; i < C.per && added < MAX_ADD_PER_BAR; i++){
        const t = i * step;
        const sounding = mel.filter(e => (+e.t || 0) <= t + 1e-6 && t < (+e.t || 0) + (+e.d || .3)).map(e => e.m);
        const prev = st.prev === null ? (C.lo + C.hi) / 2 : st.prev;
        let best = null, bd = Infinity;
        for (let m = C.lo; m <= C.hi; m++){
          if (pcs.indexOf(pc(m)) < 0) continue;
          if (sounding.some(s => { const iv = Math.abs(s - m) % 12; return iv === 1 || iv === 11 || s === m; })) continue;
          const d = Math.abs(m - prev) + (m === st.prev ? REPEAT_PENALTY : 0);
          if (d < bd){ bd = d; best = m; }
        }
        if (best === null) continue;
        out.push({t, k:C.k, m:best, d:step * .9, v:C.v, vib:0}); added++; st.prev = best;
      }
    }
    return Object.assign({}, b, {ev:out.filter(hasVoice)});
  }

  function wrapCamp(id, orig){
    if (typeof orig !== 'function' || orig.__i88c) return orig;
    const st = {prev:null};
    const w = function(bi, variant){
      const b = orig.apply(this, arguments);
      try {
        if (classic() || !b || !Array.isArray(b.ev)) return b;
        if (VARIANT_SONGS.indexOf(id) < 0 || (((variant | 0) & 1) !== VARIANT_PARITY)) return b;
        return arrangeB(id, b, bi | 0, st);
      } catch (x){ return b; }
    };
    w.__i88c = true; w.__orig = orig;
    return w;
  }

  // ---- 2 and 3. boss motif and danger cue (battle) ----
  const cs = {lastLevel:0, lastBi:-1, lastCue:LONG_AGO, motifStart:-1, motifN:0, g:null, arrivalAt:LONG_AGO};

  function tonic(id){
    try {
      const d = MUS.SONGS[id].combat.drone, m = d && d.o && d.o[0] && d.o[0][1];
      if (isNum(m)) return place(pc(m), MOTIF_ROOT_LO);
    } catch (x){}
    return place(9, MOTIF_ROOT_LO);                     // A
  }
  function barRoot(b, fallback){
    let lo = null;
    for (const e of b.ev) if (e && e.k === 'bass' && isNum(e.m) && (lo === null || e.m < lo)) lo = e.m;
    return lo === null ? fallback : place(pc(lo), MOTIF_ROOT_LO);
  }
  function bossScan(){
    const r = {near:false, alive:false};
    try {
      if (typeof G === 'undefined' || !G || G.over || !G.leader) return r;
      const L = G.leader, known = typeof BESTIARY !== 'undefined' && BESTIARY;
      if (!known){ r.alive = true; return r; }          // no bestiary: arrival hold still works
      for (const e of G.enemies || []){
        if (!e || e.dead || e.dormant || e.broken || !BESTIARY[e.k] || !BESTIARY[e.k].boss) continue;
        r.alive = true;
        if (Math.hypot(e.x - L.x, e.y - L.y) < BOSS_RANGE){ r.near = true; break; }
      }
    } catch (x){}
    return r;
  }
  function motif(add, root, pos, L, units){
    for (const [x, s, d, v] of MOTIF[pos] || []){
      const t = (x === 'p' ? 1 - 1 / units : x) * L;
      if (s === 'taiko') add.push({t, k:'taiko', v:v * MOTIF_VOL});
      else add.push({t, k:'lead', m:root + s, d:(x === 'p' ? L / units : d * L) * .9, v:v * MOTIF_VOL});
    }
  }
  function cue(add, r, level){
    const v = CUE_VOL, big = level >= 2;
    [0, .1, .2, .3].forEach((t, i) => add.push({t, k:'snare', v:v * (.25 + .12 * i)}));
    [[0, 0], [.15, 5], [.3, 7]].forEach(([t, s]) => add.push({t, k:'lead', m:r + s, d:.13, v:v * .45}));
    const hold = big ? 1.0 : .7;
    add.push({t:.45, k:'taiko', v}, {t:.45, k:'lead', m:r + 12, d:hold, v:v * .55}, {t:.45, k:'lead', m:r + 7, d:hold, v:v * .4});
    if (big) add.push({t:.45, k:'lead', m:r, d:hold, v:v * .4}, {t:.9, k:'taiko', v:v * .8});
  }
  function battleLayers(id, b, bi, level){
    const L = +b.len;
    if (!(L > 0)) return b;
    // FIX C-01: this was `bi === 0 || bi < cs.lastBi`, but in a contract bi is the CAMP bar index (it wraps every
    // pass), so lastLevel was reset each pass and the danger cue re-fired every CUE_GAP_S while the fight lasted.
    // A new fight is a new G object.
    let g = null; try { g = (typeof G !== 'undefined') ? G : null; } catch (x){}
    if (g !== cs.g){ cs.g = g; cs.lastLevel = 0; cs.motifStart = -1; cs.motifN = 0; cs.lastCue = LONG_AGO; }
    cs.lastBi = bi;
    const add = [], now = nowS(), tn = tonic(id);
    if (level > cs.lastLevel && now - cs.lastCue >= CUE_GAP_S){ cue(add, barRoot(b, tn), level); cs.lastCue = now; }
    cs.lastLevel = level;
    const B = bossScan();
    if (B.near || (B.alive && now - cs.arrivalAt < BOSS_ARRIVAL_HOLD_S)){
      if (cs.motifStart < 0){ cs.motifStart = bi; cs.motifN = 0; }
      // FIX C-01: count bars played, not (bi - start): bi wraps with the camp tune, which broke the 4-bar phrase
      motif(add, tn, (cs.motifN++) % MOTIF_BARS, L, COMPOUND_SONGS.indexOf(id) >= 0 ? 6 : 8);
    } else cs.motifStart = -1;
    if (!add.length) return b;
    return Object.assign({}, b, {ev:b.ev.concat(add.filter(hasVoice))});
  }
  function wrapCombat(id, orig){
    if (typeof orig !== 'function' || orig.__i88c) return orig;
    const w = function(bi, level, variant){
      const b = orig.apply(this, arguments);
      try {
        if (classic() || !b || !Array.isArray(b.ev)) return b;
        return battleLayers(id, b, bi | 0, level | 0);
      } catch (x){ return b; }
    };
    w.__i88c = true; w.__orig = orig;
    return w;
  }

  // boss arrival signal: SFX 'boss' starts the hold, 'bossdie' ends it
  function wrapSfx(){
    try {
      if (typeof SFX === 'undefined' || !SFX || typeof SFX.layer !== 'function') return;
      SFX.layer('i88c', function(name, next){
        try { if (name === 'boss') cs.arrivalAt = nowS(); else if (name === 'bossdie') cs.arrivalAt = LONG_AGO; } catch (x){}
        return next();
      });
    } catch (x){}
  }

  function init(){
    try {
      if (typeof MUS === 'undefined' || !MUS || !MUS.SONGS || typeof MUS.SONGS !== 'object') return false;
      const S = MUS.SONGS;
      for (const id of Object.keys(S)){
        const s = S[id];
        if (!s) continue;
        if (RECIPES[id] && s.camp && typeof s.camp.fn === 'function'){
          const o = s.camp.fn, w = wrapCamp(id, o);
          s.camp.fn = w;
          if (s.fn === o) s.fn = w; else if (typeof s.fn === 'function') s.fn = wrapCamp(id, s.fn);
        }
        if (s.combat && typeof s.combat.fn === 'function') s.combat.fn = wrapCombat(id, s.combat.fn);
      }
      wrapSfx();
      return true;
    } catch (x){ return true; }
  }

  if (!init()){ try { window.addEventListener('load', function(){ init(); }, {once:true}); } catch (x){} }
})();
