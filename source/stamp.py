"""Gives the home page's own files a fingerprint of their contents (theme.css?v=1a2b3c4d),
so after an update the page always asks for the new files instead of a saved old one,
and lists the same URLs in sw.js. Run from the repo root before each commit:
    python3 source/stamp.py"""
import hashlib, re

FILES = ['theme.css', 'home.js', 'rova.js']
stamp = {f: hashlib.sha256(open(f, 'rb').read()).hexdigest()[:8] for f in FILES}

page = open('index.html', encoding='utf-8').read()
for f, h in stamp.items():
    page, n = re.subn(r'(["\'])' + re.escape(f) + r'(\?v=[0-9a-f]+)?\1', lambda m: f'{m.group(1)}{f}?v={h}{m.group(1)}', page)
    assert n == 1, (f, n)
open('index.html', 'w', encoding='utf-8').write(page)

sw = open('sw.js', encoding='utf-8').read()
for f, h in stamp.items():
    sw, n = re.subn(r"'" + re.escape(f) + r"(\?v=[0-9a-f]+)?'", f"'{f}?v={h}'", sw)
    assert n == 1, (f, n)
open('sw.js', 'w', encoding='utf-8').write(sw)
print(stamp)
