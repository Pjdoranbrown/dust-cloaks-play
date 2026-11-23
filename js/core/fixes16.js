/* js/core/fixes16.js (INT-1 step 2, 2026-11-16): INDEX 16 (beta fixes), PORTRAITS v2.
   Cut unchanged from the inline script in index.html (old lines 10853 to 11386). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 16 - BETA REPORT FIXES (Gemini audit of Index 14, all items except
   multiplayer). Bugs 01-08 are fixed in place above; this block adds the
   balance, UI/UX and quality-of-life changes.
============================================================================ */
/* ---- 1. In-world confirm and alert: a wax-seal parchment modal ---------- */
(function(){
  const st = document.createElement('style');
  st.textContent = `
  #askbox{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(0,0,0,.45),rgba(0,0,0,.85))}
  #askbox.hidden{display:none}
  #askbox .ab{position:relative;width:min(460px,92vw);background:var(--parch,#d8c9a8);background-size:256px;border:3px solid #3a2a1a;box-shadow:0 0 0 2px #8a6a3a inset,0 16px 40px rgba(0,0,0,.7);padding:22px 24px 18px;text-align:center;font-family:Georgia;color:var(--ink)}
  #askbox h2{margin:0 0 8px;font-variant:small-caps;color:#3a2a1a;font-size:26px;border-bottom:3px double var(--ink-soft);padding-bottom:4px}
  #askbox .abt{font-size:15px;line-height:1.45;margin:8px 0 14px}
  #askbox .abseal{position:absolute;right:-18px;top:-18px;width:56px;image-rendering:pixelated;filter:drop-shadow(2px 3px 2px rgba(0,0,0,.5))}
  #askbox .abk{font-size:14px;color:#6a5a44;margin-top:6px}
  /* folio tabs */
  .folio-tabs{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;width:100%;margin:10px 0 0;border-bottom:3px solid var(--ink-soft)}
  .folio-tabs button{font:bold 14px Georgia;font-variant:small-caps;color:var(--parchment);background:linear-gradient(#6e4e2c,#4a3018);border:2px solid #24160a;border-bottom:none;border-radius:6px 6px 0 0;padding:6px 14px;cursor:pointer;margin:0}
  .folio-tabs button.on{background:var(--parch,#d8c9a8);background-size:256px;color:#3a2a1a;transform:translateY(3px)}
  .folio-page{width:100%;max-height:calc(86vh - 190px);overflow-y:auto;padding:6px 4px 10px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center}
  .folio-page.hidden{display:none}
  .mansearch{width:min(420px,90%);padding:6px 10px;font:14px Georgia;margin:6px auto;display:block}
  .mantoc{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:4px 0 8px}
  .mantoc a{font-size:14px;background:rgba(255,248,230,.7);border:1px solid #8a7a5a;border-radius:10px;padding:1px 8px;color:#3a2a1a;cursor:pointer;text-decoration:none}
  /* custom controls */
  .dsel{font:600 14px Georgia;color:#3a2a1a;background:linear-gradient(#f5ead2,#d8c49a);border:2px solid #7a5a2a;border-radius:12px;padding:3px 10px;cursor:pointer;box-shadow:0 2px 0 #5a4428}
  .dsel:hover{border-color:var(--gold)}
  .dseg{display:inline-flex;border:2px solid #24160a;border-radius:4px;overflow:hidden;vertical-align:middle}
  .dseg button{font:600 14px Georgia;color:#f5ead2;background:linear-gradient(#6e4e2c,#4a3018);border:none;border-right:1px solid #24160a;padding:4px 9px;cursor:pointer;margin:0;border-radius:0;box-shadow:none}
  .dseg button:last-child{border-right:none}
  .dseg button.on{background:linear-gradient(#8a6414,#6a4a10);color:#fff6d8}
  .dpop{position:fixed;z-index:210;background:var(--parch,#d8c9a8);background-size:256px;border:3px solid #3a2a1a;box-shadow:0 10px 30px rgba(0,0,0,.6);padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;max-width:min(560px,92vw);max-height:70vh;overflow:auto}
  .dpop button{font:600 14px Georgia;text-align:left;color:#2a1a0a;background:rgba(255,250,232,.85);border:2px solid #7a5a2a;border-radius:3px;padding:6px 8px;cursor:pointer}
  .dpop button small{display:block;font-weight:normal;color:#5a4a2a;margin-top:2px}
  .dpop button.on{border-color:#226b2a;background:#e4f2e0}
  .dpop .warn{grid-column:1/-1;background:#7a1e14;color:#ffe9c8;font:bold 14px Georgia;padding:5px 8px;border-radius:2px}
  .dpips{display:inline-flex;gap:2px;vertical-align:middle}
  .dpips i{width:10px;height:14px;background:rgba(0,0,0,.35);border:1px solid #24160a;cursor:pointer}
  .dpips i.on{background:linear-gradient(#ffe080,#b8902a)}
  .dchk{font:bold 14px Georgia;color:inherit;background:none;border:2px solid currentColor;width:20px;height:20px;line-height:14px;padding:0;margin:0 4px 0 0;cursor:pointer;vertical-align:middle;border-radius:2px;box-shadow:none}
  /* Rank'n hints and trail */
  .rkc.can:hover{box-shadow:inset 0 0 0 3px #6fd37a}
  .rkc.tg:hover{box-shadow:inset 0 0 0 3px #6fd37a}
  .rkc.nomv:hover{box-shadow:inset 0 0 0 3px #e0503a}
  .rkc.trail{box-shadow:inset 0 0 0 4px var(--gold-bright),0 0 12px var(--gold-bright)}
  /* muster */
  .mustwarn{background:rgba(212,160,40,.25);border:2px solid #b8902a;padding:6px 8px;margin:6px 0;font-size:14px}
  .marcher.amber{border-color:#d4a028;background:rgba(240,200,90,.35)}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'askbox'; box.className = 'hidden'; document.body.appendChild(box);
})();
let ASK = null;
function askConfirm(title, body, onYes, opts = {}){
  ASK = {onYes, onNo:opts.onNo || null};
  const b = $('askbox');
  b.innerHTML = `<div class="ab"><img class="abseal" src="${sealURL(opts.alert ? 'eye' : 'sword', '#8a1a1a')}"><h2>${title}</h2><div class="abt">${body}</div>
    ${opts.alert ? `<button class="btn gold" onclick="askClose(false)">VERY WELL</button>` :
      `<button class="btn gold" onclick="askClose(true)">${opts.ok || 'SEAL IT'}</button><button class="btn" onclick="askClose(false)">${opts.cancel || 'THINK AGAIN'}</button>`}
    <div class="abk">${opts.alert ? '[ENTER] or [ESC]' : '[1] or [ENTER] confirm \u00b7 [ESC] cancel'}</div></div>`;
  b.classList.remove('hidden'); SFX.play('pick');
}
function askAlert(title, body){ askConfirm(title, body, null, {alert:true}); return undefined; }
function askClose(yes){
  const a = ASK; ASK = null; $('askbox').classList.add('hidden');
  if (!a) return;
  if (yes && a.onYes){ SFX.play('coin'); a.onYes(); } else if (!yes && a.onNo) a.onNo();
}
// For code that asked synchronously: open the modal and, on yes, run the action again with the answer already given.
let GATE_OK = null;
function gate(msg, redo){
  if (GATE_OK === msg){ GATE_OK = null; return true; }
  askConfirm('Are you sure?', msg, () => { GATE_OK = msg; redo(); }, {onNo:() => { if (typeof refreshUI === 'function') refreshUI(); }});
  return false;
}
window.addEventListener('keydown', e => {
  if (!ASK && $('askbox').classList.contains('hidden')) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (e.key === 'Escape') askClose(false);
  else if (e.key === 'Enter' || e.key === '1') askClose(!!(ASK && ASK.onYes));
}, true);

/* ---- 2. Custom controls in place of browser selects, sliders, checkboxes - */
function enhanceControls(root){
  root.querySelectorAll('select:not([data-enh])').forEach(sel => {
    sel.dataset.enh = 1; sel.style.display = 'none';
    const opts = [...sel.options];
    const fire = v => { sel.value = v; sel.dispatchEvent(new Event('change', {bubbles:true})); };
    if (opts.length <= 4){
      const seg = document.createElement('span'); seg.className = 'dseg';
      opts.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o.text; if (o.value === sel.value) b.className = 'on';
        b.onclick = ev => { ev.stopPropagation(); seg.querySelectorAll('button').forEach(x => x.className = ''); b.className = 'on'; SFX.play('pick'); fire(o.value); }; seg.appendChild(b); });
      sel.after(seg);
    } else {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dsel';
      btn.textContent = (sel.selectedOptions[0] || opts[0]).text + ' \u25be';
      btn.onclick = ev => { ev.stopPropagation(); openPop(btn, sel, opts, fire); };
      sel.after(btn);
    }
  });
  root.querySelectorAll('input[type=range]:not([data-enh])').forEach(r => {
    r.dataset.enh = 1; r.style.display = 'none';
    const min = +r.min || 0, max = +r.max || 100, pips = document.createElement('span'); pips.className = 'dpips';
    const paint = () => [...pips.children].forEach((p, i) => p.className = (i + 1) / 10 <= (r.value - min) / (max - min) + 1e-6 ? 'on' : '');
    for (let i = 0; i < 10; i++){ const p = document.createElement('i'); p.title = Math.round(min + (i + 1) * (max - min) / 10);
      p.onclick = ev => { ev.stopPropagation(); const v = min + (i + 1) * (max - min) / 10; r.value = (+r.value === v && i === 0) ? min : v; paint(); r.dispatchEvent(new Event('input', {bubbles:true})); }; pips.appendChild(p); }
    paint(); r.after(pips);
  });
  root.querySelectorAll('input[type=checkbox]:not([data-enh])').forEach(c => {
    c.dataset.enh = 1; c.style.display = 'none';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dchk'; b.textContent = c.checked ? 'X' : '\u00a0';
    b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); c.checked = !c.checked; b.textContent = c.checked ? 'X' : '\u00a0'; SFX.play('pick'); c.dispatchEvent(new Event('change', {bubbles:true})); };
    c.after(b);
  });
}
function openPop(anchor, sel, opts, fire){
  document.querySelectorAll('.dpop').forEach(p => p.remove());
  const pop = document.createElement('div'); pop.className = 'dpop';
  const deity = /setDeity/.test(sel.getAttribute('onchange') || '');
  if (deity) pop.innerHTML = '<div class="warn">Changing faith costs 2 Favour on the next contract.</div>';
  opts.forEach(o => { const b = document.createElement('button'); b.type = 'button'; if (o.value === sel.value) b.className = 'on';
    const D = deity && DEITIES[o.value];
    b.innerHTML = `${esc(o.text)}${D && D.tenet ? `<small>${esc(D.tenet)}</small>` : ''}`;
    b.onclick = ev => { ev.stopPropagation(); pop.remove(); if (o.value !== sel.value) fire(o.value); }; pop.appendChild(b); });
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left)) + 'px';
  pop.style.top = Math.max(8, Math.min(window.innerHeight - pop.offsetHeight - 8, r.bottom + 4)) + 'px';
  setTimeout(() => document.addEventListener('mousedown', function h(e){ if (!pop.contains(e.target)){ pop.remove(); document.removeEventListener('mousedown', h); } }), 0);
}
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) enhanceControls(n.parentNode || n); })
  .observe(document.body, {childList:true, subtree:true});
// Changing a Cleric's faith asks first
{ const f = setDeity; setDeity = function(key, v){
    const p = key === 'L' ? META.leader : META.roster.find(x => x.id === key) || officers().find(x => x.id === key);
    if (p && p.deity && p.deity !== v && !gate(`${esc(p.name)} turns to ${DEITIES[v].name}. Breaking faith costs 2 Favour on the next contract.`, () => setDeity(key, v))){ refreshUI(); return; }
    f(key, v);
  }; }
// Momentum Flow setting
/* F-41: the Momentum pause / slow / real-time setting is gone (the field never pauses); META.settings.momFlow is ignored */
{ const f = drawMomentum; drawMomentum = function(){
    const ft = ctx.fillText, lab = 'LIVE';   /* F-41: always live */
    ctx.fillText = function(t, x, y, mw){ if (typeof t === 'string') t = t.replace(/^PAUSED/, lab); return mw === undefined ? ft.call(this, t, x, y) : ft.call(this, t, x, y, mw); };
    try { f(); } finally { ctx.fillText = ft; } }; }

/* ---- 3. Folios: tabbed pages instead of long scrolling screens --------- */
const FOLIO = {};
function folioize(inner, heads, key){
  if (!heads.length) return;
  const bar = document.createElement('div'); bar.className = 'folio-tabs';
  heads[0].before(bar);
  const pages = heads.map((h, i) => {
    const pg = document.createElement('div'); pg.className = 'folio-page';
    let n = h.nextSibling; const stop = heads[i + 1];
    const label = h.textContent.replace(/\s*\(.*\)\s*$/, '').trim();
    inner.insertBefore(pg, h); pg.appendChild(h);
    while (n && n !== stop && !(n.classList && n.classList.contains('folio-tail'))){ const nx = n.nextSibling; pg.appendChild(n); n = nx; }
    const b = document.createElement('button'); b.type = 'button'; b.textContent = ['I','II','III','IV','V','VI','VII','VIII'][i] + '. ' + label;
    b.onclick = () => { FOLIO[key] = i; show(i); SFX.play('pick'); }; bar.appendChild(b);
    return pg;
  });
  const show = i => pages.forEach((p, j) => { p.classList.toggle('hidden', j !== i); bar.children[j].classList.toggle('on', j === i); });
  show(Math.min(FOLIO[key] || 0, pages.length - 1));
}
{ const f = renderRoster; renderRoster = function(){
    const inner0 = $('roster-inner'), pg0 = !$('screen-roster').classList.contains('hidden') && inner0 && [...inner0.querySelectorAll(':scope > .folio-page')].find(p => !p.classList.contains('hidden')), keep = pg0 ? pg0.scrollTop : 0;
    f(); const inner = $('roster-inner');
    const back = [...inner.children].pop(); if (back) back.classList.add('folio-tail');
    folioize(inner, [...inner.querySelectorAll(':scope > h2.sec')], 'roster');
    if (keep){ const pg = [...inner.querySelectorAll(':scope > .folio-page')].find(p => !p.classList.contains('hidden')); if (pg) pg.scrollTop = keep; } }; }
/* a redraw keeps the open folio page's scroll only while its screen is already on show; show() itself puts a real open back to the top (Firefox kept the old position) */
{ const sh = show; show = function(id){ const r = sh.apply(this, arguments);
    const inn = id === 'screen-camp' ? $('camp-inner') : id === 'screen-roster' ? $('roster-inner') : null;
    if (inn) for (const p of inn.querySelectorAll(':scope > .folio-page')) p.scrollTop = 0;
    return r; }; }
{ const f = renderCamp; renderCamp = function(){
    /* a redraw while the screen stays open keeps the visible page's scroll; a fresh open (hideAll ran since) starts at the top */
    const inner0 = $('camp-inner'), pg0 = !$('screen-camp').classList.contains('hidden') && inner0 && [...inner0.querySelectorAll(':scope > .folio-page')].find(p => !p.classList.contains('hidden')), keep = pg0 ? pg0.scrollTop : 0;
    f(); const inner = $('camp-inner');
    const back = [...inner.children].pop(); if (back) back.classList.add('folio-tail');
    const heads = [...inner.children].filter(d => (d.tagName === 'H2' && d.classList.contains('sec')) || d.tagName === 'DIV' && d.style.fontWeight === 'bold' && d.nextElementSibling && d.nextElementSibling.classList.contains('row'));
    folioize(inner, heads, 'camp');
    if (keep){ const pg = [...inner.querySelectorAll(':scope > .folio-page')].find(p => !p.classList.contains('hidden')); if (pg) pg.scrollTop = keep; } }; }
{ const f = openManual; openManual = function(){ f(); const inner = $('manual-inner'), lg = inner.querySelector('.log');
    if (lg && !inner.querySelector('h2.sec.rules')){
      const h = document.createElement('h2'); h.className = 'sec rules'; h.textContent = 'How to Play'; lg.before(h);
      const ps = [...lg.querySelectorAll('p')], toc = document.createElement('div'); toc.className = 'mantoc';
      ps.forEach((p, i) => { const b = p.querySelector('b'); if (!b) return; p.id = 'manp' + i;
        const a = document.createElement('a'); a.textContent = b.textContent.replace(/[.:]\s*$/, ''); a.onclick = () => p.scrollIntoView({block:'center'}); toc.appendChild(a); });
      const s = document.createElement('input'); s.className = 'mansearch'; s.placeholder = 'Search the manual...';
      s.oninput = () => { const q = s.value.toLowerCase(); ps.forEach(p => p.style.display = !q || p.textContent.toLowerCase().includes(q) ? '' : 'none'); };
      lg.before(s); lg.before(toc);
    }
    const back = [...inner.children].pop(); if (back) back.classList.add('folio-tail');
    folioize(inner, [...inner.querySelectorAll(':scope > h2.sec')], 'manual'); }; }

/* ---- 4. Combat readability: hatched telegraphs, a whistle, a tether ------ */
let WHISTLE_AC = null;
function whistle(){
  if (!settings().volume) return;
  try { WHISTLE_AC = WHISTLE_AC || new (window.AudioContext || window.webkitAudioContext)();
    const ac = WHISTLE_AC, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1900, t + 1.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08 * settings().volume / 100, t + 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + 1.15);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.2); } catch(e){}
}
let HATCH = null;
function hatchPattern(){
  if (HATCH) return HATCH;
  const c = newCanvas(12, 12), g = c.getContext('2d'); g.strokeStyle = 'rgba(255,90,30,.55)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-2, 14); g.lineTo(14, -2); g.moveTo(-8, 8); g.lineTo(8, -8); g.moveTo(4, 20); g.lineTo(20, 4); g.stroke();
  return HATCH = ctx.createPattern(c, 'repeat');
}
{ const f = drawTraps; drawTraps = function(onScreen){
    f(onScreen);
    for (const h of G.hazards){
      ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(G.frame / 4) * 0.25;
      ctx.fillStyle = hatchPattern(); ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#ffeeaa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }; }
{ const f = drawBuffer; drawBuffer = function(L){
    const R = G.mod.radius;
    for (const m of G.squad){ if (m.state !== 'up') continue;
      const d = dist(m, L); if (m.inF && d < R - 15) continue;
      ctx.strokeStyle = m.inF ? 'rgba(240,180,40,.85)' : 'rgba(220,40,30,.9)'; ctx.lineWidth = m.inF ? 2 : 3; ctx.setLineDash(m.inF ? [6, 5] : []);
      ctx.beginPath(); ctx.moveTo(L.x, L.y + 10); ctx.lineTo(m.x, m.y + 10); ctx.stroke(); ctx.setLineDash([]); }
    f(L);
  }; }

/* ---- 5. Field rules: Gnome caltrops, Dark Illusion evade, Scoundrel flanks, cadence ---- */
{ const f = update; update = function(){
    f(); if (!G || G.over) return;
    for (const h of G.hazards) if (!h.whistled && h.t <= 72){ h.whistled = true; whistle(); }
    if (G.illusionEvadeT > 0) G.illusionEvadeT--;
    if (G.obj !== 'brawl') for (const u of squadUnits()){
      if (!u.p || u.p.race !== 'GNOME') continue;
      u.gnomeT = (u.gnomeT === undefined ? 300 : u.gnomeT) - 1;
      if (u.gnomeT > 0) continue; u.gnomeT = 14 * 60;
      let n = 0; for (const e of G.enemies) if (!e.dead && !e.dormant && dist(e, u) < 130){ e.slow = Math.max(e.slow || 0, 180); n++; }
      if (n){ G.fx.push({ring:true, x:u.x, y:u.y, r:130, life:16, c:'#c8c0b0'}); pop(u.x, u.y - 30, 'FLASH-CALTROPS', '#e8e0d0'); }
      else u.gnomeT = 60;
    }
    // Marching cadence: mates near the ring keep up at 90% of the Leader's pace
    const L = G.leader; if (L.moving && !L.down){
      const lsp = Math.max(3, L.s.move + G.armour.mv) * PX_PER_MOVE * G.mod.speed * (G.mounted ? G.mount.spd : 1) * 0.9;
      for (const m of G.squad){ if (m.state !== 'up' || m.atkT > 0 || m.hold > 0) continue;
        const own = Math.max(3, m.s.move + G.armour.mv) * PX_PER_MOVE * 1.12 * G.mod.speed * (G.mounted ? G.mount.spd : 1);
        const d = dist(m, L); if (own >= lsp || d > G.mod.radius + 40 || d < 30) continue;
        const k = (lsp - own) / Math.max(1, d); m.x += (L.x - m.x) * k * 0.6; m.y += (L.y - m.y) * k * 0.6; collide(m, 9, true); }
    }
  }; }
{ const f = ABIL_FX.WITCH; ABIL_FX.WITCH = function(u){ f(u); G.illusionEvadeT = 180; }; }
{ const f = enemyHitsUnit; enemyHitsUnit = (v, skill, dmg, opts) => f(v, skill - (G && G.illusionEvadeT > 0 ? 1 : 0), dmg, opts); }
{ const f = strike; strike = function(e, skill, baseDmg, o = {}){
    if (o.scoundrel && !e.dead){
      const flank = e.slow > 0 || e.stagger > 0 || e.hexT > 0 || e.shakenT > 0 || e.weak > 0 ||
        squadUnits().some(u => u !== o.from && dist(u, e) < e.r + 24);
      if (flank) o = Object.assign({}, o, {flat:(o.flat || 0) + 1});
    }
    return f(e, skill, baseDmg, o);
  }; }
// Muster rations on Tier 2 and 3 contracts
{ const f = startDeployment; startDeployment = function(c, ids){
    f(c, ids);
    if (!G || c.tier < 2 || ['siege','night','sortie','drill','brawl','defend'].includes(c.obj)) return;
    const cost = Math.min(META.treasury, (c.tier === 2 ? 5 : 10) * ids.length);
    if (cost){ META.treasury -= cost; saveMeta(); note(`Muster rations: ${cost}gp from the Treasury.`); }
  }; }
// Remember the last boss for camp talk
{ const f = killEnemy; killEnemy = function(e){ const was = e.dead; f(e); if (!was && e.dead && BESTIARY[e.k].boss && META) META.lastBoss = ename(e); }; }

/* ---- 6. Muster presets: the last marching line is remembered ------------ */
{ const f = deploy; deploy = function(){ META.lastMuster = MU.ids.slice(); saveMeta(); f(); }; }
ensureMuster = function(){
  if (!META.board) rollBoard(); else ensureFinale();   /* Index 35 */
  if (!MU || MU.board !== META.board){
    const ready = META.roster.filter(p => !p.resting && !p.away), last = (META.lastMuster || []).filter(id => META.roster.some(p => p.id === id));
    const ids = last.length ? last.filter(id => ready.some(p => p.id === id)) : ready.slice(0, 5).map(p => p.id);
    MU = {contract:0, ids, board:META.board, missing:last.filter(id => !ready.some(p => p.id === id))};
  }
  MU.ids = MU.ids.filter(id => META.roster.some(p => p.id === id && !p.resting && !p.away));
};
function fillFromBench(){
  const bench = META.roster.filter(p => !p.resting && !MU.ids.includes(p.id));
  while (MU.ids.length < 5 && bench.length) MU.ids.push(bench.shift().id);
  MU.missing = []; SFX.play('pick'); renderTable();
}
{ const f = renderTable; renderTable = function(){ f();
    if (typeof inStory === 'function' && inStory()) return;
    const box = $('tbl-march'); if (!box || !MU) return;
    const miss = (MU.missing || []).map(id => META.roster.find(p => p.id === id)).filter(Boolean);
    box.querySelectorAll('.marcher').forEach(el => { const m = /toggleMuster\((\d+)\)/.exec(el.getAttribute('onclick') || ''); if (m && miss.some(p => p.id === +m[1])) el.classList.add('amber'); });
    const room = 5 - MU.ids.length, bench = META.roster.filter(p => !p.resting && !MU.ids.includes(p.id)).length;
    if (miss.length || (room > 0 && bench)){
      const h = box.querySelector('.marchers');
      h.insertAdjacentHTML('beforebegin', `<div class="mustwarn">${miss.length ? `Last time's line is short: <b>${miss.map(p => esc(p.name)).join(', ')}</b> ${miss.length > 1 ? 'are' : 'is'} resting or training. ` : ''}${room > 0 && bench ? `<button class="btn small" onclick="fillFromBench()">FILL FROM RESERVE BENCH</button>` : ''}</div>`);
    }
  }; }

/* ---- 7. Camp life: Squad Mates talk ------------------------------------ */
function barkFor(p){
  const lines = [];
  const pt = p.bond && META.roster.find(x => x.id === p.bond); if (pt) lines.push(`Where's ${pt.name}? Owes me a drink.`, `I'd trust ${pt.name} with my back. Anyone else, no.`);
  if (p.spec === 'CLERIC' && p.deity && DEITIES[p.deity]) lines.push(`${DEITIES[p.deity].name.split(',')[0]} keeps us. Mostly.`);
  if (META.lastBoss) lines.push(`Still thinking about ${META.lastBoss}.`, `${META.lastBoss}... heavier than they looked.`);
  if (p.injuries && p.injuries.length) lines.push('This old wound aches before rain.');
  if (p.resting > 0) lines.push('Just need a day. Maybe two.');
  lines.push('When do we march?', `${META.treasury}gp in the chest. Not bad.`, 'Fire needs more wood.');
  return pickOf(lines);
}
{ const f = drawCamp; drawCamp = function(){
    f(); if (G) return;
    CAMP.barkT = (CAMP.barkT || 0) - 1;
    const mates = CAMP.people.filter(q => q.kind === 'mate' || q.kind === 'leader' || q.kind === 'officer');
    if (CAMP.barkT <= 0 && mates.length){ const q = pickOf(mates); q.bark = barkFor(q.p); q.barkLife = 260; CAMP.barkT = 300 + Math.random() * 300; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const q of CAMP.people){ if (!q.bark || !(q.barkLife-- > 0)) continue;
      const x = q.x - CAMP.cam.x, y = q.y - CAMP.cam.y - 62; if (x < -100 || x > VW + 100 || y < -40 || y > VH) continue;
      const bPx = typeof hudPx === 'function' ? hudPx(13) : 14, bh = Math.max(24, Math.ceil(bPx * 1.85)), by = y - bh + 6;
      ctx.font = `italic ${bPx}px Georgia`; const w = Math.min(260, ctx.measureText(q.bark).width + 16);
      ctx.globalAlpha = Math.min(1, q.barkLife / 30);
      ctx.fillStyle = 'rgba(255,248,230,.95)'; ctx.fillRect(x - w / 2, by, w, bh); ctx.strokeStyle = '#4a3b2a'; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, by, w, bh);
      ctx.beginPath(); ctx.moveTo(x - 5, y + 6); ctx.lineTo(x, y + 13); ctx.lineTo(x + 5, y + 6); ctx.fillStyle = 'rgba(255,248,230,.95)'; ctx.fill();
      ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center'; ctx.fillText(q.bark, x, y - 1, w - 10); ctx.globalAlpha = 1; }
  }; }

/* ---- 8. Rank'n: AI jumps shown hop by hop ------------------------------- */
{ const f = rkRender; rkRender = function(){ f();
    if (!RK || !RK.trail) return;
    const cells = document.querySelectorAll('#screen-rankn .rkboard .rkc');
    RK.trail.path.slice(0, RK.trail.step + 1).forEach(([r, c]) => { const el = cells[r * 8 + c]; if (el) el.classList.add('trail'); }); }; }
{ const f = rkAI; rkAI = function(){
    const before = RK && RK.capA ? RK.capA.length : 0; f();
    if (!RK || !RK.last || RK.last.length < 3 || RK.capA.length - before < 2) return;
    const tr = RK.trail = {path:RK.last, step:0};
    const tick = () => { if (!RK || RK.trail !== tr) return; tr.step++; SFX.play('coin'); rkRender();
      if (tr.step < tr.path.length - 1) setTimeout(tick, 350); else setTimeout(() => { if (RK && RK.trail === tr){ RK.trail = null; rkRender(); } }, 700); };
    rkRender(); setTimeout(tick, 350);
  }; }

/* ---- 9. Prologue: Quick (tutorial) or the Full Chronicle ---------------- */
{ const f = switchSlot; switchSlot = function(key){ f(key); setChronicle(key === STORY_SLOT && isFull()); }; }
{ const f = newStory; newStory = function(){ setChronicle(false); f(); }; }
{ const f = openStoryIntro; openStoryIntro = function(){ f();
    const ti = $('title-inner'), btn = [...ti.querySelectorAll('button')].find(b => /RECRUIT YOUR SQUAD LEADER/.test(b.textContent)); if (!btn) return;
    btn.outerHTML = `<div class="row" style="margin-top:8px">
      <div class="card" style="width:260px" tabindex="0" role="button" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();this.click()}" onclick="CP().full=false;setChronicle(false);saveMeta();CP().part='create';openCreate()"><div class="tag">Tutorial</div><div class="ttl">Quick Prologue</div><div class="desc">3 days and 2 assaults at Varnholt, then 3 nights on the road. Teaches the game as it goes.</div></div>
      <div class="card" style="width:260px" tabindex="0" role="button" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();this.click()}" onclick="CP().full=true;setChronicle(true);saveMeta();CP().part='create';openCreate()"><div class="tag">Campaign</div><div class="ttl">Full Chronicle: The Fall of Varnholt</div><div class="desc">14 days and 6 assaults, then the nights on the road to Artemis\u2019s lands.</div></div></div>`; }; }

/* ============================================================================
   PORTRAITS v2 - a dedicated 32x32 head-and-shoulders bust for every person,
   drawn front-on with light from the left: shaded skin, eyes with whites and
   irises, brows, nose, lips, layered hair, beards, headgear and the squad's
   armour and cloak on the shoulders.
============================================================================ */
function drawBust(g, o, seed){
  const P = painter(g), skin = o.skin, sk = v => shade(skin, v);
  const hair = o.hair || '#3a2a1a', fem = o.sex === 'f', acc = o.acc;
  const top = (o.robe ? (o.robeCol || o.top) : o.top) || '#8a6a4a';
  const wide = o.bulky ? 1 : 0, HW = {5:3, 6:5, 16:5, 17:5, 18:4, 19:4, 20:3, 21:2};
  const shape = ((seed >>> 23) & 7) % 3;   // 0 oval, 1 square jaw, 2 narrow
  const hw = y => (HW[y] || 6) + (y >= 7 && y <= 19 ? wide : 0) - (fem && y >= 16 && y <= 19 ? 1 : 0) + (shape === 1 && y >= 15 && y <= 19 ? 1 : 0) - (shape === 2 && !wide && y >= 13 && y <= 19 ? 1 : 0);
  const head = ['helmet','hood','wizard','witch','cap','tricorn','bandana','circlet'].includes(o.head) ? o.head : null;
  const hs = o.hairStyle || 'short', hd = shade(hair, .72), hl = shade(hair, 1.25);
  // cloak behind the shoulders
  if (o.cape){ P(2, 23, 5, 9, o.cape); P(25, 23, 5, 9, shade(o.cape, .8)); P(2, 23, 5, 1, shade(o.cape, 1.2)); }
  // long hair falls behind and over the shoulders
  const longH = (fem && hs !== 'bun') || hs === 'long' || hs === 'braids';
  if (longH && head !== 'helmet'){
    P(7, 8, 4, 19, hair); P(21, 8, 4, 19, hd);
    for (let y = 10; y < 26; y += 3){ P(8, y, 1, 2, hd); P(23, y, 1, 2, shade(hair, .58)); }
    P(9, 9, 1, 6, hl);
  }
  if (hs === 'ponytail' && head !== 'helmet') P(22, 6, 3, 14, hd);
  // shoulders and clothing
  const tD = shade(top, .72), tL = shade(top, 1.2);
  P(11, 21, 10, 1, top); P(8, 22, 16, 1, top); P(6, 23, 20, 1, top); P(4, 24, 24, 1, top); P(3, 25, 26, 2, top); P(2, 27, 28, 5, top);
  P(4, 24, 4, 1, tL); P(3, 25, 3, 7, tL); P(2, 27, 1, 5, tL); P(24, 23, 2, 1, tD); P(26, 24, 3, 8, tD); P(29, 27, 1, 5, shade(top, .6));
  P(8, 22, 3, 1, tL); P(10, 28, 1, 4, tD); P(21, 28, 1, 4, tD);
  const ap = o.armour;
  if (ap === 'chain') for (let y = 24; y < 32; y++) for (let x = 4 + (y % 2); x < 28; x += 2) P(x, y, 1, 1, tD);
  if (ap === 'scale') for (let y = 24; y < 32; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 28; x += 3) P(x, y, 2, 1, tD);
  if (ap === 'quilt') for (let y = 26; y < 32; y += 3) for (let x = 4; x < 28; x += 4) P(x, y, 3, 1, shade(top, .85));
  if (ap === 'bands') for (let y = 25; y < 32; y += 2) P(4, y, 24, 1, tD);
  if (ap === 'studs') for (let y = 25; y < 32; y += 2) for (let x = 5; x < 28; x += 3) P(x, y, 1, 1, C.gold);
  if (ap === 'plate'){ P(2, 24, 8, 5, tL); P(22, 24, 8, 5, top); P(2, 24, 8, 1, '#ffffff'); P(3, 28, 7, 1, tD); P(23, 28, 7, 1, tD); P(5, 26, 1, 1, C.gold); P(26, 26, 1, 1, C.gold); }
  if (ap === 'fur'){ P(5, 22, 22, 3, '#c8b090'); P(6, 22, 5, 1, '#e0d0b0'); }
  if (o.robe){ P(10, 22, 12, 2, acc || tD); if (acc){ P(15, 24, 2, 8, acc); P(15, 24, 1, 8, shade(acc, 1.25)); } }
  else { P(13, 22, 6, 1, sk(.8)); P(14, 23, 4, 1, sk(.78)); P(15, 24, 2, 1, sk(.7)); if (acc){ P(11, 25, 3, 7, acc); P(11, 25, 1, 7, shade(acc, 1.2)); } }
  if (o.cape){ P(9, 23, 2, 2, C.gold); P(21, 23, 2, 2, C.gold); if (o.capeTrim){ P(7, 24, 1, 8, o.capeTrim); P(24, 24, 1, 8, o.capeTrim); } }
  // the hood frames the face from behind
  if (head === 'hood'){ const c = o.hood || '#4a3a2a'; P(7, 2, 18, 19, c); P(11, 0, 10, 2, c); P(5, 19, 22, 5, c); P(24, 3, 2, 19, shade(c, .7)); P(9, 4, 14, 17, shade(c, .55)); P(5, 19, 4, 5, shade(c, 1.2)); }
  // neck and face
  P(13, 19, 6, 4, sk(.78)); P(13, 21, 6, 1, sk(.65));
  for (let y = 5; y <= 21; y++){ const h = hw(y); P(16 - h, y, 2 * h, 1, skin); P(16 + h - 2, y, 2, 1, sk(.82)); P(16 - h, y, 1, 1, sk(.9)); }
  P(11, 6, 3, 3, sk(1.1)); P(12, 13, 2, 2, sk(1.08));
  P(13, 19, 6, 1, sk(.86)); P(14, 20, 4, 1, sk(.8)); P(19, 14, 2, 3, sk(.84)); P(11, 14, 1, 2, sk(.94)); P(10, 15, 1, 1, '#d08a7a');
  if (o.ears === 'elf'){ P(8, 10, 2, 3, skin); P(6, 8, 2, 3, skin); P(5, 6, 1, 3, skin); P(22, 10, 2, 3, sk(.8)); P(24, 8, 2, 3, sk(.8)); P(26, 6, 1, 3, sk(.8)); }
  else if (o.ears === 'big'){ P(5, 9, 5, 5, skin); P(6, 10, 3, 3, sk(.72)); P(22, 9, 5, 5, sk(.85)); P(23, 10, 3, 3, sk(.68)); }
  else { P(9 - wide, 10, 1, 4, sk(.9)); P(22 + wide, 10, 1, 4, sk(.78)); }
  // face features, varied per person
  const sv = (sh, k) => ((seed >>> sh) & 1023) % k;
  const eyeT = sv(2, 4), noseT = sv(5, 5), mouthT = sv(8, 3), browT = sv(11, 3);
  const frk = sv(14, 5) === 0, mole = sv(17, 6) === 0, stub = !fem && !o.beard && sv(20, 3) === 0, cheek = sv(26, 3) === 0;
  const iris = ['#3a2a1c', '#2e4a6a', '#3a5a2a', '#5a3a1a', '#4a4a5a', '#6a5a2a'][seed % 6], brow = shade(hair, .7), dk = o.eye || iris;
  // brows: level, arched, or stern
  if (browT === 0){ P(11, 10, 3, 1, brow); P(18, 10, 3, 1, brow); }
  else if (browT === 1){ P(11, 9, 3, 1, brow); P(18, 9, 3, 1, brow); P(10, 10, 1, 1, brow); P(21, 10, 1, 1, brow); }
  else { P(11, 9, 2, 1, brow); P(13, 10, 1, 1, brow); P(19, 9, 2, 1, brow); P(18, 10, 1, 1, brow); }
  if (!fem){ P(11, 9 + (browT === 0 ? 0 : -0), 3, 1, brow); P(18, 9, 3, 1, brow); }
  // eyes: almond, narrow, wide or heavy-lidded
  if (eyeT === 1){ P(11, 11, 3, 1, sk(.62)); P(12, 11, 1, 1, '#120c08'); P(18, 11, 3, 1, sk(.62)); P(19, 11, 1, 1, '#120c08'); }
  else {
    P(11, 11, 3, 1, '#f2ece0'); P(18, 11, 3, 1, '#f2ece0'); P(12, 11, 2, 1, dk); P(18, 11, 2, 1, dk);
    if (!o.eye){ P(12, 11, 1, 1, '#120c08'); P(19, 11, 1, 1, '#120c08'); }
    if (eyeT === 2){ P(12, 10, 1, 1, sk(.7)); P(19, 10, 1, 1, sk(.7)); P(12, 12, 2, 1, shade(dk, .8)); P(18, 12, 2, 1, shade(dk, .8)); }
    if (eyeT === 3){ P(11, 10, 3, 1, sk(.68)); P(18, 10, 3, 1, sk(.68)); }
  }
  P(11, 12 + (eyeT === 2 ? 1 : 0), 3, 1, sk(.86)); P(18, 12 + (eyeT === 2 ? 1 : 0), 3, 1, sk(.82));
  if (fem){ P(10, 11, 1, 1, '#2a1a10'); P(21, 11, 1, 1, '#2a1a10'); }
  if (cheek){ P(11, 14, 2, 1, sk(.82)); P(20, 14, 1, 2, sk(.74)); }
  // noses: straight, long, broad, hooked, button
  if (o.nose){ P(15, 13, 3, 3, sk(1.05)); P(17, 14, 1, 2, sk(.72)); P(15, 15, 3, 1, sk(.72)); }
  else if (noseT === 0){ P(16, 12, 1, 3, sk(.84)); P(17, 14, 1, 1, sk(.68)); P(15, 15, 3, 1, sk(.74)); }
  else if (noseT === 1){ P(16, 11, 1, 4, sk(.84)); P(17, 14, 1, 1, sk(.66)); P(15, 15, 3, 1, sk(.72)); P(16, 16, 1, 1, sk(.8)); }
  else if (noseT === 2){ P(16, 12, 1, 2, sk(.86)); P(14, 15, 5, 1, sk(.7)); P(14, 14, 1, 1, sk(.8)); P(18, 14, 1, 1, sk(.74)); P(16, 14, 1, 1, sk(1.08)); }
  else if (noseT === 3){ P(16, 11, 1, 2, sk(.84)); P(17, 12, 1, 2, sk(.76)); P(17, 14, 1, 1, sk(.62)); P(15, 15, 3, 1, sk(.72)); P(16, 12, 1, 1, sk(1.1)); }
  else { P(16, 13, 1, 1, sk(.84)); P(15, 15, 2, 1, sk(.76)); P(15, 14, 1, 1, sk(1.08)); }
  // freckles, a mole, stubble
  if (frk) for (const [x, y] of [[11, 13], [13, 14], [12, 15], [19, 13], [20, 14], [18, 15]]) P(x, y, 1, 1, shade(skin, .78));
  if (mole) P(sv(29, 2) ? 19 : 12, 16, 1, 1, '#4a2a1a');
  if (stub) for (let y = 16; y <= 20; y++){ const h = hw(y); for (let x = 16 - h + 1; x < 16 + h - 1; x++) if ((x + y) % 2 === 0 && !(y === 17 && x >= 13 && x <= 18)) P(x, y, 1, 1, shade(skin, .68)); }
  // mouths: even, wide or small; a slight frown on some
  const mw = mouthT === 1 ? 6 : mouthT === 2 ? 2 : 4, mx = 16 - mw / 2;
  if (fem){ P(mx, 17, mw, 1, '#a0484a'); P(mx + 1, 18, Math.max(1, mw - 2), 1, '#c06a68'); P(11, 15, 2, 1, sk(.92)); }
  else { P(mx, 17, mw, 1, sk(.58)); P(15, 18, 2, 1, sk(.88)); if (sv(23, 2)){ P(mx - 1, 18, 1, 1, sk(.66)); P(mx + mw, 18, 1, 1, sk(.66)); } }
  if (o.marks){ P(11, 14, 1, 1, '#bff6ff'); P(20, 14, 1, 1, '#bff6ff'); P(10, 16, 1, 1, '#bff6ff'); }
  if (o.elder){ P(12, 8, 8, 1, sk(.86)); P(11, 13, 1, 1, sk(.72)); P(20, 13, 1, 1, sk(.72)); P(13, 16, 1, 2, sk(.8)); P(18, 16, 1, 2, sk(.8)); }
  // beard and moustache
  if (o.beard && !fem){
    const bd = shade(hair, .78);
    P(13, 16, 6, 1, hair); P(12, 17, 2, 1, hair); P(18, 17, 2, 1, hair);
    for (let y = 17; y <= 23; y++){ const h = Math.max(2, hw(Math.min(y, 21)) - (y > 21 ? y - 21 : 0)); P(16 - h, y, 2 * h, 1, hair); }
    P(14, 17, 4, 1, '#2a1a10'); P(18, 18, 3, 6, bd);
    for (let y = 18; y < 24; y += 2) P(13 + (y % 4), y, 1, 2, bd);
    P(11, 18, 2, 2, hl);
  }
  if (o.tusks){ P(13, 16, 1, 2, C.bone); P(18, 16, 1, 2, C.bone); }
  // hair in front
  if (!head || head === 'circlet'){
    if (hs === 'bald'){ P(12, 5, 3, 2, sk(1.2)); P(9, 8, 2, 4, hair); P(21, 8, 2, 4, hd); }
    else {
      P(12, 1, 8, 1, hair); P(10, 2, 12, 1, hair); P(9, 3, 14, 2, hair); P(8, 5, 16, 3, hair); P(7, 7, 2, 4, hair); P(23, 7, 2, 4, hd); P(8, 8, 3, 5, hair); P(21, 8, 3, 5, hd); P(11, 8, 3, 1, hair); P(18, 8, 4, 1, hd);
      for (let x = 10; x < 23; x += 3) P(x, 4, 1, 4, hd);
      P(12, 2, 4, 1, hl); P(10, 3, 2, 2, hl); P(9, 5, 1, 2, hl); P(14, 8, 1, 1, hair); P(17, 8, 1, 1, hd);
      if (hs === 'messy'){ P(10, 2, 1, 1, hair); P(14, 2, 2, 1, hair); P(19, 2, 1, 1, hair); P(13, 8, 1, 2, hair); }
      if (fem && hs !== 'bun'){ P(14, 8, 2, 1, hair); P(9, 8, 2, 9, hair); P(21, 8, 2, 9, hd); }
      if (hs === 'bun'){ P(13, 0, 6, 4, hair); P(14, 0, 2, 1, hl); }
      if (hs === 'topknot') P(15, 0, 3, 3, hair);
      if (hs === 'braids'){ P(8, 13, 2, 12, hair); P(22, 13, 2, 12, hd); for (let y = 14; y < 25; y += 2){ P(8, y, 2, 1, hd); P(22, y, 2, 1, shade(hair, .55)); } }
    }
  } else if (head !== 'helmet' && head !== 'hood' && hs !== 'bald'){ P(8, 8, 3, 6, hair); P(21, 8, 3, 6, hd); }
  if (o.horns){ P(9, 2, 2, 4, C.bone); P(8, 0, 2, 3, C.bone); P(21, 2, 2, 4, shade(C.bone, .8)); P(22, 0, 2, 3, shade(C.bone, .8)); }
  if (o.halo){ P(10, 0, 12, 1, '#ffe680'); P(9, 1, 1, 1, '#ffe680'); P(22, 1, 1, 1, '#ffe680'); }
  // headgear
  const helm = o.helm || C.steel;
  if (head === 'helmet'){
    P(12, 1, 8, 1, helm); P(10, 2, 12, 1, helm); P(9, 3, 14, 6, helm); P(15, 9, 2, 6, shade(helm, .85));
    P(8, 10, 3, 8, helm); P(21, 10, 3, 8, shade(helm, .75)); P(11, 2, 2, 5, shade(helm, 1.35)); P(20, 3, 2, 6, shade(helm, .75));
    P(8, 9, 16, 1, shade(helm, .6)); for (let x = 10; x < 23; x += 4) P(x, 9, 1, 1, shade(helm, 1.4));
    if (acc) P(15, 0, 2, 3, acc);
  }
  if (head === 'hood'){ const c = o.hood || '#4a3a2a'; P(9, 3, 14, 3, c); P(8, 6, 2, 13, c); P(22, 6, 2, 13, shade(c, .75)); P(11, 3, 4, 1, shade(c, 1.25)); P(10, 6, 12, 1, shade(c, .6)); }
  if (o.mask){ P(11, 14, 10, 6, '#1e1e24'); P(11, 14, 10, 1, '#34343e'); }
  if (head === 'wizard'){ const h = o.hat || '#333', d = shade(h, .7);
    P(3, 7, 26, 2, d); P(3, 7, 26, 1, shade(h, .85)); P(9, 6, 14, 1, h); P(10, 5, 12, 1, C.gold); P(11, 4, 11, 1, h); P(12, 3, 9, 1, h); P(13, 2, 8, 1, h);
    P(15, 1, 6, 1, h); P(17, 0, 4, 1, h); P(12, 3, 2, 2, shade(h, 1.25)); P(19, 2, 2, 4, d); P(14, 4, 1, 1, '#ffe680'); }
  if (head === 'witch'){ const h = o.hat || '#222', d = shade(h, .7);
    P(2, 7, 28, 2, d); P(9, 6, 14, 1, h); P(10, 5, 12, 1, acc || '#7ac05a'); P(11, 4, 9, 1, h); P(10, 3, 8, 1, h); P(9, 2, 6, 1, h); P(7, 1, 5, 1, h); P(5, 0, 4, 1, d); P(15, 3, 3, 3, d); }
  if (head === 'circlet'){ P(9, 7, 14, 1, C.gold); P(15, 6, 2, 2, '#87ceeb'); P(15, 6, 1, 1, '#ffffff'); }
  if (head === 'bandana'){ const a = acc || '#9b2d24'; P(9, 4, 14, 4, a); P(9, 4, 14, 1, shade(a, 1.25)); P(9, 7, 14, 1, shade(a, .7)); P(23, 6, 3, 2, a); P(24, 8, 2, 3, shade(a, .8)); for (let x = 11; x < 22; x += 3) P(x, 5, 1, 1, '#f0e6d2'); }
  if (head === 'cap'){ P(10, 2, 12, 1, '#2a2a30'); P(9, 3, 14, 4, '#2a2a30'); P(8, 7, 16, 2, '#1a1a20'); P(11, 3, 3, 2, '#44444e'); }
  if (head === 'tricorn'){ P(4, 5, 24, 3, '#1a1414'); P(9, 2, 14, 3, '#1a1414'); P(3, 3, 3, 3, '#1a1414'); P(26, 3, 3, 3, '#1a1414'); P(4, 7, 24, 1, C.gold); P(22, 0, 2, 5, '#f0f0f0'); }
  drawWounds(P, o, sk, head, seed);
}
// Scars, injuries and fresh wounds, painted over the face.
function drawWounds(P, o, sk, head, seed){
  const inj = o.inj || [], scars = Math.min(4, (o.scars || 0) + inj.filter(i => i !== 'eye').length), lt = '#e8b0a4', dk = '#7a3a34';
  const SCARS = [
    [[21, 12], [20, 13], [20, 14], [19, 15]],          // across the cheek
    [[14, 5], [15, 6], [16, 7], [17, 8]],              // forehead
    [[12, 18], [13, 19], [14, 20]],                    // chin
    [[10, 13], [11, 14], [11, 15]]                     // left cheek
  ];
  for (let i = 0; i < scars; i++){ const S = SCARS[(i + (seed % 4)) % 4];
    if (S === SCARS[1] && head) continue;
    for (const [x, y] of S){ P(x, y, 1, 1, lt); P(x + 1, y, 1, 1, dk); } }
  if (inj.includes('mana')){ P(10, 14, 2, 2, '#5a2a2a'); P(11, 15, 1, 1, '#8a4a3a'); P(20, 16, 2, 1, '#5a2a2a'); P(19, 7, 2, 1, '#7a3a2a'); }
  if (inj.includes('lung') || inj.includes('shell')){ P(11, 12, 3, 1, sk(.68)); P(18, 12, 3, 1, sk(.68)); }
  if (inj.includes('arm')){ for (let i = 0; i < 16; i++) P(7 + i, 23 + (i >> 1), 2, 1, i % 3 ? '#e8e0d0' : '#c8c0b0'); }
  if (inj.includes('eye')){
    for (let x = 7; x <= 17; x++) P(x, 8 + ((x - 7) / 5 | 0), 1, 1, '#1a1410');
    P(21, 10, 3, 1, '#1a1410'); P(24, 9, 1, 1, '#1a1410');
    P(17, 10, 5, 3, '#1a1410'); P(18, 10, 3, 1, '#3a3030'); P(17, 12, 1, 1, '#2a2020');
    P(20, 13, 1, 1, lt); P(21, 9, 1, 1, lt);
  }
  if (o.hurt){
    const B = '#9a1a1a';
    if (!head || head === 'circlet'){ P(9, 6, 14, 2, '#ece4d4'); P(9, 7, 14, 1, '#c8c0b0'); P(19, 6, 3, 2, '#a82020'); P(20, 5, 1, 1, '#a82020'); }
    P(20, 8, 1, 3, B); P(21, 10, 1, 4, B); P(20, 14, 1, 2, '#7a1010');
    P(11, 12, 3, 1, '#6a4a7a'); P(10, 11, 1, 1, '#6a4a7a');
    P(15, 18, 1, 1, '#b02020'); P(15, 19, 1, 2, B);
    P(6, 26, 2, 1, '#8a1a1a'); P(7, 27, 1, 2, '#8a1a1a'); P(23, 28, 2, 2, '#7a1010');
  }
}
function bustOf(look, seed){
  const c = newCanvas(34, 34), g = c.getContext('2d'); g.translate(1, 1);
  drawBust(g, look, (seed >>> 0) || 1); g.setTransform(1, 0, 0, 1, 0, 0);
  return outline(c);
}
const BUSTS = {};
function personBust(p, isLeader){ const k = personKey(p, isLeader);
  return BUSTS[k] || (BUSTS[k] = bustOf(Object.assign({}, personLook(p, isLeader), {inj:p.injuries || [], scars:p.scars || 0, hurt:p.resting > 0 && !p.trainingAt}), hash(p.name + ':' + (p.id || 'L')))); }
// Anyone who went down and lived carries a scar for it.
{ const f = endDeployment; endDeployment = function(result){
    if (!G || G.over || ['drill', 'brawl'].includes(G.obj)) return f(result);
    const ids = new Set(G.downedIds), dead = new Set(G.squad.filter(m => m.state === 'dead').map(m => m.p.id)), L = META.leader, lw = G.leaderWasDown;
    f(result);
    for (const p of META.roster) if (ids.has(p.id) && !dead.has(p.id)) p.scars = (p.scars || 0) + 1;
    if (lw && L && META.leader === L) L.scars = (L.scars || 0) + 1;
    saveMeta();
  }; }
portraitURL = (p, isLeader) => toURL('pb2:' + personKey(p, isLeader), () => personBust(p, isLeader), 4);
{ const f = enemyIconURL; enemyIconURL = kind => (ENEMY_LOOK[kind] && kind !== 'wolfrider') ? toURL('eb:' + kind + bannerSig(), () => bustOf(enemyLook(kind), hash(kind)), 4) : f(kind); }
{ const f = masterLook; masterLook = m => Object.assign(f(m), {elder:true}); }
bustCanvas = function(spr, bg, look){
  const c = newCanvas(38, 38), g = c.getContext('2d'), P = painter(g);
  P(0, 0, 38, 38, C.goldD); P(1, 1, 36, 36, C.gold); P(2, 2, 34, 34, bg || '#2e3a44');
  for (let y = 4; y < 36; y += 3) P(2, y, 34, 1, shade(bg || '#2e3a44', .9));
  g.drawImage(bustOf(look, hash(look.skin + look.hair + (look.head || ''))), 2, 3, 34, 34);
  P(1, 36, 36, 1, C.goldD);
  return c;
};


