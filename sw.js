'use strict';
// Service Worker PWA Offline-First para Pata Andina Vet.
// Guarda las dos pantallas, los estilos, scripts, iconos, datos y recursos visuales locales.
const CACHE_NAME = "pata-andina-grupal-v12-responsive-flex-dock-20261122";
const APP_SHELL = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./pwa.html",
  "./pwa.css",
  "./pwa.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/servicios.json",
  "./data/productos-gatos.json",
  "./imagenes/cirugia.svg",
  "./imagenes/consulta.svg",
  "./imagenes/control.svg",
  "./imagenes/curaciones.svg",
  "./imagenes/odontologia.svg",
  "./imagenes/domicilio.svg",
  "./imagenes/gato.svg",
  "./imagenes/portada-veterinaria.svg",
  "./imagenes/imagenologia.svg",
  "./imagenes/laboratorio.svg",
  "./imagenes/nutricion.svg",
  "./imagenes/peluqueria.svg",
  "./imagenes/prevencion.svg",
  "./imagenes/vacuna.svg",
  "./imagenes/vet-portada.webp",
  "./imagenes/vet-consulta.webp",
  "./imagenes/vet-diagnostico.webp",
  "./imagenes/vet-evaluacion.webp",
  "./imagenes/vet-atencion-felina.webp",
  "./imagenes/vet-cuidados.webp"
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("pata-andina-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (url.searchParams.has("__pata_health")) { event.respondWith(fetch(request)); return; }
  if (!sameOrigin) {
    // Guarda imágenes y el script jQuery usado por la PWA para conservar su funcionamiento offline.
    const cacheableExternal = request.destination === 'image' || request.destination === 'script';
    if (!cacheableExternal) return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);
      try {
        const live = await fetch(request);
        if (live.ok || live.type === 'opaque') await cache.put(request, live.clone());
        return live;
      } catch (_) { return saved || Response.error(); }
    })());
    return;
  }

  // Los catálogos JSON se actualizan desde la red y conservan la última copia si no hay conexión.
  if (url.origin === self.location.origin && /\/data\/(servicios|productos-gatos)\.json$/.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const live = await fetch(request);
        if (live.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, live.clone());
        }
        return live;
      } catch (_) {
        return (await caches.match(request, { ignoreSearch: true })) || new Response(
          JSON.stringify({ error: 'catalog_unavailable', message: 'No hay conexión y el catálogo aún no está guardado.' }),
          { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const live = await fetch(request);
        if (live.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, live.clone()); }
        return live;
      } catch (_) {
        const direct = await caches.match(request, { ignoreSearch: true });
        if (direct) return direct;
        const pwaTarget = url.pathname.endsWith('/pwa.html') ? './pwa.html' : './index.html';
        return (await caches.match(pwaTarget)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(request, { ignoreSearch: true });
    if (saved) return saved;
    try {
      const live = await fetch(request);
      if (live.ok || live.type === 'opaque') await cache.put(request, live.clone());
      return live;
    } catch (_) { return new Response('Recurso no disponible sin conexión.', { status: 503 }); }
  })());
});
