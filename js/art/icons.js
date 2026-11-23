/* ============================================================================
   ICONS16 - F-16 painted item icons (Art & Interface). Replaces the 16x16 pixel gear icons (gearURL) with 96px painted ones:
   a dark leather-and-bronze tile, gradient-lit metal, wood and cloth, drawn as vector shapes in one palette.
   Used wherever gearURL is: Armoury and Quartermaster cards, the squad kit strip, gear cards.
   Loads after index.html; wraps window.gearURL. INT-1 group 13: no switch.
   STYLE SWITCH: ICONS16.rim = 'bronze' | 'steel' | 'none' (tile rim); ICONS16.tile = false draws the bare item.
============================================================================ */
(function(){
  'use strict';
  const IC = window.ICONS16 = {rim: 'bronze', tile: true, size: 96};
  const CACHE = {};
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(s => q.addColorStop(s[0], s[1])); return q; };
  const STEEL = (g, x0, x1) => lg(g, x0, 0, x1, 0, [[0, '#f1f5f8'], [.45, '#a3adb7'], [1, '#434a52']]);
  const GOLD = (g, y0, y1) => lg(g, 0, y0, 0, y1, [[0, '#f0d27a'], [.5, '#b98d2e'], [1, '#6b4c14']]);
  const WOOD = (g, x0, x1) => lg(g, x0, 0, x1, 0, [[0, '#b8895a'], [.5, '#7d5230'], [1, '#43291a']]);
  const LEATH = (g, y0, y1) => lg(g, 0, y0, 0, y1, [[0, '#a8703c'], [1, '#4a2c16']]);
  const path = (g, pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const rect = (g, x, y, w, h, f, ln) => { g.fillStyle = f; g.fillRect(x, y, w, h); if (ln){ g.strokeStyle = ln; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1); } };
  const ink = g => { g.strokeStyle = 'rgba(12,8,5,.85)'; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke(); };
  const tilt = (g, deg, fn) => { g.save(); g.translate(48, 48); g.rotate(deg * Math.PI / 180); g.translate(-48, -48); fn(); g.restore(); };
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  function sword(g, big){
    const w = big ? 7 : 5, tip = big ? 2 : 8, gy = big ? 66 : 62;
    path(g, [[48, tip], [48 + w, tip + 9], [48 + w, gy], [48 - w, gy], [48 - w, tip + 9]]); g.fillStyle = STEEL(g, 48 - w, 48 + w); g.fill(); ink(g);
    g.fillStyle = 'rgba(30,36,42,.55)'; g.fillRect(47, tip + 12, 2, gy - tip - 18);
    path(g, [[28, gy], [68, gy], [66, gy + 6], [30, gy + 6]]); g.fillStyle = GOLD(g, gy, gy + 6); g.fill(); ink(g);
    rect(g, 45, gy + 6, 6, 14, LEATH(g, gy + 6, gy + 20)); g.strokeStyle = 'rgba(0,0,0,.35)'; for (let y = gy + 9; y < gy + 19; y += 3){ g.beginPath(); g.moveTo(45, y); g.lineTo(51, y); g.stroke(); }
    g.beginPath(); g.arc(48, gy + 24, 4.5, 0, 6.3); g.fillStyle = GOLD(g, gy + 19, gy + 29); g.fill(); ink(g);
  }
  function axe(g){
    rect(g, 45, 24, 6, 66, WOOD(g, 45, 51)); g.strokeStyle = 'rgba(12,8,5,.8)'; g.strokeRect(45.5, 24.5, 5, 65);
    g.beginPath(); g.moveTo(51, 20); g.quadraticCurveTo(80, 18, 78, 46); g.quadraticCurveTo(66, 38, 51, 44); g.closePath();
    g.fillStyle = STEEL(g, 50, 80); g.fill(); ink(g);
  }
  function spear(g, pike){
    const top = pike ? 2 : 10, bot = pike ? 96 : 84;
    rect(g, 46, top + 20, 4, bot - top - 20, WOOD(g, 46, 50)); g.strokeStyle = 'rgba(12,8,5,.8)'; g.strokeRect(46.5, top + 20.5, 3, bot - top - 21);
    path(g, [[48, top], [55, top + 16], [48, top + 24], [41, top + 16]]); g.fillStyle = STEEL(g, 41, 55); g.fill(); ink(g);
    if (pike){ path(g, [[50, top + 28], [66, top + 34], [50, top + 42]]); g.fillStyle = '#a8332a'; g.fill(); ink(g); }
    else { g.fillStyle = GOLD(g, bot - 6, bot); g.fillRect(45, bot - 6, 6, 4); }
  }
  // v: 'short' (small, deep curve), 'long' (tall stave, shallow curve), 'mw' (long, recurved tips, gold inlay)
  function bow(g, v){
    const T = v === 'short' ? 22 : 2, B = v === 'short' ? 74 : 94, depth = v === 'short' ? 46 : 30, sx = v === 'short' ? 46 : 36, bx = 62;
    g.lineCap = 'round';
    const limb = () => { g.beginPath(); g.moveTo(bx, T); g.quadraticCurveTo(bx - depth * 2, 48, bx, B); };
    for (const [w, c] of [[v === 'short' ? 7 : 9, '#2a1a10'], [v === 'short' ? 4 : 6, v === 'mw' ? '#6a3a1c' : '#8a5a34'], [2, '#c79660']]){ limb(); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
    if (v === 'mw'){ limb(); g.strokeStyle = GOLD(g, T, B); g.lineWidth = 1.5; g.stroke();
      for (const y of [T, B]){ g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + 8, y + (y < 48 ? -2 : 2)); g.strokeStyle = '#2a1a10'; g.lineWidth = 4; g.stroke(); } }
    g.beginPath(); g.moveTo(bx, T); g.lineTo(sx, 48); g.lineTo(bx, B); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.4; g.stroke();
    g.beginPath(); g.moveTo(sx, 48); g.lineTo(v === 'short' ? 78 : 88, 48); g.strokeStyle = '#6b4a2c'; g.lineWidth = 3; g.stroke();
    const hx = v === 'short' ? 78 : 88;
    path(g, [[hx, 48], [hx - 8, 43], [hx - 8, 53]]); g.fillStyle = STEEL(g, hx - 8, hx); g.fill(); ink(g);
    path(g, [[sx, 48], [sx - 6, 42], [sx + 4, 44]]); g.fillStyle = '#b4463a'; g.fill(); path(g, [[sx, 48], [sx - 6, 54], [sx + 4, 52]]); g.fill();
  }
  // v: 'light' | 'free' (Freeman: blue stripe and a white mark) | 'heavy' (arbalest: thick steel stock, stirrup) | 'siege' (arbalest with a winch and a banner)
  function crossbow(g, v){
    v = v || 'light'; const heavy = v === 'heavy' || v === 'siege', th = heavy ? 15 : 9, ty = 48 - th / 2;
    rect(g, 10, ty, 70, th, heavy ? STEEL(g, 10, 80) : WOOD(g, 10, 80), 'rgba(12,8,5,.8)');
    if (heavy) rect(g, 10, ty + th - 6, 70, 6, WOOD(g, 10, 80), 'rgba(12,8,5,.7)');
    const lw = heavy ? 11 : 7, ly = heavy ? 6 : 12;
    g.lineCap = 'round'; g.beginPath(); g.moveTo(60, ly); g.quadraticCurveTo(80, 48, 60, 96 - ly); g.strokeStyle = '#2a1a10'; g.lineWidth = lw; g.stroke(); g.strokeStyle = heavy ? '#9aa5af' : '#8a5a34'; g.lineWidth = lw - 3; g.stroke();
    g.beginPath(); g.moveTo(60, ly); g.lineTo(30, 48); g.lineTo(60, 96 - ly); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.4; g.stroke();
    path(g, [[30, 47], [88, 47], [92, 48.5], [88, 50], [30, 50]]); g.fillStyle = '#6b4a2c'; g.fill();
    rect(g, 8, 41, 12, 15, LEATH(g, 41, 56), 'rgba(12,8,5,.8)');
    if (heavy){ g.beginPath(); g.ellipse(78, 48, 7, 11, 0, 0, 6.3); g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#a3adb7'; g.lineWidth = 1.4; g.stroke(); }
    if (v === 'siege'){ g.beginPath(); g.arc(22, 66, 9, 0, 6.3); g.fillStyle = GOLD(g, 57, 75); g.fill(); ink(g); g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 66); g.lineTo(22, 82); g.moveTo(22, 82); g.lineTo(32, 86); g.stroke();
      for (let a = 0; a < 6; a += 1.5){ g.beginPath(); g.moveTo(22, 66); g.lineTo(22 + Math.cos(a) * 9, 66 + Math.sin(a) * 9); g.strokeStyle = '#3a2a10'; g.lineWidth = 1.5; g.stroke(); }
      path(g, [[40, 22], [60, 22], [60, 34], [50, 30], [40, 34]]); g.fillStyle = '#a8332a'; g.fill(); ink(g); }
    if (v === 'free'){ g.fillStyle = '#3f5ea8'; g.fillRect(10, 47, 56, 3); g.beginPath(); g.moveTo(44, 42); g.lineTo(46, 46); g.lineTo(50, 46); g.lineTo(47, 49); g.lineTo(48, 53); g.lineTo(44, 51); g.lineTo(40, 53); g.lineTo(41, 49); g.lineTo(38, 46); g.lineTo(42, 46); g.closePath(); g.fillStyle = '#f4f0e2'; g.fill(); ink(g); }
  }
  function plate(g, d){ // torso silhouette used by every armour
    path(g, [[34, 12], [62, 12], [84, 22], [92, 44], [78, 50], [74, 86], [22, 86], [18, 50], [4, 44], [12, 22]]); return d;
  }
  const ARM = {rags:['#8a7a5a', 'rag'], padded:['#c9b48a', 'quilt'], leather:['#7a4f2a', 'plain'], brigandine:['#5a3a2e', 'studs'],
    chainshirt:['#9aa3ad', 'chain'], hide:['#8a6a44', 'fur'], scale:['#8f98a2', 'scale'], heavychain:['#7f8892', 'chain'],
    cuirass:['#c0c8d0', 'plate'], splint:['#8f98a2', 'bands'], lamellar:['#a08a5a', 'bands'], halfplate:['#d3d9de', 'plate'],
    fullplate:['#e0e6ec', 'plate', 'gold'], deepiron:['#4d5864', 'plate', 'rune'], elvenmail:['#a9c9a0', 'scale', 'leaf'], kragganplate:['#7c6a56', 'bands', 'gold']};
  function armour(g, id){
    const [col, pat, deco] = ARM[id] || ['#888888', 'plain'];
    plate(g); g.fillStyle = lg(g, 0, 12, 0, 86, [[0, shade(col, 1.25)], [.5, col], [1, shade(col, .55)]]); g.fill();
    g.save(); plate(g); g.clip();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.fillStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.4;
    if (pat === 'quilt') for (let y = 20; y < 86; y += 9){ g.beginPath(); g.moveTo(0, y); g.lineTo(96, y); g.stroke(); for (let x = 12; x < 90; x += 14){ g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 9); g.stroke(); } }
    if (pat === 'studs') for (let y = 24; y < 86; y += 10) for (let x = 14 + (y % 20 ? 6 : 0); x < 86; x += 12){ g.beginPath(); g.arc(x, y, 2.4, 0, 6.3); g.fillStyle = GOLD(g, y - 2, y + 2); g.fill(); }
    if (pat === 'chain') for (let y = 20; y < 88; y += 5) for (let x = (y % 10 ? 3 : 0); x < 96; x += 6){ g.beginPath(); g.arc(x, y, 2.6, 0, 6.3); g.stroke(); }
    if (pat === 'scale') for (let y = 20; y < 92; y += 8) for (let x = (y % 16 ? 4 : -2); x < 98; x += 9){ g.beginPath(); g.arc(x + 4.5, y, 4.5, 0, Math.PI); g.stroke(); }
    if (pat === 'bands') for (let y = 22; y < 88; y += 8){ g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, y, 96, 3); g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(0, y + 3, 96, 2); }
    if (pat === 'plate'){ g.fillStyle = 'rgba(255,255,255,.35)'; path(g, [[48, 14], [52, 14], [54, 84], [44, 84]]); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(20, 62, 56, 3); g.beginPath(); g.ellipse(34, 38, 8, 14, -.3, 0, 6.3); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); }
    if (pat === 'rag'){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(26, 40, 8, 6); g.fillRect(58, 58, 10, 5); g.fillStyle = 'rgba(0,0,0,.5)'; for (let x = 22; x < 76; x += 8) path(g, [[x, 86], [x + 4, 78], [x + 8, 86]]), g.fill(); }
    if (pat === 'fur'){ g.fillStyle = '#e2d2ae'; for (let x = 2; x < 96; x += 5){ path(g, [[x, 10], [x + 2.5, 34], [x + 5, 10]]); g.fill(); } for (const [x0, x1] of [[2, 22], [74, 94]]) for (let x = x0; x < x1; x += 5){ path(g, [[x, 52], [x + 2.5, 40], [x + 5, 52]]); g.fill(); } g.fillStyle = '#c8b58c'; for (let x = 4; x < 94; x += 6){ path(g, [[x, 88], [x + 3, 66], [x + 6, 88]]); g.fill(); } g.fillStyle = 'rgba(40,24,10,.45)'; for (const [x, y] of [[30, 48], [62, 54], [44, 74]]){ g.beginPath(); g.ellipse(x, y, 7, 4, .4, 0, 6.3); g.fill(); } }
    g.fillStyle = LEATH(g, 58, 66); g.fillRect(0, 58, 96, 8); g.fillStyle = GOLD(g, 58, 66); g.fillRect(44, 57, 8, 10);
    g.restore();
    if (deco === 'gold'){ g.strokeStyle = GOLD(g, 12, 86); g.lineWidth = 3.5; plate(g); g.stroke(); }
    if (deco === 'rune'){ g.strokeStyle = '#7ad8ff'; g.shadowColor = '#7ad8ff'; g.shadowBlur = 8; g.lineWidth = 2; path(g, [[48, 26], [56, 38], [48, 50], [40, 38]]); g.stroke(); path(g, [[48, 50], [48, 76]], false); g.stroke(); g.shadowBlur = 0; }
    if (deco === 'leaf'){ g.strokeStyle = '#e8d88a'; g.lineWidth = 2; g.beginPath(); g.moveTo(48, 26); g.quadraticCurveTo(62, 40, 48, 54); g.quadraticCurveTo(34, 40, 48, 26); g.stroke(); }
    plate(g); ink(g);
    g.beginPath(); g.ellipse(48, 14, 12, 6, 0, 0, 6.3); g.fillStyle = '#17110c'; g.fill(); ink(g);
  }
  function shield(g, id){
    if (id === 'none'){ g.beginPath(); g.arc(48, 48, 26, 0, 6.3); g.strokeStyle = '#8a3a2a'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(30, 66); g.lineTo(66, 30); g.stroke(); return; }
    if (id === 'bucklers'){
      g.beginPath(); g.arc(48, 48, 34, 0, 6.3); g.fillStyle = lg(g, 14, 14, 82, 82, [[0, '#b8895a'], [1, '#43291a']]); g.fill(); ink(g);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for (let a = 0; a < 6.3; a += 1.05){ g.beginPath(); g.moveTo(48, 48); g.lineTo(48 + Math.cos(a) * 33, 48 + Math.sin(a) * 33); g.stroke(); }
      g.beginPath(); g.arc(48, 48, 33, 0, 6.3); g.strokeStyle = '#8f98a2'; g.lineWidth = 3; g.stroke();
      g.beginPath(); g.arc(48, 48, 10, 0, 6.3); g.fillStyle = STEEL(g, 38, 58); g.fill(); ink(g); return; }
    const A = id === 'bastion' ? ['#8f98a2', '#3a424a'] : id === 'reliquary' ? ['#e8e0d0', '#9a8f78'] : ['#a8332a', '#5a1a14'];
    path(g, [[14, 10], [82, 10], [82, 48], [48, 90], [14, 48]]); g.fillStyle = lg(g, 14, 10, 82, 90, [[0, A[0]], [1, A[1]]]); g.fill();
    g.save(); path(g, [[14, 10], [82, 10], [82, 48], [48, 90], [14, 48]]); g.clip(); g.fillStyle = GOLD(g, 10, 90); g.fillRect(43, 8, 10, 84); g.fillRect(12, 32, 72, 10); if (id === 'reliquary'){ g.beginPath(); g.arc(48, 37, 14, 0, 6.3); g.strokeStyle = '#fff6c8'; g.lineWidth = 3; g.shadowColor = '#ffe9a0'; g.shadowBlur = 10; g.stroke(); } g.restore();
    path(g, [[14, 10], [82, 10], [82, 48], [48, 90], [14, 48]]); ink(g); g.strokeStyle = STEEL(g, 14, 82); g.lineWidth = 3; g.stroke();
  }
  function tower(g){
    path(g, [[22, 6], [74, 6], [74, 76], [48, 92], [22, 76]]); g.fillStyle = WOOD(g, 22, 74); g.fill();
    g.save(); path(g, [[22, 6], [74, 6], [74, 76], [48, 92], [22, 76]]); g.clip(); g.fillStyle = 'rgba(0,0,0,.4)'; for (let y = 22; y < 90; y += 18) g.fillRect(0, y, 96, 2.5); g.fillStyle = STEEL(g, 44, 52); g.fillRect(44, 0, 8, 96); g.restore();
    path(g, [[22, 6], [74, 6], [74, 76], [48, 92], [22, 76]]); ink(g);
  }
  function focus(g){
    g.lineCap = 'round'; g.beginPath(); g.moveTo(48, 90); g.lineTo(48, 38); g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.stroke(); g.strokeStyle = '#8a5a34'; g.lineWidth = 4; g.stroke();
    const r = g.createRadialGradient(48, 24, 2, 48, 24, 22); r.addColorStop(0, 'rgba(210,240,255,.9)'); r.addColorStop(.4, 'rgba(110,190,235,.5)'); r.addColorStop(1, 'rgba(110,190,235,0)');
    g.fillStyle = r; g.beginPath(); g.arc(48, 24, 22, 0, 6.3); g.fill();
    g.beginPath(); g.arc(48, 24, 11, 0, 6.3); g.fillStyle = lg(g, 40, 14, 56, 36, [[0, '#ffffff'], [.5, '#87ceeb'], [1, '#2f7aa8']]); g.fill(); ink(g);
    path(g, [[38, 36], [48, 44], [58, 36], [54, 34], [48, 38], [42, 34]]); g.fillStyle = GOLD(g, 34, 44); g.fill(); ink(g);
  }
  function satchel(g){
    path(g, [[14, 36], [82, 36], [86, 84], [10, 84]]); g.fillStyle = LEATH(g, 36, 84); g.fill(); ink(g);
    path(g, [[14, 36], [82, 36], [78, 58], [48, 66], [18, 58]]); g.fillStyle = lg(g, 0, 36, 0, 66, [[0, '#b8804a'], [1, '#6a4020']]); g.fill(); ink(g);
    g.beginPath(); g.moveTo(24, 36); g.quadraticCurveTo(48, 6, 72, 36); g.strokeStyle = '#2a1a10'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#8a5a34'; g.lineWidth = 2.5; g.stroke();
    rect(g, 43, 58, 10, 12, GOLD(g, 58, 70), 'rgba(12,8,5,.8)');
    g.beginPath(); g.moveTo(70, 70); g.quadraticCurveTo(86, 54, 82, 40); g.strokeStyle = '#d6612a'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(82, 38, 3, 0, 6.3); g.fillStyle = '#ffd37a'; g.fill();
  }
  function boot(g){
    path(g, [[34, 10], [58, 10], [58, 56], [86, 66], [86, 84], [28, 84], [28, 56]]); g.fillStyle = LEATH(g, 10, 84); g.fill(); ink(g);
    g.fillStyle = '#2a1a10'; g.fillRect(26, 80, 62, 6); g.fillStyle = GOLD(g, 18, 24); g.fillRect(34, 18, 24, 5);
  }
  function horse(g, id){
    const col = id === 'riding' ? '#8a5a2b' : id === 'lighthorse' ? '#c8a070' : '#2a2224';
    path(g, [[34, 8], [44, 6], [54, 20], [76, 32], [88, 58], [86, 90], [48, 90], [52, 62], [40, 52], [16, 62], [10, 52], [20, 34], [30, 22]]);
    g.fillStyle = lg(g, 10, 8, 88, 90, [[0, shade(col, 1.35)], [.5, col], [1, shade(col, .5)]]); g.fill(); ink(g);
    path(g, [[44, 6], [54, 20], [64, 40], [60, 70], [54, 44], [48, 24]]); g.fillStyle = shade(col, .35); g.fill();
    g.beginPath(); g.arc(30, 40, 2.4, 0, 6.3); g.fillStyle = '#0c0805'; g.fill();
    g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(18, 56); g.lineTo(40, 36); g.lineTo(56, 24); g.stroke(); g.strokeStyle = '#c0963a'; g.lineWidth = 1; g.stroke();
    if (id === 'destrier'){ path(g, [[40, 14], [58, 22], [74, 36], [86, 58], [84, 90], [54, 90], [58, 60], [38, 40]]); g.fillStyle = STEEL(g, 38, 86); g.globalAlpha = .75; g.fill(); g.globalAlpha = 1; ink(g); g.beginPath(); g.moveTo(50, 20); g.lineTo(50, 50); g.strokeStyle = GOLD(g, 20, 50); g.lineWidth = 3; g.stroke(); }
    if (id === 'warhorses'){ path(g, [[56, 56], [88, 56], [88, 92], [56, 92]]); g.fillStyle = '#a8332a'; g.fill(); ink(g); g.fillStyle = GOLD(g, 56, 62); g.fillRect(56, 56, 32, 5); }
  }
  const DRAW = {
    armour: (g, id) => armour(g, id),
    shield: (g, id) => id === 'heavyshield' || id === 'bucklers' || id === 'none' ? shield(g, id) : shield(g, id),
    melee: (g, id) => {
      if (id === 'spears') return tilt(g, 40, () => spear(g, false));
      if (id === 'pikes'){ tilt(g, 22, () => spear(g, true)); return tilt(g, 58, () => spear(g, true)); }
      if (id === 'shortswords'){ g.save(); g.translate(-8, 4); tilt(g, -32, () => sword(g, false)); g.restore(); g.save(); g.translate(14, 4); g.scale(.9, .9); tilt(g, 34, () => axe(g)); g.restore(); return; }
      tilt(g, -42, () => sword(g, true));
      if (id === 'mwgreatswords'){ g.save(); g.translate(48, 48); g.rotate(-42 * Math.PI / 180); g.translate(-48, -48); g.fillStyle = GOLD(g, 20, 60); g.fillRect(46.5, 20, 3, 40); g.shadowColor = '#ffe9a0'; g.shadowBlur = 8; g.fillRect(46.5, 20, 3, 40); g.restore(); }
    },
    ranged: (g, id) => { if (id === 'crossbows' || id === 'freemanxbow') return crossbow(g, id === 'freemanxbow' ? 'free' : 'light'); return bow(g, id === 'shortbows' ? 'short' : id === 'mwlongbows' ? 'mw' : 'long'); },
    kit: (g, id) => { if (id === 'towershield') return tower(g); if (id === 'focus') return focus(g);
      if (id === 'arbalest' || id === 'siegearbalest'){ crossbow(g, id === 'siegearbalest' ? 'siege' : 'heavy'); return; }
      if (id === 'scorpion'){ rect(g, 8, 70, 80, 8, WOOD(g, 8, 88), 'rgba(12,8,5,.8)'); g.lineWidth = 6; g.strokeStyle = '#2a1a10'; g.beginPath(); g.moveTo(26, 70); g.lineTo(40, 44); g.moveTo(70, 70); g.lineTo(56, 44); g.stroke(); g.strokeStyle = '#8a5a34'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(14, 30); g.quadraticCurveTo(48, 8, 82, 30); g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#8a5a34'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(14, 30); g.lineTo(48, 52); g.lineTo(82, 30); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.4; g.stroke(); path(g, [[48, 52], [48, 14], [52, 6], [44, 6]]); g.fillStyle = STEEL(g, 44, 52); g.fill(); ink(g); return; }
      return satchel(g); },
    mount: (g, id) => id === 'nomount' ? boot(g) : horse(g, id)
  };
  const RIM = {bronze: '#a8793a', steel: '#8f98a2', none: null};

  function make(gr){
    const S = IC.size, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    if (IC.tile){
      const bg = g.createRadialGradient(S * .5, S * .42, 6, S * .5, S * .5, S * .75); bg.addColorStop(0, '#3a2f24'); bg.addColorStop(1, '#14100c');
      g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(2, 2, S - 4, S - 4, 12) : g.rect(2, 2, S - 4, S - 4); g.fill();
      const rim = RIM[IC.rim]; if (rim){ g.strokeStyle = rim; g.lineWidth = 2.5; g.stroke(); g.strokeStyle = 'rgba(255,230,170,.18)'; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(6, 6, S - 12, S - 12, 9) : g.rect(6, 6, S - 12, S - 12); g.stroke(); }
    }
    g.save(); const k = IC.tile ? .9 : .98; g.translate(S * .5, S * .5); g.scale(k, k); g.translate(-S * .5, -S * .5);
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    try { (DRAW[gr.slot] || DRAW.kit)(g, gr.id); } catch(e){ /* a bad icon must never break a card */ }
    g.restore();
    return c;
  }
  IC.url = gr => {
    const key = gr.id + '|' + IC.rim + '|' + IC.tile;
    if (!CACHE[key]){ try { CACHE[key] = make(gr).toDataURL('image/png') + '#pi'; } catch(e){ CACHE[key] = ''; } }
    return CACHE[key];
  };

  /* ---- loot: field coins and gems (SPR coin0-3, gem), painted at 4x and drawn through a blit wrapper ---- */
  const K = 4;
  function coinC(f){
    const c = document.createElement('canvas'); c.width = c.height = 9 * K; const g = c.getContext('2d');
    const rw = [14, 11, 8, 11][f], cx = 18, cy = 18, ry = 14;
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5;
    g.beginPath(); g.ellipse(cx, cy, rw + 1.5, ry + 1.5, 0, 0, 6.3); g.fillStyle = '#4a3410'; g.fill(); g.shadowColor = 'transparent';
    g.beginPath(); g.ellipse(cx, cy, rw, ry, 0, 0, 6.3); g.fillStyle = lg(g, cx - rw, cy - ry, cx + rw, cy + ry, [[0, '#fff2a8'], [.45, '#e8c040'], [1, '#8a6414']]); g.fill();
    if (rw > 6){ g.beginPath(); g.ellipse(cx, cy, rw * .68, ry * .68, 0, 0, 6.3); g.strokeStyle = 'rgba(90,60,10,.6)'; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = 'rgba(90,60,10,.65)'; g.fillRect(cx - 1.2, cy - 5, 2.4, 10); }
    return c;
  }
  function gemC(){
    const c = document.createElement('canvas'); c.width = 7 * K; c.height = 9 * K; const g = c.getContext('2d');
    g.shadowColor = 'rgba(120,180,255,.7)'; g.shadowBlur = 6;
    const P = [[14, 3], [24, 11], [24, 22], [14, 33], [4, 22], [4, 11]];
    path(g, P); g.fillStyle = lg(g, 4, 3, 24, 33, [[0, '#cfe8ff'], [.4, '#4f86e8'], [1, '#1e3a98']]); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(10,20,60,.9)'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 11); g.lineTo(14, 16); g.lineTo(24, 11); g.moveTo(14, 16); g.lineTo(14, 33); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.65)'; path(g, [[8, 9], [13, 6], [12, 12]]); g.fill();
    return c;
  }
  IC.loot = true;
  IC.setLoot = function(on){
    IC.loot = !!on;
    try {
      if (on){ for (let f = 0; f < 4; f++){ const c = coinC(f); c.__k = K; SPR['coin' + f] = c; } const gm = gemC(); gm.__k = K; SPR.gem = gm; }
      else { for (let f = 0; f < 4; f++) delete SPR['coin' + f]; delete SPR.gem; }
    } catch(e){ /* keep the pixel coins */ }
  };
  const origBlit = window.blit;
  if (typeof origBlit === 'function') window.blit = function(img, x, y, s, flip, ax, ay){
    const k = img && img.__k; return k ? origBlit(img, x, y, s / k, flip, ax * k, ay * k) : origBlit(img, x, y, s, flip, ax, ay);
  };
  IC.setLoot(true);
  /* ---- objective pins: the markers on the field minimap and full map (markerIcon). Enemy icons (m.k) stay as they are. ---- */
  IC.pins = true;
  const PIN = {
    vault(g){ path(g, [[14, 44], [82, 44], [82, 84], [14, 84]]); g.fillStyle = WOOD(g, 14, 82); g.fill(); ink(g);
      g.beginPath(); g.moveTo(14, 44); g.quadraticCurveTo(48, 6, 82, 44); g.closePath(); g.fillStyle = lg(g, 0, 14, 0, 44, [[0, '#b8895a'], [1, '#6a4428']]); g.fill(); ink(g);
      for (const x of [26, 64]){ g.fillStyle = STEEL(g, x, x + 8); g.fillRect(x, 24, 8, 60); }
      g.fillStyle = GOLD(g, 44, 62); g.fillRect(40, 44, 16, 18); ink(g); g.fillStyle = '#17110c'; g.fillRect(46, 50, 4, 8); },
    exit(g){ g.fillStyle = WOOD(g, 20, 26); g.fillRect(20, 6, 6, 88); g.beginPath(); g.moveTo(26, 12); g.lineTo(82, 12); g.lineTo(70, 34); g.lineTo(82, 56); g.lineTo(26, 56); g.closePath();
      g.fillStyle = lg(g, 26, 12, 82, 56, [[0, '#5fb070'], [1, '#235a30']]); g.fill(); ink(g);
      path(g, [[40, 34], [58, 22], [58, 30], [66, 30], [66, 38], [58, 38], [58, 46]]); g.fillStyle = '#e8f4e0'; g.fill(); },
    fort(g){ path(g, [[22, 90], [22, 30], [32, 30], [32, 20], [42, 20], [42, 30], [54, 30], [54, 20], [64, 20], [64, 30], [74, 30], [74, 90]]);
      g.fillStyle = lg(g, 22, 0, 74, 0, [[0, '#9aa0a6'], [1, '#4a5056']]); g.fill(); ink(g);
      g.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 40; y < 90; y += 10) g.fillRect(22, y, 52, 1.6);
      path(g, [[40, 90], [40, 66], [48, 58], [56, 66], [56, 90]]); g.fillStyle = '#17110c'; g.fill(); },
    cage(g){ path(g, [[16, 24], [80, 24], [80, 86], [16, 86]]); g.fillStyle = 'rgba(20,14,10,.55)'; g.fill();
      g.strokeStyle = STEEL(g, 16, 80); g.lineWidth = 4; for (let x = 22; x <= 74; x += 13){ g.beginPath(); g.moveTo(x, 24); g.lineTo(x, 86); g.stroke(); }
      g.fillStyle = '#4a525a'; g.fillRect(12, 18, 72, 8); g.fillRect(12, 82, 72, 6); ink(g); g.strokeRect(12, 18, 72, 8);
      g.beginPath(); g.arc(48, 12, 6, 0, 6.3); g.strokeStyle = '#8a929a'; g.lineWidth = 3; g.stroke(); },
    wagon(g){ rect(g, 10, 34, 70, 30, WOOD(g, 10, 80), 'rgba(12,8,5,.85)');
      g.beginPath(); g.moveTo(14, 36); g.quadraticCurveTo(46, -2, 76, 36); g.closePath(); g.fillStyle = lg(g, 0, 10, 0, 36, [[0, '#e8dcc0'], [1, '#a89a78']]); g.fill(); ink(g);
      for (const x of [26, 66]){ g.beginPath(); g.arc(x, 72, 13, 0, 6.3); g.fillStyle = '#2a1a10'; g.fill(); g.strokeStyle = '#8a5a34'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(x, 72, 3, 0, 6.3); g.fillStyle = '#c0963a'; g.fill(); } },
    relic(g){ const r = g.createRadialGradient(48, 44, 4, 48, 44, 44); r.addColorStop(0, 'rgba(255,240,170,.8)'); r.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = r; g.beginPath(); g.arc(48, 44, 44, 0, 6.3); g.fill();
      path(g, [[28, 22], [68, 22], [64, 46], [54, 56], [54, 74], [66, 84], [30, 84], [42, 74], [42, 56], [32, 46]]); g.fillStyle = GOLD(g, 22, 84); g.fill(); ink(g);
      g.beginPath(); g.ellipse(48, 22, 20, 5, 0, 0, 6.3); g.fillStyle = '#7a1a2a'; g.fill(); ink(g); },
    nest(g){ g.fillStyle = '#6b5428'; g.beginPath(); g.ellipse(48, 74, 40, 14, 0, 0, 6.3); g.fill(); ink(g);
      g.strokeStyle = '#a8883e'; g.lineWidth = 2; for (let i = 0; i < 14; i++){ g.beginPath(); g.moveTo(12 + i * 5.5, 78); g.lineTo(18 + i * 5, 66); g.stroke(); }
      for (const [x, y, s] of [[34, 56, 1], [60, 54, 1.1], [47, 38, 1.2]]){ g.beginPath(); g.ellipse(x, y, 11 * s, 15 * s, 0, 0, 6.3); g.fillStyle = lg(g, x - 10, y - 14, x + 10, y + 14, [[0, '#f4ecd2'], [1, '#a89a70']]); g.fill(); ink(g); } },
    engine(g){ g.fillStyle = STEEL(g, 20, 76); g.beginPath(); for (let i = 0; i < 16; i++){ const a = i * Math.PI / 8, r = i % 2 ? 30 : 40; g.lineTo(48 + Math.cos(a) * r, 46 + Math.sin(a) * r); } g.closePath(); g.fill(); ink(g);
      g.beginPath(); g.arc(48, 46, 12, 0, 6.3); g.fillStyle = '#17110c'; g.fill(); g.strokeStyle = GOLD(g, 34, 58); g.lineWidth = 3; g.stroke();
      rect(g, 8, 82, 80, 8, WOOD(g, 8, 88), 'rgba(12,8,5,.85)'); },
    beacon(g){ path(g, [[28, 52], [68, 52], [60, 64], [56, 90], [40, 90], [36, 64]]); g.fillStyle = STEEL(g, 28, 68); g.fill(); ink(g);
      const f = g.createRadialGradient(48, 34, 3, 48, 36, 34); f.addColorStop(0, 'rgba(255,230,120,.95)'); f.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = f; g.beginPath(); g.arc(48, 36, 34, 0, 6.3); g.fill();
      g.beginPath(); g.moveTo(48, 6); g.quadraticCurveTo(70, 30, 62, 50); g.lineTo(34, 50); g.quadraticCurveTo(28, 28, 48, 6); g.fillStyle = lg(g, 0, 6, 0, 50, [[0, '#ffe08a'], [.5, '#f08a30'], [1, '#b8381a']]); g.fill(); ink(g); }
  };
  const PINC = {};
  const pinCanvas = k => {
    if (PINC[k] === undefined){
      try { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 4; g.shadowOffsetY = 2; PIN[k](g); PINC[k] = c; } catch(e){ PINC[k] = null; }
    }
    return PINC[k];
  };
  IC.pinCanvas = pinCanvas;
  const origMarker = window.markerIcon;
  if (typeof origMarker === 'function') window.markerIcon = function(m){
    if (IC.pins && m && !m.k && PIN[m.sp]){ const c = pinCanvas(m.sp); if (c) return c; }
    return origMarker(m);
  };
  /* ---- patron portraits (PATRON_ART.portraitURL): a painted head-and-shoulders per villager type, same colours as the sprite ---- */
  IC.patrons = true;
  const PBUST = {};
  const FACE = {   // per type: head size, chin point, nose, brow, eye, mouth, age lines, turn (three-quarter)
    sot:      {rx:27, ry:28, jaw:.15, nw:10, nl:13, bt:3,   tilt:-.1, ex:3.8, ey:2.4, droop:1.2, m:.9,  mw:9,  skew:3,  age:3, turn:.35},
    drover:   {rx:22, ry:30, jaw:.6,  nw:5,  nl:12, bt:2,   tilt:.18,  ex:4,   ey:2.6, droop:0,   m:-.1, mw:7,  skew:0,  age:1, turn:.9},
    labourer: {rx:26, ry:28, jaw:0,   nw:7,  nl:12, bt:4.5, tilt:.22,  ex:3.4, ey:2.2, droop:0,   m:0,   mw:10, skew:0,  age:1, turn:-.7},
    boy:      {rx:24, ry:26, jaw:.35, nw:4,  nl:7,  bt:1.8, tilt:-.4,  ex:4.8, ey:3.7, droop:0,   m:-.6, mw:5,  skew:0,  age:0, turn:0},
    healer:   {rx:22, ry:29, jaw:.5,  nw:4.5,nl:10, bt:1.6, tilt:0,    ex:4,   ey:2,   droop:.6,  m:.55, mw:6,  skew:0,  age:0, turn:0},
    dwarf:    {rx:29, ry:26, jaw:.1,  nw:11, nl:12, bt:5.5, tilt:.3,   ex:3.2, ey:2.2, droop:0,   m:0,   mw:12, skew:0,  age:1, turn:-.45},
    crone:    {rx:22, ry:29, jaw:.7,  nw:6,  nl:14, bt:2,   tilt:.1,   ex:3.6, ey:2.2, droop:1,   m:-.3, mw:6,  skew:0,  age:3, turn:0},
    fishwife: {rx:26, ry:27, jaw:.2,  nw:6,  nl:10, bt:3,   tilt:.05,  ex:4,   ey:2.6, droop:0,   m:.7,  mw:9,  skew:-2, age:1, turn:0}
  };
  function bust(t, name){
    const S = 112, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const F = FACE[t.id] || FACE.sot, id = t.id, dx = F.turn * 6, fx = F.turn * 9;
    const bg = g.createRadialGradient(56, 50, 8, 56, 56, 80); bg.addColorStop(0, '#54402c'); bg.addColorStop(1, '#17110c'); g.fillStyle = bg; g.fillRect(0, 0, S, S);
    const skin = t.skin, skinD = shade(skin, .72), skinL = shade(skin, 1.12), top = t.top;
    const ell = (x, y, rx, ry, f, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.3); g.fillStyle = f; g.fill(); };
    if (t.staff){ g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.beginPath(); g.moveTo(98, 14); g.lineTo(98, 112); g.stroke(); g.strokeStyle = t.staff; g.lineWidth = 4; g.stroke(); }
    if (t.cane){ g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.beginPath(); g.moveTo(96, 112); g.lineTo(96, 66); g.quadraticCurveTo(96, 56, 86, 58); g.stroke(); g.strokeStyle = t.cane; g.lineWidth = 3; g.stroke(); }
    if (t.pickHandle){ g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.beginPath(); g.moveTo(14, 112); g.lineTo(34, 20); g.stroke(); g.strokeStyle = t.pickHandle; g.lineWidth = 4; g.stroke();
      path(g, [[18, 24], [44, 14], [50, 20], [24, 34]]); g.fillStyle = STEEL(g, 18, 50); g.fill(); ink(g); }
    g.beginPath(); g.moveTo(4, 112); g.quadraticCurveTo(8, 78, 40, 74); g.lineTo(72, 74); g.quadraticCurveTo(104, 78, 108, 112); g.closePath();
    g.fillStyle = lg(g, 0, 74, 0, 112, [[0, shade(top, 1.2)], [1, shade(top, .55)]]); g.fill(); ink(g);
    if (t.shawl){ g.beginPath(); g.moveTo(2, 112); g.quadraticCurveTo(10, 70, 56, 90); g.quadraticCurveTo(102, 70, 110, 112); g.closePath(); g.fillStyle = t.shawl; g.fill(); ink(g); }
    if (t.braces){ g.strokeStyle = t.braces; g.lineWidth = 7; for (const x of [38, 74]){ g.beginPath(); g.moveTo(x, 76); g.lineTo(x + (x < 56 ? -4 : 4), 112); g.stroke(); } }
    if (t.apron){ g.fillStyle = t.apron; g.fillRect(34, 92, 44, 20); }
    if (t.sash){ g.fillStyle = t.sash; g.fillRect(40, 96, 32, 6); }
    if (t.bag){ g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.beginPath(); g.moveTo(34, 76); g.lineTo(84, 112); g.stroke(); g.strokeStyle = t.bag; g.lineWidth = 3; g.stroke(); }
    if (t.fiddle){ g.save(); g.translate(26, 96); g.rotate(-.5); ell(0, 0, 14, 18, lg(g, -14, -18, 14, 18, [[0, '#b8804a'], [1, t.fiddleD]])); ink(g); g.fillStyle = '#17110c'; g.fillRect(-1.5, -8, 3, 14);
      g.fillStyle = t.fiddleD; g.fillRect(-2.5, -40, 5, 24); g.restore(); g.strokeStyle = '#d6c4a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 112); g.lineTo(60, 84); g.stroke(); }
    if (t.bottle){ g.save(); g.translate(88, 98); g.rotate(.25); g.fillStyle = lg(g, -7, 0, 7, 0, [[0, shade(t.bottle, 1.4)], [1, shade(t.bottle, .5)]]); g.fillRect(-7, -4, 14, 26); g.fillRect(-3, -16, 6, 14); ink(g); g.fillStyle = '#d6c4a0'; g.fillRect(-7, 6, 14, 8); g.restore(); }
    if (t.fish){ g.save(); g.translate(86, 100); g.rotate(-.5); g.beginPath(); g.ellipse(0, 0, 18, 7, 0, 0, 6.3); g.fillStyle = lg(g, -18, -7, 18, 7, [[0, shade(t.fish, 1.3)], [1, t.fishD]]); g.fill(); ink(g); path(g, [[16, 0], [28, -8], [28, 8]]); g.fillStyle = t.fishD; g.fill(); g.restore(); }
    g.save(); g.translate(dx, 0);
    if (t.wimple){ g.beginPath(); g.moveTo(22, 90); g.quadraticCurveTo(14, 20, 56, 8); g.quadraticCurveTo(98, 20, 90, 90); g.lineTo(76, 82); g.lineTo(36, 82); g.closePath(); g.fillStyle = lg(g, 0, 8, 0, 90, [[0, '#f4efe0'], [1, '#b8b09a']]); g.fill(); ink(g); }
    g.fillStyle = skinD; g.fillRect(46, 64, 20, 18);
    if (t.shirt){ path(g, [[40, 76], [72, 76], [64, 90], [56, 84], [48, 90]]); g.fillStyle = t.shirt; g.fill(); ink(g); }
    if (t.hair && id !== 'dwarf' && !t.wimple) ell(56, 44, F.rx + 3, 31, shade(t.hair, .8));
    if (F.turn <= .5) ell(56 - F.rx, 50, 5, 8, skinD);
    if (F.turn >= -.5) ell(56 + F.rx, 50, 5, 8, skinD);
    const head = () => { const cw = F.rx * (1 - F.jaw * .78), cy = 44; g.beginPath(); g.moveTo(56 - F.rx, cy); g.bezierCurveTo(56 - F.rx, cy - F.ry * 1.3, 56 + F.rx, cy - F.ry * 1.3, 56 + F.rx, cy);
      g.bezierCurveTo(56 + F.rx, cy + F.ry * .6, 56 + cw, cy + F.ry * .98, 56, cy + F.ry); g.bezierCurveTo(56 - cw, cy + F.ry * .98, 56 - F.rx, cy + F.ry * .6, 56 - F.rx, cy); g.closePath(); };
    head(); g.fillStyle = lg(g, 36, 22, 78, 76, [[0, skinL], [.55, skin], [1, skinD]]); g.fill(); ink(g);
    if (F.turn){ g.save(); head(); g.clip(); const sh = g.createLinearGradient(F.turn > 0 ? 82 : 30, 0, F.turn > 0 ? 50 : 62, 0); sh.addColorStop(0, 'rgba(20,10,5,.45)'); sh.addColorStop(1, 'rgba(20,10,5,0)'); g.fillStyle = sh; g.fillRect(20, 10, 72, 80); g.restore(); }
    if (t.beard){ g.beginPath(); g.moveTo(30, 52); g.quadraticCurveTo(32, 100, 56, 102); g.quadraticCurveTo(80, 100, 82, 52); g.quadraticCurveTo(56, 66, 30, 52); g.fillStyle = lg(g, 0, 52, 0, 102, [[0, shade(t.beard, 1.1)], [1, shade(t.beard, .65)]]); g.fill(); ink(g);
      g.strokeStyle = shade(t.beard, .6); g.lineWidth = 1.2; for (let x = 38; x < 76; x += 7){ g.beginPath(); g.moveTo(x, 70); g.quadraticCurveTo(x + 2, 86, x - 1, 98); g.stroke(); } }
    if (t.stubble){ g.fillStyle = 'rgba(70,50,30,.38)'; g.beginPath(); g.ellipse(56, 66, F.rx * .8, 12, 0, 0, 3.14); g.fill(); }
    const ey = 46 + F.droop * .5;
    [-10, 10].forEach((ox, k) => { const x = 56 + ox + fx * .6, rx = F.ex * ((F.turn > 0 && k) || (F.turn < 0 && !k) ? .8 : 1), ry = F.ey;
      ell(x, ey, rx, ry, '#f4eede'); ell(x + .6 + F.turn, ey + F.droop * .3, Math.min(2.4, rx * .55), Math.min(2.5, ry * .95), '#1b1410'); ell(x + 1.4, ey - .6, .7, .7, '#fff');
      g.strokeStyle = skinD; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - rx, ey - ry * .6 + F.droop * .4); g.quadraticCurveTo(x, ey - ry * 1.5, x + rx, ey - ry * .6); g.stroke();
      const lift = F.tilt * 5 * (k ? 1 : -1); g.strokeStyle = shade(t.hair || '#3a2a1c', .7); g.lineWidth = F.bt; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 6, ey - 7 + (k ? 0 : lift)); g.lineTo(x + 6, ey - 7 - (k ? lift : 0)); g.stroke(); });
    const nx = 56 + fx; g.strokeStyle = skinD; g.lineWidth = 1.8; g.beginPath(); g.moveTo(nx - 1, ey + 2); g.lineTo(nx - F.nw * .3, ey + F.nl); g.quadraticCurveTo(nx, ey + F.nl + 3, nx + F.nw * .6, ey + F.nl); g.stroke();
    ell(nx + F.nw * .1, ey + F.nl + 1, F.nw * .6, F.nw * .4, t.nose || shade(skin, .9));
    if (t.cheek){ ell(nx - 13, ey + 12, 6, 4, 'rgba(201,104,90,.5)'); ell(nx + 13, ey + 12, 6, 4, 'rgba(201,104,90,.5)'); }
    if (!t.beard){ const my = 70; g.strokeStyle = t.mouth || '#6a2a22'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx - F.mw + F.skew, my + (F.skew > 0 ? 2 : 0)); g.quadraticCurveTo(nx, my + F.m * 6, nx + F.mw, my - (F.skew > 0 ? 2 : 0)); g.stroke();
      if (F.m < -.4) ell(nx, my + 1, 3, 2.5, '#2a0e0a'); }
    else { g.strokeStyle = shade(t.beard, .55); g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - 12, 66); g.quadraticCurveTo(nx, 72, nx + 12, 66); g.stroke(); }
    if (F.age){ g.strokeStyle = 'rgba(60,35,20,.45)'; g.lineWidth = 1.2; for (let i = 0; i < F.age; i++){ const y = 28 + i * 4.5; g.beginPath(); g.moveTo(40, y); g.quadraticCurveTo(56, y - 2, 72, y); g.stroke(); }
      for (const s of [-1, 1]){ g.beginPath(); g.moveTo(nx + s * 18, ey); g.lineTo(nx + s * 24, ey - 2); g.moveTo(nx + s * 18, ey + 2); g.lineTo(nx + s * 23, ey + 4); g.stroke(); g.beginPath(); g.moveTo(nx + s * 8, ey + F.nl); g.quadraticCurveTo(nx + s * 12, 66, nx + s * 12, 72); g.stroke(); } }
    if (t.hat){ ell(56, 28, 42, 9, shade(t.hat, .8)); g.beginPath(); g.ellipse(56, 26, 22, 20, 0, Math.PI, 0); g.fillStyle = lg(g, 0, 6, 0, 28, [[0, shade(t.hat, 1.2)], [1, t.hat]]); g.fill(); ink(g); g.fillStyle = t.hatBand; g.fillRect(34, 22, 44, 5); }
    else if (t.cap){ g.beginPath(); g.ellipse(56, 30, 27, 19, 0, Math.PI, 0); g.fillStyle = lg(g, 0, 10, 0, 30, [[0, shade(t.cap, 1.25)], [1, t.cap]]); g.fill(); ink(g); if (t.capPeak){ path(g, [[30, 30], [66, 30], [88, 35], [34, 37]]); g.fillStyle = t.capPeak; g.fill(); ink(g); }
      if (t.lamp){ const r = g.createRadialGradient(56, 5, 1, 56, 5, 24); r.addColorStop(0, 'rgba(255,240,170,.85)'); r.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = r; g.beginPath(); g.arc(56, 5, 24, 0, 6.3); g.fill(); ell(56, 11, 6, 4.5, t.lamp); ink(g); ell(56, 10, 2.5, 2, t.lampL); } }
    else if (t.wimple){ g.beginPath(); g.moveTo(28, 40); g.quadraticCurveTo(30, 12, 56, 12); g.quadraticCurveTo(82, 12, 84, 40); g.quadraticCurveTo(56, 30, 28, 40); g.closePath(); g.fillStyle = lg(g, 0, 12, 0, 40, [[0, '#fbf8ee'], [1, '#d8d0b8']]); g.fill(); ink(g);
      g.beginPath(); g.moveTo(34, 62); g.quadraticCurveTo(56, 92, 78, 62); g.lineTo(80, 84); g.lineTo(32, 84); g.closePath(); g.fillStyle = '#e8e0cc'; g.fill(); ink(g); }
    else { g.beginPath(); g.ellipse(56, 30, F.rx, 17, 0, Math.PI * 1.02, Math.PI * 1.98); g.fillStyle = lg(g, 0, 10, 0, 34, [[0, shade(t.hair, 1.2)], [1, t.hair]]); g.fill(); ink(g);
      if (id === 'crone'){ ell(56, 12, 12, 9, shade(t.hair, .95)); ink(g); } }
    if (t.scarf){ g.beginPath(); g.moveTo(38, 78); g.quadraticCurveTo(56, 92, 74, 78); g.lineTo(76, 88); g.quadraticCurveTo(56, 102, 36, 88); g.closePath(); g.fillStyle = t.scarf; g.fill(); ink(g); }
    if (t.bandage){ g.strokeStyle = t.bandage; g.lineWidth = 8; g.beginPath(); g.moveTo(80, 36); g.quadraticCurveTo(92, 52, 80, 64); g.stroke(); g.fillStyle = t.blood; g.fillRect(84, 48, 5, 6); }
    g.restore();
    const v = g.createRadialGradient(56, 56, 40, 56, 56, 82); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = v; g.fillRect(0, 0, S, S);
    return c;
  }
  if (window.PATRON_ART && PATRON_ART.TYPES){
    const origP = PATRON_ART.portraitURL;
    PATRON_ART.portraitURL = function(patron){
      if (!IC.patrons || !patron) return origP(patron);
      try {
        const i = typeof patron.id === 'number' && patron.id < 0 ? -1 - patron.id : 0, key = patron.name + '#' + i;
        if (PBUST[key] === undefined){ const spr = PATRON_ART.sprite(patron.name, i), t = spr && PATRON_ART.TYPES[spr.k]; PBUST[key] = t ? bust(t, patron.name).toDataURL('image/png') + '#pi' : ''; }
        return PBUST[key] || origP(patron);
      } catch(e){ return origP(patron); }
    };
    IC.patronURL = n => PATRON_ART.portraitURL({name: n, id: 0});
  }
  const orig = window.gearURL;
  window.gearURL = function(gr){ return (gr && gr.id) ? (IC.url(gr) || orig(gr)) : orig(gr); };
  const st = document.createElement('style');
  st.textContent = 'img[src$="#pi"]{image-rendering:auto!important}img.ic[src$="#pi"]{height:64px;width:64px}img.ic.sm[src$="#pi"]{height:52px;width:52px}.gc-mid img[src$="#pi"]{width:44px}';
  document.head.appendChild(st);
  IC.selfTest = function(){
    const out = {pass: 0, fail: 0, details: []}, ck = (n, ok) => { out[ok ? 'pass' : 'fail']++; if (!ok) out.details.push(n); };
    const list = (typeof GEAR !== 'undefined') ? GEAR : [];
    ck('GEAR list present', list.length >= 28);
    const seen = new Set();
    for (const gr of list){ const u = IC.url(gr); ck('icon for ' + gr.id, !!u && u.endsWith('#pi') && u.length > 600); seen.add(u); }
    ck('icons are all different', seen.size === list.length);
    ck('loot sprites seeded', !IC.loot || (SPR.coin0 && SPR.coin0.__k === 4 && SPR.gem && SPR.gem.__k === 4));
    ck('pins painted', !IC.pins || ['vault','exit','fort','cage','wagon','relic','nest','engine','beacon'].every(k => IC.pinCanvas(k) && IC.pinCanvas(k).width === 96));
    ck('patron portraits painted', !IC.patrons || !IC.patronURL || ['Old Hob','Maud the Drover','Tall Pell','One-Ear Jory','Sister Wren','Gaffer Dunn'].every(n => IC.patronURL(n).endsWith('#pi')));
    ck('gearURL routes to the painted icon', window.gearURL(list[0]).endsWith('#pi'));
    out.ok = out.fail === 0; out.fails = out.details;
    return out;
  };
})();
