/* Index STRUCT1: VO-2 world 3D (Fable session "vo2-world", 2026-11-11; docs/vo2-design.md, audits/fable/vo2-world.md).
   WHAT   Every standing thing on the field that is not a figure (stone walls, palisades, hill cliffs, buildings, tents,
          rubble, boulders, trees) rendered through the figures' ray-caster (r3dFrames, the 'world' rig) so it takes
          their shading, materials and style, cached once per kind x variant x season x light; a coloured cast shadow
          per sprite from STRUCT.light. The composer (js/3d/vo2.js) calls build / items / drawShadows; nothing here draws
          on its own, so with VO2 off (or absent) the game is unchanged.
   API    STRUCT.build(map, env)        env = {season, host, time}; walks the map once, renders what it needs
          STRUCT.light = {dir:{x, y}, elev, colour, shadow}   set by the composer before build
          STRUCT.items(cx, cy)         visible [{x, y, img, ax, ay, s, shadow, tall}], baseline y in world px (one reused array)
          STRUCT.drawShadows(ctx, cx, cy)   the cast shadows (multiply, coloured), after the ground, before anything standing
          STRUCT.invalidate()          forget everything (new map, season, light)
          STRUCT.selfTest()            {pass, fail, details, ok}
          STRUCT.sheet()               a canvas with one of every kind and variant (audits/fable/vo2/structures.png)
          STRUCT.lightVec()            the 3D light vector the sprites were shaded with (for the figures, if the composer wants one light)
   KNOBS  STRUCT.K.* (heights in screen px, shadow alpha and length, trunk and canopy sizes); STRUCT.trees (false: leave trees to the old drawer)
   ROLLBACK remove the script tag (or STRUCT.invalidate() and never call build).
   GEOMETRY parts are in the ray-caster's model units with y up and z toward the viewer; 1 unit = 1 screen pixel across,
          a cell (40 px) is 40 units wide and 40 / sin(PITCH) = 80.5 units deep; the baseline (y = 0, z = 0) is the cell's
          near edge. A wall cell's frame is clipped to exactly the cell's width so stones straddling the edge continue. */
(function(){
  'use strict';
  const S = window.STRUCT = {
    light: {dir:{x:-0.45, y:0.85}, elev:0.8, colour:'#fff1d0', shadow:'#4a5670'},
    trees: true,
    K: {wallH:40, palH:33, cliffH:17, houseWall:34, roofH:30, tentH:30, shadowA:0.62, shadowMin:0.22, shadowMax:1.5,
        oakH:110, pineH:135, birchH:100, deadH:80, hillBoulder:14, hillRubble:1, roofSplit:1, pad:12, leafNoise:0.34, leafPit:0.16, leafScale:3.2},
    cache:{}, list:[], vis:[], built:null, stats:{ms:0, sprites:0, items:0}
  };
  const CELLW = () => (typeof CELL === 'number' ? CELL : 40);
  const PITCH = () => (typeof R3D !== 'undefined' && R3D.PITCH) || 0.52;
  const ct = () => Math.cos(PITCH()), st = () => Math.sin(PITCH());
  const U = () => 1 / ct();          // model units per screen px of height
  const D = () => 1 / st();          // model units per screen px of depth
  const TT = () => (typeof T !== 'undefined' ? T : {GRASS:0, FOREST:1, STONE:2, WATER:3, HILL:4, ROAD:5, FLOOR:6, PALISADE:7, ROOF:8, TENT:9, RUBBLE:10, WALL:11, WAGON:12, GATE:13});

  /* ---- hashing and small helpers ---- */
  function hsh(x, y, seed){ let h = Math.imul(x * 374761393 + y * 668265263 ^ (seed || 7) * 2246822519, 1274126177); h ^= h >>> 13; return Math.imul(h, 1103515245) >>> 0; }
  function rng(seed){ let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  const mix = (a, b, k) => { const x = hx(a), y = hx(b); return '#' + x.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (y[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
  const hx = h => { const n = parseInt(String(h || '#888888').slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const dim = (h, k) => mix(h, '#000000', k);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  /* ---- palette: the art-direction grim base, tinted by season where the world palette has a say ---- */
  function pal(se){
    const P = (typeof W3D_PAL !== 'undefined' && W3D_PAL[se]) || {};
    const leaf = P.leaf || '#3e6a2e', leafD = P.leafD || '#2e5222', leafL = P.leafL || '#4e7a34';
    const winter = se === 'winter', autumn = se === 'autumn';
    return {
      st:'#7a746a', stD:'#575149', stL:'#968f84', stT:'#6b665d', mortT:'#3a3530', mort:'#2e2a26', wet:'#4d4a48', moss: winter ? '#55604a' : '#4a6630', snow:'#e6eaee',
      log:'#6a5236', logD:'#4a3824', logL:'#86684a', bark:'#3a2a1c', barkD:'#241810', barkL:'#54402c', birch:'#d6d0c2', birchD:'#2a2420',
      leaf, leafD, leafL, pine: winter ? '#2c4228' : '#2e4a2a', pineL: winter ? '#3c5438' : '#3e6236', pineD:'#1e301c',
      canvas:'#8d7e60', canvasD:'#6a5c42', canvasR:'#6a3330', canvasG:'#5f6a4e', dark:'#15100c',
      plaster:'#bfb094', plank:'#5a4634', timber:'#3a2a18', door:'#2e1f12', win:'#1a1612',
      thatch: autumn ? '#8a6a36' : '#8a7442', thatchD:'#5e4c2a', tile:'#7a3a2c', tileD:'#5a2a20', slate:'#3c4048', slateL:'#555a64',
      cliff: P.cliff ? mix(P.cliff, '#5a4a38', 0.55) : '#5e4e3c', earth:'#4a3a2a', grass: P.grass || '#626a36', ash:'#4c4844', char:'#1c1612'
    };
  }
  const MATS = {st:'stone', stD:'stone', stL:'stone', stT:'stone', mortT:'stone', mort:'stone', wet:'leather', moss:'cloth', snow:'cloth', log:'wood', logD:'wood', logL:'wood',
    bark:'wood', barkD:'wood', barkL:'wood', birch:'wood', birchD:'wood', leaf:'cloth', leafD:'cloth', leafL:'cloth', pine:'cloth', pineL:'cloth', pineD:'cloth',
    canvas:'cloth', canvasD:'cloth', canvasR:'cloth', canvasG:'cloth', dark:'cloth', plaster:'stone', plank:'wood', timber:'wood', door:'wood', win:'glass',
    thatch:'cloth', thatchD:'cloth', tile:'stone', tileD:'stone', slate:'stone', slateL:'stone', cliff:'stone', earth:'cloth', grass:'cloth', ash:'cloth', char:'wood'};

  /* ---- the light: the composer's STRUCT.light folded into the engine's own vector while STRUCT renders ---- */
  S.lightVec = function(){
    const L = S.light || {}, d = L.dir || {x:-0.45, y:0.85}, e = L.elev === undefined ? 0.8 : L.elev;
    const v = [-d.x * 0.6, 0.55 + 0.45 * e, 0.45], n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / n, v[1] / n, v[2] / n];
  };
  function withLight(fn){
    if (typeof R3D_LIGHT === 'undefined') return fn();
    const was = [R3D_LIGHT[0], R3D_LIGHT[1], R3D_LIGHT[2]], v = S.lightVec();
    R3D_LIGHT[0] = v[0]; R3D_LIGHT[1] = v[1]; R3D_LIGHT[2] = v[2];
    try { return fn(); } finally { R3D_LIGHT[0] = was[0]; R3D_LIGHT[1] = was[1]; R3D_LIGHT[2] = was[2]; }
  }
  const lightKey = () => { const L = S.light || {}, d = L.dir || {}; return [d.x, d.y, L.elev, L.shadow].map(v => String(v)).join(','); };
  const shadowLen = () => { const e = Math.max(0.05, Math.min(1, (S.light && S.light.elev) || 0.8)); return Math.max(S.K.shadowMin, Math.min(S.K.shadowMax, 0.9 * (1 - e) / e)); };

  /* ---- recipe helpers (model units; y up, z toward the viewer) ---- */
  const box = (z, c, r, rot) => rot ? {b:'root', t:'box', c, r, rot, z} : {b:'root', t:'box', c, r, z};
  const ell = (z, c, r, rot) => rot ? {b:'root', t:'ell', c, r:Array.isArray(r) ? r : [r, r, r], rot, z} : {b:'root', t:'ell', c, r:Array.isArray(r) ? r : [r, r, r], z};
  const cyl = (z, a, p, r) => ({b:'root', t:'cyl', a, p, r, z});
  const cap = (z, a, p, r) => ({b:'root', t:'cap', a, p, r, z});
  const cone = (z, a, p, r, r2) => ({b:'root', t:'cone', a, p, r, r2, z});
  // frame from the parts: screen extents, with pad (or an exact width when clipped to a cell)
  function fit(parts, o){
    const c = ct(), s = st(), pad = o && o.pad !== undefined ? o.pad : S.K.pad;
    let half = 0, up = 0, down = 0;
    const pt = (p, R) => { half = Math.max(half, Math.abs(p[0]) + R); const sy = -p[1] * c + p[2] * s; up = Math.max(up, -(sy - R)); down = Math.max(down, sy + R); };
    for (const q of parts){
      const R = Array.isArray(q.r) ? (q.t === 'box' ? Math.hypot(q.r[0], q.r[1], q.r[2]) : Math.max(q.r[0], q.r[1], q.r[2])) : Math.max(q.r, q.r2 || 0);
      for (const p of [q.c, q.a, q.p]) if (p) pt(p, R);
    }
    const w = o && o.w ? o.w : Math.ceil(2 * half + 2 * pad), h = Math.ceil(up + Math.max(0, down) + 2 * pad), g = Math.ceil(Math.max(0, down) + pad);
    return typeof wFrame === 'function' ? wFrame(w, h, g) : {W:w * 0.84, H:h * 0.84, FEET:(h - g) * 0.84, CX:w / 2 * 0.84};
  }
  function render(key, parts, zones, frameO){
    const st_ = (typeof R3D_STYLES !== 'undefined' && R3D_STYLES[(typeof r3dStyleId === 'function' && r3dStyleId()) || 'crisp']) || null;
    const frame = fit(parts, frameO), rec = {rig:'world', skel:{order:['root'], bones:{root:{off:[0, 0, 0]}}}, parts, zones, mats:MATS, frame, key:'struct:' + key};
    ZB.buf = null;
    const fr = withLight(() => withZoneCapture(() => r3dFrames(rec, 'still', 2, st_))), img = fr[0], zbuf = ZB.buf; ZB.buf = null;
    try { if (typeof R3D !== 'undefined' && R3D.cache) delete R3D.cache[rec.key + ':' + (st_ ? st_.id : 'crisp')]; } catch (e) {}
    const k = st_ ? st_.res : 0.5, sc = (typeof W3D !== 'undefined' && typeof R3D !== 'undefined') ? W3D.S / R3D.K / k : 1 / (0.84 * k);
    return {img, ax:Math.round(frame.CX * k), ay:Math.round(frame.FEET * k), s:sc, zbuf, st:st_};
  }

  /* ---- shadow sprite: the silhouette skewed along the light, tinted, soft, with a contact ellipse ---- */
  function makeShadow(sp, foot, soft, flat){
    const L = S.light || {}, d = L.dir || {x:-0.45, y:0.85}, len = shadowLen(), s = sp.s, col = L.shadow || '#4a5670';
    const img = sp.img, w = img.width * s, ay = sp.ay * s, ax = sp.ax * s;
    // a point h px above the baseline lands at (x + d.x * len * h, baseline + d.y * len * h)
    const xs = [0 - ax, w - ax, 0 - ax + d.x * len * ay, w - ax + d.x * len * ay], ys = [0, d.y * len * ay];
    const fw = foot ? foot[0] : w * 0.5, fd = foot ? foot[1] : 10;
    const x0 = Math.floor(Math.min(...xs, -fw - 6)), x1 = Math.ceil(Math.max(...xs, fw + 6)), y0 = Math.floor(Math.min(...ys, -fd - 4)), y1 = Math.ceil(Math.max(...ys, fd + 4));
    const c = cv(x1 - x0 + 2, y1 - y0 + 2), g = c.getContext('2d');
    g.save();
    if (soft) g.filter = 'blur(' + soft + 'px)';
    g.setTransform(1, 0, -d.x * len, -d.y * len, -x0, -y0);
    // a flat thing (rubble, a cliff lip, a boulder) lies on the ground: its silhouette is depth, not height, so only the contact shadow
    if (!flat) g.drawImage(img, 0, 0, img.width, sp.ay, -ax, -ay, w, ay);
    g.restore();
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
    const cx = -x0, cy = -y0 - fd * 0.35, rg = g.createRadialGradient(cx, cy, 0, cx, cy, fw + 4);
    const [r, gg, b] = hx(col); rg.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',0.9)'); rg.addColorStop(0.6, 'rgba(' + r + ',' + gg + ',' + b + ',0.45)'); rg.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
    g.save(); g.translate(cx, cy); g.scale(1, Math.max(0.25, (fd + 4) / (fw + 4))); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, fw + 4, 0, Math.PI * 2); g.fill(); g.restore();
    return {img:c, ax:-x0, ay:-y0, s:1};
  }

  /* ---- kinds: each returns {parts, zones, foot:[halfW, depth], tall, frame?, soft?} ---- */
  const KIND = {};
  // stone wall cell. ends: 1 = capped on the west, 2 = capped on the east. Courses straddle the cell edge so the run reads as one.
  KIND.wall = {variants:8, build(v, se, o){
    // o.run: cells in this sprite (1-4; the map cuts horizontal wall runs into sections, each with its own stone layout)
    const P = pal(se), r = rng(hsh(v + 1, 17, 5)), ends = (o && o.ends) || 0, run = (o && o.run) || 1, H = S.K.wallH * U(), Zd = CELLW() * D(), parts = [];
    const HW = CELLW() * run / 2;
    parts.push(box('mort', [0, H / 2, -Zd / 2], [HW - 0.4, H / 2 - 0.4, Zd / 2 - 0.4]));
    const course = 9.5 * U() * (S.K.wallH / 34), n = Math.ceil(H / course);
    for (let i = 0; i < n; i++){
      const y0 = i * course, y1 = Math.min(H, y0 + course), drop = (y1 - y0) * 0.5;
      // a course of random-width stones, started half a stone in on odd courses so the joints stagger
      let x = -HW - ((i & 1) ? 4 + r() * 5 : 0);
      while (x < HW){
        const wd = 7 + r() * 9, a = Math.max(-HW, x), b = Math.min(HW, x + wd); x += wd;
        if (b - a < 2) continue;
        const jit = 0.6 + r() * 2.0, shade = r(), z = shade < 0.22 ? 'stD' : shade > 0.8 ? 'stL' : 'st';
        if (v >= 6 && r() < 0.07) continue;   // a missing stone
        parts.push(box(z, [(a + b) / 2, (y0 + y1) / 2 - 0.2, -0.5], [(b - a) / 2 - 0.8, drop - 0.7, 1.6 + jit], [(r() - 0.5) * 0.05, (r() - 0.5) * 0.08, (r() - 0.5) * 0.04]));
      }
    }
    // the top: a rubble-stone cap, small stones in brick courses, a touch darker than the face so it reads as one mass
    parts.push(box('mortT', [0, H - 0.6, -Zd / 2], [HW - 0.4, 0.5, Zd / 2 - 0.4]));
    const rows = 6, dz = Zd / rows;
    for (let row = 0; row < rows; row++){
      const zc = -Zd + (row + 0.5) * dz;
      let x = -HW - ((row & 1) ? 3 + r() * 4 : 0);
      while (x < HW){
        const wd = 6 + r() * 6, a = Math.max(-HW, x), b = Math.min(HW, x + wd); x += wd;
        if (b - a < 1.5) continue;
        const shade = r(), z = shade < 0.14 ? 'stD' : shade > 0.9 ? 'st' : 'stT';
        parts.push(box(z, [(a + b) / 2, H - 0.2 + r() * 0.5, zc], [(b - a) / 2 - 0.45, 0.8, dz / 2 - 0.45], [(r() - 0.5) * 0.05, 0, (r() - 0.5) * 0.05]));
      }
    }
    // end stones: a run that stops shows a quoin column on that side
    for (const side of [ends & 1 ? -1 : 0, ends & 2 ? 1 : 0]) if (side) for (let i = 0; i < n; i++){ const y0 = i * course, y1 = Math.min(H, y0 + course); parts.push(box(i & 1 ? 'stL' : 'st', [side * (HW - 3.2), (y0 + y1) / 2 - 0.2, -2], [2.6, (y1 - y0) / 2 - 0.6, 2.4])); }
    // weather: moss low on the face and in the top's corners, a wet patch, snow in winter
    for (let i = 0; i < (2 + (v & 3)) * run; i++) parts.push(ell('moss', [-HW + 4 + r() * (2 * HW - 8), 2 + r() * 8 * U(), 0.8], [3 + r() * 4, 2 + r() * 3, 1.2]));
    for (let i = 0; i < (1 + (v & 1)) * run; i++) parts.push(ell('moss', [-HW + 4 + r() * (2 * HW - 8), H + 0.6, -Zd + r() * Zd], [3 + r() * 4, 0.8, (3 + r() * 4) * D() / 1.2]));
    for (let i = 0; i < run; i++) parts.push(ell('wet', [-HW + 10 + r() * (2 * HW - 20), 4 * U(), 1.4], [5 + r() * 4, 3.5, 1.6]));
    if (se === 'winter') for (let i = 0; i < 5 * run; i++) parts.push(ell('snow', [-HW + 4 + r() * (2 * HW - 8), H + 1.4, -Zd + r() * Zd], [5 + r() * 5, 1.3, (4 + r() * 4) * D()]));
    return {parts, zones:P, foot:[HW, 6], tall:true, frame:{w:CELLW() * run, pad:S.K.pad}, clipW:true};
  }};
  KIND.palisade = {variants:3, build(v, se, o){
    const P = pal(se), mask = (o && o.mask) || 0, r = rng(hsh(v + 3, 23, 9)), Zd = CELLW() * D(), parts = [], logs = [];
    const row = (mask & 10) || !(mask & 5), col = !!(mask & 5);
    if (row) for (let x = -20; x <= 20; x += 8) logs.push([x, -Zd / 2]);
    if (col) for (let i = 0; i < 5; i++) logs.push([0, -(i * 8 + 4) * D()]);
    let k = 0;
    for (const [x, z] of logs){
      const h = (S.K.palH - 3 + r() * 6) * U(), broken = v === 1 && (k++ % 4 === 2), top = broken ? h * 0.62 : h, zone = r() < 0.25 ? 'logD' : r() > 0.8 ? 'logL' : 'log';
      parts.push(cyl(zone, [x, 0, z], [x, top, z], 4.1));
      if (!broken) parts.push(cone('logD', [x, top, z], [x, top + 6, z], 4.1, 0.5)); else parts.push(cone('logD', [x + 1, top, z], [x - 1, top + 3, z], 4, 1));
      // bark grain: two dark ridges down the log
      parts.push(cap('logD', [x - 1.6, 1, z + 3.6], [x - 1.9, top - 2, z + 3.5], 0.55));
      parts.push(cap('logD', [x + 2.1, 2, z + 3.3], [x + 1.7, top - 3, z + 3.4], 0.5));
    }
    if (row) parts.push(box('logL', [0, (S.K.palH * 0.55) * U(), -Zd / 2 + 5.5], [20.5, 1.6, 1.3]));
    if (col) parts.push(box('logL', [5.5, (S.K.palH * 0.55) * U(), -Zd / 2], [1.3, 1.6, Zd / 2]));
    return {parts, zones:P, foot:[18, 8], tall:true, frame:{w:CELLW(), pad:S.K.pad}, clipW:true};
  }};
  // hill cliff: the south face of a hill cell; a slab of earth with rock showing and grass over the lip
  KIND.cliff = {variants:3, build(v, se){
    const P = pal(se), r = rng(hsh(v + 5, 31, 13)), H = S.K.cliffH * U(), parts = [];
    parts.push(box('cliff', [0, H / 2, -5], [20, H / 2, 5]));
    for (let i = 0; i < 4 + v; i++){ const x = -17 + r() * 34, y = 2 + r() * (H - 5), rr = 2.5 + r() * 3.5; parts.push(ell(r() < 0.3 ? 'stD' : 'st', [x, y, 0.3 + r() * 1.2], [rr, rr * 0.7, 2.2], [0, 0, r() * 0.6])); }
    for (let i = 0; i < 5; i++){ const x = -20 + r() * 40; parts.push(cap('barkD', [x, H - 1 - r() * 2, 0.6], [x + (r() - 0.5) * 6, H - 6 - r() * 6, 1.2], 0.45)); }
    for (let x = -20; x <= 20; x += 5) parts.push(ell('grass', [x + r() * 2, H + 0.4, -4 + r() * 3], [3.4, 1.2 + r(), 4.5]));
    parts.push(ell('earth', [-8 + r() * 16, 1.2, 1.2], [8, 1.4, 2]));
    return {parts, zones:P, foot:[20, 4], tall:false, frame:{w:CELLW(), pad:S.K.pad}, clipW:true};
  }};
  // building: wCells x dCells of ROOF; walls, timber frame, a door and a window, a pitched roof (tile, thatch, slate by variant)
  KIND.building = {variants:3, build(v, se, o){
    const P = pal(se), wc = (o && o.w) || 3, dc = (o && o.d) || 2, r = rng(hsh(v + 7, wc * 3 + dc, 21)), parts = [];
    const W = wc * CELLW(), Zd = dc * CELLW() * D(), Hw = S.K.houseWall * U(), Hr = S.K.roofH * U(), hw = W / 2 - 2;
    const wallZ = v === 1 ? 'plank' : 'plaster';
    parts.push(box(wallZ, [0, Hw / 2, -Zd / 2], [hw, Hw / 2, Zd / 2 - 1]));
    if (v === 2) for (let y = 0; y < Hw; y += 7) for (let x = -hw + ((y / 7 | 0) & 1 ? 7 : 0); x < hw; x += 14) parts.push(box(r() < 0.25 ? 'stD' : 'st', [Math.min(hw - 7, x + 7), y + 3.4, 0.4], [6.3, 3.0, 1.0]));
    if (v === 1) for (let y = 4; y < Hw; y += 6) parts.push(box('timber', [0, y, 0.6], [hw, 0.35, 0.3]));
    // timber frame on the face: posts, a sill, a top beam, two braces
    const posts = Math.max(2, Math.round(W / 40) + 1);
    for (let i = 0; i < posts; i++){ const x = -hw + 2 + (W - 8) * i / (posts - 1); parts.push(box('timber', [x, Hw / 2, 0.9], [1.5, Hw / 2, 1.2])); }
    parts.push(box('timber', [0, Hw - 1.6, 0.9], [hw, 1.5, 1.2]));
    parts.push(box('timber', [0, 1.4, 0.9], [hw, 1.3, 1.2]));
    parts.push(box('timber', [-hw + 12, Hw * 0.5, 0.8], [1.1, 9, 1], [0, 0, 0.6]));
    parts.push(box('timber', [hw - 12, Hw * 0.5, 0.8], [1.1, 9, 1], [0, 0, -0.6]));
    // door (left of centre) and a window (right)
    const dx = -W / 4 - 2, dh = 24 * U();
    parts.push(box('door', [dx, dh / 2, 1.0], [6, dh / 2, 1.0]));
    parts.push(box('timber', [dx, dh + 1, 1.4], [7.5, 1.1, 1.3]));
    parts.push(box('timber', [dx - 7, dh / 2, 1.4], [1, dh / 2, 1.3])); parts.push(box('timber', [dx + 7, dh / 2, 1.4], [1, dh / 2, 1.3]));
    parts.push(box('win', [W / 4, Hw * 0.58, 1.0], [5, 4.5, 0.8]));
    parts.push(box('timber', [W / 4, Hw * 0.58, 1.5], [0.8, 4.5, 1])); parts.push(box('timber', [W / 4, Hw * 0.58, 1.5], [5, 0.8, 1]));
    parts.push(box('timber', [W / 4, Hw * 0.58 - 5.5, 1.6], [6, 1, 1.4]));
    // roof: two slopes to a ridge along x, overhanging at the eaves
    const ov = 7, half = Zd / 2 + ov * D() / 2, Ls = Math.hypot(Hr, half), th = Math.atan2(Hr, half), rz = v === 0 ? 'tile' : v === 1 ? 'thatch' : 'slate';
    const front = [0, Hw + Hr / 2, -Zd / 2 + half / 2], back = [0, Hw + Hr / 2, -Zd / 2 - half / 2];
    parts.push(box(rz, front, [hw + ov, 2.2, Ls / 2], [th, 0, 0]));
    parts.push(box(v === 0 ? 'tileD' : v === 1 ? 'thatchD' : 'slate', back, [hw + ov, 2.2, Ls / 2], [-th, 0, 0]));
    // courses across the slope: tile rows, thatch tufts or slate lines
    const rows = v === 1 ? 5 : 7;
    for (let i = 1; i < rows; i++){
      const t = i / rows, y = Hw + Hr * t, z = -Zd / 2 + half - half * t, nx = Math.sin(th), nz = Math.cos(th);
      const off = 2.6;
      if (v === 1) parts.push(ell('thatchD', [0, y + off * nx * 0.6, z + off * nz * 0.6], [hw + ov - 1, 1.2, 2.6], [th, 0, 0]));
      else parts.push(box(v === 0 ? 'tileD' : 'slateL', [0, y + off * nx, z + off * nz], [hw + ov - 0.5, 0.9, 0.7], [th, 0, 0]));
    }
    if (v === 1) for (let x = -hw - ov + 4; x < hw + ov; x += 7) parts.push(ell('thatch', [x, Hw + 1.2, -Zd / 2 + half + 0.5], [4, 2.6, 2.4]));
    parts.push(cyl(v === 1 ? 'thatchD' : 'timber', [-hw - ov - 1, Hw + Hr + 1.2, -Zd / 2], [hw + ov + 1, Hw + Hr + 1.2, -Zd / 2], 1.6));
    // a chimney at one end, with a cap
    const chx = hw - 10, chz = -Zd / 2 - 6;
    parts.push(box('stD', [chx, Hw + Hr - 2, chz], [3.6, 9, 3.2]));
    parts.push(box('st', [chx, Hw + Hr + 7.6, chz], [4.3, 1.1, 3.9]));
    if (se === 'winter'){ parts.push(box('snow', front.map((c, i) => c + [0, Math.sin(th) * 2.6, Math.cos(th) * 2.6][i]), [hw + ov - 1, 1.0, Ls / 2 - 2], [th, 0, 0])); parts.push(ell('snow', [chx, Hw + Hr + 9.4, chz], [4, 1.1, 3.6])); }
    parts.push(ell('moss', [-hw + 8 + r() * 10, 3, 1.6], [5, 2.5, 1]));
    return {parts, zones:P, foot:[W / 2 + 4, 10], tall:true};
  }};
  // tent: a ridge tent over wCells cells, cloth sagging between the poles, a tied flap, guy ropes
  KIND.tent = {variants:3, build(v, se, o){
    const P = pal(se), wc = (o && o.w) || 2, r = rng(hsh(v + 11, wc, 33)), parts = [];
    const W = wc * CELLW() - 6, hw = W / 2, Zd = CELLW() * D(), H = S.K.tentH * U(), zc = -Zd / 2, cz = v === 1 ? 'canvasR' : v === 2 ? 'canvasG' : 'canvas';
    const half = Zd / 2 + 4, Ls = Math.hypot(H, half), th = Math.atan2(H, half);
    parts.push(box(cz, [0, H / 2, zc + half / 2], [hw, 1.5, Ls / 2], [th, 0, 0]));
    parts.push(box('canvasD', [0, H / 2, zc - half / 2], [hw, 1.5, Ls / 2], [-th, 0, 0]));
    // sag: darker creases from the ridge down the front, and a patch
    for (let i = 0; i < 3 + v; i++){ const x = -hw + 6 + r() * (W - 12); parts.push(cap('canvasD', [x, H - 3, zc + 2.5], [x + (r() - 0.5) * 6, 3, zc + half - 2 + 1.2], 0.9)); }
    parts.push(ell('canvasD', [-hw + 10 + r() * (W - 20), H * 0.4, zc + half * 0.6 + 1.6], [4 + r() * 3, 3, 1.2], [th, 0, 0]));
    // the end walls (triangles): a dark opening at the viewer's end on the right, canvas on the left
    parts.push(box('dark', [hw - 0.5, H * 0.3, zc], [0.6, H * 0.3, half * 0.5]));
    // poles and ridge
    parts.push(cyl('logD', [-hw + 1, 0, zc], [-hw + 1, H + 2, zc], 1.4)); parts.push(cyl('logD', [hw - 1, 0, zc], [hw - 1, H + 2, zc], 1.4));
    parts.push(cyl('log', [-hw - 2, H + 1, zc], [hw + 2, H + 1, zc], 1.1));
    // guy ropes to pegs
    for (const sx of [-1, 1]) parts.push(cap('logL', [sx * (hw - 1), H, zc], [sx * (hw + 12), 0.5, zc + 6], 0.4));
    for (const sx of [-1, 1]) parts.push(box('logD', [sx * (hw + 12), 1.5, zc + 6], [0.8, 1.5, 0.8], [0.3, 0, sx * 0.3]));
    if (se === 'winter') parts.push(box('snow', [0, H / 2 + Math.sin(th) * 1.7, zc + half / 2 + Math.cos(th) * 1.7], [hw - 1, 0.8, Ls / 2 - 3], [th, 0, 0]));
    return {parts, zones:P, foot:[hw + 8, 10], tall:true};
  }};
  // rubble: a low heap of broken stone and a charred beam
  KIND.rubble = {variants:3, build(v, se){
    const P = pal(se), r = rng(hsh(v + 13, 41, 47)), Zd = CELLW() * D(), parts = [];
    parts.push(ell('ash', [0, 0.3, -Zd / 2], [18, 0.6, Zd / 2 - 10]));
    const n = 7 + v * 2;
    for (let i = 0; i < n; i++){
      const x = -17 + r() * 34, z = -Zd + 6 + r() * (Zd - 12), rr = 2 + r() * 3.2, zone = r() < 0.3 ? 'stD' : r() > 0.85 ? 'stL' : 'st';
      if (r() < 0.5) parts.push(box(zone, [x, rr * 0.55, z], [rr, rr * 0.5, rr * 0.8], [r() * 0.4, r() * 1.5, r() * 0.3])); else parts.push(ell(zone, [x, rr * 0.5, z], [rr, rr * 0.6, rr * 0.9], [0, r() * 1.5, 0]));
    }
    parts.push(ell('stD', [-4 + r() * 8, 3.5, -Zd / 2 + (r() - 0.5) * 20], [7, 3.2, 6], [0, r(), 0]));
    parts.push(box('char', [2 + r() * 4, 3.5, -Zd / 2], [14, 1.6, 1.6], [0, 0.5 + r() * 0.6, 0.18]));
    if (v === 2) parts.push(box('char', [-6, 2.2, -Zd / 2 - 12], [10, 1.4, 1.4], [0, -0.7, -0.1]));
    for (let i = 0; i < 2; i++) parts.push(ell('moss', [-12 + r() * 24, 1.2, -Zd / 2 + (r() - 0.5) * 30], [3 + r() * 3, 1, 3]));
    return {parts, zones:P, foot:[18, 12], tall:false};
  }};
  // boulder: one to three rocks, mossed on the shaded side
  KIND.boulder = {variants:3, build(v, se){
    const P = pal(se), r = rng(hsh(v + 17, 53, 59)), Zd = CELLW() * D(), parts = [];
    const n = 1 + v, big = 12 - v * 2;
    for (let i = 0; i < n; i++){
      const x = n === 1 ? 0 : -10 + i * 20 / (n - 1) + (r() - 0.5) * 6, z = -Zd / 2 + (r() - 0.5) * 20, rr = big * (0.7 + r() * 0.5);
      parts.push(ell(r() < 0.35 ? 'stD' : 'st', [x, rr * 0.85, z], [rr, rr * 0.9, rr * 0.8], [r() * 0.4, r() * 1.5, r() * 0.4]));
      parts.push(ell('stL', [x - rr * 0.3, rr * 1.5, z + rr * 0.3], [rr * 0.5, rr * 0.35, rr * 0.4]));
      parts.push(ell('moss', [x + rr * 0.5, rr * 0.5, z + rr * 0.6], [rr * 0.45, rr * 0.3, rr * 0.3]));
      if (se === 'winter') parts.push(ell('snow', [x, rr * 1.7, z], [rr * 0.8, rr * 0.2, rr * 0.7]));
    }
    return {parts, zones:P, foot:[14, 10], tall:false};
  }};
  // trees: trunk with ridged bark and roots, then a canopy by kind; winter strips the oak and the birch
  /* ---- trees (v2, 2026-11-11: Patrick's look check failed the smooth canopy balls) ----
     A canopy is a dark core ellipsoid wearing forty-odd small leaf clumps (jittered ellipsoids, five leaf colours by where
     they sit: sunward, underside, middle), with branches reaching into it from the trunk; pines are tiers of drooping
     boughs carrying needle clumps and spiky tips. The ray-caster lights each clump, then leafPass (below the sprite
     factory) adds leaf-cluster noise, dark pits and a ragged silhouette from the engine's zone buffer. */
  const LEAF_ZONES = new Set(['leaf', 'leafD', 'leafL', 'leafA', 'leafB', 'leafW', 'leafC', 'pine', 'pineL', 'pineD', 'pineA', 'pineC']);
  function leafPal(P, se){   // the extra leaf and needle colours a canopy uses, from the season's three greens
    P.leafA = mix(P.leaf, P.leafL, 0.45); P.leafB = mix(P.leaf, P.leafD, 0.5); P.leafW = mix(P.leafL, se === 'autumn' ? '#b8743a' : '#8a9a52', 0.3);
    P.leafC = dim(P.leafD, 0.5);
    P.pineA = mix(P.pine, P.pineL, 0.5); P.pineC = dim(P.pineD, 0.45);
  }
  function trunk(parts, r, h, rad, zone, zoneD, lean){
    parts.push(cone(zone, [0, -1, 0], [lean * h, h, 0], rad * 1.25, rad * 0.7));
    // bark: ridges that twist a little up the trunk, a few deep furrows in the dark zone
    const n = 6 + Math.round(r() * 3);
    for (let i = 0; i < n; i++){
      const a = r() * Math.PI * 2, tw = (r() - 0.5) * 0.9, y0 = 1 + r() * 4, y1 = h * (0.55 + r() * 0.4);
      const x0 = Math.cos(a) * rad * 1.05, z0 = Math.sin(a) * rad * 1.05, x1 = Math.cos(a + tw) * rad * 0.72 + lean * y1, z1 = Math.sin(a + tw) * rad * 0.72;
      if (z0 < -rad * 0.3 && z1 < -rad * 0.3) continue;   // the back of the trunk is never seen
      parts.push(cap(r() < 0.35 ? zoneD : zone, [x0, y0, z0], [x1, y1, z1], 0.5 + r() * 0.45));
    }
    // roots: buttresses that spread and sink, with a knuckle each
    const roots = 4 + (r() < 0.5 ? 1 : 0);
    for (let i = 0; i < roots; i++){
      const a = (i / roots + r() * 0.25) * Math.PI * 2, L = rad * (1.9 + r() * 1.4), x = Math.cos(a) * L, z = Math.sin(a) * L * 0.75;
      parts.push(cone(zone, [Math.cos(a) * rad * 0.5, 3 + r() * 2, Math.sin(a) * rad * 0.5], [x, -0.5, z], rad * 0.5, rad * 0.22));
      if (r() < 0.6) parts.push(ell(zoneD, [x * 0.55, 1.2, z * 0.55], [rad * 0.45, rad * 0.3, rad * 0.35]));
    }
  }
  // leaf clumps over an ellipsoid core: the surface is jittered in and out so the mass has pits, bulges and a ragged rim
  function canopyMass(parts, r, c, R, P, o){
    o = o || {};
    const rx = R * (o.ax || 1), ry = R * (o.ay || 0.8), rz = R * (o.az || 0.85), L = S.lightVec();
    parts.push(ell(o.core || 'leafC', c, [rx * 0.78, ry * 0.78, rz * 0.78]));
    const n = Math.max(8, Math.round((o.n || 40) * (o.density || 1))), gold = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++){
      const t = (i + 0.5) / n, y = 1 - 2 * t, rr = Math.sqrt(1 - y * y), a = i * gold + r() * 0.5;
      let nx = Math.cos(a) * rr, ny = y, nz = Math.sin(a) * rr;
      if (nz < -0.55 && r() < 0.7) continue;   // the far side is never seen: fewer clumps there
      const push = 0.8 + r() * 0.26, u = r(), s = R * (0.12 + u * u * 0.22) * (o.clump || 1);
      const cx = c[0] + nx * rx * push, cy = c[1] + ny * ry * push, cz = c[2] + nz * rz * push;
      const sun = nx * L[0] + ny * L[1] + nz * L[2];
      const zone = ny < -0.45 ? (r() < 0.5 ? 'leafD' : 'leafB') : sun > 0.45 ? (r() < 0.45 ? 'leafL' : r() < 0.5 ? 'leafW' : 'leafA') : sun > 0 ? (r() < 0.5 ? 'leaf' : 'leafA') : (r() < 0.5 ? 'leafB' : 'leaf');
      parts.push(ell(o.zone ? o.zone(zone) : zone, [cx, cy, cz], [s * (0.8 + r() * 0.5), s * (0.55 + r() * 0.4), s * (0.7 + r() * 0.5)], [(r() - 0.5) * 1.2, r() * 3, (r() - 0.5) * 1.2]));
      if (r() < 0.3) parts.push(ell(zone === 'leafL' ? 'leafW' : zone, [cx + (r() - 0.5) * s, cy + s * 0.5, cz + (r() - 0.5) * s], [s * 0.4, s * 0.3, s * 0.4]));
    }
    // a few leaf tufts flung past the rim: the jagged silhouette
    const tufts = Math.round(6 * (o.density || 1));
    for (let i = 0; i < tufts; i++){ const a = r() * Math.PI * 2, e = 0.3 + r() * 0.7, s = R * (0.08 + r() * 0.08); parts.push(ell(r() < 0.5 ? 'leafA' : 'leafB', [c[0] + Math.cos(a) * rx * 1.1, c[1] + (e - 0.3) * ry * 1.1, c[2] + Math.sin(a) * rz * 0.9], [s, s * 0.7, s])); }
  }
  // branches from a point up and out into the canopy masses, forking once
  function limbsTo(parts, r, from, to, rad, zone, zoneD){
    parts.push(cap(zone, from, to, rad));
    for (let k = 0; k < 2; k++){
      const e = [to[0] + (to[0] - from[0]) * (0.25 + r() * 0.3) + (r() - 0.5) * 8, to[1] + (to[1] - from[1]) * (0.3 + r() * 0.3) + 2, to[2] + (r() - 0.5) * 8];
      parts.push(cap(zoneD, to, e, rad * 0.55));
    }
  }
  KIND.oak = {variants:4, build(v, se){
    const P = pal(se), r = rng(hsh(v + 19, 61, 67)), H = S.K.oakH * U(), lean = (r() - 0.5) * 0.12, th = H * 0.36, parts = [];
    leafPal(P, se);
    trunk(parts, r, th, H * 0.045 + r(), 'bark', 'barkD', lean);
    const bare = se === 'winter', R = H * 0.2, mid = th + (H - th) * 0.48, top = [lean * th, th, 0];
    const masses = [];
    masses.push({c:[lean * th, mid + R * 0.25, 0], R:R * 1.3, n:70});
    const n = 4 + (v & 1);
    for (let i = 0; i < n; i++){ const a = (i / n + r() * 0.2) * Math.PI * 2, d = R * (1.0 + r() * 0.5); masses.push({c:[lean * th + Math.cos(a) * d, mid + (r() - 0.35) * R * 1.2, Math.sin(a) * d * 0.6], R:R * (0.7 + r() * 0.35), n:44}); }
    masses.push({c:[lean * th + (r() - 0.5) * R, H - R * 0.85, -R * 0.15], R:R * 0.9, n:40});
    for (const m of masses) limbsTo(parts, r, top, [m.c[0] * 0.8 + top[0] * 0.2, m.c[1] - m.R * 0.2, m.c[2] * 0.8], 2 + r() * 0.8, 'bark', 'barkD');
    if (bare){
      for (const m of masses) for (let k = 0; k < 7; k++){ const a = r() * Math.PI * 2, e = r() * Math.PI, L = m.R * (0.5 + r() * 0.5), x = m.c[0] + Math.cos(a) * Math.sin(e) * L, y = m.c[1] + Math.cos(e) * L * 0.8, z = m.c[2] + Math.sin(a) * Math.sin(e) * L * 0.7; parts.push(cap('barkD', [m.c[0] * 0.85 + top[0] * 0.15, m.c[1] - m.R * 0.25, m.c[2] * 0.85], [x, y, z], 0.7 + r() * 0.5)); if (r() < 0.5) parts.push(ell('snow', [x, y + 1.3, z], [L * 0.22, 0.9, 1.3])); }
    } else for (const m of masses) canopyMass(parts, r, m.c, m.R, P, {n:m.n});
    return {parts, zones:P, foot:[H * 0.08, H * 0.05], tall:true, soft:1.6, leafy:!bare};
  }};
  KIND.pine = {variants:4, build(v, se){
    const P = pal(se), r = rng(hsh(v + 23, 71, 73)), H = S.K.pineH * U(), lean = (r() - 0.5) * 0.06, parts = [];
    leafPal(P, se);
    trunk(parts, r, H * 0.28, H * 0.024 + r() * 0.6, 'barkD', 'bark', lean);
    parts.push(cone('barkD', [lean * H * 0.28, H * 0.26, 0], [lean * H * 0.96, H * 0.97, 0], H * 0.018, 0.5));
    const tiers = 6 + (v & 1), base = H * 0.2, winter = se === 'winter';
    parts.push(cone('pineC', [lean * base, base, 0], [lean * H, H * 0.98, 0], H * 0.13, 0.5));   // the dark heart between the boughs
    for (let i = 0; i < tiers; i++){
      const t = i / tiers, y = base + (H - base) * t * 0.9, R = (H * 0.19) * (1 - t * 0.8) + 3, x = lean * y, nb = 5 + Math.round(r() * 3) + (t < 0.4 ? 2 : 0);
      for (let k = 0; k < nb; k++){
        const a = (k / nb + r() * 0.3) * Math.PI * 2, L = R * (0.8 + r() * 0.35), droop = L * (0.28 + r() * 0.2), ex = x + Math.cos(a) * L, ez = Math.sin(a) * L, ey = y + L * 0.1 - droop;
        if (ez < -L * 0.4 && r() < 0.5) continue;
        parts.push(cap('barkD', [x, y + 1, 0], [ex, ey, ez], 0.9));
        const seg = 3 + Math.round(r() * 2);
        for (let s = 1; s <= seg; s++){
          const f = s / seg, px = x + (ex - x) * f, py = y + 1 + (ey - y - 1) * f - (1 - f) * 0.5, pz = ez * f, w = L * (0.22 - f * 0.08) + 1.5, up = f > 0.8 ? 0.4 : 0;
          const zone = py > y ? 'pineL' : f > 0.6 ? (r() < 0.5 ? 'pine' : 'pineA') : (r() < 0.5 ? 'pineD' : 'pine');
          parts.push(ell(zone, [px, py - w * 0.15 + up, pz], [w * (0.6 + Math.abs(Math.cos(a)) * 0.6), w * 0.45, w * (0.6 + Math.abs(Math.sin(a)) * 0.6)], [0, -a, 0]));
          if (f > 0.7) parts.push(ell(r() < 0.5 ? 'pineA' : 'pineL', [px + Math.cos(a) * w * 0.5, py - w * 0.3, pz + Math.sin(a) * w * 0.5], [w * 0.35, w * 0.25, w * 0.35]));
          if (winter && r() < 0.7) parts.push(ell('snow', [px, py + w * 0.32, pz + 0.5], [w * 0.55, w * 0.16, w * 0.45]));
        }
      }
    }
    parts.push(cone('pineA', [lean * H * 0.9, H * 0.88, 0], [lean * H, H + 2, 0], H * 0.03, 0.3));
    if (winter) parts.push(ell('snow', [lean * H * 0.95, H * 0.95, 1.5], [H * 0.02, 2, 2]));
    return {parts, zones:P, foot:[H * 0.065, H * 0.045], tall:true, soft:1.4, leafy:true};
  }};
  KIND.birch = {variants:4, build(v, se){
    const P = pal(se), r = rng(hsh(v + 29, 79, 83)), H = S.K.birchH * U(), lean = (r() - 0.5) * 0.16, th = H * 0.46, parts = [];
    leafPal(P, se);
    const rad = H * 0.026 + r() * 0.5;
    trunk(parts, r, th, rad, 'birch', 'birch', lean);
    for (let i = 0; i < 11; i++){ const y = 3 + r() * (th - 6); parts.push(box('birchD', [lean * y + (r() - 0.5) * rad * 1.4, y, rad * 0.9], [rad * 0.55 + r() * rad * 0.5, 0.45, 0.6], [0, 0, (r() - 0.5) * 0.5])); }
    const bare = se === 'winter', n = 4, masses = [];
    for (let i = 0; i < n; i++){
      const a = (i / n + r() * 0.2) * Math.PI * 2, L = H * (0.18 + r() * 0.12), y0 = th * (0.8 + r() * 0.2), e = [lean * y0 + Math.cos(a) * L * 0.55, y0 + L * 0.9, Math.sin(a) * L * 0.35];
      parts.push(cap('birch', [lean * y0, y0, 0], e, rad * 0.5));
      for (let k = 0; k < 3; k++){ const b = a + (r() - 0.5) * 1.2, l2 = L * 0.6, e2 = [e[0] + Math.cos(b) * l2 * 0.5, e[1] + l2 * 0.8, e[2] + Math.sin(b) * l2 * 0.3]; parts.push(cap('birchD', e, e2, 0.5)); if (!bare) masses.push({c:[e2[0], e2[1] - l2 * 0.1, e2[2]], R:H * (0.07 + r() * 0.05)}); }
      if (!bare) masses.push({c:[e[0], e[1] + L * 0.2, e[2]], R:H * (0.1 + r() * 0.05)});
    }
    if (!bare) for (const m of masses) canopyMass(parts, r, m.c, m.R, P, {n:26, clump:0.85, density:0.8, zone:z => se === 'autumn' ? (z === 'leafD' ? 'leafB' : z === 'leaf' ? 'leafW' : z) : z});
    return {parts, zones:P, foot:[H * 0.06, H * 0.045], tall:true, soft:1.3, leafy:!bare};
  }};
  KIND.dead = {variants:4, build(v, se){
    const P = pal(se), r = rng(hsh(v + 31, 89, 97)), H = S.K.deadH * U(), lean = (r() - 0.5) * 0.2, parts = [];
    trunk(parts, r, H * 0.72, H * 0.05 + r(), 'barkD', 'bark', lean);
    parts.push(cone('barkD', [lean * H * 0.72, H * 0.71, 0], [lean * H * 0.72 + 2, H * 0.71 + H * 0.08, 0], H * 0.035, 0.4));
    const n = 4 + (v & 1);
    for (let i = 0; i < n; i++){
      const a = (i / n + r() * 0.3) * Math.PI * 2, y0 = H * (0.35 + r() * 0.38), L = H * (0.22 + r() * 0.2), e = [lean * y0 + Math.cos(a) * L * 0.8, y0 + L * 0.5, Math.sin(a) * L * 0.4];
      parts.push(cap('barkD', [lean * y0, y0, 0], e, H * 0.018 + r()));
      for (let k = 0; k < 3; k++){ const b = a + (r() - 0.5) * 1.8, l2 = L * (0.35 + r() * 0.3), e2 = [e[0] + Math.cos(b) * l2, e[1] + l2 * (0.3 + r() * 0.5), e[2] + Math.sin(b) * l2 * 0.4]; parts.push(cap('bark', e, e2, 0.7)); if (r() < 0.5) parts.push(cap('barkD', e2, [e2[0] + (r() - 0.5) * l2, e2[1] + l2 * 0.5, e2[2] + (r() - 0.5) * l2 * 0.4], 0.45)); }
    }
    if (v === 3) parts.push(ell('moss', [lean * 4, 6, H * 0.04], [3, 5, 1.2]));
    if (se === 'winter') parts.push(ell('snow', [lean * H * 0.72 + 1, H * 0.71 + H * 0.08, 0], [H * 0.03, 1.2, H * 0.025]));
    return {parts, zones:P, foot:[H * 0.08, H * 0.05], tall:true, soft:1.0};
  }};
  S.KIND = KIND;

  /* ---- leaf texture: the engine's zone buffer (captured while it shades) tells which pixels are canopy; those get
     leaf-cluster value noise, dark pits where clusters meet, and a ragged rim where the silhouette is nibbled ---- */
  const ZB = {buf:null};
  function withZoneCapture(fn){
    if (typeof r3dShade !== 'function') return fn();
    const orig = r3dShade;
    r3dShade = function(rec, zb, nb, zone, v){ ZB.buf = {zone, zb, W:R3D.W, H:R3D.H}; return orig(rec, zb, nb, zone, v); };
    try { return fn(); } finally { r3dShade = orig; }
  }
  const vn = (x, y, seed) => {   // value noise on an integer lattice, bilinear
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const h = (i, j) => (hsh(i, j, seed) & 1023) / 1023;
    return (h(x0, y0) * (1 - sx) + h(x0 + 1, y0) * sx) * (1 - sy) + (h(x0, y0 + 1) * (1 - sx) + h(x0 + 1, y0 + 1) * sx) * sy;
  };
  function leafPass(img, buf, seed, st_){
    if (!buf || !img) return img;
    const W = img.width, H = img.height, bw = buf.W, kx = bw / W, ky = buf.H / H, zone = buf.zone;
    const g = img.getContext('2d', {willReadFrequently:true}), im = g.getImageData(0, 0, W, H), d = im.data;
    const sc = (S.K.leafScale || 3.2), amp = S.K.leafNoise === undefined ? 0.24 : S.K.leafNoise, pit = S.K.leafPit === undefined ? 0.12 : S.K.leafPit;
    const isLeaf = (x, y) => { const z = zone[Math.min(buf.H - 1, (y * ky) | 0) * bw + Math.min(bw - 1, (x * kx) | 0)]; return z !== undefined && LEAF_ZONES.has(z); };
    const leaf = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] && isLeaf(x, y)) leaf[y * W + x] = 1;
    // nibble the rim: a leaf pixel on the silhouette with low noise goes, so the edge is jagged not round
    const rim = seed + 77;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const i = y * W + x; if (!leaf[i]) continue;
      const edge = (x > 0 && !d[(i - 1) * 4 + 3]) || (x < W - 1 && !d[(i + 1) * 4 + 3]) || (y > 0 && !d[(i - W) * 4 + 3]) || (y < H - 1 && !d[(i + W) * 4 + 3]);
      if (edge && vn(x / 2.2, y / 2.2, rim) < 0.42) leaf[i] = 2;
      else if (!edge && vn(x / 2.6, y / 2.6, rim + 5) < 0.06 && vn(x / 5, y / 5, rim + 9) < 0.5) leaf[i] = 3;   // a hole in the canopy
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const i = y * W + x, L = leaf[i]; if (!L) continue;
      if (L === 3){ d[i * 4 + 3] = 0; continue; }
      if (L === 2){ d[i * 4] = d[i * 4] * 0.32 + 12; d[i * 4 + 1] = d[i * 4 + 1] * 0.28 + 8; d[i * 4 + 2] = d[i * 4 + 2] * 0.3 + 14; continue; }   // a bite out of the rim: outline-dark
      // three scales: cluster masses (sc x 3), leaf clusters (sc), single leaves (sc x 0.4); then pits and bright flecks
      const n = 0.3 * vn(x / (sc * 3), y / (sc * 3), seed + 3) + 0.42 * vn(x / sc, y / sc, seed) + 0.28 * vn(x / (sc * 0.4), y / (sc * 0.4), seed + 1);
      let k = 1 - amp + 2 * amp * n;
      const f = vn(x / (sc * 0.5), y / (sc * 0.5), seed + 4);
      if (f < pit) k *= 0.55; else if (f > 0.9) k *= 1.22;
      // the lip of a hole is dark
      if ((x > 0 && leaf[i - 1] === 3) || (x < W - 1 && leaf[i + 1] === 3) || (y > 0 && leaf[i - W] === 3) || (y < H - 1 && leaf[i + W] === 3)) k *= 0.45;
      d[i * 4] = Math.min(255, d[i * 4] * k); d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] * k); d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] * k);
    }
    g.putImageData(im, 0, 0);
    return img;
  }

  /* ---- the sprite cache: kind x variant x season x light (and the shape options that change the geometry) ---- */
  function sprite(kind, v, se, o){
    const K = KIND[kind]; if (!K) return null;
    const ok = o ? Object.keys(o).sort().map(k => k + '=' + o[k]).join('&') : '', key = kind + ':' + v + ':' + se + ':' + ok + ':' + lightKey();
    let sp = S.cache[key]; if (sp) return sp;
    const t0 = performance.now(), b = K.build(v % K.variants, se, o);
    sp = render(kind + ':' + v + ':' + se + ':' + ok, b.parts, b.zones, b.frame);
    if (b.leafy && S.K.leafNoise !== 0) leafPass(sp.img, sp.zbuf, hsh(v + 5, 11, 13), sp.st);
    sp.zbuf = null;
    sp.key = key; sp.kind = kind; sp.v = v; sp.tall = !!b.tall; sp.foot = b.foot;
    sp.shadow = makeShadow(sp, b.foot, b.soft || 0.5, b.tall === false);
    S.stats.sprites++; S.stats.ms += performance.now() - t0;
    return S.cache[key] = sp;
  }

  /* ---- build: walk the map once ---- */
  S.build = function(map, env){
    map = map || window.MAP; env = env || {};
    if (!map || !map.g) return;
    const se = env.season || 'summer', key = se + '|' + lightKey() + '|' + (map.seed || 0) + '|' + map.w + 'x' + map.h;
    if (S.built && S.built.map === map && S.built.key === key) return;
    const t0 = performance.now(), T_ = TT(), g = map.g, w = map.w, h = map.h, C = CELLW(), seed = map.seed || 7, list = [];
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : g[y * w + x];
    const isStone = t => t === T_.STONE || t === T_.WALL;
    const add = (sp, x, y) => { if (!sp) return; const it = {x, y, img:sp.img, ax:sp.ax, ay:sp.ay, s:sp.s, shadow:sp.shadow, tall:sp.tall, kind:sp.kind};
      it.x0 = x - sp.ax * sp.s; it.x1 = it.x0 + sp.img.width * sp.s; it.y0 = y - sp.ay * sp.s; it.y1 = it.y0 + sp.img.height * sp.s;
      const sh = sp.shadow; if (sh){ it.sx0 = Math.min(it.x0, x - sh.ax); it.sx1 = Math.max(it.x1, x - sh.ax + sh.img.width); it.sy0 = Math.min(it.y0, y - sh.ay); it.sy1 = Math.max(it.y1, y - sh.ay + sh.img.height); } else { it.sx0 = it.x0; it.sx1 = it.x1; it.sy0 = it.y0; it.sy1 = it.y1; }
      list.push(it); };
    const seen = new Uint8Array(w * h), HF = window.GROUND && GROUND.hillField && (S.K.hillCliffs !== 0) ? GROUND.hillField(at, C) : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const t = g[y * w + x], hv = hsh(x, y, seed), bx = (x + 0.5) * C, by = (y + 1) * C;
      if (isStone(t)){
        const n4 = isStone(at(x, y - 1)) + isStone(at(x + 1, y)) + isStone(at(x, y + 1)) + isStone(at(x - 1, y));
        if (!n4) add(sprite('boulder', hv % 3, se), bx, by);
        else if (!seen[y * w + x]){
          // a horizontal run of wall cells is cut into sections of 2 to 4 cells, each one sprite with its own stone layout
          let n = 1; const maxRun = 2 + hv % 3;
          while (n < maxRun && isStone(at(x + n, y)) && !isStone(at(x + n, y - 1)) && !isStone(at(x + n, y + 1)) && (n > 0 ? true : true)) n++;
          if (isStone(at(x, y - 1)) || isStone(at(x, y + 1))) n = 1;   // a junction cell stays its own sprite
          for (let k = 0; k < n; k++) seen[y * w + x + k] = 1;
          add(sprite('wall', hv % 8, se, {run:n, ends:(isStone(at(x - 1, y)) ? 0 : 1) | (isStone(at(x + n, y)) ? 0 : 2)}), (x + n / 2) * C, by);
        }
      } else if (t === T_.PALISADE){
        const m = (at(x, y - 1) === T_.PALISADE ? 1 : 0) | (at(x + 1, y) === T_.PALISADE ? 2 : 0) | (at(x, y + 1) === T_.PALISADE ? 4 : 0) | (at(x - 1, y) === T_.PALISADE ? 8 : 0);
        add(sprite('palisade', hv % 3, se, {mask:m}), bx, by);
      } else if (t === T_.HILL){
        if (at(x, y + 1) !== T_.HILL && at(x, y + 1) !== -1) { let co = null, oy = 0; const KS = window.VO3 && VO3.K && VO3.K.cliffSlope;
          if (KS && HF){   /* Q103: the smoothed hill contour under this cell: its height at the cell centre and its slope across the cell; the face sits on it, sheared to that slope */
            const yAt = px => { let lo = y * C, hi = (y + 1.9) * C; if (HF(px, lo) < 0.5) return lo; for (let i = 0; i < 9; i++){ const m = (lo + hi) / 2; if (HF(px, m) >= 0.5) lo = m; else hi = m; } return (lo + hi) / 2; },
              yl = Math.max(-0.6 * C, Math.min(0.6 * C, yAt(x * C) - by)), yr = Math.max(-0.6 * C, Math.min(0.6 * C, yAt((x + 1) * C) - by)), cc = (yl + yr) / 2, sl = Math.max(-0.7, Math.min(0.7, (yr - yl) / C)), s = Math.round(sl * KS * 20) / 20;   /* the contour height at the cell's own left and right edges: neighbours share an edge, so the lips meet */
            if (s) co = {sh: s}; oy = cc * KS; }
          const n0 = list.length; add(sprite('cliff', hv % 3, se), bx, by + oy); if (co && list.length > n0) list[n0].sh = co.sh; }
        else if (hv % S.K.hillBoulder === 0) (S.K.hillRubble === 0 ? add(sprite('boulder', (hv >> 4) % 3, se), bx, by - C * 0.3) : add(sprite('rubble', (hv >> 4) % 3, se), bx, by));   /* INDEX SW8 (K.hillRubble = 0 restores the boulder): hill ground is walkable, so its stones are low scatter, not a solid boulder */
      } else if (t === T_.RUBBLE){
        add(sprite('rubble', hv % 3, se), bx, by);
      } else if (t === T_.ROOF && !seen[y * w + x]){
        // one building per connected group of ROOF cells
        let x0 = x, x1 = x, y0 = y, y1 = y; const stack = [[x, y]], cells = [[x, y]]; seen[y * w + x] = 1;
        while (stack.length){ const [px, py] = stack.pop(); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = px + dx, ny = py + dy; if (at(nx, ny) === T_.ROOF && !seen[ny * w + nx]){ seen[ny * w + nx] = 1; stack.push([nx, ny]); cells.push([nx, ny]); } } }
        let v = hv % 3; if (map.structures) for (const s of map.structures) if (s.kind === 'house' && s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1 + 1 && s.v !== undefined){ v = s.v % 3; break; }
        /* INDEX SW8: the group is cut into rectangles (each at most 6 x 4) so the art covers the ROOF cells and nothing else; an L-shaped
           or large footprint no longer paints one box over open ground. Each item carries its footprint (fw, fd) for VO3. */
        const mine = new Set(cells.map(c => c[1] * w + c[0])), done = new Set();
        if (S.K.roofSplit === 0){ add(sprite('building', v, se, {w:Math.min(6, x1 - x0 + 1), d:Math.min(4, y1 - y0 + 1)}), (x0 + x1 + 1) / 2 * C, (y1 + 1) * C); continue; }   /* K.roofSplit = 0: the old single box */
        for (let ry = y0; ry <= y1; ry++) for (let rx = x0; rx <= x1; rx++){
          const k0 = ry * w + rx; if (!mine.has(k0) || done.has(k0)) continue;
          let rw = 1; while (rw < 6 && mine.has(ry * w + rx + rw) && !done.has(ry * w + rx + rw)) rw++;
          let rd = 1; while (rd < 4){ let full = true; for (let k = 0; k < rw; k++){ const kk = (ry + rd) * w + rx + k; if (!mine.has(kk) || done.has(kk)){ full = false; break; } } if (!full) break; rd++; }
          for (let j = 0; j < rd; j++) for (let k = 0; k < rw; k++) done.add((ry + j) * w + rx + k);
          const before = list.length; add(sprite('building', v, se, {w:rw, d:rd}), (rx + rx + rw) / 2 * C, (ry + rd) * C);
          if (list.length > before){ list[list.length - 1].fw = rw; list[list.length - 1].fd = rd; }
        }
      } else if (t === T_.TENT && !seen[y * w + x]){
        let x1 = x; seen[y * w + x] = 1; while (at(x1 + 1, y) === T_.TENT && !seen[y * w + x1 + 1] && x1 - x < 2){ x1++; seen[y * w + x1] = 1; }
        add(sprite('tent', hv % 3, se, {w:x1 - x + 1}), (x + x1 + 1) / 2 * C, by);
      }
    }
    if (S.trees !== false && map.trees) for (const t of map.trees){
      const hv = hsh(Math.round(t.x), Math.round(t.y), seed), kind = hv % 12 === 0 ? 'dead' : ['pine', 'oak', 'birch'][(t.v || 0) % 3];
      add(sprite(kind, (hv >> 3) % 4, se), t.x, t.y + 4);
    }
    list.sort((a, b) => a.y - b.y);
    S.list = list; S.built = {map, key}; S.stats.items = list.length; S.stats.buildMs = performance.now() - t0;
  };

  /* ---- per frame: visible items and their shadows (one reused array, no other allocation) ---- */
  S.items = function(cx, cy){
    const out = S.vis, L = S.list, VW_ = (typeof VW === 'number' && VW) || 1280, VH_ = (typeof VH === 'number' && VH) || 800, x1 = cx + VW_, y1 = cy + VH_;
    out.length = 0;
    for (let i = 0; i < L.length; i++){ const it = L[i]; if (it.x1 < cx || it.x0 > x1 || it.y1 < cy || it.y0 > y1) continue; out.push(it); }
    return out;
  };
  S.drawShadows = function(ctx, cx, cy){
    const L = S.list, VW_ = (typeof VW === 'number' && VW) || 1280, VH_ = (typeof VH === 'number' && VH) || 800, x1 = cx + VW_, y1 = cy + VH_;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = S.K.shadowA;
    for (let i = 0; i < L.length; i++){ const it = L[i], sh = it.shadow; if (!sh || it.sx1 < cx || it.sx0 > x1 || it.sy1 < cy || it.sy0 > y1) continue; ctx.drawImage(sh.img, it.x - sh.ax, it.y - sh.ay); }
    ctx.restore();
  };
  S.invalidate = function(){ S.cache = {}; S.list = []; S.vis.length = 0; S.built = null; S.stats = {ms:0, sprites:0, items:0}; };

  /* ---- the sheet: one of every kind and variant, shadows under, for the look check ---- */
  S.sheet = function(season){
    const se = season || 'summer', cols = [], CW = 150, RH = 180;
    const spec = [['wall', 3, [{ends:3, run:1}, {ends:1, run:2}, {ends:0, run:3}]], ['palisade', 3, [{mask:10}, {mask:5}, {mask:6}]], ['cliff', 3, null], ['building', 3, [{w:3, d:2}]], ['tent', 3, [{w:2}]], ['rubble', 3, null], ['boulder', 3, null], ['oak', 4, null], ['pine', 4, null], ['birch', 4, null], ['dead', 4, null]];
    let maxV = 4;
    const c = cv(CW * maxV + 110, RH * spec.length + 30), g = c.getContext('2d');
    g.fillStyle = '#5a5a44'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#6a6a50'; for (let y = 0; y < c.height; y += 40) for (let x = 110; x < c.width; x += 40) if (((x + y) / 40) & 1) g.fillRect(x, y, 40, 40);
    g.font = '13px sans-serif'; g.fillStyle = '#efe3c8'; g.fillText('STRUCT.sheet ' + se + '  light ' + lightKey(), 8, 18);
    spec.forEach(([kind, n, opts], row) => {
      const y = 30 + row * RH + RH - 30; g.fillStyle = '#efe3c8'; g.fillText(kind, 8, y - 60);
      for (let v = 0; v < n; v++){
        const o = opts ? opts[Math.min(v, opts.length - 1)] : undefined, sp = sprite(kind, v, se, o), x = 110 + v * CW + CW / 2;
        if (!sp) continue;
        g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.K.shadowA; g.drawImage(sp.shadow.img, x - sp.shadow.ax, y - sp.shadow.ay); g.restore();
        g.drawImage(sp.img, x - sp.ax * sp.s, y - sp.ay * sp.s, sp.img.width * sp.s, sp.img.height * sp.s);
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x - CW / 2 + 2, y - 2, CW - 4, 1);
      }
    });
    // a figure-height bar for scale (40 px = one cell; a VO2 figure is about 46 px)
    g.fillStyle = '#efe3c8'; g.fillRect(90, 30 + RH - 30 - 46, 4, 46); g.fillText('46', 70, 30 + RH - 30 - 20);
    return c;
  };

  /* ---- reference strip: every tree kind by season beside the Leader at the game's own draw scale (audits/fable/vo2/trees-v2.png) ---- */
  S.figure = function(scale){   // the Leader's idle frame as r3dDrawUnit would draw it at s = scale (times the composer's figure scale)
    try {
      if (typeof r3dLeaderRecipe !== 'function' || typeof r3dFrames !== 'function' || typeof R3D_STYLES === 'undefined') return null;
      const st_ = R3D_STYLES[(typeof r3dStyleId === 'function' && r3dStyleId()) || 'crisp'], rec = r3dLeaderRecipe(); if (!rec) return null;
      const img = r3dFrames(rec, 'idle', 2, st_)[0], s0 = (scale || 1) * ((window.VO2 && VO2.figure) || 1), s = s0 / R3D.K / st_.res;
      return {img, w:img.width * s, h:img.height * s, ax:R3D.CX * s, ay:R3D.FEET * s};
    } catch (e) { return null; }
  };
  S.strip = function(o){
    o = o || {};
    const seasons = o.seasons || ['spring', 'summer', 'autumn', 'winter'], kinds = o.kinds || [['oak', 0], ['oak', 2], ['pine', 0], ['pine', 1], ['birch', 0], ['dead', 1]];
    const CW = o.cw || 170, RH = o.rh || 215, FW = 80, fig = S.figure(o.figure || 2);   // the game draws units at s = 2: 40 px
    const c = cv(FW + CW * kinds.length + 10, RH * seasons.length + 26), g = c.getContext('2d');
    g.fillStyle = '#5a5a44'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#62624a'; for (let y = 0; y < c.height; y += 40) for (let x = 0; x < c.width; x += 40) if (((x + y) / 40) & 1) g.fillRect(x, y, 40, 40);
    g.font = '12px sans-serif'; g.fillStyle = '#efe3c8';
    g.fillText('STRUCT.strip  oak ' + S.K.oakH + ' pine ' + S.K.pineH + ' birch ' + S.K.birchH + ' dead ' + S.K.deadH + '  figure ' + (fig ? 'Leader at s=' + (o.figure || 2) : '40 px bar') + '  light ' + lightKey(), 8, 16);
    seasons.forEach((se, row) => {
      const y = 26 + row * RH + RH - 22;
      g.fillStyle = '#efe3c8'; g.fillText(se, 8, y - RH + 40);
      if (fig) g.drawImage(fig.img, 40 - fig.ax, y - fig.ay, fig.w, fig.h); else { g.fillRect(38, y - 40, 4, 40); g.fillText('40', 30, y - 44); }
      kinds.forEach(([kind, v], col) => {
        const sp = sprite(kind, v, se), x = FW + col * CW + CW / 2; if (!sp) return;
        g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.K.shadowA; g.drawImage(sp.shadow.img, x - sp.shadow.ax, y - sp.shadow.ay); g.restore();
        g.drawImage(sp.img, x - sp.ax * sp.s, y - sp.ay * sp.s, sp.img.width * sp.s, sp.img.height * sp.s);
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x - CW / 2 + 4, y - 1, CW - 8, 1); g.fillStyle = '#efe3c8'; if (!row) g.fillText(kind + ' ' + v, x - CW / 2 + 6, y - RH + 40);
      });
    });
    return c;
  };

  /* ---- self-test: a fake map with every terrain id; nothing of the game changed ---- */
  S.selfTest = function(){
    const details = []; let pass = 0, fail = 0;
    const ok = (name, cond) => { if (cond) pass++; else fail++; details.push((cond ? 'ok ' : 'FAIL ') + name); };
    const wasCache = S.cache, wasList = S.list, wasBuilt = S.built, wasStats = S.stats, wasLight = S.light;
    try { if (typeof r3dUseStyle === 'function' && typeof r3dStyleId === 'function' && typeof R3D_STYLES !== 'undefined') r3dUseStyle(R3D_STYLES[r3dStyleId()]); } catch (e) {}   /* settle the engine on the current style first: run first after a load it still sits at the boot size, and the test's own restore goes to the current style, so the snapshot below must too */
    const L0 = typeof R3D_LIGHT !== 'undefined' ? [R3D_LIGHT[0], R3D_LIGHT[1], R3D_LIGHT[2]] : null, R0 = typeof R3D !== 'undefined' ? [R3D.W, R3D.H, R3D.FEET, R3D.CX, R3D.SC] : null;
    const realMap = window.MAP, realG = realMap && realMap.g ? realMap.g.slice(0, 64).join(',') : '';
    try {
      ok('engine present (r3dFrames, wFrame, R3D_STYLES)', typeof r3dFrames === 'function' && typeof wFrame === 'function' && typeof R3D_STYLES !== 'undefined');
      const T_ = TT(), w = 14, h = 12, g = new Uint8Array(w * h);
      const set = (x, y, t) => { g[y * w + x] = t; };
      for (let x = 0; x < w; x++){ set(x, 0, T_.STONE); set(x, h - 1, T_.STONE); } for (let y = 0; y < h; y++){ set(0, y, T_.STONE); set(w - 1, y, T_.STONE); }
      for (let x = 2; x < 7; x++) set(x, 2, T_.PALISADE); set(2, 3, T_.PALISADE); set(2, 4, T_.PALISADE); set(4, 4, T_.GATE);
      for (let x = 3; x < 6; x++){ set(x, 6, T_.ROOF); set(x, 7, T_.ROOF); } set(8, 7, T_.TENT); set(9, 7, T_.TENT); set(11, 3, T_.RUBBLE); set(7, 4, T_.STONE);
      for (let x = 8; x < 12; x++){ set(x, 9, T_.HILL); set(x, 8, T_.HILL); } set(10, 4, T_.WALL); set(11, 4, T_.WALL); set(3, 9, T_.WATER); set(5, 9, T_.FOREST); set(6, 9, T_.ROAD); set(6, 3, T_.FLOOR); set(12, 9, T_.WAGON);
      const fake = {w, h, g, seed:99, trees:[{x:5.5 * 40, y:9.5 * 40, v:0}, {x:6.5 * 40, y:9.6 * 40, v:1}, {x:4.5 * 40, y:9.3 * 40, v:2}, {x:120, y:410, v:0}], structures:[{kind:'house', x:4, y:7, v:1}]};
      S.invalidate(); S.light = {dir:{x:-0.45, y:0.85}, elev:0.8, colour:'#fff1d0', shadow:'#4a5670'};
      let threw = null; const t0 = performance.now();
      try { S.build(fake, {season:'summer', host:'bandits', time:'day'}); } catch (e) { threw = e; }
      const ms = performance.now() - t0;
      ok('build of a 14x12 map with every terrain id does not throw' + (threw ? ' (' + threw.message + ')' : ''), !threw);
      ok('items: walls, palisade, cliff, building, tent, rubble, boulder and trees all present', ['wall', 'palisade', 'cliff', 'building', 'tent', 'rubble', 'boulder', 'oak', 'pine', 'birch'].every(k => S.list.some(it => it.kind === k)));
      ok('every item has an image, finite numbers and a shadow', S.list.length > 0 && S.list.every(it => it.img && it.img.width > 0 && [it.x, it.y, it.ax, it.ay, it.s].every(Number.isFinite) && it.shadow && it.shadow.img));
      ok('sprites are sane sizes (under 400 px a side after scale)', S.list.every(it => it.img.width * it.s < 400 && it.img.height * it.s < 400));
      ok('tall set on trees, walls, buildings; not on rubble, boulders, cliffs', S.list.every(it => it.vo3 || (['oak', 'pine', 'birch', 'dead', 'wall', 'building', 'tent', 'palisade', 'gate'].includes(it.kind)) === it.tall))   /* VO-3 (js/3d/vo3.js) repaints some items with its own sprites and its own flag, and the gate kind is tall */;
      ok('items sorted by baseline', S.list.every((it, i) => !i || S.list[i - 1].y <= it.y));
      const vis = S.items(0, 0), n1 = vis.length, again = S.items(0, 0);
      ok('items(0,0) returns the visible subset, the same array each call', n1 > 0 && n1 <= S.list.length && again === vis);
      ok('items far away returns none', S.items(100000, 100000).length === 0);
      const cc = cv(64, 64), cg = cc.getContext('2d'); let drew = null; try { S.drawShadows(cg, 0, 0); } catch (e) { drew = e; }
      ok('drawShadows does not throw and leaves the context state alone', !drew && cg.globalAlpha === 1 && cg.globalCompositeOperation === 'source-over');
      ok('sheet renders', (() => { try { const c = S.sheet('summer'); return c.width > 100 && c.height > 100; } catch (e) { details.push('sheet: ' + e.message); return false; } })());
      ok('second build of the same map is a no-op (cached)', (() => { const n = S.stats.sprites; S.build(fake, {season:'summer'}); return S.stats.sprites === n; })());
      const cold = !window.__stSelfTestRan; window.__stSelfTestRan = true;   /* the first build after a page load pays the one-off JIT and material cost (about 1.2 s hidden, 0.6 s shown), so it gets a wider limit than a warm one */
      ok((cold ? 'first build under 2500 ms' : 'build under 500 ms') + ' for the fake map (' + ms.toFixed(0) + ' ms, ' + S.stats.sprites + ' sprites)', ms < (cold ? 2500 : 500));
      ok('engine light vector restored', !L0 || (R3D_LIGHT[0] === L0[0] && R3D_LIGHT[1] === L0[1] && R3D_LIGHT[2] === L0[2]));
      ok('engine frame size restored', !R0 || (R3D.W === R0[0] && R3D.H === R0[1] && R3D.FEET === R0[2] && R3D.CX === R0[3]));
      ok('no STRUCT frames left in the figure cache', typeof R3D === 'undefined' || !R3D.cache || !Object.keys(R3D.cache).some(k => k.startsWith('struct:')));
      ok('the real MAP is untouched', window.MAP === realMap && (!realMap || !realMap.g || realMap.g.slice(0, 64).join(',') === realG));
      ok('off: nothing here hooks the game (no draw, no drawTerrain, no contractBodies patch)', !S.hooked);
    } finally {
      S.cache = wasCache; S.list = wasList; S.built = wasBuilt; S.stats = wasStats; S.light = wasLight;
    }
    return {pass, fail, details, ok: fail === 0};
  };
})();
