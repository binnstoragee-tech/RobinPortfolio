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
  $$('.mode button').forEach(function (b) { b.addEventListener('click', function () { applyMode(b.dataset.mode); }); });
  mq.addEventListener && mq.addEventListener('change', function () { if (saved === 'system') applyMode('system'); });

  /* ---------- mobile menu ---------- */
  var side = $('#side');
  $('#menu-open').addEventListener('click', function () { side.classList.add('open'); });
  $('#menu-close').addEventListener('click', function () { side.classList.remove('open'); });
  $$('#side a').forEach(function (a) { a.addEventListener('click', function () { side.classList.remove('open'); }); });

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
  var sBtn = $('#sound'), sOn = false, actx = null;
  try { sOn = localStorage.getItem('sound') === 'on'; } catch (e) {}
  function paintSound() { sBtn.innerHTML = sOn ? sBtn.dataset.on : sBtn.dataset.off; }
  paintSound();
  sBtn.addEventListener('click', function () { sOn = !sOn; paintSound(); try { localStorage.setItem('sound', sOn ? 'on' : 'off'); } catch (e) {} blip(); });
  function blip() {
    if (!sOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 620; g.gain.value = 0.04; o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.03);
    } catch (e) {}
  }

  /* ---------- copy email ---------- */
  $('#copy-mail').addEventListener('click', function () {
    var b = this;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText('binnfrancisco@gmail.com').then(done, done); else done();
  });

  /* ---------- modal helpers ---------- */
  var openModal = null;
  function show(el) { hideAll(); el.hidden = false; openModal = el; }
  function hideAll() { $$('.modal,.chat').forEach(function (m) { m.hidden = true; }); openModal = null; }
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', hideAll); });
  $$('.modal').forEach(function (m) { m.addEventListener('mousedown', function (e) { if (e.target === m) hideAll(); }); });

  /* ---------- ask anything (answers about Robin) ---------- */
  var ask = $('#ask'), askIn = $('#ask-in'), askQ = $('#ask-q'), askLog = $('#ask-log'), step = 0, who = '';
  var MAIL = '<a href="mailto:binnfrancisco@gmail.com">binnfrancisco@gmail.com</a>';
  var KB = [
    [/^(hi|hello|hey|yo|hola|kumusta|kamusta)\b/, function () { return 'Hey ' + who + '! Ask me about my work, skills, education, services or how to reach me.'; }],
    [/thank|salamat|\bty\b/, function () { return 'You\'re welcome, ' + who + '! Anything else you\'d like to know?'; }],
    [/jenylyn|wife|asawa|misis|spouse|girlfriend|\bgf\b|fianc|jowa|married|kasal|relationship|life partner|family|pamilya|\bkids?\b|children|\banak\b/, 'My wife-to-be is <b>Jenylyn Forte</b> — soon to be Jenylyn Francisco.'],
    [/hobb|pastime|free time|libangan|mahilig|interests?\b|for fun|sports?\b|gaming|\bgames?\b|motor|\brid(e|es|ing)\b|gym|workout|exercise|fitness|basketball|volleyball/, 'Outside of work I love playing online games and riding my motorcycle. I also hit the gym, and I play basketball and volleyball.'],
    [/your name|what.?s your name|sino ka|who are you|who is robin|about (you|yourself|robin)|introduce|tell me about/, 'I\'m Robin Francisco — a graphic designer and social media / digital marketing manager. I create brand-aligned visuals for social media, web and promotional campaigns, taking work from concept to final delivery.'],
    [/where do you work|saan ka (nag)?trabaho|employer|company|current(ly)?|right now|miqa|job|ginagawa|what do you do|your (role|work|profession)/, 'Right now I\'m Digital Marketing Manager at Miqa Private Limited (since Oct 2025). I design graphics, ads and campaign content, and manage creative production across digital platforms.'],
    [/social space|freelanc/, 'I\'ve been a freelance Graphic Artist at Social Space since May 2021, doing digital marketing services including social media management and content creation.'],
    [/techfactors|intern|\bojt\b|on.the.job/, 'In Feb – May 2025 I did my OJT at Techfactors Inc. as a Graphic Designer — digital learning materials, infographics and marketing content for e-learning modules, using Photoshop, Illustrator and InDesign.'],
    [/experience|career|background|history|roles?\b|how long|years|worked/, 'I\'ve held 3 roles: Digital Marketing Manager at Miqa (Oct 2025 – present), freelance Graphic Artist at Social Space (May 2021 – present), and Graphic Designer intern at Techfactors Inc. (Feb – May 2025). That\'s 5+ years of freelancing.'],
    [/school|educat|study|studied|universit|college|degree|\bbsit\b|bulacan state|graduat|course|senior high|aral/, 'I earned a BS in Information Technology (Major in Service Management Program) at Bulacan State University (2021 – 2025). Before that I took the Accountancy, Business, and Management strand at Iba National Senior High School (2019 – 2021).'],
    [/\bai\b|artificial|generative|chatgpt|openai|claude|gemini|perplexity/, 'These days I\'m focused on generative AI. If you want to talk about it, email me at ' + MAIL + '.'],
    [/this (site|website|page|portfolio)|who (made|built|created|designed|developed)|how (was|is) (this|the) (site|website)|tech stack|built with|shortcut|keyboard|typing test|dark mode|light mode|theme|community chat/, 'This portfolio is built with plain HTML, CSS and JavaScript and deployed on Vercel. You can ask me anything (Alt + K), take a typing test (Alt + J), jump into the community chat, and switch between light, dark and system mode.'],
    [/build(ing)? (me )?(a |an )?(web)?sites?|make (me )?(a |an )?(web)?sites?|need (a |an )?(web)?sites?|web ?(dev|development|design)|landing page|e-?commerce|online (store|shop)|catalog|ordering system|admin panel/, 'Yes, I build custom websites and web apps — responsive sites, landing pages, portfolios, and catalog / ordering systems with an admin panel and database. I use HTML, CSS and JavaScript with Supabase and PostgreSQL. Web Development starts at <b>$1,000</b> per project. See the <a href=\"/services\">services page</a> or email me at ' + MAIL + '.'],
    [/code|coding|program|developer|html|css|javascript|\bjs\b|web ?dev|website|supabase|postgres|database|backend|sql/, 'I build with HTML, CSS and JavaScript, and I use Supabase and PostgreSQL for the backend and database side.'],
    [/skill|tool|software|adobe|photoshop|illustrator|premiere|indesign|canva|capcut|strength|good at|expert/, 'Design & video: Photoshop, Illustrator, InDesign, After Effects, Premiere Pro, Canva and CapCut. Marketing & dev tools: Meta Business Suite, Meta Pixel, GitHub and Vercel. AI agents & automation: Claude, Gemini, ChatGPT, Google Flow, Meta AI and n8n. Code: HTML, CSS and JavaScript, with Supabase and PostgreSQL. Core strengths: communication, team collaboration, problem-solving and critical thinking.'],
    [/price|pricing|rate|cost|how much|magkano|package|plan|starter|basic|growth|fee|charge|budget/, 'I offer monthly social media packages: <b>Starter $99</b> (10 posts, basic graphics, 3 reels), <b>Basic $249</b> (12 posts, 10 reels, stories, FB &amp; IG ads management) and <b>Growth $399</b> (full management, 20 posts, 15 reels, campaign planning, monthly reports). For websites, <b>Web Development</b> starts at <b>$1,000</b> per project. Full details on the <a href="/services">services page</a>.'],
    [/service|offer|hire|available|availab|open to|work with|social media|ads?\b|campaign|reels?|content|design for/, 'I do social media management, graphic design, reels and short videos, content strategy and ads management, sold as monthly packages. See the <a href="/services">services page</a>, or email me at ' + MAIL + '.'],
    [/resume|\bcv\b|download/, 'You can download my resume with the “resume ↓” link at the top of the page.'],
    [/contact|e-?mail|reach|message|phone|call|number|whatsapp|viber|mobile|text you|get in touch|collab/, 'Email: ' + MAIL + '<br>Phone: <a href=\"tel:+639695159058\">+63 969 515 9058</a><br>You can also send an inquiry on the Collabs page. I\'m open to work and collabs.'],
    [/where|location|based|live|country|city|maldives|philippines|male|taga|nasaan|address/, 'I keep my location private. The best way to reach me is email: ' + MAIL + ', or send an inquiry on the Collabs page.']
  ];
  var FALLBACK = 'I don\'t have an answer for that yet. Try asking about my work, skills, education or services — or email me at ' + MAIL + '.';
  var CHIPS = ['Who are you?', 'What do you do?', 'Experience', 'Skills', 'Hobbies', 'Pricing', 'Contact'];
  function answer(q) {
    var t = q.toLowerCase().replace(/[^\w\s?&.'-]/g, ' ');
    for (var i = 0; i < KB.length; i++) {
      if (KB[i][0].test(t)) return typeof KB[i][1] === 'function' ? KB[i][1]() : KB[i][1];
    }
    return FALLBACK;
  }
  var chipBox = document.createElement('div'); chipBox.className = 'ask-chips'; chipBox.hidden = true;
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
    b.addEventListener('click', function () { say(c); });
    chipBox.appendChild(b);
  });
  askLog.parentNode.insertBefore(chipBox, askLog);
  var askTok = 0;
  function askBubble(t, cls, html) {
    var p = document.createElement('p'); p.className = cls || 'bot';
    if (html) p.innerHTML = t; else p.textContent = t;
    askLog.appendChild(p); askLog.scrollTop = askLog.scrollHeight; return p;
  }
  /* auto-reply: shows "…" then types the answer out letter by letter (links/bold keep working) */
  function botType(html, done) {
    var tok = askTok, p = askBubble('…', 'bot typing');
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
    }, 520);
  }
  function say(q) { askBubble(q, 'me'); botType(answer(q)); }
  function openAsk() {
    show(ask); step = 0; who = ''; askTok++; askLog.innerHTML = ''; chipBox.hidden = true;
    askQ.textContent = 'what do you want to ask?'; askIn.placeholder = "what's your name?"; askIn.value = '';
    botType('Hi! I\'m Rob — ask me anything about me. First, what should I call you?');
    setTimeout(function () { askIn.focus(); }, 30);
  }
  $('#ask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var val = askIn.value.trim(); if (!val) return;
    askIn.value = '';
    if (step === 0) {
      who = val; step = 1; askIn.placeholder = 'ask me anything about me…';
      askBubble(who, 'me');
      botType('Nice to meet you, ' + who.replace(/[<>&]/g, '') + '! Ask me anything about me — my work, skills, education, services or how to reach me.', function () { chipBox.hidden = false; });
    } else {
      say(val);
    }
  });
  $('#ask-open').addEventListener('click', openAsk);

  /* ---------- typing test ---------- */
  var tt = $('#tt'), box = $('#tt-words'), kb = $('#tt-kb');
  var WORDS = 'build ship code design learn think make fast simple clean modern useful future ideas people world focus write test quick data model system mobile cloud launch create improve team share open great real time every day better start keep going small steps matter brand social media content visual story color layout motion pixel'.split(' ');
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
    T.list = []; for (var i = 0; i < 40; i++) T.list.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    T.wi = 0; T.cur = ''; T.typed = 0; T.correct = 0; T.t0 = 0; T.done = false; T.typedAt = []; T.lh = 0;
    box.innerHTML = ''; box.style.transform = ''; box.appendChild(ttHl); box.appendChild(caret);
    T.el = T.list.map(function (w) { var s = document.createElement('span'); s.className = 'w'; box.appendChild(s); box.appendChild(document.createTextNode(' ')); return s; });
    T.list.forEach(function (w, i) { paintWord(i); });
    $('#tt-result').hidden = true; kb.hidden = false; stats(0);
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
    $('#r-wpm').textContent = Math.round((T.correct / 5) / mins);
    $('#r-acc').textContent = (T.typed ? Math.round(T.correct / T.typed * 100) : 100) + '%';
    $('#r-raw').textContent = Math.round((T.typed / 5) / mins);
    $('#r-time').textContent = Math.round(sec) + 's';
    $('#tt-result').hidden = false; kb.hidden = true;
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
  function openTT() { show(tt); ttReset(); }
  $('#tt-open').addEventListener('click', openTT);
  $('#tt-again').addEventListener('click', ttReset);
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
    var x = r.left + Math.min(r.width * 0.55, 150), y = r.top + r.height * 0.65;
    x = Math.max(8, Math.min(innerWidth - 40, x)); y = Math.max(8, Math.min(innerHeight - 40, y));
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    /* measure the final (full-message) size so the bubble opens in the right direction */
    var prev = btext.textContent;
    btext.textContent = text != null ? text : (steps[tIdx] ? steps[tIdx][1] : prev);
    var bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    btext.textContent = prev;
    var left = x + 18 + bw > innerWidth - 12, up = y + 22 + bh > innerHeight - 56;
    bubble.classList.toggle('left', left); bubble.classList.toggle('up', up);
    bubble.style.transform = 'translate(' + (left ? x + 6 : x + 18) + 'px,' + (up ? y - 6 : y + 22) + 'px)';
  }
  function typeText(str, done) {
    btext.textContent = ''; var i = 0;
    (function tick() { btext.textContent = str.slice(0, ++i); if (i < str.length) later(tick, 22); else done && done(); })();
  }
  function tourShow() {
    if (!tOn) return;
    if (hl) hl.classList.remove('tour-hl');
    while (tIdx < steps.length && steps[tIdx][2] && getComputedStyle(side).display === 'none') tIdx++;
    if (tIdx >= steps.length) { tourEnd(); return; }
    var el = $(steps[tIdx][0]);
    if (!el) { tIdx++; tourShow(); return; }
    var r = el.getBoundingClientRect();
    var inView = r.top > 90 && r.bottom < innerHeight - 140;
    if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btext.textContent = ''; /* bubble shrinks to just the name while it travels */
    later(function () {
      if (steps[tIdx][0] !== 'h1') { hl = el.closest('.sh, .stats, #collabs, .eyebrow') || el; hl.classList.add('tour-hl'); } else hl = null;
      place(el, steps[tIdx][1]);
      later(function () {
        typeText(steps[tIdx][1], function () { later(function () { tIdx++; tourShow(); }, 2600); });
      }, 1150);
    }, inView ? 150 : 950);
  }
  function tourStart(here) {
    hideAll(); side.classList.remove('open');
    tOn = true; tIdx = here === true ? nearestStep() : 0; clearTimers();
    tourVis(true); bubble.style.opacity = '1'; btext.textContent = '';
    cursor.style.transform = 'translate(' + innerWidth * 0.5 + 'px,' + innerHeight * 0.4 + 'px)';
    bubble.style.transform = 'translate(' + innerWidth * 0.5 + 'px,' + innerHeight * 0.4 + 'px)';
    if (here !== true) scrollTo({ top: 0, behavior: 'smooth' });
    later(tourShow, 600);
  }
  function tourEnd() {
    tOn = false; clearTimers();
    if (hl) hl.classList.remove('tour-hl');
    tourVis(false);
    try { localStorage.setItem('toured', '1'); } catch (e) {}
  }
  skip.addEventListener('click', tourEnd);
  ['wheel', 'touchmove'].forEach(function (ev) { addEventListener(ev, function () { if (tOn) tourEnd(); }, { passive: true }); });
  addEventListener('resize', function () { if (tOn && steps[tIdx]) { var el = $(steps[tIdx][0]); el && place(el); } });
  var seen = false; try { seen = localStorage.getItem('toured') === '1'; } catch (e) {}
  if (!seen) addEventListener('load', function () { setTimeout(tourStart, 2600); });

  /* ---------- keyboard ---------- */
  addEventListener('keydown', function (e) {
    var combo = isMac ? e.metaKey : e.altKey;
    if (openModal === tt) { if (e.key === 'Escape') hideAll(); else ttKey(e); return; }
    if (combo && e.code === 'KeyK') { e.preventDefault(); openAsk(); return; }
    if (combo && e.code === 'KeyJ') { e.preventDefault(); openTT(); return; }
    if (e.key === 'Escape') { hideAll(); side.classList.remove('open'); if (tOn) tourEnd(); return; }
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
