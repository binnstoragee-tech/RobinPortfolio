/* experience timeline: live durations ("Present" keeps counting) + skills toggle */
(function () {
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function parse(v) { if (v === 'present') { var n = new Date(); return [n.getFullYear(), n.getMonth() + 1, true]; } var p = v.split('-'); return [+p[0], +p[1], false]; }
  function dur(a, b) {
    var m = (b[0] - a[0]) * 12 + (b[1] - a[1]) + 1, y = Math.floor(m / 12), r = m % 12, o = [];
    if (y) o.push(y + (y > 1 ? ' yrs' : ' yr')); if (r) o.push(r + (r > 1 ? ' mos' : ' mo'));
    return o.join(' ') || '1 mo';
  }
  document.querySelectorAll('[data-start]').forEach(function (el) {
    var a = parse(el.dataset.start), b = parse(el.dataset.end), d = dur(a, b);
    if (el.dataset.mode === 'dur') el.textContent = (el.dataset.prefix || '') + d;
    else el.textContent = MON[a[1] - 1] + ' ' + a[0] + ' – ' + (b[2] ? 'Present' : MON[b[1] - 1] + ' ' + b[0]) + ' · ' + d;
  });
  document.querySelectorAll('.sk .more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sk = btn.closest('.sk'), open = sk.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.textContent = open ? 'show less' : '+' + btn.dataset.n + ' skills';
    });
  });
})();
