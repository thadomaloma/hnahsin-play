# Builds ../../journey.html for the web site, and preview.html (no page skeleton) for a Claude preview.
t = open('template.html', encoding='utf-8').read()
for key, f in [('__WORDS__', 'words.json'), ('__DICT__', 'dict_words.json'), ('__SAYINGS__', 'sayings.json'), ('__ROVA__', '../../rova.js')]:
    assert t.count(key) == 1, key
    t = t.replace(key, open(f, encoding='utf-8').read().strip())
open('preview.html', 'w', encoding='utf-8').write(t)
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#3c9fea"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Hnahsin"><link rel="icon" href="favicon.png" type="image/png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><script>if (\'serviceWorker\' in navigator) addEventListener(\'load\', () => navigator.serviceWorker.register(\'sw.js\'));</script></head><body>\n'
open('../../journey.html', 'w', encoding='utf-8').write(head + t + '\n</body></html>\n')
