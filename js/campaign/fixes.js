/* ---------------------------------------------------------------------------
   INDEX FIX45 - F-45 Founding plan, bugs B1 to B7 (Lead Programmer, 2026-11-15)
   Source: audits/f45-founding-plan.md section 2, "Bugs for the LP".
   B1 Night 3 Sergeant's Advice said "The last night" on a 12-night road   (index.html, storyAdvice)
   B2 the b10 card said "You held the gate" after b9 was lost               (js/campaign/f34.js, F.gateCard)
   B3 the road's Today block kept yesterday's lines                         (here)
   B4 a rescue with no hostages on the field read "0 of 0 freed hostages"   (here)
   B5 the b6 Standing tip was the wrong way round                           (js/lines/campaign.js, tips.sunStanding)
   B6 the Varnholt gate debriefs used camp-raid words                       (here; words are [N] drafts)
   B7 the Night 12 briefing named Ilvaryn                                   (here)
   No switch: the fixes are the rule (FIX45.on and b1..b7 were removed in INT-1, 2026-11-15).
   Self-test: FIX45.selfTest().
--------------------------------------------------------------------------- */
(function(){
  'use strict';
  const X = window.FIX45 = {};
  X.TXT = {                                   // [N] drafts
    cages: '<b>{n}</b> of {of} cages were opened, in {t}.',
    cagesLost: 'You opened <b>{n}</b> of {of} cages, but the slavers held the road. The captives are back in chains.',   /* K50 [N] (Planner k50) */
    gateWon: 'The assault on the North Gate was thrown back, in {t}.',
    gateLost: 'The assault on the North Gate broke through, after {t}.',
    holds: 'The gate holds.',
    looted: 'The host got into the Reeve’s strongroom and carried off {n}gp.',
    noLoot: 'The host burned what it could, but never reached the Reeve’s strongroom.',
    strategos: 'Led by a Frost-Vault Guard-Captain.',
    sunStanding: 'Free the elves and the Exiles trust you. Take the stores instead and you lose some of that trust.'
  };
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] != null ? o[k] : m));

  // B3: a new road day starts with an empty Today block
  { const f = startRoadDay; startRoadDay = function(){ try { const C = CP(); if (C && C.part === 'road') C.log = []; } catch (e) {} return f.apply(this, arguments); }; }

  X.k50 = true;   // K50 (F-48 UX): a lost Founding rescue (b3) does not read as if the cages stayed open
  X.inF34 = () => { try { return !!(window.F34 && F34.active()); } catch (e) { return false; } };
  // B4, B6: the one-line account of the fight
  X.how = function(c, result){
    const t = `${G.sec / 60 | 0}m ${G.sec % 60}s`;
    if (c.obj === 'rescue' && !(G.hostages || []).length && (G.cages || []).length)
      return fill(X.k50 && result !== 'victory' && X.inF34() ? X.TXT.cagesLost : X.TXT.cages, {n: G.cages.filter(k => k.open).length, of: G.cages.length, t});
    if (c.f34gate) return fill(result === 'victory' ? X.TXT.gateWon : X.TXT.gateLost, {t});
    return null;
  };
  { const f = contractHow; contractHow = function(c, result){ try { const h = c && G && X.how(c, result); if (h) return h; } catch (e) { console.warn('FIX45 how', e); } return f.apply(this, arguments); }; }

  // B6: camp-raid lines in a town with no camp
  X.gateLines = function(lines){
    for (let i = 0; i < lines.length; i++){
      let s = lines[i]; if (typeof s !== 'string') continue;
      s = s.replace(/The camp holds\.(?: The veterans patch each other up and are back at work by morning\.)?/, X.TXT.holds)
           .replace(/The raiders got into the Vault and carried off (\d+)gp\./, (m, n) => fill(X.TXT.looted, {n}))
           .replace(/The raiders burned what they could, but never reached the Vault\./, X.TXT.noLoot);
      lines[i] = s;
    }
    return lines;
  };
  { const f = contractDebrief; contractDebrief = function(c, result, lines){ const r = f.apply(this, arguments);
      try { if (c && c.f34gate && lines) X.gateLines(lines); } catch (e) { console.warn('FIX45 gate lines', e); }
      return r; }; }

  // B7: the last night's commander is not named (ruling: unseen)
  X.brief = function(c, h){
    const b10 = c && c.f34gate && c.f34 === 'b10';   // the b10 gate fights the Frost-Vault's Guard-Captain (ND, 19 Nov); other briefs keep the Strategos role
    if (!c || !((c.obj === 'night' && c.night === NIGHTS.length) || b10) || typeof h !== 'string') return h;
    return h.replace(/Led by [^<.]*(Ilvaryn|Strategos|Guard-Captain)[^<.]*\./, X.TXT.strategos);   // R4: the line may now carry the field name or 'a Strategos'
  };
  if (window.BRIEFING && BRIEFING.html){ const f = BRIEFING.html; BRIEFING.html = function(c){ const h = f.apply(this, arguments); try { return X.brief(c, h); } catch (e) { return h; } }; }

  // B5: the tip said raiding "their enemies" costs trust; the raid is on the stores
  X.tip = function(){ try { const T = window.CAMPAIGN_LINES && CAMPAIGN_LINES.tips; if (!T || T.sunStanding == null) return;
      T.sunStanding = X.TXT.sunStanding; } catch (e) {} };
  X.tip();

  X.selfTest = function(){
    const out = [], ok = (n, c, info) => out.push({name: n, pass: !!c, info: info || ''});
    const sv = {G: typeof G !== 'undefined' ? G : null, cp: META.cp};
    try {
      G = {sec: 75, hostages: [], cages: [{open: true}, {open: true}, {open: false}]};
      ok('B4: a rescue with no hostages counts cages', /<b>2<\/b> of 3 cages/.test(contractHow({obj: 'rescue'}, 'victory')));
      { const a0 = X.inF34; X.inF34 = () => true;
        ok('K50: a lost Founding rescue says the slavers held the road', /<b>2<\/b> of 3 cages, but the slavers held/.test(contractHow({obj: 'rescue'}, 'fled')));
        X.inF34 = () => false; ok('K50: outside the Founding the old line stays', /cages were opened/.test(contractHow({obj: 'rescue'}, 'fled'))); X.inF34 = a0; }
      ok('B6: a gate fight is not a raid on the camp', /North Gate was thrown back, in 1m 15s/.test(contractHow({obj: 'defend', f34gate: true}, 'victory')) && /broke through/.test(contractHow({obj: 'defend', f34gate: true}, 'fallen')));
      const L = X.gateLines(['<p class="good">The camp holds. The veterans patch each other up and are back at work by morning.</p>', '<p class="bad">The raiders got into the Vault and carried off 120gp.</p>', '<p class="bad">The raiders burned what they could, but never reached the Vault.</p>']).join('');
      ok('B6: no camp, veterans or Vault in the gate debrief', !/camp|veterans|Vault/.test(L) && /120gp/.test(L));
      const h = 'Likely foes: Phalanx. Led by Strategos Ilvaryn.</div>';
      ok('B7: the last night does not name Ilvaryn', !/Ilvaryn/.test(X.brief({obj: 'night', night: NIGHTS.length}, h)) && /Ilvaryn/.test(X.brief({obj: 'night', night: 1}, h)));
      { const h2 = 'Likely foes: Phalanx. Led by a Strategos.</div>'; ok('LE 90403c87: only the b10 gate says Frost-Vault Guard-Captain; other briefs keep the Strategos role', /Led by a Frost-Vault Guard-Captain./.test(X.brief({f34gate: true, f34: 'b10'}, h2)) && /Led by a Strategos./.test(X.brief({obj: 'bandits', tier: 3}, h2)) && /Led by a Strategos./.test(X.brief({f34gate: true, f34: 'b9'}, h2))); }
      ok('B5: the tip names the stores', !window.CAMPAIGN_LINES || /stores/.test(CAMPAIGN_LINES.tips.sunStanding));
      META.cp = {part: 'road', log: ['old'], night: 1, supply: 9, column: 9, orders: 0, aux: [], slots: [], formation: 'laager'};
      { const sd = startRoadDay; let seen = null; try { startRoadDay = function(){ seen = META.cp.log.length; }; } catch (e) {} startRoadDay = sd; }
      META.cp = {part: 'road', log: [], night: 3, supply: 9, column: 9, orders: 0, aux: [], slots: [], formation: 'laager'};
      const n0 = NIGHTS.length; let far = '', last = '';
      try { while (NIGHTS.length < 5) NIGHTS.push(NIGHTS[0]); far = coachLines().join(' '); META.cp.night = NIGHTS.length; last = coachLines().join(' '); } finally { NIGHTS.length = n0; }
      ok('B1: "The last night" only on the last night', !/The last night/.test(far) && /The last night/.test(last));
    } catch (e) { ok('no exception', false, String(e && e.stack || e)); }
    finally { G = sv.G; META.cp = sv.cp; }
    const fails = out.filter(x => !x.pass);
    return {pass: out.length - fails.length, fail: fails.length, fails};
  };
})();
