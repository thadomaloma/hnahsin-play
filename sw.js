// Hnahsin Games offline: the pages, their scripts and fonts are kept on the
// phone, so the games open without internet. Pages are fetched fresh when
// online (so updates show), and fall back to the kept copy when offline, or
// when the network is too slow to answer in a few seconds.
// The pages ask for audio.js and progress.js without a fingerprint, so they are kept under those names;
// each release's new VERSION fetches them fresh.
//
// Kept from one release to the next, so a release does not fetch them all again:
//  - FIXED: what never changes under its own address: our files with a fingerprint (?v=…), and the
//    game engines and libraries, whose version is in their address. Only the newest of each is kept.
//  - APP: the Flutter app under app/ (some 10 MB, kept as it is fetched). Bump APP when app/ changes.
const VERSION = 'hnahsin-151', FIXED = 'hnahsin-fixed', APP = 'hnahsin-app-1';
const CORE = [
  './', 'index.html', 'theme.css?v=d03db89c', 'home.js?v=3dc16de9', 'rova.js?v=f35ca6fa', 'stats.js?v=ff1d2eba', 'audio.js', 'progress.js', 'journey.html', 'pics/rova-sheet.webp?v=b2946a39', 'playground.html', 'things.html', 'ride.html', 'ride/city.json?v=9463910e', 'pics/ride.jpg', 'pics/things-zokhua.webp', 'pics/things-zokhua.json', 'pics/things-kumtluang.webp', 'pics/things-kumtluang.json', 'pics/things-loom.svg', 'pics/things-loom.json', 'pics/things-bazar.webp', 'pics/things-bazar.json',
  'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.module.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.core.min.js',
];

const fixed = url => /[?&]v=[0-9a-f]+/.test(url) || /^https:\/\/(cdnjs\.cloudflare\.com\/ajax\/libs|cdn\.jsdelivr\.net\/npm)\/[^/]+\/\d/.test(url) || /^https:\/\/cdn\.jsdelivr\.net\/npm\/[^/@]+@\d/.test(url);
const ok = res => res && (res.ok || res.type === 'opaque');

// a fixed file into FIXED, dropping any older one at the same address (an old fingerprint)
const keepFixed = async (req, res) => {
  const c = await caches.open(FIXED), u = new URL(req.url || req, location.href);
  for (const k of await c.keys()) { const o = new URL(k.url); if (o.origin === u.origin && o.pathname === u.pathname && o.href !== u.href) await c.delete(k); }
  await c.put(req, res);
};

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(CORE.map(async path => {
      const url = new URL(path, location.href).href;
      if (fixed(url)) {
        const hit = await caches.match(url);      // (kept already, by this release or an older one: nothing to fetch)
        if (hit) { if (!(await (await caches.open(FIXED)).match(url))) await keepFixed(url, hit); return; }
        const res = await fetch(url); if (!ok(res)) throw new Error(path); await keepFixed(url, res); return;
      }
      const res = await fetch(url, { cache: 'no-cache' }); if (!ok(res)) throw new Error(path); await c.put(path, res);
    }));
    // what older releases kept as it was asked for: the fixed files into FIXED, the app's into APP (not fetched again)
    for (const k of await caches.keys()) {
      if (k === VERSION || k === FIXED || k === APP) continue;
      const old = await caches.open(k), app = await caches.open(APP);
      for (const r of await old.keys()) {
        if (new URL(r.url).pathname.includes('/app/')) { if (!(await app.match(r))) await app.put(r, await old.match(r)); }
        else if (fixed(r.url) && !(await caches.match(r, { cacheName: FIXED }))) await keepFixed(r, await old.match(r));
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FIXED && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => {
  if (ok(res)) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Video goes straight to the network: it comes in ranges, which a kept copy cannot answer
  if (req.headers.has('range') || /\.(mp4|webm)$/.test(url.pathname)) return;
  const mine = url.origin === location.origin;
  // The app (Flutter): its files are big, so once fetched they are kept and served
  // from the phone at once, refreshed in the background.
  if (mine && url.pathname.includes('/app/')) {
    e.respondWith(caches.open(APP).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
      const fresh = fetch(req).then(res => { if (ok(res)) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    })));
    return;
  }

  if (req.mode === 'navigate') {
    // GitHub lets browsers reuse a page for 10 minutes; ask the server each time instead
    // (a quick “has it changed?”), so an update shows on the next open. If the network has not answered in
    // three seconds, the kept page opens instead (the new one is still kept, for next time).
    const net = fetch(req, { cache: 'no-cache' }).then(res => keep(req, res));
    const kept = () => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const slow = setTimeout(() => kept().then(hit => { if (hit && !done) { done = true; resolve(hit); } }), 3000);
      net.then(res => { clearTimeout(slow); if (!done) { done = true; resolve(res); } })
        .catch(() => { clearTimeout(slow); kept().then(hit => { if (!done) { done = true; resolve(hit || Response.error()); } }); });
    }));
    e.waitUntil(net.catch(() => {}));
    return;
  }

  // Files of ours, fonts and the game engine (and its loaders)
  if (!mine && !/(^|\.)fonts\.(googleapis|gstatic)\.com$|^cdnjs\.cloudflare\.com$|^cdn\.jsdelivr\.net$/.test(url.hostname)) return;
  // what never changes under its address: from the phone at once, from the network only the first time
  if (fixed(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (ok(res)) { const copy = res.clone(); e.waitUntil(keepFixed(req, copy)); } return res; })));
    return;
  }
  // the rest: from the phone at once, refreshed in the background
  e.respondWith(caches.match(req).then(hit => {
    const fresh = fetch(req).then(res => keep(req, res)).catch(() => hit);
    return hit || fresh;
  }));
});
