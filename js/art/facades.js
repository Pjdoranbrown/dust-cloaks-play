/* ===== INDEX F28: facade batch 1, "flat and drab" (Patrick, 2026-11-12, feedback theme 3) ======================
   Patrick: the buildings are "painted front on with one wall face" and "dull and drab", not just squished.
   The VO3 building painter already has a side wall and gable on the end toward the light, but paints that end
   darker than the front, so the three-quarter depth is hidden. Batch 1, all in building() (js/3d/vo3.js INDEX F28):
   - the side wall and gable are LIT (plaster mixed toward the light colour by K.sideLit), with a light wash at the
     corner fading to shade at the far end; the front wall turns further from the light (.38);
   - a warmer base palette for the house walls (K.pal: plaster, plasterD, timber, window), still Witcher-muted;
   - a roof colour per facility kind (K.roof[kind] = [colour, highlight]; thatch gold for the huts, red tile for
     the tavern, blue slate for the house, verdigris for the alchemist ...); the lit end of the roof takes the
     light's colour so the slope reads as a plane;
   - a shorter (K.shadowLen 0.3) and crisper (K.shadowBlur 1.5, was 3) silhouette shadow, so the shadow is the
     building's shape along the light, not a blob.
   Every facility that paints an inner house (huts, bunks, kitchen, tavern, house, barracks, armoury, blacksmith,
   leather, alchemy) and the field houses take it. Load after openair27.js.
   Batch 2 (same day): every other shell (towers, church, chapel, gate, kennels, stables, tents ...) takes the palette, a roof colour
   of its own (K.roof, through p.slate / p.shingle) and a source-atop light pass (lit side wash, far side shade) in facility();
   the arched windows and the house windows glow at dusk and night (light().elev < 0.5); the sprite cache keys on the elevation.
   No switch (F28.on was removed in INT-1, 2026-11-15); the old values in vo3.js go when this file is folded in. */
(function(){
  'use strict';
  if (!window.VO3 || !VO3.K) return;
  const F = window.F28 = {K: {
    sideLit: 0.22, shadowLen: 0.3, shadowBlur: 1.5,
    pal: {plaster: '#5a4a3c', plasterD: '#38302a', timber: '#2a2018', window: '#d4923c', stone: '#46423c', stoneL: '#645e56', stoneD: '#2a2824'},
    house: {huts: 1, bunks: 1, kitchen: 1, tavern: 1, house: 1, barracks: 1, armoury: 1, blacksmith: 1, leather: 1, alchemy: 1},   // kinds with an inner building(): they have their lit side wall already
    roof: {huts: ['#5a4a2c', '#8c7648'], bunks: ['#4c442e', '#766a4a'], kitchen: ['#4a3426', '#78583e'], tavern: ['#5e3a2e', '#8e5c46'],
           house: ['#2c3442', '#4c586c'], cells: ['#26292e', '#40454c'], barracks: ['#3e3a30', '#645c4a'], armoury: ['#343638', '#54585c'],
           blacksmith: ['#382c26', '#5c4a40'], leather: ['#4c3e2c', '#7a6446'], alchemy: ['#2e4038', '#507060'],
           tents: ['#4a4238', '#6e6252'], command: ['#44362c', '#6c584a'], merchant: ['#5a3c30', '#866050'], training: ['#44402e', '#68624a'], stables: ['#4e4630', '#78684a'], ranger: ['#3c4830', '#5c6c4a'],
           hospital: ['#4c4638', '#747058'], carpentry: ['#4a3a2c', '#745c48'], engineering: ['#383a3e', '#585c62'], magetower: ['#2a3a44', '#4a626e'], chapel: ['#303640', '#505a66'], church: ['#2e3640', '#4e5a68'],
           kennels: ['#4e4630', '#78684a'], gatehouse: ['#2e3034', '#4e5258'], watchtower: ['#3c3028', '#604e42'], trapyard: ['#443c2e', '#6a604a'], edelos: ['#343842', '#545a68']}
  }};
  F.apply = function(){
    VO3.K.facade = Object.assign({}, F.K); VO3.K.shadowBlur = F.K.shadowBlur;
    if (VO3.cache) for (const k in VO3.cache) delete VO3.cache[k];
    if (typeof CAMP !== 'undefined' && CAMP) CAMP.dirty = true; if (VO3.layers) VO3.layers = null;
  };
  F.apply();
  // mean colour of a sprite canvas inside a box (sprite px)
  const mean = (sp, x0, y0, x1, y1) => { const d = sp.img.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data; let n = 0, r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200){ n++; r += d[i]; g += d[i + 1]; b += d[i + 2]; } return n ? {n, r: r / n, g: g / n, b: b / n, l: (r + g + b) / n / 3} : null; };
  F.selfTest = function(){
    const out = []; const ok = (n, c) => out.push((c ? 'PASS ' : 'FAIL ') + n);
    const o = {w: 1, d: 1, roof: 48, foot: 1, door: 60, dw: 27, wall: 0.75, wide: 1.3};
    const h = VO3.sprite('building', 0, 'summer', Object.assign({fk: 'house'}, o)), t = VO3.sprite('building', 0, 'summer', Object.assign({fk: 'tavern'}, o));
    // the side wall is on the lit side: the lit-side third of the wall band is brighter than the far third
    const W = h.img.width, H = h.img.height, y0 = Math.round(H * 0.62), y1 = Math.round(H * 0.9), lt = VO3.K.facade && (window.STRUCT && STRUCT.light ? STRUCT.light.dir.x < 0 : true) ? 1 : -1;
    const a = mean(h, lt > 0 ? Math.round(W * 0.72) : 0, y0, lt > 0 ? W : Math.round(W * 0.28), y1), b = mean(h, lt > 0 ? 0 : Math.round(W * 0.72), y0, lt > 0 ? Math.round(W * 0.28) : W, y1);
    ok('F28: the wall end toward the light is brighter than the far end', a && b && a.l > b.l * 1.15);
    const rh = mean(h, Math.round(W * 0.3), Math.round(H * 0.25), Math.round(W * 0.6), Math.round(H * 0.4)), rt = mean(t, Math.round(W * 0.3), Math.round(H * 0.25), Math.round(W * 0.6), Math.round(H * 0.4));
    ok('F28: the house and tavern roofs differ in hue (blue slate v red tile)', rh && rt && rt.r - rt.b > rh.r - rh.b + 20);
    const m = VO3.sprite('fac', 0, 'summer', {k: 'magetower'}), mw = m.img.width, mh = m.img.height, mlt = (window.STRUCT && STRUCT.light ? STRUCT.light.dir.x < 0 : true) ? 1 : -1;
    const ma = mean(m, mlt > 0 ? Math.round(mw * 0.7) : Math.round(mw * 0.15), Math.round(mh * 0.5), mlt > 0 ? Math.round(mw * 0.85) : Math.round(mw * 0.3), Math.round(mh * 0.8)), mb = mean(m, mlt > 0 ? Math.round(mw * 0.15) : Math.round(mw * 0.7), Math.round(mh * 0.5), mlt > 0 ? Math.round(mw * 0.3) : Math.round(mw * 0.85), Math.round(mh * 0.8));   // the outer wall columns, clear of the door
    ok('F28 batch 2: the mage tower is lit on the side toward the light', ma && mb && ma.l > mb.l * 1.1);
    { const old = window.STRUCT && STRUCT.light; if (window.STRUCT){ STRUCT.light = {dir: {x: 0.85, y: 0.5}, elev: 0.3, colour: '#ffb070', shadow: '#3a2a52'}; } const ch = VO3.sprite('fac', 0, 'summer', {k: 'church'}); const d = ch.img.getContext('2d').getImageData(0, 0, ch.img.width, ch.img.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] > 180 && d[i + 1] > 110 && d[i + 1] < 170 && d[i + 2] < 90) n++; if (window.STRUCT) STRUCT.light = old; ok('F28 batch 2: at dusk the church windows glow amber', !window.STRUCT || n > 40); }
    F.apply();   // clears the sprite cache, so a later suite (S26, SW10) builds its sprites afresh
    return out;
  };
})();
