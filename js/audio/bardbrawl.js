/* ============================================================================
   INDEX BBAUD - F-35b "pick a fight": the Bard's brawl music cue (Audio Designer).
   While the forest-camp brawl runs, the camp tune turns into its battle arrangement
   (same melody, same song: bass, lead and drums come in), then falls back to the camp
   arrangement on the next bar line when it ends. It reuses the existing unified
   camp/combat engine (INDEX 87c) by answering "fight" from MUS.wantTrack().
   HOOK (Lead Programmer): set  BARDBRAWL.active = true  when the fight starts and
   false when it ends (or set BARDBRAWL.level = 2 for the big waves). Nothing else.
   INT-1 group 17: no switch (AUDIO_CLASSIC still turns it off).
   Tools: BARDBRAWL.on(), BARDBRAWL.state().
   ============================================================================ */
(function () {
  'use strict';
  if (typeof MUS === 'undefined' || !MUS.wantTrack || !MUS.fightLevel) return;
  const B = window.BARDBRAWL = { active: false, level: 1 };
  B.on = () => !window.AUDIO_CLASSIC && B.active === true;
  B.state = () => ({ on: B.on(), active: B.active, level: B.level, track: MUS._M && MUS._M.track, song: MUS._M && MUS._M.song });
  const f0 = MUS.fightLevel;   // MUS.wantTrack reads B.on() itself (folded into js/audio/music.js, INT-1 step 3)
  MUS.fightLevel = function () {
    const base = f0.apply(this, arguments);
    return B.on() ? Math.max(base, B.level === 2 ? 2 : 1) : base;
  };
})();
