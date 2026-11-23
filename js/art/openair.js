/* ===== INDEX OA27: open-air facilities on the barge and in the warehouse (Patrick, 2026-11-12, feedback.md theme 5) ===
   Both holdings already have a deck or a roof, so the facilities are their contents out in the open, not a cabin
   with a decal: a map table and the Chapter's flag (command), a canvas stall of bright goods (merchant), an iron
   cage with the captive in it (cells), bedrolls and a spear rack (barracks), crates of spears, a barrel of arrows
   and a shield (armoury), horses at a rail and hay bales (stables), cots in a row with a patient (hospital), anvil,
   brazier and a barrel of swords (barge blacksmith; the warehouse furnace stays, Patrick: "great"), tables of
   potions and a still (alchemy), a teleport circle on the ground (mage tower), a shrine of candles (chapel; the
   fortress church adds a bell), stacked bunks (bunks), a workbench with a cog and a half-built engine (warehouse
   engineering; the barge cannon stays). Ruins fall through to the old painter; damaged draws at 0.8 alpha.
   Scale: the props blit at K.hubBuild (1.4) like the fort's buildings, since the holdings' people stand at hubFigure;
   the old skins blit at 1 there (V.hubFort is fort-only), which is why the sheets showed them bigger than play does.
   A person is PU = 114 sprite px (80 screen px at 1.4 on the painted-at-2 canvas); sizes below are in persons.
   Load after vo3.js. ROLLBACK: delete this file and its script tag. INT-1 group 13: no switch. */
(function(){
  'use strict';
  if (!window.VO3) return;
  const V = VO3, R = 2, PU = 114;
  const O = window.OA27 = {K: {build: 1.4}, cache: {}, map: {command: 'command', merchant: 'merchant', cells: 'cells', barracks: 'barracks', armoury: 'armoury', stables: 'stables', hospital: 'hospital', alchemy: 'alchemy', magetower: 'magetower', chapel: 'shrine', fortresschurch: 'shrine', bunks: 'bunks', blacksmith: 'blacksmith', engineering: 'engineering'}};

  /* ---- small helpers (VO3's are private to its closure) ---- */
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
  const light = () => (window.STRUCT && STRUCT.light) || {dir: {x: -0.45, y: 0.85}, shadow: '#4a5670'};
  const lit = () => (light().dir.x < 0 ? 1 : -1);
  function rng(seed){ let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const C = (h, k, a) => { const c = hx(h), f = v => Math.max(0, Math.min(255, Math.round(v * (k === undefined ? 1 : k)))); return a === undefined ? 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')' : 'rgba(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ',' + a + ')'; };
  const PAL = {timber: '#4a3826', timberL: '#6e5840', timberD: '#2a1e14', iron: '#2a2a2e', ironL: '#5a5e66', canvas: '#b8a888', canvasD: '#8a7a5c', straw: '#b4923e', strawL: '#dcc268', red: '#9a2e22', blue: '#2e4a7a', yellow: '#c8a030', green: '#4a7a3a', cloth: '#7a6a5a', wool: '#6a5a4a', linen: '#d8d0bc', skin: '#b08868', hair: '#2a2420', ember: '#ff9a3a', magic: '#7ad0ff', gold: '#d4af37', stone: '#5a5a56', stoneD: '#3a3a38', copper: '#a86a3a', glass: '#9ab8c0'};
  function shadowOf(img, ax, ay, s, len){
    const L = light(), dx = L.dir.x * len, dy = Math.max(0.08, L.dir.y * len), h = ay * s, Lx = dx * h, Ly = dy * h, blur = V.K.shadowBlur || 3, pad = blur * 2 + 2;
    const c = mk(img.width * s + Math.abs(Lx) + pad * 2, Ly + pad * 2), g = c.getContext('2d'), bx = pad + Math.max(0, -Lx) + ax * s, by = pad;
    g.filter = 'blur(' + blur + 'px)'; g.setTransform(s, 0, -dx * s, -dy * s, bx - ax * s + dx * ay * s, by + dy * ay * s); g.drawImage(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalCompositeOperation = 'source-in'; g.fillStyle = L.shadow || '#4a5670'; g.fillRect(0, 0, c.width, c.height);
    return {img: c, ax: bx, ay: by};
  }
  function trim(c, ax, ay){
    const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w * 4 + 3; x < w; x++, i += 4) if (d[i]){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return {c, ax, ay};
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
    const t = mk(x1 - x0 + 1, y1 - y0 + 1); t.getContext('2d').drawImage(c, -x0, -y0); return {c: t, ax: ax - x0, ay: ay - y0};
  }
  // a drawing kit bound to one canvas: all sizes in sprite px (PU = one person)
  function kit(g, r){
    const k = {};
    k.rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    k.ell = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); g.fill(); };
    k.poly = (pts, fill, stroke, lw) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); } };
    k.line = (x0, y0, x1, y1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    k.post = (x, top, bot, pw, col) => { k.rect(x - pw / 2, top, pw, bot - top, col || C(PAL.timber)); k.rect(x - pw / 2, top, pw * 0.35, bot - top, C(PAL.timberL, 1, 0.5)); };
    k.plank = (x, y, w, h, col, n) => { k.rect(x, y, w, h, col || C(PAL.timber)); n = n || Math.max(1, Math.round(h / (7 * R))); for (let i = 1; i < n; i++) k.rect(x, y + h * i / n, w, 1.2 * R, C(PAL.timberD, 1, 0.6)); k.rect(x, y, w, 1.5 * R, C(PAL.timberL, 1, 0.55)); };
    k.crate = (x, y, s, col) => { const c0 = col || PAL.timber; k.rect(x - s / 2, y - s, s, s, C(c0)); k.rect(x - s / 2, y - s, s, 1.5 * R, C(PAL.timberL, 1, 0.6)); k.rect(x - s / 2, y - s, 3 * R, s, C(PAL.timberL, 1, 0.45)); k.rect(x + s / 2 - 3 * R, y - s, 3 * R, s, C(PAL.timberD, 1, 0.6)); k.line(x - s / 2 + 3 * R, y - s + 3 * R, x + s / 2 - 3 * R, y - 3 * R, C(PAL.timberD, 1, 0.5), 1.4 * R); k.rect(x - s / 2, y - s / 2 - R, s, 2 * R, C(PAL.timberD, 1, 0.5)); };
    k.barrel = (x, y, bw, bh) => { k.poly([[x - bw * 0.42, y], [x - bw * 0.5, y - bh * 0.5], [x - bw * 0.42, y - bh], [x + bw * 0.42, y - bh], [x + bw * 0.5, y - bh * 0.5], [x + bw * 0.42, y]], C(PAL.timber)); k.rect(x - bw * 0.46, y - bh * 0.8, bw * 0.92, 2 * R, C(PAL.iron)); k.rect(x - bw * 0.46, y - bh * 0.25, bw * 0.92, 2 * R, C(PAL.iron)); k.rect(x - bw * 0.42, y - bh, bw * 0.2, bh, C(PAL.timberL, 1, 0.35)); k.ell(x, y - bh, bw * 0.42, bw * 0.12, C(PAL.timberD)); };
    k.sack = (x, y, w, h, col) => { k.ell(x, y, w / 2, h * 0.22, C(col || PAL.canvasD)); k.poly([[x - w / 2, y], [x - w * 0.42, y - h * 0.8], [x - w * 0.2, y - h], [x + w * 0.2, y - h], [x + w * 0.42, y - h * 0.8], [x + w / 2, y]], C(col || PAL.canvasD)); k.line(x - w * 0.15, y - h * 0.95, x + w * 0.15, y - h * 0.95, C(PAL.timberD), 1.4 * R); k.poly([[x - w / 2, y], [x - w * 0.42, y - h * 0.8], [x - w * 0.25, y - h * 0.6], [x - w * 0.3, y]], C(PAL.canvas, 1, 0.25)); };
    k.bottle = (x, y, w, h, col) => { k.rect(x - w / 2, y - h * 0.65, w, h * 0.65, C(col)); k.ell(x, y - h * 0.65, w / 2, w * 0.3, C(col)); k.rect(x - w * 0.22, y - h, w * 0.44, h * 0.38, C(col, 0.8)); k.rect(x - w * 0.22, y - h, w * 0.44, h * 0.08, C(PAL.timberL)); k.rect(x - w * 0.4, y - h * 0.6, w * 0.18, h * 0.5, 'rgba(255,255,255,.3)'); k.ell(x, y, w / 2, w * 0.3, C(col, 0.6)); };
    k.candle = (x, y, h, w) => { w = w || 5 * R; k.rect(x - w / 2, y - h, w, h, C(PAL.linen)); k.rect(x - w / 2, y - h, w * 0.3, h, 'rgba(0,0,0,.15)'); k.ell(x, y - h - 4 * R, 2.2 * R, 4 * R, C(PAL.ember)); k.ell(x, y - h - 5 * R, 1.1 * R, 2.4 * R, '#fff4c0'); const gr = g.createRadialGradient(x, y - h - 4 * R, 1, x, y - h - 4 * R, 14 * R); gr.addColorStop(0, 'rgba(255,170,70,.35)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(x - 14 * R, y - h - 18 * R, 28 * R, 28 * R); };
    k.blanket = (x, y, w, h, col) => { k.poly([[x - w / 2, y], [x - w / 2 + 3 * R, y - h], [x + w / 2 - 3 * R, y - h], [x + w / 2, y]], C(col)); k.rect(x - w / 2 + 3 * R, y - h, w - 6 * R, 2 * R, C(col, 1.3)); for (let i = 0; i < 3; i++) k.line(x - w / 2 + 6 * R + i * w * 0.3, y - h + 3 * R, x - w / 2 + 4 * R + i * w * 0.3, y - 2 * R, C(col, 0.7), 1.2 * R); };
    k.head = (x, y, rad) => { k.ell(x, y, rad, rad * 1.1, C(PAL.skin)); k.ell(x, y - rad * 0.35, rad * 1.02, rad * 0.75, C(PAL.hair)); };
    k.horse = (x, y, len, col, flip) => { const L = flip ? -1 : 1, bh = len * 0.42, ly = y - bh * 0.95; k.ell(x, ly - bh * 0.5, len * 0.5, bh * 0.5, C(col)); for (const dx of [-0.36, -0.26, 0.24, 0.36]) k.poly([[x + dx * len * L - 3.5 * R, ly - bh * 0.3], [x + dx * len * L + 3.5 * R, ly - bh * 0.3], [x + dx * len * L + 3 * R, y], [x + dx * len * L - 3 * R, y]], C(col, dx < 0 ? 0.85 : 0.95)); k.poly([[x + len * 0.34 * L, ly - bh * 0.75], [x + len * 0.52 * L, ly - bh * 0.6], [x + len * 0.72 * L, ly - bh * 1.55], [x + len * 0.58 * L, ly - bh * 1.62]], C(col)); k.ell(x + len * 0.72 * L, ly - bh * 1.6, len * 0.12, len * 0.075, C(col), L * 0.5); k.ell(x + len * 0.8 * L, ly - bh * 1.68, len * 0.05, len * 0.04, C(col, 0.8)); k.poly([[x + len * 0.56 * L, ly - bh * 1.62], [x + len * 0.68 * L, ly - bh * 1.52], [x + len * 0.5 * L, ly - bh * 1.05], [x + len * 0.42 * L, ly - bh * 0.95]], C(PAL.hair)); k.poly([[x - len * 0.48 * L, ly - bh * 0.85], [x - len * 0.56 * L, ly - bh * 0.7], [x - len * 0.6 * L, ly], [x - len * 0.52 * L, ly - bh * 0.3]], C(PAL.hair)); k.poly([[x - len * 0.18 * L, ly - bh * 0.98], [x + len * 0.16 * L, ly - bh * 0.98], [x + len * 0.12 * L, ly - bh * 0.5], [x - len * 0.14 * L, ly - bh * 0.5]], C(PAL.red, 0.9)); k.ell(x, ly - bh * 0.5, len * 0.5, bh * 0.5, 'rgba(0,0,0,0)'); k.ell(x + len * 0.74 * L, ly - bh * 1.66, 2 * R, 2 * R, '#101010'); };
    return k;
  }

  /* ---- the painters: (k, g, cx, by, o, r) on a canvas; by is the ground line, cx the anchor ---- */
  const PAINT = {};
  const flag = (k, g, x, bot, h, c1, c2) => { k.post(x, bot - h, bot, 3.5 * R, C(PAL.timberD)); k.ell(x, bot - h, 3 * R, 3 * R, C(PAL.gold)); const L = lit(), fw = 0.55 * PU * L, fh = 0.32 * PU, top = bot - h + 6 * R; k.poly([[x, top], [x + fw, top + 4 * R], [x + fw * 0.78, top + fh * 0.5], [x + fw, top + fh - 4 * R], [x, top + fh]], c1 || C(PAL.red)); k.poly([[x, top], [x + fw * 0.5, top + 2 * R], [x + fw * 0.5, top + fh - 2 * R], [x, top + fh]], C(c2 || PAL.gold, 1, 0.35)); k.ell(x + fw * 0.6, top + fh * 0.5, 6 * R, 6 * R, c2 || C(PAL.gold)); };
  const table = (k, x, y, w, h, d) => { d = d || 0.22 * PU; k.poly([[x - w / 2 + 6 * R, y - h], [x + w / 2 - 6 * R, y - h], [x + w / 2 - 2 * R, y - h + 2 * R], [x - w / 2 + 2 * R, y - h + 2 * R]], C(PAL.timberD)); k.plank(x - w / 2, y - h - d, w, d, C(PAL.timber), 3); for (const dx of [-w * 0.38, w * 0.38]){ k.line(x + dx - 7 * R, y, x + dx + 7 * R, y - h, C(PAL.timberD), 3.5 * R); k.line(x + dx + 7 * R, y, x + dx - 7 * R, y - h, C(PAL.timber), 3.5 * R); } };

  PAINT.command = (k, g, cx, by, o) => {
    const L = lit(); flag(k, g, cx - 0.95 * PU * L, by, 1.9 * PU, o.c1, o.c2);
    table(k, cx + 0.1 * PU * L, by - 4 * R, 1.6 * PU, 0.5 * PU);
    const tx = cx + 0.1 * PU * L, ty = by - 4 * R - 0.5 * PU - 0.22 * PU;
    k.poly([[tx - 0.6 * PU, ty + 2 * R], [tx + 0.55 * PU, ty + 2 * R], [tx + 0.5 * PU, ty + 0.19 * PU], [tx - 0.55 * PU, ty + 0.19 * PU]], C(PAL.canvas));   // the map
    for (let i = 0; i < 5; i++) k.line(tx - 0.5 * PU + i * 0.22 * PU, ty + 4 * R, tx - 0.4 * PU + i * 0.2 * PU, ty + 0.17 * PU, C(PAL.timberD, 1, 0.5), 1.2 * R);
    k.ell(tx + 0.1 * PU, ty + 0.1 * PU, 7 * R, 4 * R, C(PAL.red, 1, 0.8)); k.ell(tx - 0.3 * PU, ty + 0.07 * PU, 5 * R, 3 * R, C(PAL.blue, 1, 0.8));
    for (const dx of [-0.52, 0.48]) k.ell(tx + dx * PU, ty + 0.1 * PU, 5 * R, 3 * R, C(PAL.iron));   // weights holding the map
    k.candle(tx + 0.4 * PU, ty + 2 * R, 14 * R);
    k.rect(cx + 0.9 * PU * L - 12 * R, by - 0.3 * PU, 24 * R, 4 * R, C(PAL.timber)); for (const dx of [-9, 9]) k.line(cx + 0.9 * PU * L + dx * R, by - 0.3 * PU, cx + 0.9 * PU * L + dx * R * 1.3, by, C(PAL.timberD), 3 * R);   // a stool
  };
  PAINT.merchant = (k, g, cx, by, o) => {
    const w = 1.7 * PU, top = by - 1.35 * PU; for (const dx of [-w / 2, w / 2]) k.post(cx + dx, top, by - 2 * R, 4 * R);
    k.poly([[cx - w / 2 - 10 * R, top], [cx + w / 2 + 10 * R, top], [cx + w / 2 + 18 * R, top + 0.26 * PU], [cx - w / 2 - 18 * R, top + 0.26 * PU]], C(PAL.canvas));   // the awning
    for (let i = 0; i < 7; i += 2) k.poly([[cx - w / 2 - 10 * R + (w + 20 * R) * i / 7, top], [cx - w / 2 - 10 * R + (w + 20 * R) * (i + 1) / 7, top], [cx - w / 2 - 18 * R + (w + 36 * R) * (i + 1) / 7, top + 0.26 * PU], [cx - w / 2 - 18 * R + (w + 36 * R) * i / 7, top + 0.26 * PU]], C(PAL.red));
    for (let i = 0; i < 8; i++) k.poly([[cx - w / 2 - 18 * R + (w + 36 * R) * i / 8, top + 0.26 * PU], [cx - w / 2 - 18 * R + (w + 36 * R) * (i + 1) / 8, top + 0.26 * PU], [cx - w / 2 - 18 * R + (w + 36 * R) * (i + 0.5) / 8, top + 0.26 * PU + 6 * R]], C(i % 2 ? PAL.red : PAL.canvas));
    table(k, cx, by - 4 * R, 1.5 * PU, 0.48 * PU, 0.18 * PU);
    const ty = by - 4 * R - 0.48 * PU - 0.18 * PU, bolts = [PAL.red, PAL.blue, PAL.yellow, PAL.green];
    for (let i = 0; i < 4; i++){ const x = cx - 0.5 * PU + i * 0.2 * PU, y = ty - 2 * R; k.rect(x - 0.1 * PU, y - 0.16 * PU, 0.2 * PU, 0.16 * PU, C(bolts[i])); k.ell(x + 0.1 * PU, y - 0.08 * PU, 0.03 * PU, 0.08 * PU, C(bolts[i], 1.25)); k.rect(x - 0.1 * PU, y - 0.16 * PU, 0.2 * PU, 2 * R, C(bolts[i], 1.3)); }
    for (let i = 0; i < 3; i++) k.bottle(cx + 0.42 * PU + i * 0.13 * PU, ty, 0.09 * PU, 0.2 * PU, [PAL.green, PAL.copper, PAL.glass][i]);
    const sx = cx + 0.25 * PU, sy = ty; k.post(sx, sy - 0.36 * PU, sy, 2 * R, C(PAL.iron)); k.line(sx - 0.16 * PU, sy - 0.33 * PU, sx + 0.16 * PU, sy - 0.33 * PU, C(PAL.iron), 2 * R); for (const dx of [-0.16, 0.16]){ k.line(sx + dx * PU, sy - 0.33 * PU, sx + dx * PU, sy - 0.18 * PU, C(PAL.ironL), 1 * R); k.ell(sx + dx * PU, sy - 0.17 * PU, 0.06 * PU, 0.025 * PU, C(PAL.gold)); }   // the scale
    k.sack(cx - 0.85 * PU, by, 0.32 * PU, 0.34 * PU); k.crate(cx + 0.85 * PU, by, 0.3 * PU);
  };
  PAINT.cells = (k, g, cx, by, o) => {
    const w = 1.15 * PU, h = 1.4 * PU, x0 = cx - w / 2, y0 = by - 6 * R - h;
    k.rect(x0 - 6 * R, by - 8 * R, w + 12 * R, 8 * R, C(PAL.timberD)); k.rect(x0, y0, w, h, '#17161a');
    const px = cx - w * 0.12, hy = y0 + h * 0.42; k.ell(px, hy + 0.5 * PU, 0.28 * PU, 0.4 * PU, C(PAL.cloth, 0.7)); k.head(px, hy, 0.11 * PU); k.ell(px - 0.08 * PU, hy + 0.24 * PU, 0.1 * PU, 0.05 * PU, C(PAL.skin, 0.9)); k.ell(px + 0.08 * PU, hy + 0.24 * PU, 0.1 * PU, 0.05 * PU, C(PAL.skin, 0.9));   // the captive, hunched
    const n = 8; for (let i = 0; i <= n; i++){ const x = x0 + w * i / n; k.rect(x - 1.8 * R, y0, 3.6 * R, h, C(PAL.iron)); k.rect(x - 1.8 * R, y0, 1.2 * R, h, C(PAL.ironL, 1, 0.5)); }
    for (const t of [0, 0.5, 1]) k.rect(x0 - 4 * R, y0 + h * t - 3 * R, w + 8 * R, 6 * R, C(PAL.iron));
    for (const t of [0, 1]) k.rect(x0 - 4 * R, y0 + h * t - 3 * R, w + 8 * R, 2 * R, C(PAL.ironL, 1, 0.5));
    k.rect(x0 + w * 0.78, y0 + h * 0.47, 10 * R, 12 * R, C(PAL.ironL)); k.ell(x0 + w * 0.78 + 5 * R, y0 + h * 0.47 + 6 * R, 2 * R, 2 * R, '#101010');   // the lock
    k.barrel(cx + w * 0.72, by, 0.22 * PU, 0.24 * PU); k.ell(cx - w * 0.75, by - 2 * R, 0.09 * PU, 0.04 * PU, C(PAL.iron)); k.rect(cx - w * 0.75 - 0.09 * PU, by - 0.14 * PU, 0.18 * PU, 0.12 * PU, C(PAL.iron)); k.ell(cx - w * 0.75, by - 0.14 * PU, 0.09 * PU, 0.04 * PU, C(PAL.ironL));
  };
  PAINT.barracks = (k, g, cx, by, o) => {
    const rx = cx - 1.0 * PU; k.post(rx - 0.3 * PU, by - 1.1 * PU, by, 4 * R); k.post(rx + 0.3 * PU, by - 1.1 * PU, by, 4 * R); k.rect(rx - 0.34 * PU, by - 1.05 * PU, 0.68 * PU, 5 * R, C(PAL.timber));
    for (let i = 0; i < 4; i++){ const x = rx - 0.22 * PU + i * 0.15 * PU; k.line(x + 4 * R, by, x - 2 * R, by - 1.5 * PU, C(PAL.timberL), 2.2 * R); k.poly([[x - 2 * R, by - 1.5 * PU], [x - 6 * R, by - 1.58 * PU], [x - 2 * R, by - 1.72 * PU], [x + 2 * R, by - 1.58 * PU]], C(PAL.ironL)); }   // the spear rack
    const cols = [PAL.wool, PAL.blue, PAL.red]; for (let i = 0; i < 3; i++){ const x = cx - 0.2 * PU + i * 0.72 * PU, y = by - i * 3 * R; k.ell(x, y, 0.5 * PU, 0.09 * PU, 'rgba(0,0,0,.25)'); k.rect(x - 0.46 * PU, y - 0.14 * PU, 0.92 * PU, 0.14 * PU, C(PAL.linen, 0.8)); k.ell(x - 0.46 * PU, y - 0.07 * PU, 0.05 * PU, 0.07 * PU, C(PAL.linen, 0.8)); k.ell(x + 0.46 * PU, y - 0.07 * PU, 0.05 * PU, 0.07 * PU, C(PAL.linen, 0.9)); k.blanket(x + 0.1 * PU, y, 0.66 * PU, 0.16 * PU, cols[i]); k.ell(x - 0.36 * PU, y - 0.14 * PU, 0.1 * PU, 0.05 * PU, C(PAL.canvas)); }   // bedrolls with a pillow roll
    k.crate(cx + 1.05 * PU, by - 2 * R, 0.3 * PU); k.rect(cx + 0.72 * PU, by - 0.08 * PU, 0.14 * PU, 0.08 * PU, C(PAL.timberD)); k.rect(cx + 0.9 * PU, by - 0.08 * PU, 0.14 * PU, 0.08 * PU, C(PAL.timberD));   // boots
  };
  PAINT.armoury = (k, g, cx, by, o) => {
    const s = 0.46 * PU; k.crate(cx - s * 0.55, by, s); k.crate(cx + s * 0.55, by - 2 * R, s); k.crate(cx, by - s, s, PAL.timberL);
    for (let i = 0; i < 4; i++){ const x = cx - 0.12 * PU + i * 0.08 * PU; k.line(x, by - s * 2 + 4 * R, x + (i - 1.5) * 6 * R, by - s * 2 - 0.55 * PU, C(PAL.timberL), 2.2 * R); k.poly([[x + (i - 1.5) * 6 * R, by - s * 2 - 0.55 * PU], [x + (i - 1.5) * 6 * R - 4 * R, by - s * 2 - 0.62 * PU], [x + (i - 1.5) * 6 * R, by - s * 2 - 0.75 * PU], [x + (i - 1.5) * 6 * R + 4 * R, by - s * 2 - 0.62 * PU]], C(PAL.ironL)); }   // spears from the top crate
    const bx = cx + 0.75 * PU; k.barrel(bx, by, 0.3 * PU, 0.42 * PU); for (let i = 0; i < 7; i++){ const x = bx - 0.1 * PU + i * 0.034 * PU, h = 0.42 * PU + 0.2 * PU + (i % 3) * 4 * R; k.line(x, by - 0.42 * PU, x + (i - 3) * 1.5 * R, by - h, C(PAL.timberL), 1.2 * R); k.poly([[x + (i - 3) * 1.5 * R - 3 * R, by - h + 8 * R], [x + (i - 3) * 1.5 * R, by - h], [x + (i - 3) * 1.5 * R + 3 * R, by - h + 8 * R]], C(i % 2 ? PAL.red : PAL.linen)); }   // arrows, fletched
    const sx = cx - 0.78 * PU, sy = by - 0.28 * PU; k.ell(sx, sy, 0.26 * PU, 0.3 * PU, C(PAL.iron)); k.ell(sx, sy, 0.22 * PU, 0.26 * PU, o.c1 || C(PAL.red)); k.ell(sx, sy, 0.06 * PU, 0.06 * PU, C(PAL.gold)); k.ell(sx - 0.08 * PU, sy - 0.1 * PU, 0.07 * PU, 0.05 * PU, 'rgba(255,255,255,.18)');   // a shield leaning
    k.rect(cx - 0.3 * PU, by - 4 * R, 0.2 * PU, 4 * R, C(PAL.ironL)); k.rect(cx - 0.2 * PU, by - 0.1 * PU, 0.05 * PU, 0.1 * PU, C(PAL.iron));   // a helm on the deck
  };
  PAINT.stables = (k, g, cx, by, o) => {
    const ry = by - 0.3 * PU; k.post(cx - 1.2 * PU, by - 0.95 * PU, ry + 0.3 * PU, 5 * R); k.post(cx + 1.2 * PU, by - 0.95 * PU, ry + 0.3 * PU, 5 * R); k.rect(cx - 1.25 * PU, by - 0.92 * PU, 2.5 * PU, 6 * R, C(PAL.timber)); k.rect(cx - 1.25 * PU, by - 0.92 * PU, 2.5 * PU, 2 * R, C(PAL.timberL, 1, 0.6));   // the rail
    k.horse(cx - 0.55 * PU, by - 0.1 * PU, 1.1 * PU, '#5a3a24', false); k.horse(cx + 0.6 * PU, by - 0.04 * PU, 1.05 * PU, '#8a8680', true);
    for (const [dx, dy] of [[-1.15, 0], [-0.95, -0.02], [1.15, 0]]){ const x = cx + dx * PU, y = by + dy * PU; k.rect(x - 0.24 * PU, y - 0.3 * PU, 0.48 * PU, 0.3 * PU, C(PAL.straw)); k.rect(x - 0.24 * PU, y - 0.3 * PU, 0.48 * PU, 3 * R, C(PAL.strawL)); for (let i = 0; i < 6; i++) k.line(x - 0.22 * PU + i * 0.08 * PU, y - 0.28 * PU, x - 0.2 * PU + i * 0.08 * PU, y - 2 * R, C(PAL.strawL, 1, 0.6), 1.2 * R); k.rect(x - 0.24 * PU, y - 0.2 * PU, 0.48 * PU, 1.5 * R, C(PAL.timberD, 1, 0.6)); k.rect(x - 0.24 * PU, y - 0.1 * PU, 0.48 * PU, 1.5 * R, C(PAL.timberD, 1, 0.6)); }   // hay bales
    k.rect(cx - 0.05 * PU, by - 0.16 * PU, 0.16 * PU, 0.16 * PU, C(PAL.iron)); k.ell(cx + 0.03 * PU, by - 0.16 * PU, 0.08 * PU, 0.03 * PU, C(PAL.ironL));   // a bucket
  };
  PAINT.hospital = (k, g, cx, by, o) => {
    for (let i = 0; i < 3; i++){ const x = cx - 1.0 * PU + i * 1.0 * PU, y = by - i * 2 * R, w = 0.95 * PU, h = 0.28 * PU;
      for (const dx of [-w / 2 + 4 * R, w / 2 - 4 * R]) k.rect(x + dx - 2.5 * R, y - h, 5 * R, h, C(PAL.timberD));
      k.rect(x - w / 2, y - h, w, 0.08 * PU, C(PAL.timber)); k.rect(x - w / 2, y - h, w, 2 * R, C(PAL.timberL, 1, 0.6));
      k.rect(x - w / 2 + 2 * R, y - h - 0.06 * PU, w - 4 * R, 0.06 * PU, C(PAL.linen)); k.ell(x - w / 2 + 0.12 * PU, y - h - 0.07 * PU, 0.1 * PU, 0.045 * PU, C(PAL.linen, 1.05));
      if (i === 1){ k.head(x - w / 2 + 0.13 * PU, y - h - 0.1 * PU, 0.09 * PU); k.poly([[x - w / 2 + 0.25 * PU, y - h - 0.05 * PU], [x - w / 2 + 0.3 * PU, y - h - 0.17 * PU], [x + w / 2 - 0.1 * PU, y - h - 0.14 * PU], [x + w / 2 - 0.05 * PU, y - h - 0.05 * PU]], C(PAL.wool)); k.rect(x - w / 2 + 0.25 * PU, y - h - 0.06 * PU, w - 0.3 * PU, 2 * R, C(PAL.wool, 1.3)); }
      else k.blanket(x + 0.1 * PU, y - h - 0.05 * PU, w - 0.3 * PU, 0.06 * PU, i ? PAL.blue : PAL.wool);
    }
    const jx = cx + 1.55 * PU; k.rect(jx - 0.1 * PU, by - 0.3 * PU, 0.2 * PU, 0.3 * PU, C(PAL.timber)); k.ell(jx, by - 0.3 * PU, 0.1 * PU, 0.04 * PU, C(PAL.timberL)); k.bottle(jx - 0.02 * PU, by - 0.3 * PU, 0.08 * PU, 0.18 * PU, PAL.glass); k.rect(jx - 0.08 * PU, by - 0.34 * PU, 0.06 * PU, 0.04 * PU, C(PAL.linen));   // a stand with water and lint
  };
  PAINT.blacksmith = (k, g, cx, by, o) => {
    const sx = cx - 0.1 * PU; k.rect(sx - 0.2 * PU, by - 0.34 * PU, 0.4 * PU, 0.34 * PU, C(PAL.timber)); k.ell(sx, by - 0.34 * PU, 0.2 * PU, 0.07 * PU, C(PAL.timberL)); k.ell(sx, by, 0.2 * PU, 0.07 * PU, C(PAL.timberD));   // the stump
    k.poly([[sx - 0.3 * PU, by - 0.5 * PU], [sx + 0.28 * PU, by - 0.5 * PU], [sx + 0.38 * PU, by - 0.44 * PU], [sx + 0.2 * PU, by - 0.4 * PU], [sx + 0.12 * PU, by - 0.34 * PU], [sx - 0.12 * PU, by - 0.34 * PU], [sx - 0.18 * PU, by - 0.42 * PU], [sx - 0.3 * PU, by - 0.44 * PU]], C(PAL.iron)); k.rect(sx - 0.3 * PU, by - 0.5 * PU, 0.58 * PU, 2 * R, C(PAL.ironL));   // the anvil
    k.line(sx + 0.05 * PU, by - 0.5 * PU, sx + 0.3 * PU, by - 0.68 * PU, C(PAL.timberL), 2.4 * R); k.rect(sx + 0.26 * PU, by - 0.74 * PU, 0.1 * PU, 0.07 * PU, C(PAL.iron));   // the hammer
    const bx = cx + 0.8 * PU, bh = by - 0.42 * PU; for (const dx of [-0.16, 0, 0.16]) k.line(bx + dx * PU, bh, bx + dx * PU * 1.4, by, C(PAL.iron), 2.6 * R); k.ell(bx, bh, 0.3 * PU, 0.1 * PU, C(PAL.iron)); k.ell(bx, bh - 2 * R, 0.24 * PU, 0.07 * PU, C(PAL.ember, 0.75)); k.ell(bx, bh - 3 * R, 0.14 * PU, 0.04 * PU, '#ffd080'); const gr = g.createRadialGradient(bx, bh - 4 * R, 2, bx, bh - 4 * R, 0.5 * PU); gr.addColorStop(0, 'rgba(255,150,60,.4)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(bx - 0.5 * PU, bh - 0.5 * PU, PU, 0.6 * PU);   // the brazier
    const wx = cx - 0.85 * PU; k.barrel(wx, by, 0.32 * PU, 0.42 * PU); for (let i = 0; i < 5; i++){ const x = wx - 0.1 * PU + i * 0.05 * PU, h = 0.42 * PU + 0.3 * PU + (i % 2) * 6 * R; k.line(x, by - 0.42 * PU, x + (i - 2) * 2 * R, by - h, C(PAL.ironL), 2.2 * R); k.line(x + (i - 2) * 2 * R - 5 * R, by - h + 0.1 * PU, x + (i - 2) * 2 * R + 5 * R, by - h + 0.1 * PU, C(PAL.iron), 2 * R); }   // a barrel of swords
    k.line(cx + 0.3 * PU, by - 2 * R, cx + 0.52 * PU, by - 0.12 * PU, C(PAL.iron), 1.6 * R); k.line(cx + 0.33 * PU, by - 0.06 * PU, cx + 0.52 * PU, by - 0.12 * PU, C(PAL.iron), 1.6 * R);   // tongs
  };
  PAINT.alchemy = (k, g, cx, by, o) => {
    table(k, cx + 0.55 * PU, by - 0.12 * PU, 0.9 * PU, 0.5 * PU, 0.12 * PU); table(k, cx - 0.5 * PU, by, 1.2 * PU, 0.52 * PU, 0.14 * PU);
    const t1 = by - 0.52 * PU - 0.14 * PU, cols = [PAL.green, PAL.red, PAL.magic, PAL.yellow, PAL.copper, '#8a3a9a'];
    for (let i = 0; i < 6; i++) k.bottle(cx - 1.0 * PU + i * 0.17 * PU, t1, 0.08 * PU + (i % 2) * 2 * R, 0.16 * PU + (i % 3) * 5 * R, cols[i]);
    const t2 = by - 0.12 * PU - 0.5 * PU - 0.12 * PU, px = cx + 0.45 * PU; k.ell(px, t2 - 0.12 * PU, 0.13 * PU, 0.12 * PU, C(PAL.copper)); k.rect(px - 0.04 * PU, t2 - 0.3 * PU, 0.08 * PU, 0.1 * PU, C(PAL.copper)); k.ell(px - 0.04 * PU, t2 - 0.15 * PU, 0.04 * PU, 0.05 * PU, 'rgba(255,255,255,.2)');   // the still
    g.strokeStyle = C(PAL.copper); g.lineWidth = 2.4 * R; g.beginPath(); g.moveTo(px + 0.04 * PU, t2 - 0.3 * PU); g.bezierCurveTo(px + 0.3 * PU, t2 - 0.38 * PU, px + 0.32 * PU, t2 - 0.06 * PU, px + 0.28 * PU, t2 - 0.02 * PU); g.stroke(); k.bottle(px + 0.28 * PU, t2, 0.09 * PU, 0.14 * PU, PAL.glass);
    k.rect(cx - 0.05 * PU, t1 - 0.1 * PU, 0.22 * PU, 0.1 * PU, C(PAL.red, 0.7)); k.rect(cx - 0.03 * PU, t1 - 0.18 * PU, 0.18 * PU, 0.08 * PU, C(PAL.blue, 0.8));   // books
    k.sack(cx - 1.25 * PU, by, 0.3 * PU, 0.3 * PU, PAL.canvasD); k.sack(cx - 1.0 * PU, by + 2 * R, 0.26 * PU, 0.24 * PU, PAL.canvas); k.ell(cx + 1.15 * PU, by - 2 * R, 0.1 * PU, 0.04 * PU, C(PAL.stone)); k.rect(cx + 1.05 * PU, by - 0.12 * PU, 0.2 * PU, 0.1 * PU, C(PAL.stone)); k.ell(cx + 1.15 * PU, by - 0.12 * PU, 0.1 * PU, 0.04 * PU, C(PAL.stoneD));   // a mortar
    const gr = g.createRadialGradient(cx - 0.4 * PU, t1 - 0.1 * PU, 2, cx - 0.4 * PU, t1 - 0.1 * PU, 0.5 * PU); gr.addColorStop(0, 'rgba(120,220,120,.18)'); gr.addColorStop(1, 'rgba(120,220,120,0)'); g.fillStyle = gr; g.fillRect(cx - 1.0 * PU, t1 - 0.6 * PU, 1.2 * PU, 0.7 * PU);
  };
  PAINT.magetower = (k, g, cx, by, o) => {
    const rx = 1.1 * PU, ry = 0.42 * PU, cy = by - 0.1 * PU;
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rx); gr.addColorStop(0, 'rgba(120,200,255,.28)'); gr.addColorStop(0.75, 'rgba(120,200,255,.10)'); gr.addColorStop(1, 'rgba(120,200,255,0)'); g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx); for (const [rr, lw, a] of [[rx, 3 * R, 0.9], [rx * 0.86, 1.6 * R, 0.6], [rx * 0.55, 2 * R, 0.8]]){ g.strokeStyle = 'rgba(150,220,255,' + a + ')'; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = 'rgba(180,230,255,.7)'; g.lineWidth = 1.8 * R; g.beginPath(); for (let i = 0; i < 7; i++){ const a0 = i * Math.PI * 2 / 7, a1 = (i + 3) * Math.PI * 2 / 7; g.moveTo(Math.cos(a0) * rx * 0.55, Math.sin(a0) * rx * 0.55); g.lineTo(Math.cos(a1) * rx * 0.55, Math.sin(a1) * rx * 0.55); } g.stroke();
    for (let i = 0; i < 7; i++){ const a = i * Math.PI * 2 / 7 + 0.3, x = Math.cos(a) * rx * 0.72, y = Math.sin(a) * rx * 0.72; g.fillStyle = 'rgba(200,240,255,.9)'; g.fillRect(x - 3 * R, y - 5 * R, 6 * R, 10 * R); g.fillStyle = 'rgba(80,140,220,.9)'; g.fillRect(x - 1.5 * R, y - 2 * R, 3 * R, 4 * R); } g.restore();   // runes
    const pg = g.createLinearGradient(0, cy - 1.6 * PU, 0, cy); pg.addColorStop(0, 'rgba(150,210,255,0)'); pg.addColorStop(1, 'rgba(150,210,255,.22)'); g.fillStyle = pg; g.fillRect(cx - rx * 0.5, cy - 1.6 * PU, rx, 1.6 * PU);   // the pillar of light
    for (let i = 0; i < 9; i++){ const a = i * 1.3, h = (i * 37) % 100 / 100; k.ell(cx + Math.cos(a) * rx * 0.4, cy - h * 1.3 * PU, 2 * R, 2 * R, 'rgba(220,245,255,' + (0.9 - h * 0.7) + ')'); }   // motes rising
    const ox = cx + 0.9 * PU; k.post(ox, cy - 0.5 * PU, cy, 3 * R, C(PAL.stone)); k.ell(ox, cy - 0.5 * PU, 0.08 * PU, 0.08 * PU, '#9ad8ff'); k.ell(ox - 0.02 * PU, cy - 0.53 * PU, 0.03 * PU, 0.03 * PU, '#ffffff');   // the orb on its stand
  };
  PAINT.shrine = (k, g, cx, by, o) => {
    const w = 1.0 * PU, ah = 0.5 * PU; k.rect(cx - w / 2 - 0.12 * PU, by - 0.1 * PU, w + 0.24 * PU, 0.1 * PU, C(PAL.stoneD)); k.rect(cx - w / 2, by - ah, w, ah - 0.1 * PU, C(PAL.stone)); k.rect(cx - w / 2, by - ah, w, 3 * R, C(PAL.stone, 1.25)); k.rect(cx - w / 2, by - ah, 0.1 * PU, ah - 0.1 * PU, C(PAL.stone, 1.15));   // the altar on a step
    const nh = 1.35 * PU, nw = 0.62 * PU; k.poly([[cx - nw / 2, by - ah], [cx - nw / 2, by - nh + 0.2 * PU], [cx, by - nh], [cx + nw / 2, by - nh + 0.2 * PU], [cx + nw / 2, by - ah]], C(PAL.stoneD)); k.poly([[cx - nw / 2 + 4 * R, by - ah], [cx - nw / 2 + 4 * R, by - nh + 0.22 * PU], [cx, by - nh + 5 * R], [cx + nw / 2 - 4 * R, by - nh + 0.22 * PU], [cx + nw / 2 - 4 * R, by - ah]], '#1c1a20');   // the niche
    k.ell(cx, by - ah - 0.45 * PU, 0.14 * PU, 0.14 * PU, C(PAL.gold)); k.ell(cx, by - ah - 0.45 * PU, 0.09 * PU, 0.09 * PU, C(PAL.gold, 1.2)); k.rect(cx - 1.5 * R, by - ah - 0.58 * PU, 3 * R, 0.26 * PU, C(PAL.gold, 0.8)); k.rect(cx - 0.07 * PU, by - ah - 0.52 * PU, 0.14 * PU, 3 * R, C(PAL.gold, 0.8));   // the sun disc and cross
    const cands = [[-0.42, 0, 16], [-0.3, 0, 22], [-0.18, 0, 12], [0.2, 0, 18], [0.32, 0, 24], [0.44, 0, 14], [-0.36, 0.08, 10], [0.38, 0.09, 12], [-0.6, 0.42, 14], [-0.48, 0.44, 9], [0.52, 0.42, 16], [0.66, 0.45, 11], [-0.08, 0.44, 12], [0.1, 0.45, 8]];
    for (const [dx, dy, h] of cands) k.candle(cx + dx * PU, by - ah + dy * PU, h * R, (4 + (h % 3)) * R);
    if (o.bell){ k.poly([[cx - 0.22 * PU, by - nh + 0.1 * PU], [cx - 0.22 * PU, by - nh - 0.3 * PU], [cx, by - nh - 0.42 * PU], [cx + 0.22 * PU, by - nh - 0.3 * PU], [cx + 0.22 * PU, by - nh + 0.1 * PU]], C(PAL.stoneD)); k.rect(cx - 0.14 * PU, by - nh - 0.26 * PU, 0.28 * PU, 0.3 * PU, '#1c1a20'); k.poly([[cx - 0.08 * PU, by - nh - 0.02 * PU], [cx - 0.06 * PU, by - nh - 0.2 * PU], [cx + 0.06 * PU, by - nh - 0.2 * PU], [cx + 0.08 * PU, by - nh - 0.02 * PU]], C(PAL.gold, 0.8)); k.ell(cx, by - nh - 0.02 * PU, 0.09 * PU, 0.03 * PU, C(PAL.gold, 0.7)); }
  };
  PAINT.bunks = (k, g, cx, by, o) => {
    for (const bxo of [-0.72, 0.72]){ const bx = cx + bxo * PU, w = 1.0 * PU, H = 1.9 * PU; for (const dx of [-w / 2, w / 2]) k.post(bx + dx, by - H, by, 5 * R);
      const cols = [PAL.wool, PAL.red, PAL.blue, PAL.green, PAL.cloth, PAL.yellow]; for (let i = 0; i < 3; i++){ const y = by - 0.3 * PU - i * 0.6 * PU; k.rect(bx - w / 2, y - 0.07 * PU, w, 0.07 * PU, C(PAL.timber)); k.rect(bx - w / 2, y - 0.07 * PU, w, 2 * R, C(PAL.timberL, 1, 0.6)); k.rect(bx - w / 2 + 3 * R, y - 0.13 * PU, w - 6 * R, 0.06 * PU, C(PAL.linen, 0.9)); k.blanket(bx + 0.1 * PU, y - 0.12 * PU, w - 0.3 * PU, 0.07 * PU, cols[(i + (bxo > 0 ? 3 : 0)) % 6]); k.ell(bx - w / 2 + 0.12 * PU, y - 0.15 * PU, 0.09 * PU, 0.04 * PU, C(PAL.linen)); } }
    const lx = cx + 0.1 * PU; k.line(lx - 0.08 * PU, by, lx + 0.02 * PU, by - 1.7 * PU, C(PAL.timberL), 3 * R); k.line(lx + 0.08 * PU, by, lx + 0.18 * PU, by - 1.7 * PU, C(PAL.timberL), 3 * R); for (let i = 1; i < 7; i++){ const t = i / 7; k.line(lx - 0.08 * PU + 0.1 * PU * t, by - 1.7 * PU * t, lx + 0.08 * PU + 0.1 * PU * t, by - 1.7 * PU * t, C(PAL.timber), 2.4 * R); }   // the ladder
    k.rect(cx - 1.35 * PU, by - 0.08 * PU, 0.12 * PU, 0.08 * PU, C(PAL.timberD)); k.rect(cx - 1.2 * PU, by - 0.08 * PU, 0.12 * PU, 0.08 * PU, C(PAL.timberD));
  };
  PAINT.engineering = (k, g, cx, by, o) => {
    table(k, cx - 0.4 * PU, by, 1.4 * PU, 0.5 * PU, 0.14 * PU); const ty = by - 0.64 * PU;
    const gx = cx - 0.7 * PU, gy = ty - 0.3 * PU, gr = 0.3 * PU; g.save(); g.translate(gx, gy); g.fillStyle = C(PAL.iron); for (let i = 0; i < 12; i++){ const a = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(a - 0.12) * gr * 0.85, Math.sin(a - 0.12) * gr * 0.85); g.lineTo(Math.cos(a - 0.08) * gr, Math.sin(a - 0.08) * gr); g.lineTo(Math.cos(a + 0.08) * gr, Math.sin(a + 0.08) * gr); g.lineTo(Math.cos(a + 0.12) * gr * 0.85, Math.sin(a + 0.12) * gr * 0.85); g.closePath(); g.fill(); } g.beginPath(); g.arc(0, 0, gr * 0.86, 0, Math.PI * 2); g.fill(); g.fillStyle = C(PAL.ironL); g.beginPath(); g.arc(0, 0, gr * 0.5, 0, Math.PI * 2); g.fill(); g.fillStyle = C(PAL.iron); g.beginPath(); g.arc(0, 0, gr * 0.14, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + 0.4; g.fillStyle = C(PAL.iron); g.fillRect(Math.cos(a) * gr * 0.32 - 3 * R, Math.sin(a) * gr * 0.32 - 3 * R, 6 * R, 6 * R); } g.restore();   // the cog on the bench
    k.rect(cx - 0.2 * PU, ty - 0.12 * PU, 0.16 * PU, 0.12 * PU, C(PAL.iron)); k.rect(cx - 0.22 * PU, ty - 0.14 * PU, 0.2 * PU, 3 * R, C(PAL.ironL)); k.line(cx - 0.12 * PU, ty - 0.14 * PU, cx - 0.12 * PU, ty - 0.3 * PU, C(PAL.ironL), 2.5 * R);   // a vice
    k.poly([[cx + 0.0 * PU, ty + 2 * R], [cx + 0.3 * PU, ty + 2 * R], [cx + 0.28 * PU, ty - 0.12 * PU], [cx + 0.02 * PU, ty - 0.12 * PU]], C(PAL.canvas)); for (let i = 0; i < 3; i++) k.line(cx + 0.04 * PU, ty - 0.08 * PU + i * 0.03 * PU, cx + 0.24 * PU, ty - 0.09 * PU + i * 0.03 * PU, C(PAL.blue, 1, 0.6), 1 * R);   // a plan
    const fx = cx + 0.95 * PU; k.line(fx - 0.35 * PU, by, fx, by - 1.25 * PU, C(PAL.timber), 5 * R); k.line(fx + 0.35 * PU, by, fx, by - 1.25 * PU, C(PAL.timber), 5 * R); k.line(fx - 0.22 * PU, by - 0.5 * PU, fx + 0.22 * PU, by - 0.5 * PU, C(PAL.timber), 4 * R); k.ell(fx, by - 0.5 * PU, 0.1 * PU, 0.1 * PU, C(PAL.timberL)); k.ell(fx, by - 0.5 * PU, 0.05 * PU, 0.05 * PU, C(PAL.iron)); k.line(fx, by - 0.5 * PU, fx + 0.12 * PU, by - 0.32 * PU, C(PAL.iron), 2.2 * R); k.line(fx, by - 1.2 * PU, fx, by - 0.6 * PU, C(PAL.canvasD), 1.6 * R);   // a half-built frame with a windlass
    const wx = cx - 1.25 * PU, wy = by - 0.32 * PU, wr = 0.3 * PU; g.save(); g.translate(wx, wy); g.strokeStyle = C(PAL.timber); g.lineWidth = 5 * R; g.beginPath(); g.arc(0, 0, wr, 0, Math.PI * 2); g.stroke(); g.lineWidth = 2.4 * R; for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * wr, Math.sin(a) * wr); g.stroke(); } g.fillStyle = C(PAL.iron); g.beginPath(); g.arc(0, 0, 0.05 * PU, 0, Math.PI * 2); g.fill(); g.restore();   // a cart wheel against the bench
    for (let i = 0; i < 4; i++) k.ell(cx + 0.35 * PU + i * 0.07 * PU, by - 2 * R - (i % 2) * 3 * R, 0.04 * PU, 0.02 * PU, C(PAL.ironL));   // loose rings and bolts
  };
  const SIZE = {command: [3.2, 2.2], merchant: [3.0, 2.0], cells: [2.6, 1.9], barracks: [3.4, 2.0], armoury: [2.8, 2.0], stables: [3.6, 2.2], hospital: [3.6, 1.6], blacksmith: [3.0, 1.6], alchemy: [3.2, 1.8], magetower: [3.0, 2.2], shrine: [2.4, 2.4], bunks: [3.2, 2.4], engineering: [3.4, 1.9]};

  /* ---- routing: sk2_<barge|warehouse>_<id>, with _dmg; ruins (ws_) fall through ---- */
  O.parse = function(kind){
    if (typeof kind !== 'string' || kind.slice(0, 3) === 'ws_') return null;
    let k = kind, dmg = false; if (k.slice(-4) === '_dmg'){ dmg = true; k = k.slice(0, -4); }
    const m = /^sk2?_(barge|warehouse)_([a-z]+)$/.exec(k); if (!m) return null;
    const hk = m[1], id = m[2], p = O.map[id]; if (!p) return null;
    if (id === 'blacksmith' && hk !== 'barge') return null;   // the warehouse furnace stays (Patrick: "great")
    if (id === 'engineering' && hk !== 'warehouse') return null;   // the barge cannon stays
    return {hk, id, p, dmg, bell: id === 'fortresschurch'};
  };
  O.sprite = function(m){
    let c1 = null, c2 = null; try { const b = typeof banner === 'function' && banner(); if (b && b.c1){ c1 = b.c1; c2 = b.c2; } } catch (e) {}
    const key = m.p + ':' + (m.bell ? 'bell' : '') + ':' + (c1 || '') + ':' + (c2 || '') + ':' + lit();
    let sp = O.cache[key]; if (sp) return sp;
    const sz = SIZE[m.p], c = mk(sz[0] * PU + 40, sz[1] * PU + 40), g = c.getContext('2d'), k = kit(g, rng(m.p.length * 977 + 11)), cx = c.width / 2, by = c.height - 12;
    try { PAINT[m.p](k, g, cx, by, {bell: m.bell, c1, c2}); } catch (e) { console.warn('OA27 paint', m.p, e); return null; }
    const t = trim(c, cx, by);
    sp = {img: t.c, ax: t.ax, ay: t.ay, s: 1 / R, shadow: shadowOf(t.c, t.ax, t.ay, 1 / R, m.p === 'magetower' ? 0.08 : (V.K.shadowLen || 0.5)), tall: m.p !== 'magetower', kind: 'oa'};
    return O.cache[key] = sp;
  };
  O.blit = function(sp, x, gl, m){
    const hub = (V.hubFort && V.hubFort()) || (V.hubDeck && V.hubDeck()) || (typeof G === 'undefined' || !G) && !(typeof CAMP !== 'undefined' && CAMP && CAMP.on), B = (hub ? O.K.build : 1) * V.persp(gl), s = sp.s * B, c = ctx;
    if (sp.shadow){ c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.6; c.drawImage(sp.shadow.img, x - sp.shadow.ax * B, gl - sp.shadow.ay * B, sp.shadow.img.width * B, sp.shadow.img.height * B); c.restore(); }
    c.save(); c.imageSmoothingEnabled = true; if (m.dmg) c.globalAlpha = 0.8; c.drawImage(sp.img, x - sp.ax * s, gl - sp.ay * s, sp.img.width * s, sp.img.height * s); c.restore();
  };
  if (V.drawFacility && !V.drawFacility.__oa27){
    const f = V.drawFacility;
    V.drawFacility = function(kind, x, gl, o){
      { const m = O.parse(kind); if (m){ const sp = O.sprite(m); if (sp){ O.blit(sp, x, gl, m); if (V.chimAt) V.chimAt[m.hk + '_' + m.id] = null; return true; } } }
      return f.apply(this, arguments);
    };
    V.drawFacility.__oa27 = true; O.hook = V.drawFacility;
  }
  O.selfTest = function(){
    const out = [], ok = (n, c) => out.push((c ? 'PASS ' : 'FAIL ') + n);
    const ks = Object.keys(PAINT), sps = ks.map(p => O.sprite({p, bell: p === 'shrine'}));
    ok('OA27: all ' + ks.length + ' open-air props paint, each at most 3.7 persons wide and 2.5 tall', sps.every(s => s && s.img.width * s.s * O.K.build <= 3.7 * 80 + 40 && s.img.height * s.s * O.K.build <= 2.5 * 80 + 40));
    ok('OA27: sk2_barge_armoury, sk2_warehouse_chapel_dmg and sk2_barge_fortresschurch route to the props; sk2_warehouse_blacksmith, sk2_barge_engineering and a ruin fall through', O.parse('sk2_barge_armoury') && O.parse('sk2_barge_armoury').p === 'armoury' && O.parse('sk2_warehouse_chapel_dmg').dmg && O.parse('sk2_barge_fortresschurch').bell && !O.parse('sk2_warehouse_blacksmith') && !O.parse('sk2_barge_engineering') && !O.parse('ws_sk2_barge_cells'));
    /* QA step 5: later files wrap V.drawFacility too, so the row checks that a prop kind still reaches O.blit through the whole chain */
    { const b0 = O.blit; let hit = 0; O.blit = () => { hit++; };
      try { V.drawFacility('sk2_barge_armoury', null, 0, {}); } catch (e) {} finally { O.blit = b0; }
      ok('OA27: V.drawFacility routes a prop kind to the painted prop and still answers an unknown kind with null', typeof O.hook === 'function' && hit === 1 && V.drawFacility('f_nothing', 0, 0, {}) === null); }
    ok('OA27: V.hubDeck exists for the barge and warehouse scale (vo3.js, Index OA27)', typeof V.hubDeck === 'function');
    return out;
  };
})();
