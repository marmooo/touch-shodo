var CACHE_NAME="2023-02-05 09:20",urlsToCache=["/touch-shodo/","/touch-shodo/index.js","/touch-shodo/drill.js","/touch-shodo/drill/","/touch-shodo/svg/eraser.svg","/touch-shodo/svg/dict.svg","/touch-shodo/mp3/correct1.mp3","/touch-shodo/mp3/correct3.mp3","/touch-shodo/mp3/incorrect1.mp3","/touch-shodo/mp3/stupid5.mp3","/touch-shodo/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js","https://cdn.jsdelivr.net/npm/signature_pad@4.1.4/dist/signature_pad.umd.min.js"];self.addEventListener("install",function(a){a.waitUntil(caches.open(CACHE_NAME).then(function(a){return a.addAll(urlsToCache)}))}),self.addEventListener("fetch",function(a){a.respondWith(caches.match(a.request).then(function(b){return b||fetch(a.request)}))}),self.addEventListener("activate",function(a){var b=[CACHE_NAME];a.waitUntil(caches.keys().then(function(a){return Promise.all(a.map(function(a){if(b.indexOf(a)===-1)return caches.delete(a)}))}))})