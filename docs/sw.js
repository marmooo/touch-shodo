const CACHE_NAME="2024-11-11 09:00",urlsToCache=["/touch-shodo/","/touch-shodo/index.js","/touch-shodo/drill.js","/touch-shodo/drill/","/touch-shodo/mp3/correct1.mp3","/touch-shodo/mp3/correct3.mp3","/touch-shodo/mp3/incorrect1.mp3","/touch-shodo/mp3/stupid5.mp3","/touch-shodo/favicon/favicon.svg"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})