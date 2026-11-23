/* Q106 guard (spec rule 7): TEXTFLOOR106.selfTest() renders the camp's cards, gear, dashboard and advancement builders,
   the building panels, roster, War Table, Chronicle, Annals and the top bar with a temporary founded META, and fails on
   any text of 2+ letters drawn under 14 CSS px, spilling its own box, cut by an overflow ancestor, or ellipsised.
   It puts META, saveMeta, the screens and the overlays back as it found them. Test-only: nothing in the game calls it.
   ROLLBACK: delete this file and its <script> line in index.html. */
(function(){
  const T = window.TEXTFLOOR106 = {FLOOR: 14};

  // the on-screen scale of an element: its CSS transforms (the War Table seals) times nothing else
  const scaleOf = e => { let s = 1; for (let a = e; a && a !== document.body; a = a.parentElement){ const t = getComputedStyle(a).transform;
    if (t && t !== 'none'){ const m = t.match(/matrix\(([^,]+),\s*([^,]+)/); if (m) s *= Math.hypot(+m[1], +m[2]); } } return s; };
  const sel = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '');

  // every visible text node of 2+ letters under root -> problems
  T.scan = function(root){
    const out = [], W = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = W.nextNode());){
      const s = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!/[A-Za-z]{2}/.test(s)) continue;
      const e = n.parentElement; if (!e || !e.getClientRects().length) continue;
      const cs = getComputedStyle(e); if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      const r = document.createRange(); r.selectNodeContents(n); const rs = [...r.getClientRects()].filter(x => x.width > 0.5); if (!rs.length) continue;
      const px = parseFloat(cs.fontSize) * scaleOf(e), what = '"' + s.slice(0, 28) + '" in ' + sel(e);
      if (px < T.FLOOR - 0.05) out.push(what + ' at ' + px.toFixed(1) + 'px');
      let b = e; while (b && getComputedStyle(b).display === 'inline') b = b.parentElement; const bb = b.getBoundingClientRect();
      const L = Math.min(...rs.map(x => x.left)), R = Math.max(...rs.map(x => x.right)), Tp = Math.min(...rs.map(x => x.top)), B = Math.max(...rs.map(x => x.bottom));
      const sx = Math.max(bb.left - L, R - bb.right); if (sx > 1.5) out.push(what + ' spills its box by ' + sx.toFixed(1) + 'px');
      for (let a = b; a && a !== document.body; a = a.parentElement){ const c = getComputedStyle(a), ab = a.getBoundingClientRect();
        const cx = /hidden|clip/.test(c.overflowX) ? Math.max(ab.left - L, R - ab.right) : 0, cy = /hidden|clip/.test(c.overflowY) ? Math.max(ab.top - Tp, B - ab.bottom) : 0;
        if (cx > 1.5 || cy > 2){ out.push(what + ' cut by ' + sel(a) + ' (' + Math.max(cx, cy).toFixed(1) + 'px)'); break; } }
      if (cs.textOverflow === 'ellipsis' && b.scrollWidth > b.clientWidth + 1) out.push(what + ' ellipsised');
    }
    return out;
  };

  function seedMeta(){
    const m = freshMeta(); m.founded = true; m.deployments = 3; m.gold = 600;
    m.leader = makeLeader('HUMAN', 'FREEMAN', 'SOLDIER', 'Tester'); m.leader.level = 2; m.roster = [];
    for (const [r, c, s, n] of [['HUMAN', 'FREEMAN', 'SOLDIER', 'Bartholomew'], ['DWARF', 'FREEMAN', 'CLERIC', 'Odda'], ['HUMAN', 'FREEMAN', 'MAGE', 'Mate Three']]) m.roster.push(makeMate(r, c, s, n));
    for (const f of FACILITIES) m.facilities[f.id] = true;
    return m;
  }

  T.selfTest = async function(){
    const rows = [], ok = (name, probs) => { rows.push(probs.length ? 'FAIL ' + name + ': ' + probs.length + ' (' + probs.slice(0, 3).join('; ') + ')' : 'ok ' + name); };
    if (typeof freshMeta !== 'function' || typeof leaderCardHTML !== 'function') return ['FAIL camp builders missing'];
    const META0 = window.META, sv = window.saveMeta, P0 = window.CAMP && CAMP.panel;
    const ids = ['screen-roster', 'screen-table', 'camp-panel', 'topbar'], hid = ids.map(i => { const el = document.getElementById(i); return el ? el.classList.contains('hidden') : null; });
    const ovl = ['chronicle', 'annals'].map(i => { const el = document.getElementById(i); return el ? el.style.display : undefined; });
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;overflow:auto;z-index:99998;background:#efe3c8;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;padding:10px;box-sizing:border-box';
    const frag = async (name, html) => { box.innerHTML = html; await new Promise(r => requestAnimationFrame(() => r())); ok(name, T.scan(box)); };
    const shown = async (name, id, fn) => { try { fn(); } catch (e) { rows.push('FAIL ' + name + ' threw ' + String(e && e.message || e).slice(0, 80)); return; } const el = document.getElementById(id); if (!el){ rows.push('FAIL ' + name + ': no #' + id); return; }
      el.classList.remove('hidden'); if (el.style.display === 'none') el.style.display = ''; await new Promise(r => requestAnimationFrame(() => r())); ok(name, T.scan(el)); };
    try {
      window.saveMeta = () => {};
      const m = seedMeta(); window.META = m;
      try { m.board = [makeContract('hold', 1), makeContract('hold', 1), makeContract('extract', 2)]; } catch (e) {}
      document.body.appendChild(box);
      await frag('person cards', leaderCardHTML(m.leader) + m.roster.map(p => mateCardHTML(p)).join(''));
      for (const k of ['armour', 'gear']){ let h = ''; GEAR.filter(g => k === 'armour' ? g.slot === 'armour' : g.slot !== 'armour').forEach((g, i) => { const o = [{}, {owned: true}, {eq: true}, {locked: 'Armoury'}][i % 4];
        try { h += gearCardHTML(g, o) + gearCardHTML(g, Object.assign({mini: true}, o)); } catch (e) {} }); await frag(k + ' cards', h); }
      if (typeof dashboardHTML === 'function') await frag('dashboard', dashboardHTML());
      if (typeof advanceBlock === 'function'){ m.advRound = {left: 3, held: 0, given: []}; await frag('advancement', advanceBlock()); delete m.advRound; }
      box.remove();
      if (typeof openPanel === 'function') for (const b of ['barracks', 'armoury', 'tavern']) await shown('panel ' + b, 'camp-panel', () => { CAMP.panel = {kind: 'building', id: b}; renderPanel(); });
      if (typeof renderRoster === 'function') await shown('roster', 'screen-roster', renderRoster);
      if (typeof renderTable === 'function') await shown('war table', 'screen-table', renderTable);
      if (typeof openChronicle === 'function') await shown('chronicle', 'chronicle', openChronicle);
      if (typeof openAnnals === 'function') await shown('annals', 'annals', openAnnals);
      if (typeof renderTopbar === 'function') await shown('top bar', 'topbar', renderTopbar);
      // canvas text: a size that shows 14 CSS px on a canvas drawn at 1600 and shown at 1280
      if (typeof canvasPx106 === 'function'){ const c = document.createElement('canvas'); c.width = 1600; c.height = 100; c.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:80px'; document.body.appendChild(c);
        const g = c.getContext('2d'), a = canvasPx106(g, 13); g.scale(.5, .5); const b = canvasPx106(g, 13); g.setTransform(4, 0, 0, 4, 0, 0); const d = canvasPx106(g, 13); c.remove();
        rows.push(Math.abs(a * 0.8 - 14) < 0.05 && Math.abs(b * 0.4 - 14) < 0.05 && d === 13 ? 'ok canvas text floor follows the canvas scale' : 'FAIL canvas text floor: ' + a.toFixed(2) + ' / ' + b.toFixed(2)); }
      else rows.push('FAIL canvasPx106 missing');
    } catch (e){ rows.push('FAIL threw ' + String(e && e.message || e).slice(0, 100)); }
    finally {
      box.remove(); window.META = META0; window.saveMeta = sv;
      ids.forEach((i, k) => { const el = document.getElementById(i); if (el && hid[k] !== null) el.classList.toggle('hidden', hid[k]); });
      ['chronicle', 'annals'].forEach((i, k) => { const el = document.getElementById(i); if (el && ovl[k] !== undefined) el.style.display = ovl[k]; else if (el && ovl[k] === undefined) el.style.display = 'none'; });
      if (window.CAMP){ CAMP.panel = P0; try { if (P0) renderPanel(); } catch (e) {} }
      try { if (META0 && typeof renderTopbar === 'function') renderTopbar(); } catch (e) {}
    }
    return rows;
  };
})();
