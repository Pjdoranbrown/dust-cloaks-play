/* INDEX EVP25 - PD-25 and PD-36 painted portraits (Art lead, 2026-11-16). Patrick Q25 and Q36.
   WHAT   (1) The 19 encounter beings of EVT39 (js/combat/events.js) each have a painting: EVPORT.url(id) gives it framed,
          144 px, or '' while it loads or when it has none. The shape B choice card (#ev39-card) shows it beside the
          title. Shapes A and C have no pop-up today; any screen can use EVPORT.url(id).
          (2) The Night 5 Mage (f34caster) and the Night 7 Witch (f45witch) have painted faces: customOf() is wrapped,
          as the heroes are (guided-start.js), so the roster, person card and any join card show them.
          (3) UX K79: the b8 Training card (PD38.trainingHTML) gets the b7 join card's 56 x 64 portrait of the Mage.
   DATA   assets/beings25.js (window.BEING25_IMG): Gemini paintings in the house style, cut and sized by Art. Loaded
          after the game starts, like assets/foes49.js.
   KNOBS  EVPORT.on = false hides the pictures (card and faces).
   TEST   EVPORT.selfTest(). */
(function(){
  'use strict';
  if (window.EVPORT) return;
  const P = window.EVPORT = {on:true, img:{}, url_:{}, n:0, fails:{}};
  const S = 144;
  P.IDS = ['roadOgre', 'ogreBros', 'ogreMatriarch', 'wagonBreaker', 'rimewalker', 'hearthWight', 'rimeWolf', 'ridgeGiant',
    'ravenSeer', 'hedgeSprite', 'fordHorse', 'antleredWarden', 'hob', 'mireHag', 'greenHound', 'labyrinthWarder',
    'furnaceSmith', 'bronzeSentinel', 'cliffShrike'];
  P.data = {};
  function frame(src){   // the painting in the iron frame the foe portraits use (art-f48.js)
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = '#0c0a09'; g.fillRect(0, 0, S, S);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 6, 6, S - 12, S - 12);
    const v = g.createRadialGradient(S / 2, S / 2, S * 0.42, S / 2, S / 2, S * 0.76); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = v; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#17110d'; g.lineWidth = 8; g.strokeRect(4, 4, S - 8, S - 8);
    g.strokeStyle = '#6e2a22'; g.lineWidth = 2; g.strokeRect(8, 8, S - 16, S - 16);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.strokeRect(1.5, 1.5, S - 3, S - 3);
    return c.toDataURL('image/jpeg', 0.88);
  }
  P.url = function(id){
    if (!P.on || !P.img[id]) return '';
    return P.url_[id] || (P.url_[id] = frame(P.img[id]));
  };
  P.face = function(p){   // the join portraits (PD-36): a raw data URL, or ''
    if (!P.on || !p) return '';
    const k = p.f45witch ? 'join_witch' : p.f34caster ? 'join_mage' : '';
    return (k && P.data[k]) || '';
  };
  // the shape B card: a picture beside the name
  P.card = function(id){
    const el = document.getElementById('ev39-card'), u = P.url(id); if (!el || !u || el.querySelector('.evp25')) return false;
    const box = el.firstElementChild, h = box && box.querySelector('h3'); if (!h) return false;
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:14px;align-items:flex-start;margin:0 0 12px';
    const im = new Image(); im.className = 'evp25'; im.src = u; im.alt = ''; im.width = im.height = 112;
    im.style.cssText = 'flex:none;width:112px;height:112px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.45)';
    const txt = document.createElement('div'); txt.style.cssText = 'flex:1;min-width:0';
    const para = h.nextElementSibling && h.nextElementSibling.tagName === 'P' ? h.nextElementSibling : null;
    h.replaceWith(row); row.appendChild(im); row.appendChild(txt); txt.appendChild(h); if (para){ txt.appendChild(para); para.style.margin = '0'; }
    return true;
  };
  function wrap(){
    const E = window.EVT39;
    if (E && E.scene && !E.scene.evp25){ const f = E.scene; E.scene = function(g){ const r = f.apply(this, arguments); try { if (r && g && g.ev39) P.card(g.ev39.id); } catch (e) { P.fails.card = String(e); } return r; }; E.scene.evp25 = true; }
    let co; try { co = (0, eval)('customOf'); } catch (e) {}
    if (typeof co === 'function' && !co.evp25){
      const f = co, nf = function(p){ const e = f.apply(this, arguments); if (e) return e; const d = P.face(p); if (!d) return null;
        const r = {d, v:'evp25'}; try { const seen = (0, eval)('NPC_SEEN'), k = (0, eval)('ckey')(p); if (k) seen[k] = r; } catch (x) {} return r; };   // NPC_SEEN: decoded like the heroes' and NPCs' built-in faces (guided-start.js)
      nf.evp25 = true; window.__evp25co = nf; try { (0, eval)('customOf = window.__evp25co'); } catch (e) { P.fails.face = String(e); }
      delete window.__evp25co;
    }
    const D = window.PD38;   // UX K79: the b8 Training card gets the same portrait as the b7 join card (js/tutorial/act4.js)
    if (D && D.trainingHTML && !D.trainingHTML.evp25){ const f = D.trainingHTML; D.trainingHTML = function(){ const h = f.apply(this, arguments);
      try { const m = P.on && h && D.mage && D.mage(); const pic = m && portraitURL(m, false); if (pic) return P.withPic(h, pic); } catch (e) { P.fails.k79 = String(e); } return h; };
      D.trainingHTML.evp25 = true; }
  }
  P.withPic = function(h, pic){   // put the join card's 56 x 64 framed portrait at the start of a .log card
    const img = `<img class="evp79" src="${pic}" alt="" style="float:left;width:56px;height:64px;object-fit:cover;margin:0 10px 4px 0;border:1px solid #8a6a2a">`;
    return h.replace(/^(<div class="log"[^>]*style=")([^"]*)(">)/, (a, x, st, y) => x + st + (/overflow/.test(st) ? '' : ';overflow:hidden') + y + img);
  };
  function load(){
    const tag = document.createElement('script'); tag.src = 'assets/beings25.js';
    tag.onerror = () => { P.fails.data = 'assets/beings25.js not found'; };
    tag.onload = async () => {
      const D = window.BEING25_IMG || {}; P.data = D; let n = 0;
      for (const id of P.IDS){ if (!D[id]) continue;
        try { P.img[id] = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = D[id]; }); n++; } catch (e) { P.fails[id] = 'image'; } }
      delete window.BEING25_IMG; P.n = n;
      try { if (typeof NPC_SEEN !== 'undefined') for (const k in NPC_SEEN) if (NPC_SEEN[k] == null) delete NPC_SEEN[k]; } catch (e) {}
    };
    document.head.appendChild(tag);
  }
  try { wrap(); } catch (e) {}
  try { if (document.readyState === 'complete') setTimeout(() => { wrap(); load(); }, 1000); else window.addEventListener('load', () => setTimeout(() => { wrap(); load(); }, 1000)); } catch (e) {}

  P.selfTest = function(){
    let pass = 0, fail = 0; const notes = [], ok = (n, c, x) => { if (c) pass++; else { fail++; notes.push(n + (x !== undefined ? ' (' + x + ')' : '')); } };
    const E = window.EVT39;
    ok('every id is an EVT39 creature', !E || P.IDS.every(id => !!(E.CREATURES || {})[id]), P.IDS.filter(id => !(E.CREATURES || {})[id]).join(','));
    ok('19 paintings loaded', P.n === 19, P.n);
    ok('a framed url is 144 px jpeg', /^data:image\/jpeg/.test(P.url('roadOgre')));
    ok('url is cached', P.url('roadOgre') === P.url('roadOgre'));
    ok('unknown id gives no url', P.url('nobody') === '');
    const J = !!(P.data.join_mage && P.data.join_witch);   // the join paintings wait on Gemini's image quota; until then both keep their sheet faces
    if (J){
    ok('Mage face', !!P.face({f34caster:true}));
    ok('Witch face', !!P.face({f45witch:true}) && P.face({f45witch:true}) !== P.face({f34caster:true}));
    ok('others have no join face', P.face({}) === '');
    let co; try { co = (0, eval)('customOf'); } catch (e) {}
    ok('customOf wrapped', !!(co && co.evp25));
    try { const r = co && co({f45witch:true, name:'Wenna', race:'HUMAN', spec:'WITCH', sex:'f', id:-25}); ok('customOf gives the Witch face', !!(r && r.d === P.face({f45witch:true}))); } catch (e) { ok('customOf gives the Witch face', false, e.message); }
    } else ok('no join face without the paintings', P.face({f34caster:true}) === '' && P.face({f45witch:true}) === '');
    // the card: a fake card in the shape EVT39.scene builds
    const st = document.createElement('div'); st.id = 'ev39-card'; st.innerHTML = '<div><h3>Hob</h3><p>A hearth-spirit.</p><div>buttons</div></div>'; document.body.appendChild(st);
    try { ok('card gets the picture', P.card('hob') && !!st.querySelector('img.evp25') && st.querySelector('h3').parentElement.querySelector('p') !== null);
      ok('card picture added once', !P.card('hob') && st.querySelectorAll('img.evp25').length === 1); }
    finally { st.remove(); }
    ok('EVT39.scene wrapped', !E || !!(E.scene && E.scene.evp25));
    const w = P.withPic('<div class="log" data-pd38="training" style="text-align:left"><p>x</p></div>', 'data:,');
    ok('K79 card picture', /overflow:hidden"><img class="evp79"/.test(w) && w.endsWith('<p>x</p></div>'), w);
    ok('K79 PD38.trainingHTML wrapped', !window.PD38 || !!(PD38.trainingHTML && PD38.trainingHTML.evp25));
    return {pass, fail, notes};
  };
})();
