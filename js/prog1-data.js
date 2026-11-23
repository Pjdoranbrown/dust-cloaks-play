/* ============================================================================
   INDEX PROG1 - PROG-1 step 1: THE ENTRY SHEET (data only, 2026-11-15)
   Source: audits/progression-plan.md sections 2.2 (tiers, gates), 2.6
   (buildings, traits) and 3 (what each card becomes).
   Data only: it changes no play by itself. Read by js/prog3.js (step 3, the
   trait list; part of the game since PROG-1 step 4); steps 2 and 4 read it later.
   One row for every card id (CARDS in index.html), every ladder id
   (BOOK33.LAD), the six starting actives (ABIL33.REG) and the six fixed first
   passives (BOOK33.START_AUTO, which have no id in the game today: p_*).

   Row: [id, name, Specialty, kind, tier, gate, src, flags]
     kind  technique  on the ladder or a start entry (slots)
           trait      always on, no slot; trained at the building (an Advancement)
           cut        a card removed from the trait lists; 'to' names its technique
           doctrine   a doctrine card; stays where it is (Command Tent keeps doctrines)
           general    a card with no Specialty; outside PROG-1, unchanged
     tier  Q Quick (passive, own cooldown) | B Battle (active; x1.5 in a passive
           slot) | P Prepared (key only, never passive) | T trait | '' none
     gate  a number: Magic for Mage, Cleric, Witch; Level for Soldier, Folk
           Hero, Scoundrel. 0 = no gate.
     src   fixed (first passive) | start (starting key) | L1 | L2 | scroll |
           train (trait at the building) | '' (cut, doctrine, general)
     flags S    = an [S] draft: an open question filled with the recommended option
           card = the id is a card today; lad = on the ladder today;
           new  = not in the game yet; to:x = replaced by technique x
   RULED (Patrick 2026-11-15, Q12): the Mage follows the Manual. Burning Hands
     is her starting key, Lightning Bolt needs Magic 2 (a library entry, L1),
     and her road gift is Ray of Frost. Not a draft any more.
   [S] drafts (morning.md, still open on 2026-11-15):
     Fireball moves to L2 at Magic 3 (built: L1, no gate): a knob in the plan.
     Q13 Martial gates are Levels: L1 = Level 1, L2 = Level 3, scroll = Level 5.
     Q14 Prepared tier: key only, long cooldown, never in a passive slot.
   Buildings: PROG1.BUILD (from BOOK33.LIB; '#x' = a veteran on staff at x).
============================================================================ */
(function(){
  'use strict';
  const P = window.PROG1 = {wired: true};   // loaded before js/prog3.js

  P.BUILD = {SOLDIER: ['training', '#training'], FOLK_HERO: ['ranger', '#ranger'], SCOUNDREL: ['tavern', 'cells'],
             MAGE: ['magetower', '#magetower'], WITCH: ['alchemy', '#alchemy'], CLERIC: ['chapel', 'fortresschurch']};
  P.BUILD_NAME = {SOLDIER: 'Training Ground', FOLK_HERO: 'Ranger Lodge', SCOUNDREL: 'Tavern, Cells',
                  MAGE: 'Mage Tower', WITCH: 'Alchemy Lab', CLERIC: 'Chapel, Fortress Church'};
  P.GATE_STAT = {SOLDIER: 'level', FOLK_HERO: 'level', SCOUNDREL: 'level', MAGE: 'magic', WITCH: 'magic', CLERIC: 'magic'};

  const RAW = [
    /* ---- Mage (Mage Tower; gate = Magic) ---- */
    ['p_missile',   'Magic Missile',        'MAGE', 'technique', 'Q', 1, 'fixed',  'new'],
    ['frost',       'Ray of Frost',         'MAGE', 'technique', 'Q', 1, 'L1',     'card new'],          // the 26th ladder entry; a card today; the Mage's road gift (Q12)
    ['burning',     'Burning Hands',        'MAGE', 'technique', 'B', 1, 'start',  'card lad'],          // Q12 ruled: the starting key (built: L1)
    ['bolt',        'Lightning Bolt',       'MAGE', 'technique', 'B', 2, 'L1',     ''],                  // Q12 ruled: Magic 2 (built: the start key)
    ['fireball',    'Fireball',             'MAGE', 'technique', 'B', 3, 'L2',     'card lad S'],        // [S] knob; built L1, no gate
    ['tremor',      'Earthquake Tremor',    'MAGE', 'technique', 'B', 4, 'scroll', 'card lad'],
    ['stonewall',   'Conjure Stone Wall',   'MAGE', 'technique', 'P', 2, 'L2',     'card lad S'],        // Q14 [S]
    ['decoy',       'Illusory Decoy',       'MAGE', 'technique', 'P', 3, 'L2',     'card lad S'],
    ['warded',      'Warded Robes',         'MAGE', 'trait', 'T', 0, 'train', 'card'],
    ['precision',   'Arcane Precision',     'MAGE', 'trait', 'T', 0, 'train', 'card'],
    ['margin',      'Grimoire Margin',      'MAGE', 'trait', 'T', 0, 'train', 'card'],
    ['counterspell','Counterspell Reflex',  'MAGE', 'trait', 'T', 0, 'train', 'card'],
    /* ---- Cleric (Chapel, Fortress Church; gate = Magic) ---- */
    ['p_mending',   'Mending Prayer',       'CLERIC', 'technique', 'Q', 1, 'fixed',  'new'],
    ['cure',        'Cure Wounds',          'CLERIC', 'technique', 'B', 1, 'start',  ''],
    ['masscure',    'Mass Cure',            'CLERIC', 'technique', 'B', 1, 'L1',     'card lad'],
    ['bless',       'Bless the Line',       'CLERIC', 'technique', 'B', 1, 'L1',     'card lad'],
    ['flamestrike', 'Flame Strike',         'CLERIC', 'technique', 'B', 3, 'L2',     'card lad'],
    ['silence',     'Silence the Unholy',   'CLERIC', 'technique', 'B', 3, 'scroll', 'card lad'],
    ['litany',      'Litany of the Shield', 'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    ['warden',      'Warden of the Line',   'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    ['chaplain',    'Field Chaplain',       'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    ['censure',     'Censure',              'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    ['sanctified',  'Sanctified Blade',     'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    ['lastrites',   'Last Rites',           'CLERIC', 'trait', 'T', 0, 'train', 'card'],
    /* ---- Witch (Alchemy Lab; gate = Magic) ---- */
    ['p_hex',       'Withering Hex',        'WITCH', 'technique', 'Q', 1, 'fixed',  'new'],
    ['illusion',    'Dark Illusion',        'WITCH', 'technique', 'Q', 1, 'start',  ''],
    ['omen',        'Bleeding Omen',        'WITCH', 'technique', 'B', 1, 'L1',     'card lad'],
    ['briar',       'Briar Thicket',        'WITCH', 'technique', 'B', 1, 'L1',     'card lad'],
    ['veil',        'Veil of Shadows',      'WITCH', 'technique', 'P', 1, 'L2',     'card lad S'],
    ['raindance',   'Rain Dance',           'WITCH', 'technique', 'P', 3, 'scroll', 'card lad S'],
    ['thornwise',   'Thorn-Wise',           'WITCH', 'trait', 'T', 0, 'train', 'card'],
    ['lingering',   'Lingering Hex',        'WITCH', 'trait', 'T', 0, 'train', 'card'],
    ['evileye',     'Evil Eye',             'WITCH', 'trait', 'T', 0, 'train', 'card'],
    ['hex',         'Withering Aura',       'WITCH', 'trait', 'T', 0, 'train', 'card'],                 // stays a trait
    /* ---- Soldier (Training Ground; gate = Level, Q13 [S]) ---- */
    ['p_sweep',     'Sweep',                'SOLDIER', 'technique', 'Q', 1, 'fixed',  'new S'],
    ['bash',        'Shield Bash',          'SOLDIER', 'technique', 'B', 1, 'start',  'S'],
    ['push',        'Push Back',            'SOLDIER', 'technique', 'B', 1, 'L1',     'lad S'],
    ['spearwall',   'Spearwall',            'SOLDIER', 'technique', 'B', 1, 'L1',     'lad S'],
    ['sprint',      'Sprint',               'SOLDIER', 'technique', 'B', 3, 'L2',     'lad S'],
    ['breakarm',    'Break Armour',         'SOLDIER', 'technique', 'Q', 5, 'scroll', 'lad S'],
    ['armourbreak', 'Armour Break',         'SOLDIER', 'cut', '', 0, '', 'card to:breakarm'],
    ['vanguard',    'Vanguard',             'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    ['bleeding',    'Bleeding Wound',       'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    ['taunt',       'Taunt',                'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    ['shieldwall',  'Shield Wall Mastery',  'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    ['disarm',      'Disarm',               'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    ['impcharge',   'Improved Charge',      'SOLDIER', 'trait', 'T', 0, 'train', 'card'],
    /* ---- Folk Hero (Ranger Lodge; gate = Level, Q13 [S]) ---- */
    ['p_marksman',  'Marksman',             'FOLK_HERO', 'technique', 'Q', 1, 'fixed',  'new S'],
    ['command',     'Command',              'FOLK_HERO', 'technique', 'B', 1, 'start',  'S'],
    ['rally',       'Rallying Cry',         'FOLK_HERO', 'technique', 'B', 1, 'L1',     'card lad S'],  // the card is cut from the trait list
    ['volley',      'Volley Fire',          'FOLK_HERO', 'technique', 'B', 1, 'L1',     'card lad S'],  // the doctrine card becomes the technique
    ['assist',      'Assist Allies',        'FOLK_HERO', 'technique', 'Q', 3, 'L2',     'card lad S'],  // the card is cut from the trait list
    ['overwatch',   'Overwatch',            'FOLK_HERO', 'technique', 'B', 5, 'scroll', 'lad S'],
    ['scout',       'Scout',                'FOLK_HERO', 'trait', 'T', 0, 'train', 'card'],
    ['getback',     'Get Back in the Fight','FOLK_HERO', 'trait', 'T', 0, 'train', 'card'],
    ['defiant',     'Defiant Stand',        'FOLK_HERO', 'trait', 'T', 0, 'train', 'card'],
    ['skirmisher',  'Skirmisher Drill',     'FOLK_HERO', 'doctrine', '', 0, '', 'card'],                // the plan does not name it: left as it is
    /* ---- Scoundrel (Tavern, Cells; gate = Level, Q13 [S]) ---- */
    ['p_softspot',  'Soft Spot',            'SCOUNDREL', 'technique', 'Q', 1, 'fixed',  'new S'],
    ['called',      'Called Shot',          'SCOUNDREL', 'technique', 'B', 1, 'start',  'S'],
    ['highlight',   'Highlight Weakness',   'SCOUNDREL', 'technique', 'Q', 1, 'L1',     'card lad S'],  // the card is cut from the trait list
    ['poison',      'Poison the Blade',     'SCOUNDREL', 'technique', 'B', 3, 'L2',     'lad S'],
    ['disengage',   'Disengage',            'SCOUNDREL', 'technique', 'B', 3, 'L2',     'lad S'],
    ['smoke',       'Smoke',                'SCOUNDREL', 'technique', 'B', 5, 'scroll', 'lad S'],
    ['poisoned',    'Poisoned Edge',        'SCOUNDREL', 'cut', '', 0, '', 'card to:poison'],
    ['softspot',    'Sharpen the Soft Spot','SCOUNDREL', 'trait', 'T', 0, 'train', 'card'],
    ['cutpurse',    'Cut Purse',            'SCOUNDREL', 'trait', 'T', 0, 'train', 'card'],
    ['slipline',    'Slip the Line',        'SCOUNDREL', 'trait', 'T', 0, 'train', 'card'],
    ['nobody',      'Nobody Saw Me',        'SCOUNDREL', 'trait', 'T', 0, 'train', 'card'],
    /* ---- cards with no Specialty: outside PROG-1, unchanged ---- */
    ['veteran',     "Veteran's Edge",       '', 'general', '', 0, '', 'card'],
    ['radius',      'Hold the Line',        '', 'general', '', 0, '', 'card'],
    ['plunder',     'Plunder Management',   '', 'general', '', 0, '', 'card'],
    ['fieldmed',    'Field Medicine',       '', 'general', '', 0, '', 'card'],
    ['stakes',      'Stake Line',           '', 'general', '', 0, '', 'card'],
    ['sharpers',    'Sharpers',             '', 'general', '', 0, '', 'card']
  ];

  P.ENTRIES = RAW.map(r => {
    const f = r[7] ? r[7].split(' ') : [], to = f.find(x => x.indexOf('to:') === 0);
    return {id: r[0], name: r[1], spec: r[2], kind: r[3], tier: r[4], gate: r[5], gateStat: r[2] && r[3] === 'technique' ? P.GATE_STAT[r[2]] : '',
            src: r[6], building: r[2] ? P.BUILD[r[2]][r[6] === 'L2' ? 1 : 0] : '', draft: f.includes('S'),
            card: f.includes('card'), lad: f.includes('lad'), isNew: f.includes('new'), to: to ? to.slice(3) : ''};
  });
  P.BY = {}; P.ENTRIES.forEach(e => { P.BY[e.id] = e; });
  P.of = spec => P.ENTRIES.filter(e => e.spec === spec);
  P.techniques = spec => P.ENTRIES.filter(e => e.kind === 'technique' && (!spec || e.spec === spec));
  P.traits = spec => P.ENTRIES.filter(e => e.kind === 'trait' && (!spec || e.spec === spec));

  /* Section 2.2, typed a second time on its own (tier and gate by name), so a slip in the table above shows. */
  P.S22 = {
    MAGE: 'Magic Missile Q1, Ray of Frost Q1, Burning Hands B1, Lightning Bolt B2, Fireball B3, Earthquake Tremor B4, Conjure Stone Wall P2, Illusory Decoy P3',
    CLERIC: 'Mending Prayer Q1, Cure Wounds B1, Mass Cure B1, Bless the Line B1, Flame Strike B3, Silence the Unholy B3',
    WITCH: 'Withering Hex Q1, Dark Illusion Q1, Bleeding Omen B1, Briar Thicket B1, Veil of Shadows P1, Rain Dance P3',
    SOLDIER: 'Sweep Q1, Shield Bash B1, Push Back B1, Spearwall B1, Sprint B3, Break Armour Q5',
    FOLK_HERO: 'Marksman Q1, Command B1, Rallying Cry B1, Volley Fire B1, Assist Allies Q3, Overwatch B5',
    SCOUNDREL: 'Soft Spot Q1, Called Shot B1, Highlight Weakness Q1, Poison the Blade B3, Disengage B3, Smoke B5'
  };

  P.selfTest = function(){
    const rows = [], ok = (n, p, i) => rows.push({name: n, pass: !!p, info: i == null ? '' : String(i)});
    const gl = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
    try {
      const ids = P.ENTRIES.map(e => e.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      ok('no id appears twice', !dup.length, dup.join(', '));
      ok('every row is whole', P.ENTRIES.every(e => e.id && e.name && ['technique', 'trait', 'cut', 'doctrine', 'general'].includes(e.kind) &&
        (e.kind !== 'technique' || (/^[QBP]$/.test(e.tier) && e.gate >= 1 && ['fixed', 'start', 'L1', 'L2', 'scroll'].includes(e.src) && e.building)) &&
        (e.kind !== 'trait' || (e.tier === 'T' && e.src === 'train' && e.building))));
      ok('a cut card names a technique in the sheet', P.ENTRIES.filter(e => e.kind === 'cut').every(e => P.BY[e.to] && P.BY[e.to].kind === 'technique' && P.BY[e.to].spec === e.spec));
      /* tiers and gates against section 2.2 */
      const bad = []; let n22 = 0;
      for (const spec in P.S22) {
        const want = P.S22[spec].split(', ').map(s => { const m = /^(.*) ([QBP])(\d)$/.exec(s); return {name: m[1], tier: m[2], gate: +m[3]}; });
        const have = P.techniques(spec); n22 += want.length;
        if (have.length !== want.length) bad.push(spec + ' count ' + have.length + '/' + want.length);
        for (const w of want) { const e = have.find(x => x.name === w.name); if (!e) bad.push(spec + ': no ' + w.name); else if (e.tier !== w.tier || e.gate !== w.gate) bad.push(w.name + ' ' + e.tier + e.gate + ' not ' + w.tier + w.gate); }
        const s = k => have.filter(e => e.src === k).length;
        if (s('fixed') !== 1 || s('start') !== 1) bad.push(spec + ' needs one fixed passive and one starting key');
      }
      ok('tiers and gates match section 2.2 (38 techniques)', !bad.length && n22 === 38 && P.techniques().length === 38, bad.join('; '));
      ok('Prepared entries are never a first passive or a starting key', P.techniques().filter(e => e.tier === 'P').every(e => e.src !== 'fixed' && e.src !== 'start'));
      ok('fixed first passives are Quick', P.techniques().filter(e => e.src === 'fixed').every(e => e.tier === 'Q'));
      ok('27 traits, each Specialty has some', P.traits().length === 27 && Object.keys(P.BUILD).every(s => P.traits(s).length >= 3), Object.keys(P.BUILD).map(s => s + ' ' + P.traits(s).length).join(', '));
      ok('martial gates and open questions carry the [S] mark', P.techniques().filter(e => e.gateStat === 'level').every(e => e.draft) && !P.BY.bolt.draft && !P.BY.burning.draft && ['fireball', 'stonewall', 'decoy', 'veil', 'raindance'].every(id => P.BY[id].draft));
      ok('loaded before step 3 (js/prog3.js reads it)', P.wired === true && (!window.PROG || typeof window.PROG.isTrait === 'function'));
      /* against the live game, where it is loaded */
      const C = gl('CARDS'), A = window.ABIL33, B = window.BOOK33;
      if (Array.isArray(C)) {
        const miss = C.filter(c => !P.BY[c.id] || !P.BY[c.id].card).map(c => c.id), extra = P.ENTRIES.filter(e => e.card && !C.some(c => c.id === e.id)).map(e => e.id);
        ok('every CARDS id is in the sheet once, and no other is marked a card', !miss.length && !extra.length, 'missing: ' + miss.join(',') + ' extra: ' + extra.join(','));
        ok('card Specialties agree', C.every(c => !P.BY[c.id] || (c.spec || '') === P.BY[c.id].spec), C.filter(c => P.BY[c.id] && (c.spec || '') !== P.BY[c.id].spec).map(c => c.id).join(','));
        const tr = C.filter(c => c.ability).map(c => c.id), odd = tr.filter(id => !['trait', 'cut'].includes(P.BY[id].kind) && !['rally', 'assist', 'highlight'].includes(id));
        ok('every trait card today is a trait, or one of the five cut', !odd.length && tr.filter(id => P.BY[id].kind === 'trait').length === 26, odd.join(','));   // 'hex' is the 27th: a studied card that stays a trait
      }
      /* the built rules (PROG-1): Ray of Frost and Lightning Bolt join the ladder as Mage Tower entries,
         the ladder sources are the plan's, and the Mage's key is Burning Hands */
      const onLad = id => P.BY[id] && (P.BY[id].lad || id === 'frost' || id === 'bolt');
      if (B && B.LAD) {
        const L = Object.keys(B.LAD), miss = L.filter(id => !onLad(id) || P.BY[id].kind !== 'technique'), extra = P.ENTRIES.filter(e => onLad(e.id) && !B.LAD[e.id]).map(e => e.id), nL = 27;
        ok('every ladder id is in the sheet once (' + nL + ')', !miss.length && !extra.length && L.length === nL, 'missing: ' + miss.join(',') + ' extra: ' + extra.join(','));
        ok('ladder Specialties and names agree', L.every(id => P.BY[id] && B.LAD[id].spec === P.BY[id].spec && B.LAD[id].name === P.BY[id].name));
        const moved = L.filter(id => P.BY[id] && B.LAD[id].src !== P.BY[id].src);
        ok('ladder sources agree with the plan', !moved.length, moved.join(','));
        ok('the 13 studied cards are all ladder techniques', (B.MIG || []).length === 13 && B.MIG.every(id => P.BY[id] && P.BY[id].kind === 'technique' && P.BY[id].card && P.BY[id].lad));
        ok('buildings match BOOK33.LIB', JSON.stringify(B.LIB) === JSON.stringify(P.BUILD));
        if (B.START_AUTO) ok('first passives match BOOK33.START_AUTO', Object.keys(B.START_AUTO).every(s => P.techniques(s).some(e => e.src === 'fixed' && e.name === B.START_AUTO[s])));
      }
      if (A && A.REG) {
        const R = Object.keys(A.REG), miss = R.filter(id => !P.BY[id] || P.BY[id].kind !== 'technique' || P.BY[id].spec !== A.REG[id].spec);
        const nR = 32;   // Burning Hands' key action joins (PROG-1)
        ok('every action in ABIL33.REG is in the sheet (' + nR + ')', !miss.length && R.length === nR, miss.join(','));
        const AB = gl('ABILITIES');
        if (AB) ok('starting keys carry the game names (the Mage: Burning Hands)', P.techniques().filter(e => e.src === 'start').every(e => AB[e.spec] && AB[e.spec].name === e.name));
        ok('Q12: the Mage starts on Burning Hands, Lightning Bolt needs Magic 2, Ray of Frost is a Magic 1 library entry', P.BY.burning.src === 'start' && P.BY.burning.gate === 1 && P.BY.bolt.gate === 2 && P.BY.bolt.src === 'L1' && P.BY.frost.src === 'L1' && P.BY.frost.gate === 1);
      }
    } catch (e) { ok('no throw', false, e.message); }
    return {pass: rows.filter(r => r.pass).length, total: rows.length, rows};
  };
})();
