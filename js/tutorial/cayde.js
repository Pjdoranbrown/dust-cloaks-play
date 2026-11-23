/* js/tutorial/cayde.js (INT-1 stage 1, 2026-11-16): Cayde as the guide and first Chapter Master (CG1, F-02).
   Was js/cayde-guide.js, moved unchanged. Classic script; the globals keep their names. */
/* ============================================================================
   INDEX CG1 - CAYDE AS THE GUIDE AND FIRST CHAPTER MASTER (F-02)
   On a new guided game nobody picks a hero for the chair: Cayde Hallinan holds
   it, speaks the founding steps in the Bard's place, explains elevation at the
   first camp, and says goodbye when the player elevates a successor. A small
   button on the chair step, "I know who I'm putting in the chair", goes straight
   to Build your own with a one-line farewell; after it Cayde never guides again.
   Lines: audits/cayde-guide-lines.md (Narrative, 2026-11-10), used verbatim.
   Load after js/story.js and js/ux.js (it wraps their renderFound), so it sits
   last in the script list. Old saves, the story prologue and later chapters are
   untouched: everything keys off FD.guided and META.caydeGuide.
   Saves: META.caydeGuide = 'guide' | 'skipped' | 'done' (absent on old saves),
   META.caydeSeen = {b1, b2, b3, hint}. The game ignores both when the file is gone.
   ROLLBACK: delete the file and its script tag.
============================================================================ */
(function(){
  'use strict';
  const HINT_DELAY_MS = 90000;            // the one nudge, if the player waits on the first camp screen
  const FLAG = 'caydeGuide', SEEN = 'caydeSeen', HERO = 'cayde';
  const CAYDE_NAME = 'Cayde Hallinan', CAYDE_ROLE = 'holding the chair for now';
  const SKIP_LABEL = "I know who I'm putting in the chair";
  const L = {
    beat1: ['Cayde Hallinan. I am told I am the one who sits in the chair, until you have somebody better.',
            'Dunmorrow is where I would rather be. Artemis has work for me there. But somebody has to start this, and I have done worse jobs.',
            'I will show you how a chapter runs. Then you will find someone who can run it, and I will go home.'],
    beat2: ['This is your camp. Your Squad Leader marches with the squad and fights. The Chapter Master stays here, keeps the books, and haggles.',
            'Sooner or later one of your squad will be able to do my job. A Squad Mate with two or more Advancements, or an officer you have promoted at the Command Tent, will do.',
            'Open the Chapter Master\'s panel and elevate them. I step down, sit on the council as an Elder, and leave you a hundred gold for your trouble.',
            'No hurry. I will sit here until you are ready.'],
    beat3: ['There. The chair has someone in it who has earned it, which is more than I could say for me.',
            'I leave you a hundred gold and a seat at the council fire. Do not let the Council\'s dues slip, or they will remember.',
            'If the road goes bad, send word to Dunmorrow. I will probably hear of it first.',
            'Good luck, Leader. Keep your people alive.'],
    skip:  ['You have someone already. Good. Then I am only in your way. Keep the Council\'s dues paid, and send word when the road turns.',
            'Brought your own, have you? Fair. I would rather ride home than argue with a chair. Mind the books, and mind the dues.'],
    hint:  'Take your time. When you are ready to hand me my hat, the Chapter Master\'s panel is the place.',
    chair: 'Now the chair. The Chapter Master runs the camp and does the haggling, and never marches. I will warm it for now. When one of your own is ready, I step down to the council. Or build your own.'
  };
  const geval = (0, eval);              // indirect eval: the global scope, so top-level let and const are seen and nothing local shadows them
  const has = n => { try { return typeof window[n] !== 'undefined' || geval('typeof ' + n) !== 'undefined'; } catch (e) { return false; } };
  const G = n => { try { return window[n] !== undefined ? window[n] : geval(n); } catch (e) { return undefined; } };
  const safe = (what, fn) => { try { return fn(); } catch (e) { try { console.warn('cayde-guide ' + what, e); } catch (x) {} } };
  const esc = s => has('esc') ? G('esc')(s) : String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const meta = () => has('META') ? G('META') : null;
  const fd = () => has('FD') ? G('FD') : null;
  const guided = () => { const F = fd(); return !!(F && F.guided); };
  const skipped = () => { const F = fd(); return !!(F && F.cgSkip); };
  const seen = k => { const M = meta(); return !!(M && M[SEEN] && M[SEEN][k]); };
  const save = () => { if (window.SELFTEST) return; if (has('saveMeta')) G('saveMeta')(); };   /* the harness marks beats on a fresh page: never write the real slot under it */
  const mark = k => { const M = meta(); if (!M) return; (M[SEEN] = M[SEEN] || {})[k] = 1; save(); };
  const flag = () => { const M = meta(); return M ? M[FLAG] : undefined; };
  const setFlag = v => { const M = meta(); if (!M) return; M[FLAG] = v; save(); };
  const portrait = () => { const HP = has('HERO_PORT') ? G('HERO_PORT') : null; if (HP && HP[HERO]) return HP[HERO]; return has('heroPortraitURL') ? safe('portrait', () => G('heroPortraitURL')(HERO)) || '' : ''; };
  const paras = lines => lines.map(t => `<p>${esc(t)}</p>`).join('');
  const missing = [];
  for (const n of ['FD', 'META', 'HEROES', 'heroStepHTML', 'heroPick', 'heroCustom', 'renderFound', 'finishFound', 'renderTitle', 'elevateTo', 'saveMeta', '$']) if (!has(n)) missing.push(n);
  if (missing.length) try { console.warn('cayde-guide: missing ' + missing.join(', ') + '; those stages are off'); } catch (e) {}

  /* ---- look: the guide box in Cayde's name, the chair card, the camp speech box ---- */
  document.head.appendChild(Object.assign(document.createElement('style'), {id: 'cg-css', textContent: `
    .cg-card{width:300px;max-width:100%;box-sizing:border-box;margin:6px auto 4px;background:rgba(245,235,215,.8);border:2px solid #6a5a44;border-radius:4px;padding:12px 10px 10px;text-align:center}
    .cg-card img{height:210px;max-width:100%;border:3px solid #b8963a;box-shadow:0 0 0 2px #5a4318,0 3px 10px rgba(0,0,0,.45);display:block;margin:0 auto 10px}
    .cg-card .hn{font:bold 21px Georgia;color:var(--ink)} .cg-card .ht{font:italic 14px Georgia;color:var(--blood);margin:1px 0 6px} .cg-card .hr{font:14px Georgia;color:var(--ink-soft)}
    .cg-lore{width:100%;max-width:640px;box-sizing:border-box;margin:6px auto 4px;padding:10px 16px;background:rgba(255,250,235,.75);border:1px solid #8a6a3a;border-radius:4px;text-align:left;font-size:14px;line-height:1.4}
    .cg-lore p{margin:3px 0} .cg-lore .hl{font-style:italic;color:#3a3226} .cg-lore b{color:var(--blood)}
    .cg-go{margin:6px 0 2px;width:100%;text-align:center}
    .cg-skipwrap{margin-top:14px;width:100%;text-align:center}
    .cg-skip{background:none;border:1px solid #8a7a5e;border-radius:3px;color:#6a5a44;font:14px Georgia;padding:4px 12px;cursor:pointer;opacity:.85}
    .cg-skip:hover{opacity:1;border-color:var(--blood);color:var(--blood)}
    .cg-box{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);width:560px;max-width:calc(100vw - 24px);box-sizing:border-box;z-index:15;display:flex;gap:12px;align-items:flex-start;
      background:#f3ead8;border:2px solid var(--ink-soft);border-radius:6px;padding:10px 12px;box-shadow:0 6px 18px rgba(0,0,0,.45);color:var(--ink);text-align:left}
    .cg-box img{height:96px;flex:none;border:3px double var(--ink-soft)}
    .cg-box .gname{font:bold 14px Georgia;color:var(--blood);margin-bottom:3px}
    .cg-box .speech{position:static;background:none;border:0;padding:0;margin:0;font-style:italic;font-size:14.5px;line-height:1.4}
    .cg-box .speech p{margin:0 0 6px}
    .cg-close{position:absolute;top:4px;right:6px;background:none;border:0;color:var(--blood);font:bold 16px Georgia;cursor:pointer}
    @media (max-width:520px){.cg-box{flex-direction:column;bottom:8px} .cg-box img{height:72px} .cg-card img{height:170px}}
  `}));

  /* ---- Stage 1: the chair step shows Cayde only, plus the small skip button ---- */
  if (has('heroStepHTML') && has('HEROES')){
    const f = G('heroStepHTML');
    window.heroStepHTML = function(){
      if (!guided() || skipped()) return f.apply(this, arguments);
      return safe('hero step', () => {
        const H = G('HEROES')[HERO], note = has('legNoteHTML') ? G('legNoteHTML')() : '';
        const R = G('RACES'), C = G('CLASSES'), S = G('SPECS'), CMB = G('CM_BONUS');
        const circle = has('heroCircle') ? G('heroCircle')(H) : '';
        return note + `<div class="cg-card"><img src="${portrait()}" alt=""><div class="hn">${esc(H.full)}</div><div class="ht">${esc(H.title)}</div>
          <div class="hr">${R[H.race].name} ${C[H.cls].name}, once a ${S[H.spec].name}</div></div>
          <div class="cg-lore"><p class="hl">${esc(H.lore)}</p><p><b>Camp bonus:</b> ${H.cls === 'EDELOS' && typeof cmGame === 'function' ? cmGame(H.cls, {hero: HERO}) : CMB[H.cls].game}</p>${circle ? `<p><b>Patrons' circle:</b> ${circle}.</p>` : ''}</div>
          <div class="cg-go"><button class="btn gold" onclick="heroPick('${HERO}')">CAYDE TAKES THE CHAIR</button></div>
          <div class="cg-skipwrap"><button class="cg-skip" onclick="CAYDE_GUIDE.skip()">${esc(SKIP_LABEL)}</button></div>`;
      }) || f.apply(this, arguments);
    };
    try { heroStepHTML = window.heroStepHTML; } catch (e) {}
  }
  function skip(){
    const F = fd(); if (!F) return;
    F.cgSkip = true; F.cgSkipSay = true;
    if (has('heroCustom')) G('heroCustom')();
  }

  /* ---- Stage 2: Cayde's voice on the founding screens ---- */
  // the guide box (.gbard) is built by const functions in index.html, so it is reworded after each render
  function speakAs(box, name, role){
    const img = box.querySelector('img'), nm = box.querySelector('.gname');
    if (img){ const u = portrait(); if (u) img.src = u; }
    if (nm) nm.textContent = name + ', ' + role;
  }
  function voice(){
    const F = fd(), h = has('$') ? G('$')('create-inner') : null; if (!h) return;
    const box = h.querySelector('.gbard'); if (!box) return;
    const sp = box.querySelector('.speech'); if (!sp) return;
    if (F && F.guided && F.cgSkip){
      if (F.cgSkipSay){ F.cgSkipSay = false; speakAs(box, CAYDE_NAME, 'riding home'); sp.textContent = L.skip[Math.random() < 0.5 ? 0 : 1]; }
      return;                                   // after the skip reply the Bard has the floor again
    }
    if (!(F && F.guided) && !(G('GUIDE') && G('GUIDE').on)) return;
    speakAs(box, CAYDE_NAME, CAYDE_ROLE);
    if (F && F.step === 'hero') sp.textContent = L.chair;
  }
  if (has('renderFound')){
    const f = G('renderFound');
    window.renderFound = function(){ const r = f.apply(this, arguments); safe('voice', voice); return r; };
    try { renderFound = window.renderFound; } catch (e) {}
  }
  if (has('renderCreate')){
    const f = G('renderCreate');
    window.renderCreate = function(){ const r = f.apply(this, arguments); safe('voice', () => { if (G('GUIDE') && G('GUIDE').on && !fd()) voice(); }); return r; };
    try { renderCreate = window.renderCreate; } catch (e) {}
  }
  // beat 1 on the founding intro screen (the first guided screen), in place of the Bard's opening line
  if (has('guideIntro')){
    const f = G('guideIntro');
    window.guideIntro = function(){
      const r = f.apply(this, arguments);
      safe('beat 1', () => {
        const h = G('$')('create-inner'), box = h && h.querySelector('.gbard'), sp = box && box.querySelector('.speech'); if (!sp) return;
        speakAs(box, CAYDE_NAME, CAYDE_ROLE); sp.innerHTML = paras(L.beat1);
      });
      return r;
    };
    try { guideIntro = window.guideIntro; } catch (e) {}
  }

  /* ---- the camp speech box: one box, a close button, nothing stacks on it ---- */
  let hintTimer = null;
  function box(lines, role, onClose){
    closeBox();
    const d = document.createElement('div'); d.className = 'cg-box'; d.id = 'cg-box';
    d.innerHTML = `<img src="${portrait()}" alt=""><div><div class="gname">${esc(CAYDE_NAME)}, ${esc(role)}</div><div class="speech">${paras(lines)}</div></div><button class="cg-close" title="Close" aria-label="Close">×</button>`;
    d.querySelector('.cg-close').onclick = () => { closeBox(); if (onClose) safe('box close', onClose); };
    document.body.appendChild(d);
    return d;
  }
  function closeBox(){ const d = document.getElementById('cg-box'); if (d) d.remove(); }
  function screenOpen(){ const S = G('SCREENS') || []; const $ = G('$'); return S.some(id => { const e = $ && $(id); return e && !e.classList.contains('hidden'); }); }

  /* ---- the save flag: set when a guided founding finishes ---- */
  if (has('finishFound')){
    const f = G('finishFound');
    window.finishFound = function(){
      const F = fd(), M = meta();
      if (F && F.guided && M){ if (F.cgSkip) M[FLAG] = 'skipped'; else if (F.hero === HERO) M[FLAG] = 'guide'; }
      return f.apply(this, arguments);
    };
    try { finishFound = window.finishFound; } catch (e) {}
  }

  /* ---- Stage 2, beat 2: the first camp screen; the hint if the player waits ---- */
  function campBeat(){
    const M = meta(); if (!M || M[FLAG] !== 'guide' || !(M.master && M.master.hero === HERO) || seen('b2')) return;
    if (has('inStoryNow') && G('inStoryNow')()) return;
    mark('b2');
    box(L.beat2, CAYDE_ROLE, armHint);
    armHint();
  }
  function armHint(){
    if (hintTimer) clearTimeout(hintTimer);
    if (seen('hint')) return;
    hintTimer = setTimeout(() => {
      hintTimer = null;
      const M = meta(), CAMP = G('CAMP');
      if (!M || M[FLAG] !== 'guide' || seen('hint') || screenOpen() || (CAMP && CAMP.panel) || document.getElementById('cg-box')) return;
      mark('hint'); box([L.hint], CAYDE_ROLE);
    }, HINT_DELAY_MS);
  }
  if (has('renderTitle')){
    const f = G('renderTitle');
    window.renderTitle = function(){ const r = f.apply(this, arguments); safe('beat 2', campBeat); return r; };
    try { renderTitle = window.renderTitle; } catch (e) {}
  }
  if (has('openPanel')){
    const f = G('openPanel');
    window.openPanel = function(){ if (hintTimer){ clearTimeout(hintTimer); hintTimer = null; } return f.apply(this, arguments); };
    try { openPanel = window.openPanel; } catch (e) {}
  }

  /* ---- Stage 3: the handover, after the real elevation (never on the confirm pass) ---- */
  if (has('elevateTo')){
    const f = G('elevateTo');
    window.elevateTo = function(){
      const M = meta(), before = M ? M.elder : null;
      const r = f.apply(this, arguments);
      safe('beat 3', () => {
        if (!M || M[FLAG] !== 'guide' || !M.elder || M.elder === before || M.elder.hero !== HERO || seen('b3')) return;
        if (hintTimer){ clearTimeout(hintTimer); hintTimer = null; }
        mark('b3'); setFlag('done');
        box(L.beat3, 'riding home to Dunmorrow');       // a fixed box over whatever screen elevateTo leaves open
      });
      return r;
    };
    try { elevateTo = window.elevateTo; } catch (e) {}
  }

  /* ---- the wording: the Manual's note (the chair step's own sub-line is replaced with the step) ---- */
  if (has('openManual')){
    const f = G('openManual');
    window.openManual = function(){
      const r = f.apply(this, arguments);
      safe('manual', () => { const p = document.querySelector('#manual-inner .idx45'); if (p) p.innerHTML = p.innerHTML.replace('A new Chapter starts with your Camp Bard, who walks you', 'A new Chapter starts with Cayde Hallinan, who walks you'); });
      return r;
    };
    try { openManual = window.openManual; } catch (e) {}
  }

  /* ---- self-test on stubs: never the real save ---- */
  function selfTest(){
    const rows = [], ok = (name, v) => rows.push({name, ok: !!v});
    const realFD = fd(), realMeta = meta(), realSave = window.saveMeta;
    window.saveMeta = function(){};                    // stubs only: nothing reaches the real save
    try {
      ok('CG1: no line contains an em dash', Object.keys(L).every(k => { const v = L[k], s = Array.isArray(v) ? v.join(' ') : (typeof v === 'string' ? v : ''); return !/—/.test(s); }));
      FD = {step: 'hero', guided: true, hero: null};
      const html = window.heroStepHTML();
      ok('CG1: the guided chair step shows Cayde only, plus the skip button', /CAYDE TAKES THE CHAIR/.test(html) && /cg-skip/.test(html) && !/Clarke|Krusk|Surprise/.test(html));
      FD = {step: 'hero', guided: false, hero: null};
      const plain = window.heroStepHTML();
      ok('CG1: the non-guided chair step offers Cayde, no Clarke, no skip button', /Cayde/.test(plain) && !/Clarke/.test(plain) && !/cg-skip/.test(plain));
      FD = {step: 'hero', guided: true, hero: null, cgSkip: true};
      ok('CG1: after the skip the chair step is the plain one', !/cg-skip/.test(window.heroStepHTML()) && !/Clarke/.test(window.heroStepHTML()));
      META = {caydeGuide: 'skipped', master: {hero: HERO}}; FD = null; campBeat(); ok('CG1: a skipped founding shows no camp beat', !document.getElementById('cg-box'));
      META = {master: {hero: HERO}}; campBeat(); ok('CG1: an old save (no flag) shows no camp beat', !document.getElementById('cg-box'));
      META = {caydeGuide: 'guide', master: {hero: HERO}}; campBeat();
      const once = !!document.getElementById('cg-box') && !!(META.caydeSeen && META.caydeSeen.b2); closeBox(); campBeat();
      ok('CG1: beat 2 fires once on a guided save with Cayde in the chair', once && !document.getElementById('cg-box'));
      if (hintTimer){ clearTimeout(hintTimer); hintTimer = null; }
      META = {caydeGuide: 'guide', master: {id: 'CM', hero: HERO}, elder: null};
      const before = META.elder; META.elder = {hero: HERO, name: 'Cayde'}; META.master = {id: 'CM', elevated: true};
      if (META[FLAG] === 'guide' && META.elder !== before && META.elder.hero === HERO && !seen('b3')){ mark('b3'); setFlag('done'); box(L.beat3, 'x'); }
      ok('CG1: guide becomes done on a Cayde elevation and beat 3 shows once', META[FLAG] === 'done' && !!document.getElementById('cg-box') && seen('b3')); closeBox();
      META = {caydeGuide: 'done', master: {id: 'CM'}, elder: {hero: HERO}}; ok('CG1: a done save shows nothing more', (campBeat(), !document.getElementById('cg-box')));
      ok('CG1: the wrappers are in place', [window.heroStepHTML, window.renderFound, window.finishFound, window.renderTitle, window.elevateTo].every(f => typeof f === 'function'));
    } catch (e) { rows.push({name: 'CG1: threw ' + e, ok: false}); }
    finally { FD = realFD; META = realMeta; window.saveMeta = realSave; closeBox(); if (hintTimer){ clearTimeout(hintTimer); hintTimer = null; } }
    const pass = rows.filter(r => r.ok).length;
    return {pass, fail: rows.length - pass, details: rows};
  }

  window.CAYDE_GUIDE = {skip, selfTest, lines: L, closeBox, campBeat, HINT_DELAY_MS};
})();
