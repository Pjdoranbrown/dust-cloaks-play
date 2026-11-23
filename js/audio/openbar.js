/* ============================================================================
   INDEX OBAUD - F-35 open-air bar sounds (Audio Designer).  js/audio/openbar.js
   Table chatter (scales with how many sit), cup clinks, dice at the Crepitus
   table, and the cosmetic bar fight (swell, thumps, a jeer, a short cheer).
   Everything is quiet and sits under the camp bed. Needs js/camp/openbar.js (OPENBAR35).
   Fatigue budget: at most one sound event per 0.9 s, dice at most every 18 s,
   jeer at most every 7 s (and it uses SFX.play('tavernJeer'), which has its own gap).
   INT-1 group 17: no switch. Nothing else in the game refers to this file.
   Tools: AUDIO_OPENBAR.state(), .test('chat'|'cup'|'dice'|'fight'|'cheer'), .tune.
   ============================================================================ */
(function () {
  'use strict';
  const OB = () => window.OPENBAR35;
  const T = { tickMs: 1000, chatPeak: 0.011, cupPeak: 0.016, thumpPeak: 0.04, swellPeak: 0.022,
              minGap: 900, diceEvery: [18000, 40000], cupEvery: [9000, 19000], jeerGap: 7000 };
  const st = { last: 0, nextCup: 0, nextDice: 0, nextChat: 0, nextThump: 0, lastJeer: 0, fightSeen: null, n: 0, events: 0, on: false };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const jit = a => 1 + (Math.random() * 2 - 1) * a;

  function ctxOut() {
    const A = window.AUDIO87; if (!A || !A.limiter || !A.sfxIn) return null;
    return { ac: A.limiter.context, out: A.sfxIn };
  }
  let nbuf = null, nbAc = null;
  function noise(ac) {
    if (nbuf && nbAc === ac) return nbuf;
    const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    nbuf = b; nbAc = ac; return b;
  }
  // a band-passed noise burst with a soft attack and release
  function nb(C, t, dur, peak, f, q, f2) {
    const s = C.ac.createBufferSource(), bp = C.ac.createBiquadFilter(), g = C.ac.createGain();
    s.buffer = noise(C.ac); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f, t); if (f2) bp.frequency.linearRampToValueAtTime(f2, t + dur); bp.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(C.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function tone(C, type, f, f2, t, dur, peak) {
    const o = C.ac.createOscillator(), g = C.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.012, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(C.out); o.start(t); o.stop(t + dur + 0.03);
  }

  const EV = {
    // a few mumbled syllables; louder and longer with more people sitting
    chat(C, n) {
      const t = C.ac.currentTime, k = Math.min(n, 8) / 8, syl = 2 + (Math.random() * (2 + k * 2) | 0), base = rnd(300, 520);
      let dt = 0;
      for (let i = 0; i < syl; i++) {
        const d = rnd(0.10, 0.2);
        nb(C, t + dt, d, T.chatPeak * (0.45 + 0.55 * k) * rnd(0.6, 1), base * jit(0.35), 2.2, base * jit(0.5));
        dt += d + rnd(0.02, 0.1);
      }
    },
    laugh(C, n) {   // a short low "ha ha ha", only with 3+ seated
      const t = C.ac.currentTime, f = rnd(190, 260);
      for (let i = 0; i < 3; i++) tone(C, 'triangle', f * (1 - i * 0.06), f * 0.8, t + i * 0.16, 0.12, 0.007 * Math.min(1, n / 6));
    },
    cup(C) {        // two cups meet, then one is set down on the wood
      const t = C.ac.currentTime, f = rnd(2300, 3100);
      tone(C, 'sine', f, f * 0.98, t, 0.18, T.cupPeak); tone(C, 'sine', f * 1.5, f * 1.47, t, 0.12, T.cupPeak * 0.5);
      nb(C, t + 0.3, 0.07, T.cupPeak * 0.9, 380, 1.2); tone(C, 'sine', 150, 110, t + 0.3, 0.07, T.cupPeak * 1.4);
    },
    dice() {        // the game's own cup rattle and roll, one after the other
      if (window.SFX && SFX.play) { try { SFX.play('diceCup'); setTimeout(() => { try { SFX.play('diceRoll'); } catch (e) {} }, 650); } catch (e) {} }
    },
    swell(C, d) {   // the room gets louder as two stand up
      const t = C.ac.currentTime;
      nb(C, t, d || 1.4, T.swellPeak, 520, 0.9, 760); nb(C, t + 0.1, (d || 1.4) * 0.8, T.swellPeak * 0.7, 900, 1.4, 640);
      tone(C, 'triangle', 240, 330, t, 0.5, 0.006);
    },
    thump(C) {      // a dull blow and a shuffle
      const t = C.ac.currentTime;
      tone(C, 'sine', rnd(95, 125), 50, t, 0.14, T.thumpPeak * rnd(0.6, 1));
      nb(C, t, 0.09, T.thumpPeak * 0.5, 700, 0.8);
      if (Math.random() < 0.5) nb(C, t + 0.12, 0.25, T.chatPeak, 420, 1.5, 300);   // a grunt-ish shuffle
    },
    jeer() { if (window.SFX && SFX.play) { try { SFX.play('tavernJeer'); } catch (e) {} } },
    cheer(C) {      // the fight is over: a short rise and fall of voices
      const t = C.ac.currentTime;
      nb(C, t, 1.1, T.swellPeak * 0.8, 650, 1, 900);
      for (let i = 0; i < 3; i++) tone(C, 'triangle', rnd(220, 300), rnd(300, 380), t + i * 0.12, 0.35, 0.005);
    }
  };

  function seatedCount() {
    try { const o = OB(); const L = o.cache; return L ? L.seats.filter(s => s.taken && s.taken.obSat).length : 0; } catch (e) { return 0; }
  }
  function diceSeated() {
    try { const o = OB(), L = o.cache; if (!L) return 0; const tb = L.tables.find(t => t.kind === 'crepitus'); return tb ? o.atTable(tb.i).length : 0; } catch (e) { return 0; }
  }
  function eligible() {
    const o = OB(); if (!o || !o.live || !o.live()) return false;
    const A = window.AUDIO87; if (A && A.U && A.U.active) return false;      // a contract is running
    if (typeof document !== 'undefined' && document.hidden) return false;
    return true;
  }
  // one event per minGap: the fatigue budget
  function can(now) { return now - st.last >= T.minGap; }
  function fire(name, C, arg, now) { st.last = now; st.events++; EV[name](C, arg); }

  function tick(force) {
    const now = Date.now(), o = OB();
    st.on = eligible();
    if (!st.on) { st.fightSeen = null; return; }
    const C = ctxOut(); if (!C) return;
    const n = st.n = seatedCount(), br = o.brawl;
    // the bar fight
    if (br) {
      if (st.fightSeen !== br) { st.fightSeen = br; st.nextThump = now + 1200; if (can(now)) fire('swell', C, 1.6, now); return; }
      if (now >= st.nextThump && can(now)) {
        st.nextThump = now + rnd(700, 1500);
        if (now - st.lastJeer > T.jeerGap && Math.random() < 0.25) { st.lastJeer = now; fire('jeer', C, 0, now); }
        else fire('thump', C, 0, now);
      }
      return;
    }
    if (st.fightSeen) { st.fightSeen = null; if (can(now)) { fire('cheer', C, 0, now); return; } }
    if (n < 1) return;
    // dice at the Crepitus table (two or more seated)
    if (now >= st.nextDice) { st.nextDice = now + rnd(T.diceEvery[0], T.diceEvery[1]); if (diceSeated() >= 2 && can(now)) { fire('dice', C, 0, now); return; } }
    if (now >= st.nextCup) { st.nextCup = now + rnd(T.cupEvery[0], T.cupEvery[1]) / Math.max(0.6, Math.min(2, n / 4)); if (can(now)) { fire('cup', C, 0, now); return; } }
    if (now >= st.nextChat) {
      st.nextChat = now + rnd(1800, 4200) / Math.max(0.5, Math.min(2.2, n / 3));
      if (can(now)) fire(n >= 3 && Math.random() < 0.12 ? 'laugh' : 'chat', C, n, now);
    }
  }

  window.AUDIO_OPENBAR = {
    T, state: () => Object.assign({ eligible: eligible(), seated: seatedCount(), diceSeated: diceSeated(), brawl: !!(OB() && OB().brawl) }, st),
    tick,
    test(name) { const C = ctxOut(); if (!C || !EV[name]) return false; EV[name](C, 6); return true; },
  };
  setInterval(() => { try { tick(); } catch (e) { if (!window.AUDIO_OPENBAR.err) console.warn('AUDIO_OPENBAR', e); window.AUDIO_OPENBAR.err = e; } }, T.tickMs);
})();
