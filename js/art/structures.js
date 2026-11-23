/* ===== INDEX S26: structure doors and stretch (Patrick, 2026-11-12, feedback on the scale sheets) =========
   Patrick on the house-type facilities (huts, bunks, kitchen, tavern, house, cells, armoury, leather, alchemy):
   "doors are oversized" and "squished wide or stretched high". The nine kinds draw VO3's 'building' sprite
   inside the facility, so one standard fixes all nine:
   - door 60 x 27 sprite px (the mage tower's door, the one Patrick said not to change) instead of 82 x 36;
   - the wall 0.75 of K.wallH (81 px: a person and a third at the hub), so the door is two thirds of the wall;
   - the cells 1.3 wider, so a one-cell hut is 78 px wide under a 129 px rise instead of 66 under 156.
   The standard is V.K.facHouse, read by facility()'s S() for 'building' and by building() as o.door, o.dw,
   o.wall, o.wide (js/3d/vo3.js, INDEX S26). The field's own houses (no facility) keep the old numbers.
   Load after vo3.js. ROLLBACK: delete this file and its script tag; the S26 lines in vo3.js then read defaults. */
(function(){
  'use strict';
  if (!window.VO3 || !VO3.K) return;
  const S = window.S26 = {K: {door: 60, dw: 27, wall: 0.75, wide: 1.3}};
  S.apply = function(){ VO3.K.facHouse = Object.assign({}, S.K); if (VO3.cache) for (const k in VO3.cache) if (k.startsWith('fac:') || k.startsWith('building:')) delete VO3.cache[k]; if (typeof CAMP !== 'undefined' && CAMP) CAMP.dirty = true; if (VO3.layers) VO3.layers = null; };
  S.apply();
  S.selfTest = function(){
    const out = []; const ok = (n, c) => out.push((c ? 'PASS ' : 'FAIL ') + n);
    const a = VO3.sprite('building', 0, 'summer', {w: 1, d: 1, roof: 48, foot: 1, door: 60, dw: 27, wall: 0.75, wide: 1.3});
    const b = VO3.sprite('building', 0, 'summer', {w: 1, d: 1, roof: 48, foot: 1});
    ok('S26: a facility house is wider and lower than the field house', a && b && a.img.width > b.img.width && a.img.height < b.img.height);
    ok('S26: the facility door is 60 (the mage tower door), under 0.8 person', VO3._doorH === 82 && (VO3.sprite('building', 1, 'summer', {w: 1, d: 1, foot: 1, door: 60}), VO3._doorH === 60) && 60 <= VO3.K.person * 0.8);
    const f = VO3.sprite('fac', 0, 'summer', {k: 'huts'});
    ok('S26: the huts facility paints with the standard and stays within 3 persons tall', f && f.img.height * f.s <= VO3.K.person * 3);
    ok('S26: V.K.facHouse is set', VO3.K.facHouse && VO3.K.facHouse.door === 60);
    return out;
  };
})();
