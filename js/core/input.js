/* ============================================================================
   INDEX INPUT43 - F-43 playability: movement that carries on with no input (Systems, 2026-11-14)
   Patrick: "characters continued moving when i was not pressing a button". Three ways a movement key can stay down or a move can outlast
   the player, all fixed here with no game numbers:
   1. A lost keyup. index.html clears the held keys on 'blur' only. A tab switch, a hidden window, a screen lock, an alt-tab to a window that
      never takes focus, or a context menu all lose the keyup. Now the held keys are also cleared on visibilitychange (hidden), pagehide,
      focus (not contextmenu: the right click is an attack with the movement keys held).
   2. A keyup that names a different key than the keydown. index.html stores keys[event.key.toLowerCase()]: Shift or a layout/IME change
      gives a different event.key on the way up (W then w is fine, but 7 then &, or a dead key, is not). A keyup now also clears the
      movement key named by event.code (KeyW, ArrowUp, ...).
   3. A Charge (F-33, ?f33=1) counts its 240 frames in game frames. At 1 fps the loop runs two updates a frame, so 240 frames is about two
      minutes of running at an enemy with no key held. js/combat/drills.js now also stops a charge after F33.K.chargeMs of wall time (2.5 s).
   INT-1 group 11: no switch. Test: INPUT43.selfTest().
============================================================================ */
(function(){
  'use strict';
  const I = window.INPUT43 = {chargeMs: 2500};
  const CODE = {KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd'};
  I.clear = function(why){
    if (typeof keys === 'undefined') return 0;
    let n = 0; for (const k in keys) if (keys[k]){ keys[k] = false; n++; }
    try { if (window.F33 && F33.charge && F33.stopCharge) F33.stopCharge(); } catch (e) {}
    I.log = {why, n, at: Date.now()};
    return n;
  };
  window.addEventListener('keyup', e => { if (typeof keys === 'undefined') return; const k = CODE[e.code]; if (k) keys[k] = false; }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) I.clear('hidden'); });
  window.addEventListener('pagehide', () => I.clear('pagehide'));
  window.addEventListener('focus', () => I.clear('focus'));
  I.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c}), was = {w: keys.w, a: keys.a};
    try {
      keys.w = true; keys.a = true;
      ok('clear() lets go of every held key', I.clear('test') >= 2 && !keys.w && !keys.a);
      const hid = (v) => { try { Object.defineProperty(document, 'hidden', {configurable: true, get: () => v}); } catch (e) {} };
      hid(false); keys.s = true; document.dispatchEvent(new Event('visibilitychange'));
      ok('a visible tab keeps its keys (only hidden clears)', keys.s === true);
      hid(true); document.dispatchEvent(new Event('visibilitychange'));
      ok('a hidden tab lets go of them', keys.s === false);
      try { delete document.hidden; } catch (e) {} keys.s = false;
      keys.d = true; window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyD', key: 'D'}));
      ok('a keyup by code clears the movement key even when event.key differs', !keys.d);
      keys.w = true; window.dispatchEvent(new KeyboardEvent('keyup', {code: 'ArrowUp', key: 'ArrowUp'}));
      ok('an arrow keyup clears its WASD twin', !keys.w);
    } finally { keys.w = !!was.w; keys.a = !!was.a; keys.s = keys.d = false; }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {ok: !fails.length, fails, pass: out.length - fails.length, details: out};
  };
})();
/* END INDEX 87c */
