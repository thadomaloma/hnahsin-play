# Builds ../../playground.html for the web site, and preview.html (no page skeleton) for a Claude preview.
import json
t = open('template.html', encoding='utf-8').read()
data = open('data.json', encoding='utf-8').read().strip()
dct = json.dumps([[w[0], w[1], w[7], w[5]] for w in json.load(open('../journey/dict_words.json', encoding='utf-8'))], ensure_ascii=False, separators=(',', ':'))
puz = open('puzzles.json', encoding='utf-8').read().strip()
rova = open('../../rova.js', encoding='utf-8').read().strip()
figures = open('figures.js', encoding='utf-8').read().strip()
for key, value in [('__DATA__', data), ('__DICT__', dct), ('__PUZZLES__', puz), ('__ROVA__', rova), ('__FIGURES__', figures), ('__STATS__', open('../../stats.js', encoding='utf-8').read().strip())]:
    assert t.count(key) == 1, key
    t = t.replace(key, value)
open('preview.html', 'w', encoding='utf-8').write(t)
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#3c9fea"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Hnahsin"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="icon" href="favicon.png" type="image/png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><script>if (\'serviceWorker\' in navigator) addEventListener(\'load\', () => navigator.serviceWorker.register(\'sw.js\'));</script></head><body>\n'
open('../../playground.html', 'w', encoding='utf-8').write(head + t + '\n</body></html>\n')
