/* TF Story Studio — offline support.
   Only the app's own files are cached. API calls (Gemini, Claude, Cartesia, Firebase) are never cached and never touched. */
const CACHE = 'tf-story-v5.9.10';
const FILES = ['./', './index.html', './long-library.js', './long-visuals.js', './lib-studio.js', './cloud-core.js', './explainer/paper.js', './explainer/part.js', './islamic/story.js', './islamic/long.js', './islamic/long-stories.js', './islamic/long-series.js', './islamic/mid-series.js', './islamic/art.js', './islamic/art2.js', './islamic/stories-1.js', './islamic/stories-2.js', './islamic/stories-3.js', './islamic/index.html', './islamic/mp4-muxer.js', './fx/motion.js', './fx/shadow.js', './home.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-firestore-compat.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // leave everything else alone
  // network first (so updates arrive), cached copy when offline
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
