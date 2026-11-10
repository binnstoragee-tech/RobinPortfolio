/* Clean URLs work on Vercel / Node. Live Server (port 55xx) can't serve /education, so there
   we point the links at the real file (/education.html). Does nothing in production. */
(function () {
  if (!/^55\d\d$/.test(location.port)) return;
  var RE = /^\/(experience|education|tools|projects|services|consulting|collabs|companies)(?=[?#]|$)/;
  function fix(a) {
    var h = a.getAttribute('href');
    if (h && RE.test(h)) a.setAttribute('href', h.replace(RE, '/$1.html'));
  }
  function fixAll() { document.querySelectorAll('a[href^="/"]').forEach(fix); }
  fixAll();
  /* links added later (e.g. chat answers) are fixed right before they are followed */
  ['mouseover', 'focusin', 'mousedown', 'click'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var a = e.target.closest && e.target.closest('a[href^="/"]');
      if (a) fix(a);
    }, true);
  });
})();
