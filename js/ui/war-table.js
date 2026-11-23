/* ============================================================================
   INDEX WT48 - F-48 B5 and T1 (Patrick 2026-11-15, UX review shots 02 and 13)
   B5. ONE CAMP BAR, ONE SET OF NAMES (WT48)
     - The word bar (CAMP31: War Table, Build, Armoury, Barracks, Chronicle)
       always shows in camp. Cause of the old bar coming back: show() drew the
       top bar before startCamp() had switched the camp on, so CAMP31 stood
       aside. The bar is now drawn again once the camp is on.
     - "Planning Table" is "War Table" everywhere the player reads it: the
       screen title, buttons, panels, the manual, tips, toasts, key hints and
       the camp labels. Page text is renamed as it is drawn (text, title and
       data-tip); the few canvas strings are renamed at their source through
       WT48.n(). Save data is not touched.
     INT-1 group 11: no switch.
   T1. A PROMOTE BUTTON ON FIELD PROMOTION (PROMO48)
     - Each Squad Mate card under Field Promotion (and under "An Officer Takes
       Command") gets a gold "Promote <name>" button. The card itself is no
       longer the control, so a stray click cannot promote anyone.
     - The line under the heading already reads in plain words ("Choose a Squad
       Mate to lead the squad"), so no wording changes here.
     INT-1 group 11: no switch.
============================================================================ */
(function(){
  'use strict';
  const W = window.WT48 = {};
  const P = window.PROMO48 = {};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const RX = /planning table/i, RXG = /planning table/gi;
  const swap = m => m === m.toUpperCase() ? 'WAR TABLE' : (m[0] === 'P' ? 'War ' : 'war ') + (m[9] === 'T' ? 'Table' : 'table');

  /* the one naming function; canvas text calls it at the source */
  W.n = function(s){ return typeof s === 'string' && RX.test(s) ? s.replace(RXG, swap) : s; };

  /* ---- page text, renamed as it is drawn ---- */
  const ATTRS = ['title', 'data-tip'];
  function fixText(n){ const v = n.nodeValue; if (v && RX.test(v)) n.nodeValue = v.replace(RXG, swap); }
  function fixEl(el){
    if (el.nodeType === 3) return fixText(el);
    if (el.nodeType !== 1 || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    if (RX.test(el.textContent || '')){
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) { const pt = n.parentNode && n.parentNode.tagName; if (pt !== 'SCRIPT' && pt !== 'STYLE') fixText(n); }
    }
    const withAttr = [el].concat([].slice.call(el.querySelectorAll('[title*="lanning table" i],[data-tip*="lanning table" i],[title*="LANNING TABLE"],[data-tip*="LANNING TABLE"]')));
    for (const e of withAttr) for (const a of ATTRS){ const v = e.getAttribute && e.getAttribute(a); if (v && RX.test(v)) e.setAttribute(a, v.replace(RXG, swap)); }
  }
  W.sweep = function(){ if (document.body) fixEl(document.body); };
  let mo = null;
  function watch(){
    if (mo || !document.body || typeof MutationObserver === 'undefined') return;
    mo = new MutationObserver(list => {
      for (const m of list){
        if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes'){ const v = m.target.getAttribute(m.attributeName); if (v && RX.test(v)) m.target.setAttribute(m.attributeName, v.replace(RXG, swap)); }
        else for (const n of m.addedNodes) fixEl(n);
      }
    });
    mo.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  }

  /* ---- names held as data: camp labels and the Command Deck ---- */
  const OLD = {};
  function data(){
    try {
      const H = gl('HOLDINGS');
      if (H) for (const k of Object.keys(H)){ const h = H[k]; if (!h || typeof h.houseSub !== 'string') continue;
        if (!(('h.' + k) in OLD)) OLD['h.' + k] = h.houseSub;
        h.houseSub = W.n(OLD['h.' + k]); }
      const D = window.DECK;
      if (D && D.CACTS) D.CACTS.forEach((a, i) => { if (typeof a[3] !== 'string') return; if (!(('a.' + i) in OLD)) OLD['a.' + i] = a[3]; a[3] = W.n(OLD['a.' + i]); });
      if (D && D.CAMPKEYS) D.CAMPKEYS.forEach((s, i) => { if (typeof s !== 'string') return; if (!(('k.' + i) in OLD)) OLD['k.' + i] = s; D.CAMPKEYS[i] = W.n(OLD['k.' + i]); });
    } catch (e) { console.warn('WT48 data', e); }
  }

  /* the label painted over the Chapter House */
  try {
    const cl = gl('campLabel');
    if (typeof cl === 'function'){
      W._cl = function(x, y, title, sub){ return cl.call(this, x, y, W.n(title), W.n(sub)); };
      (0, eval)('campLabel = window.WT48._cl');
    }
  } catch (e) { console.warn('WT48 campLabel', e); }

  /* ---- the word bar always shows: draw it again once the camp is on ---- */
  W.oldBar = function(){ const tb = document.getElementById('topbar'); return !!(tb && !tb.classList.contains('hidden') && tb.querySelector('button.tb[onclick="openTable()"]')); };
  W.rebar = function(){
    try {
      const C = window.CAMP31, M = gl('META'), CA = gl('CAMP');
      if (!C || !M || !M.leader || gl('G') || !CA || !CA.on) return false;
      const st = gl('inStoryNow'); if (typeof st === 'function' && st()) return false;
      if (!W.oldBar()) return false;
      gl('renderTopbar')(); return true;
    } catch (e) { console.warn('WT48 rebar', e); return false; }
  };
  try {
    const sc = gl('startCamp');
    if (typeof sc === 'function'){
      W._sc = function(){ const r = sc.apply(this, arguments); W.rebar(); return r; };
      (0, eval)('startCamp = window.WT48._sc');
    }
  } catch (e) { console.warn('WT48 startCamp', e); }

  /* ---- T1: the Promote button ---- */
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
  P.dress = function(root){
    root = root || document.getElementById('debrief-inner'); if (!root) return 0;
    const M = gl('META'); let n = 0;
    root.querySelectorAll('.card[onclick^="fieldPromote("]').forEach(card => {
      const m = /fieldPromote\((\d+)\)/.exec(card.getAttribute('onclick') || ''); if (!m) return;
      const i = +m[1], p = M && M.roster && M.roster[i]; if (!p) return;
      card.removeAttribute('onclick'); card.classList.add('static'); card.dataset.promo48 = String(i);
      const b = document.createElement('div'); b.className = 'promo48'; b.style.cssText = 'margin-top:8px;text-align:center';
      b.innerHTML = `<button class="btn gold small" onclick="event.stopPropagation();fieldPromote(${i})">Promote ${E(p.name)}</button>`;
      card.appendChild(b); n++;
    });
    return n;
  };
  try {
    const rd = gl('renderDebrief');
    if (typeof rd === 'function'){
      P._rd = function(){ const r = rd.apply(this, arguments); try { P.dress(); } catch (e) { console.warn('PROMO48', e); } return r; };
      for (const k of Object.keys(rd)) P._rd[k] = rd[k];
      Object.defineProperty(P._rd, 'last', {get(){ return rd.last; }, set(v){ rd.last = v; }, configurable: true});
      (0, eval)('renderDebrief = window.PROMO48._rd');
    }
  } catch (e) { console.warn('PROMO48 wrap', e); }

  W.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    try {
      ok('names: all four cases', W.n('PLANNING TABLE') === 'WAR TABLE' && W.n('The Planning Table') === 'The War Table' && W.n('Planning table (P)') === 'War table (P)' && W.n('P planning table') === 'P war table');
      ok('names: other text untouched', W.n('Quartermaster') === 'Quartermaster' && W.n(null) === null);
      const d = document.createElement('div'); d.innerHTML = '<h1>The Planning Table</h1><button title="Choose on the planning table">GO TO THE PLANNING TABLE</button>';
      fixEl(d);
      ok('page text and titles renamed', d.innerHTML === '<h1>The War Table</h1><button title="Choose on the war table">GO TO THE WAR TABLE</button>', d.innerHTML);
      data();
      const H = gl('HOLDINGS'); if (H) ok('camp label data renamed', !Object.keys(H).some(k => RX.test(H[k].houseSub || '')));
      if (window.DECK && DECK.CACTS) ok('Command Deck names renamed', !DECK.CACTS.some(a => RX.test(a[3] || '')) && !(DECK.CAMPKEYS || []).some(s => RX.test(s)));
      ok('startCamp and campLabel are wrapped', gl('startCamp') === W._sc && gl('campLabel') === W._cl);
      /* T1 */
      const M = gl('META');
      if (M && M.roster){
        const r0 = M.roster; M.roster = [{name: 'Ada <b>'}, {name: 'Bo'}];
        try {
          const box = document.createElement('div');
          box.innerHTML = '<div class="card" onclick="fieldPromote(0)">a</div><div class="card" onclick="fieldPromote(1)">b</div><div class="card" onclick="officerFromDebrief(0)">c</div>';
          const n = P.dress(box), bs = box.querySelectorAll('.promo48 button');
          ok('a Promote button on each mate card', n === 2 && bs.length === 2 && bs[0].textContent === 'Promote Ada <b>' && bs[1].getAttribute('onclick').indexOf('fieldPromote(1)') >= 0, bs.length);
          ok('the card is no longer the control', !box.querySelector('.card[onclick^="fieldPromote"]') && box.querySelector('.card[onclick^="officerFromDebrief"]'));
        } finally { M.roster = r0; }
      }
      ok('renderDebrief is wrapped', typeof P._rd === 'function' && typeof gl('renderDebrief') === 'function');   // a later wrapper may sit on top
    } catch (e) { ok('no throw', false, e.message); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };

  const go = () => { data(); watch(); W.sweep(); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
