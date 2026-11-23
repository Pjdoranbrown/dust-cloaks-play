/* INDEX PORT47 - F-47 (b) (Art lead): more painted portraits, for variety.
   assets/portraits47.js holds extra sheets of painted busts in the same layout as assets/portraits.js (16 races x 6
   specialities x 2 sexes, 144 x 176 each, with a scarf mask and eye positions). They were drawn by Gemini from the
   existing sheets as the style reference, then cut, toned and masked to match (audits/f48-art-review.md, Phase 3).
   Each person keeps one look for life: the choice comes from the same per-person seed as the old flip and hue changes.
   Heroes, uploaded portraits and the plain race and speciality icons keep the first sheet.
   The extra sheets load after the game has started; until then (or if the file is missing) everyone shows the first sheet.
   INT-1 group 22: no switch. INT-1 stage 3: the portFigure wrapper is folded into js/art/portraits.js (portFigure swaps
   the sheet in, portFigureSheet paints), and F-47c's picked face is read here in A.pick. */
(function(){
  'use strict';
  const A = window.PORT47 = {ready:false, sets:[], fails:{}, used:0};
  const G_ = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  function clear(){ try { const P = G_('PORT'); if (P){ P.figs = {}; P.urls = {}; P.hud = {}; } for (const s of A.sets) s.figs = {}; } catch (e) {}
    try { const C = G_('CAMP'); if (C) C.dirty = true; const r = G_('refreshUI'); if (typeof r === 'function' && !G_('G')) r(); } catch (e) {} }
  // which sheet this person uses: 0 = the first (old) sheet
  A.pick = function(p){
    { const F = window.FACE47C; if (F && F.match && F.match(p)){ const k = p.face.k | 0; if (!k) return 0; const s = A.ready && A.sets[k - 1]; return s && s.have[p.face.ri * 12 + p.face.c] ? k : 0; } }   // F-47c (js/art/face-picker.js): the picked face
    if (!A.ready || !p || p.hero) return 0;
    try { const ix = G_('portIdx')(p); if (!ix) return 0;
      const V = G_('portVary')(p), k = ((V.seed >>> 3) % (A.sets.length + 1));
      return k && A.sets[k - 1].have[ix.ri * 12 + ix.c] ? k : 0;
    } catch (e){ return 0; }
  };
  function load(){
    const tag = document.createElement('script'); tag.src = 'assets/portraits47.js';
    tag.onerror = () => { A.fails.load = 'assets/portraits47.js not found'; };
    tag.onload = async () => {
      try {
        const D = window.PORT47_IMG; if (!D || !D.sets) throw new Error('no data');
        const img = u => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = u; });
        for (const d of D.sets){
          const s = {eyes:d.eyes, have:d.have, figs:{}};
          for (const [k, u] of [['ab', d.base], ['mb', d.mask]]){ const im = await img(u), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
            const g = c.getContext('2d', {willReadFrequently:true}); g.drawImage(im, 0, 0); s[k] = g; }
          A.sets.push(s);
        }
        delete window.PORT47_IMG;
        A.ready = A.sets.length > 0; if (A.ready) clear();
      } catch (e){ A.fails.load = String(e && e.message || e); }
    };
    document.head.appendChild(tag);
  }
  try { if (document.readyState === 'complete') setTimeout(load, 600); else window.addEventListener('load', () => setTimeout(load, 600)); } catch (e){ A.fails.load = String(e && e.message || e); }

  A.selfTest = function(){
    const out = {pass:0, fail:0, notes:[]}, ok = (c, n) => { if (c) out.pass++; else { out.fail++; out.notes.push(n); } };
    try {
      ok(typeof G_('portFigureSheet') === 'function', 'portFigure folded into js/art/portraits.js');
      const P = G_('PORT');
      if (!A.ready || !P || !P.ok){ out.notes.push('extra sheets not loaded: picture tests skipped'); return out; }
      const dress = G_('portFigure'), E = G_('PORT_EYES'), e0 = E.slice(), ab0 = P.ab;
      const sum = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 53) s += d[i]; return s; };
      let nNew = 0, nOld = 0, bad = 0, same = 0, ppl = [];
      for (let i = 0; i < 576; i++){ const p = {race:G_('PORT_RACES')[i % 16], spec:G_('PORT_SPECS')[((i / 16) | 0) % 6], sex:((i / 96) | 0) % 2 ? 'f' : 'm', name:'T47_' + i, id:-4700 - i}; ppl.push(p);
        const k = A.pick(p), fig = dress(p, false); if (!fig || !fig.cv){ bad++; continue; } if (k) nNew++; else nOld++;
        if (fig.eyes.some(v => v < -1 || v > 176)) bad++; }
      ok(bad === 0, 'every test person gets a figure with sane eyes (' + bad + ' bad)');
      ok(nNew >= 10 && nOld >= 10, 'both old and new sheets are in use (' + nOld + ' old, ' + nNew + ' new)');
      ok(P.ab === ab0 && E.every((v, i) => v === e0[i]), 'the first sheet and its eye table are left as they were');
      const p = ppl.find(q => A.pick(q)), a = sum(dress(p, false).cv), a2 = sum(dress(p, false).cv);
      ok(a === a2, 'a person keeps one look');
      ok(A.pick({race:'HUMAN', spec:'SOLDIER', sex:'m', name:'H', id:1, hero:true}) === 0, 'heroes keep the first sheet');
    } catch (e){ out.fail++; out.notes.push(String(e && e.message || e)); }
    return out;
  };
})();
