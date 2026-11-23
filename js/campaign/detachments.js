/* ============================================================================
   Index DET1 — Detachments Engine (js/campaign/detachments.js)
   Officers lead their own contracts from the board with 2-4 Squad Mates.
   Computes honest odds bands, gates and dispatches detachments, resolves
   outcomes in the debrief using the player's own standing/injury/XP rules,
   and queues rescue and revenge contracts on future boards.
   HOW TO LOAD:
   Include <script src="js/campaign/detachments.js"></script> in index.html after the
   main game script. Exposes window.DETACH (engine only; no DOM/UI).
   ROLLBACK: delete this file and its <script> tag, AND first clear the away
   markers (or also remove the !p.away hooks), else away mates stay locked out:
   META.roster.concat(META.officers || []).forEach(p => delete p.away); saveMeta();
============================================================================ */
(function () {
  'use strict';
  var missing = [];
  if (typeof META === 'undefined') missing.push('META');
  if (typeof officers === 'undefined') missing.push('officers');
  if (typeof OFFICER_CAP === 'undefined') missing.push('OFFICER_CAP');
  if (typeof busy === 'undefined') missing.push('busy');
  if (typeof leaderStats === 'undefined') missing.push('leaderStats');
  if (typeof mateStats === 'undefined') missing.push('mateStats');
  if (typeof injuryCheck === 'undefined') missing.push('injuryCheck');
  if (typeof graveEntry === 'undefined') missing.push('graveEntry');
  if (typeof unbond === 'undefined') missing.push('unbond');
  if (typeof shiftStanding === 'undefined') missing.push('shiftStanding');
  if (typeof makeContract === 'undefined') missing.push('makeContract');
  if (typeof rollBoard === 'undefined') missing.push('rollBoard');
  if (typeof nemeses === 'undefined') missing.push('nemeses');
  if (typeof commanderName === 'undefined') missing.push('commanderName');
  if (typeof HOSTS === 'undefined') missing.push('HOSTS');
  if (typeof OBJECTIVES === 'undefined') missing.push('OBJECTIVES');
  if (typeof TIER_PAY === 'undefined') missing.push('TIER_PAY');
  if (typeof saveMeta === 'undefined') missing.push('saveMeta');
  if (typeof esc === 'undefined') missing.push('esc');
  if (missing.length > 0) {
    console.warn('[DETACH] Index DET1 disabled; missing globals: ' + missing.join(', '));
    return;
  }

  /* -------------------------------------------------------------------------
     TUNABLES (named constants for Systems / simulator tuning)
  ------------------------------------------------------------------------- */
  var DETACH_LOG_MAX        = 20;
  var DET_MIN_MATES         = 2;
  var DET_MAX_MATES         = 4;
  var DET_PAY_FACTOR        = 0.8;
  var DET_UPKEEP_PER_MATE   = 10;
  var RESCUE_BOARDS         = 2;
  var REVENGE_BONUS         = 50;
  var BIG_FACTOR            = 1.6;
  var WIN_INJURY_CHANCE     = 0.20;
  var OFFICER_MAX_LEVEL     = 11;
  var OFFICER_TICKS_NEEDED  = 3;
  var TIER_GATE             = { 1: 1, 2: 3, 3: 5 };
  var DEFAULT_WAVE_OFFSET   = { 1: 0, 2: 3, 3: 5 };
  // Power model weights (officer + squad)
  var PWR_OFF_BASE          = 4.0;
  var PWR_OFF_LEVEL         = 1.35;
  var PWR_OFF_COMBAT        = 0.90;
  var PWR_OFF_MAGIC         = 0.70;
  var PWR_OFF_CON           = 0.45;
  var PWR_MATE_BASE         = 1.5;
  var PWR_MATE_COMBAT       = 0.65;
  var PWR_MATE_MAGIC        = 0.50;
  var PWR_MATE_CON          = 0.35;
  var PWR_MATE_EFF          = 0.85;
  var PWR_MATE_ADV_BONUS    = 0.60;
  // Threat model weights (tier + host pool composition)
  var THR_BASE              = 27.5;
  var THR_WAVE_MULT         = 2.00;
  var THR_PAY_MULT          = 3.60;
  var THR_POOL_RANGED       = 0.65;
  var THR_POOL_CASTER       = 0.75;
  var THR_POOL_HEAVY        = 0.50;
  var THR_OBJ_HOLD          = 1.00;
  var THR_OBJ_ASSASSINATE   = 0.60;
  // Named enemy troop lists for pool risk inspection
  var RANGED_TROOPS         = ['crossbow', 'arbalest', 'goblinsniper', 'shadowhunter', 'sapper'];
  var CASTER_TROOPS         = ['hedgewitch', 'battlemage', 'tithepriest', 'cinder'];
  var HEAVY_TROOPS          = ['warden', 'phalanx', 'bear', 'enforcer'];
  // Logistic curve parameters turning (power - threat) into 7 probabilities
  var LOGISTIC_SLOPE        = 0.12;
  var WIN_SHARE_BASE        = 0.42;
  var WIN_SHARE_SPAN        = 0.38;
  var WIN_SHARE_SLOPE       = 0.12;
  // Severe outcomes (captured, officerDead): ~3% each at Even, <1% at Near certain, never 0 at Desperate
  var CAP_FLOOR             = 0.0012;
  var CAP_MAX               = 0.088;
  var CAP_MID               = -0.30;
  var CAP_SLOPE             = 2.65;
  var DEAD_FLOOR            = 0.0010;
  var DEAD_MAX              = 0.082;
  var DEAD_MID              = -0.34;
  var DEAD_SLOPE            = 2.70;
  // Remaining non-success split (parlay, fail, lostMate)
  var PARLAY_SHARE_BASE     = 0.18;
  var PARLAY_SHARE_SPAN     = 0.42;
  var PARLAY_SHARE_SLOPE    = 0.90;
  var LOST_SHARE_BASE       = 0.14;
  var LOST_SHARE_SPAN       = 0.24;
  var LOST_SHARE_SLOPE      = 0.85;
  // Orders shifts ('safe' vs 'hard')
  var SAFE_WIN_TO_PARLAY    = 0.22;
  var SAFE_LOST_TO_PARLAY   = 0.45;
  var HARD_PARLAY_TO_WIN    = 0.38;
  var HARD_PARLAY_TO_LOST   = 0.20;
  var HARD_PARLAY_TO_DEAD   = 0.10;
  // Band thresholds on pct = round((win + costly) * 100)
  var BAND_NEAR_CERTAIN     = 80;
  var BAND_LIKELY           = 62;
  var BAND_EVEN             = 42;
  var BAND_RISKY            = 25;
  var OUTCOME_KEYS = ['win', 'costly', 'parlay', 'fail', 'lostMate', 'captured', 'officerDead'];

  /* -------------------------------------------------------------------------
     REPORT TEXT POOLS (F-01.4 final, Narrative 2026-11-11: audits/detachment-reports-final.md)
     Generic pools, plus one host-flavoured line per outcome per host (HOSTPOOL).
  ------------------------------------------------------------------------- */
  var HOST_POOL_CHANCE = 0.5;   /* chance a report uses the host line instead of the generic pool */
  var REPORTS = {
    win: [
      "{officer} brought the detachment home from the {obj} job against {host} in good order, and the pay with it.",
      "The {obj} job is done. {officer} broke {host} and marched back without losing a soul.",
      "{officer}'s squad cleared {host} off the {obj} job before the second watch and came home whole.",
      "A quiet return: {officer} finished the {obj} job against {host}, collected the coin and asked for nothing else.",
      "{host} gave ground on the {obj} job, and {officer} took it. The squad is back, tired and paid."
    ],
    costly: [
      "The {obj} job is done, but {officer}'s squad paid for it. {host} left one of them bleeding.",
      "{officer} won the {obj} job against {host}. One mate came back on a stretcher.",
      "{officer} finished the {obj} job, though {host} fought for every yard. One mate is wounded.",
      "Paid, but not cheaply. {officer} beat {host} on the {obj} job and brought one mate home bandaged.",
      "{host} broke on the {obj} job. {officer} counts the coin and the one wounded mate."
    ],
    parlay: [
      "{officer} read the odds on the {obj} job, struck terms with {host} and took half the coin to keep the squad whole.",
      "Outnumbered by {host}, {officer} bargained on the {obj} job and marched home with half pay and every sword.",
      "{officer} talked their way out of the {obj} job. {host} kept the ground, the squad kept their lives, the patron pays half.",
      "Half coin, no graves. {officer} parleyed with {host} on the {obj} job and called it good business.",
      "{officer} judged the {obj} job too steep and settled with {host}. Nobody argued."
    ],
    fail: [
      "{host} drove {officer}'s squad off the {obj} job. They came home empty-handed.",
      "{officer} called the retreat on the {obj} job before the line broke. No coin, no honour, no graves.",
      "The {obj} job went badly. {host} held the field and {officer}'s squad limped home unpaid.",
      "{officer} lost the {obj} job to {host}. Some bruises, no purse.",
      "Thrown back by {host}, {officer} brings the squad home from the {obj} job with nothing to show for it."
    ],
    lostMate: [
      "{officer} lost the {obj} job to {host}, and {dead} did not come home. No pay.",
      "{host} broke the squad on the {obj} job. {officer} dragged the others out, but {dead} stayed behind.",
      "A bad return: the {obj} job is lost, and {officer} reports {dead} dead in the rout.",
      "{officer} brings back the squad's gear and {dead}'s name. {host} took the {obj} job and the mate with it.",
      "The {obj} job failed. {dead} fell to {host}, and {officer} carries the news into camp."
    ],
    captured: [
      "{host} took {officer} alive on the {obj} job. The squad got out without them.",
      "The squad stumbles home from the {obj} job. {host} has {officer}.",
      "{officer} held the rear on the {obj} job so the others could run, and now lies in {host}'s cages.",
      "Nobody saw {officer} fall on the {obj} job, only that {host} dragged them away in irons.",
      "{officer} bought the squad's escape with their own freedom. {host} holds them after the {obj} job."
    ],
    officerDead: [
      "The detachment returns from the {obj} job without its commander. {nemesis} of {host} killed {officer}.",
      "{officer} died holding the line on the {obj} job. {nemesis} struck the blow.",
      "{nemesis} cut {officer} down in the press on the {obj} job. The squad carried back the cloak.",
      "The {obj} job ended in ruin when {nemesis} killed {officer}. {host} still holds the field.",
      "{officer} is dead. {nemesis} and {host} saw to that on the {obj} job, and the squad has not yet found words."
    ]
  };
  var HOSTPOOL = {
    bandits: {
      win: "{officer} flushed {host} out of their ditch on the {obj} job and brought back the stolen goods.",
      costly: "{officer} burned out {host} on the {obj} job. A rusty blade left one mate fevered.",
      parlay: "{officer} drank bad ditch-brandy with {host} on the {obj} job and shared the purse to keep every throat intact.",
      fail: "Tripwires and ambushes drove {officer} back from the {obj} job with sore shins and dry water-skins.",
      lostMate: "{host} ambushed the road on the {obj} job. {officer} lost the job, and {dead} took an arrow from the bracken.",
      captured: "{host} took {officer} on the {obj} job and led them off chained to a pack mule.",
      officerDead: "{nemesis} cut {officer}'s throat in a ditch on the {obj} job and stripped the body."
    },
    greenskins: {
      win: "{officer} burned {host}'s huts on the {obj} job and came home with salted pork and hacked iron.",
      costly: "{officer} finished the {obj} job. Goblin spears left one mate with a cracked rib and a smell of pitch.",
      parlay: "{officer} traded salt and iron pots to {host} on the {obj} job and split the plunder to be left alone.",
      fail: "Banging shields and snarling dogs drove {officer} off the {obj} job.",
      lostMate: "{officer} lost the {obj} job to {host}. They dragged {dead} into the thorn bushes before anyone could reach them.",
      captured: "{host} hauled {officer} out of the melee on the {obj} job. The squad could hear the cheering from the road.",
      officerDead: "{nemesis} clubbed {officer} down on the {obj} job and hung the breastplate on an idol pole."
    },
    monsters: {
      win: "{officer} smoked out {host} on the {obj} job and came home with pelts and clean water.",
      costly: "The beasts are dead and the {obj} job is done. One mate carries deep claw marks.",
      parlay: "{officer} baited {host} away from the {obj} job with butchered horse and took half the town's bounty.",
      fail: "Howling from the dark timber turned {officer}'s squad back on the {obj} job.",
      lostMate: "{officer} lost the {obj} job. Something from the black pines took {dead} off the line.",
      captured: "Pinned in a collapsed hollow on the {obj} job, {officer} was dragged into the dark by {host}.",
      officerDead: "{nemesis} crushed {officer} on the {obj} job and dragged the body into its lair."
    },
    hollow: {
      win: "{officer} broke {host} on the {obj} job and left nothing but bone ash and cold copper rings.",
      costly: "{officer} cleared the barrows on the {obj} job. One mate shivers with grave-rot and a cut that will not clot.",
      parlay: "There is no talking to cold bone, so {officer} fought a careful withdrawal from the {obj} job and kept half the pay.",
      fail: "A wall of mouldering shields ground {officer}'s squad back into the marsh on the {obj} job.",
      lostMate: "{officer} lost the {obj} job to {host}. A rusted blade pulled {dead} under the dead.",
      captured: "{host} did not kill {officer} on the {obj} job. They locked them in a crypt below the roots.",
      officerDead: "{nemesis} throttled {officer} on the {obj} job with hands of grey sinew."
    },
    deserters: {
      win: "{officer} broke {host}'s barricade on the {obj} job and matched their drill step for step.",
      costly: "{officer} took the {obj} job, but a deserter crossbow punched through a shield and left one mate with a broken leg.",
      parlay: "{officer} saw old regiment marks on {host} on the {obj} job, shared rations and divided the take.",
      fail: "{host} held square on the {obj} job and drove {officer} off with volley fire.",
      lostMate: "{officer} lost the {obj} job to {host}. A sergeant's pike pinned {dead} to the breastwork.",
      captured: "{host} surrounded {officer} on the {obj} job and kept them as a hostage in the baggage wagon.",
      officerDead: "{nemesis} killed {officer} on the {obj} job and stripped the coat without a word."
    },
    arcana: {
      win: "{officer} put out {host}'s alchemical fires on the {obj} job and recovered the sealed lockboxes.",
      costly: "{officer} finished the {obj} job. One mate is covered in blue hex-burns and sulphur blisters.",
      parlay: "{officer} sold {host} some seized guild ciphers on the {obj} job and left before the hexes were cast.",
      fail: "Choking purple vapour drove {officer} out of the {obj} job coughing into rags.",
      lostMate: "{officer} lost the {obj} job to {host}. {dead} breathed in glowing cinder-dust and did not get up.",
      captured: "{host} stunned {officer} with lightning-runes on the {obj} job and took them to the guild vaults in lead manacles.",
      officerDead: "{nemesis} killed {officer} with black sorcery on the {obj} job and left an ashen husk."
    },
    orcs: {
      win: "{officer} broke {host}'s iron front on the {obj} job and took their blood banner.",
      costly: "{officer} held the line on the {obj} job. Iron splintered everywhere and one mate has a broken arm.",
      parlay: "{officer} traded salt-cakes and whetstones with the chieftain on the {obj} job and split the borders for part of the coin.",
      fail: "Drums and great two-handed cleavers drove {officer} off the field on the {obj} job.",
      lostMate: "{officer} lost the {obj} job to {host}. A serrated broadhead found {dead} in the charge.",
      captured: "{host} overran {officer} on the {obj} job and threw them in an iron-barred cart.",
      officerDead: "{nemesis} split {officer} with a black iron blade on the {obj} job and roared over the body."
    }
  };


  /* -------------------------------------------------------------------------
     HELPERS & LAZY SAVE INITIALIZATION
  ------------------------------------------------------------------------- */
  var _saveHook = null;
  function persistMeta() {
    if (typeof _saveHook === 'function') return _saveHook();
    if (typeof window !== 'undefined' && typeof window.saveMeta === 'function') return window.saveMeta();
    return saveMeta();
  }

  function ensureMeta() {
    if (!META.detachments) META.detachments = [];
    if (!META.detachLog) META.detachLog = [];
    if (!META.detachCaptives) META.detachCaptives = [];
    if (!META.detachPending) META.detachPending = [];
    return META;
  }

  function sig(x) {
    if (x > 30) return 1;
    if (x < -30) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function safeLeaderStats(o) {
    if (!o) return { con: 5, melee: 2, ranged: 2, magic: 0 };
    try {
      return leaderStats(o);
    } catch (e) {
      var lvl = o.level || 1;
      return { con: 5 + (lvl >> 1), melee: 2 + (lvl >> 1), ranged: 2 + (lvl >> 2), magic: o.magic || 0 };
    }
  }

  function safeMateStats(m) {
    if (!m) return { con: 5, melee: 2, ranged: 2, magic: 0, eff: 1 };
    try {
      return mateStats(m);
    } catch (e) {
      return {
        con: (m.startCon || 5) + (m.conTrained || 0),
        melee: (m.baseM || 2) + (m.modM || 0),
        ranged: (m.baseR || 2) + (m.modR || 0),
        magic: m.magic || 0,
        eff: 1 + (m.adv || 0)
      };
    }
  }

  function resolveOfficer(officerOrId) {
    if (!officerOrId) return null;
    if (typeof officerOrId === 'object' && officerOrId.name) return officerOrId;
    var id = typeof officerOrId === 'object' ? officerOrId.id : officerOrId;
    var list = officers();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function resolveMates(matesOrIds) {
    if (!Array.isArray(matesOrIds)) return [];
    var roster = (META && META.roster) || [];
    var out = [];
    for (var i = 0; i < matesOrIds.length; i++) {
      var item = matesOrIds[i];
      if (item && typeof item === 'object' && item.name) {
        out.push(item);
      } else {
        var id = item && typeof item === 'object' ? item.id : item;
        for (var j = 0; j < roster.length; j++) {
          if (roster[j].id === id) { out.push(roster[j]); break; }
        }
      }
    }
    return out;
  }

  function formatReport(outcome, vars, rng, hostKey) {
    var pool = REPORTS[outcome] || REPORTS.fail;
    var r = typeof rng === 'function' ? rng() : Math.random();
    var tpl = pool[(r * pool.length) | 0] || pool[0];
    var hostLine = hostKey && HOSTPOOL[hostKey] && HOSTPOOL[hostKey][outcome];
    if (hostLine && (typeof rng === 'function' ? rng() : Math.random()) < HOST_POOL_CHANCE) tpl = hostLine;
    var out = tpl.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] !== undefined ? vars[k] : '';
    });
    return out.charAt(0).toUpperCase() + out.slice(1);   /* studio fix: "the Hollow dead" can open a sentence */
  }

  function hostLabel(hostKey) {
    var h = HOSTS[hostKey];
    return h ? (h.the || h.name || hostKey) : String(hostKey || 'the enemy');
  }

  function objLabel(objKey) {
    var o = OBJECTIVES[objKey];
    return o ? o.name : String(objKey || 'Contract');
  }

  /* -------------------------------------------------------------------------
     2. ODDS & ROLL (shared by UI preview and debrief resolver)
  ------------------------------------------------------------------------- */
  function calcPower(officer, mates) {
    var o = resolveOfficer(officer) || officer;
    var os = safeLeaderStats(o);
    var oCombat = Math.max(os.melee || 0, os.ranged || 0);
    var pwr = PWR_OFF_BASE
      + ((o && o.level) || 1) * PWR_OFF_LEVEL
      + oCombat * PWR_OFF_COMBAT
      + (os.magic || 0) * PWR_OFF_MAGIC
      + (os.con || 4) * PWR_OFF_CON
      + ((typeof ARM !== 'undefined' && ARM && ARM.power) ? ARM.power(o) : 0);   /* INDEX A32: the officer's own cards */
    var mList = resolveMates(mates);
    for (var i = 0; i < mList.length; i++) {
      var m = mList[i];
      var ms = safeMateStats(m);
      var mCombat = Math.max(ms.melee || 0, ms.ranged || 0);
      var adv = m.adv || 0;
      pwr += PWR_MATE_BASE
        + mCombat * PWR_MATE_COMBAT
        + (ms.magic || 0) * PWR_MATE_MAGIC
        + (ms.con || 4) * PWR_MATE_CON
        + (ms.eff || 1) * PWR_MATE_EFF
        + (adv > 0 ? adv * PWR_MATE_ADV_BONUS : 0);
    }
    return Math.round(pwr * 100) / 100;
  }

  function inspectThreatAndRisks(contract) {
    var c = contract || { tier: 1, host: 'bandits', obj: 'hunt' };
    var tier = c.tier || 1;
    var waveMap = typeof TIER_WAVE_OFFSET !== 'undefined' ? TIER_WAVE_OFFSET : DEFAULT_WAVE_OFFSET;
    var waveOff = waveMap[tier] !== undefined ? waveMap[tier] : (tier - 1) * 2.5;
    var payScale = TIER_PAY[tier] !== undefined ? TIER_PAY[tier] : tier;
    var hostObj = HOSTS[c.host] || HOSTS.bandits || { pools: {} };
    var pool = (hostObj.pools && hostObj.pools[tier]) || [];
    var rangedCount = 0;
    var casterCount = 0;
    var heavyCount = 0;
    for (var i = 0; i < pool.length; i++) {
      var unit = pool[i];
      if (RANGED_TROOPS.indexOf(unit) !== -1) rangedCount++;
      if (CASTER_TROOPS.indexOf(unit) !== -1) casterCount++;
      if (HEAVY_TROOPS.indexOf(unit) !== -1) heavyCount++;
    }
    var thr = THR_BASE
      + waveOff * THR_WAVE_MULT
      + payScale * THR_PAY_MULT
      + rangedCount * THR_POOL_RANGED
      + casterCount * THR_POOL_CASTER
      + heavyCount * THR_POOL_HEAVY
      + (c.obj === 'hold' ? THR_OBJ_HOLD : 0)
      + (c.obj === 'assassinate' ? THR_OBJ_ASSASSINATE : 0)
      + (+c.threatAdd || 0);   // F-03: heavier variant jobs carry their own offset (F03.K.threat [S])
    var risks = [];
    if (rangedCount > 0) risks.push('Bowmen: expect injuries');
    if (casterCount > 0) risks.push('Casters: hexes and fire');
    if (heavyCount >= 2) risks.push('Heavy line: tough armour');
    if (tier >= 3) risks.push('Tier 3 host: lethal commanders');
    return {
      threat: Math.round(thr * 100) / 100,
      risks: risks
    };
  }

  function odds(officer, mates, contract, orders) {
    var ord = orders || 'normal';
    var power = calcPower(officer, mates);
    var tr = inspectThreatAndRisks(contract);
    var threat = tr.threat;
    var delta = power - threat;
    var z = delta * LOGISTIC_SLOPE;
    // Overall success probability (win + costly)
    var s = sig(z);
    var winShare = WIN_SHARE_BASE + WIN_SHARE_SPAN * sig(delta * WIN_SHARE_SLOPE);
    var pWin = s * winShare;
    var pCostly = s * (1 - winShare);
    // Severe officer outcomes (stay ~3% each at Even, <1% combined at Near certain, >0 at Desperate)
    var rawCap = CAP_FLOOR + CAP_MAX / (1 + Math.exp(CAP_SLOPE * (z - CAP_MID)));
    var rawDead = DEAD_FLOOR + DEAD_MAX / (1 + Math.exp(DEAD_SLOPE * (z - DEAD_MID)));
    var nonSuccess = Math.max(1e-6, 1 - s);
    var maxSevere = nonSuccess * 0.45;
    if (rawCap + rawDead > maxSevere) {
      var scale = maxSevere / (rawCap + rawDead);
      rawCap *= scale;
      rawDead *= scale;
    }
    var rem = Math.max(0, nonSuccess - rawCap - rawDead);
    var parlayShare = PARLAY_SHARE_BASE + PARLAY_SHARE_SPAN * sig(z * PARLAY_SHARE_SLOPE);
    var lostShare = (1 - parlayShare) * (LOST_SHARE_BASE + LOST_SHARE_SPAN * sig(-z * LOST_SHARE_SLOPE));
    var failShare = Math.max(0, 1 - parlayShare - lostShare);
    var pParlay = rem * parlayShare;
    var pFail = rem * failShare;
    var pLostMate = rem * lostShare;
    var pCaptured = rawCap;
    var pOfficerDead = rawDead;
    // Apply orders shifts
    if (ord === 'safe') {
      var dWin = pWin * SAFE_WIN_TO_PARLAY;
      var dLost = pLostMate * SAFE_LOST_TO_PARLAY;
      pWin -= dWin;
      pLostMate -= dLost;
      pParlay += dWin + dLost;
    } else if (ord === 'hard') {
      var toWin = pParlay * HARD_PARLAY_TO_WIN;
      var toLost = pParlay * HARD_PARLAY_TO_LOST;
      var toDead = pParlay * HARD_PARLAY_TO_DEAD;
      pParlay -= (toWin + toLost + toDead);
      pWin += toWin;
      pLostMate += toLost;
      pOfficerDead += toDead;
    }
    // Clamp & normalize so probabilities sum to 1
    var p = {
      win: clamp01(pWin),
      costly: clamp01(pCostly),
      parlay: clamp01(pParlay),
      fail: clamp01(pFail),
      lostMate: clamp01(pLostMate),
      captured: clamp01(pCaptured),
      officerDead: clamp01(pOfficerDead)
    };
    var sum = p.win + p.costly + p.parlay + p.fail + p.lostMate + p.captured + p.officerDead;
    if (sum > 0) {
      for (var i = 0; i < OUTCOME_KEYS.length; i++) {
        p[OUTCOME_KEYS[i]] = p[OUTCOME_KEYS[i]] / sum;
      }
      var diff = 1 - (p.win + p.costly + p.parlay + p.fail + p.lostMate + p.captured + p.officerDead);
      p.fail = clamp01(p.fail + diff);
    }
    var pct = Math.round((p.win + p.costly) * 100);
    var band = pct >= BAND_NEAR_CERTAIN ? 'Near certain'
             : pct >= BAND_LIKELY       ? 'Likely'
             : pct >= BAND_EVEN         ? 'Even'
             : pct >= BAND_RISKY        ? 'Risky'
             : 'Desperate';
    return {
      p: p,
      band: band,
      pct: pct,
      label: band + ' (about ' + pct + '%)',
      risks: tr.risks,
      power: power,
      threat: threat
    };
  }

  function roll(oddsResult, rng) {
    if (DETACH._force && OUTCOME_KEYS.indexOf(DETACH._force) !== -1) {
      var forced = DETACH._force;
      DETACH._force = null;
      return forced;
    }
    var p = (oddsResult && oddsResult.p) ? oddsResult.p : oddsResult;
    var r = (typeof rng === 'function' ? rng : Math.random)();
    var acc = 0;
    for (var i = 0; i < OUTCOME_KEYS.length; i++) {
      var k = OUTCOME_KEYS[i];
      acc += p[k] || 0;
      if (r < acc) return k;
    }
    return OUTCOME_KEYS[OUTCOME_KEYS.length - 1];
  }

  /* -------------------------------------------------------------------------
     3. WHO CAN GO: canSend, send, recall
  ------------------------------------------------------------------------- */
  function canSend(officerId, mateIds, contract) {
    ensureMeta();
    var o = resolveOfficer(officerId);
    if (!o) return { ok: false, why: 'Officer is not in officers()' };
    if (META.leader && META.leader.id === o.id) {
      return { ok: false, why: 'The Leader cannot lead a detachment' };
    }
    if (busy(o) || o.resting > 0) {
      return { ok: false, why: 'Officer is resting' };
    }
    if (o.away) {
      return { ok: false, why: 'Officer is already away' };
    }
    if (META.detachments.length >= OFFICER_CAP) {
      return { ok: false, why: 'Maximum detachments (' + OFFICER_CAP + ') already active' };
    }
    if (!contract || !Array.isArray(META.board) || META.board.indexOf(contract) === -1) {
      return { ok: false, why: 'Contract is not on the board' };
    }
    for (var d = 0; d < META.detachments.length; d++) {
      if (META.detachments[d].contract === contract) {
        return { ok: false, why: 'Contract is already taken' };
      }
    }
    var tier = contract.tier || 1;
    var reqLevel = TIER_GATE[tier] || 1;
    if ((o.level || 1) < reqLevel) {
      return { ok: false, why: 'Tier ' + tier + ' requires an officer of Level ' + reqLevel };
    }
    if (!Array.isArray(mateIds) || mateIds.length < DET_MIN_MATES || mateIds.length > DET_MAX_MATES) {
      return { ok: false, why: 'Detachment needs ' + DET_MIN_MATES + ' to ' + DET_MAX_MATES + ' Squad Mates' };
    }
    var seen = {};
    var roster = META.roster || [];
    for (var i = 0; i < mateIds.length; i++) {
      var raw = mateIds[i];
      var mid = (raw && typeof raw === 'object') ? raw.id : raw;
      if (seen[mid]) return { ok: false, why: 'Duplicate Squad Mate in detachment' };
      seen[mid] = true;
      var mate = null;
      for (var j = 0; j < roster.length; j++) {
        if (roster[j].id === mid) { mate = roster[j]; break; }
      }
      if (!mate) return { ok: false, why: 'Squad Mate is not in META.roster' };
      if (busy(mate) || mate.resting > 0) return { ok: false, why: mate.name + ' is resting' };
      if (mate.away) return { ok: false, why: mate.name + ' is already away' };
    }
    return { ok: true, why: '' };
  }

  function send(officerId, mateIds, contract, orders) {
    var check = canSend(officerId, mateIds, contract);
    if (!check.ok) return null;
    var o = resolveOfficer(officerId);
    var mates = resolveMates(mateIds);
    var mids = [];
    for (var i = 0; i < mates.length; i++) mids.push(mates[i].id);
    var detId = 'det_' + (typeof META.nextId === 'number' ? META.nextId++ : (META.detachments.length + 1));
    var bIdx = META.board.indexOf(contract);
    if (bIdx !== -1) META.board.splice(bIdx, 1);
    o.away = detId;
    for (var k = 0; k < mates.length; k++) {
      mates[k].away = detId;
    }
    var det = {
      id: detId,
      officerId: o.id,
      mateIds: mids,
      contract: contract,
      orders: orders || 'normal',
      sentAt: META.deployments || 0
    };
    META.detachments.push(det);
    persistMeta();
    return det;
  }

  function recall(detId) {
    ensureMeta();
    var targetId = (detId && typeof detId === 'object') ? detId.id : detId;
    var idx = -1;
    for (var i = 0; i < META.detachments.length; i++) {
      if (META.detachments[i].id === targetId) { idx = i; break; }
    }
    if (idx === -1) return false;
    var det = META.detachments.splice(idx, 1)[0];
    var o = resolveOfficer(det.officerId);
    if (o && o.away === det.id) delete o.away;
    var roster = META.roster || [];
    for (var j = 0; j < roster.length; j++) {
      if (roster[j].away === det.id || det.mateIds.indexOf(roster[j].id) !== -1) {
        if (roster[j].away === det.id) delete roster[j].away;
      }
    }
    META.board = META.board || [];
    if (det.contract && META.board.indexOf(det.contract) === -1) {
      META.board.push(det.contract);
    }
    persistMeta();
    return true;
  }

  /* -------------------------------------------------------------------------
     4. PAY & RESOLVE ALL (debrief resolution)
  ------------------------------------------------------------------------- */
  function pay(c, outcome, survivors) {
    if (outcome !== 'win' && outcome !== 'costly' && outcome !== 'parlay') return 0;
    var base = Math.round(((c && c.pay) || 0) * DET_PAY_FACTOR);
    if (outcome === 'parlay') base = Math.round(base / 2);
    var survCount = Array.isArray(survivors) ? survivors.length : (typeof survivors === 'number' ? survivors : 0);
    var upkeep = survCount * DET_UPKEEP_PER_MATE;
    return Math.max(0, base - upkeep);
  }

  function rollMatesInjuries(mates, count, lines) {
    if (!mates.length) return;
    var pool = mates.slice();
    var n = Math.min(count, pool.length);
    for (var i = 0; i < n; i++) {
      var pickIdx = (Math.random() * pool.length) | 0;
      var m = pool.splice(pickIdx, 1)[0];
      var ir = injuryCheck(safeMateStats(m).con, m.name, lines);
      if (ir === 'rest') m.resting = 1;
      else if (ir) m.injuries.push(ir);
    }
  }

  function advanceOfficerTicks(o, lines) {
    o.deployments = (o.deployments || 0) + 1;
    o.ticks = (o.ticks || 0) + 1;
    if (o.ticks >= OFFICER_TICKS_NEEDED) {
      o.ticks = 0;
      if ((o.level || 1) < OFFICER_MAX_LEVEL) {
        o.level = Math.min(OFFICER_MAX_LEVEL, (o.level || 1) + 1);
        lines.push('<p class="good"><b>' + esc(o.name) + ' reaches Level ' + o.level + '</b> from field command.</p>');
      }
    }
  }

  function resolvePlayerSpecialContract(lines) {
    if (typeof G === 'undefined' || !G || !G.contract) return;
    var gc = G.contract;
    var gRes = G.result;
    if (gc.detKind === 'rescue' && gRes === 'victory') {
      var oid = gc.detOfficerId;
      var o = resolveOfficer(oid);
      for (var i = META.detachCaptives.length - 1; i >= 0; i--) {
        var capEntry = META.detachCaptives[i];
        if (capEntry.officerId === oid || (capEntry.officer && capEntry.officer.id === oid)) {
          if (!o && capEntry.officer) o = capEntry.officer;
          META.detachCaptives.splice(i, 1);
        }
      }
      for (var p = META.detachPending.length - 1; p >= 0; p--) {
        if (META.detachPending[p].kind === 'rescue' && META.detachPending[p].officerId === oid) {
          META.detachPending.splice(p, 1);
        }
      }
      if (o) {
        delete o.away;
        lines.push('<p class="good"><b>' + esc(o.name) + ' is freed from captivity</b> and rejoins the Chapter\'s officers.</p>');
      }
    }
    if (gc.detKind === 'revenge') {
      var nemName = gc.detNemesis;
      var stillAlive = false;
      var nList = nemeses();
      for (var n = 0; n < nList.length; n++) {
        if (nList[n].name === nemName) { stillAlive = true; break; }
      }
      if (!stillAlive) {
        for (var q = META.detachPending.length - 1; q >= 0; q--) {
          if (META.detachPending[q].kind === 'revenge' && META.detachPending[q].nemesis === nemName) {
            META.detachPending.splice(q, 1);
          }
        }
        var bonus = REVENGE_BONUS * (gc.tier || 1);
        META.treasury = (META.treasury || 0) + bonus;
        lines.push('<p class="good"><b>Vengeance paid:</b> ' + esc(nemName) + ' is slain and avenged (+' + bonus + 'gp blood-bounty).</p>');
      }
    }
  }

  function resolveExpiredCaptives(lines) {
    for (var i = META.detachCaptives.length - 1; i >= 0; i--) {
      var capEntry = META.detachCaptives[i];
      if (capEntry.boardsLeft <= 0) {
        META.detachCaptives.splice(i, 1);
        var o = resolveOfficer(capEntry.officerId || capEntry.officer) || capEntry.officer;
        var offList = officers();
        if (o) {
          for (var j = offList.length - 1; j >= 0; j--) {
            if (offList[j].id === o.id) offList.splice(j, 1);
          }
          delete o.away;
          META.memorial = META.memorial || [];
          META.memorial.push(graveEntry(o, true, 'Died in captivity', { obj: 'rescue', tier: capEntry.tier || 1, host: capEntry.host || 'bandits' }));
          lines.push('<p class="bad"><b>' + esc(o.name) + ' died in captivity</b> after no rescue came.</p>');
        }
        for (var k = META.detachPending.length - 1; k >= 0; k--) {
          if (META.detachPending[k].kind === 'rescue' && META.detachPending[k].officerId === (o ? o.id : capEntry.officerId)) {
            META.detachPending.splice(k, 1);
          }
        }
      }
    }
  }

  function resolveAll(lines) {
    ensureMeta();
    lines = lines || [];
    // 1. Check if the player's own contract resolved a rescue or revenge
    resolvePlayerSpecialContract(lines);
    // 2. Check if any captive's rescue window ran out
    resolveExpiredCaptives(lines);
    // 3. Resolve each active detachment
    var active = META.detachments.slice();
    META.detachments = [];
    for (var i = 0; i < active.length; i++) {
      var det = active[i];
      var c = det.contract || { obj: 'hunt', host: 'bandits', tier: 1, pay: 280 };
      var o = resolveOfficer(det.officerId);
      var mates = resolveMates(det.mateIds);
      if (o && o.away === det.id) delete o.away;
      for (var mIdx = 0; mIdx < mates.length; mIdx++) {
        if (mates[mIdx].away === det.id) delete mates[mIdx].away;
      }
      if (!o) continue;
      var oddsRes = odds(o, mates, c, det.orders);
      var outcome = roll(oddsRes);
      var survivors = mates.slice();
      var deadMate = null;
      var spawnedNemesis = null;
      if (outcome === 'lostMate' && survivors.length > 0) {
        var dIdx = (Math.random() * survivors.length) | 0;
        deadMate = survivors.splice(dIdx, 1)[0];
        unbond(deadMate);
        var rIdx = META.roster.indexOf(deadMate);
        if (rIdx !== -1) META.roster.splice(rIdx, 1);
        META.memorial = META.memorial || [];
        META.memorial.push(graveEntry(deadMate, false, 'Fell on ' + o.name + '\'s detachment', c));
      }
      // Increment deployments for surviving mates
      for (var sIdx = 0; sIdx < survivors.length; sIdx++) {
        survivors[sIdx].deployments = (survivors[sIdx].deployments || 0) + 1;
      }
      var earned = pay(c, outcome, survivors);
      if (earned > 0) {
        META.treasury = (META.treasury || 0) + earned;
      }
      var oNameEsc = esc(o.name);
      var objNameEsc = esc(objLabel(c.obj));
      var hostNameEsc = esc(hostLabel(c.host));
      if (outcome === 'officerDead') {
        var hostBosses = (HOSTS[c.host] && HOSTS[c.host].bosses && HOSTS[c.host].bosses[c.tier || 1]) || ['vane'];
        var bossKey = hostBosses[(Math.random() * hostBosses.length) | 0];
        spawnedNemesis = commanderName(bossKey);
      }
      var reportSentence = formatReport(outcome, {
        officer: oNameEsc,
        obj: objNameEsc,
        host: hostNameEsc,
        dead: deadMate ? esc(deadMate.name) : 'a Squad Mate',
        nemesis: spawnedNemesis ? esc(spawnedNemesis) : 'their commander'
      }, null, c.host);
      var isGood = (outcome === 'win' || outcome === 'costly');
      var cls = isGood ? 'good' : (outcome === 'parlay' ? '' : 'bad');
      var payText = (outcome === 'win' || outcome === 'costly' || outcome === 'parlay')
        ? ' (+' + earned + 'gp)'
        : '';
      lines.push('<p' + (cls ? ' class="' + cls + '"' : '') + '>' + reportSentence + payText + '</p>');
      try { if (window.DETACH && DETACH.onOutcome) DETACH.onOutcome(outcome, c, o, lines); } catch (e) {}   /* F-29: Camp links hook (js/campaign/links.js) */
      // Outcome-specific side effects (injuries, XP ticks, standing, capture/death)
      if (outcome === 'win') {
        if (Math.random() < WIN_INJURY_CHANCE && survivors.length > 0) {
          rollMatesInjuries(survivors, 1, lines);
        }
        advanceOfficerTicks(o, lines);
        if (c.faction) shiftStanding(c.faction, 1, lines);
        if (c.obj === 'rescue' && c.hostFaction) shiftStanding(c.hostFaction, 1, lines);
      } else if (outcome === 'costly') {
        rollMatesInjuries(survivors, 1, lines);
        advanceOfficerTicks(o, lines);
        if (c.faction) shiftStanding(c.faction, 1, lines);
        if (c.obj === 'rescue' && c.hostFaction) shiftStanding(c.hostFaction, 1, lines);
      } else if (outcome === 'parlay') {
        o.deployments = (o.deployments || 0) + 1;
      } else if (outcome === 'fail') {
        o.deployments = (o.deployments || 0) + 1;
        var fRolls = 1 + ((Math.random() * 2) | 0);
        rollMatesInjuries(survivors, fRolls, lines);
        if (c.faction) shiftStanding(c.faction, -1, lines);
      } else if (outcome === 'lostMate') {
        o.deployments = (o.deployments || 0) + 1;
        if (c.faction) shiftStanding(c.faction, -1, lines);
      } else if (outcome === 'captured') {
        o.deployments = (o.deployments || 0) + 1;
        var cRolls = 1 + ((Math.random() * 2) | 0);
        rollMatesInjuries(survivors, cRolls, lines);
        if (c.faction) shiftStanding(c.faction, -1, lines);
        o.away = 'captive';
        META.detachCaptives.push({
          officer: o,
          officerId: o.id,
          host: c.host,
          tier: c.tier || 1,
          since: META.deployments || 0,
          boardsLeft: RESCUE_BOARDS
        });
        META.detachPending.push({
          kind: 'rescue',
          obj: 'rescue',
          tier: c.tier || 1,
          host: c.host,
          officerId: o.id
        });
      } else if (outcome === 'officerDead') {
        var dRolls = 1 + ((Math.random() * 2) | 0);
        rollMatesInjuries(survivors, dRolls, lines);
        if (c.faction) shiftStanding(c.faction, -1, lines);
        var offArr = officers();
        var oPos = offArr.indexOf(o);
        if (oPos !== -1) offArr.splice(oPos, 1);
        META.memorial = META.memorial || [];
        META.memorial.push(graveEntry(o, true, 'Fell leading a detachment', c));
        var bKey = bossKey;   /* studio fix: the record's type matches the commander named above */
        var nem = {
          name: spawnedNemesis,
          k: bKey,
          host: c.host,
          grudge: 1,
          since: META.deployments || 0,
          met: 1,
          slew: o.name
        };
        nemeses().push(nem);
        META.detachPending.push({
          kind: 'revenge',
          obj: 'assassinate',
          tier: c.tier || 1,
          host: c.host,
          nemesis: spawnedNemesis
        });
      }
      META.detachLog.push({
        at: META.deployments || 0,
        id: det.id,
        officerId: o.id,
        officer: o.name,
        obj: c.obj,
        host: c.host,
        tier: c.tier || 1,
        orders: det.orders,
        outcome: outcome,
        pay: earned
      });
      while (META.detachLog.length > DETACH_LOG_MAX) {
        META.detachLog.shift();
      }
    }
    return lines;
  }

  /* -------------------------------------------------------------------------
     5. RESCUE & REVENGE BOARD WRAPPER (wraps global rollBoard)
  ------------------------------------------------------------------------- */
  var _origRollBoard = rollBoard;
  function wrappedRollBoard() {
    _origRollBoard.apply(this, arguments);
    if (!META || !Array.isArray(META.detachPending) || META.detachPending.length === 0) {
      return;
    }
    ensureMeta();
    META.board = META.board || [];
    var changed = false;
    for (var i = META.detachPending.length - 1; i >= 0; i--) {
      var pend = META.detachPending[i];
      if (pend.kind === 'rescue') {
        var capEntry = null;
        for (var j = 0; j < META.detachCaptives.length; j++) {
          var ce = META.detachCaptives[j];
          if (ce.officerId === pend.officerId || (ce.officer && ce.officer.id === pend.officerId)) {
            capEntry = ce;
            break;
          }
        }
        if (!capEntry) {
          META.detachPending.splice(i, 1);
          changed = true;
          continue;
        }
        if (capEntry.boardsLeft <= 0) {
          continue;
        }
        var o = resolveOfficer(pend.officerId) || capEntry.officer;
        var oName = o ? o.name : 'a captured officer';
        var rc = makeContract('rescue', pend.tier || 1);
        rc.host = pend.host;
        rc.detKind = 'rescue';
        rc.detOfficerId = pend.officerId;
        rc.brief = oName + ' is held in cages by ' + hostLabel(rc.host) + ' at ' + (rc.town || rc.place || 'the ruins') + '. Break the cages and bring ' + oName + ' back to the road.';
        META.board.push(rc);
        capEntry.boardsLeft--;
        changed = true;
      } else if (pend.kind === 'revenge') {
        var nList = nemeses();
        var exists = false;
        var slewWho = 'an officer of the Chapter';
        for (var n = 0; n < nList.length; n++) {
          if (nList[n].name === pend.nemesis) {
            exists = true;
            if (nList[n].slew) slewWho = nList[n].slew;
            break;
          }
        }
        if (!exists) {
          META.detachPending.splice(i, 1);
          changed = true;
          continue;
        }
        var vc = makeContract(pend.obj || 'assassinate', pend.tier || 1);
        vc.host = pend.host;
        vc.detKind = 'revenge';
        vc.detNemesis = pend.nemesis;
        vc.brief = pend.nemesis + ' of ' + hostLabel(vc.host) + ', who slew ' + slewWho + ', is travelling through ' + (vc.place || 'the borderlands') + '. Hunt them down before they escape.';
        META.board.push(vc);
        changed = true;
      }
    }
    if (changed) persistMeta();
  }
  if (typeof window !== 'undefined') {
    window.rollBoard = wrappedRollBoard;
  }
  try { rollBoard = wrappedRollBoard; } catch (e) {}

  /* -------------------------------------------------------------------------
     6. SECOND SQUAD PAY SPLIT & BIG CONTRACT HELPERS
  ------------------------------------------------------------------------- */
  function splitPay(totalPay, playerSquadSize, officerSquadSize) {
    var pSize = Math.max(0, playerSquadSize || 0);
    var oSize = Math.max(0, officerSquadSize || 0);
    var total = pSize + oSize;
    if (total <= 0) return { player: totalPay || 0, officer: 0 };
    var playerShare = Math.ceil((totalPay || 0) * pSize / total);
    var officerShare = Math.max(0, (totalPay || 0) - playerShare);
    return { player: playerShare, officer: officerShare };
  }

  function bigContract(c) {
    var copy = Object.assign({}, c);
    if (Array.isArray(c.edges)) copy.edges = c.edges.slice();
    var tier = copy.tier || 1;
    var basePay = copy.pay || Math.round(300 * (TIER_PAY[tier] || 1));
    copy.pay = Math.round((basePay * BIG_FACTOR) / 5) * 5;
    copy.big = true;
    return copy;
  }

  /* -------------------------------------------------------------------------
     7. SELF-TEST (non-destructive, restores META and saveMeta in finally)
  ------------------------------------------------------------------------- */
  function selfTest() {
    var details = [];
    var pass = 0;
    var fail = 0;
    function check(name, cond, info) {
      if (cond) {
        pass++;
        details.push('PASS: ' + name);
      } else {
        fail++;
        details.push('FAIL: ' + name + (info ? ' (' + info + ')' : ''));
      }
    }
    var metaBackup = JSON.stringify(META);
    var origForce = DETACH._force;
    var origSaveMeta = saveMeta;
    var origWinSaveMeta = (typeof window !== 'undefined') ? window.saveMeta : undefined;
    var gExists = typeof G !== 'undefined';
    var gBackup = gExists ? G : undefined;
    var stubCalls = 0;
    var saveStub = function () { stubCalls++; };
    // Seeded LCG RNG for deterministic Monte Carlo verification
    var seed = 133742;
    function seededRng() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    // Pinned (2026-11-11): the band set-ups below were calibrated on one race/class/spec. Taking them from the loaded
    // save's leader made the bands drift with the save (REG failed 'Setup 2 got Even 61%' on one leader, Setup 4 on others).
    // ORC / FREEMAN / SOLDIER passes all six set-ups; fall back to the first keys only if a key is ever removed.
    var defRace = (typeof RACES !== 'undefined' && RACES.ORC) ? 'ORC' : (typeof RACES !== 'undefined' ? Object.keys(RACES)[0] : 'HUMAN');
    var defCls  = (typeof CLASSES !== 'undefined' && CLASSES.FREEMAN) ? 'FREEMAN' : (typeof CLASSES !== 'undefined' ? Object.keys(CLASSES)[0] : 'FREEMAN');
    var defSpec = (typeof SPECS !== 'undefined' && SPECS.SOLDIER) ? 'SOLDIER' : (typeof SPECS !== 'undefined' ? Object.keys(SPECS)[0] : 'SOLDIER');
    try {
      DETACH._force = null;
      _saveHook = saveStub;
      try { saveMeta = saveStub; } catch (e) {}
      if (typeof window !== 'undefined') window.saveMeta = saveStub;
      if (gExists && !G) G = { contract: null, result: 'victory', hospitalReroll: false };
      // Build clean sandbox state on a deep copy of META
      var baseMeta = JSON.parse(metaBackup);
      var testMeta = Object.assign({}, baseMeta, {
        treasury: 500,
        deployments: 4,
        nextId: 100,
        leader: { id: 1, name: 'Leader Vane', race: defRace, cls: defCls, spec: defSpec, level: 6, injuries: [] },
        officers: [
          { id: 10, name: 'Capt. Sera', race: defRace, cls: defCls, spec: defSpec, level: 5, ticks: 0, injuries: [], deployments: 3, resting: 0 },
          { id: 11, name: 'Lt. Bram', race: defRace, cls: defCls, spec: defSpec, level: 2, ticks: 2, injuries: [], deployments: 2, resting: 0 }
        ],
        roster: [
          { id: 21, name: 'Mate One', race: defRace, cls: defCls, spec: defSpec, baseM: 3, baseR: 2, modM: 1, modR: 0, startCon: 6, conTrained: 1, magic: 0, adv: 2, injuries: [], deployments: 2, resting: 0, bond: 22 },
          { id: 22, name: 'Mate Two', race: defRace, cls: defCls, spec: defSpec, baseM: 3, baseR: 2, modM: 1, modR: 0, startCon: 6, conTrained: 0, magic: 0, adv: 1, injuries: [], deployments: 1, resting: 0, bond: 21 },
          { id: 23, name: 'Mate Three', race: defRace, cls: defCls, spec: defSpec, baseM: 2, baseR: 3, modM: 0, modR: 1, startCon: 5, conTrained: 0, magic: 0, adv: 0, injuries: [], deployments: 0, resting: 0 },
          { id: 24, name: 'Mate Four', race: defRace, cls: defCls, spec: defSpec, baseM: 2, baseR: 2, modM: 0, modR: 0, startCon: 5, conTrained: 0, magic: 0, adv: 0, injuries: [], deployments: 0, resting: 0 },
          { id: 25, name: 'Mate Five', race: defRace, cls: defCls, spec: defSpec, baseM: 2, baseR: 2, modM: 0, modR: 0, startCon: 5, conTrained: 0, magic: 0, adv: 0, injuries: [], deployments: 0, resting: 1 }
        ],
        board: [],
        memorial: [],
        nemeses: [],
        standing: { empire: 0, suderia: 0 },
        facilities: {},
        doctrines: {}
      });
      delete testMeta.detachments;
      delete testMeta.detachLog;
      delete testMeta.detachCaptives;
      delete testMeta.detachPending;
      // 1. Old save without any detachment fields does not throw
      Object.keys(META).forEach(function (k) { delete META[k]; });
      Object.assign(META, JSON.parse(JSON.stringify(testMeta)));
      var oldSaveOk = true;
      try {
        var o0 = odds(META.officers[0], META.roster.slice(0, 3), { obj: 'hunt', host: 'bandits', tier: 1, pay: 280 });
        var rLines = [];
        resolveAll(rLines);
        oldSaveOk = !!o0 && Array.isArray(rLines);
      } catch (e) {
        oldSaveOk = false;
      }
      check('Old save without detachment fields runs odds() and resolveAll() without throwing', oldSaveOk);
      // 2. Check 6 set-ups across all 5 bands: probabilities sum to 1, stay in [0,1], and 20,000 rolls match within 1.5 percentage points
      var setups = [
        {
          name: 'Setup 1 (Near certain)',
          expectedBand: 'Near certain',
          off: { id: 91, name: 'High Capt', race: defRace, cls: defCls, spec: defSpec, level: 9, injuries: [] },
          mates: [
            { id: 31, name: 'M1', race: defRace, cls: defCls, spec: defSpec, baseM: 4, baseR: 3, modM: 2, modR: 1, startCon: 7, conTrained: 2, magic: 0, adv: 4, injuries: [] },
            { id: 32, name: 'M2', race: defRace, cls: defCls, spec: defSpec, baseM: 4, baseR: 3, modM: 2, modR: 1, startCon: 7, conTrained: 2, magic: 0, adv: 4, injuries: [] },
            { id: 33, name: 'M3', race: defRace, cls: defCls, spec: defSpec, baseM: 4, baseR: 3, modM: 1, modR: 1, startCon: 6, conTrained: 1, magic: 0, adv: 3, injuries: [] },
            { id: 34, name: 'M4', race: defRace, cls: defCls, spec: defSpec, baseM: 4, baseR: 3, modM: 1, modR: 1, startCon: 6, conTrained: 1, magic: 0, adv: 3, injuries: [] }
          ],
          contract: { obj: 'beacons', host: 'hollow', tier: 1, pay: 270 },
          orders: 'normal'
        },
        {
          name: 'Setup 2 (Likely)',
          expectedBand: 'Likely',
          off: META.officers[0],
          mates: META.roster.slice(1, 4),
          contract: { obj: 'hunt', host: 'bandits', tier: 1, pay: 280 },
          orders: 'normal'
        },
        {
          name: 'Setup 3 (Even)',
          expectedBand: 'Even',
          off: META.officers[0],
          mates: META.roster.slice(0, 3),
          contract: { obj: 'extract', host: 'deserters', tier: 2, pay: 675 },
          orders: 'normal'
        },
        {
          name: 'Setup 4 (Risky)',
          expectedBand: 'Risky',
          off: { id: 92, name: 'Lt. Rowe', race: defRace, cls: defCls, spec: defSpec, level: 4, injuries: [] },
          mates: META.roster.slice(0, 2),
          contract: { obj: 'extract', host: 'bandits', tier: 2, pay: 600 },
          orders: 'normal'
        },
        {
          name: 'Setup 5 (Desperate)',
          expectedBand: 'Desperate',
          off: META.officers[1],
          mates: META.roster.slice(2, 4),
          contract: { obj: 'hold', host: 'deserters', tier: 3, pay: 1350 },
          orders: 'normal'
        },
        {
          name: 'Setup 6 (Hard orders)',
          expectedBand: null,
          off: META.officers[0],
          mates: META.roster.slice(0, 3),
          contract: { obj: 'assassinate', host: 'greenskins', tier: 2, pay: 720 },
          orders: 'hard'
        }
      ];
      for (var s = 0; s < setups.length; s++) {
        var st = setups[s];
        var od = odds(st.off, st.mates, st.contract, st.orders);
        var pSum = 0;
        var inBounds = true;
        for (var k = 0; k < OUTCOME_KEYS.length; k++) {
          var pv = od.p[OUTCOME_KEYS[k]];
          pSum += pv;
          if (pv < 0 || pv > 1 || isNaN(pv)) inBounds = false;
        }
        check(st.name + ' probabilities sum to 1 and stay in [0,1]', Math.abs(pSum - 1) <= 1e-9 && inBounds, 'sum=' + pSum);
        if (st.expectedBand) {
          check(st.name + ' lands in band "' + st.expectedBand + '"', od.band === st.expectedBand, 'got ' + od.band + ' (' + od.pct + '%)');
        }
        if (od.band === 'Near certain') {
          check('Near certain keeps officerDead + captured under 1%', (od.p.officerDead + od.p.captured) < 0.01);
        }
        if (od.band === 'Desperate') {
          check('Desperate keeps officerDead and captured strictly > 0', od.p.officerDead > 0 && od.p.captured > 0);
        }
        var counts = { win: 0, costly: 0, parlay: 0, fail: 0, lostMate: 0, captured: 0, officerDead: 0 };
        var N = 20000;
        for (var r = 0; r < N; r++) {
          var outKey = roll(od, seededRng);
          counts[outKey]++;
        }
        var maxDiffPts = 0;
        for (var m = 0; m < OUTCOME_KEYS.length; m++) {
          var key = OUTCOME_KEYS[m];
          var freq = counts[key] / N;
          var diffPts = Math.abs(freq - od.p[key]) * 100;
          if (diffPts > maxDiffPts) maxDiffPts = diffPts;
        }
        check(st.name + ' 20,000 rolls within 1.5 pts of odds().p', maxDiffPts <= 1.5, 'maxDiff=' + maxDiffPts.toFixed(3) + ' pts');
      }
      // 3. Check orders shifts direction
      var baseO = odds(META.officers[0], META.roster.slice(0, 3), setups[2].contract, 'normal');
      var safeO = odds(META.officers[0], META.roster.slice(0, 3), setups[2].contract, 'safe');
      var hardO = odds(META.officers[0], META.roster.slice(0, 3), setups[2].contract, 'hard');
      check(
        'Orders move probabilities in stated direction',
        safeO.p.parlay > baseO.p.parlay && safeO.p.win < baseO.p.win && safeO.p.lostMate < baseO.p.lostMate &&
        hardO.p.parlay < baseO.p.parlay && hardO.p.win > baseO.p.win && hardO.p.lostMate > baseO.p.lostMate && hardO.p.officerDead > baseO.p.officerDead
      );
      // 4. Prepare board for canSend / send / recall / resolveAll tests
      var c1 = { obj: 'hunt', host: 'bandits', tier: 1, pay: 280, faction: 'empire', brief: 'Hunt bandits' };
      var c2 = { obj: 'extract', host: 'deserters', tier: 2, pay: 675, faction: 'suderia', brief: 'Extract boxes' };
      var c3 = { obj: 'hold', host: 'monsters', tier: 3, pay: 1350, faction: 'empire', brief: 'Hold fort' };
      META.board = [c1, c2, c3];
      check('canSend refuses contract not on board', !canSend(10, [21, 22], { obj: 'hunt', host: 'bandits', tier: 1, pay: 280 }).ok);
      check('canSend refuses too few mates (1)', !canSend(10, [21], c1).ok);
      check('canSend refuses too many mates (5)', !canSend(10, [21, 22, 23, 24, 25], c1).ok);
      check('canSend refuses busy/resting mate', !canSend(10, [21, 25], c1).ok);
      check('canSend refuses tier gate (Level 2 officer on Tier 2)', !canSend(11, [21, 22], c2).ok);
      check('canSend refuses Leader as detachment officer', !canSend(1, [21, 22], c1).ok);
      var sent1 = send(10, [21, 22], c1, 'normal');
      check('send() succeeds, removes contract from board, and calls stubbed saveMeta', !!sent1 && META.board.indexOf(c1) === -1 && META.officers[0].away === sent1.id && META.roster[0].away === sent1.id && stubCalls > 0);
      check('canSend refuses officer already away', !canSend(10, [23, 24], c2).ok);
      check('canSend refuses mate already away', !canSend(11, [21, 23], c1).ok);
      var recalled = recall(sent1.id);
      check('recall() restores contract to board and clears away markers', recalled && META.board.indexOf(c1) !== -1 && !META.officers[0].away && !META.roster[0].away);
      // Cap refusal test when OFFICER_CAP detachments are active
      var sA = send(10, [21, 22], c2, 'normal');
      var sB = send(11, [23, 24], c1, 'normal');
      var extraOfficer = { id: 12, name: 'Lt. Extra', race: defRace, cls: defCls, spec: defSpec, level: 6, ticks: 0, injuries: [], resting: 0 };
      META.officers.push(extraOfficer);
      var extraMates = [
        { id: 26, name: 'M6', race: defRace, cls: defCls, spec: defSpec, baseM: 2, baseR: 2, modM: 0, modR: 0, startCon: 5, conTrained: 0, magic: 0, adv: 0, injuries: [], resting: 0 },
        { id: 27, name: 'M7', race: defRace, cls: defCls, spec: defSpec, baseM: 2, baseR: 2, modM: 0, modR: 0, startCon: 5, conTrained: 0, magic: 0, adv: 0, injuries: [], resting: 0 }
      ];
      META.roster.push(extraMates[0], extraMates[1]);
      check('canSend refuses beyond OFFICER_CAP active detachments', !canSend(12, [26, 27], c3).ok);
      recall(sA.id);
      recall(sB.id);
      META.officers.pop();
      META.roster.splice(META.roster.length - 2, 2);
      // 5. Round trip: lostMate -> dead mate leaves roster, unbonded, memorial entry added, standing shifts -1
      send(10, [21, 22], c1, 'normal');
      DETACH._force = 'lostMate';
      var linesLost = [];
      resolveAll(linesLost);
      check(
        'send -> resolveAll (lostMate) removes dead mate, unbonds survivor, adds grave, shifts standing -1, clears away',
        META.roster.length === 4 &&
        META.memorial.length === 1 &&
        META.standing.empire === -1 &&
        !META.officers[0].away &&
        !META.roster[0].bond
      );
      // 6. Rescue flow: capture -> pending -> wrapped rollBoard adds rescue contract & decrements boardsLeft -> freed on rescue victory
      META.board = [c1];
      send(10, [23, 24], c1, 'normal');
      DETACH._force = 'captured';
      var linesCap = [];
      resolveAll(linesCap);
      check(
        'Capture marks officer away="captive", adds to detachCaptives and detachPending',
        META.officers[0].away === 'captive' &&
        META.detachCaptives.length === 1 &&
        META.detachCaptives[0].boardsLeft === RESCUE_BOARDS &&
        META.detachPending.length === 1 &&
        META.detachPending[0].kind === 'rescue'
      );
      wrappedRollBoard();
      var rescueContract = null;
      for (var bi = 0; bi < META.board.length; bi++) {
        if (META.board[bi].detKind === 'rescue' && META.board[bi].detOfficerId === 10) {
          rescueContract = META.board[bi];
          break;
        }
      }
      check(
        'Wrapped rollBoard appends rescue contract and counts boardsLeft down',
        !!rescueContract && META.detachCaptives[0].boardsLeft === RESCUE_BOARDS - 1
      );
      if (gExists) {
        G = { contract: rescueContract, result: 'victory', hospitalReroll: false };
      }
      var linesRescue = [];
      resolveAll(linesRescue);
      check(
        'Winning rescue contract frees officer and clears away marker',
        !META.officers[0].away && META.detachCaptives.length === 0 && META.detachPending.length === 0
      );
    } finally {
      DETACH._force = origForce;
      _saveHook = null;
      try { saveMeta = origSaveMeta; } catch (e) {}
      if (typeof window !== 'undefined') window.saveMeta = origWinSaveMeta;
      if (gExists) G = gBackup;
      var restored = JSON.parse(metaBackup);
      Object.keys(META).forEach(function (k) { delete META[k]; });
      Object.assign(META, restored);
    }
    return { pass: pass, fail: fail, details: details };
  }

  /* -------------------------------------------------------------------------
     EXPORT PUBLIC API
  ------------------------------------------------------------------------- */
  var DETACH = {
    odds: odds,
    roll: roll,
    canSend: canSend,
    send: send,
    recall: recall,
    pay: pay,
    resolveAll: resolveAll,
    splitPay: splitPay,
    bigContract: bigContract,
    selfTest: selfTest,
    REPORTS: REPORTS,
    HOSTPOOL: HOSTPOOL,
    _force: null
  };
  if (typeof window !== 'undefined') {
    window.DETACH = DETACH;
  }
})();
