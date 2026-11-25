/* SaludPlus v25 · service worker
   - Páginas: red primero (para recibir actualizaciones) y copia local si no hay conexión.
   - Archivos estáticos: copia local primero y se refrescan en segundo plano. */
const CACHE = 'saludplus-v94';
const FILES = [
  './', './index.html', './firebase-config.js', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png', './saludplus-logo.svg', './privacidad.html', './instalar.html'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // el servidor de IA nunca pasa por la caché
  if (url.pathname.endsWith('/firebase-config.js')) { // la configuración se actualiza al instante
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => caches.match(req)));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => {
      if (r.ok && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
