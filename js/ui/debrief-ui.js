/* ============================================================================
   INDEX D31UI: F-31.3 "After the contract", the screen (Art & Interface, 2026-11-13)
   Draws what js/ui/debrief.js records (DEBRIEF31.cards()) on the Field Report:
   a header with pay, Treasury and spoils, then one card per deployed mate (the Leader first):
   kills, outcome (unhurt, recovered, rests, maimed with the injury, dead), gains (Advancement, Level,
   XP tick, Luck burned) and one moment line from STORY.momentLine. The old report log stays below.
   The Scribe's line (STORY.chronicleLine) is written onto the contract's Chronicle entry and shown
   with it in the Chronicle and under the cards.
   Wrapper only: renderDebrief, endDeployment, startDeployment, chronText. Nothing in index.html is edited.
   Load it after js/ui/debrief.js, last among the scripts that wrap endDeployment.
   No switch (removed in INT-1, 2026-11-15). Delete the file and its tag for the old report.
   Self-test: DEBRIEF31UI.selfTest() -> {ok, fails}.
============================================================================ */
(function(){
  'use strict';
  const U = window.DEBRIEF31UI = {fresh: null};
  const $i = id => document.getElementById(id);
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const OUT = {unhurt: ['Unhurt', '#2e6b2e'], recovered: ['Went down, got up', '#9a6a12'], rests: ['Needs rest', '#9a6a12'], maimed: ['Maimed', '#8b0000'], dead: ['Dead', '#4a0000']};

  function personOf(c){
    try {
      if (c.leader && typeof META !== 'undefined' && META && META.leader && (c.id === 'leader' || META.leader.id === c.id)) return META.leader;
      if (typeof G !== 'undefined' && G && G.squad){ const m = G.squad.find(x => x.p && x.p.id === c.id); if (m) return m.p; }
      if (typeof META !== 'undefined' && META){ const r = (META.roster || []).find(p => p.id === c.id); if (r) return r; }
    } catch (x) {}
    return {id: c.id, name: c.name, race: c.race, spec: c.spec};
  }
  function momentFor(c, p, salt){   // no moment line twice in one report: re-pick with a new salt (same rule as the Barracks)
    const U1 = U._used; let m = momentOne(c, p, salt);
    for (let k = 1; U1 && m && U1.has(m) && k <= 12; k++) m = momentOne(c, p, salt + k * 7);
    if (U1 && m) U1.add(m); return m; }
  function momentOne(c, p, salt){
    try { if (typeof STORY !== 'undefined' && STORY && typeof STORY.momentLine === 'function') return String(STORY.momentLine(p, {moment: c.moment, foe: c.foe, kills: c.kills, salt: salt}) || ''); } catch (x) {}
    return c.moment === 'fell' ? 'Did not come home' : c.moment === 'got_up' ? 'Went down, and got up again' : '';
  }
  function gainsOf(c){
    const g = c.gains || {}, out = [];
    if (g.level > 0) out.push('Level ' + (g.level > 1 ? '+' + g.level : 'gained'));
    else if (g.ticks > 0) out.push('XP tick' + (g.ticks > 1 ? ' x' + g.ticks : ''));
    if (g.adv > 0) out.push('Advancement' + (g.adv > 1 ? ' x' + g.adv : ''));
    if (g.luckBurned > 0) out.push('Luck burned' + (g.luckBurned > 1 ? ' x' + g.luckBurned : ''));
    return out;
  }
  U.cardHTML = function(c, i){
    const p = personOf(c), o = OUT[c.outcome] || OUT.unhurt, gains = gainsOf(c), m = momentFor(c, p, i);
    let portrait = ''; try { portrait = typeof portraitURL === 'function' ? '<img class="ic sm" src="' + portraitURL(p, true) + '">' : ''; } catch (x) {}
    const outTxt = c.outcome === 'maimed' && c.injury ? 'Maimed: ' + e(c.injury.name) + (c.injury.eff ? ' (' + e(c.injury.eff) + ')' : '') : o[0];
    return '<div class="d31-card' + (c.outcome === 'dead' ? ' dead' : '') + '">' + portrait + '<div class="d31-b"><div class="d31-nm"><b>' + e(c.name) + '</b>' + (c.leader ? ' <small>Squad Leader</small>' : '') + '</div>' +
      '<div class="d31-out" style="color:' + o[1] + '">' + outTxt + '</div>' +
      '<div class="d31-k">' + c.kills + (c.kills === 1 ? ' kill' : ' kills') + (gains.length ? ' · ' + gains.join(' · ') : '') + '</div>' +
      (m ? '<div class="d31-m">' + e(m) + '</div>' : '') + '</div></div>';
  };
  U.headHTML = function(h){
    const pay = h.pay || 0, sp = h.spoils || []; let sub;
    /* K95(b): on a lost contract the money is coin carried home less upkeep, not pay */
    const lost = h.result === 'fallen' || !!(h.chronicle && h.chronicle.outcome === 'loss');
    return '<div class="d31-head"><span><b>' + (lost ? 'Coin carried' : h.contractPay === 0 ? 'Coin' : 'Pay') + '</b> ' + (pay >= 0 ? '+' : '') + pay + 'gp</span><span><b>Treasury</b> ' + (h.treasury == null ? '' : h.treasury + 'gp') + '</span><span><b>Spoils</b> ' +
      (sp.length ? sp.map(x => e(x.name) + (x.value > 0 && x.kind !== 'gear' ? ' (' + x.value + 'gp)' : '')).join(', ') : 'nothing recovered') + '</span>' +
      ((sub = [h.tithe ? 'Masters’ tithe −' + h.tithe + 'gp' : '', h.tithe2j ? 'Temple tithe −' + h.tithe2j + 'gp' : '', h.ransom2j ? 'Ransom −' + h.ransom2j + 'gp' : '', h.salvage ? 'salvage +' + h.salvage + 'gp' : ''].filter(Boolean)).length ? '<span class="d31-sub">' + sub.join(' · ') + '</span>' : '') + '</div>';   /* 2j: the class catches are named here, and are not in the Pay / Coin carried figure (debrief.js) */
  };
  U.scribe = function(h){
    try { if (typeof STORY !== 'undefined' && STORY && typeof STORY.chronicleLine === 'function') return String(STORY.chronicleLine(h.chronicle || {outcome: h.result, title: h.title, place: h.place, host: hostName(h.host), dead: deadCount()}) || ''); } catch (x) {}
    return '';
  };
  function hostName(k){ try { return HOSTS[k] ? HOSTS[k].name.replace(/^The /, 'the ') : ''; } catch (x) { return ''; } }
  let lastCards = null;
  function deadCount(){ const d = lastCards || (window.DEBRIEF31 && DEBRIEF31.cards()); return d ? d.cards.filter(c => c.outcome === 'dead' && !c.leader).length : 0; }
  U.html = function(d){
    lastCards = d;
    const sc = U.scribe(d.header);
    return U.headHTML(d.header) + '<div class="d31-cards">' + (U._used = new Set(), d.cards.map((c, i) => U.cardHTML(c, i)).join('')) + '</div>' + (sc ? '<div class="d31-scribe"><b>The Scribe writes:</b> ' + e(sc) + '</div>' : '');
  };

  function css(){
    if ($i('d31-style')) return;
    const st = document.createElement('style'); st.id = 'd31-style';
    st.textContent = '.d31-head .d31-sub{font-size:14px;flex-basis:100%;opacity:.8;align-self:center}.d31-head{display:flex;gap:8px 26px;flex-wrap:wrap;margin:6px 0 10px;padding:8px 12px;background:#efe3c8;border:2px solid #8a6d3a;border-radius:6px;font:15px Georgia;color:#2a2218}.d31-head b{color:var(--blood);margin-right:4px}#debrief-inner .btn.gold{scroll-margin-bottom:clamp(32px,2.5vw,48px)}' +
      '.d31-cards{width:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:0 0 10px}' +
      '.d31-card{display:flex;gap:10px;align-items:flex-start;text-align:left;background:#f6edd6;border:1px solid #b9a06a;border-radius:6px;padding:8px;color:#2a2218;font:14px Georgia}.d31-card.dead{background:#e3d2c4;opacity:.92}.d31-card .ic{width:48px;height:48px;flex:none}' +
      '.d31-b{min-width:0}.d31-nm small{opacity:.7;font-size:14px}.d31-out{font-weight:bold}.d31-k{font-size:14px;opacity:.85}.d31-m{font-style:italic;margin-top:2px}' +
      '.d31-scribe{box-sizing:border-box;width:100%;font:italic 14px Georgia;background:#efe3c8;border-left:4px solid #8a6d3a;padding:6px 10px;margin:0 0 10px;text-align:left;color:#2a2218}.d31-scribe b{font-style:normal;color:var(--blood)}';
    document.head.appendChild(st);
  }

  function install(){
    if (window.__d31ui || typeof renderDebrief !== 'function') return;
    css();
    const rd = renderDebrief;
    renderDebrief = function(head, lines){
      const r = rd.apply(this, arguments);
      try {
        const D = window.DEBRIEF31, d = D && D.cards();
        if (d && d.ok && U.fresh && U.fresh === d.at){
          const root = $i('debrief-inner'), log = root && root.querySelector('.log');
          if (log && !root.querySelector('.d31-head')) log.insertAdjacentHTML('beforebegin', U.html(d));
        }
      } catch (x) { console.error('DEBRIEF31UI', x); }
      return r;
    };
    renderDebrief.last = rd.last;
    const sd = startDeployment;
    startDeployment = function(){ U.fresh = null; return sd.apply(this, arguments); };
    const ed = endDeployment;
    endDeployment = function(){
      const before = window.DEBRIEF31 && DEBRIEF31.last && DEBRIEF31.last.at;
      let r;
      try { r = ed.apply(this, arguments); } catch (x) { throw x; }
      try {
        const D = window.DEBRIEF31, d = D && D.cards();
        if (d && d.ok && d.at !== before){ U.fresh = d.at; lastCards = d; U.writeChron(d);
          /* the report was drawn inside ed(), before DEBRIEF31 built its cards: draw it once more with them */
          const last = renderDebrief.last, scr = $i('screen-debrief');
          if (last && scr && !scr.classList.contains('hidden')) renderDebrief(last.head, last.lines); }
      } catch (x) { console.warn('DEBRIEF31UI end', x); }
      return r;
    };
    /* the Scribe's line rides on the contract's Chronicle entry */
    const ct = chronText;
    chronText = function(en){
      const h = ct.apply(this, arguments);
      return (en && en.k === 'contract' && en.scribe) ? h + ' <i>' + e(en.scribe) + '</i>' : h;
    };
    window.__d31ui = true;
  }
  U.writeChron = function(d){
    try {
      const C = typeof META !== 'undefined' && META && META.chron;
      if (!C || !C.log) return false;
      for (let i = C.log.length - 1; i >= 0; i--){ const en = C.log[i]; if (en.k === 'contract'){ if (!en.scribe){ en.scribe = U.scribe(d.header); try { saveMeta(); } catch (x) {} } return true; } }
    } catch (x) {}
    return false;
  };

  U.selfTest = function(){
    const fails = [], ck = (ok, m) => { if (!ok) fails.push(m); };
    try {
      const mk = (id, name, leader, outcome, extra) => Object.assign({id, name, race: 'HUMAN', spec: 'SOLDIER', leader, kills: 2, down: false, outcome, injury: null, gains: {adv: 0, level: 0, ticks: 0, luckBurned: 0}, moment: 'steady', moments: ['steady'], foe: null}, extra || {});
      const d = {ok: true, at: 1, header: {result: 'victory', title: 'Test job', place: 'Hask', host: 'bandits', pay: 360, treasury: 460, spoils: []},
        cards: [mk('leader', 'Lead', true, 'unhurt', {gains: {adv: 0, level: 1, ticks: 1, luckBurned: 1}}), mk(2, 'Bee', false, 'maimed', {injury: {id: 'lame', name: 'Lame', eff: 'Move -1'}, down: true, moment: 'got_up'}), mk(3, 'Cee', false, 'dead', {moment: 'fell', kills: 0}), mk(4, 'Dee', false, 'recovered'), mk(5, 'Eff', false, 'rests', {gains: {adv: 1, level: 0, ticks: 0, luckBurned: 0}})]};
      const h = U.html(d);
      ck((h.match(/class="d31-card[ "]/g) || []).length === 5, 'one card per entry');
      ck(/Pay<\/b> \+360gp/.test(h) && /Treasury<\/b> 460gp/.test(h) && /Spoils<\/b> nothing recovered/.test(h), 'header pay, Treasury, spoils');
      ck(/Maimed: Lame \(Move -1\)/.test(h) && />Dead</.test(h) && /Went down, got up/.test(h) && />Needs rest</.test(h) && />Unhurt</.test(h), 'outcome words');
      ck(/Luck burned/.test(h) && /Level gained/.test(h) && /Advancement/.test(h), 'gains shown');
      ck(h.indexOf('<b>Lead</b>') >= 0 && h.indexOf('<b>Lead</b>') < h.indexOf('<b>Bee</b>'), 'Leader first');
      ck(typeof STORY === 'undefined' || typeof STORY.momentLine !== 'function' || /d31-m/.test(h), 'moment lines present');
      ck(typeof renderDebrief === 'function' && !!window.__d31ui, 'not installed');
      d.header.spoils = [{name: 'Iron helm'}]; ck(/Iron helm/.test(U.headHTML(d.header)), 'spoils listed');
      { const lh = U.headHTML(Object.assign({}, d.header, {result: 'fallen', pay: 609})), fh = U.headHTML(Object.assign({}, d.header, {result: 'fled', chronicle: {outcome: 'loss'}}));
        ck(/Coin carried<\/b> \+609gp/.test(lh) && !/<b>Pay<\/b>/.test(lh) && /Coin carried/.test(fh), 'K95: a lost contract says Coin carried, not Pay'); }
      { const zh = U.headHTML(Object.assign({}, d.header, {contractPay: 0, pay: 48})); ck(/<b>Coin<\/b> \+48gp/.test(zh) && !/<b>Pay<\/b>/.test(zh), 'K102c: a 0gp contract says Coin, not Pay'); }
    } catch (x) { fails.push('threw: ' + x.message); }
    return {ok: !fails.length, fails};
  };
  window.addEventListener('load', () => setTimeout(install, 0));
})();
