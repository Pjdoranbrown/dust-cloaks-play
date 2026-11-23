/* INDEX F48 - F-48 Art (Fable, 2026-11-15). Notes: audits/f48-art-review.md.
   WHAT   No pixel art on the enemy portraits (Parley, Manual bestiary, prisoners, nemeses, raid notice). Every foe's portrait is
          the game's own 3D field figure, ray-cast large and smooth: a head-and-shoulders bust for people, the whole body for
          beasts, mounts and engines, on a dark backdrop in an iron frame (gold line for commanders).
   HOW    enemyIconURL(kind) is wrapped. The first call for a kind returns a plain framed backdrop at once and queues the render
          (about half a second each, one per timer tick); when it lands every <img> showing that kind is swapped. Later calls
          return the finished picture. Any throw falls back to the old icon.
   KNOBS  ART48.ss = render scale (3). INT-1 group 10: ART48.on baked in (no switch).
   TEST   ART48.selfTest(); ART48.sheet() returns a canvas with every kind. */
(function(){
  'use strict';
  if (window.ART48) return;
  const A = window.ART48 = {ss:3, done:{}, wait:{}, queue:[], busy:false, fails:{}};
  const has = n => { try { return (0, eval)('typeof ' + n) !== 'undefined'; } catch (e) { return false; } };
  const ready = () => ['R3D', 'R3D_CLIPS', 'r3dRender', 'BESTIARY', 'enemySprite'].every(has);
  const S = 144;
  const hex = h => { const n = parseInt(String(h || '#555555').replace('#', '').slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  function recipe(kind){
    let rec = null;
    try { if (window.MON3D && MON3D.recipe) rec = MON3D.recipe(kind); } catch (e) {}
    if (!rec) try { rec = (0, eval)('r3dRecipeForSprite')(enemySprite(kind)); } catch (e) {}
    return rec;
  }
  // One large frame of the idle pose (the same trick as r3dRenderSS, without the downsample).
  function big(rec, ss){
    const W = R3D.W, H = R3D.H, FEET = R3D.FEET, CX = R3D.CX, SC = R3D.SC, clips = R3D_CLIPS[rec.rig], def = clips.idle || clips[Object.keys(clips)[0]];
    R3D.W = W * ss; R3D.H = H * ss; R3D.FEET = FEET * ss; R3D.CX = CX * ss; R3D.SC = SC * ss; R3D.RB = null; R3D.SSPASS = true;
    try { return r3dRender(rec, def.fn(0, rec), 1); }
    finally { R3D.W = W; R3D.H = H; R3D.FEET = FEET; R3D.CX = CX; R3D.SC = SC; R3D.RB = null; R3D.SSPASS = false; }
  }
  function bounds(cv){
    const w = cv.width, h = cv.height, d = cv.getContext('2d', {willReadFrequently:true}).getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  }
  function headX(cv, bb){   // centre of the top quarter of the figure
    const w = cv.width, y0 = bb[1], h = Math.max(1, Math.round(bb[3] * 0.25)), d = cv.getContext('2d', {willReadFrequently:true}).getImageData(0, y0, w, h).data;
    let sx = 0, n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24){ sx += x; n++; }
    return n ? sx / n : bb[0] + bb[2] / 2;
  }
  function backdrop(kind){
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), b = BESTIARY[kind] || {}, t = hex(b.colour), m = k => 'rgb(' + t.map(v => Math.round(v * k + 22 * (1 - k))).join(',') + ')';
    const gr = g.createRadialGradient(S * 0.5, S * 0.42, 6, S * 0.5, S * 0.5, S * 0.78);
    gr.addColorStop(0, m(0.42)); gr.addColorStop(0.6, m(0.2)); gr.addColorStop(1, '#0c0a09');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  }
  function frame(g, kind){
    const b = BESTIARY[kind] || {};
    g.strokeStyle = '#17110d'; g.lineWidth = 8; g.strokeRect(4, 4, S - 8, S - 8);
    g.strokeStyle = b.boss ? '#b8923c' : '#6e2a22'; g.lineWidth = 2; g.strokeRect(8, 8, S - 16, S - 16);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.strokeRect(1.5, 1.5, S - 3, S - 3);
  }
  A.canvas = function(kind){
    const rec = recipe(kind); if (!rec) return null;
    const person = rec.rig === 'humanoid', ss = Math.max(1, Math.round((person ? A.ss : Math.max(2, A.ss - 1)) * 96 / R3D.W)), u = R3D.W * ss / 96, fig = big(rec, ss);   // the base frame is 96 wide in the crisp style and smaller in others: always render to the same size
    let sx, sy, sw, sh;
    if (person){ const bb = bounds(fig); if (!bb) return null; sw = sh = Math.max(26 * u, Math.min(36 * u, bb[3] * 0.5)); sy = bb[1] - sh * 0.14; sx = headX(fig, bb) - sw / 2; }   // head and shoulders, found from the figure itself (short folk and tall hats both fit)   // head and shoulders (hat tips sit near 30)
    else { const bb = bounds(fig); if (!bb) return null; sw = sh = Math.max(bb[2], bb[3]) * 1.12; sx = bb[0] + bb[2] / 2 - sw / 2; sy = bb[1] + bb[3] / 2 - sh / 2 - sh * 0.02; }
    const c = backdrop(kind), g = c.getContext('2d');
    if (!person){ g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(S / 2, S * 0.86, S * 0.34, S * 0.06, 0, 0, 7); g.fill(); }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(fig, sx, sy, sw, sh, 6, 6, S - 12, S - 12);
    const v = g.createRadialGradient(S / 2, S / 2, S * 0.38, S / 2, S / 2, S * 0.74); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = v; g.fillRect(0, 0, S, S);
    frame(g, kind);
    return c;
  };
  // F-47 b (Phase 3): painted foe portraits (assets/foes49.js, one 144 px painting per kind, loaded after the game starts).
  // A kind with a painting shows it in the same iron or gold frame; a kind without one keeps the 3D bust. ART48.paint = false undoes it.
  A.paint = true; A.painted = {};
  const canvas3d = A.canvas;
  A.canvas = function(kind){
    const im = A.paint && A.painted[kind];
    if (!im) return canvas3d(kind);
    const c = backdrop(kind), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, 6, 6, S - 12, S - 12);
    const v = g.createRadialGradient(S / 2, S / 2, S * 0.42, S / 2, S / 2, S * 0.76); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = v; g.fillRect(0, 0, S, S);
    frame(g, kind);
    return c;
  };
  A.setPaint = function(v){
    A.paint = !!v; const old = A.done; A.done = {};
    for (const k in old){ const u = A.url(k); for (const im of document.querySelectorAll('img')) if (im.src === old[k]) im.src = u; }
  };
  function loadPainted(){
    const tag = document.createElement('script'); tag.src = 'assets/foes49.js';
    tag.onerror = () => { A.fails.painted = 'assets/foes49.js not found'; };
    tag.onload = async () => {
      const D = window.FOE49_IMG || {}; let n = 0;
      for (const k in D){ try { A.painted[k] = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = D[k]; }); n++; } catch (e){ A.fails['painted_' + k] = 'image'; } }
      delete window.FOE49_IMG; A.paintedN = n;
      if (n && A.paint) A.setPaint(true);   // swap any foe pictures already on screen
    };
    document.head.appendChild(tag);
  }
  try { if (document.readyState === 'complete') setTimeout(loadPainted, 900); else window.addEventListener('load', () => setTimeout(loadPainted, 900)); } catch (e){}
  function placeholder(kind){
    if (!A.wait[kind]){ const c = backdrop(kind); frame(c.getContext('2d'), kind); A.wait[kind] = c.toDataURL('image/jpeg', 0.8) + '#e48-' + kind + '#pt'; }
    return A.wait[kind];
  }
  function pump(){
    if (A.busy) return; A.busy = true;
    const step = () => {
      const kind = A.queue.shift(); if (!kind){ A.busy = false; return; }
      try {
        const c = A.canvas(kind);
        if (c){ const u = A.done[kind] = c.toDataURL('image/jpeg', 0.92) + '#pt';
          for (const im of document.querySelectorAll('img[src*="#e48-' + kind + '#"]')) im.src = u; }
        else A.fails[kind] = 'no figure';
      } catch (e){ A.fails[kind] = String(e && e.message || e); }
      setTimeout(step, 30);
    };
    setTimeout(step, 30);
  }
  A.url = function(kind){
    if (A.done[kind]) return A.done[kind];
    if (A.fails[kind]) return null;
    if (A.queue.indexOf(kind) < 0) A.queue.push(kind);
    pump();
    return placeholder(kind);
  };
  A.sheet = function(){
    const ks = Object.keys(BESTIARY), n = 11, c = document.createElement('canvas'); c.width = n * 150; c.height = Math.ceil(ks.length / n) * 150;
    const g = c.getContext('2d'); g.fillStyle = '#d8c8a0'; g.fillRect(0, 0, c.width, c.height);
    ks.forEach((k, i) => { const p = A.canvas(k); if (p) g.drawImage(p, (i % n) * 150 + 3, Math.floor(i / n) * 150 + 3); });
    return c;
  };
  A.selfTest = function(){
    const out = [], ok = (name, v) => out.push({name, ok:!!v});
    ok('ART48: the figure renderer is present', ready());
    let c = null; try { c = A.canvas('brigand'); } catch (e) {}
    ok('ART48: a foe portrait paints at 144 px, smooth (not the 4x pixel crop)', c && c.width === S && c.height === S);
    ok('ART48: every bestiary kind has a figure recipe', Object.keys(BESTIARY).every(k => !!recipe(k)));
    const pk = Object.keys(A.painted)[0];
    if (pk){   // painted foes loaded: the painting differs from the 3D bust, and ART48.paint = false brings the bust back
      const sum = cv => { const d = cv.getContext('2d').getImageData(0, 0, S, S).data; let s = 0; for (let i = 0; i < d.length; i += 97) s += d[i]; return s; };
      const a = A.canvas(pk), wp = A.paint; A.paint = false; const b = A.canvas(pk); A.paint = wp;
      ok('ART48: a painted foe portrait is 144 px and differs from the 3D bust', a && a.width === S && b && sum(a) !== sum(b));
    }
    return {pass:out.filter(o => o.ok).length, fail:out.filter(o => !o.ok).length, details:out, ok:out.every(o => o.ok)};
  };

  /* ---- War Table desk props and wax seals: smooth shaded shapes in place of the 4x pixel art ------------------------------- */
  const VK = 8, vec = {};
  // fn draws in the old sprite's own units (w x h); the canvas is VK times larger, so the picture keeps its place and size on the page
  function vurl(key, w, h, fn){
    if (vec[key] === undefined){
      try { const c = document.createElement('canvas'); c.width = w * VK; c.height = h * VK; const g = c.getContext('2d'); g.scale(VK, VK); g.lineJoin = g.lineCap = 'round'; fn(g); vec[key] = c.toDataURL('image/png') + '#a48'; }
      catch (e){ vec[key] = ''; }
    }
    return vec[key];
  }
  const lin = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => q.addColorStop(i / (st.length - 1), c)); return q; };
  const rad = (g, x, y, r0, r1, st) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); st.forEach((c, i) => q.addColorStop(i / (st.length - 1), c)); return q; };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); };
  const DRAW = {
    candle:[14, 30, g => {
      g.fillStyle = rad(g, 7, 4, 0.5, 7, ['rgba(255,200,90,.45)', 'rgba(255,170,60,0)']); g.fillRect(0, 0, 14, 12);
      ell(g, 7, 27.6, 6.6, 1.9); g.fillStyle = '#4e3812'; g.fill();
      ell(g, 7, 26.8, 6.2, 1.7); g.fillStyle = lin(g, 1, 0, 13, 0, ['#c9a23e', '#8a6a2a', '#6a4a1a']); g.fill();
      rr(g, 4, 9, 6, 17.6, 1.2); g.fillStyle = lin(g, 4, 0, 10, 0, ['#fffaf0', '#ece4cf', '#bdb294']); g.fill();
      rr(g, 9.2, 12.5, 1.7, 5.5, 0.8); g.fillStyle = '#e4dcc6'; g.fill();
      ell(g, 7, 9.3, 2.9, 0.8); g.fillStyle = '#d8ceb2'; g.fill();
      g.strokeStyle = '#2a2520'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(7, 9.2); g.lineTo(7, 6.6); g.stroke();
      g.beginPath(); g.moveTo(7, 0.4); g.bezierCurveTo(9.4, 3.6, 9, 7.2, 7, 7.4); g.bezierCurveTo(5, 7.2, 4.6, 3.6, 7, 0.4); g.fillStyle = lin(g, 0, 0.4, 0, 7.4, ['#ffe98a', '#ffb030', '#e2661c']); g.fill();
      g.beginPath(); g.moveTo(7, 3); g.bezierCurveTo(8, 4.6, 7.9, 6.6, 7, 6.8); g.bezierCurveTo(6.1, 6.6, 6, 4.6, 7, 3); g.fillStyle = '#fff6c8'; g.fill();
    }],
    dice:[22, 12, g => {
      const die = (x, y, a, b, pips, pc) => { rr(g, x, y + 0.9, 8.6, 8.6, 1.5); g.fillStyle = b; g.fill(); rr(g, x, y, 8.6, 8.4, 1.5); g.fillStyle = lin(g, x, y, x + 8.6, y + 8.4, [a, a, b]); g.fill();
        g.fillStyle = pc; for (const [px, py] of pips){ ell(g, x + px, y + py, 0.75, 0.75); g.fill(); } };
      die(0.3, 2.2, '#f4ecdc', '#b4a482', [[2.3, 2.3], [4.3, 4.2], [6.3, 6.1]], '#1c1a18');
      die(11.4, 0.3, '#d2513f', '#7a2a20', [[2.4, 2.4], [6.2, 2.4], [2.4, 6], [6.2, 6]], '#fff4ea');
    }],
    dagger:[30, 8, g => {
      g.beginPath(); g.moveTo(8.6, 2.9); g.lineTo(26.4, 3.2); g.lineTo(29.4, 4); g.lineTo(26.4, 4.8); g.lineTo(8.6, 5.1); g.closePath(); g.fillStyle = lin(g, 0, 2.9, 0, 5.1, ['#f4f7fa', '#b9c2cc', '#7c8794']); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(9, 3.9); g.lineTo(28.6, 4); g.stroke();
      rr(g, 1.2, 3, 6.4, 2, 0.9); g.fillStyle = lin(g, 0, 3, 0, 5, ['#7a5230', '#4a2e16']); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 0.25; for (let x = 2.4; x < 7; x += 1.1){ g.beginPath(); g.moveTo(x, 3.1); g.lineTo(x + 0.5, 4.9); g.stroke(); }
      rr(g, 7, 0.8, 1.8, 6.4, 0.8); g.fillStyle = lin(g, 7, 0, 8.8, 0, ['#f0d060', '#b08a2a']); g.fill();
      ell(g, 0.95, 4, 1, 1.15); g.fillStyle = rad(g, 0.7, 3.7, 0.1, 1.2, ['#ffe98a', '#b08a2a']); g.fill();
    }],
    ink:[18, 26, g => {
      g.beginPath(); g.moveTo(2.6, 25.4); g.lineTo(2, 19); g.quadraticCurveTo(2, 16.6, 4.6, 16); g.lineTo(4.6, 14.2); g.lineTo(9.6, 14.2); g.lineTo(9.6, 16); g.quadraticCurveTo(12.2, 16.6, 12.2, 19); g.lineTo(11.6, 25.4); g.closePath();
      g.fillStyle = lin(g, 2, 0, 12.2, 0, ['#4c4c6a', '#2a2a3c', '#16161f']); g.fill();
      rr(g, 4, 13.4, 6.2, 1.5, 0.6); g.fillStyle = '#56566e'; g.fill();
      g.strokeStyle = 'rgba(200,205,255,.35)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(3.6, 18.4); g.lineTo(3.9, 23.6); g.stroke();
      g.beginPath(); g.moveTo(7.2, 14.6); g.quadraticCurveTo(9.6, 8, 13.4, 0.8); g.quadraticCurveTo(17.2, 3.4, 13.2, 9.4); g.quadraticCurveTo(11, 12.4, 8.2, 14.8); g.closePath(); g.fillStyle = lin(g, 9, 2, 15, 9, ['#fbf6ea', '#d6ccb4']); g.fill();
      g.strokeStyle = '#9a8f78'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(7.4, 15); g.quadraticCurveTo(10.2, 8, 13.6, 1.2); g.stroke();
      g.strokeStyle = 'rgba(120,110,90,.45)'; g.lineWidth = 0.2; for (let t = 0.2; t < 0.95; t += 0.14){ const x = 7.6 + (13.4 - 7.6) * t, y = 14.4 - 13 * t; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2.2, y + 0.4); g.stroke(); }
    }],
    coins:[16, 12, g => {
      const coin = (x, y, rx) => { g.fillStyle = '#a8801e'; g.fillRect(x - rx, y, rx * 2, 1.5); ell(g, x, y + 1.5, rx, rx * 0.3); g.fill(); ell(g, x, y, rx, rx * 0.3); g.fillStyle = lin(g, x - rx, 0, x + rx, 0, ['#fff2a0', '#e8c040', '#c49a28']); g.fill(); };
      coin(12, 9.4, 3.2); for (let i = 0; i < 4; i++) coin(6.4, 9 - i * 2, 4.6);
    }]
  };
  function sealDraw(g, glyphName, col){
    const c = hex(/^#[0-9a-f]{3}$/i.test(col) ? '#' + col.slice(1).replace(/./g, '$&$&') : col), dark = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11 < 75, mixc = k => 'rgb(' + c.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(',') + ')';
    let h = 0; for (const ch of glyphName + col) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    g.beginPath(); for (let i = 0; i <= 48; i++){ const a = i / 48 * Math.PI * 2, r = 8.1 + 0.5 * Math.sin(a * 3 + h % 7) + 0.35 * Math.sin(a * 7 + h % 11); const x = 9 + Math.cos(a) * r, y = 9 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath();
    g.fillStyle = rad(g, 7, 6.5, 1, 10, [mixc(1.3), mixc(1), mixc(0.62)]); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.35; g.stroke();
    ell(g, 9, 9, 6.1, 6.1); g.fillStyle = mixc(0.86); g.fill(); g.strokeStyle = mixc(0.55); g.lineWidth = 0.5; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 0.4; g.beginPath(); g.arc(9, 9, 6.6, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    const gm = (cl) => A.glyphMask(glyphName, cl, VK * 2);
    if (dark){ g.globalAlpha = 0.5; g.drawImage(gm('#000000'), 4.7, 4.7, 9, 9); g.globalAlpha = 1; g.drawImage(gm(mixc(2.1)), 4.5, 4.5, 9, 9); }
    else { g.globalAlpha = 0.25; g.drawImage(gm('#ffffff'), 4.7, 4.7, 9, 9); g.globalAlpha = 1; g.drawImage(gm(mixc(0.5)), 4.5, 4.5, 9, 9); }
  }
  A.prop = k => DRAW[k] ? vurl('p:' + k, DRAW[k][0], DRAW[k][1], DRAW[k][2]) : '';
  A.seal = (glyphName, col) => vurl('seal:' + glyphName + col, 18, 18, g => sealDraw(g, String(glyphName), String(col)));
  function hookProps(){
    try {
      const st = document.createElement('style'); st.textContent = 'img[src$="#a48"]{image-rendering:auto!important}'; document.head.appendChild(st);
      const P0 = (0, eval)('propURL');
      for (const k of Object.keys(DRAW)){ const f0 = P0[k]; P0[k] = () => (A.prop(k)) || f0(); }
      const s0 = (0, eval)('sealURL'); window.__art48_seal = (gl, col) => (A.seal(gl, col)) || s0(gl, col);
      (0, eval)('sealURL = window.__art48_seal');
    } catch (e){ A.fails.props = String(e && e.message || e); }
  }
  hookProps();

  /* ---- Campaign map, chapter banner, and the three specialist icons: smooth in place of pixel art --------------------------- */
  const G0 = n => (0, eval)(n);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // a 7x7 glyph bitmap as a smooth, antialiased shape: canvas of 9k x 9k (one cell of padding all round)
  function glyphMask(name, col, k){
    let rows = null; try { rows = G0('GLYPHS')[name]; } catch (e) {}
    const n = 9, s = document.createElement('canvas'); s.width = s.height = n; const sg = s.getContext('2d');
    if (rows){ sg.fillStyle = '#fff'; for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '#') sg.fillRect(x + 1, y + 1, 1, 1); }
    const c = document.createElement('canvas'); c.width = c.height = n * k; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, n * k, n * k);
    const d = g.getImageData(0, 0, n * k, n * k), p = d.data, cs = String(col), rgb = /^rgb/.test(cs) ? cs.match(/[0-9]+/g).slice(0, 3).map(Number) : hex(/^#[0-9a-f]{3}$/i.test(cs) ? '#' + cs.slice(1).replace(/./g, '$&$&') : cs);
    for (let i = 0; i < p.length; i += 4){ const a = sstep(0.36, 0.5, p[i + 3] / 255); p[i] = rgb[0]; p[i + 1] = rgb[1]; p[i + 2] = rgb[2]; p[i + 3] = a * 255; }
    g.putImageData(d, 0, 0); return c;
  }
  A.glyphMask = glyphMask;
  function mapCanvas(){
    const rng = G0('rng'), valueNoise = G0('valueNoise');
    const W = 180, H = 104, K = 6, r = rng(616), n = valueNoise(W, H, 15, r), n2 = valueNoise(W, H, 5, r);
    const land = new Uint8Array(W * H), f = document.createElement('canvas'); f.width = W; f.height = H; const fg = f.getContext('2d'), fd = fg.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const ex = (x - W * 0.52) / (W * 0.49), ey = (y - H * 0.47) / (H * 0.50);
      let v = n(x, y) * 0.75 + n2(x, y) * 0.25 - (ex * ex + ey * ey) * 0.52;
      const dm = Math.hypot(x - W * 0.27, y - H * 0.83);
      if (dm < 11) v = 0.20 + (8 - dm) * 0.05;                                  // the Island of Mendor in its ring of sea
      land[y * W + x] = v > 0.20 ? 1 : 0;
      const q = Math.max(0, Math.min(255, 128 + (v - 0.20) * 620)), i = (y * W + x) * 4; fd.data[i] = fd.data[i + 1] = fd.data[i + 2] = q; fd.data[i + 3] = 255;
    }
    fg.putImageData(fd, 0, 0);
    const c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(f, -K / 2, -K / 2, W * K + K, H * K + K);   // half a cell out: the old map drew each cell from its corner
    const d = g.getImageData(0, 0, W * K, H * K), p = d.data, mix = (a, b, t) => a + (b - a) * t;
    const base = [220, 203, 164], frost = [214, 226, 234], steppe = [214, 198, 138], spine = [198, 184, 154], ink = [74, 59, 42];
    for (let py = 0; py < H * K; py++) for (let px = 0; px < W * K; px++){
      const i = (py * W * K + px) * 4, v = p[i] / 255, ux = px / (W * K), uy = py / (H * K);
      const grain = ((px * 13 + py * 7) % 17 === 0 ? -5 : 0) + ((px * 5 + py * 11) % 23 === 0 ? 4 : 0);
      let col;
      if (v < 0.5){ const t = sstep(0.5, 0.2, v), sh = sstep(0.42, 0.5, v); col = [mix(mix(178, 150, t), 204, sh * 0.6), mix(mix(198, 172, t), 218, sh * 0.6), mix(mix(194, 172, t), 210, sh * 0.6)]; }
      else {
        const fr = sstep(0.27, 0.21, uy) * sstep(0.33, 0.37, ux) * sstep(0.74, 0.70, ux);
        const st = sstep(0.63, 0.67, ux) * sstep(0.26, 0.30, uy) * sstep(0.78, 0.74, uy) * (1 - fr);
        const sp = sstep(0.43, 0.47, ux) * sstep(0.67, 0.63, ux) * (1 - fr);
        col = [0, 1, 2].map(j => { let b = base[j]; b = mix(b, spine[j], sp); b = mix(b, steppe[j], st); b = mix(b, frost[j], fr); return b + grain; });
        const e = sstep(0.5, 0.58, v); col = col.map((b, j) => mix(b - 16, b, e));   // a soft shadow just inside the coast
        const line = 1 - sstep(0.5, 0.535, v); col = col.map((b, j) => mix(b, ink[j], line));
      }
      p[i] = col[0]; p[i + 1] = col[1]; p[i + 2] = col[2]; p[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    g.save(); g.scale(K, K); g.lineJoin = g.lineCap = 'round';
    // the Central Spine: the same peaks, in the same places, as shaded mountains
    for (let i = 0; i < 14; i++){ const x = 86 + (i % 3) * 3 + (r() * 4 | 0), y = 14 + i * 5; if (y < H - 10){
      g.beginPath(); g.moveTo(x - 0.4, y + 3); g.lineTo(x + 2.5, y - 0.3); g.lineTo(x + 5.4, y + 3); g.closePath(); g.fillStyle = '#8a7860'; g.fill();
      g.beginPath(); g.moveTo(x + 2.5, y - 0.3); g.lineTo(x + 5.4, y + 3); g.lineTo(x + 2.9, y + 3); g.lineTo(x + 2.1, y + 1.6); g.closePath(); g.fillStyle = '#5a4a38'; g.fill();
      g.beginPath(); g.moveTo(x + 1.7, y + 0.6); g.lineTo(x + 2.5, y - 0.3); g.lineTo(x + 3.2, y + 0.5); g.lineTo(x + 2.5, y + 0.9); g.closePath(); g.fillStyle = '#f2efe6'; g.fill();
      g.strokeStyle = '#4a3b2a'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(x - 0.4, y + 3); g.lineTo(x + 2.5, y - 0.3); g.lineTo(x + 5.4, y + 3); g.stroke(); } }
    // the western and frontier forests: small round crowns
    for (let i = 0; i < 55; i++){ const x = 18 + r() * 64 | 0, y = 20 + r() * 52 | 0; if (land[y * W + x]){
      g.fillStyle = '#3f5a2c'; g.beginPath(); g.arc(x + 0.6, y + 0.75, 0.85, 0, 7); g.fill(); g.fillStyle = '#5f8040'; g.beginPath(); g.arc(x + 0.45, y + 0.5, 0.7, 0, 7); g.fill(); } }
    // the two rivers
    for (const startX of [68, 128]){ let rx = startX, ry = 18; const pts = [];
      for (let i = 0; i < 72; i++){ rx += (r() - .48) * 1.6; ry += 1; if (ry >= H || !land[(ry | 0) * W + (rx | 0)]) break; pts.push([rx + 0.5, ry + 0.5]); }
      if (pts.length > 2){ g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
        g.strokeStyle = '#3c5c7c'; g.lineWidth = 1.1; g.stroke(); g.strokeStyle = '#6f97b8'; g.lineWidth = 0.55; g.stroke(); } }
    // compass rose
    g.translate(164.5, 90.5); g.strokeStyle = '#4a3b2a'; g.lineWidth = 0.3; g.beginPath(); g.arc(0, 0, 5.2, 0, 7); g.stroke();
    for (let q = 0; q < 4; q++){ g.save(); g.rotate(q * Math.PI / 2); g.beginPath(); g.moveTo(0, -7); g.lineTo(1.1, -1.1); g.lineTo(0, 0); g.closePath(); g.fillStyle = q ? '#4a3b2a' : '#8b0000'; g.fill();
      g.beginPath(); g.moveTo(0, -7); g.lineTo(-1.1, -1.1); g.lineTo(0, 0); g.closePath(); g.fillStyle = q ? '#b8a888' : '#c84a3a'; g.fill(); g.strokeStyle = '#4a3b2a'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(0, -7); g.lineTo(1.1, -1.1); g.lineTo(0, 0); g.lineTo(-1.1, -1.1); g.closePath(); g.stroke(); g.restore(); }
    g.restore();
    return c;
  }
  A.map = () => { if (vec.map === undefined){ try { vec.map = mapCanvas().toDataURL('image/jpeg', 0.92) + '#a48'; } catch (e){ vec.map = ''; A.fails.map = String(e && e.message || e); } } return vec.map; };
  // the hanging chapter banner, in the old sprite's 14 x 17 units
  function bannerDraw(g, b){
    const W = 12, H = 13, c1 = b.c1, c2 = b.c2;
    const shape = () => { g.beginPath(); g.moveTo(1, 1); g.lineTo(13, 1); g.lineTo(13, 16.4); g.lineTo(7, 13.8); g.lineTo(1, 16.4); g.closePath(); };
    g.save(); shape(); g.clip(); g.translate(1, 1); g.fillStyle = c1; g.fillRect(0, 0, W, H + 4); g.fillStyle = c2;
    if (b.div === 'pale') g.fillRect(W / 2, 0, W / 2, H + 4);
    if (b.div === 'fess') g.fillRect(0, H / 2, W, H);
    if (b.div === 'bend'){ g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H); g.closePath(); g.fill(); }
    if (b.div === 'chevron'){ g.beginPath(); g.moveTo(0, 4.4); g.lineTo(6, 9.6); g.lineTo(12, 4.4); g.lineTo(12, 18); g.lineTo(0, 18); g.closePath(); g.fill(); }
    if (b.div === 'quarterly'){ g.fillRect(W / 2, 0, W / 2, H / 2); g.fillRect(0, H / 2, W / 2, H); }
    if (b.div === 'saltire'){ g.strokeStyle = c2; g.lineWidth = 2.2; g.lineCap = 'butt'; g.beginPath(); g.moveTo(-1, -1); g.lineTo(W + 1, H + 1); g.moveTo(W + 1, -1); g.lineTo(-1, H + 1); g.stroke(); }
    if (b.div === 'bordure'){ g.fillRect(0, 0, 1.2, H + 4); g.fillRect(W - 1.2, 0, 1.2, H + 4); g.fillRect(0, 0, W, 1.2); }
    g.drawImage(glyphMask(b.glyph, b.charge, VK * 2), 1, 2, 9, 9);
    const fold = g.createLinearGradient(0, 0, W, 0); [['rgba(0,0,0,.22)', 0], ['rgba(255,255,255,.10)', 0.22], ['rgba(0,0,0,.10)', 0.5], ['rgba(255,255,255,.08)', 0.76], ['rgba(0,0,0,.24)', 1]].forEach(s => fold.addColorStop(s[1], s[0]));
    g.fillStyle = fold; g.fillRect(0, 0, W, H + 4);
    g.fillStyle = lin(g, 0, 0, 0, 2.2, ['rgba(0,0,0,.3)', 'rgba(0,0,0,0)']); g.fillRect(0, 0, W, 2.2);
    g.restore();
    shape(); g.strokeStyle = '#1c1a18'; g.lineWidth = 0.45; g.stroke();
    rr(g, 0.3, 0.35, 13.4, 1.1, 0.5); g.fillStyle = lin(g, 0, 0.35, 0, 1.45, ['#8a6a3a', '#4a3216']); g.fill();
    for (const x of [0.5, 13.5]){ g.beginPath(); g.arc(x, 0.9, 0.6, 0, 7); g.fillStyle = '#d4af37'; g.fill(); }
  }
  A.banner = b => vurl('bn:' + b.div + b.c1 + b.c2 + b.charge + b.glyph, 14, 17, g => bannerDraw(g, b));
  function hookMap(){
    try {
      const m0 = G0('mapURL'); window.__art48_map = () => (A.map()) || m0(); G0('mapURL = window.__art48_map');
      const t0 = G0('toURL'), BN = /^bn:([a-z]+)(#[0-9a-fA-F]{6})(#[0-9a-fA-F]{6})(#[0-9a-fA-F]{6})([a-z]+)B?$/;
      window.__art48_toURL = function(key, make, scale){ if (typeof key === 'string' && key.charCodeAt(0) === 98){ const m = BN.exec(key); if (m){ const u = A.banner({div:m[1], c1:m[2], c2:m[3], charge:m[4], glyph:m[5]}); if (u) return u; } } return t0.apply(this, arguments); };
      G0('toURL = window.__art48_toURL');
      // a Trader, Scribe or Bard with no painting of their own borrows a painted one (as the hired Scribe and Bard already do)
      const p0 = G0('portIdx'), BORROW = {TRADER:'FOLK_HERO', SCRIBE:'MAGE', BARD:'CLERIC'};
      window.__art48_portIdx = p => (p && !p.portSpec && BORROW[p.spec]) ? p0(Object.assign({}, p, {portSpec:BORROW[p.spec]})) : p0(p);
      G0('portIdx = window.__art48_portIdx');
    } catch (e){ A.fails.map = String(e && e.message || e); }
  }
  hookMap();

  function hook(){
    if (!has('enemyIconURL')) return;
    const f0 = (0, eval)('enemyIconURL');
    (0, eval)('enemyIconURL = window.__art48_icon');
    void f0;
  }
  window.__art48_icon = (function(){
    let f0 = null;
    try { f0 = (0, eval)('enemyIconURL'); } catch (e) {}
    return function(kind){
      if (BESTIARY[kind] && BESTIARY[kind].person){ try { const u = portraitURL(BESTIARY[kind].person, false); if (u) return u; } catch (e) {} }   // a tavern mate: their own painted face (S6-C note 10)
      if (ready() && BESTIARY[kind]){ try { const u = A.url(kind); if (u) return u; } catch (e) {} }
      return f0 ? f0(kind) : '';
    };
  })();
  hook();
})();

/* INDEX FX48 - F-48 Art sanity (effects): floating words that start on top of one another (CRITICAL, +1 COIN, CALLED SHOT
   from three mates in one moment) step up a line so each can be read; the blast is a soft fireball, not two flat discs
   (the blast itself is drawn in index.html and reads this same switch). Rollback: FX48 = false. */
(function(){
  'use strict';
  let f; try { f = (0, eval)('pop'); } catch (e) { return; }
  if (typeof f !== 'function') return;
  window.__fx48_pop = function(x, y, text, c){
    try {
      if (window.FX48 !== false){ const G = (0, eval)('G');
        if (G && G.fx && !(window.L1I !== false && G.t45 && !G.over)){ const w = 6 + String(text).length * 4.5;
          for (let n = 0; n < 4; n++){
            if (!G.fx.some(o => o.text && o.life > 30 && Math.abs(o.y - y) < 13 && Math.abs(o.x - x) < w + 6 + String(o.text).length * 4.5)) break;
            y -= 15; } } }
    } catch (e) {}
    return f.call(this, x, y, text, c);
  };
  (0, eval)('pop = window.__fx48_pop');
})();
