const CACHE = 'bbl-v1';

// On install: cache the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/favicon.svg'])
    ).then(() => self.skipWaiting())
  );
});

// On activate: drop old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Versioned assets (/assets/…) — cache-first, they never change
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetchAndCache(request)
      )
    );
    return;
  }

  // Navigation requests — network-first so fresh HTML is always served
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .catch(() => caches.match('/'))
        .then((res) => res ?? caches.match('/'))
    );
    return;
  }

  // Everything else — stale-while-revalidate
  e.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetchAndCache(request);
      return cached ?? fresh;
    })
  );
});

function fetchAndCache(request) {
  return fetch(request).then((res) => {
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(request, clone));
    }
    return res;
  });
}
