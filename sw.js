// Mis viajes: funciona sin conexión. Cambia VERSION al publicar cambios.
const VERSION = 'mis-viajes-v29';
const BASE = [
  './', './index.html', './app.js', './manifest.webmanifest',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
  './img/inicio-1.webp', './img/inicio-2.webp', './img/inicio-3.webp',
  './fonts/sans-400.woff2', './fonts/sans-500.woff2', './fonts/sans-600.woff2',
  './fonts/serif-400.woff2', './fonts/serif-400-italic.woff2'
];
const ESPERA_RED = 2500; // ms: si la red tarda más, se abre la copia guardada

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const red = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; });
    const guardada = await cache.match(req);
    if (!guardada) return red.catch(() => cache.match('./index.html'));
    e.waitUntil(red.catch(() => {}));
    // Resto de archivos (app.js, fuentes, imágenes): la copia de esta versión al momento, y se refresca por detrás.
    if (req.mode !== 'navigate') return guardada;
    // La página: primero la red (para enterarse de las versiones nuevas); si tarda más de 2,5 s, la copia guardada.
    const tiempo = new Promise(ok => setTimeout(() => ok(null), ESPERA_RED));
    const r = await Promise.race([red.catch(() => null), tiempo]);
    return r || guardada;
  })());
});
