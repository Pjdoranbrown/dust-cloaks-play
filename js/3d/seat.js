/* seat3d.js: a seated pose for the 3D people (F-14 follow-up, Art, 2026-11-14).
   Adds the humanoid clip 'seat' (hips on a stool, thighs forward, forearms resting on the table; the existing 'sit' is the bard's fiddle pose)
   and SEAT3D.draw(owner, i, spr, x, y, s, left), a drop-in for drawStub that draws the person seated and falls back to the standing figure.
   INT-1 group 13: no switch; SEAT3D.on is false only when the seat clip failed to load (then everyone stands). */
window.SEAT3D = (function(){
  const S = {on:true};
  try {
    const H = R3D_CLIPS.humanoid, Z = [0, 0, 0];
    H.seat = {n:4, fn:(t, rec) => { const ph = t * Math.PI * 2, b = Math.sin(ph), th = r3dThigh(rec);
      return {bob:-th - 1, pelvis:[0, 0, 0], chest:[0.1 + 0.02 * b, 0, 0], head:[0.08 + 0.04 * Math.sin(ph * 2), 0.06 * b, 0.03 * b],
        thL:[-1.5, 0, 0.14], shL:[1.45, 0, 0], thR:[-1.5, 0, -0.14], shR:[1.45, 0, 0],
        upL:[-0.55, 0, -0.18], loL:[-1.1, 0, 0], upR:[-0.55, 0, 0.18], loR:[-1.1 + 0.08 * b, 0, 0], hdR:Z, hdL:Z,
        cape:[-0.35, 0, 0], cape2:[-0.6, 0, 0], cape3:[-0.3, 0, 0]}; }};
    if (R3D_CLIPS.brute) R3D_CLIPS.brute.seat = H.seat;
    if (R3D_CLIPS.prop && R3D_CLIPS.prop.idle) R3D_CLIPS.prop.seat = R3D_CLIPS.prop.idle;
  } catch (e) { console.warn('seat3d: clip not added', e); S.on = false; }
  S.draw = function(owner, i, spr, x, y, s, left, dir){   // dir: 8-way facing (0 right, 2 toward us, 4 left, 6 away); default is the old front-left/right
    if (S.on){
      try {
        if (r3dTagged(spr)){
          r3dPumpTick();
          const rec = r3dRecipeForSprite(spr);
          if (rec && R3D_CLIPS[rec.rig] && R3D_CLIPS[rec.rig].seat){
            const tick = G ? G.frame : CAMP.t;
            if (r3dDraw(rec, null, x, y, s, {clip:'seat', i:Math.floor(tick / 18 + i) % 4, dir:dir !== undefined ? dir : (left ? 3 : 1), async:true, light:true})) return true;
          }
        }
      } catch (e) { console.warn('seat3d fell back to standing:', e); }
    }
    drawStub(owner, i, spr, x, y, s, 0, left, false);
    return false;
  };
  S.selfTest = function(){
    const ok = !!(R3D_CLIPS.humanoid.seat && R3D_CLIPS.humanoid.seat.n === 4 && typeof S.draw === 'function');
    return {ok, info: ok ? 'seat clip present' : 'seat clip missing'};
  };
  return S;
})();
