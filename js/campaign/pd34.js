/* INDEX PD34: PD-34 detachments and officers teach on the main board, not on the road (audits/f45-pd-specs.md section 5).
   - The road's Night 6 and Night 8 "New today" lines (detachment, promote) are gone (js/tutorial/act4.js D.OPEN, D.NEW).
   - After the Founding, on the Planning Table (renderTable), each card shows once per save (META.pd34):
     'officers' (S49) the first time a Squad Mate can be promoted (canPromote: 2+ Advancements, the Command Tent, a free
       officer place);
     'detachment' (S47) the first time the squad could split: D1 is done (FIRST48.isFirst() false), an officer is home,
       and two or more Squad Mates are free to go with them. It points at the Detachments scroll (#tbl-detach).
   - Words: the T45 cards 'officers' and 'detachment' (CAMPAIGN_LINES.lessons). Self-test: PD34.selfTest(). */
(function(){
  'use strict';
  if (!window.T45 || typeof renderTable !== 'function') return;
  const P = window.PD34 = {};
  P.st = () => (META.pd34 = META.pd34 || {});
  P.main = function(){
    try { if (!META || !META.leader) return false;
      if (window.F34 && F34.active()) return false;
      if (typeof inStoryNow === 'function' && inStoryNow()) return false;
      return true; } catch (e) { return false; }
  };
  P.free = p => !!(p && !p.away && !p.resting && !(typeof busy === 'function' && busy(p)));
  P.canOfficer = () => { try { return META.roster.some(p => canPromote(p)); } catch (e) { return false; } };
  P.canSplit = function(){
    try {
      if (window.FIRST48 && FIRST48.isFirst()) return false;                       // D1 first (Q15)
      const O = (typeof officers === 'function' ? officers() : []).filter(P.free);
      return O.length > 0 && META.roster.filter(P.free).length >= 2 && (META.board || []).length >= 2;
    } catch (e) { return false; }
  };
  // which card is due now (officers first)
  P.due = function(){
    if (!P.main()) return null;
    const s = P.st();
    if (!s.off && P.canOfficer()) return 'officers';
    if (!s.det && P.canSplit()) return 'detachment';
    return null;
  };
  /* K82 (UX f48): the card pointed at #tbl-detach while another tab was open (display:none), so it sat centred over the tab
     bar and covered the Detachments tab. Now the Detachments tab is opened first (a click, so every tab handler runs) and the
     card points at its scroll, beside it, off the tab bar. If the scroll is still hidden, it points at the tab itself. */
  P.openDetach = function(){
    const tab = document.querySelector('button[data-tab="detach"]'), sc = document.getElementById('tbl-detach');
    try { if (tab && sc && !sc.getBoundingClientRect().width) tab.click(); } catch (e) { console.warn('PD34 tab', e); }
    if (sc && sc.getBoundingClientRect().width){
      try { if (sc.getBoundingClientRect().top > window.innerHeight * 0.5) sc.scrollIntoView({block: 'start'}); } catch (e) {}   // it can open below the fold
      return sc; }
    return tab || sc;
  };
  P.show = function(){
    const id = P.due(); if (!id) return false;
    const s = P.st(); if (id === 'officers') s.off = true; else s.det = true;
    try { saveMeta(); } catch (e) {}
    setTimeout(() => { try { T45.lesson(id, {el: id === 'detachment' ? P.openDetach() : null}); } catch (e) { console.warn('PD34 lesson', e); } }, 0);
    return id;
  };
  { const f = renderTable; renderTable = function(){
      const r = f.apply(this, arguments);
      try { P.show(); } catch (e) { console.warn('PD34', e); }
      return r; };
    window.renderTable = renderTable; }

  /* ---- self-test: PD34.selfTest() (stubs; META and the globals are put back) ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, c, x) => rows.push({n, ok: !!c, x});
    const sv = {M: META, slot: window.F34 && F34.slotNow, save: saveMeta, first: window.FIRST48 && FIRST48.isFirst};
    try {
      META = freshMeta(); saveMeta = () => {}; if (window.F34) F34.slotNow = 'elsewhere';
      META.leader = {name: 'Hal', level: 3, spec: 'SOLDIER', race: 'HUMAN', cls: 'FREEMAN'};
      META.board = [{obj: 'hunt'}, {obj: 'rescue'}, {obj: 'extract'}];
      const mk = (id, adv) => ({id, name: 'M' + id, adv, spec: 'SOLDIER'});
      META.roster = [mk(1, 0), mk(2, 1), mk(3, 0)]; META.officers = [];
      if (window.FIRST48) FIRST48.isFirst = () => false;
      ok('nothing due without a promotable mate or an officer', P.due() === null);
      if (window.D45) ok('the road: no detachment or promote step', !('detachment' in D45.OPEN) && !('promote' in D45.OPEN) && !Object.values(D45.NEW).flat().some(k => k === 'detachment' || k === 'promote'));
      META.facilities.command = 1; META.roster[1].adv = 2;
      ok('officers: due when a mate can be promoted (2 Advancements, the Command Tent)', P.due() === 'officers');
      P.st().off = true; META.roster[1].adv = 1;
      META.officers = [{id: 9, name: 'Sera', level: 2}];
      if (window.FIRST48) FIRST48.isFirst = () => true;
      ok('detachment waits for D1', P.due() === null);
      if (window.FIRST48) FIRST48.isFirst = () => false;
      ok('detachment: an officer home and two free mates', P.due() === 'detachment');
      META.officers[0].away = 'det'; ok('not while the officer is away', P.due() === null); delete META.officers[0].away;
      META.roster = [mk(1, 0)]; ok('not with one free mate', P.due() === null);
      META.roster = [mk(1, 0), mk(2, 0)]; P.st().det = true; ok('once per save', P.due() === null);
      P.st().det = false; if (window.F34){ F34.slotNow = SAVE_KEY; META.f34 = {beat: 3, log: []}; ok('not in the Founding', !F34.active() || P.due() === null); }
    } catch (e) { ok('no throw: ' + e.message, false, String(e.stack).slice(0, 300)); }
    finally { META = sv.M; saveMeta = sv.save; if (window.F34) F34.slotNow = sv.slot; if (window.FIRST48) FIRST48.isFirst = sv.first; }
    const pass = rows.filter(r => r.ok).length;
    return {pass, total: rows.length, rows: rows.filter(r => !r.ok)};
  };
})();
