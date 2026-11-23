/* ============================================================================
   INDEX F46 - F-46: NO CLASS NICKNAMES (Patrick 2026-11-14, Leader screen shot)
   Classes are named only by their real names (Soldier, Folk Hero, Scoundrel,
   Cleric, Mage, Witch). This file removes the made-up labels:
   - the role tags under each Specialty (Front-liner, Archer, Knife, Support,
     Artillery, Debuffer): SPECS[k].role becomes '' and empty role lines hide;
   - the ready-made Leaders' names (The Shield, The Bow, The Medic): each card
     shows its Specialty name instead; their badges (Good first pick, Easy to
     read, Keeps people alive) are dropped;
   - the plain-English one-liners (js/ui/ux.js PL_SPEC46) lose their "Archer.",
     "Healer." style prefixes; the build-card line in index.html skips an
     empty role; js/combat/balance.js archWho drops the repeated Specialty name.
   The Human race card's GOOD FIRST PICK badge goes too (Patrick 2026-11-15;
   index.html race step).
   Ids (shield, bow, medic) stay, so saves, CR.arch and the bot are untouched.
   INT-1 group 11: no switch (applied once at load).
============================================================================ */
(function(){
  const F46 = window.F46 = {};
  const KEYS = Object.keys(SPECS);

  document.head.appendChild(Object.assign(document.createElement('style'), {id: 'f46-css', textContent:
    'body.f46 .role:empty, body.f46 .ux-role:empty{display:none}'}));

  F46.apply = function(){
    KEYS.forEach(k => { SPECS[k].role = ''; });
    STARTERS.forEach(s => { s.name = SPECS[s.spec] ? SPECS[s.spec].name : s.name; delete s.tag; });
    if (document.body) document.body.classList.add('f46');
  };

  F46.BANNED = ['Front-liner', 'Archer', 'Knife', 'Support', 'Artillery', 'Debuffer',
                'The Shield', 'The Bow', 'The Medic', 'Good first pick', 'Easy to read', 'Keeps people alive'];

  F46.selfTest = function(){
    const rows = [], ok = (name, pass, info) => rows.push({name, pass: !!pass, info: info || ''});
    try {
      F46.apply();
      ok('every SPECS role is empty', KEYS.every(k => SPECS[k].role === ''));
      ok('starters carry Specialty names', STARTERS.every(s => s.name === SPECS[s.spec].name), STARTERS.map(s => s.name).join(', '));
      ok('starters have no badge', STARTERS.every(s => !s.tag));
      ok('starter ids kept', STARTERS.map(s => s.id).join() === 'shield,bow,medic', STARTERS.map(s => s.id).join());
      /* the Leader screen as drawn: no banned word in the visible text */
      let txt = '';
      try {
        if (typeof CR !== 'undefined' && CR && document.getElementById('ldr-left')){
          txt = document.getElementById('ldr-left').innerText || '';
          const bad = F46.BANNED.filter(w => new RegExp('\\b' + w + '\\b').test(txt));
          ok('Leader screen shows no nickname', !bad.length, bad.join(', '));
        }
      } catch (e) {}
    } catch (e) { ok('no throw', false, e.message); }
    const pass = rows.filter(r => r.pass).length;
    return {pass, total: rows.length, rows};
  };

  const go = () => F46.apply();
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
