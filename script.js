(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('.mod').forEach(function (k) { k.textContent = isMac ? '⌘' : 'Alt'; });

  /* ---------- theme ---------- */
  var mq = matchMedia('(prefers-color-scheme: light)');
  function applyMode(m) {
    var t = m === 'system' ? (mq.matches ? 'light' : 'dark') : m;
    root.dataset.theme = t;
    $$('.mode button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    try { localStorage.setItem('mode', m); } catch (e) {}
  }
  var saved = 'dark';
  try { saved = localStorage.getItem('mode') || 'dark'; } catch (e) {}
  applyMode(saved);
  /* theme switch: a circle grows out of the tapped button (View Transitions), soft cross-fade elsewhere */
  function switchMode(m, btn) {
    var next = m === 'system' ? (mq.matches ? 'light' : 'dark') : m;
    if (next === root.dataset.theme) { applyMode(m); return; }
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !calm && btn) {
      var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var vt = document.startViewTransition(function () { applyMode(m); });
      vt.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
    } else if (!calm) {
      root.classList.add('theme-fade'); applyMode(m);
      setTimeout(function () { root.classList.remove('theme-fade'); }, 450);
    } else applyMode(m);
  }
  $$('.mode button').forEach(function (b) { b.addEventListener('click', function () { switchMode(b.dataset.mode, b); }); });
  mq.addEventListener && mq.addEventListener('change', function () { if (saved === 'system') applyMode('system'); });

  /* ---------- mobile menu ---------- */
  var side = $('#side');
  /* mobile menu: full-screen, fades in with staggered items, fades out on close */
  var menuTimer = null;
  $$('#side .nav a, #side .side-foot > *').forEach(function (el, i) { el.style.setProperty('--i', i); });
  function openMenu() {
    clearTimeout(menuTimer); side.classList.remove('closing');
    root.style.setProperty('--sbw', Math.max(0, innerWidth - root.clientWidth) + 'px');
    side.classList.add('open'); root.classList.add('menu-open'); side.scrollTop = 0;
  }
  function closeMenu(now) {
    root.classList.remove('menu-open');
    if (!side.classList.contains('open')) return;
    clearTimeout(menuTimer);
    if (now === true || matchMedia('(prefers-reduced-motion: reduce)').matches) { side.classList.remove('open', 'closing'); return; }
    side.classList.add('closing');
    menuTimer = setTimeout(function () { side.classList.remove('open', 'closing'); }, 240);
  }
  $('#menu-open').addEventListener('click', openMenu);
  $('#menu-close').addEventListener('click', function () { closeMenu(); });
  $$('#side a').forEach(function (a) { a.addEventListener('click', function () { closeMenu(); }); });
  ['ask-open', 'tt-open', 'chat-open'].forEach(function (id) { var b = document.getElementById(id); b && b.addEventListener('click', function () { closeMenu(true); }); });
  addEventListener('resize', function () { if (innerWidth >= 1024) closeMenu(true); });

  /* ---------- active section link ---------- */
  /* sidebar nav scrolls only when it does not fit (short laptop screens); big screens show everything */
  var sc = $('.side-scroll');
  function paintScroll() {
    var can = sc.scrollHeight > sc.clientHeight + 1;
    sc.classList.toggle('can-scroll', can);
    sc.classList.toggle('at-end', !can || sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2);
  }
  sc.addEventListener('scroll', paintScroll, { passive: true });
  addEventListener('resize', paintScroll);
  if (window.ResizeObserver) new ResizeObserver(paintScroll).observe(sc);
  paintScroll();
  var links = $$('#side .nav a').filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#' && (a.getAttribute('href') || '').length > 1; });
  /* active nav item changes only when you click it (never while the page scrolls) */
  function setActive(id) { links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + id); }); }
  links.forEach(function (l) {
    l.addEventListener('click', function () { setActive(l.getAttribute('href').slice(1)); });
  });

  /* ---------- reveal ---------- */
  var rev = new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } });
  }, { threshold: 0.08 });
  $$('.page section').forEach(function (s, i) { if (i > 1) { s.classList.add('reveal'); rev.observe(s); } });

  /* profile pic cursor-look now lives inline in index.html (so it never gets stuck on a cached script.js) */

  /* ---------- viewers (simulated) ---------- */
  var vc = $('#v-count'), vl = $('#v-label'), faces = $$('#faces img'), v = 3;
  function showViewers() {
    vc.textContent = v; vl.textContent = v === 1 ? 'person viewing now' : 'people viewing now';
    faces.forEach(function (f, i) { f.style.display = i < Math.min(3, v) ? '' : 'none'; });
  }
  showViewers();
  setInterval(function () { v = Math.max(1, Math.min(6, v + (Math.random() < 0.5 ? -1 : 1))); showViewers(); }, 7000);

  /* ---------- sound toggle (typing-test clicks) ---------- */
  var sBtn = $('#sound'), sOn = true, actx = null;
  try { sOn = localStorage.getItem('sound') !== 'off'; } catch (e) {}
  function paintSound() { sBtn.innerHTML = sOn ? sBtn.dataset.on : sBtn.dataset.off; }
  paintSound();
  sBtn.addEventListener('click', function () { sOn = !sOn; paintSound(); try { localStorage.setItem('sound', sOn ? 'on' : 'off'); } catch (e) {} if (sOn) ting(); });
  function blip(f, len, vol) {
    if (!sOn) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!actx && !(navigator.userActivation && navigator.userActivation.hasBeenActive)) return; /* blocked until the first tap/click */
      actx = actx || new AC();
      var play = function () {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
        o.frequency.value = f || 620; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.04, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.03));
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (len || 0.03) + 0.02);
      };
      if (actx.state === 'running') play(); else actx.resume().then(function () { if (sOn) play(); }, function () {});
    } catch (e) {}
  }
  /* test sound when the sidebar toggle is switched on */
  function ting() { blip(1318, 0.5, 0.11); setTimeout(function () { blip(1760, 0.6, 0.08); }, 90); }

  /* ---------- copy email ---------- */
  $('#copy-mail').addEventListener('click', function () {
    var b = this;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText('binnfrancisco@gmail.com').then(done, done); else done();
  });

  /* ---------- modal helpers ---------- */
  var openModal = null;
  function show(el) {
    hideAll();
    if (tOn) tourEnd();  /* the tour must not keep scrolling the page behind a popup */
    el.hidden = false; openModal = el;
    if (el.id === 'ask' || el.id === 'tt') lockPage();
  }
  /* freeze the page behind a fullscreen popup: no wheel, touch, keyboard or tour scrolling, and no layout shift */
  var lockY = 0, locked = false;
  function lockPage() {
    if (locked) return; locked = true;
    lockY = window.pageYOffset || root.scrollTop || 0;
    var sbw = window.innerWidth - root.clientWidth;
    document.body.style.top = (-lockY) + 'px';
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    root.classList.add('lock');
  }
  function unlockPage() {
    if (!locked) return; locked = false;
    root.classList.remove('lock');
    document.body.style.top = ''; document.body.style.paddingRight = '';
    root.style.scrollBehavior = 'auto'; window.scrollTo(0, lockY); root.style.scrollBehavior = '';
  }
  function hideAll() { $$('.modal,.chat').forEach(function (m) { m.hidden = true; }); openModal = null; unlockPage(); }
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', hideAll); });
  $$('.modal').forEach(function (m) { m.addEventListener('mousedown', function (e) { if (e.target === m) hideAll(); }); });

  /* ---------- ask anything (answers about Robin) ---------- */
  var ask = $('#ask'), askIn = $('#ask-in'), askQ = $('#ask-q'), askLog = $('#ask-log'), askForm = $('#ask-form'), chipBox = $('#ask-chips'), busy = false;
  var MAIL = '<a href="mailto:binnfrancisco@gmail.com">binnfrancisco@gmail.com</a>';
  /* Tagalog question -> Tagalog answer, English question -> English answer */
  function isTL(t) { return /\b(sino|asawa|misis|mo|ka|ko|ba|ang|ng|nasaan|saan|ano|anak|pamilya|kasal|jowa|po|naman|siya|niya|mga|may|meron|magkano|kumusta|kamusta|mahal|mag-?asawa|kayo|natin|namin|iyo|inyo|nyo|niyo)\b/.test(t); }
  var KB = [
    /* the only thing it answers: who is Robin's wife (English or Tagalog) */
    [/jenylyn|\bwife\b|asawa|misis|spouse|mag-?asawa/, function (t) { return isTL(t) ? 'Ang asawa ko ay si <b>Jenylyn Forte Francisco</b>.' : 'My wife is <b>Jenylyn Forte Francisco</b>.'; }]
  ];
  var FALLBACK = 'I don\'t have an answer for that yet. Try asking about my work, skills, education or services — or email me at ' + MAIL + '.';
  var CHIPS = [];
  function answer(q) {
    var t = q.toLowerCase().replace(/[^\w\s?&.'-]/g, ' ');
    for (var i = 0; i < KB.length; i++) {
      if (KB[i][0].test(t)) return typeof KB[i][1] === 'function' ? KB[i][1](t) : KB[i][1];
    }
    return FALLBACK;
  }
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
    b.addEventListener('click', function () { send(c); });
    chipBox.appendChild(b);
  });
  var askTok = 0, ASK_KEY = 'askHistory', hist = [];
  hist = []; try { localStorage.removeItem(ASK_KEY); } catch (e) {}
  function saveHist() { try { localStorage.setItem(ASK_KEY, JSON.stringify(hist.slice(-40))); } catch (e) {} }
  var THINK_ICON = '<svg class="think-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3.6"/><circle cx="16.4" cy="7" r="2.6"/><circle cx="7" cy="16.6" r="2.6"/><circle cx="15.6" cy="16" r="3.6"/></svg>';
  function askBubble(t, cls, html) {
    var p = document.createElement('p'); p.className = cls || 'bot';
    if (html) p.innerHTML = t; else p.textContent = t;
    askLog.appendChild(p); askLog.scrollTop = askLog.scrollHeight; return p;
  }
  /* shows "thinking…" (spinner + shimmer), then types the answer out (links/bold keep working) */
  function botType(html, done) {
    var tok = askTok, p = askBubble(THINK_ICON + '<span class="shimmer">thinking…</span>', 'bot thinking', true);
    setTimeout(function () {
      if (tok !== askTok) return;
      p.className = 'bot'; p.innerHTML = html;
      var nodes = [], walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), n;
      while ((n = walker.nextNode())) nodes.push([n, n.nodeValue]);
      nodes.forEach(function (x) { x[0].nodeValue = ''; });
      var ni = 0, ci = 0;
      (function tick() {
        if (tok !== askTok) return;
        if (ni >= nodes.length) { askLog.scrollTop = askLog.scrollHeight; done && done(); return; }
        ci += 2; var full = nodes[ni][1];
        nodes[ni][0].nodeValue = full.slice(0, ci);
        if (ci >= full.length) { nodes[ni][0].nodeValue = full; ni++; ci = 0; }
        askLog.scrollTop = askLog.scrollHeight;
        setTimeout(tick, 14);
      })();
    }, 1100 + Math.random() * 700);
  }
  /* ---- "what your browser already shares" reveal: runs when a question is not about Robin ---- */
  var revealed = false, revealSkip = null;
  function fetchJSON(url, ms) {
    return new Promise(function (ok, no) {
      var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); no(); }, ms);
      fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(t); ok(j); }, function () { clearTimeout(t); no(); });
    });
  }
  /* public IP + rough location come from a free IP lookup, called from the visitor's own browser; nothing is sent to or stored by this site */
  function getNet() {
    return fetchJSON('https://ipwho.is/', 4000).then(function (j) {
      if (!j || j.success === false || !j.ip) throw 0;
      return { ip: j.ip, city: j.city, region: j.region, lat: j.latitude, lon: j.longitude, isp: (j.connection && (j.connection.isp || j.connection.org)) || '' };
    }).catch(function () {
      return fetchJSON('https://ipapi.co/json/', 4000).then(function (j) {
        if (!j || !j.ip) throw 0;
        return { ip: j.ip, city: j.city, region: j.region, lat: j.latitude, lon: j.longitude, isp: j.org || '' };
      });
    }).catch(function () { return null; });
  }
  function deviceFacts() {
    var ua = navigator.userAgent || '', os = 'unknown';
    if (/iPhone|iPad|iPod/.test(ua)) os = 'ios'; else if (/Android/.test(ua)) os = 'android'; else if (/Windows/.test(ua)) os = 'windows';
    else if (/Mac OS X|Macintosh/.test(ua)) os = 'mac'; else if (/Linux|X11/.test(ua)) os = 'linux';
    var br = 'a web browser', m;
    if ((m = ua.match(/(?:Edg|EdgiOS|EdgA)\/(\d+)/))) br = 'edge ' + m[1];
    else if ((m = ua.match(/OPR\/(\d+)/))) br = 'opera ' + m[1];
    else if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) br = 'firefox ' + m[1];
    else if ((m = ua.match(/(?:Chrome|CriOS)\/(\d+)/))) br = 'chrome ' + m[1];
    else if ((m = ua.match(/Version\/(\d+)[\d.]*.*Safari/))) br = 'safari ' + m[1];
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var time = ''; try { time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (e) {}
    var c = navigator.connection || {};
    return { os: os, br: br, lang: (navigator.language || '').toLowerCase(), cores: navigator.hardwareConcurrency, mem: navigator.deviceMemory, tz: tz.toLowerCase(), time: time.toLowerCase(), net: c.effectiveType ? c.effectiveType : '' };
  }
  function revealLines(net) {
    var d = deviceFacts(), L = ['before i answer', 'here is what your browser already shared the moment you opened this site'];
    if (net) {
      var place = [net.city, net.region].filter(Boolean).join(', ');
      if (place) L.push('you are currently in ' + place.toLowerCase());
      L.push('your public ip address is ' + net.ip);
      if (net.isp) L.push('you are connected through ' + String(net.isp).toLowerCase());
      if (net.lat != null && net.lon != null) L.push('your approximate coordinates are around ' + (+net.lat).toFixed(2) + ', ' + (+net.lon).toFixed(2));
    }
    var dev = 'you are on a ' + d.os + ' device';
    if (d.cores) dev += ' with ' + d.cores + ' processor cores' + (d.mem ? ' and ' + d.mem + 'gb of memory' : '');
    L.push(dev);
    L.push('you are browsing with ' + d.br + (d.lang ? ' set to ' + d.lang : ''));
    if (d.tz) L.push('your timezone is ' + d.tz + (d.time ? ' and it is around ' + d.time + ' where you are' : ''));
    if (d.net) L.push('you are on a ' + d.net + ' connection');
    L.push('none of this needed your permission', 'your browser shares it with every website you open, automatically', 'so be mindful of what you click, and who you trust online', 'as for your question', 'i don\'t want to waste tokens on that, search for it yourself :)');
    return L;
  }
  function revealRun(q, done) {
    var tok = askTok, netP = getNet();
    var p = askBubble(THINK_ICON + '<span class="shimmer">thinking…</span>', 'bot thinking', true);
    setTimeout(function () { if (tok === askTok) p.innerHTML = THINK_ICON + '<span class="shimmer">analyzing…</span>'; }, 1100);
    Promise.all([netP, new Promise(function (r) { setTimeout(r, 2300); })]).then(function (r) {
      if (tok !== askTok) return;
      var lines = revealLines(r[0]); askLog.innerHTML = ''; ask.classList.add('revealing');
      var st = document.createElement('p'); st.className = 'reveal'; askLog.appendChild(st);
      (function step(i) {
        if (tok !== askTok) return;
        var dim = /^(you are |your public|your approximate|your timezone)/.test(lines[i]) ? ' dim' : '';
        st.className = 'reveal' + dim; st.textContent = lines[i]; void st.offsetWidth; st.className = 'reveal in' + dim;
        var last = i === lines.length - 1, hold = Math.min(3600, 1500 + lines[i].length * 32), t1, t2;
        var next = function () {
          revealSkip = null; clearTimeout(t1); clearTimeout(t2);
          if (last) { st.className = 'reveal in' + dim + ' done'; ask.classList.remove('revealing'); done && done(); return; }
          st.className = 'reveal out' + dim; t2 = setTimeout(function () { step(i + 1); }, 360);
        };
        revealSkip = next; t1 = setTimeout(next, last ? 900 : hold);
      })(0);
    });
  }
  askLog.addEventListener('click', function () { revealSkip && revealSkip(); });
  function send(q) {
    if (busy) return; busy = true;
    askQ.hidden = true; chipBox.hidden = true; askForm.hidden = true;
    askBubble(q, 'me');
    var ans = answer(q), fin = function () {
      /* the conversation ends here: last line stays on screen, no input, chips or hints (close with X or esc) */
      busy = false; askForm.hidden = true; chipBox.hidden = true; ask.classList.add('ended');
      askLog.scrollTop = askLog.scrollHeight;
    };
    if (ans === FALLBACK) revealRun(q, fin); else botType(ans, fin);
  }
  var askClear = $('#ask-clear');
  function resetAsk() {
    askTok++; busy = false; askLog.innerHTML = ''; askIn.value = ''; ask.classList.remove('revealing', 'ended');
    askForm.hidden = false; askClear.hidden = !hist.length;
    if (hist.length) {  /* bring back this user's earlier conversation, no animation */
      askQ.hidden = true; askIn.placeholder = 'ask another…';
      hist.forEach(function (q) { askBubble(q, 'me'); askBubble(answer(q), 'bot', true); });
      chipBox.hidden = false;
      askLog.scrollTop = askLog.scrollHeight;
    } else {
      askQ.hidden = false; chipBox.hidden = true; askIn.placeholder = '';
      askQ.textContent = 'what do you want to ask?';
    }
  }
  /* iOS: keep the overlay exactly on the visible area (above the keyboard) instead of the full page behind it */
  function fitAsk() {
    var vv = window.visualViewport; if (!vv) return;
    if (openModal === ask && !ask.hidden) {
      ask.style.height = vv.height + 'px'; ask.style.top = vv.offsetTop + 'px'; ask.style.bottom = 'auto';
      if (vv.offsetTop || vv.pageTop) scrollTo(0, 0);
    } else { ask.style.height = ''; ask.style.top = ''; ask.style.bottom = ''; }
  }
  if (window.visualViewport) { visualViewport.addEventListener('resize', fitAsk); visualViewport.addEventListener('scroll', fitAsk); }
  function openAsk() {
    show(ask); resetAsk(); fitAsk();
    /* focus right inside the tap: iOS only opens the keyboard for a focus that happens during the user gesture */
    try { askIn.focus({ preventScroll: true }); } catch (e) { askIn.focus(); }
    setTimeout(function () { try { askIn.focus({ preventScroll: true }); } catch (e) { askIn.focus(); } askLog.scrollTop = askLog.scrollHeight; fitAsk(); }, 60);
  }
  askClear.addEventListener('click', function () { hist = []; saveHist(); try { localStorage.removeItem(ASK_KEY); } catch (e) {} resetAsk(); askIn.focus(); });
  askForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = askIn.value.trim(); if (!val) return;
    askIn.value = ''; send(val);
  });
  $('#ask-open').addEventListener('click', openAsk);

  /* ---------- typing test ---------- */
  var tt = $('#tt'), box = $('#tt-words'), kb = $('#tt-kb'), inp = $('#tt-in'), play = $('#tt-play'), resEl = $('#tt-result');
  var WORDS = 'the and you can way new try fun big top one two run map web app sky sun sea win now fast code type pixel build ship make play game ride rock flow wave glow neon bold calm kind real true time life work idea plan goal dream focus shape clean clear quick smart light bright sharp simple modern create design learn think grow start keep move jump write read share team brand color story style music video photo frame layout motion social media post reel feed ads sale page site link data cloud mobile launch improve better great small steps matter every day night coffee gym ball bike road trip city beach island'.split(' ');
  var TT_LEN = 20;  /* short test: 20 words */
  var OWNER = { name: 'rob', wpm: 140 };  /* score to beat on the results screen */
  var T = { list: [], el: [], wi: 0, cur: '', typed: 0, correct: 0, t0: 0, timer: null, done: false, lh: 0 };
  var ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], keyEl = {}, nextKey = null;
  ROWS.forEach(function (r) {
    var row = document.createElement('div'); row.className = 'kr';
    r.split('').forEach(function (ch) { var k = document.createElement('span'); k.className = 'kk'; k.textContent = ch; keyEl[ch] = k; row.appendChild(k); });
    kb.appendChild(row);
  });
  var sp = document.createElement('div'); sp.className = 'kr';
  var spk = document.createElement('span'); spk.className = 'kk space'; spk.textContent = 'space'; keyEl[' '] = spk; sp.appendChild(spk); kb.appendChild(sp);

  var caret = document.createElement('span'); caret.className = 'tt-caret';
  var ttHl = document.createElement('span'); ttHl.className = 'tt-hl';
  function setNext() {
    if (nextKey) nextKey.classList.remove('next');
    if (T.done) { nextKey = null; return; }
    var w = T.list[T.wi]; if (!w) return;
    var ch = T.cur.length < w.length ? w.charAt(T.cur.length) : ' ';
    nextKey = keyEl[ch] || null;
    if (nextKey) nextKey.classList.add('next');
  }
  function pressKey(ch, bad) {
    var k = keyEl[ch]; if (!k) return;
    k.classList.remove('press', 'wrong'); void k.offsetWidth;
    k.classList.add('press'); if (bad) k.classList.add('wrong');
    clearTimeout(k._t); k._t = setTimeout(function () { k.classList.remove('press', 'wrong'); }, 170);
  }
  function paintWord(i) {
    var w = T.list[i], el = T.el[i], typed = i === T.wi ? T.cur : (T.typedAt[i] || ''), h = '';
    for (var c = 0; c < w.length; c++) {
      var cls = c < typed.length ? (typed.charAt(c) === w.charAt(c) ? 'ok' : 'bad') : '';
      h += '<i class="' + cls + '">' + w.charAt(c) + '</i>';
    }
    for (var x = w.length; x < typed.length; x++) h += '<i class="bad extra">' + typed.charAt(x) + '</i>';
    el.innerHTML = h;
  }
  function moveCaret() {
    var el = T.el[T.wi]; if (!el) return;
    var chars = el.children, idx = Math.min(T.cur.length, chars.length), x, y, ch;
    if (idx < chars.length) { ch = chars[idx]; x = el.offsetLeft + ch.offsetLeft; } else { ch = chars[chars.length - 1]; x = el.offsetLeft + ch.offsetLeft + ch.offsetWidth; }
    y = el.offsetTop + ch.offsetTop;
    caret.style.height = ch.offsetHeight + 'px';
    caret.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    ttHl.style.width = (el.offsetWidth + 16) + 'px'; ttHl.style.height = (el.offsetHeight + 4) + 'px';
    ttHl.style.transform = 'translate(' + (el.offsetLeft - 8) + 'px,' + (el.offsetTop - 2) + 'px)';
    /* keep the current line on the first or second row; slide the text up smoothly */
    T.lh = T.lh || el.offsetHeight;
    var line = Math.round(el.offsetTop / T.lh);
    box.style.transform = 'translateY(' + (-Math.max(0, line - 1) * T.lh) + 'px)';
  }
  function ttReset() {
    clearInterval(T.timer);
    T.list = []; for (var i = 0; i < TT_LEN; i++) { var nw; do { nw = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (nw === T.list[i - 1]); T.list.push(nw); }
    T.wi = 0; T.cur = ''; T.typed = 0; T.correct = 0; T.t0 = 0; T.done = false; T.typedAt = []; T.lh = 0;
    box.innerHTML = ''; box.style.transform = ''; box.appendChild(ttHl); box.appendChild(caret);
    T.el = T.list.map(function (w) { var s = document.createElement('span'); s.className = 'w'; box.appendChild(s); box.appendChild(document.createTextNode(' ')); return s; });
    T.list.forEach(function (w, i) { paintWord(i); });
    resEl.hidden = true; play.hidden = false; tt.classList.remove('done'); kb.hidden = false; inp.value = ''; stats(0);
    box.classList.remove('run'); setNext();
    requestAnimationFrame(function () { box.style.transition = 'none'; moveCaret(); requestAnimationFrame(function () { box.style.transition = ''; }); });
  }
  function stats(sec) {
    var mins = Math.max(sec, 1) / 60;
    $('#tt-wpm').textContent = T.t0 ? Math.round((T.correct / 5) / mins) : 0;
    $('#tt-acc').textContent = T.typed ? Math.round(T.correct / T.typed * 100) : 100;
    $('#tt-time').textContent = Math.round(sec);
  }
  function finish() {
    T.done = true; clearInterval(T.timer); setNext();
    var sec = (Date.now() - T.t0) / 1000, mins = Math.max(sec, 1) / 60;
    var wpm = Math.round((T.correct / 5) / mins), won = wpm >= OWNER.wpm, vs = $('#tt-vs');
    $('#r-wpm').textContent = wpm;
    $('#r-acc').textContent = T.typed ? Math.round(T.correct / T.typed * 100) : 100;
    $('#r-raw').textContent = Math.round((T.typed / 5) / mins);
    $('#r-time').textContent = sec.toFixed(1);
    vs.className = 'tt-vs' + (won ? ' win' : '');
    vs.innerHTML = '<i>' + (won ? '✓' : '×') + '</i><span>' + (won ? 'you beat ' : 'you didn\'t beat ') + OWNER.name + ' · ' + OWNER.wpm + ' wpm</span>';
    play.hidden = true; resEl.hidden = false; tt.classList.add('done'); tt.scrollTop = 0;
    inp.blur();
  }
  function ttKey(e) {
    if (e.key === 'Tab') { e.preventDefault(); ttReset(); return; }
    if (T.done || e.ctrlKey || e.metaKey || e.altKey) return;
    var isChar = e.key.length === 1;
    if (!T.t0 && isChar) {
      T.t0 = Date.now(); box.classList.add('run');
      T.timer = setInterval(function () { stats((Date.now() - T.t0) / 1000); }, 500);
    }
    var w = T.list[T.wi];
    if (e.key === ' ') {
      e.preventDefault();
      if (!T.cur.length) return;
      blip(); var okWord = T.cur === w;
      T.typed++; if (okWord) T.correct++;
      pressKey(' ', false);
      T.typedAt[T.wi] = T.cur; paintWord(T.wi);
      if (!okWord) T.el[T.wi].classList.add('wrong');
      T.wi++; T.cur = '';
      if (T.wi >= T.list.length) { finish(); return; }
    } else if (e.key === 'Backspace') {
      T.cur = T.cur.slice(0, -1); paintWord(T.wi);
    } else if (isChar) {
      if (T.cur.length >= w.length + 6) return;
      blip();
      var pos = T.cur.length, good = w.charAt(pos) === e.key;
      T.cur += e.key; T.typed++; if (good) T.correct++;
      pressKey(e.key.toLowerCase(), !good);
      paintWord(T.wi);
      if (T.wi === T.list.length - 1 && T.cur === w) { T.correct++; T.typed++; T.typedAt[T.wi] = T.cur; T.wi++; stats((Date.now() - T.t0) / 1000); finish(); return; }
    } else return;
    stats(T.t0 ? (Date.now() - T.t0) / 1000 : 0);
    moveCaret(); setNext();
  }
  /* desktop: real key events (we cancel them so the hidden input never changes).
     phones: the virtual keyboard sends no usable key events, so the hidden input's value is diffed against the typed word */
  function ttKeydown(e) {
    if (T.done) { if (e.key === 'Enter') { e.preventDefault(); ttReset(); inp.focus(); } else ttKey(e); return; }
    var handled = !e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace');
    ttKey(e);
    if (handled && !T.done) { e.preventDefault(); inp.value = T.cur; }
  }
  var noop = function () {};
  inp.addEventListener('input', function () {
    if (T.done) { inp.value = ''; return; }
    var v = inp.value.replace(/[\r\n]/g, ''), c = T.cur, i = 0;
    while (i < c.length && i < v.length && c.charAt(i) === v.charAt(i)) i++;
    for (var k = c.length; k > i; k--) ttKey({ key: 'Backspace', preventDefault: noop });
    for (var j = i; j < v.length && !T.done; j++) ttKey({ key: v.charAt(j), preventDefault: noop });
    if (!T.done && inp.value !== T.cur) inp.value = T.cur;
  });
  /* tapping anywhere on the test brings the phone keyboard back */
  tt.addEventListener('click', function (e) { if (!T.done && !e.target.closest('.x')) inp.focus(); });
  function openTT() { show(tt); ttReset(); inp.focus(); }
  $('#tt-open').addEventListener('click', openTT);
  $('#tt-again').addEventListener('click', function () { ttReset(); inp.focus(); });
  addEventListener('resize', function () { if (openModal === tt && !T.done) { T.lh = 0; moveCaret(); } });

  /* ---------- community chat (local demo, no server) ---------- */
  var chat = $('#chat'), clog = $('#chat-log'), cin = $('#chat-in');
  var seedMsgs = [['Maria', 'hey everyone 👋'], ['Alex', 'just shipped my first app!'], ['Rob', 'let\'s go. what are you working on?']];
  function addMsg(n, t, me) { var p = document.createElement('p'); if (me) p.className = 'me'; var s = document.createElement('small'); s.textContent = n; p.appendChild(s); p.appendChild(document.createTextNode(t)); clog.appendChild(p); clog.scrollTop = clog.scrollHeight; }
  seedMsgs.forEach(function (m) { addMsg(m[0], m[1]); });
  $('#chat-open').addEventListener('click', function () { show(chat); cin.focus(); });
  $('#chat-form').addEventListener('submit', function (e) { e.preventDefault(); var t = cin.value.trim(); if (!t) return; addMsg('you', t, true); cin.value = ''; });

  /* ---------- guided tour: cursor glides, page scrolls itself, bubble explains ---------- */
  var cursor = $('#cursor'), bubble = $('#bubble'), btext = $('#bubble-text'), skip = $('#tour-skip');
  var steps = [
    ['h1', "Hi! I'm Rob, welcome to my website! 👋"],
    /* phones/tablets: the tour taps the menu button, walks the whole menu, then closes it ('m' = mobile only) */
    ['#menu-open', 'Tap the menu to see every page.', 'm-open'],
    ['#side .nav a[href="#summary"]', 'Summary: a quick intro to me.', 'm'],
    ['#side .nav a[href="/experience"]', 'Experience: my roles and work.', 'm'],
    ['#side .nav a[href="/education"]', 'Education: where I studied.', 'm'],
    ['#side .nav a[href="/tools"]', 'Tools: what I use every day.', 'm'],
    ['#side .nav a[href="/projects"]', 'Projects: things I have built.', 'm'],
    ['#side .nav a[href="/services"]', 'Services: how I can help you.', 'm'],
    ['#side .nav a[href="/consulting"]', 'Consulting: work with me.', 'm'],
    ['#side .nav a[href="/collabs"]', 'Collabs: companies I worked with.', 'm'],
    ['#ask-open', 'Ask me anything right here.', 'm'],
    ['#tt-open', 'Try the typing test.', 'm'],
    ['.vline', 'See who is viewing the site now.', 'm-close'],
    ['#nav-consulting', 'Want to work together? Reach out here.', true],
    ['.nums a:nth-child(2)', 'A quick look at my experience, roles and degree.'],
    ['#collabs', 'Companies I have worked with.'],
    ['#summary .sh h2', 'A short summary of what I do.'],
    ['#experience .sh h2', 'My roles, from Miqa to freelance work.'],
    ['#education .sh h2', 'Where I studied.'],
    ['#skills .sh h2', 'The tools and strengths I work with.'],
    ['#contact .big', 'Say hello. I read every email.']
  ];
  var tIdx = 0, tOn = false, timers = [], hl = null;
  function tourVis(on) { [cursor, bubble, skip].forEach(function (el) { if (on) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); }); paintPill(); }
  /* floating "take the tour again" pill: hidden during a tour or once dismissed */
  var pill = $('#tour-pill'), pillGone = false;
  try { pillGone = sessionStorage.getItem('pillGone') === '1'; } catch (e) {}
  function paintPill() { pill.hidden = tOn || pillGone; }
  paintPill();
  function nearestStep() {
    var atTop = scrollY < 200;
    for (var i = 0; i < steps.length; i++) {
      if (steps[i][2] && !atTop) continue;
      var el = $(steps[i][0]); if (!el) continue;
      if (atTop || el.getBoundingClientRect().top > 100) return i;
    }
    return steps.length - 1;
  }
  $('#tour-pill-go').addEventListener('click', function () { tourStart(true); });
  $('#tour-pill-x').addEventListener('click', function () { pillGone = true; try { sessionStorage.setItem('pillGone', '1'); } catch (e) {} paintPill(); });
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function place(el, text) {
    var r = el.getBoundingClientRect();
    /* measure the final (full-message) size so the bubble opens in the right direction */
    var prev = btext.textContent;
    btext.textContent = text != null ? text : (steps[tIdx] ? steps[tIdx][1] : prev);
    var bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    btext.textContent = prev;
    /* headings / short targets: park the cursor just beside the text and open the bubble to the SIDE, so it never covers what it points at */
    var tr = r;
    try { var rg = document.createRange(); rg.selectNodeContents(el); var b = rg.getBoundingClientRect(); if (b.width) tr = b; } catch (e) {}
    var side = null, inUI = !!el.closest('#side, .top'), roomAbove = tr.top > bh + 50;
    if (tr.height < 150 && (inUI || !roomAbove)) {
      var cy = tr.top + Math.min(tr.height / 2, 36) - 12;
      if (tr.right + 14 + 20 + bw <= innerWidth - 12) side = { x: tr.right + 10, y: cy, left: false };
      else if (tr.left - 30 - bw >= 12) side = { x: tr.left - 30, y: cy, left: true };
    }
    if (side) {
      /* cursor sits beside the label; the bubble hangs just below-right of it (never over the label) */
      var sy = Math.max(8, Math.min(innerHeight - bh - 40, side.y));
      cursor.style.transform = 'translate(' + side.x + 'px,' + sy + 'px)';
      bubble.classList.toggle('left', side.left); bubble.classList.remove('up');
      var sx = side.left ? side.x + 8 : side.x + 12;
      var by = Math.max(8, Math.min(innerHeight - bh - 8, sy + 22));
      bubble.style.transform = 'translate(' + sx + 'px,' + by + 'px)';
      return;
    }
    /* page content: cursor at the top-left of the target, bubble above-right of it so the text stays readable */
    if (tr.height < 150 && tr.top > bh + 50) {
      var ux = Math.max(8, Math.min(innerWidth - 40, tr.left - 4)), uy = tr.top - 16;
      cursor.style.transform = 'translate(' + ux + 'px,' + uy + 'px)';
      bubble.classList.remove('left'); bubble.classList.add('up');
      var bx = Math.max(8, Math.min(innerWidth - bw - 8, ux + 16));
      bubble.style.transform = 'translate(' + bx + 'px,' + (uy + 6) + 'px)';
      return;
    }
    var x = r.left + Math.min(r.width * 0.55, 150), y = r.top + r.height * 0.65;
    x = Math.max(8, Math.min(innerWidth - 40, x)); y = Math.max(8, Math.min(innerHeight - 40, y));
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    var left = x + 18 + bw > innerWidth - 12, up = y + 22 + bh > innerHeight - 56;
    bubble.classList.toggle('left', left); bubble.classList.toggle('up', up);
    /* keep the whole bubble (at its final size) inside the viewport */
    var ax = left ? Math.max(x + 6, bw + 8) : Math.min(x + 18, innerWidth - bw - 8);
    ax = Math.min(ax, innerWidth - 8);
    var ay = up ? Math.max(y - 6, bh + 8) : Math.min(y + 22, innerHeight - bh - 8);
    bubble.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
  }
  function typeText(str, done) {
    btext.textContent = ''; var i = 0; bubble.classList.add('typing');
    (function tick() {
      btext.textContent = str.slice(0, ++i);
      var ch = str.charAt(i - 1); if (ch !== ' ') blip(1500 + Math.random() * 500, 0.018, 0.016); /* soft typewriter tick */
      if (i < str.length) later(tick, 22); else { bubble.classList.remove('typing'); done && done(); }
    })();
  }
  /* true = desktop-sidebar step; 'm...' = phone-menu steps */
  function stepSkipped(st) {
    var k = st[2];
    if (k === true) return innerWidth < 1024 || getComputedStyle(side).display === 'none';
    if (typeof k === 'string') return innerWidth >= 1024;
    return false;
  }
  function tourShow() {
    if (!tOn) return;
    if (hl) hl.classList.remove('tour-hl');
    while (tIdx < steps.length && stepSkipped(steps[tIdx])) tIdx++;
    if (tIdx >= steps.length) { blip(659, 0.3, 0.05); setTimeout(function () { blip(880, 0.3, 0.045); }, 110); setTimeout(function () { blip(1175, 0.45, 0.04); }, 220); tourEnd(); return; }
    var el = $(steps[tIdx][0]);
    if (!el) { tIdx++; tourShow(); return; }
    var r = el.getBoundingClientRect();
    var inFixed = !!el.closest('.top, #side');
    var inView = el.closest('.top') ? true : inFixed ? (r.top > 50 && r.bottom < innerHeight - 90) : (r.top > 90 && r.bottom < innerHeight - 140);
    if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btext.textContent = ''; /* bubble shrinks to just the name while it travels */
    later(function () {
      if (steps[tIdx][0] !== 'h1') { hl = el.closest('.sh, .stats, #collabs, .eyebrow') || el; hl.classList.add('tour-hl'); } else hl = null;
      place(el, steps[tIdx][1]); blip(784, 0.35, 0.05); blip(1046, 0.4, 0.035);
      later(function () {
        typeText(steps[tIdx][1], function () {
          var kind = steps[tIdx][2], isMenu = typeof kind === 'string';
          later(function () {
            if (kind === 'm-open') { blip(520, 0.06, 0.05); openMenu(); tIdx++; later(tourShow, 1100); return; }
            if (kind === 'm-close') { if (hl) hl.classList.remove('tour-hl'); closeMenu(); tIdx++; later(tourShow, 700); return; }
            tIdx++; tourShow();
          }, isMenu ? 1500 : 2600);
        });
      }, 1150);
    }, inView ? 150 : 950);
  }
  function tourStart(here) {
    hideAll(); closeMenu(true);
    tOn = true; tIdx = here === true ? nearestStep() : 0; clearTimers();
    tourVis(true); bubble.style.opacity = '1'; btext.textContent = '';
    cursor.style.transform = 'translate(' + innerWidth * 0.5 + 'px,' + innerHeight * 0.4 + 'px)';
    bubble.style.transform = 'translate(' + innerWidth * 0.5 + 'px,' + innerHeight * 0.4 + 'px)';
    if (here !== true) scrollTo({ top: 0, behavior: 'smooth' });
    later(tourShow, 600);
  }
  function tourEnd() {
    tOn = false; clearTimers(); bubble.classList.remove('typing');
    if (hl) hl.classList.remove('tour-hl');
    tourVis(false);
    try { localStorage.setItem('toured', '1'); } catch (e) {}
  }
  skip.addEventListener('click', tourEnd);
  /* any tap / click / scroll cancels the tour (desktop + mobile); pointerdown fires before the click so the buttons still work */
  ['wheel', 'touchmove'].forEach(function (ev) { addEventListener(ev, function () { if (tOn) tourEnd(); }, { passive: true }); });
  addEventListener('pointerdown', function () { if (tOn) tourEnd(); }, { capture: true, passive: true });
  addEventListener('resize', function () { if (tOn && steps[tIdx]) { var el = $(steps[tIdx][0]); el && place(el); } });
  /* auto tour */
  /* once per visit: runs when the page is opened, but not again after a refresh (flag lives in sessionStorage) */
  function autoTour() {
    var ran = false; try { ran = sessionStorage.getItem('tourRan') === '1'; } catch (e) {}
    if (ran) return;
    try { sessionStorage.setItem('tourRan', '1'); } catch (e) {}
    setTimeout(function () { if (!openModal && !tOn && !root.classList.contains('menu-open')) tourStart(); }, 1800);
  }
  if (document.readyState === 'complete') autoTour(); else addEventListener('load', autoTour);

  /* ---------- keyboard ---------- */
  addEventListener('keydown', function (e) {
    var combo = isMac ? e.metaKey : e.altKey;
    if (openModal === tt) { if (e.key === 'Escape') hideAll(); else ttKeydown(e); return; }
    if (openModal === ask) {  /* page shortcuts stay off while Ask anything is open */
      if (e.key === 'Escape') hideAll();
      else if (!busy && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== askIn) askIn.focus();
      return;
    }
    if (combo && e.code === 'KeyK') { e.preventDefault(); openAsk(); return; }
    if (combo && e.code === 'KeyJ') { e.preventDefault(); openTT(); return; }
    if (e.key === 'Escape') { hideAll(); closeMenu(true); if (tOn) tourEnd(); return; }
    var typing = /INPUT|TEXTAREA/.test((e.target.tagName || ''));
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'd') applyMode(root.dataset.theme === 'dark' ? 'light' : 'dark');
    else if (e.key === 't') scrollTo({ top: 0, behavior: 'smooth' });
    else if (e.key === 'c') { show(chat); setTimeout(function () { cin.focus(); }, 30); e.preventDefault(); }
    else if (e.key === 'g') tourStart();
  });
  /* opened from another page via index.html?open=ask|tt|chat */
  (function () {
    var m = location.search.match(/[?&]open=(\w+)/), k = m && m[1];
    if (k === 'ask') openAsk(); else if (k === 'tt') openTT(); else if (k === 'chat') { show(chat); cin.focus(); }
  })();
})();
