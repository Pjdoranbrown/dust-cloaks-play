/* ============================================================================
   INDEX GLYPHS-VEC: PL-1 items 1 and 2 (22 Nov 2026), the vector ability badge.
   The AD's glyph sheet (audits/art/glyph-sheet.md, v1 + v2: all 33 glyph names in js/) as Path2D layers in a
   24-unit box, and the badge builder: today's octagon in the item colour (corners cut at 2/13, ring 1/13) with the
   #2a2520 centre and a 1 px edge rgba(12,8,4,.9); the glyph fills 70% of the badge. A name with no path yet gets the
   badge with a plain dot in GLYPH_COLOURS[name], never the pixel glyph.
   Baked once per glyph, colour and device size (smoothing on), blitted 1:1 at whole device pixels by abilIconAt.
   abilIcon(glyph, col[, D]) (js/combat/abilities.js) returns the baked canvas; GLYPHVEC.selfTest() -> {ok, fails}.
============================================================================ */
(function(){
  'use strict';
  const GL = window.GLYPHS = Object.assign(window.GLYPHS || {}, {
    // v1: CARRIED's 11
    cross:  [['M9 3h6v6h6v6h-6v6h-6v-6H3V9h6z', '#e85050']],
    star:   [['M12 1.5l3 6.8 7.3.7-5.5 4.9 1.6 7.2L12 17.3l-6.4 3.8 1.6-7.2L1.7 9l7.3-.7z', '#ffe060'], ['M12 1.5l3 6.8 7.3.7-5.5 4.9L12 12z', '#fff2a8']],
    shield: [['M12 2l8.5 3v6c0 5.3-3.5 9.4-8.5 11.2C7 20.4 3.5 16.3 3.5 11V5z', '#d2834a'], ['M12 2v20.2C7 20.4 3.5 16.3 3.5 11V5z', '#a85e34'], ['M12 6.5a3 3 0 1 0 .01 0z', '#d8c8a8']],
    coin:   [['M12 2.5a9.5 9.5 0 1 0 .01 0z', '#e8c040'], ['M12 6a6 6 0 1 0 .01 0z', null, '#a07a1a', 1.6], ['M8.5 6.5a6.5 6.5 0 0 1 4-1.3', null, '#fff2b0', 1.6]],
    heart:  [['M12 21.2C4.8 16.2 2 12.4 2 8.6 2 5.5 4.4 3 7.4 3c2 0 3.6 1 4.6 2.7C13 4 14.6 3 16.6 3 19.6 3 22 5.5 22 8.6c0 3.8-2.8 7.6-10 12.6z', '#d04050'], ['M6.8 6.2c-1.2.2-2.2 1.2-2.4 2.6', null, '#ff9aa8', 1.8]],
    flame:  [['M12 1.5c1.2 4.2 6.5 6.8 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3.2 1.6-5.3 3.2-6.8 0 2.2.8 3.6 2 4.2.2-3.8.6-7 1.3-9.9z', '#ff8a2a'], ['M12 12c1.6 1.7 3.2 3.2 3.2 5.2a3.2 3.2 0 0 1-6.4 0c0-1.7 1.4-3.3 3.2-5.2z', '#ffd27a']],
    bomb:   [['M11 7.5a7 7 0 1 0 .01 0z', '#7a7a74'], ['M15 9.5l2.6-2.6', null, '#c8a060', 2], ['M19.5 2.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z', '#ffb040'], ['M8 11.8a2 2 0 1 0 .01 0z', '#c8c8c0']],
    eye:    [['M1.5 12c3.2-5.2 6.8-7.4 10.5-7.4s7.3 2.2 10.5 7.4c-3.2 5.2-6.8 7.4-10.5 7.4S4.7 17.2 1.5 12z', '#e8eef2'], ['M12 7.6a4.4 4.4 0 1 0 .01 0z', '#87ceeb'], ['M12 10a2 2 0 1 0 .01 0z', '#1a2a34'], ['M13.6 8.6a1 1 0 1 0 .01 0z', '#ffffff']],
    book:   [['M5 2.5h12.5a1.5 1.5 0 0 1 1.5 1.5v14H6.8A1.8 1.8 0 0 0 5 19.8z', '#c0683a'], ['M5 19.8A1.8 1.8 0 0 1 6.8 18H19v3.5H6.8A1.8 1.8 0 0 1 5 19.8z', '#ece0c4'], ['M9 6.5h6.5v2H9z', '#f0c96a']],
    horse:  [['M6 21.5l1.4-6.2C5.6 14 4.6 12 5.2 9.8L7.6 5.6 8.4 2l2 2.9c3.4.2 6.3 2 8 5.2l2.1 3.8-1.8 1.9-3.4-1.6-1.3 2.4 1.8 5z', '#cf9a5e'], ['M8.4 2l2 2.9-3.2 5.6-2-.7 2.4-4.2z', '#6a4020'], ['M16.4 9.4a.9.9 0 1 0 .01 0z', '#1a120a']],
    bars:   [['M3.5 2.5h17v2.8h-17zM3.5 18.7h17v2.8h-17z', '#8a8a86'], ['M5.8 5.3h2.6v13.4H5.8zM10.7 5.3h2.6v13.4h-2.6zM15.6 5.3h2.6v13.4h-2.6z', '#d8d8d2']],
    // v2: the other 22
    sword: [['M20.8 2.2l.9 4.4L10.4 17.9 6.1 13.6 17.4 2.3z', '#d3d9de'], ['M21.7 6.6L10.4 17.9 8.2 15.8 20.8 2.2z', '#9aa3ad'], ['M3.6 13.4l1.6-1.6 7 7-1.6 1.6z', '#d9b04a'], ['M6.6 17.4l-3 3', null, '#7a4a24', 2.4], ['M2.6 20a1.4 1.4 0 1 0 .01 0z', '#d9b04a']],
    dagger: [['M12 1.5l3.2 3.6v9.6H8.8V5.1z', '#d3d9de'], ['M12 1.5l3.2 3.6v9.6H12z', '#9aa3ad'], ['M5.8 14.5h12.4v2.3H5.8z', '#d9b04a'], ['M12 16.8v3.6', null, '#7a4a24', 3], ['M12 19.7a1.7 1.7 0 1 0 .01 0z', '#d9b04a']],
    disarm: [['M21.6 8.4l-.5 3L13.6 18.9l-3-3L18.1 8.4z', '#d3d9de'], ['M8.6 17.4l1.4-1.4 4.6 4.6-1.4 1.4z', '#d9b04a'], ['M10.3 19.7l-2.4 2.4', null, '#7a4a24', 2.4], ['M3 12A9 9 0 0 1 14 3.2', null, '#ffd040', 2.2], ['M15.8 1.2l.9 4.6-4.6-.6z', '#ffd040'], ['M3.4 15.4l3.2-3.2M3.4 12.2l3.2 3.2', null, '#e85050', 1.9]],
    anvil: [['M2.5 6.5h15c0 2.2 2 3.7 4.5 3.7v1.6h-4.6c-1.2 0-2.2 1-2.2 2.4V16h2.3v3.5H6V16h2.3v-1.8c0-1.6-1.6-3-4-3.2H2.5z', '#a8b0b8'], ['M2.5 6.5h15v1.8h-15z', '#dfe4e8'], ['M6 18h11.5v1.5H6z', '#6a7078']],
    arrows: [['M6 21V8M12 21V6M18 21V8', null, '#c8925a', 1.8], ['M6 3l2.6 5H3.4zM12 1l2.6 5H9.4zM18 3l2.6 5h-5.2z', '#e4e8ec'], ['M4.6 17.5h2.8v3.6H4.6zM10.6 17.5h2.8v3.6h-2.8zM16.6 17.5h2.8v3.6h-2.8z', '#e8dcc0']],
    bow: [['M7.5 2c7.5 4 7.5 16 0 20', null, '#c8864a', 2.6], ['M7.5 2v20', null, '#e8dcc0', 1], ['M3 12h14', null, '#d3d9de', 1.4], ['M21 12l-4 2.3v-4.6z', '#e4e8ec']],
    boot: [['M7 2h6.5v10l6.2 2.8c1.5.7 2.3 2 2.3 3.5V21H5v-6.3c0-1 .5-1.7 1.3-2.2L7 12z', '#b07440'], ['M5 19.2h17V21H5z', '#5a3418'], ['M7 2h6.5v2.6H7z', '#d8a068']],
    drop: [['M12 1.8c3.7 5 7.2 9.2 7.2 13.4a7.2 7.2 0 0 1-14.4 0c0-4.2 3.5-8.4 7.2-13.4z', '#d83a3a'], ['M8.6 15.4a3.6 3.6 0 0 0 2.2 3.2', null, '#ff9a9a', 1.7]],
    flag: [['M4 2h2.2v20H4z', '#d8b060'], ['M6.2 3H20l-3.2 4.6L20 12.2H6.2z', '#d05a46'], ['M6.2 7.6h10.6L20 12.2H6.2z', '#a8402e']],
    gear: [['M19.96 11.22L22.45 13.03L22.05 15.05L19.06 15.77L18.18 17.08L18.66 20.12L16.95 21.26L14.32 19.66L12.78 19.96L10.97 22.45L8.95 22.05L8.23 19.06L6.92 18.18L3.88 18.66L2.74 16.95L4.34 14.32L4.04 12.78L1.55 10.97L1.95 8.95L4.94 8.23L5.82 6.92L5.34 3.88L7.05 2.74L9.68 4.34L11.22 4.04L13.03 1.55L15.05 1.95L15.77 4.94L17.08 5.82L20.12 5.34L21.26 7.05L19.66 9.68z', '#b8c0c8'], ['M12 8.8a3.2 3.2 0 1 0 .01 0z', '#2a2520'], ['M12 4.6a7.4 7.4 0 0 1 5.6 2.6', null, '#e4e8ec', 1.4]],
    hide: [['M6 2.5c2 1.2 4 1.7 6 1.7s4-.5 6-1.7l1.3 4.3-2.1 2.2 1.6 5-1.6 2.2 1.1 4.8-3.2-1.6c-1 1-2 1.6-3.1 1.6s-2.1-.6-3.1-1.6L5.7 21l1.1-4.8-1.6-2.2 1.6-5-2.1-2.2z', '#d0a068'], ['M10 7.6a1.4 1.4 0 1 0 .01 0zM14.5 10.4a1.6 1.6 0 1 0 .01 0zM10.5 13.8a1.2 1.2 0 1 0 .01 0z', '#8a6236']],
    horn: [['M21.5 3.5c-1 6.5-5 10.5-11 11.2L4.3 18.6c-1 .6-2.3 0-2.3-1.2v-5c0-1 .9-1.7 1.9-1.5L10 12c5-.6 8.6-3.6 11.5-8.5z', '#ece0c4'], ['M8.6 11.5l1.6 3.6', null, '#c9a040', 2.2], ['M3 11v6.6', null, '#c9a040', 2]],
    mask: [['M3 5.5C6 4 9 3.5 12 3.5s6 .5 9 2c0 7.5-3.2 13.6-9 14.8C6.2 19.1 3 13 3 5.5z', '#d8ccb4'], ['M6.2 10.3c1.3-1.1 3.2-1.1 4.3.2-1.1 1.3-3 1.4-4.3-.2zM13.5 10.5c1.1-1.3 3-1.3 4.3-.2-1.3 1.6-3.2 1.5-4.3.2z', '#2a2520'], ['M9 15.5c2 1 4 1 6 0', null, '#8a7a64', 1.3]],
    mug: [['M5 6h11v14a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 20z', '#c89848'], ['M16 9h2.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H16', null, '#c89848', 2.2], ['M4.2 6.5C4 4.8 5.4 3.6 7 4c.9-1.2 3-1.4 4-.3 1.3-.8 3.2-.5 4 .6 1.3-.2 2.3.8 2 2.2z', '#f4ecd8'], ['M5 11h11v1.3H5zM5 16.5h11v1.3H5z', '#8a6020']],
    potion: [['M12 8.4a6.6 6.6 0 1 0 .01 0z', '#86cc62'], ['M10 3.5h4v6.2h-4z', '#cfe0d8'], ['M9.4 1.8h5.2v2.4H9.4z', '#b07a44'], ['M8.4 13.4a4 4 0 0 1 2-2.6', null, '#d8f8c0', 1.6]],
    saw: [['M2 8.5h15.5V15L16.6 17.3L15.6 15L14.7 17.3L13.7 15L12.8 17.3L11.8 15L10.9 17.3L9.9 15L9 17.3L8 15L7.1 17.3L6.1 15L5.2 17.3L4.2 15L3.3 17.3L2.3 15L2 15z', '#c8ced4'], ['M2 8.5h15.5v1.8H2z', '#e8ecef'], ['M17.5 6.5h4.5v11h-4.5z', '#b07440'], ['M18.8 9.2h1.9v5.4h-1.9z', '#2a2520']],
    skull: [['M12 2.5c-5 0-8.5 3.5-8.5 8 0 2.6 1.2 4.6 3 5.8v3.7h11v-3.7c1.8-1.2 3-3.2 3-5.8 0-4.5-3.5-8-8.5-8z', '#ece0c4'], ['M8.6 8.7a2.3 2.3 0 1 0 .01 0zM15.4 8.7a2.3 2.3 0 1 0 .01 0z', '#2a2520'], ['M12 13.6l1.3 2.3h-2.6z', '#2a2520'], ['M9.6 18v2M12 18v2M14.4 18v2', null, '#2a2520', 1.1]],
    snow: [['M12 12L22 12M18.5 12L20.73 9.7M18.5 12L20.73 14.3M12 12L17 20.66M15.25 17.63L18.35 18.41M15.25 17.63L14.38 20.71M12 12L7 20.66M8.75 17.63L9.62 20.71M8.75 17.63L5.65 18.41M12 12L2 12M5.5 12L3.27 14.3M5.5 12L3.27 9.7M12 12L7 3.34M8.75 6.37L5.65 5.59M8.75 6.37L9.62 3.29M12 12L17 3.34M15.25 6.37L14.38 3.29M15.25 6.37L18.35 5.59', null, '#bfe8ff', 1.8]],
    stake: [['M7.5 2h9v13.5L12 22.5 7.5 15.5z', '#c8864a'], ['M12 2h4.5v13.5L12 22.5z', '#94602e'], ['M7.5 6h9v2H7.5z', '#e8dcc0'], ['M12 21.8l1.6-2.8h-3.2z', '#d83a3a']],
    sun: [['M18.64 9.8L23.3 12L18.64 14.2zM18.26 15.14L19.99 19.99L15.14 18.26zM14.2 18.64L12 23.3L9.8 18.64zM8.86 18.26L4.01 19.99L5.74 15.14zM5.36 14.2L0.7 12L5.36 9.8zM5.74 8.86L4.01 4.01L8.86 5.74zM9.8 5.36L12 0.7L14.2 5.36zM15.14 5.74L19.99 4.01L18.26 8.86z', '#ffd040'], ['M12 6.4a5.6 5.6 0 1 0 .01 0z', '#ffe680'], ['M9 10.5a3.4 3.4 0 0 1 2.5-2', null, '#fff8d0', 1.4]],
    thorn: [['M4.5 21.5C7.5 15 9.5 10 17 3', null, '#8ab05a', 3], ['M8.4 15.8l-4.4-1 4.6-1.8zM11.2 10.8l4.4.2-3.2 2.4zM12.4 8.6l-3.6-2.2 4.4-.4zM15.4 5.2l3.8 1.6-4.4.8z', '#c8d890'], ['M17 3c1.6 1.1 3.6 1.1 4.7 0-.5 2.2-2.6 3.2-4.7 2.1z', '#8ab05a']],
    chain: [['M3.5 14.5a4 4 0 0 1 4-4h4.5a4 4 0 0 1 0 8H7.5a4 4 0 0 1-4-4z', null, '#c0c0c8', 2.4], ['M8 8.5a4 4 0 0 1 4-4h4.5a4 4 0 0 1 0 8H12a4 4 0 0 1-4-4z', null, '#e0e0e6', 2.4]]
  });
  const V = window.GLYPHVEC = {cache: new Map(), paths: new Map(), bakes: 0};
  const path = d => { let p = V.paths.get(d); if (!p){ p = new Path2D(d); V.paths.set(d, p); } return p; };
  // the badge + glyph into g at device size S (px); the AD's reference builder, with the outer edge inset half a pixel so the whole 1 px edge shows
  V.draw = function(g, S, name, col){
    const u = S / 13, c = 2 * u;
    const oct = o => { g.beginPath(); g.moveTo(c, o); g.lineTo(S - c, o); g.lineTo(S - o, c); g.lineTo(S - o, S - c); g.lineTo(S - c, S - o); g.lineTo(c, S - o); g.lineTo(o, S - c); g.lineTo(o, c); g.closePath(); };
    g.save(); g.imageSmoothingEnabled = true; g.lineJoin = 'round';
    oct(0.5); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(12,8,4,.9)'; g.lineWidth = 1; g.stroke();
    g.save(); g.translate(u, u); g.scale((S - 2 * u) / S, (S - 2 * u) / S); oct(0); g.restore(); g.fillStyle = '#2a2520'; g.fill();
    const k0 = S * 0.7, k = k0 / 24; g.translate((S - k0) / 2, (S - k0) / 2); g.scale(k, k);
    const L = GL[name];
    if (L) for (const [d, f, s, w] of L){ const p = path(d);
      if (f){ g.fillStyle = f; g.fill(p); }
      if (s){ g.strokeStyle = s; g.lineWidth = w; g.lineCap = 'round'; g.stroke(p); } }
    else { g.beginPath(); g.arc(12, 12, 4.5, 0, Math.PI * 2); g.fillStyle = (typeof GLYPH_COLOURS !== 'undefined' && GLYPH_COLOURS[name]) || '#fff'; g.fill(); }   // a name not drawn yet: a plain dot
    g.restore();
  };
  // the baked canvas, D device px square
  V.bake = function(name, col, D){
    D = Math.max(8, Math.round(D || 52)); const key = name + '|' + col + '|' + D;
    let cv = V.cache.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = D; V.draw(cv.getContext('2d'), D, name, col);
    V.cache.set(key, cv); V.bakes++; return cv;
  };
  // draw at (x, y), S units square, in the current transform: baked at the device size and blitted 1:1 on whole device pixels
  V.at = function(c2, name, col, x, y, S){
    const t = c2.getTransform(), k = Math.hypot(t.a, t.b) || 1, D = Math.round(S * k), cv = V.bake(name, col, D);
    if (t.b || t.c){ c2.save(); c2.imageSmoothingEnabled = true; c2.drawImage(cv, x, y, S, S); c2.restore(); return; }   // a rotated canvas: no 1:1, draw smooth
    c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.drawImage(cv, Math.round(t.a * x + t.e), Math.round(t.d * y + t.f)); c2.restore();
  };
  // PL-1 item 4 (AD 23 Nov): the bare glyph as a heraldic charge, no octagon or plate. Every layer filled (or stroked) in the tincture, the 2nd layer 20% darker, a 1 px edge rgba(12,8,4,.9). Baked at the device size, blitted 1:1.
  const rgbOf = col => { const t = document.createElement('canvas'); t.width = t.height = 1; const g = t.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
  const dark = (c, k) => 'rgb(' + c.map(v => Math.round(v * k)).join() + ')';
  V.chargeBake = function(name, col, D){
    D = Math.max(8, Math.round(D || 24)); const key = 'ch|' + name + '|' + col + '|' + D; let cv = V.cache.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = D; const g = cv.getContext('2d'), L = GL[name];
    if (!L){ g.beginPath(); g.arc(D / 2, D / 2, D * 0.3, 0, Math.PI * 2); g.fillStyle = col; g.fill(); V.cache.set(key, cv); V.bakes++; return cv; }
    const c = rgbOf(col), k = D * 0.86 / 24; g.save(); g.translate(D * 0.07, D * 0.07); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) L.forEach(([d, f, s, w], i) => { const p = path(d), tone = i === 1 ? dark(c, .8) : col;
      if (pass === 0){ g.strokeStyle = 'rgba(12,8,4,.9)'; g.lineWidth = (s ? w : 0) + 2 / k; g.stroke(p); }
      else { if (f){ g.fillStyle = tone; g.fill(p); } if (s){ g.strokeStyle = tone; g.lineWidth = w; g.stroke(p); } } });
    g.restore(); V.cache.set(key, cv); V.bakes++; return cv;
  };
  V.charge = function(c2, name, col, x, y, S){
    const t = c2.getTransform(), k = Math.hypot(t.a, t.b) || 1, cv = V.chargeBake(name, col, Math.round(S * k));
    if (t.b || t.c){ c2.save(); c2.imageSmoothingEnabled = true; c2.drawImage(cv, x, y, S, S); c2.restore(); return; }
    c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.drawImage(cv, Math.round(t.a * x + t.e), Math.round(t.d * y + t.f)); c2.restore();
  };
  V.selfTest = function(){
    const fails = [], ck = (ok, m) => { if (!ok) fails.push(m); };
    try {
      const used = ['bars', 'bomb', 'book', 'coin', 'cross', 'eye', 'flame', 'heart', 'horse', 'shield', 'star', 'anvil', 'arrows', 'boot', 'bow', 'chain', 'dagger', 'disarm', 'drop', 'flag', 'gear', 'hide',
        'horn', 'mask', 'mug', 'potion', 'saw', 'skull', 'snow', 'stake', 'sun', 'sword', 'thorn'];
      ck(used.every(n => GL[n] && GL[n].length), 'all 33 sheet glyphs have paths: ' + used.filter(n => !GL[n]).join());
      if (typeof GLYPH_COLOURS !== 'undefined') ck(Object.keys(GLYPH_COLOURS).every(n => GL[n]), 'every GLYPH_COLOURS name is drawn: ' + Object.keys(GLYPH_COLOURS).filter(n => !GL[n]).join());
      if (typeof LOOT !== 'undefined') ck(Object.values(LOOT).every(o => GL[o.glyph]), 'every LOOT glyph is drawn');
      if (typeof ABILITIES !== 'undefined') ck(Object.values(ABILITIES).every(o => !o.glyph || GL[o.glyph]), 'every ability glyph is drawn');
      const b0 = V.bakes, a = V.bake('coin', '#e8c040', 30), b = V.bake('coin', '#e8c040', 30);
      ck(a === b && V.bakes - b0 <= 1 && a.width === 30, 'baked once per glyph, colour and size');
      const px = a.getContext('2d').getImageData(0, 0, 30, 30).data, at = (x, y) => px[(y * 30 + x) * 4 + 3];
      ck(at(0, 0) === 0 && at(15, 15) === 255 && at(15, 0) > 0, 'octagon: corners clear, centre and edge drawn');
      const dot = V.bake('zz_new', '#ff0000', 30).getContext('2d').getImageData(15, 15, 1, 1).data;
      ck(dot[0] === 255 && dot[1] === 255 && dot[3] === 255, 'a name with no path gets a plain dot (white with no colour set)');
      const cv = document.createElement('canvas'); cv.width = cv.height = 80; const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0.4, 0.4);
      V.at(g, 'star', '#ffd040', 5, 5, 26); ck(V.cache.has('star|#ffd040|52'), 'at 2x a 26 unit icon bakes at 52 device px');
      const ch = V.chargeBake('shield', '#d2834a', 24), cpx = ch.getContext('2d').getImageData(0, 0, 24, 24).data;
      let chIn = false, chOut = false;
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (cpx[(y * 24 + x) * 4 + 3] === 255){ chIn = true; if (x < 1 || x >= 23 || y < 1 || y >= 23) chOut = true; }
      ck(ch.width === 24 && ch.height === 24 && chIn && !chOut, 'chargeBake: 24x24 with opaque pixels inside 0.07 inset + 1px edge');
      const unk = V.chargeBake('zz_charge', '#ff0000', 24).getContext('2d').getImageData(0, 0, 24, 24).data, uat = (x, y) => unk[(y * 24 + x) * 4 + 3];
      ck(uat(12, 12) === 255 && uat(0, 0) === 0 && uat(23, 0) === 0 && uat(0, 23) === 0 && uat(23, 23) === 0, 'chargeBake unknown name: round fallback opaque at centre, clear in corners');
      const cb0 = V.bakes, ch2 = V.chargeBake('shield', '#d2834a', 24);
      ck(ch === ch2 && V.bakes === cb0, 'chargeBake: second call returns cached canvas and V.bakes does not rise');
      let blit = null;
      V.charge({getTransform: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}), save(){}, restore(){}, setTransform(){}, drawImage(...args){ blit = args; }}, 'shield', '#d2834a', 10.6, 20.4, 32);
      ck(blit && blit.length === 3 && blit[1] === 11 && blit[2] === 20 && blit[0].width === 32 && blit[0].height === 32, 'charge on identity context: blits at rounded device spot and size');
    } catch (x) { fails.push('threw: ' + x.message); }
    return {ok: !fails.length, fails};
  };
})();
