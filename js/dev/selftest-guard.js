/* Index STG - self-test guard (Engineer, 17 Nov 2026; Producer ruled test code that rewrites a player's save is a bug).
 * Every global suite's selfTest (and selfTestX side tests) is wrapped once, after load: localStorage and META are
 * snapshotted before it runs and put back after it (also when it throws, and for async suites after the promise settles).
 * Anything a suite changed is listed in SELFTEST_GUARD.leaks so the suite can be fixed; the harness (alltests.js) keeps its own snapshot too.
 * Nothing runs unless a suite is called. ROLLBACK: delete this file and its <script> tag. */
(function () {
  'use strict';
  const G = window.SELFTEST_GUARD = {leaks: [], wrapped: 0};
  const snapLS = () => { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } } catch (e) {} return o; };
  const metaNow = () => { try { return (0, eval)('typeof META === "undefined" ? undefined : META'); } catch (e) { return undefined; } };
  function begin() { const m = metaNow(); let j = null; try { j = m ? JSON.stringify(m) : null; } catch (e) {} return {ls: snapLS(), m, j}; }
  function end(name, s) {
    try {
      const now = snapLS(), what = [];
      for (const k of new Set(Object.keys(s.ls).concat(Object.keys(now)))) if (s.ls[k] !== now[k]) { what.push(k); if (s.ls[k] === undefined) localStorage.removeItem(k); else localStorage.setItem(k, s.ls[k]); }
      const m = metaNow(); let j = null; try { j = m ? JSON.stringify(m) : null; } catch (e) {}
      if (m !== s.m || j !== s.j) {
        what.push('META');
        if (s.m && s.j) {
          const back = JSON.parse(s.j);
          for (const k of Object.keys(s.m)) delete s.m[k];
          Object.assign(s.m, back);
          if (m !== s.m) { window.__stgm = s.m; (0, eval)('META = window.__stgm'); delete window.__stgm; }
        }
      }
      if (what.length) G.leaks.push(name + ': ' + what.join(', '));
    } catch (e) {}
  }
  function wrap(obj, fn, name) {
    const f = obj[fn]; if (typeof f !== 'function' || f.__stg) return;
    const w = function () {
      const s = begin(); let r;
      try { r = f.apply(this, arguments); } catch (e) { end(name, s); throw e; }
      if (r && typeof r.then === 'function') return r.then(v => { end(name, s); return v; }, e => { end(name, s); throw e; });
      end(name, s); return r;
    };
    w.__stg = true; try { obj[fn] = w; G.wrapped++; } catch (e) {}
  }
  let wrapAll = function () {
    for (const k of Object.keys(window)) {
      if (!/^[A-Z][A-Za-z0-9_]*$/.test(k) || k === 'ALLT' || k === 'SELFTEST_GUARD' || !window[k]) continue;
      let v = window[k]; if (typeof v !== 'object' && typeof v !== 'function') continue;
      try { for (const f of Object.keys(v)) if (f === 'selfTest' || /^selfTest[A-Z0-9_]\w*$/.test(f)) wrap(v, f, k + '.' + f); } catch (e) {}
    }
  };
  /* top-level const/let suites are not window properties (Object.keys(window) misses them): looked up by name */
  const LEXICAL = ['PROPS3D', 'R3D', 'NAME_UNIQUE', 'FOUNDBACK'];
  G.register = function (name) { try { const v = (0, eval)('typeof ' + name + ' === "undefined" ? undefined : ' + name); if (v) for (const f of Object.keys(v)) if (f === 'selfTest' || /^selfTest[A-Z0-9_]\w*$/.test(f)) wrap(v, f, name + '.' + f); } catch (e) {} };
  const wrapAll0 = wrapAll; wrapAll = function () { wrapAll0(); LEXICAL.forEach(G.register); };
  G.wrapAll = wrapAll;
  if (document.readyState === 'complete') setTimeout(wrapAll, 0); else window.addEventListener('load', () => setTimeout(wrapAll, 0));
})();
