"""Adds the content's picture words, sentences and sayings to data.json, and copies
the app's photos into ../../pics. Run from source/playground with the app repo next
to the content pack:  python3 gen_data.py ../pack.json "<app repo>"  """
import json, os, re, shutil, sys, unicodedata

pack, app = sys.argv[1], sys.argv[2]
items = json.load(open(pack))['manifest']['items']
data = json.load(open('data.json'))
W = data['words']
dart = open(f'{app}/lib/src/data.dart').read()
art = dict(re.findall(r"'(word\.[^']+)':\s*'(assets/illustrations/[^']+)'", dart))
first = lambda g: re.split(r'[;,(]', g)[0].strip()

pics, photo, seen_pic, seen_sense = [], {}, set(), set()
for it in items:
    if it['content_type'] != 'word': continue
    wid, b = it['stable_id'], it['body']
    if 'picture_match' not in b.get('game_modes', []): continue
    file = art.get(wid)
    emoji = b['emoji'].strip()
    if not file and not emoji: continue
    key = file or emoji
    sense = first(b['english_gloss']).lower()
    # One word per picture and per meaning, so a wrong answer is never also right.
    if key in seen_pic or sense in seen_sense: continue
    seen_pic.add(key); seen_sense.add(sense)
    # Keep the emoji too: games built around emoji (Bazar, Count…) still need one.
    W[wid] = [b['word'], first(b['english_gloss']), emoji]
    if file:
        name = os.path.basename(file)
        shutil.copy(f'{app}/{file}', f'../../pics/{name}')
        photo[wid] = f'pics/{name}'
    pics.append(wid)
data['pics'], data['photo'] = pics, photo

def level(text):
    n = len(text.split())
    return 1 if n <= 6 else 2 if n <= 8 else 3 if n <= 10 else 4
data['sentences'] = [[s['content']['text_mizo'].strip(), s['content']['english_support'].strip(), level(s['content']['text_mizo'])]
                     for s in (i['body'] for i in items if i['content_type'] == 'sentence')
                     if s['content']['english_support'].strip() and 2 <= len(s['content']['text_mizo'].split()) <= 12]
data['sayings'] = json.load(open('../journey/sayings.json'))
json.dump(data, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('picture words', len(pics), '(photos', len(photo), ') | sentences', len(data['sentences']), '| sayings', len(data['sayings']))
