const CACHE = 'campusleaf-v5';
const FILES = ['./','./index.html','./styles.css','./app.js','./data-services.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/favicon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  // Network-first for navigation so a new release reaches installed apps.
  if (event.request.mode === 'navigate') { event.respondWith(fetch(event.request).catch(() => caches.match('./index.html'))); return; }
  // Menu snapshots must be network-first: do not trap yesterday's food in the offline cache.
  if (url.pathname.endsWith('/data/menu-snapshot.json')) {
    event.respondWith(caches.open(CACHE).then(async store => {
      try { const response = await fetch(event.request); if (response.ok) await store.put(event.request,response.clone()); return response; }
      catch (error) { return await store.match(event.request) || Response.error(); }
    }));return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
