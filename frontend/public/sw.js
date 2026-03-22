/**
 * Service Worker — Rural24
 * Estrategia: Cache-first para assets estáticos, Network-first para API/datos
 */

const CACHE_NAME = 'rural24-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/Apprural/web/icon-192.png',
  '/images/Apprural/web/icon-512.png',
];

// Instalación: pre-cachear assets críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para supabase/API, Cache-first para todo lo demás
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase y API — siempre red (nunca cachear datos dinámicos)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET'
  ) {
    return; // dejar que el browser maneje sin SW
  }

  // Assets estáticos — Cache-first con fallback a red
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Solo cachear respuestas exitosas de mismo origen
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
