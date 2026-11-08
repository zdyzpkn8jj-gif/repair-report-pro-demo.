/* Repair Report Pro offline shell: caches the app, not external systems or user data. */
const CACHE = 'rrp-shell-v10-multibrand-manuals-20261108';
const SHELL = ['./', './index.html', './photos.js', './manuals.js', './manifest.webmanifest'];
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
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache => cache.put('./index.html',copy));}
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if(url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/photos.js') || url.pathname.endsWith('/manuals.js')){
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache => cache.put(event.request,copy));}
      return response;
    }).catch(() => caches.match(event.request)));
  }
});
