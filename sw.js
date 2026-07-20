/* Rebel Archives — offline service worker.
   Cache-first for the app shell; bump CACHE_VERSION when files change. */

var CACHE_VERSION = 'rebel-archives-v3';

var SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION) return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      if (cached) {
        // Serve instantly, refresh the cache in the background when online.
        event.waitUntil(
          fetch(event.request).then(function (res) {
            if (res && res.ok) {
              return caches.open(CACHE_VERSION).then(function (cache) {
                return cache.put(event.request, res);
              });
            }
          }).catch(function () { /* offline: cached copy already served */ })
        );
        return cached;
      }
      return fetch(event.request).then(function (res) {
        if (res && res.ok && new URL(event.request.url).origin === location.origin) {
          var copy = res.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
            return cache.put(event.request, copy);
          }));
        }
        return res;
      });
    })
  );
});
