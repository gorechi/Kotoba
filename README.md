# Kotoba · 言葉

**English** · [Русский](README.ru.md)

<p align="center">
  <img src="build/icon.png" alt="Kotoba app icon" width="120" />
</p>

<p align="center">
  <strong>A calm desktop app for learning Japanese with flashcards.</strong><br />
  Kana, N5/N4 kanji, and your own decks — offline, private, and always at hand.
</p>

<p align="center">
  <a href="https://github.com/gorechi/Kotoba/releases/latest"><img src="https://img.shields.io/github/v/release/gorechi/Kotoba?label=latest%20release" alt="Latest release" /></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D4" alt="Platform: Windows" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ea44f" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/works-offline-6b8e5a" alt="Works offline" />
</p>

> **Kotoba** (言葉) means “words” in Japanese. This is a small, quiet study companion: no account, no feed, no notifications — just cards, gentle repetition, and your own pace.

## Why Kotoba

- **Everything stays with you.** Decks, progress, and history are stored on your computer. Nothing is sent to a server.
- **Works offline.** Fonts and card data are bundled with the app; the only network request is the update check.
- **Gentle by design.** Small batches of new cards, calm animations, and a Zen mode for review without interface noise.
- **Yours to shape.** Built-in decks are ready to study, and custom decks and cards take a couple of clicks.
- **Two languages.** The interface is available in Russian and English and can be switched at any time.

## Download

Get the latest installer from [GitHub Releases](https://github.com/gorechi/Kotoba/releases/latest):

- **Kotoba-Setup-1.8.0.exe** — Windows x64 installer (NSIS). You can choose the installation folder; a desktop shortcut is created.
- The installer is not code-signed, so Windows SmartScreen may show a warning on first launch.

Kotoba also runs in the browser for development — see [Development](#development).

## Screens at a glance

| Screen | What it is for |
| --- | --- |
| **Study** | Today’s review, your decks, and custom study sets |
| **Kana / Kanji** | Built-in and custom decks with their cards |
| **Cards** | Search, filter, and organize the whole collection |
| **Kana map** | Progress for every hiragana and katakana character |
| **Statistics** | Streak, accuracy, activity, and progress by deck |
| **Data** | CSV/TSV import and backups |
| **Settings** | Goals, appearance, study pace, speech, and updates |
| **Help** | Friendly step-by-step guides |

## What’s inside

### Study

- **Built-in kana decks** — hiragana and katakana, 71 cards each (46 basic characters + 25 voiced). Basic characters include example words.
- **Kanji N5 and N4** — 103 N5 and 181 N4 kanji with readings, meanings, and up to two example words. Meanings and translations follow the app language. The built-in cards are protected from editing; create your own kanji deck to add or change cards.
- **Reading and Writing modes** — choose a mode next to the Study button. Reading shows Japanese and asks for the reading and meaning; Writing shows the meaning and asks you to write the Japanese yourself. The Normal/Hard setting controls whether the transcription is visible in Writing mode.
- **Spaced repetition** — a card returns after 10 minutes, 12 hours, 1 day, 3 days, and so on, based on your rating. New cards are introduced in small portions to avoid overload.
- **Mistake review** — at the end of a session you see the cards you marked “Again”, with reading, translation, and a listen button. “Practice mistakes again” starts a session with just those cards.
- **Undo** — pressed the wrong rating? Use the Undo button or `Ctrl+Z`; progress and statistics are restored.
- **Zen mode** — full-screen review without interface. The card shows the Japanese side, flips to the translation after 10 seconds, then fades into the next card. Start it from the menu or let it begin automatically after a configurable idle period.
- **Custom study** — ready-made sets for overdue cards, new cards, JLPT N5/N4, kanji only, a tag, a 50-card marathon, and mistakes from the last week. Build and save your own sets with filters for deck, type, JLPT, tag, and size.

### Decks and cards

- **Custom decks and cards** — word or character, reading, translation, and a note. Rename, recolor, or delete a deck at any time. Kana and kanji decks are kept separate.
- **Kana input without a Japanese keyboard** — type romaji and the field turns it into kana. Use the `abc / あ / ア` toggles, the extra characters panel, and “Add and keep going” to enter a batch of cards quickly.
- **Tags** — add arbitrary labels when creating or editing a card. The app suggests tags already used in the deck, and tags can be used as filters.
- **Cards screen** — search, filter by deck, type, status, tag, or mnemonic, sort, drag cards between decks, and use bulk actions: move, suspend, mark as known, reset progress, add a tag, or delete.
- **Kana map** — a grid of hiragana and katakana with per-character progress, status colors, and a mnemonic indicator. Click a character to study just that card.
- **Mnemonics** — save a personal association for a character on the front of a kana card. It is hidden by default and opens with the lightbulb button.
- **CSV/TSV import** — separate kana and kanji import flows. Choose a file, pick or create a deck, and map columns to card fields.

### Progress and comfort

- **Statistics** — streak, accuracy, 14-day review activity, progress by deck, and a reading/writing practice breakdown.
- **Goals and pace** — a daily goal by reviews or minutes, long-term targets for total reviews, learned cards, and days in a row, plus how many new cards each deck introduces per day.
- **Lightweight progress saves** — reviews are batched on disk and flushed when you pause or leave a session, so studying does not rewrite files on every card.
- **Per-deck settings** — new-card limits, review limits, card order, and the study mode can be adjusted for each deck.
- **Themes** — light, dark, or system.
- **Collapsible sidebar** — collapse the navigation into an icon-only rail to give the cards more room. Hover an icon to see its name; the collapsed state is remembered between launches.
- **Text-to-speech** — the speaker button reads Japanese with the system voice (`ja-JP`). A Japanese voice must be installed in Windows: Settings → Time & Language → Language & region → add Japanese with the speech component. If no Japanese voice is found, the app shows a hint instead of playing the wrong voice.
- **Help center** — nine friendly guides grouped into **System** and **Learning**: speech setup, import/export, CSV import, system setup, custom sets, the Cards screen, kana and kanji cards, and Reading/Writing modes.
- **Update checks** — Kotoba checks GitHub Releases on startup and from Settings. If a newer version exists, Settings shows an **“Update available”** badge with a link to the release page. Nothing is downloaded or installed automatically.
- **Backups** — export and import the full JSON backup, open the data folder, or reset progress from **Data → Backups**.
- **Data recovery** — if a data file is damaged, Kotoba keeps the damaged file aside, tries the `.bak` copy, and otherwise offers to import a backup or start fresh instead of silently overwriting your progress.
- **Automatic backups** — choose a folder and a schedule (never, on close, daily, every two or three days). The last seven automatic copies are kept.
- **Save status** — the title bar shows when changes are saving or saved, and warns you if writing to disk fails, with a retry button.
- **One window at a time** — launching Kotoba again brings the existing window to the front instead of opening a second copy that could compete for the same data files.

## Getting started

1. Download and run the installer from [Releases](https://github.com/gorechi/Kotoba/releases/latest).
2. Open **Study** and start with Hiragana or Katakana, or go to **Kanji** for N5/N4.
3. Choose **Reading** or **Writing** next to the Study button.
4. Set a comfortable daily goal in **Settings** — 5–10 new cards per day is a good start.
5. If the speaker stays silent, open **Help → How to enable speech** for the Windows voice setup.

## Keeping Kotoba up to date

Kotoba checks for updates when it starts and whenever you press **Settings → Updates → Check for updates**. If a new version is found, the panel shows **“Update available”** and a download button that opens the GitHub release page. The app never downloads or installs anything in the background.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` / `Enter` | flip the card |
| `1` | Again — the card will return after a few cards |
| `2` | Hard |
| `3` | Good |
| `4` | Easy |
| `Ctrl+Z` | undo the last rating |
| `Esc` | leave the session |

## Adding cards

The “Word or character” field works in `あ` mode by default — type in Latin letters:

| Typed | Result |
| --- | --- |
| `mizu` | みず |
| `gakkou` | がっこう |
| `konnichiha` | こんにちは |
| `kan` + `Tab` | かん |
| `ko-hi-` in `ア` mode | コーヒー |

- `abc` — plain Latin input with no conversion;
- `あ` and `ア` — hiragana and katakana;
- below the field is a panel of `っ ゃ ゅ ょ ぁ ぃ ぅ ぇ ぉ ゔ ー` (in katakana — `ッ ャ ュ ョ … ヴ`);
- the reading is filled in as romaji automatically until you start editing it manually;
- “Add and keep going” or `Ctrl+Enter` saves the card and keeps the form open for the next one.

## Tags and filters

The card form has a **Tags** field for arbitrary labels (for example, `#noun`, `#verb`, `#N5`). As you type, the app suggests tags already used in the deck.

On a deck page, filters appear above the card list:

- **Tags** — click a tag to show only cards with it. Multiple tags can be selected.
- **Status** — All, New, Due, Learned.
- **Search** — by word, reading, translation, note, or mnemonic.

## Where your data lives

In the packaged app, data is stored in `%APPDATA%\Kotoba\`:

| File | Contents |
| --- | --- |
| `kotoba-content.json` | decks and cards |
| `kotoba-settings.json` | settings |
| `kotoba-progress.json` | SRS progress |
| `kotoba-history.json` | study history |

In browser mode, the app uses IndexedDB with `localStorage` as an emergency fallback.

To move your studies to another computer, use **Data → Backups → Export**, then import the file on the other machine. To open the folder directly, use **Data → Backups → Data folder**.

## CSV and TSV import

Open **Data**, choose the **Kana** or **Kanji** tab, and upload a CSV or TSV file. The app can detect the delimiter, treat the first row as headers, and map file columns to card fields. Only cards are imported; study progress and history are not affected.

## Development

Node.js 20+ is required (tested on Node 24 LTS).

```powershell
npm install
npm run dev
```

`npm run dev` starts Vite and the Electron window together. For the browser only:

```powershell
npm run dev:web
```

Then open `http://localhost:5173`.

### Building

```powershell
npm run build   # web build in dist/
npm run dist    # Windows installer in release/Kotoba-Setup-1.8.0.exe
```

The installer is an NSIS package: it lets the user choose the installation folder and creates a desktop shortcut. Code signing is not configured.

### Project structure

```
electron/          main process, preload, GitHub update check
src/
  components/      study card, deck and card forms, modals, sidebar
  data/            kana and kanji seed data, help guides
  lib/             SRS, statistics, study queues, validation,
                   romaji→kana, CSV/TSV parsing, updates, version
  pages/           Home, Decks, Kanji, Cards, Kana map,
                   Statistics, Data, Settings, Help
  state/           data store and autosave
  styles.css       themes and all styles
scripts/           dev launcher and icon generation
build/             application icons
```

On load, data passes through `src/lib/normalize.ts`: corrupted or incomplete JSON is restored, built-in decks are put back in place, and progress is not lost.

### Tech stack

Electron · React · TypeScript · Vite · wanakana. No backend and no telemetry.

## Fonts, data sources, and licenses

The project code is distributed under the **MIT** license. The full text is in [`LICENSE`](LICENSE).

The app works offline and does not download fonts from the network — they are bundled into the build.

- **Klee One** — the Japanese side of cards in Zen mode. Author: The Klee Project Authors. License: SIL Open Font License 1.1. Font file: `src/assets/fonts/KleeOne-Regular.ttf`, license text: [`public/fonts/OFL-KleeOne.txt`](public/fonts/OFL-KleeOne.txt).
- **Caveat** — translations on Zen cards (Cyrillic and Latin). Author: The Caveat Project Authors. License: SIL Open Font License 1.1. Font file: `src/assets/fonts/Caveat-Regular.ttf`, license text: [`public/fonts/OFL-Caveat.txt`](public/fonts/OFL-Caveat.txt).

Both fonts are distributed under SIL OFL 1.1: they can be freely used, modified, and embedded in the app. The MIT license applies to the app code; it does not apply to the fonts.

The built-in N4 kanji readings, vocabulary, and example-word glosses are derived from **KANJIDIC2** and **JMdict** (Electronic Dictionary Research and Development Group), distributed under **CC BY-SA 4.0**. The word selection structure was adapted from the open [JLPT Kanji](https://github.com/vakho10/jlpt-kanji) project. Russian translations and the compact card format were prepared for this project. The derived N4 content remains available under CC BY-SA 4.0.

## A note on how this was made

Kotoba is a **personal hobby project**, not a commercial product or an official release.

- A significant portion of the code was written with AI tools — the so-called “vibe coding”. I set the tasks, made the decisions, and reviewed the result, but I did not write every line by hand.
- I do not hide the use of AI and state it explicitly so that no one gets the impression of deception. I do not claim authorship of every line of code or any patent rights to the project. The copyright notice in [`LICENSE`](LICENSE) refers to the project as a whole.
- The code is provided **“as is”**, without warranties. It may contain bugs, rough edges, and fragments of unclear origin.
- The original repository is https://github.com/gorechi/Kotoba — the source of truth. Forks and copies must not be presented as the original.
- If you find third-party code, a font, an image, or any other material used without attribution or a license, please let me know — I will check it and either fix or remove it.
- Please do not treat this project as legally vetted or commercially supported.

## Contributing

Ideas, bug reports, and kind feedback are welcome — open an [issue](https://github.com/gorechi/Kotoba/issues). There is no roadmap and no promise of deadlines; this is a small project made for the joy of studying.

## License

[MIT](LICENSE) © 2026 Kotoba
