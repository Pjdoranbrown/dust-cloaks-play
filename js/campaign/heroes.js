/* js/campaign/heroes.js (INT-1 step 2, 2026-11-16): INDEX 27 (Founding fixes, portrait studio), 28 (hero Chapter Masters).
   Cut unchanged from the inline script in index.html (old lines 13309 to 13579). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 27 - FOUNDING FIXES AND THE PORTRAIT STUDIO
     1. The banner editor on the founding screen now updates when you click.
        (A later wrapper on renderPanel returned early whenever no camp panel
        was open, so the founding screen never re-rendered.)
     2. The Charter Ambition is chosen while founding the Chapter, after the
        holding and before the banner, so the player knows what the Chapter is
        for before the first contract. The planning table still offers the
        choice to older saves that have none.
     3. Portrait Studio: load your own picture for the Chapter Master, the
        Squad Leader or any Squad Mate (PORTRAITS button on the top bar).
        Pictures stay in this browser's save; nothing is uploaded anywhere.
   To roll back, delete from this comment to END INDEX 27 and undo the small
   patches marked "Index 27" elsewhere in the file.
============================================================================ */

/* ---- 1. the founding banner screen ------------------------------------- */
{ const f = renderPanel;
  renderPanel = function(){
    if (typeof FD !== 'undefined' && FD && FD.step === 'banner' && $('screen-create') && !$('screen-create').classList.contains('hidden')) return renderFound();
    return f();
  };
}

/* ---- 2. the Charter Ambition at founding ------------------------------- */
function charterStepHTML(){
  const cards = Object.entries(AMBITIONS).map(([k, A]) => {
    const F = (typeof FINALES !== 'undefined' && FINALES[k]) || null;
    const first = A.ms.slice(0, 3).map(m => `<li>${m.t}</li>`).join('');
    const perks = A.ms.filter(m => m.perk).map(m => `<li>${m.perk}</li>`).join('');
    return `<div class="card ${FD.ambition === k ? 'sel' : ''}" style="width:268px;text-align:left" onclick="FD.ambition='${k}';renderFound()">
      <div class="ttl" style="text-align:center">${A.name}</div><div class="role" style="text-align:center">${A.sub}</div>
      <div class="desc" style="font-size:14px;text-align:left"><b>First steps</b><ul style="margin:2px 0 6px 16px;padding:0">${first}</ul>
      <b>Perks on the way</b><ul style="margin:2px 0 6px 16px;padding:0">${perks}</ul>
      ${F ? `<b>The final contract</b><br>${F.title}, at ${F.place}.` : ''}</div></div>`;
  }).join('');
  return `<div class="row">${cards}</div>
    <div class="sub" style="font-size:14px;margin-top:6px">${FD.ambition ? `<b>${AMBITIONS[FD.ambition].name}</b> it is. Ten milestones, taken in order, and the final contract fulfils the charter.` : 'Pick one. Every contract, perk and milestone from here on points at it.'}</div>
    <button class="btn gold" ${FD.ambition ? '' : 'disabled'} onclick="FD.step='banner';BED=null;renderFound()">NEXT: THE BANNER</button>`;
}
// The new founding step sits between the holding and the banner (patched into renderFound below).
{ const f = finishFound;
  finishFound = function(){
    const amb = (typeof FD !== 'undefined' && FD && !FD.fromStory) ? FD.ambition : null;
    f();
    if (amb && typeof META !== 'undefined' && META && !META.ambition){
      META.ambition = {track:amb, done:0};
      try { checkMilestones(null); } catch (e) {}
      saveMeta();
    }
  };
}
// Moving house starts a fresh holding, so offer the same Ambition again, pre-selected.
{ const f = packUp;
  packUp = function(){
    const prev = META && META.ambition ? META.ambition.track : null;
    f();
    if (FD){ FD.ambition = prev; renderFound(); }
  };
}

/* ---- 3. the Portrait Studio -------------------------------------------- */
const PS = {key:null, img:null, zoom:1, ox:0, oy:0, flip:false, msg:'', who:null};
const PS_MAX = 40, PS_W = 216, PS_H = 264;
function psPeople(){
  const out = [], seen = new Set();
  const add = (role, p) => { if (!p || seen.has(p)) return; seen.add(p); out.push({role, p}); };
  try { add('Chapter Master', ensureMaster()); } catch (e) {}
  add('Squad Leader', META.leader);
  if (META.scribe) add('Chapter Scribe', META.scribe);   // Index 30
  if (META.bard) add('Camp Bard', META.bard);   // Index 31
  for (const p of (META.roster || [])) add('Squad Mate', p);
  for (const p of (META.retired || [])) add('Retired Veteran', p);
  return out;
}
function psThumb(p){
  try { const u = portraitURL(p, p === META.leader); return u || ''; } catch (e) { return ''; }
}
function openPortraitStudio(){
  let el = $('pstudio');
  if (!el){
    el = document.createElement('div'); el.id = 'pstudio';
    el.style.cssText = 'position:fixed;inset:0;z-index:40;background:rgba(10,8,6,.82);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:30px 10px';
    document.body.appendChild(el);
  }
  el.style.display = 'flex'; PS.key = null; PS.img = null; PS.msg = ''; psRender();
}
function closePortraitStudio(){ const el = $('pstudio'); if (el) el.style.display = 'none'; PS.img = null; try { CAMP.dirty = true; refreshUI(); } catch (e) {} }
function psRender(){
  const el = $('pstudio'); if (!el) return;
  const n = Object.keys(META.customPortraits || {}).length;
  let body;
  if (PS.img){
    body = `<h2 style="margin:0 0 6px">${esc(PS.who.name)}</h2>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
        <canvas id="ps-cv" width="${PS_W}" height="${PS_H}" style="width:${PS_W}px;height:${PS_H}px;border:2px solid var(--gold);background:#222"></canvas>
        <div style="min-width:220px;text-align:left;font-size:14px">
          <label>Zoom<br><input type="range" data-enh="1" min="100" max="300" value="${Math.round(PS.zoom * 100)}" oninput="PS.zoom=this.value/100;psDraw()" style="width:200px"></label><br><br>
          <label>Left and right<br><input type="range" data-enh="1" min="-100" max="100" value="${Math.round(PS.ox * 100)}" oninput="PS.ox=this.value/100;psDraw()" style="width:200px"></label><br><br>
          <label>Up and down<br><input type="range" data-enh="1" min="-100" max="100" value="${Math.round(PS.oy * 100)}" oninput="PS.oy=this.value/100;psDraw()" style="width:200px"></label><br><br>
          <label><input type="checkbox" ${PS.flip ? 'checked' : ''} onchange="PS.flip=this.checked;psDraw()"> Flip left to right</label><br><br>
          <div style="color:#c8bca8;font-size:14px">Line the face up with the oval. The bust is cropped to this shape everywhere in the game.</div><br>
          <button class="btn gold" onclick="psSave()">USE THIS PORTRAIT</button>
          <button class="btn small" onclick="PS.img=null;psRender()">CANCEL</button>
        </div></div>`;
  } else {
    body = `<h2 style="margin:0 0 4px">Portrait Studio</h2>
      <div style="font-size:14px;color:#c8bca8;margin-bottom:8px;text-align:left">Choose a picture for anyone in the Chapter. Head and shoulders works best. Pictures are shrunk and kept in this browser's save with your campaign; nothing is uploaded. Wounds show as small badges on your own pictures. (${n} of ${PS_MAX} used)</div>
      ${PS.msg ? `<div style="color:#f0c96a;margin-bottom:8px">${PS.msg}</div>` : ''}
      <input type="file" id="ps-file" accept="image/*" style="display:none" onchange="psFile(this)">
      ${psPeople().map(({role, p}, i) => {
        const has = !!(META.customPortraits && META.customPortraits[ckey(p)]);
        return `<div style="display:flex;align-items:center;gap:10px;background:rgba(245,235,215,.1);border:1px solid var(--ink-soft);margin:4px 0;padding:4px 8px">
          <img src="${psThumb(p)}" style="height:72px;width:72px;object-fit:cover"><div style="flex:1;text-align:left;font-size:14px"><b>${esc(p.name)}</b><br><span style="color:#c8bca8">${role}${has ? ', your picture' : ', painted'}</span></div>
          <button class="btn small" onclick="psPick(${i})">CHOOSE PICTURE</button>${has ? `<button class="btn small" onclick="psReset(${i})">USE PAINTED</button>` : ''}</div>`; }).join('')}
      <div style="margin-top:10px"><button class="btn" onclick="closePortraitStudio()">DONE</button></div>`;
  }
  el.innerHTML = `<div style="background:var(--ink);color:#eee;font-family:Georgia;border:3px solid var(--gold);padding:14px 16px;width:min(560px,96vw);text-align:center">${body}</div>`;
  if (PS.img) psDraw();
}
function psPick(i){ const q = psPeople()[i]; if (!q) return; PS.who = q.p; PS.key = ckey(q.p); const f = $('ps-file'); f.value = ''; f.click(); }
function psFile(inp){
  const file = inp.files && inp.files[0]; if (!file) return;
  if (!/^image\//.test(file.type)){ PS.msg = 'That file is not a picture.'; return psRender(); }
  if (file.size > 12 * 1024 * 1024){ PS.msg = 'That picture is over 12 MB. Pick a smaller one.'; return psRender(); }
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => { URL.revokeObjectURL(url); if (!im.width || !im.height){ PS.msg = 'Could not read that picture.'; return psRender(); } PS.img = im; PS.zoom = 1; PS.ox = 0; PS.oy = 0; PS.flip = false; PS.msg = ''; psRender(); };
  im.onerror = () => { URL.revokeObjectURL(url); PS.msg = 'Could not read that picture. Try a JPEG or PNG.'; psRender(); };
  im.src = url;
}
function psPaint(g, W, H, guide){
  const im = PS.img; g.fillStyle = '#222'; g.fillRect(0, 0, W, H);
  const s = Math.max(W / im.width, H / im.height) * PS.zoom, w = im.width * s, h = im.height * s;
  const x = (W - w) / 2 + PS.ox * Math.max(0, (w - W) / 2), y = (H - h) / 2 + PS.oy * Math.max(0, (h - H) / 2);
  g.save(); if (PS.flip){ g.translate(W, 0); g.scale(-1, 1); } g.imageSmoothingQuality = 'high'; g.drawImage(im, PS.flip ? W - x - w : x, y, w, h); g.restore();
  if (guide){ g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.ellipse(W / 2, H * 0.4, W * 0.24, H * 0.2, 0, 0, 7); g.stroke(); g.restore(); }
}
function psDraw(){ const c = $('ps-cv'); if (c && PS.img) psPaint(c.getContext('2d'), PS_W, PS_H, true); }
function psSave(){
  if (!PS.img || !PS.key) return;
  META.customPortraits = META.customPortraits || {};
  const had = META.customPortraits[PS.key];
  if (!had && Object.keys(META.customPortraits).length >= PS_MAX){ PS.msg = `The studio holds ${PS_MAX} pictures. Use the painted portrait for someone first.`; PS.img = null; return psRender(); }
  const c = newCanvas(PS_W, PS_H); psPaint(c.getContext('2d'), PS_W, PS_H, false);
  let d; try { d = c.toDataURL('image/jpeg', 0.86); } catch (e) { PS.msg = 'This browser would not let me read that picture.'; PS.img = null; return psRender(); }
  META.customPortraits[PS.key] = {d, v:(had ? had.v : 0) + 1};
  try { saveMeta(); } catch (e) {
    if (had) META.customPortraits[PS.key] = had; else delete META.customPortraits[PS.key];
    PS.msg = 'The browser has no room left in its save. Use the painted portrait for someone else first.'; PS.img = null; return psRender();
  }
  delete PORT.cust[PS.key]; PS.img = null; PS.msg = `${esc(PS.who.name)} has a new portrait.`;
  try { CAMP.dirty = true; } catch (e) {}
  psRender();
}
function psReset(i){
  const q = psPeople()[i]; if (!q) return; const k = ckey(q.p);
  if (META.customPortraits) delete META.customPortraits[k]; delete PORT.cust[k]; saveMeta();
  PS.msg = `${esc(q.p.name)} is back to the painted portrait.`; try { CAMP.dirty = true; } catch (e) {} psRender();
}
/* ===== END INDEX 27 ======================================================= */


/* ============================================================================
   INDEX 28 - HERO CHAPTER MASTERS
   The first founding screen now offers the four legends from the Players
   Manual (Appendix D) ready made, plus "Build your own" (the old Race, Class,
   Specialty and Name steps) and "Surprise me" (a random Chapter Master that
   still lets you rename). A hero skips straight to the Holding step.
     - Heroes keep one fixed painted look: no flip or hue shift.
     - The chosen hero is remembered on the Chapter Master (META.master.hero),
       and their line shows in the Chapter Master's camp panel.
     - Electing a different Chapter Master later clears the hero flag.
   Hero text lives in the HEROES table below: edit the strings freely.
   Lore lines come from the Players Manual (Appendix D and Part Two).
   To roll back, delete from this comment to END INDEX 28 and undo the small
   patches marked "Index 28" elsewhere in the file.
============================================================================ */
const HEROES = {
  cayde: {name:'Cayde', full:'Cayde Hallinan', title:'Master of the Dust Cloaks',
    race:'HUMAN', cls:'EDELOS', spec:'FOLK_HERO', sex:'m',
    lore:"Born to an enslaved woman, raised from eight to sixteen in an Edelōs caravan under Oirbsen Farraige. The songs say he came back from death with an unrelenting hatred of slavers, hobgoblins and dragons."},
  zenif: {name:'Zenif', full:"Zenif Nu'Loon", title:"Herald of the Thaw",
    race:'DARK_ELF', cls:'NOBLE', spec:'MAGE', sex:'m',
    lore:"A Dark Elf wizard of the legendary company, and patron of the exiled spellcasters of the Reprobate Collective. Dead before 616; the songs still tell of his volcano-lair cabal."},   /* kept for old saves only: not in HERO_ORDER (bible 2026-11-09) */
  krusk: {name:'Krusk', full:'Krusk', title:'Pay Dues and Steppe Fury',
    race:'ORC', cls:'SLAVE', spec:'SOLDIER', sex:'m',
    lore:"An orc slave fighter in Cayde's company."},
  zim:   {name:'Zim', full:'Zim', title:'Lightning Bolt and Luminous Grace',
    race:'SUN_ELF', cls:'FREEMAN', spec:'MAGE', sex:'m',
    lore:'A Sun Elf spellcaster and rogue who rode with Cayde, Artemis and Zenif. Graceful, lazy, and very good with locks and magical traps.'}
};
const HERO_ORDER = ['cayde', 'krusk', 'zim'];   /* CLARKE-1 (2026-11-16): Clarke is gone from the game (Q30) */

function heroCircle(H){
  return Object.entries(PATRON_CIRCLE).filter(([, c]) => c.includes(H.race) || c.includes(H.cls) || c.includes(H.spec)).map(([p]) => p).join(', ') || 'none';
}
// The same painting the Chapter Master will have in the game (gold frame, banner backdrop).
function heroPortraitURL(k){
  const H = HEROES[k], m = {id:'HERO-' + k, name:H.name, race:H.race, spec:H.spec, cls:H.cls, sex:H.sex, hero:k};
  try {
    /* S6-C note 13 (Art Director): while the hero's painting is still decoding, give the painting itself, never the sheet face */
    if (typeof HERO_PORT !== 'undefined' && HERO_PORT[k] && typeof portCustomFig === 'function' && !portCustomFig(m)) return HERO_PORT[k];
    if (typeof portHas === 'function' && portHas(m)){
      const u = portURL('hp1:' + k + '|' + bannerSig() + '|' + personKey(m, true), () => portGold(m, true, {trim:true}));
      if (u) return u;
    }
  } catch (e) {}
  return previewBustURL(H.race, H.sex, H.spec, H.cls);
}
function heroStepHTML(){
  const heroes = HERO_ORDER.map(k => {
    const H = HEROES[k];
    return `<div class="card" style="width:262px" onclick="heroPick('${k}')">
      <img src="${heroPortraitURL(k)}" style="height:170px;margin-bottom:4px">
      <div class="ttl">${esc(H.full)}</div><div class="role">${esc(H.title)}</div>
      <div class="desc" style="font-size:14px;text-align:left"><b>${RACES[H.race].name} ${CLASSES[H.cls].name}, once a ${SPECS[H.spec].name}.</b></div>
      <div class="desc" style="font-size:14px;text-align:left"><i>${esc(H.lore)}</i></div>
      <div class="desc" style="font-size:14px;text-align:left"><b>Camp bonus:</b> ${cmGame(H.cls, {hero:k})}</div>
      <div class="fl">Patrons' circle: ${heroCircle(H)}.</div></div>`;
  }).join('');
  return `<div class="row">${heroes}</div>
    <div class="row" style="margin-top:6px">
      <div class="card" style="width:262px" onclick="heroCustom()"><div class="ttl">Build your own</div>
        <div class="desc" style="font-size:14px">Choose the Race, Social Class, Specialty and Name yourself.</div></div>
      <div class="card" style="width:262px" onclick="heroSurprise()"><div class="ttl">Surprise me</div>
        <div class="desc" style="font-size:14px">Roll a stranger. You can still rename them before you go on.</div></div>
    </div>`;
}
function heroPick(k){
  const H = HEROES[k]; if (!H || !FD) return;
  FD.hero = k; FD.race = H.race; FD.cls = H.cls; FD.spec = H.spec; FD.sex = H.sex; FD.name = H.name;
  FD.step = 'holding'; renderFound();
}
function heroCustom(){
  if (!FD) return;
  FD.hero = null; FD.race = null; FD.cls = null; FD.spec = null; FD.name = '';
  FD.step = 'race'; renderFound();
}
function heroSurprise(){
  if (!FD) return;
  const race = rollRace(), cls = CLASS_ORDER[d6() - 1], spec = SPEC_ORDER[d6() - 1], sex = Math.random() < .5 ? 'f' : 'm';
  FD.hero = null; FD.race = race; FD.cls = cls; FD.spec = spec; FD.sex = sex; FD.name = randomName(race, sex);
  FD.step = 'name'; renderFound();
}
// Where the BACK button goes on the founding screens.
function heroBack(si){
  const steps = ['race', 'cls', 'spec', 'name', 'holding', 'charter', 'banner'];
  if (FD.step === 'race') return 'hero';
  if (FD.hero && FD.step === 'holding') return 'hero';
  return (steps[si - 1] === 'charter' && FD.fromStory) ? steps[si - 2] : steps[si - 1];
}
// A line about the hero in the Chapter Master's camp panel.
function heroLine(p){
  const H = p && p.hero && HEROES[p.hero];
  return H ? `<div class="desc" style="text-align:left;margin:6px 0"><b>${esc(H.full)}, ${esc(H.title)}.</b> <i>${esc(H.lore)}</i></div>` : '';
}
// Remember which hero was chosen.
{ const f = finishFound;
  finishFound = function(){
    const hk = (typeof FD !== 'undefined' && FD) ? FD.hero : null;
    f();
    if (hk && HEROES[hk] && typeof META !== 'undefined' && META && META.master){
      META.master.hero = hk; saveMeta();
      try { CAMP.dirty = true; } catch (e) {}
    }
  };
}
/* ===== END INDEX 28 ======================================================= */


