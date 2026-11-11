/* SaludPlus v25 · service worker
   - Páginas: red primero (para recibir actualizaciones) y copia local si no hay conexión.
   - Archivos estáticos: copia local primero y se refrescan en segundo plano. */
const CACHE = 'saludplus-v90-alpha-2';
const FILES = [
  './', './index.html', './styles.css?v=65', './i18n.js?v=57', './app.js?v=62', './exams.js?v=65', './exams-ui.js?v=70', './exams-design.css?v=70', './home-design.css?v=72', './visits-design.css?v=72', './vitals-design.css?v=72', './hero-live.css?v=72', './print-record.css?v=80', './guide-design.css?v=86', './guide-ui.js?v=87', './reports-design.css?v=80', './reports-ui.js?v=79', './care-design.css?v=77', './hero-live.js?v=72', './examreport.js?v=62', './v90-design.css?v=2',
  './manifest.json', './icon-192.png', './icon-512.png', './saludplus-logo.svg'
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
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
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
