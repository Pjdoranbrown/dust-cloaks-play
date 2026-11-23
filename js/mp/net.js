/* ============================================================================
   INDEX MPNET1 - the co-op pairing layer (Fable job 7 phase 3, docs/coop-seats.md
   section 2 step 3, audits/fable/coop.md). Loads after js/combat/ally.js; no engine calls.
   A star of WebRTC data channels: the host holds up to three guest slots (seats
   1 to 3), each paired by pasted codes (host code out, answer code back; the
   same shape as js/mp/crepitus.js, tag DCCO1, protocol coop1). No relay, no
   server: the relay is a Patrick question (recommended: pasted codes first).
   Heartbeats every 2 s; 20 s of silence drops a slot; a dropped guest has
   60 s (COOP.REJOIN_WINDOW_S) to pair again with its rejoin token before the
   seat is the host's for good. The transport is behind three slot callbacks
   (_open, _text, _close) so the state machine runs in a self-test with fake
   channels and no RTC.
   API: MPNET.host(cb) -> H {slots, offerFor(seat), accept(seat, code), send(seat, o),
        broadcast(o), drop(seat), close(), tick()}; cb {onJoin(seat, hello), onRejoin(seat, hello),
        onMessage(seat, m), onDrop(seat), onLeave(seat)}.
        MPNET.guest(cb) -> Gst {answer(hostCode), send(o), close(), token, seat, status};
        cb {onWelcome(seat), onMessage(m), onLost(why)}.
        MPNET.encode(o) / decode(text, kind) (async), MPNET.token(), MPNET.selfTest() (async).
   ROLLBACK: remove this script tag (js/mp/coop.js then stays off).
============================================================================ */
(function(){
'use strict';
const MPNET = window.MPNET = {
  version: 1,
  PROTO: 'coop1',
  CODE_TAG: 'DCCO1',
  DC_LABEL: 'coop',
  STUN_URLS: ['stun:stun.l.google.com:19302'],
  ICE_GATHER_TIMEOUT_MS: 5000,
  CONNECT_TIMEOUT_MS: 25000,
  HEARTBEAT_MS: 2000,
  PEER_TIMEOUT_MS: 20000,
  REJOIN_WINDOW_MS: 60000,
  MAX_MSG_CHARS: 65536,
  MAX_CODE_CHARS: 20000,
  MAX_MSGS_PER_SEC: 20,      // a guest's messages the host reads a second
  MAX_HOST_MSGS_PER_SEC: 60, // the host's messages a guest reads a second (snapshots at 10 Hz, lobby, debrief)
  MAX_SEATS: 3,
  TOKEN_CHARS: 12,
  now: () => Date.now(),
  log: []
};
const logIt = (what, o) => { MPNET.log.push(Object.assign({t: MPNET.now(), what}, o || {})); if (MPNET.log.length > 200) MPNET.log.shift(); };

/* ---- codes ------------------------------------------------------------------ */
function b64(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s){ const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
async function pipe(bytes, stream){ const rs = new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(rs).arrayBuffer()); }
MPNET.encode = async function(obj){
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function'){ try { return MPNET.CODE_TAG + 'Z' + b64(await pipe(raw, new CompressionStream('deflate'))); } catch (e) {} }
  return MPNET.CODE_TAG + 'P' + b64(raw);
};
MPNET.decode = async function(text, kind){
  const TAG = MPNET.CODE_TAG, s = String(text || '').replace(/\s+/g, '');
  if (!s) throw new Error('Paste the code first.');
  if (s.length > MPNET.MAX_CODE_CHARS || s.indexOf(TAG) !== 0) throw new Error(s.indexOf('DCMP') === 0 ? 'That is a Crepitus table code, not a march code.' : 'That does not look like a march code.');
  const flag = s.charAt(TAG.length);
  let bytes;
  try { bytes = unb64(s.slice(TAG.length + 1)); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  if (flag === 'Z'){
    if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot read that code. Try a current Chrome, Edge, Firefox or Safari.');
    try { bytes = await pipe(bytes, new DecompressionStream('deflate')); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  } else if (flag !== 'P') throw new Error('That does not look like a march code.');
  let o; try { o = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { throw new Error('The code is damaged. Copy it again, all of it.'); }
  if (!o || typeof o.s !== 'string' || o.s.indexOf('v=0') !== 0) throw new Error('That does not look like a march code.');
  if (o.v !== MPNET.PROTO) throw new Error('Your games are different versions. Both players should reload the page and try again.');
  if (o.k !== kind) throw new Error(kind === 'o' ? 'That is an answer code. Paste the code the host sent you.' : 'That is a host code. Paste the answer code your friend sent back.');
  return o;
};
MPNET.token = function(){
  const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = '';
  const r = new Uint8Array(MPNET.TOKEN_CHARS); if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else for (let i = 0; i < r.length; i++) r[i] = Math.random() * 256 | 0;
  for (let i = 0; i < r.length; i++) s += A[r[i] % A.length];
  return s;
};
const tokenOk = t => typeof t === 'string' && t.length === MPNET.TOKEN_CHARS && /^[a-z0-9]+$/.test(t);

/* ---- RTC ---------------------------------------------------------------------- */
function waitIce(pc){
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    let done = false;
    const fin = () => { if (done) return; done = true; clearTimeout(t); pc.removeEventListener('icegatheringstatechange', chk); res(); };
    const chk = () => { if (pc.iceGatheringState === 'complete') fin(); };
    const t = setTimeout(fin, MPNET.ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener('icegatheringstatechange', chk);
  });
}
function makePC(onFail){
  const pc = new window.RTCPeerConnection({iceServers: MPNET.STUN_URLS.length ? [{urls: MPNET.STUN_URLS}] : []});
  const watch = () => { if (pc.connectionState === 'failed' || pc.iceConnectionState === 'failed') onFail('The connection failed. Your networks may block direct play; try both players on the same network.'); };
  pc.addEventListener('connectionstatechange', watch); pc.addEventListener('iceconnectionstatechange', watch);
  return pc;
}
const closeQuiet = x => { try { if (x) x.close(); } catch (e) {} };
const parse = (text) => { if (typeof text !== 'string' || text.length > MPNET.MAX_MSG_CHARS) return null; try { const m = JSON.parse(text); return m && typeof m.t === 'string' ? m : null; } catch (e) { return null; } };
function rateOk(r, cap){ const sec = Math.floor(MPNET.now() / 1000); if (r.sec !== sec){ r.sec = sec; r.n = 0; } return ++r.n <= (cap || MPNET.MAX_MSGS_PER_SEC); }

/* ---- the host: a star of slots ----------------------------------------------------- */
MPNET.host = function(cb, o){
  cb = cb || {}; o = o || {};
  const H = {slots: [], closed: false, timers: [], fake: !!o.fake};
  for (let seat = 1; seat <= MPNET.MAX_SEATS; seat++) H.slots.push({seat, pc: null, dc: null, status: 'open', name: null, token: null, hello: null, lastSeen: 0, droppedAt: 0, rate: {sec: 0, n: 0}, err: ''});
  const slot = seat => H.slots[seat - 1] || null;
  const sendTo = (s, obj) => { try { if (s.dc && s.dc.readyState === 'open'){ s.dc.send(JSON.stringify(obj)); return true; } } catch (e) {} return false; };
  const unwire = s => { if (s.dc){ s.dc.onopen = s.dc.onmessage = s.dc.onclose = s.dc.onerror = null; } closeQuiet(s.dc); closeQuiet(s.pc); s.dc = null; s.pc = null; };
  /* the slot state machine, driven by the channel or by the self-test's fakes */
  H._open = function(s){ if (H.closed) return; s.lastSeen = MPNET.now(); s.err = ''; logIt('open', {seat: s.seat}); };
  H._text = function(s, text){
    if (H.closed) return;
    const m = parse(text); if (!m || !rateOk(s.rate)) return;
    s.lastSeen = MPNET.now();
    if (m.t === 'hello'){
      if (m.v !== MPNET.PROTO){ sendTo(s, {t: 'bye', why: 'version'}); H._close(s, 'version'); return; }
      s.hello = m; s.name = String(m.name || 'Guest').slice(0, 24);
      const rejoin = s.status === 'dropped' && tokenOk(m.token) && m.token === s.token;
      if (!rejoin) s.token = MPNET.token();
      s.status = 'connected'; s.droppedAt = 0;
      sendTo(s, {t: 'welcome', seat: s.seat, token: s.token, rejoin});
      logIt(rejoin ? 'rejoin' : 'join', {seat: s.seat, name: s.name});
      if (rejoin){ if (cb.onRejoin) cb.onRejoin(s.seat, m); } else if (cb.onJoin) cb.onJoin(s.seat, m);
      return;
    }
    if (m.t === 'ping') return;
    if (m.t === 'leave'){ H._close(s, 'left'); return; }
    if (s.status === 'connected' && cb.onMessage) cb.onMessage(s.seat, m);
  };
  H._close = function(s, why){
    if (H.closed) return;
    const was = s.status;
    unwire(s);
    if (why === 'left' || was === 'pairing' || was === 'open'){
      s.status = 'open'; s.token = null; s.name = null; s.hello = null; s.droppedAt = 0;
      logIt('left', {seat: s.seat, why});
      if (was === 'connected' && cb.onLeave) cb.onLeave(s.seat, 'left');
      return;
    }
    if (was === 'connected'){ s.status = 'dropped'; s.droppedAt = MPNET.now(); logIt('drop', {seat: s.seat, why}); if (cb.onDrop) cb.onDrop(s.seat, why); }
  };
  H.tick = function(){
    if (H.closed) return;
    const now = MPNET.now();
    for (const s of H.slots){
      if (s.status === 'connected'){ sendTo(s, {t: 'ping'}); if (now - s.lastSeen > MPNET.PEER_TIMEOUT_MS) H._close(s, 'timeout'); }
      else if (s.status === 'dropped' && now - s.droppedAt > MPNET.REJOIN_WINDOW_MS){ s.status = 'open'; const tok = s.token; s.token = null; logIt('takeover', {seat: s.seat}); if (cb.onLeave) cb.onLeave(s.seat, 'window', tok); }
    }
  };
  function wire(s, dc){
    s.dc = dc;
    dc.onopen = () => H._open(s);
    dc.onmessage = ev => H._text(s, ev.data);
    dc.onclose = () => H._close(s, 'closed');
    dc.onerror = () => H._close(s, 'error');
  }
  /* a host code for a seat (fresh pairing, or a rejoin code for a dropped seat: the token stays) */
  H.offerFor = async function(seat){
    const s = slot(seat); if (!s || H.closed) throw new Error('No such seat.');
    if (s.status === 'connected') throw new Error('That seat is taken.');
    unwire(s);
    if (s.status !== 'dropped') s.status = 'pairing';
    if (H.fake) return MPNET.encode({k: 'o', v: MPNET.PROTO, s: 'v=0 fake', seat});
    const pc = makePC(why => { s.err = why; if (s.status === 'pairing') H._close(s, 'failed'); });
    s.pc = pc; wire(s, pc.createDataChannel(MPNET.DC_LABEL));
    await pc.setLocalDescription(await pc.createOffer());
    await waitIce(pc);
    return MPNET.encode({k: 'o', v: MPNET.PROTO, s: pc.localDescription.sdp, seat});
  };
  H.accept = async function(seat, code){
    const s = slot(seat); if (!s || H.closed) throw new Error('No such seat.');
    const a = await MPNET.decode(code, 'a');
    if (a.seat !== seat) throw new Error(`That answer is for seat ${a.seat + 1}, not seat ${seat + 1}.`);
    if (H.fake) return true;
    if (!s.pc) throw new Error('Make a host code for this seat first.');
    await s.pc.setRemoteDescription({type: 'answer', sdp: a.s});
    const t = setTimeout(() => { if (s.status === 'pairing' || (s.status === 'dropped' && !(s.dc && s.dc.readyState === 'open'))){ s.err = 'No connection after 25 seconds. Make a fresh code and try again.'; if (s.status === 'pairing') H._close(s, 'failed'); } }, MPNET.CONNECT_TIMEOUT_MS);
    H.timers.push(t);
    return true;
  };
  H.send = (seat, obj) => { const s = slot(seat); return !!(s && s.status === 'connected' && sendTo(s, obj)); };
  H.broadcast = obj => { let n = 0; for (const s of H.slots) if (s.status === 'connected' && sendTo(s, obj)) n++; return n; };
  H.drop = seat => { const s = slot(seat); if (s){ sendTo(s, {t: 'bye', why: 'host'}); H._close(s, 'left'); } };
  H.connected = () => H.slots.filter(s => s.status === 'connected');
  H.close = function(){ if (H.closed) return; for (const s of H.slots){ sendTo(s, {t: 'bye', why: 'closed'}); unwire(s); s.status = 'open'; } H.closed = true; H.timers.forEach(clearTimeout); clearInterval(H.beat); logIt('host closed'); };
  if (!H.fake) H.beat = setInterval(H.tick, MPNET.HEARTBEAT_MS);
  return H;
};

/* ---- the guest: one channel to the host ----------------------------------------------- */
MPNET.guest = function(cb, o){
  cb = cb || {}; o = o || {};
  const Gst = {pc: null, dc: null, status: 'idle', seat: 0, token: null, name: String(o.name || 'Guest').slice(0, 24), hello: o.hello || {}, lastSeen: 0, closed: false, fake: !!o.fake, rate: {sec: 0, n: 0}};
  const send = obj => { try { if (Gst.dc && Gst.dc.readyState === 'open'){ Gst.dc.send(JSON.stringify(obj)); return true; } } catch (e) {} return false; };
  const unwire = () => { if (Gst.dc){ Gst.dc.onopen = Gst.dc.onmessage = Gst.dc.onclose = Gst.dc.onerror = null; } closeQuiet(Gst.dc); closeQuiet(Gst.pc); Gst.dc = null; Gst.pc = null; };
  Gst._open = function(){
    if (Gst.closed) return;
    Gst.lastSeen = MPNET.now(); Gst.status = 'hello';
    send(Object.assign({}, Gst.hello, {t: 'hello', v: MPNET.PROTO, name: Gst.name, token: Gst.token}));
  };
  Gst._text = function(text){
    if (Gst.closed) return;
    const m = parse(text); if (!m || !rateOk(Gst.rate, MPNET.MAX_HOST_MSGS_PER_SEC)) return;
    Gst.lastSeen = MPNET.now();
    if (m.t === 'welcome'){ Gst.seat = m.seat | 0; Gst.token = m.token; Gst.status = 'connected'; logIt('welcome', {seat: Gst.seat, rejoin: !!m.rejoin}); if (cb.onWelcome) cb.onWelcome(Gst.seat, !!m.rejoin); return; }
    if (m.t === 'ping'){ send({t: 'ping'}); return; }
    if (m.t === 'bye'){ Gst._lost(m.why === 'host' ? 'The host closed your seat.' : m.why === 'version' ? 'Your games are different versions. Both players should reload.' : 'The host closed the march.', m.why === 'closed' || m.why === 'host'); return; }
    if (Gst.status === 'connected' && cb.onMessage) cb.onMessage(m);
  };
  Gst._lost = function(why, final){
    if (Gst.closed) return;
    unwire(); Gst.status = final ? 'closed' : 'lost';
    if (final) Gst.token = null;
    logIt('lost', {why, final: !!final});
    if (cb.onLost) cb.onLost(why, !!final);
  };
  Gst.tick = function(){ if (Gst.closed || Gst.status !== 'connected') return; if (MPNET.now() - Gst.lastSeen > MPNET.PEER_TIMEOUT_MS) Gst._lost(`No word from the host for ${Math.round(MPNET.PEER_TIMEOUT_MS / 1000)} seconds.`); };
  /* answer a host code; the token from an earlier seat rides in the hello so the host can give it back */
  Gst.answer = async function(code){
    if (Gst.closed) throw new Error('This guest is closed.');
    const off = await MPNET.decode(code, 'o');
    unwire(); Gst.status = 'pairing';
    if (Gst.fake) return MPNET.encode({k: 'a', v: MPNET.PROTO, s: 'v=0 fake', seat: off.seat});
    const pc = makePC(why => Gst._lost(why));
    Gst.pc = pc;
    pc.ondatachannel = ev => { const dc = ev.channel; Gst.dc = dc; dc.onopen = () => Gst._open(); dc.onmessage = e => Gst._text(e.data); dc.onclose = () => Gst._lost('The connection to the host closed.'); dc.onerror = () => Gst._lost('The connection dropped.'); };
    await pc.setRemoteDescription({type: 'offer', sdp: off.s});
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce(pc);
    return MPNET.encode({k: 'a', v: MPNET.PROTO, s: pc.localDescription.sdp, seat: off.seat});
  };
  Gst.send = obj => Gst.status === 'connected' && send(obj);
  Gst.leave = () => { send({t: 'leave'}); Gst.close(); };
  Gst.close = () => { if (Gst.closed) return; unwire(); Gst.closed = true; Gst.status = 'closed'; clearInterval(Gst.beat); };
  if (!Gst.fake) Gst.beat = setInterval(Gst.tick, MPNET.HEARTBEAT_MS);
  return Gst;
};

/* ---- self-test: codes, tokens and the slot state machine on fake channels (no RTC) ---- */
MPNET.selfTest = async function(){
  const fails = [], ok = (name, cond) => { if (!cond) fails.push(name); };
  const saveNow = MPNET.now; let clock = 1000000; MPNET.now = () => clock;
  try {
    const code = await MPNET.encode({k: 'o', v: MPNET.PROTO, s: 'v=0 test', seat: 1});
    ok('code tag', code.indexOf(MPNET.CODE_TAG) === 0);
    const back = await MPNET.decode(code, 'o'); ok('code roundtrip', back.seat === 1 && back.s === 'v=0 test');
    let threw = ''; try { await MPNET.decode(code, 'a'); } catch (e) { threw = e.message; } ok('wrong kind refused', /host code/.test(threw));
    threw = ''; try { await MPNET.decode('DCMP1Zabc', 'o'); } catch (e) { threw = e.message; } ok('crepitus code named', /Crepitus/.test(threw));
    ok('token shape', tokenOk(MPNET.token()) && MPNET.token() !== MPNET.token());
    /* fake channels: a pair of objects whose send() feeds the other side's _text */
    const ev = {join: 0, rejoin: 0, msg: 0, drop: 0, leave: 0, lastLeave: null};
    const H = MPNET.host({onJoin: () => ev.join++, onRejoin: () => ev.rejoin++, onMessage: (seat, m) => { ev.msg++; ev.last = [seat, m]; }, onDrop: () => ev.drop++, onLeave: (seat, why) => { ev.leave++; ev.lastLeave = why; }}, {fake: true});
    const gl = {welcome: 0, lost: 0, msgs: []};
    const Gst = MPNET.guest({onWelcome: () => gl.welcome++, onMessage: m => gl.msgs.push(m), onLost: () => gl.lost++}, {fake: true, name: 'Pat', hello: {captain: 'x'}});
    function link(s){
      const a = {readyState: 'open', send: t => Gst._text(t), close(){ this.readyState = 'closed'; }}, b = {readyState: 'open', send: t => H._text(s, t), close(){ this.readyState = 'closed'; }};
      s.dc = a; Gst.dc = b; s.status = s.status === 'dropped' ? 'dropped' : 'pairing';
      H._open(s); Gst._open();
      return () => { a.send = () => {}; b.send = () => {}; };   // the wire goes quiet
    }
    const s1 = H.slots[0];
    ok('offer for seat 1', (await H.offerFor(1)).indexOf(MPNET.CODE_TAG) === 0 && s1.status === 'pairing');
    const ans = await Gst.answer(await H.offerFor(1)); ok('answer code', (await MPNET.decode(ans, 'a')).seat === 1);
    ok('accept', await H.accept(1, ans) === true);
    let mute = link(s1);
    ok('join', ev.join === 1 && s1.status === 'connected' && s1.name === 'Pat' && s1.hello.captain === 'x' && gl.welcome === 1 && Gst.seat === 1 && tokenOk(Gst.token));
    const tok = Gst.token;
    Gst.send({t: 'orders', o: 'hold'}); ok('message up', ev.msg === 1 && ev.last[0] === 1 && ev.last[1].o === 'hold');
    H.send(1, {t: 'snap', n: 7}); ok('message down', gl.msgs.length === 1 && gl.msgs[0].n === 7);
    ok('broadcast count', H.broadcast({t: 'lobby'}) === 1);
    /* silence: the host drops the seat after PEER_TIMEOUT */
    mute(); clock += MPNET.PEER_TIMEOUT_MS + 1; H.tick();
    ok('drop on silence', ev.drop === 1 && s1.status === 'dropped' && s1.token === tok);
    /* rejoin inside the window with the token */
    clock += 10000;
    await H.offerFor(1); ok('rejoin offer keeps dropped', s1.status === 'dropped');
    mute = link(s1);
    ok('rejoin', ev.rejoin === 1 && ev.join === 1 && s1.status === 'connected' && s1.token === tok && Gst.token === tok && gl.welcome === 2);
    /* drop again and let the window pass: the seat is the host's */
    mute(); clock += MPNET.PEER_TIMEOUT_MS + 1; H.tick(); ok('second drop', ev.drop === 2);
    clock += MPNET.REJOIN_WINDOW_MS + 1; H.tick();
    ok('takeover after window', ev.leave === 1 && ev.lastLeave === 'window' && s1.status === 'open' && s1.token === null);
    /* a stranger with a stale token after takeover is a new join */
    await H.offerFor(1); link(s1);
    ok('new join after takeover', ev.join === 2 && s1.status === 'connected' && s1.token !== tok);
    /* guest leaves on purpose: slot open, no drop */
    Gst.leave(); ok('leave frees the seat', s1.status === 'open' && ev.leave === 2 && ev.lastLeave === 'left' && ev.drop === 2);
    ok('rate limit', (() => { const r = {sec: 0, n: 0}; let n = 0; for (let i = 0; i < 30; i++) if (rateOk(r)) n++; return n === MPNET.MAX_MSGS_PER_SEC; })());
    H.close(); ok('host closed', H.closed);
  } catch (e) { fails.push('threw: ' + (e.message || e)); }
  MPNET.now = saveNow;
  return {ok: !fails.length, fails, info: 'codes, tokens, join, messages, drop, rejoin, takeover, leave, rate limit'};
};
})();
