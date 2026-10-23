# Sources for the Hnahsin web games

`journey.html` and `playground.html` at the top of this repo are built from
the files here. Edit the templates, run the build, then commit both.

```
source/
  journey/      Rova's Journey (Phaser 3.90)
  playground/   Hnahsin Playground (21 games)
  things/       Touch and learn (things.html)
```

The home page (`index.html`, `theme.css`, `home.js`, `rova.js`), `sw.js` and
`manifest.webmanifest` are written by hand at the top level; they have no build.
After changing `theme.css`, `home.js` or `rova.js`, run `python3 source/stamp.py`: it
puts a fingerprint of each file in its URL (`home.js?v=…`) in `index.html` and `sw.js`,
so phones and browsers fetch the new file instead of a saved old one.

## Rebuild a page

```sh
cd source/journey && python3 build.py      # writes ../../journey.html
cd source/playground && python3 build.py   # writes ../../playground.html
cd source/things && python3 build.py       # writes ../../things.html
```

Each build also writes `preview.html` (the same page without the document
skeleton) for a Claude preview; it is not committed.

The site copies carry the install and offline tags (manifest, service
worker). When the cached files change in a way old copies can't handle, bump
`VERSION` in `sw.js`.

## Rova's Journey data

| File | What it is |
|---|---|
| `template.html` | The game; `__WORDS__`, `__DICT__`, `__SAYINGS__` are filled in by the build |
| `words.json` | The app's 1,254 words from the live content pack: `[mizo, meaning, example, level 1–7, topic, emoji, full meaning]` |
| `sayings.json` | The 203 tawng upa: `[saying, meaning, wrong meanings]` |
| `dict_words.json` | 1,928 common words from J.F. Laldailova's dictionary (used with permission), for levels 4–5 |

To remake `dict_words.json` from the dictionary (needs `pip install openpyxl wordfreq`):

```sh
cd source/journey
python3 build_dict.py ~/Downloads/JF_Laldailova_Dictionary.xlsx
```

`crosscheck.py` marks which of those words the dictionary confirms under a
second English word of the same meaning (needs `nltk` and its WordNet:
`python3 -m nltk.downloader wordnet`).

## Playground puzzles

`template.html` holds all 20 games; `__DATA__` (picture words and groups,
`data.json`), `__DICT__` (from `../journey/dict_words.json`) and
`__PUZZLES__` (`puzzles.json`) are filled in by the build.

`gen_data.py` adds the content's Picture Match words (with the app's photos, copied to
`../../pics`), all sentences and the tawng upa to `data.json`. Run it after new content
is published, with the live pack saved as `source/pack.json`:

```sh
cd source/playground
python3 gen_data.py ../pack.json "../../../Hnahsin Game"   # path to the app repo
```

Rova's Journey reads the sentences from `source/journey/sentences.json`.

`puzzles.json` (Spelling Bee, Waffle, Strands) is made by:

```sh
cd source/playground
python3 gen_puzzles.py "../../../Hnahsin Game/assets/mizo_words.txt"   # path to the app's assets/mizo_words.txt
```

It counts AW, CH and NG as one letter each and folds accents. Needs `wordfreq`.

## Touch and learn

Things you can tap, turn and play with, drawn in 3D by our own small engine.

| File | What it is |
|---|---|
| `ink3d.js` | The engine: shapes (boxes, cylinders, balls, lines), the turning camera, shading, shadows and the pen look. It writes SVG |
| `people.js` | People (the family, Rova and Mami, the weaver), shared by the figures |
| `house.js` | The Mizo house and its yard: parts, buttons, sky, weather and labels |
| `loom.js` | Puan tah: pi weaves a puan on a backstrap loom; pick the yarn, add a pattern, finish it |
| `template.html` | The page; `__INK3D__`, `__PEOPLE__`, `__HOUSE__`, `__LOOM__`, `__WORDS__` and `__STATS__` are filled in by the build |
| `snapshot.js` | Writes `pics/things-house.svg`, the picture on the home page card (`node snapshot.js`) |

Every Mizo word in a figure's `words` list must be in `../journey/words.json` (the Hnahsin content)
or `../journey/dict_words.json` (the dictionary words);
the build stops and names any that are not.

## The Flutter app under `app/`

A release web build of the main Hnahsin app. From the app's folder:

```sh
flutter build web --release --base-href /hnahsin-play/app/ \
  --dart-define=HNAHSIN_API_BASE_URL=https://thadomaloma.github.io/hnahsin-content \
  -o <somewhere>
```

then copy it into `app/` without the `*.symbols` files, run `python3 source/app_patch.py`
(loading screen and offline caching), and bump `VERSION` in `sw.js`.
