# TF Story Studio — instructions for Claude (read automatically in every chat)

Owner: Taiful (taiful666). Talks in Bangla. Reply in Bangla, short (he reads on a phone).
Goal of this file: do every change with the **fewest tokens**. Never re-read the whole project.

## Token rules (most important)
1. **Never read a big file whole.** `index.html` (10k lines), `islamic/index.html` (5k), `explainer/part.js`,
   `islamic/mp4-muxer.js` — each is tens of thousands of tokens.
2. To find code: `grep -n -i "keyword" CODEMAP.md` first (line-numbered index of every section + function +
   element id). Then `grep -n` in the source file, then `Read(file, offset, limit≈60-150)` only those lines.
3. Do **not** read all of CODEMAP.md either — grep it. Do not re-explore the repo; this file + CODEMAP are enough.
4. Use the "Where things live" table below to jump straight to the right section.
5. Don't send recaps of what you read. Do the change, check, commit, reply in 2-4 Bangla lines.
6. Use Edit for small changes (no full-file rewrites).

## Workflow for every change request
1. Clone is shallow (`--depth 1`). Work on `main` unless he asks for a branch (he wants changes live).
2. Locate (grep) → read only the needed lines → Edit.
3. `python3 tools/check.py` — syntax check of all JS/inline scripts (≈1 s). Must print `OK`.
4. `python3 tools/codemap.py` — refresh CODEMAP.md line numbers if you need them again in this chat.
5. **Commit message = the changelog.** Write a clear one-line message saying what changed (e.g.
   `লং ভিডিও: ক্যাপশন বড়, শেয়ার শিটে Telegram`). Don't edit CHANGELOG.md by hand — the bot adds it.
   If the change adds/moves a feature, file or section, or changes a rule/convention, also update the
   hand-written tables/rules above so they never go stale (the bot only updates the AUTO block).
6. Push:
   `git -c push.negotiate=true push origin main`. Pushing web/android files to `main` triggers the APK build
   (GitHub Actions) and the phones get the update automatically. Docs/tools-only changes don't trigger a build.
7. If several features are asked in one message, do them all, then check and commit once.
8. **Auto-sync:** `.github/workflows/docs-sync.yml` runs on every push to main (from Claude, the owner, or
   anyone): `tools/autoupdate.py` rebuilds CODEMAP.md, adds the new commits to CHANGELOG.md and rewrites the
   "Current state (auto)" block at the end of this file. So the notes are always the latest — trust the
   AUTO block over older text if they disagree. Before pushing, `git pull --rebase origin main` (the bot may
   have pushed a notes commit).

## What the app is
Bangla story-video maker (canvas 2D animation → MP4 via WebCodecs). Web app (plain HTML/JS, no build step,
no framework) + Android WebView shell (Kotlin) that bundles the web files offline.
AI: Gemini (`tf_gkey`) and Claude (`tf_akey`) keys from the browser; TTS: Cartesia. Login/sync: Firebase
(Gmail) via `cloud-core.js`. Storage: localStorage (`tf_*`), IndexedDB (`tf_story_studio`, Islamic `tf_story_studio_isl`).

### Files
| File | Role |
|---|---|
| `home.html` | start screen: গল্প / ইসলামিক chooser |
| `index.html` | the Story part: all CSS layers, data, drawing, engine, audio, export, UI. Also hosts other parts via `?part=islamic` / `?part=explainer` |
| `long-library.js` | 13 built-in long stories |
| `long-visuals.js` | long-video concept visuals (`[scene: kind/…]`) |
| `islamic/story.js`, `art.js`, `art2.js`, `stories-1..3.js` | Islamic story-video part (patches the Story engine) |
| `islamic/index.html` | TF Post Maker (Islamic picture cards + reel studio) — separate app |
| `explainer/part.js`, `paper.js` | explainer-video part (`?part=explainer`) |
| `fx/motion.js`, `fx/shadow.js` | motion style and shadow-puppet video style |
| `cloud-core.js` | one Gmail login + Firestore for all parts |
| `sw.js` | PWA offline cache (bump `CACHE` name when web files change a lot) |
| `android/app/src/main/java/com/taiful/tfstory/*.kt` | MainActivity (WebView), WebBridge (`window.TFAndroid`), Updater (GitHub Releases), GoogleSignIn |
| `.github/workflows/android.yml` | builds APK, emulator smoke test, publishes release. Copies web files into `assets/www/` — **a new top-level web file must be added to its `cp` line, to `paths:`, and to `sw.js` FILES** |

### Where things live in `index.html` (grep the heading text; line numbers in CODEMAP)
| Feature | Section heading to grep |
|---|---|
| CSS look (newest layers win: v6 … v12) | `<style id="v12">`, `v11 —`, `v10 —`, `v9 —` |
| Roles, places, moods, props, books (allowed values) | `TF Story Studio — data`, `allowed values` |
| Story-writing AI prompts | `the story-writing prompt`, `buildStoryPrompt`, `buildTwistPrompt` |
| Characters drawing | `CHARACTER`, `look presets per role` |
| Props / backgrounds / cards / metaphors | `PROPS`, `BACKGROUNDS`, `CARDS`, `METAPHORS`, `place library` |
| Script format `[tag: …]` parser | `"TF Script" story format`, `parse Gemini / project text` |
| Timeline + renderer | `story engine`, `timeline`, `renderer`, `গল্প-টুইস্ট style` |
| Voice/TTS, uploaded narration, music & SFX | `audio (Cartesia`, `Cartesia`, `align one uploaded`, `music & sfx` |
| Export MP4, ratio/resolution | `export (MP4`, `output frame` |
| Android bridge (JS side) | `Android app bridge` |
| Settings, keys, state | `settings & secrets`, `app state`, `settings: channel, logo, keys` |
| Steps 1-4 UI | `navigation & flow`, `step 2`, `step 3: voice`, `step 4: export` |
| Library, AI writing, loading | `library (built-in`, `AI writing`, `loading stories`, `auto-direct` |
| Thumbnails / covers | `Shorts cover`, `গল্প-উক্তি cover`, `thumbnail kit`, `গল্প cover` |
| Gmail login / cloud sync | `Gmail login + cloud sync` |
| Startup | `---------- init` |
| Long video (16:9) styles, captions, kinetic text | `LONG VIDEO`, `CAPTION VARIETY`, `first-video look (thriller)`, `kinetic typography`, `long video: UI` |
| Start chooser, share sheet, command palette, ⋯ menu | `v3.9 — start chooser`, `publish text`, `command palette`, `⋯ menu` |
| Editor shell (top bar, rail, monitor, timeline) | `v9 — editor workspace` |
| Preview card, library chips, folds | `v10 —`, `v11 —` (JS blocks `v10js`, `v11js`) |
| Bundled mp4-muxer | lines ~1494-3420 — library, never edit |

## Conventions
- UI text in Bangla; code/comments in English. Bangla digits in UI (helper `bn`).
- Don't rename element ids or localStorage keys (saved user data + later layers depend on them).
- New UI/CSS goes in the newest layer (`v12` style / newest `v*js` script) or a new `v13` layer at the end,
  rather than rewriting old layers — later layers override earlier ones.
- Islamic part: real Quran/hadith text only, faceless people, no instruments in music.
- **One export system.** Short, long, Islamic-story and explainer all use `doExport` → `exportMP4` → share sheet
  (`initShareSheet`) in index.html; parts must not fork it. Post Maker reels (`islamic/index.html`) mirror it:
  same file name `Title_9x16.mp4` (`reelName`), same platforms (`TF_PLAT`), same Android bridge, AAC first then Opus.
  Change export/share behaviour in both places together.
- Links: ☾ `btnSuite` → `index.html?part=islamic` (the Islamic part overrides it to Post Maker `islamic/index.html`).
- Never put API keys or the signing key in the repo.
- Versions: `APP_VERSION` in index.html (project file format), `TF_VERSION_NAME` in android.yml (APK name, e.g. 5.2 →
  5.2.<run>). Bump `TF_VERSION_NAME` only when he asks for a new major/minor version.

## Testing
- `python3 tools/check.py` (syntax) is the cheap default. For visual/UI changes, if asked or risky, run the page in
  headless Chromium (playwright) and look at a screenshot; otherwise skip to save tokens.
- The CI emulator smoke test runs on every push; failures show in the Actions tab.

<!-- AUTO:START — rewritten by tools/autoupdate.py on every push; do not edit by hand -->
## Current state (auto)
- Updated: 2026-11-23 10:08 · commit `267c0b4`
- APK version: 5.2.<build> · APP_VERSION 5.1.0 · sw cache tf-story-v5.9.4
- File sizes (lines): index.html 10173 · home.html 285 · islamic/index.html 4993 · islamic/story.js 855 · islamic/art.js 447 · islamic/art2.js 555 · explainer/part.js 1205 · explainer/paper.js 671 · long-visuals.js 941 · long-library.js 29 · fx/motion.js 252 · fx/shadow.js 167 · cloud-core.js 58
- Latest changes (full list: CHANGELOG.md) — read these before starting; newer facts here win over older text above:
  - 2026-11-23 · Auto-sync Claude notes on every push (CODEMAP, CHANGELOG, CLAUDE.md state block) · .github/workflows/docs-sync.yml, tools/autoupdate.py · `267c0b4`
  - 2026-11-23 · Add CLAUDE.md, CODEMAP, check & codemap tools, CHANGELOG — low-token change workflow · CLAUDE.md, tools/check.py, tools/codemap.py · `16afc9c`
  - 2026-11-20 · UI round 4: Islamic library uses same chips/compact rows, hide phone step bar, no wrapped text · (start of this log) · `71fdfda`
<!-- AUTO:END -->
