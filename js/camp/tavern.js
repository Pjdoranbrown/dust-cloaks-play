/* ===== INDEX 91 - T-01 the living tavern: interior hub (js/camp/tavern.js) ==========
   Clicking the Camp Tavern now enters an interior view instead of the menu.
   Spots: Rank'n table, bar fight (pick one helper), Crepitus table, the bar (the
   old menu), and the door. No new save keys. Falls back safely if CREPITUS,
   TAVERN_LINES or the new sounds are missing.
   ROLLBACK: delete this file and its <script> tag in index.html.
============================================================================ */
(function(){
  'use strict';
  const T = window.TAVERN = window.TAVERN || {};
  const $$ = id => document.getElementById(id);
  const lines = k => { const L = (window.TAVERN_LINES || {})[k]; return L && L.length ? L : null; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const say = (k, name, fb) => { const L = lines(k); return (L ? pick(L) : fb || '').replace(/\{name\}/g, name || 'friend'); };
  const sfx = n => { try { if (typeof SFX !== 'undefined' && SFX.play) SFX.play(n); } catch (e) {} };
  const sfxStop = n => { try { if (typeof SFX !== 'undefined' && typeof SFX.stop === 'function') SFX.stop(n); } catch (e) {} };
  const quiet = () => { sfxStop('tavern'); sfxStop('snore'); };
  const fit = () => (typeof META !== 'undefined' && META.roster) ? META.roster.filter(p => !(p.resting > 0)) : [];
  const patron = i => ({id:-1 - i, name:['Old Hob', 'Maud the Drover', 'Tall Pell', 'One-Ear Jory', 'Sister Wren', 'Gaffer Dunn'][i % 6], npc:true});

  const css = document.createElement('style');
  css.textContent = `
  #tavern-hub{ position:fixed; inset:0; z-index:60; background:var(--wood-night) radial-gradient(ellipse at 50% 30%, #4a2c14 0%, var(--wood-night) 80%); color:var(--bone); font-family:Georgia,serif; overflow:auto; padding:18px 14px 30px; box-sizing:border-box }
  #tavern-hub.hidden{ display:none }
  #tavern-hub h1{ margin:0 0 2px; font-size:30px; text-align:center; color:#f0d890; text-shadow:0 2px 0 #2a1406 }
  #tavern-hub .tsub{ text-align:center; color:#d8c8a0; font-size:14px; margin-bottom:12px; min-height:18px }
  #tavern-hub .tfloor{ max-width:980px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:14px; background:repeating-linear-gradient(90deg,#5a3a1c 0 38px,#4e3017 38px 40px); border:4px solid #2a1406; border-radius:6px; padding:14px; box-shadow:inset 0 0 60px rgba(0,0,0,.6) }
  #tavern-hub .spot{ background:rgba(20,10,4,.72); border:2px solid #8a6a3a; border-radius:6px; padding:10px; cursor:pointer; transition:transform .1s, border-color .1s }
  #tavern-hub .spot:hover{ transform:translateY(-2px); border-color:var(--gold-bright) }
  #tavern-hub .spot h2{ margin:0 0 4px; font-size:17px; color:var(--gold-bright) }
  #tavern-hub .spot p{ margin:4px 0 0; font-size:14px; color:#d8c8a0 }
  #tavern-hub .seats{ display:flex; gap:6px; margin:6px 0; flex-wrap:wrap }
  #tavern-hub .seat{ text-align:center; font-size:14px; min-width:62px; max-width:96px; overflow-wrap:anywhere }
  #tavern-hub .seat img{ width:56px; height:56px; object-fit:cover; border:2px solid var(--ink-soft); background:#2a1a0c; display:block; margin:0 auto 2px }
  #tavern-hub .seat .npc{ width:56px; height:56px; border:2px solid var(--ink-soft); background:#2a1a0c; margin:0 auto 2px; line-height:56px; font-size:26px }
  #tavern-hub .talk{ font-style:italic; color:#e8d8b0; font-size:14px; min-height:16px; margin-top:4px }
  #tavern-hub .tbtn{ background:#8a6414; color:#fff4d0; border:2px solid #2a1406; border-radius:4px; padding:6px 12px; font:bold 14px Georgia,serif; cursor:pointer; margin:3px 3px 0 0 }
  #tavern-hub .tbtn:hover{ background:#a87a1c }
  #tavern-hub .tbtn.dim{ background:var(--ink-soft); color:var(--dust) }
  #tavern-hub .bard{ position:fixed; right:18px; bottom:14px; text-align:center; font-size:14px; color:#d8c8a0; pointer-events:none }
  #tavern-hub .bard canvas{ image-rendering:pixelated; width:112px; display:block; margin:0 auto; transform-origin:50% 100%; animation:tbsway 3.2s ease-in-out infinite }
  @keyframes tbsway{ 0%,100%{ transform:rotate(-3deg) } 50%{ transform:rotate(3deg) translateY(-2px) } }
  #tavern-hub .door{ text-align:center; margin-top:14px }
  `;
  document.head.appendChild(css);

  const root = document.createElement('div'); root.id = 'tavern-hub'; root.className = 'hidden'; document.body.appendChild(root);
  let sub = '', mode = 'hub';
  T.stake = 'low';
  const STK = [['low', 'Penny', 0], ['table', 'Soldier\u2019s', 300], ['high', 'High', 1500]];
  const tre = () => (typeof META !== 'undefined' && META) ? META.treasury : 0;

  // the Camp Bard stands in a corner of the hub, swaying while the camp music plays on (the hub never stops the music)
  const bardHTML = () => (typeof META !== 'undefined' && META && META.bard) ? `<div class="bard"><canvas id="tavern-bard" width="30" height="28"></canvas>${esc(META.bard.name)}</div>` : '';
  const paintBard = () => { try {
    const c = $$('tavern-bard'); if (!c || typeof bardSprite !== 'function') return;
    const spr = bardSprite(META.bard), f = spr && spr.frames && spr.frames.length ? spr.frames[(Date.now() / 700 | 0) % spr.frames.length] : null;
    if (!f){ if (!c.closest('.bs')){ const g = c.getContext('2d'); if (Object.prototype.hasOwnProperty.call(g, 'drawImage')){ g.clearRect(0, 0, c.width, c.height); g.drawImage(null, 0, 0); } } return; }
    c.width = f.width; c.height = f.height; c.getContext('2d').drawImage(f, 0, 0); } catch (e) {} };
  setInterval(() => { if (!root.classList.contains('hidden')) paintBard(); }, 700);

  T.seats = function(){
    const m = fit(), out = {rankn:m.slice(0, 3), crep:[]};
    const rest = m.slice(3);
    for (let i = 0; i < 3; i++) out.crep.push(rest[i] || patron(i));
    return out;
  };
  const seatHTML = p => p.npc && !p.race ? `<div class="seat"><div class="npc">\u{1F9D4}</div>${esc(p.name)}</div>`
    : `<div class="seat"><img src="${portraitURL(p, false)}" alt="">${esc(p.name)}</div>`;

  function render(){
    if (!root || typeof META === 'undefined' || !META.leader) return;
    const s = T.seats(), mates = fit(), done = typeof legworkDone === 'function' && legworkDone();
    let h = `<h1>${esc(typeof HS === 'function' && HS().name ? 'The Camp Tavern' : 'The Camp Tavern')}</h1><div class="tsub">${esc(sub)}</div><div class="tfloor">`;
    if (mode === 'brawl'){
      h = `<h1>Start a fight</h1><div class="tsub">Choose one helper. Everyone else gets to watch, and then to join in. Fists only.</div><div class="tfloor">` +
        mates.map(p => `<div class="spot" onclick="TAVERN.fight(${p.id})"><div class="seats">${seatHTML(p)}</div><h2>${esc(p.name)}</h2><p>${SPECS[p.spec].name} · Melee ${mateStats(p).melee}</p></div>`).join('') +
        `</div><div class="door"><button class="tbtn dim" onclick="TAVERN.back()">Not tonight</button></div>`;
      root.innerHTML = h; return;
    }
    if (mode === 'rankn'){
      h = `<h1>The Rank’n table</h1><div class="tsub">Who will you sit down with?</div><div class="tfloor">` +
        (mates.length ? mates.map(p => `<div class="spot" onclick="TAVERN.sit(${p.id})"><div class="seats">${seatHTML(p)}</div><h2>${esc(p.name)}</h2><p>${esc(say('rankInvite', p.name, 'Fancy a game?'))}</p></div>`).join('') : '<div class="spot"><p>Nobody in camp to play.</p></div>') +
        `</div><div class="door"><button class="tbtn dim" onclick="TAVERN.back()">Back</button></div>`;
      root.innerHTML = h; return;
    }
    h += `<div class="spot" onclick="TAVERN.go('rankn')"><h2>♞ The Rank’n table</h2><div class="seats">${s.rankn.map(seatHTML).join('') || '<p>Empty tonight.</p>'}</div><div class="talk">${esc(s.rankn.length ? say('rankInvite', s.rankn[0].name, 'Fancy a game?') : '')}</div><p>Sit down and challenge a Squad Mate for real gold.</p></div>`;
    h += `<div class="spot" onclick="TAVERN.crepitus()"><h2>⚅ The Crepitus table</h2><div class="seats">${s.crep.map(seatHTML).join('')}<div class="seat"><div class="npc">★</div>You</div></div><div class="talk">${esc(say('crepChat', s.crep[0].name, ''))}</div><p>Dice, bounties and bluffing. Four players; the Shifted d6.</p><div onclick="event.stopPropagation()">${STK.map(([k, n, g]) => tre() >= g ? `<button class="tbtn${T.stake === k ? '' : ' dim'}" onclick="TAVERN.setStake('${k}')">${n}</button>` : `<button class="tbtn dim" disabled title="Needs ${g}gp in the Treasury">${n} (${g}gp)</button>`).join('')}</div></div>`;
    h += `<div class="spot" onclick="TAVERN.go('brawl')"><h2>⚔ Start a bar fight</h2><p>${done ? 'You have already been into town this downtime.' : mates.length ? 'Pick a helper. The crowd forms a ring and cheers; your other mates may step out of it to fight you.' : 'Nobody is fit to go with the Leader.'}</p><div class="talk">${esc(say('heckle', '', ''))}</div></div>`;
    h += `<div class="spot" onclick="TAVERN.bar()"><h2>\u{1F37A} The bar</h2><p>The barkeep, the Hiring Line perks, Scoundrel training and research, and everything else the tavern does.</p></div>`;
    h += `</div><div class="door"><button class="tbtn" onclick="TAVERN.leave()">← Back to camp</button></div>`;
    root.innerHTML = h + bardHTML();
    paintBard();
  }

  T.open = () => !root.classList.contains('hidden');
  T.enter = function(){
    if (!META || !META.leader) return;
    mode = 'hub'; sub = 'Lamplight, woodsmoke and the clink of cups.';
    const cp = $$('camp-panel'); if (cp) cp.classList.add('hidden'); if (CAMP) CAMP.panel = null;
    render(); root.classList.remove('hidden'); sfx('pick'); sfx('tavernCrowd');
  };
  T.leave = function(){ root.classList.add('hidden'); quiet(); sfx('pick'); };
  T.go = m => { mode = m; render(); sfx('pick'); };
  T.back = () => { mode = 'hub'; render(); };
  T.sit = function(id){ root.classList.add('hidden'); quiet(); T.fromHub = true; rkNew(id, (RK_PICK && RK_PICK.stake) || 'table'); if (typeof RK !== 'undefined' && !RK) { T.fromHub = false; T.enter(); } };
  T.fight = function(id){
    if (typeof legworkDone === 'function' && legworkDone()){ mode = 'hub'; sub = 'You have already been into town this downtime.'; render(); return; }
    root.classList.add('hidden'); quiet(); startBrawl(id);
  };
  T.setStake = k => { const g = (STK.find(x => x[0] === k) || [0, 0, 1e9])[2]; if (tre() >= g) T.stake = k; render(); };
  T.crepitus = function(){
    const C = window.CREPITUS;
    if (C && typeof C.open === 'function'){ root.classList.add('hidden'); quiet(); const g = (STK.find(x => x[0] === T.stake) || [0, 0, 0])[2]; if (tre() < g) T.stake = 'low'; C.open(T.seats().crep, {stake:T.stake, onClose:T.returnFromGame}); }
    else { sub = 'Table coming soon: the dice are still being counted.'; render(); }
  };
  T.bar = function(){ root.classList.add('hidden'); quiet(); T.bypass = true; try { openPanel('building', 'tavern'); } finally { T.bypass = false; } };
  // Crepitus calls this when it closes
  // QA-6: a game that hid the camp chrome (hideAll) gives it back without a full renderTitle redraw (no flash, camera stays)
  T.restoreChrome = function(){
    for (const id of ['topbar', 'camp-hint']){ const e = $$(id); if (e) e.classList.remove('hidden'); }
    try { renderTopbar(); } catch (e) {}
  };
  T.returnFromGame = function(){ T.restoreChrome(); T.enter(); };

  // hook: clicking the tavern building enters the interior
  { const f = openPanel;
    openPanel = function(kind, id){
      if (kind === 'building' && id === 'tavern' && !T.bypass && typeof has === 'function' && has('tavern') && !(typeof inStory === 'function' && inStory())) return T.enter();
      return f.apply(this, arguments);
    }; }
  // hook: Rank'n returns to the tavern when it was started from here
  { const f = rkClose;
    rkClose = function(){
      if (T.fromHub && typeof META !== 'undefined' && META.leader && !G){   // QA-6: back to the tavern without the renderTitle camp redraw
        T.fromHub = false; const el = $$('screen-rankn'); if (el) el.classList.add('hidden'); RK = null;
        T.restoreChrome(); T.enter(); return;
      }
      f.apply(this, arguments); if (T.fromHub){ T.fromHub = false; T.enter(); } }; }

  /* ---------- bar fight rework: crowd ring, squad-mate mini bosses, KO bodies ----------
     Uses normal Pit Fighter stats for mini bosses until the Systems Designer lists T-01 numbers
     in audits/balance-r2.md. Spectators are drawn here (portrait heads on simple bodies). */
  const NPC_NAMES = ['Old Hob', 'Maud', 'Tall Pell', 'Jory', 'Sister Wren', 'Gaffer Dunn', 'Bram', 'Little Ket', 'Fenn', 'Ash'];
  const NPC_COL = ['#7a4a3a', '#4a5a7a', '#6a6a3a', '#5a3a6a', '#3a6a5a', '#8a6a3a'];
  const imgs = {};
  const head = p => { if (!p) return null; const k = p.id; if (!imgs[k]){ const i = new Image(); try { i.src = portraitURL(p, false); } catch (e) {} imgs[k] = i; } return imgs[k]; };
  const rn = (a, b) => a + Math.random() * (b - a);

  function initRing(){
    const B = G.brawl, inFight = new Set(G.squad.map(m => m.p.id));
    const mates = fit().filter(p => !inFight.has(p.id));
    const total = Math.max(10, mates.length + 5), cx = 13 * CELL, cy = 9.5 * CELL, rx = 10.2 * CELL, ry = 6.2 * CELL;
    const pts = [];
    for (let i = 0; i < total * 2 && pts.length < total; i++){
      const a = (i / (total * 2)) * Math.PI * 2 + 0.2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (MAP.doors.some(d => Math.hypot(d.x - x, d.y - y) < 2.2 * CELL) || Math.hypot(22.5 * CELL - x, 15.3 * CELL - y) < 3.2 * CELL) continue;   // keep the bard's stage clear
      pts.push({x, y});
    }
    pts.sort(() => Math.random() - 0.5);
    B.ring = pts.map((pt, i) => {
      const m = mates[i] || null;
      return {mate:m, name:m ? m.name : NPC_NAMES[i % NPC_NAMES.length], x:pt.x, y:pt.y, hx:pt.x, hy:pt.y, st:'ring', talk:'', talkT:0, col:m ? '#3a5a3a' : NPC_COL[i % NPC_COL.length], ph:Math.random() * 6};
    });
    B.mbT = 900; B.chT = 60;
  }
  { const f = setupBrawl; setupBrawl = function(c){ dropMates(); f(c); try { initRing(); } catch (e) { console.warn('tavern ring', e); } }; }
  { const f = updateBrawl; updateBrawl = function(){
      f();
      const B = G.brawl; if (!B || !B.ring) return;
      for (const r of B.ring) if (r.talkT > 0) r.talkT--;
      if (--B.chT <= 0){
        B.chT = 70 + Math.random() * 90;
        const on = B.ring.filter(r => r.st === 'ring' && r.talkT <= 0);
        if (on.length){ const r = on[Math.random() * on.length | 0]; const jeer = Math.random() >= 0.7; r.talk = say(jeer ? 'heckle' : 'cheer', r.name, 'Go on!'); r.talkT = 170; if (jeer && Math.random() < 0.5) sfx('tavernJeer'); }
      }
      // Patrick-approved rule (T-01): first at wave 2; one at a time, one per wave; each mate once per fight;
      // steps out when half the wave's regulars are down, or 45 s into the wave
      if (B.mbWave !== B.wave){ B.mbWave = B.wave; B.mbTicks = 0; B.mbRegs = Math.max(1, G.enemies.filter(e => !e.dead && !e.ring).length); B.mbDone = false; }
      B.mbTicks++;
      const out = G.enemies.some(e => !e.dead && e.ring);
      if (B.wave >= 2 && !out && !B.mbDone){
        const alive = G.enemies.filter(e => !e.dead && !e.ring).length;
        if (alive * 2 <= B.mbRegs || B.mbTicks >= 2700){
          const cand = B.ring.filter(r => r.st === 'ring' && r.mate && !r.used);
          if (cand.length){
            const r = cand[Math.random() * cand.length | 0], p = r.mate, key = 'mate' + p.id, ms = mateStats(p);
            BESTIARY[key] = {name:p.name, arch:'brute', tier:1, con:Math.min(10, 2 * ms.con), ac:3, shift:0, dmg:2, skill:Math.min(3, ms.melee), speed:0.85, r:11, colour:'#3a5a3a', xp:0, coin:0, sc:2.1, person:p};   // person: the foe card shows their own painted face (S6-C note 10)
            try { ENEMY_LOOK[key] = Object.assign({}, personLook(p, false), {weapon:'fist'}); } catch (e) { ENEMY_LOOK[key] = ENEMY_LOOK.bruiser; }
            const e = spawnEnemy(key, r.x, r.y, {noNem:true});
            if (e){ r.st = 'out'; r.used = true; e.ring = r; e.name = r.name; e.seen = true; B.mbDone = true;
              note(`${r.name} steps out of the crowd to fight you.`); pop(r.x, r.y - 50, r.name.toUpperCase() + ' JOINS IN', '#ffd860'); sfx('horn'); }
          }
        }
      }
    }; }
  { const f = killEnemy; killEnemy = function(e){
      const was = e.dead; f(e);
      if (typeof isBrawl === 'function' && isBrawl() && !was && e.dead && e.ring){
        const r = e.ring; r.st = 'ko'; r.x = e.x; r.y = e.y; r.talk = say('ko', r.name, 'Out cold.'); r.talkT = 200;
        if (G.brawl) G.brawl.gold += 10; pop(e.x, e.y - 30, r.name.toUpperCase() + ' IS OUT COLD (+10GP)', '#ffd860'); sfx('koThud'); sfx('snore');
      }
    }; }
  const dropMates = () => { for (const k of Object.keys(BESTIARY)) if (/^mate\d+$/.test(k)){ Reflect.deleteProperty(BESTIARY, k); Reflect.deleteProperty(ENEMY_LOOK, k); } };   // only when no fight is on screen
  { const f = brawlEnd; brawlEnd = function(){ quiet(); return f.apply(this, arguments); }; }
  { const f = renderTitle; renderTitle = function(){ if (!G) dropMates(); return f.apply(this, arguments); }; }
  { const f = brawlBodies; brawlBodies = function(bodies, onScreen){
      f(bodies, onScreen);
      const B = G.brawl; if (!B || !B.ring) return;
      for (const r of B.ring){
        if (r.st === 'out') continue;
        bodies.push({y:r.y, custom:() => {
          const t = G.frame, ko = r.st === 'ko', img = r.mate ? head(r.mate) : null;
          const x = r.x, y = r.y;
          ctx.save();
          if (ko){
            shadow(x, y + 4, 22);
            ctx.fillStyle = r.col; ctx.fillRect(x - 6, y - 6, 26, 12);       // lying body
            ctx.fillStyle = '#e0b890'; ctx.beginPath(); ctx.arc(x - 12, y, 9, 0, TAU); ctx.fill();
            if (img && img.complete && img.naturalWidth){ ctx.save(); ctx.beginPath(); ctx.arc(x - 12, y, 9, 0, TAU); ctx.clip(); ctx.drawImage(img, x - 21, y - 9, 18, 18); ctx.restore(); }
            ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8f0ff';
            for (let i = 0; i < 3; i++){ const ph = ((t / 40 + i / 3) % 1); ctx.globalAlpha = 1 - ph; ctx.font = 'bold ' + (10 + i * 3) + 'px Georgia'; ctx.fillText('z', x - 4 + i * 8 + ph * 6, y - 14 - ph * 26); }
            ctx.globalAlpha = 1;
          } else {
            const bob = Math.sin(t / 7 + r.ph) * (r.talkT > 0 ? 3 : 1);
            shadow(x, y + 16, 12);
            ctx.fillStyle = r.col; ctx.fillRect(x - 8, y - 8 + bob, 16, 24);
            ctx.fillStyle = '#e0b890'; ctx.beginPath(); ctx.arc(x, y - 16 + bob, 10, 0, TAU); ctx.fill();
            if (img && img.complete && img.naturalWidth){ ctx.save(); ctx.beginPath(); ctx.arc(x, y - 16 + bob, 10, 0, TAU); ctx.clip(); ctx.drawImage(img, x - 10, y - 26 + bob, 20, 20); ctx.restore(); }
            if (r.talkT > 0){ const tp = window.canvasPx106 ? canvasPx106(ctx, 11) : 14, bh = Math.round(tp + 7);   // Q106: 14 px on screen, no squeezed text
              ctx.font = tp.toFixed(1) + 'px Georgia'; ctx.textAlign = 'center'; const w = Math.round(ctx.measureText(r.talk).width + 12);
              ctx.fillStyle = 'rgba(255,248,224,.95)'; ctx.fillRect(x - w / 2, y - 40 - bh + bob, w, bh); ctx.strokeStyle = '#4a3b2a'; ctx.strokeRect(x - w / 2, y - 40 - bh + bob, w, bh);
              ctx.fillStyle = '#2a1a0c'; ctx.fillText(r.talk, x, y - 45 + bob); }
          }
          ctx.restore();
        }});
      }
    }; }
})();
