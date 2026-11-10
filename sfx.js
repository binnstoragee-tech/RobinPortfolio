/* sfx.js: soft sound effects when a feature gets highlighted (hover / keyboard focus) or pressed.
   Shared by every page. Respects the sidebar sound toggle (localStorage "sound" = on/off). */
(function () {
  var ctx = null, last = 0, lastEl = null;

  function soundOn() { try { return localStorage.getItem('sound') !== 'off'; } catch (e) { return true; } }
  function ready() { return !!(navigator.userActivation && navigator.userActivation.hasBeenActive); }

  /* one short oscillator note: freq (Hz), start offset (s), length (s), volume, wave */
  function note(f, at, len, vol, type) {
    var t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + len + 0.03);
  }

  var SOUNDS = {
    /* nav links, buttons: tiny soft tick */
    tick: function () { note(880 + Math.random() * 60, 0, 0.05, 0.035, 'triangle'); },
    /* cards / tiles / rows: little rising "pop" so the highlight feels noticeable */
    pop: function () { note(660, 0, 0.09, 0.04, 'sine'); note(990, 0.045, 0.12, 0.035, 'sine'); },
    /* click / tap confirm */
    click: function () { note(520, 0, 0.05, 0.05, 'square'); note(780, 0.04, 0.08, 0.04, 'triangle'); }
  };

  function play(name) {
    if (!soundOn() || !ready()) return;
    var now = Date.now(); if (now - last < 45) return; last = now;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = ctx || new AC();
      var go = function () { SOUNDS[name](); };
      if (ctx.state === 'running') go(); else ctx.resume().then(go, function () {});
    } catch (e) {}
  }

  /* what counts as a "feature" and which sound it makes */
  var TICK = '#side .nav a, #ask-open, #tt-open, #chat-open, .keys button, .chat-link, .mode button, .sound, .sh > a, .links a, .mail, .tour-pill button, .back, .plan-btn, .plan-more, .ask-chips button';
  var POP = '.tile, .proj, .cert-card, .node, .nums a, .collabs a, .collabs > *, .row, .plan, .ach a, .sk .more';

  function pick(el) {
    if (!el || !el.closest) return null;
    var a = el.closest(TICK); if (a) return { el: a, s: 'tick' };
    var b = el.closest(POP); if (b) return { el: b, s: 'pop' };
    return null;
  }

  /* mouse hover (touch devices don't hover, they get the click sound below) */
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    var h = pick(e.target); if (!h || h.el === lastEl) return;
    lastEl = h.el; play(h.s);
  }, true);
  document.addEventListener('pointerout', function (e) {
    if (lastEl && !lastEl.contains(e.relatedTarget)) lastEl = null;
  }, true);

  /* keyboard highlight (Tab) */
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches(':focus-visible')) return;
    var h = pick(t); if (h) play(h.s);
  });

  /* press: only on buttons / links, so every tap gets feedback (including phones) */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('a, button'); if (!t) return;
    if (t.id === 'sound') return; /* the toggle plays its own test sound */
    play('click');
  }, true);
})();
