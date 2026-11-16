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

- `home.html` — start screen: pick **গল্প** (the Story part, `index.html`) or **ইসলামিক** (`index.html?part=islamic`).
- The Islamic part reuses the Story engine (`islamic/story.js`): a library of real sources (Quran passages, Sahih al-Bukhari); the app downloads the exact text, the AI writes only the retelling, and the video shows the exact quote with its reference. No people on screen. Own settings, library and project (`tf_isl_*`, IndexedDB `tf_story_studio_isl`).
- Cards and short reels for the Islamic page: `islamic/index.html` (TF Post Maker), opened from the Islamic part.
- Each part has a button at the top to jump to the other one; Back on the first screen of either part returns to the start screen.
- Both parts use the same share sheet (Facebook · YouTube · WhatsApp · Drive · other apps) with separate text per platform, and the same Gemini/Claude keys (`tf_gkey`, `tf_akey`).

Builds run on GitHub Actions (`.github/workflows/android.yml`). The release signing key is kept in the
repository's encrypted Actions secrets `TF_KEYSTORE_BASE64` and `TF_KEYSTORE_PASSWORD` — never in the repo.
