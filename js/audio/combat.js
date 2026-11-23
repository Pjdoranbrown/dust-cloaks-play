/* INDEX 88a - COMBAT SOUNDS
 * What it does: gives combat three sounds per weapon class (MELEE, BOW, MAGIC):
 *   HIT   a blow lands on an enemy
 *   BLOCK the squad's wards / shield / mount absorb damage
 *   KILL  a normal enemy dies (bosses keep 'bossdie', fixed engines keep 'blast')
 * How: wraps strike() to note the class for the duration of the call, wraps killEnemy() to
 * play the kill sound, and adds an SFX.play layer so 'hit' and 'block' pick the right variant when the
 * class is known (otherwise the original sound plays). Registers by name on SFX.play:
 *   hitMelee hitBow hitMagic  blockWard blockShield blockMount  killMelee killBow killMagic
 * All sound is Web Audio synthesis into the SFX master route. No music ducking.
 * ROLLBACK: delete this file and its <script> tag
 */
(function () {
  'use strict';

  /* ---------------- Tunables ---------------- */
  const GAP_MS = {                       // minimum gap between plays of the same name
    hitMelee: 55, hitBow: 60, hitMagic: 55,
    blockWard: 90, blockShield: 90, blockMount: 90,
    killMelee: 70, killBow: 70, killMagic: 70
  };
  const VOICE_WINDOW_MS = 100;           // window for the global voice cap
  const VOICE_CAP = 4;                   // max new voices (any kind) per window
  const HIT_VOICE_CAP = 2;               // hits stop here so kills and blocks always have room
  const CROWD_TRIM_STEP = 0.1;           // each voice already in the window lowers the next by this
  const CROWD_TRIM_FLOOR = 0.6;          // ...but never below this share of full level
  const LEVEL_CEILING = 0.16;            // hard cap on a voice's level; the 'hurt' tone alone peaks at 0.18
  const MIN_LEVEL = 0.011;               // below this a voice is skipped (also keeps the last GainNode >= 0.01)
  const LEVEL = {                        // per-class volumes (before crowd trim), each <= LEVEL_CEILING
    hit:   { melee: 0.09, bow: 0.085, magic: 0.07 },   // FIX C-01: was 0.13/0.12/0.11 (magic then 0.08 to 0.07), measured 1.6x louder than the old 'hit' (the most frequent sound)
    block: { ward: 0.12, shield: 0.13, mount: 0.14 },
    kill:  { melee: 0.15, bow: 0.13, magic: 0.10 }     // FIX C-01: melee/bow kills were quieter than a plain hit
  };
  const PITCH_SPREAD = 0.06;             // random detune per play: +/- 6 percent (about +/- 100 cents)
  const NOISE_MAKEUP = 1.6;              // filtered noise is quiet; this brings it level with the tones
  const START_LEAD_S = 0.002;            // scheduling lead
  const KILL_DELAY_S = 0.025;            // kill lands just after the hit that caused it

  /* Timbre variants applied to every sound (b body pitch, r ring pitch, n noise pitch, d duration). */
  const VARIANTS = [
    { b: 1,    r: 1,    n: 1,    d: 1    },
    { b: 0.93, r: 1.04, n: 1.22, d: 0.9  },
    { b: 1.07, r: 0.97, n: 0.82, d: 1.12 }
  ];

  /* ---------------- Sound definitions ----------------
   * Layer formats (frequencies in Hz, durations in s, w = relative weight; voices are normalised):
   *   tone : [role 'b'|'r', oscType, f0, f1, dur, w, delay]
   *   noise: ['n', filterType, f0, f1, q, dur, w, delay]
   * A set is a layer array, or {alts:[layer arrays]} (picked at random), or a table keyed by weapon id
   * with '_' as the default. */
  const HIT = {
    melee: {
      spears:      [['b', 'triangle', 170, 95, 0.09, 0.5], ['n', 'bandpass', 1600, 1000, 1.1, 0.06, 0.45]],
      shortswords: [['b', 'triangle', 230, 150, 0.06, 0.3], ['n', 'bandpass', 3000, 2200, 1.3, 0.07, 0.4],
                    ['r', 'sine', 2100, 2000, 0.10, 0.28], ['r', 'sine', 3090, 2950, 0.07, 0.16]],
      pikes:       [['b', 'triangle', 130, 80, 0.11, 0.5], ['n', 'bandpass', 1100, 700, 0.9, 0.08, 0.4],
                    ['r', 'sine', 900, 860, 0.07, 0.1]],
      greatswords: [['b', 'triangle', 95, 48, 0.17, 0.45], ['n', 'bandpass', 800, 450, 0.8, 0.13, 0.3],
                    ['r', 'sine', 640, 600, 0.18, 0.15], ['r', 'sine', 940, 880, 0.12, 0.09]],
      fists:       [['b', 'sine', 125, 66, 0.10, 0.65], ['n', 'lowpass', 520, 260, 0.5, 0.07, 0.3]]   // soft, no metal
    },
    bow: {
      shortbows:   [['b', 'triangle', 340, 190, 0.06, 0.5], ['n', 'bandpass', 2200, 1200, 1.2, 0.05, 0.4],
                    ['r', 'sine', 780, 760, 0.12, 0.15]],                                         // shaft hum
      longbows:    [['b', 'triangle', 240, 130, 0.08, 0.55], ['n', 'bandpass', 1700, 900, 1.0, 0.06, 0.35],
                    ['r', 'sine', 520, 505, 0.14, 0.15]],
      crossbows:   [['b', 'sine', 380, 105, 0.07, 0.6], ['n', 'highpass', 4500, 3000, 0.7, 0.025, 0.3]], // sharp thunk
      bolt:        [['b', 'sine', 300, 80, 0.09, 0.55], ['n', 'bandpass', 2800, 2200, 2.0, 0.04, 0.3],
                    ['r', 'sine', 1700, 1600, 0.10, 0.15]]
    },
    magic: { alts: [
      [['r', 'sine', 1400, 2000, 0.12, 0.35], ['r', 'sine', 1410, 2020, 0.12, 0.25],
       ['n', 'highpass', 6000, 6000, 0.7, 0.04, 0.15], ['b', 'sine', 260, 180, 0.07, 0.25]],        // ping
      [['r', 'triangle', 900, 2400, 0.10, 0.4], ['n', 'bandpass', 3500, 5000, 3.0, 0.09, 0.35],
       ['b', 'sine', 200, 140, 0.06, 0.2]],                                                          // zap
      [['r', 'sine', 620, 380, 0.14, 0.4], ['r', 'sine', 628, 385, 0.14, 0.3],
       ['n', 'bandpass', 1200, 500, 1.5, 0.06, 0.15], ['b', 'sine', 150, 90, 0.08, 0.2]]            // dark pop
    ] }
  };
  HIT.melee._ = HIT.melee.shortswords; HIT.bow._ = HIT.bow.shortbows;

  const KILL = {
    melee: {
      spears:      [['b', 'triangle', 170, 55, 0.17, 0.5], ['n', 'lowpass', 1000, 320, 0.6, 0.13, 0.35, 0.01],
                    ['b', 'sine', 85, 50, 0.09, 0.3, 0.10]],
      shortswords: [['b', 'triangle', 200, 60, 0.16, 0.45], ['n', 'lowpass', 1400, 400, 0.6, 0.12, 0.35, 0.01],
                    ['r', 'sine', 1900, 1100, 0.07, 0.1], ['b', 'sine', 90, 50, 0.09, 0.3, 0.10]],
      pikes:       [['b', 'triangle', 150, 48, 0.20, 0.5], ['n', 'lowpass', 900, 280, 0.6, 0.15, 0.35, 0.01],
                    ['b', 'sine', 80, 45, 0.10, 0.3, 0.12]],
      greatswords: [['b', 'triangle', 120, 36, 0.24, 0.5], ['n', 'lowpass', 800, 220, 0.6, 0.18, 0.35, 0.01],
                    ['r', 'sine', 520, 300, 0.14, 0.1], ['b', 'sine', 65, 38, 0.13, 0.4, 0.12]],
      fists:       [['b', 'sine', 135, 46, 0.18, 0.65], ['n', 'lowpass', 420, 170, 0.5, 0.15, 0.3, 0.01],
                    ['b', 'sine', 70, 42, 0.10, 0.25, 0.11]]
    },
    bow: {
      shortbows:   [['b', 'sine', 640, 190, 0.14, 0.5], ['n', 'bandpass', 1900, 700, 1.0, 0.07, 0.3],
                    ['b', 'sine', 95, 55, 0.08, 0.25, 0.10]],
      longbows:    [['b', 'sine', 520, 150, 0.17, 0.5], ['n', 'bandpass', 1500, 550, 1.0, 0.09, 0.3],
                    ['b', 'sine', 85, 50, 0.09, 0.3, 0.12]],
      crossbows:   [['b', 'triangle', 720, 140, 0.10, 0.5], ['n', 'highpass', 4200, 2200, 0.7, 0.03, 0.3],
                    ['b', 'sine', 100, 55, 0.07, 0.3, 0.08]],
      bolt:        [['b', 'sine', 420, 85, 0.16, 0.5], ['r', 'sine', 1500, 1400, 0.08, 0.12],
                    ['n', 'bandpass', 2600, 1200, 1.5, 0.06, 0.25], ['b', 'sine', 70, 42, 0.10, 0.3, 0.11]]
    },
    magic: { alts: [
      [['r', 'sine', 1900, 520, 0.20, 0.35], ['r', 'sine', 1915, 530, 0.20, 0.25],
       ['n', 'highpass', 6500, 1500, 0.7, 0.18, 0.25], ['r', 'sine', 1320, 1300, 0.12, 0.15, 0.07]],
      [['r', 'triangle', 1100, 260, 0.22, 0.4], ['n', 'bandpass', 3200, 900, 2.0, 0.16, 0.3],
       ['r', 'sine', 2200, 2100, 0.08, 0.12, 0.05]],
      [['r', 'sine', 800, 200, 0.24, 0.4], ['r', 'sine', 806, 205, 0.24, 0.3],
       ['n', 'lowpass', 2500, 500, 0.7, 0.18, 0.2]]
    ] }
  };
  KILL.melee._ = KILL.melee.shortswords; KILL.bow._ = KILL.bow.shortbows;

  const BLOCK = {
    ward:   [['r', 'sine', 1760, 1740, 0.20, 0.35], ['r', 'sine', 2637, 2600, 0.14, 0.25],       // glassy chime
             ['r', 'sine', 3520, 3500, 0.08, 0.12], ['n', 'highpass', 7000, 5000, 0.7, 0.03, 0.1]],
    shield: [['b', 'triangle', 280, 170, 0.07, 0.4], ['n', 'bandpass', 1200, 800, 2.0, 0.05, 0.4], // wood and iron clack
             ['r', 'sine', 760, 700, 0.10, 0.15], ['r', 'sine', 1130, 1000, 0.07, 0.10]],
    mount:  [['b', 'sine', 95, 52, 0.15, 0.65], ['n', 'lowpass', 320, 160, 0.5, 0.09, 0.3],       // dull two-beat thud
             ['b', 'sine', 80, 48, 0.12, 0.4, 0.075]]
  };

  const SETS = { hit: HIT, kill: KILL, block: BLOCK };
  const NAMES = {
    hitMelee:    { k: 'hit',   c: 'melee'  }, hitBow:      { k: 'hit',   c: 'bow'    }, hitMagic:   { k: 'hit',   c: 'magic'  },
    blockWard:   { k: 'block', c: 'ward'   }, blockShield: { k: 'block', c: 'shield' }, blockMount: { k: 'block', c: 'mount'  },
    killMelee:   { k: 'kill',  c: 'melee'  }, killBow:     { k: 'kill',  c: 'bow'    }, killMagic:  { k: 'kill',  c: 'magic'  }
  };
  const HIT_NAME = { melee: 'hitMelee', bow: 'hitBow', magic: 'hitMagic' };
  const KILL_NAME = { melee: 'killMelee', bow: 'killBow', magic: 'killMagic' };
  const BLOCK_NAME = { wards: 'blockWard', shieldPool: 'blockShield', mountPool: 'blockMount' };

  /* ---------------- State ---------------- */
  let curCls = null, curWid = null;      // class noted by the strike() wrapper while strike() runs
  const lastAt = {}, lastVar = {};
  let recent = [];                       // start times of voices inside the window

  /* ---------------- Small helpers ---------------- */
  const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const cfg = () => { try { return (typeof settings === 'function') ? settings() : null; } catch (e) { return null; } };
  function gameG() { try { return (typeof G !== 'undefined' && G) ? G : null; } catch (e) { return null; } }
  function weaponId(cls) {
    const g = gameG(); if (!g) return null;
    try { return cls === 'melee' ? (g.melee && g.melee.id) : cls === 'bow' ? (g.ranged && g.ranged.id) : null; }
    catch (e) { return null; }
  }
  function pickVariant(name, n) {
    let v = Math.floor(Math.random() * n);
    if (v === lastVar[name]) v = (v + 1) % n;
    lastVar[name] = v; return v;
  }

  /* Returns the SFX route when it is OK to make sound now, otherwise null. */
  function ready() {
    if (window.AUDIO_CLASSIC) return null;
    if (typeof document !== 'undefined' && document.hidden) return null;          // hidden tab: stay silent, do not queue
    if (typeof SFX === 'undefined' || !SFX || typeof SFX._g !== 'function') return null;
    const X = SFX._g();
    if (!X || !X.ac || !X.master) return null;                                    // context not created yet
    if (X.ac.state && X.ac.state !== 'running') return null;                      // suspended: would queue and burst on resume
    const s = cfg(); if (!s) return null;
    if (s.volume !== undefined && !(s.volume > 0)) return null;                   // Volume 0
    if (s.sfx === 0) return null;                                                 // Effects 0
    return X;
  }

  /* ---------------- Voice building ---------------- */
  function newVoice(X, pitch, delay) {
    return { ac: X.ac, dest: X.master, buf: X.noiseBuf, t: X.ac.currentTime + START_LEAD_S + (delay || 0),
             p: pitch, parts: [], sum: 0 };
  }
  function envelope(g, t, dur, w) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, w), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function toneLayer(v, L, vr) {
    const m = (L[0] === 'r' ? vr.r : vr.b) * v.p, dur = L[4] * vr.d, t = v.t + (L[6] || 0);
    const o = v.ac.createOscillator(), g = v.ac.createGain();
    o.type = L[1]; o.frequency.setValueAtTime(L[2] * m, t);
    if (L[3] && L[3] !== L[2]) o.frequency.exponentialRampToValueAtTime(Math.max(20, L[3] * m), t + dur);
    envelope(g, t, dur, L[5]); o.connect(g);
    v.sum += L[5]; v.parts.push({ s: o, g: g, t0: t, t1: t + dur + 0.02, off: -1, len: 0 });
  }
  function noiseLayer(v, L, vr) {
    if (!v.buf) return;
    const m = vr.n * v.p, dur = L[5] * vr.d, t = v.t + (L[7] || 0), w = L[6] * NOISE_MAKEUP;
    const s = v.ac.createBufferSource(), f = v.ac.createBiquadFilter(), g = v.ac.createGain();
    s.buffer = v.buf; f.type = L[1]; f.Q.value = L[4];
    f.frequency.setValueAtTime(L[2] * m, t);
    if (L[3] && L[3] !== L[2]) f.frequency.exponentialRampToValueAtTime(Math.max(40, L[3] * m), t + dur);
    envelope(g, t, dur, w); s.connect(f); f.connect(g);
    const room = (v.buf.duration || 0.5) - dur - 0.06;
    v.sum += L[6];
    v.parts.push({ s: s, g: g, t0: t, t1: t + dur + 0.02, off: room > 0 ? Math.random() * room : 0, len: dur + 0.03 });
  }
  /* Nothing is started until every layer was built, so a failure part way leaves silence, not a stray tone.
   * `out` is created LAST with a constant gain >= 0.01: the shared context routes ctx.destination by the most
   * recently created GainNode, so this keeps anything created after us on the SFX side. */
  function finish(v, level) {
    const out = v.ac.createGain();
    out.gain.value = level / Math.max(1, v.sum);                                   // summed nominal peak never exceeds level
    out.connect(v.dest);
    for (const p of v.parts) {
      p.g.connect(out);
      if (p.off >= 0) p.s.start(p.t0, p.off, p.len); else p.s.start(p.t0);
      p.s.stop(p.t1);
    }
  }

  function trigger(name, wid, delay) {
    const N = NAMES[name]; if (!N) return;
    const X = ready(); if (!X) return;
    const now = nowMs();
    if (now - (lastAt[name] || -1e9) < GAP_MS[name]) return;                       // per-name rate limit
    recent = recent.filter(t => now - t < VOICE_WINDOW_MS);
    if (recent.length >= (N.k === 'hit' ? HIT_VOICE_CAP : VOICE_CAP)) return;      // global voice cap
    const trim = Math.max(CROWD_TRIM_FLOOR, 1 - CROWD_TRIM_STEP * recent.length);
    const level = Math.min(LEVEL_CEILING, LEVEL[N.k][N.c] * trim);
    if (!(level >= MIN_LEVEL)) return;
    let set = SETS[N.k][N.c]; if (!set) return;
    const vi = pickVariant(name, VARIANTS.length);
    let vr = VARIANTS[vi];
    if (set.alts) { set = set.alts[vi % set.alts.length]; vr = VARIANTS[0]; }
    else if (!Array.isArray(set)) set = set[wid] || set._;
    if (!set) return;
    const v = newVoice(X, 1 + (Math.random() * 2 - 1) * PITCH_SPREAD, delay);
    for (const L of set) { if (L[0] === 'n') noiseLayer(v, L, vr); else toneLayer(v, L, vr); }
    finish(v, level);
    lastAt[name] = now; recent.push(now);
  }
  function safeTrigger(name, wid, delay) { try { trigger(name, wid, delay); } catch (e) { /* fail silently */ } }

  /* ---------------- Wrappers ---------------- */
  function classify(o) {
    if (!o || typeof o !== 'object') return;
    if (o.piercing) { curCls = 'magic'; return; }
    if (o.ranged) { curCls = 'bow'; curWid = o.longbow ? 'longbows' : (o.from ? 'bolt' : weaponId('bow')); return; }
    if (o.from) { curCls = 'melee'; curWid = weaponId('melee'); }
  }
  function normalEnemy(e) {
    if (typeof BESTIARY === 'undefined' || !BESTIARY || !e) return false;
    const B = BESTIARY[e.k];
    return !!B && !B.boss && B.arch !== 'fixed';
  }

  /* strike(e, skill, dmg, o): note the class while the original runs, restore after (nesting safe). */
  const strike0 = window.strike;
  if (typeof strike0 === 'function' && !strike0.__ac88a) {
    window.strike = function (e, skill, baseDmg, o) {
      const pc = curCls, pw = curWid;
      curCls = null; curWid = null;
      try { classify(o); } catch (err) { curCls = null; curWid = null; }
      try { return strike0.apply(this, arguments); }
      finally { curCls = pc; curWid = pw; }
    };
    window.strike.__ac88a = true;
  }

  /* killEnemy(e): after the original runs, play the kill for the class noted by strike(). */
  const kill0 = window.killEnemy;
  if (typeof kill0 === 'function' && !kill0.__ac88a) {
    window.killEnemy = function (e) {
      let play = false;
      try { play = !!curCls && !!e && !e.dead && normalEnemy(e); } catch (err) { play = false; }
      const cls = curCls, wid = curWid;
      const r = kill0.apply(this, arguments);
      if (play) { try { if (e.dead) safeTrigger(KILL_NAME[cls], wid, KILL_DELAY_S); } catch (err) { /* silent */ } }
      return r;
    };
    window.killEnemy.__ac88a = true;
  }

  /* SFX.play: new names, plus 'hit' and 'block' when the variant is known; everything else falls through. */
  if (typeof SFX !== 'undefined' && SFX && typeof SFX.layer === 'function') {
    SFX.layer('ac88a', function (name, next) {
      try {
        if (!window.AUDIO_CLASSIC) {
          let n = null, wid = null;
          if (NAMES[name]) { n = name; wid = weaponId(NAMES[name].c); }
          else if (name === 'hit' && curCls) { n = HIT_NAME[curCls]; wid = curWid; }
          else if (name === 'block') { const g = gameG(); n = g ? BLOCK_NAME[g.absorbKind] : null; }
          if (n) { safeTrigger(n, wid, 0); return; }
        }
      } catch (err) { /* fall through to the original */ }
      return next();
    });
  }
})();
