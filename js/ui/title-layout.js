/* ============================================================================
   TITLE LAYOUT (S6 row 1f, note 1; spec audits/specs/s6-1-layout.md section 1f)
   The title screen is assembled by several wrappers around showSplash (camp.js, ux.js, luck-epilogue.js, guided-start.js,
   f34.js). This file is the one place that lays the finished result out: loaded last, it wraps showSplash once more, moves
   the built elements (handlers and the Settings panel stay as they are) into one centred column and styles that column.
   Order: title, subtitle, charter line, rule, caption (the Founding note), two stack buttons of one width (the first is
   gold; on a profile with no Leader the Founding comes first, otherwise the camp button), then the quiet row (SETTINGS,
   NEW CAMPAIGN, anything else small). Sizes follow the spec's two columns exactly at 1280 and 1920 px wide and scale
   linearly between (flat outside). Words are not touched here.
   ROLLBACK: delete this file and its <script> line in index.html.
============================================================================ */
(function(){
  'use strict';
  // a size that is a at 1280 px wide and b at 1920 px wide
  const V = (a, b) => `clamp(${a}px, calc(${a}px + (100vw - 1280px) * ${((b - a) / 640).toFixed(5)}), ${b}px)`;
  const css = `
    .tl{position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;text-align:center;margin:0 auto}
    .tl::before{content:'';position:absolute;left:50%;top:50%;width:${V(900, 1240)};height:${V(640, 860)};transform:translate(-50%,-50%);
      background:radial-gradient(ellipse at center,rgba(10,6,2,.9) 0%,rgba(10,6,2,.9) 45%,rgba(10,6,2,0) 78%);z-index:-1;pointer-events:none}
    .tl .tl-sub,.tl .tl-charter,.tl .tl-cap{text-shadow:0 1px 3px rgba(0,0,0,.9)}
    .tl h1{font-size:${V(84, 112)};margin:0;line-height:1.05}
    .tl .tl-sub{font-size:${V(18, 22)};margin:${V(8, 12)} 0 0}
    .tl .tl-charter{font-size:${V(15, 18)};margin:${V(16, 24)} 0 0;max-width:${V(760, 1000)};line-height:1.35}
    .tl .tl-rule{width:${V(380, 460)};height:0;border-top:1px solid rgba(232,216,176,.35);margin:${V(32, 48)} 0 0}
    .tl .tl-cap{font-size:${V(15, 18)};margin:${V(16, 24)} 0 0;max-width:${V(560, 720)};line-height:1.35}
    .tl .tl-big{box-sizing:border-box;display:block;width:${V(380, 460)};margin:${V(16, 24)} 0 0;padding:0 12px;white-space:normal}
    .tl .tl-cap + .tl-big{margin-top:${V(16, 24)}}
    .tl .tl-big.tl-1{height:${V(56, 64)};font-size:${V(19, 22)}}
    .tl .tl-big.tl-2{height:${V(48, 56)};font-size:${V(17, 20)}}
    .tl .tl-q{box-sizing:border-box;min-height:${V(32, 40)};font-size:${V(14, 16)};margin:${V(16, 24)} 0 0}
    .tl .tl-qrow{margin:${V(16, 24)} 0 0;padding:0;border:0;display:flex;flex-direction:column;align-items:center}
    .tl .tl-qrow > .tl-q{margin-top:0}
    .tl .tl-qrow + .tl-qrow{margin-top:${V(16, 24)}}`;
  const st = document.createElement('style'); st.id = 'tl-style'; st.textContent = css; document.head.appendChild(st);

  const isBig = b => b.classList.contains('btn') && !b.classList.contains('small');
  function tidy(){
    const ti = document.getElementById('title-inner'); if (!ti || ti.querySelector(':scope > .tl')) return;
    const h1 = ti.querySelector('h1'), sub = ti.querySelector('.sub'); if (!h1) return;
    const kids = [...ti.children];
    const charter = kids.find(k => k.classList && k.classList.contains('note'));
    const f34box = ti.querySelector('[data-f34="title"]');
    // the caption belongs with the Founding: the note inside its box, else the note inside the box beside the Founding button
    const capSrc = (f34box && f34box.querySelector('.note')) || kids.filter(k => k !== charter && k.querySelector && k.querySelector('.note')).map(k => k.querySelector('.note'))[0] || null;
    const btns = [...ti.querySelectorAll('button')];
    const skipB = btns.find(b => /skip the founding/i.test(b.textContent)), bigAll = btns.filter(isBig);
    const big = skipB && bigAll.length < 2 ? [...bigAll, skipB] : bigAll, small = btns.filter(b => !big.includes(b));   // 1f: Skip the Founding is the second stack button when there is no other
    const founding = big.find(b => /F34\.start\(/.test(b.getAttribute('onclick') || '')), other = big.filter(b => b !== founding);
    const fresh = typeof META !== 'undefined' && META && !META.leader && !(typeof founded === 'function' && founded());
    const stack = (founding ? (fresh ? [founding, ...other] : [...other, founding]) : other).slice(0, 2);
    const extraBig = big.filter(b => !stack.includes(b));
    const settingsBtn = small.find(b => /toggleSettings/.test(b.getAttribute('onclick') || ''));
    // a settings panel (inputs, pips) lives in the same wrapper as the button: move the wrapper as it is
    const setWrap = settingsBtn && kids.find(k => k.contains(settingsBtn));
    const wrap = document.createElement('div'); wrap.className = 'tl';
    const put = (el, cls) => { if (!el) return null; if (cls) el.classList.add(...cls.split(' ')); wrap.appendChild(el); return el; };
    put(h1);
    if (sub){ sub.classList.add('tl-sub'); put(sub); }
    if (charter){ charter.removeAttribute('style'); put(charter, 'tl-charter'); }
    const rule = document.createElement('div'); rule.className = 'tl-rule'; wrap.appendChild(rule);
    if (capSrc){ capSrc.removeAttribute('style'); put(capSrc, 'tl-cap'); }
    stack.forEach((b, i) => { b.classList.toggle('gold', i === 0); b.classList.add('tl-big', i === 0 ? 'tl-1' : 'tl-2'); put(b); });
    // quiet row: SETTINGS first, then the other small buttons (NEW CAMPAIGN, skip, annals ...), then anything big left over
    if (setWrap){ setWrap.removeAttribute('style'); setWrap.classList.add('tl-qrow'); settingsBtn.classList.add('tl-q'); put(setWrap); }
    for (const b of [...small.filter(b => b !== settingsBtn), ...extraBig]){
      b.classList.remove('gold'); b.classList.add('tl-q'); const r = document.createElement('div'); r.className = 'tl-qrow'; r.appendChild(b); wrap.appendChild(r);
    }
    // anything else still in the old structure (a panel, an annals line) keeps its place after the rest; empty shells go
    for (const k of [...ti.children]){ if (k === wrap) continue; if (k.querySelector && (k.querySelector('button,input,select,img,canvas') || (k.textContent || '').trim())) wrap.appendChild(k); }
    ti.innerHTML = ''; ti.appendChild(wrap);
  }
  const _splash = showSplash;
  showSplash = function(){ const r = _splash.apply(this, arguments); try { tidy(); } catch (e) { console.warn('title layout', e); } return r; };
  window.TITLE_LAYOUT = {tidy, V};
})();
