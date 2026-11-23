/* ============================================================================
   INDEX 103 - VO-1 visual overhaul, phase 4: UI skin by the hour
   (Fable job 5b, audits/fable/vo1.md; panel colours from docs/art-direction.md
   section 2, tokens from the SG-1 style guide in js/ui/ux.js Index 93)
   Loads after js/art/glow.js. The canvas HUD panels (one helper, panel()) take the
   hour's panel colour from LOOK.grade with a soft top-to-bottom wash, a gold
   border with a faint accent glow, and an ash inner line instead of the flat
   near-black box. The DOM overlay screens (camp, debrief, boards) take the
   evening panel colour so camp and field match. Parchment menus are left as
   they are: Patrick's answers kept parchment for reading surfaces.
   Knobs: LOOK.skin.on, .alpha (panel fill), .glow (border glow alpha).
   ROLLBACK: remove this script tag (or LOOK.skin.on = false at runtime).
============================================================================ */
(function(){
'use strict';
if (typeof LOOK === 'undefined' || typeof panel !== 'function') return;
const SK = LOOK.skin = { on: true, alpha: 0.86, glow: 0.35, inner: '#6a6256' };
const hex2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c, a) => { const v = hex2(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; };
const lift = (c, k) => { const v = hex2(c).map(x => Math.min(255, Math.round(x + (255 - x) * k))); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ','; };
const cache = {};
function style(){
  const t = LOOK.time(), g = LOOK.grade[t] || LOOK.grade.day;
  return cache[t] || (cache[t] = {top: lift(g.panel, 0.10) + SK.alpha + ')', bot: rgba(g.panel, SK.alpha)});
}
{ const f = panel;
  panel = function(x, y, w, h){
    if (!SK.on || !LOOK.on) return f(x, y, w, h);
    try {
      const s = style(), gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, s.top); gr.addColorStop(1, s.bot);
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
      ctx.save(); ctx.shadowColor = 'rgba(212,175,55,' + SK.glow + ')'; ctx.shadowBlur = 6;
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.restore();
      ctx.strokeStyle = SK.inner; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    } catch (e) { f(x, y, w, h); }
  };
}
/* DOM overlays: the evening panel colour behind camp and debrief screens, gold rule under their headings */
try {
  const st = document.createElement('style'); st.id = 'look-skin';
  st.textContent = `
  .overlay-screen{background:linear-gradient(${rgba(LOOK.grade.dusk.panel, 0.94)},${rgba(LOOK.grade.night.panel, 0.96)})!important;color:#dcd4c4}
  .overlay-screen h1{text-shadow:0 0 10px rgba(212,175,55,.35),2px 2px 0 #000}
  `;
  document.head.appendChild(st);
} catch (e) {}
})();
