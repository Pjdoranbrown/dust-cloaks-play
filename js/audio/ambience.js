/* =============================================================================
   INDEX 88b - AMBIENCE BEDS

   Quiet looping ambience beds (wind, fire, rain, cave drip, murmur), each built
   from filtered noise, a slow LFO and sparse random one-shot events. One hook,
   AMBIENCE.update(), decides which bed belongs to the current place and crossfades
   to it. It runs from a 250 ms poll and after the place-change functions
   (startDeployment, endDeployment, startCamp, stopCamp, TAVERN.enter, TAVERN.leave).

   Places: FIELD (contract: bed from G.obj and the season), CAMP (low fire, faint
   wind, very distant murmur), TAVERN and BRAWL (low hearth fire only; the tavern
   crowd loop in js/audio/synth.js block 87g is never doubled), title and menus (silence).

   Routing: every bed goes through one bus into SFX._g().master, so Volume, the
   Effects slider and Soft sounds apply. Nothing is connected to ctx.destination.
   Shared AudioContext only. No new save keys. No audio files.

   Console test: AMBIENCE.set('cave'), AMBIENCE.set('rain'), AMBIENCE.stop(),
   AMBIENCE.set('auto') to return to automatic. A place change also returns to auto.

   Seagulls (F-36b): the CAMP bed carries a sparse 'gulls' layer. It only calls when the holding is the
   Dockside Cog-Barge AND the hour is 'day' (LOOK.time()); never at dawn or night (the camp is always 'dusk' in LOOK, so there the camp's own day, LIVING36.isDay(), decides; without LIVING36 the local clock 7 to 17 stands in), never in the fort,
   warehouse or waystation, never in a contract or the tavern. One call (1 to 3 cries) every 16 to 48 s,
   never more than 3 a minute, each a little different. Off: set
   GULLS.enabled = false below. Check: AMBIENCE.gulls.state(); force one now: AMBIENCE.gulls.test().

   ROLLBACK: delete this file and its <script> tag
   ============================================================================= */
(function () {
  'use strict';
  if (window.AMBIENCE) return;                       // loaded twice: do nothing

  /* ---------------- TUNABLES ---------------- */
  const POLL_MS           = 250;     // light poll
  const FADE_S            = 2.5;     // crossfade in, and fade out when a place ends
  const HARD_FADE_S       = 0.15;    // hidden tab, Volume 0, Effects 0, classic, ctx not running
  const CLEANUP_MARGIN_S  = 0.15;    // extra time before nodes are disconnected
  const BUS_TAU_S         = 0.8;     // smoothing of the music-ducking level
  const MUSIC_DUCK        = 0.45;    // fraction removed from the bus at full music loudness
  const MUSIC_VOL_REF     = 0.30;    // MUS.vol() value treated as "full" for ducking
  const CAMP_OVERLAP_DUCK = 0.6;     // camp bed multiplier while the old AUD-15 bed (AUDIO87.amb()) is live
  const MAX_DYING         = 3;       // fading beds kept at once; older ones are cut
  const FAIL_BACKOFF_MS   = 5000;    // wait after a failed bed build
  const NOISE_SECONDS     = 3;       // own looping noise buffer

  // Bed levels (peak-ish level into the bus; the master and music ducking sit on top)
  const BED_LEVEL = {wind: 0.12, fire: 0.10, rain: 0.10, cave: 0.08, murmur: 0.10, camp: 0.10, hearth: 0.08};
  // Bed recipes: [layer, mix]
  const BEDS = {
    wind:   [['wind', 1]],
    fire:   [['fire', 1]],
    rain:   [['rain', 1]],
    cave:   [['cave', 1]],
    murmur: [['murmur', 1]],
    camp:   [['fire', 0.8], ['wind', 0.4], ['murmur', 0.3], ['gulls', 1]],   // set the murmur mix to 0 to drop it; gulls call on the barge by day only
    hearth: [['fire', 0.7]]                                     // tavern and brawl: fire only, no murmur
  };
  // Field selection. OBJ_BED wins, then SEASON_BED, then 'wind'.
  const OBJ_BED    = {};                 // e.g. {extract: 'cave'} once a cave map exists. Empty today.
  const SEASON_BED = {winter: 'rain'};
  const OBJ_LEVEL  = {escort: 0.75, drill: 0.6};   // level scale per objective (forest shelters wind; drill is gentle)

  // Event rates [min, max] ms
  const GUST_MS    = [6000, 14000];
  const CRACKLE_MS = [180, 1600];
  const DROP_MS    = [140, 650];
  const DRIP_MS    = [1600, 6500];
  const VOICE_MS   = [2500, 8000];
  const CRACKLE_CLUSTER_CHANCE = 0.25;

  // Seagulls (F-36b). Tunables.
  const GULLS = {
    enabled: true,                 // false = never
    holding: 'barge',              // the only holding with gulls
    hours: ['day'],                // LOOK.time() values that allow them (none at dawn, dusk or night)
    livingDay: true,               // in the camp, gate on Art's day clock, LIVING36.isDay() (js/camp/living.js: phase below 0.85 of a 4 minute loop, runs in every holding),
                                   //   so sound and light agree; the local clock below is the fallback when LIVING36 is missing
    campClock: true,               // fallback when LIVING36 is not there: LOOK keeps every camp at evening ('dusk' always), so in the camp the player's own clock decides:
    dayFrom: 7, dayTo: 18,         //   local hour 7 to 17 counts as day. Set campClock false once the camp has a real day cycle (F-36a).
    clockHour: () => new Date().getHours(),
    gapMs: [16000, 48000],         // time to the next call
    minGapS: 12,                   // hard floor between two calls
    maxPerMin: 3,                  // never more than this many calls in 60 s
    cries: [1, 3],                 // cries per call
    peak: 0.5,                     // cry level, times the layer level (bed 0.10): about -26 dB below the bed's own peaks
    farChance: 0.45,               // share of calls that are distant (darker and quieter)
    farGain: 0.45
  };
  const gullLog = {calls: 0, lastAt: 0, recent: []};

  // Voice parameters
  const P = {
    wind:   {freq: 420, q: 0.5, gain: 1, lfoHz: 0.09, lfoDepth: 0.35, sweep: 140, gust: 0.7, gustFreqMul: 1.5, rise: 0.9, hold: 1.8, fall: 1.4},
    fire:   {lpFreq: 200, q: 0.4, gain: 1, lfoHz: 0.35, lfoDepth: 0.3,
             tickF: [2200, 6000], tickQ: 2, tickDur: [0.008, 0.03], tickPeak: [0.5, 1.2],
             snapF: [900, 1800], snapQ: 1.5, snapDur: [0.03, 0.07], snapPeak: [1.0, 2.0],
             popF: [150, 80], popDur: 0.09, popPeak: [0.3, 0.6], snapChance: 0.2, popChance: 0.1},
    rain:   {hpFreq: 1400, lpFreq: 7500, hissGain: 0.4, bodyFreq: 350, bodyGain: 0.6, lfoHz: 0.06, lfoDepth: 0.2, gust: 0.5,
             dropF: [3000, 8000], dropQ: 4, dropDur: [0.006, 0.015], dropPeak: [0.4, 1.0]},
    cave:   {lpFreq: 160, gain: 0.5, lfoHz: 0.05, lfoDepth: 0.25,
             dripF: [700, 1800], dripRise: 1.25, dripDur: 0.09, dripPeak: [0.3, 0.5], echoes: [[0.21, 0.4], [0.43, 0.16]]},
    murmur: {bpFreq: 700, bpQ: 0.7, lpFreq: 1500, gain: 0.8, lfoHz: 0.17, lfoDepth: 0.4,
             voiceF: [95, 195], voiceGlide: [0.85, 1.15], voiceBp: [500, 1000], voiceQ: 3, voiceDur: [0.6, 1.1], voiceAtk: 0.2, voicePeak: [0.5, 1.0]}
  };

  /* ---------------- STATE ---------------- */
  let bus = null, busAc = null, busMaster = null, lastBusF = -1;
  let cur = null;                 // the bed that should be audible
  let dying = [];                 // beds fading out
  let manual = null;              // null = automatic, '' = silence, 'name' = forced (for tests)
  let nbAc = null, nbBuf = null;  // cached noise buffer
  let failUntil = 0;
  const HARD = {name: null, hard: true};
  const NONE = {name: null, hard: false};

  /* ---------------- SAFE ACCESSORS ---------------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = r => rand(r[0], r[1]);

  function audio() {
    try { if (typeof SFX !== 'undefined' && SFX && typeof SFX._g === 'function') return SFX._g(); } catch (e) {}
    return null;
  }
  function cfg() {
    try { if (typeof settings === 'function') return settings() || null; } catch (e) {}
    return null;
  }
  function curG() {
    try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; }
  }
  function campOn() {
    try { return typeof CAMP !== 'undefined' && !!(CAMP && CAMP.on); } catch (e) { return false; }
  }
  function tavernOn() {
    try {
      const T = window.TAVERN;
      if (T && typeof T.open === 'function' && T.open()) return true;
      const A = window.AUDIO87;
      if (A && typeof A.tavernLoops === 'function' && A.tavernLoops().length) return true;   // crowd loop is running
    } catch (e) {}
    return false;
  }
  function seasonNow(g) {
    try { if (typeof seasonOf === 'function') return String(seasonOf() || '').toLowerCase(); } catch (e) {}
    return g && g.season ? String(g.season).toLowerCase() : '';
  }
  function rainAllowed() {
    const c = cfg();
    return !(c && c.seasonFx === false) && !window.SEASON_FX_OFF;
  }
  function musicFactor() {
    try {
      if (typeof MUS !== 'undefined' && MUS && typeof MUS.vol === 'function') {
        const v = MUS.vol();
        if (isFinite(v)) return 1 - MUSIC_DUCK * Math.min(1, Math.max(0, v / MUSIC_VOL_REF));
      }
    } catch (e) {}
    return 1;
  }
  function holdingNow() {
    try { if (typeof holding === 'function') return holding(); } catch (e) {}
    return '';
  }
  function hourNow() {
    try { if (window.LOOK && typeof LOOK.time === 'function') return LOOK.time(); } catch (e) {}
    return '';
  }
  function gullsEligible() {
    if (!GULLS.enabled || holdingNow() !== GULLS.holding) return false;
    const h = hourNow();
    if (GULLS.hours.indexOf(h) >= 0) return true;
    if (GULLS.livingDay && !curG() && !(window.LOOK && LOOK.force)) {
      const Lv = window.LIVING36;
      if (Lv && typeof Lv.isDay === 'function') { try { return !!Lv.isDay(); } catch (e) {} }
    }
    if (GULLS.campClock && h === 'dusk' && !curG() && !(window.LOOK && LOOK.force)) { const c = GULLS.clockHour(); return c >= GULLS.dayFrom && c < GULLS.dayTo; }
    return false;
  }
  function oldCampBedLive() {
    try { const A = window.AUDIO87; return !!(A && typeof A.amb === 'function' && A.amb()); } catch (e) { return false; }
  }

  /* ---------------- DECISION ---------------- */
  function fieldBed(g) {
    const pick = (window.AMBIENCE && AMBIENCE.pick) ? AMBIENCE.pick(g) : null;   /* Index 104 (js/audio/mood.js): the region may choose the bed */
    let n = pick || OBJ_BED[g.obj] || SEASON_BED[seasonNow(g)] || 'wind';
    if (n === 'rain' && !rainAllowed()) n = 'wind';
    if (!BEDS[n]) n = 'wind';
    return {name: n, scale: OBJ_LEVEL[g.obj] || 1};
  }
  function decide() {
    const X = audio();
    if (window.AUDIO_CLASSIC || document.hidden || !X || !X.ac || !X.master || X.ac.state !== 'running') return HARD;
    const c = cfg();
    if (c) {
      if (typeof c.volume === 'number' && c.volume <= 0) return HARD;
      if (typeof c.sfx === 'number' && c.sfx <= 0) return HARD;
    }
    if (manual !== null) return manual === '' ? NONE : {name: manual, scale: 1};
    const g = curG();
    if (g && !g.over) {
      if (g.obj === 'brawl') return {name: 'hearth', scale: 1};   // brawl is in the tavern: no extra murmur
      return fieldBed(g);
    }
    if (!g && tavernOn()) return {name: 'hearth', scale: 1};
    if (!g && campOn()) return {name: 'camp', scale: 1};
    return NONE;                                                   // title screen, menus, result screen
  }

  /* ---------------- BUILD HELPERS ---------------- */
  function noise(ac) {
    if (nbBuf && nbAc === ac) return nbBuf;
    const n = Math.floor(ac.sampleRate * NOISE_SECONDS);
    const b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    nbAc = ac; nbBuf = b;
    return b;
  }
  function mk(bed, n) { bed.nodes.push(n); return n; }
  function startSrc(bed) {
    const s = mk(bed, bed.ac.createBufferSource());
    s.buffer = noise(bed.ac); s.loop = true;
    s.start(0, Math.random() * (NOISE_SECONDS - 0.2));
    bed.srcs.push(s);
    return s;
  }
  function lfo(bed, hz) {
    const o = mk(bed, bed.ac.createOscillator());
    o.frequency.value = hz * rand(0.85, 1.15);
    o.start(); bed.srcs.push(o);
    return o;
  }
  function mod(bed, osc, depth, param) {
    const g = mk(bed, bed.ac.createGain());
    g.gain.value = depth; osc.connect(g); g.connect(param);
  }
  function filt(bed, type, f, q) {
    const b = mk(bed, bed.ac.createBiquadFilter());
    b.type = type; b.frequency.value = f; b.Q.value = q;
    return b;
  }
  // Repeating random event; stops when the bed fades or dies, never stacks.
  function loop(bed, fn, range) {
    const step = () => {
      if (bed.dead || bed.fading) return;
      const id = setTimeout(() => {
        bed.timers.delete(id);
        if (bed.dead || bed.fading) return;
        try { if (bed.ac.state === 'running') fn(); } catch (e) {}
        step();
      }, pick(range));
      bed.timers.add(id);
    };
    step();
  }
  // Track a one-shot so it is disconnected when it ends (or when the bed is cleaned up).
  function shot(bed, nodes, src) {
    const rec = {nodes, src};
    bed.shots.add(rec);
    src.onended = () => { bed.shots.delete(rec); nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); };
  }
  function burst(L, f, q, dur, peak, t) {
    const ac = L.ac, bs = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    bs.buffer = noise(ac); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    bs.connect(bp); bp.connect(g); g.connect(L.dest);
    shot(L.bed, [bs, bp, g], bs);
    bs.start(t, Math.random() * (NOISE_SECONDS - 0.3)); bs.stop(t + dur + 0.02);
  }
  function blip(L, o) {
    const ac = L.ac, t = o.t, osc = ac.createOscillator(), g = ac.createGain(), nodes = [osc, g];
    osc.type = o.type; osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    let last = osc;
    if (o.bpF) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.bpF; bp.Q.value = o.bpQ || 1; last.connect(bp); last = bp; nodes.push(bp); }
    last.connect(g); g.connect(L.dest);
    const atk = o.atk || 0.003;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let end = t + o.dur;
    (o.echoes || []).forEach(e => {
      g.gain.setValueAtTime(0.0001, t + e[0]);
      g.gain.linearRampToValueAtTime(o.peak * e[1], t + e[0] + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + e[0] + o.dur);
      end = t + e[0] + o.dur;
    });
    shot(L.bed, nodes, osc);
    osc.start(t); osc.stop(end + 0.05);
  }
  function gust(param, base, peakMul, t, p) {
    param.setTargetAtTime(base * peakMul, t, p.rise);
    param.setTargetAtTime(base, t + p.hold, p.fall);
  }

  /* ---------------- LAYERS ---------------- */
  const LAYERS = {
    wind(L) {
      const {bed, ac, k, dest} = L, p = P.wind;
      const s = startSrc(bed), bp = filt(bed, 'bandpass', p.freq, p.q), sw = mk(bed, ac.createGain());
      const base = k * p.gain; sw.gain.value = base;
      s.connect(bp); bp.connect(sw); sw.connect(dest);
      const o = lfo(bed, p.lfoHz);
      mod(bed, o, base * p.lfoDepth, sw.gain);
      mod(bed, o, p.sweep, bp.frequency);
      loop(bed, () => {
        const t = ac.currentTime, m = 1 + p.gust * rand(0.5, 1);
        gust(sw.gain, base, m, t, p);
        gust(bp.frequency, p.freq, p.gustFreqMul, t, p);
      }, GUST_MS);
    },
    fire(L) {
      const {bed, ac, k, dest} = L, p = P.fire;
      const s = startSrc(bed), lp = filt(bed, 'lowpass', p.lpFreq, p.q), g = mk(bed, ac.createGain());
      const base = k * p.gain; g.gain.value = base;
      s.connect(lp); lp.connect(g); g.connect(dest);
      mod(bed, lfo(bed, p.lfoHz), base * p.lfoDepth, g.gain);
      const one = t => {
        const r = Math.random();
        if (r < p.popChance) blip(L, {type: 'sine', f0: p.popF[0], f1: p.popF[1], dur: p.popDur, peak: k * pick(p.popPeak), t, atk: 0.004});
        else if (r < p.popChance + p.snapChance) burst(L, pick(p.snapF), p.snapQ, pick(p.snapDur), k * pick(p.snapPeak), t);
        else burst(L, pick(p.tickF), p.tickQ, pick(p.tickDur), k * pick(p.tickPeak), t);
      };
      loop(bed, () => {
        const t = ac.currentTime + 0.01;
        one(t);
        if (Math.random() < CRACKLE_CLUSTER_CHANCE) { const n = 1 + (Math.random() * 3 | 0); for (let i = 1; i <= n; i++) one(t + i * rand(0.012, 0.035)); }
      }, CRACKLE_MS);
    },
    rain(L) {
      const {bed, ac, k, dest} = L, p = P.rain;
      const s = startSrc(bed);
      const hp = filt(bed, 'highpass', p.hpFreq, 0.5), lp = filt(bed, 'lowpass', p.lpFreq, 0.5), hiss = mk(bed, ac.createGain());
      const hBase = k * p.hissGain; hiss.gain.value = hBase;
      s.connect(hp); hp.connect(lp); lp.connect(hiss); hiss.connect(dest);
      const bp = filt(bed, 'bandpass', p.bodyFreq, 0.6), body = mk(bed, ac.createGain());
      body.gain.value = k * p.bodyGain;
      s.connect(bp); bp.connect(body); body.connect(dest);
      mod(bed, lfo(bed, p.lfoHz), hBase * p.lfoDepth, hiss.gain);
      loop(bed, () => gust(hiss.gain, hBase, 1 + p.gust * rand(0.5, 1), ac.currentTime, P.wind), GUST_MS);
      loop(bed, () => burst(L, pick(p.dropF), p.dropQ, pick(p.dropDur), k * pick(p.dropPeak), ac.currentTime + 0.01), DROP_MS);
    },
    cave(L) {
      const {bed, ac, k, dest} = L, p = P.cave;
      const s = startSrc(bed), lp = filt(bed, 'lowpass', p.lpFreq, 0.7), g = mk(bed, ac.createGain());
      const base = k * p.gain; g.gain.value = base;
      s.connect(lp); lp.connect(g); g.connect(dest);
      mod(bed, lfo(bed, p.lfoHz), base * p.lfoDepth, g.gain);
      loop(bed, () => {
        const f = pick(p.dripF);
        blip(L, {type: 'sine', f0: f, f1: f * p.dripRise, dur: p.dripDur, peak: k * pick(p.dripPeak), t: ac.currentTime + 0.01, atk: 0.002, echoes: p.echoes});
      }, DRIP_MS);
    },
    murmur(L) {
      const {bed, ac, k, dest} = L, p = P.murmur;
      const s = startSrc(bed), bp = filt(bed, 'bandpass', p.bpFreq, p.bpQ), lp = filt(bed, 'lowpass', p.lpFreq, 0.5), g = mk(bed, ac.createGain());
      const base = k * p.gain; g.gain.value = base;
      s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest);
      mod(bed, lfo(bed, p.lfoHz), base * p.lfoDepth, g.gain);
      loop(bed, () => {
        const f0 = pick(p.voiceF);
        blip(L, {type: 'sawtooth', f0, f1: f0 * pick(p.voiceGlide), dur: pick(p.voiceDur), atk: p.voiceAtk, peak: k * pick(p.voicePeak),
                 bpF: pick(p.voiceBp), bpQ: p.voiceQ, t: ac.currentTime + 0.01});
      }, VOICE_MS);
    },
    gulls(L) {
      const {bed, ac, k, dest} = L;
      const next = () => {
        const now = ac.currentTime;
        gullLog.recent = gullLog.recent.filter(t => now - t < 60);
        if (!gullsEligible()) return;                                        // wrong holding, hour or switched off: stay quiet
        if (now - gullLog.lastAt < GULLS.minGapS || gullLog.recent.length >= GULLS.maxPerMin) return;
        gullCall(L, now + 0.05);
      };
      loop(bed, next, GULLS.gapMs);
    }
  };
  // One call: 1 to 3 cries, each a rising-falling squeal with a fast wobble, a breathy edge, and a small random pitch.
  function gullCall(L, t0) {
    const {bed, ac, k, dest} = L;
    const far = Math.random() < GULLS.farChance, lvl = k * GULLS.peak * (far ? GULLS.farGain : 1), base = rand(0.88, 1.12);
    const n = GULLS.cries[0] + Math.floor(Math.random() * (GULLS.cries[1] - GULLS.cries[0] + 1));
    let t = t0;
    for (let i = 0; i < n; i++) {
      const dur = rand(0.28, 0.5) * (i === n - 1 ? 1.25 : 1), f0 = 1250 * base * rand(0.95, 1.05), f1 = f0 * rand(1.5, 1.8), f2 = f0 * rand(1.05, 1.25);
      const osc = ac.createOscillator(), vib = ac.createOscillator(), vg = ac.createGain(), bp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, t); osc.frequency.linearRampToValueAtTime(f1, t + dur * 0.35); osc.frequency.linearRampToValueAtTime(f2, t + dur);
      vib.frequency.value = rand(24, 36); vg.gain.value = f0 * 0.05; vib.connect(vg); vg.connect(osc.frequency);
      bp.type = 'bandpass'; bp.frequency.value = 2300 * base; bp.Q.value = 1.6;
      lp.type = 'lowpass'; lp.frequency.value = far ? 2600 : 4200;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl * (i === 0 ? 1 : 0.8), t + 0.06);
      g.gain.exponentialRampToValueAtTime(lvl * 0.35, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest);
      shot(bed, [osc, vib, vg, bp, lp, g], osc);
      osc.start(t); vib.start(t); osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
      burst({ac, dest, bed}, 3200 * base, 1.2, dur * 0.8, lvl * 0.35, t);   // breath
      t += dur + rand(0.1, 0.35);
    }
    gullLog.calls++; gullLog.lastAt = t0; gullLog.recent.push(t0);
    return n;
  }

  /* ---------------- BED LIFECYCLE ---------------- */
  function build(X, name, scale) {
    if (Date.now() < failUntil) return null;
    const def = BEDS[name]; if (!def) return null;
    const ac = X.ac, t = ac.currentTime;
    const bed = {name, scale, ac, nodes: [], srcs: [], timers: new Set(), shots: new Set(), dead: false, fading: false, hard: false, cleanT: 0, fade: null};
    try {
      bed.fade = mk(bed, ac.createGain());
      bed.fade.gain.setValueAtTime(0.0001, t);
      bed.fade.gain.setTargetAtTime(1, t, FADE_S / 4);        // fade in, no click
      bed.fade.connect(bus);
      def.forEach(d => {
        const mix = d[1]; if (!(mix > 0) || !LAYERS[d[0]]) return;
        LAYERS[d[0]]({bed, ac, dest: bed.fade, k: (BED_LEVEL[name] || 0.08) * mix * scale});
      });
      return bed;
    } catch (e) {
      failUntil = Date.now() + FAIL_BACKOFF_MS;
      cleanup(bed);
      return null;
    }
  }
  function cleanup(bed) {
    if (!bed || bed.dead) return;
    bed.dead = true;
    clearTimeout(bed.cleanT);
    bed.timers.forEach(clearTimeout); bed.timers.clear();
    bed.srcs.forEach(s => { try { s.stop(); } catch (e) {} });
    bed.shots.forEach(r => {
      try { r.src.onended = null; r.src.stop(); } catch (e) {}
      r.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
    });
    bed.shots.clear();
    bed.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
    bed.nodes.length = 0; bed.srcs.length = 0;
    const i = dying.indexOf(bed); if (i >= 0) dying.splice(i, 1);
    if (cur === bed) cur = null;
  }
  function release(bed, hard) {
    if (!bed || bed.dead) return;
    if (bed.fading && (bed.hard || !hard)) return;                    // already on its way out; do not restart the timer
    bed.hard = !!hard;
    if (!bed.fading) { bed.fading = true; bed.timers.forEach(clearTimeout); bed.timers.clear(); }   // events stop now
    const dur = hard ? HARD_FADE_S : FADE_S;
    try { bed.fade.gain.setTargetAtTime(0, bed.ac.currentTime, dur / 5); } catch (e) {}
    clearTimeout(bed.cleanT);
    bed.cleanT = setTimeout(() => cleanup(bed), (dur + CLEANUP_MARGIN_S) * 1000);
    if (cur === bed) cur = null;
    if (dying.indexOf(bed) < 0) {
      dying.push(bed);
      while (dying.length > MAX_DYING) cleanup(dying[0]);
    }
  }
  function killAll(hard) {
    release(cur, hard);
    dying.slice().forEach(b => release(b, hard));
  }
  function ensureBus(X) {
    if (bus && (busAc !== X.ac || busMaster !== X.master)) {      // context or master was replaced
      killAll(true);
      try { bus.disconnect(); } catch (e) {}
      bus = null;
    }
    if (!bus) {
      bus = X.ac.createGain();
      bus.gain.value = busFactor();
      bus.connect(X.master);
      busAc = X.ac; busMaster = X.master; lastBusF = bus.gain.value;
    }
  }
  function busFactor() {
    let f = musicFactor();
    if (window.AUDIO_MIX && AUDIO_MIX.ambFactor) f *= AUDIO_MIX.ambFactor();   // F-44f: the bed gives way to effects in a fight
    if (cur && cur.name === 'camp' && oldCampBedLive()) f *= CAMP_OVERLAP_DUCK;
    return f;
  }
  function updateBus() {
    if (!bus) return;
    const f = busFactor();
    if (Math.abs(f - lastBusF) > 0.004) {
      try { bus.gain.setTargetAtTime(f, busAc.currentTime, BUS_TAU_S); } catch (e) {}
      lastBusF = f;
    }
  }

  /* ---------------- THE ONE HOOK ---------------- */
  function update() {
    try {
      const w = decide();
      if (w.hard) { if (cur || dying.length) killAll(true); return; }
      if (!w.name) { if (cur) release(cur, false); return; }
      if (cur && !cur.fading && cur.name === w.name && cur.scale === w.scale) { updateBus(); return; }
      const X = audio();
      ensureBus(X);
      if (cur) release(cur, false);
      const b = build(X, w.name, w.scale || 1);
      if (b) cur = b;
      updateBus();
    } catch (e) {}
  }
  function onPlace() { manual = null; update(); }          // a place change returns to automatic

  /* ---------------- PUBLIC API ---------------- */
  function current() { return cur && !cur.fading ? cur.name : null; }
  function set(name) {
    try {
      if (name === undefined || name === null || name === 'auto') manual = null;
      else if (BEDS[name]) manual = name;
      else return current();
      update();
    } catch (e) {}
    return current();
  }
  function stop() {
    try { manual = ''; killAll(false); } catch (e) {}
    return current();
  }
  const gulls = {
    eligible: gullsEligible,
    state: () => ({enabled: !!GULLS.enabled, holding: holdingNow(), hour: hourNow(), eligible: gullsEligible(), calls: gullLog.calls, lastAt: gullLog.lastAt, inCamp: !!(cur && !cur.fading && cur.name === 'camp')}),
    // force one call now (ignores holding, hour and rate limits; still goes through the real bus and master): for tests and listening
    test() {
      const X = audio(); if (!X || !X.ac) return 0;
      ensureBus(X);
      const bed = {name: 'gulltest', ac: X.ac, nodes: [], srcs: [], timers: new Set(), shots: new Set(), dead: false, fading: false};
      const n = gullCall({bed, ac: X.ac, dest: bus, k: BED_LEVEL.camp}, X.ac.currentTime + 0.05);
      setTimeout(() => cleanup(bed), 6000);
      return n;
    },
    tune: GULLS
  };
  window.AMBIENCE = {update, set, stop, current, gulls};

  /* ---------------- WRAP PLACE CHANGES (save original, call it, then update) ---------------- */
  function wrap(obj, key) {
    try {
      const f = obj && obj[key];
      if (typeof f !== 'function' || f.__amb88b) return;
      const w = function () { try { return f.apply(this, arguments); } finally { onPlace(); } };
      w.__amb88b = true;
      obj[key] = w;
    } catch (e) {}
  }
  ['startDeployment', 'endDeployment', 'startCamp', 'stopCamp'].forEach(k => wrap(window, k));
  wrap(window.TAVERN, 'enter'); wrap(window.TAVERN, 'leave');

  try { document.addEventListener('visibilitychange', update); } catch (e) {}
  try { setInterval(update, POLL_MS); } catch (e) {}
})();
