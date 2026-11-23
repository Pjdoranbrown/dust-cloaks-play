/* F-47c: the face picker for the Leader and the Chapter Master (Art, 16 Nov 2026).
   On Sign the Charter (the Leader, plain and guided Founding) and the Founding name step
   (the Chapter Master, saved as META.master.face by a finishFound wrapper; standDown and
   elevateTo carry a Leader's face to the chair), < > arrows cycle every painted face for the chosen race, speciality and sex:
   the first sheet and each PORT47 sheet that has the cell, each also flipped.
   The choice is saved as L.face = {ri, c, k, flip}; PORT47.pick and portVary honour it
   while the Leader's race, speciality and sex still match. Squad mates are unchanged.
   Also fixes the old preview, which drew 'preview'+sex with id 9, not the Leader's face.
   Loaded by its own index.html tag, after js/art/portraits-more.js.
   INT-1 stage 3: no switch; the portVary and PORT47.pick wrappers are folded into js/art/portraits.js and js/art/portraits-more.js. */
(function(){
  const F = window.FACE47C = window.FACE47C || {};
  const G = n => (0, eval)(n);
  const has = n => { try { return typeof G(n) === 'function'; } catch (e) { return false; } };
  const set = (n, f) => { window['__f47c_' + n] = f; (0, eval)(n + ' = window.__f47c_' + n); };
  const cr = () => { try { return G('CR'); } catch (e) { return null; } };
  const sets = () => { const A = window.PORT47; return A && A.ready ? A.sets : []; };

  F.faces = function(ri, c){
    const out = [{k: 0, flip: false}, {k: 0, flip: true}];
    sets().forEach((s, j) => { if (s.have && s.have[ri * 12 + c]) out.push({k: j + 1, flip: false}, {k: j + 1, flip: true}); });
    return out;
  };
  F.match = function(p){
    if (!p || p.hero || !p.face) return false;
    try { const ix = G('portIdx')(p); return !!ix && ix.ri === p.face.ri && ix.c === p.face.c; } catch (e) { return false; }
  };
  // Two create screens: 'cr' (the Leader, Sign the Charter) and 'fd' (the Chapter Master, Founding name step).
  const st = w => { try { return G(w === 'fd' ? 'FD' : 'CR'); } catch (e) { return null; } };
  // The face shown on that screen right now, or null when it cannot be worked out.
  F.current = function(w){
    const C = st(w || 'cr'); if (!C || !C.race || !C.spec || !C.sex) return null;
    const ix = G('portIdx')({race: C.race, spec: C.spec, sex: C.sex}); if (!ix) return null;
    const cell = ix.ri + ':' + ix.c, list = F.faces(ix.ri, ix.c);
    if (C.face47cell !== cell){ C.face47cell = cell; C.face47i = 0; }
    const i = ((C.face47i || 0) % list.length + list.length) % list.length; C.face47i = i;
    C.face47 = Object.assign({ri: ix.ri, c: ix.c}, list[i]);
    return {i, n: list.length, face: C.face47};
  };
  F.step = function(d, w){ w = w || 'cr'; const C = st(w); if (!C) return; C.face47i = (C.face47i || 0) + d; G(w === 'fd' ? 'renderFound' : 'renderCreate')(); };

  const sig = f => f.k + (f.flip ? 'f' : '');
  const pvURL = (cur, w) => {
    const C = st(w);
    if (w === 'fd'){   // drawn like the real Chapter Master (portGold, trimmed, not plain), so the preview is what the chair shows
      const m = {id: 'CMP', name: 'pv47m' + C.sex + sig(cur.face), race: C.race, sex: C.sex, spec: C.spec, cls: C.cls || 'FREEMAN', face: cur.face};
      return G('portURL')('pv47m:' + C.race + C.sex + C.spec + G('bannerSig')() + sig(cur.face), () => G('portGold')(m, true, {trim: true}));
    }
    return G('portraitURL')({race: C.race, spec: C.spec, sex: C.sex, name: 'pv47c' + C.sex + sig(cur.face), id: 9, face: cur.face}, true);
  };
  function decorate(w){
    { const card = document.querySelector('#create-inner .ldr-head img');   // the side card (Squad Leader or Chapter Master) shows the same face
      if (card){ const cur = F.current(w); if (cur) try { const u = pvURL(cur, w); if (u) card.src = u; } catch (e) {} } }
    const inp = document.getElementById(w === 'fd' ? 'fd-name' : 'cr-name'); if (!inp) return;
    const box = inp.closest('div') && inp.closest('div').parentElement; if (!box) return;
    const sexRow = [...box.children].find(e => /WOMAN/.test(e.textContent) && /MAN/.test(e.textContent));
    const im = sexRow && sexRow.previousElementSibling; if (!im || im.tagName !== 'IMG') return;
    const cur = F.current(w); if (!cur) return;
    try { const u = pvURL(cur, w); if (!u) return; im.src = u; } catch (e) { return; }
    if (box.querySelector('.f47c')) return;
    const a = w === 'fd' ? ",'fd'" : '';
    im.insertAdjacentHTML('afterend', `<div class="f47c" style="display:flex;align-items:center;gap:8px;margin:4px 0 0">
      <button class="btn small" style="min-width:40px" title="Previous face" onclick="FACE47C.step(-1${a})">\u2039</button>
      <span style="min-width:84px;text-align:center;font-size:14px">Face ${cur.i + 1} of ${cur.n}</span>
      <button class="btn small" style="min-width:40px" title="Next face" onclick="FACE47C.step(1${a})">\u203a</button></div>`);
  }

  function install(){
    if (F.installed) return; F.installed = true;
    if (has('renderCreate')){ const f = G('renderCreate'); set('renderCreate', function(){ const r = f.apply(this, arguments); try { decorate('cr'); } catch (e) {} return r; }); }
    if (has('renderFound')){ const f = G('renderFound'); set('renderFound', function(){ const r = f.apply(this, arguments); try { decorate('fd'); } catch (e) {} return r; }); }
    if (has('finishFound')){   // the Chapter Master keeps the face picked on the name step
      const f = G('finishFound');
      set('finishFound', function(){
        const D = st('fd'), fc = D && D.face47 && D.race ? {race: D.race, spec: D.spec, face: D.face47} : null;
        const r = f.apply(this, arguments);
        try { const M = G('META'); if (fc && M && M.master && M.master.race === fc.race && M.master.spec === fc.spec && !M.master.hero){ M.master.face = Object.assign({}, fc.face); G('saveMeta')(); } } catch (e) {}
        return r;
      });
    }
    if (has('makeLeader')){
      const f = G('makeLeader');
      set('makeLeader', function(race, cls, spec, name){
        const L = f.apply(this, arguments);
        try {
          const C = cr(); let gl = null; try { const g = G('GUIDE'); gl = g && g.leader; } catch (e) {}
          const src = C && C.face47 && C.race === race && C.spec === spec ? C.face47 : gl && gl.face47 && gl.race === race && gl.spec === spec ? gl.face47 : null;
          if (src && L) L.face = Object.assign({}, src);
        } catch (e) {}
        return L;
      });
    }
    if (has('guideLeaderDone')){
      const f = G('guideLeaderDone');
      set('guideLeaderDone', function(){ const C = cr(), fc = C && C.face47; const r = f.apply(this, arguments); try { const g = G('GUIDE'); if (fc && g && g.leader) g.leader.face47 = fc; } catch (e) {} return r; });
    }
    // A Leader (or anyone) raised to the chair keeps the face they had: standDown and elevateTo build a new
    // META.master without it, so copy it across afterwards.
    const keep = (name, who) => {
      if (!has(name)) return;
      const f = G(name);
      set(name, function(){
        let p = null; try { p = who.apply(this, arguments); } catch (e) {}
        const fc = p && p.face ? Object.assign({}, p.face) : null, id = p && {name: p.name, race: p.race, spec: p.spec};
        const r = f.apply(this, arguments);
        try {
          if (fc){ const M = G('META'); let n = 0;
            for (const o of [M.master, M.coMaster]) if (o && !o.face && o.name === id.name && o.race === id.race && o.spec === id.spec){ o.face = Object.assign({}, fc); n++; }
            if (n) G('saveMeta')(); }
        } catch (e) {}
        return r;
      });
    };
    keep('standDown', () => G('META').leader);
    keep('elevateTo', (kind, id) => { if (kind === 'leader') return G('META').leader;
      const list = kind === 'officer' ? G('officers')() : G('META').roster; return (list || []).find(x => String(x.id) === String(id)); });
    // portVary and PORT47.pick read F.match themselves (INT-1 stage 3: folded into js/art/portraits.js and js/art/portraits-more.js)
    if (has('personKey')){   // the picture cache key, so a new face is never served an old picture
      const f = G('personKey');
      set('personKey', function(p){ const k = f.apply(this, arguments); return p && p.face ? k + ':fc' + p.face.k + (p.face.flip ? 'f' : '') : k; });
    }
  }
  F.install = install;

  F.selfTest = function(){
    const out = {pass: 0, fail: 0, notes: []}, ok = (c, m) => { if (c) out.pass++; else { out.fail++; out.notes.push('FAIL ' + m); } };
    install();
    const ix = G('portIdx')({race: 'HUMAN', spec: 'SOLDIER', sex: 'm'});
    const list = F.faces(ix.ri, ix.c);
    ok(list.length >= 2 && list.length % 2 === 0, 'faces come in flipped pairs');
    const L = {race: 'HUMAN', spec: 'SOLDIER', sex: 'm', name: 'T', id: 77};
    for (let i = 0; i < list.length; i++){
      L.face = Object.assign({ri: ix.ri, c: ix.c}, list[i]);
      ok(window.PORT47.pick(L) === list[i].k || !window.PORT47.ready, 'pick honours face ' + i);
      ok(G('portVary')(L).flip === list[i].flip, 'vary honours flip ' + i);
    }
    L.sex = 'f'; ok(!F.match(L), 'a changed sex drops the face');
    const plain = {race: 'HUMAN', spec: 'SOLDIER', sex: 'm', name: 'Mate', id: 5};
    ok(!F.match(plain), 'squad mates keep the hashed face');
    return out;
  };

  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();
