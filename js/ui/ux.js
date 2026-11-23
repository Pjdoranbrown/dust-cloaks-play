/* ============================================================================
   INDEX 83 - UX QUICK WINS (from audits/ux.md)
   Loaded after the main game script in index.html. Wrap game functions the
   same way the Index sections do:  { const f = fn; fn = function(){ ... }; }
   Each change: a short note here (what, why) and a ROLLBACK line.

   UX-01  Settings: the title screen shows one SETTINGS button (the top-bar
          popover) instead of every control; the pause screen keeps Volume,
          Game speed, Momentum and Music and folds the rest under "More
          settings". The popover is grouped into Sound / Game / Display / Save.
   UX-02  First run (no Chapter yet): the prologue is the one gold button,
          "Skip the prologue: found a Chapter" is a small button under it.
   UX-04  Disabled primary buttons get a one-line reason under them; doctrine
          price buttons read "ADOPT · 100gp".
   UX-10  Prologue squad pick: icon chips with tooltips instead of
          "Con 6 · Mv 5 · M 2", a role word, and PICK A BALANCED FOUR.
   UX-11  Confirm dialogs for losing something (release, stand down, pull
          down, load over, start again, concede) get a red button with a verb,
          focus THINK AGAIN, and ENTER cancels ([1] confirms). STOP WORK on a
          construction site is an outlined secondary button.
   UX-12  campNote(msg, kind): kind 'good' / 'bad' / 'info' adds an icon and a
          coloured edge. Show tips again, Export save and Text size now say so.
   UX-13  Contract messages (bottom left) sit on a dark strip, 5 at most.
   UX-14  Below 1280px the top bar folds MANUAL / PORTRAITS / SETTINGS into a
          ☰ menu and the ledger chip shortens to "⚒ 2 · -40gp".
   UX-15  After 3 visits to the camp the hint strip shortens; ? shows the keys.
   UX-16  Construction bar: striped, labelled "Season k of N".
   UX-17  Visible keyboard focus everywhere; the volume and music pips are a
          focusable slider (arrow keys); custom checkboxes report their state.
   UX-18  Glyphs as well as colour: ▲ allied / ▼ hostile faction names, ✓ ~ ✗
          on dice faces.
   UX-19  While a Leader is being made (founding or prologue), the top bar
          shows only MANUAL and SETTINGS.
   G-UI-07 Builders' camp label: "Building the Tents" / "Dunstan · 1 season
          left · click for the site". Resting: "sits out the next contract".
   Gemini onboarding 3-5: a first-time Luck note in the Luck offer, a Wounds
          tip the first time the Leader loses a Wound, and a "Back in Varnholt"
          box on the first prologue debrief.
   ROLLBACK  Delete this file's <script> tag in index.html (or empty the file).
             Nothing in index.html was changed for Index 83.
============================================================================ */
(function(){
  const UX = window.UX83 = {hintOpen:false};
  const $q = (s, r) => (r || document).querySelector(s), $all = (s, r) => [...(r || document).querySelectorAll(s)];
  const safe = (name, fn) => { try { return fn(); } catch (e) { console.warn('Index 83 ' + name + ':', e); } };

  /* ---- styles ------------------------------------------------------------ */
  const st = document.createElement('style');
  st.textContent = `
  /* UX-17 focus */
  :focus-visible{outline:3px solid var(--gold-bright) !important;outline-offset:2px}
  .dpips:focus-visible{outline-offset:3px}
  /* UX-01 settings sections */
  .ux-sec{margin:6px 0 2px;text-align:left}
  .ux-sech{font:bold 14px Georgia;letter-spacing:1.6px;text-transform:uppercase;opacity:.75;border-bottom:1px solid currentColor;padding-bottom:2px;margin-bottom:6px}
  .ux-secr{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:flex-start}
  #tb-settings{max-height:calc(100vh - 70px);overflow-y:auto}
  .ux-more{width:100%;max-width:820px;margin:8px auto 0}
  .ux-moreb{margin-top:6px}
  #overlay-pause{justify-content:safe center !important}
  #pause-map{max-height:calc(100vh - 470px);min-height:160px;width:auto;height:auto}
  /* UX-02 / UX-04 */
  /* S6 row 1h: a disabled button carries its reason, printed under it (data-why, title as a mirror). 15 px at 1280, 17 at 1920 (linear between);
     #7a1f10 on parchment, #ffc8b8 on dark screens; the line is never dimmed. The disabled look is one style everywhere. */
  .ux-why{font-family:var(--f-body,Georgia,serif);font-style:normal;font-size:clamp(15px,calc(15px + (100vw - 1280px) * .003125),17px);line-height:1.3;color:#7a1f10;
    margin:4px auto 12px;max-width:320px;text-align:center;opacity:1}
  .ux-why.l{margin-left:0;margin-right:0;text-align:left}
  .overlay-screen .ux-why,.splash-screen .ux-why{color:#ffc8b8}
  .b45-ask{font-size:clamp(16px,calc(16px + (100vw - 1280px) * .003125),18px)}
  .ux-wb{display:inline-block;vertical-align:top;text-align:center}
  .btn:disabled,.btn:disabled:hover{opacity:.5;cursor:not-allowed;pointer-events:auto;transform:none}
  .btn:disabled:hover{background:var(--ink-soft)} .btn.gold:disabled:hover{background:#7a5a14}
  /* UX-10 chips */
  .ux-chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:2px}
  .ux-chip{font:14px Georgia;background:rgba(74,59,42,.12);border:1px solid rgba(74,59,42,.45);border-radius:9px;padding:0 6px;white-space:nowrap;cursor:help}
  .ux-role{font:bold 14px Georgia;letter-spacing:1px;text-transform:uppercase;color:var(--blood)}
  /* UX-11 */
  #askbox .btn.ux-danger{background:#7a1e14;border-color:#3a0a04;color:#fff0e0}
  #askbox .btn.ux-danger:hover{background:#9a2a1c}
  #camp-panel .btn.ux-outline{background:transparent;color:#6a2a14;border:2px solid var(--blood,var(--blood));box-shadow:none;font-size:14px;padding:6px}
  #camp-panel .btn.ux-outline:hover{background:rgba(122,62,38,.12);transform:none}
  /* UX-14 */
  #ux-tbmenu{position:fixed;top:52px;z-index:16;display:flex;flex-direction:column;gap:4px;padding:6px;background:linear-gradient(#4a3420,#2c1e12);border:2px solid #b8902a;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  #ux-tbmenu .tb{background:#5a4028;border:2px solid #22160c;color:#f5ead2;font:bold 14px Georgia;padding:6px 12px;cursor:pointer;border-radius:3px;text-align:left}
  #ux-tbmenu .tb:hover{background:#7a5636}
  /* UX-19 */
  #topbar.ux-creating .tb:not(.ux-keep){display:none}
  /* UX-16 */
  .ux-bar{position:relative;margin:8px 0 2px;height:18px;background:rgba(0,0,0,.25);border:1px solid var(--ink-soft,var(--ink-soft));border-radius:3px;overflow:hidden}
  .ux-bar i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(45deg,#7a9a3a 0 8px,#93b24c 8px 16px);background-size:22.6px 22.6px;animation:uxstripe 1.2s linear infinite}
  .ux-bar span{position:relative;display:block;text-align:center;font:bold 14px/18px Georgia;color:#1a1a0a;text-shadow:0 0 3px rgba(255,250,230,.9)}
  @keyframes uxstripe{to{background-position:22.6px 0}}
  @media (prefers-reduced-motion:reduce){.ux-bar i{animation:none}}
  /* UX-18 */
  .fseal.ally .n::before{content:'\\25B2\\00a0';font-size:.8em}
  .fseal.host .n::before{content:'\\25BC\\00a0';font-size:.8em}
  .die b{position:relative}
  .die.success b::after,.die.partial b::after,.die.miss b::after{position:absolute;top:-8px;right:-8px;width:18px;height:18px;border-radius:50%;font:bold 12px/18px Georgia;color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.5)}
  .die.success b::after{content:'\\2713';background:#1e5a24}
  .die.partial b::after{content:'~';background:#7a5a14}
  .die.miss b::after{content:'\\2717';background:#8b0000}
  /* onboarding */
  .ux-first{background:#fff3c4;color:#3a2a10;border:2px solid #b8902a;border-radius:4px;padding:6px 10px;margin:0 0 8px;font:14px/1.4 Georgia;text-align:left}
  .ux-town{background:rgba(255,250,232,.9);border:2px solid #7a5a2a;border-radius:4px;padding:8px 12px;margin:10px 0 4px;font-size:14px;line-height:1.45}
  .ux-town ul{margin:4px 0 4px 18px;padding:0}
  /* PROG-1 art pass: library entries not yet open (building, scroll) or researched but gated were grey fine print at opacity .6; now readable locked chips */
  [data-research5] .line>span[style*="opacity"],[data-gate5]{opacity:1!important;color:#5a4632;border:1px dashed rgba(90,70,50,.5);border-radius:3px;padding:1px 6px;background:rgba(90,70,50,.06)}
  [data-research5] .line>span[style*="opacity"]::before{content:'\\1F512\\FE0E\\00a0';font-size:.85em;opacity:.7}
  /* PROG-1 art pass: a loadout segment row with 4+ choices clipped its words ('(nothi') in the 380 px camp panel; it wraps */
  /* K69: feel.js '#camp-panel .line button' (ID) beat .dseg button.on, so the chosen key and Prep chips looked unpicked; K73: research buttons were 20 px tall */
  #camp-panel .dseg button.on,.dseg button.on{background:linear-gradient(#b8902a,#7a5a10)!important;color:#fff6d8!important;box-shadow:inset 0 0 0 2px #f0d070!important}
  /* K69 leftover: the picked Learn option, gold like the chips, once the LP marks it (.on preferred, as on .dseg) */
  #camp-panel button[onclick*="trainAsk"]:is(.on,.picked,[aria-pressed="true"]){background:linear-gradient(#b8902a,#7a5a10)!important;color:#fff6d8!important;box-shadow:inset 0 0 0 2px #f0d070!important}
  #camp-panel [data-research5] button,#camp-panel button[onclick*="BOOK33.research"]{font-size:14px!important;padding:6px 10px!important;min-height:32px}
  /* UX K84: the PD-37 free-item tag (pd37.js tagCamp, class gc-st own) was 8.5 px; K44 floor 11 px. Straight, so the longer words fit */
  .gc-st[data-pd37="tag"]{font-size:14px!important;transform:none!important;white-space:normal;max-width:calc(100% - 12px)}
  /* UX K89: gear-card labels (Quartermaster .gcard, Barracks .gcard.mini; cards-portraits.js) were 7 to 10.5 px at 1280; the 11 px floor at every width (TAP48 did it only under 500 px). Labels wrap instead of clipping */
  .gcard .gc-head,.gcard.mini .gc-head{font-size:14px!important;letter-spacing:.5px!important;white-space:normal!important;line-height:1.15}
  .gcard .hxs,.gcard.mini .hxs{font-size:14px!important;letter-spacing:0!important;min-width:0!important}.gcard .gc-big .hxs{flex:1 1 0!important}.gcard.mini .gc-big .hxs{flex:1 1 auto!important;min-width:min-content!important}.gcard .hxs span{text-align:center;line-height:1.1}.gcard .hx i{font-size:14px!important}
  /* UX K93: the dice tray (War Council etc., rankn-dice.js) had a 0.55 centre scrim, so the brief showed through the dice; near-solid now (as the debrief tray, ux-bugs.js T4) */
  #dice-tray.show{background:radial-gradient(ellipse at center, rgba(20,10,4,.9), rgba(10,5,2,.96))!important}
  /* UX K100: the 11 px floor at every width (K44 did it only under 500 px). Leader Creator sheet (guided-start.js): stat names and SKILL DICE 9 px, dice 10 px, notes, +/- and badge 10.5 / 9.5 px; names 90 px wide so PERSONALITY fits and the dice line up.
     Siege town plan labels (feel.js .dlab) 10.5 px: tighter so The Common House clears The Keep. Chronicle tags (scribe-bard.js) 10.5 px: 76 px column, CONTRACT is 70 */
  .ldr-card .dsrow>b{font-size:14px!important;letter-spacing:.3px!important;width:auto!important;min-width:90px;flex:none}.ldr-card .dbt2{font-size:14px!important;letter-spacing:1px!important}
  .ldr-card .dsd{font-size:11px!important}.ldr-card .dsnote,.dl-up,.dl-dn,.chips u,.ldr-badge{font-size:14px!important}
  .dlab{font-size:14px!important;padding:0 3px!important;letter-spacing:-.2px}
  #chronicle span[style*="min-width:64px"]{font-size:14px!important;min-width:76px!important}
  .gcard .gc-foot b,.gcard .gc-range b{font-size:14px!important;letter-spacing:.5px!important}
  .gcard .gc-sub,.gcard.mini .gc-sub,.gcard .gc-foot s,.gcard.mini .gc-foot,.gcard .aq-line,.gcard .gc-st{font-size:14px!important}
  .dseg{flex-wrap:wrap;max-width:100%}.dseg button{flex:1 1 auto;border-bottom:1px solid #24160a!important;margin-bottom:-1px!important}
  /* War Table under 980 px: '1fr' grew to its widest content (437 px at 375), so the whole table scrolled sideways */
  @media (max-width:980px){.table-grid{grid-template-columns:minmax(0,1fr)!important}}
  /* UX K76 Art parts: trait tags and building kind lines to the 11 px floor (late-fixes set .tag 10.5 px); EXPORT on person cards a real button; creator breadcrumb chips a 40 px tap on a phone */
  body .tag{font-size:14px}
  .mcard .mc-head{font-size:14px} .mcard .hxs{font-size:14px;letter-spacing:0;min-width:0} .mcard .mcl > b{font-size:14px;min-width:78px} .mcard .mcl em{font-size:14px}   /* stage 5: person card labels were 8.5 to 10 px at 1280 */
  .mcard .mc-exp,#camp-panel .mc-exp{font:bold 14px Georgia!important;padding:5px 10px!important;min-height:26px;line-height:1.2!important}
  @media (max-width:500px){.ldr-crumbs a,.ldr-crumbs b{display:inline-flex;align-items:center;min-height:40px;padding:0 4px;box-sizing:border-box}}
  /* Name inputs (Sign the Charter, Founding name step) on a phone: the fixed-width input ran off the left edge */
  @media (max-width:500px){div:has(> input.name){flex-wrap:wrap;justify-content:center;max-width:100%;box-sizing:border-box;margin:10px 0!important}input.name{width:auto!important;min-width:0!important;flex:1 1 160px;max-width:100%;box-sizing:border-box}}
  `;
  document.head.appendChild(st);

  /* ---- UX-01: settings grouped, off the splash and the pause screen ------- */
  const SEC = [['Sound', /^(Volume|Music|Effects)\b/], ['Save', /^(Export save|Import save|NEW CAMPAIGN|Restore a backup|Last backup|No backup yet)/]   /* Index 83e */,
               ['Display', /Screen shake|Squad Leader look|^Retro|3D world|Sharp text|Text size|HUD size|Seasonal weather/], ['Game', /./]];
  function groupSettings(flex){
    if (!flex || flex.dataset.ux83) return; flex.dataset.ux83 = '1';
    const kids = [...flex.children], box = {};
    for (const c of kids){ const t = (c.textContent || '').replace(/^\s*X?\s*/, '').trim(); const s = SEC.find(([, re]) => re.test(t)); (box[s[0]] = box[s[0]] || []).push(c); }
    flex.style.display = 'block';
    for (const [name] of [['Sound'], ['Game'], ['Display'], ['Save']]){
      if (!box[name]) continue;
      const sec = document.createElement('div'); sec.className = 'ux-sec';
      sec.innerHTML = `<div class="ux-sech">${name}</div><div class="ux-secr"></div>`;
      box[name].forEach(c => sec.lastChild.appendChild(c)); flex.appendChild(sec);
    }
  }
  { const f = toggleSettings;
    toggleSettings = function(){
      const r = f.apply(this, arguments);
      safe('settings popover', () => { const p = $q('#tb-settings'); if (!p) return;
        const flex = p.firstElementChild, nc = $q('button[onclick^="resetSave"]', p);
        if (nc && flex){ nc.parentElement.remove(); nc.style.cssText = 'font-size:14px;padding:4px 10px'; flex.appendChild(nc); }
        groupSettings(flex); });
      return r;
    };
  }
  { const f = showSplash;
    showSplash = function(){
      const r = f.apply(this, arguments);
      safe('splash', () => {
        const ti = $q('#title-inner'); if (!ti) return;
        const setDiv = [...ti.children].find(d => d.tagName === 'DIV' && $q('input,select,.dpips', d));
        if (setDiv){ setDiv.innerHTML = '<button class="btn small" onclick="toggleSettings()">SETTINGS</button>'; setDiv.style.marginTop = '14px'; }
        // UX-02: first run, one recommended path
        if (!META.leader && !(typeof founded === 'function' && founded())){
          const found = $q('button[onclick="openFound()"]', ti), story = $q('button[onclick="openStory()"]', ti);
          if (found && story){
            story.className = 'btn gold'; story.textContent = 'START HERE: THE PROLOGUE';
            const note = story.previousElementSibling; if (note) note.textContent = 'The prologue teaches the game in a short story; the squad that survives becomes your Chapter.';
            found.className = 'btn small'; found.textContent = 'Skip the prologue: found a Chapter';
            story.after(document.createElement('br'), found);
            story.parentElement.style.textAlign = 'center';
          }
        }
      });
      return r;
    };
  }
  { const f = togglePause;
    togglePause = function(){
      const r = f.apply(this, arguments);
      safe('pause', () => {
        const ps = $q('#pause-settings'); if (!ps || !G || !G.paused) return;
        const flex = ps.firstElementChild; if (!flex || flex.dataset.uxp) return; flex.dataset.uxp = '1';
        const more = document.createElement('div'); more.className = 'ux-more hidden';
        const inner = document.createElement('div'); inner.style.cssText = flex.getAttribute('style') || ''; more.appendChild(inner);
        for (const c of [...flex.children]){ const t = (c.textContent || '').trim(); if (!/^(Volume|Game speed|Momentum|Music|Effects)\b/.test(t)) inner.appendChild(c); }
        const btn = document.createElement('button'); btn.className = 'btn small ux-moreb'; btn.textContent = 'More settings…';
        btn.onclick = () => { more.classList.toggle('hidden'); btn.textContent = more.classList.contains('hidden') ? 'More settings…' : 'Fewer settings'; };
        ps.appendChild(btn); ps.appendChild(more); groupSettings(inner);
      });
      return r;
    };
  }

  /* ---- UX-12: campNote kinds and feedback for silent actions -------------- */
  { const f = campNote;
    campNote = function(msg, kind){
      const r = f.apply(this, arguments);
      safe('campNote', () => { const el = $q('#camp-note'); if (!el) return;
        const K = {good:['✓', '#3a8a3a'], bad:['!', '#c0402a'], info:['i', '#d4af37']}[kind];
        el.style.borderLeft = K ? '7px solid ' + K[1] : '';
        if (K) el.textContent = K[0] + '  ' + msg; });
      return r;
    };
  }
  /* INT-1 stage 3 group 2: the resetTips and exportSave notes are folded into js/core/sound-settings-tips.js */
  { const f = setSetting;
    setSetting = function(k, v){
      const r = f.apply(this, arguments);
      if (k === 'textSize') campNote('Text size: ' + ({normal:'Normal', large:'Large', larger:'Larger'}[v] || v) + '.', 'info');
      return r;
    };
  }

  /* ---- UX-11: danger styling and a safe default ---------------------------- */
  const DANGER = /\b(release|stand down|stands down|pull down|replace|replaced|erase|again from the beginning|new campaign|concede|abandon|delete|for good)\b/i;
  { const f = askConfirm;
    askConfirm = function(title, body, onYes, opts){
      opts = opts || {};
      const r = f.apply(this, arguments);
      safe('askConfirm', () => {
        if (opts.alert || !ASK) return;
        const text = String(title) + ' ' + String(body).replace(/<[^>]+>/g, ' ');
        if (!(opts.danger || DANGER.test(text))) return;
        ASK.danger = true;
        const box = $q('#askbox'), yes = $q('.btn.gold', box), no = yes && yes.nextElementSibling;
        if (!yes) return;
        yes.classList.remove('gold'); yes.classList.add('ux-danger');
        if (!opts.ok){
          const m = String(body).replace(/<[^>]+>/g, '').match(/^(Release|Pull down|Load|Start|Concede|Erase|Abandon|Delete)\b[^?.,:]{0,26}/) ||
                    String(title).match(/^(Release|Pull down|Load|Start|Concede|Erase|Abandon|Delete|Stand down)\b[^?.,:]{0,26}/);
          if (!m && /\bReplace it\b/.test(String(body))) yes.textContent = 'REPLACE IT';   /* Index 83f: prologue to main overwrite */
          else yes.textContent = m ? m[0].split(/\s+(?:from|to|and|for)\s+/)[0].trim().toUpperCase() : 'YES, DO IT';
        }
        const k = $q('.abk', box); if (k) k.textContent = '[1] confirm · [ENTER] or [ESC] cancel';
        if (no) setTimeout(() => { try { no.focus(); } catch (e) {} }, 0);
      });
      return r;
    };
  }
  { const f = askClose;
    askClose = function(yes){
      const ev = window.event;
      if (yes && ASK && ASK.danger && ev && ev.type === 'keydown' && ev.key === 'Enter') yes = false;
      return f.call(this, yes);
    };
  }

  /* ---- UX-16 + UX-11: the construction panel ------------------------------ */
  { const f = sitePanelHTML;
    sitePanelHTML = function(P){
      let h = f.apply(this, arguments);
      safe('site panel', () => {
        const b = buildRec(P.id), need = Math.max(1, b.need || 1), k = Math.min(need, Math.max(1, (buildNow() - b.start) + 1));
        const pct = Math.max(6, Math.round(((k - 1) + 0.5) / need * 100));
        h = h.replace(/<div style="margin:8px 0;height:12px[^]*?<\/div><\/div>/, `<div class="ux-bar" title="Building: season ${k} of ${need}"><i style="width:${pct}%"></i><span>Season ${k} of ${need}</span></div>`)
             .replace('<button class="btn small" onclick="cancelBuild', '<button class="btn small ux-outline" onclick="cancelBuild');
      });
      return h;
    };
  }

  /* ---- G-UI-07: the builder's camp label ----------------------------------- */
  { const f = campLabel;
    campLabel = function(x, y, title, sub){
      if (typeof sub === 'string'){
        const m = sub.match(/^Builder: (.+?)(?:, (.+) left)?$/);
        if (m){ const site = m[1], left = m[2];
          return f.call(this, x, y, site === 'a new building' ? 'Building something new' : 'Building the ' + site,`${title}${left ? ' · ' + left + ' left' : ''} · click for the site`); }
        if (sub === 'Resting') return f.call(this, x, y, title, 'Resting · sits out the next contract');
      }
      return f.apply(this, arguments);
    };
  }

  /* ---- UX-04: why it is disabled; doctrine verbs --------------------------- */
  function uxWhy(root){
    if (!root) return;
    $all('.ux-why', root).forEach(d => { const p = d.previousElementSibling; if (!(p && p.tagName === 'BUTTON' && p.disabled)){
      const w = d.parentNode; d.remove();                                   // enabled again: the reason goes, and so does the row wrapper it needed (Lead review of 1h)
      if (w && w.classList && w.classList.contains('ux-wb')){ while (w.firstChild) w.before(w.firstChild); w.remove(); } } });
    $all('button[data-why-title]', root).forEach(b => { if (!b.disabled){ b.removeAttribute('title'); b.removeAttribute('data-why-title'); } });   // the hover text uxWhy set goes with the reason
    $all('button.btn:disabled', root).forEach(b => {
      const t = b.textContent.trim(); let why = b.getAttribute('data-why') || '';
      let m;
      if (why){} else if ((m = t.match(/^THESE (?:FOUR|TWO) \((\d) \/ ([24])\)/))) why = `Choose ${+m[2] - +m[1]} more.`;   /* Index 83f: the Quick Prologue picks two */
      else if (/^CONTINUE/.test(t)){ const h = $q('h1', root); why = h ? h.textContent.trim().replace(/\s+/g, ' ') + ' to continue.' : 'Make a choice above to continue.'; }
      else if (/^(NEXT|TAKE THE CHAIR)/.test(t)){ const h = $q('h1', root), ht = h ? h.textContent : '';   /* Index 83c */
        why = /Ambition/i.test(ht) ? 'Choose an Ambition to continue.' : /Chair/i.test(ht) ? 'Choose who sits in the chair to continue.' : /Holding/i.test(ht) ? 'Choose a holding to continue.' : 'Make a choice above to continue.'; }
      else if (b.title) why = b.title;
      if (!why){ if (!UX._whyWarned.has(b)){ UX._whyWarned.add(b); console.warn('[why] disabled button without a reason: ' + t); } return; }
      if (!b.title || b.hasAttribute('data-why-title')){ b.title = why; b.setAttribute('data-why-title', '1'); }
      const nx = b.nextElementSibling;
      if (nx && nx.classList.contains('ux-why')){ nx.textContent = why; return; }
      const d = document.createElement('div'); d.className = 'ux-why';
      const near = n => n && ((n.nodeType === 3 && n.textContent.trim()) || (n.nodeType === 1 && !n.classList.contains('ux-why') && /^(BUTTON|A|INPUT|SPAN|IMG|LABEL)$/.test(n.tagName)));
      const adj = dir => { let n = b[dir]; while (n && ((n.nodeType === 3 && !n.textContent.trim()) || (n.nodeType === 1 && n.classList.contains('ux-why')))) n = n[dir]; return n; };
      const sib = near(adj('previousSibling')) || near(adj('nextSibling'));   // only a neighbour on the same line counts
      d.textContent = why;
      if (sib){ const w = document.createElement('span'); w.className = 'ux-wb'; b.before(w); w.appendChild(b); w.appendChild(d); }   // a button in a row: its reason hangs under it, the row stays a row
      else { const ta = getComputedStyle(b.parentNode).textAlign; if (ta === 'left' || ta === 'start'){ d.classList.add('l'); d.style.marginLeft = getComputedStyle(b).marginLeft; } b.after(d); }   // the reason's left edge is the button's border edge, not its margin box
    });
  }
  UX.why = uxWhy; UX._whyWarned = new WeakSet();
  function doctrineVerbs(){
    $all('#tbl-doctrines button').forEach(b => { const t = b.textContent.trim(); if (/^\d+gp$/.test(t)) b.textContent = 'ADOPT · ' + t; });
  }
  const afterWhy = (f, sel, extra) => function(){ const r = f.apply(this, arguments); safe('why ' + sel, () => { uxWhy($q(sel)); if (extra) extra(); }); return r; };
  renderCreate = afterWhy(renderCreate, '#create-inner');
  renderFound = afterWhy(renderFound, '#create-inner');
  renderPanel = afterWhy(renderPanel, '#camp-panel');
  renderTable = afterWhy(renderTable, '#table-inner', doctrineVerbs);

  /* ---- UX-10: the prologue squad pick ------------------------------------- */
  const CHIP = [['con', 'Con', 'Condition: how much punishment they take before going down'], ['move', 'Mv', 'Move: walking speed'],
                ['melee', 'Melee', 'Melee skill die'], ['ranged', 'Ranged', 'Ranged skill die'], ['magic', 'Magic', 'Magic skill die (casters)']];
  function chipsHTML(r){
    const s = mateStats(r), caster = SPECS[r.spec].caster;
    return '<span class="ux-chips">' + CHIP.filter(c => c[0] !== 'magic' || caster).map(([k, l, tip]) => `<span class="ux-chip" title="${tip}">${l} ${s[k]}</span>`).join('') + '</span>';
  }
  UX.chipsHTML = chipsHTML;   /* Index 83d: the Hiring Line reuses the chips */
  window.uxBalancedFour = function(){
    const C = CP(); if (!C || !C.offer) return;
    const order = ['CLERIC', 'SOLDIER', 'FOLK_HERO', 'MAGE', 'WITCH', 'SCOUNDREL'], lead = META.leader ? META.leader.spec : null;
    const idx = C.offer.map((r, i) => i), pick = [], used = new Set();
    /* Index 83f: the Quick Prologue has two companions already in the squad, and only two hires to pick */
    const quick = typeof isFull === 'function' && !isFull() && Array.isArray(C.comp), want = quick ? 2 : 4;
    if (quick) C.comp.forEach(c => c && used.add(c.spec ? c.spec.toUpperCase() : c.spec));
    for (const pass of [0, 1]) for (const sp of order){
      if (pick.length >= want) break; if (pass === 0 && (sp === lead || used.has(sp))) continue; if (pass === 1 && used.has(sp)) continue;
      const cand = idx.filter(i => !pick.includes(i) && C.offer[i].spec === sp).sort((a, b) => mateStats(C.offer[b]).con - mateStats(C.offer[a]).con)[0];
      if (cand != null){ pick.push(cand); used.add(sp); }
    }
    idx.filter(i => !pick.includes(i)).sort((a, b) => mateStats(C.offer[b]).con - mateStats(C.offer[a]).con).forEach(i => { if (pick.length < want) pick.push(i); });
    C.pick = pick; SFX.play('pick'); renderPanel();
  };
  { const f = storyMusterHTML;
    storyMusterHTML = function(){
      let h = f.apply(this, arguments);
      safe('squad pick', () => {
        const C = CP();
        (C.offer || []).forEach(r => {
          const line = `<span style="font-size:14px">${mateLine(r)}</span>`;
          h = h.replace(line, chipsHTML(r));
          const who = `${RACES[r.race].name} ${CLASSES[r.cls].name} ${SPECS[r.spec].name}<br>`;
          h = h.replace(`<b>${esc(r.name)}</b><br>${who}`, `<b>${esc(r.name)}</b> <span class="ux-role">${SPECS[r.spec].role}</span><br>${who}`);
        });
        h = h.replace('<button class="btn small" onclick="CP().offer=null', '<button class="btn small" onclick="uxBalancedFour()">PICK A BALANCED FOUR</button><button class="btn small" onclick="CP().offer=null');
      });
      return h;
    };
  }

  /* ---- UX-14 + UX-19: the top bar ----------------------------------------- */
  function closeTbMenu(){ const m = $q('#ux-tbmenu'); if (m) m.remove(); }
  window.uxTbMenu = function(btn){
    if ($q('#ux-tbmenu')) return closeTbMenu();
    const m = document.createElement('div'); m.id = 'ux-tbmenu';
    (UX.folded || []).forEach(b => { const c = b.cloneNode(true); c.addEventListener('click', closeTbMenu); m.appendChild(c); });
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(); m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
  };
  document.addEventListener('mousedown', e => { const m = $q('#ux-tbmenu'); if (m && !m.contains(e.target) && e.target.id !== 'ux-tbmenu-btn') closeTbMenu(); });
  { const f = renderTopbar;
    renderTopbar = function(){
      const r = f.apply(this, arguments);
      safe('topbar', () => {
        const tb = $q('#topbar'); if (!tb) return; closeTbMenu();
        const btns = $all('button.tb', tb), byText = re => btns.filter(b => re.test(b.textContent.trim()));
        byText(/^(MANUAL|SETTINGS)$/).forEach(b => b.classList.add('ux-keep'));
        const creating = !$q('#screen-create').classList.contains('hidden');
        tb.classList.toggle('ux-creating', creating);
        UX.folded = [];
        if (window.innerWidth < 1280 && !creating){
          const fold = byText(/^(MANUAL|PORTRAITS|SETTINGS)$/);
          if (fold.length > 1){
            UX.folded = fold; fold.forEach(b => b.remove());
            const mb = document.createElement('button'); mb.className = 'tb ux-keep'; mb.id = 'ux-tbmenu-btn'; mb.textContent = '☰'; mb.title = 'Manual, Portraits, Settings';
            mb.setAttribute('aria-label', 'More: Manual, Portraits, Settings'); mb.onclick = () => uxTbMenu(mb); tb.appendChild(mb);
          }
          const chip = [...tb.querySelectorAll('span.stat')].find(s => /^Ledger:/.test(s.textContent.trim()));
          if (chip){ const n = (chip.textContent.match(/(\d+) building/) || [])[1], up = (chip.textContent.match(/upkeep\s*(-?\d+gp)/) || [])[1];
            chip.innerHTML = `⚒ ${n ? `<b>${n}</b> · ` : ''}<b>${up || ''}</b>`; chip.setAttribute('aria-label', 'Ledger: works and upkeep'); }
        }
      });
      return r;
    };
  }
  let rsT = 0;
  window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { try { if (!G && !$q('#topbar').classList.contains('hidden')) renderTopbar(); } catch (e) {} }, 150); });

  /* ---- UX-15: the camp hint strip ----------------------------------------- */
  const SHORT_HINT = 'WASD walks your Squad Leader · click buildings, plots and people · press ? for the camp keys';
  { const f = hint81;
    hint81 = function(){
      const r = f.apply(this, arguments);
      const h = $q('#camp-hint'); if (!h) return r;
      const story = typeof inStoryNow === 'function' && inStoryNow();
      if (story || !META || (META.deployments || 0) < 3) return r;   /* Index 83c: after three contracts, not three redraws */
      if (UX.hintOpen){ if (h.textContent === SHORT_HINT){ h.dataset.i81 = ''; f.apply(this, arguments); } }
      else if (h.textContent !== SHORT_HINT) h.textContent = SHORT_HINT;
      return r;
    };
  }
  window.addEventListener('keydown', e => {
    if (e.key !== '?' || G) return;
    const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    if (!$q('#screen-title').classList.contains('hidden')) return;
    UX.hintOpen = !UX.hintOpen; try { hint81(); } catch (err) {}
  });

  /* ---- UX-17: keyboard for the custom controls ---------------------------- */
  { const f = enhanceControls;
    enhanceControls = function(root){
      const r = f.apply(this, arguments);
      safe('controls', () => {
        $all('.dpips:not([tabindex])', root).forEach(p => {
          const inp = p.previousElementSibling; if (!inp || inp.type !== 'range') return;
          const min = +inp.min || 0, max = +inp.max || 100, step = (max - min) / 10;
          const lab = (p.closest('label') ? p.closest('label').textContent : 'Level').trim();
          p.tabIndex = 0; p.setAttribute('role', 'slider'); p.setAttribute('aria-label', lab); p.setAttribute('aria-valuemin', min); p.setAttribute('aria-valuemax', max);
          const paint = () => { [...p.children].forEach((c, i) => c.className = (i + 1) / 10 <= (inp.value - min) / (max - min) + 1e-6 ? 'on' : ''); p.setAttribute('aria-valuenow', inp.value); };
          paint(); p.addEventListener('click', () => setTimeout(paint, 0));
          p.addEventListener('keydown', e => {
            let v = +inp.value;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = Math.min(max, v + step);
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = Math.max(min, v - step);
            else if (e.key === 'Home') v = min; else if (e.key === 'End') v = max; else return;
            e.preventDefault(); e.stopPropagation(); inp.value = v; paint(); inp.dispatchEvent(new Event('input', {bubbles:true}));
          });
        });
        $all('.dchk:not([role])', root).forEach(b => {
          const c = b.previousElementSibling; b.setAttribute('role', 'checkbox');
          const sync = () => b.setAttribute('aria-checked', c && c.checked ? 'true' : 'false'); sync(); b.addEventListener('click', () => setTimeout(sync, 0));
        });
      });
      return r;
    };
  }

  /* ---- UX-13: a panel behind the contract messages ------------------------ */
  { const f = drawHUD;
    drawHUD = function(){
      if (!G || !G.msgs){ return f.apply(this, arguments); }
      const ms = G.msgs; G.msgs = [];
      try { f.apply(this, arguments); } finally {
        const added = G.msgs; G.msgs = ms;
        safe('messages', () => {
          /* S6 1i (ruling s6-1i-one-idea.md rules 3, 4, 6; layout part A): in a Founding fight the log is the tip line. It is not
             shown while a lesson card is open, and only a speaker's line shows with a banner; a line that waits does not age. It
             sits on the legend's left edge, 8 screen px above the legend. UX.logAt is its box in Deck units (null: not drawn). */
          const D1 = window.DECK, l1 = !!(D1 && D1.l1i && D1.l1i()), T1 = window.T45; UX.logAt = null;
          const vis = !l1 ? ms : (T1 && T1.cur) ? [] : UX.tip1i(UX.tp) === 'show' && G.frame >= 300 ? ms.filter(m => UX.SPEECH.test(String(m.t)) && !(T1 && T1.saidShown && T1.saidShown.some(s => String(m.t).indexOf(s) >= 0))) : ms;
          const show = vis.slice(0, 5);
          let base = l1 ? (D1.legendAt ? D1.legendAt.y : VH - D1.H - 6) - 8 / D1.sc() - 7 : VH - 216, lx = l1 && D1.legendAt ? D1.legendAt.x : 14, cap = l1 ? VW * 0.5 : VW - 60;
          { const sb = !!(G.shaken || G.broken), top0 = window.CAP_TOP != null ? window.CAP_TOP : (sb && D1 && D1.H ? VH - D1.H - 24 : null); if (top0 != null){ const lim = top0 - (sb ? 21 : 0) - 8; if (base + 7 > lim) base = lim - 7; } }   /* UX 593295bd: chips, then SHAKEN/BROKEN 6 px clear, then the log 8 px clear; nothing moves with no chips */
          if (show.length){
            const fLg = typeof hudPx === 'function' ? hudPx(13) : 13, sLg = Math.max(17, Math.ceil(fLg * 1.3));   /* UX text floor (text-floor-1280-ruling.md): 14 screen px, the step from the size */
            ctx.save(); ctx.textAlign = 'left'; ctx.font = fLg + 'px Georgia';
            /* UX K58 (Art 16 Nov): on a phone each message wraps to the width instead of running off the right edge (window.K58 = false: off) */
            const rows = [];
            show.forEach(m => { let ls = [String(m.t)];
              if (((VW < 640 && window.K58 !== false) || l1) && ctx.measureText(m.t).width > cap){ ls = ['']; String(m.t).split(' ').forEach(wd => { const c = ls[ls.length - 1], t = c ? c + ' ' + wd : wd; if (c && ctx.measureText(t).width > cap) ls.push(wd); else ls[ls.length - 1] = t; }); }
              for (let j = ls.length - 1; j >= 0; j--) rows.push({t: ls[j], life: m.life}); });
            const w = Math.min(VW - 40, Math.max(...rows.map(m => ctx.measureText(m.t).width)) + 20);
            const top = base - (rows.length - 1) * sLg - 15 - (fLg - 13), a = Math.min(1, Math.max(...show.map(m => m.life)) / 60);
            ctx.globalAlpha = Math.max(0, a) * 0.72; ctx.fillStyle = '#140e08';
            if (ctx.roundRect){ ctx.beginPath(); ctx.roundRect(lx, top, w, (base + 7) - top, 4); ctx.fill(); } else ctx.fillRect(lx, top, w, (base + 7) - top);
            rows.forEach((m, i) => { ctx.globalAlpha = Math.max(0, Math.min(1, m.life / 60)); ctx.fillStyle = '#000'; ctx.fillText(m.t, lx + 11, base + 1 - i * sLg); ctx.fillStyle = '#f0e6d2'; ctx.fillText(m.t, lx + 10, base - i * sLg); });
            ctx.restore();
            if (l1) UX.logAt = {x: lx, y: top, w, h: base + 7 - top};
          }
          (l1 ? show : ms).forEach(m => m.life--);
          G.msgs = ms.filter(m => m.life > 0).concat(added);
        });
        // Gemini onboarding 4: the first lost Wound
        safe('wounds tip', () => { const L = G.leader; if (!L) return;
          if (UX.wG === G && UX.w != null && L.wounds < UX.w && !L.down) tip('wounds');
          UX.wG = G; UX.w = L.wounds; });
      }
    };
  }

  /* ---- Gemini onboarding 3 and 4: the tips -------------------------------- */
  TIPS.wounds = 'A Wound lost. Hits take Wards, then Shield, then Wounds: at 0 the Leader is down. Healing and Poultices restore them.';
  TIPS.luck = 'Luck: SPEND 1 (Q) to roll this again; it comes back with Momentum and rest. BURN 1 (R) for an automatic success; it lowers your maximum Luck for good.';
  { const f = luckPanelHTML;
    luckPanelHTML = function(job){
      let h = f.apply(this, arguments);
      safe('luck tip', () => { META.tipsSeen = META.tipsSeen || {};
        if (META.tipsSeen.luck || settings().tips === false) return;
        META.tipsSeen.luck = true; saveMeta();
        h = h.replace('<div class="dt-luck" onclick="event.stopPropagation()">', `<div class="dt-luck" onclick="event.stopPropagation()"><div class="ux-first"><b>First failed roll?</b> ${TIPS.luck}</div>`); });
      return h;
    };
  }

  /* ---- Gemini onboarding 5: back in town after the first prologue fight ---- */
  const TOWN = `<div class="ux-town"><b>Back in Varnholt.</b> Three things to watch now the first fight is over:<ul>
    <li><b>Supply</b> (top bar): the town eats every morning; the Mill and the Scrounge order bring more in. The Morning Report shows the sums.</li>
    <li><b>The hurt</b> rest and sit out the next fight. The Tend the Wounded order makes every resting Squad Mate fit at once.</li>
    <li><b>Condition</b> (green pips) is each model's own toughness: hits outside the Command Radius, or after the Leader's Wounds, take it. At 0 a Squad Mate is Bleeding Out.</li></ul>
    Spend the day's Work Orders in the Reeve's Hall, then ring the bell.</div>`;
  { const f = renderDebrief;
    renderDebrief = function(head, lines){
      safe('back in town', () => {
        if (!(typeof inStoryNow === 'function' && inStoryNow()) || !META || !Array.isArray(lines)) return;
        const key = String(head || '').replace(/<[^>]+>/g, '').slice(0, 80);
        if (!META.uxTown){ META.uxTown = key || 'first'; saveMeta(); }
        if (META.uxTown === (key || 'first') && !lines.some(l => typeof l === 'string' && l.indexOf('ux-town') >= 0)) lines = lines.concat([TOWN]);
      });
      return f.call(this, head, lines);
    };
  }
})();
/* ===== END INDEX 83 ======================================================= */

/* ============================================================================
   INDEX 83b - UX ROUND 2 (J-03, J-04, J-05, J-07, J-11, J-12)
   J-03  Planning table: a sticky footer (contract, pay, squad n / 5, SIGN AND
         MARCH, with the reason when it is off), the right column as tabs
         (Ambition, Factions, Doctrines, Rivals, Prisoners), and opening the
         table (P) lands on Contracts.
   J-04  The contract HUD scales with the window: HUDK = clamp(VH/760, 1, 1.6)
         x text size (Auto), or a fixed 100 / 125 / 150% (Settings > Display >
         HUD size). The HUD is drawn in a scaled coordinate frame, so every
         overlay inside drawHUD (alerts, carried items, braziers, Momentum
         cards, messages) follows. Small grey print is brightened.
   J-05  Leader card: rows in the order damage takes them (Wards, Shield,
         Mount, Wounds, then Condition and Luck), each with n/max, shaped pips
         (Ward diamond, Shield square, Wounds circle, Luck triangle) and a red
         flash when the row loses a pip. Filled = what is left.
   J-07  Rolling backups: on each season change the campaign is copied into
         three rotating slots (<save>_bk1..3); Settings > Save > "Restore a
         backup..." lists them. Main campaign only; the prologue slot and its
         hand-over are never touched.
   J-11  A squad portrait strip under the leader card (N hides it): a bust and
         a Condition bar per Squad Mate, red X when down.
   J-12  Plain one-line summaries on the six Specialty cards, the armour and
         shield cards and the doctrines, with the rules text under "Details".
   ROLLBACK  Delete from this comment to END INDEX 83b (nothing else changed).
============================================================================ */
(function(){
  const UX = window.UX83 = window.UX83 || {};
  const $q = (s, r) => (r || document).querySelector(s), $all = (s, r) => [...(r || document).querySelectorAll(s)];
  const safe = (name, fn) => { try { return fn(); } catch (e) { console.warn('Index 83b ' + name + ':', e); } };
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
  const css = document.createElement('style');
  css.textContent = `
  /* J-03 */
  .ux-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:14px 8px 0;padding:0 4px;border-bottom:3px solid var(--wood-night,var(--wood-night));position:relative;z-index:2}
  .ux-tabs button{font:bold 14px Georgia;font-variant:small-caps;color:var(--parchment,var(--parchment));background:linear-gradient(#6e4e2c,#4a3018);border:2px solid #24160a;border-bottom:none;border-radius:6px 6px 0 0;padding:6px 14px;cursor:pointer;margin:0}
  .ux-tabs button:hover{background:linear-gradient(#8a6238,#5a3a1c)}
  .ux-tabs button.on{background:#d8c9a8;color:#3a2a1a;transform:translateY(3px)}
  #ux-foot{position:sticky;bottom:0;z-index:6;max-width:1320px;margin:16px auto 0;box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;
    padding:8px 16px;background:linear-gradient(#3a2414,#22140a);border:2px solid #b8902a;border-radius:4px;box-shadow:0 -6px 16px rgba(0,0,0,.55);color:var(--parchment);font-family:Georgia}
  #ux-foot .fc{flex:1 1 220px;min-width:0}
  #ux-foot .fc small,#ux-foot .fs small{display:block;font-size:14px;letter-spacing:1.2px;text-transform:uppercase;opacity:.75}
  #ux-foot .fc b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ux-foot .fs{flex:0 0 auto;text-align:center}
  #ux-foot .fs b{font-size:17px}
  #ux-foot .btn{margin:0;padding:9px 22px;font-size:16px}
  #ux-foot .fw{flex:1 0 100%;font:italic 14px Georgia;color:#ffb0a0;margin:0}
  #ux-foot .fa{flex:1 0 100%;font:bold 14px Georgia;color:#ffd070;margin:0;padding:4px 8px;background:rgba(212,160,40,.18);border-left:4px solid #d4a028}
  #ux-foot .fn{flex:1 0 100%;font:italic 14px Georgia;color:#e8d8b0;margin:0}
  /* J-07 */
  #ux-bk{position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7)}
  #ux-bk .bx{width:min(560px,94vw);max-height:86vh;overflow:auto;background:var(--parch,var(--canvas,var(--canvas)));border:3px solid #3a2a1a;box-shadow:0 0 0 2px #8a6a3a inset,0 16px 40px rgba(0,0,0,.7);padding:18px 22px;font-family:Georgia;color:var(--ink,var(--ink))}
  #ux-bk h2{margin:0 0 6px;font-variant:small-caps;font-size:26px;border-bottom:3px double var(--ink-soft)}
  #ux-bk .brow{display:flex;gap:10px;align-items:center;border-top:1px solid #c9bba4;padding:7px 0;font-size:14px}
  #ux-bk .brow .g{flex:1}
  #ux-bk .brow small{display:block;color:#6a5a44;font-size:14px}
  /* J-12 */
  .ux-plain{font:italic 14px/1.35 Georgia;color:#3a2a1a;margin:3px 0 4px;text-align:center}
  .line .ux-plain,.ledger .ux-plain{text-align:left}
  details.ux-det{margin-top:3px;text-align:left}
  details.ux-det summary{cursor:pointer;font:bold 14px Georgia;color:var(--blood);list-style:none}
  details.ux-det summary::before{content:'\\25B8 '}
  details.ux-det[open] summary::before{content:'\\25BE '}
  details.ux-det summary::-webkit-details-marker{display:none}
  `;
  document.head.appendChild(css);

  /* ---- J-03: planning table ------------------------------------------------ */
  const TABS = [['ambition', 'Ambition'], ['factions', 'Factions'], ['doctrines', 'Doctrines'], ['rivals', 'Rivals'], ['ledger', 'Prisoners']];
  UX.tab = UX.tab || 'ambition';
  function tableExtras(){
    const inner = $q('#table-inner'); if (!inner || !META || !META.leader) return;
    const grid = $q('.table-grid', inner); if (!grid || grid.children.length < 2) return;
    const col = grid.children[1];
    $all('.ux-tabs', col).forEach(e => e.remove());
    const bar = document.createElement('div'); bar.className = 'ux-tabs'; bar.setAttribute('role', 'tablist');
    const np = (META.prisoners || []).length;
    const show = id => { UX.tab = id; TABS.forEach(([t]) => { const el = $q('#tbl-' + t, col); if (el) el.style.display = t === id ? '' : 'none'; });
      $all('button', bar).forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); };
    TABS.forEach(([id, label]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = id; b.setAttribute('role', 'tab');
      b.textContent = label + (id === 'ledger' && np ? ' (' + np + ')' : ''); b.onclick = () => { SFX.play('pick'); show(id); }; bar.appendChild(b); });
    col.insertBefore(bar, col.firstChild); show(TABS.some(t => t[0] === UX.tab) ? UX.tab : 'ambition');
    // sticky footer
    $all('#ux-foot', inner).forEach(e => e.remove());
    const sel = META.board && META.board[MU.contract]; if (!sel) return;
    const over = META.roster.length > rosterCap();
    const foot = document.createElement('div'); foot.id = 'ux-foot';
    const pay = sel.pay + 'gp' + (sel.edges && sel.edges.includes('terms') ? ' +20%' : '');
    const title = sel.title || OBJECTIVES[sel.obj].name, n = MU.ids.length;
    let note = '';
    if (!sel.council) note = 'The War Council has not been rolled: you can still march on the terms as they stand.';
    else if (sel.picks > 0) note = 'You can still choose ' + sel.picks + ' Contract Edge' + (sel.picks > 1 ? 's' : '') + ' above.';
    const squadNote = n >= 3 ? '' : !META.roster.length ? 'No squad yet: your Leader would march alone. Hire Squad Mates at the campfire first (the HIRE button).'   /* Index 83d */
      : !n ? 'Nobody is picked to march. Click Squad Mates in Who Marches.' : 'A small squad (' + n + '): ' + (META.roster.length > n ? 'pick more of your Squad Mates in Who Marches, or ' : '') + 'hire at the campfire before you march.';
    foot.innerHTML = `<div class="fc"><small>Contract</small><b title="${esc2(title)}">${esc2(title)}</b></div>
      <div class="fs"><small>Pay</small><b>${pay}</b></div><div class="fs"><small>Squad</small><b>${n} / 5</b></div>
      <button class="btn gold" ${over ? 'disabled' : ''} onclick="deploy()">SIGN AND MARCH</button>
      ${over ? `<p class="fw">Roster over capacity (${META.roster.length} / ${rosterCap()}): release someone first.</p>` : ''}${squadNote ? `<p class="fa">${esc2(squadNote)}</p>` : ''}${!over && note ? `<p class="fn">${esc2(note)}</p>` : ''}`;
    inner.appendChild(foot);
  }
  { const f = renderTable; renderTable = function(){ const r = f.apply(this, arguments); safe('table', tableExtras); return r; }; }
  { const f = openTable;
    openTable = function(focus){
      if (focus && TABS.some(t => t[0] === focus)) UX.tab = focus;
      const r = f.apply(this, arguments);
      safe('table top', () => { if (!focus){ const s = $q('#screen-table'); if (s) s.scrollTop = 0; } });
      return r;
    };
  }

  /* ---- J-04: the HUD scales with the window ---------------------------------- */
  const hudSet = () => { try { return settings().hudSize || 'auto'; } catch (e) { return 'auto'; } };
  function hudK(){
    const s = hudSet(), ts = typeof textScale === 'function' ? textScale() : 1;   /* Index 83c: text size multiplies the panel scale; fonts inside are not scaled again */
    const base = s === 'auto' ? Math.min(1.6, Math.max(1, VH / 760)) : (+s || 100) / 100;
    return Math.max(0.75, Math.min(base * ts, VW / 1000, VH / 620, 2));   // never wider than the 1000 x 620 design layout
  }
  UX.hudK = hudK;
  const FILL = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
  const BRIGHT = {'#aaa':'#d6cbb6', '#aaaaaa':'#d6cbb6', '#c8bca8':'#e8dfcb', '#cdbf9f':'#e6dcc3', '#bbb':'#e0d8c6', '#bbbbbb':'#e0d8c6'};
  function hookFill(){
    if (!ctx || ctx.__ux83f) return; ctx.__ux83f = true;
    Object.defineProperty(ctx, 'fillStyle', {configurable:true, get(){ return FILL.get.call(this); },
      set(v){ if (UX.inHud && typeof v === 'string' && BRIGHT[v]) v = BRIGHT[v]; FILL.set.call(this, v); }});
  }
  { const f = drawSeasonOverlay;       // the weather is not HUD: draw it in the true frame
    drawSeasonOverlay = function(cx, cy, w, h, t, mode){
      if (!UX.inHud || !(UX.k > 1.001 || UX.k < 0.999) || !G || !G.leader) return f.apply(this, arguments);
      return camWorld(v => f.call(this, v.x, v.y, w, h, t, mode));   /* A2: the zoomed world in the true frame (deployment.js camWorld) */
    };
  }
  { const f = drawHUD;
    drawHUD = function(){
      if (!G) return f.apply(this, arguments);
      hookFill();
      const k = hudK(), ow = VW, oh = VH, m = CAMP.mouse, mx = m.x, my = m.y;
      UX.k = k; UX.vw = ow; UX.vh = oh; UX.inHud = true;
      VW = ow / k; VH = oh / k; m.x = mx / k; m.y = my / k;
      ctx.save(); ctx.scale(k, k);
      const tp = G.tip; UX.tp = tp; if (tp && UX.drawTip) G.tip = null;   /* Index 83e: the tip is drawn after the squad strip, clear of the left panels */
      try { f.apply(this, arguments); safe('squad strip', () => squadStrip()); safe('hint43', () => UX.hint43()); if (tp && UX.drawTip){ G.tip = tp; safe('tip', () => UX.drawTip()); } }
      finally {
        ctx.restore(); VW = ow; VH = oh; m.x = mx; m.y = my; UX.inHud = false;
        safe('momentum rects', () => { const ch = G && G.momChoice; if (ch && ch.rects && !ch.rects.__ux && k !== 1){
          ch.rects = ch.rects.map(r => ({x:r.x * k, y:r.y * k, w:r.w * k, h:r.h * k})); ch.rects.__ux = true; } });
      }
    };
  }

  /* ---- J-05: the leader card rows ------------------------------------------- */
  const SHAPE = {'#87ceeb':'diamond', '#d4af37':'square', '#a0784f':'square', '#d47a6a':'circle', '#6fa37a':'bar', '#f0c96a':'tri'};
  { const f = pips;
    pips = function(x, y, n, max, on){
      if (!UX.inHud || !SHAPE[on]) return f.apply(this, arguments);
      if (UX.pg !== G){ UX.pg = G; UX.prev = {}; UX.fl = {}; }
      const kind = SHAPE[on], step = 11;
      for (let i = 0; i < max; i++){
        const cx = x + i * step + 4, cy = y + 4, full = i < n;
        ctx.beginPath();
        if (kind === 'diamond'){ ctx.moveTo(cx, cy - 5); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx - 5, cy); ctx.closePath(); }
        else if (kind === 'circle') ctx.arc(cx, cy, 4.2, 0, TAU);
        else if (kind === 'tri'){ ctx.moveTo(cx, cy - 5); ctx.lineTo(cx + 5, cy + 4); ctx.lineTo(cx - 5, cy + 4); ctx.closePath(); }
        else if (kind === 'bar') ctx.rect(cx - 4, cy - 3, 8, 7);
        else ctx.rect(cx - 4, cy - 4, 8, 8);
        if (full){ ctx.fillStyle = on; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(245,239,227,.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(245,239,227,.4)'; ctx.lineWidth = 1; ctx.stroke(); }
      }
      const ta = ctx.textAlign; ctx.textAlign = 'left'; ctx.fillStyle = '#e8dfcb'; ctx.font = 'bold 10.5px Georgia'; ctx.fillText(n + '/' + max, x + max * step + 4, y + 8.5); ctx.textAlign = ta;
      const pv = UX.prev[on]; if (pv != null && n < pv) UX.fl[on] = G.frame + 40; UX.prev[on] = n;
      if (UX.fl[on] > G.frame){ const a = (UX.fl[on] - G.frame) / 40;
        ctx.strokeStyle = 'rgba(255,70,50,' + (0.4 + 0.6 * a).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.strokeRect(x - 5, y - 3, max * step + 36, 14); }
    };
  }

  /* ---- J-11: the squad portrait strip ----------------------------------------- */
  function stripOn(){ try { return settings().squadStrip !== false; } catch (e) { return true; } }
  /* BR1 (2026-11-12): the strip drew the 34 px pixel bust while the roster and the leader's HUD show the painted portrait. faceOf
     loads the same URL the roster uses (portraitURL: the painted portrait when the person has one, the framed bust otherwise) into
     an Image once per person; until it has loaded, or without portraits, the bust is drawn as before. */
  const FACES = new Map();
  function faceOf(p){
    try {
      const k = personKey(p, false); let f = FACES.get(k);
      if (!f){ f = {img: new Image(), ok: false}; FACES.set(k, f); const u = portraitURL(p, false); if (!u) return null; f.img.onload = () => { f.ok = true; }; f.img.src = u; }
      return f.ok && f.img.naturalWidth ? f.img : null;
    } catch (e) { return null; }
  }
  function squadStrip(){
    if (!G || !G.squad || !G.squad.length || !stripOn() || window.DECK) return;   /* INDEX HD1: the Deck's cards replace the strip */
    const rows = 5 + (G.mountMax > 0 ? 1 : 0);                      // WARDS, SHIELD, [MOUNT], WOUNDS, CON, LUCK
    const top = 14 + 76 + rows * 14 + 6, S = 44, gap = 8, mates = G.squad.slice(0, 5), w = mates.length * (S + gap) + gap;
    panel(10, top, Math.min(300, w + 4), S + 36);
    mates.forEach((m, i) => {
      const x = 16 + i * (S + gap), y = top + 8, dead = m.state === 'dead', down = m.state === 'bleeding' || m.state === 'stable';
      ctx.fillStyle = '#3a3226'; ctx.fillRect(x, y, S, S);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
      try {
        ctx.globalAlpha = dead ? 0.35 : down ? 0.6 : 1;
        const fc = faceOf(m.p);
        if (fc){ ctx.imageSmoothingEnabled = true; const k = Math.max(S / fc.naturalWidth, S / fc.naturalHeight), w = fc.naturalWidth * k, h = fc.naturalHeight * k; ctx.drawImage(fc, x + (S - w) / 2, y, w, h); ctx.imageSmoothingEnabled = false; }   /* BR1: the painted portrait, cover-fit from the top */
        else { ctx.imageSmoothingEnabled = false; ctx.drawImage(personBust(m.p, false), x, y, S, S); }
      } catch (e) {}
      ctx.restore(); ctx.globalAlpha = 1;
      ctx.strokeStyle = dead ? '#7a2a22' : down ? '#e0a030' : '#d4af37'; ctx.lineWidth = 1.5; ctx.strokeRect(x + .5, y + .5, S - 1, S - 1);
      const fr = dead ? 0 : Math.max(0, Math.min(1, m.con / (m.maxCon || 1)));
      ctx.fillStyle = '#000'; ctx.fillRect(x, y + S + 3, S, 6);
      ctx.fillStyle = fr > 0.6 ? '#6fa37a' : fr > 0.3 ? '#d4af37' : '#d4503a'; ctx.fillRect(x + 1, y + S + 4, Math.round((S - 2) * fr), 4);
      ctx.textAlign = 'center';
      if (dead){ ctx.strokeStyle = '#e03030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + S - 6, y + S - 6); ctx.moveTo(x + S - 6, y + 6); ctx.lineTo(x + 6, y + S - 6); ctx.stroke(); }
      else if (down){ ctx.font = 'bold ' + (typeof hudPx === 'function' ? hudPx(10.5) : 10.5) + 'px Georgia'; ctx.fillStyle = '#000'; ctx.fillText('DOWN', x + S / 2 + 1, y + S - 4); ctx.fillStyle = '#ffd890'; ctx.fillText('DOWN', x + S / 2, y + S - 5); }
      ctx.textAlign = 'left';
    });
    { const fNh = typeof hudPx === 'function' ? hudPx(10.5) : 10.5; ctx.font = fNh + 'px Georgia'; ctx.fillStyle = '#c8bca8'; ctx.textAlign = 'left'; ctx.fillText('[N] hide', 16, top + S + 15.5 + fNh); }
    if (!UX.stripTip && G.frame > 300 && !G.tip && !(UX.tq && UX.tq.length)){ UX.stripTip = true; tip('squadstrip'); }   /* Index 83c: after the first tips have been read */
  }
  TIPS.squadstrip = 'The portraits under your Leader show each Squad Mate’s Condition. A red X is dead. N hides them.';
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 'n' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !G || G.paused) return;
    const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    if (document.querySelector('#screen-create:not(.hidden) .cr2')) return;   /* the Founding Creator is open: its keys are not the fight's */
    settings().squadStrip = !stripOn(); saveMeta();
  });

  /* ---- HUD size setting and the backup button ---------------------------------- */
  { const f = settingsHTML;
    settingsHTML = function(dark){
      const h = f(dark);
      const s = hudSet(), o = (v, l) => `<option value="${v}" ${String(s) === v ? 'selected' : ''}>${l}</option>`;
      const add = `<label title="Size of the panels and bars during a contract">HUD size <select onchange="setSetting('hudSize', this.value)">${o('auto', 'Auto')}${o('100', '100%')}${o('125', '125%')}${o('150', '150%')}</select></label>`
        + (SAVE_KEY === MAIN_SLOT && META && META.leader ? `<button class="btn small" style="font-size:14px;padding:4px 10px" onclick="uxBackups()">Restore a backup…</button>` : '');
      const i = h.lastIndexOf('</div>'), a2 = add + (UX.backupLine ? UX.backupLine() : ''); return i < 0 ? h + a2 : h.slice(0, i) + a2 + h.slice(i);
    };
  }

  /* ---- J-07: rolling backups ---------------------------------------------------------- */
  const BK = () => [1, 2, 3].map(i => MAIN_SLOT + '_bk' + i);
  function bkList(){ return BK().map(k => { try { const v = JSON.parse(localStorage.getItem(k)); return v && v.raw ? v : null; } catch (e) { return null; } }); }
  function bkMake(label){
    try {
      if (SAVE_KEY !== MAIN_SLOT || !META || !META.leader || UX.stopped) return false;   /* Index 83e */
      saveMeta(); const raw = localStorage.getItem(MAIN_SLOT); if (!raw) return false;
      const L = bkList(), keys = BK();
      const entry = {when:Date.now(), label:label || 'Backup', leader:META.leader.name, season:seasonName(), gold:META.treasury, contracts:META.deployments || 0, raw};
      const write = () => { for (let i = 2; i >= 1; i--) if (L[i - 1]) localStorage.setItem(keys[i], JSON.stringify(L[i - 1])); localStorage.setItem(keys[0], JSON.stringify(entry)); };
      try { write(); } catch (e) { localStorage.removeItem(keys[2]); L[1] = null; write(); }
      return true;
    } catch (e) { console.warn('Index 83b backup:', e); return false; }
  }
  UX.backup = bkMake; UX.bkList = bkList;   /* Index 83e */
  { const f = endDeployment;
    endDeployment = function(result){
      const s0 = (META && META.leader) ? seasonName() : null;
      const r = f.apply(this, arguments);
      safe('season backup', () => { if (s0 && SAVE_KEY === MAIN_SLOT && META && META.leader && seasonName() !== s0) bkMake('New season'); });
      return r;
    };
  }
  window.uxBackups = function(){
    $all('#ux-bk').forEach(e => e.remove());
    const box = document.createElement('div'); box.id = 'ux-bk';
    const L = bkList(), fmt = t => new Date(t).toLocaleString([], {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
    box.innerHTML = `<div class="bx"><h2>Backups</h2><div style="font-size:14px;margin:4px 0 8px">A copy is kept at every change of season (three at most, the oldest drops off). Restoring one replaces the campaign you are playing, and backs it up first.</div>`
      + L.map((b, i) => b ? `<div class="brow"><div class="g"><b>${esc2(b.leader)}</b> · ${esc2(b.season)} · ${b.gold}gp · ${b.contracts} contract${b.contracts === 1 ? '' : 's'}<small>${esc2(b.label)}, saved ${fmt(b.when)}</small></div><button class="btn small" onclick="uxRestore(${i})">Restore</button></div>`
        : `<div class="brow"><div class="g" style="color:#6a5a44;font-style:italic">Empty slot</div></div>`).join('')
      + `<div style="margin-top:10px;text-align:right"><button class="btn small" onclick="uxBackupNow()">Back up now</button><button class="btn small" onclick="document.getElementById('ux-bk').remove()">Close</button></div></div>`;
    box.addEventListener('mousedown', e => { if (e.target === box) box.remove(); });
    document.body.appendChild(box);
  };
  window.uxBackupNow = function(){ const ok = bkMake('Manual backup'); campNote(ok ? 'Backed up.' : 'Nothing to back up yet.', ok ? 'good' : 'bad'); uxBackups(); };
  window.uxRestore = function(i){
    const b = bkList()[i]; if (!b) return;
    const bx = $q('#ux-bk'); if (bx) bx.remove();
    askConfirm('Restore this backup?', `<b>${esc2(b.leader)}</b>, ${esc2(b.season)}, ${b.gold}gp. The campaign you are playing now will be replaced (it is backed up first).`, () => {
      bkMake('Before restoring');
      try { const m = JSON.parse(b.raw);
        META = (typeof migrateMeta === 'function') ? migrateMeta(m) : Object.assign(freshMeta(), m); saveMeta(); applySkin(); G = null; CAMP.dirty = true; if (typeof MU !== 'undefined') MU = null;
        const tb = $q('#tb-settings'); if (tb) tb.remove(); showSplash(); campNote('Backup restored.', 'good');
      } catch (e) { askAlert('Could not restore', 'That backup could not be read (' + esc2(e.message) + ').'); }
    }, {ok:'RESTORE', danger:true});
  };

  /* ---- J-12: plain-English one-liners ---------------------------------------------------- */
  const PL_SPEC = {Soldier:'Front-line fighter. Takes hits and cuts through crowds.', 'Folk Hero':'Archer. Shoots fast from a safe distance.', Scoundrel:'Knife-fighter. Does most harm to someone already busy.',
    Cleric:'Healer. Keeps the squad on its feet.', Mage:'Wizard. Magic darts that do not miss.', Witch:'Hexer. Weakens and slows what you cannot kill yet.'};
  const PL_SPEC46 = {Soldier:'Takes hits and cuts through crowds.', 'Folk Hero':'Shoots fast from a safe distance.', Scoundrel:'Does most harm to someone already busy.',   /* F-46: no nickname prefixes */
    Cleric:'Keeps the squad on its feet.', Mage:'Magic darts that do not miss.', Witch:'Weakens and slows what you cannot kill yet.'};
  const PL_GEAR = {'Rags':'Barely clothes. Better than nothing.', 'Padded Gambeson':'Light and cheap. Takes the edge off a blow.', 'Hardened Leather':'Light armour that turns the odd blow.',
    'Studded Brigandine':'Light armour stiffened with studs. Blows glance off more often.', 'Chain Shirt':'Light armour that also gives a Ward Token each fight.',
    'Thick Hide & Furs':'Medium armour. Tougher, but you walk a step slower.', 'Scale Hauberk':'Medium armour. Strong, but a step slower.', 'Heavy Chainmail':'Heavy mail. Hard to hurt, a step slower.',
    'Cuirass / Breastplate':'Strong plate for the chest. A step slower.', 'Splint Mail':'Heavy plates. Strong, and two steps slower.', 'Banded Lamellar':'Plates that shrug off grazes. Two steps slower.',
    'Half-Plate':'The best armour money buys. Shrugs off grazes. Two steps slower.', 'Light Bucklers':'Small shields. A little protection each fight.', 'Heavy Infantry Shields':'Big shields. A deep pool of protection each fight.',
    'Masterwork Full Plate':'The best plate there is. Grazing hits do nothing, and the first solid hit each round only grazes. Slow. Needs a veteran smith.', 'Runed Deep-Iron Plate':'Dwarf-made heavy plate that shrugs off grazes and slows you less than other plate. Needs the dwarves on your side.',
    'Elven Mail':'Light mail with no speed penalty and a Ward Token each contract. Costly, and it needs a smith and a leatherworker.', 'Bastion Shields':'Iron-faced tower shields. The deepest pool of protection, for the shield wall.'};   /* Index 83f */
  const PL_DOC = {Concealment:'Creep up on sleeping camps: guards spot you from about half as far.', 'Earthworks & Traps':'Stakes are in the ground before the fight begins.',
    'Spear Wall Mastery':'Spears hold firm: charging enemies run into a harder wall.', 'Shield Wall Lock':'In a Shield Wall, the squad steadies each round and blows land softer.',
    'Push Through':'Charge them, and the survivors may lose their nerve.', 'Skirmisher Drill':'Skirmishers are ready from the first minute.', 'Volley Fire':'Archers loose together from the first minute.',
    'Feigned Retreat':'Fall back, and anyone who chases you into the open pays for it.', 'Field Medicine':'Medics are ready from the start and get people up in half the time.',
    'Plunder Management':'Looting is already drilled before you march.', 'Munitions Drill':'Sharpers (demolition kits) are ready from the first minute.', 'Propaganda & Parley':'Talk the enemy down: Parley rolls improve by one step.',
    'Pike Square':'With long spears or pikes, charging enemies lose their charge bonus, and a squad in a Shield Wall strikes first at anyone closing in.', 'Fire Line':'Stand still and your archers shoot better. Needs a bow or crossbow.',
    'Wedge Formation':'Your charge goes one hex further and a melee crit hits harder, but flanks catch you more easily while charging.', 'Fortification Breaching':'Double damage to nests, siege engines and Plague Obelisks.',
    'Read the Small Print':'War Council: once a contract, turn down a job after seeing the patron and draw another, free. Otherwise walking away costs 1 Standing.', 'The Courier Net':'War Council: the job board always shows one extra contract.',
    'Hard Bargainers':'War Council: say so before the roll, then re-roll one die once and keep the better.', 'Ledger and Seal':'War Council: a fighting withdrawal pays in full once the job is half done. Otherwise it pays half.',
    'Quartered in Advance':'War Council: say so before the roll. You start with one free Contract Edge (not Better Terms).'};   /* Index 83f */
  function plainify(){
    $all('.card:not([data-ux83p])').forEach(c => {
      if (c.closest('#askbox')) return;
      const t = $q('.ttl', c); if (!t) return;
      const name = t.textContent.trim(), line = PL_SPEC46[name] || PL_GEAR[name]; if (!line) return;
      c.dataset.ux83p = '1';
      const p = document.createElement('div'); p.className = 'ux-plain'; p.textContent = line;
      const d = $q('.desc', c), role = $q('.role', c);
      (role || t).after(p);
      if (d && PL_SPEC[name]){ const det = document.createElement('details'); det.className = 'ux-det'; det.innerHTML = '<summary>Details</summary>'; d.before(det); det.appendChild(d); det.addEventListener('click', e => e.stopPropagation()); }
    });
    $all('.gcard:not([data-ux83p])').forEach(c => {       // Quartermaster and Market gear cards
      const n = $q('.gc-name', c); if (!n) return; c.dataset.ux83p = '1';
      const line = PL_GEAR[n.textContent.trim()]; if (!line) return;
      const p = document.createElement('div'); p.className = 'ux-plain'; p.style.fontSize = '14px'; p.textContent = line; n.after(p);
    });
    $all('#tbl-doctrines .line:not([data-ux83p])').forEach(l => {
      const b = $q('b', l); if (!b) return; const line = PL_DOC[b.textContent.trim()]; l.dataset.ux83p = '1'; if (!line) return;
      const g = $q('.grow', l), span = g && $q(':scope > span[style*="font-size:14px"]', g); if (!span) return;
      const p = document.createElement('div'); p.className = 'ux-plain'; p.textContent = line;
      const det = document.createElement('details'); det.className = 'ux-det'; det.innerHTML = '<summary>Details</summary>';
      const br = span.previousElementSibling; span.before(p); span.before(det); det.appendChild(span); if (br && br.tagName === 'BR') br.remove();
    });
  }
  let plT = 0;
  new MutationObserver(() => { clearTimeout(plT); plT = setTimeout(() => safe('plain', plainify), 30); }).observe(document.body, {childList:true, subtree:true});
  UX.plainify = plainify;
})();
/* ===== END INDEX 83b ====================================================== */

/* ============================================================================
   INDEX 83c - UX FIXES FROM THE ROUND 2 RE-AUDIT
   R2-03  Tips queue instead of overwriting each other (the WASD tip was never
          seen). The squad-strip tip waits until the first ones have been read.
   R2-04  The "save changed in another tab" box is a small bottom-right notice
          that fades after ten seconds, instead of covering the objective.
   R2-05  No "upkeep -0gp" chip while nothing is built and nothing is owed.
   R2-06  "NEXT:" and "TAKE THE CHAIR" give a reason when disabled (in 83).
   R2-07  The hint strip shortens after three finished contracts, not three
          camp redraws (in 83).
   R2-08  The Effects slider stays on the pause screen (in 83).
   R2-02  (bugs audit) Text size and the HUD scale compose: the HUD is scaled as
          a whole by base x text size, and fonts drawn inside it are not scaled
          a second time by Index 79. The scale is also capped so the HUD never
          needs more than 1000 x 620 units to lay out (wider windows keep room,
          narrow ones shrink it instead of overlapping).
   ROLLBACK  Delete from this comment to END INDEX 83c and undo the three
             marked "Index 83c" edits above.
============================================================================ */
(function(){
  const UX = window.UX83 = window.UX83 || {};
  const safe = (n, fn) => { try { return fn(); } catch (e) { console.warn('Index 83c ' + n + ':', e); } };
  const st = document.createElement('style');
  st.textContent = `#tab-warn{left:auto !important;right:12px;top:auto !important;bottom:12px;transform:none !important;max-width:min(300px,86vw) !important;
    font-size:14px !important;padding:8px 30px 8px 12px !important;z-index:120 !important;animation:uxtabw .6s ease 10s forwards}
    @keyframes uxtabw{to{opacity:0;visibility:hidden}}`;
  document.head.appendChild(st);

  /* R2-02: fonts inside the scaled HUD are already scaled with the panels */
  { const f = fixFont;
    fixFont = function(v){
      if (!UX.inHud) return f.apply(this, arguments);
      return String(v).replace(/(\d+(?:\.\d+)?)px/, (m, n) => (Math.round(Math.max(10.5, parseFloat(n)) * 2) / 2) + 'px');
    };
  }

  /* R2-03: a tip queue */
  { const f = tip;
    tip = function(id){
      if (!G){ return f.apply(this, arguments); }
      if (UX.tg !== G){ UX.tg = G; UX.tq = []; }
      const cur = G.tip, before = META && META.tipsSeen && META.tipsSeen[id];
      f.apply(this, arguments);
      if (!before && cur && cur.life > 20 && G.tip && G.tip !== cur){ UX.tq.push(G.tip); G.tip = cur; }
    };
  }
  { const f = drawHUD;
    drawHUD = function(){
      const r = f.apply(this, arguments);
      safe('tip queue', () => { if (G && UX.tg === G && UX.tq && UX.tq.length && !G.tip){ G.tip = UX.tq.shift(); G.tip.life = 540; } });
      return r;
    };
  }

  /* R2-05: no empty ledger chip */
  { const f = renderTopbar;
    renderTopbar = function(){
      const r = f.apply(this, arguments);
      safe('ledger chip', () => {
        const tb = document.getElementById('topbar'); if (!tb) return;
        [...tb.querySelectorAll('span.stat')].forEach(c => { const t = c.textContent.trim();
          if ((/^Ledger:/.test(t) || /^\u2692/.test(t)) && /-0gp/.test(t) && !/building/.test(t) && !/^\u2692\s*\d/.test(t)) c.remove(); });
      });
      return r;
    };
  }
})();
/* ===== END INDEX 83c ====================================================== */

/* ============================================================================
   INDEX 83d - NEW-PLAYER GUIDANCE (bundle A, from audits/ux-r2.md)
   UX2-01  A new Chapter with no Squad Mates is pointed at the Hiring Line:
           HIRE is gold and pulses, PLANNING TABLE loses its gold, and one
           camp note says what to do (once per campaign).
   UX2-02  The Hiring Line shows each recruit's stats as chips (Con, Mv, Melee,
           Ranged, Magic) with their role word, and hiring gives a toast.
   UX2-03  The first tip is followed at once by "tips show once; turn them off
           or back on in Settings > Tips".
   UX2-05  The Planning Table footer has an amber note when fewer than three
           Squad Mates are picked to march (in Index 83b's footer).
   UX2-04  "FIELD REPORT | undefined" was a test artefact: it appears only when
           endDeployment is called by hand with a result the game does not use
           ('win'); the real results (victory, withdrawn, fled, fallen) have
           headings. Nothing to fix.
   ROLLBACK  Delete from this comment to END INDEX 83d and the "Index 83d"
             edits in Index 83 / 83b above (the chips export and the footer note).
============================================================================ */
(function(){
  const UX = window.UX83 = window.UX83 || {};
  const safe = (n, fn) => { try { return fn(); } catch (e) { console.warn('Index 83d ' + n + ':', e); } };
  const needSquad = () => !!(META && META.leader && META.founded && !(typeof inStoryNow === 'function' && inStoryNow()) && META.roster.length === 0 && !(META.deployments > 0));
  UX.needSquad = needSquad;
  const st = document.createElement('style');
  st.textContent = `#topbar .tb.ux-pulse{animation:uxpulse 1.8s ease-in-out infinite}
    @keyframes uxpulse{0%,100%{box-shadow:0 0 0 0 rgba(255,216,96,.0)}50%{box-shadow:0 0 0 4px rgba(255,216,96,.75)}}
    @media (prefers-reduced-motion:reduce){#topbar .tb.ux-pulse{animation:none;box-shadow:0 0 0 3px rgba(255,216,96,.75)}}
    #topbar .tb.ux-quiet{background:#4a3624;color:#d8ccb4}`;
  document.head.appendChild(st);

  /* UX2-01: point at the Hiring Line while the roster is empty */
  { const f = renderTopbar;
    renderTopbar = function(){
      const r = f.apply(this, arguments);
      safe('topbar', () => {
        if (!needSquad()) return;
        document.querySelectorAll('#topbar button.tb').forEach(b => { const t = b.textContent.trim();
          if (t === 'HIRE'){ b.classList.add('gold', 'ux-pulse'); b.title = 'Start here: hire your first Squad Mates at the campfire'; }
          else if (t === 'PLANNING TABLE' || t === 'WAR TABLE'){ b.classList.remove('gold'); b.classList.add('ux-quiet'); b.title = 'You will want a squad before you pick a contract'; } });
      });
      return r;
    };
  }
  { const f = renderTitle;
    renderTitle = function(){
      const r = f.apply(this, arguments);
      safe('hire note', () => {
        if (!needSquad() || META.uxHireNoted) return;
        META.uxHireNoted = true; saveMeta();
        setTimeout(() => { if (needSquad()) campNote('Next: hire a squad. Press H, or click HIRE, to see who is waiting at the campfire.', 'info'); }, 500);
      });
      return r;
    };
  }

  /* UX2-01: the Chapter House panel offers the campfire first */
  { const f = renderPanel;
    renderPanel = function(){
      const r = f.apply(this, arguments);
      safe('house panel', () => {
        if (!needSquad() || !CAMP.panel || CAMP.panel.kind !== 'house') return;
        const p = document.getElementById('camp-panel'), go = [...p.querySelectorAll('button.btn')].find(b => /GO TO THE (PLANNING|WAR) TABLE/.test(b.textContent)); if (!go) return;
        const hire = document.createElement('button'); hire.className = 'btn gold'; hire.textContent = 'HIRE YOUR FIRST SQUAD AT THE CAMPFIRE';
        hire.onclick = () => { centreCamOn(HUB.fire.x, HUB.fire.y); openPanel('fire', 'fire'); };
        go.classList.remove('gold'); go.textContent = 'PLANNING TABLE (HIRE FIRST)'; go.before(hire);
      });
      return r;
    };
  }

  /* UX2-02: the Hiring Line in words */
  { const f = hiringHTML;
    hiringHTML = function(){
      let h = f.apply(this, arguments);
      safe('hiring', () => {
        const L = hireLine();
        (L.recruits || []).forEach(r => { if (!r) return;
          const line = `<span style="font-size:14px">${mateLine(r)}</span>`;
          if (UX.chipsHTML) h = h.replace(line, UX.chipsHTML(r));
          const who = `<b>${esc(r.name)}</b><br>`;
          h = h.replace(who, `<b>${esc(r.name)}</b> <span class="ux-role">${SPECS[r.spec].role}</span><br>`); });
      });
      return h;
    };
  }
  { const f = hireCamp;
    hireCamp = function(i){
      let r = null, gp = 0, n0 = META.roster.length;
      safe('hire pre', () => { r = hireLine().recruits[i]; gp = r ? hireGP(r) : 0; });
      const out = f.apply(this, arguments);
      safe('hire toast', () => { if (r && META.roster.length > n0) campNote(`${r.name} hired${gp ? ' for ' + gp + 'gp' : ' (free)'}. Treasury ${META.treasury}gp. ${META.roster.length} Squad Mate${META.roster.length === 1 ? '' : 's'} on the roster.`, 'good'); });
      return out;
    };
  }

  /* UX2-03: say how to turn tips off, in the first tip's wake */
  TIPS.tipsoff = 'Each tip shows once. Settings \u2192 Tips turns them off, and "Show tips again" brings them back.';
  { const f = tip;
    tip = function(id){
      const first = id === 'move' && META && !(META.tipsSeen && META.tipsSeen.move);
      const r = f.apply(this, arguments);
      if (first){ if (window.T45 && T45.holdTipsoff && T45.holdTipsoff()) G.tipsoffWait = true; else safe('tipsoff', () => f.call(this, 'tipsoff')); }
      return r;
    };
  }
})();
/* ===== END INDEX 83d ====================================================== */

/* ============================================================================
   INDEX 83e - UX BUNDLE B (from the round 2 re-audit)
   UX2-06  A gold dot on the Prisoners tab (a prisoner is held) and on the
           Doctrines tab (a doctrine can be bought now).
   UX2-07  Settings > Save shows "Last backup: ..." so players know it exists.
   UX2-08  A two-tab guard. The newer tab asks "Take over this save?". The tab
           that loses stops saving and says so in a small notice with a Take
           over button. Replaces the Index 82 / 83c corner notice (its flag
           TABWARN82 is set so that listener stays quiet).
           Lock key: dust_cloaks_tab_lock = {id, t}. The owner refreshes it
           every 5 s and clears it when the page closes. A lock older than 2
           minutes counts as left behind by a crash (commander: now 20 s).
   UX2-09  Left/Right/Home/End move between the table tabs (roving tabindex),
           and rolling the War Council puts focus on SIGN AND MARCH.
   UX2-10  On small windows the HUD key strip wraps onto two lines.
   ROLLBACK  Delete from this comment to END INDEX 83e, and undo the one edit
             marked "Index 83e" in the SEC list of Index 83.
============================================================================ */
(function(){
  const UX = window.UX83 = window.UX83 || {};
  const safe = (n, fn) => { try { return fn(); } catch (e) { console.warn('Index 83e ' + n + ':', e); } };
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
  const $q = (s, r) => (r || document).querySelector(s), $all = (s, r) => [...(r || document).querySelectorAll(s)];
  const css = document.createElement('style');
  css.textContent = `
  .ux-tabs button .ux-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffcf4a;border:1px solid #5a3a10;margin-left:6px;vertical-align:middle;box-shadow:0 0 5px #ffcf4a}
  #ux-guard{position:fixed;left:50%;transform:translateX(-50%);top:62px;right:auto;bottom:auto;z-index:130;max-width:min(320px,86vw);box-sizing:border-box;background:#3a1a10;color:#f6e6c8;border:2px solid #d4a040;border-radius:4px;
    padding:8px 12px;font:14px/1.4 Georgia,serif;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  #ux-guard{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;padding:4px 10px;max-width:none}
  #ux-guard button{display:inline-block !important;margin-top:0 !important;padding:2px 8px !important;pointer-events:auto !important}
  #ux-guard.dock{transform:none !important;box-shadow:none;overflow:hidden;font-size:14px;padding:2px 6px;z-index:130}
  #ux-guard.dock span{overflow:hidden;text-overflow:ellipsis}
  #ux-guard button{display:block;margin-top:6px;font:bold 14px Georgia;padding:4px 10px;cursor:pointer;background:#d4a040;color:#2a1a08;border:1px solid #5a3a10;border-radius:3px}
  #tab-warn{display:none !important}
  `;
  document.head.appendChild(css);

  /* ---- UX2-06 + UX2-09: dots and arrow keys on the table tabs --------------------- */
  function docBuyable(){ try { return (DOCTRINES || []).some(d => !hasDoc(d.id) && docReqMet(d) && META.treasury >= d.cost); } catch (e) { return false; } }
  function tabExtras(){
    const bar = $q('.ux-tabs'); if (!bar) return;
    const dots = {ledger: (META.prisoners || []).length ? 'A prisoner is held. See what to do with them.' : '', doctrines: docBuyable() ? 'You can afford a new doctrine.' : ''};
    const btns = [...bar.querySelectorAll('button')];
    btns.forEach(b => {
      b.querySelectorAll('.ux-dot').forEach(d => d.remove());
      const why = dots[b.dataset.tab];
      if (why){ const d = document.createElement('span'); d.className = 'ux-dot'; d.title = why; d.setAttribute('aria-label', why); b.appendChild(d); b.title = why; }
      else b.removeAttribute('title');
    });
    const sync = () => btns.forEach(b => b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1);
    sync();
    btns.forEach(b => b.addEventListener('click', () => setTimeout(sync, 0)));
    bar.addEventListener('keydown', e => {
      const i = btns.indexOf(document.activeElement); if (i < 0) return;
      let j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % btns.length; else if (e.key === 'ArrowLeft') j = (i + btns.length - 1) % btns.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = btns.length - 1;
      if (j < 0) return;
      e.preventDefault(); e.stopPropagation(); btns[j].click(); btns[j].focus();
    });
    if (UX.focusFoot){ UX.focusFoot = false; const fb = $q('#ux-foot .btn'); if (fb && !fb.disabled) fb.focus({preventScroll:true}); }
  }
  { const f = renderTable; renderTable = function(){ const r = f.apply(this, arguments); safe('tab extras', tabExtras); return r; }; }
  { const f = rollCouncil; rollCouncil = function(){ UX.focusFoot = true; return f.apply(this, arguments); }; }

  /* ---- UX2-07: the last backup, in Settings > Save --------------------------------- */
  function ago(t){
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' day' + (Math.round(m / 1440) === 1 ? '' : 's') + ' ago';
  }
  /* the Settings line under the HUD size (UX83.backupLine, called from the HUD size settingsHTML wrapper) */
  UX.backupLine = function(){
    if (!(SAVE_KEY === MAIN_SLOT && META && META.leader)) return '';
    let line;
      try { const L = (UX.bkList ? UX.bkList() : []).filter(Boolean), b = L[0];
        line = b ? `Last backup: ${esc2(b.season)}, ${ago(b.when)}${META.deployments > b.contracts ? ' (' + (META.deployments - b.contracts) + ' contract' + (META.deployments - b.contracts > 1 ? 's' : '') + ' ago)' : ''}`
          : 'No backup yet. One is kept at each change of season.'; } catch (e) { return ''; }
    return `<div style="font-size:14px;opacity:.85;align-self:center">${line}</div>`;
  }

  /* ---- UX2-08: the two-tab guard ------------------------------------------------------ */
  /* QA-4: a reload keeps this tab's id (sessionStorage survives a reload, not a new tab), so a fast reload that
     skipped pagehide recognises its own lock instead of asking "Take over this save?". A duplicated tab is a
     'navigate', not a 'reload', so it still gets a fresh id. */
  const tabId = () => {
    const fresh = Math.random().toString(36).slice(2);
    try {
      const nav = performance.getEntriesByType('navigation')[0], old = sessionStorage.getItem('dust_cloaks_tab_id');
      const id = (nav && nav.type === 'reload' && old) ? old : fresh;
      sessionStorage.setItem('dust_cloaks_tab_id', id); return id;
    } catch (e) { return fresh; }
  };
  const LOCK = 'dust_cloaks_tab_lock', ME = tabId(), STALE = 20000;   /* 4 missed 5 s refreshes: a closed tab that skipped pagehide must not trigger the question. A throttled background owner just loses the lock and stops saving via the storage event, so this stays safe. */
  const rd = () => { try { return JSON.parse(localStorage.getItem(LOCK)); } catch (e) { return null; } };
  let lastWr = 0;   /* Fable job 4: a lock write older than our own latest one is a stale event (a frozen tab catching up), not a take-over */
  const wr = () => { try { lastWr = Date.now(); localStorage.setItem(LOCK, JSON.stringify({id:ME, t:lastWr})); } catch (e) {} };
  let hb = 0;
  function notice(html, btn, fn){
    $all('#ux-guard').forEach(e => e.remove());
    const d = document.createElement('div'); d.id = 'ux-guard'; d.setAttribute('role', 'status'); d.innerHTML = html;
    if (btn){ const b = document.createElement('button'); b.textContent = btn; b.onclick = fn; d.appendChild(b); }
    document.body.appendChild(d); dock();
  }
  /* K95(a) (UX f48): at 1024 the box covered the War Table, brief, HUD and debrief titles. While the camp's topbar shows, it
     sits over the topbar's free middle (.grow) as one short line, the full words in its tooltip. It stays a child of body
     (the topbar's redraw would delete it) and is placed again after each redraw. With no topbar (a contract) it is the same
     short line, placed by the toast lane. */
  function dock(){
    const g = document.getElementById('ux-guard'); if (!g) return;
    const tb = document.getElementById('topbar'), gr = tb && !tb.classList.contains('hidden') && tb.getBoundingClientRect().height > 0 && tb.querySelector('.grow');
    const r = gr && gr.getBoundingClientRect();
    const b = g.querySelector('button'); if (b && !b.dataset.full) b.dataset.full = b.textContent;
    if (b) b.textContent = r && r.width > 120 ? 'Take over' : b.dataset.full;   // docked: the short word, the full one on hover
    if (b) b.title = b.dataset.full;
    if (r && r.width > 120){ g.classList.add('dock'); const s = g.style; s.setProperty('max-width', (r.width - 8) + 'px', 'important');
      const w = g.getBoundingClientRect().width, h = g.getBoundingClientRect().height;
      s.setProperty('left', Math.round(r.left + (r.width - w) / 2) + 'px', 'important'); s.setProperty('top', Math.round(r.top + (r.height - h) / 2) + 'px', 'important'); }
    else if (g.classList.contains('dock')){ g.classList.remove('dock'); ['max-width', 'left', 'top'].forEach(k => g.style.removeProperty(k)); }
  }
  window.addEventListener('resize', () => dock());
  UX.guardDock = dock;
  try { const ob = new MutationObserver(() => { if (document.getElementById('ux-guard')) dock(); });
    const go = () => { const tb = document.getElementById('topbar'); if (tb) ob.observe(tb, {childList: true, attributes: true, attributeFilter: ['class', 'style']}); };
    if (document.getElementById('topbar')) go(); else window.addEventListener('load', go); } catch (e) {}
  function own(){ UX.stopped = false; clearInterval(hb); wr(); hb = setInterval(() => { if (!UX.stopped) wr(); }, 5000); $all('#ux-guard').forEach(e => e.remove()); }
  function stop(why){
    UX.stopped = true; clearInterval(hb);
    notice('<span>Not saving: open in another tab</span>', 'Take over this save here', () => { wr(); location.reload(); });
    const g = document.getElementById('ux-guard'); if (g) g.title = why + ' Saving is switched off in this tab, so it cannot overwrite the other one.';   // K95(a): the full words
  }
  UX.guardStart = function(){
    const l = rd();
    if (l && l.id !== ME && Date.now() - l.t < STALE){
      UX.stopped = true; UX.asking = true;   /* Index 83f (R3-04): no saves, and the other tab's heartbeat must not close the question */
      /* K64 (UX 5eb7f8e): danger mode, so ENTER and ESC mean LEAVE IT (focused, gold); TAKE OVER needs a click or [1] */
      askConfirm('Take over this save?', 'Dust Cloaks is already open in another tab or window with this save. If you take over, the other one stops saving and this one carries on. If you do not, this tab will not save anything.',
        () => { UX.asking = false; safe('reload save', () => { loadMeta(); applySkin(); G = null; showSplash(); }); own(); },   // the other tab may have saved while the question was open
        {ok:'TAKE OVER', cancel:'LEAVE IT', danger:true, onNo:() => { UX.asking = false; stop('This save is open in another tab.'); }});
      safe('K64 gold', () => { const bs = $all('#askbox button'); if (bs[1]) bs[1].classList.add('gold'); });
    } else own();
  };
  window.addEventListener('storage', e => {
    if (e.storageArea !== localStorage || e.key !== LOCK || UX.stopped || UX.asking || !e.newValue) return;
    try { const v = JSON.parse(e.newValue); if (v && v.id !== ME && !(v.t < lastWr)) stop('This save was taken over in another tab.'); } catch (err) {}
  });
  window.addEventListener('pagehide', () => { try { const l = rd(); if (l && l.id === ME) localStorage.removeItem(LOCK); } catch (e) {} });
  safe('quiet 82', () => { TABWARN82 = true; });
  { const f = saveMeta; saveMeta = function(){ if (UX.stopped) return; return f.apply(this, arguments); }; }
  { const f = UX.backup; if (f) UX.backup = function(){ return UX.stopped ? false : f.apply(this, arguments); }; }
  if (document.readyState === 'complete') setTimeout(UX.guardStart, 600); else window.addEventListener('load', () => setTimeout(UX.guardStart, 600));

  /* F-43 U3/U2: a current key hint, top-right under the coin counters (the old line sits under the deck band). Kill switch: HUD43 = false. */
  UX.hint43 = function(){
    if (window.HUD43 === false || !G || G.brawl) return;
    if (VW < 640 && window.K56 !== false) return;   // UX K56: no keyboard on a phone, and the lines ran under IN SIGHT
    const L = ['WASD move · click: move / attack', '[1-6] abilities · [7 8 9] Momentum', '[SPACE] Shield Wall · [Q/R] Luck · [M] map', '[ESC] pause / withdraw'];
    const y0 = UX.hintTop(), f = UX.hintF(), s = UX.hintStep(f);
    ctx.save(); ctx.textAlign = 'right'; ctx.font = f + 'px Georgia'; ctx.globalAlpha = G.frame < 900 ? 1 : 0.62;
    L.forEach((t, i) => { ctx.fillStyle = '#000'; ctx.fillText(t, VW - 13, y0 + 1 + i * s); ctx.fillStyle = i === 3 ? '#ffd27a' : '#e8dcc0'; ctx.fillText(t, VW - 14, y0 + i * s); });
    ctx.restore();
  };

  /* UX K81 (Art 16 Nov): the hints start 18 px under the IN SIGHT box (DECK.sight, js/ui/hud-deck.js, drawn earlier the same
     frame); with 5 or more enemy kinds the box ran over them. DECK.sight is wrapped here to note how many rows it drew.
     Kill switch: K81 = false (baseline 110 again). */
  /* UX text floor (text-floor-1280-ruling.md): the hint strip's font (12 drawing units, raised to 14 screen px) and its line step; the AIM line
     (js/core/mode.js) uses both, on the strip's right edge. hintBottom() is the last hint line's baseline (HUD units). */
  UX.hintF = () => typeof hudPx === 'function' ? hudPx(12) : 12;
  UX.hintStep = f => Math.max(15, Math.ceil((f || UX.hintF()) * 1.25));
  UX.hintTop = function(){
    if (window.K81 === false) return 110;
    try { const D = window.DECK; if (!D || !D.sight) return 110;
      if (!D.sight.k81){ const s = D.sight; D.sight = function(){ const l = s.apply(this, arguments); D.k81 = {f: G.frame | 0, n: (l || []).length}; return l; }; D.sight.k81 = true;
        if (!(window.SIGHT23 !== false && D.sightFixH > 0 && D.sightAt)) return 110; }   // Neon R6 BUG-7 M2: the first frame reads the fixed box too (it gave 110, then 184)
      if (window.SIGHT23 !== false && D.sightFixH > 0 && D.sightAt) return Math.max(110, D.sightAt.y + D.sightFixH + 18);   // P23-BUG-7: the fixed IN SIGHT box bottom, shown or not, so the hints never move
      const s = D.k81; if (!s || !s.n || Math.abs((G.frame | 0) - s.f) > 1) return 110;
      const rows = Math.min(s.n, D.SIGHT || 6), bot = 14 + 26 + rows * (D.sightRH || 16) + (s.n > rows ? (D.sightMH || 14) : 0);   // D.sight's own box: y 14, h 26 + 16 a row (+14 for '+N more')
      return Math.max(110, bot + 18);
    } catch (e) { return 110; }
  };

  /* ---- R2-05 (bugs): the tutorial tip no longer slides under the Leader card and squad strip ---- */
  UX.tipNarrow = 700;   // [S] K55: below this VW the tip box spans the screen, 12 px each side
  /* S6 1i (ruling s6-1i-one-idea.md rules 3 to 5): in a Founding fight a banner waits while a lesson card is open or a gold goal
     call holds the top-centre slot; it is dropped when a lesson has replaced its tip (T45.quieted), or after UX.TIPWAIT frames of
     waiting behind a goal call. UX.tip1i(tip) says 'show', 'wait' or 'drop'; null outside a Founding fight (the old place). */
  UX.TIPWAIT = 1800; UX.SPEECH = /^[^:\u201c"]{1,28}: [\u201c"\u2018']/;
  UX.tip1i = function(t){ try { const D1 = window.DECK, T1 = window.T45; if (!t || !D1 || !D1.l1i || !D1.l1i()) return null;
      if (t.id && T1 && T1.quieted && T1.quieted[t.id]) return 'drop';
      if (T1 && (T1.cur || (T1.gateOn && T1.gateOn()))) return 'wait';
      return 'show'; } catch (e) { return null; } };
  UX.drawTip = function(){
    const t = G.tip; if (!t) return;
    /* UX K58 (Art 16 Nov): no mouse or keys on a phone, so the move tip uses tap words there (window.K58 = false: off) */
    if (VW < 640 && window.K58 !== false && /^WASD moves the Leader/.test(t.text)) t.text = 'Tap an enemy to mark it: your Squad Mates attack the mark. The dashed ring is the Command Radius.';
    if (window.TIP43 !== false && G.frame < 300) return;   /* F-43 U5: nothing pops up in the first 5 s of a fight */
    const st1 = UX.tip1i(t); UX.tipAt = null;
    if (st1 === 'drop'){ G.tip = null; return; }
    if (st1 === 'wait'){ if (!(window.T45 && T45.cur) && (t.waited = (t.waited | 0) + 1) > UX.TIPWAIT) G.tip = null; return; }
    if (st1 === 'show'){   /* S6 1i B: the banner sits in the top-centre slot, centred on the screen axis; 17 / 20 screen px; 70 characters a line at most */
      const D1 = window.DECK, fs = Math.round(D1.px(17, 20) * 2) / 2, pad = D1.px(12, 16), stp = Math.round(fs * 1.35), maxW = Math.min(D1.px(640, 800), D1.slotMaxW());
      t.life--; const a1 = Math.min(1, t.life / 40, (540 - t.life) / 20);
      ctx.save(); ctx.globalAlpha = Math.max(0, a1); ctx.textAlign = 'center'; ctx.font = fs + 'px Georgia';
      const ls = D1.wrapText(t.text, maxW - pad * 2, 70), bw = Math.max(...ls.map(l => ctx.measureText(l).width)) + pad * 2, bh = pad * 2 + (ls.length - 1) * stp + fs * 1.1;
      const bx = VW / 2 - bw / 2, by = D1.slotTop() + (document.getElementById('ux-guard') ? 70 : 0);
      ctx.fillStyle = 'rgba(245,235,215,.95)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#7a3e26'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#2a2520'; ls.forEach((l, i) => ctx.fillText(l, VW / 2, by + pad + fs * 0.9 + i * stp));
      ctx.restore(); ctx.textAlign = 'left';
      UX.tipAt = {x: bx, y: by, w: bw, h: bh, lines: ls};
      if (ls.length > 2 && !t.warned){ t.warned = true; try { T45.log.push('banner over two lines: ' + (t.id || t.text.slice(0, 40))); } catch (e) {} }   // the ruling's rule 7: such words are a lesson, for the Game Designer and the Narrative Designer
      if (t.life <= 0) G.tip = null;
      return; }
    t.life--; const a = Math.min(1, t.life / 40, (540 - t.life) / 20);
    const nar = VW < UX.tipNarrow;   /* K55 (UX): at VW 375 the gap 330..VW-240 was -195 px, one word a line; narrow screens use the full width */
    const left = nar ? 12 : 330, right = nar ? VW - 12 : VW - 240, avail = right - left, mid = (VW >= 1500 || nar) ? VW / 2 : (left + right) / 2;   // wide screens keep the old centred spot
    const fTp = typeof hudPx === 'function' ? hudPx(15) : 15, sTp = Math.max(21, Math.ceil(fTp * 1.4));   /* UX text floor: 14 screen px, the step from the size */
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; ctx.font = fTp + 'px Georgia';
    const full = ctx.measureText(t.text).width + 40, maxW = Math.min(VW - 80, VW >= 1500 ? full : avail);
    let lines = [t.text];
    if (full > maxW){ const words = t.text.split(' '), cap = maxW - 40; lines = ['']; for (const w of words){ const cur = lines[lines.length - 1]; if (cur && ctx.measureText(cur + ' ' + w).width > cap) lines.push(w); else lines[lines.length - 1] = cur ? cur + ' ' + w : w; } }
    const w = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 40), h = 14 + lines.length * sTp + (fTp - 15);
    const ty = G.brawl ? VH - 190 : (VW < 640 && window.K58 !== false) ? 288 :   /* K58 QA d5ef8b3: below the tallest IN SIGHT box (ends at 278) */  (window.TIP43 === false ? 176 : 66 + (document.getElementById('ux-guard') ? 70 : 0));   /* F-43 U5: top of the screen, under the Momentum bar, clear of the lower-left log */   /* QA-1: in a bar fight the top centre holds the timer and wave title, so the tip sits low */
    ctx.fillStyle = 'rgba(245,235,215,.95)'; ctx.fillRect(mid - w / 2, ty, w, h);
    ctx.strokeStyle = '#7a3e26'; ctx.lineWidth = 2; ctx.strokeRect(mid - w / 2, ty, w, h);
    ctx.fillStyle = '#2a2520'; lines.forEach((l, i) => ctx.fillText(l, mid, ty + 7 + fTp + i * sTp));
    ctx.restore(); ctx.textAlign = 'left';
    if (t.life <= 0) G.tip = null;
  };

  /* ---- UX2-10: the HUD key strip wraps on small windows ------------------------------- */
  const KEYS = '[1-6] abilities';
  const small = () => UX.inHud && VW < 1100;   // the HUD is never scaled to less than 1000 units wide, so this is the narrow case
  { const f = panel;
    panel = function(x, y, w, h){
      if (small() && x === 14 && y === VH - 52 && w === 760 && h === 40){ UX.wrapKeys = true; return f.call(this, x, y, Math.min(560, VW - 28), 46); }
      return f.apply(this, arguments);
    };
  }
  function hookText(){
    if (!ctx || ctx.__ux83e) return; ctx.__ux83e = true;
    const ft = ctx.fillText;
    ctx.fillText = function(t, x, y){
      if (UX.wrapKeys && UX.inHud && typeof t === 'string' && t.startsWith(KEYS)){
        UX.wrapKeys = false; const i = t.indexOf('[R]');
        ft.call(this, t.slice(0, i).trim(), x, y - 7); return ft.call(this, t.slice(i).trim(), x, y + 7);
      }
      return ft.apply(this, arguments);
    };
  }
  { const f = drawHUD; drawHUD = function(){ UX.wrapKeys = false; safe('hook text', hookText); return f.apply(this, arguments); }; }
})();
/* ===== END INDEX 83e ====================================================== */

/* ===== INDEX 92 - T-01 art polish: tavern hub look (Art & Interface Lead) =====
   CSS only: lamplight, wood-grain cards, a hearth strip, and the Camp Bard
   standing on a small plank stage in the bottom-left corner (the bottom-right
   is where the "save open in another tab" banner sits). The bard is upright and
   sways a little; js/art/graphics.js (Index 92) swaps his sprite to the standing one.
   ROLLBACK: delete from this comment to END INDEX 92.
============================================================================ */
(function(){
  'use strict';
  const st = document.createElement('style');
  // "html #tavern-hub" beats tavern.js's own rules, which are injected after this file loads
  st.textContent = `
  html #tavern-hub{ background:
      radial-gradient(ellipse 320px 220px at 12% -4%, rgba(255,190,90,.34), transparent 70%),
      radial-gradient(ellipse 320px 220px at 88% -4%, rgba(255,190,90,.34), transparent 70%),
      radial-gradient(ellipse at 50% 30%, #4a2c14 0%, #1a0e06 80%) #1a0e06 }
  html #tavern-hub::before{ content:''; position:fixed; left:0; right:0; top:0; height:6px; pointer-events:none; z-index:2;
      background:linear-gradient(90deg, transparent 8%, #ffcf70 12%, transparent 16%, transparent 84%, #ffcf70 88%, transparent 92%); opacity:.7; animation:tvflick 2.6s ease-in-out infinite }
  @keyframes tvflick{ 0%,100%{ opacity:.55 } 40%{ opacity:.9 } 70%{ opacity:.65 } }
  html #tavern-hub .spot{ position:relative; overflow:hidden;
      background:
        radial-gradient(circle at 86% 82%, transparent 0 9px, rgba(120,70,20,.25) 10px 12px, transparent 13px),
        repeating-linear-gradient(98deg, rgba(255,210,140,.05) 0 3px, rgba(0,0,0,.06) 3px 7px),
        linear-gradient(180deg, rgba(44,24,10,.9), rgba(20,10,4,.88));
      box-shadow:inset 0 0 22px rgba(0,0,0,.55), 0 3px 0 #2a1406 }
  html #tavern-hub .spot::after{ content:''; position:absolute; left:0; right:0; top:0; height:3px; background:linear-gradient(90deg, transparent, rgba(255,216,96,.5), transparent) }
  html #tavern-hub .spot:hover{ box-shadow:inset 0 0 22px rgba(0,0,0,.4), 0 0 14px rgba(255,200,80,.35), 0 3px 0 #2a1406 }
  /* the hearth, bottom centre: stone arch and a flickering fire */
  html #tavern-hub::after{ content:''; position:fixed; left:50%; bottom:0; width:230px; height:96px; margin-left:-115px; pointer-events:none; z-index:1;
      background:
        radial-gradient(ellipse 34px 30px at 50% 100%, #ffe8a0 0 20%, #ffb030 45%, rgba(255,120,20,.0) 100%),
        radial-gradient(ellipse 60px 52px at 50% 100%, rgba(255,150,40,.55), transparent 100%),
        linear-gradient(#0c0602, #0c0602) 50% 100% / 150px 60px no-repeat,
        repeating-linear-gradient(0deg, #4a4038 0 11px, #2e2822 11px 13px);
      border-radius:90px 90px 0 0; box-shadow:0 0 50px rgba(255,140,40,.28); animation:tvfire 1.3s ease-in-out infinite alternate }
  @keyframes tvfire{ 0%{ filter:brightness(.88) } 100%{ filter:brightness(1.18) } }
  html #tavern-hub .door{ position:relative; z-index:3 }
  /* the Camp Bard: standing in the bottom-left corner on a small plank stage */
  html #tavern-hub .bard{ left:22px; right:auto; bottom:22px; width:150px; z-index:2 }
  html #tavern-hub .bard canvas{ width:104px; margin-bottom:24px; animation:tbcalm 4.4s ease-in-out infinite; position:relative; z-index:2 }
  @keyframes tbcalm{ 0%,100%{ transform:rotate(-1.2deg) } 50%{ transform:rotate(1.2deg) } }
  html #tavern-hub .bard::before{ content:''; position:absolute; left:-4px; right:-4px; bottom:14px; height:26px; z-index:1;
      background:linear-gradient(#c08a48 0 3px, #a06a30 3px 12px, #4a2c12 12px 100%); border-bottom:3px solid #2a1608;
      box-shadow:0 0 26px 6px rgba(255,190,90,.28), 0 6px 0 rgba(0,0,0,.35) }
  html #tavern-hub .bard::after{ content:''; position:absolute; left:50%; bottom:20px; width:140px; height:90px; margin-left:-70px; z-index:0;
      background:radial-gradient(ellipse at 50% 70%, rgba(255,210,120,.2), transparent 70%) }
  `;
  document.head.appendChild(st);
})();
/* ===== END INDEX 92 ======================================================= */

/* ===== INDEX 93: style guide SG-1 (docs/style-guide.md): tokens + fonts =====
   Tokens are the single source for new CSS; web fonts are optional (Georgia is the fallback). */
(function(){
  try{
    const lk=document.createElement('link'); lk.rel='stylesheet';
    lk.href='https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Alegreya+SC:wght@500;700&family=IM+Fell+English+SC&display=swap';
    document.head.appendChild(lk);
  }catch(e){}
  const st=document.createElement('style'); st.id='ux93-tokens';
  st.textContent=`
  :root{--canvas:#d9c7a0;--parchment:#f0e6d2;--parchment-deep:#e4d4b0;--ink:#2a2520;--ink-soft:#4a3b2a;
    --wood-night:#1a0e06;--wood-dark:#2e1f12;--wood:#5a3a1a;--wood-light:#8a5a2b;
    --blood-deep:#4e1f14;--blood:#7a3e26;--blood-bright:#c0634a;
    --gold:#d4af37;--gold-bright:#ffd860;--gold-dark:#7a5a00;--gold-ink:#634a00;--bone:#f0e0b8;--dust:#c9b48a;
    --good-dark:#1f5a28;--good-light:#8fd39a;--bad-dark:#9a2a1a;--bad-light:#ff8a7a;--steel:#2f4f6a;--steel-light:#9cc0dc;
    --off-dark:#6a5d4b;--off-light:#a89878;
    --f-display:'IM Fell English SC',Georgia,'Times New Roman',serif;--f-head:'Alegreya SC',Georgia,serif;--f-body:Alegreya,Georgia,'Times New Roman',serif}
  body{font-family:var(--f-body)}
  h1{font-family:var(--f-display);font-variant:normal}
  h2,h3{font-family:var(--f-head);font-variant:normal}
  `;
  document.head.appendChild(st);
})();
/* ===== END INDEX 93 ======================================================= */

/* ===== INDEX 94: UXQ one-modal queue + toast lane (PL-2.1) ===================
   Modals = dialogs (#askbox via askConfirm/askAlert, #ux-bk Backups). Full screens (tavern hub, camp panel,
   dice tray, mp-crepitus) are NOT queued. Watchdog frees a slot whose element vanished without UXQ.done.
   ROLLBACK: delete this block (askConfirm/askClose/uxBackups/uxRestore revert to the originals). */
(function(){
  if (window.UXQ) return;
  const queue = []; let act = null, miss = 0, timer = 0;
  const alive = a => { const e = document.querySelector(a.el); return !!(e && e.isConnected && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'); };
  const watch = () => {
    if (!act) { clearInterval(timer); timer = 0; return; }
    if (alive(act)) { miss = 0; return; }
    if (++miss >= 2) release();                                   /* gone for ~500 ms with no done(): free the slot */
  };
  function run(n){ act = {key:n.key, el:n.el}; miss = 0; if (!timer) timer = setInterval(watch, 250); try { n.open(); } catch (e) { console.error(e); release(); } }
  function release(){
    act = null; miss = 0;
    if (queue.length) setTimeout(() => { if (!act && queue.length) run(queue.shift()); }, 250);
  }
  window.UXQ = {
    request(key, open, o){ o = o || {};
      const n = {key, open, el:o.el || '#askbox', pri:o.pri || 0};
      if (!act) { run(n); return true; }
      const i = queue.findIndex(q => q.key === key); if (i >= 0) queue.splice(i, 1);
      let j = queue.findIndex(q => q.pri < n.pri); if (j < 0) j = queue.length; queue.splice(j, 0, n); return false; },
    done(key){ if (act && (key == null || act.key === key)) release(); },
    busy(){ return !!act; },
    waiting(){ return queue.length; },
    toast(msg, kind){ if (typeof campNote === 'function') campNote(msg, kind); }
  };
  const hook = () => {
    if (typeof askConfirm === 'function' && !askConfirm.uxq) {
      const oc = askConfirm, oclose = askClose;
      askConfirm = function(title, body, onYes, opts){
        const a = arguments, self = this, key = 'ask:' + title;
        UXQ.request(key, () => { oc.apply(self, a); if (act) act.key = key; }, {el:'#askbox', pri:(opts && opts.alert) ? 1 : 0}); };
      askConfirm.uxq = 1;
      askClose = function(yes){ try { return oclose.apply(this, arguments); } finally { UXQ.done(); } };
    }
    if (typeof window.uxBackups === 'function' && !window.uxBackups.uxq) {
      const ob = window.uxBackups, orr = window.uxRestore;
      window.uxBackups = function(){ const a = arguments, self = this; UXQ.request('bk', () => ob.apply(self, a), {el:'#ux-bk', pri:0}); };
      window.uxBackups.uxq = 1;
      /* uxBackupNow re-opens the box while it is the active modal: just rebuild it in place */
      if (typeof orr === 'function') window.uxRestore = function(){ UXQ.done('bk'); return orr.apply(this, arguments); };
    }
  };
  hook(); window.addEventListener('load', hook);
  /* toast lane: bottom-left, never top-centre (timer, wave title), hidden while a full screen covers it */
  const st = document.createElement('style'); st.id = 'ux94-lane';
  st.textContent = `#camp-note,#aud-hint{left:12px !important;right:auto !important;top:auto !important;bottom:48px !important;transform:none !important;max-width:min(340px,60vw) !important;text-align:left}
    body.ux-fs #camp-note,body.ux-fs #aud-hint{visibility:hidden !important}
    @media (max-width:520px){body.ux-fs #ux-guard,#tavern-hub ~ .bard,.bard{visibility:hidden !important}}`;   /* a phone-width hub is all buttons: no free spot, so the decorative bard caption and the save banner wait */
  document.head.appendChild(st);
  /* find a spot free of buttons for each visible toast (#camp-note, #aud-hint, the hub's .bard label); never block clicks */
  const LANE = ['#camp-note', '#aud-hint', '#ux-guard', '.bard'];
  const btns = () => [...document.querySelectorAll('button, [onclick], a[href]')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).display !== 'none'; });
  const hitArea = (a, rs) => { let t = 0; for (const r of rs) { const w = Math.min(r.right, a.right) - Math.max(r.left, a.left), h = Math.min(r.bottom, a.bottom) - Math.max(r.top, a.top); if (w > 0 && h > 0) t += w * h; } return t; };
  function placeToasts(){ placeOnce(); placeOnce(); }   /* twice: a banner that moves takes its buttons with it */
  function placeOnce(){
    const W = innerWidth, H = innerHeight; let bl = null;
    for (const sel of LANE) {
      const e = document.querySelector(sel); if (!e) continue;
      const cs = getComputedStyle(e); if (cs.display === 'none' || (cs.visibility === 'hidden' && e.id !== 'aud-hint' && !(e.style.visibility === 'hidden')) || e.style.opacity === '0' || !e.textContent.trim()) continue;
      bl = btns();   /* fresh each time: an earlier toast may have moved a button (the guard's own) */
      const rs = bl.filter(b => !e.contains(b) && !b.contains(e)).map(b => b.getBoundingClientRect());
      const r0 = e.getBoundingClientRect(), w = r0.width, h = r0.height;
      if (hitArea(r0, rs) < 12) { e.style.setProperty('pointer-events', 'none', 'important'); if (e.id === 'aud-hint') e.style.removeProperty('visibility'); continue; }   /* where it is now is clear */
      const C = [[12, H - h - 48], [W - w - 12, H - h - 48], [12, H - h - 8], [W - w - 12, H - h - 8], [12, 112], [W - w - 12, 112], [12, H / 2], [(W - w) / 2, H - h - 100], [(W - w) / 2, 112]];
      for (let y = H - h - 4; y >= 4; y -= 20) for (const x of [4, (W - w) / 2, W - w - 4]) C.push([x, y]);   /* then a coarse sweep of the whole screen */
      let best = null, bs = 1e12;
      for (const [x, y] of C) { const x2 = Math.max(4, Math.min(x, W - w - 4)), y2 = Math.max(4, Math.min(y, H - h - 4)), sc = hitArea({left:x2, top:y2, right:x2 + w, bottom:y2 + h}, rs); if (sc < bs) { bs = sc; best = [x2, y2]; if (sc < 12) break; } }
      if (e.id === 'aud-hint') e.style.setProperty('visibility', bs >= 12 ? 'hidden' : '', 'important');   /* the sound hint is disposable: no free spot, no hint */
      if (best) { const st = e.style, zm = parseFloat(cs.zoom) || 1; st.setProperty('left', best[0] / zm + 'px', 'important'); st.setProperty('top', best[1] / zm + 'px', 'important'); st.setProperty('right', 'auto', 'important'); st.setProperty('bottom', 'auto', 'important'); st.setProperty('transform', 'none', 'important'); st.setProperty('pointer-events', 'none', 'important'); }
    }
  }
  setInterval(() => { try { placeToasts(); } catch (e) {} }, 250);
  { const kick = () => { try { if (window.UXQ.fs) UXQ.fs(); if (LANE.some(q => document.querySelector(q))) placeToasts(); } catch (e) {} };   /* synchronous: runs before the next paint or scan */
    try { document.fonts.addEventListener('loadingdone', kick); } catch (e) {}   /* web fonts re-flow the page */
    for (const ev of ['transitionend', 'animationend']) document.addEventListener(ev, kick, true);
    new MutationObserver(kick).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class', 'style', 'hidden']}); }
  window.UXQ.place = placeToasts;
  const hookNote = () => { if (typeof campNote === 'function' && !campNote.uxp) { const f = campNote; campNote = function(){ const r = f.apply(this, arguments); requestAnimationFrame(placeToasts); return r; }; campNote.uxp = 1; } };
  hookNote(); window.addEventListener('load', () => setTimeout(hookNote, 0));
  const FS = ['#tavern-hub', '#dice-tray', '.mpc-root'];
  window.UXQ.fs = () => { let on = false;
    for (const s of FS) { const e = document.querySelector(s); if (e && getComputedStyle(e).display !== 'none' && !e.classList.contains('hidden')) { on = true; break; } }
    document.body.classList.toggle('ux-fs', on); };
  setInterval(window.UXQ.fs, 400);
})();
/* ===== END INDEX 94 ======================================================= */

/* F-44b: the facility panel's person rows (barracks, training, retire lists) had a 72px portrait, a 123px text column and a button squeezed into one line.
   Now the row wraps: portrait + text on the first line, the buttons full-width below. Kill switch: window.CARDS44 = false before load (or remove #cards44). */
(function(){
  if (window.CARDS44 === false) return;
  const st = document.createElement('style'); st.id = 'cards44';
  st.textContent = `#camp-panel .line{flex-wrap:wrap;row-gap:4px}
  #camp-panel .line img{flex:0 0 auto;width:auto}
  #camp-panel .line .grow{flex:1 1 150px;min-width:150px;line-height:1.35}
  #camp-panel .line > button{flex:1 1 auto;margin:0}`;
  document.head.appendChild(st);
})();

/* ============================================================================
   INDEX 83f - CAYDE'S FACE ON THE ROAD CARDS (Art, 16 Nov 2026; Act IV-V art gap)
   The muster, fittings, b11 and Kalloon cards (js/tutorial/act4.js, act5.js) quote
   Cayde as a bare "Cayde: ..." line, and his farewell box has no picture. A watcher
   puts his 40 px portrait (HERO_PORT.cayde) beside each quoted line and his 96 px
   portrait in the farewell box, like his other guide boxes; the Kalloon card's Zenif
   line gets HERO_PORT.zenif the same way. The tutorial files are
   not touched. Rollback: CAYDEFACE.on = false (lasts until a reload) or delete this block.
============================================================================ */
(function(){
  const F = window.CAYDEFACE = {on: true, n: 0};
  const url = (k = 'cayde') => { try { if (typeof HERO_PORT !== 'undefined' && HERO_PORT[k]) return HERO_PORT[k];
    if (typeof heroPortraitURL === 'function') return heroPortraitURL(k) || ''; } catch (e) {} return ''; };
  const face = (host, u, alt) => { host.style.display = 'flex'; host.style.gap = '8px'; host.style.alignItems = 'flex-start';
    host.insertAdjacentHTML('afterbegin', `<img class="cf-face" src="${u}" alt="${alt}" style="width:40px;height:auto;flex:none;border:2px double var(--ink-soft,#6b5a44)">`); };
  F.scan = function(root){
    if (!F.on) return 0; const u = url(); if (!u) return 0; let n = 0;
    (root || document).querySelectorAll('i').forEach(i => {
      if (!/^Cayde: “/.test(i.textContent) || i.dataset.cf) return;
      const host = i.parentElement; if (!host || host.querySelector(':scope > img.cf-face')) return;
      i.dataset.cf = '1'; face(host, u, 'Cayde'); n++; });
    const uz = url('zenif');   // the Kalloon card's Zenif line gets Zenif's face too
    if (uz) (root || document).querySelectorAll('p[data-k45="zenif"]').forEach(pz => { if (pz.dataset.cf) return; pz.dataset.cf = '1'; face(pz, uz, 'Zenif'); n++; });
    const box = document.getElementById('cg-box');
    if (box && !box.querySelector(':scope > img') && /^Cayde/.test((box.querySelector('.gname') || {}).textContent || '')){
      box.insertAdjacentHTML('afterbegin', `<img class="cf-face" src="${u}" alt="">`); n++; }
    F.n += n; return n;
  };
  let queued = false;
  const kick = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; try { F.scan(); } catch (e) {} }, 30); };   // not rAF: it stalls in a hidden tab
  const start = () => { try { new MutationObserver(kick).observe(document.body, {childList: true, subtree: true}); kick(); } catch (e) {} };
  if (document.body) start(); else window.addEventListener('DOMContentLoaded', start);
})();

/* Art, PROG-1 note 7: a small badge on every library entry (the LP's BOOK33.GLYPH / LAD[id].glyph, drawn with
   badgeURL like the trait cards, ringed in the Specialty's colour): the loadout chips, Prep chips, Copy and Research
   buttons. Reads ids from the hidden select's options and the buttons' onclick. LIBICON.on = false to stop. */
(function(){
  const L = window.LIBICON = {on: true};
  const lad = id => { try { return BOOK33.LAD[id] || null; } catch (e) { return null; } };
  const src = id => { const e = lad(id); if (!e || typeof badgeURL !== 'function') return '';
    const ring = (typeof SPECS !== 'undefined' && SPECS[e.spec] && SPECS[e.spec].color) || '#b8892a';
    try { return badgeURL(e.glyph || (BOOK33.glyphOf ? BOOK33.glyphOf(id) : 'book'), ring); } catch (x) { return ''; } };
  const add = (el, id) => { if (!el || el.querySelector('img.libic')) return; const s = src(id); if (!s) return;
    const i = document.createElement('img'); i.className = 'libic'; i.src = s; i.alt = ''; el.prepend(i); };
  L.scan = function(){
    if (!L.on || typeof BOOK33 === 'undefined') return;
    document.querySelectorAll('[data-book33] .dseg, [data-prep5] .dseg').forEach(seg => {
      const sel = seg.previousElementSibling; if (!sel || sel.tagName !== 'SELECT') return;
      [...seg.children].forEach((b, i) => { const o = sel.options[i]; if (o && o.value) add(b, o.value); }); });
    document.querySelectorAll('#camp-panel button[onclick*="BOOK33.copy"], #camp-panel button[onclick*="BOOK33.research"], #camp-panel button[onclick*="PROG5.askR"], #tbl-march button[onclick*="BOOK33.copy"]').forEach(b => {
      const ids = (b.getAttribute('onclick').match(/'([a-z0-9_]+)'/gi) || []).map(s => s.slice(1, -1)); const id = ids.find(lad); if (id) add(b, id); });
  };
  const st = document.createElement('style');
  st.textContent = 'img.libic,button img.libic{width:16px!important;height:16px!important;min-width:0!important;max-width:16px!important;image-rendering:pixelated;vertical-align:-3px;margin:0 4px 0 0!important;flex:none}';
  (document.head || document.documentElement).appendChild(st);
  let q = false; const kick = () => { if (q) return; q = true; setTimeout(() => { q = false; try { L.scan(); } catch (e) {} }, 40); };
  const start = () => { try { new MutationObserver(kick).observe(document.body, {childList: true, subtree: true}); kick(); } catch (e) {} };
  if (document.body) start(); else window.addEventListener('DOMContentLoaded', start);
})();
