"""Run after copying a new Flutter web build into app/ (from the repo root):
    python3 source/app_patch.py
Adds a loading screen in place of the blank page, and registers the site's
service worker so the app's files stay on the phone after the first visit.
Bump VERSION in sw.js whenever app/ changes."""
import re

p = 'app/index.html'
s = open(p, encoding='utf-8').read()
if 'id="boot"' not in s:
    splash = '''
  <style>
    html, body { margin: 0; height: 100%; background: #3c9fea; }
    #boot { position: fixed; inset: 0; display: grid; place-content: center; justify-items: center; gap: 18px;
      background: linear-gradient(180deg, #3c9fea, #8fd0fa 60%, #cdeeff); font-family: system-ui, -apple-system, sans-serif;
      transition: opacity .4s; z-index: 10; }
    #boot.gone { opacity: 0; pointer-events: none; }
    #boot .tiles { display: flex; gap: 6px; }
    #boot .tiles span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 9px; background: #fffdf7;
      color: #c2185b; font-weight: 900; font-size: 22px; box-shadow: 0 4px 0 #f8bbd0; animation: hop 1.2s ease-in-out infinite; }
    #boot .tiles span:nth-child(2) { animation-delay: .1s } #boot .tiles span:nth-child(3) { animation-delay: .2s }
    #boot .tiles span:nth-child(4) { animation-delay: .3s } #boot .tiles span:nth-child(5) { animation-delay: .4s }
    #boot .tiles span:nth-child(6) { animation-delay: .5s } #boot .tiles span:nth-child(7) { animation-delay: .6s }
    @keyframes hop { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-10px) } }
    #boot p { margin: 0; color: #0d47a1; font-weight: 700; font-size: 16px; text-align: center; max-width: 280px; line-height: 1.4; }
    #boot .bar { width: 220px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.6); overflow: hidden; }
    #boot .bar i { display: block; height: 100%; width: 30%; border-radius: 4px; background: #ffc94a; animation: slide 1.4s ease-in-out infinite; }
    @keyframes slide { from { transform: translateX(-100%) } to { transform: translateX(330%) } }
    @media (prefers-reduced-motion: reduce) { #boot * { animation: none !important } }
  </style>
'''
    s = s.replace('</head>', splash + '</head>', 1)
    s = s.replace('<body>', '''<body>
  <div id="boot" role="status" aria-live="polite">
    <div class="tiles" aria-hidden="true"><span>H</span><span>N</span><span>A</span><span>H</span><span>S</span><span>I</span><span>N</span></div>
    <div class="bar" aria-hidden="true"><i></i></div>
    <p id="boot-note">Loading the Hnahsin app…</p>
  </div>
  <script>
    // Hide the loading screen once Flutter draws its first frame.
    window.addEventListener('flutter-first-frame', () => {
      const b = document.getElementById('boot'); b.classList.add('gone'); setTimeout(() => b.remove(), 500);
    });
    // The first visit downloads the app (a few MB); say so if it takes a while.
    setTimeout(() => { const n = document.getElementById('boot-note'); if (n) n.textContent = 'First time takes a little longer. Next time it opens fast.'; }, 6000);
    // Keep the app's files on the phone (the site's service worker, one level up).
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../' });
  </script>''', 1)
    open(p, 'w', encoding='utf-8').write(s)
    print('patched app/index.html')
else:
    print('already patched')
