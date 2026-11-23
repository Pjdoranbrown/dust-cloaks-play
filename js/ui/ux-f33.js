/* F-33 UX pass (Art & Interface Lead). Loads last. INT-1 group 13: no switch.
   Styles the loadout box ([data-book33]) from here so js/camp/books.js and js/combat/abilities-f33.js stay the Lead Programmer's:
   - a card per character, name and class separated, a rule between cards
   - native selects get the game's parchment look; library lines read as asides
   - rank pips and Copy buttons keep a clear target size */
(function(){
  'use strict';
  const U = window.UX33 = {};
  const st = document.createElement('style'); st.id = 'ux33-css';
  st.textContent =
    '[data-book33]{border-top:2px solid #8a7550;padding-top:8px!important;font-size:14px;line-height:1.4}' +
    '[data-book33]>b:first-child{font-size:15px;letter-spacing:.02em}' +
    '[data-book33] .line{display:flex;margin:0!important;padding:7px 0 2px;border-top:1px solid rgba(58,44,26,.25)}' +
    '[data-book33] .line:first-of-type{margin-top:6px!important}' +
    '[data-book33] .line>b:first-child{font-size:14px;margin-right:2px}' +
    '[data-book33] .line>b:first-child+span{font-style:italic;margin-right:4px}' +
    '[data-book33] .line[style*="margin-left"]{border-top:0;padding:0 0 6px;font-style:italic;color:#5a4a30}' +
    '[data-book33] select{font:inherit!important;font-size:14px!important;background:#ece0c4!important;color:#2a1a0a!important;border:2px solid #3a2c1a!important;border-radius:2px;padding:3px 6px!important;min-height:28px;max-width:100%}' +
    '[data-book33] select:focus{outline:2px solid #b08a3a;outline-offset:1px}' +
    'span[title^="Rank "]{color:#7a5410!important;font-size:14px;letter-spacing:2px!important}' +
    '[data-book33] button{min-height:28px;min-width:44px;padding:2px 10px}';
  document.head.appendChild(st);
  U.css = st;
  U.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c});
    const d = document.createElement('div'); d.innerHTML = '<div data-book33="1"><div class="line"><b>A</b><span>B</span><select><option>x</option></select></div></div>'; document.body.appendChild(d);
    const sel = d.querySelector('select'), line = d.querySelector('.line');
    ok('select takes the parchment look', getComputedStyle(sel).backgroundColor === 'rgb(236, 224, 196)');
    ok('select is a real target (28px)', sel.getBoundingClientRect().height >= 28);
    ok('line is a flex row with a rule', getComputedStyle(line).display === 'flex' && parseFloat(getComputedStyle(line).borderTopWidth) >= 1);
    d.remove();
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {pass: out.length - fails.length, fail: fails.length, ok: !fails.length, fails, details: out};
  };
})();
