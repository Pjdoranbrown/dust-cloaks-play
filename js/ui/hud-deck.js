/* js/ui/hud-deck.js — INDEX HD1: the Command Deck HUD, F-27.1 (Fable, 2026-11-12; Patrick chose mock-up C, audits/hud-f27.md).
   The base drawHUD returns DECK.draw() at its top, so every wrapper round it (the ux.js scale, the message panel, the tip, the
   squad strip, alerts, loot, chips, look and glow) keeps running and the Deck replaces only the base panels: a 168 px band
   along the bottom (Leader card, a card per Squad Mate, ability buttons that take a click, the formation toggle, Luck, Favour,
   coin), the objective card top-left, Momentum top-centre. The minimap, the key legend, the level/armour/AC lines and the coin
   box leave the screen (M opens the pause screen, which has the map). F-27.2 (v3, v4) adds the squad kit as four little cards along the top of the Leader card, rank and spec on mate cards, hover panels, In Sight and the pause legend.
   INT-1 group 14: no switch (the old panels are gone from index.html). */
(function(){
  'use strict';
  const D = window.DECK = {H: 128, rects: [], helped: null, v: 8.1};   /* v8.1 (Patrick 2026-11-13): the camp band OFF by default (rejected), kept behind DECK.camp */   /* v8 (F-27.3a, Patrick 2026-11-13): the camp band, rollback DECK.camp = false */   /* v7 (Patrick 2026-11-13): new ability art, ward/pool pip colours and their hover, mate cards without status words (down red, dead grey), the Leader card in the mates' layout */   /* v6 (Patrick 2026-11-13): icon-only ability buttons in class colours, Favour on the Cleric button, one stance badge, the kit row unlabelled, coin by Momentum, Luck pips solid/spent/burnt */   /* v5 (Patrick 2026-11-13): the squad kit to the right-hand panel, Luck onto the Leader card */   /* v4 (F-27.2 rev, Patrick 2026-11-13): the squad kit as four little cards along the top of the Leader card */   /* v3 (F-27.2): the squad kit, rank, hover panels, In Sight, the pause legend */   /* v2 (F-27.1 fixes, Patrick 2026-11-12): band 168 -> 128, the camera on the open field, bigger small text, live status words */
  const C = {ground0: 'rgba(10,12,14,.75)', ground1: 'rgba(10,12,14,.95)', rule: '#5a4a30', gold: '#d9b45a', dim: '#7a6236', text: '#efe6d2', muted: '#c9bda3',
             red: '#c4473a', green: '#6f9d58', blue: '#5b8fc7', orange: '#f0a070', coin: '#e8c770', left: '#9ec6f0', card: '#241c14', card2: '#1a1410'};
  const on = () => typeof G !== 'undefined' && G;
  const UXo = () => window.UX83 || window.UX || null, k = () => { const u = UXo(); return u && u.hudK ? u.hudK() : 1; };
  const RN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  /* ---- portraits: the painted one when it has loaded, else the bust ---- */
  const FACES = new Map();
  D.face = function(p, isLeader){
    try { const key = personKey(p, isLeader); let f = FACES.get(key);
      if (!f){ f = {img: new Image(), ok: false}; FACES.set(key, f); const u = portraitURL(p, isLeader); if (!u) return null; f.img.onload = () => { f.ok = true; }; f.img.src = u; }
      return f.ok && f.img.naturalWidth ? f.img : null; } catch (e) { return null; } };
  function portrait(p, isLeader, x, y, S, bust){
    ctx.fillStyle = '#3a3226'; ctx.fillRect(x, y, S, S);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
    try { const fc = D.face(p, isLeader);
      if (fc){ ctx.imageSmoothingEnabled = true; const q = Math.max(S / fc.naturalWidth, S / fc.naturalHeight); ctx.drawImage(fc, x + (S - fc.naturalWidth * q) / 2, y, fc.naturalWidth * q, fc.naturalHeight * q); ctx.imageSmoothingEnabled = false; }
      else { ctx.imageSmoothingEnabled = false; ctx.drawImage(bust || personBust(p, isLeader), x, y, S, S); } } catch (e) {}
    ctx.restore(); }

  /* ---- small drawing helpers ---- */
  function rr(x, y, w, h, r){ ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function box(x, y, w, h, fill, stroke){ rr(x, y, w, h, 4); ctx.fillStyle = fill; ctx.fill(); if (stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } }
  function dots(x, y, n, max, col, size, gap, shape){           // pip row: filled to n, hollow to max; returns the width
    size = size || 7; gap = gap || 3; const w = max * (size + gap) - gap;
    for (let i = 0; i < max; i++){ const px = x + i * (size + gap);
      ctx.beginPath();
      if (shape === 'circle') ctx.arc(px + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      else if (shape === 'diamond'){ const c = size / 2; ctx.moveTo(px + c, y); ctx.lineTo(px + size, y + c); ctx.lineTo(px + c, y + size); ctx.lineTo(px, y + c); ctx.closePath(); }
      else ctx.rect(px, y, size, size);
      if (i < n){ ctx.fillStyle = col; ctx.fill(); } else { ctx.fillStyle = 'rgba(239,230,210,.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(239,230,210,.35)'; ctx.lineWidth = 1; ctx.stroke(); } }
    return w; }
  function text(t, x, y, font, col, align){ ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.fillText(t, x, y); }
  /* UX text floor (audits/uiux/text-floor-1280-ruling.md): fpx(n, bold) is a Georgia font of n drawing units raised to 14 screen px (hudPx, js/core/late-fixes.js);
     lh(f, n) is a line step of at least n that never lets lines of font f touch. At 1920 both are the old n. */
  const fpx = (n, b) => (b ? 'bold ' : '') + (typeof hudPx === 'function' ? hudPx(n) : n) + 'px Georgia', fsz = f => parseFloat(/([\d.]+)px/.exec(f)[1]), lh = (f, n) => Math.max(n, Math.ceil(fsz(f) * 1.25));
  D.fpx = fpx; D.lh = lh;
  /* fitName (Producer 22 Nov, the d70713ad clip): a name at the floor size, bold when it fits, else the same size in the regular face (narrower), and only then cut with "…". Sets ctx.font; returns [text, font]. */
  const fitName = (t, maxW) => { const fb = fpx(12, 1), fr = fpx(12); ctx.font = fb; if (ctx.measureText(String(t)).width <= maxW) return [String(t), fb]; ctx.font = fr; return [clipText(t, maxW), fr]; };
  function clipText(t, maxW){ t = String(t); if (ctx.measureText(t).width <= maxW) return t; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t + '…'; }
  /* S6 1i (audits/specs/s6-1-layout.md parts A to C, on the ruling s6-1i-one-idea.md): the Founding's field has set places for words.
     D.l1i() is true in a Founding fight (G.t45) at a desktop width. D.px(a, b) is a size given in screen px at 1280 and 1920 wide,
     in the units the Deck draws in. D.objAt, D.sightAt, D.legendAt are this paint's boxes in those units. D.slotTop() is the top
     of the top-centre slot (the goal box's top; under the Momentum bar once that is on the field) and D.slotMaxW() the widest a
     thing in it may be and stay 32 screen px clear of the goal box and IN SIGHT. ROLLBACK: window.L1I = false. */
  D.l1i = () => window.L1I !== false && typeof G !== 'undefined' && !!G && !!G.t45 && !D.ph58();
  D.sc = () => { try { const cv = canvas.getBoundingClientRect(); return cv.width && D.vw ? cv.width / D.vw : 1; } catch (e) { return 1; } };
  D.px = (a, b) => { const iw = window.innerWidth || 1280; return (a + (b - a) * Math.max(0, Math.min(1, (iw - 1280) / 640))) / D.sc(); };
  function wrapText(t, maxW, maxCh){ const out = ['']; for (const wd of String(t).split(/\s+/)){ if (!wd) continue; const cur = out[out.length - 1], nx = cur ? cur + ' ' + wd : wd;
      if (cur && (ctx.measureText(nx).width > maxW || (maxCh && nx.length > maxCh))) out.push(wd); else out[out.length - 1] = nx; } return out; }
  D.wrapText = wrapText;
  D.slotTop = () => D.momAt ? D.momAt.y + D.momAt.h + 8 : D.objAt ? D.objAt.y : 14;
  D.slotMaxW = function(){ const g = 32 / D.sc(), mid = D.vw / 2; let half = mid - 12;
    if (D.objAt) half = Math.min(half, mid - (D.objAt.x + D.objAt.w) - g); if (D.sightAt) half = Math.min(half, D.sightAt.x - mid - g); return Math.max(120, 2 * half); };
  function hit(r, px, py){ return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
  D.mouse = function(){ const m = (typeof CAMP !== 'undefined' && CAMP.mouse) || {x: -1, y: -1}; const u = UXo(); const q = D.kq || k(); return (u && u.inHud) ? m : {x: m.x / q, y: m.y / q}; };   /* D.kq: wireTop's scale, pinned (hudK reads VW/VH, which wireTop has already divided) */

  /* ---- the band ---- */
  /* live status: what the mate is doing now. A swing (face() sets atkT 12) keeps "Fighting" for 1.5 s, a lost point of
     Condition shows "Hit" for 1 s; the marks live on the unit (_dkF, _dkH, _dkC) and are read from the frame counter. */
  D.FIGHT = 90; D.HIT = 60;
  D.mateStatus = function(m){
    if (m.state === 'dead') return ['Dead', C.red];
    if (m.state === 'bleeding') return ['Bleeding', C.orange];
    if (m.state === 'stable') return ['Down', C.orange];
    const f = G.frame | 0;
    if (m.atkT > 0) m._dkF = f;
    if (m._dkC !== undefined && m.con < m._dkC) m._dkH = f;
    m._dkC = m.con;
    if (G.broken) return ['Broken', C.orange];
    if (G.shaken) return ['Shaken', C.orange];
    if (m._dkH !== undefined && f - m._dkH < D.HIT) return ['Hit', '#ff8a7a'];
    if (m.con <= Math.max(1, Math.floor((m.maxCon || 1) / 3))) return ['Hurt', C.orange];
    if (m._dkF !== undefined && f - m._dkF < D.FIGHT) return ['Fighting', C.gold];
    if (m.inF === false) return ['Lagging', C.orange];
    if (m.moving) return ['Moving', C.muted];
    return ['Ready', C.muted]; };

  /* the Leader card, v7 (Patrick 2026-11-13): the mates' layout. Portrait at the top at their size, the name, then
     Condition and Wound pips (no letters, no numbers), the mount pips if mounted, the Luck pips last. Down: the card goes red. */
  D.PS = 42;                                            // portrait size, Leader and mates alike
  D.tone = function(m){ return m === G.leader ? (m.down ? 'down' : 'up') : m.state === 'dead' ? 'dead' : (m.state === 'bleeding' || m.state === 'stable') ? 'down' : 'up'; };
  function toneCard(tone, x, y, w, h, hov, edge){
    box(x, y, w, h, tone === 'down' ? (hov ? '#4a1a14' : '#3a1410') : tone === 'dead' ? '#161616' : hov ? '#2b2218' : C.card, tone === 'down' ? C.red : tone === 'dead' ? '#4a4a4a' : edge); }
  function tonePortrait(tone, p, isLeader, x, y, S, bust){   // dead: black and white and dark; down: washed red
    if (tone === 'dead') ctx.filter = 'grayscale(1) brightness(0.65)';
    portrait(p, isLeader, x, y, S, bust); ctx.filter = 'none';
    if (tone === 'down'){ ctx.fillStyle = 'rgba(200,40,30,.38)'; ctx.fillRect(x, y, S, S); }
    ctx.strokeStyle = tone === 'down' ? C.red : tone === 'dead' ? '#5a5a5a' : isLeader ? C.gold : C.dim; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, S - 1, S - 1); }
  function pipRow(cx, y, n, max, col, size, gap, shape, maxW){   // a centred row; shrinks to fit maxW
    max = Math.max(0, max | 0); if (!max) return 0;
    while (size > 4 && max * (size + gap) - gap > maxW) size--;
    const w = max * (size + gap) - gap; dots(cx - w / 2, y, Math.max(0, Math.min(n, max)), max, col, size, gap, shape); return size; }
  function leaderCard(x, y, w, h){
    const L = G.leader, P = META.leader, mo = D.mouse(), S = D.PS, cx = x + w / 2, tone = D.tone(L);
    toneCard(tone, x, y, w, h, hit({x, y, w, h}, mo.x, mo.y) || D.pairU === L, C.gold);
    tonePortrait(tone, P, true, x + (w - S) / 2, y + 5, S, typeof hudBust === 'function' ? hudBust() : null);
    { const nf = fitName(P.name, w - 6); text(nf[0], cx, y + 60, nf[1], C.text, 'center'); }
    pipRow(cx, y + 67, L.down ? 0 : L.con, L.maxCon, C.green, 7, 3, 'rect', w - 10);
    let yy = y + 79; pipRow(cx, yy, L.wounds, L.maxWounds, C.red, 8, 3, 'circle', w - 10); yy += 12;
    if (G.mountMax > 0){ pipRow(cx, yy, G.mountPool | 0, G.mountMax, C.blue, 6, 2, 'rect', w - 10); yy += 9; }
    leaderLuck(x + 5, yy + 1, w - 10);
    D.leaderAt = {px: x + (w - S) / 2, py: y + 5, S};
    D.rects.push({kind: 'leader', x, y, w, h}); }

  /* ---- F-27.2: the squad kit (Patrick 2026-11-12: on the Leader card only; band mates wear the Leader's kit, ARM.loadoutOf).
     v4 (Patrick 2026-11-13): four card-shaped icons in a row, each with its slot glyph, the face coloured by cost band;
     hovering one raises it and opens its name and stats. Gear is a card you raise up and trade.
     v5 (Patrick 2026-11-13): the row sits in the right-hand panel under the formation, labelled Squad kit. ---- */
  D.SLOTS = ['melee', 'ranged', 'armour', 'shield'];
  D.SLOTN = {armour: 'Armour', shield: 'Shield', melee: 'Melee', ranged: 'Ranged'};
  D.BANDN = ['bare', 'common', 'fine', 'masterwork'];
  D.BANDC = [null, '#b8ab90', '#6fa0d8', '#e0b850']; D.ISSUEC = '#7a6e5c';   // free issue (cost 0, but a real item)
  D.costBand = function(row){ const c = (row && row.cost) | 0; return c <= 0 ? 0 : c < 100 ? 1 : c < 200 ? 2 : 3; };
  D.kitOf = function(){                               // the armoury's kit; in the story (armoury not live, kitOf null) the rows the run wears
    let k = null; try { k = (window.ARM && ARM.kitOf && typeof META !== 'undefined' && META.leader) ? ARM.kitOf(META.leader) : null; } catch (e) { k = null; }
    if (!k && typeof G !== 'undefined' && G && (G.armour || G.melee)) k = {armour: G.armour || null, shield: G.shield || null, melee: G.melee || null, ranged: G.ranged || null, kits: []};
    return k; };
  D.gearStats = function(r){
    if (!r) return '';
    const p = [];
    if (r.slot === 'armour' || r.ac !== undefined){ p.push('AC ' + r.ac); if (r.shift) p.push('+' + r.shift + ' armour step' + (r.shift > 1 ? 's' : '')); if (r.mv) p.push('move ' + r.mv); if (r.graze0) p.push('no grazes'); if (r.ward) p.push('+' + r.ward + ' ward'); }
    else if (r.slot === 'shield' || (r.pool !== undefined && r.dmg === undefined)) p.push(r.pool ? 'Shield Pool ' + r.pool : 'no Shield Pool');
    else { if (r.dmg !== undefined) p.push('damage ' + r.dmg); if (r.range) p.push('range ' + r.range); if (r.reach) p.push('reach'); if (r.crush) p.push('crush ' + r.crush); if (r.cd && r.cd < 1) p.push(Math.round((1 - r.cd) * 100) + '% faster'); if (r.cd > 1) p.push('slow'); }
    return p.join(' · '); };
  function glyph(slot, gx, gy, col){                  // a 14 px slot glyph, drawn in paths so it stays crisp at any HUD scale
    ctx.save(); ctx.translate(gx, gy); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    if (slot === 'melee'){ ctx.moveTo(3, 11); ctx.lineTo(12, 2); ctx.moveTo(2, 8); ctx.lineTo(6, 12); ctx.moveTo(4, 10); ctx.lineTo(1.5, 12.5); ctx.stroke(); }
    else if (slot === 'ranged'){ ctx.arc(2, 7, 7, -Math.PI / 2.6, Math.PI / 2.6); ctx.moveTo(4.6, 0.5); ctx.lineTo(4.6, 13.5); ctx.moveTo(1, 7); ctx.lineTo(13, 7); ctx.moveTo(10.5, 4.8); ctx.lineTo(13, 7); ctx.lineTo(10.5, 9.2); ctx.stroke(); }
    else if (slot === 'armour'){ ctx.moveTo(1, 3); ctx.lineTo(4.5, 1); ctx.quadraticCurveTo(7, 3.2, 9.5, 1); ctx.lineTo(13, 3); ctx.lineTo(11, 6); ctx.lineTo(11, 13); ctx.lineTo(3, 13); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); }
    else { ctx.moveTo(2, 1.5); ctx.lineTo(12, 1.5); ctx.lineTo(12, 6); ctx.quadraticCurveTo(12, 11, 7, 13.5); ctx.quadraticCurveTo(2, 11, 2, 6); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  function squadKit(x, y, w){                          // the four cards fill x..x+w, top at y
    const kit = D.kitOf(), gap = 4, cw = Math.floor((w - 3 * gap) / 4), chh = 28, mo = D.mouse();
    D.SLOTS.forEach((s, i) => {
      const row = kit ? kit[s] : null, b = D.costBand(row), sx = x + i * (cw + gap), r = {kind: 'kit', slot: s, row, band: b, x: sx, y, w: cw, h: chh};
      const hov = hit(r, mo.x, mo.y), sy = y - (hov ? 2 : 0);              // the hovered card is raised
      ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(sx + 1, sy + 2, cw, chh, 3); ctx.fill();   // its shadow
      rr(sx, sy, cw, chh, 3);
      const face = b ? D.BANDC[b] : row && row.name ? D.ISSUEC : null;          // free issue: a plain dun card; empty: dashed
      if (face){ ctx.fillStyle = face; ctx.fill(); ctx.strokeStyle = 'rgba(26,18,8,.55)'; ctx.lineWidth = 1; rr(sx + 2.5, sy + 2.5, cw - 5, chh - 5, 2); ctx.stroke(); }
      else { ctx.fillStyle = '#1a1410'; ctx.fill(); ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(239,230,210,.45)'; ctx.lineWidth = 1; rr(sx + .5, sy + .5, cw - 1, chh - 1, 3); ctx.stroke(); ctx.setLineDash([]); }
      if (b === 3){ ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(sx + 3, sy + 2, cw - 6, 1); }
      glyph(s, sx + (cw - 14) / 2, sy + (chh - 14) / 2, face ? '#1a1208' : C.muted);
      if (hov){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; rr(sx - .5, sy - .5, cw + 1, chh + 1, 3); ctx.stroke(); }
      D.rects.push(r); }); }

  /* rank: up to three chevrons from p.adv, beside the spec glyph */
  function rankRow(m, cx, y){
    const adv = Math.max(0, Math.min(3, (m.p && m.p.adv) | 0)), A = typeof ABILITIES !== 'undefined' && ABILITIES[m.spec], sp = SPECS[m.spec];
    const IS = 14, cw = 9, tw = IS + (adv ? 4 + adv * cw : 0); let x = cx - tw / 2;
    if (A && sp){ try { if (!D.abilArt(m.spec, x, y, IS, sp.color)) { abilIconAt(A.glyph, sp.color, x, y, IS); ctx.imageSmoothingEnabled = false; } } catch (e) {} }   // v7: the new art; PL-1: the fallback is the vector badge
    x += IS + 4; ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
    for (let i = 0; i < adv; i++){ const px = x + i * cw; ctx.beginPath(); ctx.moveTo(px, y + 4); ctx.lineTo(px + 3.5, y + 9); ctx.lineTo(px + 7, y + 4); ctx.moveTo(px, y + 8); ctx.lineTo(px + 3.5, y + 13); ctx.lineTo(px + 7, y + 8); ctx.stroke(); }
    return adv; }

  function mateCard(m, x, y, w, h){                    // v7 (Patrick 2026-11-13): no status words; down, the card goes red; dead, black and white
    const tone = D.tone(m), dead = tone === 'dead', mo = D.mouse(); D.mateStatus(m);   // mateStatus still keeps its marks for the hover panel
    toneCard(tone, x, y, w, h, hit({x, y, w, h}, mo.x, mo.y) || D.pairU === m, C.dim);
    tonePortrait(tone, m.p, false, x + (w - D.PS) / 2, y + 5, D.PS);
    const nf = fitName(m.p.name, w - 6); text(nf[0], x + w / 2, y + 60, nf[1], dead || (window.NOMARK48 && NOMARK48.grey(m)) ? '#8a8a8a' : C.text, 'center');   // F-48 K12: grey while an undrilled mate has no mark
    const cn = Math.max(1, m.maxCon | 0), cs = pipRow(x + w / 2, y + 67, dead ? 0 : Math.max(0, m.con | 0), cn, C.green, 7, 3, 'rect', w - 10) || 7, cw = cn * (cs + 3) - 3;   // pipRow returns the pip size it settled on
    if (dead) ctx.filter = 'grayscale(1)'; ctx.globalAlpha = dead ? 0.5 : 1; rankRow(m, x + w / 2, y + 80); ctx.globalAlpha = 1; ctx.filter = 'none';   /* spec glyph and rank chevrons */
    D.rects.push({kind: 'mate', m, x, y, w, h, con: {x: x + w / 2 - cw / 2, y: y + 67, w: cw, h: cs}}); }   // con: the Condition marks (S6 1d: the Condition lesson frames them)

  /* ---- v7 (Patrick 2026-11-13): the ability art, drawn new in paths (the old abilIcon pixel glyphs stay for the other
     screens). Each is a silhouette in the class colour with a pale rim, its shape its own: a shield bashing, a volley of
     arrows, a knife in a back, a radiant cross, a lightning bolt, a slit-pupilled eye. Drawn in a 0..1 box. ---- */
  const RIM = 'rgba(243,234,214,.9)';
  D.ART = {
    SOLDIER(c, col){                                   // v7.1 (Patrick): a heater shield, nothing round or rayed, so it never reads as a sun
      c.beginPath(); c.moveTo(0.16, 0.12); c.quadraticCurveTo(0.5, 0.04, 0.84, 0.12); c.lineTo(0.84, 0.46); c.quadraticCurveTo(0.82, 0.78, 0.5, 0.96); c.quadraticCurveTo(0.18, 0.78, 0.16, 0.46); c.closePath();
      c.fillStyle = col; c.fill(); c.lineWidth = 0.045; c.stroke();
      c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,.32)'; c.fillRect(0.5, 0, 0.5, 1); c.fillStyle = 'rgba(243,234,214,.85)'; c.fillRect(0.44, 0.04, 0.12, 0.94); c.fillRect(0.1, 0.36, 0.8, 0.11); c.restore();
      c.beginPath(); c.moveTo(0.16, 0.12); c.quadraticCurveTo(0.5, 0.04, 0.84, 0.12); c.lineTo(0.84, 0.46); c.quadraticCurveTo(0.82, 0.78, 0.5, 0.96); c.quadraticCurveTo(0.18, 0.78, 0.16, 0.46); c.closePath(); c.stroke(); },
    FOLK_HERO(c, col){ [[0, 0], [0.2, 0.06], [-0.06, 0.24]].forEach(o => { const x0 = 0.08 + o[0], y0 = 0.62 + o[1], x1 = 0.66 + o[0], y1 = 0.12 + o[1];
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = 0.06; c.strokeStyle = col; c.stroke(); c.lineWidth = 0.035; c.strokeStyle = RIM;
      c.beginPath(); c.moveTo(x1 + 0.1, y1 - 0.09); c.lineTo(x1 - 0.06, y1 - 0.02); c.lineTo(x1 + 0.03, y1 + 0.07); c.closePath(); c.fillStyle = RIM; c.fill();
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - 0.02, y0 - 0.12); c.moveTo(x0, y0); c.lineTo(x0 + 0.1, y0 + 0.03); c.strokeStyle = col; c.stroke(); c.strokeStyle = RIM; }); },
    SCOUNDREL(c, col){ c.beginPath(); c.arc(0.42, 0.22, 0.13, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(0.1, 0.98); c.lineTo(0.14, 0.52); c.quadraticCurveTo(0.16, 0.38, 0.3, 0.38); c.lineTo(0.54, 0.38); c.quadraticCurveTo(0.68, 0.38, 0.7, 0.52); c.lineTo(0.74, 0.98); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(0.5, 0.66); c.lineTo(0.62, 0.56); c.lineWidth = 0.05; c.strokeStyle = '#e8eef4'; c.stroke();            // the blade's last inch
      c.beginPath(); c.moveTo(0.56, 0.5); c.lineTo(0.7, 0.64); c.lineWidth = 0.06; c.strokeStyle = '#d9b45a'; c.stroke();           // crossguard
      c.beginPath(); c.moveTo(0.63, 0.57); c.lineTo(0.9, 0.3); c.lineWidth = 0.09; c.strokeStyle = '#6a4024'; c.stroke();            // grip
      c.beginPath(); c.arc(0.92, 0.28, 0.05, 0, Math.PI * 2); c.fillStyle = '#d9b45a'; c.fill();
      c.beginPath(); c.moveTo(0.5, 0.68); c.quadraticCurveTo(0.44, 0.8, 0.5, 0.84); c.quadraticCurveTo(0.56, 0.8, 0.5, 0.68); c.fillStyle = '#c4473a'; c.fill(); c.lineWidth = 0.035; c.strokeStyle = RIM; },
    CLERIC(c, col){ c.beginPath(); for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + Math.PI / 8; c.moveTo(0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3); c.lineTo(0.5 + Math.cos(a) * 0.46, 0.5 + Math.sin(a) * 0.46); } c.strokeStyle = col; c.lineWidth = 0.05; c.stroke(); c.lineWidth = 0.035; c.strokeStyle = RIM;
      c.beginPath(); c.moveTo(0.41, 0.12); c.lineTo(0.59, 0.12); c.lineTo(0.59, 0.36); c.lineTo(0.84, 0.36); c.lineTo(0.84, 0.54); c.lineTo(0.59, 0.54); c.lineTo(0.59, 0.88); c.lineTo(0.41, 0.88); c.lineTo(0.41, 0.54); c.lineTo(0.16, 0.54); c.lineTo(0.16, 0.36); c.lineTo(0.41, 0.36); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); },
    MAGE(c, col){ c.beginPath(); c.moveTo(0.58, 0.04); c.lineTo(0.22, 0.54); c.lineTo(0.46, 0.54); c.lineTo(0.34, 0.96); c.lineTo(0.8, 0.4); c.lineTo(0.55, 0.4); c.lineTo(0.7, 0.04); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      c.beginPath(); [[0.12, 0.3, 0.2, 0.34], [0.84, 0.66, 0.94, 0.7], [0.14, 0.8, 0.22, 0.74]].forEach(l => { c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); }); c.stroke(); },
    WITCH(c, col){ c.beginPath(); c.moveTo(0.04, 0.46); c.quadraticCurveTo(0.5, 0.04, 0.96, 0.46); c.quadraticCurveTo(0.5, 0.88, 0.04, 0.46); c.closePath(); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill(); c.stroke();
      c.beginPath(); c.arc(0.5, 0.46, 0.2, 0, Math.PI * 2); c.fillStyle = col; c.fill();
      c.beginPath(); c.ellipse(0.5, 0.46, 0.05, 0.16, 0, 0, Math.PI * 2); c.fillStyle = '#0c0a10'; c.fill();
      c.beginPath(); c.moveTo(0.26, 0.78); c.quadraticCurveTo(0.34, 0.96, 0.48, 0.86); c.moveTo(0.56, 0.84); c.quadraticCurveTo(0.7, 0.98, 0.78, 0.8); c.strokeStyle = col; c.lineWidth = 0.05; c.stroke(); } };
  D.abilArt = function(spec, x, y, S, col){
    const f = D.ART[spec]; if (!f) return false;
    ctx.save(); ctx.translate(x, y); ctx.scale(S, S); ctx.lineWidth = 0.035; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = RIM;
    try { f(ctx, col || (SPECS[spec] && SPECS[spec].color) || C.gold); } finally { ctx.restore(); } return true; };

  /* v6 (Patrick 2026-11-13): the ability buttons carry no words. The face is tinted with the class colour (SPECS[spec].color)
     and the icon drawn in it; the key number stays top-left; a dark sweep runs down the cooldown; a pip per model who can
     cast sits along the bottom; the Cleric's button carries the Favour pips in gold. Name and text are in the hover panel. */
  function rgba(hex, a){ const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(hex || '')); if (!m) return `rgba(217,180,90,${a})`;
    let hx = m[1]; if (hx.length === 3) hx = hx.replace(/./g, c => c + c); const v = parseInt(hx, 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; }
  function abilBadge(u, x, y, w){                       // F-33 step 4 (js/combat/abilities-f33.js): key, cooldown ring, auto pips; its rect goes first so it wins the click
    const r = ABIL33.drawCard(ctx, u, x, y, w); if (r) D.rects.unshift(Object.assign({kind: 'abil33', u}, r)); }
  function abilityButton(spec, x, y, w, h){
    const A = ABILITIES[spec], col = (SPECS[spec] && SPECS[spec].color) || C.gold, st = G.abil[spec] || {cd: 0}, n = abilityCasters(spec).length, cool = st.cd > 0, live = n && !cool;
    const mo = D.mouse(), hov = hit({x, y, w, h}, mo.x, mo.y), fav = spec === 'CLERIC' && G.favourMax > 0;
    box(x, y, w, h, C.card, null);
    rr(x, y, w, h, 4); ctx.fillStyle = rgba(col, live ? (hov ? 0.36 : 0.22) : 0.1); ctx.fill();
    ctx.strokeStyle = st.flash > 0 ? '#ffffff' : live ? col : rgba(col, n ? 0.55 : 0.3); ctx.lineWidth = live ? 2 : 1; ctx.stroke(); ctx.lineWidth = 1;
    const IS = Math.min(46, w - 10), iy = y + Math.round((h - IS) / 2) - (fav ? 9 : 4);
    ctx.globalAlpha = n ? (cool ? 0.5 : 1) : 0.3; if (!D.abilArt(spec, x + (w - IS) / 2, iy, IS, col)){ abilIconAt(A.glyph, col, x + (w - IS) / 2, iy, IS); ctx.imageSmoothingEnabled = false; } ctx.globalAlpha = 1;   // v7: the new art; PL-1: the fallback is the vector badge
    if (cool){ const q = Math.max(0, Math.min(1, st.cd / (st.max || 1))), cx = x + w / 2, cy = y + h / 2;   // the sweep: the dark part is the time still to run
      ctx.save(); rr(x + 1, y + 1, w - 2, h - 2, 4); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.58)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Math.hypot(w, h) / 2 + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = live ? col : '#3a2e20'; rr(x + 4, y + 4, 16, 16, 3); ctx.fill();
    text(A.key, x + 12, y + 16, 'bold 11px Georgia', live ? '#1a1208' : C.muted, 'center');
    { const m = Math.max(1, n), ps = Math.min(7, Math.floor((w - 8) / m) - 2), pw = m * (ps + 2) - 2;   // a pip per caster; a lone hollow pip: no caster
      ctx.globalAlpha = cool ? 0.6 : 1; dots(x + (w - pw) / 2, y + h - 12, n, m, col, ps, 2, 'circle'); ctx.globalAlpha = 1; }
    if (fav){ const fm = G.favourMax, fs = Math.max(3, Math.min(7, Math.floor((w - 8) / fm) - 2)), fw = fm * (fs + 2) - 2, fx = x + (w - fw) / 2, fy = y + h - 24;
      dots(fx, fy, Math.min(fm, G.favour | 0), fm, '#ffd860', fs, 2, 'diamond'); D.favAt = {x: fx, y: fy, w: fw, n: G.favour | 0, max: fm}; }
    D.rects.push({kind: 'ability', spec, x, y, w, h}); }

  /* v6 (Patrick 2026-11-13): one badge for the stance in force, its icon and colour; red and Staggered while bracing is
     blocked; a click or SPACE toggles it; the ward pips and the shield-pool pips sit on it. */
  D.WARDC = '#87ceeb'; D.POOLC = '#b8c4cf';
  D.STANCE = {open: {name: 'Open Order', col: '#d9b45a', bg: '#33281a'}, shield: {name: 'Shield Wall', col: '#7fb0e8', bg: '#1f2c44'}, stagger: {name: 'Staggered', col: '#e0574a', bg: '#451a16'}};
  D.stance = function(){
    const brawl = typeof isBrawl === 'function' && isBrawl(), shield = G.formation === 'SHIELD';
    const k = !brawl && !shield && !canBrace() ? 'stagger' : shield ? 'shield' : 'open';
    return Object.assign({k}, D.STANCE[k]); };
  function stanceIcon(k, x, y, s, col){
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
    if (k === 'open'){ [[0.2, 0.3], [0.8, 0.3], [0.5, 0.75]].forEach(q => { ctx.beginPath(); ctx.arc(x + s * q[0], y + s * q[1], s * 0.15, 0, Math.PI * 2); ctx.fill(); }); }   // three men, spread out
    else { ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.08); ctx.lineTo(x + s * 0.9, y + s * 0.08); ctx.lineTo(x + s * 0.9, y + s * 0.5);   // a heater shield
      ctx.quadraticCurveTo(x + s * 0.9, y + s * 0.85, x + s * 0.5, y + s); ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.85, x + s * 0.1, y + s * 0.5); ctx.closePath();
      if (k === 'shield') ctx.fill(); else { ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + s * 0.55, y + s * 0.1); ctx.lineTo(x + s * 0.4, y + s * 0.45); ctx.lineTo(x + s * 0.6, y + s * 0.6); ctx.lineTo(x + s * 0.45, y + s * 0.95); ctx.stroke(); } }   // cracked: staggered
    ctx.restore(); }
  function stanceBadge(x, y, w, h){
    const s = D.stance(), mo = D.mouse();
    box(x, y, w, h, s.bg, s.col);
    if (hit({x, y, w, h}, mo.x, mo.y)){ rr(x, y, w, h, 4); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill(); }
    stanceIcon(s.k, x + 7, y + 5, 18, s.col);
    const nf = fitName(s.name, w - 38); text(nf[0], x + 32, y + 17, nf[1], s.k === 'stagger' ? '#ffb0a6' : C.text);
    let px = x + 32; const py = y + h - 13, wx = px;
    px += dots(px, py, G.wards | 0, 4, D.WARDC, 7, 3, 'diamond') + 8;               // v7: Ward Tokens sky blue (as round the Leader's feet), the Shield Pool steel
    if (G.shieldMax > 0){ const ss = Math.max(3, Math.min(7, Math.floor((x + w - 6 - px) / G.shieldMax) - 2)); dots(px, py, G.shieldPool | 0, G.shieldMax, D.POOLC, ss, 2); }
    /* UX e6e0979f (section 2 cues): the stance badge flashes #ff8a7a twice over 600 ms when the squad is engaged and cannot brace (deployment.js sets G.noBraceF); the pips the pool just gained draw 1.6x and ease back over 500 ms with a gold edge */
    if (G.noBraceF && G.frame - G.noBraceF < 36 && Math.floor((G.frame - G.noBraceF) / 9) % 2 === 0){ rr(x, y, w, h, 4); ctx.strokeStyle = '#ff8a7a'; ctx.lineWidth = 2.5; ctx.stroke(); }
    { const sp = G.shieldPool | 0; if (D._ppG !== G){ D._ppG = G; D._ppN = sp; D._ppF = -999; } if (sp > D._ppN){ D._ppFrom = (G.frame >= D._ppF && G.frame - D._ppF < 30 && D._ppFrom < D._ppN) ? D._ppFrom : D._ppN; D._ppF = G.frame; }   /* LE F2: a second gain inside a live pulse keeps the first gain's pips pulsing */ D._ppN = sp;
      if (G.shieldMax > 0 && G.frame - D._ppF < 30 && G.frame >= D._ppF){ const k = 1 - (G.frame - D._ppF) / 30, ss = Math.max(3, Math.min(7, Math.floor((x + w - 6 - px) / G.shieldMax) - 2)), sc = 1 + 0.6 * k * k;
        for (let i = D._ppFrom; i < sp; i++){ const cx = px + i * (ss + 2) + ss / 2, cy = py + ss / 2, h2 = ss * sc / 2; ctx.fillStyle = D.POOLC; ctx.fillRect(cx - h2, cy - h2, h2 * 2, h2 * 2); ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 1.5; ctx.strokeRect(cx - h2, cy - h2, h2 * 2, h2 * 2); } } }
    D.stanceAt = {name: s.name, k: s.k, wards: {x: wx, y: py}, pool: G.shieldMax > 0 ? {x: px, y: py} : null};
    D.rects.push({kind: 'formation', x, y, w, h}); }

  /* v6 (Patrick 2026-11-13): Luck as one pip per point of the stat (G.leader.s.luck, which a burn lowers for good): solid
     while available (G.luck), translucent once spent (Momentum, rest and wafers refill it), gone once burnt. */
  function leaderLuck(x, y, w){                        // v7: no label; a centred row of diamonds, solid / spent (translucent) / burnt (gone)
    const max = Math.max(0, G.leader.s.luck | 0), cur = Math.max(0, Math.min(max, G.luck | 0)), size = Math.max(5, Math.min(9, Math.floor((w + 3) / Math.max(1, max)) - 3));
    const x0 = x + (w - (max * (size + 3) - 3)) / 2;
    for (let i = 0; i < max; i++){ const px = x0 + i * (size + 3), py = y, c = size / 2;
      ctx.beginPath(); ctx.moveTo(px + c, py); ctx.lineTo(px + size, py + c); ctx.lineTo(px + c, py + size); ctx.lineTo(px, py + c); ctx.closePath();
      ctx.globalAlpha = i < cur ? 1 : 0.28; ctx.fillStyle = '#f0c96a'; ctx.fill(); ctx.globalAlpha = 1; }
    D.luckAt = {x, y, w, h: size, solid: cur, spent: max - cur}; }

  D.band = function(){
    const H = D.H, y0 = VH - H;
    const gr = ctx.createLinearGradient(0, y0, 0, VH); gr.addColorStop(0, C.ground0); gr.addColorStop(1, C.ground1);
    ctx.fillStyle = gr; ctx.fillRect(0, y0, VW, H);
    ctx.fillStyle = C.rule; ctx.fillRect(0, y0, VW, 1); ctx.fillStyle = 'rgba(217,180,90,.35)'; ctx.fillRect(0, y0 + 1, VW, 1);
    const A33 = !!(window.ABIL33 && ABIL33.live()), mates = (G.squad || []).slice(0, 5), specs = (!A33 && G.abil && !(typeof isBrawl === 'function' && isBrawl())) ? squadSpecs() : [];   // F-33 step 4: the badges on the cards replace the bar
    const cy = y0 + 8, ch = H - 16, gap = 6, RW = 156, rx = VW - RW - 12, n = specs.length;
    // the cards shrink when a full squad and six buttons would not fit the 1000 px design width
    let LW = 118, MW = 88;
    // UX K56 (Art 16 Nov): on a phone (logical width under 640) the stance badge and kit row sit in a strip just above the band, so the cards get the full width (window.K56 = false: old layout)
    const ph = VW < 640 && window.K56 !== false;
    const abilUs = (A33 && !ph) ? [G.leader].concat(mates).filter(u => u && ABIL33.reg(u)) : [], nA = abilUs.length;   // Q94 B: one ability card per character who has an ability, in squad order
    const need = () => A33 && !ph ? 12 + LW + gap + mates.length * (MW + gap) + 10 + nA * (96 + gap) : 12 + LW + gap + mates.length * (MW + gap) + 10 + n * (72 + gap) + 10;
    if (need() > rx){ MW = 72; LW = 104; }
    if (ph){ LW = 80; MW = Math.max(48, Math.min(88, Math.floor((VW - 24 - LW - mates.length * gap) / Math.max(1, mates.length)))); }
    // Q94 B: the unit under the mouse on a squad card or its ability card; both cards of that unit light together
    let pair = null, cardsEnd0 = 12 + LW + gap + mates.length * (MW + gap);
    if (A33 && !ph && nA){ const mo = D.mouse(); let px = 12; [[G.leader, LW]].concat(mates.map(m => [m, MW])).forEach(([u, w0]) => { if (hit({x: px, y: cy, w: w0, h: ch}, mo.x, mo.y) && abilUs.includes(u)) pair = u; px += w0 + gap; });
      const AW0 = Math.min(112, Math.floor((rx - 16 - (cardsEnd0 + 10) - (nA - 1) * gap) / nA)); abilUs.forEach((u, i) => { if (hit({x: cardsEnd0 + 10 + i * (AW0 + gap), y: cy, w: AW0, h: ch}, mo.x, mo.y)) pair = u; }); }
    D.pairU = pair;
    let x = 12; leaderCard(x, cy, LW, ch); if (A33 && ph) abilBadge(G.leader, x, cy, LW); x += LW + gap;   // left: the cards
    mates.forEach(m => { mateCard(m, x, cy, MW, ch); if (A33 && ph) abilBadge(m, x, cy, MW); x += MW + gap; });
    const cardsEnd = x;
    if (ph){ stanceBadge(VW - RW - 8, y0 - 46, RW, 40); squadKit(VW - RW - 8 - 12 - (4 * 24 + 3 * 4), y0 - 40, 4 * 24 + 3 * 4); D.colBottom = y0 - 6; } else
    rightColumn(rx, cy, RW, ch);                                               // right: the stance badge, the kit row
    if (A33 && !ph && nA){   // Q94 B: the ability row, from the left edge, against the squad cards
      const ax = cardsEnd + 10, AWc = Math.min(112, Math.floor((rx - 16 - ax - (nA - 1) * gap) / nA)); ctx.save(); ctx.font = 'bold 13.5px Georgia';
      const fit = AWc >= 100 && abilUs.every(u => { const R = ABIL33.reg(u), lo = ABIL33.lo(u), nm = ABIL33.nameOf(lo.active || (lo.auto && lo.auto[0]) || R.id), w2 = Math.max(ctx.measureText(nm).width, ABIL33.locked(u) ? ctx.measureText('after its lesson').width : 0); return w2 <= AWc - 10; }); ctx.restore();
      D.abilRow = {n: nA, aw: AWc, wide: fit, x: ax, y: cy, h: ch};
      const art = (spec, ix, iy, S, col) => D.abilArt(spec, ix, iy, S, col), face = (u, fx, fy, d, col) => { ctx.save(); ctx.beginPath(); ctx.arc(fx, fy, d / 2, 0, Math.PI * 2); ctx.clip(); const isL = u === G.leader; portrait(isL ? META.leader : u.p, isL, fx - d / 2, fy - d / 2, d, isL && typeof hudBust === 'function' ? hudBust() : null); ctx.restore(); ctx.beginPath(); ctx.arc(fx, fy, d / 2, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.stroke(); };
      abilUs.forEach((u, i) => { const rc = ABIL33.drawAbilCard(ctx, u, ax + i * (AWc + gap), cy, AWc, ch, {wide: fit, hov: pair === u, art, face}); if (rc) D.rects.unshift(Object.assign({kind: 'abil33', u}, rc)); });
    } else D.abilRow = null;
    const AW = n ? Math.max(44, Math.min(72, Math.floor((rx - 10 - cardsEnd - 10 - (n - 1) * gap) / n))) : 0, AH = Math.min(96, ch), aw = n ? n * (AW + gap) - gap : 0;
    const ax = Math.max(cardsEnd + 10, Math.round((cardsEnd + rx) / 2 - aw / 2)), ay = cy + Math.round((ch - AH) / 2);   // middle: the buttons
    specs.forEach((s, i) => abilityButton(s, ax + i * (AW + gap), ay, AW, AH)); };

  function rightColumn(x, y, w, h){                    // v6: the stance badge; under it the kit row, unlabelled, at card size from the left (room to its right for specialist kits and mounts)
    stanceBadge(x, y, w, 40);
    squadKit(x, y + 46, 4 * 24 + 3 * 4); D.carried(x, y + 80); D.colBottom = y + h; }

  /* U-slice 3 (22 Nov): "Carried" moves from the top-right panel to its own row under the kit row: icons 26 square, gap 8, left edge = the kit row's,
     a count badge 14 x 16 at each icon's bottom-right (13.5 bold), at most 4 slots (with 5 or more kinds the 4th shows "+N"); a hover panel per icon. */
  D.CARRY = {S: 26, gap: 8, max: 4};
  D.carried = function(x, y){
    if (!G || !G.carry || typeof LOOT === 'undefined') return;
    const items = Object.entries(G.carry).filter(([, v]) => v > 0); if (!items.length) return;
    const K = D.CARRY, S = K.S, more = items.length > K.max, shown = more ? items.slice(0, K.max - 1) : items;
    const badge = (bx, by, t) => { ctx.fillStyle = '#000'; ctx.fillRect(bx, by, 14, 16); ctx.fillStyle = '#ffd860'; ctx.font = 'bold 13.5px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, bx + 7, by + 13); ctx.textAlign = 'left'; };
    shown.forEach(([k, v], i) => { const ix = x + i * (S + K.gap), Dd = LOOT[k];
      abilIconAt(Dd.glyph, Dd.col, ix, y, S); ctx.imageSmoothingEnabled = false;   // PL-1 item 1: CARRIED is the vector badge, smooth
      if (G.carryFx && G.carryFx.k === k){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(ix - 1, y - 1, S + 2, S + 2); }
      badge(ix + S - 7, y + S - 12, String(v));
      D.rects.push({kind: 'carry', k, v, x: ix, y, w: S + 7, h: S + 4}); });
    if (more){ const rest = items.slice(K.max - 1), ix = x + (K.max - 1) * (S + K.gap);
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(ix, y, S, S); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 1; ctx.strokeRect(ix + .5, y + .5, S - 1, S - 1);
      ctx.fillStyle = '#ffd860'; ctx.font = 'bold 13.5px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+' + rest.length, ix + S / 2, y + S / 2 + 1); ctx.textBaseline = 'alphabetic';   // UX C3-1b: "+N" centred in the slot, no corner badge
      D.rects.push({kind: 'carry', rest, x: ix, y, w: S + 7, h: S + 4}); }
    ctx.textAlign = 'left'; };

  /* ---- the camera: Patrick's standard (VO3.K.frameDown, the Leader a tenth below the middle) applied to the open field
     above the band, not the whole frame. camDY() (index.html, INDEX HD1) asks here in the field only; the camp camera is
     untouched. The depth scale stays 1 on the Leader's row: persp() rows are shifted by the same amount. ---- */
  const fd = () => (typeof VO3 !== 'undefined' && VO3.on && VO3.K && VO3.K.frameDown) || 0;
  D.camDY = function(){ return Math.round((VH - D.H) * (0.5 + fd()) - VH / 2); };
  D.leaderRow = function(){ return VH / 2 + D.camDY(); };                     // the Leader's screen row in Deck mode
  function wirePersp(){
    const V = window.VO3; if (!V || !V.perspAt || V.perspAt.__deck) return;
    const base = V.perspAt;
    V.perspAt = function(sy, H){                                                  // persp() calls without H; tests pass H and see the base
      if (H === undefined && on() && G.leader) sy += VH * (0.5 + ((V.K && V.K.frameDown) || 0)) - D.leaderRow();
      return base.call(this, sy, H); };
    V.perspAt.__deck = true; }
  wirePersp(); window.addEventListener('load', wirePersp);

  /* ---- the top row ---- */
  /* P23-ARTEMIS (UX audits/specs/p23-artemis-layout.md): the Ford night only. A 4 px round bar along the foot of the objective box (it fills with the
     night) and a 14 px horn on it at 5/6 where the knights arrive: gold and steady, one 0.6 s pulse at the end of round 4, green with a tick after
     they ride in. window.ARTEMIS23 = false hides it. */
  D.hornOn = () => window.ARTEMIS23 !== false && !!(G && G.kalloon && G.obj === 'night' && G.timeLimit);
  D.hornBar = function(x, y, w, h){
    const bx = x + 10, bw = w - 20, by = y + h - 9, p = Math.max(0, Math.min(1, (G.storyT || 0) / G.timeLimit)), hx = bx + bw * 5 / 6, arrived = !!G.knArrived;
    ctx.fillStyle = 'rgba(239,230,210,.38)'; ctx.fillRect(bx, by, bw, 4); ctx.fillStyle = '#ffd860'; ctx.fillRect(bx, by, bw * p, 4);
    const age = G.hornT !== undefined ? (G.frame - G.hornT) / 36 : 9, k = age >= 0 && age < 1 ? 1 + 0.35 * Math.sin(age * Math.PI) : 1, c = arrived ? '#8fd39a' : '#ffd860', cy = by + 2 - 2;
    ctx.save(); ctx.translate(hx, cy - 8); ctx.scale(k, k); ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -4.5); ctx.quadraticCurveTo(-3.5, 4, 3, 0); ctx.lineTo(6.5, -6); ctx.lineTo(9.5, -1.5); ctx.lineTo(5.5, 5); ctx.quadraticCurveTo(-6.5, 11, -9.5, -4.5); ctx.closePath(); ctx.fill();   // AD: a curved hunting horn, not a loudspeaker
    ctx.fillRect(-10.2, -6, 5, 2); ctx.fillStyle = 'rgba(10,12,14,.82)'; ctx.fillRect(1.6, 1.4, 1.2, 4.8);   // mouthpiece rim; a band near the bell in the box's fill
    if (arrived){ ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(12.5, 3); ctx.lineTo(16, -4); ctx.stroke(); }
    ctx.restore(); };
  D.objective = function(){
    const ol = objectiveLine(), big = ol[0], small = ol[1], c = G.contract || {};
    const title = c.title || (typeof OBJECTIVES !== 'undefined' && OBJECTIVES[G.obj] && OBJECTIVES[G.obj].name) || 'The job';
    const ph = D.ph58(), w = ph ? VW - 16 : 300, x = ph ? 8 : 12, y = 14; let h = 74;
    const hb = D.hornOn() ? 20 : 0;   // P23-ARTEMIS: the Ford night's box carries a thin round bar with the horn at 5/6
    if (D.l1i()){   // S6 1i C: nothing is cut off with "…"; a long line wraps; each part of the small line (the count, the goal) has its own line at 13 / 14 screen px
      const F1 = fpx(13, 1), tS = lh(F1, 16), fs = Math.max(Math.round(D.px(13, 14) * 2) / 2, typeof hudPx === 'function' ? hudPx(13) : 13), stp = Math.round(fs * 1.35), F2 = 'bold 22px Georgia', F3 = fs + 'px Georgia';
      ctx.font = F1; const tl = wrapText(title, w - 20); ctx.font = F2; const bl = wrapText(big, w - 20);
      ctx.font = F3; const sl = []; String(small || '').split(/\s+·\s+/).forEach(p => { if (p.trim()) sl.push.apply(sl, wrapText(p.trim(), w - 20)); });
      h = 8 + tl.length * tS + bl.length * 25 + (sl.length ? 4 + sl.length * stp : 0) + 8 + hb;
      box(x, y, w, h, 'rgba(10,12,14,.82)', C.rule); D.objAt = {x, y, w, h, lines: tl.concat(bl, sl)};
      let yy = y + 3; tl.forEach(l => { yy += tS; text(l, x + 10, yy, F1, C.gold); }); bl.forEach(l => { yy += 25; text(l, x + 10, yy, F2, C.text); });
      if (sl.length){ yy += 4; sl.forEach(l => { yy += stp; text(l, x + 10, yy, F3, C.muted); }); }
    } else {
      h += hb; box(x, y, w, h, 'rgba(10,12,14,.82)', C.rule); D.objAt = {x, y, w, h};
      const fT = fpx(13, 1), fS = fpx(10); ctx.font = fT; text(clipText(title, w - 20), x + 10, y + 19, fT, C.gold);
      text(big, x + 10, y + 44, 'bold 22px Georgia', C.text);
      ctx.font = fS; text(clipText(small, w - 20), x + 10, y + 62, fS, C.muted); }
    if (hb) D.hornBar(x, y, w, h);
    const st = [];
    if (G.chargeT && !(window.T45 && T45.holdCharge && T45.holdCharge())) st.push(['CHARGE +1 MELEE', '#ffd860']);   // s6-1i: not stated until its lesson (Act II) has been shown, lessons on
    if (G.stormT) st.push(['STORMROOT +1', '#9ae070']);
    if (G.smokeT) st.push(['SMOKE', '#c0c0c0']);
    if (G.fogT) st.push(['FOG', '#c0c0c0']);
    if (G.witherT) st.push(['WITHERED', '#b07ad8']);
    if (G.illusionT > 0) st.push([`DARK ILLUSION ${Math.ceil(G.illusionT / 60)}s: ENEMY ATTACKS -1`, '#c8a0f0']);
    if (G.baneT) st.push(['BANE -1', '#e05050']);
    if (G.stagger) st.push(['STAGGERED: NO SHIELD WALL', '#ff8a7a']);
    const fW = fpx(11, 1), sW = lh(fW, 14); ctx.font = fW; ctx.textAlign = 'left'; st.forEach((s, i) => { ctx.fillStyle = s[1]; ctx.fillText(s[0], x + 10, (ph ? 160 : y + h + 16) + i * sW); }); };
  // UX K58 (Art 16 Nov): on a phone (logical width under 640) the top row stacks: the job box full width, then MOMENTUM with coin and
  // slain, then IN SIGHT on the right and the status words on the left (window.K58 = false: old row)
  D.ph58 = () => VW < 640 && window.K58 !== false;

  D.momentum = function(){
    const ph = D.ph58(), w = ph ? 240 : 260, h = 40, x = ph ? 8 : Math.round(VW / 2 - w / 2), y = ph ? 94 : 12, q = Math.min(1, G.xp / (G.xpNext || 1)), segs = 8;
    box(x, y, w, h, 'rgba(10,12,14,.82)', C.rule);
    text(`MOMENTUM ${RN[Math.min(RN.length - 1, G.lvl | 0)] || G.lvl}`, x + w / 2, y + 15, fpx(11, 1), G.momFlash > 0 ? '#ffffff' : C.gold, 'center');
    const sw = (w - 24 - (segs - 1) * 3) / segs, filled = q * segs;
    for (let i = 0; i < segs; i++){ const sx = x + 12 + i * (sw + 3), f = Math.max(0, Math.min(1, filled - i));
      ctx.fillStyle = 'rgba(239,230,210,.1)'; ctx.fillRect(sx, y + 24, sw, 9);
      if (f > 0){ ctx.fillStyle = G.momFlash > 0 ? '#ffffff' : '#5a8ae8'; ctx.fillRect(sx, y + 24, sw * f, 9); } }
    if (G.momChoice && G.momHidden) text('TAB', x + w - 6, y + 15, fpx(10, 1), '#9fc8ff', 'right');
    if (G.streak >= 5) text(`x${G.streak}`, ph ? VW - 12 : x - 10, y + 27, 'bold 16px Georgia', G.streak >= 25 ? '#ffb04a' : '#ffe9b0', 'right');   // v6: to the left; coin and kills on the right
    D.momAt = {x, y, w, h};
    const cx0 = x + w + 12; ctx.textAlign = 'left'; try { PROPS3D.hudCoin(cx0 + 8, y + 11); } catch (e) {}   /* S6-C 3a: 3D coin */
    ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx0 + 3, y + 25); ctx.lineTo(cx0 + 13, y + 35); ctx.moveTo(cx0 + 13, y + 25); ctx.lineTo(cx0 + 3, y + 35); ctx.stroke(); ctx.lineWidth = 1;   // crossed blades: kills
    const t1 = `${G.coin} coin`, t2 = `${G.kills} slain`; text(t1, cx0 + 20, y + 15, fpx(13, 1), C.coin); const w1 = ctx.measureText(t1).width;
    text(t2, cx0 + 20, y + 35, fpx(12, 1), C.muted); const w2 = ctx.measureText(t2).width;
    D.coinAt = {x0: cx0, x1: cx0 + 20 + Math.max(w1, w2), y0: y, y1: y + h}; };

  D.pointers = function(){
    const L = G.leader, ly = D.leaderRow(), top = Math.max(66, D.momAt ? D.momAt.y + D.momAt.h + 24 : 0, D.coinAt ? D.coinAt.y1 + 24 : 0), bot = Math.min(VH - D.H - Math.max(20, D.legendReserve || 0), window.CAP_TOP != null ? window.CAP_TOP - 14 : Infinity);           // the open field: from the top to the band (Argon lead (c): or to the capstone chip rows, so no arrow sits under a chip)
    const avoid = (() => { try { const kk = (window.UX83 && UX83.k) || 1; return window.edgeBoxes ? edgeBoxes(ctx, VW * kk, VH * kk).map(q => ({x: q.x / kk, y: q.y / kk, w: q.w / kk, h: q.h / kk})) : []; } catch (e) { return []; } })();   // QA 23 Nov: the goal box, IN SIGHT, the key hints, an open tip card
    D.ptAt = [];   // this frame's other pointers, so the gold exit arrow (render.js drawExitArrow) keeps clear of them
    for (const m of objectiveMarkers()){
      if (m.kind === 'done' || m.kind === 'fort' || m.kind === 'lit') continue;
      if (m.kind === 'exit' && G.exitOpen && MAP.exit && !G.over) continue;   /* UX 2cdfb907 s9: one arrow per gate: drawExitArrow (render.js) draws the gold, clamped one */
      const zk = typeof camK === 'function' ? camK() : 1, dx = (m.x - L.x) * zk, dy = (m.y - L.y) * zk; if (Math.abs(dx) < VW / 2 - 20 && ly + dy > 20 && ly + dy < bot) continue;
      const a = Math.atan2(dy, dx), r = Math.min((VW / 2 - 40) / Math.abs(Math.cos(a) || 1e-6), (Math.sin(a) < 0 ? ly - top : bot - ly) / Math.abs(Math.sin(a) || 1e-6));
      let ax = VW / 2 + Math.cos(a) * r, ay = Math.max(top, Math.min(bot, ly + Math.sin(a) * r));
      { const R = 12, taken = [...avoid, ...D.ptAt], hit = (x, y) => taken.some(q => x + R > q.x - 6 && x - R < q.x + q.w + 6 && y + R > q.y - 6 && y - R < q.y + q.h + 6);
        if (hit(ax, ay)){   // slide along the edge of the pointer rectangle, nearest free spot first
          const x0 = 40, x1 = VW - 40, y0 = top, y1 = Math.max(top + 1, bot), w = x1 - x0, h = y1 - y0, P = 2 * (w + h), at = q => { q = ((q % P) + P) % P; return q < w ? [x0 + q, y0] : q < w + h ? [x1, y0 + q - w] : q < 2 * w + h ? [x1 - (q - w - h), y1] : [x0, y1 - (q - 2 * w - h)]; };
          const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), cx = cl(ax, x0, x1), cy = cl(ay, y0, y1);
          const s0 = Math.abs(cy - y0) < 1 ? cx - x0 : Math.abs(cx - x1) < 1 ? w + cy - y0 : Math.abs(cy - y1) < 1 ? w + h + x1 - cx : 2 * w + h + y1 - cy;
          for (let d = 2; d < P / 2; d += 2) { let done = false; for (const sg of [1, -1]){ const q = at(s0 + sg * d); if (!hit(q[0], q[1])){ ax = q[0]; ay = q[1]; done = true; break; } } if (done) break; } } }
      D.ptAt.push({x: ax - 12, y: ay - 12, w: 24, h: 24});
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
      ctx.fillStyle = {boss: '#e03030', vault: '#ffd860', exit: '#5ee07a', ally: '#9fe0ff', beacon: '#ff9a3a'}[m.kind] || '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } };

  D.middle = function(){
    const L = G.leader, P = META.leader;
    if (L.down){ ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(80,0,0,.55)'; ctx.fillRect(0, VH / 2 - 70, VW, 44);
      ctx.fillStyle = '#ffdddd'; ctx.font = 'bold 20px Georgia';
      ctx.fillText(`${P.name} is down. A Squad Mate is on the way. [R] burns 2 Luck to stand (${L.s.luck} left).`, VW / 2, VH / 2 - 41); ctx.textAlign = 'left'; }
    if (G.tip){
      G.tip.life--; const a = Math.min(1, G.tip.life / 40, (540 - G.tip.life) / 20);
      ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
      ctx.font = '15px Georgia'; const w = Math.min(VW - 80, ctx.measureText(G.tip.text).width + 40);
      ctx.fillStyle = 'rgba(245,235,215,.95)'; ctx.fillRect(VW / 2 - w / 2, 176, w, 36);
      ctx.strokeStyle = '#7a3e26'; ctx.lineWidth = 2; ctx.strokeRect(VW / 2 - w / 2, 176, w, 36);
      ctx.fillStyle = '#2a2520'; ctx.fillText(G.tip.text, VW / 2, 199);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
      if (G.tip.life <= 0) G.tip = null; }
    if (G.shaken || G.broken){ ctx.fillStyle = '#ff8a7a'; ctx.font = fpx(13, 1); ctx.textAlign = 'left';
      ctx.fillText(G.broken ? 'BROKEN: the squad cannot attack' : 'SHAKEN: -1 step, slower', 24, (window.CAP_TOP != null ? window.CAP_TOP : VH - D.H - 24) - 6); } };   /* chips at the bottom, this line 6 px above them */

  /* the base log: ux.js draws its panel over this from the list it kept back; the lines must still age and drop here */
  D.messages = function(){
    const base = VH - D.H - 24, fM = fpx(13), sM = lh(fM, 17);
    G.msgs.forEach((m, i) => { m.life--; ctx.globalAlpha = Math.min(1, m.life / 60);
      ctx.font = fM; ctx.textAlign = 'left'; ctx.fillStyle = '#000'; ctx.fillText(m.t, 25, base + 1 - i * sM);
      ctx.fillStyle = '#f0e6d2'; ctx.fillText(m.t, 24, base - i * sM); ctx.globalAlpha = 1; });
    G.msgs = G.msgs.filter(m => m.life > 0); };

  /* ---- F-27.2: hover panels above the band (the rects of this frame; the kit stubs come first, so they win) ---- */
  function wrap(t, maxW){ ctx.font = fpx(12); const out = []; let line = '';
    String(t || '').split(/\s+/).forEach(wd => { const tryL = line ? line + ' ' + wd : wd; if (line && ctx.measureText(tryL).width > maxW){ out.push(line); line = wd; } else line = tryL; });
    if (line) out.push(line); return out; }
  D.panelLines = function(r){
    if (!r) return null;
    if (r.kind === 'abil33') return ABIL33.panel(r.u);
    if (r.kind === 'cap'){ if (typeof capPanel !== 'function') return null; const [nm, st, tx] = capPanel(r.k);   // U-slice 10: a capstone chip's name, state and what it does
      const out = [[nm, C.gold, 1], [st, /^Ready$|^On$|^Set$/.test(st) ? C.left : C.muted]]; wrap(tx, 340).forEach(t => out.push([t, C.text])); return out; }
    if (r.kind === 'carry'){ const nm = (k, v) => v + ' ' + (v === 1 ? LOOT[k].one : LOOT[k].many) + ', carried';
      if (r.rest) return r.rest.map(([k, v]) => [nm(k, v), C.gold, 1]);
      const out = [[nm(r.k, r.v), C.gold, 1]]; wrap('Used on its own ' + (CARRY_WHEN[r.k] ? CARRY_WHEN[r.k] : 'when it is needed') + '.', 340).forEach(t => out.push([t, C.text])); return out; }
    if (r.kind === 'ability'){ const A = ABILITIES[r.spec], sp = SPECS[r.spec], st = G.abil[r.spec] || {cd: 0}, n = abilityCasters(r.spec).length;   // v6: the words the button no longer carries
      const out = [[`[${A.key}] ${A.name}`, (sp && sp.color) || C.gold, 1], [`${sp ? sp.name : r.spec} · cooldown ${A.cd}s`, C.muted],
        [!n ? 'No one can cast it now' : st.cd > 0 ? `Recovering: ${Math.ceil(st.cd / 60)}s` : n > 1 ? `Ready: ${n} can cast` : 'Ready', !n ? C.muted : st.cd > 0 ? C.orange : C.left]];
      if (r.spec === 'CLERIC' && G.favourMax) out.push([`Favour ${G.favour | 0}/${G.favourMax}`, '#ffd860']);
      wrap(A.text, 340).forEach(t => out.push([t, C.text])); return out; }
    if (r.kind === 'formation'){ const s = D.stance();
      const out = [[s.name, s.col, 1], [s.k === 'stagger' ? 'Staggered: cannot form a Shield Wall until it passes' : '[SPACE] or click: Shield Wall or Open Order', C.muted],
        [`◆ Ward Tokens ${G.wards | 0}/4: each soaks 1 damage before anything else`, D.WARDC]];
      if (G.shieldMax > 0) out.push([`■ Shield Pool ${G.shieldPool | 0}/${G.shieldMax}: the shield soaks damage after the wards`, D.POOLC]);
      out.push(['Piercing hits go past both.', C.muted]); return out; }
    if (r.kind === 'kit'){ const n = r.row && r.row.name, c = (r.row && r.row.cost) | 0, st = D.gearStats(r.row), note = r.row && r.row.note;
      const out = [[`${D.SLOTN[r.slot]}: ${n || 'none'}`, C.gold, 1], [r.band ? `${D.BANDN[r.band]} \u00b7 ${c} gp` : n ? 'free issue: nothing paid' : 'bare: the slot is empty', r.band ? D.BANDC[r.band] : C.muted]];
      if (st) out.push([st, C.text]); if (note) out.push([note, C.muted]);
      out.push(['the squad kit: the mates wear it too', C.muted]); return out; }
    if (r.kind === 'leader'){ const L = G.leader, P = META.leader, kit = D.kitOf(), a = G.armour || {};
      const out = [[P.name, C.gold, 1], [`${SPECS[P.spec].name} · Level ${P.level}`, C.text], [`Wounds ${L.wounds}/${L.maxWounds} · Condition ${L.con}/${L.maxCon}`, C.text]];
      out.push([`Luck ${G.luck | 0}/${Math.max(1, L.s.luck | 0)} · [Q] spend · [R] burn`, '#f0c96a']);
      if (a.name) out.push([`${a.name} · AC ${a.ac}`, C.text]);
      if (kit){ out.push(['Squad kit: ' + D.SLOTS.map(s => kit[s] ? kit[s].name : '-').join(', '), C.muted]);
        if (kit.kits && kit.kits.length) out.push(['Kits: ' + kit.kits.map(q => q.name).join(', '), C.muted]); }
      return out; }
    if (r.kind === 'mate'){ const m = r.m, p = m.p, adv = (p.adv | 0), cap = typeof advCap === 'function' ? advCap() : null, st = D.mateStatus(m), inj = (p.injuries || []).length;
      const out = [[p.name, C.gold, 1], [`${SPECS[m.spec] ? SPECS[m.spec].name : m.spec} · ${adv ? adv + (adv === 1 ? ' Advancement' : ' Advancements') : 'no Advancements'}${cap ? ' (cap ' + cap + ')' : ''}`, C.text],
        [`Condition ${m.state === 'dead' ? 0 : m.con}/${m.maxCon} · ${st[0]}`, st[1]]];
      if (inj) out.push([`${inj} lasting ${inj === 1 ? 'injury' : 'injuries'}`, C.orange]);
      return out; }
    return null; };
  D.hover = function(){
    const mo = D.mouse(), r = D.rects.find(q => q.kind !== 'none' && hit(q, mo.x, mo.y)) || (window.CAP_RECTS || []).find(q => hit(q, mo.x, mo.y)), lines = D.panelLines(r);   /* U-slice 10: capstone chips keep their own rects (capstones.js) */
    if (!lines) return null;
    let w = 0; lines.forEach(l => { ctx.font = fpx(12, l[2]); w = Math.max(w, ctx.measureText(l[0]).width); });
    const sH = lh(fpx(12), 16); w = Math.min(VW - 24, Math.ceil(w) + 20); const h = lines.length * sH + 10, x = Math.max(12, Math.min(VW - w - 12, r.x + r.w / 2 - w / 2)), y = Math.max(6, (r.kind === 'cap' && window.CAP_TOP != null ? window.CAP_TOP : VH - D.H) - h - 6);   /* EN D2: many chip rows plus a long panel never go off the top */   // U-slice 10: a chip's panel opens above the chip rows
    box(x, y, w, h, 'rgba(10,12,14,.94)', C.gold);
    lines.forEach((l, i) => { const f = fpx(12, l[2]); ctx.font = f; text(clipText(l[0], w - 16), x + 10, y + 19 + i * sH, f, l[1]); });
    return {x, y, w, h, kind: r.kind}; };

  /* ---- F-27.2: In Sight, top-right: enemies on the open field and out of the fog, grouped by kind, the kind that last hit marked ---- */
  D.SIGHT = 6;
  /* QA (16 Nov): seen ground is not sight. A foe counts only while it is drawn: in the vision now (visNow, as render.js draws foes)
     and on ground ever seen (as the minimap) */
  D.seen = function(x, y){ try { return (!(typeof seenXY === 'function' && typeof MAP !== 'undefined' && MAP && MAP.seen) || seenXY(x, y)) && (typeof visNow !== 'function' || visNow({x, y})); } catch (e) { return true; } };
  D.inSight = function(){
    const L = G.leader, ly = D.leaderRow(), bot = VH - D.H, groups = new Map(), zk = typeof camK === 'function' ? camK() : 1;   /* A2: world offset in drawing units */
    for (const e of (G.enemies || [])){
      if (e.dead || e.dormant || e.con <= 0) continue;
      const sx = VW / 2 + (e.x - L.x) * zk, sy = ly + (e.y - L.y) * zk;
      if (sx < 0 || sx > VW || sy < 0 || sy > bot) continue;
      if (!D.seen(e.x, e.y)) continue;
      const B = (typeof BESTIARY !== 'undefined' && BESTIARY[e.k]) || {}, boss = !!(B.boss || e.mark), name = (boss && e.name) || B.name || e.name || e.k || 'Enemy', key = boss ? 'boss:' + name : e.k;
      const g = groups.get(key) || {key, k: e.k, name, n: 0, boss}; g.n++; groups.set(key, g); }
    const last = D.lastHit && G.frame - D.lastHit.f < 600 ? D.lastHit.k : null;
    return [...groups.values()].map(g => (g.hit = g.k === last, g)).sort((a, b) => (b.boss - a.boss) || (b.hit - a.hit) || (b.n - a.n) || a.name.localeCompare(b.name)); };
  /* P23-BUG-7 (spec p23-in-sight-steady.md): nothing in the top right moves while you fight. Rows keep the order each kind was
     first seen in this fight (bosses first); the last hitter keeps its ▶ in place; a kind that leaves sight holds its row for
     D.HOLD23 frames (3 s) at half opacity, and held rows are dropped together, at most once per D.HOLD23; the box is always
     D.SIGHT rows plus the "+N more" line high (D.sightFixH), and its space stays reserved when it hides, so UX.hintTop and the
     AIM line never move. Kill switch: SIGHT23 = false (the old sorted, live-height box). */
  D.HOLD23 = 180;
  D.sight23 = function(){
    const ph = D.ph58(), w = ph ? 210 : 236, x = VW - w - (ph ? 8 : 12), y = ph ? 142 : 14, fR = fpx(12), fH = fpx(11, 1), fMo = fpx(11), rH = lh(fR, 16), mH = lh(fMo, 14), h = 26 + D.SIGHT * rH + mH;
    D.sightRH = rH; D.sightMH = mH; D.sightFixH = h; D.sightAt = {x, y, w, h};
    const f = G.frame | 0; let S = D.s23;
    if (!S || S.g !== G || f < S.f){ S = D.s23 = {g: G, f, seq: 0, rows: new Map(), prune: f}; }
    S.f = f;
    const live = D.inSight();
    for (const g of live){ let r = S.rows.get(g.key); if (!r){ r = {seq: ++S.seq}; S.rows.set(g.key, r); } Object.assign(r, {key: g.key, name: g.name, boss: g.boss, n: g.n, hit: g.hit, seen: f, held: false}); }
    for (const r of S.rows.values()) if (r.seen !== f){ r.held = true; r.hit = false; }
    if (f - S.prune >= D.HOLD23){ let cut = false; for (const [k, r] of S.rows) if (r.held && f - r.seen >= D.HOLD23){ S.rows.delete(k); cut = true; } if (cut) S.prune = f; }
    const all = [...S.rows.values()].sort((a, b) => (b.boss - a.boss) || (a.seq - b.seq));
    if (!all.length) return live;   // hidden; its space stays reserved (D.sightAt, D.sightFixH)
    const rows = all.slice(0, D.SIGHT), more = all.length - rows.length;
    box(x, y, w, h, 'rgba(10,12,14,.82)', C.rule);
    text('IN SIGHT', x + 10, y + 17, fH, C.gold);
    rows.forEach((g, i) => { const yy = y + 34 + i * rH, col = g.boss ? '#ff7060' : g.hit ? '#ff8a7a' : C.text, a0 = ctx.globalAlpha;
      if (g.held) ctx.globalAlpha = a0 * 0.5;
      const fG = fpx(12, g.hit || g.boss); ctx.font = fG; text(clipText((g.hit ? '▶ ' : '') + g.name, w - 48), x + 10, yy, fG, col);
      text(g.n > 1 ? 'x' + g.n : '', x + w - 10, yy, fpx(12, 1), C.muted, 'right'); ctx.globalAlpha = a0; });
    if (more > 0) text(`+${more} more`, x + 10, y + h - 6, fMo, C.muted);
    return live; };
  D.sight = function(){
    if (window.SIGHT23 !== false) return D.sight23();
    D.sightFixH = 0;
    const list = D.inSight(); if (!list.length) return list;
    const rows = list.slice(0, D.SIGHT), more = list.length - rows.length, w = D.ph58() ? 210 : 236, x = VW - w - (D.ph58() ? 8 : 12), y = D.ph58() ? 142 : 14, fR = fpx(12), fH = fpx(11, 1), fMo = fpx(11), rH = lh(fR, 16), mH = lh(fMo, 14), h = 26 + rows.length * rH + (more > 0 ? mH : 0);
    D.sightRH = rH; D.sightMH = mH;
    box(x, y, w, h, 'rgba(10,12,14,.82)', C.rule); D.sightAt = {x, y, w, h};
    text('IN SIGHT', x + 10, y + 17, fH, C.gold);
    rows.forEach((g, i) => { const yy = y + 34 + i * rH, col = g.boss ? '#ff7060' : g.hit ? '#ff8a7a' : C.text;
      const fG = fpx(12, g.hit || g.boss); ctx.font = fG; text(clipText((g.hit ? '▶ ' : '') + g.name, w - 48), x + 10, yy, fG, col);
      text(g.n > 1 ? 'x' + g.n : '', x + w - 10, yy, fpx(12, 1), C.muted, 'right'); });
    if (more > 0) text(`+${more} more`, x + 10, y + h - 6, fMo, C.muted);
    return list; };
  /* the kind that last hit: hurtSquad does not know the attacker; the enemy that swung this frame (atkT set to 14) and stands
     nearest the victim is it. A missed guess leaves the old mark; nothing reads this but the list. */
  D.markHit = function(v){
    if (!v || !G.enemies) return; let best = null, bd = 1e12;
    for (const e of G.enemies){ if (e.dead || !(e.atkT >= 13)) continue; const d = (e.x - v.x) ** 2 + (e.y - v.y) ** 2; if (d < bd){ bd = d; best = e; } }
    if (best) D.lastHit = {k: best.k, f: G.frame | 0}; };
  function wireHit(){
    if (typeof hurtSquad !== 'function' || hurtSquad.__deck) return;
    const base = hurtSquad;
    hurtSquad = function(n, victim, piercing){
      try { if (on()) D.markHit(victim || G.leader); } catch (e) {}
      return base.apply(this, arguments); };
    hurtSquad.__deck = true; }
  wireHit(); window.addEventListener('load', wireHit);

  /* ---- F-27.2: the pause screen gets the key legend line (the band has no legend) ---- */
  const LEGEND_REST = ' · [SPACE] Shield Wall · [Q] spend Luck · [R] burn Luck · [TAB] Momentum · [M] or [ESC] this screen';
  Object.defineProperty(D, 'LEGEND', {configurable: true, get: () => (window.ABIL33 && ABIL33.live() ? ABIL33.legend() : '[1-6] or click: abilities') + LEGEND_REST});   // F-33 step 4
  function wirePause(){
    if (typeof togglePause !== 'function' || togglePause.__deck) return;
    const base = togglePause;
    togglePause = function(){
      const r = base.apply(this, arguments);
      try { const el = document.getElementById('pause-inner');
        if (on() && G.paused && el && !el.querySelector('.deck-legend')){ const d = document.createElement('div'); d.className = 'sub deck-legend'; d.style.cssText = 'color:#d9b45a;font-size:13px'; d.textContent = D.LEGEND;
          const st = el.querySelector('#pause-settings'); el.insertBefore(d, st || null); } } catch (e) {}
      return r; };
    togglePause.__deck = true; }
  wirePause(); window.addEventListener('load', wirePause);

  /* the hover panel goes on top of everything: the log panel (ux.js) and the strips paint after the Deck, so the panel is
     drawn from the outermost drawHUD wrapper (this file loads last), in the same HUD scale as the band */
  function wireTop(){
    if (D.topWired || typeof drawHUD !== 'function') return; D.topWired = true;
    const f = drawHUD;
    drawHUD = function(){
      const r = f.apply(this, arguments);
      if (on() && G.leader && !G.over){ const q = k(), ow = VW, oh = VH;
        D.kq = q; VW = ow / q; VH = oh / q; ctx.save(); ctx.scale(q, q);
        try { D.hover(); } catch (e) { console.error('DECK hover', e); } finally { ctx.restore(); VW = ow; VH = oh; D.kq = 0; } }
      return r; }; }
  wireTop();

  /* S6 row 1e (spec audits/specs/s6-1-layout.md 1e): the key legend of the lessons, drawn in the Deck's own pass (so one transform
     for cards and legend, on the layer or on the main canvas). A strip above the band; its text starts at the Leader card's left
     edge; it sits at least 4 screen px above the highest card or badge; a long legend wraps and the strip grows upward. The size
     is set in screen px (14 at 1280 wide, 16 at 1920, linear between) from the canvas's on-screen scale. DECK.legendRect and
     DECK.cardsRect are CSS-px boxes in the viewport (null when not drawn). T45.drawOver stops drawing its own line while
     DECK.legendRect is set. ROLLBACK: DECK.legendOwn = false (the old line again). */
  D.legendOwn = true; D.legendRect = null; D.cardsRect = null; D.legendReserve = 0;
  D.legend = function(){
    D.legendRect = null; D.cardsRect = null; D.legendReserve = 0; D.legendAt = null;
    const cv = typeof canvas !== 'undefined' && canvas && canvas.getBoundingClientRect(); if (!cv || !cv.width || !VW) return;
    const sc = cv.width / VW, rs = D.rects.filter(r => r.kind !== 'none' && r.w > 0);
    if (!rs.length) return;
    const top0 = Math.min.apply(null, rs.map(r => r.y)), left0 = Math.min.apply(null, rs.map(r => r.x));
    const right0 = Math.max.apply(null, rs.map(r => r.x + r.w)), bot0 = Math.max.apply(null, rs.map(r => r.y + r.h));
    D.cardsRect = {x: cv.left + left0 * sc, y: cv.top + top0 * sc, w: (right0 - left0) * sc, h: (bot0 - top0) * sc};
    const T = window.T45; if (D.legendOwn === false || !T || !G.t45 || !G.t45.legend || !G.t45.legend.length || !T.lessonsOn() || typeof T.legendList !== 'function') return;
    const items = T.legendList(); if (!items.length) return;
    const lead = rs.find(r => r.kind === 'leader') || rs.slice().sort((p, q) => p.x - q.x)[0], x0 = lead.x;
    const iw = window.innerWidth || 1280, px = Math.max(14, Math.min(16, 14 + (iw - 1280) * 2 / 640)), fs = Math.ceil(px / sc * 2) / 2;
    const step = Math.round(fs * 1.35), padV = 4, padH = 8, gap = 6, maxW = (VW - 168 - 16) - x0 - padH * 2;
    ctx.save(); ctx.font = fs + 'px Alegreya, Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const sep = '  ·  ', lines = [''];
    for (const t of items){ const cur = lines[lines.length - 1], tryS = cur ? cur + sep + t : t;
      if (cur && ctx.measureText(tryS).width > maxW) lines.push(t); else lines[lines.length - 1] = tryS; }
    const tw = Math.min(maxW, Math.max.apply(null, lines.map(l => ctx.measureText(l).width)));
    const h = padV * 2 + (lines.length - 1) * step + Math.round(fs * 1.3), w = tw + padH * 2;
    const y0 = VH - D.H, bottom = Math.min(y0 - gap, top0 - 4 / sc), top = bottom - h, x = x0 - padH;
    ctx.fillStyle = 'rgba(16,10,4,.72)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, top, w, h, 3); else ctx.rect(x, top, w, h); ctx.fill();
    ctx.fillStyle = '#e8d8b0'; lines.forEach((l, i) => ctx.fillText(l, x0, top + padV + i * step + fs));
    ctx.restore();
    D.legendRect = {x: cv.left + x * sc, y: cv.top + top * sc, w: w * sc, h: h * sc, fontPx: fs * sc, textLeft: cv.left + x0 * sc};
    D.legendAt = {x, y: top, w, h};
    D.legendReserve = VH - D.H - top + 2; };

  D.draw = function(){
    D.rects = []; D.legendRect = null; D.cardsRect = null; if (!D.wired) wire();   /* legendReserve is cleared by D.legend, after D.pointers has read last frame's value (Lead review of 1e) */
    D.objAt = null; D.momAt = null; D.sightAt = null; D.vw = VW; D.vh = VH;   // S6 1d: the size the Deck is drawn in (the HUD scale has already divided VW and VH); T45.rectOf turns Deck rects into screen px with it
    if (!G.leader || typeof META === 'undefined' || !META || !META.leader) return;   // the Leader fell: META.leader is null behind the debrief
    try { D.objective(); } catch (e) { console.error('DECK objective', e); }
    try { D.momentum(); } catch (e) { console.error('DECK momentum', e); }
    try { D.pointers(); } catch (e) { console.error('DECK pointers', e); }
    try { D.band(); } catch (e) { console.error('DECK band', e); }
    try { D.legend(); } catch (e) { console.error('DECK legend', e); }
    try { D.middle(); } catch (e) { console.error('DECK middle', e); }
    try { D.messages(); } catch (e) { console.error('DECK messages', e); }
    try { D.sight(); } catch (e) { console.error('DECK sight', e); }
    try { const s = G.streak; G.streak = 0; drawMomentum(); G.streak = G.streakT > 0 ? s : 0; } catch (e) { console.error('DECK drawMomentum', e); }
    ctx.fillStyle = C.ground1; ctx.fillRect(0, 0, VW, 9);                       // over drawMomentum's thin top bar
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    D.helper(); };

  /* the helper line's text goes to the tip queue once per contract */
  D.helper = function(){ if (D.helped === G) return; D.helped = G;
    try { if (typeof tip === 'function' && !window.SELFTEST) tip('deckhelp'); } catch (e) {} };
  try { if (typeof TIPS !== 'undefined') TIPS.deckhelp = 'The Command Deck: your squad along the bottom. The ability buttons take a click or their key; SPACE or the stance badge (bottom right) forms the Shield Wall. M or ESC opens the map.'; } catch (e) {}

  /* ---- the click layer: abilities and the formation (the keys are unchanged) ---- */
  D.at = function(px, py){ for (const r of D.rects) if (hit(r, px, py)) return r; return null; };
  D.click = function(px, py){
    const r = D.at(px, py); if (!r) return false;
    if (r.kind === 'ability'){ useAbility(r.spec); return true; }   // F-41: no pause, so casts work with the Momentum cards open
    if (r.kind === 'abil33'){ ABIL33.use(r.u); return true; }
    if (r.kind === 'formation'){ D.brace(); return true; }
    return r.kind === 'leader' || r.kind === 'mate' || r.kind === 'kit'; };
  D.brace = function(){                                          // the same path as the SPACE key (index.html 5656)
    if (typeof isBrawl === 'function' && isBrawl()){ G.formation = 'OPEN'; pop(G.leader.x, G.leader.y - 30, 'NO SHIELDS IN A BAR FIGHT', '#c8b890'); }
    else if (G.formation === 'OPEN' && !canBrace()) pop(G.leader.x, G.leader.y - 30, 'STAGGERED: NO SHIELD WALL', '#ff8a7a');
    else { G.formation = G.formation === 'OPEN' ? 'SHIELD' : 'OPEN'; pop(G.leader.x, G.leader.y - 30, G.formation === 'SHIELD' ? 'SHIELD WALL' : 'OPEN ORDER', '#fff'); } };
  function wire(){
    const cv = (typeof canvas !== 'undefined' && canvas) || document.getElementById('game'); if (!cv || cv.__deck) return; cv.__deck = true; D.wired = true;
    cv.addEventListener('mousedown', e => {
      if (!on()){ D.rects = []; return; }
      if (e.button !== 0 || G.over || G.paused || (typeof PARLAY !== 'undefined' && PARLAY)) return;
      const q = k(); if (D.click(e.clientX / q, e.clientY / q)){ e.preventDefault(); e.stopImmediatePropagation(); try { SFX.unlock(); } catch (x) {} } }, true); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.addEventListener('load', wire);

  /* ---- M opens the pause screen, which has the map (the minimap is gone) ---- */
  window.addEventListener('keydown', e => {
    if (!on() || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'm') return;
    const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    G.showMini = false; if (!G.over && typeof togglePause === 'function') togglePause(); });

  /* ---- F-27.3a (Patrick 2026-11-13: "Yes, .3a first"): the camp band. The field's band, at the foot of the camp:
     the Leader and a card per roster mate on the left; every camp action as an icon button in the middle (read from the
     top bar's own buttons, so story camps, the Epilogue and any later button come along; the top bar stays in the page,
     hidden, as the source); Treasury, upkeep, season and the Ambition on the right. ONE Chronicle button (F-25 merges the
     Manual into the Scribe's book). The hint strip's keys are on the "?" button. Rollback: DECK.camp = false. ---- */
  D.camp = false; D.crects = [];   // OFF (Patrick 2026-11-13: rejected; the camp keeps its text menu, top bar and hint strip; the camp redesign is a fresh scope). DECK.camp = true shows the .3a band again
  const $id = id => document.getElementById(id);
  const storyNow = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };
  D.campOn = function(){
    try { if (!D.camp || (typeof G !== 'undefined' && G) || typeof CAMP === 'undefined' || !CAMP.on || !META || !META.leader) return false;
      const tb = $id('topbar'), ti = $id('screen-title'); if (!tb || tb.classList.contains('hidden') || (ti && !ti.classList.contains('hidden'))) return false;
      return !(typeof campOverlayOpen === 'function' && campOverlayOpen()); } catch (e) { return false; } };
  /* the actions: [match on the button's onclick, icon, key letter (the camp's own keys, index.html I78), hover name] */
  D.CACTS = [[/openTable/, 'table', 'P', 'Planning Table'], [/'fire'/, 'hire', 'H', 'Hire at the fire'], [/openCreate/, 'recruit', '', 'Recruit a Squad Leader'],
    [/storyOpenMain/, 'banner', '', ''], [/openRoster/, 'roster', 'R', 'Roster'], [/openCamp/, 'quarter', 'Q', 'Quartermaster'],
    [/openChronicle|openScribeBook/, 'book', 'C', 'The Chronicle'], [/openManual/, 'book', 'M', 'Manual'], [/openPortraitStudio/, 'portrait', '', 'Portraits'],
    [/openEpilogue/, 'scroll', '', 'Epilogue'], [/toggleSettings/, 'cog', '', 'Settings'], [/leaveStory/, 'door', '', 'Main menu']];
  D.campActions = function(tb){
    const out = []; if (!tb) return out;
    const list = []; tb.querySelectorAll('button').forEach(b => { if (b.id === 'ux-tbmenu-btn'){ ((UXo() && UXo().folded) || []).forEach(f => list.push(f)); } else list.push(b); });   // ux.js UX-14 folds Manual, Portraits, Settings under a menu below 1280 px: the band shows them all
    list.forEach(b => { const oc = b.getAttribute('onclick') || '', m = D.CACTS.find(a => a[0].test(oc));
      const label = (b.textContent || '').trim(), name = m && m[3] ? m[3] : label.charAt(0) + label.slice(1).toLowerCase();
      out.push({icon: m ? m[1] : 'dot', key: m ? m[2] : '', name, label, el: b, gold: b.classList.contains('gold'), off: !!b.disabled, tip: b.title || '', manual: /openManual/.test(oc)}); });
    const chip = Array.from(tb.querySelectorAll('span.stat')).find(s => s.onclick && /Ledger/.test(s.textContent + ' ' + (s.getAttribute('aria-label') || '')));   // index.html 25033: the Ledger chip opens the Chronicle
    const book = typeof window.openScribeBook === 'function' ? window.openScribeBook : typeof openChronicle === 'function' && !storyNow() ? openChronicle : null;
    const n = (META && META.build) ? Object.keys(META.build).length : 0, bt = n ? `${n} ${n === 1 ? 'work' : 'works'} under way` : '', own = out.find(a => a.icon === 'book' && !a.manual);
    if (own){ Object.assign(own, {name: 'The Chronicle', badge: n, badgeTip: bt}); for (let j = out.length - 1; j >= 0; j--) if (out[j].manual) out.splice(j, 1); }   // F-25's own CHRONICLE button (openScribeBook): use it, ONE book
    else if (book){ const i = out.findIndex(a => a.manual);
      const a = {icon: 'book', key: 'C', name: 'The Chronicle', label: 'CHRONICLE', fn: book, gold: false, off: false, tip: chip ? chip.title : '', badge: n, badgeTip: bt};
      if (i >= 0) out.splice(i, 1, a); else out.splice(Math.min(out.length, 4), 0, a); }   // ONE book: the Manual's place, else after the Quartermaster
    out.push({icon: 'help', key: '', name: 'Keys', label: '?', help: true});
    return out; };
  D.CAMPKEYS = ['WASD or the arrows walk your Squad Leader (Shift runs)', 'Click buildings, plots and people', 'B build · R roster · P planning table',
    'Q quartermaster · H hire · C or L the Chronicle · M manual', 'Hold Alt for names · ESC closes a panel'];
  /* the action icons: gold line art in a 0..1 box */
  const IC = {
    table(){ ctx.rect(.12, .42, .76, .14); ctx.moveTo(.2, .56); ctx.lineTo(.2, .86); ctx.moveTo(.8, .56); ctx.lineTo(.8, .86); ctx.moveTo(.3, .3); ctx.lineTo(.55, .22); ctx.lineTo(.7, .34); ctx.moveTo(.36, .14); ctx.lineTo(.36, .36); ctx.lineTo(.5, .3); ctx.lineTo(.36, .24); },
    hire(){ ctx.moveTo(.5, .12); ctx.quadraticCurveTo(.78, .45, .62, .7); ctx.quadraticCurveTo(.5, .52, .5, .7); ctx.quadraticCurveTo(.38, .5, .38, .7); ctx.quadraticCurveTo(.22, .45, .5, .12); ctx.moveTo(.16, .82); ctx.lineTo(.84, .9); ctx.moveTo(.16, .9); ctx.lineTo(.84, .82); },
    recruit(){ ctx.arc(.5, .32, .14, 0, Math.PI * 2); ctx.moveTo(.22, .86); ctx.quadraticCurveTo(.5, .44, .78, .86); ctx.moveTo(.8, .2); ctx.lineTo(.8, .44); ctx.moveTo(.68, .32); ctx.lineTo(.92, .32); },
    banner(){ ctx.moveTo(.28, .1); ctx.lineTo(.28, .92); ctx.moveTo(.28, .14); ctx.lineTo(.8, .14); ctx.lineTo(.8, .58); ctx.lineTo(.54, .48); ctx.lineTo(.28, .58); },
    roster(){ for (const [x, s] of [[.3, .1], [.7, .1], [.5, .13]]){ ctx.moveTo(x + s, .34); ctx.arc(x, .34, s, 0, Math.PI * 2); ctx.moveTo(x - s * 1.9, .86); ctx.quadraticCurveTo(x, .42, x + s * 1.9, .86); } },
    quarter(){ ctx.moveTo(.2, .35); ctx.lineTo(.5, .2); ctx.lineTo(.8, .35); ctx.lineTo(.8, .78); ctx.lineTo(.5, .9); ctx.lineTo(.2, .78); ctx.closePath(); ctx.moveTo(.2, .35); ctx.lineTo(.5, .5); ctx.lineTo(.8, .35); ctx.moveTo(.5, .5); ctx.lineTo(.5, .9); },
    book(){ ctx.moveTo(.5, .26); ctx.quadraticCurveTo(.3, .16, .1, .22); ctx.lineTo(.1, .8); ctx.quadraticCurveTo(.3, .74, .5, .84); ctx.quadraticCurveTo(.7, .74, .9, .8); ctx.lineTo(.9, .22); ctx.quadraticCurveTo(.7, .16, .5, .26); ctx.lineTo(.5, .84); ctx.moveTo(.2, .38); ctx.lineTo(.4, .4); ctx.moveTo(.2, .52); ctx.lineTo(.4, .54); ctx.moveTo(.6, .4); ctx.lineTo(.8, .38); },
    portrait(){ ctx.rect(.16, .12, .68, .76); ctx.moveTo(.6, .4); ctx.arc(.5, .4, .1, 0, Math.PI * 2); ctx.moveTo(.26, .8); ctx.quadraticCurveTo(.5, .44, .74, .8); },
    scroll(){ ctx.moveTo(.24, .18); ctx.lineTo(.76, .18); ctx.moveTo(.24, .82); ctx.lineTo(.76, .82); ctx.moveTo(.3, .18); ctx.lineTo(.3, .82); ctx.moveTo(.7, .18); ctx.lineTo(.7, .82); ctx.moveTo(.38, .36); ctx.lineTo(.62, .36); ctx.moveTo(.38, .5); ctx.lineTo(.62, .5); ctx.moveTo(.38, .64); ctx.lineTo(.56, .64); },
    cog(){ for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; ctx.moveTo(.5 + Math.cos(a) * .24, .5 + Math.sin(a) * .24); ctx.lineTo(.5 + Math.cos(a) * .38, .5 + Math.sin(a) * .38); } ctx.moveTo(.74, .5); ctx.arc(.5, .5, .24, 0, Math.PI * 2); ctx.moveTo(.6, .5); ctx.arc(.5, .5, .1, 0, Math.PI * 2); },
    door(){ ctx.moveTo(.26, .9); ctx.lineTo(.26, .12); ctx.lineTo(.74, .12); ctx.lineTo(.74, .9); ctx.moveTo(.26, .12); ctx.lineTo(.56, .24); ctx.lineTo(.56, .9); ctx.moveTo(.48, .52); ctx.lineTo(.48, .56); },
    help(){ ctx.moveTo(.32, .34); ctx.quadraticCurveTo(.34, .14, .52, .14); ctx.quadraticCurveTo(.72, .16, .7, .34); ctx.quadraticCurveTo(.68, .46, .52, .52); ctx.lineTo(.52, .66); ctx.moveTo(.52, .8); ctx.lineTo(.52, .84); },
    dot(){ ctx.moveTo(.62, .5); ctx.arc(.5, .5, .12, 0, Math.PI * 2); } };
  D.campIcon = function(k, x, y, S, col){ const f = IC[k] || IC.dot; ctx.save(); ctx.translate(x, y); ctx.scale(S, S); ctx.beginPath(); f();
    ctx.restore(); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, S / 16); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); };
  function campAct(a, x, y, w, h){
    const mo = D.mouse(), hov = hit({x, y, w, h}, mo.x, mo.y), col = a.off ? '#6a5a40' : a.gold ? '#f0c860' : C.gold;
    box(x, y, w, h, hov && !a.off ? '#3a2c1c' : C.card, a.gold ? C.gold : C.dim);
    if (a.gold){ rr(x, y, w, h, 4); ctx.fillStyle = 'rgba(217,180,90,.14)'; ctx.fill(); }
    const IS = Math.min(30, h - 14, w - 12); D.campIcon(a.icon, x + (w - IS) / 2, y + (h - IS) / 2 + 2, IS, col);
    if (a.key){ ctx.fillStyle = '#3a2e20'; rr(x + 3, y + 3, 13, 13, 3); ctx.fill(); text(a.key, x + 9.5, y + 13, 'bold 10px Georgia', C.muted, 'center'); }
    if (a.badge){ const bx = x + w - 9, by = y + 9; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fillStyle = C.red; ctx.fill(); text(String(Math.min(9, a.badge)), bx, by + 4, 'bold 10px Georgia', '#fff', 'center'); }
    D.crects.push({kind: 'act', a, x, y, w, h}); }
  function campLeader(x, y, w, h){
    const P = META.leader, mo = D.mouse(), S = D.PS, cx = x + w / 2;
    toneCard('up', x, y, w, h, hit({x, y, w, h}, mo.x, mo.y), C.gold);
    tonePortrait('up', P, true, x + (w - S) / 2, y + 5, S, typeof personBust === 'function' ? personBust(P, true) : null);
    { const nf = fitName(P.name, w - 6); text(nf[0], cx, y + 60, nf[1], C.text, 'center'); }
    pipRow(cx, y + 67, Math.max(1, P.level | 0), Math.max(1, P.level | 0), C.gold, 7, 3, 'diamond', w - 10);   // level: a gold diamond each
    const sp = SPECS[P.spec]; try { if (sp) D.abilArt(P.spec, cx - 7, y + 80, 14, sp.color); } catch (e) {}
    D.crects.push({kind: 'cleader', x, y, w, h}); }
  D.campTone = function(p){ return p.away ? 'away' : (p.resting > 0 && !p.trainingAt) ? 'rest' : p.trainingAt ? 'train' : 'up'; };
  function campMate(p, x, y, w, h){
    const mo = D.mouse(), t = D.campTone(p), dim = t === 'away' || t === 'rest', inj = (p.injuries || []).length;
    toneCard('up', x, y, w, h, hit({x, y, w, h}, mo.x, mo.y), C.dim);
    ctx.globalAlpha = dim ? 0.5 : 1; tonePortrait('up', p, false, x + (w - D.PS) / 2, y + 5, D.PS);
    { const nf = fitName(p.name, w - 6); text(nf[0], x + w / 2, y + 60, nf[1], C.text, 'center'); }
    if (inj) pipRow(x + w / 2, y + 67, inj, inj, C.red, 7, 3, 'circle', w - 10);   // a red scar pip per lasting injury
    rankRow({p, spec: p.spec}, x + w / 2, y + 80); ctx.globalAlpha = 1;
    if (t === 'rest') text('z', x + w - 10, y + 18, 'italic bold 15px Georgia', '#9ec6f0', 'center');
    else if (t === 'away'){ ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w - 13, y + 22); ctx.lineTo(x + w - 13, y + 7); ctx.lineTo(x + w - 5, y + 10); ctx.lineTo(x + w - 13, y + 13); ctx.stroke(); }
    else if (t === 'train') D.campIcon('quarter', x + w - 15, y + 5, 11, C.left);
    D.crects.push({kind: 'cmate', p, x, y, w, h}); }
  function campMore(n, x, y, w, h){ const mo = D.mouse(); toneCard('up', x, y, w, h, hit({x, y, w, h}, mo.x, mo.y), C.dim);
    text('+' + n, x + w / 2, y + h / 2 + 6, 'bold 18px Georgia', C.gold, 'center'); D.crects.push({kind: 'cmore', n, x, y, w, h}); }
  D.campRight = function(){ const A = META.ambition, T = A && typeof AMBITIONS !== 'undefined' && AMBITIONS[A.track];
    let F = null; try { F = typeof forecast === 'function' && !storyNow() ? forecast() : null; } catch (e) {}
    return {gp: META.treasury | 0, due: F ? (F.civ | 0) + (F.debt | 0) : 0, season: typeof seasonName === 'function' ? seasonName() : '', amb: T ? T.name : '', done: A ? Math.min(10, A.done | 0) : 0, has: !!T}; };
  function campRight(x, y, w, h){
    const R = D.campRight(), mo = D.mouse(); let yy = y + 4;
    box(x, y, w, h, C.card2, C.dim);
    // the Treasury: a coin and the sum
    ctx.beginPath(); ctx.arc(x + 16, yy + 10, 8, 0, Math.PI * 2); ctx.fillStyle = C.coin; ctx.fill(); ctx.strokeStyle = '#7a5a14'; ctx.lineWidth = 1.5; ctx.stroke();
    text(`${R.gp} gp`, x + 30, yy + 15, 'bold 15px Georgia', '#ffd860'); D.crects.push({kind: 'cgp', x, y: yy, w, h: 22}); yy += 24;
    // upkeep due: a hollow coin pip per 10 gp, up to 10
    if (!storyNow()){ const n = Math.min(10, Math.ceil(R.due / 10)); if (n) dots(x + 10, yy + 2, n, n, '#b08a3a', 8, 3, 'circle'); else text('no upkeep due', x + 10, yy + 10, fpx(11), C.muted);
      D.crects.push({kind: 'cdue', due: R.due, x, y: yy - 2, w, h: 14}); yy += 16; }
    { const fSe = fpx(12); ctx.font = fSe; text(clipText(R.season, w - 16), x + 10, yy + 12, fSe, C.text); } D.crects.push({kind: 'cseason', x, y: yy, w, h: 16}); yy += 18;
    if (R.has){ const fA = fpx(11, 1); ctx.font = fA; text(clipText(R.amb, w - 16), x + 10, yy + 11, fA, C.gold); yy += lh(fA, 15);
      const s = Math.max(5, Math.min(12, Math.floor((w - 20 - 9 * 3) / 10))); dots(x + 10, yy, R.done, 10, C.gold, s, 3, 'rect');
      D.crects.push({kind: 'camb', x, y: yy - 15, w, h: 15 + s}); }
    else { text('No Ambition yet', x + 10, yy + 11, fpx(11), C.muted); D.crects.push({kind: 'camb', x, y: yy, w, h: 15}); } }
  function campStory(x, y, w, h, tb){                  // the story camps: the top bar's own figures (Day, Night, Column, Supply, Treasury)
    box(x, y, w, h, C.card2, C.dim); let yy = y + 18;
    (tb ? Array.from(tb.querySelectorAll('span.stat')) : []).slice(0, 5).forEach(s => { const t = (s.textContent || '').trim(), b = s.querySelector('b');
      const lab = b ? t.replace(b.textContent, '').trim() : t, fL = fpx(12); ctx.font = fL; text(clipText(lab, w - 70), x + 10, yy, fL, C.muted); if (b) text(b.textContent, x + w - 10, yy, fpx(13, 1), '#ffd860', 'right'); yy += 20; }); }
  D.campBand = function(){
    D.crects = []; const H = D.H, y0 = VH - H, tb = $id('topbar');
    const gr = ctx.createLinearGradient(0, y0, 0, VH); gr.addColorStop(0, 'rgba(10,12,14,.9)'); gr.addColorStop(1, C.ground1);   // more solid than the field's: the camp's labels showed through
    ctx.fillStyle = gr; ctx.fillRect(0, y0, VW, H);
    ctx.fillStyle = C.rule; ctx.fillRect(0, y0, VW, 1); ctx.fillStyle = 'rgba(217,180,90,.35)'; ctx.fillRect(0, y0 + 1, VW, 1);
    const acts = D.campActions(tb), cy = y0 + 8, ch = H - 16, gap = 6, RW = 176, rx = VW - RW - 12;
    // the actions: two rows of square buttons, as many columns as it takes
    const cols = Math.ceil(acts.length / 2), BS = Math.floor((ch - gap) / 2), aw = cols * (BS + gap) - gap, ax = rx - 14 - aw;
    acts.forEach((a, i) => campAct(a, ax + (i % cols) * (BS + gap), cy + Math.floor(i / cols) * (BS + gap), BS, BS));
    if (storyNow()) campStory(rx, cy, RW, ch, tb); else campRight(rx, cy, RW, ch);
    // the cards: the Leader, then the roster (in the roster's order) while they fit; past that a +N card
    const LW = 104, MW = 76, roster = (META.roster || []).filter(p => p && p !== META.leader);
    let x = 12; campLeader(x, cy, LW, ch); x += LW + gap;
    const room = Math.max(0, Math.floor((ax - 14 - x + gap) / (MW + gap)));
    const fit = roster.length <= room ? roster.length : Math.max(0, room - 1);
    roster.slice(0, fit).forEach(p => { campMate(p, x, cy, MW, ch); x += MW + gap; });
    if (fit < roster.length) campMore(roster.length - fit, x, cy, Math.min(MW, 56), ch); };
  D.campLines = function(r){
    if (!r) return null; const R = D.campRight();
    if (r.kind === 'act'){ const a = r.a; if (a.help) return [['Camp keys', C.gold, 1]].concat(D.CAMPKEYS.map(t => [t, C.text]));
      const out = [[(a.key ? `[${a.key}] ` : '') + a.name, a.off ? C.muted : C.gold, 1]];
      if (a.off) out.push(['Not yet: recruit a Squad Leader first', C.muted]);
      if (a.badgeTip) out.push([a.badgeTip, C.orange]);
      if (a.tip) wrap(a.tip, 340).forEach(t => out.push([t, C.muted])); return out; }
    if (r.kind === 'cleader'){ const P = META.leader; return [[P.name, C.gold, 1], [`Squad Leader · ${SPECS[P.spec] ? SPECS[P.spec].name : P.spec} · Level ${P.level | 0}`, C.text], ['Click: walk the camera to them', C.muted]]; }
    if (r.kind === 'cmate'){ const p = r.p, inj = (p.injuries || []).length, adv = p.adv | 0, t = D.campTone(p);
      const out = [[p.name, C.gold, 1], [`${SPECS[p.spec] ? SPECS[p.spec].name : p.spec} · ${adv ? adv + (adv === 1 ? ' Advancement' : ' Advancements') : 'no Advancements'}`, C.text]];
      if (inj) out.push([`${inj} lasting ${inj === 1 ? 'injury' : 'injuries'}: ${(p.injuries || []).map(i => { const j = typeof INJURIES !== 'undefined' && INJURIES.find && INJURIES.find(x => x.id === i); return j ? j.name : i; }).join(', ')}`, C.orange]);
      out.push([t === 'away' ? 'On detachment: sits out this contract' : t === 'rest' ? 'Resting: sits out the next contract' : t === 'train' ? 'Training at a camp facility' : 'Ready to deploy', t === 'up' ? C.left : C.muted]);
      out.push(['Click: walk the camera to them', C.muted]); return out; }
    if (r.kind === 'cmore') return [[`${r.n} more on the roster`, C.gold, 1], ['Click: open the Roster', C.muted]];
    if (r.kind === 'cgp') return [[`Treasury ${R.gp} gp`, '#ffd860', 1]];
    if (r.kind === 'cdue'){ let t = ''; try { t = forecastTitle(); } catch (e) {} return [[`Upkeep due next contract: ${r.due} gp`, C.gold, 1], ['a coin pip per 10 gp', C.muted]].concat(wrap(t, 340).map(s => [s, C.muted])); }
    if (r.kind === 'cseason') return [[R.season, C.gold, 1], ['Two contracts a season', C.muted]];
    if (r.kind === 'camb'){ const A = META.ambition, T = A && AMBITIONS[A.track]; if (!T) return [['No Ambition yet', C.gold, 1], [(window.WT48 ? WT48.n('Choose one on the Planning Table') : 'Choose one on the Planning Table'), C.muted]];
      const out = [[`${T.name}: ${A.done | 0} of 10`, C.gold, 1]]; if (A.done < 10) wrap('Next: ' + T.ms[Math.min(9, A.done | 0)].t, 340).forEach(t => out.push([t, C.text])); return out; }
    return null; };
  D.campHover = function(){ const mo = D.mouse(), r = D.crects.find(q => hit(q, mo.x, mo.y)), lines = D.campLines(r); if (!lines) return null;
    let w = 0; lines.forEach(l => { ctx.font = fpx(12, l[2]); w = Math.max(w, ctx.measureText(l[0]).width); });
    const sH = lh(fpx(12), 16); w = Math.min(VW - 24, Math.ceil(w) + 20); const h = lines.length * sH + 10, x = Math.max(12, Math.min(VW - w - 12, r.x + r.w / 2 - w / 2)), y = VH - D.H - h - 6;
    box(x, y, w, h, 'rgba(10,12,14,.94)', C.gold);
    lines.forEach((l, i) => { const f = fpx(12, l[2]); ctx.font = f; text(clipText(l[0], w - 16), x + 10, y + 19 + i * sH, f, l[1]); });
    return {x, y, w, h, kind: r.kind}; };
  D.campClick = function(px, py){
    const r = D.crects.find(q => hit(q, px, py)); if (!r) return false;
    if (r.kind === 'act'){ const a = r.a; if (a.off || a.help) return true;
      try { if (a.fn) a.fn(); else if (a.el) a.el.click(); } catch (e) { console.error('DECK camp action', e); } try { SFX.play('pick'); } catch (e) {} return true; }
    if (r.kind === 'cleader' || r.kind === 'cmate'){ const id = r.kind === 'cleader' ? null : r.p.id;
      const q = (CAMP.people || []).find(o => r.kind === 'cleader' ? (o.kind === 'leader' || o.id === 'L') : (o.kind === 'mate' && (o.id === 'm' + id || o.p === r.p)));   // camp people: the Leader 'L', a mate 'm' + roster id
      if (q){ try { if (!(typeof leaderCtrl === 'function' && leaderCtrl())) centreCamOn(q.x, q.y); openPanel('person', q.id); } catch (e) {} }
      else if (typeof openRoster === 'function') openRoster();
      try { SFX.play('pick'); } catch (e) {} return true; }
    if (r.kind === 'cmore'){ if (typeof openRoster === 'function') openRoster(); return true; }
    if (r.kind === 'cgp' || r.kind === 'cdue'){ try { if (!storyNow()) openChronicle(); } catch (e) {} return true; }
    if (r.kind === 'camb'){ try { if (META.leader && !storyNow()) openTable(); } catch (e) {} return true; }
    return true; };
  /* the page: the top bar and the hint strip step aside; the toast and the side panel clear the band */
  (function(){ const st = document.createElement('style'); st.id = 'deck-camp-css';
    st.textContent = 'body.deck-camp #topbar{visibility:hidden} body.deck-camp #camp-hint{display:none} body.deck-camp #camp-note{top:auto!important;bottom:calc(var(--deckh,128px) + 14px)!important}'
      + ' body.deck-camp #camp-panel{top:var(--cpr);max-height:calc(100vh - var(--deckh,128px) - var(--cpt) - var(--cpr) + 48px)}';
    (document.head || document.documentElement).appendChild(st); })();
  D.campSync = function(on){ const b = document.body; if (!b) return; if (b.classList.contains('deck-camp') !== on) b.classList.toggle('deck-camp', on); };
  D.campQ = function(){ return k(); };
  function wireCamp(){
    if (D.campWired || typeof drawCamp !== 'function') return; D.campWired = true;
    const f = drawCamp;
    drawCamp = function(){
      const r = f.apply(this, arguments), live = D.campOn(); D.campSync(live);
      if (!live){ D.crects = []; return r; }
      const q = D.campQ(), ow = VW, oh = VH; D.kq = q; VW = ow / q; VH = oh / q;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(q, q);
      try { D.campBand(); D.campHover(); const mo = D.mouse(); if (typeof canvas !== 'undefined' && mo.y >= VH - D.H) canvas.classList.toggle('point', D.crects.some(c => hit(c, mo.x, mo.y))); }
      catch (e) { console.error('DECK camp', e); } finally { ctx.restore(); VW = ow; VH = oh; D.kq = 0; }
      try { document.documentElement.style.setProperty('--deckh', Math.round(D.H * q) + 'px'); } catch (e) {}
      return r; };
    if (typeof campHit === 'function'){ const h = campHit;
      campHit = function(wx, wy){ if (D.campOn() && typeof CAMP !== 'undefined' && CAMP.mouse && CAMP.mouse.y >= VH - D.H * D.campQ()) return null; return h.apply(this, arguments); }; }
    const inBand = e => D.campOn() && e.target === canvas && e.clientY >= VH - D.H * D.campQ();
    window.addEventListener('mousedown', e => { if (inBand(e)){ e.stopImmediatePropagation(); try { SFX.unlock(); } catch (x) {} } }, true);
    window.addEventListener('mouseup', e => { if (!inBand(e)) return; e.stopImmediatePropagation(); if (e.button !== 0) return; const q = D.campQ(); D.campClick(e.clientX / q, e.clientY / q); }, true); }
  wireCamp(); window.addEventListener('load', wireCamp);

  /* F-27.3a self-test rows (run from D.selfTest; D.CAMPN rows) */
  D.campTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push('camp: ' + m); };
    const M0 = META, G0 = typeof G !== 'undefined' ? G : null, ctx0 = ctx, VW0 = VW, VH0 = VH, mouse0 = D.mouse, camp0 = D.camp, U = window.UX83 = window.UX83 || {}, UXf = U.folded;
    let hits = 0;
    const mkTb = (fold, f25) => { const tb = document.createElement('div');
      const add = (t, oc, cls) => { const b = document.createElement('button'); b.className = 'tb' + (cls ? ' ' + cls : ''); b.textContent = t; b.setAttribute('onclick', oc); b.onclick = () => { hits++; }; tb.appendChild(b); return b; };
      const chip = document.createElement('span'); chip.className = 'stat'; chip.textContent = 'Ledger: upkeep -30gp'; chip.onclick = () => {}; tb.appendChild(chip);
      add('PLANNING TABLE', 'openTable()', 'gold'); add('HIRE', "centreCamOn(HUB.fire.x, HUB.fire.y);openPanel('fire','fire')"); add('ROSTER', 'openRoster()'); add('QUARTERMASTER', 'openCamp()');
      const rest = [f25 ? ['CHRONICLE', "openScribeBook()"] : ['MANUAL', 'openManual()'], ['PORTRAITS', 'openPortraitStudio()'], ['SETTINGS', 'toggleSettings()']];
      if (fold){ const fb = rest.map(r => { const b = document.createElement('button'); b.className = 'tb'; b.textContent = r[0]; b.setAttribute('onclick', r[1]); b.onclick = () => { hits++; }; return b; });
        U.folded = fb; const mb = document.createElement('button'); mb.id = 'ux-tbmenu-btn'; mb.textContent = '☰'; tb.appendChild(mb); }
      else rest.forEach(r => add(r[0], r[1]));
      return tb; };
    ok(camp0 === false && !document.body.classList.contains('deck-camp'), 'the camp band is OFF by default (Patrick 2026-11-13): the old top bar and hint strip');
    try {
      D.camp = true;   // the rows below test the band behind its flag
      META = Object.assign({}, M0, {cp: null});   // the main camp (a story camp keeps its Manual and has no Chronicle)
      const A = D.campActions(mkTb(false)), icons = A.map(a => a.icon);
      ok(icons.filter(i => i === 'book').length === 1 && !A.some(a => a.manual), 'ONE book button, the Manual folded into it: ' + icons.join(','));
      ok(icons.join(',') === 'table,hire,roster,quarter,book,portrait,cog,help', 'every top-bar action has its icon, in order, and the "?" last: ' + icons.join(','));
      ok(A.find(a => a.icon === 'roster').key === 'R' && A.find(a => a.icon === 'book').key === 'C', 'the camp\'s own keys on the buttons (R, C)');
      { const F25 = D.campActions(mkTb(false, true)), fi = F25.map(a => a.icon); hits = 0; const bk = F25.find(a => a.icon === 'book'); if (bk && bk.el) bk.el.onclick();
        ok(fi.filter(i => i === 'book').length === 1 && fi.join(',') === 'table,hire,roster,quarter,book,portrait,cog,help' && bk.el && hits === 1, "F-25's CHRONICLE button in the top bar: still ONE book, and it is F-25's own button: " + fi.join(',')); }
      const F = D.campActions(mkTb(true)).map(a => a.icon);
      ok(F.join(',') === icons.join(','), 'the ux.js fold below 1280 px: the band still shows Portraits and Settings: ' + F.join(','));
      { const cv = document.createElement('canvas'); cv.width = 24; cv.height = 24; ctx = cv.getContext('2d'); const sig = [];
        Object.keys(IC).forEach(k2 => { ctx.clearRect(0, 0, 24, 24); D.campIcon(k2, 0, 0, 24, '#ffffff'); const d = ctx.getImageData(0, 0, 24, 24).data; let b = ''; for (let i = 3; i < d.length; i += 4) b += d[i] > 60 ? 1 : 0; sig.push(b); });
        let same = 0; for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++){ let df = 0; for (let q = 0; q < 576; q++) if (sig[i][q] !== sig[j][q]) df++; if (df < 40) same++; }
        ok(same === 0, 'the action icons are all distinct pictures'); }
      const P = (M0 && M0.leader) || {name: 'Hal', level: 1, ticks: 0, spec: 'SOLDIER', race: 'HUMAN', cls: 'FREEMAN', sex: 'm', id: 899, injuries: [], adv: 0, picks: []}; ok(!!P, 'a Leader for the fixture (its own Leader, or a fixed SOLDIER when the save has none: QA, 17 Nov, DECK 66/8)');
      const mk = (name, extra) => Object.assign({name, race: P.race, spec: 'SOLDIER', cls: P.cls, id: 800 + name.length * 7 + name.charCodeAt(0), sex: 'f', injuries: [], adv: 0}, extra || {});
      const inj = (typeof INJURIES !== 'undefined' && INJURIES[0]) ? INJURIES[0] : null;
      const roster = [mk('Ada', {resting: 1}), mk('Bo', {away: true}), mk('Cy', {injuries: inj ? [inj.id] : []}), mk('Di', {adv: 2})];
      for (let i = 0; i < 8; i++) roster.push(mk('Ex' + i));
      META = Object.assign({}, M0, {leader: P, roster, treasury: 321, ambition: {track: Object.keys(AMBITIONS)[0], done: 4}, build: {a: 1}, cp: null});
      G = null; const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 620; ctx = cv.getContext('2d'); VW = 1000; VH = 620;
      const tb = mkTb(false); const real = document.getElementById('topbar'); if (real) real.id = 'topbar-real'; tb.id = 'topbar'; tb.style.display = 'none'; document.body.appendChild(tb);
      const mo = {x: -1, y: -1}; D.mouse = () => mo;
      try { D.campBand();
        const kinds = D.crects.map(r => r.kind);
        ok(kinds.filter(x => x === 'cleader').length === 1 && kinds.filter(x => x === 'act').length === 8 && kinds.includes('cgp') && kinds.includes('cdue') && kinds.includes('cseason') && kinds.includes('camb'), 'the band: Leader card, eight action buttons, Treasury, upkeep, season, Ambition: ' + kinds.join(','));
        const nm = kinds.filter(x => x === 'cmate').length, more = D.crects.find(r => r.kind === 'cmore');
        ok(nm >= 3 && more && nm + more.n === roster.length && D.crects.every(r => r.x >= 0 && r.x + r.w <= VW && r.y >= VH - D.H), 'roster cards while they fit, then +N; all inside the band: ' + nm + ' + ' + (more && more.n));
        ok(D.campTone(roster[0]) === 'rest' && D.campTone(roster[1]) === 'away' && D.campTone(roster[3]) === 'up', 'resting and detached mates are marked');
        const cy = D.crects.find(r => r.kind === 'cmate' && r.p === roster[2]), L = D.campLines(cy);
        ok(!inj || (L && L.some(l => l[0].indexOf(inj.name) >= 0)), 'an injured mate\'s hover names the injury');
        const ro = D.crects.find(r => r.kind === 'act' && r.a.icon === 'roster'); hits = 0; D.campClick(ro.x + 4, ro.y + 4);
        ok(hits === 1 && D.campClick(VW / 2, 40) === false, 'a click on a button runs the top bar\'s own button; a click off the band is not taken');
        const amb = D.campLines(D.crects.find(r => r.kind === 'camb'));
        ok(amb && /4 of 10/.test(amb[0][0]), 'the Ambition hover: 4 of 10 and the next milestone');
        D.camp = false; ok(D.campOn() === false, 'rollback: DECK.camp = false and the band is off');
      } finally { tb.remove(); if (real) real.id = 'topbar'; }
    } catch (e) { fails.push('camp threw: ' + (e && e.message || e)); }
    META = M0; G = G0; ctx = ctx0; VW = VW0; VH = VH0; D.mouse = mouse0; D.camp = camp0; D.crects = []; U.folded = UXf;
    return fails; };
  D.CAMPN = 15;

  /* ---- self-test (REG addons gate) ---- */
  D.selfTest = function(){
    const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
    const G0 = G, M1 = (typeof META !== "undefined") ? META : null, helped = D.helped, kit0 = D.kitOf, mouse0 = D.mouse, lh0 = D.lastHit, seen0 = D.seen, pp0 = [D._ppG, D._ppN, D._ppFrom, D._ppF]; D.seen = () => true;
    const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 620;
    const ctx0 = ctx, VW0 = VW, VH0 = VH;
    try {
      ok(typeof D.draw === 'function' && typeof D.click === 'function' && typeof D.brace === 'function', 'the module exports draw, click, brace');
      const P = (META && META.leader) || {name: 'Hal', level: 1, ticks: 0, spec: 'SOLDIER', race: 'HUMAN', cls: 'FREEMAN', sex: 'm', id: 899, injuries: [], adv: 0, picks: []}; ok(!!P, 'a Leader for the fixture (its own Leader, or a fixed SOLDIER when the save has none: QA, 17 Nov, DECK 66/8)');
      if (!META || !META.leader) META = Object.assign({}, META || {}, {leader: P});   // D.draw draws nothing without META.leader; the save's own META is put back at the end
      const mk = (name, spec, state) => ({p: {name, race: P ? P.race : 'HUMAN', spec, cls: 'FREEMAN', id: 900 + name.length, sex: 'f', injuries: [], adv: 0, picks: []}, s: {con: 4}, con: state === 'hurt' ? 1 : 3, maxCon: 4, state: state === 'hurt' ? 'up' : state, spec, x: 0, y: 0});
      /* the fixture leader is a fixed SOLDIER: squadSpecs() seeds with G.leader.spec, so a live leader of another spec (a
         Scoundrel) made a fifth button and failed the four-button row (Director, 2026-11-12: 27/28 in a live tab) */
      const fx = {leader: {x: 500, y: 300, con: 5, maxCon: 6, wounds: 2, maxWounds: 3, down: false, s: {luck: 3}, spec: 'SOLDIER', p: P},
        squad: [mk('Mira', 'MAGE', 'up'), mk('Tam', 'CLERIC', 'bleeding'), mk('Jo', 'MAGE', 'dead'), mk('Bel', 'FOLK_HERO', 'hurt')],
        abil: {SOLDIER: {cd: 0}, CLERIC: {cd: 300, max: 600}, MAGE: {cd: 0}, FOLK_HERO: {cd: 0}}, formation: 'OPEN', stagger: 0, wards: 2, shieldPool: 1, shieldMax: 3, mountMax: 0, mountPool: 0, armour: {name: 'Padded', ac: 11},
        luck: 2, favour: 1, favourMax: 2, coin: 42, kills: 3, lvl: 2, xp: 40, xpNext: 100, momFlash: 0, streak: 0, streakT: 0, msgs: [{t: 'hello', life: 30}], fx: [], frame: 100, sec: 65, alarm: 1,
        obj: 'vault', vaults: [{done: true}, {done: false}], camps: [], contract: {title: 'The Mill Job', tier: 1}, exitOpen: false, chargeT: 0, stormT: 0, smokeT: 0, fogT: 10, witherT: 0, illusionT: 0, baneT: 0,
        shaken: false, broken: false, tip: null, momChoice: null, momHidden: false, over: false, paused: false, enemies: [], allies: [], showMini: false, flash: 0, shoutT: 0, grinT: 0, lastContact: 0, quicken: 0, abilQ: []};
      fx.squad[0].p.adv = 2; fx.squad[3].p.adv = 5;

      const KIT = {armour: {name: 'Padded Jack', cost: 0}, shield: {name: 'Buckler', cost: 40}, melee: {name: 'Arming Sword', cost: 150, dmg: 2, cd: 0.9}, ranged: {name: 'Heavy Crossbow', cost: 240}, kits: []};
      D.kitOf = () => KIT; D.mouse = () => ({x: -1, y: -1});
      G = fx; ctx = cv.getContext('2d'); VW = 1000; VH = 620;
      let threw = null; try { D.draw(); } catch (e) { threw = e; }
      ok(!threw, 'draw on a fixture does not throw: ' + (threw && threw.message));
      { const A = window.ARM, ak = A && A.kitOf; let fk = null; if (A) A.kitOf = () => null; try { fk = kit0(); } finally { if (A) A.kitOf = ak; }
        ok(fk && fk.armour === fx.armour && fk.melee === null, 'in the story (no armoury kit) the squad kit falls back to the rows the run wears'); }
      if (typeof CAMP !== 'undefined'){ const cm = CAMP.mouse, u = UXo(), ih = u && u.inHud; let mm = null; CAMP.mouse = {x: 250, y: 125}; if (u) u.inHud = false; D.kq = 1.25;
        try { mm = mouse0(); } finally { D.kq = 0; CAMP.mouse = cm; if (u) u.inHud = ih; }
        ok(mm && mm.x === 200 && mm.y === 100, 'the hover panel reads the mouse in HUD units at wireTop\'s pinned scale (was 1 there: the Leader\'s panel opened over a kit card)'); }
      ok(D.rects.filter(r => r.kind === 'mate').length === 4 && D.rects.some(r => r.kind === 'leader'), 'a card per mate and the Leader card');
      const ab = D.rects.filter(r => r.kind === 'ability'), AH = Math.min(96, D.H - 16); ok(ab.length === 4 && new Set(ab.map(r => r.spec)).size === 4 && ab.every(r => r.w >= 44 && r.w <= 72 && r.h === AH), 'four ability buttons, 44-72 wide, ' + AH + ' tall, one per spec: ' + ab.length + ' ' + ab.map(r => r.spec + ' ' + r.w + 'x' + r.h).join(', '));
      /* Q94 (audits/specs/q94-ability-row.md §1): the ability row, one card per unit with an ability, sized to the room left of the right column */
      { const sq0 = fx.squad, want = {1351: {1: 112, 2: 112, 3: 112, 4: 112, 5: 112, 6: 102}, 1216: {1: 112, 2: 112, 3: 112, 4: 112, 5: 97, 6: 80}}, got = [];
        const live0 = window.ABIL33 && ABIL33.live; if (live0) ABIL33.live = () => true;   // test only: the fixture has no books, the row needs the F-33 system on
        try { for (const vw of [1351, 1216]) for (let n = 1; n <= 6; n++){ VW = vw; fx.squad = []; for (let i = 0; i < n - 1; i++) fx.squad.push(mk('Q' + i, 'MAGE', 'up')); D.rects = []; D.abilRow = null; D.band();
              const R = D.abilRow, rs = D.rects.filter(r => r.kind === 'abil33'); got.push(vw + '/' + n + ':' + (R ? R.n + 'x' + R.aw + (R.wide ? 'w' : 'c') : 'none'));
              if (!R || R.n !== n) continue;
              ok(R.aw === want[vw][n], 'Q94 row at VW ' + vw + ', ' + n + ' cards: width ' + R.aw + ', the spec says ' + want[vw][n]);
              ok(rs.length === n && rs.every(r => r.w === R.aw && r.h === R.h && r.x >= R.x && r.x + r.w <= vw - 168), 'Q94 row at VW ' + vw + ', ' + n + ' cards: all inside the room left of the right column'); }
        } finally { if (live0) ABIL33.live = live0; fx.squad = sq0; VW = 1000; D.rects = []; D.abilRow = null; D.band(); }
        ok(got.every(x => !/none/.test(x)), 'Q94 the row draws for each fixture size: ' + got.join(' ')); }
      { const ks = D.rects.filter(r => r.kind === 'kit'), Lr = D.rects.find(r => r.kind === 'leader'), Fr = D.rects.find(r => r.kind === 'formation');      // F-27.2: the squad kit
        ok(ks.length === 4 && ks.map(r => r.slot + r.band).join() === 'melee2,ranged3,armour0,shield1' && ks.every((r, i) => r.x >= Fr.x && r.x + r.w <= Fr.x + Fr.w && r.y >= Fr.y + Fr.h && r.h > r.w && (!i || r.x > ks[i - 1].x + ks[i - 1].w)), 'the squad kit (v5): four upright little cards in a row in the right-hand panel under the formation, bare/common/fine/masterwork by cost: ' + ks.map(r => r.slot + r.band + ' ' + r.w + 'x' + r.h).join(', '));
        const ma = D.momAt; ok(D.coinAt && ma && D.coinAt.x0 >= ma.x + ma.w && D.coinAt.y1 <= ma.y + ma.h && D.coinAt.x1 <= VW - 248, 'coin and kills (v6) sit beside Momentum, clear of In Sight: ' + JSON.stringify(D.coinAt));
        ok(ks[0].x === Fr.x && ks.every(r => r.w === 24), 'the kit row (v6): card-size cards from the left of the panel, room to their right for kits and mounts');
        const la = D.luckAt, lt = D.leaderAt; ok(la && lt && la.x >= Lr.x && la.x + la.w <= Lr.x + Lr.w && la.y > lt.py + lt.S + 20 && la.y + 12 <= Lr.y + Lr.h && la.solid === 2 && la.spent === 1, 'Luck (v7) last on the Leader card, under the pips: a pip per point of the stat, 2 solid, 1 spent');
        ok(lt.S === D.PS && lt.py === Lr.y + 5 && Math.abs(lt.px + lt.S / 2 - (Lr.x + Lr.w / 2)) <= 1, 'the Leader card (v7) has the mates\' layout: portrait on top, centred, at their size');
        { const seen = [], ft = ctx.fillText; ctx.fillText = function(t){ seen.push(String(t)); return ft.apply(this, arguments); }; D.rects = []; try { D.band(); } finally { ctx.fillText = ft; }
          const nm = ab.map(r => ABILITIES[r.spec].name.slice(0, 5));
          ok(!seen.some(t => nm.some(q => t.startsWith(q)) || /can cast|ready|cooling|no caster|^\d+s$/.test(t)) && ab.every(r => seen.includes(ABILITIES[r.spec].key)), 'v6: the ability buttons carry no words, only their key numbers: ' + seen.join('|'));
          ok(!seen.some(t => /Favour|Squad|^kit$|coin|slain/.test(t)), 'v6: no Favour line, no Squad kit label, no coin line on the band');
          ok(!seen.some(t => /^(Ready|Fighting|Moving|Lagging|Hit|Hurt|Bleeding|Down|Dead|Shaken|Broken|DOWN|Luck)$|^W \d|Con \d|^Lvl/.test(t)), 'v7: no status words on the cards, no Luck label, no W/Con numbers: ' + seen.join('|'));
          ok(D.tone(fx.squad[2]) === 'dead' && D.tone(fx.squad[1]) === 'down' && D.tone(fx.squad[0]) === 'up' && D.tone(fx.leader) === 'up', 'v7: card tones: dead grey, bleeding red, up plain');
          { const px = sp => { const c2 = document.createElement('canvas'); c2.width = c2.height = 24; const g = c2.getContext('2d'), k0 = ctx; ctx = g; try { D.abilArt(sp, 0, 0, 24, '#ffffff'); } finally { ctx = k0; } return g.getImageData(0, 0, 24, 24).data; };
            const sps = ['SOLDIER', 'FOLK_HERO', 'SCOUNDREL', 'CLERIC', 'MAGE', 'WITCH'], im = sps.map(px); let worst = 1e9, pair = '';
            for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++){ let d = 0; for (let q = 3; q < im[i].length; q += 4) if ((im[i][q] > 96) !== (im[j][q] > 96)) d++; if (d < worst){ worst = d; pair = sps[i] + '/' + sps[j]; } }
            ok(sps.every(sp => typeof D.ART[sp] === 'function') && worst >= 60, 'v7: six new ability pictures, each unlike the others (least different pair ' + pair + ': ' + worst + ' of 576 px)'); }
          { const ab = typeof luckAfterBurn === 'function' ? luckAfterBurn : null, on0 = typeof LUCK_SOLID !== 'undefined' && LUCK_SOLID.on;
            ok(typeof ab === 'function' && on0 && ab(2, 1, 2) === 1 && ab(3, 1, 4) === 2 && ab(0, 1, 2) === 0 && ab(3, 2, 3) === 1 && ab(1, 2, 1) === 0, 'v7.1: a Luck burn takes a solid pip first (2 solid of 3, burn 1: 1 solid of 2; no solid left: a spent one goes; standing up burns 2)'); }
          { fx.mountMax = 0; D.mouse = () => ({x: -1, y: -1}); const Fb = D.rects.find(r => r.kind === 'formation'), bl = D.panelLines(Fb).map(l => l[0]).join(' | ');
            ok(D.WARDC !== D.POOLC && D.WARDC !== C.gold && /Ward Tokens 2\/4/.test(bl) && /Shield Pool 1\/3/.test(bl) && /soaks/.test(bl), 'v7: wards and pool in their own colours; the badge\'s hover explains them: ' + bl); }
          const cl = D.rects.find(r => r.kind === 'ability' && r.spec === 'CLERIC'); ok(cl && D.favAt && hit(cl, D.favAt.x, D.favAt.y) && D.favAt.n === 1 && D.favAt.max === 2, 'v6: the Favour pips are on the Cleric button: ' + JSON.stringify(D.favAt));
          const Fs = D.rects.filter(r => r.kind === 'formation'), sa = D.stanceAt; ok(Fs.length === 1 && sa.name === 'Open Order' && hit(Fs[0], sa.wards.x, sa.wards.y) && sa.pool && hit(Fs[0], sa.pool.x, sa.pool.y), 'v6: one stance badge reading Open Order, the ward and shield-pool pips on it');
          fx.formation = 'SHIELD'; D.rects = []; D.band(); const s1 = D.stanceAt.name; fx.formation = 'OPEN'; fx.stagger = 5; D.rects = []; D.band(); const s2 = D.stanceAt.name, c2 = D.stance().col; fx.stagger = 0; D.rects = []; D.band();
          ok(s1 === 'Shield Wall' && s2 === 'Staggered' && c2 === D.STANCE.stagger.col, 'v6: the badge reads Shield Wall braced, and red Staggered while bracing is blocked: ' + s1 + ', ' + s2);
          { const pp = [D._ppG, D._ppN, D._ppFrom, D._ppF], sp0 = fx.shieldPool, nb0 = fx.noBraceF;
            try {
              const strokes = [], st = ctx.stroke;
              ctx.stroke = function(){ strokes.push(String(this.strokeStyle).toLowerCase()); return st.apply(this, arguments); };
              fx.noBraceF = fx.frame - 4; D.rects = [];
              try { D.band(); } finally { ctx.stroke = st; fx.noBraceF = nb0; }
              ok(strokes.includes('#ff8a7a'), 'U2 cue: stanceBadge strokes #ff8a7a when fx.noBraceF = fx.frame - 4');
              D._ppG = fx; D._ppN = sp0 | 0; D._ppFrom = 0; D._ppF = -999;
              const base = [], fills1 = [], fills2 = [], edges1 = [], edges2 = [], rc = ctx.rect, fr = ctx.fillRect, sr = ctx.strokeRect;
              let curF = fills1, curE = edges1;
              ctx.rect = function(x, y, w, h){ base.push({x, y, w, h}); return rc.apply(this, arguments); };
              ctx.fillRect = function(x, y, w, h){ if (String(this.fillStyle).toLowerCase() === D.POOLC.toLowerCase()) curF.push(w); return fr.apply(this, arguments); };
              ctx.strokeRect = function(x, y, w, h){ if (String(this.strokeStyle).toLowerCase() === '#ffe9a8') curE.push(w); return sr.apply(this, arguments); };
              try {
                D.rects = []; D.band();
                const pl = D.stanceAt && D.stanceAt.pool, bws = base.filter(b => pl && b.y === pl.y && b.x >= pl.x && b.w === b.h).map(b => b.w);
                curF = fills2; curE = edges2; fx.shieldPool = sp0 + 2; D.rects = []; D.band();
                ok(bws.length === fx.shieldMax && !fills1.length && !edges1.length && fills2.length === 2 && edges2.length === 2 && fills2.every(w => w > bws[0]) && edges2.every(w => w > bws[0]),
                  'U2 cue: raising fx.shieldPool by 2 draws the 2 new pips larger on the second draw: ' + bws[0] + ' -> ' + fills2.join(','));
              } finally { ctx.rect = rc; ctx.fillRect = fr; ctx.strokeRect = sr; }
            } finally { [D._ppG, D._ppN, D._ppFrom, D._ppF] = pp; fx.shieldPool = sp0; fx.noBraceF = nb0; D.rects = []; D.band(); } }
          D.mouse = () => ({x: cl.x + 4, y: cl.y + 30}); const ha = D.hover(), al = D.panelLines(cl).map(l => l[0]).join(' | '); D.mouse = () => ({x: -1, y: -1});
          ok(ha && ha.kind === 'ability' && /Cure Wounds/.test(al) && /Favour 1\/2/.test(al) && /No one can cast/.test(al) && /Condition/.test(al), 'v6: an ability\'s hover panel has its name, state, Favour and text: ' + al); }
        ok(D.gearStats({dmg: 2, cd: 0.9}) === 'damage 2 · 10% faster' && D.gearStats({ac: 12, shift: 1}) === 'AC 12 · +1 armour step' && D.gearStats({pool: 2}) === 'Shield Pool 2' && D.gearStats(null) === '', 'gear stats read out for the hover panel');
        ok(D.costBand({cost: 99}) === 1 && D.costBand({cost: 100}) === 2 && D.costBand({cost: 199}) === 2 && D.costBand({cost: 200}) === 3 && D.costBand(null) === 0, 'cost bands: <100 common, <200 fine, 200+ masterwork, none bare');
        ok(D.click(ks[0].x + 2, ks[0].y + 2) === true, 'a click on a kit card is swallowed');
        const pl = D.panelLines(ks[0]); ok(pl && /Melee: Arming Sword/.test(pl[0][0]) && /fine/.test(pl[1][0]) && /damage 2/.test(pl[2][0]), 'a kit card\'s hover names it, its band and its stats');
        const lp = D.panelLines(Lr).map(l => l[0]).join(' | '); ok(/AC 11/.test(lp) && /Wounds 2\/3/.test(lp) && /Heavy Crossbow/.test(lp) && /Luck 2\/3 · \[Q\] spend · \[R\] burn/.test(lp), 'the Leader\'s hover panel: wounds, Luck, armour and AC, the squad kit: ' + lp);
        const mr = D.rects.filter(r => r.kind === 'mate'), mp = D.panelLines(mr[0]).map(l => l[0]).join(' | '); ok(/2 Advancements/.test(mp) && /Condition 3\/4/.test(mp), 'a mate\'s hover panel: rank and Condition: ' + mp);
        D.mouse = () => ({x: mr[0].x + 4, y: mr[0].y + 4}); const hp = D.hover(); ok(hp && hp.kind === 'mate' && hp.y + hp.h <= VH - D.H && hp.y >= 0, 'the hover panel opens above the band');
        D.mouse = () => ({x: ks[0].x + 2, y: ks[0].y + 2}); const hk = D.hover(); ok(hk && hk.kind === 'kit', 'over a stub, the stub\'s panel wins over the card\'s'); D.mouse = () => ({x: -1, y: -1}); }
      { const L = fx.leader;                                                         // F-27.2: In Sight
        const en = (k, dx, dy, o) => Object.assign({k, x: L.x + dx, y: L.y + dy, con: 3}, o || {}), ks = Object.keys(BESTIARY).filter(k => !BESTIARY[k].boss).slice(0, 2);
        fx.enemies = [en(ks[0], 40, 0), en(ks[0], -60, 20), en(ks[1], 100, -40), en(ks[1], 2000, 0), en(ks[0], 50, 10, {dormant: true}), en(ks[1], 30, 0, {dead: true})];
        D.lastHit = {k: ks[1], f: fx.frame}; const s = D.inSight();
        ok(s.length === 2 && s[0].k === ks[1] && s[0].hit && s[0].n === 1 && s[1].n === 2, 'In Sight: grouped with counts, off-screen, dormant and dead left out, the last hitter first: ' + JSON.stringify(s.map(g => [g.k, g.n, g.hit])));
        const drawn = D.sight(); ok(drawn.length === 2, 'In Sight draws its list'); fx.enemies = []; ok(D.inSight().length === 0, 'In Sight is empty with no enemies');
        /* P23-BUG-7 rows: a steady box */
        const sv23 = window.SIGHT23, f0 = fx.frame | 0; window.SIGHT23 = true; D.s23 = null;
        const ord = () => [...D.s23.rows.values()].sort((a, b) => (b.boss - a.boss) || (a.seq - b.seq)).map(r => r.key + (r.held ? '~' : '') + (r.hit ? '>' : ''));
        try {
          fx.enemies = [en(ks[0], 40, 0)]; D.lastHit = null; D.sight();
          fx.frame = f0 + 1; fx.enemies = [en(ks[0], 40, 0), en(ks[1], 60, 0), en(ks[1], 70, 0), en(ks[1], 80, 0)]; D.sight(); const HT = () => window.UX83 && UX83.hintTop ? UX83.hintTop() : -1;   /* Neon R6 BUG-7 M3: the hints live on UX83 (window.UX never exists, so this read 0 === 0) */ HT(); D.sight(); const h1 = D.sightFixH, y1 = HT();
          ok(ord().join() === ks[0] + ',' + ks[1], 'P23-BUG-7: rows keep first-seen order, not count order: ' + ord());
          fx.frame = f0 + 2; D.lastHit = {k: ks[1], f: fx.frame}; D.sight(); ok(ord().join() === ks[0] + ',' + ks[1] + '>', 'P23-BUG-7: a hit marks ▶ in place, no swap: ' + ord());
          fx.frame = f0 + 3; fx.enemies = [en(ks[1], 60, 0)]; D.lastHit = null; D.sight(); ok(ord().join() === ks[0] + '~,' + ks[1], 'P23-BUG-7: a kind that leaves sight holds its row: ' + ord());
          fx.frame = f0 + 2 + D.HOLD23 - 1; D.sight(); ok(ord().length === 2, 'P23-BUG-7: the held row stays for the hold');
          fx.frame = f0 + 2 + D.HOLD23 + 1; D.sight(); ok(ord().join() === ks[1], 'P23-BUG-7: after the hold the held row goes: ' + ord());
          fx.frame += 1; fx.enemies = []; D.sight(); const y2 = HT();
          ok(D.sightFixH === h1 && h1 === 26 + D.SIGHT * D.sightRH + D.sightMH && D.sightAt && y1 > 0 && y1 === y2, 'P23-BUG-7: the box height is fixed (' + h1 + ') and the hints keep their place with 2 kinds or none (' + y1 + ' / ' + y2 + ')');
        } finally { window.SIGHT23 = sv23; D.s23 = null; fx.enemies = []; fx.frame = f0; } }
      { fx.enemies = [{k: 'FAR', x: 300, y: 0, atkT: 14}, {k: 'NEAR', x: 5, y: 0, atkT: 14}, {k: 'IDLE', x: 1, y: 0, atkT: 0}]; D.lastHit = null;
        D.markHit({x: 0, y: 0}); ok(D.lastHit && D.lastHit.k === 'NEAR' && typeof hurtSquad === 'function' && hurtSquad.__deck === true, 'the last hit: the swinging enemy nearest the victim, marked from hurtSquad');
        fx.enemies = []; }
      ok(typeof togglePause === 'function' && togglePause.__deck === true && /SPACE/.test(D.LEGEND), 'the pause screen gets the key legend line');
      ok(D.rects.some(r => r.kind === 'formation'), 'the formation toggle is on the band');
      ok(D.rects.every(r => r.y >= VH - D.H && r.y + r.h <= VH), 'everything clickable sits inside the band');
      ok(D.mateStatus(fx.squad[1])[0] === 'Bleeding' && D.mateStatus(fx.squad[2])[0] === 'Dead' && D.mateStatus(fx.squad[3])[0] === 'Hurt' && D.mateStatus(fx.squad[0])[0] === 'Ready', 'status words: Ready, Bleeding, Dead, Hurt');
      ok(fx.msgs.length === 1 && fx.msgs[0].life === 29, 'the message log still ages');
      ok(D.H <= 132 && D.H / VH <= 0.22, 'the band is at most 22% of the frame: ' + D.H + '/' + VH);
      const R = D.rects.find(r => r.kind === 'leader'); ok(R && R.y + R.h <= VH - 4 && R.h <= D.H - 12, 'the cards fit the shorter band');
      { const mm = fx.squad[0], f0 = fx.frame;                                     // live status words
        mm.atkT = 8; ok(D.mateStatus(mm)[0] === 'Fighting', 'a mate swinging reads Fighting'); mm.atkT = 0;
        fx.frame = f0 + D.FIGHT + 1; mm.moving = true; ok(D.mateStatus(mm)[0] === 'Moving', 'Fighting fades; a walking mate reads Moving'); mm.moving = false;
        mm.inF = false; ok(D.mateStatus(mm)[0] === 'Lagging', 'out of formation reads Lagging'); mm.inF = true;
        mm.con = 2; ok(D.mateStatus(mm)[0] === 'Hit', 'a lost point of Condition reads Hit');
        fx.frame += D.HIT + 1; ok(D.mateStatus(mm)[0] === 'Ready', 'Hit fades back to Ready'); mm.con = 3; fx.frame = f0; }
      { const VO = window.VO3, saved = VO && VO.on, want = Math.round((VH - D.H) * (0.5 + ((VO && VO.on && VO.K && VO.K.frameDown) || 0)) - VH / 2);
        ok(typeof camDY === 'function' && camDY() === want && D.leaderRow() < VH - D.H, 'the camera puts the Leader on the open field\'s standard row: ' + (typeof camDY === 'function' && camDY()) + ' vs ' + want);
        if (VO && VO.perspAt){ ok(Math.abs(VO.perspAt(D.leaderRow()) - 1) < 1e-9 && VO.perspAt(600, 1000) === VO.perspAt.call(VO, 600, 1000), 'the depth scale is 1 on the Leader\'s row'); }
        else ok(true, 'no VO3: depth scale not in play');
      }
      let used = null; const u0 = useAbility; useAbility = s => { used = s; };
      try { const r = ab[0]; ok(D.click(r.x + 5, r.y + 5) === true && used === r.spec, 'a click on an ability button casts it');
        fx.momChoice = {opts: []}; fx.momHidden = false; used = null; D.click(r.x + 5, r.y + 5); ok(used === r.spec, 'casts while the Momentum choice is open (F-41: no pause)'); fx.momChoice = null; }
      finally { useAbility = u0; }
      const f = D.rects.find(r => r.kind === 'formation'); D.click(f.x + 3, f.y + 3); ok(fx.formation === 'SHIELD', 'a click on the toggle braces');
      D.click(f.x + 3, f.y + 3); ok(fx.formation === 'OPEN', 'a second click opens the order');
      fx.stagger = 5; D.click(f.x + 3, f.y + 3); ok(fx.formation === 'OPEN', 'staggered: the toggle refuses, as SPACE does'); fx.stagger = 0;
      ok(D.click(VW / 2, 50) === false, 'a click off the band is not taken');
      D.rects = []; threw = null; try { drawHUD(); } catch (e) { threw = e; }
      ok(!threw && D.rects.length > 0, 'the wrapped drawHUD reaches the HD1 guard and draws the Deck: ' + (threw && threw.message));
    } catch (e) { fails.push('threw: ' + (e && e.message || e)); }
    META = M1; G = G0; ctx = ctx0; VW = VW0; VH = VH0; D.helped = helped; D.rects = []; D.kitOf = kit0; D.mouse = mouse0; D.lastHit = lh0; D.seen = seen0; [D._ppG, D._ppN, D._ppFrom, D._ppF] = pp0;
    try { D.campTest().forEach(f => fails.push(f)); } catch (e) { fails.push('camp: ' + e.message); }   // F-27.3a
    return {ok: fails.length === 0, n: 67 + D.CAMPN, fails};   // +6: P23-BUG-7 rows
  };
  /* F-33 guard (QA): the four-button bar is now per-unit buttons (js/combat/abilities-f33.js), so the old bar's rows run with
     ABIL33.live stubbed false for the length of the test (as in a brawl), and it comes back after */
  { const f = D.selfTest;
    D.selfTest = function(){
      const F = window.ABIL33, lv = F && F.live; if (lv) F.live = () => false;
      try { return f.apply(this, arguments); } finally { if (lv) F.live = lv; }
    }; }

  /* ---- F-43 deck layer (QA audits/f43-playability.md s2 item 3, "the deck HUD repaints every frame: repaint on change at 15 Hz and
     blit"; U10, "below k 1 the HUD softens: keep the deck HUD at full scale on its own layer"). In a live, unpaused field the Deck is
     drawn into its own canvas laid over the game canvas (z-index 1, under every HTML screen; clicks pass through to the game) at the
     screen's own pixel ratio, whatever the render scale. It is repainted at layerHz (15 a second), at once on a mouse move, a click
     or a key, and every frame while the Momentum choice is open; the frames between cost nothing. The edge pointers to the objective
     move with the camera, so they stay on the game canvas every frame. Paused, over, a parley, the camp: the layer hides and the Deck
     draws on the game canvas as before. ROLLBACK: DECK.layer = false. ---- */
  D.layer = true; D.layerHz = 15; D.layerPaints = 0;
  const LY = {cv: null, c: null, dk: 1, n: 0, last: -99, dirty: true, shown: false, drew: false, sig: ''};
  ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'wheel'].forEach(t => window.addEventListener(t, () => { LY.dirty = true; }, {passive: true, capture: true}));
  function lyHook(c, main){   // the layer's context: transforms scaled to its own pixels, and the main context's font, colour and text hooks
    const P = CanvasRenderingContext2D.prototype, st = P.setTransform, gt = P.getTransform;
    c.setTransform = function(a, b, cc, d, e, f){ const k = LY.dk; if (a && typeof a === 'object') return st.call(this, a.a * k, a.b * k, a.c * k, a.d * k, a.e * k, a.f * k); return st.call(this, a * k, b * k, cc * k, d * k, e * k, f * k); };
    c.resetTransform = function(){ st.call(this, LY.dk, 0, 0, LY.dk, 0, 0); };
    c.getTransform = function(){ const m = gt.call(this), k = LY.dk; return new DOMMatrix([m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k]); };
    for (const n of ['font', 'fillStyle', 'fillText']){ const dsc = Object.getOwnPropertyDescriptor(main, n); if (dsc) Object.defineProperty(c, n, dsc); else delete c[n]; }
    if (!c.__sw10 && window.SW10 && typeof SW10.hook === 'function') try { SW10.hook(c); } catch (e) {}
  }
  function lyHide(){ if (LY.cv && LY.shown){ LY.cv.style.display = 'none'; LY.shown = false; } LY.dirty = true; }
  D.layerOff = lyHide;
  /* UX C2-4 (eb9567aa): the 500 ms pool pulse and the 600 ms no-brace flash are cues, so 15 Hz can miss their peak: while one is live
     (or the pool has just grown and the pulse is about to start) the layer is due every frame, as for the Momentum choice */
  D.layerLive = g => !!g && ((D._ppG === g && ((g.shieldPool | 0) > D._ppN || (g.frame >= D._ppF && g.frame - D._ppF < 30)))
    || (!!g.noBraceF && g.frame >= g.noBraceF && g.frame - g.noBraceF < 36));
  function lyWanted(){
    return D.layer && on() && G.leader && !G.over && !G.paused && !(typeof PARLAY !== 'undefined' && PARLAY) && !window.SELFTEST && !D.inTest
      && typeof canvas !== 'undefined' && canvas && canvas.parentNode && typeof ctx !== 'undefined' && ctx && ctx.canvas === canvas;
  }
  { const f = D.draw;
    D.draw = function(){
      if (!lyWanted()) { lyHide(); return f.apply(this, arguments); }
      const main = ctx; LY.drew = true;
      try {
        const dk = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), cw = parseFloat(canvas.style.width) || canvas.clientWidth, chh = parseFloat(canvas.style.height) || canvas.clientHeight;
        const W = Math.round(cw * dk), H = Math.round(chh * dk);
        if (!LY.cv){ LY.cv = document.createElement('canvas'); LY.cv.id = 'deck-layer';
          LY.cv.style.cssText = 'position:absolute;left:0;top:0;z-index:1;pointer-events:none;display:none'; canvas.parentNode.insertBefore(LY.cv, canvas.nextSibling); LY.c = LY.cv.getContext('2d'); }
        const sig = [W, H, dk, cw, chh, canvas.offsetLeft, canvas.offsetTop].join('|');
        if (sig !== LY.sig){ LY.sig = sig; LY.cv.width = W; LY.cv.height = H; LY.cv.style.width = cw + 'px'; LY.cv.style.height = chh + 'px';
          LY.cv.style.left = canvas.offsetLeft + 'px'; LY.cv.style.top = canvas.offsetTop + 'px'; LY.dirty = true; }
        LY.dk = dk; LY.n++;
        const due = LY.dirty || !LY.shown || (G.momChoice && !G.momHidden) || D.layerLive(G) || LY.n - LY.last >= Math.max(1, Math.round(60 / Math.max(1, D.layerHz)));
        const P = CanvasRenderingContext2D.prototype, m = P.getTransform.call(main), kk = TXT.k || 1;
        if (due){
          const c = LY.c; lyHook(c, main);
          P.setTransform.call(c, 1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
          const r = dk / kk; P.setTransform.call(c, m.a * r, m.b * r, m.c * r, m.d * r, m.e * r, m.f * r);
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = main.imageSmoothingEnabled; c.textAlign = 'left'; c.textBaseline = main.textBaseline;
          const pt = D.pointers; D.pointers = function(){}; ctx = c;
          try { c.save(); try { f.apply(this, arguments); } finally { c.restore(); }
            if (D.hover){ c.save(); try { D.hover(); } catch (e) { console.error('DECK hover', e); } finally { c.restore(); } } }
          finally { ctx = main; D.pointers = pt; }
          LY.last = LY.n; LY.dirty = false; D.layerPaints++;
          if (!LY.shown){ LY.cv.style.display = 'block'; LY.shown = true; }
        }
        try { D.pointers(); } catch (e) { console.error('DECK pointers', e); }
      } catch (e) { ctx = main; console.error('DECK layer', e); D.layer = false; lyHide(); return f.apply(this, arguments); }
    }; }
  { const f = D.hover; if (typeof f === 'function') D.hover = function(){ if (LY.shown && ctx !== LY.c) return; return f.apply(this, arguments); }; }
  if (typeof draw === 'function'){ const f = draw;
    draw = function(){ LY.drew = false; const r = f.apply(this, arguments); if (!LY.drew && LY.shown) lyHide(); return r; }; }
  { const f = D.selfTest; D.selfTest = function(){ D.inTest = true; lyHide(); try { return f.apply(this, arguments); } finally { D.inTest = false; } }; }
  { const f = D.selfTest; D.selfTest = function(){   // UX C2-4: the live-cue test, on its own G and with the pulse state put back
      const r = f.apply(this, arguments), s = [D._ppG, D._ppN, D._ppF], g = {frame: 100, shieldPool: 2, noBraceF: 0};
      try { D._ppG = g; D._ppN = 2; D._ppF = -999; const quiet = !D.layerLive(g);
        g.shieldPool = 3; const grew = D.layerLive(g); g.shieldPool = 2; D._ppF = 90; const pulse = D.layerLive(g); D._ppF = 70; const done = !D.layerLive(g);
        g.noBraceF = 80; const flash = D.layerLive(g); g.noBraceF = 60; const over = !D.layerLive(g);
        if (!(quiet && grew && pulse && done && flash && over)) r.fails.push('C2-4: the layer is due every frame only while a pulse or flash is live (' + [quiet, grew, pulse, done, flash, over].join() + ')');
      } finally { [D._ppG, D._ppN, D._ppF] = s; }
      r.n++; r.ok = r.fails.length === 0; return r; }; }
})();
/* F-48 Art (sanity item 14): warm the painted faces while out of battle, so a fight never opens on the old pixel bust.
   A few people per pass, the whole living roster in turn; the face cache does the rest. Rollback: DECK.warmFaces = false. */
(function(){
  const D = window.DECK; if (!D) return; D.warmFaces = true; D.warmed = 0; let i = 0;
  D.warm = function(max){
    try { if (D.warmFaces === false) return 0;
      const M = (0, eval)('typeof META !== "undefined" ? META : null'); if (!M) return 0;
      const ppl = (M.roster || []).filter(p => p && !p.dead); let n = 0;
      if (M.leader) D.face(M.leader, true);
      for (let j = 0; j < ppl.length && n < (max || 6); j++, n++) D.face(ppl[(i + j) % ppl.length], false);
      i += n; D.warmed += n; return n;
    } catch (e) { return 0; } };
  setInterval(function(){ try { if ((0, eval)('typeof G !== "undefined" && G')) return; D.warm(6); } catch (e) {} }, 1500);
})();
