/* ============================================================================
   INDEX TEXT48 - F-48 text slips (UX review T2, audits/f48-ux-review.md)
   Wrappers only; the plain wording fixes sit where the words are (index.html,
   js/campaign/story.js, js/camp/camp-build.js, js/ui/briefing-council.js).
   - A Hostage Rescue names one place. makeContract gave it a place and a town
     ("at Saint Ivo Reliquary" and "Mendor Citadel is in ruins"); the town is
     where the cages are, so the place becomes the town.
   - The Founding holding and Ambition screens said the same thing two or three
     times (the guide's line, the screen's own line, the line under the cards).
     Each thing is now said once.
   - The War Council's outcome line on the briefing hides while the dice tray
     is up (the tray gives the result and may still offer the Luck re-roll).
   INT-1 group 10: no switch (TEXT48.on/set baked in; the body class stays for the CSS).
============================================================================ */
(function(){
  'use strict';
  const T = window.TEXT48 = {};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };

  T.onePlace = function(c){
    if (c && c.obj === 'rescue' && c.town && c.place !== c.town) c.place = c.town;
    return c;
  };
  try {
    const f = gl('makeContract');
    if (typeof f === 'function'){
      T._mk = function(){ return T.onePlace(f.apply(this, arguments)); };
      (0, eval)('makeContract = window.TEXT48._mk');
    }
  } catch (e) { console.warn('TEXT48 makeContract: ', e); }

  const HOLD = /^Where does the Chapter hang its banner\?/, AMB = /^What is this Chapter for\?/, PICK = /^Pick one\. Every contract, perk and milestone/;
  T.tidyFound = function(h, FD){
    if (!h || !FD) return;
    const said = !!h.querySelector('.bard-says, .bardsays, .guide-says') || !!(FD.guided || FD.fromCollapse || FD.fromStory);
    for (const s of h.querySelectorAll('.sub')){
      const t = (s.textContent || '').trim();
      if (FD.step === 'holding' && said && HOLD.test(t)) s.remove();
      else if (FD.step === 'charter' && said && AMB.test(t)) s.textContent = 'Ten milestones, a perk at 3, 6 and 9, and a final contract that fulfils the charter.';
      else if (FD.step === 'charter' && PICK.test(t)) s.remove();
    }
  };
  try {
    const f = gl('renderFound');
    if (typeof f === 'function'){
      T._rf = function(){ const r = f.apply(this, arguments); try { T.tidyFound(document.getElementById('create-inner'), gl('FD')); } catch (e) { console.warn('TEXT48 found: ', e); } return r; };
      (0, eval)('renderFound = window.TEXT48._rf');
    }
  } catch (e) { console.warn('TEXT48 renderFound: ', e); }

  /* T5 (UX review, second pass): with Detailed Salvage the ledger line still said "Quick Salvage: 28gp" (and counted it
     in the total) while the header said Detailed Salvage (10gp). The ledger line now names the salvage that was paid. */
  T.salvageLines = function(lines){
    if (!Array.isArray(lines)) return false;
    const S = lines.map(x => String(x));
    const iN = S.findIndex(x => /Detailed Salvage replaces the \d+gp Quick Salvage shown above/.test(x));
    const iL = S.findIndex(x => /Quick Salvage: \d+gp/.test(x) && /<b>Treasury [+-]?\d+gp<\/b>/.test(x));
    const iD = S.findIndex(x => /<b>Detailed Salvage:<\/b>/.test(x));
    if (iN < 0 || iL < 0 || iD < 0) return false;
    const g = /<b>\+(\d+)gp<\/b>/.exec(S[iD]), q = /Quick Salvage: (\d+)gp/.exec(S[iL]), t = /<b>Treasury ([+-]?\d+)gp<\/b>/.exec(S[iL]);
    if (!g || !q || !t) return false;
    const tot = Number(t[1]) - Number(q[1]) + Number(g[1]);
    lines[iL] = S[iL].replace(t[0], '<b>Treasury ' + (tot >= 0 ? '+' : '') + tot + 'gp</b>').replace(q[0], 'Detailed Salvage: ' + g[1] + 'gp');
    lines.splice(iN, 1);
    return true;
  };
  try {
    const f = gl('renderDebrief');
    if (typeof f === 'function'){
      T._rd = function(head, lines){ try { T.salvageLines(lines); } catch (e) { console.warn('TEXT48 salvage: ', e); } return f.apply(this, arguments); };
      (0, eval)('renderDebrief = window.TEXT48._rd');
    }
  } catch (e) { console.warn('TEXT48 renderDebrief: ', e); }

  document.head.appendChild(Object.assign(document.createElement('style'), {id: 'text48-css', textContent:
    'body.text48:has(#dice-tray.show) .wc-out{visibility:hidden}'}));
  { const cls = () => document.body.classList.add('text48'); if (document.body) cls(); else document.addEventListener('DOMContentLoaded', cls); }

  T.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    try {
      { const L = ['<p><b>Detailed Salvage:</b> 2 enemy squads picked over at Tier 1. <b>+10gp</b>.</p>',
                   '<p><b>Treasury +128gp</b>: Contract: 100gp · Quick Salvage: 28gp. Now 300gp.</p>', '<p>Other.</p>',
                   '<p style="font-size:12.5px">Detailed Salvage replaces the 28gp Quick Salvage shown above.</p>'];
        const did = T.salvageLines(L);
        ok('T5: the ledger names Detailed Salvage and its gold', did && /Treasury \+110gp/.test(L[1]) && /Detailed Salvage: 10gp/.test(L[1]) && !/Quick Salvage/.test(L.join('')), L[1]);
        ok('T5: the "replaces" note is gone and other lines stay', L.length === 3 && L[2] === '<p>Other.</p>');
        ok('T5: a second pass changes nothing', !T.salvageLines(L) && L.length === 3);
        const Q = ['<p><b>Treasury +128gp</b>: Contract: 100gp · Quick Salvage: 28gp. Now 300gp.</p>'];
        ok('T5: Quick Salvage reports are left alone', !T.salvageLines(Q) && /Quick Salvage: 28gp/.test(Q[0])); }
      ok('rescue names one place', T.onePlace({obj: 'rescue', place: 'A', town: 'B'}).place === 'B');
      ok('other jobs keep their place', T.onePlace({obj: 'hunt', place: 'A', town: 'B'}).place === 'A');
      const mk = (step, html) => { const d = document.createElement('div'); d.innerHTML = html; T.tidyFound(d, {step, guided: true}); return d; };
      const a = mk('holding', '<div class="sub">Guide line</div><div class="sub">Where does the Chapter hang its banner? Every holding.</div>');
      ok('holding: the screen line goes, the guide line stays', a.querySelectorAll('.sub').length === 1 && /Guide/.test(a.textContent));
      const b = mk('charter', '<div class="sub">What is this Chapter for? Choose now.</div><div><div class="sub">Pick one. Every contract, perk and milestone from here on points at it.</div></div>');
      ok('Ambition: one line left, about the milestones', b.querySelectorAll('.sub').length === 1 && /^Ten milestones/.test(b.textContent));
      const fp = gl('forPatron');
      if (fp) ok('for an Arcana Guild Magister', fp('Arcana Guild Magister') === 'for an Arcana Guild Magister' && fp('Minor Imperial Noble') === 'for a Minor Imperial Noble', fp('Arcana Guild Magister'));
    } catch (e) { ok('no throw', false, e.message); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
