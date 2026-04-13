const CACHE_NAME = 'student-journal-v35';
const ASSETS = [
  '/',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: pre-cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches, claim all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Message: allow app to trigger skipWaiting for update manager
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache-first with background revalidation (stale-while-revalidate)
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // For navigation requests (HTML pages) always serve index.html from cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => cached || fetch(e.request))
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        // Kick off a background network fetch to keep cache fresh
        const networkFetch = fetch(e.request).then(fresh => {
          cache.put(e.request, fresh.clone());
          return fresh;
        }).catch(() => {});

        // Return cached immediately if available, else wait for network
        return cached || networkFetch;
      })
    )
  );
});
