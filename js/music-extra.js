// js/music-extra.js
// Five extra songs for LISTENING ONLY, written to audits/music-style-guide.md.
// Loaded by music.html (into its hidden game frame) and nowhere else, so the game's own shuffle and camp
// menu are untouched. Each song is a pair, like the originals: a calm camp bar function and a three-level
// battle bar function, registered in MUS.SONGS / MUS.SONG_IDS (both are exposed by the engine).
// To put a song into the game, load this file from index.html after the MUS block and tell the Director
// (it changes the shuffle and the menu). To remove: delete this file and the loader line in music.html.
(function(){
  'use strict';
  if (typeof MUS === 'undefined' || !MUS.SONGS || window.MUSX) return;
  const midi = MUS.midi;
  const seq = s => s.trim().split(/\s+/).map(x => { const [n, l] = x.split(':'); return {m:n === 'r' ? null : midi(n), l:+l}; });

  // chord name -> [bass, fifth, upper third, upper fifth] (same layout as the engine's CHORD tables)
  const PCS = {C:0, D:2, E:4, F:5, G:7, A:9, B:11, Bb:10};
  function chord(name){
    const minor = /m$/.test(name), root = PCS[name.replace(/m$/, '')];
    const b = 40 + ((root - 4 + 12) % 12);
    return [b, b + 7, b + 12 + (minor ? 3 : 4), b + 19];
  }
  const rootOf = name => chord(name)[0];

  // ---- the songs: melody sections (tokens 'NOTE:units'), chords per bar, order ------------------------
  const S = {};
  S.lantern = {key:'D minor', barU:6, camp:{u:.22, trim:.5, spread:.08, style:'jig'}, bat:{u:.15},
    order:['A', 'B', 'A2'],
    sect:{
      A:{ch:'Dm Dm C C Bb C Am Dm', mel:['D5:2 F5:1 A5:2 F5:1', 'E5:1 F5:1 E5:1 D5:3', 'C5:2 E5:1 G5:2 E5:1', 'D5:1 E5:1 D5:1 C5:3', 'Bb4:2 D5:1 F5:2 D5:1', 'C5:1 E5:1 G5:1 E5:3', 'A4:2 C5:1 E5:2 C5:1', 'D5:6']},
      B:{ch:'Gm Gm Dm Dm Bb F Am Dm', mel:['G5:2 Bb5:1 A5:2 G5:1', 'F5:1 G5:1 F5:1 E5:3', 'F5:2 A5:1 D6:2 A5:1', 'A5:1 G5:1 F5:1 E5:3', 'D5:2 F5:1 Bb5:2 F5:1', 'A5:1 G5:1 F5:1 A5:1 C6:2', 'E5:2 A5:1 C6:2 A5:1', 'A5:2 F5:1 D5:3']},
      A2:{ch:'Dm Dm C C Bb C Am Dm', mel:['D5:2 F5:1 A5:2 F5:1', 'E5:1 F5:1 E5:1 D5:3', 'C5:2 E5:1 G5:2 E5:1', 'D5:1 E5:1 D5:1 C5:3', 'Bb4:1 D5:1 F5:1 Bb5:3', 'A5:1 G5:1 F5:1 E5:1 D5:1 C5:1', 'A4:2 C5:1 E5:2 C5:1', 'D5:6']}}};
  S.barn = {key:'D major', barU:16, camp:{u:.115, trim:.9, spread:.06, style:'reel'}, bat:{u:.1},
    order:['A', 'B', 'A2'],
    sect:{
      A:{ch:'D D G D D G A D', mel:['F#5:2 A5:2 A5:2 F#5:2 D5:2 F#5:2 A5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 D6:2 A5:4', 'B5:2 G5:2 D5:2 G5:2 B5:2 D6:2 B5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:4 F#5:4',
        'F#5:2 A5:2 D6:2 A5:2 F#5:2 A5:2 D6:4', 'B5:2 D6:2 B5:2 G5:2 B5:2 G5:2 D5:4', 'C#6:2 A5:2 E5:2 A5:2 C#6:2 E6:2 C#6:4', 'D6:2 A5:2 F#5:2 A5:2 D6:8']},
      B:{ch:'Bm G D A Bm G A D', mel:['D6:2 B5:2 F#5:2 B5:2 D6:2 B5:2 D6:4', 'D6:2 B5:2 G5:2 B5:2 D6:2 B5:2 D6:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 D6:2 A5:4', 'E6:2 C#6:2 A5:2 C#6:2 E6:2 C#6:2 E6:4',
        'D6:2 B5:2 F#5:2 B5:2 D6:2 F#5:2 B5:4', 'G5:2 B5:2 D6:2 B5:2 G5:2 B5:2 D6:4', 'E6:2 C#6:2 A5:2 E5:2 A5:2 C#6:2 E6:4', 'D6:4 A5:2 F#5:2 D5:8']},
      A2:{ch:'D D G D D G A D', mel:['F#5:2 A5:2 A5:2 F#5:2 D5:2 F#5:2 A5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 D6:2 A5:4', 'B5:2 G5:2 D5:2 G5:2 B5:2 D6:2 B5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:4 F#5:4',
        'F#5:2 A5:2 D6:2 A5:2 F#5:2 D5:2 F#5:4', 'G5:2 B5:2 D6:2 B5:2 G5:2 B5:2 D6:4', 'C#6:2 A5:2 E5:2 A5:2 C#6:2 A5:2 E5:4', 'D5:2 F#5:2 A5:2 F#5:2 D5:8']}}};
  S.watch = {key:'E minor', barU:8, camp:{u:.42, trim:.46, spread:.08, style:'ballad', pad:true, soft:true}, bat:{u:.19},
    order:['A', 'B', 'A2'],
    sect:{
      A:{ch:'Em Em C C Am D Em Em', mel:['E5:4 G5:2 B5:2', 'A5:3 G5:1 E5:4', 'E5:2 G5:2 C6:2 B5:2', 'G5:4 E5:4', 'C6:3 B5:1 A5:2 E5:2', 'F#5:2 A5:2 D6:4', 'B5:3 A5:1 G5:2 F#5:2', 'E5:8']},
      B:{ch:'G G D D C C D Em', mel:['D6:4 B5:2 G5:2', 'A5:2 B5:2 D6:4', 'A5:4 F#5:2 A5:2', 'D6:3 C6:1 A5:4', 'G5:2 C6:2 E6:4', 'D6:2 C6:2 G5:4', 'F#5:2 A5:2 D6:2 A5:2', 'B5:8']},
      A2:{ch:'Em Em C C Am D Em Em', mel:['E5:4 G5:2 B5:2', 'D6:3 C6:1 B5:4', 'C6:2 B5:2 G5:2 E5:2', 'E5:4 G5:4', 'A5:3 C6:1 E6:4', 'D6:3 A5:1 F#5:4', 'G5:2 B5:2 A5:2 F#5:2', 'E5:8']}}};
  S.ferry = {key:'A minor', barU:6, camp:{u:.25, trim:.46, spread:.08, style:'jig', pad:true, soft:true}, bat:{u:.17},
    order:['A', 'B', 'A2'],
    sect:{
      A:{ch:'Am Am G G F F Em Am', mel:['E5:3 C5:1 A4:2', 'E5:3 D5:1 C5:2', 'D5:3 B4:1 G4:2', 'B4:2 D5:2 G5:2', 'A5:3 F5:1 C5:2', 'C5:2 F5:2 A5:2', 'G5:3 E5:1 B4:2', 'A4:6']},
      B:{ch:'Dm Dm Am Am F G Em Am', mel:['F5:3 A5:1 D6:2', 'C6:3 A5:1 F5:2', 'E5:3 A5:1 C6:2', 'B5:3 A5:1 E5:2', 'A5:3 F5:1 C6:2', 'D6:3 B5:1 G5:2', 'G5:2 B5:2 E6:2', 'C6:2 B5:2 A5:2']},
      A2:{ch:'Am Am G G F F Em Am', mel:['E5:3 C5:1 A4:2', 'E5:3 D5:1 C5:2', 'D5:3 B4:1 G4:2', 'B4:2 D5:2 G5:2', 'A5:2 C6:2 A5:2', 'C5:2 F5:2 A5:2', 'G5:3 E5:1 B4:2', 'A4:6']}}};
  S.homecoming = {key:'C major', barU:8, camp:{u:.3, trim:.5, spread:.08, style:'ballad'}, bat:{u:.17},
    order:['A', 'B', 'A2'],
    sect:{
      A:{ch:'C C F C G Am F C', mel:['C5:2 E5:2 G5:2 E5:2', 'C6:4 G5:2 E5:2', 'A5:2 F5:2 C5:2 F5:2', 'E5:4 G5:4', 'D5:2 G5:2 B5:2 G5:2', 'C6:3 B5:1 A5:4', 'A5:2 G5:2 F5:2 E5:2', 'E5:2 D5:2 C5:4']},
      B:{ch:'Am F C G Am Dm G C', mel:['E5:2 A5:2 C6:4', 'C6:2 A5:2 F5:4', 'G5:2 E5:2 G5:2 C6:2', 'B5:3 A5:1 G5:4', 'A5:2 C6:2 E6:2 C6:2', 'D6:2 A5:2 F5:2 A5:2', 'B5:3 A5:1 G5:2 D5:2', 'E5:2 G5:2 C6:4']},
      A2:{ch:'C C F C G Am F C', mel:['C5:2 E5:2 G5:2 E5:2', 'C6:4 G5:2 E5:2', 'A5:2 F5:2 C5:2 F5:2', 'E5:4 G5:4', 'D5:2 G5:2 B5:2 D6:2', 'C6:3 B5:1 A5:2 E5:2', 'F5:2 A5:2 G5:2 E5:2', 'C5:2 E5:2 C5:4']}}};
  for (const id in S) for (const k in S[id].sect){ const s = S[id].sect[k]; s.mel = s.mel.map(seq); s.ch = s.ch.split(' '); }

  const INFO = {
    lantern:    ['The Lantern Road', 'A walking jig in D minor for a long night road: pipe and lute, one lamp ahead.', 'The jig at a steady march, drums and bass under a hard lead.', 'D3'],
    barn:       ['Barn Dance', 'A bright D major reel on the fiddle, stamping and clapping, for the harvest and the hall.', 'The reel with a stomping kick and a synth lead.', 'D3'],
    watch:      ['The Night Watch', 'Slow and low in E minor: a soft whistle over a rolling lute and a held pad, for the quiet hours on guard.', 'A slow, heavy pulse with a hard lead.', 'E3'],
    ferry:      ['The Dust Ferry', 'A rocking 6/8 in A minor, like a flat boat on slow water.', 'The boat in a storm: drums and bass, the tune pushed hard.', 'A3'],
    homecoming: ['Homecoming', 'A warm C major tune for getting back alive, the camp fire in sight.', 'The homecoming as a proud march with drums and a bright lead.', 'C3']
  };

  const DR = (g, o) => ({g, o});
  const droneCamp = id => { const r = rootOf(S[id].sect.A.ch[0]); return DR(.1, [['sine', r, .5], ['sine', r + 7, .28]]); };
  const droneBat = id => { const r = rootOf(S[id].sect.A.ch[0]); return DR(.1, [['triangle', r - 12, .6], ['sine', r, .25]]); };

  // ---- camp bar functions ---------------------------------------------------------------------------
  function melodyEv(s, b, u, voice, vibAt, base){
    const ev = []; let t = 0, prev = s.mel[b - 1] ? s.mel[b - 1][s.mel[b - 1].length - 1].m : null;
    s.mel[b].forEach((n, i) => {
      const d = n.l * u;
      if (n.m !== null){
        if (voice === 'pipe' && prev === n.m && n.l >= 1) ev.push({t:Math.max(0, t - .045), k:'cut', m:n.m + 2, d:.045, v:.4});
        ev.push({t, k:voice, m:n.m, d:d * .95, v:(i === 0 ? 1 : .85) * base, vib:n.l >= vibAt ? 1 : 0});
        prev = n.m;
      }
      t += d;
    });
    return ev;
  }
  function campFn(id){
    const T = S[id], C = T.camp, u = C.u, total = T.order.length * 8;
    return function(bi, variant){
      const gb = bi % total, s = T.sect[T.order[(gb / 8) | 0]], b = gb % 8, ch = chord(s.ch[b]), ev = [];
      if (C.style === 'jig'){                                         // 6 units: arpeggio and a quiet hand drum
        [[0, 0, 1], [1, 2, .5], [2, 3, .5], [3, 1, .85], [4, 2, .5], [5, 3, .5]].forEach(([i, n, v]) => ev.push({t:i * u, k:'pluck', m:ch[n], v:v * (C.soft ? .6 : .8)}));
        ev.push({t:0, k:'thump', v:C.soft ? .4 : .75}, {t:3 * u, k:'thump', v:C.soft ? .22 : .5}, {t:2 * u, k:'tick', v:C.soft ? .15 : .35}, {t:5 * u, k:'tick', v:C.soft ? .14 : .3});
        if (C.pad) for (const n of [1, 2, 3]) ev.push({t:0, k:'pad', m:ch[n] - (n === 3 ? 12 : 0), d:6 * u * .98, v:.4});
        ev.push(...melodyEv(s, b, u, 'pipe', 2, .9));
      } else if (C.style === 'ballad'){                               // 8 units: a slow rolling lute
        [[0, 0, 1], [1, 2, .5], [2, 3, .55], [3, 2, .5], [4, 1, .8], [5, 2, .5], [6, 3, .55], [7, 2, .45]].forEach(([i, n, v]) => ev.push({t:i * u, k:'pluck', m:ch[n], v:v * .7}));
        if (C.pad) for (const n of [1, 2, 3]) ev.push({t:0, k:'pad', m:ch[n] - (n === 3 ? 12 : 0), d:8 * u * .98, v:.5});
        ev.push({t:0, k:'thump', v:C.soft ? .28 : .4}, {t:4 * u, k:'thump', v:C.soft ? .16 : .25}, {t:2 * u, k:'tick', v:.13}, {t:6 * u, k:'tick', v:.13});
        ev.push(...melodyEv(s, b, u, 'pipe', 3, .8));
      } else {                                                         // reel: 16 units, oom-pah, fiddle takes the tune
        const at = x => x * u, strum = (x, v, from) => [ch[1] + 12 - 7 + 0, ch[2], ch[3]].slice(from || 0).forEach((m, i) => ev.push({t:at(x) + i * .014, k:'pluck', m, v:v * (1 - i * .06)}));
        ev.push({t:at(0), k:'pluck', m:ch[0], v:1.1}, {t:at(8), k:'pluck', m:ch[1], v:.9}, {t:at(6), k:'pluck', m:ch[0], v:.5}, {t:at(14), k:'pluck', m:ch[1], v:.5});
        strum(4, .8); strum(12, .8); strum(2, .3, 1); strum(10, .3, 1);
        for (const [x, v] of [[0, .8], [6, .4], [8, .75], [14, .4]]) ev.push({t:at(x), k:'thump', v});
        ev.push({t:at(4), k:'clap', v:.7}, {t:at(12), k:'clap', v:.7});
        for (let x = 0; x < 16; x += 2) ev.push({t:at(x), k:'tick', v:x % 4 === 2 ? .3 : .16});
        ev.push(...melodyEv(s, b, u, 'fiddle', 4, .8));
        if (gb >= 8) for (const e of melodyEv(s, b, u, 'pipe', 99, .3)) if (e.k === 'pipe') ev.push(e);
      }
      return {len:T.barU * u, ev};
    };
  }

  // ---- battle bar functions (levels 0, 1, 2 as the engine asks) -------------------------------------
  const HATS = (n, a, b) => Array.from({length:n}, (_, i) => ['hat', i, i % 2 ? b : a]);
  const DRUMS = {
    6:  {0:[['thump', 0, .55], ['thump', 3, .35]],
         1:[['kick', 0, .9], ['snare', 3, .7], ['hat', 1, .35], ['hat', 2, .3], ['hat', 4, .35], ['hat', 5, .3]],
         2:[['kick', 0, 1], ['kick', 3, .8], ['snare', 3, .85], ['snare', 5, .5]].concat(HATS(6, .4, .2))},
    8:  {0:[['thump', 0, .55], ['thump', 4, .38]],
         1:[['kick', 0, .9], ['kick', 4, .8], ['snare', 2, .6], ['snare', 6, .6], ['hat', 1, .35], ['hat', 3, .35], ['hat', 5, .35], ['hat', 7, .35]],
         2:[['kick', 0, 1], ['kick', 3, .7], ['kick', 4, .85], ['kick', 7, .7], ['snare', 2, .85], ['snare', 6, .85]].concat(HATS(8, .42, .2))},
    16: {0:[['thump', 0, .55], ['thump', 8, .38]],
         1:[['kick', 0, .9], ['kick', 8, .8], ['snare', 4, .7], ['snare', 12, .7], ['hat', 2, .4], ['hat', 6, .4], ['hat', 10, .4], ['hat', 14, .4]],
         2:[['kick', 0, 1], ['kick', 4, .8], ['kick', 8, .9], ['kick', 12, .8], ['kick', 14, .6], ['snare', 4, .8], ['snare', 12, .8]].concat(HATS(16, .35, .16))}};
  const BASSP = {
    6:  {1:[[0, 0, 2, 1], [3, 1, 2, .8]], 2:[[0, 0, 1, 1], [1, 0, 1, .6], [3, 1, 1, .9], [4, 2, 2, .7]]},
    8:  {1:[[0, 0, 2, 1], [4, 1, 2, .8]], 2:[[0, 0, 2, 1], [2, 0, 1, .6], [4, 1, 2, .9], [6, 2, 1, .6]]},
    16: {1:[[0, 0, 2, 1], [4, 0, 2, .7], [8, 1, 2, .9], [12, 0, 2, .7]], 2:[[0, 0, 2, 1], [2, 0, 1, .65], [4, 2, 2, .8], [6, 0, 1, .65], [8, 1, 2, .95], [10, 0, 1, .65], [12, 2, 2, .8], [14, 1, 2, .7]]}};
  const FILL = {6:[[3, .55], [4, .67], [5, .79]], 8:[[4, .5], [5, .58], [6, .66], [7, .8]], 16:[[12, .5], [13, .58], [14, .66], [15, .8]]};
  const DRIVE = {6:{1:6, 2:3}, 8:{1:4, 2:2}, 16:{1:6, 2:3}};

  function combatFn(id){
    const T = S[id], U = T.barU, u = T.bat.u, total = T.order.length * 8, barLen = U * u, half = U / 2, at = x => x * u;
    return function(bi, level, variant){
      const gb = bi % total, s = T.sect[T.order[(gb / 8) | 0]], b = gb % 8, c = chord(s.ch[b]), ev = [];
      for (const [k, x, v] of DRUMS[U][level] || []) ev.push({t:at(x), k, v});
      if (level === 2){
        ev.push({t:0, k:'taiko', v:.85});
        if (b % 2 === 1) ev.push({t:at(half), k:'taiko', v:.6});
        if (b === 7) for (const [x, v] of FILL[U]) ev.push({t:at(x), k:'snare', v}); else ev.push({t:at(U - 1), k:'snare', v:.4});
      }
      if (level >= 1) BASSP[U][level].forEach(([x, deg, len, v]) => ev.push({t:at(x), k:'bass', m:deg === 0 ? c[0] : deg === 1 ? c[1] : c[0] + 12, d:at(len) * .85, v}));
      else if (b % 2 === 0) ev.push({t:0, k:'bass', m:c[0], d:barLen * .9, v:.6});
      let t = 0; const mx = DRIVE[U][level] || 99;
      for (const n of s.mel[b]){
        const d = n.l * u;
        if (n.m !== null){
          if (level === 0){ if (b % 4 >= 2) ev.push({t, k:'pipe', m:n.m, d:d * .93, v:.5, vib:n.l >= 3 ? 1 : 0}); }
          else {
            for (let o = 0; o < n.l; o += mx){
              const l = Math.min(mx, n.l - o), tt = t + o * u, dd = l * u, vv = o ? .85 : 1;
              ev.push({t:tt, k:'lead', m:n.m, d:dd * .8, v:(level === 2 ? .85 : .7) * vv});
              if (level === 2) ev.push({t:tt, k:'lead', m:n.m + 12, d:dd * .7, v:.32 * vv});
            }
          }
        }
        t += d;
      }
      const k = [1, 1.25, 1.2][level] || 1; if (k !== 1) for (const e of ev) e.v *= k;
      return {len:barLen, ev};
    };
  }

  // ---- register -------------------------------------------------------------------------------------
  const ids = [];
  for (const id in S){
    const T = S[id], I = INFO[id], C = T.camp, camp = {bars:T.order.length * 8, len:T.barU * C.u, beat:C.u * (T.barU === 6 ? 1 : 2), trim:C.trim, spread:C.spread, drone:droneCamp(id), fn:campFn(id)};
    const combat = {bars:T.order.length * 8, len:T.barU * T.bat.u, trim:1, drone:droneBat(id), fn:combatFn(id)};
    MUS.SONGS[id] = {id, name:I[0], blurb:I[1], battle:I[2], camp, combat, bars:camp.bars, len:camp.len, beat:camp.beat, trim:camp.trim, fn:camp.fn, extra:true};
    if (MUS.SONG_IDS.indexOf(id) < 0) MUS.SONG_IDS.push(id);
    ids.push(id);
  }

  // self-check: every melody bar adds up to the bar length, every chord is known, every note is in range
  function check(){
    const bad = [];
    for (const id in S) for (const k in S[id].sect){
      const s = S[id].sect[k];
      if (s.mel.length !== 8 || s.ch.length !== 8) bad.push(id + ' ' + k + ' needs 8 bars');
      s.mel.forEach((bar, i) => {
        const sum = bar.reduce((a, n) => a + n.l, 0);
        if (sum !== S[id].barU) bad.push(`${id} ${k} bar ${i + 1} is ${sum} units, wants ${S[id].barU}`);
        for (const n of bar) if (n.m !== null && (n.m < 55 || n.m > 88)) bad.push(`${id} ${k} bar ${i + 1} note ${n.m} out of range`);
      });
      s.ch.forEach(c => { if (PCS[c.replace(/m$/, '')] === undefined) bad.push(id + ' unknown chord ' + c); });
    }
    return bad;
  }
  window.MUSX = {ids, songs:S, check};
})();
