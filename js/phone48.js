/* ============================================================================
   INDEX PHONE48 - F-48 fifth pass, phone width (UX review K18 to K25)
   K18. TIPS ON TOUCH. Tooltips were mouse-only. A tap on a dead control
        (disabled, or .off) shows its reason; a long press (0.45 s) on a live
        control shows its tip and does not press it. The tip goes at the next
        touch or after 5 s. Mouse play is not changed.
   K20. TAP TARGETS. Under 768 px wide, the buttons and lists in the camp
        panel and on the Roster are at least 40 px high, 8 px apart. [S] sizes.
   K19. A SHORT BARRACKS PANEL. Under 768 px wide, a building panel that holds
        training, the Practice Bout and the loadout folds each under a heading
        (Training and drills, Practice Bout, Loadout). All start closed; an
        opened heading stays open across redraws.
   K25. The Roster fits a 375 px screen (the list sits above the detail card);
        a mate in training reads "In training" there, not "Resting".
   Q19. THE CAMP BAR SAYS IT SCROLLS (Patrick 2026-11-15). Under 768 px wide
        the word bar fades at an edge where more is hidden, with a chevron that
        scrolls it; both go once that end is reached. A word cut at the edge
        (Chronicle) now sits under the fade, so the cut reads as intended.
   INT-1 group 15: no switches.
============================================================================ */
(function(){
  'use strict';
  const P = window.PHONE48 = {LONG: 450, STAY: 5000, open: {}};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  P.narrow = () => P._narrow != null ? !!P._narrow : typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches;

  /* ---- CSS ---- */
  const st = document.createElement('style'); st.id = 'phone48-css';
  st.textContent = `
  #tip48{position:fixed;z-index:120;max-width:280px;pointer-events:none;padding:7px 10px;font:13px Georgia;color:var(--ink,#2a1c10);background:var(--parch,#efe3c8);
    border:2px solid #3a2a1a;box-shadow:0 0 0 1px #8a6a3a inset,0 6px 14px rgba(0,0,0,.5);border-radius:2px;line-height:1.35}
  #tip48.hidden{display:none}
  .chev48{position:fixed;z-index:61;width:30px;display:flex;align-items:center;justify-content:center;font:bold 22px Georgia;color:#efe3c8;
    background:none;border:0;padding:0;cursor:pointer;text-shadow:0 0 4px #000,0 0 2px #000}
  .chev48.hidden{display:none}
  @media (pointer:coarse), (max-width:767px){
    body.phone48tips button:disabled{pointer-events:none}
  }
  @media (max-width:767px){
    body.phone48big #camp-panel .line button, body.phone48big #camp-panel .mini button, body.phone48big #camp-panel .plaque button,
    body.phone48big #camp-panel [data-book33] button, body.phone48big #camp-panel [data-book33] select,
    body.phone48big #roster-inner .mini button, body.phone48big #roster-inner .advbox button{min-height:40px;font-size:12px;padding:6px 10px}
    body.phone48big #camp-panel .mini, body.phone48big #roster-inner .mini{display:flex;flex-wrap:wrap;gap:8px}
    body.phone48big #camp-panel .mini button, body.phone48big #roster-inner .mini button{margin:0}
    body.phone48big #camp-panel .line{row-gap:8px;column-gap:8px}
    body.phone48big #camp-panel [data-book33] button, body.phone48big #camp-panel [data-book33] select{margin:4px 8px 4px 0;max-width:100%}
    body.phone48big #roster-inner > h1{font-size:34px !important}
    body.phone48big #roster-inner{overflow-wrap:anywhere}
    body.phone48big #roster-inner .btn.small{max-width:100%;box-sizing:border-box}
    body.phone48big #roster-inner .c31-bk{flex-direction:column;align-items:stretch}
    body.phone48big #roster-inner .c31-list{flex:0 0 auto}
    body.phone48big #roster-inner .c31-detail{flex:0 0 auto;max-width:none;position:static;max-height:none;box-sizing:border-box}
    body.phone48big #roster-inner .c31-line{grid-template-columns:40px minmax(0,1fr) auto;min-height:44px}
    body.phone48big #roster-inner h1{font-size:26px !important;flex:1 1 100% !important}
    body.phone48big #roster-inner h1 small{display:block;font-size:13px !important}
    body.phone48big #roster-inner > div:first-child{flex-wrap:wrap;gap:8px !important}
    body.phone48big #roster-inner > div:first-child button{min-height:40px}
    body.phone48big #topbar{overflow-x:auto;scrollbar-width:none}
    body.phone48big #topbar::-webkit-scrollbar{display:none}
    body.phone48big #topbar .c31-word, body.phone48big #topbar .c31-menubtn{padding:3px 5px;margin-right:3px;min-height:40px;flex:0 0 auto}
    body.phone48big #topbar .c31-word b{font-size:12px;letter-spacing:0}
    body.phone48hint #topbar.p48r{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 44px),transparent)}
    body.phone48hint #topbar.p48l{-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 44px),transparent)}
    body.phone48hint #topbar.p48l.p48r{-webkit-mask-image:linear-gradient(to right,transparent,#000 44px,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(to right,transparent,#000 44px,#000 calc(100% - 44px),transparent)}
    details.fold48{border-top:1px solid rgba(58,42,26,.35);margin:6px 0}
    details.fold48 > summary{min-height:44px;display:flex;align-items:center;font-weight:bold;font-size:15px;cursor:pointer;list-style:none}
    details.fold48 > summary::-webkit-details-marker{display:none}
    details.fold48 > summary::before{content:'+';display:inline-block;width:22px;font-size:18px}
    details.fold48[open] > summary::before{content:'-'}
    details.fold48 > summary small{font-weight:normal;opacity:.75;margin-left:8px;font-size:12px}
  }`;
  document.head.appendChild(st);
  function classes(){ if (!document.body) return; document.body.classList.add('phone48tips', 'phone48big', 'phone48hint'); try { P.edge(); } catch (e) {} }

  /* ---- K18: tips on touch ---- */
  let tip = null, timer = 0, stay = 0, eat = false, sx = 0, sy = 0;
  function tipEl(){ if (!tip){ tip = document.createElement('div'); tip.id = 'tip48'; tip.className = 'hidden'; document.body.appendChild(tip); } return tip; }
  const tipOf = el => { if (!el || !el.getAttribute) return ''; if (el.title){ el.dataset.tip = el.title; el.removeAttribute('title'); } return (el.dataset && el.dataset.tip) || ''; };
  const dead = el => !!el && (el.disabled || (el.classList && el.classList.contains('off')));
  /* the control under a point: a dead one by its box (a disabled button takes no events), else the nearest parent with a tip */
  P.find = function(x, y, target){
    const all = document.querySelectorAll('button[disabled][data-tip],button[disabled][title],.off[data-tip],.off[title]');
    for (const el of all){ const r = el.getBoundingClientRect(); if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el; }
    let el = target; while (el && el !== document.body && !(el.dataset && (el.dataset.tip || el.title))) el = el.parentElement;
    return el && el !== document.body ? el : null;
  };
  P.hide = function(){ clearTimeout(stay); if (tip) tip.classList.add('hidden'); };
  P.showFor = function(el, x, y){
    const t = tipOf(el); if (!t) return false;
    const d = tipEl(); d.textContent = t; d.classList.remove('hidden');
    const w = d.offsetWidth, h = d.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let top = y - h - 16; if (top < 8) top = Math.min(vh - h - 8, y + 26);
    d.style.left = Math.max(8, Math.min(vw - w - 8, x - w / 2)) + 'px'; d.style.top = Math.max(8, top) + 'px';
    clearTimeout(stay); stay = setTimeout(P.hide, P.STAY);
    return true;
  };
  const touch = e => e.pointerType === 'touch' || e.pointerType === 'pen';
  document.addEventListener('pointerdown', e => {
    if (!touch(e)) return;
    clearTimeout(timer); eat = false; P.hide();
    const el = P.find(e.clientX, e.clientY, e.target); if (!el) return;
    sx = e.clientX; sy = e.clientY;
    if (dead(el)) { P.showFor(el, sx, sy); return; }
    timer = setTimeout(() => { if (P.showFor(el, sx, sy)) eat = true; }, P.LONG);
  }, true);
  document.addEventListener('pointermove', e => { if (touch(e) && timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10){ clearTimeout(timer); timer = 0; } }, true);
  const end = e => { if (touch(e)){ clearTimeout(timer); timer = 0; if (eat) setTimeout(() => { eat = false; }, 400); } };
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', e => { if (eat){ eat = false; e.preventDefault(); e.stopPropagation(); } }, true);   // a long press reads the tip; it does not press
  document.addEventListener('contextmenu', e => { if (eat || (tip && !tip.classList.contains('hidden'))) e.preventDefault(); }, true);

  /* ---- K19: fold the long building panel ---- */
  P.HEADS = {train: 'Training and drills', bout: 'Practice Bout', book: 'Loadout'};
  P.foldPass = function(root){
    root = root || document.getElementById('camp-panel');
    if (!root || !P.narrow() || root.querySelector(':scope > details.fold48')) return 0;
    const kids = [].slice.call(root.children), txt = el => (el.textContent || '').trim();
    const iT = kids.findIndex(el => el.classList.contains('desc') && /^Training here/.test(txt(el)));
    const iB = kids.findIndex(el => el.classList.contains('desc') && /^Practice Bout/.test(txt(el)));
    const iL = kids.findIndex(el => el.hasAttribute('data-book33'));
    if ((iT >= 0) + (iB >= 0) + (iL >= 0) < 2) return 0;                    // a short panel is left as it is
    let iBend = -1;
    if (iB >= 0){ for (let i = iB + 1; i < kids.length && i !== iL; i++){ const el = kids[i];
      if (el.tagName === 'BUTTON' && el.classList.contains('btn')){ iBend = i; break; } if (!el.classList.contains('mini') && !el.classList.contains('desc') && !el.classList.contains('line') && !el.classList.contains('plaque')) break; iBend = i; } if (iBend < 0) iBend = iB; }
    const stops = [iB, iL].filter(i => i > iT).concat(kids.length - 1).sort((a, b) => a - b);
    const groups = [];
    if (iT >= 0) groups.push(['train', iT, stops[0] - 1]);
    if (iB >= 0) groups.push(['bout', iB, iBend]);
    if (iL >= 0) groups.push(['book', iL, iL]);
    let n = 0;
    for (const [key, a, b] of groups){
      if (b < a) continue;
      const d = document.createElement('details'); d.className = 'fold48'; d.dataset.fold48 = key; d.open = !!P.open[key];
      const s = document.createElement('summary'); s.textContent = P.HEADS[key]; d.appendChild(s);
      d.addEventListener('toggle', () => { P.open[key] = d.open; });
      root.insertBefore(d, kids[a]);
      for (let i = a; i <= b; i++) d.appendChild(kids[i]);
      n++;
    }
    return n;
  };
  /* K25: a training button nobody can press goes after the live ones (the dead "+1 Melee" was first under every name). */
  P.sortPass = function(root){
    root = root || document.getElementById('camp-panel'); if (!root) return 0;
    let n = 0;
    root.querySelectorAll('.line, .line .mini').forEach(line => {
      const bs = [].filter.call(line.children, c => c.tagName === 'BUTTON'); if (bs.length < 2) return;
      const live = bs.filter(b => !b.disabled), deadB = bs.filter(b => b.disabled);
      if (!live.length || !deadB.length || bs.indexOf(deadB[0]) > bs.indexOf(live[live.length - 1])) return;
      const after = live[live.length - 1].nextSibling;
      deadB.forEach(b => { if (bs.indexOf(b) < bs.indexOf(live[live.length - 1])){ line.insertBefore(b, after); n++; } });
    });
    return n;
  };
  try {
    const rp = gl('renderPanel');
    if (typeof rp === 'function'){
      P._rp = function(){ const r = rp.apply(this, arguments); try { P.sortPass(); P.foldPass(); } catch (e) { console.warn('PHONE48 fold', e); } return r; };
      (0, eval)('renderPanel = window.PHONE48._rp');
    }
  } catch (e) { console.warn('PHONE48 wrap', e); }

  /* ---- K25: a mate in training reads "In training" on the Roster, not "Resting" ---- */
  function wrapStatus(){
    const C = window.CAMP31; if (!C || typeof C.statusOf !== 'function' || P._so) return;
    const so = P._so = C.statusOf;
    C.statusOf = function(p){ const r = so.apply(this, arguments);
      return p && !p.away && p.resting > 0 && p.trainingAt && r && /^Resting/.test(r.t) ? {t: r.t.replace(/^Resting/, 'In training'), c: r.c} : r; };
    if (typeof C.activity === 'function'){ const ac = P._ac = C.activity;   // the idle line too: no "Resting, and bored of it" for a mate at drill
      C.activity = function(p){ const a = ac.apply(this, arguments);
        if (!p || p.away || !(p.resting > 0) || !p.trainingAt || !/^(Rest|Sleep|Lying|Staring at the roof)/.test(String(a))) return a;
        let nm = ''; try { nm = facility(p.trainingAt).name; } catch (e) {}
        return nm ? 'In training at the ' + nm : 'In training'; }; }
  }
  try { wrapStatus(); } catch (e) { console.warn('PHONE48 status', e); }

  /* ---- Q19: the camp bar shows where it scrolls ---- */
  P.edgeFor = el => {   /* which ends hide more: {l, r}; 2 px slack */
    if (!el || !el.clientWidth || el.scrollWidth <= el.clientWidth + 2) return {l: false, r: false};
    return {l: el.scrollLeft > 2, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 2};
  };
  const chev = side => { let c = document.getElementById('chev48' + side); if (!c && document.body){ c = document.createElement('button');
      c.id = 'chev48' + side; c.type = 'button'; c.className = 'chev48 hidden'; c.textContent = side === 'r' ? '›' : '‹';
      c.setAttribute('aria-label', side === 'r' ? 'More to the right' : 'More to the left');
      c.onclick = () => { const tb = document.getElementById('topbar'); if (tb) tb.scrollBy({left: (side === 'r' ? 1 : -1) * tb.clientWidth * 0.7, behavior: 'smooth'}); setTimeout(() => P.edge(), 450); };
      document.body.appendChild(c); } return c; };
  P.edge = function(){
    const tb = document.getElementById('topbar'), on = !!(P.narrow() && tb && getComputedStyle(tb).display !== 'none');   /* the bar is fixed: no offsetParent */
    const e = on ? P.edgeFor(tb) : {l: false, r: false};
    if (tb){ tb.classList.toggle('p48l', e.l); tb.classList.toggle('p48r', e.r); }
    const rc = on ? tb.getBoundingClientRect() : null;
    for (const side of ['l', 'r']){ const c = chev(side); if (!c) continue; c.classList.toggle('hidden', !e[side]);
      if (e[side]){ c.style.top = rc.top + 'px'; c.style.height = rc.height + 'px'; c.style.left = side === 'l' ? rc.left + 'px' : (rc.right - 30) + 'px'; } }
    return e;
  };
  function hookBar(){
    const tb = document.getElementById('topbar'); if (!tb || tb.dataset.p48) return; tb.dataset.p48 = 1;
    tb.addEventListener('scroll', () => P.edge(), {passive: true});
    try { new MutationObserver(() => P.edge()).observe(tb, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']}); } catch (e) {}
  }
  try { window.addEventListener('resize', () => P.edge()); } catch (e) {}
  try { new MutationObserver(() => { hookBar(); P.edge(); }).observe(document.getElementById('screen-camp') || document.body, {attributes: true, attributeFilter: ['class']}); } catch (e) {}
  if (document.body) hookBar(); else document.addEventListener('DOMContentLoaded', hookBar);


  P.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const s0 = {nar: P._narrow, open: P.open};
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:10px;top:10px;z-index:200';
    try {
      P.open = {}; classes();
      box.innerHTML = '<button disabled data-tip="Drill: Not enough gold" style="width:120px;height:30px">Drill</button><span title="A live tip"><i>live</i></span>';
      document.body.appendChild(box);
      const b = box.firstChild, r = b.getBoundingClientRect(), sp = box.lastChild;
      ok('K18: a dead button is found by its box', P.find(r.left + 5, r.top + 5, box) === b);
      ok('K18: a live control is found from the touched child', P.find(-5, -5, sp.firstChild) === sp);
      ok('K18: the tip shows the reason', P.showFor(b, r.left + 5, r.top + 5) && tip && !tip.classList.contains('hidden') && tip.textContent === 'Drill: Not enough gold');
      ok('K18: a title becomes the tip text', P.showFor(sp, 50, 50) && tip.textContent === 'A live tip' && !sp.title);
      const tr = tip.getBoundingClientRect(); ok('K18: the tip stays on the screen', tr.left >= 0 && tr.right <= window.innerWidth + 1 && tr.top >= 0, tr.left + ',' + tr.top);
      P.hide(); ok('K18: hide', tip.classList.contains('hidden'));
      ok('K18: nothing without a tip', P.find(-5, -5, document.body) === null && P.showFor(document.createElement('b'), 1, 1) === false);
      ok('the body classes are on', ['phone48tips', 'phone48big', 'phone48hint'].every(c => document.body.classList.contains(c)));
      /* K19 */
      const mk = () => { const d = document.createElement('div');
        d.innerHTML = '<h2>Barracks</h2><div class="desc">About.</div><div class="desc">Training here: drills.</div><div class="line">Hal <button>Drill</button></div><div class="line">Pinch</div>'
          + '<div class="desc">Practice Bout. Try it.</div><div class="mini"><button>a</button></div><button class="btn gold">START THE BOUT</button><div data-book33="1">Loadout.</div><div><button class="btn">PULL DOWN</button></div>';
        return d; };
      P._narrow = true; let d = mk();
      ok('K19: three folds at phone width', P.foldPass(d) === 3 && d.querySelectorAll(':scope > details.fold48').length === 3);
      const f = k => d.querySelector('details[data-fold48="' + k + '"]');
      ok('K19: each part sits under its own heading', f('train').querySelectorAll('.line').length === 2 && f('bout').querySelector('button.btn.gold') && f('book').querySelector('[data-book33]') && f('train').firstChild.textContent === 'Training and drills');
      ok('K19: the rest stays outside', d.firstChild.tagName === 'H2' && d.lastChild.querySelector('button').textContent === 'PULL DOWN' && d.children[1].textContent === 'About.');
      ok('K19: all closed at first; a second pass adds nothing', !f('train').open && !f('bout').open && !f('book').open && P.foldPass(d) === 0);
      P.open.book = true; d = mk(); P.foldPass(d);
      ok('K19: an opened heading stays open on a redraw', f('book').open && !f('train').open);
      P._narrow = false; d = mk(); ok('K19: nothing at desktop width', P.foldPass(d) === 0 && !d.querySelector('details'));
      d = document.createElement('div'); d.innerHTML = '<h2>Smithy</h2><div class="desc">Training here: x</div><div class="line">a</div>';
      ok('K19: a short panel is left alone', P.foldPass(d) === 0);
      if (window.CAMP31 && CAMP31.statusOf){ const m = {resting: 1, trainingAt: 'barracks'};
        ok('K25: a mate in training reads In training, a resting one Resting', /^In training, 1 season$/.test(CAMP31.statusOf(m).t) && /^Resting, 2 seasons$/.test(CAMP31.statusOf({resting: 2}).t) && CAMP31.statusOf({}).t === 'Ready', CAMP31.statusOf(m).t); }
      { const l = document.createElement('div'); l.innerHTML = '<div class="line"><span>Hal</span><button disabled>+1 Melee</button><button>Drill A</button><button disabled>Drill B</button><button>Drill C</button><div class="plaque">x</div></div><div class="line"><button disabled>only</button></div>';
        const n = P.sortPass(l), order = [].map.call(l.firstChild.children, c => c.textContent).join(',');
        ok('K25: dead training buttons go after the live ones', n === 2 && order === 'Hal,Drill A,Drill C,+1 Melee,Drill B,x' && P.sortPass(l) === 0, order); }

      { const bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:0;top:0;width:200px;overflow-x:auto;display:flex;white-space:nowrap';
        bar.innerHTML = '<span style="flex:0 0 500px">words</span>'; document.body.appendChild(bar);
        let e = P.edgeFor(bar); ok('Q19: a bar with more to the right shows the right hint only', e.r && !e.l);
        bar.scrollLeft = 120; e = P.edgeFor(bar); ok('Q19: in the middle, both ends', e.r && e.l);
        bar.scrollLeft = 9999; e = P.edgeFor(bar); ok('Q19: at the end the right hint goes', !e.r && e.l);
        bar.firstChild.style.flex = '0 0 150px'; e = P.edgeFor(bar); ok('Q19: a bar that fits shows none', !e.r && !e.l);
        bar.remove(); }
      ok('renderPanel is wrapped', typeof P._rp === 'function' && typeof gl('renderPanel') === 'function');
    } catch (e) { ok('no throw', false, e.message); }
    finally { box.remove(); P.hide(); P._narrow = s0.nar; P.open = s0.open; classes(); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };

  if (document.body) classes(); else document.addEventListener('DOMContentLoaded', classes);
})();
