/* ============================================================================
   Index MP1 - Crepitus with a friend (2-player table over WebRTC). PROTOTYPE.
   What it does:
     - Adds a "Play a friend online" button while the tavern hub (#tavern-hub) is open.
     - Pairing with no server: the host makes an offer code, the guest pastes it and makes an
       answer code, the host pastes that back. Codes are deflate + base64 of the SDP, made after
       ICE gathering finishes, so no trickle ICE is needed.
     - The host browser is the referee: it runs CREPITUS.engine, checks every move with the
       engine and ignores out-of-turn input. The guest only sends actions and draws whatever
       snapshot the host sends.
     - Hidden dice: snapshotFor(viewer) puts private dice only in the viewer's own seat. The other
       seat's dice are added only when T.phase === 'done' (after E.showdown).
     - Table-only purse (TABLE_PURSE each). META.treasury is never read or written.
       Nothing is written to localStorage. No network calls except the WebRTC connection
       (STUN_URLS is the only external address; set it to [] for same machine / same network only).
   Needs: window.CREPITUS.engine and RTCPeerConnection. If either is missing this file does nothing.
   Self-test (no browser pairing needed): in the console run MP_CREPITUS.selfTest(50)
   ROLLBACK: delete this file and its <script> tag
============================================================================ */
(function(){
'use strict';

/* ------------------------------------------------------------ TUNABLES --- */
const PROTO = 'mpc1';                       // protocol/version tag; both browsers must match
const TABLE_PURSE = 40;                     // table-only coins each player starts with (no real gold)
const TABLE_UNIT = 1;                       // one table coin (display only, never converted to gold)
const BUYIN = 2;                            // buy-in per hand, in table coins (engine default)
const REROLL_MAX = 1;                       // full-hand rerolls allowed per hand (engine default)
const STUN_URLS = ['stun:stun.l.google.com:19302'];   // EXTERNAL: public STUN (Google). [] = no external address
const ICE_GATHER_TIMEOUT_MS = 5000;         // stop waiting for ICE candidates after this
const CONNECT_TIMEOUT_MS = 25000;           // host: give up if the channel does not open after the answer is pasted
const HEARTBEAT_MS = 2000;                  // ping interval
const PEER_TIMEOUT_MS = 20000;              // no word from the other player for this long = disconnected
const RETURN_AFTER_MS = 8000;               // after a disconnect, return to the tavern automatically
const ENTRY_POLL_MS = 500;                  // how often the entry button checks if the hub is open
const MAX_MSG_CHARS = 16384;                // ignore bigger data-channel messages
const MAX_CODE_CHARS = 20000;               // ignore bigger pasted codes
const MAX_ACTS_PER_SEC = 8;                 // guest actions above this rate are dropped
const MAX_NAME = 24;                        // player name length shown at the table
const HUB_ID = 'tavern-hub';                // tavern hub root element id (studio note 2026-11-09)
const CODE_TAG = 'DCMP1';                   // prefix on pairing codes
const DC_LABEL = 'crepitus';                // data channel label
const Z_ENTRY = 61;                         // entry button sits above #tavern-hub (z-index 60)
const Z_SCREEN = 70;                        // the table screen
const LEVEL_COLOURS = ['#9e9e9e', '#8bc34a', '#4fc3f7', '#7986cb', '#ba68c8', '#ffb74d', '#ef5350'];   // die levels 0..6
const COINS = [['Copper', 1], ['Silver', 2], ['Gold', 4]];  // Rank'n coin values in table units

/* -------------------------------------------------------------- GUARDS --- */
if (typeof window === 'undefined' || typeof document === 'undefined') return;
if (window.MP_CREPITUS) return;
const C = window.CREPITUS;
if (!C || !C.engine || typeof window.RTCPeerConnection !== 'function') return;
const E = C.engine;
for (const f of ['newTable', 'deal', 'discard', 'reroll', 'act', 'allDiscarded', 'startHunts', 'showdown', 'fund']) if (typeof E[f] !== 'function') return;

/* ------------------------------------------------------------- HELPERS --- */
const sfx = n => { try { if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') SFX.play(n); } catch (e) {} };
const h = s => (typeof esc === 'function' ? esc(String(s)) : String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])));
const isInt = x => Number.isInteger(x);
const num = x => (Number.isFinite(+x) ? +x : 0);
const cleanName = (n, fb) => { const s = String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME); return s || fb; };
const myName = fb => { try { if (typeof META !== 'undefined' && META && META.leader && META.leader.name) return cleanName(META.leader.name, fb); } catch (e) {} return fb; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ======================================================= HOST TABLE CORE ===
   Pure: no DOM, no network. emit(viewer, snapshot) is called for seat 0 (host) and seat 1 (guest).
   apply(si, action) returns null when accepted, or a short reason when refused.            */
function createTable(names, emit){
  const T = E.newTable([
    {name: cleanName(names[0], 'Host'), human: true, purse: TABLE_PURSE},
    {name: cleanName(names[1], 'Guest'), human: true, purse: TABLE_PURSE}
  ], TABLE_UNIT, {buyin: BUYIN, rerollMax: REROLL_MAX});
  T.dealer = 0;                                         // first deal passes to seat 1, as CREPITUS.open does
  const st = {msg: '', fx: [], ready: [false, false], show: null, over: '', seq: 0};
  const nm = i => T.seats[i].name;
  const dieName = id => { const d = T.pool.find(x => x.id === id) || T.removed.find(x => x.id === id); return d ? `level ${d.lvl} die (${d.v})` : 'die'; };

  // ---- THE SNAPSHOT BUILDER: the only data that ever leaves the host ----
  function seatView(s, open){
    const p = {name: s.name, purse: s.purse, out: !!s.out, discarded: !!s.discarded, state: String(s.state || ''),
      paid: s.paid || 0, rerolls: s.rerolls || 0, dice: s.hid ? s.hid.length : 0};
    if (open){                                          // own seat always; other seat only after showdown
      p.hid = s.hid ? s.hid.map(d => ({lvl: d.lvl, v: d.v})) : null;
      p.kept = s.kept ? s.kept.slice() : null;
    }
    return p;
  }
  function snapshotFor(viewer){
    const reveal = T.phase === 'done';                  // never 'show': showdown runs in the same step
    return {
      t: 'state', v: PROTO, seq: ++st.seq, you: viewer,
      hand: T.hand, unit: T.unit, buyin: T.buyin, rerollMax: T.rerollMax, dealer: T.dealer, pot: T.pot,
      phase: T.phase, hunt: T.hunt, round: T.round, turn: T.turn, cup: T.cup.length,   // cup: count only (levels would leak discards)
      pool: T.pool.map(d => ({id: d.id, lvl: d.lvl, v: d.v})),
      removed: T.removed.map(d => ({id: d.id, lvl: d.lvl, v: d.v})),
      bounty: T.bounty ? {die: T.bounty.die, total: T.bounty.total, owner: T.bounty.owner} : null,
      seats: T.seats.map((s, i) => seatView(s, i === viewer || reveal)),
      show: reveal && st.show ? st.show : null,
      ready: st.ready.slice(), over: st.over, msg: st.msg, fx: st.fx.slice()
    };
  }
  function broadcast(){ const a = snapshotFor(0), b = snapshotFor(1); st.fx = []; emit(0, a); emit(1, b); }

  function newHand(){
    const n = T.seats.length, nextDealer = (T.dealer + 1) % n;
    for (let i = 0; i < n; i++) if (i !== nextDealer && !E.fund(T.seats[i], T.buyin)){
      st.over = `${nm(i)} cannot cover the buy-in. The table is closed: thanks for playing.`; st.msg = st.over; return;
    }
    st.ready = [false, false]; st.show = null;
    E.deal(T);
    st.msg = `${nm(T.dealer)} deals (no buy-in for the dealer). Buy-in ${plural(T.buyin, 'coin')}. Pick 2 dice to throw into the community cup.`;
    st.fx.push('diceCup', 'diceRoll');
  }
  function showdown(){
    const r = E.showdown(T);
    st.show = {results: r.results.map(x => ({seat: x.seat, name: x.name})), winners: r.winners.slice(), share: r.share, odd: r.odd, pot: r.pot, com: r.com.slice()};
    const w = r.winners, top = r.results.find(x => x.seat === w[0]);
    st.msg = w.length > 1 ? `A tie on ${top ? top.name : 'the same hand'}: the pot of ${r.pot} is split.`
      : `${nm(w[0])} wins the pot of ${r.pot} with ${top ? top.name : 'the best hand'}.`;
  }
  function apply(si, a){
    if (st.over) return 'The table is closed.';
    if (!a || typeof a !== 'object' || typeof a.type !== 'string') return 'Unknown move.';
    const s = T.seats[si]; if (!s) return 'Unknown seat.';
    switch (a.type){
      case 'discard': {
        if (T.phase !== 'discard' || s.out || s.discarded || !s.hid) return 'You cannot discard now.';
        if (!isInt(a.i) || !isInt(a.j) || a.i < 0 || a.j < 0 || a.i >= s.hid.length || a.j >= s.hid.length) return 'Pick 2 of your dice.';
        if (!E.discard(T, s, a.i, a.j)) return 'Pick 2 different dice.';
        st.msg = `${nm(si)} throws 2 dice into the community cup.`; st.fx.push('diceCup');
        if (E.allDiscarded(T)){ E.startHunts(T); st.msg = `The community dice are thrown. First Hunt: ${nm(T.turn)} starts. Bid to drop dice you do not want, until 2 remain.`; st.fx.push('diceRoll'); }
        break;
      }
      case 'reroll': {
        if (T.phase !== 'discard' || s.out) return 'You cannot reroll now.';
        if (!E.reroll(T, s)) return `No reroll: it costs ${plural(T.buyin, 'coin')}, once per hand, before you discard.`;
        st.msg = `${nm(si)} pays ${plural(T.buyin, 'coin')} and rerolls their whole hand.`; st.fx.push('diceRoll');
        break;
      }
      case 'bid': case 'pass': {
        if (T.phase !== 'hunt' || T.turn !== si) return 'It is not your turn.';
        let mv, label = '', b0 = T.bounty ? {die: T.bounty.die, total: T.bounty.total} : null;
        if (a.type === 'pass') mv = {type: 'pass'};
        else {
          if (!isInt(a.die) || !isInt(a.total) || a.total < 1) return 'Pick a community die and some coins.';
          mv = {type: 'bid', die: a.die, total: a.total}; label = dieName(a.die);
        }
        const r = E.act(T, si, mv);
        if (!r || !r.ok) return b0 && mv.die !== b0.die ? `To move the bounty you must bid at least ${b0.total + 1} in total, and you need the coins.` : 'That bid is not allowed (check your coins).';
        const ev = r.ev || {};
        if (mv.type === 'bid'){
          st.fx.push('coin');
          if (!b0) st.msg = `${nm(si)} puts a bounty of ${mv.total} on the ${label}.`;
          else if (b0.die === mv.die) st.msg = `${nm(si)} adds ${mv.total}: the bounty on the ${label} is now ${b0.total + mv.total}.`;
          else st.msg = `${nm(si)} outbids with ${mv.total} on the ${label}. The old bounty stays in the pot.`;
        } else st.msg = `${nm(si)} passes.`;
        if (ev.removed && !ev.passRule){ const d = T.removed[T.removed.length - 1]; st.msg = `The bounty (${ev.bounty || 0}) is paid: the ${d ? 'level ' + d.lvl + ' die showing ' + d.v : 'die'} is removed.`; st.fx.push('pick'); }
        if (ev.passRule === 'reroll') st.msg = 'Nobody bid in the First Hunt: the dealer rerolls the whole pool and the Second Hunt begins.';
        if (ev.passRule === 'low2') st.msg = 'Nobody bid at the start of the Second Hunt: only the 2 lowest dice stay.';
        if (ev.passRule === 'high') st.msg = 'Nobody bid: the highest die is dropped.';
        if (ev.hunt2) st.msg += ' The Second Hunt begins: the dropped dice are rerolled and merged back.';
        if (T.phase === 'show') showdown();
        break;
      }
      case 'next': {
        if (T.phase !== 'done') return 'Finish this hand first.';
        st.ready[si] = true;
        if (st.ready.every(Boolean)) newHand();
        else st.msg = `${nm(si)} is ready for the next hand. Waiting for ${nm(1 - si)}.`;
        break;
      }
      default: return 'Unknown move.';
    }
    broadcast(); return null;
  }
  function start(){ newHand(); broadcast(); }
  return {apply, start, snapshotFor, get table(){ return T; }};
}

/* ----------------------------------------------------- PAIRING CODES --- */
function b64(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s){ const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
async function pipe(bytes, stream){ const rs = new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(rs).arrayBuffer()); }
async function encodeCode(obj){
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function'){ try { return CODE_TAG + 'Z' + b64(await pipe(raw, new CompressionStream('deflate'))); } catch (e) {} }
  return CODE_TAG + 'P' + b64(raw);
}
async function decodeCode(text, kind){
  const s = String(text || '').replace(/\s+/g, '');
  if (!s) throw new Error('Paste the code first.');
  if (s.length > MAX_CODE_CHARS || s.indexOf(CODE_TAG) !== 0) throw new Error('That does not look like a table code.');
  const flag = s.charAt(CODE_TAG.length);
  let bytes;
  try { bytes = unb64(s.slice(CODE_TAG.length + 1)); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  if (flag === 'Z'){
    if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot read that code. Try a current Chrome, Edge, Firefox or Safari.');
    try { bytes = await pipe(bytes, new DecompressionStream('deflate')); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  } else if (flag !== 'P') throw new Error('That does not look like a table code.');
  let o; try { o = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  if (!o || typeof o.s !== 'string' || o.s.indexOf('v=0') !== 0) throw new Error('That does not look like a table code.');
  if (o.v !== PROTO) throw new Error('Your games are different versions. Both players should reload the page and try again.');
  if (o.k !== kind) throw new Error(kind === 'o' ? 'That is an answer code. Paste the code the host sent you.' : 'That is a host code. Paste the answer code your friend sent back.');
  return o;
}
function waitIce(pc){
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    let done = false;
    const fin = () => { if (done) return; done = true; clearTimeout(t); pc.removeEventListener('icegatheringstatechange', chk); res(); };
    const chk = () => { if (pc.iceGatheringState === 'complete') fin(); };
    const t = setTimeout(fin, ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener('icegatheringstatechange', chk);
  });
}

/* ------------------------------------------------------------ SESSION --- */
let S = null;          // the open screen/session
let root = null;       // #mpc-root

function newSession(){
  return {role: null, view: 'menu', pc: null, dc: null, open: false, ended: false, host: null, snap: null,
    offer: '', answer: '', err: '', busy: false, hint: '', peer: 'your friend', lastSeen: 0,
    timers: [], ui: {hand: -1, picks: [], sel: null, bid: 0}, rl: {sec: 0, n: 0}, shownHand: -1};
}
const later = (fn, ms) => { const id = setTimeout(fn, ms); if (S) S.timers.push(id); return id; };
const every = (fn, ms) => { const id = setInterval(fn, ms); if (S) S.timers.push(id); return id; };

function send(o){ try { if (S && S.dc && S.dc.readyState === 'open') S.dc.send(JSON.stringify(o)); } catch (e) {} }

function makePC(){
  const pc = new window.RTCPeerConnection({iceServers: STUN_URLS.length ? [{urls: STUN_URLS}] : []});
  const watch = () => {
    const a = pc.connectionState, b = pc.iceConnectionState;
    if (a === 'failed' || b === 'failed') lost('The connection failed. Your networks may block direct play. Try both players on the same network.');
  };
  pc.addEventListener('connectionstatechange', watch);
  pc.addEventListener('iceconnectionstatechange', watch);
  return pc;
}
function wireDC(dc){
  S.dc = dc;
  dc.onopen = onOpen;
  dc.onmessage = onMessage;
  dc.onclose = () => lost(`The connection to ${S ? S.peer : 'your friend'} closed.`);
  dc.onerror = () => lost('The connection dropped.');
}
function onOpen(){
  if (!S || S.ended) return;
  S.open = true; S.lastSeen = Date.now(); S.view = 'table'; S.err = '';
  every(() => {
    if (!S || S.ended) return;
    send({t: 'ping'});
    if (Date.now() - S.lastSeen > PEER_TIMEOUT_MS) lost(`No word from ${S.peer} for ${Math.round(PEER_TIMEOUT_MS / 1000)} seconds. The table is closed.`);
  }, HEARTBEAT_MS);
  if (S.role === 'guest') send({t: 'hello', v: PROTO, name: myName('Guest')});
  render();
}
function onMessage(ev){
  if (!S || S.ended || typeof ev.data !== 'string' || ev.data.length > MAX_MSG_CHARS) return;
  let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
  if (!m || typeof m.t !== 'string') return;
  S.lastSeen = Date.now();
  if (m.t === 'ping') return;
  if (m.t === 'bye') return lost(m.why === 'version' ? 'Your games are different versions. Both players should reload the page and try again.' : `${S.peer} left the table.`);
  if (S.role === 'host'){
    if (m.t === 'hello'){
      if (S.host) return;
      if (m.v !== PROTO){ send({t: 'bye', why: 'version'}); return lost('Your games are different versions. Both players should reload the page and try again.'); }
      S.peer = cleanName(m.name, 'Guest');
      S.host = createTable([myName('Host'), S.peer], (viewer, snap) => {
        if (viewer === 1) send(snap); else takeSnap(snap);
      });
      S.host.start();
      return;
    }
    if (m.t === 'act' && S.host){
      const sec = Math.floor(Date.now() / 1000);
      if (S.rl.sec !== sec){ S.rl.sec = sec; S.rl.n = 0; }
      if (++S.rl.n > MAX_ACTS_PER_SEC) return;
      const why = S.host.apply(1, m.a);
      if (why) send({t: 'nope', why: String(why)});
    }
    return;
  }
  // guest
  if (m.t === 'state'){
    if (m.v !== PROTO || m.you !== 1 || !Array.isArray(m.seats) || m.seats.length !== 2 || !Array.isArray(m.pool)) return;
    if (S.snap && num(m.seq) <= num(S.snap.seq)) return;
    S.peer = cleanName(m.seats[0] && m.seats[0].name, 'the host');
    takeSnap(m);
  } else if (m.t === 'nope'){ S.hint = String(m.why || 'Not allowed.').slice(0, 200); sfx('nope'); render(); }
}
// a fresh snapshot arrived (host: from its own table; guest: over the wire): play its sounds once, then draw
function takeSnap(sn){
  S.snap = sn;
  for (const n of (Array.isArray(sn.fx) ? sn.fx.slice(0, 6) : [])) if (typeof n === 'string') sfx(n);
  if (sn.phase === 'done' && sn.show && Array.isArray(sn.show.winners) && S.shownHand !== sn.hand){ S.shownHand = sn.hand; sfx(sn.show.winners.indexOf(sn.you) >= 0 ? 'win' : 'down'); }
  render();
}
function act(a){
  if (!S || !S.open) return;
  S.hint = '';
  if (S.role === 'host'){ if (!S.host) return; const why = S.host.apply(0, a); if (why){ S.hint = why; sfx('nope'); render(); } }
  else send({t: 'act', a});
}

/* ---- start / stop ---- */
async function hostStart(){
  S.role = 'host'; S.view = 'host'; S.busy = true; S.err = ''; render();
  try {
    const pc = S.pc = makePC();
    wireDC(pc.createDataChannel(DC_LABEL, {ordered: true}));
    await pc.setLocalDescription(await pc.createOffer());
    await waitIce(pc);
    if (!S || S.pc !== pc) return;
    S.offer = await encodeCode({k: 'o', v: PROTO, s: pc.localDescription.sdp});
  } catch (e) { if (S) S.err = 'Could not make a table code in this browser.'; }
  if (S){ S.busy = false; render(); }
}
async function hostAccept(text){
  if (!S || !S.pc || S.busy) return;
  S.err = '';
  try {
    const o = await decodeCode(text, 'a');
    await S.pc.setRemoteDescription({type: 'answer', sdp: o.s});
    S.view = 'connecting'; render();
    later(() => { if (S && !S.open && !S.ended) lost('Could not connect. Check both codes were copied in full, or try both players on the same network.'); }, CONNECT_TIMEOUT_MS);
  } catch (e) { if (S){ S.err = e && e.message ? e.message : 'That answer code did not work.'; render(); } }
}
async function guestAnswer(text){
  if (!S || S.busy) return;
  S.role = 'guest'; S.err = ''; S.busy = true; render();
  try {
    const o = await decodeCode(text, 'o');
    if (S.pc) try { S.pc.close(); } catch (e) {}
    const pc = S.pc = makePC();
    pc.ondatachannel = ev => { if (S && S.pc === pc && ev.channel.label === DC_LABEL) wireDC(ev.channel); };
    await pc.setRemoteDescription({type: 'offer', sdp: o.s});
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce(pc);
    if (!S || S.pc !== pc) return;
    S.answer = await encodeCode({k: 'a', v: PROTO, s: pc.localDescription.sdp});
  } catch (e) { if (S) S.err = e && e.message ? e.message : 'That host code did not work.'; }
  if (S){ S.busy = false; render(); }
}
function teardown(){
  if (!S) return;
  S.ended = true;
  for (const id of S.timers){ clearTimeout(id); clearInterval(id); }
  S.timers = [];
  if (S.dc){ S.dc.onopen = S.dc.onmessage = S.dc.onclose = S.dc.onerror = null; try { S.dc.close(); } catch (e) {} }
  if (S.pc){ try { S.pc.close(); } catch (e) {} }
  S.dc = S.pc = null; S.open = false; S.host = null;
}
function lost(msg){
  if (!S || S.ended) return;
  teardown();
  S.view = 'ended'; S.err = msg; sfx('down'); render();
  const mine = S;
  setTimeout(() => { if (S === mine) closeScreen(); }, RETURN_AFTER_MS);
}
function leave(){ if (S && S.open) send({t: 'bye', why: 'left'}); closeScreen(); }
function closeScreen(){
  teardown(); S = null;
  if (root){ root.remove(); root = null; }
  try {
    const H = window.TAVERN;
    if (H && typeof H.returnFromGame === 'function') H.returnFromGame();
    else if (H && typeof H.enter === 'function') H.enter();
  } catch (e) {}
}
function openScreen(){
  if (S) return;
  injectStyle();
  S = newSession();
  root = document.createElement('div'); root.id = 'mpc-root'; root.className = 'mpc-root';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Crepitus with a friend');
  root.addEventListener('click', onClick);
  document.body.appendChild(root);
  render();
}

/* -------------------------------------------------------------- RENDER --- */
function render(){
  if (!root || !S) return;
  const keep = {};
  root.querySelectorAll('textarea[data-keep]').forEach(t => { keep[t.id] = t.value; });
  root.innerHTML = '<div class="mpc-wrap">' + (S.view === 'table' ? viewTable() : viewPairing()) + '</div>';
  for (const id in keep){ const t = root.querySelector('#' + id); if (t && !t.value) t.value = keep[id]; }
}
const btn = (a, label, o) => { o = o || {}; return `<button type="button" class="mpc-btn${o.main ? ' mpc-main' : ''}" data-a="${a}"${o.x != null ? ` data-x="${h(o.x)}"` : ''}${o.off ? ' disabled' : ''}>${label}</button>`; };
const err = () => (S.err ? `<p class="mpc-err" role="alert">${h(S.err)}</p>` : '');
function viewPairing(){
  const head = `<div class="mpc-top"><h2>Crepitus with a friend</h2>${btn('leave', 'Back to the tavern')}</div>`;
  if (S.view === 'menu') return head +
    `<p>Play Crepitus against one friend in another browser. One of you hosts, the other joins. You swap two codes (by chat, email or text) and the table opens.</p>
     <p class="mpc-dim">No real gold changes hands: each player sits down with a table purse of ${TABLE_PURSE} coins. Prototype.</p>
     <div class="mpc-btns">${btn('host', 'Host a table', {main: true})}${btn('join', 'Join a table')}</div>`;
  if (S.view === 'host') return head +
    `<h3>1. Send this code to your friend</h3>
     ${S.busy ? '<p class="mpc-dim" aria-live="polite">Making your code...</p>' : `<textarea id="mpc-offer" class="mpc-code" readonly aria-label="Your table code">${h(S.offer)}</textarea>${btn('copy', 'Copy code', {x: 'mpc-offer'})}`}
     <h3>2. Paste the answer code your friend sends back</h3>
     <textarea id="mpc-ans-in" data-keep="1" class="mpc-code" aria-label="Answer code from your friend" placeholder="Paste the answer code here"></textarea>
     ${err()}<div class="mpc-btns">${btn('accept', 'Open the table', {main: true, off: S.busy || !S.offer})}</div>
     <p class="mpc-hint" aria-live="polite">${h(S.hint)}</p>`;
  if (S.view === 'join') return head +
    `<h3>1. Paste the code the host sent you</h3>
     <textarea id="mpc-off-in" data-keep="1" class="mpc-code" aria-label="Code from the host" placeholder="Paste the host's code here"></textarea>
     ${S.answer ? '' : `<div class="mpc-btns">${btn('answer', S.busy ? 'Working...' : 'Make my answer code', {main: true, off: S.busy})}</div>`}
     ${err()}
     ${S.answer ? `<h3>2. Send this answer code back to the host</h3>
       <textarea id="mpc-answer" class="mpc-code" readonly aria-label="Your answer code">${h(S.answer)}</textarea>${btn('copy', 'Copy code', {x: 'mpc-answer'})}
       <p class="mpc-dim" aria-live="polite">Waiting for the host to paste it. Keep this page open.</p>` : ''}
     <p class="mpc-hint" aria-live="polite">${h(S.hint)}</p>`;
  if (S.view === 'connecting') return head + '<p aria-live="polite">Connecting to your friend...</p>' + err();
  if (S.view === 'ended') return `<div class="mpc-top"><h2>Table closed</h2></div><p class="mpc-err" role="alert">${h(S.err || 'The table is closed.')}</p>
     <p class="mpc-dim">No gold was touched. Returning to the tavern shortly.</p><div class="mpc-btns">${btn('leave', 'Back to the tavern', {main: true})}</div>`;
  return head;
}
const dieHtml = (d, o) => {
  o = o || {}; const lvl = Math.max(0, Math.min(6, num(d.lvl) | 0)), col = LEVEL_COLOURS[lvl];
  const inner = `<b>${h(num(d.v))}</b><small>L${lvl}</small>${o.badge ? `<i class="mpc-badge">${h(o.badge)}</i>` : ''}`;
  return o.a ? `<button type="button" class="mpc-die${o.sel ? ' mpc-sel' : ''}" style="--c:${col}" data-a="${o.a}" data-x="${h(o.x)}" aria-pressed="${o.sel ? 'true' : 'false'}" aria-label="Level ${lvl} die showing ${h(num(d.v))}">${inner}</button>`
    : `<span class="mpc-die" style="--c:${col}">${inner}</span>`;
};
const backs = n => Array.from({length: Math.max(0, Math.min(7, n | 0))}, () => '<span class="mpc-die mpc-back" aria-hidden="true">?</span>').join('');
function bidPlan(sn){
  const b = sn.bounty, die = S.ui.sel != null ? S.ui.sel : (b ? b.die : null);
  if (die == null) return null;
  const total = S.ui.bid || (b ? (b.die === die ? 1 : b.total + 1) : 1);
  return {die, total, reinforce: !!(b && b.die === die)};
}
function viewTable(){
  const sn = S.snap, top = `<div class="mpc-top"><h2>Crepitus with ${h(S.peer)}</h2><span class="mpc-tag">${S.role === 'host' ? 'You host' : 'You joined'}</span>${btn('leave', 'Leave the table')}</div>`;
  if (!sn) return top + '<p aria-live="polite">Connected. Setting up the table...</p>';
  const me = sn.you, op = 1 - me, M = sn.seats[me], O = sn.seats[op], u = S.ui;
  if (u.hand !== sn.hand){ S.ui = {hand: sn.hand, picks: [], sel: null, bid: 0}; }
  if (sn.phase !== 'hunt'){ S.ui.sel = null; S.ui.bid = 0; }
  if (S.ui.sel != null && !sn.pool.some(d => d.id === S.ui.sel)) S.ui.sel = null;
  const myTurn = sn.phase === 'hunt' && sn.turn === me;
  const seatHead = (s, i, who) => `<div class="mpc-seathead"><b>${h(s.name)}</b>${who}<span>Purse ${h(s.purse)}</span>${sn.dealer === i ? '<span class="mpc-tag">Dealer</span>' : ''}${sn.phase === 'hunt' && sn.turn === i ? '<span class="mpc-tag mpc-turn">Their turn</span>' : ''}${s.state ? `<span class="mpc-dim">${h(s.state)}</span>` : ''}</div>`;
  let html = top + `<p class="mpc-msg" aria-live="polite">${h(sn.msg)}</p>${S.hint ? `<p class="mpc-hint" role="alert">${h(S.hint)}</p>` : ''}`;
  // opponent
  const oDice = sn.phase === 'done' && O.kept ? O.kept.map((v, k) => dieHtml(O.hid && O.hid[k] ? O.hid[k] : {lvl: 0, v})).join('') : backs(O.dice);
  html += `<section class="mpc-seat">${seatHead(O, op, '')}<div class="mpc-dice">${O.out ? '<span class="mpc-dim">Sits out</span>' : oDice}</div></section>`;
  // community
  const b = sn.bounty;
  html += `<section class="mpc-pool"><div class="mpc-seathead"><b>Community dice</b>${sn.phase === 'hunt' ? `<span class="mpc-tag">Hunt ${h(sn.hunt)}</span>` : ''}<span>Pot ${h(sn.pot)}</span>${b ? `<span>Bounty ${h(b.total)} (${h(sn.seats[b.owner] ? sn.seats[b.owner].name : '')})</span>` : ''}</div><div class="mpc-dice">`;
  if (sn.phase === 'discard') html += sn.cup ? `<span class="mpc-dim">${plural(sn.cup, 'die')} in the cup</span>` : '<span class="mpc-dim">The cup is empty</span>';
  else html += sn.pool.map(d => dieHtml(d, {a: myTurn ? 'die' : '', x: d.id, sel: S.ui.sel === d.id, badge: b && b.die === d.id ? b.total : ''})).join('');
  html += '</div></section>';
  // me
  let mine = '';
  if (M.out) mine = '<span class="mpc-dim">You sit out this hand</span>';
  else if (sn.phase === 'discard' && !M.discarded && M.hid) mine = M.hid.map((d, i) => dieHtml(d, {a: 'pick', x: i, sel: S.ui.picks.indexOf(i) >= 0})).join('');
  else if (M.hid) mine = M.hid.map(d => dieHtml(d)).join('');
  html += `<section class="mpc-seat mpc-me">${seatHead(M, me, ' <span class="mpc-dim">(you)</span>')}<div class="mpc-dice">${mine}</div></section>`;
  // controls
  html += '<section class="mpc-ctl">';
  if (sn.over) html += `<p>${h(sn.over)}</p><div class="mpc-btns">${btn('leave', 'Back to the tavern', {main: true})}</div>`;
  else if (sn.phase === 'discard'){
    if (M.out) html += `<p>Waiting for ${h(O.name)}.</p>`;
    else if (!M.discarded){
      const canRe = M.rerolls < sn.rerollMax && M.purse >= sn.buyin;
      html += `<p>Pick 2 dice to throw into the community cup (${S.ui.picks.length} of 2 picked).</p><div class="mpc-btns">${btn('throw', 'Throw these 2 in', {main: true, off: S.ui.picks.length !== 2})}${canRe ? btn('reroll', `Pay ${sn.buyin} to reroll all`) : ''}</div>`;
    } else html += `<p>Waiting for ${h(O.name)} to discard.</p>`;
  } else if (sn.phase === 'hunt'){
    if (myTurn){
      const p = bidPlan(sn);
      const say = !p ? 'Click a community die, add coins, then bid. Or pass.' : p.reinforce ? `Add ${p.total} to the bounty on that die.` : `Bid ${p.total} on the level ${(sn.pool.find(d => d.id === p.die) || {}).lvl} die${sn.bounty ? ` (at least ${sn.bounty.total + 1} to move the bounty)` : ''}.`;
      html += `<p>Your turn. You have ${h(M.purse)} coins. ${h(say)}${S.ui.bid ? ` (coins chosen: ${S.ui.bid})` : ''}</p><div class="mpc-btns">` +
        COINS.map(([n, v]) => btn('add', `+${v} ${n}`, {x: v})).join('') + btn('clear', 'Clear') +
        btn('bid', p && p.reinforce ? 'Add to bounty' : 'Bid', {main: true, off: !p}) + btn('pass', 'Pass') + '</div>';
    } else html += `<p>Waiting for ${h(O.name)}.</p>`;
  } else if (sn.phase === 'done' && sn.show){
    const res = sn.show.results.map(r => `<li>${h(sn.seats[r.seat] ? sn.seats[r.seat].name : '?')}: ${h(r.name)}${sn.show.winners.indexOf(r.seat) >= 0 ? ' (wins)' : ''}</li>`).join('');
    html += `<p>Final community dice: ${sn.show.com.map(v => h(v)).join(', ')}. Pot ${h(sn.show.pot)}.</p><ul class="mpc-res">${res}</ul>` +
      (sn.ready[me] ? `<p class="mpc-dim">Waiting for ${h(O.name)} to deal again.</p>` : `<div class="mpc-btns">${btn('next', 'Deal again', {main: true})}</div>`);
  }
  return html + '</section>';
}

/* -------------------------------------------------------------- CLICKS --- */
function onClick(ev){
  const el = ev.target.closest('[data-a]'); if (!el || !root || !root.contains(el) || el.disabled || !S) return;
  const a = el.getAttribute('data-a'), x = el.getAttribute('data-x');
  const val = id => { const t = root.querySelector('#' + id); return t ? t.value : ''; };
  switch (a){
    case 'leave': sfx('pick'); return leave();
    case 'host': sfx('pick'); return hostStart();
    case 'join': sfx('pick'); S.view = 'join'; S.role = 'guest'; return render();
    case 'accept': return hostAccept(val('mpc-ans-in'));
    case 'answer': return guestAnswer(val('mpc-off-in'));
    case 'copy': return copyCode(x);
  }
  if (!S.open || !S.snap) return;
  const sn = S.snap, me = sn.you;
  switch (a){
    case 'pick': { const i = parseInt(x, 10), k = S.ui.picks.indexOf(i); if (k >= 0) S.ui.picks.splice(k, 1); else { S.ui.picks.push(i); if (S.ui.picks.length > 2) S.ui.picks.shift(); } sfx('pick'); return render(); }
    case 'throw': if (S.ui.picks.length === 2){ const [i, j] = S.ui.picks; S.ui.picks = []; act({type: 'discard', i, j}); } return;
    case 'reroll': S.ui.picks = []; return act({type: 'reroll'});
    case 'die': if (sn.phase === 'hunt' && sn.turn === me){ S.ui.sel = parseInt(x, 10); sfx('pick'); render(); } return;
    case 'add': S.ui.bid = Math.max(0, Math.min(num(sn.seats[me].purse), (S.ui.bid || 0) + (parseInt(x, 10) || 0))); sfx('coin'); return render();
    case 'clear': S.ui.bid = 0; return render();
    case 'bid': { const p = bidPlan(sn); if (!p){ S.hint = 'Click a community die first.'; return render(); } S.ui.bid = 0; return act({type: 'bid', die: p.die, total: p.total}); }
    case 'pass': return act({type: 'pass'});
    case 'next': return act({type: 'next'});
  }
}
async function copyCode(id){
  const t = root && root.querySelector('#' + id); if (!t) return;
  let ok = false;
  try { if (navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(t.value); ok = true; } } catch (e) {}
  if (!ok){ try { t.focus(); t.select(); ok = document.execCommand('copy'); } catch (e) {} }
  if (S){ S.hint = ok ? 'Copied. Paste it into a message to your friend.' : 'Select the code and copy it by hand (Ctrl+C).'; render(); }
}

/* --------------------------------------------------------------- STYLE --- */
function injectStyle(){
  if (document.getElementById('mpc-style')) return;
  const st = document.createElement('style'); st.id = 'mpc-style';
  st.textContent = `
.mpc-root{position:fixed;inset:0;z-index:${Z_SCREEN};overflow:auto;background:rgba(18,14,10,.97);color:#ecdfc6;font-size:15px;line-height:1.45;font-family:inherit}
.mpc-wrap{max-width:760px;margin:0 auto;padding:16px}
.mpc-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px}.mpc-top h2{flex:1;margin:0;font-size:20px}
.mpc-root h3{font-size:15px;margin:14px 0 6px}
.mpc-btns{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.mpc-btn{background:#3b2f24;color:#f3e6cc;border:1px solid #7a6247;border-radius:6px;padding:8px 12px;font:inherit;cursor:pointer;min-height:40px}
.mpc-btn:hover{background:#4a3b2c}.mpc-btn:disabled{opacity:.45;cursor:default}
.mpc-main{background:#7a4b1e;border-color:#c08a4a}.mpc-main:hover{background:#8c5a26}
.mpc-btn:focus-visible,.mpc-die:focus-visible,.mpc-code:focus-visible{outline:3px solid #ffd27a;outline-offset:2px}
.mpc-code{width:100%;box-sizing:border-box;height:84px;font:14px/1.3 monospace;background:#0e0b08;color:#d9ccb3;border:1px solid #5d4b38;border-radius:6px;padding:6px;word-break:break-all;margin-bottom:6px}
.mpc-msg{background:#2a2119;border-left:4px solid #c08a4a;padding:8px 10px;border-radius:4px;margin:6px 0}
.mpc-hint{color:#ffd27a;min-height:1em;margin:4px 0}.mpc-err{color:#ff8a80}.mpc-dim{color:#b3a58c}
.mpc-tag{background:#3b2f24;border:1px solid #7a6247;border-radius:10px;padding:1px 8px;font-size:14px}.mpc-turn{background:#7a4b1e}
.mpc-seat,.mpc-pool,.mpc-ctl{background:#211a14;border:1px solid #4a3b2c;border-radius:8px;padding:8px 10px;margin:8px 0}
.mpc-me{border-color:#c08a4a}
.mpc-seathead{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}
.mpc-dice{display:flex;flex-wrap:wrap;gap:6px;min-height:46px;align-items:center}
.mpc-die{position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:44px;border-radius:8px;background:var(--c,#999);color:#15110c;border:2px solid rgba(0,0,0,.35);font:inherit;padding:0;box-sizing:border-box}
button.mpc-die{cursor:pointer}.mpc-die b{font-size:17px;line-height:1}.mpc-die small{font-size:14px;opacity:.8}
.mpc-sel{border-color:#fff;box-shadow:0 0 0 3px #ffd27a}
.mpc-back{background:#3b2f24;color:#b3a58c;border-color:#5d4b38}
.mpc-badge{position:absolute;top:-8px;right:-8px;background:#ffd27a;color:#2a2119;border-radius:9px;font:bold 14px/18px sans-serif;min-width:18px;text-align:center;font-style:normal}
.mpc-res{margin:4px 0 8px 18px;padding:0}
#mpc-entry{position:fixed;left:12px;bottom:12px;z-index:${Z_ENTRY}}
@media (max-width:420px){.mpc-wrap{padding:10px}.mpc-die{width:40px;height:40px}}`;
  document.head.appendChild(st);
}

/* --------------------------------------------------------- ENTRY POINT --- */
// A button outside #tavern-hub (its render() wipes its own contents), shown only while the hub is open.
let entry = null;
function installEntry(){
  if (!document.body) return;
  injectStyle();
  entry = document.createElement('button');
  entry.type = 'button'; entry.id = 'mpc-entry'; entry.className = 'mpc-btn mpc-main'; entry.textContent = 'Play a friend online';
  entry.style.display = 'none';
  entry.addEventListener('click', () => {
    if (S) return;
    try { if (window.TAVERN && typeof window.TAVERN.leave === 'function') window.TAVERN.leave(); } catch (e) {}
    entry.style.display = 'none';
    openScreen();
  });
  document.body.appendChild(entry);
  setInterval(() => {
    const hub = document.getElementById(HUB_ID);
    const show = !S && !!hub && !hub.classList.contains('hidden');
    entry.style.display = show ? '' : 'none';
  }, ENTRY_POLL_MS);
}
window.addEventListener('pagehide', () => { if (S && S.open) send({t: 'bye', why: 'left'}); });
if (document.body) installEntry(); else document.addEventListener('DOMContentLoaded', installEntry);

/* ------------------------------------------------------------ SELF-TEST --- */
// Plays n hands between two random bots using ONLY the snapshots, and checks no snapshot to a seat
// carries the other seat's dice before showdown. Touches no DOM, network or storage.
function selfTest(n){
  n = Math.max(1, Math.min(1000, n | 0 || 20));
  const last = [null, null]; let leaks = 0, snaps = 0, refused = 0, steps = 0, coinErrors = 0;
  const core = createTable(['Bot A', 'Bot B'], (v, sn) => {
    snaps++; last[v] = JSON.parse(JSON.stringify(sn));
    const o = sn.seats[1 - v];
    if (sn.phase !== 'done' && ('hid' in o || 'kept' in o)) leaks++;
    const held = sn.seats[0].purse + sn.seats[1].purse + (sn.phase === 'done' ? 0 : sn.pot);
    if (held !== 2 * TABLE_PURSE) coinErrors++;                                         // no coins made or lost
  });
  core.start();
  const pickMove = v => {
    const sn = last[v], me = sn.seats[v];
    if (sn.phase === 'discard' && !me.out && !me.discarded) return Math.random() < 0.1 ? {type: 'reroll'} : {type: 'discard', i: 0, j: 1 + (Math.random() * 6 | 0)};
    if (sn.phase === 'hunt' && sn.turn === v){
      if (Math.random() < 0.4 || me.purse < 1) return {type: 'pass'};
      const d = sn.pool[Math.random() * sn.pool.length | 0], b = sn.bounty;
      return {type: 'bid', die: d.id, total: b ? (b.die === d.id ? 1 : b.total + 1) : 1};
    }
    if (sn.phase === 'done' && !sn.ready[v]) return {type: 'next'};
    return null;
  };
  while (core.table.hand <= n && steps < n * 400){
    steps++;
    if (last[0].over) break;
    for (const v of [0, 1]){ const mv = pickMove(v); if (mv && core.apply(v, mv)) refused++; }
    if (core.apply(steps % 2, {type: 'bid', die: -1, total: 1}) === null) leaks += 1000;   // junk input must be refused
  }
  return {hands: core.table.hand, snapshots: snaps, leaks, coinErrors, refusedRandomMoves: refused, closedEarly: !!last[0].over, purses: core.table.seats.map(s => s.purse)};
}

window.MP_CREPITUS = {version: PROTO, open: openScreen, close: leave, selfTest};
})();
