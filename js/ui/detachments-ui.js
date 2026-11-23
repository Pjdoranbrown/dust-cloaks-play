/* ============================================================================
   Index DET2 — Detachments Screens (js/ui/detachments-ui.js)
   DOM-only UI wrapper for the Detachments Engine (window.DETACH):
   - Planning Table (renderTable): adds a "Detachments" scroll (#tbl-detach)
     under "Who Marches" (works as its own ux.js tab or as a plain scroll),
     officer state cards, inline send panel, stable MU.contract selection across
     send/recall, and Rescue / Revenge badges on board contract scrolls.
   - Roster (renderRoster): adds an "On detachment" section at the top for
     active detachments and captive officers.
   - Debrief (renderDebrief): adds a compact "Detachment reports" card above
     the debrief body for detachments resolved on this contract.
   HOW TO LOAD:
   Include <script src="js/ui/detachments-ui.js"></script> in index.html after
   <script src="js/campaign/detachments.js"></script>. Exposes window.DETACH_UI.
   ROLLBACK: delete this file and its <script> tag (it stores nothing).
============================================================================ */
(function () {
  'use strict';

  var missing = [];
  if (typeof DETACH === 'undefined') missing.push('DETACH');
  if (typeof META === 'undefined') missing.push('META');
  if (typeof MU === 'undefined') missing.push('MU');
  if (typeof officers === 'undefined') missing.push('officers');
  if (typeof renderTable === 'undefined') missing.push('renderTable');
  if (typeof renderRoster === 'undefined') missing.push('renderRoster');
  if (typeof renderDebrief === 'undefined') missing.push('renderDebrief');
  if (typeof esc === 'undefined') missing.push('esc');
  if (typeof OBJECTIVES === 'undefined') missing.push('OBJECTIVES');
  if (typeof HOSTS === 'undefined') missing.push('HOSTS');
  if (typeof $ === 'undefined') missing.push('$');
  if (missing.length > 0) {
    console.warn('[DETACH_UI] Index DET2 disabled; missing globals: ' + missing.join(', '));
    return;
  }

  /* -------------------------------------------------------------------------
     TUNABLES (named constants for labels, thresholds, and style tokens)
  ------------------------------------------------------------------------- */
  var STYLE_ID              = 'det-ui-css';
  var SCROLL_ID             = 'tbl-detach';
  var TAB_KEY               = 'detach';
  var MIN_MATES             = 2;
  var MAX_MATES             = 4;
  var SPREAD_LOW_PCT        = 1;
  var DEFAULT_ORDERS        = 'normal';

  var LABELS = {
    tableHeading:    'Detachments',
    tableSub:        'Each ready officer can lead 2 to 4 Squad Mates on another board contract until you return.',
    rosterHeading:   'On detachment',
    debriefHeading:  'Detachment reports',
    ready:           'Ready',
    resting:         'Resting (sits out this contract)',
    away:            'On detachment (until you return)',
    recallBtn:       'Recall',
    sendBtn:         'Send detachment',
    openPanelBtn:    'Plan detachment',
    closePanelBtn:   'Close panel',
    pickContract:    '1. Contract',
    pickSquad:       '2. Squad (pick 2 to 4 Squad Mates)',
    pickOrders:      '3. Orders',
    oddsHeading:     '4. Odds & Expected Pay',
    onlyOneContract: 'The board has only the contract selected for your own march. No other contract is open for a detachment.',
    leavesMarch:     'Leaves your march',
    mateAway:        'Away',
    mateResting:     'Resting',
    payIfWin:        'Pay if they win',
    noRisks:         'No special troop risks noted',
    selectContract:  'Pick an eligible contract above to see odds and pay.',
    rescuePrefix:    'Rescue: ',
    revengePrefix:   'Revenge: '
  };

  var ORDERS_OPTIONS = [
    { id: 'safe',   label: 'Play it safe' },
    { id: 'normal', label: 'As they see fit' },
    { id: 'hard',   label: 'Press hard' }
  ];

  var SPREAD_SPEC = [
    { key: 'win',         label: 'Win' },
    { key: 'costly',      label: 'Costly' },
    { key: 'parlay',      label: 'Parley' },
    { key: 'fail',        label: 'Fail' },
    { key: 'lostMate',    label: 'Lost a mate' },
    { key: 'captured',    label: 'Captured' },
    { key: 'officerDead', label: 'Killed' }
  ];

  var OUTCOME_META = {
    win:         { label: 'Win',          tone: 'good',    pip: '\u2713' },
    costly:      { label: 'Costly win',   tone: 'good',    pip: '\u2713' },
    parlay:      { label: 'Parleyed',     tone: 'neutral', pip: '\u223c' },
    fail:        { label: 'Failed',       tone: 'danger',  pip: '\u2715' },
    lostMate:    { label: 'Lost a mate',  tone: 'danger',  pip: '\u2715' },
    captured:    { label: 'Captured',     tone: 'danger',  pip: '\u2715' },
    officerDead: { label: 'Killed',       tone: 'danger',  pip: '\u2715' }
  };

  /* -------------------------------------------------------------------------
     EPHEMERAL UI STATE (never written to META or localStorage)
  ------------------------------------------------------------------------- */
  var uiState = {
    openOfficerId: null,
    drafts: {},
    activeTabIsDetach: false
  };

  /* -------------------------------------------------------------------------
     STYLESHEET INJECTION (SG-1 palette & typography, 375px responsive)
  ------------------------------------------------------------------------- */
  function injectStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '/* Index DET2 — Detachments UI (SG-1 compliant tokens) */',
      '.det-wrap { font-family: Alegreya, Georgia, Cambria, serif; color: var(--ink); box-sizing: border-box; width: 100%; max-width: 100%; }',
      '.det-wrap *, .det-debrief-card *, .det-roster-sec * { box-sizing: border-box; }',
      '.det-sub { font-size: 14px; color: var(--ink-soft); margin: 0 0 8px; line-height: 1.4; }',
      '.det-officers { display: flex; flex-direction: column; gap: 10px; width: 100%; }',
      '.det-officer-block { background: var(--parchment); border: 2px solid var(--ink-soft); border-radius: 4px; padding: 10px; color: var(--ink); width: 100%; }',
      '.det-officer-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; width: 100%; }',
      '.det-portrait { width: 44px; height: 44px; image-rendering: pixelated; border: 1px solid var(--ink-soft); background: var(--parchment-deep); border-radius: 3px; flex-shrink: 0; object-fit: contain; }',
      '.det-portrait-fallback { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; height: 44px; padding: 0 6px; background: var(--parchment-deep); border: 1px solid var(--ink-soft); border-radius: 3px; font-weight: bold; font-size: 14px; color: var(--ink); flex-shrink: 0; }',
      '.det-officer-meta { flex: 1 1 140px; min-width: 0; text-align: left; }',
      '.det-officer-name { font-family: "Alegreya SC", Georgia, Cambria, serif; font-size: 16px; font-weight: bold; color: var(--ink); line-height: 1.2; word-break: break-word; }',
      '.det-officer-lvl { font-size: 14px; color: var(--ink-soft); font-weight: bold; }',
      '.det-state { font-size: 14px; font-weight: bold; margin-top: 2px; line-height: 1.35; }',
      '.det-state-ready { color: var(--good-dark); }',
      '.det-state-resting { color: var(--off-dark); }',
      '.det-state-away { color: var(--steel); }',
      '.det-state-captive { color: var(--bad-dark); }',
      '.det-btn { font-family: Georgia, Cambria, serif; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 3px; border: 2px solid var(--ink); background: var(--wood); color: var(--parchment); cursor: pointer; line-height: 1.2; }',
      '.det-btn:hover:not(:disabled), .det-btn:focus-visible:not(:disabled) { background: var(--blood); color: var(--bone); outline: 2px solid var(--blood); outline-offset: 1px; }',
      '.det-btn:disabled { background: var(--parchment-deep); color: var(--off-dark); border-color: var(--off-dark); cursor: not-allowed; opacity: 0.75; }',
      '.det-btn-blood { background: var(--blood); color: var(--parchment); border-color: var(--blood-deep); }',
      '.det-btn-blood:hover:not(:disabled), .det-btn-blood:focus-visible:not(:disabled) { background: var(--blood-deep); color: var(--bone); }',
      '.det-panel { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--ink-soft); display: flex; flex-direction: column; gap: 10px; width: 100%; }',
      '.det-sec-label { font-family: Georgia, Cambria, serif; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.6px; color: var(--blood-deep); margin: 0 0 4px; text-align: left; }',
      '.det-contracts { display: flex; flex-direction: column; gap: 6px; width: 100%; }',
      '.det-contract-btn { display: flex; flex-direction: column; align-items: flex-start; text-align: left; width: 100%; padding: 7px 9px; background: var(--parchment-deep); color: var(--ink); border: 2px solid var(--ink-soft); border-radius: 3px; font-family: Alegreya, Georgia, Cambria, serif; font-size: 14px; cursor: pointer; gap: 2px; }',
      '.det-contract-btn:hover:not(:disabled), .det-contract-btn:focus-visible:not(:disabled) { background: var(--parchment); border-color: var(--blood); outline: 2px solid var(--blood); outline-offset: 1px; }',
      '.det-contract-btn.det-on { background: var(--parchment); border-color: var(--good-dark); box-shadow: inset 4px 0 0 var(--good-dark); }',
      '.det-contract-btn.det-disabled, .det-contract-btn:disabled { background: var(--canvas); color: var(--off-dark); border-color: var(--off-dark); cursor: not-allowed; opacity: 0.78; }',
      '.det-contract-top { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 6px; flex-wrap: wrap; font-weight: bold; }',
      '.det-contract-sub { font-size: 14px; color: var(--ink-soft); }',
      '.det-gate-reason { font-size: 14px; font-weight: bold; color: var(--bad-dark); margin-top: 2px; }',
      '.det-mates { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; }',
      '.det-mate-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; background: var(--parchment-deep); color: var(--ink); border: 2px solid var(--ink-soft); border-radius: 3px; font-family: Alegreya, Georgia, Cambria, serif; font-size: 14px; cursor: pointer; text-align: left; max-width: 100%; min-width: 0; flex: 1 1 135px; }',
      '.det-mate-btn img { width: 28px; height: 28px; image-rendering: pixelated; flex-shrink: 0; }',
      '.det-mate-btn:hover:not(:disabled), .det-mate-btn:focus-visible:not(:disabled) { background: var(--parchment); border-color: var(--blood); outline: 2px solid var(--blood); outline-offset: 1px; }',
      '.det-mate-btn.det-on { background: var(--parchment); border-color: var(--good-dark); box-shadow: inset 3px 0 0 var(--good-dark); }',
      '.det-mate-btn.det-off, .det-mate-btn:disabled { background: var(--canvas); color: var(--off-dark); border-color: var(--off-dark); cursor: not-allowed; opacity: 0.65; }',
      '.det-mate-info { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }',
      '.det-mate-name { font-weight: bold; color: var(--ink); word-break: break-word; }',
      '.det-mate-role { font-size: 14px; color: var(--ink-soft); }',
      '.det-mate-march { font-size: 14px; font-weight: bold; color: var(--blood); }',
      '.det-mate-flag { font-size: 14px; font-weight: bold; color: var(--bad-dark); }',
      '.det-orders { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; }',
      '.det-order-btn { flex: 1 1 95px; padding: 6px 8px; background: var(--parchment-deep); color: var(--ink); border: 2px solid var(--ink-soft); border-radius: 3px; font-family: Georgia, Cambria, serif; font-size: 14px; font-weight: bold; cursor: pointer; text-align: center; }',
      '.det-order-btn:hover:not(:disabled), .det-order-btn:focus-visible:not(:disabled) { background: var(--parchment); border-color: var(--blood); outline: 2px solid var(--blood); outline-offset: 1px; }',
      '.det-order-btn.det-on { background: var(--wood); color: var(--parchment); border-color: var(--ink); }',
      '.det-odds-box { background: var(--parchment-deep); border: 1px solid var(--ink-soft); border-radius: 3px; padding: 8px; text-align: left; display: flex; flex-direction: column; gap: 4px; width: 100%; }',
      '.det-odds-band { font-size: 15px; font-weight: bold; color: var(--ink); }',
      '.det-odds-risks { font-size: 14px; font-weight: bold; color: var(--blood); }',
      '.det-odds-spread { font-size: 14px; color: var(--ink); line-height: 1.4; word-break: break-word; }',
      '.det-odds-pay { font-size: 14px; font-weight: bold; color: var(--gold-dark); }',
      '.det-send-row { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; width: 100%; }',
      '.det-send-why { font-size: 14px; font-weight: bold; color: var(--bad-dark); }',
      '.det-board-badge { display: inline-block; margin-left: 4px; margin-bottom: 5px; padding: 2px 6px; border-radius: 2px; font-family: Georgia, Cambria, serif; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }',
      '.det-badge-rescue { background: var(--steel); color: var(--parchment); }',
      '.det-badge-revenge { background: var(--blood-deep); color: var(--bone); }',
      '.det-roster-sec { width: 100%; max-width: 1150px; background: var(--parchment); border: 2px solid var(--ink-soft); border-radius: 4px; padding: 10px 14px; margin: 10px 0 6px; color: var(--ink); text-align: left; }',
      '.det-roster-sec h2 { font-family: "Alegreya SC", Georgia, Cambria, serif; font-size: 18px; color: var(--blood-deep); margin: 0 0 6px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--ink-soft); padding-bottom: 4px; }',
      '.det-roster-list { display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 1.4; }',
      '.det-roster-item { padding: 4px 0; border-bottom: 1px dashed var(--canvas); }',
      '.det-roster-item:last-child { border-bottom: none; }',
      '.det-roster-captive { color: var(--bad-dark); font-weight: bold; }',
      '.det-debrief-card { max-width: 760px; width: 100%; background: var(--parchment); border: 2px solid var(--ink-soft); border-radius: 4px; padding: 10px 14px; margin: 0 0 10px; color: var(--ink); text-align: left; }',
      '.det-debrief-card h3 { font-family: "Alegreya SC", Georgia, Cambria, serif; font-size: 17px; color: var(--blood-deep); margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid var(--ink-soft); padding-bottom: 4px; }',
      '.det-debrief-rows { display: flex; flex-direction: column; gap: 6px; }',
      '.det-debrief-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 4px 6px; background: var(--parchment-deep); border-radius: 3px; font-size: 14px; }',
      '.det-debrief-who { font-weight: bold; color: var(--ink); }',
      '.det-debrief-con { color: var(--ink-soft); font-size: 14px; flex: 1 1 140px; }',
      '.det-outcome-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 3px; font-family: Georgia, Cambria, serif; font-size: 14px; font-weight: bold; border: 1px solid transparent; }',
      '.det-tone-good { background: var(--good-dark); color: var(--parchment); border-color: var(--good-dark); }',
      '.det-tone-neutral { background: var(--steel); color: var(--parchment); border-color: var(--steel); }',
      '.det-tone-danger { background: var(--bad-dark); color: var(--parchment); border-color: var(--blood-deep); }',
      '.det-debrief-pay { font-weight: bold; font-size: 14px; color: var(--gold-dark); min-width: 52px; text-align: right; }',
      '@media (max-width: 420px) {',
      '  .det-officer-block, .det-roster-sec, .det-debrief-card { padding: 8px; }',
      '  .det-mate-btn { flex: 1 1 100%; }',
      '  .det-order-btn { flex: 1 1 100%; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* -------------------------------------------------------------------------
     PURE HELPERS (used by screens and verified by DETACH_UI.selfTest)
  ------------------------------------------------------------------------- */
  function safeEsc(s) {
    if (typeof esc === 'function') return esc(String(s == null ? '' : s));
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hostName(hostKey, hostsMap) {
    var map = hostsMap || (typeof HOSTS !== 'undefined' ? HOSTS : {});
    var h = map && map[hostKey];
    return h ? (h.name || h.the || hostKey) : String(hostKey || 'Unknown host');
  }

  function contractTitle(c, objMap) {
    if (!c) return 'Contract';
    if (c.title) return c.title;
    var map = objMap || (typeof OBJECTIVES !== 'undefined' ? OBJECTIVES : {});
    var o = map && map[c.obj];
    return o ? o.name : String(c.obj || 'Contract');
  }

  function ordersLabel(ordKey) {
    for (var i = 0; i < ORDERS_OPTIONS.length; i++) {
      if (ORDERS_OPTIONS[i].id === ordKey) return ORDERS_OPTIONS[i].label;
    }
    return ORDERS_OPTIONS[1].label;
  }

  function isPersonResting(p) {
    if (!p) return false;
    if (p.resting && p.resting > 0) return true;
    if (typeof busy === 'function') {
      try { if (busy(p)) return true; } catch (e) {}
    }
    return false;
  }

  function findCaptiveRecord(officer, meta) {
    var m = meta || META;
    var caps = (m && Array.isArray(m.detachCaptives)) ? m.detachCaptives : [];
    var oid = officer && typeof officer === 'object' ? officer.id : officer;
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i];
      if (!c) continue;
      if (c.officerId === oid || (c.officer && c.officer.id === oid)) return c;
    }
    return null;
  }

  function findActiveDetachment(officer, meta) {
    var m = meta || META;
    var dets = (m && Array.isArray(m.detachments)) ? m.detachments : [];
    var oid = officer && typeof officer === 'object' ? officer.id : officer;
    for (var i = 0; i < dets.length; i++) {
      var d = dets[i];
      if (d && (d.officerId === oid || (oIdMatch(d, officer)))) return d;
    }
    return null;
  }

  function oIdMatch(det, officer) {
    if (!det || !officer || typeof officer !== 'object') return false;
    return det.id && officer.away === det.id;
  }

  function getOfficerState(officer, meta) {
    var m = meta || META;
    if (!officer) return { kind: 'resting', label: LABELS.resting };
    var cap = findCaptiveRecord(officer, m);
    if (officer.away === 'captive' || cap) {
      var hName = hostName(cap ? cap.host : 'bandits');
      return {
        kind: 'captive',
        captive: cap,
        hostName: hName,
        label: 'Held by ' + hName + '; rescue contract on the board'
      };
    }
    var det = findActiveDetachment(officer, m);
    if (det || (officer.away && officer.away !== 'captive')) {
      return {
        kind: 'away',
        detachment: det,
        label: LABELS.away
      };
    }
    if (isPersonResting(officer)) {
      return {
        kind: 'resting',
        label: LABELS.resting
      };
    }
    return {
      kind: 'ready',
      label: LABELS.ready
    };
  }

  function getReadyMateSample(meta) {
    var m = meta || META;
    var roster = (m && Array.isArray(m.roster)) ? m.roster : [];
    var ids = [];
    for (var i = 0; i < roster.length; i++) {
      var p = roster[i];
      if (p && !p.away && !isPersonResting(p)) {
        ids.push(p.id);
        if (ids.length >= MIN_MATES) break;
      }
    }
    return ids;
  }

  /**
   * Returns the board contracts excluding the player's currently selected contract
   * (mu.contract), annotating each with eligibility and gate reason from DETACH.canSend.
   */
  function getContractPickerItems(meta, mu, officer, detachEngine) {
    var m = meta || META;
    var u = mu || MU || { contract: 0, ids: [] };
    var eng = detachEngine || DETACH;
    var board = (m && Array.isArray(m.board)) ? m.board : [];
    var selIdx = (u && typeof u.contract === 'number') ? u.contract : 0;
    var sampleMates = getReadyMateSample(m);
    var items = [];
    var oid = officer && typeof officer === 'object' ? officer.id : officer;

    for (var i = 0; i < board.length; i++) {
      if (i === selIdx) continue;
      var c = board[i];
      if (!c) continue;
      var checkRes = (eng && typeof eng.canSend === 'function')
        ? eng.canSend(oid, sampleMates, c)
        : { ok: true, why: '' };
      var rawReason = (checkRes && (checkRes.reason || checkRes.why)) || '';
      var failedBeforeMates = !!(checkRes && !checkRes.ok && (
        sampleMates.length >= MIN_MATES || !/Squad Mate/i.test(rawReason)
      ));
      items.push({
        index: i,
        contract: c,
        disabled: failedBeforeMates,
        reason: failedBeforeMates ? rawReason : ''
      });
    }
    return items;
  }

  /**
   * Returns Squad Mate picker items with disabled state for away/resting mates
   * and "Leaves your march" flag for mates currently in MU.ids.
   */
  function getMatePickerItems(meta, mu, pickedIds, officer) {
    var m = meta || META;
    var u = mu || MU || { contract: 0, ids: [] };
    var roster = (m && Array.isArray(m.roster)) ? m.roster : [];
    var marchIds = (u && Array.isArray(u.ids)) ? u.ids : [];
    var picked = Array.isArray(pickedIds) ? pickedIds : [];
    var out = [];

    for (var i = 0; i < roster.length; i++) {
      var p = roster[i];
      if (!p) continue;
      if (officer && p.id === officer.id) continue;   // K86: the officer who leads never joins their own squad list
      var away = !!p.away;
      var resting = !away && isPersonResting(p);
      var inMarch = !away && !resting && marchIds.indexOf(p.id) !== -1;
      var isSelected = !away && !resting && picked.indexOf(p.id) !== -1;
      var atMax = !isSelected && picked.length >= MAX_MATES;
      out.push({
        mate: p,
        id: p.id,
        name: p.name,
        away: away,
        resting: resting,
        disabled: away || resting || atMax,
        lockedOut: away || resting,
        inMarch: inMarch,
        selected: isSelected,
        statusText: away ? LABELS.mateAway : resting ? LABELS.mateResting : (inMarch ? LABELS.leavesMarch : '')
      });
    }
    return out;
  }

  /**
   * Formats a single probability (in [0, 1]) as whole % or "<1%" for (0, 1%).
   */
  function formatPct(prob) {
    var val = Number(prob);
    if (!val || isNaN(val) || val <= 0) return '0%';
    var pct = val * 100;
    if (pct > 0 && pct < SPREAD_LOW_PCT) return '<1%';
    return Math.round(pct) + '%';
  }

  /**
   * Formats the 7-outcome probability map into the required one-line spread:
   * "Win 48% · Costly 22% · Parley 14% · Fail 12% · Lost a mate 3% · Captured 1% · Killed 0%"
   */
  function formatSpread(oddsOrP) {
    var p = (oddsOrP && oddsOrP.p) ? oddsOrP.p : (oddsOrP || {});
    var parts = [];
    for (var i = 0; i < SPREAD_SPEC.length; i++) {
      var item = SPREAD_SPEC[i];
      parts.push(item.label + ' ' + formatPct(p[item.key] || 0));
    }
    return parts.join(' \u00b7 ');
  }

  /**
   * Runs a board-mutating action (send or recall) while keeping MU.contract
   * pointed at the exact same contract object (or 0 if removed) and filtering
   * away/resting mates out of MU.ids.
   */
  function runWithStableSelection(meta, mu, actionFn) {
    var m = meta || META;
    var u = mu || MU;
    var board = (m && Array.isArray(m.board)) ? m.board : null;
    var heldContract = (u && board && typeof u.contract === 'number' && board[u.contract])
      ? board[u.contract]
      : null;
    var result = actionFn();
    var afterBoard = (m && Array.isArray(m.board)) ? m.board : null;
    if (u && afterBoard) {
      var newIdx = heldContract ? afterBoard.indexOf(heldContract) : -1;
      u.contract = newIdx >= 0 ? newIdx : 0;
    }
    if (u && Array.isArray(u.ids) && m && Array.isArray(m.roster)) {
      u.ids = u.ids.filter(function (id) {
        for (var i = 0; i < m.roster.length; i++) {
          var p = m.roster[i];
          if (p && p.id === id && !p.away && !isPersonResting(p)) return true;
        }
        return false;
      });
    }
    return result;
  }

  /**
   * Finds the detachLog entries resolved during this contract (at === META.deployments - 1)
   * and maps each to display fields and style-guide badge metadata.
   */
  function getDebriefRows(meta, objMap, hostsMap) {
    var m = meta || META;
    if (!m || !Array.isArray(m.detachLog) || typeof m.deployments !== 'number') {
      return [];
    }
    var targetAt = m.deployments - 1;
    if (targetAt < 0) return [];
    var rows = [];
    for (var i = 0; i < m.detachLog.length; i++) {
      var entry = m.detachLog[i];
      if (!entry || typeof entry.at !== 'number' || entry.at !== targetAt) continue;
      var outMeta = OUTCOME_META[entry.outcome] || OUTCOME_META.fail;
      var cTitle = entry.contractTitle || contractTitle({ obj: entry.obj, title: entry.title }, objMap);
      var hTitle = hostName(entry.host, hostsMap);
      var earned = typeof entry.pay === 'number' ? entry.pay : 0;
      rows.push({
        id: entry.id || ('log_' + i),
        officer: entry.officer || 'Officer',
        contractLabel: cTitle + ' vs ' + hTitle + (entry.tier ? ' (Tier ' + entry.tier + ')' : ''),
        outcome: entry.outcome,
        badgeLabel: outMeta.label,
        pip: outMeta.pip,
        tone: outMeta.tone,
        pay: earned,
        payLabel: earned > 0 ? ('+' + earned + 'gp') : '0gp'
      });
    }
    return rows;
  }

  /**
   * Resolves board badge label for rescue or revenge contracts.
   */
  function getContractBadge(c, meta) {
    if (!c || !c.detKind) return null;
    var m = meta || META;
    if (c.detKind === 'rescue') {
      var offName = c.detOfficerName || (typeof c.detOfficer === 'string' ? c.detOfficer : (c.detOfficer && c.detOfficer.name));
      if (!offName) {
        var oid = c.detOfficerId != null ? c.detOfficerId : c.officerId;
        var offList = (typeof officers === 'function') ? officers() : ((m && m.officers) || []);
        for (var i = 0; i < offList.length; i++) {
          if (offList[i] && offList[i].id === oid) { offName = offList[i].name; break; }
        }
        if (!offName && m && Array.isArray(m.detachCaptives)) {
          for (var j = 0; j < m.detachCaptives.length; j++) {
            var cap = m.detachCaptives[j];
            if (cap && (cap.officerId === oid || (cap.officer && cap.officer.id === oid))) {
              offName = (cap.officer && cap.officer.name) || cap.officerName;
              break;
            }
          }
        }
      }
      return {
        kind: 'rescue',
        text: LABELS.rescuePrefix + (offName || 'Officer')
      };
    }
    if (c.detKind === 'revenge') {
      var nemName = c.detNemesis || c.nemesis || 'Commander';
      return {
        kind: 'revenge',
        text: LABELS.revengePrefix + nemName
      };
    }
    return null;
  }

  function resolveMatesById(mateIds, meta) {
    var m = meta || META;
    var roster = (m && Array.isArray(m.roster)) ? m.roster : [];
    var out = [];
    if (!Array.isArray(mateIds)) return out;
    for (var i = 0; i < mateIds.length; i++) {
      var id = mateIds[i];
      for (var j = 0; j < roster.length; j++) {
        if (roster[j] && roster[j].id === id) {
          out.push(roster[j]);
          break;
        }
      }
    }
    return out;
  }

  function resolveOfficerById(officerId, meta) {
    var m = meta || META;
    var list = (typeof officers === 'function' && m === META) ? officers() : ((m && m.officers) || []);
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === officerId) return list[i];
    }
    return null;
  }

  /* -------------------------------------------------------------------------
     WRAP DETACH.send & DETACH.recall TO KEEP MU.contract STABLE
  ------------------------------------------------------------------------- */
  if (DETACH && typeof DETACH.send === 'function' && !DETACH.send._detUiWrapped) {
    var _origSend = DETACH.send;
    var wrappedSend = function (officerId, mateIds, contract, orders) {
      return runWithStableSelection(META, MU, function () {
        return _origSend.call(DETACH, officerId, mateIds, contract, orders);
      });
    };
    wrappedSend._detUiWrapped = true;
    DETACH.send = wrappedSend;
  }

  if (DETACH && typeof DETACH.recall === 'function' && !DETACH.recall._detUiWrapped) {
    var _origRecall = DETACH.recall;
    var wrappedRecall = function (detId) {
      return runWithStableSelection(META, MU, function () {
        return _origRecall.call(DETACH, detId);
      });
    };
    wrappedRecall._detUiWrapped = true;
    DETACH.recall = wrappedRecall;
  }

  /* -------------------------------------------------------------------------
     1. PLANNING TABLE: BOARD BADGES & DETACHMENTS SCROLL (#tbl-detach)
  ------------------------------------------------------------------------- */
  function safePortraitHTML(person) {
    if (typeof portraitURL === 'function') {
      try {
        var url = portraitURL(person, false);
        if (url) {
          return '<img class="det-portrait" src="' + safeEsc(url) + '" alt="' + safeEsc(person.name) + '">';
        }
      } catch (e) {}
    }
    return '<span class="det-portrait-fallback">' + safeEsc(person && person.name ? person.name : 'Officer') + '</span>';
  }

  function safeMatePortraitHTML(mate) {
    if (typeof portraitURL === 'function') {
      try {
        var url = portraitURL(mate, false);
        if (url) {
          return '<img src="' + safeEsc(url) + '" alt="">';
        }
      } catch (e) {}
    }
    return '';
  }

  function getOrInitDraft(officer) {
    var oid = officer.id;
    var d = uiState.drafts[oid];
    if (!d) {
      d = { contract: null, mateIds: [], orders: DEFAULT_ORDERS };
      uiState.drafts[oid] = d;
    }
    // Keep only mates still on roster and neither away nor resting
    var roster = (META && Array.isArray(META.roster)) ? META.roster : [];
    d.mateIds = d.mateIds.filter(function (id) {
      for (var i = 0; i < roster.length; i++) {
        var p = roster[i];
        if (p && p.id === id && !p.away && !isPersonResting(p)) return true;
      }
      return false;
    });
    if (d.mateIds.length > MAX_MATES) {
      d.mateIds = d.mateIds.slice(0, MAX_MATES);
    }
    var cItems = getContractPickerItems(META, MU, officer, DETACH);
    var stillValid = false;
    for (var j = 0; j < cItems.length; j++) {
      if (cItems[j].contract === d.contract && !cItems[j].disabled) {
        stillValid = true;
        break;
      }
    }
    if (!stillValid) {
      d.contract = null;
      for (var k = 0; k < cItems.length; k++) {
        if (!cItems[k].disabled) {
          d.contract = cItems[k].contract;
          break;
        }
      }
    }
    return d;
  }

  function decorateBoardBadges(rootEl) {
    if (!rootEl || !META || !Array.isArray(META.board)) return;
    var scrollEls = rootEl.querySelectorAll('.cscrolls .cscroll');
    for (var i = 0; i < scrollEls.length && i < META.board.length; i++) {
      var el = scrollEls[i];
      var existing = el.querySelectorAll('.det-board-badge');
      for (var r = 0; r < existing.length; r++) {
        existing[r].remove();
      }
      var badge = getContractBadge(META.board[i], META);
      if (!badge) continue;
      var tagEl = document.createElement('div');
      tagEl.className = 'tag det-board-badge ' + (badge.kind === 'rescue' ? 'det-badge-rescue' : 'det-badge-revenge');
      tagEl.textContent = badge.text;
      var firstTag = el.querySelector('.tag');
      if (firstTag && firstTag.parentNode === el) {
        firstTag.insertAdjacentElement('afterend', tagEl);
      } else {
        el.insertBefore(tagEl, el.firstChild);
      }
    }
  }

  function syncMarchCountHeading(rootEl) {
    if (!rootEl || !MU || !Array.isArray(MU.ids)) return;
    var marchScroll = rootEl.querySelector('#tbl-march');
    if (!marchScroll) return;
    var h3 = marchScroll.querySelector('h3');
    if (h3) {
      h3.textContent = 'Who Marches (' + MU.ids.length + ' / 5)';
    }
  }

  function renderSendPanelHTML(officer) {
    var draft = getOrInitDraft(officer);
    var cItems = getContractPickerItems(META, MU, officer, DETACH);
    var html = '<div class="det-panel" data-officer-id="' + safeEsc(officer.id) + '">';

    // 1. Contract picker
    html += '<div><div class="det-sec-label">' + safeEsc(LABELS.pickContract) + '</div>';
    if (cItems.length === 0) {
      html += '<div class="det-sub">' + safeEsc(LABELS.onlyOneContract) + '</div></div>';
      html += '</div>';
      return html;
    }
    html += '<div class="det-contracts">';
    for (var i = 0; i < cItems.length; i++) {
      var ci = cItems[i];
      var c = ci.contract;
      var isSel = !ci.disabled && draft.contract === c;
      var badge = getContractBadge(c, META);
      html += '<button type="button" class="det-contract-btn' +
        (isSel ? ' det-on' : '') +
        (ci.disabled ? ' det-disabled' : '') +
        '" data-det-act="pick-contract" data-officer-id="' + safeEsc(officer.id) +
        '" data-board-idx="' + ci.index +
        '" aria-pressed="' + (isSel ? 'true' : 'false') + '"' +
        (ci.disabled ? ' disabled' : '') + '>';
      html += '<div class="det-contract-top"><span>' + safeEsc(contractTitle(c)) +
        (badge ? ' [' + safeEsc(badge.text) + ']' : '') +
        '</span><span>Tier ' + safeEsc(c.tier || 1) + ' \u00b7 ' + safeEsc(c.pay || 0) + 'gp</span></div>';
      html += '<div class="det-contract-sub">Enemy: ' + safeEsc(hostName(c.host)) +
        (c.patron ? ' \u00b7 ' + safeEsc(forPatron(c.patron)) : '') + '</div>';
      if (ci.disabled && ci.reason) {
        html += '<div class="det-gate-reason">' + safeEsc(ci.reason) + '</div>';
      }
      html += '</button>';
    }
    html += '</div></div>';

    // 2. Squad picker
    draft.mateIds = draft.mateIds.filter(function (id) { return id !== officer.id; });   // K86
    var mItems = getMatePickerItems(META, MU, draft.mateIds, officer);
    html += '<div><div class="det-sec-label">' + safeEsc(LABELS.pickSquad) + ' (' + draft.mateIds.length + ' / ' + MAX_MATES + ')</div>';
    if (mItems.length === 0) {
      html += '<div class="det-sub">No Squad Mates in the roster.</div>';
    } else {
      html += '<div class="det-mates">';
      for (var m = 0; m < mItems.length; m++) {
        var mi = mItems[m];
        var specName = (typeof SPECS !== 'undefined' && SPECS && mi.mate.spec && SPECS[mi.mate.spec])
          ? SPECS[mi.mate.spec].name
          : '';
        html += '<button type="button" class="det-mate-btn' +
          (mi.selected ? ' det-on' : '') +
          (mi.lockedOut ? ' det-off' : '') +
          '" data-det-act="toggle-mate" data-officer-id="' + safeEsc(officer.id) +
          '" data-mate-id="' + safeEsc(mi.id) +
          '" aria-pressed="' + (mi.selected ? 'true' : 'false') + '"' +
          (mi.disabled ? ' disabled' : '') + '>';
        html += safeMatePortraitHTML(mi.mate);
        html += '<span class="det-mate-info">';
        html += '<span class="det-mate-name">' + safeEsc(mi.name) + '</span>';
        if (specName) {
          html += '<span class="det-mate-role">' + safeEsc(specName) + '</span>';
        }
        if (mi.lockedOut && mi.statusText) {
          html += '<span class="det-mate-flag">' + safeEsc(mi.statusText) + '</span>';
        } else if (mi.inMarch) {
          html += '<span class="det-mate-march">' + safeEsc(LABELS.leavesMarch) + '</span>';
        }
        html += '</span></button>';
      }
      html += '</div>';
    }
    html += '</div>';

    // INDEX A32: the officer's kit (F-24.3)
    if (typeof ARM !== 'undefined' && ARM && ARM.sendPanelHTML) html += ARM.sendPanelHTML(officer);
    // 3. Orders
    html += '<div><div class="det-sec-label">' + safeEsc(LABELS.pickOrders) + '</div><div class="det-orders">';
    for (var oIdx = 0; oIdx < ORDERS_OPTIONS.length; oIdx++) {
      var opt = ORDERS_OPTIONS[oIdx];
      var ordOn = (draft.orders || DEFAULT_ORDERS) === opt.id;
      html += '<button type="button" class="det-order-btn' + (ordOn ? ' det-on' : '') +
        '" data-det-act="pick-orders" data-officer-id="' + safeEsc(officer.id) +
        '" data-orders="' + safeEsc(opt.id) +
        '" aria-pressed="' + (ordOn ? 'true' : 'false') + '">' +
        safeEsc(opt.label) + '</button>';
    }
    html += '</div></div>';

    // 4. Odds & Send button
    var pickedMates = resolveMatesById(draft.mateIds, META);
    html += '<div><div class="det-sec-label">' + safeEsc(LABELS.oddsHeading) + '</div><div class="det-odds-box">';
    if (draft.contract) {
      var oddsRes = DETACH.odds(officer, pickedMates, draft.contract, draft.orders);
      var expectedWinPay = DETACH.pay(draft.contract, 'win', pickedMates);
      var risksText = (oddsRes && Array.isArray(oddsRes.risks) && oddsRes.risks.length > 0)
        ? oddsRes.risks.join(' \u00b7 ')
        : LABELS.noRisks;
      html += '<div class="det-odds-band">' + safeEsc(oddsRes.label) + '</div>';
      html += '<div class="det-odds-risks">' + safeEsc(risksText) + '</div>';
      html += '<div class="det-odds-spread">' + safeEsc(formatSpread(oddsRes)) + '</div>';
      html += '<div class="det-odds-pay">' + safeEsc(LABELS.payIfWin) + ': ' + safeEsc(expectedWinPay) + 'gp</div>';
    } else {
      html += '<div class="det-sub" style="margin:0">' + safeEsc(LABELS.selectContract) + '</div>';
    }
    html += '</div></div>';

    var canRes = DETACH.canSend(officer.id, draft.mateIds, draft.contract);
    var canOk = !!(canRes && canRes.ok);
    var canWhy = (canRes && (canRes.reason || canRes.why)) || '';
    html += '<div class="det-send-row">';
    html += '<button type="button" class="det-btn det-btn-blood det-send-btn" data-det-act="send" data-officer-id="' +
      safeEsc(officer.id) + '"' + (canOk ? '' : ' disabled') + '>' + safeEsc(LABELS.sendBtn) + '</button>';
    if (!canOk && canWhy) {
      html += '<div class="det-send-why">' + safeEsc(canWhy) + '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderDetachScrollInnerHTML() {
    var offList = officers();
    var readyIds = [];
    for (var i = 0; i < offList.length; i++) {
      if (getOfficerState(offList[i], META).kind === 'ready') {
        readyIds.push(offList[i].id);
      }
    }
    if (readyIds.length > 0 && readyIds.indexOf(uiState.openOfficerId) === -1) {
      uiState.openOfficerId = readyIds[0];
    } else if (readyIds.length === 0) {
      uiState.openOfficerId = null;
    }

    var html = '<h3>' + safeEsc(LABELS.tableHeading) + '</h3>';
    html += '<div class="det-wrap"><div class="det-sub">' + safeEsc(LABELS.tableSub) + '</div><div class="det-officers">';

    for (var j = 0; j < offList.length; j++) {
      var o = offList[j];
      var st = getOfficerState(o, META);
      var specLabel = (typeof SPECS !== 'undefined' && SPECS && o.spec && SPECS[o.spec]) ? (' \u00b7 ' + SPECS[o.spec].name) : '';
      html += '<div class="det-officer-block" data-officer-card="' + safeEsc(o.id) + '">';
      html += '<div class="det-officer-head">';
      html += safePortraitHTML(o);
      html += '<div class="det-officer-meta">';
      html += '<div class="det-officer-name">' + safeEsc(o.name) + '</div>';
      html += '<div class="det-officer-lvl">Level ' + safeEsc(o.level || 1) + safeEsc(specLabel) + '</div>';

      if (st.kind === 'ready') {
        html += '<div class="det-state det-state-ready">' + safeEsc(st.label) + '</div>';
      } else if (st.kind === 'resting') {
        html += '<div class="det-state det-state-resting">' + safeEsc(st.label) + '</div>';
      } else if (st.kind === 'away') {
        var det = st.detachment;
        var cDesc = det && det.contract
          ? (contractTitle(det.contract) + ' vs ' + hostName(det.contract.host) + ' (' + ordersLabel(det.orders) + ')')
          : 'Contract';
        html += '<div class="det-state det-state-away">' + safeEsc(LABELS.away) + ': ' + safeEsc(cDesc) + '</div>';
      } else if (st.kind === 'captive') {
        html += '<div class="det-state det-state-captive">' + safeEsc(st.label) + '</div>';
      }
      html += '</div>';

      if (st.kind === 'away' && st.detachment) {
        html += '<button type="button" class="det-btn det-recall-btn" data-det-act="recall" data-det-id="' +
          safeEsc(st.detachment.id) + '">' + safeEsc(LABELS.recallBtn) + '</button>';
      } else if (st.kind === 'ready' && readyIds.length > 1) {
        var isOpen = uiState.openOfficerId === o.id;
        html += '<button type="button" class="det-btn" data-det-act="toggle-panel" data-officer-id="' +
          safeEsc(o.id) + '" aria-pressed="' + (isOpen ? 'true' : 'false') + '">' +
          safeEsc(isOpen ? LABELS.closePanelBtn : LABELS.openPanelBtn) + '</button>';
      }
      html += '</div>';

      if (st.kind === 'ready' && (uiState.openOfficerId === o.id || readyIds.length === 1)) {
        html += renderSendPanelHTML(o);
      }
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function handleDetachScrollClick(e) {
    var btn = e.target && e.target.closest ? e.target.closest('button[data-det-act]') : null;
    if (!btn || btn.disabled) return;
    var act = btn.getAttribute('data-det-act');
    var oidRaw = btn.getAttribute('data-officer-id');
    var officer = oidRaw != null ? resolveOfficerById(Number(oidRaw) || oidRaw, META) : null;

    if (act === 'toggle-panel' && officer) {
      uiState.openOfficerId = (uiState.openOfficerId === officer.id) ? null : officer.id;
      refreshDetachScroll();
      return;
    }

    if (act === 'pick-contract' && officer) {
      var bIdx = Number(btn.getAttribute('data-board-idx'));
      var draft = getOrInitDraft(officer);
      if (META && Array.isArray(META.board) && META.board[bIdx]) {
        draft.contract = META.board[bIdx];
        if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') {
          try { SFX.play('pick'); } catch (err) {}
        }
        refreshDetachScroll();
      }
      return;
    }

    if (act === 'toggle-mate' && officer) {
      var midRaw = btn.getAttribute('data-mate-id');
      var mid = isNaN(Number(midRaw)) ? midRaw : Number(midRaw);
      var dMate = getOrInitDraft(officer);
      if (mid === officer.id) return;   // K86
      var pos = dMate.mateIds.indexOf(mid);
      if (pos !== -1) {
        dMate.mateIds.splice(pos, 1);
      } else if (dMate.mateIds.length < MAX_MATES) {
        dMate.mateIds.push(mid);
      }
      if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') {
        try { SFX.play('pick'); } catch (err) {}
      }
      refreshDetachScroll();
      return;
    }

    if (act === 'pick-orders' && officer) {
      var ord = btn.getAttribute('data-orders') || DEFAULT_ORDERS;
      var dOrd = getOrInitDraft(officer);
      dOrd.orders = ord;
      if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') {
        try { SFX.play('pick'); } catch (err) {}
      }
      refreshDetachScroll();
      return;
    }

    if (act === 'send' && officer) {
      var dSend = getOrInitDraft(officer);
      var sent = DETACH.send(officer.id, dSend.mateIds.slice(), dSend.contract, dSend.orders);
      if (sent) {
        delete uiState.drafts[officer.id];
        if (typeof ensureMuster === 'function') {
          try { ensureMuster(); } catch (err) {}
        }
        if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') {
          try { SFX.play('pick'); } catch (err) {}
        }
        renderTable();
      } else {
        refreshDetachScroll();
      }
      return;
    }

    if (act === 'recall') {
      var detId = btn.getAttribute('data-det-id');
      if (detId) {
        var recalled = DETACH.recall(detId);
        if (recalled) {
          if (typeof ensureMuster === 'function') {
            try { ensureMuster(); } catch (err) {}
          }
          if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') {
            try { SFX.play('pick'); } catch (err) {}
          }
          renderTable();
        }
      }
    }
  }

  function refreshDetachScroll() {
    var scrollEl = document.getElementById(SCROLL_ID);
    if (!scrollEl) return;
    scrollEl.innerHTML = renderDetachScrollInnerHTML();
  }

  /**
   * Ensures #tbl-detach works both when ux.js is not loaded (plain scroll)
   * and when ux.js splits .scroll[id^="tbl-"] into .ux-tabs (regardless of load order).
   */
  function syncUxTabsForDetach(tableInner, detachScroll) {
    if (!tableInner || !detachScroll) return;
    var tabBar = tableInner.querySelector('.ux-tabs');
    if (!tabBar) return;

    var existingBtn = tabBar.querySelector('button[data-tab="' + TAB_KEY + '"]');
    if (!existingBtn) {
      var marchBtn = tabBar.querySelector('button[data-tab="march"]');
      var refBtn = marchBtn || tabBar.querySelector('button');
      var detBtn = document.createElement('button');
      detBtn.type = 'button';
      detBtn.dataset.tab = TAB_KEY;
      detBtn.textContent = LABELS.tableHeading;
      if (refBtn) {
        if (refBtn.className) detBtn.className = refBtn.className;
        detBtn.classList.remove('on', 'active');   // K82: the copied class carried the picked tab's 'on', so two tabs looked open
        if (refBtn.getAttribute('role')) detBtn.setAttribute('role', refBtn.getAttribute('role'));
      } else {
        detBtn.setAttribute('role', 'tab');
      }
      detBtn.setAttribute('aria-selected', 'false');
      detBtn.tabIndex = -1;
      if (marchBtn && marchBtn.parentNode === tabBar) {
        marchBtn.insertAdjacentElement('afterend', detBtn);
      } else {
        tabBar.appendChild(detBtn);
      }
      existingBtn = detBtn;
    }

    var allTabBtns = Array.prototype.slice.call(tabBar.querySelectorAll('button[data-tab]'));
    function setTabActive(targetKey) {
      uiState.activeTabIsDetach = (targetKey === TAB_KEY);
      for (var i = 0; i < allTabBtns.length; i++) {
        var b = allTabBtns[i];
        var isTarget = b.dataset.tab === targetKey;
        b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        b.classList.toggle('on', isTarget);
        b.classList.toggle('active', isTarget);
        b.tabIndex = isTarget ? 0 : -1;
      }
      var scrolls = tableInner.querySelectorAll('.scroll[id^="tbl-"]');
      for (var s = 0; s < scrolls.length; s++) {
        var sc = scrolls[s];
        var key = sc.id.replace(/^tbl-/, '');
        var show = (key === targetKey);
        sc.hidden = !show;
        sc.classList.toggle('hidden', !show);
        sc.style.display = show ? '' : 'none';
      }
    }

    // Bind click synchronization if ux.js ran before us
    if (!tabBar._detUiBound) {
      tabBar._detUiBound = true;
      tabBar.addEventListener('click', function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest('button[data-tab]') : null;
        if (!b) return;
        var key = b.dataset.tab;
        if (key === TAB_KEY) {
          setTabActive(TAB_KEY);
        } else {
          uiState.activeTabIsDetach = false;
          detachScroll.hidden = true;
          detachScroll.classList.add('hidden');
          detachScroll.style.display = 'none';
          existingBtn.setAttribute('aria-selected', 'false');
          existingBtn.classList.remove('on', 'active');
          existingBtn.tabIndex = -1;
        }
      });
    }

    if (uiState.activeTabIsDetach) {
      setTabActive(TAB_KEY);
    } else {
      var anySelected = tabBar.querySelector('button[data-tab][aria-selected="true"]');
      if (anySelected && anySelected.dataset.tab !== TAB_KEY) {
        existingBtn.classList.remove('on', 'active');
        existingBtn.setAttribute('aria-selected', 'false');
        detachScroll.hidden = true;
        detachScroll.classList.add('hidden');
        detachScroll.style.display = 'none';
      }
    }
  }

  function enhanceTable() {
    injectStyles();
    var tableInner = $('table-inner');
    if (!tableInner) return;

    decorateBoardBadges(tableInner);
    syncMarchCountHeading(tableInner);

    var inPrologue = (typeof inStoryNow === 'function' && inStoryNow());
    var offList = officers();
    var existingScroll = tableInner.querySelector('#' + SCROLL_ID);
    if (!offList || offList.length === 0 || inPrologue) {
      if (existingScroll) existingScroll.remove();
      return;
    }

    var marchScroll = tableInner.querySelector('#tbl-march');
    if (!marchScroll) return;

    var detachScroll = existingScroll || document.createElement('div');
    detachScroll.className = 'scroll';
    detachScroll.id = SCROLL_ID;
    detachScroll.innerHTML = renderDetachScrollInnerHTML();
    if (!detachScroll._detUiClickBound) {
      detachScroll._detUiClickBound = true;
      detachScroll.addEventListener('click', handleDetachScrollClick);
    }
    if (!existingScroll) {
      marchScroll.insertAdjacentElement('afterend', detachScroll);
    }
    syncUxTabsForDetach(tableInner, detachScroll);
  }

  /* -------------------------------------------------------------------------
     2. ROSTER SCREEN: "ON DETACHMENT" & CAPTIVES SECTION
  ------------------------------------------------------------------------- */
  function buildRosterDetachmentsHTML(meta) {
    var m = meta || META;
    var dets = (m && Array.isArray(m.detachments)) ? m.detachments : [];
    var caps = (m && Array.isArray(m.detachCaptives)) ? m.detachCaptives : [];
    if (dets.length === 0 && caps.length === 0) return '';

    var html = '<div class="det-roster-sec" id="det-roster-on-detachment">';
    html += '<h2>' + safeEsc(LABELS.rosterHeading) + '</h2>';
    html += '<div class="det-roster-list">';

    for (var i = 0; i < dets.length; i++) {
      var d = dets[i];
      if (!d) continue;
      var off = resolveOfficerById(d.officerId, m) || { id: d.officerId, name: d.officerName || 'Officer', level: 1 };
      var mates = resolveMatesById(d.mateIds, m);
      var mateNames = mates.map(function (p) { return safeEsc(p.name); }).join(', ') || 'Squad';
      var c = d.contract || { obj: 'hunt', host: 'bandits', tier: 1 };
      var cName = contractTitle(c);
      var hName = hostName(c.host);
      var ordText = ordersLabel(d.orders);
      var bandText = d.band || d.oddsLabel || '';
      if (!bandText && DETACH && typeof DETACH.odds === 'function') {
        var od = DETACH.odds(off, mates, c, d.orders);
        bandText = (od && (od.label || od.band)) || '';
      }
      html += '<div class="det-roster-item">' +
        '<b>' + safeEsc(off.name) + '</b> with ' + mateNames + ': ' +
        '<b>' + safeEsc(cName) + '</b> against ' + safeEsc(hName) +
        ' \u00b7 Orders: <i>' + safeEsc(ordText) + '</i>' +
        (bandText ? ' \u00b7 Odds: <b>' + safeEsc(bandText) + '</b>' : '') +
        '</div>';
    }

    for (var j = 0; j < caps.length; j++) {
      var cap = caps[j];
      if (!cap) continue;
      var capOff = resolveOfficerById(cap.officerId, m) || cap.officer || { name: 'Officer' };
      var capHost = hostName(cap.host);
      var bLeft = typeof cap.boardsLeft === 'number' ? cap.boardsLeft : 0;
      html += '<div class="det-roster-item det-roster-captive">' +
        safeEsc(capOff.name) + ': held by ' + safeEsc(capHost) +
        '. Rescue contract on the board (' + safeEsc(bLeft) + ' more boards)' +
        '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function enhanceRoster() {
    injectStyles();
    var rosterInner = $('roster-inner');
    if (!rosterInner) return;
    var oldSec = rosterInner.querySelector('#det-roster-on-detachment');
    if (oldSec) oldSec.remove();

    var secHTML = buildRosterDetachmentsHTML(META);
    if (!secHTML) return;

    var wrap = document.createElement('div');
    wrap.innerHTML = secHTML;
    var secEl = wrap.firstElementChild;
    var moneyEl = rosterInner.querySelector('.money') || rosterInner.querySelector('h1');
    if (moneyEl && moneyEl.parentNode === rosterInner) {
      moneyEl.insertAdjacentElement('afterend', secEl);
    } else {
      rosterInner.insertBefore(secEl, rosterInner.firstChild);
    }
  }

  /* -------------------------------------------------------------------------
     3. DEBRIEF SCREEN: COMPACT "DETACHMENT REPORTS" CARD
  ------------------------------------------------------------------------- */
  function buildDebriefCardHTML(meta) {
    var rows = getDebriefRows(meta);
    if (!rows || rows.length === 0) return '';

    var html = '<div class="det-debrief-card" id="det-debrief-reports">';
    html += '<h3>' + safeEsc(LABELS.debriefHeading) + '</h3>';
    html += '<div class="det-debrief-rows">';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<div class="det-debrief-row">';
      html += '<span class="det-debrief-who">' + safeEsc(r.officer) + '</span>';
      html += '<span class="det-debrief-con">' + safeEsc(r.contractLabel) + '</span>';
      html += '<span class="det-outcome-badge det-tone-' + safeEsc(r.tone) + '">' +
        safeEsc(r.pip) + ' ' + safeEsc(r.badgeLabel) + '</span>';
      html += '<span class="det-debrief-pay">' + safeEsc(r.payLabel) + '</span>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function enhanceDebrief() {
    injectStyles();
    var debriefInner = $('debrief-inner');
    if (!debriefInner) return;
    var oldCard = debriefInner.querySelector('#det-debrief-reports');
    if (oldCard) oldCard.remove();

    var cardHTML = buildDebriefCardHTML(META);
    if (!cardHTML) return;

    var wrap = document.createElement('div');
    wrap.innerHTML = cardHTML;
    var cardEl = wrap.firstElementChild;
    var logEl = debriefInner.querySelector('.log');
    if (logEl && logEl.parentNode === debriefInner) {
      logEl.insertAdjacentElement('beforebegin', cardEl);
    } else {
      debriefInner.insertBefore(cardEl, debriefInner.firstChild);
    }
  }

  /* -------------------------------------------------------------------------
     WRAP RENDER FUNCTIONS (ux.js pattern, each wrapped in try/catch)
  ------------------------------------------------------------------------- */
  {
    var _origRenderTable = renderTable;
    renderTable = function () {
      var r = _origRenderTable.apply(this, arguments);
      try {
        enhanceTable();
      } catch (err) {
        console.error('[DETACH_UI] renderTable wrapper error:', err);
      }
      return r;
    };
    if (typeof window !== 'undefined') window.renderTable = renderTable;
  }

  {
    var _origRenderRoster = renderRoster;
    renderRoster = function () {
      var r = _origRenderRoster.apply(this, arguments);
      try {
        enhanceRoster();
      } catch (err) {
        console.error('[DETACH_UI] renderRoster wrapper error:', err);
      }
      return r;
    };
    if (typeof window !== 'undefined') window.renderRoster = renderRoster;
  }

  {
    var _origRenderDebrief = renderDebrief;
    renderDebrief = function () {
      var r = _origRenderDebrief.apply(this, arguments);
      try {
        enhanceDebrief();
      } catch (err) {
        console.error('[DETACH_UI] renderDebrief wrapper error:', err);
      }
      return r;
    };
    if (typeof window !== 'undefined') window.renderDebrief = renderDebrief;
  }

  /* -------------------------------------------------------------------------
     SELF-TEST (pure helpers against stubbed META & board, never real save)
  ------------------------------------------------------------------------- */
  function selfTest() {
    var pass = 0;
    var fail = 0;
    var details = [];

    function check(name, cond, info) {
      if (cond) {
        pass++;
        details.push('PASS: ' + name);
      } else {
        fail++;
        details.push('FAIL: ' + name + (info ? ' (' + info + ')' : ''));
      }
    }

    var metaSnapshot = (typeof META !== 'undefined' && META) ? JSON.stringify(META) : null;

    try {
      var c0 = { obj: 'hunt', host: 'bandits', tier: 1, pay: 280, title: 'Hunt Bandits' };
      var c1 = { obj: 'extract', host: 'deserters', tier: 2, pay: 650, title: 'Extract Relic' };
      var c2 = { obj: 'hold', host: 'greenskins', tier: 3, pay: 1300, title: 'Hold Outpost' };

      var stubOfficer = { id: 101, name: 'Capt. Sera', level: 3, resting: 0 };
      var stubMeta = {
        deployments: 5,
        officers: [stubOfficer],
        roster: [
          { id: 201, name: 'Rowan', resting: 0 },
          { id: 202, name: 'Bram', resting: 0 },
          { id: 203, name: 'Kael', resting: 0, away: 'det_old' },
          { id: 204, name: 'Mira', resting: 1 },
          { id: 205, name: 'Toma', resting: 0 }
        ],
        board: [c0, c1, c2],
        detachments: [],
        detachCaptives: [],
        detachLog: [
          { id: 'det_old', at: 3, officer: 'Capt. Sera', obj: 'hunt', host: 'bandits', tier: 1, outcome: 'win', pay: 180 },
          { id: 'det_cur1', at: 4, officer: 'Capt. Sera', obj: 'extract', host: 'deserters', tier: 2, outcome: 'costly', pay: 460 },
          { id: 'det_cur2', at: 4, officer: 'Lt. Vane', obj: 'hunt', host: 'bandits', tier: 1, outcome: 'captured', pay: 0 }
        ]
      };
      var stubMu = { contract: 1, ids: [201, 202, 205] };

      var stubDetach = {
        canSend: function (oid, mateIds, contract) {
          var tier = (contract && contract.tier) || 1;
          var req = tier === 3 ? 5 : tier === 2 ? 3 : 1;
          if (stubOfficer.level < req) {
            return { ok: false, why: 'Tier ' + tier + ' requires an officer of Level ' + req };
          }
          if (!Array.isArray(mateIds) || mateIds.length < MIN_MATES || mateIds.length > MAX_MATES) {
            return { ok: false, why: 'Detachment needs 2 to 4 Squad Mates' };
          }
          return { ok: true, why: '' };
        }
      };

      // 1. Contract-picker list leaves out the selected contract & greys out above tier gate
      var pickerItems = getContractPickerItems(stubMeta, stubMu, stubOfficer, stubDetach);
      check(
        'Contract picker excludes player-selected contract (MU.contract)',
        pickerItems.length === 2 && pickerItems[0].contract === c0 && pickerItems[1].contract === c2
      );
      check(
        'Contract picker enables eligible tier and greys out contract above officer tier gate with reason',
        pickerItems[0].disabled === false &&
        pickerItems[1].disabled === true &&
        /Level 5/.test(pickerItems[1].reason)
      );
      var singleBoardMeta = { board: [c0], roster: stubMeta.roster };
      var singleItems = getContractPickerItems(singleBoardMeta, { contract: 0, ids: [] }, stubOfficer, stubDetach);
      check(
        'Contract picker offers nothing when board has only the selected contract',
        singleItems.length === 0
      );

      // 2. Selection index survives a send and a recall
      var sendMu = { contract: 2, ids: [201, 202, 205] };
      runWithStableSelection(stubMeta, sendMu, function () {
        // Simulate sending detachment on c0 (index 0) with mates 201 and 202
        stubMeta.board.splice(0, 1); // board is now [c1, c2]; c2 moved from index 2 to index 1
        stubMeta.roster[0].away = 'det_test';
        stubMeta.roster[1].away = 'det_test';
      });
      check(
        'Selected contract object survives send() splice and away mates leave MU.ids',
        stubMeta.board[sendMu.contract] === c2 &&
        sendMu.contract === 1 &&
        sendMu.ids.length === 1 &&
        sendMu.ids[0] === 205
      );
      runWithStableSelection(stubMeta, sendMu, function () {
        // Simulate recall restoring c0 to board and clearing away markers
        delete stubMeta.roster[0].away;
        delete stubMeta.roster[1].away;
        stubMeta.board.unshift(c0); // board is [c0, c1, c2] again; c2 moved back to index 2
      });
      check(
        'Selected contract object survives recall() board restoration',
        stubMeta.board[sendMu.contract] === c2 && sendMu.contract === 2
      );

      // 3. Away and resting mates are disabled in the picker; march mates show "Leaves your march"
      var mateItems = getMatePickerItems(stubMeta, stubMu, []);
      var byId = {};
      for (var i = 0; i < mateItems.length; i++) byId[mateItems[i].id] = mateItems[i];
      check(
        'Away and resting mates are disabled in the squad picker while ready mates are enabled',
        byId[201].disabled === false &&
        byId[202].disabled === false &&
        byId[203].disabled === true && byId[203].away === true &&
        byId[204].disabled === true && byId[204].resting === true
      );
      check(
        'Picking/showing a mate in MU.ids marks "Leaves your march"',
        byId[201].inMarch === true && byId[201].statusText === LABELS.leavesMarch
      );
      check(
        'K86: the leading officer is left out of their own squad list',
        !getMatePickerItems(stubMeta, stubMu, [], { id: 201 }).some(function (x) { return x.id === 201; }) &&
        getMatePickerItems(stubMeta, stubMu, [], { id: 201 }).length === mateItems.length - 1
      );

      // 4. Odds-spread formatter gives "<1%" for values between 0 and 1%
      var spreadStr = formatSpread({
        win: 0.48,
        costly: 0.22,
        parlay: 0.14,
        fail: 0.12,
        lostMate: 0.03,
        captured: 0.004,
        officerDead: 0
      });
      check(
        'Odds-spread formatter gives "<1%" for probabilities between 0 and 1%',
        formatPct(0.004) === '<1%' &&
        formatPct(0) === '0%' &&
        formatPct(0.48) === '48%' &&
        spreadStr === 'Win 48% \u00b7 Costly 22% \u00b7 Parley 14% \u00b7 Fail 12% \u00b7 Lost a mate 3% \u00b7 Captured <1% \u00b7 Killed 0%'
      );

      // 5. Debrief-row finder picks the right detachLog entries (at === META.deployments - 1)
      var debriefRows = getDebriefRows(
        stubMeta,
        { hunt: { name: 'Break the Host' }, extract: { name: 'Relic Recovery' } },
        { bandits: { name: 'Iron-Road Brigands' }, deserters: { name: 'Mutinous Deserters' } }
      );
      check(
        'Debrief-row finder picks only detachLog entries with at === META.deployments - 1',
        debriefRows.length === 2 &&
        debriefRows[0].id === 'det_cur1' &&
        debriefRows[0].tone === 'good' &&
        debriefRows[1].id === 'det_cur2' &&
        debriefRows[1].tone === 'danger'
      );

      // Verify real META was not mutated
      if (metaSnapshot !== null) {
        check('Real META save was untouched during selfTest', JSON.stringify(META) === metaSnapshot);
      }
    } catch (err) {
      fail++;
      details.push('FAIL: Unexpected exception in selfTest (' + (err && err.message ? err.message : String(err)) + ')');
    }

    return { pass: pass, fail: fail, details: details };
  }

  /* -------------------------------------------------------------------------
     EXPORT PUBLIC API
  ------------------------------------------------------------------------- */
  var DETACH_UI = {
    selfTest: selfTest,
    formatPct: formatPct,
    formatSpread: formatSpread,
    getContractPickerItems: getContractPickerItems,
    getMatePickerItems: getMatePickerItems,
    getDebriefRows: getDebriefRows,
    getOfficerState: getOfficerState,
    getContractBadge: getContractBadge,
    runWithStableSelection: runWithStableSelection
  };

  if (typeof window !== 'undefined') {
    window.DETACH_UI = DETACH_UI;
  }
})();
