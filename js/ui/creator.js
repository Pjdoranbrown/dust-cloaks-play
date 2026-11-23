/* ============================================================================
   LEADER CREATOR (S6 rows 2a and 2b; spec audits/specs/s6-3.md, layout section 8; words CAMPAIGN_LINES.coach.leader in lines/campaign.js)
   Loaded last: wraps renderCreate once more. The old chain still runs (its side effects: face picker, guide bard, story lines,
   talent cut lists); then this file rebuilds the screen into the spec's two columns from the state (CR), moving the old nodes it
   keeps (the bard box, the name block, the BACK button, #ldr-live) instead of copying them.
   Card column: title, step trail, cards (six Specialties in the set order, no ready-made Leaders), Surprise me, BACK.
   Side column: the speaker's box (Cayde in the Founding, the guide in the wizard, none in the main game) and the Leader sheet
   with the reason line and the one gold button. Freeman and Human start picked (Q56). An empty name cannot be submitted.
   SWITCH: CREATOR.on = false (or ?creator=0) restores the old screen. ROLLBACK: delete this file, its <script> line, and the
   words added under CAMPAIGN_LINES.coach.leader.
============================================================================ */
(function(){
  'use strict';
  const CREATOR = window.CREATOR = {on: !/[?&]creator=0/.test(location.search)};
  // a size that is a at 1280 px wide and b at 1920 px wide
  const V = (a, b) => `clamp(${a}px, calc(${a}px + (100vw - 1280px) * ${((b - a) / 640).toFixed(5)}), ${b}px)`;
  const css = `
    .cr2{position:fixed;left:0;top:0;right:0;bottom:0;z-index:900;background:#1d160e;color:#e8d8b0;--m:${V(32, 48)};--g:${V(24, 32)};--bot:${V(48, 56)};
      display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--g);padding:0 var(--m);box-sizing:border-box;text-align:left;font-family:var(--f-body,Georgia,serif)}
    .cr2 *{box-sizing:border-box}
    body:has(#screen-create:not(.hidden) .cr2) #topbar{display:none !important}
    .cr2 .btn.small.on{outline:2px solid #d9a93a;outline-offset:-2px;background:#6a4a1c}
    .cr2-cc{grid-column:1 / 9;position:relative;min-width:0;height:100%}
    .cr2-sc{grid-column:9 / 13;position:relative;min-width:0;height:100%}
    .cr2-h{position:absolute;left:0;top:var(--m);right:0}
    .cr2-h h1{font-family:var(--f-display);font-size:${V(40, 56)};line-height:1.05;margin:0;color:#f3e6c4;text-align:left}
    .cr2-trail{margin:8px 0 0;font:${V(14, 16)}/1.3 var(--f-head,Georgia,serif);display:flex;flex-wrap:wrap;gap:0}
    .cr2-trail span,.cr2-trail a{display:inline-block;padding:2px 0;color:#f3e6c4}
    .cr2-trail a{cursor:pointer}.cr2-trail a:hover{text-decoration:underline}
    .cr2-trail .cur{border-bottom:2px solid #d9a93a}
    .cr2-trail .todo{color:#a89878}
    .cr2-trail i{font-style:normal;margin:0 8px;color:#a89878}
    .cr2-body{position:absolute;left:0;right:0;top:${V(136, 188)};bottom:calc(var(--m) + var(--bot) + var(--g));display:flex;flex-direction:column}
    .cr2-cards{display:grid;gap:16px;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));align-content:start;overflow-y:auto;flex:0 1 auto;min-height:0;padding:4px 4px 4px 0;margin:-4px 0 0}
    .cr2-cards.more{-webkit-mask-image:linear-gradient(#000 calc(100% - 24px),transparent);mask-image:linear-gradient(#000 calc(100% - 24px),transparent)}
    .cr2-card{position:relative;background:#f3ead8;color:#2a2016;border:1px solid #8a7a5e;border-radius:4px;padding:16px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px}
    .cr2-card:hover{border-color:#fff3d0;box-shadow:inset 0 0 0 1px #fff3d0}
    .cr2-card.sel{border:3px solid #d9a93a;padding:14px}
    .cr2-card .tag{position:absolute;right:8px;top:8px;background:#d9a93a;color:#2a1a08;font:${V(14, 14)}/1 var(--f-head,Georgia,serif);padding:4px 7px;border-radius:2px;letter-spacing:.04em}
    .cr2-card:has(.art.spec){padding-block:${V(8, 16)}}.cr2-card.sel:has(.art.spec){padding-block:calc(${V(8, 16)} - 2px)}   /* UX 2a-R1: at 1280 the Specialty cards are 16 px shorter so row 2 fits the scroll box; 1920 unchanged */
    .cr2-card .art{align-self:center;display:block;image-rendering:auto}
    .cr2-card .art.spec{width:clamp(72px, 11vh, 124px);height:clamp(72px, 11vh, 124px);object-fit:contain}   /* UX P23-CARD §6 (F06): the portrait scales with height, 79 px at 720 and 119 px at 1080 */
    .cr2-cards.full{overflow:visible;-webkit-mask-image:none;mask-image:none;flex:none}   /* Neon H2: never shrunk under the Surprise row */   /* §6: the Specialty cards show all their text: no fade, no clamp, no scroll */
    .cr2-card .art.sm{width:${V(64, 80)};height:${V(64, 80)};object-fit:contain;align-self:flex-start}
    .cr2-card .nm{font:${V(17, 20)}/1.15 var(--f-head,Georgia,serif);font-weight:bold;color:#2a2016}
    .cr2-card .ln{font:${V(15, 17)}/1.4 var(--f-body,Georgia,serif);color:#2a2016}
    .cr2-card .ln.ct{margin-top:2px}
    .cr2-note{flex:none;margin:0 0 ${V(24, 32)};padding:0 0 0 12px;border-left:3px solid #d9a93a;font:${V(15, 17)}/1.4 var(--f-body,Georgia,serif);color:#f3e6c4;text-align:left}   /* 2j 3i, UX s6-3 3a: the Class step's shared line */
    .cr2-card .chips{justify-content:flex-start !important;text-align:left !important;display:flex;flex-wrap:wrap;gap:4px 6px;font-size:14px;line-height:1.2}
    .cr2-card .chips u{text-decoration:none;font-weight:bold}
    .cr2-sp{display:flex;align-items:center;gap:12px;margin-top:${V(24, 32)};flex:none}
    .cr2-sp .btn{flex:none;margin:0}   /* Neon P23-CARD-B H2: on the grid's left edge, not 8 px in */
    .cr2-sp .sline{font:${V(15, 17)}/1.35 var(--f-body,Georgia,serif);color:#e8d8b0;max-width:520px}
    .cr2-nm{display:flex;flex-direction:row;align-items:flex-start;gap:${V(24, 32)};overflow-y:auto;min-height:0}
    .cr2-nm .txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:24px}   /* UX P23-CARD §7: the "Last chance" line 24 px under the summary */
    .cr2-nf{display:flex;flex-direction:column;align-items:flex-start}
    .cr2-nlab{font:${V(15, 17)}/1.3 var(--f-head,Georgia,serif);color:#a89878;margin:0 0 8px}   /* the summary's label style */
    .cr2-nf .nrow{display:flex;align-items:stretch;gap:10px;margin:0;max-width:100%}
    .cr2-nf input.name{height:48px;font-size:20px;width:360px;min-width:0;flex:0 1 360px;box-sizing:border-box;margin:0}
    .cr2-nf .nrow .btn.small{height:48px;margin:0;flex:none}
    .cr2-nf .srow{display:flex;gap:8px;margin:16px 0 0}   /* WOMAN / MAN 16 px under the name box, on its left edge */
    .cr2-nf .srow .btn{margin:0;height:48px}   /* Neon L4: the old 48 px, level with the name box */
    .cr2-sum{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;font:${V(15, 17)}/1.3 var(--f-body,Georgia,serif)}
    .cr2-sum b{color:#a89878;font-weight:normal;font-family:var(--f-head,Georgia,serif)}
    .cr2-last{font:${V(15, 17)}/1.4 var(--f-body,Georgia,serif);color:#f3e6c4}
    .cr2-nm .nb-w{flex:none;width:${V(240, 300)}}
    .cr2-nm .nbx{display:flex;flex-direction:column;align-items:stretch !important;gap:${V(24, 32)};width:100%;margin:0 !important}
    .cr2-nm .nbx > div{margin:0 !important;justify-content:flex-start;width:100%}
    .cr2-nm .nbx img{width:100%;height:auto;display:block;margin:0 !important}
    .cr2-nm .nbx .btn,.cr2-nm .nbx input{margin:0 !important}
    .cr2-nm .nbx .f47c{justify-content:space-between}
    .cr2-nm .nbx .btn.small{height:${V(44, 48)};flex:none}
    .cr2-bot{position:absolute;left:0;bottom:var(--m);display:flex;align-items:flex-end;gap:16px;height:var(--bot)}
    .cr2-bot .btn{margin:0}
    .cr2-bot .imsg{font-size:14px;color:#e8d8b0}
    .cr2-sp-box{position:absolute;left:0;right:0;top:var(--m);min-height:${V(80, 108)};height:auto;box-sizing:border-box;background:#3a2e1e;border:1px solid #8a7a5e;border-radius:4px;display:flex;gap:12px;align-items:flex-start;padding:${V(8, 16)}}
    .cr2-sp-box img{height:${V(64, 76)};width:${V(64, 76)};box-sizing:border-box;min-height:0 !important;object-fit:cover;flex:none;border:2px solid #b8963a}
    .cr2-sp-box .gname,.cr2-sp-box .who{font:14px/1.2 var(--f-head,Georgia,serif) !important;text-transform:uppercase;letter-spacing:.06em;color:#d9a93a !important;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cr2-sp-box .speech,.cr2-sp-box .q{position:static;background:none !important;border:0 !important;padding:0 !important;margin:0 !important;font:normal ${V(15, 17)}/1.35 var(--f-body,Georgia,serif) !important;color:#f3e6c4 !important;box-shadow:none !important;display:block;overflow:hidden}
    .cr2-sp-box .speech::before,.cr2-sp-box .speech::after{display:none !important}
    .cr2-sp-box .gbard > div{min-width:0;flex:1}
    .cr2-sp-box .gbard{all:unset;display:flex;gap:12px;align-items:flex-start;width:100%}
    .cr2-sp-box .gbard img{height:${V(64, 76)};width:${V(64, 76)};box-sizing:border-box;min-height:0 !important;object-fit:cover;border:2px solid #b8963a}
    .cr2-sheet{position:absolute;left:0;right:0;bottom:var(--m);display:flex;flex-direction:column;background:#f3ead8;color:#2a2016;border:1px solid #8a7a5e;border-radius:4px;padding:12px 16px calc(${V(48, 56)} + 42px);border-bottom:0;min-height:0}
    .cr2-sheet #ldr-live{width:auto !important;position:static !important;display:flex;flex-direction:column;min-height:0;flex:1}
    .cr2-sheet .ldr-card{flex:1;min-height:0;overflow-y:auto;margin:0 !important;box-shadow:none !important;border:0 !important;background:none !important;padding:0 !important}
    .cr2-sheet .ldr-card .dsnote,.cr2-sheet .ldr-card .how,.cr2-sheet .ldr-card i.q{font-size:14px !important}
    .cr2-sheet .ldr-card details{display:none}
    .cr2-sheet.nm .ldr-card .how,.cr2-sheet.nm .ldr-card .dsnote{display:none}
    .cr2-sheet.st-cls .ldr-card .how:not([data-k=cls]),.cr2-sheet.st-race .ldr-card .how:not([data-k=race]),.cr2-sheet.st-pick .ldr-card .how,.cr2-sheet.st-pick .ldr-card .dsnote,.cr2-sheet.st-spec .ldr-card .how:not([data-k=spec]),.cr2-sheet.st-spec .ldr-card .dsnote,.cr2-sheet.st-cls .ldr-card .dsnote[data-k=as],.cr2-sheet.st-race .ldr-card .dsnote[data-k=as]{display:none}   /* gate FAIL M4 (7a: no .ldr-card scroll on any step): the sheet shows only this step's rules paragraph; Talent shows none, like the name step */   /* UX P23-CARD 7a: the Your Name step shows no rules paragraphs (head, stat rows, gold button); top padding 12 for the 720 fit */
    .cr2-sheet .ldr-card .how{margin-top:6px}
    .cr2-ba{position:absolute;left:15px;right:15px;bottom:0;display:flex;flex-direction:column;gap:8px}
    .cr2 .dl-up,.cr2 .dl-dn,.cr2 .btn.small,.cr2 .dsrow b,.cr2 .dsrow .lvhex,.cr2 .dsd,.cr2 .dbt2{font-size:14px !important}
    .cr2-sheet .ldr-head span{font-size:14px !important;font-style:normal !important}
    @media (max-height:760px){.cr2-sheet .ldr-head img,.cr2-sheet .ldr-head .ldr-q{height:68px;width:68px}}   /* gate 2 M1 (7a): Guided Start at 720 has a taller speaker box; Soldier and Scoundrel overran the sheet by 12 px */
    .cr2 .f47c span{font-size:14px !important}
    .cr2-ba .ux-why{display:none !important}
    .cr2-ba .why{height:22px;overflow:hidden;font:${V(15, 17)}/1.3 var(--f-body,Georgia,serif);color:#5a4a34}
    .cr2-ba .btn.gold{width:100%;height:${V(48, 56)};font-size:${V(18, 20)};white-space:nowrap;margin:0;padding:0 8px}
  `;
  const st0 = document.createElement('style'); st0.id = 'cr2-style'; st0.textContent = css; document.head.appendChild(st0);

  const LN = () => (window.CAMPAIGN_LINES && CAMPAIGN_LINES.coach && CAMPAIGN_LINES.coach.leader) || {};
  const founding = () => !!(window.F34 && F34.making);
  const mission = () => !!(founding() && typeof G !== 'undefined' && G && G.f45 && G.f45.making);
  const STEPS = {spec: 'Specialty', cls: 'Social Class', race: 'Race', pick: 'Talent', name: 'Your name'};
  const ORDER = ['SOLDIER', 'FOLK_HERO', 'SCOUNDREL', 'CLERIC', 'MAGE', 'WITCH'];
  const stepName = k => ((LN().stepName || {})[k]) || STEPS[k];
  const nameOK = () => { const el = document.getElementById('cr-name'); return !!(((el ? el.value : CR && CR.name) || '').trim()); };

  // ---- the gold button: label, reason, ready -----------------------------------------------------------------------------
  const _lbl = ldrNextLabel;
  ldrNextLabel = function(){
    if (!CREATOR.on || !CR) return _lbl.apply(this, arguments);
    const st = CR.step;
    if (st === 'name'){ if (founding()) return LN().sign || 'DONE: OPEN THE CAGE'; if (typeof GUIDE !== 'undefined' && GUIDE && GUIDE.on) return LN().chair || 'NEXT: THE CHAIR'; return _lbl.apply(this, arguments); }
    const nx = ldrSteps()[ldrSteps().indexOf(st) + 1] || 'name';
    return (LN().next || {})[nx] || 'NEXT';
  };
  const ready = () => CR.step === 'spec' ? !!CR.spec : CR.step === 'cls' ? !!CR.cls : CR.step === 'race' ? !!CR.race : CR.step === 'pick' ? !!CR.pick : nameOK();
  { const f = ldrLiveHTML;
    ldrLiveHTML = function(){
      let h = f.apply(this, arguments);
      if (!CREATOR.on || !CR) return h;
      const h0 = h;
      h = h.replace(/<div style="text-align:center;margin-top:8px"><button class="btn gold"[\s\S]*?<\/button><\/div>/, '');
      if (h === h0) console.warn('creator: the old gold button was not found in ldrLiveHTML; two main buttons may show');
      const ok = ready(), why = ((LN().why || {})[CR.step]) || '';
      return h + `<div class="cr2-ba"><div class="why">${ok ? '' : esc(why)}</div><button class="btn gold" ${ok ? '' : `disabled data-why="${esc(why)}"`} onclick="ldrNext()">${esc(ldrNextLabel())}</button></div>`;
    };
  }
  { const f = ldrFinish;   // an empty name cannot be submitted (criterion 19)
    ldrFinish = function(){ if (CREATOR.on && CR && !nameOK()) return; return f.apply(this, arguments); };
  }

  // ---- card faces ----------------------------------------------------------------------------------------------------------
  const C2 = () => window.CATCH2J;   // 2j: the class catches (js/campaign/catches.js)
  const hov = (k, v) => `onmouseenter="ldrHov('${k}','${v}')" onmouseleave="ldrHov()" onclick="ldrSel('${k}','${v}')" ondblclick="ldrSel('${k}','${v}');ldrNext()"`;
  const card = (sel, attrs, inner) => `<div class="cr2-card ${sel ? 'sel' : ''}" ${attrs}>${sel ? `<span class="tag">${esc(LN().chosen || 'CHOSEN')}</span>` : ''}${inner}</div>`;
  const specCards = () => ORDER.filter(k => SPECS[k]).map(k => card(CR.spec === k, hov('spec', k),
    `<img class="art spec" src="${portraitURL({race: CR.race || 'HUMAN', spec: k, name: 'preview', id: 9}, true)}" alt=""><div class="nm">${SPECS[k].name}</div><div class="ln">${esc((LN().flavour || {})[k] || '')}</div>`)).join('');
  const clsCards = () => ['FREEMAN', 'DEVOUT', 'EDELOS', 'NOBLE', 'OUTCAST', 'SLAVE'].filter(k => CLASSES[k]).map(k => card(CR.cls === k, hov('cls', k),
    `<div class="nm">${CLASSES[k].name}</div><div class="ln">${esc(((LN().classLine || {})[k] || '') + (C2() && C2().noUse(k, CR.spec) ? ' ' + C2().noUse(k, CR.spec) : ''))}</div>${C2() && C2().line(k) ? `<div class="ln ct">${C2().html(k)}</div>` : ''}`)).join('');   /* 2j: the bonus line, then the catch line (the same words as the sheet's) */
  // a Leader's chips name what a Leader has: Wounds (not Condition), compared with a Human Leader of the same Specialty and Class
  const raceChips = k => {
    const S = ldrStats(k, CR.cls || 'FREEMAN', CR.spec), H = ldrStats('HUMAN', CR.cls || 'FREEMAN', CR.spec); if (!S || !H) return '';
    const caster = SPECS[CR.spec] && SPECS[CR.spec].caster, c = [];
    const add = (lab, key) => { const v = S[key] - H[key]; if (v) c.push(`<u class="${v > 0 ? 'dl-up' : 'dl-dn'}">${lab} ${v > 0 ? '+' : ''}${v}</u>`); };
    add('Wounds', 'maxWounds'); add('Move', 'move'); add('Melee', 'melee'); add('Ranged', 'ranged'); if (caster) add('Magic', 'magic'); add('Luck', 'luck'); add('Personality', 'per');
    return c.length ? c.join('') : '<u class="dl-up">The baseline</u>';
  };
  const raceCards = () => Object.entries(RACES).map(([k, r]) => card(CR.race === k, hov('race', k),
    `<img class="art sm" src="${raceIconURL(k)}" alt=""><div class="nm">${r.name}${k === 'HUMAN' ? ' (the baseline)' : ''}</div><div class="ln">${esc(r.tag)}</div><div class="chips">${raceChips(k)}</div>`)).join('');
  const pickCards = ids => ldrPickOpts(CR.spec).filter(c => !ids || ids.includes(c.id)).map(c => card(CR.pick === c.id, `onclick="CR.pick='${c.id}';renderCreate()" ondblclick="CR.pick='${c.id}';ldrNext()"`,
    `<img class="art sm" src="${badgeURL(c.glyph, SPECS[c.spec].color)}" alt=""><div class="nm">${esc(c.name)}</div><div class="ln">${esc(((LN().talentLine || {})[c.name]) || c.text(1))}</div>`)).join('');

  // ---- the screen ------------------------------------------------------------------------------------------------------------
  function relayout(){
    const h = document.getElementById('create-inner'); if (!h || !CR) return;
    if (h.querySelector(':scope > .cr2') && !h.querySelector('#ldr-left')) return;   // Neon P23-CARD-B M3: already laid out (a second call would lose the moved name form); renderCreate rebuilds first
    try { if (!(history.state && history.state.cr2)) history.pushState({cr2:1}, '', location.href); } catch (e) {}   // browser Back is caught while the Creator is open (s6-3 criterion 16, GD 9b0a8ba)
    const stp = CR.step, steps = ldrSteps(), idx = steps.indexOf(stp);
    const live = document.getElementById('ldr-live'), gbard = h.querySelector('.gbard');
    const back = h.querySelector('button[onclick^="ldrBack"]'), backHidden = !back || back.style.display === 'none';
    const nin = document.getElementById('cr-name'), nb = nin && nin.closest('#ldr-left > div');
    const ids = stp === 'pick' ? [...h.querySelectorAll('.card[onclick]')].map(el => (/CR\.pick='([a-z_0-9]+)'/.exec(el.getAttribute('onclick')) || [])[1]).filter(Boolean) : null;
    const guideOn = !!(typeof GUIDE !== 'undefined' && GUIDE && GUIDE.on), d = !founding() && !guideOn && !gbard;
    const L = LN();
    let cards = '', n = 3;
    if (stp === 'spec') cards = specCards(); else if (stp === 'cls') cards = clsCards(); else if (stp === 'race'){ cards = raceCards(); n = 4; } else if (stp === 'pick') cards = pickCards(ids);
    const trail = steps.map((k, i) => (i === idx ? `<span class="cur">${esc(stepName(k))}</span>` : i < idx ? `<a onclick="ldrGo('${k}')">${esc(stepName(k))}</a>` : `<span class="todo">${esc(stepName(k))}</span>`)).join('<i>›</i>');
    const root = document.createElement('div'); root.className = 'cr2';
    root.innerHTML = `<div class="cr2-cc"><div class="cr2-h"><h1>${esc(stepName(stp))}</h1><div class="cr2-trail">${trail}</div></div><div class="cr2-body"></div><div class="cr2-bot"></div></div><div class="cr2-sc"></div>`;
    const body = root.querySelector('.cr2-body'), bot = root.querySelector('.cr2-bot'), sc = root.querySelector('.cr2-sc');
    if (stp !== 'name'){
      body.innerHTML = `${stp === 'cls' && C2() && C2().surrender() ? `<div class="cr2-note">${esc(C2().surrender())}</div>` : ''}<div class="cr2-cards" style="--n:${n}">${cards}</div>`;
      if (stp === 'spec') body.insertAdjacentHTML('beforeend', `<div class="cr2-sp"><button class="btn" onclick="ldrSurprise()">Surprise me</button><div class="sline">${esc(L.surprise || '')}</div></div>`);
    } else {
      const sum = [['Specialty', CR.spec && SPECS[CR.spec].name], ['Social Class', CR.cls && CLASSES[CR.cls].name], ['Race', CR.race && RACES[CR.race].name], ['Talent', CR.pick && ((CARDS.find(c => c.id === CR.pick) || {}).name)]].filter(x => x[0] !== 'Talent' || x[1]);
      body.innerHTML = `<div class="cr2-nm"><div class="txt"><div class="cr2-sum">${sum.map(x => `<b>${x[0]}</b><span>${esc(x[1] || '')}</span>`).join('')}</div><div class="cr2-last">${esc(L.last || '')}</div></div><div class="nb-w"><div class="nb"></div></div></div>`;
      if (nb){ nb.removeAttribute('style'); nb.classList.add('nbx'); nb.querySelectorAll('.btn.gold').forEach(b => { b.classList.remove('gold'); b.classList.add('on'); }); body.querySelector('.nb').appendChild(nb);
        // UX P23-CARD §7 (F07): the name box and WOMAN / MAN go to the left column under the summary; the right column keeps only the portrait and its face arrows
        const nrow = nin.parentElement, srow = [...nb.children].find(c => c !== nrow && [...c.querySelectorAll('button')].some(b => /^(WOMAN|MAN)$/i.test(b.textContent.trim())));
        if (nrow && nrow.parentElement === nb){ const nf = document.createElement('div'); nf.className = 'cr2-nf';
          nf.innerHTML = `<label class="cr2-nlab" for="cr-name">${esc(L.nameLabel || 'Your name')}</label>`;
          nrow.removeAttribute('style'); nrow.className = 'nrow'; nf.appendChild(nrow);
          if (srow){ srow.removeAttribute('style'); srow.className = 'srow'; nf.appendChild(srow); }
          body.querySelector('.cr2-nm .txt').appendChild(nf); } }
    }
    if (back && !backHidden) bot.appendChild(back);
    if (stp === 'spec' && !guideOn && !founding() && !(typeof inStoryNow === 'function' && inStoryNow())){
      bot.insertAdjacentHTML('beforeend', `<button class="btn small" onclick="importPerson()">IMPORT A LEADER</button>${typeof IMPORT_MSG !== 'undefined' && IMPORT_MSG ? `<span class="imsg">${IMPORT_MSG}</span>` : ''}`);
    }
    // the side column
    let top = 0;
    if (founding()){
      let url = ''; try { url = (window.HERO_PORT && HERO_PORT.cayde) || (typeof heroPortraitURL === 'function' ? heroPortraitURL('cayde') : ''); } catch (e) {}
      sc.insertAdjacentHTML('beforeend', `<div class="cr2-sp-box"><img src="${url}" alt=""><div><div class="who">Cayde</div><div class="q">${esc((L.ask || {})[stp] || '')}</div></div></div>`);
    } else if (gbard){
      const box = document.createElement('div'); box.className = 'cr2-sp-box'; { const gn = gbard.querySelector('.gname'); if (gn){ gn.title = gn.textContent; gn.textContent = gn.textContent.split(',')[0]; } } box.appendChild(gbard); sc.appendChild(box);
    }
    const sheet = document.createElement('div'); sheet.className = 'cr2-sheet' + (stp === 'name' ? ' nm' : '') + ' st-' + stp; if (live) sheet.appendChild(live); sc.appendChild(sheet);
    h.replaceChildren(root);
    // heights that depend on the box: sheet top = cards top (A to C) or the title top (D)
    const sbox = sc.querySelector('.cr2-sp-box');
    sheet.style.top = sbox ? '' : 'var(--m)';
    // the box grows to fit its words (UX s6-3): the sheet and the cards start 24 / 32 px below its real bottom
    const place = () => { if (!sbox || !sbox.isConnected) return; const g = Math.max(24, Math.min(32, 24 + (window.innerWidth - 1280) * 8 / 640)), t = Math.ceil(sbox.offsetTop + sbox.offsetHeight + g) + 'px';
      sheet.style.top = t; body.style.top = t; if (CREATOR.cur && CREATOR.cur.eq) CREATOR.cur.eq(); };
    if (sbox){ place(); setTimeout(place, 0); requestAnimationFrame(place); if (window.__cr2Place) window.removeEventListener('resize', window.__cr2Place); window.__cr2Place = place; window.addEventListener('resize', place); }   /* LE 2c s3: one resize listener, not one per render */
    // the gold button's label stays on one line: a long label (entry C, "CONTINUE: WHO SITS IN THE CHAIR") shrinks to fit, never under 16 px
    const fit = () => { const b = sheet.querySelector('.cr2-ba .btn.gold'); if (!b) return; b.style.fontSize = ''; let z = parseFloat(getComputedStyle(b).fontSize); while (b.scrollWidth > b.clientWidth + 1 && z > 16){ z -= 1; b.style.fontSize = z + 'px'; } };
    fit(); setTimeout(fit, 0); new MutationObserver(fit).observe(sheet, {childList: true, subtree: true});
    const cs = body.querySelector('.cr2-cards');
    if (cs && stp === 'spec') cs.classList.add('full');
    const fade = () => { if (cs) cs.classList.toggle('more', !cs.classList.contains('full') && cs.scrollHeight - cs.scrollTop - cs.clientHeight > 2); };
    // every card in a step is one height: the tallest card sets it
    const eq = () => { if (!cs) return; cs.style.gridAutoRows = 'auto'; let m = 0; for (const c of cs.children) m = Math.max(m, c.getBoundingClientRect().height); if (m) cs.style.gridAutoRows = Math.ceil(m) + 'px'; };
    eq(); CREATOR.cur = {eq, fade};
    // the first draw can come before the web fonts: measure again when they are in, or the cards keep the fallback font's height (Firefox, 1280: 22 px too tall, and the Class cards scrolled)
    if (cs && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (cs.isConnected){ eq(); fade(); } });
    if (cs){ cs.addEventListener('scroll', fade); setTimeout(fade, 0); }
    const ni = document.getElementById('cr-name');
    if (ni){ ni.addEventListener('input', () => { CR.name = ni.value; ldrHovRaw(); }); setTimeout(() => { try { ni.focus(); } catch (e) {} }, 0); }
  }

  // Freeman and Human start picked on arriving at their step, and the player can change both (Q56)
  try { if (window.FACE47C && FACE47C.install) FACE47C.install(); } catch (e) {}   // Neon P23-CARD-B H1: the face picker wraps inside this, so it decorates before the name row moves out (it finds the portrait beside WOMAN/MAN)
  { const f = renderCreate;
    renderCreate = function(){
      if (CREATOR.on && CR){ if (CR.step === 'cls' && !CR.cls) CR.cls = 'FREEMAN'; if (CR.step === 'race' && !CR.race) CR.race = 'HUMAN'; }
      const r = f.apply(this, arguments);
      if (CREATOR.on){ try { relayout(); } catch (e) { console.warn('creator layout', e); } }
      return r;
    };
  }
  if (!window.__cr2Pop){ window.__cr2Pop = 1; window.addEventListener('popstate', () => {
    if (!document.querySelector('#screen-create:not(.hidden) .cr2')) return;
    try { history.pushState({cr2:1}, '', location.href); } catch (e) {}                 // stay on the Creator; Back does what the BACK button does (nothing where there is none)
    const b = [...document.querySelectorAll('#create-inner button[onclick^="ldrBack"]')].find(x => x.offsetParent && x.style.display !== 'none'); if (b) b.click(); }); }
  if (!window.__cr2Rs){ window.__cr2Rs = 1; window.addEventListener('resize', () => { const c = CREATOR.cur; if (c && document.querySelector('.cr2')){ try { c.eq(); c.fade(); } catch (e) {} } }); }
  CREATOR.relayout = relayout;
})();
