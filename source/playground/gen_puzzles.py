"""Makes Spelling Bee, Waffle and Strands puzzles from Hnahsin's words.

Mizo letters are counted the Mizo way: aw, ch and ng are one letter each, and
accents are folded (â is a), since the games show plain capital tiles.
Writes puzzles.json for the Playground template."""
import collections, itertools, json, random, re, sys, unicodedata
from wordfreq import zipf_frequency

random.seed(7)
FOLD = str.maketrans('âêîôûṭ', 'aeiout')
TOKEN = re.compile(r'aw|ch|ng|[abdefghijklmnoprstuvz]')
ALPHABET = set('a aw b ch d e f g h i j k l m n ng o p r s t u v z'.split())


def fold(w):
    return unicodedata.normalize('NFC', w.lower()).translate(FOLD)


def tokens(w):
    """A word's Mizo letters, or None if it isn't one plain Mizo word."""
    w = fold(w)
    if not re.fullmatch(r'[a-z]+', w): return None
    t = TOKEN.findall(w)
    return t if ''.join(t) == w and all(x in ALPHABET for x in t) else None


# Words we know the meaning of: the app's words and the dictionary pool.
meaning = {}
for w in json.load(open('../journey/words.json', encoding='utf-8')):
    if tokens(w[0]) and w[3] <= 5: meaning.setdefault(fold(w[0]), w[1].lower())
for w in json.load(open('../journey/dict_words.json', encoding='utf-8')):
    if tokens(w[0]): meaning.setdefault(fold(w[0]), w[1])

# Words the bee accepts: the above, plus the Mizo words of J.F. Laldailova's
# dictionary that don't read as English (the list has some abbreviations).
lexicon = set(meaning)
for line in open(sys.argv[1], encoding='utf-8'):
    w = line.strip()
    t = tokens(w)
    if w in ('adn', 'adv', 'adj', 'advs', 'pron') or 'aa' in w: continue  # abbreviations, run-together forms
    if t and len(t) >= 3 and re.search('[aeiou]', w) and zipf_frequency(w, 'en') < 2.5: lexicon.add(w)
print('known', len(meaning), 'accepted', len(lexicon))

# ---------------------------------------------------------------- Spelling Bee
bee = []
toks = {w: tokens(w) for w in lexicon}
candidates = [w for w in meaning if len(set(toks[w])) == 7 and len(toks[w]) <= 12]
random.shuffle(candidates)
seen_sets = set()
for word in candidates:
    letters = frozenset(toks[word])
    if letters in seen_sets: continue
    fits = [w for w in lexicon if len(toks[w]) >= 3 and set(toks[w]) <= letters]
    best = None
    for centre in letters:
        answers = [w for w in fits if centre in toks[w]]
        known = sum(w in meaning for w in answers)
        if 12 <= len(answers) <= 45 and known >= 6 and (not best or known > best[2]): best = (centre, answers, known)
    if not best: continue
    seen_sets.add(letters)
    centre, answers, _ = best
    outer = sorted(letters - {centre})
    random.shuffle(outer)
    bee.append({'centre': centre, 'outer': outer, 'answers': sorted(answers, key=lambda w: (len(toks[w]), w)),
                'pangrams': sorted(w for w in answers if set(toks[w]) == letters)})
    if len(bee) == 40: break
print('bee', len(bee), [len(b['answers']) for b in bee[:10]])

# ---------------------------------------------------------------- Waffle
# Three words across (rows 0, 2, 4) and three down (columns 0, 2, 4), five letters each.
def waffle_words(pool):
    """Every waffle the pool allows, found by search: three down words fixed by the top
    row, then the middle and bottom rows must exist with those letters at 0, 2 and 4."""
    starts = collections.defaultdict(list)
    triples = collections.defaultdict(list)
    for w in pool:
        t = toks[w]
        starts[t[0]].append(w)
        triples[(t[0], t[2], t[4])].append(w)
    found = []
    tops = list(pool); random.shuffle(tops)
    for a0 in tops:
        t = toks[a0]
        for v0, v2, v4 in itertools.product(starts[t[0]], starts[t[2]], starts[t[4]]):
            if len({a0, v0, v2, v4}) < 4: continue
            mids = [w for w in triples[(toks[v0][2], toks[v2][2], toks[v4][2])] if w not in (a0, v0, v2, v4)]
            lows = [w for w in triples[(toks[v0][4], toks[v2][4], toks[v4][4])] if w not in (a0, v0, v2, v4)]
            for a2, a4 in itertools.product(mids, lows):
                if a2 != a4:
                    found.append(([a0, a2, a4], [v0, v2, v4]))
                    break
            if len(found) and found[-1][0][0] == a0: break  # one waffle per top word
        if len(found) >= 200: break
    return found

five = sorted({w for w in meaning if len(toks[w]) == 5})
options = waffle_words(five)
if len(options) < 30:  # widen to the dictionary's other Mizo words, keeping known words first
    five = sorted({w for w in lexicon if len(toks[w]) == 5})
    options += [o for o in waffle_words(five) if sum(w in meaning for w in o[0] + o[1]) >= 4]
random.shuffle(options)
waffles = []
used = set()
for across, downs in options:
    if len(waffles) == 30: break
    if len(used & set(across + downs)) > 2: continue
    used |= set(across + downs)
    a0, a2, a4 = across
    grid = [[None] * 5 for _ in range(5)]
    for r, w in zip((0, 2, 4), across):
        for c in range(5): grid[r][c] = toks[w][c]
    for c, w in zip((0, 2, 4), downs):
        for r in range(5): grid[r][c] = toks[w][r]
    cells = [(r, c) for r in range(5) for c in range(5) if grid[r][c]]
    # Scramble with ten swaps from the answer, so it can be solved in ten; check most tiles moved.
    for _ in range(50):
        g = [row[:] for row in grid]
        for _ in range(10):
            (r1, c1), (r2, c2) = random.sample(cells, 2)
            g[r1][c1], g[r2][c2] = g[r2][c2], g[r1][c1]
        right = sum(g[r][c] == grid[r][c] for r, c in cells)
        if 5 <= right <= 9: break
    waffles.append({'across': [a0, a2, a4], 'down': downs, 'answer': grid, 'start': g})
print('waffle', len(waffles), 'options', len(options))

# ---------------------------------------------------------------- Strands
# A theme's words fill the whole grid, each along a path of touching cells.
data = json.load(open('data.json', encoding='utf-8'))
NEAR = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def fill(words, rows, cols):
    empty = {(r, c) for r in range(rows) for c in range(cols)}
    grid, paths = {}, {}

    def components():
        left, sizes = set(empty), []
        while left:
            stack = [left.pop()]; n = 1
            while stack:
                r, c = stack.pop()
                for dr, dc in NEAR:
                    q = (r + dr, c + dc)
                    if q in left: left.remove(q); stack.append(q); n += 1
            sizes.append(n)
        return sizes

    def place(i):
        if i == len(words): return not empty
        # Start at the empty cell with the fewest free neighbours, so no corner is left out.
        start = min(empty, key=lambda p: (sum((p[0] + dr, p[1] + dc) in empty for dr, dc in NEAR), random.random()))
        word = words[i]
        t = toks_s[word]

        def walk(path):
            if len(path) == len(t):
                for p, x in zip(path, t): grid[p] = x; empty.discard(p)
                rest = [len(toks_s[w]) for w in words[i + 1:]]
                if all(s >= min(rest, default=0) for s in components()) and place(i + 1):
                    paths[word] = path; return True
                for p in path: del grid[p]; empty.add(p)
                return False
            r, c = path[-1]
            nxt = [(r + dr, c + dc) for dr, dc in NEAR if (r + dr, c + dc) in empty and (r + dr, c + dc) not in path]
            random.shuffle(nxt)
            nxt.sort(key=lambda p: sum((p[0] + dr, p[1] + dc) in empty for dr, dc in NEAR))
            return any(walk(path + [p]) for p in nxt[:4])

        return walk([start])

    return (grid, paths) if place(0) else None


toks_s = {}
strands = []
for g in data['groups']:
    pool = []
    for wid in g['words']:
        w = data['words'][wid][0]
        t = tokens(w)
        if t and 3 <= len(t) <= 9 and fold(w) not in [fold(x[0]) for x in pool]:
            toks_s[fold(w)] = t; pool.append((fold(w), data['words'][wid][1], data['words'][wid][2]))
    made = 0
    for size, rows in ((36, 6), (30, 5), (42, 7)):
        for _ in range(300):
            k = random.randint(4, min(8, len(pool)))
            pick = random.sample(pool, k) if len(pool) >= k else []
            if sum(len(toks_s[w]) for w, _, _ in pick) != size: continue
            pick.sort(key=lambda x: -len(toks_s[x[0]]))
            for _ in range(20):
                res = fill([w for w, _, _ in pick], rows, 6)
                if res: break
            if not res: continue
            grid, paths = res
            strands.append({'theme': g['label'], 'rows': rows, 'cols': 6,
                            'grid': [[grid[(r, c)] for c in range(6)] for r in range(rows)],
                            'words': [{'w': w, 'm': m, 'e': e, 'cells': [r * 6 + c for r, c in paths[w]]} for w, m, e in pick]})
            made += 1
            break
        if made >= 2: break
print('strands', len(strands), collections.Counter(s['theme'] for s in strands).most_common(40))

json.dump({'bee': bee, 'waffle': waffles, 'strands': strands, 'meaning': {w: meaning[w] for w in sorted(
    set(itertools.chain.from_iterable(b['answers'] for b in bee)) | {w for x in waffles for w in x['across'] + x['down']}) if w in meaning}}, open('puzzles.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
