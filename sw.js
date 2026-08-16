// Hedgerow service worker - caches the app shell so it opens offline once
// installed. The Three.js CDN request is left alone (network only); if
// you're offline on first load, the CDN script won't be cached yet.
var CACHE_NAME = 'hedgerow-v1';
var SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(name){
        if(name !== CACHE_NAME) return caches.delete(name);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return; // let CDN requests hit the network normally
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if(response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || networkFetch;
    })
  );
});
