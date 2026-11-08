/* Repair Report Pro offline shell: caches the app, not external systems or user data. */
const CACHE = 'rrp-shell-v1-20261107';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('rrp-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(event.request.mode === 'navigate'){
    event.respondWith(fetch(event.request).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache => cache.put('./index.html',copy));}
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if(url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/index.html')){
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
