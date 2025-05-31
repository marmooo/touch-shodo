const CACHE_NAME = "2025-05-31 11:00";
const urlsToCache = [
  "/touch-shodo/",
  "/touch-shodo/index.js",
  "/touch-shodo/drill.js",
  "/touch-shodo/drill/",
  "/touch-shodo/mp3/correct1.mp3",
  "/touch-shodo/mp3/correct3.mp3",
  "/touch-shodo/mp3/incorrect1.mp3",
  "/touch-shodo/mp3/stupid5.mp3",
  "/touch-shodo/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
