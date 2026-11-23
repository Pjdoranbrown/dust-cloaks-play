/* js/camp/seasons.js (INT-1 step 2, 2026-11-16): INDEX 40 (the four seasons), 41 (the bard plays the bar fight).
   Cut unchanged from the inline script in index.html (old lines 16562 to 16943). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   INDEX 40 - THE FOUR SEASONS
   The calendar already runs one season to a contract (the top bar and the
   Chronicle say Spring, Summer, Autumn or Winter). Now the season is seen and
   felt on the field and in the camp.
     LOOK     the ground, the forest, the hills and the trees change colour; so
              does the water. Each season has its own weather: spring blossom, butterflies
              and swallows; summer dragonflies and sun-motes; autumn blown leaves;
              winter driving rain, puddles and, on the Barge, ice floes.
              All three holdings (the Fort, the Barge and the Warehouse) have
              their own seasonal weather. Settings can switch the weather off;
              the colours stay.
     FIELD    SPRING   opening a chest also restores 1 Wound to the Leader
              SUMMER   ground fires burn 25% longer (yours and theirs)
              AUTUMN   sleeping camps notice the squad from 10% nearer
              WINTER   puddles slow foot units 12% (mounted squads and Zuhri,
                       whose Storm-Born blood ignores mud and weather in the
                       manual, are not slowed); rain puts ground fires out 35%
                       faster
     Story mode: the road is Autumn and the siege is Summer.
   window.SEASON_FORCE = 'winter' (or another season) forces a season while
   testing. To roll back, delete from this comment to END INDEX 40 and undo the
   small patches marked "Index 40" elsewhere in the file.
============================================================================ */
const SEASONS_CFG = {
  spring: {name:'Spring', ground:'#586e3b', greens:['#4f6635', '#647c42', '#70884a', '#465b2f'], dust1:'#787250', dust2:'#867e58', forest:'#3f582c', fg:['#364d25', '#4b6834', '#54723a', '#2c3f1e'], water:'#2e6488', hill:'#768c48', tint:'rgba(230,255,210,0.03)'},
  summer: {name:'Summer', ground:'#687038', greens:['#5e6632', '#747c40', '#808846', '#525a2c'], dust1:'#887c50', dust2:'#968858', forest:'#46542a', fg:['#3c4824', '#526232', '#5c6c38', '#303a1c'], water:'#286480', hill:'#848c46', tint:'rgba(255,215,120,0.045)'},
  autumn: {name:'Autumn', ground:'#6a5e38', greens:['#5e5232', '#76663c', '#827042', '#4e442a'], dust1:'#7e6844', dust2:'#8c744c', forest:'#524428', fg:['#463820', '#624e2c', '#7a582e', '#382c1a'], water:'#2c5068', hill:'#827242', tint:'rgba(240,165,80,0.045)'},
  winter: {name:'Winter', ground:'#4a523c', greens:['#424a36', '#525a44', '#5a624c', '#38402e'], dust1:'#626052', dust2:'#6e6c5c', forest:'#364030', fg:['#2e3628', '#404a38', '#485240', '#242c20'], water:'#223e54', hill:'#5c644c', tint:'rgba(150,185,225,0.065)'}
};
function currentSeason(){
  if (window.SEASON_FORCE && SEASONS_CFG[window.SEASON_FORCE]) return window.SEASON_FORCE;
  try { if (inStoryNow() && CP()) return CP().part === 'road' ? 'autumn' : 'summer'; } catch (e) {}
  const s = String(seasonName()).toLowerCase();
  return s.startsWith('sum') ? 'summer' : s.startsWith('aut') ? 'autumn' : s.startsWith('win') ? 'winter' : 'spring';
}
const seasonOf = () => (G && G.season) || currentSeason();
const seasonWaterBase = () => SEASONS_CFG[currentSeason()].water;
const seasonFxOn = () => !window.SEASON_FX_OFF && settings().seasonFx !== false;

/* ---- the ground, the forest and the water ------------------------------------------------- */
groundPattern = function(){
  const s = currentSeason(), key = 'ground:' + s;
  if (SPR[key]) return SPR[key];
  const cfg = SEASONS_CFG[s], N = 96, c = newCanvas(N, N), P = painter(c.getContext('2d')), r = rng(1234 + hash(s));
  P(0, 0, N, N, cfg.ground);
  for (let i = 0; i < 2400; i++){ const x = r() * N | 0, y = r() * N | 0; P(x, y, 1, r() < .35 ? 2 : 1, cfg.greens[r() * 4 | 0]); }
  for (let k = 0; k < 6; k++){
    const cx = r() * N, cy = r() * N, rad = 4 + r() * 7;
    for (let y = -rad; y <= rad; y++) for (let x = -rad * 1.4; x <= rad * 1.4; x++) if ((x * x) / (rad * rad * 1.9) + (y * y) / (rad * rad) < 1 - r() * .25) P(((cx + x) % N + N) % N | 0, ((cy + y) % N + N) % N | 0, 1, 1, r() < .7 ? cfg.dust1 : cfg.dust2);
  }
  if (s === 'spring') for (let i = 0; i < 26; i++) P(r() * N | 0, r() * N | 0, 1, 1, ['#f4b8c8', '#ffe878', '#ffffff', '#b8d8ff'][r() * 4 | 0]);
  else if (s === 'summer') for (let i = 0; i < 18; i++) P(r() * N | 0, r() * N | 0, 1, 1, ['#e8d060', '#d8b850', '#c87050'][r() * 3 | 0]);
  else if (s === 'autumn') for (let i = 0; i < 34; i++) P(r() * N | 0, r() * N | 0, 2, 1, ['#c84a20', '#df8228', '#e6ae34', '#8a3618'][r() * 4 | 0]);
  else for (let i = 0; i < 28; i++) P(r() * N | 0, r() * N | 0, 2, 1, ['#7a8478', '#8e988c', '#5a645a'][r() * 3 | 0]);
  for (let i = 0; i < 18; i++) P(r() * N | 0, r() * N | 0, 1, 1, '#8a8a80');
  return SPR[key] = scaled(c, 3);
};
TILE.forest = v => {
  const s = currentSeason(), cfg = SEASONS_CFG[s];
  return tileSprite('forest:' + s + ':' + v, (P, r) => {
    P(0, 0, 20, 20, cfg.forest); for (let i = 0; i < 90; i++) P(r() * 20 | 0, r() * 20 | 0, 1, 1, cfg.fg[r() * 4 | 0]);
    if (s === 'autumn') for (let i = 0; i < 14; i++) P(r() * 19 | 0, r() * 19 | 0, 2, 1, ['#c84a20', '#df8228', '#d89c2a'][r() * 3 | 0]);
    if (s === 'winter') for (let i = 0; i < 10; i++) P(r() * 19 | 0, r() * 19 | 0, 2, 1, '#687268');
  });
};
TILE.hill = v => {
  const s = currentSeason(), base = SEASONS_CFG[s].hill;
  return tileSprite('hill:' + s + ':' + v, (P, r) => { P(0, 0, 20, 20, base); for (let i = 0; i < 60; i++) P(r() * 20 | 0, r() * 20 | 0, 1, 1, [shade(base, 1.08), shade(base, 0.92), shade(base, 1.16)][r() * 3 | 0]); });
};
TILE.hillEdge = () => { const s = currentSeason(), base = SEASONS_CFG[s].hill; return tileSprite('hilledge:' + s, P => { P(0, 16, 20, 4, shade(base, 0.62)); P(0, 15, 20, 1, shade(base, 0.74)); }); };
TILE.water = f => {
  const s = currentSeason(), base = SEASONS_CFG[s].water;
  return tileSprite('water:' + s + ':' + f, (P, r) => {
    P(0, 0, 20, 20, base); for (let i = 0; i < 6; i++){ const x = r() * 16 | 0, y = (i * 3 + f * 2) % 20; P(x, y, 4, 1, shade(base, 1.45)); }
    P(0, 0, 20, 1, shade(base, 0.78)); if (s === 'winter') for (let i = 0; i < 3; i++) P(r() * 16 | 0, r() * 18 | 0, 3, 1, '#b8cede');
  });
};

/* ---- puddles (winter) --------------------------------------------------------------------- */
function generatePuddles(M, c){
  if (!M) return; M.puddles = [];
  if (currentSeason() !== 'winter' || !M.g || (c && (c.obj === 'brawl' || c.obj === 'defend'))) return;
  const r = rng(((c && c.seed) || 7) + 404), count = Math.max(10, Math.min(70, Math.round((M.w * M.h) / 140)));
  for (let i = 0; i < count * 3 && M.puddles.length < count; i++){
    const cx = 3 + (r() * (M.w - 6) | 0), cy = 3 + (r() * (M.h - 6) | 0), t = M.g[cy * M.w + cx];
    if (t !== T.GRASS && t !== T.ROAD && t !== T.RUBBLE) continue;
    M.puddles.push({x:(cx + 0.2 + r() * 0.6) * CELL, y:(cy + 0.2 + r() * 0.6) * CELL, rx:16 + r() * 18, ry:9 + r() * 9, ang:(r() - 0.5) * 0.5, seed:r() * 100 | 0});
  }
}
function inPuddle(u){
  if (!MAP || !MAP.puddles || !MAP.puddles.length) return null;
  for (const p of MAP.puddles){ const dx = u.x - p.x, dy = u.y - p.y; if ((dx * dx) / (p.rx * p.rx) + (dy * dy) / (p.ry * p.ry) <= 1.05) return p; }
  return null;
}
function seasonSlow(u){        // foot units in a puddle move 12% slower; mounted squads and Zuhri do not
  if (!G || G.season !== 'winter' || G.mounted || !u) return 1;
  if (u.p && (u.p.race === 'ZUHRI' || u.p.race === 'DARK_ELF')) return 1;   /* Index 48 */
  return inPuddle(u) ? 0.88 : 1;
}
const seasonWakeK = () => (G && G.season === 'autumn') ? 0.9 : 1;
function drawPuddleList(list, cx, cy){
  if (!list || !list.length) return;
  const f = G ? G.frame : CAMP.t;
  for (const p of list){
    if (p.x < cx - 60 || p.x > cx + VW + 60 || p.y < cy - 40 || p.y > cy + VH + 40) continue;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0);
    ctx.fillStyle = 'rgba(28,48,68,0.52)'; ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(110,155,190,0.28)'; ctx.beginPath(); ctx.ellipse(-p.rx * 0.15, -p.ry * 0.18, p.rx * 0.72, p.ry * 0.62, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,100,125,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, TAU); ctx.stroke();
    const rt = ((f + p.seed * 7) % 50) / 50;
    ctx.strokeStyle = `rgba(190,220,245,${(1 - rt) * 0.55})`; ctx.beginPath(); ctx.ellipse((p.seed % 7 - 3) * 2, (p.seed % 5 - 2) * 1.2, p.rx * 0.45 * rt, p.ry * 0.45 * rt, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/* ---- the weather ------------------------------------------------------------------------------- */
const SEASON_FX = {season:null, mode:null, items:[], puddles:[]};
function syncSeasonParticles(mode, w, h){
  const s = currentSeason(), hk = mode === 'camp' ? holding() : 'combat';
  if (SEASON_FX.season === s && SEASON_FX.mode === hk && SEASON_FX.items.length) return;
  SEASON_FX.season = s; SEASON_FX.mode = hk; SEASON_FX.items = []; SEASON_FX.puddles = [];
  const r = rng(hash(s + ':' + hk));
  if (mode === 'camp' && s === 'winter'){
    if (hk === 'fort') for (let i = 0; i < 18; i++) SEASON_FX.puddles.push({x:220 + r() * 1320, y:240 + r() * 720, rx:18 + r() * 16, ry:9 + r() * 8, ang:(r() - .5) * 0.4, seed:i * 13});
    else if (hk === 'barge'){
      for (let i = 0; i < 9; i++) SEASON_FX.puddles.push({x:260 + r() * 1050, y:340 + r() * 600, rx:15 + r() * 12, ry:7 + r() * 6, ang:0, seed:i * 11});
      for (let i = 0; i < 6; i++) SEASON_FX.puddles.push({x:160 + r() * 1400, y:1120 + r() * 120, rx:20 + r() * 16, ry:8 + r() * 6, ang:0, seed:i * 19});
    } else if (hk === 'warehouse'){
      for (let i = 0; i < 6; i++) SEASON_FX.puddles.push({x:120 + r() * 1500, y:1155 + r() * 45, rx:18 + r() * 14, ry:7 + r() * 5, ang:0, seed:i * 17});
      for (const [px, py] of [[420, 460], [890, 520], [1180, 680], [640, 860]]) SEASON_FX.puddles.push({x:px, y:py, rx:16, ry:9, ang:0.1, seed:px, leak:true});
    }
  }
  const N = s === 'winter' ? 95 : s === 'autumn' ? 55 : s === 'spring' ? 36 : 42;
  for (let i = 0; i < N; i++) SEASON_FX.items.push({x:r() * w, y:r() * h, vx:(r() - 0.3) * 1.5, vy:(r() - 0.5) * 1.2, col:['#d45222', '#e08a28', '#eab834', '#9a3818'][i % 4], bcol:['#f4d048', '#7ab8f4', '#f49ac0', '#ffa858'][i % 4], kind:i % 5 === 0 ? 'bird' : 'main', phase:r() * TAU, groundT:r() < 0.35 ? (60 + r() * 180 | 0) : 0});
}
const seasonWrap = (p, cx, cy) => ({x:cx + (((p.x - cx) % VW + VW) % VW), y:cy + (((p.y - cy) % VH + VH) % VH)});
function drawSeasonOverlay(cx, cy, w, h, f, mode){
  const s = currentSeason(), hk = mode === 'camp' ? holding() : 'combat', cfg = SEASONS_CFG[s];
  if (seasonFxOn()){
    syncSeasonParticles(mode, w, h);
    if (mode === 'camp'){
      if (hk === 'fort' && s === 'winter' && !(window.VO2 && VO2.paintedCamp && VO2.paintedCamp())) drawPuddleList(SEASON_FX.puddles, cx, cy);   // SW-1: one puddle kind: the painted ground bakes its own, so the overlay set stays off there
      if (hk === 'barge'){
        if (s === 'winter'){
          for (let i = 0; i < 10; i++){ const ix = ((i * 210 + f * 0.35) % (CAMP_W + 100)) - 50, iy = i % 2 === 0 ? 70 + (i * 29) % 130 : 1072 + (i * 11) % 18; ctx.fillStyle = 'rgba(210,230,245,0.55)'; ctx.beginPath(); ctx.ellipse(ix, iy, 18 + (i % 3) * 6, 6 + (i % 2) * 3, 0.1, 0, TAU); ctx.fill(); }
          drawPuddleList(SEASON_FX.puddles, cx, cy);
        } else if (s === 'summer'){
          for (let i = 0; i < 16; i++){ const gx = (i * 137 + ((f / 20 | 0) * 23)) % CAMP_W, gy = (i % 2 ? 60 : 120) + (i * 17) % 90; ctx.fillStyle = `rgba(255,240,170,${0.25 + 0.2 * Math.sin(f / 8 + i)})`; ctx.fillRect(gx, gy, 8, 2); }
        }
      }
      if (hk === 'warehouse'){
        const beam = s === 'spring' ? 'rgba(235,255,215,.05)' : s === 'summer' ? 'rgba(255,210,120,.065)' : s === 'autumn' ? 'rgba(240,160,90,.055)' : 'rgba(150,190,235,.055)';
        for (let x = 140; x < 1680; x += 210){
          ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + 80, 150); ctx.lineTo(x + 240, 700); ctx.lineTo(x + 140, 700); ctx.closePath(); ctx.fill();
          if (s === 'winter'){ ctx.strokeStyle = 'rgba(185,215,245,0.45)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++){ const rx = x + 8 + ((k * 19 + f * 2) % 64), ry = 66 + ((k * 13 + f * 5) % 34); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 8); ctx.stroke(); } }
        }
        if (s === 'winter'){
          drawPuddleList(SEASON_FX.puddles, cx, cy);
          for (const p of SEASON_FX.puddles) if (p.leak){ const dt = (f + p.seed) % 60; if (dt < 20){ ctx.fillStyle = '#bfe0ff'; ctx.fillRect(p.x, p.y - (20 - dt) * 9, 2, 5); } }
          for (const q of CAMP.people){ const ph = (q.x | 0) * 7; if ((f + ph) % 90 < 24){ ctx.fillStyle = 'rgba(220,235,250,0.32)'; ctx.beginPath(); ctx.arc(q.x + (q.left ? -8 : 8), q.y - 18 - (((f + ph) % 90) * 0.25), 3, 0, TAU); ctx.fill(); } }
        }
      }
    }
    for (const p of SEASON_FX.items){
      if (s === 'winter'){
        p.x -= 2.6; p.y += 7.8; const q = seasonWrap(p, cx, cy);
        if (mode === 'camp' && hk === 'warehouse' && q.y > 150 && q.y < 1110) continue;
        ctx.strokeStyle = 'rgba(185,215,245,0.52)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 4, q.y + 13); ctx.stroke();
        if (((f + (p.phase * 20 | 0)) % 19) === 0){ ctx.fillStyle = 'rgba(200,225,250,0.55)'; ctx.fillRect(q.x - 6, q.y + 13, 3, 1); ctx.fillRect(q.x - 2, q.y + 13, 3, 1); }
      } else if (s === 'autumn'){
        if (p.groundT > 0){ p.groundT--; p.x += 0.35; }
        else { p.x += 1.6 + Math.sin(f / 18 + p.phase) * 0.7; p.y += 0.65 + Math.cos(f / 14 + p.phase) * 0.45; if (((f * 7 + (p.phase * 100 | 0)) % 197) === 0) p.groundT = 90; }
        const q = seasonWrap(p, cx, cy);
        if (mode === 'camp' && hk === 'warehouse' && q.y > 220 && q.y < 940 && (q.x < 680 || q.x > 1060)) continue;
        ctx.save(); ctx.translate(q.x, q.y); if (!p.groundT) ctx.rotate(f * 0.06 + p.phase); ctx.fillStyle = p.col; ctx.fillRect(-3, -2, 5, 3); ctx.fillStyle = '#4a2410'; ctx.fillRect(-4, -1, 2, 1); ctx.restore();
      } else if (s === 'spring'){
        if (p.kind === 'bird'){
          p.x += 1.9; p.y += Math.sin(f / 22 + p.phase) * 0.55; const q = seasonWrap(p, cx, cy), flap = Math.sin(f * 0.28 + p.phase) * 4;
          ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 36, 5, 2, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = (mode === 'camp' && hk === 'barge') ? '#e8eef4' : '#2b2622'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(q.x - 6, q.y + flap); ctx.lineTo(q.x, q.y); ctx.lineTo(q.x + 6, q.y + flap); ctx.stroke();
        } else {
          p.x += Math.sin(f / 15 + p.phase) * 1.1 + 0.35; p.y += Math.cos(f / 12 + p.phase * 1.3) * 0.9; const q = seasonWrap(p, cx, cy), wing = Math.abs(Math.sin(f * 0.35 + p.phase)) * 3.5 + 1;
          ctx.fillStyle = p.bcol; ctx.fillRect(q.x - wing, q.y - 2, wing, 4); ctx.fillRect(q.x + 1, q.y - 2, wing, 4); ctx.fillStyle = '#1b1410'; ctx.fillRect(q.x, q.y - 2, 1, 5);
        }
      } else {
        if (p.kind === 'bird'){
          if (((f + (p.phase * 30 | 0)) % 80) >= 25){ p.x += Math.cos(p.phase) * 2.4; p.y += Math.sin(p.phase) * 1.6; }
          if ((f % 80) === 0) p.phase += (((p.x * 13 + p.y * 7) % 100) / 100 - 0.5) * 1.8;
          const q = seasonWrap(p, cx, cy); ctx.fillStyle = '#4ad8e8'; ctx.fillRect(q.x - 4, q.y, 8, 1.5); ctx.fillStyle = 'rgba(220,245,255,0.75)'; ctx.fillRect(q.x - 1, q.y - 3 + (f % 2), 3, 6);
        } else {
          p.x += Math.sin(f / 28 + p.phase) * 0.45 + 0.2; p.y -= 0.25 + Math.cos(f / 22 + p.phase) * 0.2; const q = seasonWrap(p, cx, cy);
          ctx.fillStyle = `rgba(255,225,115,${0.35 + 0.35 * Math.sin(f / 10 + p.phase)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2.2, 0, TAU); ctx.fill();
        }
      }
    }
  }
  ctx.fillStyle = cfg.tint; ctx.fillRect(cx, cy, VW, VH);
}

/* ---- wiring it in ------------------------------------------------------------------------------- */
{ const f = generateMap; generateMap = function(c){ const M = f(c); try { generatePuddles(M, c); } catch (e) {} return M; }; }
{ const f = drawTerrain; drawTerrain = function(cx, cy){ f(cx, cy); if (MAP && MAP.puddles && MAP.puddles.length) drawPuddleList(MAP.puddles, cx, cy); }; }
{ const f = startDeployment;      // the season is read once, when the contract starts
  startDeployment = function(c, ids){
    const r = f(c, ids);
    try { if (G){ G.season = currentSeason(); if (!inStoryNow()){ const n = ({spring:'Spring: opening a chest also restores 1 Wound.', summer:'Summer: ground fires burn 25% longer.', autumn:'Autumn: sleeping camps notice the squad from 10% nearer.', winter:'Winter: puddles slow foot units, and the rain puts fires out faster.'})[G.season]; note(n); } } } catch (e) {}
    return r;
  };
}
{ const f = update;
  update = function(){
    if (G && !G.over && !G.paused && G.fires && G.fires.length){
      if (G.season === 'summer') for (const fz of G.fires) fz.life += 0.2;       // burns 25% longer
      else if (G.season === 'winter') for (const fz of G.fires) fz.life -= 0.35;  // the rain puts it out 35% faster
    }
    f();
    if (G && !G.over && !G.paused && G.season === 'winter' && MAP && MAP.puddles && MAP.puddles.length && G.frame % 12 === 0)
      for (const u of squadUnits()) if (u.moving && !G.mounted && !(u.p && (u.p.race === 'ZUHRI' || u.p.race === 'DARK_ELF')) && inPuddle(u)) G.fx.push({x:u.x + rnd(-4, 4), y:u.y + 10, vx:rnd(-0.8, 0.8), vy:-rnd(0.8, 1.6), life:12, c:'#9fd0f0', px:2});
  };
}
{ const f = applyLoot;            // a real chest (it has been opened) in Spring restores a Wound; a carried supply or a freed captive does not
  applyLoot = function(kind, at){
    f(kind, at);
    if (G && G.season === 'spring' && at && at.opened === true && G.leader && !G.leader.down && G.leader.wounds < G.leader.maxWounds){ G.leader.wounds++; pop(G.leader.x, G.leader.y - 34, 'SPRING HERBS +1 WOUND', '#8fd39a'); }
  };
}
{ const f = drawHUD;              // the weather is drawn above the field and below the panels
  drawHUD = function(){
    if (G && G.leader && MAP && G.obj !== 'brawl'){
      camWorld(v => drawSeasonOverlay(v.x, v.y, MAP.w * CELL, MAP.h * CELL, G.frame, 'combat'));   /* A2: the zoomed world */
    }
    f();
  };
}
{ const f = drawCamp;
  drawCamp = function(){
    const s = currentSeason();
    if (CAMP._seasonSeen !== s){ CAMP._seasonSeen = s; CAMP.pat = null; CAMP.trees = null; campScenery(); }
    f();
    const cx = Math.round(CAMP.cam.x), cy = Math.round(CAMP.cam.y);
    ctx.save(); ctx.translate(-cx, -cy);
    try { drawSeasonOverlay(cx, cy, CAMP_W, CAMP_H, CAMP.t, 'camp'); } finally { ctx.restore(); }
  };
}
{ const f = settingsHTML;
  settingsHTML = function(dark){
    const s = f(dark), on = settings().seasonFx !== false;
    const ctl = `<label title="Rain, blown leaves, butterflies and the like. The colours of the seasons stay."><input type="checkbox" ${on ? 'checked' : ''} onchange="setSetting('seasonFx', this.checked)"> Seasonal weather effects</label>`;
    const i = s.lastIndexOf('</div>');
    return i < 0 ? s + ctl : s.slice(0, i) + ctl + s.slice(i);
  };
}
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx40')) return;
    lg.insertAdjacentHTML('beforeend', `<p class="idx40"><b>The seasons.</b> One season passes with every contract, and the field and the camp show it. Spring: opening a chest also restores 1 Wound to the Leader. Summer: ground fires burn 25% longer, yours and theirs. Autumn: sleeping enemy camps notice the squad from 10% nearer. Winter: puddles slow foot units by 12% and the rain puts out ground fires 35% faster; mounted squads and Zuhri, whose Storm-Born blood ignores mud and weather, are not slowed. In the story the road is Autumn and the siege is Summer. Settings can switch the weather effects off.</p>`);
  };
}
/* ===== END INDEX 40 ======================================================= */

/* ============================================================================
   INDEX 41 - THE BARD PLAYS THE BAR FIGHT
   During Officers' Legwork (the bar fight) your Camp Bard is on a rug in the
   corner of the tavern, dancing about and playing his lute to the battle music.
     - He steps and hops on the beat: the music reports where it is in the bar,
       so his feet land with the drums. Four beats to a bar (two for the jig).
     - Harder fights make him hop higher: a crowd or a boss on the floor, and
       he really goes for it.
     - Notes drift up from the lute on each beat, coloured by the tune.
     - If the music is muted he keeps dancing to a steady beat of his own.
     - He is scenery. He cannot be hit, and nobody fights him.
   Nothing is saved, so every existing campaign carries over.
   To roll back, delete from this comment to END INDEX 41 and undo the two small
   patches marked "Index 41" in the music engine.
============================================================================ */
const DB = {notes:[], key:'', t0:0};
function danceBardSprite(p){
  const key = 'bardDance:' + p.race + p.sex + p.name;
  if (SPR[key]) return SPR[key];
  return SPR[key] = {frames:[], ax:AX + 4, ay:AY + 6, w:34, h:32};
}
function danceBeat(){
  const m = (typeof MUS !== 'undefined' && MUS.barNow) ? MUS.barNow() : null;
  if (m){ const steps = m.song === 'jig' ? 2 : 4, s = Math.min(steps - 1, (m.ph * steps) | 0); return {n:m.id + ':' + s, s, ph:m.ph * steps - s, lvl:m.level, now:m.now}; }
  const f = G.frame | 0, s = (f / 28) | 0; return {n:'f:' + s, s, ph:(f % 28) / 28, lvl:0, now:f / 60};
}
function danceBardBodies(bodies, onScreen){
  if (!G || G.over || !META || !META.bard) return;
  const RX = 22.5 * CELL, RY = 15.3 * CELL, B = META.bard;
  if (!onScreen({x:RX, y:RY}, 260)) return;
  bodies.push({y:RY - 400, custom:() => {                                    // Index 91: a small raised wooden stage (was the rug), under everyone's feet
    const w = 3.8 * CELL, h = 1.9 * CELL, x = RX - w / 2, y = RY - h / 2 - 6, lift = 14;
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(x + 5, y + h + lift - 2, w, 9);
    ctx.fillStyle = '#4a2c12'; ctx.fillRect(x, y + h - 2, w, lift + 2); ctx.fillStyle = '#3a2210';
    for (let i = 6; i < w; i += 14) ctx.fillRect(x + i, y + h, 2, lift);
    ctx.fillStyle = '#2a1608'; ctx.fillRect(x, y + h + lift - 3, w, 3);
    ctx.fillStyle = '#a06a30'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#8a5a28';
    for (let i = 0; i < h; i += 9) ctx.fillRect(x, y + i, w, 1);
    ctx.fillStyle = '#c08a48'; ctx.fillRect(x, y, w, 3); ctx.fillStyle = '#5a3418'; ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h); }});
  const d = danceBeat(), u = (d.now % 3.2) / 3.2, ang = u * TAU;                     /* Index 91: a mad man on a stage: faster, higher, spins and scissor kicks */
  const bx = RX + Math.sin(ang) * 1.0 * CELL, by = RY - 8 + Math.sin(ang * 2) * 0.22 * CELL - 12;
  const k = 1.6 + d.lvl * 0.6, hop = Math.abs(Math.sin(Math.PI * d.ph)) * 5 * k * 2.2, quarter = Math.min(3, (d.ph * 4) | 0);
  let left = Math.cos(ang) < 0; if (d.s % 2 === 1 && quarter % 2 === 1) left = !left;   // a spin on the off beats
  const frame = (d.s * 2 + quarter) % 4;                                                // a scissor kick: the legs swap every quarter beat
  bodies.push({y:by + 18, custom:() => {
    const spr = danceBardSprite(B), s = 2.4;
    shadow(bx, by + 15 * s * 0.55, 4.5 * s * (1 - hop / 40));
    if (!(typeof r3dDanceDraw === 'function' && r3dDanceDraw(B, bx, by - hop, s, frame, left))) drawSprite(spr, bx, by - hop, s, frame, left);   /* S6-C note 10: through the 3D chain (stand-in at worst), never the pixel frames */   /* Index 55 */
    if (d.n !== DB.key){ DB.key = d.n;                                       // a note on every beat
      if (DB.notes.length < 8){ const dir = left ? -1 : 1; DB.notes.push({x:bx + dir * 30, y:by - hop - 40, vx:dir * rnd(.1, .35), vy:-rnd(.5, .8), age:0, life:rnd(80, 110), ph:rnd(0, 6.3), sz:rnd(6, 8), kind:Math.random() < .5 ? 1 : 0}); } }
    const col = BARD_COL[(typeof MUS !== 'undefined' && MUS.state().fsong) || 'iron'] || '#ffd860';
    DB.notes = DB.notes.filter(n => n.age++ < n.life);
    for (const n of DB.notes){ n.x += n.vx + Math.sin(n.age / 14 + n.ph) * .35; n.y += n.vy; drawNote(ctx, n.x, n.y, n.sz, col, n.kind, 0.55 * Math.min(1, n.age / 10, (n.life - n.age) / 30)); }
  }});
}
{ const f = contractBodies; contractBodies = function(b, o){ f(b, o); if (isBrawl()) danceBardBodies(b, o); }; }
{ const f = setupBrawl; setupBrawl = function(c){ f(c); try { ensureBard(); DB.notes.length = 0; DB.key = ''; } catch (e) {} }; }
{ const f = openManual;
  openManual = function(){
    f(); const lg = $('manual-inner') && $('manual-inner').querySelector('.log'); if (!lg || lg.querySelector('.idx41')) return;
    lg.insertAdjacentHTML('beforeend', `<p class=\"idx41\"><b>The bard at the bar fight.</b> Your Camp Bard plays on a rug in the corner of the tavern during Officers' Legwork, dancing in time to the battle music. He is scenery: he cannot be hit, and he does nothing in the fight.</p>`);
  };
}
/* ===== END INDEX 41 ======================================================= */


window.SEASONS_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    const svM = typeof META !== 'undefined' ? META : undefined;
    const svG = typeof G !== 'undefined' ? G : undefined;
    try {
      META = freshMeta();
      const s = currentSeason();
      ok('currentSeason returns a valid SEASONS_CFG key', typeof s === 'string' && !!SEASONS_CFG[s]);
      G = {season: 'autumn', puddles: []};
      ok('seasonOf prefers G.season over currentSeason', seasonOf() === 'autumn');
      ok('seasonWakeK returns 0.9 in autumn', seasonWakeK() === 0.9);
      G.season = 'summer';
      ok('seasonWakeK returns 1 outside autumn', seasonWakeK() === 1);
    } catch (e) { ok('threw', false, e && e.message); }
    finally { META = svM; G = svG; }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};
