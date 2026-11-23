/* ============================================================================
   INDEX BUGS48 - F-48 UX review bugs B2, B3, B6, B7 (Backlog Worker, 2026-11-15;
   released by the Lead Programmer). Wrappers only; nothing in index.html changes
   but this file's script tag.
   B2  The dead Leader's report card kept looking up META.leader, so after a
       Field Promotion it showed the new Leader's face. The card of a dead
       Leader is now drawn as it was before the promotion.
   B3  The aim line no longer names a page flag ("click orders: add ?f33=1") and
       shows once: the small line under the top-right panel stays, the copy in
       the log at the start of a contract goes.
   B6  The camp toast (for example "Tamsin hired for 30gp. Treasury 102gp")
       faded by a CSS transition only; where the transition did not run it
       stayed for good. It is now hidden outright when its time is up, and at
       once when the screen changes or a contract starts.
   B7  No season tip in the tavern brawl or the drill yard (indoors, and no
       season rule applies there). On a contract the tip already reads the
       campaign clock (the same date the camp shows); selfTest holds it there.
   Second batch (released by the Art lead):
   B4  Cayde's camp speech box stayed over a panel or screen opened after it
       (it covered the contract cards). It now closes when one opens. A box
       raised while a panel is already open (his goodbye) stays.
   B8  Leader builder under 980 px wide: the live card stuck to the top and
       covered the choice cards. It now scrolls with the page there.
   T4  The dice tray on the field report (Injury Checks and the like) let the
       report text show through the dice. Its backdrop is now near solid there.
   INT-1 group 10: no switch (BUGS48.on/set baked in; the body class stays for the CSS).
============================================================================ */
(function(){
  'use strict';
  const B = window.BUGS48 = {};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const SEASON_TIP = /^(Spring|Summer|Autumn|Winter): /;
  const indoors = g => !!(g && (g.obj === 'brawl' || g.obj === 'drill'));

  /* ---- B2: the dead Leader's card keeps its own face ---------------------- */
  const U = window.DEBRIEF31UI;
  if (U && typeof U.cardHTML === 'function'){ const f = U.cardHTML;
    U.cardHTML = function(c){
      const M = gl('META');
      if (!(c && c.leader && c.outcome === 'dead' && M && M.leader && M.leader.name !== c.name)) return f.apply(this, arguments);
      const L = M.leader; M.leader = null;          // as it stood when the card was first drawn (the Leader slot is empty until the promotion)
      try { return f.apply(this, arguments); } finally { M.leader = L; }
    };
  }

  /* ---- B3: the aim line, in player words, once ---------------------------- */
  const MD = window.MODE43;
  if (MD && typeof MD.text === 'function'){ const f = MD.text;
    MD.text = function(){
      const t = f.apply(this, arguments);
      return String(t).replace(/\s*\(click orders: add \?f33=1\)/, '');
    };
  }

  /* ---- B3 and B7: notes dropped at the start of a contract ----------------- */
  let starting = false;
  B.dropNote = function(t, g){
    if (typeof t !== 'string') return false;
    if (starting && /^AIM (AUTO|MANUAL): /.test(t)) return true;              // B3: the HUD line already says it
    if (starting && indoors(g) && SEASON_TIP.test(t)) return true;            // B7: no season tip indoors
    return false;
  };
  if (typeof gl('note') === 'function'){
    window.BUGS48._note0 = gl('note');
    window.BUGS48._note = function(t){ if (B.dropNote(t, gl('G'))) return; return window.BUGS48._note0.apply(this, arguments); };
    (0, eval)('note = window.BUGS48._note');
  }
  if (typeof gl('startDeployment') === 'function'){
    window.BUGS48._sd0 = gl('startDeployment');
    window.BUGS48._sd = function(){
      const was = starting; starting = true;
      try { return window.BUGS48._sd0.apply(this, arguments); }
      finally { starting = was; try { B.hideNote(); } catch (e) {} }          // B6: a camp toast does not follow the squad to the field
    };
    (0, eval)('startDeployment = window.BUGS48._sd');
  }

  /* ---- B6: the camp toast times out for real, and goes on a screen change -- */
  const noteEl = () => document.getElementById('camp-note');
  B.screenKey = function(){
    const s = document.querySelector('.screen:not(.hidden)');
    return (s ? s.id : '') + '|' + (gl('G') ? 'field' : 'camp');
  };
  B.hideNote = function(){
    const el = noteEl(); if (!el) return false;
    clearTimeout(B._t); B._key = null;
    el.style.opacity = '0'; el.style.visibility = 'hidden';
    return true;
  };
  B.LIFE = 4700;   // the base fade starts at 4200 ms and takes 400 ms
  if (typeof gl('campNote') === 'function'){
    const f = gl('campNote');
    window.BUGS48._cn = function(){
      const r = f.apply(this, arguments);
      try {
        const el = noteEl();
        if (el){
          el.style.visibility = '';
          clearTimeout(B._t); B._key = null;
          B._t = setTimeout(B.hideNote, B.LIFE);
          setTimeout(() => { if (el.style.visibility !== 'hidden') B._key = B.screenKey(); }, 60);   // after the click that raised it has settled
        }
      } catch (e) {}
      return r;
    };
    for (const k of Object.keys(f)) window.BUGS48._cn[k] = f[k];   // keeps ux.js's "already hooked" mark
    (0, eval)('campNote = window.BUGS48._cn');
  }
  setInterval(() => { try { if (B._key && B.screenKey() !== B._key) B.hideNote(); } catch (e) {} }, 300);

  /* ---- B8, T4: two style rules, on while body has the class ------------------ */
  document.head.appendChild(Object.assign(document.createElement('style'), {id: 'bugs48-css', textContent:
    '@media (max-width:980px){body.bugs48 #ldr-live{position:relative !important;top:auto !important}}' +
    'body.bugs48:has(#screen-debrief:not(.hidden)) #dice-tray.show{background:radial-gradient(ellipse at center, rgba(20,10,4,.95), rgba(10,5,2,.97))}'}));

  /* ---- B4: Cayde's camp box closes when a panel or screen opens -------------- */
  B.openKey = function(){
    const s = document.querySelector('.screen:not(.hidden)'), p = document.getElementById('camp-panel'), C = gl('CAMP');
    const panel = p && !p.classList.contains('hidden') ? 'panel:' + ((C && C.panel) || 1) : '';
    return (s ? s.id : '') + '|' + panel;
  };
  B.cgTick = function(){
    const d = document.getElementById('cg-box'); if (!d) return false;
    const k = B.openKey();
    if (d.dataset.b48 == null){ d.dataset.b48 = k; return false; }      // first sight: what was open when he spoke
    if (k === d.dataset.b48) return false;
    if (k === '|'){ d.dataset.b48 = k; return false; }                  // something closed: he stays
    d.remove(); return true;                                             // something opened after he spoke
  };
  setInterval(() => { try { B.cgTick(); } catch (e) {} }, 200);

  { const cls = () => document.body.classList.add('bugs48'); if (document.body) cls(); else document.addEventListener('DOMContentLoaded', cls); }

  B.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const was = starting;
    try {
      /* B3 */
      if (MD){
        const F33 = window.F33, a0 = F33 ? F33.clicks : undefined;
        try { if (F33) F33.clicks = false; ok('B3: the aim line names no page flag', !/\?f33|click orders/.test(MD.text()) && /^AIM AUTO/.test(MD.text()), MD.text()); }
        finally { if (F33) F33.clicks = a0; }
        starting = true; ok('B3: the log copy is dropped at the start', B.dropNote(MD.text() + '.', {obj: 'hunt'}));
        starting = false; ok('B3: a later aim note is kept', !B.dropNote(MD.text() + '.', {obj: 'hunt'}));
      }
      /* B7 */
      starting = true;
      ok('B7: no season tip in the brawl', B.dropNote('Autumn: sleeping camps notice the squad from 10% nearer.', {obj: 'brawl'}));
      ok('B7: no season tip in the drill yard', B.dropNote('Summer: ground fires burn 25% longer.', {obj: 'drill'}));
      ok('B7: the tip stays on a contract', !B.dropNote('Summer: ground fires burn 25% longer.', {obj: 'hunt'}));
      ok('B7: other notes stay in the brawl', !B.dropNote('The room goes quiet.', {obj: 'brawl'}));
      starting = false;
      try {
        const cs = gl('currentSeason'), sn = gl('seasonName'), story = gl('inStoryNow');
        if (typeof cs === 'function' && typeof sn === 'function' && gl('META') && !window.SEASON_FORCE && !(story && story()))
          ok('B7: the tip season is the camp date', String(sn()).toLowerCase().indexOf(cs()) === 0, sn() + ' / ' + cs());
      } catch (e) {}
      /* B2 */
      if (U){
        const M = gl('META');
        if (M && M.leader){
          const seen = [], pu0 = gl('portraitURL');
          if (typeof pu0 === 'function'){
            window.BUGS48._pu = function(p){ seen.push(p); return pu0.apply(this, arguments); };
            (0, eval)('portraitURL = window.BUGS48._pu');
            try {
              const card = {id: 'leader', name: 'Fallen Test', race: 'HUMAN', spec: M.leader.spec, leader: true, kills: 0, down: true, outcome: 'dead', injury: null, gains: {}, moment: 'fell', moments: ['fell']};
              U.cardHTML(card, 0);
              ok('B2: the dead Leader card does not use the new Leader', seen.length && seen.every(p => p !== M.leader), seen.map(p => p && p.name).join());
              ok('B2: META.leader is put back', gl('META').leader === M.leader);
              seen.length = 0; U.cardHTML(Object.assign({}, card, {name: M.leader.name, outcome: 'unhurt'}), 0);
              ok('B2: a living Leader card still uses the Leader', seen.includes(M.leader));
            } finally { window.BUGS48._pu0 = pu0; (0, eval)('portraitURL = window.BUGS48._pu0'); }
          }
        }
      }
      /* B6 */
      if (typeof gl('campNote') === 'function'){
        gl('campNote')('BUGS48 test note');
        const el = noteEl();
        ok('B6: a new note shows', el && el.style.visibility !== 'hidden' && el.style.opacity === '1');
        ok('B6: its timer is set', !!B._t);
        B.hideNote();
        ok('B6: a timed-out note is hidden outright', el && el.style.visibility === 'hidden' && el.style.opacity === '0');
        gl('campNote')('BUGS48 test note 2');
        ok('B6: the next note shows again', el && el.style.visibility !== 'hidden');
        B.hideNote();
      }
      /* B4 */
      { const old = document.getElementById('cg-box'), k0 = B.openKey;
        try {
          if (old) old.remove();
          const mk = () => { const d = document.createElement('div'); d.id = 'cg-box'; d.style.display = 'none'; document.body.appendChild(d); return d; };
          let key = '|'; B.openKey = () => key;
          let d = mk(); B.cgTick();
          ok('B4: the box stays while nothing opens', !B.cgTick() && !!document.getElementById('cg-box'));
          key = '|panel:fire'; ok('B4: opening a panel closes it', B.cgTick() && !document.getElementById('cg-box'));
          key = '|panel:master'; d = mk(); B.cgTick();
          ok('B4: a box raised in an open panel stays', !B.cgTick() && !!document.getElementById('cg-box'));
          key = '|'; B.cgTick(); key = 'screen-table|';
          ok('B4: then opening a screen closes it', B.cgTick() && !document.getElementById('cg-box'));
        } finally { B.openKey = k0; const d = document.getElementById('cg-box'); if (d) d.remove(); if (old) document.body.appendChild(old); }
      }
      /* B8, T4 */
      { const css = (document.getElementById('bugs48-css') || {}).textContent || '';
        ok('B8: the live card is not sticky under 980 px', /max-width:980px\)\{body\.bugs48 #ldr-live\{position:relative/.test(css));
        ok('T4: the report dice tray has a near-solid backdrop', /#screen-debrief:not\(\.hidden\)\) #dice-tray\.show/.test(css));
        ok('the switch class is on the body', document.body.classList.contains('bugs48')); }
    } catch (e) { ok('no throw', false, e.message); }
    finally { starting = was; }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
