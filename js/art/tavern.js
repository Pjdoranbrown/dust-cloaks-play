/* INDEX 93 - T-01 tavern backdrop (js/art/tavern.js)
 *
 * What it does: draws a three-layer pixel-art tavern interior (back wall with
 * hearth, shelves and hanging lamps; perspective floor with rugs and lamp pools;
 * dark foreground tables, stools and barrels) on its own <canvas id="tavern-art">
 * that sits just under the Camp Tavern hub (z-index 59, hub is 60). The static
 * layers are drawn once to small offscreen canvases and scaled up with smoothing
 * off. Only the fire, sparks and lamp glow are redrawn (FPS cap below), and only
 * while the hub is visible. It hooks in by wrapping window.TAVERN.enter / leave.
 * If anything is missing or throws, the canvas is hidden, the html class is
 * removed and the old CSS look is left exactly as it was.
 *
 * ROLLBACK: delete this file and its <script> tag
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Tunables
  // ------------------------------------------------------------------
  const TARGET_LOGICAL_H = 180;  // logical pixel rows for the screen height (about 320 x 180 on 16:9)
  const MIN_LOGICAL_W    = 160;  // never let the logical width fall below this (portrait screens)
  const FPS              = 15;   // animation cap
  const GLOW_STRENGTH    = 1.0;  // lamp glow multiplier (0 = off, 1 = about rgba(255,190,90,.30))
  const HEARTH_GLOW      = 1.0;  // hearth glow multiplier on wall and floor
  const FLICKER          = 0.16; // glow flicker depth (0 = steady)
  const SPARK_COUNT      = 12;   // maximum sparks alive at once
  const SPARK_RATE       = 0.22; // chance per frame that an idle spark slot respawns
  const FLAME_HEIGHT     = 22;   // tallest flame column, logical px
  const CLEAR_ZONE_CSS   = 190;  // bottom-left square (CSS px) kept free for the bard and his stage
  const BARD_CLEAR       = true; // false = ignore the bard corner when placing foreground props
  const HIDE_CSS_EXTRAS  = true; // hide Index 92 CSS hearth (::after) and lamp strip (::before) while active
  const TFLOOR_BG        = 'rgba(26,14,6,.30)'; // card panel background while active; '' = leave the panel alone
  const Z_INDEX          = 59;
  const HTML_CLASS       = 'tvart';

  // ------------------------------------------------------------------
  // Palette (only the colours in palette-and-scale.txt)
  // ------------------------------------------------------------------
  const P = {
    bgDeep: '#1a0e06', bgMid: '#4a2c14', bgDark: '#2a1406',
    wood1: '#5a3a1c', wood2: '#4e3017', woodL: '#a06a30', woodLL: '#c08a48', wood3: '#5a3418',
    stone: '#4a4038', stoneD: '#2e2822', soot: '#0c0602',
    fireHi: '#ffe8a0', fireLo: '#ffb030',
    steel: '#9aa3ad', steelL: '#d3d9de', steelD: '#5f6870',
    gold: '#d4af37', goldD: '#8a6d1a',
    wood: '#8a5a2b', woodD: '#5a3a1a', leather: '#7a4f2a', boot: '#3a2a1c', bone: '#ece0c4',
    out: '#1b1410'
  };
  const LAMP_RGB = '255,190,90';   // lamplight rgba(255,190,90,.34)
  const FIRE_RGB = '255,176,48';   // #ffb030
  const SOOT_RGB = '12,6,2';       // #0c0602
  const DARK_RGB = '26,14,6';      // #1a0e06

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  let hooked = false, failed = false;
  let cv = null, ctx = null, styleEl = null;
  let timer = null, rzTimer = null, listening = false;
  let M = null;           // metrics { pw, ph, sd, lw, lh, dpr }
  let L = null;           // built layers
  let sparks = [];
  let reduced = false;

  // ------------------------------------------------------------------
  // Small helpers
  // ------------------------------------------------------------------
  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    if (!g) throw new Error('no 2d context');
    g.imageSmoothingEnabled = false;
    return { c: c, g: g };
  }
  function rect(g, x, y, w, h, col) {
    if (w <= 0 || h <= 0) return;
    g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function rng(seed) {
    let s = (seed >>> 0) || 7;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash2(a, b) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // 1px dark outline round every opaque pixel (same idea as the game's outline())
  function outline(c, col) {
    const g = c.getContext('2d'), w = c.width, h = c.height, a = g.getImageData(0, 0, w, h).data;
    const op = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40; };
    g.fillStyle = col || P.out;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) g.fillRect(x, y, 1, 1);
    return c;
  }
  // small outlined sprite: fn draws into a w x h box at 0,0
  function sprite(w, h, fn) {
    const o = mk(w + 2, h + 2);
    o.g.translate(1, 1); fn(o.g); o.g.setTransform(1, 0, 0, 1, 0, 0);
    outline(o.c);
    return o.c;
  }
  // stepped (pixel) glow: nested ellipses, each adding a little alpha
  function ringSprite(rx, ry, rings, alphaEach, rgb) {
    const o = mk(rx * 2 + 1, ry * 2 + 1), g = o.g;
    g.fillStyle = 'rgba(' + rgb + ',' + alphaEach + ')';
    for (let k = 0; k < rings; k++) {
      const s = 1 - k / rings, ax = rx * s, ay = ry * s;
      for (let dy = -Math.floor(ay); dy <= Math.floor(ay); dy++) {
        const half = Math.floor(ax * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ay * ay || 1))));
        g.fillRect(rx - half, ry + dy, half * 2 + 1, 1);
      }
    }
    return o.c;
  }

  // ------------------------------------------------------------------
  // Metrics: integer scale so pixels stay square and crisp at any size
  // ------------------------------------------------------------------
  function measure() {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const pw = Math.max(1, Math.round(window.innerWidth * dpr));
    const ph = Math.max(1, Math.round(window.innerHeight * dpr));
    let sd = Math.round(ph / TARGET_LOGICAL_H);
    sd = Math.min(sd, Math.floor(pw / MIN_LOGICAL_W));
    sd = Math.max(1, sd);
    return { pw: pw, ph: ph, sd: sd, lw: Math.ceil(pw / sd), lh: Math.ceil(ph / sd), dpr: dpr };
  }

  // ------------------------------------------------------------------
  // Props shared by wall and foreground
  // ------------------------------------------------------------------
  function barrel(g, x, y, w, h, c) {
    for (let j = 0; j < h; j++) {
      const m = (h - 1) / 2, bulge = Math.round(Math.pow((j - m) / m, 2) * 2);
      rect(g, x + bulge, y + j, w - bulge * 2, 1, c.body);
    }
    for (let i = 3; i < w - 2; i += 5) rect(g, x + i, y + 2, 1, h - 4, c.stave);
    rect(g, x + 1, y + 2, w - 2, 1, c.hoop);
    rect(g, x + 1, y + h - 3, w - 2, 1, c.hoop);
    rect(g, x + 2, y, w - 4, 1, c.lid);
  }

  const BOTTLE_COLS = [P.steelD, P.goldD, P.leather, P.boot, P.steel];
  const SHELF_ITEMS = {
    bottle: function (r) {
      const col = BOTTLE_COLS[Math.floor(r() * BOTTLE_COLS.length)], h = 9 + Math.floor(r() * 3);
      return { w: 4, h: h, draw: function (g) {
        rect(g, 0, 4, 4, h - 4, col); rect(g, 1, 0, 2, 4, col);
        rect(g, 1, 0, 2, 1, P.leather); rect(g, 1, 5, 1, 3, P.steelL);
      } };
    },
    mug: function (r) {
      const wooden = r() < 0.5;
      return { w: 5, h: 5, draw: function (g) {
        rect(g, 0, 0, 4, 5, wooden ? P.woodL : P.steel);
        rect(g, 0, 0, 4, 1, wooden ? P.bone : P.steelL);
        rect(g, 4, 1, 1, 3, wooden ? P.woodD : P.steelD);
        rect(g, 0, 3, 4, 1, wooden ? P.woodD : P.steelD);
      } };
    },
    jug: function () {
      return { w: 6, h: 8, draw: function (g) {
        rect(g, 2, 0, 2, 2, P.leather); rect(g, 1, 2, 4, 6, P.leather); rect(g, 0, 3, 6, 4, P.leather);
        rect(g, 1, 3, 1, 3, P.woodL);
      } };
    },
    keg: function () {
      return { w: 9, h: 8, draw: function (g) {
        barrel(g, 0, 0, 9, 8, { body: P.wood, stave: P.woodD, hoop: P.steelD, lid: P.woodL });
      } };
    },
    plates: function () {
      return { w: 7, h: 4, draw: function (g) {
        rect(g, 0, 3, 7, 1, P.bone); rect(g, 1, 2, 5, 1, P.steel); rect(g, 1, 1, 5, 1, P.bone); rect(g, 2, 0, 3, 1, P.steel);
      } };
    }
  };
  const ITEM_KEYS = ['bottle', 'bottle', 'bottle', 'mug', 'mug', 'jug', 'keg', 'plates'];

  function shelf(g, x0, x1, y, r) {
    const w = x1 - x0;
    if (w < 16) return;
    rect(g, x0 + 3, y + 3, 2, 6, P.wood2); rect(g, x1 - 5, y + 3, 2, 6, P.wood2);
    rect(g, x0, y, w, 3, P.wood1);
    rect(g, x0, y, w, 1, P.woodL);
    rect(g, x0, y + 3, w, 1, P.bgDark);
    rect(g, x0 + 1, y + 4, w - 2, 3, 'rgba(' + SOOT_RGB + ',.35)');
    let x = x0 + 4, prev = '';
    while (x < x1 - 6) {
      let key = ITEM_KEYS[Math.floor(r() * ITEM_KEYS.length)];
      if (key === prev && key !== 'bottle') key = 'bottle';
      prev = key;
      const it = SHELF_ITEMS[key](r);
      if (x + it.w > x1 - 4) break;
      g.drawImage(sprite(it.w, it.h, it.draw), x - 1, y - it.h - 1);
      x += it.w + 2 + Math.floor(r() * 3);
    }
  }

  function bricks(g, x, y, w, h, r) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    rect(g, x, y, w, h, P.stoneD);
    const rows = Math.ceil(h / 5);
    for (let j = 0; j < rows; j++) {
      const yy = y + j * 5, off = (j % 2) * 5;
      for (let bx = x - off; bx < x + w; bx += 10) {
        const dark = r() < 0.28;
        rect(g, bx + 1, yy + 1, 9, 4, dark ? P.stoneD : P.stone);
        if (!dark) rect(g, bx + 1, yy + 1, 9, 1, 'rgba(' + '236,224,196' + ',.10)');
      }
    }
    g.restore();
  }

  // ------------------------------------------------------------------
  // Layer: back wall (transparent below the base line except the props that
  // stand on the floor; it is composited over the floor layer)
  // ------------------------------------------------------------------
  function buildWall(lw, lh, geo) {
    const o = mk(lw, lh), g = o.g, fy = geo.fy, cx = geo.cx, r = rng(9301);
    const plank = [P.wood2, P.wood3, P.bgMid, P.wood1];

    // planks
    for (let x = 0; x < lw; x += 10) {
      const col = plank[Math.floor(r() * 4)];
      rect(g, x, 0, 10, fy, col);
      rect(g, x + 9, 0, 1, fy, P.bgDark);
      if (col === P.wood1 || col === P.wood3) rect(g, x, 0, 1, fy, 'rgba(160,106,48,.22)');
      for (let k = 0; k < 3; k++) {
        const gx = x + 1 + Math.floor(r() * 7), gy = Math.floor(r() * fy * 0.7), gl = 8 + Math.floor(r() * 26);
        rect(g, gx, gy, 1, gl, r() < 0.5 ? P.bgMid : P.wood1);
      }
      if (r() < 0.4) {  // knot
        const kx = x + 3 + Math.floor(r() * 3), ky = 20 + Math.floor(r() * (fy - 46));
        rect(g, kx - 1, ky, 4, 3, P.wood1); rect(g, kx, ky + 1, 2, 1, P.bgDark);
      }
      rect(g, x + 2, 12, 1, 1, P.bgDeep); rect(g, x + 2, fy - 8, 1, 1, P.bgDeep);
    }
    // lower panel rail
    rect(g, 0, fy - 22, lw, 1, P.wood1);
    rect(g, 0, fy - 21, lw, 2, P.bgDark);
    rect(g, 0, fy - 19, lw, 15, 'rgba(' + DARK_RGB + ',.28)');
    // baseboard
    rect(g, 0, fy - 4, lw, 1, P.wood1);
    rect(g, 0, fy - 3, lw, 3, P.bgDark);

    // ceiling beam and shadow under it
    rect(g, 0, 0, lw, 7, P.wood2);
    for (let i = 0; i < 9; i++) rect(g, Math.floor(r() * lw), Math.floor(r() * 6), 6 + Math.floor(r() * 12), 1, P.bgMid);
    rect(g, 0, 7, lw, 2, P.bgDark);
    rect(g, 0, 9, lw, 3, 'rgba(' + SOOT_RGB + ',.45)');
    rect(g, 0, 12, lw, 3, 'rgba(' + SOOT_RGB + ',.26)');
    rect(g, 0, 15, lw, 3, 'rgba(' + SOOT_RGB + ',.12)');
    // side posts
    rect(g, 0, 0, 8, fy, P.bgDark); rect(g, 1, 0, 1, fy, P.wood1); rect(g, 6, 0, 2, fy, P.bgDeep);
    rect(g, lw - 8, 0, 8, fy, P.bgDark); rect(g, lw - 7, 0, 1, fy, P.wood1); rect(g, lw - 2, 0, 2, fy, P.bgDeep);

    // overall dim so text over the wall stays readable
    rect(g, 0, 0, lw, fy, 'rgba(' + DARK_RGB + ',.34)');

    // shelves either side of the hearth
    const gap = 8, sx0 = 38, hw = 44;
    const shelfRows = [fy - 62, fy - 36];
    const regions = [[sx0, cx - hw - gap], [cx + hw + gap, lw - sx0]];
    regions.forEach(function (rg, ri) {
      let a = rg[0], b = rg[1];
      if (b - a > 120) { if (ri === 0) a = b - 120; else b = a + 120; }
      shelfRows.forEach(function (sy) { shelf(g, a, b, sy, r); });
    });

    // hanging herbs and hams from the beam
    const hang = [cx - 70, cx - 52, cx + 58, cx + 76];
    hang.forEach(function (hx, i) {
      if (hx < 30 || hx > lw - 30) return;
      const len = 6 + (i % 2) * 4;
      rect(g, hx, 9, 1, len, P.boot);
      g.drawImage(sprite(5, 6, function (gg) {
        rect(gg, 1, 0, 3, 6, i % 2 ? P.leather : P.goldD); rect(gg, 0, 1, 5, 4, i % 2 ? P.leather : P.goldD); rect(gg, 1, 1, 1, 2, P.woodL);
      }), hx - 3, 9 + len - 1);
    });

    // chimney breast (above mantel), hearth body, opening
    const mantelY = fy - 48;
    bricks(g, cx - 20, 0, 40, mantelY, r);
    rect(g, cx - 20, 0, 2, mantelY, 'rgba(' + SOOT_RGB + ',.5)'); rect(g, cx + 18, 0, 2, mantelY, 'rgba(' + SOOT_RGB + ',.5)');
    rect(g, cx - 20, 0, 40, mantelY, 'rgba(' + SOOT_RGB + ',.18)');
    bricks(g, cx - 38, mantelY + 5, 76, fy + 2 - (mantelY + 5), r);
    // mantel board
    rect(g, cx - 44, mantelY, 88, 5, P.wood1); rect(g, cx - 44, mantelY, 88, 1, P.woodL); rect(g, cx - 44, mantelY + 5, 88, 1, P.bgDark);
    rect(g, cx - 43, mantelY + 6, 86, 2, 'rgba(' + SOOT_RGB + ',.4)');
    // mantel items
    const mi = [['mug', -34], ['bottle', -22], ['plates', 18], ['mug', 30]];
    mi.forEach(function (m) {
      const it = SHELF_ITEMS[m[0]](r);
      g.drawImage(sprite(it.w, it.h, it.draw), cx + m[1] - 1, mantelY - it.h - 1);
    });
    // opening
    const half = 18, top = fy - 32, ar = 18;
    for (let y = top - 2; y < fy + 1; y++) {
      const d = y - top;
      const hh = d < 0 ? 0 : (d < ar ? Math.floor(Math.sqrt(ar * ar - (ar - d) * (ar - d))) : half);
      const rimW = hh + 2;
      rect(g, cx - rimW, y, rimW * 2, 1, ((y >> 2) + 0) % 2 ? P.stone : P.stoneD);
    }
    for (let y = top; y < fy + 1; y++) {
      const d = y - top;
      const hh = d < ar ? Math.floor(Math.sqrt(ar * ar - (ar - d) * (ar - d))) : half;
      rect(g, cx - hh, y, hh * 2, 1, P.soot);
      if (d > 3) { const ih = Math.max(0, hh - 3); rect(g, cx - ih, y, ih * 2, 1, P.bgDeep); }
    }
    // hearth stone, ash bed, logs
    rect(g, cx - 42, fy - 1, 84, 3, P.stone); rect(g, cx - 42, fy + 2, 84, 1, P.soot);
    rect(g, cx - 17, fy - 4, 34, 3, P.stoneD);
    rect(g, cx - 13, fy - 8, 26, 4, P.woodD); rect(g, cx - 13, fy - 8, 26, 1, P.wood); rect(g, cx - 14, fy - 7, 2, 2, P.wood);
    rect(g, cx - 10, fy - 11, 20, 3, P.boot); rect(g, cx - 10, fy - 11, 20, 1, P.woodD);
    rect(g, cx - 6, fy - 5, 3, 1, P.goldD); rect(g, cx + 4, fy - 6, 3, 1, P.goldD);

    // wall barrels standing on the floor, drawn last so they overlap the base line
    const bc = { body: P.wood, stave: P.woodD, hoop: P.steelD, lid: P.woodL };
    g.drawImage(sprite(26, 28, function (gg) { barrel(gg, 0, 0, 26, 28, bc); }), 9, fy - 24);
    g.drawImage(sprite(16, 18, function (gg) { barrel(gg, 0, 0, 16, 18, bc); }), 31, fy - 14);
    g.drawImage(sprite(26, 28, function (gg) { barrel(gg, 0, 0, 26, 28, bc); }), lw - 35, fy - 24);
    g.drawImage(sprite(14, 16, function (gg) { barrel(gg, 0, 0, 14, 16, bc); }), lw - 49, fy - 12);
    // dim the barrels a touch so they do not outshine the cards
    g.globalCompositeOperation = 'source-atop';
    rect(g, 0, fy - 26, 60, 40, 'rgba(' + DARK_RGB + ',.30)');
    rect(g, lw - 60, fy - 26, 60, 40, 'rgba(' + DARK_RGB + ',.30)');
    g.globalCompositeOperation = 'source-over';

    // lamp housings (flames and glow are animated)
    geo.lamps.forEach(function (lx) {
      const ly = geo.lampY;
      for (let y = 9; y < ly - 6; y++) rect(g, lx, y, 1, 1, (y % 2) ? P.steelD : P.boot);
      rect(g, lx - 2, ly - 6, 5, 1, P.bgDark); rect(g, lx - 3, ly - 5, 7, 1, P.bgDark);
      rect(g, lx - 3, ly - 4, 7, 7, P.goldD);
      rect(g, lx - 3, ly - 4, 1, 7, P.bgDark); rect(g, lx + 3, ly - 4, 1, 7, P.bgDark);
      rect(g, lx - 3, ly + 3, 7, 2, P.bgDark); rect(g, lx - 1, ly + 5, 3, 1, P.bgDark);
    });
    return o.c;
  }

  // ------------------------------------------------------------------
  // Layer: floor (perspective boards, rugs, lamp pools)
  // ------------------------------------------------------------------
  function buildFloor(lw, lh, geo) {
    const o = mk(lw, lh), g = o.g, fy = geo.fy, cx = geo.cx;
    const cols = [P.wood2, P.wood3, P.bgMid, P.wood1];
    rect(g, 0, 0, lw, lh, P.bgDark);
    const vpY = fy - 70, den = fy - vpY;

    for (let y = fy; y < lh; y++) {
      const dy = y - vpY, t = dy / den, bw = 15 * t, z = 1000 / dy, zp = 1000 / (dy - 1);
      let runX = 0, runCol = null;
      for (let x = 0; x <= lw; x++) {
        let col = null;
        if (x < lw) {
          const u = (x - cx) / bw, idx = Math.floor(u), frac = (u - idx) * bw;
          const off = (hash2(idx, 7) % 100) / 100 * 5;
          const zi = Math.floor(z / 3.2 + off), zpi = Math.floor(zp / 3.2 + off);
          if (frac < 1 || zi !== zpi) col = P.bgDark;
          else {
            col = cols[hash2(idx, zi) % 4];
            const gr = hash2(idx * 50 + Math.floor(frac), zi) % 19;
            if (gr === 0) col = P.wood1; else if (gr === 1) col = P.bgDark;
          }
        }
        if (col !== runCol) {
          if (runCol !== null) rect(g, runX, y, x - runX, 1, runCol);
          runX = x; runCol = col;
        }
      }
    }
    // scuffs
    const r = rng(4417);
    for (let i = 0; i < 34; i++) {
      rect(g, Math.floor(r() * lw), fy + 4 + Math.floor(r() * (lh - fy - 4)), 2 + Math.floor(r() * 4), 1, r() < 0.5 ? P.wood1 : P.bgDark);
    }

    // rugs in perspective: [xOffsetAtT1, halfWidthAtT1, yFraction0, yFraction1]
    const fd = lh - fy;
    const rugs = [[-96, 38, 0.10, 0.42], [108, 32, 0.20, 0.56], [0, 58, 0.58, 1.05]];
    rugs.forEach(function (rg) {
      const y0 = Math.round(fy + fd * rg[2]), y1 = Math.round(fy + fd * rg[3]), ym = (y0 + y1) / 2;
      for (let y = y0; y < y1; y++) {
        const t = (y - vpY) / den, xl = Math.round(cx + (rg[0] - rg[1]) * t), xr = Math.round(cx + (rg[0] + rg[1]) * t), bd = Math.max(1, Math.round(1.5 * t));
        const edge = (y - y0 < 1) || (y1 - 1 - y < 1);
        rect(g, xl, y, xr - xl, 1, edge ? P.boot : P.goldD);
        if (edge) { for (let x = xl; x < xr; x += 2) rect(g, x, y, 1, 1, P.leather); continue; }
        rect(g, xl + bd, y, xr - xl - bd * 2, 1, P.boot);
        const iw = bd + Math.max(1, Math.round(1.2 * t));
        rect(g, xl + iw, y, xr - xl - iw * 2, 1, P.leather);
        for (let x = xl + iw; x < xr - iw; x++) {
          const dd = Math.abs(x - Math.round(cx + rg[0] * t)) / t + Math.abs(y - ym) * 1.6;
          if (dd % 14 < 1.6) rect(g, x, y, 1, 1, P.goldD);
          else if (dd % 14 > 6.5 && dd % 14 < 7.5) rect(g, x, y, 1, 1, P.woodD);
        }
      }
    });

    // dim: shadow under the wall, then an overall tint that deepens towards the bottom
    rect(g, 0, fy, lw, 2, 'rgba(' + SOOT_RGB + ',.5)');
    rect(g, 0, fy + 2, lw, 3, 'rgba(' + SOOT_RGB + ',.25)');
    rect(g, 0, fy, lw, lh - fy, 'rgba(' + DARK_RGB + ',.30)');
    for (let i = 0; i < 4; i++) rect(g, 0, lh - (i + 1) * 10, lw, 10, 'rgba(' + SOOT_RGB + ',.07)');

    // lamp-light pools
    const pool = ringSprite(40, 9, 4, 0.045, LAMP_RGB);
    geo.lamps.forEach(function (lx) { g.drawImage(pool, lx - 40, Math.round(fy + fd * 0.22) - 9); });
    return o.c;
  }

  // ------------------------------------------------------------------
  // Layer: foreground (dark silhouettes, deliberately low contrast)
  // ------------------------------------------------------------------
  function buildFore(lw, lh, geo, zone) {
    const o = mk(lw, lh), g = o.g, cx = geo.cx;
    const body = P.bgDeep, rim = P.bgDark, hi = 'rgba(' + LAMP_RGB + ',.10)';
    const placed = [];
    function free(x, y, w, h) {
      if (!BARD_CLEAR) return true;
      return !(x < zone.w && y + h > lh - zone.h);
    }
    function table(x, top, w, legH) {
      if (!free(x, top, w, 8 + legH)) return false;
      rect(g, x, top, w, 4, rim); rect(g, x, top, w, 1, P.wood2); rect(g, x, top, w, 1, hi);
      rect(g, x + 3, top + 4, w - 6, 3, body);
      rect(g, x + 3, top + 4, 4, legH, body); rect(g, x + w - 7, top + 4, 4, legH, body);
      rect(g, x + 6, top + 4 + Math.floor(legH * 0.6), w - 12, 2, body);
      // mugs and a bottle as silhouettes on the table
      rect(g, x + 8, top - 5, 4, 5, body); rect(g, x + 8, top - 5, 4, 1, rim); rect(g, x + 12, top - 4, 1, 3, body);
      rect(g, x + w - 16, top - 4, 4, 4, body); rect(g, x + w - 16, top - 4, 4, 1, rim);
      rect(g, x + Math.floor(w / 2), top - 9, 3, 9, body); rect(g, x + Math.floor(w / 2) + 1, top - 12, 1, 3, body);
      return true;
    }
    function stool(x, y, h) {
      if (!free(x, y, 12, 3 + h)) return false;
      rect(g, x, y, 12, 3, rim); rect(g, x, y, 12, 1, P.wood2);
      rect(g, x + 1, y + 3, 2, h, body); rect(g, x + 9, y + 3, 2, h, body);
      rect(g, x + 1, y + 3 + Math.floor(h / 2), 10, 1, body);
      return true;
    }
    function bigBarrel(x, y, w, h) {
      if (!free(x, y, w, h)) return false;
      barrel(g, x, y, w, h, { body: body, stave: rim, hoop: rim, lid: rim });
      rect(g, x + 2, y, w - 4, 1, P.wood2);
      return true;
    }

    // right side: barrel, table, stool
    bigBarrel(lw - 28, lh - 40, 26, 44);
    table(lw - 104, lh - 30, 66, 30);
    stool(lw - 126, lh - 14, 20);
    // left side: barrel above the bard corner, stool beside it
    bigBarrel(2, lh - zone.h - 30, 22, 32);
    stool(zone.w + 6, lh - 13, 20);
    // bottom centre: two dim tables
    table(cx - 132, lh - 22, 58, 30);
    stool(cx - 70, lh - 11, 20);
    table(cx + 64, lh - 18, 56, 30);
    stool(cx + 38, lh - 9, 20);

    // soft vignette (stepped), darker bottom
    for (let k = 0; k < 6; k++) {
      const d = k * 4, a = (6 - k) * 0.06, col = 'rgba(' + SOOT_RGB + ',' + a.toFixed(2) + ')';
      rect(g, d, d, lw - d * 2, 4, col); rect(g, d, lh - d - 4, lw - d * 2, 4, col);
      rect(g, d, d + 4, 4, lh - d * 2 - 8, col); rect(g, lw - d - 4, d + 4, 4, lh - d * 2 - 8, col);
    }
    rect(g, 0, lh - 14, lw, 14, 'rgba(' + SOOT_RGB + ',.18)');
    return o.c;
  }

  // ------------------------------------------------------------------
  // Build everything once per size
  // ------------------------------------------------------------------
  function build(m) {
    const lw = m.lw, lh = m.lh;
    const fy = Math.round(lh * 0.60), cx = Math.floor(lw / 2);
    const geo = {
      fy: fy, cx: cx, baseY: fy - 9,
      lamps: [Math.round(lw * 0.12), Math.round(lw * 0.88)],
      lampY: Math.max(20, fy - 84)
    };
    const zone = { w: Math.ceil(CLEAR_ZONE_CSS * m.dpr / m.sd), h: Math.ceil(CLEAR_ZONE_CSS * m.dpr / m.sd) };
    const floor = buildFloor(lw, lh, geo), wall = buildWall(lw, lh, geo), fore = buildFore(lw, lh, geo, zone);
    const bg = mk(lw, lh);
    bg.g.drawImage(floor, 0, 0); bg.g.drawImage(wall, 0, 0);
    const frame = mk(lw, lh);
    return {
      geo: geo, bg: bg.c, fore: fore, frame: frame,
      lampGlow: ringSprite(52, 38, 5, 0.07, LAMP_RGB),
      hearthWall: ringSprite(66, 48, 5, 0.075, FIRE_RGB),
      hearthFloor: ringSprite(92, 19, 5, 0.07, FIRE_RGB)
    };
  }

  // ------------------------------------------------------------------
  // Animation
  // ------------------------------------------------------------------
  function flick(t, ph) {
    return 1 + FLICKER * (0.5 * Math.sin(t * 7.3 + ph) + 0.3 * Math.sin(t * 13.1 + ph * 2 + 2) + 0.2 * Math.sin(t * 29.7 + ph * 3 + 5));
  }

  function stepSparks(geo, r) {
    for (let i = 0; i < SPARK_COUNT; i++) {
      let s = sparks[i];
      if (!s) s = sparks[i] = { life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0 };
      if (s.life <= 0) {
        if (r() < SPARK_RATE) {
          s.x = geo.cx + (r() - 0.5) * 12; s.y = geo.baseY - 10 - r() * 6;
          s.vx = (r() - 0.5) * 0.3; s.vy = -(0.35 + r() * 0.55);
          s.max = s.life = 20 + Math.floor(r() * 26);
        }
        continue;
      }
      s.x += s.vx + Math.sin(s.life * 0.4 + i) * 0.15; s.y += s.vy; s.life--;
    }
  }

  function drawFlames(g, geo, t) {
    const cx = geo.cx, by = geo.baseY, half = 11;
    const spike = Math.round(Math.sin(t * 3.1) * 5);
    for (let i = -half; i <= half; i++) {
      const edge = 1 - Math.pow(Math.abs(i) / (half + 1), 1.6);
      const n = 0.55 + 0.45 * (Math.sin(t * 11 + i * 0.9) * 0.5 + 0.5) * (0.7 + 0.3 * Math.sin(t * 5.3 + i * 1.7));
      let h = Math.round(FLAME_HEIGHT * edge * n);
      if (i === spike) h += 4;
      if (h < 1) continue;
      rect(g, cx + i, by - h, 1, h, P.fireLo);
      if (h > 5) rect(g, cx + i, by - h, 1, 1, P.gold);
      if (Math.abs(i) <= 6) {
        const ih = Math.round(h * 0.6);
        rect(g, cx + i, by - ih, 1, ih, P.fireHi);
      }
    }
    rect(g, cx - 9, by - 1, 19, 2, P.fireHi);
    const ph = Math.floor(t * FPS);
    for (let k = 0; k < 4; k++) rect(g, cx - 9 + ((k * 7 + ph) % 19), by + 1, 1, 1, P.fireLo);
  }

  function drawFrame(t, advance) {
    const geo = L.geo, g = L.frame.g, r = drawFrame.r || (drawFrame.r = rng(2024));
    g.globalAlpha = 1;
    g.drawImage(L.bg, 0, 0);

    // lamp glow and flames
    geo.lamps.forEach(function (lx, i) {
      const f = flick(t, i * 1.7);
      g.globalAlpha = clamp(GLOW_STRENGTH * f, 0, 1);
      g.drawImage(L.lampGlow, lx - 52, geo.lampY + 2 - 38);
      g.globalAlpha = 1;
      const lo = f < 1 ? 0 : 1;
      rect(g, lx - 1, geo.lampY - 2 + (1 - lo), 3, 4 - (1 - lo), P.fireLo);
      rect(g, lx, geo.lampY - 1 + (1 - lo), 1, 2, P.fireHi);
    });

    // hearth glow on wall and floor
    const hf = flick(t, 0.6);
    g.globalAlpha = clamp(HEARTH_GLOW * hf, 0, 1);
    g.drawImage(L.hearthWall, geo.cx - 66, geo.fy - 24 - 48);
    g.drawImage(L.hearthFloor, geo.cx - 92, geo.fy + 14 - 19);
    g.globalAlpha = 1;

    drawFlames(g, geo, t);

    if (advance) stepSparks(geo, r);
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (!s || s.life <= 0) continue;
      const k = s.life / s.max;
      g.globalAlpha = clamp(k * 1.6, 0, 1);
      rect(g, s.x, s.y, 1, 1, k > 0.6 ? P.fireHi : (k > 0.3 ? P.fireLo : P.gold));
    }
    g.globalAlpha = 1;

    g.drawImage(L.fore, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(L.frame.c, 0, 0, M.lw, M.lh, 0, 0, M.lw * M.sd, M.lh * M.sd);
  }

  // ------------------------------------------------------------------
  // Canvas, CSS, lifecycle
  // ------------------------------------------------------------------
  function hubOpen() {
    const r = document.getElementById('tavern-hub');
    return !!r && !r.classList.contains('hidden');
  }

  function ensureCanvas() {
    if (!document.body) throw new Error('no body');
    if (!styleEl) {
      let css = 'html.' + HTML_CLASS + ' #tavern-hub{ background:transparent }\n';
      if (HIDE_CSS_EXTRAS) css += 'html.' + HTML_CLASS + ' #tavern-hub::before, html.' + HTML_CLASS + ' #tavern-hub::after{ display:none }\n';
      if (TFLOOR_BG) css += 'html.' + HTML_CLASS + ' #tavern-hub .tfloor{ background:' + TFLOOR_BG + ' }\n';
      css += '#tavern-art{ position:fixed; inset:0; width:100%; height:100%; z-index:' + Z_INDEX + '; pointer-events:none; image-rendering:pixelated; display:none }\n';
      styleEl = document.createElement('style');
      styleEl.id = 'tavern-art-css';
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'tavern-art';
      cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      ctx = cv.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
    }
  }

  function layout(force) {
    const m = measure();
    if (!force && M && L && m.pw === M.pw && m.ph === M.ph) return;
    M = m;
    cv.width = m.pw; cv.height = m.ph;
    L = build(m);
    sparks = [];
  }

  function paint() {
    const t = performance.now() / 1000;
    if (reduced) {
      if (!sparks.length) { for (let i = 0; i < 40; i++) { drawFrame.r = drawFrame.r || rng(2024); stepSparks(L.geo, drawFrame.r); } }
      drawFrame(1.3, false);
    } else drawFrame(t, true);
  }

  function onResize() {
    if (rzTimer) clearTimeout(rzTimer);
    rzTimer = setTimeout(function () {
      rzTimer = null;
      if (!cv || cv.style.display === 'none') return;
      try { layout(false); paint(); } catch (e) { fail(); }
    }, 120);
  }

  function tick() {
    try {
      if (!hubOpen()) { stop(); return; }
      if (document.hidden) return;
      paint();
    } catch (e) { fail(); }
  }

  function start() {
    if (failed) return;
    try {
      if (!hubOpen()) return;
      ensureCanvas();
      reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      layout(false);
      paint();
      cv.style.display = 'block';
      document.documentElement.classList.add(HTML_CLASS);
      if (!listening) { window.addEventListener('resize', onResize); listening = true; }
      if (!reduced && !timer) timer = setInterval(tick, Math.round(1000 / FPS));
      if (reduced && timer) { clearInterval(timer); timer = null; }
    } catch (e) { fail(); }
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (rzTimer) { clearTimeout(rzTimer); rzTimer = null; }
    if (listening) { window.removeEventListener('resize', onResize); listening = false; }
    try { document.documentElement.classList.remove(HTML_CLASS); } catch (e) { /* ignore */ }
    if (cv) cv.style.display = 'none';
  }

  function fail() {
    failed = true;
    stop();
    if (cv && cv.parentNode) { try { cv.parentNode.removeChild(cv); } catch (e) { /* ignore */ } }
    cv = null; ctx = null; L = null;
  }

  // ------------------------------------------------------------------
  // Hook: wrap window.TAVERN.enter / leave
  // ------------------------------------------------------------------
  function hook() {
    try {
      const T = window.TAVERN;
      if (!T || typeof T.enter !== 'function' || typeof T.leave !== 'function') return false;
      if (hooked || T.__tvartHooked) return true;
      const origEnter = T.enter, origLeave = T.leave;
      T.enter = function () {
        const res = origEnter.apply(this, arguments);
        start();
        return res;
      };
      T.leave = function () {
        const res = origLeave.apply(this, arguments);
        stop();
        return res;
      };
      hooked = true;
      try { T.__tvartHooked = true; } catch (e) { /* ignore */ }
      if (hubOpen()) start();
      return true;
    } catch (e) {
      failed = true; stop();
      return false;
    }
  }

  try {
    if (!hook() && typeof window.addEventListener === 'function') window.addEventListener('load', hook, { once: true });
  } catch (e) { /* fail silently */ }
})();
