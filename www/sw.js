const SHELL_CACHE = 'targetmate-shell-v1';
const TILE_CACHE = 'targetmate-tiles-v1';
const SHELL_ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== SHELL_CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Map tiles - cache-first, kept in their own long-lived cache since satellite imagery barely
  // changes. This is what makes previously-viewed map areas available offline. Tile <img> loads are
  // cross-origin/no-cors, so the response here is opaque (status always 0, res.ok always false) -
  // there's no way to tell success from failure, so it's cached unconditionally, same as any other
  // cross-origin tile cache (e.g. Leaflet.offline does the same).
  if (url.hostname === 'server.arcgisonline.com') {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => cache.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          cache.put(event.request, res.clone());
          return res;
        });
      }))
    );
    return;
  }

  // The app shell itself - network-first, falling back to cache only once the network actually
  // fails. Cache-first would be simpler and slightly faster while online, but the app's own script
  // (this file) doesn't change on a content-only edit to index.html, so the browser never re-runs
  // install() to refresh a stale cache entry - online users would get stuck on an old version
  // indefinitely. Network-first keeps online users current while still working fully offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, res.clone()));
        return res;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Everything else (place search, etc.) needs a live connection anyway - no point caching it.
});

// Lets the page proactively warm the tile cache for a favorite location, even before the user
// has ever scrolled/zoomed to it (see precacheFavoriteTiles() in index.html).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'precache-tiles' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(TILE_CACHE).then((cache) => Promise.all(event.data.urls.map((u) =>
        cache.match(u).then((hit) => hit || fetch(u, { mode: 'no-cors' }).then((res) => {
          cache.put(u, res.clone());
        }).catch(() => {}))
      )))
    );
  }
});
