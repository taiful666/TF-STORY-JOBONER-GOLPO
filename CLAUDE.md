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
1. Clone is shallow (`--depth 1`). **Work on branch `dev`, not `main`** (he collects many changes, then builds the
   APK once). Pushing `dev` builds nothing. Only when he says "বিল্ড করো" / "ফাইনাল": merge `dev` into `main` and push
   (one APK build). Start of a chat: `git fetch --depth=50 origin dev && git checkout dev` if it exists.
2. Locate (grep) → read only the needed lines → Edit.
3. `python3 tools/check.py` — syntax check of all JS/inline scripts (≈1 s). Must print `OK`.
4. `python3 tools/codemap.py` — refresh CODEMAP.md line numbers if you need them again in this chat.
5. **Commit message = the changelog.** Write a clear one-line message saying what changed (e.g.
   `লং ভিডিও: ক্যাপশন বড়, শেয়ার শিটে Telegram`). Don't edit CHANGELOG.md by hand — the bot adds it.
   If the change adds/moves a feature, file or section, or changes a rule/convention, also update the
   hand-written tables/rules above so they never go stale (the bot only updates the AUTO block).
6. Push: `git -c push.negotiate=true push origin dev` (final build only: merge into main, push `main`). Pushing web/android files to `main` triggers the APK build
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
| `home.html` | start screen: গল্প / ইসলামিক / এক্সপ্লেনার. Tapping ইসলামিক opens its own screen (hash `#islamic`, `body.isl-on`, back button `#islBack` / phone back) with 2 choices (`#islSub`): গল্পের ভিডিও (`index.html?part=islamic`) or পোস্ট মেকার (`islamic/index.html`) |
| `index.html` | the Story part: all CSS layers, data, drawing, engine, audio, export, UI. Also hosts other parts via `?part=islamic` / `?part=explainer` |
| `long-library.js` | 13 built-in long stories |
| `lib-studio.js` | **লাইব্রেরি স্টুডিও** (সব সেকশনে, লাইব্রেরির চিপের নিচে `#xlsBox`): ক্যাটাগরি + স্টাইল + একক×N / ধারাবাহিক N পর্ব + দৈর্ঘ্য + বিষয় + নিজের নির্দেশ → সেকশনের নিজের প্রম্পটের ওপর লাইভ প্রম্পট (কপি) → বাইরের AI-এর উত্তর পেস্ট → `parsePack` (TF Script কোড ব্লক বা JSON; ধারাবাহিক = `ধারাবাহিক: নাম \| মোট পর্ব: N` + `=== নাম \| পর্ব k: …` + `সারাংশ:`) → এই সেকশনের লাইব্রেরিতে। ইসলামিক লং/ধারাবাহিক `ISL_LONG.importPack` দিয়ে আসল ধারাবাহিক হয় (একই নামে পেস্ট করলে পর্ব যোগ হয়); অন্য সেকশনে পর্বগুলো `নাম · পর্ব k` নামে আলাদা গল্প। পছন্দ মনে রাখে `tf_xls_<section>`। মিনিমাল কার্ড ("✍ Gemini দিয়ে লিখুন"): পিল সেগমেন্ট (একটাতেই শেষ/ধারাবাহিক) → এক লাইনে চিপ-সিলেক্ট (গল্প/পর্ব · মিনিট · ক্যাটাগরি · ⚙ আরও অপশন `#xlsMore`) → বিষয় ইনপুট → পাশাপাশি দুই বোতাম 'প্রম্পট কপি' + 'পেস্ট করে যোগ'; প্রম্পট টেক্সটএরিয়া লুকানো, পেস্ট বক্স শুধু ক্লিপবোর্ড ব্যর্থ হলে দেখায় (ক্লিপবোর্ড → সরাসরি যোগ; Android-এ `TFAndroid.getClipboard`; বক্সে পেস্ট করলেও নিজে যোগ হয়)। `clean()` Gemini-র ``` / ** / ### / মাঝের কথা ছেঁটে ফেলে; ধারাবাহিক বাছলে সাধারণ `===` ব্লকগুলোই ক্রমানুসারে পর্ব; বাকি পর্ব না এলে 'চালিয়ে যাও' বলতে বলে (নাম ছাড়া পর্ব আগের ধারাবাহিকে জোড়ে, `lastSer`) |
| `life-series.js` | **জীবন পাঠ (গল্প পার্ট) লং লাইব্রেরি: একক লং / ধারাবাহিক (বড় · মাঝারি ৩×~৫ মিনিট)** — ইসলামিক long.js-এর মতো। সুইচ `#lifeKind` (`S.lifeLongKind`), `#lifeSerLen` (`S.lifeSerLen`); ধারাবাহিক = plan `life_ser_*` (series-plan json) + পর্ব `life_ser_*_p<k>` (USERLIB, সাধারণ লাইব্রেরিতে লুকানো: `libItems`/`renderLib` র‍্যাপ করা)। পর্বের প্রম্পটে এনগেজমেন্ট (রিক্যাপ, কুইজ ক/খ/গ উত্তর পরের পর্বে, cliffhanger, পরের পর্বের টিজার, সাবস্ক্রাইব/পেজ ফলো/কমেন্ট/শেয়ার)। key থাকলে অ্যাপেই পরিকল্পনা+পর্ব লেখে, না থাকলে পর্বের প্রম্পট কপি করে lib-studio কার্ডে পেস্ট। `LIFE_SER.importPack` — lib-studio সেকশন `life_big`/`life_mid` (আর লং-এ পেস্ট করা ধারাবাহিকও) এখানে আসে, একই নামে পেস্ট করলে পর্ব জোড়ে। ইসলামিক/এক্সপ্লেনারে চলে না |
| `long-visuals.js` | long-video concept visuals (`[scene: kind/…]`) |
| `elements.js` | **দৃশ্যের জিনিস (এলিমেন্ট)**, সব পার্টে: `OBJ` (table, chair, office_chair, almirah, khat, stool, lamps, hurricane, candle, bulb, filestack, flag, portrait, computer, printer, safe, cashbox, kolshi, chula, sacks, bricks, tubewell, well, haystack, shed, crack, clothesline, scale, signboard, truck, ambulance, cctv, jailbars …) → `E['o_<name>']`; দৃশ্যের হেডিং `## govt_office+table+chair:900` (normPlace র‍্যাপ, `buildCombo`, ইসলামিকের +পশুর সাথে মেশে); `autoDirect` র‍্যাপ করে লেখার শব্দ (`WORDS`) থেকে দৃশ্যে সর্বোচ্চ ৩টা জিনিস নিজে যোগ (`SAME` দিয়ে ডুপ্লিকেট বাদ; `S.ctxBg`/`S.autoObj` false হলে বন্ধ); নতুন জায়গা prison, police_station, officer_room, land_office, salish, mud_house, cowshed, lantern_room, night_lamps; নতুন হাতের প্রপ file, pen, candle, lantern, photo, cheque, certificate, stamp, stick, basket, broom (+`AUTO_HOLD`); `PLACE_LIST_FOR_PROMPT` র‍্যাপ করে AI-কে জিনিসের তালিকা দেয়। **নতুন গল্পে নতুন জিনিস লাগলে এখানেই `OBJ` + `WORDS`-এ যোগ করুন** |
| `islamic/story.js`, `art.js`, `art2.js`, `stories-1..3.js` | Islamic story-video part (patches the Story engine) |
| `islamic/long-stories.js` | `window.ISL_LONG_STORIES`: ১২টা বিল্ট-ইন ইসলামিক একক লং গল্প (ids `isl_long_b01..b12`, ৬ ক্ষেত্রে ২টা করে, ফরম্যাট `long`)। long.js এগুলো একক তালিকার শুরুতে দেখায়, মোছা যায় না |
| `islamic/long-series.js` | `window.ISL_LONG_SERIES`: ১২টা বিল্ট-ইন ইসলামিক ধারাবাহিক (ids `isl_ser_b01..b12`, ৬ ক্ষেত্রে ২টা করে, প্রতিটা ৩ পর্ব, `{id,cat,title,mins,parts:[{t,s,txt}]}`)। long.js `preSeries`/`findPart` দিয়ে এগুলো ধারাবাহিক তালিকার শেষে দেখায়; মোছা/পুনর্লিখন যায় না, ○/✓ ব্যবহৃত ট্র্যাকিং চলে |
| `islamic/mid-series.js` | `window.ISL_MID_SERIES`: ৬টা বিল্ট-ইন ইসলামিক **মাঝারি ধারাবাহিক** (ids `isl_ser_m01..m06`, ৬ ক্ষেত্রে ১টা করে, ৩ পর্ব × ~৫ মিনিট, প্রতি পর্বে টুইস্ট + ক/খ/গ কুইজ যার উত্তর পরের পর্বে)। long.js-এ ধারাবাহিক ট্যাবের ভেতরে `#islLSerLen` সুইচ: বড় / মাঝারি (`S.islSerLen`); প্ল্যানের `mins <= 6` হলে মাঝারি তালিকায় |
| `islamic/long.js` | Islamic LONG videos (16:9): step-1 শর্ট/লং switch (`#fmtPick`), long library `#islLongBox` with একক লং গল্প (ids `isl_long_*`, by category) and ধারাবাহিক = series plan (`isl_ser_*`, json) + parts (`isl_ser_*_p<k>`); AI plan → part-by-part writing, each part ends with next-part + subscribe CTA. Uses `window.ISL_API` from story.js |
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
| CSS look (newest layers win: v6 … v13) | `<style id="v13">` (মিনিমাল মোবাইল পাস), `<style id="v12">`, `v11 —`, `v10 —`, `v9 —`; JS `v13js` (লং ভিডিওর লিংক/তথ্য/ইন্টারনেট একটা ভাঁজে) |
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
| **প্রো থাম্বনেল (default, all parts/ratios)** | `v13 — প্রো থাম্বনেল` (`<script id="v13thumb">`): `proCopy` (auto text), `proSeries` (পর্ব k / N, শেষ পর্ব), `proDraw`; theme key `pro`; manual edits `story.cover.pro {tag,ep,h,sub,cta}` via `#proFields`; position/size per element `cover.pro.lay[tag|ep|h|sub|cta|logo] = {dx,dy (frame fraction), s}`; drag editor `<dialog id="proEd">` (`TF_PRO_EDITOR()`, opened by `#btnProEdit`, tapping `#thumbPv`, or `#btnFirstEdit` "✎ ১ম ফ্রেম এডিট" on the main preview while it sits on the first (thumbnail) frame — `<script id="v13first">`): pointer drag, corner handle / pinch / wheel resize, centre snap; boxes from `PRO_BOXES`, background cached in `PRO_BG` |
| **লেখার নিয়ম সব সেকশনে** (প্রফেশনাল নাম = থাম্বনেলের বড় লেখা, ধারাবাহিক `নাম \| পর্ব k: পর্বের নাম`, ক্লিকবেইট নয়, +জিনিস, চ্যানেলের নাম CTA-তে) | `<script id="v13rules">`: `TF_PROMPT_RULES()` — lib-studio কপি-প্রম্পটের শেষে আর `aiComplete` র‍্যাপ করে অ্যাপের AI-তে যোগ হয়; প্রো থাম্বনেল সব সেকশনে জোর করে (`tf_pro_thumb2`); `proCopy`-র নিচের লাইনে ?/… ওয়ালা টিজার বাদ। লোগো ও চ্যানেলের নাম সেকশন-ভিত্তিক (`LK`: tf_logo / tf_isl_logo / tf_exp_logo), সেটিংসে `#secNote` |
| Gmail login / cloud sync | `Gmail login + cloud sync`; সেকশনের লোগো + চ্যানেলের নাম/ট্যাগলাইন/ওয়াটারমার্ক সব ডিভাইসে: `<script id="v13brand">` — `users/{uid}/stories/{CPFX}__cfg` ডক (`{txt: JSON, at}`, নতুনটা জেতে; লাইব্রেরি `/__cfg$/` বাদ দেয়), প্রতি ২ সেকেন্ডে লোকাল বদল চেক করে পাঠায় |
| **← পেছনে / ⌂ হোম বোতাম (সব সেকশন)** | `<script id="v14nav">` + `<style id="v14nav">`: টপ বারে `#tfNav` (`#tfNavBack`, `#tfNavHome`); `window.tfNavBack()` = ডায়ালগ → ⋯ মেনু → আগের ধাপ → ধাপ-১ সাব-স্ক্রিন (`showSrc(null)`) → যেখান থেকে এসেছে (ইসলামিক: `home.html#islamic`, বাকি: `home.html`)। Android Back (`TFBack`) একই চেইন। পোস্ট মেকারে `#tfToBack` → `TFBack` (রুটে `../home.html#islamic`) |
| Startup | `---------- init` |
| Long video (16:9) styles, captions, kinetic text (rule: never dark text on a yellow box — gold box = dark box + gold frame, marker = deep red under white word) | `LONG VIDEO`, `CAPTION VARIETY`, `first-video look (thriller)`, `kinetic typography`, `long video: UI` |
| Start chooser, share sheet, command palette, ⋯ menu | `v3.9 — start chooser`, `publish text`, `command palette`, `⋯ menu` |
| Editor shell (top bar, rail, monitor, timeline) | `v9 — editor workspace` |
| Preview card, library chips, folds | `v10 —`, `v11 —` (JS blocks `v10js`, `v11js`) |
| Bundled mp4-muxer | lines ~1494-3420 — library, never edit |

## Conventions
- UI text in Bangla; code/comments in English. Bangla digits in UI (helper `bn`).
- Don't rename element ids or localStorage keys (saved user data + later layers depend on them).
- **Minimal mobile design (owner's rule):** short labels, options as small pill chips in one row, no step numbers or long explanations, optional things behind ⚙ / a fold, two main actions side by side. One "বাইরের AI" flow everywhere: the lib-studio card (`TF_LIBSTUDIO.mount()` puts it in the AI pane's "অন্য AI থেকে আনুন" way or in the library under the switches); the old `#way-ext` steps are hidden.
- **Screen fit (PC):** `<script id="fitjs">` + `<style id="fitcss">` at the top of index.html, home.html, islamic/index.html: on non-touch screens ≥1280px the whole UI gets `html{zoom: min(w/1440, h/860)}` (1–2, steps of .05, live on resize), class `html.fitz` + `--z`; `devicePixelRatio` is multiplied so canvases stay sharp. CSS `vh` is NOT zoomed, so any full-height rule needs a `html.fitz … calc(100dvh / var(--z))` override in fitcss. Phones/tablets stay 1:1 (mobile layout).
- New UI/CSS goes in the newest layer (`v12` style / newest `v*js` script) or a new `v13` layer at the end,
  rather than rewriting old layers — later layers override earlier ones.
- Islamic part: real Quran/hadith text only (`verifyQuran` swaps in the official text for every `## ayah` block with `উৎস: q`), prophets/sahaba never on screen (faceless), no instruments in music. Long Islamic videos use the same `LongRenderer`; `## ayah` is drawn full-width by a patch in story.js.
- **One export system.** Short, long, Islamic-story and explainer all use `doExport` → `exportMP4` → share sheet
  (`initShareSheet`) in index.html; parts must not fork it. Post Maker reels (`islamic/index.html`) mirror it:
  same file name `Title_9x16.mp4` (`reelName`), same platforms (`TF_PLAT`), same Android bridge, AAC first then Opus.
  Change export/share behaviour in both places together.
- Ratio: every part (story, Islamic short/long, explainer) offers 9:16 · 4:5 · 1:1 · 16:9 via the preview chip `#pvRatioChip` → `setRatio`; short and long remember their own (`S.ratioShort` / `S.ratioLong`). Any non-9:16 frame uses `LongRenderer` (re-laid out, never pillarboxed) — `rebuild()`.
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
- Updated: 2026-11-23 20:01 · commit `6684ccd`
- APK version: 5.2.<build> · APP_VERSION 5.1.0 · sw cache tf-story-v5.9.14
- File sizes (lines): index.html 10512 · home.html 322 · islamic/index.html 5009 · islamic/story.js 877 · islamic/art.js 452 · islamic/art2.js 555 · explainer/part.js 1205 · explainer/paper.js 671 · long-visuals.js 941 · long-library.js 29 · fx/motion.js 252 · fx/shadow.js 167 · cloud-core.js 58
- Other web files (new? add to CLAUDE.md tables): islamic/long-series.js, islamic/long-stories.js, islamic/long.js, islamic/mid-series.js, lib-studio.js, life-series.js
- Latest changes (full list: CHANGELOG.md) — read these before starting; newer facts here win over older text above:
  - 2026-11-23 · থাম্বনেল: ধারাবাহিকে গল্পের (সিরিজের) নাম সবচেয়ে বড় শিরোনাম; 'পর্ব k / N' ছোট ব্যাজ, পর্বের নাম নিচে ছোট লাইনে — সব সেকশন, সব রেশিও · index.html, sw.js · `64fcba5`
  - 2026-11-23 · থাম্বনেল: পর্ব ব্যাজ বড় (আলাদা লাইনে), প্রতিটা লেখা আঙুল/মাউসে টেনে সরানো ও কোণ/দুই আঙুলে বড়-ছোট করার এডিটর — সব সেকশন, সব রেশিও, মোবাইল ও পিসি · index.html, sw.js · `120bbff`
  - 2026-11-23 · থাম্বনেল: জীবন পাঠ ধারাবাহিকেও মোট পর্ব ধরে 'পর্ব k / N' ও 'শেষ পর্ব' ব্যাজ · index.html · `ff31b47`
  - 2026-11-23 · থাম্বনেল: নতুন প্রো ডিজাইন সব সেকশনে (গল্প, ইসলামিক শর্ট/লং, এক্সপ্লেনার, সব রেশিও) — মাঝখানে পরিষ্কার বড় লেখা, অটো অর্থবহ শিরোনাম, পর্ব ১/২/শেষ পর্ব ব্যাজ, প্রতিটা লেখা হাতে বদলানোর ঘর · index.html, lib-studio.js, sw.js · `a8fe611`
  - 2026-11-23 · পিসি/বড় স্ক্রিনে পুরো অ্যাপ স্ক্রিনের মাপে নিজে থেকে বড় হয় (১৩৬৬-এ আগের মতো, ১০৮০p-তে ১.২৫×, ১৪৪০p-তে ১.৬৫×, জানালা ছোট-বড় করলে সাথে সাথে), ক্যানভাস ঝকঝকে; মোবাইল/ট্যাব আগের মোবাইল লেআউটে — অ্যাপ, হোম, পোস্ট মেকার · home.html, index.html, islamic/index.html · `587e535`
  - 2026-11-23 · সব সেকশন মিনিমাল (মোবাইল): AI পেনের 'অন্য AI থেকে আনুন' এখন একই ছোট Gemini কার্ড, লং ভিডিওর ধরন ছোট চিপ, লিংক/তথ্য ভাঁজে, ব্যাখ্যা-লেখা বাদ; ইসলামিক লং সুইচ এক লাইনে (একক লং/ধারাবাহিক · বড়/মাঝারি) · index.html, islamic/long.js, lib-studio.js, life-series.js · `d110da0`
  - 2026-11-23 · Gemini কার্ড মিনিমাল: পর্ব/মিনিট/ক্যাটাগরি এক লাইনে ছোট চিপ, ⚙ আরও অপশন, পাশাপাশি 'প্রম্পট কপি' + 'পেস্ট করে যোগ', লম্বা লেখা-নির্দেশ বাদ; জীবন পাঠ সুইচ এক লাইনে (একক লং/ধারাবাহিক · বড়/মাঝারি) · lib-studio.js, life-series.js · `696fc78`
  - 2026-11-23 · জীবন পাঠ লং লাইব্রেরিতে ইসলামিকের মতো একক লং / ধারাবাহিক (বড় · মাঝারি ৩×৫ মিনিট): আসল ধারাবাহিক তালিকা পর্বসহ, ○/✓ ব্যবহৃত, এনগেজমেন্ট প্রম্পট (কুইজ, cliffhanger, সাবস্ক্রাইব/ফলো/কমেন্ট), বাইরের AI-এর পুরো ধারাবাহিক এক পেস্টে জমা, key থাকলে অ্যাপেই পর্ব লেখা · .github/workflows/android.yml, index.html, lib-studio.js, life-series.js, sw.js · `f175c86`
  - 2026-11-23 · লাইব্রেরি স্টুডিও প্রম্পট: Gemini সব পর্ব/গল্প একটাই কোড ব্লকে লিখবে (এক ক্লিকে কপি, একবার পেস্টে সব পর্ব যোগ); যোগের পরও কার্ড খোলা থাকে পরের পেস্টের জন্য · lib-studio.js · `efc0afa`
  - 2026-11-23 · লাইব্রেরি স্টুডিও সহজ: ৩ ধাপ (বাছাই → প্রম্পট কপি → এক চাপে পেস্ট করে যোগ), Gemini-র পুরো উত্তর একবারে পেস্টেই সব পর্ব আলাদা হয়ে জমা, পেস্ট করলেই অটো যোগ, অ্যান্ড্রয়েড ক্লিপবোর্ড, বাকি পর্বের নির্দেশ · android/app/src/main/java/com/taiful/tfstory/WebBridge.kt, lib-studio.js · `7515245`
<!-- AUTO:END -->
