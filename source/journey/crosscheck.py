"""Checks each dictionary pair against the rest of the dictionary: a Mizo word is
confirmed when it also stands as a sense under another English headword that means
the same or nearly the same (by WordNet), like ziaktu under both secretary and clerk."""
import collections, json, os, re, sys, unicodedata
import nltk, openpyxl
from nltk.corpus import wordnet as wn

FOLD = str.maketrans('âêîôûṭ', 'aeiout')
fold = lambda s: ' '.join(unicodedata.normalize('NFC', s.lower()).translate(FOLD).split())
POS = re.compile(r'\b(?:v\.t|v\.i|n|v|adj|adv|prep|conj|pron|int|interj|pl)\.', re.I)

index = collections.defaultdict(set)  # Mizo sense -> English headwords
for row in openpyxl.load_workbook(sys.argv[1], read_only=True)['JF Dictionary'].iter_rows(min_row=2, values_only=True):
    english, definition = row[0], row[1]
    if not english or not definition: continue
    english = str(english).strip().lower()
    text = POS.sub(' ', re.sub(r'\([^)]*\)', ' ', unicodedata.normalize('NFC', str(definition))))
    for sense in re.split(r'[,;.:/]', text):
        sense = fold(sense)
        if sense and len(sense.split()) <= 4: index[sense].add(english)

def near(word):
    """English words that mean the same or nearly: synonyms, wider and narrower words, word family."""
    out = set()
    for s in wn.synsets(word):
        family = [s] + s.hypernyms() + s.hyponyms() + s.similar_tos() + s.also_sees() + s.verb_groups()
        for f in family:
            for l in f.lemmas():
                out.add(l.name().lower())
                out.update(d.name().lower() for d in l.derivationally_related_forms())
                out.update(p.name().lower() for p in l.pertainyms())
    return out

words = json.load(open('dict_words.json'))
rows = []
for w in words:
    mizo, english = w[0], w[1]
    others = sorted(index.get(fold(mizo), set()) - {english})
    close = near(english)
    agree = [h for h in others if h in close or (len(english) >= 5 and h[:5] == english[:5])]
    # Or inside a longer sense of a near word: "tui hleuh" in "tui hleuh thiam" under swimmer.
    if not agree:
        m = ' ' + fold(mizo) + ' '
        inside = {h for key, hs in index.items() if len(key) > len(m) - 2 and m in ' ' + key + ' ' for h in hs} - {english}
        agree = sorted(h for h in inside if h in close or (len(english) >= 5 and h[:5] == english[:5]))
    rows.append((w, agree, others))
ok = [r for r in rows if r[1]]
print('confirmed', len(ok), 'of', len(rows), collections.Counter(r[0][3] for r in ok))
json.dump([[w[0], w[1], a, o] for w, a, o in rows], open('crosscheck.json', 'w'), ensure_ascii=False)
