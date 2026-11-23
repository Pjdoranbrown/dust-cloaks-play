/* ============================================================================
   CALIB1: the opt-in calibration logger (BAL-BOT step 2, audits/bal-bot-scope.md).
   Off by default. One Settings tick box ("Log my contracts for calibration") turns it on; then every
   finished contract adds one row at endDeployment. A "Copy rows (CSV)" button copies them all.
   Rows live in their own localStorage key (CALIB.KEY), never in the save, so the logger cannot touch a
   campaign. Sim runs (SAVE_KEY 'sim_bot'), drills and bar brawls are skipped.
   Fields: date, type, tier, host, result, seconds, Leader wounds at end, mates lost, gold earned,
   squad size, armour, Leader level, allied squad on/off.
   ROLLBACK: CALIB.off = true (logger and Settings rows vanish), or remove the script tag.
   Self-test: CALIB.selfTest() (registered in REG).
============================================================================ */
(function(){
  const C = window.CALIB = window.CALIB || {};
  C.KEY = 'dust_cloaks_calib'; C.off = false; C.MAX = 2000;
  C.HEAD = ['date', 'type', 'tier', 'host', 'result', 'seconds', 'leader_wounds', 'mates_lost', 'gold_earned', 'squad_size', 'armour', 'leader_level', 'allied_squad'];
  const load = () => { try { const j = JSON.parse(localStorage.getItem(C.KEY) || '{}'); return {on: !!j.on, rows: Array.isArray(j.rows) ? j.rows : []}; } catch (e) { return {on: false, rows: []}; } };
  const save = s => { try { localStorage.setItem(C.KEY, JSON.stringify(s)); } catch (e) {} };
  C.isOn = () => !C.off && load().on;
  C.setOn = v => { const s = load(); s.on = !!v; save(s); };
  C.rows = () => load().rows;
  C.clear = () => { const s = load(); s.rows = []; save(s); };
  const cell = v => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  C.csv = rows => [C.HEAD.join(',')].concat((rows || C.rows()).map(r => C.HEAD.map(k => cell(r[k])).join(','))).join('\n');
  // one row from the field as endDeployment leaves it
  C.row = function(result, gold){
    const c = G.contract || {}, L = G.leader || {};
    return {date: new Date().toISOString().slice(0, 16).replace('T', ' '), type: G.obj || c.obj || '', tier: c.tier || 0, host: c.host || '',
      result: String(result || G.result || ''), seconds: Math.round(G.sec || 0), leader_wounds: L.wounds | 0,
      mates_lost: (G.squad || []).filter(m => m.state === 'dead').length, gold_earned: Math.round(gold || 0), squad_size: (G.squad || []).length,
      armour: (G.armour && (G.armour.name || G.armour.id)) || '', leader_level: (typeof META !== 'undefined' && META.leader && META.leader.level) || 1,
      allied_squad: (G.allies || []).some(u => u && u.units) ? 'on' : 'off'};
  };
  C.skip = () => C.off || (typeof SAVE_KEY !== 'undefined' && SAVE_KEY === 'sim_bot') || !G || !G.contract || G.obj === 'drill' || G.obj === 'brawl';
  C.log = function(result, gold){ if (C.skip() || !C.isOn()) return null; const s = load(), r = C.row(result, gold); s.rows.push(r); if (s.rows.length > C.MAX) s.rows.splice(0, s.rows.length - C.MAX); save(s); return r; };
  C.copy = function(){
    const t = C.csv(), n = C.rows().length;
    const done = () => { try { alert(n + ' calibration rows copied.'); } catch (e) {} };
    try { if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done, () => window.prompt('Copy these rows:', t)); return t; } } catch (e) {}
    window.prompt('Copy these rows:', t); return t;
  };

  if (typeof endDeployment === 'function'){ const f = endDeployment;
    endDeployment = function(result){
      if (C.off || !G || G.over) return f.apply(this, arguments);
      const t0 = (typeof META !== 'undefined' && META) ? (META.treasury || 0) : 0;
      const r = f.apply(this, arguments);
      try { C.log(result, ((typeof META !== 'undefined' && META) ? (META.treasury || 0) : 0) - t0); } catch (e) { console.error('CALIB1 log', e); }
      return r;
    };
  }
  if (typeof settingsHTML === 'function'){ const f = settingsHTML;
    settingsHTML = function(dark){
      const s = f(dark); if (C.off || !(window.DEV && DEV.on)) return s;   // K92: a dev item
      const on = C.isOn(), n = C.rows().length;
      const ctl = `<label title="Saves one line per finished contract on this computer, for balance tuning. Nothing is sent anywhere."><input type="checkbox" ${on ? 'checked' : ''} onchange="CALIB.setOn(this.checked)"> Log my contracts for calibration</label>`
        + `<button class="btn" style="margin:4px 0" onclick="CALIB.copy()" ${n ? '' : 'disabled'}>Copy rows (CSV): ${n}</button>`;
      const i = s.lastIndexOf('</div>');
      return i < 0 ? s + ctl : s.slice(0, i) + ctl + s.slice(i);
    };
  }

  C.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    const keep = localStorage.getItem(C.KEY), off = C.off;
    try {
      localStorage.removeItem(C.KEY);
      ok(C.isOn() === false, 'off by default');
      C.dev0 = !!(window.DEV && DEV.on); if (window.DEV) DEV.on = false;
      ok(!/Log my contracts|Copy rows/.test(settingsHTML(true)), 'K92: hidden without the dev flag');
      if (window.DEV) DEV.on = true;
      ok(/Log my contracts for calibration/.test(settingsHTML(true)), 'tick box in Settings (dev flag)');
      const g0 = G; G = {contract: {obj: 'hunt', tier: 1, host: 'bandit'}, obj: 'hunt', sec: 61.4, leader: {wounds: 3}, squad: [{state: 'up'}, {state: 'dead'}], armour: {name: 'Padded'}, allies: []};
      try {
        ok(C.log('victory', 50) === null, 'no row while off');
        C.setOn(true); const r = C.log('victory', 50) || {};
        const skipSim = typeof SAVE_KEY !== 'undefined' && SAVE_KEY === 'sim_bot';
        if (!skipSim){
          ok(r.type === 'hunt' && r.tier === 1 && r.seconds === 61 && r.mates_lost === 1 && r.gold_earned === 50 && r.squad_size === 2 && r.allied_squad === 'off', 'row fields');
          ok(C.rows().length === 1, 'one row stored');
          ok(C.csv().split('\n').length === 2 && C.csv().startsWith('date,type,tier'), 'CSV head and row');
        }
        G.obj = 'drill'; const n0 = C.rows().length; C.log('victory', 0); ok(C.rows().length === n0, 'drills skipped');
        C.off = true; ok(!/Log my contracts/.test(settingsHTML(true)), 'rollback hides the tick box');
      } finally { G = g0; C.off = off; }
    } catch (e) { fails.push('threw ' + e.message); }
    finally { if (keep === null) localStorage.removeItem(C.KEY); else localStorage.setItem(C.KEY, keep); if (window.DEV && 'dev0' in C) DEV.on = C.dev0; }
    return {ok: !fails.length, fails, n: 9};
  };
})();
