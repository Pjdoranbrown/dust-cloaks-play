/* ============================================================================
   INDEX PROG5 - PROG-1 step 5: the panels (audits/progression-plan.md 2.3, 2.6)
   Part of the game since PROG-1 step 4 (2026-11-16 deleted the off path):
   1. Loadout (BOOK33 panel, camp and War Table): every entry shows its tier
      letter (Q Quick, B Battle, P Prepared) in the slot lists. Each person
      with a Prepared entry in their book gets a Prep slot row: the entry is
      cast once, free, at deployment (Q14).
   2. The library line says Research, not Copy: one payment for the chapter.
      An entry researched but above a person's gate shows the gate (Level 3,
      Magic 3) in place of a button.
   3. Each Specialty building (Training Ground, Ranger Lodge, Tavern or Cells,
      Chapel, Mage Tower, Alchemy Lab) shows the three headings: Drill and
      Train (per Squad Mate, each an Advancement) and Research (the chapter),
      with every library entry, its tier letter, its gate and its price.
   4. R5 (Q12, Patrick): Burning Hands is the Mage's start key (the key, the
      bot's stray presses and Leader creation all read it); Lightning Bolt
      becomes a Mage Tower (L1) library entry, gated at Magic 2, for every
      Mage (Q27, Patrick: no old-save handling; keepBolt and foldBolt removed).
   Hooks: wraps BOOK33.rowHTML, BOOK33.libHTML, BOOK33.start, ABIL33.idOf,
   PROG.init and trainingHTML; PROG.init sets ABILITIES.MAGE's name and text once.
============================================================================ */
(function(){
  'use strict';
  const X = window.PROG5 = {TXT: {
    tier: {Q: 'Quick: full speed in a spare slot', B: 'Battle: a spare slot recharges half again as slowly', P: 'Prepared: the Prep slot or the key, never a spare slot'},
    legend: '<b>Q</b> Quick: full speed in a spare slot. <b>B</b> Battle: a spare slot recharges half again as slowly. <b>P</b> Prepared: the Prep slot or the key, never a spare slot.',   // K72: once per panel, every Specialty
    opens: 'opens when a veteran runs the ',   // K72: one unlock, one phrase (books.js 'More when a veteran runs the')
    ask: (name, c) => `Research ${name} for the chapter library, ${c}gp?`,   // K73: a confirm line like training's
    prep: 'Prep slot (cast once, free, when the squad deploys):',
    head: 'Here: <b>Drill</b> (a stat) and <b>Train</b> (a Talent) for one Squad Mate, each an Advancement; <b>Research</b> for the whole chapter, paid once.',
    research: 'Research (the chapter library: paid once, every Squad Mate of this Specialty who meets the gate may slot it)'}};
  const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const P = () => window.PROG, B = () => window.BOOK33;
  X.live = () => !!(P() && B());
  const esc_ = t => { const e = gl('esc'); return typeof e === 'function' ? e(t) : String(t); };
  X.gateTxt = id => { const g = P().gateOf(id); return g ? (g.stat === 'level' ? 'Level ' : 'Magic ') + g.n : ''; };
  X.badge = id => P().tier(id) + (X.gateTxt(id) ? ', ' + X.gateTxt(id) : '');
  const argOf = pid => typeof pid === 'number' ? String(pid) : `'${pid}'`;

  /* 1. the loadout row: tier letters in the lists, and the Prep slot */
  X.prepHTML = function(p, pid, where){
    const b = B(), bk = b.book(p, p.spec).filter(id => P().tier(id) === 'P'); if (!bk.length) return '';
    const lo = b.loadout(p, p.spec), cur = lo.prep || '', lk = b.locked();
    return `<div class="line" style="flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:14px;margin-left:12px" data-prep5="1">${X.TXT.prep} `
      + `<select style="font:inherit;font-size:14px"${lk ? ' disabled' : ''} title="${esc_(lk ? 'Locked until the contract ends.' : X.TXT.tier.P)}" onchange="BOOK33.set(${argOf(pid)},'prep',this.value,'${where}')">`
      + `<option value="">(empty)</option>` + bk.map(id => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc_(b.name(id))} (P)</option>`).join('') + '</select></div>';
  };
  X.tagOptions = function(h){
    return h.replace(/<option value="([a-z0-9_]+)"( selected)?>([^<]*)<\/option>/g, (m, id, s, name) => `<option value="${id}"${s || ''}>${name} (${P().tier(id)})</option>`);
  };
  /* Art note 2: a Prepared entry is refused in an auto slot, so its auto-slot selects do not offer one (a slotted one stays shown) */
  X.noPrepAuto = h => h.replace(/(<select[^>]*onchange="BOOK33\.set\([^,]+,\d+,[^>]*>)([\s\S]*?)(<\/select>)/g,
    (m, a, opts, z) => a + opts.replace(/<option value="([a-z0-9_]+)">[^<]*<\/option>/g, (o, id) => P().tier(id) === 'P' ? '' : o) + z);
  /* 2. the library line: Research, the price, and the gate */
  X.libFix = function(h, p){
    if (!h) return h;
    const lib = P().lib();
    return h.replace(/<button([^>]*?)onclick="BOOK33\.copy\(([^,]+),'([a-z0-9_]+)','([a-z]+)'\)"([^>]*)>Copy ([^<(]+?) into book \(([^<]*?)\)([^<]*)<\/button>/g,
      (m, a1, arg, id, where, a2, name, inner, tail) => {
        if (lib.includes(id)) return P().meets(p, id) ? '' : `<span style="opacity:.75" data-gate5="1">${esc_(name)} (${P().tier(id)}): researched, needs ${esc_(X.gateTxt(id))}</span>`;
        if (X.ask === id) return X.askHTML(id, where);
        /* K72: Research is for the chapter, so the loadout shuts it on gold or a locked roster only, as the Mage Tower does; the gate is for slotting */
        const poor = (gl('META').treasury | 0) < P().researchCost(id), lk = B().locked(), g = X.gateTxt(id);
        a1 = a1.replace(/\s*disabled\b/, '') + (poor || lk ? 'disabled ' : '');
        a2 = a2.replace(/title="[^"]*"/, `title="${poor ? 'Not enough gold.' : esc_(X.TXT.tier[P().tier(id)] + (g ? '. Needs ' + g + ' to slot.' : '.'))}"`);
        return `<button${a1}onclick="PROG5.askR('${id}','${where}')"${a2}>Research ${name} (${X.badge(id)}; ${inner})${X.gateTxt(id) ? tail.replace(/\s*\(Magic \d+\)/, '') : tail}</button>`;   /* Art note 4: the badge already names the gate */
      });
  };
  /* researched entries this person cannot slot yet (gate unmet), not already named on the line */
  X.gatedHTML = function(h, p){
    const b = B(), bk = b.book(p, p.spec), miss = P().lib().filter(id => b.LAD[id] && b.LAD[id].spec === p.spec && !bk.includes(id) && !P().meets(p, id) && !h.includes(`>${esc_(b.LAD[id].name)} (`));
    if (!miss.length) return h;
    const add = ' ' + miss.map(id => `<span style="opacity:.75" data-gate5="1">${esc_(b.LAD[id].name)} (${P().tier(id)}): researched, needs ${esc_(X.gateTxt(id))}</span>`).join(' ');
    return h ? h.replace(/<\/div>$/, add + '</div>') : `<div class="line" style="flex-wrap:wrap;gap:4px 6px;align-items:center;font-size:14px;margin-left:12px">${add}</div>`;
  };
  X.hookBook = function(){
    const b = B(); if (!b || b._prog5) return; b._prog5 = true;
    X._row0 = b.rowHTML; X._lib0 = b.libHTML;
    b.rowHTML = function(p, pid, where, key){
      const h = X._row0.apply(this, arguments);
      if (!X.live() || !h || !p) return h;
      try { const lib = b.libHTML(p, pid, where), i = lib ? h.lastIndexOf(lib) : -1;
        const head = i >= 0 ? h.slice(0, i) : h, tail = i >= 0 ? h.slice(i) : '';
        return X.tagOptions(X.noPrepAuto(head)) + X.prepHTML(p, pid, where) + tail; } catch (e) { return h; }
    };
    X._panel0 = b.panelHTML;
    b.panelHTML = function(){ const h = X._panel0.apply(this, arguments); if (!X.live() || !h || !/\((Q|B|P)\)/.test(h)) return h;
      try { return h.replace('<b>Loadout.</b> ', `<b>Loadout.</b> <span style="opacity:.85" data-legend5="1">${X.TXT.legend}</span> `); } catch (e) { return h; } };
    b.libHTML = function(p){ const h = X._lib0.apply(this, arguments); if (!X.live() || !p) return h; try { return X.gatedHTML(X.libFix(h, p), p); } catch (e) { return h; } };
  };

  /* 3. the Specialty building: three headings and the Research list */
  X.specsAt = fid => { const L = B() && B().LIB; if (!L) return []; return Object.keys(L).filter(s => L[s].some(f => String(f).replace('#', '') === fid)); };
  X.researchHTML = function(fid){
    const b = B(), M = gl('META'), specs = X.specsAt(fid); if (!specs.length || !M) return '';
    const lib = P().lib(); let rows = '';
    for (const spec of specs){
      const all = Object.keys(b.LAD).filter(id => b.LAD[id].spec === spec && b.LAD[id].src !== 'start'), open = b.library(spec);
      if (!all.length) continue;
      const sp = ((gl('SPECS') || {})[spec] || {}).name || spec;
      rows += `<div class="line" style="flex-wrap:wrap;gap:4px 6px;align-items:center;font-size:14px"><b>${esc_(sp)}:</b> ` + all.map(id => {
        const L = b.LAD[id], c = P().researchCost(id), tip = esc_(X.TXT.tier[P().tier(id)] + (X.gateTxt(id) ? '. Needs ' + X.gateTxt(id) + ' to slot.' : '.'));
        const lab = `${esc_(L.name)} (${X.badge(id)})`;
        if (lib.includes(id)) return `<span title="${tip}" style="color:#226b2a">${lab}: in the library</span>`;
        if (!open.includes(id)) return `<span title="${tip}" style="opacity:.6">${lab}: ${L.src === 'scroll' ? 'needs a found scroll' : X.TXT.opens + esc_(X.facName(fid))}</span>`;
        if (X.ask === id) return X.askHTML(id, 'camp');
        const poor = (M.treasury | 0) < c, lk = b.locked();
        return `<button class="btn" style="font-size:14px;padding:1px 6px"${poor || lk ? ' disabled' : ''} title="${poor ? 'Not enough gold.' : tip}" onclick="PROG5.askR('${id}','camp')">Research ${lab}, ${c}gp</button>`;
      }).join(' ') + '</div>';
    }
    const said = X.said ? `<div style="font-size:14px;color:#226b2a" data-said5="1"><b>${esc_(X.said)}</b></div>` : '';
    const out = rows ? `<div class="desc" style="text-align:left;margin-top:8px" data-research5="1"><b>${X.TXT.research}.</b><div style="font-size:14px;opacity:.85" data-legend5="1">${X.TXT.legend}</div>${said}${rows}</div>` : '';
    /* UX K96: Research folds into a closed section (it opens itself while a question or a message is showing) */
    const n = (rows.match(/<button(?![^>]*disabled)[^>]*PROG5\.askR\('/g) || []).length + (X.ask && rows.includes('data-ask5') ? 1 : 0), sec = gl('sec96');
    return out && typeof sec === 'function' ? sec('research:' + fid, `<b>${String(X.TXT.research).split(' (')[0]}</b> <span style="opacity:.8">\u00b7 ${n ? n + ' to research' : 'nothing to buy now'}</span>`, out, !!(X.ask || X.said)) : out;
  };
  /* K73: Research asks first (one line, Confirm and Cancel, as training does) and says what happened */
  X.facName = fid => { const f = gl('facility'); const o = typeof f === 'function' ? f(fid) : null; return (o && o.name) || fid; };
  X.ask = null; X.said = '';
  X.askHTML = function(id, where){
    const L = B().LAD[id], c = P().researchCost(id), poor = ((gl('META') || {}).treasury | 0) < c;
    return `<span data-ask5="1" style="white-space:normal"><b>${esc_(X.TXT.ask(L.name, c))}</b> `
      + `<button class="btn gold" style="font-size:14px;padding:1px 8px"${poor ? ' disabled title="Not enough gold."' : ''} onclick="PROG5.doR('${id}','${where}')">Confirm</button> `
      + `<button class="btn" style="font-size:14px;padding:1px 8px" onclick="PROG5.askR(null,'${where}')">Cancel</button></span>`;
  };
  X.redraw = where => { try { const b = B(); if (b && b.redraw) b.redraw(where || 'camp'); } catch (e) {} };
  X.askR = function(id, where){ X.ask = id || null; X.said = ''; X.redraw(where); };
  X.doR = function(id, where){
    X.ask = null; const L = B().LAD[id], ok = B().research(id, where);
    X.said = ok && L ? `${L.name} joins the chapter library. Every ${(((gl('SPECS') || {})[L.spec]) || {}).name || L.spec} who meets the gate may slot it.` : '';
    X.redraw(where); if (ok) X.loadout21(id); return ok;
  };
  /* PD-21 (Patrick Q21, 2026-11-16): from b9 in the Founding, the Books lesson on the first visit to a Specialty building's
     Research list ({n} = the L1 price), then Loadouts after the first research. Once per Founding (T45.seen). */
  X.f21 = () => { try { const F = window.F34, M = gl('META'); return !!(window.T45 && F && F.active() && M.f34 && (M.f34.beat | 0) >= 8); } catch (e) { return false; } };
  X.books21 = function(fid){
    if (!X.f21() || T45.seen('books')) return;
    setTimeout(() => { try { if (document.querySelector('[data-research5]') && !T45.seen('books'))
      T45.lesson('books', {sel: '[data-research5]', vars: {name: X.facName(fid), n: P().K.research.L1}}); } catch (e) {} }, 0);
  };
  X.loadout21 = function(id){
    try { const L = B().LAD[id]; if (X.f21() && L && !T45.seen('loadout')) T45.lesson('loadout', {vars: {ability: L.name}}); } catch (e) {}
  };
  X.hookTraining = function(){
    const f = gl('trainingHTML'); if (typeof f !== 'function' || X._tr) return;
    X._tr = function(fid){
      const h = f.apply(this, arguments);
      try { if (!X.live() || !h || !X.specsAt(fid).length) return h;
        const rh = X.researchHTML(fid); if (rh) X.books21(fid);   // PD-21
        return `<div class="desc" style="text-align:left;margin-top:8px" data-head5="1">${X.TXT.head}</div>` + h + rh; } catch (e) { return h; }
    };
    (0, eval)('trainingHTML = window.PROG5._tr');
  };
  /* 4. R5: Burning Hands on the Mage's key, Lightning Bolt a Magic 2 library entry */
  X.BOLT = {id: 'bolt', spec: 'MAGE', name: 'Lightning Bolt', src: 'L1', minMagic: 2, max: 1, get cdS(){ const AB = gl('ABILITIES'); return AB && AB.MAGE ? AB.MAGE.cd : 16; }};
  X.MAGE = {name: 'Burning Hands', glyph: 'star', sfx: 'zap',
    text: 'A cone of fire in front of the Mage: every enemy in it takes a Piercing hit of 2 damage, 1 more at each rank. Ranks also widen and lengthen the cone.'};
  X.applyR5 = function(){   // once, at PROG.init
    const b = B(), A = window.ABIL33, AB = gl('ABILITIES'); if (!b || !A || X._r5) return;
    X._r5 = true;
    if (b.LAD.burning) b.LAD.burning.src = 'start';   // the start key leaves the library list
    if (!b.LAD.bolt){ if (!X.BOLT.glyph && b.glyphOf) X.BOLT.glyph = b.glyphOf('bolt'); b.LAD.bolt = X.BOLT; }
    if (A.REG.bolt) A.REG.bolt.name = 'Lightning Bolt';   // the name no longer comes from ABILITIES.MAGE
    if (AB && AB.MAGE){ AB.MAGE.name = X.MAGE.name; AB.MAGE.text = X.MAGE.text; }
  };
  X.hookR5 = function(){
    const b = B(), A = window.ABIL33, pr = P(); if (!b || !A || !pr || X._st0) return;
    X._st0 = b.start; b.start = function(spec){ return spec === 'MAGE' ? 'burning' : X._st0.apply(this, arguments); };
    X._id0 = A.idOf; A.idOf = function(spec){ return spec === 'MAGE' ? 'burning' : X._id0.apply(this, arguments); };
    const init0 = pr.init; pr.init = function(){ const r = init0.apply(this, arguments); X.applyR5(); return r; };
  };
  X.hookBook(); X.hookTraining(); X.hookR5();

  /* BOOK33's own self-test covers the library model (PROG-1 step 4 removed its PROG-off run) */

  /* ---- self-test: PROG5.selfTest() (puts META and the treasury back) ---- */
  X.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const b = B(), pr = P(); if (!b || !pr){ ok('BOOK33 and PROG loaded', false); return {pass: 0, total: 1, rows}; }
    const M0 = gl('META'), live0 = b.live, has0 = b.has, K0 = gl('SAVE_KEY');   /* QA 57d1bd8: research and set save; aim them at a throwaway key */
    try {
      (0, eval)("SAVE_KEY = 'prog5_selftest_tmp'");
      const M = JSON.parse(JSON.stringify(M0 || {})); M.treasury = 1000; M.lib33 = []; M.scrolls = []; M.facilities = {magetower: 1, barracks: 1, training: 1}; M.damaged = {};
      M.nextId = M.nextId || 900; M.roster = [];
      window.__p5m = M; (0, eval)('META = window.__p5m');
      const rr = gl('rollRecruit'), mage = Object.assign(typeof rr === 'function' ? rr() : {}, {id: 951, name: 'Odo', spec: 'MAGE', magic: 2, adv: 2, book: [], slots: undefined, trainingAt: null}); M.roster = [mage];
      b.has = id => ['magetower', 'training'].includes(id);
      b.live = () => true;
      ok('tier letters: frost Q, burning B, stonewall P', pr.tier('frost') === 'Q' && pr.tier('burning') === 'B' && pr.tier('stonewall') === 'P');
      let lh = b.libHTML(mage, 951, 'camp');
      ok('the library line says Research with tier and price, not Copy', /Research Ray of Frost \(Q; 120gp/.test(lh) && !/Copy /.test(lh), lh.slice(0, 200));
      ok('Research costs the chapter once', b.research('frost', 'camp') && M.treasury === 880 && M.lib33.includes('frost'));
      M.lib33.push('fireball'); lh = b.libHTML(mage, 951, 'camp');
      ok('researched but above the gate: the gate shows, no button', /Fireball \(B\): researched, needs Magic 3/.test(lh) && !/BOOK33\.research\('fireball'/.test(lh), lh.slice(0, 300));
      M.lib33.push('stonewall');
      const rh = b.rowHTML(mage, 951, 'camp', '2');
      ok('the slot lists show the tier letter', /Ray of Frost \(Q\)<\/option>/.test(rh), rh.slice(0, 200));
      ok('a Prep slot row for a book with a Prepared entry', /data-prep5="1"/.test(rh) && /Stone Wall \(P\)/.test(rh) && /BOOK33\.set\(951,'prep'/.test(rh));
      b.set(951, 'prep', 'stonewall', 'camp');
      ok('the Prep slot shows what is set', /<option value="stonewall" selected>[^<]*Stone Wall \(P\)/.test(b.rowHTML(mage, 951, 'camp', '2')));
      const th = gl('trainingHTML')('magetower');
      ok('the Mage Tower shows the three headings and a Research list', /data-head5="1"/.test(th) && /<b>Drill<\/b>/.test(th) && /<b>Research<\/b>/.test(th) && /data-research5="1"/.test(th), th.slice(0, 160));
      ok('the Research list marks what is in the library and what needs the upgrade', /Ray of Frost \(Q\): in the library/.test(th) && /opens when a veteran runs the|in the library/.test(th));
      ok('the Barracks gets no Research list', !/data-research5/.test(gl('trainingHTML')('barracks') || ''));
      ok('R5: the Mage starts on Burning Hands', b.start('MAGE') === 'burning' && window.ABIL33.idOf('MAGE') === 'burning' && b.book(mage)[0] === 'burning');
      ok('R5: Burning Hands is not offered as Research', !b.library('MAGE').includes('burning'));
      ok('R5: Lightning Bolt is a Mage Tower entry at Magic 2, shown by name', b.LAD.bolt && b.LAD.bolt.src === 'L1' && X.gateTxt('bolt') === 'Magic 2' && b.name('bolt') === 'Lightning Bolt' && b.library('MAGE').includes('bolt'));
      ok('R5: the Mage ability reads Burning Hands', gl('ABILITIES').MAGE.name === 'Burning Hands');
      { const lib0 = M.lib33.slice(); M.lib33 = M.lib33.filter(id => id !== 'bolt');
        ok('R5: Lightning Bolt is not in the library until researched', !b.book(mage).includes('bolt')); mage.magic = 2; ok('R5: with it researched, a Magic 2 Mage may slot Lightning Bolt', (M.lib33.push('bolt'), b.book(mage).includes('bolt')));
        mage.magic = 1; ok('R5: a Magic 1 Mage may not', !b.book(mage).includes('bolt')); mage.magic = 2; M.lib33 = lib0; }
      { const M1 = gl('META'), lib0 = M1.lib33.slice(), t0 = M1.treasury; M1.lib33 = M1.lib33.filter(id => id !== 'bolt'); M1.treasury = 999; const mg = mage.magic; mage.magic = 1;
        const lh = b.libHTML(mage, 951, 'camp'), btn = (lh.match(/<button[^>]*askR\('bolt'[^>]*>/) || [''])[0];
        ok('K72: a Magic 1 Mage may research Lightning Bolt from the loadout, as in the Mage Tower', btn && !/disabled/.test(btn) && /Needs Magic 2 to slot/.test(btn) && !/Needs Magic 2\.(?! )/.test(lh), btn);
        mage.magic = mg; M1.lib33 = lib0; M1.treasury = t0; }
      { const bt = b.selfTest(); ok('BOOK33 rows pass (the library model)', bt.ok, (bt.fails || []).slice(0, 3).join('; ')); }
    } catch (e) { ok('no throw', false, e.message); }
    finally { window.__p5m = M0; (0, eval)('META = window.__p5m'); delete window.__p5m; b.has = has0;
      b.live = live0; try { localStorage.removeItem('prog5_selftest_tmp'); } catch (e){} if (K0 !== undefined){ window.__p5k = K0; (0, eval)('SAVE_KEY = window.__p5k'); delete window.__p5k; } }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
/* PROG-1: the built progression is the game from load (step 3 turned it on; step 4, 2026-11-16, deleted the off path). PROG.init runs once. */
try { if (window.PROG && typeof PROG.init === 'function') PROG.init(); } catch (e) { console.error('PROG init', e); }
