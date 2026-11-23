/* Index ST1 - ?selftest one-click regression runner (Packet 08, R2-P3)
 *
 * What it does: only when the page URL has ?selftest, waits for the game to load, then runs three
 * silent regression sweeps on a THROWAWAY save slot (contracts, raids, prologue smoke test) and
 * shows a pass/fail table in a fixed overlay (plus console.table). Without the flag it does nothing
 * and adds no DOM. The real save is never written: SAVE_KEY, META and MAP are swapped out and put
 * back in a finally block, and the throwaway key is removed again.
 *
 * ROLLBACK: delete this file and its <script> tag
 */
(function () {
  'use strict';

  // ---- Activation: no flag, no effect ------------------------------------------------------------
  let flagged = false;
  try { flagged = /(?:^|[?&])selftest(?:[=&]|$)/.test(location.search) || window.SELFTEST_FORCE === true; } catch (e) {}   /* REG: the regression harness sets SELFTEST_FORCE and injects this file */
  if (!flagged || window.SELFTEST) return;

  // ---- Tunable constants -------------------------------------------------------------------------
  const TEST_KEY = 'dust_cloaks_selftest';  // the only storage key this file may write (removed after)
  const TICKS = 600;                         // update() calls per contract or raid case
  const YIELD_EVERY = 60;                    // yield to the browser every this many ticks
  const DRAW_FRAMES = 4;                     // draw() frames per case
  const CONTRACT_TIERS = [1, 3];             // tiers swept for every key in CONTRACT_KEYS
  const RAID_TIER = 2;                       // tier used for every raid host
  const PROLOGUE_CAMP_FRAMES = 3;            // camp frames per prologue step
  const MATE_COUNT = 4;                      // throwaway roster size (plus the leader)
  const MAX_COMBO_TRIES = 400;               // cap when searching RACES x CLASSES x SPECS
  const READY_TIMEOUT_MS = 15000;            // how long to wait for the game before running anyway
  const ERR_LEN = 140;                       // error text shown per row is cut to this length
  // Where draw frames are taken on the map (fractions of the map; null = where the leader stands)
  const DRAW_SPOTS = [null, [0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]];

  // ---- Feature detection (typeof on bare names; these are top-level let/const/function globals) ---
  const PROBE = {
    G: () => typeof G, META: () => typeof META, MAP: () => typeof MAP, SAVE_KEY: () => typeof SAVE_KEY,
    CAMP: () => typeof CAMP, CONTRACT_KEYS: () => typeof CONTRACT_KEYS, HOST_KEYS: () => typeof HOST_KEYS,
    RACES: () => typeof RACES, CLASSES: () => typeof CLASSES, SPECS: () => typeof SPECS,
    makeContract: () => typeof makeContract, makeRaidContract: () => typeof makeRaidContract,
    startDeployment: () => typeof startDeployment, update: () => typeof update, draw: () => typeof draw,
    loadMeta: () => typeof loadMeta, saveMeta: () => typeof saveMeta, freshMeta: () => typeof freshMeta,
    makeLeader: () => typeof makeLeader, makeMate: () => typeof makeMate,
    newStory: () => typeof newStory, startRoad: () => typeof startRoad, renderTitle: () => typeof renderTitle,
    updatePeople: () => typeof updatePeople, drawCamp: () => typeof drawCamp
  };
  function missing(names) {
    return names.filter(function (n) { try { return PROBE[n]() === 'undefined'; } catch (e) { return true; } });
  }
  const BASE = ['META', 'G', 'SAVE_KEY', 'loadMeta', 'saveMeta', 'makeLeader', 'RACES', 'CLASSES', 'SPECS'];
  const DEPLOY = BASE.concat(['startDeployment', 'update', 'draw']);

  // ---- State -------------------------------------------------------------------------------------
  const results = [];
  let errs = [];            // errors captured for the case that is running
  let phase = '';           // what the running case was doing (prefixed to thrown errors)
  let running = false, abort = false, ui = null;
  let realKey = null, realMeta = null, realMap = null, hadMap = false, uiTouched = false;
  let leaderCombo = null, mateCombos = null;
  let origWarn = null, warnWrap = null, origSwitch = null;
  let muteOn = false, muteTimer = null;

  class Skip extends Error {}

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function msgOf(e) {
    let s = String(e && e.message ? e.message : e).replace(/\s+/g, ' ');
    if (s.length > ERR_LEN) s = s.slice(0, ERR_LEN - 3) + '...';
    return s;
  }

  // Yield without background-tab timer throttling (as in the audit helper)
  let tick;
  if (typeof MessageChannel === 'function') {
    const mc = new MessageChannel(), q = [];
    mc.port1.onmessage = function () { const f = q.shift(); if (f) f(); };
    tick = () => new Promise(function (r) { q.push(r); mc.port2.postMessage(0); });
  } else {
    tick = () => new Promise(function (r) { setTimeout(r, 0); });
  }
  // Let a pending real game loop callback run (and see G === null) before the next case starts.
  // A hidden tab gets no animation frames, so skip it there (and never wait long).
  function frameSettle() {
    if (document.hidden || typeof requestAnimationFrame !== 'function') return Promise.resolve();
    return new Promise(function (r) {
      let done = false;
      const f = function () { if (!done) { done = true; r(); } };
      requestAnimationFrame(f); setTimeout(f, 250);
    });
  }

  // ---- Audio: muted (copied from the audit helper) -------------------------------------------------
  // Gain 0 on the final audio stage; when there is no shared context yet, zero the SFX master gain.
  function muteGain() {
    try {
      const W = window.AUDIO87;
      if (W && W.limiter && W.shared) {
        if (!W._mute) {
          const ctx = W.shared, real = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'destination').get.call(ctx);
          const g = new GainNode(ctx, { gain: 0 });   // not ctx.createGain: Index 87 patches that to steer sounds
          W.limiter.disconnect(); W.limiter.connect(g); g.connect(real); W._mute = g; W._real = real;
        }
        W._mute.gain.value = 0;
      } else if (typeof SFX !== 'undefined' && SFX._g) {
        const X = SFX._g(); if (X && X.master) X.master.gain.value = 0;
      }
    } catch (e) {}
  }
  // In-memory settings mute. ONLY ever applied to the throwaway META, so a muted value can never reach
  // the player's real save (the real META is not touched and the throwaway META is never the real one).
  function muteSettings() {
    try {
      if (SAVE_KEY === TEST_KEY && META && META !== realMeta && typeof settings === 'function') {
        const s = settings(); s.volume = 0; s.music = 0;
      }
    } catch (e) {}
  }
  function muteAll() { muteGain(); muteSettings(); }
  function unmute() {
    try {
      const W = window.AUDIO87; if (W && W._mute) W._mute.gain.value = 1;
      if (typeof SFX !== 'undefined' && SFX.setVol) SFX.setVol();   // real META is back by now
    } catch (e) {}
  }
  function hookAudioContext() {
    try {
      if (window.AudioContext && !window.AudioContext._aud) {
        const Orig = window.AudioContext;
        const Wrapped = function () {
          const c = new Orig(...arguments);
          try { if (muteOn) { setTimeout(muteGain, 0); muteGain(); } } catch (e) {}
          return c;
        };
        Wrapped.prototype = Orig.prototype; Wrapped._aud = true;
        window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
      }
    } catch (e) {}
  }
  function startMute() { muteOn = true; hookAudioContext(); muteAll(); if (!muteTimer) muteTimer = setInterval(muteAll, 2000); }
  function stopMute() { muteOn = false; clearInterval(muteTimer); muteTimer = null; unmute(); }

  // ---- Storage safety ----------------------------------------------------------------------------
  function snapshot() {
    const m = new Map();
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); m.set(k, localStorage.getItem(k)); }
    return m;
  }
  function guardKey() {
    if (SAVE_KEY !== TEST_KEY) { abort = true; throw new Error('SAVE_KEY changed during the run; stopped to protect the real save'); }
  }
  function safeSave() { guardKey(); saveMeta(); }

  // switchSlot saves the current META first and then moves to another key: blocked for the whole run.
  function blockSlots() {
    try {
      if (typeof switchSlot === 'function' && !switchSlot._st) {
        origSwitch = switchSlot;
        const guard = function (key) { errs.push('blocked switchSlot(' + key + ') during selftest'); };
        guard._st = true; switchSlot = guard;
      }
    } catch (e) { origSwitch = null; }
  }
  function unblockSlots() { if (origSwitch) { try { switchSlot = origSwitch; } catch (e) {} origSwitch = null; } }

  // ---- Error capture -----------------------------------------------------------------------------
  const onErr = function (e) {
    let m = e && e.message ? e.message : (e && e.error && e.error.message) || 'error event';
    if (e && e.filename) m += ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')';
    errs.push('window error: ' + m);
  };
  const onRej = function (e) { errs.push('unhandledrejection: ' + msgOf(e && e.reason)); };
  const onKey = function (e) {
    if (running && !(ui && e.target instanceof Node && ui.root.contains(e.target))) { e.stopImmediatePropagation(); e.preventDefault(); }
  };
  function installGuards() {
    origWarn = console.warn;
    warnWrap = function () {
      try {
        const a = arguments[0];
        if (typeof a === 'string' && a.indexOf('Draw error') === 0) {
          errs.push(a + (arguments.length > 1 ? ' ' + msgOf(arguments[1]) : '') + (arguments.length > 2 ? ' ' + msgOf(arguments[2]) : ''));
        }
      } catch (e) {}
      return origWarn.apply(console, arguments);
    };
    console.warn = warnWrap;
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { window.addEventListener(t, onKey, true); });
    blockSlots();
  }
  function removeGuards() {
    if (console.warn === warnWrap) console.warn = origWarn;
    window.removeEventListener('error', onErr);
    window.removeEventListener('unhandledrejection', onRej);
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { window.removeEventListener(t, onKey, true); });
    unblockSlots();
  }

  // ---- Overlay -----------------------------------------------------------------------------------
  const COLOURS = { PASS: '#7fd47f', FAIL: '#ff7a6b', SKIPPED: '#e6c35c' };
  function el(tag, css, text, parent) {
    const n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text !== undefined) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function buildUI() {
    if (ui) return;
    const root = el('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:13px/1.4 Consolas,Menlo,monospace;');
    root.id = 'selftest-overlay';
    const panel = el('div', 'background:#17130f;color:#eee;border:1px solid #6b5a3a;border-radius:6px;width:min(980px,96vw);max-height:92vh;display:flex;flex-direction:column;box-sizing:border-box;', undefined, root);
    const head = el('div', 'padding:10px 14px;border-bottom:1px solid #3a2f1e;', undefined, panel);
    el('div', 'font-weight:bold;font-size:15px;', 'Dust Cloaks selftest (Index ST1)', head);
    const status = el('div', 'margin-top:4px;color:#cdbf9f;', 'Waiting for the game to load...', head);
    const scroll = el('div', 'overflow:auto;flex:1 1 auto;padding:0 14px;', undefined, panel);
    const table = el('table', 'border-collapse:collapse;width:100%;margin:8px 0;', undefined, scroll);
    const thead = el('thead', '', undefined, table), hr = el('tr', '', undefined, thead);
    ['Sweep', 'Case', 'Result', 'First error', 'ms'].forEach(function (h) {
      el('th', 'text-align:left;padding:3px 8px;border-bottom:1px solid #6b5a3a;position:sticky;top:0;background:#17130f;', h, hr);
    });
    const tbody = el('tbody', '', undefined, table);
    const foot = el('div', 'padding:10px 14px;border-top:1px solid #3a2f1e;display:flex;gap:8px;', undefined, panel);
    const btn = 'font:inherit;padding:6px 14px;background:#2a2217;color:#eee;border:1px solid #6b5a3a;border-radius:4px;cursor:pointer;';
    const runBtn = el('button', btn, 'Run again', foot); runBtn.type = 'button'; runBtn.disabled = true;
    const closeBtn = el('button', btn, 'Close', foot); closeBtn.type = 'button';
    runBtn.addEventListener('click', function () { if (!running) run(); });
    closeBtn.addEventListener('click', function () { abort = true; if (!running) stopMute(); if (root.parentNode) root.parentNode.removeChild(root); ui = null; });
    (document.body || document.documentElement).appendChild(root);
    ui = { root: root, status: status, tbody: tbody, runBtn: runBtn };
  }
  function setStatus(t) { if (ui) ui.status.textContent = t; }
  function addRow(sweep, name, status, msg, ms) {
    const r = { sweep: sweep, case: name, result: status, error: msg || '', ms: Math.round(ms || 0) };
    results.push(r);
    if (!ui) return;
    const tr = el('tr', 'border-bottom:1px solid #2a2217;', undefined, ui.tbody);
    const cell = 'padding:3px 8px;vertical-align:top;';
    el('td', cell, r.sweep, tr); el('td', cell, r.case, tr);
    el('td', cell + 'font-weight:bold;color:' + (COLOURS[status] || '#eee') + ';', r.result, tr);
    el('td', cell + 'word-break:break-word;', r.error, tr); el('td', cell + 'text-align:right;', String(r.ms), tr);
    setStatus('Running... ' + results.length + ' rows so far');
  }
  function summary() {
    const c = { PASS: 0, FAIL: 0, SKIPPED: 0 };
    results.forEach(function (r) { c[r.result] = (c[r.result] || 0) + 1; });
    return c.PASS + ' pass, ' + c.FAIL + ' fail, ' + c.SKIPPED + ' skipped (' + results.length + ' rows)';
  }

  // ---- Throwaway slot: leader and roster ---------------------------------------------------------
  function combos() {
    const out = [];
    Object.keys(RACES).forEach(function (r) {
      Object.keys(CLASSES).forEach(function (c) { Object.keys(SPECS).forEach(function (s) { out.push([r, c, s]); }); });
    });
    return out;
  }
  function makeTester() {
    const tryOne = function (c) {
      const t = META.treasury;
      try { const L = makeLeader(c[0], c[1], c[2], 'Tester'); if (L && typeof L === 'object') return L; } catch (e) {}
      META.treasury = t;
      return null;
    };
    if (leaderCombo) { const L = tryOne(leaderCombo); if (L) return L; }
    const all = combos();
    for (let i = 0; i < all.length && i < MAX_COMBO_TRIES; i++) {
      const L = tryOne(all[i]);
      if (L) { leaderCombo = all[i]; return L; }
    }
    return null;
  }
  function tryMate(c, n) {
    try {
      const m = makeMate(c[0], c[1], c[2], 'Mate ' + (n + 1));
      if (m && typeof m === 'object') { if (META.roster.indexOf(m) < 0) META.roster.push(m); return true; }
    } catch (e) {}
    return false;
  }
  function addMates() {
    if (typeof makeMate !== 'function') return;
    const fresh = !mateCombos, pool = fresh ? combos().slice(0, MAX_COMBO_TRIES) : mateCombos;
    const good = [], used = {};
    for (let pass = 0; pass < (fresh ? 2 : 1) && good.length < MATE_COUNT; pass++) {
      for (let i = 0; i < pool.length && good.length < MATE_COUNT; i++) {
        const c = pool[i];
        if (fresh && pass === 0 && used[c[1]]) continue;      // first pass: one mate per class
        if (fresh && pass === 1 && good.indexOf(c) >= 0) continue;
        if (tryMate(c, good.length)) { used[c[1]] = 1; good.push(c); }
      }
    }
    if (fresh && good.length) mateCombos = good;
  }
  // A brand-new throwaway META on the throwaway key. Never calls switchSlot.
  function freshBase(withTeam) {
    SAVE_KEY = TEST_KEY;
    localStorage.removeItem(TEST_KEY);          // an empty key gives a fresh META
    loadMeta();
    muteAll();
    if (!META) throw new Error('loadMeta() left META empty');
    if (withTeam) {
      const L = makeTester();
      if (!L) throw new Skip('no RACES/CLASSES/SPECS combination made a leader (makeLeader threw for all)');
      META.leader = L; META.board = null;
      if (!Array.isArray(META.roster)) META.roster = [];
      addMates();
    }
  }

  // ---- Case runner -------------------------------------------------------------------------------
  function closePanelSafe() { try { if (typeof closePanel === 'function') closePanel(); } catch (e) { errs.push('closePanel: ' + msgOf(e)); } }
  function teardownG() {
    if (typeof G === 'undefined' || !G) return;
    const ended = !!G.over;                      // the sim ended it itself (and may have opened a debrief)
    G.over = true; G = null;
    if (ended) closePanelSafe();
  }
  async function runCase(sweep, name, needs, fn) {
    if (abort) return;
    const gap = missing(needs);
    if (gap.length) { addRow(sweep, name, 'SKIPPED', 'missing: ' + gap.join(', '), 0); return; }
    muteAll();
    errs = []; phase = '';
    const t0 = now();
    let skip = null;
    try { await fn(); }
    catch (e) { if (e instanceof Skip) skip = e.message; else errs.push((phase ? phase + ': ' : '') + msgOf(e)); }
    try { teardownG(); } catch (e) { errs.push('teardown: ' + msgOf(e)); }
    const ms = now() - t0;
    await tick(); await tick(); await frameSettle();   // let unhandledrejection events arrive
    muteAll();
    if (skip) addRow(sweep, name, 'SKIPPED', skip, ms);
    else if (errs.length) addRow(sweep, name, 'FAIL', errs[0], ms);
    else addRow(sweep, name, 'PASS', '', ms);
  }

  async function simulate() {
    let i = 0;
    while (i < TICKS && G && !abort) {
      G.paused = false;                          // only for this synchronous batch: the real loop cannot interleave
      try {
        const end = Math.min(TICKS, i + YIELD_EVERY);
        for (; i < end; i++) {
          phase = 'update (tick ' + i + ')';
          update();
          if (!G || G.over) { i = TICKS; break; }
        }
      } finally { if (G) G.paused = true; }
      await tick();
    }
  }
  function drawSpot(k) {
    const f = DRAW_SPOTS[k % DRAW_SPOTS.length];
    if (!f) return null;
    try {
      const W = MAP.w * CELL, H = MAP.h * CELL;
      const mx = Math.max(200, (typeof VW === 'number' ? VW : 0) / 2), my = Math.max(150, (typeof VH === 'number' ? VH : 0) / 2);   // hidden pane: 0x0
      const x = Math.min(Math.max(f[0] * W, mx), Math.max(mx, W - mx)), y = Math.min(Math.max(f[1] * H, my), Math.max(my, H - my));
      return (isFinite(x) && isFinite(y)) ? [x, y] : null;
    } catch (e) { return null; }
  }
  async function drawFrames() {
    for (let k = 0; k < DRAW_FRAMES && G && !abort; k++) {
      const p = drawSpot(k);
      if (p && G.leader) { G.leader.x = p[0]; G.leader.y = p[1]; }
      if (typeof G.frame === 'number') G.frame++;
      phase = 'draw (frame ' + k + ')';
      draw();
      await tick();
    }
  }
  async function deploy(make) {
    phase = 'setup'; freshBase(true);
    phase = 'make contract'; const contract = make();
    const ids = META.roster.filter(function (p) { return !p.resting; }).slice(0, 5).map(function (p) { return p.id; });
    phase = 'startDeployment'; startDeployment(contract, ids);
    guardKey();
    if (!G) throw new Error('G is not set after startDeployment');
    G.paused = true;                             // the real requestAnimationFrame loop must not compete
    await tick();
    await simulate();
    await drawFrames();
  }

  // ---- Sweeps ------------------------------------------------------------------------------------
  async function sweepContracts() {
    muteAll();
    const gap = missing(DEPLOY.concat(['CONTRACT_KEYS', 'makeContract']));
    if (gap.length) { addRow('Contracts', 'all kinds', 'SKIPPED', 'missing: ' + gap.join(', '), 0); return; }
    const kinds = CONTRACT_KEYS.slice();
    for (let a = 0; a < kinds.length; a++) {
      for (let b = 0; b < CONTRACT_TIERS.length; b++) {
        const kind = kinds[a], tier = CONTRACT_TIERS[b];
        await runCase('Contracts', kind + ' tier ' + tier, [], function () { return deploy(function () { return makeContract(kind, tier); }); });
      }
    }
  }
  async function sweepRaids() {
    muteAll();
    const gap = missing(DEPLOY.concat(['HOST_KEYS', 'makeRaidContract']));
    if (gap.length) { addRow('Raids', 'all hosts', 'SKIPPED', 'missing: ' + gap.join(', '), 0); return; }
    const hosts = HOST_KEYS.slice();
    for (let a = 0; a < hosts.length; a++) {
      const host = hosts[a];
      await runCase('Raids', host + ' tier ' + RAID_TIER, [], function () {
        return deploy(function () { return makeRaidContract({ host: host, tier: RAID_TIER, faction: null }); });
      });
    }
  }
  function needStory() {
    if (SAVE_KEY !== TEST_KEY || !META || !META.cp) throw new Skip('no throwaway story slot (the newStory step did not complete)');
  }
  async function campFrames() {
    phase = 'renderTitle'; renderTitle(); uiTouched = true; muteAll();
    for (let i = 0; i < PROLOGUE_CAMP_FRAMES; i++) {
      phase = 'camp frame ' + (i + 1);
      CAMP.t = (CAMP.t || 0) + 1; updatePeople(); drawCamp();
      await tick();
    }
  }
  async function sweepPrologue() {
    muteAll();
    const S = 'Prologue (Quick)';
    await runCase(S, 'newStory on throwaway slot', ['newStory', 'freshMeta'].concat(BASE), async function () {
      phase = 'setup'; freshBase(false); uiTouched = true;
      phase = 'newStory'; newStory(); guardKey(); muteAll();   // newStory builds a new META: re-mute its settings
      closePanelSafe();
      if (!META || !META.cp) throw new Error('META.cp is missing after newStory()');
    });
    await runCase(S, 'Quick choice and leader', BASE, async function () {
      needStory();
      phase = 'quick choice'; META.cp.full = false; safeSave(); META.cp.part = 'create';
      phase = 'makeLeader'; const L = makeTester();
      if (!L) throw new Skip('no RACES/CLASSES/SPECS combination made a leader');
      META.leader = L; META.board = null; safeSave();
    });
    await runCase(S, 'renderTitle and camp frames', BASE.concat(['CAMP', 'renderTitle', 'updatePeople', 'drawCamp']), async function () {
      needStory(); await campFrames();
    });
    await runCase(S, 'startRoad and camp frames', BASE.concat(['CAMP', 'startRoad', 'renderTitle', 'updatePeople', 'drawCamp']), async function () {
      needStory();
      phase = 'startRoad'; startRoad(); guardKey(); uiTouched = true; muteAll();
      if (!META.cp || META.cp.part !== 'road') throw new Error("CP().part is not 'road' after startRoad()");
      await campFrames();
    });
    addRow(S, 'Quick card click (setChronicle, openCreate)', 'SKIPPED', 'setChronicle may change state outside the throwaway slot (not visible in the context); openCreate needs UI input', 0);
    addRow(S, 'Slot switching (openStory, leaveStory)', 'SKIPPED', 'they call switchSlot, which saves the current META and then loads the real story slot', 0);
    addRow(S, 'Full play-through (days, assaults, road nights)', 'SKIPPED', 'needs player choices; not automated', 0);
  }

  // ---- Restore -----------------------------------------------------------------------------------
  function restoreUi() {
    if (!uiTouched) return;
    try { if (typeof CAMP !== 'undefined' && CAMP) { CAMP.people = []; CAMP.dirty = true; CAMP.cpMap = null; } } catch (e) {}
    try { if (typeof MU !== 'undefined') MU = null; } catch (e) {}
    try { if (realMeta && typeof applySkin === 'function') applySkin(); } catch (e) {}
    try {
      if (realMeta && typeof renderTitle === 'function') renderTitle();
      else if (typeof showSplash === 'function') showSplash();
    } catch (e) {}
  }
  function restoreAll() {
    const steps = [
      removeGuards,
      function () { G = null; },
      function () { SAVE_KEY = realKey; },
      function () { META = realMeta; },
      function () { if (hadMap) MAP = realMap; },
      function () { localStorage.removeItem(TEST_KEY); },
      restoreUi
    ];
    steps.forEach(function (s) { try { s(); } catch (e) {} });
  }
  // Compare all of localStorage with the snapshot taken before the run; put any other key back.
  function checkStorage(before) {
    const t0 = now();
    if (!before) { addRow('Safety', 'real save unchanged', 'SKIPPED', 'localStorage not readable', 0); return; }
    const after = snapshot(), touched = [];
    const keys = new Set(Array.from(before.keys()).concat(Array.from(after.keys())));
    keys.forEach(function (k) { if (k !== TEST_KEY && before.get(k) !== after.get(k)) touched.push(k); });
    const realChanged = touched.indexOf(realKey) >= 0;
    /* A real save that changed to another well-formed save was most likely written by a second page
       (Patrick playing, another test tab). Writing the start-of-run copy back would undo that play, so
       it is left alone; the old copy is kept in sessionStorage in case the run itself was at fault. */
    const isSave = function (k) { return k === realKey || /^dust_cloaks_(v\d+|story\d*)$/.test(k); };   // not the tab lock, which ticks
    const wellFormed = function (v) { try { const o = JSON.parse(v); return !!o && typeof o === 'object'; } catch (e) { return false; } };
    const kept = [];
    touched.forEach(function (k) {
      try {
        if (isSave(k) && before.has(k) && after.has(k) && wellFormed(after.get(k))) {
          kept.push(k);
          try { sessionStorage.setItem('selftest_backup_' + k, before.get(k)); } catch (e) {}
          return;
        }
        if (before.has(k)) localStorage.setItem(k, before.get(k)); else localStorage.removeItem(k);
      } catch (e) {}
    });
    const leftover = localStorage.getItem(TEST_KEY) !== null;
    if (leftover) { try { localStorage.removeItem(TEST_KEY); } catch (e) {} }
    let status = 'PASS', msg = '';
    if (kept.length) { status = 'FAIL'; msg = 'a real save changed during the run, most likely from another page; left as it is now (start-of-run copy in sessionStorage selftest_backup_*): ' + kept.join(', '); }
    else if (realChanged) { status = 'FAIL'; msg = 'real save key changed during the run (put back): ' + realKey; }
    else if (leftover) { status = 'FAIL'; msg = 'throwaway key was left behind (removed now)'; }
    else if (touched.length) msg = 'other keys changed and were put back: ' + touched.join(', ');
    addRow('Safety', 'real save unchanged, throwaway key removed', status, msg, now() - t0);
  }

  // ---- Run ---------------------------------------------------------------------------------------
  async function run() {
    if (running) return results;
    running = true; abort = false; results.length = 0; uiTouched = false;
    buildUI();
    while (ui && ui.tbody.firstChild) ui.tbody.removeChild(ui.tbody.firstChild);
    if (ui) ui.runBtn.disabled = true;
    startMute();
    let before = null, swapped = false;
    try {
      const gap = missing(['G', 'META', 'SAVE_KEY', 'loadMeta', 'saveMeta']);
      if (gap.length) { addRow('Setup', 'game globals', 'SKIPPED', 'missing: ' + gap.join(', '), 0); }
      else if (G) { setStatus('Finish or leave your game first. Nothing was run.'); return results; }
      else {
        setStatus('Running...');
        try { before = snapshot(); } catch (e) { before = null; }
        realKey = SAVE_KEY; realMeta = META;
        hadMap = missing(['MAP']).length === 0; realMap = hadMap ? MAP : null;
        installGuards(); swapped = true;
        await sweepContracts();
        if (!abort) await sweepRaids();
        if (!abort) await sweepPrologue();
      }
    } catch (e) {
      addRow('Setup', 'runner', 'FAIL', msgOf(e), 0);
    } finally {
      if (swapped) { restoreAll(); try { checkStorage(before); } catch (e) { addRow('Safety', 'real save unchanged', 'FAIL', msgOf(e), 0); } }
      stopMute();
      running = false;
      if (ui) { ui.runBtn.disabled = false; }
      if (results.length) {
        setStatus((abort ? 'Stopped. ' : 'Done. ') + summary());
        try { console.table(results.map(function (r) { return { sweep: r.sweep, case: r.case, result: r.result, error: r.error, ms: r.ms }; })); } catch (e) {}
      }
    }
    return results;
  }

  window.SELFTEST = { run: run, results: results, get running() { return running; } };   /* REG reads `running` to wait for the sweeps */

  // ---- Start once the game has loaded ------------------------------------------------------------
  function boot() {
    buildUI();
    const t0 = now();
    const poll = function () {
      if (!ui) { stopMute(); return; }            // closed before it started
      let ready = false;
      try { ready = missing(['loadMeta', 'startDeployment', 'makeLeader']).length === 0 && typeof META !== 'undefined' && META !== null; } catch (e) {}
      if (ready || now() - t0 > READY_TIMEOUT_MS) run(); else setTimeout(poll, 100);
    };
    poll();
  }
  startMute();                                     // silent from the moment the script loads
  if (document.readyState === 'complete') setTimeout(boot, 0);
  else window.addEventListener('load', function () { setTimeout(boot, 0); });
})();
