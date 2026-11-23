/* ============================================================================
   CLASS CATCHES (S6 row 2j; spec audits/specs/s6-2j-class-catches.md)
   The five Social Class catches that were names only now do something, and every screen that names a catch reads its
   words from here. A catch applies only while a Leader of that class leads (never a Squad Mate's class).
     Devout   Tithe Bound: the temple takes N.tithe gp after every contract that pays contract pay (never below 0).
     Edelos   Imperial Suspicion: -N.step at a Parley with an Empire commander.
     Freeman  Lowborn: -N.step when haggling a noble prisoner's ransom.
     Noble    High Ransom Target: N.ransom gp (or the whole Treasury) when a contract is lost or fled with the Leader down.
     Outcast  Shunned: -N.step at a Parley with a commander of a lawful power (N.lawful).
     Ex-Slave Scars of Servitude: unchanged (CLASSES.SLAVE.sl.con).
   NUMBERS: all in N, one place; the card words are filled from N, so a changed number changes the card (criterion 2).
   WORDS: stand-ins from the spec's section 7 in W. The Narrative Designer can replace any of them with the same keys under
   CAMPAIGN_LINES.catches (lines/campaign.js); nothing here needs to change.
   HOOKS: CLASSES[k].draw (a getter, so the old screens and the Leader sheet show the card's words); contractDebrief (temple
   tithe, after the Masters' Tithe); parlayMods; prDesc and the noble haggle in legwork.js; renderDebrief (ransom);
   leaderCardHTML and CAMP31.leadLine (the Leader's catch in camp); creator.js draws the card line and the shared note.
   SWITCH: CATCH2J.on = false stops the four costs (the words stay). ROLLBACK: delete this file and its <script> line; the
   edits in creator.js, legwork.js, sinks.js and campaign.js all test for window.CATCH2J or are words only.
============================================================================ */
(function(){
  'use strict';
  const C = window.CATCH2J = {on: true};
  const N = C.N = {tithe: 15, ransom: 25, step: 1, lawful: ['empire', 'mendor', 'suderia', 'dwarves']};
  const NUM = ['no', 'one', 'two', 'three', 'four'];
  const W = C.W = {
    label: 'Catch:',
    card: {
      DEVOUT: 'Tithe Bound. EVERY PAID JOB: your temple takes {tithe} gp of the pay. (A first job pays about {firstPay} gp.)',
      EDELOS: 'Imperial Suspicion. RARELY, and only against the Empire (one of the six powers at war): Empire commanders are harder for you to talk into a surrender: {stepWord} less on your roll (-{step} step).',
      FREEMAN: 'Lowborn. RARELY: when your company captures an enemy noble, their family buys them back from you. You bargain worse: {stepWord} less on your roll (-{step} step), so the family pays you less.',
      NOBLE: 'High Ransom Target. WHEN YOU LOSE A FIGHT and your Leader is down: you pay {ransom} gp to get them back, or all your gold if you have less. They always come back.',
      OUTCAST: 'Shunned. SOMETIMES, against {lawfulCount} of the six powers at war (the lawful ones): their commanders are harder for you to talk into a surrender: {stepWord} less on your roll (-{step} step).',
      SLAVE: 'Scars of Servitude. ALWAYS: {slaveCon} Condition (Condition is health).'
    },
    surrender: 'Some catches name a surrender. When your squad has an enemy commander nearly beaten, they may offer to give up. Talk them round and you win the fight early and sell them for about {prisonerValue} gp.',
    noUse: 'Does nothing for a {specialty}.',
    tithe: "Temple tithe: <b>-{t}gp</b> to your Leader's temple (Devout: Tithe Bound). Treasury now {n} gp.",
    masters: ' (every company pays it)',
    parlay: {EDELOS: '-{step} step Imperial Suspicion (your Leader is Edelōs)', OUTCAST: '-{step} step Shunned (your Leader is an Outcast)'},
    haggle: '-{step} step Lowborn (your Leader is a Freeman)',
    ransom: 'Ransom: <b>-{r}gp</b>. The enemy took your Leader and sold them back (Noble: High Ransom Target). They are home.'
  };
  // the Narrative Designer's words win where they exist
  const word = (k, sub) => { let o = null; try { o = window.CAMPAIGN_LINES && CAMPAIGN_LINES.catches; } catch (e) {}
    const a = o && o[k], b = W[k]; return sub ? ((a && a[sub]) || (b && b[sub]) || '') : (a || b || ''); };

  /* ---- the figures the words quote, each read from the place the game uses ---------------------------------------------- */
  C.firstPay = () => { try { const b = window.F34 && F34.BEATS && F34.BEATS.find(x => x.kind === 'fight' && x.pay > 0); if (b) return b.pay; } catch (e) {}
    try { return Math.round(CONTRACTS.escort.pay * TIER_PAY[1] / 5) * 5; } catch (e) { return 0; } };
  C.prisonerValue = () => (typeof COMMANDER_PRISONER_VALUE !== 'undefined' ? COMMANDER_PRISONER_VALUE : 100);
  C.vals = more => Object.assign({tithe: N.tithe, ransom: N.ransom, step: N.step, stepWord: NUM[N.step] || String(N.step), lawfulCount: NUM[N.lawful.length] || String(N.lawful.length),
    firstPay: C.firstPay(), prisonerValue: C.prisonerValue(), slaveCon: (() => { try { const v = CLASSES.SLAVE.sl.con; return (v > 0 ? '+' : '') + v; } catch (e) { return '-1'; } })()}, more || {});
  const fill = C.fill = (s, more) => { const v = C.vals(more); return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); };

  /* ---- words ------------------------------------------------------------------------------------------------------------ */
  C.line = cls => fill(word('card', cls));                                   // the catch line: card, sheet and camp all use this
  C.html = cls => { const t = C.line(cls); return t ? `<b>${esc(word('label'))}</b> ${esc(t)}` : ''; };
  C.surrender = () => fill(word('surrender'));
  // 3g: a bonus that does nothing for the Specialty already picked says so (Devout's +1 Magic on a non-caster)
  C.noUse = (cls, spec) => { try { if (cls === 'DEVOUT' && spec && SPECS[spec] && !SPECS[spec].caster) return fill(word('noUse'), {specialty: SPECS[spec].name}); } catch (e) {} return ''; };

  /* ---- rules (pure: the class and the figures are passed in) ---------------------------------------------------------------- */
  C.titheDue = (cls, paid, treasury) => (C.on && cls === 'DEVOUT' && paid > 0) ? Math.min(Math.max(0, treasury | 0), N.tithe) : 0;
  C.parlayLine = (cls, fac) => !C.on ? '' : (cls === 'EDELOS' && fac === 'empire') ? fill(word('parlay', 'EDELOS')) : (cls === 'OUTCAST' && N.lawful.includes(fac)) ? fill(word('parlay', 'OUTCAST')) : '';
  C.haggle = (cls, pr) => (C.on && cls === 'FREEMAN' && pr && pr.kind === 'noble') ? {step: N.step, text: fill(word('haggle'))} : null;
  C.ransomDue = (cls, result, down, treasury) => (C.on && cls === 'NOBLE' && (result === 'fled' || result === 'fallen') && down) ? Math.min(Math.max(0, treasury | 0), N.ransom) : 0;
  /* Criterion 16: in the Founding a lost fight that is simply played again charges nothing. A loss stands only on the beats
     that say so (loseTo, loseOk: the gate fights b8 to b10). Lead jobs and the Long Road's nights charge nothing. */
  C.lossStands = c => { try {
      if (window.F34 && F34.roadOn && F34.roadOn()) return false;
      if (!c || !c.f34) return true;
      if (c.f34lead) return false;
      if (c.f34 === 'b10') return false;   /* GD 423059fe: the Keep's gate is scripted to fall (breachAt 0.8) and its waves do not end: a loss the player cannot avoid costs no ransom */
      const b = F34.BEATS.find(x => x.id === c.f34); return !!(b && (b.loseTo || b.obj === 'defence'));
    } catch (e) { return true; } };
  const leaderCls = C.leaderCls = () => { try { return (META && META.leader && META.leader.cls) || null; } catch (e) { return null; } };

  /* ---- hooks ------------------------------------------------------------------------------------------------------------ */
  // the cards' old `draw` text is now the catch line, so the old Creator screens and the Leader sheet read the same words
  try { for (const k of Object.keys(CLASSES)) Object.defineProperty(CLASSES[k], 'draw', {get: () => C.line(k), enumerable: true, configurable: true}); } catch (e) { console.warn('catches: draw', e); }

  // Devout: the temple tithe, its own ledger line after the Masters' Tithe
  if (typeof contractDebrief === 'function'){ const f = contractDebrief;
    contractDebrief = function(c, result, lines){
      f.apply(this, arguments);
      try {
        if (!G || G.tithe2j != null) return; G.tithe2j = 0;
        const paid = (window.SINKS && SINKS.paidBase) ? SINKS.paidBase(c, result) : 0, t = C.titheDue(leaderCls(), paid, META.treasury);
        if (!t) return;
        META.treasury -= t; G.tithe2j = t;
        for (let i = 0; i < lines.length; i++) if (!/Masters' Tithe/.test(lines[i])) lines[i] = String(lines[i]).replace(/(Now|Treasury now) -?\d+gp/, '$1 ' + META.treasury + 'gp');
        lines.push('<p data-tithe2j>' + fill(word('tithe'), {t, n: META.treasury}) + '</p>');
      } catch (e) { console.warn('catches: tithe', e); }
    };
  }
  // Edelos and Outcast: the Parley
  if (typeof parlayMods === 'function'){ const f = parlayMods;
    parlayMods = function(e){ const out = f.apply(this, arguments);
      try { const t = C.parlayLine(leaderCls(), COMMANDER_FACTION[e.k]); if (t) out.push(t); } catch (x) {}
      return out; };
  }
  // Freeman: the noble prisoner's line in the camp names the catch before the haggle (the roll itself is in legwork.js)
  if (typeof prDesc === 'function'){ const f = prDesc;
    prDesc = function(pr){ let h = f.apply(this, arguments);
      try { const g = C.haggle(leaderCls(), pr); if (g) h += `<br><span data-catch2j="haggle">${esc(g.text)}</span>`; } catch (x) {}
      return h; };
  }
  // Noble: the ransom, once per contract, on the debrief
  if (typeof renderDebrief === 'function'){ const f = renderDebrief;
    const w = function(head, lines){
      try {
        // later steps (salvage) move the Treasury after the tithe line is written: its figure is brought up to date at every draw
        if (G && G.tithe2j && Array.isArray(lines)) for (let i = 0; i < lines.length; i++) if (/^<p data-tithe2j>/.test(lines[i])) lines[i] = lines[i].replace(/(Treasury now )-?\d+/, '$1' + META.treasury);
        if (G && G.over && G.ransom2j == null && Array.isArray(lines)){
          G.ransom2j = 0;
          const L = G.leader, r = C.lossStands(G.contract) ? C.ransomDue(leaderCls(), G.result, !!(L && L.down), META.treasury) : 0;
          if (r){ META.treasury -= r; G.ransom2j = r;
            for (let i = 0; i < lines.length; i++) lines[i] = String(lines[i]).replace(/(Now|Treasury now) -?\d+gp/, '$1 ' + META.treasury + 'gp');
            lines.push('<p class="bad">' + fill(word('ransom'), {r}) + '</p>'); saveMeta(); }
        }
      } catch (e) { console.warn('catches: ransom', e); }
      return f.apply(this, arguments);
    };
    Object.defineProperty(w, 'last', {get: () => f.last, set: v => { f.last = v; }, configurable: true});
    renderDebrief = w;
  }
  // criterion 15: where the camp shows the Leader's class, it shows the catch in the card's words
  const isLeader = p => { try { return !!(p && META && p === META.leader); } catch (e) { return false; } };
  if (typeof leaderCardHTML === 'function'){ const f = leaderCardHTML;
    leaderCardHTML = function(L){ const h = f.apply(this, arguments);
      try { if (isLeader(L) && C.line(L.cls)) return h.replace('<div class="stat">', `<div class="desc" data-catch2j="card">${C.html(L.cls)}</div><div class="stat">`); } catch (e) {}
      return h; };
  }
  if (window.CAMP31 && typeof CAMP31.leadLine === 'function'){ const f = CAMP31.leadLine;
    CAMP31.leadLine = function(p){ const h = f.apply(this, arguments);
      try { if (isLeader(p) && C.line(p.cls)) return h + `<div class="desc" data-catch2j="camp" style="margin-top:6px">${C.html(p.cls)}</div>`; } catch (e) {}
      return h; };
  }

  /* ---- self-test: CATCH2J.selfTest() ------------------------------------------------------------------------------------- */
  C.selfTest = function(){
    const R = {pass: 0, fail: 0, bad: []}, ok = (n, c) => { if (c) R.pass++; else { R.fail++; R.bad.push(n); } };
    const n0 = Object.assign({}, N, {lawful: N.lawful.slice()});
    try {
      for (const k of Object.keys(CLASSES)){ const t = C.line(k);
        ok(k + ': a catch line with a frequency word and no empty slot', t.length > 30 && !/\{\w+\}/.test(t) && /[A-Z]{4,}/.test(t));
        ok(k + ': the old draw text is the same line', CLASSES[k].draw === t); }
      ok('the Devout card quotes the tithe and a first job', C.line('DEVOUT').includes(N.tithe + ' gp') && C.line('DEVOUT').includes(C.firstPay() + ' gp') && C.firstPay() > 0);
      ok('the Noble card quotes the ransom', C.line('NOBLE').includes(N.ransom + ' gp'));
      ok('the step cards quote the step', ['EDELOS', 'FREEMAN', 'OUTCAST'].every(k => C.line(k).includes('-' + N.step + ' step')));
      ok('the Outcast card counts the lawful powers', C.line('OUTCAST').includes(NUM[N.lawful.length]));
      N.tithe = 22; N.ransom = 31; N.step = 2;
      ok('a changed number changes the card', C.line('DEVOUT').includes('22 gp') && C.line('NOBLE').includes('31 gp') && C.line('EDELOS').includes('two less') && C.line('EDELOS').includes('-2 step'));
      ok('a changed number changes the charge', C.titheDue('DEVOUT', 300, 500) === 22 && C.ransomDue('NOBLE', 'fled', true, 500) === 31 && C.haggle('FREEMAN', {kind: 'noble'}).step === 2 && parseInt(C.parlayLine('EDELOS', 'empire')) === -2);
      Object.assign(N, n0);
      ok('the surrender note quotes the prisoner value', C.surrender().includes(C.prisonerValue() + ' gp') && !/\{/.test(C.surrender()));
      ok('3g: Devout says so for a Soldier, not for a Cleric', /Soldier/.test(C.noUse('DEVOUT', 'SOLDIER')) && C.noUse('DEVOUT', 'CLERIC') === '' && C.noUse('NOBLE', 'SOLDIER') === '');
      // Devout
      ok('tithe: a paid contract', C.titheDue('DEVOUT', 300, 500) === N.tithe);
      ok('tithe: no contract pay, no tithe', C.titheDue('DEVOUT', 0, 500) === 0);
      ok('tithe: never below 0', C.titheDue('DEVOUT', 300, 9) === 9 && C.titheDue('DEVOUT', 300, 0) === 0 && C.titheDue('DEVOUT', 300, -40) === 0);
      ok('tithe: only a Devout Leader', CLASS_ORDER.filter(k => k !== 'DEVOUT').every(k => C.titheDue(k, 300, 500) === 0));
      // Parley
      ok('Edelos: the Empire only', parseInt(C.parlayLine('EDELOS', 'empire')) === -N.step && ['mendor', 'suderia', 'dwarves', 'skulk', 'orcs', 'frostvault', undefined].every(f => C.parlayLine('EDELOS', f) === ''));
      ok('Outcast: the four lawful powers only', N.lawful.every(f => parseInt(C.parlayLine('OUTCAST', f)) === -N.step) && ['skulk', 'orcs', 'frostvault', undefined].every(f => C.parlayLine('OUTCAST', f) === ''));
      ok('no other class has a Parley line (the Noble has none)', ['DEVOUT', 'FREEMAN', 'NOBLE', 'SLAVE'].every(k => ['empire', 'mendor', 'skulk'].every(f => C.parlayLine(k, f) === '')));
      ok('the Parley lines name the catch and the class', /Imperial Suspicion/.test(C.parlayLine('EDELOS', 'empire')) && /Shunned/.test(C.parlayLine('OUTCAST', 'mendor')));
      // Freeman
      ok('haggle: a Freeman and a noble prisoner', !!C.haggle('FREEMAN', {kind: 'noble'}) && /Lowborn/.test(C.haggle('FREEMAN', {kind: 'noble'}).text));
      ok('haggle: not a commander, not another class', !C.haggle('FREEMAN', {kind: 'commander'}) && !C.haggle('OUTCAST', {kind: 'noble'}) && !C.haggle('FREEMAN', null));
      // Noble
      ok('ransom: lost or fled with the Leader down', C.ransomDue('NOBLE', 'fled', true, 500) === N.ransom && C.ransomDue('NOBLE', 'fallen', true, 500) === N.ransom);
      ok('ransom: all the Treasury if it is less', C.ransomDue('NOBLE', 'fled', true, 10) === 10 && C.ransomDue('NOBLE', 'fled', true, 0) === 0);
      ok('ransom: not with the Leader standing, not on a win', C.ransomDue('NOBLE', 'fled', false, 500) === 0 && C.ransomDue('NOBLE', 'victory', true, 500) === 0 && C.ransomDue('NOBLE', 'withdrawn', true, 500) === 0);
      ok('ransom: only a Noble Leader', CLASS_ORDER.filter(k => k !== 'NOBLE').every(k => C.ransomDue(k, 'fled', true, 500) === 0));
      // the Founding
      if (window.F34 && F34.BEATS){
        ok('Founding: a retried fight charges no ransom (b5), a loss that stands does (b8, b9), the scripted Keep loss (b10) does not', !C.lossStands({f34: 'b5'}) && C.lossStands({f34: 'b8'}) && C.lossStands({f34: 'b9'}) && !C.lossStands({f34: 'b10'}));
        ok('Founding: a lead job charges no ransom', !C.lossStands({f34: 'b9', f34lead: 'raid'}));
      }
      ok('main game: a loss stands', C.lossStands({obj: 'hunt'}) || !!(window.F34 && F34.roadOn && F34.roadOn()));
      // the switch
      C.on = false;
      ok('switch off: no cost, the words stay', C.titheDue('DEVOUT', 300, 500) === 0 && C.parlayLine('EDELOS', 'empire') === '' && !C.haggle('FREEMAN', {kind: 'noble'}) && C.ransomDue('NOBLE', 'fled', true, 500) === 0 && C.line('DEVOUT').length > 30);
      C.on = true;
    } catch (e) { R.fail++; R.bad.push('threw: ' + (e && e.message)); }
    finally { Object.assign(N, n0); C.on = true; }
    console.log('CATCH2J self-test: ' + R.pass + ' passed, ' + R.fail + ' failed' + (R.bad.length ? ' (' + R.bad.join('; ') + ')' : ''));
    return R;
  };
})();
