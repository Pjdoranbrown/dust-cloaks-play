/* ============================================================================
   INDEX AMIX - F-44f mix pass: effects were drowned by music and ambience (Patrick, Firefox).
   Effects bus +3.5 dB in camp and +6 dB in a fight (an extra gain stage between sfxIn and the
   limiter; the Effects slider still works, 0 stays silent), the wind/ambience bed drops to 35%
   in a fight, the music drops 2.5 dB in a fight, and music dips 2 dB for 120 ms under attack and
   pick-up sounds (at most one dip per 350 ms).
   INT-1 group 17: no switch (AUDIO_CLASSIC still turns it off: everything glides back to 1).
   Tools: AUDIO_MIX.state(), AUDIO_MIX.T.
   ============================================================================ */
(function () {
  'use strict';
  const T = { sfxCamp: 1.5, sfxFight: 2.0, amb: 0.35, music: 0.75, dip: 2, dipHold: 0.12, dipGap: 350 };
  const M = window.AUDIO_MIX = { T, boost: null, trim: null, dips: 0 };
  const off = () => !!window.AUDIO_CLASSIC;
  const fight = () => { try { return typeof G !== 'undefined' && !!G && !G.over; } catch (e) { return false; } };
  M.ambFactor = () => (off() || !fight()) ? 1 : T.amb;
  M.state = () => ({ off: off(), fight: fight(), boost: M.boost && M.boost.gain.value, trim: M.trim && M.trim.gain.value, dips: M.dips });
  function wire(A) {
    if (M.boost || !A || !A.sfxIn || !A.limiter || !A.mood) return;
    const ctx = A.limiter.context;
    const boost = ctx.createGain(), trim = ctx.createGain();
    boost.gain.value = 1; trim.gain.value = 1;
    try {
      A.sfxIn.disconnect(); A.sfxIn.connect(boost); boost.connect(A.limiter);
      A.mood.disconnect(); A.mood.connect(trim); trim.connect(A.limiter);
    } catch (e) { try { A.sfxIn.connect(A.limiter); A.mood.connect(A.limiter); } catch (e2) {} return; }
    M.boost = boost; M.trim = trim;
  }
  setInterval(function () {
    try {
      const A = window.AUDIO87; if (!A) return; wire(A); if (!M.boost) return;
      const t = A.limiter.context.currentTime, f = fight(), o = off();
      M.boost.gain.setTargetAtTime(o ? 1 : (f ? T.sfxFight : T.sfxCamp), t, 0.3);
      M.trim.gain.setTargetAtTime(o || !f ? 1 : T.music, t, 0.6);
    } catch (e) {}
  }, 250);
  // music dips under attack and pick-up sounds
  const DIP = { hit: 1, crit: 1, pick: 1, coin: 1, block: 1, slash: 1, swing: 0 };
  if (typeof SFX !== "undefined" && SFX.layer) {
    let last = 0;
    SFX.layer('amix', function (name, next) {
      try {
        if (DIP[name] && !off() && fight() && window.AUDIO87 && AUDIO87.duck) {
          const n = performance.now();
          if (n - last > T.dipGap) { last = n; M.dips++; AUDIO87.duck(T.dip, T.dipHold); }
        }
      } catch (e) {}
      return next();
    });
  }
})();
