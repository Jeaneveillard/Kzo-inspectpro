const CACHE_NAME = 'kzo-inspect-v9';
const ASSETS = [
  '/',
  'KZO_Inspect.html',
  'style.css',
  'app.js',
  'data.js',
  'ai_agents.js',
  'boilerplate.js',
  'house_bg.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
  // config.js exclu intentionnellement : contient des clés API sensibles
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event (Network first, fallback to cache for offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update cache with the fresh response
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

