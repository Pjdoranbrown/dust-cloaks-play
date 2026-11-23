/* js/core/sound-settings-tips.js (INT-1 step 2, 2026-11-16): SOUND, SETTINGS, TIPS.
   Cut unchanged from the inline script in index.html (old lines 4303 to 4442). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   SOUND - every effect is synthesised with Web Audio. No files.
============================================================================ */
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null;
  const last = {};
  const GAP = {hit:45, coin:40, swing:60, bow:70, shoot:90, block:70, crit:60};
  function unlock(){
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.connect(ac.destination); setVol();
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch(e){ ac = null; }
  }
  function setVol(){ if (master) master.gain.value = (settings().volume / 100) * 0.5; }
  function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0){
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.3, freq = 1200, delay = 0, q = 0.8){
    const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    hit:    () => noise(0.06, 0.18, 900),
    crit:   () => { noise(0.08, 0.3, 1800); tone(880, 0.08, 'square', 0.08); },
    swing:  () => noise(0.09, 0.12, 2600, 0, 1.5),
    bow:    () => tone(520, 0.07, 'triangle', 0.12, 0.6),
    shoot:  () => tone(300, 0.08, 'triangle', 0.1, 0.5),
    coin:   () => { tone(1320, 0.05, 'square', 0.07); tone(1760, 0.08, 'square', 0.07, 1, 0.05); },
    chest:  () => { tone(523, 0.08, 'square', 0.1); tone(659, 0.08, 'square', 0.1, 1, 0.08); tone(784, 0.16, 'square', 0.1, 1, 0.16); },
    level:  () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'triangle', 0.15, 1, i * 0.07)); },
    pick:   () => tone(880, 0.1, 'triangle', 0.15),
    brace:  () => { noise(0.12, 0.25, 400); tone(160, 0.15, 'square', 0.1); },
    block:  () => tone(220, 0.06, 'square', 0.08, 0.8),
    hurt:   () => { tone(180, 0.18, 'sawtooth', 0.18, 0.5); noise(0.1, 0.2, 500); },
    down:   () => { tone(330, 0.25, 'sawtooth', 0.18, 0.4); tone(220, 0.35, 'sawtooth', 0.14, 0.4, 0.15); },
    stand:  () => { tone(392, 0.1, 'triangle', 0.15); tone(587, 0.18, 'triangle', 0.15, 1, 0.1); },
    blast:  () => { noise(0.45, 0.45, 200, 0, 0.5); tone(70, 0.4, 'sine', 0.4, 0.5); },
    boss:   () => { tone(110, 0.6, 'sawtooth', 0.2, 0.9); tone(116, 0.6, 'sawtooth', 0.2, 0.9); noise(0.5, 0.15, 150); },
    bossdie:() => { noise(0.8, 0.4, 120, 0, 0.4); [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.15, 0.9, i * 0.12)); },
    win:    () => { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, 1, i * 0.1)); },
    bash:   () => { noise(0.18, 0.4, 300); tone(90, 0.2, 'square', 0.2, 0.6); },
    horn:   () => { tone(220, 0.35, 'sawtooth', 0.15); tone(330, 0.35, 'sawtooth', 0.1, 1, 0.05); },
    knife:  () => { noise(0.05, 0.25, 4000, 0, 2); tone(1400, 0.06, 'triangle', 0.1, 0.5); },
    heal:   () => { [523, 784, 1046].forEach((f, i) => tone(f, 0.25, 'sine', 0.15, 1, i * 0.06)); },
    zap:    () => { noise(0.25, 0.35, 3000, 0, 0.6); tone(1800, 0.2, 'sawtooth', 0.12, 0.2); },
    hex:    () => { tone(300, 0.4, 'sine', 0.15, 0.5); tone(305, 0.4, 'sine', 0.15, 0.5); },
    nope:   () => tone(140, 0.08, 'square', 0.1)
  };
  function play(name){
    if (!ac || !SOUNDS[name] || settings().volume <= 0) return;
    const now = performance.now(); if (now - (last[name] || 0) < (GAP[name] || 30)) return;
    last[name] = now;
    try { SOUNDS[name](); } catch(e){}
  }
  window.addEventListener('pointerdown', unlock);
  return {play, unlock, setVol, _g:() => ({ac, master, noiseBuf})};   /* Index 87: lets js/audio/synth.js reach the context */
})();

/* ============================================================================
   SETTINGS - volume, screen shake, game speed, tips. Saved with the campaign.
============================================================================ */
function settings(){
  if (!META) return {volume:60, shake:true, speed:100, tips:true};
  const m = META.settings; if (m && m.volume !== undefined && m.shake !== undefined && m.speed !== undefined && m.tips !== undefined) return m;   // SW-10: called 400+ times a frame; no new object when the keys are all there
  META.settings = Object.assign({volume:60, shake:true, speed:100, tips:true}, META.settings || {});
  return META.settings;
}
const gameSpeed = () => settings().speed / 100;
function settingsHTML(dark){
  const s = settings(), col = dark ? '#ddd' : '#2a2520';
  const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label}</option>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:center;font-size:14px;color:${col};font-family:Georgia">
    <label>Volume <input type="range" min="0" max="100" value="${s.volume}" oninput="setSetting('volume', +this.value)"></label>
    <label><input type="checkbox" ${s.shake ? 'checked' : ''} onchange="setSetting('shake', this.checked)"> Screen shake</label>
    <label>Game speed <select onchange="setSetting('speed', +this.value)">${opt(100, s.speed, 'Normal')}${opt(85, s.speed, 'Steady (85%)')}${opt(70, s.speed, 'Slow (70%)')}</select></label>
    <label><input type="checkbox" ${s.tips ? 'checked' : ''} onchange="setSetting('tips', this.checked)"> Tips</label>
    <button class="btn small" style="font-size:14px;padding:4px 10px" onclick="resetTips()">Show tips again</button>
    <button class="btn small" style="font-size:14px;padding:4px 10px" onclick="exportSave()">Export save</button>
    <button class="btn small" style="font-size:14px;padding:4px 10px" onclick="importSave()">Import save</button>
  </div>`;
}
function setSetting(k, v){ settings()[k] = v; saveMeta(); if (k === 'volume'){ SFX.unlock(); SFX.setVol(); SFX.play('pick'); } }
// Save backup: the campaign lives in this browser's storage, so it can be
// lost when browser data is cleared. Export writes it to a file; Import reads one back.
function exportSave(){
  saveMeta();
  const L = META.leader, stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const blob = new Blob([JSON.stringify({game:'dust-cloaks', version:SAVE_KEY, saved:new Date().toISOString(), meta:META}, null, 1)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `DustCloaks_${(L ? L.name : 'Chapter').replace(/[^A-Za-z0-9]/g, '')}_${stamp}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  if (typeof campNote === 'function') campNote('Save file downloaded: look in your Downloads folder.', 'good');   // UX-83 note, folded in (INT-1 stage 3)
  SFX.play('pick');
}
function importSave(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try {
      const d = JSON.parse(rd.result), m = d.meta || d;
      if (!m || typeof m.treasury !== 'number' || !Array.isArray(m.roster)) throw new Error('not a Dust Cloaks save');
      askConfirm('Load this save?', `${m.leader ? esc(m.leader.name) + ', ' : ''}${m.treasury}gp, ${m.deployments || 0} contracts. Your current campaign will be replaced.`, () => {
      META = migrateMeta(m); saveMeta(); applySkin(); G = null; CAMP.dirty = true; if (typeof MU !== 'undefined') MU = null;
      if ($('tb-settings')) $('tb-settings').remove(); showSplash(); });
    } catch(e){ askAlert('Not a save', 'That file is not a Dust Cloaks save (' + esc(e.message) + ').'); } };
    rd.readAsText(f); };
  inp.click();
}
function resetTips(){ META.tipsSeen = {}; saveMeta(); SFX.play('pick');
  if (typeof campNote === 'function') campNote('Tips will show again, the first time each one matters.', 'good'); }   // UX-83 note, folded in (INT-1 stage 3)

/* ============================================================================
   TIPS - each one appears once, the first time it matters, across the
   whole campaign.
============================================================================ */
const TIPS = {
  move:      'WASD moves the Leader. The squad attacks on its own: your job is where it stands. The dashed ring is the Command Radius.',
  abilities: 'Each Specialty in the squad adds an ability to the bar at the bottom. Press its number key. Two of the same Specialty fire it twice.',
  ranged:    'Archers and casters keep their distance. Go after them, or form a Shield Wall while you close: SPACE, or click the stance badge bottom right.',   /* INDEX HD1 v7: points at the badge */
  hazard:    'A circle on the ground means artillery is coming. Get the squad out before it fills.',
  chest:     'Walk over a chest to open it: Poultices, Scrolls, Brews, War Chests and freed captives.',
  levelup:   'Momentum rank! Kills fill the bar at the top. Pick one of three with 1, 2 or 3 (the fight pauses while you choose), or TAB to save it.',
  charge:    'CHARGE: a straight run on open ground gives +1 step on the next melee attacks.',
  matedown:  'A Squad Mate is Bleeding Out. Stand on them to Stabilise, or a Cleric will lift them with Healing Word.',
  trap:      'A trap! Stand still with it inside your command ring and a Scoundrel disarms it. No Scoundrel? Walk round it. Hidden traps show as you get near.',
  leaderdown:'Your Leader is down. The nearest Squad Mate runs to help. R burns 2 Luck for good to stand now.'
};
function tip(id){
  if (!G || !settings().tips) return;
  META.tipsSeen = META.tipsSeen || {};
  if (META.tipsSeen[id]) return;
  META.tipsSeen[id] = true; saveMeta();
  G.tip = {text:TIPS[id], life:540, id};   /* S6 1i: the id, so a lesson that replaces this tip can drop its banner */
}


/* K92 (UX f48): Settings is for players. The dev items (calibration log, CSV rows, one-world preview) show only with the dev
   flag: add ?dev=1 to the address, or run DEV.set(true) in the console (kept in this browser). The camp Settings popover
   gains a CLOSE button (it closed only from the SETTINGS button before). */
window.DEV = window.DEV || {
  on: (() => { try { return /[?&]dev(=1|&|$)/.test(location.search) || localStorage.getItem('dc_dev') === '1'; } catch (e) { return false; } })(),
  set(v){ this.on = !!v; try { v ? localStorage.setItem('dc_dev', '1') : localStorage.removeItem('dc_dev'); } catch (e) {} }
};
window.addEventListener('load', () => {
  if (typeof toggleSettings !== 'function' || toggleSettings.__k92) return;
  const f = toggleSettings;
  toggleSettings = function(){
    const r = f.apply(this, arguments), d = document.getElementById('tb-settings');
    if (d && !d.querySelector('[data-k92]')){ const b = document.createElement('div'); b.style.cssText = 'text-align:center;margin-top:8px';
      b.innerHTML = '<button class="btn small" data-k92="close" onclick="toggleSettings()">CLOSE</button>'; d.appendChild(b); }
    return r;
  };
  toggleSettings.__k92 = true;
});
