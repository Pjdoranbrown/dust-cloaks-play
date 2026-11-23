/* ============================================================================
   INDEX MODE43 - F-43 (QA U12): say which aim mode the field is in (Systems, 2026-11-14)
   Click attack (left click shoots at the cursor, right click or X swings) exists only in the F-33 manual mode, which is a flag
   (F33.clicks); with the clicks off, the squad fires on its own and nothing said so. This only SAYS the mode; it changes no logic.
   - a small line under the top-right panel: AIM MANUAL (click shoots, right click swings, X swings at the cursor) or AIM AUTO (the squad
     fires on its own; clicks do nothing; the tip names the way to manual)
   - one note at the start of a contract with the same words
   There is no in-game toggle key for the mode: it is the page flag. INT-1 group 11: no switch. Test: MODE43.selfTest().
============================================================================ */
(function(){
  'use strict';
  const M = window.MODE43 = {};
  const manual = () => { try { return !!(window.F33 && F33.manual && F33.manual()); } catch (e) { return false; } };
  // UX K58 (Art 16 Nov): no mouse or keyboard on a phone, so the aim line and note stay off there (window.K58 = false: shown)
  M.phone = () => { try { return VW < 640 && window.K58 !== false; } catch (e) { return false; } };
  M.text = function(){
    return manual() ? 'AIM MANUAL: left click shoots, right click or X swings'
                    : 'AIM AUTO: the squad fires on its own';
  };
  if (typeof draw === 'function'){ const f = draw;
    draw = function(){
      const r = f.apply(this, arguments);
      try {
        if (typeof G !== 'undefined' && G && !G.over && G.leader && typeof ctx !== 'undefined' && !M.phone()){
          /* UX text floor (audits/uiux/text-floor-1280-ruling.md item 5): the line is drawn in the HUD's units (UX83.k), in the key hints' font (14 screen
             px at least, UX83.hintF) with its right edge on theirs (VW - 14), a hint step under the last hint line. Before: a fixed 11 px with the
             transform reset (8.8 screen px at 1280). ROLLBACK: window.FLOOR14 = false (the old 11 px line and place). */
          const U = window.UX83, hk = (U && U.k) || 1, hints = !!(U && U.hint43 && U.hintTop && window.HUD43 !== false && !G.brawl && !(VW < 640 && window.K56 !== false));
          if (window.FLOOR14 !== false && U && U.hintF){
            const t = M.text(); if (!t) return r;   // lesson hold: no text, so no empty box
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(hk, hk);
            const f = U.hintF(), st = U.hintStep(f), W = VW / hk, xr = W - 14;
            const y = hints ? U.hintTop() + 3 * st + st + 4 : (G.showMini ? 104 + Math.round(220 * MAP.h / MAP.w) + 22 : 112) / hk;
            ctx.font = f + 'px Georgia'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
            const w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(xr + 2 - w, y - Math.ceil(f * 0.95) - 2, w, Math.ceil(f * 1.25) + 5);   // the box: 2 units past the text edge, as before
            ctx.fillStyle = manual() ? '#ffd860' : '#c8bca8'; ctx.fillText(t, xr, y);
            ctx.restore(); M.at = {y, f, k: hk};
            return r;
          }
          const y = (hints ? Math.round((UX83.hintTop() + 45) * (UX83.k || 1) + 18 + 3 * (UX83.k || 1)) : (G.showMini ? 104 + Math.round(220 * MAP.h / MAP.w) + 22 : 112));   // QA 19 Nov (2nd): the deck HUD has no minimap, so G.showMini (true by default) must not move the line; the minimap y only when no hints are drawn. QA 19 Nov: under the four key-hint lines: they are drawn at the HUD scale UX83.k, the last baseline at (hintTop + 45) * k; this line is drawn at scale 1 (LE 6498bc94)
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = '11px Georgia'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
          const t = M.text(); if (!t){ ctx.restore(); return r; }   // lesson hold: no text, so no empty box
          ctx.fillStyle = 'rgba(0,0,0,.55)'; const k = (window.UX83 && UX83.k) || 1, w = ctx.measureText(t).width + 2 * k + 6; ctx.fillRect(VW - 12 * k - w, y - 12, w, 17);   // UX aim-edge-spec: box edge on the IN SIGHT edge, text edge on the key-hint edge
          ctx.fillStyle = manual() ? '#ffd860' : '#c8bca8'; ctx.fillText(t, VW - 14 * k, y);
          ctx.restore();
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof startDeployment === 'function'){ const f = startDeployment;
    startDeployment = function(){ const r = f.apply(this, arguments); try { if (typeof G !== 'undefined' && G && !G.over && !(G.contract && G.contract.teach) && !M.phone()) note(M.text() + '.'); } catch (e) {} return r; };
  }
  M.selfTest = function(){
    const out = [], ok = (n, c) => out.push({n, ok: !!c}), wasC = window.F33 ? F33.clicks : undefined;
    try {
      ok('text names AUTO when manual is off', (window.F33 && (F33.clicks = false), /AUTO/.test(M.text())));
      if (window.F33){ const g = typeof G !== 'undefined' ? G : null; ok('manual() is false with the clicks off', !F33.manual()); }
      ok('the AIM line can find the key hints (UX83.hintTop is a function)', window.UX83 && typeof UX83.hintTop === 'function' && typeof UX83.hint43 === 'function');   // LE fc07bcdc: the first fix named a global that does not exist
      ok('the text is short (one line)', M.text().length < 80);
    } finally { if (window.F33){ F33.clicks = wasC; } }
    const fails = out.filter(o => !o.ok).map(o => o.n);
    return {ok: !fails.length, fails, pass: out.length - fails.length};
  };
})();
/* END INDEX 87d */
