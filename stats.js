// Counts which pages and games are played, with GoatCounter: no cookies and
// nothing that identifies a person. hnStat('play/bee') counts one event.
// Change CODE if the GoatCounter site is named differently.
(function () {
  var CODE = 'hnahsin';
  var queue = [];
  window.hnStat = function (name, title) {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: title || name, event: true });
    else queue.push([name, title]);
  };
  // Count only on the real site, not while testing or in a preview.
  if (location.hostname !== 'thadomaloma.github.io') { window.hnStat = function () {}; return; }
  window.goatcounter = { no_onload: false };
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
  s.onload = function () {
    queue.forEach(function (q) { window.hnStat(q[0], q[1]); });
    queue = [];
  };
  document.head.appendChild(s);
})();
