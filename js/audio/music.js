/* js/audio/music.js (INT-1 step 2, 2026-11-16): INDEX 29, 31 + 34 (music).
   Cut unchanged from the inline script in index.html (old lines 13580 to 14210). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 29, 31 + 34 - MUSIC
   Five tunes, and every tune is written twice: a CAMP arrangement that the
   Camp Bard plays, and a BATTLE arrangement for a contract. Both are note data
   played with Web Audio, so the file stays a single page with no audio files.
     THE CAMPFIRE JIG, EMBERS, THE FULL TANKARD
         Camp: as before (whistle or fiddle over lute, drone and hand drum).
         Battle: the same melody on the battle synths: lead, bass, kick, snare,
         hat, taiko, a quiet pipe line and a low drone.
     DUST AND IRON   (the original battle theme, A Dorian, 4/4)
         Battle: as before.
         Camp: the bard plucks the battle melody on his lute, about twice as
         slow, with a bass note, a soft hand drum and a low drone.
     MARCH OF THE DUST CLOAKS   (new, D minor, 4/4, a dotted march)
         Written in both forms: a drum-led synth march for battle and a slow
         lute march for camp.
   BATTLE LEVELS (every tune): 0 nobody close (drone, heartbeat drum, a quiet
   pipe line); 1 enemies near or in contact (kick, snare, bass, lead); 2 a
   commander near, a crowd or the Leader in trouble (full kit, octave lead,
   taiko, fills). It rises at once and falls back after 5 quiet seconds.
   WHICH BATTLE TUNE: the one the bard is playing in camp. Shuffle picks a
   different tune each contract. Quiet, or never having chosen, gives Dust and
   Iron, as before.
   TEMPO: every time the bard starts a tune he plays it at a slightly different
   speed (the old camp tunes by up to 8%, the lute versions by up to 16%), so
   no two loops are the same. In battle the tempo follows the Game speed
   setting: Steady (85%) and Slow (70%) slow the music with the game.
   Settings has a Music slider (0 is off). Music also follows the main Volume
   slider, ducks while the game is paused, and stops when the tab is hidden.
   Browsers only allow sound after a click or key press, so the music starts
   with your first one. settings().campSong holds the bard's choice.
   To roll back, delete from this comment to END INDEX 29 and the one line
   marked "Index 29" in settings.
============================================================================ */
const MUS = (() => {
  /* ---- note helpers ---------------------------------------------------- */
  const PC = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
  const midi = n => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) throw new Error('bad note ' + n); return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const seq = s => s.trim().split(/\s+/).map(x => { const [n, l] = x.split(':'); return {m:n === 'r' ? null : midi(n), l:+l}; });

  /* ---- CAMP: 6/8, eighth = 0.2 s, bar = 1.2 s ---------------------------- */
  const C8 = 0.2, CBAR = C8 * 6;
  const CHORD = {   // bass, fifth, third, fifth (upper)
    Am:['A2', 'E3', 'C4', 'E4'], D:['D3', 'A3', 'F#4', 'A4'], G:['G2', 'D3', 'B3', 'D4'], C:['C3', 'G3', 'E4', 'G4']
  };
  const SECT = {
    A1:{ch:'Am Am D D Am G Am Am', mel:[
      'A4:1 C5:1 E5:1 E5:2 D5:1', 'C5:1 D5:1 C5:1 B4:1 A4:2', 'D5:1 F#5:1 A5:1 A5:2 F#5:1', 'E5:1 D5:1 F#5:1 E5:3',
      'A4:1 C5:1 E5:1 G5:2 E5:1', 'D5:1 B4:1 G4:1 B4:2 D5:1', 'C5:1 B4:1 A4:1 B4:1 C5:1 D5:1', 'A4:6']},
    A2:{ch:'Am Am D D Am G Am Am', mel:[
      'E5:1 E5:1 A5:1 G5:2 E5:1', 'D5:1 E5:1 D5:1 C5:1 A4:2', 'F#5:1 A5:1 B5:1 A5:2 F#5:1', 'E5:1 F#5:1 E5:1 D5:3',
      'C5:1 E5:1 A5:1 G5:2 E5:1', 'D5:1 G5:1 F#5:1 G5:2 B4:1', 'A4:1 C5:1 E5:1 D5:1 C5:1 B4:1', 'A4:6']},
    B1:{ch:'C G Am Am D G Am Am', mel:[
      'E5:2 G5:1 E5:1 C5:1 E5:1', 'D5:2 B4:1 D5:1 G5:2', 'E5:2 C5:1 E5:1 A5:2', 'G5:1 E5:1 D5:1 C5:3',
      'D5:1 F#5:1 A5:1 F#5:1 D5:2', 'B4:1 D5:1 G5:1 D5:1 B4:2', 'C5:1 E5:1 A5:1 G5:1 E5:1 D5:1', 'A4:6']}
  };
  const CAMP_ORDER = ['A1', 'A2', 'B1', 'A1'];
  for (const k in SECT) SECT[k].mel = SECT[k].mel.map(seq);
  for (const k in SECT) SECT[k].ch = SECT[k].ch.split(' ');

  function campBar(bi, variant){
    const s = SECT[CAMP_ORDER[(bi / 8) | 0]], b = bi % 8, ch = CHORD[s.ch[b]], ev = [];
    // lute: root, upper third, upper fifth, fifth, third, fifth
    const arp = [[0, ch[0], 1], [1, ch[2], .5], [2, ch[3], .5], [3, ch[1], .85], [4, ch[2], .5], [5, ch[3], .5]];
    for (const [i, n, v] of arp) ev.push({t:i * C8, k:'pluck', m:midi(n), v:v * .8});
    // hand drum
    ev.push({t:0, k:'thump', v:.75}, {t:3 * C8, k:'thump', v:.5}, {t:2 * C8, k:'tick', v:.35}, {t:5 * C8, k:'tick', v:.3});
    if (variant & 1) ev.push({t:4 * C8, k:'tick', v:.22});
    // pipe
    let t = 0, prev = s.mel[b - 1] ? s.mel[b - 1][s.mel[b - 1].length - 1].m : null;
    s.mel[b].forEach((n, i) => {
      const d = n.l * C8;
      if (n.m !== null){
        const again = prev === n.m;                       // re-articulated note gets a grace-note cut
        const long = n.l >= 2 && i === 0 && (variant & 1); // odd passes cut the long bar-opening notes too
        if ((again || long) && n.l >= 1) ev.push({t:Math.max(0, t - 0.045), k:'cut', m:n.m + (n.m === midi('E5') ? 3 : 2), d:.045, v:.5});
        ev.push({t, k:'pipe', m:n.m, d:d * .96, v:i === 0 ? .9 : .75, vib:n.l >= 2 ? 1 : 0});
        prev = n.m;
      }
      t += d;
    });
    return {len:CBAR, ev};
  }
  const CAMP_BARS = 32;

  /* ---- EMBERS (mellow): 4/4, eighth = 0.42 s, bar = 3.36 s, 24 bars ------ */
  const E8 = 0.42, EBAR = E8 * 8;
  const ECHORD = {
    Am:['A2', 'E3', 'C4', 'E4'], F:['F2', 'C3', 'A3', 'C4'], C:['C3', 'G3', 'E4', 'G4'], G:['G2', 'D3', 'B3', 'D4'], Dm:['D3', 'A3', 'F4', 'A4']
  };
  const ESECT = {
    A:{ch:'Am F C G Am F G Am', mel:[
      'E5:4 D5:2 C5:2', 'A4:3 C5:1 F5:4', 'E5:2 G5:2 E5:2 D5:1 C5:1', 'D5:4 B4:2 D5:2',
      'C5:2 E5:2 A5:3 G5:1', 'F5:3 E5:1 C5:4', 'D5:2 B4:2 G4:2 B4:2', 'A4:8']},
    B:{ch:'Dm Dm G C F Dm G Am', mel:[
      'A5:4 F5:2 D5:2', 'E5:2 F5:2 A5:4', 'G5:3 F5:1 D5:2 B4:2', 'E5:4 C5:2 E5:2',
      'A5:3 G5:1 F5:2 C5:2', 'D5:2 F5:2 A5:2 F5:2', 'G5:2 B5:2 A5:2 G5:2', 'E5:8']},
    A2:{ch:'Am F C G Am F G Am', mel:[
      'E5:2 A5:4 G5:2', 'F5:3 E5:1 C5:2 A4:2', 'E5:4 G5:2 E5:2', 'D5:3 E5:1 D5:2 B4:2',
      'A4:2 C5:2 E5:4', 'A4:2 C5:2 F5:4', 'G5:3 F5:1 E5:2 D5:2', 'C5:2 B4:2 A4:4']}
  };
  const EORDER = ['A', 'B', 'A2'];
  for (const k in ESECT){ ESECT[k].mel = ESECT[k].mel.map(seq); ESECT[k].ch = ESECT[k].ch.split(' '); }
  const EMBERS_BARS = 24;
  function embersBar(bi, variant){
    const s = ESECT[EORDER[(bi / 8) | 0]], b = bi % 8, ch = ECHORD[s.ch[b]], ev = [];
    // a slow, rolling lute
    [[0, 0, 1], [1, 2, .5], [2, 3, .55], [3, 2, .5], [4, 1, .8], [5, 2, .5], [6, 3, .55], [7, 2, .45]].forEach(([i, n, v]) => ev.push({t:i * E8, k:'pluck', m:midi(ch[n]), v:v * .7}));
    // a warm pad holds the chord
    for (const n of [1, 2, 3]) ev.push({t:0, k:'pad', m:midi(ch[n]) - (n === 3 ? 12 : 0), d:EBAR * .98, v:.5});
    // barely there percussion: a heartbeat and a brush
    ev.push({t:0, k:'thump', v:.3}, {t:4 * E8, k:'thump', v:.18}, {t:2 * E8, k:'tick', v:.14}, {t:6 * E8, k:'tick', v:.14});
    // the whistle, soft and long
    let t = 0, prev = s.mel[b - 1] ? s.mel[b - 1][s.mel[b - 1].length - 1].m : null;
    s.mel[b].forEach((n, i) => {
      const d = n.l * E8;
      if (n.m !== null){
        if (prev === n.m && n.l >= 1) ev.push({t:Math.max(0, t - 0.045), k:'cut', m:n.m + 2, d:.045, v:.35});
        ev.push({t, k:'pipe', m:n.m, d:d * .97, v:i === 0 ? .8 : .68, vib:n.l >= 3 ? 1 : 0});
        prev = n.m;
      }
      t += d;
    });
    return {len:EBAR, ev};
  }

  /* ---- THE FULL TANKARD (party): 4/4 reel, sixteenth = 0.125 s, bar = 2 s, 32 bars */
  const P16 = 0.125, PBAR = P16 * 16;
  const PBASS = {G:'G2', D:'D3', C:'C3', Em:'E2'}, PBASS5 = {G:'D3', D:'A2', C:'G2', Em:'B2'};
  const PSTRUM = {G:['G3', 'B3', 'D4', 'G4'], D:['D3', 'A3', 'D4', 'F#4'], C:['C3', 'G3', 'C4', 'E4'], Em:['E3', 'B3', 'E4', 'G4']};
  const PSECT = {
    A:{ch:'G G D D C G D G', mel:[
      'D5:2 G5:2 G5:2 B5:2 A5:2 G5:2 G5:2 E5:2', 'D5:2 G5:2 G5:2 B5:2 A5:2 B5:2 G5:4', 'F#5:2 A5:2 A5:2 F#5:2 D5:2 F#5:2 A5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 B5:2 A5:4',
      'E5:2 G5:2 G5:2 E5:2 C5:2 E5:2 G5:4', 'D5:2 B4:2 G4:2 B4:2 D5:2 G5:2 B5:4', 'A5:2 F#5:2 A5:2 B5:2 A5:2 F#5:2 D5:4', 'G5:2 B5:2 A5:2 F#5:2 G5:8']},
    A2:{ch:'G G D D C G D G', mel:[
      'D5:2 G5:1 A5:1 B5:2 D6:2 B5:2 A5:2 G5:2 E5:2', 'G5:2 B5:2 D6:4 B5:2 A5:1 G5:1 A5:2 B5:2', 'F#5:2 A5:2 D6:4 A5:2 F#5:2 D5:2 F#5:2', 'A5:2 F#5:2 D5:2 F#5:2 A5:1 B5:1 A5:2 F#5:2 A5:2',
      'E5:2 G5:2 C6:4 G5:2 E5:2 G5:2 E5:2', 'D5:2 B4:2 D5:2 G5:2 B5:4 A5:2 G5:2', 'A5:2 F#5:2 A5:2 B5:2 C6:2 B5:2 A5:2 F#5:2', 'G5:4 B5:2 A5:2 G5:8']},
    B:{ch:'Em C G D Em C D D', mel:[
      'B5:2 E6:2 E6:2 D6:2 B5:2 G5:2 E5:2 G5:2', 'C6:2 E6:2 E6:2 D6:2 C6:2 G5:2 E5:2 G5:2', 'D6:2 B5:2 G5:2 B5:2 D6:4 B5:2 G5:2', 'A5:2 F#5:2 D5:2 F#5:2 A5:4 D6:4',
      'B5:2 E6:2 D6:2 B5:2 G5:2 B5:2 E5:4', 'C6:2 E6:2 D6:2 C6:2 G5:2 E5:2 C5:4', 'F#5:2 A5:2 D6:2 A5:2 F#5:2 A5:2 D6:4', 'A5:4 F#5:4 D5:8']}
  };
  const PORDER = ['A', 'A2', 'B', 'A2'];
  for (const k in PSECT){ PSECT[k].mel = PSECT[k].mel.map(seq); PSECT[k].ch = PSECT[k].ch.split(' '); }
  const PARTY_BARS = 32;
  function partyBar(bi, variant){
    const si = (bi / 8) | 0, s = PSECT[PORDER[si]], b = bi % 8, cn = s.ch[b], ev = [], at = u => u * P16;
    // oom: the bass; pah: the strum
    ev.push({t:at(0), k:'pluck', m:midi(PBASS[cn]), v:1.1}, {t:at(8), k:'pluck', m:midi(PBASS5[cn]), v:.9}, {t:at(6), k:'pluck', m:midi(PBASS[cn]), v:.5}, {t:at(14), k:'pluck', m:midi(PBASS5[cn]), v:.5});
    const strum = (u, v, from) => PSTRUM[cn].slice(from || 0).forEach((n, i) => ev.push({t:at(u) + i * 0.014, k:'pluck', m:midi(n), v:v * (1 - i * 0.06)}));
    strum(4, .8); strum(12, .8); strum(2, .3, 2); strum(10, .3, 2); strum(6, .38, 1); strum(14, .38, 1);
    // stamp, clap and jingle
    for (const [u, v] of [[0, .8], [6, .4], [8, .75], [14, .4]]) ev.push({t:at(u), k:'thump', v});
    ev.push({t:at(4), k:'clap', v:.75}, {t:at(12), k:'clap', v:.75});
    for (let u = 0; u < 16; u += 2) ev.push({t:at(u), k:'tick', v:u % 4 === 2 ? .3 : .16});
    if (si >= 2) for (const u of [3, 11]) ev.push({t:at(u), k:'clap', v:.3});
    // the fiddle takes the tune; the whistle joins in once it has been round
    let t = 0;
    for (const n of s.mel[b]){
      const d = n.l * P16;
      if (n.m !== null){
        ev.push({t, k:'fiddle', m:n.m, d:d * .92, v:.8, vib:n.l >= 4 ? 1 : 0});
        if (si >= 1) ev.push({t, k:'pipe', m:n.m, d:d * .9, v:.3, vib:0});
      }
      t += d;
    }
    return {len:PBAR, ev};
  }

  /* ---- FIGHT: 4/4, sixteenth = 0.105 s, bar = 1.68 s --------------------- */
  const F16 = 0.105, FBAR = F16 * 16;
  const FCH = 'Am G Am D Am C G E'.split(' ');
  const FBASS = {Am:['A2', 'E3'], G:['G2', 'D3'], D:['D2', 'A2'], C:['C3', 'G3'], E:['E2', 'B2']};
  const FMEL = [
    'E5:3 E5:1 D5:2 C5:2 A4:2 C5:2 E5:4', 'D5:3 D5:1 B4:2 G4:2 B4:2 D5:2 G5:4',
    'E5:3 E5:1 A5:2 G5:2 E5:2 D5:2 C5:4', 'D5:2 F#5:2 A5:4 F#5:2 D5:2 E5:4',
    'A5:3 A5:1 G5:2 E5:2 G5:2 A5:2 B5:4', 'G5:3 G5:1 E5:2 C5:2 E5:2 G5:2 C6:4',
    'D5:2 G5:2 B5:2 A5:2 G5:2 D5:2 B4:4', 'E5:2 A5:2 C6:2 B5:2 A5:2 G5:2 E5:4'
  ].map(seq);
  const FBARS = 8;

  function fightBar(bi, level, variant){
    const ev = [], b = bi % FBARS, ch = FCH[b], B = FBASS[ch], last = b === FBARS - 1;
    const at = s => s * F16;
    // drums
    if (level === 0){
      ev.push({t:0, k:'thump', v:.55}, {t:at(8), k:'thump', v:.38});
    } else if (level === 1){
      for (const s of [0, 8, 10]) ev.push({t:at(s), k:'kick', v:s === 0 ? .9 : .7});
      for (const s of [4, 12]) ev.push({t:at(s), k:'snare', v:.7});
      for (const s of [2, 6, 10, 14]) ev.push({t:at(s), k:'hat', v:.4});
    } else {
      for (const s of [0, 3, 6, 8, 10, 14]) ev.push({t:at(s), k:'kick', v:s === 0 ? 1 : .75});
      for (const s of [4, 12]) ev.push({t:at(s), k:'snare', v:.85});
      for (let s = 0; s < 16; s++) ev.push({t:at(s), k:'hat', v:s % 2 ? .2 : .42});
      ev.push({t:0, k:'taiko', v:.85});
      if (b % 2 === 1) ev.push({t:at(8), k:'taiko', v:.6});
      if (last) for (const s of [13, 14, 15]) ev.push({t:at(s), k:'snare', v:.55 + (s - 13) * .12});
      else ev.push({t:at(15), k:'snare', v:.4});
    }
    // bass
    if (level >= 1){
      const r = midi(B[0]), o = r + 12, f = midi(B[1]);
      [[0, r], [2, r], [4, o], [6, r], [8, r], [10, r], [12, o], [14, f]].forEach(([s, m], i) => ev.push({t:at(s), k:'bass', m, d:at(2) * .85, v:i === 0 ? 1 : .78}));
    } else if (b % 2 === 0) ev.push({t:0, k:'bass', m:midi(B[0]), d:FBAR * .9, v:.6});
    // lead
    let t = 0;
    for (const n of FMEL[b]){
      const d = n.l * F16;
      if (n.m !== null){
        if (level === 0){
          if (b >= 2 && b <= 3 || b >= 6) ev.push({t, k:'pipe', m:n.m, d:d * .93, v:.5, vib:n.l >= 3 ? 1 : 0});
        } else {
          ev.push({t, k:'lead', m:n.m, d:d * .8, v:level === 2 ? .85 : .7});
          if (level === 2) ev.push({t, k:'lead', m:n.m + 12, d:d * .7, v:.32});
          if (level >= 1 && (variant & 1) && b >= 4) ev.push({t, k:'pipe', m:n.m + 12, d:d * .9, v:.4, vib:n.l >= 3 ? 1 : 0});
        }
      }
      t += d;
    }
    const k = [1, 1.25, 1.2][level] || 1;            // contact and boss levels sit louder than the quiet field
    if (k !== 1) for (const e of ev) e.v *= k;
    return {len:FBAR, ev};
  }


  /* ---- the battle arrangement builder ----------------------------------- */
  // Used for the Jig, Embers, the Tankard and the March. Dust and Iron keeps its original fightBar above.
  const BASSN = {Am:['A2', 'E3'], F:['F2', 'C3'], C:['C3', 'G3'], G:['G2', 'D3'], Dm:['D2', 'A2'], D:['D2', 'A2'], E:['E2', 'B2'], Em:['E2', 'B2'], Bb:['Bb2', 'F3'], Gm:['G2', 'D3']};
  const STRUM = {Am:['A3', 'C4', 'E4'], F:['F3', 'A3', 'C4'], C:['C4', 'E4', 'G4'], G:['G3', 'B3', 'D4'], Dm:['D3', 'F3', 'A3'], D:['D4', 'F#4', 'A4'], E:['E3', 'G#3', 'B3'], Em:['E3', 'G3', 'B3'], Bb:['Bb3', 'D4', 'F4'], Gm:['G3', 'Bb3', 'D4']};
  const HATS = (n, a, b) => Array.from({length:n}, (_, i) => ['hat', i, i % 2 ? b : a]);
  function makeCombat(T){
    const total = T.order.length * 8, barLen = T.barU * T.u, half = T.barU / 2;
    return function(bi, level, variant){
      const gb = bi % total, si = (gb / 8) | 0, b = gb % 8, s = T.sect[T.order[si]], B = BASSN[s.ch[b]], ev = [], u = T.u, at = x => x * u;
      for (const [k, x, v] of T.drums[level] || []) ev.push({t:at(x), k, v});
      if (level === 2){
        for (const [x, v] of T.taiko) ev.push({t:at(x), k:'taiko', v});
        if (b % 2 === 1) ev.push({t:at(half), k:'taiko', v:.6});
        if (b === 7) for (const [x, v] of T.fill) ev.push({t:at(x), k:'snare', v}); else ev.push({t:at(T.barU - 1), k:'snare', v:.4});
      }
      if (level >= 1){
        const r = midi(B[0]), f = midi(B[1]);
        T.bassPat[level].forEach(([x, deg, len, v]) => ev.push({t:at(x), k:'bass', m:deg === 0 ? r : deg === 1 ? f : r + 12, d:at(len) * .85, v}));
      } else if (b % 2 === 0) ev.push({t:0, k:'bass', m:midi(B[0]), d:barLen * .9, v:.6});
      let t = 0; const mx = T.drive[level] || 99;
      for (const n of s.mel[b]){
        const d = n.l * u;
        if (n.m !== null){
          if (level === 0){ if (b % 4 >= 2) ev.push({t, k:'pipe', m:n.m, d:d * .93, v:.5, vib:n.l >= 3 ? 1 : 0}); }
          else {
            for (let o = 0; o < n.l; o += mx){                     // a long note is struck again, so it drives instead of droning
              const l = Math.min(mx, n.l - o), tt = t + o * u, dd = l * u, vv = o ? .85 : 1;
              ev.push({t:tt, k:'lead', m:n.m, d:dd * .8, v:(level === 2 ? .85 : .7) * vv});
              if (level === 2) ev.push({t:tt, k:'lead', m:n.m + 12, d:dd * .7, v:.32 * vv});
            }
            if ((variant & 1) && b >= 4) ev.push({t, k:'pipe', m:n.m + 12, d:d * .9, v:.4, vib:n.l >= 3 ? 1 : 0});
          }
        }
        t += d;
      }
      const k = [1, 1.25, 1.2][level] || 1; if (k !== 1) for (const e of ev) e.v *= k;
      return {len:barLen, ev};
    };
  }
  /* ---- the bard's arrangement builder: the battle melody on the lute, slower and stripped back --- */
  function makeBard(T){
    const total = T.order.length * 8, u = T.cu, barLen = T.barU * u;
    return function(bi, variant){
      const gb = bi % total, si = (gb / 8) | 0, b = gb % 8, s = T.sect[T.order[si]], cn = s.ch[b], B = BASSN[cn], ev = [], rep = si >= 1 || !!(variant & 1);
      let t = 0, first = true;
      for (const n of s.mel[b]){
        const d = n.l * u;
        if (n.m !== null){
          ev.push({t, k:'lute', m:n.m, d, v:first ? .92 : .78});
          if (n.l >= 6) ev.push({t:t + d / 2, k:'lute', m:n.m, d:d / 2, v:.5});                   // a long note is plucked again halfway
          if (rep && n.l >= 4 && n.m <= 81) ev.push({t:t + u, k:'lute', m:n.m + 12, d:d - u, v:.28});   // on the second time round he adds an octave echo (not above the lute's range)
          first = false;
        }
        t += d;
      }
      ev.push({t:0, k:'pluck', m:midi(B[0]), v:1}, {t:barLen / 2, k:'pluck', m:midi(B[1]), v:.6});
      if (rep && b % 2 === 0) STRUM[cn].forEach((n, i) => ev.push({t:0.02 + i * 0.035, k:'pluck', m:midi(n), v:.34}));
      ev.push({t:0, k:'thump', v:.28}, {t:barLen / 2, k:'thump', v:.16}, {t:barLen / 4, k:'tick', v:.1}, {t:barLen * 3 / 4, k:'tick', v:.1});
      return {len:barLen, ev};
    };
  }

  /* ---- Dust and Iron on the lute: the battle melody, two times round ---- */
  const ISECT = {A:{ch:FCH, mel:FMEL}}, IORDER = ['A', 'A'], ICU = 0.19;
  const IRON_BARD = makeBard({sect:ISECT, order:IORDER, barU:16, cu:ICU});

  /* ---- March of the Dust Cloaks (D minor, 4/4, a dotted march) ------------- */
  const MSECT = {
    A:{ch:'Dm Dm Bb F C Gm Am Dm', mel:[
      'D5:3 D5:1 F5:3 A5:1 G5:3 F5:1 E5:3 D5:1', 'A5:3 A5:1 G5:3 F5:1 E5:2 F5:2 D5:4', 'D5:3 F5:1 Bb5:3 A5:1 G5:3 F5:1 D5:4', 'C5:3 F5:1 A5:3 G5:1 F5:2 E5:2 F5:4',
      'E5:3 G5:1 C6:3 A5:1 G5:3 E5:1 C5:4', 'D5:3 G5:1 Bb5:3 A5:1 G5:3 F5:1 D5:4', 'E5:3 A5:1 C6:3 A5:1 E5:3 F5:1 E5:4', 'A5:3 G5:1 F5:3 E5:1 D5:8']},
    B:{ch:'Gm Gm Dm Dm Bb C Am Dm', mel:[
      'G5:3 Bb5:1 D6:3 C6:1 Bb5:3 A5:1 G5:4', 'Bb5:3 D6:1 F6:3 E6:1 D6:3 C6:1 Bb5:4', 'A5:3 D6:1 F6:3 E6:1 D6:2 C6:2 A5:4', 'F5:3 A5:1 D6:3 C6:1 A5:3 F5:1 D5:4',
      'D6:3 D6:1 F6:3 D6:1 Bb5:2 C6:2 D6:4', 'E6:3 D6:1 C6:3 G5:1 E5:2 G5:2 C6:4', 'C6:3 A5:1 E5:3 A5:1 C6:3 D6:1 E6:4', 'F6:3 E6:1 D6:3 C6:1 D6:8']},
    A2:{ch:'Dm Dm Bb F C Gm Am Dm', mel:[
      'D5:3 D5:1 F5:3 A5:1 A5:3 G5:1 F5:3 A5:1', 'D6:3 C6:1 A5:3 F5:1 E5:2 F5:2 D5:4', 'D5:3 F5:1 Bb5:3 D6:1 C6:3 Bb5:1 A5:4', 'C5:3 F5:1 A5:3 C6:1 A5:2 G5:2 F5:4',
      'E5:3 G5:1 C6:3 E6:1 D6:3 C6:1 G5:4', 'Bb5:3 A5:1 G5:3 D5:1 G5:2 A5:2 Bb5:4', 'C6:3 A5:1 E5:3 A5:1 C6:2 D6:2 E6:4', 'F6:3 E6:1 D6:3 A5:1 D6:8']}
  };
  for (const k in MSECT){ MSECT[k].mel = MSECT[k].mel.map(seq); MSECT[k].ch = MSECT[k].ch.split(' '); }
  const MORDER = ['A', 'B', 'A2'], MCU = 0.2;
  const MARCH_BARD = makeBard({sect:MSECT, order:MORDER, barU:16, cu:MCU});

  /* ---- the battle arrangements of the camp tunes and the March ------------- */
  const FILL16 = [[12, .5], [13, .58], [14, .66], [15, .8]];
  const JIG_C = makeCombat({sect:SECT, order:CAMP_ORDER, barU:6, u:0.15, drive:{1:6, 2:3}, taiko:[[0, .85]], fill:[[3, .55], [4, .67], [5, .79]],
    drums:{0:[['thump', 0, .55], ['thump', 3, .38]],
           1:[['kick', 0, .9], ['snare', 3, .7], ['hat', 1, .3], ['hat', 2, .3], ['hat', 4, .3], ['hat', 5, .3]],
           2:[['kick', 0, 1], ['kick', 2, .7], ['kick', 5, .7], ['snare', 3, .9]].concat(HATS(6, .42, .2))},
    bassPat:{1:[[0, 0, 2, 1], [3, 1, 2, .85]], 2:[[0, 0, 2, 1], [2, 0, 1, .7], [3, 1, 2, .9], [5, 0, 1, .7]]}});
  const EMBERS_C = makeCombat({sect:ESECT, order:EORDER, barU:8, u:0.19, drive:{1:4, 2:2}, taiko:[[0, .85]], fill:[[5, .55], [7, .8]],
    drums:{0:[['thump', 0, .55], ['thump', 4, .38]],
           1:[['kick', 0, .9], ['kick', 4, .8], ['snare', 2, .6], ['snare', 6, .7], ['hat', 1, .3], ['hat', 3, .3], ['hat', 5, .3], ['hat', 7, .3]],
           2:[['kick', 0, 1], ['kick', 3, .7], ['kick', 4, .85], ['kick', 7, .7], ['snare', 2, .85], ['snare', 6, .85]].concat(HATS(8, .42, .2))},
    bassPat:{1:[[0, 0, 3, 1], [4, 1, 3, .85]], 2:[[0, 0, 1, 1], [2, 0, 1, .7], [3, 2, 1, .7], [4, 1, 1, .9], [6, 0, 1, .7], [7, 2, 1, .7]]}});
  const PARTY_C = makeCombat({sect:PSECT, order:PORDER, barU:16, u:0.1, drive:{1:4, 2:4}, taiko:[[0, .85]], fill:FILL16,
    drums:{0:[['thump', 0, .55], ['thump', 8, .38]],
           1:[['kick', 0, .9], ['kick', 8, .8], ['snare', 4, .7], ['snare', 12, .7], ['hat', 2, .4], ['hat', 6, .4], ['hat', 10, .4], ['hat', 14, .4]],
           2:[['kick', 0, 1], ['kick', 4, .8], ['kick', 8, .9], ['kick', 12, .8], ['kick', 14, .6], ['snare', 4, .8], ['snare', 12, .8]].concat(HATS(16, .35, .16))},
    bassPat:{1:[[0, 0, 2, 1], [4, 0, 2, .7], [8, 1, 2, .9], [12, 0, 2, .7]], 2:[[0, 0, 2, 1], [2, 0, 1, .65], [4, 2, 2, .8], [6, 0, 1, .65], [8, 1, 2, .95], [10, 0, 1, .65], [12, 2, 2, .8], [14, 1, 2, .7]]}});
  const MARCH_C = makeCombat({sect:MSECT, order:MORDER, barU:16, u:0.11, drive:{1:4, 2:4}, taiko:[[0, .85]], fill:FILL16,
    drums:{0:[['thump', 0, .55], ['thump', 8, .38]],
           1:[['kick', 0, .9], ['kick', 6, .6], ['kick', 8, .9], ['snare', 4, .7], ['snare', 12, .7], ['hat', 2, .4], ['hat', 6, .4], ['hat', 10, .4], ['hat', 14, .4]],
           2:[['kick', 0, 1], ['kick', 3, .7], ['kick', 6, .7], ['kick', 8, 1], ['kick', 11, .7], ['kick', 14, .7], ['snare', 4, .85], ['snare', 12, .85]].concat(HATS(16, .42, .2))},
    bassPat:{1:[[0, 0, 3, 1], [6, 1, 2, .7], [8, 0, 3, .9], [14, 1, 2, .7]], 2:[[0, 0, 3, 1], [3, 0, 1, .6], [4, 2, 2, .8], [6, 1, 2, .7], [8, 0, 3, .95], [11, 0, 1, .6], [12, 2, 2, .8], [14, 1, 2, .7]]}});

  /* ---- the song table ---------------------------------------------------- */
  const DR = (g, o) => ({g, o});
  const DR_A = DR(.1, [['triangle', 33, .6], ['sine', 45, .25]]), DR_G = DR(.1, [['triangle', 31, .6], ['sine', 43, .25]]), DR_D = DR(.1, [['triangle', 26, .6], ['sine', 38, .25]]);
  const SONGS = {};
  const tune = (id, name, blurb, battle, camp, combat) => { SONGS[id] = {id, name, blurb, battle, camp, combat, bars:camp.bars, len:camp.len, beat:camp.beat, trim:camp.trim, fn:camp.fn}; };
  tune('jig', 'The Campfire Jig', 'A slow pipe jig on whistle and lute. The old favourite.', 'The jig at a gallop, with drums, bass and a synth lead.',
    {bars:CAMP_BARS, len:CBAR, beat:C8, trim:0.5, spread:.08, drone:DR(.2, [['sine', 45, .5], ['sine', 52, .3], ['triangle', 45.07, .12, 5]]), fn:campBar},
    {bars:32, len:6 * 0.15, trim:1, drone:DR_A, fn:JIG_C});
  tune('embers', 'Embers', 'Slow and mellow: a soft whistle over a drifting lute, for tired boots and a low fire.', 'The fire lit: a pulsing bass and a hard lead.',
    {bars:EMBERS_BARS, len:EBAR, beat:E8, trim:0.46, spread:.08, drone:DR(.12, [['sine', 45, .5], ['sine', 52, .3]]), fn:embersBar},
    {bars:24, len:8 * 0.19, trim:1, drone:DR_A, fn:EMBERS_C});
  tune('party', 'The Full Tankard', 'A fast fiddle reel with stamping and clapping. Bring a drink.', 'The reel with a stomping kick and a synth lead.',
    {bars:PARTY_BARS, len:PBAR, beat:P16 * 2, trim:0.9, spread:.06, drone:DR(0, []), fn:partyBar},
    {bars:32, len:16 * 0.1, trim:1, drone:DR_G, fn:PARTY_C});
  tune('iron', 'Dust and Iron', 'The battle theme, slowed right down: the bard plucks the melody out on his lute.', 'The original battle theme.',
    {bars:16, len:16 * ICU, beat:ICU * 2, trim:1.2, spread:.16, drone:DR(.1, [['sine', 45, .5], ['sine', 52, .28]]), fn:IRON_BARD},
    {bars:FBARS, len:FBAR, trim:1, drone:DR_A, fn:fightBar});
  tune('march', 'March of the Dust Cloaks', 'A slow march in D minor, plucked out on the lute.', 'A drum-led march with a synth lead and a heavy bass.',
    {bars:24, len:16 * MCU, beat:MCU * 2, trim:1.2, spread:.16, drone:DR(.1, [['sine', 38, .5], ['sine', 45, .28]]), fn:MARCH_BARD},
    {bars:24, len:16 * 0.11, trim:1, drone:DR_D, fn:MARCH_C});
  const SONG_IDS = ['jig', 'embers', 'party', 'iron', 'march'];

  const bar = (track, bi, level, variant, song) => track === 'camp' ? (SONGS[song || 'jig'] || SONGS.jig).camp.fn(bi, variant | 0) : (SONGS[song || 'iron'] || SONGS.iron).combat.fn(bi, level | 0, variant | 0);

  /* ---- voices (Web Audio) ----------------------------------------------- */
  const M = {song:'jig', shuf:'jig', fsong:'iron', lastFight:'iron', pk:1, noteQ:[], ac:null, comp:null, out:null, bus:null, noise:null, track:null, bar:0, nextT:0, variant:0, level:0, lastUp:0, restartAt:0, timer:0, started:false, started0:false, hidden:false};

  function osc(type, f, t){ const o = M.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
  function gainEnv(g, t, a, peak, hold, rel){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + Math.max(a, hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, hold) + rel);
  }
  function filt(type, f, q){ const b = M.ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; }
  function noiseBurst(t, dur, vol, type, f, q){
    const ac = M.ac, s = ac.createBufferSource(), fl = filt(type, f, q), g = ac.createGain();
    s.buffer = M.noise; s.loop = true; s.connect(fl); fl.connect(g); g.connect(M.bus.g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  const V = {
    pipe(t, e){
      const ac = M.ac, f = hz(e.m), d = Math.max(0.08, e.d), g = ac.createGain(), lp = filt('lowpass', 3400, 0.5);
      const o1 = osc('sine', f, t), o2 = osc('triangle', f * 2, t), g2 = ac.createGain(); g2.gain.value = 0.13;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
      gainEnv(g, t, 0.035, 0.36 * e.v, d - 0.03, 0.09);
      if (e.vib && d > 0.3){
        const l = osc('sine', 5.3, t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + Math.min(0.35, d * .7));
        l.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune); l.start(t); l.stop(t + d + 0.12);
      }
      o1.start(t); o2.start(t); o1.stop(t + d + 0.14); o2.stop(t + d + 0.14);
      noiseBurst(t, 0.05, 0.05 * e.v, 'bandpass', f * 3, 2.5);                                 // chiff
      noiseBurst(t + 0.03, Math.min(d, 0.6), 0.012 * e.v, 'bandpass', Math.min(5000, f * 2.2), 1.2);   // breath
    },
    cut(t, e){ const ac = M.ac, g = ac.createGain(), o = osc('sine', hz(e.m), t); o.connect(g); g.connect(M.bus.g); gainEnv(g, t, 0.006, 0.2 * e.v, e.d * .6, 0.02); o.start(t); o.stop(t + e.d + 0.05); },
    pluck(t, e){
      const ac = M.ac, f = hz(e.m), g = ac.createGain(), lp = filt('lowpass', 2300, 0.6), o1 = osc('triangle', f, t), o2 = osc('sine', f * 2, t), g2 = ac.createGain(); g2.gain.value = 0.22;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * e.v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o1.start(t); o2.start(t); o1.stop(t + 0.6); o2.stop(t + 0.6);
    },
    thump(t, e){
      const ac = M.ac, o = osc('sine', 118, t), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
      o.connect(g); g.connect(M.bus.g); g.gain.setValueAtTime(0.5 * e.v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24); o.start(t); o.stop(t + 0.26);
      noiseBurst(t, 0.04, 0.2 * e.v, 'lowpass', 800, 0.7);
    },
    tick(t, e){ noiseBurst(t, 0.035, 0.16 * e.v, 'bandpass', 2300, 1.2); },
    kick(t, e){
      const ac = M.ac, o = osc('sine', 145, t), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      o.connect(g); g.connect(M.bus.g); g.gain.setValueAtTime(0.7 * e.v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.start(t); o.stop(t + 0.24);
    },
    snare(t, e){
      const ac = M.ac, o = osc('triangle', 190, t), g = ac.createGain(); o.connect(g); g.connect(M.bus.g);
      g.gain.setValueAtTime(0.24 * e.v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.start(t); o.stop(t + 0.1);
      noiseBurst(t, 0.15, 0.36 * e.v, 'bandpass', 1900, 0.7);
    },
    hat(t, e){ noiseBurst(t, 0.04, 0.11 * e.v, 'highpass', 7000, 0.7); },
    taiko(t, e){
      const ac = M.ac, o = osc('sine', 98, t), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(46, t + 0.42);
      o.connect(g); g.connect(M.bus.g); g.gain.setValueAtTime(0.75 * e.v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.start(t); o.stop(t + 0.62);
      noiseBurst(t, 0.1, 0.28 * e.v, 'lowpass', 420, 0.7);
    },
    lead(t, e){
      const ac = M.ac, f = hz(e.m), d = Math.max(0.05, e.d), g = ac.createGain(), lp = filt('lowpass', 2700, 1.4), o1 = osc('sawtooth', f, t), o2 = osc('square', f * 1.004, t), g2 = ac.createGain(); g2.gain.value = 0.45;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
      gainEnv(g, t, 0.008, 0.2 * e.v, d * .8, 0.06); o1.start(t); o2.start(t); o1.stop(t + d + 0.1); o2.stop(t + d + 0.1);
    },
    bass(t, e){
      const ac = M.ac, f = hz(e.m), d = Math.max(0.08, e.d), g = ac.createGain(), lp = filt('lowpass', 460, 0.9), o1 = osc('sawtooth', f, t), o2 = osc('sine', f, t), g2 = ac.createGain(); g2.gain.value = 0.9;
      o1.connect(lp); lp.connect(g); o2.connect(g2); g2.connect(g); g.connect(M.bus.g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42 * e.v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o1.start(t); o2.start(t); o1.stop(t + d + 0.05); o2.stop(t + d + 0.05);
    }
  };

  V.fiddle = function(t, e){
    const ac = M.ac, f = hz(e.m), d = Math.max(0.05, e.d), g = ac.createGain(), lp = filt('lowpass', 3000, 0.9), o1 = osc('sawtooth', f, t), o2 = osc('sawtooth', f * 1.006, t), g2 = ac.createGain(); g2.gain.value = 0.6;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
    gainEnv(g, t, 0.03, 0.17 * e.v, d * 0.85, 0.06);
    if (e.vib && d > 0.25){ const l = osc('sine', 5.8, t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + 0.3); l.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune); l.start(t); l.stop(t + d + 0.12); }
    o1.start(t); o2.start(t); o1.stop(t + d + 0.12); o2.stop(t + d + 0.12);
    noiseBurst(t, 0.04, 0.03 * e.v, 'bandpass', f * 2, 1.0);                       // bow on string
  };
  V.pad = function(t, e){
    const ac = M.ac, f = hz(e.m), d = Math.max(0.4, e.d), g = ac.createGain(), lp = filt('lowpass', 1300, 0.6), o1 = osc('triangle', f, t), o2 = osc('sine', f * 1.003, t), g2 = ac.createGain(); g2.gain.value = 0.6;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(M.bus.g);
    gainEnv(g, t, 0.5, 0.1 * e.v, d - 0.25, 0.7); o1.start(t); o2.start(t); o1.stop(t + d + 0.75); o2.stop(t + d + 0.75);
  };
  V.clap = function(t, e){ noiseBurst(t, 0.06, 0.38 * e.v, 'bandpass', 1400, 0.9); noiseBurst(t + 0.011, 0.05, 0.22 * e.v, 'bandpass', 1700, 0.9); };

  V.lute = function(t, e){
    const ac = M.ac, f = hz(e.m), d = Math.max(0.12, e.d), life = Math.min(1.7, 0.4 + d * 1.1), g = ac.createGain(), lp = filt('lowpass', 4200, 0.7);
    const o1 = osc('triangle', f, t), o2 = osc('sine', f * 2, t), o3 = osc('sawtooth', f, t), g2 = ac.createGain(), g3 = ac.createGain(); g2.gain.value = 0.28; g3.gain.value = 0.1;
    o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(lp); lp.connect(M.bus.g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.36 * e.v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + life);
    lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(1500, t + Math.min(0.6, life));
    o1.start(t); o2.start(t); o3.start(t); o1.stop(t + life + 0.05); o2.stop(t + life + 0.05); o3.stop(t + life + 0.05);
    noiseBurst(t, 0.03, 0.05 * e.v, 'bandpass', Math.min(6000, f * 3.5), 1.6);                       // the pick
  };

  /* ---- buses, drones and track changes ------------------------------------ */
  function newBus(track, t, fadeIn, song){
    const ac = M.ac, S = SONGS[song] || SONGS.jig, A = track === 'camp' ? S.camp : S.combat, g = ac.createGain(), bus = {g, oscs:[], track};
    g.connect(M.comp); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(A.trim, t + fadeIn);
    const droneG = ac.createGain(); droneG.connect(g); bus.droneG = droneG; droneG.gain.value = A.drone.g;
    for (const [type, m, vol, det] of A.drone.o){
      const o = osc(type, hz(m), t), og = ac.createGain(); og.gain.value = vol; o.connect(og); og.connect(droneG); if (det) o.detune.setValueAtTime(det, t); o.start(t); bus.oscs.push(o);
    }
    return bus;
  }
  function fadeBus(bus, t, dur){
    if (!bus) return;
    try { bus.g.gain.cancelScheduledValues(t); bus.g.gain.setValueAtTime(Math.max(0.0001, bus.g.gain.value), t); bus.g.gain.linearRampToValueAtTime(0.0001, t + dur); } catch (e) {}
    for (const o of bus.oscs){ try { o.stop(t + dur + 0.1); } catch (e) {} }
    setTimeout(() => { try { bus.g.disconnect(); } catch (e) {} }, (dur + 0.5) * 1000);
  }
  // The bard never plays a tune the same way twice: each pass is a little faster or slower than the last.
  function passTempo(){
    const S = SONGS[M.song] || SONGS.jig, sp = S.camp.spread, last = M.pk || 1;
    let k = 1 + sp * (Math.random() * 2 - 1);
    if (Math.abs(k - last) < sp * 0.4) k = last >= 1 ? 1 - sp * (0.5 + 0.5 * Math.random()) : 1 + sp * (0.5 + 0.5 * Math.random());
    return k;
  }
  // In battle the tempo follows the Game speed setting: Steady and Slow slow the music with the game.
  function fightK(){ const sp = (typeof settings === 'function' && settings().speed) || 100; return 100 / Math.max(50, Math.min(130, sp)); }
  function combatTune(){
    const c = campSetting();
    if (SONGS[c]) return c;
    if (c === 'shuffle'){ const o = SONG_IDS.filter(x => x !== M.lastFight); return o[Math.random() * o.length | 0]; }
    return 'iron';
  }
  function switchTo(track, song){
    const ac = M.ac, now = ac.currentTime;
    if (M.bus) fadeBus(M.bus, now, track === 'fight' ? 0.5 : 1.2);
    M.noteQ.length = 0; M.barQ = [];   /* Index 41 */
    M.track = track; M.bar = 0; M.level = 0;
    if (track === 'camp'){
      M.song = song || M.song;
      if (M.song === 'off'){ M.bus = null; M.restartAt = Infinity; return; }
      M.pk = passTempo();
    } else { M.fsong = combatTune(); M.lastFight = M.fsong; }
    const lead = track === 'fight' ? 0.12 : 1.0;
    M.nextT = now + lead; M.bus = newBus(track, now + lead - 0.02, track === 'fight' ? 0.2 : 1.6, track === 'camp' ? M.song : M.fsong);
  }

  /* ---- reading the game ------------------------------------------------- */
  function wantTrack(){ return (typeof G !== 'undefined' && G && !G.over) ? 'fight' : 'camp'; }
  function fightLevel(){
    const L = G && G.leader; if (!L) return 0;
    let near = 0, boss = false;
    for (const e of G.enemies || []){
      if (e.dormant || e.broken) continue;
      const d = Math.hypot(e.x - L.x, e.y - L.y);
      if (d < 420) near++;
      if (d < 700 && typeof BESTIARY !== 'undefined' && BESTIARY[e.k] && BESTIARY[e.k].boss) boss = true;
    }
    const hurt = L.con <= Math.max(1, Math.floor(L.maxCon / 3)) || !!G.broken;
    let lv = 0;
    if (near > 0 || (G.frame - G.lastContact) < 150) lv = 1;
    if (boss || near >= 7 || (hurt && near > 0)) lv = 2;
    return lv;
  }
  const DISABLED = true;                                             // R1 (Patrick, 20 Nov): music out of the game completely; SFX stay
  function vol(){
    if (DISABLED) return 0;
    const s = (typeof settings === 'function') ? settings() : {volume:60};
    const m = s.music === undefined ? 50 : s.music;
    return Math.max(0, Math.min(1, (m / 100) * ((s.volume === undefined ? 60 : s.volume) / 100)));
  }

  /* ---- which camp tune ---------------------------------------------------- */
  const campSetting = () => (typeof settings === 'function') ? settings().campSong : undefined;
  function chosenSong(){
    const c = campSetting();
    if (SONGS[c]) return c;
    if (c === 'shuffle') return SONGS[M.shuf] ? M.shuf : 'jig';
    if (c === 'off') return 'off';
    return 'jig';                                                  // never chosen: the old behaviour
  }
  function nextShuffle(){ const o = SONG_IDS.filter(x => x !== M.shuf); return o[Math.random() * o.length | 0]; }
  const combatName = () => { const c = campSetting(); return SONGS[c] ? SONGS[c].name : c === 'shuffle' ? 'a different tune each contract' : SONGS.iron.name; };

  /* ---- the scheduler ------------------------------------------------------ */
  const SCALE_D = {pipe:1, fiddle:1, lead:1, bass:1, pad:1, lute:1, bowed:1, gurdy:1, bell:1, drone:1 /* MOOD-SCALE: js/audio/mood.js voices follow the tempo spread; ROLLBACK: delete the four names after lute:1 */}, MELODY = {pipe:1, fiddle:1, lute:1};
  const scaled = (e, k) => { if (!SCALE_D[e.k] || e.d === undefined) return e; const o = Object.assign({}, e); o.d = e.d * k; return o; };
  function schedule(){
    const ac = M.ac, now = ac.currentTime;
    if (M.track === 'camp' && M.song === 'off') return;
    if (M.bus && M.nextT < now - 0.4) M.nextT = now + 0.05;      // the page was busy: skip ahead
    let guard = 0;
    while (M.bus && M.nextT < now + 0.7 && guard++ < 6){
      const camp = M.track === 'camp', S = SONGS[camp ? M.song : M.fsong] || SONGS.jig;
      if (camp && M.bar >= S.camp.bars){                         // one full pass, then a rest
        const c = campSetting(), gap = c === undefined ? 8 + Math.random() * 8 : c === 'shuffle' ? 4 + Math.random() * 3 : 2 + Math.random() * 1.5;
        fadeBus(M.bus, M.nextT, 2.2); M.bus = null; M.restartAt = M.nextT + 2.4 + gap; M.variant++;
        if (c === 'shuffle'){ M.shuf = nextShuffle(); M.song = M.shuf; }
        break;
      }
      const k = camp ? M.pk : fightK(), t0 = M.nextT;
      const b = camp ? S.camp.fn(M.bar, M.variant) : S.combat.fn(M.bar, M.level, M.variant + ((M.bar / S.combat.bars) | 0));
      for (const e of b.ev){ try { V[e.k](t0 + e.t * k, k === 1 ? e : scaled(e, k)); } catch (x) {} }
      if (camp && M.noteQ.length < 160) for (const e of b.ev.filter(e => MELODY[e.k] && e.d >= 0.1 && e.v >= .6).sort((a, c) => a.t - c.t)) M.noteQ.push({t:t0 + e.t * k, m:e.m, d:e.d * k});   // the main notes only, in time order, for the bard's floating notes
      if (!camp) M.bus.droneG.gain.setTargetAtTime([0.1, 0.05, 0.03][M.level], t0, 0.4);
      if (!camp){ (M.barQ || (M.barQ = [])).push({t:t0, len:b.len * k, song:M.fsong, id:M.barSeq = (M.barSeq || 0) + 1}); if (M.barQ.length > 6) M.barQ.shift(); }   /* Index 41: where the bar starts, for the dancing bard */
      M.nextT += b.len * k; M.bar++;
    }
    if (!M.bus && M.track === 'camp' && M.song !== 'off' && now >= M.restartAt){ M.bar = 0; M.pk = passTempo(); M.nextT = now + 0.3; M.bus = newBus('camp', now + 0.28, 1.6, M.song); }
  }
    function tick(){
    if (DISABLED) return;
    const ac = M.ac; if (!ac) return;
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (hidden && ac.state === 'running'){ try { ac.suspend(); } catch (e) {} return; }
    if (!hidden && ac.state === 'suspended'){ try { ac.resume(); } catch (e) {} }
    if (ac.state !== 'running') return;
    const v = vol(), paused = (typeof G !== 'undefined' && G && G.paused && !G.over) ? 0.35 : 1;
    M.out.gain.setTargetAtTime(v * paused * 0.5, ac.currentTime, 0.12);
    if (v < 0.005){ M.silent = true; return; }                  // muted: schedule nothing
    if (M.silent){ M.silent = false; if (M.bus) M.nextT = Math.max(M.nextT, ac.currentTime + 0.05); }
    const want = wantTrack();
    if (want !== M.track) switchTo(want, want === 'camp' ? chosenSong() : undefined);
    else if (M.track === 'camp'){ const cs = chosenSong(); if (cs !== M.song){ M.shuf = cs === 'off' ? M.shuf : (campSetting() === 'shuffle' ? M.shuf : cs); switchTo('camp', cs); } }
    if (M.track === 'fight'){
      const lv = fightLevel(), now = ac.currentTime;
      if (lv > M.level){ M.level = lv; M.lastUp = now; } else if (lv < M.level && now - M.lastUp > 5){ M.level = Math.max(lv, M.level - 1); M.lastUp = now; }
      else if (lv === M.level) M.lastUp = now;
    }
    schedule();
  }
  // For the Bard: which melody notes are due, and is the music actually sounding?
  function takeNotes(){
    const ac = M.ac; if (!ac) return [];
    const now = ac.currentTime, q = M.noteQ, out = [];
    while (q.length && q[0].t <= now){ const n = q.shift(); if (now - n.t < 0.6) out.push(n); }
    return out;
  }
  // Index 41: how far through the current battle bar the sound is (0 to 1), for the dancing bard
  function barNow(){
    const ac = M.ac; if (!ac || ac.state !== 'running' || M.track !== 'fight' || !M.bus || !M.barQ || !M.barQ.length || M.out.gain.value < 0.004) return null;
    const now = ac.currentTime; let cur = null; for (const q of M.barQ) if (q.t <= now) cur = q;
    if (!cur || now - cur.t > cur.len * 1.5) return null;
    return {ph:Math.min(0.9999, (now - cur.t) / cur.len), len:cur.len, song:cur.song, id:cur.id, level:M.level, now};
  }
  function playing(){ if (DISABLED) return false; const ac = M.ac; return !!(ac && ac.state === 'running' && M.track === 'camp' && M.bus && M.song !== 'off' && M.out.gain.value > 0.004); }
  function setSong(id){
    const s = (typeof settings === 'function') ? settings() : null; if (!s) return;
    s.campSong = id; if (id === 'shuffle') M.shuf = M.song === 'off' ? 'jig' : M.song;
    if (M.ac && M.track === 'camp' && !M.bus && id !== 'off') M.restartAt = 0;      // he was resting between verses: start now
    if (typeof saveMeta === 'function') saveMeta();
    if (M.ac && !DISABLED) tick();
  }
  function start(){
    if (DISABLED) return;
    if (M.ac){ if (M.ac.state === 'suspended' && !(typeof document !== 'undefined' && document.hidden)) try { M.ac.resume(); } catch (e) {} return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = new AC(); M.ac = ac;
      M.out = ac.createGain(); M.out.gain.value = 0.0001; M.out.connect(ac.destination);
      M.comp = ac.createDynamicsCompressor(); M.comp.threshold.value = -16; M.comp.ratio.value = 4; M.comp.attack.value = 0.01; M.comp.release.value = 0.25; M.comp.connect(M.out);
      M.noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = M.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      M.timer = setInterval(() => { try { tick(); } catch (e) {} }, 120);
      tick();
    } catch (e) { M.ac = null; }
  }
  if (!DISABLED && typeof window !== 'undefined' && window.addEventListener){
    for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, start);
    if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => { if (M.ac) tick(); });
  }
  return {disabled:DISABLED, _V:V /* Index 87 */, start, tick, bar, state:() => ({track:M.track, bar:M.bar, level:M.level, variant:M.variant, song:M.song, fsong:M.fsong, pk:M.pk}), _M:M, midi, hz, CAMP_BARS, FBARS, CBAR, FBAR, fightLevel, vol, wantTrack: () => (window.BARDBRAWL && BARDBRAWL.on()) ? 'fight' : wantTrack() /* INT-1 step 3: BBAUD's brawl cue folded in */, SONGS, SONG_IDS, takeNotes, playing, barNow, setSong, chosenSong, combatTune, combatName, passTempo, fightK, beat:() => (SONGS[M.song] || SONGS.jig).camp.beat * (M.pk || 1)};
})();

// The Music slider sits in Settings, beside Volume.   (Index 29)
if (!MUS.disabled){ const f = settingsHTML;
  settingsHTML = function(dark){
    const s = f(dark), m = settings().music === undefined ? 50 : settings().music;
    const ctl = `<label title="Music follows the Volume slider. 0 turns it off.">Music <input type="range" min="0" max="100" value="${m}" oninput="setSetting('music', +this.value)"></label>`;
    const i = s.lastIndexOf('</div>');
    return i < 0 ? s + ctl : s.slice(0, i) + ctl + s.slice(i);
  };
}
/* ===== END INDEX 29 ======================================================= */


