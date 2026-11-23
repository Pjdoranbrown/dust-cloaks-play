/* INDEX REF35 - PD-35 Kalloon survivors look like refugees, not squad mates (Art lead, 2026-11-16).
   WHAT   The survivors in camp (CAMP.people kind 'elf35', js/campaign/pd35.js) used a random Specialty's kit, so they read as
          squad mates. Now they are travel-worn and unarmed: a hooded shawl in a worn brown, a bedroll on the back, a satchel
          on a strap, a rope belt, bare hands, rag cloth (never the squad's armour), no helm so the elf ears show.
          R3D_KITS.REFUGEE35 is the kit; camp.js draws an elf35 with a copy of its person whose spec is 'REFUGEE35'.
          The pixel fallback uses SPEC_LOOK.PLAIN (personLook does that for any spec it does not know).
   KNOBS  REF35.on = false: the survivors wear their Specialty kit again (reopen the camp).
   TEST   REF35.selfTest(). */
(function(){
  'use strict';
  if (window.REF35 || typeof R3D_KITS === 'undefined') return;
  const P = window.REF35 = {on:true, SPEC:'REFUGEE35'};
  R3D_KITS.REFUGEE35 = (D, x) => { const s = D.s, w = D.w;
    return {helm:null, hair:'keep', main:'fist', parts:[
      {b:'chest', t:'ell', c:[0, 15.6 * s, -0.6], r:[10.6 * w, 3.8 * s, 7.8 * w], z:'hood'},          // shawl over the shoulders
      {b:'chest', t:'ell', c:[0, 18.6 * s, -5.6 * w], r:[5.2 * w, 2.8 * s, 2.8 * w], z:'hood'},       // hood down at the back
      {b:'chest', t:'cap', a:[-7.8 * w, 17.2 * s, -7.4 * w], p:[7.8 * w, 17.2 * s, -7.4 * w], r:2.5 * w, z:'fur'},   // bedroll
      {b:'chest', t:'cap', a:[6.2 * w, 17 * s, 6 * w], p:[-6.6 * w, 3.5 * s, 6.6 * w], r:0.75, z:'strap'},          // satchel strap
      {b:'pelvis', t:'box', c:[-7.8 * w, -3.2 * s, 1], r:[1.6, 3.6, 3.2], z:'leather'},                // satchel
      {b:'pelvis', t:'box', c:[0, -0.6 * s, 0], r:[8.5 * w, 0.8 * s, 6.4 * w], z:'strap'}]};         // rope belt
  };
  // rag cloth whatever the squad wears; worn browns
  { const f = r3dRecipeFor;
    r3dRecipeFor = function(p, isLeader, opt){
      if (!(p && p.spec === P.SPEC)) return f.apply(this, arguments);
      const rec = f(p, isLeader, Object.assign({weight:'light', material:'rags', kit:P.SPEC}, opt || {}));
      Object.assign(rec.zones, {hood:'#5e5242', fur:'#7a6a4e', strap:'#4a3a28', leather:'#5a4430', legs:'#4a4236', boots:'#3a2c1e'});
      rec.key = 'ref35' + hash(JSON.stringify(rec));
      return rec;
    };
  }
  try { R3DM.recs.clear(); } catch (e) {}
  P.person = function(q){   // the person camp.js draws for an elf35 (cached on the camp person)
    if (!P.on || !q || !q.p) return q && q.p;
    if (!q.ref35 || q.ref35.name !== q.p.name) q.ref35 = Object.assign({}, q.p, {spec:P.SPEC});
    return q.ref35;
  };
  P.selfTest = function(){
    let pass = 0, fail = 0; const notes = [], ok = (n, c, x) => { if (c) pass++; else { fail++; notes.push(n + (x !== undefined ? ' (' + x + ')' : '')); } };
    const q = {kind:'elf35', p:{name:'Test Elf', race:'GREY_ELF', spec:'MAGE', cls:'FREEMAN', sex:'f', id:-351}};
    const r = P.person(q);
    ok('copy wears the refugee kit', r.spec === 'REFUGEE35' && q.p.spec === 'MAGE');
    ok('copy is cached', P.person(q) === r);
    const rec = r3dRecipeFor(r, false);
    ok('no weapon', R3D_KITS.REFUGEE35({s:1, w:1, hk:1}, {}).main === 'fist' && !rec.parts.some(x => ['wood', 'metal', 'string'].includes(x.z) && /^hd/.test(x.b)));
    ok('worn brown shawl', rec.zones.hood === '#5e5242' && rec.parts.some(x => x.z === 'hood'));
    ok('rag cloth, not squad armour', !rec.parts.some(x => x.z === 'mail' || x.z === 'plate'));
    let spr; try { spr = personSpriteK('ref35t', r); } catch (e) {}
    ok('camp sprite is tagged 3D', !!(spr && spr.p3d && spr.p3d.spec === P.SPEC));   // the sprite cache may hold an earlier copy
    return {pass, fail, notes};
  };
})();
