/* js/combat/abilities.js (INT-1 step 2, 2026-11-16): ABILITIES.
   Cut unchanged from the inline script in index.html (old lines 4443 to 4587). Classic script: loads in order
   from index.html; top-level names are shared with every other script. */
"use strict";
/* ============================================================================
   ABILITIES - every model keeps its automatic attack. On top of that, each
   Specialty in the squad (the Leader included) adds one ability to the bar
   on a fixed key. Two models of the same Specialty fire it twice, one after
   the other; three fire it three times. A model that is down does not fire.
   Names and effects follow the ability, spell and prayer cards in the
   Player's Manual 1.6 (Sections 2.6, 7.2, 7.3 and 7.4).
============================================================================ */
const ABILITIES = {
  SOLDIER:  {key:'1', name:'Shield Bash',    glyph:'shield', cd:12, sfx:'bash',
             text:'Slam every enemy inside the Command Radius, the ring round the Leader: a Melee attack, knockback, and they are Prone (no moving or attacking) for 2 seconds. Hold the Line widens the ring, and the bash with it.'},
  FOLK_HERO:{key:'2', name:'Command',        glyph:'horn',   cd:20, sfx:'horn',
             text:'Every model in the squad attacks at once, and the squad has the Charge bonus (+1 melee step) for 2.5 seconds.'},
  SCOUNDREL:{key:'3', name:'Called Shot',    glyph:'dagger', cd:10, sfx:'knife',
             text:'A Piercing throw at the toughest enemy in sight, commanders first.'},
  CLERIC:   {key:'4', name:'Cure Wounds',    glyph:'heart',  cd:18, sfx:'heal',
             text:'The most hurt model in the squad regains Condition (or Wounds) equal to Magic + 1. Lifts anyone Bleeding Out, the Leader included.'},
  MAGE:     {key:'5', name:'Lightning Bolt', glyph:'star',   cd:16, sfx:'zap',
             text:'A straight line of lightning in the direction the squad faces. Every enemy along it is attacked, and it ignores 1 step of armour.'},
  WITCH:    {key:'6', name:'Dark Illusion',  glyph:'eye',    cd:14, sfx:'hex',
             text:'For 6 seconds every attack against the squad shifts down 1 step. A second Witch adds 6 more seconds.'}
};
const ABIL_KEYS = {}; for (const s in ABILITIES) ABIL_KEYS[ABILITIES[s].key] = s;
const ABIL_ORDER = ['SOLDIER','FOLK_HERO','SCOUNDREL','CLERIC','MAGE','WITCH'];

// Models of a Specialty who can act right now.
function abilityCasters(spec){
  const out = [];
  if (G.leader.spec === spec && !G.leader.down) out.push(G.leader);
  for (const m of G.squad) if (m.spec === spec && m.state === 'up') out.push(m);
  return out;
}
// Specialties on the bar: anyone in the squad who is not dead.
function squadSpecs(){
  const set = new Set([G.leader.spec]);
  for (const m of G.squad) if (m.state !== 'dead') set.add(m.spec);
  return ABIL_ORDER.filter(s => set.has(s));
}
function buildAbilities(){
  if (!G) return;
  G.abil = G.abil || {};
  for (const s of squadSpecs()) if (!G.abil[s]) G.abil[s] = {cd:0};
}
function useAbility(spec){
  if (!G || G.over || G.paused || !G.abil || !G.abil[spec]) return;
  const a = G.abil[spec], casters = abilityCasters(spec);
  if (a.cd > 0 || !casters.length){ SFX.play('nope'); return; }
  a.cd = Math.round(ABILITIES[spec].cd * 60 * (1 - 0.15 * (G.quicken || 0))); a.max = a.cd; a.flash = 20;
  casters.forEach((u, i) => G.abilQ.push({at:G.frame + i * 14, spec, u}));
}
function updateAbilities(){
  for (const s in G.abil){ const a = G.abil[s]; if (a.cd > 0) a.cd--; if (a.flash > 0) a.flash--; }
  if (!G.abilQ.length) return;
  const due = G.abilQ.filter(q => q.at <= G.frame);
  G.abilQ = G.abilQ.filter(q => q.at > G.frame);
  for (const q of due){
    const u = q.u;
    if (u === G.leader ? u.down : u.state !== 'up') continue;
    SFX.play(ABILITIES[q.spec].sfx);
    pop(u.x, u.y - 32, ABILITIES[q.spec].name.toUpperCase(), '#ffe9a8');
    ABIL_FX[q.spec](u);
  }
}
const liveFoes = () => G.enemies.filter(e => !e.dead && !(e.dormant && !e.seen));
const ABIL_FX = {
  SOLDIER(u){
    const R = G.mod.radius;   /* Index 32: the bash reaches as far as the Command Radius */
    G.fx.push({shock:true, x:u.x, y:u.y, r:R, life:30, max:30, c:'#d4af37'}); G.shake = Math.max(G.shake, 10);
    for (const e of liveFoes()){
      if (dist(e, u) > R) continue;
      const B = BESTIARY[e.k], a = Math.atan2(e.y - u.y, e.x - u.x), push = B.boss ? 12 : 42;
      e.x += Math.cos(a) * push; e.y += Math.sin(a) * push; collide(e, e.r * .7);
      e.stagger = Math.max(e.stagger || 0, B.boss ? 50 : 120); e.slow = Math.max(e.slow || 0, 120);
      strike(e, u.s.melee + 1, G.melee.dmg, {from:u});
    }
  },
  FOLK_HERO(u){
    for (const v of squadUnits()) v.timer = 0;
    G.chargeT = Math.max(G.chargeT, 150); G.chargeAnnounce = true;
    G.fx.push({ring:true, x:u.x, y:u.y, r:G.mod.radius, life:18, c:'#ffd860'});
  },
  SCOUNDREL(u){
    let best = null, score = -1;
    for (const e of liveFoes()){
      if (dist(e, u) > 400 || !clearLine(u, e)) continue;
      const sc = (BESTIARY[e.k].boss ? 1000 : 0) + e.con;
      if (sc > score){ score = sc; best = e; }
    }
    if (!best){ pop(u.x, u.y - 46, 'NO TARGET', '#999'); return; }
    const a = Math.atan2(best.y - u.y, best.x - u.x);
    G.shots.push({by:u, x:u.x, y:u.y - 8, vx:Math.cos(a) * 11, vy:Math.sin(a) * 11, life:50, kind:'called', target:best,
                  flat:2 + damageRoll(G.ranged.dmg + 1, 0)});
  },
  CLERIC(u){
    const heal = Math.max(1, u.s.magic || 1) + 1 + (allied('mendor') ? 1 : 0) + (cmIs('DEVOUT') ? 1 : 0), L = G.leader;
    let best = null, need = 0;
    const consider = (v, n) => { if (n > need){ need = n; best = v; } };
    if (L.down) consider(L, 99);
    else consider(L, (L.maxCon - L.con) * 2 + (L.maxWounds - L.wounds));
    for (const m of G.squad){
      if (m.state === 'dead') continue;
      if (m.state !== 'up') consider(m, 50 - dist(m, u) / 100);
      else consider(m, (m.maxCon - m.con) * 2);
    }
    if (!best){ addWard(1); pop(u.x, u.y - 46, 'NOBODY HURT: +1 WARD', '#87ceeb'); return; }
    G.fx.push({beam:true, x:u.x, y:u.y, tx:best.x, ty:best.y, life:18, c:'#ffe680'});
    G.fx.push({ring:true, x:best.x, y:best.y, r:30, life:16, c:'#ffe680'});
    if (best === L){
      if (L.down) standLeader('CURE WOUNDS');
      const toCon = Math.min(heal, L.maxCon - L.con); L.con += toCon;
      L.wounds = Math.min(L.maxWounds, L.wounds + heal - toCon);
    } else {
      if (best.state !== 'up') standUp(best, 'CURE WOUNDS');
      best.con = Math.min(best.maxCon, best.con + heal);
    }
    pop(best.x, best.y - 20, '+' + heal, '#8fd39a');
  },
  MAGE(u){
    const len = 380, ang = G.facing, ex = u.x + Math.cos(ang) * len, ey = u.y + Math.sin(ang) * len;
    G.fx.push({bolt:true, x:u.x, y:u.y - 8, tx:ex, ty:ey - 8, life:16, seed:Math.random() * 1000});
    G.shake = Math.max(G.shake, 6);
    const skill = (u.s.magic || 1) + 1 + G.mod.precision;
    for (const e of liveFoes()){
      const rx = e.x - u.x, ry = e.y - u.y, t = rx * Math.cos(ang) + ry * Math.sin(ang);
      if (t < 0 || t > len) continue;
      if (Math.abs(-rx * Math.sin(ang) + ry * Math.cos(ang)) > e.r + 16) continue;
      strike(e, skill, 4, {crush:1});
    }
  },
  WITCH(u){
    G.illusionT = Math.max(G.illusionT, 0) + 360;
    G.fx.push({ring:true, x:G.leader.x, y:G.leader.y, r:G.mod.radius, life:22, c:'#9a5fc8'});
  }
};

/* ---------------------------------------------------------------------------
   THE ABILITY BAR - bottom of the screen, one slot per Specialty in the squad
--------------------------------------------------------------------------- */
/* PL-1 items 1+2 (AD rulings, glyph sheet v2): the badge is a vector (js/art/glyphs-vec.js), not a 13 px pixel sprite.
   abilIcon(glyph, col[, D]) is the baked canvas, D device px; abilIconAt draws it 1:1 at whole device pixels, smooth. */
const abilIcon = (glyphName, col, D) => GLYPHVEC.bake(glyphName, col, D);
const abilIconAt = (glyphName, col, x, y, S) => GLYPHVEC.at(ctx, glyphName, col, x, y, S);
function drawAbilityBar(){}   /* INDEX HD1: the Deck draws the ability buttons on the band; the old bar went in INT-1 group 14 */

window.ABIL_TEST = {
  selfTest: function(){
    const out = [], ok = (name, pass, info) => out.push({name, pass: !!pass, info: info || ''});
    try {
      const specs = ['SOLDIER', 'FOLK_HERO', 'SCOUNDREL', 'CLERIC', 'MAGE', 'WITCH'];
      ok('ABILITIES defines all 6 specialties', specs.every(s => !!ABILITIES[s] && ABILITIES[s].cd > 0));
      ok('ABIL_FX defines all 6 handlers', specs.every(s => typeof ABIL_FX[s] === 'function'));
      ok('ABIL_KEYS maps keys to valid specs', Object.values(ABIL_KEYS).every(s => !!ABILITIES[s]));
      { const v = window.GLYPHVEC ? GLYPHVEC.selfTest() : {ok: false, fails: ['GLYPHVEC missing']}; ok('PL-1 items 1+2: the ability badge is a vector, every glyph in use drawn', v.ok, v.fails.join('; ')); }
    } catch (e) { ok('threw', false, e && e.message); }
    const fails = out.filter(r => !r.pass).map(r => r.name + (r.info ? ' (' + r.info + ')' : ''));
    return {ok: !fails.length, n: out.length, pass: out.length - fails.length, fails, out};
  }
};

