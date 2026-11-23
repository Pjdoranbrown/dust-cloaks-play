/* ============================================================================
   INDEX LEDGER: U-slice 4 (22 Nov 2026), the Field Report as a ledger.
   A label column on the left, the content on the right, in the spec's order:
   summary under the h1, Coin (the pay strip only), Squad (the cards), Advancements (with the picker under it),
   Standing, Report, one flavour line, Tips (one), then the buttons.
   One DOM pass over #debrief-inner after the whole renderDebrief chain has drawn it (this file loads last of them),
   so no wrapper upstream changes. A line it does not know goes to Report. A row with nothing to say is left out.
   Self-test: LEDGER.selfTest() -> {ok, fails}.
============================================================================ */
(function(){
  'use strict';
  const L = window.LEDGER = {on: true, LABELS: {coin: 'Coin', squad: 'Squad', adv: 'Advancements', standing: 'Standing', report: 'Report', tip: 'Tips'}};
  const $i = id => document.getElementById(id);
  const v = (a, b) => 'clamp(' + a + 'px, calc(' + a + 'px + ' + (b - a) + ' * (100vw - 1280px) / 640), ' + b + 'px)';
  const RE = {
    sum: /enem(y|ies) slain|were opened|hostages? freed|slain,|commanders?\./i,
    treasury: /^\s*Coin home\b|^\s*Treasury\s*[+\-−]|^\s*The Masters.? Tithe|^\s*Detailed Salvage|^\s*Hazard Upkeep/i,
    xp: /earns an XP tick|reaches Level|gains a Level|hits Level/i,
    adv: /learns from the contract|Squad Mates may (now )?hold/i,
    standing: /^\s*Standing with|Allied:/i,
    tip: /Unspent Advancements wait/i
  };
  const txt = el => (el.textContent || '').trim();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  function css(){
    if ($i('u4-style')) return;
    const st = document.createElement('style'); st.id = 'u4-style';
    st.textContent =
      '#debrief-inner .u4-sum{font:' + v(15, 17) + ' Georgia;color:#2a1a0a;margin:0 0 ' + v(10, 14) + ';text-align:center}' +
      '#debrief-inner .u4-r{display:grid;grid-template-columns:' + v(120, 148) + ' 1fr;column-gap:' + v(16, 24) + ';text-align:left;border-top:1px solid #c9b48a;padding:' + v(10, 14) + ' 0 0;margin:' + v(10, 14) + ' 0 0}' +
      '#debrief-inner .u4-r:first-child{margin-top:0}' +
      '#debrief-inner .u4-l{font:small-caps 700 ' + v(14, 15) + ' Georgia;color:#5c3d18;letter-spacing:.04em;padding-top:2px}' +
      '#debrief-inner .u4-c{min-width:0;font:' + v(15, 17) + ' Georgia;color:#2a1a0a}' +
      '#debrief-inner .u4-c p{margin:0 0 6px;font:inherit;color:inherit}#debrief-inner .u4-c p:last-child{margin-bottom:0}' +
      '#debrief-inner .u4-c .d31-head,#debrief-inner .u4-c .d31-cards,#debrief-inner .u4-c .advbox{margin:0}' +
      '#debrief-inner .u4-c .d31-head{padding:6px 10px;font-size:inherit}' +
      '#debrief-inner .u4-c .d31-head .d31-sub{font-size:inherit;opacity:1;color:inherit}' +   /* UX 9d2ac183 TS-2: the money that leaves the Treasury reads as plainly as Pay */
      '#debrief-inner .u4-c .d31-sub .u4-sep{margin:0 8px}' +   /* UX 5ca125a0: the separator stands clear of the pad 2 lesson rings (4 px or more) */
      '#debrief-inner .u4-c .sub,#debrief-inner .u4-c .desc{font-size:inherit;color:inherit;text-align:left}' +
      '#debrief-inner .u4-c h2.sec{font-size:inherit;margin:8px 0 4px;text-align:left}' +
      '#debrief-inner .u4-c .d31-k,#debrief-inner .u4-c .d31-nm small,#debrief-inner .u4-c .tag,#debrief-inner .u4-c .d31-card{font-size:' + v(14, 15) + '}' +
      '#debrief-inner .u4-c .advbox *:not(h3){font-size:' + v(14, 15) + '!important}' +
      '#debrief-inner .u4-r.u4-fl .u4-c{grid-column:1 / -1;text-align:center}' +
      '#debrief-inner .u4-led{width:100%;align-self:stretch;box-sizing:border-box}#debrief-inner .u4-c .row{justify-content:flex-start}#debrief-inner .u4-plus{color:#1d521d}#debrief-inner p.u4-loss{color:#8b0000}';
    document.head.appendChild(st);
  }
  const plusify = html => html.replace(/(^|[\s(>])(\+\d+)(?![\w])/g, '$1<span class="u4-plus">$2</span>');
  function row(sec, nodes, cls){
    const r = document.createElement('div'); r.className = 'u4-r' + (cls ? ' ' + cls : ''); r.setAttribute('data-sec', sec);
    const c = document.createElement('div'); c.className = 'u4-c';
    nodes.forEach(n => { if (n.tagName === 'P') n.classList.remove('good'); c.appendChild(n); });   // moved in place (act5 lesson pointers, data attrs); green comes from .u4-plus only
    if (L.LABELS[sec]){ const l = document.createElement('div'); l.className = 'u4-l'; l.textContent = L.LABELS[sec]; r.appendChild(l); }
    r.appendChild(c); return r;
  }
  const mkp = (html, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; return p; };

  L.s57 = () => !!(typeof G !== 'undefined' && G && G.d45k);   // the first own contract's debrief (act5.js sets G.d45k): its tithe and upkeep lesson cards need a figure, even a 0
  L.build = function(root){
    if (!root || !L.on || root.querySelector('.u4-r')) return false;
    const log = root.querySelector('.log'), h1 = root.querySelector('h1'); if (!log || !h1) return false;
    const kids = [...root.children], iLog = kids.indexOf(log), last = kids[kids.length - 1];
    const head = root.querySelector('.d31-head'), cards = root.querySelector('.d31-cards'), scribe = root.querySelector('.d31-scribe');
    const hasHead = !!(head && head.style.display !== 'none' && head.children.length);
    const S = {sum: [], coin: [], adv: [], standing: [], report: [], flavour: null, tip: []}, coinNotes = [];
    const isFl = p => p.classList.contains('sx') || (p.children.length === 1 && p.firstElementChild.tagName === 'I' && txt(p.firstElementChild) === txt(p));
    const flAll = [...log.children].filter(p => txt(p) && isFl(p)), flLast = flAll[flAll.length - 1];   // the last italic line is the flavour; earlier ones are outcome lines and go to Report
    for (const p of [...log.children]){
      const t = txt(p);
      if (!t) continue;
      if (p === flLast){ S.flavour = p; continue; }
      if (isFl(p)){ S.report.push(p); continue; }
      if (RE.treasury.test(t)){ coinNotes.push(t); S.coin.push(p); continue; }
      if (cards && RE.xp.test(t)) continue;
      if (!S.sum.length && RE.sum.test(t)){ S.sum.push(p); continue; }
      if (RE.adv.test(t)){ S.adv.push(p); continue; }
      if (RE.standing.test(t)){ S.standing.push(p); continue; }
      if (RE.tip.test(t)){ S.tip.push(p); continue; }
      S.report.push(p);
    }
    if (!S.flavour && scribe) S.flavour = scribe;
    // the extras after the log: the Talent picker and the Advancement block sit under the Advancements text
    const pick = [], other = [];
    for (let i = iLog + 1; i < kids.length - 1; i++){
      const n = kids[i];
      if (n.matches('.advbox') || (n.matches('h2.sec') && /Talent|Advancement/i.test(txt(n)))){
        pick.push(n); let j = i + 1;
        while (j < kids.length - 1 && !kids[j].matches('h2.sec, .advbox') && !(kids[j].matches('.sub') && RE.tip.test(txt(kids[j])))){ pick.push(kids[j]); j++; }
        i = j - 1;
      } else if (n.matches('.sub') && RE.tip.test(txt(n))) S.tip.push(n);
      else other.push(n);
    }
    const led = document.createElement('div'); led.className = 'u4-led';
    if (S.sum.length){ const s = document.createElement('div'); s.className = 'u4-sum'; s.innerHTML = S.sum.map(p => p.innerHTML).join(' '); h1.insertAdjacentElement('afterend', s); }
    if (hasHead){
      /* UX 6313b396: the tithe and the upkeep stay on the strip, each figure in its own span (the S57 lesson cards ring them); the pay breakdown stays on the hover */
      /* UX 9d2ac183 TS-1: a 0 figure shows only on the S57 debrief, where its lesson card points at it; no figure left, no line. TS-2: salvage is pay, so it goes to the hover */
      let sub = head.querySelector('.d31-sub'); const subT = sub ? txt(sub) : '', um = coinNotes.join(' ').match(/Hazard Upkeep[^0-9]{0,6}(\d+)/i), s57 = L.s57();
      const all = subT ? subT.split(/\s*·\s*/).filter(Boolean) : [], figs = all.filter(f => !/^salvage/i.test(f));
      coinNotes.push(...all.filter(f => /^salvage/i.test(f)));
      if (s57 && !figs.some(f => /tithe/i.test(f))) figs.unshift('Masters’ tithe 0gp');
      if (um && +um[1]) figs.push('Hazard Upkeep −' + um[1] + 'gp'); else if (s57) figs.push('Hazard Upkeep 0gp');
      if (!figs.length){ if (sub) sub.remove(); sub = null; }
      else if (!sub){ sub = document.createElement('span'); sub.className = 'd31-sub'; head.appendChild(sub); }
      if (sub){ sub.textContent = ''; figs.forEach((f, i) => { if (i){ const sep = document.createElement('span'); sep.className = 'u4-sep'; sep.textContent = '·'; sub.appendChild(sep); } const sp = document.createElement('span'); sp.className = 'u4-fig'; sp.textContent = f; if (/tithe/i.test(f)) sp.setAttribute('data-fig', 'tithe'); else if (/upkeep/i.test(f)) sp.setAttribute('data-fig', 'upkeep'); sub.appendChild(sp); }); }
      const first = head.firstElementChild; if (first && coinNotes.length) first.title = coinNotes.join('\n');
      led.appendChild(row('coin', [head]));
    } else {
      if (head) head.remove();
      if (S.coin.length) led.appendChild(row('coin', S.coin));
    }
    if (cards) led.appendChild(row('squad', [cards]));
    if (S.adv.length || pick.length) led.appendChild(row('adv', S.adv.concat(pick)));
    if (S.standing.length) led.appendChild(row('standing', S.standing.map(p => { p.innerHTML = plusify(p.innerHTML); if (p.classList.contains('bad')) p.classList.add('u4-loss'); return p; })));
    if (S.report.length) led.appendChild(row('report', S.report.map(p => { if (p.classList.contains('bad')) p.classList.add('u4-loss'); return p; })));
    if (S.flavour){
      const t = txt(S.flavour).replace(/^The Scribe writes:\s*/, '');
      if (t){ const f = mkp(esc(t)); led.appendChild(row('flavour', [f], 'u4-fl')); }
    }
    if (S.tip.length) led.appendChild(row('tip', [mkp(esc(txt(S.tip[0])))]));
    S.tip.forEach(n => { if (n.parentNode === root) n.remove(); });
    log.remove(); if (scribe) scribe.remove();
    root.insertBefore(led, other[0] || last);
    return true;
  };

  function install(){
    if (window.__u4led || typeof renderDebrief !== 'function') return;
    css();
    const rd = renderDebrief;
    renderDebrief = function(){
      const r = rd.apply(this, arguments);
      try { L.build($i('debrief-inner')); } catch (x) { console.error('LEDGER', x); }
      return r;
    };
    renderDebrief.last = rd.last;
    window.__u4led = true;
  }
  L.selfTest = function(){
    const fails = [], ck = (ok, m) => { if (!ok) fails.push(m); };
    try {
      const root = document.createElement('div');
      root.innerHTML = '<div class="tag">Field Report</div><h1>DONE</h1>' +
        '<div class="d31-head"><span><b>Pay</b> +222gp</span><span class="d31-sub">Masters tithe -28gp</span></div><div class="d31-cards"><div class="d31-card">A</div></div>' +
        '<div class="d31-scribe"><b>The Scribe writes:</b> Scribe line.</div>' +
        '<div class="log"><p><b>Treasury +222gp</b>: Contract 280gp.</p><p><b>0</b> of 2 cages were opened, in 0m 0s. 3 enemies slain, 0 commanders.</p>' +
        '<p class="good">Twain and Elrion have become Comrades.</p><p class="good">The company learns from the contract: <b>give 1 Advancement</b>.</p>' +
        '<p>Smoke earns an XP tick (1 / 3).</p><p class="good">Standing with the Mendorian Order: 0 to +1.</p><p class="sx"><i>Flavour line.</i></p><p class="bad">Twain slips.</p></div>' +
        '<h2 class="sec">Pick 1 Soldier Talent</h2><div class="sub">Pick one.</div><div class="row"><button>T</button></div>' +
        '<div class="sub">Unspent Advancements wait for you in the Barracks.</div><div><button>RETURN TO CAMP</button></div>';
      L.build(root);
      const secs = [...root.querySelectorAll('.u4-r')].map(r => r.getAttribute('data-sec'));
      ck(secs.join() === 'coin,squad,adv,standing,report,flavour,tip', 'row order: ' + secs.join());
      ck(root.querySelectorAll('.u4-r[data-sec="coin"] p').length === 0 && /gp/.test(root.querySelector('[data-sec="coin"]').textContent) && !/gp/.test(root.querySelector('[data-sec="report"]').textContent), 'coin only in the Coin row');
      ck(root.querySelector('[data-sec="coin"] .d31-head > span').title.indexOf('Treasury +222gp') >= 0, 'breakdown on the Pay hover');
      ck(root.querySelectorAll('.u4-fl').length === 1 && /Flavour line/.test(root.querySelector('.u4-fl').textContent) && !/Scribe line/.test(root.textContent), 'one flavour line, the last pushed');
      const adv = root.querySelector('[data-sec="adv"] .u4-c'); ck(adv && adv.children[0].tagName === 'P' && adv.children[1].tagName === 'H2' && adv.querySelector('button'), 'picker directly under the Advancements text');
      ck(!/XP tick/.test(root.querySelector('[data-sec="report"]').textContent) && /Comrades/.test(root.querySelector('[data-sec="report"]').textContent), 'XP line left to the cards, Comrades kept in Report');
      ck(root.querySelector('[data-sec="standing"] .u4-plus') && root.querySelector('[data-sec="report"] .u4-loss') && !root.querySelector('.good'), 'green only on a + figure, red only on a loss');
      ck(root.children[root.children.length - 1].querySelector('button').textContent === 'RETURN TO CAMP', 'button row last');
      ck(!!root.querySelector('.u4-sum') && /enemies slain/.test(root.querySelector('.u4-sum').textContent), 'summary under the h1');
      ck(L.build(root) === false, 'a second pass changes nothing');
      /* UX 9d2ac183 TS-1, TS-2: the second line keeps only money that leaves the Treasury; 0 figures only on the S57 debrief */
      const s57 = L.s57, mk = sub => { const r = document.createElement('div'); r.innerHTML = '<h1>DONE</h1><div class="d31-head"><span><b>Pay</b> +222gp</span>' + sub + '</div><div class="log"><p><b>Treasury +222gp</b>: Contract 280gp.</p></div><div><button>RETURN TO CAMP</button></div>'; L.build(r); return r.querySelector('[data-sec="coin"]'); };
      try {
        L.s57 = () => false;
        let c = mk('<span class="d31-sub">Masters’ tithe −28gp · salvage +20gp</span>'), sub = c.querySelector('.d31-sub');
        ck(sub && sub.textContent === 'Masters’ tithe −28gp' && c.querySelector('.d31-head > span').title.indexOf('salvage +20gp') >= 0, 'TS-2: salvage leaves the line for the Pay hover: ' + (sub && sub.textContent));
        c = mk('<span class="d31-sub">salvage +20gp</span>'); ck(!c.querySelector('.d31-sub') && !/0gp/.test(c.textContent), 'TS-1: no tithe, no upkeep: no second line, no 0gp');
        L.s57 = () => true; c = mk('');
        ck(c.querySelector('[data-fig="tithe"]') && c.querySelector('[data-fig="upkeep"]') && /Hazard Upkeep 0gp/.test(c.textContent), 'TS-1: the S57 debrief shows 0 figures for the lesson cards');
        const sp = c.querySelector('.u4-sep'); ck(sp && sp.textContent === '·' && sp.previousElementSibling && sp.previousElementSibling.dataset.fig === 'tithe' && sp.nextElementSibling && sp.nextElementSibling.dataset.fig === 'upkeep' && /0gp·Hazard/.test(c.querySelector('.d31-sub').textContent),'UX 5ca125a0: the separator is its own span between the figures, no spaces round it');
      } finally { L.s57 = s57; }
    } catch (x) { fails.push('threw: ' + x.message); }
    return {ok: !fails.length, fails};
  };
  L.install = install;
  window.addEventListener('load', () => setTimeout(install, 200));   // after DEBRIEF31UI (it installs at load + 0), so this wrapper is the outermost
})();
