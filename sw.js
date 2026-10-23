// Hnahsin Games offline: the pages, their scripts and fonts are kept on the
// phone, so the games open without internet. Pages are fetched fresh when
// online (so updates show), and fall back to the kept copy when offline.
// The Flutter app under app/ is kept as it is fetched (it is too big to fetch all up front).
const VERSION = 'hnahsin-7';
const CORE = [
  './', 'index.html', 'theme.css', 'home.js', 'rova.js', 'journey.html', 'playground.html',
  'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => {
  if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === location.origin;
  // The app (Flutter): its files are big, so once fetched they are kept and served
  // from the phone at once, refreshed in the background. Bump VERSION when app/ changes.
  if (mine && url.pathname.includes('/app/')) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
      const fresh = fetch(req).then(res => keep(req, res)).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => keep(req, res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }

  // Files of ours, fonts and the game engine: answer from the phone at once, refresh in the background.
  if (!mine && !/(^|\.)fonts\.(googleapis|gstatic)\.com$|^cdnjs\.cloudflare\.com$/.test(url.hostname)) return;
  e.respondWith(caches.match(req, { ignoreSearch: mine }).then(hit => {
    const fresh = fetch(req).then(res => keep(req, res)).catch(() => hit);
    return hit || fresh;
  }));
});
