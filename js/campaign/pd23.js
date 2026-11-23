/* INDEX PD23: PD-23 the gate fights: Hollow conscript waves first, then the Frost-Vault host (audits/f45-pd-specs.md section 4).
   - Two Founding hosts (added to HOSTS after HOST_KEYS is built, so random contracts never draw them):
     'hollow34' "the Hollow": the Frost-Vault's conscripts, levies and slaves (no undead, no elves).
     'vault34'  "the Frost-Vault host": the deserters' elf units only (pikemen, Tithe-Priests, Phalanx, Shadow-Hunters).
   - F34.GATE_HOST is 'hollow34': the gate fights and the b9 leads (rescue and round 2) face the Hollow.
   - b8 (Tier 1): Hollow only; one debrief line. b9 (Tier 2): Hollow until P.K.switch.b9 of the clock, then the
     Frost-Vault host. b10 (Tier 3): one Hollow wave (P.K.switch.b10), then the Frost-Vault to the end; its bosses are the
     Frost-Vault's (Tier 3: Strategos Ilvaryn). A caption at the switch. The b8 briefing names the Hollow.
   - K80 (UX f48): the b9 and b10 briefings add a line naming the Frost-Vault host (b10: Ilvaryn), and their Likely foes list
     its units and chiefs (b10: the Frost-Vault's chiefs only; both bosses come after the switch). The switch caption is a
     centre banner (switchHead, G.alert as a wave call) as well as a log note. The b8 brief no longer promises elves.
     After the switch the b9 and b10 debriefs add a line (b9after, b10after). The gate briefs name the Hollow's chief
     (leader: "Led by Orsolt, the Hollow Reeve", not "a Hollow Reeve", read as the Reeve of Varnholt).
   Words [T]: DEF; CAMPAIGN_LINES.pd23 overrides. Self-test: PD23.selfTest(). */
(function(){
  'use strict';
  if (!window.F34 || typeof HOSTS === 'undefined') return;
  const F = F34, P = window.PD23 = {K: {switch: {b9: 2 / 3, b10: 1 / 6}}};   // [S] share of the clock before the Frost-Vault comes
  const DEF = {
    brief: 'The Hollow come down the north road first: conscripts and slaves, driven by the Frost-Vault. The Vault keeps its own Dark Elves back, for now.',
    b9brief: 'When the Hollow thin, the Frost-Vault host comes in behind them: pikemen and Tithe-Priests in pale robes.',
    b10brief: 'One wave of the Hollow, then the Frost-Vault itself, under a Guard-Captain’s banner.',
    switchHead: 'THE FROST-VAULT',
    b9after: 'The Frost-Vault showed itself today.',
    b10after: 'Scouts swore a Strategos rode out to watch the walls from the trees. The Hollow were the price of bringing one that close.',
    leader: 'Orsolt, the Hollow Reeve',
    ledThen: ', then ',
    b8: 'Every one of them was human, bar the Reeve who drove them. The Frost-Vault is spending other people first.',
    switch: 'Pale robes behind the rabble: the Frost-Vault itself.'
  };
  P.W = k => { const L = (window.CAMPAIGN_LINES && CAMPAIGN_LINES.pd23) || {}; return L[k] != null ? L[k] : DEF[k]; };
  const E = t => typeof esc === 'function' ? esc(t) : String(t);

  HOSTS.hollow34 = {name: 'The Hollow', the: 'the Hollow', den: 'Hollow Camp',
    pools: {1: ['levy', 'levy', 'brigand', 'hedgewitch'], 2: ['levy', 'enforcer', 'crossbow', 'renegade', 'arbalest'], 3: ['levy', 'renegade', 'arbalest', 'enforcer', 'renegade']},
    bosses: {1: ['orsolt'], 2: ['orsolt'], 3: ['orsolt']}};
  HOSTS.vault34 = {name: 'The Frost-Vault host', the: 'the Frost-Vault host', den: 'Frost-Vault Camp',
    pools: {1: ['pikeman', 'pikeman', 'tithepriest'], 2: ['pikeman', 'tithepriest', 'pikeman', 'tithepriest'], 3: ['phalanx', 'shadowhunter', 'tithepriest', 'pikeman']},
    bosses: {1: ['vane'], 2: ['inquisitor', 'vane'], 3: ['ilvaryn']}};
  try { if (typeof RAID_NO_PARLEY !== 'undefined' && !RAID_NO_PARLEY.includes('hollow34')) RAID_NO_PARLEY.push('hollow34'); } catch (e) {}
  F.GATE_HOST = 'hollow34';

  P.gate = () => typeof G !== 'undefined' && G && !G.over && G.contract && G.contract.f34gate && G.def30 && F.active();
  P.at = c => c && P.K.switch[c.f34];

  // the b8 briefing names the Hollow
  { const f = F.gateContract; F.gateContract = function(b){
      const c = f.apply(this, arguments);
      try { if (c && c.f34 === 'b8' && !c.f34keep) c.brief = P.W('brief') + ' ' + c.brief.replace(/^The Hollow come down the north road\.\s*/, '');
        if (c && P.at(c)) c.brief = c.brief + ' ' + P.W(c.f34 + 'brief'); } catch (e) { console.warn('PD23 brief', e); }
      return c; }; }
  /* K80 + QA (16 Nov): the gate brief tells the fight as it is played. Waves draw from tiers by level (hostWave: the level is
     the clock in sixths + TIER_WAVE_OFFSET), so b9 meets Tier 1 to 3 units: the Hollow before the switch, the Frost-Vault after.
     The two bosses come at 0.5 and 0.92 of the clock (raidSpawn), each from the host in the field then, so "Led by" names them in
     turn ("Orsolt, the Hollow Reeve, then an Inquisitor-Apprentice or a mercenary captain"), not as one or the other. */
  P.BOSS_AT = [0.5, 0.92];
  P.waveTiers = lv => { lv = Math.max(0, Math.min(9, lv)); return lv < 4 ? [1] : lv < 7 ? [1, 2] : [2, 3]; };   // as hostWave
  P.plan = function(c){
    const sw = P.K.switch[c.f34] != null ? P.K.switch[c.f34] : 1, off = (typeof TIER_WAVE_OFFSET !== 'undefined' && TIER_WAVE_OFFSET[c.tier]) || 0;
    const kinds = {hollow34: [], vault34: []}, add = (a, k) => { if (BESTIARY[k] && !a.includes(k)) a.push(k); };
    for (let s = 0; s < 6; s++) for (const t of P.waveTiers(s + off)){
      if (s / 6 < sw) (HOSTS.hollow34.pools[t] || []).forEach(k => add(kinds.hollow34, k));
      if ((s + 1) / 6 > sw) (HOSTS.vault34.pools[t] || []).forEach(k => add(kinds.vault34, k)); }
    const bosses = P.BOSS_AT.map(at => (HOSTS[at < sw ? 'hollow34' : 'vault34'].bosses[c.tier] || []).filter(k => BESTIARY[k]));
    return {foot: kinds.hollow34.concat(kinds.vault34.filter(k => !kinds.hollow34.includes(k))), bosses};
  };
  P.gateBrief = c => !!(c && c.f34gate && c.host === 'hollow34' && F.active());
  if (window.BRIEFING && BRIEFING.kinds){ const f = BRIEFING.kinds; BRIEFING.kinds = function(c){
      const ks = f.apply(this, arguments);
      try { if (P.gateBrief(c)){
          const pl = P.plan(c), out = pl.foot.slice();
          pl.bosses.flat().forEach(k => { if (!out.includes(k)) out.push(k); });
          try { if (typeof G !== 'undefined' && G && G.contract === c) (G.enemies || []).forEach(e => { if (e && BESTIARY[e.k] && !out.includes(e.k)) out.push(e.k); }); } catch (e) {}
          return out; } } catch (e) { console.warn('PD23 kinds', e); }
      return ks; }; }
  // "Led by": the bosses in the order they come; one slot's choices joined by "or", the slots by ledThen
  P.ledBy = function(c){
    const role = k => k === 'orsolt' ? P.W('leader') : ((BRIEFING.ROLE && BRIEFING.ROLE[k]) || BRIEFING.an(BESTIARY[k].name));
    const slots = [];
    for (const b of P.plan(c).bosses){ const t = b.map(role).join(' or '); if (t && slots[slots.length - 1] !== t) slots.push(t); }
    return slots.join(P.W('ledThen'));
  };
  if (window.BRIEFING && BRIEFING.html){ const f = BRIEFING.html; BRIEFING.html = function(c){
      let h = f.apply(this, arguments);
      try { if (P.gateBrief(c) && typeof h === 'string'){
          const ks = BRIEFING.kinds(c), was = 'Led by ' + E(BRIEFING.chiefs(c, ks.filter(k => BESTIARY[k].boss)).join(' or ')), now = P.ledBy(c);
          if (now && h.includes(was)) h = h.replace(was, 'Led by ' + E(now)); } } catch (e) { console.warn('PD23 led', e); }
      try { if (c && c.f34gate && F.active() && typeof h === 'string') return h.split(E(B_ROLE())).join(E(P.W('leader'))); } catch (e) { console.warn('PD23 leader', e); }
      return h; }; }
  const B_ROLE = () => (BRIEFING.ROLE && BRIEFING.ROLE.orsolt) || 'a Hollow Reeve';
  // every gate fight starts with the Hollow (a retry too)
  { const f = startDeployment; startDeployment = function(c){
      try { if (c && c.f34gate && F.active()) c.host = 'hollow34'; } catch (e) {}
      return f.apply(this, arguments); }; }
  // the switch, before the wave is drawn
  P.tick = function(){
    if (!P.gate()) return false;
    const c = G.contract, at = P.at(c); if (!at || c.host !== 'hollow34') return false;
    const prog = G.raidT / (c.minutes * 3600); if (prog < at) return false;
    c.host = 'vault34'; G.pd23 = true;
    try { note(P.W('switch')); } catch (e) {}
    try { G.alert = {text: String(P.W('switchHead')).toUpperCase(), life: 300}; } catch (e) {}
    try { SFX.play('horn'); } catch (e) {}
    return true;
  };
  { const f = raidSpawn; raidSpawn = function(){
      try { P.tick(); } catch (e) { console.warn('PD23 switch', e); }
      return f.apply(this, arguments); }; }
  // b8 debrief
  { const f = contractDebrief; contractDebrief = function(c, result, lines){
      const r = f.apply(this, arguments);
      try { if (c && c.f34gate && c.f34 === 'b8' && lines && F.active()) lines.push(`<p><i>${E(P.W('b8'))}</i></p>`);
        if (c && c.f34gate && (c.f34 === 'b9' || c.f34 === 'b10') && c.host === 'vault34' && lines && F.active()) lines.push(`<p data-pd23="after"><i>${E(P.W(c.f34 + 'after'))}</i></p>`); } catch (e) { console.warn('PD23 b8', e); }
      return r; }; }

  /* ---- self-test: PD23.selfTest() (stubs; META, G and the globals are put back) ---- */
  P.selfTest = function(){
    const rows = [], ok = (n, c, x) => rows.push({n, ok: !!c, x});
    const sv = {M: META, G: typeof G !== 'undefined' ? G : null, slot: F.slotNow, note: note, sfx: SFX.play};
    try {
      const elf = k => /Frost-Vault|Deserter/.test(BESTIARY[k].name), undead = k => ['skeleton', 'ghoul'].includes(k);
      const H = HOSTS.hollow34, V = HOSTS.vault34, all = o => Object.values(o).flat();
      ok('every unit and boss exists', all(H.pools).concat(all(H.bosses), all(V.pools), all(V.bosses)).every(k => BESTIARY[k]));
      ok('the Hollow: no elves, no undead', all(H.pools).every(k => !elf(k) && !undead(k)));
      ok('the Frost-Vault host: elf units only', all(V.pools).every(elf));
      ok('random contracts never draw the Founding hosts', !HOST_KEYS.includes('hollow34') && !HOST_KEYS.includes('vault34'));
      ok('names: no "dead"', !/dead/i.test(H.name + H.the + V.name + V.the));
      META = freshMeta(); F.slotNow = SAVE_KEY; META.f34 = {beat: 7, log: [], leader: true};
      const b8 = F.BEATS.find(b => b.id === 'b8'), b9 = F.BEATS.find(b => b.id === 'b9'), b10 = F.BEATS.find(b => b.id === 'b10');
      const c8 = F.gateContract(b8);
      ok('b8: the Hollow, the briefing', c8.host === 'hollow34' && c8.brief.startsWith(P.W('brief')) && /Hold the North Gate/.test(c8.brief));
      const notes = []; note = t => notes.push(t); SFX.play = () => {};
      const run = (c, prog) => { G = {contract: c, def30: {}, over: false, raidT: prog * c.minutes * 3600}; return P.tick(); };
      ok('b8: no switch', !run(c8, 0.99) && c8.host === 'hollow34');
      const c9 = F.gateContract(b9);
      ok('b9: Hollow before two thirds', !run(c9, 0.6) && c9.host === 'hollow34');
      ok('b9: the Frost-Vault host at two thirds, one caption', run(c9, 0.67) && c9.host === 'vault34' && notes.length === 1 && notes[0] === P.W('switch') && (G.alert && G.alert.text === String(P.W('switchHead')).toUpperCase()) && !run(c9, 0.9) && notes.length === 1);
      { const l9 = []; G = null; contractDebrief(Object.assign({}, c9, {obj: 'hunt'}), 'victory', l9);
        ok('K80: b9 debrief after the switch: the b9after line', l9.some(x => x.includes(E(P.W('b9after'))))); }
      const c10 = F.gateContract(b10);
      ok('b10: one Hollow wave, then the Frost-Vault; Ilvaryn leads', !run(c10, 0.1) && run(c10, 0.17) && c10.host === 'vault34' && HOSTS.vault34.bosses[3][0] === 'ilvaryn');
      if (window.BRIEFING){ G = null;
        const k9 = BRIEFING.kinds(F.gateContract(b9)), k10 = BRIEFING.kinds(F.gateContract(b10)), k8 = BRIEFING.kinds(c8);
        ok('K80: b9 and b10 briefs name the Frost-Vault host', F.gateContract(b9).brief.endsWith(P.W('b9brief')) && F.gateContract(b10).brief.endsWith(P.W('b10brief')));
        ok('K80: the gate brief names the Hollow chief', BRIEFING.html(F.gateContract(b9)).includes('Led by ' + E(P.W('leader'))) && !BRIEFING.html(F.gateContract(b9)).includes(E(B_ROLE())));
        ok('K80: Likely foes: b9 adds the Frost-Vault, b10 is led by Ilvaryn only, b8 unchanged', k9.includes('pikeman') && k9.includes('orsolt') && k10.includes('ilvaryn') && !k10.includes('orsolt') && !k8.includes('pikeman'));
        ok('QA: b9 Likely foes list every kind its waves draw (Tier 1 to 3)', ['hedgewitch', 'brigand', 'phalanx', 'shadowhunter', 'enforcer'].every(k => k9.includes(k)), k9.join(','));
        const h9 = BRIEFING.html(F.gateContract(b9));
        ok('QA: b9 "Led by" names the bosses in turn, not one or the other', h9.includes('Led by ' + E(P.W('leader') + P.W('ledThen') + 'an Inquisitor-Apprentice or a mercenary captain')) && !h9.includes(E(P.W('leader')) + ' or '), (h9.match(/Led by [^<]*/) || [''])[0]); }
      G = null; const ln = []; contractDebrief(Object.assign({}, c8, {obj: 'hunt'}), 'victory', ln);
      ok('b8 debrief line', ln.some(x => x.includes(P.W('b8'))));
      META.f34.beat = F.BEATS.length; ok('after the hand-over: no switch', !run(F.gateContract(b9), 0.9));
    } catch (e) { ok('no throw: ' + e.message, false, String(e.stack).slice(0, 300)); }
    finally { META = sv.M; F.slotNow = sv.slot; G = sv.G; note = sv.note; SFX.play = sv.sfx; }
    const pass = rows.filter(r => r.ok).length;
    return {pass, total: rows.length, rows: rows.filter(r => !r.ok)};
  };
})();
