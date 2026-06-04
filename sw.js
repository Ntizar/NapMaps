/**
 * Service Worker — NapMaps
 * Cache de la app + tiles de mapa para funcionamiento offline parcial
 * Hecho con ❤️ por David Antizar
 */

const CACHE_NAME = 'napmaps-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/js/app.js',
  '/src/js/buildings.js',
  '/src/css/style.css',
  '/favicon.svg',
];

// Instalar: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: caché primero, luego red
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para tiles de mapa: caché agresivo (los tiles no cambian)
  if (url.hostname.includes('basemaps.cartocdn.com') ||
      url.hostname.includes('arcgisonline.com') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.pathname.includes('/tiles/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          // Cachea la respuesta si es exitosa
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Para la app: network-first, fallback a caché
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Mensaje: limpiar cache si el usuario lo pide
self.addEventListener('message', (event) => {
  if (event.data === 'clear-cache') {
    caches.delete(CACHE_NAME).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage('cache-cleared'));
      });
    });
  }
});
