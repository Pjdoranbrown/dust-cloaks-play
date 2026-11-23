/* js/core/late-fixes.js (INT-1 step 2, 2026-11-16): INDEX 79 to 98 (sharp text, audit fixes, wall faces, build sites, VO-1 uplift).
   Cut unchanged from the inline script in index.html (old lines 25119 to 25543). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 79 - SHARP, READABLE TEXT AT ANY ZOOM
   THE CAUSE   The game canvas was sized in CSS pixels and stretched with
               "pixelated" scaling. On any screen with display scaling (Windows
               at 125% or 150%, every high-DPI laptop and phone) or with browser
               zoom, the whole picture, text included, was blown up with
               nearest-neighbour pixels: jagged letters even at 100% zoom.
   THE FIX     The canvas now has one canvas pixel per screen pixel (up to 2x;
               above that it is smoothed, not pixelated). The game still draws
               in CSS pixels: the context scales every transform underneath, so
               no drawing code changes. It re-sharpens on resize, browser zoom
               and when the window moves to another monitor.
   SMALL TEXT  No canvas text is drawn under 10.5px (labels, bars, the HUD's
               small print). Floating combat text is bold Georgia with a dark
               outline instead of thin Courier with a 1px shadow.
   SETTINGS    "Sharp text" (on; turn off for the old chunky look or on a slow
               machine) and "Text size": Normal, Large (115%), Larger (130%),
               which enlarges the menus and panels, and canvas text a little.
   MENUS       The smallest menu text (tags, flavour lines, mini buttons) is a
               touch bigger, and text uses the browser's legibility rendering.
   ROLLBACK    Delete from this comment to END INDEX 79, and undo the
               floating-text line marked "Index 79".
============================================================================ */
const TXT = {k:1};
const set79 = () => { try { return (typeof META !== 'undefined' && META) ? settings() : {}; } catch (e) { return {}; } };   // the canvas is sized before the save loads
const textScale = () => ({normal:1, large:1.15, larger:1.3})[set79().textSize] || 1;
const dprWanted = () => set79().sharp === false ? 1 : Math.min(2, Math.max(1, window.devicePixelRatio || 1));
/* UX text floor (audits/uiux/text-floor-1280-ruling.md): every word a player reads is at least 14 px on screen, after every transform and the
   CSS stretch of the canvas it is drawn on. hudPx(n) is font size n (drawing units) raised to that; where n already reads 14 or more (1920) it
   is n, unchanged. hudScreenK(c) is how many screen px one drawing unit of context c is now (the Deck layer's own pixel scale included).
   Rounded up to the half px fixFont keeps, so the rounding never takes a word back under. textScale still multiplies on top (fixFont).
   ROLLBACK: window.FLOOR14 = false. */
const FLOOR14_PX = 14;
const FLOOR14_ST = {t: -1, z: 1};
function floor14Z(){   // the page's own stretch of the game canvas (its on-screen width over its CSS width), read once a frame (a layout read)
  const t = (typeof G !== 'undefined' && G && G.frame) | 0; if (t === FLOOR14_ST.t && t) return FLOOR14_ST.z;
  let z = 1; try { const cv = canvas, w = parseFloat(cv.style.width) || cv.clientWidth, r = cv.getBoundingClientRect().width; if (w > 0 && r > 0) z = r / w; } catch (e) {}
  FLOOR14_ST.t = t; FLOOR14_ST.z = z; return z;
}
function hudScreenK(c){
  try { c = c || ctx; const cv = c.canvas, m = CanvasRenderingContext2D.prototype.getTransform.call(c), css = (parseFloat(cv.style.width) || cv.clientWidth || cv.width) * floor14Z();
    const s = Math.hypot(m.a, m.b) * css / cv.width; return s > 0 && isFinite(s) ? s : 1; } catch (e) { return 1; }
}
function hudPx(n, c){ if (window.FLOOR14 === false || !(n > 0)) return n; const s = hudScreenK(c); return n * s >= FLOOR14_PX - 0.01 ? n : Math.ceil(FLOOR14_PX / s * 2) / 2; }
const FONT_DESC = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
function fixFont(v){
  const k = 1 + (textScale() - 1) * 0.6;
  return String(v).replace(/(\d+(?:\.\d+)?)px/, (m, n) => { let s = parseFloat(n); if (s < 10.5) s = 10.5; return (Math.round(s * k * 2) / 2) + 'px'; });
}
// The main context: every transform is scaled to device pixels underneath; every font gets the floor and the text size.
function hookMainCtx(c){
  if (!c || c.__i79) return; c.__i79 = true;
  const P = CanvasRenderingContext2D.prototype, st = P.setTransform, gt = P.getTransform;
  c.setTransform = function(a, b, cc, d, e, f){ const k = TXT.k; if (a && typeof a === 'object') return st.call(this, a.a * k, a.b * k, a.c * k, a.d * k, a.e * k, a.f * k); return st.call(this, a * k, b * k, cc * k, d * k, e * k, f * k); };
  c.resetTransform = function(){ st.call(this, TXT.k, 0, 0, TXT.k, 0, 0); };
  c.getTransform = function(){ const m = gt.call(this), k = TXT.k; return new DOMMatrix([m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k]); };
  Object.defineProperty(c, 'font', {configurable:true, get(){ return FONT_DESC.get.call(this); }, set(v){ FONT_DESC.set.call(this, fixFont(v)); }});
}
resize = (function(prev){
  return function(){
    prev();
    try {
      TXT.k = dprWanted();
      canvas.width = Math.round(VW * TXT.k); canvas.height = Math.round(VH * TXT.k);
      canvas.style.width = VW + 'px'; canvas.style.height = VH + 'px';
      canvas.style.imageRendering = set79().sharp === false ? 'pixelated' : 'auto';
      hookMainCtx(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
      try { ctx.textRendering = 'optimizeLegibility'; } catch (e) {}
      if (G) G.bgPat = null;
    } catch (e) { console.warn('sharp canvas:', e); }
  };
})(resize);
window.addEventListener('resize', () => resize());                            // the boot listener holds the old function
(function watchDpr(){                                                         // another monitor, or browser zoom without a resize
  try { matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener('change', () => { resize(); watchDpr(); }, {once:true}); } catch (e) {}
})();
function applyTextSize(){ document.documentElement.style.setProperty('--uiz', String(textScale())); }
{ const st = document.createElement('style');
  st.textContent = `body{text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    .tag{font-size:14px;letter-spacing:0.5px}.fl{font-size:14px}.mini button{font-size:14px}.colnote{font-size:14px}
    .screen > *, #camp-panel, #askbox .ab, #chronicle > div, #tb-settings, #camp-hint, #camp-note{zoom:var(--uiz,1)}
    #topbar .stat{flex:0 1 auto} #topbar span.stat{min-width:min-content;white-space:normal;line-height:1.15;text-align:center} #topbar .tb{flex:0 0 auto}   /* Q106: a full bar wraps a stat to two lines, never "..." */
    #topbar span.stat:nth-of-type(2), #topbar span.stat:nth-of-type(3){flex-shrink:0}   /* the Treasury and the date never shrink */
    @media (max-width:1400px){ #topbar{gap:6px;padding:0 8px} #topbar .brand{display:none} #topbar .stat{padding:3px 7px} #topbar .tb{padding:5px 8px} }   /* P23-TOP (Patrick 23 Nov, "stop the shrink"): under 1400 px only the gaps tighten and the brand goes (Q106); the text stays 14 px */
    @media (max-width:1100px){ #topbar{gap:4px} #topbar .brand{display:none} #topbar .stat{font-size:12px;padding:3px 6px} #topbar .tb{font-size:10.5px;padding:4px 5px;border-width:1px} }`;   // the top bar is not zoomed: it fits narrow windows instead
  document.head.appendChild(st); }
{ const f = settingsHTML;
  settingsHTML = function(dark){
    const h = f(dark), s = settings(), opt = (v, label) => `<option value="${v}" ${(s.textSize || 'normal') === v ? 'selected' : ''}>${label}</option>`;
    const add = `<label title="One canvas pixel per screen pixel: sharp text on scaled or zoomed screens"><input type="checkbox" ${s.sharp === false ? '' : 'checked'} onchange="setSetting('sharp', this.checked);resize()"> Sharp text</label>
      <label>Text size <select onchange="setSetting('textSize', this.value);applyTextSize()">${opt('normal', 'Normal')}${opt('large', 'Large')}${opt('larger', 'Larger')}</select></label>`;
    const i = h.lastIndexOf('</div>'); return i < 0 ? h + add : h.slice(0, i) + add + h.slice(i);
  };
}
/* PROFILE SETTINGS (Producer, LE N1 on 677a2d77): settings are the player's preferences, not campaign data. One record, 'dust_cloaks_settings', is kept for the whole profile:
   every save writes META.settings to it and every load reads it back, so the title, the camp and the Founding (Lessons, volume, speed, text size) always agree. The first load with no record seeds it from the save. */
const SETTINGS_KEY = 'dust_cloaks_settings';
{ const l0 = loadMeta, s0 = saveMeta;
  loadMeta = function(){ const r = l0.apply(this, arguments);
    try { const raw = localStorage.getItem(SETTINGS_KEY), p = raw ? JSON.parse(raw) : null;
      if (META && p && typeof p === 'object') META.settings = Object.assign({}, META.settings || {}, p);
      else if (META && META.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(META.settings)); } catch (e) {}
    return r; };
  saveMeta = function(){ try { if (META && META.settings && SAVE_KEY.indexOf('__') !== 0) localStorage.setItem(SETTINGS_KEY, JSON.stringify(META.settings)); } catch (e) {} return s0.apply(this, arguments); }; }
{ const f = loadMeta; loadMeta = function(){ const r = f.apply(this, arguments); try { applyTextSize(); if (typeof canvas !== 'undefined' && canvas && ctx) resize(); } catch (e) {} return r; }; }
/* ===== END INDEX 79 ======================================================= */

/* ============================================================================
   INDEX 80 - THE CAMP NO LONGER HALF-VANISHES
   THE BUG     Pointing at a builder (or leaving the mouse where builders walk)
               asked for the label "SPECS[spec].name", and builders have no
               specialty, so drawing stopped there every frame: everything
               lower on the screen (the fire, the wagon, the trophy rack, the
               square's people, trees and plots) was never drawn.
   THE FIX     Builders say "Builder: <building>, <seasons> left"; anyone else
               without a specialty is "Townsfolk".
   SAFETY NET  The camp and the battlefield now draw each object inside its own
               guard (with its own canvas state), so one broken object can only
               hide itself. The first error of each kind is written to the
               browser console with what was being drawn.
   ROLLBACK    Delete from this comment to END INDEX 80, and undo the patches
               marked "Index 80" (the person label and the two draw loops).
============================================================================ */
const DRAWERR = new Set();
function campDrawError(e, it){
  const what = !it ? '?' : it.q ? 'person ' + (it.q.kind || '') + ' ' + (it.q.id || '') : it.o ? 'object ' + it.o.kind + ' ' + it.o.id : it.e ? 'enemy ' + it.e.k : it.m ? 'squad mate' : Object.keys(it).filter(k => k !== 'y').join(',');
  const key = (e && e.message) + '|' + what.split(' ').slice(0, 2).join(' ');
  if (DRAWERR.has(key)) return; DRAWERR.add(key);
  console.warn('Draw error (skipped, the rest of the scene still draws):', what, e);
}
/* ===== END INDEX 80 ======================================================= */

/* ============================================================================
   INDEX 81 - BUG FIXES FROM THE AUDIT
   FIXED  1  The camp hint bar listed the camp hotkeys (B, R, P, Q, H, L) on the
             Varnholt prologue map too, where none of them work. The prologue
             now shows a short hint without keys; the main camp's hint says
             "Camp keys" and notes that Q and R spend Luck in a fight. The Manual
             says the same. (G-BUG-02, G-BUG-03)
          2  The title screen is centred with justify-content:center, so when
             it was taller than the window the top (the title) was cut off and
             could not be scrolled to. It now centres only when it fits.
          3  Title screen: the note under the Chapter button sat on its divider
             line; the "No Squad Leader yet" placeholder in the Squad Leader look
             cards was an unframed, wrapping blob. (G-UI-01, G-UI-02)
          4  Gear cards (Market and Quartermaster): the EQUIPPED / OWNED stamp
             floated over the description, and a long SOURCE wrapped into the
             COST column. The stamp is now a line of its own and the footer
             keeps COST and SOURCE in separate columns. (G-UI-03, G-UI-04)
          5  The Reeve's Hall (and any long Planning Table): the table's wood
             board was squeezed to the window height while its contents ran on
             below it, so the "Ring the Bell" button hung off the bottom of the
             board. The board now grows with its contents.
             The hint bar no longer swallows clicks over the map under it
             (G-UI-06).
          6  The camp hotkeys (Index 78) also fired on the title screen: H, L, B
             and M opened panels hidden behind it and Q, R, P replaced the
             title screen. They are now off while the title screen shows.
          7  The debrief's "Now Xgp" total was written before Detailed Salvage
             and facility upkeep changed the Treasury, so it could be wrong; it
             now shows the Treasury every time the debrief redraws.
   ROLLBACK   Delete from this comment to END INDEX 81, and undo the patches
              marked "Index 81" (including the one in the Index 78 key handler).
============================================================================ */
{ const st = document.createElement('style');
  st.textContent = `.splash-screen{justify-content:safe center}
    .splash-screen .inner > div[style*="border-top"]{margin-top:26px !important;padding-top:16px !important}
    .gc-st{position:static;transform:none;align-self:flex-start;display:inline-block;margin:0 8px 6px}
    .gc-foot{gap:10px} .gc-foot span:first-child{flex:none} .gc-foot span:last-child{flex:1;min-width:0;overflow-wrap:anywhere}
    #table-inner{flex:0 0 auto}
    #camp-hint{pointer-events:none;max-width:calc(100vw - 24px)}`;   /* Index 81 */
  document.head.appendChild(st); }
const HINT81 = 'WASD or the arrow keys walk your Squad Leader (hold Shift to run). Click buildings';
function hint81(){
  const h = $('camp-hint'); if (!h) return;
  const story = typeof inStoryNow === 'function' && inStoryNow(), tag = story ? 'story' : 'camp';
  h.dataset.i78 = '1';                                                         // Index 78 must not append its own key list on top
  if (h.dataset.i81 === tag && h.textContent.indexOf('Keys: B') < 0) return; h.dataset.i81 = tag;
  h.textContent = story ? HINT81 + ' and people.'
    : HINT81 + ', plots and people.  Camp keys (in a fight Q and R spend Luck): B build · R roster · P planning table · Q quartermaster · H hire · L ledger · hold Alt for names.';
}
{ const f = drawCamp; drawCamp = function(){ try { hint81(); } catch (e) {} return f.apply(this, arguments); }; }   /* Index 81 */
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx81')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx81"><b>Q and R mean two things.</b> In camp, Q opens the Quartermaster and R the Roster. In a fight, Q spends and R burns Luck. The camp keys are off while a fight is on.</p>`);
  };
}
// 7 (commander, BUG-07): the debrief's "Now Xgp" was written before Detailed Salvage and facility upkeep changed the Treasury; it is now the Treasury at every redraw.
{ const f = renderDebrief; renderDebrief = function(head, lines){ try { if (lines && lines.length && META) lines = lines.map((l, i) => i === 0 && typeof l === 'string' ? l.replace(/Now -?\d+gp\./, `Now ${META.treasury}gp.`) : l); } catch (e) {} return f(head, lines); }; }   /* Index 81 */
/* ===== END INDEX 81 ======================================================= */

/* ============================================================================
   INDEX 82 - ENEMIES FIND THE FACE OF THE WALL
   THE BUG     Within 260px of a non-leader target, moveEnemy walks in a
               straight line without looking for walls. Enemies sent at a
               palisade section or gate (the siege's structures) therefore
               snagged and stacked on trees and fence corners on the way.
   THE FIX     When the target is a siege structure and the straight line is
               blocked, the enemy follows a flow field built from that
               structure (cached per structure, rebuilt when any wall falls).
               Clear lines, the leader, every other target and every other
               contract are untouched.
   ROLLBACK    Delete from this comment to END INDEX 82.
============================================================================ */
{ const f = moveEnemy;
  moveEnemy = function(e, tx, ty, sp, target){
    if (target && target.struct && target.k && !clearLine(e, {x:tx, y:ty}, 30)){
      try {
        const down = G.structs ? Object.keys(G.structs).filter(k => G.structs[k].hp <= 0).length : 0;
        if (!G.sflow || G.sflowV !== down){ G.sflow = {}; G.sflowV = down; }
        const D = G.sflow[target.k] || (G.sflow[target.k] = bfsFrom(tx, ty)), fd = flowDir(D, e.x, e.y);
        if (fd){
          const c = cellAt(e.x, e.y), terr = BESTIARY[e.k].flit || e.k === 'cinder' ? 1 : (SLOW[c] || 1);
          e.wob += 0.08;
          e.x += fd.x * sp * terr + Math.cos(e.wob) * 0.14; e.y += fd.y * sp * terr + Math.sin(e.wob) * 0.14;
          if (Math.abs(fd.x) > 0.05) e.left = fd.x < 0;
          return;
        }
      } catch (err) {}
    }
    return f.apply(this, arguments);
  };
}
/* ---- UX auditor's bugs (B-1, B-2, B-3, B-5, B-6) ---------------------------------
   B-1  Disabled buttons used pointer-events:none, so their title tooltips ("why not")
        never showed. They now take the pointer (cursor:not-allowed); a capture-phase
        click guard keeps them from ever being activated.
   B-2  Faction Standing seals on the planning table overlapped; they are nudged apart
        after the table renders.
   B-3  The wax seal on Charter Ambition scrolls covered the last words; the scroll has
        room for it at the bottom.
   B-5  Not a bug: the Silver Pit's +40gp is applied by nextDay() when the siege starts
        and the same Morning Report line shows it; the top bar shows the new total
        together with that report. Left as is.
   B-6  A 'storage' listener warns once (a banner, no reload) when another tab writes the
        save, because saving from this stale tab would overwrite it.                  */
{ const st = document.createElement('style');
  st.textContent = `.btn:disabled,.mini button:disabled,.sealbtn:disabled{pointer-events:auto;cursor:not-allowed}
    .btn:disabled:hover,.mini button:disabled:hover{filter:none;transform:none}
    .sealbtn:disabled:hover img{transform:none}
    .cscroll{padding-bottom:66px}
    #tab-warn{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:200;max-width:min(560px,92vw);background:#3a1a10;color:#f6e6c8;border:2px solid #d4a040;border-radius:4px;padding:10px 38px 10px 14px;font:14px Georgia,serif;box-shadow:0 6px 18px rgba(0,0,0,.6)}
    #tab-warn button{position:absolute;right:6px;top:4px;background:none;border:none;color:#f6e6c8;font-size:22px;cursor:pointer}`;   /* Index 82 */
  document.head.appendChild(st); }
document.addEventListener('click', e => { try { const b = e.target && e.target.closest && e.target.closest('button:disabled'); if (b){ e.stopPropagation(); e.preventDefault(); } } catch (err) {} }, true);
function nudgeSeals82(){
  const wrap = document.querySelector('#tbl-factions .mapwrap'); if (!wrap) return;
  const els = [...wrap.querySelectorAll('.fseal')]; if (els.length < 2) return;
  const W = wrap.getBoundingClientRect(); if (W.width < 50 || W.height < 50) return;      // not laid out yet
  const k = Math.max(0.55, Math.min(1, W.width / 760));                                      // small maps get small seals
  for (const el of els){ el.style.transform = 'translate(-50%,-50%) scale(' + k + ')'; el.style.fontSize = (14 / k).toFixed(2) + 'px'; el.style.marginLeft = el.style.marginTop = '0px'; }
  const off = els.map(() => [0, 0]), pad = 3;
  for (let pass = 0; pass < 60; pass++){ let moved = false;
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++){
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left) + pad, oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + pad;
      if (ox > 0 && oy > 0 && ox > pad && oy > pad){ moved = true;
        if (oy <= ox){ const dir = (a.top + a.bottom) <= (b.top + b.bottom) ? 1 : -1; off[i][1] -= dir * oy / 2; off[j][1] += dir * oy / 2; }
        else { const dir = (a.left + a.right) <= (b.left + b.right) ? 1 : -1; off[i][0] -= dir * ox / 2; off[j][0] += dir * ox / 2; } } }
    els.forEach((el, i) => { el.style.marginLeft = off[i][0] + 'px'; el.style.marginTop = off[i][1] + 'px';
      const r = el.getBoundingClientRect(); if (r.left < W.left) off[i][0] += W.left - r.left; if (r.right > W.right) off[i][0] -= r.right - W.right;
      if (r.top < W.top) off[i][1] += W.top - r.top; if (r.bottom > W.bottom) off[i][1] -= r.bottom - W.bottom;
      el.style.marginLeft = off[i][0] + 'px'; el.style.marginTop = off[i][1] + 'px'; });
    if (!moved) break; }
}
{ const f = renderTable; renderTable = function(){ const r = f.apply(this, arguments); try { nudgeSeals82(); const im = document.querySelector('#tbl-factions .mapwrap > img'); if (im && !im.complete) im.addEventListener('load', () => nudgeSeals82(), {once:true}); setTimeout(nudgeSeals82, 120); } catch (e) {} return r; }; }
window.addEventListener('resize', () => { try { nudgeSeals82(); } catch (e) {} });
let TABWARN82 = false;
window.addEventListener('storage', e => {
  try { if (TABWARN82 || e.storageArea !== localStorage || e.key !== SAVE_KEY) return; TABWARN82 = true;
    const d = document.createElement('div'); d.id = 'tab-warn';
    d.innerHTML = 'This save was changed in another tab or window. If you keep playing here, the next save will overwrite it. Close one of them, or reload this page to pick up the other’s changes.<button title="Dismiss" onclick="this.parentNode.remove()">&times;</button>';
    document.body.appendChild(d); } catch (err) {}
});
/* ===== END INDEX 82 ======================================================= */

/* ============================================================================
   INDEX 88 - FIXED BUILD SITES FOR THE PALISADE AND THE WATCHTOWERS
   WHAT        The Palisade (the gate plot on the south road) and the Watchtowers
               (the plot beside it) have fixed sites: each can be built only on its
               own plot, and nothing else can be built there. Every other building
               still goes on any empty plot (Index 77).
   HOW         FIXED_SITE (Index 77) now holds 'palisade' and 'watchtower'. To make
               another facility fixed, add its id to FIXED_SITE (it must have a plot
               of its own id in CAMP_LAYOUT, which every holding's layout has for the
               palisade and watchtower). The code that used to special-case
               'palisade' now asks FIXED_SITE: the plot panel (a fixed slot lists
               only its own facility, other slots list no fixed facility), the plot
               label, the Alt label, the B key and the move highlight; Index 78's
               Move button and drop target already did. startBuild refuses a fixed
               facility anywhere but its own plot, and another facility on a fixed
               plot.
   OLD SAVES   sitePlan() already ignores META.sites entries that point at a fixed
               plot and re-homes the building on its own default plot, or the next
               free one, so nothing overlaps.
   GATES       The palisade's gates are the gaps at north, east and west (the
               south gate is the Gatehouse itself). With the 3D world on they are
               pairs of gate towers (Index 72). With it off (Settings, or the
               Pixel sprite look) the ring drew no gate at all; it now gets plain
               timber gate towers too.
   ROLLBACK    Delete from this comment to END INDEX 88 and undo the patches marked
               "Index 88" (plot panel, plot label, B key, move highlight, Alt label).
============================================================================ */
/* 'watchtower' is in FIXED_SITE and the fixed-plot rule in startBuild (both camp/qol.js) */
function gateTowers88(){
  const g = ctx; for (const gt of [0, Math.PI, Math.PI * 1.5]) for (const s of [-1, 1]){
    const t = gt + s * 0.09, x = 880 + Math.cos(t) * 760, y = 640 + Math.sin(t) * 470; if (!wOn(x, y, 80)) continue;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y + 6, 14, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#5a3a1c'; g.fillRect(x - 8, y - 60, 16, 64); g.fillStyle = '#7a5428'; g.fillRect(x - 8, y - 60, 6, 64);
    g.fillStyle = '#3a2412'; g.fillRect(x - 11, y - 68, 22, 10); g.fillStyle = '#8a1a1a'; g.fillRect(x - 3, y - 80, 6, 12); }
}
{ const f = drawPalisadeRing; drawPalisadeRing = function(){ const r = f.apply(this, arguments); try { if (!r && has('palisade') && holding() === 'fort') gateTowers88(); } catch (e) {} return r; }; }
/* ===== END INDEX 88 ======================================================= */

/* ============================================================================
   INDEX 89 - BUG FIXES FROM THE ROUND 2 AUDIT
   R2-01  A prologue save with no cp.full flag is a pre-split save, which was always the
          14-day game. isFull() treated it as the Quick prologue, so a save on day 9 never met
          another assault. Only an explicit full:false is Quick now (one marked line at
          isFull); new games always set the flag when the player picks).
   R2-03  The debrief headline "Treasury +916gp" is now the true change in the Treasury over
          the contract (it was the sum of the lines written before Detailed Salvage and upkeep).
   STORY2-05  Killing Orsolt (or Ilvaryn) in the prologue no longer costs Standing with the
          Mendorian Order (or the Frost-Vault Houses): the prologue skips those changes.
          Saves that already carry it: a founded Chapter that has not yet marched on a contract
          (META.prologueChron true, deployments 1 or less) whose Mendor or Frost-Vault Standing
          is exactly -1 gets it back to 0, once. Any other save is left alone, because there is
          no way to tell that -1 from one earned later.
   ROLLBACK   Delete from this comment to END INDEX 89 and undo the marked isFull line.
============================================================================ */
let DEB89 = null;
{ const f = endDeployment;
  endDeployment = function(result){
    try { DEB89 = {t0:META ? META.treasury : 0}; if (G && inStoryNow() && G.slainFactions) G.slainFactions.length = 0; } catch (e) {}
    return f.apply(this, arguments);
  };
}
{ const f = renderDebrief;
  renderDebrief = function(head, lines){
    try {
      if (lines && lines.length && META && DEB89 && typeof lines[0] === 'string'){
        const d = META.treasury - DEB89.t0;
        lines = lines.map((l, i) => i === 0 ? l.replace(/Treasury [+\-−]?\d+gp/, `Treasury ${d >= 0 ? '+' : '-'}${Math.abs(d)}gp`) : l);
        lines[0] = deb89Items(lines[0], lines, d);
      }
    } catch (e) {}
    return f.call(this, head, lines);
  };
}
/* K75 (UX, 16 Nov): the headline's items were written before the Masters' Tithe and facility upkeep were taken, so
   "Treasury +44gp: Contract 310 · Salvage 10 · Stalls 15 · Hazard Upkeep -50" added to 285. At every draw the items now take
   those two from their own lines, and anything else that moved the Treasury goes in as "Other", so the items add up. */
function deb89Items(h, lines, d){
  if (typeof h !== 'string') return h;
  h = h.replace(/<span data-k75>[^]*?<\/span>/g, '');
  const m = h.match(/^(<p><b>Treasury [+\-−]?\d+gp<\/b>)(: ([^]*?))?(\. Now -?\d+gp\.<\/p>)$/); if (!m) return h;
  let sum = 0; (m[3] || '').replace(/\([^()]*\)/g, '').replace(/(-|−)?(\d+)gp/g, (x, neg, n) => { sum += neg ? -n : +n; return x; });   // K97: a bracket explains an item (the PD-44 rout), it is not one
  const add = [], txt = lines.slice(1).filter(l => typeof l === 'string').join(' ');
  const t = txt.match(/The Masters(?:’|') Tithe: <b>-(\d+)gp/); if (t){ add.push(`Masters’ Tithe: -${t[1]}gp`); sum -= +t[1]; }
  const u = txt.match(/<b>Facility upkeep:<\/b>[^<]*?: -(\d+)gp/); if (u){ add.push(`Facility upkeep: -${u[1]}gp`); sum -= +u[1]; }
  // 2j (GD ruling b): the two class catches are named, each its own entry, with the figure charged; never under "Other"
  const g2 = typeof G !== 'undefined' && G ? G : null;
  if (g2 && g2.tithe2j > 0){ add.push(`Temple tithe: -${g2.tithe2j}gp`); sum -= g2.tithe2j; }
  if (g2 && g2.ransom2j > 0){ add.push(`Ransom: -${g2.ransom2j}gp`); sum -= g2.ransom2j; }
  if (sum !== d) add.push(`Other: ${d - sum < 0 ? '-' : ''}${Math.abs(d - sum)}gp`);
  if (!add.length) return h;
  return m[1] + ': ' + (m[3] ? m[3] + '<span data-k75> · ' : '<span data-k75>') + add.join(' · ') + '</span>' + m[4];
};
function fixStanding89(){
  const m = META; if (!m || m.cp || !m.prologueChron || m.standingFix89 || (m.deployments || 0) > 1 || !m.standing) return;
  for (const k of ['mendor', 'frostvault']) if (m.standing[k] === -1) m.standing[k] = 0;
  m.standingFix89 = true;
}
{ const f = loadMeta; loadMeta = function(){ const r = f.apply(this, arguments); try { fixStanding89(); } catch (e) {} return r; }; }
try { fixStanding89(); } catch (e) {}
/* ===== END INDEX 89 ======================================================= */

/* ============================================================================
   INDEX 90 - BUNDLE F CHECKS
   FIXED  1  The combat HUD's helper line ("Open Order: the squad spreads ..." / "Braced: ...")
             is drawn from x=24 and was long enough to run under the ability bar once the
             squad had five Specialties (the bar is centred and grows with them; the line is
             560px long at 12px). It now stays left of the bar: one line if it fits, otherwise
             split at a comma or full stop into two (helper90), each squeezed to fit if needed.
   ROLLBACK   Put the two fillText calls back in drawHUD (helpW90 / helper90).
============================================================================ */
function helper90(t, maxW){            // the helper line: one line if it fits, else two, never under the ability bar
  if (ctx.measureText(t).width <= maxW){ ctx.fillText(t, 24, VH - 62); return; }
  const cuts = []; const re = /[,.] /g; let m; while ((m = re.exec(t))) cuts.push(m.index + 1);
  if (!cuts.length){ ctx.fillText(t, 24, VH - 62, maxW); return; }
  const c = cuts.reduce((a, b) => Math.abs(a - t.length / 2) < Math.abs(b - t.length / 2) ? a : b);
  ctx.fillText(t.slice(0, c), 24, VH - 77, maxW); ctx.fillText(t.slice(c + 1), 24, VH - 62, maxW);
}
/* ===== END INDEX 90 ======================================================= */


/* ============================================================================
   INDEX 98 - VO-1 model uplift (Fable job 5, audits/fable/models.md)
   The engine patches above (marked Index 98: cone, cyl and ring parts, per-zone
   materials, crease shadow, the 2x supersampled Crisp style) give recipes more
   to work with. This block is the uplift pass itself: every humanoid recipe
   (r3dBuild54) and every quadruped (r3qBuild) gains the parts the plan asked
   for. Humanoids: a mouth and jaw, thumbs, hair strands, a round belt, plate
   lames, a collar, vambraces and greaves on heavy armour, cloak folds.
   Beasts: legs, neck and tail taper (cones), hooves flare, wolves get claws and
   horses a bridle. A recipe with rec.noUplift = true is left alone.
   ROLLBACK: delete this block; the Index 98 engine patches are harmless without it.
============================================================================ */
function r3dUplift98(rec, p, opt){
  if (!rec || rec.rig !== 'humanoid' || rec.noUplift) return rec;
  opt = opt || {};
  const R = opt.race3d || RACE3D[p && p.race] || RACE3D.HUMAN, fem = !!p && sexOf(p) === 'f', D = r3dSkeleton(R, fem).dims, s = D.s, w = D.w, hk = D.hk, hy = 6.2 * hk;
  const P = rec.parts, has = z => P.some(q => q.z === z), head = P.filter(q => q.b === 'head');
  const robe = has('robe'), heavy = has('plate'), medium = !heavy && has('mail');
  const add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  // face: a mouth line unless a great helm, mask or beard covers it; a jaw under the chin
  const covered = head.some(q => q.z === 'mask' || (q.z === 'helm' && q.t === 'ell' && q.r[1] > 7 * hk) || (q.z === 'hair' && q.t === 'ell' && q.c[2] > 3 * hk));
  if (!covered){ add('head', [{t:'box', c:[0, hy - 3.2 * hk, 5.7 * hk], r:[1.4 * hk, 0.28, 0.45], z:'mouth'}]); rec.zones.mouth = rec.zones.mouth || shade(rec.zones.skin || '#c08a60', 0.55); }
  if (!fem) add('head', [{t:'ell', c:[0, hy - 4.4 * hk, 1.4 * hk], r:[4.4 * hk, 2.6 * hk, 4.6 * hk], z:'skin'}]);
  // hands: a thumb, when the hand is bare
  if (!heavy) for (const [b, sx] of [['hdL', 1], ['hdR', -1]]) add(b, [{t:'cone', a:[0, 0.6, 1.6], p:[sx * 0.9 * w, -0.3, 3.1], r:0.7, r2:0.45, z:'skin'}]);
  // hair: three strands at the fringe when the hair shows
  const hairOn = head.some(q => q.z === 'hair' && q.t === 'ell' && q.r[0] > 5 * hk), hatOn = head.some(q => ['helm', 'hood', 'hat'].includes(q.z));
  if (hairOn && !hatOn) for (const fx of [-3.2, 0.4, 3.4]) add('head', [{t:'cone', a:[fx * hk, hy + 5.4 * hk, 3.4 * hk], p:[fx * 1.2 * hk, hy + 2.8 * hk, 5.3 * hk], r:1.3 * hk, r2:0.5 * hk, z:'hair'}]);
  // belt: a round belt on the hips (robes get a rope)
  if (!robe) add('chest', [{t:'ring', c:[0, 0.6 * s, 0.4], R:(heavy ? 9.1 : medium ? 9.6 : 8.7) * w, Rz:(heavy ? 6.9 : medium ? 7 : 6.3) * w, r:0.7, n:12, z:'leather'}]);
  else add('pelvis', [{t:'ring', c:[0, -1.5 * s, 0.4], R:9 * w, Rz:7 * w, r:0.55, n:12, z:'strap'}]);
  // heavy plate: shoulder lames, a collar, vambraces, greaves and tasset lames
  if (heavy){
    for (const b of ['upL', 'upR']) add(b, [{t:'ring', c:[0, -3.8, 0], R:4.3 * w, r:0.8, n:10, z:'plate'}, {t:'ring', c:[0, -5.6, 0], R:3.8 * w, r:0.75, n:10, z:'plate'}]);
    add('chest', [{t:'ring', c:[0, 19.8 * s, -0.2], R:5.2 * w, Rz:4.7 * w, r:0.85, n:12, z:'plate'}]);
    for (const b of ['loL', 'loR']) add(b, [{t:'cyl', a:[0, -3.5 * s, 0], p:[0, -8.8 * s, 0], r:2.95 * w, z:'plate'}]);
    for (const b of ['shL', 'shR']) add(b, [{t:'cyl', a:[0, -3 * s, 0.5], p:[0, -11.5 * s, 0.5], r:3.15 * w, z:'plate'}]);
    for (const b of ['thL', 'thR']) add(b, [{t:'box', c:[0, -8 * s, 2.9 * w], r:[3.1 * w, 1.5 * s, 0.7], rot:[-0.12, 0, 0], z:'plate'}, {t:'box', c:[0, -11 * s, 3 * w], r:[2.9 * w, 1.3 * s, 0.7], rot:[-0.12, 0, 0], z:'plate'}]);
  }
  // cloak: two folds flaring toward the hem, on the back face
  if (has('cape')) for (const fx of [-0.22, 0.24]) add('cape3', [{t:'cone', a:[fx * 10.8 * w, 0, -0.9], p:[fx * 11.6 * w, -12 * s, -1.3], r:0.5, r2:1.5, z:'cape'}]);
  return rec;
}
function r3qUplift98(rec){
  if (!rec || rec.rig !== 'quad' || !rec.Q || rec.noUplift || rec.uplift98) return rec;
  const Q = rec.Q, P = rec.parts, hr = Q.headR, hl = Q.headL, add = (b, list) => { for (const q of list) P.push(Object.assign({b}, q)); };
  for (const q of P){
    if (q.t !== 'cap') continue;
    if (/^q[FB][LR]u$/.test(q.b)){ q.t = 'cone'; q.r2 = q.r * 0.78; }                                   // upper leg tapers to the knee
    else if (/^q[FB][LR]l$/.test(q.b)){ q.t = 'cone'; q.r2 = q.r * 0.85; }                              // lower leg tapers to the foot
    else if (q.b === 'qNeck' && q.z === 'coat'){ q.t = 'cone'; q.r2 = q.r * (Q.horse ? 0.72 : 0.82); }  // neck tapers to the head
    else if ((q.b === 'qTail' || q.b === 'qTail2') && Q.tailT === 'thin'){ q.t = 'cone'; q.r2 = q.r * 0.6; }
    else if (q.z === 'hoof'){ q.t = 'cone'; q.r2 = q.r * 1.12; }                                        // hooves flare at the ground
  }
  if (!rec._scaled){
    if (Q.horse){
      add('qHead', [{t:'ring', c:[0, -hr * 0.18, hl * 0.7], R:hr * 0.64, Rz:hr * 0.64, r:0.3, n:10, rot:[Math.PI / 2, 0, 0], z:'tack'}]);
      for (const sx of [1, -1]) add('qHead', [{t:'cap', a:[sx * hr * 0.6, -hr * 0.1, hl * 0.62], p:[sx * hr * 0.9, hr * 0.45, -hr * 0.25], r:0.3, z:'tack'}]);
    } else if (Q.foot !== 'hoof'){
      for (const b of ['qFLp', 'qFRp', 'qBLp', 'qBRp']) for (const dx of [-0.6, 0, 0.6]) add(b, [{t:'cone', a:[dx * Q.legL, -Q.legL * 0.25, Q.legL * 2.2], p:[dx * Q.legL, -Q.legL * 0.55, Q.legL * 2.9], r:0.32, r2:0.12, z:'claw'}]);
      rec.zones.claw = rec.zones.claw || '#2a2622';
    }
  }
  rec.uplift98 = true;
  rec.key = 'r3q98' + hash(JSON.stringify(rec));
  return rec;
}
r3dBuild54 = (function(prev){ return function(p, isLeader, opt){ return r3dUplift98(prev(p, isLeader, opt), p, opt); }; })(r3dBuild54);
r3qBuild = (function(prev){ return function(kind){ return r3qUplift98(prev(kind)); }; })(r3qBuild);
for (const k in R3QR) delete R3QR[k];
R3QR.wyrm = r3wBuild();   // the wipe above dropped the wyrm (built by r3wBuild, not r3qBuild), which left the q3d wyrm blank (found by the VO-2 monsters session)
