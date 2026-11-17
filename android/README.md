# TF Story Studio — Android app

A native Android shell (Kotlin + WebView) around the web app in `../index.html`.

- Runs fully offline from inside the APK (`https://appassets.androidplatform.net`), so storage, microphone and WebCodecs export work.
- Saves videos to the phone gallery (`Movies/TF Story Studio`), images to `Pictures`, other files to `Download`.
- Share sheet for Drive, Facebook (Reels/post), WhatsApp, YouTube…
- Microphone recording, file picker (stories, audio, music, logo, fonts).
- In-app updates: checks GitHub Releases when opened + every 12 h in the background, downloads inside the app,
  verifies the update is signed with the same key, then opens the installer. No browser needed.
- API keys stay only in the app's private storage and are excluded from Android backups.

Two parts in one app:

- Long videos (YouTube 16:9, 5–15 min) live inside the Story part: pick **লং ভিডিও** in step 1. Three styles —
  জীবনের গল্প (warm family drama with numbered traps), সত্য ঘটনা থ্রিলার (dark grade, word-by-word kinetic text with
  click/whoosh/ding sounds, date/document/source cards) and ধাপে ধাপে গাইড (roadmap chapters). Same characters, voice,
  music, export and share as the short videos; the mix is rendered in 45-second windows and the MP4 is written as a
  fragmented file in pieces, so a 15-minute video fits in a phone's memory.
- Step 1 has a format switch (শর্ট / লং) and a size row (৯:১৬, ৪:৫, ১:১, ১৬:৯). Each format remembers its own size and has its
  own library (`long-library.js` holds the 13 built-in long stories) with its own used/unused marks. Any size other than a
  short 9:16 is drawn by the frame-adaptive renderer, which re-frames the characters and lays text out for that frame.
- 5.0: full-body characters (legs, feet, outfit-specific lower body); mouths move only for the character who is speaking.
  Thriller look: 2–5 word caption chunks with blur-in words and yellow underlined key words, black statement cards with
  gold words (`[statement: lead / big words]`), gold chapter cards, tiny corner labels (`[label: …]`). Life look: cream
  sentence pill with red key words, speech bubbles for dialogue, sticker tags (`[tag: ✗ … / ✓ …]`), corner tracker
  (`[hud: label / before → after]`), plum moral cards. On a computer the web app uses the full screen width.
- 5.1: one Gmail login for the whole app (home screen, Story part, Islamic story-video part, Islamic picture-card part),
  shared through `cloud-core.js`; each part keeps its own history in the same account (Islamic docs `isl_…`, used entries
  `isl:…`, picture-card history `icd_…`), so the Firestore rules need no change. ✕ clear buttons on the text boxes.
  The app looks for a new version whenever it comes back to the screen (at most every 30 min) and in the background every 4 hours.
- `home.html` — start screen: pick **গল্প** (the Story part, `index.html`) or **ইসলামিক** (`index.html?part=islamic`).
- The Islamic part reuses the Story engine (`islamic/story.js`): a library of real sources (Quran passages, Sahih al-Bukhari); the app downloads the exact text, the AI writes only the retelling, and the video shows the exact quote with its reference. No people on screen. Own settings, library and project (`tf_isl_*`, IndexedDB `tf_story_studio_isl`).
- Cards and short reels for the Islamic page: `islamic/index.html` (TF Post Maker), opened from the Islamic part.
- Each part has a button at the top to jump to the other one; Back on the first screen of either part returns to the start screen.
- Both parts use the same share sheet (Facebook · YouTube · WhatsApp · Drive · other apps) with separate text per platform, and the same Gemini/Claude keys (`tf_gkey`, `tf_akey`).

Builds run on GitHub Actions (`.github/workflows/android.yml`). The release signing key is kept in the
repository's encrypted Actions secrets `TF_KEYSTORE_BASE64` and `TF_KEYSTORE_PASSWORD` — never in the repo.

## Long video visuals (`long-visuals.js`)

The long-video section draws Backbenchers-style animated concept visuals (calendar, charts, documents, lock, phone, map route, skyline, …) on a cinematic background, with word-by-word captions and RGB-split chapter cards.

- Bundled with the web files (`index.html`, `long-library.js`, `long-visuals.js`); the Android CI copies it into `assets/www/`.
- Script card: `[scene: kind / text1 / text2]` (kinds: calendar, skyline, building, chart_line, chart_bars, counter, doc, email, money, people, route, magnifier, lock, phone, balance, timeline, question, network, files, clock, alert). Without explicit cards the planner picks visuals from the narration keywords.
- Setting `visuals` (checkbox "লং ভিডিওতে কনসেপ্ট ছবি") turns them on/off.
