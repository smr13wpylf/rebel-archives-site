/* Rebel Archives — offline service worker.
   Network first with the cache as the offline fallback; bump CACHE_VERSION when files change. */

var CACHE_VERSION = 'rebel-archives-v12';

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
      // 'reload' skips the browser's HTTP cache, so an update can never
      // install a stale copy of the files it is meant to replace.
      return cache.addAll(SHELL.map(function (url) {
        return new Request(url, { cache: 'reload' });
      }));
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

/* Network first, cache as the offline fallback.
   Serving the cache first was faster but could hand back a half-updated app:
   the page HTML from one version and its script from the next. The app is a
   few small files, so preferring the network keeps every load internally
   consistent, and the cache still makes it work with no connection. */

var NETWORK_TIMEOUT_MS = 4000;

function fromNetwork(request) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = setTimeout(function () {
      if (!settled) { settled = true; reject(new Error('network timeout')); }
    }, NETWORK_TIMEOUT_MS);

    fetch(request).then(function (res) {
      clearTimeout(timer);
      if (settled) return;   // too slow: the cached copy already went out
      settled = true;
      resolve(res);
    }).catch(function (err) {
      clearTimeout(timer);
      if (!settled) { settled = true; reject(err); }
    });
  });
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== location.origin) return;

  event.respondWith(
    fromNetwork(event.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
          return cache.put(event.request, copy);
        }));
      }
      return res;
    }).catch(function () {
      return caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
        if (cached) return cached;
        // An unvisited route offline still gets the app shell.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
