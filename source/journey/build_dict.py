"""Picks common dictionary words for Rova's Journey level 4: English headwords
people use often, with a short first Mizo sense not already in the app's words."""
import json, re, sys, unicodedata
import openpyxl
from wordfreq import zipf_frequency

POS = r'(?:v\.t|v\.i|n|v|adj|adv|prep|conj|pron|int|interj)\.'
MIZO_WORD = re.compile(r"[a-zâêîôûṭ]{2,}(?:-[a-zâêîôûṭ]+)?")
FOLD = str.maketrans('âêîôûṭ', 'aeiout')
fold = lambda s: unicodedata.normalize('NFC', s.lower()).translate(FOLD)

rows = list(openpyxl.load_workbook(sys.argv[1], read_only=True)['JF Dictionary'].iter_rows(min_row=2, values_only=True))
# A headword listed twice is two different words (fine, deal): too easy to mix up.
import collections as _c
twice = {k for k, n in _c.Counter(str(r[0]).strip().lower() for r in rows if r[0]).items() if n > 1}
have = {fold(w[0]) for w in json.load(open('words.json'))}
best = {}
# Read through by hand: names, and a rare or old first sense ("see" as a bishop's seat).
SKIP = set('''smith traffic twitter rose lee harry van boss mail plane talent truck stick sick purpose congress port
magazine parliament audience honest solution scale cell structure trip equipment wild waste gain apply copy pack
discuss identity mode signal platform vice suit capacity alternative mass tommy kaiser jonah gemini catholic
symposium pitch mess abroad saving index node caption satellite expire heritage congratulate quarry essay
bound hub accommodation reserve swipe bluff hitch bladder appropriately applicable involve dividend eve
surpass tinder subscription notch mount absorption exposition accessible bow imprint seam'''.split())
for english, definition, *_ in rows:
    if not english or not definition: continue
    english = str(english).strip().lower()
    if not re.fullmatch(r'[a-z]+', english) or english in SKIP: continue
    d = unicodedata.normalize('NFC', str(definition))
    d = re.sub(r'^\s*(?:[a-z]+\s*)?\([^)]*\)\s*,?', '', d)          # "(pronunciation),"
    m = re.match(r'\s*((?:' + POS + r'\s*,?\s*)+)(.*)', d, re.S)
    if not m: continue
    pos = m.group(1).split('.')[0].strip()
    pos = {'v': 'verb', 'n': 'noun', 'adj': 'adj', 'adv': 'adv'}.get(pos)
    if not pos: continue
    rest = re.sub(r'\([^)]*\)', ' ', m.group(2))
    senses = [s.strip() for s in re.split(r'[,;.]', rest) if s.strip()]
    if not senses: continue
    first = ' '.join(senses[0].split())
    words = first.lower().split()
    if not 1 <= len(words) <= 3 or len(first) > 16: continue
    if words[-1] in ('emaw', 'leh', 'a', 'in', 'chu', 'te', 'kha', 'nge') or words[0] in ('emaw', 'leh'): continue  # cut short
    if not all(MIZO_WORD.fullmatch(w) for w in words): continue
    if re.search(r'[cgjqxy]', first.lower().replace('ch', '').replace('ng', '')): continue
    if fold(first) in have: continue
    if any(len(w) >= 5 and zipf_frequency(w, 'en') > 2.5 for w in words): continue  # English inside
    if all(zipf_frequency(w, 'en') > 3.0 for w in words) and not re.search('[âêîôûṭ]', first): continue  # English, not Mizo
    z = zipf_frequency(english, 'en')
    # The most used English words have many meanings; the dictionary's first is often a rare one.
    if z < 3.3 or z > 4.9 or english in twice: continue
    key = fold(first)
    if key in best and best[key][1] >= z: continue
    others = sorted({fold(s) for s in senses[:8] if len(s) <= 40})
    best[key] = (first, z, english, pos, others)

out = []
for first, z, english, pos, others in sorted(best.values(), key=lambda b: -b[1]):
    level = 4 if z >= 4.3 else 5 if z >= 3.95 else 6 if z >= 3.65 else 7
    # Same shape as the app's words, plus every Mizo sense so wrong doors never also fit.
    out.append([first, english, '', level, 'dict-' + pos, '', english, others])
json.dump(out, open('dict_words.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import collections
print(len(out), collections.Counter(o[3] for o in out), collections.Counter(o[4] for o in out))
