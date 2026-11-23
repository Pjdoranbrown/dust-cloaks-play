/* ============================================================================
   INDEX MPCOOP1 - the live co-op seats, "orders lite" (Fable job 7 phase 3,
   docs/coop-seats.md section 2 steps 3 to 5, audits/fable/coop.md). Loads after
   js/mp/net.js.
   The host opens a march at the Planning Table: a seat strip with three seats,
   each paired by pasted codes (MPNET). A guest brings a Visiting Captain (their
   own Leader, a copy) and up to four of their own mates; the host may lend
   mates of the Chapter's. On SIGN AND MARCH every connected seat becomes an
   ALLY1 squad (controller 'guest'): the host's engine runs the field and sends
   snapshots at 10 Hz; the guest watches a field glass and gives its own squad
   one of three orders (Follow / Hold / Advance). A dropped seat keeps its last
   orders under the host's AI for 60 s (rejoin by token), then is the host's.
   At the debrief the guest gets the captain's cut (40% of its squad's share,
   capped by COOP.GUEST_CAP, nothing between two copies of one save, once a day
   per host) and banks it with one XP tick and a chronicle line.
   Knobs: MPCOOP.on, SNAP_EVERY (frames), TURN_TIMEOUT_S, MARCH_WAIT_S, ENEMY_CAP.
   ROLLBACK: remove this script tag (ALLY1 and MPNET1 stand on their own).
============================================================================ */
(function(){
'use strict';
if (!window.MPNET || !window.ALLY || !window.COOP){ console.warn('MPCOOP1: needs js/mp/seats.js, js/combat/ally.js and js/mp/net.js; co-op off'); return; }
const MPCOOP = window.MPCOOP = {
  on: true, version: 1,
  SNAP_EVERY: 6,         // frames between snapshots (10 Hz at 60)
  TURN_TIMEOUT_S: 30,    // a guest seat with no order for this long shows AI FOR NOW
  COUNTDOWN_SHOW_S: 10,  // the guest's badge counts from here
  MARCH_WAIT_S: 30,      // the host may march over unready guests after this
  ENEMY_CAP: 60,         // nearest enemies in a snapshot
  MAX_NAME: 24,
  role: null, host: null, guest: null, seats: {}, waitUntil: 0, codes: {}, G: null, view: null, last: null, log: []
};
const e = s => (typeof esc === 'function' ? esc : x => String(x).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])))(s == null ? '' : s);
const $id = id => document.getElementById(id);
const cleanName = (n, fb) => { const s = String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, MPCOOP.MAX_NAME); return s || fb; };
const myName = () => { try { return cleanName(META.leader && META.leader.name, 'Captain'); } catch (x) { return 'Captain'; } };
const sfx = n => { try { SFX.play(n); } catch (x) {} };
const num = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d; };
const logIt = (what, o) => { MPCOOP.log.push(Object.assign({t: Date.now(), what}, o || {})); if (MPCOOP.log.length > 300) MPCOOP.log.shift(); };
const dayStamp = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* a save identity for the same-save rule, minted once */
MPCOOP.saveId = function(){ if (typeof META === 'undefined' || !META) return null; if (!META.coopId){ META.coopId = MPNET.token(); try { saveMeta(); } catch (x) {} } return META.coopId; };

/* ---- people over the wire ---------------------------------------------------- */
const P_FIELDS = ['name', 'race', 'spec', 'cls', 'level', 'magic', 'startCon', 'conTrained', 'baseM', 'modM', 'baseR', 'modR', 'adv', 'sex', 'kills', 'deployments', 'burnt'];
MPCOOP.snapshotPerson = function(p){ const o = {}; for (const k of P_FIELDS) if (p[k] !== undefined) o[k] = p[k]; o.id = p.id; return o; };
/* a guest's person made safe for the host's engine: known race and spec, numbers clamped, no injuries carried */
MPCOOP.sanitizePerson = function(p, isLeader, id){
  p = p && typeof p === 'object' ? p : {};
  const race = (typeof RACES !== 'undefined' && RACES[p.race]) ? p.race : 'HUMAN';
  const spec = (typeof SPECS !== 'undefined' && SPECS[p.spec]) ? p.spec : 'SOLDIER';
  const o = {id, name: cleanName(p.name, isLeader ? 'Visiting Captain' : 'Visiting Mate'), race, spec, cls: (typeof CLASSES !== 'undefined' && CLASSES[p.cls]) ? p.cls : (typeof CLASS_ORDER !== 'undefined' ? CLASS_ORDER[0] : 'FIGHTER'),
    level: num(p.level, 1, 11, 1), magic: num(p.magic, 0, 5, 0), adv: num(p.adv, 0, 3, 0), injuries: [], kills: 0, deployments: 0, burnt: 0, ticks: 0,
    startCon: num(p.startCon, 2, 9, 4), conTrained: num(p.conTrained, 0, 4, 0), baseM: num(p.baseM, 0, 6, 2), modM: num(p.modM, -2, 3, 0), baseR: num(p.baseR, 0, 6, 1), modR: num(p.modR, -2, 3, 0)};
  if (p.sex === 'f' || p.sex === 'm') o.sex = p.sex;
  if (typeof SPECS !== 'undefined' && !SPECS[o.spec]) o.spec = Object.keys(SPECS)[0];
  if (isLeader) o.guestCaptain = true; else o.guestMate = true;
  return o;
};
const myCaptain = () => META.leader ? MPCOOP.snapshotPerson(META.leader) : null;
const myMates = () => (META.roster || []).filter(p => !p.resting && !p.away).sort((a, b) => (b.adv || 0) - (a.adv || 0)).slice(0, ALLY.MAX_MATES).map(MPCOOP.snapshotPerson);
/* debrief lines from the host rendered with only <p>, <p class="bad|good"> and <b> kept */
MPCOOP.safeLines = lines => (Array.isArray(lines) ? lines : []).slice(0, 40).map(l => e(String(l).slice(0, 600))
  .replace(/&lt;p class=&quot;(bad|good)&quot;&gt;/g, '<p class="$1">').replace(/&lt;(\/?)(p|b)&gt;/g, '<$1$2>')).join('');

/* ---- style and the overlay root --------------------------------------------------- */
function injectStyle(){
  if ($id('mpco-style')) return;
  const st = document.createElement('style'); st.id = 'mpco-style';
  st.textContent = `
#mpco-strip{margin:4px 0 8px;padding:8px 10px;border:1px solid rgba(0,0,0,.35);border-radius:6px;background:rgba(40,28,16,.18);font-size:14px}
#mpco-strip h3{margin:0 0 4px;font-size:14px}
.mpco-seat{display:inline-block;vertical-align:top;width:31%;min-width:200px;margin:0 1% 6px 0;padding:6px 8px;border:1px solid rgba(0,0,0,.3);border-radius:5px;background:rgba(255,255,255,.08)}
.mpco-seat textarea{width:100%;height:46px;font:14px monospace;resize:vertical;box-sizing:border-box}
.mpco-tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:14px;background:rgba(0,0,0,.35);color:#f3e6c8;margin-right:4px}
.mpco-tag.ok{background:#2f6b36}.mpco-tag.warn{background:#8a5a1a}.mpco-tag.bad{background:#8a1a1a}
#mpco-root{position:fixed;inset:0;z-index:70;background:#1b140d;color:#f3e6c8;font-family:Georgia,serif;overflow:auto}
#mpco-root .mpco-in{max-width:760px;margin:0 auto;padding:18px 16px 40px}
#mpco-root h1{font-size:22px;margin:0 0 8px}#mpco-root h2{font-size:16px;margin:12px 0 6px}
#mpco-root textarea{width:100%;height:70px;font:14px monospace;background:#2a2016;color:#f3e6c8;border:1px solid #6a5434;box-sizing:border-box}
.mpco-btn{display:inline-block;margin:4px 6px 4px 0;padding:6px 12px;border:1px solid #8a6a3a;border-radius:4px;background:#3a2a18;color:#f3e6c8;font:bold 14px Georgia,serif;cursor:pointer}
.mpco-btn.gold{background:#6b4f1f}.mpco-btn.on{background:#2f6b36}.mpco-btn:disabled{opacity:.5;cursor:default}
.mpco-err{color:#ff9a8a;margin:6px 0}.mpco-sub{opacity:.8;font-size:14px}
#mpco-glass{display:block;background:#0f0c08;border:1px solid #6a5434;width:100%;max-width:640px;height:auto}
#mpco-root .log p{margin:4px 0}#mpco-root .bad{color:#ff9a8a}#mpco-root .good{color:#9fe0a0}`;
  document.head.appendChild(st);
}
function root(){ injectStyle(); let r = $id('mpco-root'); if (!r){ r = document.createElement('div'); r.id = 'mpco-root'; document.body.appendChild(r); } return r; }
function closeRoot(){ const r = $id('mpco-root'); if (r) r.remove(); }

/* =============================================================================
   THE HOST
============================================================================= */
MPCOOP.openHost = function(){
  if (MPCOOP.role) return;
  if (!META.leader){ return; }
  MPCOOP.role = 'host'; MPCOOP.seats = {}; MPCOOP.codes = {}; MPCOOP.waitUntil = 0; MPCOOP.hostName = myName();   // kept: the Leader may fall before the debrief
  ALLY.pick = null; ALLY.extra = [];
  MPCOOP.host = MPNET.host({
    onJoin: (seat, hello) => {
      const captain = MPCOOP.sanitizePerson(hello.captain, true, 'g' + seat);
      const mates = (Array.isArray(hello.mates) ? hello.mates : []).slice(0, ALLY.MAX_MATES).map((m, i) => MPCOOP.sanitizePerson(m, false, 'g' + seat + 'm' + i));
      MPCOOP.seats[seat] = {seat, name: cleanName(hello.name, 'Guest'), captain, mates, lentIds: [], ready: false, orders: 'follow', saveId: typeof hello.saveId === 'string' ? hello.saveId.slice(0, 16) : null, joined: Date.now()};
      logIt('join', {seat, name: MPCOOP.seats[seat].name, mates: mates.length}); sfx('pick');
      if (G && G.allies){ MPCOOP.host.send(seat, {t: 'lobby', late: true, host: MPCOOP.hostName || myName()}); }   // joined mid-march: they wait for the next
      MPCOOP.sendLobby(); MPCOOP.refresh();
    },
    onRejoin: (seat) => {
      const sq = G && G.allies ? ALLY.bySeat(seat) : null, info = MPCOOP.seats[seat];
      if (sq && sq.controller !== 'ai_takeover'){ sq.controller = 'guest'; sq.status = 'live'; sq.lastOrder = G.sec; sq.aiNow = false; note(`${sq.name || 'A friend'} is back at the glass.`); MPCOOP.host.send(seat, {t: 'start', contract: MPCOOP.contractInfo(G.contract), seat}); }
      logIt('rejoin', {seat, name: info && info.name}); sfx('pick');
      MPCOOP.sendLobby(); MPCOOP.refresh();
    },
    onMessage: (seat, m) => {
      const info = MPCOOP.seats[seat]; if (!info) return;
      if (m.t === 'orders' && ALLY.ORDERS.includes(m.o)){
        info.orders = m.o;
        const sq = G && G.allies ? ALLY.bySeat(seat) : null;
        if (sq && sq.controller === 'guest'){ ALLY.setOrdersFor(sq, m.o); sq.lastOrder = G.sec; sq.aiNow = false; }
        else MPCOOP.sendLobby();
      } else if (m.t === 'mark'){   // F-33 step 8: a guest marks an enemy for its own squad
        const sq = G && G.allies ? ALLY.bySeat(seat) : null;
        if (sq && window.F33 && F33.seatMarkSet && F33.seatMarkSet(sq, m.id | 0)){ sq.lastOrder = G.sec; sq.aiNow = false; }
      } else if (m.t === 'ready'){ info.ready = !!m.on; sfx('pick'); MPCOOP.sendLobby(); MPCOOP.refresh(); }
      else if (m.t === 'banked'){ logIt('guest banked', {seat, gold: m.gold | 0}); }
    },
    onDrop: (seat) => {
      const sq = G && G.allies ? ALLY.bySeat(seat) : null, info = MPCOOP.seats[seat];
      if (sq){ sq.controller = 'ai'; sq.status = 'dropped'; note(`${sq.name || 'A friend'} has lost the link; their squad holds its orders for a minute.`); }
      logIt('drop', {seat}); MPCOOP.refresh();
      if (info) info.ready = false;
    },
    onLeave: (seat, why) => {
      const sq = G && G.allies ? ALLY.bySeat(seat) : null;
      if (sq){ sq.controller = 'ai'; sq.status = 'takeover'; note(`${sq.name || 'A friend'}'s seat is the Chapter's now.`); }
      else delete MPCOOP.seats[seat];
      logIt('leave', {seat, why}); MPCOOP.sendLobby(); MPCOOP.refresh();
    }
  });
  logIt('host open'); sfx('pick'); MPCOOP.refresh();
};
MPCOOP.closeHost = function(){
  if (MPCOOP.role !== 'host') return;
  try { MPCOOP.host.close(); } catch (x) {}
  MPCOOP.host = null; MPCOOP.role = null; MPCOOP.seats = {}; MPCOOP.codes = {}; ALLY.extra = [];
  logIt('host closed'); MPCOOP.refresh();
};
MPCOOP.makeCode = async function(seat){
  const c = MPCOOP.codes[seat] = {code: '', err: '', busy: true}; MPCOOP.refresh();
  try { c.code = await MPCOOP.host.offerFor(seat); } catch (x) { c.err = x.message || String(x); }
  c.busy = false; MPCOOP.refresh();
};
MPCOOP.connect = async function(seat){
  const ta = $id('mpco-ans-' + seat), c = MPCOOP.codes[seat] || (MPCOOP.codes[seat] = {code: '', err: ''});
  try { await MPCOOP.host.accept(seat, ta ? ta.value : ''); c.err = ''; c.sent = true; } catch (x) { c.err = x.message || String(x); }
  MPCOOP.refresh();
};
MPCOOP.copy = async function(id){ const ta = $id(id); if (!ta) return; try { await navigator.clipboard.writeText(ta.value); } catch (x) { ta.select(); try { document.execCommand('copy'); } catch (y) {} } sfx('pick'); };
MPCOOP.dropSeat = function(seat){ if (MPCOOP.host) MPCOOP.host.drop(seat); delete MPCOOP.seats[seat]; delete MPCOOP.codes[seat]; MPCOOP.sendLobby(); MPCOOP.refresh(); };
MPCOOP.lend = function(seat, id){
  const info = MPCOOP.seats[seat]; if (!info) return;
  const i = info.lentIds.indexOf(id);
  if (i >= 0) info.lentIds.splice(i, 1); else if (info.mates.length + info.lentIds.length < ALLY.MAX_MATES && MPCOOP.freeMates().some(p => p.id === id)) info.lentIds.push(id);
  sfx('pick'); MPCOOP.sendLobby(); MPCOOP.refresh();
};
MPCOOP.freeMates = function(){
  const lent = new Set(); for (const k in MPCOOP.seats) for (const id of MPCOOP.seats[k].lentIds) lent.add(id);
  return (META.roster || []).filter(p => !p.resting && !p.away && !lent.has(p.id) && !(typeof MU !== 'undefined' && MU && MU.ids.includes(p.id)));
};
/* the squads the connected seats bring to the field */
MPCOOP.marchers = function(){
  const out = []; if (!MPCOOP.host) return out;
  for (const s of MPCOOP.host.connected()){
    const info = MPCOOP.seats[s.seat]; if (!info) continue;
    const lent = info.lentIds.map(id => (META.roster || []).find(p => p.id === id && !p.resting && !p.away)).filter(Boolean);
    out.push({officer: info.captain, mates: info.mates.concat(lent).slice(0, ALLY.MAX_MATES), seat: s.seat, controller: 'guest', name: info.name, orders: info.orders});
  }
  return out;
};
MPCOOP.contractInfo = c => c ? {obj: c.obj, name: (typeof OBJECTIVES !== 'undefined' && OBJECTIVES[c.obj]) ? OBJECTIVES[c.obj].name : c.obj, tier: c.tier, pay: c.pay, place: c.place, patron: c.patron, host: c.host, minutes: c.minutes || 0, title: c.title || null} : null;
MPCOOP.lobbyPayload = function(){
  const c = META.board && typeof MU !== 'undefined' && MU ? META.board[MU.contract] : null;
  const marchers = MPCOOP.marchers(), n = 1 + marchers.length;
  const seats = [];
  for (let seat = 1; seat <= MPNET.MAX_SEATS; seat++){
    const slot = MPCOOP.host ? MPCOOP.host.slots[seat - 1] : null, info = MPCOOP.seats[seat];
    seats.push({seat, status: slot ? slot.status : 'open', name: info ? info.name : null, captain: info ? info.captain.name : null, nMates: info ? info.mates.length + info.lentIds.length : 0, ready: !!(info && info.ready), orders: info ? info.orders : 'follow', kit: (window.ARM && ARM.seatKit && info) ? ARM.seatKit(info) : null});   // INDEX A33: the guest's kit line
  }
  let joint = null, shares = {}, odds = null;
  if (c && c.pay > 0 && c.obj !== 'brawl' && c.obj !== 'drill'){
    try {
      joint = COOP.joint(c, n);
      const leaderMates = (MU.ids || []).map(id => META.roster.find(p => p.id === id)).filter(Boolean);
      const forces = [{officer: META.leader, mates: leaderMates, controller: 'host'}].concat(marchers.map(m => ({officer: m.officer, mates: m.mates, controller: 'guest'})));
      const o = COOP.odds(c, forces); odds = o ? o.label : null;
      const table = [COOP.create(0, 'leader', 'host')].concat(marchers.map(m => COOP.create(m.seat, 'guest', 'guest')));
      const split = COOP.splitPay(Object.assign({}, c, {pay: joint.pay}), table, {sizes: [leaderMates.length + 1].concat(marchers.map(m => m.mates.length + 1))});
      for (const s of split.seats) if (s.seatIndex) shares[s.seatIndex] = {share: s.share, cut: s.cut};
    } catch (x) { odds = null; }
  }
  return {t: 'lobby', host: MPCOOP.hostName || myName(), saveId: MPCOOP.saveId(), contract: c ? Object.assign(MPCOOP.contractInfo(c), {jointPay: joint ? joint.pay : c.pay, k: COOP.k(n), n}) : null, seats, shares, odds, waitUntil: MPCOOP.waitUntil ? Math.max(0, Math.round((MPCOOP.waitUntil - Date.now()) / 1000)) : 0, inField: !!(G && G.allies)};
};
MPCOOP.sendLobby = function(){ if (MPCOOP.host) try { MPCOOP.host.broadcast(MPCOOP.lobbyPayload()); } catch (x) { console.error('MPCOOP lobby', x); } };
MPCOOP.unready = () => MPCOOP.marchers().filter(m => !MPCOOP.seats[m.seat].ready).map(m => m.name);
/* the host's SIGN AND MARCH: every connected guest ready, or the 30 s wait run out */
MPCOOP.canMarch = function(){
  const u = MPCOOP.unready(); if (!u.length) return true;
  if (!MPCOOP.waitUntil){ MPCOOP.waitUntil = Date.now() + MPCOOP.MARCH_WAIT_S * 1000; MPCOOP.sendLobby(); MPCOOP.refresh(); setTimeout(MPCOOP.refresh, MPCOOP.MARCH_WAIT_S * 1000 + 50); return false; }
  return Date.now() >= MPCOOP.waitUntil;
};
MPCOOP.stripHTML = function(){
  const H = MPCOOP.host; if (!H) return '';
  const conn = H.connected().length, u = MPCOOP.unready();
  let h = `<div id="mpco-strip"><h3>Co-op march: you host <span class="mpco-tag ok">${conn} friend${conn === 1 ? '' : 's'} connected</span> <button class="btn small" onclick="MPCOOP.closeHost()">CLOSE THE MARCH</button></h3>`;
  h += `<div class="sub" style="font-size:14px">Each seat: make a host code, send it to a friend (they open CO-OP, JOIN at their own table), paste their answer back. Every connected seat marches as a squad under its visiting captain; your SIGN AND MARCH starts the field for all.</div>`;
  if (u.length) h += `<div class="sub" style="font-size:14px;color:var(--gold-bright)">Waiting on ${u.map(e).join(', ')} to be ready${MPCOOP.waitUntil ? (Date.now() >= MPCOOP.waitUntil ? '; SIGN AND MARCH now goes without them' : `; you may march without them in ${Math.ceil((MPCOOP.waitUntil - Date.now()) / 1000)} s`) : ''}.</div>`;
  for (let seat = 1; seat <= MPNET.MAX_SEATS; seat++){
    const s = H.slots[seat - 1], info = MPCOOP.seats[seat], c = MPCOOP.codes[seat] || {};
    h += `<div class="mpco-seat"><b>Seat ${seat + 1}</b> `;
    if (s.status === 'connected' && info){
      h += `<span class="mpco-tag ok">connected</span> <b>${e(info.name)}</b> ${info.ready ? '<span class="mpco-tag ok">READY</span>' : '<span class="mpco-tag warn">not ready</span>'} <button class="btn small" onclick="MPCOOP.dropSeat(${seat})">DROP</button>`;
      h += `<div class="sub" style="font-size:14px">Captain ${e(info.captain.name)} (${SPECS[info.captain.spec] ? SPECS[info.captain.spec].name : info.captain.spec}, Level ${info.captain.level}); ${info.mates.length} of their mates, ${info.lentIds.length} lent. Orders: ${ALLY.LABEL[info.orders]}.</div>`;
      if (window.ARM && ARM.hostSeatHTML) h += ARM.hostSeatHTML(info.captain);   // INDEX A33: the guest's kit
      const free = MPCOOP.freeMates(), lent = info.lentIds.map(id => (META.roster || []).find(p => p.id === id)).filter(Boolean);
      if (free.length || lent.length){ h += `<div class="sub" style="font-size:14px">Lend mates (their upkeep and losses are the Chapter's):</div><div>`;
        for (const p of lent.concat(free.filter(p => !lent.includes(p)))) h += `<span class="marcher ${lent.includes(p) ? 'on' : ''}" style="display:inline-block;margin:2px 4px 2px 0;padding:1px 6px;cursor:pointer;font-size:14px" onclick="MPCOOP.lend(${seat},${p.id})">${e(p.name)}</span>`;
        h += `</div>`; }
    } else {
      if (s.status === 'dropped') h += `<span class="mpco-tag bad">dropped</span> ${e(info ? info.name : '')} may rejoin for ${Math.max(0, Math.ceil((MPNET.REJOIN_WINDOW_MS - (Date.now() - s.droppedAt)) / 1000))} s with a fresh code. `;
      else h += `<span class="mpco-tag">${s.status === 'pairing' ? 'waiting for the answer' : 'open'}</span> `;
      h += `<button class="btn small" onclick="MPCOOP.makeCode(${seat})" ${c.busy ? 'disabled' : ''}>${c.busy ? 'MAKING...' : s.status === 'dropped' ? 'MAKE REJOIN CODE' : c.code ? 'FRESH CODE' : 'MAKE HOST CODE'}</button>`;
      if (c.code) h += `<div class="sub" style="font-size:14px;margin-top:4px">Send this to your friend:</div><textarea id="mpco-code-${seat}" readonly>${e(c.code)}</textarea><button class="btn small" onclick="MPCOOP.copy('mpco-code-${seat}')">COPY</button>
        <div class="sub" style="font-size:14px;margin-top:4px">Paste their answer:</div><textarea id="mpco-ans-${seat}" placeholder="DCCO1..."></textarea><button class="btn small gold" onclick="MPCOOP.connect(${seat})">CONNECT</button>${c.sent ? ' <span class="mpco-tag">connecting...</span>' : ''}`;
      if (c.err) h += `<div class="mpco-err">${e(c.err)}</div>`;
      if (s.err) h += `<div class="mpco-err">${e(s.err)}</div>`;
    }
    h += `</div>`;
  }
  return h + `</div>`;
};
/* the CO-OP menu at the table head, and the strip while hosting */
MPCOOP.menuHTML = () => `<span id="mpco-menu" style="margin-left:8px">${MPCOOP.role === 'host' || !META.leader ? '' : `<button class="btn small" onclick="MPCOOP.openHost()" title="Host a march for up to three friends">CO-OP: HOST</button> <button class="btn small" onclick="MPCOOP.openGuest()" title="Join a friend's march with your Leader and mates">CO-OP: JOIN</button>`}</span>`;
MPCOOP.refresh = function(){ try { if (typeof renderTable === 'function' && $id('screen-table') && !$id('screen-table').classList.contains('hidden')) renderTable(); } catch (x) {} };
if (typeof renderTable === 'function'){ const f = renderTable;
  renderTable = function(){
    f();
    if (!MPCOOP.on) return;
    try {
      const inner = $id('table-inner'); if (!inner) return;
      const head = inner.querySelector('.table-head');
      // UX K65: on a phone the CO-OP buttons go below the contracts, not above the first one
      const phone = window.innerWidth < 640;
      if (head && !inner.querySelector('#mpco-menu')){ const sp = document.createElement('span'); sp.innerHTML = MPCOOP.menuHTML(); if (phone){ const d = document.createElement('div'); d.style.cssText = 'text-align:center;margin:10px 0'; d.appendChild(sp.firstChild); inner.appendChild(d); } else head.appendChild(sp.firstChild); }
      if (MPCOOP.role === 'host' && !inner.querySelector('#mpco-strip')){ const d = document.createElement('div'); d.innerHTML = MPCOOP.stripHTML(); (head || inner).insertAdjacentElement(head ? 'afterend' : 'afterbegin', d.firstChild); }
    } catch (x) { console.error('MPCOOP table', x); }
  };
}
{ const f = ALLY.blockHTML;   // while hosting, the seats take the second squad's place
  ALLY.blockHTML = function(c){ if (MPCOOP.role === 'host') return `<div id="ally-block" class="sub" style="margin-top:8px;font-size:14px;opacity:.8">Second squad: the co-op seats above march in its place.</div>`; return f(c); };
}
{ const f = deploy;
  deploy = function(){
    if (MPCOOP.role === 'host' && MPCOOP.host){
      if (!MPCOOP.canMarch()){ sfx('pick'); return; }
      ALLY.pick = null; ALLY.extra = MPCOOP.marchers();
      const r = f();
      try {
        if (G && G.allies){ for (const sq of G.allies){ sq.lastOrder = 0; sq.aiNow = false; sq.status = 'live'; } for (const m of ALLY.extra) MPCOOP.host.send(m.seat, {t: 'start', contract: MPCOOP.contractInfo(G.contract), seat: m.seat}); logIt('march', {squads: G.allies.length}); }
        MPCOOP.waitUntil = 0; for (const k in MPCOOP.seats) MPCOOP.seats[k].ready = false;
      } catch (x) { console.error('MPCOOP start', x); }
      ALLY.extra = [];
      return r;
    }
    return f();
  };
}
/* snapshots at 10 Hz and the turn timer */
MPCOOP.snapshot = function(g){
  g = g || G;
  const L = g.leader, out = {t: 'snap', sec: g.sec | 0, frame: g.frame, prog: +(typeof progress === 'function' && g === G ? progress() : g.prog || 0).toFixed(3), obj: g.obj, over: !!g.over, leader: [Math.round(L.x), Math.round(L.y), L.state === 'down' || L.down ? 0 : 1], squad: (g.squad || []).map(m => [Math.round(m.x), Math.round(m.y)]), squads: [], enemies: [], msgs: (g.msgs || []).slice(0, 3).map(m => String(m.t).slice(0, 120))};
  for (const sq of (g.allies || [])) out.squads.push({seat: sq.seat, orders: sq.orders, ctl: sq.controller, st: sq.status || 'live', kills: sq.kills, name: sq.name, officer: sq.officer.name, left: sq.controller === 'guest' ? Math.max(0, MPCOOP.TURN_TIMEOUT_S - ((g.sec | 0) - (sq.lastOrder || 0))) : null, units: sq.units.map(u => [Math.round(u.x), Math.round(u.y), u.hp, u.maxHp, u.state === 'up' ? 1 : 0, u.p.name])});
  const near = []; for (const en of (g.enemies || [])) if (!en.dead && !en.dormant) near.push(en);
  near.sort((a, b) => Math.hypot(a.x - L.x, a.y - L.y) - Math.hypot(b.x - L.x, b.y - L.y));
  out.enemies = near.slice(0, MPCOOP.ENEMY_CAP).map(en => [Math.round(en.x), Math.round(en.y), en.boss ? 1 : 0]);
  if (g === G && window.F33 && F33.coopMarkOn && F33.coopMarkOn()){   // F-33 step 8: enemy ids and each squad's mark, for the guest mark
    out.mk = 1; out.enemies.forEach((a, i) => a.push(F33.mid(near[i])));
    for (const q of out.squads){ const sq = (g.allies || []).find(x => x.seat === q.seat); q.mark = sq && sq.mark && !sq.mark.dead ? F33.mid(sq.mark) : 0; }
  }
  return out;
};
{ const f = updateContract;
  updateContract = function(){
    const r = f();
    if (MPCOOP.role === 'host' && MPCOOP.host && G && G.allies && G.allies.length){
      try {
        for (const sq of G.allies) if (sq.controller === 'guest' && !sq.aiNow && (G.sec | 0) - (sq.lastOrder || 0) > MPCOOP.TURN_TIMEOUT_S){ sq.aiNow = true; }
        if (G.frame % MPCOOP.SNAP_EVERY === 0) MPCOOP.host.broadcast(MPCOOP.snapshot());
      } catch (x) { if (!MPCOOP._err){ MPCOOP._err = x; console.error('MPCOOP snap', x); } }
    }
    return r;
  };
}
{ const f = ALLY.hudLine;
  ALLY.hudLine = function(sq){ let s = f(sq); if (sq.controller === 'guest'){ const left = MPCOOP.TURN_TIMEOUT_S - ((G.sec | 0) - (sq.lastOrder || 0)); s += (sq.aiNow || left <= 0) ? '  ·  AI FOR NOW' : left <= MPCOOP.COUNTDOWN_SHOW_S ? `  ·  ${Math.max(0, left)} s` : ''; } else if (sq.status === 'dropped') s += '  ·  LINK LOST'; else if (sq.status === 'takeover') s += '  ·  THE CHAPTER’S NOW'; return s; };
}
/* the debrief: each guest seat gets its lines, its cut and the offer */
{ const f = renderDebrief;
  renderDebrief = function(head, lines){
    f(head, lines);
    if (MPCOOP.role !== 'host' || !MPCOOP.host || !G || !G.allies) return;
    try {
      const c = G.contract, mine = MPCOOP.saveId();
      for (const sq of G.allies){
        const info = MPCOOP.seats[sq.seat]; if (!info || sq.controller === 'ai' && sq.status === 'takeover') continue;
        const cut = sq.share ? sq.share.cut : 0, same = !!(info.saveId && mine && info.saveId === mine);
        const offer = COOP.guestOffer(cut, c.tier, {sameSave: same});
        MPCOOP.host.send(sq.seat, {t: 'debrief', head: String(head || '').slice(0, 200), lines: sq.lines || [], share: sq.share ? sq.share.share : 0, cut, offer, result: G.result, kills: sq.kills, dead: sq.dead, hurt: sq.hurt, contract: MPCOOP.contractInfo(c), host: MPCOOP.hostName || myName(), hostId: mine});
        logIt('debrief sent', {seat: sq.seat, cut, gold: offer.gold, blocked: offer.blocked});
      }
      MPCOOP.sendLobby();
    } catch (x) { console.error('MPCOOP debrief', x); }
  };
}

/* =============================================================================
   THE GUEST
============================================================================= */
MPCOOP.openGuest = function(){
  if (MPCOOP.role) return;
  if (!META.leader){ return; }
  MPCOOP.role = 'guest'; MPCOOP.view = 'pair'; MPCOOP.G = {code: '', answer: '', err: '', busy: false, lobby: null, snap: null, debrief: null, lost: '', ready: false, orders: 'follow', seat: 0, banked: null, host: ''};
  MPCOOP.guest = MPNET.guest({
    onWelcome: (seat, rejoin) => { MPCOOP.G.seat = seat; MPCOOP.G.err = ''; if (MPCOOP.view === 'pair' || MPCOOP.view === 'lost') MPCOOP.view = rejoin && MPCOOP.G.snap ? 'field' : 'lobby'; sfx('pick'); MPCOOP.renderGuest(); },
    onMessage: m => {
      const g = MPCOOP.G;
      if (m.t === 'lobby'){ g.lobby = m; g.host = cleanName(m.host, 'the host'); if (m.late) g.lobby.note = 'The host is in the field; you march next time.'; if (MPCOOP.view === 'lobby' || MPCOOP.view === 'debrief' && g.lobby && !g.lobby.inField && false) MPCOOP.renderGuest(); }
      else if (m.t === 'start'){ g.seat = m.seat | 0; g.contract = m.contract; g.snap = null; MPCOOP.view = 'field'; sfx('horn'); MPCOOP.renderGuest(); }
      else if (m.t === 'snap'){ g.snap = m; if (MPCOOP.view === 'field') MPCOOP.drawGlass(); if (m.over && MPCOOP.view === 'field') MPCOOP.renderGuest(); }
      else if (m.t === 'debrief'){ g.debrief = m; g.banked = null; MPCOOP.view = 'debrief'; sfx('coin'); MPCOOP.renderGuest(); }
    },
    onLost: (why, final) => { MPCOOP.G.lost = why; MPCOOP.G.final = final; MPCOOP.view = 'lost'; MPCOOP.renderGuest(); }
  }, {name: myName(), hello: {captain: myCaptain(), mates: myMates(), saveId: MPCOOP.saveId()}});
  logIt('guest open'); MPCOOP.renderGuest();
};
MPCOOP.closeGuest = function(){
  if (MPCOOP.role !== 'guest') return;
  try { MPCOOP.guest.leave(); } catch (x) {}
  MPCOOP.guest = null; MPCOOP.role = null; MPCOOP.view = null; closeRoot();
  logIt('guest closed'); MPCOOP.refresh();
};
MPCOOP.answerHost = async function(){
  const g = MPCOOP.G, ta = $id('mpco-host-code'); if (!ta) return;
  g.busy = true; g.err = ''; MPCOOP.renderGuest();
  try { g.answer = await MPCOOP.guest.answer(ta.value); g.code = ta.value; } catch (x) { g.err = x.message || String(x); }
  g.busy = false; MPCOOP.renderGuest();
};
MPCOOP.guestOrders = function(o){ const g = MPCOOP.G; if (!ALLY.ORDERS.includes(o)) return; g.orders = o; MPCOOP.guest.send({t: 'orders', o}); sfx('pick'); if (g.snap){ const sq = g.snap.squads.find(s => s.seat === g.seat); if (sq){ sq.orders = o; sq.left = MPCOOP.TURN_TIMEOUT_S; } } MPCOOP.renderGuest(); };
MPCOOP.guestReady = function(){ const g = MPCOOP.G; g.ready = !g.ready; MPCOOP.guest.send({t: 'ready', on: g.ready}); sfx('pick'); MPCOOP.renderGuest(); };
/* banking the captain's cut: capped by the offer, once a day per host, never between two copies of one save */
MPCOOP.bank = function(){
  const g = MPCOOP.G, d = g.debrief; if (!d || g.banked) return;
  const offer = d.offer || {}, hostId = typeof d.hostId === 'string' ? d.hostId.slice(0, 16) : 'unknown', today = dayStamp();
  META.coopBanked = META.coopBanked || {};
  let gold = num(offer.gold, 0, COOP.GUEST_CAP[3], 0), why = offer.blocked || null;
  const farmed = META.coopBanked[hostId] === today;   // one banking a day per host: no gold, no tick, no chronicle line
  if (farmed){ gold = 0; why = 'already banked with this host today'; }
  if (gold > 0){ META.treasury = (META.treasury || 0) + gold; META.coopBanked[hostId] = today; }
  const L = META.leader, lines = [];
  if (gold) lines.push(`<p>${gold}gp banked, the visiting captain's cut.</p>`); else lines.push(`<p>No gold banked (${e(why || 'nothing owed')}).</p>`);
  if (offer.xpTick && !farmed && d.result !== 'fled' && d.result !== 'fallen'){
    L.ticks = (L.ticks || 0) + 1; lines.push(`<p>${e(L.name)} earns an XP tick (${L.ticks} / 3).</p>`);
    if (L.ticks >= 3){ L.ticks = 0; L.level = Math.min(11, (L.level || 1) + 1); lines.push(`<p class="good"><b>${e(L.name)} reaches Level ${L.level}.</b></p>`); try { if (rowFor(L.spec, L.level)[2] === 'pick') META.pendingPicks = (META.pendingPicks || 0) + 1; } catch (x) {} }
  }
  try { if (offer.chronicleLine && !farmed && typeof chron === 'function'){ chron(); const c = d.contract || {}; chronAdd('contract', {obj: c.obj, title: `Marched with ${cleanName(d.host, 'a friend')}`, place: c.place, patron: c.patron, tier: c.tier, host: c.host, result: d.result, kills: d.kills | 0, bosses: 0, gold}, true); lines.push('<p>The Chronicle records the march.</p>'); } } catch (x) {}
  try { saveMeta(); } catch (x) {}
  g.banked = {gold, lines}; MPCOOP.guest.send({t: 'banked', gold}); logIt('banked', {gold, why}); sfx(gold ? 'coin' : 'pick');
  MPCOOP.renderGuest();
};
MPCOOP.renderGuest = function(){
  if (MPCOOP.role !== 'guest') return;
  const g = MPCOOP.G, r = root(), v = MPCOOP.view; let h = `<div class="mpco-in">`;
  const leave = `<button class="mpco-btn" onclick="MPCOOP.closeGuest()">LEAVE</button>`;
  if (v === 'pair'){
    h += `<h1>Join a friend's march</h1><div class="mpco-sub">Your Leader ${e(myName())} rides as a visiting captain with up to four of your ready mates. The host runs the field; you give your squad its orders and keep the captain's cut.</div>`;
    h += `<h2>1. Paste the host code your friend sent</h2><textarea id="mpco-host-code" placeholder="DCCO1...">${e(g.code)}</textarea><button class="mpco-btn gold" onclick="MPCOOP.answerHost()" ${g.busy ? 'disabled' : ''}>${g.busy ? 'ANSWERING...' : 'ANSWER'}</button>${leave}`;
    if (g.err) h += `<div class="mpco-err">${e(g.err)}</div>`;
    if (g.answer) h += `<h2>2. Send this answer back</h2><textarea id="mpco-answer" readonly>${e(g.answer)}</textarea><button class="mpco-btn" onclick="MPCOOP.copy('mpco-answer')">COPY</button><div class="mpco-sub">Waiting for the host to connect...</div>`;
  } else if (v === 'lobby'){
    const lb = g.lobby;
    h += `<h1>${e(g.host || 'The host')}'s march</h1>`;
    if (!lb) h += `<div class="mpco-sub">Connected. Waiting for the host's table...</div>`;
    else {
      if (lb.note) h += `<div class="mpco-sub" style="color:var(--gold-bright)">${e(lb.note)}</div>`;
      const c = lb.contract;
      h += c ? `<h2>${e(c.title || c.name)} at ${e(c.place)}, Tier ${c.tier}</h2><div class="mpco-sub">For ${e(c.patron || 'a patron')}; joint pay ${c.jointPay}gp (x${c.k}, ${c.n} squads)${lb.odds ? `; odds together ${e(lb.odds)}` : ''}.${lb.shares && lb.shares[g.seat] ? ` Your squad's share ${lb.shares[g.seat].share}gp, your cut ${lb.shares[g.seat].cut}gp (capped at ${COOP.GUEST_CAP[Math.min(3, Math.max(1, META.leader.level > 6 ? 3 : META.leader.level > 3 ? 2 : 1))]}gp).` : ''}</div>` : `<div class="mpco-sub">The host has not picked a contract yet.</div>`;
      h += `<h2>Seats</h2>`;
      for (const s of lb.seats) h += `<div>Seat ${s.seat + 1}: ${s.status === 'connected' ? `<b>${e(s.name)}</b>${s.seat === g.seat ? ' (you)' : ''}, captain ${e(s.captain)}, ${s.nMates} mates, ${ALLY.LABEL[s.orders] || s.orders} ${s.ready ? '<span class="mpco-tag ok">READY</span>' : '<span class="mpco-tag warn">not ready</span>'}` : `<span class="mpco-tag">${e(s.status)}</span>`}</div>`;
      if (window.ARM && ARM.guestLobbyHTML) h += ARM.guestLobbyHTML(lb, g.seat);   // INDEX A33: the kits
      if (lb.waitUntil) h += `<div class="mpco-sub" style="color:var(--gold-bright)">The host may march without the unready in ${lb.waitUntil} s.</div>`;
    }
    h += `<h2>Your orders</h2>` + ALLY.ORDERS.map(o => `<button class="mpco-btn ${g.orders === o ? 'on' : ''}" onclick="MPCOOP.guestOrders('${o}')">${ALLY.LABEL[o]}</button>`).join('');
    h += `<div style="margin-top:10px"><button class="mpco-btn gold ${g.ready ? 'on' : ''}" onclick="MPCOOP.guestReady()">${g.ready ? 'READY (click to unready)' : 'READY TO MARCH'}</button>${leave}</div>`;
  } else if (v === 'field'){
    const s = g.snap, sq = s && s.squads.find(x => x.seat === g.seat);
    h += `<h1>${e(g.contract ? (g.contract.title || g.contract.name) : 'The field')}</h1>`;
    h += `<canvas id="mpco-glass" width="640" height="400" onclick="MPCOOP.glassClick(event)"></canvas>`;
    h += `<div style="margin:6px 0">${ALLY.ORDERS.map(o => `<button class="mpco-btn ${g.orders === o ? 'on' : ''}" onclick="MPCOOP.guestOrders('${o}')">${ALLY.LABEL[o]}</button>`).join('')}`;
    if (sq) h += ` <span class="mpco-tag ${sq.left === 0 ? 'warn' : ''}">${sq.left === 0 ? 'AI FOR NOW: give an order' : sq.left <= MPCOOP.COUNTDOWN_SHOW_S ? `check in: ${sq.left} s` : 'orders stand'}</span>`;
    h += `</div><div id="mpco-msgs" class="mpco-sub"></div>`;
    if (s && s.over) h += `<div class="mpco-sub">The field is over; the host's debrief is coming.</div>`;
    h += leave;
  } else if (v === 'debrief'){
    const d = g.debrief;
    h += `<h1>${e(d.head || 'Debrief')}</h1><div class="log">${MPCOOP.safeLines(d.lines)}</div>`;
    h += `<h2>Your reward</h2><div class="mpco-sub">Your squad's share ${d.share | 0}gp; the visiting captain's cut ${d.cut | 0}gp${d.offer && d.offer.blocked ? ` (nothing banked: ${e(d.offer.blocked)})` : d.offer ? `, banked up to ${d.offer.cap}gp: <b>${d.offer.gold}gp</b>` : ''}.</div>`;
    if (!g.banked) h += `<button class="mpco-btn gold" onclick="MPCOOP.bank()">BANK REWARDS</button>`;
    else h += `<div class="log">${g.banked.lines.join('')}</div><button class="mpco-btn" onclick="MPCOOP.view='lobby';MPCOOP.G.ready=false;MPCOOP.renderGuest()">STAY FOR ANOTHER</button>`;
    h += leave;
  } else if (v === 'lost'){
    h += `<h1>The link is lost</h1><div class="mpco-err">${e(g.lost)}</div>`;
    if (!g.final) h += `<div class="mpco-sub">Ask the host for a rejoin code for your seat within a minute; your squad keeps its orders meanwhile.</div><h2>Paste the rejoin code</h2><textarea id="mpco-host-code"></textarea><button class="mpco-btn gold" onclick="MPCOOP.answerHost()" ${g.busy ? 'disabled' : ''}>ANSWER</button>` + (g.err ? `<div class="mpco-err">${e(g.err)}</div>` : '') + (g.answer ? `<h2>Send this answer back</h2><textarea id="mpco-answer" readonly>${e(g.answer)}</textarea><button class="mpco-btn" onclick="MPCOOP.copy('mpco-answer')">COPY</button>` : '');
    h += leave;
  }
  r.innerHTML = h + `</div>`;
  if (v === 'field') MPCOOP.drawGlass();
};
/* F-33 step 8: a click on an enemy dot in the glass sends a mark for the guest's own squad (an empty click keeps the mark) */
MPCOOP.glassClick = function(ev){
  const g = MPCOOP.G, s = g && g.snap, cv = $id('mpco-glass'); if (!s || !s.mk || !cv || !g.glassPx) return false;
  const b = cv.getBoundingClientRect(), mx = (ev.clientX - b.left) * cv.width / (b.width || cv.width), my = (ev.clientY - b.top) * cv.height / (b.height || cv.height);
  let best = null, bd = 14;
  for (const en of s.enemies){ if (!en[3]) continue; const [ex, ey] = g.glassPx(en[0], en[1]), d = Math.hypot(ex - mx, ey - my); if (d < bd){ bd = d; best = en; } }
  if (!best) return false;
  MPCOOP.guest.send({t: 'mark', id: best[3]}); sfx('pick');
  const mine = s.squads.find(q => q.seat === g.seat); if (mine) mine.mark = best[3];
  MPCOOP.drawGlass(); return true;
};
/* the field glass: the host's snapshot as dots round the guest's own squad */
MPCOOP.drawGlass = function(){
  const g = MPCOOP.G, s = g.snap, cv = $id('mpco-glass'); if (!cv || !s) return;
  const x = cv.getContext('2d'), W = cv.width, Hh = cv.height, mine = s.squads.find(q => q.seat === g.seat);
  const c = mine && mine.units.find(u => u[4]) ? mine.units.find(u => u[4]) : s.leader, sc = 0.7, cx = c[0], cy = c[1];
  const px = (vx, vy) => [W / 2 + (vx - cx) * sc, Hh / 2 + (vy - cy) * sc];
  g.glassPx = px;
  x.fillStyle = '#0f0c08'; x.fillRect(0, 0, W, Hh);
  x.strokeStyle = 'rgba(243,230,200,.12)'; for (let i = 0; i < W; i += 40){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, Hh); x.stroke(); } for (let j = 0; j < Hh; j += 40){ x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
  for (const en of s.enemies){ const [ex, ey] = px(en[0], en[1]); x.fillStyle = en[2] ? '#ff5a3a' : '#c84a3a'; x.beginPath(); x.arc(ex, ey, en[2] ? 6 : 3.5, 0, Math.PI * 2); x.fill(); }
  for (const m of s.squad){ const [mx, my] = px(m[0], m[1]); x.fillStyle = '#e8e0d0'; x.beginPath(); x.arc(mx, my, 3.5, 0, Math.PI * 2); x.fill(); }
  { const [lx, ly] = px(s.leader[0], s.leader[1]); x.fillStyle = s.leader[2] ? '#ffffff' : '#888'; x.beginPath(); x.arc(lx, ly, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f3e6c8'; x.font = '11px Georgia'; x.textAlign = 'center'; x.fillText(e(g.host || 'host'), lx, ly - 9); }
  for (const q of s.squads){
    const col = ALLY.colour(q.seat), own = q.seat === g.seat;
    q.units.forEach((u, i) => { const [ux, uy] = px(u[0], u[1]); x.fillStyle = u[4] ? col : 'rgba(120,120,120,.8)'; x.beginPath(); x.arc(ux, uy, own ? 5 : 3.5, 0, Math.PI * 2); x.fill();
      if (own && u[4]){ x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(ux - 8, uy + 7, 16, 3); x.fillStyle = col; x.fillRect(ux - 8, uy + 7, 16 * u[2] / Math.max(1, u[3]), 3); }
      if (i === 0){ x.fillStyle = col; x.font = (own ? 'bold ' : '') + '11px Georgia'; x.textAlign = 'center'; x.fillText(q.name || q.officer, ux, uy - 9); } });
  }
  if (s.mk){   // F-33 step 8: the guest's mark, and the hint
    const mk = mine && mine.mark && s.enemies.find(en => en[3] === mine.mark);
    if (mk){ const [ex, ey] = px(mk[0], mk[1]); x.strokeStyle = ALLY.colour(g.seat); x.lineWidth = 2; x.setLineDash([4, 3]); x.beginPath(); x.arc(ex, ey, 10, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
    x.fillStyle = 'rgba(243,230,200,.75)'; x.font = '11px Georgia'; x.textAlign = 'right'; x.fillText('Click an enemy to mark it for your squad.', W - 8, 16);
  }
  x.fillStyle = '#f3e6c8'; x.font = 'bold 12px Georgia'; x.textAlign = 'left';
  x.fillText(`${Math.floor(s.sec / 60)}:${String(s.sec % 60).padStart(2, '0')}  ·  progress ${Math.round(s.prog * 100)}%`, 8, 16);
  if (mine) x.fillText(`${mine.officer.toUpperCase()}  ·  ${ALLY.LABEL[mine.orders]}  ·  ${mine.units.filter(u => u[4]).length} / ${mine.units.length} UP  ·  ${mine.kills} kills${mine.st !== 'live' ? '  ·  ' + mine.st.toUpperCase() : ''}`, 8, Hh - 10);
  const box = $id('mpco-msgs'); if (box) box.innerHTML = s.msgs.map(m => `<div>${e(m)}</div>`).join('');
  const tag = cv.parentElement && cv.parentElement.querySelector('.mpco-tag'); if (tag && mine) tag.textContent = mine.left === 0 ? 'AI FOR NOW: give an order' : mine.left <= MPCOOP.COUNTDOWN_SHOW_S ? `check in: ${mine.left} s` : 'orders stand';
};

/* ---- self-test ------------------------------------------------------------------ */
MPCOOP.selfTest = function(){
  const fails = [], ok = (n, c) => { if (!c) fails.push(n); };
  const p = MPCOOP.sanitizePerson({name: '<b>Evil</b>', race: 'NOPE', spec: 'NOPE', level: 99, startCon: 'x', adv: 7}, true, 'g1');
  ok('sanitize', p.guestCaptain && p.race === 'HUMAN' && (typeof CLASSES === 'undefined' || CLASSES[p.cls]) && p.level === 11 && p.startCon === 4 && p.adv === 3 && p.name.indexOf('<') < 0 && p.injuries.length === 0);
  ok('sanitize mate', MPCOOP.sanitizePerson(null, false, 'g1m0').guestMate === true);
  const safe = MPCOOP.safeLines(['<p class="bad"><b>Dead</b></p><script>alert(1)</script><img onerror=x>']);
  ok('safe lines', safe.indexOf('<script') < 0 && safe.indexOf('<img') < 0 && safe.indexOf('<p class="bad"><b>Dead</b></p>') === 0);
  const fakeG = {sec: 65, frame: 600, obj: 'hold', prog: 0.5, over: false, leader: {x: 100, y: 100}, squad: [{x: 90, y: 110}], msgs: [{t: 'hi'}],
    allies: [{seat: 1, orders: 'hold', controller: 'guest', status: 'live', kills: 2, name: 'Pat', lastOrder: 40, officer: {name: 'Cap'}, units: [{x: 1, y: 2, hp: 3, maxHp: 6, state: 'up', p: {name: 'Cap'}}, {x: 3, y: 4, hp: 0, maxHp: 4, state: 'down', p: {name: 'M'}}]}],
    enemies: [{x: 120, y: 100}, {x: 500, y: 500, dormant: true}, {x: 130, y: 100, dead: true}, {x: 110, y: 100, boss: true}]};
  const snap = MPCOOP.snapshot(fakeG);
  ok('snapshot shape', snap.t === 'snap' && snap.sec === 65 && snap.enemies.length === 2 && snap.enemies[0][2] === 1 && snap.squads[0].units[1][4] === 0 && snap.squads[0].left === 5 && snap.msgs[0] === 'hi');
  const snapS = JSON.stringify(snap); ok('snapshot small', snapS.length < 2000);
  /* a fake host and lobby payload */
  const saveRole = MPCOOP.role, saveHost = MPCOOP.host, saveSeats = MPCOOP.seats, saveExtra = ALLY.extra;
  try {
    MPCOOP.role = 'host'; MPCOOP.host = MPNET.host({}, {fake: true}); MPCOOP.seats = {};
    MPCOOP.host.slots[1].status = 'connected';
    MPCOOP.seats[2] = {seat: 2, name: 'Pat', captain: MPCOOP.sanitizePerson({name: 'Pat', spec: 'FIGHTER', race: 'HUMAN', level: 3}, true, 'g2'), mates: [MPCOOP.sanitizePerson({name: 'M1'}, false, 'g2m0')], lentIds: [], ready: false, orders: 'follow', saveId: 'abc'};
    const m = MPCOOP.marchers(); ok('marchers from seats', m.length === 1 && m[0].seat === 2 && m[0].controller === 'guest' && m[0].mates.length === 1 && m[0].officer.guestCaptain);
    ok('unready named', MPCOOP.unready()[0] === 'Pat');
    const lb = MPCOOP.lobbyPayload(); ok('lobby payload', lb.t === 'lobby' && lb.seats.length === 3 && lb.seats[1].name === 'Pat' && !lb.seats[1].ready);
    ok('strip html', typeof MPCOOP.stripHTML() === 'string' && MPCOOP.stripHTML().indexOf('Pat') > 0);
    ok('block replaced while hosting', ALLY.blockHTML().indexOf('co-op seats') > 0);
    MPCOOP.host.close();
  } catch (x) { fails.push('host fakes threw: ' + (x.message || x)); }
  MPCOOP.role = saveRole; MPCOOP.host = saveHost; MPCOOP.seats = saveSeats; ALLY.extra = saveExtra;
  ok('offer cap', COOP.guestOffer(900, 1, {}).gold === COOP.GUEST_CAP[1] && COOP.guestOffer(900, 1, {sameSave: true}).gold === 0);
  ok('day stamp', /^\d{4}-\d{2}-\d{2}$/.test(dayStamp()));
  return {ok: !fails.length, fails, info: 'sanitize, safe lines, snapshot, marchers, lobby, strip, offer'};
};
})();
