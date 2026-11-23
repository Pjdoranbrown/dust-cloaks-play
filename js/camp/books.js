/* F-33 steps 5 and 6 (audits/drills-books.md): the loadout panel; books, libraries and scrolls (step 6 block below). Always on (BOOK33.on was removed in INT-1, 2026-11-15).
   - Each character's book: p.book (ids in ABIL33.REG of their own Specialty); the Specialty's starting active is always in it.
     Step 6 fills books from the libraries and scrolls (B.copy) and from studied spells (B.migrate).
   - The loadout: p.slots = {active: id or null, auto: [ids]}. No p.slots = the default (the starting active on the key, nothing in
     the spare slots), so a player who never opens the panel plays as in step 4 without Shift.
   - Spare auto slots = ABIL33.slotsFor(p) - 1 (the Specialty attack holds the first). An ability sits on the key or in one auto slot,
     never both; moving the key's active to auto empties the key. A loadout with nothing in it puts the starting active back on the key.
   - Set in the Barracks (with the drills) and at the Planning Table under Who Marches. Fixed at SIGN AND MARCH: ABIL33 reads it once
     per contract (u.lo33), set() refuses while a contract runs, and Shift no longer toggles auto. */
(function(){
  'use strict';
  const B = window.BOOK33 = {};
  const A = () => window.ABIL33;
  B.live = () => !!(window.F33 && A());
  B.locked = () => typeof G !== 'undefined' && !!G && !!G.leader && !G.over;
  B.START_AUTO = {SOLDIER: 'Sweep', FOLK_HERO: 'Marksman', SCOUNDREL: 'Soft Spot', MAGE: 'Magic Missile', WITCH: 'Withering Hex', CLERIC: 'Mending Prayer'};
  B.start = spec => A() ? A().idOf(spec) : null;
  B.name = id => A().nameOf(id);
  B.book = function(p, spec){
    spec = spec || (p && p.spec); const st = B.start(spec), out = st ? [st] : [];
    for (const id of (p && Array.isArray(p.book) ? p.book : [])){ const R = A().REG[id]; if (R && R.spec === spec && !out.includes(id)) out.push(id); }
    return out;
  };
  B.total = (p, spec) => A().slotsFor(Object.assign({}, p, {spec: spec || (p && p.spec)}));
  B.spare = (p, spec) => Math.max(0, B.total(p, spec) - 1);
  B.loadout = function(p, spec){
    spec = spec || (p && p.spec); const st = B.start(spec) || null, s = p && p.slots;
    if (!s) return {active: st, auto: []};
    const bk = B.book(p, spec);
    let active = s.active === null ? null : bk.includes(s.active) ? s.active : st;
    const auto = [];
    for (const id of (Array.isArray(s.auto) ? s.auto : [])) if (bk.includes(id) && id !== active && !auto.includes(id)) auto.push(id);
    auto.length = Math.min(auto.length, B.spare(p, spec));
    if (!active && !auto.length) active = st;
    return {active, auto};
  };
  B.who = pid => pid === 'L' ? (typeof META !== 'undefined' && META.leader) || null : ((typeof META !== 'undefined' && META.roster) || []).find(p => p.id === pid) || null;

  /* slot: 'key' or the spare auto slot's index; val: an id from the book, or '' for empty */
  B.set = function(pid, slot, val, where){
    if (!B.live() || B.locked()) return false;
    const p = B.who(pid); if (!p) return false;
    const spec = p.spec, n = B.spare(p, spec), lo = B.loadout(p, spec);
    val = val || null; if (val && !B.book(p, spec).includes(val)) return false;
    let active = lo.active, auto = lo.auto.slice();
    if (slot === 'key'){ active = val; auto = auto.filter(id => id !== val); }
    else {
      const i = slot | 0; if (i < 0 || i >= n) return false;
      const arr = Array.from({length: n}, (_, k) => auto[k] || null).map(id => id === val ? null : id);
      arr[i] = val; auto = arr.filter(Boolean);
      if (val && val === active) active = B.book(p, spec).find(id => !auto.includes(id)) || null;   // the key takes the next book entry, if any (QA: "(nothing)")
    }
    p.slots = {active, auto};
    p.slots = B.loadout(p, spec);
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof SFX !== 'undefined') SFX.play('pick');
    B.redraw(where);
    return true;
  };
  B.redraw = function(where){
    try { if (where === 'table'){ if (typeof renderTable === 'function') renderTable(); }
          else if (where === 'camp'){ if (typeof refreshProgression === 'function') refreshProgression(); } } catch (e) {}
  };

  /* ---- the panel ---- */
  const esc_ = t => typeof esc === 'function' ? esc(t) : String(t);
  /* F-48 fifth pass (phone width). B.K18 = false turns K22 to K24 off. K22: no keys on a phone, so the loadout speaks of the button on the bar. */
  B.narrow = () => B.K18 !== false && (B._narrow != null ? !!B._narrow : typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches);
  B.rowHTML = function(p, pid, where, key){
    const spec = p && p.spec, st = B.start(spec); if (!st) return '';
    const lo = B.loadout(p, spec), bk = B.book(p, spec), n = B.spare(p, spec), tot = B.total(p, spec);
    const arg = typeof pid === 'number' ? pid : `'${pid}'`;
    const kc = key === 'E' ? 'E' : key ? 'Key ' + key : '?', lk = B.locked();
    const sel = (slot, cur, empty) => `<select style="font:inherit;font-size:14px"${lk ? ' disabled' : ''} title="${esc_(B.slotTip(slot, cur, key, lk))}" onchange="BOOK33.set(${arg},${slot === 'key' ? "'key'" : slot},this.value,'${where}')">`
      + `<option value="">${empty}</option>` + bk.map(id => `<option value="${id}"${id === cur ? ' selected' : ''}>${esc_(B.name(id))}</option>`).join('') + '</select>';
    const sp = (typeof SPECS !== 'undefined' && SPECS[spec]) || {};
    let autos = tot >= 1 ? `<i>${B.START_AUTO[spec] || 'Specialty attack'}</i> (always)` : '<i>no auto slot yet</i>';
    for (let i = 0; i < n; i++) autos += ' + ' + sel(i, lo.auto[i] || null, '(empty)');
    const nx = B.nextSlot(p, spec); if (tot >= 1 && nx) autos += ` <span style="opacity:.7">(${esc_(nx)})</span>`;
    return `<div class="line" style="flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:14px"><b>${esc_(p.name || 'Leader')}</b>`
      + `<span style="opacity:.75">${esc_(sp.name || spec)}</span> · ${B.narrow() ? 'Active (your button on the bar)' : `Active (on the key) <b>${kc}</b>`} ${sel('key', lo.active, lo.active ? '(nothing)' : '(nothing: all on auto)')} · Auto slots (cast on their own): ${autos}</div>`
      + (B.K18 !== false && B.msg && B.msgPid != null && String(B.msgPid) === String(pid) ? `<div style="font-size:14px;margin-left:12px;color:#226b2a" data-msg33="1"><b>${esc_(B.msg)}</b></div>` : '')   // K23: the word sits on the person's own row
      + B.libHTML(p, pid, where);
  };
  /* Narrative section 4: slot tooltips (seconds; auto x ABIL33.K.autoMul) and the next-slot line */
  B.cdS = id => { const R = A().REG[id]; return R ? Math.round(R.cdS || R.cd || 0) : 0; };
  B.slotTip = function(slot, id, key, lk){
    if (lk) return 'Locked until the contract ends.';
    if (slot === 'key') return id ? `${B.name(id)}: press ${key || 'the key'} to use it. Recharge ${B.cdS(id)}s.` : 'Choose an ability from the book for the key.';
    return id ? `${B.name(id)}: casts on its own. Recharge ${Math.round(B.cdS(id) * A().K.autoMul)}s, ${Math.round((A().K.autoMul - 1) * 100)}% longer than on the key.`
      : 'Empty auto slot. Choose an ability from the book.';
  };
  B.nextSlot = function(p, spec){
    const sp = (typeof SPECS !== 'undefined' && SPECS[spec]) || {};
    if (sp.caster){ const m = Math.max(2, B.magic(p) + 1); return m <= 5 ? `Another auto slot opens with ${m} Magic.` : ''; }
    const adv = p.adv != null ? (p.adv | 0) : Math.max(0, (p.level | 0) - 1), n = (A().K.fighterAt || []).find(k => k > adv);
    return n ? `Another auto slot opens at ${n} Advancements.` : '';
  };
  B.libHTML = function(p, pid, where){
    if (!p || !p.spec) return '';   // K17: a call with nothing to show draws nothing
    if (pid == null) pid = p === (typeof META !== 'undefined' && META && META.leader) ? 'L' : p.id;
    const spec = p.spec, lv = B.libLevel(spec), bk = B.book(p, spec), arg = typeof pid === 'number' ? pid : `'${pid}'`;
    const fac = id => { const f = typeof facility === 'function' ? facility(String(id).replace('#', '')) : null; return f ? f.name : id; };
    const lib = (B.LIB[spec] || []), want = B.library(spec).filter(id => !bk.includes(id));
    const spN = esc_(typeof specPlural === 'function' ? specPlural(spec) : (((typeof SPECS !== 'undefined' && SPECS[spec]) || {}).name || spec) + 's'), all = B.library(spec);   // K71: Witches, Folk Heroes
    let h = '';
    if (!lv) h = `<span style="opacity:.7">No library yet: build the ${esc_(fac(lib[0]))}.</span>`;
    else if (!all.length) h = `<span style="opacity:.7">This library has nothing for ${spN} yet.</span>`;
    else h = `<span style="opacity:.8">${esc_(fac(lib[0]))} library: ${all.length} abilit${all.length === 1 ? 'y' : 'ies'} for ${spN}.</span>`;
    for (const id of want){ const L = B.LAD[id], c = B.cost(id), low = L.minMagic && B.magic(p) < L.minMagic, poor = (META.treasury | 0) < c;
      const tip = poor ? 'Not enough gold to copy this.' : low ? 'Needs Magic ' + L.minMagic + '.'
        : `${L.src === 'scroll' ? 'From a found scroll' : L.src === 'L2' ? 'Library, first upgrade' : 'Library'}. Recharge ${L.cdS}s${L.favour ? ', ' + L.favour + ' Favour' : ''}.`;
      h += ` <button class="btn" style="font-size:14px;padding:1px 6px"${low || poor ? ' disabled' : ''} onclick="BOOK33.copy(${arg},'${id}','${where}')"`
        + ` title="${tip}">Copy ${esc_(L.name)} into book (${c}gp${B.K18 !== false ? ', recharge ' + L.cdS + 's' : ''})${low ? ' (Magic ' + L.minMagic + ')' : ''}</button>`; }
    if (lv === 1 && lib[1]) h += ` <span style="opacity:.7">${lib[1][0] === '#' ? (B.K18 !== false ? 'More when a veteran runs the ' + esc_(fac(lib[0])) + '.' : 'Upgrade the ' + esc_(fac(lib[0])) + ' (a veteran on staff) to add more.') : 'Build the ' + esc_(fac(lib[1])) + ' to add more.'}</span>`;
    const known = bk.length > 1 ? `Book: ${bk.map((id, i) => `<span style="white-space:nowrap">${esc_(B.name(id)) + B.pipHTML(p, id) + B.studyHTML(p, id, arg, where)}${i < bk.length - 1 ? ',' : '.'}</span>`).join(' ')} ` : '';   /* Art PROG-1 note 3: an entry keeps its comma, so no line starts with one */
    return (known || h) ? `<div class="line" style="flex-wrap:wrap;gap:4px 6px;align-items:center;font-size:14px;opacity:.95;margin-left:12px">${known}${h}</div>` : '';
  };
  B.panelHTML = function(list, where){
    /* K17: one person, or nothing, is taken as a list (test calls threw) */
    if (!Array.isArray(list)) list = list && list.p ? [list] : list && list.spec ? [{p: list, pid: list === META.leader ? 'L' : list.id, key: list === META.leader ? 'E' : '1-5'}] : [];
    where = where || 'camp';
    const noLib = B.K17 !== false && list.some(x => x && x.p && B.LIB[x.p.spec] && !B.libLevel(x.p.spec));
    const rows = B.K47 !== false && where === 'camp' ? B.groupHTML(list, where) : list.map(x => B.rowHTML(x.p, x.pid, where, x.key)).filter(Boolean).join('');
    if (!rows) return '';
    const fold = B.K47 !== false && where === 'camp' && !B.locked();   // UX K47: in the Barracks the how-to words fold away
    return `<div class="desc" style="text-align:left;margin-top:8px" data-book33="1"><b>Loadout.</b> ` + (fold ? `<details class="bk47h"${B.OPEN47.how ? ' open' : ''} ontoggle="BOOK33.OPEN47.how=this.open" style="display:inline"><summary style="cursor:pointer;display:inline;opacity:.85">How the loadout works</summary> ` : '')
      + (B.locked() ? '<b>The squad has marched. The loadout is locked until the contract ends.</b> '
        : (B.narrow() ? 'Pick one ability for your button' : 'Pick one ability for the key') + ' and fill the auto slots from the book. An ability on auto works by itself, but recharges more slowly. The loadout locks when you sign and march. ')
      + `<span style="opacity:.8">The default is the Specialty's starting ability. If you never open this panel, you play as before.</span>`
      + (B.K17 !== false ? ` <span style="opacity:.8">${B.narrow() ? '' : 'Your own ability is on E. Squad Mates use keys 1 to 5, in marching order.'}${noLib ? " Each Specialty's book is kept in its own building." : ''}</span>` : '')
      + (fold ? '</details>' : '')
      + (B.waiting().length ? ` ${B.waiting().length} scroll${B.waiting().length > 1 ? 's' : ''} waiting to be copied: ${B.waiting().map(id => esc_(B.name(id))).join(', ')}.` : '')
      + (B.msg && !(B.K18 !== false && B.msgPid != null && list.some(x => x && String(x.pid) === String(B.msgPid))) ? ` <b>${esc_(B.msg)}</b>` : '') + `${rows}</div>`;
  };
  /* UX K47 (f48, PD-42's pattern): in the Barracks the Leader's row stays open and the Squad Mates sit in closed sections by
     Specialty (open state kept in B.OPEN47 across redraws). A section opens itself when it holds the last message or a
     Research question waiting on Confirm. The Planning Table list is short and stays as it was. B.K47 = false turns it off. */
  B.OPEN47 = {};
  B.groupHTML = function(list, where){
    const lead = [], groups = {}, order = [];
    for (const x of list){ if (!x || !x.p) continue; const h = B.rowHTML(x.p, x.pid, where, x.key); if (!h) continue;
      if (x.pid === 'L'){ lead.push(h); continue; }
      const sp = x.p.spec; if (!groups[sp]){ groups[sp] = []; order.push(sp); } groups[sp].push({x, h}); }
    const askSpec = (() => { try { const id = window.PROG5 && PROG5.ask; return id && B.LAD[id] ? B.LAD[id].spec : null; } catch (e) { return null; } })();
    return lead.join('') + order.map(sp => {
      const g = groups[sp], S = (typeof SPECS !== 'undefined' && SPECS[sp]) || {};
      const hot = askSpec === sp || (B.msgPid != null && g.some(o => String(o.x.pid) === String(B.msgPid))) || g.some(o => /data-ask5="1"/.test(o.h));
      const nm = esc_(typeof specPlural === 'function' ? specPlural(sp) : (S.name || sp) + 's'), n = g.reduce((a, o) => a + (o.h.match(/<button(?![^>]*disabled)/g) || []).length, 0);
      return `<details class="bk47" data-spec47="${sp}"${B.OPEN47[sp] || hot ? ' open' : ''} ontoggle="BOOK33.OPEN47['${sp}']=this.open" style="margin:4px 0">`
        + `<summary style="cursor:pointer;padding:3px 0;font-size:14px"><b${S.color ? ` style="color:${S.color}"` : ''}>${nm}</b> (${g.length}): ${g.map(o => esc_(o.x.p.name || '')).join(', ')}`
        + `${n ? ` <span style="opacity:.75">· ${n} option${n === 1 ? '' : 's'}</span>` : ''}</summary>${g.map(o => o.h).join('')}</details>`;
    }).join('');
  };
  B.waiting = () => B.scrolls().filter(id => ![META.leader].concat(META.roster || []).some(p => p && Array.isArray(p.book) && p.book.includes(id)));
  B.campList = () => [{p: META.leader, pid: 'L', key: 'E'}].concat((META.roster || []).map(p => ({p, pid: p.id, key: '1-5'})));
  B.tableList = () => {
    const ids = (typeof MU !== 'undefined' && MU && MU.ids) || [];
    return [{p: META.leader, pid: 'L', key: 'E'}].concat((META.roster || []).filter(p => ids.includes(p.id)).map((p, i) => ({p, pid: p.id, key: String(i + 1)})));
  };

  /* ======== step 6: libraries, scrolls, copying, ranks ========
     The ladders are Systems' draft (audits/drills-books.md, Ladders); ladder cooldowns are drafts [S]. Prices and the scroll weight approved by Patrick 2026-11-14 (Systems' set).
     src: L1 = the Specialty building's library as built, L2 = its first upgrade (B.LIB), scroll = a chest find (META.scrolls).
     Copying into a book costs gold (B.K.copy). Ranks: p.rank[id] (default 1), bought with B.study, pips on the badge and in the book line.
     Studied spells in p.picks map into the book once each (p.book33m); while the books are live those cards stop running on their
     own cadence (the button replaces them) and fill any free spare auto slot the first time. */
  B.K = {copy: {L1: 60, L2: 120, scroll: 150}, scrollW: 2, emptyScrollGold: 25};   // approved 2026-11-14: scroll weight 1 -> 2
  B.LIB = {SOLDIER: ['training', '#training'], FOLK_HERO: ['ranger', '#ranger'], SCOUNDREL: ['tavern', 'cells'],
           MAGE: ['magetower', '#magetower'], WITCH: ['alchemy', '#alchemy'], CLERIC: ['chapel', 'fortresschurch']};   // [L1, L2]; '#x' = a veteran on staff there
  B.MIG = ['burning', 'fireball', 'stonewall', 'decoy', 'tremor', 'briar', 'omen', 'veil', 'raindance', 'bless', 'masscure', 'flamestrike', 'silence'];
  B.has = id => { try { return typeof has === 'function' && !!has(id); } catch (e){ return false; } };
  B.libLevel = spec => { const l = B.LIB[spec]; return !l || !B.has(l[0]) ? 0 : B.has(l[1]) ? 2 : 1; };
  B.scrolls = () => (typeof META !== 'undefined' && META && Array.isArray(META.scrolls)) ? META.scrolls : [];
  B.LAD = {};
  B.library = function(spec){
    const lv = B.libLevel(spec), sc = B.scrolls(), out = [];
    for (const id in B.LAD){ const L = B.LAD[id]; if (L.spec !== spec) continue;
      if ((L.src === 'L1' && lv >= 1) || (L.src === 'L2' && lv >= 2) || (L.src === 'scroll' && sc.includes(id))) out.push(id); }
    return out;
  };
  B.cost = id => { const L = B.LAD[id]; return L ? B.K.copy[L.src] || 0 : 0; };
  B.magic = p => { if (!p) return 0; if (typeof META !== 'undefined' && p === META.leader && typeof leaderStats === 'function'){ try { return leaderStats(p).magic | 0; } catch (e) {} } return p.magic | 0; };
  B.copy = function(pid, id, where){
    if (!B.live() || B.locked()) return false;
    const p = B.who(pid), L = B.LAD[id]; if (!p || !L || L.spec !== p.spec || B.book(p).includes(id) || !B.library(p.spec).includes(id)) return false;
    if (L.minMagic && B.magic(p) < L.minMagic) return false;
    const c = B.cost(id); if ((META.treasury | 0) < c){ if (typeof SFX !== 'undefined') SFX.play('nope'); return false; }
    META.treasury -= c; p.book = (Array.isArray(p.book) ? p.book : []).concat(id);
    B.msg = `${p.name || 'The Leader'} copies ${L.name} into their book.`; B.msgPid = pid;
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof SFX !== 'undefined') SFX.play('pick');
    B.redraw(where); return true;
  };
  B.migrate = function(p){
    if (!p || !Array.isArray(p.picks)) return false;
    const done = Array.isArray(p.book33m) ? p.book33m : [], fresh = p.picks.filter(id => B.MIG.includes(id) && !done.includes(id));
    if (!fresh.length) return false;
    p.book33m = done.concat(fresh);
    const add = fresh.filter(id => A().REG[id] && A().REG[id].spec === p.spec && !(p.book || []).includes(id));
    if (add.length){ p.book = (Array.isArray(p.book) ? p.book : []).concat(add);
      const n = B.spare(p); if (!p.slots && n > 0) p.slots = {active: B.start(p.spec), auto: add.slice(0, n)}; }
    return true;
  };
  B.migrateAll = function(){
    if (!B.live() || typeof META === 'undefined' || !META) return 0; let n = 0;
    for (const p of [META.leader].concat(META.roster || [])) if (B.migrate(p)) n++;
    if (n && typeof saveMeta === 'function') saveMeta();
    return n;
  };
  B.rank = (u, id) => { const L = B.LAD[id], p = A().pOf(u); return Math.max(1, Math.min(L ? L.max || 1 : 1, (p && p.rank && p.rank[id]) | 0 || 1)); };
  B.pips = (u, id) => { const L = B.LAD[id]; return L ? {n: B.rank(u, id), max: L.max || 1} : null; };
  /* Ranks are bought with study (Director 2026-11-14; the leaderStudy path): at the Specialty's library building, once a downtime per
     character (p.study33At = META.deployments, like META.leaderStudyAt); price = the copy price x B.K.study x the current rank [S]. */
  B.K.study = 1;
  B.rankP = (p, id) => { const L = B.LAD[id]; return Math.max(1, Math.min(L ? L.max || 1 : 1, (p && p.rank && p.rank[id]) | 0 || 1)); };
  B.studyInfo = function(p, id){
    const L = B.LAD[id]; if (!p || !L || (L.max || 1) < 2 || !B.book(p).includes(id)) return null;
    const n = B.rankP(p, id); if (n >= L.max) return {n, max: L.max, done: true};
    const price = Math.round(B.cost(id) * B.K.study * n), lib = B.LIB[p.spec] || [];
    const f = typeof facility === 'function' ? facility(String(lib[0])) : null, fac = f ? f.name : lib[0];
    const why = !B.libLevel(p.spec) ? 'Build the ' + fac + ' first.' : (META.deployments | 0) === p.study33At ? 'Already studied this downtime.'
      : (META.treasury | 0) < price ? 'Not enough gold.' : '';
    return {n, max: L.max, next: n + 1, price, why, ok: !why};
  };
  B.pipHTML = function(p, id){
    const L = B.LAD[id]; if (!L || (L.max || 1) < 2) return '';
    const n = B.rankP(p, id);
    return ` <span title="Rank ${n}. Ranks are bought with study." style="letter-spacing:1px;color:#b8892a">${'●'.repeat(n)}${'○'.repeat(L.max - n)}</span>`
      + (B.K18 !== false ? ` <span style="font-size:14px;opacity:.8">Rank ${n} of ${L.max}.${n < L.max ? ' Study raises the rank.' : ''}</span>` : '');   // K24: the pips in words
  };
  B.studyHTML = function(p, id, arg, where){
    const i = B.studyInfo(p, id); if (!i || i.done) return '';
    return ` <button class="btn" style="font-size:14px;padding:0 5px"${i.ok && !B.locked() ? '' : ' disabled'} title="${esc_(i.ok ? 'Rank ' + i.next + ': bought with study, shown as pips on the button.' : i.why)}"`
      + ` onclick="BOOK33.study(${arg},'${id}','${where}')">Study (${i.price > 0 ? i.price + 'gp' : 'free'})</button>`;   // K72: no 'Study (0gp)'
  };
  B.study = function(pid, id, where){
    if (!B.live() || B.locked()) return false;
    const p = B.who(pid), i = B.studyInfo(p, id);
    if (!i || !i.ok){ if (typeof SFX !== 'undefined') SFX.play('nope'); return false; }
    META.treasury -= i.price; p.rank = Object.assign({}, p.rank, {[id]: i.next}); p.study33At = META.deployments | 0;
    B.msg = `${p.name || 'The Leader'} studies ${B.name(id)}. Rank ${i.next}.`; B.msgPid = pid;
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof SFX !== 'undefined') SFX.play('level');
    B.redraw(where); return true;
  };

  /* ---- scrolls: one roll in the chest table; the find goes to META.scrolls, the company's library ---- */
  B.findScroll = function(at){
    const pool = Object.keys(B.LAD).filter(id => B.LAD[id].src === 'scroll' && !B.scrolls().includes(id));
    if (!pool.length){ if (G) G.coin = (G.coin | 0) + B.K.emptyScrollGold; return null; }
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!Array.isArray(META.scrolls)) META.scrolls = [];
    META.scrolls.push(id);
    const t = 'SCROLL: ' + A().nameOf(id).toUpperCase();
    if (typeof pop === 'function' && at) pop(at.x, at.y - 40, t, '#c8a8ff');
    if (typeof note === 'function') note(`You find a scroll: ${A().nameOf(id)}. Copy it into a book at the Barracks.`);
    return id;
  };

  /* ---- the ladder actives ---- */
  const foes = () => typeof liveFoes === 'function' ? liveFoes() : [];
  const near = (u, R) => foes().filter(e => dist(e, u) <= R);
  const HX = () => typeof HEX_PX !== 'undefined' ? HEX_PX : 39;
  const say = (x, y, t, c) => { if (typeof pop === 'function') pop(x, y - 46, t, c || '#ffe9a8'); };
  const ang = (u, aim) => aim ? Math.atan2(aim.y - u.y, aim.x - u.x) : (G.facing || 0);
  const inCone = (u, e, a, spread, reach) => { if (dist(e, u) > reach) return false; let d = Math.atan2(e.y - u.y, e.x - u.x) - a;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d) < spread; };
  const isBoss = e => !!(BESTIARY[e.k] && BESTIARY[e.k].boss);
  const tough = (u, R, los) => { let b = null, bs = -1;
    for (const e of foes()){ if (dist(e, u) > R || (los && typeof clearLine === 'function' && !clearLine(u, e))) continue;
      const s = (isBoss(e) ? 1000 : 0) + (e.shift | 0) * 60 + e.con; if (s > bs){ bs = s; b = e; } } return b; };
  const foeAt = (aim, r) => aim && window.F33 && F33.foeAt ? F33.foeAt(aim.x, aim.y, r || 60) : null;
  const shooters = (u, R) => foes().filter(e => dist(e, u) <= R && typeof RANGED_ARCH === 'function' && RANGED_ARCH(BESTIARY[e.k].arch));
  const crowdAt = (u, R, r) => { let b = null, bc = 0;
    for (const e of foes()){ if (dist(e, u) > R) continue; let c = 0; for (const o of foes()) if (dist(e, o) < r) c++; if (c > bc){ bc = c; b = e; } }
    return b ? {x: b.x, y: b.y, n: bc} : null; };
  const T = () => G.t33 || (G.t33 = {});
  const mates = u => (typeof squadUnits === 'function' ? squadUnits() : []).filter(v => v !== u);
  const hurtMates = () => (G.squad || []).filter(m => m.state === 'up' && m.con < m.maxCon);
  const st2 = () => typeof b2St === 'function' ? b2St() : null;
  const at = e => ({x: e.x, y: e.y});
  const L_ = () => G.leader;
  /* Art note 7: each library entry's icon (a GLYPHS key, drawn with badgeURL like the trait cards); no two alike within a Specialty.
     Entries added later (Ray of Frost, Lightning Bolt) read theirs through B.glyphOf. */
  B.GLYPH = {push:'shield', spearwall:'bars', breakarm:'anvil', sprint:'boot',
    rally:'horn', volley:'arrows', assist:'flag', overwatch:'eye',
    highlight:'eye', poison:'potion', disengage:'boot', smoke:'bomb',
    burning:'flame', fireball:'sun', stonewall:'bars', decoy:'mask', tremor:'anvil', frost:'snow', bolt:'star',
    briar:'thorn', omen:'skull', veil:'mask', raindance:'drop',
    bless:'cross', masscure:'heart', flamestrike:'flame', silence:'stake'};
  B.glyphOf = id => (B.LAD[id] && B.LAD[id].glyph) || B.GLYPH[id] || 'book';
  function lad(o){ if (!o.glyph) o.glyph = B.GLYPH[o.id] || 'book'; B.LAD[o.id] = o; if (A()) A().def2(o); }

  // Soldier (Training Grounds)
  lad({id: 'push', spec: 'SOLDIER', name: 'Push Back', src: 'L1', cdS: 14, aimed: true,
    when: u => { const e = near(u, 70)[0]; return e && near(u, 100).length >= 2 ? at(e) : false; },
    fx(u, aim){ const a = ang(u, aim), reach = 2.5 * HX(), hit = foes().filter(e => inCone(u, e, a, 0.8, reach));
      if (!hit.length){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      G.fx.push({cone: true, x: u.x, y: u.y, ang: a, spread: 0.8, reach, life: 16, c: '#d4af37'});
      for (const e of hit){ const d = Math.atan2(e.y - u.y, e.x - u.x), p = isBoss(e) ? 12 : 42; e.x += Math.cos(d) * p; e.y += Math.sin(d) * p;
        if (typeof collide === 'function') collide(e, e.r * .7); e.slow = Math.max(e.slow || 0, 60); }
      if (typeof SFX !== 'undefined') SFX.play('bash'); say(u.x, u.y, 'PUSH BACK'); return true; }});
  lad({id: 'spearwall', spec: 'SOLDIER', name: 'Spearwall', src: 'L1', cdS: 20,
    when: u => near(u, 160).length >= 3,
    fx(u){ T().spear = {until: G.frame + 360, u, hit: new Set()}; G.fx.push({ring: true, x: u.x, y: u.y, r: G.mod.radius * 0.6, life: 24, c: '#c8c0b0'});
      say(u.x, u.y, 'SPEARWALL'); return true; }});
  lad({id: 'breakarm', spec: 'SOLDIER', name: 'Break Armour', src: 'scroll', cdS: 24,
    when: u => near(u, 70).some(e => (e.shift | 0) >= 1),
    fx(u){ u.brk33 = 3; say(u.x, u.y, 'BREAK ARMOUR'); return true; }});
  lad({id: 'sprint', spec: 'SOLDIER', name: 'Sprint', src: 'L2', cdS: 25,
    when: () => { const L = L_(); return !L.down && L.con < L.maxCon * 0.5 && near(L, 120).length >= 3; },
    fx(u){ T().speed = {until: G.frame + 240, mul: 1.3}; G.fx.push({ring: true, x: u.x, y: u.y, r: G.mod.radius, life: 18, c: '#e0c070'}); say(u.x, u.y, 'SPRINT'); return true; }});

  // Folk Hero (Ranger's Hut)
  lad({id: 'rally', spec: 'FOLK_HERO', name: 'Rallying Cry', src: 'L1', cdS: 28,
    when: () => (G.wards | 0) <= 1 && near(L_(), 260).length >= 2,
    fx(u){ addWard(2); G.fx.push({ring: true, x: u.x, y: u.y, r: G.mod.radius, life: 18, c: '#d4af37'}); say(u.x, u.y, 'RALLYING CRY', '#d4af37'); return true; }});
  lad({id: 'volley', spec: 'FOLK_HERO', name: 'Volley Fire', src: 'L1', cdS: 24, max: 2,
    when: u => near(u, 420).length >= 4,
    fx(u){ T().volley = {until: G.frame + 300, add: B.rank(u, 'volley')}; say(u.x, u.y, 'VOLLEY FIRE'); return true; }});
  lad({id: 'assist', spec: 'FOLK_HERO', name: 'Assist Allies', src: 'L2', cdS: 16,
    when: u => mates(u).some(v => near(v, 100).length >= 2),
    fx(u){ let b = null, bn = 0; for (const v of mates(u)){ const n = near(v, 100).length; if (n > bn){ bn = n; b = v; } }
      if (!b){ say(u.x, u.y, 'NOBODY ENGAGED', '#999'); return false; }
      b.assistT = typeof T2B !== 'undefined' ? T2B.assistSec : 240; u.timer = (u.timer || 0) + (typeof T2B !== 'undefined' ? T2B.assistLoss : 43);
      G.fx.push({beam: true, x: u.x, y: u.y - 8, tx: b.x, ty: b.y - 8, life: 12, c: '#9fd8a0'}); say(b.x, b.y, 'ASSISTED: +1 STEP', '#9fd8a0'); return true; }});
  lad({id: 'overwatch', spec: 'FOLK_HERO', name: 'Overwatch', src: 'scroll', cdS: 30,
    when: () => { const L = L_(), R = G.mod.radius; return foes().filter(e => dist(e, L) > R && dist(e, L) < R * 2.2).length >= 3; },
    fx(u){ const L = L_(); T().over = {until: G.frame + 360, u, hit: new Set(near(L, G.mod.radius))};
      G.fx.push({ring: true, x: L.x, y: L.y, r: G.mod.radius, life: 24, c: '#9fd8a0'}); say(u.x, u.y, 'OVERWATCH'); return true; }});

  // Scoundrel (Camp Tavern, then the Cells)
  lad({id: 'highlight', spec: 'SCOUNDREL', name: 'Highlight Weakness', src: 'L1', cdS: 14, aimed: true,
    when: u => { const e = tough(u, 400, true); return e ? at(e) : false; },
    fx(u, aim){ const e = foeAt(aim) || tough(u, 420, true); if (!e){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      e.exposed = Math.max(e.exposed || 0, 180); G.fx.push({ring: true, x: e.x, y: e.y, r: 26, life: 18, c: '#ffd860'}); say(e.x, e.y, 'EXPOSED', '#ffd860'); return true; }});
  lad({id: 'poison', spec: 'SCOUNDREL', name: 'Poison the Blade', src: 'L2', cdS: 25,
    when: u => near(u, 60).length >= 1,
    fx(u){ u.poi33 = 3; say(u.x, u.y, 'POISON THE BLADE', '#8fd39a'); return true; }});
  lad({id: 'disengage', spec: 'SCOUNDREL', name: 'Disengage', src: 'L2', cdS: 20,
    when: () => { const us = mates(null); return foes().filter(e => us.some(v => dist(e, v) < 70)).length >= 3; },
    fx(u){ const us = mates(null), hit = foes().filter(e => us.some(v => dist(e, v) < 70));
      if (!hit.length){ say(u.x, u.y, 'NOBODY CLOSE', '#999'); return false; }
      for (const e of hit){ let v = us[0], vd = 1e9; for (const w of us){ const d = dist(e, w); if (d < vd){ vd = d; v = w; } }
        const d = Math.atan2(e.y - v.y, e.x - v.x), p = isBoss(e) ? 12 : 40; e.x += Math.cos(d) * p; e.y += Math.sin(d) * p;
        if (typeof collide === 'function') collide(e, e.r * .7); e.atkT = Math.max(e.atkT || 0, 120); }
      G.fx.push({ring: true, x: L_().x, y: L_().y, r: 70, life: 16, c: '#b0b0b0'}); say(u.x, u.y, 'DISENGAGE', '#b0b0b0'); return true; }});
  lad({id: 'smoke', spec: 'SCOUNDREL', name: 'Smoke', src: 'scroll', cdS: 30,
    when: () => !(G.smokeT > 0) && shooters(L_(), 380).length >= 3,
    fx(u){ G.smokeT = Math.max(G.smokeT | 0, 300); say(u.x, u.y, 'SMOKE', '#c0c0c0'); return true; }});

  // Mage (Mage Tower)
  lad({id: 'burning', spec: 'MAGE', name: 'Burning Hands', src: 'L1', cdS: 14, aimed: true, max: 3,
    when: u => { const e = near(u, 150)[0]; return e && foes().filter(o => inCone(u, o, Math.atan2(e.y - u.y, e.x - u.x), 0.77, 158)).length >= 2 ? at(e) : false; },
    fx(u, aim, o){ const r = B.rank(u, 'burning'), a = ang(u, aim), spread = 0.55 + r * 0.22, reach = 130 + r * 28, hit = foes().filter(e => inCone(u, e, a, spread, reach));
      G.fx.push({cone: true, x: u.x, y: u.y, ang: a, spread, reach, life: 16, c: '#e8923c'}); if (!(o && o.auto)) G.burned = true;   // GD E3: a cast the player makes counts, hit or miss; an auto-cast does not
      if (!hit.length){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      for (const e of hit) strike(e, 0, 0, {piercing: true, flat: 1 + r, from: u}); return true; }});
  lad({id: 'fireball', spec: 'MAGE', name: 'Fireball', src: 'L1', cdS: 18, aimed: true, max: 3,
    when: u => { const c = crowdAt(u, 420, 70); return c && c.n >= 3 ? c : false; },
    fx(u, aim, o){ const c = aim && dist(aim, u) <= 420 ? aim : crowdAt(u, 420, 70); if (!c){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      const hit = foes().filter(e => dist(e, c) < 78); if (!hit.length){ say(c.x, c.y, 'NO TARGET', '#999'); return false; }
      G.fx.push({blast: true, x: c.x, y: c.y, r: 0, max: 78, life: 22, c: '#e07a32'}); G.shake = Math.max(G.shake || 0, 8);
      const sk = Math.max(3, (u.s && u.s.magic) | 0) + 1 + (G.mod.precision | 0) + (B.rank(u, 'fireball') - 1);
      if (!(o && o.auto)) G.burned = true;   // GD E3: not on an auto-cast
      for (const e of hit) strike(e, sk, 4, {from: u}); if (typeof SFX !== 'undefined') SFX.play('blast'); return true; }});
  lad({id: 'stonewall', spec: 'MAGE', name: 'Conjure Stone Wall', src: 'L2', cdS: 45, aimed: true, minMagic: 2, max: 2,
    when: u => { const s = shooters(u, 420); return s.length >= 3 ? at(s[0]) : false; },
    fx(u, aim){ const s = st2(); if (!s || typeof T2B === 'undefined') return false;
      const r = B.rank(u, 'stonewall'), a = ang(u, aim), cx = u.x + Math.cos(a) * 70, cy = u.y + Math.sin(a) * 70, px = -Math.sin(a) * T2B.wallHalf, py = Math.cos(a) * T2B.wallHalf;
      s.wall = {x1: cx - px, y1: cy - py, x2: cx + px, y2: cy + py, until: G.frame + T2B.wallLife[r - 1], born: G.frame};
      say(cx, cy, 'CONJURE STONE WALL', '#c8c0b0'); if (typeof SFX !== 'undefined') SFX.play('bash'); return true; }});
  lad({id: 'decoy', spec: 'MAGE', name: 'Illusory Decoy', src: 'L2', cdS: 60, minMagic: 3,
    when: u => shooters(u, 420).length >= 4,
    fx(u, aim){ const s = st2(); if (!s || typeof T2B === 'undefined') return false; const a = ang(u, aim);
      s.decoy = {x: u.x + Math.cos(a) * T2B.decoyAhead, y: u.y + Math.sin(a) * T2B.decoyAhead, until: G.frame + T2B.decoySec, born: G.frame};
      say(s.decoy.x, s.decoy.y, 'ILLUSORY DECOY', '#9fd0ff'); if (typeof SFX !== 'undefined') SFX.play('heal'); return true; }});
  const quake = u => { if (typeof T2B === 'undefined') return null; const c = crowdAt(L_(), 8 * HX(), 70); if (!c) return null;
    const r = B.rank(u, 'tremor'), hit = foes().filter(e => !isBoss(e) && dist(e, c) < T2B.tremorRadius);
    const movers = hit.filter(e => BESTIARY[e.k].arch !== 'fixed').sort((a, b) => dist(a, c) - dist(b, c)).slice(0, T2B.tremorMax[r - 1]);
    return {c, hit, movers}; };
  lad({id: 'tremor', spec: 'MAGE', name: 'Earthquake Tremor', src: 'scroll', cdS: 25, minMagic: 4, max: 2,
    when: u => { const q = quake(u); return !!(q && q.movers.length >= 3); },
    fx(u){ const q = quake(u); if (!q || q.movers.length < 3){ say(u.x, u.y, 'TOO FEW TO TOPPLE', '#999'); return false; }
      G.fx.push({blast: true, x: q.c.x, y: q.c.y, r: 0, max: T2B.tremorRadius, life: 26, c: '#8a6a4a'}); G.shake = Math.max(G.shake || 0, 14);
      for (const e of q.movers){ e.stagger = Math.max(e.stagger || 0, T2B.tremorStagger); e.slow = Math.max(e.slow || 0, T2B.tremorSlow); }
      for (const e of q.hit) if (BESTIARY[e.k].arch === 'fixed') hurtEnemy(e, 2);
      if (typeof SFX !== 'undefined') SFX.play('bash'); say(q.c.x, q.c.y, 'EARTHQUAKE TREMOR (' + q.movers.length + ')', '#c8a878'); return true; }});

  // Witch (Alchemy Lab)
  lad({id: 'briar', spec: 'WITCH', name: 'Briar Thicket', src: 'L1', cdS: 20,
    when: () => near(L_(), 160).length >= 3,
    fx(u){ const L = L_(), a = (G.facing || 0) + Math.PI, bx = L.x + Math.cos(a) * 40, by = L.y + Math.sin(a) * 40, px = -Math.sin(a), py = Math.cos(a);
      for (const k of [-60, -20, 20, 60]) G.works.push({x: bx + px * k, y: by + py * k, r: 30, dmg: Math.max(1, G.mod.briarDmg | 0), life: 480, kind: 'briar'});
      say(L.x, L.y, 'BRIAR THICKET', '#8fd39a'); return true; }});
  lad({id: 'omen', spec: 'WITCH', name: 'Bleeding Omen', src: 'L1', cdS: 12, aimed: true, max: 2,
    when: () => { const e = tough(L_(), 6 * HX()); return e ? at(e) : false; },
    fx(u, aim){ if (typeof T2B === 'undefined') return false; const e = foeAt(aim) || tough(L_(), 6 * HX()); if (!e){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      const r = B.rank(u, 'omen'), list = foes().filter(o => dist(o, e) < 90).sort((a, b) => dist(a, e) - dist(b, e)).slice(0, T2B.omenMax[r - 1]);
      for (const o of list) o.omenT = T2B.omenSec; T().omen = true;
      G.fx.push({ring: true, x: e.x, y: e.y, r: 90, life: 18, c: '#b02a2a'}); say(e.x, e.y, 'BLEEDING OMEN (' + list.length + ')', '#e06a6a'); return true; }});
  lad({id: 'veil', spec: 'WITCH', name: 'Veil of Shadows', src: 'L2', cdS: 40,
    when: () => { const s = st2(); return !!s && s.veilUntil <= G.frame && shooters(L_(), 400).length >= 3; },
    fx(u){ const s = st2(); if (!s || typeof T2B === 'undefined') return false; const L = L_(); s.veilUntil = G.frame + T2B.veilSec;
      G.fx.push({ring: true, x: L.x, y: L.y, r: G.mod.radius, life: 24, c: '#8a8ab8'}); say(L.x, L.y, 'VEIL OF SHADOWS', '#9a9ac8'); return true; }});
  lad({id: 'raindance', spec: 'WITCH', name: 'Rain Dance', src: 'scroll', cdS: 60, minMagic: 3,
    when: () => { const s = st2(); return !!s && s.rainUntil <= G.frame && shooters(L_(), 450).length >= 5; },
    fx(u){ const s = st2(); if (!s || typeof T2B === 'undefined') return false; const L = L_(); s.rainUntil = G.frame + T2B.rainSec;
      G.fx.push({ring: true, x: L.x, y: L.y, r: G.mod.radius * 1.4, life: 30, c: '#7fb8e8'}); say(L.x, L.y, 'RAIN DANCE', '#7fb8e8'); return true; }});

  // Cleric (Chapel, then the Fortress Church)
  lad({id: 'bless', spec: 'CLERIC', name: 'Bless the Line', src: 'L1', cdS: 24, max: 2,
    when: () => !(G.blessT > 0) && near(L_(), 150).length >= 3,
    fx(u){ G.blessT = Math.max(G.blessT | 0, (B.rank(u, 'bless') * 4 + 2) * 60); say(u.x, u.y, 'BLESS THE LINE', '#e3cf8a'); return true; }});
  lad({id: 'masscure', spec: 'CLERIC', name: 'Mass Cure', src: 'L1', cdS: 20,
    when: () => hurtMates().length >= 2,
    fx(u){ const h = hurtMates(); if (!h.length){ say(u.x, u.y, 'NOBODY HURT', '#999'); return false; }
      for (const m of h){ m.con++; if (typeof pop === 'function') pop(m.x, m.y - 14, '+1', '#6fa37a'); }
      G.fx.push({ring: true, x: u.x, y: u.y, r: G.mod.radius, life: 18, c: '#8fd39a'}); return true; }});
  lad({id: 'flamestrike', spec: 'CLERIC', name: 'Flame Strike', src: 'L2', cdS: 30, aimed: true, minMagic: 3, favour: 4, max: 2,
    when: u => { const c = crowdAt(u, 360, typeof T2B !== 'undefined' ? T2B.flameRadius : 78); return c && c.n >= 4 ? c : false; },
    fx(u, aim, o){ if (typeof T2B === 'undefined') return false; const c = aim && dist(aim, u) <= 360 ? aim : crowdAt(u, 360, T2B.flameRadius);
      const hit = c ? foes().filter(e => dist(e, c) < T2B.flameRadius) : []; if (!hit.length){ say(u.x, u.y, 'NO TARGET', '#999'); return false; }
      if (!(o && o.auto)) G.burned = true;   // GD E3: Flame Strike the player casts is fire for Jasena's tenet; an auto-cast is not
      const r = B.rank(u, 'flamestrike'); G.fx.push({blast: true, x: c.x, y: c.y, r: 0, max: T2B.flameRadius + 8, life: 26, c: '#ffe680'}); G.shake = Math.max(G.shake || 0, 10);
      for (const e of hit) strike(e, ((u.s && u.s.magic) | 0) + 1 + (r >= 2 ? 1 : 0), 4, {from: u});
      if (typeof SFX !== 'undefined') SFX.play('blast'); say(c.x, c.y, 'FLAME STRIKE', '#ffe680'); return true; }});
  lad({id: 'silence', spec: 'CLERIC', name: 'Silence the Unholy', src: 'scroll', cdS: 40, minMagic: 3, favour: 3,
    when: u => { const s = st2(); return !!s && s.silenceUntil <= G.frame && typeof b2Caster === 'function' && foes().some(e => b2Caster(e) && dist(e, u) < G.mod.radius * 2); },
    fx(u){ const s = st2(); if (!s || typeof T2B === 'undefined') return false; s.silenceUntil = G.frame + T2B.silenceSec; s.silenceAt = u;
      G.fx.push({ring: true, x: u.x, y: u.y, r: G.mod.radius, life: 30, c: '#c8c8e8'}); say(u.x, u.y, 'SILENCE THE UNHOLY', '#c8c8e8'); return true; }});

  /* ---- timed effects (G.t33, never saved) ---- */
  B.tick = function(){
    const t = G && G.t33; if (!t || !G.mod) return; const f = G.frame;
    if (t.omen && !G.mod.omen) for (const e of G.enemies) if (e.omenT > 0) e.omenT--;
    for (const k of ['speed', 'volley']){ const x = t[k]; if (!x) continue;
      if (f > x.until){ if (x.applied !== undefined && G.mod[k] === x.applied) G.mod[k] = x.base; t[k] = null; continue; }
      if (x.applied === undefined || G.mod[k] !== x.applied){ x.base = G.mod[k] || 0; x.applied = k === 'speed' ? x.base * x.mul : x.base + x.add; G.mod[k] = x.applied; } }
    const sp = t.spear;
    if (sp){ if (f > sp.until || !A().able(sp.u)) t.spear = null;
      else if (f % 6 === 0) for (const e of foes()) if (!sp.hit.has(e) && dist(e, sp.u) < G.mod.radius * 0.6){ sp.hit.add(e); hurtEnemy(e, 1); } }
    const ow = t.over;
    if (ow){ if (f > ow.until || !A().able(ow.u)) t.over = null;
      else if (f % 4 === 0){ const L = L_();
        for (const e of foes()) if (!ow.hit.has(e) && dist(e, L) < G.mod.radius){ ow.hit.add(e);
          const sk = ((ow.u.s && ow.u.s.ranged) | 0) + 1; strike(e, sk, (G.ranged && G.ranged.dmg) || 2, {from: ow.u, ranged: true});
          G.fx.push({beam: true, x: ow.u.x, y: ow.u.y - 8, tx: e.x, ty: e.y - 8, life: 8, c: '#9fd8a0'}); } } }
  };

  function hook(){
    if (B.hooked || typeof trainingHTML !== 'function' || typeof renderTable !== 'function') return;
    B.hooked = true;
    { const f = trainingHTML; trainingHTML = function(fid){ if (fid === 'barracks') B.migrateAll(); const h = f.apply(this, arguments);
        return fid === 'barracks' && B.live() && h ? h + B.panelHTML(B.campList(), 'camp') : h; }; }
    { const f = renderTable; renderTable = function(){ B.migrateAll(); const r = f.apply(this, arguments);
        try { if (B.live()){ const el = document.getElementById('tbl-march'), btn = el && el.querySelector('.sealbtn');
          if (btn && !el.querySelector('[data-book33]')) btn.insertAdjacentHTML('beforebegin', B.panelHTML(B.tableList(), 'table')); } } catch (e) {}
        return r; }; }
    hook6();
  }
  function hook6(){
    if (B.hooked6 || typeof startDeployment !== 'function' || typeof update !== 'function' || typeof strike !== 'function' || typeof applyLoot !== 'function') return;
    B.hooked6 = true;
    const src = {sd: startDeployment, up: update, st: strike, al: applyLoot};
    { const f = startDeployment; startDeployment = function(){   // studied spells become book entries; their cards stop running on a cadence
        B.migrateAll(); const r = f.apply(this, arguments);
        try { if (B.live() && G && G.ranks){ let n = 0; for (const id of B.MIG) if (G.ranks[id]){ delete G.ranks[id]; n++; } if (n && typeof recompute === 'function') recompute(); } } catch (e) {}
        return r; }; }
    { const f = update; update = function(){ const r = f.apply(this, arguments);
        if (B.live() && G && !G.over && !G.paused){ try { B.tick(); } catch (e){ if (!B._err){ B._err = 1; console.log('BOOK33 tick', e && e.message); } } }
        return r; }; }
    { const f = strike; strike = function(e, skill, dmg, o){   // Break Armour and Poison the Blade: the next 3 Solid Hits
        const from = o && o.from;
        if (!from || !(from.brk33 > 0 || from.poi33 > 0) || !e || e.dead || o.piercing) return f.apply(this, arguments);
        G._out = null; const r = f.apply(this, arguments), out = G._out;
        if (out === 'solid' || out === 'crit'){
          if (from.brk33 > 0){ from.brk33--; if (!e.dead && e.shift > 0){ e.shift--; if (typeof pop === 'function') pop(e.x, e.y - 20, 'ARMOUR BROKEN', '#e0c070'); } }
          if (from.poi33 > 0){ from.poi33--; if (!e.dead){ e.weak = Math.max(e.weak || 0, 120); e.slow = Math.max(e.slow || 0, 120); } } }
        return r; }; }
    { const f = applyLoot; applyLoot = function(kind, at){ const r = f.apply(this, arguments); if (kind === 'tome') B.findScroll(at); return r; }; }
    // other self-tests read a wrapped function's source (e.g. TERRAIN looks for TR.ranged in strike): show the inner source too
    for (const [w, f] of [[startDeployment, src.sd], [update, src.up], [strike, src.st], [applyLoot, src.al]]){
      const own = Function.prototype.toString.call(w); w.toString = () => own + '\n/* wraps */\n' + String(f); }
    if (window.F33 && typeof LOOT !== 'undefined' && !LOOT.tome && typeof LOOT_KEYS !== 'undefined'){   // one roll in the chest table
      LOOT.tome = {name: 'Library Scroll', one: 'Library Scroll', many: 'Library Scrolls', glyph: 'book', col: '#c8a8ff', w: B.K.scrollW, text: 'A rare spell or drill for the company library. Copy it into a book in the Barracks.'};
      LOOT_KEYS.push('tome'); }
  }
  B.hook = hook;
  B.hook6 = hook6;
  hook(); hook6(); window.addEventListener('load', () => { hook(); hook6(); });

  /* ---- self-test (stubs; nothing is saved) ---- */
  B.selfTest = function(){
    const res = [], ok = (c, m) => res.push({ok: !!c, m});
    const done = () => { const fails = res.filter(r => !r.ok).map(r => r.m); return {ok: !fails.length, n: res.length, fails, res}; };
    if (!A() || !window.F33){ ok(false, 'ABIL33 and F33 loaded'); return done(); }
    const sv = {G: typeof G !== 'undefined' ? G : undefined, M: META, sm: typeof saveMeta === 'function' ? saveMeta : null,
                sfx: SFX.play, pop: typeof pop === 'function' ? pop : null, rd: B.redraw, has: B.has, st: strike, msg: B.msg, nt: typeof note === 'function' ? note : null};
    try {
      let saves = 0; saveMeta = () => { saves++; }; SFX.play = () => {}; pop = () => {}; B.redraw = () => {}; if (sv.nt) note = () => {};
      const sold = {id: 1, name: 'S', spec: 'SOLDIER', adv: 0, magic: 0}, vet = {id: 2, name: 'V', spec: 'SOLDIER', adv: 2, magic: 0},
            mage = {id: 3, name: 'M', spec: 'MAGE', adv: 0, magic: 2, book: ['bolt', 'bash', 'zzz']};
      META = {leader: {name: 'L', spec: 'CLERIC', level: 1, magic: 1}, roster: [sold, vet, mage]};
      G = null; sv.nar = B._narrow; sv.mp = B.msgPid; B._narrow = false;
      ok(B.live(), 'live');
      const d = B.loadout(sold);
      ok(d.active === 'bash' && d.auto.length === 0, 'no p.slots: the starting active on the key, spare slots empty');
      ok(B.spare(sold) === 0 && B.spare(vet) === 1 && B.spare(mage) === 1 && B.spare({spec: 'SOLDIER', adv: 4}) === 2 && B.spare(META.leader) === 0, 'spare slots read ABIL33.slotsFor (minus the Specialty attack)');
      ok(B.book(mage).join() === B.start('MAGE') + ',bolt', 'the book: the start key, then its own Specialty\'s known ids (gate met)');
      ok(!B.set(1, 0, 'bash', 'camp') && !sold.slots, 'no spare slot: the auto pick is refused');
      ok(B.set(2, 0, 'bash', 'camp') && vet.slots.active === null && vet.slots.auto.join() === 'bash' && saves === 1, 'moving the key\'s active to a spare slot empties the key and saves');
      ok(B.set(2, 'key', 'bash', 'camp') && vet.slots.active === 'bash' && !vet.slots.auto.length, 'putting it back on the key takes it out of auto');
      B.set(2, 0, 'bash', 'camp'); ok(B.set(2, 0, '', 'camp') && vet.slots.active === 'bash' && !vet.slots.auto.length, 'an empty loadout puts the starting active back on the key');
      ok(!B.set(2, 'key', 'bolt', 'camp'), 'an id not in the book is refused');
      B.set(2, 0, 'bash', 'camp');
      G = {leader: {}, over: false}; const before = JSON.stringify(vet.slots);
      ok(!B.set(2, 'key', 'bash', 'camp') && JSON.stringify(vet.slots) === before, 'locked once the squad marches (set refuses while a contract runs)');
      const u = {spec: 'SOLDIER', state: 'up', p: vet, x: 0, y: 0};
      G = {leader: {spec: 'CLERIC'}, squad: [u], over: false};
      const lo = A().lo(u);
      ok(lo.active === null && lo.auto.join() === 'bash' && A().ab(u, 'bash').auto, 'ABIL33 reads the loadout: Bash on auto, nothing on the key');
      vet.slots = {active: 'bash', auto: []};
      ok(A().lo(u).auto.join() === 'bash', 'the loadout is read once per contract (fixed at march)');
      ok(!A().press(u) && !A().toggle(u), 'with nothing on the key a press does nothing; Shift no longer toggles');
      const h = B.panelHTML([{p: vet, pid: 2, key: '1'}, {p: META.leader, pid: 'L', key: 'E'}], 'table');
      ok(/<select/.test(h) && /Sweep/.test(h) && /Mending Prayer/.test(h) && /BOOK33\.set\('L','key'/.test(h), 'the panel draws a row per character (key and auto selects, the Specialty attack named)');
      // ---- step 6: libraries, copying, migration, scrolls, the ladder buttons ----
      G = null; let built = {};
      B.has = id => !!built[id];
      ok(B.libLevel('SOLDIER') === 0 && !B.library('SOLDIER').length, 'no Training Grounds: no Soldier library');
      built = {training: 1};
      ok(B.libLevel('SOLDIER') === 1 && B.library('SOLDIER').join() === 'push,spearwall', 'library L1: the building as built (Push Back, Spearwall)');
      built = {training: 1, '#training': 1};
      ok(B.libLevel('SOLDIER') === 2 && B.library('SOLDIER').includes('sprint') && !B.library('SOLDIER').includes('breakarm'), 'library L2: the first upgrade adds Sprint; a scroll rung needs the scroll');
      META.scrolls = ['breakarm']; ok(B.library('SOLDIER').includes('breakarm'), 'a found scroll joins the library');
      META.treasury = 200; saves = 0;
      // PROG-1: the Copy button researches into the chapter library (prices, gates and scrolls: PROG.selfTest, js/prog24.js)
      const c1 = B.cost('push');
      ok(B.copy(1, 'push', 'camp') && META.treasury === 200 - c1 && META.lib33.includes('push') && B.book(sold).includes('push') && saves === 1, 'Copy researches an L1 entry for the chapter (' + c1 + 'gp) and it joins the book');
      ok(!B.copy(1, 'push', 'camp') && META.treasury === 200 - c1, 'a second research is refused');
      built = {magetower: 1, '#magetower': 1}; mage.magic = 2;
      const m2 = {id: 9, name: 'W', spec: 'MAGE', adv: 0, magic: 2, picks: ['fireball', 'frost', 'masscure']}; META.roster.push(m2);
      ok(B.migrate(m2) && (m2.book || []).join() === 'fireball' && m2.slots.auto.join() === 'fireball' && m2.book33m.length === 2, 'studied spells map into p.book once (and fill a free auto slot)');
      ok(!B.migrate(m2) && m2.book.length === 1, 'a second migration does nothing');
      m2.picks.push('burning'); B.migrate(m2); ok(m2.book.join() === 'fireball,burning' && m2.slots.auto.join() === 'fireball', 'a spell studied later maps in too; the loadout is not changed');
      m2.magic = 3;   // Fireball's gate is Magic 3 (PROG-1)
      const rnd0 = Math.random; Math.random = () => 0; META.scrolls = [];
      const got = B.findScroll(null); Math.random = rnd0; ok(got && META.scrolls.length === 1 && B.LAD[got].src === 'scroll', 'a chest scroll goes to META.scrolls');
      // a ladder button: own effect, own cooldown, x1.5 on auto, Magic gate
      const hit = []; strike = (e, sk, d, o) => hit.push({e, sk});
      const foe = (x, y) => ({k: 'zz', x, y, r: 10, con: 3, shift: 0, dead: false});
      const mu = {spec: 'MAGE', state: 'up', x: 0, y: 0, r: 10, s: {magic: 3}, p: m2};
      G = {leader: {spec: 'CLERIC', x: 0, y: 0, con: 5, maxCon: 5, s: {magic: 0}}, squad: [mu], enemies: [foe(200, 0), foe(210, 10), foe(205, -10), foe(600, 0)],
           frame: 0, mod: {radius: 120, precision: 0}, fx: [], abil: {}, abilQ: [], over: false, paused: false, favour: 0, mode: 'contract'};
      ok(A().use(mu, {id: 'fireball', aim: {x: 205, y: 0}}) && hit.length === 3 && A().ab(mu, 'fireball').cd === 18 * 60, 'Fireball on the key: hits the 3 at the aim, cooldown 18 s');
      hit.length = 0; ok(!A().use(mu, {id: 'fireball'}) && !hit.length, 'cooling: no second cast');
      A().ab(mu, 'fireball').cd = 0; ok(A().use(mu, {id: 'fireball', auto: true, aim: {x: 205, y: 0}}) && A().ab(mu, 'fireball').cd === 27 * 60, 'on auto the cooldown is x1.5');
      mu.s.magic = 1; mu.p.book.push('stonewall'); ok(!A().use(mu, {id: 'stonewall'}) && !(A().ab(mu, 'stonewall').cd > 0), 'Stone Wall refuses below Magic 2 (no cooldown spent)');
      mu.lo33 = null; ok(B.pips(mu, 'burning').max === 3 && B.pips(mu, 'burning').n === 1 && ((m2.rank = {burning: 2}), B.pips(mu, 'burning').n === 2), 'ranks show as pips (p.rank, default 1)');
      // ---- rank buying (study) and the Narrative panel wording ----
      const cf = B.cost('fireball');
      G = null; built = {magetower: 1}; META.deployments = 7; META.treasury = cf + 40; m2.rank = {}; saves = 0;
      const si = B.studyInfo(m2, 'fireball');
      ok(si && si.ok && si.price === cf && B.study(9, 'fireball', 'camp') && m2.rank.fireball === 2 && META.treasury === 40 && saves === 1 && /studies Fireball\. Rank 2/.test(B.msg), 'Study: rank 1 to 2 for the research price (' + cf + 'gp), saved, message');
      ok(!B.study(9, 'burning', 'camp') && B.studyInfo(m2, 'burning').why === 'Already studied this downtime.', 'once a downtime per character');
      META.deployments = 8; META.treasury = 100;
      ok(!B.study(9, 'fireball', 'camp') && B.studyInfo(m2, 'fireball').price === 2 * cf, 'rank 2 to 3 costs twice the research price (refused without the gold)');
      META.treasury = 2 * cf; ok(B.study(9, 'fireball', 'camp') && m2.rank.fireball === 3 && B.studyInfo(m2, 'fireball').done && !B.studyHTML(m2, 'fireball', 9, 'camp'), 'at the ladder max: no Study button');
      META.deployments = 9; const lh = B.libHTML(m2, 9, 'camp');
      ok(!B.studyInfo(m2, 'bolt') && /Study \((\d+gp|free)\)/.test(lh) && /Rank 3\. Ranks are bought with study/.test(lh), 'book line: pips with the rank tooltip; Study (gp) on rankable entries only');
      built = {}; ok(/^Build the .+ first\.$/.test(B.studyInfo(m2, 'burning').why), 'no library building: no study');
      const ph = B.panelHTML([{p: m2, pid: 9, key: '2'}], 'camp');
      ok(/<b>Loadout\.<\/b>/.test(ph) && /Active \(on the key\) <b>Key 2<\/b>/.test(ph) && /Auto slots \(cast on their own\)/.test(ph) && /press 2 to use it\. Recharge/.test(ph) && /casts on its own\. Recharge 27s, 50% longer/.test(ph), 'Narrative labels and slot tooltips in the panel');
      { let thrown = ''; try { B.panelHTML(m2); B.panelHTML(); B.libHTML(); B.libHTML(m2); } catch (e) { thrown = e.message; }
        ok(!thrown && /keys 1 to 5, in marching order/.test(ph) && B.panelHTML() === '' && /<b>Loadout\.<\/b>/.test(B.panelHTML(m2)), 'K17: the key line shows; one mate or no argument does not throw ' + thrown); }
      { const o0 = Object.assign({}, B.OPEN47), m0 = B.msgPid; B.OPEN47 = {}; B.msgPid = null;
        const gh = B.panelHTML([{p: META.leader, pid: 'L', key: 'E'}, {p: m2, pid: 9, key: '2'}], 'camp');
        const shut = /<details class="bk47" data-spec47="[A-Z_]+" ontoggle/.test(gh), lead = gh.indexOf('<details class="bk47"') > gh.indexOf('<b>' + esc_(META.leader.name || 'Leader') + '</b>');
        B.msgPid = 9; const gm = B.panelHTML([{p: m2, pid: 9, key: '2'}], 'camp'); B.msgPid = m0; B.OPEN47 = o0;
        ok(shut && lead && /<details class="bk47"[^>]* open/.test(gm), 'UX K47: Barracks mates sit in closed Specialty sections under the open Leader row; a section with the message opens'); }
      { const m0 = B.msg, k0 = B.K18; B._narrow = true; B.msg = 'M2 studies Fireball. Rank 2.'; B.msgPid = 9;
        const pn = B.panelHTML([{p: m2, pid: 9, key: '2'}, {p: sold, pid: 1, key: '1'}], 'camp');
        B.K18 = false; const po = B.panelHTML([{p: m2, pid: 9, key: '2'}], 'camp'); B.K18 = k0; B._narrow = false; B.msg = m0;
        ok(/Active \(your button on the bar\)/.test(pn) && !/keys 1 to 5/.test(pn) && /Rank \d of \d\./.test(pn) && (pn.match(/data-msg33/g) || []).length === 1 && (pn.match(/studies Fireball\. Rank 2/g) || []).length === 1
          && /Active \(on the key\)/.test(po) && !/data-msg33/.test(po) && !/Rank \d of \d\./.test(po), 'K22 to K24: phone wording, the rank in words, the message on that row; off with BOOK33.K18 = false'); }
      ok(/Another auto slot opens at 2 Advancements/.test(B.panelHTML([{p: sold, pid: 1, key: '1'}], 'camp')) && /opens with 4 Magic/.test(ph), 'the next-slot line (Advancements / Magic)');
      ok(Object.keys(B.LAD).length === 27 && Object.keys(B.LAD).every(id => A().REG[id] && (A().REG[id].own || id === 'bolt')), 'the 27 ladder actives are in ABIL33.REG (25, with Ray of Frost and Lightning Bolt since PROG-1; Bolt is the old key action)');
      strike = sv.st; B.has = sv.has;
    } catch (err){ ok(false, 'threw: ' + err.message); }
    finally {
      G = sv.G; META = sv.M; if (sv.sm) saveMeta = sv.sm; SFX.play = sv.sfx; if (sv.pop) pop = sv.pop; B.redraw = sv.rd; B.has = sv.has; strike = sv.st; B.msg = sv.msg; B._narrow = sv.nar; B.msgPid = sv.mp; if (sv.nt) note = sv.nt;
    }
    return done();
  };
})();
