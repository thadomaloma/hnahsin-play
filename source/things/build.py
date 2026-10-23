# Builds ../../things.html (Touch and learn) for the web site, and preview.html (no page skeleton) for a Claude preview.
# Every Mizo word a figure uses must be in the Hnahsin content (../journey/words.json) or the dictionary words
# (../journey/dict_words.json); the build stops if one is not.
import json, re
t = open('template.html', encoding='utf-8').read()
ink3d = open('ink3d.js', encoding='utf-8').read().strip()
people = open('people.js', encoding='utf-8').read().strip()
house = open('house.js', encoding='utf-8').read().strip()
loom = open('loom.js', encoding='utf-8').read().strip()

# The app's words first, then J.F. Laldailova's dictionary words (used with permission).
content = {}
for w in json.load(open('../journey/words.json', encoding='utf-8')):
    content.setdefault(w[0], w[1])
for w in json.load(open('../journey/dict_words.json', encoding='utf-8')):
    content.setdefault(w[0], w[1])
used = []
for fig in (house, loom):
    for w in re.findall(r"'([^']+)'", re.search(r'words: \[(.*?)\]', fig, re.S).group(1)):
        if w not in used: used.append(w)
missing = [w for w in used if w not in content]
assert not missing, f'not in the Hnahsin content: {missing}'
words = {w: content[w][0].lower() + content[w][1:] for w in used}

for key, value in [('__WORDS__', json.dumps(words, ensure_ascii=False)), ('__INK3D__', ink3d), ('__PEOPLE__', people), ('__HOUSE__', house), ('__LOOM__', loom),
                   ('__STATS__', open('../../stats.js', encoding='utf-8').read().strip())]:
    assert t.count(key) == 1, key
    t = t.replace(key, value)
open('preview.html', 'w', encoding='utf-8').write(t)
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#f3efe6"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Hnahsin"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="icon" href="favicon.png" type="image/png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><script>if (\'serviceWorker\' in navigator) addEventListener(\'load\', () => navigator.serviceWorker.register(\'sw.js\'));</script></head><body>\n'
open('../../things.html', 'w', encoding='utf-8').write(head + t + '\n</body></html>\n')
print('things.html:', len(used), 'words')
