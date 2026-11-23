/* ============================================================================
   INDEX 87 - AUDIO (from audits/audio.md; backlog J-19 and later)
   Loaded after the main game script in index.html. Wrap SFX / MUS functions
   or override their voices from here; never rewrite index.html.
   Each change: a short note here (what, why, old and new values) and a
   ROLLBACK line.

   Reach into the game: two tiny marked patches in index.html expose
   MUS._V (the voice table) and SFX._g() (the SFX audio context). Without
   them this file does nothing. Rolling the whole file back = delete the
   <script src="js/audio/synth.js"> line; the two patches are harmless.

   J-19 (first pass of mellow town audio)
   AUD-01  Camp/town melody: the plucked lute (Karplus-Strong string, one
           cached buffer per pitch) replaces the pipe. Old: V.pipe sine +
           octave triangle, vibrato, peak 0.36. New: peak 0.24, lowpass sweep
           3600 -> 900 Hz, body peak +5 dB at 230 Hz. The Full Tankard keeps
           its fiddle; its pipe doubling uses the mellow pipe.
           ROLLBACK: delete the "AUD-01" block (V.pipe / V.cut / V.lute).
   AUD-02  Pipes that still sound (battle whistle, party doubling): peak 0.36
           -> 0.24, lowpass 3400 -> 2100 Hz, attack 35 -> 70 ms, release
           90 -> 150 ms, 2nd harmonic 0.13 -> 0.06, vibrato 7 -> 4 cents and
           later, chiff 0.05 -> 0.02.   ROLLBACK: delete "AUD-02".
   AUD-05  Music bus: highshelf -2 dB at 6 kHz, small room reverb send
           (1.6 s, wet 0.14), compressor -14/-18 dB threshold -> -18, knee 12,
           ratio 4 -> 3, release 0.25 -> 0.3.   ROLLBACK: delete "AUD-05".
   AUD-06  Town drums: thump -> frame drum "dum" (sine 130 -> 68 Hz, 0.3 s),
           tick -> rim "tek" (sine 320 -> 220 Hz + 1.8 kHz noise), +-10 %
           velocity and +-3 % pitch variation. Contract drums are untouched.
           ROLLBACK: delete "AUD-06".
   AUD-07  Bard strum follows the audio clock (bar start times logged by a
           wrapper on each tune's camp.fn).   ROLLBACK: delete "AUD-07".
   AUD-10  SFX coin, pick, horn, nope, level, win rewritten softer, with
           small pitch variation.   ROLLBACK: delete "AUD-10".
   AUD-15  Rests between verses capped at 5.5 s; a quiet wind bed with the
           odd fire crackle fills a rest (not when the bard is "off").
           ROLLBACK: delete "AUD-15".
   AUD-16  "Soft sounds" setting (lowpass 3 kHz on effects, music shelf
           -5 dB), effects pause when the tab is hidden, a one-time
           "click for sound" hint.   ROLLBACK: delete "AUD-16".
============================================================================ */
(function(){
'use strict';
if (typeof MUS === 'undefined' || !MUS._V || typeof SFX === 'undefined' || !SFX._g) return;
const M = MUS._M, V = MUS._V;
const hz = MUS.hz;
const cfg = () => { try { return (typeof settings === 'function') ? settings() : {}; } catch (e) { return {}; } };
const jit = a => 1 + (Math.random() * 2 - 1) * a;
const camp = () => M.track === 'camp' || !!(window.AUDIO87 && window.AUDIO87.U && window.AUDIO87.U.active);   // J-20: the continuous theme keeps the town voices in a contract

/* ---- shared helpers ------------------------------------------------------ */
function nburst(ac, buf, dest, t, dur, vol, type, f, q){
  const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = buf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
const mnb = (t, dur, vol, type, f, q) => nburst(M.ac, M.noise, M.bus.g, t, dur, vol, type, f, q);

/* ---- AUD-01 the lute -------------------------------------------------------
   Karplus-Strong: a damped delay line, y[n] = .997 * .5 * (y[n-D] + y[n-D-1]), D = sr/f - .5,
   fractional delay by linear interpolation, seeded with softened noise. Rendered once per pitch. */
const ksCache = new Map();
function ksBuf(ac, f){
  const dur = f < 300 ? 1.8 : 1.3, key = Math.round(f * 10) + ':' + ac.sampleRate;
  let b = ksCache.get(key); if (b) return b;
  const sr = ac.sampleRate, N = Math.floor(sr * dur); b = ac.createBuffer(1, N, sr);
  const y = b.getChannelData(0), D = sr / f - .5, Di = Math.floor(D), fr = D - Di;
  let lp = 0; for (let i = 0; i < Di + 2; i++){ lp += ((Math.random() * 2 - 1) - lp) * .55; y[i] = lp; }
  for (let n = Di + 2; n < N; n++){
    const a = y[n - Di] * (1 - fr) + y[n - Di - 1] * fr, c = y[n - Di - 1] * (1 - fr) + y[n - Di - 2] * fr;
    y[n] = .997 * .5 * (a + c);
  }
  let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, Math.abs(y[i])); mx = mx || 1;
  for (let i = 0; i < N; i++) y[i] /= mx;
  ksCache.set(key, b); return b;
}
function lute(t, e, gain){
  const ac = M.ac, f = hz(e.m), life = Math.min(1.6, .7 + Math.max(.1, e.d || .3) * .9);
  const s = ac.createBufferSource(), lp = ac.createBiquadFilter(), body = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = ksBuf(ac, f); lp.type = 'lowpass'; lp.Q.value = .6; body.type = 'peaking'; body.frequency.value = 230; body.Q.value = 1.2; body.gain.value = 5;
  lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(900, t + .7);
  g.gain.setValueAtTime(.24 * e.v * (gain || 1), t); g.gain.setTargetAtTime(.0001, t + life * .55, life * .15);
  s.connect(lp); lp.connect(body); body.connect(g); g.connect(M.bus.g); s.start(t); s.stop(t + life + .5);
  mnb(t, .02, .02 * e.v, 'bandpass', Math.min(5000, f * 3), 1.4);                 // the finger
}
const luteMelody = (t, e) => {
  lute(t, e, 1);
  if ((e.d || 0) >= 1.5) lute(t + e.d / 2, {m:e.m, d:e.d / 2, v:e.v * .5}, 1);     // a long note is plucked again halfway
};

/* ---- AUD-02 the mellow pipe ------------------------------------------------- */
const pipe0 = V.pipe, cut0 = V.cut;
function mellowPipe(t, e){
  const ac = M.ac, f = hz(e.m), d = Math.max(.08, e.d), g = ac.createGain(), lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2100; lp.Q.value = .4;
  const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain();
  o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 2, t); g2.gain.value = .06;
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
  const pk = .24 * e.v, a = .07, hold = Math.max(a, d - .03), rel = .15;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, pk), t + a);
  g.gain.setValueAtTime(Math.max(.0002, pk), t + hold); g.gain.exponentialRampToValueAtTime(.0001, t + hold + rel);
  if (e.vib && d > .3){
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + .25); lg.gain.linearRampToValueAtTime(4, t + .25 + Math.min(.4, d * .6));
    l.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune); l.start(t); l.stop(t + d + rel + .1);
  }
  o1.start(t); o2.start(t); o1.stop(t + hold + rel + .05); o2.stop(t + hold + rel + .05);
  mnb(t, .05, .02 * e.v, 'bandpass', f * 3, 2.5);
}
V.pipe = function(t, e){
  if (camp() && M.song !== 'party') return luteMelody(t, e);                      // AUD-01: town melody on the lute
  return mellowPipe(t, e);                                                          // AUD-02
};
V.cut = function(t, e){
  if (camp() && M.song !== 'party') return lute(t, {m:e.m, d:.1, v:e.v * .35}, 1);
  return cut0(t, e);
};
V.lute = function(t, e){ lute(t, e, 1); };                                          // the Dust and Iron / March bard tunes

/* ---- AUD-06 frame drum and hand drum for the town ------------------------- */
const thump0 = V.thump, tick0 = V.tick;
V.thump = function(t, e){
  if (!camp()) return thump0(t, e);
  const ac = M.ac, v = e.v * jit(.1), o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130 * jit(.03), t); o.frequency.exponentialRampToValueAtTime(68, t + .14);
  o.connect(g); g.connect(M.bus.g); g.gain.setValueAtTime(.42 * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); o.start(t); o.stop(t + .32);
  mnb(t, .05, .08 * v, 'lowpass', 700, .7);
};
V.tick = function(t, e){
  if (!camp()) return tick0(t, e);
  const ac = M.ac, v = e.v * jit(.1), o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(320 * jit(.03), t); o.frequency.exponentialRampToValueAtTime(220, t + .05);
  o.connect(g); g.connect(M.bus.g); g.gain.setValueAtTime(.16 * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07); o.start(t); o.stop(t + .09);
  mnb(t, .045, .09 * v, 'bandpass', 1800, 1.1);
};

/* ---- AUD-07 the bard strums on the audio clock ----------------------------- */
const barLog = [];
for (const id in MUS.SONGS){
  const c = MUS.SONGS[id].camp, f = c.fn;
  c.fn = function(bi, variant){
    const r = f(bi, variant);
    barLog.push({t:M.nextT, len:r.len * (M.pk || 1)}); if (barLog.length > 8) barLog.shift();   // M.nextT is this bar's start while it is being scheduled
    return r;
  };
}
const bardFrame0 = window.bardFrame;
if (typeof bardFrame0 === 'function') window.bardFrame = function(){
  if (!MUS.playing()) return 2;
  const now = M.ac.currentTime; let cur = null;
  for (const b of barLog) if (b.t <= now) cur = b;
  if (!cur || now - cur.t > cur.len * 1.5) return bardFrame0();
  return Math.floor((now - cur.t) / Math.max(.05, MUS.beat())) % 2;                // MUS.beat() already includes the pass tempo
};

/* ---- AUD-05 mix chain on the music bus ------------------------------------- */
let shelf = null;
function installMix(){
  const ac = M.ac; if (!ac || shelf || !M.comp || !M.out) return;
  const c = M.comp; c.disconnect();
  c.threshold.value = -18; c.knee.value = 12; c.ratio.value = 3; c.release.value = .3;
  shelf = ac.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 6000; shelf.gain.value = -2;
  c.connect(shelf); shelf.connect(M.out);
  const len = Math.floor(ac.sampleRate * 1.6), imp = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const a = imp.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++){ lp += ((Math.random() * 2 - 1) - lp) * .35; a[i] = lp * Math.pow(1 - i / len, 3.2); } }
  const conv = ac.createConvolver(), wet = ac.createGain(); conv.buffer = imp; wet.gain.value = .14;
  shelf.connect(conv); conv.connect(wet); wet.connect(M.out);
}

/* ---- AUD-10 softer, varied sound effects ------------------------------------ */
const SOFT = {};
let sfxLP = null;
const sfxLast = {}, SGAP = {coin:40, pick:25, horn:120, nope:60, level:150, win:150};
function sfxPing(X, f, dur, peak, delay, type, lpHz){
  const t = X.ac.currentTime + (delay || 0), o = X.ac.createOscillator(), g = X.ac.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); if (lpHz){ const l = X.ac.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lpHz; g.connect(l); l.connect(X.master); } else g.connect(X.master);
  o.start(t); o.stop(t + dur + .02);
}
SOFT.coin = X => { const f = [784, 988, 1175][Math.random() * 3 | 0] * jit(.03); sfxPing(X, f, .28, .08); sfxPing(X, f * 2.76, .12, .025); };
SOFT.pick = X => {
  const t = X.ac.currentTime, f = 420 * jit(.06), o = X.ac.createOscillator(), g = X.ac.createGain(), lp = X.ac.createBiquadFilter();
  o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .8, t + .05); lp.type = 'lowpass'; lp.frequency.value = 1800;
  o.connect(g); g.connect(lp); lp.connect(X.master); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .07); o.start(t); o.stop(t + .09);
  nburst(X.ac, X.noiseBuf, X.master, t, .02, .03, 'bandpass', 2200, 1.2);
};
SOFT.horn = X => {
  const t = X.ac.currentTime;
  [110, 164.8, 220].forEach((f, i) => {
    const o = X.ac.createOscillator(), g = X.ac.createGain(), lp = X.ac.createBiquadFilter(), pk = .07 / (1 + i * .4);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); lp.type = 'lowpass'; lp.Q.value = .8;
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(900, t + .18); lp.frequency.linearRampToValueAtTime(500, t + .7);
    o.connect(lp); lp.connect(g); g.connect(X.master);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + .1); g.gain.setValueAtTime(pk, t + .4); g.gain.exponentialRampToValueAtTime(.0001, t + .85);
    o.start(t); o.stop(t + .9);
  });
};
SOFT.nope = X => {
  const t = X.ac.currentTime, o = X.ac.createOscillator(), g = X.ac.createGain(), lp = X.ac.createBiquadFilter();
  o.type = 'sine'; o.frequency.setValueAtTime(150 * jit(.03), t); o.frequency.exponentialRampToValueAtTime(110, t + .12); lp.type = 'lowpass'; lp.frequency.value = 700;
  o.connect(g); g.connect(lp); lp.connect(X.master); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .12); o.start(t); o.stop(t + .14);
};
SOFT.level = X => { const k = jit(.01); [523, 659, 784, 1046].forEach((f, i) => { sfxPing(X, f * k, .4, .1, i * .09); sfxPing(X, f * k * 2, .2, .02, i * .09); }); };
SOFT.win = X => { const k = jit(.01), n = [392, 523, 659, 784, 1046]; n.forEach((f, i) => { const last = i === n.length - 1; sfxPing(X, f * k, last ? .7 : .3, .11, i * .1); sfxPing(X, f * k * 2, last ? .35 : .15, .02, i * .1); }); };
/* INT-1 step 3: SFX.play is one function over a list of layers (it was a chain of 11 wrappers in 4 files).
   SFX.layer(tag, fn) adds a layer once; fn(name, next) plays the sound itself and returns, or calls next()
   to pass the name down. The last layer added runs first, as the outermost wrapper did. SFX.layers() lists the tags. */
const SFX_BASE = SFX.play, LAYERS = [];
SFX.layer = function(tag, fn){ if (LAYERS.some(l => l.tag === tag)) return false; LAYERS.push({tag, fn}); return true; };
SFX.layers = () => LAYERS.map(l => l.tag);
SFX.play = function(name){
  const self = this, args = arguments; let i = LAYERS.length;
  const next = function(){ return --i < 0 ? SFX_BASE.apply(self, args) : LAYERS[i].fn.call(self, name, next); };
  return next();
};
SFX.layer('soft', function(name, next){
  const fn = SOFT[name];
  if (!fn) return next();
  try {
    const X = SFX._g(); if (!X.ac || !cfg().volume || cfg().volume <= 0) return;
    const now = performance.now(); if (now - (sfxLast[name] || 0) < SGAP[name]) return; sfxLast[name] = now;
    fn(X);
  } catch (e) {}
});

/* ---- AUD-15 gentler rests between verses and a wind bed ---------------------- */
let amb = null, seenRest = -1, crackleT = 0;
function crackle(){
  crackleT = 0;
  if (!amb || !camp() || M.bus) return;
  try { const t = M.ac.currentTime + .01; nburst(M.ac, M.noise, amb.g, t, .02, (.05 + Math.random() * .1), 'bandpass', 1200 + Math.random() * 2000, 1.5); } catch (e) {}
  crackleT = setTimeout(crackle, 400 + Math.random() * 2600);
}
function ambience(){
  const ac = M.ac; if (!ac) return;
  const resting = camp() && !M.bus && M.song !== 'off' && isFinite(M.restartAt) && MUS.vol() > .005;
  if (resting && !amb){
    const s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = M.noise; s.loop = true; lp.type = 'lowpass'; lp.frequency.value = 280; lp.Q.value = .3; g.gain.value = .0001;
    s.connect(lp); lp.connect(g); g.connect(M.out); s.start();
    amb = {s, g}; crackleT = setTimeout(crackle, 900);
  }
  if (amb){
    amb.g.gain.setTargetAtTime(resting ? .15 : .0001, ac.currentTime, resting ? 1.2 : .6);
    if (!resting && amb.g.gain.value < .002){ try { amb.s.stop(); amb.g.disconnect(); } catch (e) {} clearTimeout(crackleT); amb = null; }
  }
}
function capRest(){
  if (!camp() || M.bus || !isFinite(M.restartAt) || M.restartAt === seenRest) return;
  M.restartAt = Math.min(M.restartAt, M.nextT + 2.4 + 5.5); seenRest = M.restartAt;
}

/* ---- AUD-16 soft sounds, hidden tab, first-click hint ------------------------ */
/* the Soft sounds box is in the settings wrapper with the Effects slider (sliders, below) */
function installSfxChain(){
  const X = SFX._g(); if (!X.ac || !X.master || sfxLP) return;
  sfxLP = X.ac.createBiquadFilter(); sfxLP.type = 'lowpass'; sfxLP.frequency.value = 20000; sfxLP.Q.value = .5;
  X.master.disconnect(); X.master.connect(sfxLP); sfxLP.connect((window.AUDIO87 && window.AUDIO87.sfxIn) || X.ac.destination);   /* J-21: sfxIn exists when the shared context is on */
}
document.addEventListener('visibilitychange', () => {
  const X = SFX._g(); if (!X.ac) return;
  try { if (document.hidden) X.ac.suspend(); else X.ac.resume(); } catch (e) {}
});
let hint = null;
function showHint(){
  const c = cfg(); if (M.ac || c.volume === 0 || c.music === 0 || (typeof MUS !== 'undefined' && MUS.disabled)) return;
  hint = document.createElement('div'); hint.id = 'aud-hint';
  hint.textContent = 'Click anywhere to turn the sound on';
  hint.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);background:rgba(20,16,10,.8);color:#e8d8b0;font:14px Georgia,serif;padding:6px 14px;border-radius:14px;z-index:9999;pointer-events:none;transition:opacity .5s';
  document.body.appendChild(hint);
  const gone = () => { if (!hint) return; hint.style.opacity = 0; const h = hint; hint = null; setTimeout(() => h.remove(), 600); };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, gone, {once:true});
  setTimeout(gone, 9000);
}
setTimeout(showHint, 1200);

/* ---- one light poll for everything that needs the audio context ---------------- */
setInterval(() => {
  try {
    /* F-42: if the effects context never came up (unlock threw, or it was made before the shared one), try again once music is running */
    { const X0 = SFX._g(); if (!X0.ac && M.ac && !document.hidden) { try { SFX.unlock(); } catch (e) {} } else if (X0.ac && X0.ac.state === 'suspended' && !document.hidden) { try { X0.ac.resume(); } catch (e) {} } }
    installSfxChain(); installMix();
    const soft = !!cfg().softSound;
    if (sfxLP) sfxLP.frequency.setTargetAtTime(soft ? 3000 : 20000, sfxLP.context.currentTime, .1);
    if (shelf) shelf.gain.setTargetAtTime(soft ? -5 : -2, shelf.context.currentTime, .1);
    if (M.ac){ capRest(); ambience(); }
  } catch (e) {}
}, 250);

window.AUDIO87 = {barLog, ksCache, amb:() => amb, ksBuf, nburst, jit};
})();

/* ============================================================================
   INDEX 87b - ONE CONTINUOUS THEME (J-20; AUD-03 + AUD-04)
   Before: a contract faded the camp tune out and started a different arrangement of
   it (the "combat" tune) at bar 0, at its own fixed tempo. After: the tune the
   bard is playing KEEPS PLAYING when a contract starts. One transport (bus, bar
   counter and clock) runs camp -> contract -> camp:
     level 0 (nobody near)   the camp arrangement as it is: lute melody and soft frame drum
     level 1 (contact)       + bass, and the combat drum part played softly on hand drums
     level 2 (boss, crowd,   + the full combat drums (kick, snare, hats, taiko), bass and
              Leader hurt)     the synth lead
   Layers change only on bar lines. The combat material (the notes) is the same
   data as before; it is stretched onto the camp tune's bar so both sit in one key
   and one tempo grid. Tempo: each bar eases toward a target (time constant 2.5 s,
   ramped inside the bar, so it never jumps) that follows Game speed, slow-mo,
   a pause for the Momentum choice, the fight level and the Momentum rank, in
   a range of 0.7x-1.35x of the camp tempo. Camp stays at its own tempo; the climb is
   only in contracts. When the contract ends the layers drop at once and the tempo
   eases back down before the camp scheduler takes over again.
   FALLBACKS (the old behaviour, exactly, for that contract): the bard is resting
   between verses or set to Off, the music is muted, or the song has no combat part.
   KILL SWITCH: set window.AUDIO_CLASSIC = true (before the page loads, or in the console
   and then start a new contract) to restore the old switching.
   ROLLBACK: delete this whole block (from "INDEX 87b" to "END INDEX 87b").
============================================================================ */
(function(){
'use strict';
if (typeof MUS === 'undefined' || !MUS._V || !window.AUDIO87) return;
const M = MUS._M, V = MUS._V, SONGS = MUS.SONGS, A87 = window.AUDIO87;
const SCALE_D = {pipe:1, fiddle:1, lead:1, bass:1, pad:1, lute:1};
const TAU = 4, RANGE = [0.75, 1.3];                                                   // PL-3.1: was TAU 2.5, RANGE 0.7-1.35
/* PL-3.1: the fight level moves slowly. Up: the raw level must stay higher for UP_HOLD s, and one step
   per UP_MIN s. Down: it must stay lower for DOWN_HOLD s, one step per DOWN_MIN s. Before: up at once,
   down after 5 s, so enemies drifting in and out of the 420 px ring changed layers every 5-10 s. */
const UP_HOLD = 1.5, UP_MIN = 6, DOWN_HOLD = 12, DOWN_MIN = 8, FADE_BARS = 2, FADE_FROM = 0.35;
const LV = {up:-1, dn:-1, chg:-1e9, bar:-99};
function stepLevel(raw, now){
  if (raw > M.level){
    LV.dn = -1; if (LV.up < 0) LV.up = now;
    if (now - LV.up >= UP_HOLD && now - LV.chg >= UP_MIN){ M.level++; LV.chg = now; LV.up = -1; LV.bar = U.seq; }
  } else if (raw < M.level){
    LV.up = -1; if (LV.dn < 0) LV.dn = now;
    if (now - LV.dn >= DOWN_HOLD && now - LV.chg >= DOWN_MIN){ M.level = Math.max(raw, M.level - 1); LV.chg = now; LV.dn = -1; }
  } else { LV.up = LV.dn = -1; }
  return M.level;
}
const layerGain = () => Math.min(1, FADE_FROM + (1 - FADE_FROM) * (U.seq - LV.bar) / FADE_BARS);   // new layers fade in over FADE_BARS bars
const U = {active:false, decay:false, pk0:1, k:1, seq:0};
const log = A87.log = [];
A87.U = U;
const clamp = (a, b, x) => Math.max(a, Math.min(b, x));
const gOK = () => (typeof G !== 'undefined' && G) ? G : null;

function targetM(){
  if (U.decay) return 1;
  const g = gOK(); let ts = (typeof gameSpeed === 'function') ? gameSpeed() : 1;
  if (g){
    if (g.slowmo > 0) ts *= 0.85;
    if (g.momChoice && !g.momHidden) ts *= 0.88;
    if (g.paused) ts *= 0.85;
  }
  const rank = g ? Math.min(0.04, 0.005 * (g.lvl || 0)) : 0;
  const raid = (g && g.raidT !== undefined) ? 1.08 : 1;                                 // J-22: a raid is urgent and personal
  return clamp(RANGE[0], RANGE[1], (1.10 + 0.04 * M.level + rank) * ts * raid);
}

const L1 = {kick:['thump', .7], snare:['tick', .9], hat:['hat', .45], bass:['bass', .8]};
const L2 = {kick:1, snare:1, hat:1, taiko:1, bass:1, lead:.5};
function layerEvents(S, bi, lvl, ratio){
  const fg = layerGain(), cb = S.combat.fn(bi, lvl, M.variant), out = [], lg = clamp(0.8, 1.6, 1 / (S.camp.trim || 1));
  for (const e of cb.ev){
    let k = e.k, v;
    if (lvl === 1){ const m = L1[k]; if (!m) continue; k = m[0]; v = e.v * m[1] * 0.6 * lg; }
    else { if (!(k in L2)) continue; v = e.v * L2[k] * 0.8 * lg; if (k === 'lead') k = 'pipe'; }     // PL-3.1: the synth lead is the town pipe, same family as the tune
    v *= fg;
    out.push({t:e.t * ratio, k, m:e.m, d:e.d === undefined ? undefined : e.d * ratio, v});
  }
  return {ev:out, len:cb.len};
}

// Returns false when it handed the transport back to the camp scheduler.
function scheduleBar(){
  const S = SONGS[M.song], C = S.camp, bi = M.bar % C.bars, t0 = M.nextT, k0 = U.k;
  if (U.decay && Math.abs(k0 / U.pk0 - 1) < 0.03){                                   // tempo is home: give the transport back
    U.active = false; U.decay = false; M.pk = k0; M.bar = M.bar % C.bars; M.level = 0; return false;
  }
  const lvl = U.decay ? 0 : M.level;
  const cbar = C.fn(bi, M.variant), len = cbar.len;                                  // len in base seconds (k = 1)
  let ev = cbar.ev;
  if (lvl >= 1){
    const lay = layerEvents(S, bi, lvl, len / (S.combat.len || len));
    ev = ev.filter(e => e.k !== 'thump' && e.k !== 'tick').concat(lay.ev);
  }
  const target = U.pk0 / targetM(), realGuess = len * k0;
  const k1 = k0 + (target - k0) * (1 - Math.exp(-realGuess / TAU)), kAvg = (k0 + k1) / 2, realLen = len * kAvg;
  const warp = u => k0 * u + (k1 - k0) * u * u / (2 * len);                          // base time -> real time with a steady ramp of the tempo
  for (const e of ev){
    const kl = k0 + (k1 - k0) * (e.t / len), x = (SCALE_D[e.k] && e.d !== undefined) ? Object.assign({}, e, {d:e.d * kl}) : e;
    try { V[e.k](t0 + warp(e.t), x); } catch (er) {}
  }
  if (!U.decay){ (M.barQ || (M.barQ = [])).push({t:t0, len:realLen, song:M.song, id:M.barSeq = (M.barSeq || 0) + 1}); if (M.barQ.length > 6) M.barQ.shift(); }
  if (log.length > 300) log.shift();
  log.push({bar:++U.seq, mbar:M.bar, t:+t0.toFixed(2), len:+realLen.toFixed(2), k0:+k0.toFixed(3), k1:+k1.toFixed(3), lvl, decay:U.decay, song:M.song});
  U.k = k1; M.pk = k1; M.nextT += realLen; M.bar++;
  return true;
}

function unifiedTick(){
  const ac = M.ac; if (!ac) return;
  const hidden = typeof document !== 'undefined' && document.hidden;
  if (hidden && ac.state === 'running'){ try { ac.suspend(); } catch (e) {} return; }
  if (!hidden && ac.state === 'suspended'){ try { ac.resume(); } catch (e) {} }
  if (ac.state !== 'running') return;
  const g = gOK(), v = MUS.vol(), paused = (g && g.paused && !g.over) ? 0.35 : 1, now = ac.currentTime;
  M.out.gain.setTargetAtTime(v * paused * 0.5, now, 0.12);
  if (v < 0.005){ M.silent = true; return; }
  if (M.silent){ M.silent = false; M.nextT = Math.max(M.nextT, now + 0.05); }
  const want = MUS.wantTrack();
  if (want === 'camp' && !U.decay){ U.decay = true; M.track = 'camp'; M.level = 0; }       // contract over: layers leave on the next bar line
  else if (want === 'fight' && U.decay){ U.decay = false; M.track = 'fight'; M.fsong = M.song; M.lastUp = now; }
  if (!U.decay){
    stepLevel(MUS.fightLevel(), now);                                             // PL-3.1
  }
  if (M.nextT < now - 0.4) M.nextT = now + 0.05;
  let guard = 0;
  while (U.active && M.bus && M.nextT < now + 0.7 && guard++ < 6){ if (!scheduleBar()) break; }
}

function canUnify(){
  const ac = M.ac, S = SONGS[M.song];
  return !!(ac && ac.state === 'running' && M.track === 'camp' && M.bus && M.song !== 'off' && S && S.combat && S.combat.fn && S.camp.fn && MUS.vol() > 0.005 && !(typeof document !== 'undefined' && document.hidden));
}
function enterUnified(){
  const now = M.ac.currentTime;
  Object.assign(U, {active:true, decay:false, pk0:M.pk || 1, k:M.pk || 1});
  M.track = 'fight'; M.fsong = M.song; M.lastFight = M.song; M.level = 0; M.lastUp = now; M.barQ = []; M.noteQ.length = 0;
  LV.up = LV.dn = -1; LV.chg = now - UP_MIN; LV.bar = -99;
  log.push({event:'enter', song:M.song, mbar:M.bar, t:+now.toFixed(2)});
}
function abortUnified(){                                                          // kill switch flipped on mid-contract
  if (!U.active) return;
  U.active = false; U.decay = false; M.track = 'camp'; M.pk = U.pk0;                // the old tick then switches to its own fight track
}

function tick87(){
  if (window.AUDIO_CLASSIC){ if (U.active) abortUnified(); return MUS.tick(); }
  if (U.active) return unifiedTick();
  if (MUS.wantTrack() === 'fight' && canUnify()){ enterUnified(); return unifiedTick(); }
  return MUS.tick();
}

// Take over the 120 ms music timer once the music engine has started (after the first click).
let taken = null;
function takeOver(){
  if (M.timer && M.timer !== taken){ clearInterval(M.timer); taken = M.timer = setInterval(() => { try { tick87(); } catch (e) {} }, 120); }
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, () => { if (M.ac && !window.AUDIO_CLASSIC) takeOver(); });   // registered after the engine's own start()
setInterval(() => { if (M.ac && M.timer && !window.AUDIO_CLASSIC && !taken) takeOver(); }, 250);

A87.tick87 = tick87; A87.targetM = targetM; A87.stepLevel = stepLevel; A87.LV = LV; A87.TUNE = {TAU, RANGE, UP_HOLD, UP_MIN, DOWN_HOLD, DOWN_MIN};
})();
/* ===== END INDEX 87b ====================================================== */

/* ============================================================================
   INDEX 87c - AUDIO PLUMBING (J-21; AUD-08, 09, 12, 13)
   ONE AudioContext. The game made two (SFX and MUS) and a third for the whistle. This
   replaces window.AudioContext, before the first click, with a function that always
   returns one shared context, whose `destination` is steered by who asks:
       music master (M.out)  -> musicIn (the DUCK gain) -> mood (title quieting) -\
       effects master        -> sfxIn (the EFFECTS slider) -----------------------+-> soft limiter -> speakers
   (a gain node created at 0.0001 is the music master; anything else is an effect).
   DUCKING: important effects dip the music by -3 to -6 dB: 30 ms attack, 120 ms hold,
   about 500 ms release. Leader hurt (-3, at most once a second), level-up, horn,
   boss, boss death, win and defeat (-5/-6). Never hits, coins or picks.
   SLIDERS: Settings has Volume (master), Music (existing) and a new Effects slider
   (settings().sfx, 0-100, default 100; older saves simply lack the key).
   CLEANUP: a voice cap (hats, ticks, grace notes and claps are skipped while more than
   44 voices are in flight), and the boss-death noise now loops (it was cut at 0.5 s).
   KILL SWITCH: window.AUDIO_CLASSIC = true BEFORE the page loads leaves the three
   separate contexts, no ducking and no Effects slider (J-20's live switch still works).
   ROLLBACK: delete this block, and the "J-21" mentions in the first block (sfxIn).
============================================================================ */
(function(){
'use strict';
const A = window.AUDIO87;
if (!A || window.AUDIO_CLASSIC || typeof MUS === 'undefined' || !MUS._V) return;
const Real = window.AudioContext || window.webkitAudioContext; if (!Real) return;
const M = MUS._M, V = MUS._V;
const cfg = () => { try { return settings(); } catch (e) { return {}; } };
let shared = null, lastGain = null;
function build(ctx){
  /* F-42: find the native destination getter on whatever prototype holds it (Firefox keeps it on a different one
     than Chrome; a throw here left the first caller, SFX.unlock, with no context: no effects, flat music). */
  let realDest = null;
  for (let o = Object.getPrototypeOf(ctx); o && !realDest; o = Object.getPrototypeOf(o)) { const d = Object.getOwnPropertyDescriptor(o, 'destination'); if (d && d.get) realDest = d.get.call(ctx); }
  if (!realDest) realDest = ctx.destination;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 12; lim.attack.value = .002; lim.release.value = .12; lim.connect(realDest);
  const musicIn = ctx.createGain(), mood = ctx.createGain(), sfxIn = ctx.createGain();
  musicIn.connect(mood); mood.connect(lim); sfxIn.connect(lim);
  A.musicIn = musicIn; A.mood = mood; A.sfxIn = sfxIn; A.limiter = lim; A.shared = ctx;
  const cg = ctx.createGain.bind(ctx);
  ctx.createGain = function(){ const g = cg(); lastGain = g; return g; };
  Object.defineProperty(ctx, 'destination', {configurable:true, get(){ return (lastGain && lastGain.gain.value < .01) ? musicIn : sfxIn; }});
}
function Shared(){ if (!shared){ const c = new Real(); try { build(c); } catch (e) { console.warn('AUDIO87 build', e); A.buildErr = String(e); } shared = c; } return shared; }
window.AudioContext = Shared; window.webkitAudioContext = Shared;

/* ---- ducking ------------------------------------------------------------------ */
A.duck = function(db, hold){
  if (A.skipDuck) return;   // INT-1 step 3: the B2 + B3 guard below, folded in (A.skipDuck is set only by that block's SFX wrapper)
  const ctx = shared; if (!ctx || !A.musicIn) return;
  const t = ctx.currentTime, g = A.musicIn.gain, lin = Math.pow(10, -db / 20), h = hold === undefined ? .12 : hold;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(lin, t + .03);
  g.setValueAtTime(lin, t + .03 + h); g.setTargetAtTime(1, t + .03 + h, .17);
};
const DUCK = {hurt:[3, 1000], level:[5, 600], horn:[5, 600], boss:[6, 600], bossdie:[6, 600], win:[5, 600], down:[6, 600]};
const duckLast = {};
SFX.layer('duck', function(name, next){
  const d = DUCK[name];
  if (d && shared && cfg().volume > 0 && cfg().sfx !== 0){
    const now = performance.now(); if (now - (duckLast[name] || 0) > d[1]){ duckLast[name] = now; try { A.duck(d[0]); } catch (e) {} }
  }
  return next();
});

/* ---- the boss-death rumble: the original noise buffer is 0.5 s and not looped, so 0.8 s was cut ------ */
{ const S = {};
  S.bossdie = X => {
    const t = X.ac.currentTime;
    A.nburst(X.ac, X.noiseBuf, X.master, t, .8, .3, 'bandpass', 120, .4);
    [392, 330, 262, 196].forEach((f, i) => {
      const o = X.ac.createOscillator(), g = X.ac.createGain(), lp = X.ac.createBiquadFilter(), tt = t + i * .12;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * .9, tt + .3); lp.type = 'lowpass'; lp.frequency.value = 1100;
      o.connect(lp); lp.connect(g); g.connect(X.master); g.gain.setValueAtTime(.0001, tt); g.gain.exponentialRampToValueAtTime(.1, tt + .01); g.gain.exponentialRampToValueAtTime(.0001, tt + .3); o.start(tt); o.stop(tt + .32);
    });
  };
  let last = 0;
  SFX.layer('bossdie', function(name, next){
    if (name !== 'bossdie') return next();
    try { const X = SFX._g(); if (!X.ac || !cfg().volume) return; const n = performance.now(); if (n - last < 400) return; last = n; S.bossdie(X); } catch (e) {}
  });
}

/* ---- voice cap (AUD-13) -------------------------------------------------------- */
{ const ends = [], LOW = {hat:1, tick:1, cut:1, clap:1};
  for (const k of Object.keys(V)){
    const f = V[k]; if (typeof f !== 'function') continue;
    V[k] = function(t, e){
      const now = M.ac ? M.ac.currentTime : 0;
      while (ends.length && ends[0] < now) ends.shift();
      if (ends.length > 44 && LOW[k]) return;
      const end = t + (e && e.d ? e.d : .3) + .5; let i = ends.length; while (i > 0 && ends[i - 1] > end) i--; ends.splice(i, 0, end);
      return f.apply(this, arguments);
    };
  }
  A.voices = () => ends.length;
}

/* ---- sliders -------------------------------------------------------------------- */
{ const f = window.settingsHTML;
  if (typeof f === 'function') window.settingsHTML = function(dark){
    const s = f(dark), v = cfg().sfx === undefined ? 100 : cfg().sfx, on = !!cfg().softSound;
    const ctl = `<label title="Rounds off bright, high sounds (effects and music)."><input type="checkbox" ${on ? 'checked' : ''} onchange="setSetting('softSound', this.checked)"> Soft sounds</label>`
      + `<label title="How loud the sound effects are. Volume is the master.">Effects <input type="range" min="0" max="100" value="${v}" oninput="setSetting('sfx', +this.value)"></label>`;
    const i = s.lastIndexOf('</div>');
    return i < 0 ? s + ctl : s.slice(0, i) + ctl + s.slice(i);
  };
  const ss = window.setSetting;
  if (typeof ss === 'function') window.setSetting = function(k, v){ const r = ss.apply(this, arguments); if (k === 'sfx'){ try { SFX.unlock(); SFX.play('pick'); } catch (e) {} } return r; };
}
setInterval(() => {
  try { if (A.sfxIn && shared){ const v = cfg().sfx === undefined ? 100 : cfg().sfx; A.sfxIn.gain.setTargetAtTime(Math.max(0, Math.min(1, v / 100)), shared.currentTime, .05); } } catch (e) {}
}, 250);
})();
/* ===== END INDEX 87c ====================================================== */

/* ============================================================================
   INDEX 87d - CONTEXTS AND FEEDBACK SOUNDS (J-22; AUD-11, 14)
   TITLE SCREEN   the camp theme as a solo lute (melody only: no drums, bass or arpeggio),
                  about 15 % slower and 40 % quieter. Back to normal when the title closes.
   PROLOGUE       the town is the camp tune; its sorties, assaults and nights are contracts,
                  so they build from it exactly as in J-20 (checked, no extra code).
   DEBRIEF        when a contract ends, the win/defeat/withdrawal fanfare is replaced by a
                  short lute stinger on the music: victory = a gentle rising cadence
                  (A4 C5 E5 A5), withdrawal = three notes, defeat or flight = a low, sparse
                  pair (A2, E2). The camp theme simply carries on underneath.
   RAID           from the camp tune, then the contract layers at 1.08 x the usual tempo
                  (in targetM, block 87b).
   BAR FIGHT      unchanged (Index 41, barNow); it now shares the context and the ducking.
   NEW SOUNDS (all quiet, none on frequent events; call sites in audits/audio.md):
     build       a wood knock, twice, when a building is started (startBuild)
     demolish    a low crumble when a building is taken down (doDemolish)
     pause       a soft low "tock" going into the pause menu, a higher one coming out (togglePause)
     low health  a faint heartbeat every 1.4 s while the Leader is at a third of Con or less
     luck        a soft rising ping when Momentum gives +1 Luck (momentum)
   ROLLBACK: delete this block. KILL SWITCH: window.AUDIO_CLASSIC = true skips the
   feedback sounds' music side (the title quieting and the stinger) before page load.
============================================================================ */
(function(){
'use strict';
const A = window.AUDIO87;
if (!A || typeof MUS === 'undefined' || !MUS._V) return;
const M = MUS._M, SONGS = MUS.SONGS;
const cfg = () => { try { return settings(); } catch (e) { return {}; } };
const gOK = () => (typeof G !== 'undefined' && G) ? G : null;
const classic = () => !!window.AUDIO_CLASSIC;

/* ---- title screen: solo lute --------------------------------------------------- */
const T = {on:false, base:1};
const titleOpen = () => { const el = document.getElementById('screen-title'); return !!(el && !el.classList.contains('hidden')); };
for (const id in SONGS){
  const c = SONGS[id].camp, f = c.fn;
  c.fn = function(bi, variant){
    const r = f(bi, variant);
    if (!T.want || classic()) return r;
    return {len:r.len, ev:r.ev.filter(e => e.k === 'pipe' || e.k === 'cut' || e.k === 'lute' || e.k === 'fiddle')};
  };
}
function titleStep(){
  if (classic()){ if (T.on){ T.on = false; if (A.mood) A.mood.gain.value = 1; } return; }
  const want = titleOpen() && M.track === 'camp' && !(A.U && A.U.active);
  T.want = want;
  if (want && !T.on){ T.on = true; T.base = M.pk || 1; }
  if (T.on && !want && (M.track !== 'camp' || (A.U && A.U.active))) T.on = false;     // a contract began: nothing to ease back
  if (T.on){
    if (!want && Math.abs((M.pk || 1) - T.base) < .01){ M.pk = T.base; T.on = false; }
    else if (M.track === 'camp' && !(A.U && A.U.active)){ const target = want ? T.base * 1.15 : T.base; M.pk = (M.pk || 1) + (target - (M.pk || 1)) * .2; }
  }
  if (A.mood && A.shared) A.mood.gain.setTargetAtTime(want ? .6 : 1, A.shared.currentTime, .6);
}

/* ---- debrief stinger ----------------------------------------------------------- */
function stinger(kind){
  const ac = M.ac; if (!ac || !MUS.vol() || ac.state !== 'running') return;
  const dest = A.musicIn || M.out, t0 = ac.currentTime + .05;
  const notes = kind === 'victory' ? [[69, 0, .2], [72, .16, .2], [76, .32, .2], [81, .5, .26]]
              : kind === 'withdrawn' ? [[69, 0, .2], [72, .2, .2], [69, .45, .2]]
              : [[45, 0, .34], [40, .6, .3]];
  for (const [m, dt, v] of notes){
    const f = MUS.hz(m), s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain(), t = t0 + dt;
    s.buffer = A.ksBuf(ac, f); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(800, t + .8);
    g.gain.setValueAtTime(v * MUS.vol() * 1.2, t); g.gain.setTargetAtTime(.0001, t + .5, .35);
    s.connect(lp); lp.connect(g); g.connect(dest); s.start(t); s.stop(t + 1.8);
  }
  A.duck && A.duck(3, .6);
}
{
  SFX.layer('stinger', function(name, next){
    if (!classic() && !A.noStinger && !MUS.disabled && MUS.vol() > 0 && (name === 'win' || name === 'down' || name === 'level')){   /* 87e: noStinger set for repeats; R1: keep SFX when music is disabled */
      const g = gOK();
      if (g && g.over){
        const res = g.result || (name === 'win' ? 'victory' : 'fallen');
        try { stinger(res === 'victory' ? 'victory' : res === 'withdrawn' ? 'withdrawn' : 'defeat'); } catch (e) {}
        return;
      }
    }
    return next();
  });
}

/* ---- new feedback sounds ----------------------------------------------------------- */
const jit = A.jit;
function sfxTone(X, f, f2, dur, peak, delay){
  const t = X.ac.currentTime + (delay || 0), o = X.ac.createOscillator(), g = X.ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(X.master); o.start(t); o.stop(t + dur + .02);
}
const NEWSFX = {
  build(X){ for (const d of [0, .11]){ sfxTone(X, 170 * jit(.04), 130, .06, .07, d); A.nburst(X.ac, X.noiseBuf, X.master, X.ac.currentTime + d, .04, .08, 'lowpass', 600, .7); } },
  demolish(X){ sfxTone(X, 90, 50, .28, .1); A.nburst(X.ac, X.noiseBuf, X.master, X.ac.currentTime, .26, .1, 'bandpass', 300, .6); },
  pausein(X){ sfxTone(X, 200, 150, .06, .06); },
  pauseout(X){ sfxTone(X, 260, 330, .06, .05); },
  heart(X){ sfxTone(X, 62, 45, .12, .09); sfxTone(X, 58, 42, .12, .06, .22); },
  luck(X){ sfxTone(X, 660, 0, .22, .045); sfxTone(X, 990, 0, .16, .02, .06); }
};
function fx(name){ try { if (classic() || !cfg().volume) return; const X = SFX._g(); if (X.ac) NEWSFX[name](X); } catch (e) {} }
A.fx = fx;
{ const f = window.startBuild;
  if (typeof f === 'function') window.startBuild = function(){ const before = META && META.treasury; const r = f.apply(this, arguments); if (META && META.treasury < before) fx('build'); return r; };
}
{ const f = window.doDemolish;
  if (typeof f === 'function') window.doDemolish = function(id){ const had = typeof has === 'function' && has(id); const r = f.apply(this, arguments); if (had && !has(id)) fx('demolish'); return r; };
}
{ const f = window.togglePause;
  if (typeof f === 'function') window.togglePause = function(){ const g = gOK(), was = g && g.paused; const r = f.apply(this, arguments); if (g && !g.over && g.paused !== was) fx(g.paused ? 'pausein' : 'pauseout'); return r; };
}
{ const f = window.momentum;
  if (typeof f === 'function') window.momentum = function(){ const g = gOK(), before = g && g.luck; const r = f.apply(this, arguments); if (g && g.luck > before) fx('luck'); return r; };
}
let lastBeat = 0;
function heartbeat(){
  const g = gOK(); if (!g || g.over || g.paused || !g.leader || !g.leader.maxCon) return;
  if (g.leader.con > Math.max(1, Math.floor(g.leader.maxCon / 3)) || g.leader.con <= 0) return;
  const now = performance.now(); if (now - lastBeat < 1400) return; lastBeat = now; fx('heart');
}

setInterval(() => { try { titleStep(); heartbeat(); } catch (e) {} }, 250);
})();
/* ===== END INDEX 87d ====================================================== */

/* ============================================================================
   INDEX 87e - RE-AUDIT ROUND 2 FIXES (audits/audio-r2.md)
   B1  The debrief stinger plays once per finished contract, in the first 2.5 s after
       the end. Later win / down / level sounds while the debrief is open are the
       normal sounds again.
   B2  No music duck while the game is paused, or when a level-up is about to open the
       Momentum choice (G.levelQueue): the pause duck already covers it (was -14 dB).
   B3  Leader hurt ducks the music at most once in 3 s (was every second).
   B4  A contract that starts in the bard's rest between verses now continues the camp
       tune (the camp bus is restarted first, then J-20 takes over). Bard Off or music
       muted still uses the old path.
   B6  Stale bar records are cleared once back in camp.
   ROLLBACK: delete this block and the "noStinger" test in 87d.
============================================================================ */
(function(){
'use strict';
const A = window.AUDIO87;
if (!A || typeof MUS === 'undefined' || !MUS._V || window.AUDIO_CLASSIC) return;
const M = MUS._M, SONGS = MUS.SONGS;
const gOK = () => (typeof G !== 'undefined' && G) ? G : null;

/* B2 + B3: guard the duck (folded into A.duck above, INT-1 step 3) */
let lastHurt = -1e9;
/* B1 + B2 + B3: one wrapper on top of the SFX chain */
{
  SFX.layer('end87e', function(name, next){
    const g = gOK(), now = performance.now();
    let skipDuck = false, noSting = false;
    if (g){
      if (g.paused && !g.over) skipDuck = true;                                       // the pause duck covers it
      if (name === 'level' && !g.over && (g.levelQueue > 0 || g.momChoice)) skipDuck = true;
      if (name === 'hurt'){ if (now - lastHurt < 3000) skipDuck = true; else if (!skipDuck) lastHurt = now; }
      if (g.over && (name === 'win' || name === 'down' || name === 'level')){
        if (!g.overAt87) g.overAt87 = now;
        if (g.stung87 || now - g.overAt87 > 2500) noSting = true; else g.stung87 = true;
      }
    }
    A.skipDuck = skipDuck; A.noStinger = noSting;
    try { return next(); } finally { A.skipDuck = false; A.noStinger = false; }
  });
}

/* B4: resume the camp tune before a contract begins if the bard is between verses */
function newCampBus(song){
  const ac = M.ac, C = SONGS[song].camp, t = ac.currentTime + .28, g = ac.createGain(), bus = {g, oscs:[], track:'camp'};
  g.connect(M.comp); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(C.trim, t + .8);
  const dg = ac.createGain(); dg.connect(g); bus.droneG = dg; dg.gain.value = C.drone.g;
  for (const [type, m, vol, det] of C.drone.o){
    const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(MUS.hz(m), t);
    og.gain.value = vol; o.connect(og); og.connect(dg); if (det) o.detune.setValueAtTime(det, t); o.start(t); bus.oscs.push(o);
  }
  return bus;
}
A.newCampBus = newCampBus;
function resumeFromRest(){
  const ac = M.ac;
  if (!ac || ac.state !== 'running' || M.track !== 'camp' || M.bus || !isFinite(M.restartAt) || M.song === 'off' || !SONGS[M.song] || MUS.vol() <= .005 || A.U && A.U.active) return;
  M.bar = 0; M.pk = MUS.passTempo(); M.nextT = ac.currentTime + .3; M.bus = newCampBus(M.song); M.restartAt = 0;
  if (A.log) A.log.push({event:'resume-from-rest', song:M.song});
}
{ const f = window.startDeployment;
  if (typeof f === 'function') window.startDeployment = function(){ try { resumeFromRest(); } catch (e) {} return f.apply(this, arguments); };
}

/* B6 */
setInterval(() => { try { if (M.track === 'camp' && !(A.U && A.U.active) && M.barQ && M.barQ.length) M.barQ.length = 0; } catch (e) {} }, 1000);
})();
/* ===== END INDEX 87e ====================================================== */

/* ============================================================================
   INDEX 87f - AUDIO POLISH (bundle E; AUD2-04, 06, 07)
   AUD2-04  A soft thud (sine 60 -> 42 Hz, 80 ms, gain 0.10, a little low-passed noise)
            on the big hit-stops only (the freeze graphics 84b adds when a hit lands on
            five or more enemies, Hit-stop setting on). No ducking. Rate limited to 4 a second.
   AUD2-06  The title screen plays Embers when the bard's choice (or the shuffle) is The Full
            Tankard: its bars are played from Embers' material, quieter to match the bus.
            The choice itself is never changed or saved.
   AUD2-07  After a defeat or flight the music "hushes": silent for 2 s while the lute
            stinger sounds, then back at -3 dB, rising to full over 8 s. A new contract resets it.
            Victory and withdrawal are untouched.
   Knock-back (84d, settings().knockback): nothing here depends on it.
   ROLLBACK: delete this block (the one line "A.newCampBus = ..." in 87e is harmless).
============================================================================ */
(function(){
'use strict';
const A = window.AUDIO87;
if (!A || typeof MUS === 'undefined' || !MUS._V || window.AUDIO_CLASSIC) return;
const M = MUS._M, SONGS = MUS.SONGS;
const gOK = () => (typeof G !== 'undefined' && G) ? G : null;
const cfg = () => { try { return settings(); } catch (e) { return {}; } };

/* ---- AUD2-04 the thud on a big hit-stop ---------------------------------------- */
let prevHs = 0, lastThud = 0;
A.thud = function(){
  const X = SFX._g(); if (!X.ac || !cfg().volume || cfg().sfx === 0) return;
  const t = X.ac.currentTime, o = X.ac.createOscillator(), g = X.ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(42, t + .08);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.10, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
  o.connect(g); g.connect(X.master); o.start(t); o.stop(t + .1);
  A.nburst(X.ac, X.noiseBuf, X.master, t, .04, .04, 'lowpass', 300, .7);
};
A.thudCheck = function(){
  const g = gOK(), hs = (g && !g.over && !g.paused && g.hs84) || 0;
  if (hs >= 2 && prevHs < 2){ const now = performance.now(); if (now - lastThud > 250){ lastThud = now; try { A.thud(); } catch (e) {} } }
  prevHs = hs;
};
(function loop(){ try { A.thudCheck(); } catch (e) {} requestAnimationFrame(loop); })();

/* ---- AUD2-06 the title plays Embers instead of the Tankard ----------------------- */
{ const party = SONGS.party, emb = SONGS.embers;
  if (party && emb){
    const f = party.camp.fn;
    party.camp.fn = function(bi, variant){
      const titleOpen = (() => { const el = document.getElementById('screen-title'); return !!(el && !el.classList.contains('hidden')); })();
      if (!titleOpen || (A.U && A.U.active)) return f(bi, variant);
      const r = emb.camp.fn(bi % emb.camp.bars, variant), k = (emb.camp.trim || .46) / (party.camp.trim || .9);   // embers' own bus is quieter: match it
      return {len:r.len, ev:r.ev.map(e => Object.assign({}, e, {v:e.v * k}))};
    };
  }
}

/* ---- AUD2-07 the hush after a defeat ----------------------------------------------- */
let hush = null;
function ensureHush(){
  if (hush || !A.shared || !A.musicIn || !M.out) return;
  const ctx = A.shared; hush = ctx.createGain(); hush.gain.value = 1;
  try { M.out.disconnect(); M.out.connect(hush); hush.connect(A.musicIn); A.hush = hush; } catch (e) { hush = null; }
}
function doHush(){
  ensureHush(); if (!hush) return;
  const t = A.shared.currentTime, g = hush.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(.0001, t + .15);
  g.setValueAtTime(.0001, t + 2.15); g.linearRampToValueAtTime(.71, t + 2.55); g.linearRampToValueAtTime(1, t + 10.55);
}
function resetHush(){ if (hush){ const t = A.shared.currentTime; hush.gain.cancelScheduledValues(t); hush.gain.setValueAtTime(1, t); } }
setInterval(() => {
  try { ensureHush(); const g = gOK(); if (g && g.over && !g.seen87) g.seen87 = performance.now(); } catch (e) {}
}, 250);
{
  SFX.layer('hush', function(name, next){
    const g = gOK();
    if (g && g.over && (name === 'win' || name === 'down' || name === 'level') && !g.hushed87 && g.seen87 !== undefined && performance.now() - g.seen87 < 3000){
      g.hushed87 = true;
      const res = g.result || (name === 'win' ? 'victory' : 'fallen');
      if (res !== 'victory' && res !== 'withdrawn') { try { doHush(); } catch (e) {} }
    } else if (g && g.over && !g.seen87 && (name === 'win' || name === 'down' || name === 'level') && !g.hushed87){
      g.seen87 = performance.now(); g.hushed87 = true;                              // the end sound fired before the first poll
      const res = g.result || (name === 'win' ? 'victory' : 'fallen');
      if (res !== 'victory' && res !== 'withdrawn') { try { doHush(); } catch (e) {} }
    }
    return next();
  });
}
{ const f = window.startDeployment;
  if (typeof f === 'function') window.startDeployment = function(){ try { resetHush(); } catch (e) {} return f.apply(this, arguments); };
}
})();
/* ===== END INDEX 87f ====================================================== */

/* ============================================================================
   INDEX 87g - THE LIVING TAVERN SOUNDS (T-01, audits/tavern-t01.md)
   Call by name through the normal API:  SFX.play('tavernCrowd')  etc.
     tavernCrowd  LOOP  crowd murmur with a soft cheer swell every 2-5 s (kept low, under the music)
     snore        LOOP  one slow breath every ~3.6 s, very quiet
     tavernJeer   one-shot, a low falling "boooo" (gap 1.2 s, pitch varies)
     diceCup      one-shot, a cup rattle (gap 250 ms)
     diceRoll     one-shot, dice bouncing and settling (gap 150 ms)
     koThud       one-shot, a soft body hit (gap 200 ms)
     coin         unchanged: the existing soft coin ping already is the clink
   Loops start on SFX.play(name), are idempotent, and end on SFX.stop(name) (SFX.stop() or
   SFX.stop('tavern') ends all tavern loops). Safety: they also end when a contract starts, and
   after 10 minutes. Missing names / audio off / classic mode / volume 0 / Effects 0 are no-ops.
   No ducking, no save keys.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
'use strict';
const A = window.AUDIO87;
if (!A || typeof SFX === 'undefined' || window.AUDIO_CLASSIC) return;
const cfg = () => { try { return settings(); } catch (e) { return {}; } };
const jit = a => 1 + (Math.random() * 2 - 1) * a;
const GAP = {tavernJeer:1200, diceCup:250, diceRoll:150, koThud:200}, last = {};
const nb = (X, t, d, v, type, f, q) => A.nburst(X.ac, X.noiseBuf, X.master, t, d, v, type, f, q);
function tone(X, type, f, f2, t, d, peak, lp){
  const o = X.ac.createOscillator(), g = X.ac.createGain(); let out = g;
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + Math.min(.02, d / 4)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); if (lp){ const fl = X.ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; g.connect(fl); out = fl; }
  out.connect(X.master); o.start(t); o.stop(t + d + .03);
}
const ONE = {
  tavernJeer(X){                                                    // "boooo": a low falling voice and a falling breath
    const t = X.ac.currentTime, k = jit(.08), d = .75;
    tone(X, 'sawtooth', 190 * k, 125 * k, t, d, .035, 520);
    tone(X, 'sawtooth', 143 * k, 96 * k, t + .03, d, .025, 480);
    nb(X, t, d, .02, 'bandpass', 420 * k, .8);
  },
  diceCup(X){                                                       // a rattle: 9-12 tiny ticks over half a second
    const t = X.ac.currentTime, n = 9 + (Math.random() * 4 | 0);
    for (let i = 0; i < n; i++){ const dt = i * .045 + Math.random() * .03; nb(X, t + dt, .018, .03 * (.6 + Math.random() * .6), 'bandpass', 2600 * jit(.3), 2); }
    nb(X, t, .5, .012, 'bandpass', 900, .7);
    tone(X, 'sine', 140, 110, t + n * .045, .07, .05);              // the cup lands on the table at the end
  },
  diceRoll(X){                                                      // bounces that get closer together and softer
    const t = X.ac.currentTime; let dt = 0, v = .06, gap = .14;
    for (let i = 0; i < 5; i++){
      nb(X, t + dt, .03, v, 'bandpass', 1800 * jit(.25), 1.5);
      tone(X, 'sine', 320 * jit(.1), 210, t + dt, .035, v * .6);
      dt += gap; gap *= .66; v *= .6;
    }
  },
  koThud(X){                                                        // a soft body falling
    const t = X.ac.currentTime;
    tone(X, 'sine', 95 * jit(.05), 42, t, .2, .13);
    nb(X, t, .09, .05, 'lowpass', 380, .7);
    tone(X, 'sine', 70, 40, t + .13, .12, .05);                     // a small second bump
  }
};
/* ---- loops -------------------------------------------------------------------- */
const LOOPS = {}, noiseBufs = new WeakMap();
function bigNoise(ac){ let b = noiseBufs.get(ac); if (!b){ b = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBufs.set(ac, b); } return b; }
function startCrowd(X){
  const ac = X.ac, t = ac.currentTime, L = {nodes:[], timers:[], born:performance.now()};
  const out = ac.createGain(); out.gain.setValueAtTime(.0001, t); out.gain.linearRampToValueAtTime(.05, t + 1.5); out.connect(X.master); L.out = out;
  const mod = ac.createGain(); mod.gain.value = .75; mod.connect(out);
  const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .21; lg.gain.value = .25; lfo.connect(lg); lg.connect(mod.gain); lfo.start(t);
  L.nodes.push(lfo);
  for (const [f, q, v] of [[600, .8, 1], [1500, 1.2, .55]]){
    const bp = ac.createBiquadFilter(), g = ac.createGain(), s = ac.createBufferSource();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.value = v;
    s.buffer = bigNoise(ac); s.loop = true; s.connect(bp); bp.connect(g); g.connect(mod); s.start(t, Math.random() * 3); L.nodes.push(s);
  }
  const cheer = () => {
    if (LOOPS.tavernCrowd !== L) return;
    try {
      const n = ac.currentTime + .02, d = 1 + Math.random() * .8, k = jit(.15);
      const g = ac.createGain(), bp = ac.createBiquadFilter(), s = ac.createBufferSource();
      bp.type = 'bandpass'; bp.Q.value = 1; bp.frequency.setValueAtTime(700 * k, n); bp.frequency.linearRampToValueAtTime(1050 * k, n + d * .6);
      g.gain.setValueAtTime(.0001, n); g.gain.linearRampToValueAtTime(.55, n + .3); g.gain.linearRampToValueAtTime(.0001, n + d);
      s.buffer = bigNoise(ac); s.loop = true; s.connect(bp); bp.connect(g); g.connect(out); s.start(n, Math.random() * 3); s.stop(n + d + .05);
      for (const m of [1, 1.26]) tone({ac, master:out}, 'sawtooth', 230 * k * m, 275 * k * m, n, d, .035, 900);   // two vowel-ish voices
    } catch (e) {}
    L.timers.push(setTimeout(cheer, 2000 + Math.random() * 3000));
  };
  L.timers.push(setTimeout(cheer, 900 + Math.random() * 1200));
  return L;
}
function startSnore(X){
  const ac = X.ac, L = {nodes:[], timers:[], born:performance.now()};
  const breath = () => {
    if (LOOPS.snore !== L) return;
    try {
      const t = ac.currentTime + .02, k = jit(.08);
      const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();                  // out-breath: a low buzz
      o.type = 'sawtooth'; o.frequency.setValueAtTime(52 * k, t + .9); o.frequency.linearRampToValueAtTime(44 * k, t + 2.1);
      lp.type = 'lowpass'; lp.frequency.value = 260; o.connect(lp); lp.connect(g); g.connect(X.master);
      g.gain.setValueAtTime(.0001, t); g.gain.setValueAtTime(.0001, t + .9); g.gain.linearRampToValueAtTime(.022, t + 1.2); g.gain.linearRampToValueAtTime(.0001, t + 2.2);
      o.start(t + .85); o.stop(t + 2.3);
      A.nburst(ac, X.noiseBuf, X.master, t, .8, .014, 'bandpass', 500 * k, .8);                          // in-breath
      A.nburst(ac, X.noiseBuf, X.master, t + .95, 1.1, .01, 'bandpass', 330 * k, .8);                    // out-breath air
    } catch (e) {}
    L.timers.push(setTimeout(breath, 3300 + Math.random() * 700));
  };
  L.timers.push(setTimeout(breath, 200));
  return L;
}
function stopLoop(name){
  const L = LOOPS[name]; if (!L) return; delete LOOPS[name];
  L.timers.forEach(clearTimeout);
  try {
    if (L.out){ const t = L.out.context.currentTime; L.out.gain.cancelScheduledValues(t); L.out.gain.setValueAtTime(Math.max(.0001, L.out.gain.value), t); L.out.gain.linearRampToValueAtTime(.0001, t + .6); }
    L.nodes.forEach(n => { try { n.stop(L.out.context.currentTime + .7); } catch (e) {} });
  } catch (e) {}
}
A.tavernStop = stopLoop; A.tavernLoops = () => Object.keys(LOOPS);
setInterval(() => { try { const now = performance.now(); for (const n of Object.keys(LOOPS)) if (now - LOOPS[n].born > 600000) stopLoop(n); } catch (e) {} }, 5000);
{ const f = window.startDeployment;
  if (typeof f === 'function') window.startDeployment = function(){ try { Object.keys(LOOPS).forEach(stopLoop); } catch (e) {} return f.apply(this, arguments); };
}
const START = {tavernCrowd:startCrowd, snore:startSnore};
{ const s0 = SFX.stop;
  SFX.layer('tavern', function(name, next){
    const one = ONE[name], lp = START[name];
    if (!one && !lp) return next();
    try {
      const X = SFX._g(); if (!X.ac || !cfg().volume || cfg().volume <= 0 || cfg().sfx === 0) return;
      if (lp){ if (!LOOPS[name]) LOOPS[name] = lp(X); return; }
      const now = performance.now(); if (now - (last[name] || 0) < GAP[name]) return; last[name] = now;
      one(X);
    } catch (e) {}
  });
  SFX.stop = function(name){
    if (name === undefined || name === 'tavern'){ Object.keys(LOOPS).forEach(stopLoop); return; }
    if (LOOPS[name]){ stopLoop(name); return; }
    if (typeof s0 === 'function') return s0.apply(this, arguments);
  };
}
})();
/* ===== END INDEX 87g ====================================================== */

/* ============================================================================
   INDEX 87h - THE BAR FIGHT PICKS UP LIKE A CONTRACT (T-01 bard)
   Hub (TAVERN.enter): nothing to do, the calm camp tune keeps playing and the crowd loop
   (87g) sits under it with no ducking. The brawl is a normal contract to J-20 (the tune
   carries on and the layers come in with the fight level). A brawl has few enemies near
   the Leader at a time, so the level is given a floor: 1 from the first bar, 2 once four
   or more brawlers are up (or from wave 3). Back in the hub the contract is over and
   J-20 eases the layers and tempo back to calm as for any contract.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
'use strict';
if (typeof MUS === 'undefined' || !window.AUDIO87 || window.AUDIO_CLASSIC) return;
const f0 = MUS.fightLevel;
if (typeof f0 !== 'function') return;
MUS.fightLevel = function(){
  const base = f0.apply(this, arguments);
  try {
    const g = (typeof G !== 'undefined') ? G : null;
    if (!g || g.over || g.obj !== 'brawl') return base;
    let live = 0; for (const e of g.enemies || []) if (!e.dead && !e.dormant && !e.broken) live++;
    const floor = (live >= 4 || (g.brawl && g.brawl.wave >= 3)) ? 2 : 1;
    return Math.max(base, floor);
  } catch (e) { return base; }
};
})();
/* ===== END INDEX 87h ====================================================== */
