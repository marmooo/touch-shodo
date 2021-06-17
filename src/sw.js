var CACHE_NAME = '2021-06-17 21:15';
var urlsToCache = [
  '/touch-shodo/',
  '/touch-shodo/index.js',
  '/touch-shodo/drill.js',
  '/touch-shodo/drill/',
  '/touch-shodo/svg/eraser.svg',
  '/touch-shodo/svg/dict.svg',
  '/touch-shodo/mp3/correct1.mp3',
  '/touch-shodo/mp3/correct3.mp3',
  '/touch-shodo/mp3/incorrect1.mp3',
  '/touch-shodo/mp3/stupid5.mp3',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.min.js',
  'https://cdn.jsdelivr.net/npm/signature_pad@2.3.2/dist/signature_pad.min.js',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
