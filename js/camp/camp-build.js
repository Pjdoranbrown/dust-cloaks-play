/* ============================================================================
   INDEX C31 - F-31.1 "The camp as a word menu" (Art & Interface)
   Replaces the camp's top bar with words: [Menu] War Table, Build, Armoury,
   Barracks, Chronicle, each with a one-line status; gold, upkeep and season on
   the right. One needs() list feeds the "!" marks on the words, the plaques over
   the camp and the "Needs you" box. Nothing opens by itself; the campNote toast
   stays for one-off news. Clicking a plaque or a line in the box opens the same
   screen as its word. The campaign map (J) opens from inside the War Table.
   Saves: one small key, META.c31 (what has been seen); old saves just seed it.
   No switch (removed in INT-1, 2026-11-15).
============================================================================ */
(function(){
  'use strict';
  const C31 = window.CAMP31 = {};
  const $i = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const inCamp = () => !!(typeof META !== "undefined" && META && META.leader && typeof G !== "undefined" && !G && CAMP.on && !(typeof inStoryNow === 'function' && inStoryNow()));
  const S = () => { if (!META.c31) META.c31 = {board: boardSig(), chron: chronSeq(), hire: hireSig(), back: [], built: []}; return META.c31; };
  const boardSig = () => (META.board || []).map(c => c.obj + ':' + c.place + ':' + c.tier).join('|');
  const chronSeq = () => (META.chron && META.chron.seq) || 0;
  const hireSig = () => (META.hireLine && META.hireLine.recruits || []).filter(Boolean).map(r => r.name).join('|');   // a hired recruit leaves a null (contracts.js hire)
  const mates = () => [].concat(META.roster || [], META.officers || []);

  /* ---- what changed while the player was elsewhere ---- */
  const was = {};
  function watch(){
    if (typeof META === "undefined" || !META || !META.leader) return;
    const s = S();
    for (const p of mates()){
      const busy = !!(p.resting > 0 || p.away);
      if (was[p.id] && !busy && !p.dead && s.back.indexOf(p.name) < 0) s.back.push(p.name);
      was[p.id] = busy;
    }
  }

  /* ---- the one list ---- */
  C31.needs = function(){
    const out = [];
    if (typeof META === "undefined" || !META || !META.leader) return out;
    const s = S();
    if (META.board && boardSig() !== s.board) out.push({word: 'table', text: 'New contracts on the War Table', short: 'New contracts posted'});
    if (s.built.length) out.push({word: 'build', text: s.built.join(', ') + (s.built.length > 1 ? ' are' : ' is') + ' finished', short: 'Works finished'});
    { const live = {}; for (const p of mates()) if (!p.dead && !p.fallen) live[p.name] = 1; s.back = s.back.filter(n => live[n]); }   /* K62: the dead are not 'back in camp' */
    if (s.back.length) out.push({word: 'barracks', text: s.back.slice(0, 2).join(' and ') + (s.back.length > 2 ? ' and ' + (s.back.length - 2) + ' more' : '') + ' back in camp', short: 'Back from rest'});
    const rec = (META.hireLine && META.hireLine.recruits || []).filter(Boolean).length;
    if (rec && hireSig() !== s.hire) out.push({word: 'barracks', text: rec + ' recruit' + (rec > 1 ? 's' : '') + ' waiting at the fire', short: rec + ' recruit' + (rec > 1 ? 's' : '') + ' waiting'});
    { const adv = typeof advLeft === 'function' ? advLeft() : 0; if (adv > 0){ const A = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.advCamp) || {}, f = s => String(s).replace('{n}', adv); out.push({word: 'barracks', text: f(adv > 1 ? A.needs || '{n} Advancements to spend on your Squad Mates' : A.needsOne || '1 Advancement to spend on a Squad Mate'), short: f(adv > 1 ? A.short || '{n} Advancements to spend' : A.shortOne || '1 Advancement to spend')}); } }   /* ND words, CAMPAIGN_LINES.advCamp (1f1a4ca1); UX e85e8b85 */
    if (chronSeq() > s.chron) out.push({word: 'chronicle', text: 'The Scribe has written something new', short: 'A new entry'});
    return out;
  };
  const has1 = w => C31.needs().some(n => n.word === w);

  /* ---- the words ---- */
  function status(w){
    try {
      if (w === 'table') return META.board ? META.board.length + ' contracts' : 'Plan the next job';
      if (w === 'build'){ const n = META.build ? Object.keys(META.build).length : 0; return n ? n + ' work' + (n > 1 ? 's' : '') + ' under way' : 'Choose a plot'; }
      if (w === 'armoury') return 'Gear and stores';
      if (w === 'barracks'){ const m = mates(), b = m.filter(p => p.resting > 0 || p.away).length, rw = b && m.filter(p => p.resting > 0 && p.restWhy === 'ransom').length === b; return m.length + (m.length === 1 ? ' mate' : ' mates') + (b ? ', ' + b + ' busy' + (rw ? ' (after the ransom)' : '') : ''); }
      if (w === 'chronicle') return 'History and rules';
    } catch (e) {}
    return '';
  }
  const WORDS = [
    ['table', 'War Table', "CAMP31.go('table')"], ['build', 'Build', "CAMP31.go('build')"],
    ['armoury', 'Armoury', "CAMP31.go('armoury')"], ['barracks', 'Barracks', "CAMP31.go('barracks')"],
    ['chronicle', 'Chronicle', "CAMP31.go('chronicle')"]];
  C31.go = function(w){
    closeMenu(); try { SFX.play('pick'); } catch (e) {}
    if (typeof closePanel === 'function') { try { closePanel(); } catch (e) {} }
    if (w === 'table') openTable();
    else if (w === 'build') C31.openBuild();
    else if (w === 'armoury') openCamp();
    else if (w === 'barracks') openRoster();
    else if (w === 'chronicle') openScribeBook();
    refresh();
  };
  C31.map = function(){ const b = $i('dc-cm-btn'); if (b) b.click(); };
  function addMap(){ const h = document.querySelector("#screen-table .table-head"); if (!h || h.querySelector(".c31-map")) return; const x = document.createElement("button"); x.type = "button"; x.className = "btn small c31-map"; x.textContent = "MAP OF ARCADIA (J)"; x.onclick = () => C31.map(); h.appendChild(x); }
  function closeMenu(){ const m = $i('c31-menu'); if (m) m.remove(); }
  C31.menu = function(btn){
    if ($i('c31-menu')) return closeMenu();
    const m = document.createElement('div'); m.id = 'c31-menu';
    const item = (t, fn, tip) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (tip) b.title = tip; b.onclick = () => { closeMenu(); try { fn(); } catch (e) { console.error(e); } }; m.appendChild(b); return b; };
    const FW = typeof F34 !== 'undefined' && F34.TXT23 && window.CARD23 !== false && (F34.inSlot ? F34.inSlot() : F34.active && F34.active());   // Neon R6 H1: the finished card too. P23-CARD §4: LEAVE and NEW CHAPTER live here while a Founding runs
    if (FW){ item(F34.TXT23.menuLeave, () => F34.leave(), F34.TXT1I.leaveTip).dataset.p23 = 'leave'; item(F34.TXT23.menuSkip, () => F34.askSkip(), F34.TXT1I.skipTip).dataset.p23 = 'skip';
      const r = document.createElement('div'); r.style.cssText = 'height:1px;background:#8a6d3a;margin:2px 0'; m.appendChild(r); }
    item('Settings', () => toggleSettings());
    item('Portraits', () => openPortraitStudio());
    item('Save', () => { saveMeta(); exportSave(); });
    item('Quit', () => { const inF = typeof F34 !== 'undefined' && (F34.inSlot ? F34.inSlot() : F34.active && F34.active()); if (inF && F34.leave) F34.leave(); else showSplash(); });   // Neon R7 M1: Quit from a Founding goes home to the main slot, as LEAVE does
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(); m.style.left = Math.max(6, r.left) + 'px'; m.style.top = (r.bottom + 2) + 'px';
  };
  document.addEventListener('mousedown', e => { const m = $i('c31-menu'); if (m && !m.contains(e.target) && !(e.target.closest && e.target.closest('.c31-menubtn'))) closeMenu(); });   // P23-CARD: the lone Founding Menu button has the class, not the id

  function barHTML(){
    const F = typeof forecast === 'function' ? forecast() : null;
    const up = F ? Math.max(0, F.civ + F.debt) + ' gp' : '';
    const FD = typeof F34 !== 'undefined' && F34.active && F34.active(), fs0 = FD && F34.state(), showGold = !FD || !!(fs0 && fs0.b45 && fs0.b45.gold) || !!(typeof T45 !== 'undefined' && T45.cur && T45.cur.id === 'treasury');   // s6-15a 3, 6, 7: on a Founding screen no Upkeep, and no Treasury until the Treasury lesson card is up
    let h = '<button class="c31-menubtn" id="c31-menubtn" type="button" onclick="CAMP31.menu(this)">Menu ▾</button>';
    for (const w of WORDS){
      const bang = has1(w[0]);
      h += '<button class="c31-word' + (bang ? ' bang' : '') + '" type="button" data-c31="' + w[0] + '" onclick="' + w[2] + '"><b>' + w[1] + (bang ? '<i class="c31-bang">!</i>' : '') + '</b><span>' + esc(status(w[0])) + '</span></button>';
    }
    h += '<span class="grow"></span>' + (showGold ? '<span class="stat">Treasury <b>' + META.treasury + 'gp</b></span>' : '') +
      (up && !FD ? '<span class="stat c31-up" title="Upkeep due each season">Upkeep <b>' + up + '</b></span>' : '') +
      '<span class="stat">' + esc(seasonName()) + '</span>';
    return h;
  }

  /* ---- plaques over the camp and the Needs-you box ---- */
  const pl = id => ({x: PLOTS[id][0], y: PLOTS[id][1]});
  const ANCH = {table: () => HUB.house, build: () => pl('tents'), armoury: () => (has('armoury') ? pl('armoury') : HUB.wagon), barracks: () => (has('barracks') ? pl('barracks') : HUB.fire), chronicle: () => ({x: HUB.house.x + 10, y: HUB.house.y + 78})};
  const NAMES = {table: 'War Table', build: 'Build', armoury: 'Armoury', barracks: 'Barracks', chronicle: 'Chronicle'};
  function screenOpen(){ return !!document.querySelector('.screen:not(.hidden)') || !!($i('camp-panel') && !$i('camp-panel').classList.contains('hidden')) || !!($i('chronicle') && $i('chronicle').children.length && $i('chronicle').style.display !== 'none' && !$i('chronicle').classList.contains('hidden') && $i('chronicle').offsetParent); }
  function layer(){ let l = $i('c31-layer'); if (!l){ l = document.createElement('div'); l.id = 'c31-layer'; document.body.appendChild(l); } return l; }
  function refresh(){
    const l = layer(), tb = $i('topbar');
    const show = inCamp() && tb && !tb.classList.contains('hidden') && !screenOpen();
    // the camp hint is late-fixes hint81's (keys line included; ux.js shortens it later): no override here (QA Low, 0e3652d)
    if (!show){ l.style.display = 'none'; return; }
    l.style.display = '';
    const ns = C31.needs(), seen = {};
    let h = '';
    const cv = $i('gameCanvas'), r = cv && cv.getBoundingClientRect(), k = r ? r.width / (typeof VW !== "undefined" ? VW : r.width) : 1;
    for (const n of ns){
      if (seen[n.word]) continue; seen[n.word] = 1;
      let a; try { a = ANCH[n.word](); } catch (e) {} if (!a || !r || !isFinite(a.x + a.y)) continue;
      const x = r.left + (a.x - CAMP.cam.x) * k, y = r.top + (a.y - CAMP.cam.y) * k - 70 * k;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      h += '<button class="c31-plaque" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px" onclick="CAMP31.go(\'' + n.word + '\')" title="' + esc(n.text) + '"><i class="c31-bang">!</i> ' + NAMES[n.word] + '<small>' + esc(n.short || n.text) + '</small></button>';
    }
    if (ns.length){
      h += '<div class="c31-needs"><b>Needs you</b>' + ns.map(n => '<button type="button" onclick="CAMP31.go(\'' + n.word + '\')"><i class="c31-bang">!</i> <u>' + NAMES[n.word] + '</u> ' + esc(n.text) + '</button>').join('') + '</div>';
    }
    if (l.__h !== h){ l.innerHTML = h; l.__h = h; }
  }

  function css(){
    if ($i('c31-style')) return;
    const st = document.createElement('style'); st.id = 'c31-style';
    st.textContent = '#topbar .c31-menubtn,#topbar .c31-word{font-family:inherit;cursor:pointer;border:1px solid #8a6d3a;background:#3a2a1a;color:#efe3c8;border-radius:4px;padding:3px 12px;margin-right:6px;text-align:left;line-height:1.15;min-height:36px;font-size:14px}' +
      '#topbar .c31-word b{display:block;font-size:15px;letter-spacing:.04em}#topbar .c31-word span{display:block;font-size:14px;opacity:.75;white-space:nowrap}' +
      '#topbar .c31-word:hover,#topbar .c31-menubtn:hover{background:#55401f}#topbar .c31-word.bang{border-color:var(--gold-bright)}' +
      '.c31-bang{display:inline-block;font-style:normal;background:#e0482a;color:#fff;border-radius:9px;min-width:16px;height:16px;line-height:16px;text-align:center;font-size:14px;font-weight:bold;margin-left:4px}' +
      '#c31-menu{position:fixed;z-index:9000;background:#2a1e12;border:2px solid #8a6d3a;border-radius:4px;display:flex;flex-direction:column;min-width:140px}' +
      '#c31-menu button{background:none;border:0;color:#efe3c8;font:15px Georgia;text-align:left;padding:8px 14px;cursor:pointer}#c31-menu button:hover{background:#55401f}' +
      '#c31-layer{position:fixed;inset:0;pointer-events:none;z-index:40}' +
      '.c31-plaque small{display:block;font:normal 14px Georgia;opacity:.8}.c31-plaque{position:fixed;text-align:center;line-height:1.2;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;background:#efe3c8;color:#2a2218;border:2px solid #8a6d3a;border-radius:4px;font:bold 14px Georgia;padding:3px 9px;box-shadow:0 2px 6px #0007;animation:c31p 1.8s ease-in-out infinite}' +
      '.c31-needs{position:fixed;right:14px;bottom:64px;width:min(320px,calc(100vw - 28px));box-sizing:border-box;pointer-events:auto;background:#2a1e12ee;border:2px solid #8a6d3a;border-radius:6px;padding:8px 10px;color:#efe3c8;font:14px Georgia}' +
      '.c31-needs b{display:block;margin-bottom:4px;color:var(--gold-bright)}.c31-needs button{display:block;width:100%;white-space:normal;line-height:1.3;text-align:left;background:none;border:0;color:inherit;font:inherit;padding:4px 2px;cursor:pointer}.c31-needs button:hover{background:#55401f}' +
      '@keyframes c31p{50%{box-shadow:0 0 0 3px #ffd860aa}}@media (prefers-reduced-motion:reduce){.c31-plaque{animation:none}}' +
      '#dc-cm-btn{display:none!important}' +
      '#c31-build{position:fixed;inset:0;z-index:8000;background:rgba(10,6,2,.72);display:none;flex-direction:column;align-items:center;padding:56px 14px 14px;box-sizing:border-box;overflow:auto;font:14px Georgia;color:#2a2218}#c31-build>div{width:min(980px,100%);box-sizing:border-box}' +
      '.c31b-head{display:flex;gap:16px;align-items:center;background:#2a1e12;color:#efe3c8;border:2px solid #8a6d3a;border-radius:6px 6px 0 0;padding:8px 14px;font-size:16px}.c31b-head .grow{flex:1}.c31b-note{background:#e8dcc0;padding:6px 14px;font-size:14px}' +
      '.c31b-list{background:#f6edd6;border:2px solid #8a6d3a;border-top:0;padding:6px;display:flex;flex-direction:column;gap:4px}.c31b-row{display:grid;grid-template-columns:52px 1fr 170px 130px;gap:10px;align-items:center;border:1px solid #b9a06a;border-radius:5px;padding:6px 8px;background:#fbf4e0}.c31b-row img{width:48px;height:48px;object-fit:contain}' +
      '.c31b-row.built{opacity:.55}.c31b-row.locked img,.c31b-row.short img{filter:grayscale(.6)}.c31b-desc{font-size:14px;margin-top:2px}.c31b-works{font-size:14px;margin-top:2px;color:#4a3b1a}.c31b-num{display:flex;flex-direction:column;gap:1px;font-size:14px}.c31b-num .u{opacity:.8}.c31b-num .t{color:#8b0000;font-weight:bold}.c31b-row.going .t{color:#2f5a1a}' +
      '@media (max-width:1100px){.c31b-row{grid-template-columns:44px 1fr 130px}.c31b-act{grid-column:2/4}}' +
      '#roster-inner>h1,#roster-inner>.money{align-self:flex-start;text-align:left}#roster-inner .folio-tabs{justify-content:flex-start}#roster-inner .folio-page{align-items:stretch;padding-left:0;padding-right:0}#roster-inner .folio-page>h2.sec,#roster-inner .folio-page>.sub{text-align:left}#roster-inner .folio-page>.row{justify-content:flex-start}#roster-inner .folio-page>.advbox{max-width:none;margin-left:0;margin-right:0}#roster-inner .folio-tail{align-self:flex-start}' +
      '#camp-inner>h1,#camp-inner>.money,#camp-inner>.sub{align-self:flex-start;text-align:left}#camp-inner .folio-tabs{justify-content:flex-start}#camp-inner .folio-page{align-items:stretch;padding-left:0;padding-right:0}#camp-inner .folio-page>h2.sec{text-align:left}#camp-inner .folio-page>.row,#camp-inner .aq-row,#camp-inner .aq-cards{justify-content:flex-start}#camp-inner .aq-label{text-align:left}#camp-inner .folio-tail{align-self:flex-start}#camp-inner .aq-page{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 24px;align-items:start}#camp-inner .aq-page>.aq-row,#camp-inner .aq-page>.aq-note{grid-column:1/-1}#camp-inner .aq-slot{width:auto}' +
      '#camp-inner .folio-tail .btn,#roster-inner .folio-tail .btn{margin-left:0;margin-right:0}#camp-inner .aq-note{text-align:left;font-size:14px}' +
      '#camp-inner .aq-sell.sure,#camp-inner .aq-sell.sure:hover{background:#7a1e14;border-color:#3a0a04;color:#fff0e0}' +
      '#camp-inner .gcard .aq-sold{font-size:14px;color:var(--blood);padding:3px 8px;border-top:1px solid #e0d2b4;line-height:1.3}' +
      '.c31-col{display:flex;flex-direction:column;align-items:stretch;align-self:stretch}.c31-col>.advbox{margin:8px 0;max-width:none}.c31-bk{display:flex;gap:14px;align-items:flex-start;margin-top:8px}.c31-list{flex:1 1 60%;min-width:0;display:flex;flex-direction:column;gap:4px}.c31-detail{flex:0 0 38%;max-width:420px;position:sticky;top:8px;max-height:calc(100vh - 150px);overflow:auto;background:#efe3c8;border:2px solid #8a6d3a;border-radius:6px;padding:12px;box-sizing:border-box}' +
      '.c31-line{display:grid;grid-template-columns:44px minmax(110px,1.1fr) 148px minmax(120px,2fr);gap:8px;align-items:center;text-align:left;font:14px Georgia;background:#f6edd6;border:1px solid #b9a06a;border-radius:4px;padding:4px 8px;cursor:pointer;color:#2a2218}.c31-line:hover,.c31-line.on{background:#e6d3a0;border-color:#8a6d3a}.c31-line .ic{width:40px;height:40px}.c31-nm small{display:block;opacity:.7;font-size:14px}.c31-st{font-weight:bold}.c31-act{font-style:italic;opacity:.85}' +
      '@media (max-width:1100px){.c31-detail{flex-basis:42%}.c31-line{grid-template-columns:40px 1fr 128px}.c31-act{grid-column:2/4}}' +
      '#topbar .c31-word b{white-space:nowrap}#topbar .stat{white-space:nowrap}@media (max-width:1100px){#topbar .c31-word span{display:none}#topbar .c31-word,#topbar .c31-menubtn{padding:3px 8px;margin-right:4px}#topbar .c31-up{display:none}}';
    document.head.appendChild(st);
  }

  /* ---- F-31.2 the Barracks: one line per person, a panel on the right ---- */
  const BK = C31.bk = {sel: null};
  const people = () => { const out = []; if (META.leader) out.push({p: META.leader, kind: 'Squad Leader', sq: 0});
    (META.officers || []).forEach((o, i) => { if (o) out.push({p: o, kind: 'Officer', sq: i + 1}); });
    (META.roster || []).forEach((p, i) => out.push({p, kind: 'Mate', i})); return out; };
  const inj = p => (p.injuries || []).length;
  C31.statusOf = p => p.away === 'captive' ? {t: 'Captive', c: '#6a2a6a'} : p.away ? {t: 'Away', c: '#2a4f8a'}
    : p.resting > 0 ? {t: 'Resting, ' + p.resting + (p.resting > 1 ? ' seasons' : ' season') + (p.restWhy === 'ransom' ? ' (after the ransom)' : ''), c: '#9a6a12'} : inj(p) ? {t: 'Wounded', c: '#8b0000'} : {t: 'Ready', c: '#2e6b2e'};
  const fname = id => { try { return facility(id).name; } catch (e) { return id; } };
  const qOf = p => (typeof CAMP !== "undefined" && CAMP.people || []).find(x => x.p === p);
  const detOf = p => { try { return (META.detachments || []).find(d => d.id === p.away); } catch (e) { return null; } };
  C31.activity = function(p, extra){
    const q = qOf(p), det = p.away && p.away !== "captive" ? detOf(p) : null, c = det && det.contract;
    let role = null; try { role = q ? (q.role || personRole(q)) : null; } catch (e) {}
    if (!role) role = p.resting > 0 ? (p.trainingAt ? "train" : "rest") : "wander";
    try { if (typeof STORY !== "undefined" && STORY && typeof STORY.activityLine === "function"){ const s = STORY.activityLine(p, {state: p.away === "captive" ? "captive" : p.away ? "away" : p.resting > 0 ? "resting" : inj(p) ? "wounded" : "ready", role: role, facility: role === "rest" ? (has("hospital") ? "hospital" : "tents") : p.trainingAt, place: c && (c.town || c.place), obj: c && c.obj, has: has, salt: (META.deployments || 0) + (extra || 0)}); if (s) return String(s); } } catch (e) {}
    if (p.away === "captive") return "Held captive";
    if (p.away){ const dest = c && (c.town || c.place); return (c && c.obj === "escort" ? "Escorting" : "Out on a detachment") + (dest ? (c && c.obj === "escort" ? " to " : ", near ") + dest : ""); }
    const k = typeof p.id === "number" ? p.id : 3;
    if (role === "train" && p.trainingAt) return "Training at the " + fname(p.trainingAt) ;
    if (role === "rest") return has("hospital") ? "Mending at the Hospital" : has("tents") ? "Resting in the tents" : "Resting by the fire";
    if (role === "spar") return "Sparring at the " + (has("training") ? fname("training") : fname("barracks"));
    const opts = ["Sitting by the campfire"]; if (has("tavern")) opts.push("Drinking at the tavern"); if (has("kitchen")) opts.push("Eating at the Kitchen");
    return opts[k % opts.length];
  };
  C31.pick = function(i){ BK.sel = i; try { SFX.play('pick'); } catch (e) {} renderRoster(); };
  C31.fit = function(sq){ try { if (typeof ARM !== "undefined" && ARM.ui) ARM.ui.sq = sq; } catch (e) {} renderTitle(); openCamp(); };
  C31.hire = function(){ renderTitle(); centreCamOn(HUB.fire.x, HUB.fire.y); openPanel('fire', 'fire'); };
  function detailHTML(e){
    if (!e) return '<div class="sub" style="padding:20px">Click a line to see a person\'s gear and details.</div>';
    const p = e.p, st = C31.statusOf(p);
    let h = '<div style="display:flex;gap:12px;align-items:center">' + img(portraitURL(p, false), 'ic') + '<div><div class="ttl" style="font-size:22px">' + esc(p.name) + '</div><div class="role">' + esc(RACES[p.race].name + ' ' + CLASSES[p.cls].name + ' ' + SPECS[p.spec].name) + '</div><div style="font-weight:bold;color:' + st.c + '">' + st.t + '</div><div class="desc">' + esc((BK.acts && BK.acts[BK.sel]) || C31.activity(p)) + '</div></div></div>';
    if (e.sq != null) h += C31.leadLine(p);   /* K90: the Leader's and officers' level, XP and Talents */
    if (e.sq != null && typeof ARM !== "undefined" && typeof gearCardHTML === 'function'){
      const lo = ARM.loadoutOf(p, META), ids = ARM.ids(lo);
      h += '<h2 class="sec" style="font-size:18px">Gear</h2><div class="row gdeck">' + (ids.map(id => { const x = gear(id); return x ? '<div class="aq-card">' + gearCardHTML(x, {mini: true, eq: true}) + '</div>' : ''; }).join('') || '<div class="sub">Nothing fitted.</div>') + '</div>' +
        '<div style="margin-top:8px"><button class="btn small" type="button" onclick="CAMP31.fit(' + e.sq + ')">FIT GEAR AT THE ARMOURY</button></div>';
    } else if (e.kind === 'Mate'){
      const i = e.i, prom = has('command') && p.adv >= 2 ? '<button ' + (canPromote(p) && META.treasury >= 100 ? '' : 'disabled') + ' onclick="promoteOfficer(' + p.id + ')">Promote to officer (100gp)</button>' : '';
      h += '<div class="sub" style="margin-top:8px">' + esc(mateLine(p)) + '</div><div class="desc">Advancements ' + p.adv + ' / ' + advCap() + (p.kills ? ' \u00b7 ' + p.kills + ' slain' : '') + '</div>' +
        '<div class="mini" style="margin-top:8px">' + prom + (canRetire(p) ? '<button onclick="RET=' + i + ';C31.old()">Retire to camp</button>' : '') + '<button onclick="releaseMate(' + i + ')">Release</button></div>' +
        '<div class="sub">Reserve mates draw from the company stores when they deploy; officers and the Leader are fitted at the Armoury.</div>';
    }
    return h;
  }
  C31.leadLine = function(p){
    const t = (p.picks || []).map(id => { try { return (CARDS.find(c => c.id === id) || {}).name; } catch (e) { return ''; } }).filter(Boolean).join(', ') || 'none yet';
    return '<div class="desc" data-k90="lead" style="margin-top:8px">Level ' + (p.level | 0) + ' ' + esc(SPECS[p.spec].name) + ' \u00b7 ' + (p.ticks | 0) + ' XP (3 make a level)</div><div class="desc" style="color:#5a4a2a"><b>Talents:</b> ' + esc(t) + '</div>';
  };
  C31.old = function(){ if (C31.oldRoster) C31.oldRoster(); };
  function barracksHTML(){
    const L = people(); const e = BK.sel != null ? L[BK.sel] : null;
    const used = new Set(), acts = L.map((x, i) => { let a = C31.activity(x.p, i), t = 0; while (used.has(a) && t < 12) a = C31.activity(x.p, i + 11 * ++t); used.add(a); return a; }); BK.acts = acts;
    const rows = L.map((x, i) => { const p = x.p, st = C31.statusOf(p);
      return '<button type="button" class="c31-line' + (i === BK.sel ? ' on' : '') + '" onclick="CAMP31.pick(' + i + ')">' + img(portraitURL(p, true), 'ic sm') +
        '<span class="c31-nm"><b>' + esc(p.name) + '</b><small>' + esc((x.kind === 'Mate' ? '' : x.kind + ' \u00b7 ') + CLASSES[p.cls].name) + '</small></span>' +
        '<span class="c31-st" style="color:' + st.c + '">' + st.t + '</span><span class="c31-act">' + esc(acts[i]) + '</span></button>'; }).join('');
    return '<div style="display:flex;align-items:center;gap:12px;align-self:stretch"><h1 style="font-size:36px;flex:1;margin:0;text-align:left">Barracks <small style="font-size:16px">\u2014 kept by the Chapter Master</small></h1>' +
      '<button class="btn small" type="button" style="margin:0" onclick="CAMP31.hire()">HIRE</button><button class="btn small" type="button" style="margin:0" onclick="CAMP31.old()">RECORDS</button><button class="btn small" type="button" style="margin:0" onclick="renderTitle()">BACK</button></div>' +
      '<div class="money" style="align-self:flex-start">' + (META.roster || []).length + ' / ' + rosterCap() + ' mates</div>' +
      '<div class="c31-col">' + (typeof advLeft === 'function' && advLeft() > 0 && typeof advanceBlock === 'function' ? advanceBlock() : '') +
      '<div class="c31-bk"><div class="c31-list">' + rows + '</div><div class="c31-detail">' + detailHTML(e) + '</div></div></div>';
  }

  /* ---- install: runs last, so it wraps every other top-bar change ---- */
  function install(){
    if (window.__c31ready || typeof renderTopbar !== 'function') return;
    css();
    const prev = renderTopbar;
    renderTopbar = function(){
      prev.apply(this, arguments);
      try {
        const tb = $i('topbar'); if (!tb || !inCamp() || !META.founded && !META.leader) return;
        closeMenu(); watch();
        const ep = tb.querySelector('button[onclick*="openEpilogue"]');
        tb.innerHTML = barHTML() + (ep ? ep.outerHTML : '');
      } catch (e) { console.error('CAMP31', e); }
    };
    const wrap = (name, fn) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function(){ const r = f.apply(this, arguments); try { fn.apply(null, arguments); } catch (e) {} return r; }; };
    wrap('openTable', () => { S().board = boardSig(); renderTopbar();
      addMap(); });
    wrap('renderTable', () => { addMap(); });
    C31.oldRoster = window.renderRoster;
    window.renderRoster = function(){ const ri = $i('roster-inner'); if (!META || !META.leader || !ri || (META.cp && META.cp.part === 'road')) return C31.oldRoster.apply(this, arguments);   /* L4: no Barracks on the road; the plain roster draws each mate's card */ ri.innerHTML = barracksHTML(); };
    wrap('openRoster', () => { const s = S(); s.back = []; s.hire = hireSig(); renderTopbar(); });
    wrap('openChronicle', () => { S().chron = chronSeq(); renderTopbar(); });
    wrap('openCamp', () => { renderTopbar(); });
    wrap('tickBuilds', () => { try { const s = S(); (window.__c31pre || []).forEach(id => { if (!(META.build && META.build[id]) && has(id) && s.built.indexOf(facility(id).name) < 0) s.built.push(facility(id).name); }); } catch (e) {} renderTopbar(); });
    { const tb0 = window.tickBuilds; window.tickBuilds = function(){ window.__c31pre = Object.keys((typeof META !== "undefined" && META && META.build) || {}); return tb0.apply(this, arguments); }; }
    wrap('openPanel', (kind, id) => { if (kind === 'fire'){ S().hire = hireSig(); renderTopbar(); } else if (kind === 'plot' || kind === 'building' || kind === 'site'){ const s = S(); if (s.built.length){ s.built = []; renderTopbar(); } } });
    // K65: the plot panel lists every building; bring the one chosen on the Build screen into view (phones)
    wrap('openPanel', (kind) => { if (kind !== 'plot') return; setTimeout(() => { try { const f = B4.pick && facility(B4.pick); if (!f) return;
      const b = [...document.querySelectorAll('.line .grow > b')].find(x => x.textContent === f.name && x.offsetParent); const ln = b && b.closest('.line'); if (!ln) return;
      ln.style.outline = '3px solid var(--gold-bright, #d4af37)'; ln.scrollIntoView({block: 'center'}); } catch (e) {} }, 60); });
    setInterval(() => { try { if (typeof META === "undefined" || !META || !META.leader) return; const b = JSON.stringify([C31.needs(), mates().map(p => (p.resting > 0 ? 1 : 0) + (p.away ? 2 : 0))]); watch(); if (b !== C31.__b){ C31.__b = b; if (!(typeof inStoryNow === 'function' && inStoryNow())) renderTopbar(); } refresh(); } catch (e) {} }, 250);
    /* INT-1 stage 3 group 4: the plot panel's 'You chose' line is folded into plotPanelHTML (js/camp/qol.js), reading CAMP31.build.pick */
    window.__c31ready = true;
    try { renderTopbar(); } catch (e) {}
  }

  /* ---- F-31.4 the Build screen: the trade first (cost, time, upkeep, links), then "Choose a plot" ---- */
  const WORKS = {   // small table of links: F-24 gear, F-29 camp links, F-30 hold the gate
    armoury: 'holds the deck of gear cards; the squad also starts with +1 Ward Token.',
    merchant: 'spare gear cards sell here for half price (a quarter at the Quartermaster without it).',
    blacksmith: 'unlocks metal armour and Heavy Greatswords in the Quartermaster.',
    carpentry: 'unlocks Longbows, Pikes and Crossbows.',
    leather: 'unlocks Studded Brigandine; light armour costs 20% less.',
    engineering: 'unlocks Stake Lines, Sharpers and the Sapper Satchel.',
    stables: 'unlocks Mount cards (one horse per squad).',
    training: 'a veteran mentor here makes the next build cheaper.',
    chapel: 'the vigil for the fallen needs a Chapel.',
    cells: 'prisoner exchange and interrogation leads use the cells.',
    hospital: 'resting mates lie here; injury checks shift up one step.',
    palisade: 'raiders must come through the gates when a raid hits the camp.',
    watchtower: 'four archer towers shoot raiders in range.',
    command: 'officers are promoted and trained here.'
  };
  const B4 = C31.build = {open: false, pick: null};
  const facUp = f => !STAFF_REQ.includes(f.id) ? 'No upkeep' : (typeof VETERANS !== 'undefined' && VETERANS[f.id] ? UPKEEP_EACH + 'gp a contract when staffed; nothing with a veteran' : UPKEEP_EACH + 'gp a contract when staffed');
  function plotsFree(f){ try { return !!curLayout().plots[f.id]; } catch (e) { return true; } }
  C31.buildRows = function(){
    const out = [];
    for (const f of FACILITIES){
      if (!f || !plotsFree(f)) continue;
      const built = has(f.id), going = !built && inBuild(f.id), need = f.req && !has(f.req) ? facility(f.req) : null, cost = facCost(f);
      const state = built ? 'built' : going ? 'going' : need ? 'locked' : META.treasury < cost ? 'short' : 'ready';
      out.push({f, state, cost, sn: buildSeasons(f), need, up: facUp(f), works: WORKS[f.id] || '', vet: (typeof VETERANS !== 'undefined' && VETERANS[f.id]) ? VETERANS[f.id].text : ''});
    }
    const grp = r => r.state === 'going' ? 0 : r.state === 'built' ? 2 : 1, cats = [...new Set(FACILITIES.map(f => f.cat))];
    return out.sort((a, b) => grp(a) - grp(b) || (grp(a) === 1 ? cats.indexOf(a.f.cat) - cats.indexOf(b.f.cat) : 0));
  };
  /* SW-7: the groups fold. Each opens with a count; on opening the Build screen every group is shut except Under way, so the list is a short set of headers; a click on a header flips it and the choice holds until the screen is opened again */
  const grpOf = r => r.state === 'going' ? 'Under way' : r.state === 'built' ? 'Built' : r.f.cat;
  C31.fold = function(g){ if (!B4.shut) return; B4.shut[g] = !B4.shut[g]; const o = $i('c31-build'); if (!o) return; const l = o.querySelector('.c31b-list'), t = l ? l.scrollTop : 0; o.innerHTML = buildHTML(); const l2 = o.querySelector('.c31b-list'); if (l2) l2.scrollTop = t; };
  function buildHTML(all){
    const rows = C31.buildRows();
    const n = {}; for (const r of rows){ const k = grpOf(r); n[k] = (n[k] || 0) + 1; }
    if (!B4.shut){ B4.shut = {}; for (const r of rows){ const k = grpOf(r); B4.shut[k] = k !== 'Under way'; } }
    let h = '<div class="c31b-head"><b>Build</b><span>Treasury <b>' + META.treasury + 'gp</b></span><span class="grow"></span><button type="button" class="btn small" onclick="CAMP31.closeBuild()">Close</button></div>' +
      '<div class="c31b-note">Builders raise a building over seasons (one passes with every contract). Change your mind before the next contract and every coin comes back. Click a section to open it.</div><div class="c31b-list">';
    let lastGrp = null;
    for (const r of rows){
      const grp = grpOf(r), shut = !all && B4.shut[grp]; if (grp !== lastGrp){ h += '<h3 class="c31b-grp"><button type="button" aria-expanded="' + !shut + '" style="all:unset;cursor:pointer;display:block;width:100%" onclick="CAMP31.fold(' + JSON.stringify(grp).replace(/"/g, '&quot;') + ')">' + (shut ? '▸ ' : '▾ ') + esc(grp) + ' <small>(' + n[grp] + ')</small></button></h3>'; lastGrp = grp; } if (shut) continue;
      const f = r.f, tag = {built: 'Built', going: inBuild(f.id) ? 'Under way: ' + leftText(f.id) : '', locked: 'Needs the ' + (r.need ? r.need.name : '') + (r.need && inBuild(r.need.id) ? ' (being built)' : ''), short: 'Needs ' + (r.cost - META.treasury) + 'gp more', ready: ''}[r.state];
      const fixed = FIXED_SITE.has(f.id);
      const btn = r.state === 'ready' ? '<button type="button" class="btn small c31b-go" onclick="CAMP31.choose(\'' + f.id + '\')">' + (fixed ? 'Build at the gate' : 'Choose a plot') + '</button>' :
        r.state === 'going' ? '<button type="button" class="btn small" onclick="CAMP31.showSite(\'' + f.id + '\')">See the works</button>' : '';
      h += '<div class="c31b-row ' + r.state + '"><img src="' + buildingURL(f.id) + '" alt=""><div class="c31b-mid"><b>' + esc(f.name) + '</b> <small>' + esc(f.cat) + '</small><div class="c31b-desc">' + esc(f.desc) + '</div>' +
        (r.works ? '<div class="c31b-works"><b>Works with:</b> ' + esc(r.works) + '</div>' : '') + (r.vet && STAFF_REQ.includes(f.id) ? '<div class="c31b-works"><b>Veteran staff:</b> ' + esc(r.vet) + '</div>' : '') + '</div>' +
        '<div class="c31b-num"><span><b>' + r.cost + 'gp</b></span><span>' + plural(r.sn, 'season') + '</span><span class="u">' + esc(r.up) + '</span>' + (tag ? '<span class="t">' + esc(tag) + '</span>' : '') + '</div><div class="c31b-act">' + btn + '</div></div>';
    }
    return h + '</div>';
  }
  C31.openBuild = function(){
    let o = $i('c31-build'); if (!o){ o = document.createElement('div'); o.id = 'c31-build'; document.body.appendChild(o); }
    B4.shut = null; o.innerHTML = buildHTML(); o.style.display = 'flex'; B4.open = true;
  };
  C31.closeBuild = function(){ const o = $i('c31-build'); if (o) o.style.display = 'none'; B4.open = false; };
  C31.choose = function(fid){
    const f = facility(fid); if (!f) return;
    C31.closeBuild(); B4.pick = fid;
    if (FIXED_SITE.has(fid)){ const o = typeof campObjects === 'function' && campObjects().find(x => x.kind === 'plot' && x.id === fid); if (o) centreCamOn(o.x, o.y); openPanel('plot', fid); return; }
    const o = typeof nearestPlot === 'function' && nearestPlot();
    if (o){ centreCamOn(o.x, o.y); openPanel('plot', o.id); if (typeof campNote === 'function') campNote('Choose a plot, then press Build on the ' + f.name + '.'); }
    else if (typeof campNote === 'function') campNote('No empty plot is free. Click a plot in the camp when one opens.');
  };
  C31.showSite = function(fid){ C31.closeBuild(); try { openPanel('site', fid); } catch (e) {} };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && B4.open) C31.closeBuild(); });

  C31.selfTest = function(){
    const fails = [], ck = (ok, m) => { if (!ok) fails.push(m); };
    ck(typeof C31.needs === 'function' && Array.isArray(C31.needs()), 'needs() is not a list');
    ck(!!document.getElementById('c31-style'), 'style missing');
    if (typeof META !== "undefined" && META && META.leader){
      const s = S(), keep = JSON.stringify(s), b0 = META.board;
      try {
        s.chron = -1; ck(C31.needs().some(n => n.word === 'chronicle'), 'new Chronicle entry gives no "!"');
        s.chron = chronSeq(); ck(!C31.needs().some(n => n.word === 'chronicle'), '"!" stays after seen');
        s.board = 'x'; if (META.board) ck(C31.needs().some(n => n.word === 'table'), 'new contracts give no "!"');
        s.built = ['Test hall']; ck(C31.needs().some(n => n.word === 'build'), 'finished works give no "!"');
        const m0 = mates().find(p => p && p.name && !p.dead);
        if (m0){ s.back = [m0.name]; ck(C31.needs().some(n => n.word === 'barracks'), 'a mate back gives no "!"'); }
        s.back = ['Nobody Living']; ck(!C31.needs().some(n => n.word === 'barracks' && n.short === 'Back from rest'), 'K62: a dead or gone mate is still "back in camp"');
      } finally { META.c31 = JSON.parse(keep); META.board = b0; }
      const h = barHTML();
      ck(/War Table/.test(h) && /Build/.test(h) && /Armoury/.test(h) && /Barracks/.test(h) && /Chronicle/.test(h) && /Menu/.test(h), 'a word is missing from the bar');
      ck(!/Dust Cloaks/.test(h), 'the game title is still on the bar');
    }
    if (typeof META !== "undefined" && META && META.leader){
      try { const h = barracksHTML(), n = 1 + (META.officers || []).filter(Boolean).length + (META.roster || []).length;
        ck((h.match(/class="c31-line/g) || []).length >= n, "Barracks lacks a line per person"); ck(/kept by the Chapter Master/.test(h) && />HIRE</.test(h), "Barracks header or HIRE missing");
        ck(people().every(x => C31.activity(x.p) && C31.statusOf(x.p).t), "a person has no status or activity line"); } catch (e) { fails.push("Barracks threw: " + e.message); }
    }
    try { const rows = C31.buildRows(); ck(rows.length >= 18, 'Build lists the facilities'); ck(rows.every(r => r.cost >= 0 && r.sn >= 1 && r.up), 'a row lacks cost, time or upkeep');
      B4.shut = null; { const h0 = buildHTML(), h1 = buildHTML(true); ck((h0.match(/c31b-grp/g) || []).length >= 3 && (h0.match(/c31b-row/g) || []).length < (h1.match(/c31b-row/g) || []).length, 'SW-7: the Build groups open shut with a header each'); B4.shut = null; } const h = buildHTML(true); ck(/Choose a plot/.test(h) || !rows.some(r => r.state === 'ready'), 'no Choose a plot button'); ck(/Works with/.test(h), 'no Works with line'); ck(/gp a contract when staffed/.test(h), 'no upkeep line'); } catch (e) { fails.push('Build screen threw: ' + e.message); }
    return {ok: !fails.length, fails: fails};
  };
  window.addEventListener('load', () => setTimeout(install, 0));
})();
