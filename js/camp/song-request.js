/* ============================================================================
   INDEX SREQ - F-22 Request a song (Audio Designer, Patrick 2026-11-14).
   Talk to the Camp Bard (his panel, INDEX 31) and pay SONGREQ.COST gp [S] to ask for
   a tune the game already has: one of the five bard tunes, optionally in a regional
   colour voice (MOOD: heartland pipe, mendor fiddle, marches gurdy, spine drone,
   frost bell). He plays it, with a short thank-you, until the scene changes (a contract
   starts, the holding changes, the tavern hub opens or closes, or
   the player picks another tune from his free list). The free "What shall I play?"
   list and the saved camp-song setting are untouched: the request only borrows
   settings().campSong and MOOD.force and puts both back (no saveMeta is called).
   Lines: CAMPAIGN_LINES.bardSong (Narrative, js/lines/campaign.js); short defaults below.
   INT-1 group 17: no switch.
   Tools: SONGREQ.state(), SONGREQ.request(id, voice), SONGREQ.end().
   ============================================================================ */
(function () {
  'use strict';
  if (typeof MUS === 'undefined' || !MUS.SONGS || typeof bardPanelHTML !== 'function') return;
  const S = window.SONGREQ = { COST: 1 /* [S] */, req: null, voice: 'bard' };
  // the colour voice picks a region (MOOD.region) and a brightness that makes it audible
  const VOICES = {   // keys match CAMPAIGN_LINES.bardSong.menu / .play (Narrative)
    bard:      { name: 'His own tune',         region: null,        bright: null },
    heartland: { name: 'Heartland pipe',       region: 'heartland', bright: 0.8 },
    mendor:    { name: 'Mendor fiddle',        region: 'mendor',    bright: 0.8 },
    freelands: { name: 'Free Lands fiddle',    region: 'freelands', bright: 0.8 },
    marches:   { name: 'Marches hurdy-gurdy',  region: 'marches',   bright: 0.8 },
    frost:     { name: 'Frost bell',           region: 'frost',     bright: 0.75 },
    spine:     { name: 'Spine drone',          region: 'spine',     bright: 0.2 }
  };
  S.VOICES = VOICES;
  const DEF = {
    thanks: ['Coin received, and a fine choice.'], cantAfford: ['The tune is free. The request costs a coin, friend.'],
    offer: 'A song, Leader?', cost: '{gp} gold a song.', again: 'He is already playing.', stop: 'The song ends when the scene changes.',
    menu: {}, play: {}
  };
  const LN = () => { const c = window.CAMPAIGN_LINES; return (c && c.bardSong) || {}; };
  const L = k => { const a = LN()[k] || (window.BARDREQ_LINES || {})[k]; return Array.isArray(a) && a.length ? a : (DEF[k] || []); };
  const T = k => LN()[k] || DEF[k];
  const sub = t => String(t).replace('{gp}', S.COST).replace('{bard}', (typeof META !== 'undefined' && META.bard && META.bard.name) || 'the bard');
  const pickOf = a => a[Math.random() * a.length | 0];
  const keyNow = () => {
    let tv = ''; try { tv = window.TAVERN && TAVERN.open ? !!TAVERN.open() : ''; } catch (e) {}
    return [!!(typeof G !== 'undefined' && G), META && META.holding, tv].join('|');
  };
  const bard = () => { try { return CAMP && CAMP.bardQ && CAMP.people.includes(CAMP.bardQ) ? CAMP.bardQ : null; } catch (e) { return null; } };
  const say = txt => { const B = bard(); if (B) { B.bark = txt; B.barkLife = 260; try { if (window.VOICE15 && VOICE15.free) VOICE15.free.set(txt, (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 6000); } catch (e) {} } };   // the player's own request: it always shows

  S.can = () => typeof META !== 'undefined' && META && !(typeof G !== 'undefined' && G) && !!bard() && !(typeof MUS !== 'undefined' && MUS.disabled);   // R1: music is off, so no gold for silence
  S.request = function (id, voice) {
    if (!S.can() || !MUS.SONGS[id]) return false;
    if (META.treasury < S.COST) { try { SFX.play('nope'); } catch (e) {} say(pickOf(L('cantAfford'))); return false; }
    const s = settings(), V = VOICES[voice || S.voice] || VOICES.bard;
    if (S.req && S.req.id === id && S.req.voice === (voice || S.voice)) { say(sub(T('again'))); return false; }
    if (S.req) S.end(true); // changing the request: keep the original setting, do not pay twice for nothing
    const was = S.req0 || { song: s.campSong, force: MOOD_FORCE() };
    META.treasury -= S.COST;
    S.req0 = was; S.req = { id, voice: voice || S.voice, key: keyNow() };
    try { SFX.play('coin'); } catch (e) {}
    try { MUS.start(); } catch (e) {}
    s.campSong = id;                                    // not saved here: setSong would call saveMeta
    if (window.MOOD) MOOD.force = V.region ? Object.assign({}, was.force || {}, { region: V.region, bright: V.bright }) : was.force;
    try { MUS._M.restartAt = 0; MUS.tick(); } catch (e) {}
    say(pickOf(L('thanks')));
    try { if (typeof saveMeta === 'function') saveMeta(); } catch (e) {}   // the gold; campSong is then saved as the tune, which is harmless
    try { if (typeof refreshUI === 'function') refreshUI(); } catch (e) {}
    try { if (CAMP.panel && typeof renderPanel === 'function') renderPanel(); } catch (e) {}
    return true;
  };
  function MOOD_FORCE() { return window.MOOD ? MOOD.force : null; }
  // end: give the borrowed settings back (restore=false when the player chose something else)
  S.end = function (keep) {
    const r = S.req, was = S.req0; if (!r) return;
    S.req = null;
    if (keep) return;                                   // called from request(): the next request reuses S.req0
    S.req0 = null;
    try { if (window.MOOD) MOOD.force = was.force || null; } catch (e) {}
    try { const s = settings(); if (s.campSong === r.id) { s.campSong = was.song; if (typeof saveMeta === 'function') saveMeta(); } } catch (e) {}
    try { if (MUS._M.ac) MUS.tick(); } catch (e) {}
    try { if (CAMP.panel && typeof renderPanel === 'function') renderPanel(); } catch (e) {}
  };
  S.state = () => ({ can: S.can(), req: S.req, voice: S.voice, treasury: typeof META !== 'undefined' ? META.treasury : null, campSong: (() => { try { return settings().campSong; } catch (e) { return null; } })() });

  // scene watch: the request lasts until the scene changes
  setInterval(function () {
    try {
      if (!S.req) return;
      if (keyNow() !== S.req.key || !bard()) return S.end();
      if (settings().campSong !== S.req.id) { S.req = null; S.req0 = null; if (window.MOOD) MOOD.force = null; }   // he picked another tune from the free list: let it stand
    } catch (e) {}
  }, 600);

  // the panel: one more section under the bard's free list
  const h0 = bardPanelHTML;
  bardPanelHTML = function () {
    const base = h0.apply(this, arguments);
    if (!S.can()) return base;
    const poor = META.treasury < S.COST, esc2 = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const mn = LN().menu || {}, pl = LN().play || {};
    const chips = Object.keys(VOICES).map(k => `<button class="btn small" title="${esc2(mn[k] || '')}" style="margin:2px;${S.voice === k ? 'outline:2px solid #8b0000' : ''}" onclick="SONGREQ.voice='${k}';renderPanel()">${esc2(VOICES[k].name)}</button>`).join('');
    const cards = MUS.SONG_IDS.map(id => `<div class="card" style="text-align:left;margin:4px 0;${poor ? 'opacity:.5' : ''}" onclick="SONGREQ.request('${id}')"><div class="ttl" style="text-align:left">${esc2(MUS.SONGS[id].name)} <span style="font-size:14px">&#9834; ${S.COST} gp</span></div></div>`).join('');
    const now = S.req ? `<div class="desc" style="text-align:left;font-size:14px;color:#4a2a0a">Playing by request: <b>${esc2(MUS.SONGS[S.req.id].name)}</b> (${esc2(VOICES[S.req.voice].name)}).<br>${esc2(sub(pl[S.req.voice] || ''))}</div>` : '';
    return base + `<div class="desc" style="text-align:left;margin:12px 0 2px;border-top:1px solid #b9a06a;padding-top:8px"><b>Request a song</b><br><span style="font-size:14px">${esc2(sub(T('offer')))} ${esc2(sub(T('cost')))} ${poor ? '(You have ' + META.treasury + '.)' : '(You have ' + META.treasury + ' gp.)'}<br>${esc2(sub(T('stop')))}</span></div>${now}<div style="text-align:left">${chips}</div><div class="desc" style="text-align:left;font-size:14px;margin:2px 0">${esc2(sub(mn[S.voice] || ''))}</div>${cards}`;
  };
})();
