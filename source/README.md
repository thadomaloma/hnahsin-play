# Sources for the Hnahsin web games

`journey.html` and `playground.html` at the top of this repo are built from
the files here. Edit the templates, run the build, then commit both.

```
source/
  journey/      Rova's Journey (Phaser 3.90)
  playground/   Hnahsin Playground (20 games)
```

The home page (`index.html`, `theme.css`, `home.js`), `sw.js` and
`manifest.webmanifest` are written by hand at the top level; they have no build.

## Rebuild a page

```sh
cd source/journey && python3 build.py      # writes ../../journey.html
cd source/playground && python3 build.py   # writes ../../playground.html
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

`puzzles.json` (Spelling Bee, Waffle, Strands) is made by:

```sh
cd source/playground
python3 gen_puzzles.py "../../../Hnahsin Game/assets/mizo_words.txt"   # path to the app's assets/mizo_words.txt
```

It counts AW, CH and NG as one letter each and folds accents. Needs `wordfreq`.

## The Flutter app under `app/`

A release web build of the main Hnahsin app. From the app's folder:

```sh
flutter build web --release --base-href /hnahsin-play/app/ \
  --dart-define=HNAHSIN_API_BASE_URL=https://thadomaloma.github.io/hnahsin-content \
  -o <somewhere>
```

then copy it into `app/` without the `*.symbols` files.
