/* ============================================================================
   INDEX 32M - F-32 The explorable map of Arcadia (Art & Interface)
   32.1 The painted map, drawn in code once to an offscreen canvas (MAP32.base()) and cached. Land shapes are traced from
        Patrick's scan (audits/maps/arcadia-sketch-2.png); region loops (Empire, Elves, Freelands) from his coloured sheet.
        One unit = one sketch pixel (961 x 699), so a place's x/y percent maps straight onto the sheet.
        Three western lands (the Empire, Zenbos, Mendor), the central land, the Eastern Lands, the Great Desert,
        and an island above and below the central land. Open water separates the Empire from the central land.
   Viewer: MAP32.open({cx,cy,z}) shows the map full screen (centre in sketch px, zoom 1 = whole sheet). Labels in three
        levels. Pan, zoom and place cards are 32.2 / 32.3. Places: js/campaign/places.js.
   INT-1 group 12: no switch.
============================================================================ */
(function(){
  'use strict';
  const M = window.MAP32 = {W: 961, H: 699, Q: 2.5, view: {cx: 480.5, cy: 349.5, z: 1}};
  let BASE = null;
  const TAU = Math.PI * 2;
  function rng(seed){ let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- the land, in sketch pixels (clockwise) ---- */
  const LAND = {
    empire: [[96,268],[108,228],[122,226],[165,168],[205,148],[255,142],[310,148],[345,166],[352,180],[335,208],[318,238],[300,262],[285,272],[262,268],[250,262],[235,268],[212,300],[190,322],[150,312],[120,306],[100,292]],
    zenbos: [[98,332],[125,316],[165,312],[196,332],[198,372],[186,398],[150,406],[114,396],[96,366]],
    mendor: [[226,300],[250,282],[272,284],[286,312],[284,345],[266,372],[242,378],[226,350]],
    central: [[392,182],[420,176],[452,170],[482,152],[515,128],[560,108],[606,104],[640,103],[690,128],[695,165],[682,200],[702,245],[692,300],[716,336],[762,346],[802,370],[852,400],[860,445],[842,490],[792,512],[722,508],[642,508],[562,518],[532,498],[502,472],[470,472],[440,480],[406,482],[384,470],[380,442],[335,440],[312,430],[296,402],[278,392],[284,376],[300,370],[322,372],[336,335],[346,305],[352,275],[372,245],[384,215]],
    east: [[752,100],[790,72],[850,65],[900,100],[920,170],[926,260],[932,305],[902,342],[872,372],[820,362],[792,322],[772,282],[766,230],[756,160]],
    desert: [[78,500],[100,445],[150,425],[215,420],[256,452],[286,482],[282,540],[300,578],[310,606],[260,616],[200,602],[150,582],[100,558]],
    north: [[325,35],[345,15],[420,12],[500,15],[522,36],[500,60],[440,72],[380,76],[340,62]],
    south: [[548,612],[575,576],[620,556],[660,576],[668,610],[645,640],[590,656],[550,640]]
  };
  /* Patrick's coloured loops: tints follow them and are clipped to the land */
  const EMPIRE_LOOP = [[82,240],[96,192],[158,137],[260,126],[447,143],[532,150],[545,215],[540,285],[470,302],[413,300],[355,315],[298,341],[279,375],[240,384],[221,355],[202,322],[159,300],[111,296],[84,269]];
  const REG = [
    {id: 'Empire', col: [190, 74, 48], pts: EMPIRE_LOOP, a: .26},
    {id: 'Elves', col: [50, 150, 58], ell: [358, 402, 54, 59], a: .42},
    {id: 'Freelands', col: [150, 128, 38], pts: [[436,500],[440,446],[486,412],[540,420],[578,384],[640,354],[702,352],[760,352],[794,362],[872,402],[884,520],[600,545]], a: .36}
  ];
  const RIVERS = [   // the Venn past Arsila to Tem, then rivers off the spine and the Eastern Lands
    [[198,238],[206,256],[214,268],[205,284],[192,296],[182,303]],
    [[372,130],[360,150],[350,160]],
    [[596,260],[560,262],[520,280],[480,318],[470,360],[455,400],[452,446]],
    [[600,312],[632,326],[668,342],[705,354],[736,358],[760,356],[772,346]],
    [[846,270],[868,300],[890,326],[904,338]],
    [[800,128],[820,150],[842,168],[860,176]],
    [[300,160],[296,185],[288,214],[286,238],[284,262]]
  ];
  const ROADS = [   // the Long Road (Varnholt to Kalloon) and the Iron Road (Levoria to the Mendor ferry)
    [[490,398],[530,408],[575,420],[625,436],[680,444],[720,446],[759,447],[800,448],[836,449]],
    [[500,252],[470,262],[440,270],[400,282],[372,292],[352,300]],
    [[352,178],[330,180],[300,195],[270,196]]];
  const LAKES = [[438,330,14,8],[868,206,16,9],[430,598,12,7],[605,596,13,8],[120,540,9,5]];

  /* coast: midpoint displacement gives a ragged hand-drawn shore; a final pass adds fine jitter */
  function wobble(pts, seed, amp){
    const R = rng(seed); let p = pts.slice();
    for (let lv = 0; lv < 5; lv++){ const q = [];
      for (let i = 0; i < p.length; i++){ const a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, k = (R() - .5) * amp * Math.min(1, L / 24);
        q.push(a, [(a[0] + b[0]) / 2 - dy / L * k, (a[1] + b[1]) / 2 + dx / L * k]); }
      p = q; amp *= .62; }
    return p;
  }
  function smoothPath(p, s){
    const P = new Path2D(), n = p.length, m = i => { const a = p[i % n], b = p[(i + 1) % n]; return [(a[0] + b[0]) / 2 * s, (a[1] + b[1]) / 2 * s]; };
    const s0 = m(n - 1); P.moveTo(s0[0], s0[1]);
    for (let i = 0; i < n; i++){ const e = m(i); P.quadraticCurveTo(p[i][0] * s, p[i][1] * s, e[0], e[1]); }
    P.closePath(); return P;
  }
  const places = () => (window.ARCADIA_PLACES || []).filter(p => p && p.name);

  M.base = function(){
    if (BASE) return BASE;
    const Q = M.Q, W = Math.round(M.W * Q), H = Math.round(M.H * Q), S = Q;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const cv = mk(), g = cv.getContext('2d'), R = rng(3207);
    const paths = Object.keys(LAND).map((k, i) => smoothPath(wobble(LAND[k], 100 + i * 17, 11), S));
    const landAll = new Path2D(); for (const p of paths) landAll.addPath(p);
    const fillAll = (c, st) => { c.fillStyle = st; for (const p of paths) c.fill(p); };
    const mc = document.createElement('canvas'); mc.width = M.W; mc.height = M.H; const mg = mc.getContext('2d', {willReadFrequently: true}); mg.fillStyle = '#000';
    for (const k of Object.keys(LAND)) mg.fill(smoothPath(wobble(LAND[k], 100 + Object.keys(LAND).indexOf(k) * 17, 11), 1));
    const MASK = mg.getImageData(0, 0, M.W, M.H).data;
    const at = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < M.W && y < M.H && MASK[(y * M.W + x) * 4 + 3] > 128; };
    const inLand = (x, y, m) => { x /= S; y /= S; m = m || 0; return at(x, y) && at(x + m, y) && at(x - m, y) && at(x, y + m) && at(x, y - m); };
    /* 1. sea: a graded wash, mottled like watercolour, with paper fibre and wave strokes */
    const sea = g.createLinearGradient(0, 0, W, H); sea.addColorStop(0, '#9bb7b3'); sea.addColorStop(.5, '#8cabaa'); sea.addColorStop(1, '#82a2a5');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++){ const x = R() * W, y = R() * H, r = 40 + R() * 150, gr = g.createRadialGradient(x, y, 0, x, y, r), dk = R() < .5;
      gr.addColorStop(0, dk ? 'rgba(60,100,110,.12)' : 'rgba(205,225,215,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (const [bl, col] of [[46 * S / 2.5, 'rgba(190,212,205,.55)'], [20 * S / 2.5, 'rgba(216,228,216,.62)']]){ g.save(); g.filter = 'blur(' + bl + 'px)'; fillAll(g, col); g.restore(); }
    for (let i = 0; i < 900; i++){ const x = R() * W, y = R() * H, l = 14 + R() * 30; g.strokeStyle = R() < .6 ? 'rgba(255,255,255,.2)' : 'rgba(40,80,90,.14)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 5 - R() * 3, x + l, y); g.stroke(); }
    /* coast ripples: broken ink rings, 1 solid and 2 dashed, drawn as stroke-minus-stroke on a scratch layer */
    { const t = mk(), tg = t.getContext('2d');
      for (const [d, al, dash, lw] of [[8, .55, null, 2.2], [20, .36, [30, 16], 2.2], [38, .22, [22, 28], 2]]){
        tg.clearRect(0, 0, W, H); tg.lineJoin = 'round'; tg.globalCompositeOperation = 'source-over'; tg.strokeStyle = '#3d2f1e'; tg.lineWidth = 2 * d * S / 2.5 + lw; tg.setLineDash(dash || []);
        for (const p of paths) tg.stroke(p);
        tg.globalCompositeOperation = 'destination-out'; tg.setLineDash([]); tg.lineWidth = 2 * d * S / 2.5; for (const p of paths) tg.stroke(p);
        g.globalAlpha = al; g.drawImage(t, 0, 0); g.globalAlpha = 1; } }
    /* 2. inked ragged coast: heavy line and a thin echo line (the other half is covered by the land fill) */
    g.save(); g.lineJoin = 'round'; g.strokeStyle = '#43341f'; g.lineWidth = 8; for (const p of paths) g.stroke(p); g.restore();
    /* 3. land: parchment, mottled, fibrous */
    fillAll(g, '#e6d6aa');
    g.save(); g.clip(landAll);
    for (let i = 0; i < 520; i++){ const x = R() * W, y = R() * H, r = 25 + R() * 110, gr = g.createRadialGradient(x, y, 0, x, y, r), lt = R() < .5; gr.addColorStop(0, lt ? 'rgba(255,246,218,.22)' : 'rgba(150,112,58,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 16000; i++){ const x = R() * W, y = R() * H; g.fillStyle = R() < .5 ? 'rgba(120,90,40,.08)' : 'rgba(255,250,230,.12)'; g.fillRect(x, y, 1 + R() * 3, 1 + R() * 2); }
    for (let i = 0; i < 5200; i++){ const x = R() * W, y = R() * H, a = R() * TAU, l = 6 + R() * 18; g.strokeStyle = R() < .5 ? 'rgba(110,80,35,.09)' : 'rgba(255,250,235,.16)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    /* region tints follow Patrick's loops; borders dashed, clipped to land so they never run over the sea */
    for (const r of REG){
      const loop = () => { g.beginPath(); if (r.pts){ r.pts.forEach((p, i) => i ? g.lineTo(p[0] * S, p[1] * S) : g.moveTo(p[0] * S, p[1] * S)); g.closePath(); } else g.ellipse(r.ell[0] * S, r.ell[1] * S, r.ell[2] * S, r.ell[3] * S, 0, 0, TAU); };
      g.save(); g.filter = 'blur(' + (9 * S / 2.5) + 'px)'; g.fillStyle = 'rgba(' + r.col.join(',') + ',' + r.a + ')'; loop(); g.fill(); g.restore();
      g.save(); g.strokeStyle = 'rgba(' + r.col.map(v => Math.round(v * .8)).join(',') + ',.6)'; g.lineWidth = 3; g.setLineDash([16, 10]); loop(); g.stroke(); g.restore(); }
    /* shore shading inside the land */
    { const t = mk(), tg = t.getContext('2d'); tg.fillStyle = '#000'; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'destination-out'; for (const p of paths) tg.fill(p);
      const t2 = mk(), t2g = t2.getContext('2d'); t2g.filter = 'blur(' + (13 * S / 2.5) + 'px)'; t2g.drawImage(t, 0, 0); t2g.filter = 'none'; t2g.globalCompositeOperation = 'source-in'; t2g.fillStyle = 'rgba(110,78,34,.5)'; t2g.fillRect(0, 0, W, H);
      g.drawImage(t2, 0, 0); }
    /* lakes */
    for (const l of LAKES){ g.fillStyle = '#8fb0b0'; g.strokeStyle = '#43341f'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(l[0] * S, l[1] * S, l[2] * S, l[3] * S, -.2, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(l[0] * S, l[1] * S, l[2] * S * .6, l[3] * S * .5, -.2, .3, 2.2); g.stroke(); }
    /* rivers: tapering blue-grey ribbons with an ink edge */
    for (const r of RIVERS){ g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; const n = r.length - 1;
      for (const [ex, col] of [[1.8, 'rgba(61,47,30,.55)'], [0, '#7ea1ad']]) r.forEach((_, i) => { if (!i) return; g.strokeStyle = col; g.lineWidth = (1.6 + (i / n) * 2.2) * S + ex; g.beginPath(); g.moveTo(r[i - 1][0] * S, r[i - 1][1] * S); g.lineTo(r[i][0] * S, r[i][1] * S); g.stroke(); });
      g.restore(); }
    /* roads */
    for (const r of ROADS){ g.save(); g.strokeStyle = 'rgba(90,60,30,.8)'; g.lineWidth = 2.4; g.setLineDash([9, 7]); g.lineCap = 'round'; g.beginPath(); r.forEach((p, i) => i ? g.lineTo(p[0] * S, p[1] * S) : g.moveTo(p[0] * S, p[1] * S)); g.stroke(); g.restore(); }

    /* 4. terrain stamps: placed with Poisson spacing, kept off the sea and off the towns, sorted by y so they overlap properly */
    const stamps = [], spots = [], pl = places().filter(p => !/region|range|jungle|forest|swamp|desert|islands|continent/.test(p.kind));
    const free = (x, y, d) => { for (const q of spots) if ((q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y) < d * d) return false; return true; };
    const nearPlace = (x, y) => { for (const p of pl){ const dx = p.x * M.W / 100 - x, dy = p.y * M.H / 100 - y; if (dx * dx + dy * dy < 100) return true; } return false; };
    const put = (x, y, d, fn, margin) => { if (!inLand(x * S, y * S, margin || 2) || nearPlace(x, y) || !free(x, y, d)) return false; spots.push([x, y, d]); stamps.push([y, () => fn(x * S, y * S)]); return true; };
    const shade = (r, gg, b, k) => 'rgb(' + Math.round(r * k) + ',' + Math.round(gg * k) + ',' + Math.round(b * k) + ')';
    const oak = (x, y, jung) => { const s = (2.8 + R() * 1.4) * S / 2.5 * 1.7, k = .85 + R() * .3, c1 = jung ? shade(47, 106, 58, k) : shade(77, 107, 58, k), c2 = jung ? shade(63, 138, 72, k) : shade(111, 138, 74, k);
      g.fillStyle = 'rgba(40,30,15,.28)'; g.beginPath(); g.ellipse(x, y + 3 * s, 4 * s, 1.6 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#5a3f26'; g.fillRect(x - .7 * s, y, 1.4 * s, 3 * s);
      g.fillStyle = c1; g.beginPath(); g.arc(x, y - 1.5 * s, 3.6 * s, 0, TAU); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(x - .9 * s, y - 2.4 * s, 2.3 * s, 0, TAU); g.fill(); g.strokeStyle = '#3a4a28'; g.lineWidth = .9; g.beginPath(); g.arc(x, y - 1.5 * s, 3.6 * s, 0, TAU); g.stroke(); };
    const pine = (x, y) => { const s = (2.6 + R() * 1.6) * S / 2.5 * 1.7, k = .8 + R() * .3; g.fillStyle = 'rgba(40,30,15,.25)'; g.beginPath(); g.ellipse(x, y + 3 * s, 3 * s, 1.2 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#5a3f26'; g.fillRect(x - .6 * s, y, 1.2 * s, 3 * s);
      for (let i = 0; i < 3; i++){ const w = (3.2 - i * .7) * s, yy = y - i * 2.6 * s; g.fillStyle = shade(52, 90, 54, k * (1 + i * .12)); g.strokeStyle = '#2f4226'; g.lineWidth = .9; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - 4.4 * s); g.lineTo(x + w, yy); g.closePath(); g.fill(); g.stroke(); } };
    const poplar = (x, y) => { const s = (2.4 + R() * 1.2) * S / 2.5 * 1.7, k = .85 + R() * .25; g.fillStyle = 'rgba(40,30,15,.22)'; g.beginPath(); g.ellipse(x, y + 3 * s, 2.4 * s, 1 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#5a3f26'; g.fillRect(x - .5 * s, y, 1 * s, 3 * s);
      g.fillStyle = shade(96, 128, 60, k); g.strokeStyle = '#3a4a28'; g.lineWidth = .9; g.beginPath(); g.ellipse(x, y - 3 * s, 1.9 * s, 4.6 * s, 0, 0, TAU); g.fill(); g.stroke(); };
    const palm = (x, y) => { const s = (2.6 + R() * 1) * S / 2.5 * 1.7; g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.6 * s / 2; g.beginPath(); g.moveTo(x, y + 2 * s); g.quadraticCurveTo(x + 1.2 * s, y - 2 * s, x + .4 * s, y - 5 * s); g.stroke(); g.strokeStyle = '#4f7a3a'; g.lineWidth = 1.4 * s / 2;
      for (let i = 0; i < 6; i++){ const a = -Math.PI / 2 + (i - 2.5) * .55; g.beginPath(); g.moveTo(x + .4 * s, y - 5 * s); g.quadraticCurveTo(x + .4 * s + Math.cos(a) * 3 * s, y - 5 * s + Math.sin(a) * 3 * s - s, x + .4 * s + Math.cos(a) * 4.4 * s, y - 5 * s + Math.sin(a) * 4 * s + 1.4 * s); g.stroke(); } };
    const dead = (x, y) => { const s = (2.2 + R()) * S / 2.5 * 1.7; g.strokeStyle = '#4a4332'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y + 2 * s); g.lineTo(x, y - 3 * s); g.moveTo(x, y - s); g.lineTo(x - 2 * s, y - 3 * s); g.moveTo(x, y - 1.6 * s); g.lineTo(x + 1.8 * s, y - 3.2 * s); g.stroke(); };
    const hill = (x, y) => { const w = (5 + R() * 4) * S / 2.5 * 1.7, h = w * (.45 + R() * .25), k = .9 + R() * .2; g.fillStyle = 'rgba(40,30,15,.18)'; g.beginPath(); g.ellipse(x + w * .1, y + 1, w * .95, 2 * S / 2.5, 0, 0, TAU); g.fill();
      g.fillStyle = shade(214, 197, 150, k); g.strokeStyle = '#4b3a24'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * .5, y - h * 1.3, x, y - h); g.quadraticCurveTo(x + w * .55, y - h * .9, x + w, y); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(75,58,36,.45)'; g.lineWidth = 1; for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x + w * (.1 + i * .22), y - h * (.7 - i * .2)); g.lineTo(x + w * (.2 + i * .22), y - 1); g.stroke(); } };
    const peak = (x, y, big) => { const m = (big || .6 + R() * .8) * S / 2.5 * 1.9, w = (6.5 + R() * 3) * m, h = (9 + R() * 5.5) * m, k = .92 + R() * .16, lean = (R() - .5) * w * .5, snow = h > 12.5 * m * 1.05 || R() < .3;
      g.fillStyle = 'rgba(40,30,15,.22)'; g.beginPath(); g.ellipse(x + w * .15, y + 1, w * .9, 2.2 * m, 0, 0, TAU); g.fill();
      g.fillStyle = shade(217, 201, 160, k); g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + lean, y - h); g.lineTo(x + w, y); g.closePath(); g.fill();
      g.fillStyle = 'rgba(95,70,40,.55)'; g.beginPath(); g.moveTo(x + lean, y - h); g.lineTo(x + w, y); g.lineTo(x + w * .12, y); g.lineTo(x + lean * .6 + w * .05, y - h * .45); g.closePath(); g.fill();
      if (snow){ g.fillStyle = '#f6f0e0'; g.beginPath(); g.moveTo(x + lean - w * .3, y - h * .7); g.lineTo(x + lean, y - h); g.lineTo(x + lean + w * .3, y - h * .7); g.lineTo(x + lean + w * .08, y - h * .6); g.lineTo(x + lean - w * .1, y - h * .68); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(61,47,30,.5)'; g.lineWidth = 1; for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x + lean + w * (.15 + i * .2), y - h * (.55 - i * .12)); g.lineTo(x + w * (.28 + i * .2), y - 1); g.stroke(); }
      g.strokeStyle = '#3d2f1e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + lean, y - h); g.lineTo(x + w, y); g.stroke();
      if (R() < .35){ const x2 = x - w * .9, h2 = h * .6, w2 = w * .6; g.fillStyle = shade(217, 201, 160, k * .97); g.beginPath(); g.moveTo(x2 - w2, y); g.lineTo(x2, y - h2); g.lineTo(x2 + w2, y); g.closePath(); g.fill(); g.stroke(); } };
    const tuft = (x, y) => { g.strokeStyle = 'rgba(96,110,52,.6)'; g.lineWidth = 1.2; g.beginPath(); for (const d of [-2, 0, 2]){ g.moveTo(x + d * S / 2.5, y); g.lineTo(x + d * 1.5 * S / 2.5, y - (3 + R() * 2.4) * S / 2.5); } g.stroke(); };
    const dune = (x, y) => { g.strokeStyle = 'rgba(160,110,50,.6)'; g.lineWidth = 1.7; g.beginPath(); g.arc(x, y, (7 + R() * 5) * S / 2.5 * 1.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); };
    const rock = (x, y) => { const s = (1.6 + R()) * S / 2.5 * 1.8; g.fillStyle = '#b9a98a'; g.strokeStyle = '#4b3a24'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 2 * s, y); g.lineTo(x - s, y - 1.6 * s); g.lineTo(x + s, y - 1.8 * s); g.lineTo(x + 2 * s, y); g.closePath(); g.fill(); g.stroke(); };
    const reed = (x, y) => { g.strokeStyle = '#4f6a3a'; g.lineWidth = 1.5; g.beginPath(); for (const d of [-3, 0, 3]){ g.moveTo(x + d * 1.5, y); g.lineTo(x + d * 2, y - 8); } g.stroke(); g.fillStyle = 'rgba(110,150,140,.55)'; g.beginPath(); g.ellipse(x, y + 1, 14, 4, 0, 0, TAU); g.fill(); };
    const tower = (x, y) => { const s = S / 2.5 * 1.8; g.fillStyle = '#e8dcc0'; g.strokeStyle = '#3d2f1e'; g.lineWidth = 1.5; g.beginPath(); g.rect(x - 3 * s, y - 12 * s, 6 * s, 12 * s); g.fill(); g.stroke(); g.fillStyle = '#9a4a30'; g.beginPath(); g.moveTo(x - 4 * s, y - 12 * s); g.lineTo(x, y - 18 * s); g.lineTo(x + 4 * s, y - 12 * s); g.closePath(); g.fill(); g.stroke(); };
    const field = (x, y) => { const w = 12 + R() * 10, h = 7 + R() * 6, a = (R() - .5) * .5; g.save(); g.translate(x * S, y * S); g.rotate(a); g.fillStyle = R() < .5 ? 'rgba(156,170,86,.32)' : 'rgba(196,160,84,.3)'; g.strokeStyle = 'rgba(100,90,40,.35)'; g.lineWidth = 1; g.fillRect(-w * S / 2, -h * S / 2, w * S, h * S); g.strokeRect(-w * S / 2, -h * S / 2, w * S, h * S);
      g.strokeStyle = 'rgba(100,90,40,.22)'; for (let i = 1; i < 5; i++){ g.beginPath(); g.moveTo(-w * S / 2, (-h / 2 + h * i / 5) * S); g.lineTo(w * S / 2, (-h / 2 + h * i / 5) * S); g.stroke(); } g.restore(); };
    const cloud = (cx, cy, rx, ry, n, d, fn, margin) => { let t = 0, k = 0; while (k < n && t++ < n * 40){ const a = R() * TAU, r = Math.sqrt(R()); if (put(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, d, fn, margin)) k++; } };
    const along = (pts, wA, wB, n, d, fn, tfn) => { let t = 0, k = 0; while (k < n && t++ < n * 60){ const u = R() * (pts.length - 1), i = Math.floor(u), f = u - i, a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], w = (wA + (wB - wA) * (u / (pts.length - 1))) * (tfn ? tfn(R()) : 1);
      if (put(a[0] + (b[0] - a[0]) * f + (R() - .5) * 2 * w, a[1] + (b[1] - a[1]) * f + (R() - .5) * 8, d, fn, 1)) k++; } };
    // the central spine: a long ridge widening to the south, with foothills either side
    const SPINE = [[592,128],[598,200],[586,270],[580,340],[560,395],[540,436]];
    along(SPINE, 14, 62, 85, 8.5, (x, y) => peak(x, y), v => Math.pow(v, .7));
    along(SPINE, 30, 100, 60, 9, (x, y) => hill(x, y), v => .6 + v * .5);
    along(SPINE, 40, 110, 40, 9, (x, y) => pine(x, y), v => .7 + v * .4);
    // other highlands
    along([[190,196],[196,230],[178,262],[162,282]], 12, 16, 16, 9, (x, y) => peak(x, y, .8));
    along([[846,200],[852,250],[858,292]], 12, 20, 24, 8, (x, y) => peak(x, y, .85));
    along([[846,200],[852,250],[858,292]], 30, 36, 14, 9, (x, y) => hill(x, y));
    along([[348,28],[400,40],[460,38],[500,34]], 16, 14, 9, 10, (x, y) => hill(x, y));
    along([[352,32],[420,30],[490,30]], 14, 14, 8, 9, (x, y) => peak(x, y, .7));
    along([[570,590],[610,578],[640,594]], 16, 14, 7, 10, (x, y) => hill(x, y));
    along([[160,432],[216,440],[260,480]], 20, 20, 6, 12, (x, y) => rock(x, y));
    along([[120,470],[160,520],[230,560]], 20, 26, 5, 14, (x, y) => rock(x, y));
    // forests, each its own mix
    cloud(147, 365, 46, 40, 120, 7.2, (x, y) => R() < .22 ? pine(x, y) : oak(x, y));                   // Zenbos wood
    cloud(358, 402, 52, 56, 175, 7, (x, y) => R() < .25 ? pine(x, y) : R() < .2 ? poplar(x, y) : oak(x, y)); // the Qloria Forest
    cloud(630, 245, 46, 70, 130, 7.2, (x, y) => R() < .15 ? palm(x, y) : oak(x, y, true));            // the Forgotten Jungle
    cloud(172, 200, 30, 22, 28, 8, (x, y) => R() < .5 ? pine(x, y) : oak(x, y));                       // Hucknall wood
    cloud(420, 235, 40, 38, 20, 11, (x, y) => R() < .5 ? poplar(x, y) : oak(x, y));                    // plains groves
    cloud(450, 330, 38, 30, 16, 12, (x, y) => R() < .4 ? pine(x, y) : oak(x, y));
    cloud(660, 420, 28, 20, 10, 11, (x, y) => R() < .6 ? pine(x, y) : oak(x, y));
    cloud(800, 150, 42, 40, 36, 8, (x, y) => R() < .5 ? pine(x, y) : oak(x, y));                       // Eastern Lands woods
    cloud(840, 330, 40, 20, 20, 9, (x, y) => R() < .4 ? pine(x, y) : oak(x, y));
    cloud(800, 255, 24, 24, 12, 10, (x, y) => R() < .5 ? poplar(x, y) : oak(x, y));
    cloud(420, 40, 80, 20, 12, 9, (x, y) => pine(x, y));                                               // the Isles
    cloud(605, 600, 40, 30, 22, 8, (x, y) => R() < .6 ? pine(x, y) : oak(x, y));                       // southern island
    cloud(302, 142, 30, 14, 8, 10, (x, y) => oak(x, y));
    // swamp
    cloud(605, 462, 56, 32, 26, 14, (x, y) => R() < .6 ? reed(x, y) : dead(x, y), 3);
    // desert
    cloud(178, 500, 74, 62, 70, 15, (x, y) => dune(x, y));
    cloud(160, 520, 60, 50, 5, 30, (x, y) => palm(x, y), 5);
    // plains: grass, a few hills, fields round the old heartlands
    cloud(440, 270, 70, 90, 70, 12, (x, y) => tuft(x, y));
    cloud(300, 220, 36, 40, 40, 11, (x, y) => tuft(x, y));
    cloud(440, 320, 40, 30, 25, 11, (x, y) => tuft(x, y));
    cloud(690, 380, 80, 40, 30, 13, (x, y) => tuft(x, y));
    cloud(500, 460, 60, 30, 20, 13, (x, y) => tuft(x, y));
    cloud(880, 130, 40, 40, 20, 12, (x, y) => tuft(x, y));
    cloud(412, 275, 28, 30, 3, 20, (x, y) => hill(x, y));
    cloud(300, 215, 30, 30, 3, 22, (x, y) => hill(x, y));
    cloud(690, 400, 70, 30, 4, 28, (x, y) => hill(x, y));
    cloud(870, 140, 40, 40, 3, 24, (x, y) => hill(x, y));
    cloud(440, 40, 70, 18, 1, 40, (x, y) => tower(x, y), 4);
    // fields
    for (const [fx, fy] of [[285,200],[300,218],[240,210],[330,150],[395,215],[420,250],[455,230],[510,290],[460,420],[420,445],[740,395],[780,415],[690,490]]) if (inLand(fx * S, fy * S, 3) && !nearPlace(fx, fy)) stamps.push([fy - 5, () => field(fx, fy)]);
    stamps.sort((a, b) => a[0] - b[0]).forEach(s => s[1]());
    /* the World Temple on Mendor */
    { const x = 262 * S, y = 330 * S, s = S / 2.5 * 1.8; g.fillStyle = '#efe6cf'; g.strokeStyle = '#3d2f1e'; g.lineWidth = 1.6; for (const [dx, h] of [[-14, 26], [-5, 38], [5, 32], [14, 22]]){ g.beginPath(); g.rect(x + dx * s - 3 * s, y - h * s, 6 * s, h * s); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x + dx * s - 3.6 * s, y - h * s); g.lineTo(x + dx * s, y - (h + 8) * s); g.lineTo(x + dx * s + 3.6 * s, y - h * s); g.closePath(); g.fillStyle = '#b55a3a'; g.fill(); g.stroke(); g.fillStyle = '#efe6cf'; } }
    g.restore();
    /* 5. flourishes over the sea */
    const ship = (x, y, s) => { g.save(); g.translate(x * S, y * S); g.scale(s * S / 2.5, s * S / 2.5); g.strokeStyle = '#3d2f1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, 14, 26, 0); g.lineTo(20, -4); g.lineTo(-20, -4); g.closePath(); g.fillStyle = '#7a4a2a'; g.fill(); g.stroke();
      g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(-2, -6); g.lineTo(-2, -40); g.quadraticCurveTo(18, -26, 16, -8); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-2, -6); g.lineTo(-2, -42); g.stroke(); g.restore(); };
    ship(352, 574, 1.4); ship(470, 360 + 130, .9); ship(60, 150, .9);
    const compass = (x, y, r) => { g.save(); g.translate(x * S, y * S); r *= S / 2.5; g.strokeStyle = '#3d2f1e'; g.lineWidth = 2; g.fillStyle = 'rgba(239,227,196,.85)'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(0, 0, r * .72, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++){ const a = i * TAU / 8 - Math.PI / 2, L = i % 2 ? r * .62 : r * 1.25; g.fillStyle = i % 2 ? '#8a6d3a' : (i === 0 ? '#8a1a1a' : '#3d2f1e'); g.beginPath(); g.moveTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + .26) * r * .2, Math.sin(a + .26) * r * .2); g.lineTo(Math.cos(a - .26) * r * .2, Math.sin(a - .26) * r * .2); g.closePath(); g.fill(); }
      g.fillStyle = '#3d2f1e'; g.font = 'bold ' + (r * .42) + 'px Georgia'; g.textAlign = 'center'; g.fillText('N', 0, -r * 1.35); g.restore(); };
    compass(880, 598, 38);
    g.save(); g.fillStyle = '#3d2f1e'; g.textAlign = 'center'; g.font = 'italic bold ' + (33 * S / 2.5) + 'px Georgia'; g.shadowColor = 'rgba(255,245,215,.6)'; g.shadowBlur = 8; g.fillText('The Known World of Arcadia', 400 * S, 102 * S);
    g.shadowBlur = 0; g.strokeStyle = 'rgba(61,47,30,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(270 * S, 114 * S); g.lineTo(530 * S, 114 * S); g.stroke(); g.restore();
    /* 6. paper over everything: fibre, then vignette and frame */
    for (let i = 0; i < 7000; i++){ const x = R() * W, y = R() * H, a = R() * TAU, l = 5 + R() * 14; g.strokeStyle = R() < .5 ? 'rgba(90,65,30,.05)' : 'rgba(255,248,225,.07)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(70,45,15,.38)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#4a3b2a'; g.lineWidth = 7; g.strokeRect(10, 10, W - 20, H - 20); g.lineWidth = 2; g.strokeRect(24, 24, W - 48, H - 48);
    BASE = cv; return cv;
  };

  /* ---- labels and markers (three levels) ---- */
  const P1 = /capital|city|^port town$/;                       // always named on the whole-map view
  const FIRST = {takeisu: 1, ogaki: 1, mobashi: 1, valeka: 1, mercias: 1, levoria: 1, 'dunmorrow-keep': 1, kosmos: 0, kalloon: 1, varnholt: 1};
  const AREAKIND = /region|range|jungle|forest|swamp|desert|islands|continent/;
  const lvlOf = p => AREAKIND.test(p.kind) ? 0 : (P1.test(p.kind) || FIRST[p.id]) ? 1 : /town|fortress|fort|keep|province|march|settlement/.test(p.kind) ? 2 : 3;
  M.places = places;
  M.level = z => z < 1.9 ? 1 : z < 3.2 ? 2 : 3;

  /* ---- the full-screen viewer ---- */
  let ov = null, cvs = null;
  M.fit = () => { const w = innerWidth, h = innerHeight; return Math.min(w / M.W, h / M.H); };
  M.toScreen = (x, y) => { const v = M.view, k = M.fit() * v.z; return [innerWidth / 2 + (x - v.cx) * k, innerHeight / 2 + (y - v.cy) * k]; };
  M.draw = function(){
    if (!ov) return; M.clamp(); const w = innerWidth, h = innerHeight, d = Math.min(devicePixelRatio || 1, 2);
    if (cvs.width !== Math.round(w * d) || cvs.height !== Math.round(h * d)){ cvs.width = Math.round(w * d); cvs.height = Math.round(h * d); cvs.style.width = w + 'px'; cvs.style.height = h + 'px'; }
    const g = cvs.getContext('2d'), v = M.view, k = M.fit() * v.z, b = M.base();
    g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#1c130a'; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high';
    g.drawImage(b, w / 2 - v.cx * k, h / 2 - v.cy * k, M.W * k, M.H * k);
    const lv = M.level(v.z), used = [];
    const text = (s, x, y, size, col, ital, track) => { g.font = (ital ? 'italic ' : '') + 'bold ' + size + 'px Georgia'; g.textAlign = 'center'; if (track && 'letterSpacing' in g) g.letterSpacing = track + 'px'; const m = g.measureText(s).width; const box = [x - m / 2 - 3, y - size, x + m / 2 + 3, y + 4];
      for (const u of used) if (box[0] < u[2] && box[2] > u[0] && box[1] < u[3] && box[3] > u[1]) { if ('letterSpacing' in g) g.letterSpacing = '0px'; return false; }
      used.push(box); g.lineJoin = 'round'; g.lineWidth = size / 4; g.strokeStyle = 'rgba(244,234,205,.85)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); if ('letterSpacing' in g) g.letterSpacing = '0px'; return true; };
    const fs = Math.max(14, Math.min(34, 17 * Math.sqrt(v.z) * M.fit() * 1.15));
    const rg = [['EMPIRE', 225, 185, '#7a2a1a'], ['ELVES', 358, 340, '#2f5a28'], ['FREELANDS', 596, 505, '#2a3f78'], ['THE EASTERN LANDS', 846, 120, '#5a4a2a'], ['GREAT DESERT', 178, 540, '#7a5a2a'], ['THE ISLES', 420, 55, '#4a4a3a']];
    for (const r of rg){ const [sx, sy] = M.toScreen(r[1], r[2]); text(r[0], sx, sy, r[0] === 'THE ISLES' ? Math.max(14, fs * .8) : fs, r[3], true, 4); }
    const pl = M.places().slice().sort((a, b) => lvlOf(a) - lvlOf(b));
    const dots = [], names = [];
    for (const p of pl){ const L = lvlOf(p), [sx, sy] = M.toScreen(p.x * M.W / 100, p.y * M.H / 100); if (sx < -40 || sy < -20 || sx > w + 40 || sy > h + 20) continue;
      if (L === 0){ if (lv >= 2 && p.id !== 'islands' && p.id !== 'eastern-lands' && p.id !== 'great-desert') names.push([p.name, sx, sy, Math.max(14, 12 + 2 * Math.min(v.z, 3)), '#5a4a2a', true, 0]); continue; }
      if (L > lv) continue; dots.push([sx, sy, L, p]); names.push([p.name, sx, sy - 9, 14, '#2a1c0c', false, 0]); }
    { const [cx, cy] = M.toScreen(M.camp.x, M.camp.y), nm = (typeof META !== 'undefined' && META && META.chapterName) || 'Your camp', sc = Math.max(.8, Math.min(1.6, v.z * .6 + .5));
      text(nm, cx, cy + 22 * sc, 14, '#6a1a10', true, 0);
      g.save(); g.translate(cx, cy); g.scale(sc, sc); g.fillStyle = '#8a1f14'; g.strokeStyle = '#2a1c0c'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-11, 9); g.lineTo(0, -10); g.lineTo(11, 9); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#2a1c0c'; g.beginPath(); g.moveTo(-3, 9); g.lineTo(0, 0); g.lineTo(3, 9); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -19); g.stroke(); g.fillStyle = '#e8c04a'; g.beginPath(); g.moveTo(0, -19); g.lineTo(8, -16); g.lineTo(0, -13); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    for (const dd of dots){ const [sx, sy, L] = dd; g.fillStyle = '#2a1c0c'; g.strokeStyle = '#f4eacd'; g.lineWidth = 2;
      if (L === 1){ g.beginPath(); g.rect(sx - 4.5, sy - 4.5, 9, 9); g.stroke(); g.fill(); } else { g.beginPath(); g.arc(sx, sy, 3.6, 0, TAU); g.stroke(); g.fill(); }
      if (M.seen(dd[3].id)){ g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(sx, sy, 1.8, 0, TAU); g.fill(); }
      if (M.sel === dd[3]){ g.strokeStyle = '#c0392b'; g.lineWidth = 2.5; g.beginPath(); g.arc(sx, sy, 11, 0, TAU); g.stroke(); } }
    for (const n of names) text(n[0], n[1], n[2], n[3], n[4], n[5], n[6]);
    g.fillStyle = 'rgba(30,20,10,.75)'; g.fillRect(0, 0, w, 34); g.fillStyle = '#efe3c8'; g.font = '15px Georgia'; g.textAlign = 'left'; g.fillText('Arcadia', 14, 22); g.textAlign = 'right'; g.fillText('Drag or WASD to move, wheel or +/- to zoom, Home for camp, Esc to close', w - 14, 22);
  };
  /* ---- 32.2 pan and zoom: drag, WASD/arrows, wheel, +/-, pinch; Home re-centres on the camp; the view stays on the sheet ---- */
  Object.defineProperty(M, 'camp', {get(){ const k = places().find(p => p.id === 'kalloon'); return k ? {x: k.x * M.W / 100 - 26, y: k.y * M.H / 100 - 13} : {x: 735, y: 432}; }});   // 26 units west and 13 north of Kalloon, so it follows the port if its coordinates change;                              // Patrick's ruling: the camp stands on the Freelands frontier, a short way inland (west) of Kalloon (about 76.5%, 61.8% of the sheet)
  Object.defineProperty(M, 'home', {get(){ return {x: M.camp.x, y: M.camp.y, z: 2.6}; }});
  M.clamp = function(){
    const v = M.view, w = innerWidth, h = innerHeight, k0 = M.fit(); v.z = Math.max(1, Math.min(7, v.z));
    const hw = w / (2 * k0 * v.z), hh = h / (2 * k0 * v.z);
    v.cx = hw >= M.W / 2 ? M.W / 2 : Math.max(hw, Math.min(M.W - hw, v.cx)); v.cy = hh >= M.H / 2 ? M.H / 2 : Math.max(hh, Math.min(M.H - hh, v.cy)); };
  M.zoomAt = function(f, sx, sy){
    const v = M.view, w = innerWidth, h = innerHeight; if (sx == null){ sx = w / 2; sy = h / 2; }
    const k = M.fit() * v.z, wx = v.cx + (sx - w / 2) / k, wy = v.cy + (sy - h / 2) / k; v.z = Math.max(1, Math.min(7, v.z * f));
    const k2 = M.fit() * v.z; v.cx = wx - (sx - w / 2) / k2; v.cy = wy - (sy - h / 2) / k2; M.clamp(); M.draw(); };
  M.goHome = function(){ M.view = {cx: M.home.x, cy: M.home.y, z: M.home.z}; M.clamp(); M.draw(); };
  const held = {}; let raf = 0, last = 0;
  function tick(t){ raf = 0; if (!ov || ov.style.display === 'none') return; const dt = Math.min(50, t - (last || t)); last = t; const v = M.view, k = M.fit() * v.z;
    const dx = (held.d || held.arrowright ? 1 : 0) - (held.a || held.arrowleft ? 1 : 0), dy = (held.s || held.arrowdown ? 1 : 0) - (held.w || held.arrowup ? 1 : 0), dz = (held['+'] || held['='] ? 1 : 0) - (held['-'] || held._ ? 1 : 0);
    if (dx || dy || dz){ v.cx += dx * dt * .6 / k; v.cy += dy * dt * .6 / k; if (dz) v.z *= Math.pow(1.0022, dz * dt); M.clamp(); M.draw(); raf = requestAnimationFrame(tick); } else last = 0; }
  const poke = () => { if (!raf) raf = requestAnimationFrame(tick); };
  function canOpen(){ try { if (typeof G !== 'undefined' && G) return false; if (typeof inStory === 'function' && inStory()) return false; if (typeof inStoryNow === 'function' && inStoryNow()) return false; return true; } catch (e) { return false; } }
  M.canOpen = canOpen;
  M.open = function(view){
    if (view) M.view = Object.assign({cx: 480.5, cy: 349.5, z: 1}, view);
    if (!ov){ ov = document.createElement('div'); ov.id = 'm32'; ov.style.cssText = 'position:fixed;inset:0;z-index:9500;background:#1c130a;touch-action:none;user-select:none'; cvs = document.createElement('canvas'); cvs.style.cssText = 'display:block;cursor:grab'; ov.appendChild(cvs);
      const mkb = (t, css, fn, title) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.title = title || t; x.className = 'btn small'; x.style.cssText = 'position:absolute;' + css; x.onclick = ev => { ev.stopPropagation(); fn(); }; ov.appendChild(x); return x; };
      mkb('Close', 'left:80px;top:3px', M.close); mkb('+', 'right:14px;bottom:100px;width:38px;height:38px;font-size:22px', () => M.zoomAt(1.4), 'Zoom in (+)'); mkb('−', 'right:14px;bottom:56px;width:38px;height:38px;font-size:22px', () => M.zoomAt(1 / 1.4), 'Zoom out (-)'); mkb('Home', 'right:14px;bottom:14px;width:auto;min-width:38px;padding:0 8px;height:38px;font-size:14px', M.goHome, 'Back to the camp (Home)');
      document.body.appendChild(ov);
      addEventListener('resize', () => { if (ov.style.display !== 'none'){ M.clamp(); M.draw(); } });
      const ptrs = new Map(); let drag = null, pinch = 0;
      cvs.addEventListener('pointerdown', e => { cvs.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = {x: e.clientX, y: e.clientY, moved: 0}; if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } cvs.style.cursor = 'grabbing'; });
      cvs.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const old = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptrs.size === 2){ const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) M.zoomAt(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; if (drag) drag.moved = 99; return; }
        const k = M.fit() * M.view.z; M.view.cx -= (e.clientX - old[0]) / k; M.view.cy -= (e.clientY - old[1]) / k; if (drag) drag.moved += Math.abs(e.clientX - old[0]) + Math.abs(e.clientY - old[1]); M.clamp(); M.draw(); });
      const up = e => { const wasClick = drag && drag.moved < 5 && ptrs.size === 1; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0; cvs.style.cursor = 'grab'; if (wasClick && M.onClick) M.onClick(e.clientX, e.clientY); if (!ptrs.size) drag = null; };
      cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
      cvs.addEventListener('wheel', e => { e.preventDefault(); M.zoomAt(Math.exp(-e.deltaY * .0016), e.clientX, e.clientY); }, {passive: false}); }
    ov.style.display = 'block'; M.clamp(); M.draw(); };
  M.close = function(){ if (ov) ov.style.display = 'none'; for (const k in held) delete held[k]; };
  M.isOpen = () => !!ov && ov.style.display !== 'none';
  /* keys: registered at parse time so J reaches us before the old campaign map; while open no key reaches the game */
  addEventListener('keydown', e => {
    const key = (e.key || '').toLowerCase(), typing = e.target && /^(input|textarea|select)$/i.test(e.target.tagName || '');
    if (M.isOpen()){ e.stopImmediatePropagation(); if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (key === 'escape' || key === 'j'){ e.preventDefault(); M.close(); return; }
      if (key === 'home'){ e.preventDefault(); M.goHome(); return; }
      if (/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright|\+|=|-|_)$/.test(key)){ e.preventDefault(); held[key] = 1; poke(); } return; }
    if (key !== 'j' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing || !canOpen()) return;
    e.preventDefault(); e.stopImmediatePropagation(); M.open(); }, true);
  addEventListener('keyup', e => { const key = (e.key || '').toLowerCase(); if (M.isOpen()){ e.stopImmediatePropagation(); delete held[key]; } }, true);
  /* the War Table button and any caller of C31.map land here too (the old map stays as the fallback when the map cannot open) */
  addEventListener('load', () => setTimeout(() => { try { if (window.CAMP31 && !CAMP31._map32){ const old = CAMP31.map; CAMP31.map = function(){ if (canOpen()) M.open(); else if (old) old(); }; CAMP31._map32 = 1; } } catch (e) {} }, 50));
  /* ---- 32.3 click a place: a card with the Loremaster's line and paragraph, the board contracts there, and "Fought here" ----
     META.mapSeen[placeId] = contracts worked there (counted when a contract starts; nearest place to c.mapAt). */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const px = p => [p.x * M.W / 100, p.y * M.H / 100];
  M.nearest = function(pct){       // pct = [x%, y%] on the sheet -> nearest real place (areas and regions do not count)
    let best = null, bd = 1e9; for (const p of places()){ if (AREAKIND.test(p.kind)) continue; const dx = (p.x - pct[0]) * M.W / 100, dy = (p.y - pct[1]) * M.H / 100, d = dx * dx + dy * dy; if (d < bd){ bd = d; best = p; } } return best; };
  M.seen = function(id){ try { return (META.mapSeen && META.mapSeen[id]) | 0; } catch (e) { return 0; } };
  M.stamp = function(c){ try { if (!c || !Array.isArray(c.mapAt) || typeof META === 'undefined') return; const p = M.nearest(c.mapAt); if (!p) return; META.mapSeen = META.mapSeen || {}; META.mapSeen[p.id] = (META.mapSeen[p.id] | 0) + 1; } catch (e) {} };
  M.boardAt = function(p){ try { const out = []; ((typeof META !== 'undefined' && META && META.board) || []).forEach((c, i) => { if (c && Array.isArray(c.mapAt) && M.nearest(c.mapAt) === p) out.push({c, i}); }); return out; } catch (e) { return []; } };
  M.cardHTML = function(p){
    if (p === 'camp'){ const nm = (typeof META !== 'undefined' && META && META.chapterName) || 'Your camp'; return '<h3>' + esc(nm) + '</h3><div class="m32k">The company’s camp</div><p class="m32l">On the frontier of Artemis\u2019s lands, a short way inland from the Ford.</p>'; }
    const n = M.seen(p.id), fl = (window.STORY && STORY.foughtHereLine) ? STORY.foughtHereLine({id: p.id, name: p.name, kind: p.kind}, n) : (n ? 'The company has worked here ' + n + ' time' + (n > 1 ? 's' : '') + '.' : 'The company has not worked here yet.');
    const bd = M.boardAt(p), name = c => (typeof OBJECTIVES !== 'undefined' && OBJECTIVES[c.obj] && OBJECTIVES[c.obj].name) || c.obj || 'Contract';
    return '<h3>' + esc(p.name) + '</h3><div class="m32k">' + esc(p.kind) + (p.region ? ' · ' + esc(p.region) : '') + '</div>' + (p.holder ? '<div class="m32h"><b>Held by:</b> ' + esc(p.holder) + '</div>' : '') +
      (p.line ? '<p class="m32l">' + esc(p.line) + '</p>' : '') + (p.text ? '<p>' + esc(p.text) + '</p>' : '') +
      (bd.length ? '<div class="m32b"><b>On the board here:</b>' + bd.map(o => '<div>' + esc(name(o.c)) + (o.c.pay != null ? ' · ' + o.c.pay + 'gp' : '') + '</div>').join('') + '</div>' : '') +
      '<div class="m32f">' + (n ? '<b>Fought here:</b> ' + n + ' contract' + (n > 1 ? 's' : '') + '. ' : '') + esc(fl) + '</div>';
  };
  M.sel = null;
  M.select = function(p){
    M.sel = p; let c = document.getElementById('m32-card'); if (!c){ const st = document.createElement('style'); st.textContent = '#m32-card{position:absolute;right:14px;top:44px;width:min(340px,calc(100% - 28px));max-height:calc(100% - 170px);overflow:auto;background:#f6edd6;color:#2a2218;border:2px solid #8a6d3a;border-radius:6px;padding:10px 14px;font:14px/1.45 Georgia;font-variant-numeric:lining-nums;box-shadow:0 4px 18px rgba(0,0,0,.5)}#m32-card h3{margin:0 0 2px;font-size:19px}#m32-card .m32k{font-size:14px;opacity:.75;text-transform:capitalize;margin-bottom:6px}#m32-card p{margin:6px 0}#m32-card .m32l{font-style:italic}#m32-card .m32b,#m32-card .m32f,#m32-card .m32h{margin-top:7px;padding-top:6px;border-top:1px solid #c9b37c}#m32-card .m32x{position:absolute;right:6px;top:4px;cursor:pointer;font-size:18px;background:none;border:0;color:#5a4a2a}'; document.head.appendChild(st);
      c = document.createElement('div'); c.id = 'm32-card'; ov.appendChild(c); c.addEventListener('pointerdown', e => e.stopPropagation()); c.addEventListener('wheel', e => e.stopPropagation()); }
    if (!p){ c.style.display = 'none'; M.draw(); return; }
    c.innerHTML = '<button type="button" class="m32x" aria-label="Close card">×</button>' + M.cardHTML(p); c.querySelector('.m32x').onclick = () => M.select(null); c.style.display = 'block'; c.scrollTop = 0; M.draw(); };
  M.onClick = function(sx, sy){
    const [cx, cy] = M.toScreen(M.camp.x, M.camp.y); if (Math.hypot(sx - cx, sy - cy) < 22){ M.select('camp'); return; }
    let best = null, bd = 26; for (const p of places()){ if (AREAKIND.test(p.kind)) continue; const [x, y] = M.toScreen(...px(p)), d = Math.hypot(x - sx, y - sy); if (d < bd){ bd = d; best = p; } }
    M.select(best); };
  try { if (typeof startDeployment === 'function' && !window.__m32sd){ window.__m32sd = 1; const old = startDeployment; startDeployment = function(c){ M.stamp(c); return old.apply(this, arguments); }; } } catch (e) {}
  M.selfTest = function(){
    const fails = [], ck = (c, m) => { if (!c) fails.push(m); };
    const P = M.places(); ck(P.length >= 38, 'places loaded');
    ck(P.every(p => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100), 'every place lies on the sheet');
    ck(!P.some(p => /^(terios|ban'?ra)$/i.test(p.name) || p.certainty === '?'), 'no Terios, Ban\'Ra or uncertain places');
    ck(new Set(P.map(p => p.id)).size === P.length, 'place ids unique');
    try { ck(P.every(p => M.cardHTML(p).length > 40), 'every place builds a card'); ck(M.cardHTML('camp').indexOf('camp') >= 0, 'camp card'); const bd = (typeof META !== 'undefined' && META && META.board) || []; ck(bd.every(c => !Array.isArray(c.mapAt) || M.nearest(c.mapAt)), 'a board contract does not land on a place'); { const k = P.find(p => p.id === 'kalloon'); ck(!k || M.camp.x < k.x * M.W / 100, 'camp lies west of Kalloon'); } } catch (e) { fails.push('cards threw: ' + e.message); }
    const b = M.base(); ck(b && b.width === Math.round(M.W * M.Q), 'base map built');
    return {ok: !fails.length, fails};
  };
})();
