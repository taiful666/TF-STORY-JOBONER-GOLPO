# TF Story Studio — Android app

A native Android shell (Kotlin + WebView) around the web app in `../index.html`.

- Runs fully offline from inside the APK (`https://appassets.androidplatform.net`), so storage, microphone and WebCodecs export work.
- Saves videos to the phone gallery (`Movies/TF Story Studio`), images to `Pictures`, other files to `Download`.
- Share sheet for Drive, Facebook (Reels/post), WhatsApp, YouTube…
- Microphone recording, file picker (stories, audio, music, logo, fonts).
- In-app updates: checks GitHub Releases when opened + every 12 h in the background, downloads inside the app,
  verifies the update is signed with the same key, then opens the installer. No browser needed.
- API keys stay only in the app's private storage and are excluded from Android backups.

Builds run on GitHub Actions (`.github/workflows/android.yml`). The release signing key is kept in the
repository's encrypted Actions secrets `TF_KEYSTORE_BASE64` and `TF_KEYSTORE_PASSWORD` — never in the repo.
