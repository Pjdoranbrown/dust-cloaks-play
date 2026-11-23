/*
 * INDEX 97 - campaign map overlay (js/campaign/map.js)
 *
 * What it does:
 *  - Adds a "Map (J)" button in a fixed screen corner and a J key binding that open a
 *    full-screen parchment map of Arcadia. Esc or the Close button shuts it.
 *  - Never opens during a fight (G set) or the prologue/story (inStory / inStoryNow).
 *  - Draws the six REGIONS as tinted territories on a small pixel canvas (scaled with
 *    smoothing off), with coastline, central mountain spine, Island of Mendor, two
 *    unlabelled rivers and a compass rose. Labels are crisp HTML text over the canvas.
 *  - Shows today's META.board contracts as numbered pins at c.mapAt (re-read on every
 *    open). Hover, tap or Enter shows a card: contract name, place, town, region, tier, pay.
 *  - Hatches and stamps regions worked: META.lastRegion plus an in-memory set filled by
 *    wrapping startDeployment. No save keys are added or written.
 *
 * ROLLBACK: delete this file and its <script> tag
 */
(function () {
  'use strict';

  /* ---------- Tunable constants ---------- */
  var DOM_ID = 'dc-cm';                    // prefix for every id/class this file creates
  var MAP_W = 240;                         // logical canvas width in pixels
  var MAP_H = 139;                         // logical canvas height (same 1.73 ratio as the Planning Table map)
  var SEED = 97;                           // fixed seed so the map looks the same every time

  var COLOURS = {
    land: '#dccba4', ocean: '#a8bebc', ink: '#4a3b2a', gold: '#d4af37', red: '#8a1a1a',
    shallow: '#bccfca', deep: '#98b1ae', river: '#6f9391', mountain: '#7a6850',
    mountainShade: '#b5a383', snow: '#f3eee2', paper: '#efe3c4', backdrop: 'rgba(24,16,8,0.86)'
  };
  // Soft territory tints. frost, freelands and spine match the existing Planning Table map.
  var REGION_TINTS = {
    heartland: '#e3bea4', marches: '#dcc697', mendor: '#ece0c2',
    spine: '#c6b89a', frost: '#d6e2ea', freelands: '#d6c68a'
  };
  var TINT_STRENGTH = 0.6;                 // 0 = plain land colour, 1 = full tint
  var WORKED_HATCH_EVERY = 5;              // gold diagonal hatch spacing (pixels) on worked regions

  var KEY_OPEN = 'j';                      // C-01 fix: M already opens the Player's Manual, so the map takes J; toggles the map (ignored while typing)
  var KEY_CLOSE = 'Escape';
  var BUTTON_POSITION = { bottom: '12px', left: '12px' };  // fixed corner for the Map button
  var Z_INDEX = 9000;
  var PIN_SIZE_PX = 26;
  var NARROW_PX = 560;                     // below this map width, town labels are hidden
  var VISIBILITY_POLL_MS = 750;            // how often the button checks fight/story state
  var SHOW_TOWN_LABELS = true;             // see NOTES.md: town-to-coord pairing is by list order

  // Landmass shaping (pixels on the logical canvas, y in % of map height)
  var LAND_RADIUS_PX = 30;
  var MENDOR_RADIUS_PX = 11;
  var MAINLAND_SOUTH_PCT = 76;             // mainland stops here; strait to Mendor below
  var MENDOR_NORTH_PCT = 77.5;             // Mendor starts here

  // Central mountain spine: x ~ 48-53% on the existing map
  var SPINE = { x: 50, yFrom: 24, yTo: 70, step: 6 };
  // Two rivers, unlabelled (no canon river name is tied to these positions)
  var RIVERS = [
    [[48, 45], [41, 49], [33, 51], [24, 56], [12, 58], [2, 59]],
    [[56, 49], [64, 54], [73, 59], [83, 65], [98, 70]]
  ];
  var COMPASS = { x: MAP_W - 17, y: MAP_H - 17 };

  // Where each region name is printed (x%, y%). Chosen to sit inside each territory.
  var REGION_LABEL_AT = {
    heartland: [17, 49], marches: [39, 40], mendor: [28, 92],
    spine: [56, 72], frost: [52, 7], freelands: [83, 31]
  };

  var PIN_NUMERALS = ['I', 'II', 'III'];   // same as the Planning Table; further pins show 4, 5...

  // Fallback copy of REGIONS (index.html L11547-L11597). Used only if REGIONS is missing.
  var REGIONS_FALLBACK = {
    heartland: { id: 'heartland', name: 'Western Imperial Heartland',
      towns: ['Terados', 'Zenbos', 'Trilshan', 'Low Arden'],
      coords: [[16, 40], [27, 54], [14, 62], [23, 32]] },
    marches: { id: 'marches', name: 'Contested Frontier Marches',
      towns: ["Ban'Ra", 'Cois Abhann', 'Aberdine', 'Dunmorrow', 'Levoria'],
      coords: [[38, 46], [41, 60], [36, 34], [44, 52], [39, 70]] },
    mendor: { id: 'mendor', name: 'Island Citadel of Mendor',
      towns: ['Mendor Citadel', 'Saint Ivo', 'Sun-Havens'],
      coords: [[28, 82], [22, 85], [34, 80]] },
    spine: { id: 'spine', name: 'Central Spine & Qloria Ruins',
      towns: ['Kraggan', 'Solis', 'Tarim', 'Varnholt'],
      coords: [[52, 42], [54, 64], [49, 54], [56, 34], [48, 38]] },
    frost: { id: 'frost', name: 'Northern Frost-Vaults',
      towns: ['Hrimheim', 'Coldwater', 'Rime-Gate'],
      coords: [[55, 14], [45, 18], [64, 16], [50, 22]] },
    freelands: { id: 'freelands', name: 'Free Lands of Suderia & Steppe',
      towns: ['Kalloon', 'Terios', 'Pasan', 'Duruk\u2019s Hold'],
      coords: [[74, 42], [71, 64], [80, 50], [88, 58]] }
  };

  /* ---------- State (in memory only) ---------- */
  var sessionWorked = Object.create(null);  // region keys deployed to this session
  var ui = null;                            // DOM references once built
  var isOpen = false;
  var lastFocus = null;
  var pinnedCard = -1;

  /* ---------- Safe global access ---------- */
  function getMeta() {
    try { return (typeof META !== 'undefined' && META) ? META : null; } catch (e) { return null; }
  }
  function getRegions() {
    var live = null;
    try { if (typeof REGIONS !== 'undefined' && REGIONS && typeof REGIONS === 'object') live = REGIONS; } catch (e) { live = null; }
    var out = [];
    var keys = live ? Object.keys(live) : Object.keys(REGIONS_FALLBACK);
    keys.forEach(function (k) {
      var r = live ? live[k] : null;
      var ok = r && typeof r.name === 'string' && Array.isArray(r.coords) && r.coords.length;
      var src = ok ? r : REGIONS_FALLBACK[k];
      if (!src) return;
      out.push({
        id: k, name: src.name,
        towns: Array.isArray(src.towns) ? src.towns : [],
        coords: src.coords.filter(function (p) { return Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]); })
      });
    });
    return out.filter(function (r) { return r.coords.length; });
  }
  function objectiveName(obj) {
    try {
      if (typeof OBJECTIVES !== 'undefined' && OBJECTIVES && OBJECTIVES[obj] && OBJECTIVES[obj].name) return String(OBJECTIVES[obj].name);
    } catch (e) { /* fall through */ }
    return 'Contract';
  }
  function selectedContract() {
    try { return (typeof MU !== 'undefined' && MU && typeof MU.contract === 'number') ? MU.contract : -1; } catch (e) { return -1; }
  }
  function playPick() {
    try { if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') SFX.play('pick'); } catch (e) { /* silent */ }
  }
  function canOpen() {
    try {
      if (typeof G !== 'undefined' && G) return false;
      if (typeof inStory === 'function' && inStory()) return false;
      if (typeof inStoryNow === 'function' && inStoryNow()) return false;
      return true;
    } catch (e) { return false; }
  }
  function workedSet(regions) {
    var valid = Object.create(null);
    regions.forEach(function (r) { valid[r.id] = true; });
    var set = Object.create(null);
    Object.keys(sessionWorked).forEach(function (k) { if (valid[k]) set[k] = true; });
    var M = getMeta();
    if (M && typeof M.lastRegion === 'string' && valid[M.lastRegion]) set[M.lastRegion] = true;
    return set;
  }

  /* ---------- Wrap startDeployment on top of the existing lastRegion wrapper ---------- */
  try {
    if (typeof startDeployment === 'function') {
      var origStartDeployment = startDeployment;
      startDeployment = function (c) {
        try { if (c && typeof c.region === 'string') sessionWorked[c.region] = true; } catch (e) { /* silent */ }
        return origStartDeployment.apply(this, arguments);
      };
    }
  } catch (e) { /* startDeployment not reassignable: worked set falls back to META.lastRegion only */ }

  /* ---------- Pixel helpers ---------- */
  function hex(c) { var n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function hash(x, y) {
    var h = (x * 374761393 + y * 668265263 + SEED * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y, cell) {
    var gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    var fx = x / cell - gx, fy = y / cell - gy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(gx, gy), b = hash(gx + 1, gy), c = hash(gx, gy + 1), d = hash(gx + 1, gy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function pct2px(p) { return [p[0] / 100 * MAP_W, p[1] / 100 * MAP_H]; }

  /* ---------- Draw the map ---------- */
  function drawMap(canvas, regions, worked) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    var W = MAP_W, H = MAP_H, N = W * H;
    var region = new Int16Array(N).fill(-1);   // -1 = ocean, else index into regions
    var mendorIdx = -1;
    var anchors = [];
    regions.forEach(function (r, i) {
      if (r.id === 'mendor') mendorIdx = i;
      r.coords.forEach(function (p) { var q = pct2px(p); anchors.push({ x: q[0], y: q[1], r: i, island: r.id === 'mendor' }); });
    });

    var x, y, i, k;
    for (y = 0; y < H; y++) {
      var yPct = y / H * 100;
      for (x = 0; x < W; x++) {
        var n1 = noise(x, y, 9) * 0.32 + noise(x, y, 4) * 0.12 - 0.22;
        var best = -1, bestD = 1e9, bestIsle = -1, bestIsleD = 1e9, field = -1, isle = -1;
        for (k = 0; k < anchors.length; k++) {
          var a = anchors[k], dx = x - a.x, dy = y - a.y, d = Math.sqrt(dx * dx + dy * dy);
          if (a.island) {
            isle = Math.max(isle, 1 - d / MENDOR_RADIUS_PX);
            if (d < bestIsleD) { bestIsleD = d; bestIsle = a.r; }
          } else {
            field = Math.max(field, 1 - d / LAND_RADIUS_PX);
            var dj = d + (noise(x + 50, y + 50, 7) - 0.5) * 6;   // wobbly borders
            if (dj < bestD) { bestD = dj; best = a.r; }
          }
        }
        var idx = y * W + x;
        var southFade = Math.max(0, (yPct - (MAINLAND_SOUTH_PCT - 6)) / 6) * 0.9;   // ragged south coast
        if (yPct < MAINLAND_SOUTH_PCT && field + n1 - southFade > 0 && best >= 0) region[idx] = best;
        else if (yPct > MENDOR_NORTH_PCT && isle + n1 * 0.6 > 0 && bestIsle >= 0) region[idx] = bestIsle;
      }
    }

    // distance-to-land for shallow water (cheap two-pass chamfer)
    var dist = new Float32Array(N);
    for (i = 0; i < N; i++) dist[i] = region[i] >= 0 ? 0 : 99;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - W] + 1);
    }
    for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) {
      i = y * W + x;
      if (x < W - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + W] + 1);
    }

    var land = hex(COLOURS.land), ocean = hex(COLOURS.ocean), shallow = hex(COLOURS.shallow),
      deep = hex(COLOURS.deep), ink = hex(COLOURS.ink), gold = hex(COLOURS.gold);
    var tints = regions.map(function (r) { return mix(land, hex(REGION_TINTS[r.id] || COLOURS.land), TINT_STRENGTH); });
    var img = ctx.createImageData(W, H), px = img.data;

    function put(ix, c) { px[ix * 4] = c[0]; px[ix * 4 + 1] = c[1]; px[ix * 4 + 2] = c[2]; px[ix * 4 + 3] = 255; }
    function regAt(xx, yy) { return (xx < 0 || yy < 0 || xx >= W || yy >= H) ? -1 : region[yy * W + xx]; }

    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      var r = region[i], c;
      if (r < 0) {
        c = dist[i] <= 2 ? shallow : (dist[i] > 14 && noise(x, y, 18) > 0.62 ? deep : ocean);
        if (dist[i] > 4 && hash(x, y) > 0.985 && regAt(x + 1, y) < 0) { put(i, ink.map(function (v, j) { return v + (ocean[j] - v) * 0.55; })); continue; }
      } else {
        c = tints[r];
        var grain = (hash(x + 7, y + 3) - 0.5) * 10;
        c = [c[0] + grain, c[1] + grain, c[2] + grain];
        if (worked[regions[r].id] && (x + y) % WORKED_HATCH_EVERY === 0) c = mix(c, gold, 0.65);
        var up = regAt(x, y - 1), dn = regAt(x, y + 1), lf = regAt(x - 1, y), rt = regAt(x + 1, y);
        if (up < 0 || dn < 0 || lf < 0 || rt < 0) c = ink;                                   // coastline
        else if ((rt !== r || dn !== r) && (x + y) % 2 === 0) c = mix(c, ink, 0.7);         // dotted border
      }
      put(i, c);
    }
    ctx.putImageData(img, 0, 0);

    function dot(xx, yy, col) {
      xx = Math.round(xx); yy = Math.round(yy);
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) return;
      ctx.fillStyle = col; ctx.fillRect(xx, yy, 1, 1);
    }
    function isLand(xx, yy) { return regAt(Math.round(xx), Math.round(yy)) >= 0; }

    // rivers (stop when they reach the sea)
    RIVERS.forEach(function (line) {
      var started = false;
      for (var s = 0; s < line.length - 1; s++) {
        var a = pct2px(line[s]), b = pct2px(line[s + 1]);
        var steps = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
        for (var t = 0; t <= steps; t++) {
          var rx = a[0] + (b[0] - a[0]) * t / steps, ry = a[1] + (b[1] - a[1]) * t / steps + Math.sin((rx + s) * 0.7) * 0.8;
          if (isLand(rx, ry)) { started = true; dot(rx, ry, COLOURS.river); }
          else if (started) return;
        }
      }
    });

    // central mountain spine
    for (var my = SPINE.yFrom; my <= SPINE.yTo; my += SPINE.step) {
      var mx = SPINE.x + (hash(my, 11) - 0.5) * 4;
      [[0, 0], [-2.6, 3]].forEach(function (off, oi) {
        if (oi === 1 && hash(my, 5) < 0.4) return;
        var p = pct2px([mx + off[0], my + off[1]]), cx = Math.round(p[0]), cy = Math.round(p[1]);
        if (!isLand(cx, cy)) return;
        for (var row = 0; row < 5; row++) {
          for (var col = -row; col <= row; col++) {
            var colr = (col === -row || col === row || row === 4) ? COLOURS.mountain : (col < 0 ? COLOURS.mountainShade : COLOURS.land);
            if (row === 0 || (row === 1 && my < 40)) colr = row === 0 ? COLOURS.mountain : COLOURS.snow;
            dot(cx + col, cy - 4 + row, colr);
          }
        }
      });
    }

    // settlement dots at every region coord
    anchors.forEach(function (a) {
      dot(a.x, a.y, COLOURS.ink); dot(a.x + 1, a.y, COLOURS.ink); dot(a.x, a.y + 1, COLOURS.ink); dot(a.x + 1, a.y + 1, COLOURS.ink);
    });

    // compass rose
    var C = COMPASS;
    for (var ang = 0; ang < 32; ang++) {
      var th = ang / 32 * Math.PI * 2;
      if (ang % 2 === 0) dot(C.x + Math.cos(th) * 7, C.y + Math.sin(th) * 7, COLOURS.ink);
    }
    for (var L = 1; L <= 10; L++) {
      dot(C.x, C.y - L, L > 2 ? COLOURS.red : COLOURS.ink);
      if (L <= 8) { dot(C.x, C.y + L, COLOURS.ink); dot(C.x - L, C.y, COLOURS.ink); dot(C.x + L, C.y, COLOURS.ink); }
      if (L <= 4) { dot(C.x - L, C.y - L, COLOURS.gold); dot(C.x + L, C.y - L, COLOURS.gold); dot(C.x - L, C.y + L, COLOURS.gold); dot(C.x + L, C.y + L, COLOURS.gold); }
    }
    dot(C.x, C.y, COLOURS.gold);
  }

  /* ---------- DOM ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function injectStyle() {
    if (document.getElementById(DOM_ID + '-style')) return;
    var p = '.' + DOM_ID;
    var css = [
      '#' + DOM_ID + '-btn{position:fixed;bottom:' + BUTTON_POSITION.bottom + ';left:' + BUTTON_POSITION.left + ';z-index:' + (Z_INDEX - 1) + ';',
      'font:bold 14px Georgia,serif;color:' + COLOURS.ink + ';background:' + COLOURS.paper + ';border:2px solid ' + COLOURS.ink + ';',
      'border-radius:4px;padding:6px 12px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.5)}',
      '#' + DOM_ID + '-btn:hover{background:' + COLOURS.land + '}',
      '#' + DOM_ID + '-btn:focus-visible,' + p + ' button:focus-visible{outline:3px solid ' + COLOURS.gold + ';outline-offset:2px}',
      p + '-ov{position:fixed;inset:0;z-index:' + Z_INDEX + ';background:' + COLOURS.backdrop + ';display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;gap:8px;padding:8px;box-sizing:border-box;font-family:Georgia,serif}',
      p + '-ov[hidden]{display:none}',
      p + '-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;width:var(--' + DOM_ID + '-w);max-width:100%;color:' + COLOURS.paper + '}',
      p + '-title{font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:' + COLOURS.gold + '}',
      p + '-close{font:bold 14px Georgia,serif;background:' + COLOURS.paper + ';color:' + COLOURS.ink + ';border:2px solid ' + COLOURS.ink + ';border-radius:4px;padding:5px 10px;cursor:pointer}',
      p + '-wrap{position:relative;width:var(--' + DOM_ID + '-w);aspect-ratio:' + MAP_W + '/' + MAP_H + ';border:3px solid ' + COLOURS.ink + ';',
      'box-shadow:0 0 0 3px ' + COLOURS.paper + ',0 6px 24px rgba(0,0,0,.7);background:' + COLOURS.ocean + ';overflow:hidden}',
      p + '-wrap canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}',
      p + '-wrap::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 40px rgba(74,59,42,.45)}',
      p + '-lbl{position:absolute;transform:translate(-50%,-50%);pointer-events:none;color:' + COLOURS.ink + ';text-align:center;',
      'font-size:clamp(14px,1.15vw,15px);font-weight:bold;letter-spacing:.08em;text-transform:uppercase;line-height:1.15;max-width:22%;',
      'text-shadow:0 0 3px ' + COLOURS.paper + ',0 0 3px ' + COLOURS.paper + '}',
      p + '-town{position:absolute;transform:translate(6px,-50%);pointer-events:none;color:' + COLOURS.ink + ';font-size:14px;',
      'font-style:italic;white-space:nowrap;text-shadow:0 0 2px ' + COLOURS.paper + ',0 0 2px ' + COLOURS.paper + '}',
      p + '-narrow ' + p + '-town{display:none}',
      p + '-stamp{display:block;margin:2px auto 0;width:max-content;color:' + COLOURS.red + ';border:2px solid ' + COLOURS.red + ';border-radius:3px;',
      'padding:0 4px;font-size:14px;transform:rotate(-8deg);text-shadow:none;background:rgba(239,227,196,.6)}',
      p + '-n{position:absolute;pointer-events:none;color:' + COLOURS.ink + ';font:bold 14px Georgia,serif;transform:translate(-50%,-100%)}',
      p + '-pin{position:absolute;transform:translate(-50%,-50%);width:' + PIN_SIZE_PX + 'px;height:' + PIN_SIZE_PX + 'px;border-radius:50%;padding:0;',
      'background:' + COLOURS.red + ';color:#fff;font:bold 14px Georgia,serif;border:2px solid #fff8e0;cursor:pointer;z-index:2;box-shadow:0 2px 5px rgba(0,0,0,.65)}',
      p + '-narrow ' + p + '-pin{width:' + Math.round(PIN_SIZE_PX * 0.75) + 'px;height:' + Math.round(PIN_SIZE_PX * 0.75) + 'px;font-size:9px}',
      p + '-narrow ' + p + '-pin::after{content:"";position:absolute;inset:-12px;border-radius:50%}',   /* K48: a 40 px tap area round the small phone pin */
      p + '-pin.on{background:' + COLOURS.gold + ';color:' + COLOURS.ink + '}',
      p + '-card{position:absolute;z-index:3;min-width:150px;max-width:min(260px,70%);background:' + COLOURS.paper + ';color:' + COLOURS.ink + ';',
      'border:2px solid ' + COLOURS.ink + ';border-radius:4px;padding:8px 10px;font-size:14px;line-height:1.35;box-shadow:0 4px 12px rgba(0,0,0,.55)}',
      p + '-card[hidden]{display:none}',
      p + '-narrow>' + p + '-card{position:static;width:var(--' + DOM_ID + '-w);max-width:100%;box-sizing:border-box}',
      p + '-card b{display:block;color:' + COLOURS.red + ';margin-bottom:3px}',
      p + '-card span{display:block}',
      p + '-go{display:block;margin-top:6px;min-height:40px;width:100%;font:bold 14px Georgia,serif;background:' + COLOURS.ink + ';color:' + COLOURS.paper + ';border:0;border-radius:4px;cursor:pointer}',
      p + '-legend{width:var(--' + DOM_ID + '-w);max-width:100%;color:' + COLOURS.paper + ';font-size:14px;opacity:.9}'
    ].join('');
    var s = el('style'); s.id = DOM_ID + '-style'; s.textContent = css;
    document.head.appendChild(s);
  }

  function build() {
    if (ui || !document.body) return;
    injectStyle();
    var btn = el('button', null, 'Map (J)');
    btn.id = DOM_ID + '-btn'; btn.type = 'button';
    btn.setAttribute('aria-keyshortcuts', 'J');
    btn.setAttribute('aria-label', 'Open the map of Arcadia');
    btn.addEventListener('click', function () { open(); });

    var ov = el('div', DOM_ID + ' ' + DOM_ID + '-ov'); ov.hidden = true;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Map of Arcadia');
    var bar = el('div', DOM_ID + '-bar');
    var title = el('div', DOM_ID + '-title', 'Arcadia');
    var close = el('button', DOM_ID + '-close', 'Close (Esc)'); close.type = 'button';
    close.addEventListener('click', function () { shut(); });
    bar.appendChild(title); bar.appendChild(close);

    var wrap = el('div', DOM_ID + '-wrap');
    var canvas = el('canvas'); canvas.width = MAP_W; canvas.height = MAP_H; canvas.setAttribute('aria-hidden', 'true');
    var labels = el('div'); var pins = el('div');
    var card = el('div', DOM_ID + '-card'); card.hidden = true; card.setAttribute('role', 'status'); card.setAttribute('aria-live', 'polite');
    wrap.appendChild(canvas); wrap.appendChild(labels); wrap.appendChild(pins); wrap.appendChild(card);
    wrap.addEventListener('click', function (e) { if (!e.target.classList.contains(DOM_ID + '-pin')) hideCard(true); });

    var legend = el('div', DOM_ID + '-legend', 'Pins: today\u2019s contracts (hover, tap or Enter for details). Gold hatching and a red stamp: regions the company has worked.');
    ov.appendChild(bar); ov.appendChild(wrap); ov.appendChild(legend);

    // keep pointer and wheel events inside the overlay away from the game
    ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'wheel', 'contextmenu'].forEach(function (t) {
      ov.addEventListener(t, function (e) { e.stopPropagation(); }, false);
    });

    document.body.appendChild(btn); document.body.appendChild(ov);
    ui = { legend: legend, btn: btn, ov: ov, close: close, wrap: wrap, canvas: canvas, labels: labels, pins: pins, card: card };
    window.addEventListener('resize', sizeMap);
    updateButton();
    setInterval(updateButton, VISIBILITY_POLL_MS);
  }

  function sizeMap() {
    if (!ui) return;
    var w = Math.min(window.innerWidth * 0.96, (window.innerHeight - 110) * MAP_W / MAP_H);
    w = Math.max(260, Math.floor(w));
    ui.ov.style.setProperty('--' + DOM_ID + '-w', w + 'px');
    ui.ov.classList.toggle(DOM_ID + '-narrow', w < NARROW_PX);
  }

  function updateButton() {
    if (!ui) return;
    var ok = canOpen();
    ui.btn.style.display = ok && !isOpen ? '' : 'none';
    if (isOpen && !ok) shut();
  }

  function placeAt(node, p) { node.style.left = p[0] + '%'; node.style.top = p[1] + '%'; }
  function clampPct(v) { return Math.max(2, Math.min(98, v)); }

  function renderLabels(regions, worked) {
    ui.labels.textContent = '';
    regions.forEach(function (r) {
      var at = REGION_LABEL_AT[r.id];
      if (!at) {
        var sx = 0, sy = 0; r.coords.forEach(function (p) { sx += p[0]; sy += p[1]; });
        at = [sx / r.coords.length, sy / r.coords.length];
      }
      var lbl = el('div', DOM_ID + '-lbl', r.name);
      if (worked[r.id]) lbl.appendChild(el('span', DOM_ID + '-stamp', 'Worked'));
      placeAt(lbl, at);
      ui.labels.appendChild(lbl);
      if (SHOW_TOWN_LABELS) {
        r.towns.forEach(function (t, i) {
          var p = r.coords[i]; if (!p || typeof t !== 'string') return;
          var tl = el('div', DOM_ID + '-town', t); placeAt(tl, p); ui.labels.appendChild(tl);
        });
      }
    });
    var n = el('div', DOM_ID + '-n', 'N');
    placeAt(n, [COMPASS.x / MAP_W * 100, (COMPASS.y - 11) / MAP_H * 100]);
    ui.labels.appendChild(n);
  }

  function pinLabel(i) { return PIN_NUMERALS[i] || String(i + 1); }

  function renderPins(regions) {
    ui.pins.textContent = '';
    var M = getMeta();
    var board = (M && Array.isArray(M.board)) ? M.board : [];
    var byId = Object.create(null); regions.forEach(function (r) { byId[r.id] = r; });
    var sel = selectedContract();
    ui.pinData = [];
    board.forEach(function (c, i) {
      if (!c || typeof c !== 'object') return;
      var at = (Array.isArray(c.mapAt) && isFinite(c.mapAt[0]) && isFinite(c.mapAt[1])) ? c.mapAt
        : (byId[c.region] ? byId[c.region].coords[0] : [35 + i * 18, 48]);
      at = [clampPct(+at[0]), clampPct(+at[1])];
      var name = objectiveName(c.obj);
      var regionName = c.regionName || (byId[c.region] && byId[c.region].name) || 'Arcadia';
      var b = el('button', DOM_ID + '-pin' + (sel === i ? ' on' : ''), pinLabel(i));
      b.type = 'button';
      b.setAttribute('aria-label', 'Contract ' + pinLabel(i) + ': ' + name + ', ' + regionName + '. Press Enter for details.');
      placeAt(b, at);
      var info = { i: i, at: at, title: 'Contract ' + pinLabel(i) + ': ' + name, lines: [
        'Place: ' + (c.place || 'not recorded'),
        'Town: ' + (c.town || 'not recorded'),
        'Region: ' + regionName,
        'Tier: ' + (c.tier != null ? c.tier : 'not recorded'),
        'Pay: ' + (c.pay != null ? c.pay + ' gold' : 'not recorded')
      ] };
      b.addEventListener('mouseenter', function () { if (pinnedCard < 0) showCard(info); });
      b.addEventListener('mouseleave', function () { if (pinnedCard < 0) hideCard(false); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (pinnedCard === i) { hideCard(true); return; }
        pinnedCard = i; showCard(info); playPick();
      });
      ui.pins.appendChild(b);
      ui.pinData.push(b);
    });
  }

  function showCard(info) {
    var card = ui.card;
    card.textContent = '';
    card.appendChild(el('b', null, info.title));
    info.lines.forEach(function (l) { card.appendChild(el('span', null, l)); });
    // K48 (16 Nov): the card can pick the job, so the map is more than a picture.
    if (typeof info.i === 'number' && typeof renderTable === 'function') {
      var go = el('button', DOM_ID + '-go', 'Show on the board');
      go.type = 'button';
      go.addEventListener('click', function (e) { e.stopPropagation(); showOnBoard(info.i); });
      card.appendChild(go);
    }
    card.style.left = card.style.right = card.style.top = card.style.bottom = '';
    var narrow = ui.ov.classList.contains(DOM_ID + '-narrow');
    var home = narrow ? ui.ov : ui.wrap;
    if (card.parentNode !== home) { if (narrow) ui.ov.insertBefore(card, ui.legend); else ui.wrap.appendChild(card); }
    if (narrow) { card.hidden = false; return; }
    if (info.at[0] > 55) card.style.right = (100 - info.at[0] + 3) + '%'; else card.style.left = (info.at[0] + 3) + '%';
    if (info.at[1] > 55) card.style.bottom = (100 - info.at[1] + 3) + '%'; else card.style.top = (info.at[1] + 3) + '%';
    card.hidden = false;
  }
  function showOnBoard(i) {
    try {
      if ((typeof MU === 'undefined' || !MU) && typeof ensureMuster === 'function') ensureMuster();
      if (typeof MU !== 'undefined' && MU) MU.contract = i;
      playPick(); shut();
      var tbl = document.getElementById('screen-table');
      if (!(tbl && !tbl.classList.contains('hidden')) && typeof openBoard === 'function') openBoard();
      if (typeof renderTable === 'function') renderTable();
    } catch (e) { /* silent */ }
  }
  function hideCard(force) {
    if (!ui) return;
    if (force) pinnedCard = -1;
    ui.card.hidden = true;
  }

  function focusables() { var g = ui.card && !ui.card.hidden && ui.card.querySelector('.' + DOM_ID + '-go'); return [ui.close].concat(ui.pinData || [], g ? [g] : []); }

  function open() {
    if (isOpen || !canOpen()) return;
    build();
    if (!ui) return;
    try {
      var regions = getRegions();
      var worked = workedSet(regions);
      sizeMap();
      drawMap(ui.canvas, regions, worked);
      renderLabels(regions, worked);
      renderPins(regions);
    } catch (e) { /* fail silently: show whatever was drawn */ }
    pinnedCard = -1; ui.card.hidden = true;
    lastFocus = document.activeElement;
    ui.ov.hidden = false; isOpen = true;
    updateButton();
    var f = focusables(); (f[1] || f[0]).focus();
    playPick();
  }

  function shut() {
    if (!isOpen || !ui) return;
    ui.ov.hidden = true; isOpen = false; hideCard(true);
    updateButton();
    try { if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) lastFocus.focus(); } catch (e) { /* silent */ }
  }

  function isTyping(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }

  function onKey(e) {
    if (isOpen) {
      if (e.type === 'keydown') {
        if (e.key === KEY_CLOSE || (e.key && e.key.toLowerCase() === KEY_OPEN && !e.ctrlKey && !e.metaKey && !e.altKey)) {
          e.preventDefault(); shut();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          var f = focusables(), at = f.indexOf(document.activeElement);
          var next = e.shiftKey ? (at <= 0 ? f.length - 1 : at - 1) : (at + 1) % f.length;
          f[next].focus();
          if (pinnedCard < 0) hideCard(false);
        }
      }
      e.stopPropagation();   // while open, no key reaches the game
      return;
    }
    if (e.type !== 'keydown' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!e.key || e.key.toLowerCase() !== KEY_OPEN || isTyping(e.target)) return;
    if (!canOpen()) return;
    e.preventDefault(); e.stopPropagation();
    open();
  }

  function init() {
    try {
      build();
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', function (e) { if (isOpen) e.stopPropagation(); }, true);
      window.addEventListener('keypress', function (e) { if (isOpen) e.stopPropagation(); }, true);
    } catch (e) { /* fail silently */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
