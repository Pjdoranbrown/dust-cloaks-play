/* INDEX BR1 - Contract briefing (Patrick, 2026-11-12). Enemies used to spawn as the old pixel art and switch to the ray-cast look
   a few seconds in: MON3D.drawUnit builds a missing clip only inside its 12 ms frame budget and otherwise draws async, which falls
   back to the pixel sprite until the lazy pump (R3DQ) has built the clip. The fix is a briefing screen: startDeployment runs as
   before, the field pauses under an overlay that gives the job's flavour text, the pay, the standing at stake, the likely enemies and
   the squad's portraits, while every clip the field is likely to draw is queued as warm jobs and pumped hard. CONTINUE (Enter or
   Space) appears when the core clips are built, or after BRIEFING.timeout ms; the rest keeps building in the background. Skipped
   for the drill, the brawl and the self-test harness. Wrapper only: startDeployment and togglePause are wrapped, nothing is edited. */
(function(){
  'use strict';
  const B = window.BRIEFING = {
    on: true, timeout: 12000, minMs: 600, up: false, el: null, timer: null, t0: 0, total: 0, core: 0, stats: null, ready: false,
    CORE: ['idle', 'walk'], LEADCORE: ['idle', 'walk', 'melee', 'shoot'], ORDER: ['idle', 'walk', 'melee', 'shoot', 'hit', 'run', 'cast'], NDIR: 8, skipObj: {drill: 1, brawl: 1}
  };
  // script-level const and let globals are not window properties: an indirect eval sees the global lexical scope
  const def = n => { try { return (0, eval)('typeof ' + n) !== 'undefined'; } catch (e) { return false; } };
  const has = n => { try { return typeof (0, eval)(n) === 'function'; } catch (e) { return false; } };
  const E = s => has('esc') ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
  const style = () => R3D_STYLES[r3dStyleId() || 'crisp'];

  /* ---------------------------------------------------------------- warm list --- */
  // The recipes the field will draw: the leader, each mate, the enemies already on the map, the host's pool and bosses for the tier.
  B.recipes = function(c){
    const out = [], seen = new Set();
    const add = (rec, who) => { if (rec && rec.rig && rec.key && !seen.has(rec.key)){ seen.add(rec.key); out.push({rec, who}); } };
    try { if (G && G.leader && G.leader.spr && has('r3dRecipeForSprite')) add(r3dRecipeForSprite(G.leader.spr), 'leader'); } catch (e) {}
    try { if (G && G.leader && !seen.size && has('r3dLeaderRecipe')) add(r3dLeaderRecipe(), 'leader'); } catch (e) {}
    try { (G && G.squad || []).forEach(m => { try { add(m.spr && has('r3dRecipeForSprite') ? r3dRecipeForSprite(m.spr) : null, 'mate'); if (m.p && has('r3dRecipeOf')) add(r3dRecipeOf(m.p, false), 'mate'); } catch (e) {} }); } catch (e) {}
    const kinds = B.kinds(c);
    kinds.forEach(k => { try { if (def('MON3D') && MON3D.recipe) add(MON3D.recipe(k), k); else if (has('r3dEnemyRecipe')) add(r3dEnemyRecipe(k), k); } catch (e) {} });
    return out;
  };
  // Enemy kinds in the order they matter: on the map now, then the pool, then the bosses.
  B.kinds = function(c){
    const ks = [], seen = new Set(), push = k => { if (k && !seen.has(k) && def('BESTIARY') && BESTIARY[k]){ seen.add(k); ks.push(k); } };
    try { (G && G.enemies || []).forEach(e => push(e.k)); } catch (e) {}
    if (c && c.obj === 'siege' && c.assault != null && typeof assaultKinds === 'function'){ assaultKinds(c.assault).forEach(push); return ks; }   // K98: the story siege lists its own waves
    const H = c && def('HOSTS') && HOSTS[c.host];
    if (H){ ((H.pools || {})[c.tier] || []).forEach(push); ((H.bosses || {})[c.tier] || []).forEach(push); }
    return ks;
  };
  // Core is what the first seconds draw: idle and walk for everyone, melee and shoot for the leader too (the player's own first
  // swing). A full core (idle, walk, melee, shoot for all nine recipes) measured 11.6 s at 3.3 ms a frame; the extras keep building
  // behind the lines in the order they are likely to be needed.
  B.clipsOf = function(rec, which, who){
    const T = def('R3D_CLIPS') && R3D_CLIPS[rec.rig]; if (!T) return [];
    const all = ((def('R3D') && R3D.CLIPS_FOR && R3D.CLIPS_FOR[rec.rig]) || Object.keys(T)).filter(cl => T[cl] && typeof T[cl].n === 'number');
    const rank = cl => { const i = B.ORDER.indexOf(cl); return i < 0 ? 99 : i; };
    const sorted = all.slice().sort((a, b) => rank(a) - rank(b));
    const CORE = who === 'leader' ? B.LEADCORE : B.CORE;
    const core = sorted.filter(cl => CORE.indexOf(cl) >= 0), extra = sorted.filter(cl => CORE.indexOf(cl) < 0);
    return which === 'core' ? (core.length ? core : sorted.slice(0, 2)) : which === 'extra' ? extra : sorted;
  };
  // Queue the warm jobs: core clips of every recipe first (in recipe order), then the extras. Returns the counts.
  B.warm = function(c){
    const recs = B.recipes(c), st = style(); let core = 0, extra = 0;
    if (!has('r3dFramesAsync') || !def('R3DQ')) return {core, extra, recs: recs.length};
    const q = (rec, cl, d) => { const hit = r3dFramesAsync(rec, cl, d, st, true); return hit ? 0 : 1; };
    recs.forEach(r => B.clipsOf(r.rec, 'core', r.who).forEach(cl => { for (let d = 0; d < B.NDIR; d++) core += q(r.rec, cl, d); }));
    B.core = R3DQ.q.length;   // the point in the queue where the core jobs end: when the queue is this short or less, the core is built
    recs.forEach(r => B.clipsOf(r.rec, 'extra', r.who).forEach(cl => { for (let d = 0; d < B.NDIR; d++) extra += q(r.rec, cl, d); }));
    return {core, extra, recs: recs.length};
  };
  B.coreLeft = function(){   // core jobs still queued: the queue drains from the front and the core jobs were pushed first
    if (!def('R3DQ')) return 0;
    const q = R3DQ.q; let n = 0;
    for (let i = 0; i < q.length && n < q.length; i++){ const j = q[i]; if (j && j.rec && B.coreKeys.has(j.rec.key) && (j.rec.key === B.leadKey ? B.LEADCORE : B.CORE).indexOf(j.clip) >= 0) n++; }
    return n;
  };
  B.coreKeys = new Set();

  /* ---------------------------------------------------------------- the text --- */
  /* R4 (checklist R, stage 4): "Led by" named the host's stock boss ("Captain Vane") while the field boss had a rolled name
     ("Captain Brenna Cinder"), and stock names had no article ("Led by Devil-Knight or Orsolt"). Now: the bosses already on
     this contract's field, by their own names; else the role, with an article. */
  B.ROLE = {vane: 'a mercenary captain', orsolt: 'a Hollow Reeve', alpha: 'a pack alpha', ogre: 'an ogre', inquisitor: 'an Inquisitor-Apprentice',
    devil: 'a Devil-Knight', wyrm: 'a young wyrm', ilvaryn: 'a Strategos'};
  B.an = s => (/^[aeiou]/i.test(String(s)) ? 'an ' : 'a ') + s;
  B.chiefs = function(c, bossKinds){
    const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
    try { if (G && G.contract === c){ const n = (G.enemies || []).filter(e => e && !e.dead && e.name && BESTIARY[e.k] && BESTIARY[e.k].boss).map(e => e.name);
      if (n.length) return uniq(n); } } catch (e) {}
    return uniq(bossKinds.map(k => B.ROLE[k] || B.an(BESTIARY[k].name)));
  };
  B.html = function(c){
    const obj = c.obj, O = (def('OBJECTIVES') && OBJECTIVES[obj]) || {}, CT = (def('CONTRACTS') && CONTRACTS[obj]) || {};
    const name = c.title || CT.name || O.name || 'Contract';
    const H = def('HOSTS') && HOSTS[c.host];
    const ks = B.kinds(c), foot = ks.map(k => BESTIARY[k]).filter(b => !b.boss);
    const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
    const foes = uniq(foot.map(b => b.name)), chiefs = B.chiefs(c, ks.filter(k => BESTIARY[k].boss));
    let pay = c.pay || 0; try { if ((c.edges || []).indexOf('terms') >= 0) pay = Math.round(pay * 1.2); } catch (e) {}
    const edges = (c.edges || []).map(id => { try { const e = EDGES.find(x => x.id === id); return e ? e.name : id; } catch (e) { return id; } });
    let infl = '';
    try {
      if (c.faction && def('FACTIONS') && FACTIONS[c.faction]){
        const s = standing(c.faction);
        infl = `${E(FACTIONS[c.faction].name)}: ${E(standingLabel(s))} (${E(fmtStanding(s))}). Success raises their regard; failure costs it.`;
      } else infl = 'No faction has a stake in this one.';
    } catch (e) { infl = ''; }
    let rumour = '';
    try { const nm = has('nemesisFor') ? nemesisFor(c.host) : []; if (nm && nm.length) rumour = `Rumour puts ${E(nm[0].name)} in the field.`; } catch (e) {}
    const where = H ? `${E(c.patron ? 'For ' + c.patron : '')}${c.patron ? ' · ' : ''}against ${E(H.the || H.name)}${c.place ? ' at ' + E(c.place) : ''}` : E(c.patron ? 'For ' + c.patron : '');
    const faces = B.faces();
    const foeLine = foes.length ? `Likely foes: ${E(foes.join(', '))}${chiefs.length ? '. Led by ' + E(chiefs.join(' or ')) : ''}.` : 'Nobody knows what waits there.';
    const finale = c.finale ? '<div class="sub" style="color:#e0a030;letter-spacing:2px;font-size:14px">FINALE</div>' : '';
    const minutes = c.minutes ? ` · ${c.minutes} minutes` : '';
    // K53 (16 Nov): on a phone the brief ran 801-829 px on an 812 px screen, so CONTINUE could sit off screen.
    // Below 500 px wide: tighter type and portraits, and CONTINUE stays pinned at the bottom of the scroll.
    const k53 = `<style>@media (max-width:500px){#overlay-brief .brief-in{padding:10px 12px!important;gap:5px!important}
      #overlay-brief .brief-in h1{font-size:22px!important}#overlay-brief .brief-in .sub{font-size:13px!important;line-height:1.3!important}
      #overlay-brief .brief-in .bf{gap:6px!important}#overlay-brief .brief-in .bf img{width:44px!important}#overlay-brief .brief-in .bf>div{width:52px!important}
      #overlay-brief .brief-go-row{position:sticky;bottom:0;padding:6px 0 4px;background:linear-gradient(transparent,var(--ink) 40%)}}</style>`;
    return `${k53}<div class="inner brief-in" style="max-width:760px;padding:18px 16px;gap:8px;text-align:center">
      ${finale}<h1 style="font-size:30px;margin:0">${E(name)}</h1>
      <div class="sub" style="color:#ddd">${where}</div>
      <div class="sub" style="color:#e8e0cc;font-size:17px;line-height:1.4;max-width:680px">${E(has('briefOf') ? briefOf(c) : c.brief || '')}</div>
      ${!c.brief && O.brief ? `<div class="sub" style="color:#bbb;font-size:14px;max-width:680px">${E(O.brief)}</div>` : ''}
      <div class="sub" style="color:var(--gold);font-size:18px">Pay ${pay} gp${minutes}${edges.length ? ' · ' + E(edges.join(', ')) : ''}</div>
      <div class="sub" style="color:#c8c0b0;font-size:15px">${infl}</div>
      <div class="sub" style="color:#e0b0a0;font-size:15px">${foeLine}${rumour ? ' ' + rumour : ''}</div>
      ${faces}
      <div id="brief-prog" class="sub" style="color:#aaa;font-size:14px;min-height:20px">Mustering the squad…</div>
      <div class="brief-go-row"><button id="brief-go" class="btn gold" style="visibility:hidden" onclick="BRIEFING.go()">CONTINUE</button></div>
    </div>`;
  };
  B.faces = function(){
    try {
      const L = META && META.leader, people = [];
      if (L) people.push({p: L, lead: true});
      (G && G.squad || []).forEach(m => { if (m.p) people.push({p: m.p, lead: false}); });
      if (!people.length || !has('portraitURL')) return '';
      return '<div class="bf" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:4px 0">' + people.map(o => {
        const u = portraitURL(o.p, o.lead); if (!u) return '';
        return `<div style="display:flex;flex-direction:column;align-items:center;width:72px"><img src="${u}" style="width:64px;height:auto;image-rendering:auto;border:2px solid ${o.lead ? '#d4af37' : '#6a5a44'};background:var(--ink)">
          <div style="font-size:14px;color:#ccc;margin-top:3px;max-width:96px;overflow-wrap:anywhere;line-height:1.15">${E(o.p.name || '')}</div></div>`;
      }).join('') + '</div>';
    } catch (e) { return ''; }
  };

  /* ---------------------------------------------------------------- the screen --- */
  B.skip = function(c){
    if (!B.on || !c) return true;
    if (B.skipObj[c.obj]) return true;
    if (window.SELFTEST) return true;                         // the harness drives G.paused itself
    if (def('UX') && UX && UX.stopped) return true;
    return false;
  };
  B.elem = function(){
    let el = document.getElementById('overlay-brief');
    if (!el){
      el = document.createElement('div'); el.id = 'overlay-brief'; el.className = 'screen overlay-screen hidden';
      el.style.cssText = 'justify-content:safe center;overflow:auto;z-index:40';
      const sib = document.getElementById('overlay-pause');
      (sib && sib.parentNode ? sib.parentNode : document.body).appendChild(el);
      try { if (def('SCREENS') && SCREENS.indexOf('overlay-brief') < 0) SCREENS.push('overlay-brief'); } catch (e) {}
    }
    return B.el = el;
  };
  B.show = function(c){
    B.hide(true);
    const el = B.elem();
    el.innerHTML = B.html(c);
    el.classList.remove('hidden');
    B.up = true; B.ready = false; B.t0 = performance.now(); B.contract = c;
    G.paused = true;
    B.coreKeys = new Set(B.recipes(c).map(r => r.rec.key)); B.leadKey = (B.recipes(c).find(r => r.who === 'leader') || {rec: {}}).rec.key;
    const w = B.warm(c); B.total = (def('R3DQ') ? R3DQ.q.length : 0); B.stats = {queued: w, start: B.total, t0: B.t0, done: 0}; B.coreTotal = B.coreLeft(); B.pct = 0;   // Neon R6 BUG-7 H1: the figure counts the core jobs this briefing waits for, not the whole queue
    B.timer = setInterval(B.tick, 16);
    B.tick();
  };
  /* INT-1 stage 3 group 2: BR2's gate, apply and close (B.wc, js/ui/briefing-council.js) are folded in here */
  B.tick = function(){ B.tick1(); const W = B.wc; if (W && W.up) W.gate(); };
  B.tick1 = function(){
    if (!B.up) return;
    try { if (def('R3DQ') && R3DQ.q.length) (def('MON3D') && MON3D.pump ? MON3D.pump(28) : r3dPump(28)); } catch (e) {}
    const left = def('R3DQ') ? R3DQ.q.length : 0, coreLeft = B.coreLeft(), el = document.getElementById('brief-prog'), t = performance.now() - B.t0;
    if (left > (B.total | 0)) B.total = left;
    /* Neon R6 BUG-7 H1: other code (the weapon warm-up, the 3D draw behind the card) adds jobs to the same queue after the start, so a share
       of the whole queue went back ("-2%", then 1% to 0%). The figure is the share of the core jobs done, and it never goes down. */
    const pct = B.pct = Math.max(B.pct | 0, B.coreTotal ? Math.max(0, Math.min(100, Math.round(100 * (1 - coreLeft / B.coreTotal)))) : 100);
    const done = coreLeft === 0 || t >= B.timeout;
    if (el) el.textContent = done ? (left ? 'Ready. The rest of the drill fills in behind the lines.' : 'Ready.') : `Mustering the squad… ${pct}%`;
    if (done && t >= B.minMs && !B.ready){
      B.ready = true; B.stats.ms = Math.round(t); B.stats.left = left;
      const go = document.getElementById('brief-go'); if (go){ go.style.visibility = 'visible'; try { go.focus(); } catch (e) {} }
    }
    if (B.ready && !left && B.timer){ clearInterval(B.timer); B.timer = null; }   // nothing more to pump; the button stays
  };
  B.go = function(){
    const W = B.wc;
    if (W && B.up && W.up){ if (!W.done(B.contract)) return; try { W.apply(B.contract); } catch (e) { console.warn('BR2 apply: ', e); } }
    if (W) W.up = false;
    if (!B.up) return;
    B.hide();
    if (G && !G.over) G.paused = false;
    try { if (has('resize')) resize(); } catch (e) {}
  };
  B.hide = function(quiet){
    if (B.wc) B.wc.up = false;
    if (B.timer){ clearInterval(B.timer); B.timer = null; }
    B.up = false;
    const el = document.getElementById('overlay-brief'); if (el){ el.classList.add('hidden'); if (!quiet) el.innerHTML = ''; }
  };
  window.addEventListener('keydown', e => {
    if (!B.up) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if (B.ready) B.go(); }
    else e.stopImmediatePropagation();   // nothing else reaches the field while the briefing is up
  }, true);

  /* ---------------------------------------------------------------- wrappers --- */
  if (has('startDeployment')){
    const f = startDeployment;
    startDeployment = B.sdHook = function(contract, mateIds){
      B.hide();
      const r = f.apply(this, arguments);
      try { if (G && !B.skip(contract)) B.show(contract); } catch (e) { console.warn('BRIEFING: ', e); B.hide(); if (G) G.paused = false; }
      return r;
    };
  }
  if (has('togglePause')){ const f = togglePause; togglePause = B.tpHook = function(){ if (B.up) return; return f.apply(this, arguments); }; }

  /* ---------------------------------------------------------------- self-test --- */
  B.selfTest = function(){
    const out = [], ok = (n, c) => out.push((c ? 'ok   ' : 'FAIL ') + n);
    const c = {obj: 'hunt', tier: 1, host: 'bandits', place: 'Test Ford', edges: ['terms'], pay: 300, patron: 'a test patron', faction: Object.keys(FACTIONS)[0], brief: 'A test brief.'};
    const h = B.html(c);
    ok('BR1: the briefing names the contract, the host and the place', h.indexOf('Headhunter Clash') >= 0 && h.indexOf('bandit gang') >= 0 && h.indexOf('Test Ford') >= 0);
    ok('BR1: the brief and the pay (terms edge adds a fifth) are shown', h.indexOf('A test brief.') >= 0 && h.indexOf('Pay 360 gp') >= 0);
    ok('BR1: the likely foes come from the host pool and bosses for the tier', h.indexOf('Likely foes') >= 0 && h.indexOf(BESTIARY.brigand.name) >= 0 && h.indexOf('Led by a mercenary captain') >= 0);
    { const g0 = G; try { G = {contract: c, enemies: [{k: 'vane', name: 'Captain Brenna Cinder'}, {k: 'brigand', name: 'x'}]};
        ok('R4: the field boss is named by its own name', /Led by Captain Brenna Cinder\./.test(B.html(c))); } finally { G = g0; } }
    ok('R4: stock bosses get an article', B.chiefs({}, ['devil', 'orsolt', 'inquisitor']).join(' or ') === 'a Devil-Knight or a Hollow Reeve or an Inquisitor-Apprentice');
    ok('BR1: the standing at stake is named', h.indexOf(FACTIONS[c.faction].name) >= 0);
    ok('BR1: the drill, the brawl and the harness skip the screen', B.skip({obj: 'drill'}) && B.skip({obj: 'brawl'}) && (window.SELFTEST ? B.skip(c) : !B.skip(c)));
    const ks = B.kinds(c);
    ok('BR1: kinds are deduplicated and cover pool and bosses', ks.indexOf('brigand') >= 0 && ks.indexOf('vane') >= 0 && ks.length === new Set(ks).size);
    const recs = B.recipes(c);
    ok('BR1: the host pool yields ray-cast recipes to warm', recs.some(r => r.who !== 'leader' && r.who !== 'mate'));
    ok('BR1: core clips are idle and walk (the leader adds melee and shoot); extras keep the likely order', recs.length ? B.clipsOf(recs[0].rec, 'core').every(cl => B.CORE.indexOf(cl) >= 0) && B.clipsOf(recs[0].rec, 'core', 'leader').indexOf('melee') >= 0 && B.clipsOf(recs[0].rec, 'extra')[0] === 'melee' : true);
    /* QA step 5: later files wrap these two, so the row checks this file's own hooks (B.sdHook, B.tpHook), not the outermost layer */
    { const up0 = B.up; B.up = true; let r = 'x'; try { r = B.tpHook && B.tpHook(); } finally { B.up = up0; }
      ok('BR1: startDeployment and togglePause are hooked; the pause key does nothing while the briefing is up', typeof B.sdHook === 'function' && /B\.hide/.test(B.sdHook.toString()) && typeof B.tpHook === 'function' && r === undefined); }
    const n = out.filter(l => l.indexOf('ok') === 0).length; out.push(n + '/' + out.length);
    return out;
  };
})();
