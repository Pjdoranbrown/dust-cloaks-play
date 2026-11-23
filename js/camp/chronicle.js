/* ============================================================================
   INDEX C25 - F-25 "The Chronicle": the Scribe's book (Art & Interface)
   The MANUAL buttons and the M key now open the Chapter Scribe's book, The
   Chronicle, which has two tabs: Chronicle (the history, openChronicle) and
   Manual (the rules, openManual). Clicking the Scribe in camp opens the same
   book. Nothing is saved; no save slot changes.
   Entry point: window.openScribeBook(tab)  tab = 'chronicle' (default) | 'manual' | a page in C25.pages.
   C25.pages: more tabs, {id: {label, html(), on()}} (F-34 step 6 adds Field Notes); html() returns the whole parchment and
   can call C25.strip(id) for the tab strip. C25.strip(active, forManual) is the strip.
   No switch (removed in INT-1, 2026-11-15). Remove the script tag to get the old direct calls back.
============================================================================ */
(function(){
  'use strict';
  const C25 = window.CHRONICLE25 = {};
  const STRIP_STYLE = 'display:flex;gap:0;margin:0 0 -1px 22px;position:relative;z-index:1';
  function strip(active, forManual){
    const tab = (id, label, fn) => {
      const on = id === active;
      return '<button type="button" data-c25="' + id + '" onclick="' + fn + '" style="font:bold 15px Georgia;padding:7px 18px;min-height:36px;cursor:pointer;border:2px solid #8a6d3a;border-bottom:' + (on ? '2px solid #efe3c8' : '2px solid #8a6d3a') +
        ';border-radius:6px 6px 0 0;margin-right:4px;background:' + (on ? '#efe3c8' : '#c9b588') + ';color:' + (on ? '#2a2218' : '#5a4a2a') + '"' + (on ? ' aria-current="page"' : '') + '>' + label + '</button>';
    };
    const wrap = forManual ? 'display:flex;gap:0;padding:10px 20px 0;border-bottom:2px solid #8a6d3a;margin:-4px -4px 14px;flex-wrap:wrap' : STRIP_STYLE + ';flex-wrap:wrap';
    return '<div class="c25-tabs" style="' + wrap + '">' + tab('chronicle', 'Chronicle', "openScribeBook('chronicle')") + tab('manual', 'Manual', "openScribeBook('manual')") +
      Object.keys(C25.pages).filter(pageOn).map(id => tab(id, C25.pages[id].label, "openScribeBook('" + id + "')")).join('') + '</div>';
  }
  C25.pages = {};
  C25.page = null;
  const pageOn = id => { const p = C25.pages[id]; return !!p && (typeof p.on !== 'function' || p.on()); };
  C25.strip = strip;
  window.openScribeBook = function(tab){
    if (window.__c25ready && pageOn(tab)){
      openChronicle(); C25.page = tab; chronicleRender();   // C25.page: a later chronicleRender (a portrait load) keeps the page
      return;
    }
    tab = tab === 'manual' ? 'manual' : 'chronicle';
    if (!window.__c25ready){ return tab === 'manual' ? openManual() : openChronicle(); }
    if (tab === 'manual'){
      if (typeof closeChronicle === 'function') closeChronicle();
      openManual();
    } else {
      openChronicle();
    }
  };
  function install(){
    if (window.__c25ready || typeof chronicleHTML !== 'function' || typeof openManual !== 'function') return;
    const ch = chronicleHTML;
    chronicleHTML = function(){
      const h = ch();
      const k = '<div style="padding:14px 22px 6px;display:flex;gap:14px;align-items:center;border-bottom:1px solid #b89a5a">';
      const i = h.indexOf(k);
      return i < 0 ? h : h.slice(0, i) + strip('chronicle', false) + h.slice(i);
    };
    const cr = chronicleRender;
    chronicleRender = function(){
      if (C25.page && pageOn(C25.page)){ const el = document.getElementById('chronicle'); if (el) el.innerHTML = C25.pages[C25.page].html(); return; }
      return cr.apply(this, arguments);
    };
    const oc = openChronicle;
    openChronicle = function(){ C25.page = null; return oc.apply(this, arguments); };
    const om = openManual;
    openManual = function(){
      om.apply(this, arguments);
      const inner = document.getElementById('manual-inner'); if (!inner || inner.querySelector('.c25-tabs')) return;
      inner.insertAdjacentHTML('afterbegin', strip('manual', true));
    };
    window.__c25ready = true;
  }
  C25.selfTest = function(){
    const fails = [], ck = (ok, m) => { if (!ok) fails.push(m); };
    ck(typeof window.openScribeBook === 'function', 'openScribeBook missing');
    try {
      const html = chronicleHTML();
      ck(/data-c25="chronicle"/.test(html) && /data-c25="manual"/.test(html), 'Chronicle tab strip missing');
      ck(/aria-current="page"[^>]*>Chronicle</.test(html), 'Chronicle tab not marked current');
    } catch (e) { fails.push('chronicleHTML threw ' + e.message); }
    ck(!/>MANUAL</.test(typeof renderTopbar === 'function' ? String(renderTopbar) : ''), 'a MANUAL button is still in renderTopbar');
    return {ok: !fails.length, fails: fails};
  };
  window.addEventListener('load', install);
})();
